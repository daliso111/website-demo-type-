-- Forward-upgrade hardening for databases that recorded an earlier copy of
-- the Phase 1 migration before its final security fixes were added.

begin;

-- Retire only the legacy overload. REVOKE has no IF EXISTS form, so guard it
-- before removing the exact three-argument signature.
do $$
begin
  if to_regprocedure('public.create_demo_workspace(text,text,text)') is not null then
    execute 'revoke execute on function public.create_demo_workspace(text, text, text) from public, anon, authenticated';
  end if;
end;
$$;

drop function if exists public.create_demo_workspace(text, text, text);

-- Reassert the name-and-slug-only implementation as the authoritative RPC.
-- Workspace creation is atomic: authorization, active workspace creation,
-- caller membership, and selection all succeed or fail together.
create or replace function public.create_demo_workspace(
  p_name text,
  p_slug text
)
returns public.demo_workspaces
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  clean_name text := btrim(p_name);
  clean_slug text := lower(btrim(p_slug));
  created_workspace public.demo_workspaces;
begin
  if caller_id is null or not private.is_current_workspace_super_admin() then
    raise exception using errcode = '42501', message = 'Only an active super administrator can create a workspace.';
  end if;
  if clean_name is null or char_length(clean_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Workspace name must contain 2 to 120 characters.';
  end if;
  if clean_slug is null or clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(clean_slug) > 80 then
    raise exception using errcode = '22023', message = 'Workspace slug must use lowercase letters, numbers, and single hyphens.';
  end if;

  begin
    insert into public.demo_workspaces (name, slug, status, created_by)
    values (clean_name, clean_slug, 'active', caller_id)
    returning * into created_workspace;
  exception when unique_violation then
    raise exception using errcode = '23505', message = 'A workspace with this slug already exists.';
  end;

  insert into public.demo_workspace_memberships (
    workspace_id, auth_user_id, role, status, is_current, created_by
  ) values (
    created_workspace.id, caller_id, 'super_admin', 'active', false, caller_id
  );

  perform public.switch_demo_workspace(created_workspace.id);

  return created_workspace;
end;
$$;

revoke all on function public.create_demo_workspace(text, text) from public, anon, authenticated;
grant execute on function public.create_demo_workspace(text, text) to authenticated;

-- Remove UPDATE/DELETE policies reachable by authenticated, whether they were
-- granted directly or to PUBLIC, then restore only workspace-scoped reads and
-- appends. This removes policies left behind by the originally applied Phase 1.
alter table public.activity_logs enable row level security;

do $$
declare
  authenticated_oid oid;
  policy_record record;
begin
  select oid into authenticated_oid
  from pg_roles
  where rolname = 'authenticated';

  for policy_record in
    select policy.polname
    from pg_policy policy
    where policy.polrelid = 'public.activity_logs'::regclass
      and policy.polcmd in ('w', 'd')
      and (
        0::oid = any(policy.polroles)
        or exists (
          select 1
          from unnest(policy.polroles) policy_role(oid)
          where policy_role.oid <> 0
            and pg_has_role(authenticated_oid, policy_role.oid, 'member')
        )
      )
  loop
    execute format('drop policy %I on public.activity_logs', policy_record.polname);
  end loop;
end;
$$;

drop policy if exists workspace_select on public.activity_logs;
drop policy if exists workspace_insert on public.activity_logs;

create policy workspace_select on public.activity_logs
for select to authenticated
using (workspace_id = (select private.current_demo_workspace_id()));

create policy workspace_insert on public.activity_logs
for insert to authenticated
with check (workspace_id = (select private.current_demo_workspace_id()));

revoke update, delete on table public.activity_logs from public, anon;
revoke all privileges on table public.activity_logs from authenticated;
grant select, insert on table public.activity_logs to authenticated;

-- The pre-workspace Services Showcase policy used FOR ALL. Restore its DELETE
-- capability without reopening cross-workspace access on already-migrated DBs.
drop policy if exists workspace_delete on public.cms_service_showcase_items;
create policy workspace_delete on public.cms_service_showcase_items
for delete to authenticated
using (workspace_id = (select private.current_demo_workspace_id()));

commit;
