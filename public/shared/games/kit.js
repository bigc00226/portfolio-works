/*
 * Game kit — shared by the games of the ゲーム tab (public/games/<id>/index.html). Classic script: window.GK.
 *
 *   GK.init({ id, title, help })      call once: storage namespace, the sound / help buttons, the first-gesture audio unlock
 *   GK.store.get(k, def) / set(k, v)  localStorage under "game:<id>:" (falls back to memory when storage is blocked)
 *   GK.loadImages(['bg', 'hero'])     → { bg: <img>, hero: <img> } from img/<name>.webp (a drawn stand-in when a file fails)
 *   GK.fit(canvas, opts)              canvas sized to its box × devicePixelRatio; logical coordinates (fixed w×h or fluid)
 *   GK.loop(step)                     requestAnimationFrame loop, dt in seconds (clamped), paused while the tab is hidden
 *   GK.pointer(el, view, handlers)    pointer events (mouse / touch / pen) in the view's logical coordinates
 *   GK.keys                           Set of e.code currently held
 *   GK.sfx(name) · GK.tone(o) · GK.noise(o) · GK.music.play(song) / stop()   synthesized sound (WebAudio, no files)
 *   GK.modal(o) → Promise · GK.toast(text) · GK.help()                            overlays
 *   GK.rng(seed) · GK.tween(obj, to, ms, ease) · GK.wait(ms) · GK.ease · GK.clamp · GK.lerp · GK.fmt
 */
(function () {
  'use strict';
  const GK = (window.GK = {});
  // the storage namespace: the game's folder (/games/<id>/) until GK.init names it, so reads before GK.init land in the same place
  let ID = (/\/games\/([^/]+)/.exec(location.pathname) || [])[1] || 'game';
  let helpContent = null;

  /* ---------------- storage ---------------- */
  const mem = {};
  const key = (k, ns) => `game:${ns || ID}:${k}`;
  GK.store = {
    get(k, def, ns) {
      const kk = key(k, ns);
      try { const v = localStorage.getItem(kk); return v == null ? (kk in mem ? mem[kk] : def) : JSON.parse(v); } catch (e) { return kk in mem ? mem[kk] : def; }
    },
    set(k, v, ns) { const kk = key(k, ns); mem[kk] = v; try { localStorage.setItem(kk, JSON.stringify(v)); } catch (e) { /* blocked: memory only */ } },
    del(k, ns) { const kk = key(k, ns); delete mem[kk]; try { localStorage.removeItem(kk); } catch (e) { /* ignore */ } },
  };

  /* ---------------- small utils ---------------- */
  GK.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  GK.lerp = (a, b, t) => a + (b - a) * t;
  GK.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  GK.fmt = (n) => Number(n).toLocaleString('ja-JP');
  GK.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  GK.isPortrait = () => innerHeight > innerWidth;
  GK.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => t * (2 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    outBounce: (t) => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };

  /** seeded random (mulberry32): r() in [0, 1), r.int(n), r.range(a, b), r.pick(arr), r.shuffle(arr) (in place) */
  GK.rng = function (seed) {
    let a = (seed == null ? (Math.random() * 2 ** 32) >>> 0 : seed >>> 0) || 1;
    const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.int = (n) => Math.floor(r() * n);
    r.range = (lo, hi) => lo + r() * (hi - lo);
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    return r;
  };
  GK.random = GK.rng();

  /** animates numeric properties of obj to `to` over ms; resolves when done */
  GK.tween = function (obj, to, ms = 300, ease = GK.ease.outCubic) {
    const from = {};
    for (const k in to) from[k] = obj[k];
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms), e = ease(t);
        for (const k in to) obj[k] = from[k] + (to[k] - from[k]) * e;
        if (t < 1) requestAnimationFrame(step); else resolve(obj);
      };
      requestAnimationFrame(step);
    });
  };

  /* ---------------- images ---------------- */
  GK.images = {};
  /** loads img/<name>.webp for each name (or { key: 'file.webp' }). A failed file becomes a drawn stand-in, so the game never breaks. */
  GK.loadImages = function (list, base = 'img/') {
    const entries = Array.isArray(list) ? list.map((n) => [n, `${n}.webp`]) : Object.entries(list);
    return Promise.all(entries.map(([k, file]) => new Promise((resolve) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { GK.images[k] = im; resolve(); };
      im.onerror = () => {
        console.warn('[game] image failed:', base + file);
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const g = c.getContext('2d');
        g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, 256, 256);
        g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText(k, 128, 134);
        GK.images[k] = c;
        resolve();
      };
      im.src = base + file;
    }))).then(() => GK.images);
  };

  /* ---------------- canvas ---------------- */
  /**
   * Sizes a canvas to its CSS box × devicePixelRatio and sets the transform so the game draws in logical units.
   *   opts.w, opts.h   fixed logical size, letterboxed into the box (scale = min fit). Leave out for fluid (logical = CSS px).
   *   opts.onResize(view)  — also called once inside GK.fit, before it returns: use its argument, not the returned variable
   * Returns view: { ctx, w, h, scale, ox, oy, dpr, toLocal(clientX, clientY) → {x, y}, resize() }.
   * In fixed mode the whole canvas is cleared to transparent around the letterbox — style the canvas' parent for the bars.
   */
  GK.fit = function (canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const view = { ctx, w: opts.w || 0, h: opts.h || 0, scale: 1, ox: 0, oy: 0, dpr: 1, cssW: 0, cssH: 0 };
    view.resize = function () {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      view.dpr = dpr; view.cssW = r.width; view.cssH = r.height;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      if (opts.w && opts.h) {
        view.w = opts.w; view.h = opts.h;
        view.scale = Math.min(r.width / opts.w, r.height / opts.h);
        view.ox = (r.width - opts.w * view.scale) / 2;
        view.oy = (r.height - opts.h * view.scale) / 2;
      } else {
        view.w = r.width; view.h = r.height; view.scale = 1; view.ox = 0; view.oy = 0;
      }
      view.reset();
      if (opts.onResize) opts.onResize(view);
    };
    /** back to the logical transform (call after anything that changed it) */
    view.reset = () => ctx.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.dpr * view.ox, view.dpr * view.oy);
    view.clear = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); view.reset(); };
    view.toLocal = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      return { x: (cx - r.left - view.ox) / view.scale, y: (cy - r.top - view.oy) / view.scale };
    };
    const ro = new ResizeObserver(() => view.resize());
    ro.observe(canvas);
    view.resize();
    return view;
  };

  /* ---------------- loop & input ---------------- */
  /** step(dt, time) every frame; dt in seconds, at most 1/20. Returns { stop(), running } */
  GK.loop = function (step) {
    let last = performance.now(), id = 0, alive = true;
    const frame = (now) => {
      if (!alive) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!document.hidden) step(dt, now / 1000);
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => { last = performance.now(); });
    return { stop() { alive = false; cancelAnimationFrame(id); }, get running() { return alive; } };
  };

  GK.keys = new Set();
  const GAME_KEYS = /^(Arrow|Space$|PageUp|PageDown)/;
  addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    GK.keys.add(e.code);
    if (GAME_KEYS.test(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => GK.keys.delete(e.code));
  addEventListener('blur', () => GK.keys.clear());

  /** pointer events on el, with positions in view's logical coordinates (or element px without a view) */
  GK.pointer = function (el, view, h) {
    const pos = (e) => {
      if (view) return view.toLocal(e.clientX, e.clientY);
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    el.style.touchAction = el.style.touchAction || 'none';
    el.addEventListener('pointerdown', (e) => { try { el.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } if (h.down) h.down(pos(e), e); });
    el.addEventListener('pointermove', (e) => { if (h.move) h.move(pos(e), e); });
    el.addEventListener('pointerup', (e) => { if (h.up) h.up(pos(e), e); });
    el.addEventListener('pointercancel', (e) => { if (h.cancel) h.cancel(pos(e), e); else if (h.up) h.up(pos(e), e); });
  };

  /* ---------------- sound (WebAudio, synthesized) ---------------- */
  let ac = null, master = null, sfxBus = null, musicBus = null;
  GK.muted = GK.store.get('muted', false, '_kit');
  function audio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = GK.muted ? 0 : 0.9;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
      musicBus = ac.createGain(); musicBus.gain.value = 0.3; musicBus.connect(master);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  GK.audio = audio;
  /** the audio clock (seconds), for games that schedule notes themselves */
  GK.audioTime = () => (audio() ? ac.currentTime : 0);
  GK.audioOut = (bus) => (audio() ? (bus === 'music' ? musicBus : bus === 'master' ? master : sfxBus) : null);
  const unlock = () => { audio(); removeEventListener('pointerdown', unlock, true); removeEventListener('keydown', unlock, true); };
  addEventListener('pointerdown', unlock, true);
  addEventListener('keydown', unlock, true);

  GK.setMuted = function (m) {
    GK.muted = !!m;
    GK.store.set('muted', GK.muted, '_kit');
    if (master) master.gain.setTargetAtTime(GK.muted ? 0 : 0.9, ac.currentTime, 0.02);
    document.querySelectorAll('.gk-sound').forEach((b) => { b.setAttribute('aria-pressed', String(!GK.muted)); b.innerHTML = GK.muted ? ICON.mute : ICON.sound; b.title = GK.muted ? '音を出す' : '音を消す'; });
  };

  /** one note: { f: Hz, f2: slide to Hz, d: seconds, type: 'sine'|'square'|'triangle'|'sawtooth', v: volume, a: attack, at: delay s, bus, detune } */
  GK.tone = function (o) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime + (o.at || 0), d = o.d || 0.12, v = o.v == null ? 0.3 : o.v, a = o.a == null ? 0.004 : o.a;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f || 440, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + d);
    if (o.detune) osc.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(GK.audioOut(o.bus));
    osc.start(t); osc.stop(t + d + 0.05);
  };
  let noiseBuf = null;
  /** filtered noise burst: { d, v, f: filter Hz, q, filter: 'bandpass'|'lowpass'|'highpass', at, bus } */
  GK.noise = function (o) {
    const c = audio();
    if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const t = c.currentTime + (o.at || 0), d = o.d || 0.1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = noiseBuf; src.loop = true;
    f.type = o.filter || 'bandpass'; f.frequency.value = o.f || 1200; f.Q.value = o.q || 1;
    g.gain.setValueAtTime(o.v == null ? 0.3 : o.v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f); f.connect(g); g.connect(GK.audioOut(o.bus));
    src.start(t, Math.random()); src.stop(t + d + 0.05);
  };

  const NOTE = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  /** 'A4' → 440, 'C#5', 'Eb3' … (numbers pass through) */
  GK.freq = function (n) {
    if (typeof n === 'number') return n;
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    if (!m) return 440;
    const semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] - 4) * 12;
    return 440 * Math.pow(2, semi / 12);
  };
  /** Japanese scales (from the given root): yo 陽音階, in 都節, ritsu 律, ryukyu 琉球, plus major / minor penta */
  GK.scales = { yo: [0, 2, 5, 7, 9], in: [0, 1, 5, 7, 8], ritsu: [0, 2, 5, 7, 9], ryukyu: [0, 4, 5, 7, 11], major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], penta: [0, 2, 4, 7, 9] };
  GK.scaleFreq = (root, scale, step) => {
    const s = GK.scales[scale] || scale, n = s.length;
    const oct = Math.floor(step / n), i = ((step % n) + n) % n;
    return GK.freq(root) * Math.pow(2, (s[i] + oct * 12) / 12);
  };

  const SFX = {
    click: () => GK.tone({ f: 900, d: 0.05, type: 'triangle', v: 0.18 }),
    select: () => { GK.tone({ f: 660, d: 0.06, type: 'triangle', v: 0.2 }); GK.tone({ f: 990, d: 0.08, type: 'triangle', v: 0.18, at: 0.05 }); },
    ok: () => [660, 880, 1320].forEach((f, i) => GK.tone({ f, d: 0.12, type: 'triangle', v: 0.22, at: i * 0.07 })),
    ng: () => { GK.tone({ f: 240, f2: 150, d: 0.22, type: 'square', v: 0.12 }); },
    coin: () => { GK.tone({ f: 988, d: 0.07, type: 'square', v: 0.12 }); GK.tone({ f: 1319, d: 0.25, type: 'square', v: 0.12, at: 0.07 }); },
    pop: () => GK.tone({ f: 380, f2: 900, d: 0.09, type: 'sine', v: 0.3 }),
    hit: () => { GK.noise({ d: 0.08, v: 0.4, f: 900, q: 0.8 }); GK.tone({ f: 160, f2: 60, d: 0.1, type: 'sine', v: 0.4 }); },
    boom: () => { GK.noise({ d: 0.6, v: 0.6, f: 500, filter: 'lowpass' }); GK.tone({ f: 90, f2: 30, d: 0.5, type: 'sine', v: 0.5 }); },
    shot: () => GK.tone({ f: 1400, f2: 300, d: 0.07, type: 'square', v: 0.07 }),
    jump: () => GK.tone({ f: 280, f2: 720, d: 0.14, type: 'square', v: 0.1 }),
    power: () => GK.tone({ f: 300, f2: 1600, d: 0.35, type: 'sawtooth', v: 0.08 }),
    tick: () => GK.tone({ f: 1500, d: 0.025, type: 'square', v: 0.06 }),
    place: () => { GK.noise({ d: 0.05, v: 0.5, f: 2400, q: 4 }); GK.tone({ f: 420, f2: 260, d: 0.07, type: 'sine', v: 0.35 }); }, // wood on wood (a shogi piece, a go stone)
    card: () => GK.noise({ d: 0.06, v: 0.25, f: 3500, filter: 'highpass' }),
    splash: () => { GK.noise({ d: 0.35, v: 0.35, f: 1800, q: 0.6 }); GK.noise({ d: 0.18, v: 0.2, f: 600, q: 1, at: 0.05 }); },
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => GK.tone({ f, d: i === 5 ? 0.5 : 0.14, type: 'triangle', v: 0.22, at: [0, 0.1, 0.2, 0.3, 0.45, 0.55][i] })),
    lose: () => [440, 392, 349, 262].forEach((f, i) => GK.tone({ f, d: i === 3 ? 0.5 : 0.18, type: 'triangle', v: 0.2, at: i * 0.18 })),
  };
  /** a preset sound by name (click select ok ng coin pop hit boom shot jump power tick place card splash win lose) */
  GK.sfx = (name) => { if (!GK.muted && SFX[name]) SFX[name](); };
  GK.sfx.define = (name, fn) => { SFX[name] = fn; };

  /**
   * Background music: a tiny step sequencer (original tunes only).
   *   GK.music.play({ bpm: 96, steps: 4 (per beat), loop: true,
   *     tracks: [ { type: 'triangle', v: 0.16, notes: 'D4 - E4 . G4 A4 - - | …' }, … ],   ('.' rest, '-' hold, '|' ignored)
   *     drums: { k: 'x . . . x . . .', s: '. . x . . . x .', h: 'x x x x x x x x' } })
   */
  GK.music = (function () {
    let timer = 0, song = null, step = 0, next = 0;
    const parse = (s) => s.replace(/\|/g, ' ').trim().split(/\s+/);
    function schedule() {
      const c = ac;
      if (!c || !song) return;
      const stepDur = 60 / song.bpm / (song.steps || 4);
      while (next < c.currentTime + 0.12) {
        for (const tr of song._tracks) {
          const tok = tr.seq[step % tr.seq.length];
          if (tok && tok !== '.' && tok !== '-') {
            let len = 1;
            while (tr.seq[(step + len) % tr.seq.length] === '-' && len < tr.seq.length) len++;
            const at = next - c.currentTime;
            GK.tone({ f: GK.freq(tok), d: stepDur * len * 0.95, type: tr.type || 'triangle', v: tr.v == null ? 0.14 : tr.v, a: tr.a || 0.01, at, bus: 'music', detune: tr.detune });
          }
        }
        if (song._drums) {
          const at = next - c.currentTime;
          const hit = (row) => row && row[step % row.length] === 'x';
          if (hit(song._drums.k)) GK.tone({ f: 150, f2: 45, d: 0.16, type: 'sine', v: 0.5, at, bus: 'music' });
          if (hit(song._drums.s)) GK.noise({ d: 0.12, v: 0.22, f: 1800, q: 0.7, at, bus: 'music' });
          if (hit(song._drums.h)) GK.noise({ d: 0.03, v: 0.12, f: 7000, filter: 'highpass', at, bus: 'music' });
          if (hit(song._drums.t)) GK.tone({ f: 110, f2: 70, d: 0.25, type: 'sine', v: 0.55, at, bus: 'music' }); // taiko-like low drum
        }
        step++;
        next += stepDur;
        const len = Math.max(...song._tracks.map((t) => t.seq.length), ...(song._drums ? Object.values(song._drums).map((r) => r.length) : [1]));
        if (step >= len) { if (song.loop === false) { stop(); return; } step = 0; }
      }
    }
    function play(s) {
      stop();
      if (!audio()) return;
      song = Object.assign({}, s, {
        _tracks: (s.tracks || []).map((t) => Object.assign({}, t, { seq: parse(t.notes) })),
        _drums: s.drums ? Object.fromEntries(Object.entries(s.drums).map(([k, v]) => [k, parse(v)])) : null,
      });
      step = 0; next = ac.currentTime + 0.05;
      timer = setInterval(schedule, 25);
      schedule();
    }
    function stop() { clearInterval(timer); timer = 0; song = null; }
    return { play, stop, get playing() { return !!song; } };
  })();

  /* ---------------- overlays ---------------- */
  const ICON = {
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.9" r="1.1" fill="currentColor"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };
  GK.icons = ICON;

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /**
   * A modal card. o = { title, body (HTML string or Node), buttons: [{ label, value, primary, ghost }], dismissable (default true), wide }
   * Resolves with the chosen button's value (null when dismissed).
   */
  GK.modal = function (o = {}) {
    return new Promise((resolve) => {
      const back = el('div', 'gk-modal-back');
      const card = el('div', 'gk-modal' + (o.wide ? ' wide' : '') + (o.cls ? ' ' + o.cls : ''));
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      if (o.title) { const h = el('h2', 'gk-modal-title'); h.textContent = o.title; card.appendChild(h); }
      const body = el('div', 'gk-modal-body');
      if (o.body instanceof Node) body.appendChild(o.body); else if (o.body) body.innerHTML = o.body;
      card.appendChild(body);
      const buttons = o.buttons || [{ label: '閉じる', value: true, primary: true }];
      const close = (v) => { back.classList.add('out'); setTimeout(() => back.remove(), 180); removeEventListener('keydown', onKey, true); resolve(v); };
      if (buttons.length) {
        const act = el('div', 'gk-modal-actions');
        buttons.forEach((b) => {
          const btn = el('button', 'gk-btn' + (b.primary ? ' primary' : '') + (b.ghost ? ' ghost' : ''));
          btn.type = 'button';
          btn.innerHTML = b.label;
          btn.addEventListener('click', () => { GK.sfx('click'); close(b.value === undefined ? b.label : b.value); });
          act.appendChild(btn);
        });
        card.appendChild(act);
      }
      const dismissable = o.dismissable !== false;
      const onKey = (e) => { if (e.key === 'Escape' && dismissable) { e.stopPropagation(); close(null); } };
      addEventListener('keydown', onKey, true);
      back.addEventListener('pointerdown', (e) => { if (e.target === back && dismissable) close(null); });
      back.appendChild(card);
      document.body.appendChild(back);
      const first = card.querySelector('.gk-btn.primary') || card.querySelector('.gk-btn');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 30);
      if (o.onOpen) o.onOpen(card, close);
    });
  };

  let toastEl = null, toastTimer = 0;
  /** a short message at the bottom */
  GK.toast = function (text, ms = 1800) {
    if (!toastEl) { toastEl = el('div', 'gk-toast'); toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), ms);
  };

  /** opens the help (遊び方) given to GK.init */
  GK.help = function () {
    if (!helpContent) return Promise.resolve(null);
    const body = typeof helpContent === 'function' ? helpContent() : helpContent;
    return GK.modal({ title: '遊び方', body, wide: true, cls: 'gk-help' });
  };

  /**
   * Once per game. o = { id, title, help: HTML | () => HTML, menu: () => void (adds a menu button), hud: false (no buttons),
   *                      buttons: [{ icon: svg, label, onClick }] (extra buttons before the sound button) }
   */
  GK.init = function (o = {}) {
    ID = o.id || ID;
    helpContent = o.help || null;
    document.documentElement.classList.add('gk');
    if (GK.isTouch) document.documentElement.classList.add('gk-touch');
    if (o.hud === false) return GK;
    const hud = el('div', 'gk-hud');
    const add = (cls, html, label, fn) => {
      const b = el('button', 'gk-hud-btn ' + cls, html);
      b.type = 'button'; b.title = label; b.setAttribute('aria-label', label);
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      hud.appendChild(b);
      return b;
    };
    (o.buttons || []).forEach((b) => add('', b.icon, b.label, b.onClick));
    if (o.menu) add('gk-menu', ICON.menu, 'メニュー', o.menu);
    if (helpContent) add('gk-helpbtn', ICON.help, '遊び方', () => { GK.sfx('click'); GK.help(); });
    const s = add('gk-sound', GK.muted ? ICON.mute : ICON.sound, GK.muted ? '音を出す' : '音を消す', () => { GK.setMuted(!GK.muted); GK.sfx('click'); });
    s.setAttribute('aria-pressed', String(!GK.muted));
    document.body.appendChild(hud);
    GK.hudEl = hud;
    return GK;
  };
})();
