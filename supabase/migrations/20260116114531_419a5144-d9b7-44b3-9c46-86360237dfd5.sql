-- =============================================
-- MIGRAÇÃO: Status da OS com IA para Clientes
-- =============================================

-- 1. Adicionar coluna numero_os sequencial na tabela ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS numero_os SERIAL;

-- Criar índice único para número da OS
CREATE UNIQUE INDEX IF NOT EXISTS idx_ordens_servico_numero_os ON public.ordens_servico(numero_os);

-- 2. Criar tabela de orçamentos da OS
CREATE TABLE IF NOT EXISTS public.orcamentos_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'aprovado', 'reprovado')),
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar tabela de relatórios de atendimento
CREATE TABLE IF NOT EXISTS public.relatorios_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE public.orcamentos_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_atendimento ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para orcamentos_os

-- Usuários autenticados podem ver seus próprios orçamentos
CREATE POLICY "Users can view own orcamentos"
ON public.orcamentos_os FOR SELECT
USING (auth.uid() = user_id);

-- Usuários autenticados podem inserir orçamentos
CREATE POLICY "Users can insert own orcamentos"
ON public.orcamentos_os FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários autenticados podem atualizar seus orçamentos
CREATE POLICY "Users can update own orcamentos"
ON public.orcamentos_os FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários autenticados podem excluir seus orçamentos
CREATE POLICY "Users can delete own orcamentos"
ON public.orcamentos_os FOR DELETE
USING (auth.uid() = user_id);

-- Acesso público para leitura (usado pela edge function)
CREATE POLICY "Public can view orcamentos via numero_os"
ON public.orcamentos_os FOR SELECT
USING (true);

-- 6. Políticas RLS para relatorios_atendimento

-- Usuários autenticados podem ver seus próprios relatórios
CREATE POLICY "Users can view own relatorios"
ON public.relatorios_atendimento FOR SELECT
USING (auth.uid() = user_id);

-- Usuários autenticados podem inserir relatórios
CREATE POLICY "Users can insert own relatorios"
ON public.relatorios_atendimento FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários autenticados podem atualizar seus relatórios
CREATE POLICY "Users can update own relatorios"
ON public.relatorios_atendimento FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários autenticados podem excluir seus relatórios
CREATE POLICY "Users can delete own relatorios"
ON public.relatorios_atendimento FOR DELETE
USING (auth.uid() = user_id);

-- Acesso público para leitura (usado pela edge function)
CREATE POLICY "Public can view relatorios via numero_os"
ON public.relatorios_atendimento FOR SELECT
USING (true);

-- 7. Política de leitura pública para ordens_servico (via numero_os na edge function)
-- Adicionar política permissiva que permite SELECT público
CREATE POLICY "Public can view OS by numero"
ON public.ordens_servico FOR SELECT
USING (true);

-- 8. Política de leitura pública para veiculos (para mostrar info do veículo)
CREATE POLICY "Public can view veiculos for OS"
ON public.veiculos FOR SELECT
USING (true);

-- 9. Política de leitura pública para servicos_os e pecas_os
CREATE POLICY "Public can view servicos_os"
ON public.servicos_os FOR SELECT
USING (true);

CREATE POLICY "Public can view pecas_os"
ON public.pecas_os FOR SELECT
USING (true);

-- 10. Política de leitura pública para pecas (nomes)
CREATE POLICY "Public can view pecas names"
ON public.pecas FOR SELECT
USING (true);

-- 11. Política de leitura pública para colaboradores (nomes para relatórios)
CREATE POLICY "Public can view colaboradores names"
ON public.colaboradores FOR SELECT
USING (true);

-- 12. Trigger para atualizar updated_at nos orçamentos
CREATE TRIGGER update_orcamentos_os_updated_at
BEFORE UPDATE ON public.orcamentos_os
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();