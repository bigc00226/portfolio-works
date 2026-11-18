/*
 * 販促品直ナビ（www.chokunavi.shop, EC-CUBE 4）の公開データ → shop-data.json と商品画像
 * （../eccube-local/data/ec-chokunavi-maintenance/save_image）。公開ページを普通に読むだけ（ログイン・フォーム送信なし、1 件ずつ間隔をあけて）。
 *
 *   node tools/snapshots/ec-chokunavi-maintenance/scrape-shop.js
 *
 * 取るもの：トップのカテゴリー（ショップ自身の ID と名前）、カテゴリー 10 個 × 先頭の商品 2 点の商品名・商品コード・説明文・仕様（材質・サイズ・
 * 印刷範囲…）・規格（オリジナルシール / 既製品 などの名前と税抜の単価・最小注文数）・写真 1 枚。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const ORIGIN = 'https://www.chokunavi.shop';
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-chokunavi-maintenance/save_image');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CATS = [2, 9, 8, 7, 5, 20, 21, 25, 1, 23];
const PER = 2;

async function get(u, bin) {
  await wait(450);
  const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`);
  return bin ? Buffer.from(await r.arrayBuffer()) : r.text();
}
const decode = (s) => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');
const text = (html) => decode(String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).split('\n').map((l) => l.trim()).filter(Boolean).join('\n');

(async () => {
  fs.mkdirSync(IMG, { recursive: true });
  const home = await get(ORIGIN + '/');
  const top = [];
  for (const m of home.matchAll(/category_id=(\d+)"[^>]*>\s*([^<]{1,40}?)\s*</g)) {
    const id = +m[1];
    if (id < 100 && !top.some((c) => c.id === id)) top.push({ id, name: decode(m[2]).trim() });
  }
  console.log('categories', top.map((c) => `${c.id}:${c.name}`).join(' '));
  const products = [];
  for (const cid of CATS) {
    const list = await get(`${ORIGIN}/products/list?category_id=${cid}`);
    const ids = [...new Set([...list.matchAll(/products\/detail\/(\d+)/g)].map((m) => +m[1]))].filter((id) => !products.some((p) => p.id === id)).slice(0, PER);
    for (const id of ids) {
      const h = await get(`${ORIGIN}/products/detail/${id}`);
      const name = decode((h.match(/<title>([^<]*?)\s*\/\s*販促品直ナビ<\/title>/) || [])[1] || '').trim();
      const desc = text((h.match(/<div class="desc_block">\s*<p>([\s\S]*?)<\/p>/) || [])[1] || '');
      const specHtml = (h.match(/<div class="spec_block">([\s\S]*?)<div class="share_block">/) || [])[1] || '';
      const spec = [...specHtml.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)].map((m) => [text(m[1]), text(m[2])]);
      const code = (spec.find((s) => s[0] === '商品コード') || [])[1] || '';
      const classes = [];
      for (const m of h.matchAll(/<label for="item\d+">\s*([^<]*?)\s*<\/label>[\s\S]*?name="product_class_id\d+"[^>]*value="(\d+)"[\s\S]*?data-priceNoTax="([\d.]+)"[^>]*data-minNum="([\d.]+)"/g)) {
        classes.push({ name: decode(m[1]).trim(), classId: +m[2], price: Math.round(+m[3]), min: Math.round(+m[4]) });
      }
      const imgs = [...new Set([...h.matchAll(/src="(\/html\/upload\/save_image\/[^"]+)"/g)].map((m) => m[1]))];
      const main = imgs.find((s) => code && s.includes(code)) || imgs[0];
      let file = null;
      if (main) {
        file = path.basename(main);
        const dst = path.join(IMG, file);
        if (!fs.existsSync(dst)) fs.writeFileSync(dst, await get(ORIGIN + main, true));
      }
      products.push({ id, cat: cid, name, code, desc, spec, classes, file });
      console.log(id, cid, name, code, classes.map((c) => `${c.name}:${c.price}`).join(' / '), file);
    }
  }
  const out = { capturedAt: new Date().toISOString().slice(0, 10), origin: ORIGIN, categories: top, products };
  fs.writeFileSync(path.join(__dirname, 'shop-data.json'), JSON.stringify(out, null, 1));
  console.log('products', products.length, '→ shop-data.json');
})().catch((e) => { console.error(e); process.exit(1); });
