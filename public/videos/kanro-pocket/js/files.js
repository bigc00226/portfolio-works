/*
 * The files of the integration project shown in VS Code (C:\dev\kanro-ec-gateway): a small Node.js middleware
 * ("ec-gateway") between the Shopify store and the company's systems (基幹 / 物流 WMS / 会員基盤).
 *
 * The product names, prices and SKUs (5-digit product codes) come from the captured catalogue of kanro.jp
 * (SITE_SNAPSHOT.catalog). Everything on the company side is a reconstruction for the demo: the middleware, the
 * WMS / 基幹 CSV layouts, stock counts, orders, members, tracking numbers, location ids and URLs.
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const F = {};
  const img = Object.fromEntries((S.products || []).map((p) => [p.handle, p.image]));

  /* ------------------------------------------------------------ products sold online (SKU = 基幹の商品コード) */
  const ITEMS = (S.catalog || [])
    .filter((p) => p.vs.length && +p.vs[0][1] > 0 && /^\d{5}$/.test(p.vs[0][2] || ''))
    .map((p) => ({ handle: p.h, title: p.t.replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim(), sku: p.vs[0][2], price: +p.vs[0][1], type: p.ty, tags: p.tags, image: img[p.h] || null }));
  const FEATURED = (S.products || []).map((p) => p.handle);
  ITEMS.sort((a, b) => {
    const fa = FEATURED.indexOf(a.handle), fb = FEATURED.indexOf(b.handle);
    return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb);
  });
  const by = (sku) => ITEMS.find((i) => i.sku === sku) || ITEMS[0];
  const STOCK = ITEMS.slice(0, 24).map((it, i) => {
    const before = 40 + ((+it.sku * 53 + i * 17) % 1400);
    const changed = i % 3 === 1 || i === 0;
    const after = changed ? Math.max(0, before - 12 - ((+it.sku * 7) % 90)) : before;
    return { ...it, before, after: i === 9 ? 0 : after, reserved: (+it.sku * 3) % 40, loc: `TKY-${'ABCD'[i % 4]}-${String(1 + (i * 7) % 18).padStart(2, '0')}-${String(1 + (i * 5) % 12).padStart(2, '0')}` };
  });
  const CHANGED = STOCK.filter((s) => s.after !== s.before);

  /* ------------------------------------------------------------ orders (test orders of the demo) */
  const ORDER = (no, at, lines, ship) => ({ no, at, lines: lines.map(([sku, q]) => ({ ...by(sku), qty: q })), ship });
  const ORDERS = [
    ORDER('#1001', '2026/10/06 10:42', [['00173', 2], ['02719', 3], ['06904', 1]], 'YMT'),
    ORDER('#1002', '2026/10/06 10:58', [['00169', 2], ['00170', 2]], 'YMT'),
    ORDER('#1003', '2026/10/06 11:05', [['06864', 1], ['06853', 1]], 'YMT'),
    ORDER('#1004', '2026/10/06 11:31', [['06903', 2], ['02719', 1]], 'YMT'),
  ];
  ORDERS.forEach((o) => { o.sub = o.lines.reduce((s, l) => s + l.price * l.qty, 0); o.ship = 800; o.total = o.sub + o.ship; });
  const TRACK = { '#1001': '4567-8901-2345', '#1002': '4567-8901-2356', '#1003': '4567-8901-2367' };

  /* ------------------------------------------------------------ docs */
  const w = (s) => [...s].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e7f ? 2 : 1), 0);
  const pad = (s, n) => s + ' '.repeat(Math.max(1, n - w(s)));
  const row = (a, b, c, d, e) => '  ' + pad(a, 24) + pad(b, 6) + pad(c, 30) + pad(d, 6) + e;
  F['docs/integration.md'] = [
    '# Kanro POCKeT ⇄ 社内システム 連携設計',
    '',
    '## 全体像',
    '',
    row('Shopify（kanroec）', '', 'ec-gateway（このリポジトリ）', '', '社内システム'),
    row('orders/paid Webhook', '--->', '受注データに変換', '--->', '基幹：受注 CSV（SFTP）'),
    row('inventorySetQuantities', '<---', '在庫の取り込み（15 分ごと）', '<---', '物流 WMS：在庫 CSV'),
    row('fulfillmentCreate', '<---', '出荷実績の反映', '<---', '物流 WMS：出荷実績（送り状番号）'),
    row('metafieldsSet', '<---', '会員ランク・ポイント（毎朝）', '<---', '会員基盤 API'),
    '',
    '## 連携の一覧',
    '',
    '| 連携 | 方向 | タイミング | Shopify 側 |',
    '| --- | --- | --- | --- |',
    '| 受注 | Shopify → 基幹 | 支払い完了時 | Webhook `orders/paid` |',
    '| 在庫 | WMS → Shopify | 15 分ごと | `inventorySetQuantities` |',
    '| 出荷 | WMS → Shopify | 出荷実績の受信時 | `fulfillmentCreate`（送り状番号） |',
    '| 会員 | 会員基盤 → Shopify | 毎日 5:00 | 顧客メタフィールド `metafieldsSet` |',
    '',
    '## 決めごと',
    '',
    '- 商品の紐づけは SKU（基幹の商品コード 5 桁：00173 など）',
    '- Webhook には 5 秒以内に 200 を返す（返さないと Shopify が再送する）',
    '- 失敗した処理はデッドレターに入れ、連携モニターから再実行する',
  ].join('\n');

  F['shopify.app.toml'] = [
    '# ec-gateway：Kanro POCKeT と社内システムの連携用アプリ（カスタムアプリ）',
    'client_id = "4f9c2e7b1a8d6e03c5b7f1a2d9e4c6b8"',
    'name = "kanro-ec-gateway"',
    'application_url = "https://ec-gateway.kanro-pocket.example"',
    'embedded = false',
    '',
    '[access_scopes]',
    'scopes = "read_orders,read_customers,write_customers,read_products,read_inventory,write_inventory,write_merchant_managed_fulfillment_orders"',
    '',
    '[webhooks]',
    'api_version = "2026-07"',
  ].join('\n');
  const TOML_ADD = ['', '[[webhooks.subscriptions]]', 'topics = [ "orders/paid" ]', 'uri = "/webhooks/orders-paid"'];

  F['package.json'] = JSON.stringify({
    name: 'kanro-ec-gateway', version: '1.4.0', private: true, type: 'module',
    scripts: { dev: 'node --watch src/server.js', deploy: 'node scripts/deploy.js', 'job:stock': 'node src/jobs/import-stock.js', 'job:ship': 'node src/jobs/import-shipments.js', 'job:members': 'node src/jobs/sync-members.js', replay: 'node scripts/replay.js' },
    dependencies: { express: '^5.1.0', 'ssh2-sftp-client': '^11.0.0', 'csv-parse': '^5.6.0', 'iconv-lite': '^0.6.3' },
  }, null, 2);
  F['.env.example'] = 'SHOPIFY_SHOP=kanroec.myshopify.com\nSHOPIFY_API_SECRET=\nSHOPIFY_ADMIN_TOKEN=\nKIKAN_SFTP_HOST=\nWMS_SFTP_HOST=\nMEMBER_API_URL=';
  F['README.md'] = [
    '# kanro-ec-gateway',
    '',
    'Kanro POCKeT（Shopify）と社内システム（基幹・物流 WMS・会員基盤）をつなぐ中継サーバー。',
    '',
    '- `src/routes/webhooks.js` … 受注（orders/paid）→ 基幹の受注 CSV',
    '- `src/jobs/import-stock.js` … WMS の在庫 → Shopify の在庫数（15 分ごと）',
    '- `src/jobs/import-shipments.js` … WMS の出荷実績 → 発送済み・送り状番号',
    '- `src/jobs/sync-members.js` … 会員ランク・ポイント → 顧客メタフィールド（毎朝）',
    '- 設計：`docs/integration.md`',
  ].join('\n');

  /* ------------------------------------------------------------ webhook: verification + route */
  F['src/webhooks/verify.js'] = [
    '// Shopify の Webhook の署名（X-Shopify-Hmac-Sha256）を検証する',
    "import crypto from 'node:crypto';",
    '',
    '',
  ].join('\n');
  const VERIFY_FN = (body) => [
    'export function verifyWebhook(req) {',
    "  const hmac = req.get('X-Shopify-Hmac-Sha256') ?? '';",
    "  const digest = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET)",
    `    .update(${body})`,
    "    .digest('base64');",
    '  return hmac.length === digest.length && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(digest));',
    '}',
  ];
  const VERIFY_BAD = 'JSON.stringify(req.body)';
  const ROUTE = (o) => [
    '// Shopify からの Webhook を受けて、基幹システムの受注データ（CSV）にする',
    "import express from 'express';",
    "import { verifyWebhook } from '../webhooks/verify.js';",
    "import { toKikanRows, uploadJuchu } from '../lib/kikan.js';",
    "import { log } from '../lib/monitor.js';",
    ...(o.dedupe ? ["import { processed } from '../lib/processed.js';"] : []),
    '',
    'export const webhooks = express.Router();',
    '',
    `webhooks.post('/orders-paid', ${o.raw ? "express.raw({ type: 'application/json' })" : 'express.json()'}, async (req, res) => {`,
    '  if (!verifyWebhook(req)) {',
    "    log('orders/paid', 401, 'HMAC mismatch');",
    '    return res.sendStatus(401);',
    '  }',
    `  const order = ${o.raw ? 'JSON.parse(req.body)' : 'req.body'};`,
    ...(o.dedupe ? [
      '  // 再送された Webhook（同じ X-Shopify-Event-Id）は 1 回だけ処理する',
      "  if (await processed.seen(req.get('X-Shopify-Event-Id'))) return res.sendStatus(200);",
      '  res.sendStatus(200);',
    ] : []),
    '  await uploadJuchu(toKikanRows(order));',
    "  log('orders/paid', 200, `基幹に受注 ${order.name} を送信`);",
    ...(o.dedupe ? [] : ['  res.sendStatus(200);']),
    '});',
  ];
  F['src/routes/webhooks.js'] = ROUTE({}).join('\n');
  F['src/server.js'] = [
    "import express from 'express';",
    "import { webhooks } from './routes/webhooks.js';",
    '',
    'const app = express();',
    "app.use('/webhooks', webhooks);",
    "app.get('/healthz', (req, res) => res.send('ok'));",
    'app.listen(process.env.PORT ?? 3000);',
  ].join('\n');
  const KIKAN_HEAD = [
    '// 基幹システムの受注 CSV（Shift_JIS・1 明細 1 行）を作って SFTP に置く',
    "import Client from 'ssh2-sftp-client';",
    "import iconv from 'iconv-lite';",
    '',
    "const jst = (iso) => new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).replace(/-/g, '/');",
    '',
  ];
  const KIKAN_FN = [
    'export function toKikanRows(order) {',
    '  // 基幹は 1 明細 1 行。受注日時は日本時間、送料は 1 行目にだけ入れる',
    '  return order.line_items.map((li, i) => [',
    "    order.name.replace('#', 'KP'), i + 1, jst(order.processed_at), order.customer?.id ?? '',",
    '    li.sku, li.quantity, li.price, i === 0 ? order.total_shipping_price_set.shop_money.amount : 0,',
    "    order.payment_gateway_names.join('/'),",
    '  ]);',
    '}',
  ];
  const KIKAN_TAIL = [
    '',
    'export async function uploadJuchu(rows) {',
    '  const csv = rows.map((r) => r.join(\',\')).join(\'\\r\\n\') + \'\\r\\n\';',
    '  const sftp = new Client();',
    '  await sftp.connect({ host: process.env.KIKAN_SFTP_HOST, username: \'ec\', privateKey: process.env.KIKAN_SFTP_KEY });',
    "  await sftp.put(iconv.encode(csv, 'Shift_JIS'), `/inbox/juchu/${rows[0][0]}.csv`);",
    '  await sftp.end();',
    '}',
  ];
  F['src/lib/kikan.js'] = [...KIKAN_HEAD, '// TODO: 注文 → 基幹の受注 CSV の行', ...KIKAN_TAIL].join('\n');
  const KIKAN_FINAL = [...KIKAN_HEAD, ...KIKAN_FN, ...KIKAN_TAIL].join('\n');
  F['.gitignore'] = 'node_modules/\n.env\n';
  F['src/lib/monitor.js'] = "// 連携モニターにイベントを記録する\nexport const log = (topic, status, message) => fetch(process.env.MONITOR_URL + '/events', { method: 'POST', body: JSON.stringify({ topic, status, message, at: Date.now() }) });";
  F['src/lib/processed.js'] = [
    '// 処理済みの Webhook（X-Shopify-Event-Id）を 7 日間覚えておく',
    "import { redis } from './redis.js';",
    '',
    'export const processed = {',
    "  async seen(id) { return (await redis.set(`webhook:${id}`, '1', { NX: true, EX: 60 * 60 * 24 * 7 })) === null; },",
    '};',
  ].join('\n');
  F['src/lib/shopify.js'] = [
    '// Shopify Admin GraphQL API（2026-07）',
    "const ENDPOINT = `https://${process.env.SHOPIFY_SHOP}/admin/api/2026-07/graphql.json`;",
    '',
    'export const shopify = {',
    '  async graphql(query, variables) {',
    "    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN }, body: JSON.stringify({ query, variables }) });",
    '    const { data, errors } = await res.json();',
    '    if (errors) throw new Error(JSON.stringify(errors));',
    '    return data;',
    '  },',
    '};',
    '',
    '// SKU → { inventoryItemId, available }（物流センターの在庫）',
    'export async function variantsBySku(skus) { /* productVariants(query: "sku:00173 OR sku:02719 …") を 50 件ずつ */ }',
    'export async function fulfillmentOrderOf(name) { /* orders(query: "name:#1001") → fulfillmentOrders(first: 1) */ }',
    'export async function customerIdByEmail(email) { /* customers(query: "email:…") */ }',
  ].join('\n');
  F['src/lib/wms.js'] = [
    '// 物流 WMS が SFTP に置く CSV（Shift_JIS）を読む：zaiko_YYYYMMDD_HHMM.csv / shukka_YYYYMMDD_HHMM.csv',
    "import { parse } from 'csv-parse/sync';",
    "import iconv from 'iconv-lite';",
    "import { latestFile } from './sftp.js';",
    '',
    "export const readWmsCsv = async (kind) => parse(iconv.decode(await latestFile(`/outbox/${kind}`), 'Shift_JIS'), { columns: true });",
  ].join('\n');

  /* ------------------------------------------------------------ jobs */
  const STOCK_HEAD = [
    '// 物流 WMS の在庫 CSV（15 分ごと）→ Shopify の在庫数（ロケーション：物流センター）',
    "import { readWmsCsv } from '../lib/wms.js';",
    "import { shopify, variantsBySku } from '../lib/shopify.js';",
    '',
    "const LOCATION = 'gid://shopify/Location/71093321886'; // 物流センター（WMS）",
    "const rows = await readWmsCsv('zaiko');",
    "const items = await variantsBySku(rows.map((r) => r['商品コード']));",
    '',
    'const changes = rows',
    "  .filter((r) => items[r['商品コード']] && items[r['商品コード']].available !== Number(r['有効在庫']))",
    "  .map((r) => ({ inventoryItemId: items[r['商品コード']].inventoryItemId, locationId: LOCATION, quantity: Number(r['有効在庫']) }));",
    "console.log(`WMS 在庫 ${rows.length} SKU（変更あり ${changes.length} 件）`);",
    '',
  ];
  const STOCK_LOOP = [
    'for (let i = 0; i < changes.length; i += 250) {',
    '  const data = await shopify.graphql(`#graphql',
    '    mutation setStock($input: InventorySetQuantitiesInput!) {',
    '      inventorySetQuantities(input: $input) { userErrors { field message } }',
    "    }`, { input: { name: 'available', reason: 'correction', ignoreCompareQuantity: true, quantities: changes.slice(i, i + 250) } });",
    '  const { userErrors } = data.inventorySetQuantities;',
    '  if (userErrors.length) throw new Error(JSON.stringify(userErrors));',
    '}',
    "console.log('在庫を更新しました');",
  ];
  F['src/jobs/import-stock.js'] = [...STOCK_HEAD, '// TODO: 250 件ずつ在庫数を設定'].join('\n');
  const SHIP_F = (mode) => (mode === "todo" ? ["    // TODO: 明細・送り状番号・お客様への通知"] : [
    '    lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: fo.id }],',
    "    trackingInfo: { company, number: r['送り状番号'], url: url + r['送り状番号'] },",
    ...(mode === "bad" ? ["    // テスト中はお客様にメールを送らない"] : []),
    `    notifyCustomer: ${mode === "bad" ? "false" : "true"},`,
  ]);
  const SHIP = (mode) => [
    '// 物流 WMS の出荷実績（送り状番号）→ Shopify の注文を「発送済み」に',
    "import { readWmsCsv } from '../lib/wms.js';",
    "import { shopify, fulfillmentOrderOf } from '../lib/shopify.js';",
    '',
    "const CARRIER = { YMT: ['ヤマト運輸', 'https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number='] };",
    '',
    "for (const r of await readWmsCsv('shukka')) {",
    "  const fo = await fulfillmentOrderOf(r['受注番号']);",
    "  const [company, url] = CARRIER[r['運送会社']];",
    '  await shopify.graphql(`#graphql',
    '    mutation ship($f: FulfillmentInput!) {',
    '      fulfillmentCreate(fulfillment: $f) { fulfillment { status } userErrors { message } }',
    '    }`, { f: {',
    ...SHIP_F(mode),
    '  } });',
    "  console.log(`${r['受注番号']} を発送済みに（${company} ${r['送り状番号']}）`);",
    '}',
  ];
  F['src/jobs/import-shipments.js'] = SHIP('todo').join('\n');
  const MEMBER_PUSH = [
    "  mf.push({ ownerId, namespace: 'custom', key: 'member_rank', type: 'single_line_text_field', value: m.rank });",
    "  mf.push({ ownerId, namespace: 'custom', key: 'points', type: 'number_integer', value: String(m.points) });",
  ];
  F['src/jobs/sync-members.js'] = [
    '// 会員基盤の会員ランク・ポイント（前日からの差分）→ Shopify の顧客メタフィールド',
    "import { memberDiff } from '../lib/members.js';",
    "import { shopify, customerIdByEmail } from '../lib/shopify.js';",
    '',
    'const mf = [];',
    "for (const m of await memberDiff({ since: 'yesterday' })) {",
    '  const ownerId = await customerIdByEmail(m.email);',
    '  if (!ownerId) continue; // Shopify に未登録の会員はスキップ',
    '  // TODO: 会員ランク・保有ポイント',
    '}',
    '// metafieldsSet は 1 回 25 件まで',
    'for (let i = 0; i < mf.length; i += 25) {',
    '  const data = await shopify.graphql(`#graphql',
    '    mutation sync($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { field message } } }',
    '  `, { m: mf.slice(i, i + 25) });',
    '  if (data.metafieldsSet.userErrors.length) console.warn(data.metafieldsSet.userErrors);',
    '}',
    "console.log(`会員 ${mf.length / 2} 件のランク・ポイントを更新しました（metafieldsSet ${Math.ceil(mf.length / 25)} 回）`);",
  ].join('\n');
  F['scripts/replay.js'] = [
    '// 保存しておいた Webhook（ヘッダーと本文）を同じ内容でもう一度送る：npm run replay -- <ファイル> --times 2',
    "import fs from 'node:fs';",
    'const [file, , times = 1] = process.argv.slice(2);',
    "const { headers, body } = JSON.parse(fs.readFileSync(file, 'utf8'));",
    'for (let i = 0; i < Number(times); i++) {',
    "  const res = await fetch('https://ec-gateway.kanro-pocket.example/webhooks/orders-paid', { method: 'POST', headers, body });",
    '  console.log(i + 1, res.status);',
    '}',
  ].join('\n');
  F['scripts/deploy.js'] = '// ステージングのコンテナにデプロイ（GitHub Actions と同じ手順）\n';

  /* ------------------------------------------------------------ WMS / 基幹 data */
  F['data/wms/zaiko_20261006_1115.csv'] = ['商品コード,商品名,有効在庫,引当済,ロケーション', ...STOCK.map((s) => [s.sku, `"${s.title}"`, s.after, s.reserved, s.loc].join(','))].join('\n');
  F['data/wms/shukka_20261006_1130.csv'] = ['受注番号,出荷日,運送会社,送り状番号,個口', ...ORDERS.slice(0, 3).map((o) => [o.no, '2026/10/06', 'YMT', TRACK[o.no], 1].join(','))].join('\n');
  F['data/webhooks/orders-paid-1004.json'] = JSON.stringify({ headers: { 'Content-Type': 'application/json', 'X-Shopify-Topic': 'orders/paid', 'X-Shopify-Shop-Domain': 'kanroec.myshopify.com', 'X-Shopify-Event-Id': '9b2f6c1e-4d7a-4e0b-8a35-6f1c2d9e7b40', 'X-Shopify-Hmac-Sha256': 'k3Q…' }, body: '{"id":6481930518672,"name":"#1004", … }' }, null, 2);
  const kikanRow = (o, l, i) => [o.no.replace('#', 'KP'), i + 1, o.at.replace(/(\d+)\/(\d+)\/(\d+) (\d+:\d+)/, '$1/$2/$3 $4:12'), '7310984', l.sku, l.qty, l.price, i === 0 ? 800 : 0, 'shopify_payments'].join(',');
  const KIKAN = (o) => o.lines.map((l, i) => kikanRow(o, l, i));

  /* ------------------------------------------------------------ theme */
  F['theme/snippets/member-status.liquid'] = [
    '{%- comment -%} マイページ：会員ランクと保有ポイント（会員基盤から毎朝同期した顧客メタフィールド） {%- endcomment -%}',
    '{%- if customer -%}',
    '  <div class="member-status">',
    "    <span class=\"member-status__rank\">{{ customer.metafields.custom.member_rank | default: 'レギュラー' }}</span>",
    '    <span class="member-status__points">{{ customer.metafields.custom.points | default: 0 }} pt</span>',
    '  </div>',
    '{%- endif -%}',
  ].join('\n');

  window.FILES = {
    files: F, ITEMS, STOCK, CHANGED, ORDERS, TRACK, KIKAN, img,
    TOML_ADD, VERIFY_FN, VERIFY_BAD, ROUTE, STOCK_HEAD, STOCK_LOOP, SHIP, SHIP_F, MEMBER_PUSH, KIKAN_FN, KIKAN_FINAL,
    VERIFY_FINAL: [...F['src/webhooks/verify.js'].split('\n').slice(0, 3), ...VERIFY_FN('req.body')].join('\n'),
  };
})();
