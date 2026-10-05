-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PROPERTY SERVICES CMS
-- Phase 3 forward migration for the approved homepage section.
--
-- Run after schema.sql and add-auth-user-id-to-staff-users.sql.
-- This migration is idempotent and does not require service_role
-- credentials in any frontend file.
-- ============================================================

create extension if not exists "pgcrypto";

create or replace function public.current_staff_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select su.id
  from public.staff_users su
  where su.auth_user_id = auth.uid()
    and su.is_active = true
  limit 1;
$$;

create or replace function public.is_active_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_users su
    where su.auth_user_id = auth.uid()
      and su.is_active = true
      and su.role = 'super_admin'
  );
$$;

revoke all on function public.current_staff_user_id() from public;
revoke all on function public.is_active_super_admin() from public;
grant execute on function public.current_staff_user_id() to authenticated;
grant execute on function public.is_active_super_admin() to authenticated;

create table if not exists public.cms_services_section (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  eyebrow text not null,
  heading text not null,
  supporting_text text not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff_users(id) on delete set null,
  constraint cms_services_section_key_format check (section_key ~ '^[a-z0-9-]+$'),
  constraint cms_services_section_eyebrow_length check (length(trim(eyebrow)) between 1 and 40),
  constraint cms_services_section_heading_length check (length(trim(heading)) between 1 and 80),
  constraint cms_services_section_supporting_length check (length(trim(supporting_text)) between 1 and 300)
);

create table if not exists public.cms_service_cards (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_services_section(id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text not null,
  button_label text not null,
  action_type text not null,
  action_value text,
  default_image_path text,
  custom_image_path text,
  image_alt text not null,
  sort_order integer not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff_users(id) on delete set null,
  constraint cms_service_cards_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint cms_service_cards_title_length check (length(trim(title)) between 1 and 70),
  constraint cms_service_cards_description_length check (length(trim(description)) between 1 and 260),
  constraint cms_service_cards_button_length check (length(trim(button_label)) between 1 and 40),
  constraint cms_service_cards_alt_length check (length(trim(image_alt)) between 1 and 180),
  constraint cms_service_cards_sort_order check (sort_order > 0),
  constraint cms_service_cards_action_type check (
    action_type in ('all_listings', 'rental_listings', 'list_property_enquiry', 'internal_page')
  ),
  constraint cms_service_cards_internal_action check (
    (
      action_type = 'internal_page'
      and action_value is not null
      and length(trim(action_value)) between 1 and 240
      and trim(action_value) ~ '^(/|[.]/|[.][.]/)?[A-Za-z0-9][A-Za-z0-9._~!$&''()*+,;=@%/?#-]*$'
    )
    or (action_type <> 'internal_page' and action_value is null)
  ),
  constraint cms_service_cards_unique_order unique (section_id, sort_order) deferrable initially immediate
);

create index if not exists idx_cms_service_cards_section_order
on public.cms_service_cards(section_id, sort_order);

create index if not exists idx_cms_service_cards_visible_order
on public.cms_service_cards(section_id, is_visible, sort_order);

create or replace function public.set_property_services_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = public.current_staff_user_id();
  return new;
end;
$$;

drop trigger if exists trg_cms_services_section_audit on public.cms_services_section;
create trigger trg_cms_services_section_audit
before update on public.cms_services_section
for each row execute function public.set_property_services_audit_fields();

drop trigger if exists trg_cms_service_cards_audit on public.cms_service_cards;
create trigger trg_cms_service_cards_audit
before update on public.cms_service_cards
for each row execute function public.set_property_services_audit_fields();

create or replace function public.enforce_visible_service_card_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  visible_count integer;
begin
  if new.is_visible then
    select count(*)
    into visible_count
    from public.cms_service_cards c
    where c.section_id = new.section_id
      and c.is_visible = true
      and c.id <> new.id;

    if visible_count >= 4 then
      raise exception 'A maximum of four service cards may be visible.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cms_service_cards_visible_limit on public.cms_service_cards;
create trigger trg_cms_service_cards_visible_limit
before insert or update of is_visible, section_id on public.cms_service_cards
for each row execute function public.enforce_visible_service_card_limit();

alter table public.cms_services_section enable row level security;
alter table public.cms_service_cards enable row level security;

drop policy if exists "Public can read homepage property services settings" on public.cms_services_section;
create policy "Public can read homepage property services settings"
on public.cms_services_section
for select
to anon, authenticated
using (section_key = 'homepage-property-services');

drop policy if exists "Super admins can insert property services settings" on public.cms_services_section;
create policy "Super admins can insert property services settings"
on public.cms_services_section
for insert
to authenticated
with check (public.is_active_super_admin());

drop policy if exists "Super admins can update property services settings" on public.cms_services_section;
create policy "Super admins can update property services settings"
on public.cms_services_section
for update
to authenticated
using (public.is_active_super_admin())
with check (public.is_active_super_admin());

drop policy if exists "Public can read visible property service cards" on public.cms_service_cards;
create policy "Public can read visible property service cards"
on public.cms_service_cards
for select
to anon, authenticated
using (
  is_visible = true
  and exists (
    select 1
    from public.cms_services_section s
    where s.id = cms_service_cards.section_id
      and s.section_key = 'homepage-property-services'
      and s.is_visible = true
  )
);

drop policy if exists "Super admins can read all property service cards" on public.cms_service_cards;
create policy "Super admins can read all property service cards"
on public.cms_service_cards
for select
to authenticated
using (public.is_active_super_admin());

drop policy if exists "Super admins can insert property service cards" on public.cms_service_cards;
create policy "Super admins can insert property service cards"
on public.cms_service_cards
for insert
to authenticated
with check (public.is_active_super_admin());

drop policy if exists "Super admins can update property service cards" on public.cms_service_cards;
create policy "Super admins can update property service cards"
on public.cms_service_cards
for update
to authenticated
using (public.is_active_super_admin())
with check (public.is_active_super_admin());

revoke all on public.cms_services_section from anon, authenticated;
revoke all on public.cms_service_cards from anon, authenticated;
grant select (
  id,
  section_key,
  eyebrow,
  heading,
  supporting_text,
  is_visible
) on public.cms_services_section to anon, authenticated;
grant insert, update on public.cms_services_section to authenticated;
grant select (
  id,
  section_id,
  slug,
  title,
  description,
  button_label,
  action_type,
  action_value,
  default_image_path,
  custom_image_path,
  image_alt,
  sort_order,
  is_visible
) on public.cms_service_cards to anon, authenticated;
grant insert, update on public.cms_service_cards to authenticated;

insert into public.cms_services_section (
  id,
  section_key,
  eyebrow,
  heading,
  supporting_text,
  is_visible
)
values (
  '31000000-0000-4000-8000-000000000001',
  'homepage-property-services',
  'PROPERTY SERVICES',
  'How Can We Help?',
  'Whether you are buying, renting, selling, or listing a property, Hilltop Properties Zambia can guide you through the next step.',
  true
)
on conflict (section_key) do nothing;

insert into public.cms_service_cards (
  id,
  section_id,
  slug,
  title,
  description,
  button_label,
  action_type,
  action_value,
  default_image_path,
  custom_image_path,
  image_alt,
  sort_order,
  is_visible
)
select
  seed.id,
  s.id,
  seed.slug,
  seed.title,
  seed.description,
  seed.button_label,
  seed.action_type,
  null,
  seed.default_image_path,
  null,
  seed.image_alt,
  seed.sort_order,
  true
from public.cms_services_section s
cross join (
  values
    (
      '31000000-0000-4000-8000-000000000011'::uuid,
      'buy-property',
      'Buy a Property',
      'Explore verified houses, apartments, land, and commercial properties available across our operating locations.',
      'Explore Properties',
      'all_listings',
      'assets/images/service-buy-property.svg',
      'Illustration representing the search for a property to buy',
      1
    ),
    (
      '31000000-0000-4000-8000-000000000012'::uuid,
      'rent-property',
      'Rent a Property',
      'Find houses and apartments available for rent in Lusaka, Livingstone, and other listed locations.',
      'Explore Rentals',
      'rental_listings',
      'assets/images/service-rent-property.svg',
      'Illustration representing finding and renting a property',
      2
    ),
    (
      '31000000-0000-4000-8000-000000000013'::uuid,
      'list-property',
      'Sell or List a Property',
      'List your property with Hilltop and connect with interested buyers or tenants through our branch network.',
      'List Your Property',
      'list_property_enquiry',
      'assets/images/service-list-property.svg',
      'Illustration representing listing a property for sale or rent',
      3
    )
) as seed(
  id,
  slug,
  title,
  description,
  button_label,
  action_type,
  default_image_path,
  image_alt,
  sort_order
)
where s.section_key = 'homepage-property-services'
on conflict (slug) do nothing;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'service-illustrations',
  'service-illustrations',
  true,
  2097152,
  array['image/png', 'image/webp', 'image/jpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read service illustrations" on storage.objects;
create policy "Public can read service illustrations"
on storage.objects
for select
to public
using (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
);

drop policy if exists "Super admins can upload service illustrations" on storage.objects;
create policy "Super admins can upload service illustrations"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and lower(storage.extension(name)) in ('png', 'webp', 'jpg', 'jpeg')
  and public.is_active_super_admin()
);

drop policy if exists "Super admins can update service illustrations" on storage.objects;
create policy "Super admins can update service illustrations"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and public.is_active_super_admin()
)
with check (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and lower(storage.extension(name)) in ('png', 'webp', 'jpg', 'jpeg')
  and public.is_active_super_admin()
);

drop policy if exists "Super admins can delete service illustrations" on storage.objects;
create policy "Super admins can delete service illustrations"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'service-illustrations'
  and name like 'service-cards/%'
  and public.is_active_super_admin()
);
