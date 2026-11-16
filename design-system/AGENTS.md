# AkdenizOS tasarım sistemini kullanma kuralları

Önce `README.md`, sonra ilgili bileşenin örneğini `index.html` içinde oku. Logo için `logo.md`; ekran üretimi ve kalite kontrolü için `workflow.md` geçerlidir.

- Renk ve ölçü kaynağı `tokens.css`. `base.css` temel tipografi ve sayfa ritmini; `components.css` gerçek ortak bileşenleri içerir. Bunları kopyalayıp sayfaya özel sürümler üretme.
- Yeni sayfa `system.css` yükler. Sayfa CSS’i yerleşimi ve içeriğe özgü görselleri düzenler; buton, link, tema ve logo kurallarını yeniden tanımlamaz.
- Tema davranışı `theme.js` ile paylaşılır. JavaScript kapalıyken sistem tercihi CSS ile çalışmalıdır.
- Yeni bileşeni ancak mevcut bir kullanıcı ihtiyacı varsa ekle. Yalnızca örnek kataloğu dolsun diye modal, toast, tablo veya form oluşturma.
- Her eylem anlamına uygun native öğe kullanır: gezinme için `<a>`, sayfa içi işlem için `<button>`. Devre dışı işlemler native `disabled` kullanır.
- Görünür klavye odağını, native erişilebilirlik anlamlarını ve hareket azaltma desteğini koru.
- Bir ekran tasarlamadan önce kullanıcının eylemini ve başarı koşulunu yaz. “Modern/temiz/premium yap” tek başına tasarım tanımı değildir.
- Referanslardan ilkeleri çıkar; başka markanın logosunu, illüstrasyonunu, içeriklerini veya ürün maketini kopyalama.
- Poke sakin kompozisyon ve doğal manzara için; Fitbrand somut değer önerisi ve gerçek ürün gösterimi için referanstır. AkdenizOS’un konusu Antalya’da girişim, teknoloji ve iş birliğidir.
- Teknik etiket, dekoratif bölüm numarası, karmaşık diyagram, gereksiz kart/çerçeve ve sürekli hareket ekleme. Bunları bir kullanıcı ihtiyacı haklı çıkarıyorsa nedenini açıkla.
- Yükleme, boş, hata, başarılı ve devre dışı durumlarından yalnızca gerçek akışın gerektirdiklerini tasarla. Çalışmayan buton, sahte kayıt başarısı veya hayalî veri gösterme.
- Logo işareti bir adaydır. Kalıcı ve ayırt edici marka sembolü olarak onaylanmış gibi sunma. Durumunu değiştirmek için kullanıcı kararı gerekir.
- Değişiklikte aynı token veya bileşenin landing ve katalog kullanımını kontrol et. Açık/koyu tema, 320 px görünüm, klavye ve reduced motion kontrol edilir.
- Commit ve push için mevcut kullanıcı talimatları geçerlidir; bu dosya ek yetki vermez.

Gökyüzü, kullanıcı tarafından ana sayfa için seçilen sürekli efekttir. Kanonik motor `effects/shader-sky.ts`, landing entegrasyonu `effects/landing-sky.ts` dosyasındadır. Ziyaretçiye dekoratif animasyon ayarı ekleme. Reduced motion ve fotoğraf görünümünü koru. Diğer efektler `experiments/` içinde karşılaştırılır.

Kaleiçi fotoğrafında Dither Scan, görünür olduğunda bir kez çalışır. Tekrar veya efekt kontrolü yalnızca deneme sayfasına aittir; ziyaretçi akışına taşınmaz.
