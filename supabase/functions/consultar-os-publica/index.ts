import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { numero_os } = await req.json();

    if (!numero_os) {
      return new Response(
        JSON.stringify({ error: "Número da OS é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Consultando OS número: ${numero_os}`);

    // Create Supabase client with service role for public access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch OS by numero_os
    const { data: os, error: osError } = await supabase
      .from("ordens_servico")
      .select("*")
      .eq("numero_os", numero_os)
      .maybeSingle();

    if (osError) {
      console.error("Erro ao buscar OS:", osError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar OS" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!os) {
      return new Response(
        JSON.stringify({ error: "OS não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OS encontrada: ${os.id}`);

    // Fetch related data in parallel
    const [veiculoRes, servicosRes, pecasOSRes, orcamentoRes, relatoriosRes] = await Promise.all([
      supabase.from("veiculos").select("modelo, placa, ano").eq("id", os.veiculo_id).maybeSingle(),
      supabase.from("servicos_os").select("*").eq("ordem_servico_id", os.id).order("data", { ascending: false }),
      supabase.from("pecas_os").select("*, pecas(nome)").eq("ordem_servico_id", os.id),
      supabase.from("orcamentos_os").select("*").eq("ordem_servico_id", os.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("relatorios_atendimento").select("*, colaboradores(nome)").eq("ordem_servico_id", os.id).order("data", { ascending: false }),
    ]);

    // Map status to friendly labels
    const statusLabels: Record<string, string> = {
      aguardando_diagnostico: "Em Diagnóstico",
      em_conserto: "Em Execução",
      aguardando_peca: "Aguardando Peça",
      concluido: "Concluída",
      entregue: "Entregue",
    };

    const orcamentoStatusLabels: Record<string, string> = {
      aguardando: "Aguardando Aprovação",
      aprovado: "Aprovado",
      reprovado: "Reprovado",
    };

    // Calculate totals
    const servicos = servicosRes.data || [];
    const pecasOS = pecasOSRes.data || [];
    const totalMaoObra = servicos.reduce((acc, s) => acc + Number(s.valor_mao_obra || 0), 0);
    const totalPecas = pecasOS.reduce((acc, p) => acc + (Number(p.quantidade) * Number(p.valor_unitario)), 0);

    const response = {
      numero_os: os.numero_os,
      data_entrada: os.data_entrada,
      status: statusLabels[os.status] || os.status,
      status_key: os.status,
      veiculo: veiculoRes.data ? {
        modelo: veiculoRes.data.modelo,
        placa: veiculoRes.data.placa,
        ano: veiculoRes.data.ano,
      } : null,
      diagnostico: {
        defeito_relatado: os.defeito_relatado,
        defeito_identificado: os.defeito_identificado || null,
        observacoes_tecnicas: os.observacoes_tecnicas || null,
      },
      orcamento: orcamentoRes.data ? {
        valor_total: orcamentoRes.data.valor_total,
        status: orcamentoStatusLabels[orcamentoRes.data.status] || orcamentoRes.data.status,
        status_key: orcamentoRes.data.status,
        observacoes: orcamentoRes.data.observacoes,
      } : {
        valor_total: totalMaoObra + totalPecas,
        status: "Não formalizado",
        status_key: null,
        observacoes: null,
      },
      servicos: servicos.map((s) => ({
        descricao: s.descricao,
        valor: s.valor_mao_obra,
        data: s.data,
      })),
      pecas: pecasOS.map((p) => ({
        nome: p.pecas?.nome || "Peça não identificada",
        quantidade: p.quantidade,
        valor_unitario: p.valor_unitario,
        valor_total: p.quantidade * p.valor_unitario,
      })),
      relatorios: (relatoriosRes.data || []).map((r) => ({
        data: r.data,
        funcionario: r.colaboradores?.nome || "Técnico",
        descricao: r.descricao,
      })),
      totais: {
        mao_obra: totalMaoObra,
        pecas: totalPecas,
        total: totalMaoObra + totalPecas,
      },
      ultima_atualizacao: os.updated_at,
    };

    console.log("Resposta preparada com sucesso");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
