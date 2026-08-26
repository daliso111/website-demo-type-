-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - PUBLIC ENQUIRY POLICIES
-- Phase 8B: safe anonymous website enquiry submissions.
--
-- Run this manually in Supabase SQL Editor before testing public
-- enquiry submission.
--
-- No service_role key is required in frontend code.
-- This file allows anon INSERT into public.leads only. It does
-- not grant anon SELECT, UPDATE, or DELETE on public.leads.
-- ============================================================

revoke select, update, delete on public.leads from anon;

drop policy if exists "Anon can submit public website enquiries" on public.leads;
create policy "Anon can submit public website enquiries"
on public.leads
for insert
to anon
with check (
  source = 'Website'
  and status = 'New'
  and assigned_agent_id is null
  and branch_id is not null
  and length(trim(client_name)) > 0
  and length(trim(phone)) > 0
  and (
    property_id is null
    or exists (
      select 1
      from public.properties p
      where p.id = leads.property_id
        and p.status in ('Active', 'Under Offer')
    )
  )
);

grant insert (
  client_name,
  phone,
  email,
  property_id,
  branch_id,
  source,
  status,
  notes
) on public.leads to anon;
