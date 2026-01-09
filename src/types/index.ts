export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  documento: string;
  observacoes: string;
  createdAt: Date;
}

export interface Veiculo {
  id: string;
  clienteId: string;
  placa: string;
  modelo: string;
  ano: string;
  createdAt: Date;
}

export interface Colaborador {
  id: string;
  nome: string;
  funcao: string;
  tipoComissao: 'percentual' | 'fixo';
  valorComissao: number;
  createdAt: Date;
}

export interface Fornecedor {
  id: string;
  nome: string;
  telefone: string;
  observacoes: string;
  createdAt: Date;
}

export interface Peca {
  id: string;
  nome: string;
  fornecedorId: string;
  valorCusto: number;
  createdAt: Date;
}

export type StatusOS = 
  | 'aguardando_diagnostico'
  | 'em_conserto'
  | 'aguardando_peca'
  | 'concluido'
  | 'entregue';

export interface ServicoOS {
  id: string;
  descricao: string;
  valorMaoObra: number;
  data: Date;
}

export interface PecaOS {
  id: string;
  pecaId: string;
  quantidade: number;
  valorUnitario: number;
}

export interface OrdemServico {
  id: string;
  clienteId: string;
  veiculoId: string;
  dataEntrada: Date;
  defeitoRelatado: string;
  status: StatusOS;
  defeitoIdentificado: string;
  tecnicoId: string;
  observacoesTecnicas: string;
  servicos: ServicoOS[];
  pecas: PecaOS[];
  createdAt: Date;
}

export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao' | 'boleto';
export type StatusPagamento = 'recebido' | 'pendente';
export type TipoDespesa = 'compra_peca' | 'comissao' | 'fixo' | 'outros';
export type StatusComissao = 'pendente' | 'paga';

export interface Entrada {
  id: string;
  osId: string;
  valor: number;
  formaPagamento: FormaPagamento;
  data: Date;
  status: StatusPagamento;
  createdAt: Date;
}

export interface Saida {
  id: string;
  tipo: TipoDespesa;
  valor: number;
  formaPagamento: FormaPagamento;
  data: Date;
  observacao: string;
  createdAt: Date;
}

export interface Comissao {
  id: string;
  osId: string;
  colaboradorId: string;
  valor: number;
  status: StatusComissao;
  createdAt: Date;
}
