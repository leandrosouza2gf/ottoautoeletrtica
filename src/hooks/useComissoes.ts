import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type StatusComissao = Database['public']['Enums']['status_comissao'];

export interface Comissao {
  id: string;
  user_id: string;
  os_id: string | null;
  colaborador_id: string | null;
  valor: number;
  status: StatusComissao;
  created_at: string;
  updated_at: string;
}

export type ComissaoInsert = Omit<Comissao, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ComissaoUpdate = Partial<ComissaoInsert>;

export function useComissoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comissoes = [], isLoading, error } = useQuery({
    queryKey: ['comissoes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('comissoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Comissao[];
    },
    enabled: !!user,
  });

  const addComissao = useMutation({
    mutationFn: async (comissao: ComissaoInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('comissoes')
        .insert({ ...comissao, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão registrada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding comissao:', error);
      toast.error('Erro ao registrar comissão');
    },
  });

  const updateComissao = useMutation({
    mutationFn: async ({ id, ...comissao }: ComissaoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('comissoes')
        .update(comissao)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão atualizada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating comissao:', error);
      toast.error('Erro ao atualizar comissão');
    },
  });

  const deleteComissao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comissoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão excluída com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting comissao:', error);
      toast.error('Erro ao excluir comissão');
    },
  });

  return {
    comissoes,
    isLoading,
    error,
    addComissao: addComissao.mutate,
    updateComissao: updateComissao.mutate,
    deleteComissao: deleteComissao.mutate,
    isAdding: addComissao.isPending,
    isUpdating: updateComissao.isPending,
    isDeleting: deleteComissao.isPending,
  };
}
