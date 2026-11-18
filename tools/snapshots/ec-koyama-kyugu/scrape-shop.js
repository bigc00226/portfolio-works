/*
 * The public data of 小山弓具 (www.koyama-kyugu.com, EC-CUBE 4) for the video's local EC-CUBE: the category tree
 * (the sidebar of the live pages), a subset of the products (name, price per 規格, 送料 size, description, images,
 * stock as the public pages show it), the shop's contact and shipping rules. Public pages only — no login, no cart.
 *
 *   node tools/snapshots/ec-koyama-kyugu/scrape-shop.js   → tools/snapshots/ec-koyama-kyugu/shop-data.json
 */
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.koyama-kyugu.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p) => { await wait(400); const r = await fetch(BASE + p, { headers: { 'user-agent': UA, 'accept-language': 'ja' } }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.text(); };
const txt = (h) => String(h || '').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#215;/g, '×').replace(/&quot;/g, '"').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim();

// categories (id → how many products to take)
const PICK = { 13: 2, 14: 1, 15: 2, 16: 1, 28: 2, 37: 3, 38: 2, 40: 1, 46: 1, 48: 1, 50: 1, 53: 1, 58: 1, 60: 1, 81: 1, 70: 1 };

(async () => {
  const home = await get('/');
  // the sidebar: top categories with their children
  const cats = [];
  const side = home.slice(home.indexOf('class="siderItem"'), home.indexOf('class="siderItem02"'));
  for (const box of side.split('class="siderBox tabArea"').slice(1)) {
    const top = box.match(/category_id=(\d+)"[\s\S]*?<dd class="NotoSerifJp">([^<]+)<\/dd>/);
    const icon = (box.match(/<dt><img src="([^"]+)"/) || [])[1];
    const kids = [...box.matchAll(/<li><a href="[^"]*category_id=(\d+)">([^<]+)<\/a><\/li>/g)].map((m) => ({ id: +m[1], name: m[2] }));
    cats.push({ id: +top[1], name: top[2], icon, children: kids });
  }
  console.log('categories', cats.length, cats.map((c) => c.name).join(' / '));
  const products = [];
  for (const [cid, n] of Object.entries(PICK)) {
    const list = await get('/products/list?category_id=' + cid);
    const main = list.slice(list.indexOf('id="main"'));
    const ids = [...new Set([...main.matchAll(/products\/detail\/(\d+)/g)].map((m) => +m[1]))];
    let took = 0;
    for (const id of ids) {
      if (took >= n || products.some((p) => p.id === id)) continue;
      const h = await get('/products/detail/' + id);
      const name = txt((h.match(/<p class="detail01 NotoSerifJp">([\s\S]*?)<\/p>/) || [])[1]);
      if (!name) continue;
      const cc = h.match(/eccube\.classCategories = (\{[\s\S]*?\});/);
      let classes = null;
      try { classes = cc ? JSON.parse(cc[1]) : null; } catch (e) { classes = null; }
      const labels = [...h.matchAll(/<label class="required" for="classcategory_id(\d)">([^<]+)<\/label>/g)].map((m) => m[2]);
      const opts = [...h.matchAll(/<h4 class="modal-title">([^<]+)<\/h4>/g)].map((m) => m[1]);
      const optSel = h.match(/<h4 class="modal-title">[^<]+<\/h4>[\s\S]*?<select[^>]*>([\s\S]*?)<\/select>/);
      const optValues = optSel ? [...optSel[1].matchAll(/<option value="[^"]*">([^<]+)<\/option>/g)].map((m) => m[1]).filter((v) => !/選択/.test(v)) : [];
      const desc = (h.match(/<div class="detailAsus">([\s\S]*?)<\/div>/) || [])[1] || '';
      const slider = (h.match(/<div class="SliderFor">([\s\S]*?)<div class="SliderNav">/) || [])[1] || '';
      const images = [...new Set([...slider.matchAll(/<img src="(\/html\/upload\/save_image\/[^"]+)"/g)].map((m) => m[1]))];
      const crumbs = [...(h.match(/<div id="breadcrumb">([\s\S]*?)<\/div>/) || ['', ''])[1].matchAll(/category_id=(\d+)">([^<]+)</g)].map((m) => ({ id: +m[1], name: m[2] }));
      const sel1 = (h.match(/<select id="classcategory_id1"[^>]*>([\s\S]*?)<\/select>/) || [])[1] || '';
      const class1 = [...sel1.matchAll(/<option value="(\d+)">([^<]+)<\/option>/g)].map((m) => ({ id: +m[1], name: m[2] }));
      // the line under the price (付属品 … on some products; EC-CUBE: the free area)
      const free = ((h.match(/<p class="detail04">([\s\S]*?)<\/p>/) || [])[1] || '').trim();
      const note = txt((h.match(/<\/select>\s*<\/span>\s*<\/h3>\s*<p>([\s\S]*?)<\/p>/) || [])[1]);
      products.push({
        id, name, category: +cid, crumbs,
        price: txt((h.match(/<span class="price02-default">([\s\S]*?)<\/span>/) || [])[1]),
        ship: [...((h.match(/<div class="detail03">([\s\S]*?)<\/div>/) || ['', ''])[1]).matchAll(/<span[^>]*>([^<]+)<\/span>/g)].map((m) => m[1]),
        soldOut: /ただいま品切れ中です/.test(h),
        classLabels: labels, class1, classes, note, free,
        options: opts, optionValues: optValues,
        description: desc.trim(), images,
      });
      took++;
      console.log(id, name, products[products.length - 1].price, images.length, 'img', labels.join(','), opts.join(','));
    }
  }
  const out = { fetched: new Date().toISOString().slice(0, 10), source: BASE, categories: cats, products };
  fs.writeFileSync(path.join(__dirname, 'shop-data.json'), JSON.stringify(out, null, 1));
  console.log('products', products.length);
})().catch((e) => { console.error(e); process.exit(1); });
