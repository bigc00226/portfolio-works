/* GET /admin/export?type=visitors|views|events&range=…&bots=1 — the records as CSV (UTF-8 with BOM, for Excel). */
import { session } from '@/lib/server/auth';
import { all } from '@/lib/server/db';
import { parseRange, visitorList, pageLabel, videoTitle, targetLabel, EVENT_LABEL, type ViewRow } from '@/lib/server/stats';
import { fmtDateTime } from '@/lib/admin-format';

export const dynamic = 'force-dynamic';

const cell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"` : s;
};
const csv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';

export async function GET(req: Request) {
  if (!(await session())) return new Response('ログインしてください', { status: 401 });
  const u = new URL(req.url);
  const type = u.searchParams.get('type') ?? 'views';
  const range = await parseRange(u.searchParams.get('range') ?? 'all');
  const bots = u.searchParams.get('bots') === '1';
  let rows: unknown[][];
  if (type === 'visitors') {
    const list = await visitorList({ range, bots, q: '', sort: 'recent', showExcluded: true });
    rows = [['IP アドレス', 'メモ', '除外中', 'ボット', 'ブラウザー', 'OS', 'デバイス', '初回', '最終', '訪問', 'ページビュー', 'トップページ', '再生ページ', '再生', '完了', '見た動画', '視聴時間（秒）', '表示時間（秒）'],
      ...list.map((x) => [x.ip, x.note, x.excluded ? 1 : 0, x.bot ? 1 : 0, x.browser, x.os, x.device, fmtDateTime(x.firstSeen), fmtDateTime(x.lastSeen), x.sessions, x.views,
        x.homeViews, x.watchViews, x.plays, x.completes, x.videos.map(videoTitle).join(' / '), Math.round(x.watchMs / 1000), Math.round(x.activeMs / 1000)])];
  } else if (type === 'events') {
    const list = await all<{ ts: number; name: string; target: string; ip: string; path: string }>(`SELECT e.ts, e.name, e.target, s.ip, v.path FROM events e
      JOIN views v ON v.id = e.view_id JOIN visitors s ON s.id = e.visitor_id WHERE e.ts >= ? AND e.ts < ? AND (? = 1 OR v.is_bot = 0) ORDER BY e.ts`, range.from, range.to, bots ? 1 : 0);
    rows = [['日時', 'IP アドレス', 'ページ', '操作', '対象'], ...list.map((e) => [fmtDateTime(e.ts), e.ip, e.path, EVENT_LABEL[e.name] ?? e.name, targetLabel(e.name, e.target)])];
  } else {
    const list = await all<ViewRow>(`SELECT v.*, s.ip, s.excluded FROM views v JOIN visitors s ON s.id = v.visitor_id WHERE v.ts >= ? AND v.ts < ? AND (? = 1 OR v.is_bot = 0) ORDER BY v.ts`, range.from, range.to, bots ? 1 : 0);
    rows = [['日時', 'IP アドレス', 'ページ', 'URL', 'ブラウザー', 'OS', 'デバイス', 'ボット', '流入元', '参照元', '言語', 'タイムゾーン', '画面', '表示時間（秒）', '再生', '視聴時間（秒）', '最大到達位置（秒）', '完了', 'User-Agent'],
      ...list.map((v) => [fmtDateTime(v.ts), v.ip, pageLabel(v), v.path, `${v.browser} ${v.browser_ver}`.trim(), `${v.os} ${v.os_ver}`.trim(), v.device, v.is_bot, v.source, v.referrer,
        v.lang, v.tz, v.screen, Math.round(v.active_ms / 1000), v.played, Math.round(v.watch_ms / 1000), Math.round(v.max_pos_ms / 1000), v.completed, (v as ViewRow & { ua?: string }).ua ?? ''])];
  }
  const name = `portfolio-${type}-${range.key}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' } });
}
