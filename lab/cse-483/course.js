/* CSE 483 Entrepreneurship — lesson list for the course page and the lesson footers.
   Order follows the syllabus weeks with the TTE01x videos; the KOSGEB page closes the list because the KOSGEB training replaces the midterm.
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-483"] = {
  code: "CSE 483",
  title: "Entrepreneurship",
  repo: "https://github.com/AkdenizOS/CSE-483-Entrepreneurship",
  // Optional countdown on the course page; it hides itself once the date has passed.
  exam: { name: "KOSGEB", label: "5 Kas 15:30", date: "2026-11-05T15:30:00+03:00" },
  lessons: [
    { slug: "girisimcilik-nedir", unit: "Girişimci ve fırsat", lecture: "W1–W2", title: "Girişimcilik nedir: türler ve myth'ler", min: 43, sections: 9, status: "open",
      desc: "Entrepreneur, manager ve investor farkı, girişimcilik türleri, KOBİ sınıflandırması, yeni işler neden batar, girişimcilik myth'leri.", tags: ["KOSGEB sorusu"] },
    { slug: "firsat-yaraticilik-yenilik", unit: "Girişimci ve fırsat", lecture: "W3", title: "İş fırsatı, yaratıcılık ve innovation", min: 41, sections: 9, status: "open",
      desc: "Fikir ile fırsat farkı, information asymmetry, gizli ihtiyaçlar, value proposition canvas, empathy map, Rogers'ın benimseme grupları.", tags: ["KOSGEB sorusu"] },
    { slug: "musteri-kesfi-ve-mvp", unit: "Girişimci ve fırsat", lecture: "TTE01x 05–08", title: "Customer discovery, beachhead market ve MVP", min: 42, sections: 9, status: "open",
      desc: "Go out of the building, beachhead market ve persona, müşteri görüşmesi, Webvan ve Zappos, landing page, Wizard of Oz ve Concierge MVP.", tags: ["KOSGEB sorusu"] },
    { slug: "ekosistem-turkiye-dunya", unit: "Girişimci ve fırsat", lecture: "W4", title: "Türkiye'de ve dünyada girişimcilik ekosistemi", min: 44, sections: 9, status: "open",
      desc: "Complements ve ecosystem pie model, partner seçme stratejileri, Türkiye'deki destek kurumları, Silicon Valley, Avrupa ve Asya.", tags: [] },
    { slug: "fizibilite-ve-kurulus-yeri", unit: "İş planının parçaları", lecture: "W5–W6", title: "Feasibility, hukuki yapı ve kuruluş yeri", min: 40, sections: 9, status: "open",
      desc: "Fizibilite etüdünün dört boyutu, misyon ve vizyon, şahıs işletmesi, limited ve anonim şirket, ağırlıklı puanlama ile kuruluş yeri.", tags: ["Hesap"] },
    { slug: "pazar-arastirmasi", unit: "İş planının parçaları", lecture: "W7", title: "Market research: segmentation, TAM/SAM/SOM, SWOT", min: 45, sections: 8, status: "open",
      desc: "Primary ve secondary research, segmentation ve hedef segment, sampling ve sample size, competitor analysis ve SWOT, TAM, SAM, SOM.", tags: ["Hesap"] },
    { slug: "pazarlama-plani", unit: "İş planının parçaları", lecture: "W8", title: "Pazarlama planı: 4P, positioning, pricing", min: 42, sections: 9, status: "open",
      desc: "Pazarlama körlüğü, 4P, positioning, değere göre fiyat, skimming ve penetration, dağıtım kanalları, CAC ve LTV, sales forecast.", tags: ["KOSGEB sorusu"] },
    { slug: "uretim-ve-yonetim-plani", unit: "İş planının parçaları", lecture: "W9–W10", title: "Üretim planı ve yönetim planı", min: 39, sections: 9, status: "open",
      desc: "Capacity ve technology selection, make-or-buy, layout, inventory ve quality control, yazılımda development plan, ekip, equity ve vesting.", tags: [] },
    { slug: "finans-plani-ve-fonlama", unit: "İş planının parçaları", lecture: "W11", title: "Finans planı: break-even, cash flow, fonlama", min: 42, sections: 9, status: "open",
      desc: "Kuruluş maliyeti ve işletme sermayesi, üç finansal tablo, başabaş noktası, kâr nakit değildir, fonlama aşamaları, equity ve dilution.", tags: ["Hesap"] },
    { slug: "is-modeli", unit: "İş planının parçaları", lecture: "W12", title: "İş modeli: Business Model Canvas", min: 43, sections: 9, status: "open",
      desc: "Business Model Canvas'ın dokuz bloğu, revenue model'ler, reseller ve franchising, platform ve pazaryeri, Nowi, Snocom, Bitsensor ve Tide.", tags: ["KOSGEB sorusu"] },
    { slug: "girisim-etigi", unit: "Etik ve sunum", lecture: "KOSGEB Bölüm 7", title: "Girişimin etik temelleri", min: 45, sections: 9, status: "open",
      desc: "Etik ve ahlak, girişimcinin bireysel ve sosyal sorumlulukları, beş etik ilke, etik liderlik; Bölüm 7'nin on öz değerlendirme sorusu.", tags: ["KOSGEB sorusu"] },
    { slug: "is-plani-pitch-unlu-girisimciler", unit: "Etik ve sunum", lecture: "W13–W14", title: "İş planı, pitch ve ünlü girişimciler", min: 37, sections: 8, status: "open",
      desc: "İş planının amacı ve bölümleri, pitch'te who cares ve why you, ünlü girişimci vakalarını okumak, survivorship bias.", tags: ["Dönem projesi"] },
    { slug: "kosgeb-hazirlik", unit: "KOSGEB", lecture: "5 Kas", title: "KOSGEB eğitimi hazırlık: soru bankası ve terimler", min: 45, sections: 9, status: "open",
      desc: "Eğitim hakkında bilinenler, 16 gerçek sorunun tuzakları, konulara göre KOSGEB tarzı soru bankası ve TR↔EN terim kartları.", tags: ["Vize yerine"] }
  ]
};
