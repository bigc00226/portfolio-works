/* 縁側将棋 — 画面と対局の流れ（ルールは rules.js、CPU の思考は ai.js を worker.js で動かします） */
(() => {
  'use strict';
  const R = window.ShogiRules, AI = window.ShogiAI;
  const { BLACK, WHITE, DROP } = R;
  const T = R.T;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const css = getComputedStyle(document.documentElement);
  const SERIF = css.getPropertyValue('--gk-serif').trim() || 'serif';
  const SANS = css.getPropertyValue('--gk-sans').trim() || 'sans-serif';
  const HAND_ORDER = [T.HI, T.KA, T.KI, T.GI, T.KE, T.KY, T.FU];
  const SIZE = [0, 0.86, 0.9, 0.92, 0.95, 0.95, 0.99, 0.99, 1.02, 0.86, 0.9, 0.92, 0.95, 0, 0.99, 0.99];
  const MIN_THINK = [700, 600, 350, 250];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- 対局相手（オリジナルのキャラクター） ---------- */
  const CPUS = [
    { name: 'たま', role: '縁側の三毛猫', level: '入門', img: 'portrait-tama', desc: 'この家に住みついた三毛猫。駒をつつくのが好き。ほとんど気まぐれに指しますが、ただで取れる駒は見逃しません。',
      lines: { start: ['にゃあ。（よろしく、と言っているようだ）', 'ふにゃ……（座布団の上で盤をのぞきこんだ）'], check: ['にゃっ！（前足で王様をつついた）'], checked: ['にゃ……？（しっぽがぴんと立った）'], win: ['にゃーん♪（しっぽがご機嫌だ）'], lose: ['ふにゃあ……（ごろんと転がった）'], draw: ['にゃ？'] } },
    { name: 'そうた', role: '近所の小学生', level: '初級', desc: 'おじいちゃんに将棋を教わったばかりの小学 4 年生。2 手先まで読みますが、ときどき勢いで指します。', img: 'portrait-sota',
      lines: { start: ['よーし、負けないぞ！', 'じいちゃんに教わったんだ。勝負！'], check: ['王手だっ！', 'へへっ、王手！'], checked: ['うわっ、王手か……', 'えっ、そこ！？'], win: ['やったー！ぼくの勝ち！'], lose: ['くやしい〜！もう一回！'], draw: ['引き分けかー。次は勝つ！'] } },
    { name: '千景', role: '大学将棋部', level: '中級', desc: '大学の将棋部員。何手も先まで読み、駒の取り合いも正確です。考える時間は約 1.5 秒。', img: 'portrait-chikage',
      lines: { start: ['お手やわらかに。……なんて、手は抜きませんよ。', 'よろしくお願いします。'], check: ['王手です。', '王手、ですね。'], checked: ['……いい手ですね。', 'なるほど、そう来ますか。'], win: ['ありがとうございました。いい将棋でした。'], lose: ['参りました。お強いですね。'], draw: ['千日手……指し直しですね。'] } },
    { name: '源三', role: '縁側の主', level: '上級', desc: 'この家のおじいさん。読みの深さは一番で、一度見た局面を覚えて効率よく読みます。考える時間は約 3 秒。', img: 'portrait-genzo',
      lines: { start: ['さて、一局お願いしようかの。', 'ほっほ、手加減はせんぞ。'], check: ['王手じゃ。', 'ほれ、王手。'], checked: ['ほう、やりおるわい。', 'むむ……。'], win: ['ほっほ、まだまだじゃな。またおいで。'], lose: ['参った。見事な指し回しじゃった。'], draw: ['千日手か。いい勝負じゃったな。'] } },
  ];

  const HELP = () => `
    <h3>操作</h3>
    <ul>
      <li>自分の駒をタップ（クリック）すると、動かせるマスに印が付きます。行き先をタップすると指せます。ドラッグして置くこともできます。</li>
      <li>持ち駒は、駒台の駒を選んでから打ちたいマスをタップします。</li>
      <li>成れるときは「成る／成らない」を選びます。行き所のなくなる駒（一段目の歩・香、二段目までの桂）は自動で成ります。</li>
      <li><b>待った</b>…自分の手と相手の手を戻します。<b>ヒント</b>…おすすめの手を矢印で示します。<b>投了</b>…負けを認めて対局を終えます。</li>
      <li>キーボード：矢印キーでカーソル移動、<kbd>Enter</kbd> で選ぶ・指す、<kbd>D</kbd> で持ち駒を選ぶ、<kbd>Z</kbd> で待った、<kbd>H</kbd> でヒント、<kbd>Esc</kbd> で選択の解除。</li>
    </ul>
    <h3>ルール</h3>
    <ul>
      <li>相手の玉を詰ませたら勝ちです（王手をかけて、どう逃げても取られる状態）。</li>
      <li>二歩・打ち歩詰め・行き所のない駒・自分の玉を取られる手などの反則は、はじめから指せないようになっています。</li>
      <li>千日手：同じ局面（盤・持ち駒・手番）が 4 回現れたら引き分けです。ただし、連続王手の千日手は王手をかけ続けた側の負けです。</li>
      <li>持将棋（入玉の点数計算）は採用していません。${R.MAX_MOVES} 手に達したら引き分けにします。</li>
    </ul>
    <h3>手合い</h3>
    <p>平手は先手・後手・振り駒から選べます。駒落ちは、駒を落とす側（上手）が先に指します。「下手」を選ぶと相手が駒を落とし、「上手」を選ぶとあなたが駒を落として指します。</p>
    <h3>対局相手</h3>
    <table>${CPUS.map((c) => `<tr><th>${c.level}</th><td><b>${c.name}</b>（${c.role}）<br>${c.desc}</td></tr>`).join('')}</table>`;

  GK.init({ id: 'shogi', title: '縁側将棋', help: HELP, menu: openMenu });

  /* ---------- 保存 ---------- */
  const settings = Object.assign({ level: 1, handicap: 'hirate', side: 'sente' }, GK.store.get('settings', {}));
  if (!R.HANDICAPS[settings.handicap]) settings.handicap = 'hirate';
  settings.level = GK.clamp(settings.level | 0, 0, 3);
  const records = () => { const r = GK.store.get('records', null); return Array.isArray(r) && r.length === 4 ? r : [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; };

  /* ---------- CPU（Web Worker。使えないときはページの中で短く考えます） ---------- */
  const engine = (() => {
    let worker = null;
    const pending = new Map();
    const local = (req) => new Promise((resolve) => setTimeout(() => {
      const pos = R.Position.fromSFEN(req.sfen);
      req.moves.forEach((m) => pos.make(m));
      const lv = AI.LEVELS[(req.opts && req.opts.level) || 0];
      const r = AI.think(pos, Object.assign({}, req.opts, { timeMs: Math.min((req.opts && req.opts.timeMs) || lv.timeMs, 900) }));
      resolve({ id: req.id, move: r.move, score: r.score });
    }, 20));
    try {
      worker = new Worker('worker.js');
      worker.onmessage = (e) => { const f = pending.get(e.data.id); if (f) { pending.delete(e.data.id); f(e.data); } };
      worker.onerror = (e) => {
        console.warn('[shogi] worker unavailable, thinking in the page', e && e.message);
        worker = null;
        const list = [...pending.values()]; pending.clear(); list.forEach((f) => f(null));
      };
    } catch (e) { worker = null; }
    return {
      ask(req) {
        if (!worker) return local(req);
        return new Promise((resolve) => { pending.set(req.id, (res) => resolve(res || local(req))); worker.postMessage(req); });
      },
    };
  })();

  /* ---------- 状態 ---------- */
  let screen = 'title';
  let game = null, human = BLACK, cpu = WHITE, level = 1, handicap = 'hirate';
  let over = false, reviewing = false, reviewIdx = 0, reviewPos = null, result = null;
  let thinking = false, reqId = 0, hintBusy = false, hintsUsed = 0, undosUsed = 0;
  let legalCache = null, checkCache = null;
  let sel = null, targets = null, drag = null, anim = null, hint = null, cursor = null;
  const fx = [];
  let L = null, boardImg = null;
  const sprites = new Map();

  const cv = $('#cv');
  const flip = () => human === WHITE;
  const dispPos = () => (reviewing ? reviewPos : game.pos);
  const dispLast = () => { const n = reviewing ? reviewIdx : game.moves.length; return n ? game.moves[n - 1] : 0; };
  const legal = () => legalCache || (legalCache = game.legal());
  const C = () => CPUS[level];

  /* ---------- レイアウト ---------- */
  const RB = 1.081; // 盤の高さ / 幅
  function layout(v) {
    const W = v.w, H = v.h, wide = W > 0 && matchMedia('(orientation: landscape)').matches;
    const pad = Math.max(6, Math.min(W, H) * 0.02), topRes = wide ? 0 : 52;
    const bwA = Math.min((W - 2 * pad) / 1.66, (H - 2 * pad) / RB);
    const bwB = Math.min(W - 2 * pad, (H - 2 * pad - topRes - 16) / (RB + 0.44));
    const sides = bwA >= bwB * 0.98;
    const bw = Math.max(120, Math.floor(sides ? bwA : bwB));
    const m = bw * 0.05, cw = (bw - 2 * m) / 9, ch = cw * 1.09, bh = 9 * ch + 2 * m;
    const o = { W, H, sides, bw, bh, m, cw, ch, pw: cw * 0.9, ph: ch * 0.93 };
    if (sides) {
      const S = bw * 0.3, G = bw * 0.03, x0 = (W - (bw + 2 * (S + G))) / 2, y0 = (H - bh) / 2;
      o.bx = x0 + S + G; o.by = y0;
      const ph = Math.min(S, bh * 0.34), nh = bw * 0.075, sh = Math.min(bh * 0.44, bh - ph - nh - 16);
      o.portrait = { x: x0, y: y0, w: S, h: ph };
      o.oppName = { x: x0, y: y0 + ph + 6, w: S, h: nh };
      o.oppStand = { x: x0, y: y0 + ph + nh + 14, w: S, h: sh };
      const rx = o.bx + bw + G;
      o.myStand = { x: rx, y: y0 + bh - sh, w: S, h: sh };
      o.myInfo = { x: rx, y: o.myStand.y - nh * 1.9 - 8, w: S, h: nh * 1.9 };
      o.status = { x: rx, y: y0, w: S, h: Math.min(S * 0.7, o.myInfo.y - y0 - 8) };
    } else {
      const gap = 8, Hb = Math.round(GK.clamp((H - topRes - bh - 2 * gap - 2 * pad) / 2, 56, Math.min(132, bw * 0.3))), TH = Hb * 2 + gap * 2 + bh;
      const x0 = (W - bw) / 2, y0 = topRes + Math.max(0, (H - topRes - TH) / 2);
      o.portrait = { x: x0, y: y0, w: Hb, h: Hb };
      o.oppStand = { x: x0 + Hb + gap, y: y0, w: bw - Hb - gap, h: Hb };
      o.bx = x0; o.by = y0 + Hb + gap;
      o.myStand = { x: x0, y: o.by + bh + gap, w: bw - Hb - gap, h: Hb };
      o.myInfo = { x: x0 + bw - Hb, y: o.myStand.y, w: Hb, h: Hb };
    }
    o.gx = o.bx + m; o.gy = o.by + m;
    o.oppSlots = makeSlots(o, o.oppStand, true);
    o.mySlots = makeSlots(o, o.myStand, false);
    return o;
  }
  function makeSlots(o, r, mirror) {
    const ins = 6, x = r.x + ins, y = r.y + ins, w = r.w - ins * 2, h = r.h - ins * 2;
    let best = null;
    for (const [cols, rows] of [[2, 4], [4, 2], [7, 1], [3, 3]]) {
      const cW = w / cols, cH = h / rows, sc = Math.min(cW / (o.pw * 1.22), cH / (o.ph * 1.08), 1);
      if (!best || sc > best.sc + 0.001) best = { cols, rows, sc, cW, cH };
    }
    return HAND_ORDER.map((t, i) => {
      const col = i % best.cols, row = (i / best.cols) | 0;
      let sx = x + (col + 0.5) * best.cW, sy = y + (row + 0.5) * best.cH;
      if (mirror) { sx = x + w - (sx - x); sy = y + h - (sy - y); }
      return { x: sx, y: sy, sc: best.sc, t };
    });
  }
  function onResize(v) {
    L = layout(v);
    sprites.clear();
    boardImg = renderBoard(v.dpr);
    placeBubble(); placeStamp();
  }

  /* ---------- 盤と駒の絵（コードで描画） ---------- */
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function renderBoard(dpr) {
    const w = L.bw, h = L.bh, c = document.createElement('canvas');
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#edc477'); gr.addColorStop(0.5, '#e2ad5c'); gr.addColorStop(1, '#d99f4f');
    rr(g, 0, 0, w, h, w * 0.012); g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    const rnd = GK.rng(11);
    for (let i = 0; i < 90; i++) { // 柾目
      const y = rnd() * h * 1.1 - h * 0.05, amp = 1 + rnd() * 5, fq = 0.004 + rnd() * 0.01, ph = rnd() * 6;
      g.beginPath();
      for (let x = -4; x <= w + 4; x += 6) { const yy = y + Math.sin(x * fq + ph) * amp + Math.sin(x * fq * 3.1 + ph) * amp * 0.25; if (x < 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
      g.strokeStyle = `rgba(${150 + rnd() * 30 | 0}, ${90 + rnd() * 30 | 0}, 30, ${0.05 + rnd() * 0.12})`;
      g.lineWidth = 0.5 + rnd() * 1.8; g.stroke();
    }
    const vg = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
    vg.addColorStop(0, 'rgba(255,240,200,.12)'); vg.addColorStop(1, 'rgba(90,50,10,.22)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    g.restore();
    rr(g, 0.5, 0.5, w - 1, h - 1, w * 0.012); g.strokeStyle = 'rgba(80,45,10,.55)'; g.lineWidth = 1; g.stroke();
    const { m, cw, ch } = L;
    g.strokeStyle = '#2b1a0a';
    g.lineWidth = Math.max(1, cw * 0.018);
    g.beginPath();
    for (let i = 0; i <= 9; i++) { g.moveTo(m + i * cw, m); g.lineTo(m + i * cw, m + 9 * ch); g.moveTo(m, m + i * ch); g.lineTo(m + 9 * cw, m + i * ch); }
    g.stroke();
    g.lineWidth = Math.max(1.5, cw * 0.035); g.strokeRect(m, m, 9 * cw, 9 * ch);
    g.fillStyle = '#2b1a0a';
    for (const [i, j] of [[3, 3], [6, 3], [3, 6], [6, 6]]) { g.beginPath(); g.arc(m + i * cw, m + j * ch, Math.max(1.6, cw * 0.05), 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#5c3a14'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${Math.max(9, m * 0.62)}px ${SERIF}`;
    for (let d = 0; d < 9; d++) {
      g.fillText(R.ZEN[flip() ? d + 1 : 9 - d], m + (d + 0.5) * cw, m * 0.52);
      g.fillText(R.KAN[flip() ? 9 - d : d + 1], w - m * 0.5, m + (d + 0.5) * ch);
    }
    return c;
  }
  function piecePath(g, w, h) {
    g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(w * 0.4, -h * 0.32); g.lineTo(w * 0.5, h / 2); g.lineTo(-w * 0.5, h / 2); g.lineTo(-w * 0.4, -h * 0.32); g.closePath();
  }
  /** a piece sprite (cached per kind, direction and size) */
  function sprite(code, upside, sc = 1) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const t = code & 15, w = L.pw * SIZE[t] * sc, h = L.ph * SIZE[t] * sc;
    const key = `${code}|${upside ? 1 : 0}|${Math.round(w * dpr)}`;
    let s = sprites.get(key);
    if (s) return s;
    const PADF = 1.36, c = document.createElement('canvas');
    c.width = Math.ceil(w * PADF * dpr); c.height = Math.ceil(h * PADF * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr); g.translate((w * PADF) / 2, (h * PADF) / 2);
    if (upside) g.rotate(Math.PI);
    piecePath(g, w, h);
    g.save();
    g.shadowColor = 'rgba(30,15,0,.45)'; g.shadowBlur = w * 0.1 * dpr; g.shadowOffsetY = h * 0.045 * dpr;
    const gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    gr.addColorStop(0, '#fae7bb'); gr.addColorStop(0.55, '#efcf8e'); gr.addColorStop(1, '#d8a961');
    g.fillStyle = gr; g.fill();
    g.restore();
    g.save(); piecePath(g, w, h); g.clip();
    g.globalAlpha = 0.18; g.strokeStyle = '#a86f2c'; g.lineWidth = 0.6;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(-w / 2, i * h * 0.13); g.quadraticCurveTo(0, i * h * 0.13 + h * 0.05, w / 2, i * h * 0.13 - h * 0.02); g.stroke(); }
    g.restore();
    piecePath(g, w, h);
    g.lineWidth = Math.max(1, w * 0.028); g.strokeStyle = '#8c5f2c'; g.stroke();
    g.beginPath(); g.moveTo(-w * 0.36, -h * 0.28); g.lineTo(0, -h * 0.44); g.lineTo(w * 0.36, -h * 0.28);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(0.8, w * 0.03); g.stroke();
    const ch = t === T.OU ? ((code >> 4) === WHITE ? '王' : '玉') : R.DISP[t];
    g.fillStyle = t > 8 ? '#b0231a' : '#1e140a';
    g.font = `700 ${h * 0.5}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch, 0, h * 0.1);
    s = { c, w: w * PADF, h: h * PADF };
    sprites.set(key, s);
    return s;
  }
  function drawPiece(g, code, x, y, sc = 1, alpha = 1) {
    const s = sprite(code, (code >> 4) !== human, sc);
    if (alpha !== 1) g.globalAlpha = alpha;
    g.drawImage(s.c, x - s.w / 2, y - s.h / 2, s.w, s.h);
    if (alpha !== 1) g.globalAlpha = 1;
  }

  /* ---------- 座標 ---------- */
  const toSq = (dx, dy) => (flip() ? (8 - dy) * 9 + (8 - dx) : dy * 9 + dx);
  const disp = (sq) => (flip() ? [8 - (sq % 9), 8 - ((sq / 9) | 0)] : [sq % 9, (sq / 9) | 0]);
  function sqCenter(sq) { const [dx, dy] = disp(sq); return { x: L.gx + (dx + 0.5) * L.cw, y: L.gy + (dy + 0.5) * L.ch }; }
  function sqAt(x, y) {
    const dx = Math.floor((x - L.gx) / L.cw), dy = Math.floor((y - L.gy) / L.ch);
    return dx < 0 || dx > 8 || dy < 0 || dy > 8 ? -1 : toSq(dx, dy);
  }
  const slotsOf = (color) => (color === human ? L.mySlots : L.oppSlots);
  const slotOf = (color, t) => slotsOf(color)[HAND_ORDER.indexOf(t)];
  function handAt(x, y) {
    const pos = game.pos;
    for (const s of L.mySlots) {
      if (!pos.hand[human * 8 + s.t]) continue;
      if (Math.abs(x - s.x) < L.pw * 0.62 * s.sc && Math.abs(y - s.y) < L.ph * 0.6 * s.sc) return s.t;
    }
    return 0;
  }

  /* ---------- 描画 ---------- */
  function draw(now) {
    const g = view.ctx;
    view.clear();
    if (!game || !L) return;
    const pos = dispPos(), last = dispLast(), { cw, ch } = L;
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
    g.drawImage(boardImg, L.bx, L.by, L.bw, L.bh);
    g.restore();
    const cell = (sq, color) => { const [dx, dy] = disp(sq); g.fillStyle = color; g.fillRect(L.gx + dx * cw + 1, L.gy + dy * ch + 1, cw - 2, ch - 2); };
    if (last) { if ((last & 127) <= DROP) cell(last & 127, 'rgba(255,170,60,.22)'); cell((last >> 7) & 127, 'rgba(255,140,30,.36)'); }
    if (checkCache === null) checkCache = pos.inCheck() ? pos.king[pos.side] : -1;
    if (checkCache >= 0) {
      const c = sqCenter(checkCache), pulse = 0.55 + 0.35 * Math.sin(now * 6);
      const rg = g.createRadialGradient(c.x, c.y, 2, c.x, c.y, cw * 0.9);
      rg.addColorStop(0, `rgba(255,40,20,${0.55 * pulse})`); rg.addColorStop(1, 'rgba(255,40,20,0)');
      g.fillStyle = rg; g.fillRect(c.x - cw, c.y - ch, cw * 2, ch * 2);
    }
    if (sel && sel.from != null) cell(sel.from, 'rgba(70,150,255,.35)');
    const hover = drag && drag.moved ? sqAt(drag.x, drag.y) : -1;
    const hideTo = anim ? anim.to : -1;
    for (let sq = 0; sq < 81; sq++) {
      const p = pos.board[sq];
      if (!p || sq === hideTo) continue;
      if (drag && drag.moved && sel && sel.from === sq) { const c = sqCenter(sq); drawPiece(g, p, c.x, c.y, 1, 0.3); continue; }
      const c = sqCenter(sq);
      drawPiece(g, p, c.x, c.y - (sel && sel.from === sq && !drag ? ch * 0.06 : 0));
    }
    if (targets) {
      for (const sq of targets.keys()) {
        const c = sqCenter(sq);
        if (sq === hover) cell(sq, 'rgba(60,170,90,.35)');
        if (pos.board[sq]) { g.strokeStyle = 'rgba(30,120,60,.85)'; g.lineWidth = Math.max(2, cw * 0.06); rr(g, c.x - cw / 2 + 3, c.y - ch / 2 + 3, cw - 6, ch - 6, cw * 0.15); g.stroke(); }
        else { g.fillStyle = 'rgba(30,110,55,.6)'; g.beginPath(); g.arc(c.x, c.y, cw * 0.14, 0, Math.PI * 2); g.fill(); }
      }
    }
    if (cursor && !reviewing) {
      const sq = toSq(cursor[0], cursor[1]), [dx, dy] = disp(sq);
      g.strokeStyle = 'rgba(40,90,220,.95)'; g.lineWidth = 3; rr(g, L.gx + dx * cw + 2, L.gy + dy * ch + 2, cw - 4, ch - 4, 5); g.stroke();
    }
    drawStand(g, L.oppStand, L.oppSlots, cpu, pos, now);
    drawStand(g, L.myStand, L.mySlots, human, pos, now);
    drawPortrait(g, now);
    drawInfo(g, now);
    if (hint && !reviewing) {
      const a = (hint.m & 127) > DROP ? slotOf(human, (hint.m & 127) - DROP) : sqCenter(hint.m & 127), b = sqCenter((hint.m >> 7) & 127);
      g.globalAlpha = 0.6 + 0.3 * Math.sin(now * 5);
      drawArrow(g, a, b, 'rgba(40,110,235,.9)', cw * 0.16);
      g.globalAlpha = 1;
    }
    if (anim) {
      const k = Math.min(1, (performance.now() - anim.t0) / anim.dur), e = GK.ease.inOutCubic(k);
      if (anim.cap) { const c = sqCenter(anim.to); drawPiece(g, anim.cap, c.x, c.y, 1, 1 - e); }
      const x = GK.lerp(anim.a.x, anim.b.x, e), y = GK.lerp(anim.a.y, anim.b.y, e) - Math.sin(k * Math.PI) * ch * 0.25;
      drawPiece(g, anim.code, x, y, 1 + Math.sin(k * Math.PI) * 0.12);
      if (k >= 1) { const f = anim.done; anim = null; f(); }
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i], k = (performance.now() - f.t0) / 380;
      if (k >= 1) { fx.splice(i, 1); continue; }
      g.strokeStyle = `rgba(255,250,230,${0.7 * (1 - k)})`; g.lineWidth = 3 * (1 - k) + 1;
      g.beginPath(); g.ellipse(f.x, f.y + ch * 0.2, cw * (0.35 + k * 0.5), ch * (0.12 + k * 0.18), 0, 0, Math.PI * 2); g.stroke();
    }
    if (drag && drag.moved && sel) {
      const code = sel.from != null ? pos.board[sel.from] : sel.drop | (human << 4);
      drawPiece(g, code, drag.x, drag.y - ch * 0.35, 1.15);
    }
  }
  function drawArrow(g, a, b, color, w) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.hypot(b.x - a.x, b.y - a.y);
    g.save(); g.translate(a.x, a.y); g.rotate(ang); g.fillStyle = color;
    g.beginPath(); g.moveTo(0, -w / 2); g.lineTo(len - w * 1.8, -w / 2); g.lineTo(len - w * 1.8, -w * 1.3); g.lineTo(len, 0); g.lineTo(len - w * 1.8, w * 1.3); g.lineTo(len - w * 1.8, w / 2); g.lineTo(0, w / 2); g.closePath();
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 6; g.fill(); g.restore();
  }
  function drawStand(g, r, slots, color, pos, now) {
    const active = !over && !reviewing && pos.side === color;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 5;
    rr(g, r.x, r.y, r.w, r.h, 10);
    const gr = g.createLinearGradient(r.x, r.y, r.x, r.y + r.h); gr.addColorStop(0, '#94602f'); gr.addColorStop(1, '#6e4220');
    g.fillStyle = gr; g.fill();
    g.restore();
    rr(g, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 7);
    const gi = g.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); gi.addColorStop(0, '#d9a463'); gi.addColorStop(1, '#c08548');
    g.fillStyle = gi; g.fill();
    if (active) { rr(g, r.x - 1, r.y - 1, r.w + 2, r.h + 2, 11); g.strokeStyle = `rgba(255,214,140,${0.55 + 0.35 * Math.sin(now * 3)})`; g.lineWidth = 2.5; g.stroke(); }
    if (!HAND_ORDER.some((t) => pos.hand[color * 8 + t])) {
      g.fillStyle = 'rgba(90,50,15,.38)'; g.font = `600 ${Math.min(14, r.h * 0.16)}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('持ち駒なし', r.x + r.w / 2, r.y + r.h / 2);
    }
    for (const s of slots) {
      const n = pos.hand[color * 8 + s.t];
      if (!n) continue;
      const code = s.t | (color << 4), isSel = color === human && sel && sel.drop === s.t && !reviewing;
      const lifted = isSel && !(drag && drag.moved) ? -L.ch * 0.1 : 0;
      drawPiece(g, code, s.x, s.y + lifted, s.sc, isSel && drag && drag.moved && n === 1 ? 0.3 : 1);
      if (isSel) { g.strokeStyle = 'rgba(70,150,255,.9)'; g.lineWidth = 2; rr(g, s.x - L.pw * 0.6 * s.sc, s.y - L.ph * 0.6 * s.sc + lifted, L.pw * 1.2 * s.sc, L.ph * 1.2 * s.sc, 6); g.stroke(); }
      if (n > 1) {
        const bx = s.x + L.pw * 0.45 * s.sc, by = s.y + L.ph * 0.36 * s.sc, br = Math.max(8, L.pw * 0.22 * s.sc);
        g.fillStyle = '#3a210d'; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,230,190,.8)'; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = '#fff'; g.font = `700 ${br * 1.15}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(n), bx, by + br * 0.06);
      }
    }
  }
  function drawPortrait(g, now) {
    const r = L.portrait, c = C(), img = GK.images[c.img];
    g.save();
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 5;
    rr(g, r.x, r.y, r.w, r.h, 12); g.fillStyle = '#4a3020'; g.fill();
    g.restore();
    g.save(); rr(g, r.x, r.y, r.w, r.h, 12); g.clip();
    if (img) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, s = Math.max(r.w / iw, r.h / ih);
      g.drawImage(img, r.x + (r.w - iw * s) / 2, r.y + (r.h - ih * s) / 2, iw * s, ih * s);
    }
    if (!L.sides) {
      const gr = g.createLinearGradient(0, r.y + r.h * 0.55, 0, r.y + r.h);
      gr.addColorStop(0, 'rgba(20,10,4,0)'); gr.addColorStop(1, 'rgba(20,10,4,.85)');
      g.fillStyle = gr; g.fillRect(r.x, r.y, r.w, r.h);
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.font = `700 ${Math.max(11, r.h * 0.17)}px ${SERIF}`; g.fillText(c.name, r.x + r.w / 2, r.y + r.h - r.h * 0.2);
      g.font = `600 ${Math.max(9, r.h * 0.12)}px ${SANS}`; g.fillStyle = '#ffd99a'; g.fillText(`${c.level}・${sideLabel(cpu)}`, r.x + r.w / 2, r.y + r.h - r.h * 0.05);
    }
    g.restore();
    const active = !over && !reviewing && dispPos().side === cpu;
    rr(g, r.x, r.y, r.w, r.h, 12); g.strokeStyle = active ? `rgba(255,214,140,${0.6 + 0.35 * Math.sin(now * 3)})` : 'rgba(255,235,200,.35)'; g.lineWidth = active ? 2.5 : 1.5; g.stroke();
    if (L.sides) {
      const n = L.oppName;
      g.fillStyle = '#fff4e0'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.font = `700 ${n.h * 0.56}px ${SERIF}`; g.fillText(c.name, n.x + 2, n.y + n.h / 2);
      const nw = g.measureText(c.name).width;
      g.font = `700 ${n.h * 0.34}px ${SANS}`; g.fillStyle = '#ffcf85';
      g.fillText(`${c.level}・${sideLabel(cpu)}`, n.x + nw + 10, n.y + n.h / 2 + 1);
    }
    if (thinking) {
      const pw = Math.min(r.w * 0.8, 92), ph = Math.max(20, Math.min(26, r.h * 0.2)), px = r.x + (r.w - pw) / 2, py = r.y + 6;
      rr(g, px, py, pw, ph, ph / 2); g.fillStyle = 'rgba(20,12,6,.75)'; g.fill();
      g.fillStyle = '#fff'; g.font = `700 ${ph * 0.5}px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText('考え中', px + ph * 0.45, py + ph / 2 + 1);
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(px + pw - ph * (1.25 - i * 0.36), py + ph / 2 - Math.max(0, Math.sin(now * 7 - i * 0.7)) * 3, ph * 0.09, 0, Math.PI * 2); g.fill(); }
    }
  }
  function sideLabel(color) {
    if (handicap === 'hirate') return color === BLACK ? '先手' : '後手';
    return color === WHITE ? '上手' : '下手';
  }
  function drawInfo(g, now) {
    const pos = dispPos(), myTurn = !over && !reviewing && pos.side === human;
    const r = L.myInfo;
    rr(g, r.x, r.y, r.w, r.h, 12); g.fillStyle = 'rgba(25,15,8,.72)'; g.fill();
    rr(g, r.x, r.y, r.w, r.h, 12); g.strokeStyle = myTurn ? `rgba(255,214,140,${0.6 + 0.35 * Math.sin(now * 3)})` : 'rgba(255,235,200,.25)'; g.lineWidth = myTurn ? 2.5 : 1.2; g.stroke();
    const mark = human === BLACK ? '▲' : '△';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = reviewing ? reviewIdx : game.moves.length;
    if (L.sides) {
      g.fillStyle = '#fff4e0'; g.font = `700 ${r.h * 0.3}px ${SERIF}`; g.fillText(`${mark} あなた`, r.x + r.w / 2, r.y + r.h * 0.36);
      g.fillStyle = '#ffcf85'; g.font = `700 ${r.h * 0.19}px ${SANS}`; g.fillText(sideLabel(human), r.x + r.w / 2, r.y + r.h * 0.72);
      const s = L.status;
      if (s.h > 40) {
        rr(g, s.x, s.y, s.w, s.h, 12); g.fillStyle = 'rgba(25,15,8,.6)'; g.fill();
        g.fillStyle = '#ffcf85'; g.font = `700 ${Math.min(14, s.h * 0.16)}px ${SANS}`; g.fillText(R.HANDICAPS[handicap].name, s.x + s.w / 2, s.y + s.h * 0.2);
        g.fillStyle = '#fff4e0'; g.font = `700 ${Math.min(30, s.h * 0.3)}px ${SERIF}`;
        g.fillText(reviewing ? `${n} 手目` : n ? `${n} 手目まで` : '開始局面', s.x + s.w / 2, s.y + s.h * 0.5);
        g.font = `700 ${Math.min(15, s.h * 0.17)}px ${SANS}`; g.fillStyle = myTurn ? '#ffe2a8' : '#e9dcc8';
        g.fillText(statusText(), s.x + s.w / 2, s.y + s.h * 0.8);
      }
    } else {
      g.fillStyle = '#fff4e0'; g.font = `700 ${r.h * 0.2}px ${SERIF}`; g.fillText('あなた', r.x + r.w / 2, r.y + r.h * 0.24);
      g.fillStyle = '#ffcf85'; g.font = `700 ${r.h * 0.15}px ${SANS}`; g.fillText(`${mark}${sideLabel(human)}`, r.x + r.w / 2, r.y + r.h * 0.48);
      g.fillStyle = myTurn ? '#ffe2a8' : '#e9dcc8'; g.font = `700 ${r.h * 0.14}px ${SANS}`;
      g.fillText(reviewing ? `${n}手目` : myTurn ? 'あなたの番' : over ? '終局' : `${n}手目`, r.x + r.w / 2, r.y + r.h * 0.76);
    }
  }
  function statusText() {
    if (reviewing) return '棋譜を再生中';
    if (over) return '終局';
    return dispPos().side === human ? 'あなたの番です' : thinking ? '相手が考えています' : '相手の番です';
  }

  /* ---------- 吹き出し・スタンプ ---------- */
  const bubble = $('#bubble'), stampEl = $('#stamp');
  let bubbleTimer = 0;
  function say(lines, ms = 3000) {
    if (!L || screen !== 'game') return;
    bubble.textContent = Array.isArray(lines) ? pick(lines) : lines;
    placeBubble();
    bubble.classList.add('on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
  }
  function placeBubble() {
    if (!L) return;
    const r = L.portrait;
    bubble.classList.toggle('side', !L.sides);
    bubble.style.left = `${L.sides ? r.x + Math.min(r.w * 0.25, 30) : L.oppStand.x + 10}px`;
    bubble.style.top = `${L.sides ? r.y + r.h + L.oppName.h + 10 : r.y + Math.max(4, r.h * 0.12)}px`;
    bubble.style.maxWidth = `${Math.min(300, L.sides ? L.bw * 0.7 : L.oppStand.w - 16)}px`;
  }
  function stamp(text, kind) {
    stampEl.textContent = text;
    stampEl.className = 'stamp';
    void stampEl.offsetWidth;
    stampEl.className = 'stamp ' + kind;
    placeStamp();
  }
  function placeStamp() {
    if (!L) return;
    stampEl.style.left = `${L.bx + L.bw / 2}px`;
    stampEl.style.top = `${L.by + L.bh / 2}px`;
    stampEl.style.fontSize = `${L.bw * (stampEl.textContent.length > 2 ? 0.13 : 0.19)}px`;
  }

  /* ---------- 音（効果音と BGM はすべて WebAudio で合成。曲はこのゲームのための自作） ---------- */
  GK.sfx.define('take', () => { GK.noise({ d: 0.05, v: 0.6, f: 2500, q: 4 }); GK.tone({ f: 400, f2: 230, d: 0.08, type: 'sine', v: 0.4 }); GK.noise({ d: 0.04, v: 0.3, f: 3300, q: 5, at: 0.07 }); });
  GK.sfx.define('oute', () => { GK.tone({ f: 120, f2: 60, d: 0.4, type: 'sine', v: 0.6 }); GK.noise({ d: 0.14, v: 0.35, f: 700, q: 0.8 }); GK.tone({ f: 120, f2: 60, d: 0.35, type: 'sine', v: 0.45, at: 0.16 }); });
  GK.sfx.define('lift', () => GK.tone({ f: 1250, d: 0.03, type: 'triangle', v: 0.08 }));
  const TITLE_SONG = {
    bpm: 80, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.11, notes: 'A4 - B4 D5 E5 - D5 B4 | A4 - G4 E4 G4 - - . | A4 - B4 D5 E5 - G5 E5 | D5 - B4 A4 B4 - - . | E5 - G5 A5 G5 - E5 D5 | E5 - D5 B4 A4 - - . | G4 - A4 B4 D5 - B4 A4 | G4 - E4 G4 A4 - - . |' },
      { type: 'sine', v: 0.06, notes: 'D3 A3 D4 E4 A4 E4 D4 A3 | D3 A3 D4 E4 A4 E4 D4 A3 | G3 D4 G4 A4 B4 A4 G4 D4 | A3 E4 A4 B4 D5 B4 A4 E4 | G3 D4 G4 A4 B4 A4 G4 D4 | D3 A3 D4 E4 A4 E4 D4 A3 | E3 B3 E4 G4 B4 G4 E4 B3 | A3 E4 A4 B4 D5 B4 A4 E4 |' },
      { type: 'sine', v: 0.1, notes: 'D2 - - - - - - - | D2 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | G2 - - - - - - - | D2 - - - - - - - | E2 - - - - - - - | A2 - - - - - - - |' },
    ],
  };
  const GAME_SONG = {
    bpm: 60, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.06, notes: 'D5 - - . B4 - A4 . | G4 - - - - - . . | A4 - B4 . D5 - - . | E5 - - - - - . . | D5 - B4 . A4 - G4 . | E4 - - - - - . . | G4 - A4 . B4 - - . | A4 - - - - - . . | . . . . . . . . | . . . . . . . . |' },
      { type: 'sine', v: 0.045, notes: 'D3 . A3 . D4 . A3 . | G3 . D4 . G4 . D4 . | D3 . A3 . D4 . A3 . | A3 . E4 . A4 . E4 . | G3 . D4 . G4 . D4 . | E3 . B3 . E4 . B3 . | G3 . D4 . G4 . D4 . | A3 . E4 . A4 . E4 . | D3 . A3 . D4 . . . | D3 . . . . . . . |' },
      { type: 'sine', v: 0.07, notes: 'D2 - - - - - - - | G2 - - - - - - - | D2 - - - - - - - | A2 - - - - - - - | G2 - - - - - - - | E2 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | D2 - - - - - - - | D2 - - - - - - - |' },
    ],
  };
  function furin() {
    if (GK.muted) return;
    const f = 2350 + Math.random() * 500;
    [0, 0.2, 0.55].forEach((at, i) => { GK.tone({ f: f * (i === 1 ? 1.19 : 1), d: 1.7, type: 'sine', v: 0.03, at }); GK.tone({ f: f * 2.76, d: 0.7, type: 'sine', v: 0.01, at }); });
  }
  setInterval(() => { if (screen === 'game' && !document.hidden && Math.random() < 0.03) furin(); }, 1000);
  let musicOn = false;
  function playMusic(song) { musicOn = true; GK.music.play(song); }
  addEventListener('pointerdown', () => { if (!musicOn && screen === 'title') playMusic(TITLE_SONG); }, { once: true });

  /* ---------- タイトル画面 ---------- */
  function buildTitle() {
    $('#opps').innerHTML = CPUS.map((c, i) => `<button type="button" class="opp" data-lv="${i}" aria-pressed="false"><img src="img/${c.img}.webp" alt="" draggable="false"><span class="opp-txt"><span class="opp-lv">${c.level}</span><b>${c.name}</b><small>${c.role}</small><em class="opp-rec"></em></span></button>`).join('');
    $('#hc').innerHTML = Object.entries(R.HANDICAPS).map(([k, h]) => `<button type="button" class="chip" data-hc="${k}" aria-pressed="false">${h.name}</button>`).join('');
    $$('.opp').forEach((b) => b.addEventListener('click', () => { settings.level = +b.dataset.lv; GK.sfx('select'); refreshTitle(); }));
    $$('#hc .chip').forEach((b) => b.addEventListener('click', () => { settings.handicap = b.dataset.hc; GK.sfx('select'); refreshTitle(); }));
    $('#btn-start').addEventListener('click', () => { GK.sfx('ok'); startGame(null); });
    $('#btn-resume').addEventListener('click', () => { GK.sfx('ok'); const s = GK.store.get('save', null); if (s) startGame(s); });
  }
  function refreshTitle() {
    const recs = records();
    $$('.opp').forEach((b) => {
      const lv = +b.dataset.lv, on = lv === settings.level, r = recs[lv];
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
      b.querySelector('.opp-rec').textContent = r[0] + r[1] + r[2] ? `${r[0]}勝 ${r[1]}敗${r[2] ? ` ${r[2]}分` : ''}` : 'まだ対局なし';
    });
    $$('#hc .chip').forEach((b) => { const on = b.dataset.hc === settings.handicap; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const opts = settings.handicap === 'hirate' ? [['sente', '先手（▲）'], ['gote', '後手（△）'], ['random', '振り駒']] : [['shitate', '下手（落としてもらう）'], ['uwate', '上手（駒を落とす）']];
    if (!opts.some((o) => o[0] === settings.side)) settings.side = opts[0][0];
    $('#side-h').textContent = settings.handicap === 'hirate' ? '手番' : '立場';
    $('#sides').innerHTML = opts.map(([k, l]) => `<button type="button" class="chip${k === settings.side ? ' on' : ''}" data-side="${k}" aria-pressed="${k === settings.side}">${l}</button>`).join('');
    $$('#sides .chip').forEach((b) => b.addEventListener('click', () => { settings.side = b.dataset.side; GK.sfx('select'); refreshTitle(); }));
    const save = GK.store.get('save', null), rb = $('#btn-resume');
    rb.hidden = !save;
    if (save && CPUS[save.level]) rb.textContent = `続きから（${CPUS[save.level].name}・${save.moves.length ? save.moves.length + " 手目" : "開始局面"}）`;
    GK.store.set('settings', settings);
  }
  function toTitle() {
    screen = 'title'; reqId++; thinking = false; anim = null;
    document.body.classList.remove('review', 'kifu-open');
    bubble.classList.remove('on'); stampEl.className = 'stamp';
    $('#title').classList.remove('hide');
    refreshTitle();
    if (musicOn) playMusic(TITLE_SONG); else GK.music.stop();
    setTimeout(() => $('#btn-start').focus({ preventScroll: true }), 50);
  }

  /* ---------- 対局 ---------- */
  function startGame(save, sfenOverride) {
    if (save) { level = save.level; handicap = save.handicap; human = save.human; }
    else {
      level = settings.level; handicap = settings.handicap;
      if (handicap === 'hirate') {
        if (settings.side === 'random') {
          const fu = [0, 0, 0, 0, 0].filter(() => Math.random() < 0.5).length;
          human = fu >= 3 ? BLACK : WHITE;
          setTimeout(() => GK.toast(`振り駒：歩が ${fu} 枚、と金が ${5 - fu} 枚 → あなたは${human === BLACK ? '先手' : '後手'}です`, 3200), 400);
        } else human = settings.side === 'gote' ? WHITE : BLACK;
      } else human = settings.side === 'uwate' ? WHITE : BLACK;
    }
    cpu = human ^ 1;
    game = new R.Game(sfenOverride || R.HANDICAPS[handicap].sfen);
    game.firstSideColor = game.pos.side;
    if (save) for (const m of save.moves) { if (!game.legal().includes(m)) break; game.play(m); }
    over = false; reviewing = false; reviewPos = null; result = null; thinking = false; reqId++;
    sel = null; targets = null; drag = null; anim = null; hint = null; cursor = null; legalCache = null; checkCache = null;
    hintsUsed = save ? save.hints || 0 : 0; undosUsed = save ? save.undos || 0 : 0;
    screen = 'game';
    $('#title').classList.add('hide');
    document.body.classList.remove('review', 'kifu-open');
    stampEl.className = 'stamp';
    $('#kifu-hc').textContent = `${R.HANDICAPS[handicap].name}・${C().name}（${C().level}）`;
    onResize(view);
    renderKifu(); updateControls();
    playMusic(GAME_SONG);
    say(C().lines.start);
    saveGame();
    const st = game.status();
    if (st.over) { endGame(st); return; }
    if (game.pos.side === cpu) setTimeout(() => { if (screen === 'game' && !over && game.pos.side === cpu && !thinking) requestCpu(); }, 900);
  }
  function saveGame() {
    if (!game || over || sfenCustom()) return;
    GK.store.set('save', { v: 1, level, handicap, human, moves: game.moves.slice(), hints: hintsUsed, undos: undosUsed });
  }
  const sfenCustom = () => game && game.startSfen !== R.HANDICAPS[handicap].sfen;
  const canAct = () => screen === 'game' && game && !over && !reviewing && !thinking && !anim && game.pos.side === human && !document.querySelector('.gk-modal-back');

  function select(s) {
    sel = s; targets = new Map();
    for (const m of legal()) {
      const from = m & 127;
      if (s.from != null ? from !== s.from : from !== DROP + s.drop) continue;
      const to = (m >> 7) & 127;
      if (!targets.has(to)) targets.set(to, []);
      targets.get(to).push(m);
    }
    GK.sfx('lift');
  }
  function deselect() { sel = null; targets = null; }

  async function doTarget(sq, dragged) {
    const list = targets.get(sq);
    if (!list) return;
    let m = list[0];
    if (list.length > 1) {
      const t = sel.from != null ? game.pos.board[sel.from] & 15 : sel.drop;
      const ans = await GK.modal({
        title: '成りますか？',
        body: `<p class="promo-q">${R.DISP[t]} が敵陣に入ります。成ると <b style="color:#b0231a">${R.DISP[t + 8]}</b>（${R.NAME[t + 8]}）になります。</p>`,
        buttons: [{ label: `成らない（${R.DISP[t]}）`, value: false }, { label: `成る（${R.DISP[t + 8]}）`, value: true, primary: true }],
      });
      if (ans === null || ans === undefined) return;
      m = list.find((x) => !!((x >> 14) & 1) === ans) || list[0];
    }
    deselect();
    await commitMove(m, !dragged);
  }

  function runAnim(a) { return new Promise((resolve) => { anim = Object.assign(a, { t0: performance.now(), done: resolve }); }); }

  async function commitMove(m, animate) {
    const pos = game.pos, from = m & 127, to = (m >> 7) & 127, mover = pos.side;
    const code = from > DROP ? (from - DROP) | (mover << 4) : pos.board[from];
    const cap = pos.board[to];
    const a = from > DROP ? slotOf(mover, from - DROP) : sqCenter(from);
    hint = null; cursor = cursor && mover === human ? cursor : null;
    game.play(m);
    legalCache = null; checkCache = null;
    if (animate) await runAnim({ code, a: { x: a.x, y: a.y }, b: sqCenter(to), to, cap, dur: mover === cpu ? 260 : 170 });
    GK.sfx(cap ? 'take' : 'place');
    const c = sqCenter(to);
    fx.push({ x: c.x, y: c.y, t0: performance.now() });
    renderKifu(); saveGame();
    const st = game.status();
    if (st.over) { endGame(st); return; }
    if (st.check) {
      GK.sfx('oute'); stamp('王手', 'oute');
      say(mover === cpu ? C().lines.check : C().lines.checked, 2400);
    }
    if (game.pos.side === cpu) requestCpu();
  }

  function requestCpu() {
    thinking = true;
    const id = ++reqId, t0 = performance.now();
    engine.ask({ id, sfen: game.startSfen, moves: game.moves.slice(), opts: { level } }).then(async (res) => {
      if (id !== reqId || screen !== 'game' || over) return;
      const el = performance.now() - t0;
      if (el < MIN_THINK[level]) await GK.wait(MIN_THINK[level] - el);
      if (id !== reqId || over) return;
      thinking = false;
      let mv = res && res.move;
      const ok = legal();
      if (!mv || !ok.includes(mv)) mv = ok[Math.floor(Math.random() * ok.length)];
      if (level >= 2 && res && res.score <= -(AI.MATE - 400) && game.moves.length > 20) { endGame({ over: true, winner: human, reason: 'cpu-resign' }); return; }
      await commitMove(mv, true);
    });
  }

  async function doHint() {
    if (!canAct() || hintBusy) return;
    hintBusy = true; GK.toast('考えています…', 1400);
    const n = game.moves.length;
    const res = await engine.ask({ id: 'h' + (++reqId), sfen: game.startSfen, moves: game.moves.slice(), opts: { level: 2, timeMs: 1000 } });
    hintBusy = false;
    if (!game || game.moves.length !== n || over || !res || !res.move || !legal().includes(res.move)) return;
    hint = { m: res.move };
    hintsUsed++;
    GK.sfx('select');
    GK.toast(`ヒント：${human === BLACK ? '▲' : '△'}${game.pos.notation(res.move, game.lastTo())}`, 3000);
  }

  function doUndo() {
    if (!game || over || reviewing || anim || screen !== 'game') return;
    if (!game.movers.includes(human)) { GK.toast('まだ戻せる手がありません'); return; }
    if (thinking) { reqId++; thinking = false; }
    while (game.moves.length) { const who = game.movers[game.movers.length - 1]; game.undo(); if (who === human) break; }
    undosUsed++;
    deselect(); hint = null; legalCache = null; checkCache = null;
    renderKifu(); saveGame();
    GK.sfx('select');
    GK.toast(`待った：${game.moves.length} 手目まで戻しました`);
  }

  async function doResign() {
    if (!game || over || reviewing || screen !== 'game') return;
    const v = await GK.modal({ title: '投了しますか？', body: '<p>負けを認めて、この対局を終えます。</p>', buttons: [{ label: '続ける', value: false }, { label: '投了する', value: true, primary: true }] });
    if (v && !over) { reqId++; thinking = false; endGame({ over: true, winner: cpu, reason: 'resign' }); }
  }

  async function endGame(st) {
    over = true; thinking = false; reqId++;
    deselect(); hint = null; drag = null;
    GK.store.del('save');
    const res = st.winner === human ? 'win' : st.winner === -1 ? 'draw' : 'lose';
    result = { st, res };
    if (!sfenCustom()) { const recs = records(); recs[level][res === 'win' ? 0 : res === 'lose' ? 1 : 2]++; GK.store.set('records', recs); }
    GK.music.stop();
    stamp(res === 'win' ? '勝ち' : res === 'lose' ? '負け' : '引き分け', res);
    GK.sfx(res === 'win' ? 'win' : res === 'lose' ? 'lose' : 'ok');
    say(res === 'win' ? C().lines.lose : res === 'lose' ? C().lines.win : C().lines.draw, 4000);
    updateControls();
    await GK.wait(1500);
    if (screen === 'game' && over && !reviewing) showResult();
  }
  async function showResult() {
    const { st, res } = result, c = C(), rec = records()[level];
    const reason = {
      mate: st.winner === human ? `${c.name}の玉を詰ませました。` : 'あなたの玉が詰まされました。',
      resign: 'あなたが投了しました。',
      'cpu-resign': `${c.name}が投了しました。`,
      sennichite: '同じ局面が 4 回現れたので、千日手で引き分けです。',
      perpetual: st.winner === human ? `${c.name}の連続王手の千日手で、あなたの勝ちです。` : '連続王手の千日手は、王手をかけ続けた側の負けです。',
      maxmoves: `${R.MAX_MOVES} 手に達したので、引き分けです。`,
    }[st.reason] || '';
    const body = `<div class="result"><p>${reason}</p><table>
      <tr><th>対局相手</th><td>${c.name}（${c.level}）</td></tr>
      <tr><th>手合い</th><td>${R.HANDICAPS[handicap].name}・あなたは${sideLabel(human)}</td></tr>
      <tr><th>手数</th><td>${game.moves.length} 手</td></tr>
      <tr><th>待った・ヒント</th><td>${undosUsed} 回・${hintsUsed} 回</td></tr>
      <tr><th>${c.name}との成績</th><td>${rec[0]}勝 ${rec[1]}敗${rec[2] ? ` ${rec[2]}分` : ''}</td></tr></table></div>`;
    const v = await GK.modal({ title: res === 'win' ? '勝ち！' : res === 'lose' ? '負け' : '引き分け', body, dismissable: false,
      buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: '盤面を見る', value: 'review' }, { label: 'もう一局', value: 'again', primary: true }] });
    if (v === 'again') startGame(null, sfenCustom() ? game.startSfen : null);
    else if (v === 'review') startReview();
    else toTitle();
  }
  function startReview() {
    reviewing = true; stampEl.className = 'stamp';
    document.body.classList.add('review');
    setReview(game.moves.length);
    updateControls();
  }
  function setReview(i) {
    reviewIdx = GK.clamp(i, 0, game.moves.length);
    reviewPos = game.positionAt(reviewIdx);
    checkCache = null;
    renderKifu();
  }

  /* ---------- 棋譜・ボタン ---------- */
  const kifuEl = $('#kifu');
  function renderKifu() {
    if (!game) return;
    const cur = reviewing ? reviewIdx : game.moves.length;
    kifuEl.innerHTML = `<li data-i="0" class="start${cur === 0 ? ' cur' : ''}"><span class="no"></span><span>開始局面（${R.HANDICAPS[handicap].name}）</span></li>` +
      game.notes.map((n, i) => `<li data-i="${i + 1}"${cur === i + 1 ? ' class="cur"' : ''}><span class="no">${i + 1}</span><span>${n}</span></li>`).join('');
    const el = kifuEl.querySelector('.cur');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }
  kifuEl.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li && reviewing) { setReview(+li.dataset.i); GK.sfx('tick'); } });
  function updateControls() {
    $('#ctrl').hidden = reviewing;
    $('#ctrl-review').hidden = !reviewing;
  }
  const on = (id, fn) => $(id).addEventListener('click', (e) => { e.currentTarget.blur(); fn(); });
  on('#btn-undo', doUndo);
  on('#btn-hint', doHint);
  on('#btn-resign', doResign);
  on('#btn-prev', () => { setReview(reviewIdx - 1); GK.sfx('tick'); });
  on('#btn-next', () => { setReview(reviewIdx + 1); GK.sfx('tick'); });
  on('#btn-again', () => { GK.sfx('ok'); startGame(null, sfenCustom() ? game.startSfen : null); });
  const toggleKifu = () => { document.body.classList.toggle('kifu-open'); GK.sfx('click'); renderKifu(); };
  on('#btn-kifu', toggleKifu);
  on('#btn-kifu2', toggleKifu);
  on('#btn-copy', copyKifu);
  function kifuText() {
    const c = C(), names = { [human]: 'あなた', [cpu]: `${c.name}（${c.level}）` };
    const hd = handicap === 'hirate' ? `先手：${names[BLACK]}\n後手：${names[WHITE]}` : `下手：${names[BLACK]}\n上手：${names[WHITE]}`;
    return `手合割：${R.HANDICAPS[handicap].name}\n${hd}\n` + game.notes.map((n, i) => `${String(i + 1).padStart(4)} ${n}`).join('\n') + (over && result ? `\nまで${game.moves.length}手で${result.res === 'draw' ? '引き分け' : (result.st.winner === BLACK ? (handicap === 'hirate' ? '先手' : '下手') : (handicap === 'hirate' ? '後手' : '上手')) + 'の勝ち'}` : '');
  }
  function copyKifu() {
    if (!game) return;
    const text = kifuText();
    const done = () => GK.toast('棋譜をコピーしました'), fail = () => GK.toast('コピーできませんでした');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail); else fail();
  }
  async function openMenu() {
    GK.sfx('click');
    if (screen !== 'game') { GK.help(); return; }
    const v = await GK.modal({ title: 'メニュー', body: `<p>${C().name}（${C().level}）・${R.HANDICAPS[handicap].name}・${game.moves.length} 手${over ? '（終局）' : ''}</p><p style="font-size:13px;color:#7b6146">対局の途中でタイトルに戻っても、次は「続きから」で再開できます。</p>`,
      buttons: [{ label: '棋譜をコピー', value: 'copy' }, { label: 'タイトルへ', value: 'title' }, { label: '対局に戻る', value: null, primary: true }] });
    if (v === 'copy') copyKifu(); else if (v === 'title') toTitle();
  }

  /* ---------- 入力（マウス・タッチ・キーボード） ---------- */
  function onDown(p) {
    if (!canAct()) return;
    cursor = null;
    const sq = sqAt(p.x, p.y);
    if (sel && sq >= 0 && targets && targets.has(sq)) { doTarget(sq, false); return; }
    if (sq >= 0) {
      const pc = game.pos.board[sq];
      if (pc && (pc >> 4) === human) { const again = sel && sel.from === sq; select({ from: sq }); drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, again }; return; }
    }
    const ht = handAt(p.x, p.y);
    if (ht) { const again = sel && sel.drop === ht; select({ drop: ht }); drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, again }; return; }
    deselect();
  }
  function onMove(p) {
    if (!drag) return;
    drag.x = p.x; drag.y = p.y;
    if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > L.cw * 0.3) drag.moved = true;
  }
  function onUp(p) {
    if (!drag) return;
    const d = drag; drag = null;
    if (!sel) return;
    if (d.moved) { const sq = sqAt(p.x, p.y); if (sq >= 0 && targets && targets.has(sq)) doTarget(sq, true); /* otherwise keep the selection for tapping */ }
    else if (d.again) deselect();
  }
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back') || screen !== 'game' || !game) return;
    if (e.target && /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && (e.key === 'Enter' || e.key === ' ')) return;
    if (reviewing) {
      if (e.key === 'ArrowLeft') { setReview(reviewIdx - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setReview(reviewIdx + 1); e.preventDefault(); }
      return;
    }
    const k = e.key;
    if (k.startsWith('Arrow')) {
      e.preventDefault();
      if (!cursor) { cursor = sel && sel.from != null ? disp(sel.from) : [4, 6]; return; }
      if (k === 'ArrowLeft') cursor[0] = Math.max(0, cursor[0] - 1);
      if (k === 'ArrowRight') cursor[0] = Math.min(8, cursor[0] + 1);
      if (k === 'ArrowUp') cursor[1] = Math.max(0, cursor[1] - 1);
      if (k === 'ArrowDown') cursor[1] = Math.min(8, cursor[1] + 1);
      GK.sfx('tick');
    } else if ((k === 'Enter' || k === ' ') && cursor) {
      e.preventDefault();
      if (!canAct()) return;
      const sq = toSq(cursor[0], cursor[1]);
      if (sel && targets && targets.has(sq)) { doTarget(sq, false); return; }
      const pc = game.pos.board[sq];
      if (pc && (pc >> 4) === human) { if (sel && sel.from === sq) deselect(); else select({ from: sq }); } else deselect();
    } else if (k === 'd' || k === 'D') {
      if (!canAct()) return;
      const kinds = HAND_ORDER.filter((t) => game.pos.hand[human * 8 + t]);
      if (!kinds.length) { GK.toast('持ち駒がありません'); return; }
      const i = sel && sel.drop ? kinds.indexOf(sel.drop) : -1;
      if (i === kinds.length - 1) deselect(); else select({ drop: kinds[i + 1] });
      if (!cursor) cursor = [4, 4];
    } else if (k === 'Escape') { deselect(); cursor = null; }
    else if (k === 'z' || k === 'Z' || k === 'Backspace') doUndo();
    else if (k === 'h' || k === 'H') doHint();
  });

  /* ---------- 起動 ---------- */
  const view = GK.fit(cv, { onResize: (v) => onResize(v) });
  GK.pointer(cv, view, { down: onDown, move: onMove, up: onUp });
  GK.loadImages(CPUS.map((c) => c.img));
  GK.loop((dt, t) => { if (screen === 'game') draw(t); });
  buildTitle();
  refreshTitle();

  /* ---------- 自動テスト（npm run game-check） ---------- */
  const waitFor = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await GK.wait(40); } return !!fn(); };
  const clientOf = (sq) => { const c = sqCenter(sq), r = cv.getBoundingClientRect(); return { clientX: r.left + c.x, clientY: r.top + c.y }; };
  const fire = (type, pt) => cv.dispatchEvent(new PointerEvent(type, Object.assign({ pointerId: 1, bubbles: true, isPrimary: true, pointerType: 'mouse' }, pt)));
  const usiSq = (s) => (s.charCodeAt(1) - 97) * 9 + (9 - +s[0]);
  const tap = async (s) => { const pt = clientOf(usiSq(s)); fire('pointerdown', pt); fire('pointerup', pt); await GK.wait(80); };
  const clickModal = async (text) => { await waitFor(() => $$('.gk-modal .gk-btn').some((b) => b.textContent.includes(text)), 4000); const b = $$('.gk-modal .gk-btn').find((x) => x.textContent.includes(text)); if (b) b.click(); await GK.wait(250); return !!b; };
  window.__debug = { get game() { return game; }, start: (sfen, lv = 0) => { settings.level = lv; settings.handicap = 'hirate'; settings.side = 'sente'; startGame(null, sfen); }, state: () => ({ screen, over, reviewing, thinking, human, level, moves: game && game.notes }) };
  window.__gameSelfTest = async () => {
    const notes = [], shot = (n) => (window.__shot ? window.__shot(n) : null);
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG ' + m); };
    const recBackup = GK.store.get('records', null), setBackup = Object.assign({}, settings);
    GK.store.del('save');
    try {
      refreshTitle();
      await shot('title');
      $('.opp[data-lv="0"]').click(); $('[data-hc="hirate"]').click(); $('[data-side="sente"]').click();
      $('#btn-start').click();
      await GK.wait(500);
      if (screen !== 'game') fail('game did not start');
      await tap('7g');
      if (!sel || !targets || !targets.has(usiSq('7f'))) fail('tap select 7g');
      await tap('7f');
      if (!(await waitFor(() => game.moves.length >= 2 && !thinking && !anim, 9000))) fail('CPU did not answer');
      // drag 2g → 2f
      const a = clientOf(usiSq('2g')), b = clientOf(usiSq('2f'));
      fire('pointerdown', a); fire('pointermove', { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 }); fire('pointermove', b); fire('pointerup', b);
      if (!(await waitFor(() => game.moves.length >= 4 && !thinking && !anim, 9000))) fail('drag move / CPU answer');
      notes.push('棋譜 ' + game.notes.join(' '));
      await shot('play');
      $('#btn-hint').click();
      if (!(await waitFor(() => hint, 6000))) fail('hint'); else notes.push('hint ' + R.toUSI(hint.m));
      await shot('hint');
      const n0 = game.moves.length;
      $('#btn-undo').click(); await GK.wait(80);
      if (game.moves.length !== n0 - 2) fail(`undo ${n0} → ${game.moves.length}`);
      if (GK.isPortrait()) { $('#btn-kifu').click(); await GK.wait(400); await shot('kifu-drawer'); $('#btn-kifu').click(); await GK.wait(300); }
      // promotion choice: silver 3d → 3c
      window.__debug.start('4k4/9/9/6S2/9/9/9/9/4K4 b - 1', 0);
      await GK.wait(200);
      await tap('3d'); await tap('3c');
      await GK.wait(300);
      await shot('promote');
      if (!(await clickModal('成る（'))) fail('promotion modal');
      await waitFor(() => !anim, 2000);
      if ((game.pos.board[usiSq('3c')] & 15) !== T.NG) fail('promotion result');
      await waitFor(() => !thinking && !anim, 6000);
      // mate in one → result screen
      window.__debug.start('7nk/9/6G1P/8L/9/9/9/9/4K4 b - 1', 0);
      await GK.wait(200);
      await tap('1c'); await tap('1b');
      await clickModal('成る（');
      if (!(await waitFor(() => over, 3000))) fail('mate not detected');
      await waitFor(() => $$('.gk-modal .gk-btn').some((x) => x.textContent.includes('盤面')), 4000);
      await shot('result');
      if (result && result.res !== 'win') fail('result ' + JSON.stringify(result));
      await clickModal('盤面を見る');
      if (!reviewing) fail('review'); else { $('#btn-prev').click(); await GK.wait(200); if (reviewIdx !== game.moves.length - 1) fail('review prev'); }
      await shot('review');
      notes.push(`result ${result && result.res} (${result && result.st.reason})`);
      toTitle();
    } catch (e) { fail(String(e && e.stack || e)); }
    if (recBackup) GK.store.set('records', recBackup); else GK.store.del('records');
    Object.assign(settings, setBackup); GK.store.set('settings', settings); GK.store.del('save');
    refreshTitle();
    return { ok, notes };
  };
})();
