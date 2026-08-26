-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - STORAGE SETUP
-- Phase 3C: property images and private property documents.
--
-- Run this manually in the Supabase SQL Editor before testing
-- image/document uploads from properties.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false)
on conflict (id) do update
set public = excluded.public;

-- ============================================================
-- PROPERTY IMAGES
-- Public read is allowed because property listing photos may
-- appear on the public website later.
-- Authenticated users can upload and update objects.
-- Delete is intentionally not added in this slice.
-- ============================================================

drop policy if exists "Public can read property images" on storage.objects;
create policy "Public can read property images"
on storage.objects
for select
to public
using (bucket_id = 'property-images');

drop policy if exists "Authenticated users can upload property images" on storage.objects;
create policy "Authenticated users can upload property images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'property-images');

drop policy if exists "Authenticated users can update property images" on storage.objects;
create policy "Authenticated users can update property images"
on storage.objects
for update
to authenticated
using (bucket_id = 'property-images')
with check (bucket_id = 'property-images');

-- ============================================================
-- PROPERTY DOCUMENTS
-- Private bucket. Public users must not read legal/ownership docs.
-- Authenticated users can upload/read/update documents.
-- Delete is intentionally not added in this slice.
-- ============================================================

drop policy if exists "Authenticated users can read property documents" on storage.objects;
create policy "Authenticated users can read property documents"
on storage.objects
for select
to authenticated
using (bucket_id = 'property-documents');

drop policy if exists "Authenticated users can upload property documents" on storage.objects;
create policy "Authenticated users can upload property documents"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'property-documents');

drop policy if exists "Authenticated users can update property documents" on storage.objects;
create policy "Authenticated users can update property documents"
on storage.objects
for update
to authenticated
using (bucket_id = 'property-documents')
with check (bucket_id = 'property-documents');
