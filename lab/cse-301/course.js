/* CSE 301 Algorithms — lesson list for the course page and the lesson footers.
   Order follows the lecture order (Stanford CS161 Winter 2026, lectures 1–9).
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-301"] = {
  code: "CSE 301",
  title: "Algorithms",
  // Online midterm cancelled; do not invent a date for the paper resit.
  lessons: [
    { slug: "asymptotics", unit: "Temeller", lecture: "L1–2", title: "Asymptotic analysis ve loop analizi", min: 45, sections: 11, status: "open",
      desc: "O, Ω, Θ tanımları, c ve n₀ ile proof, fonksiyonları büyüme hızına göre sıralama, loop'ların running time'ı.", tags: ["Her vizede", "HW1"] },
    { slug: "insertion-merge", unit: "Temeller", lecture: "L2", title: "InsertionSort ve MergeSort", min: 55, sections: 10, status: "open",
      desc: "Loop invariant ile correctness, özel input'larda running time, inversion sayısı, MergeSort'un recursion tree'si.", tags: ["Sınav kalıbı", "Özel girdi"] },
    { slug: "recurrences", unit: "Recurrence", lecture: "L3", title: "Recursion tree ve Master theorem", min: 50, sections: 10, status: "open",
      desc: "Level tablosu, Master theorem'in üç case'i, uygulanamadığı yerler, change of variables ve T(n−1) tipleri.", tags: ["Her vizede", "HW2"] },
    { slug: "substitution", unit: "Recurrence", lecture: "L3–4", title: "Substitution method", min: 55, sections: 11, status: "open",
      desc: "Guess et, induction ile kanıtla: sabit c tuzağı, daha güçlü inductive hypothesis, T(n/5)+T(7n/10)+n.", tags: ["Sınav kalıbı"] },
    { slug: "select", unit: "Divide and conquer", lecture: "L4", title: "Select ve median of medians", min: 50, sections: 11, status: "open",
      desc: "k-th smallest'ı O(n)'de bulmak: partition, üç case, 3n/10 lemma'sı, group'lar neden 5'li.", tags: ["HW3"] },
    { slug: "quicksort", unit: "Randomization", lecture: "L5", title: "Randomized algorithms ve QuickSort", min: 55, sections: 11, status: "open",
      desc: "Las Vegas ve Monte Carlo, partition'ı elle trace etmek, expected comparison sayısı, eşit elemanlar.", tags: ["Sınav kalıbı", "HW3"] },
    { slug: "linear-sorting", unit: "Randomization", lecture: "L6", title: "Sorting lower bound, CountingSort ve RadixSort", min: 55, sections: 11, status: "open",
      desc: "Decision tree ile Ω(n log n), stable sorting, RadixSort'ta base seçimi.", tags: ["Yeni konu"] },
    { slug: "heaps", unit: "Data structures", lecture: "L7", title: "Heap", min: 35, sections: 7, status: "open",
      desc: "Complete binary tree, heap property, O(log n) insert ve extract-min, array representation, HeapSort.", tags: ["L7 notları §2"] },
    { slug: "bst-red-black", unit: "Data structures", lecture: "L7", title: "BST ve red-black tree", min: 55, sections: 11, status: "open",
      desc: "BST operation'ları ve height'ın önemi, red-black tree kuralları, height'ın O(log n) olduğunun proof'u.", tags: ["HW4"] },
    { slug: "hashing", unit: "Bonus quiz", lecture: "L8", title: "Hashing ve universal hash families", min: 48, sections: 9, status: "open",
      desc: "Chaining, collision, load factor, expected O(1), adversarial input ve universal hashing.", tags: ["Bonus quiz", "10 puana kadar"] },
    { slug: "graphs-bfs-dfs", unit: "Bonus quiz", lecture: "L9", title: "Graphs, BFS ve DFS", min: 58, sections: 10, status: "open",
      desc: "Graph representation, DFS times ve topological sort, BFS levels, shortest path ve bipartite test.", tags: ["Bonus quiz", "Kâğıt üzerinde"] },
    { slug: "dc-design", unit: "Divide and conquer", lecture: "L1 + sınav", title: "Divide and conquer tasarımı ve Karatsuba", min: 54, sections: 12, status: "open",
      desc: "Karatsuba fikri ve sınavdaki algorithm design soruları: binary search varyantları, partition ile daraltma, Select ile ikiye bölme.", tags: ["Sınav kalıbı", "Tasarım"] },
    { slug: "midterm-review", unit: "Özet", lecture: "L1–7 · Form A–D", title: "Vize provası · çıkmış A–D formları", min: 65, sections: 11, status: "open",
      desc: "Dört çıkmış form: gerekçeli cevaplar, recursion tree, QuickSelect izi, merge ile çift sayma ve strong induction.", tags: ["Vize", "Çıkan A–D", "Kâğıtta çöz"] },
    // Single-page trace without lab.js: no sections to track, so it stays out of the progress total.
    { slug: "sorting-trace", unit: "Özet", lecture: "L2–L7", title: "Sorting adım adım", min: 20, status: "open",
      desc: "7 sorting algoritması aynı array üzerinde satır satır: Insertion, Merge, Quick, Heap, Counting, Radix, Bucket.", tags: ["Tekrar"] }
  ]
};
