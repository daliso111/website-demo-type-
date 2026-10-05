"""Phase 3 canonical location route integration checks."""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.codex-artifacts' / 'location-routing-phase3'
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith(('/properties-for-sale', '/properties-for-rent', '/property-for-sale', '/property-for-rent')):
            self.path = '/listings.html' + (f'?{parsed.query}' if parsed.query else '')
        super().do_GET()


PROVINCES = [
    {'id': 'p-lusaka', 'name': 'Lusaka', 'slug': 'lusaka', 'map_key': 'lusaka', 'sort_order': 1},
    {'id': 'p-southern', 'name': 'Southern', 'slug': 'southern', 'map_key': 'southern', 'sort_order': 2},
]
CITIES = [
    {'id': 'c-lusaka', 'province_id': 'p-lusaka', 'name': 'Lusaka', 'slug': 'lusaka'},
    {'id': 'c-chongwe', 'province_id': 'p-lusaka', 'name': 'Chongwe', 'slug': 'chongwe'},
    {'id': 'c-livingstone', 'province_id': 'p-southern', 'name': 'Livingstone', 'slug': 'livingstone'},
]
LOCATIONS = [
    {'id': 'p-lusaka', 'type': 'province', 'name': 'Lusaka', 'slug': 'lusaka', 'province_id': 'p-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka', 'city_id': None, 'city_name': None, 'city_slug': None, 'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'lusaka-province'},
    {'id': 'c-lusaka', 'type': 'city', 'name': 'Lusaka', 'slug': 'lusaka', 'province_id': 'p-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka', 'city_id': 'c-lusaka', 'city_name': 'Lusaka', 'city_slug': 'lusaka', 'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'lusaka'},
    {'id': 'c-livingstone', 'type': 'city', 'name': 'Livingstone', 'slug': 'livingstone', 'province_id': 'p-southern', 'province_name': 'Southern', 'province_slug': 'southern', 'city_id': 'c-livingstone', 'city_name': 'Livingstone', 'city_slug': 'livingstone', 'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'livingstone'},
    {'id': 's-olympia', 'type': 'suburb', 'name': 'Olympia', 'slug': 'olympia', 'province_id': 'p-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka', 'city_id': 'c-lusaka', 'city_name': 'Lusaka', 'city_slug': 'lusaka', 'suburb_id': 's-olympia', 'suburb_name': 'Olympia', 'suburb_slug': 'olympia', 'canonical_path': 'lusaka/olympia'},
]


def prop(pid, title, purpose, city, suburb=None, area=''):
    province = 'p-southern' if city == 'c-livingstone' else 'p-lusaka'
    return {'id': pid, 'reference_number': pid, 'title': title, 'description': title, 'price': 1000000, 'currency_code': 'ZMW', 'purpose': purpose, 'property_type': 'House', 'area': area, 'full_address': area, 'province_id': province, 'city_id': city, 'suburb_id': suburb, 'area_slug': area.lower().replace(' ', '-'), 'bedrooms': 3, 'bathrooms': 2, 'garages': 1, 'square_metres': 200, 'amenities': [], 'status': 'Active', 'featured': False, 'branch_id': None, 'created_at': '2026-09-17T00:00:00Z'}


PROPERTIES = [
    prop('sale-olympia', 'Olympia sale house', 'For Sale', 'c-lusaka', 's-olympia', 'Olympia'),
    prop('sale-kabulonga', 'Kabulonga sale house', 'For Sale', 'c-lusaka', 's-kabulonga', 'Kabulonga'),
    prop('sale-chongwe', 'Chongwe sale house', 'For Sale', 'c-chongwe', None, 'Chongwe'),
    prop('rent-livingstone', 'Livingstone rental', 'For Rent', 'c-livingstone', None, 'Livingstone'),
]


def fixture(route):
    parsed = urlparse(route.request.url)
    endpoint = parsed.path.rstrip('/').split('/')[-1]
    query = parse_qs(parsed.query)
    if endpoint == 'properties':
        rows = PROPERTIES
        for field in ('purpose', 'province_id', 'city_id', 'suburb_id'):
            value = query.get(field, [''])[0]
            if value.startswith('eq.'):
                rows = [row for row in rows if row.get(field) == value[3:]]
    elif endpoint == 'provinces':
        rows = PROVINCES
    elif endpoint == 'cities':
        rows = CITIES
    elif endpoint in ('search_locations', 'resolve_location_path'):
        body = json.loads(route.request.post_data or '{}')
        if endpoint == 'resolve_location_path':
            value = str(body.get('location_path', '')).lower()
            rows = [row for row in LOCATIONS if row['canonical_path'] == value]
        else:
            value = str(body.get('search_term', '')).lower()
            rows = [row for row in LOCATIONS if value in row['name'].lower()]
    else:
        rows = []
    route.fulfill(status=200, content_type='application/json', body=json.dumps(rows), headers={'content-range': f'0-{max(0, len(rows)-1)}/{len(rows)}'})


def wait_home(page):
    page.wait_for_function('publicState.listingsLoaded === true')


def wait_listings(page):
    page.wait_for_function("document.querySelector('#listingsGrid') && ['ready','empty'].includes(document.querySelector('#listingsGrid').dataset.state)")


def choose_home(page, term, location_type):
    page.locator('#discoveryLocationTrigger').fill(term)
    selector = f'#discoveryLocationMenu [data-location-type="{location_type}"]'
    page.wait_for_function('selector => document.querySelector(selector)', arg=selector)
    page.locator(selector).click()


checks = []


def check(name, condition):
    assert condition, name
    checks.append(name)


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('**/rest/v1/**', fixture)

        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        check('sale with no location uses purpose route', urlparse(page.url).path == '/properties-for-sale')

        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        page.locator('[data-discovery-purpose="For Rent"]').click()
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        check('rent with no location uses purpose route', urlparse(page.url).path == '/properties-for-rent')

        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        page.locator('[data-discovery-purpose="For Rent"]').click()
        choose_home(page, 'living', 'city')
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        check('Livingstone rent uses city route and scope', urlparse(page.url).path == '/properties-for-rent/livingstone' and page.locator('#listingsGrid .property-card').count() == 1)

        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        choose_home(page, 'lusa', 'city')
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        check('Lusaka city has city route', urlparse(page.url).path == '/properties-for-sale/lusaka')
        check('city includes its suburbs by city id', page.locator('#listingsGrid .property-card').count() == 2)

        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        choose_home(page, 'lusa', 'province')
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        check('Lusaka Province has distinct route', urlparse(page.url).path == '/properties-for-sale/lusaka-province')
        check('province is broader than city', page.locator('#listingsGrid .property-card').count() == 3)
        check('province control is hydrated', page.locator('#listingLocationInput').input_value() == 'Lusaka Province')

        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        choose_home(page, 'olym', 'suburb')
        page.locator('#discoveryType').select_option('House', force=True)
        page.evaluate("discoverySearchState.minBedrooms='3'; discoverySearchState.currency='ZMW'; discoverySearchState.maxPrice='5000000'")
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        parsed = urlparse(page.url)
        query = parse_qs(parsed.query)
        check('Olympia uses nested canonical route', parsed.path == '/properties-for-sale/lusaka/olympia')
        check('refinements remain query parameters', query.get('type') == ['house'] and query.get('minBedrooms') == ['3'] and query.get('currency') == ['ZMW'] and query.get('maxPrice') == ['5000000'])
        check('geography does not leak into query parameters', not any(key in query for key in ('location', 'province', 'city', 'area')))
        check('suburb filters only by suburb id', page.locator('#listingsGrid .property-card').count() == 1 and 'Olympia sale house' in page.locator('#listingsGrid').inner_text())
        check('direct route hydrates Olympia control', page.locator('#listingLocationInput').input_value() == 'Olympia')

        page.reload()
        wait_listings(page)
        check('refresh preserves route state and results', page.locator('#listingLocationInput').input_value() == 'Olympia' and page.locator('#listingsGrid .property-card').count() == 1)

        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        page.locator('#discoveryLocationTrigger').fill('Olympia')
        page.locator('#discoverySearchBtn').click()
        check('raw unselected text does not navigate', urlparse(page.url).path == '/index.html')
        check('raw unselected text shows validation', page.locator('#discoveryLocationTrigger').get_attribute('aria-invalid') == 'true' and 'Select a location' in page.locator('#discoveryStatus').inner_text())

        page.locator('#discoveryLocationTrigger').fill('olym')
        page.wait_for_function("document.querySelector('#discoveryLocationMenu [data-location-type=suburb]')")
        page.locator('#discoveryLocationMenu [data-location-type="suburb"]').click()
        page.locator('#discoveryLocationTrigger').fill('')
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        check('cleared location returns to purpose route', urlparse(page.url).path == '/properties-for-sale')

        page.goto(base + '/properties-for-sale/lusaka', wait_until='domcontentloaded')
        wait_listings(page)
        page.locator('#listingLocationInput').fill('olym')
        page.wait_for_function("document.querySelector('#listingLocationResults [data-location-type=suburb]')")
        page.locator('#listingLocationResults [data-location-type="suburb"]').click()
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#listingSearchForm .search-button').click()
        wait_listings(page)
        check('listing search navigates city to suburb', urlparse(page.url).path == '/properties-for-sale/lusaka/olympia')
        page.go_back()
        wait_listings(page)
        check('Back restores city applied state', urlparse(page.url).path == '/properties-for-sale/lusaka' and page.locator('#listingLocationInput').input_value() == 'Lusaka' and page.locator('#listingsGrid .property-card').count() == 2)
        page.go_forward()
        wait_listings(page)
        check('Forward restores suburb applied state', urlparse(page.url).path == '/properties-for-sale/lusaka/olympia' and page.locator('#listingLocationInput').input_value() == 'Olympia' and page.locator('#listingsGrid .property-card').count() == 1)

        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('[data-clear-control="listingLocationInput"]').click()
        wait_listings(page)
        check('location chip clears structured route state', urlparse(page.url).path == '/properties-for-sale' and page.locator('#listingLocationInput').input_value() == '' and page.locator('#listingsGrid .property-card').count() == 3)

        page.goto(base + '/properties-for-sale/lusaka/not-real', wait_until='domcontentloaded')
        wait_listings(page)
        check('invalid route is preserved', urlparse(page.url).path == '/properties-for-sale/lusaka/not-real')
        check('invalid route has controlled empty state', 'Location not found' in page.locator('#listingsEmpty').inner_text() and page.locator('#listingsGrid .property-card').count() == 0)
        check('no uncaught browser errors', not errors)

        page.screenshot(path=str(OUT / 'phase3-invalid-state.png'), full_page=False)
        mobile = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_errors = []
        mobile.on('pageerror', lambda error: mobile_errors.append(str(error)))
        mobile.route('**/rest/v1/**', fixture)
        mobile.goto(base + '/properties-for-sale/lusaka/olympia', wait_until='domcontentloaded')
        wait_listings(mobile)
        mobile.get_by_text('Change filters', exact=True).click()
        check('mobile dialog exposes the canonical location control', mobile.locator('#listingLocationInput').is_visible())
        check('mobile direct route hydrates Olympia', mobile.locator('#listingLocationInput').input_value() == 'Olympia')
        check('mobile dialog retains a Search Properties commit action', mobile.locator('#applyFilters').is_visible())
        check('mobile has no uncaught browser errors', not mobile_errors)
        mobile.screenshot(path=str(OUT / 'phase3-mobile-location.png'), full_page=False)
        mobile.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()

report = {'checks_passed': len(checks), 'checks': checks, 'artifacts': str(OUT)}
(OUT / 'test-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
