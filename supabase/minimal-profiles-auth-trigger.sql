-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL: auto-create profile row when a user signs up (after minimal-profiles-core.sql).
-- Run only if you want DB-side sync; the app also inserts via fetchOrCreateProfile.
-- If "execute function" fails, try: execute procedure public.handle_new_user();
-- ═══════════════════════════════════════════════════════════════════════════

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

notify pgrst, 'reload schema';
