import { test } from "node:test";
import assert from "node:assert/strict";
import { applicationEmails } from "../src/emails";

test("applicant content is escaped and private notification is separate", () => {
  const emails = applicationEmails("AkdenizOS <merhaba@akdenizos.org>", {
    id: "test-id", name: "<Efe>", email: "efe@example.com", phone: null,
    work: '<img src=x onerror="bad()">\nBir ürün geliştiriyorum.',
  });
  assert.doesNotMatch(emails[0].html, /onerror/);
  assert.doesNotMatch(emails[1].html, /<img src=x/);
  assert.match(emails[1].html, /&lt;img src=x/);
  assert.match(emails[1].html, /<br>Bir ürün/);
  assert.match(emails[1].text, /Telefon: Paylaşılmadı/);
  assert.equal(emails[1].reply_to, "efe@example.com");
  assert.deepEqual(emails[1].to, ["contact@efekurucay.com"]);
});
