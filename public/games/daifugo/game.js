/* 番狂わせ大富豪 — table, cards (code-drawn), input, flow (rules / CPU: rules.js) */
(() => {
  'use strict';
  const R = window.DaifugoRules;
  const $ = (s) => document.querySelector(s);
  const { clamp } = GK;
  const SANS = (getComputedStyle(document.documentElement).getPropertyValue('--gk-sans') || 'sans-serif').trim();
  const font = (px, w = 700) => `${w} ${Math.max(6, Math.round(px * 10) / 10)}px ${SANS}`;
  const ABORT = { abort: true };
  const rng = GK.rng();

  /* ---------------- data ---------------- */
  const CPUS = [
    null,
    { id: 'hayate', name: 'ハヤテ', persona: 'hayate', color: '#e0782c', style: '速攻派', desc: '商店街の配達少年。弱い札からどんどん出して、いち早く上がりたい。',
      lines: { start: ['よーし、速攻で上がるぞ！'], pass: ['ちぇっ、パス！', 'うーん、パス'], rev: ['革命だーっ！'], good: ['よっしゃ！', 'ほいっと！'], top: ['いっちばーん！'], bottom: ['くっそー、次は負けない！'], against: ['うわっ、マジで!?'], mid: ['まあまあかな！'] } },
    { id: 'shion', name: 'シオン', persona: 'shion', color: '#7a64c8', style: '慎重派', desc: '眼鏡の大学生。強い札は最後まで温存し、場の流れを読む。',
      lines: { start: ['よろしくお願いします。冷静にいきますね'], pass: ['……パスです', 'ここは見送ります'], rev: ['革命、です'], good: ['計算どおりです', 'ふふ'], top: ['読みどおりでした'], bottom: ['……想定外でした'], against: ['そう来ましたか'], mid: ['悪くない結果です'] } },
    { id: 'gonzo', name: 'ゴンゾウ', persona: 'gonzo', color: '#3f9a6b', style: '一発逆転派', desc: '喫茶店のマスター。ペアと革命が大好き。',
      lines: { start: ['がっはっは、楽しくやろうや！'], pass: ['パスだ、パス！', '今は様子見だな'], rev: ['革命じゃーい！', 'ひっくり返してやる！'], good: ['がっはっは！', 'どうだ！'], top: ['今夜の大富豪はワシだ！'], bottom: ['ぐぬぬ……コーヒーでも淹れるか'], against: ['なにぃ!?'], mid: ['ま、こんなもんよ'] } },
  ];
  const LEVELS = ['やさしい', 'ふつう', 'つよい'];
  const GAME_CHOICES = [3, 5, 10];
  const RULES = [
    { key: 'revolution', name: '革命', desc: '同じ数字 4 枚（ジョーカー入りも可）を出すと、強さの順番が逆になります（もう一度で元に戻る）。' },
    { key: 'seqRev', name: '階段革命', desc: '5 枚以上の階段でも革命になります。' },
    { key: 'eight', name: '8切り', desc: '8 を含む札を出すと場が流れ、出した人から始めます。' },
    { key: 'jback', name: '11バック', desc: 'J を含む札を出すと、場が流れるまで強さが逆になります。' },
    { key: 'shibari', name: 'しばり', desc: '前の人と同じマーク（組）の札が続くと、場が流れるまでそのマークしか出せません。' },
    { key: 'spade3', name: 'スペ3返し', desc: 'ジョーカー 1 枚出しに、スペードの 3 で勝てます（場が流れます）。' },
    { key: 'miyako', name: '都落ち', desc: '前の試合の大富豪が 1 番に上がれないと、その場で大貧民になります。' },
    { key: 'hansoku', name: '反則上がり', desc: 'ジョーカー・2（革命中は 3）・8・スペ3返しの 3 で上がると、最下位になります。' },
    { key: 'passLock', name: 'パスしたら場が流れるまで出せない', desc: '一度パスすると、その場が流れるまで札を出せません（オフにすると、順番が来ればまた出せます）。' },
    { key: 'seven', name: '7渡し', desc: '7 を出したら、出した枚数だけ好きな札を次の人に渡します。' },
    { key: 'ten', name: '10捨て', desc: '10 を出したら、出した枚数だけ好きな札を捨てます。' },
  ];
  const DEF = { level: 1, games: 5, opt: { revolution: true, seqRev: false, eight: true, jback: true, shibari: true, spade3: true, miyako: true, hansoku: true, passLock: true, seven: false, ten: false } };
  const saved = GK.store.get('settings', {}, 'daifugo') || {};
  const settings = { level: LEVELS[saved.level] ? saved.level : DEF.level, games: GAME_CHOICES.includes(saved.games) ? saved.games : DEF.games, opt: Object.assign({}, DEF.opt, saved.opt || {}) };
  const saveSettings = () => GK.store.set('settings', settings);
  const records = () => GK.store.get('records', {}) || {};
  const POS_COLOR = ['#d4a017', '#5b8bd6', '#7c8a84', '#8a5a4a'];
  const nameOf = (p) => (p === 0 ? 'あなた' : CPUS[p].name);

  const onoff = (k) => (settings.opt[k] ? 'あり' : 'なし');
  const helpHTML = () => `
    <p>4 人で順番に札を出し、手札を早くなくした人から <b>大富豪・富豪・貧民・大貧民</b> になります。何試合か続けて、順位の点（3・2・1・0 点）の合計で最終順位を決めます。</p>
    <h3>出し方</h3>
    <ul><li>強さは <b>3 &lt; 4 &lt; … &lt; K &lt; A &lt; 2 &lt; ジョーカー</b>。ジョーカーは何の札の代わりにもなります。</li>
    <li>出せる組：1 枚・同じ数字の 2〜4 枚・<b>階段</b>（同じマークの 3 枚以上の連番。ジョーカーで穴埋め可）。</li>
    <li>前の人と<b>同じ組で、より強い札</b>を出すか、パスします。ほかの全員がパスすると場が流れ、最後に出した人から新しく始めます（「パスしたら場が流れるまで出せない」がありのときは、一度パスするとその場では出せません）。</li>
    <li>最初の試合は ♦3 を持っている人から（地域によっては ♠3）。2 試合目からは大貧民から始めます。</li></ul>
    <h3>カード交換（2 試合目から）</h3>
    <p>大貧民は大富豪に、いちばん強い札を 2 枚、貧民は富豪に 1 枚を自動で渡します。大富豪・富豪は、いらない札を同じ枚数だけ選んで返します。（4 人なので平民はいません）</p>
    <h3>操作</h3>
    <ul><li>手札をクリック／タップで選び（もう一度で解除）、<b>出す</b>。出せない札は暗くなります。</li>
    <li>キーボード：<kbd>←</kbd><kbd>→</kbd> で札を移動、<kbd>Space</kbd> か <kbd>↑</kbd> で選ぶ、<kbd>Enter</kbd> で出す、<kbd>P</kbd> でパス、<kbd>S</kbd> で並べ替え、<kbd>H</kbd> でヒント。</li></ul>
    <h3>ローカルルール（いまの設定）</h3>
    <table>${RULES.map((r) => `<tr><td><b>${r.name}</b></td><td>${r.desc}</td><td>${onoff(r.key)}</td></tr>`).join('')}</table>
    <p>11バックと革命が重なると、元の順番に戻ります。しばりは、ジョーカーを含まない札が同じマーク同士で続いたときにかかり、ジョーカーはしばりの中でも出せます。</p>`;

  /* ---------------- state ---------------- */
  const G = {
    st: null, trickView: [], deck: [], deckSet: new Set(), dealt: null, sel: [], focus: -1, sortMode: 'str', mode: null, legal: [], usable: new Set(), choose: null,
    active: -1, banner: null, bubbles: {}, faces: { 1: 'normal', 2: 'normal', 3: 'normal' }, faceT: {}, lastAct: {}, discard: [], flash: 0,
    waiter: null, ovWaiter: null, auto: false, speed: 1, snap: false, hover: null,
  };
  let M = null;
  let token = 0;
  const wait = async (ms, tk) => { await GK.wait(ms * G.speed); if (tk !== token) throw ABORT; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function say(p, key, ms = 2000) { if (!p || !CPUS[p]) return; const t = pick(CPUS[p].lines[key] || ['']); if (t) G.bubbles[p] = { text: t, t0: performance.now(), dur: ms }; }
  function face(p, f, ms = 2600) { if (!p) return; G.faces[p] = f; G.faceT[p] = performance.now() + ms; }
  const banner = (text, sub, color, ms = 1400) => { G.banner = { text, sub, color, t0: performance.now(), dur: ms }; };

  /* ---------------- layout ---------------- */
  const canvas = $('#table');
  let L = null;
  const R4 = (x, y, w, h) => ({ x, y, w, h });
  const CR = 1.42;
  function layout(W, H) {
    const L = { W, H, land: W / H >= 1.15 };
    const u = Math.min(W, H);
    L.pad = clamp(u * 0.02, 6, 18);
    L.fs = clamp(u * 0.026, 10.5, 16);
    L.barH = H < 480 ? 50 : 60;
    const handBottom = H - L.barH - L.pad * 0.6;
    if (L.land) {
      const handH = clamp(H * 0.24, 70, 190);
      L.hand = R4(W * 0.2, handBottom - handH, W * 0.6, handH);
      L.hcw = Math.min((handH - 14) / CR, 118);
      const pw = clamp(W * 0.15, 118, 220), ph = clamp(H * 0.19, 74, 160);
      L.seat = [
        R4(L.pad, handBottom - clamp(H * 0.13, 52, 96), W * 0.2 - L.pad * 2, clamp(H * 0.13, 52, 96)),
        R4(L.pad, H * 0.36 - ph / 2, pw, ph),
        R4(W / 2 - pw / 2, L.pad, pw, ph),
        R4(W - L.pad - pw, H * 0.36 - ph / 2, pw, ph),
      ];
      const tTop = L.pad + ph + L.fs * 2.4;
      L.trick = R4(W / 2 - W * 0.26, tTop, W * 0.52, L.hand.y - tTop - L.pad * 0.5);
    } else {
      const top = 54, gap = 6;
      const ph = clamp(H * 0.13, 84, 140), pw = (W - L.pad * 2 - gap * 2) / 3;
      const handH = clamp(H * 0.15, 80, 170);
      L.hand = R4(L.pad, handBottom - handH, W - L.pad * 2, handH);
      L.hcw = Math.min((handH - 16) / CR, (W - L.pad * 2) / 5.2);
      L.seat = [
        R4(L.pad, L.hand.y - L.fs * 2.4, W - L.pad * 2, L.fs * 2),
        R4(L.pad, top, pw, ph), R4(L.pad + pw + gap, top, pw, ph), R4(L.pad + (pw + gap) * 2, top, pw, ph),
      ];
      const tTop = top + ph + L.fs * 2.3;
      L.trick = R4(L.pad, tTop, W - L.pad * 2, L.seat[0].y - tTop - L.pad);
    }
    // the CPU fans sit at the bottom of their panels
    L.fan = [null, 1, 2, 3].map((p) => {
      if (!p) return null;
      const s = L.seat[p], fh = s.h * 0.34;
      return R4(s.x + 6, s.y + s.h - fh - 4, s.w - 12, fh);
    });
    L.disc = { x: L.trick.x + 6, y: L.trick.y + L.trick.h - 6 };
    return L;
  }
  const faceCache = new Map();
  const view = GK.fit(canvas, { onResize: (v) => { L = layout(v.w, v.h); faceCache.clear(); } });

  /* ---------------- card faces (code-drawn, cached) ---------------- */
  const RED = '#c8222f', BLACK = '#1b1e2a';
  const isRed = (s) => s === 'H' || s === 'D';
  function suitShape(g, s, cx, cy, size) {
    const w = size, h = size;
    g.beginPath();
    if (s === 'H') {
      g.moveTo(cx, cy + h * 0.45);
      g.bezierCurveTo(cx - w * 0.75, cy - h * 0.05, cx - w * 0.42, cy - h * 0.62, cx, cy - h * 0.22);
      g.bezierCurveTo(cx + w * 0.42, cy - h * 0.62, cx + w * 0.75, cy - h * 0.05, cx, cy + h * 0.45);
    } else if (s === 'D') {
      g.moveTo(cx, cy - h * 0.5); g.lineTo(cx + w * 0.38, cy); g.lineTo(cx, cy + h * 0.5); g.lineTo(cx - w * 0.38, cy); g.closePath();
    } else if (s === 'S') {
      g.moveTo(cx, cy - h * 0.5);
      g.bezierCurveTo(cx - w * 0.78, cy + h * 0.02, cx - w * 0.4, cy + h * 0.5, cx, cy + h * 0.16);
      g.bezierCurveTo(cx + w * 0.4, cy + h * 0.5, cx + w * 0.78, cy + h * 0.02, cx, cy - h * 0.5);
      g.moveTo(cx, cy + h * 0.05); g.lineTo(cx - w * 0.17, cy + h * 0.5); g.lineTo(cx + w * 0.17, cy + h * 0.5); g.closePath();
    } else {
      const r = w * 0.22;
      g.arc(cx, cy - h * 0.22, r, 0, Math.PI * 2); g.moveTo(cx - w * 0.22 + r, cy + h * 0.06);
      g.arc(cx - w * 0.25, cy + h * 0.06, r, 0, Math.PI * 2); g.moveTo(cx + w * 0.25 + r, cy + h * 0.06);
      g.arc(cx + w * 0.25, cy + h * 0.06, r, 0, Math.PI * 2);
      g.moveTo(cx, cy - h * 0.05); g.lineTo(cx - w * 0.15, cy + h * 0.5); g.lineTo(cx + w * 0.15, cy + h * 0.5); g.closePath();
    }
    g.fill();
  }
  const PIPS = {
    2: [[0.5, 0], [0.5, 1]], 3: [[0.5, 0], [0.5, 0.5], [0.5, 1]], 4: [[0, 0], [1, 0], [0, 1], [1, 1]],
    5: [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]], 6: [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
    7: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0, 1], [1, 1]], 8: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0.5, 0.75], [0, 1], [1, 1]],
    9: [[0, 0], [1, 0], [0, 1 / 3], [1, 1 / 3], [0.5, 0.5], [0, 2 / 3], [1, 2 / 3], [0, 1], [1, 1]],
    10: [[0, 0], [1, 0], [0.5, 1 / 6], [0, 1 / 3], [1, 1 / 3], [0, 2 / 3], [1, 2 / 3], [0.5, 5 / 6], [0, 1], [1, 1]],
  };
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function courtFigure(g, r, s, w, h) {
    // one half of a double-headed court card, drawn in a box (0,0)-(w,h/2) — mirrored for the other half
    const col = isRed(s) ? RED : '#25335e', cx = w / 2;
    const tint = { 11: '#d7efe9', 12: '#f7dfe6', 13: '#f5e8c4' }[r];
    const acc = { 11: '#1f8a7a', 12: '#c2457a', 13: '#c99712' }[r];
    // shoulders
    g.fillStyle = col;
    g.beginPath(); g.moveTo(cx - w * 0.36, h * 0.5); g.quadraticCurveTo(cx - w * 0.34, h * 0.3, cx - w * 0.12, h * 0.27); g.lineTo(cx + w * 0.12, h * 0.27); g.quadraticCurveTo(cx + w * 0.34, h * 0.3, cx + w * 0.36, h * 0.5); g.closePath(); g.fill();
    g.fillStyle = acc; g.beginPath(); g.moveTo(cx - w * 0.12, h * 0.27); g.lineTo(cx, h * 0.38); g.lineTo(cx + w * 0.12, h * 0.27); g.closePath(); g.fill();
    g.fillStyle = tint; suitShape(g, s, cx, h * 0.43, w * 0.12);
    // head
    g.fillStyle = '#f4d5b0'; g.beginPath(); g.arc(cx, h * 0.19, w * 0.105, 0, Math.PI * 2); g.fill();
    g.fillStyle = BLACK; g.beginPath(); g.arc(cx - w * 0.035, h * 0.19, w * 0.012, 0, Math.PI * 2); g.arc(cx + w * 0.035, h * 0.19, w * 0.012, 0, Math.PI * 2); g.fill();
    // headwear
    g.fillStyle = acc;
    if (r === 13) { g.beginPath(); g.moveTo(cx - w * 0.12, h * 0.13); g.lineTo(cx - w * 0.14, h * 0.03); g.lineTo(cx - w * 0.06, h * 0.08); g.lineTo(cx, h * 0.01); g.lineTo(cx + w * 0.06, h * 0.08); g.lineTo(cx + w * 0.14, h * 0.03); g.lineTo(cx + w * 0.12, h * 0.13); g.closePath(); g.fill(); g.fillStyle = '#7a1a1a'; g.fillRect(cx - w * 0.115, h * 0.115, w * 0.23, h * 0.02); }
    else if (r === 12) { g.beginPath(); g.ellipse(cx, h * 0.115, w * 0.12, h * 0.035, 0, Math.PI, 0); g.fill(); [-0.08, 0, 0.08].forEach((dx) => { g.beginPath(); g.arc(cx + w * dx, h * 0.07 - (dx ? 0 : h * 0.015), w * 0.025, 0, Math.PI * 2); g.fill(); }); }
    else { g.beginPath(); g.ellipse(cx, h * 0.12, w * 0.125, h * 0.05, 0, Math.PI, 0); g.fill(); g.strokeStyle = acc; g.lineWidth = Math.max(1, w * 0.02); g.beginPath(); g.moveTo(cx + w * 0.08, h * 0.08); g.quadraticCurveTo(cx + w * 0.26, h * 0.0, cx + w * 0.3, h * 0.08); g.stroke(); }
  }
  function drawFaceTo(g, id, w, h) {
    const c = R.card(id);
    const r = w * 0.08;
    rr(g, 0, 0, w, h, r);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fffdf7'); gr.addColorStop(1, '#f2ebdc'); g.fillStyle = gr; g.fill();
    g.lineWidth = Math.max(1, w * 0.012); g.strokeStyle = '#b9ad96'; g.stroke();
    if (c.joker) {
      const cx = w / 2, cy = h / 2;
      const cols = ['#d9472b', '#f0b429', '#2f9e6b', '#3b6fd1', '#9b4dca'];
      g.save(); g.translate(cx, cy);
      for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.fillStyle = cols[i % 5]; g.beginPath(); g.moveTo(0, -h * 0.05); g.lineTo(w * 0.07, -h * 0.3); g.lineTo(-w * 0.07, -h * 0.3); g.closePath(); g.globalAlpha = 0.85; g.fill(); }
      g.globalAlpha = 1; g.restore();
      // jester hat
      g.fillStyle = '#fffdf7'; g.beginPath(); g.arc(cx, cy, w * 0.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#9b4dca'; g.beginPath(); g.moveTo(cx - w * 0.16, cy + h * 0.04); g.quadraticCurveTo(cx - w * 0.22, cy - h * 0.12, cx - w * 0.17, cy - h * 0.06); g.lineTo(cx, cy - h * 0.02); g.closePath(); g.fill();
      g.fillStyle = '#d9472b'; g.beginPath(); g.moveTo(cx - w * 0.06, cy + h * 0.04); g.quadraticCurveTo(cx, cy - h * 0.16, cx + w * 0.03, cy - h * 0.12); g.lineTo(cx + w * 0.06, cy + h * 0.04); g.closePath(); g.fill();
      g.fillStyle = '#2f9e6b'; g.beginPath(); g.moveTo(cx + w * 0.16, cy + h * 0.04); g.quadraticCurveTo(cx + w * 0.22, cy - h * 0.12, cx + w * 0.17, cy - h * 0.06); g.lineTo(cx, cy - h * 0.02); g.closePath(); g.fill();
      g.fillStyle = '#f0b429'; [[-0.17, -0.07], [0.03, -0.13], [0.17, -0.07]].forEach(([dx, dy]) => { g.beginPath(); g.arc(cx + w * dx, cy + h * dy, w * 0.03, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#3b2a5a'; g.fillRect(cx - w * 0.16, cy + h * 0.035, w * 0.32, h * 0.03);
      g.font = font(w * 0.13, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
      'JOKER'.split('').forEach((ch, i) => { g.fillStyle = cols[i]; g.fillText(ch, w * 0.11, h * 0.12 + i * w * 0.14); });
      g.save(); g.translate(w, h); g.rotate(Math.PI); 'JOKER'.split('').forEach((ch, i) => { g.fillStyle = cols[i]; g.fillText(ch, w * 0.11, h * 0.12 + i * w * 0.14); }); g.restore();
      return;
    }
    const col = isRed(c.s) ? RED : BLACK;
    const lab = R.RANK_LABEL[c.r];
    const idx = (flip) => {
      g.save(); if (flip) { g.translate(w, h); g.rotate(Math.PI); }
      g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
      const fs = w * (lab.length > 1 ? 0.2 : 0.24);
      g.font = font(fs, 800);
      g.save(); if (lab.length > 1) { g.translate(w * 0.135, h * 0.095); g.scale(0.82, 1); g.fillText(lab, 0, 0); } else g.fillText(lab, w * 0.135, h * 0.095); g.restore();
      suitShape(g, c.s, w * 0.135, h * 0.2, w * 0.15);
      g.restore();
    };
    idx(false); idx(true);
    g.fillStyle = col;
    if (c.r >= 11 && c.r <= 13) {
      const fx = w * 0.24, fy = h * 0.13, fw = w * 0.52, fh = h * 0.74;
      const tint = { 11: '#e3f3ef', 12: '#fbe9ee', 13: '#faf0d4' }[c.r];
      rr(g, fx, fy, fw, fh, w * 0.04); g.fillStyle = tint; g.fill(); g.lineWidth = Math.max(1, w * 0.012); g.strokeStyle = col; g.stroke();
      g.save(); rr(g, fx, fy, fw, fh, w * 0.04); g.clip();
      g.save(); g.translate(fx, fy); courtFigure(g, c.r, c.s, fw, fh); g.restore();
      g.save(); g.translate(fx + fw, fy + fh); g.rotate(Math.PI); courtFigure(g, c.r, c.s, fw, fh); g.restore();
      g.strokeStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.moveTo(fx, fy + fh / 2); g.lineTo(fx + fw, fy + fh / 2); g.stroke();
      g.restore();
      return;
    }
    if (c.r === 14) {
      g.fillStyle = col; suitShape(g, c.s, w / 2, h / 2, w * (c.s === 'S' ? 0.46 : 0.36));
      if (c.s === 'S') { g.strokeStyle = '#c99712'; g.lineWidth = Math.max(1, w * 0.015); g.beginPath(); g.arc(w / 2, h / 2, w * 0.33, 0, Math.PI * 2); g.stroke(); }
      return;
    }
    const n = c.r === 15 ? 2 : c.r;
    const bx = w * 0.3, by = h * 0.17, bw = w * 0.4, bh = h * 0.66, ps = w * (n >= 9 ? 0.15 : 0.17);
    for (const [px, py] of PIPS[n]) {
      const x = bx + px * bw, y = by + py * bh;
      g.save(); g.translate(x, y); if (py > 0.5) g.rotate(Math.PI);
      g.fillStyle = col; suitShape(g, c.s, 0, 0, ps); g.restore();
    }
  }
  function faceImage(id, w) {
    const dpr = view ? view.dpr : 1;
    const key = id + '@' + Math.round(w * dpr / 3) * 3;
    let c = faceCache.get(key);
    if (!c) {
      const pw = Math.max(8, Math.round(w * dpr)), ph = Math.round(pw * CR);
      c = document.createElement('canvas'); c.width = pw; c.height = ph;
      drawFaceTo(c.getContext('2d'), id, pw, ph);
      if (faceCache.size > 400) faceCache.clear();
      faceCache.set(key, c);
    }
    return c;
  }
  function drawBack(g, x, y, w, h) {
    const r = w * 0.08;
    rr(g, x, y, w, h, r);
    const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#24407a'); gr.addColorStop(1, '#14244a'); g.fillStyle = gr; g.fill();
    g.lineWidth = 1; g.strokeStyle = '#0b1530'; g.stroke();
    if (w < 14) return;
    const i = w * 0.1;
    rr(g, x + i, y + i, w - 2 * i, h - 2 * i, r * 0.6); g.strokeStyle = 'rgba(240,195,90,.6)'; g.lineWidth = Math.max(0.8, w * 0.02); g.stroke();
    g.save(); rr(g, x + i, y + i, w - 2 * i, h - 2 * i, r * 0.6); g.clip();
    g.strokeStyle = 'rgba(240,195,90,.16)'; g.lineWidth = 1; g.beginPath();
    const step = Math.max(5, w * 0.16);
    for (let k = -h; k < w + h; k += step) { g.moveTo(x + k, y); g.lineTo(x + k + h, y + h); g.moveTo(x + k + h, y); g.lineTo(x + k, y + h); }
    g.stroke(); g.restore();
    g.fillStyle = 'rgba(240,195,90,.85)'; g.beginPath(); g.moveTo(x + w / 2, y + h / 2 - w * 0.16); g.lineTo(x + w / 2 + w * 0.12, y + h / 2); g.lineTo(x + w / 2, y + h / 2 + w * 0.16); g.lineTo(x + w / 2 - w * 0.12, y + h / 2); g.closePath(); g.fill();
  }

  /* ---------------- sprites & targets ---------------- */
  const ALL = R.makeDeck(2);
  const SP = {};
  ALL.forEach((id) => { SP[id] = { x: -300, y: -300, w: 40, f: 0, rot: 0, z: 0, dim: 0 }; });
  const strSort = (rev) => (a, b) => R.val(R.card(a).r, rev) - R.val(R.card(b).r, rev) || R.SUITS.indexOf(R.card(a).s) - R.SUITS.indexOf(R.card(b).s);
  const suitSort = (a, b) => (R.card(a).joker - R.card(b).joker) || R.SUITS.indexOf(R.card(a).s) - R.SUITS.indexOf(R.card(b).s) || R.card(a).r - R.card(b).r;
  function myHand() {
    if (!G.st) return [];
    const h = G.st.hands[0].slice();
    return G.sortMode === 'suit' ? h.sort(suitSort) : h.sort(strSort(G.st.rev));
  }
  function handPos(i, n) {
    const r = L.hand, w = L.hcw, h = w * CR;
    const step = n > 1 ? Math.min(w * 0.72, (r.w - w) / (n - 1)) : 0;
    const tw = w + step * (n - 1);
    return { x: r.x + (r.w - tw) / 2 + i * step, y: r.y + r.h - h - 4, w };
  }
  function fanPos(p, i, n) {
    const r = L.fan[p], h = r.h, w = h / CR;
    const step = n > 1 ? Math.min(w * 0.5, (r.w - w) / (n - 1)) : 0;
    const tw = w + step * (n - 1);
    return { x: r.x + (r.w - tw) / 2 + i * step, y: r.y, w };
  }
  function trickLayout() {
    const T = {};
    if (!G.st) return T;
    const tr = G.trickView, r = L.trick, start = Math.max(0, tr.length - 4);
    for (let k = start; k < tr.length; k++) {
      const { play } = tr[k], depth = tr.length - 1 - k, n = play.cards.length;
      const base = Math.min((r.h * 0.66) / CR, r.w / (n + 1.6), L.hcw * 1.12);
      const w = base * (1 - depth * 0.12), step = w * 0.62, tw = w + step * (n - 1);
      const cx = r.x + r.w / 2 + depth * w * 0.32 - (depth ? w * 0.2 : 0), cy = r.y + r.h * 0.47 - depth * w * 0.18;
      play.cards.forEach((id, i) => { T[id] = { x: cx - tw / 2 + i * step, y: cy - (w * CR) / 2, w, face: 1, z: 600 + k * 10 + i, rot: (i - (n - 1) / 2) * 0.03 + depth * 0.05, dim: depth ? 0.25 + depth * 0.1 : 0 }; });
    }
    for (let k = 0; k < start; k++) tr[k].play.cards.forEach((id, i) => { T[id] = { x: r.x + r.w / 2 - 20 + i * 3, y: r.y + r.h * 0.4, w: L.hcw * 0.6, face: 1, z: 590, dim: 0.7 }; });
    return T;
  }
  function targets() {
    const T = {};
    const st = G.st;
    const cx = L.W / 2, cy = L.trick.y + L.trick.h / 2;
    const dw = Math.min(L.hcw * 0.55, 46);
    ALL.forEach((id) => { T[id] = { x: cx - dw / 2, y: cy - dw * CR / 2, w: dw, face: 0, z: 1, hide: !st || !G.deckSet.has(id) }; });
    if (!st) return T;
    G.discard.forEach((id, i) => { T[id] = { x: L.disc.x + Math.min(i, 30) * 0.4, y: L.disc.y - dw * 0.8 * CR - Math.min(i, 30) * 0.3, w: dw * 0.8, face: 0, z: 10 + i, rot: ((i * 37) % 11 - 5) * 0.02 }; });
    const hand = myHand();
    hand.forEach((id, i) => {
      const p = handPos(i, hand.length);
      const sel = G.sel.includes(id);
      if (sel) p.y -= p.w * CR * 0.18;
      else if (G.focus === i || G.hover === id) p.y -= p.w * CR * 0.05;
      const dim = (G.mode === 'play' && !G.usable.has(id)) ? 1 : 0;
      T[id] = Object.assign(p, { face: 1, z: 400 + i, dim, sel });
    });
    for (const p of [1, 2, 3]) st.hands[p].forEach((id, i) => { T[id] = Object.assign(fanPos(p, i, st.hands[p].length), { face: 0, z: 300 + p * 20 + i }); });
    Object.assign(T, trickLayout());
    if (G.dealt) for (const p of [0, 1, 2, 3]) st.hands[p].forEach((id) => { if (!G.dealt.has(id)) T[id] = { x: cx - dw / 2, y: cy - dw * CR / 2, w: dw, face: 0, z: 50 }; });
    return T;
  }

  /* ---------------- drawing ---------------- */
  function text(g, s, x, y, o = {}) {
    g.font = font(o.size || L.fs, o.weight || 700);
    g.fillStyle = o.color || '#fbf4e4'; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'middle';
    if (o.max) { let sz = o.size || L.fs; while (sz > 7 && g.measureText(s).width > o.max) { sz -= 0.5; g.font = font(sz, o.weight || 700); } }
    g.fillText(s, x, y);
  }
  function pill(g, s, x, y, h, bg, fg = '#fff', align = 'left') {
    g.font = font(h * 0.6, 800); const w = g.measureText(s).width + h * 0.9;
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    rr(g, x0, y, w, h, h / 2); g.fillStyle = bg; g.fill();
    text(g, s, x0 + w / 2, y + h / 2 + 0.5, { size: h * 0.6, weight: 800, align: 'center', color: fg });
    return w;
  }
  function drawCover(g, img, x, y, w, h) { const s = Math.max(w / img.width, h / img.height); g.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s); }
  function rankOf(p) { return M && M.prevPos ? M.prevPos[p] : -1; }
  function drawSeat(g, p, now) {
    const r = L.seat[p], st = G.st, active = G.active === p && st && !st.over;
    const fs = L.fs;
    if (p === 0) {
      const y = r.y;
      rr(g, r.x, y, r.w, r.h, 10); g.fillStyle = active ? 'rgba(8,20,16,.7)' : 'rgba(8,20,16,.45)'; g.fill();
      if (active) { g.save(); g.shadowColor = '#f0c35a'; g.shadowBlur = 12; g.lineWidth = 2; g.strokeStyle = `rgba(240,195,90,${0.6 + 0.3 * Math.sin(now / 250)})`; rr(g, r.x, y, r.w, r.h, 10); g.stroke(); g.restore(); }
      let x = r.x + 10;
      const rk = rankOf(0), cyy = y + r.h / 2;
      if (L.land) {
        text(g, 'あなた', x, y + r.h * 0.3, { size: fs * 1.15, weight: 800 });
        if (rk >= 0) pill(g, R.POS_NAME[rk], x + fs * 4.2, y + r.h * 0.3 - fs * 0.6, fs * 1.2, POS_COLOR[rk]);
        text(g, `合計 ${M.points[0]} 点 ・ 残り ${st ? st.hands[0].length : 0} 枚`, x, y + r.h * 0.72, { size: fs * 0.85, color: 'rgba(251,244,228,.8)', max: r.w - 20 });
        if (G.lastAct[0]) pill(g, G.lastAct[0], r.x + r.w / 2, y - fs * 1.8, fs * 1.4, 'rgba(8,20,16,.8)', '#ffd98a', 'center');
      } else {
        text(g, 'あなた', x, cyy, { size: fs * 1.05, weight: 800 });
        x += fs * 3.6;
        if (rk >= 0) x += pill(g, R.POS_NAME[rk], x, cyy - fs * 0.6, fs * 1.2, POS_COLOR[rk]) + 6;
        text(g, `${M.points[0]}点`, x, cyy, { size: fs * 0.9, color: 'rgba(251,244,228,.85)' });
        if (G.lastAct[0]) text(g, G.lastAct[0], r.x + r.w - 10, cyy, { size: fs * 0.85, align: 'right', color: '#ffd98a' });
      }
      return;
    }
    const cpu = CPUS[p];
    rr(g, r.x, r.y, r.w, r.h, 12); g.fillStyle = active ? 'rgba(8,20,16,.72)' : 'rgba(8,20,16,.48)'; g.fill();
    if (active) { g.save(); g.shadowColor = '#f0c35a'; g.shadowBlur = 14; g.lineWidth = 2.5; g.strokeStyle = `rgba(240,195,90,${0.6 + 0.35 * Math.sin(now / 250)})`; rr(g, r.x, r.y, r.w, r.h, 12); g.stroke(); g.restore(); }
    const out = st && st.pos[p] >= 0;
    const s = Math.min(r.h * 0.58, r.w * 0.4), ix = r.x + 6, iy = r.y + 6;
    if (G.faceT[p] && now > G.faceT[p]) { G.faces[p] = 'normal'; G.faceT[p] = 0; }
    const im = GK.images[`cpu-${cpu.id}-${G.faces[p]}`] || GK.images[`cpu-${cpu.id}-normal`];
    g.save(); g.beginPath(); g.arc(ix + s / 2, iy + s / 2, s / 2, 0, Math.PI * 2); g.clip(); if (im) drawCover(g, im, ix, iy, s, s); g.restore();
    g.lineWidth = 2; g.strokeStyle = cpu.color; g.beginPath(); g.arc(ix + s / 2, iy + s / 2, s / 2, 0, Math.PI * 2); g.stroke();
    const tx = ix + s + 6, tw = r.x + r.w - 6 - tx;
    text(g, cpu.name, tx, iy + fs * 0.7, { size: fs * 1.05, weight: 800, max: tw - fs * 2.6 });
    const rk = st && st.pos[p] >= 0 ? st.pos[p] : rankOf(p);
    if (rk >= 0) pill(g, R.POS_NAME[rk], tx, iy + fs * 1.35, fs * 1.1, POS_COLOR[rk]);
    else text(g, cpu.style, tx, iy + fs * 1.9, { size: fs * 0.75, color: 'rgba(251,244,228,.65)', max: tw });
    const cnt = st ? st.hands[p].length : 0;
    text(g, out ? 'あがり' : `${cnt}枚`, r.x + r.w - 8, iy + fs * 0.7, { size: fs * 0.9, weight: 800, align: 'right', color: out ? '#ffd98a' : '#fff' });
    if (G.lastAct[p]) {
      const la = G.lastAct[p];
      g.font = font(fs * 0.85, 800); const lw = Math.min(r.w, g.measureText(la).width + fs * 1.2);
      const ly = r.y + r.h + 4;
      rr(g, r.x + r.w / 2 - lw / 2, ly, lw, fs * 1.6, fs * 0.8); g.fillStyle = 'rgba(8,20,16,.75)'; g.fill();
      text(g, la, r.x + r.w / 2, ly + fs * 0.8 + 0.5, { size: fs * 0.85, weight: 800, align: 'center', color: la === 'パス' ? 'rgba(251,244,228,.7)' : '#ffd98a', max: lw - 8 });
    }
    // speech bubble
    const b = G.bubbles[p];
    if (b) {
      const t = (now - b.t0) / b.dur;
      if (t >= 1) delete G.bubbles[p];
      else {
        const a = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1, bs = fs * 0.9;
        g.font = font(bs, 700); const bw = Math.min(g.measureText(b.text).width + bs * 1.4, L.land ? 260 : L.W * 0.6), bh = bs * 2;
        let bx = r.x + r.w / 2 - bw / 2, by = r.y + r.h + fs * 2.1;
        if (L.land && p === 1) { bx = r.x + r.w + 8; by = r.y + 4; }
        if (L.land && p === 3) { bx = r.x - bw - 8; by = r.y + 4; }
        if (L.land && p === 2) { bx = r.x + r.w + 8; by = r.y + r.h * 0.3; }
        bx = clamp(bx, 4, L.W - bw - 4);
        g.globalAlpha = a; rr(g, bx, by, bw, bh, bh / 2); g.fillStyle = '#fffaf0'; g.fill();
        text(g, b.text, bx + bw / 2, by + bh / 2 + 0.5, { size: bs, align: 'center', color: '#23302a', max: bw - bs });
        g.globalAlpha = 1;
      }
    }
  }
  function draw(now) {
    const g = view.ctx, W = L.W, H = L.H, st = G.st;
    view.clear();
    const rev = st && R.isRev(st);
    const base = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.1, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    base.addColorStop(0, rev ? '#4a2f6e' : '#1f6a52'); base.addColorStop(1, rev ? '#1a0f2c' : '#0a2a20');
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    const bg = GK.images['bg-table'];
    if (bg) { g.globalAlpha = rev ? 0.18 : 0.32; drawCover(g, bg, 0, 0, W, H); g.globalAlpha = 1; }
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (!M) return;
    // trick zone
    const tr = L.trick;
    rr(g, tr.x + tr.w * 0.08, tr.y, tr.w * 0.84, tr.h, 24); g.fillStyle = 'rgba(0,0,0,.12)'; g.fill();
    g.setLineDash([6, 6]); g.strokeStyle = 'rgba(240,195,90,.18)'; g.lineWidth = 1.5; g.stroke(); g.setLineDash([]);
    // status chips
    if (st) {
      const chips = [];
      if (st.rev) chips.push(['革命中', '#8e44ad']);
      if (st.jback) chips.push(['11バック', '#16a085']);
      if (st.lock) chips.push([`しばり ${st.lock.map((s) => R.SUIT_MARK[s]).join('')}`, '#c0392b']);
      if (st.top && st.trick.length) { const last = st.trick[st.trick.length - 1]; chips.push([`${nameOf(last.p)}：${R.playName(st.top)}`, 'rgba(8,20,16,.75)']); }
      let x = tr.x + tr.w / 2, total = 0;
      const ch = L.fs * 1.4;
      g.font = font(ch * 0.6, 800);
      const widths = chips.map(([s]) => g.measureText(s).width + ch * 0.9);
      total = widths.reduce((a, b) => a + b + 6, -6);
      x -= total / 2;
      chips.forEach(([s, c], i) => { pill(g, s, x, tr.y + 6, ch, c); x += widths[i] + 6; });
      if (G.discard.length) text(g, `流れた札 ${G.discard.length}`, L.disc.x, L.disc.y + L.fs * 0.2, { size: L.fs * 0.72, color: 'rgba(251,244,228,.55)', base: 'top' });
      if (G.hint) {
        const hy = tr.y + tr.h - L.fs * 1.1;
        g.font = font(L.fs * 0.9, 700); const hw = g.measureText(G.hint).width + L.fs * 2;
        rr(g, tr.x + tr.w / 2 - hw / 2, hy - L.fs * 0.85, hw, L.fs * 1.7, L.fs * 0.85); g.fillStyle = 'rgba(8,20,16,.7)'; g.fill();
        text(g, G.hint, tr.x + tr.w / 2, hy + 0.5, { size: L.fs * 0.9, align: 'center', color: '#fff3d6' });
      }
    }
    for (const p of [1, 2, 3]) drawSeat(g, p, now);
    drawSeat(g, 0, now);
    // cards
    const order = ALL.slice().sort((a, b) => SP[a].z - SP[b].z);
    for (const id of order) {
      const s = SP[id];
      if (s.hide || s.x < -200) continue;
      const w = s.w, h = w * CR, sx = Math.abs(Math.cos(s.f * Math.PI));
      g.save(); g.translate(s.x + w / 2, s.y + h / 2); if (s.rot) g.rotate(s.rot); g.scale(Math.max(0.02, sx), 1);
      rr(g, -w / 2 + w * 0.03, -h / 2 + w * 0.05, w, h, w * 0.08); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill();
      if (s.f > 0.5) g.drawImage(faceImage(id, w), -w / 2, -h / 2, w, h); else drawBack(g, -w / 2, -h / 2, w, h);
      if (s.dim > 0.01) { rr(g, -w / 2, -h / 2, w, h, w * 0.08); g.fillStyle = `rgba(10,20,16,${0.5 * Math.min(1, s.dim)})`; g.fill(); }
      if (s.sel) { g.save(); g.shadowColor = '#ffd76a'; g.shadowBlur = 14; g.lineWidth = 3; g.strokeStyle = '#ffd76a'; rr(g, -w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + 3, w * 0.09); g.stroke(); g.restore(); }
      g.restore();
    }
    // flash (革命)
    if (G.flash) { const t = (now - G.flash) / 600; if (t >= 1) G.flash = 0; else { g.fillStyle = `rgba(255,255,255,${0.55 * (1 - t)})`; g.fillRect(0, 0, W, H); } }
    // banner
    if (G.banner) {
      const b = G.banner, t = (now - b.t0) / b.dur;
      if (t >= 1) G.banner = null;
      else {
        const a = t < 0.12 ? t / 0.12 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const cy = tr.y + tr.h * 0.45, bh = L.fs * (b.sub ? 5 : 3.8);
        g.globalAlpha = a;
        const gr = g.createLinearGradient(0, 0, W, 0);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.2, 'rgba(6,14,12,.85)'); gr.addColorStop(0.8, 'rgba(6,14,12,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, cy - bh / 2, W, bh);
        g.fillStyle = b.color || '#f0c35a'; g.fillRect(W * 0.15, cy - bh / 2, W * 0.7, 2); g.fillRect(W * 0.15, cy + bh / 2 - 2, W * 0.7, 2);
        const sc = 1 + 0.25 * Math.max(0, 1 - t * 6);
        g.save(); g.translate(W / 2, cy - (b.sub ? L.fs * 0.6 : 0)); g.scale(sc, sc);
        text(g, b.text, 0, 0, { size: L.fs * 2.3, weight: 900, align: 'center', color: b.color || '#ffe08a' });
        g.restore();
        if (b.sub) text(g, b.sub, W / 2, cy + L.fs * 1.5, { size: L.fs * 0.95, align: 'center', color: 'rgba(251,244,228,.88)' });
        g.globalAlpha = 1;
      }
    }
  }
  let placed = false;
  GK.loop((dt) => {
    if (!L) return;
    const T = targets();
    const k = G.snap ? 1 : 1 - Math.exp(-dt * 12);
    for (const id of ALL) {
      const s = SP[id], t = T[id];
      s.hide = !!t.hide;
      if (!placed || t.hide) { s.x = t.x; s.y = t.y; s.w = t.w; s.f = t.face; }
      s.x += (t.x - s.x) * k; s.y += (t.y - s.y) * k; s.w += (t.w - s.w) * k; s.rot += ((t.rot || 0) - s.rot) * k;
      s.dim += ((t.dim || 0) - s.dim) * k;
      s.sel = !!t.sel;
      const df = t.face - s.f, step = G.snap ? 1 : dt * 3.4;
      s.f = Math.abs(df) <= step ? t.face : s.f + Math.sign(df) * step;
      s.z = t.z + (Math.abs(t.x - s.x) + Math.abs(t.y - s.y) > 3 ? 1000 : 0);
    }
    placed = true;
    draw(performance.now());
  });

  /* ---------------- input ---------------- */
  const overlayOpen = () => !$('#resOv').hidden || !$('#finOv').hidden || !!document.querySelector('.gk-modal-back');
  function hitHand(p) {
    const hand = myHand();
    for (let i = hand.length - 1; i >= 0; i--) {
      const s = SP[hand[i]], h = s.w * CR;
      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + h + h * 0.2) return { id: hand[i], i };
    }
    return null;
  }
  function selectionPlay() {
    if (!G.st || !G.sel.length) return null;
    const ps = R.interpret(G.sel).filter((pl) => R.beats(G.st, pl));
    if (!ps.length) return null;
    const rev = R.isRev(G.st);
    return ps.sort((a, b) => R.val(b.rank, rev) - R.val(a.rank, rev))[0];
  }
  function toggle(id) {
    if (G.mode === 'play' && !G.usable.has(id)) { GK.sfx('ng'); GK.toast('この札は今は出せません'); return; }
    if (G.mode === 'choose' && !G.sel.includes(id) && G.sel.length >= G.choose.n) G.sel.shift();
    const i = G.sel.indexOf(id);
    if (i >= 0) G.sel.splice(i, 1); else G.sel.push(id);
    GK.sfx('tick');
    updateBar();
  }
  let downHit = null;
  GK.pointer(canvas, view, {
    down(p) { downHit = overlayOpen() || !G.mode ? null : hitHand(p); },
    move(p, e) {
      if (e.pointerType !== 'mouse') return;
      const h = G.mode && !overlayOpen() ? hitHand(p) : null;
      G.hover = h ? h.id : null;
      canvas.style.cursor = h ? 'pointer' : 'default';
    },
    up(p) {
      if (!downHit || overlayOpen() || !G.mode) return;
      const h = hitHand(p);
      if (h && h.id === downHit.id) { G.focus = h.i; toggle(h.id); }
      downHit = null;
    },
  });
  addEventListener('keydown', (e) => {
    if (overlayOpen() || !G.mode || !G.st) return;
    const hand = myHand(), k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); G.focus = clamp((G.focus < 0 ? 0 : G.focus + (k === 'ArrowLeft' ? -1 : 1)), 0, hand.length - 1); GK.sfx('tick'); }
    else if ((k === ' ' || k === 'ArrowUp') && hand[G.focus]) { e.preventDefault(); toggle(hand[G.focus]); }
    else if (k === 'ArrowDown' && hand[G.focus] && G.sel.includes(hand[G.focus])) { e.preventDefault(); toggle(hand[G.focus]); }
    else if (k === 'Enter') { e.preventDefault(); $('#bPlay').click(); }
    else if (k === 'p' || k === 'P') $('#bPass').click();
    else if (k === 's' || k === 'S') $('#bSort').click();
    else if (k === 'h' || k === 'H') $('#bHint').click();
    else if (k === 'Escape') { G.sel = []; updateBar(); }
  });
  function updateBar() {
    const bar = $('#bar'), info = $('#barInfo'), bp = $('#bPlay'), bs = $('#bPass');
    if (!G.mode) { bp.disabled = true; bs.disabled = true; $('#bHint').disabled = true; info.innerHTML = G.active > 0 && M ? `${nameOf(G.active)}の番です` : ''; return; }
    $('#bHint').disabled = G.mode !== 'play';
    if (G.mode === 'choose') {
      const c = G.choose;
      bp.textContent = c.verb; bp.disabled = G.sel.length !== c.n; bs.disabled = true; bs.style.visibility = 'hidden';
      info.innerHTML = `${c.text}（<b>${G.sel.length} / ${c.n}</b> 枚）`;
      return;
    }
    bs.style.visibility = '';
    bp.textContent = '出す';
    const pl = selectionPlay();
    bp.disabled = !pl;
    bs.disabled = !G.st.top;
    if (pl) info.innerHTML = `<b>${G.sel.map(R.label).join(' ')}</b>（${R.playName(pl)}）`;
    else if (G.sel.length) info.textContent = 'その組み合わせは出せません';
    else if (!G.legal.length) info.textContent = '出せる札がありません。パスしてください';
    else info.textContent = G.st.top ? `${R.playName(G.st.top)}より強い札を選ぶか、パス` : 'あなたが親です。好きな札を出してください';
  }

  /* ---------------- sound & music ---------------- */
  GK.sfx.define('deal', () => GK.noise({ d: 0.05, v: 0.2, f: 3800, filter: 'highpass' }));
  GK.sfx.define('slap', () => { GK.noise({ d: 0.06, v: 0.45, f: 2600, q: 1.2 }); GK.tone({ f: 190, f2: 90, d: 0.08, type: 'sine', v: 0.3 }); });
  GK.sfx.define('passv', () => GK.tone({ f: 420, f2: 320, d: 0.12, type: 'triangle', v: 0.12 }));
  GK.sfx.define('clear', () => { GK.noise({ d: 0.25, v: 0.25, f: 1500, q: 0.6 }); GK.tone({ f: 330, f2: 660, d: 0.18, type: 'sine', v: 0.12 }); });
  GK.sfx.define('rev', () => { GK.tone({ f: 80, f2: 40, d: 0.8, type: 'sawtooth', v: 0.25 }); GK.noise({ d: 0.7, v: 0.4, f: 400, filter: 'lowpass' }); [0, 4, 7, 12, 16].forEach((s, i) => GK.tone({ f: 220 * Math.pow(2, s / 12), d: 0.4, type: 'square', v: 0.07, at: 0.15 + i * 0.06 })); });
  GK.sfx.define('eight', () => { GK.noise({ d: 0.18, v: 0.4, f: 5000, filter: 'highpass' }); GK.tone({ f: 1800, f2: 300, d: 0.2, type: 'sawtooth', v: 0.08 }); });
  GK.sfx.define('lock', () => { GK.tone({ f: 600, d: 0.08, type: 'square', v: 0.1 }); GK.tone({ f: 450, d: 0.15, type: 'square', v: 0.1, at: 0.08 }); });
  const SONG_TITLE = {
    bpm: 96, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.11, notes: 'E5 - D5 C5 A4 - G4 - | C5 - - - . . G4 A4 | C5 - D5 E5 G5 - E5 - | D5 - - - . . . . | E5 - D5 C5 A4 - G4 A4 | C5 - A4 G4 E4 - D4 - | E4 G4 A4 C5 D5 - E5 D5 | C5 - - - . . . .' },
      { type: 'sine', v: 0.11, notes: 'C3 . G3 . A2 . E3 . | F2 . C3 . G2 . D3 . | C3 . G3 . A2 . E3 . | F2 . C3 . G2 - - - | C3 . G3 . A2 . E3 . | F2 . C3 . G2 . D3 . | F2 . C3 . G2 . D3 . | C3 . G3 . C3 - - -' },
    ],
    drums: { k: 'x . . . x . . . ', h: '. . x . . . x . ' },
  };
  const SONG_GAME = {
    bpm: 118, steps: 2,
    tracks: [
      { type: 'square', v: 0.045, notes: 'G4 . A4 C5 . A4 G4 . | E4 . G4 A4 - - . . | C5 . D5 E5 . D5 C5 . | A4 . G4 E4 - - . . | G4 . A4 C5 . D5 E5 . | G5 . E5 D5 - C5 . . | A4 . C5 D5 . C5 A4 . | G4 - - - . . . .' },
      { type: 'triangle', v: 0.12, notes: 'C3 . C4 . A2 . A3 . | F2 . F3 . G2 . G3 . | C3 . C4 . A2 . A3 . | D3 . D4 . G2 . G3 . | C3 . C4 . E3 . E4 . | F2 . F3 . G2 . G3 . | A2 . A3 . F2 . F3 . | G2 . G3 . C3 . . .' },
    ],
    drums: { k: 'x . . . x . . . ', s: '. . x . . . x . ', h: 'x x x x x x x x ' },
  };
  let songNow = null;
  const music = (s) => { if (songNow === s && GK.music.playing) return; songNow = s; GK.music.play(s); };
  const firstGesture = () => { removeEventListener('pointerdown', firstGesture, true); removeEventListener('keydown', firstGesture, true); if (!GK.music.playing) music($('#title').classList.contains('off') ? SONG_GAME : SONG_TITLE); };
  addEventListener('pointerdown', firstGesture, true);
  addEventListener('keydown', firstGesture, true);

  /* ---------------- flow ---------------- */
  function rejectWaiters() {
    if (G.waiter) { const w = G.waiter; G.waiter = null; w.rej(ABORT); }
    if (G.ovWaiter) { const w = G.ovWaiter; G.ovWaiter = null; w.rej(ABORT); }
    G.mode = null; G.sel = []; G.choose = null;
  }
  function humanTurn(tk) {
    const st = G.st;
    G.legal = R.legalPlays(st, 0);
    G.usable = new Set(G.legal.flatMap((p) => p.cards));
    G.mode = 'play'; G.sel = []; G.focus = -1;
    G.hint = G.legal.length ? '' : '出せる札がありません';
    updateBar();
    return new Promise((res, rej) => { G.waiter = { res, rej, tk }; });
  }
  function humanChoose(n, verb, textMsg, tk) {
    G.mode = 'choose'; G.sel = []; G.focus = -1; G.choose = { n, verb, text: textMsg };
    G.hint = textMsg;
    updateBar();
    return new Promise((res, rej) => { G.waiter = { res, rej, tk }; });
  }
  function resolveHuman(v) { const w = G.waiter; if (!w) return; G.waiter = null; G.mode = null; G.sel = []; G.choose = null; G.hint = ''; G.hover = null; updateBar(); w.res(v); }
  $('#bPlay').onclick = async () => {
    if (!G.waiter) return;
    if (G.mode === 'choose') { if (G.sel.length === G.choose.n) { GK.sfx('select'); resolveHuman(G.sel.slice()); } return; }
    const pl = selectionPlay();
    if (!pl) return;
    if (pl.n === G.st.hands[0].length && R.forbiddenFinish(G.st, pl)) {
      const ok = await GK.modal({ title: '反則上がりになります', body: '<p>この札で上がると「反則上がり」で最下位（大貧民）になります。それでも出しますか？</p>', buttons: [{ label: 'やめる', value: false }, { label: '出す', value: true, primary: true }] });
      if (!ok || !G.waiter) return;
    }
    resolveHuman(pl);
  };
  $('#bPass').onclick = () => { if (G.waiter && G.mode === 'play' && G.st.top) resolveHuman(null); };
  $('#bSort').onclick = () => { G.sortMode = G.sortMode === 'str' ? 'suit' : 'str'; GK.sfx('click'); GK.toast(G.sortMode === 'str' ? '強さの順に並べました' : 'マークごとに並べました', 1200); };
  $('#bHint').onclick = () => {
    if (G.mode !== 'play' || !G.waiter) return;
    const pl = R.aiPlay(G.st, 0, 'plain', 1, Math.random);
    if (!pl) { G.sel = []; GK.toast('ここはパスがおすすめです'); }
    else { G.sel = pl.cards.slice(); GK.sfx('select'); }
    updateBar();
  };

  async function showEvents(evs, tk) {
    const st = G.st;
    for (const e of evs) {
      if (e.type === 'revolution') {
        G.flash = performance.now(); GK.sfx('rev');
        banner(e.on ? '革命！' : '革命返し！', e.on ? '強さの順番が逆になりました' : '強さの順番が元に戻りました', '#d69bff', 1700);
        const by = st.last;
        [1, 2, 3].forEach((p) => { if (p === by) { face(p, 'happy'); say(p, 'rev'); } else if (st.pos[p] < 0) face(p, 'angry'); });
        if (by !== 1 && by !== 2 && by !== 3) [1, 2, 3].forEach((p) => { if (Math.random() < 0.5) say(p, 'against', 1800); });
        await wait(1300, tk);
      } else if (e.type === 'jback') { GK.sfx('lock'); banner(e.on ? '11バック' : '11バック解除', e.on ? '場が流れるまで強さが逆になります' : '', '#5fe0c3', 1100); await wait(800, tk); }
      else if (e.type === 'lock') { GK.sfx('lock'); banner(`しばり ${e.suits.map((s) => R.SUIT_MARK[s]).join('')}`, '場が流れるまで、このマークしか出せません', '#ff8a7a', 1200); await wait(800, tk); }
      else if (e.type === 'eight') { GK.sfx('eight'); banner('8切り', '場が流れます', '#ffd76a', 1000); if (st.last > 0) face(st.last, 'happy', 1500); await wait(700, tk); }
      else if (e.type === 'spade3') { GK.sfx('eight'); banner('スペ3返し！', 'ジョーカーに勝ちました', '#ffd76a', 1200); await wait(800, tk); }
      else if (e.type === 'seven') GK.toast(`7渡し：${nameOf(e.to)}に ${e.ids.length} 枚渡しました`);
      else if (e.type === 'ten') GK.toast(`10捨て：${e.ids.length} 枚捨てました`);
      else if (e.type === 'finish') {
        G.lastAct[e.p] = e.hansoku ? '反則上がり' : R.POS_NAME[e.pos];
        if (!e.last) {
          GK.sfx(e.hansoku ? 'lose' : e.p === 0 ? 'win' : 'ok');
          banner(e.hansoku ? `${nameOf(e.p)}、反則上がり！` : `${nameOf(e.p)}、あがり！`, e.hansoku ? '最下位になります' : `${e.pos + 1} 番目に上がって${R.POS_NAME[e.pos]}`, e.hansoku ? '#ff8a7a' : '#ffe08a', 1500);
          if (e.p > 0) { face(e.p, e.hansoku ? 'angry' : 'happy', 4000); say(e.p, e.hansoku ? 'bottom' : e.pos === 0 ? 'top' : 'mid'); }
          await wait(1200, tk);
        }
      } else if (e.type === 'miyako') {
        GK.sfx('lose'); banner('都落ち！', `${nameOf(e.p)}は大貧民になりました`, '#ff8a7a', 1700);
        G.lastAct[e.p] = '都落ち';
        clearToDiscard();
        if (e.p > 0) { face(e.p, 'angry', 4000); say(e.p, 'bottom'); }
        await wait(1300, tk);
      } else if (e.type === 'clear') {
        await wait(e.reason ? 450 : 650, tk);
        G.trickView = [];
        for (const q of [0, 1, 2, 3]) if (st.pos[q] < 0) delete G.lastAct[q];
        clearToDiscard();
        GK.sfx('clear');
        await wait(350, tk);
      }
    }
  }
  /** cards that left play go to the discard pile */
  function clearToDiscard() {
    const st = G.st;
    const inHands = new Set(st.hands.flat());
    const inTrick = new Set(G.trickView.flatMap((t) => t.play.cards));
    const seen = new Set(G.discard);
    G.deck.forEach((id) => { if (!inHands.has(id) && !inTrick.has(id) && !seen.has(id)) G.discard.push(id); });
  }

  async function doTurn(tk) {
    const st = G.st, p = st.turn;
    G.active = p; updateBar();
    let pl;
    const locked = st.opt.passLock && st.top && st.locked.includes(p);
    if (locked) { await wait(p === 0 ? 450 : 300, tk); pl = null; }
    else if (p === 0 && !G.auto) pl = await humanTurn(tk);
    else {
      await wait(p === 0 ? 150 : 650 + Math.random() * 350, tk);
      pl = R.aiPlay(st, p, p === 0 ? 'plain' : CPUS[p].persona, p === 0 ? 1 : M.level, rng);
    }
    if (!pl) {
      const ev = R.pass(st, p);
      G.lastAct[p] = 'パス'; GK.sfx('passv');
      if (p > 0) { if (Math.random() < 0.35) say(p, 'pass', 1400); if (Math.random() < 0.25) face(p, 'angry', 1500); }
      await showEvents(ev.slice(1), tk);
      return;
    }
    const ev = R.applyPlay(st, p, pl);
    G.trickView = st.trick.slice();
    G.lastAct[p] = R.playName(pl);
    GK.sfx('slap');
    if (p > 0 && (pl.joker || R.val(pl.rank, R.isRev(st)) >= 11) && Math.random() < 0.5) { face(p, 'happy', 1600); if (Math.random() < 0.5) say(p, 'good', 1500); }
    await wait(420, tk);
    const pd = st.pending;
    let giveIds = [], discIds = [];
    if (pd.give) {
      giveIds = p === 0 && !G.auto ? await humanChoose(pd.give, '渡す', `7渡し：${nameOf(pd.giveTo)}に渡す札を ${pd.give} 枚選んでください`, tk) : R.aiChooseGive(st, p, pd.give, p ? M.level : 1);
    } else if (pd.discard) {
      discIds = p === 0 && !G.auto ? await humanChoose(pd.discard, '捨てる', `10捨て：捨てる札を ${pd.discard} 枚選んでください`, tk) : R.aiChooseGive(st, p, pd.discard, p ? M.level : 1);
    }
    const ev2 = R.finishPlay(st, giveIds, discIds);
    if (discIds.length) clearToDiscard();
    await showEvents(ev.concat(ev2), tk);
  }

  async function exchange(tk) {
    const st = G.st, prev = M.prevPos;
    const plan = R.exchangePlan(prev);
    if (!plan.length) return;
    G.hint = 'カード交換';
    banner('カード交換', '大貧民 ⇄ 大富豪 2 枚・貧民 ⇄ 富豪 1 枚', '#ffe08a', 1500);
    await wait(1200, tk);
    for (const ex of plan) {
      const ids = R.strongest(st.hands[ex.from], ex.n);
      R.give(st, ex.from, ex.to, ids);
      GK.sfx('deal');
      if (ex.from === 0) GK.toast(`${nameOf(ex.to)}に ${ids.map(R.label).join('・')} を渡しました`, 2400);
      if (ex.to === 0) GK.toast(`${nameOf(ex.from)}から ${ids.map(R.label).join('・')} をもらいました`, 2400);
      await wait(900, tk);
    }
    for (const ex of plan) {
      let ids;
      if (ex.to === 0 && !G.auto) ids = await humanChoose(ex.n, '渡す', `${nameOf(ex.from)}に返す札を ${ex.n} 枚選んでください`, tk);
      else ids = R.aiChooseGive(st, ex.to, ex.n, ex.to ? M.level : 1);
      R.give(st, ex.to, ex.from, ids);
      GK.sfx('deal');
      if (ex.from === 0) GK.toast(`${nameOf(ex.to)}から ${ids.map(R.label).join('・')} が返ってきました`, 2400);
      await wait(800, tk);
    }
    G.hint = '';
  }

  async function playGame(tk) {
    const st = R.newGame(rng, M.opt, M.prevPos);
    G.st = st; G.deck = R.makeDeck(M.opt.jokers || 1); G.deckSet = new Set(G.deck); G.trickView = []; G.discard = []; G.lastAct = {}; G.dealt = new Set(); G.active = -1; G.sel = [];
    banner(`第 ${M.game} 試合`, M.prevPos ? `${nameOf(st.turn)}（大貧民）から始めます` : '♦3 を持っている人から始めます', '#ffe08a', 1500);
    await wait(500, tk);
    const order = [];
    for (let i = 0; i < 14; i++) for (let p = 0; p < 4; p++) if (st.hands[p][i]) order.push(st.hands[p][i]);
    for (let i = 0; i < order.length; i++) { G.dealt.add(order[i]); if (i % 4 === 0) { GK.sfx('deal'); await wait(40, tk); } }
    await wait(400, tk);
    G.dealt = null;
    await exchange(tk);
    if (!M.prevPos) GK.toast(`${nameOf(st.turn)}が ♦3 を持っています`, 1800);
    while (!st.over) await doTurn(tk);
    G.active = -1; G.mode = null; updateBar();
    await wait(800, tk);
    await gameResult(tk);
  }

  function rankRow(p, pos, gained, total, me) {
    const img = p ? `<img src="img/cpu-${CPUS[p].id}-normal.webp" alt="">` : '';
    return `<li class="${me ? 'me' : ''}" style="animation-delay:${0.08 + pos * 0.12}s"><span class="rk" style="--rc:${POS_COLOR[pos]}">${R.POS_NAME[pos]}</span><span class="nm">${img}${nameOf(p)}${G.lastAct[p] === '反則上がり' ? '<small>反則上がり</small>' : G.lastAct[p] === '都落ち' ? '<small>都落ち</small>' : ''}</span><span class="pt">+${gained}</span><span class="tot">${total}点</span></li>`;
  }
  function gameResult(tk) {
    const st = G.st;
    st.pos.forEach((x, p) => { M.points[p] += R.POS_POINTS[x]; });
    M.history.push(st.pos.slice());
    M.prevPos = st.pos.slice();
    if (st.pos[0] === 0) M.daifugoCount++;
    [1, 2, 3].forEach((p) => face(p, st.pos[p] === 0 ? 'happy' : st.pos[p] === 3 ? 'angry' : 'normal', 6000));
    GK.sfx(st.pos[0] <= 1 ? 'win' : 'lose');
    const order = [0, 1, 2, 3].sort((a, b) => st.pos[a] - st.pos[b]);
    $('#rKicker').textContent = `第 ${M.game} 試合の結果（全 ${M.games} 試合）`;
    $('#rTitle').textContent = `あなたは${R.POS_NAME[st.pos[0]]}${st.pos[0] === 0 ? '！' : ''}`;
    $('#rRanks').innerHTML = order.map((p) => rankRow(p, st.pos[p], R.POS_POINTS[st.pos[p]], M.points[p], p === 0)).join('');
    const last = M.game >= M.games;
    $('#rNote').textContent = last ? '' : '次の試合は、大貧民と大富豪・貧民と富豪でカード交換をしてから始めます。';
    $('#btnNext').textContent = last ? '最終結果へ' : '次の試合へ';
    $('#resOv').hidden = false;
    setTimeout(() => $('#btnNext').focus({ preventScroll: true }), 60);
    return new Promise((res, rej) => {
      $('#btnNext').onclick = () => { GK.sfx('click'); $('#btnNext').onclick = null; G.ovWaiter = null; $('#resOv').hidden = true; res(); };
      G.ovWaiter = { rej, tk };
    });
  }

  function finalResult() {
    const pts = M.points;
    const order = [0, 1, 2, 3].sort((a, b) => pts[b] - pts[a] || (M.prevPos[a] - M.prevPos[b]));
    const place = order.indexOf(0);
    const rec = records();
    const r = rec[M.level] || { series: 0, wins: 0, best: 0, daifugo: 0 };
    r.series++; if (place === 0) r.wins++;
    const newBest = pts[0] > (r.best || 0);
    if (newBest) r.best = pts[0];
    r.daifugo = (r.daifugo || 0) + M.daifugoCount;
    rec[M.level] = r; GK.store.set('records', rec);
    $('#fKicker').textContent = `${M.games} 試合の最終結果 ・ ${LEVELS[M.level]}`;
    const t = $('#fTitle');
    t.textContent = place === 0 ? '優勝！' : `${place + 1} 位`;
    t.className = place === 0 ? '' : 'low';
    $('#fRanks').innerHTML = order.map((p, i) => `<li class="${p === 0 ? 'me' : ''}" style="animation-delay:${0.08 + i * 0.12}s"><span class="rk" style="--rc:${POS_COLOR[i]}">${i + 1} 位</span><span class="nm">${p ? `<img src="img/cpu-${CPUS[p].id}-${i === 0 ? 'happy' : i === 3 ? 'angry' : 'normal'}.webp" alt="">` : ''}${nameOf(p)}</span><span class="pt">大富豪 ${M.history.filter((h) => h[p] === 0).length} 回</span><span class="tot">${pts[p]}点</span></li>`).join('');
    $('#fNote').innerHTML = `${LEVELS[M.level]}での成績：${r.wins} 勝 / ${r.series} 回 ・ 最高 ${r.best} 点${newBest && pts[0] > 0 ? '<span class="new">最高点を更新</span>' : ''}`;
    $('#finOv').hidden = false;
    GK.sfx(place === 0 ? 'win' : 'lose');
    [1, 2, 3].forEach((p) => { const i = order.indexOf(p); face(p, i === 0 ? 'happy' : i === 3 ? 'angry' : 'normal', 99999); say(p, i === 0 ? 'top' : i === 3 ? 'bottom' : 'mid', 3500); });
    setTimeout(() => $('#btnAgain').focus({ preventScroll: true }), 60);
    renderTitle();
  }

  async function startSeries() {
    const tk = ++token;
    rejectWaiters();
    M = { level: settings.level, games: settings.games, opt: Object.assign({}, settings.opt, { jokers: 1 }), game: 0, points: [0, 0, 0, 0], history: [], prevPos: null, daifugoCount: 0 };
    G.st = null; G.discard = []; G.lastAct = {}; G.bubbles = {}; G.faces = { 1: 'normal', 2: 'normal', 3: 'normal' }; G.faceT = {};
    $('#title').classList.add('off'); $('#finOv').hidden = true; $('#resOv').hidden = true; $('#bar').hidden = false;
    music(SONG_GAME);
    try {
      [1, 2, 3].forEach((p, i) => setTimeout(() => { if (tk === token) say(p, 'start', 2200); }, 300 + i * 500));
      for (let g = 1; g <= M.games; g++) { M.game = g; await playGame(tk); }
      finalResult();
    } catch (e) { if (e !== ABORT) throw e; }
  }
  function toTitle() {
    token++;
    rejectWaiters();
    ['#resOv', '#finOv'].forEach((s) => { $(s).hidden = true; });
    $('#bar').hidden = true;
    G.st = null; G.active = -1; G.banner = null; G.bubbles = {}; G.hint = '';
    M = null;
    renderTitle();
    $('#title').classList.remove('off');
    music(SONG_TITLE);
    setTimeout(() => $('#btnStart').focus({ preventScroll: true }), 50);
  }

  /* ---------------- title ---------------- */
  function renderTitle() {
    const chars = $('#chars');
    chars.innerHTML = [1, 2, 3].map((p) => { const c = CPUS[p]; return `<div class="char" style="--c:${c.color}"><img src="img/cpu-${c.id}-normal.webp" alt=""><div><b>${c.name}<small style="color:${c.color}">${c.style}</small></b><span>${c.desc}</span></div></div>`; }).join('');
    const seg = (el, list, cur, lab, fn) => {
      el.innerHTML = '';
      list.forEach((v, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = lab(v, i);
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(cur(v, i)));
        b.dataset.v = typeof v === 'number' ? v : i;
        b.onclick = () => { fn(v, i); saveSettings(); GK.sfx('select'); renderTitle(); };
        el.appendChild(b);
      });
    };
    seg($('#segLevel'), LEVELS, (v, i) => settings.level === i, (v) => v, (v, i) => { settings.level = i; });
    seg($('#segGames'), GAME_CHOICES, (v) => settings.games === v, (v) => `${v}試合`, (v) => { settings.games = v; });
    $('#btnRules').textContent = `ルール設定（${RULES.filter((r) => settings.opt[r.key]).length}/${RULES.length}）`;
    const rec = records(), r = rec[settings.level];
    $('#recLine').textContent = r ? `${LEVELS[settings.level]}：優勝 ${r.wins} 回 / ${r.series} 回 ・ 最高 ${r.best} 点 ・ 大富豪 ${r.daifugo || 0} 回` : 'あなたの左隣から時計回りにハヤテ・シオン・ゴンゾウが座ります。遊び方は右上の ? から。';
  }
  function openRules() {
    const form = document.createElement('div');
    form.className = 'rules-form';
    RULES.forEach((r) => {
      const l = document.createElement('label');
      l.innerHTML = `<input type="checkbox" ${settings.opt[r.key] ? 'checked' : ''} data-k="${r.key}"><div><b>${r.name}</b><span>${r.desc}</span></div>`;
      form.appendChild(l);
    });
    GK.modal({ title: 'ルール設定', body: form, wide: true, buttons: [{ label: '初期設定に戻す', value: 'reset' }, { label: '決定', value: 'ok', primary: true }] }).then((v) => {
      if (v === 'reset') settings.opt = Object.assign({}, DEF.opt);
      else form.querySelectorAll('input').forEach((i) => { settings.opt[i.dataset.k] = i.checked; });
      saveSettings(); renderTitle();
    });
  }
  $('#btnRules').onclick = () => { GK.sfx('click'); openRules(); };
  $('#btnStart').onclick = () => { GK.sfx('ok'); startSeries(); };
  $('#btnAgain').onclick = () => { GK.sfx('ok'); startSeries(); };
  $('#btnToTitle').onclick = () => { GK.sfx('click'); toTitle(); };

  GK.init({
    id: 'daifugo', title: '番狂わせ大富豪', help: helpHTML,
    menu: () => {
      GK.sfx('click');
      if (M && $('#finOv').hidden) GK.modal({ title: 'メニュー', body: '<p>ゲームを中断してタイトルに戻りますか？（この勝負の記録は残りません）</p>', buttons: [{ label: '続ける', value: false }, { label: 'タイトルへ戻る', value: true, primary: true }] }).then((v) => { if (v) toTitle(); });
      else if (M) toTitle();
      else GK.help();
    },
  });
  renderTitle();
  updateBar();
  const IMG = ['bg-table'];
  [1, 2, 3].forEach((p) => ['normal', 'happy', 'angry'].forEach((f) => IMG.push(`cpu-${CPUS[p].id}-${f}`)));
  const ready = GK.loadImages(IMG);

  /* ---------------- self-test ---------------- */
  const until = async (fn, ms = 20000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) return false; await GK.wait(40); } return true; };
  window.__daifugo = { G, get M() { return M; }, R, startSeries, toTitle, settings, myHand, resolveHuman };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('FAIL ' + m); };
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    await ready; await GK.wait(300);
    document.querySelector('#segLevel button[data-v="2"]').click();
    document.querySelector('#segGames button[data-v="3"]').click();
    if (settings.level !== 2 || settings.games !== 3) fail('title choices');
    $('#btnStart').click();
    if (!(await until(() => G.mode === 'play', 40000))) { fail('never reached the player turn'); return { ok, notes }; }
    await GK.wait(600);
    // tap the cards of a legal play (pointer events on the canvas), then press 出す
    const pl = G.legal.slice().sort((a, b) => b.n - a.n)[0];
    const rect = canvas.getBoundingClientRect();
    for (const id of pl.cards) {
      const s = SP[id];
      const x = rect.left + s.x + s.w * 0.25, y = rect.top + s.y + s.w * CR * 0.5;
      for (const type of ['pointerdown', 'pointerup']) canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType: 'touch', pointerId: 9, bubbles: true }));
      await GK.wait(120);
    }
    await GK.wait(300);
    await shot('selected');
    if (G.sel.length !== pl.cards.length) notes.push(`tap selected ${G.sel.length}/${pl.cards.length} (overlap)`);
    if (!selectionPlay()) { G.sel = pl.cards.slice(); updateBar(); }
    const before = G.st.hands[0].length;
    $('#bPlay').click();
    await GK.wait(100);
    if (G.st.hands[0].length >= before) fail('the play button did not play'); else notes.push(`played ${pl.cards.map(R.label).join(' ')}`);
    if (!(await until(() => G.mode === 'play' || G.st.over || !$('#resOv').hidden, 40000))) fail('CPUs did not answer'); else notes.push('CPUs answered');
    await GK.wait(500);
    await shot('turn2');
    G.auto = true; G.speed = 0.03; G.snap = true;
    if (G.waiter) { if (G.mode === 'play') resolveHuman(R.aiPlay(G.st, 0, 'plain', 1, rng)); else if (G.mode === 'choose') resolveHuman(R.aiChooseGive(G.st, 0, G.choose.n, 1)); }
    let shotRes = false;
    const t0 = performance.now();
    while ($('#finOv').hidden && performance.now() - t0 < 150000) {
      if (!$('#resOv').hidden) { if (!shotRes) { G.snap = false; await GK.wait(700); await shot('result'); shotRes = true; G.snap = true; } $('#btnNext').click(); }
      await GK.wait(30);
    }
    if ($('#finOv').hidden) { fail('no final result'); return { ok, notes }; }
    G.snap = false; G.speed = 1;
    const sum = M.points.reduce((a, b) => a + b, 0);
    if (M.history.length !== 3 || sum !== 18) fail(`points do not add up (${M.points.join(',')})`);
    notes.push(`3 games: ${M.points.join(' / ')}`);
    await GK.wait(700);
    await shot('final');
    G.auto = false;
    $('#btnToTitle').click();
    await GK.wait(400);
    if ($('#title').classList.contains('off')) fail('back to title');
    return { ok, notes };
  };
})();
