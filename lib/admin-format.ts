/* Numbers, dates and times of the admin pages, in Japan time (server and browser alike). */
export const fmtN = (n: number) => Math.round(n).toLocaleString('ja-JP');
export const fmtPct = (f: number, d = 0) => `${(f * 100).toFixed(d)}%`;
export function fmtDur(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}分${s % 60 ? `${s % 60}秒` : ''}`;
  return `${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ''}`;
}
/** 1:23 or 1:02:03 */
export function fmtClockLen(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

const TZ = 'Asia/Tokyo';
const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ja-JP', { timeZone: TZ, ...o });
const dt = f({ year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const dts = f({ month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const d = f({ year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' });
const t = f({ hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** 2026/11/20 14:03 */
export const fmtDateTime = (ts: number) => (ts ? dt.format(ts) : '—');
/** 11/20 14:03 */
export const fmtShort = (ts: number) => (ts ? dts.format(ts) : '—');
/** 2026/11/20(金) */
export const fmtDay = (ts: number) => (ts ? d.format(ts) : '—');
/** 14:03:12 */
export const fmtClock = (ts: number) => (ts ? t.format(ts) : '—');

/** 3 分前・2 時間前・昨日・11/18 */
export function ago(ts: number, now = Date.now()) {
  if (!ts) return '—';
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return 'たった今';
  if (s < 3600) return `${Math.floor(s / 60)} 分前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 時間前`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} 日前`;
  return fmtShort(ts).split(' ')[0];
}
