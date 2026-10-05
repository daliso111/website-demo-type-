begin;

-- Market Insights belongs to Website CMS. Reuse the existing Hilltop staff
-- authorization helper instead of introducing a second administrator model.
do $$
begin
  if to_regprocedure('public.is_active_super_admin()') is null then
    raise exception 'Required Hilltop authorization helper public.is_active_super_admin() is missing.';
  end if;
end;
$$;

alter table public.market_price_statistics enable row level security;

-- Preserve the existing public SELECT grant and published-only SELECT policy.
-- Authenticated requests need table-level write grants before the admin-only
-- RLS policies below can authorize an active Hilltop Super Admin.
revoke execute on function public.is_active_super_admin() from anon;
revoke insert, update, delete on table public.market_price_statistics from anon;
revoke usage, select on sequence public.market_price_statistics_id_seq from anon;

grant insert, update, delete on table public.market_price_statistics to authenticated;
grant usage, select on sequence public.market_price_statistics_id_seq to authenticated;

drop policy if exists "Public can read published market price statistics"
on public.market_price_statistics;
create policy "Public can read published market price statistics"
on public.market_price_statistics
for select
to anon
using (is_published = true);

drop policy if exists "Authenticated users can read allowed market price statistics"
on public.market_price_statistics;
drop policy if exists "Active super admins can read all market price statistics"
on public.market_price_statistics;
create policy "Authenticated users can read allowed market price statistics"
on public.market_price_statistics
for select
to authenticated
using (is_published = true or (select public.is_active_super_admin()));

drop policy if exists "Active super admins can insert market price statistics"
on public.market_price_statistics;
create policy "Active super admins can insert market price statistics"
on public.market_price_statistics
for insert
to authenticated
with check ((select public.is_active_super_admin()));

drop policy if exists "Active super admins can update market price statistics"
on public.market_price_statistics;
create policy "Active super admins can update market price statistics"
on public.market_price_statistics
for update
to authenticated
using ((select public.is_active_super_admin()))
with check ((select public.is_active_super_admin()));

drop policy if exists "Active super admins can delete market price statistics"
on public.market_price_statistics;
create policy "Active super admins can delete market price statistics"
on public.market_price_statistics
for delete
to authenticated
using ((select public.is_active_super_admin()));

commit;
