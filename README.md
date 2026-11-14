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
