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
    const { numero_os, pergunta } = await req.json();

    if (!numero_os || !pergunta) {
      return new Response(
        JSON.stringify({ error: "Número da OS e pergunta são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Chat OS IA - OS: ${numero_os}, Pergunta: ${pergunta}`);

    // Get API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Serviço de IA não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch OS data
    const { data: os, error: osError } = await supabase
      .from("ordens_servico")
      .select("*")
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

    // Fetch related data in parallel
    const [veiculoRes, servicosRes, pecasOSRes, orcamentoRes, relatoriosRes] = await Promise.all([
      supabase.from("veiculos").select("modelo, placa, ano").eq("id", os.veiculo_id).maybeSingle(),
      supabase.from("servicos_os").select("*").eq("ordem_servico_id", os.id).order("data", { ascending: false }),
      supabase.from("pecas_os").select("*, pecas(nome)").eq("ordem_servico_id", os.id),
      supabase.from("orcamentos_os").select("*").eq("ordem_servico_id", os.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("relatorios_atendimento").select("*, colaboradores(nome)").eq("ordem_servico_id", os.id).order("data", { ascending: false }),
    ]);

    // Prepare OS data summary
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

    const servicos = servicosRes.data || [];
    const pecasOS = pecasOSRes.data || [];
    const relatorios = relatoriosRes.data || [];
    const totalMaoObra = servicos.reduce((acc, s) => acc + Number(s.valor_mao_obra || 0), 0);
    const totalPecas = pecasOS.reduce((acc, p) => acc + (Number(p.quantidade) * Number(p.valor_unitario)), 0);

    const osData = {
      numero_os: os.numero_os,
      status: statusLabels[os.status] || os.status,
      data_entrada: new Date(os.data_entrada).toLocaleDateString("pt-BR"),
      veiculo: veiculoRes.data 
        ? `${veiculoRes.data.modelo} ${veiculoRes.data.ano || ""} - Placa ${veiculoRes.data.placa}` 
        : "Não informado",
      defeito_relatado: os.defeito_relatado || "Não informado",
      defeito_identificado: os.defeito_identificado || "Ainda não identificado",
      observacoes_tecnicas: os.observacoes_tecnicas || "Nenhuma observação",
      orcamento: orcamentoRes.data ? {
        valor: `R$ ${Number(orcamentoRes.data.valor_total).toFixed(2).replace(".", ",")}`,
        status: orcamentoStatusLabels[orcamentoRes.data.status] || orcamentoRes.data.status,
        observacoes: orcamentoRes.data.observacoes || "Sem observações",
      } : {
        valor: `R$ ${(totalMaoObra + totalPecas).toFixed(2).replace(".", ",")}`,
        status: "Não formalizado",
        observacoes: null,
      },
      servicos: servicos.map((s) => ({
        descricao: s.descricao,
        valor: `R$ ${Number(s.valor_mao_obra).toFixed(2).replace(".", ",")}`,
      })),
      pecas: pecasOS.map((p) => ({
        nome: p.pecas?.nome || "Peça",
        quantidade: p.quantidade,
        valor: `R$ ${(Number(p.quantidade) * Number(p.valor_unitario)).toFixed(2).replace(".", ",")}`,
      })),
      relatorios: relatorios.slice(0, 5).map((r) => ({
        data: new Date(r.data).toLocaleDateString("pt-BR"),
        funcionario: r.colaboradores?.nome || "Técnico",
        descricao: r.descricao,
      })),
      ultima_atualizacao: new Date(os.updated_at).toLocaleDateString("pt-BR"),
      valor_total: `R$ ${(totalMaoObra + totalPecas).toFixed(2).replace(".", ",")}`,
    };

    // Create system prompt
    const systemPrompt = `Você é um assistente virtual profissional da oficina elétrica automotiva.
Sua ÚNICA função é responder perguntas sobre o status de ordens de serviço.

REGRAS ABSOLUTAS:
1. Responda APENAS com base nos dados fornecidos abaixo
2. NÃO invente informações que não estejam nos dados
3. NÃO sugira diagnósticos, reparos ou soluções técnicas
4. NÃO informe valores que não estejam registrados
5. NÃO dê opiniões sobre procedimentos técnicos
6. Use linguagem profissional, clara e objetiva
7. Foque em status, transparência e informações já cadastradas
8. Se não tiver a informação solicitada, diga que não está disponível no sistema
9. Sempre cite o número da OS na resposta
10. Formate valores monetários em Reais (R$)

DADOS DA ORDEM DE SERVIÇO Nº ${osData.numero_os}:
- Status atual: ${osData.status}
- Data de entrada: ${osData.data_entrada}
- Veículo: ${osData.veiculo}
- Defeito relatado pelo cliente: ${osData.defeito_relatado}
- Defeito identificado pelo técnico: ${osData.defeito_identificado}
- Observações técnicas: ${osData.observacoes_tecnicas}
- Valor total estimado: ${osData.valor_total}
- Última atualização: ${osData.ultima_atualizacao}

ORÇAMENTO:
- Valor: ${osData.orcamento.valor}
- Status: ${osData.orcamento.status}
${osData.orcamento.observacoes ? `- Observações: ${osData.orcamento.observacoes}` : ""}

SERVIÇOS REALIZADOS/PREVISTOS (${osData.servicos.length}):
${osData.servicos.length > 0 
  ? osData.servicos.map((s) => `- ${s.descricao}: ${s.valor}`).join("\n") 
  : "- Nenhum serviço registrado ainda"}

PEÇAS (${osData.pecas.length}):
${osData.pecas.length > 0 
  ? osData.pecas.map((p) => `- ${p.nome} (${p.quantidade}x): ${p.valor}`).join("\n") 
  : "- Nenhuma peça registrada ainda"}

ÚLTIMOS RELATÓRIOS DE ATENDIMENTO:
${osData.relatorios.length > 0 
  ? osData.relatorios.map((r) => `- ${r.data} (${r.funcionario}): ${r.descricao}`).join("\n") 
  : "- Nenhum relatório de atendimento registrado ainda"}

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
          JSON.stringify({ error: "Muitas solicitações. Por favor, aguarde alguns segundos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível. Tente novamente mais tarde." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback response with basic info
      const fallbackResponse = `A Ordem de Serviço nº ${osData.numero_os} está atualmente com status: ${osData.status}.

📋 Diagnóstico: ${osData.defeito_identificado}

💰 Orçamento: ${osData.orcamento.valor} - ${osData.orcamento.status}

📅 Última atualização: ${osData.ultima_atualizacao}

${osData.relatorios.length > 0 ? `📝 Último relatório: ${osData.relatorios[0].descricao}` : ""}`;

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
      JSON.stringify({ error: "Erro ao processar sua solicitação. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
