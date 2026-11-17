/*
 * The captured WordPress screens, finished for the video (run after capture-wp.js; capture-wp.js runs it):
 * the times → the video's clock, the orders list as WooCommerce shows it then, WooCommerce's sprite icons drawn in place.
 *   - capture-wp.js captures with "now" = 10:52 (tools/wp/playground.js puts that time on everything the capture did
 *     "now"); here each screen gets the time the video's taskbar shows when that screen is on screen:
 *     the products (imported / edited) at PRODUCTS_AT, the orders (status changes, notes) at ORDERS_AT
 *   - the orders list: WooCommerce shows an order of the last 24 hours as "N 時間前" (human_time_diff) — the capture
 *     ran on another day, so the list showed dates; here the dates of the orders get what WooCommerce shows at ORDERS_AT
 *   - a Playground address left in a link → the dev site
 *   - product images in a size the capture did not save (src / srcset with the dev-site address) → the saved file
 *   - WooCommerce's gridicons sprite (<svg><use xlink:href="…/47c7fb….svg#gridicons-chevron-…">) is not downloaded by
 *     the capture (a <use> reference): the two chevrons the screens use are drawn in place (gridicons' own paths)
 *   node tools/snapshots/wp-ninshu-woocommerce/fix-wp-snapshot.js
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../../../public/videos/wp-ninshu-woocommerce/js/wp-snapshot.js');
const CAPTURED = '10:52';                  // capture-wp.js: WPC.start({ time })
const PRODUCTS_AT = '10:10';               // the taskbar while the products scene runs
const ORDERS_AT = '10:12';                 // … while the orders scene runs
const DAY = '2026-11-04';
const GRID = { 'gridicons-chevron-right': 'M10 20l8-8-8-8-1.414 1.414L15.172 12l-6.586 6.586z', 'gridicons-chevron-down': 'M20 9l-8 8-8-8 1.414-1.414L12 14.172l6.586-6.586z' };

const src = fs.readFileSync(FILE, 'utf8');
const head = src.slice(0, src.indexOf('window.WP_SNAPSHOT = '));
const snap = JSON.parse(src.slice(head.length + 'window.WP_SNAPSHOT = '.length).replace(/;\s*$/, ''));

const hm = (t) => t.split(':').map(Number);
const ampm = (t) => { const [h, m] = hm(t); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
/** WordPress' human_time_diff in Japanese (minutes / hours, rounded as WordPress does) */
function ago(fromIso, nowHm) {
  const [h, m] = hm(nowHm);
  const now = new Date(`${DAY}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+09:00`);
  const diff = (now - new Date(fromIso)) / 1000;
  if (diff < 0 || diff > 86400) return null;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}分前`;
  return `${Math.max(1, Math.round(diff / 3600))}時間前`;
}

// the product images the capture saved: an image's name without its size → the saved file
const UPLOADS = path.resolve(__dirname, '../../../public/videos/wp-ninshu-woocommerce/assets/wp/wp-content/uploads');
const stem = (rel) => rel.replace(/\.[a-z0-9]+$/i, '').replace(/-\d+x\d+$/, '').replace(/-scaled$/, '');
const LOCAL = {};
(function walk(dir, rel) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name), rel + e.name + '/');
    else if (!LOCAL[stem(rel + e.name)]) LOCAL[stem(rel + e.name)] = 'assets/wp/wp-content/uploads/' + rel + e.name;
  }
})(UPLOADS, '');

/** images the capture did not save at all (list rows below the fold): the same image from the live shop
 *  (js/products-data.js has each product's image there), saved where the dev-site address points */
async function fetchMissing() {
  const W = {};
  new Function('window', fs.readFileSync(path.resolve(__dirname, '../../../public/videos/wp-ninshu-woocommerce/js/products-data.js'), 'utf8'))(W);
  const LIVE = {};
  for (const r of W.NINSHU_PRODUCTS) if (r[11]) LIVE[stem(decodeURIComponent(r[11].split('/').pop()))] = r[11];
  const want = new Set();
  for (const p of Object.values(snap.pages)) for (const m of p.html.matchAll(/src="http:\/\/localhost:8888\/wp-content\/uploads\/([^"]+)"/g)) if (!LOCAL[stem(m[1])]) want.add(m[1]);
  for (const rel of want) {
    const base = stem(rel).split('/').pop();
    const url = LIVE[base] || LIVE[base.replace(/-\d+$/, '')];
    if (!url) { console.log('fix-wp-snapshot: no live image for', rel); continue; }
    const res = await fetch(url);
    if (!res.ok) { console.log('fix-wp-snapshot:', res.status, url); continue; }
    const file = path.join(UPLOADS, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    LOCAL[stem(rel)] = 'assets/wp/wp-content/uploads/' + rel;
  }
  return want.size;
}

let n = 0;
const sub = (html, a, b) => { const parts = html.split(a); n += parts.length - 1; return parts.join(b); };
(async () => {
const fetched = await fetchMissing();
for (const [key, page] of Object.entries(snap.pages)) {
  const at = /^order/.test(key) ? ORDERS_AT : PRODUCTS_AT;
  let h = page.html;
  h = sub(h, `${ampm(CAPTURED)}`, ampm(at));
  h = h.replace(new RegExp(`(\\d{4}年\\d{1,2}月\\d{1,2}日\\s*)${CAPTURED}`, 'g'), (m0, d) => { n++; return d + at; });
  // order notes: the tooltip (the capture's real UTC time) → the video's
  h = h.replace(/(<abbr title=")\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(")/g, (m0, a, b) => { n++; return `${a}${DAY} ${at}:00${b}`; });
  // the orders list: the date of an order of the last 24 hours → "N 時間前"
  if (/^orders/.test(key)) {
    h = h.replace(/<time datetime="([^"]+)" title="(\d{4})年(\d{1,2})月(\d{1,2})日 (\d{2}):(\d{2})">[^<]*<\/time>/g, (m0, dt, y, mo, d, hh, mi) => {
      const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${hh}:${mi}:00+09:00`;
      const rel = ago(iso, at);
      if (!rel) return m0;
      n++;
      return `<time datetime="${iso}" title="${y}年${mo}月${d}日 ${hh}:${mi}">${rel}</time>`;
    });
  }
  h = h.replace(/https?:\/\/(wpsandbox\.wordpress\.net|playground\.wordpress\.net)\/scope:[a-z-]+/g, () => { n++; return snap.site || 'http://localhost:8888'; });
  // product images: the capture saved the size the browser showed (in assets/wp); other sizes stayed dev-site addresses
  // in src / srcset → the saved file of the same image, srcset dropped (the browser would ask the dev site for it)
  h = h.replace(/<img\b[^>]*>/g, (tag) => {
    if (!/http:\/\/localhost:8888\/wp-content\/uploads\//.test(tag)) return tag;
    let t = tag.replace(/\s(srcset|sizes)="[^"]*"/g, '');
    t = t.replace(/\ssrc="http:\/\/localhost:8888\/wp-content\/uploads\/([^"]+)"/, (m0, rel) => { const loc = LOCAL[stem(rel)]; return loc ? ` src="${loc}"` : m0; });
    n++;
    return t;
  });
  // gridicons (the payments list' chevrons): the sprite reference → the icon's path
  h = h.replace(/<use xlink:href="[^"]*\.svg#(gridicons-chevron-(?:right|down))"><\/use>/g, (m0, id) => { n++; return `<path d="${GRID[id]}"></path>`; });
  page.html = h;
}
fs.writeFileSync(FILE, head + 'window.WP_SNAPSHOT = ' + JSON.stringify(snap) + ';\n');
console.log(`fix-wp-snapshot: ${n} changes, ${fetched} images from the live shop → ${path.relative(process.cwd(), FILE)} (now: node tools/webp.js wp-ninshu-woocommerce)`);
})();
