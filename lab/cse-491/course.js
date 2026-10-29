/* CSE 491 Senior Design Project I — lesson list for the course page and the lesson footers.
   Order follows the syllabus §5 week plan; every worked example uses an invented project.
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-491"] = {
  code: "CSE 491",
  title: "Senior Design Project I",
  repo: "https://github.com/AkdenizOS/CSE-491-Senior-Design-Project-I",
  lessons: [
    { slug: "process", unit: "Dersin düzeni", lecture: "Week 1", title: "Dersin işleyişi: grup, danışman, not dağılımı, deadline'lar", min: 48, sections: 11, status: "open",
      desc: "Grup ve konu kaydı, kime hangi kanaldan yazılır, 20/20/20/40 not dağılımı, bireysel not, yedi evaluation criteria ve 15 haftalık plan.", tags: ["Syllabus"] },
    { slug: "supervisor-meetings", unit: "Dersin düzeni", lecture: "Weeks 2–13", title: "Danışman toplantıları ve Supervisor Meeting Form", min: 54, sections: 11, status: "open",
      desc: "Beş toplantının konusu, gündem, formun bütün alanları, action item yazmak, imza ve yükleme kuralları, danışmanın 4 seviyeli değerlendirmesi.", tags: ["%20", "Form"] },
    { slug: "problem-and-scope", unit: "Proposal", lecture: "Weeks 2–3", title: "Problem, hedef kullanıcı, scope ve success criteria", min: 58, sections: 12, status: "open",
      desc: "İlgi alanından gerçek bir probleme, problem statement, aim ve target users, scope'un içi ve dışı, ölçülebilir success criteria.", tags: [] },
    { slug: "similar-systems", unit: "Proposal", lecture: "Week 4", title: "Benzer sistemler ve literature review", min: 36, sections: 10, status: "open",
      desc: "Benzer sistemi aramak ve okumak, karşılaştırma tablosu, gap'i yazmak, IEEE ya da APA ile kaynak, lisans ve academic integrity.", tags: [] },
    { slug: "requirements", unit: "Proposal", lecture: "Week 5", title: "Requirements analysis: FR, NFR, MoSCoW, traceability", min: 52, sections: 10, status: "open",
      desc: "Functional ve non-functional requirement, \"The system shall …\" kalıbı, iyi requirement'ın altı özelliği, ölçülebilir NFR, MoSCoW, traceability.", tags: [] },
    { slug: "proposal", unit: "Proposal", lecture: "Week 5", title: "Project proposal'ı yazmak", min: 61, sections: 12, status: "open",
      desc: "Şablonun header'ı ve dokuz bölümü tek tek: summary, problem, objectives, similar systems, requirements, method ve technology, work plan, risk.", tags: ["%20"] },
    { slug: "design-and-technology", unit: "Tasarım ve geliştirme", lecture: "Weeks 6–7", title: "System design ve technology selection", min: 61, sections: 12, status: "open",
      desc: "Architecture ve component'ler, architecture style seçimi, ER diagram, UML, wireframe ve user flow, ağırlıklı karar tablosu ile teknoloji seçimi.", tags: [] },
    { slug: "midterm-report", unit: "Tasarım ve geliştirme", lecture: "Week 8", title: "Ara rapor ve sunum", min: 60, sections: 12, status: "open",
      desc: "Ara raporun iskeleti ve derinliği, proposal'dan değişiklik kaydı, work package'lar, Weeks 9–15 Gantt planı ve kısa sunum.", tags: ["%20"] },
    { slug: "build-and-test", unit: "Tasarım ve geliştirme", lecture: "Weeks 9–13", title: "Repository, geliştirme ve test", min: 57, sections: 12, status: "open",
      desc: "Grup repository'si, branching ve pull request, running skeleton ve CI, why yazan commit'ler, integration ve success criteria'ya karşı test.", tags: [] },
    { slug: "final-and-demo", unit: "Final", lecture: "Weeks 14–15", title: "Final report, demo ve defence", min: 59, sections: 12, status: "open",
      desc: "Final report'un iskeleti, sonuçları success criteria'ya karşı ölçmek, repository'nin son hali, README, demo ve defence soruları.", tags: ["%40"] }
  ]
};
