-- Point only the Why iProperties section to the confirmed property video.
-- The homepage hero video setting remains unchanged.

insert into public.app_settings (
  setting_key,
  setting_category,
  setting_value
)
values (
  'homepage_why_hero_video_url',
  'public_homepage',
  jsonb_build_object('url', '/assets/videos/why-iproperties-property-video.mp4')
)
on conflict (setting_key) do update
set
  setting_category = excluded.setting_category,
  setting_value = excluded.setting_value;
