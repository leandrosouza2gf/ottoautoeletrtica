import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OSPublica {
  numero_os: number;
  data_entrada: string;
  status: string;
  status_key: string;
  veiculo: {
    modelo: string;
    placa: string;
    ano: string | null;
  } | null;
  diagnostico: {
    defeito_relatado: string;
    defeito_identificado: string | null;
    observacoes_tecnicas: string | null;
  };
  orcamento: {
    valor_total: number;
    status: string;
    status_key: string | null;
    observacoes: string | null;
  };
  servicos: Array<{
    descricao: string;
    valor: number;
    data: string;
  }>;
  pecas: Array<{
    nome: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
  relatorios: Array<{
    data: string;
    funcionario: string;
    descricao: string;
  }>;
  totais: {
    mao_obra: number;
    pecas: number;
    total: number;
  };
  ultima_atualizacao: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useStatusOS() {
  const [os, setOS] = useState<OSPublica | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const consultarOS = async (numeroOS: number, token?: string) => {
    setIsLoading(true);
    setError(null);
    setOS(null);
    setMessages([]);
    setAccessToken(token || null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('consultar-os-publica', {
        body: { numero_os: numeroOS, access_token: token },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        setError(data.error);
        toast.error(data.error);
        return null;
      }

      setOS(data);
      
      // Add welcome message
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Olá! Encontrei a OS nº ${data.numero_os}. Como posso ajudar? Você pode me perguntar sobre o status ou andamento do serviço.`,
        timestamp: new Date(),
      }]);

      return data;
    } catch (err) {
      const errorMsg = 'Erro ao consultar OS. Verifique o número e tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const enviarPergunta = async (pergunta: string) => {
    if (!os) {
      toast.error('Consulte uma OS primeiro');
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: pergunta,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chat-os-ia', {
        body: { numero_os: os.numero_os, pergunta, access_token: accessToken },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.resposta,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error('Erro ao processar sua pergunta. Tente novamente.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const limpar = () => {
    setOS(null);
    setError(null);
    setMessages([]);
  };

  return {
    os,
    isLoading,
    error,
    messages,
    isChatLoading,
    accessToken,
    consultarOS,
    enviarPergunta,
    limpar,
  };
}
