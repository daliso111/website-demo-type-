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
