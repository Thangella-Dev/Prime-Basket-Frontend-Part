const https = require('https');
const fs = require('fs');

const urls = [
  ['https://ibb.co/ZpL0316Y',  'Top Food Cajun Spice Blend',                     'instantFood'],
  ['https://ibb.co/BKQpNTgD',  'Top Food Indian Chat Masala',                     'instantFood'],
  ['https://ibb.co/cXRmgB6C',  'Nongshim Shin Ram Spicy Chicken',                 'instantFood'],
  ['https://ibb.co/Xx8KcwDH',  'Enso Wasabi Peanuts',                             'instantFood'],
  ['https://ibb.co/JjrGDyXf',  'Ottogi Cheese Ramen',                             'instantFood'],
  ['https://ibb.co/Psyqj59c',  'Shan Shahi Haleem Masala Mix',                    'instantFood'],
  ['https://ibb.co/yB5xyJYs',  'Nongshim Shin Ramyun With Cheese',                'instantFood'],
  ['https://ibb.co/214tKHYQ',  'Kikkoman Egg Soup Mix Hot Sour',                  'instantFood'],
  ['https://ibb.co/wN9y6FqF',  'Ola Cheese Tortilla Chips',                       'chipsAndNamkeens'],
  ['https://ibb.co/VWTpVvNF',  'Norda Urban Stix Bbq Crunchy Corn Snacks',        'chipsAndNamkeens'],
  ['https://ibb.co/qL2KDWMy',  'Krackles Barbeque Potato Chips',                  'chipsAndNamkeens'],
  ['https://ibb.co/mChghsgD',  'Ola Mexican Crunch Tortilla Chips',               'chipsAndNamkeens'],
  ['https://ibb.co/bj294mWX',  'Tropical Heat Snacks Salted Potato Crisps',       'chipsAndNamkeens'],
  ['https://ibb.co/sz7C5tC',   'Ola Cool Crunch Tortilla Chips',                  'chipsAndNamkeens'],
  ['https://ibb.co/0yMqMZHR',  'Krackles Tingly Cheese And Onion Potato Chips',   'chipsAndNamkeens'],
  ['https://ibb.co/4Z5ttZkC',  'Tropical Heat Snacks Tomato Potato Crisps',       'chipsAndNamkeens'],
  ['https://ibb.co/Cp9wN48x',  'Floydeez Caramel Popcorn',                        'chipsAndNamkeens'],
  ['https://ibb.co/tTj2WhYt',  'Tropical Heat Snacks Waves Potato Salted Crisps', 'chipsAndNamkeens'],
  ['https://ibb.co/mCZdhNdY',  'Norda Urban Bites Nyama Choma Potato Crisps',     'chipsAndNamkeens'],
  ['https://ibb.co/5xr3SFbH',  'Tropical Heat Waves Crisps Fruit Chutney',        'chipsAndNamkeens'],
  ['https://ibb.co/jkXdWRnC',  'Pringles Original Flavour Crisps',                'chipsAndNamkeens'],
  ['https://ibb.co/1fmbBjm0',  'Norda Ringoz Barbeque Crunchy Corn Rings',        'chipsAndNamkeens'],
  ['https://ibb.co/dszVX9hj',  'Kudos Tomato Ketchup Corn Puffs',                 'chipsAndNamkeens'],
  ['https://ibb.co/dJc0Jdzg',  'Pringles Sour Cream And Onion Chips',             'chipsAndNamkeens'],
  ['https://ibb.co/JjKjGL9Y',  'Nuvita Barbeque Baked Corn Puffs',                'chipsAndNamkeens'],
  ['https://ibb.co/Q3WgFsQF',  'Basmati Rice',                                    'rice'],
  ['https://ibb.co/tpn5xS2D',  'Daawat Basmati Rice',                             'rice'],
  ['https://ibb.co/q3PH4XS4',  'Amana Basmati Rice',                              'rice'],
  ['https://ibb.co/jPTgKTYD',  'Pilau Rice',                                      'rice'],
  ['https://ibb.co/TqPg9Sh1',  'Pishori Rice',                                    'rice'],
  ['https://ibb.co/pj6hTJ9y',  'Corn Oil',                                        'oil'],
  ['https://ibb.co/3yXCmQmT',  'Sunflower Oil',                                   'oil'],
  ['https://ibb.co/CKNrKNVS',  'Coconut Oil',                                     'oil'],
  ['https://ibb.co/67qxp3Cp',  'Vegetable Oil',                                   'oil'],
  ['https://ibb.co/9knNNBY9',  'Salit Cooking Oil',                               'oil'],
  ['https://ibb.co/TBG2HxNs',  'Fry Cooking Oil',                                 'oil'],
  ['https://ibb.co/PGnNCPfS',  'Kenola Oil',                                      'oil'],
  ['https://ibb.co/9H8f2dPp',  'Rina Vegetable Oil',                              'oil'],
  ['https://ibb.co/mn9G9GV',   'Pika Vegetable Oil',                              'oil'],
];

function fetchHtml(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 8000
    }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

async function run() {
  const results = [];
  for (const [shortUrl, name, category] of urls) {
    const html = await fetchHtml(shortUrl);
    const m = html.match(/property="og:image"\s+content="([^"]+)"/);
    const directUrl = m ? m[1] : 'NOT_FOUND';
    const line = shortUrl + ' | ' + directUrl + ' | ' + name + ' | ' + category;
    console.log(line);
    results.push({ shortUrl, directUrl, name, category });
  }
  fs.writeFileSync('public/imgbb_direct_urls.json', JSON.stringify(results, null, 2));
  console.log('\nDONE - saved to public/imgbb_direct_urls.json');
}

run();
