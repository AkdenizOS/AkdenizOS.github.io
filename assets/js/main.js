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

  repoYears.forEach((year, index) => {
    const header = year.querySelector(".repo-year__header");
    const grid = year.querySelector(".repo-year__grid");
    if (!header || !grid) return;

    const setState = (isOpen) => {
      year.classList.toggle("is-collapsed", !isOpen);
      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-expanded", String(isOpen));
      grid.hidden = !isOpen;
    };

    setState(index === 0);

    const toggleYear = () => {
      const isOpen = header.getAttribute("aria-expanded") === "true";

      if (!isOpen) {
        repoYears.forEach((otherYear) => {
          if (otherYear === year) return;
          const otherHeader = otherYear.querySelector(".repo-year__header");
          const otherGrid = otherYear.querySelector(".repo-year__grid");
          if (!otherHeader || !otherGrid) return;
          otherYear.classList.add("is-collapsed");
          otherHeader.setAttribute("aria-expanded", "false");
          otherGrid.hidden = true;
        });
      }

      setState(!isOpen);
    };

    header.addEventListener("click", toggleYear);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleYear();
      }
    });
  });
})();
