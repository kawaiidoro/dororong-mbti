# Dororong MBTI

A static personality quiz with Korean, English, and Japanese language selection.

## Run locally

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

No build or package installation is needed. `index.html` contains the application and embedded character images. It loads `translations.js` and `i18n.js` from this directory; deploy all three files together. The older standalone `app.js`, `profiles.js`, and `stories.js` are not loaded by the current page.

## Languages

Use the language selector in the header. Korean is the default; the selection is stored locally. A `lang=ko`, `lang=en`, or `lang=ja` URL parameter overrides the saved preference, and result links carry the selected language. Switching languages keeps quiz answers, the result, nickname, collection filter, relationship mode, and partner in memory.

`translations.js` maps original Korean strings to English and Japanese. Preserve numbered placeholders such as `{0}` when editing translations. `i18n.js` translates static copy and looks up structured content at render time. Application text uses `t('한국어 원문')` or a tagged template, and structured text uses `localize(...)`. Call the registered language-change handlers when adding new stateful output. Keep user-entered nicknames as entered.

## Browser checks

With the local server running and Python Playwright plus Chromium installed:

```sh
python3 tests/i18n_smoke.py
```

The test checks 32 questions in every language, all 16 profiles and three relationship modes, same/opposite partners, PNG downloads, language and quiz persistence, share URLs, unavailable browser storage, and mobile/desktop overflow. It uses `/usr/bin/chromium` in the prepared cloud environment.

## Security checks

The site does not use third-party runtime packages or a backend. Its meta Content Security Policy permits the hashed inline application scripts and same-origin JavaScript, blocks inline event handlers, eval, connections, form submissions, plugins, frames, and base-URL changes, and allows the embedded character images and generated PNG previews. Inline styling is retained for the existing theme and card rendering. Local JavaScript files have integrity hashes. The referrer policy omits the page URL, including result names, from outgoing referrer headers.

After editing `index.html`, `i18n.js`, or `translations.js`, refresh the hashes and run both browser checks:

```sh
python3 scripts/update_security.py
python3 scripts/update_security.py --check
python3 tests/security_smoke.py
python3 tests/i18n_smoke.py
```

The security test verifies browser enforcement, tampered/missing asset recovery, hostile URL input, Unicode names, corrupt local storage, clipboard fallback, and isolated image previews. Missing language assets fall back to a usable Korean site. Names are limited to 12 grapheme clusters where supported, and non-printing/bidi override controls are removed. User input is rendered with text nodes rather than HTML.

The policy is delivered in HTML because this is a GitHub Pages site. Header-only protections such as `frame-ancestors`, HSTS, and `X-Content-Type-Options` are controlled by the hosting platform and are not configured by this repository's meta policy.
