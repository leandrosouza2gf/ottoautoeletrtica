import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Fornecedor {
  id: string;
  user_id: string;
  nome: string;
  telefone: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export type FornecedorInsert = Omit<Fornecedor, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type FornecedorUpdate = Partial<FornecedorInsert>;

export function useFornecedores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: fornecedores = [], isLoading, error } = useQuery({
    queryKey: ['fornecedores', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Fornecedor[];
    },
    enabled: !!user,
  });

  const addFornecedor = useMutation({
    mutationFn: async (fornecedor: FornecedorInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor cadastrado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding fornecedor:', error);
      toast.error('Erro ao cadastrar fornecedor');
    },
  });

  const updateFornecedor = useMutation({
    mutationFn: async ({ id, ...fornecedor }: FornecedorUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .update(fornecedor)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating fornecedor:', error);
      toast.error('Erro ao atualizar fornecedor');
    },
  });

  const deleteFornecedor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting fornecedor:', error);
      toast.error('Erro ao excluir fornecedor');
    },
  });

  return {
    fornecedores,
    isLoading,
    error,
    addFornecedor: addFornecedor.mutate,
    updateFornecedor: updateFornecedor.mutate,
    deleteFornecedor: deleteFornecedor.mutate,
    isAdding: addFornecedor.isPending,
    isUpdating: updateFornecedor.isPending,
    isDeleting: deleteFornecedor.isPending,
  };
}
