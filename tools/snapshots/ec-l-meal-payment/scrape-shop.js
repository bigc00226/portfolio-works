/*
 * ライフミール（l-meal.com, EC-CUBE 4）— the shop's public data for the local EC-CUBE copy of the ec-l-meal-payment video.
 * Public pages only (no login): /products/list (MENU: names, categories, 種類), /products/detail/<id> (description,
 * メニュー詳細, 栄養価, pictures), the logo and the plan page's freezer picture.
 *
 *   node tools/snapshots/ec-l-meal-payment/scrape-shop.js
 *   → tools/snapshots/ec-l-meal-payment/shop-data.json
 *   → ../eccube-local/data/ec-l-meal-payment/save_image/*  (the pictures, copied into EC-CUBE by capture-ec.js)
 */
const fs = require('fs');
const path = require('path');
const ORIGIN = 'https://l-meal.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const IMG = path.resolve(__dirname, '../../../../eccube-local/data/ec-l-meal-payment/save_image');
const PER_CAT = 4;
const get = async (u) => { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(r.status + ' ' + u); return r; };
const text = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

(async () => {
  fs.mkdirSync(IMG, { recursive: true });
  const list = await (await get(ORIGIN + '/products/list')).text();
  const cats = {};
  for (const m of list.matchAll(/<li data-value="(\d+)"><a [^>]*class="category">([^<]+)<\/a>/g)) cats[m[1]] = m[2].trim();
  const items = [];
  for (const m of list.matchAll(/<li class="products__item"\s+data-product="(\d+)"\s+data-typefilter="(\d+)"\s+category="(\d+)"\s+name="([^"]+)"/g)) {
    items.push({ id: +m[1], type: m[2], category: +m[3], name: m[4] });
  }
  const types = {};
  for (const m of list.matchAll(/class="typeFilter(\d+)">([^<]+)</g)) types[m[1]] = m[2].trim();
  console.log('menu', items.length, 'categories', JSON.stringify(cats), 'types', JSON.stringify(types));
  const pick = [];
  for (const c of Object.keys(cats)) pick.push(...items.filter((i) => i.category === +c).slice(0, PER_CAT));
  const products = [];
  for (const it of pick) {
    const html = await (await get(`${ORIGIN}/products/detail/${it.id}`)).text();
    const desc = text((html.match(/<h1>[^<]*<\/h1>\s*<p>([\s\S]*?)<\/p>/) || [])[1]);
    const detail = text((html.match(/<h3>メニュー詳細<\/h3>\s*<p>([\s\S]*?)<\/p>/) || [])[1]);
    const nutr = {};
    for (const m of html.matchAll(/<p class="ttl">([^<]+)<\/p>\s*<p class="txt">([\s\S]*?)<\/p>/g)) nutr[m[1].trim()] = text(m[2].replace(/<span>/, ' '));
    const imgs = [...new Set([...html.matchAll(/<img src="(\/html\/upload\/save_image\/[^"]+)" alt="[^"]*" style="margin: 0 auto">/g)].map((m) => m[1]))];
    const files = [];
    for (const src of imgs.slice(0, 2)) {
      const name = path.basename(src);
      const f = path.join(IMG, name);
      if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(await (await get(ORIGIN + src)).arrayBuffer()));
      files.push(name);
    }
    products.push({ ...it, categoryName: cats[it.category], typeName: types[it.type], description: desc, menu: detail, nutrition: nutr, files });
    console.log(it.id, it.name, files.length, Object.keys(nutr).length);
  }
  // the logo and the freezer of the plan page (冷凍庫無料レンタル)
  for (const [src, name] of [['/html/user_data/assets/img/common/logo.png', 'lmeal_logo.png'], ['/html/user_data/assets/img/shopping_plan/freezer.png', 'lmeal_freezer.png']]) {
    fs.writeFileSync(path.join(IMG, name), Buffer.from(await (await get(ORIGIN + src)).arrayBuffer()));
  }
  const out = { fetched: new Date().toISOString().slice(0, 10), origin: ORIGIN, categories: cats, types, menuCount: items.length, products };
  fs.writeFileSync(path.join(__dirname, 'shop-data.json'), JSON.stringify(out, null, 1));
  console.log('wrote shop-data.json:', products.length, 'products');
})().catch((e) => { console.error(e); process.exit(1); });
