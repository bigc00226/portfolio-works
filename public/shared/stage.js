/*
 * Stage — the playback core shared by the production-process videos.
 *
 * 1. A deterministic clock. Every pause of the script (wait / tween / typing gaps) is scheduled on a virtual
 *    timeline and resolved strictly in timeline order, one at a time, with the script allowed to run until it waits
 *    again. Random numbers come from a fixed seed. So the timeline is the same on every run and at any frame rate:
 *    "1:23" always shows the same thing — which is what makes a seek bar possible.
 *    Things that take real time (an iframe loading a page) are wrapped in Stage.hold(): the clock stands still
 *    until they are done.
 * 2. Seeking. Forward: the script runs ahead in turbo mode (no frame pacing, CSS transitions off) behind a cover
 *    until the target time. Backward: the page reloads with ?t= and runs ahead from the start.
 * 3. The player protocol (window.postMessage) used by watch.html, plus the old keyboard controls when the page
 *    is opened on its own (Space / R / C / H, ← → to seek).
 *
 * URL parameters: ?t=83.5 (seek, seconds)  &play=1  ?from=4 (start of scene 4)  ?to=4  ?speed=1.3  ?captions=0
 *                 ?autoplay=1  ?embed=1 (inside the player; set automatically when framed)
 */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const embedded = window.parent !== window || params.get('embed') === '1';
  const SEED = 20260416;
  const DEBUG = params.get('debug') === '1';

  /* ------------------------------------------------------------ fixed-seed random numbers */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  Math.random = mulberry32(SEED);

  /* ------------------------------------------------------------ clock */
  const Clock = { t: 0, speed: parseFloat(params.get('speed')) || 1, paused: false, ff: false, holds: 0, started: false };
  const waiters = [];          // sorted by time, then by creation order
  let seq = 0;
  const frameFns = new Set();  // called every frame (tweens, overlays that follow a target)
  const afterFns = [];         // called after frameFns
  let target = 0;              // how far the clock may run this frame (normal play)
  let seekTarget = 0;          // turbo mode: where to stop
  let pumping = false;

  function addWaiter(at, fire) {
    const w = { at, seq: seq++, fire };
    let lo = 0, hi = waiters.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (waiters[m].at <= at) lo = m + 1; else hi = m; }
    waiters.splice(lo, 0, w);
    return w;
  }
  const wait = (ms) => new Promise((r) => addWaiter(Clock.t + Math.max(0, +ms || 0), r));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function tween(ms, fn, easing = inOut) {
    ms = +ms || 0;
    return new Promise((res) => {
      const start = Clock.t;
      // end === true: the end time has come (computing (t - start) / ms may give 0.99999… there)
      const f = (end) => {
        const p = end === true || ms <= 0 ? 1 : clamp((Clock.t - start) / ms, 0, 1);
        fn(easing(p), p);
        if (p >= 1) { frameFns.delete(f); res(); }
      };
      if (ms <= 0) { f(true); return; }
      frameFns.add(f);
      f();
      addWaiter(start + ms, () => { if (frameFns.has(f)) f(true); });
    });
  }
  /** the clock stands still until `p` settles (page loads and other real-time work) */
  function hold(p) {
    Clock.holds++;
    const h0 = performance.now();
    return Promise.resolve(p).finally(() => {
      Clock.holds--;
      // (a frame loaded while seeking: no transitions in it either)
      if (Clock.ff) frameTurbo(document, true);
      if (DEBUG) console.log('[stage] hold', Math.round(performance.now() - h0), 'ms at', Math.round(Clock.t), 'started', Clock.started);
      // let the waiting script go on to its next pause first, then carry on seeking
      if (!Clock.holds && Clock.ff) setTimeout(() => settle().then(pump), 0);
    });
  }
  const twoFrames = () => hold(new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  const mc = new MessageChannel();
  const macroQ = [];
  mc.port1.onmessage = () => { const f = macroQ.shift(); if (f) f(); };
  const macrotask = () => new Promise((r) => { macroQ.push(r); mc.port2.postMessage(0); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** let the script that was just woken run on until it waits again (it lives in microtasks) */
  async function settle() {
    const s0 = seq;
    for (let k = 0; k < 24; k++) await null;
    for (let k = 0; k < 300 && seq === s0 && !Clock.holds; k++) await null;
  }

  /** resolve everything that is due, in timeline order */
  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      let slice = performance.now(), idle = 0;
      for (;;) {
        if (Clock.holds) break;
        const ff = Clock.ff;
        const lim = ff ? seekTarget : target;
        const w = waiters[0];
        if (w && w.at <= lim) {
          waiters.shift();
          if (w.at > Clock.t) Clock.t = w.at;
          // per-frame work first (tweens drawn at this time, layout sync), as a frame would before the script goes on
          runFrameFns();
          w.fire();
          await settle();
          idle = 0;
          if (ff && performance.now() - slice > 12) {
            if (DEBUG) console.log('[stage] turbo', Math.round(Clock.t), 'scene', S.scene, 'waiters', waiters.length);
            await macrotask(); slice = performance.now();
          }
          continue;
        }
        if (ff) {
          if (S.done) { finishSeek(); break; }
          // nothing due before the seek target. If nothing is scheduled at all the script may be waiting on a frame
          // or a timer that is not on the clock: give it a moment before calling the seek done.
          if (!w && (!Clock.started || idle < 30 || !isFinite(seekTarget))) {
            if (DEBUG && idle === 0) console.log('[stage] idle at', Math.round(Clock.t), 'scene', S.scene, new Error().stack.split('\n').slice(1, 3).join(' | '));
            idle++; await sleep(8); slice = performance.now(); continue;
          }
          if (Clock.t < seekTarget) Clock.t = seekTarget;
          finishSeek();
          break;
        }
        if (lim > Clock.t) Clock.t = lim;
        break;
      }
    } finally { pumping = false; }
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(100, Math.max(0, now - last));
    last = now;
    if (Clock.ff) return;
    if (Clock.started && !Clock.paused && !Clock.holds && !S.done) target = Math.max(target, Clock.t) + dt * Clock.speed;
    if (pumping) return;
    pump().then(runFrameFns);
  }
  function runFrameFns() {
    for (const f of [...frameFns]) f();
    for (const f of afterFns) f();
  }
  requestAnimationFrame(frame);

  /* ------------------------------------------------------------ runner */
  const S = {
    embedded, params, Clock, wait, tween, hold, twoFrames, frameFns, afterFns, clamp,
    ready: false, done: false, scene: -1, sceneStarts: [], cfg: null, seeking: false,
    /** timeline position in ms */
    time() { return Clock.t; },
  };
  let seekPlay = false, seekScene = null, runPromise = null;
  let seekId = parseInt(params.get('sid'), 10) || 0; // echoed to the player so it knows which seek is done
  let cmdId = parseInt(params.get('cid'), 10) || 0;  // id of the last command from the player (echoed too)
  const html = document.documentElement;
  if (embedded) html.classList.add('stage-embed');

  function cover(on) {
    const c = document.getElementById('ffCover');
    if (c) c.classList.toggle('show', on);
  }
  /**
   * While seeking, CSS transitions / animations are off (the clock jumps: a transition running in real time would be
   * caught half way). The video page does that with .stage-turbo; the pages shown in its iframes (captured sites,
   * WordPress screens) get the same rule here — else a panel sliding open in a frame is measured where it started,
   * and the pointer goes somewhere else than in normal playback.
   */
  const TURBO_CSS = '*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}';
  function frameTurbo(doc, on, depth = 0) {
    if (depth > 4 || !doc) return;
    doc.querySelectorAll('iframe').forEach((f) => {
      let d = null;
      try { d = f.contentDocument; } catch (e) { return; }
      if (!d || !d.documentElement) return;
      let s = d.getElementById('__stageTurbo');
      if (on && !s) { s = d.createElement('style'); s.id = '__stageTurbo'; s.textContent = TURBO_CSS; (d.head || d.documentElement).appendChild(s); }
      else if (!on && s) s.remove();
      frameTurbo(d, on, depth + 1);
    });
  }
  function setTurbo(on) {
    Clock.ff = on;
    html.classList.toggle('stage-turbo', on);
    frameTurbo(document, on);
    S.seeking = on;
    cover(on);
    post();
  }
  function finishSeek() {
    if (!Clock.ff) return;
    seekScene = null;
    target = Clock.t;
    Clock.paused = !seekPlay;
    setTurbo(false);
    if (S.cfg && S.cfg.afterSeek) S.cfg.afterSeek();
    runFrameFns();
    post();
  }

  async function main() {
    const cfg = S.cfg;
    Clock.started = true;
    Clock.t = 0; target = 0;
    Math.random = mulberry32(SEED);
    if (cfg.onStart) cfg.onStart();
    const to = params.has('to') ? parseInt(params.get('to'), 10) : cfg.scenes.length - 1;
    for (let i = 0; i < cfg.scenes.length && i <= to; i++) {
      S.scene = i;
      S.sceneStarts[i] = Clock.t;
      if (seekScene != null && i >= seekScene) { Clock.paused = !seekPlay; finishSeek(); }
      post();
      await cfg.scenes[i].fn();
    }
    S.done = true;
    window.__demoDone = true;
    if (Clock.ff) { if (Clock.t < seekTarget) Clock.t = Math.min(seekTarget, Clock.t); finishSeek(); }
    post();
  }

  function start(play = true) {
    if (!S.ready) return;
    if (Clock.started) { Clock.paused = !play; post(); return; }
    Clock.paused = !play;
    runPromise = main().catch((e) => { console.error(e); window.__demoError = String((e && e.stack) || e); });
    post();
  }

  /** ms on the timeline; `play` = keep playing afterwards */
  function seek(ms, play) {
    if (!S.ready) return;
    ms = Math.max(0, ms);
    if (play == null) play = Clock.started && !Clock.paused && !S.done;
    if (Clock.started && ms < Clock.t - 1) { reloadAt(ms, play); return; }
    if (S.done) return;
    seekTarget = ms; seekPlay = play;
    setTurbo(true);
    if (!Clock.started) start(true); // the script starts; turbo carries it to the target
    pump();
  }
  function seekToScene(i, play) {
    seekScene = i; seekPlay = play; seekTarget = Infinity;
    setTurbo(true);
    start(true);
    pump();
  }
  function reloadAt(ms, play) {
    const p = new URLSearchParams(location.search);
    p.delete('from');
    p.set('t', (ms / 1000).toFixed(3));
    p.set('play', play ? '1' : '0');
    cover(true);
    S.seeking = true;
    post({ reloading: true });
    location.replace(location.pathname + '?' + p.toString());
  }

  /* ------------------------------------------------------------ player protocol */
  function state(extra) {
    return Object.assign({
      __stage: 1, type: 'state', t: Clock.t, started: Clock.started, playing: Clock.started && !Clock.paused && !S.done,
      ready: S.ready, seeking: S.seeking, seekId, cid: cmdId, ended: S.done, scene: S.scene, captions: !document.body.classList.contains('no-captions'),
    }, extra || {});
  }
  function post(extra) {
    if (window.parent === window) return;
    try { window.parent.postMessage(state(extra), '*'); } catch (e) {}
  }
  setInterval(() => post(), 200);
  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.__player !== 1) return;
    if (m.cid) cmdId = m.cid;
    // play / pause while a seek is running: the seek ends in that state (it would otherwise restore the old one)
    if (m.cmd === 'play') { if (Clock.ff) seekPlay = true; start(true); }
    else if (m.cmd === 'pause') { if (Clock.ff) seekPlay = false; if (Clock.started) { Clock.paused = true; post(); } }
    else if (m.cmd === 'toggle') {
      if (Clock.ff) { seekPlay = !seekPlay; post(); }
      else if (!Clock.started) start(true);
      else if (!S.done) { Clock.paused = !Clock.paused; post(); }
    }
    else if (m.cmd === 'seek') { if (m.id) seekId = m.id; seek(m.t, m.play); }
    else if (m.cmd === 'captions') { document.body.classList.toggle('no-captions', !m.on); post(); }
    else if (m.cmd === 'hello') post();
    // the player's controls are showing: lift the captions above them (px of this page)
    else if (m.cmd === 'ui') html.style.setProperty('--player-pad', Math.max(0, Math.round(m.pad || 0)) + 'px');
  });

  /* standalone keyboard controls */
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!Clock.started) start(true);
      else if (Clock.ff) seekPlay = !seekPlay;
      else if (!S.done) Clock.paused = !Clock.paused;
      post();
      return;
    }
    if (embedded) return;
    if (e.key === 'r' || e.key === 'R') location.replace(location.pathname + location.search.replace(/[?&](t|play|from)=[^&]*/g, ''));
    else if (e.key === 'c' || e.key === 'C') document.body.classList.toggle('no-captions');
    else if (e.key === 'h' || e.key === 'H') { const h = document.getElementById('hint'); if (h) h.classList.toggle('hide'); }
    else if (e.key === 'ArrowRight') seek(Clock.t + 5000);
    else if (e.key === 'ArrowLeft') seek(Clock.t - 5000);
  });
  document.addEventListener('mousedown', (e) => e.preventDefault(), true);

  /**
   * cfg: { scenes: [{name, fn}], prepare(fast) -> Promise, onReady?(), onStart?(), afterSeek?() }
   * prepare(fast): fast is true when the page was reloaded for a seek (fonts / images are in the cache already)
   */
  S.run = async function (cfg) {
    S.cfg = cfg;
    if (params.get('captions') === '0') document.body.classList.add('no-captions');
    const seekT = params.has('t') ? parseFloat(params.get('t')) : null;
    const from = Math.max(0, parseInt(params.get('from') || '0', 10) || 0);
    if (seekT != null || from > 0) cover(true);
    try {
      await cfg.prepare(seekT != null);
    } catch (e) {
      console.error(e);
      window.__demoError = String((e && e.stack) || e);
      return;
    }
    S.ready = true;
    window.__demoReady = true;
    if (cfg.onReady) cfg.onReady();
    post();
    if (seekT != null) seek(seekT * 1000, params.get('play') === '1');
    else if (from > 0) seekToScene(from, params.get('autoplay') === '1');
    else if (params.get('autoplay') === '1') setTimeout(() => start(true), 1500);
  };
  S.debugState = () => ({ t: Clock.t, holds: Clock.holds, ff: Clock.ff, paused: Clock.paused, pumping, target, seekTarget, waiters: waiters.slice(0, 5).map((w) => w.at), scene: S.scene });
  S.start = start;
  S.seek = seek;
  S.pause = () => { Clock.paused = true; post(); };

  window.Stage = S;
  window.__demoStartScenario = () => start(true);
})();
