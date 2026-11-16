import type { InferEnv } from "cf/config";
import type config from "../cloudflare.config";

export type Env = InferEnv<typeof config.worker>;
type Application = { id: string; name: string; email: string; mail_attempts: number };
const NOTICE_VERSION = "2026-11-17";

class RequestError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

async function readInput(request: Request) {
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json")
    throw new RequestError(415, "content_type");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "invalid_input");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new RequestError(413, "too_large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let input: unknown;
  try { input = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new RequestError(400, "invalid_input"); }
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new RequestError(400, "invalid_input");
  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneDigits = phone.replace(/\D/g, "");
  const work = typeof body.work === "string" ? body.work.trim() : "";
  const token = typeof body.token === "string" ? body.token : "";
  if (name.length < 2 || name.length > 80 || /[\x00-\x1f]/.test(name)
    || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || (phone && (!/^\+?[0-9 ()-]+$/.test(phone) || phone.length > 30 || phoneDigits.length < 7 || phoneDigits.length > 15))
    || work.length < 10 || work.length > 1200 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(work)
    || !token || token.length > 2048 || body.website || body.noticeVersion !== NOTICE_VERSION)
    throw new RequestError(400, "invalid_input");
  return { name, email, phone: phone || null, work, token };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendReceipt(env: Env, id: string) {
  const now = Math.floor(Date.now() / 1000);
  // A lease prevents request handling and the scheduled retry from sending concurrently.
  const row = await env.DB.prepare(`UPDATE applications
    SET mail_lease_until = ?, mail_attempts = mail_attempts + 1
    WHERE id = ? AND mail_status = 'pending' AND mail_attempts < 6
      AND mail_next_at <= ? AND mail_lease_until <= ?
    RETURNING id, name, email, mail_attempts`).bind(now + 120, id, now, now).first<Application>();
  if (!row) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `application-receipt/${row.id}`,
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [row.email],
        reply_to: "contact@efekurucay.com",
        subject: "AkdenizOS · Katılım isteğini aldık",
        text: `Merhaba ${row.name},\n\nAkdenizOS katılım isteğini aldık. Paylaştığın bilgiler kaydedildi. Topluluğa katılımın sonraki adımını bu adrese ileteceğiz.\n\nBu kayıt otomatik üyelik veya bir gruba eklenme anlamına gelmez.\n\nBu isteği sen göndermediysen ya da bilgilerini sildirmek istersen bu e-postayı yanıtlayabilirsin.\n\nAkdenizOS\nhttps://akdenizos.org`,
        html: `<div style="background:#f4f1eb;color:#233d49;padding:40px 28px;font:16px/1.7 Arial,sans-serif"><p style="font:600 28px Georgia,serif">AkdenizOS</p><h1 style="font:500 30px Georgia,serif">Katılım isteğini aldık.</h1><p>Merhaba ${escapeHtml(row.name)},</p><p>Paylaştığın bilgiler kaydedildi. Topluluğa katılımın sonraki adımını bu adrese ileteceğiz.</p><p>Bu kayıt otomatik üyelik veya bir gruba eklenme anlamına gelmez.</p><p style="font-size:13px">Bu isteği sen göndermediysen ya da bilgilerini sildirmek istersen bu e-postayı yanıtlayabilirsin.</p><a style="color:#233d49" href="https://akdenizos.org">akdenizos.org</a></div>`,
      }),
    });
    if (!response.ok) throw new Error(`resend_${response.status}`);
    await env.DB.prepare("UPDATE applications SET mail_status = 'sent', mail_sent_at = ?, mail_lease_until = 0 WHERE id = ?")
      .bind(now, id).run();
    console.log(JSON.stringify({ event: "receipt_sent", applicationId: id }));
  } catch {
    await env.DB.prepare(`UPDATE applications SET mail_status = ?, mail_next_at = ?, mail_lease_until = 0 WHERE id = ?`)
      .bind(row.mail_attempts >= 6 ? "failed" : "pending", now + 60 * 2 ** row.mail_attempts, id).run();
    console.error(JSON.stringify({ event: "receipt_retry", applicationId: id, attempt: row.mail_attempts }));
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.SITE_ORIGINS.split(",").includes(origin);
    const headers = new Headers({ "Cache-Control": "no-store", "Vary": "Origin", "X-Content-Type-Options": "nosniff" });
    if (allowed) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
    }
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
    const path = new URL(request.url).pathname.replace(/^\/api(?=\/)/, "");
    if (path === "/health" && request.method === "GET") return reply({ ok: true });
    if (!allowed) return reply({ error: "origin" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (path === "/config" && request.method === "GET")
      return reply({ sitekey: env.TURNSTILE_SITE_KEY });
    if (path !== "/applications") return reply({ error: "not_found" }, 404);
    if (request.method !== "POST") return reply({ error: "method" }, 405);
    try {
      const ip = request.headers.get("CF-Connecting-IP");
      if (!ip) return reply({ error: "client_ip" }, 400);
      const rate = await env.SUBMISSIONS.limit({ key: ip });
      if (!rate.success) { headers.set("Retry-After", "60"); return reply({ error: "rate_limit" }, 429); }
      const input = await readInput(request);
      const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: input.token, remoteip: ip }),
        signal: AbortSignal.timeout(10000),
      });
      if (!verification.ok) return reply({ error: "verification_unavailable" }, 503);
      const check = await verification.json() as { success?: boolean; hostname?: string; action?: string };
      if (!check.success || check.action !== "join" || !env.TURNSTILE_HOSTNAMES.split(",").includes(check.hostname || ""))
        return reply({ error: "verification" }, 400);
      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);
      const inserted = await env.DB.prepare(`INSERT INTO applications
        (id, email, name, phone, work, created_at, notice_version, mail_next_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING RETURNING id`)
        .bind(id, input.email, input.name, input.phone, input.work, now, NOTICE_VERSION, now).first<{ id: string }>();
      if (inserted) ctx.waitUntil(sendReceipt(env, id).catch(() => console.error(JSON.stringify({ event: "receipt_deferred", applicationId: id }))));
      return reply({ ok: true }, 202);
    } catch (error) {
      if (error instanceof RequestError) return reply({ error: error.code }, error.status);
      console.error(JSON.stringify({ event: "application_failed" }));
      return reply({ error: "unavailable" }, 503);
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil((async () => {
      const now = Math.floor(Date.now() / 1000);
      await env.DB.prepare("UPDATE applications SET mail_status = 'failed' WHERE mail_status = 'pending' AND mail_attempts = 6 AND mail_lease_until <= ?").bind(now).run();
      const due = await env.DB.prepare(`SELECT id FROM applications WHERE mail_status = 'pending'
        AND mail_next_at <= ? AND mail_lease_until <= ? ORDER BY mail_next_at LIMIT 20`).bind(now, now).all<{ id: string }>();
      for (const row of due.results) await sendReceipt(env, row.id);
    })());
  },
} satisfies ExportedHandler<Env>;
