-- Hilltop Construction: Logo Bridge entries are display-only, never links.
-- Keeps databases that already ran 202607130009_logo_bridge.sql in sync.

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

alter table public.logo_bridge_items
  drop column if exists destination_url,
  drop column if exists open_in_new_tab;

