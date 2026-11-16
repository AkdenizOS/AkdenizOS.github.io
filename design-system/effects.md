# Hareket referansları

[Çalışan deneme sayfası](experiments/index.html), beş gerçek 23rd motorunu AkdenizOS’un görsel dili içinde gösterir. Hero arka planları arasında seçim yapılabilir; Dither Scan görselde, Stretchy Footer sayfa sonunda çalışır. Durdurma ve efektsiz karşılaştırma kontrolleri vardır.

Motorlar 23rd public registry kaynaklarından alınır. React sarmalayıcıları yerine framework bağımsız API’leri kullanılır; kaynak kökeni `effects/THIRD_PARTY.md` içinde kayıtlıdır. Bu denemelerin mevcut olması, hepsinin ana sayfa standardı olarak onaylandığı anlamına gelmez.

| Referans                                                                | Ne yapıyor?                                                            | AkdenizOS için karar                                                                                                                  |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [Shader Sky](https://www.23rd.dev/docs/components/shader-sky)           | WebGL ile hareket eden bulutlar; açık/koyu gökyüzü seçenekleri         | Kullanıcı seçimi: ana sayfanın hero’sunda uygulanır. Fotoğraf ve metin hiyerarşisi korunur; hareket azaltma tercihi sistemden alınır. |
| [Stretchy Footer](https://www.23rd.dev/docs/components/stretchy-footer) | Sayfa sonunda esneme ve renk alanı                                     | Küçük bir son etkileşim adayı. Yerel kaydırma ve mobil davranış değerlendirilmelidir.                                                 |
| [Dither Scan](https://www.23rd.dev/docs/components/dither-scan)         | Görseli diyagonal geçişlerle 1-bit dithering’den normal görüntüye açar | Proje/Showcase görselinde bir kerelik, kullanıcı tarafından başlatılan deneme için uygun. Ana metnin görünmesini geciktirmemeli.      |
| [Radiant Lines](https://www.23rd.dev/docs/components/radiant-lines)     | Kaydırma hızıyla uzayan yıldız çizgileri                               | Teknoloji gösterimi veya ayrı bir kampanya sayfası adayı. İş odaklı landing için güçlü ve dikkat çekici olabilir.                     |
| [Shader Gradient](https://www.23rd.dev/docs/components/shader-gradient) | WebGL, doku ve işaretçiyle hareket eden renk alanı                     | Gerekçeli bir atmosfer deneyi olabilir. Sırf ekranı doldurmak için kullanılmaz; mevcut paleti korur.                                  |

## Bir deneyi kabul etme koşulları

- Kullanıcıya ne kattığı bir cümlede açıklanır. Örneğin bekleme süresini anlatmak, görselin açıldığını belirtmek veya sayfa sonunu hissettirmek.
- Aynı yerde birden fazla ana efekt yarıştırılmaz.
- Efekt olmasa da metin, link ve katılım eylemi kullanılabilir kalır.
- Reduced motion altında statik sonuç vardır. Durdurma kontrolleri deneme sayfasında yer alır; landing’de dekoratif efekt ayarı gösterilmez.
- WebGL desteklenmediğinde veya bağlam kaybedildiğinde fotoğraf ya da düz renk kullanılır.
- Sürekli efekt ekran dışındayken ve sekme gizliyken durur. Mobilde gerçek cihaz üzerinde yük, takılma ve pil etkisi değerlendirilir.
- Dither Scan dokümanına göre uzaktaki görsellerde piksel okuması için CORS gerekir; okunamayan görsel doğrudan gösterilir. Reduced motion’da tarama yapılmadan normal görsel gösterilir.
- Bir kütüphaneyi incelemek, onu ürün bağımlılığı yapmak anlamına gelmez. Kurulum gerektiğinde önce mevcut paketler, lisans, kaynak kod ve bağımlılıklar kontrol edilir.

## İnceleme ile uygulamayı ayır

Katalogdaki çekirdek bileşenler sitenin kullandığı gerçek kaynaklardır. Deneme sayfasındaki efektler çalışan adaylardır. Ana landing’in varsayılan efekti kullanıcı tarafından seçilen Shader Sky’dır. Diğer motorlar deneme sayfasında karşılaştırılır.
