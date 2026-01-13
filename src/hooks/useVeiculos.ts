import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Veiculo {
  id: string;
  user_id: string;
  cliente_id: string;
  placa: string;
  modelo: string;
  ano: string;
  problema_informado: string;
  created_at: string;
  updated_at: string;
}

export type VeiculoInsert = Omit<Veiculo, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type VeiculoUpdate = Partial<VeiculoInsert>;

export function useVeiculos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: veiculos = [], isLoading, error } = useQuery({
    queryKey: ['veiculos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .order('placa');
      
      if (error) throw error;
      return data as Veiculo[];
    },
    enabled: !!user,
  });

  const addVeiculo = useMutation({
    mutationFn: async (veiculo: VeiculoInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('veiculos')
        .insert({ ...veiculo, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast.success('Veículo cadastrado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding veiculo:', error);
      toast.error('Erro ao cadastrar veículo');
    },
  });

  const updateVeiculo = useMutation({
    mutationFn: async ({ id, ...veiculo }: VeiculoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('veiculos')
        .update(veiculo)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast.success('Veículo atualizado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating veiculo:', error);
      toast.error('Erro ao atualizar veículo');
    },
  });

  const deleteVeiculo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast.success('Veículo excluído com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting veiculo:', error);
      toast.error('Erro ao excluir veículo');
    },
  });

  return {
    veiculos,
    isLoading,
    error,
    addVeiculo: addVeiculo.mutate,
    updateVeiculo: updateVeiculo.mutate,
    deleteVeiculo: deleteVeiculo.mutate,
    isAdding: addVeiculo.isPending,
    isUpdating: updateVeiculo.isPending,
    isDeleting: deleteVeiculo.isPending,
  };
}
