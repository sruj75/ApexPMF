select
  to_regprocedure('public.ensure_credit_ledger(uuid)') is not null as public_ensure_credit_ledger_exists,
  to_regprocedure('public.claim_credit_ledger_free_trial(uuid)') is not null as public_claim_credit_ledger_free_trial_exists,
  to_regprocedure('public.mark_credit_ledger_free_trial_used(uuid)') is not null as public_mark_credit_ledger_free_trial_used_exists,
  to_regprocedure('public.apply_credit_ledger_charge(uuid, integer)') is not null as public_apply_credit_ledger_charge_exists,
  to_regprocedure('public.apply_credit_ledger_refund(uuid, integer)') is not null as public_apply_credit_ledger_refund_exists;

select
  to_regprocedure('private.ensure_credit_ledger(uuid)') is not null as private_ensure_credit_ledger_exists,
  to_regprocedure('private.claim_credit_ledger_free_trial(uuid)') is not null as private_claim_credit_ledger_free_trial_exists,
  to_regprocedure('private.mark_credit_ledger_free_trial_used(uuid)') is not null as private_mark_credit_ledger_free_trial_used_exists,
  to_regprocedure('private.apply_credit_ledger_charge(uuid, integer)') is not null as private_apply_credit_ledger_charge_exists,
  to_regprocedure('private.apply_credit_ledger_refund(uuid, integer)') is not null as private_apply_credit_ledger_refund_exists;

select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as is_security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.proname in (
    'ensure_credit_ledger',
    'claim_credit_ledger_free_trial',
    'mark_credit_ledger_free_trial_used',
    'apply_credit_ledger_charge',
    'apply_credit_ledger_refund'
  )
order by n.nspname, p.proname;

select
  'public.ensure_credit_ledger(uuid)' as routine_name,
  has_function_privilege('service_role', 'public.ensure_credit_ledger(uuid)', 'EXECUTE') as service_role_can_execute,
  has_function_privilege('authenticated', 'public.ensure_credit_ledger(uuid)', 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('anon', 'public.ensure_credit_ledger(uuid)', 'EXECUTE') as anon_can_execute
union all
select
  'public.claim_credit_ledger_free_trial(uuid)',
  has_function_privilege('service_role', 'public.claim_credit_ledger_free_trial(uuid)', 'EXECUTE'),
  has_function_privilege('authenticated', 'public.claim_credit_ledger_free_trial(uuid)', 'EXECUTE'),
  has_function_privilege('anon', 'public.claim_credit_ledger_free_trial(uuid)', 'EXECUTE')
union all
select
  'public.mark_credit_ledger_free_trial_used(uuid)',
  has_function_privilege('service_role', 'public.mark_credit_ledger_free_trial_used(uuid)', 'EXECUTE'),
  has_function_privilege('authenticated', 'public.mark_credit_ledger_free_trial_used(uuid)', 'EXECUTE'),
  has_function_privilege('anon', 'public.mark_credit_ledger_free_trial_used(uuid)', 'EXECUTE')
union all
select
  'public.apply_credit_ledger_charge(uuid, integer)',
  has_function_privilege('service_role', 'public.apply_credit_ledger_charge(uuid, integer)', 'EXECUTE'),
  has_function_privilege('authenticated', 'public.apply_credit_ledger_charge(uuid, integer)', 'EXECUTE'),
  has_function_privilege('anon', 'public.apply_credit_ledger_charge(uuid, integer)', 'EXECUTE')
union all
select
  'public.apply_credit_ledger_refund(uuid, integer)',
  has_function_privilege('service_role', 'public.apply_credit_ledger_refund(uuid, integer)', 'EXECUTE'),
  has_function_privilege('authenticated', 'public.apply_credit_ledger_refund(uuid, integer)', 'EXECUTE'),
  has_function_privilege('anon', 'public.apply_credit_ledger_refund(uuid, integer)', 'EXECUTE');

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'learner_progressions'
  and grantee in ('anon', 'authenticated', 'service_role')
order by grantee, privilege_type;

select
  count(*) filter (
    where grantee = 'anon'
  ) = 0 as anon_has_no_learner_progression_grants,
  array_agg(privilege_type order by privilege_type) filter (
    where grantee = 'authenticated'
  ) = array['INSERT', 'SELECT', 'UPDATE']::text[] as authenticated_has_only_required_progression_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'learner_progressions'
  and grantee in ('anon', 'authenticated');
