/* 千代紙飛行 — 折り鶴の縦スクロールシューティング（orizuru-shooting）。絵と音楽は art.js（window.OZ） */
(() => {
  'use strict';
  const ID = 'orizuru-shooting';
  const W = 360, H = 640, PI = Math.PI, TAU = PI * 2;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clamp = GK.clamp;
  const SERIF = '"Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif';
  const SANS = '"Yu Gothic UI","Yu Gothic","Hiragino Sans",Meiryo,sans-serif';
  const PR = 2.6, GRAZE = 14, LINE_Y = 190;
  const EXTENDS = [1000000, 2500000, 4500000];
  const rnd = GK.rng(20261118);

  const DIFF = {
    easy: { key: 'easy', name: 'かんたん', bs: 0.78, dens: 0.55, lives: 4 },
    normal: { key: 'normal', name: 'ふつう', bs: 1, dens: 1, lives: 3 },
    hard: { key: 'hard', name: 'むずかしい', bs: 1.12, dens: 1.3, lives: 3, rev: true },
  };
  let D = DIFF.normal;
  const C = { red: '#e5484d', orange: '#f0892e', yellow: '#f1c232', green: '#3daf68', cyan: '#28b3c7', blue: '#3b6fe0', purple: '#9255d6', pink: '#ee6aa7', white: '#f5f1e8' };
  const STAGES = [
    { name: '第一幕', title: '和紙の里', bg: 'bg-stage1', base: '#e2e3c8', imgA: 0.6, wash: 0.42, song: 's0', ink: '#3b3a22' },
    { name: '第二幕', title: '切り絵の夜川', bg: 'bg-stage2', base: '#1b2140', imgA: 0.6, wash: 0.4, song: 's1', ink: '#eceaff' },
    { name: '第三幕', title: '折り紙の天守', bg: 'bg-stage3', base: '#4a1c22', imgA: 0.55, wash: 0.42, song: 's2', ink: '#ffeccc' },
  ];
  const ET = {
    plane: { hp: 10, r: 10, score: 300, drop: 'p', rot: true },
    frog: { hp: 26, r: 11, score: 600, drop: 'pt' },
    fish: { hp: 16, r: 10, score: 400, drop: 'pt', rot: true },
    shuriken: { hp: 8, r: 10, score: 350, drop: 'p', spin: 7 },
    boat: { hp: 110, r: 16, score: 3000, drop: 'P' },
    kabuto: { hp: 170, r: 18, score: 4500, drop: 'P' },
    crow: { hp: 22, r: 12, score: 700, drop: 'pt', rot: true },
  };
  const ECOL = [
    { plane: ['#f7f2e6'], frog: ['#62ad5a'], shuriken: ['#3b6fe0', '#f1c232'], boat: ['#c99b5b'], bc: [C.red, C.blue, C.green] },
    { plane: ['#9fb2ee'], fish: ['#e5484d'], shuriken: ['#9255d6', '#f5f1e8'], boat: ['#6876b8'], bc: [C.cyan, C.white, C.pink] },
    { plane: ['#f1c232'], crow: ['#3a3340', '#5a4f63'], shuriken: ['#e5484d', '#1d1b28'], kabuto: ['#9c2f2f'], bc: [C.yellow, C.orange, C.purple] },
  ];

  /* ---------------- state ---------------- */
  const SET = { auto: GK.store.get('auto', GK.isTouch, ID), diff: GK.store.get('diff', 'normal', ID) };
  const S = { mode: 'title', paused: false, stage: 0, flow: 'stage', scroll: 0, gt: 0, decor: [] };
  const P = { x: W / 2, y: H - 80, inv: 0, dead: 0, enter: 0, focus: false, shotT: 0, n: 0, tilt: 0, opts: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], dx: 0, dy: 0 };
  const eb = [], ebFree = [], pb = [], pbFree = [], parts = [], partFree = [], items = [], itemFree = [];
  let enemies = [], lasers = [], timers = [];
  const DBG = { inv: false, auto: false };
  let frames = 0, modalOpen = false, touchFocus = false;
  const best = (d) => GK.store.get('best:' + d, { score: 0, stage: 0, clear: false });

  /* ---------------- canvas & layout ---------------- */
  const cv = $('#cv'), field = $('#field'), wrap = $('#wrap');
  const view = GK.fit(cv, { w: W, h: H });
  const ctx = view.ctx;
  function layout() {
    const iw = innerWidth, ih = innerHeight, tall = iw / ih < 0.9;
    document.body.classList.toggle('tall', tall);
    document.body.classList.toggle('wide', !tall);
    let fw, fh;
    if (tall) {
      const top = 50, bot = Math.max(86, Math.min(120, ih * 0.11));
      fh = ih - top - bot; fw = (fh * 9) / 16;
      if (fw > iw) { fw = iw; fh = (fw * 16) / 9; }
    } else {
      fh = ih; fw = (fh * 9) / 16;
      const minPanel = Math.min(190, iw * 0.24);
      if (fw > iw - 2 * minPanel) { fw = iw - 2 * minPanel; fh = (fw * 16) / 9; }
    }
    field.style.width = Math.floor(fw) + 'px';
    field.style.height = Math.floor(fh) + 'px';
  }
  addEventListener('resize', layout);
  layout();

  /* ---------------- sound ---------------- */
  let curSong = '';
  function music(name) { if (curSong === name) return; curSong = name; if (name) GK.music.play(OZ.SONGS[name]); else GK.music.stop(); }
  const thr = {};
  function snd(name, gap, fn) { const now = performance.now(); if (thr[name] && now - thr[name] < gap) return; thr[name] = now; if (!GK.muted) fn(); }
  const SND = {
    shot: () => snd('shot', 75, () => GK.noise({ d: 0.03, v: 0.05, f: 4200, filter: 'highpass' })),
    hit: () => snd('hit', 60, () => GK.tone({ f: 1500, f2: 900, d: 0.03, type: 'triangle', v: 0.05 })),
    kill: () => snd('kill', 40, () => { GK.noise({ d: 0.16, v: 0.22, f: 2600, q: 0.6 }); GK.tone({ f: 620, f2: 180, d: 0.12, type: 'triangle', v: 0.12 }); }),
    big: () => { GK.noise({ d: 0.7, v: 0.45, f: 900, filter: 'lowpass' }); GK.noise({ d: 0.5, v: 0.25, f: 3000, q: 0.5, at: 0.05 }); GK.tone({ f: 120, f2: 40, d: 0.6, type: 'sine', v: 0.45 }); },
    graze: () => snd('graze', 45, () => GK.tone({ f: 2600, d: 0.02, type: 'square', v: 0.025 })),
    item: () => snd('item', 50, () => GK.tone({ f: 1320, f2: 1760, d: 0.05, type: 'triangle', v: 0.06 })),
    fire: () => snd('fire', 90, () => GK.tone({ f: 700, f2: 500, d: 0.04, type: 'sine', v: 0.05 })),
    bomb: () => { GK.noise({ d: 1.0, v: 0.35, f: 5000, filter: 'highpass' }); [1047, 1319, 1568, 2093].forEach((f, i) => GK.tone({ f, d: 0.3, type: 'triangle', v: 0.1, at: i * 0.06 })); GK.tone({ f: 200, f2: 1200, d: 0.5, type: 'sawtooth', v: 0.05 }); },
    die: () => { GK.sfx('boom'); [660, 494, 370, 247].forEach((f, i) => GK.tone({ f, d: 0.16, type: 'triangle', v: 0.14, at: 0.1 + i * 0.09 })); },
    warn: () => { for (let i = 0; i < 4; i++) { GK.tone({ f: 220, d: 0.22, type: 'square', v: 0.07, at: i * 0.5 }); GK.tone({ f: 165, d: 0.22, type: 'square', v: 0.07, at: i * 0.5 + 0.25 }); } },
    laser: () => snd('laser', 200, () => GK.tone({ f: 300, f2: 900, d: 0.4, type: 'sawtooth', v: 0.04 })),
    power: () => GK.sfx('power'),
    extend: () => GK.sfx('win'),
    phase: () => { GK.noise({ d: 0.5, v: 0.3, f: 2000, q: 0.4 }); GK.tone({ f: 880, f2: 1760, d: 0.3, type: 'triangle', v: 0.12 }); },
  };

  /* ---------------- HUD (DOM) ---------------- */
  const hudEls = {};
  $$('[data-hud]').forEach((el) => { (hudEls[el.dataset.hud] = hudEls[el.dataset.hud] || []).push(el); });
  const hudCache = {};
  function hud(key, val, html) {
    if (hudCache[key] === val) return;
    hudCache[key] = val;
    for (const el of hudEls[key] || []) { if (html) el.innerHTML = html(); else el.textContent = val; }
  }
  const ICON_LIFE = '<svg viewBox="-20 -20 40 40" class="ic"><path d="M0-17 2-5 18 2 2 4 0 16-2 4-18 2-2-5Z" fill="#e5484d" stroke="#fff3" stroke-width="1"/><path d="M0-17 2-5 18 2 2 4Z" fill="#f08a84"/></svg>';
  const ICON_BOMB = '<svg viewBox="-20 -20 40 40" class="ic"><rect x="-14" y="-12" width="10" height="10" fill="#f1c232" transform="rotate(-18)"/><rect x="2" y="-14" width="10" height="10" fill="#3daf68" transform="rotate(22)"/><rect x="-6" y="3" width="11" height="11" fill="#ee6aa7" transform="rotate(8)"/></svg>';
  const icons = (n, ic) => (n > 6 ? ic + '<em>×' + n + '</em>' : ic.repeat(Math.max(0, n)) || '<em>―</em>');
  function updateHud() {
    hud('score', GK.fmt(S.score));
    hud('hi', GK.fmt(Math.max(S.hi, S.score)));
    hud('lives', Math.max(0, S.lives), () => icons(Math.max(0, S.lives), ICON_LIFE));
    hud('bombs', S.bombs, () => icons(S.bombs, ICON_BOMB));
    const pw = S.power.toFixed(2);
    if (hudCache.pw !== pw) { hudCache.pw = pw; for (const el of hudEls.power || []) el.textContent = S.power >= 4 ? 'MAX' : pw; $$('.pbar i').forEach((i) => (i.style.width = ((S.power - 1) / 3) * 100 + '%')); }
    hud('graze', GK.fmt(S.graze));
    hud('mult', '×' + S.mult.toFixed(2));
    hud('diff', D.name);
    hud('stage', STAGES[S.stage].name + '　' + STAGES[S.stage].title);
  }

  /* ---------------- pools ---------------- */
  function shoot(x, y, ang, spd, type, col, o) {
    if (eb.length > 2400) return null;
    const b = ebFree.pop() || {};
    const T = OZ.BT[type];
    b.x = x; b.y = y; b.ang = ang; b.spd = spd * D.bs;
    b.vx = Math.cos(ang) * b.spd; b.vy = Math.sin(ang) * b.spd;
    if (o) { b.acc = (o.acc || 0) * D.bs; b.curve = o.curve || 0; b.ct = o.ct || 99; b.minS = (o.min || 0) * D.bs; b.maxS = (o.max || 999) * D.bs; } else { b.acc = 0; b.curve = 0; }
    b.dyn = !!(b.acc || b.curve);
    b.r = T.hit; b.spr = OZ.bspr(type, col); b.rot = T.rot; b.spin = type === 'star'; b.grazed = false; b.t = 0;
    eb.push(b);
    return b;
  }
  const fan = (x, y, n, spread, spd, ang, type, col, o) => { for (let i = 0; i < n; i++) shoot(x, y, ang + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0), spd, type, col, o); };
  const ring = (x, y, n, spd, a0, type, col, o) => { for (let i = 0; i < n; i++) shoot(x, y, a0 + (i / n) * TAU, spd, type, col, o); };
  const nn = (n) => Math.max(1, Math.round(n * (0.4 + 0.6 * D.dens)));
  const iv = (x) => x / (0.3 + 0.7 * D.dens);
  const aim = (o) => Math.atan2(P.y - o.y, P.x - o.x);

  function pshot(x, y, ang, kind, dmg, spd, home) {
    const b = pbFree.pop() || {};
    b.x = x; b.y = y; b.ang = ang; b.spd = spd; b.vx = Math.cos(ang) * spd; b.vy = Math.sin(ang) * spd; b.dmg = dmg; b.spr = OZ.pspr(kind); b.home = !!home;
    pb.push(b);
  }
  function part(kind, x, y, vx, vy, life, size, color, extra) {
    if (parts.length > 900) return null;
    const p = partFree.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.t = 0; p.size = size; p.color = color; p.rot = rnd() * TAU; p.vr = (rnd() - 0.5) * 12; p.text = extra || '';
    parts.push(p);
    return p;
  }
  function burst(x, y, cols, n, spd = 160) {
    for (let i = 0; i < n; i++) { const a = rnd() * TAU, s = spd * (0.3 + rnd()); part('scrap', x, y, Math.cos(a) * s, Math.sin(a) * s, 0.6 + rnd() * 0.6, 3 + rnd() * 4, cols[i % cols.length]); }
    part('ring', x, y, 0, 0, 0.4, 6, '#fff');
  }
  function popup(x, y, text, color = '#fff', size = 12) { part('txt', x, y, 0, -28, 1.1, size, color, text); }
  function item(kind, x, y, auto) {
    if (items.length > 450) return;
    const it = itemFree.pop() || {};
    it.kind = kind; it.x = x; it.y = y; it.vx = (rnd() - 0.5) * 70; it.vy = kind === 'star' ? -20 : -120 - rnd() * 50; it.auto = !!auto; it.t = 0;
    items.push(it);
  }
  function later(d, fn) { timers.push({ at: S.gt + d, fn }); }
  function shake(v) { S.shake = Math.max(S.shake || 0, v); }

  /* ---------------- score ---------------- */
  function addScore(v, mult = true) {
    S.score += Math.round((v * (mult ? S.mult : 1)) / 10) * 10;
    while (S.ext < EXTENDS.length && S.score >= EXTENDS[S.ext]) {
      S.ext++; S.lives++; SND.extend();
      popup(P.x, P.y - 30, '残機アップ！', '#ffe27a', 15);
    }
  }
  function graze() {
    S.graze++; S.stageGraze++;
    addScore(200);
    S.mult = Math.min(5, S.mult + 0.01); S.maxMult = Math.max(S.maxMult, S.mult);
    const a = rnd() * TAU;
    part('spark', P.x, P.y, Math.cos(a) * 140, Math.sin(a) * 140, 0.22, 5, '#fff7c2');
    SND.graze();
  }

  /* ---------------- enemies ---------------- */
  const FIRE = {
    aim: (e) => fan(e.x, e.y, D.rev ? 3 : 1, 0.24, 150 + S.stage * 15, aim(e), 'rice', e.bc),
    fan: (e) => fan(e.x, e.y, nn(3 + S.stage), 0.55, 135 + S.stage * 10, aim(e), 'scale', e.bc),
    ring: (e) => ring(e.x, e.y, nn(10 + S.stage * 3), 100, rnd() * TAU, 'orb', e.bc),
    needle: (e) => fan(e.x, e.y, nn(5), 0.7, 190, aim(e), 'needle', e.bc),
    tank: (e) => { ring(e.x, e.y, nn(14 + S.stage * 4), 82, e.t * 0.8, 'rice', e.bc); fan(e.x, e.y, nn(3), 0.3, 150, aim(e), 'orb', C.white); },
  };
  function spawn(type, x, y, o = {}) {
    const T = ET[type], pal = ECOL[S.stage];
    const cols = pal[type] || ['#f7f2e6'];
    const e = { type, T, x, y, hp: T.hp, r: T.r, t: 0, ft: o.delay != null ? o.delay : 0.7, shots: 0, vx: o.vx || 0, vy: o.vy != null ? o.vy : 80, path: o.path || 'line', o, a: o.a || 0, hitT: 0, ht: 0, hop: 0, da: o.path === 'curve' ? o.a - PI / 2 : 0,
      spr: OZ.enemySprite(type, cols[0], cols[1]), bc: pal.bc[(rnd() * pal.bc.length) | 0], dead: false };
    enemies.push(e);
    return e;
  }
  function updateEnemy(e, dt) {
    e.t += dt;
    const o = e.o;
    switch (e.path) {
      case 'curve':
        if (e.t < o.avT) e.a += o.av * dt;
        e.vx = Math.cos(e.a) * o.spd; e.vy = Math.sin(e.a) * o.spd;
        e.x += e.vx * dt; e.y += e.vy * dt; break;
      case 'stop':
        if (e.t < 1.2 + o.wait) { const k = Math.min(1, dt * 3); e.vx = (o.tx - e.x) * 3; e.vy = (o.ty - e.y) * 3; e.x += (o.tx - e.x) * k; e.y += (o.ty - e.y) * k; } else { e.vy += 150 * dt; e.vx += (o.lx || 0) * dt; e.x += e.vx * dt; e.y += e.vy * dt; }
        break;
      case 'sine': e.y += e.vy * dt; e.x = o.x0 + Math.sin(e.t * o.f + o.ph) * o.amp; e.vx = Math.cos(e.t * o.f + o.ph) * o.amp * o.f; break;
      case 'hop': {
        e.ht += dt;
        if (e.ht > 1.05) { e.ht = 0; e.vx = (rnd() - 0.5) * 120; e.vy = 120; }
        if (e.ht < 0.45) { e.x += e.vx * dt; e.y += e.vy * dt; e.hop = Math.sin((e.ht / 0.45) * PI); } else if (e.hop > 0) {
          e.hop = 0;
          if (e.y > 20 && e.y < H * 0.6 && Math.hypot(P.x - e.x, P.y - e.y) > 90) { FIRE.ring(e); SND.fire(); }
        }
        if (e.x < 20) e.vx = Math.abs(e.vx); if (e.x > W - 20) e.vx = -Math.abs(e.vx);
        break;
      }
      case 'dive':
        if (e.t > o.t1 && !e.dived) { e.dived = true; const a = aim(e); e.vx = Math.cos(a) * o.spd * D.bs; e.vy = Math.max(60, Math.sin(a) * o.spd * D.bs); }
        e.x += e.vx * dt; e.y += e.vy * dt; break;
      default: e.x += e.vx * dt; e.y += e.vy * dt;
    }
    if (o.fire && e.y > 12 && e.y < H * 0.68 && e.shots < (o.n || 99)) {
      e.ft -= dt;
      if (e.ft <= 0) {
        e.ft = o.every || 1.2; e.shots++;
        if (Math.hypot(P.x - e.x, P.y - e.y) > 80) { FIRE[o.fire](e); SND.fire(); }
      }
    }
    if (e.hitT > 0) e.hitT -= dt;
    if (e.T.rot) { const want = e.vx * e.vx + e.vy * e.vy < 400 ? 0 : Math.atan2(e.vy, e.vx) - PI / 2; let da = want - e.da; da = Math.atan2(Math.sin(da), Math.cos(da)); e.da += da * Math.min(1, dt * 9); }
    if (e.t > 1.5 && (e.x < -50 || e.x > W + 50 || e.y > H + 50 || e.y < -90)) e.dead = true;
  }
  function killEnemy(e) {
    e.dead = true; S.kills++;
    addScore(e.T.score);
    burst(e.x, e.y, ['#fff', e.bc, '#f1e3c4'], e.r > 14 ? 26 : 12);
    SND.kill();
    if (e.r > 14) { for (let i = 0; i < 4; i++) item('pt', e.x + (rnd() - 0.5) * 30, e.y); item('P', e.x, e.y); shake(3); }
    else if (rnd() < 0.55) item(e.T.drop, e.x, e.y);
    if (D.rev && e.y < H * 0.7 && Math.hypot(P.x - e.x, P.y - e.y) > 110) shoot(e.x, e.y, aim(e), 120, 'orb', C.white);
  }
  function hurt(e, d) {
    e.hp -= d; e.hitT = 0.06;
    if (e.hp <= 0 && !e.dead) killEnemy(e); else SND.hit();
  }

  /* ---------------- bosses ---------------- */
  function ev(b, key, period, dt, first = 0.5) {
    let v = b.tm[key];
    if (v === undefined) v = first;
    v -= dt;
    let fired = false;
    if (v <= 0) { v += period; fired = true; if (v <= 0) v = period; }
    b.tm[key] = v;
    return fired;
  }
  function wander(b, dt, period, x0, x1, y0, y1) {
    if (ev(b, '_w', period, dt, period * 0.6)) { b.tx = clamp(b.x + (rnd() - 0.5) * 190, x0, x1); b.ty = clamp(b.y + (rnd() - 0.5) * 70, y0, y1); }
  }
  function laser(x, y, ang, o) {
    lasers.push({ x, y, ang, len: o.len || 1000, w: o.w || 14, warn: o.warn || 1, life: o.life || 1.6, t: 0, av: o.av || 0, color: o.color || '#e8584a', owner: o.owner || null, ox: o.owner ? x - o.owner.x : 0, oy: o.owner ? y - o.owner.y : 0, gz: 0, snd: false });
  }
  const MIDS = [
    { mid: true, name: '紙風船', draw: 'balloon', r: 24, phases: [{ name: '紙風船', hp: 900, time: 22, update(b, dt) {
      wander(b, dt, 2.6, 80, 280, 90, 150);
      if (ev(b, 'r', iv(1.25), dt)) { b.k = (b.k || 0) + 1; ring(b.x, b.y, nn(14), 100, b.pt * 0.6, 'orb', [C.red, C.blue, C.yellow, C.green][b.k % 4]); }
      if (ev(b, 'a', iv(0.9), dt, 0.9)) fan(b.x, b.y, 3, 0.35, 150, aim(b), 'rice', C.red);
    } }] },
    { mid: true, name: '奴さん', draw: 'yakko', r: 24, phases: [{ name: '奴さん', hp: 1150, time: 24, update(b, dt) {
      wander(b, dt, 3, 90, 270, 90, 140);
      if (ev(b, 's', iv(0.13), dt)) { const a = PI / 2 + Math.sin(b.pt * 1.7) * 1.0; shoot(b.x - 26, b.y, a, 150, 'scale', C.cyan); shoot(b.x + 26, b.y, PI - a, 150, 'scale', C.cyan); }
      if (ev(b, 'a', iv(2.0), dt, 1.2)) fan(b.x, b.y, nn(3), 0.5, 100, aim(b), 'big', C.purple);
    } }] },
    { mid: true, name: '風車', draw: 'pinwheel', r: 24, phases: [{ name: '風車', hp: 1350, time: 26, update(b, dt) {
      wander(b, dt, 3, 90, 270, 90, 140);
      b.a += dt * 2.0;
      if (ev(b, 's', iv(0.09), dt)) for (let i = 0; i < 4; i++) shoot(b.x, b.y, b.a + (i * PI) / 2, 118, 'star', [C.red, C.yellow, C.blue, C.green][i]);
      if (ev(b, 'a', iv(1.6), dt, 1)) fan(b.x, b.y, nn(5), 0.7, 170, aim(b), 'needle', C.white);
    } }] },
  ];
  const BOSSES = [
    { name: 'ハネマル', title: '池を統べる大蛙', who: '第一幕の主', img: 'boss-1', draw: 'frog', r: 28, phases: [
      { name: '一の型「雨垂れ」', hp: 1700, time: 36, update(b, dt) {
        wander(b, dt, 2.4, 70, 290, 95, 150);
        if (ev(b, 'f', iv(0.85), dt)) fan(b.x, b.y + 10, nn(5), 0.55, 155, aim(b), 'rice', C.green);
        if (ev(b, 'r', iv(1.7), dt, 1)) ring(b.x, b.y, nn(18), 92, b.pt * 0.7, 'orb', C.cyan);
      } },
      { name: '二の型「蓮華渦」', hp: 2300, time: 45, init(b) { b.tx = W / 2; b.ty = 150; }, update(b, dt) {
        b.a += dt * 1.9;
        if (ev(b, 's', iv(0.1), dt)) { for (let i = 0; i < 3; i++) shoot(b.x, b.y, b.a + (i * TAU) / 3, 112, 'scale', C.pink); for (let i = 0; i < 3; i++) shoot(b.x, b.y, -b.a * 1.13 + (i * TAU) / 3 + 0.5, 92, 'scale', C.green); }
        if (ev(b, 'a', iv(2.2), dt, 1.5)) fan(b.x, b.y, 3, 0.25, 180, aim(b), 'big', C.yellow);
      } },
      { name: '終の型「跳ね雨」', hp: 2700, time: 50, update(b, dt) {
        if (ev(b, 'h', 1.7, dt, 0.4)) { b.tx = 70 + rnd() * 220; b.ty = 95 + rnd() * 70; b.jump = 0.55; }
        if (b.jump > 0) { b.jump -= dt; if (b.jump <= 0) { ring(b.x, b.y, nn(22), 112, rnd() * TAU, 'orb', C.green); ring(b.x, b.y, nn(10), 70, rnd() * TAU, 'big', C.yellow); b.squash = 0.25; shake(4); SND.fire(); } }
        if (ev(b, 'rain', iv(0.12), dt)) shoot(10 + rnd() * (W - 20), -6, PI / 2 + (rnd() - 0.5) * 0.25, 115 + rnd() * 55, 'rice', C.blue);
      } },
    ] },
    { name: 'スミゴイ', title: '夜川に棲む切り絵の大鯉', who: '第二幕の主', img: 'boss-2', draw: 'carp', r: 26, phases: [
      { name: '一の型「さざ波」', hp: 1900, time: 40, update(b, dt) {
        b.tx = W / 2 + Math.sin(b.pt * 0.7) * 90; b.ty = 120;
        if (ev(b, 'w', iv(0.13), dt)) { b.k = (b.k || 0) + 1; const s = b.k % 2 ? 1 : -1; shoot(b.x, b.y + 30, PI / 2 + s * 0.9, 125, 'rice', b.k % 4 < 2 ? C.blue : C.white, { curve: -s * 0.75, ct: 3 }); }
        if (ev(b, 'a', iv(1.5), dt, 1)) fan(b.x, b.y + 30, nn(3), 0.4, 95, aim(b), 'big', C.purple);
      } },
      { name: '二の型「滝登り」', hp: 2300, time: 45, init(b) { b.tx = W / 2; b.ty = 105; }, update(b, dt) {
        if (ev(b, 'L', 4.6, dt, 0.6)) { const s = rnd() < 0.5 ? 1 : -1; for (const d of [-0.62, 0, 0.62]) laser(b.x, b.y + 30, PI / 2 + d, { av: s * 0.22, warn: 1.1, life: 2.2, w: 13, color: '#e8584a', owner: b }); }
        if (ev(b, 'a', iv(0.62), dt, 1)) fan(b.x, b.y + 30, nn(3), 0.3, 165, aim(b), 'scale', C.cyan);
        if (ev(b, 'r', iv(2.3), dt, 2)) ring(b.x, b.y, nn(16), 80, rnd() * TAU, 'orb', C.white);
      } },
      { name: '終の型「渦潮」', hp: 2700, time: 50, update(b, dt) {
        wander(b, dt, 3, 90, 270, 100, 140);
        if (ev(b, 'r', iv(0.56), dt)) { b.k = (b.k || 0) + 1; const s = b.k % 2 ? 1 : -1; ring(b.x, b.y, nn(18), 30, rnd() * TAU, 'orb', s > 0 ? C.blue : C.white, { curve: s * 0.8, ct: 1.8, acc: 55, min: 30, max: 150 }); }
        if (ev(b, 'n', iv(1.3), dt, 1)) fan(b.x, b.y, 3, 0.18, 210, aim(b), 'needle', C.red);
      } },
    ] },
    { name: 'カミナギ', title: '天守を守る紙の龍', who: '第三幕の主', img: 'boss-3', draw: 'dragon', r: 24, phases: [
      { name: '一の型「千羽」', hp: 2000, time: 40, update(b, dt) {
        wander(b, dt, 2.5, 80, 280, 100, 150);
        b.a += dt * 1.3;
        if (ev(b, 's', iv(0.13), dt)) for (let i = 0; i < 5; i++) shoot(b.x, b.y, b.a + (i * TAU) / 5, 105, 'crane', C.white);
        if (ev(b, 'n', iv(1.0), dt, 0.8)) fan(b.x, b.y + 20, nn(3), 0.3, 205, aim(b), 'needle', C.red);
      } },
      { name: '二の型「簾」', hp: 2400, time: 45, init(b) { b.tx = W / 2; b.ty = 95; }, update(b, dt) {
        if (ev(b, 'L', 3.3, dt, 0.8)) { const xs = rnd.shuffle([0, 1, 2, 3, 4, 5]).slice(0, D.dens > 1 ? 3 : 2); xs.forEach((i) => laser(30 + i * 60, 0, PI / 2, { warn: 1.15, life: 1.3, w: 22, color: '#f0b04a' })); }
        if (ev(b, 'c', iv(0.55), dt)) { const sp = 24 / (0.5 + 0.5 * D.dens), gw = 74 + (1 - D.dens) * 40, gap = 20 + rnd() * (W - 40 - gw); for (let x = 8; x < W; x += sp) if (x < gap || x > gap + gw) shoot(x, -6, PI / 2, 92, 'petal', C.pink); }
      } },
      { name: '三の型「風車」', hp: 2600, time: 50, init(b) { b.tx = W / 2; b.ty = 150; b.dir = 1; }, update(b, dt) {
        if (ev(b, 'flip', 3.2, dt, 3.2)) b.dir *= -1;
        if (ev(b, 's', iv(0.1), dt)) { b.a += 0.26 * b.dir; for (let i = 0; i < 4; i++) { shoot(b.x, b.y, b.a + (i * PI) / 2, 95, 'star', C.yellow); shoot(b.x, b.y, b.a + (i * PI) / 2 + 0.12, 135, 'star', C.red); } }
        if (ev(b, 'a', iv(2), dt, 1.2)) fan(b.x, b.y, nn(3), 0.5, 110, aim(b), 'big', C.red);
      } },
      { name: '終の型「天守崩し」', hp: 3000, time: 60, update(b, dt) {
        wander(b, dt, 2.2, 70, 290, 90, 160);
        b.a += dt * 1.6;
        if (ev(b, 's', iv(0.11), dt)) for (let i = 0; i < 3; i++) shoot(b.x, b.y, b.a + (i * TAU) / 3, 100, 'scale', C.orange);
        if (ev(b, 'r', iv(1.5), dt, 1)) ring(b.x, b.y, nn(24), 40, rnd() * TAU, 'orb', C.purple, { acc: 70, min: 40, max: 170 });
        if (ev(b, 'f', iv(0.85), dt, 0.5)) fan(b.x, b.y + 20, nn(5), 0.6, 160, aim(b), 'rice', C.red);
      } },
    ] },
  ];
  function spawnBoss(def) {
    const b = { def, x: W / 2, y: -70, tx: W / 2, ty: def.mid ? 110 : 125, phase: -1, hp: 1, maxHp: 1, pt: 0, left: 0, inv: 0, t: 0, tm: {}, a: 0, hitT: 0, r: def.r, dying: 0, leaving: false, squash: 0, jump: 0, trail: [] };
    for (let i = 0; i < 16; i++) b.trail.push({ x: W / 2, y: -70 - i * 9 });
    S.boss = b;
    nextPhase(b);
    b.inv = def.mid ? 1.2 : 2.6;
    if (!def.mid) { showBossCard(def); music('boss'); }
  }
  function nextPhase(b) {
    b.phase++;
    const ph = b.def.phases[b.phase];
    b.hp = b.maxHp = ph.hp; b.left = ph.time; b.pt = 0; b.tm = {}; b.inv = 1.0; b.noMiss = true;
    if (ph.init) ph.init(b);
    if (!b.def.mid) S.phaseCard = { t: 0, text: ph.name };
  }
  function endPhase(b, killed) {
    cancelBullets(true);
    const last = b.phase + 1 >= b.def.phases.length;
    if (!b.def.mid) {
      if (killed && b.noMiss) { const bonus = 100000 * (S.stage + 1); addScore(bonus, false); popup(W / 2, 170, '撃破ボーナス ＋' + GK.fmt(bonus), '#ffe27a', 14); }
      else if (!killed) popup(W / 2, 170, '時間切れ', '#ffffff', 14);
      burst(b.x, b.y, ['#fff', '#ffe27a', C.red], 30, 220); SND.phase(); shake(5);
    }
    if (b.def.mid && !killed) { b.leaving = true; return; }
    if (!last) { nextPhase(b); return; }
    b.dying = 2.2; S.flash = 0.4;
  }
  function updateBoss(dt) {
    const b = S.boss;
    if (!b) return;
    b.t += dt;
    if (b.hitT > 0) b.hitT -= dt;
    b.squash = Math.max(0, b.squash - dt * 0.8);
    const k = Math.min(1, dt * (b.jump > 0 ? 7 : 2.4));
    if (b.leaving) { b.y -= 160 * dt; if (b.y < -90) S.boss = null; return; }
    if (b.dying > 0) {
      b.dying -= dt;
      if (rnd() < dt * 18) { burst(b.x + (rnd() - 0.5) * 70, b.y + (rnd() - 0.5) * 60, ['#fff', '#ffe27a', C.red, C.orange], 8, 180); SND.kill(); }
      if (b.dying <= 0) {
        burst(b.x, b.y, ['#fff', '#ffe27a', C.red, C.blue, C.green], 70, 320); SND.big(); shake(10); S.flash = 0.6;
        const n = b.def.mid ? 10 : 24;
        for (let i = 0; i < n; i++) item('pt', b.x + (rnd() - 0.5) * 80, b.y + (rnd() - 0.5) * 40);
        item('P', b.x - 12, b.y); item('P', b.x + 12, b.y);
        if (b.def.mid) item('b', b.x, b.y - 10);
        addScore(b.def.mid ? 30000 : 0);
        S.boss = null;
        if (!b.def.mid) later(1.4, stageClear);
      }
      return;
    }
    b.x += (b.tx - b.x) * k; b.y += (b.ty - b.y) * k;
    if (b.inv > 0) { b.inv -= dt; }
    const ph = b.def.phases[b.phase];
    if (b.inv <= 0.6 || b.phase > 0) { b.pt += dt; b.left -= dt; ph.update(b, dt); }
    if (b.left <= 0) endPhase(b, false);
    // the dragon's body: a chain that follows the head and drifts upward
    if (b.def.draw === 'dragon') {
      const tr = b.trail;
      tr[0].x = b.x; tr[0].y = b.y - 14;
      for (let i = 1; i < tr.length; i++) {
        const p = tr[i], q = tr[i - 1];
        p.y -= 22 * dt; p.x += Math.sin(b.t * 2.2 + i * 0.55) * 26 * dt;
        const dx = p.x - q.x, dy = p.y - q.y, l = Math.hypot(dx, dy) || 1;
        p.x = q.x + (dx / l) * 9; p.y = q.y + (dy / l) * 9;
      }
    }
  }
  function damageBoss(d) {
    const b = S.boss;
    if (!b || b.dying > 0 || b.leaving) return false;
    if (b.inv > 0) return true;
    b.hp -= d; b.hitT = 0.05;
    if (b.hp <= 0) endPhase(b, true); else SND.hit();
    return true;
  }
  function showBossCard(def) {
    const el = $('#bosscard');
    el.querySelector('img').src = 'img/' + def.img + '.webp';
    el.querySelector('small').textContent = def.who;
    el.querySelector('strong').textContent = def.name;
    el.querySelector('span').textContent = def.title;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(showBossCard.t);
    showBossCard.t = setTimeout(() => el.classList.remove('on'), 2800);
  }

  /* ---------------- stage scripts ---------------- */
  const WV = {
    arc(side, n, type, fire) { for (let i = 0; i < n; i++) later(i * 0.24, () => spawn(type, side < 0 ? -14 : W + 14, 64, { path: 'curve', spd: 150, a: side < 0 ? 0.12 : PI - 0.12, av: side < 0 ? 0.95 : -0.95, avT: 1.55, fire, every: 1.1, n: 1, delay: 0.5 + (i % 3) * 0.15 })); },
    col(type, x, n, fire, vy = 140) { for (let i = 0; i < n; i++) later(i * 0.32, () => spawn(type, x, -16, { path: 'line', vy, fire, every: 1.4, n: 1, delay: 0.6 + rnd() * 0.4 })); },
    stop(type, xs, fire, o = {}) { xs.forEach((x, i) => later(i * 0.25, () => spawn(type, x, -26, { path: 'stop', tx: x, ty: o.ty || 100 + (i % 2) * 34, wait: o.wait || 3.2, lx: (x < W / 2 ? -1 : 1) * 40, fire, every: o.every || 1.0, n: o.n || 3, delay: 1.0 }))); },
    hop(n) { for (let i = 0; i < n; i++) later(i * 0.45, () => spawn('frog', 50 + rnd() * 260, -16, { path: 'hop' })); },
    dive(n, type = 'shuriken') { for (let i = 0; i < n; i++) later(i * 0.32, () => spawn(type, 30 + rnd() * 300, -14, { path: 'dive', vy: 130, t1: 0.7 + rnd() * 0.4, spd: 250 })); },
    sine(n, type, x0, fire) { for (let i = 0; i < n; i++) later(i * 0.28, () => spawn(type, x0, -14, { path: 'sine', vy: 100, x0, amp: 64, f: 2.2, ph: 0, fire, every: 1.6, n: 1, delay: 0.8 })); },
    special(L, k) {
      if (L === 0) WV.hop(k);
      else if (L === 1) { WV.sine(k, 'fish', 100, 'aim'); WV.sine(k, 'fish', 260, 'aim'); }
      else WV.stop('crow', k > 4 ? [50, 120, 190, 260, 310] : [70, 150, 210, 290], k > 4 ? 'needle' : 'fan', { n: 2 });
    },
    warn(L) { S.warn = 2.6; SND.warn(); later(2.6, () => { S.warn = 0; spawnBoss(BOSSES[L]); }); },
  };
  function script(L) {
    const F = ['plane', 'fish', 'plane'][L], T = ['boat', 'boat', 'kabuto'][L];
    return [
      [1.0, () => WV.arc(-1, 6, 'plane', 'aim')],
      [3.6, () => WV.arc(1, 6, 'plane', 'aim')],
      [6.6, () => WV.special(L, 4)],
      [9.8, () => { WV.col(F, 80, 5, 'aim'); WV.col(F, 280, 5, 'aim'); }],
      [13.2, () => WV.stop(T, [180], 'tank', { wait: 4.5, n: 4, every: 1.3 })],
      [15.6, () => WV.arc(-1, 8, 'plane', 'aim')],
      [17.2, () => WV.arc(1, 8, 'plane', 'aim')],
      [20.2, () => WV.dive(6)],
      [23.2, () => WV.stop('plane', [60, 140, 220, 300], 'fan', { n: 2 })],
      [26.6, () => WV.special(L, 5)],
      [30.5, () => spawnBoss(MIDS[L])],
      [32.0, () => { WV.arc(-1, 6, 'plane', 'aim'); WV.arc(1, 6, 'plane', 'aim'); }],
      [34.6, () => WV.stop(T, [100, 260], 'tank', { wait: 4, n: 3, every: 1.4 })],
      [39.0, () => { [50, 130, 230, 310].forEach((x) => WV.col(F, x, 4, 'aim', 130)); }],
      [42.6, () => WV.dive(10)],
      [46.0, () => { WV.special(L, 6); WV.arc(-1, 6, 'plane', 'aim'); }],
      [50.0, () => WV.stop('plane', [40, 100, 160, 200, 260, 320], 'fan', { n: 2 })],
      [54.0, () => WV.stop(T, [80, 180, 280], 'tank', { wait: 4, n: 3, every: 1.5 })],
      [58.6, () => { WV.dive(8); WV.arc(1, 8, 'plane', 'aim'); }],
      [62.6, () => { WV.arc(-1, 8, 'plane', 'aim'); WV.arc(1, 8, 'plane', 'aim'); }],
      [68.0, () => WV.warn(L)],
    ];
  }

  /* ---------------- flow ---------------- */
  function clearField() {
    for (const b of eb) ebFree.push(b); eb.length = 0;
    for (const b of pb) pbFree.push(b); pb.length = 0;
    for (const p of parts) partFree.push(p); parts.length = 0;
    for (const it of items) itemFree.push(it); items.length = 0;
    enemies = []; lasers = []; timers = []; S.boss = null; S.warn = 0;
  }
  function newRun(dk, debug) {
    D = DIFF[dk]; SET.diff = dk; if (!debug) GK.store.set('diff', dk);
    Object.assign(S, { mode: 'play', paused: false, debug: !!debug, score: 0, lives: D.lives, bombs: 3, power: 1, graze: 0, mult: 1, maxMult: 1, kills: 0, deaths: 0, bombsUsed: 0, continues: 0, ext: 0, gt: 0, hi: best(dk).score, allClear: false, bombT: 0, flash: 0, shake: 0 });
    Object.assign(P, { x: W / 2, y: H - 80, inv: 2, dead: 0, enter: 0, shotT: 0 });
    for (const o of P.opts) { o.x = P.x; o.y = P.y; }
    showScreen(null);
    startStage(0);
  }
  function startStage(i) {
    clearField();
    S.stage = i; S.st = 0; S.si = 0; S.script = script(i); S.flow = 'stage'; S.stageGraze = 0; S.scroll = 0;
    S.decor = OZ.makeDecor(i);
    S.banner = { t: 0 };
    S.clearCard = null; S.phaseCard = null;
    music(STAGES[i].song);
    updateHud();
  }
  function stageClear() {
    cancelBullets(true);
    S.flow = 'clear';
    music('clear');
    const st = STAGES[S.stage];
    const b1 = 200000 * (S.stage + 1), b2 = Math.round(S.power * 25000), b3 = S.stageGraze * 300;
    addScore(b1 + b2 + b3, false);
    S.clearCard = { t: 0, title: st.name + '　突破', lines: [['突破ボーナス', b1], ['パワー', b2], ['グレイズ', b3]] };
    later(4.6, () => { if (S.stage < 2) startStage(S.stage + 1); else finish(true); });
  }
  function cancelBullets(stars) {
    for (const b of eb) { if (stars && items.length < 400 && b.y > 0 && b.y < H) item('star', b.x, b.y, true); ebFree.push(b); }
    eb.length = 0; lasers.length = 0;
  }
  function die() {
    S.pendingHit = false;
    if (P.dead > 0 || P.inv > 0 || DBG.inv) return;
    SND.die(); shake(9); S.flash = 0.35;
    burst(P.x, P.y, ['#fff', '#d93f3a', '#f1c232'], 40, 240);
    S.deaths++; S.lives--; S.mult = Math.max(1, S.mult - 1);
    if (S.boss) S.boss.noMiss = false;
    const lose = Math.min(S.power - 1, 0.6); S.power -= lose;
    for (let i = 0; i < 5; i++) item('p', P.x + (rnd() - 0.5) * 50, P.y - 10);
    cancelBullets(false);
    P.dead = 1.1;
  }
  function respawn() {
    if (S.lives < 0) { gameOver(); return; }
    Object.assign(P, { x: W / 2, y: H + 24, enter: 0.7, inv: 3.2, dead: 0 });
    S.bombs = Math.max(S.bombs, 3);
  }
  async function gameOver() {
    P.dead = 99;
    if (S.continues >= 3) { finish(false); return; }
    S.paused = true; modalOpen = true;
    const v = await GK.modal({ title: 'コンティニューしますか？', body: `<p>残機がなくなりました。続けると得点は 0 からになり、この幕の続きから飛べます（残り ${3 - S.continues} 回）。</p>`, dismissable: false, buttons: [{ label: 'あきらめる', value: 'no' }, { label: '続ける', value: 'yes', primary: true }] });
    modalOpen = false; S.paused = false;
    if (v === 'yes') {
      S.continues++; S.score = 0; S.ext = 0; S.lives = D.lives - 1; S.bombs = 3; S.mult = 1;
      Object.assign(P, { x: W / 2, y: H + 24, enter: 0.7, inv: 3.2, dead: 0 });
    } else finish(false);
  }
  function finish(clear) {
    S.mode = 'result'; S.allClear = clear;
    music(clear ? 'clear' : '');
    const bk = 'best:' + D.key, prev = best(D.key);
    const rec = !S.debug && S.score > prev.score;
    if (rec) GK.store.set(bk, { score: S.score, stage: S.stage + 1, clear, cont: S.continues });
    $('#rKicker').textContent = D.name + (S.continues ? `・コンティニュー ${S.continues} 回` : '');
    $('#rTitle').textContent = clear ? '全幕踏破！ 紙の国の空を飛びきりました' : `${STAGES[S.stage].name}「${STAGES[S.stage].title}」で力尽きました`;
    $('#rScore').textContent = GK.fmt(S.score);
    $('#rNew').hidden = !rec;
    $('#rBest').textContent = GK.fmt(Math.max(prev.score, rec ? S.score : 0));
    $('#rKills').textContent = GK.fmt(S.kills);
    $('#rGraze').textContent = GK.fmt(S.graze);
    $('#rMult').textContent = '×' + S.maxMult.toFixed(2);
    $('#rMiss').textContent = `${S.deaths} 回 ／ ${S.bombsUsed} 回`;
    showScreen('#result');
    if (clear) GK.sfx('win');
  }
  function showScreen(sel) {
    $$('.screen').forEach((s) => s.classList.toggle('on', '#' + s.id === sel));
    document.body.classList.toggle('playing', !sel);
    if (sel === '#title') { refreshTitle(); music('title'); S.mode = 'title'; }
  }

  /* ---------------- player ---------------- */
  function bomb() {
    if (S.mode !== 'play' || S.paused || P.dead > 0 || S.bombs <= 0 || S.bombT > 0 || S.flow !== 'stage') return;
    S.bombs--; S.bombsUsed++; S.bombT = 2.6; P.inv = Math.max(P.inv, 3.2); S.mult = Math.max(1, S.mult - 0.5);
    if (S.boss) S.boss.noMiss = false;
    cancelBullets(true);
    const cols = ['#e5484d', '#f1c232', '#3daf68', '#3b6fe0', '#ee6aa7', '#fff', '#f0892e'];
    for (let i = 0; i < 170; i++) { const a = rnd() * TAU, s = 80 + rnd() * 420; part('conf', P.x, P.y, Math.cos(a) * s, Math.sin(a) * s - 60, 1.4 + rnd() * 1.2, 3 + rnd() * 4, cols[i % cols.length]); }
    S.flash = 0.3; shake(6); SND.bomb();
  }
  function playerShoot() {
    const lv = Math.floor(S.power), f = P.focus;
    P.n++;
    pshot(P.x - 5, P.y - 12, -PI / 2, 'dart', 1.6, 900);
    pshot(P.x + 5, P.y - 12, -PI / 2, 'dart', 1.6, 900);
    if (lv >= 2) { const sp = f ? 0.04 : 0.17; pshot(P.x - 9, P.y - 4, -PI / 2 - sp, 'side', 1.0, 820); pshot(P.x + 9, P.y - 4, -PI / 2 + sp, 'side', 1.0, 820); }
    if (lv >= 3 && P.n % 2 === 0) {
      const n = lv >= 4 ? 4 : 2;
      for (let i = 0; i < n; i++) { const o = P.opts[i]; if (f) pshot(o.x, o.y - 6, -PI / 2, 'needle', 1.5, 950); else pshot(o.x, o.y - 6, -PI / 2 + (i % 2 ? 0.25 : -0.25), 'pcrane', 1.3, 520, true); }
    }
    SND.shot();
  }
  const OPT_N = [[-22, 6], [22, 6], [-38, 18], [38, 18]], OPT_F = [[-10, -14], [10, -14], [-19, -4], [19, -4]];
  function updatePlayer(dt) {
    if (P.dead > 0) { P.dead -= dt; if (P.dead <= 0) respawn(); P.dx = P.dy = 0; return; }
    if (P.inv > 0) P.inv -= dt;
    const k = GK.keys;
    let mx = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
    let my = (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0) - (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0);
    P.focus = k.has('ShiftLeft') || k.has('ShiftRight') || touchFocus;
    if (DBG.auto) { mx = 0; my = 0; const tx = S.boss ? S.boss.x : W / 2 + Math.sin(S.gt * 0.8) * 110; P.x += clamp(tx - P.x, -150 * dt, 150 * dt); P.y += clamp(H - 90 - P.y, -150 * dt, 150 * dt); }
    if (P.enter > 0) { P.enter -= dt; P.y += (H - 90 - P.y) * Math.min(1, dt * 6); mx = my = 0; P.dx = P.dy = 0; }
    const sp = P.focus ? 110 : 235;
    if (mx || my) { const l = Math.hypot(mx, my); P.x += (mx / l) * sp * dt; P.y += (my / l) * sp * dt; }
    P.x += P.dx; P.y += P.dy; P.dx = P.dy = 0;
    P.x = clamp(P.x, 10, W - 10); P.y = clamp(P.y, 16, H - 14);
    P.tilt += ((mx || clamp(P.vxs || 0, -1, 1)) - P.tilt) * Math.min(1, dt * 10);
    P.vxs = 0;
    const firing = SET.auto || DBG.auto || k.has('KeyZ') || k.has('Space') || (drag && drag.touch);
    P.shotT -= dt;
    if (firing && P.shotT <= 0 && P.enter <= 0 && S.flow !== 'clear') { P.shotT += 1 / 15; if (P.shotT < 0) P.shotT = 0; playerShoot(); }
    if (P.shotT < 0) P.shotT = 0;
    const tbl = P.focus ? OPT_F : OPT_N, kk = Math.min(1, dt * 12);
    for (let i = 0; i < 4; i++) { const o = P.opts[i]; o.x += (P.x + tbl[i][0] - o.x) * kk; o.y += (P.y + tbl[i][1] - o.y) * kk; }
  }

  /* ---------------- update ---------------- */
  function update(dt) {
    S.gt += dt; S.scroll += dt;
    if (timers.length) {
      let due = null;
      for (const t of timers) if (t.at <= S.gt) (due = due || []).push(t);
      if (due) { timers = timers.filter((t) => t.at > S.gt); due.forEach((t) => t.fn()); }
    }
    if (!S.boss && !S.warn && S.flow === 'stage') { S.st += dt; while (S.si < S.script.length && S.script[S.si][0] <= S.st) S.script[S.si++][1](); }
    updatePlayer(dt);
    // enemies
    for (const e of enemies) updateEnemy(e, dt);
    updateBoss(dt);
    // bomb
    if (S.bombT > 0) {
      S.bombT -= dt;
      if (eb.length) cancelBullets(true);
      S.bombTick = (S.bombTick || 0) - dt;
      if (S.bombTick <= 0) { S.bombTick = 0.1; for (const e of enemies) if (e.y > -10 && !e.dead) hurt(e, 6); damageBoss(14); }
    }
    // player shots
    let j = 0;
    for (let i = 0; i < pb.length; i++) {
      const b = pb[i];
      if (b.home) {
        let tgt = S.boss && !S.boss.dying && !S.boss.leaving ? S.boss : null, bd = 1e9;
        if (!tgt) for (const e of enemies) { if (e.y < 0 || e.dead) continue; const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2; if (d < bd) { bd = d; tgt = e; } }
        if (tgt) { const want = Math.atan2(tgt.y - b.y, tgt.x - b.x); let da = want - b.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); b.ang += clamp(da, -7 * dt, 7 * dt); b.vx = Math.cos(b.ang) * b.spd; b.vy = Math.sin(b.ang) * b.spd; }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -20 || b.x < -20 || b.x > W + 20 || b.y > H + 20) { pbFree.push(b); continue; }
      let hit = false;
      for (const e of enemies) {
        if (e.dead || e.y < -6) continue;
        const dx = e.x - b.x, dy = e.y - b.y, r = e.r + 4;
        if (dx * dx + dy * dy < r * r) { hurt(e, b.dmg * (P.focus ? 1.12 : 1)); hit = true; break; }
      }
      if (!hit && S.boss) { const B = S.boss, dx = B.x - b.x, dy = B.y - b.y, r = B.r + 5; if (dx * dx + dy * dy < r * r) hit = damageBoss(b.dmg * (P.focus ? 1.12 : 1)); }
      if (hit) { if (rnd() < 0.35) part('spark', b.x, b.y, (rnd() - 0.5) * 120, -60 - rnd() * 90, 0.18, 4, '#fff3c4'); pbFree.push(b); continue; }
      pb[j++] = b;
    }
    pb.length = j;
    enemies = enemies.filter((e) => !e.dead);
    // enemy bullets
    const alive = P.dead <= 0 && S.mode === 'play', canHit = alive && P.inv <= 0 && !DBG.inv;
    j = 0;
    for (let i = 0; i < eb.length; i++) {
      const b = eb[i];
      b.t += dt;
      if (b.dyn) {
        if (b.curve && b.t < b.ct) b.ang += b.curve * dt;
        if (b.acc) { b.spd += b.acc * dt; if (b.spd > b.maxS) b.spd = b.maxS; else if (b.spd < b.minS) b.spd = b.minS; }
        b.vx = Math.cos(b.ang) * b.spd; b.vy = Math.sin(b.ang) * b.spd;
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if ((b.x < -24 || b.x > W + 24 || b.y < -40 || b.y > H + 24) && b.t > 0.2) { ebFree.push(b); continue; }
      if (alive) {
        const dx = b.x - P.x, dy = b.y - P.y, d2 = dx * dx + dy * dy, gr = b.r + GRAZE;
        if (d2 < gr * gr) {
          const rr = b.r + PR;
          if (d2 < rr * rr && canHit) S.pendingHit = true;
          else if (!b.grazed && P.inv <= 0) { b.grazed = true; graze(); }
        }
      }
      eb[j++] = b;
    }
    eb.length = j;
    // lasers
    j = 0;
    for (const l of lasers) {
      l.t += dt;
      if (l.owner) { l.x = l.owner.x + l.ox; l.y = l.owner.y + l.oy; }
      if (l.t > l.warn) { l.ang += l.av * dt; if (!l.snd) { l.snd = true; SND.laser(); } }
      if (l.t > l.warn + l.life + 0.25) continue;
      if (l.t > l.warn && l.t < l.warn + l.life && alive) {
        const c = Math.cos(l.ang), s = Math.sin(l.ang), dx = P.x - l.x, dy = P.y - l.y, along = dx * c + dy * s, perp = Math.abs(-dx * s + dy * c);
        if (along > 0 && along < l.len) {
          const hw = l.w * 0.5 * Math.min(1, (l.t - l.warn) / 0.12) * 0.72;
          if (perp < hw + PR && canHit) S.pendingHit = true;
          else if (perp < hw + GRAZE && P.inv <= 0) { l.gz -= dt; if (l.gz <= 0) { l.gz = 0.09; graze(); } }
        }
      }
      lasers[j++] = l;
    }
    lasers.length = j;
    if (S.pendingHit) die();
    // items
    const pull = alive && P.y < LINE_Y;
    j = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      it.t += dt;
      if ((it.auto || pull) && alive && it.t > 0.25) {
        if (pull && !it.auto) it.top = true;
        it.auto = true;
        const dx = P.x - it.x, dy = P.y - it.y, l = Math.hypot(dx, dy) || 1, sp = 600;
        it.x += (dx / l) * sp * dt; it.y += (dy / l) * sp * dt;
      } else { it.vy = Math.min(it.vy + 300 * dt, 120); it.vx *= 0.97; it.x += it.vx * dt; it.y += it.vy * dt; }
      if (alive) { const dx = P.x - it.x, dy = P.y - it.y; if (dx * dx + dy * dy < 400) { collect(it); itemFree.push(it); continue; } }
      if (it.y > H + 20) { itemFree.push(it); continue; }
      items[j++] = it;
    }
    items.length = j;
    // particles
    j = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { partFree.push(p); continue; }
      if (p.kind === 'scrap' || p.kind === 'conf') { p.vx *= 1 - 2.2 * dt; p.vy = p.vy * (1 - 2.2 * dt) + (p.kind === 'conf' ? 90 : 60) * dt; p.rot += p.vr * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      parts[j++] = p;
    }
    parts.length = j;
    if (S.flash > 0) S.flash -= dt;
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 20);
    if (S.banner) { S.banner.t += dt; if (S.banner.t > 3) S.banner = null; }
    if (S.phaseCard) { S.phaseCard.t += dt; if (S.phaseCard.t > 2.6) S.phaseCard = null; }
    if (S.clearCard) S.clearCard.t += dt;
  }
  function collect(it) {
    const prevLv = Math.floor(S.power);
    switch (it.kind) {
      case 'p': if (S.power >= 4) addScore(2000); else S.power = Math.min(4, S.power + 0.05); break;
      case 'P': if (S.power >= 4) addScore(20000); else S.power = Math.min(4, S.power + 0.5); break;
      case 'b': S.bombs = Math.min(8, S.bombs + 1); popup(it.x, it.y, '紙吹雪 ＋1', '#9df0b8', 13); SND.power(); break;
      case 'pt': {
        const v = it.top || P.y < LINE_Y ? 10000 : Math.round((10000 * clamp(1 - (P.y - LINE_Y) / 520, 0.25, 1)) / 10) * 10;
        addScore(v); S.mult = Math.min(5, S.mult + 0.01); S.maxMult = Math.max(S.maxMult, S.mult);
        if (v >= 10000 && rnd() < 0.3) popup(it.x, it.y, GK.fmt(Math.round(v * S.mult / 10) * 10), '#bcd4ff', 10);
        break;
      }
      case 'star': addScore(100); S.mult = Math.min(5, S.mult + 0.002); break;
    }
    if (Math.floor(S.power) > prevLv) { SND.power(); popup(P.x, P.y - 26, S.power >= 4 ? 'パワー最大！' : 'パワーアップ！', '#ffd2c2', 13); }
    if (it.kind !== 'star') SND.item();
  }

  /* ---------------- render ---------------- */
  let FK = 1, FX = 0, FY = 0;
  function spr(img, x, y, ang, sc = 1) {
    const k = (FK * sc) / img.rs;
    if (ang) { const c = Math.cos(ang) * k, s = Math.sin(ang) * k; ctx.setTransform(c, s, -s, c, FX + x * FK, FY + y * FK); }
    else ctx.setTransform(k, 0, 0, k, FX + x * FK, FY + y * FK);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }
  const logical = () => ctx.setTransform(FK, 0, 0, FK, FX, FY);
  function render() {
    view.clear();
    if (S.mode === 'title') return;
    const g = ctx;
    const sx = S.shake > 0 ? (rnd() - 0.5) * S.shake : 0, sy = S.shake > 0 ? (rnd() - 0.5) * S.shake : 0;
    FK = view.dpr * view.scale; OZ.setRS(FK); FX = view.dpr * view.ox + sx * FK; FY = view.dpr * view.oy + sy * FK;
    logical();
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    const st = STAGES[S.stage];
    OZ.drawBg(g, S.stage, st, S.scroll, GK.images[st.bg], S.decor, W, H, S.gt, FK);
    // the pull line
    g.globalAlpha = P.y < LINE_Y ? 0.5 : 0.16; g.strokeStyle = S.stage === 0 ? '#5a4a30' : '#fff'; g.setLineDash([4, 6]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, LINE_Y); g.lineTo(W, LINE_Y); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    // items
    for (const it of items) spr(OZ.ispr(it.kind), it.x, it.y, it.kind === 'star' ? 0 : it.t * 3);
    // enemies
    for (const e of enemies) {
      const a = e.T.spin ? e.t * e.T.spin : e.T.rot ? e.da : 0;
      const s = e.type === 'frog' ? 1 + e.hop * 0.25 : 1;
      spr(e.spr, e.x, e.y, a, s);
      if (e.hitT > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; spr(e.spr, e.x, e.y, a, s); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    }
    logical();
    // boss
    const B = S.boss;
    if (B) {
      if (B.inv > 0 && !B.dying) g.globalAlpha = 0.75 + Math.sin(S.gt * 40) * 0.2;
      OZ.drawBoss[B.def.draw](g, B, B.t);
      g.globalAlpha = 1;
      if (B.hitT > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25; OZ.drawBoss[B.def.draw](g, B, B.t); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    }
    // player shots
    for (const b of pb) spr(b.spr, b.x, b.y, b.ang);
    logical();
    // player
    if (P.dead <= 0) {
      const blink = P.inv > 0 && Math.floor(S.gt * 16) % 2 === 0;
      if (Math.floor(S.power) >= 3) { const n = S.power >= 4 ? 4 : 2; for (let i = 0; i < n; i++) { const o = P.opts[i]; g.save(); g.translate(o.x, o.y); g.rotate(S.gt * 3 * (i % 2 ? 1 : -1)); OZ.path(g, [0, -5, 5, 0, 0, 5, -5, 0]); g.fillStyle = i % 2 ? '#f1c232' : '#fbf6ec'; g.fill(); g.strokeStyle = 'rgba(60,30,10,.6)'; g.lineWidth = 0.8; g.stroke(); g.restore(); } }
      OZ.drawPlayer(g, P.x, P.y, S.gt, P.tilt, blink ? 0.35 : 1);
    }
    // particles (under the bullets)
    for (const p of parts) {
      const a = 1 - p.t / p.life;
      if (p.kind === 'scrap' || p.kind === 'conf') {
        g.globalAlpha = Math.min(1, a * 2);
        const fl = Math.cos(p.rot * 1.3), s = p.size;
        g.setTransform(FK * Math.cos(p.rot) * fl, FK * Math.sin(p.rot) * fl, -FK * Math.sin(p.rot), FK * Math.cos(p.rot), FX + p.x * FK, FY + p.y * FK);
        g.fillStyle = p.color; g.fillRect(-s / 2, -s / 2, s, s);
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, -s / 2, s / 2, s);
      } else if (p.kind === 'spark') {
        logical(); g.globalAlpha = a; g.strokeStyle = p.color; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); g.stroke();
      } else if (p.kind === 'ring') {
        logical(); g.globalAlpha = a * 0.8; g.strokeStyle = p.color; g.lineWidth = 2 * a + 0.5;
        g.beginPath(); g.arc(p.x, p.y, p.size + (1 - a) * 46, 0, TAU); g.stroke();
      }
    }
    g.globalAlpha = 1; logical();
    // enemy bullets — always on top, so they stay readable
    for (let i = 0; i < eb.length; i++) {
      const b = eb[i];
      spr(b.spr, b.x, b.y, b.spin ? b.t * 6 : b.rot ? b.ang : 0, b.t < 0.1 ? 1.6 - b.t * 6 : 1);
    }
    logical();
    // lasers
    for (const l of lasers) {
      const ex = l.x + Math.cos(l.ang) * l.len, ey = l.y + Math.sin(l.ang) * l.len;
      if (l.t < l.warn) {
        g.globalAlpha = 0.35 + 0.3 * Math.abs(Math.sin(l.t * 14)); g.strokeStyle = l.color; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(ex, ey); g.stroke();
      } else {
        const t2 = l.t - l.warn, k = Math.min(1, t2 / 0.12) * (t2 > l.life ? Math.max(0, 1 - (t2 - l.life) / 0.25) : 1);
        g.lineCap = 'round';
        g.globalAlpha = 0.35; g.strokeStyle = l.color; g.lineWidth = l.w * k * 1.7; g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(ex, ey); g.stroke();
        g.globalAlpha = 0.95; g.lineWidth = l.w * k; g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = l.w * k * 0.38; g.stroke();
        g.lineCap = 'butt';
      }
      g.globalAlpha = 1;
    }
    // hitbox
    if (P.dead <= 0 && (P.focus || DBG.showHit)) {
      g.save(); g.translate(P.x, P.y); g.rotate(S.gt * 2);
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; g.setLineDash([5, 4]); g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.stroke(); g.setLineDash([]);
      g.restore();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(P.x, P.y, PR + 0.6, 0, TAU); g.fill();
      g.strokeStyle = '#d93f3a'; g.lineWidth = 1.2; g.stroke();
    }
    // text popups
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const p of parts) if (p.kind === 'txt') {
      const a = 1 - p.t / p.life;
      g.globalAlpha = Math.min(1, a * 2); g.font = `800 ${p.size}px ${SANS}`;
      g.lineWidth = 3; g.strokeStyle = 'rgba(20,12,8,.75)'; g.strokeText(p.text, p.x, p.y); g.fillStyle = p.color; g.fillText(p.text, p.x, p.y);
    }
    g.globalAlpha = 1;
    drawOverlays(g);
    g.restore();
    if (S.flash > 0) { logical(); g.fillStyle = `rgba(255,250,235,${Math.min(0.7, S.flash)})`; g.fillRect(0, 0, W, H); }
  }
  function drawOverlays(g) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const B = S.boss;
    if (B && !B.leaving) {
      const ph = B.def.phases[B.phase], x0 = 12, w = W - 24, y = 10;
      g.fillStyle = 'rgba(20,12,10,.55)'; g.fillRect(x0 - 2, y - 2, w + 4, 8);
      const segs = B.def.phases.length - B.phase - 1;
      g.fillStyle = B.dying > 0 ? '#ffffff' : B.def.mid ? '#f1c232' : '#e5484d';
      g.fillRect(x0, y, w * Math.max(0, B.hp / B.maxHp), 4);
      g.font = `700 10px ${SANS}`; g.textAlign = 'left';
      g.lineWidth = 3; g.strokeStyle = 'rgba(15,10,8,.8)';
      const label = B.def.mid ? B.def.name : `${B.def.name}　${ph.name}`;
      g.strokeText(label, x0, y + 16); g.fillStyle = '#fff'; g.fillText(label, x0, y + 16);
      for (let i = 0; i < segs; i++) { g.fillStyle = '#e5484d'; OZ.path(g, [W - 18 - i * 12, y + 16, W - 13 - i * 12, y + 11, W - 8 - i * 12, y + 16, W - 13 - i * 12, y + 21]); g.fill(); }
      g.textAlign = 'right'; const tl = Math.max(0, B.left).toFixed(1);
      g.font = `700 11px ${SANS}`; const tx = W - 14 - segs * 12;
      g.strokeText(tl, tx, y + 16); g.fillStyle = B.left < 8 ? '#ffb3a8' : '#fff'; g.fillText(tl, tx, y + 16);
      g.textAlign = 'center';
      // marker under the boss on the field edge
      g.fillStyle = 'rgba(229,72,77,.8)'; g.fillRect(B.x - 14, H - 4, 28, 4);
    }
    if (S.phaseCard && S.phaseCard.t > 0.2) {
      const t = S.phaseCard.t, a = Math.min(1, (t - 0.2) * 4, (2.6 - t) * 3);
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = 'rgba(20,12,10,.6)'; g.fillRect(0, 214, W, 34);
      g.font = `700 17px ${SERIF}`; g.fillStyle = '#fff'; g.fillText(S.phaseCard.text, W / 2 + (1 - Math.min(1, (t - 0.2) * 3)) * 40, 231);
      g.globalAlpha = 1;
    }
    if (S.banner) {
      const t = S.banner.t, a = Math.max(0, Math.min(1, t * 2.5, (3 - t) * 2));
      const st = STAGES[S.stage];
      g.globalAlpha = a;
      g.fillStyle = 'rgba(251,246,236,.9)'; g.beginPath(); g.moveTo(40, 268); g.lineTo(W - 34, 262); g.lineTo(W - 40, 342); g.lineTo(34, 348); g.closePath(); g.fill();
      g.fillStyle = 'rgba(217,63,58,.85)'; g.fillRect(40, 270, 6, 72);
      g.fillStyle = '#7a2a22'; g.font = `700 14px ${SERIF}`; g.fillText(st.name, W / 2, 288);
      g.fillStyle = '#231c16'; g.font = `800 30px ${SERIF}`; g.fillText(st.title, W / 2, 320);
      g.globalAlpha = 1;
    }
    if (S.warn > 0) {
      const t = 2.6 - S.warn, a = Math.min(1, t * 3, S.warn * 3);
      g.globalAlpha = a;
      g.fillStyle = 'rgba(120,10,16,.55)'; g.fillRect(0, 280, W, 64);
      g.save(); g.beginPath(); g.rect(0, 280, W, 64); g.clip();
      g.fillStyle = 'rgba(255,220,200,.18)'; const off = (S.gt * 60) % 32;
      for (let x = -64; x < W + 64; x += 32) { OZ.path(g, [x + off, 280, x + off + 14, 280, x + off - 18, 344, x + off - 32, 344]); g.fill(); }
      g.restore();
      g.fillStyle = '#fff'; g.font = `800 28px ${SERIF}`; g.fillText('大物接近', W / 2, 306);
      g.font = `600 11px ${SANS}`; g.fillText('この幕の主が現れます', W / 2, 332);
      g.globalAlpha = 1;
    }
    if (S.clearCard) {
      const c = S.clearCard, t = c.t, a = Math.min(1, t * 2.5, (4.6 - t) * 2.5);
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = 'rgba(251,246,236,.94)'; g.fillRect(36, 220, W - 72, 170);
      g.strokeStyle = 'rgba(217,63,58,.8)'; g.lineWidth = 2; g.strokeRect(42, 226, W - 84, 158);
      g.fillStyle = '#231c16'; g.font = `800 24px ${SERIF}`; g.fillText(c.title, W / 2, 256);
      g.font = `600 13px ${SANS}`;
      c.lines.forEach(([k, v], i) => { if (t < 0.5 + i * 0.35) return; g.textAlign = 'left'; g.fillStyle = '#6f655a'; g.fillText(k, 66, 298 + i * 24); g.textAlign = 'right'; g.fillStyle = '#231c16'; g.fillText('＋' + GK.fmt(v), W - 66, 298 + i * 24); });
      g.textAlign = 'center';
      g.globalAlpha = 1;
    }
    if (S.paused && !modalOpen) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H); }
  }

  /* ---------------- input ---------------- */
  let drag = null;
  const SENS = 1.15;
  wrap.addEventListener('pointerdown', (e) => {
    if (S.mode !== 'play' || e.target.closest('button') || drag) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse' };
    try { wrap.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || S.paused) return;
    const s = view.scale || 1, dx = ((e.clientX - drag.x) / s) * SENS, dy = ((e.clientY - drag.y) / s) * SENS;
    P.dx += dx; P.dy += dy; P.vxs = clamp(dx / 4, -1, 1);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);
  wrap.style.touchAction = 'none';
  $$('.bombBtn').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); bomb(); }));
  $$('.focusBtn').forEach((b) => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); touchFocus = true; b.classList.add('on'); });
    const off = () => { touchFocus = false; b.classList.remove('on'); };
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  });
  $$('.pauseBtn').forEach((b) => b.addEventListener('click', () => openPause()));
  addEventListener('keydown', (e) => {
    if (S.mode === 'play') {
      if ((e.code === 'Escape' || e.code === 'KeyP') && !modalOpen) { e.preventDefault(); openPause(); }
      if (e.code === 'KeyX' && !e.repeat) bomb();
    } else if (S.mode === 'title' && !document.querySelector('.gk-modal-back')) {
      const order = ['easy', 'normal', 'hard'];
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { const i = order.indexOf(SET.diff) + (e.code === 'ArrowLeft' ? -1 : 1); selectDiff(order[(i + 3) % 3]); GK.sfx('select'); }
      if ((e.code === 'KeyZ' || e.code === 'Enter') && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); GK.sfx('ok'); newRun(SET.diff); }
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.mode === 'play' && !S.paused) openPause(); });
  async function openPause() {
    if (S.mode !== 'play' || modalOpen) return;
    S.paused = true; modalOpen = true; drag = null; touchFocus = false;
    GK.sfx('click');
    const v = await GK.modal({ title: '一時停止', body: `<p>${STAGES[S.stage].name}「${STAGES[S.stage].title}」　得点 ${GK.fmt(S.score)}</p>`, buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: '最初から', value: 'retry' }, { label: '再開する', value: 'resume', primary: true }] });
    modalOpen = false; S.paused = false;
    if (v === 'title') { clearField(); showScreen('#title'); }
    else if (v === 'retry') newRun(D.key);
  }

  /* ---------------- title / result ---------------- */
  function selectDiff(dk) {
    SET.diff = dk;
    $$('.diff').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.d === dk)));
  }
  function refreshTitle() {
    $$('.diff').forEach((b) => { const r = best(b.dataset.d); b.querySelector('small').textContent = r.score ? `最高 ${GK.fmt(r.score)}${r.clear ? '・踏破' : ''}` : 'まだ記録なし'; });
    selectDiff(SET.diff);
    $('#optAuto').checked = SET.auto;
  }
  $$('.diff').forEach((b) => b.addEventListener('click', () => { GK.sfx('select'); selectDiff(b.dataset.d); }));
  $('#startBtn').addEventListener('click', () => { GK.sfx('ok'); newRun(SET.diff); });
  $('#optAuto').addEventListener('change', (e) => { SET.auto = e.target.checked; GK.store.set('auto', SET.auto); });
  $('#titleHelp').addEventListener('click', () => { GK.sfx('click'); GK.help(); });
  $('#retryBtn').addEventListener('click', () => { GK.sfx('ok'); newRun(D.key); });
  $('#toTitleBtn').addEventListener('click', () => { GK.sfx('click'); showScreen('#title'); });

  GK.init({
    id: ID, title: '千代紙飛行',
    menu: () => { if (S.mode === 'play') openPause(); else if (S.mode === 'result') showScreen('#title'); else GK.help(); },
    help: `
      <p>紙の国の空を、一羽の折り鶴になって飛ぶ縦スクロールシューティングです。三つの幕を進み、それぞれの最後に待つ「主（ぬし）」を倒すと全幕踏破です。</p>
      <h3>操作</h3>
      <table>
        <tr><th>移動</th><td><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> または <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>。スマホは画面のどこをなぞっても、指が動いた分だけ鶴が動きます（指で鶴が隠れません）</td></tr>
        <tr><th>ショット</th><td><kbd>Z</kbd>（押している間）。タイトルで「自動連射」をオンにすると撃ち続けます。スマホは指を置いている間、自動で撃ちます</td></tr>
        <tr><th>低速移動</th><td><kbd>Shift</kbd>／スマホは「低速」ボタン。当たり判定（白い点）が見え、ショットが前に集まります</td></tr>
        <tr><th>紙吹雪（ボム）</th><td><kbd>X</kbd>／「紙吹雪」ボタン。画面の弾を消して星に変え、しばらく無敵になります</td></tr>
        <tr><th>一時停止</th><td><kbd>Esc</kbd> または右上のメニュー</td></tr>
      </table>
      <h3>ルール</h3>
      <ul>
        <li>当たり判定は鶴の中心の小さな点だけです。弾のすぐそばをかすめると「グレイズ」になり、得点と倍率が上がります。</li>
        <li>赤い色紙でパワーが上がり（最大 4.00）、ショットが増えます。3.00 からは子鶴が付き、追いかける鶴を飛ばします。</li>
        <li>青い色紙は得点です。画面上部の点線より上に行くと、出ている色紙をすべて吸い寄せ、青い色紙が最高点になります。緑の色紙は紙吹雪が 1 つ増えます。</li>
        <li>倍率（最大 ×5.00）はグレイズと青い色紙で上がり、被弾で −1.00、紙吹雪で −0.50 になります。</li>
        <li>得点が 100 万・250 万・450 万点に届くと残機が 1 つ増えます。</li>
        <li>主はいくつかの「型」で攻めてきます。被弾も紙吹雪もなしで型を破ると撃破ボーナス。時間切れになると次の型へ進みます。</li>
        <li>残機がなくなっても 3 回までコンティニューできます（得点は 0 から）。最高得点は難易度ごとに記録されます。</li>
      </ul>`,
  });

  /* ---------------- loop ---------------- */
  GK.loop((dt) => {
    frames++;
    const t0 = performance.now();
    if (S.mode === 'play' && !S.paused) {
      if (dt > 1 / 45) { update(dt / 2); update(dt / 2); } else update(dt);
      updateHud();
    } else if (S.mode === 'result' || S.mode === 'title') {
      if (S.mode === 'result' && parts.length) update(dt);
    }
    const t1 = performance.now();
    render();
    const t2 = performance.now();
    DBG.pu = (DBG.pu || 0) * 0.95 + (t1 - t0) * 0.05; DBG.pr = (DBG.pr || 0) * 0.95 + (t2 - t1) * 0.05;
  });

  const ready = GK.loadImages(['bg-stage1', 'bg-stage2', 'bg-stage3', 'boss-1', 'boss-2', 'boss-3']);
  showScreen('#title');

  /* ---------------- self-test (npm run game-check) ---------------- */
  window.__orizuru = { S, P, DBG, eb, newRun, startStage };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const shot = (n) => (window.__shot ? window.__shot(n) : null);
    const until = async (fn, ms) => { const t0 = performance.now(); while (!fn() && performance.now() - t0 < ms) await GK.wait(50); return fn(); };
    try {
      await ready;
      await shot('title');
      DBG.inv = true; DBG.auto = true;
      newRun('normal', true);
      await GK.wait(2600);
      await shot('stage1');
      // spray bullets to measure a heavy frame load
      for (let i = 0; i < 12; i++) ring(W / 2, 120, 60, 40 + i * 6, i * 0.1, i % 2 ? 'rice' : 'orb', i % 2 ? C.blue : C.red);
      const f0 = frames, t0 = performance.now();
      await GK.wait(1000);
      notes.push(`fps≈${Math.round(((frames - f0) * 1000) / (performance.now() - t0))} (bullets ${eb.length}, update ${DBG.pu.toFixed(1)}ms, render ${DBG.pr.toFixed(1)}ms)`);
      // jump to the boss of stage 1
      clearField(); S.si = S.script.length - 1; S.st = S.script[S.si][0] - 0.1;
      if (!(await until(() => S.boss && !S.boss.def.mid, 5000))) { ok = false; notes.push('boss did not appear'); }
      await GK.wait(3200);
      await shot('boss');
      for (let i = 0; i < 5 && S.boss && S.boss.dying <= 0; i++) { S.boss.inv = 0; S.boss.hp = 1; damageBoss(5); await GK.wait(1300); }
      if (!(await until(() => S.flow === 'clear', 6000))) { ok = false; notes.push('stage clear not reached'); }
      await shot('clear');
      // last stage, its boss, and the ending
      startStage(2); S.si = S.script.length - 1; S.st = S.script[S.si][0] - 0.1;
      await until(() => S.boss && !S.boss.def.mid, 5000);
      await GK.wait(3000);
      await shot('boss3');
      for (let i = 0; i < 6 && S.boss && S.boss.dying <= 0; i++) { S.boss.inv = 0; S.boss.hp = 1; damageBoss(5); await GK.wait(1200); }
      if (!(await until(() => S.mode === 'result', 12000))) { ok = false; notes.push('result screen not reached'); }
      if (!$('#result').classList.contains('on') || !S.allClear) { ok = false; notes.push('result not shown as clear'); }
      notes.push(`score ${S.score}`);
      await shot('result');
      showScreen('#title');
    } catch (e) { ok = false; notes.push('error: ' + (e && e.stack || e)); }
    DBG.inv = false; DBG.auto = false;
    return { ok, notes };
  };
})();
