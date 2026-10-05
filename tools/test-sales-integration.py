"""Sales integration regression checks. Run from any directory with Python Playwright installed.

Uses an isolated local server and headless Chrome. Live reads are anonymous and read-only;
controlled API responses exercise cases absent from the live inventory. No writes to Supabase.
"""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.codex-artifacts' / 'sales-integration'
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        if self.path.startswith('/property-details?'):
            self.path = '/property-details.html' + self.path[self.path.index('?'):]
        super().do_GET()


def property_row(n, **changes):
    row = dict(id=f'00000000-0000-0000-0000-{n:012d}', reference_number=f'TEST-{n}',
               title=f'Test house {n}', description='Spacious family home', price=100000 * n,
               currency_code='ZMW', purpose='For Sale', property_type='House',
               area=f'Area {n}', full_address=f'Area {n}, Lusaka', bedrooms=3, bathrooms=2,
               garages=1, square_metres=200, amenities=['Garden', 'Parking'],
               status='Active', featured=False, created_at=f'2026-09-{n:02d}T00:00:00Z')
    row.update(changes)
    return row


fixtures = [property_row(1), property_row(2, status='Under Offer', property_type='Apartment', bedrooms=2),
            property_row(3, currency_code='USD', price=50000, amenities=['Pool']),
            property_row(4, purpose='For Rent'), property_row(5, status='Draft'),
            property_row(6, status='Sold'), property_row(7, status='Let / Rented'),
            property_row(8, status='Withdrawn'), property_row(9, status='Archived')]
expected = fixtures[:3]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
url = base + '/property%20replica/sales/listings.html'
report = {'checks': [], 'live': {}}


def check(name, condition):
    assert condition, name
    report['checks'].append(name)


def ready(page, state='ready'):
    page.wait_for_function('(state) => document.querySelector("#listingsGrid").dataset.state === state', arg=state, timeout=45000)


def install_api(page, mode='normal', rows=None):
    calls = []

    def api(route):
        parsed = urlparse(route.request.url)
        query = parse_qs(parsed.query)
        calls.append({'table': parsed.path.split('/')[-1], 'query': query})
        if parsed.path.endswith('/properties'):
            check('query enforces Sale', query.get('purpose') == ['eq.For Sale'])
            check('query enforces public statuses', query.get('status') == ['in.(Active,Under Offer)'])
            if mode == 'error':
                route.fulfill(status=503, content_type='application/json', body='{"message":"Test failure"}')
                return
            data = fixtures if rows is None else rows
            if mode != 'invalid-response':
                data = [r for r in data if r['purpose'] == 'For Sale' and r['status'] in ('Active', 'Under Offer')]
            data = sorted(data, key=lambda r: r['created_at'], reverse=True)
            if mode == 'empty':
                data = []
        elif parsed.path.endswith('/property_images'):
            ids = query['property_id'][0].removeprefix('in.(').removesuffix(')').split(',')
            check('images restricted to returned Sale IDs', set(ids) <= {r['id'] for r in (expected if rows is None else rows)})
            if mode == 'image-error':
                route.fulfill(status=503, content_type='application/json', body='{"message":"Test image failure"}')
                return
            data = [dict(property_id=expected[0]['id'], image_url=base+'/assets/images/hero-poster.png', display_order=2, is_cover=False),
                    dict(property_id=expected[0]['id'], image_url=base+'/property%20replica/sales/assets/images/hilltop-logo.png', display_order=9, is_cover=True),
                    dict(property_id=expected[1]['id'], image_url=base+'/missing-image.png', display_order=1, is_cover=True)] if rows is None else []
        else:
            data = []
        offset = int(query.get('offset', ['0'])[0])
        limit = int(query.get('limit', ['500'])[0])
        route.fulfill(status=200, content_type='application/json', body=json.dumps(data[offset:offset+limit]))

    page.route('**/rest/v1/**', api)
    return calls


def search(page):
    page.locator('#listingSearchForm').evaluate('(form) => form.requestSubmit()')


def clear(page):
    page.locator('#resetFilters').dispatch_event('click')


def count(page):
    return page.locator('#listingsGrid .property-card').count()


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1100})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        live_requests = []
        page.on('request', lambda req: live_requests.append(req.url))
        page.goto(url, wait_until='domcontentloaded')
        ready(page)
        report['live']['sale_count'] = count(page)
        page.wait_for_function('Array.from(document.querySelectorAll(".property-card:nth-child(-n+2) img")).every(img=>img.complete)', timeout=30000)
        check('live page has only Sale badges', set(page.locator('.purpose-badge').all_text_contents()) <= {'For Sale'})
        check('preview inventory and legacy website controller not loaded', not any('listings-preview-data.js' in u or '/website.js' in u for u in live_requests))
        check('main shared details links', all(h.startswith('/property-details?id=') for h in page.locator('.property-title a').evaluate_all('(links)=>links.map(a=>a.getAttribute("href"))')))
        report['live']['averages'] = page.locator('.listings-lower-prices tbody').inner_text()
        for width in [1440, 1024, 900, 600, 390, 360]:
            page.set_viewport_size({'width': width, 'height': 1100 if width > 600 else 844})
            page.evaluate('document.fonts.ready')
            check(f'no overflow at {width}', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            check(f'card columns at {width}', page.locator('.property-grid').evaluate('(el)=>getComputedStyle(el).gridTemplateColumns.split(" ").length') == (2 if width > 600 else 1))
            if width in (1440, 390):
                page.screenshot(path=str(OUT / f'sales-live-{width}.png'), full_page=False)
        check('no live JavaScript errors', not errors)
        page.close()

        page = browser.new_page(viewport={'width': 1440, 'height': 1100})
        page.on('pageerror', lambda error: errors.append(str(error)))
        calls = install_api(page)
        page.goto(url+'?purpose=rent&listingType=rent', wait_until='domcontentloaded')
        ready(page)
        check('Active and Under Offer shown; Rent and other statuses absent', count(page) == 3)
        check('URL purpose cannot change Sales', page.locator('#listingPurposeFilter').input_value() == 'For Sale')
        check('real dataset locations only', page.locator('#listingLocations option').evaluate_all('(options)=>options.map(o=>o.value).sort()') == ['Area 1', 'Area 2', 'Area 3'])
        first_gallery = page.locator('.property-card').filter(has_text='Test house 1').locator('.property-gallery')
        check('cover precedes display order', first_gallery.locator('img').get_attribute('src').endswith('hilltop-logo.png'))
        first_gallery.locator('.gallery-next').click()
        check('gallery advances to correct image', first_gallery.locator('img').get_attribute('src').endswith('hero-poster.png'))
        check('missing images show placeholder', page.locator('.gallery-placeholder').count() == 2)
        page.locator('.discovery-transactions [data-listing-purpose="For Rent"]').click()
        check('transaction Rent control prepares Rent routing', page.locator('#listingPurposeFilter').input_value() == 'For Rent' and count(page) == 3)
        page.locator('.discovery-transactions [data-listing-purpose="For Sale"]').click()

        for field, value, expected_count in [('listingLocationInput', 'Area 2', 1), ('keywordsInput', 'spacious', 3),
                                               ('referenceInput', 'TEST-1', 1), ('minSizeInput', '201', 0)]:
            clear(page)
            page.locator('#'+field).evaluate('(el,value)=>{el.value=value}', value)
            search(page)
            check('filter '+field, count(page) == expected_count)
        for field, value, expected_count in [('listingTypeFilter', 'Apartment', 1), ('bedroomsFilter', '3', 2), ('bathroomsFilter', '3', 0)]:
            clear(page)
            page.locator('#'+field).select_option(value, force=True)
            search(page)
            check('filter '+field, count(page) == expected_count)
        clear(page)
        page.locator('input[name=feature][value=Pool]').evaluate('(el)=>{el.checked=true}')
        search(page)
        check('amenity filtering', count(page) == 1)
        clear(page)
        page.locator('#quickFilterOptions button').filter(has_text='Area 1').click()
        check('quick location filters', count(page) == 1)

        clear(page)
        page.locator('#maxPriceInput').evaluate('(el)=>{el.value="150000"}')
        search(page)
        check('price limits require currency', count(page) == 0 and 'Choose ZMW or USD' in page.locator('#filterMatchingCount').inner_text())
        page.locator('#listingCurrencyFilter').select_option('ZMW', force=True)
        search(page)
        check('ZMW budget excludes USD', count(page) == 1 and 'Test house 1' in page.locator('#listingsGrid').inner_text())
        page.locator('#listingCurrencyFilter').select_option('USD', force=True)
        search(page)
        check('USD budget excludes ZMW', count(page) == 1 and 'Test house 3' in page.locator('#listingsGrid').inner_text())
        page.locator('#maxPriceInput').evaluate('(el)=>{el.value="0"}')
        search(page)
        check('zero maximum is not unlimited', count(page) == 0)
        clear(page)
        check('Clear filters retains fixed purpose', count(page) == 3 and page.locator('#listingPurposeFilter').input_value() == 'For Sale')
        for sort, titles in [('price-low', ['Test house 1', 'Test house 2', 'Test house 3']), ('price-high', ['Test house 2', 'Test house 1', 'Test house 3']), ('newest', ['Test house 3', 'Test house 2', 'Test house 1'])]:
            page.locator('#listingSortSelect').select_option(sort)
            check('sort '+sort, page.locator('.property-title').all_text_contents() == titles)
        check('averages separate currencies', page.locator('.listings-lower-prices tbody tr').first.locator('td').inner_text() == 'ZMW K150,000 / USD $50,000')
        page.set_viewport_size({'width': 390, 'height': 844})
        page.locator('#mobileFiltersButton').click()
        check('mobile filter navigation', page.locator('#listingLocationInput').is_visible())
        page.locator('#moreFiltersButton').click()
        check('mobile advanced filters', page.locator('#advancedFilters').is_visible())
        page.screenshot(path=str(OUT/'sales-mobile-filters.png'), full_page=False)
        page.close()

        for mode in ['empty', 'error', 'image-error', 'invalid-response']:
            page = browser.new_page()
            calls = install_api(page, mode)
            page.goto(url, wait_until='domcontentloaded')
            ready(page, 'empty' if mode == 'empty' else 'error')
            check(mode+' has no fake inventory', count(page) == 0)
            if mode == 'empty':
                check('empty skips image query', not any(call['table'] == 'property_images' for call in calls))
            if mode == 'error':
                page.unroute('**/rest/v1/**')
                install_api(page)
                page.locator('#retryListings').click()
                ready(page)
                check('retry recovers', count(page) == 3)
            page.close()

        page = browser.new_page()
        page.route('**/supabase-config.js', lambda route: route.fulfill(content_type='application/javascript', body='window.hilltopSupabase=null;'))
        page.goto(url, wait_until='domcontentloaded')
        ready(page, 'error')
        check('Supabase unavailable has no fallback', count(page) == 0)
        page.close()

        # Exercise pagination beyond the API page size and image-ID batching.
        page = browser.new_page()
        large_rows = [property_row(1, id=f'00000000-0000-0000-0001-{i:012d}') for i in range(501)]
        calls = install_api(page, rows=large_rows)
        page.goto(url, wait_until='domcontentloaded')
        ready(page)
        check('all API pages loaded', count(page) == 501)
        check('image IDs batched', len([c for c in calls if c['table'] == 'property_images']) == 6)
        page.close()

        # Optional comparison against the untouched source captured before integration.
        baseline_html = OUT / 'before-listings.html'
        baseline_js = OUT / 'before-listings-ui.js'
        if baseline_html.exists() and baseline_js.exists():
            metrics = {}
            for variant in ['before', 'after']:
                page = browser.new_page(viewport={'width': 1440, 'height': 1100})
                if variant == 'before':
                    page.route('**/sales/listings.html', lambda r: r.fulfill(content_type='text/html', body=baseline_html.read_text(encoding='utf-8')))
                    page.route('**/sales/listings-ui.js*', lambda r: r.fulfill(content_type='application/javascript', body=baseline_js.read_text(encoding='utf-8')))
                    sample = {'properties': sorted(expected, key=lambda r: r['created_at'], reverse=True), 'images': []}
                    page.route('**/listings-preview-data.js*', lambda r: r.fulfill(content_type='application/javascript', body='window.propertyPreviewData='+json.dumps(sample)+';'))
                else:
                    install_api(page, rows=expected)
                page.goto(url, wait_until='domcontentloaded')
                page.locator('.property-card').first.wait_for()
                page.evaluate('document.fonts.ready')
                metrics[variant] = {}
                for width in [1440, 390]:
                    page.set_viewport_size({'width': width, 'height': 1100 if width > 600 else 844})
                    page.wait_for_timeout(250)
                    metrics[variant][width] = page.evaluate('''() => Object.fromEntries(
                        ['.site-header','.marketplace-layout','.filter-sidebar','.results-header','.property-grid','.property-card','.property-gallery'].map(selector => {
                            const el=document.querySelector(selector), box=el.getBoundingClientRect(), style=getComputedStyle(el);
                            return [selector,{x:box.x,y:box.y,width:box.width,height:box.height,font:style.fontFamily,fontSize:style.fontSize}];
                        }))''')
                    page.screenshot(path=str(OUT / f'sales-{variant}-{width}.png'))
                page.close()
            report['layout_comparison'] = metrics
            for width in [1440, 390]:
                for selector, before in metrics['before'][width].items():
                    after = metrics['after'][width][selector]
                    check(f'layout {width} {selector}', all(abs(before[k]-after[k]) <= 1 for k in (['x','y','width'] if selector == '.marketplace-layout' else ['x','y','width','height'])) and before['font'] == after['font'] and before['fontSize'] == after['fontSize'])
        check('no JavaScript regressions', not errors)
        browser.close()
finally:
    server.shutdown()
    (OUT/'test-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'checks_passed': len(report['checks']), 'live': report['live'], 'artifacts': str(OUT)}, indent=2))
