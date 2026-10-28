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

  /* ── Review queue (successive relearning) ──
     A wrong answer puts the question in the queue, due now. It leaves only
     after two correct answers in separate sittings (the second one is due
     6 hours later). The student cannot drop items by hand: in the relearning
     studies, self-chosen dropping removed the benefit. */
  const RELEARN_GAP = 6 * 3600 * 1000;
  function queueGet(course) { return store.get(`${course}/queue`, {}); }
  function recordAnswer(course, item, ok) {
    const q = queueGet(course);
    const key = `${item.slug}#${item.id}`;
    const prev = q[key];
    if (!ok) {
      q[key] = { slug: item.slug, id: item.id, title: item.title, html: item.html, due: Date.now(), streak: 0, misses: (prev ? prev.misses : 0) + 1 };
    } else if (prev && Date.now() >= prev.due) {
      prev.streak += 1;
      if (prev.streak >= 2) delete q[key];
      else prev.due = Date.now() + RELEARN_GAP;
    }
    store.set(`${course}/queue`, q);
    document.dispatchEvent(new CustomEvent("lab:queue"));
  }
  function queueCounts(course) {
    const items = Object.values(queueGet(course));
    const now = Date.now();
    return { due: items.filter((x) => x.due <= now).length, later: items.filter((x) => x.due > now).length };
  }

  /* ── Quiz ── */
  function initQuiz(q, course, lesson, opt) {
    opt = opt || {};
    const key = `${course}/${lesson}/quiz`;
    const id = q.id || "";
    const pristine = opt.html || q.outerHTML;
    const lessonTitle = opt.title || (document.querySelector(".lesson-head h1") || {}).textContent || lesson;
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
        const ok = o.hasAttribute("data-correct");
        const res = store.get(key, {});
        res[id] = ok;
        store.set(key, res);
        const first = store.get(`${course}/${lesson}/first`, {});
        if (!(id in first)) { first[id] = ok; store.set(`${course}/${lesson}/first`, first); }
        recordAnswer(course, { slug: lesson, id, title: lessonTitle.trim(), html: pristine }, ok);
        q.dispatchEvent(new CustomEvent("lab:answered", { bubbles: true, detail: { ok } }));
      });
    });
    q.querySelector(".quiz__retry").addEventListener("click", () => {
      q.classList.remove("is-answered");
      opts.forEach((x) => x.classList.remove("is-correct", "is-wrong"));
    });
  }

  /* ── Pomodoro (25 / 5) ── */
  const pomos = [];
  function pomodoro(el) {
    let left = 25 * 60, br = false, t = null;
    pomos.push({ start() { if (!t) btn.click(); } });
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

  /* ── Just start: a 2-minute entry with an if-then plan ── */
  function justStart(onGo) {
    const old = document.querySelector(".juststart");
    if (old) old.remove();
    const plan = store.get("ifthen", "Telefonu açmak istersem başka odaya koyarım.");
    document.body.insertAdjacentHTML("beforeend",
      `<div class="juststart" role="dialog" aria-label="Sadece başla">
        <div class="juststart__card">
          <b class="juststart__time">2:00</b>
          <p>Sadece 2 dakika. Sıradaki bölümü aç, ilk paragrafı oku ve ilk soruyu dene. Süre bitince devam edip etmemeye sen karar verirsin.</p>
          <label>If-then planın<input class="juststart__plan" value="${esc(plan)}"></label>
          <div class="juststart__row"><button class="btn btn--sm" data-js-close>Kapat</button><button class="btn btn--sm btn--accent" data-js-pomo hidden>▶ 25 dk odak başlat</button></div>
        </div>
      </div>`);
    const box = document.querySelector(".juststart");
    const timeEl = box.querySelector(".juststart__time");
    box.querySelector(".juststart__plan").addEventListener("change", (e) => store.set("ifthen", e.target.value));
    let left = 120;
    const t = setInterval(() => {
      left--;
      timeEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left <= 0) {
        clearInterval(t);
        timeEl.textContent = "Başladın. Devam?";
        box.classList.add("is-open");
        box.querySelector("[data-js-pomo]").hidden = false;
      }
    }, 1000);
    box.querySelector("[data-js-close]").addEventListener("click", () => { clearInterval(t); box.remove(); });
    box.querySelector("[data-js-pomo]").addEventListener("click", () => { pomos.forEach((p) => p.start()); box.remove(); });
    box.classList.add("is-mini");
    if (onGo) onGo();
  }

  /* ── Practice page: review queue and mixed test ── */
  async function initPractice(root) {
    const course = root.dataset.course;
    const m = (window.LAB_COURSES || {})[course];
    const mode = new URLSearchParams(location.search).get("mode") === "mixed" ? "mixed" : "queue";
    const list = root.querySelector("[data-practice-list]");
    const head = root.querySelector("[data-practice-head]");
    const render = (items) => {
      list.innerHTML = "";
      items.forEach((it, k) => {
        const wrap = document.createElement("div");
        wrap.className = "practice-item";
        wrap.innerHTML = `<div class="src">${k + 1}. ${esc(it.title)} · <a href="${it.slug}.html">derse git</a></div>${it.html}`;
        list.appendChild(wrap);
        const q = wrap.querySelector(".quiz");
        initQuiz(q, course, it.slug, { html: it.html, title: it.title });
        q.addEventListener("lab:answered", (e) => {
          if (!e.detail.ok && mode === "queue") {
            // successive relearning: the same question comes back at the end of this sitting
            render.extra = (render.extra || 0) + 1;
            const again = document.createElement("div");
            again.className = "practice-item";
            again.innerHTML = `<div class="src">Tekrar · ${esc(it.title)}</div>${it.html}`;
            list.appendChild(again);
            initQuiz(again.querySelector(".quiz"), course, it.slug, { html: it.html, title: it.title });
            renderMath(again);
          }
        });
      });
      renderMath(list);
    };
    if (mode === "queue") {
      const all = Object.values(queueGet(course));
      const due = all.filter((x) => x.due <= Date.now()).sort((a, b) => b.misses - a.misses);
      const later = all.length - due.length;
      head.innerHTML = `<h1>Tekrar kuyruğu</h1><p class="lead">Yanlış cevapladığın sorular burada. Bir soru, iki ayrı oturumda doğru cevaplanınca kuyruktan çıkar (ikinci tekrar ilk doğrudan 6 saat sonra açılır). Şu an <b>${due.length}</b> soru hazır${later ? `, ${later} soru daha sonra açılacak` : ""}.</p>`;
      if (!due.length) list.innerHTML = `<div class="box box--rule"><span class="box__label">Kuyruk boş</span><p>Şu an tekrar edilecek soru yok. <a href="practice.html?mode=mixed">Karışık test</a> çözebilir ya da derse dönebilirsin.</p></div>`;
      else render(due);
      return;
    }
    head.innerHTML = `<h1>Karışık test</h1><p class="lead">Tüm derslerden rastgele 10 soru. Konular karışık geldiği için önce hangi yöntemin gerektiğini seçmen gerekiyor; sınavda da öyle. Yanlışlar tekrar kuyruğuna girer.</p><p><button class="btn btn--sm" data-reshuffle>⇄ Yeni 10 soru</button></p>`;
    list.innerHTML = '<p class="src">Sorular yükleniyor…</p>';
    const pool = [];
    const parser = new DOMParser();
    await Promise.all(m.lessons.filter((l) => l.status !== "soon").map(async (l) => {
      try {
        const html = await (await fetch(`${l.slug}.html`)).text();
        const doc = parser.parseFromString(html, "text/html");
        doc.querySelectorAll("article.lesson .quiz").forEach((q) => { if (q.id) pool.push({ slug: l.slug, id: q.id, title: l.title, html: q.outerHTML }); });
      } catch (e) { /* offline: skip that lesson */ }
    }));
    const pick = () => {
      const a = pool.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      render(a.slice(0, 10));
    };
    head.querySelector("[data-reshuffle]").addEventListener("click", pick);
    if (!pool.length) list.innerHTML = '<p class="src">Sorular yüklenemedi. Sayfayı bir web sunucusu üzerinden aç.</p>';
    else pick();
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

    // Retrieval first: the section's first question opens the section, the
    // explanation stays blurred until it is answered (or skipped).
    const tools = document.querySelector(".toc__tools");
    const moved = [];
    function lockSections(on) {
      moved.forEach(({ q, mark }) => mark.parentNode.insertBefore(q, mark));
      moved.length = 0;
      article.querySelectorAll(".tryfirst-note").forEach((n) => n.remove());
      secs.forEach((s) => s.classList.remove("is-locked"));
      if (!on) return;
      secs.forEach((s) => {
        const q = s.querySelector(".quiz");
        if (!q || done.has(s.id) || q.classList.contains("is-answered")) return;
        const h = s.querySelector("h2");
        const mark = document.createComment("quiz-home");
        q.parentNode.insertBefore(mark, q);
        h.insertAdjacentElement("afterend", q);
        q.insertAdjacentHTML("beforebegin", '<p class="tryfirst-note">Önce bu soruyu dene. Bilmiyorsan tahmin et; yanlış cevap da öğrenmeye yarar. Cevaplayınca anlatım açılır. <button class="btn btn--sm" data-unlock>Atla</button></p>');
        moved.push({ q, mark });
        s.classList.add("is-locked");
      });
    }
    article.addEventListener("lab:answered", (e) => {
      const s = e.target.closest("section.lsec");
      if (s) s.classList.remove("is-locked");
    });
    article.addEventListener("click", (e) => {
      if (e.target.closest("[data-unlock]")) e.target.closest("section.lsec").classList.remove("is-locked");
    });
    if (tools) {
      tools.insertAdjacentHTML("afterbegin",
        `<button class="btn btn--sm btn--accent" data-juststart>▶ Sadece başla (2 dk)</button>
         <button class="btn btn--sm" data-tryfirst></button>
         <a class="btn btn--sm" href="practice.html?mode=queue" data-queue-link>↻ Tekrar kuyruğu</a>
         <a class="btn btn--sm" href="practice.html?mode=mixed">⇄ Karışık test</a>`);
      const tf = tools.querySelector("[data-tryfirst]");
      const paintTf = (on) => { tf.textContent = on ? "✎ Önce dene: açık" : "✎ Önce dene: kapalı"; };
      let tfOn = store.get("tryfirst", true);
      paintTf(tfOn); lockSections(tfOn);
      tf.addEventListener("click", () => { tfOn = !tfOn; store.set("tryfirst", tfOn); paintTf(tfOn); lockSections(tfOn); });
      const ql = tools.querySelector("[data-queue-link]");
      const paintQ = () => { const c = queueCounts(course); ql.textContent = c.due ? `↻ Tekrar kuyruğu (${c.due})` : "↻ Tekrar kuyruğu"; };
      paintQ(); document.addEventListener("lab:queue", paintQ);
      const go = () => justStart(() => {
        const first = secs.find((s) => !done.has(s.id)) || secs[0];
        if (first) first.scrollIntoView({ behavior: "smooth" });
      });
      tools.querySelector("[data-juststart]").addEventListener("click", go);
      if (new URLSearchParams(location.search).get("start") === "1") setTimeout(go, 300);
    }

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

    // "Kaldığın yer" banner: jump back to the first unfinished section.
    const doneHere = secs.filter((s) => done.has(s.id)).length;
    if (doneHere > 0 && doneHere < secs.length) {
      const next = secs.find((s) => !done.has(s.id));
      const title = (next.querySelector("h2") || {}).textContent || "";
      article.insertAdjacentHTML("afterbegin",
        `<div class="resume"><span><b>Kaldığın yer:</b> ${esc(title.replace(/^\d+/, "").replace(/~\d+ dk$/, "").trim())}</span>
          <span><a class="btn btn--sm btn--accent" href="#${next.id}" data-resume>Devam et ↓</a> <button class="btn btn--sm" data-resume-x aria-label="Kapat">×</button></span></div>`);
      article.querySelector("[data-resume-x]").addEventListener("click", (e) => e.target.closest(".resume").remove());
      article.querySelector("[data-resume]").addEventListener("click", (e) => {
        if (document.body.classList.contains("focus")) { e.preventDefault(); setCurrent(secs.indexOf(next)); }
      });
    }

    // Self-check summary at the end of the page, per section.
    const foot = document.querySelector(".lesson-foot");
    if (foot) {
      foot.insertAdjacentHTML("beforebegin", '<div class="quiz-summary" aria-live="polite"></div>');
      const box = document.querySelector(".quiz-summary");
      const paintSummary = () => {
        const res = store.get(`${course}/${slug}/quiz`, {});
        const first = store.get(`${course}/${slug}/first`, {});
        let total = 0, answered = 0, firstOk = 0;
        const rows = secs.map((s) => {
          const qs = Array.from(s.querySelectorAll(".quiz[id]"));
          if (!qs.length) return "";
          const a = qs.filter((q) => q.id in res).length;
          const f = qs.filter((q) => first[q.id] === true).length;
          total += qs.length; answered += a; firstOk += f;
          const t = ((s.querySelector("h2") || {}).textContent || "").replace(/^\d+/, "").replace(/~\d+ dk$/, "").trim();
          return `<tr><td><a href="#${s.id}">${esc(t)}</a></td><td>${a} / ${qs.length}</td><td>${f}</td></tr>`;
        }).join("");
        box.innerHTML = `<div class="box box--rule"><span class="box__label">Kendini dene özeti</span>
          <p><b>${answered} / ${total}</b> soru cevaplandı, <b>${firstOk}</b> tanesi ilk denemede doğru. Yanlışların tekrar kuyruğunda seni bekliyor.</p>
          <div class="table-wrap"><table><tr><th>Bölüm</th><th>Cevaplanan</th><th>İlk denemede doğru</th></tr>${rows}</table></div></div>`;
      };
      paintSummary();
      article.addEventListener("lab:answered", () => setTimeout(paintSummary, 0));
    }
    renderMath(article);
    const head = document.querySelector(".lesson-head");
    if (head) renderMath(head);
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
    const qb = root.querySelector("[data-queue-btn]");
    if (qb) { const c = queueCounts(course); if (c.due) qb.textContent = `↻ Tekrar kuyruğu (${c.due})`; }
    const js = root.querySelector("[data-juststart]");
    const nextBtn = root.querySelector("[data-next-lesson]");
    if (js) js.addEventListener("click", () => { if (nextBtn) location.href = nextBtn.getAttribute("href") + "?start=1"; });
    const last = store.get(`${course}/last`, null);
    const target = firstOpen || m.lessons[0];
    if (nextBtn && target) { nextBtn.href = target.slug + ".html"; nextBtn.textContent = (last ? "Kaldığın yerden: " : "Başla: ") + target.title + " ▶"; }
    const examBox = root.querySelector("[data-exam-stat]");
    if (m.exam && examBox && new Date(m.exam.date) > new Date()) {
      examBox.hidden = false;
      const lab = root.querySelector("[data-exam-label]");
      if (lab) lab.textContent = `${m.exam.name} için kalan${m.exam.label ? ` (${m.exam.label})` : ""}`;
      const el = root.querySelector("[data-stat-exam]");
      const tick = () => {
        const ms = new Date(m.exam.date) - new Date();
        if (ms <= 0) { examBox.hidden = true; return; }
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
    const practice = document.querySelector("[data-practice]");
    if (practice) initPractice(practice);
  });
})();
