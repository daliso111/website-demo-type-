-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - OPTIONAL SAMPLE PUBLIC DATA
--
-- Run this manually in Supabase SQL Editor only if you need a
-- safe public test branch/property for website verification.
--
-- This is sample/test data, not production content.
--
-- Safety:
-- - Does not delete anything.
-- - Does not insert private property documents.
-- - Does not set assigned_agent_id.
-- - Creates a branch only if no branches exist.
-- - Creates/updates one clearly marked Active sample property.
-- ============================================================

with existing_branch as (
  select id
  from public.branches
  order by created_at asc
  limit 1
),
inserted_branch as (
  insert into public.branches (
    id,
    name,
    address,
    contact_number
  )
  select
    '33333333-3333-3333-3333-333333333333',
    'Sample Public Test Branch',
    'Sample public test address, Zambia',
    '+260 211 000 000'
  where not exists (select 1 from existing_branch)
  on conflict (name) do update
  set address = excluded.address,
      contact_number = excluded.contact_number
  returning id
),
chosen_branch as (
  select id from existing_branch
  union all
  select id from inserted_branch
  limit 1
)
insert into public.properties (
  id,
  reference_number,
  title,
  description,
  price,
  purpose,
  property_type,
  branch_id,
  area,
  full_address,
  bedrooms,
  bathrooms,
  garages,
  square_metres,
  status,
  featured,
  amenities,
  virtual_tour_link,
  youtube_link,
  assigned_agent_id
)
select
  '30000000-0000-0000-0000-000000000001',
  'HT-SAMPLE-001',
  'Sample Public Test Property',
  'Sample listing for testing the public website pipeline. Replace or archive before production launch.',
  1250000.00,
  'For Sale',
  'House',
  chosen_branch.id,
  'Sample Area',
  'Sample public test address, Zambia',
  3,
  2,
  1,
  180,
  'Active',
  true,
  array['Sample listing', 'Public website test'],
  null,
  null,
  null
from chosen_branch
on conflict (reference_number) do update
set title = excluded.title,
    description = excluded.description,
    price = excluded.price,
    purpose = excluded.purpose,
    property_type = excluded.property_type,
    branch_id = excluded.branch_id,
    area = excluded.area,
    full_address = excluded.full_address,
    bedrooms = excluded.bedrooms,
    bathrooms = excluded.bathrooms,
    garages = excluded.garages,
    square_metres = excluded.square_metres,
    status = excluded.status,
    featured = excluded.featured,
    amenities = excluded.amenities,
    virtual_tour_link = excluded.virtual_tour_link,
    youtube_link = excluded.youtube_link,
    assigned_agent_id = null;

insert into public.property_images (
  property_id,
  image_url,
  display_order,
  is_cover
)
select
  '30000000-0000-0000-0000-000000000001',
  'https://placehold.co/1200x800/0d1b2a/ffffff?text=Hilltop+Sample+Property',
  1,
  true
where not exists (
  select 1
  from public.property_images
  where property_id = '30000000-0000-0000-0000-000000000001'
    and image_url = 'https://placehold.co/1200x800/0d1b2a/ffffff?text=Hilltop+Sample+Property'
);

-- Quick confirmation after running the optional sample insert.
select
  p.id,
  p.reference_number,
  p.title,
  p.status,
  p.featured,
  p.branch_id,
  b.name as branch_name
from public.properties p
join public.branches b on b.id = p.branch_id
where p.reference_number = 'HT-SAMPLE-001';
