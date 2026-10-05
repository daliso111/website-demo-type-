-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PROPERTY FILTERING FOUNDATION
-- Step 3: normalized province/city vocabulary and filter indexes.
--
-- Prerequisites:
--   1. supabase/schema.sql
--   2. supabase/rls-policies.sql
--   3. supabase/property-currency-support.sql
--
-- This migration intentionally:
--   - does not backfill or otherwise update existing property rows;
--   - keeps public.properties.area as the human-readable area label;
--   - keeps branch_id independent from geographical location; and
--   - does not replace or broaden the existing anonymous property
--     policy, which permits only Active and Under Offer properties.
-- ============================================================

begin;

-- Fail transactionally with a useful message if the separate currency
-- migration has not yet been applied. The requested price index depends
-- on this column; no existing price or currency value is changed here.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'currency_code'
  ) then
    raise exception
      'property-filtering-foundation.sql requires property-currency-support.sql to be applied first';
  end if;
end;
$$;

-- ============================================================
-- PROVINCES
-- Canonical Zambia province values. map_key is reserved for matching
-- a future SVG path to a province without relying on display text.
-- ============================================================

create table if not exists public.provinces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  map_key text not null,
  is_active boolean not null default true,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provinces_name_key unique (name),
  constraint provinces_slug_key unique (slug),
  constraint provinces_map_key_key unique (map_key),
  constraint provinces_name_not_blank_check check (btrim(name) <> ''),
  constraint provinces_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint provinces_map_key_format_check
    check (map_key ~ '^zm-[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint provinces_sort_order_positive_check check (sort_order > 0)
);

drop trigger if exists trg_provinces_set_updated_at on public.provinces;
create trigger trg_provinces_set_updated_at
before update on public.provinces
for each row
execute function public.set_updated_at();

insert into public.provinces (
  name,
  slug,
  map_key,
  is_active,
  sort_order
)
values
  ('Central',       'central',       'zm-central',       true, 1),
  ('Copperbelt',    'copperbelt',    'zm-copperbelt',    true, 2),
  ('Eastern',       'eastern',       'zm-eastern',       true, 3),
  ('Luapula',       'luapula',       'zm-luapula',       true, 4),
  ('Lusaka',        'lusaka',        'zm-lusaka',        true, 5),
  ('Muchinga',      'muchinga',      'zm-muchinga',      true, 6),
  ('Northern',      'northern',      'zm-northern',      true, 7),
  ('North-Western', 'north-western', 'zm-north-western', true, 8),
  ('Southern',      'southern',      'zm-southern',      true, 9),
  ('Western',       'western',       'zm-western',       true, 10)
on conflict (slug) do update
set
  name = excluded.name,
  map_key = excluded.map_key,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order
where (
  provinces.name,
  provinces.map_key,
  provinces.is_active,
  provinces.sort_order
) is distinct from (
  excluded.name,
  excluded.map_key,
  excluded.is_active,
  excluded.sort_order
);

-- ============================================================
-- CITIES
-- City slugs are unique within a province. The additional composite
-- unique constraint supports a declarative city/province relationship
-- on public.properties.
-- ============================================================

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cities_province_id_fkey
    foreign key (province_id)
    references public.provinces(id)
    on delete restrict,
  constraint cities_province_name_key unique (province_id, name),
  constraint cities_province_slug_key unique (province_id, slug),
  constraint cities_id_province_id_key unique (id, province_id),
  constraint cities_name_not_blank_check check (btrim(name) <> ''),
  constraint cities_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

drop trigger if exists trg_cities_set_updated_at on public.cities;
create trigger trg_cities_set_updated_at
before update on public.cities
for each row
execute function public.set_updated_at();

insert into public.cities (
  province_id,
  name,
  slug,
  is_active
)
select
  provinces.id,
  city_seed.name,
  city_seed.slug,
  true
from (
  values
    ('lusaka',     'Lusaka',     'lusaka'),
    ('lusaka',     'Chongwe',    'chongwe'),
    ('southern',   'Livingstone', 'livingstone'),
    ('copperbelt', 'Luanshya',   'luanshya')
) as city_seed(province_slug, name, slug)
join public.provinces
  on provinces.slug = city_seed.province_slug
on conflict (province_id, slug) do update
set
  name = excluded.name,
  is_active = excluded.is_active
where (
  cities.name,
  cities.is_active
) is distinct from (
  excluded.name,
  excluded.is_active
);

-- ============================================================
-- PROPERTY LOCATION COLUMNS
-- All new columns are nullable so this foundation does not invent or
-- backfill missing values. area remains the human-readable source field.
-- branch_id remains operational ownership and has no geographical FK.
-- ============================================================

alter table public.properties
add column if not exists province_id uuid;

alter table public.properties
add column if not exists city_id uuid;

alter table public.properties
add column if not exists area_slug text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_province_id_fkey'
  ) then
    alter table public.properties
    add constraint properties_province_id_fkey
    foreign key (province_id)
    references public.provinces(id)
    on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_city_requires_province_check'
  ) then
    alter table public.properties
    add constraint properties_city_requires_province_check
    check (city_id is null or province_id is not null);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_city_province_fkey'
  ) then
    alter table public.properties
    add constraint properties_city_province_fkey
    foreign key (city_id, province_id)
    references public.cities(id, province_id)
    on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_area_slug_format_check'
  ) then
    alter table public.properties
    add constraint properties_area_slug_format_check
    check (
      area_slug is null
      or area_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    );
  end if;
end;
$$;

comment on column public.properties.province_id is
'Geographical province. Independent from the operational branch_id.';

comment on column public.properties.city_id is
'Geographical city. When set, it must belong to province_id.';

comment on column public.properties.area_slug is
'Normalized URL slug for the existing human-readable area value.';

-- ============================================================
-- PROPERTY TYPE
-- Replace the schema.sql-generated check constraint with the same
-- existing values plus Farm. This does not rewrite property records.
-- ============================================================

alter table public.properties
drop constraint if exists properties_property_type_check;

alter table public.properties
add constraint properties_property_type_check
check (property_type in ('House', 'Apartment', 'Commercial', 'Land', 'Farm'));

-- ============================================================
-- INDEXES
-- Public-listing indexes retain exactly the existing visibility values.
-- They optimize filtering only; they do not grant or expose any row.
-- ============================================================

create index if not exists idx_provinces_active_sort_order
on public.provinces (is_active, sort_order);

create index if not exists idx_cities_province_active_name
on public.cities (province_id, is_active, name);

create index if not exists idx_properties_public_status_purpose
on public.properties (status, purpose)
where status in ('Active', 'Under Offer');

create index if not exists idx_properties_province_id
on public.properties (province_id);

create index if not exists idx_properties_city_id
on public.properties (city_id);

create index if not exists idx_properties_public_location
on public.properties (province_id, city_id, area_slug)
where status in ('Active', 'Under Offer');

create index if not exists idx_properties_public_property_type
on public.properties (property_type)
where status in ('Active', 'Under Offer');

create index if not exists idx_properties_public_currency_price
on public.properties (currency_code, price)
where status in ('Active', 'Under Offer');

create index if not exists idx_properties_public_bedrooms
on public.properties (bedrooms)
where status in ('Active', 'Under Offer');

create index if not exists idx_properties_public_bathrooms
on public.properties (bathrooms)
where status in ('Active', 'Under Offer');

-- ============================================================
-- LOOKUP RLS AND GRANTS
-- Anonymous users may read active lookup rows only. No anonymous or
-- authenticated lookup writes are introduced by this foundation.
-- ============================================================

alter table public.provinces enable row level security;
alter table public.cities enable row level security;

drop policy if exists "Anon can read active provinces" on public.provinces;
create policy "Anon can read active provinces"
on public.provinces
for select
to anon
using (is_active = true);

drop policy if exists "Anon can read active cities" on public.cities;
create policy "Anon can read active cities"
on public.cities
for select
to anon
using (is_active = true);

drop policy if exists "Authenticated users can read provinces" on public.provinces;
create policy "Authenticated users can read provinces"
on public.provinces
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read cities" on public.cities;
create policy "Authenticated users can read cities"
on public.cities
for select
to authenticated
using (true);

revoke all privileges on table public.provinces from anon;
revoke all privileges on table public.cities from anon;

grant select (
  id,
  name,
  slug,
  map_key,
  sort_order
) on public.provinces to anon;

grant select (
  id,
  province_id,
  name,
  slug
) on public.cities to anon;

grant select on table public.provinces to authenticated;
grant select on table public.cities to authenticated;

-- The pre-existing property RLS policy remains authoritative. These
-- column grants merely make the normalized location readable on rows
-- that the caller is already permitted to retrieve.
grant select (
  province_id,
  city_id,
  area_slug
) on public.properties to anon, authenticated;

commit;

