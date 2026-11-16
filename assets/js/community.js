(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const row = document.querySelector(".header-inner");
  const menu = document.querySelector("#site-menu");
  const trigger = document.querySelector(".menu-button");
  const nativePopover = "popover" in HTMLElement.prototype;
  let lastWidth = 0;
  let measuring = false;
  let wide = false;
  let fallbackOpen = false;

  const measureNavigation = () => {
    if (measuring || (!wide && lastWidth && row.clientWidth <= lastWidth))
      return;
    measuring = true;
    const wasOpen = nativePopover
      ? menu.matches(":popover-open")
      : fallbackOpen;
    header.classList.add("is-measuring", "is-wide");
    menu.removeAttribute("popover");
    menu.hidden = false;
    wide = row.scrollWidth <= row.clientWidth;
    header.classList.toggle("is-wide", wide);
    if (!wide) {
      if (nativePopover) {
        menu.setAttribute("popover", "auto");
        if (wasOpen) menu.showPopover();
      } else menu.hidden = !fallbackOpen;
    }
    trigger.setAttribute("aria-expanded", String(!wide && wasOpen));
    lastWidth = row.clientWidth;
    requestAnimationFrame(() => {
      header.classList.remove("is-measuring");
      measuring = false;
    });
  };

  if (nativePopover) {
    menu.addEventListener("toggle", (event) =>
      trigger.setAttribute("aria-expanded", String(event.newState === "open")),
    );
  } else {
    menu.removeAttribute("popover");
    const closeMenu = () => {
      fallbackOpen = false;
      menu.hidden = !wide;
      trigger.setAttribute("aria-expanded", "false");
    };
    trigger.addEventListener("click", () => {
      fallbackOpen = !fallbackOpen;
      menu.hidden = !fallbackOpen;
      trigger.setAttribute("aria-expanded", String(fallbackOpen));
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-nav")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && fallbackOpen) {
        closeMenu();
        trigger.focus();
      }
    });
  }
  menu.addEventListener("click", (event) => {
    if (!event.target.closest("a") || wide) return;
    if (nativePopover) menu.hidePopover();
    else {
      fallbackOpen = false;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }
  });
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(measureNavigation);
    observer.observe(row);
    observer.observe(menu);
  } else window.addEventListener("resize", measureNavigation);
  measureNavigation();
  document.fonts.ready.then(() => {
    lastWidth = 0;
    measureNavigation();
  });

  const copyButton = document.querySelector("#copy-email");
  const copyStatus = document.querySelector("#copy-status");
  if (navigator.clipboard && window.isSecureContext) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("contact@efekurucay.com");
        copyStatus.textContent = "E-posta adresi kopyalandı.";
      } catch {
        copyStatus.textContent =
          "Kopyalanamadı. Adresi seçip elle kopyalayabilirsin.";
      }
    });
  }
})();
