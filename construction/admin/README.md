# Hilltop Construction homepage admin prototype

Open `/admin/` through the same static server used for the public homepage. Authentication and Discovery Bridge now use Supabase; every other dashboard module remains on browser-local mock data.

## Supabase setup

1. Create or select a Supabase project.
2. Open the Supabase SQL Editor and run `supabase/migrations/202607110001_discovery_bridge_foundation.sql` once.
3. Copy the project URL and public anonymous key from Project Settings → API. Never use a service-role key in frontend code.
4. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`, then generate the ignored browser configuration:

   ```powershell
   $env:SUPABASE_URL='https://your-project-ref.supabase.co'
   $env:SUPABASE_ANON_KEY='your-public-anon-key'
   .\scripts\generate-supabase-env.ps1
   ```

   Static hosting may instead inject `window.__HILLTOP_ENV__` with the same two property names before the application modules load.

5. Start the local server and open `http://localhost:8765/admin/`.

## Hero resumable video uploads

Hero videos use the browser build of `tus-js-client` pinned to version `4.3.1` and loaded as an ESM dependency from jsDelivr by `shared/homepage-media-service.js`. No service-role credential is used; the uploader forwards the current administrator access token to the project-specific direct Storage hostname derived from `SUPABASE_URL`.

The application accepts MP4 and WebM videos up to 49 MB and uploads them in required 6 MB TUS chunks. In Supabase Dashboard → Storage → Settings, confirm the global file-size limit is at least 50 MB and confirm the `homepage-media` bucket limit is also at least 50 MB. The lower of those two limits always wins.

If a browser refresh interrupts an upload, select the same local file again within 24 hours. The TUS fingerprint and persisted unique Storage path will automatically resume the matching unfinished upload.

## Create the first administrator

1. In Supabase Authentication → Users, create a user with email and password. The migration trigger creates an inactive `admin_profiles` row for new users.
2. In the SQL Editor, activate that exact user by ID:

   ```sql
   update public.admin_profiles
   set role = 'admin', is_active = true
   where user_id = 'AUTH-USER-UUID-HERE';
   ```

If the Auth user existed before the migration, insert its profile first in the SQL Editor, using the same Auth user UUID and email, then mark it active. Do not add profile-management privileges to the browser client.

```sql
insert into public.admin_profiles (user_id, email, role, is_active)
select id, email, 'admin', true
from auth.users
where id = 'AUTH-USER-UUID-HERE'
on conflict (user_id) do update
set role = 'admin', is_active = true;
```

## Structure

- `index.html` contains the accessible dashboard shell, dialogs, and live regions.
- `admin.css` contains admin-only layout, components, preview styles, and responsive rules.
- `admin.js` renders all dashboard pages, protects the dashboard behind the Supabase session/profile check, and handles navigation, forms, validation, CRUD, ordering, notifications, and preview mode.
- `mock-homepage-data.js` is the documented source shape for homepage content.
- `homepage-data-service.js` abstracts reads, writes, publishing, deletion, and ordering over `localStorage`.
- `auth-service.js` owns email/password sign-in, session restoration, profile authorization, and sign-out.
- `../shared/supabase-client.js` owns the reusable browser client and static environment loading.
- `../shared/discovery-bridge-service.js` owns all Discovery Bridge database operations.

## Mock data model

The root object contains `hero`, `discoveryBridge`, `featuredProjects`, `expertiseSlides`, `businessSnapshot`, `newsArticles`, `mediaAssets`, `homepageSections`, `homepageSettings`, and `meta`. Items have stable mock IDs, display order, visibility, status, and edit timestamps where relevant.

The local service boundary remains unchanged for Hero, Featured Projects, Expertise, Business Snapshot, News, Media, and Homepage Settings. Discovery Bridge uses `getDiscoveryBridge`, `saveDiscoveryBridgeDraft`, `publishDiscoveryBridge`, `unpublishDiscoveryBridge`, and `updateDiscoveryBridgeVisibility`.

## Persistence and reset

Discovery Bridge is persisted in Supabase. Changes to every other dashboard module are stored under `hilltop.homepage.admin.v1` in browser `localStorage`. Homepage Settings resets only that mock content and does not modify the Supabase record.

## Current database scope

Only `admin_profiles` and `discovery_bridge_settings` exist. RLS permits anonymous reads only for the stable `homepage` Discovery Bridge record when it is both published and visible. Authenticated users must have an active `admin` or `editor` profile to read drafts or insert/update the singleton. Profile roles cannot be changed through the browser client.

The public homepage requests the published record after its fallback HTML is visible. A missing configuration, network failure, unpublished record, hidden record, or database error leaves the hard-coded content unchanged.

## Manual verification

1. Sign in with an active administrator.
2. Open Discovery Bridge and change the paragraph.
3. Save Draft, refresh `/admin/`, and confirm the draft remains.
4. Open the public homepage and confirm it still shows the existing published content.
5. Publish the draft and refresh the public homepage; confirm the new paragraph, button, URL, and alignment appear.
6. Unpublish and refresh the public homepage; confirm the hard-coded fallback returns.
7. Publish with visibility disabled and confirm the public fallback remains.
8. Disconnect Supabase or temporarily use an invalid URL and confirm the public fallback remains visible.
9. Sign out and confirm `/admin/` returns to the login screen.
10. Confirm Hero, Featured Projects, Expertise, Business Snapshot, News, Media, and Homepage Settings still persist through the local mock service.

## Future Supabase mapping

After this pipeline is approved, recommended later tables are `hero_settings`, `homepage_sections`, `featured_projects`, `expertise_slides`, `business_snapshot_settings`, `business_snapshot_statistics`, `news_articles`, `media_assets`, `media_asset_usage`, and `homepage_settings`. Discovery Bridge deliberately separates `status` (`draft` or `published`) from `is_visible`.

Do not generate the schema until fields and editorial workflows are approved.
