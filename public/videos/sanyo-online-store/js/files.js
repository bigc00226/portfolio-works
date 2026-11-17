/*
 * The theme repository shown in VS Code (C:\dev\sanyo-online-store-theme) and the data of the admin screens,
 * built from the captured store (js/site-snapshot.js).
 *
 * From the live store: the product cards of the skirt list (brand, title, price, image), the brand codes in the
 * vendor field (= the number at the start of every product image file, e.g. 2321-M5S2281302.jpg → EPOCA), the filter
 * sidebar (販売タイプ / 性別 / ブランド / カテゴリ / カラー / サイズ / 柄 / 在庫), the product page with
 * 「店舗在庫確認・試着申し込み」, the number of products (about 19,400, from the public product list).
 * Made up for the demo: the theme source files (minimal, with the live store's class names), the search / speed
 * figures of the analytics, the store locations and their stock, the scripts. (The Lighthouse reports are a real run
 * with the story's metrics: js/lighthouse-data.js.)
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const F = {};

  /* ------------------------------------------------------------------ the live skirt list (brand, title, price, image) */
  const doc = new DOMParser().parseFromString(S.pages.collection.pc, 'text/html');
  const seen = new Set();
  const ITEMS = [];
  doc.querySelectorAll('.products-card__content').forEach((c) => {
    const link = c.querySelector('a.products-card__link');
    const img = c.querySelector('img.products-card__image');
    if (!link || !img) return;
    const handle = (link.getAttribute('href').match(/\/products\/([^?]+)/) || [])[1];
    if (!handle || seen.has(handle)) return;
    seen.add(handle);
    const src = img.getAttribute('src');
    ITEMS.push({
      handle, img: src,
      brand: (c.querySelector('.products-card__vendor') || {}).textContent.trim(),
      title: (c.querySelector('.products-card__title') || {}).textContent.trim(),
      price: +((c.querySelector('.products-card__price') || {}).textContent || '0').replace(/[^\d]/g, ''),
      vendor: (src.match(/files\/(\d{4})-/) || [])[1] || '',
    });
  });
  /** brand code (vendor) → brand name: the codes seen in the captured list + a few more lines of the same brands */
  const BRANDS = {};
  ITEMS.forEach((it) => { if (it.vendor) BRANDS[it.vendor] = it.brand; });
  Object.assign(BRANDS, { 1311: 'MACKINTOSH LONDON', 2341: 'CAST:', 2362: 'TO BE CHIC', 3701: 'Paul Stuart' });
  const BRAND_CODES = Object.keys(BRANDS).sort();
  const CODE_OF = {};
  ITEMS.forEach((it) => { CODE_OF[it.brand] = it.vendor; });
  const TOTAL = 19391;

  /* ------------------------------------------------------------------ analytics (made up for the demo) */
  const NO_RESULT = [['マッキントッシュ スカート', 1284], ['店舗 在庫', 1106], ['ポールスチュアート ニット', 962], ['エポカ ワンピース', 731], ['取り置き', 655], ['トゥービーシック コート', 498], ['アマカ ブラウス', 431]]
    .map(([q, n]) => [q, n, Math.round((n / 1284) * 150)]);

  /* ------------------------------------------------------------------ locations (made up) */
  const LOCATIONS = [
    { id: 'wh', name: 'EC 物流センター', addr: '千葉県', store: false, def: true },
    { id: 'ginza', name: '銀座店', addr: '東京都中央区', store: true },
    { id: 'nihonbashi', name: '日本橋店', addr: '東京都中央区', store: true },
    { id: 'shinjuku', name: '新宿店', addr: '東京都新宿区', store: true },
    { id: 'yokohama', name: '横浜店', addr: '神奈川県横浜市', store: true },
    { id: 'nagoya', name: '名古屋店', addr: '愛知県名古屋市', store: true },
    { id: 'umeda', name: 'うめだ店', addr: '大阪府大阪市', store: true },
  ];
  const PICKUP_TIME = 'お取り置き：通常 2〜4 日';
  /** stock of the shown variant at each pickup location (the warehouse only while its pickup is on) */
  const STORE_STOCK = [['銀座店', true], ['日本橋店', false], ['新宿店', true], ['横浜店', true], ['名古屋店', false], ['うめだ店', true]];

  /* ------------------------------------------------------------------ theme files */
  F['shopify.theme.toml'] = '[environments.development]\nstore = "sanyo-online-store"\n\n[environments.production]\nstore = "sanyo-online-store"\ntheme = "146495635768"';
  F['package.json'] = JSON.stringify({ name: 'sanyo-online-store-theme', private: true, type: 'module', scripts: { dev: 'shopify theme dev --store sanyo-online-store', 'set-brand': 'node scripts/set-brand-metafield.mjs' } }, null, 2);
  F['.gitignore'] = 'node_modules/\n.env\n.shopify/';
  F['.env'] = 'SHOPIFY_STORE=sanyo-online-store.myshopify.com\nSHOPIFY_ADMIN_TOKEN=shpat_••••••••••••••••••••••••••••';
  F['docs/improvements-2026-08.md'] = [
    '# 2026-08 改善（SANYO ONLINE STORE）',
    '',
    '## 1. ブランド横断の絞り込み',
    '- 検索「結果なし」の上位はブランド名（マッキントッシュ、ポールスチュアート…）',
    '- vendor はブランドコード（2301・2321 など）→ メタフィールド `custom.brand` に表示名を持たせる',
    '- Search & Discovery のフィルター「ブランド」、商品カードにブランド名',
    '',
    '## 2. 店舗在庫の表示（OMO）',
    '- 「店舗 在庫」「取り置き」での検索が多い',
    '- 店舗のロケーションでローカルピックアップを有効化 → `variant.store_availabilities`',
    '- 商品ページに「店舗在庫確認・試着申し込み」',
    '',
    '## 3. 商品ページの表示速度（モバイル）',
  ].join('\n');
  F['config/settings_data.json'] = JSON.stringify({ current: { type_header_font: 'noto_sans_japanese_n5', page_width: 1100, card_image_ratio: 'portrait' } }, null, 2);
  F['assets/base.css'] = ':root { --font-body: "Noto Sans JP", sans-serif; --color-text: #202124; }\n.productDetail__button { display: block; width: 100%; height: 44px; }';
  F['assets/global.js'] = "// Dawn 7.0.1 global.js（カート・モーダル・バリエーション選択）\nclass ModalDialog extends HTMLElement { /* … */ }";
  F['assets/legacy-review-widget.js'] = '/*! review widget v2.3.1 (2021) */!function(e){var t={};function n(r){if(t[r])return t[r].exports;/* … 412 KiB … */}}';
  F['assets/chat-support-v1.js'] = '/*! chat support v1.8.0 */(function(){var w=window;w.__chat=w.__chat||{};/* … 186 KiB … */})();';
  F['layout/theme.liquid'] = [
    '<!doctype html>',
    '<html class="no-js" lang="{{ request.locale.iso_code }}">',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width,initial-scale=1">',
    '    <title>{{ page_title }}｜SANYO ONLINE STORE</title>',
    '    {{ content_for_header }}',
    "    {{ 'base.css' | asset_url | stylesheet_tag }}",
    "    {{ 'header-pc.css' | asset_url | stylesheet_tag }}",
    "    {{ 'header-sp.css' | asset_url | stylesheet_tag }}",
    "    {{ 'legacy-review-widget.js' | asset_url | script_tag }}",
    "    <script src=\"{{ 'chat-support-v1.js' | asset_url }}\"></script>",
    "    <script src=\"{{ 'global.js' | asset_url }}\" defer=\"defer\"></script>",
    '  </head>',
    '  <body class="template-{{ template.name }}">',
    "    {% sections 'header-group' %}",
    '    <main id="MainContent" role="main">{{ content_for_layout }}</main>',
    "    {% sections 'footer-group' %}",
    '  </body>',
    '</html>',
  ].join('\n');

  // the filter column: the theme only shows the filters on this list (and in this order)
  const SHOWN_BEFORE = "{%- assign shown = 'filter.p.m.custom.sale_type,filter.p.m.custom.gender,filter.p.m.custom.category,filter.v.option.カラー,filter.v.option.サイズ,filter.p.m.custom.pattern,filter.v.availability' | split: ',' -%}";
  const BRAND_PARAM = 'filter.p.m.custom.brand,';
  F['snippets/facets.liquid'] = [
    '{%- comment -%} 商品一覧の絞り込み（PC は左カラム・SP はドロワー） {%- endcomment -%}',
    SHOWN_BEFORE,
    '<div class="productsPage__filter displayPc">',
    '  {%- for param in shown -%}',
    "    {%- assign filter = results.filters | where: 'param_name', param | first -%}",
    '    {%- if filter -%}',
    '      <dl id="sideBar-filter-{{ filter.label | handleize }}-section" class="productsPage__filter__section">',
    '        <dt>{{ filter.label }}</dt>',
    '        {%- for value in filter.values -%}',
    "          {%- render 'facet-value', value: value, filter: filter -%}",
    '        {%- endfor -%}',
    '      </dl>',
    '    {%- endif -%}',
    '  {%- endfor -%}',
    '</div>',
  ].join('\n');
  const VENDOR_BEFORE = 'card_product.vendor';
  const VENDOR_AFTER = 'card_product.metafields.custom.brand | default: card_product.vendor';
  F['snippets/card-product.liquid'] = [
    '<div class="products-card__content" data-handle="{{ card_product.selected_or_first_available_variant.sku }}">',
    '  <a href="{{ card_product.url }}" class="products-card__image__link">',
    "    {{ card_product.featured_image | image_url: width: 300 | image_tag: class: 'products-card__image', loading: 'lazy' }}",
    '  </a>',
    '  <a href="{{ card_product.url }}" class="products-card__link">',
    '    <!-- ブランド名 -->',
    `    <p class="products-card__vendor fz--product---brandName fw700">{{ ${VENDOR_BEFORE} }}</p>`,
    '    <!-- アイテム名 -->',
    '    <p class="products-card__title fz--product--title">{{ card_product.title }}</p>',
    "    {%- render 'card-price', product: card_product -%}",
    '  </a>',
    '</div>',
  ].join('\n');
  F['sections/main-collection-product-grid.liquid'] = [
    '<div class="productsPage">',
    "  {%- render 'facets', results: collection -%}",
    '  <ul class="products-card__list">',
    '    {%- for product in collection.products -%}',
    "      <li>{%- render 'card-product', card_product: product -%}</li>",
    '    {%- endfor -%}',
    '  </ul>',
    '</div>',
  ].join('\n');
  F['sections/main-product.liquid'] = [
    '<div class="product-container left-container">',
    "  {%- render 'product-media', product: product -%}",
    '</div>',
    '<div class="product-container right-container">',
    '  <h1 class="productDetail__title">{{ product.title }}</h1>',
    "  {%- render 'product-price', product: product -%}",
    '  <!-- 商品番号 -->',
    '  <p class="productDetail__sku">商品番号 | {{ product.handle | upcase }}</p>',
    '  <p class="productDetail__caution">店舗へのお問い合わせは、こちらの品番をお伝えください。</p>',
    '  <div class="productDetail__button__wrapper">',
    "    {%- render 'product-buy-buttons', product: product -%}",
    '  </div>',
    "  {%- render 'product-variant-stock', product: product -%}",
    '</div>',
  ].join('\n');
  const RENDER_STOCK = "{%- render 'store-stock', variant: product.selected_or_first_available_variant -%}";
  /** the new snippet, typed in the video */
  const STORE_STOCK_LINES = [
    '{%- comment -%} 店舗在庫（ローカルピックアップを有効にした店舗）と、試着・取り置きの申し込み {%- endcomment -%}',
    '<a class="productDetail__stockCheck" href="#StoreStock-{{ variant.id }}" data-modal-open>',
    '  <span class="productDetail__button stockCheck">店舗在庫確認・試着申し込み</span>',
    '</a>',
    '<a href="/blogs/feature/all-try-and-pick-20230920" class="productDetail__about__fitting">試着申し込みについて</a>',
    '<dialog id="StoreStock-{{ variant.id }}" class="storeStock">',
    '  <h2 class="storeStock__title">{{ variant.title }} の店舗在庫</h2>',
    '  <ul class="storeStock__list">',
    '    {%- for store in variant.store_availabilities -%}',
    '      <li class="storeStock__item">',
    '        <span class="storeStock__name">{{ store.location.name }}</span>',
    '        {%- if store.available -%}',
    '          <span class="storeStock__ok">在庫あり</span>',
    '          <span class="storeStock__time">{{ store.pick_up_time }}</span>',
    '        {%- else -%}',
    '          <span class="storeStock__ng">在庫なし</span>',
    '        {%- endif -%}',
    '      </li>',
    '    {%- endfor -%}',
    '  </ul>',
    '  <a class="storeStock__apply" href="/pages/try-and-pick?variant={{ variant.id }}">試着・取り置きを申し込む</a>',
    '</dialog>',
  ];
  const IMG_BEFORE = '<img src="{{ media | image_url: width: 1500 }}" alt="{{ media.alt | escape }}">';
  const IMG_AFTER = "{{ media | image_url: width: 1500 | image_tag: widths: '360, 720, 1080, 1500', sizes: '(min-width: 990px) 45vw, 100vw', loading: 'lazy', alt: media.alt }}";
  const LAZY_FIX_LINE = "{%- assign loading = 'lazy' -%}{%- if forloop.first -%}{%- assign loading = 'eager' -%}{%- endif -%}";
  F['snippets/product-media.liquid'] = [
    '<div class="product-media">',
    '  {%- for media in product.media -%}',
    '    <div class="product-media__item">',
    `      ${IMG_BEFORE}`,
    '    </div>',
    '  {%- endfor -%}',
    '</div>',
  ].join('\n');
  const MEDIA_FINAL = [
    '<div class="product-media">',
    '  {%- for media in product.media -%}',
    '    <div class="product-media__item">',
    `      ${LAZY_FIX_LINE}`,
    `      ${IMG_AFTER.replace("loading: 'lazy'", 'loading: loading')}`,
    '    </div>',
    '  {%- endfor -%}',
    '</div>',
  ].join('\n');

  /* ------------------------------------------------------------------ scripts */
  F['scripts/lib/admin.mjs'] = [
    '// Admin GraphQL API（2026-07）の最小限のクライアント',
    "import 'dotenv/config';",
    'const URL = `https://${process.env.SHOPIFY_STORE}/admin/api/2026-07/graphql.json`;',
    'export async function shopify(query, variables = {}) {',
    "  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN }, body: JSON.stringify({ query, variables }) });",
    '  const { data, errors } = await res.json();',
    '  if (errors) throw new Error(JSON.stringify(errors));',
    '  return data;',
    '}',
  ].join('\n');
  F['scripts/brands.json'] = JSON.stringify(Object.fromEntries(BRAND_CODES.map((c) => [c, BRANDS[c]])), null, 2);
  const SET_HEAD = [
    '// ブランドコード（vendor）→ ブランド名を、商品メタフィールド custom.brand にまとめて設定する',
    "import { shopify } from './lib/admin.mjs';",
    "import BRANDS from './brands.json' with { type: 'json' };",
    '',
    'const PRODUCTS = `query ($cursor: String) {',
    '  products(first: 250, after: $cursor) { nodes { id vendor } pageInfo { hasNextPage endCursor } }',
    '}`;',
    'const SET = `mutation ($metafields: [MetafieldsSetInput!]!) {',
    '  metafieldsSet(metafields: $metafields) { userErrors { field message } }',
    '}`;',
    '',
    'let cursor = null, done = 0;',
    'do {',
    '  const { products } = await shopify(PRODUCTS, { cursor });',
  ];
  const SET_LOOP = [
    '  const metafields = products.nodes',
    '    .filter((p) => BRANDS[p.vendor])',
    "    .map((p) => ({ ownerId: p.id, namespace: 'custom', key: 'brand', type: 'single_line_text_field', value: BRANDS[p.vendor] }));",
    '  // metafieldsSet は一度に 25 件まで',
    '  for (let i = 0; i < metafields.length; i += 25) {',
    '    const { metafieldsSet } = await shopify(SET, { metafields: metafields.slice(i, i + 25) });',
    '    if (metafieldsSet.userErrors.length) console.error(metafieldsSet.userErrors);',
    '    done += Math.min(25, metafields.length - i);',
    '  }',
  ];
  const SET_TAIL = [
    '  cursor = products.pageInfo.hasNextPage ? products.pageInfo.endCursor : null;',
    '} while (cursor);',
    'console.log(`${done} 商品にブランドを設定しました`);',
  ];
  F['scripts/set-brand-metafield.mjs'] = [...SET_HEAD, '  // TODO', ...SET_TAIL].join('\n');
  const SET_FINAL = [...SET_HEAD, ...SET_LOOP, ...SET_TAIL].join('\n');

  // Lighthouse: the reports of scene 4 are js/lighthouse-data.js (a real run + the states of the story)

  const THEME_SHOT = ((S.pages.home.pc.match(/<img[^>]+src="(assets\/site\/cdn\.shopify\.com[^"]+\.(?:jpg|webp|png))"/) || [])[1]) || '';

  window.FILES = {
    files: F, ITEMS, BRANDS, CODE_OF, TOTAL, NO_RESULT, LOCATIONS, PICKUP_TIME, STORE_STOCK,
    SHOWN_BEFORE, BRAND_PARAM, VENDOR_BEFORE, VENDOR_AFTER, RENDER_STOCK, STORE_STOCK_LINES,
    STORE_STOCK_FINAL: STORE_STOCK_LINES.join('\n'),
    IMG_BEFORE, IMG_AFTER, LAZY_FIX_LINE, MEDIA_FINAL, SET_LOOP, SET_FINAL, THEME_SHOT,
    NEW_THEME: 'SANYO ONLINE STORE（2026-08 改善）',
    SYNONYMS: ['マッキントッシュ, MACKINTOSH LONDON, MACKINTOSH PHILOSOPHY', 'ポールスチュアート, Paul Stuart', 'エポカ, EPOCA', 'アマカ, AMACA', 'トゥービーシック, TO BE CHIC', 'トランスワーク, TRANS WORK'],
    DOC_SPEED: ['- Web パフォーマンス：LCP 4.8 秒・CLS 0.28（要改善）', '- 画像の width / height と srcset、使っていないアプリのスクリプトを削除'],
  };
})();
