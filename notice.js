// Page Ask - "bu sayfada çalışmıyor" uyarısı (araç çubuğu simgesinin popup'ı).
// 2 saniye görünür, sonra kendini kapatır.
(async () => {
  const DURATION = 2000;
  const t = await PageAskI18n.load();
  document.documentElement.lang = t.lang;
  document.getElementById('title').textContent = t('noticeTitle');
  document.getElementById('text').textContent = t('noticeText');
  setTimeout(() => window.close(), DURATION);
})();
