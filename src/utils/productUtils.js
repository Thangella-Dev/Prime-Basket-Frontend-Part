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

function sanitizeImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^hhttps:\/\//i.test(raw)) return raw.replace(/^hhttps:\/\//i, "https://");
  if (/^hhttp:\/\//i.test(raw)) return raw.replace(/^hhttp:\/\//i, "http://");
  return raw;
}

const CATEGORY_IMAGE_FALLBACKS = {
  rice: "/assets/redrice.png",
  oil: "/assets/olive-oil.png",
  "wheat-flour": "/assets/grocery-items.png",
  salt: "/assets/grocery-items.png",
  sugar: "/assets/grocery-items.png",
  "chilli-powder": "/assets/organic-food.png",
  "turmeric-powder": "/assets/organic-food.png",
  pulses: "/assets/grocery-items.png",
  masala: "/assets/organic-food.png",
  fruits: "/assets/fruits.png",
  vegetables: "/assets/groceries-and-vegetables.png",
  dairyProducts: "/assets/dairy-needs.png",
  feminineHygiene: "/assets/fresh&clean.png",
  homeNeeds: "/assets/fresh&clean.png",
  babyCare: "/assets/fresh&clean.png",
  instantFood: "/assets/chocolates.png",
  milkPowders: "/assets/milk.png",
  chipsAndNamkeens: "/assets/chocolates.png",
  oralCare: "/assets/fresh&clean.png",
  biscuitsAndCookies: "/assets/chocolates.png",
  coolDrinks: "/assets/sweetdrinks.png",
  bodyCare: "/assets/fresh&clean.png",
  meat: "/assets/chickenmeatballs.png",
};

const PRODUCT_IMAGE_RULES = [
  { match: /(rice|basmati|india gate|daawat)/i, image: "/assets/redrice.png" },
  { match: /(sunflower oil|gold oil|mustard oil|coconut oil|olive oil|cooking oil|vegetable oil|oil)/i, image: "/assets/olive-oil.png" },
  { match: /(atta|wheat flour|chakki|flour)/i, image: "/assets/grocery-items.png" },
  { match: /(salt)/i, image: "/assets/grocery-items.png" },
  { match: /(sugar|sweetener)/i, image: "/assets/grocery-items.png" },
  { match: /(chilli|chili powder)/i, image: "/assets/organic-food.png" },
  { match: /(turmeric|haldi)/i, image: "/assets/organic-food.png" },
  { match: /(dal|grams|peas|beans|rajma|moong|toor|masoor|pulses)/i, image: "/assets/grocery-items.png" },
  { match: /(masala|spice|seasoning|curry powder|garam)/i, image: "/assets/organic-food.png" },
  { match: /(apple|mango|banana|lychee|pear|fruit)/i, image: "/assets/fruits.png" },
  { match: /(tomato|potato|vegetable|broccoli|greens|onion)/i, image: "/assets/groceries-and-vegetables.png" },
  { match: /(milk|butter|paneer|cheese|curd|yoghurt|yogurt|ghee|whitener|dairy)/i, image: "/assets/dairy-needs.png" },
  { match: /(pads|tampons|feminine|whisper|sofy|wipes)/i, image: "/assets/fresh&clean.png" },
  { match: /(surf excel|vim|dishwash|detergent|cleaner|liquid wash|home needs)/i, image: "/assets/fresh&clean.png" },
  { match: /(pampers|baby wipes|baby care|diapers)/i, image: "/assets/fresh&clean.png" },
  { match: /(maggi|yippee|noodles|instant food)/i, image: "/assets/chocolates.png" },
  { match: /(milk powder|amulya|nestle everyday|powder)/i, image: "/assets/milk.png" },
  { match: /(bhujia|mad angles|chips|namkeen|crisps|snacks)/i, image: "/assets/chocolates.png" },
  { match: /(toothpaste|toothbrush|oral-b|colgate|dental|miswak)/i, image: "/assets/fresh&clean.png" },
  { match: /(soap|body wash|lotion|shampoo|conditioner|santoor|dove|vaseline|dettol)/i, image: "/assets/fresh&clean.png" },
  { match: /(eggs|egg)/i, image: "/assets/fresh-eggs.webp" },
  { match: /(chicken|curry cut|meat|fish|mutton)/i, image: "/assets/chickenmeatballs.png" },
  { match: /(biscuit|cookie|oreo|good day)/i, image: "/assets/chocolates.png" },
  { match: /(cola|coca|sprite|fanta|drink|cool drinks|soft drink)/i, image: "/assets/sweetdrinks.png" },
];

const GENERIC_PLACEHOLDER_ASSETS = new Set([
  "/assets/grocery-items.png",
  "/assets/organic-food.png",
  "/assets/fresh&clean.png",
  "/assets/chocolates.png",
  "/assets/milk.png",
  "/assets/dairy-needs.png",
  "/assets/groceries-and-vegetables.png",
]);

const PRODUCE_IMAGE_KEYWORDS = [
  "vegetable",
  "vegetables",
  "tomato",
  "tomatoes",
  "potato",
  "potatoes",
  "broccoli",
  "onion",
  "onions",
  "spinach",
  "mushroom",
  "carrot",
  "capsicum",
  "cauliflower",
  "corn",
  "banana",
  "apple",
  "mango",
  "pear",
  "grape",
  "grapes",
  "papaya",
  "pineapple",
  "orange",
  "watermelon",
  "melon",
  "avocado",
  "fruit",
  "fruits",
  "greens",
];

const CATEGORIES_THAT_SHOULD_NOT_USE_PRODUCE_ART = new Set([
  "babyCare",
  "oralCare",
  "homeNeeds",
  "feminineHygiene",
  "bodyCare",
  "biscuitsAndCookies",
  "chipsAndNamkeens",
  "instantFood",
  "coolDrinks",
  "milkPowders",
]);

export function resolveProductImage(product) {
  if (!product || typeof product !== "object") return "";
  const imageUrl = sanitizeImageUrl(product.imageUrl || product.image);
  const category = product._cat || "";
  const name = String(product.name || "");
  const ruleBasedImage = PRODUCT_IMAGE_RULES.find((rule) => rule.match.test(name))?.image;

  if (!imageUrl) return ruleBasedImage || CATEGORY_IMAGE_FALLBACKS[category] || "";

  if (GENERIC_PLACEHOLDER_ASSETS.has(imageUrl)) {
    return ruleBasedImage || CATEGORY_IMAGE_FALLBACKS[category] || imageUrl;
  }

  const lowered = imageUrl.toLowerCase();
  const looksLikeProduceArt = PRODUCE_IMAGE_KEYWORDS.some((keyword) => lowered.includes(keyword));
  if (looksLikeProduceArt && CATEGORIES_THAT_SHOULD_NOT_USE_PRODUCE_ART.has(category)) {
    return ruleBasedImage || CATEGORY_IMAGE_FALLBACKS[category] || imageUrl;
  }

  return imageUrl || ruleBasedImage || CATEGORY_IMAGE_FALLBACKS[category] || "";
}

/**
 * Enhances a product with dynamic weight/unit options if they don't exist.
 */
export function enhanceProduct(p, region = "in", isDeal = false) {
  if (!p) return p;

  const cat = p._cat || "";
  const nameLower = (p.name || "").toLowerCase();
  const imgLower = (p.imageUrl || "").toLowerCase();
  const templateKey = inferTemplateKey(cat, nameLower, imgLower);

  const templateUnits = [...(UNIT_TEMPLATES[templateKey] || UNIT_TEMPLATES["weight"])];
  const incomingUnits = Array.isArray(p.units)
    ? p.units
        .filter(Boolean)
        .map((unit) => ({
          label: unit?.label || unit?.name || "",
          multiplier: Number(unit?.multiplier) > 0 ? Number(unit.multiplier) : 1,
        }))
        .filter((unit) => unit.label)
    : [];

  let units = incomingUnits.length > 0 ? incomingUnits : templateUnits;
  let baseUnitObj = null;

  const detectedLabel = detectExplicitUnit(p);
  if (detectedLabel) {
    baseUnitObj = units.find((u) => u.label.toLowerCase() === detectedLabel.toLowerCase()) || { label: detectedLabel, multiplier: 1 };
    units = [baseUnitObj];
  }

  if (!baseUnitObj) {
    baseUnitObj =
      units.find((u) => p.baseUnit && u.label.toLowerCase() === String(p.baseUnit).toLowerCase()) ||
      units.find((u) => p.selectedUnit && u.label.toLowerCase() === String(p.selectedUnit).toLowerCase()) ||
      units.find((u) => u.multiplier === 1) ||
      units[0] ||
      { label: "1 unit", multiplier: 1 };
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
    ...specs,
    badge: finalBadge,
    basePrice: parsePrice(p.basePrice ?? currentPrice),
    baseUnit: baseUnitObj.label,
    units: units,
    discountPercent: discountPercent
  };
}

/**
 * Calculates current price and original price for a specific unit
 */
export function getProductPrices(p, selectedUnitLabel) {
  const safeProduct = enhanceProduct(p);
  const unit = (safeProduct?.units || []).find((u) => u.label === selectedUnitLabel) || { multiplier: 1 };
  const basePrice = parsePrice(safeProduct?.basePrice ?? safeProduct?.price);
  const price = basePrice * unit.multiplier;
  const discountPercent = safeProduct?.discountPercent || 0;
  const originalPrice = price + (price * discountPercent / 100);
  const savings = originalPrice - price;

  return {
    price,
    originalPrice,
    savings,
    discountPercent
  };
}

/**
 * Formats price based on region
 */
export function formatCurrency(amount, region = "in") {
  const prefix = region === "ke" ? "KES " : "\u20B9";
  return `${prefix}${amount.toFixed(2)}`;
}
