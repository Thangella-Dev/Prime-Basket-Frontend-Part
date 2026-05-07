const https = require('https');

const urls = [
  // White Flour
  "https://ibb.co/ps9SPy5", "https://ibb.co/Yr256BY", "https://ibb.co/cX6nkMsp", "https://ibb.co/mksgMzp", "https://ibb.co/JjFns9FJ", "https://ibb.co/xt8SFHy4", "https://ibb.co/4nTTPtqX",
  // Salt
  "https://ibb.co/3bgqzLD", "https://ibb.co/wF3ccV5T", "https://ibb.co/kVv7R6pH", "https://ibb.co/gMHvQGy2", "https://ibb.co/cSDHxZy9", "https://ibb.co/wNjP5cqv", "https://ibb.co/5VkYm1K", "https://ibb.co/ns7L253q",
  // Sugar
  "https://ibb.co/2Ymm2WJD", "https://ibb.co/PZHSKWG1", "https://ibb.co/kjtNdQ6", "https://ibb.co/qML2C1kt", "https://ibb.co/jPhk47cv", "https://ibb.co/Rk574ZJk", "https://ibb.co/4nLb6Q9F", "https://ibb.co/Rk8LP07y", "https://ibb.co/mrmXpG4y",
  // Turmeric
  "https://ibb.co/cX6TVTLZ", "https://ibb.co/prnkpHT8", "https://ibb.co/WvgBvK8y"
];

function resolve(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const match = data.match(/https:\/\/i\.ibb\.co\/[^"]+\/[^"]+\.(jpg|png|webp|avif)/);
        if (match) resolve(match[0]);
        else resolve(null);
      });
    }).on('error', reject);
  });
}

async function run() {
  const results = {};
  for (const url of urls) {
    const direct = await resolve(url);
    results[url] = direct;
    console.log(`Resolved: ${url} -> ${direct}`);
  }
  console.log('\n--- FINAL RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
}

run();
