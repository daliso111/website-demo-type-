-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - SAMPLE SEED DATA
-- Matches the current frontend demo data where practical.
-- Run after schema.sql.
-- ============================================================

insert into public.branches (id, name, address, contact_number)
values
  ('11111111-1111-1111-1111-111111111111', 'Lusaka', 'Kabulonga, Lusaka, Zambia', '+260 979 972019'),
  ('22222222-2222-2222-2222-222222222222', 'Livingstone', 'Mosi-oa-Tunya Road, Livingstone, Zambia', '+260 979 328 997')
on conflict (name) do update
set address = excluded.address,
    contact_number = excluded.contact_number;

insert into public.staff_users (id, full_name, email, phone, role, branch_id, is_active)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin User', 'admin@hilltopproperties.co.zm', '+260 977 000 001', 'super_admin', '11111111-1111-1111-1111-111111111111', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'John Phiri', 'john.phiri@hilltopproperties.co.zm', '+260 977 000 002', 'branch_manager', '11111111-1111-1111-1111-111111111111', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mary Banda', 'mary.banda@hilltopproperties.co.zm', '+260 977 000 003', 'agent', '11111111-1111-1111-1111-111111111111', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'David Mwale', 'david.mwale@hilltopproperties.co.zm', '+260 977 000 004', 'branch_manager', '22222222-2222-2222-2222-222222222222', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Grace Mbewe', 'grace.mbewe@hilltopproperties.co.zm', '+260 977 000 005', 'agent', '22222222-2222-2222-2222-222222222222', true)
on conflict (email) do update
set full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role,
    branch_id = excluded.branch_id,
    is_active = excluded.is_active;

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
values
  (
    '10000000-0000-0000-0000-000000000001',
    'HT-LSK-001',
    '4-Bedroom Executive House in Kabulonga',
    'Stunning executive residence in the prestigious Kabulonga area. Features high ceilings, modern finishes, and a private garden.',
    2400000.00,
    'For Sale',
    'House',
    '11111111-1111-1111-1111-111111111111',
    'Kabulonga',
    'Plot 18, Lilayi Road, Kabulonga, Lusaka',
    4,
    3,
    2,
    320,
    'Active',
    true,
    array['Pool', 'Garden', 'Security', 'Borehole'],
    null,
    null,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'HT-LSK-002',
    '2-Bedroom Apartment in Levy Junction',
    'Modern apartment in the Levy Junction complex. Perfect for young professionals.',
    8500.00,
    'For Rent',
    'Apartment',
    '11111111-1111-1111-1111-111111111111',
    'Levy Junction',
    'Levy Junction Complex, Lusaka',
    2,
    2,
    1,
    95,
    'Active',
    false,
    array['Gym', 'Security', 'Parking'],
    null,
    null,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'HT-LSK-003',
    'Commercial Office Space - Cairo Road',
    'Premium Grade-A office space in the heart of Lusaka business district.',
    22000.00,
    'For Rent',
    'Commercial',
    '11111111-1111-1111-1111-111111111111',
    'Cairo Road',
    'Cairo Road Central, Lusaka',
    0,
    2,
    4,
    450,
    'Under Offer',
    false,
    array['Parking', 'Reception', 'Server Room'],
    null,
    null,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'HT-LSK-004',
    '5-Bedroom Mansion - Roma',
    'Grand family mansion in the sought-after Roma neighbourhood.',
    5800000.00,
    'For Sale',
    'House',
    '11111111-1111-1111-1111-111111111111',
    'Roma',
    'Roma, Lusaka',
    5,
    4,
    3,
    560,
    'Sold',
    false,
    array['Pool', 'Garden', 'Staff Quarters', 'Solar Power'],
    null,
    null,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'HT-LSK-005',
    '1-Acre Residential Plot - Chalala',
    'Prime residential plot in Chalala. Fully serviced with tarred road access.',
    980000.00,
    'For Sale',
    'Land',
    '11111111-1111-1111-1111-111111111111',
    'Chalala',
    'Chalala Residential Area, Lusaka',
    0,
    0,
    0,
    4047,
    'Active',
    false,
    array['Title Deed', 'Serviced'],
    null,
    null,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'HT-LSK-006',
    '3-Bedroom House in Woodlands',
    'Comfortable family home in a quiet Woodlands street. Recently renovated.',
    1350000.00,
    'For Sale',
    'House',
    '11111111-1111-1111-1111-111111111111',
    'Woodlands',
    'Woodlands Extension, Lusaka',
    3,
    2,
    1,
    210,
    'Draft',
    false,
    array['Garden', 'Borehole'],
    null,
    null,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    'HT-LVN-001',
    '3-Bedroom Cottage - Livingstone Central',
    'Charming cottage ideal for tourism or expat use, close to the Zambezi.',
    6200.00,
    'For Rent',
    'House',
    '22222222-2222-2222-2222-222222222222',
    'Livingstone Central',
    'Mosi-oa-Tunya Road, Livingstone',
    3,
    2,
    1,
    150,
    'Let / Rented',
    false,
    array['Garden', 'Security'],
    null,
    null,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    'HT-LVN-002',
    'Riverside Lodge Plot - Victoria Falls',
    'Rare riverside plot with uninterrupted views of the Zambezi. Exceptional investment opportunity.',
    3200000.00,
    'For Sale',
    'Land',
    '22222222-2222-2222-2222-222222222222',
    'Victoria Falls',
    'Riverside Area, Livingstone',
    0,
    0,
    0,
    8000,
    'Active',
    true,
    array['River Frontage', 'Title Deed'],
    null,
    null,
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ),
  (
    '10000000-0000-0000-0000-000000000009',
    'HT-LVN-003',
    '2-Bedroom Apartment - Livingstone Central',
    'Neat, well-maintained apartment near the Livingstone town centre.',
    5500.00,
    'For Rent',
    'Apartment',
    '22222222-2222-2222-2222-222222222222',
    'Livingstone Central',
    'Independence Avenue, Livingstone',
    2,
    1,
    1,
    88,
    'Active',
    false,
    array['Security', 'Parking'],
    null,
    null,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    'HT-LVN-004',
    'Commercial Guesthouse - Maramba',
    'Established guesthouse with full hospitality infrastructure near Victoria Falls.',
    4800000.00,
    'For Sale',
    'Commercial',
    '22222222-2222-2222-2222-222222222222',
    'Maramba',
    'Maramba Area, Livingstone',
    8,
    8,
    4,
    600,
    'Under Offer',
    true,
    array['Pool', 'Restaurant Space', 'Conference Room'],
    null,
    null,
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
  )
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
    assigned_agent_id = excluded.assigned_agent_id;

insert into public.property_images (property_id, image_url, display_order, is_cover)
values
  ('10000000-0000-0000-0000-000000000001', 'https://example.com/images/ht-lsk-001-cover.jpg', 1, true),
  ('10000000-0000-0000-0000-000000000002', 'https://example.com/images/ht-lsk-002-cover.jpg', 1, true),
  ('10000000-0000-0000-0000-000000000008', 'https://example.com/images/ht-lvn-002-cover.jpg', 1, true)
on conflict do nothing;

insert into public.property_documents (property_id, document_name, document_type, document_url)
values
  ('10000000-0000-0000-0000-000000000001', 'Kabulonga Floor Plan', 'Floor Plan', 'https://example.com/docs/ht-lsk-001-floor-plan.pdf'),
  ('10000000-0000-0000-0000-000000000001', 'Kabulonga Title Deed', 'Title Deed', 'https://example.com/docs/ht-lsk-001-title-deed.pdf'),
  ('10000000-0000-0000-0000-000000000007', 'Livingstone Lease Agreement', 'Lease Agreement', 'https://example.com/docs/ht-lvn-001-lease.pdf')
on conflict do nothing;

insert into public.leads (
  id,
  client_name,
  phone,
  email,
  property_id,
  branch_id,
  assigned_agent_id,
  source,
  status,
  notes,
  next_follow_up_date
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Mary Banda',
    '+260 966 100 001',
    'mary.client@example.com',
    '10000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Website',
    'Follow-up',
    'Interested in viewing the 4-bedroom house in Kabulonga.',
    current_date + 2
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'David Mwale',
    '+260 966 100 002',
    'david.client@example.com',
    '10000000-0000-0000-0000-000000000009',
    '22222222-2222-2222-2222-222222222222',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'WhatsApp',
    'New',
    'Asked about a 2-bedroom apartment in Livingstone Central.',
    current_date + 1
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Chileshe Tembo',
    '+260 966 100 003',
    'chileshe@example.com',
    '10000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Phone Call',
    'Contacted',
    'Looking for office space around Cairo Road.',
    current_date + 3
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Natasha Zulu',
    '+260 966 100 004',
    null,
    '10000000-0000-0000-0000-000000000008',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Referral',
    'Closed',
    'Investor enquiry for riverside lodge plot.',
    null
  )
on conflict (id) do update
set client_name = excluded.client_name,
    phone = excluded.phone,
    email = excluded.email,
    property_id = excluded.property_id,
    branch_id = excluded.branch_id,
    assigned_agent_id = excluded.assigned_agent_id,
    source = excluded.source,
    status = excluded.status,
    notes = excluded.notes,
    next_follow_up_date = excluded.next_follow_up_date;

insert into public.activity_logs (
  action_type,
  description,
  branch_id,
  property_id,
  lead_id,
  staff_user_id,
  created_at
)
values
  (
    'lead_created',
    'New enquiry received for 4-Bedroom Executive House in Kabulonga',
    '11111111-1111-1111-1111-111111111111',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    now() - interval '10 minutes'
  ),
  (
    'status_changed',
    'Agent John updated HT-LSK-004 property status to Sold',
    '11111111-1111-1111-1111-111111111111',
    '10000000-0000-0000-0000-000000000004',
    null,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    now() - interval '42 minutes'
  ),
  (
    'property_created',
    'Livingstone Branch added a rental apartment - HT-LVN-003',
    '22222222-2222-2222-2222-222222222222',
    '10000000-0000-0000-0000-000000000009',
    null,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    now() - interval '1 hour'
  ),
  (
    'follow_up_scheduled',
    'Follow-up scheduled for client Mary Banda',
    '11111111-1111-1111-1111-111111111111',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    now() - interval '2 hours'
  ),
  (
    'lead_created',
    'New enquiry for 2-bedroom apartment in Livingstone Central',
    '22222222-2222-2222-2222-222222222222',
    '10000000-0000-0000-0000-000000000009',
    '20000000-0000-0000-0000-000000000002',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    now() - interval '4 hours'
  );
