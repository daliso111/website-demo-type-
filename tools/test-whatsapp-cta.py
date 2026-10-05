"""Local regression checks for the shared public-site WhatsApp quick action."""
import json
import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.codex-artifacts' / 'whatsapp-cta'
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def check(name, condition, report):
    assert condition, name
    report['checks'].append(name)


def state(page):
    return page.locator('[data-testid="hilltop-whatsapp-cta"]').get_attribute('data-state')


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
report = {'checks': [], 'viewports': {}}


def browser_executable():
    candidates = [
        os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE', ''),
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    ]
    return next((candidate for candidate in candidates if candidate and Path(candidate).exists()), None)

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=browser_executable())

        desktop = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = desktop.new_page()
        page.goto(base + '/index.html', wait_until='domcontentloaded')
        button = page.locator('[data-testid="hilltop-whatsapp-cta"]')
        button.wait_for(state='visible')

        initial_box = button.bounding_box()
        initial_opacity = page.evaluate("getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]')).opacity")
        check('desktop starts fully visible', initial_opacity == '1', report)
        check('desktop starts fully inside viewport', initial_box['x'] >= 0 and initial_box['x'] + initial_box['width'] <= 1440, report)
        check('desktop touch target is 56px', round(initial_box['width']) == 56 and round(initial_box['height']) == 56, report)
        check('CTA uses the supplied PNG', button.locator('img').get_attribute('src') == '/assets/images/hilltop-whatsapp-quick-action.png', report)
        check('CTA has an accessible label', button.get_attribute('aria-label') == 'Chat with Hilltop Properties on WhatsApp', report)

        generic_href = button.get_attribute('href')
        generic_url = urlparse(generic_href)
        generic_message = parse_qs(generic_url.query)['text'][0]
        check('generic WhatsApp number is correct', generic_url.path == '/260979972019', report)
        check('generic message is correct', generic_message == 'Hello Hilltop Properties, I would like some assistance regarding your properties.', report)

        page.wait_for_function("document.querySelector('[data-testid=hilltop-whatsapp-cta]').dataset.state === 'idle'", timeout=5000)
        idle_box = button.bounding_box()
        idle_opacity = page.evaluate("getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]')).opacity")
        check('intro settles into idle once', state(page) == 'idle', report)
        check('idle opacity is 0.35', idle_opacity == '0.35', report)
        check('idle position is tucked toward right edge', idle_box['x'] > initial_box['x'], report)

        button.hover()
        page.wait_for_function("document.querySelector('[data-testid=hilltop-whatsapp-cta]').dataset.state === 'interaction'")
        page.wait_for_function("getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]')).opacity === '1'")
        hover_opacity = page.evaluate("getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]')).opacity")
        check('hover restores full visibility', hover_opacity == '1', report)

        page.mouse.move(200, 200)
        page.wait_for_function("document.querySelector('[data-testid=hilltop-whatsapp-cta]').dataset.state === 'idle'", timeout=4500)
        page.evaluate("document.querySelector('[data-testid=hilltop-whatsapp-cta]').addEventListener('click', event => event.preventDefault())")
        button.click()
        check('mouse click leaves the target anchor focused', page.evaluate("document.activeElement === document.querySelector('[data-testid=hilltop-whatsapp-cta]')"), report)
        page.mouse.move(200, 200)
        page.wait_for_function("document.querySelector('[data-testid=hilltop-whatsapp-cta]').dataset.state === 'idle'", timeout=4500)
        check('mouse click returns to idle after pointer leaves', state(page) == 'idle', report)

        page.keyboard.press('Tab')
        if not page.evaluate("document.activeElement === document.querySelector('[data-testid=hilltop-whatsapp-cta]')"):
            page.keyboard.press('Shift+Tab')
        page.wait_for_function("getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]')).opacity === '1'")
        focus_style = page.evaluate("""() => {
          const style = getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]'));
          const button = document.querySelector('[data-testid=hilltop-whatsapp-cta]');
          return { opacity: style.opacity, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, focusVisible: button.matches(':focus-visible') };
        }""")
        check('keyboard navigation gives the CTA focus-visible', focus_style['focusVisible'], report)
        check('keyboard focus restores full visibility', focus_style['opacity'] == '1', report)
        check('keyboard focus has visible outline', focus_style['outlineStyle'] != 'none' and focus_style['outlineWidth'] == '3px', report)
        page.wait_for_timeout(3200)
        check('keyboard-focused CTA remains active beyond idle timeout', state(page) == 'interaction', report)

        page.evaluate("window.HilltopWhatsAppCTA.setProperty({title: 'Executive 5-Bedroom House to Rent – Nehru Way, Livingstone', url: 'https://hilltopproperties.co.zm/property-details?ref=HT-100'})")
        property_url = urlparse(button.get_attribute('href'))
        property_message = parse_qs(property_url.query)['text'][0]
        check('property message uses structured title', "I'm interested in Executive 5-Bedroom House to Rent – Nehru Way, Livingstone." in property_message, report)
        check('property message includes page URL', 'https://hilltopproperties.co.zm/property-details?ref=HT-100' in property_message, report)

        button.blur()
        page.mouse.move(200, 200)
        page.wait_for_function("document.querySelector('[data-testid=hilltop-whatsapp-cta]').dataset.state === 'idle'", timeout=4500)
        before_scroll = button.bounding_box()
        page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        page.wait_for_timeout(150)
        after_scroll = button.bounding_box()
        check('CTA remains fixed during scroll', abs(before_scroll['y'] - after_scroll['y']) < 1, report)
        page.screenshot(path=str(OUT / 'desktop-idle.png'))

        page.goto(base + '/about.html', wait_until='domcontentloaded')
        return_button = page.locator('[data-testid="hilltop-whatsapp-cta"]')
        return_button.wait_for(state='visible')
        page.wait_for_timeout(650)
        check('same-session navigation does not replay intro', state(page) != 'intro', report)
        desktop.close()

        viewports = [
            ('mobile-320', 320, 568),
            ('mobile-360', 360, 800),
            ('mobile-375', 375, 812),
            ('mobile-390', 390, 844),
            ('mobile-412', 412, 915),
            ('mobile-430', 430, 932),
            ('tablet-768', 768, 1024),
        ]
        for label, width, height in viewports:
            context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=width < 768)
            mobile_page = context.new_page()
            mobile_page.goto(base + '/services.html', wait_until='domcontentloaded')
            mobile_button = mobile_page.locator('[data-testid="hilltop-whatsapp-cta"]')
            mobile_button.wait_for(state='visible')
            box = mobile_button.bounding_box()
            position = mobile_page.evaluate("""() => {
              const style = getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]'));
              return { position: style.position, right: style.right, bottom: style.bottom };
            }""")
            check(f'{label} CTA remains inside viewport', box['x'] >= 0 and box['y'] >= 0 and box['x'] + box['width'] <= width and box['y'] + box['height'] <= height, report)
            check(f'{label} CTA remains fixed', position['position'] == 'fixed', report)
            if width < 768:
                check(f'{label} touch target is 54px', round(box['width']) == 54 and round(box['height']) == 54, report)
                check(f'{label} uses 16px base right inset', position['right'] == '16px', report)
                check(f'{label} uses 100px base bottom inset', position['bottom'] == '100px', report)
                mobile_page.evaluate("document.querySelector('[data-testid=hilltop-whatsapp-cta]').addEventListener('click', event => event.preventDefault())")
                mobile_button.tap()
                mobile_page.wait_for_function("getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]')).opacity === '1'")
                check(f'{label} touch activation becomes fully opaque', state(mobile_page) == 'interaction', report)
                mobile_page.wait_for_function("document.querySelector('[data-testid=hilltop-whatsapp-cta]').dataset.state === 'idle'", timeout=4500)
                mobile_page.wait_for_function("getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]')).opacity === '0.35'", timeout=1000)
                idle_style = mobile_page.evaluate("""() => {
                  const style = getComputedStyle(document.querySelector('[data-testid=hilltop-whatsapp-cta]'));
                  return { opacity: style.opacity, transform: style.transform };
                }""")
                check(f'{label} touch activation returns to idle', state(mobile_page) == 'idle' and idle_style['opacity'] == '0.35', report)
                check(f'{label} idle state retains a horizontal tuck', idle_style['transform'] != 'none', report)
            else:
                check(f'{label} uses desktop right inset', position['right'] == '24px', report)
                check(f'{label} uses desktop bottom inset', position['bottom'] == '96px', report)
            report['viewports'][label] = {'width': width, 'height': height, 'button': box, 'position': position}
            mobile_page.screenshot(path=str(OUT / f'{label}.png'))
            context.close()

        reduced = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        reduced_page = reduced.new_page()
        reduced_page.goto(base + '/services.html', wait_until='domcontentloaded')
        reduced_button = reduced_page.locator('[data-testid="hilltop-whatsapp-cta"]')
        reduced_button.wait_for(state='visible')
        reduced_page.wait_for_timeout(250)
        reduced_style = reduced_page.evaluate("""() => {
          const button = document.querySelector('[data-testid=hilltop-whatsapp-cta]');
          const style = getComputedStyle(button);
          return { state: button.dataset.state, animationName: style.animationName, transform: style.transform };
        }""")
        check('reduced motion skips intro state', reduced_style['state'] == 'idle', report)
        check('reduced motion disables keyframes', reduced_style['animationName'] == 'none', report)
        check('reduced motion disables sliding', reduced_style['transform'] == 'none', report)
        reduced.close()

        isolation = browser.new_context(viewport={'width': 1280, 'height': 800})
        admin_page = isolation.new_page()
        admin_page.goto(base + '/admin-dashboard.html', wait_until='domcontentloaded')
        check('admin interface has no CTA', admin_page.locator('[data-testid="hilltop-whatsapp-cta"]').count() == 0, report)
        construction_page = isolation.new_page()
        construction_page.goto(base + '/construction/index.html', wait_until='domcontentloaded')
        check('construction public page has CTA', construction_page.locator('[data-testid="hilltop-whatsapp-cta"]').count() == 1, report)

        details_page = isolation.new_page()
        details_page.goto(base + '/property-details.html?ref=TEST-1', wait_until='domcontentloaded')
        details_button = details_page.locator('[data-testid="hilltop-whatsapp-cta"]')
        details_button.wait_for(state='visible')
        details_box = details_button.bounding_box()
        check('desktop property page CTA remains in viewport', details_box['x'] + details_box['width'] <= 1280 and details_box['y'] + details_box['height'] <= 800, report)
        isolation.close()

        mobile_details = browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True)
        mobile_details_page = mobile_details.new_page()
        mobile_details_page.goto(base + '/property-details.html?ref=TEST-1', wait_until='domcontentloaded')
        mobile_details_button = mobile_details_page.locator('[data-testid="hilltop-whatsapp-cta"]')
        mobile_details_button.wait_for(state='visible')
        details_position = mobile_details_page.evaluate("""() => {
          const button = document.querySelector('[data-testid=hilltop-whatsapp-cta]');
          const bar = document.querySelector('.property-enquiry-section');
          const buttonBox = button.getBoundingClientRect();
          const barBox = bar && bar.getBoundingClientRect();
          return {
            bottom: getComputedStyle(button).bottom,
            buttonTop: buttonBox.top,
            buttonBottom: buttonBox.bottom,
            barTop: barBox && barBox.top,
            barBottom: barBox && barBox.bottom,
            clearsEnquiryBar: !barBox || barBox.width === 0 || barBox.height === 0 || buttonBox.bottom <= barBox.top
          };
        }""")
        report['mobilePropertyCollision'] = details_position
        check('mobile property CTA keeps its 118px collision clearance', details_position['bottom'] == '118px', report)
        check('mobile property CTA clears the fixed enquiry bar', details_position['clearsEnquiryBar'], report)
        mobile_details_page.screenshot(path=str(OUT / 'property-details-390.png'))
        mobile_details.close()

        browser.close()
finally:
    server.shutdown()
    server.server_close()

(OUT / 'results.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'status': 'passed', 'checks': len(report['checks']), 'results': str(OUT / 'results.json')}, indent=2))
