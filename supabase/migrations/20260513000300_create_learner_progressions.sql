create table if not exists public.learner_progressions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  completed_session_count integer not null default 0 check (completed_session_count >= 0),
  progression_score integer not null default 0 check (progression_score >= 0),
  achievement_nodes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_progressions_one_per_learner unique (learner_id)
);

create index if not exists learner_progressions_learner_id_idx
  on public.learner_progressions (learner_id);

alter table public.learner_progressions enable row level security;

create policy "Learners can read their Progression"
  on public.learner_progressions
  for select
  using (auth.uid() = learner_id);

create policy "Learners can insert their Progression"
  on public.learner_progressions
  for insert
  with check (auth.uid() = learner_id);

create policy "Learners can update their Progression"
  on public.learner_progressions
  for update
  using (auth.uid() = learner_id)
  with check (auth.uid() = learner_id);

create or replace function public.touch_learner_progression_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_learner_progression_updated_at
  on public.learner_progressions;

create trigger touch_learner_progression_updated_at
before update on public.learner_progressions
for each row
execute function public.touch_learner_progression_updated_at();
