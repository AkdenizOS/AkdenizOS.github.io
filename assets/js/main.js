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
})();
