-- ============================================================
-- HILLTOP PROPERTIES ZAMBIA - LEAD COMMUNICATION LOGS
-- Phase 4C: lead communication notes and follow-up history.
--
-- Run this manually in Supabase SQL Editor before testing
-- communication log persistence from leads.html.
--
-- No service_role key is required in frontend code.
-- ============================================================

create table if not exists public.lead_communication_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  staff_user_id uuid references public.staff_users(id) on delete set null,
  communication_type text not null default 'Note',
  message text not null,
  follow_up_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_communication_logs_lead_id
on public.lead_communication_logs(lead_id);

create index if not exists idx_lead_communication_logs_staff_user_id
on public.lead_communication_logs(staff_user_id);

create index if not exists idx_lead_communication_logs_created_at
on public.lead_communication_logs(created_at desc);

alter table public.lead_communication_logs enable row level security;

-- Starter authenticated-user policies only.
-- Later: replace these with stricter role and branch-based policies
-- using auth.uid() linked to public.staff_users.auth_user_id.

drop policy if exists "Authenticated users can read lead communication logs" on public.lead_communication_logs;
create policy "Authenticated users can read lead communication logs"
on public.lead_communication_logs
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert lead communication logs" on public.lead_communication_logs;
create policy "Authenticated users can insert lead communication logs"
on public.lead_communication_logs
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update lead communication logs" on public.lead_communication_logs;
create policy "Authenticated users can update lead communication logs"
on public.lead_communication_logs
for update
to authenticated
using (true)
with check (true);
