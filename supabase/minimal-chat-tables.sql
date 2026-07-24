-- ═══════════════════════════════════════════════════════════════════════════
-- Chat tables for PGRST205 on public.chat_sessions / public.chat_messages
-- Run in Supabase → SQL Editor (same project as VITE_SUPABASE_URL).
-- Run the whole script, then: notify reloads PostgREST. Wait ~10s, refresh the app.
-- ═══════════════════════════════════════════════════════════════════════════

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

grant select, insert, update, delete on public.chat_sessions to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;

notify pgrst, 'reload schema';
