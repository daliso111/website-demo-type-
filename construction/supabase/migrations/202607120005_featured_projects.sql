-- Hilltop Construction: Featured Projects only.
-- Run after 202607110002_hero_media_foundation.sql.

create table if not exists public.featured_projects (
  id uuid primary key default gen_random_uuid(),
  project_key uuid not null,
  record_type text not null check (record_type in ('draft','published')),
  title text not null default '',
  description text,
  image_asset_id uuid references public.media_assets(id) on delete set null,
  image_alt text,
  button_label text,
  button_url text,
  layout text not null default 'image_left' check (layout in ('image_left','image_right')),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_key, record_type)
);

create index if not exists featured_projects_record_order_idx on public.featured_projects(record_type, sort_order);
create index if not exists featured_projects_image_asset_idx on public.featured_projects(image_asset_id);

create or replace function private.set_featured_project_audit_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=now(); new.updated_by=(select auth.uid());
  if tg_op='INSERT' then new.created_by=coalesce(new.created_by,(select auth.uid())); end if;
  if new.record_type='draft' then new.published_at=null; end if;
  return new;
end;
$$;

drop trigger if exists set_featured_project_audit_fields on public.featured_projects;
create trigger set_featured_project_audit_fields before insert or update on public.featured_projects
for each row execute function private.set_featured_project_audit_fields();

create or replace function public.publish_featured_projects()
returns setof public.featured_projects
language plpgsql security invoker set search_path='' as $$
declare invalid_project text; draft_count integer; visible_count integer;
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  select count(*),count(*) filter(where is_visible) into draft_count,visible_count from public.featured_projects where record_type='draft';
  if draft_count=0 or visible_count=0 then raise exception 'At least one visible Featured Project draft is required'; end if;
  select coalesce(title,project_key::text) into invalid_project from public.featured_projects
  where record_type='draft' and is_visible and (
    nullif(btrim(title),'') is null or image_asset_id is null or nullif(btrim(image_alt),'') is null
    or not exists(select 1 from public.media_assets m where m.id=featured_projects.image_asset_id and m.media_type='image' and m.mime_type like 'image/%')
    or layout not in ('image_left','image_right')
    or (button_url is not null and button_url !~ '^(#[^[:space:]]+|[A-Za-z][A-Za-z0-9+.-]*:[^[:space:]]+)$')
  ) limit 1;
  if invalid_project is not null then raise exception 'Featured Project "%" is incomplete or invalid',invalid_project; end if;
  if exists(select 1 from public.featured_projects where record_type='draft' group by sort_order having count(*)>1)
    then raise exception 'Featured Project ordering contains duplicates'; end if;

  delete from public.featured_projects p where p.record_type='published'
    and not exists(select 1 from public.featured_projects d where d.record_type='draft' and d.project_key=p.project_key);

  insert into public.featured_projects(project_key,record_type,title,description,image_asset_id,image_alt,button_label,button_url,layout,sort_order,is_visible,published_at,created_by,updated_by)
  select project_key,'published',title,description,image_asset_id,image_alt,button_label,button_url,layout,sort_order,is_visible,now(),created_by,auth.uid()
  from public.featured_projects where record_type='draft'
  on conflict(project_key,record_type) do update set
    title=excluded.title,description=excluded.description,image_asset_id=excluded.image_asset_id,image_alt=excluded.image_alt,
    button_label=excluded.button_label,button_url=excluded.button_url,layout=excluded.layout,sort_order=excluded.sort_order,
    is_visible=excluded.is_visible,published_at=excluded.published_at,updated_by=excluded.updated_by;
  return query select * from public.featured_projects where record_type='published' order by sort_order;
end;
$$;

create or replace function public.unpublish_featured_projects()
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  update public.featured_projects set is_visible=false where record_type='published';
end;
$$;

alter table public.featured_projects enable row level security;
create policy "Public can read visible published Featured Projects" on public.featured_projects for select to anon,authenticated
using ((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
create policy "Active admins can insert Featured Projects" on public.featured_projects for insert to authenticated
with check ((select private.is_active_homepage_admin()));
create policy "Active admins can update Featured Projects" on public.featured_projects for update to authenticated
using ((select private.is_active_homepage_admin())) with check ((select private.is_active_homepage_admin()));
create policy "Active admins can delete Featured Projects" on public.featured_projects for delete to authenticated
using ((select private.is_active_homepage_admin()));

revoke all on public.featured_projects from anon,authenticated;
grant select on public.featured_projects to anon,authenticated;
grant insert,update,delete on public.featured_projects to authenticated;
revoke all on function public.publish_featured_projects() from public;
revoke all on function public.unpublish_featured_projects() from public;
grant execute on function public.publish_featured_projects() to authenticated;
grant execute on function public.unpublish_featured_projects() to authenticated;

drop policy if exists "Public can retrieve Featured Project images" on storage.objects;
drop policy if exists "Active admins can upload Featured Project images" on storage.objects;
drop policy if exists "Active admins can update Featured Project images" on storage.objects;
drop policy if exists "Active admins can delete Featured Project images" on storage.objects;
create policy "Public can retrieve Featured Project images" on storage.objects for select to anon,authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='featured-projects' and (storage.foldername(name))[2]='images');
create policy "Active admins can upload Featured Project images" on storage.objects for insert to authenticated
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='featured-projects' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));
create policy "Active admins can update Featured Project images" on storage.objects for update to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='featured-projects' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()))
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='featured-projects' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));
create policy "Active admins can delete Featured Project images" on storage.objects for delete to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='featured-projects' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));

drop policy if exists "Active admins can delete media metadata" on public.media_assets;
create policy "Active admins can delete media metadata" on public.media_assets for delete to authenticated
using ((select private.is_active_homepage_admin()) and not exists(
  select 1 from public.hero_settings h where h.background_video_asset_id=media_assets.id or h.poster_asset_id=media_assets.id
) and not exists(
  select 1 from public.featured_projects p where p.image_asset_id=media_assets.id
));
