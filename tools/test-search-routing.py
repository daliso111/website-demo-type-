"""Focused browser regression checks for public property-search routing."""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.codex-artifacts' / 'search-routing'
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith(('/properties-for-sale', '/properties-for-rent', '/property-for-sale', '/property-for-rent')):
            self.path = '/listings.html' + (f'?{parsed.query}' if parsed.query else '')
        elif parsed.path == '/listings':
            self.path = '/listings.html' + (f'?{parsed.query}' if parsed.query else '')
        super().do_GET()


PROVINCES = [
    {'id': 'province-southern', 'name': 'Southern', 'slug': 'southern', 'map_key': 'southern', 'sort_order': 1},
    {'id': 'province-lusaka', 'name': 'Lusaka', 'slug': 'lusaka', 'map_key': 'lusaka', 'sort_order': 2},
]
CITIES = [
    {'id': 'city-livingstone', 'province_id': 'province-southern', 'name': 'Livingstone', 'slug': 'livingstone'},
    {'id': 'city-lusaka', 'province_id': 'province-lusaka', 'name': 'Lusaka', 'slug': 'lusaka'},
]
LOCATIONS = [
    {
        'id': 'province-southern', 'type': 'province', 'name': 'Southern', 'slug': 'southern',
        'province_id': 'province-southern', 'province_name': 'Southern', 'province_slug': 'southern',
        'city_id': None, 'city_name': None, 'city_slug': None, 'suburb_id': None,
        'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'southern-province',
    },
    {
        'id': 'city-livingstone', 'type': 'city', 'name': 'Livingstone', 'slug': 'livingstone',
        'province_id': 'province-southern', 'province_name': 'Southern', 'province_slug': 'southern',
        'city_id': 'city-livingstone', 'city_name': 'Livingstone', 'city_slug': 'livingstone',
        'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'livingstone',
    },
    {
        'id': 'suburb-livingstone', 'type': 'suburb', 'name': 'Livingstone', 'slug': 'livingstone',
        'province_id': 'province-southern', 'province_name': 'Southern', 'province_slug': 'southern',
        'city_id': 'city-livingstone', 'city_name': 'Livingstone', 'city_slug': 'livingstone',
        'suburb_id': 'suburb-livingstone', 'suburb_name': 'Livingstone', 'suburb_slug': 'livingstone',
        'canonical_path': 'livingstone/livingstone',
    },
    {
        'id': 'suburb-lusaka', 'type': 'suburb', 'name': 'Lusaka', 'slug': 'lusaka',
        'province_id': 'province-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka',
        'city_id': 'city-lusaka', 'city_name': 'Lusaka', 'city_slug': 'lusaka',
        'suburb_id': 'suburb-lusaka', 'suburb_name': 'Lusaka', 'suburb_slug': 'lusaka',
        'canonical_path': 'lusaka/lusaka',
    },
]
PROPERTIES = [
    {
        'id': 'sale-livingstone-house', 'reference_number': 'SALE-1', 'title': 'Livingstone family house',
        'description': 'House near central Livingstone', 'price': 1500000, 'currency_code': 'ZMW',
        'purpose': 'For Sale', 'property_type': 'House', 'area': 'LIVINGSTONE',
        'full_address': 'LIVINGSTONE, Southern', 'province_id': 'province-southern',
        'city_id': 'city-livingstone', 'suburb_id': 'suburb-livingstone', 'area_slug': 'livingstone', 'bedrooms': 3, 'bathrooms': 2,
        'garages': 1, 'square_metres': 220, 'amenities': ['Garden'], 'status': 'Active',
        'featured': False, 'branch_id': None, 'created_at': '2026-09-10T00:00:00Z',
    },
    {
        'id': 'rent-lusaka-apartment', 'reference_number': 'RENT-1', 'title': 'Lusaka apartment',
        'description': 'Apartment in central Lusaka', 'price': 12000, 'currency_code': 'ZMW',
        'purpose': 'For Rent', 'property_type': 'Apartment', 'area': 'LUSAKA',
        'full_address': 'LUSAKA, Lusaka', 'province_id': 'province-lusaka',
        'city_id': 'city-lusaka', 'suburb_id': 'suburb-lusaka', 'area_slug': 'lusaka', 'bedrooms': 2, 'bathrooms': 1,
        'garages': 1, 'square_metres': 90, 'amenities': ['Parking'], 'status': 'Active',
        'featured': False, 'branch_id': None, 'created_at': '2026-09-11T00:00:00Z',
    },
    {
        'id': 'sale-lusaka-house', 'reference_number': 'SALE-2', 'title': 'Lusaka sale house',
        'description': 'House in Lusaka', 'price': 900000, 'currency_code': 'ZMW',
        'purpose': 'For Sale', 'property_type': 'House', 'area': 'Kabulonga',
        'full_address': 'Kabulonga, Lusaka', 'province_id': 'province-lusaka',
        'city_id': 'city-lusaka', 'suburb_id': None, 'area_slug': 'kabulonga', 'bedrooms': 4, 'bathrooms': 3,
        'garages': 2, 'square_metres': 280, 'amenities': ['Pool'], 'status': 'Active',
        'featured': False, 'branch_id': None, 'created_at': '2026-09-09T00:00:00Z',
    },
    {
        'id': 'sale-livingstone-expensive', 'reference_number': 'SALE-3', 'title': 'Livingstone estate',
        'description': 'Large House in Livingstone', 'price': 6000000, 'currency_code': 'ZMW',
        'purpose': 'For Sale', 'property_type': 'House', 'area': 'LIVINGSTONE',
        'full_address': 'LIVINGSTONE, Southern', 'province_id': 'province-southern',
        'city_id': 'city-livingstone', 'suburb_id': 'suburb-livingstone', 'area_slug': 'livingstone', 'bedrooms': 5, 'bathrooms': 4,
        'garages': 3, 'square_metres': 600, 'amenities': ['Pool'], 'status': 'Active',
        'featured': False, 'branch_id': None, 'created_at': '2026-09-08T00:00:00Z',
    },
    {
        'id': 'rent-livingstone-apartment', 'reference_number': 'RENT-2', 'title': 'Livingstone apartment',
        'description': 'Apartment in Livingstone', 'price': 10000, 'currency_code': 'ZMW',
        'purpose': 'For Rent', 'property_type': 'Apartment', 'area': 'LIVINGSTONE',
        'full_address': 'LIVINGSTONE, Southern', 'province_id': 'province-southern',
        'city_id': 'city-livingstone', 'suburb_id': 'suburb-livingstone', 'area_slug': 'livingstone', 'bedrooms': 3, 'bathrooms': 2,
        'garages': 1, 'square_metres': 100, 'amenities': ['Parking'], 'status': 'Active',
        'featured': False, 'branch_id': None, 'created_at': '2026-09-07T00:00:00Z',
    },
]


def api_fixture(route):
    parsed = urlparse(route.request.url)
    table = parsed.path.rstrip('/').split('/')[-1]
    query = parse_qs(parsed.query)
    if table == 'properties':
        purpose = query.get('purpose', [''])[0]
        rows = PROPERTIES
        if purpose == 'eq.For Sale':
            rows = [row for row in rows if row['purpose'] == 'For Sale']
        elif purpose == 'eq.For Rent':
            rows = [row for row in rows if row['purpose'] == 'For Rent']
        for field in ('province_id', 'city_id', 'suburb_id'):
            expected = query.get(field, [''])[0]
            if expected.startswith('eq.'):
                rows = [row for row in rows if row.get(field) == expected[3:]]
    elif table == 'provinces':
        rows = PROVINCES
    elif table == 'cities':
        rows = CITIES
    elif table in ('search_locations', 'resolve_location_path'):
        body = json.loads(route.request.post_data or '{}')
        if table == 'resolve_location_path':
            path = str(body.get('location_path', '')).lower()
            rows = [row for row in LOCATIONS if row['canonical_path'] == path]
        else:
            term = str(body.get('search_term', '')).lower()
            rows = [row for row in LOCATIONS if term in row['name'].lower()]
    else:
        rows = []
    route.fulfill(status=200, content_type='application/json', body=json.dumps(rows), headers={'content-range': f'0-{max(0, len(rows)-1)}/{len(rows)}'})


def install_api(page):
    page.route('**/rest/v1/**', api_fixture)


def wait_home(page):
    page.wait_for_function("publicState.listingsLoaded === true", timeout=30000)


def select_home_location(page, term, location_type):
    page.locator('#discoveryLocationTrigger').fill(term)
    selector = f'#discoveryLocationMenu [data-location-type="{location_type}"]'
    page.wait_for_function("selector => document.querySelector(selector) !== null", arg=selector)
    page.locator(selector).click()


def wait_listings(page):
    page.wait_for_function("document.querySelector('#listingsGrid') && ['ready', 'empty'].includes(document.querySelector('#listingsGrid').dataset.state)", timeout=30000)


def path(page):
    return urlparse(page.url).path


def home_inventory_state(page):
    return page.evaluate("""() => ({
        listings: document.querySelector('#homePropertySections').innerHTML,
        count: document.querySelector('#discoveryCount').textContent,
        status: document.querySelector('#discoveryStatus').textContent
    })""")


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
        api_requests = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('request', lambda request: api_requests.append(request.url) if '/rest/v1/' in request.url else None)
        install_api(page)

        # TESTS 1-9: every homepage control remains draft-only until submit.
        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        home_url = page.url
        baseline_inventory = home_inventory_state(page)
        baseline_request_count = sum('/rest/v1/properties?' in request for request in api_requests)
        check('Homepage inventory loads independently', page.locator('#homePropertySections .property-card').count() == len(PROPERTIES))

        select_home_location(page, 'Southern', 'province')
        check('Province is draft-only', page.url == home_url and home_inventory_state(page) == baseline_inventory)

        select_home_location(page, 'Livingstone', 'city')
        check('City is draft-only', page.url == home_url and home_inventory_state(page) == baseline_inventory)

        select_home_location(page, 'Livingstone', 'suburb')
        check('Area/location is draft-only', page.url == home_url and home_inventory_state(page) == baseline_inventory)

        page.locator('#discoveryType').select_option('House', force=True)
        check('Property type is draft-only', page.url == home_url and home_inventory_state(page) == baseline_inventory)

        page.locator('#discoveryPrice').select_option('ZMW:1500000', force=True)
        check('Maximum price is draft-only', page.url == home_url and home_inventory_state(page) == baseline_inventory)

        page.locator('[data-discovery-purpose="For Rent"]').click()
        check('Rent purpose is draft-only', page.url == home_url and home_inventory_state(page) == baseline_inventory)
        page.locator('[data-discovery-purpose="For Sale"]').click()
        check('Sale purpose is draft-only', page.url == home_url and home_inventory_state(page) == baseline_inventory)
        page.evaluate("""() => {
            discoverySearchState.minPrice = '1000000';
            discoverySearchState.minBedrooms = '3';
        }""")
        check('Extended draft fields do not affect homepage', page.url == home_url and home_inventory_state(page) == baseline_inventory)
        check('Combined homepage filters keep URL clean', page.url == home_url and '?' not in page.url)
        check('Homepage control changes do not refetch inventory', sum('/rest/v1/properties?' in request for request in api_requests) == baseline_request_count)

        # TEST 11: Sale route receives and applies the committed draft.
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        sale_query = parse_qs(urlparse(page.url).query)
        check('Sale opens dedicated route', path(page) == '/properties-for-sale/livingstone/livingstone')
        check('Sale keeps geography out of query and preserves refinements', not any(key in sale_query for key in ('location', 'province', 'city', 'area')) and sale_query.get('type') == ['house'] and sale_query.get('currency') == ['ZMW'] and sale_query.get('minPrice') == ['1000000'] and sale_query.get('maxPrice') == ['1500000'] and sale_query.get('minBedrooms') == ['3'])
        check('Sale query hydrates controls', page.locator('#listingLocationInput').input_value().lower() == 'livingstone' and page.locator('#listingTypeFilter').input_value() == 'House')
        check('Sale destination applies submitted filters', page.locator('#listingsGrid .property-card').count() == 1 and 'Livingstone family house' in page.locator('#listingsGrid').inner_text())
        page.screenshot(path=str(OUT / 'sale-routing-pass.png'), full_page=False)

        # TEST 14: browser Back returns to the intact homepage.
        page.go_back(wait_until='domcontentloaded')
        wait_home(page)
        check('Back returns to unchanged homepage', path(page) == '/index.html' and home_inventory_state(page) == baseline_inventory)

        # TEST 10: Rent route receives and applies the committed draft.
        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        rent_home_url = page.url
        rent_baseline_inventory = home_inventory_state(page)
        page.locator('[data-discovery-purpose="For Rent"]').click()
        select_home_location(page, 'Lusaka', 'suburb')
        page.locator('#discoveryType').select_option('Apartment', force=True)
        page.locator('#discoveryPrice').select_option('ZMW:12000', force=True)
        check('Combined Rent draft keeps homepage intact', page.url == rent_home_url and home_inventory_state(page) == rent_baseline_inventory)
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#discoverySearchBtn').click()
        wait_listings(page)
        rent_query = parse_qs(urlparse(page.url).query)
        check('Rent opens dedicated route', path(page) == '/properties-for-rent/lusaka/lusaka')
        check('Rent keeps geography out of query and preserves refinements', not any(key in rent_query for key in ('location', 'province', 'city', 'area')) and rent_query.get('type') == ['apartment'] and rent_query.get('currency') == ['ZMW'] and rent_query.get('maxPrice') == ['12000'])
        check('Rent query hydrates controls', page.locator('#listingLocationInput').input_value().lower() == 'lusaka' and page.locator('#listingTypeFilter').input_value() == 'Apartment')
        check('Rent destination applies submitted filters', page.locator('#listingsGrid .property-card').count() == 1 and 'Lusaka apartment' in page.locator('#listingsGrid').inner_text())
        page.screenshot(path=str(OUT / 'rent-routing-pass.png'), full_page=False)

        # Dedicated-page search switches routes and retains entered filters.
        page.locator('.discovery-transactions [data-listing-purpose="For Sale"]').click()
        with page.expect_navigation(wait_until='domcontentloaded'):
            page.locator('#listingSearchForm .search-button').click()
        wait_listings(page)
        cross_query = parse_qs(urlparse(page.url).query)
        check('Dedicated Rent search can switch to Sale', path(page) == '/properties-for-sale/lusaka/lusaka')
        check('Cross-route filters are retained', cross_query.get('type') == ['apartment'] and 'area' not in cross_query)

        # Generic listings remains the clean generic fallback when submitted.
        page.goto(base + '/listings.html', wait_until='domcontentloaded')
        page.locator('#listingSearchForm .search-button').wait_for(timeout=30000)
        page.locator('#listingSearchForm .search-button').click()
        check('No-purpose fallback stays generic', path(page) == '/listings')

        # Normalization accepts the specified label/value variants.
        page.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(page)
        normalized = page.evaluate("[normalizeListingPurpose('sale'), normalizeListingPurpose('Sale'), normalizeListingPurpose('for-sale'), normalizeListingPurpose('For Sale'), normalizeListingPurpose('rent'), normalizeListingPurpose('For_Rent')]")
        check('Purpose variants normalize canonically', normalized == ['For Sale', 'For Sale', 'For Sale', 'For Sale', 'For Rent', 'For Rent'])

        # TEST 7: repeat submission through the responsive mobile controls.
        mobile = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_errors = []
        mobile.on('pageerror', lambda error: mobile_errors.append(str(error)))
        install_api(mobile)
        mobile.goto(base + '/index.html', wait_until='domcontentloaded')
        wait_home(mobile)
        mobile_url = mobile.url
        mobile_inventory = home_inventory_state(mobile)
        mobile.locator('[data-discovery-purpose="For Rent"]').click()
        mobile.locator('#discoveryType').select_option('Apartment', force=True)
        check('Mobile controls are draft-only', mobile.url == mobile_url and home_inventory_state(mobile) == mobile_inventory)
        with mobile.expect_navigation(wait_until='domcontentloaded'):
            mobile.locator('#discoverySearchBtn').click()
        wait_listings(mobile)
        check('Mobile search opens dedicated Rent route', path(mobile) == '/properties-for-rent' and mobile.locator('#listingTypeFilter').input_value() == 'Apartment')
        mobile.screenshot(path=str(OUT / 'mobile-rent-routing-pass.png'), full_page=False)

        check('No page errors', not errors and not mobile_errors)
        mobile.close()
        page.close()
        browser.close()
finally:
    server.shutdown()

report = {'checks_passed': len(checks), 'checks': checks, 'artifacts': str(OUT)}
(OUT / 'test-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
