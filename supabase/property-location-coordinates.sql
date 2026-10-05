-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PROPERTY LOCATION COORDINATES
-- Forward migration for provider-independent property locations.
--
-- Run after schema.sql and the existing property RLS/public-read
-- policies. Existing properties remain valid with all four fields
-- set to NULL.
-- ============================================================

alter table public.properties
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists location_label text,
  add column if not exists map_address text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_latitude_range_check'
  ) then
    alter table public.properties
      add constraint properties_latitude_range_check
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_longitude_range_check'
  ) then
    alter table public.properties
      add constraint properties_longitude_range_check
      check (longitude is null or longitude between -180 and 180);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_coordinates_pair_check'
  ) then
    alter table public.properties
      add constraint properties_coordinates_pair_check
      check (
        (latitude is null and longitude is null)
        or (latitude is not null and longitude is not null)
      );
  end if;
end;
$$;

comment on column public.properties.latitude is
'Canonical property latitude in decimal degrees. NULL when no map location has been saved.';

comment on column public.properties.longitude is
'Canonical property longitude in decimal degrees. NULL when no map location has been saved.';

comment on column public.properties.location_label is
'Short human-readable property location, for example Ibex Hill, Lusaka.';

comment on column public.properties.map_address is
'Optional descriptive address or map-related location text; coordinates remain canonical.';

-- Keep the existing row policies unchanged. Anonymous users can read
-- these display-safe fields only on rows allowed by the current public
-- active/under-offer SELECT policy. Anonymous writes remain prohibited.
alter table public.properties enable row level security;

grant select (latitude, longitude, location_label, map_address)
on public.properties to anon, authenticated;

grant insert (latitude, longitude, location_label, map_address)
on public.properties to authenticated;

grant update (latitude, longitude, location_label, map_address)
on public.properties to authenticated;

revoke insert (latitude, longitude, location_label, map_address)
on public.properties from anon;

revoke update (latitude, longitude, location_label, map_address)
on public.properties from anon;
