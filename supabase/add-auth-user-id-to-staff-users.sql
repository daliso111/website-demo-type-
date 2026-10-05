-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - AUTH USER LINK MIGRATION
-- Run this only if staff_users already exists without auth_user_id.
-- If you are setting up a fresh Supabase project, run schema.sql first.
-- Fresh schema.sql already includes auth_user_id, so this patch is usually
-- not needed on a new database.
-- ============================================================

do $$
begin
  if to_regclass('public.staff_users') is null then
    raise exception 'public.staff_users does not exist yet. Run supabase/schema.sql first, then run this patch only if auth_user_id is still missing.';
  end if;
end;
$$;

alter table public.staff_users
add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create index if not exists idx_staff_users_auth_user_id
on public.staff_users(auth_user_id);
