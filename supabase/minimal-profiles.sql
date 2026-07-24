-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: PGRST205 — "Could not find the table 'public.profiles'"
--
-- Run this in Supabase Dashboard → SQL Editor.
-- Use the SAME project as your VITE_SUPABASE_URL (Settings → General → Reference ID).
-- If anything below errors mid-run, use minimal-profiles-core.sql first, then optional
-- minimal-profiles-auth-trigger.sql (see repo supabase/ folder).
-- After success, wait ~10s or refresh the app.
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, new.raw_user_meta_data->>'email'))
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- Verify (should return 0 or more rows, no error):
-- select id, email from public.profiles limit 5;

-- If "execute function" errors on your Postgres version, replace both lines 67 and 81 with:
--   for each row execute procedure public.handle_new_user();
--   for each row execute procedure public.touch_profile_updated_at();

notify pgrst, 'reload schema';
