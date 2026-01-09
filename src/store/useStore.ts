import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Cliente, 
  Veiculo, 
  Colaborador, 
  Fornecedor, 
  Peca, 
  OrdemServico, 
  Entrada, 
  Saida, 
  Comissao 
} from '@/types';

interface AppState {
  clientes: Cliente[];
  veiculos: Veiculo[];
  colaboradores: Colaborador[];
  fornecedores: Fornecedor[];
  pecas: Peca[];
  ordensServico: OrdemServico[];
  entradas: Entrada[];
  saidas: Saida[];
  comissoes: Comissao[];

  // Clientes
  addCliente: (cliente: Cliente) => void;
  updateCliente: (id: string, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  // Veículos
  addVeiculo: (veiculo: Veiculo) => void;
  updateVeiculo: (id: string, veiculo: Partial<Veiculo>) => void;
  deleteVeiculo: (id: string) => void;

  // Colaboradores
  addColaborador: (colaborador: Colaborador) => void;
  updateColaborador: (id: string, colaborador: Partial<Colaborador>) => void;
  deleteColaborador: (id: string) => void;

  // Fornecedores
  addFornecedor: (fornecedor: Fornecedor) => void;
  updateFornecedor: (id: string, fornecedor: Partial<Fornecedor>) => void;
  deleteFornecedor: (id: string) => void;

  // Peças
  addPeca: (peca: Peca) => void;
  updatePeca: (id: string, peca: Partial<Peca>) => void;
  deletePeca: (id: string) => void;

  // Ordens de Serviço
  addOS: (os: OrdemServico) => void;
  updateOS: (id: string, os: Partial<OrdemServico>) => void;
  deleteOS: (id: string) => void;

  // Financeiro
  addEntrada: (entrada: Entrada) => void;
  updateEntrada: (id: string, entrada: Partial<Entrada>) => void;
  deleteEntrada: (id: string) => void;

  addSaida: (saida: Saida) => void;
  updateSaida: (id: string, saida: Partial<Saida>) => void;
  deleteSaida: (id: string) => void;

  // Comissões
  addComissao: (comissao: Comissao) => void;
  updateComissao: (id: string, comissao: Partial<Comissao>) => void;
  deleteComissao: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      clientes: [],
      veiculos: [],
      colaboradores: [],
      fornecedores: [],
      pecas: [],
      ordensServico: [],
      entradas: [],
      saidas: [],
      comissoes: [],

      // Clientes
      addCliente: (cliente) => set((state) => ({ clientes: [...state.clientes, cliente] })),
      updateCliente: (id, cliente) => set((state) => ({
        clientes: state.clientes.map((c) => (c.id === id ? { ...c, ...cliente } : c)),
      })),
      deleteCliente: (id) => set((state) => ({ clientes: state.clientes.filter((c) => c.id !== id) })),

      // Veículos
      addVeiculo: (veiculo) => set((state) => ({ veiculos: [...state.veiculos, veiculo] })),
      updateVeiculo: (id, veiculo) => set((state) => ({
        veiculos: state.veiculos.map((v) => (v.id === id ? { ...v, ...veiculo } : v)),
      })),
      deleteVeiculo: (id) => set((state) => ({ veiculos: state.veiculos.filter((v) => v.id !== id) })),

      // Colaboradores
      addColaborador: (colaborador) => set((state) => ({ colaboradores: [...state.colaboradores, colaborador] })),
      updateColaborador: (id, colaborador) => set((state) => ({
        colaboradores: state.colaboradores.map((c) => (c.id === id ? { ...c, ...colaborador } : c)),
      })),
      deleteColaborador: (id) => set((state) => ({ colaboradores: state.colaboradores.filter((c) => c.id !== id) })),

      // Fornecedores
      addFornecedor: (fornecedor) => set((state) => ({ fornecedores: [...state.fornecedores, fornecedor] })),
      updateFornecedor: (id, fornecedor) => set((state) => ({
        fornecedores: state.fornecedores.map((f) => (f.id === id ? { ...f, ...fornecedor } : f)),
      })),
      deleteFornecedor: (id) => set((state) => ({ fornecedores: state.fornecedores.filter((f) => f.id !== id) })),

      // Peças
      addPeca: (peca) => set((state) => ({ pecas: [...state.pecas, peca] })),
      updatePeca: (id, peca) => set((state) => ({
        pecas: state.pecas.map((p) => (p.id === id ? { ...p, ...peca } : p)),
      })),
      deletePeca: (id) => set((state) => ({ pecas: state.pecas.filter((p) => p.id !== id) })),

      // Ordens de Serviço
      addOS: (os) => set((state) => ({ ordensServico: [...state.ordensServico, os] })),
      updateOS: (id, os) => set((state) => ({
        ordensServico: state.ordensServico.map((o) => (o.id === id ? { ...o, ...os } : o)),
      })),
      deleteOS: (id) => set((state) => ({ ordensServico: state.ordensServico.filter((o) => o.id !== id) })),

      // Entradas
      addEntrada: (entrada) => set((state) => ({ entradas: [...state.entradas, entrada] })),
      updateEntrada: (id, entrada) => set((state) => ({
        entradas: state.entradas.map((e) => (e.id === id ? { ...e, ...entrada } : e)),
      })),
      deleteEntrada: (id) => set((state) => ({ entradas: state.entradas.filter((e) => e.id !== id) })),

      // Saídas
      addSaida: (saida) => set((state) => ({ saidas: [...state.saidas, saida] })),
      updateSaida: (id, saida) => set((state) => ({
        saidas: state.saidas.map((s) => (s.id === id ? { ...s, ...saida } : s)),
      })),
      deleteSaida: (id) => set((state) => ({ saidas: state.saidas.filter((s) => s.id !== id) })),

      // Comissões
      addComissao: (comissao) => set((state) => ({ comissoes: [...state.comissoes, comissao] })),
      updateComissao: (id, comissao) => set((state) => ({
        comissoes: state.comissoes.map((c) => (c.id === id ? { ...c, ...comissao } : c)),
      })),
      deleteComissao: (id) => set((state) => ({ comissoes: state.comissoes.filter((c) => c.id !== id) })),
    }),
    {
      name: 'oficina-eletrica-storage',
    }
  )
);
