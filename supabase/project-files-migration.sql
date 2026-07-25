-- ═══════════════════════════════════════════════════════════════════════════
-- ChatBot Platform — Project Files Feature
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create a Storage Bucket for project files
insert into storage.buckets (id, name, public)
values ('project_files', 'project_files', false)
on conflict (id) do nothing;

-- Ensure the bucket is restricted via RLS
drop policy if exists "Files are restricted to owners" on storage.objects;
create policy "Files are restricted to owners"
  on storage.objects for all
  using ( bucket_id = 'project_files' and auth.role() = 'authenticated' );

-- 2. Create the project_files table to track metadata and extracted text
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  extracted_text text not null default '',
  created_at timestamptz not null default now()
);

-- Index for quick lookups by project
create index if not exists idx_project_files_project
  on public.project_files (project_id, created_at desc);

-- Enable RLS on the new table
alter table public.project_files enable row level security;

drop policy if exists "project_files_select_own" on public.project_files;
drop policy if exists "project_files_insert_own" on public.project_files;
drop policy if exists "project_files_delete_own" on public.project_files;

create policy "project_files_select_own"
  on public.project_files for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "project_files_insert_own"
  on public.project_files for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "project_files_delete_own"
  on public.project_files for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

grant select, insert, delete on public.project_files to authenticated;

-- Reload schema cache
notify pgrst, 'reload schema';
