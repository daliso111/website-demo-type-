-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - EXCLUSIVE PROPERTY CONTROLS
-- Forward migration for the Property Management dashboard and
-- homepage premium horizontal property showcase.
--
-- Run after schema.sql and the existing RLS/public-read policies.
-- This migration is idempotent and does not change Featured
-- Property behaviour or grant anonymous write access.
-- ============================================================

alter table public.properties
add column if not exists exclusive_property boolean;

update public.properties
set exclusive_property = false
where exclusive_property is null;

alter table public.properties
alter column exclusive_property set default false;

alter table public.properties
alter column exclusive_property set not null;

comment on column public.properties.exclusive_property is
'Controls inclusion in the public homepage premium horizontal property showcase.';

-- Normalise known legacy category variations without removing the
-- existing supported Commercial category.
update public.properties
set property_type = case
  when lower(trim(property_type)) in ('house', 'houses') then 'House'
  when lower(trim(property_type)) in ('apartment', 'apartments', 'flat', 'flats') then 'Apartment'
  when lower(trim(property_type)) in ('land', 'lands', 'plot', 'plots') then 'Land'
  when lower(trim(property_type)) in ('commercial', 'commercial property') then 'Commercial'
  else property_type
end
where lower(trim(property_type)) in (
  'house', 'houses',
  'apartment', 'apartments', 'flat', 'flats',
  'land', 'lands', 'plot', 'plots',
  'commercial', 'commercial property'
);

create index if not exists idx_properties_exclusive_active
on public.properties (created_at desc)
where exclusive_property = true and status = 'Active';

alter table public.properties enable row level security;

-- Protect classification/exclusive changes with the server-side staff
-- record. The dashboard's role value is used only for presentation;
-- authorisation here is resolved from auth.uid(). Trusted SQL/service
-- maintenance has no end-user auth.uid() and remains possible.
create or replace function public.enforce_property_classification_management()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role text;
  staff_branch_id uuid;
begin
  if auth.uid() is null then
    return new;
  end if;

  select su.role, su.branch_id
  into staff_role, staff_branch_id
  from public.staff_users su
  where su.auth_user_id = auth.uid()
    and su.is_active = true
  limit 1;

  if staff_role is null or staff_role not in ('super_admin', 'branch_manager') then
    raise exception using
      errcode = '42501',
      message = 'Only active super administrators and branch managers may manage property classification.';
  end if;

  if staff_role = 'branch_manager' and (
    staff_branch_id is null
    or new.branch_id is distinct from staff_branch_id
    or (tg_op = 'UPDATE' and old.branch_id is distinct from staff_branch_id)
  ) then
    raise exception using
      errcode = '42501',
      message = 'Branch managers may manage properties only within their assigned branch.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_property_classification_management() from public;

drop trigger if exists trg_properties_classification_management on public.properties;
create trigger trg_properties_classification_management
before insert or update of property_type, exclusive_property, branch_id
on public.properties
for each row
execute function public.enforce_property_classification_management();

-- The existing public property policy continues to enforce public
-- status visibility. This grant exposes only the new display flag.
grant select (exclusive_property) on public.properties to anon;
revoke insert (exclusive_property) on public.properties from anon;
revoke update (exclusive_property) on public.properties from anon;
