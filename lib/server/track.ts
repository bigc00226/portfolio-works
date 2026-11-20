/*
 * Recording what visitors do (POST /api/track, sent by components/Tracker.tsx and lib/track-client.ts).
 *   { t: 'view', path, ref, lang, tz, screen, hints }  → a new row of views (and of visitors for a new IP); answers { id }
 *   { t: 'ping', id, active, watch, pos, played, done } → the running totals of that view (only ever grow)
 *   { t: 'ev', id, name, target }                       → one row of events
 * A view can only be updated from the IP address that opened it.
 */
import 'server-only';
import { get, run, many } from './db';
import { clientIp, parseAgent, sourceOf, type Hints } from './client';
import { getVideo } from '@/lib/registry';

const EVENTS = new Set(['detail', 'site', 'play', 'q25', 'q50', 'q75', 'complete']);
const str = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);

// a simple limit per address and minute (a page sends a few messages a minute)
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now(), h = hits.get(ip);
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); if (hits.size > 5000) hits.clear(); return false; }
  return ++h.n > 120;
}

type Body = Record<string, unknown>;

export async function record(body: Body, headers: Headers): Promise<{ status: number; json?: unknown }> {
  const ip = clientIp(headers);
  if (limited(ip)) return { status: 429 };
  const now = Date.now();
  if (body.t === 'view') {
    const path = str(body.path, 300) || '/';
    if (path.startsWith('/admin')) return { status: 204 };
    const ua = (headers.get('user-agent') || '').slice(0, 500);
    const hints = (body.hints && typeof body.hints === 'object' ? body.hints : {}) as Hints;
    const a = parseAgent(ua, hints);
    const host = (headers.get('x-forwarded-host') || headers.get('host') || '').split(',')[0].trim().replace(/:\d+$/, '');
    const ref = str(body.ref, 500);
    const { host: refHost, source } = sourceOf(ref, host);
    const wm = path.match(/^\/watch\/([^/?#]+)/);
    const videoId = wm ? decodeURIComponent(wm[1]) : null;
    const kind = path === '/' ? 'home' : videoId && getVideo(videoId) ? 'watch' : 'other';
    // one round trip: the visitor (one row per address), then the view of that visitor
    const [, r] = await many(
      ['INSERT INTO visitors (ip, first_seen, last_seen) VALUES (?, ?, ?) ON CONFLICT(ip) DO UPDATE SET last_seen = excluded.last_seen', ip, now, now],
      [`INSERT INTO views (visitor_id, ts, last_ts, path, kind, video_id, referrer, ref_host, source, ua, browser, browser_ver, os, os_ver, device, is_bot, lang, tz, screen)
        SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM visitors WHERE ip = ?`,
        now, now, path, kind, kind === 'watch' ? videoId : null, ref, refHost, source, ua,
        a.browser, a.browserVer, a.os, a.osVer, a.device, a.isBot ? 1 : 0, str(body.lang, 20), str(body.tz, 60), str(body.screen, 20), ip],
    );
    if (!r.changes) return { status: 500 };
    const id = r.lastInsertRowid;
    return { status: 200, json: { id } };
  }
  const id = num(body.id, Number.MAX_SAFE_INTEGER);
  const view = id ? await get<{ id: number; visitor_id: number; video_id: string | null }>(
    'SELECT views.id, views.visitor_id, views.video_id FROM views JOIN visitors ON visitors.id = views.visitor_id WHERE views.id = ? AND visitors.ip = ?', id, ip) : undefined;
  if (!view) return { status: 404 };
  if (body.t === 'ping') {
    const len = view.video_id ? getVideo(view.video_id)?.duration ?? 0 : 0;
    const day = 86_400_000;
    await many(
      [`UPDATE views SET last_ts = ?, active_ms = MAX(active_ms, ?), watch_ms = MAX(watch_ms, ?), max_pos_ms = MAX(max_pos_ms, ?),
             played = MAX(played, ?), completed = MAX(completed, ?) WHERE id = ?`,
        now, num(body.active, day), num(body.watch, day), Math.min(num(body.pos, day), len || day), body.played ? 1 : 0, body.done ? 1 : 0, view.id],
      ['UPDATE visitors SET last_seen = MAX(last_seen, ?) WHERE id = ?', now, view.visitor_id],
    );
    return { status: 204 };
  }
  if (body.t === 'ev') {
    const name = str(body.name, 20);
    if (!EVENTS.has(name)) return { status: 400 };
    const target = str(body.target, 120) || view.video_id || '';
    // a quarter / the end of a video counts once per page load
    if (name !== 'detail' && name !== 'site' && await get('SELECT 1 FROM events WHERE view_id = ? AND name = ? AND target = ?', view.id, name, target)) return { status: 204 };
    await run('INSERT INTO events (view_id, visitor_id, ts, name, target) VALUES (?, ?, ?, ?, ?)', view.id, view.visitor_id, now, name, target);
    return { status: 204 };
  }
  return { status: 400 };
}
