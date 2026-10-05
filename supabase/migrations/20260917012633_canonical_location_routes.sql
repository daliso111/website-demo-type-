-- Phase 3: make every active location path unambiguous and expose a bounded,
-- exact resolver for canonical listing URLs.

begin;

create or replace view public.location_search
with (security_barrier = true)
as
select
  provinces.id,
  'province'::text as type,
  provinces.name,
  provinces.slug,
  provinces.id as province_id,
  provinces.name as province_name,
  provinces.slug as province_slug,
  null::uuid as city_id,
  null::text as city_name,
  null::text as city_slug,
  null::uuid as suburb_id,
  null::text as suburb_name,
  null::text as suburb_slug,
  provinces.slug || '-province' as canonical_path,
  lower(concat_ws(' ', provinces.name, provinces.name || ' Province')) as search_text
from public.provinces provinces
where provinces.is_active = true

union all

select
  cities.id,
  'city'::text as type,
  cities.name,
  cities.slug,
  provinces.id as province_id,
  provinces.name as province_name,
  provinces.slug as province_slug,
  cities.id as city_id,
  cities.name as city_name,
  cities.slug as city_slug,
  null::uuid as suburb_id,
  null::text as suburb_name,
  null::text as suburb_slug,
  cities.slug as canonical_path,
  lower(concat_ws(
    ' ',
    cities.name,
    provinces.name,
    provinces.name || ' Province'
  )) as search_text
from public.cities cities
join public.provinces provinces
  on provinces.id = cities.province_id
where cities.is_active = true
  and provinces.is_active = true

union all

select
  suburbs.id,
  'suburb'::text as type,
  suburbs.name,
  suburbs.slug,
  provinces.id as province_id,
  provinces.name as province_name,
  provinces.slug as province_slug,
  cities.id as city_id,
  cities.name as city_name,
  cities.slug as city_slug,
  suburbs.id as suburb_id,
  suburbs.name as suburb_name,
  suburbs.slug as suburb_slug,
  cities.slug || '/' || suburbs.slug as canonical_path,
  lower(concat_ws(
    ' ',
    suburbs.name,
    cities.name,
    provinces.name,
    provinces.name || ' Province'
  )) as search_text
from public.suburbs suburbs
join public.cities cities
  on cities.id = suburbs.city_id
join public.provinces provinces
  on provinces.id = cities.province_id
where suburbs.is_active = true
  and cities.is_active = true
  and provinces.is_active = true;

comment on view public.location_search is
'Active Province, City/Town and Suburb/Area records with unique database-owned canonical paths.';

do $$
begin
  if exists (
    select canonical_path
    from public.location_search
    group by canonical_path
    having count(*) > 1
  ) then
    raise exception 'Active canonical location paths must be unique';
  end if;
end;
$$;

create or replace function public.resolve_location_path(location_path text)
returns table (
  id uuid,
  type text,
  name text,
  slug text,
  province_id uuid,
  province_name text,
  province_slug text,
  city_id uuid,
  city_name text,
  city_slug text,
  suburb_id uuid,
  suburb_name text,
  suburb_slug text,
  canonical_path text
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select
    locations.id,
    locations.type,
    locations.name,
    locations.slug,
    locations.province_id,
    locations.province_name,
    locations.province_slug,
    locations.city_id,
    locations.city_name,
    locations.city_slug,
    locations.suburb_id,
    locations.suburb_name,
    locations.suburb_slug,
    locations.canonical_path
  from public.location_search locations
  where location_path is not null
    and char_length(btrim(location_path)) between 1 and 160
    and lower(btrim(location_path)) ~ '^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)?$'
    and locations.canonical_path = lower(btrim(location_path))
  limit 1;
$$;

comment on function public.resolve_location_path(text) is
'Resolve one active canonical province, city or suburb path by exact match; invalid and unknown paths return no rows.';

revoke all on function public.resolve_location_path(text) from public;
grant execute on function public.resolve_location_path(text) to anon, authenticated;

commit;
