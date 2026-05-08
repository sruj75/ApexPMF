alter table public.generated_session_cases
  add column if not exists session_status text not null default 'voice-conversation' check (
    session_status in ('voice-conversation', 'ended')
  ),
  add column if not exists ended_reason text null check (
    ended_reason in (
      'user-quit',
      'natural-conclusion',
      '60-minute cap',
      'credit-exhaustion',
      'voice-failure'
    )
  ),
  add column if not exists ended_at timestamptz null,
  add column if not exists report_status text not null default 'not-requested' check (
    report_status in ('not-requested', 'generating', 'ready', 'insufficient-evidence')
  ),
  add column if not exists report_ready_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'generated_session_cases_end_state_consistency'
  ) then
    alter table public.generated_session_cases
      add constraint generated_session_cases_end_state_consistency
      check (
        (
          session_status = 'voice-conversation'
          and ended_reason is null
          and ended_at is null
        )
        or (
          session_status = 'ended'
          and ended_reason is not null
          and ended_at is not null
        )
      );
  end if;
end $$;
