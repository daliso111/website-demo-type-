# New Supabase Project: Structure-Only Setup

This setup is for a brand-new Supabase project. It creates tables, functions,
security policies, and empty Storage buckets. It does not copy or upload any
records, users, pictures, videos, documents, or other content from the previous
Supabase project.

## Run these files in Supabase SQL Editor

Run each file separately and in this order:

1. `schema.sql`
2. `rls-policies.sql`
3. `storage-setup.sql`
4. `lead-communication-logs.sql`
5. `cms-foundation.sql`
6. `cms-testimonial-backgrounds.sql`
7. `cms-media-storage.sql`
8. `settings-foundation.sql`
9. `services-showcase-cms.sql`
10. `team-members-setup.sql`
11. `property-currency-support.sql`
12. `property-exclusive-controls.sql`
13. `property-services-cms.sql`
14. `public-website-read-policies.sql`
15. `public-enquiry-policies.sql`
16. `security-hardening.sql`
17. `hero-video-cms-policies.sql`
18. `why-hilltop-hero-settings.sql`

The `insert into storage.buckets` statements in this sequence create empty
bucket definitions only. They do not upload or transfer media files.

## Do not run for this blank setup

- `seed.sql` — inserts sample branches, staff, properties, images, leads, and logs.
- `optional-sample-public-data.sql` — inserts sample public property content.
- `add-auth-user-id-to-staff-users.sql` — unnecessary for a fresh project because
  `schema.sql` already creates the `auth_user_id` column.

`property-services-cms.sql` has also been made structure-only for this project;
its previous default service-section and service-card rows are intentionally not
inserted.

## After the structure is installed

Create a new user in Supabase Authentication, then create a matching
`public.staff_users` row with that Auth user's UUID in `auth_user_id`. Add all
new website copy and media through this project's CMS. Do not reuse media URLs
from the old Supabase project.

