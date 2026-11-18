/*
 * ＠ベリーネット（b-net.tackleberry.co.jp, EC-CUBE 4）の公開ページから、開発環境のコピーに入れるデータを集める（公開ページのみ・ログインなし）。
 *   node tools/snapshots/ec-tackleberry-api/scrape-shop.js
 *   → tools/snapshots/ec-tackleberry-api/shop-data.json と ../eccube-local/data/ec-tackleberry-api/save_image/（商品画像 1 枚ずつ）
 * 中古品（販売種別 1）のロッド・リールの一覧の先頭から、詳細ページの商品名・ランク・状態・分類・メーカー・規格・品番・
 * 商品コード（店舗のバーコード）・価格（税抜：eccube.classCategories）を読む。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const BASE = 'https://b-net.tackleberry.co.jp';
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-tackleberry-api/save_image');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (u, bin) => { const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' } }); if (!r.ok) throw new Error(r.status + ' ' + u); return bin ? Buffer.from(await r.arrayBuffer()) : r.text(); };
const text = (h) => h.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
const RANK = { n: 'N', s: 'S', a: 'A', ab: 'AB', bp: 'B+', b: 'B', bm: 'B-', c: 'C', d: 'D' };

(async () => {
  fs.mkdirSync(IMG, { recursive: true });
  const lists = [['ロッド', 1, 9], ['リール', 2, 9]];
  const ids = [];
  for (const [, cat, n] of lists) {
    const h = await get(`${BASE}/products/list?sale_type[]=1&category_id=${cat}`);
    const found = [...new Set([...h.matchAll(/products\/detail\/(\d+)/g)].map((m) => m[1]))].slice(0, n);
    ids.push(...found);
    await wait(800);
  }
  const products = [];
  for (const id of ids) {
    const h = await get(`${BASE}/products/detail/${id}`);
    const name = (h.match(/<title>([^｜<]+)/) || [])[1].trim();
    const cc = JSON.parse((h.match(/eccube\.classCategories = (\{.*?\});\n/) || [])[1] || '{}');
    const c = Object.values(Object.values(cc).find((v) => v['#']) || {})[0] || {};
    const num = (s) => Number(String(s || '').replace(/,/g, '')) || null;
    const row = (th) => { const m = h.match(new RegExp(`<th>\\s*${th}\\s*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`)); return m ? text(m[1]) : ''; };
    const catBlock = (h.match(/大分類([\s\S]*?)<th>メーカー名/) || [])[1] || '';
    const cats = ['大分類', '中分類', '小分類'].map((k) => { const m = (h.match(new RegExp(`${k}[\\s\\S]*?<td[^>]*>([\\s\\S]*?)</td>`)) || [])[1]; return m ? text(m) : ''; });
    const rank = (h.match(/prod-rank-([a-z]+)\.svg/) || [])[1];
    const imgs = [...new Set([...h.matchAll(/https:\/\/img-cache\.tackleberry\.co\.jp\/stock_img\/(\d+)\/LL\/(\d+)\.JPG/g)].map((m) => m[0]))];
    const stockNo = (imgs[0] || '').match(/stock_img\/(\d+)/);
    const p = {
      id: Number(id), classId: Number(c.product_class_id) || null, code: c.product_code || null, saleType: Number(c.sale_type) || null,
      name, rank: RANK[rank] || null, price01: num(c.price01), price02: num(c.price02), price02Inc: num(c.price02_inc_tax),
      state: row('商品の状態'), maker: row('メーカー名'), model: row('規格・品番'), cats, stockNo: stockNo ? stockNo[1] : null, images: imgs.slice(0, 2), files: [],
    };
    void catBlock;
    for (const [i, u] of p.images.slice(0, 1).entries()) {
      const f = `tb_${p.stockNo}_${i + 1}.jpg`;
      if (!fs.existsSync(path.join(IMG, f))) { fs.writeFileSync(path.join(IMG, f), await get(u, true)); await wait(400); }
      p.files.push(f);
    }
    products.push(p);
    console.log(p.id, p.code, p.rank, p.price02Inc, p.cats.join(' > '), p.maker, '|', p.name);
    await wait(900);
  }
  const law = await get(`${BASE}/help/tradelaw`);
  const out = { fetched: new Date().toISOString(), source: BASE, products, tradelaw: text((law.match(/<main[\s\S]*?<\/main>/) || [law])[0]).slice(0, 4000) };
  fs.writeFileSync(path.join(__dirname, 'shop-data.json'), JSON.stringify(out, null, 1));
  console.log('products', products.length, '→ shop-data.json; images →', IMG);
})().catch((e) => { console.error(e); process.exit(1); });
