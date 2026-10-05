"""Playwright verification for the shared workspace selector/create dialog."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".codex-artifacts" / "demo-workspaces"
OUT.mkdir(parents=True, exist_ok=True)

HTML = """
<!doctype html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;min-height:100%;font-family:Inter,Arial,sans-serif;background:#eef3f6}
.sidebar{width:270px;min-height:100vh;padding-top:18px;background:#071d2d;color:white}
.sidebar-brand{padding:14px 26px 20px;font-family:Georgia,serif;font-size:21px;border-bottom:1px solid rgba(255,255,255,.1)}
.page{position:absolute;left:270px;right:0;top:0;padding:34px;color:#173247}.page h1{font-family:Georgia,serif}
</style><link rel="stylesheet" href="../workspace.css"></head>
<body><aside class="sidebar"><div class="sidebar-brand">Hilltop Properties</div></aside>
<main class="page"><h1>Dashboard</h1><p>Workspace UI verification harness</p></main></body></html>
"""


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.set_content(HTML)
    page.add_style_tag(path=str(ROOT / "workspace.css"))
    page.evaluate("""() => {
      const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      window.__memberships = [
        {workspace_id:'11111111-1111-4111-8111-111111111111',role:'super_admin',status:'active',is_current:true,demo_workspaces:{id:'11111111-1111-4111-8111-111111111111',name:'Hilltop Template',slug:'hilltop-template',status:'active'}},
        {workspace_id:'22222222-2222-4222-8222-222222222222',role:'super_admin',status:'active',is_current:false,demo_workspaces:{id:'22222222-2222-4222-8222-222222222222',name:'Luxurious Real Estate',slug:'luxurious-real-estate',status:'active'}},
        {workspace_id:'33333333-3333-4333-8333-333333333333',role:'super_admin',status:'active',is_current:false,demo_workspaces:{id:'33333333-3333-4333-8333-333333333333',name:'Archived Company',slug:'archived-company',status:'archived'}}
      ];
      const builder = () => ({select(){return this},eq(){return this},then(resolve){resolve({data:window.__memberships,error:null})}});
      window.hilltopSupabase = {
        auth:{getSession:async()=>({data:{session:{user:{id:userId,email:'admin@example.com'}}},error:null})},
        from:()=>builder(),
        rpc:async(name,args)=>{
          if(name==='switch_demo_workspace'){
            window.__memberships.forEach(row=>row.is_current=row.workspace_id===args.p_workspace_id);
            return {data:{id:args.p_workspace_id},error:null};
          }
          if(name==='create_demo_workspace'){
            const id='44444444-4444-4444-8444-444444444444';
            window.__memberships.forEach(row=>row.is_current=false);
            const workspace={id,name:args.p_name,slug:args.p_slug,status:args.p_status};
            window.__memberships.push({workspace_id:id,role:'super_admin',status:'active',is_current:true,demo_workspaces:workspace});
            return {data:workspace,error:null};
          }
          return {data:null,error:{message:'Unexpected RPC'}};
        }
      };
      window.hilltopCurrentUser={role:'super_admin'};
    }""")
    page.add_script_tag(path=str(ROOT / "workspace.js"))
    page.wait_for_function("window.HilltopWorkspace && window.HilltopWorkspace.getActive()")

    selector = page.locator("#workspaceSelect")
    assert selector.count() == 1
    assert selector.input_value() == "11111111-1111-4111-8111-111111111111"
    assert selector.locator("option").count() == 4  # 2 active + divider + create
    assert "Archived Company" not in selector.inner_text()
    page.screenshot(path=str(OUT / "workspace-selector-desktop.png"), full_page=True)

    selector.select_option("__create_workspace__")
    dialog = page.locator("#workspaceCreateDialog")
    dialog.wait_for(state="visible")
    page.get_by_label("Workspace Name").fill("Rocky Property Network")
    assert page.get_by_label("Workspace Slug").input_value() == "rocky-property-network"
    page.screenshot(path=str(OUT / "create-workspace-dialog.png"), full_page=True)
    page.get_by_role("button", name="Create Workspace", exact=True).click()
    page.wait_for_function("window.HilltopWorkspace.getActive().slug === 'rocky-property-network'")
    assert selector.input_value() == "44444444-4444-4444-8444-444444444444"
    assert not dialog.is_visible()
    assert errors == [], errors
    browser.close()

report = {
    "passed": True,
    "checks": [
        "current workspace is visible",
        "archived workspace is excluded",
        "create option is available to super admins",
        "slug is suggested from the workspace name",
        "creation switches the active selector",
        "no page errors",
    ],
    "artifacts": str(OUT),
}
(OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))

