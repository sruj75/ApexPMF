revoke all on table public.generated_session_cases from anon;
revoke all on table public.generated_session_cases from authenticated;

grant select, insert on table public.generated_session_cases to authenticated;
