/* ============================================================
   MAIN JAVASCRIPT — AkdenizOS
   ============================================================ */

(function () {
  "use strict";

  /* ── Hamburger nav ── */
  const toggle   = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".navbar__links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navLinks.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ── Scroll-reveal ── */
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.08, rootMargin: "0px 0px -36px 0px" }
  );

  document
    .querySelectorAll("[data-scroll]")
    .forEach((el) => observer.observe(el));

  /* ── Navbar scroll shadow ── */
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const onScroll = () => {
      navbar.style.boxShadow =
        window.scrollY > 20
          ? "0 8px 32px rgba(0,0,0,0.55)"
          : "";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── Repository accordion ── */
  const repoYears = Array.from(document.querySelectorAll(".repo-explorer .repo-year"));
  const yearOrder = ["1", "2", "3", "4", "0"];
  const yearMap = new Map();
  const toolbarChips = Array.from(document.querySelectorAll(".repo-toolbar__chip[data-target-year]"));
  const toolbarActions = Array.from(document.querySelectorAll(".repo-toolbar__action[data-repo-action]"));

  const getParts = (yearEl) => ({
    header: yearEl.querySelector(".repo-year__header"),
    grid: yearEl.querySelector(".repo-year__grid")
  });

  const setYearState = (yearEl, isOpen) => {
    const { header, grid } = getParts(yearEl);
    if (!header || !grid) return;
    yearEl.classList.toggle("is-collapsed", !isOpen);
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", String(isOpen));
    grid.hidden = !isOpen;
  };

  const setActiveChip = (yearKey) => {
    toolbarChips.forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.targetYear === String(yearKey));
    });
  };

  const openOnlyYear = (yearKey, shouldScroll = false) => {
    const target = yearMap.get(String(yearKey));
    if (!target) return;

    repoYears.forEach((yearEl) => setYearState(yearEl, yearEl === target));
    setActiveChip(String(yearKey));

    if (shouldScroll) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const expandAllYears = () => {
    repoYears.forEach((yearEl) => setYearState(yearEl, true));
    toolbarChips.forEach((chip) => chip.classList.remove("is-active"));
  };

  const collapseAllYears = () => {
    repoYears.forEach((yearEl) => setYearState(yearEl, false));
    toolbarChips.forEach((chip) => chip.classList.remove("is-active"));
  };

  repoYears.forEach((year, index) => {
    const { header, grid } = getParts(year);
    if (!header || !grid) return;

    const yearKey = yearOrder[index] || String(index + 1);
    year.dataset.year = yearKey;
    yearMap.set(yearKey, year);
    setYearState(year, index === 0);

    const toggleYear = () => {
      const isOpen = header.getAttribute("aria-expanded") === "true";
      openOnlyYear(yearKey, false);
      if (isOpen) {
        setYearState(year, false);
        toolbarChips.forEach((chip) => chip.classList.remove("is-active"));
      } else {
        setActiveChip(yearKey);
      }
    };

    header.addEventListener("click", toggleYear);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleYear();
      }
    });
  });

  toolbarChips.forEach((chip) => {
    chip.addEventListener("click", () => openOnlyYear(chip.dataset.targetYear, true));
  });

  toolbarActions.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.repoAction === "expand-all") expandAllYears();
      if (button.dataset.repoAction === "collapse-all") collapseAllYears();
    });
  });

  document.addEventListener("repo:focus-year", (event) => {
    const year = event.detail?.year;
    if (year != null) openOnlyYear(String(year), true);
  });
})();
