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

  /* The same module feeds two surfaces: the full grid on showcase.html
     and a short scroll-snap strip on the landing page. */
  const grid = document.getElementById("showcase");
  const strip = document.getElementById("showcase-strip");
  const mount = grid || strip;
  if (!mount) return;

  const STRIP_COUNT = 6;
  const STRIP_SPEED = 26; /* px per second — slow enough to read */

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
    /* A project that runs somewhere is more worth opening than its source. */
    card.href = project.url || `https://github.com/${project.repo}`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.dataset.color = PALETTE.includes(project.color) ? project.color : "navy";
    card.dataset.repo = project.repo;

    card.append(
      el("h3", "sc-card__title", project.title || project.repo.split("/")[1]),
      el("p", "sc-card__blurb", project.blurb || "")
    );

    if (project.url) {
      card.dataset.live = "";
      card.append(el("span", "sc-card__live", "live ↗"));
    }

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
     own cache rather than spending a request each time.

     The key includes the repo set: the landing strip asks about six
     projects and the full grid about all of them, and a shared key
     would leave the grid rendering the strip's smaller answer. */
  const CACHE_TTL = 30 * 60 * 1000;

  const keyFor = (repos) => {
    const joined = repos.join(",");
    let hash = 0;
    for (let i = 0; i < joined.length; i += 1) {
      hash = (hash * 31 + joined.charCodeAt(i)) | 0;
    }
    return `akdenizos:showcase-meta:${repos.length}:${(hash >>> 0).toString(36)}`;
  };

  const cached = (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { at, data } = JSON.parse(raw);
      return Date.now() - at < CACHE_TTL ? data : null;
    } catch (e) {
      return null;
    }
  };

  const remember = (key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
    } catch (e) {
      /* private mode or quota — the network path still works */
    }
    return data;
  };

  /* Search carries many repos per request, so the call count grows in
     chunks rather than per project. The chunk size keeps the query
     inside GitHub's length limit. */
  const CHUNK = 20;

  const fetchChunk = (repos) => {
    const query = repos.map((name) => `repo:${name}`).join("+");
    return fetch(
      `https://api.github.com/search/repositories?q=${query}&per_page=100`,
      { headers: { Accept: "application/vnd.github+json" } }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => data.items || []);
  };

  const enrich = (projects) => {
    const repos = projects.map((p) => p.repo);
    const key = keyFor(repos);

    const hit = cached(key);
    let source;
    if (hit) {
      source = Promise.resolve(hit);
    } else {
      const chunks = [];
      for (let i = 0; i < repos.length; i += CHUNK) {
        chunks.push(repos.slice(i, i + CHUNK));
      }
      source = Promise.all(chunks.map(fetchChunk)).then((groups) =>
        remember(key, [].concat.apply([], groups))
      );
    }

    return source
      .then((items) => {
        const byName = new Map(items.map((r) => [r.full_name.toLowerCase(), r]));
        mount.querySelectorAll(".sc-card[data-repo]").forEach((card) => {
          const repo = byName.get(card.dataset.repo.toLowerCase());
          if (repo) decorate(card, repo);
        });
      })
      .catch(() => {
        /* Counts are a nicety; the cards are already on screen. */
      });
  };

  /* Continuous drift rather than a slide-at-a-time carousel: nothing is
     hidden behind a slide, and because it moves the scroll position of a
     real scroll container, dragging and swiping keep working.

     It pauses on hover, on keyboard focus, while a pointer is down, when
     the tab is hidden, and whenever the reader asks it to. It never
     starts at all under prefers-reduced-motion. */
  const startMarquee = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const toggle = document.getElementById("strip-toggle");

    /* A second copy makes the wrap seamless. It is decorative — screen
       readers and the tab order see the originals only. */
    const originals = Array.from(strip.children);
    const clones = originals.map((card) => {
      const copy = card.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.tabIndex = -1;
      return copy;
    });
    strip.append(...clones);

    /* Snapping fights a scrollLeft written every frame — but a reader who
       asked for less motion never gets that loop, so they keep the snap. */
    if (!reduced.matches) strip.style.scrollSnapType = "none";

    let paused = reduced.matches;
    let holds = 0;
    let last = null;
    let position = strip.scrollLeft;

    /* The loop length is the distance to the matching clone, not half the
       scroll width: scrollWidth also carries the container's padding and
       the two halves are separated by one extra gap, so halving it drifts
       by a few pixels and the wrap visibly jumps. */
    let cycle = 0;
    const measure = () => {
      const first = strip.children[0];
      const twin = strip.children[originals.length];
      cycle = first && twin ? twin.offsetLeft - first.offsetLeft : 0;
    };

    /* One loop that runs for the life of the page and decides each frame
       whether to advance. Earlier this juggled start/stop calls against a
       set of flags, and a single missed transition left it stopped for
       good with no way back. */
    const frame = (now) => {
      requestAnimationFrame(frame);

      const still = paused || holds > 0 || document.hidden || cycle <= 0;
      if (still) {
        last = null;
        return;
      }

      if (last == null) {
        last = now;
        position = strip.scrollLeft;
        return;
      }

      position += (STRIP_SPEED * (now - last)) / 1000;
      last = now;

      if (position >= cycle) position -= cycle;
      strip.scrollLeft = position;
    };

    const label = () => {
      if (!toggle) return;
      toggle.textContent = paused ? "// play" : "// pause";
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute(
        "aria-label",
        paused ? "Let the project strip scroll" : "Pause the project strip"
      );
    };

    /* Hovering, focusing or dragging holds it still; counting rather than
       flagging means an unmatched leave cannot strand it. */
    ["pointerenter", "focusin", "pointerdown", "touchstart"].forEach((e) =>
      strip.addEventListener(e, () => { holds += 1; }, { passive: true })
    );
    ["pointerleave", "focusout", "pointerup", "touchend", "touchcancel"].forEach((e) =>
      strip.addEventListener(e, () => { holds = Math.max(0, holds - 1); }, { passive: true })
    );

    window.addEventListener("resize", measure, { passive: true });

    reduced.addEventListener("change", (e) => {
      paused = e.matches;
      label();
    });

    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener("click", () => {
        paused = !paused;
        label();
      });
    }

    measure();
    label();
    requestAnimationFrame(frame);
  };

  fetch("showcase.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      const all = (data && data.projects) || [];

      /* Entries are appended, so the newest sit at the end of the file. */
      const projects = strip ? all.slice(-STRIP_COUNT).reverse() : all;

      mount.replaceChildren(
        ...projects.map(buildCard),
        ...(grid ? [buildAddCard()] : [])
      );
      if (projects.length) enrich(projects);
      if (strip && projects.length) startMarquee();
    })
    .catch(() => {
      if (strip) {
        const section = strip.closest("[data-showcase-strip]");
        if (section) section.remove();
        return;
      }
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
