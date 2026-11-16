# AkdenizOS katılım API’si

Statik landing GitHub Pages’te, kayıt API’si Cloudflare Workers üzerinde çalışır. Frontend API: `https://akdenizos.org/api/`. Bağımsız API alanı: `https://api.akdenizos.org`. `akdenizos.org/api/*` route’u aynı Worker’a gider; landing GitHub Pages üzerinden sunulur. D1: `akdenizos-join`.

## Yerel kontrol

Node 22 veya üzeri gerekir. `npm ci`, `npm run check`, `npm test`, `npm run build`.

`npm run dev` API’yi 8787 portunda açar. Yerel geliştirmede de Turnstile doğrulaması zorunludur. Gizli değerleri `.dev.vars` üzerinden sağla; bu dosya git dışında tutulur. Üretim sırları `cf deploy --secrets-file <repo dışındaki JSON dosyası>` ile yüklenir. JSON anahtarları `RESEND_API_KEY` ve `TURNSTILE_SECRET_KEY`.

## API

- `GET /health`: servis durumu.
- `GET /config`: izin verilen origin’lere public Turnstile sitekey.
- `POST /applications`: `name`, `email`, isteğe bağlı `phone`, `work`, `token`, boş `website`, `noticeVersion: "2026-11-17"`.
- Başarılı kayıt veya mevcut e-posta için aynı `202 {"ok":true}` yanıtı verilir. Mevcut kayıt değiştirilmez; e-posta varlığı açıklanmaz.

Turnstile action `join`, hostname izin listesi, origin, sunucu doğrulaması, 8 KiB gövde sınırı ve IP başına yaklaşık 5 istek/dakika uygulanır. Rate limit Cloudflare konumu başına kötüye kullanım korumasıdır, küresel kesin kota değildir. IP başvuru tablosuna yazılmaz. API herkese açık başvuru okuma endpoint’i sunmaz.

## Kayıt ve e-posta

`schema.sql` ilk kurulum şemasıdır. D1 prepared statements kullanılır. E-posta normalize edilir ve unique indeksle korunur. Alındı e-postası için pending/sent/failed durumları, altı deneme ve atomik süreli sahiplenme vardır. Beş dakikalık cron geciken gönderimleri tekrar dener. Sabit Resend idempotency anahtarı tekrar gönderimleri engeller. Başvurunun kabulü e-posta servisine bağlı değildir. Loglar ad, telefon, e-posta, serbest metin veya anahtar içermez.

Gönderici: `AkdenizOS <merhaba@akdenizos.org>`. Yanıt adresi: `contact@efekurucay.com`. Grup daveti veya otomatik üyelik oluşturulmaz.

## Başvuruları görme

Cloudflare Dashboard → Workers & Pages → D1 → akdenizos-join → Studio.

```sql
SELECT name, email, phone, work, datetime(created_at, 'unixepoch') AS submitted_at,
       mail_status FROM applications ORDER BY created_at DESC;
```

Veriler kişiseldir; herkese açık dosyaya veya repoya aktarılmaz. CSV dışa aktarımında serbest metinlerin elektronik tablo formülü olarak çalıştırılmamasına dikkat edilir. `failed` e-postalar buradan takip edilir.

## Yayın

`npm run deploy -- --dry-run --secrets-file <path>` ile doğrula, ardından `npm run deploy -- --secrets-file <path>`. Üretim sırları repo dışında saklanır. Frontend `assets/js/join.js` dosyası API’yi formun action adresinden alır; test için farklı bir action yalnızca lokal DOM’da kullanılabilir. Gizlilik açıklaması `gizlilik.html` içindedir.
