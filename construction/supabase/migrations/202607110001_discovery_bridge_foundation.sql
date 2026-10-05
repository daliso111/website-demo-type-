-- Hilltop Construction: shared admin foundation + Discovery Bridge only.
-- Run this file in the Supabase SQL Editor as a project owner.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_bridge_settings (
  id text primary key default 'homepage' check (id = 'homepage'),
  main_paragraph text not null,
  button_label text not null default 'Learn more',
  button_url text not null default '#about',
  text_alignment text not null default 'center' check (text_alignment in ('left', 'center', 'right')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function private.is_active_homepage_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = (select auth.uid())
      and is_active = true
      and role in ('admin', 'editor')
  );
$$;

revoke all on function private.is_active_homepage_admin() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_active_homepage_admin() to anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.set_discovery_bridge_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = (select auth.uid());

  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at = now();
  elsif new.status = 'draft' then
    new.published_at = null;
  end if;

  return new;
end;
$$;

create or replace function private.create_admin_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_profiles (user_id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists set_admin_profiles_updated_at on public.admin_profiles;
create trigger set_admin_profiles_updated_at
before update on public.admin_profiles
for each row execute function private.set_updated_at();

drop trigger if exists set_discovery_bridge_audit_fields on public.discovery_bridge_settings;
create trigger set_discovery_bridge_audit_fields
before insert or update on public.discovery_bridge_settings
for each row execute function private.set_discovery_bridge_audit_fields();

drop trigger if exists create_admin_profile_after_signup on auth.users;
create trigger create_admin_profile_after_signup
after insert on auth.users
for each row execute function private.create_admin_profile_for_new_user();

alter table public.admin_profiles enable row level security;
alter table public.discovery_bridge_settings enable row level security;

drop policy if exists "Users can read their own admin profile" on public.admin_profiles;
create policy "Users can read their own admin profile"
on public.admin_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Active admins can read admin profiles" on public.admin_profiles;
create policy "Active admins can read admin profiles"
on public.admin_profiles for select
to authenticated
using ((select private.is_active_homepage_admin()));

drop policy if exists "Public can read published visible Discovery Bridge" on public.discovery_bridge_settings;
create policy "Public can read published visible Discovery Bridge"
on public.discovery_bridge_settings for select
to anon, authenticated
using (
  (status = 'published' and is_visible = true)
  or (select private.is_active_homepage_admin())
);

drop policy if exists "Active admins can insert Discovery Bridge" on public.discovery_bridge_settings;
create policy "Active admins can insert Discovery Bridge"
on public.discovery_bridge_settings for insert
to authenticated
with check ((select private.is_active_homepage_admin()) and id = 'homepage');

drop policy if exists "Active admins can update Discovery Bridge" on public.discovery_bridge_settings;
create policy "Active admins can update Discovery Bridge"
on public.discovery_bridge_settings for update
to authenticated
using ((select private.is_active_homepage_admin()) and id = 'homepage')
with check ((select private.is_active_homepage_admin()) and id = 'homepage');

revoke all on table public.admin_profiles from anon, authenticated;
revoke all on table public.discovery_bridge_settings from anon, authenticated;
grant select on table public.admin_profiles to authenticated;
grant select on table public.discovery_bridge_settings to anon, authenticated;
grant insert, update on table public.discovery_bridge_settings to authenticated;

insert into public.discovery_bridge_settings (
  id,
  main_paragraph,
  button_label,
  button_url,
  text_alignment,
  status,
  is_visible
)
values (
  'homepage',
  'Hilltop Construction approaches every project with a commitment to quality, safety, and lasting value. From planning to delivery, we focus on building with precision, reliability, and purpose, creating spaces and structures that meet today''s needs while standing strong for the future.',
  'Learn more',
  '#about',
  'center',
  'published',
  true
)
on conflict (id) do nothing;
