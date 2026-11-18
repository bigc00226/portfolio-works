/* 夜空のアーチ — 夏のナイターのホームラン競争（homerun-derby） */
(() => {
  'use strict';
  const ID = 'homerun-derby';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clamp = GK.clamp, lerp = GK.lerp, D2R = Math.PI / 180;
  const FONT = '"Yu Gothic UI","Yu Gothic","Hiragino Sans",Meiryo,sans-serif';
  const SERIF = '"Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif';
  const rnd = GK.rng(77);

  /* ---------------- data ---------------- */
  const CAM_Z = -7, CAM_Y = 1.25, PLATE_D = 7, MOUND = 18.44, REL_Z = 17;
  const ZONE = { x0: -0.215, x1: 0.215, y0: 0.5, y1: 1.06 };
  const SLOW = 1.85;          // pitches fly a little slower than real (game feel)
  const WIN = 0.14;           // timing window (s)
  const REACH = 0.16;         // contact radius around the cursor (m)
  const PT = {
    straight: { name: 'ストレート', B: (h) => [0, 0.06], k: 2 },
    curve: { name: 'カーブ', B: (h) => [0.26 * h, -0.42], k: 1.8 },
    slider: { name: 'スライダー', B: (h) => [0.3 * h, -0.08], k: 3 },
    fork: { name: 'フォーク', B: (h) => [0, -0.42], k: 3.4 },
    change: { name: 'チェンジアップ', B: (h) => [-0.08 * h, -0.2], k: 2.2 },
    shuuto: { name: 'シュート', B: (h) => [-0.24 * h, -0.1], k: 2.6 },
  };
  const PITCHERS = [
    { name: '夏木 ハヤト', nick: '新人の速球派', hand: 'R', rel: [-0.38, 1.85], target: 3, img: 'pitcher-1', uni: '#f4f1ea', acc: '#1f3a8a', cap: '#1f3a8a',
      mix: [{ t: 'straight', w: 7, v: [128, 138] }, { t: 'change', w: 3, v: [110, 116] }] },
    { name: '弓張 ツキノ', nick: '月夜のカーブ使い', hand: 'L', rel: [0.4, 1.8], target: 4, img: 'pitcher-2', uni: '#1d2340', acc: '#e2b54a', cap: '#1d2340',
      mix: [{ t: 'straight', w: 4, v: [132, 140] }, { t: 'curve', w: 3, v: [104, 114] }, { t: 'slider', w: 3, v: [120, 128] }] },
    { name: '岩城 ゴウ', nick: '剛腕フォーク', hand: 'R', rel: [-0.36, 1.92], target: 4, img: 'pitcher-3', uni: '#202020', acc: '#f08a2c', cap: '#202020',
      mix: [{ t: 'straight', w: 6, v: [145, 156] }, { t: 'fork', w: 4, v: [132, 139] }] },
    { name: '朧 ミツキ', nick: '横手投げの変化球師', hand: 'R', rel: [-0.62, 1.42], target: 5, img: 'pitcher-4', uni: '#efe9f6', acc: '#6b3fa0', cap: '#6b3fa0',
      mix: [{ t: 'straight', w: 3, v: [138, 146] }, { t: 'shuuto', w: 3, v: [134, 141] }, { t: 'slider', w: 2, v: [122, 129] }, { t: 'fork', w: 1, v: [128, 134] }, { t: 'change', w: 1, v: [112, 118] }] },
    { name: '星海 ジン', nick: '夜空の絶対エース', hand: 'R', rel: [-0.35, 1.9], target: 5, img: 'pitcher-5', uni: '#16213e', acc: '#c9d4e8', cap: '#0d1428',
      mix: [{ t: 'straight', w: 4, v: [150, 160] }, { t: 'slider', w: 2, v: [134, 142] }, { t: 'fork', w: 2, v: [136, 143] }, { t: 'curve', w: 1, v: [114, 121] }, { t: 'shuuto', w: 1, v: [140, 146] }] },
  ];
  const fenceAt = (phi) => 100 + 22 * Math.cos(clamp(phi / 45, -1, 1) * Math.PI / 2); // 100 m down the lines, 122 m to center
  const FENCE_H = 4;

  /* ---------------- state & records ---------------- */
  const REC = { stages: GK.store.get('stages', PITCHERS.map(() => ({ best: 0, clear: false })), ID), longest: GK.store.get('longest', 0, ID), endless: GK.store.get('endless', 0, ID) };
  const saveRec = () => { GK.store.set('stages', REC.stages); GK.store.set('longest', REC.longest); GK.store.set('endless', REC.endless); };
  const G = { mode: 'title', run: null, phase: 'idle', t: 0, ts: 1, aim: { x: 0, y: 0.78 }, msg: null, fw: [], flash: 0, shake: 0 };
  const DBG = { auto: false, perfect: false };

  /* ---------------- canvas & cameras ---------------- */
  const cv = $('#cv');
  const view = GK.fit(cv);
  function catcherCam() {
    const w = view.w, h = view.h, portrait = h > w;
    const zw = clamp(Math.min(w * 0.36, h * (portrait ? 0.2 : 0.26)), 80, 190);
    const f = (zw * PLATE_D) / 0.43;
    const zoneCY = h * (portrait ? 0.44 : 0.52);
    const cy = zoneCY - (f * (CAM_Y - 0.78)) / PLATE_D;
    return { f, cx: w / 2, cy, w, h, portrait };
  }
  function pC(C, x, y, z) { const d = z - CAM_Z; return [C.cx + (C.f * x) / d, C.cy - (C.f * (y - CAM_Y)) / d, C.f / d]; }
  function lookCam(pos, tgt, f, w, h) {
    const fx = tgt[0] - pos[0], fy = tgt[1] - pos[1], fz = tgt[2] - pos[2], fl = Math.hypot(fx, fy, fz);
    const F = [fx / fl, fy / fl, fz / fl];
    let R = [F[2], 0, -F[0]]; const rl = Math.hypot(R[0], R[2]); R = [R[0] / rl, 0, R[2] / rl];
    const U = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]];
    return { pos, F, R, U, f, cx: w / 2, cy: h * 0.5, w, h };
  }
  function pO(C, x, y, z) {
    const dx = x - C.pos[0], dy = y - C.pos[1], dz = z - C.pos[2];
    const zz = dx * C.F[0] + dy * C.F[1] + dz * C.F[2];
    if (zz < 0.5) return null;
    const xx = dx * C.R[0] + dy * C.R[1] + dz * C.R[2], yy = dx * C.U[0] + dy * C.U[1] + dz * C.U[2];
    return [C.cx + (C.f * xx) / zz, C.cy - (C.f * yy) / zz, C.f / zz];
  }

  /* ---------------- sound ---------------- */
  let crowd = null;
  function crowdOn(v) {
    const c = GK.audio();
    if (!c) return;
    if (!crowd) {
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = buf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.5; g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(GK.audioOut('music')); s.start();
      crowd = { g, f };
    }
    crowd.g.gain.setTargetAtTime(v, c.currentTime, 0.4);
  }
  function cheer(big) {
    const c = GK.audio();
    if (!c || !crowd) return;
    crowd.g.gain.cancelScheduledValues(c.currentTime);
    crowd.g.gain.setTargetAtTime(big ? 0.55 : 0.28, c.currentTime, 0.12);
    crowd.g.gain.setTargetAtTime(0.07, c.currentTime + (big ? 2.4 : 1.0), 0.8);
  }
  const SND = {
    release: () => GK.noise({ d: 0.25, v: 0.12, f: 900, q: 0.8 }),
    mitt: () => { GK.noise({ d: 0.06, v: 0.5, f: 1400, q: 0.7 }); GK.tone({ f: 140, f2: 80, d: 0.08, type: 'sine', v: 0.4 }); },
    swing: () => GK.noise({ d: 0.18, v: 0.16, f: 2500, filter: 'highpass' }),
    crack: (q) => { GK.noise({ d: 0.05 + q * 0.06, v: 0.6, f: 3000, filter: 'highpass' }); GK.tone({ f: 1900 + q * 600, f2: 1100, d: 0.09 + q * 0.12, type: 'triangle', v: 0.25 + q * 0.2 }); GK.tone({ f: 3200, d: 0.05 + q * 0.2, type: 'sine', v: 0.08 + q * 0.1 }); },
    foul: () => GK.tone({ f: 660, f2: 440, d: 0.2, type: 'triangle', v: 0.12 }),
    firework: () => { GK.tone({ f: 90, f2: 40, d: 0.5, type: 'sine', v: 0.4 }); GK.noise({ d: 0.6, v: 0.25, f: 600, filter: 'lowpass' }); for (let i = 0; i < 6; i++) GK.noise({ d: 0.05, v: 0.12, f: 5000, filter: 'highpass', at: 0.25 + i * 0.07 + Math.random() * 0.05 }); },
  };
  const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const deg = (root, str) => str.split(/\s+/).map((t) => { if (t === '.' || t === '-') return t; const s = [0, 2, 4, 7, 9], d = +t, o = Math.floor(d / 5), m = root + s[((d % 5) + 5) % 5] + 12 * o; return NN[m % 12] + (Math.floor(m / 12) - 1); }).join(' ');
  const TITLE_SONG = { bpm: 126, steps: 2, tracks: [
    { type: 'square', v: 0.06, notes: deg(67, '0 . 2 3 4 - 4 . | 5 4 3 2 3 - - . | 2 . 3 4 5 - 5 . | 7 6 5 4 5 - - . | 5 . 5 6 7 - 5 . | 4 . 3 2 3 - 4 . | 5 4 3 2 1 - 2 . | 0 - - - . . . .'.replace(/\|/g, '')) },
    { type: 'triangle', v: 0.16, notes: deg(43, '0 . 0 . 4 . 4 . | 3 . 3 . 2 . 2 . | 0 . 0 . 4 . 4 . | 3 . 3 . 4 . 4 . | 5 . 5 . 4 . 4 . | 3 . 3 . 2 . 2 . | 3 . 3 . 1 . 1 . | 0 . 4 . 0 . . .'.replace(/\|/g, '')) },
  ], drums: { k: 'x . . . x . . .', s: '. . x . . . x .', h: 'x x x x x x x x' } };
  const PLAY_SONG = { bpm: 126, steps: 2, tracks: [], drums: { t: 'x . x . x x x . x . x . x x x .', h: '. . . . x . . . . . . . x . . .' } };

  /* ---------------- pitches ---------------- */
  function pickPitch(P, speedUp) {
    let r = rnd() * P.mix.reduce((a, m) => a + m.w, 0), m = P.mix[0];
    for (const x of P.mix) { r -= x.w; if (r <= 0) { m = x; break; } }
    const kmh = Math.round(lerp(m.v[0], m.v[1], rnd()) * (speedUp || 1));
    const strike = rnd() < 0.72;
    let tx, ty;
    if (strike) { tx = lerp(ZONE.x0 + 0.03, ZONE.x1 - 0.03, rnd()); ty = lerp(ZONE.y0 + 0.04, ZONE.y1 - 0.04, rnd()); }
    else { const side = rnd(); if (side < 0.5) { tx = (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.14); ty = lerp(0.55, 1.0, rnd()); } else { tx = lerp(-0.2, 0.2, rnd()); ty = rnd() < 0.6 ? 0.36 - rnd() * 0.1 : 1.2 + rnd() * 0.1; } }
    if (m.t === 'fork' || m.t === 'curve') ty = Math.min(ty, strike ? 0.85 : ty);
    const h = P.hand === 'R' ? 1 : -1, T = PT[m.t];
    const B = T.B(h);
    const flight = (REL_Z / (kmh / 3.6)) * SLOW;
    return { type: m.t, name: T.name, kmh, x0: P.rel[0], y0: P.rel[1], x1: tx, y1: ty, bx: B[0], by: B[1], k: T.k, T: flight };
  }
  function ballAt(p, u) {
    const e = Math.pow(u, p.k);
    return [lerp(p.x0, p.x1 - p.bx, u) + p.bx * e, lerp(p.y0, p.y1 - p.by, u) + p.by * e, REL_Z * (1 - u)];
  }
  const inZone = (x, y) => Math.abs(x) <= ZONE.x1 + 0.037 && y >= ZONE.y0 - 0.037 && y <= ZONE.y1 + 0.037;

  /* ---------------- batted ball ---------------- */
  function simulate(evKmh, la, phi) {
    const v0 = evKmh / 3.6, a = la * D2R, p = phi * D2R, K = 0.0052, CL = 0.0019, dt = 1 / 120;
    let x = 0, y = 0.9, z = 0, vh = v0 * Math.cos(a), vy = v0 * Math.sin(a), vx = vh * Math.sin(p), vz = vh * Math.cos(p), t = 0;
    const path = [];
    let hr = false, cross = -1;
    while (t < 12) {
      path.push([x, y, z, t]);
      const v = Math.hypot(vx, vy, vz), hz = Math.hypot(vx, vz);
      vx += -K * v * vx * dt; vz += -K * v * vz * dt; vy += (-9.8 - K * v * vy + (la > 5 ? CL * v * hz : 0)) * dt;
      x += vx * dt; y += vy * dt; z += vz * dt; t += dt;
      const r = Math.hypot(x, z), ph = Math.atan2(x, z) / D2R;
      if (cross < 0 && Math.abs(ph) <= 45 && r >= fenceAt(ph)) { cross = path.length; hr = y > FENCE_H; if (!hr) { vx *= -0.25; vz *= -0.25; } }
      const floorY = hr && r > fenceAt(ph) ? Math.min(14, FENCE_H + (r - fenceAt(ph)) * 0.45) : 0;
      if (y <= floorY && vy < 0) { path.push([x, floorY, z, t]); break; }
    }
    const last = path[path.length - 1];
    const dist = Math.hypot(last[0], last[2]);
    const landPhi = Math.atan2(last[0], last[2]) / D2R;
    const carry = hr ? Math.round(dist) : Math.round(dist);
    return { path, hr, dist: carry, phi: landPhi, foul: Math.abs(phi) > 45 || (Math.abs(landPhi) > 45 && !hr), t: last[3] };
  }

  /* ---------------- run / flow ---------------- */
  function newRun(mode, stage) {
    G.run = { mode, stage, P: PITCHERS[stage], balls: 0, outs: 0, hr: 0, longest: 0, log: [], streakP: stage, speedUp: 1 };
    G.mode = 'play';
    showScreen(null);
    music('play'); crowdOn(0.07);
    nextPitch(1.0);
    updateHud();
  }
  function nextPitch(delay = 0.6) {
    const R = G.run;
    if (R.mode === 'stage' && R.balls >= 10) { endRun(); return; }
    if (R.mode === 'endless' && R.outs >= 5) { endRun(); return; }
    G.phase = 'ready'; G.t = -delay; G.pitch = null; G.swing = null; G.hit = null; G.view = 'catcher'; G.ts = 1; G.locked = false;
    G.pitch = pickPitch(R.P, R.speedUp);
    updateHud();
  }
  const WINDUP = 1.15, REL_P = 0.86;
  function swing() {
    if (G.mode !== 'play' || G.swing || G.view !== 'catcher' || G.locked) return;
    if (G.phase !== 'pitch') return; // before the release a swing does nothing
    G.swing = { t: 0 };
    SND.swing();
    const p = G.pitch, e = G.t - p.T;
    const dx = p.x1 - G.aim.x, dy = p.y1 - G.aim.y, dist = Math.hypot(dx, dy);
    if (Math.abs(e) > WIN || dist > REACH) { G.swing.res = { e, dx, dy }; return; } // a miss: the ball goes on to the mitt
    const tq = 1 - Math.pow(Math.abs(e) / WIN, 1.4);
    const q = clamp(1 - Math.hypot(dx, dy - 0.04) / 0.17, 0, 1);
    const ev = 95 + 80 * Math.pow(q, 0.85) * Math.pow(tq, 1.1);
    const la = clamp(14 + (dy / REACH) * 50 + (rnd() - 0.5) * 8, -25, 72);
    const phi = (e / WIN) * 48 - (dx / REACH) * 10 + (rnd() - 0.5) * 10;
    const sim = simulate(ev, la, phi);
    G.hit = { ev, la, phi, e, q, sim, t: 0 };
    G.phase = 'contact'; G.t = 0;
    G.swing.t = 0.12; // the press is the moment of impact: show the bat level through the ball
    SND.crack(q * tq);
    G.flash = 0.5 + q * 0.4; G.shake = 6 * q;
    if (sim.hr) { G.ts = 0.22; cheer(true); } else cheer(false);
  }
  function result(kind, o = {}) {
    const R = G.run;
    let label = '', sub = '', counts = true, out = true, color = '#fff';
    const tim = o.e == null ? '' : Math.abs(o.e) < 0.025 ? 'タイミング：ジャスト' : o.e < 0 ? (o.e < -0.07 ? 'タイミング：早い' : 'タイミング：少し早い') : o.e > 0.07 ? 'タイミング：遅い' : 'タイミング：少し遅い';
    if (kind === 'hr') { label = 'ホームラン！'; sub = `飛距離 ${o.dist} m`; color = '#ffd75e'; out = false; R.hr++; R.longest = Math.max(R.longest, o.dist); if (o.dist > REC.longest && !DBG.auto) { REC.longest = o.dist; saveRec(); sub += '　最長記録！'; } }
    else if (kind === 'hit') { label = o.dist < 40 ? 'ゴロ' : 'ヒット'; sub = `${o.dist} m　${tim}`; }
    else if (kind === 'foul') { label = 'ファウル'; sub = tim; color = '#c9d4e8'; }
    else if (kind === 'miss') { label = '空振り'; sub = o.early ? '投げる前に振りました' : o.e != null && Math.abs(o.e) > WIN ? (o.e < 0 ? 'タイミング：早すぎ' : 'タイミング：遅すぎ') : 'ボールの位置とカーソルがずれています'; color = '#9fb4ff'; }
    else if (kind === 'strike') { label = '見逃し'; sub = 'ストライクを見送りました'; color = '#c9d4e8'; }
    else if (kind === 'ball') { label = 'ボール'; sub = 'ボール球は数えません'; color = '#b8f0c8'; counts = false; out = false; }
    if (counts) { R.balls++; if (R.mode === 'endless' && out) R.outs++; }
    R.log.push({ kind, dist: o.dist || 0 });
    G.msg = { label, sub, color, t: 0 };
    if (R.mode === 'endless' && kind === 'hr' && R.hr % 4 === 0) { R.streakP = Math.min(PITCHERS.length - 1, R.streakP + 1); R.P = PITCHERS[R.streakP]; R.speedUp = 1 + R.hr * 0.004; GK.toast(`投手交代：${R.P.name}（${R.P.nick}）`); }
    G.phase = 'result'; G.t = 0; G.locked = true;
    updateHud();
  }
  function endRun() {
    const R = G.run;
    G.mode = 'result'; music('title'); crowdOn(0.03);
    let title, msg, isNew = false;
    if (R.mode === 'stage') {
      const rec = REC.stages[R.stage], clear = R.hr >= R.P.target;
      isNew = R.hr > rec.best;
      if (!DBG.auto) { rec.best = Math.max(rec.best, R.hr); rec.clear = rec.clear || clear; saveRec(); }
      title = clear ? '勝負あり！ クリア' : 'あと一歩…';
      msg = clear ? (R.stage < PITCHERS.length - 1 ? `${PITCHERS[R.stage + 1].name} と勝負できるようになりました。` : '全員に勝ちました。夜空のアーチの主です！') : `ホームラン ${R.P.target} 本でクリアです。カーソルをボールの少し下に合わせると、打球が上がります。`;
      $('#rNext').hidden = !(clear && R.stage < PITCHERS.length - 1);
      $('#rSub').textContent = `${R.P.name}（${R.P.nick}）・ 目標 ${R.P.target} 本`;
      if (clear) GK.sfx('win'); else GK.sfx('lose');
    } else {
      isNew = R.hr > REC.endless;
      if (!DBG.auto) { REC.endless = Math.max(REC.endless, R.hr); saveRec(); }
      title = 'エンドレス 終了';
      msg = `アウト 5 つで終了です。最高記録は ${REC.endless} 本。`;
      $('#rNext').hidden = true;
      $('#rSub').textContent = 'エンドレス';
      GK.sfx(R.hr ? 'win' : 'lose');
    }
    $('#rMenu').textContent = R.mode === 'stage' ? '投手を選ぶ' : 'タイトルへ';
    $('#rTitle').textContent = title;
    $('#rMsg').textContent = msg;
    $('#rHR').textContent = R.hr;
    $('#rNew').hidden = !isNew || DBG.auto;
    $('#rLong').textContent = R.longest ? `${R.longest} m` : '―';
    $('#rLog').innerHTML = R.log.filter((l) => l.kind !== 'ball').map((l) => `<span class="chip ${l.kind}">${{ hr: '本', hit: '安', foul: 'フ', miss: '空', strike: '見' }[l.kind]}</span>`).join('');
    showScreen('#result');
  }

  /* ---------------- update ---------------- */
  function update(dt) {
    const R = G.run;
    if (!R) return;
    const sdt = dt * G.ts;
    G.t += sdt;
    if (G.swing) { G.swing.t += sdt; }
    // aim with keys
    const k = GK.keys, sp = 1.1 * dt;
    const mx = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
    const my = (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0) - (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0);
    if (mx || my) { G.aim.x += mx * sp; G.aim.y += my * sp; }
    G.aim.x = clamp(G.aim.x, -0.55, 0.55); G.aim.y = clamp(G.aim.y, 0.25, 1.38);
    switch (G.phase) {
      case 'ready':
        if (G.t >= 0) { G.phase = 'windup'; G.t = 0; }
        break;
      case 'windup':
        if (G.t >= WINDUP * REL_P) { G.phase = 'pitch'; G.t = 0; SND.release(); G.pitchShown = performance.now(); updateHud(); }
        break;
      case 'pitch': {
        const p = G.pitch;
        if (DBG.auto) {
          G.aim.x = lerp(G.aim.x, p.x1, 0.4); G.aim.y = lerp(G.aim.y, p.y1 - 0.035, 0.4);
          if (!G.swing && G.t >= p.T - 0.004 && (DBG.perfect || inZone(p.x1, p.y1))) swing();
        }
        if (G.phase === 'pitch' && G.t >= p.T + 0.04) {
          SND.mitt();
          if (G.swing) result('miss', G.swing.res || {});
          else result(inZone(p.x1, p.y1) ? 'strike' : 'ball');
        }
        break;
      }
      case 'contact':
        if (G.t >= 0.4) {
          G.ts = 1;
          const h = G.hit;
          if (h.la < 4 && !h.sim.foul) { G.view = 'catcher'; G.phase = 'roll'; G.t = 0; }
          else { G.view = 'field'; G.phase = 'flight'; G.t = 0; G.camT = [h.sim.path[0][0], 2, 60]; G.trail = []; }
        }
        break;
      case 'roll':
        if (G.t > 0.9) result('hit', { dist: G.hit.sim.dist, e: G.hit.e });
        break;
      case 'flight': {
        const h = G.hit, path = h.sim.path;
        G.ts = 1.5;
        const i = Math.min(path.length - 1, Math.floor((G.t / path[path.length - 1][3]) * (path.length - 1)) || 0);
        const pnow = path[i];
        h.pos = pnow; h.i = i;
        if (h.sim.hr && !h.crossed && Math.hypot(pnow[0], pnow[2]) > fenceAt(Math.atan2(pnow[0], pnow[2]) / D2R) - 3) { h.crossed = true; h.slowT = 0.9; }
        if (h.slowT > 0) { h.slowT -= dt; G.ts = 0.45; }
        if (G.t >= path[path.length - 1][3]) {
          G.phase = 'landed'; G.t = 0; G.ts = 1;
          if (h.sim.hr) { result('hr', { dist: h.sim.dist, e: h.e }); for (let n = 0; n < 4; n++) setTimeout(() => firework(), n * 380); }
          else if (h.sim.foul) { SND.foul(); result('foul', { e: h.e }); }
          else result('hit', { dist: h.sim.dist, e: h.e });
          G.phase = 'landed';
        }
        break;
      }
      case 'landed':
        if (G.t > 2.2) nextPitch(0.4);
        break;
      case 'result':
        if (G.t > 1.5) nextPitch(0.3);
        break;
    }
    if (G.msg) G.msg.t += dt;
    if (G.flash > 0) G.flash -= dt * 2.5;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  }

  /* ---------------- render ---------------- */
  const crowdDots = Array.from({ length: 520 }, () => ({ phi: -52 + rnd() * 104, r: rnd(), c: ['#ffffff', '#ffd75e', '#ff8a8a', '#8fb6ff', '#c9f0d0'][Math.floor(rnd() * 5)], tw: rnd() * 6 }));
  const stars = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd() * 0.45, s: rnd() }));
  function render(now) {
    view.clear();
    document.body.classList.toggle('fieldview', G.view === 'field');
    if (G.mode !== 'play' && G.mode !== 'result' && G.mode !== 'intro') return;
    const g = view.ctx;
    g.save();
    if (G.shake > 0) g.translate((rnd() - 0.5) * G.shake, (rnd() - 0.5) * G.shake);
    if (G.view === 'field' && G.hit) drawField(g, now); else drawCatcher(g, now);
    g.restore();
    // fireworks over everything (a summer night)
    if (G.fw.length) {
      g.globalCompositeOperation = 'lighter';
      for (const p of G.fw) { const a = 1 - p.t / p.life; g.globalAlpha = Math.max(0, a); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 1.6 + a * 1.4, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    if (G.flash > 0) { g.fillStyle = `rgba(255,252,235,${Math.min(0.7, G.flash)})`; g.fillRect(0, 0, view.w, view.h); }
    if (G.msg && G.mode === 'play') drawMsg(g);
  }
  function sky(g, w, h, horizon, imgName) {
    const sk = g.createLinearGradient(0, 0, 0, horizon);
    sk.addColorStop(0, '#060a1c'); sk.addColorStop(0.7, '#14204a'); sk.addColorStop(1, '#2a3566');
    g.fillStyle = sk; g.fillRect(0, 0, w, horizon + 2);
    const img = GK.images[imgName];
    if (img && img.width) {
      const s = Math.max(w / img.width, (horizon + 40) / img.height);
      g.save(); g.globalAlpha = 0.85; g.beginPath(); g.rect(0, 0, w, horizon + 1); g.clip();
      g.drawImage(img, (w - img.width * s) / 2, horizon + 40 - img.height * s, img.width * s, img.height * s);
      g.restore();
    }
    g.fillStyle = '#fff';
    for (const s of stars) { g.globalAlpha = 0.25 + s.s * 0.5; g.fillRect(s.x * w, s.y * horizon, 1.4, 1.4); }
    g.globalAlpha = 1;
  }
  function glow(g, x, y, r, a = 0.7) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,250,225,${a})`); gr.addColorStop(0.25, `rgba(255,240,190,${a * 0.35})`); gr.addColorStop(1, 'rgba(255,240,190,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function poly(g, pts) { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); }
  function drawCatcher(g, now) {
    const C = catcherCam(), w = C.w, h = C.h;
    const hz = C.cy; // the horizon
    sky(g, w, h, hz, 'bg-plate');
    // outfield wall and lights near the horizon
    const wallTop = pC(C, 0, FENCE_H, 122)[1], wallBot = pC(C, 0, 0, 122)[1];
    g.globalCompositeOperation = 'lighter';
    for (const lx of [-0.42, -0.18, 0.18, 0.42]) glow(g, w / 2 + lx * w * 1.1, hz - (h * 0.18), Math.min(w, h) * 0.16, 0.45);
    g.globalCompositeOperation = 'source-over';
    // grass
    const gr = g.createLinearGradient(0, hz, 0, h);
    gr.addColorStop(0, '#1f4a2c'); gr.addColorStop(0.25, '#2c6b3a'); gr.addColorStop(1, '#3f8a4a');
    g.fillStyle = gr; g.fillRect(0, wallBot, w, h - wallBot);
    g.fillStyle = '#16302a'; g.fillRect(0, wallTop, w, wallBot - wallTop + 1);
    g.fillStyle = '#e2c14a'; g.fillRect(0, wallTop, w, 1.2);
    // mowing stripes
    g.globalAlpha = 0.08; g.fillStyle = '#fff';
    for (let z = 20; z < 120; z += 12) { const a = pC(C, 0, 0, z)[1], b = pC(C, 0, 0, z + 6)[1]; g.fillRect(0, b, w, a - b); }
    g.globalAlpha = 1;
    // infield dirt, mound, base lines, plate
    const P = (x, z) => pC(C, x, 0, z);
    g.fillStyle = '#9a6a42';
    poly(g, [P(-28, 26), P(-14, 34), P(0, 36.5), P(14, 34), P(28, 26), P(22, 18), P(0, 30), P(-22, 18)]); g.fill();
    poly(g, [P(-22, 18), P(0, 30), P(22, 18), P(0, 6)]); g.fillStyle = '#2f6e3d'; g.fill();
    const m = P(0, MOUND), mr = 2.7 * m[2];
    g.fillStyle = '#a8764a'; g.beginPath(); g.ellipse(m[0], m[1], mr, mr * 0.12 + 1, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7d5638'; poly(g, [P(-3.2, -1.6), P(3.2, -1.6), P(4.2, 2.6), P(0, 6), P(-4.2, 2.6)]); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2;
    g.beginPath(); let a = P(0, 0), b = P(-60, 60); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); a = P(0, 0); b = P(60, 60); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.5)';
    for (const sx of [-1, 1]) { poly(g, [P(sx * 0.37, -0.9), P(sx * 1.6, -0.9), P(sx * 1.6, 0.9), P(sx * 0.37, 0.9)]); g.stroke(); }
    g.fillStyle = '#f4f1ea'; poly(g, [P(-0.215, 0), P(0.215, 0), P(0.215, -0.2), P(0, -0.43), P(-0.215, -0.2)]); g.fill();
    const vg = g.createLinearGradient(0, h * 0.62, 0, h); vg.addColorStop(0, 'rgba(6,10,28,0)'); vg.addColorStop(1, 'rgba(6,10,28,.55)'); g.fillStyle = vg; g.fillRect(0, h * 0.62, w, h * 0.38);
    // pitcher
    drawPitcher(g, C, now);
    // strike zone
    const z0 = pC(C, ZONE.x0, ZONE.y1, 0), z1 = pC(C, ZONE.x1, ZONE.y0, 0);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.strokeRect(z0[0], z0[1], z1[0] - z0[0], z1[1] - z0[1]);
    g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1;
    for (let i = 1; i < 3; i++) { const x = lerp(z0[0], z1[0], i / 3), y = lerp(z0[1], z1[1], i / 3); g.beginPath(); g.moveTo(x, z0[1]); g.lineTo(x, z1[1]); g.moveTo(z0[0], y); g.lineTo(z1[0], y); g.stroke(); }
    // the ball
    const p = G.pitch;
    let ballScreen = null;
    if (p && (G.phase === 'pitch' || (G.phase === 'result' && !G.hit && G.t < 0.4))) {
      const u = G.phase === 'pitch' ? Math.min(1.03, G.t / p.T) : 1.03;
      const [x, y, z] = ballAt(p, u);
      const sh = pC(C, x, 0, z), bs = pC(C, x, y, z);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(sh[0], sh[1], 0.06 * sh[2], 0.015 * sh[2] + 1, 0, 0, Math.PI * 2); g.fill();
      ballScreen = bs;
    }
    if (G.hit && (G.phase === 'contact' || G.phase === 'roll')) {
      const tt = G.phase === 'contact' ? G.t * 0.6 : 0.24 + G.t;
      const path = G.hit.sim.path, i = Math.min(path.length - 1, Math.floor(tt * 120));
      const q = path[i];
      if (q[2] - CAM_Z > 0.5) ballScreen = pC(C, q[0], q[1], q[2]);
    }
    // batter and bat (behind the ball when it is near)
    drawBatter(g, C);
    if (ballScreen) drawBall(g, ballScreen[0], ballScreen[1], Math.max(2, 0.037 * 1.25 * ballScreen[2]), now);
    // cursor
    if (G.mode === 'play' && G.view === 'catcher') {
      const c = pC(C, G.aim.x, G.aim.y, 0), sc = c[2];
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([5, 5]); g.lineWidth = 1.5; g.beginPath(); g.arc(c[0], c[1], REACH * sc, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#ffd75e'; g.lineWidth = 2.5; g.beginPath(); g.arc(c[0], c[1], 0.07 * sc, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(c[0] - 0.1 * sc, c[1]); g.lineTo(c[0] - 0.035 * sc, c[1]); g.moveTo(c[0] + 0.035 * sc, c[1]); g.lineTo(c[0] + 0.1 * sc, c[1]); g.moveTo(c[0], c[1] - 0.1 * sc); g.lineTo(c[0], c[1] - 0.035 * sc); g.moveTo(c[0], c[1] + 0.035 * sc); g.lineTo(c[0], c[1] + 0.1 * sc); g.stroke();
      g.fillStyle = '#ffd75e'; g.beginPath(); g.arc(c[0], c[1] + 0.035 * sc, 2.2, 0, Math.PI * 2); g.fill();
    }
    // the pitch's type and speed, broadcast style
    if (p && (G.phase === 'pitch' || G.phase === 'result' || G.phase === 'contact' || G.phase === 'roll') && G.pitchShown) {
      const bw = 168, bx = 12, by = C.portrait ? h * 0.2 : 64;
      g.fillStyle = 'rgba(8,12,30,.78)'; g.fillRect(bx, by, bw, 40);
      g.fillStyle = '#e23a3a'; g.fillRect(bx, by, 4, 40);
      g.fillStyle = '#fff'; g.font = `800 15px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(p.name, bx + 14, by + 20);
      g.textAlign = 'right'; g.fillStyle = '#ffd75e'; g.font = `800 16px ${FONT}`; g.fillText(`${p.kmh} km/h`, bx + bw - 10, by + 20);
    }
  }
  function drawBall(g, x, y, r, now) {
    g.fillStyle = '#fbfaf5'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    if (r > 4) {
      const a = now / 60;
      g.strokeStyle = '#d23a3a'; g.lineWidth = Math.max(1, r * 0.14);
      g.beginPath(); g.arc(x - r * 0.9, y, r * 0.75, -0.9 + a * 0, 0.9); g.stroke();
      g.beginPath(); g.arc(x + r * 0.9, y, r * 0.75, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.arc(x + r * 0.25, y + r * 0.25, r * 0.8, 0, Math.PI * 2); g.fill();
  }
  /* the pitcher: a jointed figure seen from home plate, posed by keyframes */
  const KEYS = [
    { p: 0, hd: [0, 1.7], hip: [0, 0.98], gk: [0.14, 0.52], gf: [0.18, 0.02], tk: [-0.14, 0.52], tf: [-0.18, 0.02], ge: [0.18, 1.2], gh: [0.04, 1.18], te: [-0.18, 1.2], th: [-0.03, 1.18] },
    { p: 0.35, hd: [-0.02, 1.71], hip: [-0.03, 0.98], gk: [0.1, 1.02], gf: [0.04, 0.62], tk: [-0.14, 0.52], tf: [-0.16, 0.02], ge: [0.16, 1.3], gh: [0.02, 1.32], te: [-0.16, 1.3], th: [-0.02, 1.32] },
    { p: 0.7, hd: [0.06, 1.56], hip: [0.02, 0.86], gk: [0.32, 0.46], gf: [0.4, 0.02], tk: [-0.22, 0.42], tf: [-0.32, 0.04], ge: [0.42, 1.36], gh: [0.3, 1.3], te: [-0.36, 1.26], th: [-0.56, 1.04] },
    { p: 0.86, hd: [0.03, 1.5], hip: [0.04, 0.84], gk: [0.3, 0.44], gf: [0.4, 0.02], tk: [-0.18, 0.46], tf: [-0.28, 0.08], ge: [0.18, 1.18], gh: [0.12, 1.06], te: [-0.26, 1.62], th: [-0.16, 1.9] },
    { p: 1, hd: [0.1, 1.44], hip: [0.06, 0.84], gk: [0.3, 0.44], gf: [0.4, 0.02], tk: [-0.1, 0.62], tf: [-0.12, 0.36], ge: [0.2, 1.12], gh: [0.1, 1.0], te: [0.04, 1.14], th: [0.26, 0.86] },
  ];
  function pose(p, side) {
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) if (p >= KEYS[i].p && p <= KEYS[i + 1].p) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    const t = b.p === a.p ? 0 : GK.ease.inOutQuad((p - a.p) / (b.p - a.p)), o = {};
    for (const k in a) if (k !== 'p') o[k] = [lerp(a[k][0], b[k][0], t) * side, lerp(a[k][1], b[k][1], t)];
    return o;
  }
  function drawPitcher(g, C, now) {
    const R = G.run, P = R ? R.P : PITCHERS[G.introStage || 0];
    let p = 0;
    if (G.phase === 'windup') p = clamp(G.t / WINDUP, 0, 1);
    else if (G.phase === 'pitch') p = clamp(REL_P + (G.t / 0.35) * (1 - REL_P), 0, 1);
    else if (G.phase === 'result' || G.phase === 'contact' || G.phase === 'roll') p = 1;
    const side = P.hand === 'R' ? 1 : -1, side2 = P.rel[1] < 1.6 ? 1 : 0;
    const o = pose(p, side);
    if (side2 && p > 0.75) { o.te = [o.te[0] - 0.25 * side, o.te[1] - 0.3]; o.th = [o.th[0] - 0.4 * side, o.th[1] - 0.5]; }
    const z = MOUND - 0.4, Q = (pt) => pC(C, pt[0], pt[1], z);
    const s = C.f / (z - CAM_Z), breathe = G.phase === 'ready' || G.phase === 'idle' ? Math.sin(now / 500) * 0.01 : 0;
    o.hd[1] += breathe;
    const base = pC(C, 0, 0, z);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(base[0], base[1], 0.5 * s, 0.06 * s + 1, 0, 0, Math.PI * 2); g.fill();
    const limb = (a, b, c, wdt, col) => { const A = Q(a), B = Q(b), Cc = Q(c); g.strokeStyle = col; g.lineWidth = wdt * s; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(Cc[0], Cc[1]); g.stroke(); };
    const sh = [o.hd[0] * 0.9, o.hd[1] - 0.24], lsh = [sh[0] + 0.17, sh[1] - 0.03], rsh = [sh[0] - 0.17, sh[1] - 0.03];
    const hipL = [o.hip[0] + 0.1, o.hip[1]], hipR = [o.hip[0] - 0.1, o.hip[1]];
    const pants = '#e9e6dd';
    limb(hipL, o.gk.map((v, i) => v + (i ? 0 : 0)), o.gf, 0.15, pants);
    limb(hipR, o.tk, o.tf, 0.15, pants);
    g.fillStyle = '#1a1a1a'; for (const f of [o.gf, o.tf]) { const F = Q(f); g.beginPath(); g.ellipse(F[0], F[1], 0.09 * s, 0.04 * s, 0, 0, Math.PI * 2); g.fill(); }
    // torso
    const T = [Q([lsh[0] + 0.03, lsh[1]]), Q([rsh[0] - 0.03, rsh[1]]), Q([hipR[0] - 0.03, hipR[1] + 0.05]), Q([hipL[0] + 0.03, hipL[1] + 0.05])];
    poly(g, T); g.fillStyle = P.uni; g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.stroke();
    const mid = Q([o.hip[0] * 0.5 + sh[0] * 0.5, (o.hip[1] + sh[1]) / 2 + 0.05]);
    g.fillStyle = P.acc; g.fillRect(mid[0] - 0.02 * s, mid[1] - 0.12 * s, 0.04 * s, 0.24 * s);
    const glove = side > 0 ? [lsh, o.ge, o.gh] : [rsh, o.ge, o.gh], arm = side > 0 ? [rsh, o.te, o.th] : [lsh, o.te, o.th];
    limb(glove[0], glove[1], glove[2], 0.1, P.uni);
    const GH = Q(o.gh); g.fillStyle = '#7a4a22'; g.beginPath(); g.ellipse(GH[0], GH[1], 0.1 * s, 0.12 * s, 0, 0, Math.PI * 2); g.fill();
    limb(arm[0], arm[1], arm[2], 0.1, P.uni);
    const TH = Q(o.th); g.fillStyle = '#e8c39e'; g.beginPath(); g.arc(TH[0], TH[1], 0.05 * s, 0, Math.PI * 2); g.fill();
    if (p > 0.05 && p < REL_P) { g.fillStyle = '#fff'; g.beginPath(); g.arc(TH[0], TH[1], 0.04 * s, 0, Math.PI * 2); g.fill(); }
    // head and cap
    const H = Q(o.hd), hr = 0.12 * s;
    g.fillStyle = '#e8c39e'; g.beginPath(); g.arc(H[0], H[1], hr, 0, Math.PI * 2); g.fill();
    g.fillStyle = P.cap; g.beginPath(); g.arc(H[0], H[1] - hr * 0.15, hr * 1.02, Math.PI, 0); g.fill();
    g.beginPath(); g.ellipse(H[0], H[1] - hr * 0.1, hr * 0.95, hr * 0.28, 0, 0, Math.PI); g.fill();
    g.fillStyle = P.acc; g.beginPath(); g.arc(H[0], H[1] - hr * 0.6, hr * 0.22, 0, Math.PI * 2); g.fill();
  }
  function drawBatter(g, C) {
    const s = C.f / (0.4 - CAM_Z);
    const P = (x, y) => pC(C, x, y, 0.4);
    // swing progress
    let sp = 0;
    if (G.swing) sp = clamp(G.swing.t / 0.24, 0, 1);
    // only the bat and the batting gloves are drawn (seen from the batter's side), so the zone stays clear
    // hands and bat: back over the shoulder → level through the cursor → wrapped around
    const aim = G.swing && G.swing.aim ? G.swing.aim : G.aim;
    if (G.swing && !G.swing.aim) G.swing.aim = { x: G.aim.x, y: G.aim.y };
    const e = GK.ease.inOutQuad(sp);
    const hand0 = [-0.78, 1.42], hand1 = [aim.x - 0.62, aim.y + 0.02];
    const hx = sp < 0.5 ? lerp(hand0[0], hand1[0], e * 2) : lerp(hand1[0], -0.7, (e - 0.5) * 2), hy = sp < 0.5 ? lerp(hand0[1], hand1[1], e * 2) : lerp(hand1[1], 1.35, (e - 0.5) * 2);
    const ang = sp === 0 ? -1.95 : lerp(-1.95, 2.1, e);
    const L = 0.86, tip = [hx + Math.cos(ang) * L, hy + Math.sin(-ang) * L];
    const H = P(hx, hy), Tp = P(tip[0], tip[1]);
    g.lineCap = 'round';
    if (sp > 0.2 && sp < 0.75) { g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 0.22 * s; g.beginPath(); g.arc(H[0], H[1], L * s * 0.8, Math.min(-ang, 0.6) - 0.7, -ang + 0.1); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.07 * s; g.beginPath(); g.moveTo(H[0] + 4, H[1] + 6); g.lineTo(Tp[0] + 4, Tp[1] + 6); g.stroke();
    const bat = g.createLinearGradient(H[0], H[1], Tp[0], Tp[1]); bat.addColorStop(0, '#4a2f18'); bat.addColorStop(0.35, '#8a5a2e'); bat.addColorStop(1, '#e3c08a');
    g.strokeStyle = bat; g.lineWidth = 0.05 * s; g.beginPath(); g.moveTo(H[0], H[1]); g.lineTo(Tp[0], Tp[1]); g.stroke();
    g.lineWidth = 0.072 * s; g.beginPath(); const mid = P(lerp(hx, tip[0], 0.55), lerp(hy, tip[1], 0.55)); g.moveTo(mid[0], mid[1]); g.lineTo(Tp[0], Tp[1]); g.stroke();
    // gloves on the grip
    for (const k of [0, 0.11]) { const q = P(hx + Math.cos(ang) * k, hy + Math.sin(-ang) * k); g.fillStyle = '#e9e4d8'; g.beginPath(); g.arc(q[0], q[1], 0.05 * s, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#1f3a8a'; g.lineWidth = 0.014 * s; g.stroke(); }
  }
  function drawField(g, now) {
    const w = view.w, h = view.h, H = G.hit, pos = H.pos || H.sim.path[0];
    const tgt = G.camT;
    tgt[0] = lerp(tgt[0], pos[0] * 0.85, 0.06); tgt[1] = lerp(tgt[1], Math.max(2, pos[1] * 0.6), 0.06); tgt[2] = lerp(tgt[2], Math.max(55, Math.hypot(pos[0], pos[2]) * 0.92), 0.06);
    const f = h > w ? w * 1.45 : Math.min(w, h * 1.25) * 1.05;
    const C = lookCam([tgt[0] * 0.35, 24, -42], tgt, f, w, h);
    if (h > w) C.cy = h * 0.56;
    // sky + image band
    const hp = pO(C, tgt[0], 0, 600), horizon = hp ? hp[1] : h * 0.35;
    sky(g, w, h, horizon, 'bg-outfield');
    // the ground outside the lines
    const fg = [[-140, -30], [-140, 70], [0, 150], [140, 70], [140, -30]].map(([x, z]) => pO(C, x, 0, z));
    if (fg.every(Boolean)) { poly(g, fg); g.fillStyle = '#1a3d24'; g.fill(); }
    // stands with the crowd
    const ring = (r0, y0, phis) => phis.map((ph) => { const r = r0(ph); return pO(C, Math.sin(ph * D2R) * r, y0, Math.cos(ph * D2R) * r); });
    const phis = []; for (let ph = -58; ph <= 58; ph += 4) phis.push(ph);
    const lower = ring((ph) => fenceAt(Math.abs(ph) > 45 ? 45 : ph) + 1, FENCE_H, phis), upper = ring((ph) => fenceAt(Math.abs(ph) > 45 ? 45 : ph) + 34, 26, phis);
    if (lower.every(Boolean) && upper.every(Boolean)) {
      poly(g, lower.concat(upper.slice().reverse())); const st = g.createLinearGradient(0, upper[14][1], 0, lower[14][1]); st.addColorStop(0, '#0d1226'); st.addColorStop(1, '#1d2340'); g.fillStyle = st; g.fill();
      for (const d of crowdDots) { const ph = d.phi, r = fenceAt(Math.abs(ph) > 45 ? 45 : ph) + 3 + d.r * 30, y = FENCE_H + 1 + d.r * 21; const q = pO(C, Math.sin(ph * D2R) * r, y, Math.cos(ph * D2R) * r); if (!q) continue; g.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(now / 300 + d.tw)); g.fillStyle = d.c; g.fillRect(q[0], q[1], Math.max(1, q[2] * 0.5), Math.max(1, q[2] * 0.5)); }
      g.globalAlpha = 1;
    }
    // light towers
    for (const ph of [-40, -14, 14, 40]) {
      const r = fenceAt(ph) + 42, x = Math.sin(ph * D2R) * r, z = Math.cos(ph * D2R) * r;
      const b = pO(C, x, 0, z), t = pO(C, x, 44, z);
      if (!b || !t) continue;
      g.strokeStyle = '#1a2038'; g.lineWidth = Math.max(1.5, t[2] * 0.8); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(t[0], t[1]); g.stroke();
      g.fillStyle = '#fff8e0'; g.fillRect(t[0] - t[2] * 4, t[1] - t[2] * 2.5, t[2] * 8, t[2] * 3);
      g.globalCompositeOperation = 'lighter'; glow(g, t[0], t[1], Math.max(40, t[2] * 30), 0.6); g.globalCompositeOperation = 'source-over';
    }
    // field
    const G0 = (x, z) => pO(C, x, 0, z);
    const arc = []; for (let ph = -45; ph <= 45; ph += 3) arc.push(G0(Math.sin(ph * D2R) * fenceAt(ph), Math.cos(ph * D2R) * fenceAt(ph)));
    const fan = [G0(0, -6)].concat(arc);
    if (fan.every(Boolean)) {
      poly(g, fan); const gg = g.createLinearGradient(0, horizon, 0, h); gg.addColorStop(0, '#21522f'); gg.addColorStop(1, '#3f8a4a'); g.fillStyle = gg; g.fill();
      g.save(); poly(g, fan); g.clip(); g.globalAlpha = 0.07; g.fillStyle = '#fff';
      for (let r = 30; r < 125; r += 14) { const band = []; for (let ph = -46; ph <= 46; ph += 4) band.push(G0(Math.sin(ph * D2R) * r, Math.cos(ph * D2R) * r)); for (let ph = 46; ph >= -46; ph -= 4) band.push(G0(Math.sin(ph * D2R) * (r + 7), Math.cos(ph * D2R) * (r + 7))); if (band.every(Boolean)) { poly(g, band); g.fill(); } }
      g.restore(); g.globalAlpha = 1;
    }
    const dirt = []; for (let ph = -45; ph <= 45; ph += 5) dirt.push(G0(Math.sin(ph * D2R) * 29, Math.cos(ph * D2R) * 29 + 4));
    const dpoly = [G0(0, -3)].concat(dirt);
    if (dpoly.every(Boolean)) { poly(g, dpoly); g.fillStyle = '#9a6a42'; g.fill(); }
    const grass = [G0(0, 3), G0(17, 19.4), G0(0, 35.5), G0(-17, 19.4)];
    if (grass.every(Boolean)) { poly(g, grass); g.fillStyle = '#2f6e3d'; g.fill(); }
    const mnd = G0(0, MOUND); if (mnd) { g.fillStyle = '#a8764a'; g.beginPath(); g.ellipse(mnd[0], mnd[1], 2.7 * mnd[2], 2.7 * mnd[2] * 0.35, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#fff';
    for (const [x, z] of [[19.4, 19.4], [0, 38.8], [-19.4, 19.4], [0, 0]]) { const q = G0(x, z); if (q) g.fillRect(q[0] - q[2] * 0.3, q[1] - q[2] * 0.12, q[2] * 0.6, q[2] * 0.24); }
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.6;
    for (const sx of [-1, 1]) { const a = G0(0, 0), b = G0(sx * Math.sin(45 * D2R) * 100, Math.cos(45 * D2R) * 100); if (a && b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    // the fence
    const wallB = [], wallT = [];
    for (let ph = -45; ph <= 45; ph += 3) { const r = fenceAt(ph), x = Math.sin(ph * D2R) * r, z = Math.cos(ph * D2R) * r; wallB.push(pO(C, x, 0, z)); wallT.push(pO(C, x, FENCE_H, z)); }
    if (wallB.every(Boolean) && wallT.every(Boolean)) {
      poly(g, wallB.concat(wallT.slice().reverse())); g.fillStyle = '#163a2c'; g.fill();
      g.strokeStyle = '#ffd75e'; g.lineWidth = 2; g.beginPath(); wallT.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const ph of [-45, -22, 0, 22, 45]) { const r = fenceAt(ph), q = pO(C, Math.sin(ph * D2R) * r, FENCE_H * 0.5, Math.cos(ph * D2R) * r); if (q) { g.font = `800 ${Math.max(9, Math.round(q[2] * 2.4))}px ${FONT}`; g.fillText(String(Math.round(r)), q[0], q[1]); } }
      for (const sx of [-1, 1]) { const r = fenceAt(45), b = pO(C, sx * Math.sin(45 * D2R) * r, 0, Math.cos(45 * D2R) * r), t = pO(C, sx * Math.sin(45 * D2R) * r, 22, Math.cos(45 * D2R) * r); if (b && t) { g.strokeStyle = '#ffd75e'; g.lineWidth = Math.max(1.5, b[2] * 0.4); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(t[0], t[1]); g.stroke(); } }
    }
    // the ball, its shadow and trail
    const path = H.sim.path, i = H.i || 0;
    g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
    let started = false;
    for (let k = Math.max(0, i - 50); k <= i; k += 2) { const q = pO(C, path[k][0], path[k][1], path[k][2]); if (!q) continue; if (!started) { g.moveTo(q[0], q[1]); started = true; } else g.lineTo(q[0], q[1]); }
    g.stroke();
    const sh = pO(C, pos[0], 0, pos[2]);
    if (sh) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(sh[0], sh[1], Math.max(2, sh[2] * 0.25), Math.max(1, sh[2] * 0.08), 0, 0, Math.PI * 2); g.fill(); }
    const bq = pO(C, pos[0], pos[1], pos[2]);
    if (bq) { g.globalCompositeOperation = 'lighter'; glow(g, bq[0], bq[1], 26, 0.85); g.globalCompositeOperation = 'source-over'; drawBall(g, bq[0], bq[1], Math.max(4.5, bq[2] * 0.08), now); }
    // distance readout
    const dNow = Math.round(Math.hypot(pos[0], pos[2]) * 10) / 10;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${Math.round(Math.min(56, w * 0.11))}px ${FONT}`; g.lineWidth = 6; g.strokeStyle = 'rgba(6,10,28,.75)';
    const label = `${dNow.toFixed(1)} m`, ly = h * (h > w ? 0.2 : 0.16);
    g.strokeText(label, w / 2, ly); g.fillStyle = H.sim.hr && H.crossed ? '#ffd75e' : '#fff'; g.fillText(label, w / 2, ly);
    g.font = `700 13px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(`打球速度 ${Math.round(H.ev)} km/h　角度 ${Math.round(H.la)}°`, w / 2, ly + Math.min(40, w * 0.08));
  }
  function drawMsg(g) {
    const m = G.msg, w = view.w, h = view.h;
    if (m.t > 2.4) return;
    const a = Math.min(1, m.t * 5, (2.4 - m.t) * 3), sc = 1 + Math.max(0, 0.18 - m.t) * 2;
    const y = G.view === 'field' ? h * (h > w ? 0.36 : 0.36) : h * (h > w ? 0.17 : 0.2);
    g.save(); g.globalAlpha = a; g.translate(w / 2, y); g.scale(sc, sc);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${Math.round(Math.min(58, w * 0.12))}px ${SERIF}`; g.lineWidth = 7; g.strokeStyle = 'rgba(6,10,28,.8)';
    g.strokeText(m.label, 0, 0); g.fillStyle = m.color; g.fillText(m.label, 0, 0);
    if (m.sub) { g.font = `700 ${Math.round(Math.min(18, w * 0.042))}px ${FONT}`; g.lineWidth = 4; g.strokeText(m.sub, 0, Math.min(46, w * 0.1)); g.fillStyle = '#fff'; g.fillText(m.sub, 0, Math.min(46, w * 0.1)); }
    g.restore();
  }
  function firework() {
    const w = view.w, h = view.h, x = w * (0.15 + rnd() * 0.7), y = h * (0.1 + rnd() * 0.22);
    const cols = [['#ffd75e', '#ff7a59'], ['#7fe0ff', '#ffffff'], ['#ff6fa8', '#ffd75e'], ['#a78bff', '#7fe08a']][Math.floor(rnd() * 4)];
    for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2, s = (90 + rnd() * 30) * Math.min(1.4, w / 600 + 0.5); G.fw.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 1.4 + rnd() * 0.5, c: cols[i % 2] }); }
    SND.firework();
  }

  /* ---------------- HUD & screens ---------------- */
  function updateHud() {
    const R = G.run;
    if (!R) return;
    $('#hPitcher').textContent = R.P.name;
    $('#hNick').textContent = R.mode === 'stage' ? `${R.P.nick}・目標 ${R.P.target} 本` : `エンドレス・${R.P.nick}`;
    $('#hHR').textContent = R.hr;
    $('#hHRlbl').textContent = R.mode === 'stage' ? `/ ${R.P.target}` : '本';
    const dots = $('#hBalls');
    if (R.mode === 'stage') dots.innerHTML = Array.from({ length: 10 }, (_, i) => { const l = R.log.filter((x) => x.kind !== 'ball')[i]; return `<i class="${l ? l.kind : ''}"></i>`; }).join('');
    else dots.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < R.outs ? 'out' : ''}"></i>`).join('');
    $('#hBallsLbl').textContent = R.mode === 'stage' ? `残り ${10 - R.balls} 球` : `アウト ${R.outs} / 5`;
  }
  function showScreen(sel) {
    $$('.screen').forEach((s) => s.classList.toggle('on', '#' + s.id === sel));
    document.body.classList.toggle('playing', G.mode === 'play');
    if (sel === '#title') { G.mode = 'title'; refreshTitle(); music('title'); crowdOn(0.03); }
    if (sel === '#stages') { G.mode = 'stages'; renderStages(); }
  }
  let curSong = '';
  function music(n) { if (curSong === n) return; curSong = n; if (n === 'title') GK.music.play(TITLE_SONG); else if (n === 'play') GK.music.play(PLAY_SONG); else GK.music.stop(); }
  function refreshTitle() {
    const cleared = REC.stages.filter((s) => s.clear).length;
    $('#tRec').innerHTML = `<span>クリアした投手 <b>${cleared} / ${PITCHERS.length}</b></span><span>最長飛距離 <b>${REC.longest ? REC.longest + ' m' : '―'}</b></span><span>エンドレス最多 <b>${REC.endless} 本</b></span>`;
  }
  function renderStages() {
    const list = $('#stageList');
    list.innerHTML = '';
    PITCHERS.forEach((P, i) => {
      const rec = REC.stages[i], locked = i > 0 && !REC.stages[i - 1].clear;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pcard' + (locked ? ' locked' : '') + (rec.clear ? ' clear' : '');
      b.style.setProperty('--acc', P.acc);
      b.innerHTML = `<span class="pc-img"><img src="img/${P.img}.webp" alt=""></span><span class="pc-no">第${'一二三四五'[i]}戦</span><b class="pc-name">${P.name}</b><span class="pc-nick">${P.nick}</span><span class="pc-rec">${locked ? '前の投手に勝つと挑戦できます' : `目標 ${P.target} 本・最高 ${rec.best} 本${rec.clear ? '・クリア' : ''}`}</span>`;
      b.disabled = locked;
      b.addEventListener('click', () => { GK.sfx('select'); openIntro(i); });
      list.appendChild(b);
    });
  }
  function openIntro(i) {
    const P = PITCHERS[i];
    G.mode = 'intro'; G.run = null; G.introStage = i;
    Object.assign(G, { pitch: null, phase: 'idle', view: 'catcher', hit: null, swing: null, msg: null, pitchShown: 0 });
    $('#iImg').src = `img/${P.img}.webp`;
    $('#iNo').textContent = `第${'一二三四五'[i]}戦・${P.hand === 'R' ? '右投げ' : '左投げ'}${P.rel[1] < 1.6 ? '（横手）' : ''}`;
    $('#iName').textContent = P.name;
    $('#iNick').textContent = P.nick;
    $('#iMix').innerHTML = P.mix.map((m) => `<li><b>${PT[m.t].name}</b><span>${m.v[0]}〜${m.v[1]} km/h</span></li>`).join('');
    $('#iTarget').textContent = `10 球のうちホームラン ${P.target} 本以上でクリア`;
    showScreen('#intro');
  }
  $('#btnStage').addEventListener('click', () => { GK.sfx('click'); showScreen('#stages'); });
  $('#btnEndless').addEventListener('click', () => { GK.sfx('ok'); G.run = null; newRun('endless', 0); });
  $('#btnHelp').addEventListener('click', () => { GK.sfx('click'); GK.help(); });
  $('#stBack').addEventListener('click', () => { GK.sfx('click'); showScreen('#title'); });
  $('#iGo').addEventListener('click', () => { GK.sfx('ok'); newRun('stage', G.introStage); });
  $('#iBack').addEventListener('click', () => { GK.sfx('click'); showScreen('#stages'); });
  $('#rRetry').addEventListener('click', () => { GK.sfx('ok'); const R = G.run; newRun(R.mode, R.mode === 'stage' ? R.stage : 0); });
  $('#rNext').addEventListener('click', () => { GK.sfx('ok'); openIntro(G.run.stage + 1); });
  $('#rMenu').addEventListener('click', () => { GK.sfx('click'); showScreen(G.run && G.run.mode === 'stage' ? '#stages' : '#title'); });

  /* ---------------- input ---------------- */
  const pad = $('#pad');
  let padDrag = null;
  cv.style.touchAction = 'none';
  const toAim = (cx, cy) => { const C = catcherCam(), p = view.toLocal(cx, cy); return { x: ((p.x - C.cx) * PLATE_D) / C.f, y: CAM_Y - ((p.y - C.cy) * PLATE_D) / C.f }; };
  cv.addEventListener('pointermove', (e) => { if (G.mode === 'play' && e.pointerType === 'mouse') { const a = toAim(e.clientX, e.clientY); G.aim.x = a.x; G.aim.y = a.y; } });
  cv.addEventListener('pointerdown', (e) => {
    if (G.mode !== 'play') return;
    if (e.pointerType === 'mouse') { const a = toAim(e.clientX, e.clientY); G.aim.x = a.x; G.aim.y = a.y; if (e.button === 0) swing(); return; }
    swing(); // a tap on the field swings; aiming is on the pad
  });
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); padDrag = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { pad.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } pad.classList.add('on'); });
  pad.addEventListener('pointermove', (e) => {
    if (!padDrag || e.pointerId !== padDrag.id) return;
    const C = catcherCam(), k = (PLATE_D / C.f) * 1.25;
    G.aim.x += (e.clientX - padDrag.x) * k; G.aim.y -= (e.clientY - padDrag.y) * k;
    padDrag.x = e.clientX; padDrag.y = e.clientY;
  });
  const padUp = (e) => { if (padDrag && e.pointerId === padDrag.id) { padDrag = null; pad.classList.remove('on'); } };
  pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp);
  $('#swingBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); swing(); });
  addEventListener('keydown', (e) => {
    if (G.mode === 'play') {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) swing(); }
      if (e.code === 'Escape') openPause();
    }
  });
  let modalOpen = false;
  async function openPause() {
    if (G.mode !== 'play' || modalOpen) return;
    modalOpen = true; G.paused = true;
    const R = G.run;
    const v = await GK.modal({ title: '一時停止', body: `<p>${R.mode === 'stage' ? `${R.P.name} との勝負：ホームラン ${R.hr} 本・残り ${10 - R.balls} 球` : `エンドレス：ホームラン ${R.hr} 本・アウト ${R.outs}`}</p>`, buttons: [{ label: 'やめる', value: 'quit', ghost: true }, { label: 'やり直す', value: 'retry' }, { label: '再開する', value: 'resume', primary: true }] });
    modalOpen = false; G.paused = false;
    if (v === 'quit') { G.mode = 'title'; showScreen(R.mode === 'stage' ? '#stages' : '#title'); }
    else if (v === 'retry') newRun(R.mode, R.mode === 'stage' ? R.stage : 0);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) openPause(); });

  GK.init({
    id: ID, title: '夜空のアーチ',
    menu: () => { if (G.mode === 'play') openPause(); else showScreen('#title'); },
    help: `
      <p>夏の夜のナイター球場で、個性のある投手たちとホームラン競争をするバッティングゲームです。</p>
      <h3>操作</h3>
      <table>
        <tr><th>PC</th><td>マウスを動かして黄色いカーソルを合わせ、クリックでスイング。キーボードなら <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> でカーソル、<kbd>Space</kbd> でスイング</td></tr>
        <tr><th>スマホ</th><td>下の「ねらう」パッドをなぞってカーソルを動かし（指が球を隠しません）、「スイング」ボタンか画面の上のほうをタップで振ります</td></tr>
        <tr><th>一時停止</th><td><kbd>Esc</kbd> または右上のメニュー</td></tr>
      </table>
      <h3>打ち方のコツ</h3>
      <ul>
        <li>ボールがホームベースの上（白い枠のあたり）に来た瞬間にスイング。早いと引っ張り（左方向）、遅いと流し打ち（右方向）になり、ずれすぎるとファウルや空振りです。</li>
        <li>カーソルの点線の輪の中にボールが来れば当たります。中心の黄色い輪に近いほど強い打球に。</li>
        <li>カーソルをボールの<b>少し下</b>に合わせると打球が上がります。真ん中だとライナー、上を打つとゴロ、下すぎるとポップフライ。</li>
        <li>投手は球種ごとに曲がり方が違います：カーブは大きく落ち、スライダーは横に、フォークは手元で急に落ち、シュートは逆に曲がります。</li>
      </ul>
      <h3>ルール</h3>
      <ul>
        <li><b>勝負（ステージ）</b>：1 人の投手と 10 球。目標の本数のホームランでクリアし、次の投手に挑戦できます。ボール球を見送ったときは数えません。</li>
        <li><b>エンドレス</b>：ホームラン以外（ヒット・ファウル・空振り・見逃しストライク）が 5 つでアウト終了。ホームラン 4 本ごとに投手が交代し、少しずつ手ごわくなります。</li>
        <li>外野のフェンスは両翼 100 m・中堅 122 m・高さ 4 m。フェンスを越えればホームランです。</li>
        <li>最長飛距離・投手ごとの最多本数・エンドレスの最多本数を記録します。</li>
      </ul>`,
  });

  /* ---------------- loop ---------------- */
  GK.loop((dt, t) => {
    if (G.mode === 'play' && !G.paused) for (let k = 0; k < (DBG.speed || 1); k++) update(dt);
    for (let j = 0, i = 0; i < G.fw.length; i++) { const p = G.fw[i]; p.t += dt; if (p.t < p.life) { p.vx *= 1 - 1.4 * dt; p.vy = p.vy * (1 - 1.4 * dt) + 40 * dt; p.x += p.vx * dt; p.y += p.vy * dt; G.fw[j++] = p; } if (i === G.fw.length - 1) G.fw.length = j; }
    render(performance.now());
  });
  const ready = GK.loadImages(['bg-plate', 'bg-outfield', ...PITCHERS.map((p) => p.img)]);
  showScreen('#title');

  /* ---------------- self-test (npm run game-check) ---------------- */
  window.__homerun = { G, DBG, PITCHERS, simulate, newRun, swing };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const shot = (n) => (window.__shot ? window.__shot(n) : null);
    const until = async (fn, ms) => { const t0 = performance.now(); while (!fn() && performance.now() - t0 < ms) await GK.wait(40); return fn(); };
    try {
      await ready;
      // physics sanity: a perfect swing carries far, a weak one does not
      const big = simulate(168, 28, 0), weak = simulate(110, 12, 0), foul = simulate(150, 25, 60);
      if (!big.hr || big.dist < 125 || weak.hr || !foul.foul) { ok = false; notes.push(`physics: big ${big.dist}m hr=${big.hr}, weak ${weak.dist}m, foul=${foul.foul}`); }
      notes.push(`perfect-contact carry ${big.dist} m`);
      await shot('title');
      showScreen('#stages'); await GK.wait(200); await shot('stages');
      openIntro(0); await GK.wait(200); await shot('intro');
      // a stage played by the auto-batter (perfect contact on strikes)
      DBG.auto = true; DBG.perfect = true;
      newRun('stage', 0);
      await until(() => G.phase === 'pitch', 4000);
      await GK.wait(Math.max(50, (G.pitch.T - 0.25) * 1000));
      await shot('pitch');
      await until(() => G.view === 'field', 4000);
      await GK.wait(1300);
      await shot('flight');
      DBG.speed = 4;
      if (!(await until(() => G.mode === 'result', 90000))) { ok = false; notes.push('stage did not end'); }
      const R = G.run;
      notes.push(`auto-batter: ${R.hr} HR of ${R.balls}, longest ${R.longest} m`);
      if (R.hr < R.P.target) { ok = false; notes.push('auto-batter did not clear stage 1'); }
      await shot('result');
    } catch (e) { ok = false; notes.push('error: ' + (e && e.stack || e)); }
    DBG.auto = false; DBG.perfect = false; DBG.speed = 1;
    showScreen('#title');
    return { ok, notes };
  };
})();
