// src/services/groqService.js
// ALL product data comes live from Firebase Realtime Database.
// Nothing is hardcoded. The system prompt is built dynamically from the DB.

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL;
const GROQ_MODEL   = import.meta.env.VITE_GROQ_MODEL;
const DB_URL       = import.meta.env.VITE_FIREBASE_DATABASE_URL;

// ── Category registry ─────────────────────────────────────────────────────────
export const ALL_CATEGORIES = [
  { value: "rice",               label: "Rice" },
  { value: "oil",                label: "Oil" },
  { value: "wheat-flour",        label: "Wheat Flour" },
  { value: "salt",               label: "Salt" },
  { value: "sugar",              label: "Sugar" },
  { value: "chilli-powder",      label: "Chilli Powder" },
  { value: "turmeric-powder",    label: "Turmeric Powder" },
  { value: "pulses",             label: "Pulses" },
  { value: "masala",             label: "Masala" },
  { value: "fruits",             label: "Fruits" },
  { value: "vegetables",         label: "Vegetables" },
  { value: "dairyProducts",      label: "Dairy Products" },
  { value: "feminineHygiene",    label: "Feminine Hygiene" },
  { value: "homeNeeds",          label: "Home Needs" },
  { value: "babyCare",           label: "Baby Care" },
  { value: "instantFood",        label: "Instant Food" },
  { value: "milkPowders",        label: "Milk Powders" },
  { value: "chipsAndNamkeens",   label: "Chips & Namkeens" },
  { value: "oralCare",           label: "Oral Care" },
  { value: "biscuitsAndCookies", label: "Biscuits & Cookies" },
  { value: "coolDrinks",         label: "Cool Drinks" },
  { value: "bodyCare",           label: "Body Care" },
];

// ── Module-level cache ────────────────────────────────────────────────────────
let cachedAllProducts = null;
let cacheTimestamp    = null;
const CACHE_TTL_MS    = 5 * 60 * 1000;

// ── Normalise a raw Firebase product record ───────────────────────────────────
function normaliseProduct(p, catValue, index) {
  const badge = (p.badge || "").toLowerCase();
  return {
    _uid:      `${catValue}_${index}`,
    _cat:      catValue,
    _catLabel: ALL_CATEGORIES.find(c => c.value === catValue)?.label || catValue,
    name:      p.name      || "",
    brand:     p.brand     || "",
    price:     parseFloat(String(p.price    || "0").replace(/[^0-9.]/g, "")) || 0,
    oldPrice:  parseFloat(String(p.oldPrice || "0").replace(/[^0-9.]/g, "")) || 0,
    quantity:  p.quantity  || "",
    stars:     p.stars     != null ? Number(p.stars) : null,
    reviews:   p.reviews   || 0,
    inStock:   p.inStock   !== false,
    badge:     p.badge     || "",
    badgeClass: badge === "sale" ? "bs" : badge === "hot" ? "bh" : badge === "new" ? "bn" : badge ? "bo" : "",
    imageUrl:  p.imageUrl  || "",
  };
}

// ── Fetch a single category from Firebase ────────────────────────────────────
export async function fetchProductsByCategory(catValue) {
  if (cachedAllProducts) {
    const hit = cachedAllProducts.filter(p => p._cat === catValue);
    if (hit.length > 0) return hit;
  }
  const res = await fetch(`${DB_URL}/categories/${catValue}.json`);
  if (!res.ok) throw new Error(`Firebase ${catValue}: HTTP ${res.status}`);
  const data = await res.json();
  if (!data) return [];
  return Object.values(data).map((p, i) => normaliseProduct(p, catValue, i));
}

// ── Fetch ALL categories and cache ───────────────────────────────────────────
export async function fetchAllProducts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedAllProducts && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedAllProducts;
  }
  try {
    const res = await fetch(`${DB_URL}/categories.json`);
    if (!res.ok) throw new Error(`Firebase categories: HTTP ${res.status}`);
    const data = await res.json();
    if (!data) return [];

    const products = [];
    Object.entries(data).forEach(([catValue, items]) => {
      if (!items || typeof items !== "object") return;
      Object.values(items).forEach((p, i) => products.push(normaliseProduct(p, catValue, i)));
    });

    cachedAllProducts = products;
    cacheTimestamp    = now;
    return products;
  } catch (e) {
    console.error("fetchAllProducts failed:", e);
    try {
      const results = await Promise.all(
        ALL_CATEGORIES.map(c =>
          fetch(`${DB_URL}/categories/${c.value}.json`)
            .then(r => r.json())
            .then(data => data ? Object.values(data).map((p, i) => normaliseProduct(p, c.value, i)) : [])
            .catch(() => [])
        )
      );
      cachedAllProducts = results.flat();
      cacheTimestamp    = Date.now();
      return cachedAllProducts;
    } catch {
      return cachedAllProducts || [];
    }
  }
}

// ── Detect which categories the user is asking about ─────────────────────────
function detectRelevantCategories(userMessage) {
  const msg = userMessage.toLowerCase();

  const triggers = {
    "rice":               ["rice","బియ్యం","రైస్","basmati","sona","ponni","steam rice","raw rice"],
    "oil":                ["oil","నూనె","sunflower","olive","mustard","coconut","refined oil","cooking oil","groundnut"],
    "wheat-flour":        ["wheat","flour","atta","maida","గోధుమ","పిండి","roti","chapati","bread flour"],
    "salt":               ["salt","ఉప్పు","iodized","rock salt","sendha"],
    "sugar":              ["sugar","చక్కెర","jaggery","gur","powdered","cane sugar"],
    "chilli-powder":      ["chilli","chili","red chilli","మిర్చి","spicy","hot powder","mirchi"],
    "turmeric-powder":    ["turmeric","పసుపు","haldi","yellow powder","manjal"],
    "pulses":             ["dal","pulse","పప్పు","toor","moong","chana","masoor","lentil","urad","rajma","black gram","split"],
    "masala":             ["masala","మసాలా","spice","garam","coriander","jeera","cumin","pepper","biryani masala","sambar powder","rasam"],
    "fruits":             ["fruit","పండు","పండ్లు","apple","banana","mango","grape","orange","watermelon","strawberry","kiwi","papaya","guava","pomegranate","cherry"],
    "vegetables":         ["vegetable","veggie","కూరగాయ","కూర","tomato","onion","potato","spinach","carrot","broccoli","capsicum","cabbage","cauliflower","garlic","ginger","cucumber","beans","bitter gourd","ridge gourd","ladies finger","okra","peas","drumstick"],
    "dairyProducts":      ["dairy","పాల","milk","curd","paneer","butter","cream","ghee","cheese","yogurt","పెరుగు","నెయ్యి","buttermilk","lassi","tofu"],
    "feminineHygiene":    ["feminine","sanitary","pad","napkin","tampon","feminine hygiene","women hygiene","period","menstrual"],
    "homeNeeds":          ["home","household","cleaning","detergent","floor cleaner","toilet","broom","mop","dishwash","soap bar","laundry","fabric","phenyl","lizol","vim","harpic","గృహ"],
    "babyCare":           ["baby","శిశు","diaper","nappy","baby food","baby powder","infant","toddler","బేబీ","cerelac","nestum","baby lotion","baby oil"],
    "instantFood":        ["instant","maggi","noodle","pasta","soup","ready to eat","2 min","quick meal","oats instant","poha instant","upma","vermicelli"],
    "milkPowders":        ["milk powder","horlicks","boost","bournvita","milo","pediasure","infant formula","lactogen","complan","nangrow","doodh powder"],
    "chipsAndNamkeens":   ["chips","namkeen","snack","crisps","wafer","kurkure","lays","haldiram","స్నాక్","కర్కురే","bhujia","mixture","murukku","peanut","popcorn","fryums"],
    "oralCare":           ["toothpaste","toothbrush","mouthwash","oral","dental","teeth","colgate","pepsodent","sensodyne","tongue cleaner","floss","whitening"],
    "biscuitsAndCookies": ["biscuit","cookie","cracker","parle","britannia","oreo","digestive","marie","good day","bourbon","hide&seek","tiger biscuit","wafer","rusk","toast"],
    "coolDrinks":         ["cool drink","soft drink","soda","cola","juice","pepsi","coke","sprite","fanta","7up","limca","maaza","frooti","appy","tropicana","real juice","drink","beverage","పానీయ","energy drink","nimbooz","thums up"],
    "bodyCare":           ["body","skin","lotion","moisturizer","soap","shower","shampoo","hair","conditioner","face","cream","deodorant","perfume","వ్యక్తిగత","body wash","sunscreen","talcum","powder","dove","lux","pears","lifebuoy","dettol","savlon","head shoulders","pantene"],
  };

  // Cart/wishlist queries — handled separately, don't fetch products
  const cartPatterns   = ["my cart","show cart","show my cart","what's in my cart","basket","what is in my cart","కార్ట్","నా కార్ట్"];
  const wishPatterns   = ["my wishlist","my favorites","my wish","show wishlist","show favorites","wishlist","favorites","నా ఇష్టాలు"];
  if (cartPatterns.some(k => msg.includes(k))) return "CART";
  if (wishPatterns.some(k => msg.includes(k))) return "WISHLIST";

  // Broad queries — sample all categories
  const broadPatterns = [
    "all","అన్ని","అన్నీ","everything","show me","what do you have",
    "available","అందుబాటు","best","deals","offer","discount","list",
    "what products","what items","what do you sell","your products",
  ];
  if (broadPatterns.some(k => msg.includes(k))) return null;

  const matched = [];
  for (const [cat, keywords] of Object.entries(triggers)) {
    if (keywords.some(k => msg.includes(k))) matched.push(cat);
  }
  return matched.length > 0 ? matched : null;
}

// ── Select products for the prompt ───────────────────────────────────────────
export async function selectProductsForPrompt(userMessage) {
  const relevantCats = detectRelevantCategories(userMessage);

  // Cart/wishlist queries — no catalog products needed
  if (relevantCats === "CART" || relevantCats === "WISHLIST") return [];

  if (relevantCats === null) {
    const all = await fetchAllProducts();
    const byCategory = {};
    all.forEach(p => {
      if (!byCategory[p._cat]) byCategory[p._cat] = [];
      if (byCategory[p._cat].length < 3) byCategory[p._cat].push(p);
    });
    return Object.values(byCategory).flat().slice(0, 45);
  }

  const results = await Promise.all(relevantCats.map(c => fetchProductsByCategory(c).catch(() => [])));
  const matched = results.flat();

  if (matched.length < 5) {
    const all = await fetchAllProducts();
    const extra = all.filter(p => !relevantCats.includes(p._cat)).slice(0, 10);
    return [...matched, ...extra].slice(0, 30);
  }
  return matched.slice(0, 30);
}

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(products, cartItems = [], wishlistItems = []) {
  const starsDisplay = (n) => {
    if (n == null) return "★★★★☆";
    const full = Math.round(n);
    return "★".repeat(Math.max(0, Math.min(full, 5))) + "☆".repeat(Math.max(0, 5 - Math.min(full, 5)));
  };

  // ── Build cart section ──
  let cartSection = "";
  if (cartItems.length === 0) {
    cartSection = "USER'S CURRENT BASKET: Empty (no items added yet)";
  } else {
    const cartTotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0;
      const qty   = item.quantity || item.qty || 1;
      return sum + price * qty;
    }, 0);
    const cartLines = cartItems.map(item => {
      const price = parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0;
      const qty   = item.quantity || item.qty || 1;
      return `  - ${item.name} (${item.brand || ""}) x${qty} @ ₹${price} = ₹${(price * qty).toFixed(2)}`;
    }).join("\n");
    cartSection = `USER'S CURRENT BASKET (${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}, total ₹${cartTotal.toFixed(2)}):\n${cartLines}`;
  }

  // ── Build wishlist section ──
  let wishlistSection = "";
  if (wishlistItems.length === 0) {
    wishlistSection = "USER'S WISHLIST / FAVORITES: Empty";
  } else {
    const wishLines = wishlistItems.map(item =>
      `  - ${item.name} (${item.brand || ""}) @ ₹${parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0}`
    ).join("\n");
    wishlistSection = `USER'S WISHLIST / FAVORITES (${wishlistItems.length} item${wishlistItems.length !== 1 ? "s" : ""}):\n${wishLines}`;
  }

  // ── Build catalog section ──
  let catalogSection = "";
  if (products.length > 0) {
    const catalogLines = products.map(p =>
      [
        p.name,
        p._catLabel,
        `₹${p.price}`,
        p.oldPrice > 0 ? `was:₹${p.oldPrice}` : "",
        starsDisplay(p.stars),
        `(${p.reviews} reviews)`,
        p.quantity ? `pkg:${p.quantity}` : "",
        p.brand ? `brand:${p.brand}` : "",
        p.badge ? `badge:${p.badge}` : "",
        p.inStock ? "inStock" : "outOfStock",
        p.imageUrl,
      ].filter(Boolean).join("|")
    ).join("\n");
    catalogSection = `\nLIVE PRODUCT CATALOG (name|category|price|oldPrice|stars|reviews|pkg|brand|badge|stock|imageUrl):\n${catalogLines}`;
  }

  const categoryList = ALL_CATEGORIES.map(c => c.label).join(", ");

  return `You are PrimeBot — the smart AI assistant built into PrimeBasket, an Indian online grocery store.
Do NOT mention Groq, Llama, or Meta. You are PrimeBasket's own AI.

STORE CATEGORIES: ${categoryList}

LANGUAGE:
- User writes Telugu → reply in Telugu
- User writes English → reply in English
- Product JSON "name" fields must ALWAYS be English

━━━ USER'S LIVE STATE ━━━
${cartSection}

${wishlistSection}

IMPORTANT: When the user asks about their cart/basket or wishlist/favorites:
- If cart is requested AND cart has items: reply with short text + SHOW_CART action block
- If wishlist is requested AND wishlist has items: reply with short text + SHOW_WISHLIST action block
- If cart/wishlist is empty: reply in plain text saying it is empty — no action block needed
${catalogSection}

━━━ RESPONSE FORMAT ━━━

① SHOW / BROWSE store products — text + product block:
\`\`\`products
[{"name":"EXACT_DB_NAME","brand":"","category":"","price":0,"oldPrice":0,"quantity":"","imageUrl":"EXACT_DB_URL","badge":"","badgeClass":"","stars":"★★★★☆","reviews":0,"inStock":true}]
\`\`\`

② ADD TO CART — text + product block + action block:
\`\`\`products
[{...}]
\`\`\`
\`\`\`action
{"type":"ADD_TO_CART","products":[{...same list...}]}
\`\`\`

③ ADD TO WISHLIST/FAVORITES — text + product block + action block:
\`\`\`products
[{...}]
\`\`\`
\`\`\`action
{"type":"ADD_TO_FAVORITES","products":[{...same list...}]}
\`\`\`

④ REMOVE FROM CART — text only + action block (no products block):
\`\`\`action
{"type":"REMOVE_FROM_CART","products":[{"name":"EXACT_PRODUCT_NAME"}]}
\`\`\`

⑤ REMOVE FROM WISHLIST — text only + action block:
\`\`\`action
{"type":"REMOVE_FROM_WISHLIST","products":[{"name":"EXACT_PRODUCT_NAME"}]}
\`\`\`

⑥ CLEAR CART — text only + action block:
\`\`\`action
{"type":"CLEAR_CART","products":[]}
\`\`\`

⑦ SHOW CART — short text + action block (no products block):
\`\`\`action
{"type":"SHOW_CART","products":[]}
\`\`\`

⑧ SHOW WISHLIST — short text + action block (no products block):
\`\`\`action
{"type":"SHOW_WISHLIST","products":[]}
\`\`\`

⑨ GENERAL CHAT → plain text only, no JSON blocks

━━━ JSON RULES ━━━
• name → exact English string from catalog (or exact name from cart/wishlist for remove actions)
• price / oldPrice → plain number, no ₹
• badgeClass → "bs"=sale "bh"=hot "bn"=new "bo"=other ""=none
• stars → ★ symbols e.g. "★★★★☆"
• imageUrl → MUST be exact URL from catalog — never guess or invent
• Max 6 products per response
• Valid JSON: double quotes, no trailing commas
• NEVER invent products not in the catalog`;
}

// ── Main export: send a chat message ─────────────────────────────────────────
// Now accepts cartItems and wishlistItems so the AI knows what the user has
export async function chatWithGroq(history, newMessage, cartItems = [], wishlistItems = []) {
  const products = await selectProductsForPrompt(newMessage);

  const messages = [
    { role: "system", content: buildSystemPrompt(products, cartItems, wishlistItems) },
    ...history.slice(-6).map(m => ({
      role:    m.role === "bot" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: newMessage },
  ];

  const res = await fetch(GROQ_API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 800, temperature: 0.65 }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq error:", res.status, err);
    throw new Error(`Groq API ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}