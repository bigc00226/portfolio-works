/* 宵宮ビート — 祭り囃子の 4 レーン音楽ゲーム（matsuri-rhythm）。曲・楽器・譜面は songs.js（window.MB） */
(() => {
  'use strict';
  const ID = 'matsuri-rhythm';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clamp = GK.clamp;
  const SONGS = MB.SONGS;
  const DIFF = ['かんたん', 'ふつう', 'むずかしい'];
  const JW = [0.035, 0.07, 0.11, 0.15]; // 極 優 良 可 (seconds, ±)
  const JNAME = ['極', '優', '良', '可', '失'];
  const JCOL = ['#ffd75e', '#ff9a5c', '#7fe08a', '#8fb6ff', '#9a9aa8'];
  const PTS = [1, 0.85, 0.55, 0.25, 0];
  const HOLD_GRACE = 0.12;
  const LANE_COL = ['#e23a3a', '#f3e6c4', '#f3e6c4', '#e23a3a'];
  const KEYMAP = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
  const RANKS = [[980000, '大吉', '申し分なし。今宵の主役です'], [930000, '中吉', '見事な腕前、祭りが沸いています'], [880000, '小吉', 'いい調子。あと少しで中吉'], [800000, '吉', '踊りの輪に乗れています'], [700000, '末吉', 'まずまず。次はもっと上へ'], [0, '凶', '次はきっと大吉。速さの設定も試してみて']];
  const rankOf = (s) => RANKS.find((r) => s >= r[0]);

  const SET = { speed: GK.store.get('speed', 3.5, ID), offset: GK.store.get('offset', 0, ID), tap: GK.store.get('tap', true, ID) };
  const FONTS = { serif: '"Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif', sans: '"Yu Gothic UI","Yu Gothic","Hiragino Sans",Meiryo,sans-serif' };
  const G = { mode: 'select', paused: false, simT: 0, fx: [], sparks: [], fw: [], lastBar: -1, flash: [0, 0, 0, 0], down: [0, 0, 0, 0], comboPop: 0 };
  const DBG = { fast: false, auto: false, rate: 1 };
  const best = (song, d) => GK.store.get(`best:${song.id}:${d}`, null);

  /* ---------------- judge engine (shared by play, autoplay and the self-test) ---------------- */
  function Engine(chart, onJudge) {
    const notes = chart.notes.map((n) => Object.assign({}, n, { j: -1, tj: -1, holding: false }));
    const E = { notes, units: chart.units, counts: [0, 0, 0, 0, 0], pts: 0, combo: 0, maxCombo: 0, first: 0, held: [null, null, null, null], judged: 0, fast: 0, slow: 0 };
    E.score = () => Math.floor((1e6 * E.pts) / E.units + 1e-6);
    function apply(n, k, tail, dt) {
      E.counts[k]++; E.pts += PTS[k]; E.judged++;
      if (k === 4) E.combo = 0; else { E.combo++; if (E.combo > E.maxCombo) E.maxCombo = E.combo; }
      if (k > 0 && k < 4 && !tail) { if (dt < 0) E.fast++; else E.slow++; }
      if (onJudge) onJudge(n, k, tail, dt);
    }
    E.press = (lane, T) => {
      let hit = null;
      for (let i = E.first; i < notes.length; i++) {
        const n = notes[i];
        if (n.t - T > JW[3]) break;
        if (n.lane !== lane || n.j >= 0) continue;
        if (Math.abs(n.t - T) <= JW[3]) { hit = n; break; }
      }
      if (!hit) return null;
      const dt = T - hit.t, a = Math.abs(dt), k = a <= JW[0] ? 0 : a <= JW[1] ? 1 : a <= JW[2] ? 2 : 3;
      hit.j = k; apply(hit, k, false, dt);
      if (hit.len) { hit.holding = true; E.held[lane] = hit; }
      return hit;
    };
    E.release = (lane, T) => {
      const n = E.held[lane];
      if (!n) return;
      E.held[lane] = null; n.holding = false;
      if (n.tj >= 0) return;
      n.tj = T >= n.te - HOLD_GRACE ? 0 : 4;
      apply(n, n.tj, true, 0);
    };
    E.tick = (T) => {
      for (let i = E.first; i < notes.length; i++) {
        const n = notes[i];
        if (n.t - T > JW[3]) break;
        if (n.j < 0 && T - n.t > JW[3]) { n.j = 4; apply(n, 4, false, 0); if (n.len) { n.tj = 4; apply(n, 4, true, 0); } }
      }
      for (let l = 0; l < 4; l++) { const n = E.held[l]; if (n && T >= n.te) { E.held[l] = null; n.holding = false; n.tj = 0; apply(n, 0, true, 0); } }
      while (E.first < notes.length) { const n = notes[E.first]; if (n.j >= 0 && (!n.len || n.tj >= 0)) E.first++; else break; }
    };
    E.done = () => E.judged >= E.units;
    return E;
  }
  function simulate(chart) {
    const E = Engine(chart), evs = [];
    for (const n of chart.notes) { evs.push([n.t, 0, n.lane]); if (n.len) evs.push([n.te, 1, n.lane]); }
    evs.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    for (const [t, type, lane] of evs) { E.tick(t); if (type === 0) E.press(lane, t); else E.release(lane, t); }
    E.tick(1e9);
    return E;
  }

  /* ---------------- audio clock ---------------- */
  let actx = null, bus = null, schedTimer = 0;
  function audioStart() {
    actx = GK.audio();
    if (!actx) return false;
    audioStop();
    bus = actx.createGain(); bus.gain.value = 0.9; bus.connect(GK.audioOut('master'));
    clearInterval(schedTimer); schedTimer = setInterval(schedule, 30);
    return true;
  }
  function audioStop() { if (bus) { try { bus.disconnect(); } catch (e) { /* gone */ } bus = null; } }
  /** the audio clock's time that is being heard at performance time `perf` (output latency included) */
  function heard(perf) {
    const p = perf == null ? performance.now() : perf;
    if (!actx) return p / 1000;
    if (actx.getOutputTimestamp) { const ts = actx.getOutputTimestamp(); if (ts && ts.performanceTime > 0 && ts.contextTime > 0) return ts.contextTime + (p - ts.performanceTime) / 1000; }
    return actx.currentTime - (actx.outputLatency || actx.baseLatency || 0) + (p - performance.now()) / 1000;
  }
  function songTime(perf) {
    if (DBG.fast) return G.simT;
    return heard(perf) - G.t0 - SET.offset / 1000;
  }
  function schedule() {
    if (!bus || !actx) return;
    const now = actx.currentTime;
    const src = G.preview || (G.mode === 'play' && !G.paused && !DBG.fast ? G : null);
    if (!src || !src.song) return;
    const ev = src.song.events;
    while (src.si < ev.length && src.t0 + ev[src.si].t < now + 0.3) {
      const e = ev[src.si++], at = src.t0 + e.t;
      if (src.until != null && e.t > src.until) { src.si = ev.length; break; }
      if (at >= now - 0.02) MB.play(actx, bus, e, Math.max(at, now));
    }
    if (G.preview && G.preview.si >= ev.length && now > G.preview.t0 + G.preview.until + 1) stopPreview();
  }
  function tapSound() {
    if (!SET.tap || GK.muted) return;
    GK.noise({ d: 0.03, v: 0.12, f: 1900, q: 2 });
    GK.tone({ f: 520, f2: 300, d: 0.05, type: 'sine', v: 0.14 });
  }

  /* ---------------- play ---------------- */
  function startPlay(si, d) {
    stopPreview();
    const song = SONGS[si];
    G.si_song = si; G.diff = d; G.song = song; G.chart = song.charts[d];
    G.E = Engine(G.chart, onJudge);
    G.fx = []; G.sparks = []; G.fw = []; G.lastBar = -1; G.comboPop = 0; G.down = [0, 0, 0, 0]; G.flash = [0, 0, 0, 0];
    G.endT = Math.max(song.length, G.chart.notes.length ? G.chart.notes[G.chart.notes.length - 1].te : 0) + 1.6;
    G.mode = 'play'; G.paused = false; G.si = 0;
    pointers.clear();
    if (DBG.fast) { G.simT = -1.5; } else { audioStart(); G.t0 = (actx ? actx.currentTime : 0) + 1.6; }
    $('#hTitle').textContent = song.title;
    $('#hDiff').textContent = `${DIFF[d]}　Lv ${G.chart.level}`;
    $('#hud').style.setProperty('--c', song.color);
    G.intro = 0;
    showScreen(null);
  }
  function onJudge(n, k, tail, dt) {
    const now = performance.now();
    if (!tail || k === 4) G.fx.push({ lane: n.lane, k, t: now, fs: k > 0 && k < 4 && !tail ? (dt < 0 ? 'はやい' : 'おそい') : '' });
    if (k < 3) {
      const M = geom(), x = M.LX + (n.lane + 0.5) * M.laneW, cols = k === 0 ? ['#ffe27a', '#fff', '#ff9a5c'] : ['#fff', LANE_COL[n.lane], '#ffd75e'];
      const cnt = tail ? 10 : k === 0 ? 16 : 10;
      for (let i = 0; i < cnt; i++) { const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 220; G.sparks.push({ x, y: M.judge, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, t: 0, life: 0.45 + Math.random() * 0.3, c: cols[i % cols.length] }); }
    }
    if (k < 4) { G.comboPop = 1; if (G.E.combo && G.E.combo % 50 === 0) firework(true); }
  }
  function press(l, perf) {
    G.down[l]++; G.flash[l] = performance.now();
    if (G.mode !== 'play' || G.paused) return;
    tapSound();
    G.E.press(l, songTime(perf));
  }
  function release(l, perf) {
    G.down[l] = Math.max(0, G.down[l] - 1);
    if (G.down[l] > 0 || G.mode !== 'play' || G.paused) return;
    G.E.release(l, songTime(perf));
  }
  function updatePlay(dt) {
    if (DBG.fast) G.simT += dt * DBG.rate;
    else schedule();
    const T = songTime(), E = G.E;
    if (DBG.auto) {
      for (let i = E.first; i < E.notes.length; i++) {
        const n = E.notes[i];
        if (n.t > T) break;
        if (n.j < 0) { E.press(n.lane, n.t); G.flash[n.lane] = performance.now(); }
      }
    }
    E.tick(T);
    const bar = Math.floor(T / (G.song.st * 16));
    if (bar !== G.lastBar && T > 0) { G.lastBar = bar; if (bar % 2 === 0) firework(false); }
    G.T = T;
    if (T > G.endT) finishPlay();
  }
  function finishPlay() {
    const E = G.E, song = G.song, d = G.diff, score = E.score();
    G.mode = 'result';
    audioStop();
    const r = rankOf(score), fc = E.counts[4] === 0, ap = fc && E.counts[0] === E.units;
    const prev = best(song, d);
    const isNew = !DBG.auto && (!prev || score > prev.score);
    if (isNew) GK.store.set(`best:${song.id}:${d}`, { score, rank: r[1], fc: fc || (prev && prev.fc) || false, ap: ap || (prev && prev.ap) || false });
    else if (!DBG.auto && prev && ((fc && !prev.fc) || (ap && !prev.ap))) GK.store.set(`best:${song.id}:${d}`, Object.assign(prev, { fc: prev.fc || fc, ap: prev.ap || ap }));
    $('#rSong').textContent = `${song.title}　${DIFF[d]}（Lv ${G.chart.level}）`;
    $('#rRank').textContent = r[1];
    $('#rRankNote').textContent = r[2];
    $('#rScore').textContent = GK.fmt(score);
    $('#rNew').hidden = !isNew;
    $('#rFC').hidden = !fc || ap;
    $('#rAP').hidden = !ap;
    E.counts.forEach((c, i) => ($('#rj' + i).textContent = GK.fmt(c)));
    $('#rCombo').textContent = GK.fmt(E.maxCombo);
    $('#rFS').textContent = `はやい ${E.fast} ／ おそい ${E.slow}`;
    $('#result').dataset.rank = r[1];
    showScreen('#result');
    const good = score >= 880000;
    [0, 0.12, 0.24, 0.42].forEach((at, i) => GK.tone({ f: good ? [784, 988, 1175, 1568][i] : [523, 587, 659, 523][i], d: i === 3 ? 0.5 : 0.14, type: 'triangle', v: 0.2, at }));
    GK.noise({ d: 0.2, v: 0.2, f: 6000, filter: 'highpass', at: 0.42 });
  }
  function firework(big) {
    const M = geom(), x = M.w * (0.12 + Math.random() * 0.76), y = M.h * (0.12 + Math.random() * 0.25);
    const cols = [['#ffd75e', '#ff7a59'], ['#7fe0ff', '#ffffff'], ['#ff6fa8', '#ffd75e'], ['#a78bff', '#7fe08a']][Math.floor(Math.random() * 4)];
    const n = big ? 60 : 36, sp = big ? 170 : 120;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, s = sp * (0.85 + Math.random() * 0.3); G.fw.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 1.3 + Math.random() * 0.4, c: cols[i % 2] }); }
  }

  /* ---------------- pause ---------------- */
  let modalOpen = false;
  async function openPause() {
    if (G.mode !== 'play' || G.paused || modalOpen) return;
    G.paused = true; G.pausedAt = songTime(); audioStop(); modalOpen = true;
    pointers.clear(); G.down = [0, 0, 0, 0];
    const v = await GK.modal({ title: '一時停止', body: `<p>${G.song.title}（${DIFF[G.diff]}）　いまの得点 ${GK.fmt(G.E.score())}</p><p>再開すると、少し前から曲が戻って始まります。</p>`, buttons: [{ label: '曲選びへ', value: 'back', ghost: true }, { label: 'やり直す', value: 'retry' }, { label: '再開する', value: 'resume', primary: true }] });
    modalOpen = false;
    if (v === 'back') { G.mode = 'select'; showScreen('#select'); return; }
    if (v === 'retry') { startPlay(G.si_song, G.diff); return; }
    // resume 1.2 s before the pause point
    const back = 1.2;
    if (DBG.fast) G.simT = G.pausedAt - back;
    else {
      audioStart();
      G.t0 = heard() - SET.offset / 1000 - (G.pausedAt - back) + 0.3;
      const ev = G.song.events, from = G.pausedAt - back + 0.25;
      G.si = ev.findIndex((e) => e.t >= from); if (G.si < 0) G.si = ev.length;
    }
    G.paused = false;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.mode === 'play') openPause(); stopPreview(); } });

  /* ---------------- preview on the song select ---------------- */
  function startPreview(i) {
    if (G.preview && G.preview.idx === i) { stopPreview(); return; }
    if (!audioStart()) return;
    const song = SONGS[i], formBars = song.form.map((f) => song.sections[f].mel.length);
    const bIdx = song.form.indexOf('B') >= 0 ? song.form.indexOf('B') : 1;
    const startBar = formBars.slice(0, bIdx).reduce((a, b) => a + b, 0), from = startBar * 16 * song.st;
    G.preview = { idx: i, song, t0: actx.currentTime + 0.15 - from, si: song.events.findIndex((e) => e.t >= from), until: from + 8 * 16 * song.st };
    $$('.song').forEach((el, k) => el.classList.toggle('playing', k === i));
  }
  function stopPreview() {
    if (!G.preview) return;
    G.preview = null; audioStop();
    $$('.song').forEach((el) => el.classList.remove('playing'));
  }

  /* ---------------- canvas ---------------- */
  const cv = $('#cv');
  const view = GK.fit(cv);
  function geom() {
    const w = view.w, h = view.h;
    const laneW = Math.min(108, (w * 0.94) / 4, h * 0.2), LW = laneW * 4, LX = (w - LW) / 2;
    const top = Math.max(58, h * 0.075);
    const judge = h - Math.max(92, Math.min(150, h * 0.17));
    return { w, h, laneW, LW, LX, top, judge };
  }
  const sprites = new Map();
  function lantern(size, col, small) {
    const dpr = view.dpr || 1, key = `${size.toFixed(1)}|${col}|${dpr}|${small ? 1 : 0}`;
    let c = sprites.get(key);
    if (c) return c;
    const pad = size * 0.35, W = size + pad * 2;
    c = document.createElement('canvas'); c.width = c.height = Math.ceil(W * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr); g.translate(W / 2, W / 2);
    const rx = size * 0.46, ry = size * 0.34, red = col === LANE_COL[0];
    if (!small) { const gl = g.createRadialGradient(0, 0, size * 0.15, 0, 0, size * 0.8); gl.addColorStop(0, red ? 'rgba(255,120,80,.55)' : 'rgba(255,220,150,.5)'); gl.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gl; g.fillRect(-W / 2, -W / 2, W, W); }
    const body = g.createLinearGradient(-rx, 0, rx, 0);
    if (red) { body.addColorStop(0, '#8e1a1f'); body.addColorStop(0.5, '#ff6a4f'); body.addColorStop(1, '#8e1a1f'); }
    else { body.addColorStop(0, '#c9a46a'); body.addColorStop(0.5, '#fff8e6'); body.addColorStop(1, '#c9a46a'); }
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = body; g.fill();
    g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.clip();
    if (!red) { g.fillStyle = 'rgba(214,58,50,.85)'; g.fillRect(-rx, -ry * 0.18, rx * 2, ry * 0.36); }
    g.strokeStyle = red ? 'rgba(60,0,0,.35)' : 'rgba(120,80,30,.35)'; g.lineWidth = Math.max(1, size * 0.025);
    for (const k of [-0.66, -0.33, 0.33, 0.66]) { const y = k * ry; g.beginPath(); g.moveTo(-rx, y); g.quadraticCurveTo(0, y + ry * 0.14 * Math.sign(k), rx, y); g.stroke(); }
    if (red) { g.fillStyle = 'rgba(255,244,220,.92)'; g.beginPath(); g.arc(0, 0, ry * 0.42, 0, Math.PI * 2); g.fill(); }
    g.restore();
    g.fillStyle = '#1d1414';
    const cw = rx * 0.95, ch = size * 0.1;
    g.beginPath(); g.roundRect(-cw / 2, -ry - ch * 0.7, cw, ch, ch * 0.3); g.fill();
    g.beginPath(); g.roundRect(-cw / 2, ry - ch * 0.3, cw, ch, ch * 0.3); g.fill();
    c.size = W;
    sprites.set(key, c);
    return c;
  }
  function blit(g, c, x, y, rot = 0, alpha = 1) {
    const W = c.size;
    g.save(); g.globalAlpha = alpha; g.translate(x, y); if (rot) g.rotate(rot); g.drawImage(c, -W / 2, -W / 2, W, W); g.restore();
  }

  function render() {
    view.clear();
    if (G.mode !== 'play' && G.mode !== 'result') return;
    const g = view.ctx, M = geom(), T = G.T || 0, now = performance.now();
    // background
    g.fillStyle = '#120e22'; g.fillRect(0, 0, M.w, M.h);
    const img = GK.images['bg-stage'];
    if (img && img.width) { const s = Math.max(M.w / img.width, M.h / img.height); g.globalAlpha = 0.55; g.drawImage(img, (M.w - img.width * s) / 2, (M.h - img.height * s) / 2, img.width * s, img.height * s); g.globalAlpha = 1; }
    const sh = g.createLinearGradient(0, 0, 0, M.h); sh.addColorStop(0, 'rgba(18,14,34,.15)'); sh.addColorStop(1, 'rgba(10,8,18,.75)'); g.fillStyle = sh; g.fillRect(0, 0, M.w, M.h);
    // fireworks (behind the lanes)
    g.globalCompositeOperation = 'lighter';
    for (const p of G.fw) { const a = 1 - p.t / p.life; g.globalAlpha = Math.max(0, a); g.fillStyle = p.c; g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // lanes
    const beat = G.song ? 60 / G.song.bpm : 0.5, bp = T > 0 ? 1 - ((T / beat) % 1) : 0;
    g.fillStyle = 'rgba(12,9,24,.62)'; g.fillRect(M.LX, M.top, M.LW, M.h - M.top);
    for (let l = 0; l < 4; l++) {
      const x = M.LX + l * M.laneW, held = G.down[l] > 0 || (G.E && G.E.held[l]), fl = Math.max(0, 1 - (now - G.flash[l]) / 180);
      if (held || fl > 0) { const gr = g.createLinearGradient(0, M.judge, 0, M.top); gr.addColorStop(0, l % 3 === 0 ? 'rgba(255,90,70,.38)' : 'rgba(255,220,150,.32)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.globalAlpha = held ? 1 : fl; g.fillStyle = gr; g.fillRect(x, M.top, M.laneW, M.judge - M.top); g.globalAlpha = 1; }
    }
    g.strokeStyle = `rgba(226,181,74,${0.22 + bp * 0.18})`; g.lineWidth = 1;
    for (let l = 0; l <= 4; l++) { const x = Math.round(M.LX + l * M.laneW) + 0.5; g.beginPath(); g.moveTo(x, M.top); g.lineTo(x, M.h); g.stroke(); }
    // bar lines
    const lead = 4 / SET.speed, pps = (M.judge - M.top) / lead;
    if (G.song) {
      const barT = G.song.st * 16;
      g.strokeStyle = 'rgba(255,240,210,.14)';
      for (let k = Math.max(0, Math.floor(T / barT)); k * barT < T + lead; k++) { const y = M.judge - (k * barT - T) * pps; if (y < M.top || y > M.judge) continue; g.beginPath(); g.moveTo(M.LX, y); g.lineTo(M.LX + M.LW, y); g.stroke(); }
    }
    // the string of lanterns over the lanes
    drawString(g, M, T, beat);
    if (M.LX > 230 && G.song) drawPanels(g, M);
    // notes
    const size = M.laneW * 0.7;
    if (G.E) {
      const notes = G.E.notes;
      g.save(); g.beginPath(); g.rect(M.LX, M.top, M.LW, M.h - M.top); g.clip();
      for (let i = G.E.first; i < notes.length; i++) {
        const n = notes[i];
        const y = M.judge - (n.t - T) * pps;
        if (y < M.top - size) break;
        const x = M.LX + (n.lane + 0.5) * M.laneW;
        if (n.len) {
          if (n.tj >= 0) continue;
          const yt = M.judge - (n.te - T) * pps, yh = n.holding ? M.judge : y, dead = n.j === 4;
          const bw = size * 0.36, top = Math.max(yt, M.top - 10);
          if (yh > top) {
            const gr = g.createLinearGradient(0, top, 0, yh);
            const c0 = n.lane % 3 === 0 ? '255,96,72' : '255,226,160';
            gr.addColorStop(0, `rgba(${c0},${dead ? 0.12 : 0.25})`); gr.addColorStop(1, `rgba(${c0},${dead ? 0.2 : n.holding ? 0.85 : 0.6})`);
            g.fillStyle = gr; g.fillRect(x - bw / 2, top, bw, yh - top);
            g.strokeStyle = `rgba(40,20,10,${dead ? 0.3 : 0.7})`; g.lineWidth = 1.5; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(x, top); g.lineTo(x, yh); g.stroke(); g.setLineDash([]);
            if (n.holding) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 1.5, top, 3, yh - top); }
          }
          if (yt > M.top - 10) { g.fillStyle = dead ? '#3a3238' : '#1d1414'; g.beginPath(); g.roundRect(x - size * 0.22, yt - size * 0.06, size * 0.44, size * 0.12, 3); g.fill(); }
          if (n.j < 0 || n.holding) blit(g, lantern(size, LANE_COL[n.lane]), x, yh, n.holding ? Math.sin(now / 90) * 0.06 : 0);
          else if (dead) blit(g, lantern(size, LANE_COL[n.lane]), x, y, 0, 0.3);
          continue;
        }
        if (n.j >= 0) continue;
        blit(g, lantern(size, LANE_COL[n.lane]), x, y);
      }
      g.restore();
    }
    // judge beam and drums
    const beamY = M.judge;
    const wood = g.createLinearGradient(0, beamY - 7, 0, beamY + 7); wood.addColorStop(0, '#8a5a2e'); wood.addColorStop(0.5, '#c58a4a'); wood.addColorStop(1, '#5a3618');
    g.fillStyle = wood; g.fillRect(M.LX - 10, beamY - 6, M.LW + 20, 12);
    for (let l = 0; l < 4; l++) {
      const x = M.LX + (l + 0.5) * M.laneW, r = M.laneW * 0.36, pressed = G.down[l] > 0, fl = Math.max(0, 1 - (now - G.flash[l]) / 160), s = pressed ? 0.92 : 1 - fl * 0.06;
      g.save(); g.translate(x, beamY); g.scale(s, s);
      g.fillStyle = '#5a1414'; g.beginPath(); g.arc(0, 0, r + 4, 0, Math.PI * 2); g.fill();
      const skin = g.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); skin.addColorStop(0, '#fff7e6'); skin.addColorStop(1, '#d9c39a');
      g.fillStyle = skin; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e8c56a'; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * (r + 2), Math.sin(a) * (r + 2), 1.5, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = 'rgba(160,40,30,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r * 0.45, 0, Math.PI * 2); g.stroke();
      if (fl > 0 || pressed) { g.globalAlpha = pressed ? 0.6 : fl; g.strokeStyle = l % 3 === 0 ? '#ff7a59' : '#ffe2a0'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r + 8 + (1 - fl) * 10, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
      g.restore();
      if (!GK.isTouch) { g.fillStyle = 'rgba(255,240,215,.7)'; g.font = `700 12px ${FONTS.sans}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('DFJK'[l], x, beamY + r + 10); }
    }
    // sparks
    g.globalCompositeOperation = 'lighter';
    for (const p of G.sparks) { const a = 1 - p.t / p.life; g.globalAlpha = Math.max(0, a); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 2.2 * a + 0.8, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // judgement words
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const font = FONTS.serif;
    for (const f of G.fx) {
      const age = (now - f.t) / 1000; if (age > 0.5) continue;
      const x = M.LX + (f.lane + 0.5) * M.laneW, y = M.judge - M.laneW * 0.75 - age * 40, a = Math.min(1, (0.5 - age) * 4);
      g.globalAlpha = a; g.font = `800 ${Math.round(M.laneW * 0.34 * (1 + Math.max(0, 0.15 - age) * 2))}px ${font}`;
      g.lineWidth = 4; g.strokeStyle = 'rgba(20,10,20,.85)'; g.strokeText(JNAME[f.k], x, y); g.fillStyle = JCOL[f.k]; g.fillText(JNAME[f.k], x, y);
      if (f.fs) { g.font = `700 ${Math.round(M.laneW * 0.13)}px ${FONTS.sans}`; g.fillStyle = f.fs === 'はやい' ? '#8fd0ff' : '#ffb08f'; g.strokeText(f.fs, x, y + M.laneW * 0.26); g.fillText(f.fs, x, y + M.laneW * 0.26); }
    }
    g.globalAlpha = 1;
    // combo
    if (G.E && G.E.combo >= 3) {
      const cy = M.top + (M.judge - M.top) * 0.34, sc = 1 + G.comboPop * 0.18;
      g.save(); g.translate(M.w / 2, cy); g.scale(sc, sc);
      g.globalAlpha = 0.8; g.font = `800 ${Math.round(Math.min(64, M.laneW * 0.62))}px ${font}`; g.fillStyle = '#fff4dc'; g.lineWidth = 5; g.strokeStyle = 'rgba(80,20,20,.6)';
      g.strokeText(String(G.E.combo), 0, 0); g.fillText(String(G.E.combo), 0, 0);
      g.font = `700 13px ${FONTS.sans}`; g.fillStyle = '#ffd75e'; g.fillText('コンボ', 0, Math.min(40, M.laneW * 0.42));
      g.restore(); g.globalAlpha = 1;
    }
    // the song's title card at the start
    if (G.mode === 'play' && T < 1.2 && G.song) {
      const a = clamp(Math.min((T + 1.6) * 2, (1.2 - T) * 2), 0, 1), cy = M.top + (M.judge - M.top) * 0.45;
      g.globalAlpha = a; g.fillStyle = 'rgba(12,9,24,.75)'; g.fillRect(M.LX, cy - 40, M.LW, 80);
      g.fillStyle = '#fff4dc'; g.font = `800 ${Math.round(Math.min(30, M.LW / 11))}px ${font}`; g.fillText(G.song.title, M.w / 2, cy - 8);
      g.font = `600 13px ${FONTS.sans}`; g.fillStyle = '#ffd75e'; g.fillText(`${DIFF[G.diff]}　Lv ${G.chart.level}　BPM ${G.song.bpm}`, M.w / 2, cy + 22);
      g.globalAlpha = 1;
    }
  }
  /** wide screens: the song on the left, the live judgement counts on the right */
  function drawPanels(g, M) {
    const song = G.song, E = G.E, jw = Math.min(220, M.LX - 90, (M.judge - M.top) * 0.42), xr = M.LX - 46, y0 = M.top + 50;
    const img = GK.images[song.jacket];
    g.save();
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18;
    if (img && img.width) g.drawImage(img, xr - jw, y0, jw, jw);
    g.shadowBlur = 0;
    g.strokeStyle = song.color; g.lineWidth = 3; g.strokeRect(xr - jw, y0, jw, jw);
    g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillStyle = '#fff4dc'; g.font = `800 ${Math.round(Math.min(26, jw / 7))}px ${FONTS.serif}`; g.fillText(song.title, xr, y0 + jw + 16);
    g.fillStyle = '#ffd75e'; g.font = `700 13px ${FONTS.sans}`; g.fillText(`${DIFF[G.diff]}　Lv ${G.chart.level}`, xr, y0 + jw + 52);
    g.fillStyle = 'rgba(251,241,223,.6)'; g.font = `500 12px ${FONTS.sans}`; g.fillText(`${song.mood}　BPM ${song.bpm}`, xr, y0 + jw + 74);
    const xl = M.LX + M.LW + 46, rowH = Math.min(40, (M.judge - y0) / 8);
    g.textAlign = 'left'; g.textBaseline = 'middle';
    JNAME.forEach((nm, k) => {
      const y = y0 + 14 + k * rowH;
      g.fillStyle = JCOL[k]; g.font = `900 ${Math.round(rowH * 0.62)}px ${FONTS.serif}`; g.fillText(nm, xl, y);
      g.fillStyle = '#fbf1df'; g.font = `700 ${Math.round(rowH * 0.5)}px ${FONTS.sans}`; g.fillText(GK.fmt(E.counts[k]), xl + rowH * 1.1, y);
    });
    const yc = y0 + 14 + 5.4 * rowH;
    g.fillStyle = 'rgba(251,241,223,.6)'; g.font = `600 12px ${FONTS.sans}`; g.fillText('最大コンボ', xl, yc);
    g.fillStyle = '#fbf1df'; g.font = `800 ${Math.round(rowH * 0.6)}px ${FONTS.sans}`; g.fillText(GK.fmt(E.maxCombo), xl, yc + rowH * 0.7);
    g.restore();
  }
  function drawString(g, M, T, beat) {
    const y0 = M.top - 2, sag = 12, n = Math.max(5, Math.round(M.w / 86));
    const cy = (x) => y0 + sag * 4 * (x / M.w) * (1 - x / M.w);
    g.strokeStyle = 'rgba(30,16,10,.9)'; g.lineWidth = 1.5; g.beginPath();
    for (let x = 0; x <= M.w; x += 12) { if (x === 0) g.moveTo(x, cy(x)); else g.lineTo(x, cy(x)); }
    g.stroke();
    const ph = T > 0 ? (T / beat) * Math.PI : performance.now() / 600;
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) * M.w) / n, y = cy(x);
      g.save(); g.translate(x, y); g.rotate(Math.sin(ph + i * 0.8) * 0.07);
      g.strokeStyle = 'rgba(30,16,10,.9)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 6); g.stroke();
      blit(g, lantern(20, i % 2 ? LANE_COL[1] : LANE_COL[0], true), 0, 16);
      g.restore();
    }
  }

  /* ---------------- input ---------------- */
  const pointers = new Map();
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', (e) => {
    if (G.mode !== 'play') return;
    const M = geom(), p = view.toLocal(e.clientX, e.clientY);
    const l = clamp(Math.floor((p.x - M.LX) / M.laneW), 0, 3);
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    pointers.set(e.pointerId, l);
    press(l, e.timeStamp);
  });
  const up = (e) => { if (!pointers.has(e.pointerId)) return; const l = pointers.get(e.pointerId); pointers.delete(e.pointerId); release(l, e.timeStamp); };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  addEventListener('keydown', (e) => {
    if (G.mode === 'calib') { if (!e.repeat && !/^(Escape|Tab)$/.test(e.code)) { e.preventDefault(); calibTap(e.timeStamp); } return; }
    if (G.mode !== 'play' || modalOpen) return;
    if (e.code === 'Escape') { e.preventDefault(); openPause(); return; }
    const l = KEYMAP[e.code];
    if (l == null) return;
    e.preventDefault();
    if (e.repeat) return;
    press(l, e.timeStamp);
  });
  addEventListener('keyup', (e) => { const l = KEYMAP[e.code]; if (l != null && G.mode === 'play') release(l, e.timeStamp); });

  /* ---------------- screens ---------------- */
  function showScreen(sel) {
    $$('.screen').forEach((s) => s.classList.toggle('on', '#' + s.id === sel));
    document.body.classList.toggle('playing', G.mode === 'play' || G.mode === 'result');
    if (sel === '#select') { G.mode = 'select'; renderSelect(); }
  }
  function fmtTime(s) { s = Math.round(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  function renderSelect() {
    const list = $('#songList');
    list.innerHTML = '';
    SONGS.forEach((song, i) => {
      const el = document.createElement('article');
      el.className = 'song'; el.style.setProperty('--c', song.color);
      el.innerHTML = `
        <button class="s-jacket" type="button" aria-label="${song.title} を試聴"><img src="img/${song.jacket}.webp" alt=""><span class="s-play">試聴</span></button>
        <div class="s-info"><h2>${song.title}</h2><p class="s-meta">${song.mood}　BPM ${song.bpm}　${fmtTime(song.length)}</p><p class="s-desc">${song.desc}</p></div>
        <div class="s-diffs">${song.charts.map((c, d) => { const b = best(song, d); return `<button class="dbtn" type="button" data-d="${d}"><span class="d-name">${DIFF[d]}</span><span class="d-lv">Lv ${c.level}</span><span class="d-best">${b ? `${b.rank}${b.ap ? '・全極' : b.fc ? '・FC' : ''}` : '―'}</span></button>`; }).join('')}</div>`;
      el.querySelector('.s-jacket').addEventListener('click', () => { GK.sfx('click'); startPreview(i); });
      el.querySelectorAll('.dbtn').forEach((b) => b.addEventListener('click', () => { GK.sfx('ok'); startPlay(i, +b.dataset.d); }));
      list.appendChild(el);
    });
  }
  $('#rRetry').addEventListener('click', () => { GK.sfx('ok'); startPlay(G.si_song, G.diff); });
  $('#rBack').addEventListener('click', () => { GK.sfx('click'); showScreen('#select'); });
  $('#helpBtn').addEventListener('click', () => { GK.sfx('click'); GK.help(); });
  $('#setBtn').addEventListener('click', () => { GK.sfx('click'); openSettings(); });

  function openSettings() {
    stopPreview();
    const body = document.createElement('div');
    body.className = 'settings';
    body.innerHTML = `
      <div class="set-row"><div><b>ノーツの速さ</b><small>大きいほど速く落ちてきます</small></div><div class="stepper"><button type="button" data-k="speed" data-v="-0.5" aria-label="遅く">−</button><output id="oSpeed"></output><button type="button" data-k="speed" data-v="0.5" aria-label="速く">＋</button></div></div>
      <div class="set-row"><div><b>判定タイミング</b><small>＋にすると、遅めに叩いても合います</small></div><div class="stepper"><button type="button" data-k="offset" data-v="-5" aria-label="早く">−</button><output id="oOffset"></output><button type="button" data-k="offset" data-v="5" aria-label="遅く">＋</button></div></div>
      <div class="set-row"><div><b>叩いたときの音</b><small>太鼓の縁を打つ小さな音</small></div><button type="button" class="gk-btn sm" id="oTap"></button></div>
      <div class="set-row"><div><b>タイミングを測る</b><small>太鼓に合わせて叩き、ずれを自動で設定します</small></div><button type="button" class="gk-btn sm primary" id="oCalib">計測する</button></div>`;
    const refresh = () => { body.querySelector('#oSpeed').textContent = SET.speed.toFixed(1); body.querySelector('#oOffset').textContent = (SET.offset > 0 ? '+' : '') + SET.offset + ' ms'; body.querySelector('#oTap').textContent = SET.tap ? 'オン' : 'オフ'; };
    body.querySelectorAll('.stepper button').forEach((b) => b.addEventListener('click', () => {
      GK.sfx('tick');
      if (b.dataset.k === 'speed') SET.speed = clamp(Math.round((SET.speed + +b.dataset.v) * 2) / 2, 1, 8);
      else SET.offset = clamp(SET.offset + +b.dataset.v, -250, 250);
      GK.store.set(b.dataset.k, SET[b.dataset.k]); refresh();
    }));
    body.querySelector('#oTap').addEventListener('click', () => { SET.tap = !SET.tap; GK.store.set('tap', SET.tap); refresh(); tapSound(); });
    refresh();
    GK.modal({ title: '設定・タイミング調整', body, wide: true, buttons: [{ label: '閉じる', value: 'close', primary: true }], onOpen: (card, close) => { body.querySelector('#oCalib').addEventListener('click', () => { close('calib'); }); } })
      .then((v) => { if (v === 'calib') openCalib(); });
  }

  /* ---------------- calibration ---------------- */
  const CAL = { bpm: 100, n: 16, warm: 4 };
  function openCalib() {
    G.mode = 'calib';
    showScreen('#calib');
    G.mode = 'calib';
    $('#cResult').textContent = '';
    $('#cApply').disabled = true;
    startCalib();
  }
  function startCalib() {
    if (!audioStart()) { $('#cMsg').textContent = '音が出せない環境のため計測できません。'; return; }
    const beat = 60 / CAL.bpm;
    CAL.start = actx.currentTime + 0.8; CAL.taps = []; CAL.done = false; CAL.result = null;
    for (let i = 0; i < CAL.n; i++) MB.taiko(actx, bus, CAL.start + i * beat, i < CAL.warm ? 'k' : 'D', i < CAL.warm ? 0.25 : 0.5);
    $('#cMsg').textContent = '太鼓の「ドン」に合わせて、キー（どれでも）か下の太鼓をたたいてください。はじめの 4 回の「カッ」は準備の合図です。';
    $('#cResult').textContent = '';
    clearTimeout(CAL.timer);
    CAL.timer = setTimeout(endCalib, (0.8 + CAL.n * beat + 0.6) * 1000);
  }
  function calibTap(perf) {
    if (!actx || CAL.done) return;
    const beat = 60 / CAL.bpm, T = heard(perf) - CAL.start, i = Math.round(T / beat);
    const d = $('#cDrum'); d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
    if (i >= CAL.warm && i < CAL.n) CAL.taps.push(T - i * beat);
  }
  function endCalib() {
    CAL.done = true;
    const t = CAL.taps.slice().sort((a, b) => a - b);
    if (t.length < 6) { $('#cResult').textContent = `たたいた回数が少なかったため測れませんでした（${t.length} 回）。もう一度どうぞ。`; return; }
    const med = t[Math.floor(t.length / 2)], ms = Math.round((med * 1000) / 5) * 5;
    CAL.result = clamp(ms, -250, 250);
    $('#cResult').textContent = `平均すると ${Math.abs(ms)} ms ${ms >= 0 ? '遅れて' : '早めに'}たたいています。判定タイミングを ${(CAL.result > 0 ? '+' : '') + CAL.result} ms にできます（いまは ${(SET.offset > 0 ? '+' : '') + SET.offset} ms）。`;
    $('#cApply').disabled = false;
  }
  $('#cApply').addEventListener('click', () => { if (CAL.result == null) return; SET.offset = CAL.result; GK.store.set('offset', SET.offset); GK.toast(`判定タイミングを ${(SET.offset > 0 ? '+' : '') + SET.offset} ms にしました`); closeCalib(); });
  $('#cRetry').addEventListener('click', () => { GK.sfx('click'); startCalib(); });
  $('#cClose').addEventListener('click', () => closeCalib());
  $('#cDrum').addEventListener('pointerdown', (e) => { e.preventDefault(); calibTap(e.timeStamp); });
  function closeCalib() { clearTimeout(CAL.timer); audioStop(); showScreen('#select'); }
  function calibFrame() {
    if (G.mode !== 'calib' || !actx || CAL.done) { $('#cCount').textContent = CAL.done ? '済' : ''; return; }
    const beat = 60 / CAL.bpm, T = heard() - CAL.start, i = Math.floor(T / beat), ph = T / beat - i;
    $('#cDrum').style.setProperty('--pulse', String(T >= 0 ? Math.max(0, 1 - ph * 3) : 0));
    $('#cCount').textContent = T < 0 ? '' : i < CAL.warm ? String(CAL.warm - i) : `${Math.max(0, CAL.n - i)}`;
  }

  /* ---------------- loop ---------------- */
  let lastScore = -1;
  GK.loop((dt) => {
    if (G.mode === 'play' && !G.paused) {
      updatePlay(dt);
      const s = G.E.score();
      if (s !== lastScore) { lastScore = s; $('#hScore').textContent = GK.fmt(s); }
      $('#hProg').style.width = clamp((G.T || 0) / G.song.length, 0, 1) * 100 + '%';
    }
    if (G.mode === 'calib') calibFrame();
    G.comboPop = Math.max(0, G.comboPop - dt * 6);
    for (const arr of [G.sparks, G.fw]) {
      let j = 0;
      for (const p of arr) { p.t += dt; if (p.t >= p.life) continue; p.vx *= 1 - 1.6 * dt; p.vy = p.vy * (1 - 1.6 * dt) + 70 * dt; p.x += p.vx * dt; p.y += p.vy * dt; arr[j++] = p; }
      arr.length = j;
    }
    if (G.fx.length > 40) G.fx.splice(0, G.fx.length - 40);
    render();
  });

  GK.init({
    id: ID, title: '宵宮ビート',
    menu: () => { if (G.mode === 'play') openPause(); else if (G.mode === 'calib') closeCalib(); else if (G.mode === 'result') showScreen('#select'); else openSettings(); },
    help: `
      <p>夜店の灯りの下で、祭り囃子に合わせて提灯を打つ 4 レーンの音楽ゲームです。上から落ちてくる提灯が、下の太鼓に重なった瞬間にたたきます。</p>
      <h3>操作</h3>
      <table>
        <tr><th>PC</th><td><kbd>D</kbd><kbd>F</kbd><kbd>J</kbd><kbd>K</kbd>（または <kbd>←</kbd><kbd>↓</kbd><kbd>↑</kbd><kbd>→</kbd>）が左から 1〜4 番のレーン。マウスでレーンをクリックしても遊べます</td></tr>
        <tr><th>スマホ</th><td>レーンを直接タップ（複数の指で同時に押せます）</td></tr>
        <tr><th>一時停止</th><td><kbd>Esc</kbd> または右上のメニュー</td></tr>
      </table>
      <h3>ノーツ</h3>
      <ul>
        <li><b>提灯</b>：太鼓に重なったらたたく。</li>
        <li><b>長い提灯（ロングノーツ）</b>：たたいたまま、帯の終わりまで押し続ける。途中で離すと「失」。</li>
      </ul>
      <h3>判定と得点</h3>
      <p>ずれの小さい順に <b>極</b>（±35 ms）・<b>優</b>（±70 ms）・<b>良</b>（±110 ms）・<b>可</b>（±150 ms）、たたけなかったら <b>失</b>。得点は全部「極」で 1,000,000 点です（極 100%・優 85%・良 55%・可 25%）。「失」でコンボが途切れます。</p>
      <p>結果は「宵宮みくじ」で、大吉（98 万点以上）・中吉（93 万）・小吉（88 万）・吉（80 万）・末吉（70 万）・凶。「失」なしで <b>フルコンボ</b>、全部「極」なら <b>全極</b>。曲と難易度ごとに最高記録を保存します。</p>
      <h3>うまく合わないとき</h3>
      <p>曲選びの「設定・タイミング調整」で、ノーツの速さと判定タイミングを変えられます。「計測する」で太鼓に合わせてたたくと、端末の音の遅れを含めたずれを自動で測れます。</p>
      <p>曲はすべてこのゲームのために作ったオリジナル曲です（篠笛・三味線・太鼓・鉦の音はブラウザーで合成しています）。</p>`,
  });

  const ready = GK.loadImages(['bg-stage', 'jacket-1', 'jacket-2', 'jacket-3']);
  showScreen('#select');

  /* ---------------- self-test (npm run game-check) ---------------- */
  window.__matsuri = { G, DBG, SONGS, Engine, simulate, startPlay };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const shot = (n) => (window.__shot ? window.__shot(n) : null);
    const until = async (fn, ms) => { const t0 = performance.now(); while (!fn() && performance.now() - t0 < ms) await GK.wait(50); return fn(); };
    try {
      await ready;
      // 1) every note of every chart lies on the song's beat grid (quarter / eighth / sixteenth), and autoplay scores 100 %
      const summary = [];
      for (const song of SONGS) {
        for (const ch of song.charts) {
          for (const n of ch.notes) {
            const q = n.t / song.st, qe = n.te / song.st;
            if (Math.abs(q - Math.round(q)) > 1e-6 || Math.round(q) % ch.grid || Math.abs(qe - Math.round(qe)) > 1e-6 || Math.round(qe) % ch.grid) { ok = false; notes.push(`off grid: ${song.id} ${DIFF[ch.diff]} at ${n.t.toFixed(3)}s`); break; }
          }
          const lanesAt = new Map();
          for (const n of ch.notes) lanesAt.set(n.s, (lanesAt.get(n.s) || 0) + 1);
          if ([...lanesAt.values()].some((c) => c > 2)) { ok = false; notes.push(`more than 2 notes at once: ${song.id} ${ch.diff}`); }
          const E = simulate(ch), sc = E.score();
          if (sc !== 1000000 || E.counts[0] !== ch.units) { ok = false; notes.push(`autoplay ${song.id} ${DIFF[ch.diff]}: ${sc}`); }
          summary.push(`${song.id}[${ch.diff}] ${ch.notes.length}n/${ch.notes.filter((n) => n.len).length}h ${ch.nps.toFixed(1)}nps`);
        }
      }
      notes.push('grid + autoplay 100%: ' + summary.join(', '));
      await shot('select');
      // 2) play a chart with the autoplay on a fast clock (no audio), to the result screen
      DBG.fast = true; DBG.auto = true; DBG.rate = 1;
      startPlay(0, 1);
      G.simT = G.chart.notes[0].t - 1.5;
      await GK.wait(2200);
      await shot('play');
      if (G.E.counts[4] > 0) { ok = false; notes.push('autoplay missed a note on screen'); }
      DBG.rate = 14;
      if (!(await until(() => G.mode === 'result', 20000))) { ok = false; notes.push('result screen not reached'); }
      const scoreText = $('#rScore').textContent, rank = $('#rRank').textContent;
      if (scoreText !== '1,000,000' || rank !== '大吉' || $('#rAP').hidden) { ok = false; notes.push(`result: ${scoreText} ${rank}`); }
      notes.push(`result ${scoreText} ${rank}`);
      await shot('result');
      // 3) the calibration screen opens
      openCalib(); await GK.wait(400); await shot('calib'); closeCalib();
    } catch (e) { ok = false; notes.push('error: ' + (e && e.stack || e)); }
    DBG.fast = false; DBG.auto = false; DBG.rate = 1;
    showScreen('#select');
    return { ok, notes };
  };
})();
