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
