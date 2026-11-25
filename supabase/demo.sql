-- Conta de demonstração somente leitura do Finanças Matheus.
--
-- Como usar (SQL Editor do Supabase):
-- 1. Crie o usuário em Authentication > Users > Add user, com "Auto Confirm User" marcado.
-- 2. Troque o e-mail abaixo pelo e-mail desse usuário, se for diferente.
-- 3. Execute este arquivo inteiro. Ele pode ser executado de novo a qualquer momento
--    para restaurar os dados fictícios.
-- 4. Na Vercel, defina NEXT_PUBLIC_DEMO_EMAIL e NEXT_PUBLIC_DEMO_PASSWORD e faça um novo deploy.

-- Bancos criados com a versão antiga do app ainda têm as colunas title, target_amount,
-- current_amount e deadline em goals (title e target_amount são NOT NULL). Este trigger
-- mantém essas colunas preenchidas a partir das atuais. Em bancos sem elas, não faz nada.
create or replace function public.sync_goal_legacy_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  new := jsonb_populate_record(new, jsonb_build_object(
    'title', new.name, 'target_amount', new.target,
    'current_amount', new.current, 'deadline', new.due_date));
  return new;
end; $$;
drop trigger if exists goals_sync_legacy_fields on public.goals;
create trigger goals_sync_legacy_fields before insert or update on public.goals
  for each row execute function public.sync_goal_legacy_fields();

do $$
declare
  demo_email constant text := 'demo@financas-matheus.app';
  demo_id uuid;
  nubank uuid;
  inter uuid;
  m date;
  i int;
begin
  select id into demo_id from auth.users where email = demo_email;
  if demo_id is null then
    raise exception 'Usuário % não encontrado. Crie-o em Authentication > Users antes de executar.', demo_email;
  end if;

  -- Marca a conta como demonstração. app_metadata não pode ser alterado pelo próprio usuário.
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"demo": true}'::jsonb,
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"full_name": "Visitante (demonstração)"}'::jsonb
   where id = demo_id;

  -- Os triggers usam auth.uid() para definir o dono dos registros.
  perform set_config('request.jwt.claims', json_build_object('sub', demo_id, 'role', 'authenticated')::text, true);

  -- Restaura do zero.
  delete from public.transactions where user_id = demo_id;
  delete from public.credit_cards where user_id = demo_id;
  delete from public.goals where user_id = demo_id;

  insert into public.credit_cards (name, brand, last_four, credit_limit, closing_day, due_day, color)
  values ('Cartão Roxo', 'Mastercard', '4321', 6000, 3, 10, '#7c3aed') returning id into nubank;
  insert into public.credit_cards (name, brand, last_four, credit_limit, closing_day, due_day, color)
  values ('Cartão Laranja', 'Visa', '8765', 3500, 20, 27, '#f97316') returning id into inter;

  -- Seis meses de movimentações fictícias, terminando no mês atual.
  for i in 0..5 loop
    m := (date_trunc('month', current_date) - make_interval(months => i))::date;
    insert into public.transactions (description, amount, type, category, date, credit_card_id, note) values
      ('Salário', 4800 + i * 50, 'income', 'Salário', m + 4, null, null),
      ('Projeto freelance de site', 900 + (i % 3) * 250, 'income', 'Freelance', m + 17, null, 'Landing page para cliente'),
      ('Aluguel', 1350, 'expense', 'Moradia', m + 5, null, null),
      ('Conta de luz', 160 + (i % 4) * 18, 'expense', 'Contas', m + 9, null, null),
      ('Internet', 99.90, 'expense', 'Contas', m + 10, null, null),
      ('Supermercado', 620 + (i % 3) * 45, 'expense', 'Alimentação', m + 7, nubank, null),
      ('Restaurante', 85 + (i % 2) * 40, 'expense', 'Alimentação', m + 14, nubank, null),
      ('Combustível', 240 + (i % 3) * 30, 'expense', 'Transporte', m + 12, inter, null),
      ('Mensalidade da faculdade', 389, 'expense', 'Educação', m + 8, null, 'ADS'),
      ('Streaming', 39.90, 'expense', 'Assinaturas', m + 15, nubank, null),
      ('Academia', 99, 'expense', 'Saúde', m + 6, inter, null),
      ('Cinema', 60, 'expense', 'Lazer', m + 21, inter, null);
  end loop;

  insert into public.goals (name, target, current, due_date, description) values
    ('Reserva de emergência', 15000, 6200, (current_date + interval '8 months')::date, 'Seis meses de despesas fixas'),
    ('Notebook novo', 5500, 2100, (current_date + interval '4 months')::date, 'Para estudos e projetos'),
    ('Certificação de TI', 1200, 900, (current_date + interval '2 months')::date, null);
end $$;

-- Bloqueia escrita para a conta de demonstração direto no banco (políticas restritivas).
-- Estas mesmas políticas também estão em schema.sql, para não se perderem ao reexecutá-lo.
drop policy if exists "demo read only insert" on public.transactions;
drop policy if exists "demo read only update" on public.transactions;
drop policy if exists "demo read only delete" on public.transactions;
drop policy if exists "demo read only insert" on public.credit_cards;
drop policy if exists "demo read only update" on public.credit_cards;
drop policy if exists "demo read only delete" on public.credit_cards;
drop policy if exists "demo read only insert" on public.goals;
drop policy if exists "demo read only update" on public.goals;
drop policy if exists "demo read only delete" on public.goals;
create policy "demo read only insert" on public.transactions as restrictive for insert to authenticated with check (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only update" on public.transactions as restrictive for update to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only delete" on public.transactions as restrictive for delete to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only insert" on public.credit_cards as restrictive for insert to authenticated with check (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only update" on public.credit_cards as restrictive for update to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only delete" on public.credit_cards as restrictive for delete to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only insert" on public.goals as restrictive for insert to authenticated with check (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only update" on public.goals as restrictive for update to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
create policy "demo read only delete" on public.goals as restrictive for delete to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'demo')::boolean, false) = false);
