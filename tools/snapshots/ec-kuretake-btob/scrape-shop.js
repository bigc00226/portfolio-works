/*
 * The shop data of the ec-kuretake-btob video, from the PUBLIC pages of 呉竹 BtoBオンライン注文サイト
 * (https://order.kuretake.co.jp — EC-CUBE 4; its catalog, 定価 and 発注単位 are public, ordering needs a login that
 * is never used here). No login, no form is sent: only GET requests of public pages and product pictures.
 *
 *   node tools/snapshots/ec-kuretake-btob/scrape-shop.js
 *   → tools/snapshots/ec-kuretake-btob/shop-data.json
 *   → ../eccube-local/data/ec-kuretake-btob/save_image/<品番>.jpg (the public product pictures, as served)
 *
 * What it takes: the top categories and their sub categories (ids and names, in the site's order), the products of a few
 * sub categories (product id, 品番, 商品名, 型／色, JAN, 定価 (tax excluded), 発注単位, picture) with their detail
 * (商品特徴, 商品サイズ, 素材 …), the news (dates, titles, texts), 特定商取引法に基づく表記.
 */
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://order.kuretake.co.jp';
const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.join(__dirname, 'shop-data.json');
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-kuretake-btob/save_image');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
// sub categories whose products are taken (name → at most n products)
const PICK = [['呉竹墨', 8], ['墨滴', 6], ['筆ぺん', 8], ['美文字筆ぺん', 6], ['書道半紙・半切', 4]];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (u) => { await wait(350); const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja' } }); if (!r.ok) throw new Error(`${u} → HTTP ${r.status}`); return r.text(); };
const dec = (s) => String(s).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#064;/g, '@').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();

(async () => {
  fs.mkdirSync(IMG, { recursive: true });
  const top = await get(ORIGIN + '/');
  // the category navigation: top level (categoryNav-parent) and sub categories (categoryNav-subParent), in order
  const nav = top;
  const cats = [];
  let parent = null;
  for (const m of nav.matchAll(/categoryNav-(parent|subParent)[^"]*categoryID-(\d+)[\s\S]*?>\s*([^<]+?)\s*</g)) {
    const id = +m[2];
    if (cats.some((c) => c.id === id)) continue;
    if (m[1] === 'parent') { parent = id; cats.push({ id, name: dec(m[3]), parent: null }); } else cats.push({ id, name: dec(m[3]), parent });
  }
  // the nav's anchors carry the names (span → a): fill names from the list links where the regex caught markup
  for (const c of cats) if (!c.name || /^</.test(c.name)) {
    const m = nav.match(new RegExp(`category_id=${c.id}"[^>]*>\\s*([^<]+?)\\s*<`));
    if (m) c.name = dec(m[1]);
  }
  console.log('categories', cats.length, cats.filter((c) => !c.parent).map((c) => `${c.id}:${c.name}`).join(' '));

  const products = [];
  for (const [name, n] of PICK) {
    const cat = cats.find((c) => c.name === name && c.parent);
    if (!cat) { console.log('no category', name); continue; }
    const html = await get(`${ORIGIN}/products/list?category_id=${cat.id}`);
    const items = [...html.matchAll(/<li class="ec-shelfGrid__item[\s\S]*?<\/li>/g)].map((m) => m[0]);
    let took = 0;
    for (const it of items) {
      if (took >= n) break;
      const id = +((it.match(/products\/detail\/(\d+)/) || [])[1] || 0);
      const img = (it.match(/<img src="([^"]+)"/) || [])[1] || '';
      const ps = [...it.matchAll(/<p class="productListPage-productInfo-text">([\s\S]*?)<\/p>/g)].map((m) => dec(m[1]));
      if (!id || /no_image/.test(img) || products.some((p) => p.id === id)) continue;
      const [code, pname, type] = ps;
      const jan = ((ps.find((x) => /^JAN/.test(x)) || '').match(/(\d{8,13})/) || [])[1] || null;
      const price = +(((ps.find((x) => /定価/.test(x)) || '').match(/[￥¥]([\d,]+)/) || [])[1] || '0').replace(/,/g, '');
      const unit = +(((ps.find((x) => /発注単位/.test(x)) || '').match(/(\d+)/) || [])[1] || 1);
      if (!price) continue;
      // detail: the spec table (dt / dd pairs)
      const d = await get(`${ORIGIN}/products/detail/${id}`);
      const spec = {};
      for (const m of d.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)) { const k = dec(m[1]); if (k && k.length < 12 && !spec[k]) spec[k] = dec(m[2]); }
      for (const m of d.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)) { const k = dec(m[1]); if (k && k.length < 12 && !spec[k]) spec[k] = dec(m[2]); }
      const lead = dec((d.match(/<h2[^>]*class="[^"]*ec-headingTitle[^"]*"[^>]*>[\s\S]*?<\/h2>\s*(?:<[^>]+>\s*)*?<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '');
      let file = null;
      if (img) {
        const u = new URL(img, ORIGIN).href;
        file = decodeURIComponent(path.basename(new URL(u).pathname));
        const dest = path.join(IMG, file);
        if (!fs.existsSync(dest)) {
          await wait(250);
          const r = await fetch(u, { headers: { 'User-Agent': UA } });
          if (r.ok) fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); else file = null;
        }
      }
      products.push({ id, code, name: pname, type: type || null, jan, price, unit, category: cat.id, file, lead, spec });
      took++;
      console.log(`  ${cat.name} ${id} ${code} ${pname} ${type || ''} ¥${price} 単位${unit} ${file || '-'}`);
    }
  }

  // news (dates, titles, texts) — the list pages
  const news = [];
  for (const pg of [1, 2, 3]) {
    let h;
    try { h = await get(`${ORIGIN}/news${pg > 1 ? '?pageno=' + pg : ''}`); } catch (e) { break; }
    for (const m of h.matchAll(/<dt class="newsPage-main-date">([^<]+)<\/dt>\s*<dd class="newsPage-main-body">\s*<div class="ec-newsRole__newsTitle">([\s\S]*?)<\/div>([\s\S]*?)<\/dd>/g)) {
      const dm = m[1].match(/(\d{4})年(\d{2})月(\d{2})日/);
      const date = dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : null;
      if (!news.some((x) => x.date === date && x.title === dec(m[2]))) news.push({ date, title: dec(m[2]), body: dec(m[3].replace(/<\/p>/g, '\n')) });
    }
  }
  console.log('news', news.length, news.map((x) => x.date).join(' '));

  // 特定商取引法に基づく表記 (dt / dd)
  const law = [];
  const lh = await get(ORIGIN + '/help/tradelaw');
  for (const m of lh.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)) law.push([dec(m[1]), dec(m[2])]);

  fs.writeFileSync(OUT, JSON.stringify({ source: ORIGIN, fetched: new Date().toISOString().slice(0, 10), categories: cats, products, news, law }, null, 1));
  console.log('wrote', OUT, products.length, 'products');
})().catch((e) => { console.error(e); process.exit(1); });
