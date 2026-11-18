/*
 * あみだ池大黒オンラインショップ（https://www.daikoku.ne.jp/shop/ — EC-CUBE 4, theme "amidaike"）: the public data the
 * ec-daikoku-plugin video loads into its local EC-CUBE 4.3 (public pages only, no login).
 *
 *   node tools/snapshots/ec-daikoku-plugin/scrape-shop.js
 *   → tools/snapshots/ec-daikoku-plugin/shop-data.json, pictures in ../eccube-local/data/ec-daikoku-plugin/save_image
 *
 * For each product: the live id, name, 税込 price and product code (eccube.classCategories of the page), the description
 * (説明), the spec table (箱サイズ・内容量・賞味期限 …), the breadcrumb category, whether the page shows the shop's own
 * 「のし設定」 icon (icon_noshi_pc.png — the products that take a のし), and the first two pictures.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.join(__dirname, 'shop-data.json');
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-daikoku-plugin/save_image');
const BASE = 'https://www.daikoku.ne.jp/shop';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
// 進物用おこし · あみだ池大黒のお菓子 · 大阪もちまろ菓 · pon pon Ja pon · 手提げ袋
const IDS = [290, 293, 294, 296, 297, 298, 299, 300, 6, 7, 17, 18, 124, 125, 133, 211, 144, 145];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (h) => h.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
  .split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();

async function get(url, bin) {
  for (let k = 0; k < 3; k++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' } });
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return bin ? Buffer.from(await r.arrayBuffer()) : await r.text();
    } catch (e) { if (k === 2) throw e; await wait(1500); }
  }
}

(async () => {
  fs.mkdirSync(IMG, { recursive: true });
  const products = [];
  const categories = {};
  for (const id of IDS) {
    const h = await get(`${BASE}/products/detail/${id}`);
    const name = text((/<h2 class="productDetailPage-productName">([\s\S]*?)<\/h2>/.exec(h) || [])[1] || '');
    const desc = text((/<div class="productDetailPage-descriptionDetail">([\s\S]*?)<\/div>/.exec(h) || [])[1] || '');
    const cc = /eccube\.classCategories = (\{[\s\S]*?\});\n/.exec(h);
    let price = null, priceEx = null, code = null;
    if (cc) {
      const j = JSON.parse(cc[1]);
      const first = Object.values(j).flatMap((o) => Object.values(o)).find((o) => o.price02_inc_tax);
      if (first) { price = +String(first.price02_inc_tax).replace(/,/g, ''); priceEx = +String(first.price02).replace(/,/g, ''); code = first.product_code || null; }
    }
    const spec = [];
    const re = /<dt class="productDetailPage-specArea-contents-title">([\s\S]*?)<\/dt>\s*<dd class="productDetailPage-specArea-contents-main">([\s\S]*?)<\/dd>/g;
    for (let m = re.exec(h); m; m = re.exec(h)) spec.push([text(m[1]), text(m[2])]);
    const crumbs = [];
    const bc = /<ol class="breadcrumb-list">([\s\S]*?)<\/ol>/.exec(h);
    if (bc) for (const m of bc[1].matchAll(/category_id=(\d+)"[^>]*>([^<]*)</g)) crumbs.push([+m[1], text(m[2])]);
    const imgs = [...new Set([...h.matchAll(/<div class="slide-item"><img src="\/shop\/html\/upload\/save_image\/([^"]+)"/g)].map((m) => m[1]))].slice(0, 2);
    const files = [];
    for (const f of imgs) {
      const dest = path.join(IMG, f);
      if (!fs.existsSync(dest)) { fs.writeFileSync(dest, await get(`${BASE}/html/upload/save_image/${f}`, true)); await wait(300); }
      files.push(f);
    }
    const noshi = /icon_noshi_pc\.png/.test(h);
    const bag = /name="gift_paper_bag"/.test(h);
    const cat = crumbs.length ? crumbs[crumbs.length - 1] : null;
    if (cat) categories[cat[0]] = cat[1];
    products.push({ id, name, price, priceEx, code, desc, spec, category: cat && cat[0], crumbs, files, noshi, bag });
    console.log(id, name, price, code, cat && cat[1], noshi ? 'のし' : '', files.length);
    await wait(700);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), source: BASE, categories, products }, null, 2));
  console.log('wrote', OUT, products.length, 'products', Object.keys(categories).length, 'categories');
})().catch((e) => { console.error(e); process.exit(1); });
