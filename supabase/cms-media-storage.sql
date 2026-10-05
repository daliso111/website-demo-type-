-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - CMS MEDIA STORAGE
-- Phase 6C: public CMS banner images and team profile photos.
--
-- Run this manually in Supabase SQL Editor before testing CMS
-- media uploads from cms.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update
set public = excluded.public;

-- Public read is allowed because banner images and team photos
-- may appear on the public website later.
drop policy if exists "Public can read CMS media" on storage.objects;
create policy "Public can read CMS media"
on storage.objects
for select
to public
using (bucket_id = 'cms-media');

-- Authenticated admin users can upload CMS media.
-- Later: replace with stricter role-based checks using
-- auth.uid() linked to public.staff_users.auth_user_id.
drop policy if exists "Authenticated users can upload CMS media" on storage.objects;
create policy "Authenticated users can upload CMS media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cms-media');

-- Authenticated admin users can update CMS media objects.
-- Delete is intentionally not added in this phase.
drop policy if exists "Authenticated users can update CMS media" on storage.objects;
create policy "Authenticated users can update CMS media"
on storage.objects
for update
to authenticated
using (bucket_id = 'cms-media')
with check (bucket_id = 'cms-media');
