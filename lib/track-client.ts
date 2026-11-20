/*
 * The visitor statistics, browser side (the admin dashboard reads them: app/(admin)/).
 * One "view" per page load: the <head> script (lib/track-inline.ts) opens it as the page starts loading;
 * components/Tracker.tsx then takes over here and keeps its totals up to date. The list page reports the details of a
 * video opened (VideoStage) and the site / game previews opened (SitePreview); the player reports the video's
 * playback (Player). Everything goes to POST /api/track (lib/server/track.ts). Nothing is sent from the admin pages,
 * and nothing at all when the visitor's browser asks not to be tracked (Global Privacy Control).
 */
type Msg = Record<string, unknown>;
type Win = Window & { __ppView?: Promise<{ id: number } | null>; __ppTook?: boolean };

let id: number | null = null;
let started = false;
let off = false;
const queue: Msg[] = [];
// the running totals of this page load
let activeMs = 0, activeFrom: number | null = null;
let watchMs = 0, posMs = 0, played = false, done = false, lastT = 0, lastPlaying = false;
const marks = new Set<string>();

const URL_ = '/api/track';
function send(m: Msg, beacon = false) {
  if (off) return;
  const body = JSON.stringify(m);
  if (beacon && navigator.sendBeacon) { navigator.sendBeacon(URL_, new Blob([body], { type: 'text/plain' })); return; }
  fetch(URL_, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
}
const withId = (m: Msg) => { if (id == null) queue.push(m); else send({ ...m, id }); };

const active = () => activeMs + (activeFrom != null ? performance.now() - activeFrom : 0);
function ping(beacon = false) {
  if (id == null) return;
  send({ t: 'ping', id, active: Math.round(active()), watch: Math.round(watchMs), pos: Math.round(posMs), played, done }, beacon);
}

/** takes over the view the <head> script opened (once per page load) */
export async function startView() {
  if (started) return;
  started = true;
  const w = window as Win;
  if (!w.__ppView) { off = true; return; } // admin page, Global Privacy Control, or no script
  w.__ppTook = true;
  // time in view counts from the start of the page load (performance.now() is 0 there)
  if (document.visibilityState === 'visible') activeFrom = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (activeFrom != null) { activeMs += performance.now() - activeFrom; activeFrom = null; }
      ping(true);
    } else if (activeFrom == null) activeFrom = performance.now();
  });
  addEventListener('pagehide', () => ping(true));
  setInterval(() => { if (document.visibilityState === 'visible') ping(); }, 10_000);
  const r = await w.__ppView;
  if (!r) { off = true; return; }
  id = r.id;
  queue.splice(0).forEach((m) => send({ ...m, id }));
  ping();
}

/** something happened on the page: the details of a video opened (detail), a site preview opened (site) */
export function trackEvent(name: 'detail' | 'site', target: string) {
  if (off) return;
  withId({ t: 'ev', name, target });
}

/** a milestone of the video, once per page load; the totals go along with it */
const mark = (name: string) => { if (marks.has(name)) return; marks.add(name); withId({ t: 'ev', name }); ping(); };

/** the player's video, from its state messages (about 5 a second): time watched, furthest point, quarters, the end */
export function videoState(s: { t: number; playing: boolean; ended: boolean; seeking: boolean; ready: boolean }, duration: number) {
  if (off) return;
  const playing = s.ready && s.playing && !s.seeking;
  // time watched = how far the video's own clock moved while it played (a stalled or seeking video adds nothing;
  // a jump of more than 2 s is a seek, not watching)
  const dt = s.t - lastT;
  if (playing && lastPlaying && dt > 0 && dt < 2000) watchMs += dt;
  if (lastPlaying && !playing) ping(); // paused, seeking or ended: save where they are
  lastT = s.t; lastPlaying = playing;
  if (playing && !played) { played = true; mark('play'); }
  if (s.ready) posMs = Math.max(posMs, s.t);
  if (duration > 0 && played) {
    const f = posMs / duration;
    if (f >= 0.25) mark('q25');
    if (f >= 0.5) mark('q50');
    if (f >= 0.75) mark('q75');
    if ((s.ended || posMs >= duration - 1500) && !done) { done = true; mark('complete'); }
  }
}
