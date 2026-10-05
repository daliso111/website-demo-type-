-- Hilltop Construction: Business Snapshot settings, statistics, and background media.
-- Run after 202607120005_featured_projects.sql.

create table if not exists public.business_snapshot_settings (
  id uuid primary key default gen_random_uuid(),
  record_type text not null default 'draft',
  eyebrow text,
  heading text,
  introduction text,
  background_video_asset_id uuid references public.media_assets(id) on delete set null,
  poster_asset_id uuid references public.media_assets(id) on delete set null,
  video_enabled boolean not null default true,
  loop_enabled boolean not null default true,
  mobile_video_enabled boolean not null default false,
  overlay_opacity numeric not null default 0.72,
  playback_rate numeric not null default 0.75,
  reduced_motion_fallback text not null default 'poster',
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(record_type)
);

alter table public.business_snapshot_settings add column if not exists id uuid default gen_random_uuid();
alter table public.business_snapshot_settings add column if not exists record_type text default 'draft';
alter table public.business_snapshot_settings add column if not exists eyebrow text;
alter table public.business_snapshot_settings add column if not exists heading text;
alter table public.business_snapshot_settings add column if not exists introduction text;
alter table public.business_snapshot_settings add column if not exists background_video_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.business_snapshot_settings add column if not exists poster_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.business_snapshot_settings add column if not exists video_enabled boolean default true;
alter table public.business_snapshot_settings add column if not exists loop_enabled boolean default true;
alter table public.business_snapshot_settings add column if not exists mobile_video_enabled boolean default false;
alter table public.business_snapshot_settings add column if not exists overlay_opacity numeric default 0.72;
alter table public.business_snapshot_settings add column if not exists playback_rate numeric default 0.75;
alter table public.business_snapshot_settings add column if not exists reduced_motion_fallback text default 'poster';
alter table public.business_snapshot_settings add column if not exists is_visible boolean default true;
alter table public.business_snapshot_settings add column if not exists published_at timestamptz;
alter table public.business_snapshot_settings add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();
alter table public.business_snapshot_settings add column if not exists updated_by uuid references auth.users(id) on delete set null default auth.uid();
alter table public.business_snapshot_settings add column if not exists created_at timestamptz default now();
alter table public.business_snapshot_settings add column if not exists updated_at timestamptz default now();

update public.business_snapshot_settings set record_type='draft' where record_type is null;
update public.business_snapshot_settings set video_enabled=true where video_enabled is null;
update public.business_snapshot_settings set loop_enabled=true where loop_enabled is null;
update public.business_snapshot_settings set mobile_video_enabled=false where mobile_video_enabled is null;
update public.business_snapshot_settings set overlay_opacity=0.72 where overlay_opacity is null;
update public.business_snapshot_settings set playback_rate=0.75 where playback_rate is null;
update public.business_snapshot_settings set reduced_motion_fallback='poster' where reduced_motion_fallback is null;
update public.business_snapshot_settings set is_visible=true where is_visible is null;
update public.business_snapshot_settings set created_at=now() where created_at is null;
update public.business_snapshot_settings set updated_at=now() where updated_at is null;

alter table public.business_snapshot_settings alter column record_type set not null;
alter table public.business_snapshot_settings alter column video_enabled set not null;
alter table public.business_snapshot_settings alter column loop_enabled set not null;
alter table public.business_snapshot_settings alter column mobile_video_enabled set not null;
alter table public.business_snapshot_settings alter column overlay_opacity set not null;
alter table public.business_snapshot_settings alter column playback_rate set not null;
alter table public.business_snapshot_settings alter column reduced_motion_fallback set not null;
alter table public.business_snapshot_settings alter column is_visible set not null;
alter table public.business_snapshot_settings alter column created_at set not null;
alter table public.business_snapshot_settings alter column updated_at set not null;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='business_snapshot_settings_record_type_check') then
    alter table public.business_snapshot_settings add constraint business_snapshot_settings_record_type_check check(record_type in ('draft','published'));
  end if;
  if not exists(select 1 from pg_constraint where conname='business_snapshot_settings_reduced_motion_check') then
    alter table public.business_snapshot_settings add constraint business_snapshot_settings_reduced_motion_check check(reduced_motion_fallback in ('poster','solid'));
  end if;
  if not exists(select 1 from pg_constraint where conname='business_snapshot_settings_overlay_check') then
    alter table public.business_snapshot_settings add constraint business_snapshot_settings_overlay_check check(overlay_opacity between 0 and 1);
  end if;
  if not exists(select 1 from pg_constraint where conname='business_snapshot_settings_playback_check') then
    alter table public.business_snapshot_settings add constraint business_snapshot_settings_playback_check check(playback_rate between 0.5 and 1);
  end if;
  if not exists(select 1 from pg_constraint where conname='business_snapshot_settings_background_video_asset_id_fkey') then
    alter table public.business_snapshot_settings add constraint business_snapshot_settings_background_video_asset_id_fkey foreign key(background_video_asset_id) references public.media_assets(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conname='business_snapshot_settings_poster_asset_id_fkey') then
    alter table public.business_snapshot_settings add constraint business_snapshot_settings_poster_asset_id_fkey foreign key(poster_asset_id) references public.media_assets(id) on delete set null;
  end if;
end $$;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='business_snapshot_settings_record_type_key') then
    alter table public.business_snapshot_settings add constraint business_snapshot_settings_record_type_key unique(record_type);
  end if;
end $$;
create index if not exists business_snapshot_settings_video_asset_idx on public.business_snapshot_settings(background_video_asset_id);
create index if not exists business_snapshot_settings_poster_asset_idx on public.business_snapshot_settings(poster_asset_id);

create table if not exists public.business_snapshot_statistics (
  id uuid primary key default gen_random_uuid(),
  statistic_key text not null,
  record_type text not null default 'draft' check(record_type in ('draft','published')),
  value text not null default '',
  prefix text,
  suffix text,
  description text,
  sort_order integer not null default 0 check(sort_order >= 0),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(statistic_key,record_type)
);

alter table public.business_snapshot_statistics add column if not exists statistic_key text;
alter table public.business_snapshot_statistics add column if not exists record_type text default 'draft';
alter table public.business_snapshot_statistics add column if not exists value text default '';
alter table public.business_snapshot_statistics add column if not exists prefix text;
alter table public.business_snapshot_statistics add column if not exists suffix text;
alter table public.business_snapshot_statistics add column if not exists description text;
alter table public.business_snapshot_statistics add column if not exists sort_order integer default 0;
alter table public.business_snapshot_statistics add column if not exists is_visible boolean default true;
alter table public.business_snapshot_statistics add column if not exists published_at timestamptz;
alter table public.business_snapshot_statistics add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();
alter table public.business_snapshot_statistics add column if not exists updated_by uuid references auth.users(id) on delete set null default auth.uid();
alter table public.business_snapshot_statistics add column if not exists created_at timestamptz default now();
alter table public.business_snapshot_statistics add column if not exists updated_at timestamptz default now();

update public.business_snapshot_statistics set statistic_key=coalesce(statistic_key,id::text) where statistic_key is null;
update public.business_snapshot_statistics set record_type='draft' where record_type is null;
update public.business_snapshot_statistics set value='' where value is null;
update public.business_snapshot_statistics set sort_order=0 where sort_order is null;
update public.business_snapshot_statistics set is_visible=true where is_visible is null;
update public.business_snapshot_statistics set created_at=now() where created_at is null;
update public.business_snapshot_statistics set updated_at=now() where updated_at is null;

alter table public.business_snapshot_statistics alter column statistic_key set not null;
alter table public.business_snapshot_statistics alter column record_type set not null;
alter table public.business_snapshot_statistics alter column value set not null;
alter table public.business_snapshot_statistics alter column sort_order set not null;
alter table public.business_snapshot_statistics alter column is_visible set not null;
alter table public.business_snapshot_statistics alter column created_at set not null;
alter table public.business_snapshot_statistics alter column updated_at set not null;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='business_snapshot_statistics_record_type_check') then
    alter table public.business_snapshot_statistics add constraint business_snapshot_statistics_record_type_check check(record_type in ('draft','published'));
  end if;
  if not exists(select 1 from pg_constraint where conname='business_snapshot_statistics_sort_order_check') then
    alter table public.business_snapshot_statistics add constraint business_snapshot_statistics_sort_order_check check(sort_order >= 0);
  end if;
end $$;

create unique index if not exists business_snapshot_statistics_key_type_key on public.business_snapshot_statistics(statistic_key,record_type);
create index if not exists business_snapshot_statistics_record_order_idx on public.business_snapshot_statistics(record_type,sort_order);

create or replace function private.set_business_snapshot_audit_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=now();
  new.updated_by=(select auth.uid());
  if tg_op='INSERT' then new.created_by=coalesce(new.created_by,(select auth.uid())); end if;
  if new.record_type='draft' then new.published_at=null; end if;
  return new;
end;
$$;

drop trigger if exists set_business_snapshot_settings_audit_fields on public.business_snapshot_settings;
create trigger set_business_snapshot_settings_audit_fields before insert or update on public.business_snapshot_settings
for each row execute function private.set_business_snapshot_audit_fields();
drop trigger if exists set_business_snapshot_statistics_audit_fields on public.business_snapshot_statistics;
create trigger set_business_snapshot_statistics_audit_fields before insert or update on public.business_snapshot_statistics
for each row execute function private.set_business_snapshot_audit_fields();

create or replace function public.publish_business_snapshot()
returns public.business_snapshot_settings
language plpgsql security invoker set search_path='' as $$
declare draft public.business_snapshot_settings; published public.business_snapshot_settings;
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  select * into draft from public.business_snapshot_settings where record_type='draft';
  if draft.id is null then raise exception 'Save a Business Snapshot draft before publishing'; end if;
  if nullif(btrim(draft.heading),'') is null then raise exception 'Business Snapshot heading is required'; end if;
  if draft.overlay_opacity not between 0 and 1 then raise exception 'Overlay opacity must be between 0 and 1'; end if;
  if draft.playback_rate not between 0.5 and 1 then raise exception 'Playback rate must be between 0.5 and 1'; end if;
  if draft.reduced_motion_fallback not in ('poster','solid') then raise exception 'Reduced-motion fallback must be poster or solid'; end if;
  if draft.video_enabled and draft.background_video_asset_id is null then raise exception 'A background video is required when video is enabled'; end if;
  if draft.video_enabled and draft.poster_asset_id is null then raise exception 'A poster image is required when video is enabled'; end if;
  if draft.background_video_asset_id is not null and not exists(
    select 1 from public.media_assets where id=draft.background_video_asset_id and media_type='video' and mime_type in ('video/mp4','video/webm')
  ) then raise exception 'Unsupported Business Snapshot video asset'; end if;
  if draft.poster_asset_id is not null and not exists(
    select 1 from public.media_assets where id=draft.poster_asset_id and media_type in ('poster','image') and mime_type in ('image/jpeg','image/png','image/webp','image/avif')
  ) then raise exception 'Unsupported Business Snapshot poster asset'; end if;
  if not exists(select 1 from public.business_snapshot_statistics where record_type='draft' and is_visible=true) then
    raise exception 'At least one visible Business Snapshot statistic is required';
  end if;

  insert into public.business_snapshot_settings(
    record_type,eyebrow,heading,introduction,background_video_asset_id,poster_asset_id,
    video_enabled,loop_enabled,mobile_video_enabled,overlay_opacity,playback_rate,
    reduced_motion_fallback,is_visible,published_at,created_by,updated_by
  ) values(
    'published',draft.eyebrow,draft.heading,draft.introduction,draft.background_video_asset_id,draft.poster_asset_id,
    draft.video_enabled,draft.loop_enabled,draft.mobile_video_enabled,draft.overlay_opacity,draft.playback_rate,
    draft.reduced_motion_fallback,draft.is_visible,now(),draft.created_by,auth.uid()
  ) on conflict(record_type) do update set
    eyebrow=excluded.eyebrow,heading=excluded.heading,introduction=excluded.introduction,
    background_video_asset_id=excluded.background_video_asset_id,poster_asset_id=excluded.poster_asset_id,
    video_enabled=excluded.video_enabled,loop_enabled=excluded.loop_enabled,mobile_video_enabled=excluded.mobile_video_enabled,
    overlay_opacity=excluded.overlay_opacity,playback_rate=excluded.playback_rate,
    reduced_motion_fallback=excluded.reduced_motion_fallback,is_visible=excluded.is_visible,
    published_at=excluded.published_at,updated_by=excluded.updated_by
  returning * into published;

  delete from public.business_snapshot_statistics where record_type='published';
  insert into public.business_snapshot_statistics(
    statistic_key,record_type,value,prefix,suffix,description,sort_order,is_visible,published_at,created_by,updated_by
  ) select statistic_key,'published',value,prefix,suffix,description,sort_order,is_visible,now(),created_by,auth.uid()
    from public.business_snapshot_statistics where record_type='draft' order by sort_order;
  return published;
end;
$$;

create or replace function public.unpublish_business_snapshot()
returns public.business_snapshot_settings
language plpgsql security invoker set search_path='' as $$
declare published public.business_snapshot_settings;
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  update public.business_snapshot_settings set is_visible=false
    where record_type='published' returning * into published;
  return published;
end;
$$;

alter table public.business_snapshot_settings enable row level security;
alter table public.business_snapshot_statistics enable row level security;

drop policy if exists "Public can read visible published Business Snapshot" on public.business_snapshot_settings;
create policy "Public can read visible published Business Snapshot" on public.business_snapshot_settings for select to anon,authenticated
using((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
drop policy if exists "Active admins can insert Business Snapshot" on public.business_snapshot_settings;
create policy "Active admins can insert Business Snapshot" on public.business_snapshot_settings for insert to authenticated
with check((select private.is_active_homepage_admin()));
drop policy if exists "Active admins can update Business Snapshot" on public.business_snapshot_settings;
create policy "Active admins can update Business Snapshot" on public.business_snapshot_settings for update to authenticated
using((select private.is_active_homepage_admin())) with check((select private.is_active_homepage_admin()));
drop policy if exists "Active admins can delete Business Snapshot" on public.business_snapshot_settings;
create policy "Active admins can delete Business Snapshot" on public.business_snapshot_settings for delete to authenticated
using((select private.is_active_homepage_admin()));

drop policy if exists "Public can read visible published Business Snapshot statistics" on public.business_snapshot_statistics;
create policy "Public can read visible published Business Snapshot statistics" on public.business_snapshot_statistics for select to anon,authenticated
using((record_type='published' and is_visible=true and exists(
  select 1 from public.business_snapshot_settings s where s.record_type='published' and s.is_visible=true
)) or (select private.is_active_homepage_admin()));
drop policy if exists "Active admins can insert Business Snapshot statistics" on public.business_snapshot_statistics;
create policy "Active admins can insert Business Snapshot statistics" on public.business_snapshot_statistics for insert to authenticated
with check((select private.is_active_homepage_admin()));
drop policy if exists "Active admins can update Business Snapshot statistics" on public.business_snapshot_statistics;
create policy "Active admins can update Business Snapshot statistics" on public.business_snapshot_statistics for update to authenticated
using((select private.is_active_homepage_admin())) with check((select private.is_active_homepage_admin()));
drop policy if exists "Active admins can delete Business Snapshot statistics" on public.business_snapshot_statistics;
create policy "Active admins can delete Business Snapshot statistics" on public.business_snapshot_statistics for delete to authenticated
using((select private.is_active_homepage_admin()));

revoke all on public.business_snapshot_settings,public.business_snapshot_statistics from anon,authenticated;
grant select on public.business_snapshot_settings,public.business_snapshot_statistics to anon,authenticated;
grant insert,update,delete on public.business_snapshot_settings,public.business_snapshot_statistics to authenticated;
revoke all on function public.publish_business_snapshot() from public;
revoke all on function public.unpublish_business_snapshot() from public;
grant execute on function public.publish_business_snapshot() to authenticated;
grant execute on function public.unpublish_business_snapshot() to authenticated;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public can retrieve Business Snapshot media') then
    execute 'create policy "Public can retrieve Business Snapshot media" on storage.objects for select to anon,authenticated using(bucket_id=''homepage-media'' and (storage.foldername(name))[1]=''business-snapshot'')';
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Active admins can upload Business Snapshot media') then
    execute 'create policy "Active admins can upload Business Snapshot media" on storage.objects for insert to authenticated with check(bucket_id=''homepage-media'' and (storage.foldername(name))[1]=''business-snapshot'' and (storage.foldername(name))[2] in (''videos'',''posters'') and (select private.is_active_homepage_admin()))';
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Active admins can update Business Snapshot media') then
    execute 'create policy "Active admins can update Business Snapshot media" on storage.objects for update to authenticated using(bucket_id=''homepage-media'' and (storage.foldername(name))[1]=''business-snapshot'' and (storage.foldername(name))[2] in (''videos'',''posters'') and (select private.is_active_homepage_admin())) with check(bucket_id=''homepage-media'' and (storage.foldername(name))[1]=''business-snapshot'' and (storage.foldername(name))[2] in (''videos'',''posters'') and (select private.is_active_homepage_admin()))';
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Active admins can delete Business Snapshot media') then
    execute 'create policy "Active admins can delete Business Snapshot media" on storage.objects for delete to authenticated using(bucket_id=''homepage-media'' and (storage.foldername(name))[1]=''business-snapshot'' and (storage.foldername(name))[2] in (''videos'',''posters'') and (select private.is_active_homepage_admin()))';
  end if;
end $$;

drop policy if exists "Active admins can delete media metadata" on public.media_assets;
create policy "Active admins can delete media metadata" on public.media_assets for delete to authenticated
using((select private.is_active_homepage_admin()) and not exists(
  select 1 from public.hero_settings h where h.background_video_asset_id=media_assets.id or h.poster_asset_id=media_assets.id
) and not exists(
  select 1 from public.featured_projects p where p.image_asset_id=media_assets.id
) and not exists(
  select 1 from public.business_snapshot_settings s where s.background_video_asset_id=media_assets.id or s.poster_asset_id=media_assets.id
));

insert into public.business_snapshot_settings(
  record_type,eyebrow,heading,introduction,video_enabled,loop_enabled,mobile_video_enabled,
  overlay_opacity,playback_rate,reduced_motion_fallback,is_visible
) values(
  'draft','Hilltop Construction at a glance','A snapshot of Hilltop Construction',
  'Practical experience, trusted partnerships, and disciplined project delivery shape the way we build.',
  true,true,false,0.72,0.75,'poster',true
) on conflict(record_type) do nothing;

insert into public.business_snapshot_statistics(statistic_key,record_type,value,prefix,suffix,description,sort_order,is_visible)
values
  ('experience','draft','[XX]','','+','Years of combined construction experience',1,true),
  ('projects','draft','[XXX]','','+','Projects successfully delivered',2,true),
  ('team','draft','[XX]','','','Skilled team members and trusted specialists',3,true),
  ('schedules','draft','[XX]','','%','Projects delivered within agreed schedules',4,true)
on conflict(statistic_key,record_type) do nothing;
