-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - APPROVED LOCATION BACKFILL
-- Step 5: apply only the eight approved geographical corrections.
--
-- Prerequisite:
--   supabase/property-filtering-foundation.sql
--
-- IMPORTANT:
--   - This file does not infer or guess any property data.
--   - MAER and Prime are intentionally excluded.
--   - branch_id is operational ownership and is never used to derive
--     or update a property's geographical location.
--   - No completeness constraint is added because unresolved public
--     property locations still exist.
--   - The existing properties updated_at trigger will record the time
--     of an approved geographical change. No other unrelated property
--     column is permitted to change.
-- ============================================================

begin;

-- The temporary approval manifest is transaction-local and disappears
-- at commit or rollback. NULL approved_area means preserve area exactly;
-- NULL approved_area_slug means explicitly leave area_slug unresolved.
create temporary table property_filtering_approved_backfill (
  property_id uuid primary key,
  reference_number text not null unique,
  province_slug text not null,
  city_slug text not null,
  approved_area text,
  approved_area_slug text,
  change_area boolean not null,
  constraint property_filtering_approved_area_check check (
    (
      change_area = true
      and approved_area is not null
      and approved_area_slug is not null
    )
    or
    (
      change_area = false
      and approved_area is null
      and approved_area_slug is null
    )
  )
) on commit drop;

insert into property_filtering_approved_backfill (
  property_id,
  reference_number,
  province_slug,
  city_slug,
  approved_area,
  approved_area_slug,
  change_area
)
values
  (
    'b4151b58-04d7-49b3-bdbf-2b41f6800ee3',
    'HT-LS-3440',
    'southern',
    'livingstone',
    null,
    null,
    false
  ),
  (
    'e95bb8cc-a5a4-4837-9360-9c1108d16a16',
    'HT-LS-34561',
    'southern',
    'livingstone',
    null,
    null,
    false
  ),
  (
    'be3c9293-df94-4271-9cd7-c2ab6f7fbc85',
    'HT-LS-345625',
    'lusaka',
    'lusaka',
    'Olympia',
    'olympia',
    true
  ),
  (
    '8b473d0e-b857-4b45-ae20-6bd839f84a41',
    'HT-LS-34565',
    'lusaka',
    'chongwe',
    'Mikango',
    'mikango',
    true
  ),
  (
    '7e921d38-45a3-4ec5-a872-ee11ff2b283f',
    'HT-LS-345651',
    'copperbelt',
    'luanshya',
    null,
    null,
    false
  ),
  (
    '0b217661-cdb4-4a58-91d5-90dc5d2d1e9f',
    'HT-LS-3456513',
    'lusaka',
    'lusaka',
    'Kingsland City',
    'kingsland-city',
    true
  ),
  (
    '5febe5a1-ce7b-4832-95ac-f59b48945cf6',
    'LFV',
    'lusaka',
    'lusaka',
    null,
    null,
    false
  ),
  (
    'd71a130e-adb7-4f97-85bb-89e441716051',
    'NKPA-111',
    'lusaka',
    'lusaka',
    'New Kasama',
    'new-kasama',
    true
  );

-- Prevent concurrent property writes from invalidating the before/after
-- checks. Lookup rows are also held stable while their IDs are resolved.
lock table public.properties in share row exclusive mode;
lock table public.provinces, public.cities in share mode;

-- ============================================================
-- PRE-UPDATE ASSERTIONS
-- Any mismatch raises an exception and aborts the whole transaction.
-- ============================================================

do $$
declare
  approved_count integer;
  exact_property_count integer;
  property_errors text;
  missing_provinces text;
  invalid_city_pairs text;
begin
  select count(*)
  into approved_count
  from property_filtering_approved_backfill;

  if approved_count <> 8 then
    raise exception
      'Approved backfill manifest must contain exactly 8 records; found %',
      approved_count;
  end if;

  if exists (
    select 1
    from property_filtering_approved_backfill
    where reference_number in ('MAER', 'Prime')
  ) then
    raise exception 'Unresolved references MAER and Prime must remain excluded';
  end if;

  select string_agg(
    format(
      '%s (%s): actual reference %s',
      approved.reference_number,
      approved.property_id,
      coalesce(properties.reference_number, '<missing>')
    ),
    '; ' order by approved.reference_number
  )
  into property_errors
  from property_filtering_approved_backfill approved
  left join public.properties
    on properties.id = approved.property_id
  where properties.id is null
     or properties.reference_number is distinct from approved.reference_number;

  if property_errors is not null then
    raise exception
      'Approved property UUID/reference validation failed: %',
      property_errors;
  end if;

  select count(*)
  into exact_property_count
  from property_filtering_approved_backfill approved
  join public.properties
    on properties.id = approved.property_id
   and properties.reference_number = approved.reference_number;

  if exact_property_count <> 8 then
    raise exception
      'Expected exactly 8 matching property records; found %',
      exact_property_count;
  end if;

  select string_agg(missing.province_slug, ', ' order by missing.province_slug)
  into missing_provinces
  from (
    select distinct approved.province_slug
    from property_filtering_approved_backfill approved
    left join public.provinces
      on provinces.slug = approved.province_slug
     and provinces.is_active = true
    where provinces.id is null
  ) missing;

  if missing_provinces is not null then
    raise exception
      'Required active provinces are missing: %',
      missing_provinces;
  end if;

  select string_agg(
    format('%s/%s', invalid.province_slug, invalid.city_slug),
    ', ' order by invalid.province_slug, invalid.city_slug
  )
  into invalid_city_pairs
  from (
    select distinct approved.province_slug, approved.city_slug
    from property_filtering_approved_backfill approved
    join public.provinces
      on provinces.slug = approved.province_slug
     and provinces.is_active = true
    left join public.cities
      on cities.slug = approved.city_slug
     and cities.province_id = provinces.id
     and cities.is_active = true
    where cities.id is null
  ) invalid;

  if invalid_city_pairs is not null then
    raise exception
      'Required city is missing, inactive, or belongs to another province: %',
      invalid_city_pairs;
  end if;
end;
$$;

-- Resolve canonical lookup IDs only after every slug relationship passes.
create temporary table property_filtering_resolved_backfill
on commit drop
as
select
  approved.property_id,
  approved.reference_number,
  approved.province_slug,
  approved.city_slug,
  approved.approved_area,
  approved.approved_area_slug,
  approved.change_area,
  provinces.id as province_id,
  cities.id as city_id
from property_filtering_approved_backfill approved
join public.provinces
  on provinces.slug = approved.province_slug
 and provinces.is_active = true
join public.cities
  on cities.slug = approved.city_slug
 and cities.province_id = provinces.id
 and cities.is_active = true;

do $$
declare
  resolved_count integer;
begin
  select count(*)
  into resolved_count
  from property_filtering_resolved_backfill;

  if resolved_count <> 8 then
    raise exception
      'Expected exactly 8 resolved property locations; found %',
      resolved_count;
  end if;
end;
$$;

-- Snapshot every property. For approved targets, protected_data contains
-- every column except the four approved geographical fields and the
-- automatically maintained updated_at timestamp.
create temporary table property_filtering_property_snapshot
on commit drop
as
select
  properties.id,
  properties.reference_number,
  properties.branch_id,
  properties.area,
  properties.area_slug,
  properties.province_id,
  properties.city_id,
  to_jsonb(properties) as complete_data,
  to_jsonb(properties) - array[
    'province_id',
    'city_id',
    'area',
    'area_slug',
    'updated_at'
  ] as protected_data
from public.properties;

-- ============================================================
-- APPROVED UPDATE
-- Only rows matching both UUID and reference number can be touched.
-- ============================================================

create temporary table property_filtering_updated_records (
  id uuid primary key,
  reference_number text not null unique
) on commit drop;

with updated as (
  update public.properties
  set
    province_id = resolved.province_id,
    city_id = resolved.city_id,
    area = case
      when resolved.change_area then resolved.approved_area
      else properties.area
    end,
    area_slug = resolved.approved_area_slug
  from property_filtering_resolved_backfill resolved
  where properties.id = resolved.property_id
    and properties.reference_number = resolved.reference_number
  returning properties.id, properties.reference_number
)
insert into property_filtering_updated_records (id, reference_number)
select id, reference_number
from updated;

-- ============================================================
-- POST-UPDATE ASSERTIONS
-- A failed assertion rolls back the update and every temporary object.
-- ============================================================

do $$
declare
  updated_count integer;
  location_mismatch_count integer;
  unrelated_column_change_count integer;
  branch_change_count integer;
  unrelated_property_change_count integer;
  excluded_update_count integer;
begin
  select count(*)
  into updated_count
  from property_filtering_updated_records;

  if updated_count <> 8 then
    raise exception
      'Expected exactly 8 updated property records; updated %',
      updated_count;
  end if;

  select count(*)
  into location_mismatch_count
  from property_filtering_resolved_backfill resolved
  join property_filtering_property_snapshot snapshot
    on snapshot.id = resolved.property_id
  join public.properties
    on properties.id = resolved.property_id
   and properties.reference_number = resolved.reference_number
  where properties.province_id is distinct from resolved.province_id
     or properties.city_id is distinct from resolved.city_id
     or properties.area is distinct from (
       case
         when resolved.change_area then resolved.approved_area
         else snapshot.area
       end
     )
     or properties.area_slug is distinct from resolved.approved_area_slug;

  if location_mismatch_count <> 0 then
    raise exception
      'Approved location verification failed for % records',
      location_mismatch_count;
  end if;

  select count(*)
  into unrelated_column_change_count
  from property_filtering_updated_records updated
  join property_filtering_property_snapshot snapshot
    on snapshot.id = updated.id
  join public.properties
    on properties.id = updated.id
  where (
    to_jsonb(properties) - array[
      'province_id',
      'city_id',
      'area',
      'area_slug',
      'updated_at'
    ]
  ) is distinct from snapshot.protected_data;

  if unrelated_column_change_count <> 0 then
    raise exception
      'Unrelated property columns changed for % approved records',
      unrelated_column_change_count;
  end if;

  select count(*)
  into branch_change_count
  from property_filtering_updated_records updated
  join property_filtering_property_snapshot snapshot
    on snapshot.id = updated.id
  join public.properties
    on properties.id = updated.id
  where properties.branch_id is distinct from snapshot.branch_id;

  if branch_change_count <> 0 then
    raise exception
      'branch_id changed for % approved records',
      branch_change_count;
  end if;

  select count(*)
  into unrelated_property_change_count
  from property_filtering_property_snapshot snapshot
  join public.properties
    on properties.id = snapshot.id
  left join property_filtering_approved_backfill approved
    on approved.property_id = snapshot.id
  where approved.property_id is null
    and to_jsonb(properties) is distinct from snapshot.complete_data;

  if unrelated_property_change_count <> 0 then
    raise exception
      'The migration changed % properties outside the approval manifest',
      unrelated_property_change_count;
  end if;

  select count(*)
  into excluded_update_count
  from property_filtering_updated_records
  where reference_number in ('MAER', 'Prime');

  if excluded_update_count <> 0 then
    raise exception 'MAER or Prime was unexpectedly updated';
  end if;
end;
$$;

-- ============================================================
-- VERIFICATION REPORTS
-- These read-only result sets are emitted before COMMIT so any failed
-- assertion above prevents the transaction from completing.
-- ============================================================

select
  count(*) as updated_record_count,
  array_agg(reference_number order by reference_number) as updated_reference_numbers
from property_filtering_updated_records;

select
  properties.id as property_id,
  properties.reference_number,
  provinces.name as province,
  cities.name as city,
  properties.area,
  properties.area_slug
from property_filtering_updated_records updated
join public.properties
  on properties.id = updated.id
join public.provinces
  on provinces.id = properties.province_id
join public.cities
  on cities.id = properties.city_id
order by properties.reference_number;

select
  count(*) filter (where province_id is null) as public_properties_missing_province,
  count(*) filter (where city_id is null) as public_properties_missing_city,
  count(*) filter (where area_slug is null) as public_properties_missing_area_slug,
  array_agg(reference_number order by reference_number)
    filter (where province_id is null) as references_missing_province,
  array_agg(reference_number order by reference_number)
    filter (where city_id is null) as references_missing_city,
  array_agg(reference_number order by reference_number)
    filter (where area_slug is null) as references_missing_area_slug
from public.properties
where status in ('Active', 'Under Offer');

select
  not exists (
    select 1
    from property_filtering_updated_records updated
    join property_filtering_property_snapshot snapshot
      on snapshot.id = updated.id
    join public.properties
      on properties.id = updated.id
    where (
      to_jsonb(properties) - array[
        'province_id',
        'city_id',
        'area',
        'area_slug',
        'updated_at'
      ]
    ) is distinct from snapshot.protected_data
  ) as no_unrelated_columns_changed,
  not exists (
    select 1
    from property_filtering_updated_records updated
    join property_filtering_property_snapshot snapshot
      on snapshot.id = updated.id
    join public.properties
      on properties.id = updated.id
    where properties.branch_id is distinct from snapshot.branch_id
  ) as branch_ids_preserved,
  not exists (
    select 1
    from property_filtering_property_snapshot snapshot
    join public.properties
      on properties.id = snapshot.id
    left join property_filtering_approved_backfill approved
      on approved.property_id = snapshot.id
    where approved.property_id is null
      and to_jsonb(properties) is distinct from snapshot.complete_data
  ) as unrelated_properties_unchanged,
  not exists (
    select 1
    from property_filtering_updated_records
    where reference_number in ('MAER', 'Prime')
  ) as unresolved_records_excluded,
  'updated_at is expected to change through the existing audit trigger'::text
    as timestamp_note;

commit;

