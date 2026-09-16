/* ============================================================
   SHOWCASE — AkdenizOS

   Cards come from showcase.json, which is the source of truth for
   what is listed and how it looks. GitHub is only asked for the
   parts that change on their own — stars, language, avatar — in a
   single search request covering every repo at once, so adding
   projects does not add requests. If that call fails the cards
   still render; they just carry no counts.
   ============================================================ */

(function () {
  "use strict";

  const grid = document.getElementById("showcase");
  if (!grid) return;

  const ADD_HREF =
    "https://github.com/AkdenizOS/AkdenizOS.github.io/blob/main/showcase.json";
  const PALETTE = ["navy", "sea", "teal", "moss", "amber", "sun", "rust", "plum"];

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const buildCard = (project) => {
    const card = el("a", "sc-card");
    card.href = `https://github.com/${project.repo}`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.dataset.color = PALETTE.includes(project.color) ? project.color : "navy";
    card.dataset.repo = project.repo;

    card.append(
      el("h3", "sc-card__title", project.title || project.repo.split("/")[1]),
      el("p", "sc-card__blurb", project.blurb || "")
    );

    if (Array.isArray(project.tags) && project.tags.length) {
      const tags = el("div", "sc-card__tags");
      project.tags.slice(0, 4).forEach((t) => tags.append(el("span", "sc-card__tag", t)));
      card.append(tags);
    }

    /* Filled in once GitHub answers; stays empty if it does not. */
    card.append(el("div", "sc-card__meta"));
    return card;
  };

  const buildAddCard = () => {
    const card = el("a", "sc-card sc-card--add");
    card.href = ADD_HREF;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.append(
      el("span", "sc-card__plus", "+"),
      el("h3", "sc-card__title", "Add yours"),
      el(
        "p",
        "sc-card__blurb",
        "Built something outside coursework? Open a pull request and it appears here."
      )
    );
    return card;
  };

  const decorate = (card, repo) => {
    const meta = card.querySelector(".sc-card__meta");
    if (!meta) return;
    meta.replaceChildren();

    if (repo.language) {
      const lang = el("span", "sc-card__lang");
      lang.append(el("span", "sc-card__dot"), document.createTextNode(repo.language));
      meta.append(lang);
    }

    if (repo.stargazers_count > 0) {
      meta.append(el("span", null, `★ ${repo.stargazers_count}`));
    }

    const owner = el("span", "sc-card__owner");
    if (repo.owner && repo.owner.avatar_url) {
      const img = el("img", "sc-card__avatar");
      img.src = `${repo.owner.avatar_url}&s=36`;
      img.alt = "";
      img.width = 18;
      img.height = 18;
      img.decoding = "async";
      owner.append(img);
    }
    owner.append(document.createTextNode(`@${repo.owner ? repo.owner.login : ""}`));
    meta.append(owner);
  };


  /* Students share a campus IP and GitHub allows 60 unauthenticated
     requests an hour per address, so repeat visits read from the tab's
     own cache rather than spending a request each time. */
  const CACHE_KEY = "akdenizos:showcase-meta";
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

  /* One search request carries every repo, so the number of API calls
     does not grow with the number of projects. */
  const enrich = (projects) => {
    const query = projects.map((p) => `repo:${p.repo}`).join("+");
    const url =
      `https://api.github.com/search/repositories?q=${query}&per_page=100`;

    const hit = cached();
    const source = hit
      ? Promise.resolve(hit)
      : fetch(url, { headers: { Accept: "application/vnd.github+json" } })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then((data) => remember(data.items || []));

    return source
      .then((items) => {
        const byName = new Map(items.map((r) => [r.full_name.toLowerCase(), r]));
        grid.querySelectorAll(".sc-card[data-repo]").forEach((card) => {
          const repo = byName.get(card.dataset.repo.toLowerCase());
          if (repo) decorate(card, repo);
        });
      })
      .catch(() => {
        /* Counts are a nicety; the cards are already on screen. */
      });
  };

  fetch("showcase.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      const projects = (data && data.projects) || [];
      grid.replaceChildren(...projects.map(buildCard), buildAddCard());
      if (projects.length) enrich(projects);
    })
    .catch(() => {
      grid.replaceChildren(
        el(
          "p",
          "showcase__status",
          "The project list could not be loaded. It lives in showcase.json on GitHub."
        ),
        buildAddCard()
      );
    });
})();
