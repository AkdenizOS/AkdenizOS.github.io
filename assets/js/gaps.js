/* ============================================================
   COVERAGE & GAPS — AkdenizOS

   A course repository can exist and still be empty, which is the
   least useful thing the index can do to someone: promise material
   and deliver a blank page. This reads repository sizes from the
   org listing and turns that into two things —

     · on contribute.html, the list of courses with nothing in them,
       which is the most concrete answer to "what can I do?"
     · on repos.html, a marker on rows that lead nowhere yet

   Names come from AKDENIZ_REPOS (search-data.js) so there is no
   second copy of the course list to keep in step. Two requests
   cover the whole org; if either fails the sections simply do not
   appear.
   ============================================================ */

(function () {
  "use strict";

  const board = document.getElementById("gaps");
  const rows = document.querySelectorAll(".repo-row[href]");
  if (!board && !rows.length) return;

  const section = board ? board.closest("[data-gaps-section]") : null;
  const COURSE_RE = /^[A-Z]{3}-\d/;
  const EMPTY_KB = 1;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  /* search-data.js is loaded alongside this on both pages that use it. */
  const nameBySlug = new Map();
  if (typeof AKDENIZ_REPOS !== "undefined") {
    AKDENIZ_REPOS.forEach((r) => {
      const slug = r.url.split("/").pop();
      nameBySlug.set(slug.toLowerCase(), { code: r.code, name: r.name });
    });
  }

  const prettify = (slug) =>
    slug.replace(/^[A-Z]{3}-\d{3}[A-Z]?-/, "").replace(/[-_]/g, " ");


  /* Students share a campus IP and GitHub allows 60 unauthenticated
     requests an hour per address, so repeat visits read from the tab's
     own cache rather than spending a request each time. */
  const CACHE_KEY = "akdenizos:org-repos";
  const CACHE_TTL = 30 * 60 * 1000;

  const cached = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { at, data } = JSON.parse(raw);
      return Date.now() - at < CACHE_TTL ? data : null;
    } catch (e) {
      return null;
    }
  };

  const remember = (data) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
    } catch (e) {
      /* private mode or quota — the network path still works */
    }
    return data;
  };

  const page = (n) =>
    fetch(`https://api.github.com/orgs/AkdenizOS/repos?per_page=100&page=${n}`, {
      headers: { Accept: "application/vnd.github+json" }
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

  const renderBoard = (empty, total) => {
    if (!board) return;

    const covered = total - empty.length;
    const percent = total ? Math.round((covered / total) * 100) : 0;

    const bar = el("div", "coverage");
    const track = el("div", "coverage__track");
    const fill = el("div", "coverage__fill");
    fill.style.width = `${percent}%`;
    track.append(fill);
    bar.append(
      track,
      el("p", "coverage__label", `${covered} of ${total} courses have material`)
    );

    const list = el("div", "gaps__list");
    empty.forEach((repo) => {
      const known = nameBySlug.get(repo.name.toLowerCase());
      const row = el("a", "gaps__row");
      row.href = repo.html_url;
      row.target = "_blank";
      row.rel = "noopener noreferrer";
      row.append(
        el("span", "gaps__code", known ? known.code : repo.name.split("-").slice(0, 2).join("-")),
        el("span", "gaps__name", known ? known.name : prettify(repo.name)),
        el("span", "gaps__flag", "empty")
      );
      list.append(row);
    });

    board.replaceChildren(bar, list);

    const count = document.getElementById("gaps-count");
    if (count) {
      count.textContent =
        empty.length === 1
          ? "One course has nothing in it yet."
          : `${empty.length} courses have nothing in them yet.`;
    }
  };

  const markRows = (emptySlugs) => {
    rows.forEach((row) => {
      const slug = row.getAttribute("href").split("/").pop();
      if (!emptySlugs.has(slug.toLowerCase())) return;
      row.classList.add("repo-row--empty");
      const name = row.querySelector(".repo-row__name");
      if (name && !row.querySelector(".repo-row__flag")) {
        name.after(el("span", "repo-row__flag", "empty"));
      }
    });
  };

  const load = () => {
    const hit = cached();
    if (hit) return Promise.resolve(hit);
    return Promise.all([page(1), page(2)]).then(([a, b]) =>
      remember(
        [].concat(a, b)
          .filter((r) => COURSE_RE.test(r.name))
          .map((r) => ({ name: r.name, size: r.size, html_url: r.html_url }))
      )
    );
  };

  load()
    .then((all) => {
      if (!all.length) throw new Error("no course repos");

      const empty = all
        .filter((r) => r.size <= EMPTY_KB)
        .sort((x, y) => x.name.localeCompare(y.name));

      renderBoard(empty, all.length);
      markRows(new Set(empty.map((r) => r.name.toLowerCase())));
    })
    .catch(() => {
      /* Rate limited or offline — better to show nothing than a
         half-built list that implies the gaps are gone. */
      if (section) section.remove();
    });
})();
