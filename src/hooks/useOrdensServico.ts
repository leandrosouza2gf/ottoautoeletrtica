import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type StatusOS = Database['public']['Enums']['status_os'];

export interface ServicoOS {
  id: string;
  user_id: string;
  ordem_servico_id: string;
  descricao: string;
  valor_mao_obra: number;
  data: string;
  created_at: string;
}

export interface PecaOS {
  id: string;
  user_id: string;
  ordem_servico_id: string;
  peca_id: string | null;
  quantidade: number;
  valor_unitario: number;
  created_at: string;
}

export interface OrcamentoOS {
  id: string;
  user_id: string;
  ordem_servico_id: string;
  valor_total: number;
  status: 'aguardando' | 'aprovado' | 'reprovado';
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface RelatorioAtendimento {
  id: string;
  user_id: string;
  ordem_servico_id: string;
  funcionario_id: string | null;
  descricao: string;
  data: string;
  created_at: string;
}

export interface OrdemServico {
  id: string;
  user_id: string;
  numero_os: number;
  cliente_id: string;
  veiculo_id: string;
  tecnico_id: string | null;
  data_entrada: string;
  defeito_relatado: string;
  status: StatusOS;
  defeito_identificado: string;
  observacoes_tecnicas: string;
  created_at: string;
  updated_at: string;
  servicos?: ServicoOS[];
  pecas?: PecaOS[];
  orcamento?: OrcamentoOS | null;
  relatorios?: RelatorioAtendimento[];
}

export type OrdemServicoInsert = Pick<OrdemServico, 'cliente_id' | 'veiculo_id' | 'defeito_relatado'>;
export type OrdemServicoUpdate = Partial<Omit<OrdemServico, 'id' | 'user_id' | 'numero_os' | 'created_at' | 'updated_at' | 'servicos' | 'pecas' | 'orcamento' | 'relatorios'>>;

export function useOrdensServico() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ordensServico = [], isLoading, error } = useQuery({
    queryKey: ['ordensServico', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: ordens, error: ordensError } = await supabase
        .from('ordens_servico')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordensError) throw ordensError;
      
      // Fetch services, parts, orcamentos, and relatorios for each order
      const ordensWithDetails = await Promise.all(
        (ordens || []).map(async (os) => {
          const [servicosRes, pecasRes, orcamentoRes, relatoriosRes] = await Promise.all([
            supabase.from('servicos_os').select('*').eq('ordem_servico_id', os.id),
            supabase.from('pecas_os').select('*').eq('ordem_servico_id', os.id),
            supabase.from('orcamentos_os').select('*').eq('ordem_servico_id', os.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('relatorios_atendimento').select('*').eq('ordem_servico_id', os.id).order('data', { ascending: false }),
          ]);
          
          return {
            ...os,
            servicos: servicosRes.data || [],
            pecas: pecasRes.data || [],
            orcamento: orcamentoRes.data || null,
            relatorios: relatoriosRes.data || [],
          };
        })
      );
      
      return ordensWithDetails as OrdemServico[];
    },
    enabled: !!user,
  });

  const addOS = useMutation({
    mutationFn: async (os: OrdemServicoInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('ordens_servico')
        .insert({ 
          ...os, 
          user_id: user.id,
          status: 'aguardando_diagnostico' as StatusOS,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast.success('OS criada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding OS:', error);
      toast.error('Erro ao criar OS');
    },
  });

  const updateOS = useMutation({
    mutationFn: async ({ id, ...os }: OrdemServicoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .update(os)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast.success('OS atualizada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating OS:', error);
      toast.error('Erro ao atualizar OS');
    },
  });

  const deleteOS = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ordens_servico')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast.success('OS excluída com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting OS:', error);
      toast.error('Erro ao excluir OS');
    },
  });

  // Service CRUD
  const addServico = useMutation({
    mutationFn: async (servico: { ordem_servico_id: string; descricao: string; valor_mao_obra: number }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('servicos_os')
        .insert({ ...servico, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding servico:', error);
      toast.error('Erro ao adicionar serviço');
    },
  });

  const deleteServico = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('servicos_os')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting servico:', error);
      toast.error('Erro ao remover serviço');
    },
  });

  // Parts CRUD
  const addPecaOS = useMutation({
    mutationFn: async (peca: { ordem_servico_id: string; peca_id: string | null; quantidade: number; valor_unitario: number }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('pecas_os')
        .insert({ ...peca, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding peca to OS:', error);
      toast.error('Erro ao adicionar peça');
    },
  });

  const deletePecaOS = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pecas_os')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting peca from OS:', error);
      toast.error('Erro ao remover peça');
    },
  });

  // Orcamento CRUD
  const addOrcamento = useMutation({
    mutationFn: async (orcamento: { ordem_servico_id: string; valor_total: number; status?: string; observacoes?: string }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('orcamentos_os')
        .insert({ 
          ...orcamento, 
          user_id: user.id,
          status: orcamento.status || 'aguardando',
          observacoes: orcamento.observacoes || '',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast.success('Orçamento criado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding orcamento:', error);
      toast.error('Erro ao criar orçamento');
    },
  });

  const updateOrcamento = useMutation({
    mutationFn: async ({ id, ...orcamento }: { id: string; valor_total?: number; status?: string; observacoes?: string }) => {
      const { data, error } = await supabase
        .from('orcamentos_os')
        .update(orcamento)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast.success('Orçamento atualizado!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating orcamento:', error);
      toast.error('Erro ao atualizar orçamento');
    },
  });

  // Relatorio CRUD
  const addRelatorio = useMutation({
    mutationFn: async (relatorio: { ordem_servico_id: string; funcionario_id?: string | null; descricao: string }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('relatorios_atendimento')
        .insert({ 
          ...relatorio, 
          user_id: user.id,
          funcionario_id: relatorio.funcionario_id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
      toast.success('Relatório adicionado!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding relatorio:', error);
      toast.error('Erro ao adicionar relatório');
    },
  });

  const deleteRelatorio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('relatorios_atendimento')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordensServico'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting relatorio:', error);
      toast.error('Erro ao remover relatório');
    },
  });

  return {
    ordensServico,
    isLoading,
    error,
    addOS: addOS.mutate,
    updateOS: updateOS.mutate,
    deleteOS: deleteOS.mutate,
    addServico: addServico.mutate,
    deleteServico: deleteServico.mutate,
    addPecaOS: addPecaOS.mutate,
    deletePecaOS: deletePecaOS.mutate,
    addOrcamento: addOrcamento.mutate,
    updateOrcamento: updateOrcamento.mutate,
    addRelatorio: addRelatorio.mutate,
    deleteRelatorio: deleteRelatorio.mutate,
    isAdding: addOS.isPending,
    isUpdating: updateOS.isPending,
    isDeleting: deleteOS.isPending,
  };
}
