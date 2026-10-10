import { PROFILES, TYPES, FAMILIES, parseMbti, familyOf, imagePath, makeResultUrl } from './profiles.js?v=4';
import { MBTI_PREFERENCES } from './stories.js?v=3';

const $ = id => document.getElementById(id);
const form = $('creator');
const mbti = $('mbti');
const nickname = $('nickname');
const createButton = $('create-button');
const heroStart = $('hero-start');
const axisButtons = [...document.querySelectorAll('[data-axis]')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const positions = ['IE', 'NS', 'FT', 'PJ'];
const selectedLetters = ['', '', '', ''];
const galleryOrder = ['INFP','ENFP','INFJ','ENFJ','INTJ','INTP','ENTJ','ENTP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
let currentResult = null;
let generationTimer;
let toastTimer;
let downloadUrl;
let imageRequest = 0;

heroStart.addEventListener('click', event => {
  event.preventDefault();
  mbti.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  mbti.focus({ preventScroll: true });
});

function notify(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3600);
}

function syncInput() {
  const raw = mbti.value.trim().toUpperCase().replace(/\s+/g, '');
  positions.forEach((allowed, index) => { selectedLetters[index] = allowed.includes(raw[index]) ? raw[index] : ''; });
  axisButtons.forEach(button => { button.setAttribute('aria-pressed', String(selectedLetters[Number(button.dataset.axis)] === button.dataset.letter)); });
  const type = parseMbti(raw);
  $('input-check').textContent = type ? '✓' : '✦';
  $('mbti-error').hidden = true;
  $('mbti-shell').classList.remove('invalid');
  mbti.setAttribute('aria-invalid', 'false');
  return type;
}

mbti.addEventListener('input', () => {
  const start = mbti.selectionStart;
  const end = mbti.selectionEnd;
  mbti.value = mbti.value.toUpperCase();
  if (start !== null) mbti.setSelectionRange(start, end);
  syncInput();
});

axisButtons.forEach(button => button.addEventListener('click', () => {
  selectedLetters[Number(button.dataset.axis)] = button.dataset.letter;
  mbti.value = selectedLetters.map(letter => letter || '_').join('');
  syncInput();
}));

function setBusy(busy) {
  createButton.disabled = busy;
  createButton.setAttribute('aria-busy', String(busy));
  createButton.querySelector('span').textContent = busy ? '도로롱이 오는 중…' : '내 도로롱 만나기';
}

function meet(type, { scroll = true, immediate = false, preserveUrl = false } = {}) {
  clearTimeout(generationTimer);
  mbti.value = type;
  syncInput();
  const name = nickname.value.trim().slice(0, 12);
  if (immediate) {
    setBusy(false);
    renderResult(type, name, { scroll, preserveUrl });
  } else {
    setBusy(true);
    generationTimer = setTimeout(() => {
      renderResult(type, name, { scroll, preserveUrl });
      setBusy(false);
    }, 450);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const type = parseMbti(mbti.value);
  if (!type) {
    $('mbti-error').textContent = 'MBTI 네 글자를 확인해 줘. 예: INFP, ESTJ';
    $('mbti-error').hidden = false;
    $('mbti-shell').classList.add('invalid');
    mbti.setAttribute('aria-invalid', 'true');
    mbti.focus();
    return;
  }
  meet(type);
});

$('random-button').addEventListener('click', () => {
  const values = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(values);
  else values[0] = Math.floor(Math.random() * 4294967296);
  meet(TYPES[values[0] % TYPES.length]);
});

function renderResult(type, name, { scroll = true, preserveUrl = false } = {}) {
  currentResult = { type, name };
  const profile = PROFILES[type];
  const family = FAMILIES[familyOf(type)];
  $('result-type').textContent = type;
  $('card-number').textContent = `NO. ${String(TYPES.indexOf(type) + 1).padStart(2, '0')} / 16`;
  $('result-image').src = imagePath(type);
  $('result-image').alt = `${type} ${profile.title}. ${profile.item}`;
  $('result-title').textContent = name || profile.title;
  $('result-subtitle').textContent = name ? `${type} · ${profile.title}` : profile.subtitle;
  $('result-quote').textContent = `“${profile.quote}”`;
  $('result-family').textContent = family.name;
  $('result-family').style.background = family.color;
  $('result-family').style.color = family.ink;
  $('character-card').style.setProperty('--card-bg', family.color);
  $('result').style.setProperty('--story-accent', family.ink);
  $('result').style.setProperty('--story-tint', family.color);
  $('result-description').textContent = profile.description;
  $('result-charge').textContent = profile.charge;
  $('result-tags').replaceChildren(...profile.tags.map(tag => {
    const node = document.createElement('span');
    node.textContent = `#${tag}`;
    return node;
  }));
  $('result-traits').replaceChildren(...profile.traits.map(([title, text], index) => {
    const container = document.createElement('div');
    container.className = 'trait';
    const number = document.createElement('span');
    number.className = 'trait-index';
    number.textContent = String(index + 1).padStart(2, '0');
    const content = document.createElement('div');
    const heading = document.createElement('h4');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    content.append(heading, paragraph);
    container.append(number, content);
    return container;
  }));
  $('guide-type').textContent = `${type} 도로롱의 작은 세계`;
  $('result-preferences').replaceChildren(...[...type].map(letter => {
    const [title, text] = MBTI_PREFERENCES[letter];
    const item = document.createElement('div');
    item.className = 'preference-note';
    const badge = document.createElement('span');
    badge.className = 'preference-letter';
    badge.textContent = letter;
    const heading = document.createElement('h4');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    item.append(badge, heading, paragraph);
    return item;
  }));
  $('result-chapters').replaceChildren(...profile.chapters.map(([title, paragraphs], index) => {
    const article = document.createElement('article');
    article.className = 'story-chapter';
    const number = document.createElement('span');
    number.className = 'chapter-number';
    number.textContent = `NOTE ${String(index + 1).padStart(2, '0')}`;
    const heading = document.createElement('h4');
    heading.textContent = title;
    article.append(number, heading);
    paragraphs.forEach(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      article.append(paragraph);
    });
    return article;
  }));
  $('result-source-type').href = `https://www.mbtionline.com/mbti-types/${type.toLowerCase()}`;
  $('result-source-type').textContent = `MBTIonline · ${type} 성향`;
  $('save-fallback').hidden = true;
  $('result').hidden = false;
  document.title = `${name || profile.title} · ${type} · 나의 도로롱`;
  if (!preserveUrl) {
    try { history.replaceState(null, '', makeResultUrl(location.href, type, name)); } catch { /* Cards still work if history is restricted. */ }
  }
  imageRequest++;
  const requestId = imageRequest;
  const image = new Image();
  image.src = imagePath(type);
  image.onerror = () => { if (requestId === imageRequest) notify('이미지를 불러오지 못했어. 잠시 후 다시 시도해 줘.'); };
  if (scroll) {
    $('result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    $('result-heading').focus({ preventScroll: true });
  }
}

function renderGallery(filter = 'all') {
  const types = galleryOrder.filter(type => filter === 'all' || familyOf(type) === filter);
  const nodes = types.map(type => {
    const profile = PROFILES[type];
    const family = FAMILIES[familyOf(type)];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'collection-card';
    card.dataset.type = type;
    card.setAttribute('aria-label', `${type} ${profile.title} 만나기`);
    card.style.setProperty('--type-bg', family.color);
    card.style.setProperty('--type-ink', family.ink);
    const stage = document.createElement('div');
    stage.className = 'collection-image';
    const label = document.createElement('span');
    label.className = 'collection-type';
    label.textContent = type;
    const arrow = document.createElement('span');
    arrow.className = 'mini-arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = imagePath(type);
    image.alt = `${profile.title}: ${profile.item}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 1024;
    image.height = 1024;
    stage.append(label, arrow, image);
    const text = document.createElement('div');
    text.className = 'collection-card-content';
    const title = document.createElement('h3');
    title.textContent = profile.title;
    const subtitle = document.createElement('p');
    subtitle.textContent = profile.subtitle;
    text.append(title, subtitle);
    card.append(stage, text);
    card.addEventListener('click', () => meet(type, { immediate: true }));
    return card;
  });
  $('collection-grid').replaceChildren(...nodes);
}

filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(other => {
    const active = other === button;
    other.classList.toggle('active', active);
    other.setAttribute('aria-pressed', String(active));
  });
  renderGallery(button.dataset.filter);
}));

$('again-button').addEventListener('click', () => {
  mbti.scrollIntoView({ behavior: 'smooth', block: 'center' });
  mbti.focus({ preventScroll: true });
  mbti.select();
});

$('copy-button').addEventListener('click', async () => {
  if (!currentResult) return;
  const url = makeResultUrl(location.href, currentResult.type, currentResult.name);
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(url);
    notify('도로롱 결과 링크를 복사했어!');
  } catch {
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Show a manual option below. */ }
    field.remove();
    if (copied) notify('도로롱 결과 링크를 복사했어!');
    else window.prompt('이 링크를 복사하면 같은 도로롱을 다시 만날 수 있어.', url);
  }
});

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  for (const char of [...text]) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = char;
      y += lineHeight;
    } else line = next;
  }
  if (line) ctx.fillText(line.trim(), x, y);
  return y;
}

export async function createCardBlob({ type, name }) {
  if (document.fonts?.ready) await document.fonts.ready;
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imagePath(type);
  });
  if (image.decode) await image.decode();
  const profile = PROFILES[type];
  const family = FAMILIES[familyOf(type)];
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  const font = '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#f8f7f2';
  ctx.fillRect(0, 0, 1080, 1400);
  roundRect(ctx, 42, 42, 996, 1316, 40);
  ctx.fillStyle = family.color;
  ctx.fill();
  ctx.fillStyle = '#35313d';
  ctx.font = `800 68px ${font}`;
  ctx.fillText(type, 98, 143);
  ctx.font = `500 22px ${font}`;
  ctx.fillStyle = '#746879';
  ctx.textAlign = 'right';
  ctx.fillText(`NO. ${String(TYPES.indexOf(type) + 1).padStart(2, '0')} / 16`, 981, 135);
  ctx.drawImage(image, 140, 170, 800, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6e6278';
  ctx.font = `500 25px ${font}`;
  ctx.fillText(name ? `${type} · ${profile.title}` : profile.subtitle, 540, 983);
  const title = name || profile.title;
  let titleSize = 62;
  ctx.font = `800 ${titleSize}px ${font}`;
  while (ctx.measureText(title).width > 865 && titleSize > 32) {
    titleSize -= 2;
    ctx.font = `800 ${titleSize}px ${font}`;
  }
  ctx.fillStyle = '#35313d';
  ctx.fillText(title, 540, 1065);
  ctx.fillStyle = '#6e6278';
  ctx.font = `500 28px ${font}`;
  drawWrappedText(ctx, `“${profile.quote}”`, 540, 1122, 860, 40);
  ctx.font = `500 22px ${font}`;
  ctx.fillText(profile.tags.map(tag => `#${tag}`).join('   '), 540, 1221);
  ctx.strokeStyle = '#35313d30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(98, 1265);
  ctx.lineTo(981, 1265);
  ctx.stroke();
  ctx.font = `600 21px ${font}`;
  ctx.textAlign = 'left';
  ctx.fillText('DORORONG CLUB', 98, 1310);
  ctx.textAlign = 'right';
  ctx.fillText('나답게, 도로롱 ✳', 981, 1310);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('image encoding failed')), 'image/png'));
}

$('save-button').addEventListener('click', async () => {
  if (!currentResult) return;
  const button = $('save-button');
  const snapshot = { ...currentResult };
  button.disabled = true;
  button.querySelector('span').textContent = '카드를 그리는 중…';
  try {
    const blob = await createCardBlob(snapshot);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(blob);
    const link = $('save-fallback-link');
    link.href = downloadUrl;
    link.download = `도로롱_${snapshot.type}_카드.png`;
    $('save-fallback').hidden = false;
    link.click();
    notify('도로롱 카드 준비 완료! 다운로드를 확인해 줘.');
  } catch {
    notify('카드를 저장하지 못했어. 잠시 후 다시 시도해 줘.');
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = '내 도로롱 카드 저장';
  }
});

$('save-preview-button').addEventListener('click', () => {
  if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener');
});

renderGallery();
syncInput();
const params = new URLSearchParams(location.search);
const initialType = parseMbti(params.get('mbti'));
if (initialType) {
  nickname.value = (params.get('name') || '').slice(0, 12);
  meet(initialType, { immediate: true, scroll: false, preserveUrl: true });
  requestAnimationFrame(() => $('result').scrollIntoView({ block: 'start' }));
}
