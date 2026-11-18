/*
 * 花明かりの写真館 — the visual-novel engine.
 * The story is data (script.js, format in data.js). This file: layout, the text window (typewriter, auto, skip of read text),
 * backlog, save / load with thumbnails, settings, choices & flags, transitions and effects, sprites, CGs, the gallery, endings,
 * chapter select, petals (canvas) and the original music (GK.music).
 */
(function () {
  'use strict';
  const N = window.NOVEL;
  const SCRIPT = N.parse(N.script);
  if (SCRIPT.errors.length) console.warn('[novel] script:', SCRIPT.errors);
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ================= records & settings ================= */
  const store = GK.store;
  const G_DEF = () => ({ ends: {}, cgs: {}, chapters: {}, read: {}, plays: 0 });
  const G = Object.assign(G_DEF(), store.get('global', {}));
  let gDirty = false;
  const saveG = () => { gDirty = false; store.set('global', G); };
  setInterval(() => { if (gDirty) saveG(); }, 2500);
  const gvars = () => { const o = { ends: Object.keys(G.ends).length }; Object.keys(G.ends).forEach((k) => { o['end_' + k] = 1; }); return o; };
  const SET_DEF = { text: 5, auto: 5, bgm: 7, se: 7, win: 7 };
  const SET = Object.assign({}, SET_DEF, store.get('settings', {}));
  const saveSET = () => store.set('settings', SET);
  const TEXT_CPS = [0, 9, 14, 20, 27, 36, 47, 60, 78, 105, Infinity];
  const autoDelay = (len) => [0, 3400, 2900, 2500, 2100, 1750, 1450, 1200, 950, 750, 550][SET.auto] + len * (64 - SET.auto * 5);

  /* ================= DOM ================= */
  const root = document.documentElement;
  const frame = $('#frame'), screenEl = $('#screen'), sceneEl = $('#scene'), bgEl = $('#bg'), charsEl = $('#chars'), cgEl = $('#cg'), tintEl = $('#tint');
  const vignetteEl = $('#vignette'), fxEl = $('#fx'), chapterEl = $('#chapter'), badgeEl = $('#badge'), chapName = $('#chapName');
  const msgEl = $('#msg'), nameEl = $('#nameplate'), textEl = $('#text'), choicesEl = $('#choices');
  const titleEl = $('#title'), endingEl = $('#ending'), viewerEl = $('#viewer'), petalCanvas = $('#petals');
  const textV = h('span', 'v'), waitEl = h('span', 'wm'), textH = h('span', 'h');
  textEl.append(textV, waitEl, textH);

  /* ================= layout ================= */
  let portrait = false;
  function layout() {
    const W = innerWidth, H = innerHeight;
    portrait = W / H < 1.15;
    root.classList.toggle('portrait', portrait);
    let fw, fh, sw, sh, top = 0, quick = 0;
    if (!portrait) {
      fw = Math.min(W, (H * 16) / 9); fh = (fw * 9) / 16; sw = fw; sh = fh;
    } else {
      fw = W; fh = H; top = 52; quick = 60;
      const minMsg = Math.max(176, H * 0.25);
      sw = W; sh = Math.round(Math.max((W * 9) / 16, Math.min(H - top - quick - minMsg, W * 1.12)));
    }
    frame.style.width = fw + 'px'; frame.style.height = fh + 'px';
    const chh = portrait ? Math.min(sh * 0.95, sw * 0.62 * 1.5) : sh * 0.97;
    const s = frame.style;
    s.setProperty('--u', (portrait ? Math.min(W, 600) / 100 : fw / 100) + 'px');
    s.setProperty('--top', top + 'px'); s.setProperty('--sw', sw + 'px'); s.setProperty('--sh', sh + 'px');
    s.setProperty('--quickh', quick + 'px'); s.setProperty('--chh', chh + 'px');
    Object.entries(charEls).forEach(([id, el]) => { const c = st.vis.chars[id]; if (c) el.style.left = posPct(c.pos) + '%'; });
  }
  addEventListener('resize', layout);

  /* ================= state ================= */
  const freshVis = () => ({ bg: null, cg: null, chars: {}, bgm: null, sepia: false, tint: 'none', petals: 'off' });
  const st = { pc: 0, flags: {}, vis: freshVis(), chapter: null, chapterTitle: '', log: [], here: null };
  let gen = 0, mode = 'loading', cur = null, choiceCur = null, clickWaiter = null, autoTimer = 0;
  let auto = false, skipping = false, ctrlHeld = false, hiddenWin = false, forceRead = false;
  const charEls = {};

  /* ================= sound ================= */
  let audioOn = false;
  function applyVolumes() {
    const mb = GK.audioOut('music'), sb = GK.audioOut('sfx');
    if (mb) mb.gain.value = 0.34 * (SET.bgm / 7);
    if (sb) sb.gain.value = 0.55 * (SET.se / 7);
  }
  const unlockAudio = () => {
    if (audioOn) return;
    audioOn = true; applyVolumes();
    if (mode === 'title') playBgm('title', true);
    else if (st.vis.bgm) playBgm(st.vis.bgm, true);
  };
  addEventListener('pointerdown', unlockAudio, true);
  addEventListener('keydown', unlockAudio, true);

  const arp = (chords) => chords.map((c) => { const [a, b, d] = c.split(' '); return `${a} ${b} ${d} ${b} ${a} ${b} ${d} ${b}`; }).join(' | ');
  const whole = (notes) => notes.map((n) => `${n} - - - - - - -`).join(' | ');
  const halfs = (notes) => notes.map((n) => `${n} - - - ${n} - - -`).join(' | ');
  const up = (s) => s.replace(/([A-G][#b]?)(\d)/g, (m, n, o) => n + (+o + 1));
  // the theme of the story (also the song of the two, 春江の歌): D yo-scale melody
  const THEME = 'A4 - - B4 A4 - G4 - | E4 - G4 - A4 - - - | B4 - D5 - B4 A4 G4 - | A4 - - - - - . . | D5 - - B4 A4 - B4 - | G4 - A4 - E4 - - - | D4 - E4 G4 A4 - G4 E4 | D4 - - - - - . .';
  const THEME_CH = ['D3 A3 F#4', 'E3 B3 G4', 'G2 D3 B3', 'A2 E3 A3', 'B2 F#3 D4', 'E3 B3 G4', 'G2 D3 B3', 'D3 A3 F#4'];
  const SONGS = {
    title: { bpm: 76, steps: 2, tracks: [
      { type: 'triangle', v: 0.15, notes: THEME },
      { type: 'sine', v: 0.06, notes: arp(THEME_CH.map(up)) },
      { type: 'sine', v: 0.16, notes: whole(['D3', 'E3', 'G2', 'A2', 'B2', 'E3', 'G2', 'D3']) },
    ] },
    harue: { bpm: 66, steps: 2, tracks: [
      { type: 'sine', v: 0.16, notes: up(THEME) },
      { type: 'triangle', v: 0.035, notes: arp(THEME_CH.map((c) => up(up(c)))) },
    ] },
    ending: { bpm: 84, steps: 2, tracks: [
      { type: 'triangle', v: 0.15, notes: THEME },
      { type: 'sine', v: 0.07, notes: arp(THEME_CH.map(up)) },
      { type: 'triangle', v: 0.13, notes: halfs(['D3', 'E3', 'G2', 'A2', 'B2', 'E3', 'G2', 'D3']) },
      { type: 'sine', v: 0.05, notes: up('. . . . F#4 - - - | . . . . G4 - - - | . . . . D4 - - - | . . . . E4 - - - | . . . . F#4 - - - | . . . . B3 - - - | . . . . D4 - - - | . . . . A3 - - -') },
    ], drums: { h: '. . x . . . x .' } },
    daily: { bpm: 100, steps: 2, tracks: [
      { type: 'triangle', v: 0.13, notes: 'E5 - G5 - C5 - D5 E5 | D5 - - - G4 - - - | C5 - E5 - A5 - G5 E5 | G5 - - - - - . . | F5 - E5 - D5 - C5 - | A4 - C5 - D5 - - - | E5 - D5 C5 A4 - G4 - | C5 - - - - - . .' },
      { type: 'sine', v: 0.07, notes: arp(['C4 G4 E5', 'G3 D4 B4', 'A3 E4 C5', 'E3 B3 G4', 'F3 C4 A4', 'D4 A4 F5', 'G3 D4 B4', 'C4 G4 E5']) },
      { type: 'triangle', v: 0.13, notes: halfs(['C3', 'G2', 'A2', 'E2', 'F2', 'D3', 'G2', 'C3']) },
    ], drums: { h: '. . x . . . x .' } },
    memory: { bpm: 64, steps: 2, tracks: [
      { type: 'sine', v: 0.15, notes: 'B4 - - C5 B4 - A4 - | F4 - - - E4 - - - | A4 - B4 - C5 - E5 - | B4 - - - - - . . | C5 - B4 - A4 - F4 - | E4 - F4 - A4 - - - | B4 - A4 F4 E4 - - - | E4 - - - - - . .' },
      { type: 'triangle', v: 0.05, notes: arp(['A3 E4 C5', 'D4 A4 F5', 'F3 C4 A4', 'E3 B3 E4', 'A3 E4 C5', 'D4 A4 F5', 'F3 C4 A4', 'E3 B3 E4']) },
      { type: 'sine', v: 0.15, notes: whole(['A2', 'D3', 'F2', 'E2', 'A2', 'D3', 'F2', 'E2']) },
    ] },
    dusk: { bpm: 72, steps: 2, tracks: [
      { type: 'triangle', v: 0.14, notes: 'E5 - D5 C5 A4 - - - | G4 - A4 - C5 - - - | D5 - C5 - A4 - G4 - | E4 - - - - - . . | A4 - C5 - E5 - D5 C5 | D5 - - - G4 - - - | A4 - G4 E4 D4 - E4 - | A4 - - - - - . .' },
      { type: 'sine', v: 0.06, notes: arp(['A3 E4 C5', 'C4 G4 E5', 'F3 C4 A4', 'E3 B3 G4', 'A3 E4 C5', 'G3 D4 B4', 'D4 A4 F5', 'A3 E4 C5']) },
      { type: 'sine', v: 0.16, notes: whole(['A2', 'C3', 'F2', 'E2', 'A2', 'G2', 'D3', 'A2']) },
    ] },
    night: { bpm: 58, steps: 2, tracks: [
      { type: 'sine', v: 0.15, notes: 'D5 - - - E5 - D5 - | C5 - - - A4 - - - | G4 - A4 - C5 - D5 - | E5 - - - - - - - | G5 - - - E5 - D5 - | C5 - - - D5 - - - | A4 - G4 - E4 - G4 - | G4 - - - - - - -' },
      { type: 'triangle', v: 0.06, notes: whole(['G3', 'A3', 'C4', 'E3', 'C4', 'D4', 'A3', 'G3']) },
      { type: 'sine', v: 0.05, notes: whole(['D4', 'E4', 'G4', 'B3', 'G4', 'F#4', 'E4', 'D4']) },
      { type: 'sine', v: 0.03, notes: '. . . . . . G6 . | . . . . . . E6 . | . . . . . . D6 . | . . . . . . B5 . | . . . . . . G6 . | . . . . . . A6 . | . . . . . . E6 . | . . . . . . D6 .' },
    ] },
  };
  function playBgm(song, force) {
    if (!force && song === st.vis.bgm && GK.music.playing) return;
    st.vis.bgm = song;
    if (!song) { GK.music.stop(); return; }
    if (!audioOn) return;
    GK.music.play(SONGS[song]);
    applyVolumes();
  }
  GK.sfx.define('shutter', () => { GK.noise({ d: 0.05, v: 0.45, f: 4200, filter: 'highpass' }); GK.tone({ f: 1900, d: 0.02, type: 'square', v: 0.05 }); GK.noise({ d: 0.06, v: 0.35, f: 2600, q: 1.5, at: 0.09 }); });
  GK.sfx.define('bell', () => { [1568, 2093, 1760].forEach((f, i) => GK.tone({ f, d: 1.1, type: 'sine', v: 0.1, at: i * 0.11, a: 0.003 })); });
  GK.sfx.define('paper', () => { GK.noise({ d: 0.22, v: 0.18, f: 3200, q: 0.6 }); GK.noise({ d: 0.15, v: 0.12, f: 5200, q: 0.8, at: 0.12 }); });
  GK.sfx.define('wind', () => GK.noise({ d: 1.6, v: 0.2, f: 600, filter: 'lowpass' }));
  GK.sfx.define('chime', () => { GK.tone({ f: 1046, d: 0.35, type: 'triangle', v: 0.14 }); GK.tone({ f: 1568, d: 0.5, type: 'sine', v: 0.1, at: 0.07 }); });
  GK.sfx.define('heart', () => { GK.tone({ f: 80, f2: 55, d: 0.16, type: 'sine', v: 0.45 }); GK.tone({ f: 80, f2: 55, d: 0.2, type: 'sine', v: 0.35, at: 0.24 }); });
  GK.sfx.define('page', () => GK.noise({ d: 0.05, v: 0.06, f: 4000, filter: 'highpass' }));
  const se = (n) => GK.sfx(n);

  /* ================= petals (canvas) ================= */
  const pv = GK.fit(petalCanvas);
  const petals = [];
  const PCOL = ['#ffdbe4', '#fbc6d3', '#f6b4c6', '#fff1f5', '#f9cdd8'];
  const targetCount = () => (mode === 'title' || mode === 'ending' ? 30 : ({ off: 0, on: 22, heavy: 52 })[st.vis.petals] || 0);
  function spawn(burst) {
    const W = pv.w, H = pv.h, sc = Math.max(0.7, Math.min(1.5, W / 900));
    const p = burst
      ? { x: -40 - Math.random() * W * 0.6, y: Math.random() * H, vx: (900 + Math.random() * 700) * sc, vy: (Math.random() - 0.4) * 160, s: (2 + Math.random() * 2.4) * sc, burst: true }
      : { x: Math.random() * W * 1.2 - W * 0.1, y: -20 - Math.random() * H * 0.4, vx: (18 + Math.random() * 30) * sc, vy: (34 + Math.random() * 34) * sc, s: (0.8 + Math.random() * 0.9) * sc };
    p.rot = Math.random() * 6.3; p.vr = (Math.random() - 0.5) * 3; p.flip = Math.random() * 6; p.vf = 2 + Math.random() * 3; p.sw = Math.random() * 6; p.c = PCOL[(Math.random() * PCOL.length) | 0];
    petals.push(p);
  }
  function petalStep(dt, t) {
    const W = pv.w, H = pv.h;
    let n = 0;
    for (const p of petals) if (!p.burst) n++;
    if (n < targetCount() && Math.random() < 0.35) spawn(false);
    pv.clear();
    const g = pv.ctx;
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.x += (p.vx + (p.burst ? 0 : Math.sin(t * 1.3 + p.sw) * 22)) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.flip += p.vf * dt;
      if (p.y > H + 30 || p.x > W + 60 || (!p.burst && n > targetCount() + 4 && p.y < -10)) { petals.splice(i, 1); continue; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(p.s, p.s * (0.35 + 0.65 * Math.abs(Math.sin(p.flip))));
      g.beginPath(); g.moveTo(0, -5.2); g.lineTo(-1.3, -6.6); g.bezierCurveTo(-6.4, -5.5, -5.6, 3.5, 0, 7); g.bezierCurveTo(5.6, 3.5, 6.4, -5.5, 1.3, -6.6); g.closePath();
      g.globalAlpha = p.burst ? 0.95 : 0.88; g.fillStyle = p.c; g.fill();
      g.restore();
    }
  }
  function setPetals(m) { st.vis.petals = m || 'off'; }

  /* ================= visuals ================= */
  const imgPath = (name) => `img/${name}.webp`;
  function layerImg(name, alt) { const im = new Image(); im.className = 'layer'; im.alt = alt || ''; im.draggable = false; im.decoding = 'async'; im.src = imgPath(name); return im; }
  function fade(el, from, to, ms) { return el.animate([{ opacity: from }, { opacity: to }], { duration: ms, easing: 'ease', fill: 'both' }).finished.catch(() => {}); }
  async function veil(color, ms) {
    fxEl.style.background = color;
    msgEl.classList.add('off');
    await fade(fxEl, 0, 1, ms);
  }
  async function unveil(ms) { await fade(fxEl, 1, 0, ms); msgEl.classList.remove('off'); }
  async function petalVeil(swap) {
    for (let i = 0; i < 110; i++) spawn(true);
    await veil('radial-gradient(circle at 40% 50%, #fff4f7, #f7c9d6)', 520);
    swap();
    await sleep(160);
    await unveil(720);
  }
  async function setBg(key, trans = 'fade', ms) {
    st.vis.bg = key;
    const im = layerImg(N.BG[key], N.BG_NAME[key]);
    const old = Array.from(bgEl.children);
    if (trans === 'cut' || (!old.length && trans === 'fade')) { bgEl.replaceChildren(im); return; }
    if (trans === 'black') { await veil('#140d11', (ms || 1000) / 2); bgEl.replaceChildren(im); await sleep(120); await unveil((ms || 1000) / 2); return; }
    if (trans === 'petal') { await petalVeil(() => bgEl.replaceChildren(im)); return; }
    bgEl.appendChild(im);
    const a = trans === 'wipe'
      ? im.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: ms || 950, easing: 'cubic-bezier(.65,.05,.3,1)' })
      : im.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms || 700, easing: 'ease' });
    await a.finished.catch(() => {});
    if (bgEl.lastChild === im) old.forEach((o) => o.remove());
  }
  async function setCg(key, trans = 'fade') {
    st.vis.cg = key || null;
    if (key) { if (!G.cgs[key]) { G.cgs[key] = Date.now(); saveG(); } }
    const old = Array.from(cgEl.children);
    if (!key) {
      if (trans === 'cut') { cgEl.replaceChildren(); return; }
      await Promise.all(old.map((o) => fade(o, 1, 0, 700)));
      if (!st.vis.cg) old.forEach((o) => o.remove());
      return;
    }
    const im = layerImg(N.CG[key], 'イベント絵');
    if (trans === 'cut') { cgEl.replaceChildren(im); return; }
    if (trans === 'petal') { await petalVeil(() => cgEl.replaceChildren(im)); return; }
    cgEl.appendChild(im);
    await fade(im, 0, 1, 900);
    if (cgEl.lastChild === im) old.forEach((o) => o.remove());
  }
  function posPct(pos) {
    const P = portrait ? { left: 25, lc: 37, center: 50, rc: 63, right: 75 } : { left: 24, lc: 37, center: 50, rc: 63, right: 76 };
    return P[pos] != null ? P[pos] : 50;
  }
  async function showChar(id, expr, pos, instant) {
    const C = N.CHARS[id];
    if (!C) return;
    if (!C.exprs.includes(expr)) expr = 'normal';
    const prev = st.vis.chars[id];
    pos = pos || (prev && prev.pos) || 'center';
    st.vis.chars[id] = { expr, pos };
    let el = charEls[id];
    if (!el) {
      el = h('div', 'ch');
      el.dataset.id = id;
      el.appendChild(layerImg(N.sprite(id, expr), C.name));
      el.style.left = posPct(pos) + '%';
      charsEl.appendChild(el);
      charEls[id] = el;
      if (!instant) await el.animate([{ opacity: 0, transform: 'translate(-50%, 2.5%)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.catch(() => {});
      return;
    }
    if (!prev || prev.expr !== expr) {
      const im = layerImg(N.sprite(id, expr), C.name);
      const olds = Array.from(el.children);
      el.appendChild(im);
      if (instant) olds.forEach((o) => o.remove());
      else im.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 }).finished.then(() => olds.forEach((o) => o.remove()), () => {});
    }
    if (!prev || prev.pos !== pos) el.style.left = posPct(pos) + '%';
  }
  async function hideChar(id, instant) {
    const ids = id === 'all' ? Object.keys(charEls) : [id];
    await Promise.all(ids.map(async (k) => {
      const el = charEls[k];
      if (!el) return;
      delete charEls[k]; delete st.vis.chars[k];
      if (!instant) await el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%, 1.5%)' }], { duration: 320, fill: 'forwards' }).finished.catch(() => {});
      el.remove();
    }));
  }
  function clearChars() { Object.keys(charEls).forEach((k) => { charEls[k].remove(); delete charEls[k]; }); st.vis.chars = {}; }
  function highlight(chId) {
    const on = chId && charEls[chId];
    Object.values(charEls).forEach((el) => el.classList.toggle('dim', !!on && el.dataset.id !== chId));
  }
  function setSepia(on) { st.vis.sepia = !!on; sceneEl.classList.toggle('sepia', !!on); vignetteEl.classList.toggle('on', !!on); }
  function setTint(kind) { st.vis.tint = kind || 'none'; tintEl.dataset.kind = st.vis.tint; }
  async function fx(kind) {
    if (kind === 'flash') { fxEl.style.background = '#fff'; await fade(fxEl, 0.95, 0, 520); }
    else if (kind === 'shake') await screenEl.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-1.2%, .6%)' }, { transform: 'translate(1%, -.8%)' }, { transform: 'translate(-.6%, .4%)' }, { transform: 'translate(0,0)' }], { duration: 420 }).finished.catch(() => {});
  }
  function applyVis(v) {
    bgEl.replaceChildren(); cgEl.replaceChildren(); clearChars();
    fxEl.getAnimations().forEach((a) => a.cancel()); msgEl.classList.remove('off');
    st.vis = freshVis();
    if (v.bg) setBg(v.bg, 'cut');
    Object.entries(v.chars || {}).forEach(([id, c]) => showChar(id, c.expr, c.pos, true));
    if (v.cg) setCg(v.cg, 'cut');
    setSepia(v.sepia); setTint(v.tint); setPetals(v.petals);
    playBgm(v.bgm || null, true);
  }

  /* ================= the text window ================= */
  const isRead = (c) => forceRead || (G.read[c.label] != null && G.read[c.label] >= c.off);
  function markRead(c) { if (!(G.read[c.label] >= c.off)) { G.read[c.label] = c.off; gDirty = true; } }
  function say(c, my) {
    return new Promise((resolve) => {
      const chId = c.name ? N.SPEAKERS[c.name] : null;
      if (chId && c.expr && st.vis.chars[chId]) showChar(chId, c.expr, st.vis.chars[chId].pos, skipping);
      highlight(chId);
      nameEl.textContent = c.name || '';
      nameEl.classList.toggle('on', !!c.name);
      nameEl.style.setProperty('--nc', chId ? N.CHARS[chId].color : c.name === '湊' ? '#bfe0d4' : '#eadfcf');
      msgEl.classList.toggle('narration', !c.name);
      textV.textContent = ''; textH.textContent = c.text;
      waitEl.classList.remove('on');
      cur = { c, full: c.text, n: 0, t0: performance.now(), done: false, resolve, my, read: isRead(c) };
      st.log.push({ name: c.name || '', text: c.text });
      if (st.log.length > 400) st.log.shift();
      if (skipping && !cur.read) stopSkip('未読の文章のため、スキップを止めました');
      if (TEXT_CPS[SET.text] === Infinity || (skipping && cur.read)) finishType();
    });
  }
  function tickType(now) {
    if (!cur || cur.done) return;
    const n = Math.min(cur.full.length, Math.floor(((now - cur.t0) / 1000) * TEXT_CPS[SET.text]));
    if (n !== cur.n) { cur.n = n; textV.textContent = cur.full.slice(0, n); textH.textContent = cur.full.slice(n); }
    if (n >= cur.full.length) finishType();
  }
  function finishType() {
    if (!cur) return;
    cur.done = true;
    textV.textContent = cur.full; textH.textContent = '';
    waitEl.classList.add('on');
    scheduleAuto();
  }
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!cur || !cur.done || mode !== 'play') return;
    if (skipping && cur.read) autoTimer = setTimeout(proceed, 40);
    else if (auto) autoTimer = setTimeout(proceed, autoDelay(cur.full.length));
  }
  function proceed() {
    if (!cur || !cur.done || document.querySelector('.gk-modal-back')) { if (cur && cur.done) scheduleAuto(); return; }
    clearTimeout(autoTimer);
    markRead(cur.c);
    const r = cur.resolve;
    cur = null;
    waitEl.classList.remove('on');
    r();
  }
  function userAdvance() {
    if (mode !== 'play' || document.querySelector('.gk-modal-back')) return;
    if (hiddenWin) { setHidden(false); return; }
    if (skipping && !ctrlHeld) { stopSkip(); return; }
    if (clickWaiter) { const w = clickWaiter; clickWaiter = null; w(); return; }
    if (!cur) return;
    if (!cur.done) finishType(); else proceed();
  }
  function waitClickOr(ms) {
    return new Promise((resolve) => {
      let done = false;
      const fin = () => { if (done) return; done = true; if (clickWaiter === fin) clickWaiter = null; resolve(); };
      clickWaiter = fin;
      setTimeout(fin, ms);
    });
  }
  function setHidden(v) { hiddenWin = v; msgEl.classList.toggle('hidden', v); choicesEl.classList.toggle('hidden', v); }
  function setAuto(v) { auto = v; if (v) stopSkip(); updateModes(); if (v) scheduleAuto(); else clearTimeout(autoTimer); }
  function startSkip() {
    if (mode !== 'play' || choiceCur) return;
    if (cur && !cur.read) { GK.toast('まだ読んでいない文章はスキップできません'); return; }
    skipping = true; auto = false; updateModes();
    if (clickWaiter) userAdvanceWaiter();
    if (cur) { if (!cur.done) finishType(); else scheduleAuto(); }
  }
  function userAdvanceWaiter() { const w = clickWaiter; clickWaiter = null; if (w) w(); }
  function stopSkip(msg) { if (!skipping) return; skipping = false; updateModes(); if (msg) GK.toast(msg); }
  function updateModes() {
    badgeEl.textContent = skipping ? 'SKIP' : auto ? 'AUTO' : '';
    badgeEl.classList.toggle('on', skipping || auto);
    document.querySelectorAll('[data-act="auto"]').forEach((b) => b.classList.toggle('on', auto));
    document.querySelectorAll('[data-act="skip"]').forEach((b) => b.classList.toggle('on', skipping));
  }

  /* ================= choices ================= */
  function choose(c, my) {
    return new Promise((resolve) => {
      stopSkip(); autosave();
      const opts = c.options.filter((o) => !o.cond || N.evalCond(o.cond, st.flags, gvars()));
      choicesEl.replaceChildren();
      highlight(null);
      const pick = (o) => {
        if (my !== gen || !choiceCur) return;
        choiceCur = null;
        GK.sfx('chime');
        choicesEl.hidden = true;
        st.log.push({ name: '', text: '▶ ' + o.text, choice: true });
        N.applySet(o.set, st.flags);
        goLabel(o.target);
        resolve();
      };
      opts.forEach((o, i) => {
        const b = h('button', 'choice' + (o.cond ? ' special' : ''), `<span class="no">${i + 1}</span><span class="tx">${esc(o.text)}</span>`);
        b.type = 'button';
        b.addEventListener('click', (e) => { e.stopPropagation(); pick(o); });
        b.style.animationDelay = i * 70 + 'ms';
        choicesEl.appendChild(b);
      });
      choicesEl.hidden = false;
      choiceCur = { opts, pick };
    });
  }
  function goLabel(name) {
    const i = SCRIPT.labels[name];
    if (i == null) { console.error('[novel] no label', name); return; }
    st.pc = i;
  }

  /* ================= chapters & endings ================= */
  async function chapter(c) {
    st.chapter = c.id; st.chapterTitle = c.title;
    chapName.textContent = c.title;
    if (!G.chapters[c.id]) { G.chapters[c.id] = Date.now(); saveG(); }
    autosave();
    if (skipping) return;
    const [a, b] = c.title.split('　');
    chapterEl.innerHTML = `<small>${esc(a)}</small><b>${esc(b || '')}</b>`;
    chapterEl.hidden = false;
    msgEl.classList.add('off');
    nameEl.classList.remove('on'); textV.textContent = ''; textH.textContent = '';
    await fade(chapterEl, 0, 1, 600);
    await waitClickOr(1900);
    await fade(chapterEl, 1, 0, 500);
    chapterEl.hidden = true;
    msgEl.classList.remove('off');
  }
  let endResolve = null;
  async function ending(id, my) {
    stopSkip(); setAuto(false);
    const E = N.ENDINGS.find((e) => e.id === id) || { title: '', kind: 'END' };
    const first = !G.ends[id];
    const firstClear = !Object.keys(G.ends).length;
    G.ends[id] = Date.now(); G.plays++; saveG();
    store.del('save:auto');
    mode = 'ending';
    frame.classList.add('mode-ending');
    playBgm('ending', true);
    const seen = N.ENDINGS.filter((e) => G.ends[e.id]).length;
    let news = [];
    if (first) news.push('エンディングリストに追加されました');
    if (firstClear) news.push('シーン選択が使えるようになりました');
    if (id !== 'true' && !G.ends.true && seen >= 1) news.push('三つの手がかりを集めると、新しい選択肢が……');
    endingEl.innerHTML = `<div class="end-in"><p class="kind">${esc(E.kind)}</p><h2>${esc(E.title)}</h2>
      <p class="count">エンディング ${seen} / ${N.ENDINGS.length}</p>${news.map((t) => `<p class="new">${esc(t)}</p>`).join('')}
      <div class="end-btns"><button type="button" class="nbtn primary" id="endBack">タイトルへ</button><button type="button" class="nbtn" id="endGallery">ギャラリー</button></div></div>`;
    endingEl.hidden = false;
    endingEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: 'ease' });
    $('#endBack').onclick = () => { GK.sfx('click'); toTitle(); };
    $('#endGallery').onclick = () => { GK.sfx('click'); openGallery(); };
    setTimeout(() => { const b = $('#endBack'); if (b) b.focus({ preventScroll: true }); }, 600);
  }

  /* ================= the interpreter ================= */
  async function run(my) {
    while (my === gen && mode === 'play') {
      const c = SCRIPT.cmds[st.pc];
      if (!c) { toTitle(); return; }
      st.pc++;
      st.here = c;
      try { await exec(c, my); } catch (e) { console.error('[novel]', e); }
    }
  }
  function exec(c, my) {
    const fast = skipping;
    switch (c.t) {
      case 'text': return say(c, my);
      case 'choice': return choose(c, my);
      case 'bg': return setBg(c.key, fast ? 'cut' : c.trans, c.ms);
      case 'cg': return setCg(c.key, fast ? 'cut' : c.trans);
      case 'show': return showChar(c.ch, c.expr, c.pos, fast);
      case 'hide': return hideChar(c.ch, fast);
      case 'bgm': playBgm(c.song); return null;
      case 'se': if (!fast) se(c.name); return null;
      case 'fx': return fast ? null : fx(c.kind);
      case 'sepia': setSepia(c.on); return fast ? null : sleep(500);
      case 'tint': setTint(c.kind); return null;
      case 'petals': setPetals(c.mode); return null;
      case 'wait': return fast ? null : waitClickOr(c.ms);
      case 'set': N.applySet(c.ops, st.flags); return null;
      case 'if': if (N.evalCond(c.cond, st.flags, gvars())) goLabel(c.target); return null;
      case 'jump': goLabel(c.target); return null;
      case 'chapter': return chapter(c, my);
      case 'end': return ending(c.id, my);
      default: return null;
    }
  }
  function resetPlay() {
    gen++;
    cur = null; choiceCur = null; clickWaiter = null; clearTimeout(autoTimer);
    skipping = false; auto = false; setHidden(false); updateModes();
    choicesEl.hidden = true; chapterEl.hidden = true; endingEl.hidden = true;
    frame.classList.remove('mode-ending');
    textV.textContent = ''; textH.textContent = ''; nameEl.classList.remove('on'); waitEl.classList.remove('on');
    return gen;
  }
  function enterPlay() {
    mode = 'play';
    frame.classList.remove('mode-title', 'mode-ending');
    frame.classList.add('mode-play');
    titleEl.hidden = true;
  }
  function newGame(label = 'start', preset) {
    const my = resetPlay();
    st.flags = {}; if (preset) N.applySet(preset, st.flags);
    st.log = []; st.chapter = null; st.chapterTitle = ''; chapName.textContent = '';
    applyVis(freshVis());
    enterPlay();
    st.pc = SCRIPT.labels[label] || 0;
    run(my);
  }
  function toTitle() {
    resetPlay();
    if (st.here && mode === 'play') autosave();
    mode = 'title';
    frame.classList.remove('mode-play', 'mode-ending');
    frame.classList.add('mode-title');
    applyVis(freshVis());
    renderTitle();
    titleEl.hidden = false;
    playBgm('title', true);
  }

  /* ================= save / load ================= */
  const SLOTS = 12;
  const slotKey = (s) => 'save:' + s;
  function thumb() {
    const W = 320, H = 180, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#241a20'; g.fillRect(0, 0, W, H);
    if (st.vis.sepia) g.filter = 'sepia(0.85) saturate(0.8)';
    const cover = (im) => {
      if (!im) return;
      const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
      if (!iw || !ih) return;
      const s = Math.max(W / iw, H / ih);
      g.drawImage(im, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
    };
    try {
      if (st.vis.bg) cover(GK.images[N.BG[st.vis.bg]]);
      const P = { left: 24, lc: 37, center: 50, rc: 63, right: 76 };
      for (const [id, ch] of Object.entries(st.vis.chars)) {
        const im = GK.images[N.sprite(id, ch.expr)];
        if (!im) continue;
        const hh = H * 0.96, ww = hh * (2 / 3);
        g.drawImage(im, (P[ch.pos] / 100) * W - ww / 2, H - hh, ww, hh);
      }
      if (st.vis.tint === 'dusk') { g.fillStyle = 'rgba(255,140,80,.25)'; g.fillRect(0, 0, W, H); }
      if (st.vis.tint === 'night') { g.fillStyle = 'rgba(30,40,100,.35)'; g.fillRect(0, 0, W, H); }
      if (st.vis.cg) cover(GK.images[N.CG[st.vis.cg]]);
      return c.toDataURL('image/jpeg', 0.72);
    } catch (e) { return ''; }
  }
  function snapshot() {
    const here = st.here;
    if (!here) return null;
    let log = st.log.slice(-120);
    if (here.t === 'text' && log.length && log[log.length - 1].text === here.text) log = log.slice(0, -1);
    const shown = cur ? cur.full : (st.log[st.log.length - 1] || {}).text || '';
    return { v: 1, label: here.label, off: here.off, flags: Object.assign({}, st.flags), vis: JSON.parse(JSON.stringify(st.vis)), chapter: st.chapter, chapterTitle: st.chapterTitle, text: shown.replace(/\n/g, ' ').slice(0, 60), time: Date.now(), log, thumb: thumb() };
  }
  function saveTo(slot) {
    const s = snapshot();
    if (!s) return false;
    store.set(slotKey(slot), s);
    return true;
  }
  function autosave() { if (mode === 'play' && st.here) saveTo('auto'); }
  function loadFrom(slot) {
    const s = store.get(slotKey(slot), null);
    if (!s || SCRIPT.labels[s.label] == null) { GK.toast('このデータは読み込めません'); return false; }
    const my = resetPlay();
    closeModals();
    st.flags = Object.assign({}, s.flags); st.log = (s.log || []).slice(); st.chapter = s.chapter; st.chapterTitle = s.chapterTitle || '';
    chapName.textContent = st.chapterTitle;
    enterPlay();
    applyVis(s.vis || freshVis());
    st.pc = SCRIPT.labels[s.label] + s.off;
    run(my);
    return true;
  }
  function newestSave() {
    let best = null, bestT = 0;
    ['auto', 'q', ...Array.from({ length: SLOTS }, (_, i) => i)].forEach((k) => { const s = store.get(slotKey(k), null); if (s && s.time > bestT) { best = k; bestT = s.time; } });
    return best;
  }
  const fmtTime = (t) => { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  function slotHTML(k) {
    const s = store.get(slotKey(k), null);
    const label = k === 'auto' ? 'オート' : k === 'q' ? 'クイック' : 'No.' + String(k + 1).padStart(2, '0');
    if (!s) return `<button type="button" class="slot empty" data-slot="${k}"><span class="th"><i>NO DATA</i></span><span class="meta"><b>${label}</b><small>―</small></span></button>`;
    return `<button type="button" class="slot" data-slot="${k}"><span class="th"${s.thumb ? ` style="background-image:url(${s.thumb})"` : ''}></span>
      <span class="meta"><b>${label}</b><small>${fmtTime(s.time)}</small><em>${esc(s.chapterTitle || '')}</em><span class="tx">${esc(s.text || '')}</span></span></button>`;
  }
  function openSaves(kind) {
    if (mode !== 'play') kind = 'load';
    const body = h('div', 'saves');
    let close = null;
    const render = () => {
      const keys = kind === 'load' ? ['auto', 'q', ...Array.from({ length: SLOTS }, (_, i) => i)] : Array.from({ length: SLOTS }, (_, i) => i);
      body.innerHTML = (mode === 'play' ? `<div class="tabs"><button type="button" data-k="save" class="${kind === 'save' ? 'on' : ''}">セーブ</button><button type="button" data-k="load" class="${kind === 'load' ? 'on' : ''}">ロード</button></div>` : '')
        + `<p class="hint">${kind === 'save' ? '保存する場所を選んでください' : '読みこむデータを選んでください'}</p><div class="grid">${keys.map(slotHTML).join('')}</div>`;
    };
    body.addEventListener('click', async (e) => {
      const tab = e.target.closest('[data-k]');
      if (tab) { kind = tab.dataset.k; GK.sfx('click'); render(); return; }
      const b = e.target.closest('.slot');
      if (!b) return;
      const k = b.dataset.slot === 'auto' || b.dataset.slot === 'q' ? b.dataset.slot : +b.dataset.slot;
      if (kind === 'save') {
        if (store.get(slotKey(k), null)) {
          const ok = await GK.modal({ title: '上書きの確認', body: `<p>No.${String(k + 1).padStart(2, '0')} のデータに上書きしますか？</p>`, buttons: [{ label: 'やめる', value: false, ghost: true }, { label: '上書きする', value: true, primary: true }] });
          if (!ok) return;
        }
        if (saveTo(k)) { GK.sfx('ok'); GK.toast(`No.${String(k + 1).padStart(2, '0')} にセーブしました`); render(); }
      } else {
        if (b.classList.contains('empty')) { GK.sfx('ng'); return; }
        GK.sfx('select');
        if (close) close('loaded');
        loadFrom(k);
      }
    });
    render();
    return GK.modal({ title: 'セーブ / ロード', body, wide: true, cls: 'nv-saves', buttons: [{ label: '閉じる', value: null, ghost: true }], onOpen: (card, c) => { close = c; } });
  }
  function quickSave() { if (mode !== 'play') return; if (saveTo('q')) { GK.sfx('ok'); GK.toast('クイックセーブしました'); } }
  function quickLoad() {
    if (!store.get(slotKey('q'), null)) { GK.toast('クイックセーブのデータがありません'); return; }
    GK.sfx('select'); loadFrom('q'); GK.toast('クイックロードしました');
  }

  /* ================= panels ================= */
  function closeModals() { document.querySelectorAll('.gk-modal-back').forEach((b) => b.remove()); }
  function openLog() {
    if (mode !== 'play') return;
    const body = h('div', 'log');
    body.innerHTML = st.log.length
      ? st.log.map((e) => `<div class="le${e.choice ? ' choice' : ''}">${e.name ? `<b>${esc(e.name)}</b>` : ''}<p>${esc(e.text)}</p></div>`).join('')
      : '<p class="hint">まだ文章がありません</p>';
    return GK.modal({ title: 'バックログ', body, wide: true, cls: 'nv-log', buttons: [{ label: '閉じる', value: null, ghost: true }], onOpen: (card) => { const b = card.querySelector('.gk-modal-body'); requestAnimationFrame(() => { b.scrollTop = b.scrollHeight; }); } });
  }
  function openSettings() {
    const rows = [
      ['text', '文字の速さ', 1, 10, (v) => (v >= 10 ? '瞬間' : v)],
      ['auto', 'オートの速さ', 1, 10, (v) => v],
      ['bgm', 'BGM の音量', 0, 10, (v) => v],
      ['se', '効果音の音量', 0, 10, (v) => v],
      ['win', 'ウィンドウの濃さ', 1, 10, (v) => v],
    ];
    const body = h('div', 'settings');
    body.innerHTML = rows.map(([k, label, min, max, f]) => `<label class="row"><span>${label}</span><input type="range" min="${min}" max="${max}" step="1" value="${SET[k]}" data-k="${k}"><output>${f(SET[k])}</output></label>`).join('')
      + '<div class="preview"><span class="pv"></span></div><p class="hint">スキップは、一度読んだ文章だけ進みます（Ctrl キーを押している間もスキップ）。</p>';
    const pvEl = body.querySelector('.pv');
    const sample = '坂の上から、桜の花びらがひとひら、ゆっくりと舞いおりてきた。';
    let t0 = performance.now(), raf = 0;
    const tick = (now) => {
      const cps = TEXT_CPS[SET.text];
      const n = cps === Infinity ? sample.length : Math.min(sample.length, Math.floor(((now - t0) / 1000) * cps));
      pvEl.textContent = sample.slice(0, n);
      if (n >= sample.length && now - t0 > (sample.length / Math.min(cps, 200)) * 1000 + autoDelay(sample.length)) t0 = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    body.addEventListener('input', (e) => {
      const k = e.target.dataset.k;
      if (!k) return;
      SET[k] = +e.target.value;
      const row = rows.find((r) => r[0] === k);
      e.target.nextElementSibling.textContent = row[4](SET[k]);
      saveSET(); applySettings();
      if (k === 'text') t0 = performance.now();
      if (k === 'se') GK.sfx('chime');
    });
    return GK.modal({ title: '設定', body, wide: true, cls: 'nv-settings', buttons: [{ label: '初期値に戻す', value: 'reset', ghost: true }, { label: '閉じる', value: null, primary: true }] }).then((v) => {
      cancelAnimationFrame(raf);
      if (v === 'reset') { Object.assign(SET, SET_DEF); saveSET(); applySettings(); GK.toast('設定を初期値に戻しました'); }
    });
  }
  function applySettings() {
    frame.style.setProperty('--win', (0.32 + SET.win * 0.062).toFixed(3));
    applyVolumes();
  }
  function openViewer(name) {
    viewerEl.innerHTML = '';
    viewerEl.appendChild(layerImg(name, 'イベント絵'));
    viewerEl.appendChild(h('p', 'vhint', 'クリック・タップで閉じる'));
    viewerEl.hidden = false;
    viewerEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    const close = (e) => { if (e) e.stopPropagation(); viewerEl.hidden = true; removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { e.preventDefault(); e.stopPropagation(); close(); };
    viewerEl.onclick = close;
    addEventListener('keydown', onKey, true);
  }
  function openGallery() {
    const body = h('div', 'gallery');
    const anyEnd = Object.keys(G.ends).length > 0;
    const cgs = N.CG_LIST.map((c) => ({ name: N.CG[c.key], title: c.title, open: !!G.cgs[c.key] }))
      .concat([{ name: 'key-visual', title: 'キービジュアル', open: anyEnd }, { name: 'title-bg', title: '夜明けの花見坂', open: true }]);
    const nOpen = cgs.filter((c) => c.open).length;
    body.innerHTML = `<h3>イベント絵 <small>${nOpen} / ${cgs.length}</small></h3><div class="cgs">${cgs.map((c) => c.open
      ? `<button type="button" class="cgc" data-img="${c.name}"><span class="th" style="background-image:url(${imgPath(c.name)})"></span><span>${esc(c.title)}</span></button>`
      : '<div class="cgc locked"><span class="th"><i>？</i></span><span>まだ見ていません</span></div>').join('')}</div>
      <h3>エンディング <small>${N.ENDINGS.filter((e) => G.ends[e.id]).length} / ${N.ENDINGS.length}</small></h3><ol class="ends">${N.ENDINGS.map((e) => G.ends[e.id]
      ? `<li class="seen"><span class="k">${esc(e.kind)}</span><b>${esc(e.title)}</b></li>`
      : `<li><span class="k">？？？</span><b>まだ見ていない結末</b><small>ヒント：${esc(e.hint)}</small></li>`).join('')}</ol>`;
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-img]'); if (b) { GK.sfx('click'); openViewer(b.dataset.img); } });
    return GK.modal({ title: 'ギャラリー', body, wide: true, cls: 'nv-gallery', buttons: [{ label: '閉じる', value: null, ghost: true }] });
  }
  function openChapters() {
    if (!Object.keys(G.ends).length) { GK.toast('どれかの結末を見ると、シーン選択が使えます'); return null; }
    const list = SCRIPT.chapters.filter((c) => G.chapters[c.id]);
    const body = h('div', 'chapters');
    body.innerHTML = '<p class="hint">一度見た章から、もう一度はじめられます。</p>' + list.map((c) => { const [a, b] = c.title.split('　'); return `<button type="button" class="chap" data-id="${c.id}"><small>${esc(a)}</small><b>${esc(b || '')}</b></button>`; }).join('');
    let close = null;
    body.addEventListener('click', (e) => {
      const b = e.target.closest('.chap');
      if (!b) return;
      const c = SCRIPT.chapters.find((x) => x.id === b.dataset.id);
      GK.sfx('select');
      if (close) close('go');
      newGame(c.label, c.preset);
    });
    return GK.modal({ title: 'シーン選択', body, wide: true, cls: 'nv-chapters', buttons: [{ label: '閉じる', value: null, ghost: true }], onOpen: (card, c) => { close = c; } });
  }
  async function confirmTitle() {
    const v = await GK.modal({ title: 'タイトルに戻る', body: '<p>タイトル画面に戻りますか？<br>（いまの場面はオートセーブに残ります）</p>', buttons: [{ label: 'やめる', value: false, ghost: true }, { label: '戻る', value: true, primary: true }] });
    if (v) { autosave(); toTitle(); }
  }
  async function openMenu() {
    if (document.querySelector('.gk-modal-back')) return;
    stopSkip();
    const items = mode === 'play'
      ? [['save', 'セーブ'], ['load', 'ロード'], ['log', 'バックログ'], ['config', '設定'], ['gallery', 'ギャラリー'], ['title', 'タイトルに戻る']]
      : [['load', 'ロード'], ['config', '設定'], ['gallery', 'ギャラリー'], ['chapters', 'シーン選択']];
    const body = h('div', 'menu-list');
    body.innerHTML = items.map(([k, l]) => `<button type="button" class="nbtn" data-m="${k}">${l}</button>`).join('');
    let close = null;
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b && close) close(b.dataset.m); });
    const v = await GK.modal({ title: 'メニュー', body, cls: 'nv-menu', buttons: [{ label: '閉じる', value: null, ghost: true }], onOpen: (card, c) => { close = c; } });
    act(v);
  }
  function act(v) {
    if (!v) return;
    if (v !== 'auto' && v !== 'skip') GK.sfx('click');
    switch (v) {
      case 'save': openSaves('save'); break;
      case 'load': openSaves('load'); break;
      case 'log': openLog(); break;
      case 'config': openSettings(); break;
      case 'gallery': openGallery(); break;
      case 'chapters': openChapters(); break;
      case 'title': confirmTitle(); break;
      case 'qsave': quickSave(); break;
      case 'qload': quickLoad(); break;
      case 'auto': GK.sfx('click'); setAuto(!auto); break;
      case 'skip': GK.sfx('click'); if (skipping) stopSkip(); else startSkip(); break;
      case 'hide': setHidden(true); break;
      default: break;
    }
  }

  /* ================= title ================= */
  function renderTitle() {
    const cleared = Object.keys(G.ends).length > 0;
    const trueSeen = !!G.ends.true;
    titleEl.querySelector('.tbg').src = imgPath(cleared ? 'key-visual' : 'title-bg');
    titleEl.classList.toggle('cleared', cleared);
    titleEl.querySelector('.tsub').textContent = trueSeen ? 'ある坂の町の、春の物語　― 約束は、守られた ―' : 'ある坂の町の、春の物語';
    const cont = newestSave();
    $('#tCont').disabled = cont == null;
    $('#tChap').classList.toggle('locked', !cleared);
    $('#tChap').title = cleared ? '' : 'どれかの結末を見ると使えます';
    const seen = N.ENDINGS.filter((e) => G.ends[e.id]).length;
    titleEl.querySelector('.tinfo').textContent = seen ? `エンディング ${seen} / ${N.ENDINGS.length}` : '';
  }
  titleEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-t]');
    if (!b) return;
    e.stopPropagation();
    unlockAudio();
    GK.sfx('select');
    const t = b.dataset.t;
    if (t === 'start') newGame('start');
    else if (t === 'cont') { const k = newestSave(); if (k != null) loadFrom(k); }
    else if (t === 'load') openSaves('load');
    else if (t === 'chap') openChapters();
    else if (t === 'gallery') openGallery();
    else if (t === 'config') openSettings();
  });

  /* ================= input ================= */
  frame.addEventListener('click', (e) => {
    if (mode !== 'play') return;
    if (e.target.closest('button, input, #choices, #viewer, a')) return;
    userAdvance();
  });
  frame.addEventListener('contextmenu', (e) => { e.preventDefault(); if (mode === 'play') { if (hiddenWin) setHidden(false); else openMenu(); } });
  let wheelT = 0;
  frame.addEventListener('wheel', (e) => {
    if (mode !== 'play' || document.querySelector('.gk-modal-back')) return;
    const now = performance.now();
    if (now - wheelT < 250) return;
    wheelT = now;
    if (e.deltaY < 0) openLog(); else if (e.deltaY > 0) userAdvance();
  }, { passive: true });
  $('#msg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    e.stopPropagation();
    act(b.dataset.act);
  });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back') || !viewerEl.hidden) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (mode === 'ending') return;
    if (mode !== 'play') { if (e.code === 'Escape') openMenu(); return; }
    if (choiceCur && /^Digit[1-9]$/.test(e.code)) { const o = choiceCur.opts[+e.code.slice(5) - 1]; if (o) choiceCur.pick(o); return; }
    if (choiceCur && (e.code === 'ArrowDown' || e.code === 'ArrowUp')) {
      const bs = Array.from(choicesEl.querySelectorAll('button')); let i = bs.indexOf(document.activeElement);
      i = e.code === 'ArrowDown' ? (i + 1) % bs.length : (i - 1 + bs.length) % bs.length;
      bs[i].focus(); e.preventDefault(); return;
    }
    switch (e.code) {
      case 'Enter': case 'NumpadEnter': case 'Space':
        if (choiceCur) { if (document.activeElement && document.activeElement.classList.contains('choice')) return; const b = choicesEl.querySelector('button'); if (b) b.focus(); e.preventDefault(); return; }
        if (document.activeElement && document.activeElement.tagName === 'BUTTON' && document.activeElement !== document.body) document.activeElement.blur();
        e.preventDefault(); userAdvance(); break;
      case 'ControlLeft': case 'ControlRight':
        if (!ctrlHeld) { ctrlHeld = true; startSkip(); }
        break;
      case 'KeyA': act('auto'); break;
      case 'KeyS': act('skip'); break;
      case 'ArrowUp': case 'KeyB': openLog(); break;
      case 'KeyH': setHidden(!hiddenWin); break;
      case 'KeyQ': quickSave(); break;
      case 'KeyL': quickLoad(); break;
      case 'Escape': if (hiddenWin) setHidden(false); else openMenu(); break;
      default: break;
    }
  });
  addEventListener('keyup', (e) => { if (e.code === 'ControlLeft' || e.code === 'ControlRight') { ctrlHeld = false; stopSkip(); } });
  addEventListener('blur', () => { if (ctrlHeld) { ctrlHeld = false; stopSkip(); } });
  addEventListener('pagehide', () => { if (mode === 'play') autosave(); saveG(); });

  /* ================= help ================= */
  const HELP = `
    <p>坂の町の小さな写真館で見つかった、五十年前の一枚の写真。その写真をめぐる、春休みの物語です。選んだ言葉によって、物語の結末が変わります。</p>
    <h3>操作</h3>
    <table>
      <tr><th>文章を進める</th><td>クリック・タップ／<kbd>Enter</kbd>・<kbd>Space</kbd>／ホイールを下へ</td></tr>
      <tr><th>選択肢</th><td>クリック・タップ／<kbd>1</kbd>〜<kbd>3</kbd>／<kbd>↑</kbd><kbd>↓</kbd>と <kbd>Enter</kbd></td></tr>
      <tr><th>オート</th><td>「オート」ボタン／<kbd>A</kbd></td></tr>
      <tr><th>スキップ</th><td>「スキップ」ボタン／<kbd>S</kbd>／<kbd>Ctrl</kbd> を押している間（読んだ文章だけ）</td></tr>
      <tr><th>バックログ</th><td>「ログ」ボタン／<kbd>↑</kbd>・<kbd>B</kbd>／ホイールを上へ</td></tr>
      <tr><th>クイックセーブ・ロード</th><td>「Qセーブ」「Qロード」／<kbd>Q</kbd>・<kbd>L</kbd></td></tr>
      <tr><th>ウィンドウを隠す</th><td><kbd>H</kbd>（もう一度押すか、クリックで戻ります）</td></tr>
      <tr><th>メニュー</th><td>右上の ≡ ボタン／右クリック／<kbd>Esc</kbd></td></tr>
    </table>
    <h3>システム</h3>
    <ul>
      <li>セーブは 12 か所とクイックセーブ。章のはじめと選択肢では自動でオートセーブされ、「つづきから」でいちばん新しいデータから再開できます。</li>
      <li>結末は 4 つ。見た結末とイベント絵は「ギャラリー」に記録され、結末を一度見ると「シーン選択」で好きな章から読みなおせます。</li>
      <li>真の結末は、ほかの結末を見たあとで開かれます。物語の中に散らばった三つの手がかりを、見のがさないでください。</li>
      <li>設定では、文字の速さ・オートの速さ・BGM と効果音の音量・ウィンドウの濃さを変えられます。</li>
    </ul>
    <p>イラストは、いまは「画像サンプル」です（あとで AI で生成した絵に差し替わります）。音楽はすべてこのゲームのための書きおろしです。</p>`;
  GK.init({ id: 'sakura-novel', title: '花明かりの写真館', help: HELP, menu: openMenu });

  /* ================= boot ================= */
  layout();
  applySettings();
  GK.loop((dt, t) => { tickType(performance.now()); petalStep(dt, t); });
  const allImages = [...Object.values(N.BG), ...Object.values(N.CG), 'key-visual', 'title-bg'];
  Object.entries(N.CHARS).forEach(([id, c]) => c.exprs.forEach((e) => allImages.push(N.sprite(id, e))));
  GK.loadImages(allImages).then(() => {
    $('#loading').remove();
    toTitle();
    window.__novelReady = true;
  });

  /* ================= debug & self-test ================= */
  window.__novel = { st, G, SET, SCRIPT, newGame, toTitle, userAdvance, proceed, saveTo, loadFrom, openLog, openSaves, openSettings, openGallery, openChapters, get mode() { return mode; }, get cur() { return cur; }, get choice() { return choiceCur; } };
  window.__gameSelfTest = async function () {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG ' + m); };
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await sleep(40); } return false; };
    const PREFIX = 'game:sakura-novel:';
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(PREFIX)) backup[k] = localStorage.getItem(k); }
    const setBackup = Object.assign({}, SET);
    const drive = () => { if (choiceCur) return false; if (clickWaiter) userAdvanceWaiter(); else if (cur) { if (!cur.done) finishType(); else proceed(); } return false; };
    try {
      await until(() => window.__novelReady, 10000);
      await sleep(300);
      await shot('title');
      $('#tStart').click();
      if (!(await until(() => mode === 'play' && cur, 9000))) fail('no text after start');
      await until(() => cur && cur.done, 6000);
      await shot('play');
      SET.text = 10;
      if (!(await until(() => { if (choiceCur) return true; drive(); return false; }, 25000))) fail('first choice not reached');
      await sleep(400);
      await shot('choice');
      choicesEl.querySelector('button').click();
      if (st.flags.koharu !== 1) fail('flag koharu not set');
      if (!(await until(() => cur && cur.done, 5000))) fail('no text after choice');
      for (let i = 0; i < 3; i++) { drive(); await sleep(120); await until(() => cur && cur.done, 4000); }
      openLog();
      await sleep(450);
      await shot('backlog');
      if (!document.querySelector('.nv-log .le')) fail('backlog empty');
      closeModals();
      await sleep(150);
      await until(() => cur && cur.done, 4000);
      const here = { label: st.here.label, off: st.here.off, text: cur && cur.full };
      if (!saveTo(0)) fail('save failed');
      for (let i = 0; i < 4; i++) { drive(); await sleep(80); await until(() => (cur && cur.done) || choiceCur, 4000); }
      loadFrom(0);
      await until(() => cur && cur.done, 5000);
      if (!cur || st.here.label !== here.label || st.here.off !== here.off || cur.full !== here.text) fail(`load position ${here.label}:${here.off} → ${st.here && st.here.label}:${st.here && st.here.off}`);
      else notes.push('save/load ok at ' + here.label + ':' + here.off);
      openSaves('load');
      await sleep(450);
      await shot('saves');
      closeModals();
      openSettings();
      await sleep(450);
      await shot('settings');
      closeModals();
      // an ending through the debug path (every line treated as read → skip)
      forceRead = true;
      newGame('normal_1');
      skipping = true;
      if (!(await until(() => { if (mode === 'ending') return true; if (choiceCur) choiceCur.pick(choiceCur.opts[0]); else drive(); if (!skipping && mode === 'play') skipping = true; return false; }, 30000))) fail('normal ending not reached');
      if (!G.ends.normal) fail('ending not recorded');
      await sleep(1400);
      await shot('ending');
      // the true ending's event picture
      newGame('true_1');
      skipping = true;
      if (!(await until(() => { if (st.vis.cg === 'night') return true; if (mode !== 'play') return false; drive(); return false; }, 30000))) fail('true-route CG not reached');
      skipping = false; forceRead = false;
      await sleep(1200);
      await until(() => cur && cur.done, 4000);
      await shot('true-cg');
      if (!(await until(() => { if (mode === 'ending') return true; drive(); return false; }, 30000))) fail('true ending not reached');
      if (!G.ends.true) fail('true ending not recorded');
      notes.push('endings: ' + Object.keys(G.ends).join(','));
      $('#endBack').click();
      await until(() => mode === 'title', 3000);
      await sleep(500);
      await shot('title-cleared');
      openGallery();
      await sleep(600);
      await shot('gallery');
      closeModals();
    } catch (e) {
      fail('threw ' + (e && e.message));
    } finally {
      forceRead = false; skipping = false;
      Object.assign(SET, setBackup);
      for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k.startsWith(PREFIX) && !(k in backup)) store.del(k.slice(PREFIX.length)); }
      Object.entries(backup).forEach(([k, v]) => { try { store.set(k.slice(PREFIX.length), JSON.parse(v)); } catch (e) { /* ignore */ } });
      Object.keys(G).forEach((k) => delete G[k]);
      Object.assign(G, G_DEF(), store.get('global', {}));
      toTitle();
    }
    return { ok, notes };
  };
})();
