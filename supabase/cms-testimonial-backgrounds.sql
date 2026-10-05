-- Hilltop Properties Zambia
-- Add carousel background support to CMS testimonials.

alter table if exists public.cms_testimonials
  add column if not exists background_type text not null default 'solid',
  add column if not exists background_image_url text,
  add column if not exists background_color text not null default '#071827';

alter table if exists public.cms_testimonials
  drop constraint if exists cms_testimonials_background_type_check;

update public.cms_testimonials
set
  background_type = case
    when background_type in ('image', 'solid') then background_type
    else 'solid'
  end,
  background_color = coalesce(nullif(background_color, ''), '#071827')
where background_type is null
   or background_type = ''
   or background_type not in ('image', 'solid')
   or background_color is null
   or background_color = '';

with ranked_testimonials as (
  select
    id,
    row_number() over (order by display_order asc, created_at asc) as rn
  from public.cms_testimonials
)
update public.cms_testimonials t
set
  background_type = case when r.rn <= 2 then 'image' else 'solid' end,
  background_image_url = case
    when r.rn <= 2 then coalesce(nullif(t.background_image_url, ''), 'assets/images/hero-poster.png')
    else t.background_image_url
  end,
  background_color = case
    when r.rn = 4 then '#132c46'
    else coalesce(nullif(t.background_color, ''), '#071827')
  end
from ranked_testimonials r
where t.id = r.id
  and (t.background_image_url is null or t.background_image_url = '');

alter table if exists public.cms_testimonials
  add constraint cms_testimonials_background_type_check
  check (background_type in ('image', 'solid'));

create index if not exists idx_cms_testimonials_background_type
on public.cms_testimonials(background_type);

grant select (
  id,
  client_name,
  client_role,
  message,
  rating,
  background_type,
  background_image_url,
  background_color,
  display_order,
  is_visible
) on public.cms_testimonials to anon;
