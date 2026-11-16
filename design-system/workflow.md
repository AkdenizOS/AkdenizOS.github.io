# Ekran üretme ve gözden geçirme

## Eylemden başla

Her ekran için şu beş satırı doldur:

- Kim kullanıyor?
- Burada hangi işi yapacak?
- Şu anda hangi bilgi veya karar eksik?
- Başardığını nasıl anlayacak?
- Bu akışın gerçek yükleme, boş ve hata durumları neler?

AkdenizOS katılım örneği: kişi üzerinde çalıştığı işi ve aradığı iş birliğini anlatmak ister. Eylem, hazır başlığı olan e-posta taslağı açmaktır. Başarı, taslağın açılmasıdır; site bunu gönderilmiş veya üyelik tamamlanmış saymaz. E-posta uygulaması yoksa görünür adresi kopyalayabilir.

## Referansları seç

Yeni bir görsel yön gerekiyorsa 3–5 ilgili ekran görüntüsü topla. Her biri için neyin uygun olduğunu ve neyin taşınmayacağını yaz. Birbirinden bağımsız sayfaları rastgele birleştirme.

Mevcut yönün dayanakları:

| Referans                                 | Alınan ilke                                                             | AkdenizOS karşılığı                                    |
| ---------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| [Poke](https://poke.com/)                | Sakin merkez kompozisyonu, doğal manzara, serif başlık, ölçülü derinlik | Antalya fotoğrafı, Lora başlık, açık eylem hiyerarşisi |
| [Fitbrand](https://fitbrand.app/)        | Somut değer önerisi ve gerçek ürün gösterimi                            | İş odaklı metin, gerçek Lab ekran görüntüsü            |
| [Launchspace](https://launchspace.club/) | Katılım nedenini açık anlatma, farklı iş türlerine açıklık              | Ortaklık, uzmanlık ve pazara çıkma konuları            |

Referans bir şablon değildir. Telefon maketi, kohort programı, konuşmacı veya üyelik faaliyeti ihtiyaç yokken eklenmez.

## Kararı gerekçelendir

En az bir yerleşim seçeneğini kullanıcının eylemi üzerinden değerlendir. Örneğin uzun başvuru formu ancak toplanan alanlar işlenecekse anlamlıdır. E-posta açan sayfada işlendiği izlenimi veren sahte bir form kullanılmaz.

Tasarımı `tokens.css`, `base.css` ve `components.css` ile kur. Bir bileşene yeni varyant gerekirse mevcut tüketicilerini incele ve varyantın işini adlandır.

## Ayrıntı kontrolü

- İlk ekranda kim için olduğu ve ana eylem anlaşılıyor mu?
- Başlık, gövde, yardımcı metin hiyerarşisi belirgin mi?
- Aynı ilişkiyi anlatan boşluklar tutarlı mı?
- Fotoğraf metni destekliyor mu; metnin kontrastını bozuyor mu?
- Her butonun gerçek bir sonucu var mı?
- Gerçek bir istek varsa yavaşlık, boş sonuç, hata ve tekrar deneme durumları ele alındı mı?
- Klavye odağı, Escape, mobil gezinme ve dokunma alanı çalışıyor mu?
- Hareket azaltıldığında içerik görünür ve kullanılabilir mi?
- Açık/koyu tema ve 320 px görünümde içerik taşıyor mu?
- Otomatik erişilebilirlik taraması yanında görsel ve klavye kontrolü yapıldı mı?

İlk çıktı tamamlanmış tasarım sayılmaz. Ekranı gerçek içerikle aç, bulduğun sorunları düzelt ve son değişiklikten sonra ilgili kontrolleri yeniden çalıştır.
