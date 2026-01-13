import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Peca {
  id: string;
  user_id: string;
  fornecedor_id: string | null;
  nome: string;
  valor_custo: number;
  created_at: string;
  updated_at: string;
}

export type PecaInsert = Omit<Peca, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type PecaUpdate = Partial<PecaInsert>;

export function usePecas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pecas = [], isLoading, error } = useQuery({
    queryKey: ['pecas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pecas')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Peca[];
    },
    enabled: !!user,
  });

  const addPeca = useMutation({
    mutationFn: async (peca: PecaInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('pecas')
        .insert({ ...peca, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Peça cadastrada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding peca:', error);
      toast.error('Erro ao cadastrar peça');
    },
  });

  const updatePeca = useMutation({
    mutationFn: async ({ id, ...peca }: PecaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('pecas')
        .update(peca)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Peça atualizada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating peca:', error);
      toast.error('Erro ao atualizar peça');
    },
  });

  const deletePeca = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pecas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Peça excluída com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting peca:', error);
      toast.error('Erro ao excluir peça');
    },
  });

  return {
    pecas,
    isLoading,
    error,
    addPeca: addPeca.mutate,
    updatePeca: updatePeca.mutate,
    deletePeca: deletePeca.mutate,
    isAdding: addPeca.isPending,
    isUpdating: updatePeca.isPending,
    isDeleting: deletePeca.isPending,
  };
}
