-- Hilltop Construction: allow poster-only Heroes while keeping a poster required.
-- Updates databases that already ran 202607110002_hero_media_foundation.sql.

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
  if draft.background_video_asset_id is not null and not exists (
    select 1 from public.media_assets
    where id=draft.background_video_asset_id and media_type='video' and mime_type in ('video/mp4','video/webm')
  ) then raise exception 'Unsupported background video asset'; end if;
  if not exists (
    select 1 from public.media_assets
    where id=draft.poster_asset_id and media_type='poster' and mime_type like 'image/%'
  ) then raise exception 'Unsupported poster asset'; end if;

  insert into public.hero_settings (
    record_type, heading, background_video_asset_id, poster_asset_id,
    poster_alt_text, video_enabled, loop_enabled, mobile_video_enabled, playback_rate,
    is_visible, published_at, updated_by
  ) values (
    'published', draft.heading, draft.background_video_asset_id,
    draft.poster_asset_id, draft.poster_alt_text,
    (draft.video_enabled and draft.background_video_asset_id is not null), draft.loop_enabled,
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
