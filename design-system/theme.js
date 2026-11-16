(() => {
  "use strict";

  const key = "akdenizos-theme";
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  const system = matchMedia("(prefers-color-scheme: dark)");
  const validTheme = (value) => value === "light" || value === "dark";

  const apply = (value) => {
    if (validTheme(value)) root.dataset.theme = value;
    else delete root.dataset.theme;
    if (meta) meta.content = validTheme(value) ? value : "light dark";
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
    const resolvedTheme = () =>
      root.dataset.theme || (system.matches ? "dark" : "light");
    const update = () => {
      toggles.forEach((button) => {
        button.hidden = false;
        button.setAttribute(
          "aria-label",
          resolvedTheme() === "dark" ? "Açık temaya geç" : "Koyu temaya geç",
        );
      });
      selects.forEach((select) => {
        select.value = root.dataset.theme || "system";
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
        setTheme(
          target === (system.matches ? "dark" : "light") ? null : target,
        );
      }),
    );
    selects.forEach((select) =>
      select.addEventListener("change", () => setTheme(select.value)),
    );
    system.addEventListener("change", update);
    window.addEventListener("storage", (event) => {
      if (event.key === key || event.key === null) {
        apply(event.newValue);
        update();
      }
    });
    update();
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initializeControls, {
      once: true,
    });
  else initializeControls();
})();
