const https = require('https');

const urls = [
  // Chilli
  "https://ibb.co/8DvN2wSm", "https://ibb.co/Vcj6dxy2", "https://ibb.co/BKTpYf1q", "https://ibb.co/VWhJ7w4h", "https://ibb.co/21hddmRX", "https://ibb.co/n8VNqLtH", "https://ibb.co/1Jn1K57L",
  // Pulses
  "https://ibb.co/gZ52Ls7T", "https://ibb.co/C5Nx0xSf", "https://ibb.co/v6VyGhrg", "https://ibb.co/V0YJJCs5", "https://ibb.co/0ps94XvQ", "https://ibb.co/C3r9qJk8", "https://ibb.co/Ld2B8t26", "https://ibb.co/kVyPbNrm",
  // Masala
  "https://ibb.co/mC83GqCS", "https://ibb.co/Dgw3DMnZ", "https://ibb.co/FqJLNPLx", "https://ibb.co/gbKFyDqF", "https://ibb.co/Kjm3Ks0J", "https://ibb.co/6c0wztwv"
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
