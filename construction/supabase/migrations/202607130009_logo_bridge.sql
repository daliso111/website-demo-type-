-- Hilltop Construction: Logo Bridge settings, partner logos, and logo uploads only.
-- Run after 202607130008_expertise_slides.sql.

create table if not exists public.logo_bridge_settings (
  id uuid primary key default gen_random_uuid(),
  record_type text not null default 'draft' check (record_type in ('draft','published')),
  eyebrow text not null default 'OUR PARTNERS',
  heading text not null default 'Built through strong partnerships',
  description text,
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_type)
);

create table if not exists public.logo_bridge_items (
  id uuid primary key default gen_random_uuid(),
  logo_key uuid not null default gen_random_uuid(),
  record_type text not null default 'draft' check (record_type in ('draft','published')),
  organization_name text not null default '',
  logo_asset_id uuid references public.media_assets(id) on delete set null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (logo_key,record_type)
);

create index if not exists logo_bridge_settings_record_idx on public.logo_bridge_settings(record_type);
create index if not exists logo_bridge_items_record_order_idx on public.logo_bridge_items(record_type,sort_order);
create index if not exists logo_bridge_items_asset_idx on public.logo_bridge_items(logo_asset_id);

create or replace function private.set_logo_bridge_audit_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=now();
  new.updated_by=(select auth.uid());
  if tg_op='INSERT' then new.created_by=coalesce(new.created_by,(select auth.uid())); end if;
  if new.record_type='draft' then new.published_at=null; end if;
  return new;
end;
$$;

drop trigger if exists set_logo_bridge_settings_audit_fields on public.logo_bridge_settings;
create trigger set_logo_bridge_settings_audit_fields before insert or update on public.logo_bridge_settings
for each row execute function private.set_logo_bridge_audit_fields();

drop trigger if exists set_logo_bridge_items_audit_fields on public.logo_bridge_items;
create trigger set_logo_bridge_items_audit_fields before insert or update on public.logo_bridge_items
for each row execute function private.set_logo_bridge_audit_fields();

create or replace function public.publish_logo_bridge()
returns setof public.logo_bridge_items
language plpgsql security invoker set search_path='' as $$
declare
  draft_settings public.logo_bridge_settings%rowtype;
  invalid_logo text;
  visible_count integer;
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;

  select * into draft_settings from public.logo_bridge_settings where record_type='draft';
  if not found then raise exception 'Save the Logo Bridge settings draft before publishing'; end if;
  if nullif(btrim(draft_settings.eyebrow),'') is null then raise exception 'The Logo Bridge eyebrow is required'; end if;
  if nullif(btrim(draft_settings.heading),'') is null then raise exception 'The Logo Bridge heading is required'; end if;

  select count(*) filter(where is_visible) into visible_count
  from public.logo_bridge_items where record_type='draft';
  if draft_settings.is_visible and visible_count=0 then
    raise exception 'At least one visible Logo Bridge logo draft is required';
  end if;

  select coalesce(nullif(btrim(i.organization_name),''),i.logo_key::text) into invalid_logo
  from public.logo_bridge_items i
  left join public.media_assets m on m.id=i.logo_asset_id
  where i.record_type='draft' and (
    (
      i.is_visible and (
        nullif(btrim(i.organization_name),'') is null
        or i.logo_asset_id is null
        or nullif(btrim(i.alt_text),'') is null
        or length(btrim(i.alt_text))<4
        or m.id is null
        or m.media_type<>'image'
        or m.mime_type not in ('image/jpeg','image/png','image/webp','image/avif')
      )
    )
    or lower(i.organization_name) like '%placeholder%'
    or lower(coalesce(i.alt_text,'')) like '%placeholder%'
    or lower(coalesce(m.original_filename,'')) like '%placeholder%'
  ) limit 1;
  if invalid_logo is not null then raise exception 'Logo Bridge item "%" is incomplete, invalid, or placeholder content',invalid_logo; end if;

  if exists(
    select 1 from public.logo_bridge_items where record_type='draft'
    group by sort_order having count(*)>1
  ) then raise exception 'Logo Bridge ordering contains duplicates'; end if;

  insert into public.logo_bridge_settings(
    record_type,eyebrow,heading,description,is_visible,published_at,created_by,updated_by
  ) values (
    'published',draft_settings.eyebrow,draft_settings.heading,draft_settings.description,
    draft_settings.is_visible,now(),draft_settings.created_by,auth.uid()
  )
  on conflict(record_type) do update set
    eyebrow=excluded.eyebrow,
    heading=excluded.heading,
    description=excluded.description,
    is_visible=excluded.is_visible,
    published_at=excluded.published_at,
    updated_by=excluded.updated_by;

  delete from public.logo_bridge_items p
  where p.record_type='published' and not exists(
    select 1 from public.logo_bridge_items d
    where d.record_type='draft' and d.logo_key=p.logo_key
  );

  insert into public.logo_bridge_items(
    logo_key,record_type,organization_name,logo_asset_id,alt_text,
    sort_order,is_visible,published_at,created_by,updated_by
  )
  select
    logo_key,'published',organization_name,logo_asset_id,alt_text,
    sort_order,is_visible,now(),created_by,auth.uid()
  from public.logo_bridge_items where record_type='draft'
  on conflict(logo_key,record_type) do update set
    organization_name=excluded.organization_name,
    logo_asset_id=excluded.logo_asset_id,
    alt_text=excluded.alt_text,
    sort_order=excluded.sort_order,
    is_visible=excluded.is_visible,
    published_at=excluded.published_at,
    updated_by=excluded.updated_by;

  return query select * from public.logo_bridge_items
  where record_type='published' order by sort_order;
end;
$$;

create or replace function public.unpublish_logo_bridge()
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  update public.logo_bridge_settings set is_visible=false where record_type='published';
end;
$$;

alter table public.logo_bridge_settings enable row level security;
alter table public.logo_bridge_items enable row level security;

drop policy if exists "Public can read visible published Logo Bridge settings" on public.logo_bridge_settings;
create policy "Public can read visible published Logo Bridge settings" on public.logo_bridge_settings for select to anon,authenticated
using ((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
drop policy if exists "Active editors can insert Logo Bridge settings" on public.logo_bridge_settings;
create policy "Active editors can insert Logo Bridge settings" on public.logo_bridge_settings for insert to authenticated
with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can update Logo Bridge settings" on public.logo_bridge_settings;
create policy "Active editors can update Logo Bridge settings" on public.logo_bridge_settings for update to authenticated
using ((select private.is_active_homepage_admin())) with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can delete Logo Bridge settings" on public.logo_bridge_settings;
create policy "Active editors can delete Logo Bridge settings" on public.logo_bridge_settings for delete to authenticated
using ((select private.is_active_homepage_admin()));

drop policy if exists "Public can read visible published Logo Bridge items" on public.logo_bridge_items;
create policy "Public can read visible published Logo Bridge items" on public.logo_bridge_items for select to anon,authenticated
using ((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
drop policy if exists "Active editors can insert Logo Bridge items" on public.logo_bridge_items;
create policy "Active editors can insert Logo Bridge items" on public.logo_bridge_items for insert to authenticated
with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can update Logo Bridge items" on public.logo_bridge_items;
create policy "Active editors can update Logo Bridge items" on public.logo_bridge_items for update to authenticated
using ((select private.is_active_homepage_admin())) with check ((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can delete Logo Bridge items" on public.logo_bridge_items;
create policy "Active editors can delete Logo Bridge items" on public.logo_bridge_items for delete to authenticated
using ((select private.is_active_homepage_admin()));

revoke all on public.logo_bridge_settings from anon,authenticated;
revoke all on public.logo_bridge_items from anon,authenticated;
grant select on public.logo_bridge_settings to anon,authenticated;
grant select on public.logo_bridge_items to anon,authenticated;
grant insert,update,delete on public.logo_bridge_settings to authenticated;
grant insert,update,delete on public.logo_bridge_items to authenticated;
revoke all on function public.publish_logo_bridge() from public;
revoke all on function public.unpublish_logo_bridge() from public;
grant execute on function public.publish_logo_bridge() to authenticated;
grant execute on function public.unpublish_logo_bridge() to authenticated;

drop policy if exists "Public can retrieve published Logo Bridge logos" on storage.objects;
drop policy if exists "Active editors can upload Logo Bridge logos" on storage.objects;
drop policy if exists "Active editors can update Logo Bridge logos" on storage.objects;
drop policy if exists "Active editors can delete Logo Bridge logos" on storage.objects;
create policy "Public can retrieve published Logo Bridge logos" on storage.objects for select to anon,authenticated
using(
  bucket_id='homepage-media'
  and (storage.foldername(name))[1]='logo-bridge'
  and (storage.foldername(name))[2]='logos'
  and (
    (select private.is_active_homepage_admin())
    or exists(
      select 1 from public.media_assets m
      join public.logo_bridge_items i on i.logo_asset_id=m.id
      join public.logo_bridge_settings s on s.record_type='published' and s.is_visible=true
      where m.bucket_name=storage.objects.bucket_id and m.storage_path=storage.objects.name
        and i.record_type='published' and i.is_visible=true
    )
  )
);
create policy "Active editors can upload Logo Bridge logos" on storage.objects for insert to authenticated
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='logo-bridge' and (storage.foldername(name))[2]='logos' and (select private.is_active_homepage_admin()));
create policy "Active editors can update Logo Bridge logos" on storage.objects for update to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='logo-bridge' and (storage.foldername(name))[2]='logos' and (select private.is_active_homepage_admin()))
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='logo-bridge' and (storage.foldername(name))[2]='logos' and (select private.is_active_homepage_admin()));
create policy "Active editors can delete Logo Bridge logos" on storage.objects for delete to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='logo-bridge' and (storage.foldername(name))[2]='logos' and (select private.is_active_homepage_admin()));

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
) and not exists(
  select 1 from public.logo_bridge_items l where l.logo_asset_id=media_assets.id
));

insert into public.logo_bridge_settings(record_type,eyebrow,heading,description,is_visible)
values(
  'draft','OUR PARTNERS','Built through strong partnerships',
  'We work closely with clients, consultants, suppliers, and skilled trades to deliver dependable construction work.',true
)
on conflict(record_type) do nothing;
