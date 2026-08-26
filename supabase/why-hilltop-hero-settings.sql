-- ============================================================
-- Hilltop Properties Zambia
-- Why Hilltop Hero public settings policy
-- ============================================================
-- Run after:
-- 1. supabase/settings-foundation.sql
-- 2. supabase/cms-media-storage.sql
-- 3. supabase/public-website-read-policies.sql or security-hardening.sql

alter table public.app_settings enable row level security;

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
    'homepage_hero_video_updated_at',
    'homepage_why_hero_video_url',
    'homepage_why_hero_poster_url',
    'homepage_why_hero_eyebrow',
    'homepage_why_hero_title',
    'homepage_why_card_1_title',
    'homepage_why_card_1_short',
    'homepage_why_card_1_expanded',
    'homepage_why_card_1_cta',
    'homepage_why_card_2_title',
    'homepage_why_card_2_short',
    'homepage_why_card_2_expanded',
    'homepage_why_card_2_cta',
    'homepage_why_card_3_title',
    'homepage_why_card_3_short',
    'homepage_why_card_3_expanded',
    'homepage_why_card_3_cta'
  )
);

grant select (
  setting_key,
  setting_value
) on public.app_settings to anon;
