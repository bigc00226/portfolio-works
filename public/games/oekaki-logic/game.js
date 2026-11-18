/* ロジック絵巻 — UI: list → play (canvas) → reveal → gallery. Line logic in logic.js (OL), pictures in puzzles.js. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const PZ = window.OL_PUZZLES;
  const SIZES = [5, 10, 15, 20];
  const SIZE_LABEL = { 5: '5×5', 10: '10×10', 15: '15×15', 20: '20×20' };
  const SIZE_SUB = { 5: '入門', 10: 'ふつう', 15: 'じっくり', 20: '大作' };
  PZ.forEach((p, i) => {
    p.index = i; p.N = p.size; p.cl = OL.clues(p.art);
    p.sol = new Uint8Array(p.N * p.N);
    for (let r = 0; r < p.N; r++) for (let c = 0; c < p.N; c++) p.sol[r * p.N + c] = p.art[r][c] !== '.' ? 1 : 0;
    p.no = PZ.filter((q) => q.size === p.size).indexOf(p) + 1;
    p.label = `${SIZE_LABEL[p.size]} ・ No.${p.no}`;
  });
  const DEF = { autoX: true, check: false, hl: true, bgm: false };
  const settings = Object.assign({}, DEF, GK.store.get('settings', {}));
  const rec = () => GK.store.get('rec', {});
  const prog = () => GK.store.get('prog', {});
  const fmt = (s) => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), x = s % 60; return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
  let screen = 'title';

  /* ---------------- sound ---------------- */
  const tick = (k) => { if (!GK.muted) GK.tone({ f: GK.scaleFreq('D5', 'yo', k % 10), d: 0.06, type: 'triangle', v: 0.07 }); };
  const markSnd = () => { if (!GK.muted) GK.noise({ d: 0.04, v: 0.12, f: 2600, q: 2 }); };
  const lineSnd = () => { if (!GK.muted) [0, 2, 4].forEach((s, k) => GK.tone({ f: GK.scaleFreq('A4', 'yo', s + 2), d: 0.3, type: 'triangle', v: 0.1, at: k * 0.06 })); };
  const missSnd = () => { if (!GK.muted) GK.tone({ f: 230, f2: 170, d: 0.2, type: 'triangle', v: 0.18 }); };
  const clearSnd = () => { if (GK.muted) return; [0, 1, 2, 3, 4, 5, 6, 7, 9].forEach((s, k) => GK.tone({ f: GK.scaleFreq('D4', 'yo', s), d: 0.6, type: 'triangle', v: 0.14, at: 0.25 + k * 0.11 })); GK.tone({ f: GK.freq('D3'), d: 1.6, type: 'sine', v: 0.18, at: 0.25 }); };
  const SONG = {
    bpm: 70, steps: 2, loop: true,
    tracks: [
      { type: 'triangle', v: 0.065, notes: 'E5 - C5 . B4 - A4 - B4 - - . F4 - E4 - | A4 - B4 . C5 - B4 A4 F4 - E4 - - - . . | E4 - F4 . A4 - B4 . C5 - B4 . A4 - - . | F4 - A4 B4 A4 - F4 - E4 - - - - - . .' },
      { type: 'sine', v: 0.085, notes: 'A2 - - - - - - - E2 - - - - - - - | F2 - - - - - - - E2 - - - - - - - | A2 - - - - - - - C3 - - - - - - - | F2 - - - - - - - E2 - - - - - - -' },
    ],
  };
  const syncMusic = () => { const want = settings.bgm && !GK.muted; if (want && !GK.music.playing) GK.music.play(SONG); else if (!want && GK.music.playing) GK.music.stop(); };

  /* ---------------- pictures (thumbnails) ---------------- */
  function drawPic(cv, p, mode, grid) {
    const N = p.N, k = Math.max(4, Math.ceil(160 / N)), S = N * k;
    cv.width = S; cv.height = S;
    const g = cv.getContext('2d');
    if (mode === 'color') {
      g.fillStyle = p.bg; g.fillRect(0, 0, S, S);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const ch = p.art[r][c]; if (ch !== '.') { g.fillStyle = p.pal[ch]; g.fillRect(c * k, r * k, k, k); } }
      return;
    }
    g.fillStyle = '#fffdf8'; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(90, 75, 60, .16)'; g.lineWidth = 1;
    for (let i = 1; i < N; i++) { g.beginPath(); g.moveTo(i * k + 0.5, 0); g.lineTo(i * k + 0.5, S); g.moveTo(0, i * k + 0.5); g.lineTo(S, i * k + 0.5); g.stroke(); }
    if (grid) { g.fillStyle = '#2c2a33'; for (let i = 0; i < N * N; i++) if (grid[i] === '1' || grid[i] === 1) g.fillRect((i % N) * k, Math.floor(i / N) * k, k, k); }
    if (mode === 'blank') { g.fillStyle = 'rgba(90, 75, 60, .28)'; g.font = `800 ${S * 0.42}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('？', S / 2, S / 2 + S * 0.02); }
  }

  /* ---------------- title & list ---------------- */
  let tab = GK.store.get('tab', 5);
  function refreshTitle() {
    const R = rec(), PR = prog();
    const solved = PZ.filter((p) => R[p.id]).length;
    $('#tCount').textContent = `完成 ${solved} / ${PZ.length}`;
    const tabs = $('#tabs');
    tabs.innerHTML = '';
    for (const s of SIZES) {
      const list = PZ.filter((p) => p.size === s), n = list.filter((p) => R[p.id]).length;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(s === tab));
      b.innerHTML = `${SIZE_LABEL[s]}<small>${SIZE_SUB[s]} ${n}/${list.length}</small>`;
      b.addEventListener('click', () => { tab = s; GK.store.set('tab', s); GK.sfx('click'); refreshTitle(); });
      tabs.appendChild(b);
    }
    const box = $('#cards');
    box.innerHTML = '';
    for (const p of PZ.filter((q) => q.size === tab)) {
      const r = R[p.id], pr = PR[p.id];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card';
      const cv = document.createElement('canvas');
      drawPic(cv, p, r ? 'color' : pr ? 'progress' : 'blank', pr && !r ? pr.g : null);
      cv.style.imageRendering = 'pixelated';
      b.appendChild(cv);
      const t = document.createElement('div');
      t.innerHTML = r ? `<b>${p.name}</b><br><small>No.${p.no}・ベスト ${fmt(r.best)}</small>` : `<b>No.${p.no}</b><br><small>${pr ? `とちゅう ${fmt(pr.t)}` : 'まだ解いていません'}</small>`;
      b.appendChild(t);
      if (r || pr) { const st = document.createElement('span'); st.className = 'state' + (r ? ' done' : ''); st.textContent = r ? '完成' : 'とちゅう'; b.appendChild(st); }
      b.setAttribute('aria-label', r ? `${p.label} ${p.name}` : p.label);
      b.addEventListener('click', () => { GK.sfx('select'); openPuzzle(p); });
      box.appendChild(b);
    }
  }

  /* ---------------- play state ---------------- */
  let S = null; // { p, grid, undo, redo, elapsed, hints, mistakes, done, cur, hover, mode, z, panX, panY, flash, hint, reveal }
  const cv = $('#cv');
  let dirty = true;
  const view = GK.fit(cv, { onResize: () => { dirty = true; } });
  let geo = null;

  function openPuzzle(p) {
    const pr = prog()[p.id];
    const N = p.N, grid = new Int8Array(N * N);
    if (pr && pr.g && pr.g.length === N * N) for (let i = 0; i < N * N; i++) grid[i] = +pr.g[i];
    S = { p, grid, undo: [], redo: [], elapsed: pr ? pr.t || 0 : 0, hints: pr ? pr.h || 0 : 0, mistakes: pr ? pr.m || 0 : 0, done: false, cur: { r: 0, c: 0 }, showCur: false, hover: null, mode: 'fill', z: 1, panX: 0, panY: 0, flash: new Map(), hint: null, reveal: null };
    $('#play').classList.remove('done');
    $('#pTitle').textContent = p.label;
    $('#pSub').textContent = pr ? 'つづきから' : `${SIZE_SUB[p.size]}・答えはひとつ、論理だけで解けます`;
    $('#result').hidden = true;
    closeHint();
    show('play');
    buildToolbar();
    layoutPlay();
    if (pr) GK.toast('前回のつづきから始めます');
    dirty = true;
  }
  function saveProg() {
    if (!S || S.done) return;
    const P = prog();
    if (S.grid.some((v) => v)) P[S.p.id] = { g: Array.from(S.grid).join(''), t: Math.round(S.elapsed), h: S.hints, m: S.mistakes };
    else delete P[S.p.id];
    GK.store.set('prog', P);
  }

  /* ---------------- geometry ---------------- */
  function computeGeo() {
    const W = view.w, H = view.h, p = S.p, N = p.N;
    const rc = Math.max(1, ...p.cl.rows.map((r) => r.length)), cc = Math.max(1, ...p.cl.cols.map((c) => c.length));
    const m = 10, K = 0.68, UMIN = 12.5, pad = 8;
    const fitAxis = (avail, cnt) => { let cs = (avail - pad) / (N + K * cnt); if (K * cs < UMIN) cs = (avail - pad - cnt * UMIN) / N; return cs; };
    const cs0 = Math.max(6, Math.min(fitAxis(W - 2 * m, rc), fitAxis(H - 2 * m, cc), 62));
    const zMax = Math.max(1, 44 / cs0);
    S.z = GK.clamp(S.z, 1, zMax);
    const cs = cs0 * S.z, u = Math.min(30, Math.max(K * cs, UMIN));
    const rowW = rc * u + pad, colH = cc * u + pad;
    const totalW = rowW + N * cs, totalH = colH + N * cs;
    const maxX = Math.max(0, totalW - (W - 2 * m)), maxY = Math.max(0, totalH - (H - 2 * m));
    S.panX = GK.clamp(S.panX, 0, maxX); S.panY = GK.clamp(S.panY, 0, maxY);
    const px = maxX ? m : (W - totalW) / 2, py = maxY ? m : (H - totalH) / 2;
    geo = { W, H, N, cs, cs0, u, rowW, colH, px, py, gx: px + rowW - S.panX, gy: py + colH - S.panY, gridL: px + rowW, gridT: py + colH, rc, cc, maxX, maxY, zMax, pad };
    return geo;
  }
  function cellAt(x, y, clampIt) {
    const g = geo;
    if (!clampIt && (x < g.gridL || y < g.gridT)) return null;
    let c = Math.floor((x - g.gx) / g.cs), r = Math.floor((y - g.gy) / g.cs);
    if (clampIt) { c = GK.clamp(c, 0, g.N - 1); r = GK.clamp(r, 0, g.N - 1); }
    if (r < 0 || c < 0 || r >= g.N || c >= g.N) return null;
    return { r, c };
  }
  function zoomAt(z, sx, sy) {
    computeGeo();
    const fx = (sx - geo.gx) / geo.cs, fy = (sy - geo.gy) / geo.cs;
    S.z = z;
    computeGeo();
    S.panX = geo.px + geo.rowW - (sx - fx * geo.cs);
    S.panY = geo.py + geo.colH - (sy - fy * geo.cs);
    computeGeo();
    dirty = true;
    updateTools();
  }
  function scrollToCell(r, c) {
    computeGeo();
    if (!geo.maxX && !geo.maxY) return;
    const vx = (geo.W - geo.gridL) / 2, vy = (geo.H - geo.gridT) / 2;
    S.panX = (c + 0.5) * geo.cs - vx;
    S.panY = (r + 0.5) * geo.cs - vy;
    computeGeo();
    dirty = true;
  }

  /* ---------------- drawing ---------------- */
  const INK = '#2c2a33';
  function lineOf(kind, i) { const N = S.p.N, out = []; for (let k = 0; k < N; k++) out.push(S.grid[kind === 'row' ? i * N + k : k * N + i]); return out; }
  function draw(now) {
    if (!S || screen !== 'play') return;
    const g = view.ctx;
    computeGeo();
    view.clear();
    if (S.reveal) return drawReveal(now);
    const { N, cs, u, rowW, colH, px, py, gx, gy, gridL, gridT, W, H, pad } = geo;
    const cur = S.showCur ? S.cur : S.hover;
    const hint = S.hint;
    // grid
    g.save();
    g.beginPath(); g.rect(gridL, gridT, W - gridL, H - gridT); g.clip();
    g.fillStyle = '#fffdf8'; g.fillRect(gx, gy, N * cs, N * cs);
    g.fillStyle = '#f6efe1';
    for (let br = 0; br < N; br += 5) for (let bc = 0; bc < N; bc += 5) if (((br + bc) / 5) % 2) g.fillRect(gx + bc * cs, gy + br * cs, Math.min(5, N - bc) * cs, Math.min(5, N - br) * cs);
    if (cur && settings.hl) { g.fillStyle = 'rgba(200, 69, 47, .07)'; g.fillRect(gx, gy + cur.r * cs, N * cs, cs); g.fillRect(gx + cur.c * cs, gy, cs, N * cs); }
    if (hint && hint.kind) { g.fillStyle = 'rgba(233, 182, 73, .22)'; if (hint.kind === 'row') g.fillRect(gx, gy + hint.index * cs, N * cs, cs); else g.fillRect(gx + hint.index * cs, gy, cs, N * cs); }
    const ins = Math.max(1, cs * 0.07);
    for (let i = 0; i < N * N; i++) {
      const r = (i / N) | 0, c = i % N, x = gx + c * cs, y = gy + r * cs;
      if (x > W || y > H || x + cs < gridL || y + cs < gridT) continue;
      const v = S.grid[i];
      if (v === 1) { g.fillStyle = INK; g.fillRect(x + ins, y + ins, cs - 2 * ins, cs - 2 * ins); }
      else if (v === 2) drawX(g, x, y, cs, '#a2968a');
      const f = S.flash.get(i);
      if (f) { const a = 1 - (now - f) / 900; if (a <= 0) S.flash.delete(i); else { g.fillStyle = `rgba(214, 60, 40, ${0.45 * a})`; g.fillRect(x, y, cs, cs); } }
    }
    if (hint) {
      const pulse = 0.55 + 0.45 * Math.sin(now / 180);
      for (const [i, v] of hint.cells) {
        const r = (i / N) | 0, c = i % N, x = gx + c * cs, y = gy + r * cs;
        if (hint.wrong) { g.strokeStyle = `rgba(214, 60, 40, ${0.6 + 0.4 * pulse})`; g.lineWidth = Math.max(2, cs * 0.12); g.strokeRect(x + 2, y + 2, cs - 4, cs - 4); continue; }
        if (v === 1) { g.fillStyle = `rgba(201, 143, 34, ${0.35 + 0.35 * pulse})`; g.fillRect(x + ins, y + ins, cs - 2 * ins, cs - 2 * ins); }
        else drawX(g, x, y, cs, `rgba(201, 143, 34, ${0.5 + 0.5 * pulse})`);
      }
    }
    // lines
    g.lineWidth = 1; g.strokeStyle = '#ddd2be';
    g.beginPath();
    for (let k = 1; k < N; k++) { if (k % 5) { g.moveTo(Math.round(gx + k * cs) + 0.5, gy); g.lineTo(Math.round(gx + k * cs) + 0.5, gy + N * cs); g.moveTo(gx, Math.round(gy + k * cs) + 0.5); g.lineTo(gx + N * cs, Math.round(gy + k * cs) + 0.5); } }
    g.stroke();
    g.lineWidth = 1.6; g.strokeStyle = '#7a6d5e';
    g.beginPath();
    for (let k = 5; k < N; k += 5) { g.moveTo(gx + k * cs, gy); g.lineTo(gx + k * cs, gy + N * cs); g.moveTo(gx, gy + k * cs); g.lineTo(gx + N * cs, gy + k * cs); }
    g.stroke();
    g.lineWidth = 2.2; g.strokeStyle = INK; g.strokeRect(gx, gy, N * cs, N * cs);
    if (cur) { g.lineWidth = 2.6; g.strokeStyle = '#c8452f'; g.strokeRect(gx + cur.c * cs + 1.3, gy + cur.r * cs + 1.3, cs - 2.6, cs - 2.6); }
    g.restore();
    // clue panels
    const font = (sz) => `700 ${sz}px ${getComputedStyle(document.body).getPropertyValue('--gk-sans') || 'sans-serif'}`;
    const fsz = Math.round(u * 0.66 * 10) / 10;
    // columns (top)
    g.save();
    g.beginPath(); g.rect(gridL, py, W - gridL, colH); g.clip();
    g.fillStyle = '#efe5d1'; g.fillRect(gx, py, N * cs, colH);
    for (let c = 0; c < N; c++) {
      const x = gx + c * cs;
      if (Math.floor(c / 5) % 2) { g.fillStyle = 'rgba(120, 100, 70, .07)'; g.fillRect(x, py, cs, colH); }
      if (cur && cur.c === c && settings.hl) { g.fillStyle = 'rgba(200, 69, 47, .14)'; g.fillRect(x, py, cs, colH); }
      if (hint && hint.kind === 'col' && hint.index === c) { g.fillStyle = 'rgba(233, 182, 73, .45)'; g.fillRect(x, py, cs, colH); }
    }
    g.font = font(fsz); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let c = 0; c < N; c++) {
      const clue = S.p.cl.cols[c], done = OL.doneClues(clue, lineOf('col', c));
      const list = clue.length ? clue : [0];
      for (let k = 0; k < list.length; k++) {
        const y = gridT - pad / 2 - (list.length - k - 0.5) * u;
        g.fillStyle = !clue.length || done[k] ? '#b9ae9f' : INK;
        g.fillText(String(list[k]), gx + (c + 0.5) * cs, y + 0.5);
      }
    }
    g.restore();
    // rows (left)
    g.save();
    g.beginPath(); g.rect(px, gridT, rowW, H - gridT); g.clip();
    g.fillStyle = '#efe5d1'; g.fillRect(px, gy, rowW, N * cs);
    for (let r = 0; r < N; r++) {
      const y = gy + r * cs;
      if (Math.floor(r / 5) % 2) { g.fillStyle = 'rgba(120, 100, 70, .07)'; g.fillRect(px, y, rowW, cs); }
      if (cur && cur.r === r && settings.hl) { g.fillStyle = 'rgba(200, 69, 47, .14)'; g.fillRect(px, y, rowW, cs); }
      if (hint && hint.kind === 'row' && hint.index === r) { g.fillStyle = 'rgba(233, 182, 73, .45)'; g.fillRect(px, y, rowW, cs); }
    }
    g.font = font(fsz); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let r = 0; r < N; r++) {
      const clue = S.p.cl.rows[r], done = OL.doneClues(clue, lineOf('row', r));
      const list = clue.length ? clue : [0];
      for (let k = 0; k < list.length; k++) {
        const x = gridL - pad / 2 - (list.length - k - 0.5) * u;
        g.fillStyle = !clue.length || done[k] ? '#b9ae9f' : INK;
        g.fillText(String(list[k]), x, gy + (r + 0.5) * cs + 0.5);
      }
    }
    g.restore();
    // corner: a small preview of the picture so far
    g.fillStyle = '#e6dac2'; g.fillRect(px, py, rowW - 1, colH - 1);
    const pv = Math.min(rowW, colH) - 12;
    if (pv > 14) {
      const k = pv / N, ox = px + (rowW - pv) / 2, oy = py + (colH - pv) / 2;
      g.fillStyle = '#fffdf8'; g.fillRect(ox, oy, pv, pv);
      g.fillStyle = INK;
      for (let i = 0; i < N * N; i++) if (S.grid[i] === 1) g.fillRect(ox + (i % N) * k, oy + ((i / N) | 0) * k, Math.ceil(k), Math.ceil(k));
      g.strokeStyle = 'rgba(60, 45, 30, .3)'; g.lineWidth = 1; g.strokeRect(ox - 0.5, oy - 0.5, pv + 1, pv + 1);
    }
  }
  function drawX(g, x, y, cs, color) {
    const m = cs * 0.3;
    g.strokeStyle = color; g.lineWidth = Math.max(1.3, cs * 0.075); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x + m, y + m); g.lineTo(x + cs - m, y + cs - m); g.moveTo(x + cs - m, y + m); g.lineTo(x + m, y + cs - m); g.stroke();
  }
  const sparks = [];
  function drawReveal(now) {
    const g = view.ctx, rv = S.reveal, t = (now - rv.t0) / 1000, p = S.p, N = p.N;
    const { gx, gy, cs, W, H } = geo;
    // target rectangle: the free area above (or left of) the result card
    const land = innerWidth > innerHeight * 1.1, small = land && innerHeight <= 520;
    const cardW = small ? 320 : 400 + Math.max(28, innerWidth * 0.04) + 16 - (innerWidth - W);
    const area = land ? { x: 0, y: 0, w: W - cardW, h: H } : { x: 0, y: 0, w: W, h: Math.max(H * 0.45, H - 250) };
    const ts = Math.min(area.w - 40, area.h - 40, 520);
    const tx = area.x + (area.w - ts) / 2, ty = area.y + (area.h - ts) / 2 + (land ? 0 : 10);
    const mv = GK.ease.inOutCubic(GK.clamp((t - 1.7) / 0.7, 0, 1));
    const x0 = GK.lerp(gx, tx, mv), y0 = GK.lerp(gy, ty, mv), s = GK.lerp(cs, ts / N, mv);
    // frame
    const fa = mv;
    if (fa > 0) {
      g.fillStyle = `rgba(62, 42, 24, ${fa})`; g.fillRect(x0 - 12, y0 - 12, N * s + 24, N * s + 24);
      g.fillStyle = `rgba(107, 74, 44, ${fa})`; g.fillRect(x0 - 9, y0 - 9, N * s + 18, N * s + 18);
      g.strokeStyle = `rgba(233, 182, 73, ${fa})`; g.lineWidth = 1.5; g.strokeRect(x0 - 3.5, y0 - 3.5, N * s + 7, N * s + 7);
    }
    const ink = [44, 42, 51], paper = [255, 253, 248];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = r * N + c, d = (r + c) / Math.max(1, 2 * N - 2);
        const lt = GK.clamp((t - 0.25 - d * 0.9) / 0.45, 0, 1);
        const flip = Math.abs(Math.cos(lt * Math.PI));
        const ch = p.art[r][c];
        const x = x0 + c * s, y = y0 + r * s;
        let col;
        if (lt < 0.5) col = S.grid[i] === 1 ? `rgb(${ink})` : `rgb(${paper})`;
        else col = ch === '.' ? p.bg : p.pal[ch];
        g.fillStyle = col;
        const hh = Math.max(0.5, s * flip);
        g.fillRect(x, y + (s - hh) / 2, s + 0.6, hh + 0.6);
      }
    }
    // grid lines fade away
    const la = 1 - GK.clamp(t / 0.6, 0, 1);
    if (la > 0) {
      g.strokeStyle = `rgba(122, 109, 94, ${la * 0.6})`; g.lineWidth = 1;
      g.beginPath();
      for (let k = 1; k < N; k++) { g.moveTo(x0 + k * s, y0); g.lineTo(x0 + k * s, y0 + N * s); g.moveTo(x0, y0 + k * s); g.lineTo(x0 + N * s, y0 + k * s); }
      g.stroke();
    }
    // gold sparkles
    if (t > 1.2 && t < 5 && sparks.length < 40 && Math.random() < 0.5) sparks.push({ x: x0 + Math.random() * N * s, y: y0 + Math.random() * N * s, t: now, r: 2 + Math.random() * 4 });
    for (let k = sparks.length - 1; k >= 0; k--) {
      const sp = sparks[k], a = 1 - (now - sp.t) / 900;
      if (a <= 0) { sparks.splice(k, 1); continue; }
      g.fillStyle = `rgba(255, 236, 170, ${a})`;
      g.beginPath(); g.moveTo(sp.x, sp.y - sp.r * 2); g.lineTo(sp.x + sp.r * 0.5, sp.y); g.lineTo(sp.x, sp.y + sp.r * 2); g.lineTo(sp.x - sp.r * 0.5, sp.y); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(sp.x - sp.r * 2, sp.y); g.lineTo(sp.x, sp.y + sp.r * 0.5); g.lineTo(sp.x + sp.r * 2, sp.y); g.lineTo(sp.x, sp.y - sp.r * 0.5); g.closePath(); g.fill();
    }
  }

  GK.loop((dt, time) => {
    const now = performance.now();
    if (screen !== 'play' || !S) return;
    const anim = S.reveal || S.flash.size || S.hint;
    if (dirty || anim) { dirty = false; draw(now); }
  });

  /* ---------------- editing ---------------- */
  let gesture = null;
  const pts = new Map();
  function setCell(i, v, changes) { if (S.grid[i] === v) return; if (!changes.has(i)) changes.set(i, S.grid[i]); S.grid[i] = v; }
  function startStroke(cell, kind) {
    const i = cell.r * S.p.N + cell.c, cur = S.grid[i];
    const action = kind === 'fill' ? (cur === 1 ? 'erase1' : 'fill') : (cur === 2 ? 'erase2' : 'mark');
    gesture = { type: 'stroke', action, r0: cell.r, c0: cell.c, axis: null, last: { r: cell.r, c: cell.c }, changes: new Map(), n: 0 };
    S.cur = { r: cell.r, c: cell.c };
    paint(i, true);
  }
  function paint(i, first) {
    const gs = gesture, cur = S.grid[i];
    let next = cur;
    if (gs.action === 'fill') { if (cur === 0 || (first && cur === 2)) next = 1; }
    else if (gs.action === 'erase1') { if (cur === 1) next = 0; }
    else if (gs.action === 'mark') { if (cur === 0 || (first && cur === 1)) next = 2; }
    else if (gs.action === 'erase2') { if (cur === 2) next = 0; }
    if (next === cur) return;
    if (next === 1 && settings.check && !S.p.sol[i]) { next = 2; S.mistakes++; S.flash.set(i, performance.now()); missSnd(); }
    else if (next === 2) markSnd(); else tick(gs.n);
    gs.n++;
    setCell(i, next, gs.changes);
    dirty = true;
  }
  function extendStroke(cell) {
    const gs = gesture;
    let { r, c } = cell;
    if (!gs.axis) { if (r === gs.r0 && c === gs.c0) return; gs.axis = Math.abs(r - gs.r0) >= Math.abs(c - gs.c0) ? 'v' : 'h'; }
    if (gs.axis === 'v') c = gs.c0; else r = gs.r0;
    let lr = gs.last.r, lc = gs.last.c;
    if (gs.axis === 'v') lc = gs.c0; else lr = gs.r0;
    while (lr !== r || lc !== c) { lr += Math.sign(r - lr); lc += Math.sign(c - lc); paint(lr * S.p.N + lc, false); }
    gs.last = { r, c };
    S.cur = { r, c };
  }
  function lineComplete(kind, i) { const clue = kind === 'row' ? S.p.cl.rows[i] : S.p.cl.cols[i]; const rr = OL.runs(lineOf(kind, i)); return rr.length === clue.length && rr.every((x, k) => x === clue[k]); }
  function commit(changes) {
    if (!changes.size) return;
    const N = S.p.N, rows = new Set(), cols = new Set();
    for (const i of changes.keys()) { rows.add((i / N) | 0); cols.add(i % N); }
    const wasDone = new Set();
    for (const r of rows) if (lineCompleteBefore('row', r, changes)) wasDone.add('r' + r);
    for (const c of cols) if (lineCompleteBefore('col', c, changes)) wasDone.add('c' + c);
    let newly = false;
    for (const [kind, set, key] of [['row', rows, 'r'], ['col', cols, 'c']]) {
      for (const i of set) {
        if (!lineComplete(kind, i)) continue;
        if (!wasDone.has(key + i)) newly = true;
        if (settings.autoX) for (let k = 0; k < N; k++) { const j = kind === 'row' ? i * N + k : k * N + i; if (S.grid[j] === 0) setCell(j, 2, changes); }
      }
    }
    S.undo.push([...changes].map(([i, b]) => [i, b, S.grid[i]]));
    if (S.undo.length > 800) S.undo.shift();
    S.redo = [];
    if (newly) lineSnd();
    afterChange();
  }
  function lineCompleteBefore(kind, i, changes) {
    const N = S.p.N, line = lineOf(kind, i);
    for (let k = 0; k < N; k++) { const j = kind === 'row' ? i * N + k : k * N + i; if (changes.has(j)) line[k] = changes.get(j); }
    const clue = kind === 'row' ? S.p.cl.rows[i] : S.p.cl.cols[i], rr = OL.runs(line);
    return rr.length === clue.length && rr.every((x, k) => x === clue[k]);
  }
  function endStroke() { const gs = gesture; gesture = null; if (gs && gs.type === 'stroke') commit(gs.changes); }
  function cancelStroke() { const gs = gesture; gesture = null; if (gs && gs.type === 'stroke') for (const [i, b] of gs.changes) S.grid[i] = b; dirty = true; }
  function afterChange() {
    closeHint();
    dirty = true;
    updateTools();
    saveProg();
    checkSolved();
  }
  function undo() { if (!S || S.done || !S.undo.length) return; const a = S.undo.pop(); for (const [i, b] of a) S.grid[i] = b; S.redo.push(a); GK.sfx('click'); closeHint(); dirty = true; updateTools(); saveProg(); }
  function redo() { if (!S || S.done || !S.redo.length) return; const a = S.redo.pop(); for (const [i, , v] of a) S.grid[i] = v; S.undo.push(a); GK.sfx('click'); dirty = true; updateTools(); saveProg(); checkSolved(); }
  function checkSolved() {
    const sol = S.p.sol;
    for (let i = 0; i < sol.length; i++) if ((S.grid[i] === 1) !== (sol[i] === 1)) return;
    complete();
  }

  /* ---------------- pointer input ---------------- */
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    if (!S || S.done || screen !== 'play') return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
    const p = view.toLocal(e.clientX, e.clientY);
    pts.set(e.pointerId, p);
    computeGeo();
    if (pts.size >= 2) {
      cancelStroke();
      const [a, b] = [...pts.values()];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      gesture = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: S.z, fx: (mx - geo.gx) / geo.cs, fy: (my - geo.gy) / geo.cs };
      return;
    }
    S.showCur = false;
    const cell = cellAt(p.x, p.y);
    if (e.button === 1 || S.mode === 'pan' || !cell) { gesture = { type: 'pan', x: p.x, y: p.y, px: S.panX, py: S.panY }; return; }
    closeHint();
    startStroke(cell, e.button === 2 ? 'mark' : S.mode);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!S || screen !== 'play') return;
    const p = view.toLocal(e.clientX, e.clientY);
    if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
    if (!gesture) {
      if (e.pointerType === 'mouse' && !S.done) { computeGeo(); const c = cellAt(p.x, p.y); const h = S.hover; if ((c && (!h || h.r !== c.r || h.c !== c.c)) || (!c && h)) { S.hover = c; S.showCur = false; dirty = true; } }
      return;
    }
    if (gesture.type === 'stroke') { computeGeo(); extendStroke(cellAt(p.x, p.y, true)); }
    else if (gesture.type === 'pan') { S.panX = gesture.px - (p.x - gesture.x); S.panY = gesture.py - (p.y - gesture.y); dirty = true; }
    else if (gesture.type === 'pinch' && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y);
      S.z = gesture.z0 * d / gesture.d0;
      computeGeo();
      S.panX = geo.px + geo.rowW - (mx - gesture.fx * geo.cs);
      S.panY = geo.py + geo.colH - (my - gesture.fy * geo.cs);
      dirty = true; updateTools();
    }
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (!gesture) return;
    if (gesture.type === 'stroke') endStroke();
    else if (gesture.type === 'pinch') gesture = pts.size ? { type: 'idle' } : null;
    else if (!pts.size) gesture = null;
    if (!pts.size && gesture && gesture.type === 'idle') gesture = null;
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !gesture && S && S.hover) { S.hover = null; dirty = true; } });
  cv.addEventListener('wheel', (e) => {
    if (!S || S.done) return;
    e.preventDefault();
    const p = view.toLocal(e.clientX, e.clientY);
    if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) zoomAt(S.z * Math.exp(-e.deltaY * 0.0016), p.x, p.y);
    else { S.panX += e.deltaX; dirty = true; }
  }, { passive: false });

  /* ---------------- keyboard ---------------- */
  let keyHold = null;
  function keyPaint(kind, action) {
    const N = S.p.N, i = S.cur.r * N + S.cur.c;
    gesture = { type: 'stroke', action: action || (kind === 'fill' ? (S.grid[i] === 1 ? 'erase1' : 'fill') : (S.grid[i] === 2 ? 'erase2' : 'mark')), r0: S.cur.r, c0: S.cur.c, axis: null, last: { ...S.cur }, changes: new Map(), n: 0 };
    const act = gesture.action;
    paint(i, !action);
    endStroke();
    return act;
  }
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back') || screen !== 'play' || !S) return;
    if (!$('#result').hidden) return;
    const k = e.key;
    if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || S.done) return;
    const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    if (mv) {
      e.preventDefault();
      const N = S.p.N;
      if (S.showCur) S.cur = { r: GK.clamp(S.cur.r + mv[0], 0, N - 1), c: GK.clamp(S.cur.c + mv[1], 0, N - 1) };
      S.showCur = true; S.hover = null;
      if (keyHold && GK.keys.has(keyHold.code)) keyPaint(keyHold.kind, keyHold.action);
      ensureVisible();
      dirty = true;
      return;
    }
    if (e.repeat) return;
    if (k === ' ' || k === 'z' || k === 'Z' || k === 'Enter') { e.preventDefault(); S.showCur = true; const a = keyPaint('fill'); keyHold = { code: e.code, kind: 'fill', action: a }; }
    else if (k === 'x' || k === 'X') { S.showCur = true; const a = keyPaint('mark'); keyHold = { code: e.code, kind: 'mark', action: a }; }
    else if (k === 'm' || k === 'M') setMode(S.mode === 'fill' ? 'mark' : 'fill');
    else if (k === 'h' || k === 'H') showHint();
    else if (k === '+' || k === '=' || k === ';') zoomBtn(1.35);
    else if (k === '-') zoomBtn(1 / 1.35);
    else if (k === 'Escape') { if (S.hint) closeHint(); }
  });
  addEventListener('keyup', (e) => { if (keyHold && e.code === keyHold.code) keyHold = null; });
  function ensureVisible() { computeGeo(); if (!geo.maxX && !geo.maxY) return; const { cs } = geo; const x = geo.gx + S.cur.c * cs, y = geo.gy + S.cur.r * cs; if (x < geo.gridL) S.panX -= geo.gridL - x; if (x + cs > geo.W) S.panX += x + cs - geo.W; if (y < geo.gridT) S.panY -= geo.gridT - y; if (y + cs > geo.H) S.panY += y + cs - geo.H; }

  /* ---------------- toolbar ---------------- */
  const IC = {
    fill: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg>',
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    pan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5L4 10l5 5"/><path d="M4 10h10a5.5 5.5 0 0 1 0 11h-3"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l5 5-5 5"/><path d="M20 10H10a5.5 5.5 0 0 0 0 11h3"/></svg>',
    hint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
    zout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20M7.5 10.5h6"/></svg>',
    zin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20M7.5 10.5h6M10.5 7.5v6"/></svg>',
  };
  const tools = {};
  function buildToolbar() {
    const bar = $('#toolbar');
    bar.innerHTML = '';
    const defs = [['fill', '塗る', () => setMode('fill')], ['mark', '×', () => setMode('mark')], ['pan', '移動', () => setMode(S.mode === 'pan' ? 'fill' : 'pan')], ['undo', '戻す', undo], ['redo', '進む', redo], ['hint', 'ヒント', showHint], ['zout', '縮小', () => zoomBtn(1 / 1.35)], ['zin', '拡大', () => zoomBtn(1.35)]];
    for (const [k, label, fn] of defs) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tb' + (k === 'undo' ? ' sep' : ''); b.title = label === '×' ? '× しるし' : label; b.setAttribute('aria-label', b.title);
      b.innerHTML = IC[k] + `<span>${label === '×' ? 'しるし' : label}</span>`;
      b.addEventListener('click', () => { if (k !== 'undo' && k !== 'redo') GK.sfx('click'); fn(); });
      bar.appendChild(b);
      tools[k] = b;
    }
    updateTools();
  }
  function setMode(m) { if (!S) return; S.mode = m; $('#stage').classList.toggle('pan', m === 'pan'); updateTools(); }
  function zoomBtn(f) { if (!S || S.done) return; computeGeo(); const cx = geo.gridL + (geo.W - geo.gridL) / 2, cy = geo.gridT + (geo.H - geo.gridT) / 2; zoomAt(S.z * f, cx, cy); }
  function updateTools() {
    if (!S || !tools.fill) return;
    computeGeo();
    tools.fill.classList.toggle('on', S.mode === 'fill');
    tools.mark.classList.toggle('on', S.mode === 'mark');
    tools.mark.classList.toggle('mark', S.mode === 'mark');
    tools.pan.classList.toggle('on', S.mode === 'pan');
    tools.undo.disabled = !S.undo.length || S.done;
    tools.redo.disabled = !S.redo.length || S.done;
    const zoomable = geo.zMax > 1.05;
    for (const k of ['pan', 'zout', 'zin']) tools[k].hidden = !zoomable;
    tools.zout.disabled = S.z <= 1.001;
    tools.zin.disabled = S.z >= geo.zMax - 0.001;
  }
  function layoutPlay() {
    const land = innerWidth > innerHeight * 1.1;
    $('#play').classList.toggle('land', land);
    requestAnimationFrame(() => { view.resize(); dirty = true; updateTools(); });
  }
  addEventListener('resize', () => { if (screen === 'play') layoutPlay(); });

  /* ---------------- hints ---------------- */
  function showHint() {
    if (!S || S.done) return;
    const N = S.p.N, sol = S.p.sol, wrong = [];
    for (let i = 0; i < N * N; i++) if ((S.grid[i] === 1 && !sol[i]) || (S.grid[i] === 2 && sol[i])) wrong.push(i);
    S.hints++;
    GK.sfx('select');
    let text;
    if (wrong.length) {
      S.hint = { wrong: true, cells: wrong.map((i) => [i, 0]) };
      text = `赤い枠のマス（${wrong.length} か所）がまちがっています。「消す」で元に戻せます。`;
      $('#hintApply').textContent = '消す';
      scrollToCell((wrong[0] / N) | 0, wrong[0] % N);
    } else {
      const h = OL.hintStep(S.p.cl.rows, S.p.cl.cols, S.grid);
      if (!h) return;
      const name = h.kind === 'row' ? `上から ${h.index + 1} 行目` : `左から ${h.index + 1} 列目`;
      const cs = h.clue.length ? h.clue.join('・') : '0';
      const sum = h.clue.reduce((a, b) => a + b, 0) + Math.max(0, h.clue.length - 1);
      if (h.clue.length && sum === N && !h.known) text = `${name}（ヒント ${cs}）は、すき間を入れるとちょうど ${N} マスです。置き方はひとつしかないので、すべて決まります。`;
      else if (!h.clue.length) text = `${name}のヒントは 0 です。この並びには塗るマスがひとつもないので、すべて × です。`;
      else if (!h.known && h.fills) text = `${name}（ヒント ${cs}）は、ヒントの長さ（すき間を入れて ${sum} マス）が ${N} マスのうち大きな部分を占めます。左に寄せても右に寄せても重なる、光っているマスは必ず塗られます。`;
      else if (!h.fills) text = `${name}（ヒント ${cs}）は、いま分かっているマスから考えると、光っているマスにはどの数字の黒も届きません。× をつけましょう（× ${h.marks}）。`;
      else text = `${name}（ヒント ${cs}）と、いま分かっているマスを合わせると、光っているマスが決まります（■ ${h.fills}${h.marks ? `・× ${h.marks}` : ''}）。`;
      S.hint = { kind: h.kind, index: h.index, cells: h.cells };
      $('#hintApply').textContent = '反映する';
      const [i0] = h.cells[0];
      scrollToCell((i0 / N) | 0, i0 % N);
    }
    $('#hintText').textContent = text;
    $('#hintBox').hidden = false;
    dirty = true;
    saveProg();
  }
  function closeHint() { if (S) S.hint = null; $('#hintBox').hidden = true; dirty = true; }
  function applyHint() {
    if (!S || !S.hint) return;
    const h = S.hint, ch = new Map();
    for (const [i, v] of h.cells) setCell(i, h.wrong ? 0 : v, ch);
    S.hint = null;
    $('#hintBox').hidden = true;
    GK.sfx('pop');
    commit(ch);
  }

  /* ---------------- timer ---------------- */
  let last = performance.now(), lastSave = 0;
  setInterval(() => {
    const now = performance.now();
    if (S && !S.done && screen === 'play' && !document.hidden && !document.querySelector('.gk-modal-back')) {
      S.elapsed += (now - last) / 1000;
      if (now - lastSave > 5000) { lastSave = now; saveProg(); }
    }
    last = now;
    if (S && screen === 'play') $('#timer').textContent = fmt(S.elapsed);
  }, 250);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveProg(); });
  addEventListener('pagehide', saveProg);

  /* ---------------- completion ---------------- */
  function complete() {
    S.done = true;
    closeHint();
    gesture = null;
    const t = Math.max(1, Math.round(S.elapsed));
    const R = rec(), old = R[S.p.id];
    const first = !old, best = !old || t < old.best;
    R[S.p.id] = { best: best ? t : old.best, clears: (old ? old.clears : 0) + 1, hints: S.hints };
    GK.store.set('rec', R);
    const P = prog(); delete P[S.p.id]; GK.store.set('prog', P);
    S.reveal = { t0: performance.now() };
    $('#play').classList.add('done');
    S.hover = null; S.showCur = false;
    updateTools();
    clearSnd();
    setTimeout(() => GK.sfx('win'), 1900);
    const p = S.p;
    setTimeout(() => {
      if (!S || S.p !== p) return;
      $('#rKicker').textContent = p.label;
      $('#rName').textContent = p.name;
      $('#rTime').textContent = fmt(t);
      $('#rBest').textContent = fmt(R[p.id].best);
      $('#rHint').textContent = S.hints;
      const solved = PZ.filter((q) => R[q.id]).length;
      $('#rNote').textContent = first ? `絵巻に「${p.name}」が加わりました（${solved} / ${PZ.length}）` : best ? 'ベストタイムを更新しました' : '';
      const nx = nextPuzzle(p);
      $('#rNext').hidden = !nx;
      $('#result').hidden = false;
      $('#pSub').textContent = p.name;
      setTimeout(() => (nx ? $('#rNext') : $('#rGallery')).focus({ preventScroll: true }), 60);
    }, 2500);
  }
  function nextPuzzle(p) {
    const R = rec();
    for (let k = 1; k <= PZ.length; k++) { const q = PZ[(p.index + k) % PZ.length]; if (!R[q.id]) return q; }
    return PZ[(p.index + 1) % PZ.length];
  }

  /* ---------------- gallery ---------------- */
  function openGallery() {
    const R = rec();
    const solved = PZ.filter((p) => R[p.id]).length;
    $('#gCount').textContent = `完成した絵 ${solved} / ${PZ.length}`;
    const box = $('#gScroll');
    box.innerHTML = '';
    for (const s of SIZES) {
      const sec = document.createElement('section');
      sec.className = 'g-sec';
      sec.innerHTML = `<h3>${SIZE_LABEL[s]}（${SIZE_SUB[s]}）</h3>`;
      const grid = document.createElement('div');
      grid.className = 'g-grid';
      for (const p of PZ.filter((q) => q.size === s)) {
        const r = R[p.id];
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'g-item' + (r ? '' : ' locked');
        const c = document.createElement('canvas');
        drawPic(c, p, r ? 'color' : 'blank');
        c.style.imageRendering = 'pixelated';
        b.appendChild(c);
        b.insertAdjacentHTML('beforeend', r ? `<b>${p.name}</b><small>ベスト ${fmt(r.best)}</small>` : `<b>？？？</b><small>No.${p.no}</small>`);
        b.addEventListener('click', () => { GK.sfx('click'); if (r) viewPicture(p); else openPuzzle(p); });
        grid.appendChild(b);
      }
      sec.appendChild(grid);
      box.appendChild(sec);
    }
    show('gallery');
  }
  async function viewPicture(p) {
    const R = rec(), r = R[p.id];
    const body = document.createElement('div');
    body.className = 'ol-big';
    const c = document.createElement('canvas');
    drawPic(c, p, 'color');
    c.style.imageRendering = 'pixelated';
    body.appendChild(c);
    body.insertAdjacentHTML('beforeend', `<p>${p.label}・ベスト ${fmt(r.best)}・完成 ${r.clears} 回</p>`);
    const v = await GK.modal({ title: p.name, body, buttons: [{ label: 'もう一度解く', value: 'again' }, { label: '閉じる', value: null, primary: true }] });
    if (v === 'again') { const P = prog(); delete P[p.id]; GK.store.set('prog', P); openPuzzle(p); }
  }

  /* ---------------- screens & menus ---------------- */
  function show(name) {
    screen = name;
    $('#title').hidden = name !== 'title';
    $('#play').hidden = name !== 'play';
    $('#gallery').hidden = name !== 'gallery';
    if (name !== 'play') { $('#result').hidden = true; closeHint(); }
    if (name === 'title') refreshTitle();
    if (GK.hudEl) GK.hudEl.classList.add('light');
  }
  function toList() { saveProg(); if (S && S.done) S = null; if (S) { tab = S.p.size; GK.store.set('tab', tab); } show('title'); }
  function openSettings() {
    const rows = [
      ['autoX', '終わった列に × を自動でつける', 'ヒントの数どおりに塗れた行・列の残りのマスに × をつけます'],
      ['check', 'まちがいをすぐに知らせる', '塗ってはいけないマスを塗ると、赤く光って × になります（まちがいの数を数えます）'],
      ['hl', '選んでいる行・列を強調する', 'カーソルのある行・列とそのヒントに色をつけます'],
      ['bgm', 'BGM を流す', '都節音階の静かなオリジナル曲（はじめはオフ）'],
    ];
    const body = document.createElement('div');
    body.className = 'ol-set';
    for (const [k, label, note] of rows) {
      const l = document.createElement('label');
      l.innerHTML = `<input type="checkbox" ${settings[k] ? 'checked' : ''}><span><b>${label}</b><small>${note}</small></span>`;
      l.querySelector('input').addEventListener('change', (e) => { settings[k] = e.target.checked; GK.store.set('settings', settings); if (k === 'bgm') syncMusic(); dirty = true; });
      body.appendChild(l);
    }
    return GK.modal({ title: '設定', body, buttons: [{ label: '閉じる', primary: true }] });
  }
  async function openMenu() {
    if (screen === 'play' && S && !S.done) {
      const v = await GK.modal({ title: 'メニュー', body: `<p>${S.p.label}・${fmt(S.elapsed)}</p>`, buttons: [{ label: '最初からやり直す', value: 'reset' }, { label: '設定', value: 'set' }, { label: '一覧へ', value: 'list' }, { label: 'つづける', value: null, primary: true }] });
      if (v === 'reset') {
        const ok = await GK.modal({ title: '最初からやり直しますか？', body: '<p>塗ったマスと × をすべて消します。時計は続きから進みます。</p>', buttons: [{ label: 'やめる', value: false }, { label: 'やり直す', value: true, primary: true }] });
        if (ok) { const ch = new Map(); for (let i = 0; i < S.grid.length; i++) setCell(i, 0, ch); if (ch.size) { S.undo.push([...ch].map(([i, b]) => [i, b, 0])); S.redo = []; } afterChange(); }
      } else if (v === 'set') openSettings();
      else if (v === 'list') toList();
      return;
    }
    const v = await GK.modal({ title: 'メニュー', body: '<p>設定と記録の管理です。</p>', buttons: [{ label: '記録を消す', value: 'reset', ghost: true }, { label: '設定', value: 'set' }, { label: '閉じる', value: null, primary: true }] });
    if (v === 'set') openSettings();
    else if (v === 'reset') {
      const ok = await GK.modal({ title: '記録を消しますか？', body: '<p>完成した絵・ベストタイム・とちゅうの問題がすべて消えます。元には戻せません。</p>', buttons: [{ label: 'やめる', value: false }, { label: '消す', value: true, primary: true }] });
      if (ok) { GK.store.del('rec'); GK.store.del('prog'); GK.toast('記録を消しました'); if (screen === 'gallery') openGallery(); else refreshTitle(); }
    }
  }

  const HELP = `
    <h3>ルール</h3>
    <p>盤面の上と左の数字は、その列（縦）・行（横）で<b>続けて塗るマスの数</b>を、並んでいる順に表しています。「3 1」なら、3 マス続けて塗り、1 マス以上あけて、1 マス塗ります。0 はその並びに塗るマスがないことです。すべてのヒントに合うように塗ると、絵が完成します。</p>
    <p>どの問題も、<b>1 行・1 列ずつ考えるだけで解ける</b>ように作ってあり、答えはひとつです。当てずっぽうで塗る必要はありません。</p>
    <h3>操作</h3>
    <table>
      <tr><th>塗る</th><td>マスをタップ・クリック。そのままなぞると、縦か横にまっすぐ続けて塗れます。塗ったマスから始めると消せます</td></tr>
      <tr><th>× しるし</th><td>「しるし」に切り替えてタップ、または右クリック。「塗らない」と決めたマスの目印です</td></tr>
      <tr><th>拡大・移動</th><td>15×15 と 20×20 は、2 本指でつまんで拡大・2 本指で移動、または「拡大」「縮小」「移動」ボタン、マウスのホイール。上と左のヒントは、動かしても見えたままです</td></tr>
      <tr><th>キーボード</th><td><kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> で移動、<kbd>Z</kbd>・<kbd>スペース</kbd> で塗る、<kbd>X</kbd> で ×（押したまま矢印で続けて）。<kbd>M</kbd> で切り替え、<kbd>H</kbd> でヒント、<kbd>Ctrl</kbd>＋<kbd>Z</kbd>・<kbd>Ctrl</kbd>＋<kbd>Y</kbd> で戻す・進む、<kbd>+</kbd><kbd>-</kbd> で拡大・縮小</td></tr>
    </table>
    <h3>便利な機能</h3>
    <ul>
      <li>ヒントの数どおりに塗れた数字は、うすい色に変わります（端から確定したものも）。</li>
      <li>ヒントボタンは、いま考えるとよい行・列と、決まるマスを光らせて理由を説明します。</li>
      <li>左上の小さな四角に、いまの塗り方が縮小して表示されます。</li>
      <li>とちゅうの問題は自動で保存されます。完成した絵は「絵巻」に色つきで飾られます。</li>
    </ul>`;
  GK.init({ id: 'oekaki-logic', title: 'ロジック絵巻', help: HELP, menu: openMenu });
  if (GK.hudEl) GK.hudEl.classList.add('light');
  GK.loadImages(['key-visual', 'gallery-bg', 'deco-kumo']);
  fetch('img/bg-paper.webp').then((r) => r.arrayBuffer()).then((b) => {
    const u = new Uint8Array(b), pat = 'game-images-sample';
    outer: for (let i = 0; i < u.length - pat.length; i++) { for (let k = 0; k < pat.length; k++) if (u[i + k] !== pat.charCodeAt(k)) continue outer; document.documentElement.classList.add('ol-sample-bg'); break; }
  }).catch(() => {});
  $('#backBtn').addEventListener('click', () => { GK.sfx('click'); toList(); });
  $('#gBack').addEventListener('click', () => { GK.sfx('click'); show('title'); });
  $('#galleryBtn').addEventListener('click', () => { GK.sfx('select'); openGallery(); });
  $('#settingsBtn').addEventListener('click', () => { GK.sfx('click'); openSettings(); });
  $('#hintClose').addEventListener('click', () => { GK.sfx('click'); closeHint(); });
  $('#hintApply').addEventListener('click', applyHint);
  $('#rList').addEventListener('click', () => { GK.sfx('click'); S = null; show('title'); });
  $('#rGallery').addEventListener('click', () => { GK.sfx('click'); S = null; openGallery(); });
  $('#rNext').addEventListener('click', () => { GK.sfx('select'); const nx = nextPuzzle(S.p); openPuzzle(nx); });
  addEventListener('pointerdown', syncMusic, { once: true });
  const origMute = GK.setMuted;
  GK.setMuted = (m) => { origMute(m); syncMusic(); };
  show('title');

  /* ---------------- self test ---------------- */
  window.__ol = { get state() { return S; }, openPuzzle, PZ, tap(r, c, button = 0) { computeGeo(); const rect = cv.getBoundingClientRect(); const o = { clientX: rect.left + geo.gx + (c + 0.5) * geo.cs, clientY: rect.top + geo.gy + (r + 0.5) * geo.cs, pointerId: 9, button, buttons: 1, pointerType: 'mouse', bubbles: true }; cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); } };
  window.__gameSelfTest = async function () {
    const notes = [];
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    GK.store.del('rec'); GK.store.del('prog'); tab = 5; show('title');
    await wait(150);
    await shot('title');
    // open the first 5×5 from its card
    document.querySelector('#cards .card').click();
    await wait(300);
    if (screen !== 'play' || !S) return { ok: false, notes: ['card did not open the puzzle'] };
    const p = S.p, N = p.N;
    const ptr = (type, r, c, extra = {}) => { computeGeo(); const rect = cv.getBoundingClientRect(); const x = rect.left + geo.gx + (c + 0.5) * geo.cs, y = rect.top + geo.gy + (r + 0.5) * geo.cs; cv.dispatchEvent(new PointerEvent(type, Object.assign({ clientX: x, clientY: y, pointerId: 7, button: 0, buttons: 1, pointerType: 'mouse', bubbles: true }, extra))); };
    // drag across row 1 (a full row in 桜)
    ptr('pointerdown', 1, 0); for (let c = 1; c < N; c++) ptr('pointermove', 1, c); ptr('pointerup', 1, N - 1);
    const filled = Array.from({ length: N }, (_, c) => S.grid[N + c]).filter((v) => v === 1).length;
    if (filled !== N) return { ok: false, notes: [`drag filled ${filled} of ${N}`] };
    // auto × on finished lines: row 1 is complete (no empty cells there) — check row 0 after hint later; undo / redo
    undo(); if (S.grid[N] !== 0) return { ok: false, notes: ['undo failed'] };
    redo(); if (S.grid[N] !== 1) return { ok: false, notes: ['redo failed'] };
    // right click marks ×
    ptr('pointerdown', 0, 0, { button: 2, buttons: 2 }); ptr('pointerup', 0, 0, { button: 2 });
    if (S.grid[0] !== 2) return { ok: false, notes: ['right click did not mark ×'] };
    // a hint explains and applies
    showHint(); await wait(120);
    if ($('#hintBox').hidden || !$('#hintText').textContent) return { ok: false, notes: ['hint did not open'] };
    notes.push('hint: ' + $('#hintText').textContent.slice(0, 36));
    await shot('hint');
    const before = S.grid.filter((v) => v).length;
    applyHint();
    if (S.grid.filter((v) => v).length <= before) return { ok: false, notes: ['hint applied nothing'] };
    // solve all but one cell (debug path), then the last one by a click
    const sol = p.sol; let lastCell = -1;
    for (let i = 0; i < N * N; i++) { if (sol[i] && S.grid[i] !== 1) lastCell = i; }
    if (lastCell < 0) for (let i = N * N - 1; i >= 0; i--) if (sol[i]) { lastCell = i; S.grid[i] = 0; break; }
    for (let i = 0; i < N * N; i++) if (i !== lastCell) S.grid[i] = sol[i] ? 1 : 2;
    S.grid[lastCell] = 0;
    dirty = true;
    ptr('pointerdown', (lastCell / N) | 0, lastCell % N); ptr('pointerup', (lastCell / N) | 0, lastCell % N);
    if (!S.done) return { ok: false, notes: ['not completed'] };
    await wait(1400); await shot('reveal');
    await wait(1500);
    if ($('#result').hidden) return { ok: false, notes: ['result not shown'] };
    await shot('result');
    if (!rec()[p.id]) return { ok: false, notes: ['record not saved'] };
    notes.push(`solved ${p.name} in ${$('#rTime').textContent}`);
    // a 20×20 puzzle: zoom in and out
    const big = PZ.find((q) => q.size === 20);
    openPuzzle(big); await wait(250);
    computeGeo();
    const z0 = geo.cs;
    zoomBtn(1.35); computeGeo();
    if (geo.zMax > 1.05 && geo.cs <= z0) return { ok: false, notes: ['zoom did nothing'] };
    zoomBtn(1 / 1.35); zoomBtn(1 / 1.35);
    ptr('pointerdown', 4, 2); ptr('pointermove', 4, 6); ptr('pointerup', 4, 6);
    await wait(100);
    await shot('big');
    notes.push(`20×20 cell ${Math.round(z0)}px, zoom max ×${geo.zMax.toFixed(2)}`);
    toList(); await wait(100);
    openGallery(); await wait(200);
    await shot('gallery');
    show('title');
    return { ok: true, notes };
  };
})();
