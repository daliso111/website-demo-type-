-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PUBLIC WEBSITE READ POLICIES
-- Phase 8A: safe anon SELECT access for website.html.
--
-- Run this manually in Supabase SQL Editor before testing
-- public website Supabase reads from website.html.
--
-- No service_role key is required in frontend code.
-- No public write access is created here.
-- ============================================================

-- ============================================================
-- PROPERTIES
-- Only public-facing active/under-offer listings.
-- ============================================================

drop policy if exists "Anon can read public active properties" on public.properties;
create policy "Anon can read public active properties"
on public.properties
for select
to anon
using (status in ('Active', 'Under Offer'));

grant select (
  id,
  reference_number,
  title,
  description,
  price,
  purpose,
  property_type,
  area,
  full_address,
  bedrooms,
  bathrooms,
  garages,
  square_metres,
  status,
  featured,
  amenities,
  virtual_tour_link,
  youtube_link,
  branch_id,
  created_at
) on public.properties to anon;

-- ============================================================
-- PROPERTY IMAGES
-- Only images for public-facing active/under-offer listings.
-- ============================================================

drop policy if exists "Anon can read public property images" on public.property_images;
create policy "Anon can read public property images"
on public.property_images
for select
to anon
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_images.property_id
      and p.status in ('Active', 'Under Offer')
  )
);

grant select (
  property_id,
  image_url,
  display_order,
  is_cover
) on public.property_images to anon;

-- ============================================================
-- BRANCHES
-- Basic public contact information only.
-- ============================================================

drop policy if exists "Anon can read public branches" on public.branches;
create policy "Anon can read public branches"
on public.branches
for select
to anon
using (true);

grant select (
  id,
  name,
  address,
  contact_number
) on public.branches to anon;

-- ============================================================
-- SAFE STAFF VIEW
-- Do not grant anon access to public.staff_users directly because
-- that table contains email/auth linkage data. This view exposes
-- only public profile fields for active branch managers/agents.
-- ============================================================

create or replace view public.public_staff_profiles
with (security_barrier = true)
as
select
  id,
  full_name,
  phone,
  role,
  branch_id,
  is_active
from public.staff_users
where is_active = true
  and role in ('branch_manager', 'agent');

grant select on public.public_staff_profiles to anon;

-- ============================================================
-- CMS CONTENT
-- Public website reads visible CMS rows only.
-- ============================================================

drop policy if exists "Anon can read CMS homepage content" on public.cms_homepage_content;
create policy "Anon can read CMS homepage content"
on public.cms_homepage_content
for select
to anon
using (true);

grant select (
  id,
  hero_title,
  hero_subtitle,
  hero_button_text,
  hero_button_link,
  about_title,
  about_content,
  contact_phone,
  contact_email,
  contact_address,
  updated_at
) on public.cms_homepage_content to anon;

drop policy if exists "Anon can read active CMS banners" on public.cms_banners;
create policy "Anon can read active CMS banners"
on public.cms_banners
for select
to anon
using (is_active = true);

grant select (
  id,
  title,
  subtitle,
  image_url,
  button_text,
  button_link,
  display_order,
  is_active
) on public.cms_banners to anon;

drop policy if exists "Anon can read visible CMS team profiles" on public.cms_team_profiles;
create policy "Anon can read visible CMS team profiles"
on public.cms_team_profiles
for select
to anon
using (is_visible = true);

grant select (
  id,
  display_name,
  role_title,
  bio,
  photo_url,
  display_order,
  is_visible
) on public.cms_team_profiles to anon;

drop policy if exists "Anon can read visible CMS testimonials" on public.cms_testimonials;
create policy "Anon can read visible CMS testimonials"
on public.cms_testimonials
for select
to anon
using (is_visible = true);

grant select (
  id,
  client_name,
  client_role,
  message,
  rating,
  background_type,
  background_image_url,
  background_color,
  display_order,
  is_visible
) on public.cms_testimonials to anon;

drop policy if exists "Anon can read visible CMS featured properties" on public.cms_featured_properties;
create policy "Anon can read visible CMS featured properties"
on public.cms_featured_properties
for select
to anon
using (
  is_visible = true
  and exists (
    select 1
    from public.properties p
    where p.id = cms_featured_properties.property_id
      and p.status in ('Active', 'Under Offer')
  )
);

grant select (
  id,
  property_id,
  display_order,
  is_visible
) on public.cms_featured_properties to anon;

-- ============================================================
-- SAFE SETTINGS
-- Public website can read only safe display/settings keys.
-- ============================================================

drop policy if exists "Anon can read public app settings" on public.app_settings;
create policy "Anon can read public app settings"
on public.app_settings
for select
to anon
using (
  setting_key in (
    'company_profile',
    'website_preferences',
    'seo_metadata'
  )
);

grant select (
  setting_key,
  setting_value
) on public.app_settings to anon;
