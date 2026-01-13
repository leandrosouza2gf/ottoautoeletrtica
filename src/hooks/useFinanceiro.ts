import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FormaPagamento = Database['public']['Enums']['forma_pagamento'];
type StatusPagamento = Database['public']['Enums']['status_pagamento'];
type TipoDespesa = Database['public']['Enums']['tipo_despesa'];

export interface Entrada {
  id: string;
  user_id: string;
  os_id: string | null;
  valor: number;
  forma_pagamento: FormaPagamento;
  data: string;
  status: StatusPagamento;
  created_at: string;
  updated_at: string;
}

export interface Saida {
  id: string;
  user_id: string;
  tipo: TipoDespesa;
  valor: number;
  forma_pagamento: FormaPagamento;
  data: string;
  observacao: string;
  created_at: string;
  updated_at: string;
}

export type EntradaInsert = Omit<Entrada, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type EntradaUpdate = Partial<EntradaInsert>;
export type SaidaInsert = Omit<Saida, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type SaidaUpdate = Partial<SaidaInsert>;

export function useFinanceiro() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entradas = [], isLoading: isLoadingEntradas } = useQuery({
    queryKey: ['entradas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('entradas')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as Entrada[];
    },
    enabled: !!user,
  });

  const { data: saidas = [], isLoading: isLoadingSaidas } = useQuery({
    queryKey: ['saidas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saidas')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as Saida[];
    },
    enabled: !!user,
  });

  // Entradas mutations
  const addEntrada = useMutation({
    mutationFn: async (entrada: EntradaInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('entradas')
        .insert({ ...entrada, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas'] });
      toast.success('Entrada registrada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding entrada:', error);
      toast.error('Erro ao registrar entrada');
    },
  });

  const updateEntrada = useMutation({
    mutationFn: async ({ id, ...entrada }: EntradaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('entradas')
        .update(entrada)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas'] });
      toast.success('Entrada atualizada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating entrada:', error);
      toast.error('Erro ao atualizar entrada');
    },
  });

  const deleteEntrada = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('entradas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas'] });
      toast.success('Entrada excluída com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting entrada:', error);
      toast.error('Erro ao excluir entrada');
    },
  });

  // Saidas mutations
  const addSaida = useMutation({
    mutationFn: async (saida: SaidaInsert) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('saidas')
        .insert({ ...saida, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saidas'] });
      toast.success('Saída registrada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error adding saida:', error);
      toast.error('Erro ao registrar saída');
    },
  });

  const updateSaida = useMutation({
    mutationFn: async ({ id, ...saida }: SaidaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('saidas')
        .update(saida)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saidas'] });
      toast.success('Saída atualizada com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error updating saida:', error);
      toast.error('Erro ao atualizar saída');
    },
  });

  const deleteSaida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saidas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saidas'] });
      toast.success('Saída excluída com sucesso!');
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error deleting saida:', error);
      toast.error('Erro ao excluir saída');
    },
  });

  return {
    entradas,
    saidas,
    isLoading: isLoadingEntradas || isLoadingSaidas,
    addEntrada: addEntrada.mutate,
    updateEntrada: updateEntrada.mutate,
    deleteEntrada: deleteEntrada.mutate,
    addSaida: addSaida.mutate,
    updateSaida: updateSaida.mutate,
    deleteSaida: deleteSaida.mutate,
  };
}
