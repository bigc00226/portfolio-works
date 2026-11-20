/*
 * The analytics database (SQLite) — Node's built-in node:sqlite, no native package to install.
 * File: data/analytics.sqlite (or ANALYTICS_DB_PATH). It is created with its tables on first use.
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
 * Server-side only.
 */
import 'server-only';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

// one connection per server process (kept on globalThis so that the dev server's reloads do not open more)
const g = globalThis as unknown as { __ppDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__ppDb) return g.__ppDb;
  // loaded at run time: the bundler leaves Node's own modules alone this way
  const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');
  const file = dbPath();
  mkdirSync(dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  d.exec(SCHEMA);
  g.__ppDb = d;
  return d;
}

export type Row = Record<string, string | number | null>;
type Param = string | number | null;

// node:sqlite gives rows without a prototype; they become plain objects (the pages pass them on to client components)
export const all = <T = Row>(sql: string, ...p: Param[]) => db().prepare(sql).all(...p).map((r) => ({ ...r })) as unknown as T[];
export const get = <T = Row>(sql: string, ...p: Param[]) => { const r = db().prepare(sql).get(...p); return (r ? { ...r } : undefined) as unknown as T | undefined; };
export const run = (sql: string, ...p: Param[]) => db().prepare(sql).run(...p);

/** runs fn in one transaction */
export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec('BEGIN');
  try { const r = fn(); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; }
}

export const getMeta = (key: string) => get<{ value: string }>('SELECT value FROM meta WHERE key = ?', key)?.value ?? null;
export const setMeta = (key: string, value: string) => run('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
