"""Run against a local HTTP server: python3 tests/i18n_smoke.py [base_url].
Requires Python Playwright and Chromium (available in the cloud environment).
"""
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000/'
TYPES = 'INTJ INTP ENTJ ENTP INFJ INFP ENFJ ENFP ISTJ ISFJ ESTJ ESFJ ISTP ISFP ESTP ESFP'.split()


def no_korean_copy(page):
    leftovers = page.evaluate('''() => {
      const leftovers = [];
      const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement.closest('script, style, select, noscript, [hidden]') && /[가-힣]/.test(node.data)) leftovers.push(node.data.trim());
      }
      for (const el of document.querySelectorAll('*')) {
        if (el.closest('[hidden]')) continue;
        for (const key of ['alt', 'title', 'placeholder', 'aria-label', 'aria-valuetext', 'content']) {
          if (/[가-힣]/.test(el.getAttribute(key) || '')) leftovers.push(`${key}: ${el.getAttribute(key)}`);
        }
      }
      return leftovers;
    }''')
    assert not leftovers, leftovers


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(reduced_motion='reduce', accept_downloads=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script('''window.cardText=[]; const fillText=CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText=function(text,...rest){window.cardText.push(text);return fillText.call(this,text,...rest)};''')
    assert page.goto(BASE, wait_until='networkidle').status == 200
    assert page.locator('html').get_attribute('lang') == 'ko'
    assert page.locator('.quiz-nav').inner_text() == 'MBTI 테스트'
    page.locator('#nickname').fill('Mochi')
    hero = page.locator('#hero-example-type').inner_text()
    page.locator('#quiz-start').click()
    page.locator('#quiz-option-label-a').click()
    page.locator('#quiz-next').click()
    page.locator('#quiz-option-label-b').click()
    page.locator('#language-select').select_option('en')
    assert page.locator('#quiz-counter').inner_text() == '02 / 32'
    assert page.locator('#quiz-option-b').is_checked()
    assert page.locator('#nickname').input_value() == 'Mochi'
    assert page.locator('#hero-example-type').inner_text() == hero
    assert page.locator('#quiz-question').inner_text().startswith('When choosing')
    no_korean_copy(page)
    page.reload(wait_until='networkidle')
    assert page.locator('html').get_attribute('lang') == 'en'
    page.locator('#quiz-start').click()
    assert page.locator('#quiz-counter').inner_text() == '02 / 32'
    assert page.locator('#quiz-option-b').is_checked()
    page.locator('#quiz-reset').click()

    for language in ['en', 'ja', 'ko']:
        page.locator('#language-select').select_option(language)
        assert page.locator('html').get_attribute('lang') == language
        if page.locator('#quiz-retake').is_visible():
            page.locator('#quiz-retake').click()
        for index in range(32):
            assert page.locator('#quiz-counter').inner_text() == f'{index + 1:02} / 32'
            if language != 'ko':
                assert not re.search('[가-힣]', page.locator('#quiz-question').inner_text())
            page.locator('#quiz-option-label-a').click()
            page.locator('#quiz-next').click()
        assert page.locator('#quiz-complete').is_visible()
        assert page.locator('#result').is_visible()
        for type_ in TYPES:
            page.locator('#mbti').fill(type_)
            page.locator('#create-button').click()
            page.wait_for_function('(type) => document.querySelector("#result-type").textContent === type && !document.querySelector("#create-button").disabled', arg=type_)
            assert page.locator('.story-chapter').count() == 6
            for mode in ['romance', 'friendship', 'work']:
                page.locator(f'#compat-tab-{mode}').click()
                # Covers both identical preferences and all differing preferences.
                for partner in [type_, ''.join({'I':'E','E':'I','S':'N','N':'S','T':'F','F':'T','J':'P','P':'J'}[x] for x in type_)]:
                    page.locator('#compat-partner').select_option(partner)
                    assert page.locator('#compat-intro').inner_text()
                    if language != 'ko':
                        no_korean_copy(page)
        page.locator('#language-select').select_option('ja' if language != 'ja' else 'en')
        assert page.locator('#result-type').inner_text() == 'ESFP'
        assert page.locator('#compat-partner').input_value() == 'INTJ'
        page.locator('#language-select').select_option(language)
        page.locator('#mbti').fill('XXXX')
        page.locator('#create-button').click()
        assert page.locator('#mbti-error').is_visible()
        page.evaluate('window.cardText=[]')
        with page.expect_download() as saved:
            page.locator('#save-button').click()
        download = saved.value
        assert download.failure() is None
        assert 'ESFP' in download.suggested_filename
        assert Path(download.path()).stat().st_size > 10000
        if language != 'ko':
            no_korean_copy(page)
            assert all(not re.search('[가-힣]', text) for text in page.evaluate('window.cardText'))
        print(f'PASS {language}: 32 questions, 16 profiles, all 3 relationship modes, same/opposite partners, card download', flush=True)
        # Start another quiz at question 1.
        page.locator('#quiz-retake').click()

    for language in ['en', 'ja', 'ko']:
        page.locator('#language-select').select_option(language)
        for width in [320, 375, 768, 1280]:
            page.set_viewport_size({'width': width, 'height': 900})
            assert page.locator('#language-select').is_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (language, width)
            if width == 320:
                for card in page.locator('.collection-card').all():
                    card.evaluate('(element) => element.click()')
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (language, width, card.get_attribute('data-type'))
        if language == 'en':
            page.set_viewport_size({'width': 375, 'height': 900})
            page.evaluate('scrollTo(0, 0)')
            page.screenshot(path='/tmp/dororong-language-mobile.png')
    # Switching keeps active errors, notices and collection filters localized.
    page.locator('[data-filter=NT]').click()
    page.locator('#language-select').select_option('en')
    assert page.locator('.collection-card').count() == 4
    no_korean_copy(page)
    # A result link carries the selected language and takes priority over stored preferences.
    page.goto(BASE + '?mbti=INFP&name=Mochi&lang=ja', wait_until='networkidle')
    assert page.locator('html').get_attribute('lang') == 'ja'
    assert page.locator('#result-title').inner_text() == 'Mochi'
    page.locator('#language-select').select_option('en')
    assert page.locator('#result-title').inner_text() == 'Mochi'
    assert parse_qs(urlsplit(page.url).query)['lang'] == ['en']
    assert parse_qs(urlsplit(page.url).query)['mbti'] == ['INFP']
    context.grant_permissions(['clipboard-read', 'clipboard-write'])
    page.locator('#copy-button').click()
    page.wait_for_function('!document.querySelector("#toast").hidden')
    shared = page.evaluate('navigator.clipboard.readText()')
    assert parse_qs(urlsplit(shared).query) == {'lang': ['en'], 'mbti': ['INFP'], 'name': ['Mochi']}
    # Local storage failure must not prevent localization or in-memory quiz progress.
    blocked = browser.new_context(reduced_motion='reduce')
    blocked.add_init_script("Object.defineProperty(Storage.prototype, 'getItem', {value(){throw new Error('blocked')}}); Object.defineProperty(Storage.prototype, 'setItem', {value(){throw new Error('blocked')}});")
    other = blocked.new_page()
    other.on('pageerror', lambda error: errors.append(str(error)))
    other.goto(BASE + '?lang=en', wait_until='networkidle')
    assert other.locator('html').get_attribute('lang') == 'en'
    other.locator('#quiz-start').click()
    other.locator('#quiz-option-label-a').click()
    other.locator('#language-select').select_option('ja')
    assert other.locator('#quiz-option-a').is_checked()
    assert other.locator('html').get_attribute('lang') == 'ja'
    assert not errors, errors
    print('PASS persistence, share links, blocked storage, state preservation, and responsive layouts; no browser exceptions')
    browser.close()
