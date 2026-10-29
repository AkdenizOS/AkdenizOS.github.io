/* CSE 481 Engineering Economics — lesson list for the course page and the lesson footers.
   Order follows the weekly slides (W1–W6) and the term-project brief; the last lesson is final-only.
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-481"] = {
  code: "CSE 481",
  title: "Engineering Economics",
  repo: "https://github.com/AkdenizOS/CSE-481-Engineering-Economics",
  // Optional countdown on the course page; it hides itself once the date has passed.
  exam: { name: "Vize", label: "3 Kas 13:30", date: "2026-11-03T13:30:00+03:00" },
  lessons: [
    { slug: "bist-ohlcv", unit: "Veri ve göstergeler", lecture: "W1", title: "BIST 100, OHLCV ve candlestick", min: 57, sections: 12, status: "open",
      desc: "Dersin data → rules → signals → backtest hattı, yfinance ile veri, OHLCV ve candle okuma, Close ile Adj Close, compounding ve buy-and-hold.", tags: ["Mini Lab", "Quiz"] },
    { slug: "support-resistance", unit: "Veri ve göstergeler", lecture: "W1", title: "Support ve resistance", min: 50, sections: 11, status: "open",
      desc: "Pivot High/Low, center=True ile gelen look-ahead, yakın fiyatları cluster'lamak, tolerance ve strength score, MCP tool olarak S/R.", tags: ["Mini Lab"] },
    { slug: "indicators-core", unit: "Veri ve göstergeler", lecture: "W1 + W3", title: "Teknik göstergeler I: SMA, EMA, RSI, MACD, volume", min: 50, sections: 11, status: "open",
      desc: "Gösterge grupları, lag ve noise, Wilder smoothing ile RSI'yı elle hesaplamak, RSI'dan event'e, MACD ve volume teyidi.", tags: ["Quiz"] },
    { slug: "indicators-volatility-trend", unit: "Veri ve göstergeler", lecture: "W3", title: "Teknik göstergeler II: Bollinger, ATR, KAMA, Supertrend, Ichimoku", min: 51, sections: 10, status: "open",
      desc: "Bollinger band touch, True Range ve ATR, Efficiency Ratio ile KAMA, Supertrend çizgisi, Ichimoku Cloud'un 26 bar kayması.", tags: ["Proje brief"] },
    { slug: "rules-backtest", unit: "Strateji ve backtest", lecture: "W1 + W4", title: "Kuraldan sinyale, sinyalden backtest'e", min: 58, sections: 11, status: "open",
      desc: "Vectorised backtest, shift(1) ve look-ahead bias kataloğu, benchmark, win rate, profit factor, max drawdown, Sharpe ratio.", tags: ["Quiz", "Mini Lab"] },
    { slug: "trade-management", unit: "Strateji ve backtest", lecture: "W3", title: "Trade management: stop, R ve trailing stop", min: 61, sections: 12, status: "open",
      desc: "Initial stop, R birimi, +1R activation, trailing stop, positive skew, expectancy ve break-even win rate, ATR stop ve position sizing.", tags: ["Quiz", "W3 slaytları"] },
    { slug: "four-strategies", unit: "Strateji ve backtest", lecture: "W3", title: "Dört strateji, tek çerçeve", min: 63, sections: 12, status: "open",
      desc: "Volume Bubbles, Liquidity Swings, S/R Channels ve Dual-Phase Reversal sekiz soruluk aynı çerçeveyle; aynı strateji neden her hissede çalışmaz.", tags: ["W3 slaytları"] },
    { slug: "time-series-patterns", unit: "Strateji ve backtest", lecture: "W5–W6", title: "Pandas ile time series ve weekday pattern'leri", min: 62, sections: 12, status: "open",
      desc: "Daily return, rolling pencereler, groupby ile weekday tablosu, ISO week pivot_table, time-based split ve multiple testing.", tags: ["Scenario 2"] },
    { slug: "harness-mcp", unit: "Agent ve araştırma", lecture: "W2", title: "Agentic harness ve MCP", min: 53, sections: 12, status: "open",
      desc: "Harness'ın state'leri ve tool izinleri, memory türleri, evidence bundle, data quality ve risk gate, human review ve replay.", tags: ["Proje brief"] },
    { slug: "scenarios-fundamentals", unit: "Agent ve araştırma", lecture: "W1–W2", title: "Dört araştırma senaryosu ve fundamentals", min: 55, sections: 11, status: "open",
      desc: "Sector lag score, event sayımı, point-in-time fundamentals ve disclosure date, açıklama sonrası fiyat, fundamental ve combined score.", tags: ["Proje brief"] },
    { slug: "midterm-review", unit: "Tekrar", lecture: "W1–W7", title: "Vize provası: yedi \"≠\" ayrımı ve formül kartı", min: 63, sections: 12, status: "open",
      desc: "Brief §38'in yedi ayrımı karışık sorularla, sınav sözlüğü, stop/R/trade metrikleri ve gösterge formülleri tek yerde.", tags: ["Vize öncesi"] },
    { slug: "engineering-economics-tvm", unit: "Final için", lecture: "W9+", title: "Engineering economics: time value of money, NPV, IRR", min: 67, sections: 12, status: "open",
      desc: "Cash flow diagram, compound interest, annuity ve gradient, nominal ve effective rate, MARR, NPV, IRR, MIRR, alternatif karşılaştırma.", tags: ["Final", "Schmid & Vanderby"] }
  ]
};
