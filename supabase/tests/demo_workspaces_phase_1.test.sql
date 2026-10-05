begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select ok(
  (select count(*) = 1 from public.demo_workspaces where is_public_default = true and slug = 'hilltop-template'),
  'existing Hilltop data has one public template workspace'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('provinces', 'cities', 'suburbs')
      and column_name = 'workspace_id'
  ),
  'shared geographic reference tables remain global'
);

select ok(
  not exists (
    select 1 from public.properties where workspace_id <> (select id from public.demo_workspaces where is_public_default)
    union all select 1 from public.leads where workspace_id <> (select id from public.demo_workspaces where is_public_default)
    union all select 1 from public.branches where workspace_id <> (select id from public.demo_workspaces where is_public_default)
    union all select 1 from public.staff_users where workspace_id <> (select id from public.demo_workspaces where is_public_default)
    union all select 1 from public.app_settings where workspace_id <> (select id from public.demo_workspaces where is_public_default)
  ),
  'pre-workspace Hilltop records remain intact in the template workspace'
);

insert into auth.users (id, email)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'workspace-test@example.com')
on conflict (id) do nothing;

insert into public.demo_workspaces (id, name, slug, status)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Workspace A', 'workspace-a-test', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Workspace B', 'workspace-b-test', 'active');

insert into public.demo_workspace_memberships (workspace_id, auth_user_id, role, status, is_current)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'super_admin', 'active', true),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'super_admin', 'active', false);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);

insert into public.branches (name) values ('Workspace A Branch');
select is(
  (select workspace_id from public.branches where name = 'Workspace A Branch'),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid,
  'creating a record automatically assigns the active workspace'
);

insert into public.staff_users (full_name, email, role, is_active)
values ('Workspace A Agent', 'agent-a@example.com', 'agent', true);
insert into public.properties (
  reference_number, title, purpose, property_type, branch_id, area, status
)
select 'WS-A-1', 'Workspace A Property', 'For Sale', 'House', id, 'Kabulonga', 'Active'
from public.branches where name = 'Workspace A Branch';
insert into public.leads (client_name, phone, branch_id, source, status)
select 'Workspace A Lead', '+260111111111', id, 'Phone Call', 'New'
from public.branches where name = 'Workspace A Branch';
insert into public.app_settings (setting_key, setting_category, setting_value)
values ('workspace_test', 'test', '{"workspace":"a"}'::jsonb);

select lives_ok(
  $$select public.switch_demo_workspace('bbbbbbbb-0000-4000-8000-000000000002')$$,
  'workspace switching works'
);

insert into public.branches (name) values ('Workspace B Branch');
insert into public.staff_users (full_name, email, role, is_active)
values ('Workspace B Agent', 'agent-b@example.com', 'agent', true);
insert into public.properties (
  reference_number, title, purpose, property_type, branch_id, area, status
)
select 'WS-B-1', 'Workspace B Property', 'For Sale', 'House', id, 'Roma', 'Active'
from public.branches where name = 'Workspace B Branch';
insert into public.leads (client_name, phone, branch_id, source, status)
select 'Workspace B Lead', '+260222222222', id, 'Phone Call', 'New'
from public.branches where name = 'Workspace B Branch';
insert into public.app_settings (setting_key, setting_category, setting_value)
values ('workspace_test', 'test', '{"workspace":"b"}'::jsonb);

select public.switch_demo_workspace('aaaaaaaa-0000-4000-8000-000000000001');

select is((select count(*) from public.properties where reference_number = 'WS-B-1'), 0::bigint, 'Workspace A cannot retrieve Workspace B properties');
select is((select count(*) from public.leads where client_name = 'Workspace B Lead'), 0::bigint, 'Workspace A cannot retrieve Workspace B leads');
select is((select count(*) from public.branches where name = 'Workspace B Branch'), 0::bigint, 'Workspace A cannot retrieve Workspace B branches');
select is((select count(*) from public.staff_users where email = 'agent-b@example.com'), 0::bigint, 'Workspace A cannot retrieve Workspace B staff');
select is((select setting_value->>'workspace' from public.app_settings where setting_key = 'workspace_test'), 'a', 'workspace settings remain isolated');

select throws_ok(
  $$insert into public.app_settings (workspace_id, setting_key, setting_category, setting_value)
    values ('bbbbbbbb-0000-4000-8000-000000000002', 'cross_tenant', 'test', '{}'::jsonb)$$,
  '42501',
  null,
  'RLS rejects a write carrying another workspace id'
);

select lives_ok(
  $$select public.create_demo_workspace('Prime Legacy Properties', 'prime-legacy-properties-test', 'active')$$,
  'workspace creation works'
);
select is((select private.current_demo_workspace_id()), (select id from public.demo_workspaces where slug = 'prime-legacy-properties-test'), 'creation switches to the new workspace');

select throws_ok(
  $$select public.create_demo_workspace('Duplicate', 'prime-legacy-properties-test', 'active')$$,
  '23505',
  'A workspace with this slug already exists.',
  'duplicate workspace slugs are rejected'
);

select public.switch_demo_workspace('aaaaaaaa-0000-4000-8000-000000000001');
select lives_ok(
  $$select public.archive_demo_workspace('bbbbbbbb-0000-4000-8000-000000000002')$$,
  'workspace archiving works'
);
select is((select count(*) from public.demo_workspaces where slug = 'workspace-b-test' and status = 'active'), 0::bigint, 'archived workspaces leave the active selector');

reset role;
select is((select count(*) from public.properties where reference_number = 'WS-B-1'), 1::bigint, 'archiving does not delete workspace data');
select ok(
  not exists (
    select 1 from public.properties where workspace_id is null
    union all select 1 from public.leads where workspace_id is null
    union all select 1 from public.branches where workspace_id is null
    union all select 1 from public.staff_users where workspace_id is null
    union all select 1 from public.app_settings where workspace_id is null
  ),
  'workspace migration leaves no core Hilltop records orphaned'
);

select * from finish();
rollback;
