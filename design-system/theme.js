(() => {
  "use strict";

  const key = "akdenizos-theme";
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  const validTheme = (value) => value === "light" || value === "dark";

  const apply = (value) => {
    root.dataset.theme = validTheme(value) ? value : "light";
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
    const resolvedTheme = () => root.dataset.theme;
    const update = () => {
      toggles.forEach((button) => {
        button.hidden = false;
        button.setAttribute(
          "aria-label",
          resolvedTheme() === "dark" ? "Açık temaya geç" : "Koyu temaya geç",
        );
      });
      selects.forEach((select) => {
        select.value = root.dataset.theme;
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
