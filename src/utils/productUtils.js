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
    { label: "5kg", multiplier: 5 },
    { label: "10kg", multiplier: 10 },
    { label: "25kg", multiplier: 25 },
    { label: "50kg", multiplier: 50 }
  ],
  volume: [
    { label: "500ml", multiplier: 0.5 },
    { label: "1L", multiplier: 1 },
    { label: "2L", multiplier: 2 },
    { label: "3L", multiplier: 3 },
    { label: "5L", multiplier: 5 }
  ],
  small_volume: [
    { label: "250ml", multiplier: 0.5 },
    { label: "500ml", multiplier: 1 },
    { label: "1L", multiplier: 2 }
  ],
  count: [
    { label: "1 pc", multiplier: 1 },
    { label: "6 pcs", multiplier: 6 },
    { label: "12 pcs", multiplier: 12 }
  ],
  eggs: [
    { label: "6 pcs", multiplier: 0.2 }, // Base is 30 pack? No, let's assume price is for 30.
    // Actually, if we use multiplier 1 for the most common unit (e.g. 1kg or 1 tray).
    // Let's assume multiplier 1 = 1 piece/kg/L for simplicity in calculations.
    { label: "6 pcs", multiplier: 6 },
    { label: "12 pcs", multiplier: 12 },
    { label: "32 pcs", multiplier: 32 }
  ],
  pack: [
    { label: "1 pack", multiplier: 1 },
    { label: "3 packs", multiplier: 3 },
    { label: "6 packs", multiplier: 6 }
  ],
  flour: [
    { label: "1kg", multiplier: 1 },
    { label: "2kg", multiplier: 2 },
    { label: "12x2kg", multiplier: 24 }
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
  "turmeric-powder": "weight",
  "chilli-powder": "weight",
  masala: "weight",
  milkPowders: "weight",
  meat: "weight",
  coolDrinks: "small_volume",
  oil: "volume",
  dairyProducts: "volume",
  eggs: "eggs",
  biscuitsAndCookies: "pack",
  instantFood: "pack",
  chipsAndNamkeens: "pack",
  homeNeeds: "count",
  oralCare: "count",
  babyCare: "count",
  bodyCare: "count",
  feminineHygiene: "count"
};

/**
 * Parses price string like "₹45.00" or "KES 60" → number
 */
export function parsePrice(val) {
  if (typeof val === "number") return val;
  const cleaned = String(val || "").replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Enhances a product with dynamic weight/unit options if they don't exist.
 */
export function enhanceProduct(p, region = "in", isDeal = false) {
  if (!p) return p;

  // If already enhanced or has units, just return
  if (p.units && p.units.length > 0) return p;

  const cat = p._cat || "";
  let templateKey = CATEGORY_TO_TEMPLATE[cat] || "weight";

  // Dynamic template overrides based on product name and image
  const nameLower = (p.name || "").toLowerCase();
  const imgLower = (p.imageUrl || "").toLowerCase();
  
  const isSolidDairy = nameLower.includes("powder") || nameLower.includes("whitener") || nameLower.includes("cheese") || nameLower.includes("butter") || nameLower.includes("paneer") || nameLower.includes("ghee") || nameLower.includes("curd") || nameLower.includes("yogurt") || imgLower.includes("cheese") || imgLower.includes("butter") || imgLower.includes("paneer");
  
  const isMeat = nameLower.includes("chicken") || nameLower.includes("meat") || nameLower.includes("beef") || nameLower.includes("mutton") || nameLower.includes("pork") || nameLower.includes("fish") || imgLower.includes("meat") || imgLower.includes("beef") || imgLower.includes("chicken") || imgLower.includes("mutton") || imgLower.includes("fish");
  
  const isEgg = nameLower.includes("egg") || imgLower.includes("egg");

  if (cat.toLowerCase().includes("dairy") || cat.toLowerCase().includes("meat")) {
    if (isSolidDairy || isMeat) {
      templateKey = "weight";
    }
    if (isEgg) {
      templateKey = "eggs";
    }
  }

  let units = [...(UNIT_TEMPLATES[templateKey] || UNIT_TEMPLATES["weight"])];
  let baseUnitObj = null;

  // Attempt to parse explicit unit from name (e.g. "500ml", "1kg", "200g")
  const unitMatch = nameLower.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pc|pcs|pack|tin)\b/i);
  if (unitMatch) {
    const value = parseFloat(unitMatch[1]);
    let unitString = unitMatch[2].toLowerCase();
    
    if (unitString === "l") unitString = "L";
    if (unitString === "pc") unitString = "pcs";
    
    const detectedLabel = `${value}${unitString}`;
    
    // Check if detected unit exists in our current template
    baseUnitObj = units.find(u => u.label.toLowerCase() === detectedLabel.toLowerCase());
    
    // If not found in template, create a custom unit list for this specific SKU
    if (!baseUnitObj) {
       baseUnitObj = { label: detectedLabel, multiplier: 1 };
       units = [baseUnitObj]; // Restrict to only the detected unit!
    } else {
       // If it is found, restrict the options to just this one, because the unit is hardcoded in the product name!
       // This prevents confusing UI where the name says "500ml" but the dropdown says "1L".
       units = [baseUnitObj];
    }
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

