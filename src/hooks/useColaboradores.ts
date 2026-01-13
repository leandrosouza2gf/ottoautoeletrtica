import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TipoComissao = Database['public']['Enums']['tipo_comissao'];

export interface Colaborador {
  id: string;
  user_id: string;
  nome: string;
  funcao: string;
  tipo_comissao: TipoComissao;
  valor_comissao: number;
  created_at: string;
  updated_at: string;
}

export type ColaboradorInsert = Omit<Colaborador, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ColaboradorUpdate = Partial<ColaboradorInsert>;

export function useColaboradores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: colaboradores = [], isLoading, error } = useQuery({
    queryKey: ['colaboradores', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Colaborador[];
    },
    enabled: !!user,
  });

  const addColaborador = useMutation({
    mutationFn: async (colaborador: ColaboradorInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('colaboradores')
        .insert({ ...colaborador, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador cadastrado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding colaborador:', error);
      toast.error('Erro ao cadastrar colaborador');
    },
  });

  const updateColaborador = useMutation({
    mutationFn: async ({ id, ...colaborador }: ColaboradorUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('colaboradores')
        .update(colaborador)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador atualizado com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating colaborador:', error);
      toast.error('Erro ao atualizar colaborador');
    },
  });

  const deleteColaborador = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador excluído com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting colaborador:', error);
      toast.error('Erro ao excluir colaborador');
    },
  });

  return {
    colaboradores,
    isLoading,
    error,
    addColaborador: addColaborador.mutate,
    updateColaborador: updateColaborador.mutate,
    deleteColaborador: deleteColaborador.mutate,
    isAdding: addColaborador.isPending,
    isUpdating: updateColaborador.isPending,
    isDeleting: deleteColaborador.isPending,
  };
}
