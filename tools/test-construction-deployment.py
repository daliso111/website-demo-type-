"""Regression checks for removing Construction from the public Firebase site."""
import json
import re
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".codex-artifacts" / "construction-removal"
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = "http://127.0.0.1:5000"

PROVINCES = [{"id": "province-lusaka", "name": "Lusaka", "slug": "lusaka"}]
CITIES = [{"id": "city-lusaka", "province_id": "province-lusaka", "name": "Lusaka", "slug": "lusaka"}]
PROPERTIES = [{
    "id": "property-1", "reference_number": "TEST-1", "title": "Lusaka house",
    "description": "House", "price": 1500000, "currency_code": "ZMW",
    "purpose": "For Sale", "property_type": "House", "area": "Kabulonga",
    "full_address": "Kabulonga, Lusaka", "province_id": "province-lusaka",
    "city_id": "city-lusaka", "area_slug": "kabulonga", "bedrooms": 3,
    "bathrooms": 2, "garages": 1, "square_metres": 220, "amenities": [],
    "status": "Active", "featured": True, "branch_id": None,
    "created_at": "2026-09-10T00:00:00Z",
}]


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request_without_redirect(path):
    try:
        response = build_opener(NoRedirect).open(Request(BASE_URL + path), timeout=20)
        return response.status, response.headers.get("Location")
    except HTTPError as error:
        return error.code, error.headers.get("Location")


def api_fixture(route):
    table = route.request.url.split("?", 1)[0].rstrip("/").split("/")[-1]
    rows = {"properties": PROPERTIES, "provinces": PROVINCES, "cities": CITIES}.get(table, [])
    route.fulfill(status=200, content_type="application/json", body=json.dumps(rows))


def assert_source_and_hosting_config():
    config = json.loads((ROOT / "firebase.json").read_text(encoding="utf-8"))["hosting"]
    assert (ROOT / "construction").is_dir(), "Construction source must remain recoverable"
    assert "construction/**" in config.get("ignore", []), "Construction tree must be excluded from deploys"
    redirect = next(rule for rule in config.get("redirects", []) if "construction" in str(rule).lower())
    assert redirect.get("destination") == "/" and redirect.get("type") == 302
    pattern = re.compile(redirect["regex"])
    for path in ("/construction", "/construction/", "/construction/admin/", "/construction/assets/app.js"):
        assert pattern.fullmatch(path), f"Redirect pattern misses {path}"
    assert not pattern.fullmatch("/construction-company"), "Redirect pattern is too broad"


def assert_public_source_is_clean():
    allowed = {ROOT / "firebase.json"}
    matches = []
    for suffix in ("*.html", "*.css", "*.js", "*.json"):
        for file in ROOT.rglob(suffix):
            relative = file.relative_to(ROOT)
            if relative.parts[0] in {"construction", ".firebase", ".git", ".codex-artifacts"}:
                continue
            if file in allowed:
                continue
            text = file.read_text(encoding="utf-8", errors="ignore")
            if re.search(r"construction|hilltop construction", text, re.IGNORECASE):
                matches.append(str(relative))
    assert not matches, f"Unexpected public Construction references: {matches}"


def assert_hosting_routes():
    for path in ("/construction", "/construction/", "/construction/admin/", "/construction/assets/app.js"):
        status, location = request_without_redirect(path)
        assert (status, location) == (302, "/"), (path, status, location)
    status, _ = request_without_redirect("/construction-company")
    assert status == 404
    for path in ("/", "/listings", "/properties", "/property-details"):
        with urlopen(BASE_URL + path, timeout=20) as response:
            assert response.status == 200 and response.headers.get_content_type() == "text/html", path


def assert_homepage_views():
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        for width, height, label in ((1440, 1000, "desktop"), (390, 844, "mobile")):
            page = browser.new_page(viewport={"width": width, "height": height})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.route("**/rest/v1/**", api_fixture)
            page.goto(BASE_URL + "/", wait_until="domcontentloaded")
            page.wait_for_function("publicState.listingsLoaded === true")

            assert page.locator(".division-switcher").count() == 0
            assert page.get_by_text("Construction", exact=False).count() == 0
            assert page.locator("#partners .partner-card").count() == 2
            assert page.locator(".property-card").count() > 0
            assert page.locator('#siteNav a[href="listings.html"]').count() == 1

            layout = page.evaluate("""() => {
                const hero = document.querySelector('.hero').getBoundingClientRect();
                const discovery = document.querySelector('.property-discovery').getBoundingClientRect();
                const cards = Array.from(document.querySelectorAll('#partners .partner-card')).map((card) => {
                    const box = card.getBoundingClientRect();
                    return {left: box.left, right: box.right, top: box.top, width: box.width};
                });
                return {
                    overflow: document.documentElement.scrollWidth > innerWidth,
                    heroGap: discovery.top - hero.bottom,
                    cards
                };
            }""")
            assert not layout["overflow"]
            expected_gap = 56 if label == "desktop" else 32
            assert abs(layout["heroGap"] - expected_gap) < 2, layout
            if label == "desktop":
                assert abs(layout["cards"][0]["top"] - layout["cards"][1]["top"]) < 2, layout
            else:
                assert layout["cards"][1]["top"] > layout["cards"][0]["top"], layout
                toggle = page.locator("#navToggle")
                toggle.click()
                assert toggle.get_attribute("aria-expanded") == "true"
                toggle.click()

            partners = page.locator("#partners")
            partners.scroll_into_view_if_needed()
            page.wait_for_function("""Array.from(document.querySelectorAll('#partners img'))
                .every((image) => image.complete && image.naturalWidth > 0)""")
            partners.screenshot(path=str(OUT / f"homepage-partners-{label}.png"))
            assert not errors, errors
            results.append({"viewport": [width, height], "layout": layout, "page_errors": errors})
            page.close()
        browser.close()
    return results


assert_source_and_hosting_config()
assert_public_source_is_clean()
assert_hosting_routes()
view_results = assert_homepage_views()
(OUT / "report.json").write_text(json.dumps({"passed": True, "views": view_results}, indent=2), encoding="utf-8")
print(json.dumps({"passed": True, "views": view_results}, indent=2))
