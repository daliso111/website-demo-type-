-- Publish the approved iProperties background video for the Why section.
-- The dashboard already reads this setting and will show the same video in its
-- Website CMS preview, where an administrator can replace it later.

insert into public.app_settings (
  setting_key,
  setting_category,
  setting_value
)
values (
  'homepage_why_hero_video_url',
  'public_homepage',
  jsonb_build_object('url', '/assets/videos/why-iproperties-background.mp4')
)
on conflict (setting_key) do update
set
  setting_category = excluded.setting_category,
  setting_value = excluded.setting_value;
