-- Hilltop Construction: Expertise section settings, slides, and images only.
-- Run after 202607130007_news_foresight.sql.

create table if not exists public.expertise_section_settings (
  id uuid primary key default gen_random_uuid(),
  record_type text not null default 'draft' check (record_type in ('draft','published')),
  section_label text not null default 'OUR EXPERTISE',
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_type)
);

create table if not exists public.expertise_slides (
  id uuid primary key default gen_random_uuid(),
  slide_key uuid not null default gen_random_uuid(),
  record_type text not null default 'draft' check (record_type in ('draft','published')),
  eyebrow text,
  heading text not null default '',
  description text,
  cta_label text,
  cta_url text,
  background_image_asset_id uuid references public.media_assets(id) on delete set null,
  image_alt text,
  focal_x numeric(5,2) not null default 50 check (focal_x between 0 and 100),
  focal_y numeric(5,2) not null default 50 check (focal_y between 0 and 100),
  overlay_opacity numeric(4,3) not null default 0.45 check (overlay_opacity between 0 and 1),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slide_key,record_type)
);

create index if not exists expertise_settings_record_idx on public.expertise_section_settings(record_type);
create index if not exists expertise_slides_record_order_idx on public.expertise_slides(record_type,sort_order);
create index if not exists expertise_slides_image_asset_idx on public.expertise_slides(background_image_asset_id);

create or replace function private.set_expertise_settings_audit_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=now();
  new.updated_by=(select auth.uid());
  if tg_op='INSERT' then new.created_by=coalesce(new.created_by,(select auth.uid())); end if;
  if new.record_type='draft' then new.published_at=null; end if;
  return new;
end;
$$;

create or replace function private.set_expertise_slide_audit_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=now();
  new.updated_by=(select auth.uid());
  if tg_op='INSERT' then new.created_by=coalesce(new.created_by,(select auth.uid())); end if;
  if new.record_type='draft' then new.published_at=null; end if;
  return new;
end;
$$;

drop trigger if exists set_expertise_settings_audit_fields on public.expertise_section_settings;
create trigger set_expertise_settings_audit_fields before insert or update on public.expertise_section_settings
for each row execute function private.set_expertise_settings_audit_fields();

drop trigger if exists set_expertise_slide_audit_fields on public.expertise_slides;
create trigger set_expertise_slide_audit_fields before insert or update on public.expertise_slides
for each row execute function private.set_expertise_slide_audit_fields();

create or replace function public.publish_expertise_section()
returns setof public.expertise_slides
language plpgsql security invoker set search_path='' as $$
declare
  draft_settings public.expertise_section_settings%rowtype;
  invalid_slide text;
  visible_count integer;
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;

  select * into draft_settings
  from public.expertise_section_settings
  where record_type='draft';
  if not found then raise exception 'Save the Expertise section settings draft before publishing'; end if;
  if nullif(btrim(draft_settings.section_label),'') is null then
    raise exception 'The Expertise section label is required';
  end if;

  select count(*) filter (where is_visible) into visible_count
  from public.expertise_slides where record_type='draft';
  if visible_count=0 then raise exception 'At least one visible Expertise slide draft is required'; end if;

  select coalesce(nullif(btrim(heading),''),slide_key::text) into invalid_slide
  from public.expertise_slides
  where record_type='draft' and is_visible and (
    nullif(btrim(heading),'') is null
    or nullif(btrim(description),'') is null
    or background_image_asset_id is null
    or nullif(btrim(image_alt),'') is null
    or length(btrim(image_alt))<5
    or (nullif(btrim(cta_url),'') is not null and cta_url !~ '^(#[^[:space:]]+|[A-Za-z][A-Za-z0-9+.-]*:[^[:space:]]+)$')
    or focal_x not between 0 and 100
    or focal_y not between 0 and 100
    or overlay_opacity not between 0 and 1
    or not exists(
      select 1 from public.media_assets m
      where m.id=expertise_slides.background_image_asset_id
        and m.media_type='image'
        and m.mime_type in ('image/jpeg','image/png','image/webp','image/avif')
    )
  ) limit 1;
  if invalid_slide is not null then
    raise exception 'Expertise slide "%" is incomplete or invalid',invalid_slide;
  end if;

  if exists(
    select 1 from public.expertise_slides
    where record_type='draft'
    group by sort_order having count(*)>1
  ) then raise exception 'Expertise slide ordering contains duplicates'; end if;

  insert into public.expertise_section_settings(
    record_type,section_label,is_visible,published_at,created_by,updated_by
  ) values (
    'published',draft_settings.section_label,draft_settings.is_visible,now(),draft_settings.created_by,auth.uid()
  )
  on conflict(record_type) do update set
    section_label=excluded.section_label,
    is_visible=excluded.is_visible,
    published_at=excluded.published_at,
    updated_by=excluded.updated_by;

  delete from public.expertise_slides p
  where p.record_type='published' and not exists(
    select 1 from public.expertise_slides d
    where d.record_type='draft' and d.slide_key=p.slide_key
  );

  insert into public.expertise_slides(
    slide_key,record_type,eyebrow,heading,description,cta_label,cta_url,
    background_image_asset_id,image_alt,focal_x,focal_y,overlay_opacity,
    sort_order,is_visible,published_at,created_by,updated_by
  )
  select
    slide_key,'published',eyebrow,heading,description,cta_label,cta_url,
    background_image_asset_id,image_alt,focal_x,focal_y,overlay_opacity,
    sort_order,is_visible,now(),created_by,auth.uid()
  from public.expertise_slides where record_type='draft'
  on conflict(slide_key,record_type) do update set
    eyebrow=excluded.eyebrow,
    heading=excluded.heading,
    description=excluded.description,
    cta_label=excluded.cta_label,
    cta_url=excluded.cta_url,
    background_image_asset_id=excluded.background_image_asset_id,
    image_alt=excluded.image_alt,
    focal_x=excluded.focal_x,
    focal_y=excluded.focal_y,
    overlay_opacity=excluded.overlay_opacity,
    sort_order=excluded.sort_order,
    is_visible=excluded.is_visible,
    published_at=excluded.published_at,
    updated_by=excluded.updated_by;

  return query select * from public.expertise_slides
    where record_type='published' order by sort_order;
end;
$$;

create or replace function public.unpublish_expertise_section()
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  update public.expertise_section_settings set is_visible=false where record_type='published';
end;
$$;

alter table public.expertise_section_settings enable row level security;
alter table public.expertise_slides enable row level security;

drop policy if exists "Public can read visible published Expertise settings" on public.expertise_section_settings;
create policy "Public can read visible published Expertise settings" on public.expertise_section_settings for select to anon,authenticated
using ((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
drop policy if exists "Active editors can insert Expertise settings" on public.expertise_section_settings;
create policy "Active editors can insert Expertise settings" on public.expertise_section_settings for insert to authenticated
with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can update Expertise settings" on public.expertise_section_settings;
create policy "Active editors can update Expertise settings" on public.expertise_section_settings for update to authenticated
using ((select private.is_active_homepage_admin())) with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can delete Expertise settings" on public.expertise_section_settings;
create policy "Active editors can delete Expertise settings" on public.expertise_section_settings for delete to authenticated
using ((select private.is_active_homepage_admin()));

drop policy if exists "Public can read visible published Expertise slides" on public.expertise_slides;
create policy "Public can read visible published Expertise slides" on public.expertise_slides for select to anon,authenticated
using ((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
drop policy if exists "Active editors can insert Expertise slides" on public.expertise_slides;
create policy "Active editors can insert Expertise slides" on public.expertise_slides for insert to authenticated
with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can update Expertise slides" on public.expertise_slides;
create policy "Active editors can update Expertise slides" on public.expertise_slides for update to authenticated
using ((select private.is_active_homepage_admin())) with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can delete Expertise slides" on public.expertise_slides;
create policy "Active editors can delete Expertise slides" on public.expertise_slides for delete to authenticated
using ((select private.is_active_homepage_admin()));

revoke all on public.expertise_section_settings from anon,authenticated;
revoke all on public.expertise_slides from anon,authenticated;
grant select on public.expertise_section_settings to anon,authenticated;
grant select on public.expertise_slides to anon,authenticated;
grant insert,update,delete on public.expertise_section_settings to authenticated;
grant insert,update,delete on public.expertise_slides to authenticated;
revoke all on function public.publish_expertise_section() from public;
revoke all on function public.unpublish_expertise_section() from public;
grant execute on function public.publish_expertise_section() to authenticated;
grant execute on function public.unpublish_expertise_section() to authenticated;

drop policy if exists "Public can retrieve Expertise images" on storage.objects;
drop policy if exists "Active editors can upload Expertise images" on storage.objects;
drop policy if exists "Active editors can update Expertise images" on storage.objects;
drop policy if exists "Active editors can delete Expertise images" on storage.objects;
create policy "Public can retrieve Expertise images" on storage.objects for select to anon,authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='expertise' and (storage.foldername(name))[2]='images');
create policy "Active editors can upload Expertise images" on storage.objects for insert to authenticated
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='expertise' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));
create policy "Active editors can update Expertise images" on storage.objects for update to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='expertise' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()))
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='expertise' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));
create policy "Active editors can delete Expertise images" on storage.objects for delete to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='expertise' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));

drop policy if exists "Active admins can delete media metadata" on public.media_assets;
create policy "Active admins can delete media metadata" on public.media_assets for delete to authenticated
using((select private.is_active_homepage_admin()) and not exists(
  select 1 from public.hero_settings h where h.background_video_asset_id=media_assets.id or h.poster_asset_id=media_assets.id
) and not exists(
  select 1 from public.featured_projects p where p.image_asset_id=media_assets.id
) and not exists(
  select 1 from public.business_snapshot_settings s where s.background_video_asset_id=media_assets.id or s.poster_asset_id=media_assets.id
) and not exists(
  select 1 from public.news_articles n where n.image_asset_id=media_assets.id
) and not exists(
  select 1 from public.expertise_slides e where e.background_image_asset_id=media_assets.id
));
