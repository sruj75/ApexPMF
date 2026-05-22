create schema if not exists private;

create or replace function private.ensure_credit_ledger(p_learner_id uuid)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public, private
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

create or replace function private.mark_credit_ledger_free_trial_used(p_learner_id uuid)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public, private
as $$
declare
  ledger public.credit_ledgers;
begin
  perform private.ensure_credit_ledger(p_learner_id);

  update public.credit_ledgers
  set free_trial_used = true
  where learner_id = p_learner_id
  returning * into ledger;

  return ledger;
end;
$$;

create or replace function private.claim_credit_ledger_free_trial(p_learner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  claimed_rows integer := 0;
begin
  perform private.ensure_credit_ledger(p_learner_id);

  update public.credit_ledgers
  set free_trial_used = true
  where learner_id = p_learner_id
    and free_trial_used = false;

  get diagnostics claimed_rows = row_count;
  return claimed_rows > 0;
end;
$$;

create or replace function private.apply_credit_ledger_charge(
  p_learner_id uuid,
  p_credits integer
)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public, private
as $$
declare
  ledger public.credit_ledgers;
  subscription_charge integer;
  top_up_charge integer;
begin
  if p_credits < 0 then
    raise exception 'credits must be non-negative';
  end if;

  perform private.ensure_credit_ledger(p_learner_id);

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

create or replace function private.apply_credit_ledger_refund(
  p_learner_id uuid,
  p_credits integer
)
returns public.credit_ledgers
language plpgsql
security definer
set search_path = public, private
as $$
declare
  ledger public.credit_ledgers;
begin
  if p_credits < 0 then
    raise exception 'credits must be non-negative';
  end if;

  perform private.ensure_credit_ledger(p_learner_id);

  update public.credit_ledgers
  set top_up_credits = top_up_credits + p_credits
  where learner_id = p_learner_id
  returning * into ledger;

  return ledger;
end;
$$;

create or replace function public.ensure_credit_ledger(p_learner_id uuid)
returns public.credit_ledgers
language sql
set search_path = public, private
as $$
  select private.ensure_credit_ledger(p_learner_id);
$$;

create or replace function public.mark_credit_ledger_free_trial_used(p_learner_id uuid)
returns public.credit_ledgers
language sql
set search_path = public, private
as $$
  select private.mark_credit_ledger_free_trial_used(p_learner_id);
$$;

create or replace function public.claim_credit_ledger_free_trial(p_learner_id uuid)
returns boolean
language plpgsql
set search_path = public, private
as $$
begin
  return private.claim_credit_ledger_free_trial(p_learner_id);
end;
$$;

create or replace function public.apply_credit_ledger_charge(
  p_learner_id uuid,
  p_credits integer
)
returns public.credit_ledgers
language sql
set search_path = public, private
as $$
  select private.apply_credit_ledger_charge(p_learner_id, p_credits);
$$;

create or replace function public.apply_credit_ledger_refund(
  p_learner_id uuid,
  p_credits integer
)
returns public.credit_ledgers
language sql
set search_path = public, private
as $$
  select private.apply_credit_ledger_refund(p_learner_id, p_credits);
$$;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

revoke all on function private.ensure_credit_ledger(uuid) from public, anon, authenticated;
revoke all on function private.mark_credit_ledger_free_trial_used(uuid) from public, anon, authenticated;
revoke all on function private.claim_credit_ledger_free_trial(uuid) from public, anon, authenticated;
revoke all on function private.apply_credit_ledger_charge(uuid, integer) from public, anon, authenticated;
revoke all on function private.apply_credit_ledger_refund(uuid, integer) from public, anon, authenticated;

grant execute on function private.ensure_credit_ledger(uuid) to service_role;
grant execute on function private.mark_credit_ledger_free_trial_used(uuid) to service_role;
grant execute on function private.claim_credit_ledger_free_trial(uuid) to service_role;
grant execute on function private.apply_credit_ledger_charge(uuid, integer) to service_role;
grant execute on function private.apply_credit_ledger_refund(uuid, integer) to service_role;

revoke all on function public.ensure_credit_ledger(uuid) from public;
revoke all on function public.mark_credit_ledger_free_trial_used(uuid) from public;
revoke all on function public.claim_credit_ledger_free_trial(uuid) from public;
revoke all on function public.apply_credit_ledger_charge(uuid, integer) from public;
revoke all on function public.apply_credit_ledger_refund(uuid, integer) from public;
revoke all on function public.ensure_credit_ledger(uuid) from anon, authenticated;
revoke all on function public.mark_credit_ledger_free_trial_used(uuid) from anon, authenticated;
revoke all on function public.claim_credit_ledger_free_trial(uuid) from anon, authenticated;
revoke all on function public.apply_credit_ledger_charge(uuid, integer) from anon, authenticated;
revoke all on function public.apply_credit_ledger_refund(uuid, integer) from anon, authenticated;

grant execute on function public.ensure_credit_ledger(uuid) to service_role;
grant execute on function public.mark_credit_ledger_free_trial_used(uuid) to service_role;
grant execute on function public.claim_credit_ledger_free_trial(uuid) to service_role;
grant execute on function public.apply_credit_ledger_charge(uuid, integer) to service_role;
grant execute on function public.apply_credit_ledger_refund(uuid, integer) to service_role;

revoke all on table public.learner_progressions from anon;
revoke all on table public.learner_progressions from authenticated;
grant select, insert, update on table public.learner_progressions to authenticated;
