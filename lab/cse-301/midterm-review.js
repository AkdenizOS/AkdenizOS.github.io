/* Practice runs use the same half-open partition as the released papers. */
(() => {
  "use strict";
  const examples = {
    A: { values: [7, 4, 3, 6, 1, 9], k: 4 },
    B: { values: [1, 7, 6, 5, 3, 8], k: 4 },
    C: { values: [4, 6, 7, 5, 2, 3], k: 2 },
    D: { values: [8, 4, 2, 6, 1, 7], k: 3 }
  };
  function partition(a, start, end) {
    const pivot = a[end - 1];
    let i = start - 1;
    for (let j = start; j < end - 1; j++) {
      if (a[j] <= pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
      }
    }
    [a[i + 1], a[end - 1]] = [a[end - 1], a[i + 1]];
    return i + 1;
  }
  const form = document.getElementById("trace-form");
  const step = document.getElementById("trace-step");
  const output = document.getElementById("trace-output");
  let a, start, end, target;
  function reset() {
    const ex = examples[form.value];
    a = [...ex.values]; start = 0; end = a.length;
    target = form.value === "D" ? ex.k - 1 : ex.k;
    document.getElementById("trace-input").textContent =
      `A = [${a.join(", ")}], k = ${ex.k} (${form.value === "D" ? "1-based rank" : "0-based index"}); hedef indeks ${target}.`;
    output.replaceChildren(); step.disabled = false;
  }
  step.addEventListener("click", () => {
    const row = document.createElement("p");
    if (end - start === 1) {
      row.textContent = `(${start}, ${end}) · base case → return ${a[start]}.`;
      step.disabled = true;
    } else {
      const oldStart = start, oldEnd = end, pivot = a[end - 1];
      const r = partition(a, start, end);
      let next;
      if (r === target) {
        next = `hedef bulundu → return ${a[r]}`;
        step.disabled = true;
      } else {
        if (target < r) end = r; else start = r + 1;
        next = `sonraki aralık (${start}, ${end})`;
      }
      row.textContent = `(${oldStart}, ${oldEnd}) · pivot ${pivot}, r=${r} · [${a.join(", ")}] · ${next}.`;
    }
    output.append(row);
  });
  form.addEventListener("change", reset);
  document.getElementById("trace-reset").addEventListener("click", reset);
  reset();

  function crossCount(L, R, mode) {
    let j = 0, count = 0;
    for (const x of L) {
      if (mode === "A" || mode === "C") {
        while (j < R.length && (mode === "A" ? x > 2 * R[j] : x > R[j] + 5)) j++;
        count += j;
      } else {
        while (j < R.length && (mode === "B" ? R[j] <= 3 * x : R[j] <= x + 10)) j++;
        count += R.length - j;
      }
    }
    return count;
  }
  function merge(L, R) {
    const result = [];
    let i = 0, j = 0;
    while (i < L.length && j < R.length) result.push(L[i] < R[j] ? L[i++] : R[j++]);
    return result.concat(L.slice(i), R.slice(j));
  }
  function countPairs(values, mode) {
    if (values.length <= 1) return { sorted: [...values], count: 0 };
    const mid = Math.floor(values.length / 2);
    const left = countPairs(values.slice(0, mid), mode);
    const right = countPairs(values.slice(mid), mode);
    return { sorted: merge(left.sorted, right.sorted),
      count: left.count + right.count + crossCount(left.sorted, right.sorted, mode) };
  }
  document.getElementById("pair-check").addEventListener("click", () => {
    const out = document.getElementById("pair-output");
    const raw = document.getElementById("pair-input").value.split(",").map(v => v.trim());
    const values = raw.map(Number);
    if (raw.some(v => !/^\d+$/.test(v)) || values.length < 2 || values.length > 16 ||
        values.some(v => !Number.isSafeInteger(v) || v <= 0 || v > 1000000) ||
        new Set(values).size !== values.length) {
      out.textContent = "Virgülle ayrılmış 2–16 farklı pozitif tam sayı yaz; her sayı en çok 1.000.000 olmalı.";
      return;
    }
    const guessText = document.getElementById("pair-guess").value;
    const guess = Number(guessText);
    if (!guessText.trim() || !Number.isInteger(guess) || guess < 0) {
      out.textContent = "Önce çift sayısı için negatif olmayan bir tam sayı tahmin et.";
      return;
    }
    const mode = document.getElementById("pair-form").value;
    const mid = Math.floor(values.length / 2);
    const left = countPairs(values.slice(0, mid), mode);
    const right = countPairs(values.slice(mid), mode);
    const cross = crossCount(left.sorted, right.sorted, mode);
    const total = left.count + right.count + cross;
    out.textContent = `${guess === total ? "Doğru" : `Tahminin ${guess}; sonuç ${total}`} · ` +
      `Sol yarı: ${left.count}, sağ yarı: ${right.count}, cross: ${cross}. Toplam ${total}. ` +
      `Sorted L=[${left.sorted.join(", ")}], R=[${right.sorted.join(", ")}]. ` +
      "Orijinal gün sırası, ikiye bölme ile korunuyor.";
  });
  document.getElementById("print-review").addEventListener("click", () => window.print());
})();
