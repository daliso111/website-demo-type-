-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - SETTINGS FOUNDATION
-- Phase 7A: flexible app settings table for read-only loading.
--
-- Run this manually in Supabase SQL Editor before testing
-- settings persistence from settings.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_category text not null,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_settings_setting_key
on public.app_settings(setting_key);

create index if not exists idx_app_settings_setting_category
on public.app_settings(setting_category);

drop trigger if exists trg_app_settings_set_updated_at on public.app_settings;
create trigger trg_app_settings_set_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

alter table public.app_settings enable row level security;

-- Starter authenticated-user policies only.
-- Later: replace these with stricter role and branch-based policies
-- using auth.uid() linked to public.staff_users.auth_user_id.
-- No anonymous access and no delete policy are created here.

drop policy if exists "Authenticated users can read app settings" on public.app_settings;
create policy "Authenticated users can read app settings"
on public.app_settings
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert app settings" on public.app_settings;
create policy "Authenticated users can insert app settings"
on public.app_settings
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update app settings" on public.app_settings;
create policy "Authenticated users can update app settings"
on public.app_settings
for update
to authenticated
using (true)
with check (true);
