/*
 * Signing in to /admin.
 *  - One password. Until it is changed it is INITIAL_PASSWORD; the database keeps only its scrypt hash (meta.admin_password).
 *  - A sign-in gives the browser a signed token in an httpOnly cookie (path /admin, 7 days):
 *      <created>.<expires>.<nonce>.<HMAC-SHA256 of the first three>
 *    The HMAC key is derived from the password (scrypt with a fixed salt; meta.session_key, plus ADMIN_SESSION_SECRET
 *    when that environment variable is set), so every server instance can check the cookie by itself.
 *  - Persistent database (Turso or a file): the session must ALSO still be in admin_sessions (only the nonce's SHA-256
 *    is kept there), so signing out / "sign out the others" / a new password take effect, and a copy of the database
 *    cannot be used to sign in.
 *    Temporary database (Vercel without Turso: every instance has its own, see lib/server/db.ts): the signature alone
 *    is enough — otherwise the instance that showed /admin would not know the sign-in made on another one, and the
 *    browser would bounce between /admin and /admin/login for ever (ERR_TOO_MANY_REDIRECTS, 2026-11-20).
 *  - After 8 wrong passwords from one address in 15 minutes, that address is locked out for the rest of the 15 minutes.
 *  - Changing the password signs out every other browser (this one gets a new cookie).
 */
import 'server-only';
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { get, getMeta, run, setMeta, store } from './db';
import { clientIp } from './client';

export const INITIAL_PASSWORD = 'loveapple12345';
const COOKIE = 'pp_admin';
const SESSION_MS = 7 * 86_400_000;
const LOCK_WINDOW = 15 * 60_000, LOCK_AFTER = 8;
const N = 32768, R = 8, P = 1, KEYLEN = 32;
const KEY_SALT = Buffer.from('trust-portfolio/admin-session/v1');

const scrypt = (pw: string, salt: Buffer, o: ScryptOptions) =>
  new Promise<Buffer>((ok, ng) => scryptCb(pw.normalize('NFKC'), salt, KEYLEN, o, (e, k) => (e ? ng(e) : ok(k))));
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

async function verify(pw: string, stored: string) {
  const [alg, n, r, p, salt, key] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const want = Buffer.from(key, 'base64');
  const got = await scrypt(pw, Buffer.from(salt, 'base64'), { N: +n, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
  return got.length === want.length && timingSafeEqual(got, want);
}

/** the stored hash; the first call stores the hash of the initial password */
async function storedHash() {
  let h = await getMeta('admin_password');
  if (!h) {
    h = await hashPassword(INITIAL_PASSWORD);
    await setMeta('admin_password', h);
    await setMeta('password_initial', '1');
  }
  return h;
}

export const isInitialPassword = async () => (await getMeta('password_initial')) !== '0';

async function requestInfo() {
  const h = await headers();
  return { ip: clientIp(h), ua: (h.get('user-agent') || '').slice(0, 300), https: (h.get('x-forwarded-proto') || '').startsWith('https') };
}

/* ------------------------------------------------------------------ the signed session cookie */

// the same password gives the same key on every instance (scrypt is slow, so each result is kept in memory)
const derived = new Map<string, Promise<Buffer>>();
const keyFromPassword = (pw: string) => {
  let k = derived.get(pw);
  if (!k) { k = scrypt(pw, KEY_SALT, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 }); derived.set(pw, k); }
  return k;
};

/** the HMAC key: meta.session_key (set at sign-in and on a new password), else the initial password's */
async function sessionKey() {
  const stored = await getMeta('session_key');
  const base = stored ? Buffer.from(stored, 'base64') : await keyFromPassword(INITIAL_PASSWORD);
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret ? createHmac('sha256', secret).update(base).digest() : base;
}

const mac = (key: Buffer, body: string) => createHmac('sha256', key).update(body).digest('base64url');

/** gives this browser a new signed session cookie (and records it, for the persistent database's checks) */
async function issueSession() {
  const { ip, ua, https } = await requestInfo();
  const now = Date.now(), expires = now + SESSION_MS;
  const nonce = randomBytes(24).toString('base64url');
  const body = `${now}.${expires}.${nonce}`;
  const token = `${body}.${mac(await sessionKey(), body)}`;
  await run('DELETE FROM admin_sessions WHERE expires < ?', now);
  await run('INSERT INTO admin_sessions (token, created, expires, ip, ua) VALUES (?, ?, ?, ?, ?)', sha256(nonce), now, expires, ip, ua);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: https, path: '/admin', maxAge: SESSION_MS / 1000 });
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(password: string): Promise<LoginResult> {
  const { ip } = await requestInfo();
  const now = Date.now();
  await run('DELETE FROM login_failures WHERE ts < ?', now - LOCK_WINDOW);
  const fails = (await get<{ n: number; first: number }>('SELECT COUNT(*) AS n, MIN(ts) AS first FROM login_failures WHERE ip = ?', ip))!;
  if (fails.n >= LOCK_AFTER) {
    const min = Math.max(1, Math.ceil((fails.first + LOCK_WINDOW - now) / 60_000));
    return { ok: false, error: `パスワードを続けて間違えたため、ロックしています。${min} 分後にもう一度お試しください。` };
  }
  if (!password || !(await verify(password, await storedHash()))) {
    await run('INSERT INTO login_failures (ip, ts) VALUES (?, ?)', ip, now);
    const left = LOCK_AFTER - fails.n - 1;
    return { ok: false, error: left > 0 ? `パスワードが違います（あと ${left} 回でロックされます）。` : 'パスワードが違います。15 分間ロックします。' };
  }
  await run('DELETE FROM login_failures WHERE ip = ?', ip);
  // the key follows the real password (databases from before the signed cookie have none yet)
  const key = (await keyFromPassword(password)).toString('base64');
  if ((await getMeta('session_key')) !== key) await setMeta('session_key', key);
  await issueSession();
  return { ok: true };
}

/** the signed-in session of this request, or null */
export async function session() {
  const raw = (await cookies()).get(COOKIE)?.value;
  const m = raw?.match(/^(\d{13})\.(\d{13})\.([\w-]{32})\.([\w-]{43})$/);
  if (!m) return null;
  const [, c, e, nonce, sig] = m;
  const created = Number(c), expires = Number(e);
  if (expires <= Date.now() || created > Date.now() + 60_000) return null;
  const want = Buffer.from(mac(await sessionKey(), `${c}.${e}.${nonce}`)), got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const token = sha256(nonce);
  if (store().persistent && !(await get('SELECT 1 AS ok FROM admin_sessions WHERE token = ? AND expires > ?', token, Date.now()))) return null;
  return { token, created, expires };
}

/** for every admin page: sends a browser that is not signed in to the sign-in page */
export async function requireAdmin() {
  const s = await session();
  if (!s) redirect('/admin/login');
  return s;
}

export async function logout() {
  const s = await session();
  if (s) await run('DELETE FROM admin_sessions WHERE token = ?', s.token);
  (await cookies()).delete({ name: COOKIE, path: '/admin' });
}

export async function changePassword(current: string, next: string): Promise<LoginResult> {
  const s = await session();
  if (!s) return { ok: false, error: 'ログインし直してください。' };
  if (!(await verify(current, await storedHash()))) return { ok: false, error: '現在のパスワードが違います。' };
  if (next.length < 8) return { ok: false, error: '新しいパスワードは 8 文字以上にしてください。' };
  if (next.length > 200) return { ok: false, error: '新しいパスワードは 200 文字以内にしてください。' };
  if (next === current) return { ok: false, error: '現在と同じパスワードです。' };
  await setMeta('admin_password', await hashPassword(next));
  await setMeta('password_initial', next === INITIAL_PASSWORD ? '1' : '0');
  await setMeta('password_changed', String(Date.now()));
  // a new key: every cookie signed with the old one stops working; this browser gets a new one
  await setMeta('session_key', (await keyFromPassword(next)).toString('base64'));
  await run('DELETE FROM admin_sessions');
  await issueSession();
  return { ok: true };
}

export const signedInSessions = async () =>
  (await get<{ n: number }>('SELECT COUNT(*) AS n FROM admin_sessions WHERE expires > ?', Date.now()))?.n ?? 0;

/** signs out every browser but this one */
export async function revokeOthers() {
  const s = await session();
  if (s) await run('DELETE FROM admin_sessions WHERE token <> ?', s.token);
}
