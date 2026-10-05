# Hilltop Properties Zambia Deployment Checklist

## Routing

- Public root: `index.html`
- Public alias: `website.html`
- Public property details: `property-details.html?id=PROPERTY_ID`
- Admin login: `login.html`
- Admin dashboard: `admin-dashboard.html`
- Admin modules:
  - `properties.html`
  - `leads.html`
  - `staff.html`
  - `cms.html`
  - `settings.html`

## Required SQL Files

Run SQL manually in Supabase SQL Editor. Do not run SQL from the browser.

1. `supabase/schema.sql`
2. `supabase/add-auth-user-id-to-staff-users.sql` only if the column was not already created by `schema.sql`
3. `supabase/rls-policies.sql`
4. `supabase/seed.sql` if sample data is needed
5. `supabase/storage-setup.sql`
6. `supabase/lead-communication-logs.sql`
7. `supabase/cms-foundation.sql`
8. `supabase/cms-media-storage.sql`
9. `supabase/settings-foundation.sql`
10. `supabase/public-website-read-policies.sql`
11. `supabase/public-enquiry-policies.sql`
12. `supabase/security-hardening.sql`

## Supabase Storage Buckets

Required buckets:

- `property-images`: public read, authenticated upload/update
- `property-documents`: private, authenticated read/upload/update
- `cms-media`: public read, authenticated upload/update

No public uploads should be enabled. No frontend `service_role` key should ever be used.

## Frontend Keys

- `supabase-config.js` must use only the Supabase URL and publishable/anon key.
- Never add a `service_role` key to frontend code.
- Never add secret keys to HTML, JavaScript, CSS, or settings content.

## Public Pages

These pages must open without login and must not load `auth-guard.js`:

- `index.html`
- `website.html`
- `property-details.html`

Public pages may read only public-safe data and may insert website enquiries into `public.leads`.

## Admin Pages

These pages must require login and load scripts in this order:

1. Supabase CDN
2. `supabase-config.js`
3. `auth-guard.js`
4. Page-specific JavaScript

Protected admin pages:

- `admin-dashboard.html`
- `properties.html`
- `leads.html`
- `staff.html`
- `cms.html`
- `settings.html`

## Local Test Checklist

- `http://127.0.0.1:5500/index.html` opens the public website without login.
- `http://127.0.0.1:5500/website.html` opens the public website without login.
- `http://127.0.0.1:5500/property-details.html?id=VALID_PROPERTY_ID` opens without login.
- `http://127.0.0.1:5500/login.html` opens the admin login page.
- Successful login redirects to `admin-dashboard.html`.
- Logged-out `admin-dashboard.html` redirects to `login.html`.
- Logged-out `properties.html` redirects to `login.html`.
- Logged-out `leads.html` redirects to `login.html`.
- Logged-out `staff.html` redirects to `login.html`.
- Logged-out `cms.html` redirects to `login.html`.
- Logged-out `settings.html` redirects to `login.html`.
- After login, `admin-dashboard.html` loads dashboard stats.
- Admin navigation links work.
- Public property details links work.
- Public enquiry form still inserts leads after policy SQL is run.
- Browser console shows no critical JavaScript errors.

## Deployment Reminder

Deploy the folder as a static site. The public domain root should serve `index.html`. Admin staff should bookmark `login.html` or `admin-dashboard.html`.
