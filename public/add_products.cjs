const fs = require('fs');

const newArrays = `
// ── INSTANT FOOD ────────────────────────────────────────────────────────
export const KENYA_INSTANT_FOOD = [
  { _uid:'ke_if_001',_cat:'instantFood',_index:0, imageUrl:'https://i.ibb.co/7dYqHNJR/top-food-cajun-spice-blend.avif', name:'Mchanganyiko wa Cajun', brand:'Top Food', badge:'new', price:'KES 180', oldPrice:null, stars:'4.2', reviews:98 },
  { _uid:'ke_if_002',_cat:'instantFood',_index:1, imageUrl:'https://i.ibb.co/vvTFYLJ5/Top-Food-Indian-Chat-Masala.avif', name:'Chat Masala ya Kihindi', brand:'Top Food', badge:'sale', price:'KES 150', oldPrice:'KES 190', stars:'4.3', reviews:134 },
  { _uid:'ke_if_003',_cat:'instantFood',_index:2, imageUrl:'https://i.ibb.co/4gCQmq8Y/Nongshim-Shin-Ram-Spicy-Chicken.avif', name:'Ramen ya Kuku Nongshim', brand:'Nongshim', badge:'bestseller', price:'KES 220', oldPrice:null, stars:'4.6', reviews:289 },
  { _uid:'ke_if_004',_cat:'instantFood',_index:3, imageUrl:'https://i.ibb.co/HTdb5JCZ/Enso-Wasabi-Peanuts.avif', name:'Karanga za Wasabi', brand:'Enso', badge:null, price:'KES 260', oldPrice:null, stars:'4.1', reviews:76 },
  { _uid:'ke_if_005',_cat:'instantFood',_index:4, imageUrl:'https://i.ibb.co/1GRPFdHD/Ottogi-Cheese-Ramen.avif', name:'Ramen ya Jibini ya Ottogi', brand:'Ottogi', badge:'new', price:'KES 200', oldPrice:null, stars:'4.4', reviews:167 },
  { _uid:'ke_if_006',_cat:'instantFood',_index:5, imageUrl:'https://i.ibb.co/0pLH2fFC/Shan-Shahi-Haleem-Masala-Mix.avif', name:'Mchanganyiko wa Haleem Masala', brand:'Shan', badge:'sale', price:'KES 170', oldPrice:'KES 210', stars:'4.5', reviews:213 },
  { _uid:'ke_if_007',_cat:'instantFood',_index:6, imageUrl:'https://i.ibb.co/4gM0TxYN/Nongshim-Shin-Ramyun-With-Cheese.avif', name:'Ramyun ya Jibini Nongshim', brand:'Nongshim', badge:'bestseller', price:'KES 230', oldPrice:null, stars:'4.5', reviews:312 },
  { _uid:'ke_if_008',_cat:'instantFood',_index:7, imageUrl:'https://i.ibb.co/pBFzX5r8/Kikkoman-Egg-Soup-Mix-Hot-Sour.avif', name:'Supu ya Mayai ya Kikkoman', brand:'Kikkoman', badge:'premium', price:'KES 350', oldPrice:null, stars:'4.3', reviews:89 },
];

// ── CHIPS & SNACKS ──────────────────────────────────────────────────────
export const KENYA_SNACKS = [
  { _uid:'ke_sn_001',_cat:'chipsAndNamkeens',_index:0, imageUrl:'https://i.ibb.co/ynw0scCc/Ola-Cheese-Tortilla-Chips.jpg', name:'Chips za Jibini za Ola', brand:'Ola', badge:'bestseller', price:'KES 130', oldPrice:null, stars:'4.4', reviews:312 },
  { _uid:'ke_sn_002',_cat:'chipsAndNamkeens',_index:1, imageUrl:'https://i.ibb.co/zhZHsS53/Norda-Urban-Stix-Bbq-Crunchy-Corn-Snacks.jpg', name:'Vitafunwa vya BBQ Norda', brand:'Norda', badge:'new', price:'KES 110', oldPrice:null, stars:'4.3', reviews:198 },
  { _uid:'ke_sn_003',_cat:'chipsAndNamkeens',_index:2, imageUrl:'https://i.ibb.co/p6kc1Rv0/Krackles-Barbeque-Potato-Chips.jpg', name:'Chips za BBQ Krackles', brand:'Krackles', badge:'sale', price:'KES 95', oldPrice:'KES 120', stars:'4.2', reviews:267 },
  { _uid:'ke_sn_004',_cat:'chipsAndNamkeens',_index:3, imageUrl:'https://i.ibb.co/C5VDVdD1/Ola-Mexican-Crunch-Tortilla-Chips.jpg', name:'Chips za Mexico za Ola', brand:'Ola', badge:null, price:'KES 130', oldPrice:null, stars:'4.3', reviews:145 },
  { _uid:'ke_sn_005',_cat:'chipsAndNamkeens',_index:4, imageUrl:'https://i.ibb.co/nqnJXmgj/Tropical-Heat-Snacks-Salted-Potato-Crisps.jpg', name:'Chips za Chumvi Tropical Heat', brand:'Tropical Heat', badge:'bestseller', price:'KES 80', oldPrice:null, stars:'4.5', reviews:423 },
  { _uid:'ke_sn_006',_cat:'chipsAndNamkeens',_index:5, imageUrl:'https://i.ibb.co/wjt7JY7/Ola-Cool-Crunch-Tortilla-Chips.jpg', name:'Chips Baridi za Ola', brand:'Ola', badge:null, price:'KES 130', oldPrice:null, stars:'4.1', reviews:112 },
  { _uid:'ke_sn_007',_cat:'chipsAndNamkeens',_index:6, imageUrl:'https://i.ibb.co/MkVnVpFx/Krackles-Tingly-Cheese-And-Onion-Potato-Chips.jpg', name:'Chips za Jibini Krackles', brand:'Krackles', badge:'sale', price:'KES 95', oldPrice:'KES 115', stars:'4.4', reviews:234 },
  { _uid:'ke_sn_008',_cat:'chipsAndNamkeens',_index:7, imageUrl:'https://i.ibb.co/3yLddyKV/Tropical-Heat-Snacks-Tomato-Potato-Crisps.jpg', name:'Chips za Nyanya Tropical Heat', brand:'Tropical Heat', badge:'new', price:'KES 80', oldPrice:null, stars:'4.3', reviews:178 },
  { _uid:'ke_sn_009',_cat:'chipsAndNamkeens',_index:8, imageUrl:'https://i.ibb.co/hxdghr9p/Floydeez-Caramel-Popcorn.jpg', name:'Popcorn ya Karameli Floydeez', brand:'Floydeez', badge:'premium', price:'KES 200', oldPrice:null, stars:'4.6', reviews:167 },
  { _uid:'ke_sn_010',_cat:'chipsAndNamkeens',_index:9, imageUrl:'https://i.ibb.co/VcnCPNMZ/Tropical-Heat-Snacks-Waves-Potato-Salted-Crisps.jpg', name:'Chips za Mawimbi Tropical Heat', brand:'Tropical Heat', badge:null, price:'KES 85', oldPrice:null, stars:'4.2', reviews:198 },
  { _uid:'ke_sn_011',_cat:'chipsAndNamkeens',_index:10, imageUrl:'https://i.ibb.co/tMjnYLnN/Norda-Urban-Bites-Nyama-Choma-Potato-Crisps.jpg', name:'Chips za Nyama Choma Norda', brand:'Norda', badge:'bestseller', price:'KES 110', oldPrice:null, stars:'4.5', reviews:356 },
  { _uid:'ke_sn_012',_cat:'chipsAndNamkeens',_index:11, imageUrl:'https://i.ibb.co/tPq6vXVr/Tropical-Heat-Waves-Crisps-Fruit-Chutney.jpg', name:'Chips za Matunda Tropical Heat', brand:'Tropical Heat', badge:null, price:'KES 85', oldPrice:null, stars:'4.1', reviews:134 },
  { _uid:'ke_sn_013',_cat:'chipsAndNamkeens',_index:12, imageUrl:'https://i.ibb.co/B2MmrN0h/Pringles-Original-Flavour-Crisps.jpg', name:'Pringles za Ladha ya Asili', brand:'Pringles', badge:'bestseller', price:'KES 650', oldPrice:null, stars:'4.7', reviews:512 },
  { _uid:'ke_sn_014',_cat:'chipsAndNamkeens',_index:13, imageUrl:'https://i.ibb.co/xS73wd72/Norda-Ringoz-Barbeque-Crunchy-Corn-Rings.jpg', name:'Pete za Mahindi BBQ Norda', brand:'Norda', badge:'new', price:'KES 110', oldPrice:null, stars:'4.3', reviews:167 },
  { _uid:'ke_sn_015',_cat:'chipsAndNamkeens',_index:14, imageUrl:'https://i.ibb.co/xKRBwv4X/Kudos-Tomato-Ketchup-Corn-Puffs.jpg', name:'Vitafunwa vya Nyanya Kudos', brand:'Kudos', badge:'sale', price:'KES 70', oldPrice:'KES 90', stars:'4.2', reviews:198 },
  { _uid:'ke_sn_016',_cat:'chipsAndNamkeens',_index:15, imageUrl:'https://i.ibb.co/VpNWp7Pm/Pringles-Sour-Cream-And-Onion-Chips.jpg', name:'Pringles za Krimu na Kitunguu', brand:'Pringles', badge:null, price:'KES 650', oldPrice:null, stars:'4.6', reviews:345 },
  { _uid:'ke_sn_017',_cat:'chipsAndNamkeens',_index:16, imageUrl:'https://i.ibb.co/DftfvXZB/Nuvita-Barbeque-Baked-Corn-Puffs.jpg', name:'Vitafunwa vya BBQ Nuvita', brand:'Nuvita', badge:'healthy', price:'KES 90', oldPrice:null, stars:'4.4', reviews:234 },
];

// ── RICE ────────────────────────────────────────────────────────────────
export const KENYA_RICE = [
  { _uid:'ke_r_001',_cat:'rice',_index:0, imageUrl:'https://i.ibb.co/KptPjChj/basmati-rice.jpg', name:'Mchele wa Basmati', brand:'Sunrise', badge:'bestseller', price:'KES 280', oldPrice:null, stars:'4.5', reviews:423 },
  { _uid:'ke_r_002',_cat:'rice',_index:1, imageUrl:'https://i.ibb.co/B2vRrm6B/daawat-basmati-rice.avif', name:'Mchele wa Daawat Basmati', brand:'Daawat', badge:'premium', price:'KES 450', oldPrice:null, stars:'4.7', reviews:312 },
  { _uid:'ke_r_003',_cat:'rice',_index:2, imageUrl:'https://i.ibb.co/HfkcM1SM/amana-basmati-rice.avif', name:'Mchele wa Amana Basmati', brand:'Amana', badge:'sale', price:'KES 320', oldPrice:'KES 400', stars:'4.4', reviews:267 },
  { _uid:'ke_r_004',_cat:'rice',_index:3, imageUrl:'https://i.ibb.co/xtDJvDb6/pilau-rice.avif', name:'Mchele wa Pilau', brand:'Soko Fresh', badge:'new', price:'KES 350', oldPrice:null, stars:'4.3', reviews:145 },
  { _uid:'ke_r_005',_cat:'rice',_index:4, imageUrl:'https://i.ibb.co/M5PCF4Nf/rice-pishori.avif', name:'Mchele wa Pishori', brand:'Soko Fresh', badge:'bestseller', price:'KES 380', oldPrice:null, stars:'4.6', reviews:389 },
];

// ── OILS ────────────────────────────────────────────────────────────────
export const KENYA_OILS = [
  { _uid:'ke_o_001',_cat:'oil',_index:0, imageUrl:'https://i.ibb.co/YB40SpqZ/corn-oil.avif', name:'Mafuta ya Mahindi', brand:'Sungold', badge:null, price:'KES 320', oldPrice:null, stars:'4.2', reviews:134 },
  { _uid:'ke_o_002',_cat:'oil',_index:1, imageUrl:'https://i.ibb.co/zhc4VDVm/sunflower-oil.avif', name:'Mafuta ya Alizeti', brand:'Fresh Fri', badge:'bestseller', price:'KES 290', oldPrice:null, stars:'4.5', reviews:423 },
  { _uid:'ke_o_003',_cat:'oil',_index:2, imageUrl:'https://i.ibb.co/wh3vh3p2/coconut-oil.avif', name:'Mafuta ya Nazi', brand:'Pure', badge:'healthy', price:'KES 450', oldPrice:'KES 550', stars:'4.6', reviews:289 },
  { _uid:'ke_o_004',_cat:'oil',_index:3, imageUrl:'https://i.ibb.co/dwHq3dY3/vegetable-oil.avif', name:'Mafuta ya Mboga', brand:'Salit', badge:'sale', price:'KES 260', oldPrice:'KES 320', stars:'4.3', reviews:312 },
  { _uid:'ke_o_005',_cat:'oil',_index:4, imageUrl:'https://i.ibb.co/zTsrrCfh/salit-cooking-oil.avif', name:'Mafuta ya Kupikia Salit', brand:'Salit', badge:'bestseller', price:'KES 280', oldPrice:null, stars:'4.4', reviews:378 },
  { _uid:'ke_o_006',_cat:'oil',_index:5, imageUrl:'https://i.ibb.co/BVJ3g5Y9/fry-cooking-oil.avif', name:'Mafuta ya Kupikia Fry', brand:'Fry', badge:null, price:'KES 270', oldPrice:null, stars:'4.1', reviews:167 },
  { _uid:'ke_o_007',_cat:'oil',_index:6, imageUrl:'https://i.ibb.co/VYZtBzPK/kenola-oil.avif', name:'Mafuta ya Kenola', brand:'Kenola', badge:'premium', price:'KES 380', oldPrice:null, stars:'4.5', reviews:198 },
  { _uid:'ke_o_008',_cat:'oil',_index:7, imageUrl:'https://i.ibb.co/zVnLbtdm/rina-vegetable-oil.avif', name:'Mafuta ya Rina', brand:'Rina', badge:null, price:'KES 260', oldPrice:null, stars:'4.2', reviews:145 },
  { _uid:'ke_o_009',_cat:'oil',_index:8, imageUrl:'https://i.ibb.co/TQ4k4kx/pika-vegetable-oil.avif', name:'Mafuta ya Pika', brand:'Pika', badge:'new', price:'KES 275', oldPrice:null, stars:'4.3', reviews:112 },
];
`;

let src = fs.readFileSync('src/data/kenya_products.js', 'utf8');

// Insert new arrays before COMBINED section
src = src.replace(
  '// ── COMBINED ─────────────────────────────────────────────────────────────',
  newArrays + '\n// ── COMBINED ─────────────────────────────────────────────────────────────'
);

// Add new arrays to KENYA_ALL_PRODUCTS
src = src.replace(
  '  ...KENYA_VEGETABLES,\n];',
  '  ...KENYA_VEGETABLES,\n  ...KENYA_INSTANT_FOOD,\n  ...KENYA_SNACKS,\n  ...KENYA_RICE,\n  ...KENYA_OILS,\n];'
);

fs.writeFileSync('src/data/kenya_products.js', src);
console.log('Done! Added 39 products across 4 new categories.');
