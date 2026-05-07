// Kenya products – displayed only when Kenya / Swahili language is selected

export const KENYA_CATEGORIES = [
  {
    key: "nafaka",
    title: "Nafaka na Viungo",
    icon: "🌽",
    items: [
      { id: "ke_001", name: "Unga wa mahindi", desc: "Kutumika kwa Ugali", price: "KES 120", badge: "Maarufu" },
      { id: "ke_002", name: "Mchele",           desc: "Mchele wa kupikia",  price: "KES 200" },
      { id: "ke_003", name: "Maharagwe",         desc: "Maharagwe bora",     price: "KES 90"  },
      { id: "ke_004", name: "Mafuta ya kupikia", desc: "Mafuta safi",        price: "KES 250" },
      { id: "ke_005", name: "Sukari",            desc: "Sukari nyeupe",      price: "KES 110" },
      { id: "ke_006", name: "Chumvi",            desc: "Chumvi ya iodini",   price: "KES 30"  },
      { id: "ke_007", name: "Unga wa ngano",     desc: "Unga laini",         price: "KES 150" },
    ],
  },
  {
    key: "maziwa",
    title: "Bidhaa za Maziwa",
    icon: "🥛",
    items: [
      { id: "ke_008", name: "Maziwa",  desc: "Maziwa mapya au ya pakiti", price: "KES 60"  },
      { id: "ke_009", name: "Mala",    desc: "Maziwa yaliyochachushwa",   price: "KES 50"  },
      { id: "ke_010", name: "Yoogati", desc: "Yoogati tamu",              price: "KES 80"  },
      { id: "ke_011", name: "Siagi",   desc: "Siagi / Margarine",         price: "KES 120" },
    ],
  },
  {
    key: "mboga",
    title: "Mboga na Matunda",
    icon: "🥬",
    items: [
      { id: "ke_012", name: "Nyanya",      desc: "Nyanya safi za shamba",  price: "KES 40"  },
      { id: "ke_013", name: "Kitunguu",    desc: "Vitunguu vikubwa",       price: "KES 35"  },
      { id: "ke_014", name: "Viazi",       desc: "Viazi vya kupikia",      price: "KES 70"  },
      { id: "ke_015", name: "Kabichi",     desc: "Kabichi nzuri",          price: "KES 45"  },
      { id: "ke_016", name: "Sukuma wiki", desc: "Mboga mbichi",           price: "KES 30", badge: "Maarufu" },
      { id: "ke_017", name: "Karoti",      desc: "Karoti nyekundu",        price: "KES 50"  },
    ],
  },
  {
    key: "mkate",
    title: "Mkate na Vitafunwa",
    icon: "🍞",
    items: [
      { id: "ke_018", name: "Mkate",                  desc: "Mkate laini wa dukani",   price: "KES 55"  },
      { id: "ke_019", name: "Mchanganyiko wa Mandazi", desc: "Mandazi bora ya nyumbani", price: "KES 70"  },
      { id: "ke_020", name: "Keki na vitafunwa",       desc: "Vitafunwa vitamu",         price: "KES 100" },
    ],
  },
  {
    key: "nyama",
    title: "Nyama na Samaki",
    icon: "🍳",
    items: [
      { id: "ke_021", name: "Mayai",                   desc: "Mayai mapya ya kuku",        price: "KES 15", badge: "Maarufu" },
      { id: "ke_022", name: "Kuku",                    desc: "Kuku mzima au vipande",      price: "KES 350" },
      { id: "ke_023", name: "Nyama ya ng'ombe",         desc: "Nyama safi ya ng'ombe",      price: "KES 500" },
      { id: "ke_024", name: "Samaki (tilapia, omena)",  desc: "Samaki wa ziwa Victoria",    price: "KES 200" },
    ],
  },
  {
    key: "vinywaji",
    title: "Vinywaji",
    icon: "☕",
    items: [
      { id: "ke_025", name: "Majani ya chai",      desc: "Chai bora ya Kenya",       price: "KES 90"  },
      { id: "ke_026", name: "Kahawa",              desc: "Kahawa ya Arabika ya Kenya", price: "KES 150" },
      { id: "ke_027", name: "Vinywaji vya fiziki", desc: "Soda za aina mbalimbali",   price: "KES 60"  },
      { id: "ke_028", name: "Jusi ya matunda",     desc: "Jusi asili ya matunda",     price: "KES 80"  },
    ],
  },
  {
    key: "nyumba",
    title: "Bidhaa za Nyumba",
    icon: "🧼",
    items: [
      { id: "ke_029", name: "Sabuni ya mgongo",       desc: "Sabuni ya kuogea",           price: "KES 40"  },
      { id: "ke_030", name: "Sabuni ya kuosha nguo",  desc: "Unga wa kufulia",            price: "KES 80"  },
      { id: "ke_031", name: "Karatasi ya choo",       desc: "Karatasi laini ya choo",     price: "KES 90"  },
      { id: "ke_032", name: "Sabuni ya kuosha sahani", desc: "Kioevu cha kusafisha vyombo", price: "KES 60" },
    ],
  },
];

// Flat list of popular Kenya products (for the popular grid)
export const KENYA_POPULAR = [
  { id: "ke_001", name: "Unga wa mahindi",          price: "KES 120", badge: "Maarufu",  category: "Nafaka"   },
  { id: "ke_005", name: "Sukari",                    price: "KES 110",                    category: "Nafaka"   },
  { id: "ke_004", name: "Mafuta ya kupikia",          price: "KES 250",                    category: "Nafaka"   },
  { id: "ke_008", name: "Maziwa",                    price: "KES 60",                     category: "Maziwa"   },
  { id: "ke_018", name: "Mkate",                     price: "KES 55",                     category: "Mkate"    },
  { id: "ke_021", name: "Mayai",                     price: "KES 15",  badge: "Maarufu",  category: "Nyama"    },
  { id: "ke_016", name: "Sukuma wiki",               price: "KES 30",  badge: "Maarufu",  category: "Mboga"    },
  { id: "ke_025", name: "Majani ya chai",             price: "KES 90",                     category: "Vinywaji" },
  { id: "ke_002", name: "Mchele",                    price: "KES 200",                    category: "Nafaka"   },
  { id: "ke_003", name: "Maharagwe",                 price: "KES 90",                     category: "Nafaka"   },
  { id: "ke_022", name: "Kuku",                      price: "KES 350",                    category: "Nyama"    },
  { id: "ke_009", name: "Mala",                      price: "KES 50",                     category: "Maziwa"   },
];
