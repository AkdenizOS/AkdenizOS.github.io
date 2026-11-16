# AkdenizOS tasarım sistemi

Antalya’da girişim, teknoloji ve iş birliği odaklı AkdenizOS’un çalışan görsel sistemi.

- [Canlı katalog](index.html): renk, tipografi, ölçü, gerçek bileşenler ve logo değerlendirmesi.
- [Efekt denemeleri](experiments/index.html): beş gerçek 23rd motoruyla karşılaştırma.
- [Ekran üretme yöntemi](workflow.md): referans → kullanıcı eylemi → karar → durumlar → ayrıntı kontrolü.
- [Logo kararı](logo.md): Palmiye, kelime işareti ve kullanım kuralları.
- [AI üretim kuralları](AGENTS.md): sonraki oturumların uyması gereken kurallar.

## Tek kaynak

| Dosya                       | Sorumluluk                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| `tokens.css`                | Renk, font, boşluk, köşe, dokunma ve hareket değerleri            |
| `base.css`                  | Temel tipografi, içerik genişliği ve sayfa ritmi                  |
| `components.css`            | Buton, link, kelime işareti, gezinme ve tema kontrolü             |
| `system.css`                | CSS dosyaları ve açık cascade layer sırası                        |
| `theme.js`                  | Açık/koyu tema, kalıcılık ve sekmeler arası eşitleme       |
| `gallery.css`, `gallery.js` | Yalnızca dokümantasyon sayfasının yerleşimi ve örnek davranışları |
| `experiments/`              | 23rd efektlerinin kaynakları, derlemesi ve çalışan deneme sayfası |

Landing’in `assets/css/community.css` dosyası `system.css` dosyasını içe aktarır. Renk ve ortak bileşen kararları burada değiştirilir; landing’e kopyalanmaz. Landing CSS’i kompozisyonu ve içeriğe özgü görselleri düzenler. Katalogdaki renk değerleri JavaScript ile gerçek CSS değişkenlerinden okunur.

`tokens`, `base`, `components` cascade katmanları bu sırayla yüklenir. Sayfa yerleşimi bunların ardından gelir. Tema varsayılanı açıktır; kullanıcı tercihi `akdenizos-theme` ile saklanır. Cihazın renk tercihi otomatik uygulanmaz. JavaScript kapalıyken açık tema kullanılır.

## Yeni statik sayfada kullanma

Repo kökünden yükleme örneği:

```html
<meta name="color-scheme" content="light" />
<script src="/design-system/theme.js"></script>
<link rel="stylesheet" href="/design-system/system.css" />
```

Tema betiği `<head>` içinde, `defer` veya `type="module"` olmadan yüklenir. Kayıtlı tercihi içerik çizilmeden uygular; kontrollerini DOM hazır olduğunda bağlar.

```html
<a class="button button-primary" href="/lab/">
  Lab’ı keşfet <span aria-hidden="true">↗</span>
</a>
<button class="button button-secondary" type="button">Bir işlem</button>
<a class="text-link" href="/repos.html">
  Repositories <span aria-hidden="true">↗</span>
</a>
```

Gezinme için link, sayfa içi işlem için native buton kullanılır. Düğmenin devre dışı hali `disabled` ile kurulur. Başarılı, yükleniyor, boş ve hata durumları yalnızca gerçek veri akışının ihtiyacına göre eklenir.

Tema değiştiren kontrol: `data-theme-toggle`. Ayarlar/katalogda iki seçenekli native select: `data-theme-select`, değerleri `light`, `dark`.

## Görsel dil

Başlıklar Lora 500; gövde ve arayüz Manrope. Yazı tipleri ve lisansları `assets/fonts/` içindedir. Doğal harf aralığı, sakin yüzeyler, deniz mavisi vurgu ve gerçek Antalya fotoğrafları kullanılır. Hiyerarşi ve boşluk, gereksiz çerçevelerin ve etiketlerin yerini alır.

Ürün dili somut ve iş odaklıdır. Zorlanmış slogan, sosyal tanışma vaadi, hayalî referans veya doğrulanmamış büyüklük sayıları kullanılmaz. Fotoğraflar etkinlik veya üye faaliyeti olarak sunulmaz. Görsel kaynakları ve lisans bağlantıları landing’in footer’ında yer alır.

Palmiye ve Lora 600 kelime işareti birlikte kullanılır. Marka dosyalarının envanteri ve kullanım kuralları `logo.md` içindedir.

## shadcn ile ilişki

Çekirdek site statik HTML/CSS/JS’dir. Bu klasör bir shadcn kurulumu veya React bileşen paketi değildir. Kullanıcı tarafından seçilen 23rd registry kaynaklarının framework bağımsız motorları `effects/` içinde bulunur. Shader Sky ana sayfada; diğerleri karşılaştırma sayfasında çalışır.

React/shadcn tüketicisi oluşturulursa aynı semantik roller eşlenir; mevcut token adları körlemesine kopyalanmaz. Özellikle AkdenizOS’ta `--muted` metin rengidir; shadcn’de `muted` bir yüzey rolüdür.

| AkdenizOS rolü               | shadcn karşılığı                     |
| ---------------------------- | ------------------------------------ |
| `--paper`                    | `background`                         |
| `--ink`                      | `foreground`                         |
| `--button` / `--button-text` | `primary` / `primary-foreground`     |
| `--surface` / `--ink`        | `secondary` / `secondary-foreground` |
| `--muted`                    | `muted-foreground`                   |
| `--line`                     | `border`                             |
| `--focus`                    | `ring`                               |

Resmi kaynak: [shadcn theming](https://ui.shadcn.com/docs/theming). Bu tablo bir kurulumun tamamlandığı anlamına gelmez.

## Ön izleme

Repo kökünde HTTP sunucusu aç ve `/design-system/` yolunu ziyaret et. Çekirdek katalog için kurulum veya derleme gerekmez. Efekt kaynağı değiştiğinde `experiments/README.md` içindeki kontrol ve derleme komutları kullanılır.

## Doğrulama

Ortak kaynak değiştiğinde landing ve katalog birlikte açılır. Açık/koyu tema, 320 px görünüm, klavye odağı, native devre dışı durum, tema kalıcılığı ve hareket azaltma kontrol edilir. Efektlerde WebGL bulunmaması, tema geçişi ve sekme görünürlüğü de kontrol edilir. Deneme sayfasında ayrıca durdurma davranışı kontrol edilir.

## Ana sayfadaki gökyüzü

`effects/landing-sky.ts`, `effects/shader-sky.ts` motorunu kullanır. Tarayıcı `effects/sky.js` derlemesini yükler. Gökyüzü, aynı shader içinde akan deniz ve gün ışığı renk alanlarını bulutlarla birleştirir. Tek canvas kullanılır. Gökyüzü fareyi yumuşak biçimde takip eder ve otomatik çalışır; ziyaretçiye animasyon ayarı sunulmaz. Reduced motion açıkken veya WebGL bulunmadığında fotoğraf görünür. Görünmeyen sekmede motor temizlenir. Ana sayfa modülü yaklaşık 16 kB minify edilmiş JavaScript’tir; bu bir aktarım veya cihaz performans ölçümü değildir.

Kaynak güncellenince `experiments/` içinde `npm run check` ve `npm run build` çalıştırılır. Derleme hem deneme sayfasını hem ana sayfanın gökyüzü modülünü üretir.

## Kaleiçi fotoğrafı

`effects/landing-scan.ts`, `effects/dither-scan.ts` motorunu kullanır. `effects/scan.js` derlemesi, fotoğraf görünür olduğunda iki kısa geçiş çalıştırır ve normal fotoğrafa döner. Animasyon aynı sayfa ziyaretinde tekrarlanmaz. Reduced motion altında fotoğraf doğrudan gösterilir.

## Katılım formu

Landing’de `#katil` alanı ad, e-posta, isteğe bağlı telefon ve yapılan işi toplar. İstemci `assets/js/join.js`, backend `join-api/` içindedir. Yükleniyor, güvenlik kontrolü, gönderiliyor, hata ve kaydedildi durumları vardır. Gönderim başarısı yalnızca API kaydı kabul ettiğinde gösterilir; teknik hatada alanlar korunur. Gerçek grup bağlantısı olmadan üyelik veya otomatik davet vaadi verilmez. Sunucu mimarisi ve işletim `join-api/README.md` içindedir.
