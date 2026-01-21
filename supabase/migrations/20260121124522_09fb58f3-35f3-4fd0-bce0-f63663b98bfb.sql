-- Remove overly permissive public SELECT policies that expose sensitive data

-- Drop public policy from colaboradores that exposes commission data
DROP POLICY IF EXISTS "Public can view colaboradores names" ON public.colaboradores;

-- Drop public policy from pecas that exposes cost and supplier data
DROP POLICY IF EXISTS "Public can view pecas names" ON public.pecas;

-- For orcamentos_os - replace overly permissive policy with one that only allows access via edge function
DROP POLICY IF EXISTS "Public can view orcamentos via numero_os" ON public.orcamentos_os;

-- For ordens_servico - replace overly permissive policy with one that only allows access via edge function  
DROP POLICY IF EXISTS "Public can view OS by numero" ON public.ordens_servico;

-- For veiculos - replace overly permissive policy
DROP POLICY IF EXISTS "Public can view veiculos for OS" ON public.veiculos;

-- For servicos_os - replace overly permissive policy
DROP POLICY IF EXISTS "Public can view servicos_os" ON public.servicos_os;

-- For pecas_os - replace overly permissive policy
DROP POLICY IF EXISTS "Public can view pecas_os" ON public.pecas_os;

-- For relatorios_atendimento - replace overly permissive policy
DROP POLICY IF EXISTS "Public can view relatorios via numero_os" ON public.relatorios_atendimento;