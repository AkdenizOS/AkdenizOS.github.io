import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import handler, {           sendApplicationEmails } from "../src/index";
import config from "../cloudflare.config";

test("application storage, abuse protection and durable receipts", async (t) => {
  const mf = new Miniflare({ workers: [{ config: { name: "test", compatibilityDate: "2026-11-16", env: {DB: {type: "d1", name: "test"}}, manifest: { mainModule: "index.js", modules: {"index.js": {type: "esm", contents: "export default {fetch(){return new Response('ok')}}"}}} } }] });
  const db = await mf.getD1Database("DB");
  const schema = await readFile(new URL("../schema.sql", import.meta.url), "utf8");
  // D1 exec expects each statement on a single line.
  await db.exec(schema.replace(/\n/g, " "));
  const settings = config.worker.env;
  let allowRate = true;
  let allowToken = true;
  let hostname = "akdenizos.org";
  let failEmail = false;
  const sent                                  = [];
  const env      = {
    DB: db,
    SUBMISSIONS: { limit: async () => ({ success: allowRate }) },
    SITE_ORIGINS: settings.SITE_ORIGINS.value,
    TURNSTILE_SITE_KEY: settings.TURNSTILE_SITE_KEY.value,
    TURNSTILE_HOSTNAMES: settings.TURNSTILE_HOSTNAMES.value,
    TURNSTILE_SECRET_KEY: "test-secret",
    RESEND_API_KEY: "test-secret",
    EMAIL_FROM: settings.EMAIL_FROM.value,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("siteverify"))
      return Response.json({ success: allowToken, hostname, action: "join" });
    assert.equal(String(input), "https://api.resend.com/emails/batch");
    if (failEmail) return Response.json({ error: "test" }, { status: 503 });
    const body = JSON.parse(String(init?.body));
    sent.push({ key: new Headers(init?.headers).get("Idempotency-Key") , emails: body });
    return Response.json({ id: "test-email" });
  };
  const pending                     = [];
  const ctx = { waitUntil(promise                  ) { pending.push(promise); }, passThroughOnException() {}, exports: {}, props: {}, mapVirtualHost() { throw new Error("unused"); }, abort() {}, enableInstantLogs() {} }                           ;
  const body = { name: "<Efe>", email: "EFE@example.com", phone: "0532 123 45 67", work: "Antalya’da bir ürün geliştiriyorum.", token: "test-token", website: "", noticeVersion: "2026-11-17" };
  const request = (value          = body, origin = "https://akdenizos.org") => new Request("https://api.akdenizos.org/applications", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": "192.0.2.1" }, body: JSON.stringify(value),
  });
  const submit = async (req         ) => {
    const response = await handler.fetch(req                                                 , env, ctx);
    await Promise.all(pending.splice(0));
    return response;
  };
  try {
    await t.test("same-origin configuration does not require an Origin header", async () => {
      const response = await handler.fetch(new Request("https://akdenizos.org/api/config"), env, ctx);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).sitekey, settings.TURNSTILE_SITE_KEY.value);
    });
    await t.test("untrusted origins and bad fields cannot write", async () => {
      assert.equal((await submit(request(body, "https://other.example"))).status, 403);
      assert.equal((await submit(request({ ...body, email: "bad" }))).status, 400);
      assert.equal((await submit(request({ ...body, phone: "123" }))).status, 400);
      assert.equal((await submit(request({ ...body, website: "bot" }))).status, 400);
      assert.equal((await submit(request({ ...body, work: "x".repeat(9000) }))).status, 413);
      assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM applications").first("n"), 0);
    });
    await t.test("rate limit and verified hostname are enforced", async () => {
      allowRate = false; assert.equal((await submit(request())).status, 429); allowRate = true;
      allowToken = false; assert.equal((await submit(request())).status, 400); allowToken = true;
      hostname = "other.example"; assert.equal((await submit(request())).status, 400); hostname = "akdenizos.org";
    });
    await t.test("saved once, canonical email, optional phone, escaped email HTML", async () => {
      assert.equal((await submit(request())).status, 202);
      const row = await db.prepare("SELECT * FROM applications").first();
      assert.equal(row?.email, "efe@example.com");
      assert.equal(row?.phone, "0532 123 45 67");
      assert.equal(row?.mail_status, "sent");
      assert.equal(sent.length, 1);
      assert.match(sent[0].emails[0].html, /&lt;Efe&gt;/);
      assert.equal(sent[0].emails.length, 2);
      assert.deepEqual(sent[0].emails[0].to, ["efe@example.com"]);
      const notification = sent[0].emails[1];
      assert.deepEqual(notification.to, ["contact@efekurucay.com"]);
      assert.equal(notification.reply_to, "efe@example.com");
      assert.match(notification.html, /&lt;Efe&gt;/);
      assert.match(notification.text, /0532 123 45 67/);
      assert.match(notification.text, /Antalya’da bir ürün geliştiriyorum/);
      for (const email of sent[0].emails) assert.match(email.html, /https:\/\/akdenizos.org\/assets\/brand\/logo.png/);
      assert.equal((await submit(request())).status, 202);
      assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM applications").first("n"), 1);
      assert.equal(sent.length, 1);
      assert.equal((await submit(request({ ...body, email: "optional@example.com", phone: "" }))).status, 202);
      assert.equal(await db.prepare("SELECT phone FROM applications WHERE email = 'optional@example.com'").first("phone"), null);
    });
    await t.test("email failure preserves application, retry uses one atomic lease", async () => {
      failEmail = true;
      assert.equal((await submit(request({ ...body, email: "retry@example.com" }))).status, 202);
      const row = await db.prepare("SELECT id, mail_status FROM applications WHERE email = 'retry@example.com'").first                                     ();
      assert.equal(row?.mail_status, "pending");
      assert.ok(row);
      failEmail = false;
      await db.prepare("UPDATE applications SET mail_next_at = 0 WHERE id = ?").bind(row.id).run();
      const before = sent.length;
      await Promise.all([sendApplicationEmails(env, row.id), sendApplicationEmails(env, row.id)]);
      assert.equal(sent.length, before + 1);
      assert.equal(await db.prepare("SELECT mail_status FROM applications WHERE id = ?").bind(row.id).first("mail_status"), "sent");
      assert.equal(sent.at(-1)?.key, `application-emails/${row.id}`);
    });
  } finally { globalThis.fetch = originalFetch; await mf.dispose(); }
});
