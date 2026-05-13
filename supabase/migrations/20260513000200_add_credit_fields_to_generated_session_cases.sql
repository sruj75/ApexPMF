alter table public.generated_session_cases
  add column if not exists credit_context jsonb,
  add column if not exists credit_charge jsonb;

update public.generated_session_cases
set credit_context = '{"kind":"free-trial","maxDurationMinutes":15}'::jsonb
where credit_context is null;

alter table public.generated_session_cases
  alter column credit_context set not null;
