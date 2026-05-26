create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) > 0),
  slug text not null check (length(btrim(slug)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (founder_id, slug)
);

create index if not exists projects_founder_id_idx
  on public.projects (founder_id);

create table if not exists public.founder_api_keys (
  founder_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_key text not null check (length(btrim(encrypted_key)) > 0),
  key_last4 text not null check (length(key_last4) = 4),
  validation_status text not null check (
    validation_status in ('valid', 'invalid', 'unknown')
  ),
  last_validated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.founder_api_keys enable row level security;

drop policy if exists "Founders can read their API key handle" on public.founder_api_keys;
create policy "Founders can read their API key handle"
  on public.founder_api_keys
  for select
  using (auth.uid() = founder_id);

drop policy if exists "Founders can insert their API key handle" on public.founder_api_keys;
create policy "Founders can insert their API key handle"
  on public.founder_api_keys
  for insert
  with check (auth.uid() = founder_id);

drop policy if exists "Founders can update their API key handle" on public.founder_api_keys;
create policy "Founders can update their API key handle"
  on public.founder_api_keys
  for update
  using (auth.uid() = founder_id)
  with check (auth.uid() = founder_id);

create or replace function public.touch_founder_api_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_founder_api_keys_updated_at on public.founder_api_keys;
create trigger touch_founder_api_keys_updated_at
before update on public.founder_api_keys
for each row
execute function public.touch_founder_api_keys_updated_at();

create or replace function public.touch_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_projects_updated_at on public.projects;
create trigger touch_projects_updated_at
before update on public.projects
for each row
execute function public.touch_projects_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'generated_session_cases'
      and column_name = 'learner_id'
  ) then
    alter table public.generated_session_cases rename column learner_id to founder_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ideal_customer_profiles'
      and column_name = 'learner_id'
  ) then
    alter table public.ideal_customer_profiles rename column learner_id to founder_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'learner_progressions'
      and column_name = 'learner_id'
  ) then
    alter table public.learner_progressions rename column learner_id to founder_id;
  end if;
end $$;

create index if not exists idx_generated_session_cases_founder_id
  on public.generated_session_cases (founder_id);

create index if not exists ideal_customer_profiles_founder_id_idx
  on public.ideal_customer_profiles (founder_id);

create index if not exists learner_progressions_founder_id_idx
  on public.learner_progressions (founder_id);

alter table public.generated_session_cases
  add column if not exists project_id uuid;

alter table public.ideal_customer_profiles
  add column if not exists project_id uuid;

alter table public.learner_progressions
  add column if not exists project_id uuid;

insert into public.projects (founder_id, display_name, slug)
select distinct founder_id, 'Default Project', 'default'
from (
  select founder_id from public.generated_session_cases
  union
  select founder_id from public.ideal_customer_profiles
  union
  select founder_id from public.learner_progressions
) founders
where founder_id is not null
on conflict (founder_id, slug) do nothing;

create or replace function public.resolve_default_project_id_for_founder(p_founder_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_project_id uuid;
begin
  if p_founder_id is null then
    raise exception 'founder_id is required to resolve default project';
  end if;

  insert into public.projects (founder_id, display_name, slug)
  values (p_founder_id, 'Default Project', 'default')
  on conflict (founder_id, slug) do nothing;

  select id
  into resolved_project_id
  from public.projects
  where founder_id = p_founder_id
    and slug = 'default'
  limit 1;

  if resolved_project_id is null then
    raise exception 'Could not resolve default project for founder %', p_founder_id;
  end if;

  return resolved_project_id;
end;
$$;

create or replace function public.assign_project_id_from_founder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.project_id is null then
    new.project_id = public.resolve_default_project_id_for_founder(new.founder_id);
  end if;

  return new;
end;
$$;

drop trigger if exists assign_project_id_generated_session_cases on public.generated_session_cases;
create trigger assign_project_id_generated_session_cases
before insert on public.generated_session_cases
for each row
execute function public.assign_project_id_from_founder();

drop trigger if exists assign_project_id_ideal_customer_profiles on public.ideal_customer_profiles;
create trigger assign_project_id_ideal_customer_profiles
before insert on public.ideal_customer_profiles
for each row
execute function public.assign_project_id_from_founder();

drop trigger if exists assign_project_id_learner_progressions on public.learner_progressions;
create trigger assign_project_id_learner_progressions
before insert on public.learner_progressions
for each row
execute function public.assign_project_id_from_founder();

update public.generated_session_cases
set project_id = public.resolve_default_project_id_for_founder(founder_id)
where project_id is null;

update public.ideal_customer_profiles
set project_id = public.resolve_default_project_id_for_founder(founder_id)
where project_id is null;

update public.learner_progressions
set project_id = public.resolve_default_project_id_for_founder(founder_id)
where project_id is null;

alter table public.generated_session_cases
  alter column project_id set not null;

alter table public.ideal_customer_profiles
  alter column project_id set not null;

alter table public.learner_progressions
  alter column project_id set not null;

alter table public.generated_session_cases
  drop constraint if exists generated_session_cases_project_id_fkey,
  add constraint generated_session_cases_project_id_fkey
    foreign key (project_id)
    references public.projects(id)
    on delete cascade;

alter table public.ideal_customer_profiles
  drop constraint if exists ideal_customer_profiles_project_id_fkey,
  add constraint ideal_customer_profiles_project_id_fkey
    foreign key (project_id)
    references public.projects(id)
    on delete cascade;

alter table public.learner_progressions
  drop constraint if exists learner_progressions_project_id_fkey,
  add constraint learner_progressions_project_id_fkey
    foreign key (project_id)
    references public.projects(id)
    on delete cascade;

create index if not exists generated_session_cases_project_id_idx
  on public.generated_session_cases (project_id);

create index if not exists ideal_customer_profiles_project_id_idx
  on public.ideal_customer_profiles (project_id);

create index if not exists learner_progressions_project_id_idx
  on public.learner_progressions (project_id);

alter table public.learner_progressions
  drop constraint if exists learner_progressions_one_per_learner;

alter table public.learner_progressions
  add constraint learner_progressions_one_per_founder_project
  unique (founder_id, project_id);

drop policy if exists "Learners can read their Generated Session Cases" on public.generated_session_cases;
drop policy if exists "Learners can create their Generated Session Cases" on public.generated_session_cases;
drop policy if exists "Learners can update their Generated Session Cases" on public.generated_session_cases;

create policy "Founders can read their Generated Session Cases"
  on public.generated_session_cases
  for select
  using (auth.uid() = founder_id);

create policy "Founders can create their Generated Session Cases"
  on public.generated_session_cases
  for insert
  with check (auth.uid() = founder_id);

create policy "Founders can update their Generated Session Cases"
  on public.generated_session_cases
  for update
  using (auth.uid() = founder_id)
  with check (auth.uid() = founder_id);

drop policy if exists "Learners can read their Ideal Customer Profiles" on public.ideal_customer_profiles;
drop policy if exists "Learners can create their Ideal Customer Profiles" on public.ideal_customer_profiles;
drop policy if exists "Learners can update their Ideal Customer Profiles" on public.ideal_customer_profiles;

create policy "Founders can read their Ideal Customer Profiles"
  on public.ideal_customer_profiles
  for select
  using (auth.uid() = founder_id);

create policy "Founders can create their Ideal Customer Profiles"
  on public.ideal_customer_profiles
  for insert
  with check (auth.uid() = founder_id);

create policy "Founders can update their Ideal Customer Profiles"
  on public.ideal_customer_profiles
  for update
  using (auth.uid() = founder_id)
  with check (auth.uid() = founder_id);

drop policy if exists "Learners can read their Progression" on public.learner_progressions;
drop policy if exists "Learners can insert their Progression" on public.learner_progressions;
drop policy if exists "Learners can update their Progression" on public.learner_progressions;

create policy "Founders can read their Progression"
  on public.learner_progressions
  for select
  using (auth.uid() = founder_id);

create policy "Founders can insert their Progression"
  on public.learner_progressions
  for insert
  with check (auth.uid() = founder_id);

create policy "Founders can update their Progression"
  on public.learner_progressions
  for update
  using (auth.uid() = founder_id)
  with check (auth.uid() = founder_id);

create or replace function public.select_active_ideal_customer_profile(profile_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_founder_id uuid := auth.uid();
begin
  if current_founder_id is null then
    raise exception 'Founder is not authenticated.';
  end if;

  if not exists (
    select 1
    from public.ideal_customer_profiles
    where id = profile_id
      and founder_id = current_founder_id
  ) then
    raise exception 'Ideal Customer Profile not found.';
  end if;

  update public.ideal_customer_profiles
  set is_active = (id = profile_id)
  where founder_id = current_founder_id
    and (is_active = true or id = profile_id);
end;
$$;

create or replace function public.clear_active_ideal_customer_profile()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_founder_id uuid := auth.uid();
begin
  if current_founder_id is null then
    raise exception 'Founder is not authenticated.';
  end if;

  update public.ideal_customer_profiles
  set is_active = false
  where founder_id = current_founder_id
    and is_active = true;
end;
$$;
