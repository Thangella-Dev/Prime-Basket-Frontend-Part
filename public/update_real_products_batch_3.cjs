const fs = require('fs');

const NEW_TURMERIC = [
  { _uid: "ke_tp_004", _cat: "turmeric-powder", _index: 3, imageUrl: "https://i.ibb.co/xS9XGbR2/Shalimar-Turmeric-Powder.avif", name: "Bizari ya Shalimar", brand: "Shalimar", badge: null, price: "KES 135", oldPrice: null, stars: "4.3", reviews: 45 },
  { _uid: "ke_tp_005", _cat: "turmeric-powder", _index: 4, imageUrl: "https://i.ibb.co/Kp0nYDZF/Naturalli-Turmeric-Powder.avif", name: "Bizari ya Naturalli", brand: "Naturalli", badge: "healthy", price: "KES 160", oldPrice: null, stars: "4.6", reviews: 28 },
];

const KENYA_CHILLI = [
  { _uid: "ke_cp_002", _cat: "chilli-powder", _index: 1, imageUrl: "https://i.ibb.co/bRN0G6fz/Chain-Kwo-Siracha-Chili-Sauce.avif", name: "Mchuzi wa Sriracha", brand: "Chain Kwo", badge: "hot", price: "KES 450", oldPrice: null, stars: "4.7", reviews: 89 },
  { _uid: "ke_cp_003", _cat: "chilli-powder", _index: 2, imageUrl: "https://i.ibb.co/27LWDZ4L/Bake-Rolz-Chili-Lemon.avif", name: "Vitafunwa vya Chili & Lemon", brand: "Bake Rolz", badge: "new", price: "KES 110", oldPrice: null, stars: "4.2", reviews: 156 },
  { _uid: "ke_cp_004", _cat: "chilli-powder", _index: 3, imageUrl: "https://i.ibb.co/gL9JJHQs/Kaputei-Hot-Chili-Sauce.avif", name: "Mchuzi Mkali wa Kaputei", brand: "Kaputei", badge: "hot", price: "KES 130", oldPrice: null, stars: "4.5", reviews: 213 },
  { _uid: "ke_cp_005", _cat: "chilli-powder", _index: 4, imageUrl: "https://i.ibb.co/sJDdpVz0/Robertsons-Crushed-Chilies.avif", name: "Pilipili ya Robertsons", brand: "Robertsons", badge: "premium", price: "KES 290", oldPrice: null, stars: "4.6", reviews: 67 },
  { _uid: "ke_cp_006", _cat: "chilli-powder", _index: 5, imageUrl: "https://i.ibb.co/BKPbjxct/Mulsons-Spices-Chili-Powder.avif", name: "Pilipili ya Mulsons", brand: "Mulsons", badge: null, price: "KES 140", oldPrice: null, stars: "4.4", reviews: 92 },
];

const KENYA_PULSES = [
  { _uid: "ke_p_001", _cat: "pulses", _index: 0, imageUrl: "https://i.ibb.co/Jjf1wXd7/Butterfly-Pulses-Dried-Green-Peas.avif", name: "Njegere za Kijani (Green Peas)", brand: "Butterfly", badge: "bestseller", price: "KES 240", oldPrice: null, stars: "4.5", reviews: 312 },
  { _uid: "ke_p_002", _cat: "pulses", _index: 1, imageUrl: "https://i.ibb.co/GvBgPgrq/Butterfly-Pulses-Dried-White-Peas.avif", name: "Njegere Nyeupe (White Peas)", brand: "Butterfly", badge: null, price: "KES 230", oldPrice: null, stars: "4.3", reviews: 189 },
  { _uid: "ke_p_003", _cat: "pulses", _index: 2, imageUrl: "https://i.ibb.co/sdbxGCDk/Butterfly-Pulses-Njahi-Black-Beans.avif", name: "Njahi (Black Beans)", brand: "Butterfly", badge: "healthy", price: "KES 280", oldPrice: null, stars: "4.7", reviews: 456 },
  { _uid: "ke_p_004", _cat: "pulses", _index: 3, imageUrl: "https://i.ibb.co/PsGFFWd0/Butterfly-Pulses-Lima-Butter-Beans.avif", name: "Maharagwe ya Lima (Butter Beans)", brand: "Butterfly", badge: null, price: "KES 320", oldPrice: null, stars: "4.6", reviews: 142 },
  { _uid: "ke_p_005", _cat: "pulses", _index: 4, imageUrl: "https://i.ibb.co/HLhPw23X/Butterfly-Pulses-Yellow-Kidney-Beans.avif", name: "Maharagwe ya Njano", brand: "Butterfly", badge: "new", price: "KES 260", oldPrice: null, stars: "4.4", reviews: 89 },
  { _uid: "ke_p_006", _cat: "pulses", _index: 5, imageUrl: "https://i.ibb.co/fzcNb8hF/Daawat-Pulses-Green-Grams.avif", name: "Nduengu (Green Grams)", brand: "Daawat", badge: "premium", price: "KES 350", oldPrice: null, stars: "4.8", reviews: 267 },
  { _uid: "ke_p_007", _cat: "pulses", _index: 6, imageUrl: "https://i.ibb.co/xqRwDjRG/Butterfly-Pulses-Red-Kidney-Beans.avif", name: "Maharagwe ya Wekundu", brand: "Butterfly", badge: "bestseller", price: "KES 250", oldPrice: null, stars: "4.5", reviews: 534 },
  { _uid: "ke_p_008", _cat: "pulses", _index: 7, imageUrl: "https://i.ibb.co/Xf4G0cdY/Pearl-Pulses-Large-Size-Whole-Masoor-Dal.avif", name: "Kamande (Whole Masoor Dal)", brand: "Pearl", badge: null, price: "KES 290", oldPrice: null, stars: "4.6", reviews: 112 },
];

const KENYA_MASALA = [
  { _uid: "ke_m_001", _cat: "masala", _index: 0, imageUrl: "https://i.ibb.co/rGsVm6Gv/Royco-Nyama-Choma-Spice.avif", name: "Viungo vya Nyama Choma", brand: "Royco", badge: "bestseller", price: "KES 120", oldPrice: null, stars: "4.8", reviews: 845 },
  { _uid: "ke_m_002", _cat: "masala", _index: 1, imageUrl: "https://i.ibb.co/cX2zc8dj/Mulsons-Spices-Pillau-Masala.avif", name: "Pilau Masala", brand: "Mulsons", badge: null, price: "KES 145", oldPrice: null, stars: "4.6", reviews: 231 },
  { _uid: "ke_m_003", _cat: "masala", _index: 2, imageUrl: "https://i.ibb.co/zHbTjkTn/Knorr-Aromat-Naturally-Tasty-Seasoning.avif", name: "Knorr Aromat", brand: "Knorr", badge: "premium", price: "KES 350", oldPrice: null, stars: "4.7", reviews: 156 },
  { _uid: "ke_m_004", _cat: "masala", _index: 3, imageUrl: "https://i.ibb.co/rKrfkZ8f/Royco-Mchuzi-Mix-Chicken.avif", name: "Royco Mchuzi Mix ya Kuku", brand: "Royco", badge: "bestseller", price: "KES 85", oldPrice: null, stars: "4.8", reviews: 1240 },
  { _uid: "ke_m_005", _cat: "masala", _index: 4, imageUrl: "https://i.ibb.co/6RNfXtnk/Royco-Mchuzi-Mix-Beef.avif", name: "Royco Mchuzi Mix ya Nyama", brand: "Royco", badge: "bestseller", price: "KES 85", oldPrice: null, stars: "4.8", reviews: 1890 },
  { _uid: "ke_m_006", _cat: "masala", _index: 5, imageUrl: "https://i.ibb.co/mr5TkyTv/Royco-Curry-Powder.avif", name: "Binzari ya Royco (Curry Powder)", brand: "Royco", badge: null, price: "KES 110", oldPrice: null, stars: "4.5", reviews: 678 },
];

let src = fs.readFileSync('src/data/kenya_products.js', 'utf8');

function replaceBlock(name, newData) {
  const startMarker = `export const ${name} = [`;
  const startIndex = src.indexOf(startMarker);
  const endIndex = src.indexOf('];', startIndex);
  if (startIndex === -1 || endIndex === -1) return;
  
  const formatted = `export const ${name} = [\n` + newData.map(p => `  ${JSON.stringify(p)},`).join('\n') + `\n`;
  src = src.substring(0, startIndex) + formatted + src.substring(endIndex);
}

// Special for Turmeric: append to existing array
const turmericMarker = `export const KENYA_TURMERIC = [`;
const turmericEnd = src.indexOf('];', src.indexOf(turmericMarker));
const turmericInsertionPoint = turmericEnd;
const turmericExtra = NEW_TURMERIC.map(p => `  ${JSON.stringify(p)},`).join('\n') + '\n';
src = src.substring(0, turmericInsertionPoint) + turmericExtra + src.substring(turmericInsertionPoint);

replaceBlock('KENYA_CHILLI', KENYA_CHILLI);
replaceBlock('KENYA_PULSES', KENYA_PULSES);
replaceBlock('KENYA_MASALA', KENYA_MASALA);

fs.writeFileSync('src/data/kenya_products.js', src);
console.log('Done! Updated real products for Chilli, Pulses, and Masala.');
