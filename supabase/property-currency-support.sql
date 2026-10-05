-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PROPERTY CURRENCY SUPPORT
-- Forward migration for ZMW and USD property listing prices.
--
-- Run after schema.sql and the existing property RLS policies.
-- Existing numeric prices are preserved without conversion.
-- ============================================================

alter table public.properties
add column if not exists currency_code text;

-- Existing and legacy records remain ZMW. Normalise a previously
-- added supported value before applying the strict constraint.
update public.properties
set currency_code = upper(trim(currency_code))
where currency_code is not null;

update public.properties
set currency_code = 'ZMW'
where currency_code is null
   or currency_code not in ('ZMW', 'USD');

alter table public.properties
alter column currency_code set default 'ZMW';

alter table public.properties
alter column currency_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_currency_code_check'
  ) then
    alter table public.properties
    add constraint properties_currency_code_check
    check (currency_code in ('ZMW', 'USD'));
  end if;
end;
$$;

-- Enforce non-negative numeric values for all future writes without
-- rewriting or converting any legacy price amount.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_price_non_negative'
  ) then
    alter table public.properties
    add constraint properties_price_non_negative
    check (price >= 0) not valid;
  end if;
end;
$$;

comment on column public.properties.currency_code is
'ISO-style listing currency code. Supported values are ZMW and USD; amounts are never converted automatically.';

create index if not exists idx_properties_currency_code
on public.properties (currency_code);

-- RLS remains enabled. This trigger narrows currency writes to the
-- same property-management roles used by the dashboard and resolves
-- authority from auth.uid(), not from browser-supplied role data.
create or replace function public.enforce_property_currency_management()
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
      message = 'Only active super administrators and branch managers may manage property currency.';
  end if;

  if staff_role = 'branch_manager' and (
    staff_branch_id is null
    or new.branch_id is distinct from staff_branch_id
    or (tg_op = 'UPDATE' and old.branch_id is distinct from staff_branch_id)
  ) then
    raise exception using
      errcode = '42501',
      message = 'Branch managers may manage property currency only within their assigned branch.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_property_currency_management() from public;

drop trigger if exists trg_properties_currency_management on public.properties;
create trigger trg_properties_currency_management
before insert or update of currency_code, price, branch_id
on public.properties
for each row
execute function public.enforce_property_currency_management();

-- Public visitors can read the currency only through the existing
-- public-property RLS policy. Anonymous writes remain prohibited.
grant select (currency_code) on public.properties to anon, authenticated;
grant insert (currency_code), update (currency_code) on public.properties to authenticated;
revoke insert (currency_code), update (currency_code) on public.properties from anon;
