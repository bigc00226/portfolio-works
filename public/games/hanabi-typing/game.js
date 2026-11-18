/* ことば花火 ― 打って打ち上げるタイピング */
(() => {
  'use strict';
  const { WORDS } = window.HANABI_WORDS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rnd = GK.random;
  const TIMES = [30, 60, 90, 120];
  const DIFFS = [['easy', 'やさしい', '短い言葉'], ['normal', 'ふつう', '言葉と短い文'], ['hard', 'むずかしい', '長い文']];
  const SET = Object.assign({ time: 60, diff: 'normal', kb: null }, GK.store.get('settings', {}));
  const saveSet = () => GK.store.set('settings', SET);
  /** rank by effective keys per second (keys/s × accuracy) — firework names, small to big */
  const RANKS = [
    [0, '線香花火', 'ぱちぱちと、小さくても味のある光。指をならして次はもっと大きく！'],
    [1.0, 'ねずみ花火', '足もとでくるくる元気いっぱい。リズムがつかめてきました。'],
    [1.6, '三号玉', '夜空に最初の一輪。ここからが本番です。'],
    [2.2, '五号玉', '川面に映る大きな花。見物客から拍手が起きています。'],
    [2.8, '八重芯菊', '芯が二重に光る腕前。花火師も認める指さばき。'],
    [3.5, '千輪菊', '小さな花が一度に咲きそろう、見事な連打。'],
    [4.3, 'スターマイン', '息つく間もない連続打ち上げ。会場が大歓声です。'],
    [5.2, '尺玉', '夜空いっぱいの大輪。まさに名人の打鍵です。'],
  ];
  const rankOf = (e) => { let i = 0; RANKS.forEach((r, k) => { if (e >= r[0]) i = k; }); return i; };
  const bestKey = () => `${SET.time}-${SET.diff}`;

  /* ---------------- sound ---------------- */
  GK.sfx.define('key', () => GK.tone({ f: 1250 + rnd() * 120, d: 0.03, type: 'triangle', v: 0.05 }));
  GK.sfx.define('miss', () => GK.tone({ f: 190, f2: 120, d: 0.13, type: 'square', v: 0.07 }));
  GK.sfx.define('whistle', () => GK.tone({ f: 600, f2: 1700, d: 0.55, type: 'sine', v: 0.035 }));
  GK.sfx.define('don', () => { GK.noise({ d: 0.9, v: 0.5, f: 380, filter: 'lowpass' }); GK.tone({ f: 72, f2: 32, d: 0.6, type: 'sine', v: 0.45 }); });
  GK.sfx.define('pon', () => { GK.noise({ d: 0.4, v: 0.3, f: 700, filter: 'lowpass' }); GK.tone({ f: 120, f2: 60, d: 0.25, type: 'sine', v: 0.3 }); });
  GK.sfx.define('crackle', () => { for (let i = 0; i < 10; i++) GK.noise({ d: 0.03, v: 0.16, f: 3500 + rnd() * 3500, q: 2, filter: 'bandpass', at: 0.05 + rnd() * 0.6 }); });
  const SONG = {
    bpm: 116, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.09, notes: 'D5 - E5 D5 B4 - A4 - | B4 - D5 - E5 - - - | G5 - E5 D5 E5 - D5 B4 | A4 - - - . . . . | B4 - A4 G4 A4 - B4 - | D5 - B4 A4 G4 - E4 - | G4 - A4 B4 D5 - E5 D5 | D5 - - - . . . .' },
      { type: 'sine', v: 0.11, notes: 'D3 . . . A2 . . . | G2 . . . D3 . . . | E3 . . . B2 . . . | A2 . . . A2 . . . | G2 . . . D3 . . . | B2 . . . E3 . . . | G2 . . . A2 . . . | D3 . . . D3 . . .' },
      { type: 'square', v: 0.025, notes: '. A4 . A4 . B4 . A4 | . G4 . G4 . A4 . B4 | . B4 . B4 . A4 . G4 | . E4 . E4 . A4 . A4 | . G4 . G4 . E4 . G4 | . B4 . A4 . G4 . E4 | . E4 . G4 . A4 . B4 | . A4 . A4 . D5 . .' },
    ],
    drums: { t: 'x . . x x . . . x . . x x . x .', h: '. . x . . . x . . . x . . . x .' },
  };
  let gestured = false;
  const startMusic = () => { if (gestured && !GK.music.playing) GK.music.play(SONG); };
  const firstGesture = () => { if (!gestured) { gestured = true; startMusic(); } };
  addEventListener('pointerdown', firstGesture, { capture: true });
  addEventListener('keydown', firstGesture, { capture: true });

  /* ---------------- fireworks (canvas particles) ---------------- */
  const fxCanvas = $('#fx');
  const view = GK.fit(fxCanvas, { onResize: () => drawStars() });
  const ctx = view.ctx;
  const PAL = [['#ff5a5a', '#ffd0a0'], ['#ffd34d', '#fff6d0'], ['#6fd3ff', '#e6f9ff'], ['#b98bff', '#ffd6ff'], ['#7dff9a', '#eaffea'], ['#ff7ad9', '#ffe0f4'], ['#ff9a3c', '#ffe2b8'], ['#ffffff', '#9fd8ff']];
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const PALRGB = PAL.map((p) => p.map(rgb));
  const GOLD = [rgb('#ffcf6b'), rgb('#fff1c2')];
  const parts = [], rockets = [], later = [];
  let fxTime = 0;
  const scale = () => GK.clamp(Math.min(view.w, view.h) / 760, 0.55, 1.25);
  function spark(x, y, vx, vy, life, c1, c2, size, o = {}) {
    if (parts.length > 2600) return;
    parts.push({ x, y, vx, vy, life, max: life, c1, c2: c2 || c1, size, drag: o.drag == null ? 1.4 : o.drag, grav: o.grav == null ? 46 : o.grav, tail: o.tail || 0, glit: o.glit || 0, flick: o.flick || 0 });
  }
  /** a shell bursts: type botan / kiku / yanagi / senrin / ring, power ≈ 1 */
  function burst(x, y, type, pal, power = 1) {
    const s = scale() * (0.75 + 0.35 * power), c = pal || rnd.pick(PALRGB);
    const ring = (n, sp, life, o) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rnd() * 0.05, v = sp * (o.even ? 1 : 0.55 + 0.45 * Math.sqrt(rnd())); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.85 + rnd() * 0.3), o.c1 || c[0], o.c2 || c[1], o.size || 2.4, o); } };
    if (type === 'botan') { ring(Math.round(90 * power), 230 * s, 1.5, { size: 2.8, flick: 0.4 }); ring(26, 90 * s, 1.1, { c1: c[1], c2: c[1], size: 2.2 }); }
    else if (type === 'kiku') { ring(Math.round(120 * power), 260 * s, 1.7, { size: 2.2, tail: 14 }); }
    else if (type === 'yanagi') { ring(Math.round(80 * power), 170 * s, 3.2, { c1: GOLD[0], c2: GOLD[1], size: 2.3, drag: 1.1, grav: 70, glit: 22 }); }
    else if (type === 'ring') { ring(64, 220 * s, 1.6, { even: true, size: 2.6, tail: 8 }); ring(30, 120 * s, 1.4, { even: true, c1: c[1], c2: c[0], size: 2 }); }
    else if (type === 'senrin') {
      ring(30, 120 * s, 0.9, { size: 2 });
      const n = 8 + Math.round(power * 3);
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, r = (40 + rnd() * 70) * s;
        later.push({ t: fxTime + 0.3 + rnd() * 0.45, fn: () => { const cc = rnd.pick(PALRGB), bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r; for (let k = 0; k < 22; k++) { const aa = rnd() * Math.PI * 2, v = (60 + rnd() * 60) * s; spark(bx, by, Math.cos(aa) * v, Math.sin(aa) * v, 0.55 + rnd() * 0.3, cc[0], cc[1], 2, { drag: 2.4, grav: 30 }); } } });
      }
      GK.sfx('crackle');
    }
    // flash
    spark(x, y, 0, 0, 0.18, [255, 255, 240], [255, 220, 160], 26 * s, { drag: 0, grav: 0 });
    GK.sfx(power > 1.2 ? 'don' : 'pon');
  }
  /** an automatic rocket from the river to (tx, ty) */
  function launch(tx, ty, type, delay = 0, power = 1) {
    rockets.push({ x: tx + (rnd() - 0.5) * 30, y: view.h + 10, tx, ty, type, power, delay, vy: -(view.h - ty) * 1.25, pal: rnd.pick(PALRGB) });
  }
  function starMine(n) {
    for (let i = 0; i < n; i++) launch(view.w * (0.12 + rnd() * 0.76), view.h * (0.12 + rnd() * 0.3), rnd.pick(['botan', 'kiku', 'ring', 'botan', 'senrin']), i * 0.13 + rnd() * 0.08, 0.7 + rnd() * 0.4);
  }
  function stepFx(dt) {
    fxTime += dt;
    for (let i = later.length - 1; i >= 0; i--) if (later[i].t <= fxTime) { const f = later[i].fn; later.splice(i, 1); f(); }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      if (r.delay > 0) { r.delay -= dt; if (r.delay <= 0) GK.sfx('whistle'); continue; }
      r.y += r.vy * dt; r.vy *= Math.pow(0.35, dt);
      r.x += (r.tx - r.x) * Math.min(1, dt * 2);
      spark(r.x + (rnd() - 0.5) * 2, r.y + 4, (rnd() - 0.5) * 20, 30 + rnd() * 30, 0.35 + rnd() * 0.25, GOLD[0], GOLD[1], 1.8, { drag: 2, grav: 40 });
      if (r.y <= r.ty || r.vy > -60) { burst(r.x, r.y, r.type, r.pal, r.power); rockets.splice(i, 1); }
    }
    // the shell of the word being typed climbs with the typing
    if (G.shell && G.phase === 'play') {
      const sh = G.shell;
      sh.y += (sh.target - sh.y) * Math.min(1, dt * 9);
      sh.wob *= Math.pow(0.02, dt);
      const x = sh.x + Math.sin(fxTime * 40) * sh.wob;
      if (sh.y < view.h + 5) spark(x, sh.y + 3, (rnd() - 0.5) * 16, 40 + rnd() * 30, 0.4, GOLD[0], GOLD[1], 1.7, { drag: 2, grav: 30 });
      sh.drawX = x;
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy = p.vy * d + p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.tail && rnd() < p.tail * dt) spark(p.x, p.y, p.vx * 0.05, p.vy * 0.05 + 10, 0.35, p.c1, p.c2, 1.4, { drag: 3, grav: 20 });
      if (p.glit && rnd() < p.glit * dt) spark(p.x, p.y, (rnd() - 0.5) * 8, 12, 0.9 + rnd() * 0.6, GOLD[0], GOLD[1], 1.3, { drag: 2.5, grav: 26, flick: 0.8 });
    }
  }
  function drawFx(dt) {
    const c = ctx;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt * 10)).toFixed(3)})`;
    c.fillRect(0, 0, fxCanvas.width, fxCanvas.height);
    c.restore();
    view.reset();
    c.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      const t = p.life / p.max, col = t > 0.45 ? p.c1 : p.c2;
      let a = t < 0.3 ? t / 0.3 : 1;
      if (p.flick && rnd() < p.flick * 0.5) a *= 0.25;
      const s = p.size * (0.6 + 0.4 * t);
      if (p.size > 8) { // the flash of a burst: a soft round glow
        const gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, s);
        gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(a * 0.9).toFixed(2)})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, s, 0, Math.PI * 2); c.fill();
        continue;
      }
      c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(2)})`;
      c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      if (p.size > 2) { c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(a * 0.18).toFixed(2)})`; c.fillRect(p.x - s * 1.6, p.y - s * 1.6, s * 3.2, s * 3.2); }
    }
    if (G.shell && G.phase === 'play' && G.shell.y < view.h) {
      const sh = G.shell;
      c.fillStyle = 'rgba(255,240,200,.95)'; c.beginPath(); c.arc(sh.drawX, sh.y, 3.2 * scale(), 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,200,120,.25)'; c.beginPath(); c.arc(sh.drawX, sh.y, 9 * scale(), 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }
  function drawStars() {
    const cv = $('#stars'), r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const g = cv.getContext('2d'), sr = GK.rng(7);
    g.scale(dpr, dpr);
    const n = Math.round(r.width * r.height / 2600);
    for (let i = 0; i < n; i++) {
      const y = Math.pow(sr(), 1.6) * r.height * 0.7, a = 0.25 + sr() * 0.65 * (1 - y / r.height);
      g.fillStyle = `rgba(255,255,${200 + Math.round(sr() * 55)},${a.toFixed(2)})`;
      const s = sr() < 0.08 ? 1.8 : 1;
      g.fillRect(sr() * r.width, y, s, s);
    }
  }

  /* ---------------- game state ---------------- */
  const G = { phase: 'title', left: 0, total: 60, word: null, eng: null, pool: [], correct: 0, miss: 0, words: 0, combo: 0, maxCombo: 0, missKeys: {}, shell: null, t0: 0 };
  function showLayer(id) {
    $$('.layer').forEach((l) => l.classList.toggle('on', l.id === id));
    $('#stage').classList.toggle('title-on', id === 'title');
  }
  function refreshTitle() {
    const segT = $('#seg-time'), segD = $('#seg-diff');
    segT.innerHTML = TIMES.map((t) => `<button type="button" data-t="${t}" class="${t === SET.time ? 'on' : ''}">${t}秒</button>`).join('');
    segD.innerHTML = DIFFS.map(([k, l, s]) => `<button type="button" data-d="${k}" class="${k === SET.diff ? 'on' : ''}">${l}<small>${s}</small></button>`).join('');
    const b = GK.store.get('best', {})[bestKey()];
    $('#ti-best').textContent = b ? `この組み合わせのベスト：${b.score}点（${RANKS[b.rank][1]}級・${b.kps.toFixed(1)}打/秒・正確率 ${b.acc}%）` : 'この組み合わせはまだ記録がありません';
    $('#ti-note').innerHTML = useKb() ? '画面のキーボードでローマ字を入力します' : '半角英数のローマ字で入力します（<kbd>Enter</kbd> で開始）';
  }
  $('#seg-time').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; SET.time = +b.dataset.t; saveSet(); GK.sfx('click'); refreshTitle(); });
  $('#seg-diff').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; SET.diff = b.dataset.d; saveSet(); GK.sfx('click'); refreshTitle(); });
  $('#btn-start').addEventListener('click', () => start());
  $('#btn-again').addEventListener('click', () => start());
  $('#btn-title').addEventListener('click', () => toTitle());

  function toTitle() {
    G.phase = 'title';
    showLayer('title');
    refreshTitle();
    setKb(false);
  }
  function start(opts = {}) {
    GK.sfx('select');
    G.fast = !!opts.fast;
    Object.assign(G, { phase: 'count', total: SET.time, left: SET.time, correct: 0, miss: 0, words: 0, combo: 0, maxCombo: 0, missKeys: {}, countT: G.fast ? 0.05 : 3.2, word: null, shell: null });
    G.pool = rnd.shuffle(WORDS.filter((w) => w.lv === SET.diff));
    G.pi = 0;
    showLayer('play');
    setKb(useKb());
    $('#w-disp').textContent = ''; $('#w-kana').textContent = ''; $('#w-roma').textContent = '';
    updateHud();
    startMusic();
  }
  function nextWord() {
    if (G.pi >= G.pool.length) { G.pool = rnd.shuffle(G.pool); G.pi = 0; }
    G.word = G.pool[G.pi++];
    G.eng = Romaji.create(G.word.k);
    G.wordMiss = false;
    const x = view.w * (0.18 + rnd() * 0.64);
    G.shell = { x, drawX: x, y: view.h + 20, base: view.h + 20, top: skyTop(), target: view.h + 20, wob: 0 };
    renderWord();
  }
  /** where the shell bursts: in the free sky above the panel */
  function skyTop() {
    const pr = $('#panel').getBoundingClientRect();
    const top = 64, bottom = Math.max(top + 60, pr.top - 20);
    return top + (bottom - top) * (0.15 + rnd() * 0.35);
  }
  function renderWord() {
    const w = G.word, e = G.eng;
    $('#w-disp').textContent = w.d;
    const k = [...w.k];
    $('#w-kana').innerHTML = `<b>${k.slice(0, e.kanaDone).join('')}</b>${k.slice(e.kanaDone).join('')}`;
    const typed = e.typed, rest = e.rest();
    const roma = $('#w-roma');
    roma.innerHTML = `<b>${typed}</b>${rest ? `<u>${rest[0]}</u>${rest.slice(1)}` : ''}`;
    // fit long spellings
    const len = typed.length + rest.length, pw = $('#panel').clientWidth - 24;
    const base = innerWidth <= 640 || innerHeight <= 520 ? 18 : 22;
    roma.style.fontSize = Math.min(base, Math.floor(pw / (len * 0.66))) + 'px';
    // keyboard hint
    $$('#kb button.next').forEach((b) => b.classList.remove('next'));
    const nk = rest[0];
    if (nk) { const b = $(`#kb button[data-k="${CSS.escape(nk)}"]`); if (b) b.classList.add('next'); }
    // shell height follows the progress
    if (G.shell) G.shell.target = G.shell.base + (G.shell.top - G.shell.base) * (e.kanaDone / [...w.k].length) * 0.92;
  }
  function updateHud() {
    $('#h-time').textContent = Math.ceil(Math.max(0, G.left));
    $('#h-bar').style.transform = `scaleX(${Math.max(0, G.left / G.total).toFixed(3)})`;
    $('.hud-time').classList.toggle('low', G.left <= 10);
    $('#h-score').textContent = GK.fmt(score());
    $('#h-combo').textContent = G.combo;
  }
  const acc = () => (G.correct + G.miss ? G.correct / (G.correct + G.miss) : 1);
  const score = () => Math.round(G.correct * acc() * acc() * 10 + G.maxCombo * 5);

  function key(k) {
    if (G.phase !== 'play' || !G.eng) return;
    const expected = G.eng.nextKey();
    const res = G.eng.input(k);
    if (res.ok) {
      G.correct++;
      GK.sfx('key');
      if (res.done) return wordDone();
      renderWord();
    } else {
      G.miss++; G.combo = 0; G.wordMiss = true;
      if (expected) G.missKeys[expected] = (G.missKeys[expected] || 0) + 1;
      GK.sfx('miss');
      const p = $('#panel'); p.classList.remove('miss'); void p.offsetWidth; p.classList.add('miss');
      if (G.shell) G.shell.wob = 7;
      mascot('oops', 500);
    }
    updateHud();
  }
  function wordDone() {
    const w = G.word, n = [...w.k].length;
    G.words++;
    if (!G.wordMiss) { G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); } else G.combo = Math.max(1, G.combo);
    const type = n <= 4 ? 'botan' : n <= 7 ? rnd.pick(['kiku', 'botan', 'ring']) : n <= 11 ? rnd.pick(['kiku', 'yanagi', 'ring', 'senrin']) : rnd.pick(['senrin', 'yanagi', 'kiku']);
    const sh = G.shell;
    burst(sh.drawX, Math.min(sh.y, sh.top + 40), type, null, 0.8 + n / 14);
    if (G.combo > 0 && G.combo % 5 === 0) { starMine(Math.min(12, 3 + G.combo / 5 * 2)); GK.toast(`${G.combo}コンボ！ スターマイン`); }
    const p = $('#panel'); p.classList.add('done'); setTimeout(() => p.classList.remove('done'), 180);
    if (G.combo >= 3) mascot('cheer', 700);
    nextWord();
    updateHud();
  }
  let mascotT = 0;
  function mascot(face, ms) {
    const m = $('#pl-mascot');
    m.src = `img/mascot-${face}.webp`;
    m.classList.add('pop');
    clearTimeout(mascotT);
    mascotT = setTimeout(() => { m.src = 'img/mascot-normal.webp'; m.classList.remove('pop'); }, ms);
  }
  function finish() {
    G.phase = 'result';
    G.shell = null;
    const secs = G.total, kps = G.correct / secs, a = acc(), eff = kps * a, ri = rankOf(eff), sc = score();
    const all = GK.store.get('best', {}), prev = all[bestKey()];
    const isBest = !prev || sc > prev.score;
    if (isBest && !G.test) { all[bestKey()] = { score: sc, kps, acc: Math.round(a * 1000) / 10, rank: ri }; GK.store.set('best', all); }
    $('#rs-mode').textContent = `${SET.time}秒・${DIFFS.find((d) => d[0] === SET.diff)[1]}`;
    $('#rs-rank').textContent = RANKS[ri][1];
    $('#rs-comment').textContent = RANKS[ri][2];
    const weak = Object.entries(G.missKeys).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k]) => k.toUpperCase()).join('・');
    $('#rs-stats').innerHTML = `
      <div class="big"><small>スコア</small><b>${GK.fmt(sc)}</b></div>
      <div><small>正しく打った数</small><b>${G.correct}</b></div>
      <div><small>ミス</small><b>${G.miss}</b></div>
      <div><small>正確率</small><b>${(a * 100).toFixed(1)}%</b></div>
      <div><small>1秒あたりの打鍵</small><b>${kps.toFixed(2)}</b></div>
      <div><small>打ち上げた花火</small><b>${G.words}発</b></div>
      <div><small>最大コンボ</small><b>${G.maxCombo}</b></div>`;
    $('#rs-best').textContent = isBest ? (prev ? `ベスト更新！（これまで ${prev.score}点）` : '初めての記録です！') + (weak ? `　苦手なキー：${weak}` : '') : `ベストは ${prev.score}点（${RANKS[prev.rank][1]}級）${weak ? `　苦手なキー：${weak}` : ''}`;
    $('#rs-mascot').src = `img/mascot-${ri >= 3 ? 'cheer' : 'normal'}.webp`;
    setKb(false);
    showLayer('result');
    GK.sfx(isBest ? 'win' : 'ok');
    starMine(4 + ri * 2);
  }

  /* ---------------- input ---------------- */
  const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm-'];
  $('#kb').innerHTML = KB_ROWS.map((r) => `<div class="kb-row">${[...r].map((k) => `<button type="button" data-k="${k}">${k === '-' ? 'ー' : k}</button>`).join('')}</div>`).join('');
  $('#kb').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    e.preventDefault();
    b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 90);
    key(b.dataset.k);
  });
  const useKb = () => (SET.kb == null ? GK.isTouch : SET.kb);
  function setKb(on) {
    document.documentElement.classList.toggle('kb-on', on);
    requestAnimationFrame(() => {
      const h = on ? $('#kb').offsetHeight : 0;
      document.documentElement.style.setProperty('--kb-h', h + 'px');
      if (G.shell) { G.shell.top = skyTop(); if (G.word) renderWord(); }
    });
  }
  function sizeKeys() {
    const h = innerHeight <= 520 ? Math.max(30, Math.min(40, (innerHeight - 250) / 3)) : innerWidth <= 640 ? 50 : 52;
    document.documentElement.style.setProperty('--key-h', h + 'px');
    if (document.documentElement.classList.contains('kb-on')) setKb(true);
  }
  addEventListener('resize', sizeKeys);
  sizeKeys();
  $('#kb-toggle').addEventListener('click', () => { SET.kb = !useKb(); saveSet(); setKb(SET.kb); GK.sfx('click'); GK.toast(SET.kb ? '画面のキーボードを表示します' : '画面のキーボードを隠します'); });

  let imeWarned = 0;
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back')) return;
    if (e.key === 'Process' || e.isComposing) { if (G.phase === 'play' && performance.now() - imeWarned > 2500) { imeWarned = performance.now(); GK.toast('日本語入力をオフ（半角英数）にしてください'); } return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (G.phase === 'title') { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } return; }
    if (G.phase === 'result') { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } else if (e.key === 'Escape') toTitle(); return; }
    if (e.key === 'Escape') { openMenu(); return; }
    if (G.phase === 'play' && e.key.length === 1 && /[a-z0-9\-',.!?/~]/i.test(e.key)) { e.preventDefault(); key(e.key); }
  });

  /* ---------------- menu & help ---------------- */
  function openMenu() {
    if (G.phase === 'title') return GK.help();
    const was = G.phase;
    if (was === 'play' || was === 'count') G.paused = true;
    GK.modal({ title: 'メニュー', body: was === 'result' ? '<p>タイトルに戻りますか？</p>' : '<p>一時停止しています。</p>', buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: 'やり直す', value: 'retry' }, { label: '続ける', value: null, primary: true }] })
      .then((v) => { G.paused = false; if (v === 'title') toTitle(); else if (v === 'retry') start(); });
  }
  const HELP = `
    <p>表示された言葉をローマ字で打ちます。一文字打つごとに花火玉が昇り、言葉を打ち終えると夜空で花火がひらきます。制限時間内にどれだけ打てるかを競います。</p>
    <h3>遊び方</h3>
    <ul>
      <li>時間（30・60・90・120 秒）と難しさ（やさしい＝短い言葉 / ふつう＝言葉と短い文 / むずかしい＝長い文）を選んで「打ち上げ開始」。</li>
      <li>下の段のローマ字はおすすめの打ち方です。<b>しは shi / si / ci、ちは chi / ti、つは tsu / tu、ふは fu / hu、じゃは ja / jya / zya</b> など、どの打ち方でも受け付けて、ガイドがあなたの打ち方に合わせて変わります。</li>
      <li>「ん」は nn（子音の前は n だけでも可。母音・な行・や行の前と言葉の最後は nn）。「っ」は次の子音を重ねるか ltu / xtu。小さい字は l か x を前に（xya など）。「ー」は <kbd>-</kbd>。</li>
      <li>まちがえずに言葉を打ち終えるとコンボ。5 コンボごとに<b>スターマイン</b>が上がります。</li>
      <li>短い言葉は牡丹、長い言葉は菊・柳・千輪と、言葉の長さで花火が変わります。</li>
    </ul>
    <h3>結果</h3>
    <p>正しく打った数・ミス・正確率・1 秒あたりの打鍵数から、線香花火 〜 尺玉 の 8 つの段位が決まります。時間と難しさの組み合わせごとにベストスコアを記録します。</p>
    <h3>操作</h3>
    <p>PC は半角英数で入力（日本語入力はオフに）。<kbd>Enter</kbd> で開始・もう一度、<kbd>Esc</kbd> で一時停止。スマホやタブレットは画面のキーボードで打ちます（パネル右下の「キー」で表示を切り替え）。</p>`;
  GK.init({ id: 'hanabi-typing', title: 'ことば花火', help: HELP, menu: openMenu });

  /* ---------------- loop ---------------- */
  let demoT = 1.2;
  GK.loop((dt) => {
    if (!G.paused) {
      if (G.phase === 'count') {
        G.countT -= dt;
        const c = $('#count');
        const n = Math.ceil(G.countT - 0.2);
        c.className = 'count' + (n <= 0 ? ' small' : '');
        c.textContent = n > 0 ? n : '打ち上げ開始！';
        if (G.countT <= 0) { c.textContent = ''; G.phase = 'play'; G.t0 = performance.now(); nextWord(); }
      } else if (G.phase === 'play') {
        G.left -= dt * (G.fast ? 6 : 1);
        if (G.left <= 0) { G.left = 0; updateHud(); finish(); } else if (Math.ceil(G.left) !== G.lastSec) { G.lastSec = Math.ceil(G.left); updateHud(); if (G.left <= 5.5 && !G.fast) GK.sfx('tick'); }
      } else if (G.phase === 'title') {
        demoT -= dt;
        if (demoT <= 0) { demoT = 1.6 + rnd() * 1.6; launch(view.w * (0.15 + rnd() * 0.7), view.h * (0.12 + rnd() * 0.25), rnd.pick(['botan', 'kiku', 'yanagi', 'ring', 'senrin']), 0, 0.9); }
      }
    }
    stepFx(dt);
    drawFx(dt);
  });
  drawStars();
  toTitle();

  /* ---------------- self-test (npm run game-check) ---------------- */
  const until = async (fn, ms = 5000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) return false; await GK.wait(20); } return true; };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG: ' + m); };
    G.test = true;
    const orig = { time: SET.time, diff: SET.diff };
    SET.time = 30; SET.diff = 'normal';
    start({ fast: true });
    if (!(await until(() => G.phase === 'play'))) fail('no play phase');
    // type three words with the guide, one wrong key on the way
    for (let w = 0; w < 3 && G.phase === 'play'; w++) {
      const before = G.words;
      if (w === 1) key('q' === G.eng.nextKey() ? 'z' : 'q');
      for (let i = 0; i < 80 && G.words === before; i++) key(G.eng.nextKey());
      if (w === 1 && window.__shot) await window.__shot('play');
      await GK.wait(150);
    }
    if (G.words < 3) fail('words typed ' + G.words);
    if (G.miss !== 1) fail('miss count ' + G.miss);
    notes.push(`typed ${G.words} words, ${G.correct} keys, ${G.miss} miss`);
    // alternative spellings through the real input path
    G.word = { d: '写真', k: 'しゃしん' }; G.eng = Romaji.create('しゃしん'); renderWord();
    const before = G.words;
    [...'syasinn'].forEach((c) => key(c));
    if (G.words !== before + 1) fail('syasinn not accepted');
    await until(() => G.phase === 'result', 8000);
    if (G.phase !== 'result') fail('no result screen');
    await GK.wait(600);
    if (window.__shot) await window.__shot('result');
    $('#btn-title').click();
    if (G.phase !== 'title') fail('result → title');
    G.test = false; G.fast = false;
    Object.assign(SET, orig);
    refreshTitle();
    return { ok, notes };
  };
})();
