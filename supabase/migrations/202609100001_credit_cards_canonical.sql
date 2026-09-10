-- Migration não destrutiva: torna credit_limit a fonte canônica e mantém os
-- campos legados "limit" e used consistentes. Execute uma vez no SQL Editor
-- do Supabase para bases que já executaram uma versão anterior do schema.
begin;

alter table public.transactions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.credit_cards
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists credit_limit numeric(12,2),
  add column if not exists "limit" numeric(12,2),
  add column if not exists used numeric(12,2),
  add column if not exists closing_day integer,
  add column if not exists due_day integer,
  add column if not exists brand text,
  add column if not exists last_four text,
  add column if not exists color text;
alter table public.goals add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.credit_cards
set credit_limit=coalesce(credit_limit, "limit", 0),
    "limit"=coalesce(credit_limit, "limit", 0),
    used=coalesce(used, 0),
    closing_day=case when closing_day between 1 and 31 then closing_day else 1 end,
    due_day=case when due_day between 1 and 31 then due_day else 10 end;

alter table public.credit_cards alter column credit_limit set default 0, alter column credit_limit set not null;
alter table public.credit_cards alter column closing_day set default 1, alter column closing_day set not null;
alter table public.credit_cards alter column due_day set default 10, alter column due_day set not null;

create or replace function public.sync_credit_card_legacy_fields() returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.credit_limit := coalesce(new.credit_limit, new."limit", 0);
  new."limit" := new.credit_limit;
  new.used := coalesce(new.used, 0);
  return new;
end; $$;

drop trigger if exists cards_sync_legacy_fields on public.credit_cards;
create trigger cards_sync_legacy_fields before insert or update on public.credit_cards for each row execute function public.sync_credit_card_legacy_fields();

update public.credit_cards c set used=coalesce((
  select sum(t.amount) from public.transactions t
  where t.credit_card_id=c.id and t.type='expense'
),0);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_card_date_idx on public.transactions (credit_card_id, date desc) where credit_card_id is not null;
create index if not exists credit_cards_user_idx on public.credit_cards (user_id);
create index if not exists goals_user_idx on public.goals (user_id);

commit;
