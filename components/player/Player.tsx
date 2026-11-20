'use client';
/*
 * Player for the production-process videos — /watch/<id>?t=<seconds>&autoplay=1&captions=0
 *
 * The video is its own page public/videos/<id>/index.html (1920×1080) in an iframe; it plays on its own deterministic clock
 * (public/shared/stage.js) and talks to this page with postMessage:
 *   player → video  {__player: 1, cmd: 'play' | 'pause' | 'toggle' | 'seek' (t ms, play) | 'captions' (on) | 'ui' (pad) | 'hello'}
 *   video  → player {__stage: 1, type: 'state', t, started, playing, ready, seeking, ended, scene, captions}
 * Seeking forward runs the video ahead in place; seeking back reloads the video page at that time (?t=).
 * React draws the markup; the controller below drives it directly (it repaints the seek bar every frame).
 */
import { useEffect, useRef } from 'react';
import { paths } from '@/lib/paths';
import { videoState } from '@/lib/track-client';

type VideoInfo = { id: string; title: string; client: string; tool: string };
type Chapter = { t: number; title: string };
type Props = { video: VideoInfo; duration: number; chapters: Chapter[]; others: { id: string; title: string }[] };
type StageState = { t: number; started: boolean; playing: boolean; ready: boolean; seeking: boolean; ended: boolean; scene: number;
  captions?: boolean; reloading?: boolean; seekId?: number; cid?: number };

const IDLE_MS = 2600;
const ic = {
  play: <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" /></svg>,
  pause: <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" /></svg>,
  back10: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" /><path d="M4.5 4.5V9H9" /><text x="12" y="15.6" fill="currentColor" stroke="none" fontSize="7.4" fontFamily="Segoe UI, sans-serif" fontWeight="700" textAnchor="middle">10</text></svg>,
  fwd10: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9" /><path d="M19.5 4.5V9H15" /><text x="12" y="15.6" fill="currentColor" stroke="none" fontSize="7.4" fontFamily="Segoe UI, sans-serif" fontWeight="700" textAnchor="middle">10</text></svg>,
  full: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>,
  exit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>,
  keys: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9" /></svg>,
};
const REPLAY = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 5V2L7.5 6.5 12 11V7.5a5.5 5.5 0 1 1-5.5 5.5H4a8 8 0 1 0 8-8z"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z"/></svg>';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/** the running time (whole seconds passed) */
const fmt = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** the length of the video, rounded like on the list page (lib/paths fmtTime) */
const fmtLen = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function Player({ video, duration, chapters, others }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const CHAPTERS = chapters.length ? chapters : [{ t: 0, title: '' }];

  useEffect(() => {
    const pl = root.current!;
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => pl.querySelector<T>(s)!;
    const frame = $('.pl-frame'), iframe = $<HTMLIFrameElement>('iframe'), bar = $('.pl-bar'), knob = $('.pl-knob'), tipEl = $('.pl-tip');
    const big = $('.pl-big'), timeEl = $('.pl-time'), chapName = $('.pl-chapname'), btnCc = $('.pl-cc'), keys = $('.pl-keys'), ctrl = $('.pl-ctrl');
    const params = new URLSearchParams(location.search);
    const DURATION = duration;
    const base = paths.video(video.id);
    let captions = params.get('captions') !== '0';
    let alive = true;

    /* ---------- scale the 1920×1080 page to the window */
    let scale = 1, lastPad = -1;
    function fit() {
      const W = innerWidth, H = innerHeight, s = Math.min(W / 1920, H / 1080);
      scale = s;
      frame.style.transform = `translate(${(W - 1920 * s) / 2}px, ${(H - 1080 * s) / 2}px) scale(${s})`;
      setTimeout(() => sendPad(), 0);
    }

    /* ---------- talking to the video */
    let st: StageState = { t: 0, started: false, playing: false, ready: false, seeking: false, ended: false, scene: -1 };
    let stAt = performance.now();
    let pending: { t: number | null; play: boolean } | null = null; // to send once the video is ready
    let seekingTo: number | null = null;                             // shown on the bar until the video got there
    let seekId = 0;                                                  // the video echoes the id of the last seek it finished
    let cmdId = 0;                                                   // …and of the last command it received: older states must not undo a click
    let wantPlay = false;                                            // what the viewer asked for last (the button shows this)
    let loadingSrc = false;
    const send = (m: Record<string, unknown>) => { try { iframe.contentWindow?.postMessage({ __player: 1, ...m }, '*'); } catch { /* not loaded yet */ } };
    const command = (m: Record<string, unknown>) => send({ cid: ++cmdId, ...m });
    function load(q: string) {
      loadingSrc = true;
      st = { ...st, ready: false };
      iframe.src = `${base}?embed=1${captions ? '' : '&captions=0'}&cid=${cmdId}${q}`;
      render();
    }
    function onMessage(e: MessageEvent) {
      const m = e.data as StageState & { __stage?: number };
      if (!m || m.__stage !== 1 || e.source !== iframe.contentWindow) return;
      const was = st;
      st = m; stAt = performance.now();
      videoState(m, DURATION);
      if (m.ready) loadingSrc = false;
      if (seekingTo != null && m.ready && !m.seeking && !m.reloading && m.seekId === seekId) seekingTo = null;
      // a state sent before the video got the last click still says the old thing: keep what the viewer asked for
      const current = (m.cid || 0) >= cmdId && !m.seeking && seekingTo == null && !pending;
      if (current && m.ready) wantPlay = !!m.playing;
      if (m.ready && !was.ready && pending) { const p = pending; pending = null; doSeekOrPlay(p); }
      if (m.ready && m.captions !== captions) send({ cmd: 'captions', on: captions });
      if (m.ready && !was.ready) { lastPad = -1; sendPad(); }
      render();
    }
    // ask for a state until the video answers (its page may still be loading)
    const hello = setInterval(() => { if (!st.ready) send({ cmd: 'hello' }); }, 400);

    function doSeekOrPlay(p: { t: number | null; play: boolean }) {
      if (p.t == null) { command({ cmd: p.play ? 'play' : 'pause' }); return; }
      seekTo(p.t, p.play);
    }
    function play() {
      if (st.ended) { seekTo(0, true); return; }
      wantPlay = true;
      pl.classList.add('started');
      // still loading (or reloading for a seek): play as soon as the video is ready, keeping a seek that is waiting
      if (!st.ready) { pending = pending ? { ...pending, play: true } : { t: null, play: true }; render(); return; }
      command({ cmd: 'play' });
      render();
    }
    function pause() {
      wantPlay = false;
      if (!st.ready) { if (pending) pending.play = false; render(); return; }
      command({ cmd: 'pause' });
      render();
    }
    function toggle() { if (wantPlay && !st.ended) pause(); else play(); flash(wantPlay ? 'play' : 'pause'); }
    function now() {
      if (seekingTo != null) return seekingTo;
      let t = st.t;
      if (st.playing && wantPlay && !st.seeking) t += Math.min(400, performance.now() - stAt);
      return Math.max(0, Math.min(DURATION || t, t));
    }
    function seekTo(ms: number, playAfter?: boolean) {
      ms = Math.max(0, Math.min(DURATION ? DURATION - 1 : ms, ms));
      const keepPlaying = playAfter != null ? playAfter : wantPlay;
      wantPlay = keepPlaying;
      pl.classList.add('started');
      seekingTo = ms;
      if (!st.ready) { pending = { t: ms, play: keepPlaying }; render(); return; }
      seekId++;
      cmdId++;
      if (st.started && ms < st.t - 30) load(`&t=${(ms / 1000).toFixed(3)}&play=${keepPlaying ? 1 : 0}&sid=${seekId}`);
      else send({ cmd: 'seek', t: ms, play: keepPlaying, id: seekId, cid: cmdId });
      st.ended = false;
      render();
    }

    /* ---------- controls */
    const chapEls = [...pl.querySelectorAll<HTMLElement>('.pl-chap')].map((el, i) => ({
      el, t0: CHAPTERS[i].t, t1: i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].t : DURATION || 1, title: CHAPTERS[i].title,
    }));
    const chapterAt = (ms: number) => { let k = 0; CHAPTERS.forEach((c, i) => { if (ms >= c.t) k = i; }); return CHAPTERS[k]; };
    let hoverMs: number | null = null;
    let dragMs: number | null = null;
    function paintBar(ms: number) {
      chapEls.forEach((c) => {
        const f = Math.max(0, Math.min(1, (ms - c.t0) / (c.t1 - c.t0)));
        (c.el.lastChild as HTMLElement).style.width = f * 100 + '%';
        const h = hoverMs == null ? 0 : Math.max(0, Math.min(1, (hoverMs - c.t0) / (c.t1 - c.t0)));
        (c.el.firstChild as HTMLElement).style.width = h * 100 + '%';
      });
      knob.style.left = (DURATION ? ms / DURATION : 0) * bar.getBoundingClientRect().width + 'px';
    }
    function render() {
      const busy = loadingSrc || seekingTo != null || st.seeking || (pl.classList.contains('started') && !st.ready);
      pl.classList.toggle('busy', busy && pl.classList.contains('started'));
      pl.classList.toggle('playing', wantPlay && !st.ended);
      pl.classList.toggle('ended', !!st.ended);
      if (st.started) pl.classList.add('started');
      big.innerHTML = st.ended ? REPLAY : PLAY;
      big.setAttribute('aria-label', st.ended ? 'もう一度再生' : '再生');
      btnCc.classList.toggle('on', captions);
    }
    let raf = 0;
    function tick() {
      const t = dragMs != null ? dragMs : now();
      timeEl.textContent = `${st.ended ? fmtLen(DURATION) : fmt(t)} / ${fmtLen(DURATION)}`;
      const name = chapterAt(t)?.title ?? '';
      if (chapName.textContent !== name) chapName.textContent = name;
      paintBar(t);
      raf = requestAnimationFrame(tick);
    }

    /* seek bar: hover tooltip, click, drag */
    const msAt = (clientX: number) => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * DURATION; };
    function tip(clientX: number) {
      const r = bar.getBoundingClientRect(), ms = msAt(clientX);
      hoverMs = ms;
      const c = chapterAt(ms);
      tipEl.innerHTML = `${c && c.title ? `<small>${esc(c.title)}</small>` : ''}${fmt(ms)}`;
      const w = tipEl.offsetWidth;
      tipEl.style.left = Math.max(w / 2, Math.min(r.width - w / 2, clientX - r.left)) + 'px';
      chapEls.forEach((ce) => ce.el.classList.toggle('hov', ms >= ce.t0 && ms < ce.t1));
    }
    const on = (el: EventTarget, ev: string, fn: (e: never) => void, o?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn as EventListener, o);
      return () => el.removeEventListener(ev, fn as EventListener, o);
    };
    let clickTimer = 0, idleTimer = 0;
    const flashEl = $('.pl-flash');
    function flash(kind: 'play' | 'pause') {
      flashEl.innerHTML = kind === 'play' ? PLAY : PAUSE;
      flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go');
    }
    function fullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    }

    /* hide the controls and the pointer while the mouse rests */
    const overControls = () => ctrl.matches(':hover') || $('.pl-top').matches(':hover') || pl.classList.contains('drag') || keys.classList.contains('show');
    function wake() {
      pl.classList.remove('idle');
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(function rest() {
        if (overControls()) { idleTimer = window.setTimeout(rest, 800); return; }
        pl.classList.add('idle');
      }, IDLE_MS);
    }
    /** while the controls show, the video's captions move up above them */
    function sendPad() {
      if (!alive) return;
      const shown = !pl.classList.contains('idle');
      const frameBottom = (innerHeight + 1080 * scale) / 2;
      const controlsTop = ctrl.getBoundingClientRect().top + 60; // below the gradient padding
      const overlap = shown ? Math.max(0, frameBottom - controlsTop) / scale : 0; // in px of the video page
      const pad = Math.max(0, overlap - 58); // the captions sit 66px above the bottom of the video
      if (Math.abs(pad - lastPad) < 1) return;
      lastPad = pad;
      send({ cmd: 'ui', pad });
    }
    const mo = new MutationObserver(sendPad);
    mo.observe(pl, { attributes: true, attributeFilter: ['class'] });

    const off = [
      on(window, 'resize', fit),
      on(window, 'message', onMessage),
      on(bar, 'pointermove', (e: PointerEvent) => { tip(e.clientX); if (dragMs != null) dragMs = msAt(e.clientX); }),
      on(bar, 'pointerleave', () => { if (dragMs == null) { hoverMs = null; chapEls.forEach((ce) => ce.el.classList.remove('hov')); } }),
      on(bar, 'pointerdown', (e: PointerEvent) => {
        e.preventDefault();
        bar.setPointerCapture(e.pointerId);
        pl.classList.add('drag');
        dragMs = msAt(e.clientX);
        tip(e.clientX);
      }),
      on(bar, 'pointerup', (e: PointerEvent) => {
        if (dragMs == null) return;
        const ms = msAt(e.clientX);
        dragMs = null;
        pl.classList.remove('drag');
        seekTo(ms);
      }),
      on(big, 'click', (e: MouseEvent) => { e.stopPropagation(); play(); }),
      on($('#btnPlay'), 'click', toggle),
      on($('#btnBack'), 'click', () => seekTo(now() - 10000)),
      on($('#btnFwd'), 'click', () => seekTo(now() + 10000)),
      on(btnCc, 'click', () => { captions = !captions; send({ cmd: 'captions', on: captions }); render(); }),
      on($('#btnKeys'), 'click', () => keys.classList.toggle('show')),
      on($('#btnFs'), 'click', fullscreen),
      on(document, 'fullscreenchange', () => { pl.classList.toggle('fs', !!document.fullscreenElement); fit(); }),
      on($('.pl-hit'), 'click', () => {
        clearTimeout(clickTimer);
        if (!pl.classList.contains('started')) { play(); return; }
        clickTimer = window.setTimeout(toggle, 220);
      }),
      on($('.pl-hit'), 'dblclick', () => { clearTimeout(clickTimer); if (st.started) fullscreen(); }),
      // buttons never take the keyboard focus: Space on a focused button would press it as well as toggle the video
      on(document, 'mousedown', (e: MouseEvent) => { if ((e.target as Element).closest('button')) e.preventDefault(); }),
      on(document, 'keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key.toLowerCase();
        let handled = true;
        if (k === ' ' || k === 'k') { if (!e.repeat) { if (!pl.classList.contains('started')) play(); else toggle(); } }
        else if (k === 'arrowright') seekTo(now() + 5000);
        else if (k === 'arrowleft') seekTo(now() - 5000);
        else if (k === 'l') seekTo(now() + 10000);
        else if (k === 'j') seekTo(now() - 10000);
        else if (k === 'home') seekTo(0);
        else if (k === 'end') seekTo(DURATION - 1500);
        else if (/^[0-9]$/.test(k)) seekTo(DURATION * (+k / 10));
        else if (k === 'f') fullscreen();
        else if (k === 'c') btnCc.click();
        else if (k === '?') keys.classList.toggle('show');
        else handled = false;
        if (handled) { e.preventDefault(); wake(); }
      }),
      ...(['pointermove', 'pointerdown', 'wheel'] as const).map((ev) => on(window, ev, wake, { passive: true })),
      on(document, 'pointerleave', () => { if (!overControls()) { clearTimeout(idleTimer); pl.classList.add('idle'); } }),
    ];

    /* ---------- go */
    fit();
    raf = requestAnimationFrame(tick);
    wake();
    const startT = parseFloat(params.get('t') || '');
    if (Number.isFinite(startT) && startT > 0) { pending = { t: startT * 1000, play: params.get('autoplay') === '1' }; seekingTo = startT * 1000; pl.classList.add('started'); }
    else if (params.get('autoplay') === '1') pending = { t: null, play: true };
    load('');
    render();
    (window as unknown as { __player: unknown }).__player = { st: () => st, seekTo, play, pause, now };

    return () => {
      alive = false;
      off.forEach((f) => f());
      mo.disconnect();
      cancelAnimationFrame(raf);
      clearInterval(hello);
      clearTimeout(idleTimer);
      clearTimeout(clickTimer);
    };
    // the player is set up once per page (the props never change while it lives)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = duration || 1;
  return (
    <div className="pl" ref={root}>
      <div className="pl-frame">
        <iframe title={video.title} allow="fullscreen" />
        {/* eslint-disable-next-line @next/next/no-img-element -- the poster is drawn at the video page's own 1920×1080 size */}
        <img className="pl-poster" src={paths.thumb(video.id)} alt="" />
      </div>
      <div className="pl-hit" />
      <div className="pl-busy"><div className="pl-spin" /></div>
      <div className="pl-end">
        <div className="pl-next">
          {others.map((o) => (
            <a key={o.id} href={paths.watch(o.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={paths.thumb(o.id)} alt="" loading="lazy" /><span><small>次の動画</small>{o.title}</span>
            </a>
          ))}
        </div>
      </div>
      <button className="pl-big" aria-label="再生" dangerouslySetInnerHTML={{ __html: PLAY }} />
      <div className="pl-flash" />
      <header className="pl-top">
        {/* a full page load on purpose: the list page has its own root layout (app/(site)) */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="pl-back" href="/#special">{ic.back}動画一覧</a>
        <div className="pl-title"><b>{video.title}</b><small>{video.client} ・ {video.tool}</small></div>
      </header>
      <div className="pl-ctrl">
        <div className="pl-bar">
          <div className="pl-chaps">
            {CHAPTERS.map((c, i) => (
              <div key={i} className="pl-chap" style={{ flex: `${Math.max(0.0001, (i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].t : total) - c.t)} 1 0` }}><i /><b /></div>
            ))}
          </div>
          <div className="pl-knob" />
          <div className="pl-tip" />
        </div>
        <div className="pl-row">
          <button className="pl-btn" id="btnPlay" aria-label="再生 / 一時停止 (k)"><span className="ic-play">{ic.play}</span><span className="ic-pause">{ic.pause}</span></button>
          <button className="pl-btn sm" id="btnBack" aria-label="10 秒戻る (j)">{ic.back10}</button>
          <button className="pl-btn sm" id="btnFwd" aria-label="10 秒進む (l)">{ic.fwd10}</button>
          <span className="pl-time">0:00 / {fmtLen(duration)}</span>
          <span className="pl-chapname" />
          <span className="pl-sp" />
          <button className="pl-btn sm" id="btnKeys" aria-label="キー操作">{ic.keys}</button>
          <button className="pl-btn pl-cc on" id="btnCc" aria-label="字幕 (c)"><span>CC</span></button>
          <button className="pl-btn" id="btnFs" aria-label="全画面 (f)"><span className="ic-full">{ic.full}</span><span className="ic-exit">{ic.exit}</span></button>
        </div>
      </div>
      <div className="pl-keys">
        <div><kbd>Space</kbd>再生 / 一時停止（<kbd>K</kbd>も可）</div>
        <div><kbd>←</kbd><kbd>→</kbd>5 秒戻る / 進む　<kbd>J</kbd><kbd>L</kbd>10 秒</div>
        <div><kbd>0</kbd>〜<kbd>9</kbd>動画の 0〜90% の位置へ</div>
        <div><kbd>C</kbd>字幕の表示 / 非表示　<kbd>F</kbd>全画面</div>
      </div>
    </div>
  );
}
