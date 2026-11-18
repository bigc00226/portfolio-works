// 店舗の在庫システム ⇄ ＠ベリーネット（EC-CUBE 4.3 の Web API：GraphQL・OAuth2.0・WebHook）
//   node link.mjs serve          OAuth のコールバックと WebHook の受け口（:3100）
//   node link.mjs authorize      認可の URL（管理画面で「許可」→ /callback）
//   node link.mjs stock <csv>    POS の販売・取置 → updateProductStock
//   node link.mjs orders         新規受付の注文の取りこぼし確認（定期実行）
//   node link.mjs ship <csv>     店舗の出荷実績 → updateShipped（出荷完了メール）
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import { log, readCsv, body } from './lib/util.mjs';

process.loadEnvFile();
const { EC_URL, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, WEBHOOK_SECRET } = process.env;
const TOKEN = 'var/token.json';
const PICKED = 'var/picked.json';
const gql = (name) => fs.readFileSync(`graphql/${name}.graphql`, 'utf8');
fs.mkdirSync('var', { recursive: true });

/* ---------------------------------------------------------- OAuth2.0（Authorization Code） */
async function tokenRequest(params) {
  const res = await fetch(`${EC_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`token ${res.status} ${json.error}: ${json.error_description ?? json.message}`);
  const token = { ...json, expires_at: Date.now() + json.expires_in * 1000 };
  fs.writeFileSync(TOKEN, JSON.stringify(token, null, 2));
  return token;
}

async function accessToken() {
  let t = JSON.parse(fs.readFileSync(TOKEN, 'utf8'));
  if (Date.now() > t.expires_at - 60_000) {
    log('アクセストークンの期限切れ → リフレッシュトークンで更新');
    t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
  }
  return t.access_token;
}

/* ---------------------------------------------------------- GraphQL（/api） */
async function api(query, variables = {}) {
  const res = await fetch(`${EC_URL}/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await accessToken()}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join(' / '));
  return json.data;
}

/* ---------------------------------------------------------- 在庫台帳・出荷指示 */
const ledger = Object.fromEntries(readCsv('data/ledger.csv').map((r) => [r.商品コード, r]));
const picked = new Set(fs.existsSync(PICKED) ? JSON.parse(fs.readFileSync(PICKED, 'utf8')) : []);

async function pick(id) {
  if (picked.has(String(id))) return;
  const { order } = await api(gql('order'), { id });
  if (order.OrderStatus.id !== '1') return; // 新規受付だけ（購入処理中の仮受注は除く）
  for (const s of order.Shippings) {
    for (const item of s.OrderItems.filter((i) => i.product_code)) {
      const at = ledger[item.product_code];
      log(`出荷指示 受注 ${order.order_no} → 店舗 ${at.店舗}（棚 ${at.棚番}）${item.product_name} 出荷 ID ${s.id}`);
      fs.mkdirSync('outbox', { recursive: true });
      fs.appendFileSync(`outbox/picking-${at.店舗}.csv`,
        [order.order_no, s.id, item.product_code, item.product_name, at.棚番].join(',') + '\n');
    }
  }
  picked.add(String(id));
  fs.writeFileSync(PICKED, JSON.stringify([...picked]));
}

/* ---------------------------------------------------------- WebHook（X-ECCUBE-Signature） */
function verify(raw, sig) {
  const mine = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  return typeof sig === 'string' && sig.length === mine.length
    && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(mine));
}

const page = (title, text) => `<!doctype html><meta charset="utf-8"><title>store-link</title>
<body style="font:16px sans-serif;margin:48px"><h1 style="font-size:22px">${title}</h1><p>${text}</p></body>`;

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'serve') {
  http.createServer(async (req, res) => {
    const url = new URL(req.url, REDIRECT_URI);
    if (url.pathname === '/callback') {
      if (url.searchParams.get('state') !== fs.readFileSync('var/state', 'utf8')) {
        res.writeHead(400).end('state mismatch');
        return;
      }
      const code = url.searchParams.get('code');
      const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI });
      const jwt = JSON.parse(Buffer.from(t.access_token.split('.')[1], 'base64url'));
      log(`認可 OK（${jwt.sub}・scope ${jwt.scopes.join(' ')}）トークンを ${TOKEN} に保存`);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page('＠ベリーネットの API を認可しました', `scope: ${jwt.scopes.join(' ')} — このタブは閉じてかまいません。`));
      return;
    }
    if (url.pathname === '/webhook' && req.method === 'POST') {
      const raw = await body(req);
      if (!verify(raw, req.headers['x-eccube-signature'])) {
        log('WebHook 署名が一致しません → 401');
        res.writeHead(401).end();
        return;
      }
      res.writeHead(200).end(); // 先に 200 を返し、処理はそのあと
      const events = JSON.parse(raw);
      log(`WebHook ${events.map((e) => `${e.entity}#${e.id} ${e.action}`).join(', ')}`);
      for (const id of new Set(events.filter((e) => e.entity === 'order').map((e) => e.id))) {
        await pick(id).catch((e) => log(`受注 ${id} 失敗: ${e.message}`));
      }
      return;
    }
    res.writeHead(404).end();
  }).listen(new URL(REDIRECT_URI).port, () => log(`store-link ${new URL(REDIRECT_URI).origin}（/callback /webhook）`));
}

if (cmd === 'authorize') {
  const state = crypto.randomBytes(8).toString('hex');
  fs.writeFileSync('var/state', state);
  const q = new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, scope: 'read write', state });
  console.log(`${EC_URL}/admin/authorize?${q}`);
}

if (cmd === 'stock') {
  // POS の販売・取置：商品コード（店舗のバーコード）ごとの在庫数。中古品は 1 点もの
  for (const row of readCsv(arg)) {
    try {
      const { updateProductStock: p } = await api(gql('update-stock'), { code: row.商品コード, stock: Number(row.在庫数) });
      log(`在庫 ${p.code} → ${p.stock}（${row.区分}・店舗 ${row.店舗}）`);
    } catch (e) {
      log(`在庫 ${row.商品コード} 失敗: ${e.message}`);
      process.exitCode = 1;
    }
  }
}

if (cmd === 'orders') {
  // WebHook が届かなかったときの取りこぼし対策：新規受付の注文をまとめて確認
  try {
    const { orders } = await api(gql('orders'));
    log(`新規受付 ${orders.nodes.length} 件（出荷指示済み ${orders.nodes.filter((o) => picked.has(o.id)).length} 件）`);
    for (const o of orders.nodes) await pick(o.id);
  } catch (e) {
    log(`取りこぼし確認 失敗: ${e.message}`);
    process.exitCode = 1;
  }
}

if (cmd === 'ship') {
  // 店舗の出荷実績：出荷 ID・配送業者・お問い合わせ番号 → 出荷済み・出荷完了メール
  for (const row of readCsv(arg)) {
    try {
      const { updateShipped: s } = await api(gql('update-shipped'), {
        id: row.出荷ID, delivery: row.配送業者, tracking: row.お問い合わせ番号, note: `店舗 ${row.店舗} から出荷`,
      });
      log(`出荷 受注 ${row.受注番号}（出荷 ID ${s.id}）${s.shipping_delivery_name} ${s.tracking_number} メール送信 ${s.mail_send_date ? '済' : '-'}`);
    } catch (e) {
      log(`出荷 受注 ${row.受注番号} 失敗: ${e.message}`);
      process.exitCode = 1;
    }
  }
}
