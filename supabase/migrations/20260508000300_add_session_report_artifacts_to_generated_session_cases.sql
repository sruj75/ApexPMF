alter table public.generated_session_cases
  add column if not exists session_report jsonb null,
  add column if not exists session_transcript jsonb null;

grant update on table public.generated_session_cases to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'generated_session_cases'
      and policyname = 'Learners can update their Generated Session Cases'
  ) then
    create policy "Learners can update their Generated Session Cases"
      on public.generated_session_cases
      for update
      using (auth.uid() = learner_id)
      with check (auth.uid() = learner_id);
  end if;
end $$;
