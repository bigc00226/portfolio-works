/* みやび札 ― 百人一首かるた（対戦・ちらし取り・決まり字練習・百首一覧） */
(() => {
  'use strict';
  const { POEMS, sound } = window.HYAKU;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byN = (n) => POEMS[n - 1];
  const SND = POEMS.map((p) => sound(p.ky));
  const rnd = GK.random;
  const fmtT = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60); return (m ? m + ':' + String(Math.floor(s % 60)).padStart(2, '0') : Math.floor(s)) + '.' + Math.floor((s % 1) * 10) + (m ? '' : '秒'); };
  const KANJI_NUM = (n) => n + '番';

  /* ---------------- settings & records ---------------- */
  const SET = Object.assign({ voice: false, speed: 1, flip: false, count: 0, lv: 1, chirashi: 20, pmode: 'km', prange: 'all' }, GK.store.get('settings', {}));
  const saveSet = () => GK.store.set('settings', SET);
  const SPEEDS = [
    { label: 'ゆっくり', mora: 0.27, rate: 0.6 },
    { label: 'ふつう', mora: 0.2, rate: 0.75 },
    { label: 'はやい', mora: 0.15, rate: 0.95 },
  ];
  /* CPU の相手（オリジナルの人物）。know: 何字目で歌が分かるか（phrase 初句まで / static 決まり字 / dynamic 読まれた札を除いた決まり字） */
  const LEVELS = [
    { name: '小春', kana: 'こはる', title: 'かるた歴半年の小学生', img: 'cpu-1', know: 'phrase', react: [0.7, 1.3], err: 0.1 },
    { name: '文月', kana: 'ふみづき', title: '図書館で働く歌好きの青年', img: 'cpu-2', know: 'static', react: [0.55, 0.95], err: 0.07 },
    { name: '宵', kana: 'よい', title: '藍の着物の上級者', img: 'cpu-3', know: 'dynamic', react: [0.38, 0.6], err: 0.05 },
    { name: '白峰', kana: 'しらみね', title: 'かるた一筋六十年の老師', img: 'cpu-4', know: 'dynamic', react: [0.2, 0.36], err: 0.025 },
  ];
  const rec = {
    get vs() { return GK.store.get('vs', {}); },
    get chirashi() { return GK.store.get('chirashi', {}); },
    get srs() { return GK.store.get('srs', {}); },
  };
  const mastered = () => Object.values(rec.srs).filter((v) => v[0] >= 3).length;

  /* ---------------- sound ---------------- */
  GK.sfx.define('slap', () => { GK.noise({ d: 0.09, v: 0.55, f: 1700, q: 0.7 }); GK.noise({ d: 0.04, v: 0.3, f: 5200, filter: 'highpass' }); GK.tone({ f: 190, f2: 90, d: 0.08, type: 'sine', v: 0.3 }); });
  GK.sfx.define('koto', () => [0, 3, 7].forEach((s, i) => GK.tone({ f: GK.scaleFreq('D5', 'in', s), d: 0.5, type: 'triangle', v: 0.14, at: i * 0.06 })));
  const SONG = {
    bpm: 66, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.13, notes: 'A4 - Bb4 A4 G4 - Eb4 - | D4 - - - . . G4 A4 | Bb4 - A4 G4 A4 - D5 - | A4 - - - . . . . | D5 - Bb4 A4 G4 - A4 Bb4 | A4 - G4 Eb4 D4 - - - | G4 - A4 - Bb4 A4 G4 Eb4 | D4 - - - - - . .' },
      { type: 'sine', v: 0.1, notes: 'D3 - - - - - - - | D3 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | Bb2 - - - - - - - | G2 - - - - - - - | Eb3 - - - - - - - | D3 - - - - - - -' },
      { type: 'triangle', v: 0.045, notes: '. D4 . A4 . D4 . A4 | . D4 . G4 . A4 . D5 | . G4 . D4 . G4 . Bb4 | . A4 . E4 . A4 . D5 | . Bb4 . F4 . Bb4 . D5 | . G4 . D4 . G4 . Bb4 | . Eb4 . Bb4 . G4 . Eb4 | . D4 . A4 . D4 . .' },
    ],
  };
  let gestured = false;
  const music = (on) => { if (on && gestured) { if (!GK.music.playing) GK.music.play(SONG); } else if (!on) GK.music.stop(); };
  addEventListener('pointerdown', () => { if (!gestured) { gestured = true; if (cur === 'title') music(true); } }, { capture: true });
  addEventListener('keydown', () => { if (!gestured) { gestured = true; if (cur === 'title') music(true); } }, { capture: true });

  /* ---------------- voice (Web Speech API, ja-JP, voices on the device only) ---------------- */
  const Voice = {
    has: 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
    v: null, speaking: false,
    pick() { if (!this.has) return null; const vs = speechSynthesis.getVoices().filter((v) => /^ja/i.test(v.lang) && v.localService); this.v = vs.find((v) => /ja-JP/i.test(v.lang)) || vs[0] || null; return this.v; },
    usable() { return this.has && !!(this.v || this.pick()); },
    speak(text, rate, onstart, onend) {
      if (!this.usable()) return false;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP'; u.voice = this.v; u.rate = rate; u.pitch = 0.92; u.volume = GK.muted ? 0 : 1;
        this.speaking = true;
        u.onstart = () => onstart && onstart();
        u.onend = u.onerror = () => { this.speaking = false; if (onend) onend(); };
        speechSynthesis.speak(u);
        return true;
      } catch (e) { this.speaking = false; return false; }
    },
    stop() { if (this.has) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } } this.speaking = false; },
  };
  if (Voice.has) { Voice.pick(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', () => Voice.pick()); }
  const voiceOn = () => SET.voice && Voice.usable();
  const modernParts = (p) => { const w = p.t.split(' '); return [w.slice(0, 3).join(' '), w.slice(3).join(' ')]; };

  /* ---------------- 取り札 (code-drawn) ---------------- */
  function splitCols(text) {
    const ch = [...text], n = ch.length, base = Math.floor(n / 3), extra = n % 3, cols = [];
    let i = 0;
    for (let c = 0; c < 3; c++) { const len = base + (c < extra ? 1 : 0); cols.push(ch.slice(i, i + len).join('')); i += len; }
    return cols;
  }
  function fudaEl(p) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'fuda'; b.dataset.n = p.n;
    b.setAttribute('aria-label', '取り札 ' + p.fuda);
    const cols = splitCols(p.fuda), L = Math.max(...cols.map((c) => c.length));
    const t = document.createElement('span');
    t.className = 't';
    t.style.fontSize = `min(calc(var(--cw) * .235), calc(var(--ch) * ${(0.8 / L).toFixed(3)}))`;
    t.innerHTML = cols.join('<br>');
    b.appendChild(t);
    return b;
  }

  /* ---------------- screens ---------------- */
  let cur = 'title';
  function show(id) {
    cur = id;
    $$('.screen').forEach((s) => s.classList.toggle('on', s.id === 'sc-' + id));
    if (GK.hudEl) GK.hudEl.classList.toggle('light', id === 'list');
    music(id === 'title' || id === 'list');
    if (id === 'title') refreshTitle();
  }
  function refreshTitle() {
    const vs = rec.vs; let w = 0, l = 0;
    Object.values(vs).forEach((r) => { w += r.w || 0; l += r.l || 0; });
    const ch = rec.chirashi, bestKey = Object.keys(ch).sort((a, b) => b - a)[0];
    const parts = [];
    if (w + l) parts.push(`対戦 ${w}勝 ${l}敗`);
    if (bestKey) parts.push(`ちらし ${bestKey}枚 ${fmtT(ch[bestKey])}`);
    parts.push(`覚えた歌 ${mastered()} / 100`);
    $('#ti-rec').textContent = parts.join('　・　');
  }

  /* ---------------- reader (progressive 上の句, mora by mora) ---------------- */
  const Reader = {
    items: [], t: 0, total: 0, wait: 0, count: 0, revealed: 0, done: true,
    start(kana, voiceText) {
      const box = $('#rd-kami');
      box.innerHTML = '';
      this.items = []; this.revealed = 0; this.count = 0;
      const mora = M.fast ? 0.035 : SPEEDS[SET.speed].mora;
      let t = 0;
      for (const ch of kana) {
        const i = document.createElement('i');
        if (ch === ' ') { i.className = 'sp'; t += mora * 1.4; box.appendChild(i); continue; }
        i.textContent = ch;
        box.appendChild(i);
        this.items.push({ el: i, t });
        t += mora;
      }
      this.total = t; this.t = 0; this.done = false;
      this.wait = 0.32;
      if (voiceText && voiceOn() && !M.fast) {
        this.wait = 1.2;
        Voice.speak(voiceText, SPEEDS[SET.speed].rate, () => { this.wait = Math.min(this.wait, 0.05); });
      }
    },
    update(dt) {
      if (this.done) return;
      if (this.wait > 0) { this.wait -= dt; return; }
      this.t += dt;
      while (this.revealed < this.items.length && this.items[this.revealed].t <= this.t) this.items[this.revealed++].el.classList.add('on');
      if (this.revealed >= this.items.length && this.t >= this.total) this.done = true;
    },
    revealAll() { this.items.forEach((it) => it.el.classList.add('on')); this.revealed = this.items.length; this.done = true; },
    markKm(len) { this.items.slice(0, len).forEach((it) => it.el.classList.add('km')); },
    shimo(html) { $('#rd-shimo').innerHTML = html; },
    state(text, cls) { const s = $('#rd-state'); s.textContent = text || ''; s.className = 'rd-state' + (cls ? ' ' + cls : ''); },
  };

  /* ---------------- the match (対戦 / ちらし取り) ---------------- */
  const M = { active: false, paused: false, fast: false };
  const cardEls = new Map();
  const shortLand = () => innerHeight < 520 && innerWidth > innerHeight;
  const maxCount = () => (innerWidth >= 900 && innerHeight >= 600 ? 25 : 15);

  function at(delay, fn) { M.timers.push({ t: M.clock + delay, fn }); }
  function sideEl(s) { return s === 'cpu' ? $('#side-cpu') : $('#side-me'); }
  function count(s) { return M.sides[s].grid.flat().filter((x) => x != null).length; }
  function locate(n) {
    for (const s of ['me', 'cpu']) { const g = M.sides[s] && M.sides[s].grid; if (!g) continue; for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === n) return { s, r, c }; }
    return null;
  }
  function onField() { return ['me', 'cpu'].flatMap((s) => (M.sides[s] ? M.sides[s].grid.flat().filter((x) => x != null) : [])); }

  /** cards of a row: half from the left end, half from the right end (the middle stays open, as on a real field) */
  function buildGrid(ns, rows, cols) {
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const per = Array.from({ length: rows }, (_, r) => Math.floor(ns.length / rows) + (r < ns.length % rows ? 1 : 0));
    let k = 0;
    for (let r = 0; r < rows; r++) {
      const left = Math.ceil(per[r] / 2), right = per[r] - left;
      for (let i = 0; i < left; i++) grid[r][i] = ns[k++];
      for (let i = 0; i < right; i++) grid[r][cols - 1 - i] = ns[k++];
    }
    return grid;
  }
  function addCard(s, n) {
    const side = M.sides[s];
    const rows = side.grid.length;
    const free = [];
    side.grid.forEach((row, r) => row.forEach((x, c) => { if (x == null) free.push({ r, c, load: row.filter((y) => y != null).length, edge: Math.min(c, row.length - 1 - c) }); }));
    if (!free.length) {
      for (const k of ['me', 'cpu']) M.sides[k].grid.forEach((row) => row.splice(Math.ceil(row.length / 2), 0, null));
      return addCard(s, n);
    }
    free.sort((a, b) => a.load - b.load || a.edge - b.edge || a.r - b.r);
    side.grid[free[0].r][free[0].c] = n;
    void rows;
  }
  function removeCard(n) { const l = locate(n); if (l) M.sides[l.s].grid[l.r][l.c] = null; return l; }

  function layout() {
    if (!M.active) return;
    const field = $('#mt-field');
    if (M.mode === 'vs') {
      const R = shortLand() ? 2 : 3;
      for (const s of ['me', 'cpu']) {
        const g = M.sides[s].grid;
        if (g.length !== R) { const ns = g.flat().filter((x) => x != null); const C = Math.ceil(Math.max(ns.length, 1) / R) + 1; M.sides[s].grid = buildGrid(ns, R, C); }
      }
      const C = Math.max(M.sides.me.grid[0].length, M.sides.cpu.grid[0].length);
      for (const s of ['me', 'cpu']) M.sides[s].grid.forEach((row) => { while (row.length < C) row.splice(Math.ceil(row.length / 2), 0, null); });
      const r = $('#side-me').getBoundingClientRect();
      const g = r.width < 520 ? 5 : 7;
      const ch = Math.max(30, Math.min((r.height - (R - 1) * g) / R, (r.width - (C - 1) * g) / C / 0.72));
      field.style.setProperty('--rows', R); field.style.setProperty('--cols', C);
      field.style.setProperty('--ch', ch.toFixed(1) + 'px'); field.style.setProperty('--cw', (ch * 0.72).toFixed(1) + 'px'); field.style.setProperty('--gap', g + 'px');
    } else {
      const r = $('#side-me').getBoundingClientRect(), N = M.N, g = r.width < 520 ? 6 : 10;
      let best = { ch: 0, C: 1, R: N };
      for (let C = 2; C <= 12; C++) {
        const R = Math.ceil(N / C);
        const ch = Math.min((r.height - (R - 1) * g) / R, (r.width - (C - 1) * g) / C / 0.72);
        if (ch > best.ch) best = { ch, C, R };
      }
      if (M.sides.me.cols !== best.C) {
        M.sides.me.cols = best.C;
        const slots = M.order0.slice();
        const grid = Array.from({ length: best.R }, () => Array(best.C).fill(null));
        slots.forEach((n, i) => { if (onField().includes(n) || !M.started) grid[Math.floor(i / best.C)][i % best.C] = n; });
        M.sides.me.grid = grid;
      }
      field.style.setProperty('--rows', best.R); field.style.setProperty('--cols', best.C);
      field.style.setProperty('--ch', best.ch.toFixed(1) + 'px'); field.style.setProperty('--cw', (best.ch * 0.72).toFixed(1) + 'px'); field.style.setProperty('--gap', g + 'px');
    }
    render(false);
  }
  /** places the card elements in the grids (FLIP animation for cards that moved) */
  function render(animate = true) {
    const before = new Map();
    if (animate) cardEls.forEach((el, n) => before.set(n, el.getBoundingClientRect()));
    for (const s of ['me', 'cpu']) {
      const side = M.sides[s]; if (!side) continue;
      const el = sideEl(s), R = side.grid.length;
      side.grid.forEach((row, r) => row.forEach((n, c) => {
        if (n == null) return;
        let e = cardEls.get(n);
        if (!e) { e = fudaEl(byN(n)); cardEls.set(n, e); if (M.mode === 'chirashi') e.style.setProperty('--rot', (rnd() * 10 - 5).toFixed(1) + 'deg'); }
        if (e.parentNode !== el) el.appendChild(e);
        const flipSide = s === 'cpu';
        e.style.gridRow = String(flipSide ? R - r : r + 1);
        e.style.gridColumn = String(flipSide ? row.length - c : c + 1);
      }));
    }
    if (animate) cardEls.forEach((el, n) => {
      const a = before.get(n); if (!a) return;
      const b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) + Math.abs(dy) > 2) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' });
    });
    updateHud();
  }
  function flyAway(n, toward) {
    const el = cardEls.get(n); if (!el) return;
    cardEls.delete(n);
    el.classList.add('hit');
    const dy = toward === 'cpu' ? -innerHeight * 0.6 : innerHeight * 0.6;
    const anim = el.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.35 }, { transform: `translate(${(rnd() - 0.5) * 120}px, ${dy}px) rotate(${(rnd() - 0.5) * 50}deg) scale(.7)`, opacity: 0 }], { duration: M.fast ? 120 : 760, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
    anim.onfinish = () => el.remove();
  }
  function updateHud() {
    if (!M.active) return;
    if (M.mode === 'vs') {
      $('#mt-ocount').textContent = `残り ${count('cpu')}枚`;
      $('#mt-mcount').textContent = `残り ${count('me')}枚`;
      $('#mt-prog').textContent = M.idx >= 0 ? `${M.idx + 1}首目 / 全${M.order.length}首` : '序歌';
      $('#mt-faults').textContent = `お手つき ${M.st.meFault}`;
    } else {
      $('#mt-mcount').textContent = `残り ${count('me')}枚`;
      $('#mt-prog').textContent = `お手つき ${M.st.meFault}（+${M.st.meFault * 2}秒）`;
      $('#mt-faults').textContent = '';
    }
  }

  function resetMatch(mode) {
    Voice.stop();
    cardEls.forEach((el) => el.remove()); cardEls.clear();
    $('#side-cpu').innerHTML = ''; $('#side-me').innerHTML = '';
    Object.assign(M, { active: true, paused: false, mode, clock: 0, timers: [], idx: -1, phase: 'intro', started: false, takenBy: null,
      st: { meTake: 0, cpuTake: 0, meFault: 0, cpuFault: 0, react: [], t0: 0 }, read: new Set() });
    $('#sc-match').classList.toggle('chirashi', mode === 'chirashi');
    $('#side-cpu').hidden = mode !== 'vs';
    $('#side-me').classList.toggle('solo', mode === 'chirashi');
    $('#side-cpu').classList.toggle('flip', !!SET.flip);
    $('#mt-voice').setAttribute('aria-pressed', String(voiceOn()));
    $('#mt-voice').textContent = voiceOn() ? '声 ON' : '声 OFF';
    Reader.shimo(''); Reader.state('');
    $('#rd-kami').innerHTML = '';
    show('match');
  }

  /* --- 対戦 --- */
  function startVS(lv, N, opts = {}) {
    resetMatch('vs');
    M.fast = !!opts.fast;
    M.lv = LEVELS[lv]; M.lvi = lv; M.N = N;
    const deck = rnd.shuffle(POEMS.map((p) => p.n));
    const mine = deck.slice(0, N), theirs = deck.slice(N, 2 * N);
    const R = shortLand() ? 2 : 3, C = Math.ceil(N / R) + 1;
    M.sides = { me: { grid: buildGrid(mine, R, C) }, cpu: { grid: buildGrid(theirs, R, C) } };
    const rest = rnd.shuffle(deck.slice(2 * N)).slice(0, 2 * N);
    M.order = rnd.shuffle(mine.concat(theirs, rest));
    $('#mt-ava').src = `img/${M.lv.img}.webp`; $('#mt-ava').hidden = false;
    $('#mt-oname').textContent = M.lv.name;
    $('#rd-ava').src = 'img/reader.webp';
    layout();
    Reader.state('序歌', '');
    Reader.start('なにはづに さくやこのはな ふゆごもり', 'なにわずに さくやこのはな ふゆごもり');
    M.phase = 'intro';
    M.introStep = 0;
    updateHud();
  }
  function nextPoem() {
    if (!M.active) return;
    M.idx++;
    if (M.idx >= M.order.length) return endVS(count('me') <= count('cpu'));
    const p = byN(M.order[M.idx]);
    M.cur = p; M.loc = locate(p.n); M.takenBy = null; M.meF = false; M.cpuF = false; M.kmAt = null; M.cpuKnowAt = null; M.cpuTouchAt = null;
    M.phase = 'reading'; M.readEnd = null;
    $$('.fuda.hit, .fuda.miss, .fuda.cpu-touch').forEach((e) => e.classList.remove('hit', 'miss', 'cpu-touch'));
    Reader.shimo(''); Reader.state('');
    Reader.start(p.ky, modernParts(p)[0]);
    // CPU plan
    const lv = M.lv, snd = SND[p.n - 1];
    let know;
    if (lv.know === 'phrase') know = Math.max(p.km.length, p.ky.indexOf(' '));
    else if (lv.know === 'static') know = p.km.length;
    else {
      const pool = POEMS.filter((q) => !M.read.has(q.n) && q.n !== p.n).map((q) => SND[q.n - 1]);
      know = 1;
      while (know < snd.length && pool.some((s) => s.startsWith(snd.slice(0, know)))) know++;
    }
    M.cpuKnow = know;
    M.cpuReact = rnd.range(lv.react[0], lv.react[1]) * (M.fast ? 0.2 : 1);
    M.cpuMistake = null;
    if (rnd() < lv.err) {
      // jump the gun on a card that shares the start of this poem
      let bestN = null, bestL = 0;
      for (const n of onField()) {
        if (n === p.n) continue;
        const s2 = SND[n - 1]; let L = 0;
        while (L < s2.length && s2[L] === snd[L]) L++;
        if (L > bestL) { bestL = L; bestN = n; }
      }
      if (bestN && bestL >= 1 && bestL < know + 2) M.cpuMistake = { n: bestN, at: bestL };
    }
    M.read.add(p.n);
    updateHud();
  }
  function tickVS(dt) {
    Reader.update(dt);
    if (M.phase === 'intro') {
      if (Reader.done && M.introStep === 0) {
        M.introStep = 1;
        at(0.6, () => { Reader.shimo('いまをはるべと さくやこのはな'); if (voiceOn() && !M.fast) Voice.speak('いまおはるべと さくやこのはな', SPEEDS[SET.speed].rate); });
        at(M.fast ? 0.7 : 2.8, () => { Reader.state(''); nextPoem(); });
      }
      return;
    }
    if (M.phase !== 'reading') return;
    const p = M.cur;
    if (M.kmAt == null && Reader.revealed >= p.km.length) M.kmAt = M.clock;
    // CPU
    if (!M.takenBy) {
      const mk = M.cpuMistake;
      if (mk && !M.cpuF && Reader.revealed >= mk.at) {
        if (M.cpuTouchAt == null) M.cpuTouchAt = M.clock + M.cpuReact * 0.6;
        else if (M.clock >= M.cpuTouchAt && locate(mk.n)) { cpuTouch(mk.n); M.cpuMistake = null; }
      }
      if (M.loc && Reader.revealed >= M.cpuKnow) {
        if (M.cpuKnowAt == null) M.cpuKnowAt = M.clock;
        else if (M.clock >= M.cpuKnowAt + M.cpuReact) take('cpu');
      }
    }
    if (!M.loc && Reader.done) {
      if (M.readEnd == null) M.readEnd = M.clock;
      else if (M.clock > M.readEnd + (M.fast ? 0.1 : 0.9)) {
        M.phase = 'after';
        Reader.state('空札', '');
        Reader.shimo(`${p.sy}<small>　${KANJI_NUM(p.n)}・${p.p}</small>`);
        at(M.fast ? 0.1 : 0.8, resolve);
      }
    }
  }
  function cpuTouch(n) {
    const el = cardEls.get(n); if (el) { el.classList.add('cpu-touch'); setTimeout(() => el.classList.remove('cpu-touch'), 600); }
    const l = locate(n);
    if (M.loc && l && l.s === M.loc.s) return; // same side: no fault
    M.cpuF = true; M.st.cpuFault++;
    GK.sfx('ng');
    Reader.state(`${M.lv.name}のお手つき！`, 'good');
  }
  function take(who) {
    if (M.takenBy || !M.loc) return;
    const p = M.cur;
    M.takenBy = who; M.phase = 'after';
    const from = M.loc.s;
    removeCard(p.n);
    flyAway(p.n, who);
    GK.sfx('slap');
    if (who === 'me') {
      M.st.meTake++;
      if (M.kmAt != null) M.st.react.push(Math.max(0, M.clock - M.kmAt));
      Reader.state(from === 'cpu' ? 'あなたの取り！（敵陣）' : 'あなたの取り！', 'good');
      if (from === 'cpu') M.meSend = (M.meSend || 0) + 1;
    } else {
      M.st.cpuTake++;
      Reader.state(`${M.lv.name}の取り`, '');
      if (from === 'me') M.cpuSend = (M.cpuSend || 0) + 1;
    }
    Reader.revealAll(); Reader.markKm(p.km.length);
    Reader.shimo(`${p.sy}<small>　${KANJI_NUM(p.n)}・${p.p}</small>`);
    let wait = M.fast ? 0.15 : 1.3;
    if (voiceOn() && !M.fast) { Voice.speak(modernParts(p)[1], SPEEDS[SET.speed].rate); wait = 2.2; }
    updateHud();
    at(wait, resolve);
  }
  /** after a poem: penalties and 送り札, then the next poem (or the end) */
  function resolve() {
    if (!M.active) return;
    if (M.meF) { M.cpuSend = (M.cpuSend || 0) + 1; M.meF = 'done'; }
    if (M.cpuF === true) { M.meSend = (M.meSend || 0) + 1; M.cpuF = 'done'; }
    if (M.cpuSend > 0 && count('cpu') > 0) {
      M.cpuSend--;
      const mine = M.sides.cpu.grid.flat().filter((x) => x != null);
      const n = rnd.pick(mine);
      removeCard(n); addCard('me', n); render(true);
      GK.sfx('card');
      Reader.state(`${M.lv.name}から札が送られました`, 'warn');
      return at(M.fast ? 0.1 : 0.75, resolve);
    }
    M.cpuSend = 0;
    if (M.meSend > 0 && count('me') > 0) {
      M.phase = 'send';
      M.sendDeadline = M.clock + (M.fast ? 0.3 : 9);
      $$('#side-me .fuda').forEach((e) => e.classList.add('pick'));
      Reader.state(`相手に送る札を選んでください${M.meSend > 1 ? `（あと${M.meSend}枚）` : ''}`, 'good');
      return;
    }
    M.meSend = 0;
    const me = count('me'), cpu = count('cpu');
    if (me === 0 || cpu === 0) return endVS(me === 0);
    M.phase = 'between';
    at(M.fast ? 0.05 : 0.5, nextPoem);
  }
  function sendMine(n) {
    $$('#side-me .fuda').forEach((e) => e.classList.remove('pick'));
    removeCard(n); addCard('cpu', n); render(true);
    GK.sfx('card');
    M.meSend--;
    M.phase = 'after';
    at(M.fast ? 0.05 : 0.45, resolve);
  }
  function onTapVS(n, el) {
    if (M.phase === 'send') {
      const l = locate(n);
      if (l && l.s === 'me') sendMine(n);
      return;
    }
    if (M.phase !== 'reading' || M.takenBy) return;
    if (n === M.cur.n) return take('me');
    const l = locate(n);
    el.classList.remove('miss'); void el.offsetWidth; el.classList.add('miss');
    if (M.loc && l && l.s === M.loc.s) { Reader.state('同じ陣の札なのでセーフ', ''); GK.sfx('tick'); return; }
    if (!M.meF) {
      M.meF = true; M.st.meFault++;
      GK.sfx('ng');
      Reader.state(M.loc ? 'お手つき（別の陣）' : 'お手つき（空札）', 'warn');
      updateHud();
    }
  }
  function endVS(win) {
    if (M.phase === 'over') return;
    M.phase = 'over'; M.active = false; Voice.stop();
    GK.sfx(win ? 'win' : 'lose');
    const all = rec.vs, r = all[M.lvi] || { w: 0, l: 0, best: 0 };
    const margin = win ? count('cpu') : 0;
    const newBest = win && margin > (r.best || 0);
    if (win) { r.w++; if (newBest) r.best = margin; } else r.l++;
    if (!M.test) { all[M.lvi] = r; GK.store.set('vs', all); }
    const avg = M.st.react.length ? M.st.react.reduce((a, b) => a + b, 0) / M.st.react.length : null;
    const body = `<p class="res-big ${win ? 'win' : 'lose'}">${win ? '勝ち' : '負け'}</p>
      <p style="text-align:center;margin:0 0 12px">${win ? `${M.lv.name}の陣に <b>${count('cpu')}枚</b> 残して勝ちました。` : `あなたの陣に <b>${count('me')}枚</b> 残りました。`}</p>
      <div class="res-stats">
        <div><span>取った札</span><b>${M.st.meTake}枚</b></div><div><span>${M.lv.name}が取った札</span><b>${M.st.cpuTake}枚</b></div>
        <div><span>あなたのお手つき</span><b>${M.st.meFault}回</b></div><div><span>${M.lv.name}のお手つき</span><b>${M.st.cpuFault}回</b></div>
        <div><span>決まり字からの反応</span><b>${avg == null ? '―' : avg.toFixed(2) + '秒'}</b></div><div><span>読まれた歌</span><b>${M.idx + 1}首</b></div>
      </div>
      <p class="res-best">${newBest ? `${M.lv.name}に ${margin}枚差の勝ち ― 自己ベスト！` : `対 ${M.lv.name}：${r.w}勝 ${r.l}敗${r.best ? `（最大 ${r.best}枚差）` : ''}`}</p>`;
    setTimeout(() => {
      GK.modal({ title: '対戦の結果', body, dismissable: false, buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: '相手を選ぶ', value: 'pick' }, { label: 'もう一度', value: 'again', primary: true }] })
        .then((v) => { if (v === 'again') startVS(M.lvi, M.N); else if (v === 'pick') openVSSetup(); else show('title'); });
    }, M.fast ? 50 : 900);
  }

  /* --- ちらし取り --- */
  function startChirashi(N, opts = {}) {
    resetMatch('chirashi');
    M.fast = !!opts.fast; M.N = N;
    const deck = rnd.shuffle(POEMS.map((p) => p.n)).slice(0, N);
    M.order0 = deck.slice();
    M.order = rnd.shuffle(deck.slice());
    M.sides = { me: { grid: [deck.slice()], cols: 0 } };
    $('#mt-ava').hidden = true;
    $('#mt-oname').textContent = `ちらし取り ${N}枚`;
    $('#mt-ocount').textContent = '0.0秒';
    $('#rd-ava').src = 'img/reader.webp';
    layout();
    M.phase = 'count'; M.countT = M.fast ? 0.05 : 2.4;
    Reader.state('');
    $('#rd-kami').innerHTML = '<i class="on">まもなく始まります</i>';
    updateHud();
  }
  function tickChirashi(dt) {
    if (M.phase === 'count') {
      M.countT -= dt;
      const k = Math.ceil(M.countT / 0.8);
      $('#rd-kami').innerHTML = `<i class="on">${k > 0 ? '始めます … ' + k : ''}</i>`;
      if (M.countT <= 0) { M.started = true; M.st.t0 = M.clock; nextChirashi(); }
      return;
    }
    if (M.started && M.phase !== 'over') $('#mt-ocount').textContent = fmtT(M.clock - M.st.t0 + M.st.meFault * 2);
    Reader.update(dt);
    if (M.phase !== 'reading') return;
    if (M.kmAt == null && Reader.revealed >= M.cur.km.length) M.kmAt = M.clock;
    if (Reader.done && !M.hinted) {
      if (M.readEnd == null) M.readEnd = M.clock;
      else if (M.clock > M.readEnd + 4) { M.hinted = true; const e = cardEls.get(M.cur.n); if (e) e.classList.add('pick'); Reader.state('光っている札です', ''); }
    }
  }
  function nextChirashi() {
    M.idx++;
    if (M.idx >= M.order.length) return endChirashi();
    const p = byN(M.order[M.idx]);
    M.cur = p; M.phase = 'reading'; M.kmAt = null; M.readEnd = null; M.hinted = false;
    Reader.shimo(''); Reader.state('');
    Reader.start(p.ky, modernParts(p)[0]);
    updateHud();
  }
  function onTapChirashi(n, el) {
    if (M.phase !== 'reading') return;
    if (n === M.cur.n) {
      const p = M.cur;
      M.phase = 'after';
      M.st.meTake++;
      if (M.kmAt != null) M.st.react.push(Math.max(0, M.clock - M.kmAt));
      removeCard(n); flyAway(n, 'me'); GK.sfx('slap');
      Reader.revealAll(); Reader.markKm(p.km.length);
      Reader.shimo(`${p.sy}<small>　${KANJI_NUM(p.n)}・${p.p}</small>`);
      Reader.state('取り！', 'good');
      updateHud();
      at(M.fast ? 0.05 : 0.55, nextChirashi);
    } else {
      el.classList.remove('miss'); void el.offsetWidth; el.classList.add('miss');
      M.st.meFault++; GK.sfx('ng');
      Reader.state('お手つき ＋2秒', 'warn');
      updateHud();
    }
  }
  function endChirashi() {
    M.phase = 'over'; M.active = false; Voice.stop();
    const time = M.clock - M.st.t0 + M.st.meFault * 2;
    const all = rec.chirashi, prev = all[M.N];
    const best = prev == null || time < prev;
    if (best && !M.test) { all[M.N] = time; GK.store.set('chirashi', all); }
    GK.sfx(best ? 'win' : 'ok');
    const avg = M.st.react.length ? M.st.react.reduce((a, b) => a + b, 0) / M.st.react.length : null;
    const body = `<p class="res-big win">${fmtT(time)}</p>
      <div class="res-stats">
        <div><span>取った札</span><b>${M.st.meTake}枚</b></div><div><span>お手つき</span><b>${M.st.meFault}回（+${M.st.meFault * 2}秒）</b></div>
        <div><span>決まり字からの反応</span><b>${avg == null ? '―' : avg.toFixed(2) + '秒'}</b></div><div><span>これまでの最速</span><b>${prev == null ? '―' : fmtT(prev)}</b></div>
      </div>
      <p class="res-best">${best ? '自己ベスト更新！' : ''}</p>`;
    setTimeout(() => {
      GK.modal({ title: `ちらし取り ${M.N}枚の結果`, body, dismissable: false, buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: 'もう一度', value: 'again', primary: true }] })
        .then((v) => { if (v === 'again') startChirashi(M.N); else show('title'); });
    }, M.fast ? 50 : 700);
  }

  // input on the field: pointerdown for speed
  ['#side-me', '#side-cpu'].forEach((sel) => $(sel).addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.fuda'); if (!el || !M.active || M.paused) return;
    e.preventDefault();
    const n = +el.dataset.n;
    if (M.mode === 'vs') onTapVS(n, el); else onTapChirashi(n, el);
  }));
  $('#mt-voice').addEventListener('click', () => {
    if (!Voice.usable()) { GK.toast('この端末では日本語の音声読み上げを使えません'); return; }
    SET.voice = !SET.voice; saveSet();
    if (!SET.voice) Voice.stop();
    $('#mt-voice').setAttribute('aria-pressed', String(voiceOn()));
    $('#mt-voice').textContent = voiceOn() ? '声 ON' : '声 OFF';
    GK.toast(SET.voice ? '次の歌から声で読み上げます' : '文字だけで読み上げます');
  });
  new ResizeObserver(() => { if (M.active) layout(); if (cur === 'practice') sizePractice(); }).observe($('#app'));

  GK.loop((dt) => {
    if (!M.active || M.paused || cur !== 'match') return;
    M.clock += dt;
    for (let i = 0; i < M.timers.length; i++) { const t = M.timers[i]; if (t.t <= M.clock) { M.timers.splice(i--, 1); t.fn(); if (!M.active) return; } }
    if (M.mode === 'vs') {
      tickVS(dt);
      if (M.phase === 'send' && M.clock > M.sendDeadline) { const mine = M.sides.me.grid.flat().filter((x) => x != null); if (mine.length) sendMine(rnd.pick(mine)); }
    } else tickChirashi(dt);
  });

  /* ---------------- 決まり字練習 ---------------- */
  const P = { q: 0, total: 10, ok: 0, streak: 0, times: [], cur: null, choices: [], answered: false };
  const INTERVAL = [1, 3, 7, 15, 30, 60];
  function pracPool() {
    const r = SET.prange, srs = rec.srs;
    let pool = POEMS;
    if (r === 'weak') pool = POEMS.filter((p) => srs[p.n] && srs[p.n][0] <= 1);
    else if (r !== 'all') { const L = +r; pool = POEMS.filter((p) => (L >= 4 ? p.km.length >= 4 : p.km.length === L)); }
    return pool.length >= 4 ? pool : POEMS;
  }
  function pickQuestion() {
    const srs = rec.srs, T = GK.store.get('srsT', 0);
    const pool = pracPool().filter((p) => !P.cur || p.n !== P.cur.n);
    // due first (seen and due), then new ones, then the rest by due time
    const scored = pool.map((p) => { const s = srs[p.n]; return { p, k: s ? (s[1] <= T ? s[1] - 1000 : s[1]) : T + rnd() * 6 - 3 }; });
    scored.sort((a, b) => a.k - b.k);
    return rnd.pick(scored.slice(0, 3)).p;
  }
  function startPractice() {
    Object.assign(P, { q: 0, ok: 0, streak: 0, times: [], cur: null });
    show('practice');
    nextQuestion();
  }
  function nextQuestion() {
    if (P.q >= P.total) return endPractice();
    P.q++; P.answered = false;
    const p = pickQuestion(); P.cur = p;
    // distractors: similar sound first
    const others = POEMS.filter((q) => q.n !== p.n);
    const near = rnd.shuffle(others.filter((q) => SND[q.n - 1][0] === SND[p.n - 1][0]));
    const far = rnd.shuffle(others.filter((q) => !near.includes(q)));
    const ch = near.slice(0, 2).concat(far).slice(0, 3);
    P.choices = rnd.shuffle([p, ...ch]);
    const box = $('#pr-ans'); box.innerHTML = '';
    P.choices.forEach((c, i) => { const e = fudaEl(c); const k = document.createElement('span'); k.className = 'key'; k.textContent = i + 1; e.appendChild(k); e.addEventListener('click', () => answer(i)); box.appendChild(e); });
    const txt = $('#pr-text');
    if (SET.pmode === 'km') {
      $('#pr-hint').textContent = '決まり字はこれ。下の句（取り札）はどれ？';
      txt.className = 'pr-text'; txt.innerHTML = `<span class="km">${p.km}</span>…`;
    } else {
      $('#pr-hint').textContent = 'この上の句の取り札はどれ？';
      txt.className = 'pr-text long'; txt.textContent = p.k;
    }
    $('#pr-exp').hidden = true; $('#pr-q').hidden = false;
    $('#pr-step').textContent = `第${P.q}問 / ${P.total}`;
    $('#pr-streak').textContent = P.streak >= 2 ? `${P.streak}問連続正解` : '';
    $('#pr-master').textContent = `覚えた歌 ${mastered()} / 100`;
    P.t0 = performance.now();
    sizePractice();
    if (voiceOn() && SET.pmode !== 'km') Voice.speak(modernParts(p)[0], SPEEDS[SET.speed].rate);
  }
  function sizePractice() {
    const box = $('#pr-ans'); if (!box) return;
    const r = box.getBoundingClientRect();
    const g = r.width < 500 ? 10 : 22;
    const cw = Math.max(40, Math.min(118, (r.width - 3 * g) / 4, (r.height - 40) * 0.72));
    box.style.setProperty('--cw', cw.toFixed(1) + 'px'); box.style.setProperty('--ch', (cw / 0.72).toFixed(1) + 'px');
  }
  function answer(i) {
    if (P.answered || cur !== 'practice') return;
    P.answered = true;
    const p = P.cur, ok = P.choices[i].n === p.n, dt = (performance.now() - P.t0) / 1000;
    const els = $$('#pr-ans .fuda');
    els.forEach((e, k) => { if (P.choices[k].n === p.n) e.classList.add('ok'); else if (k === i) e.classList.add('ng'); });
    const srs = rec.srs, T = GK.store.get('srsT', 0) + 1;
    const s = srs[p.n] || [0, 0];
    s[0] = ok ? Math.min(5, s[0] + 1) : 0; s[1] = T + INTERVAL[s[0]];
    srs[p.n] = s;
    if (!P.test) { GK.store.set('srs', srs); GK.store.set('srsT', T); }
    if (ok) { P.ok++; P.streak++; P.times.push(dt); GK.sfx('ok'); } else { P.streak = 0; GK.sfx('ng'); }
    const best = GK.store.get('streak', 0);
    if (P.streak > best && !P.test) GK.store.set('streak', P.streak);
    const kmHtml = `<b>${p.km}</b>${p.ky.replace(/\s+/g, '').slice(p.km.length)}`;
    const ex = $('#pr-exp');
    ex.innerHTML = `<div class="ex-body"><span class="res ${ok ? 'ok' : 'ng'}">${ok ? '正解' : '不正解'}</span>　<small>${dt.toFixed(1)}秒・箱${s[0]}</small>
      <div class="ex-poem">${p.k}　${p.s}</div>
      <div class="ex-yomi">${kmHtml} ／ ${p.sy}　― ${KANJI_NUM(p.n)}・${p.p}（決まり字 ${p.km.length}字）</div></div>
      <button class="gk-btn primary" type="button" id="pr-next">${P.q >= P.total ? '結果へ' : '次へ'}</button>`;
    ex.hidden = false;
    $('#pr-next').addEventListener('click', () => { GK.sfx('click'); nextQuestion(); });
    $('#pr-streak').textContent = P.streak >= 2 ? `${P.streak}問連続正解` : '';
    $('#pr-master').textContent = `覚えた歌 ${mastered()} / 100`;
  }
  function endPractice() {
    const avg = P.times.length ? P.times.reduce((a, b) => a + b, 0) / P.times.length : null;
    GK.sfx(P.ok >= 8 ? 'win' : 'ok');
    const body = `<p class="res-big ${P.ok >= 7 ? 'win' : 'lose'}">${P.ok} / ${P.total} 問正解</p>
      <div class="res-stats">
        <div><span>正解の平均時間</span><b>${avg == null ? '―' : avg.toFixed(1) + '秒'}</b></div><div><span>覚えた歌（箱3以上）</span><b>${mastered()} / 100</b></div>
        <div><span>最高連続正解</span><b>${GK.store.get('streak', 0)}問</b></div><div><span>出題の範囲</span><b>${rangeLabel(SET.prange)}</b></div>
      </div>
      <p class="note">正解した歌は間をあけて、まちがえた歌はすぐにまた出題されます。</p>`;
    GK.modal({ title: '練習の結果', body, dismissable: false, buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: '設定を変える', value: 'set' }, { label: 'もう 10 問', value: 'again', primary: true }] })
      .then((v) => { if (v === 'again') startPractice(); else if (v === 'set') openPracticeSetup(); else show('title'); });
  }
  const RANGES = [['all', 'すべて'], ['1', '1字'], ['2', '2字'], ['3', '3字'], ['4', '4字以上'], ['weak', '苦手']];
  const rangeLabel = (k) => (RANGES.find((r) => r[0] === k) || RANGES[0])[1];
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back')) return;
    if (cur === 'practice') {
      if (/^[1-4]$/.test(e.key)) answer(+e.key - 1);
      else if ((e.key === 'Enter' || e.key === ' ') && P.answered) { e.preventDefault(); nextQuestion(); }
    }
  });

  /* ---------------- 百首一覧 ---------------- */
  let lsFilter = 'all';
  const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  function renderList() {
    const q = hira(($('#ls-q').value || '').trim().replace(/\s+/g, ''));
    const qs = q ? sound(q) : '';
    const srs = rec.srs;
    const items = POEMS.filter((p) => {
      if (lsFilter === 'weak' ? !(srs[p.n] && srs[p.n][0] <= 1) : lsFilter !== 'all' && p.km.length !== +lsFilter) return false;
      if (!q) return true;
      if (/^\d+$/.test(q)) return p.n === +q;
      const hay = (p.k + p.s + p.p).replace(/\s+/g, '');
      const kana = (p.ky + p.sy).replace(/\s+/g, '');
      return hay.includes(q) || kana.includes(q) || sound(kana).includes(qs) || p.t.replace(/\s+/g, '').includes(q);
    });
    const ol = $('#ls-list');
    ol.innerHTML = items.length ? items.map((p) => `<li data-n="${p.n}"><span class="ls-no">${p.n}</span><span class="ls-poem">${p.k}　${p.s}<small>${p.p}</small></span><span class="ls-km">${p.km}</span></li>`).join('') : '<li class="ls-empty">見つかりませんでした</li>';
  }
  function openList() {
    show('list');
    const chips = [['all', 'すべて'], ['1', '1字決まり'], ['2', '2字'], ['3', '3字'], ['4', '4字'], ['5', '5字'], ['6', '6字'], ['weak', '苦手']];
    $('#ls-chips').innerHTML = chips.map(([k, l]) => `<button type="button" data-k="${k}" class="${k === lsFilter ? 'on' : ''}">${l}</button>`).join('');
    renderList();
  }
  $('#ls-chips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; lsFilter = b.dataset.k; $$('#ls-chips button').forEach((x) => x.classList.toggle('on', x === b)); GK.sfx('click'); renderList(); });
  $('#ls-q').addEventListener('input', renderList);
  $('#ls-back').addEventListener('click', () => { GK.sfx('click'); show('title'); });
  $('#ls-list').addEventListener('click', (e) => { const li = e.target.closest('li[data-n]'); if (li) openDetail(+li.dataset.n); });
  function openDetail(n) {
    const p = byN(n), srs = rec.srs[n];
    const wrap = document.createElement('div');
    wrap.className = 'dt';
    const card = fudaEl(p); card.tabIndex = -1;
    card.style.setProperty('--cw', '96px'); card.style.setProperty('--ch', '133px');
    const body = document.createElement('div');
    body.className = 'dt-body';
    body.innerHTML = `<div class="dt-poem">${p.k}<br>${p.s}</div>
      <div class="dt-yomi"><b>${p.km}</b>${p.ky.replace(/\s+/g, '').slice(p.km.length)}<br>${p.sy}</div>
      <div class="dt-meta">${KANJI_NUM(p.n)}　${p.p}　／　決まり字 ${p.km.length}字「${p.km}」${srs ? `　／　練習の箱 ${srs[0]}` : ''}</div>`;
    wrap.append(card, body);
    const buttons = [{ label: '閉じる', value: null, primary: true }];
    if (Voice.usable()) buttons.unshift({ label: '読み上げる', value: 'speak' });
    GK.modal({ title: `${p.n}番　${p.p}`, body: wrap, wide: true, buttons }).then((v) => {
      if (v === 'speak') { Voice.speak(p.t, SPEEDS[SET.speed].rate); openDetail(n); } else Voice.stop();
    });
  }

  /* ---------------- setup dialogs ---------------- */
  function seg(name, opts, val, disabled = () => false) {
    return `<span class="seg" data-name="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}" ${disabled(v) ? 'disabled' : ''}>${l}</button>`).join('')}</span>`;
  }
  function wireSegs(root, onChange) {
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.seg button'); if (!b || b.disabled) return;
      const s = b.parentNode; $$('button', s).forEach((x) => x.classList.toggle('on', x === b));
      GK.sfx('click'); onChange(s.dataset.name, b.dataset.v);
    });
  }
  function readingOpts() {
    const v = Voice.usable();
    return `<div class="opt-row"><span>読み上げの速さ</span>${seg('speed', SPEEDS.map((s, i) => [i, s.label]), SET.speed)}</div>
      <div class="opt-row"><span>音声</span>${seg('voice', [[0, '文字だけ'], [1, '声も出す']], SET.voice && v ? 1 : 0, (x) => x === 1 && !v)}</div>
      ${v ? '' : '<p class="note">この端末には日本語の読み上げ音声がないため、文字だけで読み上げます。</p>'}`;
  }
  function applyOpt(k, v) {
    if (k === 'speed') SET.speed = +v;
    else if (k === 'voice') SET.voice = v === '1';
    else if (k === 'flip') SET.flip = v === '1';
    else if (k === 'count') SET.count = +v;
    else if (k === 'chirashi') SET.chirashi = +v;
    else if (k === 'pmode') SET.pmode = v;
    else if (k === 'prange') SET.prange = v;
    saveSet();
  }
  function openVSSetup() {
    const mc = maxCount();
    let N = SET.count && SET.count <= mc ? SET.count : mc >= 25 ? 25 : 12;
    let lv = SET.lv;
    const vs = rec.vs;
    const root = document.createElement('div');
    root.innerHTML = `<div class="lv-list">${LEVELS.map((L, i) => { const r = vs[i]; return `<button type="button" class="lv ${i === lv ? 'on' : ''}" data-lv="${i}"><img src="img/${L.img}.webp" alt=""><span><b>${'★'.repeat(i + 1)} ${L.name}<small style="display:inline">（${L.kana}）</small></b><small>${L.title}</small><small class="rec">${r ? `${r.w}勝 ${r.l}敗` : 'まだ対戦していません'}</small></span></button>`; }).join('')}</div>
      <div class="opt-row"><span>札の数（各陣）</span>${seg('count', [[25, '25枚（本式）'], [15, '15枚'], [12, '12枚'], [8, '8枚']], N, (x) => x > mc)}</div>
      <div class="opt-row"><span>相手の札</span>${seg('flip', [[0, 'こちら向き'], [1, '逆さ（本式）']], SET.flip ? 1 : 0)}</div>
      ${readingOpts()}
      ${mc < 25 ? '<p class="note">この画面の大きさでは、各陣 15 枚までにしています。</p>' : ''}`;
    root.addEventListener('click', (e) => { const b = e.target.closest('.lv'); if (!b) return; lv = +b.dataset.lv; $$('.lv', root).forEach((x) => x.classList.toggle('on', x === b)); GK.sfx('select'); });
    wireSegs(root, (k, v) => { applyOpt(k, v); if (k === 'count') N = +v; });
    GK.modal({ title: '対戦の相手を選ぶ', body: root, wide: true, buttons: [{ label: 'やめる', value: null, ghost: true }, { label: '対戦を始める', value: 'go', primary: true }] })
      .then((v) => { if (v !== 'go') { if (cur !== 'title') show('title'); return; } SET.lv = lv; saveSet(); GK.sfx('koto'); startVS(lv, N); });
  }
  function openChirashiSetup() {
    const ch = rec.chirashi;
    const root = document.createElement('div');
    root.innerHTML = `<p style="margin-top:0">並べた札だけが読まれます。全部の札を取るまでの時間を競います（お手つきは 1 回 2 秒の加算）。</p>
      <div class="opt-row"><span>札の数</span>${seg('chirashi', [[10, '10枚'], [20, '20枚'], [30, '30枚']], SET.chirashi)}</div>
      <p class="note">最速：10枚 ${ch[10] ? fmtT(ch[10]) : '―'}　/　20枚 ${ch[20] ? fmtT(ch[20]) : '―'}　/　30枚 ${ch[30] ? fmtT(ch[30]) : '―'}</p>
      ${readingOpts()}`;
    wireSegs(root, applyOpt);
    GK.modal({ title: 'ちらし取り', body: root, wide: true, buttons: [{ label: 'やめる', value: null, ghost: true }, { label: '始める', value: 'go', primary: true }] })
      .then((v) => { if (v === 'go') { GK.sfx('koto'); startChirashi(SET.chirashi); } else if (cur !== 'title') show('title'); });
  }
  function openPracticeSetup() {
    const root = document.createElement('div');
    root.innerHTML = `<p style="margin-top:0">決まり字（または上の句）を見て、正しい取り札を 4 枚から選びます。覚えた歌は間をあけて、まちがえた歌はすぐに出題されます。</p>
      <div class="opt-row"><span>出題</span>${seg('pmode', [['km', '決まり字'], ['kami', '上の句']], SET.pmode)}</div>
      <div class="opt-row"><span>範囲</span>${seg('prange', RANGES, SET.prange)}</div>
      <p class="note">覚えた歌：${mastered()} / 100（3 回続けて正解すると「覚えた」になります）</p>`;
    wireSegs(root, applyOpt);
    GK.modal({ title: '決まり字練習', body: root, wide: true, buttons: [{ label: 'やめる', value: null, ghost: true }, { label: '10 問はじめる', value: 'go', primary: true }] })
      .then((v) => { if (v === 'go') startPractice(); else if (cur !== 'title') show('title'); });
  }
  function openSettings() {
    const root = document.createElement('div');
    root.innerHTML = `${readingOpts()}
      <div class="opt-row"><span>対戦の相手の札</span>${seg('flip', [[0, 'こちら向き'], [1, '逆さ（本式）']], SET.flip ? 1 : 0)}</div>
      <p class="note">音声は端末に入っている日本語の音声で読み上げます（通信はしません）。歌の文字は、声がなくても一音ずつ表示されます。</p>`;
    wireSegs(root, applyOpt);
    return GK.modal({ title: '読み上げの設定', body: root, wide: true, buttons: [{ label: '記録を消す', value: 'reset', ghost: true }, { label: '閉じる', value: null, primary: true }] }).then((v) => {
      if (v === 'reset') return GK.modal({ title: '記録を消しますか？', body: '対戦の成績・ちらし取りの最速・練習の記録をすべて消します。', buttons: [{ label: 'やめる', value: null, ghost: true }, { label: '消す', value: 'yes', primary: true }] })
        .then((y) => { if (y === 'yes') { ['vs', 'chirashi', 'srs', 'srsT', 'streak'].forEach((k) => GK.store.del(k)); GK.toast('記録を消しました'); refreshTitle(); } });
    });
  }

  $('#sc-title').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    GK.sfx('select');
    const go = b.dataset.go;
    if (go === 'vs') openVSSetup(); else if (go === 'chirashi') openChirashiSetup(); else if (go === 'practice') openPracticeSetup(); else openList();
  });
  $('#ti-set').addEventListener('click', () => { GK.sfx('click'); openSettings(); });

  /* ---------------- menu & help ---------------- */
  function openMenu() {
    if (cur === 'title') return openSettings();
    const inMatch = cur === 'match' && M.active;
    M.paused = true; Voice.stop();
    const buttons = [{ label: 'タイトルへ', value: 'title', ghost: true }];
    if (inMatch) buttons.push({ label: 'やり直す', value: 'retry' });
    buttons.push({ label: '続ける', value: null, primary: true });
    GK.modal({ title: 'メニュー', body: inMatch ? '<p>試合を中断しています。</p>' : '<p>タイトルに戻りますか？</p>', buttons }).then((v) => {
      M.paused = false;
      if (v === 'title') { M.active = false; show('title'); } else if (v === 'retry') { if (M.mode === 'vs') startVS(M.lvi, M.N); else startChirashi(M.N); }
    });
  }
  const HELP = `
    <p>小倉百人一首の 100 首で遊ぶかるたです。読手が上の句を一音ずつ読み上げます。その歌の<b>下の句が書かれた取り札</b>を、相手より早くタップ（クリック）します。</p>
    <h3>対戦（CPU と競技かるた風に）</h3>
    <ul>
      <li>上が相手の陣、下が自分の陣。札は各陣 25 枚（画面が小さいときは 15・12・8 枚）を 3 段に並べます（横長のスマホは 2 段）。</li>
      <li>読まれる歌の半分ほどは場にない<b>空札</b>です。空札で札に触ると<b>お手つき</b>です。</li>
      <li>相手の陣の札を取ったら、自分の札を 1 枚選んで相手に<b>送ります</b>（送り札）。</li>
      <li>お手つきをすると、相手から札が 1 枚送られてきます。読まれた札と<b>同じ陣</b>の別の札に触れたときはセーフです。</li>
      <li>自分の陣の札が先になくなった方の勝ちです。</li>
      <li>相手は 4 人。強い相手ほど反応が速く、読まれ終わった歌を覚えて「決まり字の変化」も使ってきます。</li>
    </ul>
    <h3>ちらし取り</h3>
    <p>並べた札（10・20・30 枚）だけが読まれます。全部取るまでのタイムを競います。お手つきは 1 回 2 秒の加算です。</p>
    <h3>決まり字練習</h3>
    <p>決まり字（その歌だと分かる最初の数文字）か上の句を見て、取り札を 4 枚から選びます。<kbd>1</kbd>〜<kbd>4</kbd> キーでも答えられます。まちがえた歌ほどよく出ます。</p>
    <h3>決まり字とは</h3>
    <p>「む」で始まる歌は「むらさめの」だけなので、「む」と聞こえた瞬間に取れます（1 字決まり）。「あさぼらけ」で始まる歌は 2 首あるので 6 字目まで聞かないと分かりません（6 字決まり）。100 首の内訳は 1字 7・2字 42・3字 37・4字 6・5字 2・6字 6 首です。</p>
    <h3>読み上げ</h3>
    <p>右下の「声」ボタンか設定で、端末の日本語音声による読み上げを使えます。音声がない端末では文字だけで読み上げます。</p>`;
  GK.init({ id: 'hyakunin-isshu', title: 'みやび札', help: HELP, menu: openMenu });
  // pause the match while any dialog is open
  new MutationObserver(() => { const open = !!document.querySelector('.gk-modal-back'); if (M.active) M.paused = open || M.menuPause; }).observe(document.body, { childList: true });
  addEventListener('visibilitychange', () => { if (document.hidden) Voice.stop(); });
  show('title');

  /* ---------------- self-test (npm run game-check) ---------------- */
  const until = async (fn, ms = 6000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) return false; await GK.wait(25); } return true; };
  const tap = (el) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1 }));
  const clickBtn = async (label) => { await until(() => $$('.gk-modal .gk-btn').some((b) => b.textContent.includes(label)), 3000); const b = $$('.gk-modal .gk-btn').find((x) => x.textContent.includes(label)); if (b) b.click(); await GK.wait(260); return !!b; };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG: ' + m); };
    // data
    const dist = {}; POEMS.forEach((p) => { dist[p.km.length] = (dist[p.km.length] || 0) + 1; });
    if (JSON.stringify(dist) !== JSON.stringify({ 1: 7, 2: 42, 3: 37, 4: 6, 5: 2, 6: 6 })) fail('kimariji ' + JSON.stringify(dist));
    // 対戦
    M.test = true; P.test = true;
    startVS(0, 8, { fast: true });
    M.lv = Object.assign({}, LEVELS[0], { react: [30, 30], err: 0 });
    await GK.wait(200);
    if (window.__shot) await window.__shot('vs-field');
    let taken = 0;
    for (let k = 0; k < 40 && taken < 2; k++) {
      if (!(await until(() => M.phase === 'reading' || !M.active, 4000))) { fail('no reading phase'); break; }
      if (M.loc) {
        await until(() => Reader.revealed >= 4, 2000);
        const el = cardEls.get(M.cur.n);
        if (taken === 1 && window.__shot) await window.__shot('vs-reading');
        tap(el);
        if (M.takenBy !== 'me') fail('tap did not take'); else taken++;
        await until(() => M.phase === 'send' || M.phase === 'between' || M.phase === 'reading', 3000);
        if (M.phase === 'send') { const mine = $('#side-me .fuda'); tap(mine); }
      } else await until(() => M.phase !== 'reading', 3000);
    }
    notes.push(`vs: took ${taken}, field me ${count('me')} / cpu ${count('cpu')}`);
    endVS(true);
    await until(() => !!$('.gk-modal'), 2000);
    if (window.__shot) await window.__shot('vs-result');
    await clickBtn('タイトルへ');
    if (cur !== 'title') fail('vs result → title');
    // ちらし取り
    startChirashi(10, { fast: true });
    await until(() => M.phase === 'reading', 3000);
    for (let i = 0; i < 3; i++) { await until(() => M.phase === 'reading', 2000); tap(cardEls.get(M.cur.n)); }
    if (M.st.meTake < 3) fail('chirashi takes ' + M.st.meTake);
    if (window.__shot) await window.__shot('chirashi');
    M.idx = M.order.length; endChirashi();
    await until(() => !!$('.gk-modal'), 2000);
    await clickBtn('タイトルへ');
    // 練習
    SET.pmode = 'km';
    startPractice();
    await GK.wait(120);
    answer(P.choices.findIndex((c) => c.n === P.cur.n));
    if (P.ok !== 1) fail('practice correct answer not counted');
    if (window.__shot) await window.__shot('practice');
    nextQuestion();
    answer((P.choices.findIndex((c) => c.n === P.cur.n) + 1) % 4);
    if (P.ok !== 1) fail('practice wrong answer counted');
    P.q = P.total; nextQuestion();
    await until(() => !!$('.gk-modal'), 2000);
    if (window.__shot) await window.__shot('practice-result');
    await clickBtn('タイトルへ');
    // 一覧
    openList();
    $('#ls-q').value = 'むらさめ'; renderList();
    if ($$('#ls-list li[data-n]').length !== 1) fail('search むらさめ → ' + $$('#ls-list li[data-n]').length);
    $('#ls-q').value = ''; lsFilter = '1'; renderList();
    if ($$('#ls-list li[data-n]').length !== 7) fail('filter 1字');
    if (window.__shot) await window.__shot('list');
    lsFilter = 'all'; $('#ls-q').value = '';
    show('title');
    M.test = false; P.test = false;
    return { ok, notes };
  };
})();
