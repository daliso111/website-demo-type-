-- Fictional Zimbabwe demo testimonials supplied for the reusable website demo.
-- The background images are bundled with the public website assets so these
-- records remain editable and visible in the Website CMS dashboard.

insert into public.cms_testimonials (
  id,
  client_name,
  client_role,
  message,
  rating,
  background_type,
  background_image_url,
  background_color,
  is_visible,
  display_order
)
values
  (
    '9d147d7a-ec2e-4eb4-8f39-b1ba92650401',
    'Tendai Moyo',
    'First-time buyer, Harare',
    'I had spent a few weekends following up on adverts that went nowhere. With iProperties, the viewing happened when they said it would, the costs were explained upfront, and nobody rushed me. I found a place in Harare that actually suited my budget.',
    5,
    'image',
    'assets/images/testimonial-tendai-harare.jpeg',
    '#071827',
    true,
    1
  ),
  (
    '9d147d7a-ec2e-4eb4-8f39-b1ba92650402',
    'Rudo Ncube',
    'Landlord, Bulawayo',
    'I manage my Bulawayo property while working outside Zimbabwe, so communication matters. They sent updates without me having to chase, explained the paperwork, and checked in after the tenant moved in. That consistency made a big difference.',
    5,
    'image',
    'assets/images/testimonial-rudo-bulawayo.jpeg',
    '#071827',
    true,
    2
  )
on conflict (id) do update
set
  client_name = excluded.client_name,
  client_role = excluded.client_role,
  message = excluded.message,
  rating = excluded.rating,
  background_type = excluded.background_type,
  background_image_url = excluded.background_image_url,
  background_color = excluded.background_color,
  is_visible = excluded.is_visible,
  display_order = excluded.display_order,
  updated_at = now();
