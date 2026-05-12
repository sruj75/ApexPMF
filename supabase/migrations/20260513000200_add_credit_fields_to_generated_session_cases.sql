alter table public.generated_session_cases
  add column if not exists credit_context jsonb,
  add column if not exists credit_charge jsonb;
