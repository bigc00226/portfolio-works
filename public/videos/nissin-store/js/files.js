/*
 * The files of the migration project shown in VS Code (C:\dev\nissin-shopify-migration), built from the captured
 * catalogue of store.nissin.com (js/site-snapshot.js → SITE_SNAPSHOT.catalog: the store's public product list).
 *
 * The makeshop side is a reconstruction for the demo: the export's column layout, the system product codes
 * (/shopdetail/<code>/), image URLs, stock counts and member data are made up. Product names, brands, categories,
 * units, prices, SKUs, the tag scheme (カテゴリー_… / サブカテゴリー_… / 配送方法_…), the 販売単位 option and the
 * collection handles are the live Shopify store's own.
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const F = {};

  /* ------------------------------------------------------------------ the catalogue as makeshop exported it */
  const FEATURED = (S.products || []).map((p) => p.handle);
  const regular = S.catalog.filter((p) => !/clearlance|_business/.test(p.h) && /^\d+$/.test(p.h) && p.h.length <= 5 && p.vs.length && p.vs[0][2] && /^1(食|袋|本|個)$/.test(p.vs[0][0]));
  regular.sort((a, b) => {
    const fa = FEATURED.indexOf(a.h), fb = FEATURED.indexOf(b.h);
    if (fa >= 0 || fb >= 0) return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb);
    return +b.h - +a.h;
  });
  const tagOf = (p, re) => { const t = p.tags.find((x) => re.test(x)); return t ? t.replace(re, '') : ''; };
  const ITEMS = regular.map((p, i) => {
    const single = p.vs[0], kase = p.vs.find((v) => /箱|ケース/.test(v[0]));
    const unit = (single[0].match(/^1(.+)$/) || [, '個'])[1];
    const n = kase ? +(kase[0].match(/\((\d+)/) || [, 0])[1] : 0;
    const stock = 60 + ((+p.h * 37) % 1900);
    return {
      sys: String(13000 + +p.h % 100000).padStart(12, '0'),
      code: p.h, name: p.t, brand: p.v,
      cat: tagOf(p, /^カテゴリー_/), sub: tagOf(p, /^サブカテゴリー_/), unit,
      price: single[1].replace(/\.0+$/, ''), sku: single[2],
      caseN: n || '', casePrice: kase ? kase[1].replace(/\.0+$/, '') : '', caseList: kase && kase[3] ? kase[3].replace(/\.0+$/, '') : '',
      stock, ship: tagOf(p, /^配送方法_/) || '宅急便',
      img: `https://makeshop-multi-images.akamaized.net/nissinstore/itemimages/${String(13000 + +p.h % 100000).padStart(12, '0')}.png`,
    };
  });
  const q = (v) => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const MS_COLS = ['システム商品コード', '独自商品コード', '商品名', 'ブランド', '大カテゴリー', '小カテゴリー', '単位', '販売価格', '品番', 'ケース入数', 'ケース販売価格', 'ケース定価', '在庫数', '配送方法', '商品画像URL'];
  const msRow = (it) => [it.sys, it.code, it.name, it.brand, it.cat, it.sub, it.unit, it.price, it.sku, it.caseN, it.casePrice, it.caseList, it.stock, it.ship, it.img].map(q).join(',');
  const PRODUCT_CSV = [MS_COLS.join(','), ...ITEMS.map(msRow)].join('\n');

  /** Shift_JIS read as UTF-8: every double-byte character comes out as replacement characters */
  function garble(s) {
    let out = '';
    for (const ch of s) {
      const c = ch.codePointAt(0);
      if (c < 0x80) { out += ch; continue; }
      out += c % 7 === 0 ? '\uFFFD' + String.fromCharCode(0x40 + (c % 26)) : c % 5 === 0 ? '\uFFFD\uFFFD\uFFFD' : '\uFFFD\uFFFD';
    }
    return out;
  }

  /* ------------------------------------------------------------------ what the conversion produces */
  const SH_COLS = ['Handle', 'Title', 'Vendor', 'Tags', 'Published', 'Status', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price', 'Variant Compare At Price',
    'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Requires Shipping', 'Variant Taxable', 'Image Src'];
  const DEF = { Published: 'TRUE', Status: 'active', 'Variant Inventory Tracker': 'shopify', 'Variant Inventory Policy': 'deny', 'Variant Requires Shipping': 'TRUE', 'Variant Taxable': 'TRUE' };
  function convert(items, broken) {
    const out = [];
    for (const it of items) {
      const r = broken ? {} : { '独自商品コード': it.code, '商品名': it.name, 'ブランド': it.brand, '大カテゴリー': it.cat, '小カテゴリー': it.sub, '単位': it.unit, '販売価格': it.price, '品番': it.sku, 'ケース入数': it.caseN, 'ケース販売価格': it.casePrice, 'ケース定価': it.caseList, '在庫数': it.stock, '配送方法': it.ship, '商品画像URL': it.img };
      const tags = [`カテゴリー_${r['大カテゴリー']}`, `サブカテゴリー_${r['小カテゴリー']}`, `配送方法_${r['配送方法']}`, '販売方法_通常購入'];
      const base = { Handle: r['独自商品コード'], 'Option1 Name': '販売単位', ...DEF };
      out.push({ ...base, Title: r['商品名'], Vendor: r['ブランド'], Tags: tags.join(', '), 'Option1 Value': `1${r['単位']}`, 'Variant SKU': r['品番'], 'Variant Price': r['販売価格'], 'Variant Inventory Qty': r['在庫数'], 'Image Src': r['商品画像URL'] });
      if (r['ケース入数']) out.push({ ...base, 'Option1 Value': `1箱(${r['ケース入数']}${r['単位']}入)`, 'Variant SKU': `${r['品番']}-c`, 'Variant Price': r['ケース販売価格'], 'Variant Compare At Price': r['ケース定価'], 'Variant Inventory Qty': Math.floor(r['在庫数'] / r['ケース入数']) });
    }
    return out;
  }
  const csvOf = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c] === undefined ? '' : r[c])).join(','))].join('\n');
  const OUT_OK = convert(ITEMS, false);
  // the first run: the header came out garbled, so every r['…'] was undefined (empty cells, "undefined" in templates)
  const OUT_BAD = convert(ITEMS, true);
  const PRODUCTS_SHOPIFY_BAD = csvOf(OUT_BAD, SH_COLS);

  /* ------------------------------------------------------------------ scripts */
  F['package.json'] = JSON.stringify({ name: 'nissin-shopify-migration', private: true, type: 'module', scripts: { products: 'node scripts/convert-products.mjs', customers: 'node scripts/convert-customers.mjs', redirects: 'node scripts/build-redirects.mjs', check: 'node scripts/check-redirects.mjs' }, dependencies: { 'iconv-lite': '^0.6.3' } }, null, 2);
  F['README.md'] = [
    '# store.nissin.com — makeshop → Shopify 移行',
    '',
    '1. makeshop の管理画面から商品・会員の CSV（Shift_JIS）を書き出して `data/makeshop/` に置く',
    '2. `npm run products` / `npm run customers` → `data/shopify/` に Shopify 形式の CSV',
    '3. Shopify 管理画面の「インポート」で取り込む（商品 → 顧客）',
    '4. `npm run redirects` → URL リダイレクトの CSV（旧 /shopdetail/… → /products/…）',
    '5. `npm run check` で Search Console の上位 URL が 301 で転送されるか確認',
    '6. テーマは `theme/`（Prestige）— `shopify theme dev --path theme`',
  ].join('\n');
  F['.gitignore'] = 'node_modules/\ndata/makeshop/\ndata/shopify/\n.env';
  F['scripts/lib/csv.mjs'] = [
    '// 最小限の CSV 読み書き（ダブルクォート・カンマ・改行を含む値に対応）',
    'export function parse(text) {',
    '  const rows = [];',
    '  let row = [], cell = \'\', q = false;',
    '  for (let i = 0; i < text.length; i++) {',
    '    const c = text[i];',
    '    if (q) { if (c === \'"\' && text[i + 1] === \'"\') { cell += \'"\'; i++; } else if (c === \'"\') q = false; else cell += c; }',
    '    else if (c === \'"\') q = true;',
    '    else if (c === \',\') { row.push(cell); cell = \'\'; }',
    '    else if (c === \'\\n\' || c === \'\\r\') { if (c === \'\\r\' && text[i + 1] === \'\\n\') i++; row.push(cell); rows.push(row); row = []; cell = \'\'; }',
    '    else cell += c;',
    '  }',
    '  if (cell || row.length) { row.push(cell); rows.push(row); }',
    '  const [head, ...body] = rows;',
    '  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? \'\'])));',
    '}',
    '',
    'const esc = (v) => (/[",\\n]/.test(String(v ?? \'\')) ? `"${String(v).replace(/"/g, \'""\')}"` : String(v ?? \'\'));',
    'export function stringify(rows, columns) {',
    '  return [columns.join(\',\'), ...rows.map((r) => columns.map((c) => esc(r[c])).join(\',\'))].join(\'\\n\');',
    '}',
  ].join('\n');

  const CONVERT_HEAD = [
    '// makeshop の商品 CSV（Shift_JIS）→ Shopify の商品 CSV（UTF-8・バリエーションごとに 1 行）',
    'import fs from \'node:fs\';',
    'import iconv from \'iconv-lite\';',
    'import { parse, stringify } from \'./lib/csv.mjs\';',
    '',
    'const SRC = \'data/makeshop/product_20261102.csv\';',
    'const OUT = \'data/shopify/products_shopify.csv\';',
    'const COLUMNS = [\'Handle\', \'Title\', \'Vendor\', \'Tags\', \'Published\', \'Status\', \'Option1 Name\', \'Option1 Value\',',
    '  \'Variant SKU\', \'Variant Price\', \'Variant Compare At Price\', \'Variant Inventory Tracker\', \'Variant Inventory Qty\',',
    '  \'Variant Inventory Policy\', \'Variant Requires Shipping\', \'Variant Taxable\', \'Image Src\'];',
    '// makeshop のカテゴリー → 接頭辞付きのタグ（ストアの絞り込み・自動コレクションの条件に使う）',
    'const TAG_COLUMNS = [[\'カテゴリー\', \'大カテゴリー\'], [\'サブカテゴリー\', \'小カテゴリー\'], [\'配送方法\', \'配送方法\']];',
    'const DEFAULTS = {',
    '  Published: \'TRUE\', Status: \'active\',',
    '  \'Variant Inventory Tracker\': \'shopify\', \'Variant Inventory Policy\': \'deny\',',
    '  \'Variant Requires Shipping\': \'TRUE\', \'Variant Taxable\': \'TRUE\',',
    '};',
    '',
    'const rows = parse(fs.readFileSync(SRC, \'utf8\'));',
    'const out = [];',
    '',
  ];
  const CONVERT_TAIL = [
    '',
    'fs.writeFileSync(OUT, stringify(out, COLUMNS));',
    'console.log(`${rows.length} 商品 → ${out.length} 行（${OUT}）`);',
  ];
  /** the loop typed in the video (lines with their indentation) */
  const CONVERT_LOOP = [
    'for (const r of rows) {',
    '  const tags = [...TAG_COLUMNS.map(([p, c]) => `${p}_${r[c]}`), \'販売方法_通常購入\'];',
    '  const base = { Handle: r[\'独自商品コード\'], \'Option1 Name\': \'販売単位\', ...DEFAULTS };',
    '  // 単品の行：商品の情報はこの 1 行目に入れる',
    '  out.push({ ...base, Title: r[\'商品名\'], Vendor: r[\'ブランド\'], Tags: tags.join(\', \'),',
    '    \'Option1 Value\': `1${r[\'単位\']}`, \'Variant SKU\': r[\'品番\'], \'Variant Price\': r[\'販売価格\'],',
    '    \'Variant Inventory Qty\': r[\'在庫数\'], \'Image Src\': r[\'商品画像URL\'] });',
    '  // ケース販売は同じハンドルの 2 行目（バリエーション）にする',
    '  if (r[\'ケース入数\']) {',
    '    out.push({ ...base, \'Option1 Value\': `1箱(${r[\'ケース入数\']}${r[\'単位\']}入)`, \'Variant SKU\': `${r[\'品番\']}-c`,',
    '      \'Variant Price\': r[\'ケース販売価格\'], \'Variant Compare At Price\': r[\'ケース定価\'],',
    '      \'Variant Inventory Qty\': Math.floor(r[\'在庫数\'] / r[\'ケース入数\']) });',
    '  }',
    '}',
  ];
  F['scripts/convert-products.mjs'] = [...CONVERT_HEAD, '// TODO: makeshop の 1 商品 → Shopify の行', ...CONVERT_TAIL].join('\n');
  const CONVERT_FINAL = [...CONVERT_HEAD, ...CONVERT_LOOP, ...CONVERT_TAIL].join('\n').replace("parse(fs.readFileSync(SRC, 'utf8'))", "parse(iconv.decode(fs.readFileSync(SRC), 'Shift_JIS'))");

  F['scripts/lib/jp.mjs'] = [
    '// 都道府県 → ISO 3166-2:JP の地域コード、電話番号 → E.164',
    'export const PREF = { 北海道: \'JP-01\', 青森県: \'JP-02\', 岩手県: \'JP-03\', /* … */ 東京都: \'JP-13\', 神奈川県: \'JP-14\', 大阪府: \'JP-27\', 沖縄県: \'JP-47\' };',
    'export const toE164 = (tel) => (tel ? \'+81\' + tel.replace(/[^0-9]/g, \'\').replace(/^0/, \'\') : \'\');',
  ].join('\n');
  F['scripts/convert-customers.mjs'] = [
    '// makeshop の会員 CSV（Shift_JIS）→ Shopify の顧客 CSV',
    'import fs from \'node:fs\';',
    'import iconv from \'iconv-lite\';',
    'import { parse, stringify } from \'./lib/csv.mjs\';',
    'import { PREF, toE164 } from \'./lib/jp.mjs\';',
    '',
    'const rows = parse(iconv.decode(fs.readFileSync(\'data/makeshop/member_20261102.csv\'), \'Shift_JIS\'));',
    'const COLUMNS = [\'First Name\', \'Last Name\', \'Email\', \'Accepts Email Marketing\', \'Phone\', \'Accepts SMS Marketing\',',
    '  \'Default Address Zip\', \'Default Address Province Code\', \'Default Address City\', \'Default Address Address1\', \'Tags\', \'Note\'];',
    '',
    'const out = rows',
    '  .filter((r) => r[\'退会\'] !== \'1\' && r[\'メールアドレス\'])',
    '  .map((r) => ({',
    '    \'First Name\': r[\'名\'], \'Last Name\': r[\'姓\'], Email: r[\'メールアドレス\'].trim().toLowerCase(),',
    '    \'Accepts Email Marketing\': r[\'メルマガ購読\'] === \'1\' ? \'yes\' : \'no\',',
    '    Phone: toE164(r[\'電話番号\']), \'Accepts SMS Marketing\': \'no\',',
    '    \'Default Address Zip\': r[\'郵便番号\'], \'Default Address Province Code\': PREF[r[\'都道府県\']],',
    '    \'Default Address City\': r[\'市区町村\'], \'Default Address Address1\': r[\'住所\'],',
    '    // 会員ランクはタグに（Shopify の顧客セグメントで使う）',
    '    Tags: [\'makeshop移行\', `会員ランク_${r[\'会員グループ\']}`].join(\', \'),',
    '    Note: `makeshop 会員ID: ${r[\'会員ID\']} / 登録日: ${r[\'登録日\']}`,',
    '  }));',
    '',
    'fs.writeFileSync(\'data/shopify/customers_shopify.csv\', stringify(out, COLUMNS));',
    'console.log(`${rows.length} 件 → ${out.length} 件（退会・メールアドレスなしを除外）`);',
  ].join('\n');

  /* ------------------------------------------------------------------ redirects */
  const CATS = { ct11: 'cupmen', ct12: 'hukuromen', ct13: 'cuprice', ct14: 'soup', ct15: 'kanzendry', ct16: 'delikanzenmeshi', ct17: 'cerealgranola', ct18: 'sweets', ct19: 'set', ct20: 'store-limited', ct21: 'region-limited', ct22: 'goods', ct23: 'kids', ct24: 'subscription' };
  F['data/category-map.json'] = JSON.stringify(CATS, null, 2);
  const REDIRECT_HEAD = [
    '// makeshop の旧 URL → Shopify の URL（管理画面の「URL リダイレクト」にインポートする CSV）',
    'import fs from \'node:fs\';',
    'import iconv from \'iconv-lite\';',
    'import { parse, stringify } from \'./lib/csv.mjs\';',
    'import CATEGORY_MAP from \'../data/category-map.json\' with { type: \'json\' };',
    '',
    'const rows = parse(iconv.decode(fs.readFileSync(\'data/makeshop/product_20261102.csv\'), \'Shift_JIS\'));',
    'const out = [];',
    '',
  ];
  const REDIRECT_TAIL = [
    '',
    'fs.writeFileSync(\'data/shopify/redirects.csv\', stringify(out, [\'Redirect from\', \'Redirect to\']));',
    'console.log(`商品 ${rows.length} 件・カテゴリー ${Object.keys(CATEGORY_MAP).length} 件 → ${out.length} 件`);',
  ];
  const REDIRECT_LOOP = [
    'for (const r of rows) {',
    '  out.push({ \'Redirect from\': `/shopdetail/${r[\'システム商品コード\']}/`, \'Redirect to\': `/products/${r[\'独自商品コード\']}` });',
    '}',
    'for (const [ct, handle] of Object.entries(CATEGORY_MAP)) {',
    '  out.push({ \'Redirect from\': `/shopbrand/${ct}/`, \'Redirect to\': `/collections/${handle}` });',
    '}',
  ];
  F['scripts/build-redirects.mjs'] = [...REDIRECT_HEAD, '// TODO', ...REDIRECT_TAIL].join('\n');
  F['scripts/check-redirects.mjs'] = [
    '// Search Console の上位ページ（旧 URL）にアクセスして、301 で正しい URL に転送されるか確認する',
    'import fs from \'node:fs\';',
    '',
    'const BASE = \'https://store-nissin.myshopify.com\';',
    'const urls = fs.readFileSync(\'data/makeshop/top_pages.txt\', \'utf8\').split(\'\\n\').filter(Boolean);',
    'let ng = 0;',
    'for (const u of urls) {',
    '  const res = await fetch(BASE + u, { redirect: \'manual\' });',
    '  const to = (res.headers.get(\'location\') ?? \'\').replace(BASE, \'\');',
    '  if (res.status !== 301) ng++;',
    '  console.log(res.status === 301 ? \'✔\' : \'✖\', res.status, u, to && `→ ${to}`);',
    '}',
    'console.log(ng ? `${ng} 件が転送されていません` : `すべて転送されました（${urls.length} 件）`);',
  ].join('\n');

  /* top pages from Search Console: mostly /shopdetail/, a few creator-mode /view/item/ URLs */
  const TOP = ITEMS.slice(0, 8);
  const TOP_PAGES = [
    '/', `/shopdetail/${TOP[0].sys}/`, `/shopbrand/ct11/`, `/shopdetail/${TOP[1].sys}/`, `/view/item/${TOP[0].sys}`, `/shopdetail/${TOP[2].sys}/`,
    `/shopbrand/ct15/`, `/shopdetail/${TOP[3].sys}/`, `/view/item/${TOP[4].sys}`, `/shopdetail/${TOP[5].sys}/`,
  ];
  F['data/makeshop/top_pages.txt'] = TOP_PAGES.join('\n');
  F['data/makeshop/product_20261102.csv'] = garble(PRODUCT_CSV);
  F['data/makeshop/member_20261102.csv'] = garble('会員ID,姓,名,メールアドレス,電話番号,郵便番号,都道府県,市区町村,住所,会員グループ,メルマガ購読,登録日,退会');
  F['data/shopify/.gitkeep'] = '';

  /* ------------------------------------------------------------------ theme (Prestige) */
  F['theme/layout/theme.liquid'] = '<!doctype html>\n<html class="no-js" lang="{{ request.locale.iso_code }}">\n  <head>\n    {{ content_for_header }}\n  </head>\n  <body class="prestige--v4 template-{{ template.name }}">\n    {% sections \'header-group\' %}\n    {{ content_for_layout }}\n    {% sections \'footer-group\' %}\n  </body>\n</html>';
  F['theme/sections/featured-collection.liquid'] = '{%- comment -%} 新商品・ランキングなど、トップページの商品カルーセル {%- endcomment -%}\n<section class="Section" id="section-{{ section.id }}">\n  {%- for product in section.settings.collection.products limit: section.settings.limit -%}\n    {%- render \'product-item\', product: product -%}\n  {%- endfor -%}\n</section>';
  F['theme/snippets/product-item.liquid'] = [
    '<div class="ProductItem">',
    '  <div class="ProductItem__Wrapper">',
    '    <a href="{{ product.url }}" class="ProductItem__ImageWrapper">',
    '      {{ product.featured_media | image_url: width: 600 | image_tag: class: \'ProductItem__Image\', loading: \'lazy\' }}',
    '    </a>',
    '    <div class="ProductItem__Info">',
    '      <h2 class="ProductItem__Title Heading"><a href="{{ product.url }}">{{ product.title }}</a></h2>',
    '      {%- render \'revico-star\', product: product -%}',
    '    </div>',
    '    <div class="ProductItem__Bottom">',
    '    </div>',
    '  </div>',
    '</div>',
  ].join('\n');
  const FORM_HEAD = [
    '{%- comment -%}',
    '  商品カード：販売単位（1食・1箱）を選んで、その場でカートに入れる',
    '  価格は税込で登録（移行元の販売価格のまま）。税抜はここで計算して表示する',
    '{%- endcomment -%}',
    '{%- assign tax = 1.08 -%}',
    '{%- assign v = product.selected_or_first_available_variant -%}',
  ];
  const FORM_BODY = (ex, inc) => [
    '<div class="ProductItem__Form ProductItem__Form-{{ product.id }}">',
    '  <div class="ProductItem__PriceList">',
    `    <div class="ProductItem__PriceWithoutTax"><span class="Price">${ex}</span></div>`,
    `    <div class="ProductItem__PriceTaxIn"><span class="Price">${inc}</span></div>`,
    '  </div>',
    '  <select name="id" class="ProductItem__FormVariant">',
    '    {%- for variant in product.variants -%}',
    '      <option value="{{ variant.id }}" data-product_tax="{{ tax }}"{% if variant == v %} selected{% endif %}>{{ variant.title }}</option>',
    '    {%- endfor -%}',
    '  </select>',
    '  <div class="ProductItem__FormBottom">',
    '    <select name="quantity" class="ProductItem__FormQuantity">',
    '      {%- for i in (1..10) -%}<option value="{{ i }}">{{ i }}</option>{%- endfor -%}',
    '    </select>',
    '    <button type="submit" class="ProductItem__FormSubmit">カートに入れる</button>',
    '  </div>',
    '</div>',
  ];
  const EX_BAD = '{{ v.price | money_without_trailing_zeros }}';
  const INC_BAD = '{{ v.price | times: tax | money_without_trailing_zeros }}';
  const EX_OK = '¥{{ v.price | divided_by: 100.0 | divided_by: tax | ceil }}';
  const INC_OK = '{{ v.price | money_without_trailing_zeros }}';
  F['theme/config/settings_data.json'] = JSON.stringify({ current: { currency_code_enabled: false, product_show_price_on_hover: false, product_image_size: 'square' } }, null, 2);
  F['theme/shopify.theme.toml'] = '[environments.production]\nstore = "store-nissin"\npath = "theme"';

  window.FILES = {
    files: F,
    ITEMS, PRODUCT_CSV, garble, MS_COLS, SH_COLS, OUT_OK, OUT_BAD,
    PRODUCTS_SHOPIFY: csvOf(OUT_OK, SH_COLS), PRODUCTS_SHOPIFY_BAD,
    CONVERT_LOOP, CONVERT_FINAL, REDIRECT_LOOP, REDIRECT_HEAD, REDIRECT_TAIL, TOP_PAGES, CATS,
    REDIRECTS: (o = {}) => {
      const rows = [];
      for (const it of ITEMS) {
        rows.push([`/shopdetail/${it.sys}/`, `/products/${it.code}`]);
        if (o.viewItem) rows.push([`/view/item/${it.sys}`, `/products/${it.code}`]);
      }
      for (const [ct, h] of Object.entries(CATS)) rows.push([`/shopbrand/${ct}/`, `/collections/${h}`]);
      return rows;
    },
    FORM_HEAD, FORM_BODY, EX_BAD, INC_BAD, EX_OK, INC_OK,
    FORM_FINAL: [...FORM_HEAD, ...FORM_BODY(EX_OK, INC_OK)].join('\n'),
  };
})();
