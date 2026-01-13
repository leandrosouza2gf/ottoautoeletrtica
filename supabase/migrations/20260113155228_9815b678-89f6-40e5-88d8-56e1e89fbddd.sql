-- Políticas explícitas para profiles (impedir insert/delete manual)
CREATE POLICY "Profiles são criados apenas via trigger" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Profiles não podem ser deletados" ON public.profiles
  FOR DELETE TO authenticated USING (false);

-- Políticas de negação para acesso anônimo em todas as tabelas de dados
CREATE POLICY "Negar acesso anônimo" ON public.clientes FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.veiculos FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.colaboradores FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.fornecedores FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.pecas FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.ordens_servico FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.servicos_os FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.pecas_os FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.entradas FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.saidas FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.comissoes FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.profiles FOR ALL TO anon USING (false);
CREATE POLICY "Negar acesso anônimo" ON public.user_roles FOR ALL TO anon USING (false);