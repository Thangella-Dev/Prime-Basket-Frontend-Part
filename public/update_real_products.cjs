const fs = require('fs');

const KENYA_WHEAT_FLOUR = [
  { _uid: "ke_wf_001", _cat: "wheat-flour", _index: 0, imageUrl: "https://i.ibb.co/2LfT6NH/Mothers-Choice-Home-Baking-Flour.avif", name: "Unga wa Ngano wa Mama", brand: "Mothers Choice", badge: "bestseller", price: "KES 185", oldPrice: null, stars: "4.5", reviews: 120 },
  { _uid: "ke_wf_002", _cat: "wheat-flour", _index: 1, imageUrl: "https://i.ibb.co/vt1Nb4g/Nutrameal-Lapsi-Cracked-Wheat-Flour.avif", name: "Ngano ya Lapsi Nutrameal", brand: "Nutrameal", badge: null, price: "KES 210", oldPrice: null, stars: "4.4", reviews: 85 },
  { _uid: "ke_wf_003", _cat: "wheat-flour", _index: 2, imageUrl: "https://i.ibb.co/84rZNTQR/Butterfly-Atta-Wheat-Flour.avif", name: "Unga wa Atta Butterfly", brand: "Butterfly", badge: "premium", price: "KES 230", oldPrice: null, stars: "4.6", reviews: 92 },
  { _uid: "ke_wf_004", _cat: "wheat-flour", _index: 3, imageUrl: "https://i.ibb.co/n92t5kp/Soko-Flour-Maize-Meal.avif", name: "Unga wa Mahindi Soko", brand: "Soko", badge: "bestseller", price: "KES 145", oldPrice: null, stars: "4.7", reviews: 1540 },
  { _uid: "ke_wf_005", _cat: "wheat-flour", _index: 4, imageUrl: "https://i.ibb.co/Kxz6rJzv/Unga-Exe-Chapati-Fortified-Wheat-Flour.avif", name: "Unga wa Exe Chapati", brand: "Exe", badge: null, price: "KES 195", oldPrice: null, stars: "4.5", reviews: 432 },
  { _uid: "ke_wf_006", _cat: "wheat-flour", _index: 5, imageUrl: "https://i.ibb.co/jPZvJRdp/Exe-Unga-All-Purpose-Fortified-Wheat-Flour.avif", name: "Unga wa Exe wa Kila Kazi", brand: "Exe", badge: "bestseller", price: "KES 190", oldPrice: null, stars: "4.6", reviews: 678 },
  { _uid: "ke_wf_007", _cat: "wheat-flour", _index: 6, imageUrl: "https://i.ibb.co/5g88B40S/Nutrameal-Atta-Mark-1-Wheat-Flour.avif", name: "Unga wa Atta Nutrameal", brand: "Nutrameal", badge: null, price: "KES 215", oldPrice: null, stars: "4.3", reviews: 112 },
];

const KENYA_SALT = [
  { _uid: "ke_s_001", _cat: "salt", _index: 0, imageUrl: "https://i.ibb.co/0LHStdg/Sue-s-Naturals-Sea-Salt.avif", name: "Chumvi ya Bahari ya Sue", brand: "Sue's Naturals", badge: "healthy", price: "KES 145", oldPrice: null, stars: "4.5", reviews: 67 },
  { _uid: "ke_s_002", _cat: "salt", _index: 1, imageUrl: "https://i.ibb.co/zTj66pq1/Kamili-s-Top-Chef-Table-Salt.avif", name: "Chumvi ya Top Chef", brand: "Kamili", badge: null, price: "KES 40", oldPrice: null, stars: "4.2", reviews: 124 },
  { _uid: "ke_s_003", _cat: "salt", _index: 2, imageUrl: "https://i.ibb.co/HL3SWp0F/Kensalt-Table-Salt.avif", name: "Chumvi ya Kensalt", brand: "Kensalt", badge: "bestseller", price: "KES 35", oldPrice: null, stars: "4.8", reviews: 3420 },
  { _uid: "ke_s_004", _cat: "salt", _index: 3, imageUrl: "https://i.ibb.co/RpZht12F/Equatorial-Sea-Salt.avif", name: "Chumvi ya Equatorial", brand: "Equatorial", badge: null, price: "KES 55", oldPrice: null, stars: "4.3", reviews: 89 },
  { _uid: "ke_s_005", _cat: "salt", _index: 4, imageUrl: "https://i.ibb.co/YFpMb1NS/Sileo-Very-Fine-Natural-Salt.avif", name: "Chumvi Safi ya Sileo", brand: "Sileo", badge: "premium", price: "KES 110", oldPrice: null, stars: "4.6", reviews: 45 },
  { _uid: "ke_s_006", _cat: "salt", _index: 5, imageUrl: "https://i.ibb.co/99S1QZ0M/Sue-s-Naturals-Garlic-Salt.avif", name: "Chumvi ya Kitunguu Saumu", brand: "Sue's Naturals", badge: "new", price: "KES 220", oldPrice: null, stars: "4.7", reviews: 32 },
  { _uid: "ke_s_007", _cat: "salt", _index: 6, imageUrl: "https://i.ibb.co/v8hspcX/La-Baleine-Fine-Iodized-Sea-Salt.avif", name: "Chumvi ya La Baleine", brand: "La Baleine", badge: "premium", price: "KES 380", oldPrice: null, stars: "4.8", reviews: 112 },
  { _uid: "ke_s_008", _cat: "salt", _index: 7, imageUrl: "https://i.ibb.co/4Z8Vy5sw/Naturalli-Himalayan-Pink-Fine-Salt.avif", name: "Chumvi ya Pink ya Himalayan", brand: "Naturalli", badge: "healthy", price: "KES 450", oldPrice: null, stars: "4.9", reviews: 156 },
];

const KENYA_SUGAR = [
  { _uid: "ke_su_001", _cat: "sugar", _index: 0, imageUrl: "https://i.ibb.co/rfTTPF9C/Clovers-Icing-Sugar.avif", name: "Sukari ya Icing Clovers", brand: "Clovers", badge: null, price: "KES 180", oldPrice: null, stars: "4.4", reviews: 89 },
  { _uid: "ke_su_002", _cat: "sugar", _index: 1, imageUrl: "https://i.ibb.co/xST4Wgqz/Zesta-Caster-Sugar.avif", name: "Sukari ya Caster Zesta", brand: "Zesta", badge: "bestseller", price: "KES 210", oldPrice: null, stars: "4.5", reviews: 134 },
  { _uid: "ke_su_003", _cat: "sugar", _index: 2, imageUrl: "https://i.ibb.co/N5Mc4Zn/Tropicana-Slim-Stevia-Diet-Sticks-Sweetener-39-Pieces.avif", name: "Tropicana Slim Stevia", brand: "Tropicana Slim", badge: "healthy", price: "KES 850", oldPrice: null, stars: "4.7", reviews: 213 },
  { _uid: "ke_su_004", _cat: "sugar", _index: 3, imageUrl: "https://i.ibb.co/FbkdX7gS/The-Canderel-Granules-Jar-Red.avif", name: "Canderel Granules", brand: "Canderel", badge: "premium", price: "KES 920", oldPrice: null, stars: "4.6", reviews: 167 },
  { _uid: "ke_su_005", _cat: "sugar", _index: 4, imageUrl: "https://i.ibb.co/C3BK0xk5/Lakanto-Monkfruit-Sweetener.avif", name: "Lakanto Monkfruit", brand: "Lakanto", badge: "healthy", price: "KES 1200", oldPrice: null, stars: "4.8", reviews: 45 },
  { _uid: "ke_su_006", _cat: "sugar", _index: 5, imageUrl: "https://i.ibb.co/xt438Prt/Canderel-Sweetener-Tablets-With-Sucralose-100-Pieces.avif", name: "Vidonge vya Canderel", brand: "Canderel", badge: "sale", price: "KES 480", oldPrice: "KES 550", stars: "4.5", reviews: 312 },
  { _uid: "ke_su_007", _cat: "sugar", _index: 6, imageUrl: "https://i.ibb.co/W4XrbTqH/Economy-White-Sugar.avif", name: "Sukari Nyeupe ya Akiba", brand: "Economy", badge: "sale", price: "KES 280", oldPrice: "KES 340", stars: "4.2", reviews: 854 },
  { _uid: "ke_su_008", _cat: "sugar", _index: 7, imageUrl: "https://i.ibb.co/LXK46tv5/Nutrameal-Natural-Wholesome-Cane-Sugar.avif", name: "Sukari ya Miwa Nutrameal", brand: "Nutrameal", badge: "healthy", price: "KES 340", oldPrice: null, stars: "4.6", reviews: 112 },
  { _uid: "ke_su_009", _cat: "sugar", _index: 8, imageUrl: "https://i.ibb.co/TDZbykt0/MUMIAS-SUGAR-WHITE.avif", name: "Sukari ya Mumias Nyeupe", brand: "Mumias", badge: "bestseller", price: "KES 320", oldPrice: null, stars: "4.7", reviews: 2450 },
];

const KENYA_TURMERIC = [
  { _uid: "ke_tp_001", _cat: "turmeric-powder", _index: 0, imageUrl: "https://i.ibb.co/rfxyNysz/Zanzibar-Turmeric-Powder-Spices.avif", name: "Bizari ya Zanzibar", brand: "Zanzibar", badge: "premium", price: "KES 250", oldPrice: null, stars: "4.8", reviews: 56 },
  { _uid: "ke_tp_002", _cat: "turmeric-powder", _index: 1, imageUrl: "https://i.ibb.co/x83rQnb0/Mulsons-Spices-Turmeric-Powder.avif", name: "Bizari ya Mulsons", brand: "Mulsons", badge: null, price: "KES 140", oldPrice: null, stars: "4.5", reviews: 34 },
  { _uid: "ke_tp_003", _cat: "turmeric-powder", _index: 2, imageUrl: "https://i.ibb.co/ZzWczT48/Top-Food-Turmeric-Powder.avif", name: "Bizari ya Top Food", brand: "Top Food", badge: "bestseller", price: "KES 120", oldPrice: null, stars: "4.4", reviews: 189 },
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

replaceBlock('KENYA_WHEAT_FLOUR', KENYA_WHEAT_FLOUR);
replaceBlock('KENYA_SALT', KENYA_SALT);
replaceBlock('KENYA_SUGAR', KENYA_SUGAR);
replaceBlock('KENYA_TURMERIC', KENYA_TURMERIC);

fs.writeFileSync('src/data/kenya_products.js', src);
console.log('Done! Updated real products for Flour, Salt, Sugar, and Turmeric.');
