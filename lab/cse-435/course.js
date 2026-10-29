/* CSE 435 Formal Languages and Automata — lesson list for the course page and the lesson footers.
   Order follows Sipser Ch 1–2 as taught in Part 1; the last lesson maps the five-question midterm.
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-435"] = {
  code: "CSE 435",
  title: "Formal Languages and Automata",
  repo: "https://github.com/AkdenizOS/CSE-435-Formal-Languages-and-Automata-",
  // Optional countdown on the course page; it hides itself once the date has passed.
  exam: { name: "Vize", label: "6 Kas 09:00", date: "2026-11-06T09:00:00+03:00" },
  lessons: [
    { slug: "languages-dfa", unit: "Regular languages", lecture: "Sipser 0.2, 1.1", title: "Alphabet, string, language ve ilk DFA'lar", min: 59, sections: 12, status: "open",
      desc: "Σ*, ε ve ∅, ilk state diagram, 5-tuple tanımı, L(M), \"neyi hatırlamam lazım?\" yöntemi ve tahtadaki DFA örnekleri.", tags: ["Sıfırdan", "P1"] },
    { slug: "dfa-design", unit: "Regular languages", lecture: "Sipser 1.1", title: "DFA tasarım kalıpları: product construction ve mod-k", min: 61, sections: 12, status: "open",
      desc: "Mod k sayaç, product construction ile A ∩ B ve A ∪ B, divisible-by-k, sağdan sola okuma, minimization ve sınavın P1 kalıpları.", tags: ["Her vizede", "P1"] },
    { slug: "nfa-subset", unit: "Regular languages", lecture: "Sipser 1.2", title: "NFA, ε-move ve subset construction", min: 57, sections: 11, status: "open",
      desc: "Nondeterminism'i kopyalarla düşünmek, guess-and-check tasarımı, ε-closure, subset construction elle ve 2ⁿ patlaması.", tags: ["Sınav kalıbı"] },
    { slug: "nfa-fewest", unit: "Regular languages", lecture: "Sipser 1.2", title: "En az state'li NFA", min: 52, sections: 11, status: "open",
      desc: "P2'nin puanlama kuralı, dead state'siz NFA, son k sembol, state birleştirme ve 2023–2024 P2 soruları adım adım.", tags: ["Her vizede", "P2"] },
    { slug: "regex-gnfa", unit: "Regular languages", lecture: "Sipser 1.3", title: "Regular expression ↔ NFA ve GNFA", min: 57, sections: 11, status: "open",
      desc: "Regex'in formal tanımı ve precedence, regex → NFA, GNFA ve state elimination ile NFA → regex.", tags: ["2019 vizesi"] },
    { slug: "pumping-regular", unit: "Regular languages", lecture: "Sipser 1.4", title: "Pumping lemma ile 'regular değildir' ispatı", min: 60, sections: 12, status: "open",
      desc: "Pigeonhole fikri, Theorem 1.70'in birebir ifadesi, ispat oyunu, kritik s seçimi, pump up ve down, closure ile dolaylı ispat.", tags: ["Her vizede", "P3"] },
    { slug: "cfg", unit: "Context-free languages", lecture: "Sipser 2.1", title: "CFG tasarımı, derivation, ambiguity ve CNF", min: 60, sections: 11, status: "open",
      desc: "Grammar'ın formal tanımı, leftmost derivation ve parse tree, dıştan içe eşleştirme, aᵏbᵐcⁿ ailesi, ambiguity ve Chomsky normal form.", tags: ["Her vizede", "P4"] },
    { slug: "pda", unit: "Context-free languages", lecture: "Sipser 2.2", title: "Pushdown automata ve CFG ↔ PDA", min: 66, sections: 12, status: "open",
      desc: "Stack ile NFA, a,b → c okuma, dip işareti, ortayı tahmin etmek, hocanın \"her faza bir state\" kuralı ve CFG ↔ PDA çevirisi.", tags: ["Her vizede", "P4"] },
    { slug: "pumping-cfl", unit: "Context-free languages", lecture: "Sipser 2.3", title: "CFL pumping lemma ile 'context-free değildir' ispatı", min: 65, sections: 12, status: "open",
      desc: "Parse tree'de tekrar eden variable, Theorem 2.34, vxy penceresiyle durum analizi, ww ve palindromlar, 2024 P5 ve closure.", tags: ["Her vizede", "P5"] },
    { slug: "midterm-strategy", unit: "Tekrar", lecture: "Part 1", title: "Dil sınıflandırma ve vize stratejisi", min: 63, sections: 12, status: "open",
      desc: "Beş soru beş yöntem, 90 dakikalık zaman planı, regular / context-free / ötesi sınıflandırma antrenmanı ve deneme sınavı yönergesi.", tags: ["Vize öncesi"] }
  ]
};
