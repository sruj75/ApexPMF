create table if not exists public.credit_ledgers (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  free_trial_used boolean not null default false,
  subscription_credits integer not null default 0 check (subscription_credits >= 0),
  top_up_credits integer not null default 0 check (top_up_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_ledgers_one_per_learner unique (learner_id)
);

create index if not exists credit_ledgers_learner_id_idx
  on public.credit_ledgers (learner_id);

alter table public.credit_ledgers enable row level security;

create policy "Learners can read their Credit Ledger"
  on public.credit_ledgers
  for select
  using (auth.uid() = learner_id);

create policy "Learners can insert their Credit Ledger"
  on public.credit_ledgers
  for insert
  with check (auth.uid() = learner_id);

create policy "Learners can update their Credit Ledger"
  on public.credit_ledgers
  for update
  using (auth.uid() = learner_id)
  with check (auth.uid() = learner_id);

create or replace function public.touch_credit_ledger_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_credit_ledger_updated_at
  on public.credit_ledgers;

create trigger touch_credit_ledger_updated_at
before update on public.credit_ledgers
for each row
execute function public.touch_credit_ledger_updated_at();
