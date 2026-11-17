(() => {
  "use strict";

  const key = "akdenizos-theme";
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  const validTheme = (value) => value === "light" || value === "sunset" || value === "dark";

  let preference = null;
  const istanbulHour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul", hour: "2-digit", hourCycle: "h23",
  });
  const apply = (value) => {
    preference = validTheme(value) ? value : null;
    const hour = Number(istanbulHour.format(new Date()));
    const scene = preference ? (preference === "dark" ? "night" : preference === "sunset" ? "sunset" : "day")
      : hour < 7 || hour >= 20 ? "night" : hour >= 17 ? "sunset" : "day";
    root.dataset.scene = scene;
    root.dataset.theme = scene === "night" ? "dark" : "light";
    if (meta) meta.content = root.dataset.theme;
  };

  try {
    apply(localStorage.getItem(key));
  } catch {
    apply(null);
  }

  const initializeControls = () => {
    document.querySelectorAll("[data-theme-controls]").forEach((element) => {
      element.hidden = false;
    });
    const toggles = document.querySelectorAll("[data-theme-toggle]");
    const selects = document.querySelectorAll("[data-theme-select]");
    const trigger = document.querySelector("[data-scene-trigger]");
    const menu = document.querySelector("[data-scene-menu]");
    const choices = document.querySelectorAll("[data-scene-choice]");
    const labels = { day: "Gündüz", sunset: "Gün batımı", night: "Gece" };
    const glyphs = { day: "☀︎", sunset: "◐", night: "☾" };
    const resolvedTheme = () => root.dataset.theme;
    const update = () => {
      if (trigger) {
        const scene = root.dataset.scene;
        trigger.querySelector("[data-scene-label]").textContent = labels[scene];
        trigger.querySelector("[data-scene-glyph]").textContent = preference ? glyphs[scene] : "◷";
        trigger.setAttribute("aria-label", `Görünüm: ${labels[scene]}. ${preference ? "Elle seçildi" : "Otomatik, İstanbul saati"}`);
      }
      choices.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.sceneChoice === (preference || "auto"))));
      toggles.forEach((button) => {
        button.hidden = false;
        button.setAttribute(
          "aria-label",
          resolvedTheme() === "dark" ? "Açık temaya geç" : "Koyu temaya geç",
        );
      });
      selects.forEach((select) => {
        select.value = preference || "auto";
      });
    };
    const setTheme = (value) => {
      apply(value);
      try {
        if (validTheme(value)) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
      } catch {}
      update();
    };
    toggles.forEach((button) =>
      button.addEventListener("click", () => {
        const target = resolvedTheme() === "dark" ? "light" : "dark";
        setTheme(target);
      }),
    );
    selects.forEach((select) =>
      select.addEventListener("change", () => setTheme(select.value)),
    );
    if (trigger && menu) {
      const supported = "showPopover" in HTMLElement.prototype;
      trigger.hidden = !supported;
      document.querySelector("[data-scene-fallback]").hidden = supported;
      menu.hidden = !supported;
      if (supported) {
        const position = () => {
          const box = trigger.getBoundingClientRect();
          menu.style.top = `${box.bottom + 8}px`;
          menu.style.left = `${Math.max(16, Math.min(box.right - 224, window.innerWidth - 240))}px`;
        };
        menu.addEventListener("beforetoggle", event => { if (event.newState === "open") position(); });
        window.addEventListener("resize", () => { if (menu.matches(":popover-open")) position(); });
        choices.forEach(button => button.addEventListener("click", () => {
          setTheme(button.dataset.sceneChoice);
          menu.hidePopover();
          trigger.focus({ preventScroll: true });
        }));
      }
    }
    window.addEventListener("storage", (event) => {
      if (event.key === key || event.key === null) {
        apply(event.newValue);
        update();
      }
    });
    const followClock = () => {
      if (preference || document.hidden) return;
      apply(null);
      update();
    };
    setInterval(followClock, 60_000);
    document.addEventListener("visibilitychange", followClock);
    update();
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initializeControls, {
      once: true,
    });
  else initializeControls();
})();
