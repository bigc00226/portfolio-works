/*
 * The theme images the video shows that the live pages no longer load (tools/snapshot.js copies only what the pages
 * use): the old fixed reservation button (#bottomWebBtn, commented out in the live footer since the new buttons came),
 * shown on the smartphone before the change.
 *
 *   node tools/snapshots/wp-stand-by-lp/fetch-assets.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '../../..');
const THEME = 'stand-by.jp/wp/wp-content/themes/stand_by_beauty_clinic/';
const OUT = path.join(ROOT, 'public/videos/wp-stand-by-lp/assets/site');
const FILES = ['assets/img/webp/web_btn_bottom.webp'];

const get = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Safari/537.36' } }, (res) => {
    if (res.statusCode !== 200) { res.resume(); reject(new Error(res.statusCode + ' ' + url)); return; }
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks)));
  }).on('error', reject);
});

(async () => {
  for (const f of FILES) {
    const buf = await get('https://' + THEME + f);
    const out = path.join(OUT, THEME, f);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buf);
    console.log(f, (buf.length / 1024).toFixed(1) + ' KB');
  }
})().catch((e) => { console.error(e); process.exit(1); });
