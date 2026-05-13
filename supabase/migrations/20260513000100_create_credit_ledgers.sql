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

create or replace function public.ensure_credit_ledger(p_learner_id uuid)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public
as $$
declare
  ledger public.credit_ledgers;
begin
  insert into public.credit_ledgers (learner_id)
  values (p_learner_id)
  on conflict (learner_id) do nothing;

  select *
  into ledger
  from public.credit_ledgers
  where learner_id = p_learner_id;

  return ledger;
end;
$$;

create or replace function public.mark_credit_ledger_free_trial_used(p_learner_id uuid)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public
as $$
declare
  ledger public.credit_ledgers;
begin
  perform public.ensure_credit_ledger(p_learner_id);

  update public.credit_ledgers
  set free_trial_used = true
  where learner_id = p_learner_id
  returning * into ledger;

  return ledger;
end;
$$;

create or replace function public.apply_credit_ledger_charge(
  p_learner_id uuid,
  p_credits integer
)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public
as $$
declare
  ledger public.credit_ledgers;
  subscription_charge integer;
  top_up_charge integer;
begin
  if p_credits < 0 then
    raise exception 'credits must be non-negative';
  end if;

  perform public.ensure_credit_ledger(p_learner_id);

  select *
  into ledger
  from public.credit_ledgers
  where learner_id = p_learner_id
  for update;

  if ledger.subscription_credits + ledger.top_up_credits < p_credits then
    raise exception 'insufficient credits';
  end if;

  subscription_charge := least(p_credits, ledger.subscription_credits);
  top_up_charge := p_credits - subscription_charge;

  update public.credit_ledgers
  set subscription_credits = subscription_credits - subscription_charge,
      top_up_credits = top_up_credits - top_up_charge
  where learner_id = p_learner_id
  returning * into ledger;

  return ledger;
end;
$$;

create or replace function public.apply_credit_ledger_refund(
  p_learner_id uuid,
  p_credits integer
)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public
as $$
declare
  ledger public.credit_ledgers;
begin
  if p_credits < 0 then
    raise exception 'credits must be non-negative';
  end if;

  perform public.ensure_credit_ledger(p_learner_id);

  update public.credit_ledgers
  set top_up_credits = top_up_credits + p_credits
  where learner_id = p_learner_id
  returning * into ledger;

  return ledger;
end;
$$;

revoke all on function public.ensure_credit_ledger(uuid) from public;
revoke all on function public.mark_credit_ledger_free_trial_used(uuid) from public;
revoke all on function public.apply_credit_ledger_charge(uuid, integer) from public;
revoke all on function public.apply_credit_ledger_refund(uuid, integer) from public;

grant execute on function public.ensure_credit_ledger(uuid) to service_role;
grant execute on function public.mark_credit_ledger_free_trial_used(uuid) to service_role;
grant execute on function public.apply_credit_ledger_charge(uuid, integer) to service_role;
grant execute on function public.apply_credit_ledger_refund(uuid, integer) to service_role;
