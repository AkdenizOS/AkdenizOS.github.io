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

Progress is kept in `localStorage` under `lab:<course>/<slug>/…`. No accounts, nothing leaves the browser.

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
<p class="src">Kaynak: …</p>                                                   where it comes from
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
