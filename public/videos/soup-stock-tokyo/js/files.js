/*
 * The files of the inventory-sync project shown in VS Code (C:\dev\sst-inventory-sync), built from the captured
 * catalogue of ec.soup-stock-tokyo.com (js/site-snapshot.js → SITE_SNAPSHOT.catalog: the store's public product list).
 *
 * Real (from the live store): product / soup / curry names, SKUs (106001A, 004355S, 004346C …), product types and
 * tags (冷凍 / 常温), the soups whose variant names carry 【完売】.
 * Made up for the demo: the warehouse system (WMS) and its CSV export, item codes as the WMS stores them, stock
 * numbers, location names, the API tokens / ids and every API response.
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const F = {};

  /* ------------------------------------------------------------------ SKUs of the store */
  const clean = (t) => t.replace(/【[^】]*】/g, '').replace(/[（(][+＋][\d,]+円[)）]/g, '').replace(/\t/g, '').trim();
  const bySku = new Map();
  for (const p of S.catalog) {
    for (const [title, price, sku] of p.vs) {
      if (!sku || !/^\d{6}[ASC]$/.test(sku)) continue;
      const kind = sku.slice(-1);
      const name = kind === 'A' ? p.t : clean(title);
      const soldOut = /【完売】/.test(title);
      const cur = bySku.get(sku);
      if (cur) { cur.soldOut = cur.soldOut || soldOut; continue; }
      const ambient = kind === 'A' && (p.tags.includes('常温') || p.tags.includes('goods') || p.ty === '雑貨');
      bySku.set(sku, { sku, kind, name, title, soldOut, product: p.t, handle: p.h, wh: ambient ? 'D01' : 'F01', price });
    }
  }
  // the order the WMS exports: frozen warehouse first, by item code
  const ITEMS = [...bySku.values()].sort((a, b) => (a.wh === b.wh ? a.sku.localeCompare(b.sku) : a.wh === 'F01' ? -1 : 1));
  // stock in the warehouse (made up; the soups the store marks 【完売】 are 0)
  ITEMS.forEach((it, i) => {
    const n = +it.sku.slice(0, 6);
    it.stock = it.soldOut ? 0 : it.kind === 'A' ? 30 + ((n * 13) % 170) : 120 + ((n * 37 + i * 11) % 860);
    it.committed = it.soldOut ? 0 : (n * 7) % 9;
  });
  const GIFT = ITEMS.find((it) => it.sku === '100011A');
  if (GIFT) { GIFT.stock = 0; GIFT.committed = 0; }   // sold out at the warehouse at the moment of the first sync
  const FROZEN = ITEMS.filter((it) => it.wh === 'F01'), AMBIENT = ITEMS.filter((it) => it.wh === 'D01');
  const SOLD = ITEMS.filter((it) => it.stock === 0);
  /** the item code as the WMS keeps it: a number (no leading zeros) + 区分 */
  const wmsCode = (it) => String(+it.sku.slice(0, 6));

  const q = (v) => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const STOCK_CSV = ['倉庫コード,品番,区分,商品名,引当可能数,出荷待ち,更新日時',
    ...ITEMS.map((it) => [it.wh, wmsCode(it), it.kind, it.name, it.stock, it.committed, '2026/11/07 15:30'].map(q).join(','))].join('\n');
  const MISSING = ITEMS.filter((it) => wmsCode(it).length < 6);

  /* ------------------------------------------------------------------ project files */
  F['package.json'] = JSON.stringify({ name: 'sst-inventory-sync', private: true, type: 'module', scripts: { sync: 'node src/sync-inventory.mjs', 'sync:dry': 'node src/sync-inventory.mjs --dry-run' }, engines: { node: '>=20' } }, null, 2);
  F['.env.example'] = 'SHOPIFY_STORE=soup-stock-tokyo.myshopify.com\nSHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxx\nSHOPIFY_API_VERSION=2026-07\nWMS_EXPORT_URL=https://wms.example.jp/export/stock.csv';
  F['.gitignore'] = 'node_modules/\n.env\ndata/wms/*.csv';
  F['README.md'] = [
    '# Soup Stock Tokyo オンラインショップ — 在庫同期',
    '',
    '倉庫管理システム（WMS）の在庫を、Shopify のロケーションごとの在庫（available）に同期します。',
    '',
    '- `npm run sync:dry` 照合だけ（SKU が見つからない品番を確認）',
    '- `npm run sync` 同期（GitHub Actions で 15 分ごとに実行）',
    '',
    '設計は `docs/inventory-sync.md`。',
  ].join('\n');
  F['docs/inventory-sync.md'] = [
    '# 在庫連携の設計（倉庫・店舗 ⇄ Shopify）',
    '',
    '## 在庫の正（マスター）',
    '- EC で売る在庫の正は **倉庫管理システム（WMS）の「引当可能数」**',
    '- Shopify の在庫（available）は WMS に合わせる（Shopify 側では手で直さない）',
    '- 店舗の在庫は店舗販売用（POS）。EC の販売可能数には含めない',
    '',
    '## ロケーション',
    '| ロケーション | 取り扱い | オンライン注文 |',
    '| --- | --- | --- |',
    '| 冷凍倉庫（F01） | 冷凍スープ・カレー・ギフトセット | 発送する（優先 1） |',
    '| 常温倉庫（D01） | フリーズドライ・レトルト・雑貨 | 発送する（優先 2） |',
    '| 店舗（POS） | 店舗販売 | 発送しない |',
    '',
    '## 同期の流れ',
    '1. WMS の在庫 CSV を取得（15 分ごと・GitHub Actions）',
    '2. 品番＋区分 → Shopify の SKU で照合（見つからない品番はレポート）',
    '3. `inventorySetQuantities` でロケーションごとに available を設定',
    '4. 在庫 0 の商品・スープは自動で「売り切れ」',
    '   （いまは商品名に【完売】と手で書いている → この運用をやめる）',
  ].join('\n');
  F['data/wms/README.md'] = '# WMS の在庫 CSV\n\nWMS の「在庫一覧（引当可能数）」の書き出し。品番は数値（先頭の 0 なし）、区分は S（スープ）/ C（カレー）/ A（セット）。';
  F['src/lib/csv.mjs'] = [
    '// 最小限の CSV 読み込み（ダブルクォート・カンマ・改行を含む値に対応）',
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
  ].join('\n');
  F['src/locations.mjs'] = [
    '// WMS の倉庫コード → Shopify のロケーション（設定 > ロケーション）',
    'export const LOCATIONS = {',
    '  F01: \'gid://shopify/Location/71839563963\',   // 冷凍倉庫',
    '  D01: \'gid://shopify/Location/\',   // 常温倉庫',
    '};',
  ].join('\n');
  F['src/shopify.mjs'] = [
    '// Shopify Admin GraphQL API',
    'const { SHOPIFY_STORE, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION = \'2026-07\' } = process.env;',
    'const ENDPOINT = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;',
    '',
    'export class ShopifyError extends Error {',
    '  constructor(errors, cost) { super(errors.map((e) => e.message).join(\'; \')); this.code = errors[0]?.extensions?.code; this.cost = cost; }',
    '}',
    '',
    'export async function gql(query, variables = {}) {',
    '  const res = await fetch(ENDPOINT, {',
    '    method: \'POST\',',
    '    headers: { \'Content-Type\': \'application/json\', \'X-Shopify-Access-Token\': SHOPIFY_ADMIN_TOKEN },',
    '    body: JSON.stringify({ query, variables }),',
    '  });',
    '  const json = await res.json();',
    '  if (json.errors) throw new ShopifyError(json.errors, json.extensions?.cost);',
    '  return json.data;',
    '}',
    '',
    '// THROTTLED（コストの上限）のときは、回復するまで待って再試行する',
    'export async function withRetry(fn, tries = 5) {',
    '  for (let i = 1; ; i++) {',
    '    try { return await fn(); } catch (e) {',
    '      if (e.code !== \'THROTTLED\' || i >= tries) throw e;',
    '      const s = e.cost?.throttleStatus;',
    '      const wait = s ? Math.ceil((e.cost.requestedQueryCost - s.currentlyAvailable) / s.restoreRate) * 1000 : 1000 * 2 ** i;',
    '      console.warn(`  THROTTLED: ${wait / 1000} 秒待って再試行（${i}/${tries}）`);',
    '      await new Promise((r) => setTimeout(r, wait));',
    '    }',
    '  }',
    '}',
    '',
    'export const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));',
  ].join('\n');
  const QUERIES_HEAD = [
    'export const VARIANTS = /* GraphQL */ `',
    '  query Variants($cursor: String) {',
    '    productVariants(first: 250, after: $cursor) {',
    '      nodes { sku inventoryItem { id } }',
    '      pageInfo { hasNextPage endCursor }',
    '    }',
    '  }`;',
    '',
  ];
  /** typed in the video */
  const SET_QUANTITIES = [
    '// ロケーションごとの available を、まとめて設定する',
    'export const SET_QUANTITIES = /* GraphQL */ `',
    '  mutation SetQuantities($input: InventorySetQuantitiesInput!) {',
    '    inventorySetQuantities(input: $input) {',
    '      inventoryAdjustmentGroup { reason changes { name delta } }',
    '      userErrors { field message code }',
    '    }',
    '  }`;',
  ];
  F['src/queries.mjs'] = [...QUERIES_HEAD, '// TODO: 在庫を設定するミューテーション'].join('\n');
  const QUERIES_FINAL = [...QUERIES_HEAD, ...SET_QUANTITIES].join('\n');

  const SYNC_HEAD = [
    '// 倉庫（WMS）の在庫 CSV → Shopify の在庫（ロケーションごとの available）',
    'import fs from \'node:fs\';',
    'import path from \'node:path\';',
    'import { parse } from \'./lib/csv.mjs\';',
    'import { gql, withRetry, chunk } from \'./shopify.mjs\';',
    'import { VARIANTS, SET_QUANTITIES } from \'./queries.mjs\';',
    'import { LOCATIONS } from \'./locations.mjs\';',
    '',
    'const file = process.argv.find((a) => a.endsWith(\'.csv\')) ?? \'data/wms/stock_20261107.csv\';',
    'const dryRun = process.argv.includes(\'--dry-run\');',
    'const rows = parse(fs.readFileSync(file, \'utf8\').replace(/^\\uFEFF/, \'\'));',
    'const INPUT = { name: \'available\', reason: \'correction\', referenceDocumentUri: `logistics://wms/${path.basename(file)}`, ignoreCompareQuantity: true };',
    '',
    '// Shopify の全バリエーション：SKU → 在庫アイテム ID',
    'const items = new Map();',
    'for (let cursor = null, page; !page || page.pageInfo.hasNextPage; cursor = page.pageInfo.endCursor) {',
    '  page = (await gql(VARIANTS, { cursor })).productVariants;',
    '  for (const v of page.nodes) items.set(v.sku, v.inventoryItem.id);',
    '}',
    '',
  ];
  /** typed in the video */
  const SYNC_MATCH = [
    'const quantities = [];',
    'const missing = [];',
    'for (const r of rows) {',
    '  // 品番と区分から SKU を作る（S スープ・C カレー・A セット）',
    '  const sku = `${r[\'品番\']}${r[\'区分\']}`;',
    '  const id = items.get(sku);',
    '  if (!id) { missing.push(sku); continue; }',
    '  quantities.push({ inventoryItemId: id, locationId: LOCATIONS[r[\'倉庫コード\']], quantity: Number(r[\'引当可能数\']) });',
    '}',
    'console.log(`照合 ${quantities.length} / ${rows.length} 件` + (missing.length ? `（見つからない SKU ${missing.length} 件：${missing.slice(0, 4).join(\', \')}）` : \'\'));',
    'if (dryRun || missing.length) process.exit(missing.length ? 1 : 0);',
    '',
    'await Promise.all(quantities.map((q) => gql(SET_QUANTITIES, { input: { ...INPUT, quantities: [q] } })));',
    'console.log(`${quantities.length} 件の在庫を更新しました`);',
  ];
  F['src/sync-inventory.mjs'] = [...SYNC_HEAD, '// TODO: 照合して在庫を設定'].join('\n');
  const SKU_BAD = '`${r[\'品番\']}${r[\'区分\']}`';
  const SKU_OK = '`${r[\'品番\'].padStart(6, \'0\')}${r[\'区分\']}`';
  const CALL_BAD = 'await Promise.all(quantities.map((q) => gql(SET_QUANTITIES, { input: { ...INPUT, quantities: [q] } })));';
  const CALL_OK = [
    '// 100 件ずつまとめて送る（1 件ずつ並列に送ると上限を超える）',
    'for (const part of chunk(quantities, 100)) {',
    '  await withRetry(() => gql(SET_QUANTITIES, { input: { ...INPUT, quantities: part } }));',
    '}',
  ];
  const SYNC_FINAL = [...SYNC_HEAD, ...SYNC_MATCH].join('\n').replace(SKU_BAD, SKU_OK).replace(CALL_BAD, CALL_OK.join('\n'));

  F['.github/workflows/inventory-sync.yml'] = [
    'name: inventory-sync',
    'on:',
    '  workflow_dispatch:',
    'jobs:',
    '  sync:',
    '    runs-on: ubuntu-latest',
    '    timeout-minutes: 10',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v4',
    '        with: { node-version: 22 }',
    '      - name: WMS の在庫 CSV を取得',
    '        run: curl -fsS -H "Authorization: Bearer ${{ secrets.WMS_TOKEN }}" "$WMS_EXPORT_URL" -o data/wms/stock.csv',
    '        env: { WMS_EXPORT_URL: ${{ vars.WMS_EXPORT_URL }} }',
    '      - name: Shopify に同期',
    '        run: node src/sync-inventory.mjs data/wms/stock.csv',
    '        env:',
    '          SHOPIFY_STORE: soup-stock-tokyo.myshopify.com',
    '          SHOPIFY_ADMIN_TOKEN: ${{ secrets.SHOPIFY_ADMIN_TOKEN }}',
  ].join('\n');
  /** typed in the video: the schedule (under `on:`) */
  const CRON = ['  # 15 分ごと（WMS の在庫更新に合わせる）', '  schedule:', "    - cron: '*/15 * * * *'"];

  window.FILES = {
    files: F, ITEMS, FROZEN, AMBIENT, SOLD, GIFT, MISSING, STOCK_CSV, wmsCode,
    SYNC_MATCH, SYNC_FINAL, SET_QUANTITIES, QUERIES_FINAL, SKU_BAD, SKU_OK, CALL_BAD, CALL_OK, CRON,
  };
})();
