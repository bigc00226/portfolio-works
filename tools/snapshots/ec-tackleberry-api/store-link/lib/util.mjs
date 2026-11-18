// store-link の小さな道具：ログ（画面と logs/link-YYYYMMDD.log）、CSV（1 行目が見出し）、リクエストの本文
import fs from 'node:fs';

const pad = (n) => String(n).padStart(2, '0');

export function log(msg) {
  const d = new Date();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  console.log(`[${time}] ${msg}`);
  fs.mkdirSync('logs', { recursive: true });
  fs.appendFileSync(`logs/link-${day}.log`, `${day} ${time} ${msg}\n`);
}

export function readCsv(file) {
  const [head, ...rows] = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const keys = head.split(',');
  return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) => [keys[i], v])));
}

export async function body(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}
