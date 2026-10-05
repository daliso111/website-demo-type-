# Location Search Foundation — Phase 1

Inspection date: 2026-09-17. No migration was applied to production during this work.

## Existing implementation discovered

- `public.properties` uses UUID primary keys and retains `area` (required text) and `full_address` (optional text). The filtering foundation has already added nullable `province_id`, `city_id`, and `area_slug`.
- Exact property/map data is stored separately as nullable `latitude`, `longitude`, `location_label`, and `map_address`. The admin form edits these independently from `area` and `full_address`.
- `public.provinces` already exists with UUID `id`, `name`, `slug`, `map_key`, `is_active`, `sort_order`, timestamps, URL-safe slug checks, and active-only anonymous reads. Its 10 existing records remain authoritative.
- `public.cities` already exists with UUID `id`, `province_id`, `name`, `slug`, `is_active`, and timestamps. It currently contains Lusaka, Chongwe, Livingstone, and Luanshya. Phase 1 adds only the missing `sort_order` field and normalized uniqueness/indexing.
- The approved filtering backfill assigned province/city data to eight known properties and normalized four area slugs: `olympia`, `mikango`, `kingsland-city`, and `new-kasama`.
- The admin property form still uses free-text Area, Full Address, Location Label, and Map Address inputs plus independent latitude/longitude fields. Phase 1 does not alter that form.
- The public scripts currently fetch provinces and cities independently and filter listings with `province_id`, `city_id`, `area_slug`, and legacy text. Phase 1 does not connect the new source or RPC to those scripts.
- Routing currently recognizes sale/rent collection routes and one city slug in `website.js`; Firebase rewrites the existing listing routes. Phase 1 does not change either implementation.

The anonymous production snapshot available during inspection contained 15 public properties (Active or Under Offer): eight already had province/city IDs and seven did not. Four of the eight had an approved normalized `area_slug` that can be mapped to a suburb without inference. Because RLS hides non-public property rows, authoritative totals for all statuses must be obtained by running the verification SQL as an administrator after migration.

## Migration

Apply `migrations/202609170001_location_search_foundation.sql` only after the existing property-filtering foundation and approved backfill.

It:

- extends, rather than recreates, `cities`;
- creates `suburbs` with foreign keys, checks, timestamps, RLS, and duplicate prevention;
- seeds only Olympia, Mikango, Kingsland City, and New Kasama from the approved backfill;
- adds nullable `properties.suburb_id` without deleting or replacing any legacy/map fields;
- backfills only exact `city_id` + `area_slug` + normalized `area` matches;
- creates the active-only `location_search` view;
- creates the bounded `search_locations(search_term, result_limit)` RPC; and
- grants anonymous users read/search access only, with no location writes.

## Verification

Run `location-search-foundation-verification.sql` in the Supabase SQL Editor after applying the migration. Its mutation-based integrity checks are wrapped in a transaction and rolled back. It then reports search examples, full-database mapping totals, manual-review rows, and anonymous privileges.

The migration is intentionally not wired into the current dropdown, listing filters, property URLs, or admin form.
