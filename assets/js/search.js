/* ============================================================
   FUZZY SEARCH ENGINE — AkdenizOS
   ============================================================ */

(function () {
  "use strict";

  /* ────────────────────────────────────────────
     1. FUZZY MATCH ALGORITHM
     Returns { score, positions } where positions
     is an array of character indices matched in
     the haystack string.
  ──────────────────────────────────────────── */

  /**
   * Normalise a string: lower-case + collapse
   * Turkish diacritics to ascii equivalents so
   * "ogrenci" finds "Öğrenci".
   */
  function normalise(str) {
    return str
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/â/g, "a")
      .replace(/î/g, "i")
      .replace(/û/g, "u");
  }

  /**
   * Core fuzzy scoring.
   * Returns null if no match, otherwise { score, positions }.
   *
   * Scoring breakdown (higher = better):
   *   - Exact match on full field   → 1000
   *   - Exact match on code field   → 900
   *   - Starts-with match           → 800
   *   - Word-start match            → 700  (e.g. "ml" → "Machine Learning")
   *   - Contains (substring)        → 600
   *   - Fuzzy (chars in order)      → 100 – 500, boosted by:
   *       consecutive run bonus (+10 each)
   *       word-boundary bonus (+30)
   *       shorter gap penalty
   */
  function fuzzyMatch(query, candidate) {
    const q = normalise(query);
    const c = normalise(candidate);

    if (!q) return { score: 0, positions: [] };

    // Exact
    if (c === q) return { score: 1000, positions: [...Array(c.length).keys()] };

    // Starts-with
    if (c.startsWith(q)) {
      return { score: 800, positions: [...Array(q.length).keys()] };
    }

    // Contains (substring)
    const subIdx = c.indexOf(q);
    if (subIdx !== -1) {
      const pos = [];
      for (let i = subIdx; i < subIdx + q.length; i++) pos.push(i);
      return { score: 600 + (100 / (subIdx + 1)), positions: pos };
    }

    // Fuzzy — all chars of q must appear in c in order
    const positions = [];
    let qi = 0;
    let baseScore = 0;
    let consecutiveBonus = 0;
    let prevPos = -1;

    for (let ci = 0; ci < c.length && qi < q.length; ci++) {
      if (c[ci] === q[qi]) {
        positions.push(ci);

        // Consecutive run
        if (ci === prevPos + 1) {
          consecutiveBonus += 15;
        }

        // Word boundary (start of word)
        if (ci === 0 || c[ci - 1] === " " || c[ci - 1] === "-") {
          baseScore += 30;
        }

        prevPos = ci;
        qi++;
      }
    }

    // Not all chars found → no match
    if (qi < q.length) return null;

    // Penalise large gaps (spread = last pos − first pos)
    const spread = positions[positions.length - 1] - positions[0] + 1;
    const density = q.length / spread; // 1.0 = perfectly consecutive

    baseScore += consecutiveBonus + Math.round(density * 60) + 40;

    return { score: Math.min(baseScore, 590), positions };
  }

  /**
   * Search a single repo against a query across
   * code, name, and optional alias fields.
   */
  function scoreRepo(repo, query) {
    const codeMatch  = fuzzyMatch(query, repo.code);
    const nameMatch  = fuzzyMatch(query, repo.name);

    // Also check aliases (defined in search-data.js)
    const aliasStr   = (typeof REPO_ALIASES !== "undefined" && REPO_ALIASES[repo.code]) || "";
    const aliasMatch = aliasStr ? fuzzyMatch(query, aliasStr) : null;

    let best = null;

    if (codeMatch) {
      best = { score: codeMatch.score + 50, field: "code", positions: codeMatch.positions };
    }

    if (nameMatch) {
      const c = { score: nameMatch.score, field: "name", positions: nameMatch.positions };
      if (!best || c.score > best.score) best = c;
    }

    // Alias match boosts the code field display (name is shown highlighted for name match)
    if (aliasMatch) {
      // Give a boost so alias hits surface well, but show code+name normally
      const aliasScore = aliasMatch.score + 80;
      if (!best || aliasScore > best.score) {
        best = { score: aliasScore, field: "name", positions: [] };
      }
    }

    return best;
  }

  /* ────────────────────────────────────────────
     2. HIGHLIGHT HELPER
     Wraps matched char positions in <mark> spans.
  ──────────────────────────────────────────── */

  function highlight(str, positions) {
    if (!positions || positions.length === 0) return escHtml(str);

    const posSet = new Set(positions);
    let html = "";
    let inMark = false;

    for (let i = 0; i < str.length; i++) {
      if (posSet.has(i)) {
        if (!inMark) { html += '<mark class="search-highlight">'; inMark = true; }
        html += escHtml(str[i]);
      } else {
        if (inMark) { html += "</mark>"; inMark = false; }
        html += escHtml(str[i]);
      }
    }

    if (inMark) html += "</mark>";
    return html;
  }

  function escHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ────────────────────────────────────────────
     3. SEARCH FUNCTION
     Returns up to `limit` ranked results.
  ──────────────────────────────────────────── */

  const MAX_RESULTS = 9;

  function search(query) {
    if (!query || query.trim().length < 1) return [];

    const q = query.trim();
    const scored = [];

    for (const repo of AKDENIZ_REPOS) {
      const match = scoreRepo(repo, q);
      if (match) scored.push({ repo, match });
    }

    // Sort: highest score first, then alphabetically by code
    scored.sort((a, b) => {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score;
      return a.repo.code.localeCompare(b.repo.code);
    });

    return scored.slice(0, MAX_RESULTS);
  }

  /* ────────────────────────────────────────────
     4. UI COMPONENT
  ──────────────────────────────────────────── */

  const YEAR_LABELS = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year", 0: "Projects" };

  function buildResultHTML(results, query) {
    if (results.length === 0) {
      return `
        <div class="search-empty">
          <div class="search-empty__icon">⌕</div>
          <p class="search-empty__title">No results for "${escHtml(query)}"</p>
          <p class="search-empty__sub">Try a course code (e.g. CSE-445) or a keyword</p>
        </div>`;
    }

    const rows = results.map(({ repo, match }, idx) => {
      const codeHtml = match.field === "code"
        ? highlight(repo.code, match.positions)
        : escHtml(repo.code);

      const nameHtml = match.field === "name"
        ? highlight(repo.name, match.positions)
        : escHtml(repo.name);

      const yearLabel = repo.year === 0 ? "Project" : `Year ${repo.year}`;

      return `
        <a class="search-result"
           href="${repo.url}"
           target="_blank"
           rel="noopener noreferrer"
           data-idx="${idx}"
           data-year="${repo.year}"
           tabindex="-1"
           aria-label="${escHtml(repo.code)} — ${escHtml(repo.name)}">
          <span class="search-result__code">${codeHtml}</span>
          <span class="search-result__name">${nameHtml}</span>
          <span class="search-result__year">${yearLabel}</span>
          <svg class="search-result__arrow" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </a>`;
    });

    return rows.join("");
  }

  function initSearch() {
    const wrap       = document.getElementById("search-wrap");
    const input      = document.getElementById("search-input");
    const dropdown   = document.getElementById("search-dropdown");
    const resultList = document.getElementById("search-results");
    const countEl    = document.getElementById("search-count");

    if (!wrap || !input || !dropdown) return;

    let activeIdx  = -1;
    let lastQuery  = "";
    let isOpen     = false;
    let resultEls  = [];

    /* ── open / close ── */
    function openDropdown() {
      if (isOpen) return;
      dropdown.classList.add("is-open");
      isOpen = true;
    }

    function closeDropdown() {
      if (!isOpen) return;
      dropdown.classList.remove("is-open");
      isOpen    = false;
      activeIdx = -1;
    }

    /* ── render ── */
    function render(query) {
      if (!query.trim()) { closeDropdown(); return; }

      const results = search(query);
      const html    = buildResultHTML(results, query);

      resultList.innerHTML = html;
      countEl.textContent  =
        results.length === 0
          ? "No results"
          : `${results.length} result${results.length > 1 ? "s" : ""}`;

      resultEls = Array.from(resultList.querySelectorAll(".search-result"));
      activeIdx = -1;
      openDropdown();
    }

    /* ── active item ── */
    function setActive(idx) {
      resultEls.forEach((el, i) => el.classList.toggle("is-active", i === idx));
      activeIdx = idx;
    }

    /* ── keyboard ── */
    input.addEventListener("keydown", (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActive(Math.min(activeIdx + 1, resultEls.length - 1));
          resultEls[activeIdx]?.scrollIntoView({ block: "nearest" });
          break;

        case "ArrowUp":
          e.preventDefault();
          if (activeIdx <= 0) { setActive(-1); input.focus(); }
          else { setActive(activeIdx - 1); }
          resultEls[activeIdx]?.scrollIntoView({ block: "nearest" });
          break;

        case "Enter":
          if (activeIdx >= 0 && resultEls[activeIdx]) {
            resultEls[activeIdx].click();
          }
          break;

        case "Escape":
          closeDropdown();
          input.blur();
          break;
      }
    });

    /* ── typing (debounced) ── */
    let debounceTimer;
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const q = input.value;
      if (q === lastQuery) return;
      lastQuery = q;

      if (!q.trim()) { closeDropdown(); return; }

      // Very short queries render immediately; longer ones debounce 80 ms
      const delay = q.length < 2 ? 0 : 80;
      debounceTimer = setTimeout(() => render(q), delay);
    });

    /* ── focus / blur ── */
    input.addEventListener("focus", () => {
      if (input.value.trim()) render(input.value);
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) closeDropdown();
    });

    /* ── "/" shortcut to focus ── */
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input
          && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  /* Boot after DOM ready */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearch);
  } else {
    initSearch();
  }

})();
