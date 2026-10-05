"""Focused visual and interaction checks for the homepage filter menus."""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.codex-artifacts' / 'home-filter-menus'
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


PROVINCES = [
    {'id': 'province-southern', 'name': 'Southern', 'slug': 'southern'},
    {'id': 'province-lusaka', 'name': 'Lusaka', 'slug': 'lusaka'},
]
CITIES = [
    {'id': 'city-livingstone', 'province_id': 'province-southern', 'name': 'Livingstone', 'slug': 'livingstone'},
    {'id': 'city-lusaka', 'province_id': 'province-lusaka', 'name': 'Lusaka', 'slug': 'lusaka'},
    {'id': 'city-kitwe', 'province_id': 'province-lusaka', 'name': 'Kitwe', 'slug': 'kitwe'},
]
LOCATION_RESULTS = [
    {
        'id': 'city-lusaka', 'type': 'city', 'name': 'Lusaka', 'slug': 'lusaka',
        'province_id': 'province-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka',
        'city_id': 'city-lusaka', 'city_name': 'Lusaka', 'city_slug': 'lusaka',
        'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'lusaka',
    },
    {
        'id': 'city-livingstone', 'type': 'city', 'name': 'Livingstone', 'slug': 'livingstone',
        'province_id': 'province-southern', 'province_name': 'Southern', 'province_slug': 'southern',
        'city_id': 'city-livingstone', 'city_name': 'Livingstone', 'city_slug': 'livingstone',
        'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'livingstone',
    },
]
PROPERTIES = [
    {
        'id': 'house-1', 'reference_number': 'HOUSE-1', 'title': 'Lusaka house', 'description': 'House',
        'price': 1500000, 'currency_code': 'ZMW', 'purpose': 'For Sale', 'property_type': 'House',
        'area': 'Kabulonga', 'full_address': 'Kabulonga, Lusaka', 'province_id': 'province-lusaka',
        'city_id': 'city-lusaka', 'area_slug': 'kabulonga', 'bedrooms': 3, 'bathrooms': 2,
        'garages': 1, 'square_metres': 220, 'amenities': [], 'status': 'Active', 'featured': False,
        'branch_id': None, 'created_at': '2026-09-10T00:00:00Z',
    },
    {
        'id': 'apartment-1', 'reference_number': 'APT-1', 'title': 'Livingstone apartment',
        'description': 'Apartment', 'price': 12000, 'currency_code': 'ZMW', 'purpose': 'For Rent',
        'property_type': 'Apartment', 'area': 'Dambwa', 'full_address': 'Dambwa, Livingstone',
        'province_id': 'province-southern', 'city_id': 'city-livingstone', 'area_slug': 'dambwa',
        'bedrooms': 2, 'bathrooms': 1, 'garages': 1, 'square_metres': 90, 'amenities': [],
        'status': 'Active', 'featured': False, 'branch_id': None, 'created_at': '2026-09-11T00:00:00Z',
    },
]


def api_fixture(route):
    table = urlparse(route.request.url).path.rstrip('/').split('/')[-1]
    rows = LOCATION_RESULTS if table == 'search_locations' else {'properties': PROPERTIES, 'provinces': PROVINCES, 'cities': CITIES}.get(table, [])
    route.fulfill(status=200, content_type='application/json', body=json.dumps(rows))


def check(name, condition, checks):
    assert condition, name
    checks.append(name)


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = []

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('**/rest/v1/**', api_fixture)
        page.goto(f'http://127.0.0.1:{server.server_port}/index.html', wait_until='domcontentloaded')
        page.wait_for_function("publicState.listingsLoaded === true")

        location_trigger = page.locator('#discoveryLocationTrigger')
        location_trigger.fill('li')
        location_menu = page.locator('#discoveryLocationMenu')
        location_menu.wait_for(state='visible')
        page.wait_for_function("getComputedStyle(document.querySelector('#discoveryLocationMenu')).transform === 'matrix(1, 0, 0, 1, 0, 0)'")
        check('typing opens the location menu', location_trigger.get_attribute('aria-expanded') == 'true', checks)
        check('location menu presents the two RPC city records', location_menu.locator('[role="option"]').count() == 2, checks)

        geometry = page.evaluate("""() => {
          const trigger = document.querySelector('.discovery-location-trigger');
          const menu = document.querySelector('#discoveryLocationMenu');
          const triggerStyle = getComputedStyle(trigger);
          const menuStyle = getComputedStyle(menu);
          return {
            triggerRadius: triggerStyle.borderRadius,
            menuRadius: menuStyle.borderRadius,
            menuFont: menuStyle.fontFamily,
            duration: menuStyle.transitionDuration,
            rightAligned: Math.abs(trigger.getBoundingClientRect().right - menu.getBoundingClientRect().right) < 1
          };
        }""")
        check('trigger keeps its original edge radius', geometry['triggerRadius'] == '2px', checks)
        check('opened menu uses the sharper radius', geometry['menuRadius'] == '6px', checks)
        check('opened menu uses the Concise font', 'Concise-RegularDemo' in geometry['menuFont'], checks)
        check('opened menu is right aligned to its trigger', geometry['rightAligned'], checks)
        check('opened menu has a smooth transition', '0.19s' in geometry['duration'], checks)
        page.screenshot(path=str(OUT / 'desktop-location-menu.png'), full_page=False)

        location_menu.locator('[data-location-type="city"]').filter(has_text='Livingstone').click()
        check('second city row stays clickable above the next field', location_trigger.input_value() == 'Livingstone', checks)

        page.locator('#discoveryTypeTrigger').click()
        type_menu = page.locator('#discoveryTypeMenu')
        type_menu.wait_for(state='visible')
        check('property type uses the same opened-menu treatment', page.evaluate("getComputedStyle(document.querySelector('#discoveryTypeMenu')).borderRadius") == '6px', checks)
        type_menu.get_by_role('option', name='House').click()
        check('property type selection updates the trigger', page.locator('#discoveryTypeValue').inner_text() == 'House', checks)

        page.locator('#discoveryPriceTrigger').click()
        price_menu = page.locator('#discoveryPriceMenu')
        price_menu.wait_for(state='visible')
        check('maximum price uses the same opened-menu treatment', page.evaluate("getComputedStyle(document.querySelector('#discoveryPriceMenu')).borderRadius") == '6px', checks)
        check('only one filter menu stays open', not type_menu.is_visible() and not location_menu.is_visible(), checks)
        check('Zambia map remains present', page.locator('#listingMapHolder svg').count() == 1, checks)
        check('no page errors', errors == [], checks)

        page.screenshot(path=str(OUT / 'desktop-filter-menus.png'), full_page=False)

        mobile = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_errors = []
        mobile.on('pageerror', lambda error: mobile_errors.append(str(error)))
        mobile.route('**/rest/v1/**', api_fixture)
        mobile.goto(f'http://127.0.0.1:{server.server_port}/index.html', wait_until='domcontentloaded')
        mobile.wait_for_function("publicState.listingsLoaded === true")
        mobile_trigger = mobile.locator('#discoveryLocationTrigger')
        mobile_trigger.fill('lu')
        mobile_menu = mobile.locator('#discoveryLocationMenu')
        mobile_menu.wait_for(state='visible')
        mobile.wait_for_function("getComputedStyle(document.querySelector('#discoveryLocationMenu')).transform === 'matrix(1, 0, 0, 1, 0, 0)'")
        mobile_geometry = mobile.evaluate("""() => {
          const trigger = document.querySelector('.discovery-location-trigger').getBoundingClientRect();
          const menu = document.querySelector('#discoveryLocationMenu').getBoundingClientRect();
          return {triggerWidth: trigger.width, menuWidth: menu.width, left: menu.left, right: menu.right};
        }""")
        check('mobile typing opens the location menu', mobile.locator('#discoveryLocationTrigger').get_attribute('aria-expanded') == 'true', checks)
        check('mobile menu matches the trigger width', abs(mobile_geometry['triggerWidth'] - mobile_geometry['menuWidth']) < 1, checks)
        check('mobile menu remains inside the viewport', mobile_geometry['left'] >= 0 and mobile_geometry['right'] <= 390, checks)
        check('mobile menu retains two city choices', mobile_menu.locator('[role="option"]').count() == 2, checks)
        check('mobile has no page errors', mobile_errors == [], checks)
        mobile.screenshot(path=str(OUT / 'mobile-filter-menus.png'), full_page=False)
        browser.close()

    (OUT / 'test-report.json').write_text(json.dumps({'checks': checks, 'geometry': geometry, 'mobile': mobile_geometry}, indent=2), encoding='utf-8')
    print(json.dumps({'passed': len(checks), 'checks': checks}, indent=2))
finally:
    server.shutdown()
    server.server_close()
