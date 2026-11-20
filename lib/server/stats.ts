/*
 * The figures of the admin dashboard, from the analytics database (lib/server/db.ts).
 * Times are shown in Japan time (UTC+9, no daylight saving). Visitors marked "excluded" never count; bots
 * (crawlers, headless browsers) only count when the dashboard asks for them.
 * Volumes of a portfolio are small, so the rows of the period are read once and summed up here.
 */
import 'server-only';
import { all, get } from './db';
import { videos, getVideo, sites } from '@/lib/registry';
import { PLATFORMS, platformOf } from '@/lib/platforms';
import { DEVICE_LABEL, SOURCE_LABEL } from './client';

export const HOUR = 3_600_000, DAY = 86_400_000;
const OFF = 9 * HOUR; // Asia/Tokyo
const SESSION_GAP = 30 * 60_000;

export const dayKey = (ts: number) => new Date(ts + OFF).toISOString().slice(0, 10);
export const startOfDay = (ts: number) => Math.floor((ts + OFF) / DAY) * DAY - OFF;
const hourOf = (ts: number) => new Date(ts + OFF).getUTCHours();
const weekdayOf = (ts: number) => (new Date(ts + OFF).getUTCDay() + 6) % 7; // Monday = 0
const md = (key: string) => `${+key.slice(5, 7)}/${+key.slice(8, 10)}`;

/* ------------------------------------------------------------------ period */

export const RANGES = [
  { key: '24h', label: '24 時間' },
  { key: '7d', label: '7 日間' },
  { key: '30d', label: '30 日間' },
  { key: '90d', label: '90 日間' },
  { key: '365d', label: '1 年間' },
  { key: 'all', label: '全期間' },
] as const;
export type RangeKey = (typeof RANGES)[number]['key'];
export type Range = { key: RangeKey; label: string; from: number; to: number; prev: [number, number] | null; hourly: boolean };

export async function parseRange(key: string | undefined, now = Date.now()): Promise<Range> {
  const r = RANGES.find((x) => x.key === key) ?? RANGES[2];
  if (r.key === '24h') return { key: r.key, label: r.label, from: now - DAY, to: now, prev: [now - 2 * DAY, now - DAY], hourly: true };
  if (r.key === 'all') {
    const first = (await get<{ t: number | null }>('SELECT MIN(ts) AS t FROM views'))?.t ?? null;
    const from = startOfDay(first ?? now - 29 * DAY);
    return { key: r.key, label: r.label, from: Math.min(from, startOfDay(now) - 6 * DAY), to: now, prev: null, hourly: false };
  }
  const days = parseInt(r.key, 10);
  const from = startOfDay(now) - (days - 1) * DAY;
  return { key: r.key, label: r.label, from, to: now, prev: [from - days * DAY, from], hourly: false };
}

/** the buckets of the period: hours for 24 h, else days */
function buckets(r: Range) {
  const out: { key: string; label: string; from: number; to: number }[] = [];
  if (r.hourly) {
    const start = Math.floor(r.from / HOUR) * HOUR + HOUR;
    for (let t = start - HOUR; t < r.to; t += HOUR) out.push({ key: String(t), label: `${hourOf(t)}時`, from: t, to: t + HOUR });
    return out.slice(-24);
  }
  for (let t = startOfDay(r.from); t < r.to; t += DAY) { const k = dayKey(t); out.push({ key: k, label: md(k), from: t, to: t + DAY }); }
  return out;
}

/* ------------------------------------------------------------------ rows */

export type ViewRow = {
  id: number; visitor_id: number; ip: string; ts: number; last_ts: number; path: string; kind: string; video_id: string | null;
  referrer: string; ref_host: string; source: string; browser: string; browser_ver: string; os: string; os_ver: string; device: string;
  is_bot: number; lang: string; tz: string; screen: string; active_ms: number; watch_ms: number; max_pos_ms: number; played: number; completed: number;
  excluded: number;
};
export type EventRow = { id: number; view_id: number; visitor_id: number; ts: number; name: string; target: string };

const VIEW_COLS = `v.id, v.visitor_id, s.ip, v.ts, v.last_ts, v.path, v.kind, v.video_id, v.referrer, v.ref_host, v.source, v.browser, v.browser_ver,
  v.os, v.os_ver, v.device, v.is_bot, v.lang, v.tz, v.screen, v.active_ms, v.watch_ms, v.max_pos_ms, v.played, v.completed, s.excluded`;

function views(from: number, to: number, bots: boolean) {
  return all<ViewRow>(`SELECT ${VIEW_COLS} FROM views v JOIN visitors s ON s.id = v.visitor_id
    WHERE v.ts >= ? AND v.ts < ? AND s.excluded = 0 AND (? = 1 OR v.is_bot = 0) ORDER BY v.ts`, from, to, bots ? 1 : 0);
}
function events(from: number, to: number, bots: boolean) {
  return all<EventRow>(`SELECT e.id, e.view_id, e.visitor_id, e.ts, e.name, e.target FROM events e
    JOIN views v ON v.id = e.view_id JOIN visitors s ON s.id = e.visitor_id
    WHERE e.ts >= ? AND e.ts < ? AND s.excluded = 0 AND (? = 1 OR v.is_bot = 0) ORDER BY e.ts`, from, to, bots ? 1 : 0);
}

/* ------------------------------------------------------------------ labels */

export const videoTitle = (id: string | null | undefined) => (id ? getVideo(id)?.title ?? id : '');
const siteName = new Map(Object.values(sites).flat().map((s) => [s.id, s.name] as const));
export const targetLabel = (name: string, target: string) => (name === 'site' ? siteName.get(target) ?? target : videoTitle(target));
export function pageLabel(v: Pick<ViewRow, 'kind' | 'path' | 'video_id'>) {
  if (v.kind === 'home') return 'トップページ（動画一覧）';
  if (v.kind === 'watch') return `再生ページ：${videoTitle(v.video_id)}`;
  return v.path;
}
export const EVENT_LABEL: Record<string, string> = {
  detail: '動画の詳細を開いた', site: 'サイトのプレビューを開いた', play: '再生を始めた', q25: '25% まで見た', q50: '50% まで見た', q75: '75% まで見た', complete: '最後まで見た',
};
export const browserName = (v: Pick<ViewRow, 'browser' | 'browser_ver'>) => `${v.browser}${v.browser_ver ? ` ${v.browser_ver}` : ''}`;
export const osName = (v: Pick<ViewRow, 'os' | 'os_ver'>) => `${v.os}${v.os_ver ? ` ${v.os_ver}` : ''}`;
export const deviceName = (d: string) => DEVICE_LABEL[d] ?? d;
export const sourceName = (s: string) => SOURCE_LABEL[s] ?? s;
const pct = (v: ViewRow) => {
  const len = v.video_id ? getVideo(v.video_id)?.duration ?? 0 : 0;
  return len ? Math.min(1, v.max_pos_ms / len) : 0;
};

/* ------------------------------------------------------------------ sessions */

export type Session = { visitor: number; start: number; end: number; views: ViewRow[]; events: number; active: number };

function sessionsOf(vs: ViewRow[], evByView: Map<number, EventRow[]>): Session[] {
  const byVisitor = new Map<number, ViewRow[]>();
  vs.forEach((v) => { const a = byVisitor.get(v.visitor_id); if (a) a.push(v); else byVisitor.set(v.visitor_id, [v]); });
  const out: Session[] = [];
  byVisitor.forEach((list, visitor) => {
    let cur: Session | null = null;
    for (const v of list) {
      if (!cur || v.ts - cur.end > SESSION_GAP) { cur = { visitor, start: v.ts, end: v.last_ts, views: [], events: 0, active: 0 }; out.push(cur); }
      cur.views.push(v);
      cur.end = Math.max(cur.end, v.last_ts);
      cur.events += evByView.get(v.id)?.length ?? 0;
      cur.active += v.active_ms;
    }
  });
  return out;
}
const bounced = (s: Session) => s.views.length === 1 && s.events === 0 && !s.views[0].played;

/* ------------------------------------------------------------------ dashboard */

type Kpis = { visitors: number; newVisitors: number; views: number; sessions: number; bounce: number; avgSession: number;
  plays: number; completes: number; completion: number; watchMs: number; details: number; siteOpens: number; avgPct: number };

async function kpis(vs: ViewRow[], es: EventRow[], from: number): Promise<Kpis> {
  const evByView = groupBy(es, (e) => e.view_id);
  const ss = sessionsOf(vs, evByView);
  const visitors = new Set(vs.map((v) => v.visitor_id));
  const firstSeen = new Map<number, number>();
  if (visitors.size) {
    (await all<{ visitor_id: number; first: number }>('SELECT visitor_id, MIN(ts) AS first FROM views GROUP BY visitor_id')).forEach((r) => firstSeen.set(r.visitor_id, r.first));
  }
  const played = vs.filter((v) => v.played && v.kind === 'watch');
  const plays = played.length, completes = vs.filter((v) => v.completed).length;
  return {
    visitors: visitors.size,
    newVisitors: [...visitors].filter((id) => (firstSeen.get(id) ?? 0) >= from).length,
    views: vs.length,
    sessions: ss.length,
    bounce: ss.length ? ss.filter(bounced).length / ss.length : 0,
    avgSession: ss.length ? ss.reduce((a, s) => a + s.active, 0) / ss.length : 0,
    plays, completes, completion: plays ? completes / plays : 0,
    watchMs: vs.reduce((a, v) => a + v.watch_ms, 0),
    details: es.filter((e) => e.name === 'detail').length,
    siteOpens: es.filter((e) => e.name === 'site').length,
    avgPct: plays ? played.reduce((a, v) => a + pct(v), 0) / plays : 0,
  };
}

function groupBy<T, K>(xs: T[], key: (x: T) => K) {
  const m = new Map<K, T[]>();
  xs.forEach((x) => { const k = key(x); const a = m.get(k); if (a) a.push(x); else m.set(k, [x]); });
  return m;
}
/** counts of distinct visitors per label, largest first; past `keep` labels the rest fold into その他 */
function share(pairs: [string, number][], keep = 99) {
  const m = new Map<string, Set<number>>();
  pairs.forEach(([label, vis]) => { if (!m.has(label)) m.set(label, new Set()); m.get(label)!.add(vis); });
  const rows = [...m].map(([label, s]) => ({ label, n: s.size })).sort((a, b) => b.n - a.n);
  if (rows.length <= keep) return rows;
  const head = rows.slice(0, keep - 1), rest = rows.slice(keep - 1);
  return [...head, { label: 'その他', n: rest.reduce((a, r) => a + r.n, 0) }];
}

export type VideoStat = { id: string; title: string; platform: string; platformLabel: string; duration: number;
  views: number; viewers: number; plays: number; completes: number; watchMs: number; avgPct: number; details: number; detailViewers: number; lastTs: number };

function videoStats(vs: ViewRow[], es: EventRow[]): VideoStat[] {
  return videos.map((x) => {
    const w = vs.filter((v) => v.kind === 'watch' && v.video_id === x.id);
    const p = w.filter((v) => v.played);
    const d = es.filter((e) => e.name === 'detail' && e.target === x.id);
    const plat = platformOf(x.tool);
    return {
      id: x.id, title: x.title, platform: plat, platformLabel: PLATFORMS.find((q) => q.key === plat)?.label ?? plat, duration: x.duration,
      views: w.length, viewers: new Set(w.map((v) => v.visitor_id)).size, plays: p.length, completes: w.filter((v) => v.completed).length,
      watchMs: w.reduce((a, v) => a + v.watch_ms, 0), avgPct: p.length ? p.reduce((a, v) => a + pct(v), 0) / p.length : 0,
      details: d.length, detailViewers: new Set(d.map((e) => e.visitor_id)).size,
      lastTs: Math.max(0, ...w.map((v) => v.ts), ...d.map((e) => e.ts)),
    };
  });
}

/** share of the played views that reached each 5 % of the video */
function retention(played: ViewRow[]) {
  return Array.from({ length: 21 }, (_, i) => {
    const p = i * 5;
    return { p, share: played.length ? played.filter((v) => pct(v) * 100 >= p - 0.001).length / played.length : 0 };
  });
}

export async function dashboard(r: Range, bots: boolean) {
  const [vs, es] = await Promise.all([views(r.from, r.to, bots), events(r.from, r.to, bots)]);
  const evByView = groupBy(es, (e) => e.view_id);
  const k = await kpis(vs, es, r.from);
  const prev = r.prev ? await kpis(...(await Promise.all([views(r.prev[0], r.prev[1], bots), events(r.prev[0], r.prev[1], bots)])), r.prev[0]) : null;

  // over time
  const bk = buckets(r);
  const series = bk.map((b) => {
    const v = vs.filter((x) => x.ts >= b.from && x.ts < b.to), e = es.filter((x) => x.ts >= b.from && x.ts < b.to);
    return {
      key: b.key, label: b.label,
      views: v.length, visitors: new Set(v.map((x) => x.visitor_id)).size,
      home: v.filter((x) => x.kind === 'home').length, watch: v.filter((x) => x.kind === 'watch').length,
      plays: v.filter((x) => x.played).length, completes: v.filter((x) => x.completed).length,
      watchMin: Math.round(v.reduce((a, x) => a + x.watch_ms, 0) / 6000) / 10,
      avgPct: (() => { const p = v.filter((x) => x.kind === 'watch' && x.played); return p.length ? p.reduce((a, x) => a + pct(x), 0) / p.length : 0; })(),
      avgActive: v.length ? v.reduce((a, x) => a + x.active_ms, 0) / v.length : 0,
      details: e.filter((x) => x.name === 'detail').length, sites: e.filter((x) => x.name === 'site').length,
    };
  });

  // when: weekday × hour
  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  vs.forEach((v) => { heat[weekdayOf(v.ts)][hourOf(v.ts)]++; });

  // calendar: the last 26 weeks up to the end of the period, visitors per day
  const calTo = startOfDay(r.to) + DAY;
  const calFrom = calTo - 26 * 7 * DAY;
  const calRows = await all<{ ts: number; visitor_id: number }>(`SELECT v.ts, v.visitor_id FROM views v JOIN visitors s ON s.id = v.visitor_id
    WHERE v.ts >= ? AND v.ts < ? AND s.excluded = 0 AND (? = 1 OR v.is_bot = 0)`, calFrom, calTo, bots ? 1 : 0);
  const calMap = new Map<string, Set<number>>();
  calRows.forEach((x) => { const d = dayKey(x.ts); if (!calMap.has(d)) calMap.set(d, new Set()); calMap.get(d)!.add(x.visitor_id); });
  const calendar = [];
  for (let t = calFrom; t < calTo; t += DAY) { const d = dayKey(t); calendar.push({ day: d, n: calMap.get(d)?.size ?? 0, weekday: weekdayOf(t) }); }

  // who: browsers, systems, devices, where from
  const browsers = share(vs.map((v) => [v.browser || '不明', v.visitor_id]), 6);
  const browserVersions = share(vs.map((v) => [browserName(v), v.visitor_id]));
  const oses = share(vs.map((v) => [v.os || '不明', v.visitor_id]), 6);
  const osVersions = share(vs.map((v) => [osName(v), v.visitor_id]));
  const devices = share(vs.map((v) => [deviceName(v.device), v.visitor_id]));
  const ss = sessionsOf(vs, evByView);
  const sources = (() => {
    const m = new Map<string, number>();
    ss.forEach((s) => { const l = sourceName(s.views[0].source); m.set(l, (m.get(l) ?? 0) + 1); });
    return [...m].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
  })();
  const referrers = (() => {
    const m = new Map<string, number>();
    ss.forEach((s) => { const h = s.views[0].ref_host; if (h && s.views[0].source !== 'internal') m.set(h, (m.get(h) ?? 0) + 1); });
    return [...m].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n).slice(0, 10);
  })();
  const langs = share(vs.map((v) => [v.lang || '不明', v.visitor_id]), 8);

  // what: pages, videos
  const pages = (() => {
    const m = new Map<string, { label: string; views: number; visitors: Set<number> }>();
    vs.forEach((v) => {
      const key = v.kind === 'watch' ? `w:${v.video_id}` : v.path;
      if (!m.has(key)) m.set(key, { label: pageLabel(v), views: 0, visitors: new Set() });
      const x = m.get(key)!; x.views++; x.visitors.add(v.visitor_id);
    });
    return [...m.values()].map((x) => ({ label: x.label, n: x.views, visitors: x.visitors.size })).sort((a, b) => b.n - a.n).slice(0, 12);
  })();
  const vstats = videoStats(vs, es);
  const played = vs.filter((v) => v.kind === 'watch' && v.played);
  const hist = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}〜${i * 10 + 10}%`, n: 0 }));
  played.forEach((v) => { hist[Math.min(9, Math.floor(pct(v) * 10))].n++; });

  // the path to the end of a video, in visitors
  const setOf = (f: (v: ViewRow) => boolean) => new Set(vs.filter(f).map((v) => v.visitor_id));
  const detailVis = new Set(es.filter((e) => e.name === 'detail').map((e) => e.visitor_id));
  const watchVis = setOf((v) => v.kind === 'watch');
  const half = new Set([...es.filter((e) => e.name === 'q50').map((e) => e.visitor_id), ...played.filter((v) => pct(v) >= 0.5).map((v) => v.visitor_id)]);
  const funnel = [
    { label: 'サイトを訪問', n: k.visitors },
    { label: '動画に関心（詳細・再生ページ）', n: new Set([...detailVis, ...watchVis]).size },
    { label: '再生ページを開いた', n: watchVis.size },
    { label: '再生した', n: setOf((v) => !!v.played).size },
    { label: '半分まで見た', n: half.size },
    { label: '最後まで見た', n: setOf((v) => !!v.completed).size },
  ];

  // platforms: interest (details opened) and plays, as shares of their totals
  const usedPlatforms = PLATFORMS.filter((p) => videos.some((v) => platformOf(v.tool) === p.key));
  const totDetails = vstats.reduce((a, v) => a + v.details, 0), totPlays = vstats.reduce((a, v) => a + v.plays, 0);
  const radar = usedPlatforms.map((p) => {
    const vv = vstats.filter((v) => v.platform === p.key);
    return { key: p.key, label: p.label, details: totDetails ? vv.reduce((a, v) => a + v.details, 0) / totDetails : 0, plays: totPlays ? vv.reduce((a, v) => a + v.plays, 0) / totPlays : 0 };
  });
  const treemap = usedPlatforms.map((p) => ({
    key: p.key, label: p.label,
    children: vstats.filter((v) => v.platform === p.key && v.watchMs > 0).map((v) => ({ id: v.id, label: v.title, value: v.watchMs })).sort((a, b) => b.value - a.value),
  })).filter((g) => g.children.length);

  // flow: where from → first page → what they did
  const flow = (() => {
    const links = new Map<string, number>();
    const add = (a: string, b: string) => links.set(`${a}\u0000${b}`, (links.get(`${a}\u0000${b}`) ?? 0) + 1);
    ss.forEach((s) => {
      const src = sourceName(s.views[0].source).replace(/（.*）/, '');
      const entry = s.views[0].kind === 'home' ? '入口：トップページ' : s.views[0].kind === 'watch' ? '入口：再生ページ' : '入口：そのほか';
      const evs = s.views.flatMap((v) => evByView.get(v.id) ?? []);
      const out = s.views.some((v) => v.played) ? '動画を再生した' : evs.some((e) => e.name === 'detail' || e.name === 'site') ? '詳細・プレビューを見た' : '見ただけで離脱';
      add(src, entry); add(entry, out);
    });
    return [...links].map(([k2, n]) => { const [a, b] = k2.split('\u0000'); return { from: a, to: b, n }; });
  })();

  // the latest page loads, with what happened on them
  const recent = [...vs].reverse().slice(0, 40).map((v) => viewItem(v, evByView.get(v.id) ?? []));
  const people = (await visitorsInRange(vs, es)).slice(0, 15);

  return {
    kpi: k, prev, series, heat, calendar, browsers, browserVersions, oses, osVersions, devices, sources, referrers, langs,
    pages, videos: vstats, retention: retention(played), hist, funnel, radar, treemap, flow, recent, people,
    scatter: vstats.filter((v) => v.plays > 0).map((v) => ({ id: v.id, label: v.title, platform: v.platformLabel, x: v.plays, y: Math.round(v.avgPct * 1000) / 10, size: v.watchMs })),
    live: await live(bots),
    totals: await totals(),
    now: Date.now(),
  };
}

export type ViewItem = ReturnType<typeof viewItem>;
function viewItem(v: ViewRow, evs: EventRow[]) {
  const len = v.video_id ? getVideo(v.video_id)?.duration ?? 0 : 0;
  return {
    id: v.id, visitor: v.visitor_id, ip: v.ip, ts: v.ts, lastTs: v.last_ts, page: pageLabel(v), path: v.path, kind: v.kind, videoId: v.video_id,
    browser: browserName(v), os: osName(v), device: deviceName(v.device), bot: !!v.is_bot, source: sourceName(v.source), refHost: v.ref_host,
    active: v.active_ms, watch: v.watch_ms, pct: len ? Math.min(1, v.max_pos_ms / len) : 0, played: !!v.played, completed: !!v.completed,
    lang: v.lang, tz: v.tz, screen: v.screen,
    events: evs.map((e) => ({ ts: e.ts, name: e.name, label: EVENT_LABEL[e.name] ?? e.name, target: targetLabel(e.name, e.target) })),
  };
}

/** who is on the site right now (a message within the last 90 s) */
async function live(bots: boolean) {
  const now = Date.now();
  const rows = await all<ViewRow>(`SELECT ${VIEW_COLS} FROM views v JOIN visitors s ON s.id = v.visitor_id
    WHERE v.last_ts >= ? AND s.excluded = 0 AND (? = 1 OR v.is_bot = 0) ORDER BY v.last_ts DESC`, now - 90_000, bots ? 1 : 0);
  const seen = new Set<number>();
  return rows.filter((v) => (seen.has(v.visitor_id) ? false : (seen.add(v.visitor_id), true))).map((v) => ({ ip: v.ip, visitor: v.visitor_id, page: pageLabel(v), browser: browserName(v), os: osName(v) }));
}

async function totals() {
  return (await get<{ visitors: number; views: number; events: number; first: number | null }>(
    'SELECT (SELECT COUNT(*) FROM visitors) AS visitors, (SELECT COUNT(*) FROM views) AS views, (SELECT COUNT(*) FROM events) AS events, (SELECT MIN(ts) FROM views) AS first'))!;
}

/* ------------------------------------------------------------------ visitors */

export type VisitorSummary = {
  id: number; ip: string; firstSeen: number; lastSeen: number; excluded: boolean; note: string; bot: boolean;
  browser: string; os: string; device: string; agents: number; views: number; sessions: number; homeViews: number; watchViews: number;
  plays: number; completes: number; videos: string[]; watchMs: number; activeMs: number; details: number;
};

function summarize(id: number, ip: string, firstSeen: number, lastSeen: number, excluded: number, note: string, vs: ViewRow[], es: EventRow[]): VisitorSummary {
  const last = vs[vs.length - 1];
  const played = vs.filter((v) => v.played && v.video_id);
  return {
    id, ip, firstSeen: vs.length ? Math.min(firstSeen, vs[0].ts) : firstSeen, lastSeen: Math.max(lastSeen, last?.last_ts ?? 0), excluded: !!excluded, note, bot: vs.length > 0 && vs.every((v) => v.is_bot),
    browser: last ? browserName(last) : '', os: last ? osName(last) : '', device: last ? deviceName(last.device) : '',
    agents: new Set(vs.map((v) => `${browserName(v)}|${osName(v)}|${v.device}`)).size,
    views: vs.length, sessions: sessionsOf(vs, groupBy(es, (e) => e.view_id)).length,
    homeViews: vs.filter((v) => v.kind === 'home').length, watchViews: vs.filter((v) => v.kind === 'watch').length,
    plays: played.length, completes: vs.filter((v) => v.completed).length,
    videos: [...new Set(played.map((v) => v.video_id!))],
    watchMs: vs.reduce((a, v) => a + v.watch_ms, 0), activeMs: vs.reduce((a, v) => a + v.active_ms, 0),
    details: es.filter((e) => e.name === 'detail').length,
  };
}

async function visitorsInRange(vs: ViewRow[], es: EventRow[]) {
  const evs = groupBy(es, (e) => e.visitor_id);
  const meta = new Map((await all<{ id: number; first_seen: number; last_seen: number; note: string }>('SELECT id, first_seen, last_seen, note FROM visitors')).map((x) => [x.id, x]));
  return [...groupBy(vs, (v) => v.visitor_id)].map(([id, list]) => {
    const m = meta.get(id)!;
    return summarize(id, list[0].ip, m.first_seen, m.last_seen, 0, m.note, list, evs.get(id) ?? []);
  }).sort((a, b) => b.lastSeen - a.lastSeen);
}

export type VisitorSort = 'recent' | 'views' | 'watch' | 'first' | 'ip';
export async function visitorList(o: { range: Range; bots: boolean; q: string; sort: VisitorSort; showExcluded: boolean }) {
  const vs = await all<ViewRow>(`SELECT ${VIEW_COLS} FROM views v JOIN visitors s ON s.id = v.visitor_id
    WHERE v.ts >= ? AND v.ts < ? AND (? = 1 OR v.is_bot = 0) AND (? = 1 OR s.excluded = 0) ORDER BY v.ts`, o.range.from, o.range.to, o.bots ? 1 : 0, o.showExcluded ? 1 : 0);
  const es = await all<EventRow>('SELECT id, view_id, visitor_id, ts, name, target FROM events WHERE ts >= ? AND ts < ?', o.range.from, o.range.to);
  const evs = groupBy(es, (e) => e.visitor_id);
  const meta = new Map((await all<{ id: number; first_seen: number; last_seen: number; excluded: number; note: string }>('SELECT id, first_seen, last_seen, excluded, note FROM visitors')).map((x) => [x.id, x]));
  const q = o.q.trim().toLowerCase();
  let list = [...groupBy(vs, (v) => v.visitor_id)].map(([id, l]) => {
    const m = meta.get(id)!;
    return summarize(id, l[0].ip, m.first_seen, m.last_seen, m.excluded, m.note, l, evs.get(id) ?? []);
  });
  if (q) list = list.filter((x) => [x.ip, x.browser, x.os, x.device, x.note].some((s) => s.toLowerCase().includes(q)) || x.videos.some((id) => videoTitle(id).toLowerCase().includes(q)));
  const by: Record<VisitorSort, (a: VisitorSummary, b: VisitorSummary) => number> = {
    recent: (a, b) => b.lastSeen - a.lastSeen, views: (a, b) => b.views - a.views || b.lastSeen - a.lastSeen,
    watch: (a, b) => b.watchMs - a.watchMs || b.lastSeen - a.lastSeen, first: (a, b) => b.firstSeen - a.firstSeen,
    ip: (a, b) => a.ip.localeCompare(b.ip, 'en', { numeric: true }),
  };
  return list.sort(by[o.sort] ?? by.recent);
}

export async function visitorDetail(id: number) {
  const s = await get<{ id: number; ip: string; first_seen: number; last_seen: number; excluded: number; note: string }>('SELECT * FROM visitors WHERE id = ?', id);
  if (!s) return null;
  const vs = await all<ViewRow>(`SELECT ${VIEW_COLS} FROM views v JOIN visitors s ON s.id = v.visitor_id WHERE v.visitor_id = ? ORDER BY v.ts`, id);
  const es = await all<EventRow>('SELECT id, view_id, visitor_id, ts, name, target FROM events WHERE visitor_id = ? ORDER BY ts', id);
  const evByView = groupBy(es, (e) => e.view_id);
  const summary = summarize(s.id, s.ip, s.first_seen, s.last_seen, s.excluded, s.note, vs, es);
  const sessions = sessionsOf(vs, evByView).reverse().map((x) => ({
    start: x.start, end: x.end, active: x.active, source: sourceName(x.views[0].source), refHost: x.views[0].ref_host,
    views: x.views.map((v) => viewItem(v, evByView.get(v.id) ?? [])),
  }));
  const agents = [...groupBy(vs, (v) => `${browserName(v)}|${osName(v)}|${v.device}`)].map(([, l]) => ({
    browser: browserName(l[0]), os: osName(l[0]), device: deviceName(l[0].device), bot: !!l[0].is_bot, lang: l[l.length - 1].lang, tz: l[l.length - 1].tz,
    screen: l[l.length - 1].screen, ua: '', first: l[0].ts, last: l[l.length - 1].ts, views: l.length,
  }));
  const uas = await all<{ ua: string; n: number }>('SELECT ua, COUNT(*) AS n FROM views WHERE visitor_id = ? GROUP BY ua ORDER BY n DESC', id);
  const watched = videos.map((x) => {
    const w = vs.filter((v) => v.kind === 'watch' && v.video_id === x.id);
    const d = es.filter((e) => e.name === 'detail' && e.target === x.id);
    if (!w.length && !d.length) return null;
    return { id: x.id, title: x.title, platform: PLATFORMS.find((p) => p.key === platformOf(x.tool))?.label ?? '', duration: x.duration,
      views: w.length, plays: w.filter((v) => v.played).length, best: Math.max(0, ...w.map(pct)), watchMs: w.reduce((a, v) => a + v.watch_ms, 0),
      completed: w.some((v) => v.completed), details: d.length, last: Math.max(0, ...w.map((v) => v.ts), ...d.map((e) => e.ts)) };
  }).filter((x): x is NonNullable<typeof x> => !!x).sort((a, b) => b.last - a.last);
  const daily = new Map<string, number>();
  vs.forEach((v) => daily.set(dayKey(v.ts), (daily.get(dayKey(v.ts)) ?? 0) + 1));
  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  vs.forEach((v) => { heat[weekdayOf(v.ts)][hourOf(v.ts)]++; });
  const calTo = startOfDay(Date.now()) + DAY, calFrom = calTo - 26 * 7 * DAY;
  const calendar = [];
  for (let t = calFrom; t < calTo; t += DAY) { const d = dayKey(t); calendar.push({ day: d, n: daily.get(d) ?? 0, weekday: weekdayOf(t) }); }
  return { summary, sessions, agents, uas, watched, heat, calendar };
}

/* ------------------------------------------------------------------ history */

export async function history(o: { range: Range; bots: boolean; q: string; kind: string; video: string; page: number; per: number }) {
  const where = ['v.ts >= ?', 'v.ts < ?', '(? = 1 OR v.is_bot = 0)'];
  const p: (string | number)[] = [o.range.from, o.range.to, o.bots ? 1 : 0];
  if (o.q) { where.push('(s.ip LIKE ? OR v.browser LIKE ? OR v.os LIKE ?)'); p.push(`%${o.q}%`, `%${o.q}%`, `%${o.q}%`); }
  if (o.kind === 'home' || o.kind === 'watch') { where.push('v.kind = ?'); p.push(o.kind); }
  if (o.kind === 'played') where.push('v.played = 1');
  if (o.video) { where.push('v.video_id = ?'); p.push(o.video); }
  const w = where.join(' AND ');
  const total = (await get<{ n: number }>(`SELECT COUNT(*) AS n FROM views v JOIN visitors s ON s.id = v.visitor_id WHERE ${w}`, ...p))!.n;
  const rows = await all<ViewRow>(`SELECT ${VIEW_COLS} FROM views v JOIN visitors s ON s.id = v.visitor_id WHERE ${w} ORDER BY v.ts DESC LIMIT ? OFFSET ?`, ...p, o.per, (o.page - 1) * o.per);
  const ids = rows.map((r) => r.id);
  const es = ids.length ? await all<EventRow>(`SELECT id, view_id, visitor_id, ts, name, target FROM events WHERE view_id IN (${ids.map(() => '?').join(',')}) ORDER BY ts`, ...ids) : [];
  const evByView = groupBy(es, (e) => e.view_id);
  return { total, rows: rows.map((v) => ({ ...viewItem(v, evByView.get(v.id) ?? []), excluded: !!v.excluded })) };
}

/* ------------------------------------------------------------------ one video */

export async function videoReport(id: string, r: Range, bots: boolean) {
  const x = getVideo(id);
  if (!x) return null;
  const [allVs, allEs] = await Promise.all([views(r.from, r.to, bots), events(r.from, r.to, bots)]);
  const vs = allVs.filter((v) => v.kind === 'watch' && v.video_id === id);
  const es = allEs.filter((e) => e.target === id);
  const played = vs.filter((v) => v.played);
  const bk = buckets(r).map((b) => ({
    key: b.key, label: b.label,
    views: vs.filter((v) => v.ts >= b.from && v.ts < b.to).length,
    plays: played.filter((v) => v.ts >= b.from && v.ts < b.to).length,
    details: es.filter((e) => e.name === 'detail' && e.ts >= b.from && e.ts < b.to).length,
  }));
  // which chapter the viewers stopped in
  const chapters = x.chapterList.map((c, i) => ({
    name: c.name, t: c.t,
    reached: played.filter((v) => v.max_pos_ms >= c.t).length,
    stopped: played.filter((v) => v.max_pos_ms >= c.t && (i + 1 >= x.chapterList.length || v.max_pos_ms < x.chapterList[i + 1].t) && !v.completed).length,
  }));
  const viewers = [...groupBy(vs, (v) => v.visitor_id)].map(([vid, l]) => ({
    visitor: vid, ip: l[0].ip, browser: browserName(l[l.length - 1]), os: osName(l[l.length - 1]), views: l.length,
    best: Math.max(...l.map(pct)), watchMs: l.reduce((a, v) => a + v.watch_ms, 0), completed: l.some((v) => v.completed), last: l[l.length - 1].ts,
  })).sort((a, b) => b.last - a.last);
  return { video: { id: x.id, title: x.title, client: x.client, tool: x.tool, duration: x.duration }, stat: videoStats(allVs, allEs).find((s) => s.id === id)!, retention: retention(played), series: bk, chapters, viewers };
}

export async function videoTable(r: Range, bots: boolean) {
  const [vs, es] = await Promise.all([views(r.from, r.to, bots), events(r.from, r.to, bots)]);
  return videoStats(vs, es);
}
