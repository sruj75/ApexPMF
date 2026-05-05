create table if not exists public.ideal_customer_profiles (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  customer_description text not null check (length(btrim(customer_description)) > 0),
  notes text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ideal_customer_profiles_one_active_per_learner
  on public.ideal_customer_profiles (learner_id)
  where is_active;

create index if not exists ideal_customer_profiles_learner_id_idx
  on public.ideal_customer_profiles (learner_id);

alter table public.ideal_customer_profiles enable row level security;

create policy "Learners can read their Ideal Customer Profiles"
  on public.ideal_customer_profiles
  for select
  using (auth.uid() = learner_id);

create policy "Learners can create their Ideal Customer Profiles"
  on public.ideal_customer_profiles
  for insert
  with check (auth.uid() = learner_id);

create policy "Learners can update their Ideal Customer Profiles"
  on public.ideal_customer_profiles
  for update
  using (auth.uid() = learner_id)
  with check (auth.uid() = learner_id);

create or replace function public.touch_ideal_customer_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_ideal_customer_profile_updated_at
  on public.ideal_customer_profiles;

create trigger touch_ideal_customer_profile_updated_at
before update on public.ideal_customer_profiles
for each row
execute function public.touch_ideal_customer_profile_updated_at();

create or replace function public.select_active_ideal_customer_profile(profile_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_learner_id uuid := auth.uid();
begin
  if current_learner_id is null then
    raise exception 'Learner is not authenticated.';
  end if;

  if not exists (
    select 1
    from public.ideal_customer_profiles
    where id = profile_id
      and learner_id = current_learner_id
  ) then
    raise exception 'Ideal Customer Profile not found.';
  end if;

  update public.ideal_customer_profiles
  set is_active = (id = profile_id)
  where learner_id = current_learner_id
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
  current_learner_id uuid := auth.uid();
begin
  if current_learner_id is null then
    raise exception 'Learner is not authenticated.';
  end if;

  update public.ideal_customer_profiles
  set is_active = false
  where learner_id = current_learner_id
    and is_active = true;
end;
$$;
