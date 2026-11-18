/* ナンプレ帖 — UI (title → play → result). Puzzle logic lives in sudoku.js (NP), generation in worker.js. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const NPc = window.NP;
  const { R, C, B, PEERS, bit } = NPc;

  const LEVELS = [null,
    { name: 'かんたん', tag: '「ここだけ」を探せば解ける', color: '#4f8a5b', pts: 1, stars: 1 },
    { name: 'ふつう', tag: '候補をしぼりこんで解く', color: '#2f5f9e', pts: 2, stars: 2 },
    { name: 'むずかしい', tag: 'ペア・トリプル・X-Wing', color: '#6a4a8c', pts: 4, stars: 3 },
    { name: '達人', tag: 'XY-Wing など連鎖を読む', color: '#b8432c', pts: 7, stars: 4 },
  ];
  const RANKS = [[0, '見習い'], [3, '初段'], [8, '二段'], [15, '三段'], [25, '四段'], [40, '五段'], [60, '六段'], [85, '七段'], [115, '八段'], [150, '九段'], [200, '名人']];
  const DEF_SETTINGS = { check: true, same: true, autoClear: true, counts: true, bgm: false };
  let settings = Object.assign({}, DEF_SETTINGS, GK.store.get('settings', {}));

  const ICONS = {
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5L4 10l5 5"/><path d="M4 10h10a5.5 5.5 0 0 1 0 11h-3"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l5 5-5 5"/><path d="M20 10H10a5.5 5.5 0 0 0 0 11h3"/></svg>',
    erase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 14.5l8.5-8.5 6 6-7 7H8z"/><path d="M9 10l6 6M12 20h8"/></svg>',
    memo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.2-4.5L16 4.7l3.3 3.3L8.5 18.8z"/><path d="M13.8 7l3.2 3.2"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="12" height="12" rx="2"/><path d="M7.5 7.5h.01M11.5 7.5h.01M7.5 11.5h.01"/><path d="M19 13.5v7M15.5 17h7"/></svg>',
    hint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  };

  /* ---------------- state ---------------- */
  let G = null; // the game in progress
  let screen = 'title';
  let hl = null; // hint highlight { house:Set, key:Set, elim:Set, target, wrong:Set, place:[i,d] }
  const cellEls = [], valEls = [], flEls = [], noteEls = [];
  const padEls = [];
  const toolEls = {};
  const fmtTime = (s) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
  const stats = () => GK.store.get('stats', {});
  const lvStats = (st, L) => Object.assign({ played: 0, cleared: 0, best: 0, total: 0, noMiss: 0, noHint: 0 }, st[L] || {});
  const dailyLog = () => GK.store.get('daily', {});

  /* ---------------- sound ---------------- */
  const PLUCK = (step, v = 0.2, at = 0) => {
    const f = GK.scaleFreq('D4', 'yo', step);
    GK.tone({ f, d: 0.5, type: 'triangle', v, a: 0.003, at });
    GK.tone({ f: f * 2, d: 0.18, type: 'sine', v: v * 0.35, a: 0.002, at });
  };
  GK.sfx.define('npPlace', () => { GK.noise({ d: 0.03, v: 0.12, f: 3000, q: 3 }); });
  const sPlace = (d) => { if (GK.muted) return; GK.sfx('npPlace'); PLUCK(d - 1, 0.17); };
  const sMemo = () => { if (!GK.muted) GK.tone({ f: 1250, d: 0.04, type: 'sine', v: 0.1 }); };
  const sErase = () => { if (!GK.muted) GK.tone({ f: 520, f2: 330, d: 0.08, type: 'sine', v: 0.14 }); };
  const sMiss = () => { if (!GK.muted) { GK.tone({ f: 220, f2: 180, d: 0.22, type: 'triangle', v: 0.2 }); GK.tone({ f: 233, d: 0.2, type: 'triangle', v: 0.12, at: 0.03 }); } };
  const sHouse = () => { if (!GK.muted) [4, 6, 8].forEach((s, k) => PLUCK(s, 0.14, k * 0.07)); };
  const sClear = () => { if (!GK.muted) [0, 2, 4, 5, 7, 9, 10, 12].forEach((s, k) => PLUCK(s, 0.18, k * 0.09)); setTimeout(() => GK.sfx('win'), 800); };
  const SONG = {
    bpm: 64, steps: 2, loop: true,
    tracks: [
      { type: 'triangle', v: 0.07, notes: 'A4 - B4 . D5 - - . B4 A4 G4 - E4 - - . | G4 - A4 . B4 - A4 G4 E4 - D4 - - - . . | D5 - E5 . D5 B4 A4 - G4 - A4 B4 A4 - - . | G4 E4 D4 - E4 - G4 . A4 - - - - - . .' },
      { type: 'sine', v: 0.09, notes: 'D3 - - - - - - - G2 - - - - - - - | A2 - - - - - - - D3 - - - - - - - | B2 - - - - - - - G2 - - - - - - - | A2 - - - - - - - D3 - - - - - - -' },
      { type: 'sine', v: 0.035, notes: '. . . . . . E6 . . . . . . . . . | . . . . . . . . . . B5 . . . . . | . . . . . . . . . . . . D6 . . . | . . . . A5 . . . . . . . . . . .' },
    ],
  };
  const syncMusic = () => { const want = settings.bgm && !GK.muted && screen !== 'none'; if (want && !GK.music.playing) GK.music.play(SONG); else if (!want && GK.music.playing) GK.music.stop(); };

  /* ---------------- worker & puzzle supply ---------------- */
  let worker = null, wid = 0;
  const waiting = {};
  try {
    worker = new Worker('worker.js');
    worker.onmessage = (e) => { const w = waiting[e.data.id]; if (w) { delete waiting[e.data.id]; w.res(e.data.result); } };
    worker.onerror = () => { worker = null; for (const k of Object.keys(waiting)) { const w = waiting[k]; delete waiting[k]; w.res(NPc.generate(w.level, w.seed, { timeLimit: w.timeLimit })); } };
  } catch (e) { worker = null; }
  function gen(level, seed, timeLimit = 8000) {
    return new Promise((res) => {
      if (!worker) { setTimeout(() => res(NPc.generate(level, seed, { timeLimit })), 40); return; }
      const id = ++wid;
      waiting[id] = { res, level, seed, timeLimit };
      worker.postMessage({ id, level, seed, timeLimit });
      setTimeout(() => { if (waiting[id]) { delete waiting[id]; res(null); } }, timeLimit * 3 + 6000);
    });
  }
  const pool = Object.assign({ 1: [], 2: [], 3: [], 4: [] }, GK.store.get('pool', {}));
  let prefetching = false;
  async function prefetch() {
    if (prefetching) return;
    prefetching = true;
    for (const L of [1, 2, 3, 4]) {
      while (pool[L].length < 2) {
        const p = await gen(L, (Math.random() * 4294967296) >>> 0, 9000);
        if (!p) break;
        pool[L].push(p.puzzle);
        GK.store.set('pool', pool);
      }
    }
    prefetching = false;
  }
  /** one of the 8 symmetries of the square + a relabelling of the digits: keeps uniqueness, grade and 180° symmetry */
  function disguise(puz, r) {
    const map = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const t = r.int(8);
    let out = '';
    for (let i = 0; i < 81; i++) {
      let rr = R[i], cc = C[i];
      if (t & 1) [rr, cc] = [cc, rr];
      if (t & 2) rr = 8 - rr;
      if (t & 4) cc = 8 - cc;
      const ch = puz[rr * 9 + cc];
      out += ch === '.' ? '.' : String(map[+ch - 1]);
    }
    return out;
  }
  function takePuzzle(level) {
    if (pool[level].length) {
      const p = pool[level].shift();
      GK.store.set('pool', pool);
      setTimeout(prefetch, 600);
      return p;
    }
    const bank = (window.NP_BANK || {})[level] || [];
    const idx = GK.store.get('bankIdx', {});
    const k = (idx[level] || 0) % bank.length;
    idx[level] = (idx[level] || 0) + 1;
    GK.store.set('bankIdx', idx);
    setTimeout(prefetch, 600);
    return disguise(bank[(k * 7 + 3) % bank.length], GK.rng());
  }

  /* ---------------- building the play screen ---------------- */
  function buildBoard() {
    const board = $('#board');
    for (let i = 0; i < 81; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      c.dataset.i = i;
      c.setAttribute('role', 'gridcell');
      const fl = document.createElement('div'); fl.className = 'fl';
      const v = document.createElement('span'); v.className = 'v';
      const n = document.createElement('div'); n.className = 'notes';
      const ns = [null];
      for (let d = 1; d <= 9; d++) { const x = document.createElement('i'); x.textContent = d; n.appendChild(x); ns.push(x); }
      c.append(fl, v, n);
      board.appendChild(c);
      cellEls.push(c); valEls.push(v); flEls.push(fl); noteEls.push(ns);
    }
    board.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.cell');
      if (!c || !G || G.done || G.paused) return;
      select(+c.dataset.i);
    });
    let s = '';
    for (let k = 1; k < 9; k++) { const cls = k % 3 ? 'thin' : 'thick'; s += `<line class="${cls}" x1="${k}" y1="0" x2="${k}" y2="9"/><line class="${cls}" x1="0" y1="${k}" x2="9" y2="${k}"/>`; }
    $('#lines').innerHTML = s + '<rect x="0" y="0" width="9" height="9"/>';
    const tools = [['undo', '戻す', undo], ['redo', 'やり直す', redo], ['erase', '消す', erase], ['memo', 'メモ', toggleMemo], ['auto', '自動メモ', autoMemo], ['hint', 'ヒント', showHint]];
    for (const [k, label, fn] of tools) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tool'; b.title = label; b.setAttribute('aria-label', label);
      b.innerHTML = ICONS[k] + `<span>${label}</span>` + (k === 'memo' ? '<em class="badge">OFF</em>' : '');
      b.addEventListener('click', () => fn());
      $('#tools').appendChild(b);
      toolEls[k] = b;
    }
    for (let d = 1; d <= 9; d++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'num'; b.setAttribute('aria-label', `${d} を入れる`);
      b.innerHTML = `<b>${d}</b><small></small>`;
      b.addEventListener('click', () => inputDigit(d, false));
      $('#pad').appendChild(b);
      padEls[d] = b;
    }
  }

  function layout() {
    const W = innerWidth, H = innerHeight;
    const barH = H <= 520 ? 46 : 56;
    const land = W > H * 1.08;
    const main = $('#main');
    main.classList.toggle('land', land);
    main.classList.toggle('port', !land);
    let bs, sw = 0, pbh;
    if (land) {
      sw = Math.round(Math.min(380, Math.max(232, W * 0.29)));
      bs = Math.min(H - barH - 26, W - sw - 64, 860);
      bs = Math.floor(bs / 9) * 9;
      const toolsH = H <= 520 ? 42 : 56, infoH = H <= 520 ? 34 : 40, gap = H <= 520 ? 8 : 12;
      const avail = bs - toolsH - infoH - gap * 3;
      const hintRoom = bs >= 560 ? 190 : 0;
      main.classList.toggle('tight', !hintRoom);
      pbh = Math.floor(Math.max(36, Math.min(110, (avail - 16 - hintRoom) / 3, (sw - 16) / 3)));
    } else {
      main.classList.remove('tight');
      const avail = H - barH - 40 - 56 - 50;
      bs = Math.floor(Math.min(W - 20, avail - 52, 680) / 9) * 9;
      pbh = Math.round(Math.max(48, Math.min(84, avail - bs)));
    }
    const root = document.documentElement.style;
    root.setProperty('--bs', bs + 'px');
    root.setProperty('--sw', sw + 'px');
    root.setProperty('--pbh', pbh + 'px');
    fx.resize();
  }

  /* ---------------- game lifecycle ---------------- */
  function newGame(puzzle, level, dailyKey) {
    const sol = new Uint8Array(81);
    if (NPc.countSolutions(puzzle, 2, sol) !== 1) { GK.toast('問題を読み込めませんでした'); return; }
    const given = new Uint8Array(81), v = new Uint8Array(81);
    for (let i = 0; i < 81; i++) if (puzzle[i] !== '.') { given[i] = 1; v[i] = +puzzle[i]; }
    G = { level, daily: dailyKey || null, puzzle, sol, given, v, notes: new Uint16Array(81), elapsed: 0, mistakes: 0, hints: 0, undo: [], redo: [], sel: -1, memo: false, focus: 0, done: false, paused: false };
    const st = stats();
    const ls = lvStats(st, level);
    ls.played++;
    st[level] = ls;
    GK.store.set('stats', st);
    enterPlay();
    save();
  }
  function enterPlay() {
    hl = null;
    $('#hintBox').hidden = true;
    $('#result').hidden = true;
    $('#board').classList.remove('done', 'paused');
    $('#pauseCover').hidden = true;
    flEls.forEach((f) => f.classList.remove('wave', 'flash'));
    const L = LEVELS[G.level];
    $('#levelName').textContent = L.name;
    $('#lvDot').style.setProperty('--lc', L.color);
    $('#dailyTag').textContent = G.daily ? `今日の一問 ${G.daily.slice(5).replace('-', '/')}` : '';
    showScreen('play');
    render();
  }
  function save() {
    if (!G || G.done) return;
    GK.store.set('save', { level: G.level, daily: G.daily, puzzle: G.puzzle, v: Array.from(G.v).join(''), notes: Array.from(G.notes), elapsed: Math.round(G.elapsed), mistakes: G.mistakes, hints: G.hints, memo: G.memo });
  }
  function resume() {
    const s = GK.store.get('save', null);
    if (!s || !s.puzzle) return false;
    const sol = new Uint8Array(81);
    if (NPc.countSolutions(s.puzzle, 2, sol) !== 1) { GK.store.del('save'); return false; }
    const given = new Uint8Array(81), v = new Uint8Array(81);
    for (let i = 0; i < 81; i++) { if (s.puzzle[i] !== '.') given[i] = 1; v[i] = +s.v[i] || 0; }
    G = { level: s.level, daily: s.daily, puzzle: s.puzzle, sol, given, v, notes: Uint16Array.from(s.notes || new Array(81).fill(0)), elapsed: s.elapsed || 0, mistakes: s.mistakes || 0, hints: s.hints || 0, undo: [], redo: [], sel: -1, memo: !!s.memo, focus: 0, done: false, paused: false };
    enterPlay();
    return true;
  }
  async function confirmLeaveSave() {
    const s = GK.store.get('save', null);
    if (!s || (G && !G.done && screen === 'play')) return true;
    const r = await GK.modal({ title: '途中の問題があります', body: `<p>${LEVELS[s.level].name}の問題（${fmtTime(s.elapsed)}）が途中です。新しい問題を始めると、途中の問題は消えます。</p>`, buttons: [{ label: 'つづきから', value: 'resume' }, { label: '新しく始める', value: 'new', primary: true }] });
    if (r === 'resume') { resume(); return false; }
    return r === 'new';
  }
  async function startLevel(level) {
    if (!(await confirmLeaveSave())) return;
    GK.sfx('select');
    newGame(takePuzzle(level), level, null);
  }
  async function startDaily() {
    if (!(await confirmLeaveSave())) return;
    GK.sfx('select');
    const d = NPc.dailyFor(new Date());
    let cache = GK.store.get('dailyPuzzle', null);
    if (!cache || cache.key !== d.key) {
      showLoading(true, '今日の一問を用意しています…');
      let p = await gen(d.level, d.seed, 20000);
      if (!p) { // deterministic fallback
        const bank = window.NP_BANK[d.level];
        p = { puzzle: disguise(bank[d.seed % bank.length], NPc.rng(d.seed)) };
      }
      cache = { key: d.key, level: d.level, puzzle: p.puzzle };
      GK.store.set('dailyPuzzle', cache);
      showLoading(false);
    }
    newGame(cache.puzzle, cache.level, d.key);
  }
  function showLoading(on, text) {
    $('#loading').hidden = !on;
    if (text) $('#loadingText').textContent = text;
  }

  /* ---------------- input ---------------- */
  function select(i) {
    if (!G || G.done) return;
    G.sel = i;
    if (G.v[i]) G.focus = G.v[i];
    clearHint(false);
    GK.sfx('click');
    render();
  }
  function change(list) {
    const act = [];
    for (const [i, v, n] of list) {
      if (G.v[i] === v && G.notes[i] === n) continue;
      act.push([i, G.v[i], G.notes[i], v, n]);
      G.v[i] = v; G.notes[i] = n;
    }
    if (act.length) { G.undo.push(act); if (G.undo.length > 600) G.undo.shift(); G.redo = []; }
    return act;
  }
  function inputDigit(d, asMemo) {
    if (!G || G.done || G.paused || screen !== 'play') return;
    const i = G.sel;
    clearHint(false);
    if (i < 0 || G.given[i]) { G.focus = G.focus === d ? 0 : d; GK.sfx('click'); render(); return; }
    if (asMemo || G.memo) {
      if (G.v[i]) { GK.toast('数字が入っているマスにはメモできません'); return; }
      change([[i, 0, G.notes[i] ^ bit(d)]]);
      G.focus = d;
      sMemo();
    } else if (G.v[i] === d) {
      change([[i, 0, 0]]);
      sErase();
    } else {
      const list = [[i, d, 0]];
      if (settings.autoClear) for (const p of PEERS[i]) if (!G.v[p] && G.notes[p] & bit(d)) list.push([p, 0, G.notes[p] & ~bit(d)]);
      change(list);
      G.focus = d;
      if (d !== G.sol[i] && settings.check) {
        G.mistakes++;
        sMiss();
        bump(valEls[i], 'shake');
      } else {
        sPlace(d);
        bump(valEls[i], 'pop');
        if (d === G.sol[i]) houseFlash(i);
      }
    }
    render();
    save();
    checkSolved(i);
  }
  function bump(el, cls) { el.classList.remove('pop', 'shake'); void el.offsetWidth; el.classList.add(cls); }
  function houseFlash(i) {
    const done = [];
    for (const h of [R[i], 9 + C[i], 18 + B[i]]) if (NPc.HOUSES[h].every((j) => G.v[j] === G.sol[j])) done.push(h);
    if (!done.length) return;
    const cells = new Set();
    done.forEach((h) => NPc.HOUSES[h].forEach((j) => cells.add(j)));
    if (cells.size >= 81 - 0 && G.v.every((x, j) => x === G.sol[j])) return;
    cells.forEach((j) => { const f = flEls[j]; const dist = Math.abs(R[j] - R[i]) + Math.abs(C[j] - C[i]); f.style.setProperty('--dl', dist * 45 + 'ms'); f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash'); });
    setTimeout(sHouse, 120);
  }
  function erase() {
    if (!G || G.done || G.paused) return;
    const i = G.sel;
    if (i < 0 || G.given[i]) return;
    if (!G.v[i] && !G.notes[i]) return;
    change([[i, 0, 0]]);
    clearHint(false);
    sErase();
    render(); save();
  }
  function undo() {
    if (!G || G.done || G.paused || !G.undo.length) return;
    const a = G.undo.pop();
    for (let k = a.length - 1; k >= 0; k--) { const [i, v0, n0] = a[k]; G.v[i] = v0; G.notes[i] = n0; }
    G.redo.push(a);
    G.sel = a[0][0];
    clearHint(false);
    sErase();
    render(); save();
  }
  function redo() {
    if (!G || G.done || G.paused || !G.redo.length) return;
    const a = G.redo.pop();
    for (const [i, , , v1, n1] of a) { G.v[i] = v1; G.notes[i] = n1; }
    G.undo.push(a);
    G.sel = a[0][0];
    clearHint(false);
    GK.sfx('click');
    render(); save();
    checkSolved(G.sel);
  }
  function toggleMemo() {
    if (!G || G.done) return;
    G.memo = !G.memo;
    GK.sfx('click');
    render(); save();
  }
  function autoMemo() {
    if (!G || G.done || G.paused) return;
    const st = NPc.makeState(G.v);
    const list = [];
    for (let i = 0; i < 81; i++) if (!G.v[i]) list.push([i, 0, st.c[i]]);
    const act = change(list);
    clearHint(false);
    GK.sfx('select');
    GK.toast(act.length ? '入る可能性のある数字を、すべてメモしました' : 'メモはもう最新です');
    render(); save();
  }
  function move(dr, dc) {
    if (!G || G.done || G.paused) return;
    let i = G.sel < 0 ? 40 : G.sel;
    if (G.sel >= 0) { const r = (R[i] + dr + 9) % 9, c = (C[i] + dc + 9) % 9; i = r * 9 + c; }
    select(i);
  }

  /* ---------------- hints ---------------- */
  function clearHint(redraw = true) {
    if (!hl) return;
    hl = null;
    $('#hintBox').hidden = true;
    if (redraw) render();
  }
  function showHint() {
    if (!G || G.done || G.paused) return;
    const wrong = [];
    for (let i = 0; i < 81; i++) if (G.v[i] && !G.given[i] && G.v[i] !== G.sol[i]) wrong.push(i);
    G.hints++;
    GK.sfx('select');
    if (wrong.length) {
      hl = { house: new Set(), key: new Set(), elim: new Set(), wrong: new Set(wrong), target: -1, fix: wrong };
      openHint('まちがいの確認', `赤い枠のマス（${wrong.length} か所）の数字が、答えとちがっています。消してから続けましょう。`, '消す');
    } else {
      const h = NPc.hint(G.v);
      const s = h.step;
      if (!s) {
        let best = -1, bc = 10;
        const st = NPc.makeState(G.v);
        for (let i = 0; i < 81; i++) if (!G.v[i] && NPc.POP[st.c[i]] < bc) { bc = NPc.POP[st.c[i]]; best = i; }
        if (best < 0) return;
        hl = { house: new Set(), key: new Set(), elim: new Set(), wrong: new Set(), target: best, place: [best, G.sol[best]] };
        openHint('答えを見る', `このマスには ${G.sol[best]} が入ります。`, '数字を入れる');
      } else {
        const key = h.chain.length ? h.chain[0] : s;
        const house = new Set(), keys = new Set(), elim = new Set();
        const addHouse = (hh) => NPc.HOUSES[hh].forEach((j) => house.add(j));
        if (key.house != null) addHouse(key.house);
        if (key.line != null) addHouse(key.line);
        if (key.lines) key.lines.forEach(addHouse);
        if (key.tech === 'naked-single') { const i = key.cells[0]; [R[i], 9 + C[i], 18 + B[i]].forEach(addHouse); }
        (key.cells || []).forEach((j) => keys.add(j));
        (key.elim || []).forEach(([j]) => elim.add(j));
        let text = NPc.describe(key);
        if (h.chain.length) {
          if (h.chain.length > 1) text += ' さらに候補をしぼりこむと…';
          text += ` その結果、緑のマスに入るのは ${s.place[1]} だけになります。`;
        }
        hl = { house, key: keys, elim, wrong: new Set(), target: s.place[0], place: s.place };
        openHint(NPc.NAMES[key.tech] || 'ヒント', text, '数字を入れる');
      }
      if (hl.target >= 0) G.sel = hl.target;
      if (hl.place) G.focus = hl.place[1];
    }
    render(); save();
  }
  function openHint(name, text, applyLabel) {
    $('#hintName').textContent = `ヒント ・ ${name}`;
    $('#hintText').textContent = text;
    $('#hintApply').textContent = applyLabel;
    $('#hintBox').hidden = false;
  }
  function applyHint() {
    if (!hl || !G) return;
    const h = hl;
    clearHint(false);
    if (h.fix) {
      change(h.fix.map((i) => [i, 0, 0]));
      sErase();
      render(); save();
      return;
    }
    if (h.place) { G.sel = h.place[0]; G.memo = false; inputDigit(h.place[1], false); }
  }

  /* ---------------- pause / timer ---------------- */
  function setPaused(p) {
    if (!G || G.done || screen !== 'play') return;
    G.paused = p;
    $('#board').classList.toggle('paused', p);
    $('#pauseCover').hidden = !p;
    if (p) clearHint(false);
    GK.sfx('click');
    render(); save();
  }
  let lastTick = performance.now(), lastSave = 0;
  setInterval(() => {
    const now = performance.now();
    if (G && !G.done && !G.paused && screen === 'play' && !document.hidden && !document.querySelector('.gk-modal-back') && $('#loading').hidden) {
      G.elapsed += (now - lastTick) / 1000;
      if (now - lastSave > 5000) { lastSave = now; save(); }
    }
    lastTick = now;
    if (G && screen === 'play') $('#timer').textContent = fmtTime(G.elapsed);
  }, 250);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  addEventListener('pagehide', save);

  /* ---------------- render ---------------- */
  function render() {
    if (!G) return;
    const sel = G.sel, sv = sel >= 0 ? G.v[sel] : 0;
    const focus = settings.same ? (sv || G.focus || 0) : 0;
    // duplicates visible on the board (rule violations)
    const dup = new Set();
    for (const h of NPc.HOUSES) {
      const seen = {};
      for (const i of h) if (G.v[i]) { if (seen[G.v[i]] != null) { dup.add(i); dup.add(seen[G.v[i]]); } else seen[G.v[i]] = i; }
    }
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 81; i++) {
      const v = G.v[i];
      counts[v]++;
      let cls = 'cell';
      if (G.given[i]) cls += ' given'; else if (v) cls += ' user';
      if (v && !G.given[i] && ((settings.check && v !== G.sol[i]) || dup.has(i))) cls += ' bad';
      if (i === sel) cls += ' sel';
      else if (sel >= 0 && (R[i] === R[sel] || C[i] === C[sel] || B[i] === B[sel])) cls += ' peer';
      if (focus && v === focus) cls += ' same';
      if (hl) {
        if (i === hl.target) cls += ' h-target';
        else if (hl.key.has(i)) cls += ' h-key';
        else if (hl.elim.has(i)) cls += ' h-elim';
        else if (hl.house.has(i)) cls += ' h-house';
        if (hl.wrong.has(i)) cls += ' h-wrong';
      }
      if (cellEls[i].className !== cls) cellEls[i].className = cls;
      const txt = v ? String(v) : '';
      if (valEls[i].textContent !== txt) valEls[i].textContent = txt;
      const m = v ? 0 : G.notes[i];
      const ns = noteEls[i];
      for (let d = 1; d <= 9; d++) {
        const c = m & (1 << (d - 1)) ? (focus === d ? 'on hl' : 'on') : '';
        if (ns[d].className !== c) ns[d].className = c;
      }
      cellEls[i].setAttribute('aria-label', `${R[i] + 1} 行 ${C[i] + 1} 列 ${v || '空き'}`);
    }
    for (let d = 1; d <= 9; d++) {
      const left = 9 - counts[d];
      padEls[d].classList.toggle('full', left <= 0);
      padEls[d].classList.toggle('focus', focus === d);
      padEls[d].querySelector('small').textContent = left > 0 ? left : '';
    }
    $('#pad').classList.toggle('memo', G.memo);
    $('#pad').classList.toggle('hide-counts', !settings.counts);
    toolEls.memo.classList.toggle('on', G.memo);
    toolEls.memo.querySelector('.badge').textContent = G.memo ? 'ON' : 'OFF';
    toolEls.undo.disabled = !G.undo.length || G.done;
    toolEls.redo.disabled = !G.redo.length || G.done;
    const miss = $('#miss');
    miss.textContent = settings.check ? `ミス ${G.mistakes}` : 'ミスの表示 オフ';
    miss.classList.toggle('has', settings.check && G.mistakes > 0);
    $('#timer').textContent = fmtTime(G.elapsed);
  }

  /* ---------------- completion ---------------- */
  function checkSolved(last) {
    if (!G || G.done) return;
    let full = true, ok = true;
    for (let i = 0; i < 81; i++) { if (!G.v[i]) full = false; if (G.v[i] !== G.sol[i]) ok = false; }
    if (ok) return complete(last);
    if (full) GK.toast('すべて埋まりましたが、どこかに間違いがあります');
  }
  function rankOf(points) { let r = RANKS[0], next = null; for (const x of RANKS) { if (points >= x[0]) r = x; else { next = x; break; } } return { name: r[1], next }; }
  function rankPoints() {
    const st = stats();
    let p = 0;
    for (let L = 1; L <= 4; L++) p += lvStats(st, L).cleared * LEVELS[L].pts;
    p += Object.keys(dailyLog()).length * 2;
    return p;
  }
  function dailyStreak() {
    const log = dailyLog();
    let n = 0;
    const d = new Date();
    if (!log[NPc.dailyFor(d).key]) d.setDate(d.getDate() - 1);
    while (log[NPc.dailyFor(d).key]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function complete(last) {
    G.done = true;
    hl = null;
    $('#hintBox').hidden = true;
    const t = Math.max(1, Math.round(G.elapsed));
    const before = rankOf(rankPoints()).name;
    const st = stats();
    const ls = lvStats(st, G.level);
    const record = !ls.best || t < ls.best;
    ls.cleared++; ls.total += t;
    if (record) ls.best = t;
    if (!G.mistakes) ls.noMiss++;
    if (!G.hints) ls.noHint++;
    st[G.level] = ls;
    GK.store.set('stats', st);
    let dailyNote = '';
    if (G.daily) {
      const log = dailyLog();
      if (!log[G.daily] || t < log[G.daily].t) log[G.daily] = { t, level: G.level };
      GK.store.set('daily', log);
      dailyNote = `今日の一問 クリア！ 連続 ${dailyStreak()} 日`;
    }
    GK.store.del('save');
    const after = rankOf(rankPoints()).name;
    G.sel = -1;
    render();
    // the wave: every cell lights up, rippling from the last number
    const from = last >= 0 ? last : 40;
    $('#board').classList.add('done');
    for (let i = 0; i < 81; i++) {
      const dist = Math.hypot(R[i] - R[from], C[i] - C[from]);
      const dl = Math.round(dist * 70) + 'ms';
      flEls[i].style.setProperty('--dl', dl);
      valEls[i].style.setProperty('--dl', dl);
      flEls[i].classList.remove('flash', 'wave'); void flEls[i].offsetWidth; flEls[i].classList.add('wave');
    }
    sClear();
    fx.burst(1700);
    setTimeout(() => {
      const L = LEVELS[G.level];
      $('#rKicker').textContent = G.daily ? `今日の一問（${L.name}）` : L.name;
      $('#rTitle').textContent = !G.mistakes && !G.hints ? '見事な一問でした' : 'お見事！';
      $('#rTime').textContent = fmtTime(t);
      $('#rMiss').textContent = settings.check ? G.mistakes : '―';
      $('#rHint').textContent = G.hints;
      $('#rStamp').hidden = !record;
      const notes = [];
      if (dailyNote) notes.push(dailyNote);
      notes.push(record && ls.cleared > 1 ? `${L.name}の新記録です（これまでの最高を更新）。` : record ? `${L.name}の初クリアです。` : `${L.name}のベストは ${fmtTime(ls.best)}。`);
      if (after !== before) notes.push(`段位が「${after}」に上がりました。`);
      $('#rNote').textContent = notes.join(' ');
      $('#rNext').textContent = G.daily ? '問題を選ぶ' : '次の問題へ';
      $('#result').hidden = false;
      setTimeout(() => $('#rNext').focus({ preventScroll: true }), 50);
    }, 1900);
  }

  /* ---------------- effects canvas (falling petals and paper) ---------------- */
  const fx = (() => {
    const cv = $('#fx');
    const view = GK.fit(cv);
    let parts = [], until = 0, loop = null;
    const COLORS = ['#f2b8c6', '#f7d2dc', '#e9a3b6', '#f3d27a', '#2f4f86', '#fffdf7'];
    function burst(ms) {
      const w = view.w, h = view.h;
      for (let k = 0; k < 110; k++) {
        parts.push({ x: Math.random() * w, y: -20 - Math.random() * h * 0.6, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 110, r: 4 + Math.random() * 6, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 6, c: COLORS[k % COLORS.length], petal: k % 6 < 3, sw: Math.random() * 6.28 });
      }
      until = performance.now() + ms + 3200;
      if (!loop) loop = GK.loop(step);
    }
    function step(dt, t) {
      view.clear();
      const g = view.ctx;
      for (const p of parts) {
        p.sw += dt * 2.4; p.x += (p.vx + Math.sin(p.sw) * 30) * dt; p.y += p.vy * dt; p.a += p.va * dt;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c;
        if (p.petal) { g.beginPath(); g.moveTo(0, -p.r); g.bezierCurveTo(p.r, -p.r * 0.6, p.r * 0.8, p.r * 0.7, 0, p.r); g.bezierCurveTo(-p.r * 0.8, p.r * 0.7, -p.r, -p.r * 0.6, 0, -p.r); g.fill(); }
        else { g.scale(1, Math.abs(Math.cos(p.sw))); g.fillRect(-p.r * 0.6, -p.r * 0.4, p.r * 1.2, p.r * 0.8); }
        g.restore();
      }
      parts = parts.filter((p) => p.y < view.h + 30);
      if (!parts.length || performance.now() > until) { view.clear(); parts = []; loop.stop(); loop = null; }
    }
    return { burst, resize: () => view.resize(), clear: () => { parts = []; view.clear(); } };
  })();

  /* ---------------- screens ---------------- */
  function showScreen(name) {
    screen = name;
    $('#title').hidden = name !== 'title';
    $('#play').hidden = name !== 'play';
    if (name === 'title') { $('#result').hidden = true; refreshTitle(); }
    if (name === 'play') layout();
    if (GK.hudEl) GK.hudEl.classList.toggle('light', true);
  }
  function refreshTitle() {
    const st = stats();
    const box = $('#levels');
    box.innerHTML = '';
    for (let L = 1; L <= 4; L++) {
      const lv = LEVELS[L], s = lvStats(st, L);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'lv'; b.style.setProperty('--c', lv.color);
      b.innerHTML = `<b>${lv.name}</b><span class="lv-tag">${lv.tag}</span><span class="lv-rec">${s.cleared ? `クリア ${s.cleared} 回・ベスト ${fmtTime(s.best)}` : 'まだクリアしていません'}</span><span class="lv-stars" aria-hidden="true">${[1, 2, 3, 4].map((k) => `<i class="${k <= lv.stars ? '' : 'off'}"></i>`).join('')}</span>`;
      b.addEventListener('click', () => startLevel(L));
      box.appendChild(b);
    }
    const now = new Date(), d = NPc.dailyFor(now), log = dailyLog();
    $('#dailyDay').textContent = now.getDate();
    $('#dailyMon').textContent = `${now.getMonth() + 1}月`;
    const done = log[d.key];
    $('#dailyBtn').classList.toggle('cleared', !!done);
    const streak = dailyStreak();
    $('#dailyInfo').textContent = done ? `クリア済み ${fmtTime(done.t)}・連続 ${streak} 日` : `${LEVELS[d.level].name}・毎日 0 時に新しい問題${streak ? `・連続 ${streak} 日` : ''}`;
    const sv = GK.store.get('save', null);
    $('#resumeBtn').hidden = !sv;
    if (sv) $('#resumeBtn').textContent = `つづきから（${LEVELS[sv.level].name} ${fmtTime(sv.elapsed)}）`;
    const pts = rankPoints(), rk = rankOf(pts);
    $('#sealRank').textContent = rk.name;
    $('#rankNote').textContent = rk.next ? `段位「${rk.name}」― あと ${rk.next[0] - pts} 点で「${rk.next[1]}」（かんたん 1 点・ふつう 2 点・むずかしい 4 点・達人 7 点・今日の一問 +2 点）` : '最高の段位「名人」です。';
  }
  async function toTitle() {
    if (G && !G.done) save();
    clearHint(false);
    fx.clear();
    showScreen('title');
  }

  /* ---------------- dialogs ---------------- */
  function openSettings() {
    const rows = [
      ['check', 'ミスをすぐに知らせる', '答えとちがう数字を赤で表示し、ミスの数を数えます'],
      ['same', '同じ数字を強調する', '選んだマスと同じ数字・メモを色で示します'],
      ['autoClear', 'メモを自動で消す', '数字を入れたとき、同じ行・列・ブロックのメモからその数字を消します'],
      ['counts', '残りの数を表示', '数字ボタンに、あと何個置けるかを表示します'],
      ['bgm', 'BGM を流す', '琴の音のような静かな曲（はじめはオフ）'],
    ];
    const body = document.createElement('div');
    body.className = 'np-set';
    for (const [k, label, note] of rows) {
      const l = document.createElement('label');
      l.innerHTML = `<input type="checkbox" ${settings[k] ? 'checked' : ''}><span><b>${label}</b><small>${note}</small></span>`;
      l.querySelector('input').addEventListener('change', (e) => {
        settings[k] = e.target.checked;
        GK.store.set('settings', settings);
        if (k === 'bgm') { if (settings.bgm && GK.muted) GK.toast('音が消えています（右上のボタンで音を出せます）'); syncMusic(); }
        render();
      });
      body.appendChild(l);
    }
    return GK.modal({ title: '設定', body, buttons: [{ label: '閉じる', primary: true }] });
  }
  function openStats() {
    const st = stats();
    let rows = '';
    for (let L = 1; L <= 4; L++) {
      const s = lvStats(st, L);
      rows += `<tr><td><b style="color:${LEVELS[L].color}">${LEVELS[L].name}</b></td><td>${s.played}</td><td>${s.cleared}</td><td>${s.best ? fmtTime(s.best) : '―'}</td><td>${s.cleared ? fmtTime(s.total / s.cleared) : '―'}</td><td>${s.noMiss}</td><td>${s.noHint}</td></tr>`;
    }
    const log = dailyLog(), days = Object.keys(log).length;
    const pts = rankPoints(), rk = rankOf(pts);
    const body = `<div class="np-stats-wrap"><table class="np-stats"><thead><tr><th>難易度</th><th>挑戦</th><th>クリア</th><th>ベスト</th><th>平均</th><th>ノーミス</th><th>ヒントなし</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h3>今日の一問</h3><p>クリアした日 ${days} 日・いまの連続 ${dailyStreak()} 日</p>
      <h3>段位</h3><p>「${rk.name}」（${pts} 点）${rk.next ? `― あと ${rk.next[0] - pts} 点で「${rk.next[1]}」` : ''}</p>`;
    return GK.modal({ title: '記録', body, wide: true, buttons: [{ label: '記録を消す', value: 'reset', ghost: true }, { label: '閉じる', value: 'close', primary: true }] }).then(async (r) => {
      if (r !== 'reset') return;
      const ok = await GK.modal({ title: '記録を消しますか？', body: '<p>難易度ごとの記録・今日の一問の記録・段位がすべて消えます。元には戻せません。</p>', buttons: [{ label: 'やめる', value: false }, { label: '消す', value: true, primary: true }] });
      if (ok) { GK.store.del('stats'); GK.store.del('daily'); GK.toast('記録を消しました'); refreshTitle(); }
    });
  }
  async function openMenu() {
    if (screen !== 'play' || !G || G.done) {
      const r = await GK.modal({ title: 'メニュー', body: '<p>設定や記録をひらけます。</p>', buttons: [{ label: '記録', value: 'stats' }, { label: '設定', value: 'settings' }, { label: '閉じる', value: null, primary: true }] });
      if (r === 'stats') openStats(); else if (r === 'settings') openSettings();
      return;
    }
    const r = await GK.modal({ title: 'メニュー', body: `<p>${LEVELS[G.level].name}${G.daily ? '（今日の一問）' : ''}・${fmtTime(G.elapsed)}</p>`, buttons: [{ label: '最初からやり直す', value: 'restart' }, ...(G.daily ? [] : [{ label: '別の問題にする', value: 'new' }]), { label: '設定', value: 'settings' }, { label: 'タイトルへ', value: 'title' }, { label: 'つづける', value: null, primary: true }] });
    if (r === 'restart') {
      const ok = await GK.modal({ title: '最初からやり直しますか？', body: '<p>入れた数字とメモをすべて消します。時計は続きから進みます。</p>', buttons: [{ label: 'やめる', value: false }, { label: 'やり直す', value: true, primary: true }] });
      if (ok) { const list = []; for (let i = 0; i < 81; i++) if (!G.given[i]) list.push([i, 0, 0]); change(list); G.sel = -1; clearHint(false); render(); save(); }
    } else if (r === 'new') { GK.store.del('save'); G = null; newGame(takePuzzle(gLevel()), gLevel(), null); }
    else if (r === 'settings') openSettings();
    else if (r === 'title') toTitle();
  }
  let lastLevel = 1;
  const gLevel = () => (G ? G.level : lastLevel);

  /* ---------------- keyboard ---------------- */
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back')) return;
    if (!$('#result').hidden) { if (e.key === 'Enter') { e.preventDefault(); $('#rNext').click(); } return; }
    if (screen !== 'play' || !G) return;
    const k = e.key, code = e.code;
    if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (code === 'Space' || k === 'p' || k === 'P') { e.preventDefault(); setPaused(!G.paused); return; }
    if (G.paused) return;
    const m = /^(?:Digit|Numpad)([0-9])$/.exec(code);
    if (m) { e.preventDefault(); const d = +m[1]; if (d === 0) erase(); else inputDigit(d, e.shiftKey); return; }
    if (k === 'ArrowUp') { e.preventDefault(); move(-1, 0); }
    else if (k === 'ArrowDown') { e.preventDefault(); move(1, 0); }
    else if (k === 'ArrowLeft') { e.preventDefault(); move(0, -1); }
    else if (k === 'ArrowRight') { e.preventDefault(); move(0, 1); }
    else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); erase(); }
    else if (k === 'm' || k === 'M') toggleMemo();
    else if (k === 'h' || k === 'H') showHint();
    else if (k === 'a' || k === 'A') autoMemo();
    else if (k === 'Escape') { if (hl) clearHint(); else if (G.sel >= 0) { G.sel = -1; render(); } }
  });

  /* ---------------- wiring ---------------- */
  const HELP = `
    <h3>ルール</h3>
    <p>9×9 のマスに 1〜9 の数字を入れます。<b>どの行（横の 9 マス）・列（縦の 9 マス）・太い線で囲んだ 3×3 のブロックにも、1〜9 が 1 つずつ</b>入るように埋めれば完成です。はじめから入っている数字は動かせません。どの問題も、答えはひとつだけです。</p>
    <h3>操作</h3>
    <table>
      <tr><th>マスを選ぶ</th><td>タップ・クリック、または <kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd></td></tr>
      <tr><th>数字を入れる</th><td>下（右）の数字ボタン、または <kbd>1</kbd>〜<kbd>9</kbd>。同じ数字をもう一度押すと消えます</td></tr>
      <tr><th>消す</th><td>「消す」、または <kbd>Backspace</kbd>・<kbd>Delete</kbd>・<kbd>0</kbd></td></tr>
      <tr><th>メモ</th><td>「メモ」をオン（<kbd>M</kbd>）にすると、候補の小さな数字を書きこめます。<kbd>Shift</kbd>＋数字でも書けます</td></tr>
      <tr><th>自動メモ</th><td>入る可能性のある数字を、すべてのマスにメモします（<kbd>A</kbd>）</td></tr>
      <tr><th>戻す・やり直す</th><td><kbd>Ctrl</kbd>＋<kbd>Z</kbd>・<kbd>Ctrl</kbd>＋<kbd>Y</kbd></td></tr>
      <tr><th>ヒント</th><td>次に入れられるマスと、その理由（解き方の名前）を教えます（<kbd>H</kbd>）</td></tr>
      <tr><th>一時停止</th><td>時計の横のボタン、または <kbd>スペース</kbd></td></tr>
    </table>
    <h3>難易度</h3>
    <p>問題はその場で作り、人が解くときの手順で解いて難しさを決めています。</p>
    <ul>
      <li><b>かんたん</b> ― 「この行で 7 が入るのはここだけ」を探していけば解けます</li>
      <li><b>ふつう</b> ― 候補をしぼる工夫（ブロックと行・列の関係、2 マスのペア）が必要です</li>
      <li><b>むずかしい</b> ― 3 つ組や X-Wing（四隅の形）を使います</li>
      <li><b>達人</b> ― XY-Wing などの連鎖や、3 本の並び（ソードフィッシュ）を読みます</li>
    </ul>
    <h3>今日の一問・記録・段位</h3>
    <p>「今日の一問」は日付ごとに決まった問題で、毎日 0 時に変わります。難易度ごとのベストタイムと、クリアで貯まる点数による段位（見習い → 初段 → … → 名人）が記録されます。途中の問題は自動で保存され、「つづきから」で再開できます。</p>
    <p>「設定」で、ミスのお知らせ・同じ数字の強調・メモの自動消去・BGM を切り替えられます。</p>`;
  GK.init({ id: 'nanpure', title: 'ナンプレ帖', help: HELP, menu: openMenu });
  if (GK.hudEl) GK.hudEl.classList.add('light');
  GK.loadImages(['key-visual', 'clear-illust', 'pause-tea']);
  // the background texture is decorative: while it is still the sample image (marker in its EXIF), show it fainter
  fetch('img/bg-washi.webp').then((r) => r.arrayBuffer()).then((b) => {
    const u = new Uint8Array(b), pat = 'game-images-sample';
    outer: for (let i = 0; i < u.length - pat.length; i++) { for (let k = 0; k < pat.length; k++) if (u[i + k] !== pat.charCodeAt(k)) continue outer; document.documentElement.classList.add('np-sample-bg'); break; }
  }).catch(() => {});

  buildBoard();
  $('#dailyBtn').addEventListener('click', startDaily);
  $('#resumeBtn').addEventListener('click', () => { GK.sfx('select'); resume(); });
  $('#statsBtn').addEventListener('click', () => { GK.sfx('click'); openStats(); });
  $('#settingsBtn').addEventListener('click', () => { GK.sfx('click'); openSettings(); });
  $('#backBtn').addEventListener('click', () => { GK.sfx('click'); toTitle(); });
  $('#pauseBtn').addEventListener('click', () => setPaused(!G.paused));
  $('#resumePlay').addEventListener('click', () => setPaused(false));
  $('#hintClose').addEventListener('click', () => { GK.sfx('click'); clearHint(); });
  $('#hintApply').addEventListener('click', applyHint);
  $('#rTitleBtn').addEventListener('click', () => { GK.sfx('click'); G = null; toTitle(); });
  $('#rNext').addEventListener('click', () => { const L = G ? G.level : 1, daily = G && G.daily; GK.sfx('select'); $('#result').hidden = true; if (daily) { G = null; toTitle(); } else { G = null; newGame(takePuzzle(L), L, null); } });
  addEventListener('resize', () => { if (screen === 'play') layout(); });
  addEventListener('pointerdown', () => syncMusic(), { once: true });
  const origMute = GK.setMuted;
  GK.setMuted = (m) => { origMute(m); syncMusic(); };
  showScreen('title');
  setTimeout(prefetch, 1500);

  /* ---------------- self test (npm run game-check) ---------------- */
  window.__np = { get game() { return G; }, newGame, takePuzzle };
  window.__gameSelfTest = async function () {
    const notes = [];
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const key = (k, code, extra = {}) => dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, code: code || k, bubbles: true }, extra)));
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    GK.store.del('save');
    showScreen('title');
    await wait(200);
    await shot('title');
    // 1) start かんたん from the title button
    document.querySelectorAll('#levels .lv')[0].click();
    await wait(300);
    if (screen !== 'play' || !G) return { ok: false, notes: ['level button did not start a game'] };
    const empties = () => { const a = []; for (let i = 0; i < 81; i++) if (!G.v[i]) a.push(i); return a; };
    // 2) a correct number with the pad
    let i = empties()[0];
    cellEls[i].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    padEls[G.sol[i]].click();
    if (G.v[i] !== G.sol[i]) return { ok: false, notes: ['pad input failed'] };
    // 3) a wrong number counts a mistake, undo removes it
    i = empties()[0];
    select(i);
    const wrongD = G.sol[i] % 9 + 1;
    key(String(wrongD), 'Digit' + wrongD);
    if (G.mistakes !== 1) return { ok: false, notes: ['mistake not counted'] };
    key('z', 'KeyZ', { ctrlKey: true });
    if (G.v[i] !== 0) return { ok: false, notes: ['undo failed'] };
    key('y', 'KeyY', { ctrlKey: true });
    if (G.v[i] !== wrongD) return { ok: false, notes: ['redo failed'] };
    key('Backspace', 'Backspace');
    // 4) memo with Shift, then auto memo
    key('!', 'Digit1', { shiftKey: true });
    if (!(G.notes[i] & 1)) return { ok: false, notes: ['memo failed'] };
    autoMemo();
    await wait(100);
    // 5) hint explains and fills
    showHint();
    await wait(150);
    if ($('#hintBox').hidden || !$('#hintText').textContent) return { ok: false, notes: ['hint did not open'] };
    notes.push('hint: ' + $('#hintText').textContent.slice(0, 40));
    await shot('hint');
    const before = empties().length;
    applyHint();
    if (empties().length !== before - 1) return { ok: false, notes: ['hint did not place a number'] };
    // 6) pause / resume
    setPaused(true);
    await wait(120);
    await shot('pause');
    setPaused(false);
    // 7) solve all but three cells (debug path), then the rest with the keyboard
    const rest = empties();
    for (const j of rest.slice(3)) { G.v[j] = G.sol[j]; G.notes[j] = 0; }
    render();
    await shot('play');
    for (const j of empties()) { select(j); key(String(G.sol[j]), 'Digit' + G.sol[j]); }
    if (!G.done) return { ok: false, notes: ['puzzle not completed'] };
    await wait(2300);
    if ($('#result').hidden) return { ok: false, notes: ['result screen not shown'] };
    await shot('result');
    const s = lvStats(stats(), 1);
    if (s.cleared < 1) return { ok: false, notes: ['stats not saved'] };
    notes.push(`cleared かんたん in ${$('#rTime').textContent}, mistakes ${G.mistakes}, hints ${G.hints}`);
    // 8) every level has puzzles (bank) and the generator answers
    for (let L = 1; L <= 4; L++) { const p = takePuzzle(L); if (NPc.countSolutions(p, 2) !== 1) return { ok: false, notes: ['bad puzzle at level ' + L] }; }
    const t0 = performance.now();
    const g = await gen(2, 12345, 8000);
    if (!g) return { ok: false, notes: ['worker generation failed'] };
    notes.push(`worker made a ふつう puzzle in ${Math.round(performance.now() - t0)} ms`);
    $('#rTitleBtn').click();
    await wait(200);
    return { ok: screen === 'title', notes };
  };
})();
