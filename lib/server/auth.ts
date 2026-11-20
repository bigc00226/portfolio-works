/*
 * Signing in to /admin.
 *  - One password. Until it is changed it is INITIAL_PASSWORD; the database keeps only its scrypt hash (meta.admin_password).
 *  - A sign-in gives the browser a random token in an httpOnly cookie (path /admin, 7 days); the database keeps its
 *    SHA-256 (admin_sessions), so a copy of the database cannot be used to sign in.
 *  - After 8 wrong passwords from one address in 15 minutes, that address is locked out for the rest of the 15 minutes.
 *  - Changing the password signs out every other browser.
 */
import 'server-only';
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { get, getMeta, run, setMeta } from './db';
import { clientIp } from './client';

export const INITIAL_PASSWORD = 'loveapple12345';
const COOKIE = 'pp_admin';
const SESSION_MS = 7 * 86_400_000;
const LOCK_WINDOW = 15 * 60_000, LOCK_AFTER = 8;
const N = 32768, R = 8, P = 1, KEYLEN = 32;

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
  let h = getMeta('admin_password');
  if (!h) {
    h = await hashPassword(INITIAL_PASSWORD);
    setMeta('admin_password', h);
    setMeta('password_initial', '1');
  }
  return h;
}

export const isInitialPassword = () => getMeta('password_initial') !== '0';

async function requestInfo() {
  const h = await headers();
  return { ip: clientIp(h), ua: (h.get('user-agent') || '').slice(0, 300), https: (h.get('x-forwarded-proto') || '').startsWith('https') };
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(password: string): Promise<LoginResult> {
  const { ip, ua, https } = await requestInfo();
  const now = Date.now();
  run('DELETE FROM login_failures WHERE ts < ?', now - LOCK_WINDOW);
  const fails = get<{ n: number; first: number }>('SELECT COUNT(*) AS n, MIN(ts) AS first FROM login_failures WHERE ip = ?', ip)!;
  if (fails.n >= LOCK_AFTER) {
    const min = Math.max(1, Math.ceil((fails.first + LOCK_WINDOW - now) / 60_000));
    return { ok: false, error: `パスワードを続けて間違えたため、ロックしています。${min} 分後にもう一度お試しください。` };
  }
  if (!password || !(await verify(password, await storedHash()))) {
    run('INSERT INTO login_failures (ip, ts) VALUES (?, ?)', ip, now);
    const left = LOCK_AFTER - fails.n - 1;
    return { ok: false, error: left > 0 ? `パスワードが違います（あと ${left} 回でロックされます）。` : 'パスワードが違います。15 分間ロックします。' };
  }
  run('DELETE FROM login_failures WHERE ip = ?', ip);
  run('DELETE FROM admin_sessions WHERE expires < ?', now);
  const token = randomBytes(32).toString('base64url');
  run('INSERT INTO admin_sessions (token, created, expires, ip, ua) VALUES (?, ?, ?, ?, ?)', sha256(token), now, now + SESSION_MS, ip, ua);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: https, path: '/admin', maxAge: SESSION_MS / 1000 });
  return { ok: true };
}

/** the signed-in session of this request, or null */
export async function session() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = get<{ token: string; created: number; expires: number }>('SELECT token, created, expires FROM admin_sessions WHERE token = ?', sha256(token));
  return s && s.expires > Date.now() ? s : null;
}

/** for every admin page: sends a browser that is not signed in to the sign-in page */
export async function requireAdmin() {
  const s = await session();
  if (!s) redirect('/admin/login');
  return s;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run('DELETE FROM admin_sessions WHERE token = ?', sha256(token));
  jar.delete({ name: COOKIE, path: '/admin' });
}

export async function changePassword(current: string, next: string): Promise<LoginResult> {
  const s = await session();
  if (!s) return { ok: false, error: 'ログインし直してください。' };
  if (!(await verify(current, await storedHash()))) return { ok: false, error: '現在のパスワードが違います。' };
  if (next.length < 8) return { ok: false, error: '新しいパスワードは 8 文字以上にしてください。' };
  if (next.length > 200) return { ok: false, error: '新しいパスワードは 200 文字以内にしてください。' };
  if (next === current) return { ok: false, error: '現在と同じパスワードです。' };
  setMeta('admin_password', await hashPassword(next));
  setMeta('password_initial', next === INITIAL_PASSWORD ? '1' : '0');
  setMeta('password_changed', String(Date.now()));
  run('DELETE FROM admin_sessions WHERE token <> ?', s.token);
  return { ok: true };
}

export const signedInSessions = () =>
  get<{ n: number }>('SELECT COUNT(*) AS n FROM admin_sessions WHERE expires > ?', Date.now())?.n ?? 0;

/** signs out every browser but this one */
export async function revokeOthers() {
  const s = await session();
  if (s) run('DELETE FROM admin_sessions WHERE token <> ?', s.token);
}
