-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - STARTER RLS POLICIES
-- ============================================================
-- These are safe starter policies for authenticated users only.
-- Stricter role-based access will be added later when Supabase Auth
-- users are mapped to staff_users records.
--
-- Important:
-- - No public unrestricted write access is created here.
-- - Never use service_role keys in frontend code.
-- ============================================================

alter table public.branches enable row level security;
alter table public.staff_users enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_documents enable row level security;
alter table public.leads enable row level security;
alter table public.activity_logs enable row level security;

-- ============================================================
-- READ POLICIES
-- Authenticated users can read phase-1 admin data.
-- ============================================================

drop policy if exists "Authenticated users can read branches" on public.branches;
create policy "Authenticated users can read branches"
on public.branches
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read staff users" on public.staff_users;
create policy "Authenticated users can read staff users"
on public.staff_users
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read properties" on public.properties;
create policy "Authenticated users can read properties"
on public.properties
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read property images" on public.property_images;
create policy "Authenticated users can read property images"
on public.property_images
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read property documents" on public.property_documents;
create policy "Authenticated users can read property documents"
on public.property_documents
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read leads" on public.leads;
create policy "Authenticated users can read leads"
on public.leads
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read activity logs" on public.activity_logs;
create policy "Authenticated users can read activity logs"
on public.activity_logs
for select
to authenticated
using (true);

-- ============================================================
-- WRITE POLICIES
-- Starter admin writes are limited to authenticated users.
-- Later: replace these with policies that check staff_users.role and
-- staff_users.branch_id against auth.uid() mapped user records.
-- ============================================================

drop policy if exists "Authenticated users can insert branches" on public.branches;
create policy "Authenticated users can insert branches"
on public.branches
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update branches" on public.branches;
create policy "Authenticated users can update branches"
on public.branches
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can insert staff users" on public.staff_users;
create policy "Authenticated users can insert staff users"
on public.staff_users
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update staff users" on public.staff_users;
create policy "Authenticated users can update staff users"
on public.staff_users
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can insert properties" on public.properties;
create policy "Authenticated users can insert properties"
on public.properties
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update properties" on public.properties;
create policy "Authenticated users can update properties"
on public.properties
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete properties" on public.properties;

drop policy if exists "Authenticated users can insert property images" on public.property_images;
create policy "Authenticated users can insert property images"
on public.property_images
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update property images" on public.property_images;
create policy "Authenticated users can update property images"
on public.property_images
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete property images" on public.property_images;

drop policy if exists "Authenticated users can insert property documents" on public.property_documents;
create policy "Authenticated users can insert property documents"
on public.property_documents
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update property documents" on public.property_documents;
create policy "Authenticated users can update property documents"
on public.property_documents
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete property documents" on public.property_documents;

drop policy if exists "Authenticated users can insert leads" on public.leads;
create policy "Authenticated users can insert leads"
on public.leads
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update leads" on public.leads;
create policy "Authenticated users can update leads"
on public.leads
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete leads" on public.leads;

drop policy if exists "Authenticated users can insert activity logs" on public.activity_logs;
create policy "Authenticated users can insert activity logs"
on public.activity_logs
for insert
to authenticated
with check (true);
