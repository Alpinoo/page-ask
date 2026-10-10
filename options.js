const DEFAULT_MAX_CHARS = 2000000;
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const I18N = window.PageAskI18n;
let t = I18N.make(I18N.detect());

const $ = (id) => document.getElementById(id);
const keyEl = $('key');
const modelEl = $('model');
const maxEl = $('maxChars');
const clearEl = $('clearOnClose');
const infoBarEl = $('showInfoBar');
const langBtn = $('langBtn');
const langList = $('langList');
const statusEl = $('status');
const modelsEl = $('models');

// ---------------------------------------------------------------- dil
const LINKS = {
  keyHint: { studio: { text: () => t('studioLink'), href: 'https://aistudio.google.com/apikey' } },
  modelHint: { limits: { text: () => t('limitsLink'), href: 'https://aistudio.google.com/rate-limit' } }
};

// Çeviri metnindeki {ad} yer tutucularını bağlantıya, `...` bölümlerini <code>'a çevirir.
function renderRich(el, text, links) {
  el.textContent = '';
  const re = /\{(\w+)\}|`([^`]+)`/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) el.append(text.slice(last, m.index));
    if (m[1] && links && links[m[1]]) {
      const a = document.createElement('a');
      a.href = links[m[1]].href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = links[m[1]].text();
      el.append(a);
    } else if (m[2]) {
      const c = document.createElement('code');
      c.textContent = m[2];
      el.append(c);
    } else {
      el.append(m[0]);
    }
    last = re.lastIndex;
  }
  if (last < text.length) el.append(text.slice(last));
}

function applyI18n() {
  document.documentElement.lang = t.lang;
  document.title = t('optTitle');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-rich]').forEach((el) => {
    renderRich(el, t(el.dataset.rich), LINKS[el.dataset.rich]);
  });
  $('toggleKey').textContent = keyEl.type === 'password' ? t('show') : t('hide');
  setLangUi(t.lang);
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}

// ----------------------------------------------- metin modeli filtresi
// Gemini API'si çıktı türünü (metin/görsel/ses) ayrı bir alan olarak vermiyor; bu yüzden
// model adındaki kelimelere ve açıklamaya bakıyoruz.
const NON_TEXT_TOKENS = new Set([
  'image', 'imagen', 'banana', 'tts', 'audio', 'speech', 'live', 'embedding', 'embed',
  'veo', 'video', 'music', 'lyria', 'aqa', 'robotics', 'computer', 'omni'
]);
const NON_TEXT_DESC = /image generation|generates? images?|text-to-speech|speech generation|audio generation|video generation/i;

function hasNonTextToken(id) {
  return String(id).toLowerCase().replace(/^models\//, '').split(/[-_.\s]+/).some((tok) => NON_TEXT_TOKENS.has(tok));
}
// Yeni kullanıcılara kapalı (yalnızca eski kullanıcılara açık) modeller listede gösterilmez.
const LIMITED_ACCESS = /^gemini-2\.5-(flash|flash-lite|pro)$/i;
function isTextModel(m) {
  const id = String(m.name || '').replace(/^models\//, '');
  return (
    (m.supportedGenerationMethods || []).includes('generateContent') &&
    /^gemini/i.test(id) &&
    !LIMITED_ACCESS.test(id) &&
    !hasNonTextToken(id) &&
    !NON_TEXT_DESC.test((m.displayName || '') + ' ' + (m.description || ''))
  );
}

// ---------------------------------------------------------- kaydet/yükle
async function load() {
  const r = await chrome.storage.local.get(['geminiKey', 'model', 'maxChars', 'clearOnClose', 'showInfoBar', 'lang']);
  t = I18N.make(r.lang || I18N.detect());
  keyEl.value = r.geminiKey || '';
  modelEl.value = r.model || '';
  maxEl.value = Number.isFinite(r.maxChars) ? r.maxChars : DEFAULT_MAX_CHARS;
  clearEl.checked = r.clearOnClose === true;
  infoBarEl.checked = r.showInfoBar !== false; // varsayılan: açık
  applyI18n();
  document.body.classList.remove('loading');
}

async function save() {
  const maxChars = maxEl.value.trim() === '' ? DEFAULT_MAX_CHARS : Number(maxEl.value);
  if (!Number.isFinite(maxChars) || maxChars < 0) {
    setStatus(t('maxCharsInvalid'), 'err');
    return;
  }
  const model = modelEl.value.trim();
  if (model && hasNonTextToken(model)) {
    setStatus(t('nonTextModel'), 'err');
    return;
  }
  await chrome.storage.local.set({
    geminiKey: keyEl.value.trim(),
    model, // boş = eklentinin varsayılanı (gemini-3.5-flash-lite)
    maxChars: Math.floor(maxChars),
    clearOnClose: clearEl.checked,
    showInfoBar: infoBarEl.checked
  });
  setStatus(t('saved'), 'ok');
  const saved = t('saved');
  setTimeout(() => { if (statusEl.textContent === saved) setStatus(''); }, 2500);
}

// ------------------------------------------------------- model listesi
// Seçili modeli (alandaki değer; boşsa varsayılan) listede vurgulu tutar.
const DEFAULT_MODEL_ID = 'gemini-3.5-flash-lite';
function markPicked() {
  const cur = modelEl.value.trim().replace(/^models\//, '') || DEFAULT_MODEL_ID;
  modelsEl.querySelectorAll('button').forEach((b) => {
    const on = b.dataset.id === cur;
    b.classList.toggle('picked', on);
    b.setAttribute('aria-pressed', String(on));
  });
}
modelEl.addEventListener('input', markPicked);
const groupOf = (id) => {
  const toks = id.toLowerCase().split(/[-_.\s]+/);
  if (toks.includes('lite')) return 'grpFlashLite';
  if (toks.includes('flash')) return 'grpFlash';
  if (toks.includes('pro')) return 'grpPro';
  return 'grpOther';
};
async function listModels() {
  const key = keyEl.value.trim();
  modelsEl.textContent = '';
  if (!key) {
    setStatus(t('enterKeyFirst'), 'err');
    return;
  }
  setStatus(t('fetchingModels'));
  const all = [];
  let pageToken = '';
  try {
    for (let i = 0; i < 10; i++) {
      const url = `${API_BASE}/models?pageSize=1000` + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
      const res = await fetch(url, { headers: { 'x-goog-api-key': key } });
      if (!res.ok) {
        let msg = '';
        try { msg = (await res.json()).error.message; } catch (_) {}
        setStatus(t('listFailed', { status: res.status, msg }), 'err');
        return;
      }
      const j = await res.json();
      all.push(...(j.models || []));
      pageToken = j.nextPageToken || '';
      if (!pageToken) break;
    }
  } catch (_) {
    setStatus(t('cannotConnect'), 'err');
    return;
  }

  // Yalnızca Flash, Flash-Lite ve Pro ailesi gösterilir; diğer her şey (gemma, learnlm vb.) elenir.
  const usable = all
    .filter(isTextModel)
    .map((m) => ({ id: m.name.replace(/^models\//, ''), limit: m.inputTokenLimit }))
    .filter((m) => groupOf(m.id) !== 'grpOther');

  if (!usable.length) {
    setStatus(t('noModels'), 'err');
    return;
  }
  setStatus(t('modelsFound', { n: usable.length }), 'ok');

  const order = ['grpFlash', 'grpFlashLite', 'grpPro'];
  const groups = Object.fromEntries(order.map((k) => [k, []]));
  usable.forEach((m) => groups[groupOf(m.id)].push(m));

  order.forEach((k) => {
    const list = groups[k].sort((a, b) => b.id.localeCompare(a.id, 'en', { numeric: true }));
    if (!list.length) return;
    const h = document.createElement('div');
    h.className = 'grp';
    h.textContent = t(k);
    modelsEl.append(h);
    list.forEach((m) => {
      const b = document.createElement('button');
      b.type = 'button';
      const name = document.createElement('span');
      name.textContent = m.id;
      b.append(name);
      if (m.limit) {
        const s = document.createElement('small');
        s.textContent = '  ' + t('inputLimit', { n: t.num(m.limit) });
        b.append(s);
      }
      b.dataset.id = m.id;
      b.addEventListener('click', () => {
        modelEl.value = m.id;
        markPicked();
        setStatus(t('modelPicked', { id: m.id }), 'ok');
      });
      modelsEl.append(b);
    });
  });
  markPicked();
}

// ---------------------------------------------------------------- olaylar
$('save').addEventListener('click', save);
$('listModels').addEventListener('click', listModels);
$('toggleKey').addEventListener('click', () => {
  keyEl.type = keyEl.type === 'password' ? 'text' : 'password';
  $('toggleKey').textContent = keyEl.type === 'password' ? t('show') : t('hide');
});

// ---- özel dil açılır listesi
const langOpts = [...langList.querySelectorAll('li')];
let activeIdx = 0;

function setLangUi(lang) {
  langOpts.forEach((li) => li.setAttribute('aria-selected', String(li.dataset.value === lang)));
  const cur = langOpts.find((li) => li.dataset.value === lang) || langOpts[0];
  $('langCur').textContent = cur.textContent;
}
function setActive(i) {
  activeIdx = (i + langOpts.length) % langOpts.length;
  langOpts.forEach((li, n) => li.classList.toggle('active', n === activeIdx));
  langList.setAttribute('aria-activedescendant', langOpts[activeIdx].id);
}
function openLang() {
  langList.hidden = false;
  langBtn.setAttribute('aria-expanded', 'true');
  setActive(Math.max(0, langOpts.findIndex((li) => li.getAttribute('aria-selected') === 'true')));
  langList.focus();
}
function closeLang(refocus) {
  if (langList.hidden) return;
  langList.hidden = true;
  langBtn.setAttribute('aria-expanded', 'false');
  if (refocus) langBtn.focus();
}
// Dil seçimi anında uygulanır ve kaydedilir (panel de bir sonraki açılışta/anında bunu kullanır).
async function chooseLang(value) {
  closeLang(true);
  const lang = value === 'tr' ? 'tr' : 'en';
  if (lang === t.lang) return;
  await chrome.storage.local.set({ lang });
  t = I18N.make(lang);
  modelsEl.textContent = '';
  setStatus('');
  applyI18n();
}
langBtn.addEventListener('click', () => (langList.hidden ? openLang() : closeLang(true)));
langBtn.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openLang(); }
});
langList.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (li) chooseLang(li.dataset.value);
});
langList.addEventListener('mousemove', (e) => {
  const li = e.target.closest('li');
  if (li) setActive(langOpts.indexOf(li));
});
langList.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
  else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
  else if (e.key === 'End') { e.preventDefault(); setActive(langOpts.length - 1); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseLang(langOpts[activeIdx].dataset.value); }
  else if (e.key === 'Escape') { e.preventDefault(); closeLang(true); }
  else if (e.key === 'Tab') closeLang(false);
});
document.addEventListener('mousedown', (e) => {
  if (!$('langDd').contains(e.target)) closeLang(false);
});

$('openShortcuts').addEventListener('click', async () => {
  for (const url of ['vivaldi://extensions/shortcuts', 'chrome://extensions/shortcuts']) {
    try {
      await chrome.tabs.create({ url });
      return;
    } catch (_) { /* sıradakini dene */ }
  }
  setStatus(t('shortcutOpenFail'), 'err');
});
$('copyShortcuts').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('shortcutUrl').value);
    setStatus(t('addressCopied'), 'ok');
  } catch (_) {
    $('shortcutUrl').select();
    setStatus(t('addressSelected'));
  }
});

load();
