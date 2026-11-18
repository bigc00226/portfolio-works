/*
 * The theme's header / menu (the live markup) shows the shop's banner pictures from /html/upload/save_image (2510_cagolf_02.jpg …),
 * which are not product pictures, so the local EC-CUBE 4 had no copy and capture.js left their addresses as they were.
 * This saves them from the live site (public) next to the other captured files and points the screens at them.
 *   node tools/snapshots/ec-cagiana-migration/fix-frame-images.js   (after capture-ec.js) → node tools/webp.js ec-cagiana-migration
 * (build-theme.js now also puts them into theme/html/upload/save_image, so a new capture has them.)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos/ec-cagiana-migration');
const FILE = path.join(DIR, 'js/ec-snapshot.js');
(async () => {
  let s = fs.readFileSync(FILE, 'utf8');
  const urls = [...new Set([...s.matchAll(/http:\/\/localhost:8080\/html\/upload\/save_image\/([\w.-]+\.(?:jpe?g|png|gif))/g)].map((m) => m[1]))];
  let n = 0;
  for (const f of urls) {
    const lp = `assets/ec/html/upload/save_image/${f}`;
    const out = path.join(DIR, lp);
    if (!fs.existsSync(out)) {
      const r = await fetch(`https://cagiana.jp/html/upload/save_image/${f}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) { console.log('missing', f, r.status); continue; }
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    }
    s = s.split(`http://localhost:8080/html/upload/save_image/${f}`).join(lp);
    n++;
  }
  fs.writeFileSync(FILE, s);
  console.log('banner pictures:', n, 'of', urls.length);
})().catch((e) => { console.error(e); process.exit(1); });
