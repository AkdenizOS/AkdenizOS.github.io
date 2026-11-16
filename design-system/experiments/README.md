# Efekt denemeleri

Bu sayfa beş gerçek 23rd motorunu AkdenizOS’un içerik ve renkleriyle çalıştırır. Ana sayfa için seçim alanıdır; bütün efektler üretim standardı olarak onaylanmış değildir.

- Hero: Shader Sky, Shader Gradient, Radiant Lines veya efektsiz fotoğraf.
- Görsel: Dither Scan; iki kısa geçiş, tekrar düğmesi.
- Sayfa sonu: Stretchy Footer; kaydırma veya tek seferlik deneme düğmesi.

## Çalıştırma

Repo kökünden HTTP sunucusu aç; `/design-system/experiments/` yoluna git. Statik sunum için Node gerekmez; `bundle.js` tarayıcıda çalışır. Ana sayfa aynı motorun `../effects/sky.js` derlemesini kullanır.

Kaynak değişikliklerini derlemek için bu klasörde:

```sh
npm ci
npm run check
npm run build
```

`preview.ts` uygulama davranışıdır. `../effects/*.ts`, 23rd registry kaynaklarının framework bağımsız motorlarıdır; kökenleri `../effects/THIRD_PARTY.md` içinde kayıtlıdır. React sarmalayıcıları kullanılmaz. Derleme aracı esbuild’dir; tarayıcıya bir framework yüklenmez.

Hareket durdurulunca motorlar temizlenir ve statik fotoğraflar kalır. Reduced motion açıkken animasyon motorları başlatılmaz. Tema geçişinde motorlar yeni renklerle kurulur. Görünmeyen sekmede motorlar temizlenir. WebGL başlatılamazsa hero gerçek fotoğrafa döner.
