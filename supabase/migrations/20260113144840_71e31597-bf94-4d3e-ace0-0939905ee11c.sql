-- Create enum types for status and payment
CREATE TYPE public.status_os AS ENUM (
  'aguardando_diagnostico',
  'em_conserto',
  'aguardando_peca',
  'concluido',
  'entregue'
);

CREATE TYPE public.forma_pagamento AS ENUM (
  'dinheiro',
  'pix',
  'cartao',
  'boleto'
);

CREATE TYPE public.status_pagamento AS ENUM (
  'recebido',
  'pendente'
);

CREATE TYPE public.tipo_despesa AS ENUM (
  'compra_peca',
  'comissao',
  'fixo',
  'outros'
);

CREATE TYPE public.status_comissao AS ENUM (
  'pendente',
  'paga'
);

CREATE TYPE public.tipo_comissao AS ENUM (
  'percentual',
  'fixo'
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT DEFAULT '',
  documento TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clientes" ON public.clientes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes" ON public.clientes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes" ON public.clientes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create veiculos table
CREATE TABLE public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano TEXT DEFAULT '',
  problema_informado TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own veiculos" ON public.veiculos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own veiculos" ON public.veiculos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own veiculos" ON public.veiculos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own veiculos" ON public.veiculos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create colaboradores table
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  funcao TEXT DEFAULT '',
  tipo_comissao public.tipo_comissao NOT NULL DEFAULT 'percentual',
  valor_comissao NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own colaboradores" ON public.colaboradores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own colaboradores" ON public.colaboradores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own colaboradores" ON public.colaboradores
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own colaboradores" ON public.colaboradores
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fornecedores" ON public.fornecedores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fornecedores" ON public.fornecedores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fornecedores" ON public.fornecedores
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fornecedores" ON public.fornecedores
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create pecas table
CREATE TABLE public.pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  valor_custo NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pecas" ON public.pecas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pecas" ON public.pecas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pecas" ON public.pecas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pecas" ON public.pecas
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create ordens_servico table
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  tecnico_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  defeito_relatado TEXT NOT NULL DEFAULT '',
  status public.status_os NOT NULL DEFAULT 'aguardando_diagnostico',
  defeito_identificado TEXT DEFAULT '',
  observacoes_tecnicas TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ordens_servico" ON public.ordens_servico
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ordens_servico" ON public.ordens_servico
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ordens_servico" ON public.ordens_servico
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ordens_servico" ON public.ordens_servico
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create servicos_os table (services linked to a service order)
CREATE TABLE public.servicos_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor_mao_obra NUMERIC(10,2) NOT NULL DEFAULT 0,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos_os ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own servicos_os" ON public.servicos_os
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own servicos_os" ON public.servicos_os
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own servicos_os" ON public.servicos_os
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own servicos_os" ON public.servicos_os
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create pecas_os table (parts linked to a service order)
CREATE TABLE public.pecas_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pecas_os ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pecas_os" ON public.pecas_os
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pecas_os" ON public.pecas_os
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pecas_os" ON public.pecas_os
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pecas_os" ON public.pecas_os
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create entradas table (income records)
CREATE TABLE public.entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento public.forma_pagamento NOT NULL DEFAULT 'pix',
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.status_pagamento NOT NULL DEFAULT 'recebido',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entradas" ON public.entradas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entradas" ON public.entradas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entradas" ON public.entradas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entradas" ON public.entradas
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create saidas table (expense records)
CREATE TABLE public.saidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.tipo_despesa NOT NULL DEFAULT 'outros',
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento public.forma_pagamento NOT NULL DEFAULT 'pix',
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacao TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saidas" ON public.saidas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saidas" ON public.saidas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saidas" ON public.saidas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saidas" ON public.saidas
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create comissoes table (commission records)
CREATE TABLE public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.status_comissao NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comissoes" ON public.comissoes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comissoes" ON public.comissoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comissoes" ON public.comissoes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comissoes" ON public.comissoes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers to all tables that have the column
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pecas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.entradas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.saidas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.comissoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_veiculos_user_id ON public.veiculos(user_id);
CREATE INDEX idx_veiculos_cliente_id ON public.veiculos(cliente_id);
CREATE INDEX idx_colaboradores_user_id ON public.colaboradores(user_id);
CREATE INDEX idx_fornecedores_user_id ON public.fornecedores(user_id);
CREATE INDEX idx_pecas_user_id ON public.pecas(user_id);
CREATE INDEX idx_pecas_fornecedor_id ON public.pecas(fornecedor_id);
CREATE INDEX idx_ordens_servico_user_id ON public.ordens_servico(user_id);
CREATE INDEX idx_ordens_servico_cliente_id ON public.ordens_servico(cliente_id);
CREATE INDEX idx_ordens_servico_veiculo_id ON public.ordens_servico(veiculo_id);
CREATE INDEX idx_ordens_servico_status ON public.ordens_servico(status);
CREATE INDEX idx_servicos_os_ordem_servico_id ON public.servicos_os(ordem_servico_id);
CREATE INDEX idx_pecas_os_ordem_servico_id ON public.pecas_os(ordem_servico_id);
CREATE INDEX idx_entradas_user_id ON public.entradas(user_id);
CREATE INDEX idx_entradas_os_id ON public.entradas(os_id);
CREATE INDEX idx_saidas_user_id ON public.saidas(user_id);
CREATE INDEX idx_comissoes_user_id ON public.comissoes(user_id);
CREATE INDEX idx_comissoes_colaborador_id ON public.comissoes(colaborador_id);