/* Korean source strings are stable translation keys. No network translation is used. */
(() => {
  'use strict';
  const supported = ['ko', 'en', 'ja'];
  const storageKey = 'dororong-language';
  const messages = window.DORORONG_TRANSLATIONS || {};
  const translationsAvailable = Boolean(messages['언어 선택']?.en && messages['언어 선택']?.ja);
  const listeners = new Set();
  let language = 'ko';
  try {
    const requested = new URL(location.href).searchParams.get('lang');
    const saved = localStorage.getItem(storageKey);
    language = supported.includes(requested) ? requested : supported.includes(saved) ? saved : 'ko';
  } catch {
    const requested = new URL(location.href).searchParams.get('lang');
    if (supported.includes(requested)) language = requested;
  }

  if (!translationsAvailable) language = 'ko';

  function t(source, ...values) {
    const key = Array.isArray(source) ? source.reduce((s, part, i) => s + (i ? `{${i - 1}}` : '') + part, '') : source;
    const translated = language === 'ko' ? key : messages[key]?.[language] ?? key;
    return values.length ? translated.replace(/\{(\d+)\}/g, (_, i) => String(values[Number(i)])) : translated;
  }

  // Read translations at render time so existing state can stay in memory.
  const proxies = new WeakMap();
  function localize(value) {
    if (typeof value === 'string') return t(value);
    if (!value || typeof value !== 'object') return value;
    if (!proxies.has(value)) proxies.set(value, new Proxy(value, {
      get(target, key, receiver) { return localize(Reflect.get(target, key, receiver)); },
    }));
    return proxies.get(value);
  }

  // Keep references to original static copy; never translate nickname input or generated content here.
  const textNodes = [];
  const attributes = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return !node.parentElement.closest('script, style, select, noscript') && /[가-힣]/.test(node.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  while (walker.nextNode()) textNodes.push([walker.currentNode, walker.currentNode.data]);
  for (const element of document.querySelectorAll('*')) {
    for (const name of ['alt', 'title', 'placeholder', 'aria-label', 'content']) {
      const source = element.getAttribute(name);
      if (source && /[가-힣]/.test(source)) attributes.push([element, name, source]);
    }
  }
  function applyStaticCopy() {
    document.documentElement.lang = language;
    for (const [node, source] of textNodes) node.data = source.replace(source.trim(), t(source.trim()));
    for (const [element, name, source] of attributes) element.setAttribute(name, t(source));
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', {ko: 'ko_KR', en: 'en_US', ja: 'ja_JP'}[language]);
    const select = document.getElementById('language-select');
    if (select) {
      select.value = language;
      select.disabled = !translationsAvailable;
    }
  }
  function setLanguage(next) {
    if (!translationsAvailable || !supported.includes(next) || next === language) return;
    language = next;
    try { localStorage.setItem(storageKey, language); } catch { /* The URL still keeps the selection. */ }
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url);
    } catch {}
    applyStaticCopy();
    for (const listener of listeners) listener();
  }
  window.dororongI18n = {t, localize, get language() { return language; }, onChange(listener) { listeners.add(listener); }, setLanguage};
  applyStaticCopy();
  document.getElementById('language-select')?.addEventListener('change', event => setLanguage(event.target.value));
})();
