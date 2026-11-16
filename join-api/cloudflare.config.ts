import { bindings, defineConfig, triggers } from "cf/config";

export default defineConfig({
  accountId: "c8da06f694cb4256ba63bc4f477f4253",
  worker: {
    name: "akdenizos-join",
    entrypoint: "./src/index.ts",
    compatibilityDate: "2026-11-16",
    observability: { enabled: true, traces: { enabled: true } },
    domains: [{ hostname: "api.akdenizos.org", production: true, previews: false }],
    env: {
      DB: bindings.d1({ id: "f0c511c6-713a-49de-8b1a-786069f27466", name: "akdenizos-join" }),
      SUBMISSIONS: bindings.rateLimit({ namespace: "1172026", simple: { limit: 5, period: 60 } }),
      SITE_ORIGINS: bindings.text("https://akdenizos.org,https://www.akdenizos.org,http://127.0.0.1:4173,http://localhost:4173"),
      TURNSTILE_SITE_KEY: bindings.text("0x4AAAAAAGEOF2kS2jPYfFDF"),
      TURNSTILE_HOSTNAMES: bindings.text("akdenizos.org,www.akdenizos.org,localhost,127.0.0.1"),
      TURNSTILE_SECRET_KEY: bindings.secret(),
      RESEND_API_KEY: bindings.secret(),
      EMAIL_FROM: bindings.text("AkdenizOS <merhaba@akdenizos.org>"),
    },
    triggers: [
      triggers.fetch({ pattern: "akdenizos.org/api/*", zone: "akdenizos.org" }),
      triggers.scheduled({ schedule: "*/5 * * * *" }),
    ],
  },
});
