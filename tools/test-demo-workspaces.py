"""Static integration checks for Phase 1 demo workspace coverage."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase" / "migrations" / "20261003134629_demo_workspaces_phase_1.sql"
ADMIN_PAGES = [
    "admin-dashboard.html", "properties.html", "leads.html", "staff.html",
    "settings.html", "cms.html", "admin-team.html",
]
SCOPED_TABLES = [
    "branches", "staff_users", "properties", "property_images",
    "property_documents", "leads", "activity_logs", "lead_communication_logs",
    "app_settings", "cms_homepage_content", "cms_banners", "cms_team_profiles",
    "cms_testimonials", "cms_featured_properties", "cms_service_showcase_items",
    "cms_services_section", "cms_service_cards", "team_members",
    "market_price_statistics",
]


def require(condition, message):
    if not condition:
        raise AssertionError(message)


sql = MIGRATION.read_text(encoding="utf-8").lower()
workspace_js = (ROOT / "workspace.js").read_text(encoding="utf-8")

require("create table if not exists public.demo_workspaces" in sql, "workspace table missing")
require("create table if not exists public.demo_workspace_memberships" in sql, "membership table missing")
require("constraint demo_workspaces_slug_key unique (slug)" in sql, "slug uniqueness missing")
require("status in ('active', 'archived')" in sql, "archive status missing")
require("on delete restrict" in sql, "safe workspace delete behavior missing")
require("create or replace function public.create_demo_workspace" in sql, "atomic create function missing")
require("public.create_demo_workspace(text, text)" in sql, "workspace creation must expose only name and slug")
require("public.create_demo_workspace(text, text, text)" not in sql, "workspace creation must not accept status")
require("values (clean_name, clean_slug, 'active', caller_id)" in sql, "new workspaces must be active")
require("create or replace function public.switch_demo_workspace" in sql, "atomic switch function missing")
require("create or replace function public.archive_demo_workspace" in sql, "archive function missing")
require("perform public.switch_demo_workspace(created_workspace.id)" in sql, "new workspace does not auto-switch")
require("a workspace with this slug already exists" in sql, "duplicate slug error missing")
require("hilltop template" in sql and "hilltop-template" in sql, "safe Hilltop backfill workspace missing")
require("where su.auth_user_id is not null" in sql, "existing staff membership backfill missing")
require("update public.%i set workspace_id = $1 where workspace_id is null" in sql, "existing record backfill missing")

for table in SCOPED_TABLES:
    require(f"'{table}'" in sql, f"{table} is absent from workspace table inventory")

for global_table in ("provinces", "cities", "suburbs"):
    require(
        f"alter table public.{global_table} add column" not in sql,
        f"global reference table {global_table} must not receive workspace_id",
    )

for entity in ("properties", "leads", "branches", "staff_users", "app_settings"):
    require(f"workspace_id = (select private.current_demo_workspace_id())" in sql, f"RLS helper missing for {entity}")

require("public_default_properties" in sql, "public property policy is not pinned to Hilltop")
require("public_default_lead_insert" in sql, "public enquiries are not pinned to Hilltop")
require("security_invoker = true" in sql, "safe public view mode missing")
require("workspace authenticated media uploads" in sql, "storage write isolation missing")
require("(storage.foldername(name))[1] = private.current_demo_workspace_id()::text" in sql, "workspace media prefixes missing")

require("localStorage.setItem" in workspace_js, "selected workspace is not persisted")
require("hilltop:workspace-changing" in workspace_js, "stale-data clearing event missing")
require("hilltop:workspace-changed" in workspace_js, "workspace reload event missing")
require("create_demo_workspace" in workspace_js, "create workspace UI does not call database function")
require("switch_demo_workspace" in workspace_js, "selector does not call database function")
require("archive_demo_workspace" in workspace_js, "shared context does not support archiving")
require("workspace.status === 'active'" in workspace_js, "archived workspaces are not filtered")
require("withWorkspace" in workspace_js and "scope" in workspace_js, "shared query/mutation utilities missing")
require("'workspace public media reads','workspace authenticated media reads'" in sql, "workspace storage policies are not repeatably replaced")
require("revoke update, delete on public.activity_logs from authenticated" in sql, "audit mutation privileges remain enabled")
require("create policy workspace_update on public.activity_logs" not in sql, "audit logs must not have an UPDATE policy")
require("create policy workspace_insert on public.activity_logs" in sql, "audit log append policy missing")
require("p_status" not in workspace_js, "shared frontend workspace creation must not expose status")

for page in ADMIN_PAGES:
    html = (ROOT / page).read_text(encoding="utf-8")
    require('href="workspace.css"' in html, f"{page} does not load workspace styles")
    require('src="workspace.js"' in html, f"{page} does not load workspace context")
    require(html.index('src="workspace.js"') < html.index("</body>"), f"{page} workspace script order invalid")

for module in ("script.js", "properties.js", "leads.js", "staff.js", "settings.js", "cms.js", "admin-team.js"):
    source = (ROOT / module).read_text(encoding="utf-8")
    require("hilltop:workspace-changed" in source, f"{module} does not reload after switching")

print({
    "scoped_tables": len(SCOPED_TABLES),
    "admin_pages": len(ADMIN_PAGES),
    "checks": "passed",
})
