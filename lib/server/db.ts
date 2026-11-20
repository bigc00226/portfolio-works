/*
 * The analytics database (SQLite).
 * Where it is kept, chosen once per server process:
 *   1. Turso (SQLite in the cloud, over HTTPS) when TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) are set — for Vercel and
 *      other serverless hosts, whose files do not last. No package: the statements go to Turso's HTTP API with fetch.
 *   2. A file, data/analytics.sqlite (or ANALYTICS_DB_PATH), with Node's built-in node:sqlite — for `npm start` on a server.
 *   3. When that file cannot be written (Vercel without Turso: the app's folder is read-only), a file in the temporary
 *      folder, so that nothing fails; the admin pages then say that the records are not kept (store().persistent = false).
 * The tables are created on first use.
 *
 *   visitors        one row per IP address (a "user" of the dashboard); excluded = hidden from every figure
 *   views           one row per page load: what was opened, with the browser / OS / device of that load,
 *                   how long the page was in view, and for a /watch page how much of the video was played
 *   events          what happened inside a page: detail (the details of a video opened on the list), site (a site
 *                   or game preview opened), play, q25 / q50 / q75 (a quarter of the video reached), complete
 *   meta            settings: the admin password (scrypt hash)
 *   admin_sessions  signed-in browsers of the admin page (SHA-256 of the cookie token)
 *   login_failures  failed sign-ins, for the lock-out
 *
 * Server-side only. Every call is async (all / get / run / tx), the same for the three stores.
 */
import 'server-only';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY,
  ip TEXT NOT NULL UNIQUE,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  excluded INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS views (
  id INTEGER PRIMARY KEY,
  visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL,
  last_ts INTEGER NOT NULL,
  path TEXT NOT NULL,
  kind TEXT NOT NULL,
  video_id TEXT,
  referrer TEXT NOT NULL DEFAULT '',
  ref_host TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'direct',
  ua TEXT NOT NULL DEFAULT '',
  browser TEXT NOT NULL DEFAULT '',
  browser_ver TEXT NOT NULL DEFAULT '',
  os TEXT NOT NULL DEFAULT '',
  os_ver TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  is_bot INTEGER NOT NULL DEFAULT 0,
  lang TEXT NOT NULL DEFAULT '',
  tz TEXT NOT NULL DEFAULT '',
  screen TEXT NOT NULL DEFAULT '',
  active_ms INTEGER NOT NULL DEFAULT 0,
  watch_ms INTEGER NOT NULL DEFAULT 0,
  max_pos_ms INTEGER NOT NULL DEFAULT 0,
  played INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS views_ts ON views(ts);
CREATE INDEX IF NOT EXISTS views_visitor ON views(visitor_id, ts);
CREATE INDEX IF NOT EXISTS views_video ON views(video_id, ts);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  view_id INTEGER NOT NULL REFERENCES views(id) ON DELETE CASCADE,
  visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL,
  name TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS events_view ON events(view_id);
CREATE INDEX IF NOT EXISTS events_visitor ON events(visitor_id, ts);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  ua TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS login_failures (ip TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS login_failures_ip ON login_failures(ip, ts);
`;

export const dbPath = () => process.env.ANALYTICS_DB_PATH || join(process.cwd(), 'data', 'analytics.sqlite');

export type Row = Record<string, string | number | null>;
type Param = string | number | null;
type RunResult = { changes: number; lastInsertRowid: number };

/** one place the statements can go: the store itself, or an open transaction */
interface Conn {
  all(sql: string, p: Param[]): Promise<Row[]>;
  run(sql: string, p: Param[]): Promise<RunResult>;
}
export type Store = { kind: 'turso' | 'file' | 'temp'; where: string; persistent: boolean; note?: string };
type Stmt = [sql: string, ...p: Param[]];
type Driver = Conn & { store: Store; tx<T>(fn: () => Promise<T>): Promise<T>; many(list: Stmt[]): Promise<RunResult[]> };

/* ------------------------------------------------------------------ a file (node:sqlite) */

function openFile(file: string): DatabaseSync {
  // loaded at run time: the bundler leaves Node's own modules alone this way
  const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');
  mkdirSync(dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  d.exec(SCHEMA);
  return d;
}

function fileDriver(d: DatabaseSync, store: Store): Driver {
  // node:sqlite gives rows without a prototype; they become plain objects (the pages pass them on to client components)
  const conn: Conn = {
    all: async (sql, p) => d.prepare(sql).all(...p).map((r) => ({ ...r }) as Row),
    run: async (sql, p) => { const r = d.prepare(sql).run(...p); return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) }; },
  };
  // one connection: a transaction waits for the one before it to end
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T,>(go: () => Promise<T>) => {
    const p = queue.then(go, go);
    queue = p.catch(() => undefined);
    return p;
  };
  const inTx = async <T,>(fn: () => Promise<T>) => {
    d.exec('BEGIN');
    try { const r = await fn(); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; }
  };
  return {
    ...conn, store,
    many: (list) => serial(() => inTx(async () => list.map(([sql, ...p]) => {
      const r = d.prepare(sql).run(...p);
      return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
    }))),
    tx: (fn) => serial(() => inTx(fn)),
  };
}

/* ------------------------------------------------------------------ Turso (libSQL's HTTP API, "Hrana" over HTTP, v2) */

type HValue = { type: 'null' } | { type: 'integer'; value: string } | { type: 'float'; value: number } | { type: 'text'; value: string } | { type: 'blob'; base64: string };
type HResult = { cols: { name: string | null }[]; rows: HValue[][]; affected_row_count: number; last_insert_rowid: string | null };
type HItem = { type: 'ok'; response: { type: string; result?: HResult } } | { type: 'error'; error: { message: string; code?: string } };

const toArg = (v: Param): HValue =>
  v === null || v === undefined ? { type: 'null' }
    : typeof v === 'number' ? (Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'float', value: v })
      : { type: 'text', value: String(v) };
const fromValue = (v: HValue): string | number | null =>
  v.type === 'null' ? null : v.type === 'integer' ? Number(v.value) : v.type === 'float' ? v.value : v.type === 'text' ? v.value : v.base64;
const execute = (sql: string, p: Param[] = []) => ({ type: 'execute', stmt: { sql, args: p.map(toArg), want_rows: true } });

function tursoDriver(url: string, token: string): Driver {
  const base0 = url.replace(/^libsql:\/\//, 'https://').replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://').replace(/\/+$/, '');
  const host = (() => { try { return new URL(base0).host; } catch { return base0; } })();

  /** one round trip; a stream (a transaction) is carried on by its baton */
  async function pipeline(requests: object[], s?: { baton: string | null; base: string }) {
    const send = () => fetch(`${s?.base ?? base0}/v2/pipeline`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ baton: s?.baton ?? null, requests }),
    });
    let res: Response;
    try { res = await send(); } catch (e) {
      if (s?.baton) throw e; // inside a transaction the stream may be gone: no second try
      await new Promise((r) => setTimeout(r, 150));
      res = await send();
    }
    if (!res.ok) throw new Error(`Turso: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    const j = (await res.json()) as { baton: string | null; base_url: string | null; results: HItem[] };
    if (s) { s.baton = j.baton; if (j.base_url) s.base = j.base_url.replace(/\/+$/, ''); }
    return j.results.map((x) => {
      if (x.type === 'error') throw new Error(`Turso: ${x.error.message}`);
      return x.response.result;
    });
  }
  const rowsOf = (r: HResult | undefined): Row[] => (r ? r.rows.map((row) => Object.fromEntries(row.map((v, i) => [r.cols[i]?.name ?? String(i), fromValue(v)]))) : []);
  const runOf = (r: HResult | undefined): RunResult => ({ changes: r?.affected_row_count ?? 0, lastInsertRowid: Number(r?.last_insert_rowid ?? 0) });

  // the tables, once per process (before the first statement)
  let ready: Promise<unknown> | null = null;
  const init = () => (ready ??= pipeline([...SCHEMA.split(';').map((x) => x.trim()).filter(Boolean).map((x) => execute(x)), { type: 'close' }]).catch((e) => { ready = null; throw e; }));

  const one = async (sql: string, p: Param[]) => { await init(); return (await pipeline([execute(sql, p), { type: 'close' }]))[0]; };
  // statements inside tx() go to the transaction's stream
  const inTx = new AsyncLocalStorage<{ baton: string | null; base: string }>();
  const onStream = async (sql: string, p: Param[]) => {
    const s = inTx.getStore();
    return s ? (await pipeline([execute(sql, p)], s))[0] : one(sql, p);
  };
  return {
    store: { kind: 'turso', where: host, persistent: true },
    all: async (sql, p) => rowsOf(await onStream(sql, p)),
    run: async (sql, p) => runOf(await onStream(sql, p)),
    async many(list) {
      if (inTx.getStore()) { const out: RunResult[] = []; for (const [sql, ...p] of list) out.push(runOf(await onStream(sql, p))); return out; }
      await init();
      return (await pipeline([...list.map(([sql, ...p]) => execute(sql, p)), { type: 'close' }])).map(runOf);
    },
    async tx<T>(fn: () => Promise<T>) {
      await init();
      const s = { baton: null as string | null, base: base0 };
      await pipeline([execute('BEGIN')], s);
      try {
        const r = await inTx.run(s, fn);
        await pipeline([execute('COMMIT'), { type: 'close' }], s);
        return r;
      } catch (e) {
        try { await pipeline([execute('ROLLBACK'), { type: 'close' }], s); } catch { /* the stream is gone */ }
        throw e;
      }
    },
  };
}

/* ------------------------------------------------------------------ the store of this process */

// kept on globalThis so that the dev server's reloads do not open more connections
const g = globalThis as unknown as { __ppDriver?: Driver };

function driver(): Driver {
  if (g.__ppDriver) return g.__ppDriver;
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  if (url) return (g.__ppDriver = tursoDriver(url, process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || ''));
  const file = dbPath();
  try {
    return (g.__ppDriver = fileDriver(openFile(file), { kind: 'file', where: file, persistent: true }));
  } catch (e) {
    // a read-only app folder (Vercel and other serverless hosts): the temporary folder, so that the site keeps working
    const tmp = join(tmpdir(), 'portfolio-analytics.sqlite');
    console.warn(`[analytics] ${file} cannot be opened (${(e as Error).message}); using ${tmp}, which is not kept. Set TURSO_DATABASE_URL to keep the records.`);
    return (g.__ppDriver = fileDriver(openFile(tmp), {
      kind: 'temp', where: tmp, persistent: false,
      note: process.env.VERCEL ? 'Vercel ではアプリのフォルダーに書き込めないため' : 'データベースのファイルを作れないため',
    }));
  }
}

export const store = (): Store => driver().store;

export const all = <T = Row>(sql: string, ...p: Param[]) => driver().all(sql, p) as Promise<T[]>;
export const get = async <T = Row>(sql: string, ...p: Param[]) => (await driver().all(sql, p))[0] as T | undefined;
export const run = (sql: string, ...p: Param[]) => driver().run(sql, p);

/** writes several statements in one round trip, in order (Turso: one request; a file: one transaction) */
export const many = (...list: Stmt[]) => driver().many(list);

/** runs fn in one transaction (fn awaits only all / get / run) */
export const tx = <T>(fn: () => Promise<T>): Promise<T> => driver().tx(fn);

export const getMeta = async (key: string) => (await get<{ value: string }>('SELECT value FROM meta WHERE key = ?', key))?.value ?? null;
export const setMeta = (key: string, value: string) => run('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
