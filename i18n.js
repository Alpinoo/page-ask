// Page Ask - Türkçe / English metinler.
// Arka plan (importScripts), panel (içerik betiği), ayarlar ve uyarı sayfası aynı sözlüğü kullanır.
// Dil ayarı chrome.storage.local içinde "lang" anahtarında durur; yoksa tarayıcı diline bakılır.
(function (root) {
  const DICT = {
    tr: {
      appName: 'Page Ask',
      actionTitle: 'Page Ask (Alt+G)',

      // --- panel
      renewTitle: 'Yeni sohbet (sayfayı yeniden oku)',
      settingsTitle: 'Ayarlar',
      pinAria: 'Paneli sabitle',
      pinOnTitle: 'Sabit: dışarı tıklayınca kapanmaz (kaldırmak için tıkla)',
      pinOffTitle: 'Sabit değil: dışarı tıklayınca kapanır (sabitlemek için tıkla)',
      closeTitle: 'Kapat (Esc)',
      selRemoveTitle: 'Seçimi kaldır',
      sendTitle: 'Gönder (Enter)',
      stopTitle: 'Durdur',
      placeholder: 'Bu sayfa hakkında bir şey sor…',
      inputAria: 'Soru',
      emptyTitle: 'Bu sayfa hakkında sor',
      emptyText: "Sayfanın tamamı Gemini'ye gönderilir. Sayfada bir yeri seçip sorabilirsin.",
      chip1: 'Bu sayfayı özetle',
      chip2: 'Ana noktalar neler?',
      chip3: 'Burada geçen terimleri açıkla',
      ctxUnreadable: 'metin okunamadı',
      ctxTruncated: '⚠ ilk {sent} / {chars} karakter',
      ctxSize: '{chars} karakter (~{tokens} token)',
      ctxUsage: ' · son istek: {n} token',
      tokensK: '{n} bin',
      selChip: 'Seçili metin: “{text}”',
      copy: 'Kopyala',
      copied: 'Kopyalandı',
      copyFail: 'Kopyalanamadı',
      openSettings: 'Ayarları aç',
      notePageChanged: 'Sayfa değişti, yeni bir sohbet başladı.',
      noteNoText: 'Bu sayfadan okunabilir metin çıkarılamadı (PDF ya da görüntü ağırlıklı bir sayfa olabilir).',
      noteMaxTokens: 'Yanıt uzunluk sınırında kesildi.',
      noteStopped: 'Durduruldu.',
      noteConnLostPartial: 'Bağlantı kesildi, yanıt yarım kalmış olabilir.',
      errExtUpdated: 'Eklenti güncellenmiş ya da yeniden başlatılmış görünüyor. Bu sayfayı yenileyip tekrar dene.',
      errBgLost: 'Arka plan bağlantısı koptu. Tekrar dene.',

      // --- Gemini / arka plan hataları
      errNoKey: 'Henüz bir Gemini API anahtarı girmedin.',
      errConnect: 'Gemini sunucusuna bağlanılamadı. İnternet bağlantını kontrol et.',
      errUnexpected: 'Beklenmeyen hata: {msg}',
      errBlocked: 'İstek Gemini güvenlik filtresine takıldı ({reason}).',
      errEmpty: 'Gemini boş yanıt döndürdü{finish}. Soruyu biraz değiştirip tekrar dene.',
      err400key: 'API anahtarı geçersiz görünüyor. Ayarlardan kontrol et.',
      err400: 'İstek reddedildi (400).',
      err400hint: 'Sayfa çok uzunsa modelin giriş sınırını aşmış olabilir; ayarlardan "En fazla sayfa karakteri" değerini düşürebilirsin.',
      err403: 'API anahtarı yetkisiz ya da bu model için kapalı ({status}).',
      err404: '"{model}" modeli bulunamadı. Ayarlardan "Modelleri listele" ile kullanılabilir bir model seç.',
      err413: 'Sayfa çok büyük (413). Ayarlardan "En fazla sayfa karakteri" değerini düşür.',
      err429: 'Limit aşıldı (429). Ücretsiz katmanda dakika/gün başı istek ve token sınırları var; her soruda sayfa yeniden gönderildiği için uzun sayfalar kotayı hızlı doldurur. Biraz bekleyip tekrar dene.',
      errGeneric: 'Gemini hatası ({status}).',

      // --- uyarı popup'ı
      noticeTitle: 'Bu sayfada çalışmıyor',
      noticeText: 'Tarayıcının iç sayfası olabilir (ör. vivaldi://, mağaza sayfaları, PDF görüntüleyici).',

      // --- ayarlar sayfası
      optTitle: 'Page Ask - Ayarlar',
      optSub: "Açık sayfayla ilgili Gemini'ye soru sor. Ayarlar yalnızca bu tarayıcıda saklanır.",
      language: 'Dil',
      secApi: 'Gemini API',
      keyLabel: 'API anahtarı',
      show: 'Göster',
      hide: 'Gizle',
      keyToggleAria: 'Anahtarı göster/gizle',
      keyHint: 'Ücretsiz anahtarı {studio} üzerinden alabilirsin. Anahtar sayfalara hiçbir zaman verilmez; yalnızca arka plan betiği kullanır.',
      studioLink: 'Google AI Studio',
      modelLabel: 'Model',
      listModels: 'Modelleri listele',
      grpFlash: 'Flash',
      grpFlashLite: 'Flash-Lite',
      grpPro: 'Pro',
      grpOther: 'Diğer',
      modelHint: 'Varsayılan `gemini-3.5-flash-lite`. Listede yalnızca metin çıktısı veren modeller gösterilir (görsel, ses ve embedding modelleri hariç). Ücretsiz kullanım ve limitler modele göre değişir; güncel limitler için {limits} bak.',
      limitsLink: 'AI Studio limit sayfasına',
      secBehavior: 'Davranış',
      maxCharsLabel: 'En fazla sayfa karakteri',
      maxCharsHint: 'Sayfanın tamamı varsayılan olarak kırpılmadan gönderilir; bu sayı sadece aşırı uzun sayfalar için bir güvenlik sınırıdır. `0` yazarsan sınır olmaz. Ücretsiz katmanda dakika başı token limitine takılırsan düşürebilirsin.',
      infoBarLabel: 'Sayfa bilgi çubuğunu göster',
      infoBarHint: 'Panelin üstünde sayfa başlığını ve karakter/token sayısını gösterir. Kapalıyken bile sayfa kırpıldıysa ya da metin okunamadıysa uyarı görünür.',
      clearOnCloseLabel: 'Paneli kapatınca sohbeti sil',
      clearOnCloseHint: 'Kapalıyken sohbet, sayfayı yenileyene ya da sekmeyi kapatana kadar bellekte kalır. Hiçbir zaman diske yazılmaz.',
      secShortcut: 'Kısayol',
      shortcutText: 'Panel `Alt+G` ile açılıp kapanır. Değiştirmek için tarayıcının uzantı kısayolları sayfasını aç:',
      open: 'Aç',
      copyBtn: 'Kopyala',
      shortcutHint: 'Buton açılmazsa adresi kopyalayıp yeni sekmeye yapıştır. Orada "Page Ask" için istediğin tuş kombinasyonunu seçebilirsin.',
      save: 'Kaydet',
      saved: 'Kaydedildi.',
      maxCharsInvalid: '"En fazla sayfa karakteri" 0 ya da pozitif bir sayı olmalı.',
      nonTextModel: 'Bu model metin çıktısı vermiyor (görsel, ses ya da embedding modeli gibi görünüyor). Bir metin modeli seç.',
      enterKeyFirst: 'Önce API anahtarını gir.',
      fetchingModels: 'Modeller alınıyor…',
      listFailed: 'Liste alınamadı ({status}). {msg}',
      cannotConnect: 'Gemini sunucusuna bağlanılamadı.',
      noModels: 'Bu anahtarla kullanılabilir metin modeli bulunamadı.',
      modelsFound: "{n} metin modeli bulundu. Birine tıklayıp seç, sonra Kaydet'e bas.",
      modelPicked: '"{id}" seçildi. Kaydet\'e bas.',
      inputLimit: '· giriş sınırı {n} token',
      shortcutOpenFail: 'Sayfa açılamadı. Adresi kopyalayıp yeni sekmeye yapıştır.',
      addressCopied: 'Adres kopyalandı.',
      addressSelected: 'Adres seçildi, Ctrl+C ile kopyala.'
    },

    en: {
      appName: 'Page Ask',
      actionTitle: 'Page Ask (Alt+G)',

      // --- panel
      renewTitle: 'New chat (re-read the page)',
      settingsTitle: 'Settings',
      pinAria: 'Pin panel',
      pinOnTitle: 'Pinned: stays open when you click outside (click to unpin)',
      pinOffTitle: 'Not pinned: closes when you click outside (click to pin)',
      closeTitle: 'Close (Esc)',
      selRemoveTitle: 'Remove selection',
      sendTitle: 'Send (Enter)',
      stopTitle: 'Stop',
      placeholder: 'Ask something about this page…',
      inputAria: 'Question',
      emptyTitle: 'Ask about this page',
      emptyText: 'The whole page is sent to Gemini. You can also select something on the page and ask about it.',
      chip1: 'Summarize this page',
      chip2: 'What are the key points?',
      chip3: 'Explain the terms used here',
      ctxUnreadable: 'no text found',
      ctxTruncated: '⚠ first {sent} / {chars} characters',
      ctxSize: '{chars} characters (~{tokens} tokens)',
      ctxUsage: ' · last request: {n} tokens',
      tokensK: '{n}k',
      selChip: 'Selected text: “{text}”',
      copy: 'Copy',
      copied: 'Copied',
      copyFail: 'Copy failed',
      openSettings: 'Open settings',
      notePageChanged: 'The page changed, so a new chat started.',
      noteNoText: "Couldn't read any text from this page (it may be a PDF or an image-heavy page).",
      noteMaxTokens: 'The response was cut off at the length limit.',
      noteStopped: 'Stopped.',
      noteConnLostPartial: 'Connection lost; the response may be incomplete.',
      errExtUpdated: 'The extension seems to have been updated or restarted. Reload this page and try again.',
      errBgLost: 'Lost the connection to the background script. Try again.',

      // --- Gemini / background errors
      errNoKey: "You haven't entered a Gemini API key yet.",
      errConnect: "Couldn't reach the Gemini server. Check your internet connection.",
      errUnexpected: 'Unexpected error: {msg}',
      errBlocked: "The request was blocked by Gemini's safety filter ({reason}).",
      errEmpty: 'Gemini returned an empty response{finish}. Try rewording your question.',
      err400key: 'The API key looks invalid. Check it in settings.',
      err400: 'The request was rejected (400).',
      err400hint: 'If the page is very long it may exceed the model\'s input limit; you can lower "Max page characters" in settings.',
      err403: "The API key isn't authorized, or this model isn't enabled for it ({status}).",
      err404: 'Model "{model}" was not found. Pick an available one with "List models" in settings.',
      err413: 'The page is too large (413). Lower "Max page characters" in settings.',
      err429: 'Rate limit exceeded (429). The free tier has per-minute and per-day request and token limits, and because the page is re-sent with every question, long pages use up the quota quickly. Wait a bit and try again.',
      errGeneric: 'Gemini error ({status}).',

      // --- notice popup
      noticeTitle: "Doesn't work on this page",
      noticeText: 'It may be a browser-internal page (e.g. vivaldi://, web store pages, the PDF viewer).',

      // --- settings page
      optTitle: 'Page Ask - Settings',
      optSub: "Ask Gemini about the page you're on. Settings are stored only in this browser.",
      language: 'Language',
      secApi: 'Gemini API',
      keyLabel: 'API key',
      show: 'Show',
      hide: 'Hide',
      keyToggleAria: 'Show/hide key',
      keyHint: 'Get a free key from {studio}. The key is never exposed to web pages; only the background script uses it.',
      studioLink: 'Google AI Studio',
      modelLabel: 'Model',
      listModels: 'List models',
      grpFlash: 'Flash',
      grpFlashLite: 'Flash-Lite',
      grpPro: 'Pro',
      grpOther: 'Other',
      modelHint: 'The default is `gemini-3.5-flash-lite`. The list shows text-output models only (image, audio and embedding models are left out). Free usage and limits vary by model; check {limits} for current limits.',
      limitsLink: 'the AI Studio rate-limit page',
      secBehavior: 'Behavior',
      maxCharsLabel: 'Max page characters',
      maxCharsHint: "By default the whole page is sent without trimming; this number is only a safety cap for extremely long pages. Enter `0` for no limit. Lower it if you hit the free tier's per-minute token limit.",
      infoBarLabel: 'Show the page info bar',
      infoBarHint: 'Shows the page title and the character/token count at the top of the panel. Even when off, a warning still appears if the page was trimmed or no text could be read.',
      clearOnCloseLabel: 'Delete the chat when the panel is closed',
      clearOnCloseHint: 'When off, the chat stays in memory until you reload the page or close the tab. It is never written to disk.',
      secShortcut: 'Shortcut',
      shortcutText: "The panel toggles with `Alt+G`. To change it, open the browser's extension shortcuts page:",
      open: 'Open',
      copyBtn: 'Copy',
      shortcutHint: 'If the button does nothing, copy the address and paste it into a new tab. There you can pick any key combination for "Page Ask".',
      save: 'Save',
      saved: 'Saved.',
      maxCharsInvalid: '"Max page characters" must be 0 or a positive number.',
      nonTextModel: "This model doesn't produce text output (it looks like an image, audio or embedding model). Pick a text model.",
      enterKeyFirst: 'Enter your API key first.',
      fetchingModels: 'Fetching models…',
      listFailed: "Couldn't fetch the list ({status}). {msg}",
      cannotConnect: "Couldn't reach the Gemini server.",
      noModels: 'No text models are available with this key.',
      modelsFound: '{n} text models found. Click one to select it, then press Save.',
      modelPicked: '"{id}" selected. Press Save.',
      inputLimit: '· input limit {n} tokens',
      shortcutOpenFail: "Couldn't open the page. Copy the address and paste it into a new tab.",
      addressCopied: 'Address copied.',
      addressSelected: 'Address selected, press Ctrl+C to copy.'
    }
  };

  function detect() {
    const nav = root.navigator || {};
    const l = String(nav.language || (nav.languages && nav.languages[0]) || 'en').toLowerCase();
    return l.indexOf('tr') === 0 ? 'tr' : 'en';
  }

  function make(lang) {
    const code = DICT[lang] ? lang : 'en';
    const d = DICT[code];
    const locale = code === 'tr' ? 'tr-TR' : 'en-US';
    function t(key, params) {
      let s = d[key];
      if (s === undefined) s = DICT.en[key];
      if (s === undefined) return key;
      if (params) {
        s = s.replace(/\{(\w+)\}/g, function (m, k) {
          return Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : m;
        });
      }
      return s;
    }
    t.lang = code;
    t.locale = locale;
    t.num = function (n) { return Number(n).toLocaleString(locale); };
    return t;
  }

  async function load() {
    let lang = '';
    try {
      const r = await chrome.storage.local.get('lang');
      lang = r.lang;
    } catch (_) { /* depolama erişilemiyorsa tarayıcı dili */ }
    return make(lang || detect());
  }

  root.PageAskI18n = { DICT: DICT, detect: detect, make: make, load: load };
})(typeof self !== 'undefined' ? self : this);
