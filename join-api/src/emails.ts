export type Application = { id: string; name: string; email: string; phone: string | null; work: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(preview: string, title: string, content: string, footer: string) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f1eb;color:#233d49">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1eb"><tr><td align="center" style="padding:40px 20px">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px">
<tr><td style="padding:0 0 44px"><a href="https://akdenizos.org/"><img src="https://akdenizos.org/assets/brand/logo.png" alt="AkdenizOS" width="204" height="48" style="display:block;width:204px;height:48px;border:0"></a></td></tr>
<tr><td><h1 style="margin:0 0 28px;font:normal 38px/1.15 Georgia,serif;letter-spacing:0">${title}</h1>
<div style="font:16px/1.75 Arial,sans-serif">${content}</div></td></tr>
<tr><td style="padding:40px 0 0;font:13px/1.65 Arial,sans-serif;color:#5e6d72">${footer}<p style="margin:20px 0 0"><a href="https://akdenizos.org/" style="color:#233d49">akdenizos.org</a><br>Antalya’da girişim, teknoloji ve iş birliği.</p></td></tr>
</table></td></tr></table></body></html>`;
}

export function applicationEmails(from: string, row: Application) {
  const name = escapeHtml(row.name);
  const field = (label: string, value: string) => `<p style="margin:0 0 20px"><span style="font-size:12px;color:#5e6d72">${label}</span><br><span style="overflow-wrap:anywhere">${escapeHtml(value).replace(/\n/g, "<br>")}</span></p>`;
  return [
    {
      from, to: [row.email], reply_to: "contact@efekurucay.com",
      subject: "AkdenizOS · Katılım isteğini aldık",
      text: `Merhaba ${row.name},\n\nKatılım isteğin bize ulaştı. Paylaştığın bilgileri inceleyip sonraki adımı bu e-posta adresine ileteceğiz.\n\nBu kayıt otomatik üyelik veya bir gruba eklenme anlamına gelmez.\n\nBu isteği sen göndermediysen ya da bilgilerini sildirmek istersen bu e-postayı yanıtlayabilirsin.\n\nAkdenizOS\nhttps://akdenizos.org`,
      html: layout("Katılım isteğin bize ulaştı. İyi ki geldin.", "İyi ki geldin.",
        `<p style="margin:0 0 20px">Merhaba ${name},</p><p style="margin:0 0 20px">Katılım isteğin bize ulaştı. Paylaştığın bilgileri inceleyip sonraki adımı bu e-posta adresine ileteceğiz.</p><p style="margin:0 0 28px">Antalya’da birlikte yapacak çok iş var.</p><a href="https://akdenizos.org/" style="display:inline-block;padding:13px 22px;background:#233d49;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold">AkdenizOS’a göz at ↗</a>`,
        "Bu kayıt otomatik üyelik veya bir gruba eklenme anlamına gelmez. Bu isteği sen göndermediysen ya da bilgilerini sildirmek istersen bu e-postayı yanıtlayabilirsin."),
    },
    {
      from, to: ["contact@efekurucay.com"], reply_to: row.email,
      subject: `AkdenizOS · Yeni başvuru: ${row.name}`,
      text: `Yeni katılım isteği\n\nAd: ${row.name}\nE-posta: ${row.email}\nTelefon: ${row.phone || "Paylaşılmadı"}\n\nNe yapıyor?\n${row.work}\n\nBu e-postayı yanıtlayarak başvurana ulaşabilirsin.\nBaşvuru: ${row.id}`,
      html: layout(`${row.name} topluluğa katılmak istiyor.`, "Biri daha aramıza katılmak istiyor.",
        field("AD", row.name) + field("E-POSTA", row.email) + field("TELEFON", row.phone || "Paylaşılmadı") + field("NE YAPIYOR?", row.work),
        `Bu e-postayı yanıtlayarak doğrudan başvurana ulaşabilirsin.<br>Başvuru: ${escapeHtml(row.id)}`),
    },
  ];
}
