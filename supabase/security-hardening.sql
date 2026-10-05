-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - FINAL SECURITY HARDENING
-- Phase 9A: remove hard-delete policies and reinforce public
-- anon access boundaries.
--
-- Run this manually in Supabase SQL Editor after the foundation,
-- public website read policies, public enquiry policies, storage,
-- communication log, CMS, and settings SQL files have been run.
--
-- No service_role key is required in frontend code.
-- ============================================================

-- Core tables must remain protected by RLS.
alter table public.branches enable row level security;
alter table public.staff_users enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_documents enable row level security;
alter table public.leads enable row level security;
alter table public.activity_logs enable row level security;

-- Optional phase tables. Keep these statements after their
-- corresponding SQL files have been run.
alter table if exists public.lead_communication_logs enable row level security;
alter table if exists public.cms_homepage_content enable row level security;
alter table if exists public.cms_banners enable row level security;
alter table if exists public.cms_team_profiles enable row level security;
alter table if exists public.cms_testimonials enable row level security;
alter table if exists public.cms_featured_properties enable row level security;
alter table if exists public.app_settings enable row level security;

-- No hard-delete policies for core business records.
drop policy if exists "Authenticated users can delete properties" on public.properties;
drop policy if exists "Authenticated users can delete property images" on public.property_images;
drop policy if exists "Authenticated users can delete property documents" on public.property_documents;
drop policy if exists "Authenticated users can delete leads" on public.leads;

-- Public visitors must not directly access admin/private tables.
revoke all privileges on public.staff_users from anon;
revoke all privileges on public.property_documents from anon;
revoke all privileges on public.activity_logs from anon;
revoke select, update, delete on public.leads from anon;
revoke all privileges on public.lead_communication_logs from anon;

-- Public website lead submissions only. This intentionally grants
-- insert on safe lead columns but no read/update/delete privileges.
drop policy if exists "Anon can submit public website enquiries" on public.leads;
create policy "Anon can submit public website enquiries"
on public.leads
for insert
to anon
with check (
  source = 'Website'
  and status = 'New'
  and assigned_agent_id is null
  and branch_id is not null
  and length(trim(client_name)) > 0
  and length(trim(phone)) > 0
  and (
    property_id is null
    or exists (
      select 1
      from public.properties p
      where p.id = leads.property_id
        and p.status in ('Active', 'Under Offer')
    )
  )
);

grant insert (
  client_name,
  phone,
  email,
  property_id,
  branch_id,
  source,
  status,
  notes
) on public.leads to anon;

-- Public website read access stays limited to display-safe surfaces.
drop policy if exists "Anon can read public active properties" on public.properties;
create policy "Anon can read public active properties"
on public.properties
for select
to anon
using (status in ('Active', 'Under Offer'));

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

drop policy if exists "Anon can read public branches" on public.branches;
create policy "Anon can read public branches"
on public.branches
for select
to anon
using (true);

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
