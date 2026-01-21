import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 5; // requests per minute (more restrictive for AI endpoint)
const RATE_WINDOW = 60000;

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
    const { numero_os, pergunta, access_token } = await req.json();

    if (!numero_os || !pergunta) {
      return new Response(
        JSON.stringify({ error: "Número da OS e pergunta são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate pergunta length to prevent abuse
    if (pergunta.length > 500) {
      return new Response(
        JSON.stringify({ error: "Pergunta muito longa. Máximo 500 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Chat OS IA - OS: ${numero_os}`);

    // Get API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Serviço temporariamente indisponível" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch OS data (minimal fields)
    const { data: os, error: osError } = await supabase
      .from("ordens_servico")
      .select("id, numero_os, data_entrada, status, veiculo_id, defeito_relatado, defeito_identificado, observacoes_tecnicas, updated_at, access_token")
      .eq("numero_os", numero_os)
      .maybeSingle();

    if (osError || !os) {
      console.log("OS não encontrada:", osError);
      return new Response(
        JSON.stringify({ 
          resposta: `Não encontrei nenhuma Ordem de Serviço com o número ${numero_os}. Por favor, verifique o número e tente novamente.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate access token
    const hasValidToken = access_token && os.access_token === access_token;

    // Fetch vehicle data only
    const { data: veiculo } = await supabase
      .from("veiculos")
      .select("modelo, ano")
      .eq("id", os.veiculo_id)
      .maybeSingle();

    // Prepare minimal OS data summary (no pricing, no employee names)
    const statusLabels: Record<string, string> = {
      aguardando_diagnostico: "Em Diagnóstico",
      em_conserto: "Em Execução",
      aguardando_peca: "Aguardando Peça",
      concluido: "Concluída",
      entregue: "Entregue",
    };

    // Fetch additional data only if token is valid
    let servicosDescriptions: string[] = [];
    let relatoriosDescriptions: string[] = [];
    let orcamentoStatus = "Não informado";

    if (hasValidToken) {
      const [servicosRes, relatoriosRes, orcamentoRes] = await Promise.all([
        supabase.from("servicos_os").select("descricao").eq("ordem_servico_id", os.id).order("data", { ascending: false }).limit(5),
        supabase.from("relatorios_atendimento").select("data, descricao").eq("ordem_servico_id", os.id).order("data", { ascending: false }).limit(3),
        supabase.from("orcamentos_os").select("status").eq("ordem_servico_id", os.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      servicosDescriptions = (servicosRes.data || []).map(s => s.descricao);
      relatoriosDescriptions = (relatoriosRes.data || []).map(r => 
        `${new Date(r.data).toLocaleDateString("pt-BR")}: ${r.descricao}`
      );
      
      const orcamentoStatusLabels: Record<string, string> = {
        aguardando: "Aguardando Aprovação",
        aprovado: "Aprovado",
        reprovado: "Reprovado",
      };
      orcamentoStatus = orcamentoRes.data 
        ? orcamentoStatusLabels[orcamentoRes.data.status] || orcamentoRes.data.status
        : "Não formalizado";
    }

    // Create system prompt (no pricing data, no employee names)
    const systemPrompt = `Você é um assistente virtual profissional da oficina elétrica automotiva.
Sua ÚNICA função é responder perguntas sobre o status de ordens de serviço.

REGRAS ABSOLUTAS:
1. Responda APENAS com base nos dados fornecidos abaixo
2. NÃO invente informações que não estejam nos dados
3. NÃO sugira diagnósticos, reparos ou soluções técnicas
4. NÃO informe valores ou preços - diga que essa informação não está disponível
5. NÃO dê opiniões sobre procedimentos técnicos
6. Use linguagem profissional, clara e objetiva
7. Foque em status, transparência e informações já cadastradas
8. Se não tiver a informação solicitada, diga que não está disponível
9. Sempre cite o número da OS na resposta

DADOS DA ORDEM DE SERVIÇO Nº ${os.numero_os}:
- Status atual: ${statusLabels[os.status] || os.status}
- Data de entrada: ${new Date(os.data_entrada).toLocaleDateString("pt-BR")}
- Veículo: ${veiculo ? `${veiculo.modelo} ${veiculo.ano || ""}` : "Não informado"}
- Defeito relatado pelo cliente: ${os.defeito_relatado || "Não informado"}
${hasValidToken ? `- Defeito identificado pelo técnico: ${os.defeito_identificado || "Ainda não identificado"}
- Observações técnicas: ${os.observacoes_tecnicas || "Nenhuma observação"}` : ""}
- Última atualização: ${new Date(os.updated_at).toLocaleDateString("pt-BR")}
${hasValidToken && orcamentoStatus ? `
ORÇAMENTO:
- Status: ${orcamentoStatus}
- Nota: Valores não são exibidos por segurança` : ""}
${hasValidToken && servicosDescriptions.length > 0 ? `
SERVIÇOS EM ANDAMENTO:
${servicosDescriptions.map(s => `- ${s}`).join("\n")}` : ""}
${hasValidToken && relatoriosDescriptions.length > 0 ? `
ÚLTIMAS ATUALIZAÇÕES:
${relatoriosDescriptions.map(r => `- ${r}`).join("\n")}` : ""}

IMPORTANTE: Valores financeiros não estão disponíveis para consulta pública. Para informações sobre preços, o cliente deve entrar em contato diretamente com a oficina.

Responda à pergunta do cliente de forma clara, profissional e baseada APENAS nos dados acima.`;

    console.log("Enviando para Lovable AI...");

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: pergunta },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("Erro Lovable AI:", status);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas solicitações. Aguarde alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Fallback response with basic info (no pricing)
      const fallbackResponse = `A Ordem de Serviço nº ${os.numero_os} está atualmente com status: ${statusLabels[os.status] || os.status}.

📅 Data de entrada: ${new Date(os.data_entrada).toLocaleDateString("pt-BR")}
🚗 Veículo: ${veiculo ? `${veiculo.modelo} ${veiculo.ano || ""}` : "Não informado"}

📅 Última atualização: ${new Date(os.updated_at).toLocaleDateString("pt-BR")}

Para mais informações, entre em contato conosco.`;

      return new Response(
        JSON.stringify({ resposta: fallbackResponse }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const resposta = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta. Tente novamente.";

    console.log("Resposta da IA recebida com sucesso");

    return new Response(
      JSON.stringify({ resposta }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na função chat-os-ia:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar solicitação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
