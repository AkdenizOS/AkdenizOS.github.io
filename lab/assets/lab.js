/* ============================================================
   AkdenizOS Lab — shared behaviour for course and lesson pages.
   Progress lives in localStorage only (per browser, no account).
   Public helpers on window.Lab: stepper, arrayView, codeView.
   ============================================================ */
(function () {
  "use strict";

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("lab:" + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("lab:" + key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    }
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ── Maths: KaTeX auto-render when the CDN loaded ── */
  function renderMath(root) {
    if (window.renderMathInElement) {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        throwOnError: false
      });
    }
  }

  /* ── Array view: boxes with marks, pointers and indices ── */
  function arrayView(values, opts) {
    opts = opts || {};
    const marks = opts.marks || {};
    const ptrs = opts.pointers || {};
    const ptrAt = {};
    Object.keys(ptrs).forEach((name) => {
      const i = ptrs[name];
      if (i === null || i === undefined) return;
      (ptrAt[i] = ptrAt[i] || []).push(name);
    });
    const cells = values.map((v, i) => {
      const m = marks[i] ? " m-" + marks[i].split(" ").join(" m-") : "";
      const p = ptrAt[i] ? `<span class="ptr">${esc(ptrAt[i].join(","))}↓</span>` : "";
      const idx = opts.hideIndex ? "" : `<small>${i + (opts.base || 0)}</small>`;
      return `<div class="arr__cell${m}">${p}${esc(v)}${idx}</div>`;
    });
    // pointers past the end (e.g. i = len) are shown as a ghost cell
    Object.keys(ptrAt).forEach((k) => {
      if (+k >= values.length || +k < 0) cells.push(`<div class="arr__cell m-dim"><span class="ptr">${esc(ptrAt[k].join(","))}↓</span>·</div>`);
    });
    return `<div class="arr-wrap"><div class="arr">${cells.join("")}</div></div>`;
  }

  /* ── Code view: one highlighted line ── */
  function codeView(lines, on) {
    return `<div class="codeview">${lines.map((l, i) => `<div class="${i === on ? "on" : ""}">${esc(l) || " "}</div>`).join("")}</div>`;
  }

  /* ── Stepper: frames + render(frame, index, stageEl) ── */
  function stepper(el, cfg) {
    const frames = cfg.frames || [];
    el.classList.add("stepper");
    el.innerHTML =
      (cfg.title ? `<div class="stepper__title">${esc(cfg.title)}</div>` : "") +
      `<div class="stepper__stage"></div><div class="stepper__caption"></div>
       <div class="stepper__controls">
         <button class="btn btn--sm" data-a="reset" title="Başa dön">⏮</button>
         <button class="btn btn--sm" data-a="prev" title="Geri">◀</button>
         <button class="btn btn--sm btn--accent" data-a="play">▶ Oynat</button>
         <button class="btn btn--sm" data-a="next" title="İleri">▶|</button>
         <span class="stepper__count"></span>
       </div>`;
    const stage = el.querySelector(".stepper__stage");
    const cap = el.querySelector(".stepper__caption");
    const cnt = el.querySelector(".stepper__count");
    const playBtn = el.querySelector('[data-a="play"]');
    let i = 0, timer = null;
    function show() {
      const f = frames[i];
      cfg.render(f, i, stage);
      cap.innerHTML = f && f.caption ? f.caption : "";
      cnt.textContent = `${i + 1} / ${frames.length}`;
      renderMath(cap);
      renderMath(stage);
    }
    function stop() { clearInterval(timer); timer = null; playBtn.textContent = "▶ Oynat"; }
    el.querySelector(".stepper__controls").addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]");
      if (!a) return;
      const act = a.dataset.a;
      if (act === "reset") { stop(); i = 0; }
      if (act === "prev") { stop(); i = Math.max(0, i - 1); }
      if (act === "next") { stop(); i = Math.min(frames.length - 1, i + 1); }
      if (act === "play") {
        if (timer) { stop(); return; }
        if (i >= frames.length - 1) i = 0;
        playBtn.textContent = "❚❚ Durdur";
        timer = setInterval(() => {
          if (i >= frames.length - 1) { stop(); return; }
          i++; show();
        }, cfg.interval || 1100);
      }
      show();
    });
    show();
    return { go(n) { i = n; show(); } };
  }

  /* ── Quiz ── */
  function initQuiz(q, course, lesson) {
    const key = `${course}/${lesson}/quiz`;
    const id = q.id || "";
    const opts = Array.from(q.querySelectorAll(".quiz__opt"));
    if (!q.querySelector(".quiz__tag")) q.insertAdjacentHTML("afterbegin", '<div class="quiz__tag">Kendini dene</div>');
    q.insertAdjacentHTML("beforeend", '<button class="btn btn--sm quiz__retry">↺ Yeniden dene</button>');
    opts.forEach((o) => {
      o.type = "button";
      o.addEventListener("click", () => {
        if (q.classList.contains("is-answered")) return;
        q.classList.add("is-answered");
        opts.forEach((x) => { if (x.hasAttribute("data-correct")) x.classList.add("is-correct"); });
        if (!o.hasAttribute("data-correct")) o.classList.add("is-wrong");
        const res = store.get(key, {});
        res[id] = o.hasAttribute("data-correct");
        store.set(key, res);
      });
    });
    q.querySelector(".quiz__retry").addEventListener("click", () => {
      q.classList.remove("is-answered");
      opts.forEach((x) => x.classList.remove("is-correct", "is-wrong"));
    });
  }

  /* ── Pomodoro (25 / 5) ── */
  function pomodoro(el) {
    let left = 25 * 60, br = false, t = null;
    el.innerHTML = '<span class="pomo"><b>25:00</b><button class="btn btn--sm" data-p>▶ Odak</button></span>';
    const b = el.querySelector("b"), btn = el.querySelector("[data-p]"), wrap = el.querySelector(".pomo");
    const draw = () => { b.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`; };
    btn.addEventListener("click", () => {
      if (t) { clearInterval(t); t = null; btn.textContent = "▶ Devam"; return; }
      btn.textContent = "❚❚";
      t = setInterval(() => {
        left--;
        if (left < 0) {
          br = !br; left = (br ? 5 : 25) * 60;
          wrap.classList.toggle("is-break", br);
          document.title = (br ? "☕ Mola · " : "🎯 Odak · ") + document.title.replace(/^(☕ Mola|🎯 Odak) · /, "");
        }
        draw();
      }, 1000);
    });
    draw();
  }

  /* ── Lesson page ── */
  function initLesson(article) {
    const course = article.dataset.course;
    const slug = article.dataset.lesson;
    const manifest = (window.LAB_COURSES || {})[course];
    const doneKey = `${course}/${slug}/done`;
    const done = new Set(store.get(doneKey, []));
    const secs = Array.from(article.querySelectorAll("section.lsec"));
    const toc = document.getElementById("toc-list");
    const bar = document.querySelector(".progress-top i");

    secs.forEach((s, k) => {
      const h = s.querySelector("h2");
      if (!s.id) s.id = "s" + (k + 1);
      if (h && !h.querySelector(".num")) h.insertAdjacentHTML("afterbegin", `<span class="num">${String(k + 1).padStart(2, "0")}</span>`);
      if (h && s.dataset.min) h.insertAdjacentHTML("beforeend", `<span class="lsec__min">~${s.dataset.min} dk</span>`);
      s.insertAdjacentHTML("beforeend",
        `<div class="lsec__done"><button class="btn btn--sm" data-done>✓ Anladım, işaretle</button></div>
         <div class="focus-nav"><button class="btn btn--sm" data-prev>◀ Önceki bölüm</button><button class="btn btn--sm btn--accent" data-next>Sonraki bölüm ▶</button></div>`);
      if (toc) toc.insertAdjacentHTML("beforeend", `<a href="#${s.id}" data-sec="${s.id}"><span class="tick"></span><span>${esc(h ? h.textContent.replace(/^\d+/, "").replace(/~\d+ dk$/, "").trim() : s.id)}</span></a>`);
    });

    function paint() {
      secs.forEach((s) => {
        const on = done.has(s.id);
        s.classList.toggle("is-done", on);
        const btn = s.querySelector("[data-done]");
        if (btn) btn.textContent = on ? "✓ Tamamlandı" : "✓ Anladım, işaretle";
        const a = toc && toc.querySelector(`[data-sec="${s.id}"]`);
        if (a) a.classList.toggle("is-done", on);
      });
      const pct = secs.length ? Math.round((100 * done.size) / secs.length) : 0;
      if (bar) bar.style.width = pct + "%";
      store.set(`${course}/${slug}/progress`, { done: done.size, total: secs.length });
    }

    let current = 0;
    function setCurrent(k) {
      current = Math.max(0, Math.min(secs.length - 1, k));
      secs.forEach((s, j) => s.classList.toggle("is-current", j === current));
      if (document.body.classList.contains("focus")) window.scrollTo({ top: article.offsetTop - 70, behavior: "smooth" });
    }

    article.addEventListener("click", (e) => {
      const s = e.target.closest("section.lsec");
      if (!s) return;
      const k = secs.indexOf(s);
      if (e.target.closest("[data-done]")) {
        done.has(s.id) ? done.delete(s.id) : done.add(s.id);
        store.set(doneKey, Array.from(done));
        paint();
      }
      if (e.target.closest("[data-next]")) { done.add(s.id); store.set(doneKey, Array.from(done)); paint(); setCurrent(k + 1); }
      if (e.target.closest("[data-prev]")) setCurrent(k - 1);
    });

    // scrollspy
    if (toc && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        es.forEach((en) => {
          if (en.isIntersecting) {
            toc.querySelectorAll("a").forEach((a) => a.classList.toggle("is-active", a.dataset.sec === en.target.id));
            if (!document.body.classList.contains("focus")) current = secs.indexOf(en.target);
          }
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      secs.forEach((s) => io.observe(s));
    }
    if (toc) toc.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-sec]");
      if (a && document.body.classList.contains("focus")) { e.preventDefault(); setCurrent(secs.findIndex((s) => s.id === a.dataset.sec)); }
    });

    const fbtn = document.querySelector("[data-focus]");
    if (fbtn) fbtn.addEventListener("click", () => {
      const on = document.body.classList.toggle("focus");
      fbtn.textContent = on ? "☰ Tüm bölümler" : "◎ Odak modu";
      if (on) {
        const firstOpen = secs.findIndex((s) => !done.has(s.id));
        setCurrent(firstOpen === -1 ? current : firstOpen);
      }
      store.set("focus", on);
    });
    if (store.get("focus", false) && fbtn) fbtn.click();

    document.querySelectorAll(".pomo-slot").forEach(pomodoro);
    article.querySelectorAll(".quiz").forEach((q) => initQuiz(q, course, slug));

    // previous / next lesson
    if (manifest) {
      const list = manifest.lessons.filter((l) => l.status !== "soon");
      const idx = list.findIndex((l) => l.slug === slug);
      const foot = document.querySelector(".lesson-foot");
      if (foot && idx !== -1) {
        const prev = list[idx - 1], next = list[idx + 1];
        foot.innerHTML =
          (prev ? `<a class="btn" href="${prev.slug}.html">◀ ${esc(prev.title)}</a>` : `<a class="btn" href="./">◀ Ders sayfası</a>`) +
          (next ? `<a class="btn btn--accent" href="${next.slug}.html">${esc(next.title)} ▶</a>` : `<a class="btn btn--accent" href="./">Ders sayfası ▶</a>`);
      }
      store.set(`${course}/last`, slug);
    }
    paint();
    renderMath(article);
  }

  /* ── Course page ── */
  function initCourse(root) {
    const course = root.dataset.course;
    const m = (window.LAB_COURSES || {})[course];
    if (!m) return;
    const grid = root.querySelector("[data-units]");
    let totalDone = 0, totalSecs = 0, firstOpen = null;
    const units = [];
    m.lessons.forEach((l) => {
      let u = units.find((x) => x.name === l.unit);
      if (!u) units.push(u = { name: l.unit, items: [] });
      u.items.push(l);
    });
    grid.innerHTML = units.map((u) => `
      <div class="unit"><h2>${esc(u.name)}</h2><span>${u.items.length} konu</span></div>
      <div class="cards">${u.items.map((l, k) => {
        const p = store.get(`${course}/${l.slug}/progress`, { done: 0, total: 0 });
        const pct = p.total ? Math.round(100 * p.done / p.total) : 0;
        if (l.status !== "soon") { totalDone += p.done; totalSecs += p.total || l.sections || 0; if (!firstOpen && pct < 100) firstOpen = l; }
        const state = l.status === "soon" ? "Yakında" : pct === 100 ? "Tamamlandı" : pct > 0 ? `%${pct}` : "Başlanmadı";
        return `<a class="lcard${pct === 100 ? " is-done" : ""}${l.status === "soon" ? " is-soon" : ""}" href="${l.slug}.html">
          <div class="lcard__top"><span>${esc(l.lecture)}</span><span>${l.min} dk</span></div>
          <h3>${esc(l.title)}</h3>
          <p>${esc(l.desc)}</p>
          <div>${(l.tags || []).map((t) => `<span class="chip${/sınav|vize|exam/i.test(t) ? " chip--exam" : ""}">${esc(t)}</span>`).join(" ")}</div>
          <div class="lcard__bar"><i style="width:${pct}%"></i></div>
          <div class="lcard__meta"><span>${state}</span><span>${p.total || l.sections || "?"} bölüm</span></div>
        </a>`;
      }).join("")}</div>`).join("");

    const set = (sel, v) => { const e = root.querySelector(sel); if (e) e.textContent = v; };
    set("[data-stat-progress]", totalSecs ? `%${Math.round(100 * totalDone / totalSecs)}` : "%0");
    set("[data-stat-lessons]", m.lessons.filter((l) => l.status !== "soon").length);
    const nextBtn = root.querySelector("[data-next-lesson]");
    const last = store.get(`${course}/last`, null);
    const target = firstOpen || m.lessons[0];
    if (nextBtn && target) { nextBtn.href = target.slug + ".html"; nextBtn.textContent = (last ? "Kaldığın yerden: " : "Başla: ") + target.title + " ▶"; }
    if (m.exam) {
      const el = root.querySelector("[data-stat-exam]");
      const tick = () => {
        const ms = new Date(m.exam.date) - new Date();
        if (ms <= 0) { el.textContent = "Bugün"; return; }
        const h = Math.floor(ms / 3.6e6);
        el.textContent = h >= 48 ? `${Math.floor(h / 24)} gün ${h % 24} sa` : `${h} sa ${Math.floor(ms / 6e4) % 60} dk`;
      };
      if (el) { tick(); setInterval(tick, 30000); }
    }
  }

  window.Lab = { stepper, arrayView, codeView, renderMath, store };

  document.addEventListener("DOMContentLoaded", () => {
    const article = document.querySelector("article.lesson[data-lesson]");
    if (article) initLesson(article);
    const course = document.querySelector("[data-course-page]");
    if (course) initCourse(course);
  });
})();
