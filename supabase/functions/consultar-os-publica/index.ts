import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: store request counts in memory (per-instance)
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || (now - record.timestamp) > RATE_WINDOW) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

// Função para mascarar placa parcialmente (ex: ABC-1234 -> ABC-**34)
function maskPlaca(placa: string): string {
  if (!placa) return '';
  
  const cleanPlaca = placa.trim().toUpperCase();
  
  if (cleanPlaca.length >= 7) {
    const inicio = cleanPlaca.substring(0, 3);
    const final = cleanPlaca.substring(cleanPlaca.length - 2);
    const meio = '*'.repeat(cleanPlaca.length - 5);
    
    if (cleanPlaca.includes('-')) {
      return `${inicio}-${meio}${final}`;
    }
    return `${inicio}${meio}${final}`;
  }
  
  return cleanPlaca;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";

  // Check rate limit
  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { numero_os, access_token } = await req.json();

    if (!numero_os) {
      return new Response(
        JSON.stringify({ error: "Número da OS é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Consultando OS número: ${numero_os}`);

    // Create Supabase client with service role for internal access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log access attempt
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    // Fetch OS by numero_os
    const { data: os, error: osError } = await supabase
      .from("ordens_servico")
      .select("id, numero_os, data_entrada, status, veiculo_id, defeito_relatado, defeito_identificado, observacoes_tecnicas, updated_at, access_token")
      .eq("numero_os", numero_os)
      .maybeSingle();

    if (osError) {
      console.error("Erro ao buscar OS:", osError);
      await logAccess(supabase, numero_os, clientIP, userAgent, false);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar OS" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!os) {
      await logAccess(supabase, numero_os, clientIP, userAgent, false);
      return new Response(
        JSON.stringify({ error: "OS não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate access token if provided, or check if public access is allowed
    const hasValidToken = access_token && os.access_token === access_token;
    
    console.log(`OS encontrada: ${os.id}, token válido: ${hasValidToken}`);
    await logAccess(supabase, numero_os, clientIP, userAgent, true);

    // Fetch vehicle data only (minimal data for public access)
    const { data: veiculo } = await supabase
      .from("veiculos")
      .select("modelo, placa, ano")
      .eq("id", os.veiculo_id)
      .maybeSingle();

    // Map status to friendly labels
    const statusLabels: Record<string, string> = {
      aguardando_diagnostico: "Em Diagnóstico",
      em_conserto: "Em Execução",
      aguardando_peca: "Aguardando Peça",
      concluido: "Concluída",
      entregue: "Entregue",
    };

    // Basic response (without pricing - always public)
    const basicResponse = {
      numero_os: os.numero_os,
      data_entrada: os.data_entrada,
      status: statusLabels[os.status] || os.status,
      status_key: os.status,
      veiculo: veiculo ? {
        modelo: veiculo.modelo,
        placa: maskPlaca(veiculo.placa),
        ano: veiculo.ano,
      } : null,
      diagnostico: {
        defeito_relatado: os.defeito_relatado,
        // Only show identified defect if token is valid
        defeito_identificado: hasValidToken ? (os.defeito_identificado || null) : null,
        observacoes_tecnicas: hasValidToken ? (os.observacoes_tecnicas || null) : null,
      },
      ultima_atualizacao: os.updated_at,
    };

    // If valid token provided, include additional data (but still no pricing)
    if (hasValidToken) {
      // Fetch related data for authenticated access
      const [servicosRes, pecasOSRes, orcamentoRes, relatoriosRes] = await Promise.all([
        supabase.from("servicos_os").select("descricao, data").eq("ordem_servico_id", os.id).order("data", { ascending: false }),
        supabase.from("pecas_os").select("quantidade, pecas(nome)").eq("ordem_servico_id", os.id),
        supabase.from("orcamentos_os").select("status, observacoes").eq("ordem_servico_id", os.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("relatorios_atendimento").select("data, descricao").eq("ordem_servico_id", os.id).order("data", { ascending: false }).limit(5),
      ]);

      const orcamentoStatusLabels: Record<string, string> = {
        aguardando: "Aguardando Aprovação",
        aprovado: "Aprovado",
        reprovado: "Reprovado",
      };

      const servicos = servicosRes.data || [];
      const pecasOS = pecasOSRes.data || [];
      const relatorios = relatoriosRes.data || [];

      const extendedResponse = {
        ...basicResponse,
        orcamento: orcamentoRes.data ? {
          status: orcamentoStatusLabels[orcamentoRes.data.status] || orcamentoRes.data.status,
          status_key: orcamentoRes.data.status,
          observacoes: orcamentoRes.data.observacoes,
          // No pricing values exposed
        } : {
          status: "Não formalizado",
          status_key: null,
          observacoes: null,
        },
        servicos: servicos.map((s) => ({
          descricao: s.descricao,
          data: s.data,
          // No values exposed
        })),
        pecas: pecasOS.map((p: any) => ({
          nome: p.pecas?.nome || "Peça",
          quantidade: p.quantidade,
          // No values exposed
        })),
        relatorios: relatorios.map((r) => ({
          data: r.data,
          descricao: r.descricao,
          // No employee names exposed
        })),
      };

      console.log("Resposta completa preparada (com token)");
      return new Response(JSON.stringify(extendedResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Resposta básica preparada (sem token)");
    return new Response(JSON.stringify(basicResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar solicitação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function logAccess(
  supabase: any, 
  numero_os: number, 
  ip_address: string, 
  user_agent: string, 
  success: boolean
) {
  try {
    await supabase.from("os_access_logs").insert({
      numero_os,
      ip_address,
      user_agent,
      success,
    });
  } catch (e) {
    console.error("Failed to log access:", e);
  }
}
