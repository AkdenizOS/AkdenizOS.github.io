(() => {
  "use strict";
  const form = document.querySelector("#join-form");
  const button = document.querySelector("#join-submit");
  const status = document.querySelector("#join-status");
  const verification = document.querySelector("#join-verification");
  const api = new URL(".", form.action).href;
  document.querySelector("#hero-signup").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.querySelector("#hero-email");
    document.querySelector("#join-email").value = email.value.trim();
    const target = form.hidden ? document.querySelector("#join-success") : form;
    if (!form.hidden) document.querySelector("#join-name").focus({ preventScroll: true });
    target.scrollIntoView({ block: "center" });
  });
  let token = "";
  let widget;
  let sending = false;
  let loading = false;

  async function initialize() {
    if (loading || widget !== undefined) return;
    loading = true;
    try {
      const response = await fetch(`${api}config`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("config");
      const { sitekey } = await response.json();
      if (!sitekey) throw new Error("sitekey");
      await new Promise((resolve, reject) => {
        window.akdenizosTurnstileReady = resolve;
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=akdenizosTurnstileReady";
        script.async = true;
        script.onerror = reject;
        document.head.append(script);
      });
      widget = window.turnstile.render(verification, {
        sitekey,
        action: "join",
        theme: "auto",
        size: "flexible",
        callback(value) {
          token = value;
          button.disabled = sending;
          status.textContent = "";
        },
        "expired-callback"() { token = ""; button.disabled = true; },
        "error-callback"() {
          token = "";
          button.disabled = true;
          status.textContent = "Güvenlik kontrolü tamamlanamadı. Bağlantını kontrol edip yeniden dene.";
        },
      });
    } catch {
      status.textContent = "Form yüklenemedi. ";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "join-retry";
      retry.textContent = "Yeniden dene";
      retry.addEventListener("click", () => {
        status.textContent = "Form hazırlanıyor…";
        initialize();
      });
      status.append(retry);
    } finally { loading = false; }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || !token || !form.reportValidity()) return;
    sending = true;
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    status.textContent = "Katılım isteğin gönderiliyor…";
    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          name: data.get("name"), email: data.get("email"), phone: data.get("phone"), work: data.get("work"),
          website: data.get("website"), token, noticeVersion: "2026-11-17",
        }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        const messages = {
          rate_limit: "Kısa sürede çok fazla deneme yaptın. Bir dakika sonra yeniden deneyebilirsin.",
          invalid_input: "Adını, e-posta adresini, telefonunu ve en az 10 karakterlik açıklamanı kontrol et.",
          verification: "Güvenlik kontrolünü yeniden tamamlayıp gönderebilirsin.",
        };
        throw new Error(messages[error] || "Şu an gönderilemiyor. Bilgilerin formda duruyor; birazdan yeniden deneyebilirsin.");
      }
      const result = await response.json();
      if (!result.ok) throw new Error("Gönderim doğrulanamadı; yeniden deneyebilirsin.");
      form.hidden = true;
      const success = document.querySelector("#join-success");
      success.hidden = false;
      success.querySelector("h3").focus();
    } catch (error) {
      status.textContent = error.name === "TypeError" || error.name === "TimeoutError"
        ? "Gönderim sonucunu doğrulayamadık. Bilgilerin formda duruyor; yeniden deneyebilirsin."
        : error.message;
    } finally {
      sending = false;
      token = "";
      form.removeAttribute("aria-busy");
      if (!form.hidden && widget !== undefined) window.turnstile.reset(widget);
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      initialize();
    }, { rootMargin: "300px" });
    observer.observe(form);
  } else initialize();
})();
