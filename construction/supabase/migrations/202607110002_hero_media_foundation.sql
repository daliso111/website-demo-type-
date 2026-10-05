-- Hilltop Construction: shared homepage media foundation + Hero only.
-- Run after 202607110001_discovery_bridge_foundation.sql.

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null default 'homepage-media' check (bucket_name = 'homepage-media'),
  storage_path text not null unique,
  original_filename text not null,
  media_type text not null check (media_type in ('image', 'video', 'poster')),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm')),
  size_bytes bigint not null check (size_bytes > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  alt_text text,
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_settings (
  id uuid primary key default gen_random_uuid(),
  record_type text not null unique check (record_type in ('draft', 'published')),
  eyebrow text,
  heading text,
  body text,
  background_video_asset_id uuid references public.media_assets(id) on delete set null,
  poster_asset_id uuid references public.media_assets(id) on delete set null,
  poster_alt_text text,
  video_enabled boolean not null default true,
  loop_enabled boolean not null default true,
  mobile_video_enabled boolean not null default true,
  playback_rate numeric not null default 1 check (playback_rate in (0.75, 1, 1.25)),
  overlay_opacity numeric not null default 0.58 check (overlay_opacity between 0 and 1),
  primary_button_label text,
  primary_button_url text,
  secondary_button_label text,
  secondary_button_url text,
  is_visible boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists media_assets_created_by_idx on public.media_assets (created_by);
create index if not exists media_assets_media_type_idx on public.media_assets (media_type);
create index if not exists hero_settings_video_asset_idx on public.hero_settings (background_video_asset_id);
create index if not exists hero_settings_poster_asset_idx on public.hero_settings (poster_asset_id);

create or replace function private.set_hero_audit_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  new.updated_by = (select auth.uid());
  if new.record_type = 'draft' then new.published_at = null; end if;
  return new;
end;
$$;

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at before update on public.media_assets
for each row execute function private.set_updated_at();

drop trigger if exists set_hero_audit_fields on public.hero_settings;
create trigger set_hero_audit_fields before insert or update on public.hero_settings
for each row execute function private.set_hero_audit_fields();

create or replace function public.publish_hero_draft()
returns public.hero_settings
language plpgsql security invoker set search_path = '' as $$
declare draft public.hero_settings; published public.hero_settings;
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  select * into draft from public.hero_settings where record_type = 'draft';
  if draft.id is null then raise exception 'Save a Hero draft before publishing'; end if;
  if nullif(btrim(draft.heading), '') is null then raise exception 'Hero heading is required'; end if;
  if draft.poster_asset_id is null then raise exception 'A poster image is required for the Hero'; end if;
  if nullif(btrim(draft.poster_alt_text), '') is null then raise exception 'Meaningful poster alt text is required'; end if;
  if draft.background_video_asset_id is not null and not exists (select 1 from public.media_assets where id=draft.background_video_asset_id and media_type='video' and mime_type in ('video/mp4','video/webm')) then raise exception 'Unsupported background video asset'; end if;
  if draft.poster_asset_id is not null and not exists (select 1 from public.media_assets where id=draft.poster_asset_id and media_type='poster' and mime_type like 'image/%') then raise exception 'Unsupported poster asset'; end if;

  insert into public.hero_settings (
    record_type, heading, background_video_asset_id, poster_asset_id,
    poster_alt_text, video_enabled, loop_enabled, mobile_video_enabled, playback_rate,
    is_visible, published_at, updated_by
  ) values (
    'published', draft.heading, draft.background_video_asset_id,
    draft.poster_asset_id, draft.poster_alt_text, (draft.video_enabled and draft.background_video_asset_id is not null), draft.loop_enabled,
    draft.mobile_video_enabled, draft.playback_rate, draft.is_visible, now(), auth.uid()
  ) on conflict (record_type) do update set
    heading=excluded.heading,
    background_video_asset_id=excluded.background_video_asset_id, poster_asset_id=excluded.poster_asset_id,
    poster_alt_text=excluded.poster_alt_text, video_enabled=excluded.video_enabled,
    loop_enabled=excluded.loop_enabled, mobile_video_enabled=excluded.mobile_video_enabled,
    playback_rate=excluded.playback_rate,
    is_visible=excluded.is_visible, published_at=excluded.published_at, updated_by=excluded.updated_by
  returning * into published;
  return published;
end;
$$;

alter table public.media_assets enable row level security;
alter table public.hero_settings enable row level security;

create policy "Public can read public media metadata" on public.media_assets for select to anon, authenticated
using (is_public = true or (select private.is_active_homepage_admin()));
create policy "Active admins can insert media metadata" on public.media_assets for insert to authenticated
with check ((select private.is_active_homepage_admin()) and created_by = (select auth.uid()));
create policy "Active admins can update media metadata" on public.media_assets for update to authenticated
using ((select private.is_active_homepage_admin())) with check ((select private.is_active_homepage_admin()));
create policy "Active admins can delete media metadata" on public.media_assets for delete to authenticated
using ((select private.is_active_homepage_admin()) and not exists (
  select 1 from public.hero_settings h where h.background_video_asset_id=media_assets.id or h.poster_asset_id=media_assets.id
));

create policy "Public can read visible published Hero" on public.hero_settings for select to anon, authenticated
using ((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
create policy "Active admins can insert Hero" on public.hero_settings for insert to authenticated
with check ((select private.is_active_homepage_admin()));
create policy "Active admins can update Hero" on public.hero_settings for update to authenticated
using ((select private.is_active_homepage_admin())) with check ((select private.is_active_homepage_admin()));
create policy "Active admins can delete Hero" on public.hero_settings for delete to authenticated
using ((select private.is_active_homepage_admin()));

revoke all on public.media_assets, public.hero_settings from anon, authenticated;
grant select on public.media_assets, public.hero_settings to anon, authenticated;
grant insert, update, delete on public.media_assets, public.hero_settings to authenticated;
revoke all on function public.publish_hero_draft() from public;
grant execute on function public.publish_hero_draft() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homepage-media', 'homepage-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'])
on conflict (id) do update set public=true, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Public can retrieve homepage Hero media" on storage.objects;
drop policy if exists "Active admins can upload homepage Hero media" on storage.objects;
drop policy if exists "Active admins can update homepage Hero media" on storage.objects;
drop policy if exists "Active admins can delete homepage Hero media" on storage.objects;
create policy "Public can retrieve homepage Hero media" on storage.objects for select to anon, authenticated
using (bucket_id='homepage-media' and (storage.foldername(name))[1]='hero');
create policy "Active admins can upload homepage Hero media" on storage.objects for insert to authenticated
with check (bucket_id='homepage-media' and (storage.foldername(name))[1]='hero' and (select private.is_active_homepage_admin()));
create policy "Active admins can update homepage Hero media" on storage.objects for update to authenticated
using (bucket_id='homepage-media' and (storage.foldername(name))[1]='hero' and (select private.is_active_homepage_admin()))
with check (bucket_id='homepage-media' and (storage.foldername(name))[1]='hero' and (select private.is_active_homepage_admin()));
create policy "Active admins can delete homepage Hero media" on storage.objects for delete to authenticated
using (bucket_id='homepage-media' and (storage.foldername(name))[1]='hero' and (select private.is_active_homepage_admin()));
