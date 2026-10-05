-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - LOCATION SEARCH VERIFICATION
-- Run after 202609170001_location_search_foundation.sql.
--
-- Constraint checks run inside a transaction that is rolled back.
-- The final read-only reports show mapping and manual-review counts.
-- ============================================================

begin;

do $$
declare
  lusaka_province_id uuid;
  test_city_id uuid := gen_random_uuid();
  test_suburb_id uuid := gen_random_uuid();
  unique_suffix text := replace(gen_random_uuid()::text, '-', '');
  test_city_slug text;
  test_suburb_slug text;
begin
  select id
  into strict lusaka_province_id
  from public.provinces
  where slug = 'lusaka';

  test_city_slug := 'qa-city-' || unique_suffix;
  test_suburb_slug := 'qa-suburb-' || unique_suffix;

  -- A city cannot reference an invalid province.
  begin
    insert into public.cities (province_id, name, slug)
    values (gen_random_uuid(), 'QA Invalid Province City', 'qa-invalid-province-city');
    raise exception 'FAILED: city accepted an invalid province';
  exception
    when foreign_key_violation then null;
  end;

  insert into public.cities (id, province_id, name, slug)
  values (test_city_id, lusaka_province_id, 'QA Location Test City ' || unique_suffix, test_city_slug);

  -- A suburb cannot reference an invalid city.
  begin
    insert into public.suburbs (city_id, name, slug)
    values (gen_random_uuid(), 'QA Invalid City Suburb', 'qa-invalid-city-suburb');
    raise exception 'FAILED: suburb accepted an invalid city';
  exception
    when foreign_key_violation then null;
  end;

  insert into public.suburbs (id, city_id, name, slug)
  values (test_suburb_id, test_city_id, 'QA Test Suburb ' || unique_suffix, test_suburb_slug);

  -- Duplicate names within one city are rejected case-insensitively.
  begin
    insert into public.suburbs (city_id, name, slug)
    values (test_city_id, lower('QA Test Suburb ' || unique_suffix), 'qa-second-' || unique_suffix);
    raise exception 'FAILED: duplicate suburb name was accepted';
  exception
    when unique_violation then null;
  end;

  begin
    insert into public.suburbs (city_id, name, slug)
    values (test_city_id, 'QA Different Name ' || unique_suffix, test_suburb_slug);
    raise exception 'FAILED: duplicate suburb slug was accepted';
  exception
    when unique_violation then null;
  end;

  -- Blank and non-URL-safe slugs are rejected.
  begin
    insert into public.suburbs (city_id, name, slug)
    values (test_city_id, 'QA Blank Slug', '');
    raise exception 'FAILED: blank suburb slug was accepted';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.suburbs (city_id, name, slug)
    values (test_city_id, 'QA Invalid Slug', 'Not URL Safe');
    raise exception 'FAILED: invalid suburb slug was accepted';
  exception
    when check_violation then null;
  end;

  -- Case-insensitive exact/prefix search and canonical city paths.
  if not exists (
    select 1
    from public.search_locations('LUSAKA', 10)
    where type = 'city'
      and name = 'Lusaka'
      and canonical_path = 'lusaka'
  ) then
    raise exception 'FAILED: case-insensitive Lusaka search/canonical path';
  end if;

  if not exists (
    select 1
    from public.search_locations('lusa', 10)
    where type = 'city'
      and name = 'Lusaka'
  ) then
    raise exception 'FAILED: Lusaka prefix search';
  end if;

  if (
    select type
    from public.search_locations('lusa', 10)
    limit 1
  ) is distinct from 'city' then
    raise exception 'FAILED: deterministic ranking did not prefer the city';
  end if;

  if (
    select count(*)
    from public.search_locations('lusa', 2)
  ) > 2 then
    raise exception 'FAILED: result limit was not enforced';
  end if;

  if not exists (
    select 1
    from public.search_locations('Livingstone', 10)
    where type = 'city'
      and name = 'Livingstone'
      and canonical_path = 'livingstone'
  ) then
    raise exception 'FAILED: Livingstone exact search/canonical path';
  end if;

  if not exists (
    select 1
    from public.search_locations('living', 10)
    where type = 'city'
      and name = 'Livingstone'
  ) then
    raise exception 'FAILED: Livingstone prefix search';
  end if;

  if not exists (
    select 1
    from public.search_locations('olym', 10)
    where type = 'suburb'
      and name = 'Olympia'
      and canonical_path = 'lusaka/olympia'
  ) then
    raise exception 'FAILED: verified suburb prefix search/canonical path';
  end if;

  -- Inactive locations and locations under inactive ancestors are hidden.
  update public.suburbs
  set is_active = false
  where id = test_suburb_id;

  if exists (
    select 1
    from public.search_locations('QA Test Suburb ' || unique_suffix, 10)
    where id = test_suburb_id
  ) then
    raise exception 'FAILED: inactive suburb appeared in search';
  end if;

  -- Empty, NULL and overlong input safely return no rows.
  if exists (select 1 from public.search_locations('', 10))
     or exists (select 1 from public.search_locations(null, 10))
     or exists (select 1 from public.search_locations('%', 10))
     or exists (select 1 from public.search_locations(repeat('x', 101), 10)) then
    raise exception 'FAILED: malformed/empty search returned rows';
  end if;

  -- No property may reference a suburb from another city.
  if exists (
    select 1
    from public.properties properties
    join public.suburbs suburbs
      on suburbs.id = properties.suburb_id
    where properties.city_id is distinct from suburbs.city_id
  ) then
    raise exception 'FAILED: a property is assigned to a suburb in another city';
  end if;

  raise notice 'PASS: location integrity, search, inactive filtering and backfill relationship checks';
end;
$$;

rollback;

-- Example search results.
select * from public.search_locations('lusa', 10);
select * from public.search_locations('living', 10);
select * from public.search_locations('olym', 10);

-- Mapping totals. These queries intentionally count all property statuses
-- when run by an administrator in the SQL Editor.
select
  count(*) filter (where province_id is not null) as province_mapped,
  count(*) filter (where city_id is not null) as city_mapped,
  count(*) filter (where suburb_id is not null) as suburb_mapped,
  count(*) filter (
    where province_id is null
       or city_id is null
       or suburb_id is null
  ) as requires_location_review,
  count(*) as total_properties
from public.properties;

-- Manual review report. Map/address fields are shown only to the database
-- administrator running this file; they are not exposed by the view/RPC.
select
  properties.id,
  properties.reference_number,
  properties.area,
  properties.area_slug,
  properties.full_address,
  properties.location_label,
  properties.map_address,
  properties.province_id,
  properties.city_id,
  properties.suburb_id
from public.properties properties
where properties.province_id is null
   or properties.city_id is null
   or properties.suburb_id is null
order by properties.reference_number;

-- Confirm public privileges do not include lookup writes.
select
  relation_name,
  has_table_privilege('anon', relation_oid, 'select') as anon_can_select,
  has_table_privilege('anon', relation_oid, 'insert') as anon_can_insert,
  has_table_privilege('anon', relation_oid, 'update') as anon_can_update,
  has_table_privilege('anon', relation_oid, 'delete') as anon_can_delete
from (
  values
    ('suburbs', 'public.suburbs'::regclass),
    ('location_search', 'public.location_search'::regclass)
) as relations(relation_name, relation_oid);

select
  has_function_privilege(
    'anon',
    'public.search_locations(text, integer)',
    'execute'
  ) as anon_can_search_locations;
