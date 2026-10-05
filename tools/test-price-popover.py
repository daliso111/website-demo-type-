"""Focused local checks for the canonical listings price popover."""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".codex-artifacts" / "price-popover"
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        if self.path.startswith("/properties-for-sale"):
            suffix = self.path[len("/properties-for-sale"):]
            self.path = "/listings.html" + suffix
        super().do_GET()


PROVINCES = [{"id": "province-lusaka", "name": "Lusaka", "slug": "lusaka"}]
CITIES = [{
    "id": "city-lusaka", "province_id": "province-lusaka", "name": "Lusaka", "slug": "lusaka"
}]
PROPERTIES = [
    {
        "id": "low-zmw", "reference_number": "LOW-1", "title": "Lower-price home",
        "description": "Test home", "price": 400000, "currency_code": "ZMW",
        "purpose": "For Sale", "property_type": "House", "area": "Kabulonga",
        "full_address": "Kabulonga, Lusaka", "province_id": "province-lusaka",
        "city_id": "city-lusaka", "area_slug": "kabulonga", "bedrooms": 3,
        "bathrooms": 2, "garages": 1, "square_metres": 220, "amenities": [],
        "status": "Active", "featured": False, "branch_id": None,
        "created_at": "2026-09-10T00:00:00Z",
    },
    {
        "id": "high-zmw", "reference_number": "HIGH-1", "title": "Higher-price home",
        "description": "Test home", "price": 1500000, "currency_code": "ZMW",
        "purpose": "For Sale", "property_type": "House", "area": "Roma",
        "full_address": "Roma, Lusaka", "province_id": "province-lusaka",
        "city_id": "city-lusaka", "area_slug": "roma", "bedrooms": 4,
        "bathrooms": 3, "garages": 2, "square_metres": 340, "amenities": [],
        "status": "Active", "featured": False, "branch_id": None,
        "created_at": "2026-09-11T00:00:00Z",
    },
    {
        "id": "usd", "reference_number": "USD-1", "title": "Dollar-price home",
        "description": "Test home", "price": 50000, "currency_code": "USD",
        "purpose": "For Sale", "property_type": "Apartment", "area": "Woodlands",
        "full_address": "Woodlands, Lusaka", "province_id": "province-lusaka",
        "city_id": "city-lusaka", "area_slug": "woodlands", "bedrooms": 2,
        "bathrooms": 2, "garages": 1, "square_metres": 120, "amenities": [],
        "status": "Active", "featured": False, "branch_id": None,
        "created_at": "2026-09-12T00:00:00Z",
    },
]


def api_fixture(route):
    table = urlparse(route.request.url).path.rstrip("/").split("/")[-1]
    rows = {"properties": PROPERTIES, "provinces": PROVINCES, "cities": CITIES}.get(table, [])
    route.fulfill(status=200, content_type="application/json", body=json.dumps(rows))


def check(name, condition, checks):
    assert condition, name
    checks.append(name)


def open_price(page):
    page.locator("#priceSummary").click()
    page.locator("#priceField[open]").wait_for(state="attached")
    page.wait_for_function(
        "getComputedStyle(document.querySelector('.price-popover')).transform === 'matrix(1, 0, 0, 1, 0, 0)'"
    )


server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = []

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.route("**/rest/v1/**", api_fixture)
        page.goto(
            f"http://127.0.0.1:{server.server_port}/properties-for-sale",
            wait_until="domcontentloaded",
        )
        page.wait_for_function("document.querySelectorAll('.property-card').length === 3")

        initial_url = page.url
        initial_cards = page.locator(".property-card").count()
        more_y = page.locator("#moreFiltersButton").bounding_box()["y"]
        open_price(page)

        geometry = page.evaluate("""() => {
          const trigger = document.querySelector('#priceSummary').getBoundingClientRect();
          const popover = document.querySelector('.price-popover').getBoundingClientRect();
          const fields = [...document.querySelectorAll('.price-popover__fields > input')]
            .map((input) => input.getBoundingClientRect());
          const style = getComputedStyle(document.querySelector('.price-popover'));
          return {
            triggerBottom: trigger.bottom,
            popoverTop: popover.top,
            popoverHeight: popover.height,
            popoverWidth: popover.width,
            fieldTops: fields.map((field) => field.top),
            borderColor: style.borderColor,
            radius: style.borderRadius,
            shadow: style.boxShadow,
            background: style.backgroundColor
          };
        }""")
        check("popover sits directly below its trigger", 5 <= geometry["popoverTop"] - geometry["triggerBottom"] <= 7, checks)
        check("popover stays compact", geometry["popoverHeight"] <= 66, checks)
        check("price inputs remain side by side", abs(geometry["fieldTops"][0] - geometry["fieldTops"][1]) < 1, checks)
        check("popover uses a white background", geometry["background"] == "rgb(255, 255, 255)", checks)
        check("popover uses the restrained radius", geometry["radius"] == "6px", checks)
        check("opening does not shift following controls", abs(page.locator("#moreFiltersButton").bounding_box()["y"] - more_y) < 1, checks)
        check("removed price UI is absent", page.locator("#priceDone, #priceFilterMessage, .price-popover h3").count() == 0, checks)
        check("only the compact currency and price controls remain", page.locator(".price-popover__fields").locator("input, .price-popover__currency").count() == 3, checks)
        check("opening price does not alter the URL", page.url == initial_url, checks)
        page.screenshot(path=str(OUT / "desktop-price-popover.png"), full_page=False)

        page.locator("#listingCurrencyFilterTrigger").click()
        page.locator("#listingCurrencyFilterMenu").wait_for(state="visible")
        check("opening the compact currency selector keeps Price open", page.locator("#priceField").get_attribute("open") is not None, checks)
        page.locator("#listingLocationInput").fill("lu")
        page.locator("#listingLocationResults").wait_for(state="visible")
        check("opening Location closes Price", page.locator("#priceField").get_attribute("open") is None, checks)
        page.locator("#listingLocationInput").fill("")
        page.locator("#listingPageTitle").click()

        open_price(page)
        page.get_by_label("Maximum price", exact=True).fill("500000")
        check("typing updates only the draft summary", page.locator("#priceValue").inner_text() == "Up to K500,000", checks)
        check("typing defaults an unset draft currency to ZMW", page.locator("#listingCurrencyFilter").input_value() == "ZMW", checks)
        check("draft typing does not alter the URL", page.url == initial_url, checks)
        check("draft typing does not filter cards", page.locator(".property-card").count() == initial_cards, checks)

        page.get_by_label("Maximum price", exact=True).press("Escape")
        check("Escape closes Price", page.locator("#priceField").get_attribute("open") is None, checks)
        check("Escape preserves the draft value", page.get_by_label("Maximum price", exact=True).input_value() == "500000", checks)

        open_price(page)
        page.get_by_label("Maximum price", exact=True).press("Enter")
        check("Enter closes Price", page.locator("#priceField").get_attribute("open") is None, checks)
        check("Enter does not submit the form", page.url == initial_url and page.locator(".property-card").count() == initial_cards, checks)

        open_price(page)
        page.locator("#listingPageTitle").click(position={"x": 5, "y": 5})
        check("clicking outside closes Price", page.locator("#priceField").get_attribute("open") is None, checks)

        page.locator(".search-button").click()
        page.wait_for_function("new URL(location.href).searchParams.get('maxPrice') === '500000'")
        page.wait_for_function("document.querySelectorAll('.property-card').length === 1")
        check("Search commits the draft currency", "currency=ZMW" in page.url, checks)
        check("Search commits the draft price", "maxPrice=500000" in page.url, checks)
        check("Search applies the price filter", page.locator(".property-card").count() == 1, checks)
        check("the matching ZMW property remains", page.get_by_text("Lower-price home", exact=True).count() == 1, checks)
        check("desktop has no page errors", errors == [], checks)

        mobile = browser.new_page(viewport={"width": 360, "height": 800})
        mobile_errors = []
        mobile.on("pageerror", lambda error: mobile_errors.append(str(error)))
        mobile.route("**/rest/v1/**", api_fixture)
        mobile.goto(
            f"http://127.0.0.1:{server.server_port}/properties-for-sale",
            wait_until="domcontentloaded",
        )
        mobile.wait_for_function("document.querySelectorAll('.property-card').length === 3")
        mobile_more_y = mobile.locator("#moreFiltersButton").bounding_box()["y"]
        open_price(mobile)
        mobile_geometry = mobile.evaluate("""() => {
          const panel = document.querySelector('.price-popover').getBoundingClientRect();
          const inputs = [...document.querySelectorAll('.price-popover__fields > input')]
            .map((input) => input.getBoundingClientRect());
          return {left: panel.left, right: panel.right, width: panel.width, tops: inputs.map((input) => input.top)};
        }""")
        check("narrow popover stays inside the viewport", mobile_geometry["left"] >= 0 and mobile_geometry["right"] <= 360, checks)
        check("narrow price fields still fit side by side", abs(mobile_geometry["tops"][0] - mobile_geometry["tops"][1]) < 1, checks)
        check("narrow opening causes no layout shift", abs(mobile.locator("#moreFiltersButton").bounding_box()["y"] - mobile_more_y) < 1, checks)
        check("mobile has no page errors", mobile_errors == [], checks)
        mobile.screenshot(path=str(OUT / "mobile-price-popover.png"), full_page=False)
        browser.close()

    report = {"passed": len(checks), "checks": checks, "desktop": geometry, "mobile": mobile_geometry}
    (OUT / "test-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
finally:
    server.shutdown()
    server.server_close()
