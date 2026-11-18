/*
 * cagiana.jp's public data for the local EC-CUBE 3 copy (the source of the migration) — public pages only, no login.
 *
 *   node tools/snapshots/ec-cagiana-migration/scrape-shop.js     → shop-data.json + img/ (the product pictures, as on the live site)
 *
 * Reads: /ec (INFORMATION → news), the drawer menu (the category tree with the live ids), /products/list pages, and each
 * chosen product's page (name, maker, product code, price incl. tax, description as stored (nl2br undone), pictures in
 * /html/upload/save_image, the breadcrumb's categories, eccube.classCategories → 規格).
 */
const fs = require('fs');
const path = require('path');
const LIVE = 'https://cagiana.jp';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' };
const OUT = path.join(__dirname, 'shop-data.json');
const IMG = path.join(__dirname, 'img');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p) => { const r = await fetch(LIVE + p, { headers: UA }); if (!r.ok) throw new Error(p + ' ' + r.status); await wait(250); return r.text(); };
const text = (h) => h.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').trim();

(async () => {
  // ---- the category tree (drawer menu): parents with "#" have no public id → numbered 1… (the EC-CUBE ids of a fresh 3.0 install, reused by the shop)
  const ec = await get('/ec');
  const drawer = ec.slice(ec.indexOf('<ul class="category_area">'), ec.indexOf('<ul class="guide_area">'));
  const categories = [];
  const home0 = await get('/');
  let synth = 1;
  const used = new Set([...(ec + home0).matchAll(/category_id=(\d+)/g)].map((m) => +m[1]));
  const nextId = () => { while (used.has(synth)) synth++; used.add(synth); return synth; };
  for (const li of drawer.split('<li class="category_leader">').slice(1)) {
    const head = /<a href="([^"]+)"[^>]*>(?:<img[^>]*>)?([^<]+)<\/a>/.exec(li);
    const idm = /category_id=(\d+)/.exec(head[1]);
    const name = head[2].trim();
    if (name === '全商品一覧') continue;
    const top = { id: idm ? +idm[1] : nextId(), name, children: [] };
    for (const m of li.matchAll(/<li class="category_branch">\s*<a href="[^"]*category_id=(\d+)"[^>]*>(?:<img[^>]*>)?([^<]+)<\/a>/g)) top.children.push({ id: +m[1], name: m[2].trim() });
    if (!categories.some((c) => c.id === top.id)) categories.push(top);
  }
  // the search panel's groups (Color / Material / Price) — their parents have no public id either
  const home = await get('/');
  for (const grp of ['Color', 'Material', 'Price']) {
    const i = home.indexOf(`>${grp}<`);
    if (i < 0) continue;
    const seg = home.slice(i, home.indexOf('</ul>', i));
    const top = { id: nextId(), name: grp, children: [] };
    for (const m of seg.matchAll(/category_id=(\d+)"[^>]*>([^<]+)</g)) top.children.push({ id: +m[1], name: m[2].trim() });
    categories.push(top);
  }

  // ---- news: the INFORMATION block of /ec (the visible items, newest first)
  const info = ec.slice(ec.indexOf('<h2>INFORMATION</h2>'));
  const visible = info.slice(0, info.indexOf('<!--'));
  const news = [...visible.matchAll(/<h4>([\s\S]*?)<\/h4>\s*<p class="text">([\s\S]*?)<\/p>\s*<a href="\s*([^"]+)"/g)].map((m) => ({ title: text(m[1]).replace(/^◆/, ''), text: text(m[2]), url: m[3].trim() }));

  // ---- products: the first page of all products + shoe care, bags, belts
  const ids = [];
  const listIds = (h) => [...h.matchAll(/id="result_list_box--(\d+)"/g)].map((m) => +m[1]);
  ids.push(...listIds(await get('/products/list')), ...listIds(await get('/products/list?pageno=2')));
  const listCat = {};
  for (const [cat, n] of [[6, 3], [359, 2], [360, 1]]) for (const id of listIds(await get('/products/list?category_id=' + cat)).slice(0, n)) { listCat[id] = cat; if (!ids.includes(id)) ids.push(id); }
  const products = [];
  fs.mkdirSync(IMG, { recursive: true });
  for (const id of ids) {
    const h = await get('/products/detail/' + id);
    const name = text((/id="detail_description_box__name"[^>]*>([\s\S]*?)<\/h1>/.exec(h) || [])[1] || '');
    const code = text((/id="item_code_default">([\s\S]*?)<\/span>/.exec(h) || [])[1] || '').replace(/\s+/g, ' ');
    const price = +((/class="price02_default">\s*¥\s*([\d,]+)/.exec(h) || [])[1] || '0').replace(/,/g, '');
    const maker = text((/class="plugin_maker_code">\s*<p class="item_code">([\s\S]*?)<\/p>/.exec(h) || [])[1] || '');
    let desc = (/class="item_comment">([\s\S]*?)<\/p>\s*<!--▼商品タグ-->/.exec(h) || [])[1] || '';
    desc = desc.replace(/<button class="category-button[\s\S]*?<\/button>\s*$/, '').replace(/<br \/>\r?\n/g, '\n').replace(/<br \/>/g, '\n').trim();
    const thumbs = h.slice(h.indexOf('id="thumbnail-list"'), h.indexOf('</ul>', h.indexOf('id="thumbnail-list"')));
    let images = [...thumbs.matchAll(/src="\/html\/upload\/save_image\/([^"]+)"/g)].map((m) => m[1]);
    if (!images.length) images = [...h.matchAll(/src="\/html\/upload\/save_image\/([^"]+)"/g)].map((m) => m[1]).slice(0, 1);
    images = [...new Set(images)].slice(0, 4);
    const crumb = h.slice(h.indexOf('class="breadcrumb"'), h.indexOf('</ul>', h.indexOf('class="breadcrumb"')));
    let cats = [...crumb.matchAll(/category_id=(\d+)" typeof="WebPage" title="([^"]+)"/g)].map((m) => ({ id: +m[1], name: m[2] }));
    if (!cats.length) { const b = /class="category-button btn"><a href="[^"]*category_id=(\d+)">([^<]+?)\s*一覧/.exec(h); if (b) cats = [{ id: +b[1], name: b[2].trim() }]; else if (listCat[id]) cats = [{ id: listCat[id], name: '' }]; }
    const cc = /eccube\.classCategories = (\{[\s\S]*?\});\n/.exec(h);
    const classCategories = cc ? JSON.parse(cc[1]) : null;
    const sel1 = /<select[^>]*id="classcategory_id1"[\s\S]*?<\/select>/.exec(h);
    const class1 = sel1 ? [...sel1[0].matchAll(/<option value="(\d+)"[^>]*>([^<]+)<\/option>/g)].map((m) => ({ id: +m[1], name: m[2].trim() })) : [];
    const label1 = sel1 ? (class1.some((o) => /左|右|打ち|ワイド|スリム/.test(o.name)) ? 'タイプ' : 'カラー') : null;
    for (const f of images) {
      const file = path.join(IMG, f);
      if (fs.existsSync(file)) continue;
      const r = await fetch(`${LIVE}/html/upload/save_image/${f}`, { headers: UA });
      if (r.ok) fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); else console.log('image', f, r.status);
    }
    products.push({ id, name, maker, code, price, description: desc, images, categories: cats, class1, classLabel: label1, classCategories });
    console.log(id, name, price, code, `${images.length} img`, cats.map((c) => c.name).join(' / '), class1.length ? `規格 ${class1.length}` : '');
  }
  const pages = await get('/products/list');
  const total = ((/(\d+)\s*件/.exec(text(pages)) || [])[1]) || null;
  fs.writeFileSync(OUT, JSON.stringify({ capturedAt: new Date().toISOString().slice(0, 10), source: LIVE, liveVersion: (/eccube\.js\?v=([\d.]+)/.exec(ec) || [])[1], totalOnList: total, categories, news, products }, null, 1));
  console.log('categories', categories.length, '→', categories.reduce((n, c) => n + 1 + c.children.length, 0), 'news', news.length, 'products', products.length, 'live EC-CUBE', (/eccube\.js\?v=([\d.]+)/.exec(ec) || [])[1]);
})().catch((e) => { console.error(e); process.exit(1); });
