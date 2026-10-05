# Hilltop Properties Zambia Security Review

## Verdict

PASS WITH NOTES

Phase 9A review found no exposed `service_role` key, no secret key, no public login, and no public reads of private tables from `index.html`, `website.html`, or `property-details.html`. Admin pages are protected by `auth-guard.js` and public pages remain open without auth guard.

One hardening fix was made: authenticated hard-delete RLS policies were removed from `supabase/rls-policies.sql`, and `supabase/security-hardening.sql` was added so the same policies can be removed from the live Supabase project manually.

## Secrets And Key Scan

- `supabase-config.js` uses a browser publishable key only.
- No `service_role` key value was found.
- No `sb_secret` key was found.
- No JWT-looking secret, `access_token`, or `refresh_token` was found in frontend source.
- HTML files do not embed Supabase secrets.
- Console logging does not print auth tokens. Some debug logs include non-token errors and, in `auth-guard.js`, the loaded staff email for debugging.

## Admin Auth Guard Result

Protected admin pages load scripts in the correct order:

1. Supabase CDN
2. `supabase-config.js`
3. `auth-guard.js`
4. Page-specific JavaScript

Confirmed protected pages:

- `admin-dashboard.html`
- `properties.html`
- `leads.html`
- `staff.html`
- `cms.html`
- `settings.html`

Public pages do not load `auth-guard.js`:

- `index.html`
- `website.html`
- `property-details.html`

## Public Data Exposure Result

Public pages read only public-safe data:

- `properties` filtered to `Active` / `Under Offer`
- `property_images`
- `branches`
- visible CMS tables
- safe `app_settings` keys
- visible CMS team profiles

Public pages do not read:

- `leads`
- `lead_communication_logs`
- `activity_logs`
- `property_documents`
- direct `staff_users`

Public pages insert into `leads` only for website enquiries.

## RLS Policy Review

Public anon access is constrained by:

- `supabase/public-website-read-policies.sql`
- `supabase/public-enquiry-policies.sql`
- `supabase/security-hardening.sql`

Admin authenticated policies are still starter policies and rely on frontend auth guard plus staff profile validation for UX-level restrictions. These should later be replaced with stricter role/branch-aware RLS using `auth.uid()` linked to `staff_users.auth_user_id`.

Hardening applied:

- Removed authenticated delete policy creation from `supabase/rls-policies.sql`.
- Added `supabase/security-hardening.sql` to drop already-created delete policies in Supabase.
- Added explicit anon revokes for private tables in `supabase/security-hardening.sql`.

## Storage Bucket Review

Storage policy files show:

- `property-images`: public read, authenticated upload/update.
- `property-documents`: private bucket, authenticated read/upload/update only.
- `cms-media`: public read, authenticated upload/update.
- No public upload policies.
- No storage delete policies found.

## Public Enquiry Safety Review

Public enquiry submission:

- Inserts into `public.leads`.
- Does not read `public.leads`.
- Does not set `assigned_agent_id`.
- Forces `source = 'Website'`.
- Forces `status = 'New'`.
- Requires name, phone, and branch.
- Validates optional email format.
- Blocks unavailable property statuses in frontend.
- RLS policy also requires property enquiries to reference `Active` / `Under Offer` properties.
- Uses a honeypot field and disables submit while sending.

## Hard Delete Scan Result

Frontend scan found no Supabase `.delete()` calls for core business records and no storage `.remove()` calls. Matches for `.remove()` were DOM/class removals only.

Source RLS now drops, but does not recreate, delete policies for:

- `properties`
- `property_images`
- `property_documents`
- `leads`

## Issues Found

Medium risk fixed:

- `supabase/rls-policies.sql` previously recreated authenticated delete policies for some core records. These were removed, and a live hardening SQL file was added.

Low-risk notes:

- Authenticated admin RLS policies are still broad starter policies. Frontend UX restrictions exist, but final production security should move role/branch checks into RLS.
- `auth-guard.js` logs the loaded staff email for debugging. This is not a token or secret, but it can be removed later if you want quieter production logs.

## Recommended Fixes

Already completed in this slice:

- Remove hard-delete policy creation from `supabase/rls-policies.sql`.
- Add `supabase/security-hardening.sql`.

Recommended later:

- Replace starter authenticated RLS policies with role-aware and branch-aware policies.
- Remove nonessential production console logging.
- Add server-side or edge-function notification flow for new website enquiries if needed.

## SQL Files To Run Manually

Run this new hardening file manually in Supabase SQL Editor:

1. `supabase/security-hardening.sql`

If not already run from previous phases, also run:

1. `supabase/public-website-read-policies.sql`
2. `supabase/public-enquiry-policies.sql`
3. `supabase/storage-setup.sql`
4. `supabase/lead-communication-logs.sql`
5. `supabase/cms-foundation.sql`
6. `supabase/cms-media-storage.sql`
7. `supabase/settings-foundation.sql`

Do not run SQL files from the browser. Do not add a `service_role` key to frontend code.

## Testing Checklist

- Open `index.html` without login.
- Open `website.html` without login.
- Open `property-details.html?id=PROPERTY_ID` without login.
- Confirm public pages do not redirect to login.
- Confirm public enquiry insert works after `public-enquiry-policies.sql` and `security-hardening.sql`.
- Confirm public pages cannot read `leads` or `property_documents`.
- Confirm admin login still works.
- Confirm logged-out admin pages redirect to `login.html`.
- Confirm linked active staff can open admin pages.
- Confirm Staff, Properties, Leads, CMS, Settings, and Admin Dashboard still load.
