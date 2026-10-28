/* CSE 301 Algorithms — lesson list for the course page and the lesson footers.
   Order follows the lecture order (Stanford CS161 Winter 2026, lectures 1–7).
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-301"] = {
  code: "CSE 301",
  title: "Algorithms",
  exam: { name: "Vize", date: "2026-10-30T09:00:00+03:00" },
  lessons: [
    { slug: "asymptotics", unit: "Temeller", lecture: "L1–2", title: "Asimptotik analiz ve döngü sayma", min: 45, sections: 11, status: "open",
      desc: "O, Ω, Θ tanımları, c ve n₀ ile ispat, fonksiyon sıralama, döngülerin karmaşıklığı.", tags: ["Her vizede", "HW1"] },
    { slug: "insertion-merge", unit: "Temeller", lecture: "L2", title: "InsertionSort ve MergeSort", min: 55, sections: 10, status: "open",
      desc: "Loop invariant ile doğruluk, özel girdilerde süre, inversion sayısı, MergeSort'un recursion tree'si.", tags: ["Sınav kalıbı", "Özel girdi"] },
    { slug: "recurrences", unit: "Recurrence", lecture: "L3", title: "Recursion tree ve Master theorem", min: 50, sections: 10, status: "open",
      desc: "Seviye tablosu, üç durum, uygulanamadığı yerler, değişken dönüşümü ve T(n−1) tipleri.", tags: ["Her vizede", "HW2"] },
    { slug: "substitution", unit: "Recurrence", lecture: "L3–4", title: "Substitution method", min: 55, sections: 11, status: "open",
      desc: "Tahmin et, tümevarımla ispatla: sabit c tuzağı, güçlü hipotez, T(n/5)+T(7n/10)+n.", tags: ["Sınav kalıbı"] },
    { slug: "select", unit: "Böl ve yönet", lecture: "L4", title: "Select ve median of medians", min: 50, sections: 11, status: "open",
      desc: "k. en küçüğü O(n)'de bulmak: partition, üç durum, 3n/10 lemması, gruplar neden 5.", tags: ["HW3"] },
    { slug: "quicksort", unit: "Rastgelelik", lecture: "L5", title: "Rastgele algoritmalar ve QuickSort", min: 55, sections: 11, status: "open",
      desc: "Las Vegas ve Monte Carlo, partition'ı elle izleme, beklenen karşılaştırma sayısı, eşit elemanlar.", tags: ["Sınav kalıbı", "HW3"] },
    { slug: "linear-sorting", unit: "Rastgelelik", lecture: "L6", title: "Sıralamada alt sınır, Counting ve RadixSort", min: 55, sections: 11, status: "open",
      desc: "Karar ağacı ile Ω(n log n), stable sıralama, RadixSort'ta taban seçimi.", tags: ["Yeni konu"] },
    { slug: "heaps", unit: "Veri yapıları", lecture: "L7", title: "Heap", min: 35, sections: 7, status: "soon",
      desc: "Complete binary tree, heap özelliği, insert ve extract-min O(log n), dizi gösterimi, HeapSort.", tags: ["L7 notları §2"] },
    { slug: "bst-red-black", unit: "Veri yapıları", lecture: "L7", title: "BST ve red-black tree", min: 55, sections: 11, status: "open",
      desc: "BST işlemleri ve yüksekliğin önemi, red-black kuralları, yüksekliğin O(log n) olduğunun ispatı.", tags: ["HW4"] },
    { slug: "dc-design", unit: "Böl ve yönet", lecture: "L1 + sınav", title: "Böl ve yönet tasarımı ve Karatsuba", min: 48, sections: 11, status: "open",
      desc: "Karatsuba fikri ve sınavdaki tasarım soruları: binary search varyantları, partition ile daraltma, Select ile bölme.", tags: ["Sınav kalıbı", "Tasarım"] }
  ]
};
