-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - LIVE PUBLIC READINESS CHECK
--
-- Run this manually in Supabase SQL Editor when the public
-- website shows no branches/properties or public enquiries fail.
--
-- This file is diagnostic only. It does not insert, update,
-- delete, drop, disable RLS, or grant access.
-- ============================================================

-- ============================================================
-- 1. Confirm required tables and columns exist.
-- ============================================================

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('branches', 'properties', 'property_images', 'leads')
order by table_name, ordinal_position;

-- ============================================================
-- 2. Confirm baseline data exists.
-- ============================================================

select count(*) as branch_count
from public.branches;

select
  status,
  count(*) as property_count
from public.properties
group by status
order by status;

select count(*) as active_or_under_offer_property_count
from public.properties
where status in ('Active', 'Under Offer');

select count(*) as property_image_count
from public.property_images;

-- ============================================================
-- 3. Confirm public-ready properties have valid branches.
-- This should return 0 rows.
-- ============================================================

select
  p.id,
  p.reference_number,
  p.title,
  p.status,
  p.branch_id
from public.properties p
left join public.branches b on b.id = p.branch_id
where p.status in ('Active', 'Under Offer')
  and b.id is null;

-- ============================================================
-- 4. Preview exactly what the public website expects to see.
-- These are the same status values used by website.js.
-- ============================================================

select
  p.id,
  p.reference_number,
  p.title,
  p.status,
  p.featured,
  p.branch_id,
  b.name as branch_name,
  count(pi.id) as image_count
from public.properties p
join public.branches b on b.id = p.branch_id
left join public.property_images pi on pi.property_id = p.id
where p.status in ('Active', 'Under Offer')
group by
  p.id,
  p.reference_number,
  p.title,
  p.status,
  p.featured,
  p.branch_id,
  b.name
order by p.created_at desc;

-- ============================================================
-- 5. Confirm RLS is enabled on public-facing and private tables.
-- ============================================================

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'branches',
    'properties',
    'property_images',
    'leads',
    'staff_users',
    'property_documents',
    'activity_logs',
    'lead_communication_logs'
  )
order by c.relname;

-- ============================================================
-- 6. Confirm policies relevant to the public website/enquiries.
-- ============================================================

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'branches',
    'properties',
    'property_images',
    'leads',
    'staff_users',
    'property_documents',
    'activity_logs',
    'lead_communication_logs'
  )
order by tablename, policyname;

-- ============================================================
-- 7. Confirm anon role privileges.
-- Expected:
-- - SELECT allowed on branches, properties, property_images
-- - INSERT allowed on leads
-- - SELECT not allowed on leads/private tables
-- ============================================================

select
  table_name,
  table_oid is not null as table_exists,
  case when table_oid is not null then has_table_privilege('anon', table_oid, 'select') else null end as anon_can_select,
  case when table_oid is not null then has_table_privilege('anon', table_oid, 'insert') else null end as anon_can_insert,
  case when table_oid is not null then has_table_privilege('anon', table_oid, 'update') else null end as anon_can_update,
  case when table_oid is not null then has_table_privilege('anon', table_oid, 'delete') else null end as anon_can_delete
from (
  values
    ('branches', to_regclass('public.branches')),
    ('properties', to_regclass('public.properties')),
    ('property_images', to_regclass('public.property_images')),
    ('leads', to_regclass('public.leads')),
    ('staff_users', to_regclass('public.staff_users')),
    ('property_documents', to_regclass('public.property_documents')),
    ('activity_logs', to_regclass('public.activity_logs')),
    ('lead_communication_logs', to_regclass('public.lead_communication_logs'))
) as expected(table_name, table_oid);

-- ============================================================
-- 8. Confirm anon can read the exact public branch columns.
-- ============================================================

select
  column_name,
  has_column_privilege('anon', 'public.branches', column_name, 'select') as anon_can_select_column
from (
  values
    ('id'),
    ('name'),
    ('address'),
    ('contact_number')
) as expected(column_name);

-- ============================================================
-- 9. Confirm anon can read the exact public property columns.
-- assigned_agent_id should remain false here.
-- ============================================================

select
  column_name,
  has_column_privilege('anon', 'public.properties', column_name, 'select') as anon_can_select_column
from (
  values
    ('id'),
    ('reference_number'),
    ('title'),
    ('description'),
    ('price'),
    ('purpose'),
    ('property_type'),
    ('area'),
    ('full_address'),
    ('bedrooms'),
    ('bathrooms'),
    ('garages'),
    ('square_metres'),
    ('status'),
    ('featured'),
    ('amenities'),
    ('virtual_tour_link'),
    ('youtube_link'),
    ('branch_id'),
    ('created_at'),
    ('assigned_agent_id')
) as expected(column_name);

-- ============================================================
-- 10. Confirm anon can insert only the public enquiry columns.
-- assigned_agent_id should remain false here.
-- ============================================================

select
  column_name,
  has_column_privilege('anon', 'public.leads', column_name, 'insert') as anon_can_insert_column,
  has_column_privilege('anon', 'public.leads', column_name, 'select') as anon_can_select_column
from (
  values
    ('client_name'),
    ('phone'),
    ('email'),
    ('property_id'),
    ('branch_id'),
    ('source'),
    ('status'),
    ('notes'),
    ('assigned_agent_id')
) as expected(column_name);

-- ============================================================
-- 11. If branch_count is 0, public enquiries cannot be submitted.
-- If active_or_under_offer_property_count is 0, public listings
-- will show the empty state.
-- ============================================================
