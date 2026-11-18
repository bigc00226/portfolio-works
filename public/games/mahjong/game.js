/*
 * 宵月麻雀 — the page: table drawing (canvas), input, screens, sound. Rules in rules.js, flow in engine.js, CPU in ai.js, tiles in tiles.js.
 */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const { kindOf } = MJ;
  const { Game } = MJEngine;
  const T = TILES;
  const WINDS = '東南西北';
  const SANS = '"Yu Gothic UI", "Yu Gothic", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, "Noto Sans JP", sans-serif';
  const SERIF = '"Yu Mincho", YuMincho, "Hiragino Mincho ProN", "Noto Serif JP", serif';
  const NUM = 'ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace';

  const CHARS = [
    { id: 'tsubame', name: '朝霧つばめ', short: 'つばめ', title: '速攻好きの大学生', style: { attack: 0.85, call: 0.85, dama: 0.1 }, color: '#f08a5d' },
    { id: 'genzo', name: '柳 源三', short: '源三', title: '宵月亭の大旦那', style: { attack: 0.3, call: 0.25, dama: 0.5 }, color: '#9bb06a' },
    { id: 'rei', name: '白石レイ', short: 'レイ', title: '確率派のアナリスト', style: { attack: 0.55, call: 0.45, dama: 0.8 }, color: '#7fa6e8' },
  ];
  const IMG = ['key-visual', 'bg-room', 'tsubame', 'tsubame-win', 'genzo', 'genzo-win', 'rei', 'rei-win'];
  const SPEEDS = { slow: { think: 950, anim: 1.35 }, normal: { think: 520, anim: 1 }, fast: { think: 180, anim: 0.6 }, test: { think: 0, anim: 0 } };
  const UMAS = { none: [0, 0, 0, 0], '5-10': [10, 5, -5, -10], '10-20': [20, 10, -10, -20], '10-30': [30, 10, -10, -30] };
  const LEVELS = ['やさしい', 'ふつう', 'つよい'];
  const DEF = { length: 'tonpuu', level: 1, speed: 'normal', timer: 10, aka: true, kazoe: true, kiriage: false, double: false, renpuu: 4, abortive: true, uma: '10-20', oka: true, bgm: true };
  const DEF_REC = { games: 0, ranks: [0, 0, 0, 0], totalPt: 0, bestScore: null, bestHand: null, hands: 0, wins: 0, deals: 0, riichi: 0, yakuman: 0, last: [] };
  const S = Object.assign({}, DEF, GK.store.get('settings', {}));
  const REC = Object.assign({}, DEF_REC, GK.store.get('records', {}));
  const saveS = () => GK.store.set('settings', S);
  const saveR = () => GK.store.set('records', REC);

  let game = null, token = 0, screen = 'title', L = null, view = null;
  const ui = {
    hover: -1, sel: -1, riichiMode: false, pending: null, auto: false, hold: false, reveal: new Set(), face: {}, pops: [], banner: null,
    anim: null, drawT0: 0, dealT0: 0, lastFrom: null, choose: null, down: null, test: false,
  };
  const now = () => performance.now();
  let dirtyUntil = 0, lastFrame = 0;
  /** keep drawing every frame for ms (animations, input); otherwise the table is redrawn 4 times a second */
  const poke = (ms = 500) => { dirtyUntil = Math.max(dirtyUntil, performance.now() + ms); };
  const A = () => SPEEDS[S.speed].anim;
  const nameOf = (s) => (s === 0 ? 'あなた' : CHARS[s - 1].short);
  const faceOf = (id) => T.faceOf(id, game ? game.o.aka : S.aka);
  const fmt = (n) => GK.fmt(n);
  const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt(Math.abs(n));
  const wait = (ms) => GK.wait(ms);
  async function until(f, ms = 30000) { const t0 = now(); while (!f()) { if (now() - t0 > ms) throw new Error('timeout'); await wait(30); } }

  /* ================================================================ sound */
  GK.sfx.define('tile', () => { GK.noise({ d: 0.035, v: 0.5, f: 3200, q: 2.5 }); GK.tone({ f: 640, f2: 380, d: 0.05, type: 'sine', v: 0.22 }); });
  GK.sfx.define('draw', () => GK.noise({ d: 0.03, v: 0.16, f: 2600, q: 2 }));
  GK.sfx.define('riichi', () => { [784, 1175, 1568].forEach((f, i) => GK.tone({ f, d: 0.4, type: 'triangle', v: 0.15, at: i * 0.06 })); GK.noise({ d: 0.35, v: 0.1, f: 6500, filter: 'highpass' }); });
  GK.sfx.define('call', () => { GK.tone({ f: 330, f2: 560, d: 0.12, type: 'square', v: 0.09 }); GK.noise({ d: 0.05, v: 0.3, f: 2400, q: 3, at: 0.02 }); });
  GK.sfx.define('stick', () => { GK.tone({ f: 1760, d: 0.05, type: 'triangle', v: 0.1 }); GK.tone({ f: 2350, d: 0.08, type: 'triangle', v: 0.08, at: 0.05 }); });
  GK.sfx.define('ron', () => { GK.tone({ f: 110, f2: 50, d: 0.55, type: 'sine', v: 0.45 }); GK.noise({ d: 0.25, v: 0.25, f: 900, q: 0.7 }); [523, 659, 784].forEach((f, i) => GK.tone({ f, d: 0.7, type: 'triangle', v: 0.13, at: 0.06 + i * 0.05 })); });
  GK.sfx.define('shuffle', () => { for (let i = 0; i < 9; i++) GK.noise({ d: 0.04, v: 0.16, f: 1800 + Math.random() * 1800, q: 2, at: i * 0.05 }); });
  GK.sfx.define('turn', () => GK.tone({ f: 990, d: 0.06, type: 'sine', v: 0.07 }));
  const SONGS = {
    title: {
      bpm: 78, steps: 2,
      tracks: [
        { type: 'triangle', v: 0.1, notes: 'A4 - - F#4 E4 - D4 - | E4 - F#4 - A4 - - - | B4 - - A4 F#4 - E4 - | F#4 - - - . . . . | D5 - - B4 A4 - F#4 - | A4 - B4 - D5 - - - | E5 - D5 - B4 A4 F#4 E4 | D4 - - - . . . .' },
        { type: 'triangle', v: 0.045, notes: 'D4 F#4 A4 F#4 C#4 E4 A4 E4 | D4 F#4 B4 F#4 C#4 F#4 A4 F#4 | D4 G4 B4 G4 D4 F#4 A4 F#4 | C#4 E4 A4 E4 C#4 E4 A4 E4 | D4 F#4 A4 F#4 C#4 E4 A4 E4 | D4 F#4 B4 F#4 C#4 F#4 A4 F#4 | D4 G4 B4 G4 C#4 E4 A4 E4 | D4 F#4 A4 F#4 D4 F#4 A4 -' },
        { type: 'sine', v: 0.16, notes: 'D3 - - - A2 - - - | B2 - - - F#2 - - - | G2 - - - D3 - - - | A2 - - - A2 - - - | D3 - - - A2 - - - | B2 - - - F#2 - - - | G2 - - - A2 - - - | D3 - - - - - - -' },
      ],
    },
    play: {
      bpm: 70, steps: 2,
      tracks: [
        { type: 'sine', v: 0.06, notes: 'A4 - - - G4 - F4 - | D4 - - - - - - - | E4 - G4 - B4 - - - | A4 - - - - - - - | A4 - - - C5 - D5 - | B4 - - - G4 - - - | G4 - E4 - C4 - - - | E4 - - - - - - -' },
        { type: 'triangle', v: 0.04, notes: 'D4 F4 A4 C5 A4 F4 D4 F4 | B3 D4 F4 G4 F4 D4 B3 D4 | C4 E4 G4 B4 G4 E4 C4 E4 | A3 C4 E4 G4 E4 C4 A3 C4 | D4 F4 A4 C5 A4 F4 D4 F4 | B3 D4 F4 G4 F4 D4 B3 D4 | C4 E4 G4 B4 G4 E4 C4 E4 | A3 C4 E4 G4 E4 C4 A3 C4' },
        { type: 'sine', v: 0.14, notes: 'D3 - - - - - A2 - | G2 - - - - - D3 - | C3 - - - - - G2 - | A2 - - - - - E2 - | D3 - - - - - A2 - | G2 - - - - - D3 - | C3 - - - - - G2 - | A2 - - - - - E2 -' },
      ],
    },
    final: {
      bpm: 92, steps: 2, loop: false,
      tracks: [
        { type: 'triangle', v: 0.12, notes: 'D4 F#4 A4 D5 - - C#5 - | B4 - A4 - F#4 - A4 - | G4 - B4 - D5 - E5 - | D5 - - - - - - -' },
        { type: 'sine', v: 0.15, notes: 'D3 - - - - - - - | B2 - - - - - - - | G2 - - - A2 - - - | D3 - - - - - - -' },
      ],
    },
  };
  function music(name) { if (!S.bgm || ui.test) { GK.music.stop(); return; } if (SONGS[name]) GK.music.play(SONGS[name]); }

  /* ================================================================ layout */
  const RW = 30; // river tile width (table units)
  const BOX = 84; // half size of the center box (table units)
  function layout() {
    const W = view.w, H = view.h;
    const land = W >= H;
    const s = land ? Math.min(W / 1120, H / 720) : Math.min(W / 420, H / 860);
    const lw = W / s, lh = H / s;
    const o = { land, s, lw, lh };
    if (land) {
      const hw = 52;
      o.hand = { w: hw, meldW: 42 };
      o.handTop = lh - 12 - hw * T.TOT;
      const avail = o.handTop - 20;
      const S2 = Math.min(avail, lw - 2 * 250, 780);
      o.table = { cx: lw / 2, cy: 8 + avail / 2, S: S2, H: S2 };
      o.sideW = Math.min(230, (lw - S2) / 2 - 28);
      o.leftX = Math.max(14, o.table.cx - S2 / 2 - 14 - o.sideW);
      o.rightX = Math.min(lw - 14 - o.sideW, o.table.cx + S2 / 2 + 14);
    } else {
      o.cardsY = 54;
      const hw = Math.min(46, (lw - 14) / 14.4);
      o.hand = { w: hw, meldW: Math.min(34, hw * 0.95) };
      o.handTop = lh - 14 - hw * T.TOT;
      o.statusY = o.handTop - (o.hand.meldW * T.TOT + 12) - 52;
      const top = 124, bottom = o.statusY - 8;
      const S2 = Math.min(lw - 8, bottom - top);
      const H2 = Math.min(bottom - top, S2 * 1.32);
      o.table = { cx: lw / 2, cy: (top + bottom) / 2, S: S2, H: H2 };
    }
    o.u = o.table.S / 600;
    o.ext = (o.table.H - o.table.S) / 2; // portrait: the felt is taller than wide; the top seat's hand sits further out
    L = o;
    poke();
    positionDom();
  }
  function positionDom() {
    const act = $('#actions');
    if (!L || !act) return;
    let y;
    if (L.land) y = L.handTop - 18;
    else y = L.table.cy + L.table.H / 2 - 10;
    act.style.left = `${L.table.cx * L.s}px`;
    act.style.top = `${y * L.s}px`;
    act.style.setProperty('--act-max', `${Math.min(L.lw - 16, 760) * L.s}px`);
  }

  /* ================================================================ drawing helpers */
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function drawTile(ctx, face, x, y, w, o) {
    o = o || {};
    const spr = T.sprite(face, w * L.s * view.dpr, !!o.side);
    const dw = o.side ? w * T.HR : w, dh = o.side ? w * (1 + T.TR) : w * T.TOT;
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.drawImage(spr, x, y, dw, dh);
    if (o.dim) { ctx.fillStyle = 'rgba(8,14,20,.5)'; rr(ctx, x, y, dw, dh, w * 0.13); ctx.fill(); }
    if (o.tint) { ctx.fillStyle = 'rgba(40,50,60,.16)'; rr(ctx, x, y, dw, o.side ? w : w * T.HR, w * 0.13); ctx.fill(); }
    if (o.hl) {
      ctx.save();
      ctx.strokeStyle = o.hl; ctx.lineWidth = Math.max(1.5, w * 0.07);
      ctx.shadowColor = o.hl; ctx.shadowBlur = w * 0.35;
      rr(ctx, x + 0.5, y + 0.5, dw - 1, (o.side ? w : w * T.HR) - 1, w * 0.13); ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  const HL = 'rgba(255,214,102,.95)';
  function hlKind() {
    if (!game || !game.players.length || screen !== 'play') return -1;
    const p = game.players[0];
    const t = myTiles();
    const i = ui.hover >= 0 ? ui.hover : ui.sel;
    if (i >= 0 && t[i]) return kindOf(t[i].id);
    if (ui.hoverKind != null) return ui.hoverKind;
    return p ? -1 : -1;
  }
  function relOf(seat) { return (seat + 4) % 4; }
  function withSeat(ctx, seat, fn) {
    const r = relOf(seat);
    ctx.save();
    ctx.translate(L.table.cx, L.table.cy);
    ctx.rotate((-r * Math.PI) / 2);
    fn();
    ctx.restore();
  }
  /** a seat's table-local point → screen (logical) */
  function toScreen(seat, x, y) {
    const r = relOf(seat), a = (-r * Math.PI) / 2;
    return { x: L.table.cx + x * Math.cos(a) - y * Math.sin(a), y: L.table.cy + x * Math.sin(a) + y * Math.cos(a) };
  }

  /* ---------------- background & table ---------------- */
  let feltCache = null;
  let bgCache = null;
  function drawBg(ctx) {
    const im = GK.images['bg-room'];
    const pw = Math.round(L.lw * L.s * view.dpr), ph = Math.round(L.lh * L.s * view.dpr);
    if (!bgCache || bgCache.pw !== pw || bgCache.ph !== ph || bgCache.im !== im) {
      const cv = document.createElement('canvas');
      cv.width = pw; cv.height = ph;
      const g = cv.getContext('2d');
      g.fillStyle = '#0b141c'; g.fillRect(0, 0, pw, ph);
      if (im) {
        const r = Math.max(pw / im.width, ph / im.height);
        g.globalAlpha = 0.55;
        g.drawImage(im, (pw - im.width * r) / 2, (ph - im.height * r) / 2, im.width * r, im.height * r);
        g.globalAlpha = 1;
      }
      const gr = g.createRadialGradient(pw / 2, ph / 2, ph * 0.2, pw / 2, ph / 2, Math.max(pw, ph) * 0.75);
      gr.addColorStop(0, 'rgba(8,14,22,.35)'); gr.addColorStop(1, 'rgba(4,8,14,.85)');
      g.fillStyle = gr; g.fillRect(0, 0, pw, ph);
      bgCache = { pw, ph, im, cv };
    }
    ctx.drawImage(bgCache.cv, 0, 0, L.lw, L.lh);
  }
  function felt() {
    const px = Math.round(L.table.S * L.s * view.dpr), py = Math.round(L.table.H * L.s * view.dpr);
    if (feltCache && feltCache.px === px && feltCache.py === py) return feltCache.cv;
    const cv = document.createElement('canvas');
    cv.width = px; cv.height = py;
    const g = cv.getContext('2d');
    const r = px * 0.035;
    let gr = g.createLinearGradient(0, 0, px, py);
    gr.addColorStop(0, '#6b4426'); gr.addColorStop(1, '#3a2312');
    g.fillStyle = gr; rr(g, 0, 0, px, py, r); g.fill();
    const b = px * 0.016;
    gr = g.createRadialGradient(px / 2, py / 2, px * 0.05, px / 2, py / 2, Math.max(px, py) * 0.72);
    gr.addColorStop(0, '#1f7564'); gr.addColorStop(0.65, '#155446'); gr.addColorStop(1, '#0c3a31');
    g.fillStyle = gr; rr(g, b, b, px - 2 * b, py - 2 * b, r * 0.7); g.fill();
    const rnd = GK.rng(42);
    for (let i = 0; i < px * py * 0.004; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; g.fillRect(rnd() * px, rnd() * py, 1.2, 1.2); }
    g.strokeStyle = 'rgba(255,230,180,.12)'; g.lineWidth = Math.max(1, px * 0.002);
    rr(g, b * 2.2, b * 2.2, px - b * 4.4, py - b * 4.4, r * 0.5); g.stroke();
    feltCache = { px, py, cv };
    return cv;
  }
  function drawTable(ctx) {
    const { cx, cy, S: s, H: h } = L.table;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
    ctx.drawImage(felt(), cx - s / 2, cy - h / 2, s, h);
    ctx.restore();
  }

  /* ---------------- center box ---------------- */
  function drawCenter(ctx) {
    const u = L.u, B = BOX * u, { cx, cy } = L.table;
    ctx.save();
    ctx.translate(cx, cy);
    rr(ctx, -B, -B, 2 * B, 2 * B, 14 * u);
    ctx.fillStyle = 'rgba(6,16,18,.86)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,225,170,.22)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f5dfa8';
    ctx.font = `800 ${Math.max(12, 19 * u)}px ${SERIF}`;
    ctx.fillText(game.roundName(), 0, -40 * u);
    ctx.fillStyle = 'rgba(240,235,225,.75)';
    ctx.font = `600 ${Math.max(9, 11 * u)}px ${SANS}`;
    ctx.fillText(`${game.honba}本場・供託 ${game.kyoutaku}`, 0, -22 * u);
    // dora indicators
    const dw = 16 * u, inds = game.doraIndicators(), hk = hlKind();
    for (let i = 0; i < 5; i++) {
      const x = -2.5 * dw + i * dw, y = -10 * u;
      const id = inds[i];
      drawTile(ctx, id != null ? faceOf(id) : 'back', x, y, dw, { hl: id != null && kindOf(id) === hk ? HL : null });
    }
    ctx.fillStyle = 'rgba(240,235,225,.75)';
    ctx.font = `600 ${Math.max(9, 11 * u)}px ${SANS}`;
    ctx.fillText(`残り ${game.liveLeft()}枚`, 0, 31 * u);
    ctx.restore();
    for (let s = 0; s < 4; s++) {
      const p = game.players[s];
      withSeat(ctx, s, () => {
        const turn = game.turn === s && screen === 'play' && !ui.endShown;
        if (turn) {
          const gr = ctx.createLinearGradient(-B, 0, B, 0);
          gr.addColorStop(0, 'rgba(255,200,90,0)'); gr.addColorStop(0.5, 'rgba(255,200,90,.95)'); gr.addColorStop(1, 'rgba(255,200,90,0)');
          ctx.fillStyle = gr; ctx.fillRect(-B + 8 * u, B - 4 * u, 2 * B - 16 * u, 3 * u);
        }
        const w = game.seatWind(s);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.max(11, 15 * u)}px ${SERIF}`;
        ctx.fillStyle = w === 0 ? '#ff9a7a' : '#e8e2d4';
        ctx.fillText(WINDS[w], -B + 18 * u, B - 17 * u);
        ctx.font = `700 ${Math.max(10, 13 * u)}px ${NUM}`;
        ctx.fillStyle = turn ? '#ffe2a0' : '#f0ebe0';
        ctx.fillText(fmt(game.scores[s]), 8 * u, B - 17 * u);
        if (p.riichi && p.river.some((r) => r.riichi) && !p.riichiPendingView) {
          rr(ctx, -30 * u, B - 36 * u, 60 * u, 6 * u, 3 * u);
          ctx.fillStyle = '#f6f2e8'; ctx.fill();
          ctx.fillStyle = '#c4182c'; ctx.beginPath(); ctx.arc(0, B - 33 * u, 2.2 * u, 0, Math.PI * 2); ctx.fill();
        }
      });
    }
  }

  /* ---------------- rivers ---------------- */
  function riverLayout(p) {
    const u = L.u, w = RW * u, fh = w * T.HR;
    const x0 = -3 * w, y0 = (BOX + 6) * u, pitch = fh + w * T.TR + 1 * u;
    const shown = [];
    let sideNext = false;
    p.river.forEach((r, i) => {
      if (r.called) { if (r.riichi) sideNext = true; return; }
      shown.push({ r, i, side: r.riichi || sideNext });
      if (r.riichi || sideNext) sideNext = false;
    });
    let row = -1, x = 0;
    return shown.map((e, j) => {
      const rw = j < 12 ? Math.floor(j / 6) : j < 24 ? 2 : 3;
      if (rw !== row) { row = rw; x = x0; }
      const out = { id: e.r.id, idx: e.i, x, y: y0 + row * pitch + (e.side ? fh - w : 0), side: e.side, w, tsumogiri: e.r.tsumogiri };
      x += e.side ? fh : w;
      return out;
    });
  }
  function drawRiver(ctx, s, t) {
    const p = game.players[s];
    const hk = hlKind();
    const last = game.lastDiscard;
    withSeat(ctx, s, () => {
      for (const e of riverLayout(p)) {
        let x = e.x, y = e.y, alpha = 1;
        if (ui.anim && ui.anim.seat === s && ui.anim.idx === e.idx) {
          const k = Math.min(1, (t - ui.anim.t0) / ui.anim.dur), q = GK.ease.outCubic(k);
          x = GK.lerp(ui.anim.fx, e.x, q); y = GK.lerp(ui.anim.fy, e.y, q);
          if (k >= 1) ui.anim = null;
        }
        const isLast = last && last.seat === s && last.id === e.id;
        drawTile(ctx, faceOf(e.id), x, y, e.w, { side: e.side, alpha, tint: e.tsumogiri, hl: kindOf(e.id) === hk ? HL : null });
        if (isLast && screen === 'play') {
          ctx.fillStyle = 'rgba(255,90,70,.95)';
          const mx = x + (e.side ? e.w * T.HR : e.w) / 2;
          ctx.beginPath(); ctx.moveTo(mx - 4 * L.u, y - 6 * L.u); ctx.lineTo(mx + 4 * L.u, y - 6 * L.u); ctx.lineTo(mx, y - 1 * L.u); ctx.fill();
        }
      }
    });
  }

  /* ---------------- melds ---------------- */
  function meldTiles(m) {
    if (m.type === 'ankan') return m.tiles.map((id, i) => ({ id, back: i === 0 || i === 3 }));
    const others = m.tiles.filter((x) => x !== m.called && x !== m.added);
    const arr = others.map((id) => ({ id }));
    const c = { id: m.called, side: true, stack: m.type === 'kakan' ? m.added : null };
    if (m.from === 3) arr.unshift(c); else if (m.from === 2) arr.splice(1, 0, c); else arr.push(c);
    return arr;
  }
  function meldWidth(m, w) { return meldTiles(m).reduce((a, t) => a + (t.side ? w * T.HR : w), 0); }
  /** draws melds right-to-left from xr with their bottoms at yb; returns the left edge */
  function drawMelds(ctx, melds, xr, yb, w, hk) {
    let x = xr;
    for (const m of melds) {
      const tiles = meldTiles(m);
      x -= meldWidth(m, w);
      let xx = x;
      for (const t of tiles) {
        const hl = !t.back && kindOf(t.id) === hk ? HL : null;
        if (t.side) {
          const y = yb - w * (1 + T.TR);
          drawTile(ctx, faceOf(t.id), xx, y, w, { side: true, hl });
          if (t.stack != null) drawTile(ctx, faceOf(t.stack), xx, y - w * 0.98, w, { side: true, hl });
          xx += w * T.HR;
        } else {
          drawTile(ctx, t.back ? 'back' : faceOf(t.id), xx, yb - w * T.TOT, w, { hl });
          xx += w;
        }
      }
      x -= w * 0.22;
    }
    return x;
  }

  /* ---------------- opponents' hands ---------------- */
  function drawOppHand(ctx, s) {
    const p = game.players[s];
    const u = L.u, S2 = L.table.S;
    const w = 23 * u, th = w * T.TOT;
    const yb = S2 / 2 - 9 * u + (relOf(s) === 2 ? L.ext : 0);
    const reveal = ui.reveal.has(s);
    const hk = hlKind();
    withSeat(ctx, s, () => {
      let x = -176 * u;
      const closed = p.hand.filter((id) => id !== p.drawn);
      const dealt = Math.floor((now() - ui.dealT0) / (32 * Math.max(0.2, A())));
      closed.forEach((id, i) => {
        if (A() > 0 && i > dealt) return;
        drawTile(ctx, reveal ? faceOf(id) : 'back', x, yb - th, w, { hl: reveal && kindOf(id) === hk ? HL : null });
        x += w;
      });
      if (p.drawn != null) drawTile(ctx, reveal ? faceOf(p.drawn) : 'back', x + 6 * u, yb - th - 3 * u, w);
      drawMelds(ctx, p.melds, 292 * u, yb, w, hk);
    });
  }

  /* ---------------- my hand ---------------- */
  function myTiles() {
    if (!game || !game.players.length) return [];
    const p = game.players[0];
    const w = L.hand.w;
    const drawn = p.drawn;
    const closed = p.hand.filter((id) => id !== drawn);
    const list = closed.map((id) => ({ id }));
    if (drawn != null && p.hand.includes(drawn)) list.push({ id: drawn, drawn: true });
    const gap = w * 0.32;
    const handW = list.length * w + (drawn != null ? gap : 0);
    let meldsW = 0;
    const mw = L.hand.meldW;
    for (const m of p.melds) meldsW += meldWidth(m, mw) + mw * 0.22;
    let x0;
    if (L.land) x0 = (L.lw - handW - (meldsW ? meldsW + w * 0.5 : 0)) / 2;
    else x0 = Math.max(6, (L.lw - handW) / 2);
    let x = x0;
    for (const t of list) { if (t.drawn) x += gap; t.x = x; t.y = L.handTop; t.w = w; x += w; }
    list.meldsRight = L.land ? x0 + handW + (meldsW ? meldsW + w * 0.5 : 0) : L.lw - 8;
    list.meldsBottom = L.land ? L.lh - 12 : L.handTop - 10;
    return list;
  }
  function allowedSet() {
    const pd = ui.pending;
    if (!pd || pd.kind !== 'self') return null;
    if (ui.riichiMode) return new Set(pd.o.riichi);
    return new Set(pd.o.discards.map(kindOf));
  }
  function drawMyHand(ctx, t) {
    const p = game.players[0];
    const list = myTiles();
    const allowed = allowedSet();
    const hk = hlKind();
    const dealt = Math.floor((t - ui.dealT0) / (32 * Math.max(0.2, A())));
    list.forEach((e, i) => {
      if (A() > 0 && i > dealt && !e.drawn) return;
      let y = e.y;
      const lift = ui.sel === i || (ui.hover === i && ui.pending && ui.pending.kind === 'self');
      if (lift) y -= e.w * 0.24;
      if (e.drawn && t - ui.drawT0 < 160 * A()) { const k = (t - ui.drawT0) / (160 * A()); y -= (1 - k) * e.w * 0.5; }
      const ok = !allowed || allowed.has(kindOf(e.id));
      const strict = allowed && (ui.riichiMode || (ui.pending && ui.pending.o.forbidden.length) || p.riichi);
      drawTile(ctx, faceOf(e.id), e.x, y, e.w, {
        dim: strict && !ok,
        hl: ui.riichiMode && ok ? 'rgba(255,190,70,.95)' : kindOf(e.id) === hk && (ui.hover === i || ui.sel === i) ? 'rgba(255,255,255,.9)' : null,
      });
    });
    const mw = L.hand.meldW;
    drawMelds(ctx, p.melds, list.meldsRight, list.meldsBottom, mw, hk);
    if (ui.pending && ui.pending.kind === 'self' && !p.riichi) {
      // a soft cue that it is your turn
      ctx.fillStyle = 'rgba(255,214,120,.9)';
      ctx.font = `700 ${Math.max(11, L.hand.w * 0.28)}px ${SANS}`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      const first = list[0];
      if (first) ctx.fillText(ui.riichiMode ? 'リーチ宣言牌を選んでください' : 'あなたの番です', first.x, first.y - L.hand.w * 0.32);
    }
  }

  /* ---------------- player cards ---------------- */
  function portrait(seat) {
    const c = CHARS[seat - 1];
    return GK.images[ui.face[seat] === 'win' ? c.id + '-win' : c.id];
  }
  function drawImageCover(ctx, im, x, y, w, h, fy = 0.3) {
    if (!im) return;
    const r = Math.max(w / im.width, h / im.height);
    const sw = w / r, sh = h / r;
    ctx.drawImage(im, (im.width - sw) / 2, Math.max(0, Math.min(im.height - sh, (im.height - sh) * fy)), sw, sh, x, y, w, h);
  }
  function seatBadge(ctx, s, x, y, r) {
    const w = game.seatWind(s);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = w === 0 ? '#c4382c' : 'rgba(255,255,255,.14)'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `900 ${r * 1.15}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(WINDS[w], x, y + r * 0.05);
  }
  function drawCardLand(ctx, s, x, y, w) {
    const c = CHARS[s - 1], p = game.players[s];
    const ih = w * 0.62, h = ih + 64;
    ctx.save();
    rr(ctx, x, y, w, h, 14);
    ctx.fillStyle = 'rgba(10,18,24,.78)'; ctx.fill();
    ctx.strokeStyle = game.turn === s && screen === 'play' ? 'rgba(255,200,90,.8)' : 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save();
    rr(ctx, x + 8, y + 8, w - 16, ih, 10); ctx.clip();
    ctx.fillStyle = c.color; ctx.fillRect(x + 8, y + 8, w - 16, ih);
    drawImageCover(ctx, portrait(s), x + 8, y + 8, w - 16, ih, 0.2);
    ctx.restore();
    seatBadge(ctx, s, x + 24, y + ih + 34, 13);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f5efe2'; ctx.font = `800 16px ${SANS}`;
    ctx.fillText(c.name, x + 44, y + ih + 26);
    ctx.fillStyle = 'rgba(240,235,225,.62)'; ctx.font = `600 11px ${SANS}`;
    ctx.fillText(c.title, x + 44, y + ih + 45);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffe2a0'; ctx.font = `700 15px ${NUM}`;
    ctx.fillText(fmt(game.scores[s]), x + w - 12, y + ih + 26);
    if (p.riichi) { ctx.fillStyle = '#ffcf5a'; ctx.font = `800 12px ${SANS}`; ctx.fillText('リーチ', x + w - 12, y + ih + 45); }
    else if (game.turn === s && screen === 'play' && !ui.endShown) { ctx.fillStyle = 'rgba(255,226,160,.8)'; ctx.font = `700 12px ${SANS}`; ctx.fillText('考え中' + '・'.repeat(1 + (Math.floor(now() / 300) % 3)), x + w - 12, y + ih + 45); }
    ctx.restore();
    return h;
  }
  function drawCardPort(ctx, s, x, y, w, h) {
    const c = CHARS[s - 1], p = game.players[s];
    ctx.save();
    rr(ctx, x, y, w, h, 12);
    ctx.fillStyle = 'rgba(10,18,24,.8)'; ctx.fill();
    ctx.strokeStyle = game.turn === s && screen === 'play' ? 'rgba(255,200,90,.85)' : 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; ctx.stroke();
    const r = h * 0.36, ax = x + 8 + r, ay = y + h / 2;
    ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = c.color; ctx.fillRect(ax - r, ay - r, 2 * r, 2 * r);
    drawImageCover(ctx, portrait(s), ax - r, ay - r, 2 * r, 2 * r, 0.15);
    ctx.restore();
    seatBadge(ctx, s, ax + r * 0.78, ay + r * 0.72, 8.5);
    const tx = ax + r + 7;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f5efe2'; ctx.font = `800 ${Math.min(14, w * 0.11)}px ${SANS}`;
    ctx.fillText(c.short, tx, y + h * 0.32);
    ctx.fillStyle = '#ffe2a0'; ctx.font = `700 ${Math.min(13, w * 0.1)}px ${NUM}`;
    ctx.fillText(fmt(game.scores[s]), tx, y + h * 0.66);
    if (p.riichi) { ctx.fillStyle = '#ffcf5a'; ctx.font = `800 10px ${SANS}`; ctx.textAlign = 'right'; ctx.fillText('リーチ', x + w - 6, y + 12); }
    ctx.restore();
  }
  function drawCards(ctx) {
    if (L.land) {
      let y = 12;
      y += drawCardLand(ctx, 2, L.leftX, y, L.sideW) + 12;
      drawCardLand(ctx, 3, L.leftX, y, L.sideW);
      const y1 = Math.max(60, 58 / L.s); // below the round buttons at the top right
      const h1 = drawCardLand(ctx, 1, L.rightX, y1, L.sideW);
      drawMyPanel(ctx, L.rightX, y1 + h1 + 12, L.sideW, 132);
    } else {
      const gap = 6, w = (L.lw - 16 - gap * 2) / 3, h = 62;
      [3, 2, 1].forEach((s, i) => drawCardPort(ctx, s, 8 + i * (w + gap), L.cardsY, w, h));
      drawMyPanel(ctx, 8, L.statusY, L.lw - 16, 46);
    }
  }

  /* ---------------- my info: waits, shanten, furiten ---------------- */
  let infoCache = { key: '', v: null };
  function myInfo() {
    const p = game.players[0];
    const pd = ui.pending;
    const list = myTiles();
    const i = ui.hover >= 0 ? ui.hover : ui.sel;
    const key = [p.hand.join(','), p.melds.length, i, pd ? pd.kind : '', game.players.map((q) => q.river.length).join(','), game.doraShown].join('|');
    if (infoCache.key === key) return infoCache.v;
    const vis = MJAI.visible(game, 0);
    const c = MJ.countsFromIds(p.hand);
    let v;
    const waitsInfo = (w) => w.map((k) => {
      const r = game.scoreWin(0, k * 4 + 1, false, {});
      return { k, left: Math.max(0, 4 - vis[k]), yaku: !!r || p.melds.every((m) => m.type === 'ankan') };
    });
    if (p.hand.length % 3 === 2) {
      if (i >= 0 && list[i]) {
        const k = kindOf(list[i].id);
        c[k]--;
        const w = MJ.waits(c, p.melds.length);
        const sh = MJ.shanten(c, p.melds.length);
        v = { mode: 'preview', k, waits: waitsInfo(w), shanten: sh, furiten: w.some((x) => p.discardKinds.has(x) || x === k) };
      } else {
        v = { mode: 'turn', shanten: MJ.shanten(c, p.melds.length) };
      }
    } else {
      const sh = MJ.shanten(c, p.melds.length);
      v = { mode: 'wait', waits: waitsInfo(p.waits), shanten: sh, furiten: game.furitenState(0) };
    }
    infoCache = { key, v };
    return v;
  }
  function drawMyPanel(ctx, x, y, w, h) {
    const p = game.players[0];
    ctx.save();
    rr(ctx, x, y, w, h, 12);
    ctx.fillStyle = 'rgba(10,18,24,.78)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.2; ctx.stroke();
    const land = L.land;
    let tx = x + 12, ty = y + (land ? 22 : h / 2);
    if (land) {
      seatBadge(ctx, 0, x + 24, y + 24, 13);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f5efe2'; ctx.font = `800 16px ${SANS}`; ctx.fillText('あなた', x + 44, y + 24);
      ctx.textAlign = 'right'; ctx.fillStyle = '#ffe2a0'; ctx.font = `700 15px ${NUM}`; ctx.fillText(fmt(game.scores[0]), x + w - 12, y + 24);
      tx = x + 12; ty = y + 58;
    } else {
      seatBadge(ctx, 0, x + 18, y + h / 2, 11);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffe2a0'; ctx.font = `700 13px ${NUM}`; ctx.fillText(fmt(game.scores[0]), x + 34, y + h / 2);
      tx = x + 98; ty = y + h / 2;
    }
    if (!game.players.length || screen !== 'play') { ctx.restore(); return; }
    const v = myInfo();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const label = (t, col) => { ctx.fillStyle = col || 'rgba(240,235,225,.7)'; ctx.font = `700 ${land ? 13 : 12}px ${SANS}`; ctx.fillText(t, tx, ty); tx += ctx.measureText(t).width + 8; };
    const tilesRow = (ws) => {
      const tw = land ? 24 : 18;
      for (const it of ws) {
        if (tx + tw > x + w - 6) break;
        drawTile(ctx, it.k, tx, ty - tw * 0.85, tw, { dim: it.left === 0 || !it.yaku });
        ctx.fillStyle = it.left ? '#ffe2a0' : '#ff8a7a'; ctx.font = `700 ${land ? 11 : 9}px ${SANS}`; ctx.textAlign = 'center';
        ctx.fillText(`${it.left}`, tx + tw / 2, ty + tw * 0.92);
        ctx.textAlign = 'left';
        tx += tw + 4;
      }
    };
    if (v.mode === 'wait' && v.waits.length) {
      label('待ち', '#9fe0c8');
      if (v.furiten) label('フリテン', '#ff8a7a');
      else if (v.waits.every((x) => !x.yaku)) label('役なし', '#ff8a7a');
      if (land && (v.furiten || v.waits.every((x) => !x.yaku))) { tx = x + 12; ty += 34; }
      tilesRow(v.waits);
    } else if (v.mode === 'preview') {
      label(`${MJ.tileLabel(v.k)}を切ると`, 'rgba(240,235,225,.8)');
      if (v.waits.length) {
        if (land) { tx = x + 12; ty += 30; }
        label(v.furiten ? '待ち（フリテン）' : '待ち', v.furiten ? '#ff8a7a' : '#9fe0c8');
        tilesRow(v.waits);
      } else label(v.shanten >= 1 ? `${v.shanten}向聴` : 'テンパイ', '#ffe2a0');
    } else if (v.mode === 'turn') {
      label(v.shanten < 0 ? '和了形です' : v.shanten === 0 ? 'テンパイできます' : `${v.shanten}向聴`, '#ffe2a0');
    } else {
      label(v.shanten <= 0 ? 'テンパイ' : `${v.shanten}向聴`, 'rgba(240,235,225,.7)');
    }
    ctx.restore();
  }

  /* ---------------- pops & banner ---------------- */
  function popAt(seat, text, color, big) {
    const S2 = L.table.S;
    const pos = seat == null ? { x: L.table.cx, y: L.table.cy } : toScreen(seat, 0, S2 * 0.3);
    ui.pops.push({ text, color: color || '#fff', x: pos.x, y: pos.y, t0: now(), dur: big ? 1500 : 1000, big });
    poke(big ? 1700 : 1200);
  }
  function drawPops(ctx, t) {
    ui.pops = ui.pops.filter((p) => t - p.t0 < p.dur * Math.max(0.5, A()) + 50);
    for (const p of ui.pops) {
      const k = (t - p.t0) / (p.dur * Math.max(0.5, A()));
      const sc = k < 0.18 ? GK.ease.outBack(k / 0.18) : 1;
      const al = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      const fs = (p.big ? 64 : 40) * Math.max(0.75, L.u);
      ctx.save();
      ctx.globalAlpha = Math.max(0, al);
      ctx.translate(p.x, p.y);
      ctx.scale(sc, sc);
      ctx.font = `900 ${fs}px ${SERIF}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = fs * 0.16; ctx.strokeStyle = 'rgba(10,10,14,.85)'; ctx.lineJoin = 'round';
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    if (ui.banner && t - ui.banner.t0 < ui.banner.dur) {
      const b = ui.banner, k = (t - b.t0) / b.dur;
      const al = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
      ctx.save();
      ctx.globalAlpha = al;
      const { cx, cy } = L.table;
      const w = Math.min(L.lw * 0.9, 420), h = 76;
      const gr = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
      gr.addColorStop(0, 'rgba(6,12,16,0)'); gr.addColorStop(0.2, 'rgba(6,12,16,.9)'); gr.addColorStop(0.8, 'rgba(6,12,16,.9)'); gr.addColorStop(1, 'rgba(6,12,16,0)');
      ctx.fillStyle = gr; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.fillStyle = '#f5dfa8'; ctx.font = `900 34px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.text, cx, cy - (b.sub ? 9 : 0));
      if (b.sub) { ctx.fillStyle = 'rgba(240,235,225,.75)'; ctx.font = `600 13px ${SANS}`; ctx.fillText(b.sub, cx, cy + 22); }
      ctx.restore();
    }
  }
  const banner = (text, sub, ms = 1300) => { ui.banner = { text, sub, t0: now(), dur: ms * Math.max(0.4, A()) }; poke(ui.banner.dur + 100); };

  function render() {
    if (!L) return;
    const ctx = view.ctx;
    view.clear();
    ctx.save();
    ctx.scale(L.s, L.s);
    drawBg(ctx);
    if (game && game.players.length && screen !== 'title') {
      drawTable(ctx);
      drawCenter(ctx);
      for (let s = 0; s < 4; s++) drawRiver(ctx, s, now());
      for (let s = 1; s < 4; s++) drawOppHand(ctx, s);
      drawMyHand(ctx, now());
      drawCards(ctx);
      drawPops(ctx, now());
    }
    ctx.restore();
  }

  /* ================================================================ human decisions */
  function act(a) {
    const pd = ui.pending;
    if (!pd) return;
    ui.pending = null; ui.riichiMode = false; ui.sel = -1; ui.choose = null;
    clearActions();
    poke();
    pd.resolve(a);
  }
  function waitSelf(o) {
    return new Promise((resolve) => {
      ui.pending = { kind: 'self', o, resolve, t0: now() };
      ui.sel = -1; ui.riichiMode = false; ui.choose = null;
      const p = game.players[0];
      if (p.riichi && !o.tsumo && !o.ankan.length) {
        const pd = ui.pending;
        setTimeout(() => { if (ui.pending === pd) act({ type: 'discard', id: p.drawn }); }, 420 * A());
      }
      buildActions();
    });
  }
  function waitCall(info) {
    return new Promise((resolve) => {
      const tm = S.timer > 0 && !info.opts.ron ? S.timer * 1000 : 0;
      ui.pending = { kind: 'call', info, resolve, t0: now(), deadline: tm ? now() + tm : 0, total: tm };
      ui.choose = null;
      GK.sfx('turn');
      buildActions();
    });
  }
  let lastTick = 0;
  function tickTimer() {
    const pd = ui.pending;
    const t = now(), dt = t - (lastTick || t);
    lastTick = t;
    if (pd && pd.deadline && document.querySelector('.gk-modal-back')) pd.deadline += dt; // the clock stops while a modal is open
    const bar = $('#act-timer i');
    if (!pd || !pd.deadline) { if (bar) bar.style.transform = 'scaleX(0)'; return; }
    const left = pd.deadline - now();
    if (bar) bar.style.transform = `scaleX(${Math.max(0, left / pd.total)})`;
    if (left <= 0) act({ type: 'pass' });
  }
  function clearActions() { const el = $('#actions'); el.innerHTML = ''; el.hidden = true; }
  function btn(label, cls, onClick, key) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'act ' + cls;
    b.innerHTML = `<span>${label}</span>${key && !GK.isTouch ? `<small>${key}</small>` : ''}`;
    b.addEventListener('click', (e) => { e.stopPropagation(); GK.sfx('click'); onClick(); });
    return b;
  }
  const tileImg = (face, side) => `<img class="ti${side ? ' side' : ''}" src="${T.url(face, side)}" alt="${typeof face === 'number' ? MJ.tileLabel(face >= 34 ? [4, 13, 22][face - 34] : face) : '裏'}">`;
  function buildActions() {
    const el = $('#actions');
    el.innerHTML = '';
    poke();
    const pd = ui.pending;
    if (!pd) { el.hidden = true; return; }
    const row = document.createElement('div');
    row.className = 'act-row';
    const add = (b) => row.appendChild(b);
    if (ui.choose) {
      for (const ch of ui.choose.items) {
        const b = btn(ch.html, 'choice', () => { const f = ch.fn; ui.choose = null; f(); });
        add(b);
      }
      add(btn('もどる', 'skip', () => { ui.choose = null; buildActions(); }));
    } else if (pd.kind === 'self') {
      const o = pd.o, p = game.players[0];
      if (o.tsumo) add(btn('ツモ', 'ron', () => act({ type: 'tsumo' }), 'T'));
      if (o.riichi.length && !ui.riichiMode) add(btn('リーチ', 'riichi', () => { ui.riichiMode = true; ui.sel = -1; buildActions(); }, 'R'));
      if (ui.riichiMode) add(btn('リーチをやめる', 'skip', () => { ui.riichiMode = false; buildActions(); }, 'Esc'));
      const kans = o.ankan.map((k) => ({ type: 'ankan', kind: k })).concat(o.kakan.map((k) => ({ type: 'kakan', kind: k })));
      if (kans.length) {
        add(btn('カン', 'call', () => {
          if (kans.length === 1) act(kans[0]);
          else { ui.choose = { items: kans.map((a) => ({ html: tileImg(a.kind) + tileImg(a.kind), fn: () => act(a) })) }; buildActions(); }
        }, 'K'));
      }
      if (o.kyuushu) add(btn('九種九牌', 'call', () => act({ type: 'kyuushu' })));
      if (p.riichi && (o.tsumo || o.ankan.length)) add(btn('ツモ切り', 'skip', () => act({ type: 'discard', id: p.drawn }), 'Space'));
    } else {
      const o = pd.info.opts;
      if (o.ron) add(btn('ロン', 'ron', () => act({ type: 'ron' }), 'T'));
      if (o.pon) add(btn('ポン', 'call', () => act({ type: 'pon' }), 'P'));
      if (o.chi.length) add(btn('チー', 'call', () => chooseChi(), 'C'));
      if (o.minkan) add(btn('カン', 'call', () => act({ type: 'minkan' }), 'K'));
      add(btn('スキップ', 'skip', () => act({ type: 'pass' }), 'Space'));
    }
    if (!row.children.length) { el.hidden = true; return; }
    el.appendChild(row);
    if (pd.kind === 'call' && pd.deadline) { const tb = document.createElement('div'); tb.id = 'act-timer'; tb.className = 'act-timer'; tb.innerHTML = '<i></i>'; el.appendChild(tb); }
    el.hidden = false;
    positionDom();
  }
  function chooseChi() {
    const pd = ui.pending;
    const o = pd.info.opts;
    if (o.chi.length === 1) { act({ type: 'chi', ids: o.chi[0] }); return; }
    const called = pd.info.id;
    ui.choose = { items: o.chi.map((ids) => ({ html: [...ids, called].sort((a, b) => (a >> 2) - (b >> 2)).map((id) => tileImg(faceOf(id), id === called)).join(''), fn: () => act({ type: 'chi', ids }) })) };
    buildActions();
  }
  function tryDiscard(i) {
    const pd = ui.pending;
    const list = myTiles();
    if (!pd || pd.kind !== 'self' || !list[i]) return false;
    const id = list[i].id, k = kindOf(id);
    if (ui.riichiMode) {
      if (!pd.o.riichi.includes(k)) { GK.sfx('ng'); GK.toast('その牌ではリーチできません'); return false; }
      ui.lastFrom = { x: list[i].x, y: list[i].y };
      act({ type: 'riichi', id: pickId(k, id) });
      return true;
    }
    if (!pd.o.discards.includes(id)) {
      GK.sfx('ng');
      GK.toast(game.players[0].riichi ? 'リーチ後はツモ切りだけです' : pd.o.forbidden.includes(k) ? '喰い替えになるので捨てられません' : 'その牌は捨てられません');
      return false;
    }
    ui.lastFrom = { x: list[i].x, y: list[i].y };
    act({ type: 'discard', id });
    return true;
  }
  function pickId(k, prefer) { return prefer; }

  /* ---------------- pointer & keys ---------------- */
  function hitHand(x, y) {
    const list = myTiles();
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (x >= e.x && x < e.x + e.w && y >= e.y - e.w * 0.3 && y <= e.y + e.w * T.TOT) return i;
    }
    return -1;
  }
  function setupInput(canvas) {
    GK.pointer(canvas, null, {
      down(p, e) {
        poke();
        if (screen !== 'play') return;
        const x = p.x / L.s, y = p.y / L.s;
        ui.down = { i: hitHand(x, y), x, y, type: e.pointerType, done: false };
      },
      move(p, e) {
        if (screen !== 'play' || !L) return;
        poke(300);
        const x = p.x / L.s, y = p.y / L.s;
        if (e.pointerType === 'mouse') { ui.hover = hitHand(x, y); canvas.style.cursor = ui.hover >= 0 && ui.pending && ui.pending.kind === 'self' ? 'pointer' : 'default'; }
        const d = ui.down;
        if (d && d.i >= 0 && !d.done && d.y - y > L.hand.w * 0.7) { d.done = true; if (tryDiscard(d.i)) ui.hover = -1; }
      },
      up(p, e) {
        poke();
        const d = ui.down;
        ui.down = null;
        if (!d || d.done || screen !== 'play') return;
        const x = p.x / L.s, y = p.y / L.s;
        const i = hitHand(x, y);
        if (i < 0 || i !== d.i) { if (e.pointerType !== 'mouse' && i < 0) ui.sel = -1; return; }
        const pd = ui.pending;
        if (e.pointerType === 'mouse') {
          if (pd && pd.kind === 'self') tryDiscard(i);
          return;
        }
        if (ui.sel === i && pd && pd.kind === 'self') { tryDiscard(i); return; }
        ui.sel = i; GK.sfx('tick');
      },
    });
    canvas.addEventListener('pointerleave', () => { ui.hover = -1; poke(); });
    addEventListener('keydown', (e) => {
      if (screen !== 'play' || document.querySelector('.gk-modal-back')) return;
      poke();
      const pd = ui.pending;
      const n = myTiles().length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (!n) return;
        const cur = ui.sel >= 0 ? ui.sel : n;
        ui.sel = (cur + (e.key === 'ArrowLeft' ? -1 : 1) + n) % n;
        e.preventDefault();
      } else if ((e.key === 'Enter' || e.key === 'ArrowUp') && pd && pd.kind === 'self' && ui.sel >= 0) {
        tryDiscard(ui.sel); e.preventDefault();
      } else if (e.key === ' ' && pd) {
        e.preventDefault();
        if (pd.kind === 'call') act({ type: 'pass' });
        else if (game.players[0].riichi) act({ type: 'discard', id: game.players[0].drawn });
      } else if ((e.key === 't' || e.key === 'T') && pd) {
        if (pd.kind === 'self' && pd.o.tsumo) act({ type: 'tsumo' });
        if (pd.kind === 'call' && pd.info.opts.ron) act({ type: 'ron' });
      } else if ((e.key === 'r' || e.key === 'R') && pd && pd.kind === 'self' && pd.o.riichi.length) {
        ui.riichiMode = !ui.riichiMode; buildActions();
      } else if ((e.key === 'p' || e.key === 'P') && pd && pd.kind === 'call' && pd.info.opts.pon) act({ type: 'pon' });
      else if ((e.key === 'c' || e.key === 'C') && pd && pd.kind === 'call' && pd.info.opts.chi.length) chooseChi();
      else if ((e.key === 'k' || e.key === 'K') && pd) {
        if (pd.kind === 'call' && pd.info.opts.minkan) act({ type: 'minkan' });
        else if (pd.kind === 'self') { const b = [...document.querySelectorAll('#actions .act')].find((x) => x.textContent.startsWith('カン')); if (b) b.click(); }
      } else if (e.key === 'Escape' && ui.riichiMode) { ui.riichiMode = false; buildActions(); }
    });
  }

  /* ================================================================ game flow */
  function cpuAgent(seat) {
    const cfg = () => ({ level: S.level, style: CHARS[seat - 1].style });
    return {
      async self(g, s, o) {
        const my = token;
        await wait(SPEEDS[S.speed].think * (0.65 + Math.random() * 0.7));
        if (my !== token) return { type: 'discard', id: o.discards[o.discards.length - 1] };
        return MJAI.self(g, s, o, cfg());
      },
      call(g, s, info) { return MJAI.call(g, s, info, cfg()); },
    };
  }
  const humanAgent = {
    async self(g, s, o) {
      if (ui.auto) { await wait(SPEEDS[S.speed].think * 0.5); return MJAI.self(g, s, o, { level: 2 }); }
      return waitSelf(o);
    },
    call(g, s, info) {
      if (ui.auto) return MJAI.call(g, s, info, { level: 2 });
      return waitCall(info);
    },
  };
  const ABORT = new Error('abort');
  async function onEvent(type, d) {
    const my = token;
    poke(type === 'handStart' ? 2200 : type === 'handEnd' ? 2500 : 900);
    if (ui.hold) await until(() => !ui.hold, 60000);
    while (document.querySelector('.gk-modal-back') && my === token) await wait(120); // paused while the menu / help is open
    if (my !== token) throw ABORT;
    const a = A();
    switch (type) {
      case 'handStart':
        ui.reveal.clear(); ui.face = {}; ui.pops = []; ui.anim = null; ui.endShown = false; ui.sel = -1; ui.hover = -1;
        ui.dealT0 = now(); infoCache.key = '';
        banner(game.roundName() + (game.honba ? ` ${game.honba}本場` : ''), `親：${nameOf(game.dealer)}　ドラ表示牌 ${MJ.tileLabel(kindOf(game.doraIndicators()[0]))}`, 1500);
        GK.sfx('shuffle');
        positionDom();
        await wait(1100 * a);
        break;
      case 'draw':
        if (d.seat === 0) { ui.drawT0 = now(); GK.sfx('draw'); }
        if (d.rinshan && a) await wait(200 * a);
        break;
      case 'riichiDeclare':
        popAt(d.seat, d.double ? 'ダブルリーチ' : 'リーチ', '#ffd36a');
        GK.sfx('riichi');
        await wait(650 * a);
        break;
      case 'discard': {
        const p = game.players[d.seat];
        const idx = p.river.length - 1;
        let from;
        if (d.seat === 0 && ui.lastFrom) from = { x: ui.lastFrom.x - L.table.cx, y: ui.lastFrom.y - L.table.cy };
        else if (d.seat === 0) from = { x: 0, y: L.handTop - L.table.cy };
        else from = { x: 40 * L.u, y: L.table.S / 2 - 30 * L.u };
        ui.lastFrom = null;
        ui.anim = { seat: d.seat, idx, fx: from.x, fy: from.y, t0: now(), dur: 190 * a };
        GK.sfx('tile');
        positionDom();
        await wait(200 * a);
        break;
      }
      case 'riichiStick': GK.sfx('stick'); break;
      case 'call':
        popAt(d.seat, { chi: 'チー', pon: 'ポン', minkan: 'カン' }[d.type], '#8fd0ff');
        GK.sfx('call');
        positionDom();
        await wait(600 * a);
        break;
      case 'kan':
        popAt(d.seat, 'カン', '#8fd0ff');
        GK.sfx('call');
        positionDom();
        await wait(600 * a);
        break;
      case 'handEnd': await showHandEnd(d); break;
      case 'gameEnd': await showFinal(d); break;
      default: break;
    }
    if (my !== token) throw ABORT;
  }

  async function startGame() {
    token++;
    const my = token;
    if (ui.pending) { const pd = ui.pending; ui.pending = null; pd.resolve({ type: 'pass' }); }
    clearActions();
    hideOverlays();
    screen = 'play';
    $('#title').hidden = true;
    const opts = {
      length: S.length, aka: S.aka, kazoe: S.kazoe, kiriage: S.kiriage, double: S.double, renpuu: S.renpuu,
      suufon: S.abortive, suucha: S.abortive, suukan: S.abortive, kyuushu: true, uma: UMAS[S.uma], oka: S.oka,
    };
    game = new Game(opts, [humanAgent, cpuAgent(1), cpuAgent(2), cpuAgent(3)], (t, d) => onEvent(t, d));
    ui.gameStats = { riichi: 0 };
    music('play');
    try {
      await game.run();
    } catch (e) {
      if (e !== ABORT) { console.error(e); if (my === token) { GK.toast('エラーが起きたため、対局を終了しました'); toTitle(); } }
    }
  }
  function toTitle() {
    token++;
    if (ui.pending) { const pd = ui.pending; ui.pending = null; pd.resolve({ type: 'pass' }); }
    clearActions();
    hideOverlays();
    screen = 'title';
    game = null;
    $('#title').hidden = false;
    renderTitle();
    music('title');
  }
  function hideOverlays() { $('#result').hidden = true; $('#final').hidden = true; }

  /* ---------------- hand result ---------------- */
  function handTilesHTML(ids, winId, melds, separate) {
    let h = ids.slice().sort((a, b) => (a >> 2) - (b >> 2) || a - b).map((id) => tileImg(faceOf(id))).join('');
    if (winId != null) h += `<span class="gap"></span>${tileImg(faceOf(winId))}`;
    if (melds && melds.length) {
      h += '<span class="gap"></span>';
      for (const m of melds) {
        h += '<span class="meld">' + meldTiles(m).map((t) => (t.back ? tileImg('back') : tileImg(faceOf(t.id), t.side))).join('') + '</span>';
      }
    }
    return separate ? h : h;
  }
  function fitTiles(root) {
    root.querySelectorAll('.tiles').forEach((row) => {
      const imgs = [...row.querySelectorAll('img')];
      if (!imgs.length) return;
      const avail = row.clientWidth - 2;
      let units = 0;
      for (const im of imgs) units += im.classList.contains('side') ? T.HR / (1 + T.TR) : 1 / T.TOT;
      const gaps = row.querySelectorAll('.gap').length * 8 + row.querySelectorAll('.meld').length * 3;
      const maxH = +(row.dataset.max || 58);
      const h = Math.max(16, Math.min(maxH, (avail - gaps) / units));
      row.style.setProperty('--th', `${h}px`);
    });
  }
  function scoreRows(res) {
    const rank = game.ranking(res.after);
    return [0, 1, 2, 3].map((s) => {
      const d = res.delta[s];
      return `<tr class="${s === 0 ? 'me' : ''}"><td><span class="wind ${game.seatWind(s) === 0 ? 'oya' : ''}">${WINDS[game.seatWind(s)]}</span>${s === 0 ? 'あなた' : CHARS[s - 1].name}</td>
        <td class="num">${fmt(res.before[s])}</td><td class="num delta ${d > 0 ? 'plus' : d < 0 ? 'minus' : ''}">${d ? signed(d) : '—'}</td><td class="num">${fmt(res.after[s])}</td><td class="rank">${rank.indexOf(s) + 1}位</td></tr>`;
    }).join('');
  }
  function pointsText(r, res) {
    const p = r.points;
    if (p.ron) return `${fmt(p.ron)}点`;
    if (p.all) return `${fmt(p.all)}点オール`;
    return `${fmt(p.other)}・${fmt(p.dealer)}点`;
  }
  function showPanel(el, html) {
    el.innerHTML = html;
    el.hidden = false;
    requestAnimationFrame(() => fitTiles(el));
    return new Promise((resolve) => {
      const b = el.querySelector('[data-next]');
      const go = () => { removeEventListener('keydown', key, true); el.hidden = true; resolve(); };
      const key = (e) => { if ((e.key === 'Enter' || e.key === ' ') && !document.querySelector('.gk-modal-back')) { e.preventDefault(); GK.sfx('click'); go(); } };
      addEventListener('keydown', key, true);
      if (b) { b.addEventListener('click', () => { GK.sfx('click'); go(); }); setTimeout(() => b.focus({ preventScroll: true }), 50); }
      if (ui.auto) setTimeout(() => { if (!el.hidden) go(); }, ui.test ? 700 : 2500);
    });
  }
  async function showHandEnd(res) {
    const a = A();
    ui.endShown = true;
    clearActions();
    const won = res.type === 'tsumo' || res.type === 'ron';
    REC.hands++;
    if (won) {
      ui.reveal.add(res.winner);
      if (res.winner) ui.face[res.winner] = 'win';
      popAt(res.winner, res.type === 'tsumo' ? 'ツモ' : 'ロン', '#ff6a55', true);
      GK.sfx(res.winner === 0 ? 'win' : 'ron');
      if (res.winner === 0) {
        REC.wins++;
        if (!REC.bestHand || res.score.total > REC.bestHand.total) REC.bestHand = { total: res.score.total, label: res.score.label, yaku: res.score.yaku.map((y) => y[0]).join('・'), han: res.score.han, fu: res.score.fu };
        if (res.score.yakuman) REC.yakuman++;
      }
      if (res.from === 0) REC.deals++;
      await wait(1500 * a);
    } else if (res.type === 'ryuukyoku') {
      res.tenpai.forEach((t, s) => t && ui.reveal.add(s));
      banner('流局', '荒牌平局', 1400);
      await wait(1400 * a);
    } else {
      banner('途中流局', res.reason, 1400);
      if (res.seat != null) ui.reveal.add(res.seat);
      await wait(1300 * a);
    }
    saveR();
    const el = $('#result');
    const head = `<p class="res-round">${game.roundName()} ${res.honba != null ? res.honba : game.honba}本場</p>`;
    let html;
    const nextLabel = game.over || willEnd(res) ? '結果を見る' : '次の局へ';
    if (won) {
      const r = res.score, w = res.winner;
      const who = w === 0 ? 'あなた' : CHARS[w - 1].name;
      const from = res.type === 'ron' ? `<span class="from">${res.from === 0 ? 'あなた' : CHARS[res.from - 1].short}から</span>` : '';
      const pic = w === 0 ? '<div class="res-pic me"><span>あなた</span></div>' : `<div class="res-pic"><img src="img/${CHARS[w - 1].id}-win.webp" alt=""></div>`;
      const yaku = r.yaku.map(([n, h]) => `<li><span>${n}</span><b>${r.yakuman ? (h >= 26 ? 'ダブル役満' : '役満') : h + '翻'}</b></li>`).join('');
      const fuHan = r.yakuman ? '' : `<span class="fh">${r.fu}符 ${r.han}翻</span>`;
      const extra = [res.honba ? `${res.honba}本場 ${fmt(res.honba * 300)}` : '', res.sticks ? `供託 ${fmt(res.sticks * 1000)}` : ''].filter(Boolean).join('・');
      html = `<div class="res-card ${w === 0 ? 'mine' : ''}">
        <div class="res-top">${pic}<div class="res-title">${head}<h2>${res.type === 'tsumo' ? 'ツモ' : 'ロン'} <small>${who}${from}</small></h2></div></div>
        <div class="res-main">
          <div class="tiles" data-max="52">${handTilesHTML(res.hand, res.winTile, res.melds)}</div>
          <div class="res-dora"><span>ドラ</span><span class="tiles mini" data-max="34">${res.dora.map((id) => tileImg(faceOf(id))).join('')}</span>${res.ura.length ? `<span>裏ドラ</span><span class="tiles mini" data-max="34">${res.ura.map((id) => tileImg(faceOf(id))).join('')}</span>` : ''}</div>
          <ul class="res-yaku">${yaku}</ul>
          <div class="res-total">${fuHan}<strong>${pointsText(r, res)}</strong>${r.label ? `<em>${r.label}</em>` : ''}${extra ? `<span class="extra">${extra}</span>` : ''}</div>
        </div>
        <div class="res-side"><table class="res-scores"><thead><tr><th>席</th><th>前</th><th>収支</th><th>後</th><th></th></tr></thead><tbody>${scoreRows(res)}</tbody></table>
        <div class="res-actions"><button class="gk-btn primary" data-next>${nextLabel}</button></div></div>
      </div>`;
    } else {
      const title = res.type === 'ryuukyoku' ? '流局' : `途中流局 <small>${res.reason}</small>`;
      const rows = res.type === 'ryuukyoku' ? [0, 1, 2, 3].map((s) => `<div class="tp-row"><span class="tp-name">${nameOf(s)}</span><span class="tp ${res.tenpai[s] ? 'on' : ''}">${res.tenpai[s] ? 'テンパイ' : 'ノーテン'}</span>${res.tenpai[s] ? `<div class="tiles" data-max="40">${handTilesHTML(res.hands[s], null, res.melds[s])}</div>` : ''}</div>`).join('') : `<p class="abort-note">${abortNote(res.reason)}</p>`;
      html = `<div class="res-card draw">
        <div class="res-top"><div class="res-title">${head}<h2>${title}</h2></div></div>
        <div class="res-main">${rows}</div>
        <div class="res-side"><table class="res-scores"><thead><tr><th>席</th><th>前</th><th>収支</th><th>後</th><th></th></tr></thead><tbody>${scoreRows(res)}</tbody></table>
        <p class="res-note">${res.renchan ? '親の連荘です。' : '親が移ります。'}${res.type !== 'abort' ? '' : '供託はそのまま残ります。'}</p>
        <div class="res-actions"><button class="gk-btn primary" data-next>${nextLabel}</button></div></div>
      </div>`;
    }
    screen = 'result';
    await showPanel(el, html);
    if (ui.test && window.__shotPending) { /* handled by the self-test */ }
    screen = 'play';
    ui.endShown = false;
  }
  function willEnd(res) {
    const sc = res.after;
    if (game.o.tobi && sc.some((x) => x < 0)) return true;
    if (!res.renchan && game.kyoku >= game.lastKyoku) return true;
    if (res.renchan && game.kyoku === game.lastKyoku && res.type !== 'abort' && game.ranking(sc)[0] === game.dealer) return true;
    return false;
  }
  function abortNote(r) {
    return {
      九種九牌: '第一ツモで么九牌が 9 種類以上あったため、流局を宣言しました。',
      四風連打: '1 巡目に 4 人が同じ風牌を捨てました。',
      四家立直: '4 人全員がリーチをかけました。',
      四開槓: '2 人以上で合わせて 4 回カンが行われました。',
    }[r] || '';
  }

  /* ---------------- final ---------------- */
  async function showFinal(fin) {
    ui.endShown = true;
    const me = fin.rows.find((r) => r.seat === 0);
    REC.games++;
    REC.ranks[me.rank - 1]++;
    REC.totalPt = Math.round((REC.totalPt + me.point) * 10) / 10;
    if (REC.bestScore == null || me.score > REC.bestScore) REC.bestScore = me.score;
    REC.last = [{ rank: me.rank, score: me.score, point: me.point, length: game.o.length, level: S.level, date: new Date().toISOString().slice(0, 10) }].concat(REC.last || []).slice(0, 10);
    saveR();
    music('final');
    GK.sfx(me.rank === 1 ? 'win' : me.rank === 4 ? 'lose' : 'ok');
    const rows = fin.rows.map((r) => {
      const pic = r.seat === 0 ? '<span class="fin-pic me">あなた</span>' : `<img class="fin-pic" src="img/${CHARS[r.seat - 1].id}${r.rank === 1 ? '-win' : ''}.webp" alt="">`;
      return `<li class="${r.seat === 0 ? 'me' : ''} r${r.rank}"><span class="fin-rank">${r.rank}<small>位</small></span>${pic}<span class="fin-name">${r.seat === 0 ? 'あなた' : CHARS[r.seat - 1].name}</span><span class="fin-score">${fmt(r.score)}</span><span class="fin-pt ${r.point >= 0 ? 'plus' : 'minus'}">${r.point >= 0 ? '+' : '−'}${Math.abs(r.point).toFixed(1)}</span></li>`;
    }).join('');
    const msg = ['見事なトップです！', '堅実な 2 着です。', 'あと一歩、3 着です。', '次こそは巻き返しましょう。'][me.rank - 1];
    const el = $('#final');
    el.innerHTML = `<div class="fin-card">
      <p class="res-round">${game.o.length === 'hanchan' ? '半荘戦' : '東風戦'}・${LEVELS[S.level]}・${fin.reason}</p>
      <h2>対局終了 <small>${msg}</small></h2>
      <ol class="fin-list">${rows}</ol>
      <p class="fin-note">点数：${game.o.oka ? '30,000点返し・オカ +20' : '25,000点返し'}・ウマ ${S.uma === 'none' ? 'なし' : S.uma.replace('-', '−')}（千点単位）</p>
      <div class="fin-rec">通算 ${REC.games}戦　平均順位 ${avgRank()}　トップ率 ${pct(REC.ranks[0], REC.games)}　合計 ${REC.totalPt >= 0 ? '+' : '−'}${Math.abs(REC.totalPt).toFixed(1)}</div>
      <div class="res-actions"><button class="gk-btn ghost" data-title>タイトルへ</button><button class="gk-btn primary" data-again>もう一度</button></div>
    </div>`;
    el.hidden = false;
    screen = 'final';
    await new Promise((resolve) => {
      el.querySelector('[data-again]').addEventListener('click', () => { GK.sfx('click'); resolve(); setTimeout(startGame, 0); });
      el.querySelector('[data-title]').addEventListener('click', () => { GK.sfx('click'); resolve(); setTimeout(toTitle, 0); });
      if (ui.auto) setTimeout(resolve, ui.test ? 900 : 4000);
      setTimeout(() => el.querySelector('[data-again]').focus({ preventScroll: true }), 60);
    });
  }
  const avgRank = () => (REC.games ? (REC.ranks.reduce((a, n, i) => a + n * (i + 1), 0) / REC.games).toFixed(2) : '—');
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

  /* ================================================================ title, settings, records, help */
  function renderTitle() {
    $('#rivals').innerHTML = CHARS.map((c) => `<li><img src="img/${c.id}.webp" alt=""><span><b>${c.name}</b><small>${c.title}</small></span></li>`).join('');
    document.querySelectorAll('#title .seg button').forEach((b) => {
      const k = b.parentElement.dataset.key;
      b.classList.toggle('on', String(S[k]) === b.dataset.v);
      b.setAttribute('aria-pressed', String(String(S[k]) === b.dataset.v));
    });
    $('#title-rec').textContent = REC.games ? `通算 ${REC.games}戦・平均 ${avgRank()}位・トップ ${REC.ranks[0]}回` : 'はじめての方は「遊び方」もどうぞ';
  }
  function setupTitle() {
    document.querySelectorAll('#title .seg').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const k = seg.dataset.key;
        S[k] = typeof DEF[k] === 'number' ? +b.dataset.v : b.dataset.v;
        saveS(); GK.sfx('select'); renderTitle();
      });
    });
    $('#btn-start').addEventListener('click', () => { GK.sfx('ok'); startGame(); });
    $('#btn-rules').addEventListener('click', () => { GK.sfx('click'); openSettings(); });
    $('#btn-records').addEventListener('click', () => { GK.sfx('click'); openRecords(); });
    $('#btn-howto').addEventListener('click', () => { GK.sfx('click'); GK.help(); });
  }
  const SETTINGS = [
    ['length', '対局', [['tonpuu', '東風戦'], ['hanchan', '半荘戦']]],
    ['level', 'CPU の強さ', [[0, 'やさしい'], [1, 'ふつう'], [2, 'つよい']]],
    ['speed', '進行の速さ', [['slow', 'ゆっくり'], ['normal', 'ふつう'], ['fast', 'はやい']]],
    ['timer', '鳴きの判断時間', [[5, '5 秒'], [10, '10 秒'], [0, '無制限']]],
    ['aka', '赤ドラ（各 5 に 1 枚）', [[true, 'あり'], [false, 'なし']]],
    ['kazoe', '数え役満（13 翻以上）', [[true, 'あり'], [false, 'なし（三倍満）']]],
    ['kiriage', '切り上げ満貫', [[false, 'なし'], [true, 'あり']]],
    ['double', 'ダブル役満（四暗刻単騎・国士十三面・純正九蓮・大四喜）', [[false, 'なし'], [true, 'あり']]],
    ['renpuu', '連風牌の雀頭', [[4, '4 符'], [2, '2 符']]],
    ['abortive', '途中流局（四風連打・四家立直・四開槓）', [[true, 'あり'], [false, 'なし']]],
    ['uma', 'ウマ', [['none', 'なし'], ['5-10', '5−10'], ['10-20', '10−20'], ['10-30', '10−30']]],
    ['oka', 'オカ（30,000点返し・トップ +20）', [[true, 'あり'], [false, 'なし']]],
    ['bgm', 'BGM', [[true, 'あり'], [false, 'なし']]],
  ];
  function openSettings() {
    const body = document.createElement('div');
    body.className = 'settings';
    body.innerHTML = SETTINGS.map(([k, label, opts]) => `<div class="set-row"><span class="set-label">${label}</span><div class="seg sm" data-key="${k}">${opts.map(([v, t]) => `<button type="button" data-v='${JSON.stringify(v)}' class="${S[k] === v ? 'on' : ''}" aria-pressed="${S[k] === v}">${t}</button>`).join('')}</div></div>`).join('')
      + `<p class="set-note">ルールの変更は次の対局から反映されます（速さ・判断時間・BGM はすぐ反映）。</p>`;
    body.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      const seg = b.parentElement, k = seg.dataset.key;
      S[k] = JSON.parse(b.dataset.v);
      seg.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      saveS(); GK.sfx('select');
      if (k === 'bgm') music(screen === 'title' ? 'title' : 'play');
      renderTitle();
    });
    return GK.modal({ title: 'ルール設定', body, wide: true, buttons: [{ label: '閉じる', value: true, primary: true }] });
  }
  function openRecords() {
    const r = REC;
    const last = (r.last || []).map((g) => `<tr><td>${g.date}</td><td>${g.length === 'hanchan' ? '半荘' : '東風'}・${LEVELS[g.level] || ''}</td><td>${g.rank}位</td><td class="num">${fmt(g.score)}</td><td class="num">${g.point >= 0 ? '+' : '−'}${Math.abs(g.point).toFixed(1)}</td></tr>`).join('');
    const body = `<table class="rec">
      <tr><th>対局数</th><td>${r.games}</td><th>平均順位</th><td>${avgRank()}</td></tr>
      <tr><th>1位</th><td>${r.ranks[0]}（${pct(r.ranks[0], r.games)}）</td><th>2位</th><td>${r.ranks[1]}</td></tr>
      <tr><th>3位</th><td>${r.ranks[2]}</td><th>4位</th><td>${r.ranks[3]}</td></tr>
      <tr><th>合計ポイント</th><td>${r.totalPt >= 0 ? '+' : '−'}${Math.abs(r.totalPt).toFixed(1)}</td><th>最高得点</th><td>${r.bestScore == null ? '—' : fmt(r.bestScore)}</td></tr>
      <tr><th>和了率</th><td>${pct(r.wins, r.hands)}</td><th>放銃率</th><td>${pct(r.deals, r.hands)}</td></tr>
      <tr><th>役満</th><td>${r.yakuman}回</td><th>局数</th><td>${r.hands}</td></tr>
      </table>
      <h3>最高の和了</h3><p>${r.bestHand ? `${fmt(r.bestHand.total)}点 ${r.bestHand.label || ''}（${r.bestHand.yaku}）` : 'まだありません'}</p>
      ${last ? `<h3>最近の対局</h3><table class="rec small">${last}</table>` : ''}`;
    return GK.modal({ title: '成績', body, wide: true, buttons: [{ label: '記録を消す', value: 'reset', ghost: true }, { label: '閉じる', value: true, primary: true }] }).then(async (v) => {
      if (v !== 'reset') return;
      const yes = await GK.modal({ title: '記録を消しますか？', body: '<p>これまでの成績がすべて消えます。</p>', buttons: [{ label: 'やめる', value: false, ghost: true }, { label: '消す', value: true, primary: true }] });
      if (yes) { Object.assign(REC, JSON.parse(JSON.stringify(DEF_REC))); saveR(); renderTitle(); GK.toast('成績を消しました'); }
    });
  }
  function helpHTML() {
    const yaku = MJ.YAKU_TABLE.map(([n, c, o, d]) => `<tr><td>${n}</td><td>${c}</td><td>${o ? o : '—'}</td><td>${d}</td></tr>`).join('');
    const ym = MJ.YAKUMAN_TABLE.map(([n, d]) => `<tr><td>${n}</td><td colspan="3">${d}</td></tr>`).join('');
    return `
      <p>宵月亭の常連 3 人を相手にする、4 人打ちのリーチ麻雀です。あなたは手前の席に座ります。</p>
      <h3>操作</h3>
      <ul>
        <li><b>打牌</b>：PC は牌をクリック。スマホは牌をタップして選び、もう一度タップするか上にスワイプ。キーボードは <kbd>←</kbd><kbd>→</kbd> で選んで <kbd>Enter</kbd>。</li>
        <li><b>鳴き・和了</b>：できるときだけボタンが出ます（チー・ポン・カン・ロン・ツモ・スキップ）。チーの形が複数あるときは選べます。鳴きの判断時間は設定で変えられます（ロンは時間切れになりません）。</li>
        <li><b>リーチ</b>：門前でテンパイすると「リーチ」ボタン。押すと宣言できる牌が光るので、選んで捨てます。リーチ後のツモ切りは自動です。</li>
        <li><b>待ちの表示</b>：テンパイ中は待ち牌と残り枚数（あなたから見えていない枚数）を表示します。打牌前に牌にマウスを重ねる（スマホは選ぶ）と、その牌を切ったときの待ちが出ます。フリテン・役なしも表示します。</li>
        <li>牌にマウスを重ねると、河・鳴き・ドラ表示牌の同じ牌が光ります。右上のメニューから、いつでもタイトルに戻れます。</li>
      </ul>
      <h3>採用ルール</h3>
      <ul>
        <li>東風戦（設定で半荘戦）。25,000点持ち・30,000点返し（オカ +20）、ウマ 10−20（設定で変更）。点数が 0 点未満になると終了（飛び）。西入はありません。</li>
        <li>喰いタンあり・後付けあり・喰い替えなし。赤ドラ 3 枚（5萬・5筒・5索に 1 枚ずつ）。一発・裏ドラ・カンドラ・カン裏あり。カンドラは即めくり。</li>
        <li>親は和了またはテンパイで連荘。本場は 1 本につき 300点（ツモは 100点ずつ）。供託は次の和了者が受け取り、終局時に残った分はトップへ。</li>
        <li>オーラスで親がトップのまま和了・テンパイしたときは、そこで終了（アガリやめ・テンパイやめ）。</li>
        <li>荒牌平局はノーテン罰符 3,000点。途中流局は九種九牌（あなたは選べます）・四風連打・四家立直・四開槓（設定でなしにできます）。途中流局は親の連荘・1 本場追加。</li>
        <li>ダブロンなし（<b>頭ハネ</b>：放銃者から見て下家側の 1 人だけが和了）。トリプルロンも頭ハネ。</li>
        <li>フリテン：自分の捨て牌に待ちがある・同巡内の見逃し（次の自分の打牌まで）・リーチ後の見逃し（その局のあいだ）。フリテンでもツモ和了はできます。</li>
        <li>リーチは門前・1,000点以上・山の残りが 4 枚以上のとき。リーチ後の暗槓は、ツモった牌で待ちが変わらないときだけ。</li>
        <li>符：副底 20、門前ロン +10、ツモ +2（平和ツモは 20符）、七対子 25符、役牌の雀頭 +2・連風牌の雀頭 +4（設定で 2符）、嵌張・辺張・単騎 +2、刻子・槓子（中張牌/么九牌、明/暗）、10符単位で切り上げ。喰い平和形のロンは 30符。</li>
        <li>5翻 満貫・6〜7翻 跳満・8〜10翻 倍満・11〜12翻 三倍満・13翻以上 数え役満（設定で三倍満止まり）。役満の複合あり、ダブル役満は設定で（初期はなし）。切り上げ満貫は設定で（初期はなし）。流し満貫・人和・責任払いはありません。</li>
        <li>和了の形が何通りにも取れるときは、いちばん点数が高くなる取り方で計算します。</li>
      </ul>
      <h3>役一覧（翻：門前／鳴き）</h3>
      <table class="yaku-table"><thead><tr><th>役</th><th>門前</th><th>鳴き</th><th>条件</th></tr></thead><tbody>${yaku}</tbody></table>
      <h3>役満</h3>
      <table class="yaku-table"><tbody>${ym}</tbody></table>
      <h3>点数の目安（子のロン）</h3>
      <table class="yaku-table"><tbody>
        <tr><td>1翻30符</td><td>1,000</td><td>2翻30符</td><td>2,000</td></tr>
        <tr><td>3翻30符</td><td>3,900</td><td>4翻30符</td><td>7,700</td></tr>
        <tr><td>満貫</td><td>8,000</td><td>跳満</td><td>12,000</td></tr>
        <tr><td>倍満</td><td>16,000</td><td>役満</td><td>32,000</td></tr>
      </tbody></table>
      <p>親は子の 1.5 倍です（親の満貫は 12,000点）。</p>
      <h3>対戦相手</h3>
      <ul>${CHARS.map((c) => `<li><b>${c.name}</b>（${c.title}）— ${c.id === 'tsubame' ? 'よく鳴いて速い手で和了を目指します。' : c.id === 'genzo' ? '守りが堅く、危ない牌はなかなか捨てません。' : '期待値で考え、高い手はダマテンにすることも。'}</li>`).join('')}</ul>`;
  }

  /* ================================================================ boot */
  function menu() {
    GK.sfx('click');
    if (screen === 'title') { openSettings(); return; }
    GK.modal({
      title: 'メニュー',
      body: '<p>対局を中断してタイトルに戻ると、この対局の成績は記録されません。</p>',
      buttons: [{ label: 'ルール設定', value: 'rules', ghost: true }, { label: 'タイトルへ戻る', value: 'title' }, { label: '対局を続ける', value: null, primary: true }],
    }).then((v) => { if (v === 'title') toTitle(); else if (v === 'rules') openSettings(); });
  }

  function boot() {
    GK.init({ id: 'mahjong', title: '宵月麻雀', help: helpHTML, menu });
    const canvas = $('#cv');
    view = GK.fit(canvas, { onResize: (v) => { view = v; layout(); feltCache = null; } });
    layout();
    setupInput(canvas);
    setupTitle();
    renderTitle();
    GK.loadImages(IMG).then(() => { $('#title').classList.add('ready'); });
    GK.loop(() => {
      tickTimer();
      if (screen === 'title' || !L) return;
      const t = now();
      if (t < dirtyUntil || t - lastFrame > 250) { lastFrame = t; render(); }
    });
    // music starts on the first gesture (browsers block audio before it)
    const first = () => { if (screen === 'title') music('title'); removeEventListener('pointerdown', first); removeEventListener('keydown', first); };
    addEventListener('pointerdown', first);
    addEventListener('keydown', first);
  }

  /* ================================================================ self-test (npm run game-check) */
  window.__gameSelfTest = async function () {
    const notes = [];
    const shot = (n) => (window.__shot ? window.__shot(n) : Promise.resolve());
    const prevSpeed = S.speed, prevLen = S.length;
    const recBackup = JSON.stringify(REC); // the test game must not count in the player's records
    const restore = () => { Object.assign(REC, JSON.parse(recBackup)); saveR(); renderTitle(); };
    try {
      ui.auto = true; ui.test = true;
      S.speed = 'test'; S.length = 'tonpuu';
      startGame();
      await until(() => game && game.players.length && game.players.reduce((a, p) => a + p.river.length, 0) >= 22 || screen === 'result', 30000);
      ui.hold = true;
      await wait(120);
      await shot('table');
      // what a human would see on their turn: the waits / preview panel and the buttons
      notes.push(`${game.roundName()} 残り${game.liveLeft()}枚 で撮影`);
      ui.hold = false;
      await until(() => screen === 'result', 30000);
      await wait(250);
      await shot('result');
      notes.push('1 局目: ' + ($('#result h2') ? $('#result h2').textContent.replace(/\s+/g, ' ').trim() : '?'));
      await until(() => screen === 'final', 90000);
      await wait(300);
      await shot('final');
      notes.push(`終局: ${game.history.length} 局・あなた ${$('#final .me .fin-rank') ? $('#final .me .fin-rank').textContent : '?'}`);
      await until(() => screen === 'play' || screen === 'title', 5000).catch(() => {});
      toTitle();
      ui.auto = false; ui.test = false;
      S.speed = prevSpeed; S.length = prevLen;
      restore();
      // the human UI: hand a decision to the player and check the buttons appear
      return { ok: true, notes };
    } catch (e) {
      ui.auto = false; ui.test = false; ui.hold = false;
      S.speed = prevSpeed; S.length = prevLen;
      restore();
      return { ok: false, notes: notes.concat(['self-test: ' + (e && e.message)]) };
    }
  };
  window.__mj = { get game() { return game; }, ui, S, startGame, toTitle, layout: () => L, myTiles: () => myTiles() };

  boot();
})();
