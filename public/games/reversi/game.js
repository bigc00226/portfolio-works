/* 喫茶しろくろ — 画面と対局の流れ（ルールは rules.js、CPU の思考は ai.js を worker.js で動かします） */
(() => {
  'use strict';
  const R = window.ReversiRules, AI = window.ReversiAI;
  const { BLACK, WHITE, EMPTY, PASS } = R;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const SERIF = getComputedStyle(document.documentElement).getPropertyValue('--gk-serif').trim() || 'serif';
  const SANS = getComputedStyle(document.documentElement).getPropertyValue('--gk-sans').trim() || 'sans-serif';
  const MIN_THINK = [650, 600, 550, 400];

  /* ---------- 対局相手（喫茶しろくろの人たち。すべてオリジナル） ---------- */
  const CPUS = [
    { name: 'ひなた', role: 'マスターの孫・小学 2 年生', level: '入門', img: 'portrait-hinata', desc: 'カウンター席の常連（？）。好きなところに気ままに打ちますが、隅は何となく好き。',
      lines: { start: ['えへへ、おじいちゃんのまねっこ。よろしくね！', 'ひなた、黒も白もすきだよ！'], corner: ['すみっこ、とれた！'], lost: ['あっ、すみっこ……'], pass: ['うーん、置くところないよ〜'], win: ['やったぁ！ひなたの勝ち！'], lose: ['まけちゃった……でも楽しかった！'], draw: ['おんなじ数だ！すごーい！'] } },
    { name: 'むぎ', role: '看板猫（茶トラ）', level: '初級', img: 'portrait-mugi', desc: 'いちばんたくさん返せる手が大好き。それと、角っこも大好き。',
      lines: { start: ['にゃあ。（カウンターから飛び降りてきた）'], corner: ['にゃっ。（角っこに陣取った）'], lost: ['……にゃ。（しっぽをぱたぱたさせている）'], pass: ['にゃ……。（あくびをした）'], win: ['にゃーん♪（満足げに丸くなった）'], lose: ['ふにゃ。（毛づくろいを始めた）'], draw: ['にゃ？'] } },
    { name: '律子', role: '昼休みの常連・会社員', level: '中級', img: 'portrait-ritsuko', desc: '4 手先まで読み、打てる場所の数・隅・確定石をよく考えて打ちます。',
      lines: { start: ['昼休みの一局、付き合ってもらえますか？', 'コーヒーが来るまでに、決着をつけましょう。'], corner: ['角、いただきますね。'], lost: ['……そこを取られるとは。'], pass: ['パスです。打てる場所がありません。'], win: ['ごちそうさまでした。いい勝負でした。'], lose: ['参りました。午後の仕事、がんばれそうです。'], draw: ['引き分け……奇遇ですね。'] } },
    { name: 'マスター', role: '喫茶しろくろの店主', level: '上級', img: 'portrait-master', desc: '6〜10 手先まで読み、残り 14 マスからは最後まで読み切って石差を最大にします。',
      lines: { start: ['いらっしゃい。コーヒーが冷めないうちに、一局どうだい。', 'ゆっくりしていきなさい。……盤の上以外はね。'], corner: ['隅はもらっておこう。'], lost: ['ほう、いい隅だ。'], pass: ['おっと、パスだ。'], win: ['ふふ、今日のところは私の勝ちだね。おかわりはいるかい？'], lose: ['お見事。今日のコーヒーは私のおごりだ。'], draw: ['引き分けか。いい腕だ。'] } },
  ];
  const CORNERS = [11, 18, 81, 88];

  const HELP = () => `
    <h3>操作</h3>
    <ul>
      <li>石を置けるマスに点が出ます。マスをタップ（クリック）すると、そこに石を置きます。</li>
      <li><b>待った</b>…自分の最後の手まで戻します（ふたりで対局では 1 手戻します）。<b>ヒント</b>…おすすめのマスを光らせます。<b>最初から</b>…対局をやり直します。</li>
      <li>キーボード：矢印キーでカーソル移動、<kbd>Enter</kbd> で置く、<kbd>H</kbd> でヒント、<kbd>Z</kbd> で待った。</li>
    </ul>
    <h3>ルール</h3>
    <ul>
      <li>黒が先手です。相手の石を、縦・横・ななめのどれかで自分の石ではさめるマスにだけ置けます。はさんだ石はすべて自分の色に裏返ります。</li>
      <li>置ける場所がないときは自動でパスになります。両方とも置けなくなったら終局です。</li>
      <li>終局のとき、石の多い方が勝ち。空いたマスはどちらにも数えません。</li>
    </ul>
    <h3>対局相手</h3>
    <table>${CPUS.map((c) => `<tr><th>${c.level}</th><td><b>${c.name}</b>（${c.role}）<br>${c.desc}</td></tr>`).join('')}</table>`;

  GK.init({ id: 'reversi', title: '喫茶しろくろ', help: HELP, menu: openMenu });

  const settings = Object.assign({ mode: 'cpu', level: 1, color: 1 }, GK.store.get('settings', {}));
  settings.level = GK.clamp(settings.level | 0, 0, 3);
  const records = () => { const r = GK.store.get('records', null); return Array.isArray(r) && r.length === 4 ? r : [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; };

  /* ---------- CPU（Web Worker。使えないときはページの中で短く考えます） ---------- */
  const engine = (() => {
    let worker = null;
    const pending = new Map();
    const local = (req) => new Promise((resolve) => setTimeout(() => {
      const r = AI.think(Int8Array.from(req.board), req.side, Object.assign({}, req.opts, { timeMs: 700, solveMs: 700 }));
      resolve({ id: req.id, move: r.move, score: r.score });
    }, 20));
    try {
      worker = new Worker('worker.js');
      worker.onmessage = (e) => { const f = pending.get(e.data.id); if (f) { pending.delete(e.data.id); f(e.data); } };
      worker.onerror = (e) => { console.warn('[reversi] worker unavailable, thinking in the page', e && e.message); worker = null; const l = [...pending.values()]; pending.clear(); l.forEach((f) => f(null)); };
    } catch (e) { worker = null; }
    return { ask(req) { if (!worker) return local(req); return new Promise((resolve) => { pending.set(req.id, (res) => resolve(res || local(req))); worker.postMessage(req); }); } };
  })();

  /* ---------- 状態 ---------- */
  let screen = 'title', mode = 'cpu', level = 1, human = BLACK, cpu = WHITE;
  let game = null, over = false, thinking = false, busy = false, reqId = 0, hint = 0, hintBusy = false, cursor = null, hover = -1;
  let undos = 0, hints = 0, result = null;
  const anims = new Map(); // sq → { from, to, t0, place }
  const cv = $('#cv');
  let view = null, boardImg = null, stoneImg = null;
  const M = 46, CELL = (800 - 2 * M) / 8;
  const center = (s) => ({ x: M + (R.colOf(s) + 0.5) * CELL, y: M + (R.rowOf(s) + 0.5) * CELL });
  const sqAt = (x, y) => { const c = Math.floor((x - M) / CELL), r = Math.floor((y - M) / CELL); return c < 0 || c > 7 || r < 0 || r > 7 ? -1 : R.sq(r, c); };
  const C = () => CPUS[level];
  const isCpuTurn = () => mode === 'cpu' && game && game.side === cpu;
  const canAct = () => screen === 'game' && game && !over && !busy && !thinking && !isCpuTurn() && !document.querySelector('.gk-modal-back');
  const nameOf = (color) => (mode === 'pvp' ? (color === BLACK ? '黒' : '白') : color === human ? 'あなた' : C().name);

  /* ---------- 盤と石（コードで描画） ---------- */
  function renderBoard() {
    const k = view.scale * view.dpr, c = document.createElement('canvas');
    c.width = c.height = Math.ceil(800 * k);
    const g = c.getContext('2d');
    g.scale(k, k);
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    rr(4, 4, 792, 792, 22);
    const gr = g.createLinearGradient(0, 0, 800, 800); gr.addColorStop(0, '#6a4024'); gr.addColorStop(1, '#3e2414');
    g.fillStyle = gr; g.fill();
    rr(M - 8, M - 8, 800 - 2 * M + 16, 800 - 2 * M + 16, 8);
    const gi = g.createLinearGradient(0, M, 0, 800 - M); gi.addColorStop(0, '#7c4c2a'); gi.addColorStop(1, '#5e3820');
    g.fillStyle = gi; g.fill();
    g.save(); g.clip();
    const rnd = GK.rng(5);
    for (let i = 0; i < 70; i++) { // 木目
      const y = rnd() * 820 - 10, amp = 2 + rnd() * 6, fq = 0.004 + rnd() * 0.008, ph = rnd() * 6;
      g.beginPath();
      for (let x = 0; x <= 800; x += 8) { const yy = y + Math.sin(x * fq + ph) * amp; if (!x) g.moveTo(x, yy); else g.lineTo(x, yy); }
      g.strokeStyle = `rgba(${20 + rnd() * 30 | 0},${10 + rnd() * 10 | 0},0,${0.08 + rnd() * 0.14})`; g.lineWidth = 0.8 + rnd() * 2; g.stroke();
    }
    const vg = g.createRadialGradient(400, 380, 120, 400, 400, 560); vg.addColorStop(0, 'rgba(255,220,160,.1)'); vg.addColorStop(1, 'rgba(0,0,0,.3)');
    g.fillStyle = vg; g.fillRect(0, 0, 800, 800);
    g.restore();
    g.strokeStyle = 'rgba(226,192,124,.75)'; g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i <= 8; i++) { g.moveTo(M + i * CELL, M); g.lineTo(M + i * CELL, 800 - M); g.moveTo(M, M + i * CELL); g.lineTo(800 - M, M + i * CELL); }
    g.stroke();
    g.lineWidth = 3.5; g.strokeRect(M, M, 800 - 2 * M, 800 - 2 * M);
    g.fillStyle = '#e2c07c';
    for (const [i, j] of [[2, 2], [6, 2], [2, 6], [6, 6]]) { g.beginPath(); g.arc(M + i * CELL, M + j * CELL, 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(246,234,214,.75)'; g.font = `600 19px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) { g.fillText('abcdefgh'[i], M + (i + 0.5) * CELL, M / 2); g.fillText(String(i + 1), M / 2, M + (i + 0.5) * CELL); }
    return c;
  }
  function renderStones() {
    const k = view.scale * view.dpr, r = CELL * 0.42, size = Math.ceil(r * 2 * k) + 4, out = {};
    for (const color of [BLACK, WHITE]) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d'); g.scale(k, k);
      const cx = size / k / 2;
      const gr = g.createRadialGradient(cx - r * 0.35, cx - r * 0.4, r * 0.1, cx, cx, r);
      if (color === BLACK) { gr.addColorStop(0, '#6f6862'); gr.addColorStop(0.45, '#26211d'); gr.addColorStop(1, '#090706'); }
      else { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#efe9df'); gr.addColorStop(1, '#c9c0b2'); }
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = color === BLACK ? 'rgba(255,255,255,.08)' : 'rgba(80,60,40,.25)'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = color === BLACK ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.7)';
      g.beginPath(); g.ellipse(cx - r * 0.3, cx - r * 0.42, r * 0.38, r * 0.18, -0.5, 0, Math.PI * 2); g.fill();
      out[color] = { c, w: size / k };
    }
    return out;
  }
  function drawStone(g, color, x, y, sx = 1, lift = 0, alpha = 1) {
    const s = stoneImg[color], r = CELL * 0.42;
    g.globalAlpha = alpha * 0.45;
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(x + 2 + lift * 0.4, y + 5 + lift * 0.6, r * Math.max(0.3, Math.abs(sx)) * (1 + lift * 0.01), r * 0.92, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = alpha;
    g.save(); g.translate(x, y - lift); g.scale(Math.max(0.04, Math.abs(sx)), 1);
    g.drawImage(s.c, -s.w / 2, -s.w / 2, s.w, s.w);
    g.restore();
    g.globalAlpha = 1;
  }

  function draw(now) {
    const g = view.ctx;
    view.clear();
    if (!game || !boardImg) return;
    g.drawImage(boardImg, 0, 0, 800, 800);
    const t = performance.now(), b = game.b;
    const myTurnShow = !over && !busy && !thinking && !isCpuTurn();
    const legal = myTurnShow ? game.moves() : [];
    for (const s of R.SQS) {
      const v = b[s], { x, y } = center(s), a = anims.get(s);
      if (a) {
        const k = (t - a.t0) / a.dur;
        if (k < 0) { if (!a.place) drawStone(g, a.from, x, y); continue; }
        if (k >= 1) { anims.delete(s); drawStone(g, v, x, y); continue; }
        if (a.place) { const e = GK.ease.outCubic(k); drawStone(g, a.to, x, y, 1, (1 - e) * 26, Math.min(1, k * 3)); }
        else { const sx = Math.cos(k * Math.PI); drawStone(g, k < 0.5 ? a.from : a.to, x, y, sx, Math.sin(k * Math.PI) * 14); }
        continue;
      }
      if (v === BLACK || v === WHITE) drawStone(g, v, x, y);
    }
    const last = game.last();
    if (last && last.s !== PASS && !anims.has(last.s)) { const { x, y } = center(last.s); g.fillStyle = '#e0483a'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
    if (legal.length) {
      for (const s of legal) {
        const { x, y } = center(s);
        if (s === hover) { drawStone(g, game.side, x, y, 1, 0, 0.42); continue; }
        g.fillStyle = game.side === BLACK ? 'rgba(10,8,6,.42)' : 'rgba(255,250,240,.5)';
        g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
      }
    }
    if (hint && myTurnShow) {
      const { x, y } = center(hint), p = 0.5 + 0.5 * Math.sin(now * 6);
      g.strokeStyle = `rgba(255,214,120,${0.55 + 0.4 * p})`; g.lineWidth = 5;
      g.beginPath(); g.arc(x, y, CELL * (0.36 + p * 0.06), 0, Math.PI * 2); g.stroke();
    }
    if (cursor != null && myTurnShow) {
      const { x, y } = center(cursor);
      g.strokeStyle = 'rgba(120,190,255,.95)'; g.lineWidth = 4; g.strokeRect(x - CELL / 2 + 4, y - CELL / 2 + 4, CELL - 8, CELL - 8);
    }
  }

  /* ---------- プレイヤーのカード ---------- */
  function cardHTML(color) {
    const cnt = game ? game.count()[color - 1] : 2;
    const stone = `<i class="stone ${color === BLACK ? 'b' : 'w'}"></i>`;
    let av, nm, sub;
    if (mode === 'cpu' && color === cpu) { av = `<img class="pc-av" src="img/${C().img}.webp" alt="">`; nm = C().name; sub = `${C().level}・${C().role}`; }
    else { av = `<span class="pc-av stoneav">${stone.replace('stone', 'stone big')}</span>`; nm = mode === 'pvp' ? (color === BLACK ? 'プレイヤー 1' : 'プレイヤー 2') : 'あなた'; sub = color === BLACK ? '黒・先手' : '白・後手'; }
    return `<div class="pc-in">${av}<div class="pc-meta"><div class="pc-name">${nm}</div><div class="pc-sub">${sub}</div><span class="pc-think">考え中<b>.</b><b>.</b><b>.</b></span></div><div class="pc-count">${stone}<span class="n">${cnt}</span></div></div>`;
  }
  const cards = { top: $('#card-top'), bottom: $('#card-bottom') };
  const bubble = $('#bubble');
  let bubbleTimer = 0;
  const topColor = () => (mode === 'cpu' ? cpu : WHITE), bottomColor = () => (mode === 'cpu' ? human : BLACK);
  function buildCards() {
    cards.top.innerHTML = cardHTML(topColor());
    cards.bottom.innerHTML = cardHTML(bottomColor());
    cards.top.appendChild(bubble);
    updateCards(false);
  }
  const prevCount = {};
  function updateCards(bump = true) {
    if (!game) return;
    const [x, o] = game.count();
    for (const [key, color] of [['top', topColor()], ['bottom', bottomColor()]]) {
      const el = cards[key], n = color === BLACK ? x : o, cEl = el.querySelector('.pc-count'), nEl = el.querySelector('.n');
      if (nEl && nEl.textContent !== String(n)) { nEl.textContent = n; if (bump && cEl) { cEl.classList.remove('bump'); void cEl.offsetWidth; cEl.classList.add('bump'); } }
      el.classList.toggle('turn', !over && game.side === color);
      el.classList.toggle('thinking', thinking && color === cpu && mode === 'cpu');
      prevCount[key] = n;
    }
  }
  function say(lines, ms = 3000) {
    if (mode !== 'cpu' || screen !== 'game') return;
    bubble.textContent = Array.isArray(lines) ? pick(lines) : lines;
    bubble.classList.add('on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
  }
  const stampEl = $('#stamp');
  function stamp(text, kind) { stampEl.textContent = text; stampEl.className = 'stamp'; void stampEl.offsetWidth; stampEl.className = 'stamp ' + kind; }

  /* ---------- 音（WebAudio で合成。BGM はこのゲームのための自作） ---------- */
  const SONG = {
    bpm: 88, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.08, notes: 'A4 - C5 - A4 G4 F4 - | G4 - A4 - C5 - - . | D5 - C5 A4 G4 - F4 - | G4 - - - . . . . | A4 - C5 - D5 C5 A4 - | G4 - F4 - D4 - - . | E4 - G4 - C5 - A4 G4 | F4 - - - . . . . |' },
      { type: 'sine', v: 0.12, notes: 'F2 . A2 . C3 . A2 . | C2 . E2 . G2 . E2 . | D2 . F2 . A2 . F2 . | G2 . B2 . C3 . E2 . | F2 . A2 . C3 . D3 . | Bb2 . D3 . F3 . D3 . | C2 . E2 . G2 . Bb2 . | F2 . C3 . F2 . . . |' },
      { type: 'triangle', v: 0.035, notes: '. . A3 . . . C4 . | . . G3 . . . Bb3 . | . . A3 . . . C4 . | . . B3 . . . E4 . | . . A3 . . . C4 . | . . F3 . . . A3 . | . . G3 . . . Bb3 . | . . A3 . . . C4 . |' },
    ],
    drums: { h: '. x . x . x . x | . x . x . x . x | . x . x . x . x | . x . x . x . x | . x . x . x . x | . x . x . x . x | . x . x . x . x | . x . x . x . x |' },
  };
  let musicOn = false;
  const playMusic = () => { musicOn = true; if (!GK.music.playing) GK.music.play(SONG); };
  addEventListener('pointerdown', () => { if (!musicOn) playMusic(); }, { once: true });
  function flipSounds(n) { for (let i = 0; i < Math.min(n, 10); i++) GK.tone({ f: 620 + i * 70, d: 0.05, type: 'triangle', v: 0.07, at: 0.12 + i * 0.06 }); }

  /* ---------- タイトル ---------- */
  function buildTitle() {
    $('#opps').innerHTML = CPUS.map((c, i) => `<button type="button" class="opp" data-lv="${i}"><img src="img/${c.img}.webp" alt="" draggable="false"><span class="opp-txt"><span class="opp-lv">${c.level}</span><b>${c.name}</b><small>${c.role}</small><em class="opp-rec"></em></span></button>`).join('');
    $$('.opp').forEach((b) => b.addEventListener('click', () => { settings.level = +b.dataset.lv; GK.sfx('select'); refreshTitle(); }));
    $$('#modes .chip').forEach((b) => b.addEventListener('click', () => { settings.mode = b.dataset.mode; GK.sfx('select'); refreshTitle(); }));
    $$('#colors .chip').forEach((b) => b.addEventListener('click', () => { settings.color = +b.dataset.color; GK.sfx('select'); refreshTitle(); }));
    $('#btn-start').addEventListener('click', () => { GK.sfx('ok'); startGame(null); });
    $('#btn-resume').addEventListener('click', () => { const s = GK.store.get('save', null); GK.sfx('ok'); if (s) startGame(s); });
  }
  function refreshTitle() {
    const recs = records();
    $$('.opp').forEach((b) => {
      const lv = +b.dataset.lv, r = recs[lv], on = lv === settings.level;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
      b.querySelector('.opp-rec').textContent = r[0] + r[1] + r[2] ? `${r[0]}勝 ${r[1]}敗${r[2] ? ` ${r[2]}分` : ''}${r[3] ? `・最大 ${r[3]} 石差` : ''}` : 'まだ対局なし';
    });
    $$('#modes .chip').forEach((b) => { const on = b.dataset.mode === settings.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    $$('#colors .chip').forEach((b) => { const on = +b.dataset.color === settings.color; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    $('#cpu-opts').hidden = settings.mode !== 'cpu';
    $('#pvp-note').hidden = settings.mode === 'cpu';
    const save = GK.store.get('save', null), rb = $('#btn-resume');
    rb.hidden = !save;
    if (save) rb.textContent = `続きから（${save.mode === 'pvp' ? 'ふたりで' : CPUS[save.level].name}・${save.moves.filter((m) => m !== PASS).length} 手）`;
    GK.store.set('settings', settings);
  }
  function toTitle() {
    screen = 'title'; reqId++; thinking = false; busy = false; anims.clear();
    bubble.classList.remove('on'); stampEl.className = 'stamp';
    $('#title').classList.remove('hide');
    refreshTitle();
    setTimeout(() => $('#btn-start').focus({ preventScroll: true }), 50);
  }

  /* ---------- 対局 ---------- */
  function startGame(save, board, side) {
    if (save) { mode = save.mode; level = save.level; human = save.human; }
    else { mode = settings.mode; level = settings.level; human = mode === 'pvp' ? BLACK : settings.color || (Math.random() < 0.5 ? BLACK : WHITE); }
    cpu = 3 - human;
    game = new R.Game();
    if (board) { game.b = board; game.side = side || BLACK; }
    if (save) for (const m of save.moves) { if (m === PASS ? !game.mustPass() : !game.canPlay(m)) break; game.play(m); }
    game.custom = !!board;
    over = false; thinking = false; busy = false; reqId++; hint = 0; cursor = null; hover = -1; result = null; anims.clear();
    undos = save ? save.undos || 0 : 0; hints = save ? save.hints || 0 : 0;
    screen = 'game';
    $('#title').classList.add('hide');
    stampEl.className = 'stamp';
    $('#btn-restart').textContent = '最初から';
    $('#btn-restart').classList.remove('primary');
    buildCards();
    if (musicOn) playMusic();
    if (!save && !board && mode === 'cpu' && !settings.color) GK.toast(`おまかせ：あなたは${human === BLACK ? '黒（先手）' : '白（後手）'}です`, 2600);
    say(C().lines.start);
    saveGame();
    setTimeout(() => { if (screen === 'game' && game) next(); }, mode === 'cpu' && game.side === cpu ? 900 : 0);
  }
  function saveGame() {
    if (!game || over || game.custom) return;
    GK.store.set('save', { v: 1, mode, level, human, moves: game.hist.map((h) => h.s), undos, hints });
  }
  /** after every move: game end, a forced pass, or the CPU's turn */
  async function next() {
    updateCards();
    if (over || screen !== 'game') return;
    if (game.over()) { endGame(); return; }
    if (game.mustPass()) {
      busy = true;
      const who = game.side;
      stamp('パス', 'pass');
      GK.sfx('ng');
      GK.toast(`${nameOf(who)}は置ける場所がないので、パスです`, 2200);
      if (mode === 'cpu' && who === cpu) say(C().lines.pass);
      const id = reqId;
      await GK.wait(1300);
      if (id !== reqId || screen !== 'game') return;
      busy = false;
      game.play(PASS); saveGame(); updateCards();
    }
    if (isCpuTurn()) requestCpu();
  }
  async function place(s) {
    const me = game.side, flips = game.play(s);
    hint = 0; hover = -1;
    const t0 = performance.now();
    anims.set(s, { place: true, to: me, t0, dur: 160 });
    const { x: px, y: py } = center(s);
    flips.forEach((f) => { const { x, y } = center(f), d = Math.hypot(x - px, y - py) / CELL; anims.set(f, { from: 3 - me, to: me, t0: t0 + 120 + d * 55, dur: 300 }); });
    GK.sfx('place');
    flipSounds(flips.length);
    saveGame();
    if (mode === 'cpu' && CORNERS.includes(s)) say(me === cpu ? C().lines.corner : C().lines.lost, 2400);
    busy = true;
    const id = reqId;
    await GK.wait(160 + 300 + (flips.length ? Math.max(...flips.map((f) => Math.hypot(center(f).x - px, center(f).y - py) / CELL)) * 55 + 120 : 0));
    if (id !== reqId) return;
    busy = false;
    next();
  }
  function requestCpu() {
    thinking = true; updateCards(false);
    const id = ++reqId, t0 = performance.now();
    engine.ask({ id, board: Array.from(game.b), side: cpu, opts: { level } }).then(async (res) => {
      if (id !== reqId || screen !== 'game' || over) return;
      const el = performance.now() - t0;
      if (el < MIN_THINK[level]) await GK.wait(MIN_THINK[level] - el);
      if (id !== reqId || over) return;
      thinking = false; updateCards(false);
      let mv = res && res.move;
      const ok = game.moves();
      if (!ok.includes(mv)) mv = ok[Math.floor(Math.random() * ok.length)];
      place(mv);
    });
  }
  async function doHint() {
    if (!canAct() || hintBusy) return;
    hintBusy = true;
    const n = game.hist.length;
    GK.toast('考えています…', 1200);
    const res = await engine.ask({ id: 'h' + (++reqId), board: Array.from(game.b), side: game.side, opts: { level: 3, timeMs: 900, solveMs: 1500 } });
    hintBusy = false;
    if (!game || game.hist.length !== n || over || !res || !game.canPlay(res.move)) return;
    hint = res.move; hints++;
    GK.sfx('select');
    GK.toast(`ヒント：${R.name(res.move)} がおすすめです`, 2600);
  }
  function doUndo() {
    if (!game || over || busy || screen !== 'game') return;
    const humanMoved = mode === 'pvp' ? game.hist.some((h) => h.s !== PASS) : game.hist.some((h) => h.me === human && h.s !== PASS);
    if (!humanMoved) { GK.toast('まだ戻せる手がありません'); return; }
    if (thinking) { reqId++; thinking = false; }
    let h;
    if (mode === 'pvp') { do { h = game.undo(); } while (h && h.s === PASS); }
    else { do { h = game.undo(); } while (h && !(h.me === human && h.s !== PASS)); }
    undos++; hint = 0; anims.clear();
    saveGame(); updateCards(false);
    GK.sfx('select');
    GK.toast('待った：1 手戻しました');
  }
  async function doRestart() {
    if (!game) return;
    if (over) { GK.sfx('ok'); startGame(null, game.custom ? null : null); return; }
    const v = await GK.modal({ title: '最初からやり直しますか？', body: '<p>いまの対局は記録されずに終わります。</p>', buttons: [{ label: '続ける', value: false }, { label: '最初から', value: true, primary: true }] });
    if (v) { reqId++; thinking = false; GK.store.del('save'); startGame(null); }
  }

  async function endGame() {
    over = true; thinking = false; busy = false; reqId++; hint = 0;
    GK.store.del('save');
    const [x, o] = game.count(), diff = Math.abs(x - o);
    let res;
    if (mode === 'pvp') res = x === o ? 'draw' : 'win';
    else { const mine = human === BLACK ? x : o, theirs = human === BLACK ? o : x; res = mine > theirs ? 'win' : mine < theirs ? 'lose' : 'draw'; }
    result = { x, o, diff, res };
    if (mode === 'cpu' && !game.custom) {
      const recs = records(), r = recs[level];
      r[res === 'win' ? 0 : res === 'lose' ? 1 : 2]++;
      if (res === 'win') r[3] = Math.max(r[3] || 0, diff);
      GK.store.set('records', recs);
    }
    updateCards(false);
    $('#btn-restart').textContent = 'もう一局';
    $('#btn-restart').classList.add('primary');
    const label = mode === 'pvp' ? (x === o ? '引き分け' : x > o ? '黒の勝ち' : '白の勝ち') : res === 'win' ? '勝ち' : res === 'lose' ? '負け' : '引き分け';
    stamp(label, mode === 'pvp' ? (x === o ? 'draw' : 'win') : res);
    GK.sfx(res === 'lose' ? 'lose' : res === 'draw' ? 'ok' : 'win');
    if (mode === 'cpu') say(res === 'win' ? C().lines.lose : res === 'lose' ? C().lines.win : C().lines.draw, 4200);
    await GK.wait(1500);
    if (screen === 'game' && over) showResult(label);
  }
  async function showResult(label) {
    const { x, o, diff, res } = result;
    const c = C(), rec = records()[level];
    const lead = mode === 'pvp' ? (x === o ? '同じ数で引き分けです。' : `${x > o ? '黒' : '白'}が ${diff} 石差で勝ちました。`)
      : res === 'win' ? `${diff} 石差で、あなたの勝ちです。` : res === 'lose' ? `${diff} 石差で、${c.name}の勝ちです。` : '同じ数で引き分けです。';
    const rows = mode === 'pvp' ? '' : `<tr><th>対局相手</th><td>${c.name}（${c.level}）</td></tr><tr><th>あなたの石</th><td>${human === BLACK ? '黒（先手）' : '白（後手）'}</td></tr><tr><th>待った・ヒント</th><td>${undos} 回・${hints} 回</td></tr><tr><th>${c.name}との成績</th><td>${rec[0]}勝 ${rec[1]}敗${rec[2] ? ` ${rec[2]}分` : ''}${rec[3] ? `（最大 ${rec[3]} 石差）` : ''}</td></tr>`;
    const body = `<p class="final"><i class="stone b"></i> <b>${x}</b> 対 <b>${o}</b> <i class="stone w"></i></p><p>${lead}</p>${rows ? `<table>${rows}</table>` : ''}`;
    const v = await GK.modal({ title: mode === 'pvp' ? label : label + (res === 'win' ? '！' : ''), body, dismissable: false,
      buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: '盤面を見る', value: 'look' }, { label: 'もう一局', value: 'again', primary: true }] });
    if (v === 'again') startGame(null);
    else if (v === 'title') toTitle();
  }
  async function openMenu() {
    GK.sfx('click');
    if (screen !== 'game') { GK.help(); return; }
    const v = await GK.modal({ title: 'メニュー', body: `<p>${mode === 'pvp' ? 'ふたりで対局' : `${C().name}（${C().level}）と対局`}・${game.hist.filter((h) => h.s !== PASS).length} 手</p><p style="font-size:13px;color:#7b6146">タイトルに戻っても、次は「続きから」で再開できます。</p>`,
      buttons: [{ label: 'タイトルへ', value: 'title' }, { label: '対局に戻る', value: null, primary: true }] });
    if (v === 'title') toTitle();
  }
  const on = (id, fn) => $(id).addEventListener('click', (e) => { e.currentTarget.blur(); fn(); });
  on('#btn-undo', doUndo);
  on('#btn-hint', doHint);
  on('#btn-restart', doRestart);

  /* ---------- 入力 ---------- */
  function tryPlace(s) {
    if (!canAct() || s < 0) return;
    if (!game.canPlay(s)) { GK.sfx('tick'); return; }
    cursor = cursor != null ? s : null;
    place(s);
  }
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back') || screen !== 'game' || !game) return;
    if (e.target && e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    const k = e.key;
    if (k.startsWith('Arrow')) {
      e.preventDefault();
      if (cursor == null) { const l = game.moves(); cursor = l.length ? l[0] : R.sq(3, 3); return; }
      let r = R.rowOf(cursor), c = R.colOf(cursor);
      if (k === 'ArrowLeft') c = Math.max(0, c - 1); if (k === 'ArrowRight') c = Math.min(7, c + 1);
      if (k === 'ArrowUp') r = Math.max(0, r - 1); if (k === 'ArrowDown') r = Math.min(7, r + 1);
      cursor = R.sq(r, c); GK.sfx('tick');
    } else if ((k === 'Enter' || k === ' ') && cursor != null) { e.preventDefault(); tryPlace(cursor); }
    else if (k === 'h' || k === 'H') doHint();
    else if (k === 'z' || k === 'Z' || k === 'Backspace') doUndo();
    else if (k === 'Escape') cursor = null;
  });

  /* ---------- 起動 ---------- */
  view = GK.fit(cv, { w: 800, h: 800, onResize: (v) => { view = v; boardImg = renderBoard(); stoneImg = renderStones(); } });
  GK.pointer(cv, view, {
    down: (p) => { if (canAct()) { cursor = null; tryPlace(sqAt(p.x, p.y)); } },
    move: (p, e) => { if (e.pointerType === 'mouse') hover = sqAt(p.x, p.y); },
  });
  cv.addEventListener('pointerleave', () => { hover = -1; });
  GK.loadImages(CPUS.map((c) => c.img));
  GK.loop((dt, t) => { if (screen === 'game') draw(t); });
  buildTitle();
  refreshTitle();

  /* ---------- 自動テスト（npm run game-check） ---------- */
  const waitFor = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await GK.wait(40); } return !!fn(); };
  const clickSq = (s) => { const c = center(s), r = cv.getBoundingClientRect(), k = view.scale; const pt = { clientX: r.left + view.ox + c.x * k, clientY: r.top + view.oy + c.y * k, pointerId: 1, bubbles: true, isPrimary: true, pointerType: 'mouse' }; cv.dispatchEvent(new PointerEvent('pointerdown', pt)); cv.dispatchEvent(new PointerEvent('pointerup', pt)); };
  const clickModal = async (text) => { await waitFor(() => $$('.gk-modal .gk-btn').some((b) => b.textContent.includes(text)), 5000); const b = $$('.gk-modal .gk-btn').find((x) => x.textContent.includes(text)); if (b) b.click(); await GK.wait(250); return !!b; };
  window.__debug = { get game() { return game; }, state: () => ({ screen, over, busy, thinking, mode, level, human, hist: game && game.hist.length }), start: (rows, side, lv = 0) => {
    settings.mode = 'cpu'; settings.level = lv; settings.color = BLACK;
    const b = R.initial();
    rows.forEach((row, r) => [...row].forEach((ch, c) => { b[R.sq(r, c)] = ch === 'X' ? BLACK : ch === 'O' ? WHITE : EMPTY; }));
    startGame(null, b, side);
  } };
  window.__gameSelfTest = async () => {
    const notes = [], shot = (n) => (window.__shot ? window.__shot(n) : null);
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG ' + m); };
    const recBackup = GK.store.get('records', null), setBackup = Object.assign({}, settings);
    GK.store.del('save');
    try {
      refreshTitle();
      await shot('title');
      $('[data-mode="cpu"]').click(); $('.opp[data-lv="0"]').click(); $('[data-color="1"]').click();
      $('#btn-start').click();
      await GK.wait(400);
      if (screen !== 'game') fail('game did not start');
      clickSq(R.sq(2, 3)); // d3
      if (!(await waitFor(() => game.hist.length >= 2 && !busy && !thinking, 8000))) fail('CPU did not answer');
      const [x1, o1] = game.count();
      if (x1 + o1 !== 6) fail('counts after 2 moves ' + x1 + '/' + o1);
      await shot('play');
      $('#btn-hint').click();
      if (!(await waitFor(() => hint, 5000))) fail('hint'); else notes.push('hint ' + R.name(hint));
      await shot('hint');
      $('#btn-undo').click(); await GK.wait(100);
      if (game.hist.length !== 0) fail('undo → ' + game.hist.length);
      clickSq(R.sq(2, 3));
      await waitFor(() => game.hist.length >= 2 && !busy && !thinking, 8000);
      notes.push('moves ' + game.hist.map((h) => R.name(h.s)).join(' '));
      // the CPU (white) must pass, then black plays the last square and wins
      window.__debug.start(['XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXO.'], WHITE, 0);
      if (!(await waitFor(() => game.side === BLACK && !busy, 4000))) fail('CPU pass');
      else notes.push('pass ok');
      clickSq(R.sq(7, 7));
      if (!(await waitFor(() => over, 4000))) fail('game end');
      await waitFor(() => $$('.gk-modal .gk-btn').some((b) => b.textContent.includes('盤面')), 4000);
      await shot('result');
      if (!result || result.res !== 'win' || result.x !== 64) fail('result ' + JSON.stringify(result));
      else notes.push(`result ${result.x}-${result.o} ${result.res}`);
      await clickModal('盤面を見る');
      await shot('look');
      toTitle();
      // two players
      $('[data-mode="pvp"]').click(); $('#btn-start').click();
      await GK.wait(300);
      clickSq(R.sq(2, 3)); await waitFor(() => !busy, 2000);
      clickSq(R.sq(2, 2)); await waitFor(() => !busy, 2000);
      if (game.hist.length !== 2) fail('pvp moves ' + game.hist.length);
      await shot('pvp');
      toTitle();
    } catch (e) { fail(String(e && e.stack || e)); }
    if (recBackup) GK.store.set('records', recBackup); else GK.store.del('records');
    Object.assign(settings, setBackup); GK.store.set('settings', settings); GK.store.del('save');
    refreshTitle();
    return { ok, notes };
  };
})();
