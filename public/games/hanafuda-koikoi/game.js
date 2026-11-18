/* 花暦こいこい — table, animation, input, flow (rules and CPU logic: rules.js) */
(() => {
  'use strict';
  const R = window.HanaRules;
  const $ = (s) => document.querySelector(s);
  const { clamp } = GK;
  const css = getComputedStyle(document.documentElement);
  const SANS = (css.getPropertyValue('--gk-sans') || 'sans-serif').trim();
  const SERIF = (css.getPropertyValue('--gk-serif') || 'serif').trim();
  const font = (px, w = 700, fam = SANS) => `${w} ${Math.max(6, Math.round(px * 10) / 10)}px ${fam}`;
  const ALL = R.CARDS.map((c) => c.id);
  const ABORT = { abort: true };
  const rng = GK.rng();

  /* ---------------- data ---------------- */
  const OPPS = [
    {
      id: 'koume', name: '小梅', yomi: 'こうめ', level: 0, levelName: 'やさしい', color: '#c4577a', img: 'cpu-koume', desc: '茶屋の看板娘。光る札に目がない',
      lines: { start: ['よろしくお願いしますっ！', 'お手やわらかに〜'], koi: ['こいこい！ まだまだいきますよ〜', 'えいっ、こいこい！'], shobu: ['勝負です！', 'ここで上がりますっ'], ouch: ['あっ、それ欲しかったのに〜', 'うう、やられました…'], win: ['えへへ、勝っちゃいました！'], lose: ['参りました〜。またお願いしますね'], nice: ['わぁ、きれいな札！', 'いいなあ、その札'] },
    },
    {
      id: 'ryusai', name: '柳斎', yomi: 'りゅうさい', level: 1, levelName: 'ふつう', color: '#4f7a46', img: 'cpu-ryusai', desc: '旅の絵師。札の流れを読む堅実派',
      lines: { start: ['一局、手合わせ願おう', '札の巡りを見せてもらおうか'], koi: ['こいこい。まだ筆は止めぬ', 'もうひと筆、こいこいだ'], shobu: ['ここで勝負', '潮時だな。勝負'], ouch: ['ほう、見事な役だ', 'うむ、読み違えたか'], win: ['良い勝負だった'], lose: ['参った。腕を上げたな'], nice: ['ほう、いい札を取る', 'その一枚は痛いな'] },
    },
    {
      id: 'sogetsu', name: '宗月', yomi: 'そうげつ', level: 2, levelName: 'つよい', color: '#6a4a86', img: 'cpu-sogetsu', desc: '料亭の御隠居。引き際を知る名人',
      lines: { start: ['ほっほ、お手柔らかにな', 'さて、今宵の札はどう巡るかの'], koi: ['こいこい。まだまだ伸びるわい', 'ほっほ、こいこいじゃ'], shobu: ['ここらで勝負といこう', '欲張らぬのも芸のうちじゃ'], ouch: ['やりおるのう', 'ほう、これは一本取られた'], win: ['まだまだ若い者には負けんよ'], lose: ['見事じゃ。久しぶりに唸ったわい'], nice: ['ふむ、いい手じゃ', 'その札を取るか。やるのう'] },
    },
  ];
  const MONTH_CHOICES = [3, 6, 12];
  const RULES = [
    { key: 'kikuKasu', name: '菊に盃をカスにも数える', desc: '菊に盃はタネ札ですが、カスの 1 枚としても数えます。' },
    { key: 'double7', name: '7 点以上で倍付け', desc: '上がったときの役の合計が 7 点以上なら、得点が 2 倍になります。' },
    { key: 'koiGaeshi', name: 'こいこい返し（2 倍）', desc: '相手が「こいこい」をしている間に上がると、得点が 2 倍になります。' },
    { key: 'teyaku', name: '手役（手四・くっつき）', desc: '配られた手札に同じ月が 4 枚（手四）か、同じ月の 2 枚組が 4 組（くっつき）あれば、すぐに 6 点で上がりです。' },
  ];
  const DEF = { opp: 1, months: 6, opt: { kikuKasu: true, double7: true, koiGaeshi: true, teyaku: true } };
  const saved = GK.store.get('settings', {}, 'hanafuda-koikoi') || {};
  const settings = { opp: OPPS[saved.opp] ? saved.opp : DEF.opp, months: MONTH_CHOICES.includes(saved.months) ? saved.months : DEF.months, opt: Object.assign({}, DEF.opt, saved.opt || {}) };
  const saveSettings = () => GK.store.set('settings', settings);
  const records = () => GK.store.get('records', {}) || {};

  /* ---------------- help ---------------- */
  const yakuRows = [
    ['五光', '光札 5 枚すべて', '10 点'], ['四光', '「柳に小野道風」以外の光札 4 枚', '8 点'], ['雨四光', '「柳に小野道風」を含む光札 4 枚', '7 点'], ['三光', '「柳に小野道風」以外の光札 3 枚', '5 点'],
    ['花見で一杯', '桜に幕 ＋ 菊に盃', '5 点'], ['月見で一杯', '芒に月 ＋ 菊に盃', '5 点'], ['猪鹿蝶', '萩に猪・紅葉に鹿・牡丹に蝶', '5 点（ほかのタネ 1 枚ごとに +1）'],
    ['赤短', '松・梅・桜の赤短', '5 点（ほかの短冊 1 枚ごとに +1）'], ['青短', '牡丹・菊・紅葉の青短', '5 点（ほかの短冊 1 枚ごとに +1）'], ['赤短・青短の重複', '赤短と青短の 6 枚', '10 点（ほかの短冊 1 枚ごとに +1）'],
    ['タネ', 'タネ札 5 枚', '1 点（1 枚ごとに +1）'], ['タン', '短冊札 5 枚', '1 点（1 枚ごとに +1）'], ['カス', 'カス札 10 枚', '1 点（1 枚ごとに +1）'], ['手四・くっつき', '配られた手札で（設定）', '6 点'],
  ];
  const onoff = (k) => (settings.opt[k] ? 'あり' : 'なし');
  const helpHTML = () => `
    <p>同じ月の札を合わせて取り、<b>役</b>をそろえて点を取る、花札の「こいこい」です。決めた月数（3・6・12 か月）を終えたとき、合計点の多いほうが勝ちです。</p>
    <h3>1 回の手番</h3>
    <ol><li>手札から 1 枚出します。場に<b>同じ月</b>の札があれば 2 枚とも取れます（同じ月が 2 枚あるときは、どちらを取るか選びます。3 枚あれば 4 枚とも取れます）。合う札がなければ、出した札は場に置かれます。</li>
    <li>続けて山札を 1 枚めくり、同じように場の札と合わせます。</li></ol>
    <h3>こいこいと勝負</h3>
    <p>役ができたとき（役の点が増えたときも）、<b>勝負</b>でその月を終えて点をもらうか、<b>こいこい</b>で続けてさらに点を伸ばすかを選びます。こいこいのあとで相手が先に上がると、こちらの点は 0 になります。両者の手札がなくなるまで誰も上がらなければ流局（0 点）です。</p>
    <h3>操作</h3>
    <ul><li><b>マウス</b>：手札にポインターを合わせると、取れる場の札が光ります。クリックで出します。</li>
    <li><b>タッチ</b>：手札を 1 回タップで選び、もう一度タップ（または光っている場の札をタップ）で出します。</li>
    <li><b>キーボード</b>：<kbd>←</kbd> <kbd>→</kbd> か <kbd>1</kbd>〜<kbd>8</kbd> で選んで <kbd>Enter</kbd>。こいこいは <kbd>K</kbd>、勝負は <kbd>S</kbd>。</li></ul>
    <p>札の左上の数字が月、下の印が札の種類（光・タネ・赤短・青短・短冊・カス）です。</p>
    <h3>役の一覧</h3>
    <table>${yakuRows.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>
    <p>光の役は、いちばん高いものだけを数えます。猪鹿蝶・赤短・青短の「+1」で数えた札は、タネ・タンの役とは重ねて数えません。</p>
    <h3>このゲームのルール</h3>
    <ul><li>手札 8 枚ずつ、場に 8 枚。場に同じ月が 4 枚そろったら配り直します。</li>
    <li>最初の親は、札を 1 枚ずつ引いて早い月を引いたほうです（同じ月なら札の格が上のほう）。次の月からは、前の月に上がった人が親。流局のときは親はそのまま。親が先に打ちます。</li>
    <li>上がった人だけが点をもらいます。自分がこいこいをしたあとに上がっても倍にはなりません。</li>
    <li>菊に盃をカスにも数える：<b>${onoff('kikuKasu')}</b> ／ 7 点以上で倍付け：<b>${onoff('double7')}</b> ／ こいこい返し（相手のこいこい中に上がると 2 倍）：<b>${onoff('koiGaeshi')}</b> ／ 手役（手四・くっつき 6 点）：<b>${onoff('teyaku')}</b>（タイトルの「ルール設定」で変えられます）</li></ul>`;

  /* ---------------- state ---------------- */
  const G = {
    st: null, dealt: null, over: {}, mode: null, sel: null, targets: [], tsel: 0, hover: null, kbd: false,
    active: -1, hint: '', banner: null, bubble: null, fx: [], waiter: null, ovWaiter: null,
    auto: false, speed: 1, snap: false, reveal: false,
  };
  let M = null; // the match
  let token = 0;
  const level = (p) => (p === 1 ? M.opp.level : 1);
  const wait = async (ms, tk) => { await GK.wait(ms * G.speed); if (tk !== token) throw ABORT; };
  const pickLine = (k) => { const a = M && M.opp.lines[k]; return a ? a[Math.floor(Math.random() * a.length)] : ''; };
  const say = (k, ms = 2200) => { const t = pickLine(k); if (t) G.bubble = { text: t, t0: performance.now(), dur: ms }; };
  const banner = (text, sub, ms = 1500) => { G.banner = { text, sub, t0: performance.now(), dur: ms }; };

  /* ---------------- canvas & layout ---------------- */
  const canvas = $('#table');
  let L = null;
  const R4 = (x, y, w, h) => ({ x, y, w, h });
  function layout(W, H) {
    const L = { W, H, land: W / H >= 1.15 };
    const u = Math.min(W, H);
    const pad = (L.pad = clamp(u * 0.018, 5, 16));
    L.fs = clamp(u * 0.027, 10.5, 17);
    if (L.land) {
      const leftW = clamp(W * 0.18, 128, 270), rightW = clamp(W * 0.26, 176, 390);
      const cx = leftW + pad * 1.5, cw = W - leftW - rightW - pad * 3;
      const topH = clamp(H * 0.15, 50, 140), botH = clamp(H * 0.27, 92, 250);
      L.cpuInfo = R4(pad, pad, leftW - pad, H / 2 - pad * 1.5);
      L.plInfo = R4(pad, H / 2 + pad * 0.5, leftW - pad, H / 2 - pad * 1.5);
      L.cpuHand = R4(cx, pad, cw, topH - pad);
      L.plHand = R4(cx, H - botH, cw, botH - pad);
      L.mid = R4(cx, topH + pad, cw, H - topH - botH - pad * 2);
      const capTop = 56, chh = (H - capTop - pad * 2) / 2;
      L.cpuCapt = R4(W - rightW - pad * 0.5, capTop, rightW - pad * 0.5, chh);
      L.plCapt = R4(W - rightW - pad * 0.5, capTop + chh + pad, rightW - pad * 0.5, chh);
      const g = pad * 0.8;
      L.hcw = Math.min((L.plHand.w - 7 * g) / 8, (L.plHand.h * 0.9) / 1.6);
      L.hrows = 1;
    } else {
      const W2 = W - pad * 2, gap = pad * 0.6;
      const b1 = clamp(H * 0.068, 44, 78), b2 = clamp(H * 0.09, 50, 104), b3 = clamp(H * 0.046, 28, 52), b6 = clamp(H * 0.044, 28, 48), b7 = clamp(H * 0.27, 150, 330);
      let y = pad;
      L.cpuInfo = R4(pad, y, W - 150 - pad, b1); y += b1 + gap;
      L.cpuCapt = R4(pad, y, W2, b2); y += b2 + gap;
      L.cpuHand = R4(pad, y, W2 * 0.4, b3); L.cpuChips = R4(pad + W2 * 0.42, y, W2 * 0.58, b3); y += b3 + gap;
      L.plHand = R4(pad, H - pad - b7, W2, b7);
      L.plInfo = R4(pad, L.plHand.y - gap - b6, W2 * 0.4, b6);
      L.plChips = R4(pad + W2 * 0.42, L.plInfo.y, W2 * 0.58, b6);
      L.plCapt = R4(pad, L.plInfo.y - gap - b2, W2, b2);
      L.mid = R4(pad, y, W2, L.plCapt.y - gap - y);
      const g = pad * 0.9;
      L.hcw = Math.min((L.plHand.w - 3 * g) / 4, ((L.plHand.h - g) / 2 - 4) / 1.6);
      L.hrows = 2;
    }
    L.grid = {};
    return L;
  }
  const view = GK.fit(canvas, { onResize: (v) => { L = layout(v.w, v.h); } });
  if (!L) L = layout(view.w, view.h);

  /** field grid for cap slots: { cw, slot(i) → {x, y, w}, deck: {x, y, w} } */
  function fieldGrid(cap) {
    if (L.grid[cap]) return L.grid[cap];
    const r = L.mid, g = L.pad * 0.7, hintH = L.fs * 1.9;
    const H = r.h - hintH;
    let best = null;
    for (let cols = 2; cols <= cap; cols++) {
      const rows = Math.ceil(cap / cols);
      const cw = Math.min((r.w - (cols + 2) * g) / (cols + 1.3), ((H - (rows - 1) * g) / rows) / 1.6);
      if (!best || cw > best.cw + 0.01) best = { cols, rows, cw };
    }
    const cw = Math.min(best.cw, L.hcw * (L.land ? 1 : 0.95));
    const ch = cw * 1.6;
    const deckW = cw * 1.3 + g;
    const gw = best.cols * cw + (best.cols - 1) * g, gh = best.rows * ch + (best.rows - 1) * g;
    const x0 = r.x + deckW + g + (r.w - deckW - g - gw) / 2, y0 = r.y + (H - gh) / 2;
    const out = {
      cw, cols: best.cols,
      slot: (i) => ({ x: x0 + (i % best.cols) * (cw + g), y: y0 + Math.floor(i / best.cols) * (ch + g), w: cw }),
      deck: { x: r.x + g, y: r.y + (H - ch) / 2, w: cw },
    };
    L.grid[cap] = out;
    return out;
  }
  const fieldCap = () => Math.max(12, G.st ? G.st.field.length + (G.st.field.length % 2) : 12);
  const displayHand = () => (G.st ? G.st.hands[0].slice().sort() : []);

  function handPos(i, n) {
    const r = L.plHand, w = L.hcw, h = w * 1.6, g = L.pad * (L.land ? 0.8 : 0.9);
    if (L.hrows === 1) {
      const tw = n * w + (n - 1) * g;
      return { x: r.x + (r.w - tw) / 2 + i * (w + g), y: r.y + (r.h - h) / 2 + h * 0.04, w };
    }
    const row = i < 4 ? 0 : 1, inRow = row === 0 ? Math.min(n, 4) : n - 4, j = row === 0 ? i : i - 4;
    const tw = inRow * w + (inRow - 1) * g, th = 2 * h + g;
    return { x: r.x + (r.w - tw) / 2 + j * (w + g), y: r.y + (r.h - th) / 2 + row * (h + g) + 4, w };
  }
  function cpuHandPos(i, n) {
    const r = L.cpuHand, w = Math.min((r.h * 0.92) / 1.6, r.w / 6), h = w * 1.6;
    const step = n > 1 ? Math.min(w * 0.72, (r.w - w) / (n - 1)) : 0;
    const tw = w + step * (n - 1);
    const x = L.land ? r.x + (r.w - tw) / 2 : r.x;
    return { x: x + i * step, y: r.y + (r.h - h) / 2, w, rot: L.land ? (i - (n - 1) / 2) * 0.035 : 0 };
  }
  const GROUP_T = ['hikari', 'tane', 'tan', 'kasu'];
  const GROUP_JA = { hikari: '光', tane: 'タネ', tan: '短冊', kasu: 'カス' };
  function captLayout(p) {
    const r = p ? L.cpuCapt : L.plCapt;
    const ids = G.st ? R.sortCapt(G.st.capt[p]) : [];
    const groups = GROUP_T.map((t) => ids.filter((id) => R.card(id).type === t));
    const pos = {}, labels = [];
    if (r.w / r.h > 2.6) {
      const weights = [0.19, 0.25, 0.26, 0.3];
      const labelH = clamp(r.h * 0.24, 11, 17), chh = r.h - labelH - 2, cw = chh / 1.6;
      let x = r.x;
      groups.forEach((g, gi) => {
        const gw = r.w * weights[gi] - 5;
        const step = g.length > 1 ? Math.min(cw * 0.55, (gw - cw) / (g.length - 1)) : 0;
        g.forEach((id, j) => { pos[id] = { x: x + j * step, y: r.y + labelH, w: cw, face: 1, z: 200 + gi * 30 + j }; });
        labels.push({ x, y: r.y, w: gw, h: r.h, t: GROUP_T[gi], n: g.length, cy: r.y + labelH, cw, ch: chh });
        x += r.w * weights[gi];
      });
    } else {
      const headH = L.fs * 1.7, rowH = (r.h - headH) / 4, lw = clamp(r.w * 0.17, 36, 60);
      const chh = Math.max(10, rowH - 5), cw = chh / 1.6, aw = r.w - lw - 4;
      groups.forEach((g, gi) => {
        const y = r.y + headH + gi * rowH;
        const step = g.length > 1 ? Math.min(cw * 0.66, (aw - cw) / (g.length - 1)) : 0;
        g.forEach((id, j) => { pos[id] = { x: r.x + lw + j * step, y: y + (rowH - chh) / 2, w: cw, face: 1, z: 200 + gi * 30 + j }; });
        labels.push({ x: r.x, y, w: lw, h: rowH, t: GROUP_T[gi], n: g.length, row: true, cx: r.x + lw, cy: y + (rowH - chh) / 2, cw, ch: chh });
      });
    }
    return { pos, labels, r };
  }

  /* ---------------- sprites ---------------- */
  const SP = {};
  ALL.forEach((id) => { SP[id] = { x: -200, y: -200, w: 40, f: 0, rot: 0, z: 0 }; });
  let placed = false;
  function targets() {
    const T = {};
    const st = G.st;
    const fg = fieldGrid(fieldCap());
    const dk = fg.deck;
    const deck = st ? st.deck : ALL;
    deck.forEach((id, i) => { T[id] = { x: dk.x - i * 0.18, y: dk.y - i * 0.28, w: dk.w, face: 0, z: i }; });
    if (st) {
      st.field.forEach((id, i) => { if (id) T[id] = Object.assign(fg.slot(i), { face: 1, z: 100 + i }); });
      const hand = displayHand();
      const prev = G.mode === 'hand' ? (G.sel || G.hover) : null;
      hand.forEach((id, i) => {
        const p = handPos(i, hand.length);
        if (id === prev) p.y -= p.w * 1.6 * 0.12;
        T[id] = Object.assign(p, { face: 1, z: 400 + i });
      });
      st.hands[1].forEach((id, i) => { T[id] = Object.assign(cpuHandPos(i, st.hands[1].length), { face: G.reveal ? 1 : 0, z: 300 + i }); });
      for (const p of [0, 1]) Object.assign(T, captLayout(p).pos);
      if (G.dealt) {
        const top = { x: dk.x - deck.length * 0.18, y: dk.y - deck.length * 0.28, w: dk.w, face: 0, z: 60 };
        st.hands[0].concat(st.hands[1], st.field).forEach((id) => { if (id && !G.dealt.has(id)) T[id] = Object.assign({}, top); });
      }
    }
    for (const id in G.over) {
      const o = G.over[id];
      if (o.where === 'reveal') T[id] = { x: dk.x + dk.w * 0.42, y: dk.y + dk.w * 0.2, w: dk.w * 1.08, face: 1, z: 800 };
      else if (o.where === 'onto') { const a = T[o.anchor] || dk; T[id] = { x: a.x + a.w * 0.22, y: a.y + a.w * 0.26, w: a.w, face: 1, z: (a.z || 0) + 600 }; }
      else if (o.where === 'oya') {
        const r = L.mid, w = Math.min(L.hcw * 1.25, r.h / 1.6 * 0.6), gap = w * 0.9;
        T[id] = { x: r.x + r.w / 2 + (o.p === 0 ? gap / 2 : -gap / 2 - w), y: r.y + (r.h - w * 1.6) / 2, w, face: o.face, z: 900 + o.p };
      }
    }
    return T;
  }

  /* ---------------- drawing ---------------- */
  const BADGE = { hikari: ['#e3b236', '#3a2606'], tane: ['#2f7d5b', '#fff'], aka: ['#c8302f', '#fff'], ao: ['#2a54a8', '#fff'], red: ['#d4692b', '#fff'], kasu: ['#5d5752', '#fff'] };
  const badgeKey = (c) => (c.type === 'tan' ? c.sub : c.type);
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function drawFace(g, c, x, y, w, h) {
    const r = Math.max(2, w * 0.07), b = Math.max(1, w * 0.04);
    rr(g, x, y, w, h, r); g.fillStyle = '#1d1411'; g.fill();
    const img = GK.images[c.img];
    g.save(); rr(g, x + b, y + b, w - 2 * b, h - 2 * b, Math.max(1, r - b)); g.clip();
    if (img) g.drawImage(img, x + b, y + b, w - 2 * b, h - 2 * b); else { g.fillStyle = R.MONTHS[c.m].color; g.fill(); }
    g.restore();
    const s = clamp(w * 0.3, 8, 26), mx = x + b + s * 0.56, my = y + b + s * 0.56;
    g.beginPath(); g.arc(mx, my, s / 2, 0, Math.PI * 2); g.fillStyle = R.MONTHS[c.m].dark; g.fill();
    g.lineWidth = Math.max(0.8, s * 0.08); g.strokeStyle = 'rgba(255,248,230,.92)'; g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = font(s * (c.m >= 10 ? 0.5 : 0.62), 800); g.fillText(String(c.m), mx, my + s * 0.04);
    const [bg, fg] = BADGE[badgeKey(c)];
    if (w >= 30) {
      const label = R.badgeOf(c), fs = clamp(w * 0.17, 8, 16);
      g.font = font(fs, 800);
      const tw = g.measureText(label).width + fs * 0.9, bh = fs * 1.35, bx = x + w / 2 - tw / 2, by = y + h - b - bh - h * 0.025;
      rr(g, bx, by, tw, bh, bh / 2); g.fillStyle = bg; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.8)'; g.stroke();
      g.fillStyle = fg; g.fillText(label, x + w / 2, by + bh / 2 + fs * 0.05);
    } else {
      g.fillStyle = bg; g.fillRect(x + b, y + h - b - h * 0.14, w - 2 * b, h * 0.14);
    }
  }
  function drawBack(g, x, y, w, h) {
    const r = Math.max(2, w * 0.07);
    rr(g, x, y, w, h, r);
    const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#8e231a'); gr.addColorStop(1, '#4b0f0b');
    g.fillStyle = gr; g.fill(); g.lineWidth = Math.max(1, w * 0.03); g.strokeStyle = '#1d0806'; g.stroke();
    if (w < 16) return;
    const i = w * 0.11;
    rr(g, x + i, y + i, w - 2 * i, h - 2 * i, r * 0.6); g.lineWidth = Math.max(0.8, w * 0.02); g.strokeStyle = 'rgba(232,196,106,.55)'; g.stroke();
    const cx = x + w / 2, cy = y + h / 2, R0 = w * 0.17;
    g.fillStyle = 'rgba(232,196,106,.78)';
    g.beginPath();
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; g.moveTo(cx + Math.cos(a) * R0 * 0.62 + R0 * 0.42, cy + Math.sin(a) * R0 * 0.62); g.arc(cx + Math.cos(a) * R0 * 0.62, cy + Math.sin(a) * R0 * 0.62, R0 * 0.42, 0, Math.PI * 2); }
    g.fill();
    g.beginPath(); g.arc(cx, cy, R0 * 0.26, 0, Math.PI * 2); g.fillStyle = '#6a1712'; g.fill();
  }
  function glow(g, x, y, w, h, color, lw, blur) {
    g.save(); g.shadowColor = color; g.shadowBlur = blur; g.lineWidth = lw; g.strokeStyle = color;
    rr(g, x - lw / 2, y - lw / 2, w + lw, h + lw, Math.max(3, w * 0.08)); g.stroke(); g.restore();
  }
  function text(g, s, x, y, o = {}) {
    g.font = font(o.size || L.fs, o.weight || 700, o.serif ? SERIF : SANS);
    g.fillStyle = o.color || '#fbf1dc'; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'middle';
    if (o.max) { let sz = o.size || L.fs; while (sz > 7 && g.measureText(s).width > o.max) { sz -= 0.5; g.font = font(sz, o.weight || 700, o.serif ? SERIF : SANS); } }
    g.fillText(s, x, y);
  }
  function panel(g, r, alpha = 0.32, rad = 12) { rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = `rgba(18,6,4,${alpha})`; g.fill(); }
  function drawCover(g, img, x, y, w, h) {
    const iw = img.width, ih = img.height, s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
    g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  function drawEmblem(g, x, y, s) {
    rr(g, x, y, s, s, s * 0.2);
    const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, '#c0392b'); gr.addColorStop(1, '#6d1510'); g.fillStyle = gr; g.fill();
    g.lineWidth = Math.max(1, s * 0.03); g.strokeStyle = 'rgba(232,196,106,.7)'; g.stroke();
    const cx = x + s / 2, cy = y + s / 2, R0 = s * 0.3;
    g.fillStyle = '#fff3dc'; g.beginPath();
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; const px = cx + Math.cos(a) * R0 * 0.6, py = cy + Math.sin(a) * R0 * 0.6; g.moveTo(px + R0 * 0.45, py); g.arc(px, py, R0 * 0.45, 0, Math.PI * 2); }
    g.fill(); g.beginPath(); g.arc(cx, cy, R0 * 0.28, 0, Math.PI * 2); g.fillStyle = '#e8c46a'; g.fill();
  }
  function chips(p) {
    const pr = R.progress(G.st ? G.st.capt[p] : [], M ? M.opt : settings.opt);
    return pr.filter((x) => x.have > 0).sort((a, b) => b.done - a.done || b.have / b.need - a.have / a.need || b.w - a.w);
  }
  function drawChip(g, c, x, y, h, maxW) {
    const s = c.done ? `${c.name} 成立` : `${c.name} ${Math.min(c.have, c.need)}/${c.need}`;
    g.font = font(h * 0.56, 700);
    const w = Math.min(maxW, g.measureText(s).width + h * 0.8);
    rr(g, x, y, w, h, h / 2);
    g.fillStyle = c.done ? '#e8c46a' : 'rgba(255,255,255,.1)'; g.fill();
    if (!c.done) { g.lineWidth = 1; g.strokeStyle = 'rgba(232,196,106,.35)'; g.stroke(); const pw = (w - 2) * Math.min(1, c.have / c.need); rr(g, x + 1, y + h - 3, pw, 2, 1); g.fillStyle = 'rgba(232,196,106,.7)'; g.fill(); }
    text(g, s, x + w / 2, y + h / 2 + 0.5, { size: h * 0.56, align: 'center', color: c.done ? '#2a1a0c' : '#fbf1dc', max: w - 6 });
    return w;
  }
  function drawInfo(g, p, now) {
    const r = p ? L.cpuInfo : L.plInfo;
    const active = G.active === p;
    panel(g, r, active ? 0.5 : 0.32);
    if (active) glow(g, r.x + 1, r.y + 1, r.w - 2, r.h - 2, `rgba(232,196,106,${0.55 + 0.25 * Math.sin(now / 260)})`, 2, 12);
    const name = p ? M.opp.name : 'あなた';
    const sub = p ? `${M.opp.levelName} ・ ${M.opp.desc.split('。')[0]}` : `${M.months}か月勝負`;
    const total = M.totals[p];
    const cur = G.st ? R.yaku(G.st.capt[p], M.opt).total : 0;
    const badges = [];
    if (M.oya === p && M.month) badges.push(['親', '#c0392b']);
    if (G.st && G.st.koi[p]) badges.push([`こいこい${G.st.koi[p] > 1 ? '×' + G.st.koi[p] : ''}`, '#b8860b']);
    if (active) badges.push(['手番', '#2f7d5b']);
    const ip = L.pad * 0.8, fs = L.fs;
    const drawBadges = (x, y, h, maxX) => {
      for (const [t, c] of badges) {
        g.font = font(h * 0.62, 800); const w = g.measureText(t).width + h * 0.8;
        if (x + w > maxX) break;
        rr(g, x, y, w, h, h / 2); g.fillStyle = c; g.fill(); text(g, t, x + w / 2, y + h / 2 + 0.5, { size: h * 0.62, weight: 800, align: 'center' });
        x += w + 4;
      }
    };
    const portrait = (x, y, s) => {
      if (p) { g.save(); rr(g, x, y, s, s, s * 0.18); g.clip(); const im = GK.images[M.opp.img]; if (im) drawCover(g, im, x, y, s, s); g.restore(); rr(g, x, y, s, s, s * 0.18); g.lineWidth = 1.5; g.strokeStyle = 'rgba(232,196,106,.6)'; g.stroke(); }
      else drawEmblem(g, x, y, s);
    };
    if (L.land) {
      const s = Math.min(r.w * 0.36, r.h * 0.3);
      portrait(r.x + ip, r.y + ip, s);
      const tx = r.x + ip * 2 + s, tw = r.x + r.w - ip - tx;
      text(g, name, tx, r.y + ip + fs * 0.75, { size: fs * 1.35, weight: 800, serif: true, max: tw });
      text(g, sub, tx, r.y + ip + fs * 2.05, { size: fs * 0.72, weight: 500, color: 'rgba(251,241,220,.7)', max: tw });
      drawBadges(tx, r.y + ip + fs * 2.75, fs * 1.25, r.x + r.w - ip);
      let y = r.y + ip + Math.max(s, fs * 4.2) + fs * 0.6;
      text(g, '合計', r.x + ip, y + fs * 0.7, { size: fs * 0.8, color: 'rgba(251,241,220,.7)' });
      text(g, `${total}`, r.x + r.w - ip - fs * 1.2, y + fs * 0.7, { size: fs * 2, weight: 900, serif: true, align: 'right', color: '#ffe6a6' });
      text(g, '点', r.x + r.w - ip, y + fs * 0.95, { size: fs * 0.8, align: 'right' });
      y += fs * 2;
      if (cur) { text(g, `この月の役 ${cur} 点`, r.x + ip, y + fs * 0.4, { size: fs * 0.85, color: '#e8c46a' }); y += fs * 1.3; }
      y += fs * 0.3;
      const ch = fs * 1.45;
      const list = chips(p);
      if (!list.length && y + ch < r.y + r.h - ip) text(g, '役の札はまだありません', r.x + ip, y + ch / 2, { size: fs * 0.78, weight: 500, color: 'rgba(251,241,220,.45)', max: r.w - ip * 2 });
      for (const c of list) { if (y + ch > r.y + r.h - ip) break; drawChip(g, c, r.x + ip, y, ch, r.w - ip * 2); y += ch + 4; }
    } else {
      const s = r.h - 4;
      portrait(r.x + 2, r.y + 2, s);
      const tx = r.x + s + ip + 2;
      if (p) {
        text(g, name, tx, r.y + r.h * 0.3, { size: fs * 1.25, weight: 800, serif: true });
        g.font = font(fs * 1.25, 800, SERIF); const nw = g.measureText(name).width;
        drawBadges(tx + nw + 8, r.y + r.h * 0.3 - fs * 0.6, fs * 1.2, r.x + r.w);
        text(g, `合計 ${total} 点${cur ? `　役 ${cur} 点` : ''}`, tx, r.y + r.h * 0.74, { size: fs * 0.9, color: cur ? '#e8c46a' : 'rgba(251,241,220,.85)', max: r.x + r.w - tx });
      } else {
        text(g, `${name}  ${total}点`, tx, r.y + r.h * 0.5, { size: fs * 1.05, weight: 800, max: r.w - s - ip });
      }
      const cr = p ? L.cpuChips : L.plChips;
      let x = cr.x;
      const ch = Math.min(cr.h - 6, fs * 1.4), cy = cr.y + (cr.h - ch) / 2;
      if (!p) { const bh = ch; for (const [t, c] of badges) { g.font = font(bh * 0.62, 800); const w = g.measureText(t).width + bh * 0.8; rr(g, x, cy, w, bh, bh / 2); g.fillStyle = c; g.fill(); text(g, t, x + w / 2, cy + bh / 2 + 0.5, { size: bh * 0.62, weight: 800, align: 'center' }); x += w + 4; } }
      for (const c of chips(p)) { const ww = drawChip(g, c, x, cy, ch, cr.x + cr.w - x); if (ww < 30) break; x += ww + 4; if (x > cr.x + cr.w - 30) break; }
    }
  }
  function drawCaptPanel(g, p) {
    const cl = captLayout(p), r = cl.r;
    panel(g, r, 0.22);
    const fs = L.fs;
    const pr = G.st ? R.progress(G.st.capt[p], M.opt) : [];
    const kasuN = (pr.find((x) => x.key === 'kasu') || {}).have || 0;
    for (const lb of cl.labels) {
      const n = lb.t === 'kasu' ? kasuN : lb.n;
      if (lb.row) {
        text(g, GROUP_JA[lb.t], lb.x + 8, lb.y + lb.h * 0.38, { size: fs * 0.82, color: 'rgba(251,241,220,.8)' });
        text(g, String(n), lb.x + 8, lb.y + lb.h * 0.7, { size: fs * 0.95, weight: 900, color: n ? '#ffe6a6' : 'rgba(251,241,220,.35)' });
        if (!lb.n) { rr(g, lb.cx, lb.cy, lb.cw, lb.ch, 3); g.setLineDash([3, 3]); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; g.stroke(); g.setLineDash([]); }
      } else {
        text(g, `${GROUP_JA[lb.t]} ${n}`, lb.x + 4, lb.y + (lb.cy - lb.y) / 2 + 1, { size: Math.min(fs * 0.8, (lb.cy - lb.y) * 0.8), color: n ? '#ffe6a6' : 'rgba(251,241,220,.55)' });
        if (!lb.n) { rr(g, lb.x + 2, lb.cy, lb.cw, lb.ch, 3); g.setLineDash([3, 3]); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; g.stroke(); g.setLineDash([]); }
      }
    }
    if (r.w / r.h <= 2.6) text(g, p ? `${M.opp.name}の取り札` : 'あなたの取り札', r.x + 8, r.y + fs * 0.9, { size: fs * 0.85, color: 'rgba(232,196,106,.9)' });
  }

  function draw(now) {
    const g = view.ctx;
    view.clear();
    const W = L.W, H = L.H;
    const bg = GK.images['bg-table'];
    const base = g.createLinearGradient(0, 0, 0, H); base.addColorStop(0, '#7a1c15'); base.addColorStop(1, '#5a120d'); g.fillStyle = base; g.fillRect(0, 0, W, H);
    if (bg) { g.globalAlpha = 0.5; drawCover(g, bg, 0, 0, W, H); g.globalAlpha = 1; }
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(60,8,6,.25)'); vg.addColorStop(1, 'rgba(20,4,3,.72)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (!placed) return;
    if (M) {
      drawInfo(g, 1, now); drawInfo(g, 0, now);
      drawCaptPanel(g, 1); drawCaptPanel(g, 0);
      const fg = fieldGrid(fieldCap()), dk = fg.deck;
      const left = G.st ? G.st.deck.length : 48;
      text(g, `山 ${left}`, dk.x + dk.w / 2, dk.y + dk.w * 1.6 + L.fs * 0.9, { size: L.fs * 0.8, align: 'center', color: 'rgba(251,241,220,.75)' });
      if (M.month) text(g, `${M.month} / ${M.months}か月`, dk.x + dk.w / 2, dk.y - L.fs * 0.9, { size: L.fs * 0.8, align: 'center', color: 'rgba(232,196,106,.9)' });
    }
    // cards
    const T = targets();
    const order = ALL.slice().sort((a, b) => SP[a].z - SP[b].z);
    const prev = G.mode === 'hand' ? G.sel || G.hover : null;
    const prevMatches = prev && G.st ? R.matchesOf(prev, G.st.field) : [];
    const handSet = new Set(G.st ? G.st.hands[0] : []);
    const pulse = 0.6 + 0.4 * Math.sin(now / 180);
    for (const id of order) {
      const s = SP[id], c = R.card(id), w = s.w, h = w * 1.6;
      if (s.x < -150) continue;
      const sx = Math.abs(Math.cos(s.f * Math.PI));
      g.save();
      g.translate(s.x + w / 2, s.y + h / 2);
      if (s.rot) g.rotate(s.rot);
      g.scale(Math.max(0.02, sx), 1);
      rr(g, -w / 2 + w * 0.03, -h / 2 + w * 0.06, w, h, w * 0.07); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
      if (s.f > 0.5) drawFace(g, c, -w / 2, -h / 2, w, h); else drawBack(g, -w / 2, -h / 2, w, h);
      if (s.f > 0.5) {
        const isTarget = (G.mode === 'pick' || (G.mode === 'hand' && G.targets.length)) && G.targets.includes(id);
        if (isTarget) glow(g, -w / 2, -h / 2, w, h, `rgba(255,215,106,${pulse})`, G.kbd && G.targets[G.tsel] === id ? 5 : 3, 18);
        else if (prevMatches.includes(id)) glow(g, -w / 2, -h / 2, w, h, `rgba(255,215,106,${0.5 + 0.5 * pulse})`, 3, 16);
        if (G.mode === 'hand' && handSet.has(id)) {
          if (id === prev) glow(g, -w / 2, -h / 2, w, h, 'rgba(255,250,235,.95)', 2.5, 10);
          if (R.matchesOf(id, G.st.field).length) { g.beginPath(); g.arc(0, -h / 2 - w * 0.02, Math.max(3, w * 0.07), 0, Math.PI * 2); g.fillStyle = '#ffd76a'; g.shadowColor = '#ffd76a'; g.shadowBlur = 8; g.fill(); g.shadowBlur = 0; }
        }
      }
      g.restore();
      const o = G.over[id];
      if (o && o.where === 'oya' && o.face) text(g, o.p === 0 ? 'あなた' : M.opp.name, s.x + w / 2, s.y + h + L.fs * 1.1, { size: L.fs * 1.05, align: 'center', weight: 800 });
    }
    // particles
    for (let i = G.fx.length - 1; i >= 0; i--) {
      const p = G.fx[i]; const t = (now - p.t0) / p.life;
      if (t >= 1) { G.fx.splice(i, 1); continue; }
      const x = p.x + p.vx * t * 60, y = p.y + p.vy * t * 60 + 30 * t * t;
      g.globalAlpha = 1 - t; g.fillStyle = p.c;
      g.beginPath(); g.arc(x, y, p.r * (1 - t * 0.5), 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
    // hint
    if (G.hint && M) {
      const r = L.mid, fs = L.fs * 0.92;
      g.font = font(fs, 700); const tw = g.measureText(G.hint).width + fs * 2;
      const x = r.x + r.w / 2, y = r.y + r.h - fs * 0.95;
      rr(g, x - tw / 2, y - fs * 0.85, tw, fs * 1.7, fs * 0.85); g.fillStyle = 'rgba(18,6,4,.62)'; g.fill();
      text(g, G.hint, x, y + 0.5, { size: fs, align: 'center', color: '#fff3d6' });
    }
    // speech bubble
    if (G.bubble && M) {
      const b = G.bubble, t = (now - b.t0) / b.dur;
      if (t >= 1) G.bubble = null;
      else {
        const a = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1;
        const r = L.cpuInfo, fs = L.fs * 0.95;
        g.font = font(fs, 700); const tw = Math.min(g.measureText(b.text).width + fs * 1.6, L.W - 20);
        let x, y;
        if (L.land) { x = r.x + r.w + 10; y = r.y + 6; x = Math.min(x, L.W - tw - 10); }
        else { x = r.x + r.h + 6; y = r.y + r.h + 4; }
        const bh = fs * 2;
        g.globalAlpha = a;
        rr(g, x, y, tw, bh, bh / 2); g.fillStyle = '#fff8ea'; g.fill();
        g.beginPath(); if (L.land) { g.moveTo(x + 2, y + bh * 0.35); g.lineTo(x - 9, y + bh * 0.5); g.lineTo(x + 6, y + bh * 0.7); } else { g.moveTo(x + 12, y + 1); g.lineTo(x + 8, y - 8); g.lineTo(x + 24, y + 1); } g.fill();
        text(g, b.text, x + tw / 2, y + bh / 2 + 0.5, { size: fs, align: 'center', color: '#3a1d12', max: tw - fs });
        g.globalAlpha = 1;
      }
    }
    // banner
    if (G.banner) {
      const b = G.banner, t = (now - b.t0) / b.dur;
      if (t >= 1) G.banner = null;
      else {
        const a = t < 0.12 ? t / 0.12 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const r = L.mid, cy = r.y + r.h * 0.45, bh = L.fs * (b.sub ? 4.8 : 3.6);
        g.globalAlpha = a;
        const gr = g.createLinearGradient(0, 0, W, 0);
        gr.addColorStop(0, 'rgba(20,6,4,0)'); gr.addColorStop(0.2, 'rgba(20,6,4,.82)'); gr.addColorStop(0.8, 'rgba(20,6,4,.82)'); gr.addColorStop(1, 'rgba(20,6,4,0)');
        g.fillStyle = gr; g.fillRect(0, cy - bh / 2, W, bh);
        g.fillStyle = 'rgba(232,196,106,.6)'; g.fillRect(W * 0.15, cy - bh / 2, W * 0.7, 1); g.fillRect(W * 0.15, cy + bh / 2 - 1, W * 0.7, 1);
        const sc = 1 + 0.15 * Math.max(0, 1 - t * 6);
        g.save(); g.translate(W / 2, cy - (b.sub ? L.fs * 0.6 : 0)); g.scale(sc, sc);
        text(g, b.text, 0, 0, { size: L.fs * 2.1, weight: 900, serif: true, align: 'center', color: '#ffe6a6' });
        g.restore();
        if (b.sub) text(g, b.sub, W / 2, cy + L.fs * 1.4, { size: L.fs * 0.9, align: 'center', color: 'rgba(251,241,220,.85)' });
        g.globalAlpha = 1;
      }
    }
  }

  function burst(id, gold) {
    const s = SP[id]; if (!s) return;
    const now = performance.now(), n = gold ? 22 : 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.6 + Math.random() * (gold ? 2.6 : 1.4);
      G.fx.push({ x: s.x + s.w / 2, y: s.y + s.w * 0.8, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, r: 1.5 + Math.random() * (gold ? 3 : 2), c: gold ? (i % 2 ? '#ffe08a' : '#fff6d8') : 'rgba(255,240,210,.85)', t0: now, life: 600 + Math.random() * 500 });
    }
  }

  GK.loop((dt) => {
    const T = targets();
    const k = G.snap ? 1 : 1 - Math.exp(-dt * 13);
    for (const id of ALL) {
      const s = SP[id], t = T[id];
      if (!t) continue;
      if (!placed) { s.x = t.x; s.y = t.y; s.w = t.w; s.f = t.face; }
      s.x += (t.x - s.x) * k; s.y += (t.y - s.y) * k; s.w += (t.w - s.w) * k;
      s.rot += ((t.rot || 0) - s.rot) * k;
      const df = t.face - s.f, step = G.snap ? 1 : dt * 3.6;
      s.f = Math.abs(df) <= step ? t.face : s.f + Math.sign(df) * step;
      const moving = Math.abs(t.x - s.x) + Math.abs(t.y - s.y) > 3;
      s.z = t.z + (moving ? 1000 : 0);
    }
    placed = true;
    draw(performance.now());
  });

  /* ---------------- input ---------------- */
  function hitCard(p) {
    if (!G.st) return null;
    const cand = [];
    const hand = G.st.hands[0];
    for (const id of hand) cand.push([id, 'hand']);
    for (const id of G.st.field) if (id) cand.push([id, 'field']);
    cand.sort((a, b) => SP[b[0]].z - SP[a[0]].z);
    for (const [id, kind] of cand) {
      const s = SP[id], h = s.w * 1.6;
      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + h + (kind === 'hand' ? h * 0.12 : 0)) return { id, kind };
    }
    return null;
  }
  const overlayOpen = () => !$('#yakuOv').hidden || !$('#monthOv').hidden || !$('#finalOv').hidden || !!document.querySelector('.gk-modal-back');
  function finishHuman(v) { const w = G.waiter; if (!w) return; G.waiter = null; G.mode = null; G.sel = null; G.targets = []; G.hover = null; w.res(v); }
  function tryPlay(id) {
    const ms = R.matchesOf(id, G.st.field);
    if (ms.length === 2) { G.sel = id; G.targets = ms; G.tsel = 0; G.hint = '取る札を選んでください（光っている 2 枚のどちらか）'; GK.sfx('select'); return; }
    finishHuman({ card: id, target: ms[0] || null });
  }
  let downHit = null;
  GK.pointer(canvas, view, {
    down(p) { downHit = overlayOpen() ? null : hitCard(p); },
    move(p, e) {
      if (e.pointerType !== 'mouse' || !G.st) return;
      const h = overlayOpen() ? null : hitCard(p);
      const hv = h && h.kind === 'hand' && G.mode === 'hand' && !G.targets.length ? h.id : null;
      if (hv !== G.hover) { G.hover = hv; G.kbd = false; }
      const clickable = h && ((G.mode === 'hand' && (h.kind === 'hand' || G.targets.includes(h.id) || (G.sel && R.matchesOf(G.sel, G.st.field).includes(h.id)))) || (G.mode === 'pick' && G.targets.includes(h.id)));
      canvas.style.cursor = clickable ? 'pointer' : 'default';
    },
    up(p, e) {
      if (overlayOpen() || !G.mode) return;
      const h = hitCard(p);
      if (!h || !downHit || h.id !== downHit.id) { if (!h && G.mode === 'hand' && !G.targets.length) G.sel = null; return; }
      G.kbd = false;
      onTap(h, e.pointerType);
    },
  });
  function onTap(h, ptype) {
    if (G.mode === 'hand') {
      if (h.kind === 'hand') {
        if (G.targets.length && G.sel !== h.id) { G.targets = []; G.hint = '手札から出す札を選んでください'; }
        if (G.sel === h.id && G.targets.length) return;
        if (G.sel === h.id || ptype === 'mouse') tryPlay(h.id);
        else { G.sel = h.id; GK.sfx('click'); }
      } else if (G.sel && R.matchesOf(G.sel, G.st.field).includes(h.id)) finishHuman({ card: G.sel, target: h.id });
    } else if (G.mode === 'pick' && G.targets.includes(h.id)) finishHuman(h.id);
  }
  addEventListener('keydown', (e) => {
    if (overlayOpen() || !G.mode || !G.st) return;
    const k = e.key;
    const choose = () => { if (k === 'ArrowLeft' || k === 'ArrowUp') { G.tsel = (G.tsel + 1) % 2; return true; } if (k === 'ArrowRight' || k === 'ArrowDown') { G.tsel = (G.tsel + 1) % 2; return true; } return false; };
    G.kbd = true;
    if (G.mode === 'pick') {
      if (choose()) { GK.sfx('click'); e.preventDefault(); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); finishHuman(G.targets[G.tsel]); }
      return;
    }
    const hand = displayHand();
    if (G.targets.length) {
      if (choose()) { GK.sfx('click'); e.preventDefault(); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); finishHuman({ card: G.sel, target: G.targets[G.tsel] }); }
      else if (k === 'Escape' || k === 'Backspace') { G.targets = []; G.hint = '手札から出す札を選んでください'; }
      return;
    }
    const i = hand.indexOf(G.sel);
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); const d = k === 'ArrowLeft' ? -1 : 1; G.sel = hand[i < 0 ? 0 : (i + d + hand.length) % hand.length]; GK.sfx('tick'); }
    else if (/^[1-8]$/.test(k) && hand[+k - 1]) { G.sel = hand[+k - 1]; GK.sfx('tick'); }
    else if ((k === 'Enter' || k === ' ') && G.sel) { e.preventDefault(); tryPlay(G.sel); }
  });

  /* ---------------- sound ---------------- */
  GK.sfx.define('fuda', () => { GK.noise({ d: 0.05, v: 0.5, f: 2300, q: 1.4 }); GK.tone({ f: 210, f2: 90, d: 0.09, type: 'sine', v: 0.35 }); });
  GK.sfx.define('flip', () => GK.noise({ d: 0.07, v: 0.22, f: 4200, filter: 'highpass' }));
  GK.sfx.define('kira', () => [1568, 2093, 2637, 3136].forEach((f, i) => GK.tone({ f, d: 0.32, type: 'sine', v: 0.07, at: i * 0.055 })));
  GK.sfx.define('yaku', () => {
    for (let i = 0; i < 7; i++) GK.tone({ f: GK.scaleFreq('D5', 'yo', i), d: 0.4, type: 'triangle', v: 0.15, at: i * 0.065 });
    GK.tone({ f: 120, f2: 55, d: 0.45, type: 'sine', v: 0.55 });
  });
  GK.sfx.define('koi', () => { [0, 0.15, 0.42].forEach((at) => GK.tone({ f: 130, f2: 58, d: 0.3, type: 'sine', v: 0.6, at })); [0, 2, 4].forEach((s, i) => GK.tone({ f: GK.scaleFreq('A4', 'yo', s), d: 0.25, type: 'square', v: 0.06, at: 0.42 + i * 0.07 })); });
  GK.sfx.define('shobu', () => { GK.tone({ f: 110, f2: 50, d: 0.6, type: 'sine', v: 0.7 }); GK.noise({ d: 0.3, v: 0.35, f: 700, filter: 'lowpass' }); [0, 2, 4, 5].forEach((s, i) => GK.tone({ f: GK.scaleFreq('D4', 'yo', s + 2), d: 0.6, type: 'triangle', v: 0.12, at: 0.1 + i * 0.03 })); });
  const SONG_TITLE = {
    bpm: 66, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.12, notes: 'E5 - - - C5 . B4 - | A4 - - - F4 - - - | E4 - F4 - A4 - B4 C5 | B4 - - - - - - - | A4 - B4 - C5 - E5 - | C5 - B4 - A4 - F4 - | E4 - - - F4 - A4 - | E4 - - - - - - -' },
      { type: 'triangle', v: 0.07, notes: 'E3 . B3 . E4 . B3 . | A2 . E3 . A3 . E3 . | F3 . C4 . F4 . C4 . | E3 . B3 . E4 . B3 . | A2 . E3 . A3 . C4 . | F3 . C4 . F4 . C4 . | E3 . B3 . A3 . F3 . | E3 . B3 . E4 - - -' },
      { type: 'sine', v: 0.1, notes: 'E2 - - - - - - - | A1 - - - - - - - | F2 - - - - - - - | E2 - - - - - - - | A1 - - - - - - - | F2 - - - - - - - | E2 - - - - - - - | E2 - - - - - - -' },
    ],
    drums: { t: 'x . . . . . . . | . . . . . . . . | x . . . . . . . | . . . . x . . .' },
  };
  const SONG_GAME = {
    bpm: 84, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.11, notes: 'A4 - B4 A4 G4 - E4 - | D4 - E4 G4 A4 - - - | B4 - D5 B4 A4 - G4 A4 | E4 - - - . . . . | G4 - A4 B4 D5 - E5 D5 | B4 - A4 - G4 - A4 - | B4 A4 G4 E4 D4 - E4 G4 | D4 - - - . . . .' },
      { type: 'triangle', v: 0.06, notes: 'D3 . A3 . D4 . A3 . | G3 . D4 . G3 . D4 . | E3 . B3 . E4 . B3 . | A3 . E4 . A3 . E4 . | D3 . A3 . D4 . A3 . | G3 . D4 . B3 . D4 . | E3 . B3 . G3 . B3 . | D3 . A3 . D4 - - -' },
      { type: 'sine', v: 0.1, notes: 'D2 - - - - - - - | G2 - - - - - - - | E2 - - - - - - - | A2 - - - - - - - | D2 - - - - - - - | G2 - - - - - - - | E2 - - - - - - - | D2 - - - - - - -' },
    ],
    drums: { t: 'x . . . . . x . | . . . . x . . . | x . . . . . x . | . . x . x . . .' },
  };
  let songNow = null;
  const music = (s) => { if (songNow === s && GK.music.playing) return; songNow = s; GK.music.play(s); };
  const firstGesture = () => { removeEventListener('pointerdown', firstGesture, true); removeEventListener('keydown', firstGesture, true); if (!GK.music.playing) music($('#title').classList.contains('off') ? SONG_GAME : SONG_TITLE); };
  addEventListener('pointerdown', firstGesture, true);
  addEventListener('keydown', firstGesture, true);

  /* ---------------- overlays ---------------- */
  const mini = (id) => { const c = R.card(id); return `<span class="mini" style="--c:${R.MONTHS[c.m].color}"><img src="img/${c.img}.webp" alt=""><i>${c.m}</i></span>`; };
  const yakuExplain = (y) => {
    if (y.key === 'tane' || y.key === 'tan' || y.key === 'kasu') return `${y.cards.length} 枚`;
    if (y.extra > 0) return `+${y.extra}`;
    return '';
  };
  function fillYaku(ol, list) {
    ol.innerHTML = '';
    list.forEach((y, i) => {
      const li = document.createElement('li');
      li.style.animationDelay = `${0.08 + i * 0.13}s`;
      const counting = ['tane', 'tan', 'kasu'].includes(y.key);
      const show = y.cards ? (counting ? [] : y.cards.slice(0, 7)) : [];
      li.innerHTML = `<span class="nm">${y.name}</span><span class="ex">${yakuExplain(y)}</span><span class="minis">${show.map(mini).join('')}</span><span class="pt">${y.pts}点</span>`;
      ol.appendChild(li);
    });
  }
  function showYaku({ who, list, total, note, choice, canKoi, stamp }) {
    const ov = $('#yakuOv');
    $('#yWho').textContent = who;
    fillYaku($('#yList'), list);
    $('#yTotal').textContent = total;
    $('#yNote').textContent = note || '';
    $('#yActions').style.display = choice ? '' : 'none';
    $('#btnKoi').disabled = !canKoi;
    const st = $('#yStamp'); st.textContent = stamp || ''; st.classList.remove('pop');
    ov.hidden = false;
    if (choice) setTimeout(() => $('#btnShobu').focus({ preventScroll: true }), 60);
  }
  const hideYaku = () => { $('#yakuOv').hidden = true; };
  function stampYaku(text) { const st = $('#yStamp'); st.textContent = text; st.classList.remove('pop'); void st.offsetWidth; st.classList.add('pop'); }
  function askKoikoi(y, tk) {
    const st = G.st, oppKoi = st.koi[1] > 0, canKoi = st.hands[0].length > 0;
    const s = R.settle(y.total, M.opt, oppKoi);
    let note = `いま勝負すると <b>${s.pts} 点</b>${s.mult.length ? `（${s.mult.join('・')}）` : ''}。`;
    note = note.replace(/<\/?b>/g, '');
    if (!canKoi) note += ' 手札がないので、ここで勝負です。';
    else if (oppKoi) note += ` ${M.opp.name}はこいこい中です。`;
    showYaku({ who: 'あなたの役', list: y.list, total: y.total, note, choice: true, canKoi });
    GK.sfx('yaku');
    return new Promise((res, rej) => {
      const done = (v) => { removeEventListener('keydown', onKey, true); $('#btnKoi').onclick = $('#btnShobu').onclick = null; G.ovWaiter = null; res(v); };
      const onKey = (e) => { if (e.key === 'k' || e.key === 'K') { if (canKoi) { e.preventDefault(); done(true); } } else if (e.key === 's' || e.key === 'S') { e.preventDefault(); done(false); } };
      addEventListener('keydown', onKey, true);
      $('#btnKoi').onclick = () => done(true);
      $('#btnShobu').onclick = () => done(false);
      G.ovWaiter = { rej: (x) => { removeEventListener('keydown', onKey, true); rej(x); }, tk };
    });
  }

  const scoreTable = (el, curIdx) => {
    const n = M.months;
    const cell = (p, i) => { const v = M.pts[p][i]; if (v == null) return '<td>・</td>'; return `<td class="${v > 0 ? 'win' : ''}${i === curIdx ? ' cur' : ''}">${v}</td>`; };
    el.innerHTML = `<tr><th>月</th>${Array.from({ length: n }, (_, i) => `<th>${i + 1}</th>`).join('')}<th>計</th></tr>`
      + `<tr><td class="nm">あなた</td>${Array.from({ length: n }, (_, i) => cell(0, i)).join('')}<td class="tot">${M.totals[0]}</td></tr>`
      + `<tr><td class="nm">${M.opp.name}</td>${Array.from({ length: n }, (_, i) => cell(1, i)).join('')}<td class="tot">${M.totals[1]}</td></tr>`;
  };
  function showMonth(res, tk) {
    const w = res ? res.winner : -1;
    $('#mKicker').textContent = `${M.month}か月目の結果`;
    const t = $('#mTitle');
    t.textContent = w === 0 ? 'あなたの上がり' : w === 1 ? `${M.opp.name}の上がり` : '流局';
    let body = '';
    if (res && res.list) {
      body += '<ol class="yaku-list" id="mYaku"></ol>';
      const mult = res.mult && res.mult.length ? ` × ${2 ** res.mult.length}（${res.mult.join('・')}）` : '';
      body += `<p class="res-line">役 ${res.base} 点${mult} ＝ <b>${res.pts} 点</b></p>`;
    } else body += `<p class="res-line">${res && res.reason ? res.reason : '両者の手札がなくなりました。この月は 0 点です。'}</p>`;
    if (M.month < M.months) body += `<p class="res-line">次の月の親：${M.oya === 0 ? 'あなた' : M.opp.name}</p>`;
    $('#mBody').innerHTML = body;
    if (res && res.list) fillYaku($('#mYaku'), res.list);
    scoreTable($('#mTable'), M.month - 1);
    const last = M.month >= M.months;
    $('#btnNext').textContent = last ? '最終結果へ' : '次の月へ';
    $('#monthOv').hidden = false;
    setTimeout(() => $('#btnNext').focus({ preventScroll: true }), 60);
    return new Promise((res2, rej) => {
      $('#btnNext').onclick = () => { GK.sfx('click'); $('#btnNext').onclick = null; G.ovWaiter = null; $('#monthOv').hidden = true; res2(); };
      G.ovWaiter = { rej, tk };
    });
  }

  /* ---------------- flow ---------------- */
  function humanHand(tk) {
    G.mode = 'hand'; G.sel = null; G.targets = []; G.hint = GK.isTouch ? '手札をタップで選び、もう一度タップで出します' : '手札から出す札を選んでください';
    return new Promise((res, rej) => { G.waiter = { res, rej, tk }; });
  }
  function humanPick(ms, tk) {
    G.mode = 'pick'; G.targets = ms; G.tsel = 0; G.hint = 'めくった札で取る札を選んでください';
    return new Promise((res, rej) => { G.waiter = { res, rej, tk }; });
  }
  async function playOut(p, id, target, fromHand, tk) {
    const st = G.st;
    if (fromHand) R.takeFromHand(st, p, id);
    const took = R.takes(st, id, target);
    if (took.length) {
      G.over[id] = { where: 'onto', anchor: took[0] };
      await wait(fromHand ? 300 : 260, tk);
      GK.sfx('fuda');
      await wait(260, tk);
      R.resolve(st, p, id, target);
      delete G.over[id];
      const shine = [id].concat(took).some((x) => R.card(x).type === 'hikari');
      [id].concat(took).forEach((x) => burst(x, R.card(x).type === 'hikari'));
      if (shine) GK.sfx('kira'); else GK.sfx('card');
      if (p === 0 && shine && Math.random() < 0.6) say('nice', 1800);
      await wait(took.length === 3 ? 520 : 380, tk);
    } else {
      delete G.over[id];
      R.resolve(st, p, id, null);
      await wait(200, tk);
      GK.sfx('fuda');
      await wait(220, tk);
    }
  }
  async function turn(p, tk) {
    const st = G.st;
    G.active = p;
    let ch;
    if (p === 0 && !G.auto) ch = await humanHand(tk);
    else {
      if (p === 1) G.hint = `${M.opp.name}が考えています…`;
      await wait(p === 1 ? 700 : 160, tk);
      ch = R.aiChooseHand(st, p, level(p), rng);
      if (!ch.target) ch.target = R.aiChooseTarget(st, p, ch.card, level(p), rng);
    }
    G.hint = '';
    await playOut(p, ch.card, ch.target, true, tk);
    const d = R.drawTop(st);
    G.over[d] = { where: 'reveal' };
    GK.sfx('flip');
    await wait(560, tk);
    let target = null;
    const ms = R.matchesOf(d, st.field);
    if (ms.length === 2) {
      if (p === 0 && !G.auto) target = await humanPick(ms, tk);
      else { await wait(260, tk); target = R.aiChooseTarget(st, p, d, level(p), rng); }
      G.hint = '';
    }
    await playOut(p, d, target, false, tk);
    // 役
    const y = R.yaku(st.capt[p], M.opt);
    if (y.total > st.shown[p]) {
      st.shown[p] = y.total;
      let koi;
      if (p === 0 && !G.auto) {
        koi = await askKoikoi(y, tk);
        hideYaku();
      } else {
        koi = R.aiKoikoi(st, p, level(p), rng);
        if (p === 0 && st.hands[0].length === 0) koi = false;
        showYaku({ who: p === 1 ? `${M.opp.name}の役` : 'あなたの役', list: y.list, total: y.total, choice: false });
        GK.sfx('yaku');
        await wait(1300, tk);
        stampYaku(koi ? 'こいこい！' : '勝負！');
        GK.sfx(koi ? 'koi' : 'shobu');
        if (p === 1) say(koi ? 'koi' : 'shobu', 2000);
        await wait(1200, tk);
        hideYaku();
      }
      if (!koi) {
        if (p === 0) GK.sfx('shobu');
        const s = R.settle(y.total, M.opt, st.koi[1 - p] > 0);
        return { winner: p, base: y.total, pts: s.pts, mult: s.mult, list: y.list };
      }
      st.koi[p]++;
      if (p === 0) GK.sfx('koi');
      banner('こいこい！', p === 0 ? 'さらに役を狙います' : `${M.opp.name}が勝負を続けます`, 1300);
      await wait(900, tk);
    }
    return null;
  }

  async function deal(tk) {
    const st = R.deal(rng, M.opt);
    G.st = st; G.dealt = new Set(); G.over = {}; G.active = -1; G.reveal = false;
    banner(`${M.month}か月目`, M.oya === 0 ? 'あなたが親（先手）です' : `${M.opp.name}が親（先手）です`, 1500);
    await wait(600, tk);
    const a = st.hands[M.oya], b = st.hands[1 - M.oya];
    for (let i = 0; i < 8; i += 2) {
      for (const id of [a[i], a[i + 1], b[i], b[i + 1], st.field[i], st.field[i + 1]]) { G.dealt.add(id); }
      GK.sfx('card');
      await wait(170, tk);
    }
    G.dealt = null;
    await wait(450, tk);
    if (st.redeals) GK.toast('場に同じ月の札が 4 枚そろったので、配り直しました');
    return st;
  }

  async function playMonth(tk) {
    const st = await deal(tk);
    let res = null;
    if (M.opt.teyaku) {
      const t = [R.teyaku(st.hands[0]), R.teyaku(st.hands[1])];
      if (t[0] || t[1]) {
        G.reveal = true;
        await wait(700, tk);
        if (t[0] && t[1]) res = { winner: -1, reason: '両者に手役があったため、この月は流局です。' };
        else {
          const p = t[0] ? 0 : 1, ty = t[p];
          const by = {}; st.hands[p].forEach((id) => { const m = R.card(id).m; (by[m] = by[m] || []).push(id); });
          const cards = ty.key === 'teshi' ? Object.values(by).find((x) => x.length === 4) : st.hands[p].slice().sort();
          const list = [{ key: ty.key, name: ty.name, pts: ty.pts, cards }];
          showYaku({ who: p ? `${M.opp.name}の手役` : 'あなたの手役', list, total: ty.pts, note: '配られた手札で役ができました。', choice: false, stamp: '' });
          GK.sfx('yaku');
          await wait(1800, tk);
          hideYaku();
          res = { winner: p, base: ty.pts, pts: ty.pts, mult: [], list };
        }
      }
    }
    if (!res) {
      let p = M.oya;
      while (st.hands[0].length || st.hands[1].length) {
        if (st.hands[p].length) { res = await turn(p, tk); if (res) break; }
        p = 1 - p;
      }
    }
    G.active = -1; G.mode = null; G.hint = '';
    await endMonth(res, tk);
  }

  async function endMonth(res, tk) {
    const w = res ? res.winner : -1, pts = res && w >= 0 ? res.pts : 0;
    M.pts[0].push(w === 0 ? pts : 0); M.pts[1].push(w === 1 ? pts : 0);
    M.totals = [0, 1].map((p) => M.pts[p].reduce((s, v) => s + v, 0));
    if (w >= 0) M.oya = w;
    if (w === 0) { GK.sfx('win'); say('ouch', 2400); const rec = records(); if (pts > (rec.bestMonth || 0)) { rec.bestMonth = pts; GK.store.set('records', rec); } }
    else if (w === 1) GK.sfx('lose');
    else GK.sfx('ng');
    await wait(500, tk);
    await showMonth(res, tk);
    G.reveal = false;
    G.st = null; G.over = {};
    await wait(450, tk);
  }

  async function decideOya(tk) {
    G.st = null; G.over = {};
    await wait(500, tk);
    const ids = R.shuffle(ALL.slice(), rng), a = ids[0], b = ids[1];
    G.over[a] = { where: 'oya', p: 0, face: 0 }; G.over[b] = { where: 'oya', p: 1, face: 0 };
    G.hint = '親を決めます（早い月の札を引いたほうが親）';
    GK.sfx('card');
    await wait(800, tk);
    G.over[a].face = 1; G.over[b].face = 1; GK.sfx('flip');
    await wait(700, tk);
    M.oya = R.oyaCompare(a, b) <= 0 ? 0 : 1;
    banner(M.oya === 0 ? 'あなたが親です' : `${M.opp.name}が親です`, `${R.card(a).m}月の札 と ${R.card(b).m}月の札`, 1700);
    GK.sfx('select');
    await wait(1700, tk);
    G.over = {}; G.hint = '';
    await wait(350, tk);
  }

  async function startMatch() {
    const tk = ++token;
    rejectWaiters();
    const opp = OPPS[settings.opp];
    M = { opp, months: settings.months, opt: Object.assign({}, settings.opt), month: 0, pts: [[], []], totals: [0, 0], oya: 0 };
    G.st = null; G.over = {}; G.mode = null; G.active = -1; G.hint = ''; G.bubble = null;
    $('#title').classList.add('off');
    $('#finalOv').hidden = true;
    music(SONG_GAME);
    try {
      say('start', 2400);
      await decideOya(tk);
      for (let m = 1; m <= M.months; m++) { M.month = m; await playMonth(tk); }
      await finishMatch(tk);
    } catch (e) {
      if (e !== ABORT) throw e;
    }
  }

  function finishMatch() {
    const [a, b] = M.totals;
    const result = a > b ? 'win' : a < b ? 'lose' : 'draw';
    const rec = records();
    const r = rec[M.opp.id] || { w: 0, l: 0, d: 0, best: 0 };
    r[result === 'win' ? 'w' : result === 'lose' ? 'l' : 'd']++;
    const newBest = a > (r.best || 0);
    if (newBest) r.best = a;
    rec[M.opp.id] = r; rec.played = (rec.played || 0) + 1;
    GK.store.set('records', rec);
    $('#fKicker').textContent = `${M.months}か月勝負 ・ ${M.opp.name}（${M.opp.levelName}）`;
    const t = $('#fTitle');
    t.textContent = result === 'win' ? '勝ち' : result === 'lose' ? '負け' : '引き分け';
    t.className = result;
    $('#fPts').innerHTML = `あなた <b>${a}</b> 点 ・ ${M.opp.name} <b>${b}</b> 点`;
    scoreTable($('#fTable'), -1);
    $('#fRec').innerHTML = `${M.opp.name}との戦績：${r.w}勝 ${r.l}敗${r.d ? ` ${r.d}分` : ''} ・ 最高 ${r.best} 点${newBest && a > 0 ? '<span class="new">最高得点を更新</span>' : ''}`;
    $('#finalOv').hidden = false;
    G.bubble = null;
    say(result === 'win' ? 'lose' : 'win', 3000);
    GK.sfx(result === 'win' ? 'win' : result === 'lose' ? 'lose' : 'ok');
    setTimeout(() => $('#btnAgain').focus({ preventScroll: true }), 60);
    renderTitle();
  }

  function rejectWaiters() {
    if (G.waiter) { const w = G.waiter; G.waiter = null; w.rej(ABORT); }
    if (G.ovWaiter) { const w = G.ovWaiter; G.ovWaiter = null; w.rej(ABORT); }
    G.mode = null; G.sel = null; G.targets = [];
  }
  function toTitle() {
    token++;
    rejectWaiters();
    ['#yakuOv', '#monthOv', '#finalOv'].forEach((s) => { $(s).hidden = true; });
    G.st = null; G.over = {}; G.hint = ''; G.active = -1; G.bubble = null; G.banner = null; G.reveal = false;
    renderTitle();
    $('#title').classList.remove('off');
    music(SONG_TITLE);
    setTimeout(() => $('#btnStart').focus({ preventScroll: true }), 50);
  }

  /* ---------------- title ---------------- */
  function renderTitle() {
    const rec = records();
    const opps = $('#opps');
    opps.innerHTML = '';
    OPPS.forEach((o, i) => {
      const r = rec[o.id];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opp'; b.dataset.i = i;
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(settings.opp === i));
      b.innerHTML = `<img src="img/${o.img}.webp" alt=""><span class="on"><b>${o.name}</b><span class="lv" style="--c:${o.color}">${o.levelName}</span><small class="desc">${o.desc}</small><span class="wr">${r ? `${r.w}勝 ${r.l}敗${r.d ? ` ${r.d}分` : ''}` : '未対戦'}</span></span>`;
      b.onclick = () => { settings.opp = i; saveSettings(); GK.sfx('select'); renderTitle(); };
      opps.appendChild(b);
    });
    const seg = $('#months');
    seg.innerHTML = '';
    MONTH_CHOICES.forEach((m) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = `${m}か月`; b.dataset.m = m;
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(settings.months === m));
      b.onclick = () => { settings.months = m; saveSettings(); GK.sfx('select'); renderTitle(); };
      seg.appendChild(b);
    });
    const ruleOn = RULES.filter((r) => settings.opt[r.key]).length;
    $('#btnRules').textContent = `ルール設定（${ruleOn}/${RULES.length}）`;
    const played = rec.played || 0;
    $('#recLine').textContent = played ? `これまでの対局 ${played} 回 ・ 1 か月の最高 ${rec.bestMonth || 0} 点` : '最初の親は札を引いて決めます。遊び方は右上の ? から。';
  }
  function openRules() {
    const form = document.createElement('div');
    form.className = 'rules-form';
    RULES.forEach((r) => {
      const l = document.createElement('label');
      l.innerHTML = `<input type="checkbox" ${settings.opt[r.key] ? 'checked' : ''} data-k="${r.key}"><div><b>${r.name}</b><span>${r.desc}</span></div>`;
      form.appendChild(l);
    });
    GK.modal({ title: 'ルール設定', body: form, buttons: [{ label: '初期設定に戻す', value: 'reset' }, { label: '決定', value: 'ok', primary: true }] }).then((v) => {
      if (v === 'reset') settings.opt = Object.assign({}, DEF.opt);
      else form.querySelectorAll('input').forEach((i) => { settings.opt[i.dataset.k] = i.checked; });
      saveSettings(); renderTitle();
    });
  }
  $('#btnRules').onclick = () => { GK.sfx('click'); openRules(); };
  $('#btnStart').onclick = () => { GK.sfx('ok'); startMatch(); };
  $('#btnAgain').onclick = () => { GK.sfx('ok'); startMatch(); };
  $('#btnToTitle').onclick = () => { GK.sfx('click'); toTitle(); };

  GK.init({
    id: 'hanafuda-koikoi', title: '花暦こいこい', help: helpHTML,
    menu: () => {
      GK.sfx('click');
      if ($('#title').classList.contains('off') && M && $('#finalOv').hidden) {
        GK.modal({ title: 'メニュー', body: '<p>対局を中断してタイトルに戻りますか？（この対局の記録は残りません）</p>', buttons: [{ label: '対局を続ける', value: false }, { label: 'タイトルへ戻る', value: true, primary: true }] }).then((v) => { if (v) toTitle(); });
      } else if ($('#title').classList.contains('off')) toTitle();
      else GK.help();
    },
  });

  renderTitle();
  const IMG = ['bg-table', ...OPPS.map((o) => o.img), ...R.CARDS.map((c) => c.img)];
  const ready = GK.loadImages(IMG);

  /* ---------------- self-test (npm run game-check) ---------------- */
  const until = async (fn, ms = 20000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) return false; await GK.wait(40); } return true; };
  window.__hana = { G, get M() { return M; }, R, startMatch, toTitle, settings, showYaku, hideYaku, finishHuman, displayHand };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    const fail = (m) => { ok = false; notes.push('FAIL ' + m); };
    await ready;
    await GK.wait(400);
    // title: choose the strongest CPU and 3 months by clicking
    document.querySelector('.opp[data-i="2"]').click();
    document.querySelector('#months button[data-m="3"]').click();
    if (settings.opp !== 2 || settings.months !== 3) fail('title choices');
    $('#btnStart').click();
    if (!(await until(() => G.mode === 'hand', 30000))) { fail('never reached the player turn'); return { ok, notes }; }
    await GK.wait(700);
    await shot('play');
    // a real tap on the first hand card (pointer events on the canvas)
    const hand = displayHand(), id = hand[0], s = SP[id], rect = canvas.getBoundingClientRect();
    const cx = rect.left + s.x + s.w / 2, cy = rect.top + s.y + s.w * 0.9;
    const fire = (type) => canvas.dispatchEvent(new PointerEvent(type, { clientX: cx, clientY: cy, pointerType: 'mouse', pointerId: 7, bubbles: true }));
    fire('pointermove'); fire('pointerdown'); fire('pointerup');
    await GK.wait(60);
    if (G.mode === 'hand' && G.targets.length) { notes.push('two field cards matched: chose the first'); finishHuman({ card: G.sel, target: G.targets[0] }); await GK.wait(60); }
    if (G.st.hands[0].length !== 7) fail('the tapped card was not played'); else notes.push(`played ${R.card(id).name} by pointer`);
    if (!(await until(() => G.mode === 'hand' || G.mode === 'pick' || !$('#yakuOv').hidden || !$('#monthOv').hidden, 30000))) fail('CPU did not answer');
    else notes.push('CPU answered');
    if (G.mode === 'pick') finishHuman(G.targets[0]);
    await GK.wait(300);
    if (G.mode === 'hand') await shot('turn2');
    // the yaku dialog as it looks (a preview with sample cards; closed again)
    if (G.mode === 'hand') {
      const demo = R.yaku(['01-1', '03-1', '12-1', '09-1', '06-1', '07-1', '10-1'], M.opt);
      showYaku({ who: 'あなたの役', list: demo.list, total: demo.total, note: 'いま勝負すると 30 点（7点以上で倍）。', choice: true, canKoi: true });
      await GK.wait(900);
      await shot('yaku');
      hideYaku();
    }
    // the rest of the match on autopilot, fast
    G.auto = true; G.speed = 0.04; G.snap = true;
    if (G.mode === 'hand') finishHuman(R.aiChooseHand(G.st, 0, 1, rng));
    else if (G.mode === 'pick') finishHuman(G.targets[0]);
    let months = 0, shotMonth = false;
    const t0 = performance.now();
    while ($('#finalOv').hidden && performance.now() - t0 < 120000) {
      if (!$('#monthOv').hidden) {
        months++;
        if (!shotMonth) { G.snap = false; await GK.wait(500); await shot('month'); shotMonth = true; G.snap = true; }
        $('#btnNext').click();
      }
      await GK.wait(30);
    }
    if ($('#finalOv').hidden) { fail('no final result'); return { ok, notes }; }
    G.snap = false; G.speed = 1;
    const sum = (p) => M.pts[p].reduce((a, b) => a + b, 0);
    if (M.pts[0].length !== 3 || sum(0) !== M.totals[0] || sum(1) !== M.totals[1]) fail('score table does not add up');
    notes.push(`3 months: ${M.totals[0]} - ${M.totals[1]} (${M.pts[0].join(',')} / ${M.pts[1].join(',')})`);
    await GK.wait(600);
    await shot('final');
    G.auto = false;
    $('#btnToTitle').click();
    await GK.wait(500);
    if ($('#title').classList.contains('off')) fail('back to title');
    await shot('title-after');
    return { ok, notes };
  };
})();
