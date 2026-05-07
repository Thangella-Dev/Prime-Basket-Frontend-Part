const fs = require('fs');
const path = require('path');

const resolved = JSON.parse(fs.readFileSync('resolved_kenya_batch_4.json', 'utf8'));
const filePath = path.join(__dirname, '../src/data/kenya_products.js');
let content = fs.readFileSync(filePath, 'utf8');

const products = [
  // Home needs (Mahitaji ya Nyumbani)
  { original: "https://ibb.co/nq94wFqx", cat: "homeNeeds", name: "Majimaji ya Kuoshea Vyombo ya Morning Fresh (Original)", brand: "Morning Fresh", price: "KES 245" },
  { original: "https://ibb.co/23QbWwK0", cat: "homeNeeds", name: "Kisafisha Sakafu cha Maxel Magic (Limau)", brand: "Maxel", price: "KES 380" },
  { original: "https://ibb.co/FkV8ytxB", cat: "homeNeeds", name: "Kizuizi cha Choo cha Safisha (Breeze)", brand: "Safisha", price: "KES 150" },
  { original: "https://ibb.co/HpzNz58k", cat: "homeNeeds", name: "Majimaji ya Kuoshea Vyombo ya Morning Fresh (Limau)", brand: "Morning Fresh", price: "KES 245" },
  { original: "https://ibb.co/bjFxDCTj", cat: "homeNeeds", name: "Majimaji ya Kufua ya Persil (Lavender)", brand: "Persil", price: "KES 1,200" },
  { original: "https://ibb.co/DfkHpCjz", cat: "homeNeeds", name: "Harpic Power Plus (Citrus) Pakiti ya Ofa", brand: "Harpic", price: "KES 450" },
  { original: "https://ibb.co/0RJFCgY6", cat: "homeNeeds", name: "Sabuni ya Msafi (Lavender)", brand: "Msafi", price: "KES 35" },
  { original: "https://ibb.co/j9H8JZZf", cat: "homeNeeds", name: "Sabuni ya Sunlight ya Mashine (Lavender)", brand: "Sunlight", price: "KES 850" },
  { original: "https://ibb.co/Kz0zfKy0", cat: "homeNeeds", name: "Karatasi ya Choo ya Tena (Nyeupe)", brand: "Tena", price: "KES 420" },

  // Dairy products (Bidhaa za Maziwa)
  { original: "https://ibb.co/k2ghfHyS", cat: "dairyProducts", name: "Maziwa ya Brookside Dairy Best Fino (500ml)", brand: "Brookside", price: "KES 60" },
  { original: "https://ibb.co/Ng4mZQKh", cat: "dairyProducts", name: "Maziwa ya Brookside Plus Yaliyoimarishwa", brand: "Brookside", price: "KES 75" },
  { original: "https://ibb.co/JWk3Xbkb", cat: "dairyProducts", name: "Maziwa ya Brookside Plus UHT (Vitamini A na D)", brand: "Brookside", price: "KES 75" },
  { original: "https://ibb.co/sJMnGGKd", cat: "dairyProducts", name: "Kinywaji cha Alpro Oat Barista", brand: "Alpro", price: "KES 450" },
  { original: "https://ibb.co/RkJ2V3Tx", cat: "dairyProducts", name: "Maziwa ya Nuziwa Oat (Original)", brand: "Nuziwa", price: "KES 380" },
  { original: "https://ibb.co/0VC6gJq4", cat: "dairyProducts", name: "Mayai ya Karen Fork ya Kiorganiki (Pakiti ya 15)", brand: "Karen Fork", price: "KES 450" },
  { original: "https://ibb.co/GQbtk4x0", cat: "dairyProducts", name: "Mayai ya Karen Fork ya Kiorganiki (Vipande 30)", brand: "Karen Fork", price: "KES 850" },
  { original: "https://ibb.co/tMvzgdrk", cat: "dairyProducts", name: "Maziwa ya Brookside Yasiyo na Laktosi", brand: "Brookside", price: "KES 80" },
  { original: "https://ibb.co/1fHbn4ng", cat: "dairyProducts", name: "Maziwa Mapya", brand: "Local", price: "KES 55" },
  { original: "https://ibb.co/SwyWxbzc", cat: "meat", name: "Kuku Mzima", brand: "Fresh", price: "KES 650" },
  { original: "https://ibb.co/8gk1w9Zx", cat: "meat", name: "Mabawa ya Kuku", brand: "Fresh", price: "KES 450" },
  { original: "https://ibb.co/XZYBG3Kk", cat: "meat", name: "Ini la Kuku", brand: "Fresh", price: "KES 250" },
  { original: "https://ibb.co/d4QQRjMh", cat: "meat", name: "Nyama ya Ng'ombe ya Boran", brand: "Boran", price: "KES 850" },
  { original: "https://ibb.co/TMR8BSwm", cat: "meat", name: "Nyama ya Mbuzi", brand: "Local", price: "KES 900" },
  { original: "https://ibb.co/WvryMWnL", cat: "meat", name: "Mbavu za Kondoo", brand: "Local", price: "KES 950" },
  { original: "https://ibb.co/qMWK9kvK", cat: "dairyProducts", name: "Jibini ya Sirimon", brand: "Sirimon", price: "KES 550" },
  { original: "https://ibb.co/KxQk9m5g", cat: "dairyProducts", name: "Mtindi Mchanganyiko", brand: "Delamere", price: "KES 150" },
  { original: "https://ibb.co/NgbVyWnQ", cat: "dairyProducts", name: "Siagi Isiyo na Chumvi", brand: "Brookside", price: "KES 420" },

  // Baby care (Utunzaji wa Mtoto)
  { original: "https://ibb.co/1twjQfch", cat: "babyCare", name: "Shampuu ya Escenti Kid Lice (3-in-1)", brand: "Escenti", price: "KES 550" },
  { original: "https://ibb.co/xKKytWSQ", cat: "babyCare", name: "Mafuta ya Cussons Baby Protect", brand: "Cussons", price: "KES 450" },
  { original: "https://ibb.co/7J66TxRt", cat: "babyCare", name: "Mafuta ya Dhahabu ya Utunzaji wa Mtoto", brand: "Dhahabu", price: "KES 320" },

  // Milk powder (Maziwa ya Unga)
  { original: "https://ibb.co/35nk4XsH", cat: "milkPowders", name: "Maziwa ya Unga ya Kenya Highland (Low Fat)", brand: "Kenya Highland", price: "KES 650" },
  { original: "https://ibb.co/HT8zrzq5", cat: "milkPowders", name: "Kinywaji cha Miksi cha Chokoleti", brand: "Miksi", price: "KES 450" },
  { original: "https://ibb.co/wFHX39tM", cat: "milkPowders", name: "Maziwa ya Unga ya Cow & Gate (Miezi 6-12)", brand: "Cow & Gate", price: "KES 1,200" },
  { original: "https://ibb.co/HLR1dwpj", cat: "milkPowders", name: "Maziwa ya Unga ya Nestle NAN Lactogen", brand: "Nestle", price: "KES 1,400" },
  { original: "https://ibb.co/MDT3dqWf", cat: "milkPowders", name: "Maziwa ya Unga ya Cow & Gate Nutristart", brand: "Cow & Gate", price: "KES 1,250" },
  { original: "https://ibb.co/1GD7jnmY", cat: "milkPowders", name: "Maziwa ya Unga ya Brookside (Full Cream) Kopo", brand: "Brookside", price: "KES 1,800" },
  { original: "https://ibb.co/DPT5Sb00", cat: "milkPowders", name: "Maziwa ya Unga ya Kenya Highland (Full Cream)", brand: "Kenya Highland", price: "KES 750" },
  { original: "https://ibb.co/vCxxhs3K", cat: "milkPowders", name: "Maziwa ya Unga ya Brookside (Full Cream)", brand: "Brookside", price: "KES 720" },

  // Oral care (Utunzaji wa Kinywa)
  { original: "https://ibb.co/d4m5wB4z", cat: "oralCare", name: "Dawa ya Meno ya Dabur Miswak", brand: "Dabur", price: "KES 180" },
  { original: "https://ibb.co/5XQvh97w", cat: "oralCare", name: "Dawa ya Meno ya Whitedent (Triple Action)", brand: "Whitedent", price: "KES 95" },
  { original: "https://ibb.co/ZzDzZ6LL", cat: "oralCare", name: "Dawa ya Meno ya Pepsodent (Mkaa)", brand: "Pepsodent", price: "KES 240" },
  { original: "https://ibb.co/WNgC7GRq", cat: "oralCare", name: "Dawa ya Meno ya Sensodyne (Sensitive)", brand: "Sensodyne", price: "KES 450" },
  { original: "https://ibb.co/HDyJct4y", cat: "oralCare", name: "Dawa ya Meno ya Sensodyne (Fresh Mint)", brand: "Sensodyne", price: "KES 480" },
  { original: "https://ibb.co/1t3PrRR6", cat: "oralCare", name: "Dawa ya Meno ya Aquafresh (Herbal)", brand: "Aquafresh", price: "KES 220" },
  { original: "https://ibb.co/V0tbfz2g", cat: "oralCare", name: "Dawa ya Meno ya Dabur Clove (Pakiti ya Ofa)", brand: "Dabur", price: "KES 350" },
  { original: "https://ibb.co/nsWjtwG0", cat: "oralCare", name: "Dawa ya Meno ya Aquafresh (Big Teeth)", brand: "Aquafresh", price: "KES 195" },
];

let finalProducts = [];

products.forEach((p, i) => {
  const res = resolved.find(r => r.original === p.original);
  if (res && res.resolved) {
    finalProducts.push({
      _uid: `ke_${p.cat.substring(0,2)}_${String(i + 1).padStart(3, '0')}`,
      _cat: p.cat,
      _index: i,
      imageUrl: res.resolved,
      name: p.name,
      brand: p.brand,
      badge: i % 5 === 0 ? "bestseller" : (i % 7 === 0 ? "sale" : null),
      price: p.price,
      oldPrice: i % 7 === 0 ? `KES ${parseInt(p.price.replace(/[^\d]/g, '')) + 100}` : null,
      stars: (4 + Math.random()).toFixed(1),
      reviews: Math.floor(Math.random() * 500) + 10
    });
  }
});

// Create new arrays
const homeNeedsArr = finalProducts.filter(p => p._cat === "homeNeeds");
const dairyArr = finalProducts.filter(p => p._cat === "dairyProducts");
const babyArr = finalProducts.filter(p => p._cat === "babyCare");
const milkArr = finalProducts.filter(p => p._cat === "milkPowders");
const oralArr = finalProducts.filter(p => p._cat === "oralCare");
const meatArr = finalProducts.filter(p => p._cat === "meat");

// Insert into content
let newContent = content;

// Home Needs
newContent += `\n\n// ── HOME NEEDS ──────────────────────────────────────────────────────────\nexport const KENYA_HOME_NEEDS = ${JSON.stringify(homeNeedsArr, null, 2)};`;

// Dairy
newContent += `\n\n// ── DAIRY PRODUCTS ─────────────────────────────────────────────────────\nexport const KENYA_DAIRY = ${JSON.stringify(dairyArr, null, 2)};`;

// Baby Care
newContent += `\n\n// ── BABY CARE ──────────────────────────────────────────────────────────\nexport const KENYA_BABY_CARE = ${JSON.stringify(babyArr, null, 2)};`;

// Milk Powders
newContent += `\n\n// ── MILK POWDERS ───────────────────────────────────────────────────────\nexport const KENYA_MILK_POWDERS = ${JSON.stringify(milkArr, null, 2)};`;

// Oral Care
newContent += `\n\n// ── ORAL CARE ──────────────────────────────────────────────────────────\nexport const KENYA_ORAL_CARE = ${JSON.stringify(oralArr, null, 2)};`;

// Meat
newContent += `\n\n// ── MEAT ───────────────────────────────────────────────────────────────\nexport const KENYA_MEAT = ${JSON.stringify(meatArr, null, 2)};`;

// Update KENYA_ALL_PRODUCTS
// Find the KENYA_ALL_PRODUCTS array and add the new arrays to it
if (newContent.includes('export const KENYA_ALL_PRODUCTS = [')) {
  newContent = newContent.replace('export const KENYA_ALL_PRODUCTS = [', 'export const KENYA_ALL_PRODUCTS = [\n  ...KENYA_HOME_NEEDS,\n  ...KENYA_DAIRY,\n  ...KENYA_BABY_CARE,\n  ...KENYA_MILK_POWDERS,\n  ...KENYA_ORAL_CARE,\n  ...KENYA_MEAT,');
}

fs.writeFileSync(filePath, newContent);
console.log('Successfully updated kenya_products.js with batch 4');
