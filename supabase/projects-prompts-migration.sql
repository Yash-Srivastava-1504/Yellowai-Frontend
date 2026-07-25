-- ═══════════════════════════════════════════════════════════════════════════
-- ChatBot Platform — Projects & Prompts Migration
-- Run in Supabase SQL Editor (same project as VITE_SUPABASE_URL).
-- Safe to re-run (idempotent: uses IF NOT EXISTS / CREATE OR REPLACE).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── projects ─────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_projects_user_created
  on public.projects (user_id, created_at desc);

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_delete_own"
  on public.projects for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.projects to authenticated;


-- ── prompts ──────────────────────────────────────────────────────────────────
-- A project can have prompt history; only one active at a time.
create table if not exists public.prompts (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  content    text not null default '',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompts_project_active
  on public.prompts (project_id, is_active, created_at desc);

alter table public.prompts enable row level security;

drop policy if exists "prompts_select_own" on public.prompts;
drop policy if exists "prompts_insert_own" on public.prompts;
drop policy if exists "prompts_update_own" on public.prompts;
drop policy if exists "prompts_delete_own" on public.prompts;

create policy "prompts_select_own"
  on public.prompts for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "prompts_insert_own"
  on public.prompts for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "prompts_update_own"
  on public.prompts for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "prompts_delete_own"
  on public.prompts for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.prompts to authenticated;


-- ── conversations — add project_id column ────────────────────────────────────
-- Nullable for backward compat with existing conversation rows.
alter table public.conversations
  add column if not exists project_id uuid references public.projects (id) on delete cascade;

create index if not exists idx_conversations_project_created
  on public.conversations (project_id, created_at desc);

-- Update RLS: also allow access when scoped through project ownership.
-- The existing user_id-based policies already cover project-owned conversations
-- because project_id FK cascades from the same user, but we add an explicit
-- project-scoped policy for forward compatibility.
drop policy if exists "conversations_select_project" on public.conversations;
create policy "conversations_select_project"
  on public.conversations for select
  using (
    auth.uid() = user_id
    or (
      project_id is not null and exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    )
  );


-- ── projects — touch updated_at trigger ──────────────────────────────────────
create or replace function public.touch_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.touch_projects_updated_at();


-- ── reload PostgREST schema cache ────────────────────────────────────────────
notify pgrst, 'reload schema';
