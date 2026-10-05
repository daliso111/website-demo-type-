begin;

create extension if not exists pgtap with schema extensions;
select plan(52);

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

create temporary table workspace_test_global_counts as
select
  (select count(*) from public.provinces) as provinces,
  (select count(*) from public.cities) as cities,
  (select count(*) from public.suburbs) as suburbs;

select ok(
  (select provinces >= 0 and cities >= 0 and suburbs >= 0 from workspace_test_global_counts),
  'global geographic reference tables remain queryable'
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

-- Give anonymous tests a deterministic public/default record to read.
insert into public.branches (id, name, workspace_id)
select 'dddddddd-1000-4000-8000-000000000001', 'Public Default Test Branch', id
from public.demo_workspaces where is_public_default = true;

insert into public.properties (
  id, workspace_id, reference_number, title, purpose, property_type, branch_id, area, status
)
select
  'dddddddd-3000-4000-8000-000000000001', id, 'PUBLIC-DEFAULT-TEST',
  'Public Default Test Property', 'For Sale', 'House',
  'dddddddd-1000-4000-8000-000000000001', 'Kabulonga', 'Active'
from public.demo_workspaces where is_public_default = true;

select set_config(
  'test.default_workspace_id',
  (select id::text from public.demo_workspaces where is_public_default = true),
  true
);

insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update set public = excluded.public;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);

insert into public.branches (id, name)
values ('a1000000-0000-4000-8000-000000000001', 'Workspace A Branch');

select is(
  (select workspace_id from public.branches where id = 'a1000000-0000-4000-8000-000000000001'),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid,
  'creating a record automatically assigns the active workspace'
);

insert into public.staff_users (id, full_name, email, role, branch_id, is_active)
values (
  'a2000000-0000-4000-8000-000000000001', 'Workspace A Agent',
  'agent-a@example.com', 'agent', 'a1000000-0000-4000-8000-000000000001', true
);
insert into public.properties (
  id, reference_number, title, purpose, property_type, branch_id, assigned_agent_id, area, status
)
values (
  'a3000000-0000-4000-8000-000000000001', 'WS-A-1', 'Workspace A Property',
  'For Sale', 'House', 'a1000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000001', 'Kabulonga', 'Active'
);
insert into public.leads (id, client_name, phone, branch_id, property_id, source, status)
values (
  'a4000000-0000-4000-8000-000000000001', 'Workspace A Lead', '+260111111111',
  'a1000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001',
  'Phone Call', 'New'
);
insert into public.app_settings (setting_key, setting_category, setting_value)
values ('workspace_test', 'test', '{"workspace":"a"}'::jsonb);
insert into public.team_members (id, full_name, role, branch, phone, bio)
values (
  'a5000000-0000-4000-8000-000000000001', 'Workspace A Team Member',
  'Agent', 'Workspace A Branch', '+260111111112', 'Workspace A test member'
);

select lives_ok(
  $$select public.switch_demo_workspace('bbbbbbbb-0000-4000-8000-000000000002')$$,
  'workspace switching works'
);

insert into public.branches (id, name)
values ('b1000000-0000-4000-8000-000000000001', 'Workspace B Branch');
insert into public.staff_users (id, full_name, email, role, branch_id, is_active)
values (
  'b2000000-0000-4000-8000-000000000001', 'Workspace B Agent',
  'agent-b@example.com', 'agent', 'b1000000-0000-4000-8000-000000000001', true
);
insert into public.properties (
  id, reference_number, title, purpose, property_type, branch_id, assigned_agent_id, area, status
)
values (
  'b3000000-0000-4000-8000-000000000001', 'WS-B-1', 'Workspace B Property',
  'For Sale', 'House', 'b1000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000001', 'Roma', 'Active'
);
insert into public.leads (id, client_name, phone, branch_id, property_id, source, status)
values (
  'b4000000-0000-4000-8000-000000000001', 'Workspace B Lead', '+260222222222',
  'b1000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001',
  'Phone Call', 'New'
);
insert into public.app_settings (setting_key, setting_category, setting_value)
values ('workspace_test', 'test', '{"workspace":"b"}'::jsonb);
insert into public.team_members (id, full_name, role, branch, phone, bio)
values (
  'b5000000-0000-4000-8000-000000000001', 'Workspace B Team Member',
  'Agent', 'Workspace B Branch', '+260222222223', 'Workspace B test member'
);

select public.switch_demo_workspace('aaaaaaaa-0000-4000-8000-000000000001');

select is((select count(*) from public.properties where reference_number = 'WS-B-1'), 0::bigint, 'Workspace A cannot SELECT Workspace B properties');
select is((select count(*) from public.leads where client_name = 'Workspace B Lead'), 0::bigint, 'Workspace A cannot SELECT Workspace B leads');
select is((select count(*) from public.branches where name = 'Workspace B Branch'), 0::bigint, 'Workspace A cannot SELECT Workspace B branches');
select is((select count(*) from public.staff_users where email = 'agent-b@example.com'), 0::bigint, 'Workspace A cannot SELECT Workspace B staff');
select is((select setting_value->>'workspace' from public.app_settings where setting_key = 'workspace_test'), 'a', 'Workspace A cannot SELECT Workspace B settings');

select throws_ok(
  $$insert into public.app_settings (workspace_id, setting_key, setting_category, setting_value)
    values ('bbbbbbbb-0000-4000-8000-000000000002', 'cross_tenant', 'test', '{}'::jsonb)$$,
  '42501',
  null,
  'Workspace A cannot INSERT into Workspace B'
);

select is_empty(
  $$update public.app_settings
    set setting_value = '{"workspace":"tampered"}'::jsonb
    where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000002'
      and setting_key = 'workspace_test'
    returning id$$,
  'Workspace A cannot UPDATE Workspace B'
);

select is_empty(
  $$delete from public.team_members
    where id = 'b5000000-0000-4000-8000-000000000001'
    returning id$$,
  'Workspace A cannot DELETE Workspace B where delete capability exists'
);

select results_eq(
  $$delete from public.team_members
    where id = 'a5000000-0000-4000-8000-000000000001'
    returning id$$,
  $$values ('a5000000-0000-4000-8000-000000000001'::uuid)$$,
  'same-workspace delete capability remains available where it existed previously'
);

select throws_ok(
  $$insert into public.staff_users (full_name, email, role, branch_id, is_active)
    values ('Cross Workspace Staff', 'cross-staff@example.com', 'agent',
      'b1000000-0000-4000-8000-000000000001', true)$$,
  '23503',
  null,
  'composite foreign key rejects a staff-to-branch cross-workspace relationship'
);

select throws_ok(
  $$insert into public.properties (reference_number, title, purpose, property_type, branch_id, area, status)
    values ('CROSS-BRANCH', 'Cross Branch Property', 'For Sale', 'House',
      'b1000000-0000-4000-8000-000000000001', 'Roma', 'Active')$$,
  '23503',
  null,
  'composite foreign key rejects a property-to-branch cross-workspace relationship'
);

select throws_ok(
  $$insert into public.properties (
      reference_number, title, purpose, property_type, branch_id, assigned_agent_id, area, status
    ) values (
      'CROSS-STAFF', 'Cross Staff Property', 'For Sale', 'House',
      'a1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001',
      'Kabulonga', 'Active'
    )$$,
  '23503',
  null,
  'composite foreign key rejects a property-to-staff cross-workspace relationship'
);

select throws_ok(
  $$insert into public.property_images (property_id, image_url)
    values ('b3000000-0000-4000-8000-000000000001', 'https://example.test/cross.jpg')$$,
  '23503',
  null,
  'composite foreign key rejects a property-image cross-workspace relationship'
);

select throws_ok(
  $$insert into public.property_documents (property_id, document_name, document_type, document_url)
    values (
      'b3000000-0000-4000-8000-000000000001', 'Cross Workspace Document',
      'Other', 'https://example.test/cross.pdf'
    )$$,
  '23503',
  null,
  'composite foreign key rejects a property-document cross-workspace relationship'
);

select lives_ok(
  $$insert into public.activity_logs (
      id, action_type, description, branch_id, property_id, lead_id, staff_user_id
    ) values (
      'a6000000-0000-4000-8000-000000000001', 'workspace_test', 'Immutable audit record',
      'a1000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001',
      'a4000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001'
    )$$,
  'authenticated users can INSERT activity logs in the current workspace'
);

select is(
  (select count(*) from public.activity_logs where id = 'a6000000-0000-4000-8000-000000000001'),
  1::bigint,
  'authenticated users can SELECT activity logs in the current workspace'
);

select hasnt_table_privilege(
  'authenticated', 'public.activity_logs', 'UPDATE',
  'authenticated role has no activity-log UPDATE privilege'
);
select hasnt_table_privilege(
  'authenticated', 'public.activity_logs', 'DELETE',
  'authenticated role has no activity-log DELETE privilege'
);

select throws_ok(
  $$update public.activity_logs
    set description = 'Tampered audit record'
    where id = 'a6000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'activity logs cannot be updated'
);
select throws_ok(
  $$delete from public.activity_logs
    where id = 'a6000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'activity logs cannot be deleted'
);

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('cms-media', 'aaaaaaaa-0000-4000-8000-000000000001/workspace-test-allowed.png')$$,
  'storage accepts a path prefixed by the current workspace'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('cms-media', 'bbbbbbbb-0000-4000-8000-000000000002/workspace-test-rejected.png')$$,
  '42501',
  null,
  'workspace-prefixed storage rules reject another workspace path'
);
select is(
  private.storage_object_in_workspace(
    'cms-media',
    'bbbbbbbb-0000-4000-8000-000000000002/workspace-test-rejected.png',
    private.current_demo_workspace_id()
  ),
  false,
  'storage workspace predicate rejects another workspace prefix'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  private.request_demo_workspace_id(),
  current_setting('test.default_workspace_id')::uuid,
  'anonymous access resolves to the Hilltop public-default workspace'
);
select is(
  (select count(*) from public.properties where reference_number = 'PUBLIC-DEFAULT-TEST'),
  1::bigint,
  'anonymous users can read public data in the Hilltop default workspace'
);
select is(
  (select count(*) from public.properties where reference_number = 'WS-A-1'),
  0::bigint,
  'anonymous users cannot read another demo workspace'
);
select lives_ok($$select count(*) from public.provinces$$, 'anonymous province access remains global');
select lives_ok($$select count(*) from public.cities$$, 'anonymous city access remains global');
select lives_ok($$select count(*) from public.suburbs$$, 'anonymous suburb access remains global');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);

select lives_ok(
  $$select public.create_demo_workspace('Prime Legacy Properties', 'prime-legacy-properties-test')$$,
  'workspace creation works without a status argument'
);
select is(
  (select status from public.demo_workspaces where slug = 'prime-legacy-properties-test'),
  'active',
  'workspace creation always creates an active workspace'
);
select is(
  private.current_demo_workspace_id(),
  (select id from public.demo_workspaces where slug = 'prime-legacy-properties-test'),
  'workspace creation switches to the new active workspace'
);
select is(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_demo_workspace'
      and p.pronargs = 3
  ),
  0::bigint,
  'workspace creation does not expose an archived-status argument'
);
select throws_ok(
  $$select public.create_demo_workspace('Duplicate', 'prime-legacy-properties-test')$$,
  '23505',
  'A workspace with this slug already exists.',
  'duplicate workspace slugs are rejected'
);

select public.switch_demo_workspace('aaaaaaaa-0000-4000-8000-000000000001');
select lives_ok(
  $$select public.switch_demo_workspace('bbbbbbbb-0000-4000-8000-000000000002')$$,
  'Workspace B can be selected before archiving'
);
select lives_ok(
  $$select public.archive_demo_workspace('bbbbbbbb-0000-4000-8000-000000000002')$$,
  'workspace archiving works'
);
select is(
  (select status from public.demo_workspaces where id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  'archived',
  'archiving preserves the workspace record with archived status'
);
select is(
  (
    select count(*)
    from public.demo_workspace_memberships
    where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000002'
      and is_current = true
  ),
  0::bigint,
  'archiving invalidates the archived current selection'
);
select is(
  private.current_demo_workspace_id(),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid,
  'archiving the current workspace selects an active fallback'
);

reset role;

select is(
  (select count(*) from public.properties where id = 'b3000000-0000-4000-8000-000000000001'),
  1::bigint,
  'archiving preserves workspace business records'
);
select is(
  (select setting_value->>'workspace' from public.app_settings
    where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000002'
      and setting_key = 'workspace_test'),
  'b',
  'cross-workspace UPDATE attempt leaves Workspace B unchanged'
);
select is(
  (select count(*) from public.team_members where id = 'b5000000-0000-4000-8000-000000000001'),
  1::bigint,
  'cross-workspace DELETE attempt leaves Workspace B unchanged'
);
select is(
  (select description from public.activity_logs where id = 'a6000000-0000-4000-8000-000000000001'),
  'Immutable audit record',
  'denied activity-log UPDATE leaves the audit record unchanged'
);
select is(
  (select count(*) from public.activity_logs where id = 'a6000000-0000-4000-8000-000000000001'),
  1::bigint,
  'denied activity-log DELETE preserves the audit record'
);
select ok(
  (
    select
      snapshot.provinces = (select count(*) from public.provinces)
      and snapshot.cities = (select count(*) from public.cities)
      and snapshot.suburbs = (select count(*) from public.suburbs)
    from workspace_test_global_counts snapshot
  ),
  'workspace operations do not alter global provinces, cities, or suburbs'
);
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
