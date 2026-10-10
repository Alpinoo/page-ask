// Page Ask - sayfaya enjekte edilen panel (Shadow DOM içinde, sayfanın CSS'inden bağımsız).
// Sohbet geçmişi yalnızca bu betiğin belleğinde tutulur: sayfa yenilenince / sekme kapanınca silinir.
(() => {
  'use strict';

  // Aynı sayfada eski bir kopya (ör. eklenti yeniden yüklenmiş) varsa kendini kapatsın.
  document.dispatchEvent(new CustomEvent('page-ask-destroy'));

  const md = window.__pageAskMd || ((s) =>
    '<p>' + String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</p>');

  // ------------------------------------------------------------------- dil
  const I18N = window.PageAskI18n;
  let t = I18N.make(I18N.detect());

  // ---------------------------------------------------------------- ayarlar
  const settings = { pinned: true, clearOnClose: false, showInfoBar: true, maxChars: 2000000 };
  let savedPos = null;

  async function loadSettings() {
    try {
      const r = await chrome.storage.local.get(['pinned', 'clearOnClose', 'showInfoBar', 'maxChars', 'panelPos', 'lang']);
      setLang(r.lang || I18N.detect());
      settings.pinned = r.pinned !== false; // varsayılan: sabit
      settings.clearOnClose = r.clearOnClose === true;
      settings.showInfoBar = r.showInfoBar !== false;
      updateCtx();
      settings.maxChars = Number.isFinite(r.maxChars) && r.maxChars >= 0 ? r.maxChars : 2000000;
      savedPos = r.panelPos && Number.isFinite(r.panelPos.left) ? r.panelPos : null;
    } catch (_) { /* bağlam geçersiz olmuş olabilir */ }
  }

  const onStorageChanged = (changes, area) => {
    if (area !== 'local') return;
    if (changes.pinned) { settings.pinned = changes.pinned.newValue !== false; updatePinUI(); }
    if (changes.clearOnClose) settings.clearOnClose = changes.clearOnClose.newValue === true;
    if (changes.showInfoBar) { settings.showInfoBar = changes.showInfoBar.newValue !== false; updateCtx(); }
    if (changes.maxChars && Number.isFinite(changes.maxChars.newValue)) settings.maxChars = changes.maxChars.newValue;
    if (changes.lang) setLang(changes.lang.newValue || I18N.detect());
  };
  try { chrome.storage.onChanged.addListener(onStorageChanged); } catch (_) {}

  // ------------------------------------------------------------------ durum
  let isOpen = false;
  let busy = false;
  let port = null;
  let history = [];   // tamamlanmış turlar: { role: 'user'|'model', text, selection? }
  let snapshot = null; // sohbetin başında alınan sayfa metni
  let lastSel = '';   // sayfada en son seçilen metin
  let usageNote = '';  // son isteğin token bilgisi (çevrilmiş metin)
  let usageTokens = 0;

  // -------------------------------------------------------------------- DOM
  const ICON = {
    pin: '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>',
    close: '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    renew: '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    send: '<svg viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" stroke="none"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l2.1 5.9 5.9 2.1-5.9 2.1L12 18.5l-2.1-5.9L4 10.5l5.9-2.1z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" opacity=".8"/></svg>'
  };

  const CSS = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }
    .panel {
      --bg: #ffffff; --bg2: #f2f4f9; --fg: #1a1f2b; --muted: #667085; --line: #e2e6ee;
      --accent: #4a64f0; --accent2: #8a5cf5; --code: #e9edf6;
      --err-bg: #fdecea; --err-fg: #8a1c14; --shadow: 0 20px 56px rgba(16,24,40,.24), 0 2px 8px rgba(16,24,40,.12);
      position: fixed; top: 12px; right: 16px;
      width: min(400px, calc(100vw - 24px)); height: min(600px, calc(100vh - 24px));
      display: flex; flex-direction: column; overflow: hidden;
      background: var(--bg); color: var(--fg);
      border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow);
      font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      letter-spacing: 0; text-align: left;
      transform-origin: top right;
      opacity: 0; transform: translateY(-10px) scale(.96); visibility: hidden; pointer-events: none;
      transition: opacity .16s ease, transform .16s ease, visibility 0s linear .16s;
    }
    .panel[data-state="open"] {
      opacity: 1; transform: none; visibility: visible; pointer-events: auto;
      transition: opacity .2s ease, transform .28s cubic-bezier(.2,.9,.25,1.08), visibility 0s;
    }
    @media (prefers-color-scheme: dark) {
      .panel {
        --bg: #1b1e27; --bg2: #252936; --fg: #e8eaf1; --muted: #98a1b5; --line: #323849;
        --accent: #7e92ff; --accent2: #a98bff; --code: #151821;
        --err-bg: #3b1d1b; --err-fg: #ffb4ab; --shadow: 0 20px 56px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.4);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel, .panel[data-state="open"] { transition: opacity .01s linear, visibility 0s; transform: none; }
    }

    header {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 9px 8px 9px 14px; border-bottom: 1px solid var(--line);
      cursor: grab; user-select: none; -webkit-user-select: none; touch-action: none;
    }
    header:active { cursor: grabbing; }
    .title { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 14px; }
    .logo {
      width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; color: #fff;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
    }
    .logo svg { width: 14px; height: 14px; }
    .actions { display: flex; gap: 2px; }
    .ib {
      width: 30px; height: 30px; border: 0; border-radius: 9px; background: transparent; color: var(--muted);
      display: grid; place-items: center; cursor: pointer; padding: 0;
    }
    .ib svg { width: 17px; height: 17px; fill: none; stroke: currentColor; }
    .ib:hover { background: var(--bg2); color: var(--fg); }
    .ib:focus-visible, button:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
    .ib[aria-pressed="true"] { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
    .ib[aria-pressed="true"] svg { fill: currentColor; fill-opacity: .28; }

    .ctx {
      display: flex; gap: 8px; padding: 6px 14px; background: var(--bg2); color: var(--muted);
      font-size: 11.5px; border-bottom: 1px solid var(--line);
    }
    .ctx .t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ctx .s { white-space: nowrap; }
    .ctx[hidden] { display: none; }
    .ctx.warn { color: #b45309; }
    @media (prefers-color-scheme: dark) { .ctx.warn { color: #fbbf24; } }

    .msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
    .u {
      align-self: flex-end; max-width: 88%; padding: 8px 12px; border-radius: 14px 14px 4px 14px;
      background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff;
      white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .u .q {
      font-size: 12px; opacity: .92; border-left: 2px solid rgba(255,255,255,.65); padding-left: 8px; margin-bottom: 6px;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .m { position: relative; align-self: flex-start; max-width: 100%; background: var(--bg2); padding: 10px 12px 8px; border-radius: 14px 14px 14px 4px; overflow-wrap: anywhere; }
    .m .body > :first-child { margin-top: 0; }
    .m .body > :last-child { margin-bottom: 0; }
    .m p { margin: 0 0 .6em; }
    .m h3, .m h4, .m h5, .m h6 { margin: .8em 0 .35em; line-height: 1.3; }
    .m h3 { font-size: 1.12em; } .m h4 { font-size: 1.05em; } .m h5, .m h6 { font-size: 1em; }
    .m ul, .m ol { margin: 0 0 .6em; padding-left: 1.3em; }
    .m li { margin: .15em 0; }
    .m a { color: var(--accent); }
    .m code { background: var(--code); padding: 1px 5px; border-radius: 5px; font: 12.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .m pre { background: var(--code); padding: 10px 12px; border-radius: 9px; overflow-x: auto; margin: 0 0 .6em; }
    .m pre code { background: none; padding: 0; font-size: 12px; white-space: pre; }
    .m blockquote { margin: 0 0 .6em; padding-left: 10px; border-left: 3px solid var(--line); color: var(--muted); }
    .m hr { border: 0; border-top: 1px solid var(--line); margin: .8em 0; }
    .m .tbl { overflow-x: auto; margin: 0 0 .6em; }
    .m table { border-collapse: collapse; font-size: 12.5px; }
    .m th, .m td { border: 1px solid var(--line); padding: 4px 8px; text-align: left; }
    .m th { background: var(--code); }
    .m .row { display: flex; justify-content: flex-end; margin-top: 4px; min-height: 18px; }
    .m .cp { border: 0; background: transparent; color: var(--muted); font: inherit; font-size: 11.5px; cursor: pointer; padding: 1px 4px; border-radius: 6px; opacity: 0; transition: opacity .15s; }
    .m:hover .cp, .m .cp:focus-visible { opacity: 1; }
    .m .cp:hover { color: var(--fg); background: var(--code); }
    .dots { display: inline-flex; gap: 4px; padding: 4px 0; }
    .dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: blink 1.1s infinite ease-in-out; }
    .dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
    @keyframes blink { 0%, 80%, 100% { opacity: .25; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
    .err { align-self: stretch; background: var(--err-bg); color: var(--err-fg); padding: 9px 12px; border-radius: 12px; font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
    .err button { margin-top: 8px; display: block; border: 1px solid currentColor; background: transparent; color: inherit; font: inherit; font-size: 12.5px; padding: 4px 10px; border-radius: 8px; cursor: pointer; }
    .note { align-self: center; text-align: center; color: var(--muted); font-size: 12px; padding: 2px 8px; }

    .empty { margin: auto; text-align: center; color: var(--muted); padding: 8px 6px; }
    .empty .logo { width: 40px; height: 40px; border-radius: 13px; margin: 0 auto 10px; }
    .empty .logo svg { width: 22px; height: 22px; }
    .empty h2 { margin: 0 0 4px; font-size: 15px; color: var(--fg); font-weight: 600; }
    .empty p { margin: 0 0 12px; font-size: 12.5px; }
    .chips { display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .chip { border: 1px solid var(--line); background: var(--bg); color: var(--fg); font: inherit; font-size: 12.5px; padding: 6px 12px; border-radius: 999px; cursor: pointer; }
    .chip:hover { border-color: var(--accent); color: var(--accent); }

    .sel { display: flex; align-items: center; gap: 8px; padding: 6px 10px 6px 14px; border-top: 1px solid var(--line); background: var(--bg2); font-size: 12px; color: var(--muted); }
    .sel[hidden] { display: none; }
    .sel span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sel .ib { width: 22px; height: 22px; border-radius: 7px; }
    .sel .ib svg { width: 13px; height: 13px; }

    .composer { display: flex; align-items: flex-end; gap: 8px; padding: 10px; border-top: 1px solid var(--line); }
    textarea {
      flex: 1; resize: none; max-height: 120px; min-height: 38px; padding: 8px 12px; border: 1px solid var(--line);
      border-radius: 12px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.45; outline: none;
    }
    textarea::placeholder { color: var(--muted); }
    textarea:focus { border-color: var(--accent); }
    .send {
      width: 38px; height: 38px; flex: none; border: 0; border-radius: 12px; cursor: pointer; display: grid; place-items: center;
      color: #fff; background: linear-gradient(135deg, var(--accent), var(--accent2)); padding: 0;
    }
    .send svg { width: 18px; height: 18px; fill: none; stroke: currentColor; }
    .send:disabled { opacity: .4; cursor: default; }
  `;

  const host = document.createElement('div');
  host.id = 'page-ask-host';
  host.style.cssText =
    'all: initial !important; position: fixed !important; top: 0 !important; left: 0 !important; ' +
    'width: 0 !important; height: 0 !important; z-index: 2147483647 !important;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>${CSS}</style>
    <div class="panel" data-state="closed" role="dialog">
      <header>
        <div class="title"><span class="logo">${ICON.spark}</span><span id="ttl"></span></div>
        <div class="actions">
          <button class="ib" id="renew">${ICON.renew}</button>
          <button class="ib" id="settings">${ICON.gear}</button>
          <button class="ib" id="pin" aria-pressed="true">${ICON.pin}</button>
          <button class="ib" id="close">${ICON.close}</button>
        </div>
      </header>
      <div class="ctx" id="ctx"><span class="t"></span><span class="s"></span></div>
      <div class="msgs" id="msgs"></div>
      <div class="sel" id="sel" hidden><span></span><button class="ib" id="selx">${ICON.close}</button></div>
      <div class="composer">
        <textarea id="input" rows="1"></textarea>
        <button class="send" id="send" disabled>${ICON.send}</button>
      </div>
    </div>`;

  const $ = (id) => shadow.getElementById(id);
  const panel = shadow.querySelector('.panel');
  const header = shadow.querySelector('header');
  const msgs = $('msgs');
  const input = $('input');
  const sendBtn = $('send');
  const pinBtn = $('pin');
  const ctxEl = $('ctx');
  const selEl = $('sel');

  // ------------------------------------------------------------- yardımcılar
  const fmt = (n) => t.num(n);
  const approxTokens = (chars) => {
    const n = Math.round(chars / 3.5);
    if (n < 1000) return String(n);
    return t('tokensK', { n: (n / 1000).toLocaleString(t.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
  };
  const normUrl = (u) => String(u).split('#')[0];

  function captureSnapshot() {
    let text = '';
    try { text = (document.body && document.body.innerText) || ''; } catch (_) {}
    text = text.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const chars = text.length;
    let truncated = false;
    if (settings.maxChars > 0 && text.length > settings.maxChars) {
      text = text.slice(0, settings.maxChars);
      truncated = true;
    }
    return { url: location.href, title: document.title || location.hostname, text, chars, sent: text.length, truncated };
  }

  function updateCtx() {
    const titleEl = ctxEl.querySelector('.t');
    const statEl = ctxEl.querySelector('.s');
    ctxEl.classList.remove('warn');
    if (!snapshot) { titleEl.textContent = ''; statEl.textContent = ''; ctxEl.hidden = !settings.showInfoBar; return; }
    titleEl.textContent = snapshot.title;
    if (snapshot.chars === 0) {
      statEl.textContent = t('ctxUnreadable');
      ctxEl.classList.add('warn');
    } else if (snapshot.truncated) {
      statEl.textContent = t('ctxTruncated', { sent: fmt(snapshot.sent), chars: fmt(snapshot.chars) });
      ctxEl.classList.add('warn');
    } else {
      statEl.textContent = t('ctxSize', { chars: fmt(snapshot.chars), tokens: approxTokens(snapshot.chars) }) + usageNote;
    }
    // Çubuk kapalıysa sadece uyarı durumlarında (kırpıldı / metin yok) görünür kalır.
    ctxEl.hidden = !settings.showInfoBar && !ctxEl.classList.contains('warn');
  }

  function nearBottom() {
    return msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 70;
  }
  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  // -------------------------------------------------------------- boş durum
  function showEmpty() {
    if (msgs.querySelector('.empty')) return;
    const el = document.createElement('div');
    el.className = 'empty';
    el.innerHTML =
      `<div class="logo">${ICON.spark}</div><h2></h2><p></p><div class="chips"></div>`;
    el.querySelector('h2').textContent = t('emptyTitle');
    el.querySelector('p').textContent = t('emptyText');
    [t('chip1'), t('chip2'), t('chip3')].forEach((label) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = label;
      b.addEventListener('click', () => send(label));
      el.querySelector('.chips').append(b);
    });
    msgs.append(el);
  }
  function hideEmpty() {
    const e = msgs.querySelector('.empty');
    if (e) e.remove();
  }

  // ----------------------------------------------------------------- mesajlar
  function addUser(text, selection) {
    const el = document.createElement('div');
    el.className = 'u';
    if (selection) {
      const q = document.createElement('div');
      q.className = 'q';
      q.textContent = selection.length > 300 ? selection.slice(0, 300) + '…' : selection;
      el.append(q);
    }
    const t = document.createElement('div');
    t.textContent = text;
    el.append(t);
    msgs.append(el);
    scrollBottom();
    return el;
  }

  function addModel() {
    const el = document.createElement('div');
    el.className = 'm';
    el.innerHTML = '<div class="body"><span class="dots"><i></i><i></i><i></i></span></div><div class="row"><button class="cp" hidden></button></div>';
    el.querySelector('.cp').textContent = t('copy');
    el._raw = '';
    el.querySelector('.cp').addEventListener('click', (e) => copyText(el._raw, e.currentTarget));
    msgs.append(el);
    scrollBottom();
    return el;
  }

  function addNote(text) {
    const el = document.createElement('div');
    el.className = 'note';
    el.textContent = text;
    const stick = nearBottom();
    msgs.append(el);
    if (stick) scrollBottom();
    return el;
  }

  function addError(text, code) {
    const el = document.createElement('div');
    el.className = 'err';
    el.textContent = text;
    if (code === 'NO_KEY') {
      const b = document.createElement('button');
      b.textContent = t('openSettings');
      b.addEventListener('click', () => { try { chrome.runtime.sendMessage({ type: 'openOptions' }); } catch (_) {} });
      el.append(b);
    }
    msgs.append(el);
    scrollBottom();
    return el;
  }

  async function copyText(text, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        shadow.append(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch (_) {}
    }
    const old = btn.textContent;
    btn.textContent = ok ? t('copied') : t('copyFail');
    setTimeout(() => { btn.textContent = old; }, 1400);
  }

  // ------------------------------------------------------------------ gönderme
  function setBusy(b) {
    busy = b;
    sendBtn.innerHTML = b ? ICON.stop : ICON.send;
    const lbl = b ? t('stopTitle') : t('sendTitle');
    sendBtn.title = lbl;
    sendBtn.setAttribute('aria-label', lbl);
    refreshSendState();
  }
  function refreshSendState() {
    sendBtn.disabled = !busy && input.value.trim() === '';
  }

  function resetConversation() {
    if (port) { try { port.disconnect(); } catch (_) {} port = null; }
    history = [];
    usageNote = ''; usageTokens = 0;
    msgs.textContent = '';
    setBusy(false);
    snapshot = captureSnapshot();
    updateCtx();
    showEmpty();
  }

  function send(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    hideEmpty();

    if (history.length && snapshot && normUrl(location.href) !== normUrl(snapshot.url)) {
      history = [];
      snapshot = null;
      usageNote = ''; usageTokens = 0;
      addNote(t('notePageChanged'));
    }
    if (!history.length) snapshot = captureSnapshot(); // sohbetin ilk sorusunda sayfayı taze oku
    updateCtx();

    const sel = lastSel;
    if (!snapshot.text && !sel) {
      addNote(t('noteNoText'));
      return;
    }

    lastSel = '';
    renderSel();
    input.value = '';
    autoGrow();

    const userEl = addUser(text, sel);
    const modelEl = addModel();
    const bodyEl = modelEl.querySelector('.body');
    const cpBtn = modelEl.querySelector('.cp');
    let acc = '';
    let settled = false;
    let raf = 0;

    const paint = () => {
      raf = 0;
      const stick = nearBottom();
      bodyEl.innerHTML = md(acc);
      if (stick) scrollBottom();
    };
    const schedulePaint = () => { if (!raf) raf = requestAnimationFrame(paint); };

    const closePort = () => { if (port) { try { port.disconnect(); } catch (_) {} port = null; } };

    // Hata ya da boş durdurma: balonları kaldır, soruyu geri koy
    const rollback = (errText, code) => {
      if (settled) return;
      settled = true;
      if (raf) cancelAnimationFrame(raf);
      userEl.remove();
      modelEl.remove();
      if (!input.value) { input.value = text; autoGrow(); }
      if (sel && !lastSel) { lastSel = sel; renderSel(); }
      if (errText) addError(errText, code);
      closePort();
      setBusy(false);
      input.focus({ preventScroll: true });
    };

    const commit = (note) => {
      if (settled) return;
      settled = true;
      if (raf) cancelAnimationFrame(raf);
      bodyEl.innerHTML = md(acc);
      modelEl._raw = acc;
      cpBtn.hidden = false;
      history.push({ role: 'user', text, selection: sel || undefined });
      history.push({ role: 'model', text: acc });
      if (note) {
        const n = document.createElement('div');
        n.className = 'note';
        n.textContent = note;
        modelEl.after(n);
      }
      closePort();
      setBusy(false);
      scrollBottom();
      input.focus({ preventScroll: true });
    };

    try {
      port = chrome.runtime.connect({ name: 'ask' });
    } catch (_) {
      rollback(t('errExtUpdated'));
      return;
    }
    setBusy(true);

    port.onMessage.addListener((m) => {
      if (m.type === 'chunk') {
        acc += m.text;
        schedulePaint();
      } else if (m.type === 'done') {
        if (m.usage && m.usage.prompt) {
          usageTokens = m.usage.prompt;
          usageNote = t('ctxUsage', { n: fmt(usageTokens) });
          updateCtx();
        }
        commit(m.finishReason === 'MAX_TOKENS' ? t('noteMaxTokens') : '');
      } else if (m.type === 'stopped') {
        if (acc) commit(t('noteStopped')); else rollback('');
      } else if (m.type === 'error') {
        rollback(m.message, m.code);
      }
    });
    port.onDisconnect.addListener(() => {
      port = null;
      if (!settled) {
        if (acc) commit(t('noteConnLostPartial'));
        else rollback(t('errBgLost'));
      }
    });

    port.postMessage({
      type: 'ask',
      page: { url: snapshot.url, title: snapshot.title, text: snapshot.text },
      history,
      question: text,
      selection: sel
    });
  }

  function stop() {
    if (port) { try { port.postMessage({ type: 'stop' }); } catch (_) {} }
  }

  // ------------------------------------------------------------- seçili metin
  function renderSel() {
    if (!lastSel) { selEl.hidden = true; return; }
    const oneLine = lastSel.replace(/\s+/g, ' ');
    selEl.querySelector('span').textContent = t('selChip', { text: oneLine.length > 90 ? oneLine.slice(0, 90) + '…' : oneLine });
    selEl.hidden = false;
  }
  const onSelectionChange = () => {
    const s = document.getSelection();
    const t = s ? s.toString().trim() : '';
    if (!t) return; // seçim kalkınca son seçimi silme; kullanıcı ✕ ile kaldırır
    // Chrome, shadow DOM içindeki textarea seçimini de document.getSelection() ile döndürür.
    // Odak panelde ve seçili metin textarea'daki seçimle aynıysa bu kullanıcının kendi yazdığı metindir.
    if (document.activeElement === host) {
      const own = input.value.slice(input.selectionStart, input.selectionEnd).trim();
      if (own && own === t) return;
    }
    lastSel = t.slice(0, 50000);
    renderSel();
  };
  document.addEventListener('selectionchange', onSelectionChange);

  // ------------------------------------------------------------ dil uygulama
  function labelEl(el, text) {
    el.title = text;
    el.setAttribute('aria-label', text);
  }
  function applyLang() {
    panel.setAttribute('aria-label', t('appName'));
    $('ttl').textContent = t('appName');
    labelEl($('renew'), t('renewTitle'));
    labelEl($('settings'), t('settingsTitle'));
    labelEl($('close'), t('closeTitle'));
    labelEl($('selx'), t('selRemoveTitle'));
    pinBtn.setAttribute('aria-label', t('pinAria'));
    updatePinUI();
    input.placeholder = t('placeholder');
    input.setAttribute('aria-label', t('inputAria'));
    const lbl = busy ? t('stopTitle') : t('sendTitle');
    sendBtn.title = lbl;
    sendBtn.setAttribute('aria-label', lbl);
    if (usageTokens) usageNote = t('ctxUsage', { n: fmt(usageTokens) });
    updateCtx();
    renderSel();
    msgs.querySelectorAll('.cp').forEach((b) => { b.textContent = t('copy'); });
    if (msgs.querySelector('.empty')) { hideEmpty(); showEmpty(); }
  }
  function setLang(lang) {
    if (t.lang === lang) return;
    t = I18N.make(lang);
    applyLang();
  }

  // ------------------------------------------------------------------- pin
  function updatePinUI() {
    pinBtn.setAttribute('aria-pressed', String(settings.pinned));
    pinBtn.title = settings.pinned ? t('pinOnTitle') : t('pinOffTitle');
  }
  function togglePin() {
    settings.pinned = !settings.pinned;
    updatePinUI();
    try { chrome.storage.local.set({ pinned: settings.pinned }); } catch (_) {}
  }
  const onOutsidePointerDown = (e) => {
    if (!isOpen || settings.pinned) return;
    if (e.composedPath().includes(host)) return;
    close();
  };
  document.addEventListener('pointerdown', onOutsidePointerDown, true);

  // -------------------------------------------------------- aç / kapat / konum
  function setPos(left, top) {
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const l = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    const t = Math.max(8, Math.min(top, window.innerHeight - h - 8));
    panel.style.left = l + 'px';
    panel.style.top = t + 'px';
    panel.style.right = 'auto';
    return { left: l, top: t };
  }
  function applyPos() {
    if (savedPos) setPos(savedPos.left, savedPos.top);
    else { panel.style.left = ''; panel.style.top = ''; panel.style.right = ''; }
  }
  const onResize = () => {
    if (panel.style.left) setPos(parseFloat(panel.style.left), parseFloat(panel.style.top));
  };
  window.addEventListener('resize', onResize);

  let drag = null;
  header.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    const r = panel.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    header.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  header.addEventListener('pointermove', (e) => {
    if (drag) setPos(e.clientX - drag.dx, e.clientY - drag.dy);
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    savedPos = { left: parseFloat(panel.style.left), top: parseFloat(panel.style.top) };
    try { chrome.storage.local.set({ panelPos: savedPos }); } catch (_) {}
  };
  header.addEventListener('pointerup', endDrag);
  header.addEventListener('pointercancel', endDrag);

  async function open() {
    await loadSettings();
    if (!host.isConnected) document.documentElement.append(host); // body dışında: innerText'e karışmasın
    updatePinUI();
    applyPos();
    if (!history.length) {
      snapshot = captureSnapshot();
      if (!msgs.children.length) showEmpty();
    }
    updateCtx();
    void panel.offsetWidth; // ilk açılışta geçişin (animasyonun) çalışması için yeniden düzen (reflow) zorla
    isOpen = true;
    panel.dataset.state = 'open';
    setTimeout(() => input.focus({ preventScroll: true }), 40);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.dataset.state = 'closed';
    if (settings.clearOnClose) resetConversation();
  }

  function toggle() {
    if (isOpen) close(); else open();
  }

  applyLang();

  // ---------------------------------------------------------------- olaylar
  $('close').addEventListener('click', close);
  $('settings').addEventListener('click', () => {
    try { chrome.runtime.sendMessage({ type: 'openOptions' }); } catch (_) {}
  });
  $('renew').addEventListener('click', () => {
    if (busy) stop();
    resetConversation();
    input.focus({ preventScroll: true });
  });
  pinBtn.addEventListener('click', togglePin);
  $('selx').addEventListener('click', () => { lastSel = ''; renderSel(); });

  sendBtn.addEventListener('click', () => {
    if (busy) stop(); else send(input.value);
  });

  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
  input.addEventListener('input', () => { autoGrow(); refreshSendState(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(input.value);
    }
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
  });

  // Sayfanın kısayolları (ör. video sitelerindeki tuşlar) panele yazarken tetiklenmesin
  ['keydown', 'keypress', 'keyup'].forEach((t) => host.addEventListener(t, (e) => e.stopPropagation()));

  // ------------------------------------------------- arka plandan gelen mesajlar
  const onRuntimeMessage = (msg) => {
    if (msg && msg.type === 'toggle') toggle();
  };
  try { chrome.runtime.onMessage.addListener(onRuntimeMessage); } catch (_) {}

  // ---------------------------------------------------------------- temizlik
  function destroy() {
    try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch (_) {}
    try { chrome.storage.onChanged.removeListener(onStorageChanged); } catch (_) {}
    document.removeEventListener('pointerdown', onOutsidePointerDown, true);
    document.removeEventListener('selectionchange', onSelectionChange);
    document.removeEventListener('page-ask-destroy', destroy);
    window.removeEventListener('resize', onResize);
    if (port) { try { port.disconnect(); } catch (_) {} }
    host.remove();
  }
  document.addEventListener('page-ask-destroy', destroy);
})();
