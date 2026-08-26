-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - HERO VIDEO CMS POLICIES
-- Public-safe homepage hero video settings.
--
-- Run this manually in Supabase SQL Editor after:
-- 1. supabase/settings-foundation.sql
-- 2. supabase/cms-media-storage.sql
-- 3. supabase/public-website-read-policies.sql or security-hardening.sql
--
-- This file does not expose private tables, staff data, leads,
-- documents, activity logs, or service_role keys.
-- ============================================================

-- Keep app settings protected by RLS.
alter table public.app_settings enable row level security;

-- Public visitors may read only display-safe public settings.
-- This replaces the previous public app settings policy with the
-- same safe keys plus homepage hero video media keys.
drop policy if exists "Anon can read public app settings" on public.app_settings;
create policy "Anon can read public app settings"
on public.app_settings
for select
to anon
using (
  setting_key in (
    'company_profile',
    'website_preferences',
    'seo_metadata',
    'homepage_hero_video_url',
    'homepage_hero_poster_url',
    'homepage_hero_video_updated_at'
  )
);

-- Column-level grant only for the public-safe setting shape used by
-- website.js. This does not grant anon write access.
grant select (
  setting_key,
  setting_value
) on public.app_settings to anon;

-- Ensure private/admin tables remain unavailable to anonymous users.
revoke all privileges on public.staff_users from anon;
revoke all privileges on public.property_documents from anon;
revoke all privileges on public.activity_logs from anon;
revoke all privileges on public.lead_communication_logs from anon;
revoke select, update, delete on public.leads from anon;
