"""Browser regressions for CSP, asset integrity, unsafe input, and failure recovery.
Run with a local server: python3 tests/security_smoke.py [base_url].
"""
import base64
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000/'
subprocess.run([sys.executable, str(ROOT / 'scripts/update_security.py'), '--check'], check=True)
PIXEL = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=')

def wait_for_condition(page, expression):
    # Evaluate the observation through DevTools directly. wait_for_function internally
    # uses page eval, which this test intentionally proves the policy disallows.
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if page.evaluate(expression):
            return
        page.wait_for_timeout(50)
    raise AssertionError(f'Condition not observed: {expression}')


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(reduced_motion='reduce', accept_downloads=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script('''window.violations = [];
      document.addEventListener('securitypolicyviolation', event => window.violations.push(event.effectiveDirective));''')
    page.goto(BASE + '?lang=en&mbti=INFP&name=PrivateName', wait_until='networkidle')
    assert page.locator('.collection-card').count() == 16
    assert page.evaluate('window.violations') == []

    # This would execute if the inline-script policy were removed.
    page.evaluate('''() => {
      const script = document.createElement('script');
      script.textContent = 'window.injectedScriptRan = true';
      document.body.append(script);
    }''')
    assert page.evaluate('window.injectedScriptRan === undefined')
    wait_for_condition(page, "window.violations.includes('script-src-elem')")
    # Run eval from a normal allowed page script, not DevTools evaluation (which bypasses CSP eval checks).
    page.route('**/security-eval-probe.js', lambda route: route.fulfill(status=200, content_type='application/javascript', body="try { (0, eval)('window.evaluatedScriptRan=true'); window.evalBlocked=false; } catch(error) { window.evalBlocked=error instanceof EvalError; }"))
    page.evaluate("document.body.append(Object.assign(document.createElement('script'), {src:'./security-eval-probe.js'}))")
    wait_for_condition(page, "typeof window.evalBlocked === 'boolean'")
    assert page.evaluate('window.evalBlocked')
    assert page.evaluate('window.evaluatedScriptRan === undefined')

    requests = []
    page.route('**/security-collector', lambda route: (requests.append(route.request.url), route.fulfill(status=200, body='unexpected')))
    assert page.evaluate("fetch('./security-collector').then(() => false, () => true)")
    wait_for_condition(page, "window.violations.includes('connect-src')")
    assert not requests
    original_url = page.url
    page.evaluate('''() => {
      const form = document.createElement('form'); form.action = './security-collector';
      document.body.append(form); form.submit();
    }''')
    wait_for_condition(page, "window.violations.includes('form-action')")
    assert page.url == original_url and not requests
    page.evaluate("document.head.append(Object.assign(document.createElement('base'), {href:'https://example.invalid/'}))")
    wait_for_condition(page, "window.violations.includes('base-uri')")
    assert page.evaluate('document.baseURI') == original_url

    referrers = []
    def image_response(route):
        referrers.append(route.request.headers.get('referer'))
        route.fulfill(status=200, content_type='image/png', body=PIXEL)
    page.route('**/security-referrer-probe.png', image_response)
    assert page.evaluate('''() => new Promise(resolve => {
      const image = new Image(); image.onload = () => resolve(true); image.onerror = () => resolve(false);
      image.src = './security-referrer-probe.png'; document.body.append(image);
    })''')
    assert referrers == [None], referrers
    print('PASS: inline scripts, eval, fetch, form submission, and base URL injection blocked; referrer omitted', flush=True)

    # The original page structure must not interpret user-controlled names as HTML.
    malicious = '\"><svg/onload=window.nameInjected=true>'
    page.goto(BASE + '?' + urlencode({'lang':'en', 'mbti':'INFP', 'name':malicious}), wait_until='networkidle')
    assert page.locator('#result-title').inner_text() == malicious[:12]
    assert page.locator('#result-title *').count() == 0
    assert page.evaluate('window.nameInjected === undefined')
    for invalid_type in ['__proto__', 'constructor', '<script>', 'INFP<script>']:
        page.goto(BASE + '?' + urlencode({'lang':'__proto__', 'mbti':invalid_type}), wait_until='networkidle')
        assert page.locator('#result').is_hidden()
        assert page.locator('.collection-card').count() == 16

    emoji_name = 'a' * 11 + '😀'
    page.goto(BASE + '?' + urlencode({'mbti':'INFP', 'name':emoji_name}), wait_until='networkidle')
    assert page.locator('#result-title').inner_text() == emoji_name
    page.locator('#nickname').fill('😀' * 13)
    assert page.locator('#nickname').input_value() == '😀' * 12
    page.locator('#nickname').fill('e\u0301' * 13)
    assert page.locator('#nickname').input_value() == 'é' * 12
    page.goto(BASE + '?' + urlencode({'mbti':'INFP', 'name':'A\u202eB\x00C'}), wait_until='networkidle')
    assert page.locator('#result-title').inner_text() == 'ABC'
    print('PASS: hostile URL values stay text; invalid types are ignored; Unicode names remain intact and controls are removed', flush=True)

    # A bad browser draft must not crash startup or become executable content.
    bad = browser.new_context(reduced_motion='reduce')
    bad.add_init_script('''localStorage.setItem('dororong-quiz-draft-v1', '{"answers":"not-an-array","index":999999}');
      localStorage.setItem('dororong-language', '__proto__'); localStorage.setItem('dororong-theme', 'not-a-theme');''')
    broken_draft = bad.new_page()
    broken_draft.on('pageerror', lambda error: errors.append(str(error)))
    broken_draft.goto(BASE, wait_until='networkidle')
    broken_draft.locator('#quiz-start').click()
    assert broken_draft.locator('#quiz-counter').inner_text() == '01 / 32'

    for asset in ['translations.js', 'i18n.js']:
        for failure in ['missing', 'tampered']:
            isolated = browser.new_context(reduced_motion='reduce')
            def fail(route, failure=failure):
                if failure == 'missing': route.abort()
                else: route.fulfill(status=200, content_type='application/javascript', body='window.tamperedAssetRan=true;')
            isolated.route('**/' + asset + '*', fail)
            fallback = isolated.new_page()
            fallback.on('pageerror', lambda error: errors.append(str(error)))
            fallback.goto(BASE + '?lang=ja', wait_until='networkidle')
            assert fallback.evaluate('window.tamperedAssetRan === undefined')
            assert fallback.locator('html').get_attribute('lang') == 'ko'
            assert fallback.locator('#language-select').is_disabled()
            assert fallback.locator('.collection-card').count() == 16
            fallback.locator('.collection-card[data-type=INFP]').click()
            assert fallback.locator('#result-type').inner_text() == 'INFP'
            fallback.locator('#quiz-start').click()
            fallback.locator('#quiz-option-label-a').click()
            assert fallback.locator('#quiz-option-a').is_checked()
            isolated.close()
    print('PASS: missing/tampered translation assets cannot execute and the Korean quiz remains usable; corrupt storage is ignored', flush=True)

    # Exercise the clipboard manual fallback and safe image preview.
    page.goto(BASE + '?mbti=INFP&lang=en', wait_until='networkidle')
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {value:{writeText:async()=>{throw new Error('unavailable')}}}); document.execCommand=()=>false;")
    dialogs = []
    def dialog_handler(dialog):
        dialogs.append(dialog.default_value); dialog.dismiss()
    page.on('dialog', dialog_handler)
    page.locator('#copy-button').click()
    assert dialogs and 'mbti=INFP' in dialogs[0] and 'lang=en' in dialogs[0]
    with page.expect_download() as download:
        page.locator('#save-button').click()
    assert download.value.failure() is None
    with page.expect_popup() as preview:
        page.locator('#save-preview-button').click()
    popup = preview.value
    popup.wait_for_load_state()
    assert popup.url.startswith('blob:')
    assert popup.evaluate('window.opener === null')
    assert not errors, errors
    print('PASS: manual clipboard fallback and isolated image preview work; no uncaught application errors')
    browser.close()
