-- Run the full script in Supabase → SQL Editor (safe to re-run).
-- Use the SAME Supabase project as VITE_SUPABASE_URL (Settings → General → Reference ID).
-- If you see PGRST205 / "profiles not in schema cache", run minimal-profiles-core.sql first.
-- Chat UI uses conversations + messages — run conversations-messages.sql (or minimal-chat-tables.sql for legacy chat_sessions only).
-- Auth users live in auth.users; app data in public.* with RLS.

-- ── profiles (app user settings + onboarding) ───────────────────────────────
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

-- ── mood entries ────────────────────────────────────────────────────────────
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood_level int not null check (mood_level between 0 and 4),
  tags text[] default '{}'::text[],
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_mood_entries_user_created
  on public.mood_entries (user_id, created_at desc);

alter table public.mood_entries enable row level security;

drop policy if exists "mood_select_own" on public.mood_entries;
drop policy if exists "mood_insert_own" on public.mood_entries;
drop policy if exists "mood_delete_own" on public.mood_entries;

create policy "mood_select_own"
  on public.mood_entries for select
  using (auth.uid() = user_id);

create policy "mood_insert_own"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

create policy "mood_delete_own"
  on public.mood_entries for delete
  using (auth.uid() = user_id);

-- ── chat ────────────────────────────────────────────────────────────────────
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_user_updated
  on public.chat_sessions (user_id, updated_at desc);

alter table public.chat_sessions enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;

create policy "chat_sessions_select_own"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "chat_sessions_insert_own"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "chat_sessions_update_own"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_sessions_delete_own"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_created
  on public.chat_messages (session_id, created_at asc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
drop policy if exists "chat_messages_delete_own" on public.chat_messages;

create policy "chat_messages_select_own"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "chat_messages_delete_own"
  on public.chat_messages for delete
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ── auth trigger: ensure profile row ────────────────────────────────────────
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

-- ── touch profile updated_at ─────────────────────────────────────────────────
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

-- ── Grants (API access for logged-in users) ───────────────────────────────────
grant usage on schema public to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, delete on public.mood_entries to authenticated;
grant select, insert, update, delete on public.chat_sessions to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;

-- ── Conversations + messages (app chat UI — preferred) ───────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_conversations_user_created on public.conversations (user_id, created_at desc);
alter table public.conversations enable row level security;
drop policy if exists "conversations_select_own" on public.conversations;
drop policy if exists "conversations_insert_own" on public.conversations;
drop policy if exists "conversations_delete_own" on public.conversations;
create policy "conversations_select_own" on public.conversations for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations for insert with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations for delete using (auth.uid() = user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_conversation_created on public.messages (conversation_id, created_at asc);
alter table public.messages enable row level security;
drop policy if exists "messages_select_own" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_select_own" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "messages_insert_own" on public.messages for insert with check (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "messages_delete_own" on public.messages for delete using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
grant select, insert, delete on public.conversations to authenticated;
grant select, insert, delete on public.messages to authenticated;

-- ── Backfill profiles for users who signed up before the trigger existed ─────
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

notify pgrst, 'reload schema';
