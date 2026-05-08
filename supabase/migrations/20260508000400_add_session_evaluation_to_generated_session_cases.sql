alter table public.generated_session_cases
  add column if not exists session_evaluation jsonb null;
