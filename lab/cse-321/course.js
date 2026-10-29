/* CSE 321 Statistical Inference and Computation — lesson list for the course page and the lesson footers.
   Order follows the weekly slides (W1–W4); lessons from W5 on follow McClave and Walpole until the slides are released.
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-321"] = {
  code: "CSE 321",
  title: "Statistical Inference and Computation",
  repo: "https://github.com/AkdenizOS/CSE-321-Statistical-Inference-and-Computation",
  lessons: [
    { slug: "inference-and-data", unit: "Temeller", lecture: "W1", title: "Description'dan inference'a: population, sample, veri", min: 51, sections: 11, status: "open",
      desc: "Population ve sample, parameter ve statistic, veri türleri, sampling design'ları, selection ve nonresponse bias, istatistikte etik.", tags: ["QB1", "Çıkmış sorular"] },
    { slug: "descriptive-recap", unit: "Temeller", lecture: "W1", title: "Center, spread, z-score, box plot ve normal distribution", min: 60, sections: 12, status: "open",
      desc: "Mean, median ve skew, variance ve neden n − 1, a + bx dönüşümü, Chebyshev ve empirical rule, z-score, quartile ve box plot, normal tablo.", tags: ["CSE 122 tekrarı"] },
    { slug: "probability-toolkit", unit: "Temeller", lecture: "W2", title: "Linear combination, covariance ve correlation", min: 50, sections: 10, status: "open",
      desc: "Linear combination'ın mean'i ve variance'ı, SD'ler değil variance'lar toplanır, 2·Cov terimi, covariance ve correlation elle.", tags: ["Zayıf nokta"] },
    { slug: "sampling-distributions", unit: "Temeller", lecture: "W2", title: "Sampling distribution, standard error ve CLT", min: 59, sections: 11, status: "open",
      desc: "Sampling distribution'ı elle kurmak, unbiased estimator, x̄'ın standard error'ı ve √n kuralı, Central Limit Theorem, p̂'nin dağılımı.", tags: ["Çıkmış sorular"] },
    { slug: "tests-for-a-mean", unit: "Hypothesis testing", lecture: "W3", title: "Hypothesis test mantığı: bir mean için z ve t", min: 59, sections: 11, status: "open",
      desc: "H₀ ve Hₐ kurmak, Type I ve II error, rejection region, p-value'nun ne olduğu ve olmadığı, large-sample z ve small-sample t test.", tags: ["Her sınavda"] },
    { slug: "proportion-variance-tests", unit: "Hypothesis testing", lecture: "W4", title: "Proportion ve variance testleri", min: 64, sections: 12, status: "open",
      desc: "Proportion için z test ve np₀ ≥ 15 şartı, şart bozulunca exact binomial, variance için chi-square testi, test seçimi.", tags: ["Zayıf nokta"] },
    { slug: "power-and-sample-size", unit: "Hypothesis testing", lecture: "W4", title: "Type II error, power ve sample size", min: 55, sections: 11, status: "open",
      desc: "β'yı adım adım hesaplamak, power curve, power'ı değiştiren dört şey, gereken n ve simulation ile planlama.", tags: ["W4 notebook"] },
    { slug: "intervals-and-using-tests", unit: "Hypothesis testing", lecture: "W4", title: "Confidence interval'lar ve testleri doğru kullanmak", min: 61, sections: 12, status: "open",
      desc: "z ve t interval, proportion ve variance interval'ı, \"95% confident\"ın anlamı, margin of error için n, CI ile test bağlantısı, Bonferroni.", tags: ["Her sınavda"] },
    { slug: "two-sample-independent", unit: "İki sample", lecture: "W5", title: "İki bağımsız sample: pooled ve Welch t", min: 57, sections: 11, status: "open",
      desc: "μ₁ − μ₂ için z ile CI ve test, pooled t ve condition'ları, variance'lar farklıysa Welch t, hangi testin seçileceği.", tags: ["McClave Ch.9"] },
    { slug: "paired-proportions-variances", unit: "İki sample", lecture: "W6", title: "Paired design, iki proportion, iki variance", min: 56, sections: 11, status: "open",
      desc: "Eşleştirmenin covariance ile kazancı, paired t, iki proportion için CI ve z test, iki variance için F testi.", tags: ["McClave Ch.9"] },
    { slug: "categorical-data", unit: "İki sample", lecture: "W7", title: "Goodness of fit ve contingency table", min: 61, sections: 12, status: "open",
      desc: "Multinomial experiment, expected count ve χ², degrees of freedom, one-way test dört adımda, Eᵢ ≥ 5 şartı, two-way contingency table.", tags: ["McClave Ch.13"] },
    { slug: "anova", unit: "Model kurma", lecture: "W9–W10", title: "Experimental design ve ANOVA", min: 61, sections: 11, status: "open",
      desc: "Completely randomized design, sum of squares ve F oranı, ANOVA tablosu, Tukey, Bonferroni ve Scheffé, randomized block ve factorial.", tags: ["McClave Ch.10"] },
    { slug: "simple-regression", unit: "Model kurma", lecture: "W11", title: "Simple linear regression ve correlation", min: 57, sections: 11, status: "open",
      desc: "Least squares doğrusu, β̂₀ ve β̂₁'i yorumlamak, slope için t test, r ve r², E(y) için confidence ve y için prediction interval.", tags: ["McClave Ch.11"] },
    { slug: "multiple-regression", unit: "Model kurma", lecture: "W12–W13", title: "Multiple regression ve diagnostics", min: 64, sections: 12, status: "open",
      desc: "Tek β için t test, R², adjusted R² ve global F test, interaction ve quadratic terim, model karşılaştırma ve residual analizi.", tags: ["McClave Ch.12"] },
    { slug: "nonparametric", unit: "Model kurma", lecture: "W14", title: "Nonparametric yöntemler: sign, Wilcoxon, Kruskal–Wallis", min: 62, sections: 12, status: "open",
      desc: "Sign test, Wilcoxon rank-sum ve signed-rank test, large-sample yaklaşımlar ve SciPy çıktısı, Kruskal–Wallis, Spearman.", tags: ["Walpole Ch.16"] }
  ]
};
