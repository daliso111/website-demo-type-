begin;

create table public.market_price_statistics (
  id bigint generated always as identity primary key,
  area_name text not null,
  area_key text not null,
  property_type text not null,
  purpose text not null,
  currency_code text not null,
  bedroom_bucket text not null,
  year smallint not null,
  average_price numeric(14,2) not null,
  sample_size integer not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_price_statistics_area_name_not_empty_check
    check (area_name <> ''),
  constraint market_price_statistics_area_name_trimmed_check
    check (area_name = btrim(area_name)),
  constraint market_price_statistics_area_key_format_check
    check (area_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint market_price_statistics_property_type_check
    check (property_type in ('House', 'Apartment', 'Commercial', 'Land')),
  constraint market_price_statistics_purpose_check
    check (purpose in ('For Sale', 'For Rent')),
  constraint market_price_statistics_currency_code_check
    check (currency_code in ('ZMW', 'USD')),
  constraint market_price_statistics_bedroom_bucket_check
    check (bedroom_bucket in ('1', '2', '3', '4', '5_plus', 'not_applicable')),
  constraint market_price_statistics_property_type_bedroom_bucket_check
    check (
      (
        property_type in ('House', 'Apartment')
        and bedroom_bucket in ('1', '2', '3', '4', '5_plus')
      )
      or
      (
        property_type in ('Commercial', 'Land')
        and bedroom_bucket = 'not_applicable'
      )
    ),
  constraint market_price_statistics_year_check
    check (year between 1900 and 9999),
  constraint market_price_statistics_average_price_positive_check
    check (average_price > 0),
  constraint market_price_statistics_sample_size_positive_check
    check (sample_size >= 1),
  constraint market_price_statistics_published_rent_safeguard_check
    check (purpose <> 'For Rent' or is_published = false),
  constraint market_price_statistics_market_year_key
    unique (
      area_key,
      property_type,
      purpose,
      currency_code,
      bedroom_bucket,
      year
    )
);

create index idx_market_price_statistics_published_market
  on public.market_price_statistics (
    area_key,
    property_type,
    purpose,
    currency_code,
    year desc,
    bedroom_bucket
  )
  include (area_name, average_price, sample_size)
  where is_published = true;

create trigger trg_market_price_statistics_set_updated_at
before update on public.market_price_statistics
for each row
execute function public.set_updated_at();

alter table public.market_price_statistics enable row level security;

revoke all privileges on table public.market_price_statistics
from public, anon, authenticated;

revoke all privileges on sequence public.market_price_statistics_id_seq
from public, anon, authenticated;

grant select on table public.market_price_statistics
to anon, authenticated;

create policy "Public can read published market price statistics"
on public.market_price_statistics
for select
to anon, authenticated
using (is_published = true);

commit;
