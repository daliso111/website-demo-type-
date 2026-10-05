-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - LOCATION SEARCH FOUNDATION
-- Phase 1: Province -> City / Town -> Suburb / Area
--
-- Prerequisites:
--   - supabase/schema.sql
--   - supabase/property-filtering-foundation.sql
--   - supabase/property-filtering-approved-backfill.sql
--
-- This migration intentionally does not change the public UI, listing
-- routes, map fields, legacy property text fields, or property RLS.
-- Only area values already normalized by the approved backfill are used
-- for the deterministic property-to-suburb backfill below.
-- ============================================================

begin;

-- Fail before changing anything when the existing filtering foundation
-- has not been installed.
do $$
begin
  if to_regclass('public.provinces') is null
     or to_regclass('public.cities') is null
     or to_regclass('public.properties') is null then
    raise exception
      'The province/city property-filtering foundation must be applied first';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'area_slug'
  ) then
    raise exception
      'The properties.area_slug column from the filtering foundation is required';
  end if;
end;
$$;

-- ============================================================
-- CITIES: complete the existing table rather than recreating it.
-- ============================================================

alter table public.cities
add column if not exists sort_order integer;

-- Preserve any existing positive order. Assign stable values only where
-- an order has not previously been provided.
with city_order as (
  select
    id,
    row_number() over (
      partition by province_id
      order by lower(btrim(name)), id
    )::integer as generated_sort_order
  from public.cities
)
update public.cities cities
set sort_order = city_order.generated_sort_order
from city_order
where cities.id = city_order.id
  and (cities.sort_order is null or cities.sort_order <= 0);

alter table public.cities
alter column sort_order set default 100;

alter table public.cities
alter column sort_order set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.cities'::regclass
      and conname = 'cities_sort_order_positive_check'
  ) then
    alter table public.cities
    add constraint cities_sort_order_positive_check
    check (sort_order > 0);
  end if;
end;
$$;

-- Existing unique constraints are case-sensitive. These indexes prevent
-- accidental duplicates that differ only by case or surrounding spaces.
create unique index if not exists idx_cities_province_normalized_name_unique
on public.cities (province_id, lower(btrim(name)));

create unique index if not exists idx_cities_province_normalized_slug_unique
on public.cities (province_id, lower(btrim(slug)));

create index if not exists idx_cities_active_name_prefix
on public.cities (lower(name) text_pattern_ops)
where is_active = true;

-- ============================================================
-- SUBURBS / AREAS
-- ============================================================

create table if not exists public.suburbs (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suburbs_city_id_fkey
    foreign key (city_id)
    references public.cities(id)
    on delete restrict,
  constraint suburbs_city_name_key unique (city_id, name),
  constraint suburbs_city_slug_key unique (city_id, slug),
  constraint suburbs_id_city_id_key unique (id, city_id),
  constraint suburbs_name_not_blank_check check (btrim(name) <> ''),
  constraint suburbs_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint suburbs_sort_order_positive_check check (sort_order > 0)
);

drop trigger if exists trg_suburbs_set_updated_at on public.suburbs;
create trigger trg_suburbs_set_updated_at
before update on public.suburbs
for each row
execute function public.set_updated_at();

create unique index if not exists idx_suburbs_city_normalized_name_unique
on public.suburbs (city_id, lower(btrim(name)));

create unique index if not exists idx_suburbs_city_normalized_slug_unique
on public.suburbs (city_id, lower(btrim(slug)));

create index if not exists idx_suburbs_city_active_sort_order
on public.suburbs (city_id, is_active, sort_order, name);

create index if not exists idx_suburbs_active_name_prefix
on public.suburbs (lower(name) text_pattern_ops)
where is_active = true;

-- Seed only areas explicitly normalized in the existing approved
-- property backfill. No locations are sourced from an external list.
insert into public.suburbs (
  city_id,
  name,
  slug,
  is_active,
  sort_order
)
select
  cities.id,
  suburb_seed.name,
  suburb_seed.slug,
  true,
  suburb_seed.sort_order
from (
  values
    ('lusaka',   'lusaka',   'Kingsland City', 'kingsland-city', 10),
    ('lusaka',   'lusaka',   'New Kasama',      'new-kasama',    20),
    ('lusaka',   'lusaka',   'Olympia',         'olympia',       30),
    ('lusaka',   'chongwe',  'Mikango',         'mikango',       10)
) as suburb_seed(
  province_slug,
  city_slug,
  name,
  slug,
  sort_order
)
join public.provinces provinces
  on provinces.slug = suburb_seed.province_slug
join public.cities cities
  on cities.province_id = provinces.id
 and cities.slug = suburb_seed.city_slug
on conflict (city_id, slug) do update
set
  name = excluded.name,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order
where (
  suburbs.name,
  suburbs.is_active,
  suburbs.sort_order
) is distinct from (
  excluded.name,
  excluded.is_active,
  excluded.sort_order
);

-- ============================================================
-- PROPERTY NORMALIZED LOCATION REFERENCE
-- Existing area, full_address, location_label, map_address, latitude,
-- and longitude fields remain independent and unchanged.
-- ============================================================

alter table public.properties
add column if not exists suburb_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_suburb_requires_city_check'
  ) then
    alter table public.properties
    add constraint properties_suburb_requires_city_check
    check (suburb_id is null or city_id is not null);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_suburb_city_fkey'
  ) then
    alter table public.properties
    add constraint properties_suburb_city_fkey
    foreign key (suburb_id, city_id)
    references public.suburbs(id, city_id)
    on delete restrict;
  end if;
end;
$$;

comment on column public.properties.suburb_id is
'Normalized suburb/area. Exact address, map label, map address and coordinates remain separate.';

create index if not exists idx_properties_suburb_id
on public.properties (suburb_id);

create index if not exists idx_properties_public_suburb
on public.properties (suburb_id)
where status in ('Active', 'Under Offer');

-- A match is accepted only when the previous approved normalization has
-- already supplied a city_id and area_slug and the legacy display text
-- agrees with the normalized suburb name. Ambiguous rows remain NULL.
lock table public.properties in share row exclusive mode;

create temporary table location_search_property_snapshot
on commit drop
as
select
  properties.id,
  to_jsonb(properties) - array['suburb_id', 'updated_at'] as protected_data
from public.properties properties;

create temporary table location_search_backfill_candidates
on commit drop
as
select
  properties.id as property_id,
  suburbs.id as suburb_id
from public.properties properties
join public.suburbs suburbs
  on suburbs.city_id = properties.city_id
 and suburbs.slug = properties.area_slug
 and lower(btrim(suburbs.name)) = lower(btrim(properties.area))
where properties.suburb_id is null;

update public.properties properties
set suburb_id = candidates.suburb_id
from location_search_backfill_candidates candidates
where properties.id = candidates.property_id;

do $$
declare
  unrelated_change_count integer;
  incomplete_backfill_count integer;
begin
  select count(*)
  into unrelated_change_count
  from location_search_property_snapshot snapshot
  join public.properties properties
    on properties.id = snapshot.id
  where (
    to_jsonb(properties) - array['suburb_id', 'updated_at']
  ) is distinct from snapshot.protected_data;

  if unrelated_change_count <> 0 then
    raise exception
      'Location backfill changed protected data on % properties',
      unrelated_change_count;
  end if;

  select count(*)
  into incomplete_backfill_count
  from location_search_backfill_candidates candidates
  join public.properties properties
    on properties.id = candidates.property_id
  where properties.suburb_id is distinct from candidates.suburb_id;

  if incomplete_backfill_count <> 0 then
    raise exception
      'Location backfill failed for % deterministic matches',
      incomplete_backfill_count;
  end if;
end;
$$;

-- ============================================================
-- UNIFIED ACTIVE LOCATION DIRECTORY
-- The view is deliberately limited to public geographic lookup data.
-- It never reads properties or map/address fields.
-- ============================================================

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
  provinces.slug as canonical_path,
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
'Active Province, City/Town and Suburb/Area records with database-owned canonical paths.';

-- ============================================================
-- SEARCH RPC
-- Ranking: exact name, name prefix, word prefix, then contains.
-- Input is normalized, long/empty input safely returns no rows, and the
-- requested limit is clamped to 1..25 (default 10).
-- ============================================================

create or replace function public.search_locations(
  search_term text default '',
  result_limit integer default 10
)
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
  canonical_path text,
  search_text text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with input as (
    select
      regexp_replace(lower(btrim(coalesce(search_term, ''))), '[[:space:]]+', ' ', 'g') as query,
      greatest(1, least(coalesce(result_limit, 10), 25)) as max_results
  ),
  ranked as (
    select
      locations.*,
      case
        when lower(locations.name) = input.query then 1
        when left(lower(locations.name), char_length(input.query)) = input.query then 2
        when exists (
          select 1
          from unnest(regexp_split_to_array(locations.search_text, '[^a-z0-9]+')) as word(value)
          where left(word.value, char_length(input.query)) = input.query
        ) then 3
        else 4
      end as search_rank
    from public.location_search locations
    cross join input
    where input.query <> ''
      and char_length(input.query) <= 100
      and (
        lower(locations.name) = input.query
        or left(lower(locations.name), char_length(input.query)) = input.query
        or exists (
          select 1
          from unnest(regexp_split_to_array(locations.search_text, '[^a-z0-9]+')) as word(value)
          where left(word.value, char_length(input.query)) = input.query
        )
        or strpos(locations.search_text, input.query) > 0
      )
  )
  select
    ranked.id,
    ranked.type,
    ranked.name,
    ranked.slug,
    ranked.province_id,
    ranked.province_name,
    ranked.province_slug,
    ranked.city_id,
    ranked.city_name,
    ranked.city_slug,
    ranked.suburb_id,
    ranked.suburb_name,
    ranked.suburb_slug,
    ranked.canonical_path,
    ranked.search_text
  from ranked
  order by
    ranked.search_rank,
    case ranked.type
      when 'city' then 1
      when 'province' then 2
      when 'suburb' then 3
      else 4
    end,
    lower(ranked.name),
    ranked.canonical_path,
    ranked.id
  limit (select max_results from input);
$$;

comment on function public.search_locations(text, integer) is
'Search active public locations with deterministic ranking and canonical paths.';

-- ============================================================
-- RLS AND LEAST-PRIVILEGE PUBLIC ACCESS
-- ============================================================

alter table public.suburbs enable row level security;

drop policy if exists "Anon can read active suburbs" on public.suburbs;
create policy "Anon can read active suburbs"
on public.suburbs
for select
to anon
using (is_active = true);

drop policy if exists "Authenticated users can read suburbs" on public.suburbs;
create policy "Authenticated users can read suburbs"
on public.suburbs
for select
to authenticated
using (true);

revoke all privileges on table public.suburbs from anon;
grant select (
  id,
  city_id,
  name,
  slug,
  sort_order
) on public.suburbs to anon;

grant select on table public.suburbs to authenticated;

-- Complete the city lookup grant for the new public ordering field.
grant select (sort_order) on public.cities to anon;

-- Exposing suburb_id does not broaden property row visibility; the
-- existing property RLS policy remains authoritative.
grant select (suburb_id) on public.properties to anon, authenticated;

revoke all privileges on table public.location_search from public, anon, authenticated;
grant select on table public.location_search to anon, authenticated;

revoke all on function public.search_locations(text, integer) from public;
grant execute on function public.search_locations(text, integer) to anon, authenticated;

commit;
