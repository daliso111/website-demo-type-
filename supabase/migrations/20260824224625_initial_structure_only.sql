-- HILLTOP PROPERTIES ZAMBIA - NEW PROJECT STRUCTURE ONLY
-- Creates schema, policies, functions, triggers, and empty Storage buckets.
-- Does not insert or transfer website content, users, properties, or media.
begin;

-- ============================================================
-- SOURCE: schema.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - SUPABASE SCHEMA
-- Phase 1 foundation for the plain HTML/CSS/JavaScript admin app.
-- ============================================================

create extension if not exists "pgcrypto";

-- Keep updated_at current on mutable tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- BRANCHES
-- ============================================================
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  contact_number text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- STAFF USERS
-- ============================================================
create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  phone text,
  role text not null check (role in ('super_admin', 'branch_manager', 'agent')),
  branch_id uuid references public.branches(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_users_branch_id on public.staff_users(branch_id);
create index if not exists idx_staff_users_role on public.staff_users(role);
create index if not exists idx_staff_users_auth_user_id on public.staff_users(auth_user_id);

-- ============================================================
-- PROPERTIES
-- ============================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  title text not null,
  description text,
  price numeric(14,2) not null default 0,
  purpose text not null check (purpose in ('For Sale', 'For Rent')),
  property_type text not null check (property_type in ('House', 'Apartment', 'Commercial', 'Land')),
  branch_id uuid not null references public.branches(id) on delete restrict,
  area text not null,
  full_address text,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  garages integer not null default 0 check (garages >= 0),
  square_metres numeric(12,2) not null default 0 check (square_metres >= 0),
  status text not null default 'Draft' check (
    status in ('Draft', 'Active', 'Under Offer', 'Sold', 'Let / Rented', 'Withdrawn', 'Archived')
  ),
  featured boolean not null default false,
  amenities text[] not null default '{}',
  virtual_tour_link text,
  youtube_link text,
  assigned_agent_id uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_branch_id on public.properties(branch_id);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_purpose on public.properties(purpose);
create index if not exists idx_properties_assigned_agent_id on public.properties(assigned_agent_id);

drop trigger if exists trg_properties_set_updated_at on public.properties;
create trigger trg_properties_set_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  image_url text not null,
  display_order integer not null default 0 check (display_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_images_property_id on public.property_images(property_id);

-- ============================================================
-- PROPERTY DOCUMENTS
-- ============================================================
create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  document_name text not null,
  document_type text not null check (document_type in ('Floor Plan', 'Title Deed', 'Lease Agreement', 'Other')),
  document_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_documents_property_id on public.property_documents(property_id);

-- ============================================================
-- LEADS
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  phone text not null,
  email text,
  property_id uuid references public.properties(id) on delete set null,
  branch_id uuid not null references public.branches(id) on delete restrict,
  assigned_agent_id uuid references public.staff_users(id) on delete set null,
  source text not null check (source in ('Website', 'WhatsApp', 'Phone Call', 'Facebook', 'Referral', 'Walk-in')),
  status text not null default 'New' check (status in ('New', 'Contacted', 'Follow-up', 'Closed')),
  notes text,
  next_follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_branch_id on public.leads(branch_id);
create index if not exists idx_leads_property_id on public.leads(property_id);
create index if not exists idx_leads_assigned_agent_id on public.leads(assigned_agent_id);
create index if not exists idx_leads_status on public.leads(status);

drop trigger if exists trg_leads_set_updated_at on public.leads;
create trigger trg_leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  description text not null,
  branch_id uuid references public.branches(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  staff_user_id uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_branch_id on public.activity_logs(branch_id);
create index if not exists idx_activity_logs_property_id on public.activity_logs(property_id);
create index if not exists idx_activity_logs_lead_id on public.activity_logs(lead_id);
create index if not exists idx_activity_logs_staff_user_id on public.activity_logs(staff_user_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);


-- ============================================================
-- SOURCE: rls-policies.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - STARTER RLS POLICIES
-- ============================================================
-- These are safe starter policies for authenticated users only.
-- Stricter role-based access will be added later when Supabase Auth
-- users are mapped to staff_users records.
--
-- Important:
-- - No public unrestricted write access is created here.
-- - Never use service_role keys in frontend code.
-- ============================================================

alter table public.branches enable row level security;
alter table public.staff_users enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_documents enable row level security;
alter table public.leads enable row level security;
alter table public.activity_logs enable row level security;

-- ============================================================
-- READ POLICIES
-- Authenticated users can read phase-1 admin data.
-- ============================================================

drop policy if exists "Authenticated users can read branches" on public.branches;
create policy "Authenticated users can read branches"
on public.branches
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read staff users" on public.staff_users;
create policy "Authenticated users can read staff users"
on public.staff_users
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read properties" on public.properties;
create policy "Authenticated users can read properties"
on public.properties
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read property images" on public.property_images;
create policy "Authenticated users can read property images"
on public.property_images
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read property documents" on public.property_documents;
create policy "Authenticated users can read property documents"
on public.property_documents
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read leads" on public.leads;
create policy "Authenticated users can read leads"
on public.leads
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read activity logs" on public.activity_logs;
create policy "Authenticated users can read activity logs"
on public.activity_logs
for select
to authenticated
using (true);

-- ============================================================
-- WRITE POLICIES
-- Starter admin writes are limited to authenticated users.
-- Later: replace these with policies that check staff_users.role and
-- staff_users.branch_id against auth.uid() mapped user records.
-- ============================================================

drop policy if exists "Authenticated users can insert branches" on public.branches;
create policy "Authenticated users can insert branches"
on public.branches
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update branches" on public.branches;
create policy "Authenticated users can update branches"
on public.branches
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can insert staff users" on public.staff_users;
create policy "Authenticated users can insert staff users"
on public.staff_users
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update staff users" on public.staff_users;
create policy "Authenticated users can update staff users"
on public.staff_users
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can insert properties" on public.properties;
create policy "Authenticated users can insert properties"
on public.properties
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update properties" on public.properties;
create policy "Authenticated users can update properties"
on public.properties
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete properties" on public.properties;

drop policy if exists "Authenticated users can insert property images" on public.property_images;
create policy "Authenticated users can insert property images"
on public.property_images
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update property images" on public.property_images;
create policy "Authenticated users can update property images"
on public.property_images
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete property images" on public.property_images;

drop policy if exists "Authenticated users can insert property documents" on public.property_documents;
create policy "Authenticated users can insert property documents"
on public.property_documents
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update property documents" on public.property_documents;
create policy "Authenticated users can update property documents"
on public.property_documents
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete property documents" on public.property_documents;

drop policy if exists "Authenticated users can insert leads" on public.leads;
create policy "Authenticated users can insert leads"
on public.leads
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update leads" on public.leads;
create policy "Authenticated users can update leads"
on public.leads
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete leads" on public.leads;

drop policy if exists "Authenticated users can insert activity logs" on public.activity_logs;
create policy "Authenticated users can insert activity logs"
on public.activity_logs
for insert
to authenticated
with check (true);


-- ============================================================
-- SOURCE: storage-setup.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - STORAGE SETUP
-- Phase 3C: property images and private property documents.
--
-- Run this manually in the Supabase SQL Editor before testing
-- image/document uploads from properties.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false)
on conflict (id) do update
set public = excluded.public;

-- ============================================================
-- PROPERTY IMAGES
-- Public read is allowed because property listing photos may
-- appear on the public website later.
-- Authenticated users can upload and update objects.
-- Delete is intentionally not added in this slice.
-- ============================================================

drop policy if exists "Public can read property images" on storage.objects;
create policy "Public can read property images"
on storage.objects
for select
to public
using (bucket_id = 'property-images');

drop policy if exists "Authenticated users can upload property images" on storage.objects;
create policy "Authenticated users can upload property images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'property-images');

drop policy if exists "Authenticated users can update property images" on storage.objects;
create policy "Authenticated users can update property images"
on storage.objects
for update
to authenticated
using (bucket_id = 'property-images')
with check (bucket_id = 'property-images');

-- ============================================================
-- PROPERTY DOCUMENTS
-- Private bucket. Public users must not read legal/ownership docs.
-- Authenticated users can upload/read/update documents.
-- Delete is intentionally not added in this slice.
-- ============================================================

drop policy if exists "Authenticated users can read property documents" on storage.objects;
create policy "Authenticated users can read property documents"
on storage.objects
for select
to authenticated
using (bucket_id = 'property-documents');

drop policy if exists "Authenticated users can upload property documents" on storage.objects;
create policy "Authenticated users can upload property documents"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'property-documents');

drop policy if exists "Authenticated users can update property documents" on storage.objects;
create policy "Authenticated users can update property documents"
on storage.objects
for update
to authenticated
using (bucket_id = 'property-documents')
with check (bucket_id = 'property-documents');


-- ============================================================
-- SOURCE: lead-communication-logs.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - LEAD COMMUNICATION LOGS
-- Phase 4C: lead communication notes and follow-up history.
--
-- Run this manually in Supabase SQL Editor before testing
-- communication log persistence from leads.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

create table if not exists public.lead_communication_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  staff_user_id uuid references public.staff_users(id) on delete set null,
  communication_type text not null default 'Note',
  message text not null,
  follow_up_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_communication_logs_lead_id
on public.lead_communication_logs(lead_id);

create index if not exists idx_lead_communication_logs_staff_user_id
on public.lead_communication_logs(staff_user_id);

create index if not exists idx_lead_communication_logs_created_at
on public.lead_communication_logs(created_at desc);

alter table public.lead_communication_logs enable row level security;

-- Starter authenticated-user policies only.
-- Later: replace these with stricter role and branch-based policies
-- using auth.uid() linked to public.staff_users.auth_user_id.

drop policy if exists "Authenticated users can read lead communication logs" on public.lead_communication_logs;
create policy "Authenticated users can read lead communication logs"
on public.lead_communication_logs
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert lead communication logs" on public.lead_communication_logs;
create policy "Authenticated users can insert lead communication logs"
on public.lead_communication_logs
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update lead communication logs" on public.lead_communication_logs;
create policy "Authenticated users can update lead communication logs"
on public.lead_communication_logs
for update
to authenticated
using (true)
with check (true);


-- ============================================================
-- SOURCE: cms-foundation.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - CMS FOUNDATION
-- Phase 6A: admin CMS tables for read-only loading.
--
-- Run this manually in Supabase SQL Editor before testing CMS
-- persistence from cms.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

create table if not exists public.cms_homepage_content (
  id uuid primary key default gen_random_uuid(),
  hero_title text,
  hero_subtitle text,
  hero_button_text text,
  hero_button_link text,
  about_title text,
  about_content text,
  contact_phone text,
  contact_email text,
  contact_address text,
  updated_by uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_cms_homepage_content_set_updated_at on public.cms_homepage_content;
create trigger trg_cms_homepage_content_set_updated_at
before update on public.cms_homepage_content
for each row
execute function public.set_updated_at();

create table if not exists public.cms_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  button_text text,
  button_link text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_banners_display_order on public.cms_banners(display_order);
create index if not exists idx_cms_banners_is_active on public.cms_banners(is_active);

drop trigger if exists trg_cms_banners_set_updated_at on public.cms_banners;
create trigger trg_cms_banners_set_updated_at
before update on public.cms_banners
for each row
execute function public.set_updated_at();

create table if not exists public.cms_team_profiles (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid references public.staff_users(id) on delete set null,
  display_name text not null,
  role_title text,
  bio text,
  photo_url text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  updated_by uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_team_profiles_staff_user_id on public.cms_team_profiles(staff_user_id);
create index if not exists idx_cms_team_profiles_display_order on public.cms_team_profiles(display_order);
create index if not exists idx_cms_team_profiles_is_visible on public.cms_team_profiles(is_visible);

drop trigger if exists trg_cms_team_profiles_set_updated_at on public.cms_team_profiles;
create trigger trg_cms_team_profiles_set_updated_at
before update on public.cms_team_profiles
for each row
execute function public.set_updated_at();

create table if not exists public.cms_testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text,
  message text not null,
  rating integer check (rating >= 1 and rating <= 5),
  background_type text not null default 'solid' check (background_type in ('image', 'solid')),
  background_image_url text,
  background_color text not null default '#071827',
  is_visible boolean not null default true,
  display_order integer not null default 0,
  updated_by uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_testimonials_display_order on public.cms_testimonials(display_order);
create index if not exists idx_cms_testimonials_is_visible on public.cms_testimonials(is_visible);
create index if not exists idx_cms_testimonials_background_type on public.cms_testimonials(background_type);

drop trigger if exists trg_cms_testimonials_set_updated_at on public.cms_testimonials;
create trigger trg_cms_testimonials_set_updated_at
before update on public.cms_testimonials
for each row
execute function public.set_updated_at();

create table if not exists public.cms_featured_properties (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  updated_by uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_featured_properties_property_id on public.cms_featured_properties(property_id);
create index if not exists idx_cms_featured_properties_display_order on public.cms_featured_properties(display_order);
create index if not exists idx_cms_featured_properties_is_visible on public.cms_featured_properties(is_visible);

drop trigger if exists trg_cms_featured_properties_set_updated_at on public.cms_featured_properties;
create trigger trg_cms_featured_properties_set_updated_at
before update on public.cms_featured_properties
for each row
execute function public.set_updated_at();

alter table public.cms_homepage_content enable row level security;
alter table public.cms_banners enable row level security;
alter table public.cms_team_profiles enable row level security;
alter table public.cms_testimonials enable row level security;
alter table public.cms_featured_properties enable row level security;

-- Starter authenticated-user policies only.
-- Later: replace these with stricter role-based policies using
-- auth.uid() linked to public.staff_users.auth_user_id.
-- No anon access and no hard delete policies are created here.

drop policy if exists "Authenticated users can read CMS homepage content" on public.cms_homepage_content;
create policy "Authenticated users can read CMS homepage content"
on public.cms_homepage_content
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert CMS homepage content" on public.cms_homepage_content;
create policy "Authenticated users can insert CMS homepage content"
on public.cms_homepage_content
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update CMS homepage content" on public.cms_homepage_content;
create policy "Authenticated users can update CMS homepage content"
on public.cms_homepage_content
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can read CMS banners" on public.cms_banners;
create policy "Authenticated users can read CMS banners"
on public.cms_banners
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert CMS banners" on public.cms_banners;
create policy "Authenticated users can insert CMS banners"
on public.cms_banners
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update CMS banners" on public.cms_banners;
create policy "Authenticated users can update CMS banners"
on public.cms_banners
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can read CMS team profiles" on public.cms_team_profiles;
create policy "Authenticated users can read CMS team profiles"
on public.cms_team_profiles
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert CMS team profiles" on public.cms_team_profiles;
create policy "Authenticated users can insert CMS team profiles"
on public.cms_team_profiles
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update CMS team profiles" on public.cms_team_profiles;
create policy "Authenticated users can update CMS team profiles"
on public.cms_team_profiles
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can read CMS testimonials" on public.cms_testimonials;
create policy "Authenticated users can read CMS testimonials"
on public.cms_testimonials
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert CMS testimonials" on public.cms_testimonials;
create policy "Authenticated users can insert CMS testimonials"
on public.cms_testimonials
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update CMS testimonials" on public.cms_testimonials;
create policy "Authenticated users can update CMS testimonials"
on public.cms_testimonials
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can read CMS featured properties" on public.cms_featured_properties;
create policy "Authenticated users can read CMS featured properties"
on public.cms_featured_properties
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert CMS featured properties" on public.cms_featured_properties;
create policy "Authenticated users can insert CMS featured properties"
on public.cms_featured_properties
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update CMS featured properties" on public.cms_featured_properties;
create policy "Authenticated users can update CMS featured properties"
on public.cms_featured_properties
for update
to authenticated
using (true)
with check (true);


-- ============================================================
-- SOURCE: cms-testimonial-backgrounds.sql
-- ============================================================

-- Hilltop Properties Zambia
-- Add carousel background support to CMS testimonials.

alter table if exists public.cms_testimonials
  add column if not exists background_type text not null default 'solid',
  add column if not exists background_image_url text,
  add column if not exists background_color text not null default '#071827';

alter table if exists public.cms_testimonials
  drop constraint if exists cms_testimonials_background_type_check;

update public.cms_testimonials
set
  background_type = case
    when background_type in ('image', 'solid') then background_type
    else 'solid'
  end,
  background_color = coalesce(nullif(background_color, ''), '#071827')
where background_type is null
   or background_type = ''
   or background_type not in ('image', 'solid')
   or background_color is null
   or background_color = '';

with ranked_testimonials as (
  select
    id,
    row_number() over (order by display_order asc, created_at asc) as rn
  from public.cms_testimonials
)
update public.cms_testimonials t
set
  background_type = case when r.rn <= 2 then 'image' else 'solid' end,
  background_image_url = case
    when r.rn <= 2 then coalesce(nullif(t.background_image_url, ''), 'assets/images/hero-poster.png')
    else t.background_image_url
  end,
  background_color = case
    when r.rn = 4 then '#132c46'
    else coalesce(nullif(t.background_color, ''), '#071827')
  end
from ranked_testimonials r
where t.id = r.id
  and (t.background_image_url is null or t.background_image_url = '');

alter table if exists public.cms_testimonials
  add constraint cms_testimonials_background_type_check
  check (background_type in ('image', 'solid'));

create index if not exists idx_cms_testimonials_background_type
on public.cms_testimonials(background_type);

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


-- ============================================================
-- SOURCE: cms-media-storage.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - CMS MEDIA STORAGE
-- Phase 6C: public CMS banner images and team profile photos.
--
-- Run this manually in Supabase SQL Editor before testing CMS
-- media uploads from cms.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update
set public = excluded.public;

-- Public read is allowed because banner images and team photos
-- may appear on the public website later.
drop policy if exists "Public can read CMS media" on storage.objects;
create policy "Public can read CMS media"
on storage.objects
for select
to public
using (bucket_id = 'cms-media');

-- Authenticated admin users can upload CMS media.
-- Later: replace with stricter role-based checks using
-- auth.uid() linked to public.staff_users.auth_user_id.
drop policy if exists "Authenticated users can upload CMS media" on storage.objects;
create policy "Authenticated users can upload CMS media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cms-media');

-- Authenticated admin users can update CMS media objects.
-- Delete is intentionally not added in this phase.
drop policy if exists "Authenticated users can update CMS media" on storage.objects;
create policy "Authenticated users can update CMS media"
on storage.objects
for update
to authenticated
using (bucket_id = 'cms-media')
with check (bucket_id = 'cms-media');


-- ============================================================
-- SOURCE: settings-foundation.sql
-- ============================================================

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


-- ============================================================
-- SOURCE: services-showcase-cms.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - SERVICES SHOWCASE CMS
-- Public homepage Services Showcase content and optional
-- case-study hover media support.
--
-- Run this manually in Supabase SQL Editor before managing
-- Services Showcase items from cms.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

create table if not exists public.cms_service_showcase_items (
  id uuid primary key default gen_random_uuid(),
  display_order integer not null default 0,
  is_active boolean not null default true,
  title text not null,
  badge text,
  description text not null,
  highlights text[] not null default '{}'::text[],
  icon_key text,
  image_url text,
  image_alt text,
  visual_theme text,
  is_case_study boolean not null default false,
  case_study_label text default 'View Case Study',
  case_study_url text,
  hover_video_url text,
  hover_video_poster_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cms_service_showcase_items
  add column if not exists is_case_study boolean not null default false,
  add column if not exists case_study_label text default 'View Case Study',
  add column if not exists case_study_url text,
  add column if not exists hover_video_url text,
  add column if not exists hover_video_poster_url text;

create index if not exists idx_cms_service_showcase_items_active_order
on public.cms_service_showcase_items(is_active, display_order);

create index if not exists idx_cms_service_showcase_items_display_order
on public.cms_service_showcase_items(display_order);

create or replace function public.set_cms_service_showcase_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cms_service_showcase_items_set_updated_at
on public.cms_service_showcase_items;

create trigger trg_cms_service_showcase_items_set_updated_at
before update on public.cms_service_showcase_items
for each row
execute function public.set_cms_service_showcase_updated_at();

alter table public.cms_service_showcase_items enable row level security;

drop policy if exists "Public can read active service showcase items"
on public.cms_service_showcase_items;

create policy "Public can read active service showcase items"
on public.cms_service_showcase_items
for select
to anon
using (is_active = true);

drop policy if exists "Authenticated users can manage service showcase items"
on public.cms_service_showcase_items;

create policy "Authenticated users can manage service showcase items"
on public.cms_service_showcase_items
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can read service showcase media"
on storage.objects;

create policy "Public can read service showcase media"
on storage.objects
for select
to public
using (
  bucket_id = 'cms-media'
  and name like 'services-showcase/%'
);

drop policy if exists "Authenticated users can upload service showcase media"
on storage.objects;

create policy "Authenticated users can upload service showcase media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cms-media'
  and name like 'services-showcase/%'
);

drop policy if exists "Authenticated users can update service showcase media"
on storage.objects;

create policy "Authenticated users can update service showcase media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cms-media'
  and name like 'services-showcase/%'
)
with check (
  bucket_id = 'cms-media'
  and name like 'services-showcase/%'
);


-- ============================================================
-- SOURCE: team-members-setup.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - TEAM MEMBERS SUPABASE SETUP
-- ============================================================
-- Run this in the Supabase SQL Editor to register the table,
-- enable Row Level Security (RLS), create update triggers,
-- and set up the 'team-members' storage bucket.
-- ============================================================

-- 1. Create the team-members Storage Bucket
insert into storage.buckets (id, name, public)
values ('team-members', 'team-members', true)
on conflict (id) do update
set public = excluded.public;

-- 2. Create the team_members Table
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null,
  branch text not null,
  phone text not null,
  whatsapp text,
  bio text not null,
  image_url text,
  image_path text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

-- Index display order and status for listing efficiency
create index if not exists idx_team_members_display_order on public.team_members(display_order);
create index if not exists idx_team_members_is_active on public.team_members(is_active);

-- 3. Set up the Auto-Update updated_at Trigger
drop trigger if exists trg_team_members_set_updated_at on public.team_members;
create trigger trg_team_members_set_updated_at
before update on public.team_members
for each row
execute function public.set_updated_at();

-- 4. Enable Row Level Security (RLS)
alter table public.team_members enable row level security;

-- 5. Define Table RLS Policies

-- A. SELECT Policies
-- Public read policy: Anyone (anon or authenticated) can view active team members.
drop policy if exists "Public can read active team members" on public.team_members;
create policy "Public can read active team members"
on public.team_members
for select
to public
using (is_active = true);

-- Admin read policy: Authenticated staff/admins can view all team members (active and hidden).
drop policy if exists "Authenticated users can read all team members" on public.team_members;
create policy "Authenticated users can read all team members"
on public.team_members
for select
to authenticated
using (true);

-- B. INSERT / UPDATE / DELETE Policies (Admin Writes)
-- Starter admin writes are limited to authenticated users.
-- TODO: restrict access by mapping auth.uid() to public.staff_users(auth_user_id) where role = 'super_admin' before production.
drop policy if exists "Authenticated users can insert team members" on public.team_members;
create policy "Authenticated users can insert team members"
on public.team_members
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update team members" on public.team_members;
create policy "Authenticated users can update team members"
on public.team_members
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete team members" on public.team_members;
create policy "Authenticated users can delete team members"
on public.team_members
for delete
to authenticated
using (true);

-- 6. Define Storage Policies for team-members Bucket

-- A. SELECT Policy: Anyone can read/download profile images
drop policy if exists "Public can read team member profile images" on storage.objects;
create policy "Public can read team member profile images"
on storage.objects
for select
to public
using (bucket_id = 'team-members');

-- B. INSERT / UPDATE / DELETE Policies (Authenticated Admin writes)
drop policy if exists "Authenticated users can upload team member images" on storage.objects;
create policy "Authenticated users can upload team member images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'team-members');

drop policy if exists "Authenticated users can update team member images" on storage.objects;
create policy "Authenticated users can update team member images"
on storage.objects
for update
to authenticated
using (bucket_id = 'team-members')
with check (bucket_id = 'team-members');

drop policy if exists "Authenticated users can delete team member images" on storage.objects;
create policy "Authenticated users can delete team member images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'team-members');


-- ============================================================
-- SOURCE: property-currency-support.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PROPERTY CURRENCY SUPPORT
-- Forward migration for ZMW and USD property listing prices.
--
-- Run after schema.sql and the existing property RLS policies.
-- Existing numeric prices are preserved without conversion.
-- ============================================================

alter table public.properties
add column if not exists currency_code text;

-- Existing and legacy records remain ZMW. Normalise a previously
-- added supported value before applying the strict constraint.
update public.properties
set currency_code = upper(trim(currency_code))
where currency_code is not null;

update public.properties
set currency_code = 'ZMW'
where currency_code is null
   or currency_code not in ('ZMW', 'USD');

alter table public.properties
alter column currency_code set default 'ZMW';

alter table public.properties
alter column currency_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_currency_code_check'
  ) then
    alter table public.properties
    add constraint properties_currency_code_check
    check (currency_code in ('ZMW', 'USD'));
  end if;
end;
$$;

-- Enforce non-negative numeric values for all future writes without
-- rewriting or converting any legacy price amount.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_price_non_negative'
  ) then
    alter table public.properties
    add constraint properties_price_non_negative
    check (price >= 0) not valid;
  end if;
end;
$$;

comment on column public.properties.currency_code is
'ISO-style listing currency code. Supported values are ZMW and USD; amounts are never converted automatically.';

create index if not exists idx_properties_currency_code
on public.properties (currency_code);

-- RLS remains enabled. This trigger narrows currency writes to the
-- same property-management roles used by the dashboard and resolves
-- authority from auth.uid(), not from browser-supplied role data.
create or replace function public.enforce_property_currency_management()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role text;
  staff_branch_id uuid;
begin
  if auth.uid() is null then
    return new;
  end if;

  select su.role, su.branch_id
  into staff_role, staff_branch_id
  from public.staff_users su
  where su.auth_user_id = auth.uid()
    and su.is_active = true
  limit 1;

  if staff_role is null or staff_role not in ('super_admin', 'branch_manager') then
    raise exception using
      errcode = '42501',
      message = 'Only active super administrators and branch managers may manage property currency.';
  end if;

  if staff_role = 'branch_manager' and (
    staff_branch_id is null
    or new.branch_id is distinct from staff_branch_id
    or (tg_op = 'UPDATE' and old.branch_id is distinct from staff_branch_id)
  ) then
    raise exception using
      errcode = '42501',
      message = 'Branch managers may manage property currency only within their assigned branch.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_property_currency_management() from public;

drop trigger if exists trg_properties_currency_management on public.properties;
create trigger trg_properties_currency_management
before insert or update of currency_code, price, branch_id
on public.properties
for each row
execute function public.enforce_property_currency_management();

-- Public visitors can read the currency only through the existing
-- public-property RLS policy. Anonymous writes remain prohibited.
grant select (currency_code) on public.properties to anon, authenticated;
grant insert (currency_code), update (currency_code) on public.properties to authenticated;
revoke insert (currency_code), update (currency_code) on public.properties from anon;


-- ============================================================
-- SOURCE: property-exclusive-controls.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - EXCLUSIVE PROPERTY CONTROLS
-- Forward migration for the Property Management dashboard and
-- homepage premium horizontal property showcase.
--
-- Run after schema.sql and the existing RLS/public-read policies.
-- This migration is idempotent and does not change Featured
-- Property behaviour or grant anonymous write access.
-- ============================================================

alter table public.properties
add column if not exists exclusive_property boolean;

update public.properties
set exclusive_property = false
where exclusive_property is null;

alter table public.properties
alter column exclusive_property set default false;

alter table public.properties
alter column exclusive_property set not null;

comment on column public.properties.exclusive_property is
'Controls inclusion in the public homepage premium horizontal property showcase.';

-- Normalise known legacy category variations without removing the
-- existing supported Commercial category.
update public.properties
set property_type = case
  when lower(trim(property_type)) in ('house', 'houses') then 'House'
  when lower(trim(property_type)) in ('apartment', 'apartments', 'flat', 'flats') then 'Apartment'
  when lower(trim(property_type)) in ('land', 'lands', 'plot', 'plots') then 'Land'
  when lower(trim(property_type)) in ('commercial', 'commercial property') then 'Commercial'
  else property_type
end
where lower(trim(property_type)) in (
  'house', 'houses',
  'apartment', 'apartments', 'flat', 'flats',
  'land', 'lands', 'plot', 'plots',
  'commercial', 'commercial property'
);

create index if not exists idx_properties_exclusive_active
on public.properties (created_at desc)
where exclusive_property = true and status = 'Active';

alter table public.properties enable row level security;

-- Protect classification/exclusive changes with the server-side staff
-- record. The dashboard's role value is used only for presentation;
-- authorisation here is resolved from auth.uid(). Trusted SQL/service
-- maintenance has no end-user auth.uid() and remains possible.
create or replace function public.enforce_property_classification_management()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role text;
  staff_branch_id uuid;
begin
  if auth.uid() is null then
    return new;
  end if;

  select su.role, su.branch_id
  into staff_role, staff_branch_id
  from public.staff_users su
  where su.auth_user_id = auth.uid()
    and su.is_active = true
  limit 1;

  if staff_role is null or staff_role not in ('super_admin', 'branch_manager') then
    raise exception using
      errcode = '42501',
      message = 'Only active super administrators and branch managers may manage property classification.';
  end if;

  if staff_role = 'branch_manager' and (
    staff_branch_id is null
    or new.branch_id is distinct from staff_branch_id
    or (tg_op = 'UPDATE' and old.branch_id is distinct from staff_branch_id)
  ) then
    raise exception using
      errcode = '42501',
      message = 'Branch managers may manage properties only within their assigned branch.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_property_classification_management() from public;

drop trigger if exists trg_properties_classification_management on public.properties;
create trigger trg_properties_classification_management
before insert or update of property_type, exclusive_property, branch_id
on public.properties
for each row
execute function public.enforce_property_classification_management();

-- The existing public property policy continues to enforce public
-- status visibility. This grant exposes only the new display flag.
grant select (exclusive_property) on public.properties to anon;
revoke insert (exclusive_property) on public.properties from anon;
revoke update (exclusive_property) on public.properties from anon;


-- ============================================================
-- SOURCE: property-services-cms.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PROPERTY SERVICES CMS
-- Phase 3 forward migration for the approved homepage section.
--
-- Run after schema.sql and add-auth-user-id-to-staff-users.sql.
-- This migration is idempotent and does not require service_role
-- credentials in any frontend file.
-- ============================================================

create extension if not exists "pgcrypto";

create or replace function public.current_staff_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select su.id
  from public.staff_users su
  where su.auth_user_id = auth.uid()
    and su.is_active = true
  limit 1;
$$;

create or replace function public.is_active_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_users su
    where su.auth_user_id = auth.uid()
      and su.is_active = true
      and su.role = 'super_admin'
  );
$$;

revoke all on function public.current_staff_user_id() from public;
revoke all on function public.is_active_super_admin() from public;
grant execute on function public.current_staff_user_id() to authenticated;
grant execute on function public.is_active_super_admin() to authenticated;

create table if not exists public.cms_services_section (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  eyebrow text not null,
  heading text not null,
  supporting_text text not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff_users(id) on delete set null,
  constraint cms_services_section_key_format check (section_key ~ '^[a-z0-9-]+$'),
  constraint cms_services_section_eyebrow_length check (length(trim(eyebrow)) between 1 and 40),
  constraint cms_services_section_heading_length check (length(trim(heading)) between 1 and 80),
  constraint cms_services_section_supporting_length check (length(trim(supporting_text)) between 1 and 300)
);

create table if not exists public.cms_service_cards (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_services_section(id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text not null,
  button_label text not null,
  action_type text not null,
  action_value text,
  default_image_path text,
  custom_image_path text,
  image_alt text not null,
  sort_order integer not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff_users(id) on delete set null,
  constraint cms_service_cards_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint cms_service_cards_title_length check (length(trim(title)) between 1 and 70),
  constraint cms_service_cards_description_length check (length(trim(description)) between 1 and 260),
  constraint cms_service_cards_button_length check (length(trim(button_label)) between 1 and 40),
  constraint cms_service_cards_alt_length check (length(trim(image_alt)) between 1 and 180),
  constraint cms_service_cards_sort_order check (sort_order > 0),
  constraint cms_service_cards_action_type check (
    action_type in ('all_listings', 'rental_listings', 'list_property_enquiry', 'internal_page')
  ),
  constraint cms_service_cards_internal_action check (
    (
      action_type = 'internal_page'
      and action_value is not null
      and length(trim(action_value)) between 1 and 240
      and trim(action_value) ~ '^(/|[.]/|[.][.]/)?[A-Za-z0-9][A-Za-z0-9._~!$&''()*+,;=@%/?#-]*$'
    )
    or (action_type <> 'internal_page' and action_value is null)
  ),
  constraint cms_service_cards_unique_order unique (section_id, sort_order) deferrable initially immediate
);

create index if not exists idx_cms_service_cards_section_order
on public.cms_service_cards(section_id, sort_order);

create index if not exists idx_cms_service_cards_visible_order
on public.cms_service_cards(section_id, is_visible, sort_order);

create or replace function public.set_property_services_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = public.current_staff_user_id();
  return new;
end;
$$;

drop trigger if exists trg_cms_services_section_audit on public.cms_services_section;
create trigger trg_cms_services_section_audit
before update on public.cms_services_section
for each row execute function public.set_property_services_audit_fields();

drop trigger if exists trg_cms_service_cards_audit on public.cms_service_cards;
create trigger trg_cms_service_cards_audit
before update on public.cms_service_cards
for each row execute function public.set_property_services_audit_fields();

create or replace function public.enforce_visible_service_card_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  visible_count integer;
begin
  if new.is_visible then
    select count(*)
    into visible_count
    from public.cms_service_cards c
    where c.section_id = new.section_id
      and c.is_visible = true
      and c.id <> new.id;

    if visible_count >= 4 then
      raise exception 'A maximum of four service cards may be visible.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cms_service_cards_visible_limit on public.cms_service_cards;
create trigger trg_cms_service_cards_visible_limit
before insert or update of is_visible, section_id on public.cms_service_cards
for each row execute function public.enforce_visible_service_card_limit();

alter table public.cms_services_section enable row level security;
alter table public.cms_service_cards enable row level security;

drop policy if exists "Public can read homepage property services settings" on public.cms_services_section;
create policy "Public can read homepage property services settings"
on public.cms_services_section
for select
to anon, authenticated
using (section_key = 'homepage-property-services');

drop policy if exists "Super admins can insert property services settings" on public.cms_services_section;
create policy "Super admins can insert property services settings"
on public.cms_services_section
for insert
to authenticated
with check (public.is_active_super_admin());

drop policy if exists "Super admins can update property services settings" on public.cms_services_section;
create policy "Super admins can update property services settings"
on public.cms_services_section
for update
to authenticated
using (public.is_active_super_admin())
with check (public.is_active_super_admin());

drop policy if exists "Public can read visible property service cards" on public.cms_service_cards;
create policy "Public can read visible property service cards"
on public.cms_service_cards
for select
to anon, authenticated
using (
  is_visible = true
  and exists (
    select 1
    from public.cms_services_section s
    where s.id = cms_service_cards.section_id
      and s.section_key = 'homepage-property-services'
      and s.is_visible = true
  )
);

drop policy if exists "Super admins can read all property service cards" on public.cms_service_cards;
create policy "Super admins can read all property service cards"
on public.cms_service_cards
for select
to authenticated
using (public.is_active_super_admin());

drop policy if exists "Super admins can insert property service cards" on public.cms_service_cards;
create policy "Super admins can insert property service cards"
on public.cms_service_cards
for insert
to authenticated
with check (public.is_active_super_admin());

drop policy if exists "Super admins can update property service cards" on public.cms_service_cards;
create policy "Super admins can update property service cards"
on public.cms_service_cards
for update
to authenticated
using (public.is_active_super_admin())
with check (public.is_active_super_admin());

revoke all on public.cms_services_section from anon, authenticated;
revoke all on public.cms_service_cards from anon, authenticated;
grant select (
  id,
  section_key,
  eyebrow,
  heading,
  supporting_text,
  is_visible
) on public.cms_services_section to anon, authenticated;
grant insert, update on public.cms_services_section to authenticated;
grant select (
  id,
  section_id,
  slug,
  title,
  description,
  button_label,
  action_type,
  action_value,
  default_image_path,
  custom_image_path,
  image_alt,
  sort_order,
  is_visible
) on public.cms_service_cards to anon, authenticated;
grant insert, update on public.cms_service_cards to authenticated;

-- Structure-only setup: CMS service content is intentionally left empty.
-- Add new service-section and service-card records through this project's CMS.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'service-illustrations',
  'service-illustrations',
  true,
  2097152,
  array['image/png', 'image/webp', 'image/jpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read service illustrations" on storage.objects;
create policy "Public can read service illustrations"
on storage.objects
for select
to public
using (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
);

drop policy if exists "Super admins can upload service illustrations" on storage.objects;
create policy "Super admins can upload service illustrations"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and lower(storage.extension(name)) in ('png', 'webp', 'jpg', 'jpeg')
  and public.is_active_super_admin()
);

drop policy if exists "Super admins can update service illustrations" on storage.objects;
create policy "Super admins can update service illustrations"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and public.is_active_super_admin()
)
with check (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and lower(storage.extension(name)) in ('png', 'webp', 'jpg', 'jpeg')
  and public.is_active_super_admin()
);

drop policy if exists "Super admins can delete service illustrations" on storage.objects;
create policy "Super admins can delete service illustrations"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and public.is_active_super_admin()
);


-- ============================================================
-- SOURCE: public-website-read-policies.sql
-- ============================================================

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


-- ============================================================
-- SOURCE: public-enquiry-policies.sql
-- ============================================================

-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PUBLIC ENQUIRY POLICIES
-- Phase 8B: safe anonymous website enquiry submissions.
--
-- Run this manually in Supabase SQL Editor before testing public
-- enquiry submission.
--
-- No service_role key is required in frontend code.
-- This file allows anon INSERT into public.leads only. It does
-- not grant anon SELECT, UPDATE, or DELETE on public.leads.
-- ============================================================

revoke select, update, delete on public.leads from anon;

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


-- ============================================================
-- SOURCE: security-hardening.sql
-- ============================================================

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


-- ============================================================
-- SOURCE: hero-video-cms-policies.sql
-- ============================================================

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


-- ============================================================
-- SOURCE: why-hilltop-hero-settings.sql
-- ============================================================

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


commit;
