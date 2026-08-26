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
