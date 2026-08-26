# Hilltop Properties Zambia Supabase Foundation

This folder prepares the plain HTML/CSS/JavaScript admin dashboard for a future Supabase connection.

No React, Next.js, Vite, npm, backend server, or database client rewrite is required for this phase.

## Files

- `schema.sql` creates the phase-1 database tables, constraints, indexes, and update triggers.
- `rls-policies.sql` enables Row Level Security and adds starter authenticated-user policies.
- `seed.sql` inserts realistic sample branches, staff users, properties, leads, documents, images, and activity logs.

## Setup Order In Supabase

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Paste and run `schema.sql`.
4. Confirm `staff_users` exists in **Table Editor**.
5. If this is a fresh project, skip `add-auth-user-id-to-staff-users.sql` because `schema.sql` already includes `auth_user_id`.
6. If your `staff_users` table existed before the Auth link was added and is missing `auth_user_id`, paste and run `add-auth-user-id-to-staff-users.sql`.
7. Paste and run `rls-policies.sql`.
8. Paste and run `seed.sql`.

Do not run `add-auth-user-id-to-staff-users.sql` before `schema.sql`. That patch depends on `public.staff_users` already existing.

## Admin Account Setup

This is an admin portal. Do not add a public sign-up page. Staff accounts should be created manually by the system administrator.

1. Go to the Supabase Dashboard.
2. Open **Authentication -> Users**.
3. Add a new user manually.
4. Copy the Auth user UID.
5. Open **SQL Editor** and link that Auth user to `public.staff_users`:

```sql
update public.staff_users
set auth_user_id = 'PASTE_AUTH_USER_UID_HERE'
where email = 'admin@hilltopproperties.co.zm';
```

The `auth_user_id` link is the bridge between Supabase Auth and the `staff_users` profile table. Strict branch and role-based RLS will use this relationship later.
6. Test login using `login.html`.

## Frontend Config

Open `supabase-config.js` and replace only these placeholders:

```js
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY";
```

Use your Supabase project URL and publishable/anon key. Do not use secret keys in frontend code.

## Security Notes

- Do not put a `service_role` key in frontend code.
- Use only the publishable/anon key in `supabase-config.js`.
- The starter RLS policies are intentionally simple for the first connection phase.
- Later, policies should be tightened by mapping Supabase Auth users to `staff_users` records and checking staff roles and branch access.

## Frontend Loading Order

When you are ready to connect Module 2, load scripts in this order:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="auth-guard.js"></script>
<script src="properties.js"></script>
```

## Testing Login

1. Open `login.html` with VS Code Live Server.
2. Sign in with the test admin email and password you created in Supabase Auth.
3. A successful login redirects to `index.html`.
4. Open `properties.html` after login to confirm the protected property management page loads.
5. Click **Logout** in the sidebar footer to return to `login.html`.

For now, `script.js` and `properties.js` still use local sample data. The next step is to update `properties.js` carefully so it can read from Supabase while keeping a demo fallback.
