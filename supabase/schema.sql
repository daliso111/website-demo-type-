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
