# AkdenizOS Lab

Interactive course pages served at `akdenizos.org/lab/`. Plain static HTML: no build step, no framework.

```
lab/
  index.html              list of courses
  assets/lab.css          lab components on top of assets/css/tokens.css
  assets/lab.js           TOC, progress, focus mode, pomodoro, quiz, stepper, array/code views
  <course>/index.html     course page (cards come from course.js)
  <course>/course.js      lesson list: slug, unit, lecture, title, minutes, description, tags
  <course>/<slug>.html    one lesson
```

GitHub Pages caches assets for 4 hours, so every page loads `lab.css`, `lab.js` and `course.js` with a `?v=N` query. Raise N in all pages whenever one of those files changes.

Progress is kept in `localStorage` under `lab:<course>/<slug>/…`. No accounts, nothing leaves the browser.

## Study features (all in `assets/lab.js`, no per-lesson code)

They follow the learning-science findings that hold for students with ADHD too: retrieval practice, successive relearning, interleaving.

- **Önce dene (retrieval first):** each unfinished section opens with its first quiz and the explanation stays blurred until the quiz is answered or skipped. Toggle in the lesson sidebar.
- **Tekrar kuyruğu (review queue):** a wrong answer puts the quiz in `lab:<course>/queue`, due at once. It leaves after two correct answers in separate sittings, the second due 6 hours after the first. Items cannot be removed by hand. `practice.html?mode=queue`.
- **Karışık test (mixed test):** 10 random quizzes fetched from every open lesson. `practice.html?mode=mixed`. Needs a web server (fetch), not `file://`.
- **Sadece başla (just start):** a 2-minute timer with an if-then plan, then an offer to start the 25-minute focus timer. `?start=1` on a lesson URL opens it.
- **Kaldığın yer and Kendini dene özeti:** a banner jumps back to the first unfinished section; a table at the end of the page counts answered and first-try-correct quizzes per section.
- **Past exam boxes:** `<div class="box box--exam" data-exam="<id>">` marks a past exam question placed in the section that teaches what it needs, with hints and a worked solution.

## Writing a lesson

Copy `cse-301/asymptotics.html` and keep its head, navbar, TOC aside, `progress-top`, `lesson-foot` and the three script tags at the bottom (`course.js`, `../assets/lab.js`, then the lesson's own script). Change the `<title>`, the description, the crumbs, the header and `data-lesson` on the article; `data-lesson` must equal the slug in `course.js`.

Language: Turkish prose, English technical terms kept as they are (divide and conquer, loop invariant, pivot…). The exam is in English, so give the English name the first time a term appears.

### Sections

Each section is one idea that takes 3–6 minutes:

```html
<section class="lsec" id="short-id" data-min="4">
  <h2>Title</h2>
  …
</section>
```

The script numbers the heading, adds the minutes, the "Anladım" button, focus-mode navigation and the TOC entry. Aim for 7–11 sections a lesson.

### Maths

KaTeX auto-render: `$…$` inline, `$$…$$` display. Inside JavaScript strings escape backslashes (`"$\\Theta(n)$"`). Use `&lt;` / `&gt;` for < and > inside HTML text.

### Boxes

```html
<div class="box box--rule"><span class="box__label">Kural</span>…</div>       definitions, theorems, recipes
<div class="box box--intuition"><span class="box__label">Sezgi</span>…</div>  the picture before the formula
<div class="box box--example"><span class="box__label">Örnek · source</span>…</div>
<div class="box box--trap"><span class="box__label">Tuzak</span>…</div>       common mistakes
<div class="box box--exam"><span class="box__label">2020-21 vizesi S2</span>…</div>  how exams ask it
<!-- Kaynak: … -->                                                             where it comes from (kept out of sight)
<p class="src">Not: …</p>                                                      only notes the student needs, e.g. a wrong answer key
```

### Self-check questions

```html
<div class="quiz" id="q-unique-id">
  <p class="quiz__q">Question</p>
  <button class="quiz__opt" data-correct>Right answer<span class="why">Why it is right.</span></button>
  <button class="quiz__opt">Wrong answer<span class="why">Why it is wrong: name the misconception.</span></button>
</div>
```

Every option carries a `why`. At least one quiz per section where it makes sense, and a final "Son kontrol" section.

### Hints and solutions

```html
<details class="hint"><summary>İpucu 1</summary><div>…</div></details>
<details class="reveal"><summary>Çözümü göster</summary><div>…</div></details>
```

### Animations

`Lab.stepper(el, { title, interval, frames, render(frame, index, stageEl) })` adds play / step / reset controls and shows `frame.caption` (HTML, KaTeX allowed) under the stage. Helpers for `render`:

- `Lab.arrayView(values, { marks: { 3: "pivot", 4: "cmp" }, pointers: { i: 2, j: 5 }, base: 0 })` returns HTML boxes. Marks: `cmp`, `swap`, `pivot`, `done`, `dim`, `small`, `big` (several separated by spaces).
- `Lab.codeView(lines, highlightedIndex)` returns a code block with one highlighted line.

Generate frames from a real run of the algorithm in JavaScript rather than typing them by hand, so the animation cannot disagree with the algorithm. Trees and diagrams: inline SVG built in the render function, colours from the CSS variables.
