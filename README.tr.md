# Page Ask

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Version](https://img.shields.io/badge/version-1.2.2-green)

[English](README.md) · **Türkçe**

> Bulunduğun sayfa hakkında Gemini'ye sor — Vivaldi/Chromium eklentisi.

Page Ask, Google'ın "Bu sayfa hakkında Gemini'ye sor" özelliğinin Vivaldi'deki karşılığıdır. **Alt+G**'ye bas (ya da araç çubuğu simgesine tıkla), sayfanın üstünde yüzen bir sohbet paneli açılır. Okuduğun sayfa hakkında istediğini sor: sayfanın tamamı, sorunla birlikte Gemini'ye gönderilir. Vivaldi için yazıldı, Manifest V3 kullanır ve Chrome ile diğer Chromium tarayıcılarda da çalışır.

Vivaldi'de "bu sayfayı yapay zekaya sor" özelliği olmadığı için ve ücretsiz Gemini API katmanı kendi anahtarınla günlük kullanıma yettiği için yapıldı. Benim bir sunucum yok: eklenti doğrudan Google'ın API'siyle konuşur.

![Page Ask demo](docs/images/demo.gif)

## Özellikler

- Araç çubuğu simgesi ya da **Alt+G** ile açılan yüzen sohbet paneli (kısayol `vivaldi://extensions/shortcuts` üzerinden değiştirilebilir).
- Panel varsayılan olarak **sabit (pin)**. Pin kapatılırsa dışarı tıklayınca panel kapanır. Açılış/kapanış animasyonu var, başlığından sürüklenebilir, konumu hatırlanır.
- Sayfanın **tamamı** kırpılmadan gönderilir. Yalnızca ayarlardaki üst sınır uygulanır (varsayılan 2.000.000 karakter).
- Sayfada **seçilen metin** soruya "seçili metin" olarak eklenir.
- Panelin üstünde sayfa bilgi çubuğu: başlık, karakter/token tahmini ve son isteğin token sayısı. Ayarlardan kapatılabilir.
- Yanıtlar **akış (streaming)** halinde gelir. Markdown güvenli biçimde render edilir (ham HTML escape edilir).
- Sohbet geçmişi **yalnızca oturum içinde bellekte** tutulur, diske yazılmaz.
- Başlıktaki düğmeler: yeni sohbet (sayfayı yeniden okur), ayarlar, pin, kapat.
- Türkçe/İngilizce arayüz (varsayılan tarayıcı dili).
- Eklentilerin çalışamadığı sayfalarda (`vivaldi://`, `chrome://`, mağaza sayfaları, PDF görüntüleyici) araç çubuğu simgesinin altında 2 saniyelik küçük bir uyarı çıkar. Ayrı pencere açılmaz.

![Sohbet paneli](docs/images/panel.png)

## Kurulum

Vivaldi (ya da Chrome/başka bir Chromium tarayıcı, sürüm 111+) ve ücretsiz bir Gemini API anahtarı gerekir.

### 1. Eklentiyi indir

Repoyu ZIP olarak indirip (**Code → Download ZIP**) kalıcı bir yere çıkar ya da klonla:

```bash
git clone https://github.com/<kullanici-adin>/page-ask.git
```

Klasörü sonradan taşırsan ya da silersen eklenti kaybolur.

![Repoyu indir](docs/images/01-download.png)

### 2. Geliştirici modunu aç

`vivaldi://extensions` adresini aç ve sağ üstten **Geliştirici modu**nu aç.

![Geliştirici modu](docs/images/02-developer-mode.png)

### 3. Eklentiyi yükle

**Paketlenmemiş öğe yükle**'ye tıkla ve `page-ask` klasörünü (içinde `manifest.json` olan klasör) seç.

![Paketlenmemiş öğe yükle](docs/images/03-load-unpacked.png)

### 4. Gemini API anahtarı al

<https://aistudio.google.com/apikey> adresinden bir anahtar oluştur.

![Google AI Studio'da API anahtarı oluştur](docs/images/04-get-api-key.png)

### 5. Anahtarı ayarlara yapıştır

Eklenti simgesine sağ tık → **Seçenekler** (ya da paneldeki ayarlar düğmesi), anahtarı yapıştır ve **Kaydet**'e bas.

![API anahtarını yapıştır](docs/images/05-paste-key.png)

### 6. Araç çubuğuna sabitle

Araç çubuğundaki puzzle simgesine tıkla ve **Page Ask**'ı sabitle.

![Araç çubuğuna sabitle](docs/images/06-pin-toolbar.png)

### 7. Dene

Herhangi bir web sayfasında **Alt+G**'ye bas.

## Kullanım

- **Alt+G** ya da araç çubuğu simgesi paneli açar/kapatır. **Esc** paneli kapatır.
- Pin açıkken (varsayılan) sayfada gezinip metin seçebilirsin; seçim panelde görünür ve sonraki soruyla birlikte gönderilir.
- Paneli başlığından tutup sürükleyerek taşıyabilirsin.
- **Yeni sohbet** düğmesi baştan başlatır ve sayfayı yeniden okur (ör. sayfa değiştiyse).
- Desteklenmeyen sayfalarda şu uyarı çıkar:

![Desteklenmeyen sayfa uyarısı](docs/images/notice-popup.png)

## Ayarlar

![Ayarlar sayfası](docs/images/settings.png)

| Ayar | Açıklama |
| --- | --- |
| Gemini API anahtarı | Google AI Studio'dan aldığın anahtar. |
| Model | **Modelleri listele** yalnızca anahtarının kullanabildiği Flash / Flash-Lite / Pro gruplarını gösterir. Görsel, ses, embedding, omni ve yeni kullanıcılara kapalı 2.5 modelleri gizlidir. Varsayılan: `gemini-3.5-flash-lite`. |
| Dil | Türkçe ya da English (özel açılır liste). Varsayılan: tarayıcı dili. |
| Bilgi çubuğunu göster | Sayfa bilgi çubuğunu gösterir/gizler. |
| Panel kapanınca sohbeti sil | Panel her kapandığında konuşmayı siler. |
| Maksimum sayfa karakteri | Sayfa metni için üst sınır. Varsayılan 2.000.000. |
| Kısayol | Tarayıcının kısayol ayarlarına kısayol. |

## Gizlilik ve izinler

- Sayfa içeriği ve sorular **doğrudan Google'ın Gemini API'sine** gider. Ücretsiz katmanda içerik Google tarafından ürünlerini geliştirmek için kullanılabilir; banka, e-posta gibi hassas sayfalarda kullanma.
- API anahtarı `chrome.storage.local` içinde saklanır ve yalnızca service worker tarafından kullanılır. Web sayfalarına verilmez.
- Sohbet geçmişi yalnızca bellekte tutulur, diske yazılmaz.
- Kalıcı "tüm sitelere erişim" izni yoktur. Panel yalnızca simgeye ya da kısayola bastığında enjekte edilir.

| İzin | Neden |
| --- | --- |
| `activeTab`, `scripting` | Eklentiyi etkinleştirdiğinde paneli geçerli sekmeye enjekte etmek. |
| `storage` | Ayarlarını kaydetmek. |
| `tabs` | Yalnızca sekme URL'sinin şemasına bakmak, böylece `vivaldi://` gibi kısıtlı sayfalarda uyarı gösterilebilir. Diğer sekmelerin içeriği okunmaz. |
| host: `https://generativelanguage.googleapis.com/*` | Gemini API'sini çağırmak. |

## Nasıl çalışır

- **Manifest V3.** Service worker `background.js`, içerik betiği `content.js`. Panel, sayfanın CSS'i ile çakışmaması için **Shadow DOM** içinde çizilir. Markdown için `md.js`, çeviriler için `i18n.js` kullanılır.
- İçerik betiği yalnızca simgeye/kısayola basıldığında `chrome.scripting.executeScript` ile enjekte edilir (`activeTab`).
- İstek: `POST v1beta/models/{model}:streamGenerateContent?alt=sse`, `x-goog-api-key` başlığıyla. Sayfa metni ilk kullanıcı mesajına konur (örtük önbellekleme dostu). Sistem talimatı İngilizcedir.
- Ücretsiz Gemini API katmanı için tasarlandı. Limitler modele göre değişir; [AI Studio limitlerine](https://aistudio.google.com/rate-limit) bak. Her soruda sayfa yeniden gönderildiği için çok uzun sayfalar kotayı hızlı harcar (HTTP 429).

### Dosya yapısı

```
page-ask/
├── manifest.json     # Eklenti manifesti (MV3)
├── background.js     # Service worker: Gemini istekleri, enjeksiyon, anahtar yönetimi
├── content.js        # Panel arayüzü (Shadow DOM), sayfa metni okuma
├── md.js             # Güvenli Markdown render'ı
├── i18n.js           # Türkçe/İngilizce metinler
├── notice.html       # Eklentinin açılamadığı sayfalar için popup
├── notice.js
├── options.html      # Ayarlar sayfası
├── options.js
├── icons/            # Eklenti simgeleri
├── _locales/         # Manifest metinleri (en, tr)
├── docs/images/      # README görselleri
├── README.md
├── README.tr.md
└── LICENSE
```

## Sorun giderme

- **"Model not found" hatası:** yeni API anahtarları artık Gemini 2.5 modellerine erişemez. Ayarlar → **Modelleri listele**'den hesabına açık bir model seç.
- **429 / kota hataları:** ücretsiz katman limitine ulaştın. Bir dakika bekle, Flash-Lite gibi daha hafif bir model kullan ya da daha kısa bir sayfa dene.
- **Bir sayfada hiçbir şey olmuyor:** tarayıcı iç sayfaları, mağaza sayfaları ve PDF görüntüleyici desteklenmez (uyarı çıkar).
- **Kısayol çalışmıyor:** başka bir eklenti Alt+G'yi kullanıyor olabilir. `vivaldi://extensions/shortcuts` üzerinden değiştir.
- **Eklenti kayboldu:** klasör taşınmış ya da silinmiş. **Paketlenmemiş öğe yükle** ile yeniden yükle.

## Katkı

Issue ve pull request'ler memnuniyetle karşılanır. Lütfen değişiklikleri odaklı tutun ve nasıl test ettiğinizi yazın (klasörü paketlenmemiş yükleyin, normal bir sayfada ve kısıtlı bir sayfada deneyin).

## Lisans

[MIT](LICENSE) © 2026 Alp Oral
