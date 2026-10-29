/* CSE 427 Wireless Sensor Networks — lesson list for the course page and the lesson footers.
   Order follows the weekly decks (W1–W7). W6 and W7 lessons follow the textbooks and RFCs because those slides are not in the repo.
   status: "open" | "soon". sections is the planned count shown before a visit. */
window.LAB_COURSES = window.LAB_COURSES || {};
window.LAB_COURSES["cse-427"] = {
  code: "CSE 427",
  title: "Wireless Sensor Networks",
  repo: "https://github.com/AkdenizOS/CSE-427-Wireless-Sensor-Networks",
  // Optional countdown on the course page; it hides itself once the date has passed.
  exam: { name: "Vize", label: "4 Kas 09:00", date: "2026-11-04T09:00:00+03:00" },
  lessons: [
    { slug: "intro-hardware", unit: "Temeller", lecture: "W1", title: "WSN nedir, constraint'ler ve mote anatomy", min: 61, sections: 12, status: "open",
      desc: "WSN tanımı ve altı constraint, application taxonomy, greenhouse vakası, mote block diagram, Contiki protothread'leri ve Cooja ile ilk simülasyon.", tags: ["W1 lab"] },
    { slug: "radio-propagation", unit: "Radio ve link", lecture: "W2", title: "dBm, link budget ve propagation", min: 56, sections: 12, status: "open",
      desc: "dBm ile dB farkı, link budget, sensitivity ve SNR, free-space ve log-distance path loss, shadowing, multipath ve fading.", tags: ["Hesap", "Slayt soruları"] },
    { slug: "link-metrics-802154", unit: "Radio ve link", lecture: "W2", title: "RSSI, LQI, PRR ve IEEE 802.15.4 PHY", min: 61, sections: 12, status: "open",
      desc: "Üç link metric'i ve çeliştikleri durumlar, transitional region, asymmetry, 802.15.4 channel'ları, DSSS ve CCA, Cooja radio medium'ları.", tags: ["W2 lab"] },
    { slug: "energy-accounting", unit: "Enerji", lecture: "W3", title: "Energy accounting ve duty cycle", min: 59, sections: 12, status: "open",
      desc: "Radio state'leri, idle listening, duty cycle ve average current, state-based energy modeli, Energest ve Powertrace satırını okumak.", tags: ["W3 lab · vize puanı", "Hesap"] },
    { slug: "battery-lifetime-harvesting", unit: "Enerji", lecture: "W3", title: "Battery lifetime ve energy harvesting", min: 59, sections: 12, status: "open",
      desc: "Linear lifetime modeli ve neden yanıldığı, usable capacity, node ve network lifetime, energy harvesting ve energy-neutral operation.", tags: ["Hesap"] },
    { slug: "mac-contention-hidden-exposed", unit: "MAC", lecture: "W4", title: "MAC temelleri: CSMA/CA, hidden ve exposed terminal", min: 57, sections: 11, status: "open",
      desc: "MAC'teki beş enerji israfı, CSMA/CA ve CCA, ACK ve 1/p, hidden ve exposed terminal, RTS/CTS'in WSN'e neden zayıf uyduğu.", tags: ["Slayt soruları"] },
    { slug: "lpl-mac-protocols", unit: "MAC", lecture: "W4", title: "Duty-cycled MAC'ler: B-MAC, X-MAC, ContikiMAC, RI-MAC", min: 61, sections: 12, status: "open",
      desc: "Rendezvous problemi, Low-Power Listening, B-MAC, X-MAC, ContikiMAC ve phase lock, wake interval seçimi, receiver-initiated MAC'ler.", tags: ["W4 lab · vize puanı"] },
    { slug: "tdma-scheduling", unit: "MAC", lecture: "W5", title: "TDMA, slotframe ve graph coloring", min: 58, sections: 12, status: "open",
      desc: "Timeslot ve slotframe, guard time ve clock drift, waiting delay, multi-hop cell sırası, conflict graph ve graph coloring ile slot sayısı.", tags: ["Hesap"] },
    { slug: "tsch-6tisch-industrial", unit: "MAC", lecture: "W5", title: "TSCH, channel hopping ve 6TiSCH", min: 63, sections: 12, status: "open",
      desc: "ASN ve channel offset'ten physical channel'a, channel hopping, Orchestra, 6TiSCH, 6P ve MSF, WirelessHART ve ISA100.11a.", tags: ["Hesap"] },
    { slug: "naming-6lowpan", unit: "Ağ katmanı", lecture: "W6", title: "Addressing ve 6LoWPAN", min: 64, sections: 12, status: "open",
      desc: "Name ve address, data-centric addressing, IPv6'nın 802.15.4'e sığmaması, IPHC header compression, fragmentation, CoAP ve MQTT-SN.", tags: ["Ders kitabı + RFC"] },
    { slug: "collection-rpl", unit: "Ağ katmanı", lecture: "W7", title: "Collection tree, ETX ve RPL", min: 62, sections: 12, status: "open",
      desc: "Collection traffic, hop count tuzağı ve ETX, RPL DODAG ve rank kuralı, Trickle timer, storing ve non-storing downward route.", tags: ["Ders kitabı + RFC"] }
  ]
};
