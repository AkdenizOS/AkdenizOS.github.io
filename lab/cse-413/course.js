/* CSE 413 Optimization Theory and Applications — lesson list for the course page and the lesson footers.
   Order follows the weekly plan (W1–W7); lessons for weeks without an instructor deck in the repo follow Winston and Boyd.
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-413"] = {
  code: "CSE 413",
  title: "Optimization Theory and Applications",
  repo: "https://github.com/AkdenizOS/CSE-413-Optimization-Theory-and-Applications",
  // Optional countdown on the course page; it hides itself once the date has passed.
  exam: { name: "Vize", label: "4 Kas 10:30", date: "2026-11-04T10:30:00+03:00" },
  lessons: [
    { slug: "modeling", unit: "Temeller", lecture: "W1", title: "Optimization problem'ini kurmak", min: 66, sections: 12, status: "open",
      desc: "Decision variable, objective ve constraint, feasible region, local ve global minimum, problem sınıfları ve 6 adımlık modelleme tarifi.", tags: ["Lab 1"] },
    { slug: "norms-gradients", unit: "Temeller", lecture: "W2", title: "Norm'lar, gradient ve gradient checker", min: 63, sections: 12, status: "open",
      desc: "ℓ1, ℓ2, ℓ∞ ve unit ball'lar, gradient ve directional derivative, least squares, chain rule, finite differences ve gradient checker.", tags: ["Lab 2"] },
    { slug: "hessian-convexity", unit: "Temeller", lecture: "W2", title: "Hessian, Taylor modeli ve convexity", min: 55, sections: 11, status: "open",
      desc: "Stationary point sınıflandırma, condition number, Taylor modelleri, definiteness testleri, convex set ve convex function, local = global.", tags: ["Lab 2"] },
    { slug: "lp-geometry", unit: "Linear programming", lecture: "W3", title: "LP geometrisi: polyhedron, vertex, BFS", min: 56, sections: 12, status: "open",
      desc: "Job-mix LP, inequality ve standard form, grafik çözüm, basic feasible solution, Fundamental Theorem of LP, bandwidth allocation.", tags: ["Sınav kalıbı"] },
    { slug: "simplex", unit: "Linear programming", lecture: "W3", title: "Tableau simplex adım adım", min: 62, sections: 12, status: "open",
      desc: "cⱼ − zⱼ satırıyla entering variable, ratio test ve pivot, final tableau'yu okumak, z-row convention'ına çeviri, min problem'leri.", tags: ["HW 2", "Winston §4"] },
    { slug: "simplex-special", unit: "Linear programming", lecture: "W3–W4", title: "Simplex'in özel durumları", min: 45, sections: 10, status: "open",
      desc: "Alternative optima, unbounded LP, degeneracy ve Bland's rule, Klee–Minty, artificial variable ile Big-M ve two-phase method.", tags: ["Winston §4"] },
    { slug: "lp-duality", unit: "Linear programming", lecture: "W4", title: "LP duality ve complementary slackness", min: 64, sections: 12, status: "open",
      desc: "Dual'ı kurmak ve işaret tablosu, weak ve strong duality, complementary slackness ile y* bulmak, y*'ı tableau'dan okumak, shadow price.", tags: ["Winston §6"] },
    { slug: "lp-sensitivity", unit: "Linear programming", lecture: "W4", title: "Sensitivity analysis: RHS ve objective ranging", min: 53, sections: 12, status: "open",
      desc: "RHS ranging ve B⁻¹, piecewise linear z*(b), basic ve nonbasic objective coefficient ranging, yeni activity'yi fiyatlamak, solver raporu.", tags: ["Winston §6"] },
    { slug: "gradient-descent", unit: "Unconstrained", lecture: "W5", title: "Gradient descent ve Armijo backtracking", min: 58, sections: 12, status: "open",
      desc: "Sabit step size, condition number ve zig-zag, exact line search, Armijo ve backtracking trial tablosu, Wolfe koşulları, convergence rate.", tags: ["Boyd §9"] },
    { slug: "newton-quasi-newton", unit: "Unconstrained", lecture: "W6", title: "Newton, BFGS ve Gauss–Newton", min: 65, sections: 12, status: "open",
      desc: "Newton step ve decrement, damped Newton, quadratic convergence, affine invariance, secant condition, BFGS, L-BFGS, Gauss–Newton.", tags: ["Boyd §9"] },
    { slug: "lagrange-kkt", unit: "Constrained", lecture: "W7", title: "Lagrange multipliers ve KKT", min: 60, sections: 12, status: "open",
      desc: "Multiplier'ın geometrisi, dört KKT koşulu ve case analysis, Slater ve LICQ, dual function ve strong duality, LP duality'nin KKT'si.", tags: ["Boyd §5", "Sınav kalıbı"] },
    { slug: "water-filling-barrier", unit: "Constrained", lecture: "W7", title: "Water-filling ve barrier method", min: 55, sections: 12, status: "open",
      desc: "Water-filling'i KKT ile çözmek ve ν üzerinde bisection, logarithmic barrier, central path ve duality gap m/t, barrier method, Phase I.", tags: ["Boyd §5, §11"] },
    { slug: "formula-sheet", unit: "Tekrar", lecture: "W1–W7", title: "Formül kartı ve karışık tekrar", min: 62, sections: 12, status: "open",
      desc: "El yazısı A4 kâğıda haftalara göre ne yazılır: norm ve gradient, tableau kuralları, dual ve sensitivity, line search, Newton, KKT.", tags: ["Vize öncesi"] }
  ]
};
