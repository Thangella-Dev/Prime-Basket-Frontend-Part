const fs = require('fs');
const https = require('https');

const urls = [
  // Home needs
  "https://ibb.co/nq94wFqx",
  "https://ibb.co/23QbWwK0",
  "https://ibb.co/FkV8ytxB",
  "https://ibb.co/HpzNz58k",
  "https://ibb.co/bjFxDCTj",
  "https://ibb.co/DfkHpCjz",
  "https://ibb.co/0RJFCgY6",
  "https://ibb.co/j9H8JZZf",
  "https://ibb.co/Kz0zfKy0",
  // Dairy products
  "https://ibb.co/k2ghfHyS",
  "https://ibb.co/Ng4mZQKh",
  "https://ibb.co/JWk3Xbkb",
  "https://ibb.co/sJMnGGKd",
  "https://ibb.co/RkJ2V3Tx",
  "https://ibb.co/0VC6gJq4",
  "https://ibb.co/GQbtk4x0",
  "https://ibb.co/tMvzgdrk",
  "https://ibb.co/1fHbn4ng",
  "https://ibb.co/SwyWxbzc",
  "https://ibb.co/8gk1w9Zx",
  "https://ibb.co/XZYBG3Kk",
  "https://ibb.co/d4QQRjMh",
  "https://ibb.co/TMR8BSwm",
  "https://ibb.co/WvryMWnL",
  "https://ibb.co/qMWK9kvK",
  "https://ibb.co/KxQk9m5g",
  "https://ibb.co/NgbVyWnQ",
  // Baby care
  "https://ibb.co/1twjQfch",
  "https://ibb.co/xKKytWSQ",
  "https://ibb.co/7J66TxRt",
  // Milk powder
  "https://ibb.co/35nk4XsH",
  "https://ibb.co/HT8zrzq5",
  "https://ibb.co/wFHX39tM",
  "https://ibb.co/HLR1dwpj",
  "https://ibb.co/MDT3dqWf",
  "https://ibb.co/1GD7jnmY",
  "https://ibb.co/DPT5Sb00",
  "https://ibb.co/vCxxhs3K",
  // Oral care
  "https://ibb.co/d4m5wB4z",
  "https://ibb.co/5XQvh97w",
  "https://ibb.co/ZzDzZ6LL",
  "https://ibb.co/WNgC7GRq",
  "https://ibb.co/HDyJct4y",
  "https://ibb.co/1t3PrRR6",
  "https://ibb.co/V0tbfz2g",
  "https://ibb.co/nsWjtwG0"
];

async function resolveUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const match = data.match(/<meta property="og:image" content="(.*?)"/);
        if (match && match[1]) {
          resolve({ original: url, resolved: match[1] });
        } else {
          resolve({ original: url, resolved: null });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  const results = [];
  for (const url of urls) {
    console.log(`Resolving ${url}...`);
    try {
      const res = await resolveUrl(url);
      results.push(res);
    } catch (e) {
      console.error(`Failed ${url}: ${e.message}`);
      results.push({ original: url, resolved: null });
    }
  }
  fs.writeFileSync('resolved_kenya_batch_4.json', JSON.stringify(results, null, 2));
  console.log('Done! Results saved to resolved_kenya_batch_4.json');
}

run();
