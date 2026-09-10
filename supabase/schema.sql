-- Finanças Matheus — schema idempotente e seguro.
-- Execute no SQL Editor. Não apaga dados; itens antigos sem user_id ficam
-- inacessíveis até um administrador associá-los manualmente ao proprietário.
create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null, amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')), category text not null,
  date date not null default current_date, credit_card_id uuid, note text,
  created_at timestamptz not null default now()
);
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, credit_limit numeric(12,2) not null default 0 check (credit_limit >= 0),
  closing_day integer not null default 1 check (closing_day between 1 and 31),
  due_day integer not null default 10 check (due_day between 1 and 31),
  brand text, last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'), color text,
  "limit" numeric(12,2), used numeric(12,2), created_at timestamptz not null default now()
);
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, target numeric(12,2) not null default 1 check (target > 0),
  current numeric(12,2) not null default 0 check (current >= 0), due_date date, description text,
  created_at timestamptz not null default now()
);

-- Compatibilidade com versões antigas (limit/credit_limit e campos ausentes).
alter table public.transactions add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists credit_card_id uuid, add column if not exists note text;
alter table public.credit_cards add column if not exists credit_limit numeric(12,2), add column if not exists closing_day integer,
  add column if not exists brand text, add column if not exists last_four text, add column if not exists color text,
  add column if not exists "limit" numeric(12,2), add column if not exists used numeric(12,2),
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.goals add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists due_date date, add column if not exists description text;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='credit_cards' and column_name='limit') then
    update public.credit_cards set credit_limit = "limit" where credit_limit is null and "limit" is not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='credit_cards' and column_name='credit_limit') then
    update public.credit_cards set "limit" = credit_limit where "limit" is null and credit_limit is not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='goals' and column_name='title') then
    update public.goals set name = coalesce(name, title) where name is null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='goals' and column_name='target_amount') then
    update public.goals set target = coalesce(target, target_amount) where target is null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='goals' and column_name='current_amount') then
    update public.goals set current = coalesce(current, current_amount) where current is null;
  end if;
end $$;
update public.credit_cards set credit_limit=0 where credit_limit is null;
update public.credit_cards set "limit"=credit_limit where "limit" is null;
update public.credit_cards set closing_day=1 where closing_day is null or closing_day not between 1 and 31;
update public.credit_cards set due_day=10 where due_day is null or due_day not between 1 and 31;
update public.credit_cards c set used=coalesce((
  select sum(t.amount) from public.transactions t
  where t.credit_card_id=c.id and t.type='expense'
),0);
update public.goals set name='Meta financeira' where name is null or btrim(name)='';
update public.goals set target=1 where target is null or target<=0;
update public.goals set current=0 where current is null or current<0;
alter table public.credit_cards alter column credit_limit set default 0, alter column credit_limit set not null,
  alter column closing_day set default 1, alter column closing_day set not null, alter column due_day set default 10, alter column due_day set not null;
alter table public.goals alter column target set default 1, alter column target set not null, alter column current set default 0, alter column current set not null;

alter table public.transactions drop constraint if exists transactions_credit_card_id_fkey;
alter table public.transactions add constraint transactions_credit_card_id_fkey foreign key (credit_card_id) references public.credit_cards(id) on delete set null;
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_card_date_idx on public.transactions (credit_card_id, date desc) where credit_card_id is not null;
create index if not exists credit_cards_user_idx on public.credit_cards (user_id);
create index if not exists goals_user_idx on public.goals (user_id);

-- O cliente nunca escolhe o proprietário: o banco o define a partir do JWT.
create or replace function public.enforce_owner() returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if tg_op='INSERT' then
    if auth.uid() is null then raise exception 'Authentication is required'; end if;
    new.user_id := auth.uid();
  elsif new.user_id is distinct from old.user_id then raise exception 'The owner of a financial record cannot be changed';
  end if;
  return new;
end; $$;
create or replace function public.validate_transaction_card() returns trigger language plpgsql security invoker set search_path=public as $$
declare card_owner uuid;
begin
  if new.credit_card_id is not null then
    select user_id into card_owner from public.credit_cards where id=new.credit_card_id;
    if card_owner is null or card_owner<>new.user_id then raise exception 'The selected card does not belong to this user'; end if;
    if new.type<>'expense' then raise exception 'Only expenses can be linked to a credit card'; end if;
  end if;
  return new;
end; $$;
-- credit_limit é o campo canônico. "limit" permanece sincronizado apenas para
-- compatibilidade temporária de integrações legadas.
create or replace function public.sync_credit_card_legacy_fields() returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.credit_limit := coalesce(new.credit_limit, new."limit", 0);
  new."limit" := new.credit_limit;
  new.used := coalesce(new.used, 0);
  return new;
end; $$;
-- `used` é somente compatibilidade para integrações antigas; transactions é a fonte de verdade.
create or replace function public.sync_legacy_card_used() returns trigger language plpgsql security invoker set search_path=public as $$
declare affected_card uuid; new_card uuid; old_card uuid;
begin
  new_card := case when tg_op = 'DELETE' then null else new.credit_card_id end;
  old_card := case when tg_op = 'INSERT' then null else old.credit_card_id end;
  foreach affected_card in array array[new_card, old_card] loop
    if affected_card is not null then
      update public.credit_cards c set used=coalesce((select sum(t.amount) from public.transactions t where t.credit_card_id=affected_card and t.type='expense'),0) where c.id=affected_card;
    end if;
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;
drop trigger if exists transactions_enforce_owner on public.transactions;
drop trigger if exists cards_enforce_owner on public.credit_cards;
drop trigger if exists cards_sync_legacy_fields on public.credit_cards;
drop trigger if exists goals_enforce_owner on public.goals;
drop trigger if exists transactions_validate_card on public.transactions;
drop trigger if exists transactions_sync_card_used on public.transactions;
create trigger transactions_enforce_owner before insert or update on public.transactions for each row execute function public.enforce_owner();
create trigger cards_enforce_owner before insert or update on public.credit_cards for each row execute function public.enforce_owner();
create trigger cards_sync_legacy_fields before insert or update on public.credit_cards for each row execute function public.sync_credit_card_legacy_fields();
create trigger goals_enforce_owner before insert or update on public.goals for each row execute function public.enforce_owner();
create trigger transactions_validate_card before insert or update on public.transactions for each row execute function public.validate_transaction_card();
create trigger transactions_sync_card_used after insert or update or delete on public.transactions for each row execute function public.sync_legacy_card_used();

alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
alter table public.goals enable row level security;
-- Elimina políticas legadas potencialmente permissivas apenas nestas três tabelas.
do $$ declare item record; begin
  for item in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('transactions','credit_cards','goals') loop
    execute format('drop policy if exists %I on public.%I', item.policyname,item.tablename);
  end loop;
end $$;
create policy "own transactions" on public.transactions for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own credit cards" on public.credit_cards for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own goals" on public.goals for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
