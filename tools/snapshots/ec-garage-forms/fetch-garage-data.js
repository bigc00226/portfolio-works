// The shop's public data for the local EC-CUBE 2 of the video (public pages of https://garage.plus.co.jp only — no login).
//
//   node tools/snapshots/ec-garage-forms/fetch-garage-data.js
//
// → tools/snapshots/ec-garage-forms/data/garage.json  (categories, products with their colour variations: 品番 / price / stock,
//   descriptions, image file names, the brand) and the product images + the Garage logo in ../eccube-local/garage-img/
//   (copied into the EC-CUBE copy by capture-ec.js). The 新着商品 of the site are kept apart: the video registers them by CSV.
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://garage.plus.co.jp';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const OUT = path.join(__dirname, 'data');
const IMG = path.resolve(__dirname, '../../../../eccube-local/garage-img');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u, bin) {
  for (let k = 0; k < 3; k++) {
    try {
      const r = await fetch(ORIGIN + u, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      await wait(700);
      return bin ? Buffer.from(await r.arrayBuffer()) : await r.text();
    } catch (e) { if (k === 2) throw new Error(u + ': ' + e.message); await wait(2000); }
  }
}
const txt = (s) => String(s || '').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[ \t]+/g, ' ').trim();
const num = (s) => Number(String(s || '0').replace(/,/g, ''));

// the shop's categories the local copy gets (id: the shop's own category_id, parent)
const CATS = [
  [1, 'デスク・机', 0], [13, 'スタンダードデスク', 1], [14, 'L字(L型)デスク', 1], [15, '昇降デスク', 1], [16, 'フリーアドレスデスク', 1],
  [2, 'テーブル', 0], [18, '会議用テーブル', 2], [20, 'ローテーブル・サイドテーブル', 2],
  [3, 'チェア・ソファ', 0], [22, '事務用チェア・オフィスチェア', 3], [25, '会議用チェア・ミーティングチェア', 3], [133, 'ソファー・ベンチ', 3],
  [5, '収納家具・シェルフ', 0], [29, 'ワゴン・サイドキャビネット', 5], [30, 'キャビネット・収納庫・書庫', 5],
  [8, 'パーティション・パネル', 0], [192, 'ロー パーティション', 8],
  [9, 'ホワイトボード・ミーティングツール', 0], [44, 'ホワイトボード 壁掛け', 9], [311, 'ホワイトボード 脚付き', 9],
  [7, 'デスク周辺用品', 0], [40, 'モニターアーム・ディスプレイスタンド', 7],
];
// categories whose list pages give the catalogue (first N products of each)
const FROM = [[13, 3], [15, 3], [18, 2], [22, 4], [25, 2], [30, 3], [29, 2], [192, 2], [44, 2], [40, 2]];

function parseList(html) {
  const out = [];
  const re = /<a href="\/products\/detail\.php\?product_id=(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) { const name = txt((m[2].match(/alt="([^"]*)"/) || [])[1] || m[2]); out.push({ id: +m[1], name }); }
  return out;
}
function parseDetail(html, id) {
  const name = txt((html.match(/<h1 class="detail_name">([\s\S]*?)<\/h1>/) || [])[1]);
  const cc = JSON.parse((html.match(/eccube\.classCategories = (\{.*?\});/) || [])[1] || '{}');
  const variants = [];
  for (const [k1, v] of Object.entries(cc)) {
    if (k1 === '__unselected') continue;
    for (const [k2, c] of Object.entries(v)) {
      if (k2 === '#' || !c.product_code) continue;
      variants.push({ code: c.product_code, color: c.classcategory_name1 || '', color2: c.classcategory_name2 || '', price01: num(c.price01), price02: num(c.price02), stock: c.stock === '' || c.stock == null ? null : num(c.stock), image: c.product_code_image || '' });
    }
  }
  const single = !variants.length ? { code: txt((html.match(/id="product_code_default"[^>]*>([\s\S]*?)</) || [])[1]), price02: num(txt((html.match(/id="price02_default"[^>]*>([\s\S]*?)</) || [])[1])) } : null;
  const og = (p) => (html.match(new RegExp(`<meta property="og:${p}" content="([^"]*)"`)) || [])[1] || '';
  const desc = txt(og('description')).replace(/^【[^】]*】\s*/, '');
  const brand = (html.match(/detail_tagFeatureIcon-maker[\s\S]{0,200}?alt="([^"]*)"/) || [])[1] || '';
  const icons = [...html.matchAll(/class="detail_statusIcon[^"]*"[^>]*><span class="detail_statusIcon_text"\s*>([^<]+)</g)].map((m) => txt(m[1]));
  const main = og('image').replace(ORIGIN, '');
  return { id, name, brand, desc, icons, main, variants, single };
}

(async () => {
  const top = await get('/');
  // the 新着商品 of the mega menu (on every page): kept apart for the CSV import
  const newBlock = (top.match(/data-menu-contents="new">([\s\S]*?)<\/ul>/) || [])[1] || '';
  const fresh = parseList(newBlock);
  const freshIds = new Set(fresh.map((p) => p.id));
  const all = new Set(parseList(top).map((p) => p.id));
  const pick = [];
  for (const [cat, n] of FROM) {
    const html = await get(`/products/list.php?category_id=${cat}`);
    const list = parseList(html).filter((p) => !freshIds.has(p.id) && !pick.some((q) => q.id === p.id));
    // the list's own products: those not in the site-wide menus of the page
    const own = list.filter((p) => !all.has(p.id) || true);
    let k = 0;
    for (const p of own) { if (k >= n) break; pick.push({ id: p.id, cat }); k++; }
    console.log('category', cat, '→', pick.filter((p) => p.cat === cat).map((p) => p.id).join(' '));
  }
  const products = [];
  for (const p of [...pick, ...fresh.slice(0, 8).map((f) => ({ id: f.id, cat: 0, fresh: true }))]) {
    try {
      const d = parseDetail(await get(`/products/detail.php?product_id=${p.id}`), p.id);
      if (!d.name) { console.log('  skip (no name)', p.id); continue; }
      d.cat = p.cat; d.fresh = !!p.fresh;
      for (const f of [d.main, d.main.replace(/_main\./, '_list.')]) {
        const file = path.join(IMG, path.basename(f));
        if (f && !fs.existsSync(file)) { try { fs.writeFileSync(file, await get(f, true)); } catch (e) { console.log('  image', e.message); } }
      }
      products.push(d);
      console.log(p.fresh ? 'new ' : '    ', p.id, d.name, '·', d.variants.length || 1, 'variants', d.variants[0] ? d.variants[0].code : d.single.code);
    } catch (e) { console.log('  fail', p.id, e.message); }
  }
  for (const f of ['/upload/save_brand_image/logo_garage.png', '/upload/save_maker_logo_image/garage_logo.png']) {
    try { fs.writeFileSync(path.join(IMG, path.basename(f)), await get(f, true)); } catch (e) { console.log('logo', e.message); }
  }
  fs.writeFileSync(path.join(OUT, 'garage.json'), JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), origin: ORIGIN, categories: CATS, products }, null, 1));
  console.log('wrote data/garage.json —', products.length, 'products; images in', IMG);
})().catch((e) => { console.error(e); process.exit(1); });
