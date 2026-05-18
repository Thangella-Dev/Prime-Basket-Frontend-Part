// src/utils/productUtils.js

const UNIT_TEMPLATES = {
  weight: [
    { label: "250g", multiplier: 0.25 },
    { label: "500g", multiplier: 0.5 },
    { label: "1kg", multiplier: 1 },
    { label: "2kg", multiplier: 2 },
    { label: "5kg", multiplier: 5 }
  ],
  bulk_weight: [
    { label: "1kg", multiplier: 1 },
    { label: "5kg", multiplier: 5 },
    { label: "10kg", multiplier: 10 },
    { label: "25kg", multiplier: 25 }
  ],
  volume: [
    { label: "500ml", multiplier: 0.5 },
    { label: "1L", multiplier: 1 },
    { label: "2L", multiplier: 2 },
    { label: "5L", multiplier: 5 }
  ],
  small_volume: [
    { label: "250ml", multiplier: 0.5 },
    { label: "500ml", multiplier: 1 },
    { label: "1L", multiplier: 2 }
  ],
  beverage: [
    { label: "300ml", multiplier: 0.6 },
    { label: "500ml", multiplier: 1 },
    { label: "1L", multiplier: 2 }
  ],
  spice: [
    { label: "100g", multiplier: 0.1 },
    { label: "250g", multiplier: 0.25 },
    { label: "500g", multiplier: 0.5 },
    { label: "1kg", multiplier: 1 }
  ],
  dairy_solid: [
    { label: "200g", multiplier: 0.2 },
    { label: "500g", multiplier: 0.5 },
    { label: "1kg", multiplier: 1 }
  ],
  milk: [
    { label: "500ml", multiplier: 0.5 },
    { label: "1L", multiplier: 1 },
    { label: "2L", multiplier: 2 }
  ],
  count: [
    { label: "1 pc", multiplier: 1 },
    { label: "2 pcs", multiplier: 2 },
    { label: "4 pcs", multiplier: 4 }
  ],
  eggs: [
    { label: "6 pcs", multiplier: 1 },
    { label: "12 pcs", multiplier: 2 },
    { label: "30 pcs", multiplier: 5 }
  ],
  pack: [
    { label: "1 pack", multiplier: 1 },
    { label: "2 packs", multiplier: 2 },
    { label: "4 packs", multiplier: 4 }
  ],
  flour: [
    { label: "1kg", multiplier: 1 },
    { label: "2kg", multiplier: 2 },
    { label: "5kg", multiplier: 5 },
    { label: "10kg", multiplier: 10 }
  ],
  household_pack: [
    { label: "1 pack", multiplier: 1 },
    { label: "2 packs", multiplier: 2 },
    { label: "3 packs", multiplier: 3 }
  ],
  care_volume: [
    { label: "100ml", multiplier: 0.2 },
    { label: "250ml", multiplier: 0.5 },
    { label: "500ml", multiplier: 1 }
  ]
};

const CATEGORY_TO_TEMPLATE = {
  fruits: "weight",
  vegetables: "weight",
  rice: "bulk_weight",
  pulses: "weight",
  sugar: "weight",
  salt: "weight",
  "wheat-flour": "flour",
  "turmeric-powder": "spice",
  "chilli-powder": "spice",
  masala: "spice",
  milkPowders: "weight",
  meat: "weight",
  coolDrinks: "beverage",
  oil: "volume",
  dairyProducts: "milk",
  eggs: "eggs",
  biscuitsAndCookies: "pack",
  instantFood: "pack",
  chipsAndNamkeens: "pack",
  homeNeeds: "household_pack",
  oralCare: "count",
  babyCare: "household_pack",
  bodyCare: "care_volume",
  feminineHygiene: "household_pack"
};

const UNIT_FIELDS = ["selectedUnit", "baseUnit", "standard", "unit", "quantityLabel", "weight", "size", "volume", "packSize"];

function normalizeDetectedUnit(value, unit) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const normalizedUnit = String(unit || "").toLowerCase();
  const normalizedValue = Number.isInteger(quantity) ? String(quantity) : String(quantity);

  if (["kg", "g", "ml"].includes(normalizedUnit)) return `${normalizedValue}${normalizedUnit}`;
  if (normalizedUnit === "l") return `${normalizedValue}L`;
  if (["pc", "piece", "pieces", "pcs"].includes(normalizedUnit)) return `${normalizedValue} pcs`;
  if (["pack", "packs", "packet", "packets", "sachet", "sachets", "bottle", "bottles", "can", "cans", "tray", "trays"].includes(normalizedUnit)) {
    const labelUnit =
      normalizedUnit === "packets" ? "packets" :
      normalizedUnit === "packet" ? "packet" :
      normalizedUnit === "packs" ? "packs" :
      normalizedUnit === "sachets" ? "sachets" :
      normalizedUnit === "sachet" ? "sachet" :
      normalizedUnit === "bottles" ? "bottles" :
      normalizedUnit === "bottle" ? "bottle" :
      normalizedUnit === "cans" ? "cans" :
      normalizedUnit === "can" ? "can" :
      normalizedUnit === "trays" ? "trays" :
      normalizedUnit === "tray" ? "tray" :
      quantity > 1 ? "packs" : "pack";
    return `${normalizedValue} ${labelUnit}`;
  }

  return null;
}

function detectExplicitUnit(product) {
  const sourceText = UNIT_FIELDS.map((field) => product?.[field]).find(Boolean) || product?.name || "";
  const normalizedSource = String(sourceText);
  const unitMatch = normalizedSource.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pc|pcs|piece|pieces|pack|packs|packet|packets|tray|trays|bottle|bottles|can|cans|sachet|sachets)\b/i);
  if (!unitMatch) return null;
  return normalizeDetectedUnit(unitMatch[1], unitMatch[2]);
}

function inferTemplateKey(cat, nameLower, imgLower) {
  const text = `${nameLower} ${imgLower}`;

  if (cat === "rice") return "bulk_weight";
  if (cat === "wheat-flour") return "flour";
  if (["turmeric-powder", "chilli-powder", "masala"].includes(cat)) return "spice";
  if (cat === "oil") return "volume";
  if (cat === "coolDrinks") return "beverage";
  if (["fruits", "vegetables", "pulses", "sugar", "salt", "milkPowders", "meat"].includes(cat)) return "weight";
  if (["biscuitsAndCookies", "instantFood", "chipsAndNamkeens"].includes(cat)) return "pack";

  if (cat === "dairyProducts") {
    if (/(milk|lassi|buttermilk|drink|yoghurt drink|yogurt drink)/.test(text)) return "milk";
    if (/(cheese|butter|paneer|ghee|curd|yogurt|yoghurt|cream|whitener)/.test(text)) return "dairy_solid";
    if (/egg/.test(text)) return "eggs";
    return "milk";
  }

  if (["homeNeeds", "babyCare", "feminineHygiene"].includes(cat)) {
    if (/(liquid|wash|cleaner|detergent|oil|lotion|shampoo|conditioner|gel|cream)/.test(text)) return "care_volume";
    return "household_pack";
  }

  if (["bodyCare", "oralCare"].includes(cat)) {
    if (/(soap|bar)/.test(text)) return "count";
    if (/(lotion|shampoo|conditioner|toothpaste|gel|wash|cream|oil|serum)/.test(text)) return "care_volume";
    return "count";
  }

  return CATEGORY_TO_TEMPLATE[cat] || "weight";
}

/**
 * Parses price string like "₹45.00" or "KES 60" → number
 */
export function parsePrice(val) {
  if (typeof val === "number") return val;
  const cleaned = String(val || "").replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export function sanitizeImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^hhttps:\/\//i.test(raw)) return raw.replace(/^hhttps:\/\//i, "https://");
  if (/^hhttp:\/\//i.test(raw)) return raw.replace(/^hhttp:\/\//i, "http://");
  return raw;
}

const CATEGORY_IMAGE_FALLBACKS = {
  oil: "/assets/olive-oil.png",
  "wheat-flour": "/assets/grocery-items.png",
  salt: "/assets/grocery-items.png",
  sugar: "/assets/grocery-items.png",
  "chilli-powder": "/assets/organic-food.png",
  "turmeric-powder": "/assets/organic-food.png",
  pulses: "/assets/grocery-items.png",
  masala: "/assets/organic-food.png",
  dairyProducts: "/assets/milk.png",
  feminineHygiene: "/assets/fresh&clean.png",
  homeNeeds: "/assets/fresh&clean.png",
  babyCare: "/assets/puppy.png",
  instantFood: "/assets/chocolates.png",
  milkPowders: "/assets/milk.png",
  chipsAndNamkeens: "/assets/chocolates.png",
  oralCare: "/assets/fresh&clean.png",
  bodyCare: "/assets/fresh&clean.png",
  meat: "/assets/fresh-eggs.webp",
};

const SUSPICIOUS_IMAGE_KEYWORDS_BY_CATEGORY = {
  oil: ["mushroom", "soft-drink", "fanta", "mirinda", "coke", "sprite", "rice", "atta", "pear", "melon"],
  "wheat-flour": ["rice", "soft-drink", "mushroom", "chips", "cookie", "biscuit"],
  salt: ["garlic", "biscuit", "cookie", "orange-cream", "fruit", "pear", "melon"],
  sugar: ["pear", "fruit", "biscuit", "cookie", "garlic"],
  "turmeric-powder": ["soup", "ramen", "biscuit", "cookie"],
  pulses: ["ramen", "snack", "chips", "cookie", "biscuit"],
  masala: ["ramen", "peanuts", "chips", "cookie", "biscuit"],
  dairyProducts: ["biscuit", "cookie", "chips", "snack"],
  feminineHygiene: ["biscuit", "cookie", "snack"],
  homeNeeds: ["soft-drink", "biscuit", "cookie", "snack"],
  babyCare: ["corn", "biscuit", "cookie", "snack"],
  instantFood: ["chips", "crisps"],
  milkPowders: ["biscuit", "cookie"],
  chipsAndNamkeens: ["tooth", "oral", "paste"],
  oralCare: ["chips", "crisps", "snack"],
  bodyCare: ["melon", "fruit", "pulses", "beans"],
  meat: ["pine", "coconut"],
};

const PRODUCT_IMAGE_RULES = [
  { match: /(sunflower oil|gold oil|cooking oil|vegetable oil|mustard oil|coconut oil|olive oil|oil)/i, image: "/assets/olive-oil.png" },
  { match: /(atta|wheat flour|chakki|flour)/i, image: "/assets/grocery-items.png" },
  { match: /(salt|pink salt|sea salt)/i, image: "/assets/grocery-items.png" },
  { match: /(sugar|sweetener|monkfruit|jaggery)/i, image: "/assets/grocery-items.png" },
  { match: /(chilli|chili powder|red chilli|red chili)/i, image: "/assets/organic-food.png" },
  { match: /(turmeric|haldi)/i, image: "/assets/organic-food.png" },
  { match: /(dal|grams|peas|beans|rajma|moong|toor|masoor|pulses)/i, image: "/assets/grocery-items.png" },
  { match: /(masala|spice|seasoning|curry powder|garam)/i, image: "/assets/organic-food.png" },
  { match: /(milk|butter|paneer|cheese|curd|yoghurt|yogurt|ghee|whitener|dairy)/i, image: "/assets/milk.png" },
  { match: /(pads|tampons|feminine|whisper|sofy|wipes)/i, image: "/assets/fresh&clean.png" },
  { match: /(surf excel|vim|dishwash|detergent|cleaner|liquid wash|home needs)/i, image: "/assets/fresh&clean.png" },
  { match: /(pampers|baby wipes|baby care|diapers)/i, image: "/assets/puppy.png" },
  { match: /(maggi|yippee|noodles|instant food)/i, image: "/assets/chocolates.png" },
  { match: /(milk powder|amulya|nestle everyday|powder)/i, image: "/assets/milk.png" },
  { match: /(bhujia|mad angles|chips|namkeen|crisps|snacks)/i, image: "/assets/chocolates.png" },
  { match: /(toothpaste|toothbrush|oral-b|colgate|dental|miswak)/i, image: "/assets/fresh&clean.png" },
  { match: /(soap|body wash|lotion|shampoo|conditioner|santoor|dove|vaseline|dettol)/i, image: "/assets/fresh&clean.png" },
  { match: /(eggs|egg)/i, image: "/assets/fresh-eggs.webp" },
  { match: /(chicken|curry cut|meat|fish|mutton)/i, image: "/assets/chickenmeatballs.png" },
  { match: /(apple|mango|banana|lychee|pear|fruit)/i, image: "/assets/fruits.png" },
  { match: /(tomato|potato|vegetable|broccoli|greens|onion)/i, image: "/assets/groceries-and-vegetables.png" },
  { match: /(rice|basmati|india gate|daawat)/i, image: "/assets/redrice.png" },
  { match: /(biscuit|cookie|oreo|good day)/i, image: "/assets/chocolates.png" },
  { match: /(cola|coca|sprite|fanta|drink|cool drinks|soft drink)/i, image: "/assets/sweetdrinks.png" },
];

const GENERIC_PLACEHOLDER_ASSETS = new Set([
  "/assets/grocery-items.png",
  "/assets/organic-food.png",
  "/assets/fresh&clean.png",
  "/assets/chocolates.png",
  "/assets/groceries-and-vegetables.png",
]);

const CATEGORY_ART_THEMES = {
  rice: { bgA: "#fff8e1", bgB: "#f5e8b8", accent: "#b67a11", chip: "Rice" },
  oil: { bgA: "#fff7d6", bgB: "#ffe89a", accent: "#c78a16", chip: "Oil" },
  "wheat-flour": { bgA: "#fffaf0", bgB: "#f5dfbf", accent: "#b97831", chip: "Atta" },
  salt: { bgA: "#f7fbff", bgB: "#dceeff", accent: "#4e7aa4", chip: "Salt" },
  sugar: { bgA: "#fff7fb", bgB: "#f4dff1", accent: "#a35892", chip: "Sugar" },
  "chilli-powder": { bgA: "#fff1f0", bgB: "#ffc8c0", accent: "#c93d2e", chip: "Chilli" },
  "turmeric-powder": { bgA: "#fff6db", bgB: "#ffd66e", accent: "#c28b15", chip: "Turmeric" },
  pulses: { bgA: "#f7f4ff", bgB: "#ddd1ff", accent: "#7250c7", chip: "Dal" },
  masala: { bgA: "#fff3ec", bgB: "#ffd1b3", accent: "#c56a24", chip: "Masala" },
  fruits: { bgA: "#fff1f4", bgB: "#ffc6d4", accent: "#cf4f7d", chip: "Fruit" },
  vegetables: { bgA: "#effbef", bgB: "#c8efca", accent: "#3d8a4c", chip: "Veg" },
  dairyProducts: { bgA: "#eef7ff", bgB: "#d5e9ff", accent: "#4f79c8", chip: "Dairy" },
  feminineHygiene: { bgA: "#fff4f8", bgB: "#ffd8ea", accent: "#c0558a", chip: "Care" },
  homeNeeds: { bgA: "#eef7ff", bgB: "#d6e8ff", accent: "#3d6db5", chip: "Home" },
  babyCare: { bgA: "#f5f1ff", bgB: "#ddd2ff", accent: "#7a66d6", chip: "Baby" },
  instantFood: { bgA: "#fff6eb", bgB: "#ffd8a8", accent: "#d17821", chip: "Instant" },
  milkPowders: { bgA: "#f5f9ff", bgB: "#dce8ff", accent: "#567bc2", chip: "Milk" },
  chipsAndNamkeens: { bgA: "#fff5ec", bgB: "#ffd7b0", accent: "#d07b1f", chip: "Snacks" },
  oralCare: { bgA: "#edf9ff", bgB: "#c8efff", accent: "#2b8bb0", chip: "Oral" },
  biscuitsAndCookies: { bgA: "#fff6ef", bgB: "#f6ddc5", accent: "#b77736", chip: "Cookies" },
  coolDrinks: { bgA: "#edf8ff", bgB: "#caeaff", accent: "#2d84bb", chip: "Drinks" },
  bodyCare: { bgA: "#f7f1ff", bgB: "#e2d5ff", accent: "#7e5bc3", chip: "Body" },
  meat: { bgA: "#fff1ef", bgB: "#ffd0c8", accent: "#cb5b4d", chip: "Fresh" },
};

function escapeSvgText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trimLabel(value, maxLength = 22) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function getSemanticHeadline(product) {
  const name = String(product?.name || "").trim();
  const brand = String(product?.brand || "").trim();
  if (!name) return "Prime Basket";
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    const withoutBrand = name.slice(brand.length).trim();
    if (withoutBrand) return trimLabel(withoutBrand, 24);
  }
  return trimLabel(name, 24);
}

function buildSemanticProductImage(product) {
  const category = product?._cat || "general";
  const theme = CATEGORY_ART_THEMES[category] || {
    bgA: "#f4f7fb",
    bgB: "#dbe7f5",
    accent: "#406a9a",
    chip: "Prime Basket",
  };
  const brand = trimLabel(product?.brand || "Prime Basket", 18);
  const headline = getSemanticHeadline(product);
  const unit = trimLabel(product?.standard || product?.selectedUnit || "", 10);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.bgA}" />
          <stop offset="100%" stop-color="${theme.bgB}" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" rx="54" fill="url(#bg)" />
      <circle cx="488" cy="112" r="74" fill="${theme.accent}" opacity="0.12" />
      <circle cx="130" cy="458" r="88" fill="${theme.accent}" opacity="0.08" />
      <rect x="52" y="52" width="496" height="496" rx="42" fill="#ffffff" fill-opacity="0.94" />
      <rect x="82" y="86" width="164" height="52" rx="26" fill="${theme.accent}" fill-opacity="0.12" />
      <text x="164" y="119" text-anchor="middle" font-size="26" font-family="Arial, sans-serif" font-weight="700" fill="${theme.accent}">${escapeSvgText(theme.chip)}</text>
      <text x="82" y="196" font-size="28" font-family="Arial, sans-serif" font-weight="700" fill="#58708d">${escapeSvgText(brand.toUpperCase())}</text>
      <text x="82" y="286" font-size="54" font-family="Arial, sans-serif" font-weight="700" fill="#17365d">${escapeSvgText(headline)}</text>
      <rect x="82" y="334" width="260" height="8" rx="4" fill="${theme.accent}" fill-opacity="0.22" />
      <rect x="82" y="372" width="380" height="18" rx="9" fill="#dbe7f4" />
      <rect x="82" y="406" width="300" height="18" rx="9" fill="#e7eef7" />
      <rect x="82" y="462" width="130" height="48" rx="24" fill="${theme.accent}" />
      <text x="147" y="493" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${escapeSvgText(unit || "Ready")}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function resolveProductImage(product) {
  if (!product || typeof product !== "object") return "";
  const imageUrl = sanitizeImageUrl(product.imageUrl || product.image);
  const category = product._cat || "";
  const name = String(product.name || "");
  const ruleBasedImage = PRODUCT_IMAGE_RULES.find((rule) => rule.match.test(name))?.image;
  if (!imageUrl) return buildSemanticProductImage(product);

  const lowered = imageUrl.toLowerCase();
  const suspiciousKeywords = SUSPICIOUS_IMAGE_KEYWORDS_BY_CATEGORY[category] || [];
  if (suspiciousKeywords.some((keyword) => lowered.includes(keyword))) {
    return ruleBasedImage || buildSemanticProductImage(product);
  }

  if (GENERIC_PLACEHOLDER_ASSETS.has(lowered)) {
    return buildSemanticProductImage(product);
  }

  return imageUrl || ruleBasedImage || buildSemanticProductImage(product);
}

/**
 * Enhances a product with dynamic weight/unit options if they don't exist.
 */
export function enhanceProduct(p, region = "in", isDeal = false) {
  if (!p) return p;

  // If already enhanced or has units, just return
  if (p.units && p.units.length > 0) return p;

  const sanitizedImageUrl = resolveProductImage(p);
  const cat = p._cat || "";
  const nameLower = (p.name || "").toLowerCase();
  const imgLower = sanitizedImageUrl.toLowerCase();
  const templateKey = inferTemplateKey(cat, nameLower, imgLower);

  let units = [...(UNIT_TEMPLATES[templateKey] || UNIT_TEMPLATES["weight"])];
  let baseUnitObj = null;

  const detectedLabel = detectExplicitUnit(p);
  if (detectedLabel) {
    baseUnitObj = units.find((u) => u.label.toLowerCase() === detectedLabel.toLowerCase()) || { label: detectedLabel, multiplier: 1 };
    units = [baseUnitObj];
  }

  if (!baseUnitObj) {
    baseUnitObj = units.find(u => u.multiplier === 1) || units[0];
  }
  
  const currentPrice = parsePrice(p.price);
  const oldPrice = parsePrice(p.oldPrice);
  let discountPercent = 0;
  let finalBadge = p.badge;
  if (typeof finalBadge === "string") {
    const trimmed = finalBadge.trim().toLowerCase();
    if (trimmed === "" || trimmed === "null" || trimmed === "undefined" || trimmed === "none") {
      finalBadge = null;
    }
  }

  // Business Logic Simulation: Only ~25% of products get the % OFF discounts (unless it's a Deal of the Day)
  const hash = (p._uid || p.name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isOfferEligible = isDeal || (hash % 4 === 0);

  if (isOfferEligible) {
    if (oldPrice > currentPrice) {
      discountPercent = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
    } else {
      // For Deals of the day, guarantee a discount if oldPrice is missing
      discountPercent = isDeal ? (15 + (hash % 20)) : (10 + (hash % 15));
    }
  }

  // Only ~30% of products get a brag tag to prevent clutter (unless it's a Deal of the Day)
  const isBragEligible = isDeal || (hash % 3 === 0);

  if (isBragEligible) {
    // Map or restore previous badge names based on category if empty
    if (!finalBadge) {
      if (["fruits", "vegetables", "dairyProducts", "meat"].includes(cat)) {
        finalBadge = "Fresh";
      } else if (["rice", "pulses", "wheat-flour"].includes(cat)) {
        finalBadge = "Organic";
      } else if (["homeNeeds", "babyCare", "bodyCare", "oralCare"].includes(cat)) {
        finalBadge = "Premium";
      } else {
        finalBadge = hash % 2 === 0 ? "Sale" : "Hot Deals";
      }
    }
    // Ensure "Hot" maps to "Hot Deals"
    if (finalBadge && finalBadge.toLowerCase() === "hot") {
      finalBadge = "Hot Deals";
    }
  } else {
    // Strip tag if not eligible
    finalBadge = null;
  }

  // Simulated Highlights and Product Info
  const isFood = ["fruits", "vegetables", "rice", "pulses", "sugar", "salt", "wheat-flour", "turmeric-powder", "chilli-powder", "masala", "milkPowders", "meat", "coolDrinks", "oil", "dairyProducts", "biscuitsAndCookies", "instantFood", "chipsAndNamkeens"].includes(cat);
  
  // Category-specific defaults for realistic UX
  const CATEGORY_SPECS = {
    fruits: { shelfLife: "3-5 Days", storage: "Refrigerate for freshness" },
    vegetables: { shelfLife: "4-7 Days", storage: "Store in a cool place or refrigerate" },
    dairyProducts: { shelfLife: "7-10 Days", storage: "Always keep refrigerated (below 4°C)" },
    meat: { shelfLife: "2-3 Days", storage: "Keep refrigerated or frozen" },
    coolDrinks: { shelfLife: "6-9 Months", storage: "Store in a cool place, serve chilled" },
    oil: { shelfLife: "12 Months", storage: "Store in a cool, dark place" },
    rice: { shelfLife: "12-24 Months", storage: "Store in an airtight container" },
    pulses: { shelfLife: "12 Months", storage: "Store in a dry place" },
    sugar: { shelfLife: "24 Months", storage: "Store in an airtight container" },
    salt: { shelfLife: "Unlimited", storage: "Store in a dry place" },
    "wheat-flour": { shelfLife: "6 Months", storage: "Store in a cool, dry place" },
    biscuitsAndCookies: { shelfLife: "6 Months", storage: "Store in an airtight container" },
    instantFood: { shelfLife: "9-12 Months", storage: "Store in a cool, dry place" },
    homeNeeds: { shelfLife: "24-36 Months", storage: "Keep away from direct sunlight" },
    babyCare: { shelfLife: "24 Months", storage: "Store in a cool, dry place" },
  };

  const catSpecs = CATEGORY_SPECS[cat] || { shelfLife: "12 Months", storage: "Store in a cool, dry place" };

  const specs = {
    keyFeatures: p.keyFeatures || (isFood ? "Naturally sourced, high-quality standards" : "Durable and effective for daily use"),
    dietaryPreference: p.dietaryPreference || (isFood ? (hash % 2 === 0 ? "Vegetarian" : "Gluten-Free") : "N/A"),
    shelfLife: p.shelfLife || catSpecs.shelfLife,
    storage: p.storage || catSpecs.storage,
    nutrition: p.nutrition || (isFood && hash % 2 === 0 ? {
      energy: "350 kcal",
      protein: "8g",
      carbs: "75g",
      fat: "1.2g"
    } : null)
  };

  return {
    ...p,
    imageUrl: sanitizedImageUrl,
    image: sanitizedImageUrl || p.image,
    ...specs,
    badge: finalBadge,
    basePrice: currentPrice,
    baseUnit: baseUnitObj.label,
    units: units,
    discountPercent: discountPercent
  };
}

/**
 * Calculates current price and original price for a specific unit
 */
export function getProductPrices(p, selectedUnitLabel) {
  const unit = (p.units || []).find(u => u.label === selectedUnitLabel) || { multiplier: 1 };
  const price = p.basePrice * unit.multiplier;
  const originalPrice = price + (price * (p.discountPercent || 0) / 100);
  const savings = originalPrice - price;

  return {
    price,
    originalPrice,
    savings,
    discountPercent: p.discountPercent || 0
  };
}

/**
 * Formats price based on region
 */
export function formatCurrency(amount, region = "in") {
  const prefix = region === "ke" ? "KES " : "\u20B9";
  return `${prefix}${amount.toFixed(2)}`;
}

