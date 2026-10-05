"""Phase 2 location autocomplete integration checks."""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.codex-artifacts' / 'location-search-phase2'
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


PROVINCES = [
    {'id': 'province-lusaka', 'name': 'Lusaka', 'slug': 'lusaka', 'map_key': 'lusaka', 'sort_order': 1},
    {'id': 'province-southern', 'name': 'Southern', 'slug': 'southern', 'map_key': 'southern', 'sort_order': 2},
]
CITIES = [
    {'id': 'city-lusaka', 'province_id': 'province-lusaka', 'name': 'Lusaka', 'slug': 'lusaka'},
    {'id': 'city-livingstone', 'province_id': 'province-southern', 'name': 'Livingstone', 'slug': 'livingstone'},
]
PROPERTIES = [{
    'id': 'property-1', 'reference_number': 'TEST-1', 'title': 'Test property', 'description': 'Test',
    'price': 1000000, 'currency_code': 'ZMW', 'purpose': 'For Sale', 'property_type': 'House',
    'area': 'Olympia', 'full_address': 'Olympia, Lusaka', 'province_id': 'province-lusaka',
    'city_id': 'city-lusaka', 'area_slug': 'olympia', 'bedrooms': 3, 'bathrooms': 2, 'garages': 1,
    'square_metres': 200, 'amenities': [], 'status': 'Active', 'featured': False, 'branch_id': None,
    'created_at': '2026-09-17T00:00:00Z',
}]
LOCATIONS = [
    {
        'id': 'city-lusaka', 'type': 'city', 'name': 'Lusaka', 'slug': 'lusaka',
        'province_id': 'province-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka',
        'city_id': 'city-lusaka', 'city_name': 'Lusaka', 'city_slug': 'lusaka',
        'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'lusaka',
    },
    {
        'id': 'province-lusaka', 'type': 'province', 'name': 'Lusaka', 'slug': 'lusaka',
        'province_id': 'province-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka',
        'city_id': None, 'city_name': None, 'city_slug': None,
        'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'lusaka-province',
    },
    {
        'id': 'suburb-olympia', 'type': 'suburb', 'name': 'Olympia', 'slug': 'olympia',
        'province_id': 'province-lusaka', 'province_name': 'Lusaka', 'province_slug': 'lusaka',
        'city_id': 'city-lusaka', 'city_name': 'Lusaka', 'city_slug': 'lusaka',
        'suburb_id': 'suburb-olympia', 'suburb_name': 'Olympia', 'suburb_slug': 'olympia',
        'canonical_path': 'lusaka/olympia',
    },
    {
        'id': 'city-livingstone', 'type': 'city', 'name': 'Livingstone', 'slug': 'livingstone',
        'province_id': 'province-southern', 'province_name': 'Southern', 'province_slug': 'southern',
        'city_id': 'city-livingstone', 'city_name': 'Livingstone', 'city_slug': 'livingstone',
        'suburb_id': None, 'suburb_name': None, 'suburb_slug': None, 'canonical_path': 'livingstone',
    },
]


def api_fixture(route):
    table = urlparse(route.request.url).path.rstrip('/').split('/')[-1]
    rows = {'properties': PROPERTIES, 'provinces': PROVINCES, 'cities': CITIES}.get(table, [])
    route.fulfill(status=200, content_type='application/json', body=json.dumps(rows))


def install_rpc_mock(page):
    page.evaluate("""(locations) => {
        window.__locationRpcCalls = [];
        window.hilltopSupabase = {
            rpc(name, args) {
                window.__locationRpcCalls.push({name, args});
                const term = String(args.search_term || '').toLowerCase();
                let data = locations.filter((location) =>
                    location.name.toLowerCase().includes(term) ||
                    (location.city_name || '').toLowerCase().includes(term) ||
                    (location.province_name || '').toLowerCase().includes(term)
                );
                let delay = 25;
                if (term === 'lu') {
                    delay = 550;
                    data = [{
                        id: 'city-lundazi', type: 'city', name: 'Lundazi', slug: 'lundazi',
                        province_id: 'province-eastern', province_name: 'Eastern', province_slug: 'eastern',
                        city_id: 'city-lundazi', city_name: 'Lundazi', city_slug: 'lundazi',
                        suburb_id: null, suburb_name: null, suburb_slug: null, canonical_path: 'lundazi'
                    }];
                }
                return new Promise((resolve) => setTimeout(() => resolve({data, error: null}), delay));
            }
        };
    }""", LOCATIONS)


checks = []


def check(name, condition):
    assert condition, name
    checks.append(name)


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page_errors = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.route('**/rest/v1/**', api_fixture)
        page.goto(f'http://127.0.0.1:{server.server_port}/index.html', wait_until='domcontentloaded')
        page.wait_for_function("publicState.listingsLoaded === true")
        install_rpc_mock(page)

        location_input = page.locator('#discoveryLocationTrigger')
        location_menu = page.locator('#discoveryLocationMenu')
        baseline_url = page.url
        baseline_inventory = page.locator('#homePropertySections').inner_html()

        location_input.fill('olym')
        page.wait_for_function("document.querySelector('[data-location-type=suburb]')?.textContent.includes('Olympia')")
        check('olym calls the location RPC', page.evaluate("__locationRpcCalls.at(-1).name") == 'search_locations')
        check('RPC receives the debounced term and small limit', page.evaluate("__locationRpcCalls.at(-1).args") == {'search_term': 'olym', 'result_limit': 8})
        check('Olympia is presented with hierarchy context', 'Lusaka, Lusaka' in location_menu.inner_text())
        page.locator('[data-location-type="suburb"]').click()
        olympia = page.evaluate("discoverySearchState.selectedLocation")
        check('Olympia selection is structured', olympia['type'] == 'suburb' and olympia['id'] == 'suburb-olympia' and olympia['cityId'] == 'city-lusaka' and olympia['canonicalPath'] == 'lusaka/olympia')
        check('selection closes the custom listbox', location_input.get_attribute('aria-expanded') == 'false')
        check('selection does not navigate', page.url == baseline_url)
        check('selection does not filter homepage inventory', page.locator('#homePropertySections').inner_html() == baseline_inventory)

        location_input.fill('Living...')
        check('manual input mutation clears Olympia', page.evaluate("discoverySearchState.selectedLocation") is None)
        check('typed text remains separate from selection', page.evaluate("discoverySearchState.locationQuery") == 'Living...')

        page.evaluate("__locationRpcCalls.length = 0")
        location_input.fill('')
        page.wait_for_timeout(320)
        location_input.fill('l')
        page.wait_for_timeout(320)
        check('empty and one-character terms send no RPC requests', page.evaluate("__locationRpcCalls.length") == 0)

        location_input.fill('lusa')
        page.wait_for_function("document.querySelectorAll('#discoveryLocationMenu [role=option]').length >= 2")
        option_text = location_menu.locator('[role="option"]').all_text_contents()
        check('Lusaka city and province are both presented', len(option_text) >= 2 and any('City' in text for text in option_text) and any('Province' in text for text in option_text))
        location_input.press('ArrowDown')
        check('ArrowDown highlights the first result', location_input.get_attribute('aria-activedescendant') == 'discovery-location-option-0')
        location_input.press('ArrowDown')
        check('a second ArrowDown advances the highlight', location_input.get_attribute('aria-activedescendant') == 'discovery-location-option-1')
        location_input.press('ArrowUp')
        check('ArrowUp returns to the previous result', location_input.get_attribute('aria-activedescendant') == 'discovery-location-option-0')
        location_input.press('Enter')
        city = page.evaluate("discoverySearchState.selectedLocation")
        check('Enter selects the highlighted city', city['type'] == 'city' and city['id'] == 'city-lusaka')

        location_input.fill('lusa')
        page.wait_for_function("document.querySelectorAll('#discoveryLocationMenu [role=option]').length >= 2")
        page.locator('[data-location-type="province"]').click()
        province = page.evaluate("discoverySearchState.selectedLocation")
        check('Lusaka city and province keep unique canonical identities', city['canonicalPath'] == 'lusaka' and province['canonicalPath'] == 'lusaka-province' and city['type'] != province['type'] and city['id'] != province['id'])

        location_input.fill('olym')
        page.wait_for_function("document.querySelector('#discoveryLocationTrigger').getAttribute('aria-expanded') === 'true'")
        location_input.press('Escape')
        check('Escape closes the listbox', location_input.get_attribute('aria-expanded') == 'false')

        page.evaluate("__locationRpcCalls.length = 0")
        location_input.fill('lu')
        page.wait_for_function("__locationRpcCalls.some(call => call.args.search_term === 'lu')")
        location_input.fill('lusa')
        page.wait_for_function("document.querySelectorAll('#discoveryLocationMenu [role=option]').length >= 2")
        page.wait_for_timeout(500)
        check('older RPC responses cannot replace newer results', 'Lundazi' not in location_menu.inner_text() and 'Lusaka' in location_menu.inner_text())
        check('no uncaught page errors', page_errors == [])

        page.screenshot(path=str(OUT / 'location-autocomplete.png'), full_page=False)
        browser.close()
finally:
    server.shutdown()
    server.server_close()

report = {'checks_passed': len(checks), 'checks': checks, 'artifacts': str(OUT)}
(OUT / 'test-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
