alter table public.generated_session_cases
  add column if not exists session_evaluation jsonb null;

update public.generated_session_cases
set ended_reason = '60-minute cap'
where ended_reason = 'time-cap';

alter table public.generated_session_cases
  drop constraint if exists generated_session_cases_ended_reason_check;

alter table public.generated_session_cases
  add constraint generated_session_cases_ended_reason_check
  check (
    ended_reason in (
      'user-quit',
      'natural-conclusion',
      '60-minute cap',
      'credit-exhaustion',
      'voice-failure'
    )
  );

revoke update on table public.generated_session_cases from authenticated;
grant update (
  session_status,
  ended_reason,
  ended_at,
  report_status,
  report_ready_at,
  session_report,
  session_transcript,
  session_evaluation,
  persona_behavior
) on table public.generated_session_cases to authenticated;
