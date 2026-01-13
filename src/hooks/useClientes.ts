import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  telefone: string;
  documento: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export type ClienteInsert = Omit<Cliente, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ClienteUpdate = Partial<ClienteInsert>;

export function useClientes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading, error } = useQuery({
    queryKey: ['clientes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Cliente[];
    },
    enabled: !!user,
  });

  const addCliente = useMutation({
    mutationFn: async (cliente: ClienteInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding cliente:', error);
      toast.error('Erro ao cadastrar cliente');
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...cliente }: ClienteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating cliente:', error);
      toast.error('Erro ao atualizar cliente');
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting cliente:', error);
      toast.error('Erro ao excluir cliente');
    },
  });

  return {
    clientes,
    isLoading,
    error,
    addCliente: addCliente.mutate,
    updateCliente: updateCliente.mutate,
    deleteCliente: deleteCliente.mutate,
    isAdding: addCliente.isPending,
    isUpdating: updateCliente.isPending,
    isDeleting: deleteCliente.isPending,
  };
}
