create table if not exists public.generated_session_cases (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  source_kind text not null check (
    source_kind in ('active-ideal-customer-profile', 'broad-practice-pool')
  ),
  source_profile_id uuid,
  source_snapshot jsonb not null,
  opening_context text not null check (length(btrim(opening_context)) > 0),
  light_persona_label text not null check (
    length(btrim(light_persona_label)) > 0
  ),
  customer_persona jsonb not null,
  hidden_backstory text not null check (length(btrim(hidden_backstory)) > 0),
  customer_fit text not null check (
    customer_fit in (
      'strong-fit',
      'weak-fit',
      'bad-fit',
      'buyer-user-mismatch',
      'influencer'
    )
  ),
  hidden_test_plan jsonb not null,
  traps jsonb not null,
  generation_nonce text not null check (length(btrim(generation_nonce)) > 0),
  generation_audit jsonb not null,
  created_at timestamptz not null default now(),
  unique (learner_id, generation_nonce)
);

alter table public.generated_session_cases enable row level security;

create policy "Learners can read their Generated Session Cases"
  on public.generated_session_cases
  for select
  using (auth.uid() = learner_id);

create policy "Learners can create their Generated Session Cases"
  on public.generated_session_cases
  for insert
  with check (auth.uid() = learner_id);
