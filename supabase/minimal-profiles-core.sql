-- ═══════════════════════════════════════════════════════════════════════════
-- MINIMAL FIX for PGRST205 — creates public.profiles + RLS + reloads PostgREST.
--
-- IMPORTANT: Run EVERYTHING from "create table" down to "notify pgrst" in ONE go.
-- Do NOT run only "select * from public.profiles" — that checks the table AFTER
-- it exists. If you skip the DDL, you will get: relation "public.profiles" does not exist.
--
-- Supabase → SQL Editor → same project as VITE_SUPABASE_URL → paste all → Run.
-- After success, run: select * from public.profiles limit 1;
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles add column if not exists display_name text default 'Friend';
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists companion text default 'friend';
alter table public.profiles add column if not exists language text default 'hinglish';
alter table public.profiles add column if not exists concerns text[] default '{}'::text[];
alter table public.profiles add column if not exists initial_mood int;
alter table public.profiles add column if not exists notifications_enabled boolean default true;
alter table public.profiles add column if not exists notif_time text default 'evening';
alter table public.profiles add column if not exists anonymous boolean default false;
alter table public.profiles add column if not exists weekly_report boolean default true;
alter table public.profiles add column if not exists theme text default 'light';
alter table public.profiles add column if not exists onboarding_completed boolean default false;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

-- Force PostgREST to reload schema cache (fixes stale PGRST205 after DDL).
notify pgrst, 'reload schema';

-- Verify in SQL Editor (should succeed, 0+ rows):
-- select id, email from public.profiles limit 5;
