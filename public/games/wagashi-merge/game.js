/* 和菓子ころりん — game: layout, input, rules, effects, sound, screens. Physics in physics.js. */
(function () {
  'use strict';
  const { World, TIERS, BOX_W, BOX_H } = window.WagashiPhysics;
  const ID = 'wagashi-merge';
  const ZONE = 124, FRAME = 24, DROP_Y = -68, DANGER_Y = 44, GRACE = 3;
  const WORLD_W = BOX_W + FRAME * 2, WORLD_H = ZONE + BOX_H + FRAME;
  const FIX = 1 / 60;
  const TEA_MAX = 3;
  const MODES = { free: { name: 'じっくり', time: 0 }, timed: { name: '三分勝負', time: 180 } };
  const FONT = '"Hiragino Maru Gothic ProN","Yu Gothic UI","Yu Gothic",YuGothic,Meiryo,system-ui,sans-serif';
  const SPR = TIERS.map((t, i) => 'sweet-' + String(i + 1).padStart(2, '0'));
  const PTS = (tier) => 5 * tier * tier; // points for making the sweet of this tier
  const DROP_W = [30, 26, 20, 14, 10]; // which sweets come down (the five smallest)
  const SPRITE_FILL = 0.92; // the sweet fills 92 % of its square picture

  const $ = (s) => document.querySelector(s);
  const cv = $('#cv');
  let fitted = false;
  const view = GK.fit(cv, { onResize: () => { if (fitted) layout(); } });
  fitted = true;
  let ctx = view.ctx;
  let stat = null, statKey = '';
  const IMG = [];
  let L = {};

  const HELP = `
    <p>重箱の上からお菓子を落として、<b>同じお菓子どうしをくっつける</b>と、ひとつ大きなお菓子に変わります。金平糖から順に大きくして、いちばん大きな<b>鏡餅</b>をめざしましょう。</p>
    <h3>操作</h3>
    <table>
      <tr><th>スマホ</th><td>画面をなぞって落とす位置を決め、指をはなすと落ちます</td></tr>
      <tr><th>マウス</th><td>動かして位置を決め、クリックで落とします</td></tr>
      <tr><th>キーボード</th><td><kbd>←</kbd> <kbd>→</kbd> で移動、<kbd>Space</kbd> か <kbd>↓</kbd> で落とす、<kbd>T</kbd> でお茶</td></tr>
    </table>
    <h3>ルール</h3>
    <ul>
      <li>大きいお菓子ができるほど高い点数。続けて合わさると「れんさ」になり、点数が 1.5 倍、2 倍…と増えます。</li>
      <li>お菓子が重箱の<b>赤い線</b>より上にはみ出したまま 3 秒たつと、おしまいです。</li>
      <li>鏡餅どうしを合わせると、ふたつとも消えて大きなボーナス。</li>
    </ul>
    <h3>ご注文とお茶（このゲームだけの決まり）</h3>
    <ul>
      <li><b>ご注文</b>の札に出ているお菓子を作ると、ボーナス点と<b>お茶</b>が 1 杯もらえます。3 れんさ以上でももらえます（最大 3 杯）。</li>
      <li><b>お茶</b>のボタンを押してからお菓子をタップすると、そのお菓子をひとつ「いただきます」して取りのぞけます。困ったときの一服にどうぞ。</li>
    </ul>
    <h3>お菓子の順番</h3>
    <p style="line-height:1.9">${TIERS.map((t) => t.name).join(' → ')}</p>
    <h3>モード</h3>
    <p><b>じっくり</b>は時間無制限、<b>三分勝負</b>は 3 分間のスコアアタック。ベストスコアはモードごとに記録されます。</p>`;

  /* ---------------- records ---------------- */
  const rec = {
    best: (m) => GK.store.get('best-' + m, 0),
    seen: () => GK.store.get('seen', [true, true, true, true, true, false, false, false, false, false, false]),
  };

  /* ---------------- state ---------------- */
  const S = {
    state: 'title', mode: 'free', world: new World(), gen: 0, test: false,
    score: 0, shown: 0, cur: 0, next: 0, aim: BOX_W / 2, cool: 0, held: 1,
    tea: 0, teaMode: false, chain: 0, chainT: 0, maxChain: 0, merges: 0, orders: 0, order: 3, orderPop: 0,
    top: 0, timeLeft: 0, danger: 0, overT: 0, overMsg: '', paused: false, dragging: false, t: 0,
    fx: [], rings: [], texts: [], shake: 0, flash: 0, hitT: 0, tickT: 0, rng: GK.rng(), newBest: false, hover: null, keyPick: null,
  };
  const rand = () => S.rng();

  function pickTier(limit) {
    const w = DROP_W.slice(0, limit || DROP_W.length), sum = w.reduce((a, b) => a + b, 0);
    let r = rand() * sum;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; }
    return 0;
  }
  function newOrder() {
    // aim a little above what has been made so far: 桜餅〜どら焼き
    const lo = GK.clamp(S.top - 1, 3, 6), hi = Math.min(8, Math.max(5, S.top + 1));
    let t, n = 0;
    do { t = lo + Math.floor(rand() * (hi - lo + 1)); } while (t === S.order && n++ < 8);
    S.order = t; S.orderPop = 1;
  }

  /* ---------------- layout ---------------- */
  function layout() {
    const W = view.w, H = view.h;
    const land = W > H * 1.02;
    L = { W, H, land };
    if (land) {
      const pw = Math.min(300, Math.max(150, W * 0.24));
      const s = Math.min((W - pw * 2 - 48) / WORLD_W, (H - 20) / WORLD_H);
      L.s = s;
      L.ox = W / 2 - (BOX_W / 2) * s;
      L.oy = (H - WORLD_H * s) / 2 + ZONE * s;
      const bx0 = L.ox - FRAME * s, bx1 = L.ox + (BOX_W + FRAME) * s, gap = Math.max(14, 22 * s);
      const lw = Math.min(pw, bx0 - gap - 12), rw = Math.min(pw, W - bx1 - gap - 12);
      L.left = { x: bx0 - gap - lw, y: 12, w: lw, h: H - 24 };
      L.right = { x: bx1 + gap, y: 58, w: rw, h: H - 70 };
      L.k = GK.clamp(Math.min(lw / 250, H / 700), 0.62, 1.2);
    } else {
      const k = GK.clamp(W / 400, 0.8, 1.45);
      const top = 120 * k, strip = 54 * k;
      const s = Math.min((W - 20) / WORLD_W, (H - top - strip - 16) / WORLD_H);
      const spare = Math.max(0, H - top - strip - WORLD_H * s - 8);
      L.s = s; L.k = k; L.top = top;
      L.ox = W / 2 - (BOX_W / 2) * s;
      L.oy = top + spare * 0.4 + ZONE * s;
      L.stripY = L.oy + (BOX_H + FRAME) * s + 6 + Math.min(spare * 0.25, 20);
      L.stripH = strip;
    }
  }
  const toWorld = (p) => ({ x: (p.x - L.ox) / L.s, y: (p.y - L.oy) / L.s });
  const inRect = (p, r) => r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  /* ---------------- sound ---------------- */
  const pluck = (f, v = 0.22, at = 0, d = 0.4) => { GK.tone({ f, d, type: 'triangle', v, at }); GK.tone({ f: f * 2, d: d * 0.45, type: 'sine', v: v * 0.3, at }); };
  const snd = {
    drop() { if (GK.muted) return; GK.tone({ f: 760, f2: 420, d: 0.08, type: 'sine', v: 0.18 }); GK.noise({ d: 0.03, v: 0.06, f: 2600, q: 1.5 }); },
    hit(v, tier) {
      if (GK.muted || S.hitT > 0) return;
      S.hitT = 0.045;
      const k = Math.min(1, v / 900);
      GK.tone({ f: 250 - tier * 13, f2: 110, d: 0.08, type: 'sine', v: 0.06 + 0.2 * k });
      GK.noise({ d: 0.04, v: 0.03 + 0.08 * k, f: 800, filter: 'lowpass' });
    },
    merge(tier, chain) {
      if (GK.muted) return;
      const f = GK.scaleFreq('D4', 'yo', tier + Math.min(chain - 1, 6));
      pluck(f, 0.22);
      GK.tone({ f: 300 + tier * 40, f2: 900 + tier * 60, d: 0.1, type: 'sine', v: 0.14 });
      if (chain >= 2) pluck(f * 1.5, 0.12, 0.07, 0.3);
      if (tier >= 6) { GK.tone({ f: 130, f2: 58, d: 0.35, type: 'sine', v: 0.45 }); GK.noise({ d: 0.18, v: 0.15, f: 300, filter: 'lowpass' }); }
    },
    order() { if (GK.muted) return; [0, 2, 4, 5].forEach((st, i) => pluck(GK.scaleFreq('D5', 'yo', st), 0.18, i * 0.08, 0.5)); GK.tone({ f: 2093, d: 0.9, type: 'sine', v: 0.08, at: 0.3 }); },
    tea() { if (GK.muted) return; GK.noise({ d: 0.45, v: 0.14, f: 700, filter: 'lowpass' }); GK.tone({ f: 520, f2: 380, d: 0.35, type: 'sine', v: 0.1, at: 0.25 }); pluck(GK.scaleFreq('D5', 'yo', 2), 0.12, 0.5, 0.6); },
    gain() { if (GK.muted) return; pluck(1175, 0.14, 0, 0.25); pluck(1568, 0.14, 0.09, 0.4); },
    vanish() { if (GK.muted) return; GK.sfx('boom'); [0, 1, 2, 3, 4, 5, 7].forEach((st, i) => pluck(GK.scaleFreq('D4', 'yo', st + 3), 0.2, i * 0.07, 0.6)); },
  };
  // original tunes in the yo scale (D E G A B)
  const bars = (...b) => b.join(' | ');
  const SONG = {
    bpm: 84, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.12, notes: bars('A4 . B4 D5 E5 - D5 B4', 'A4 - G4 . E4 - - .', 'G4 . A4 B4 D5 - B4 A4', 'B4 - - - . . . .', 'D5 . E5 G5 E5 - D5 B4', 'A4 - B4 . D5 - - .', 'E5 D5 B4 A4 G4 - E4 .', 'G4 - - - . . . .') },
      { type: 'sine', v: 0.13, notes: bars('G2 - - - D3 - - -', 'E3 - - - D3 - - -', 'G2 - - - D3 - - -', 'E3 - - - B2 - - -', 'A2 - - - E3 - - -', 'D3 - - - B2 - - -', 'A2 - - - D3 - - -', 'G2 - - - - - - -') },
      { type: 'triangle', v: 0.045, notes: bars('. G3 B3 D4 . G3 B3 D4', '. E3 G3 B3 . D3 G3 A3', '. G3 B3 D4 . G3 B3 D4', '. E3 G3 B3 . B2 E3 G3', '. A3 D4 E4 . E3 G3 B3', '. D3 G3 A3 . B2 D3 G3', '. A3 D4 E4 . D3 G3 A3', '. G3 B3 D4 G4 . . .') },
    ],
    drums: { h: bars('. . x . . . x .', '. . x . . . x .', '. . x . . . x .', '. . x . . . x x', '. . x . . . x .', '. . x . . . x .', '. . x . . . x .', '. . x . x . x .') },
  };
  const SONG_FAST = Object.assign({}, SONG, { bpm: 104 });

  /* ---------------- game flow ---------------- */
  function startGame(mode) {
    S.gen++;
    Object.assign(S, {
      state: 'play', mode, world: new World(), score: 0, shown: 0, aim: BOX_W / 2, cool: 0.25, held: 0,
      tea: 1, teaMode: false, chain: 0, chainT: 0, maxChain: 0, merges: 0, orders: 0, order: 3, orderPop: 0,
      top: 0, timeLeft: MODES[mode].time, danger: 0, overT: 0, overMsg: '', paused: false, dragging: false,
      fx: [], rings: [], texts: [], shake: 0, flash: 0, newBest: false, keyPick: null,
    });
    S.cur = pickTier(3); S.next = pickTier(3);
    newOrder();
    $('#title').classList.remove('show');
    $('#result').classList.remove('show');
    if (!S.test) GK.music.play(mode === 'timed' ? SONG_FAST : SONG);
    layout();
  }

  function drop() {
    if (S.state !== 'play' || S.cool > 0 || S.teaMode || S.paused) return false;
    const T = TIERS[S.cur], x = GK.clamp(S.aim, T.r, BOX_W - T.r);
    const b = S.world.add(S.cur, x, DROP_Y, { a: rand() * Math.PI * 2, vy: 60 });
    b.dropped = true;
    S.cur = S.next; S.next = pickTier();
    S.cool = 0.5; S.held = 0;
    snd.drop();
    return true;
  }

  function addScore(n) { S.score += Math.round(n); }

  function onMerge(m) {
    const T = TIERS[m.tier];
    S.merges++;
    S.chain = S.chainT > 0 ? S.chain + 1 : 1;
    S.chainT = 1.1;
    S.maxChain = Math.max(S.maxChain, S.chain);
    const mult = 1 + 0.5 * (S.chain - 1);
    if (m.vanish) {
      addScore(1500 * mult);
      burst(m.x, m.y, m.tier, 70, true);
      for (let i = 0; i < 40; i++) petal(m.x + (rand() - 0.5) * 200, m.y - rand() * 120);
      S.rings.push({ x: m.x, y: m.y, r0: 40, r1: 320, t: 0, life: 0.9, c: '#ffd27a', wd: 10 });
      text(m.x, m.y - 40, 'おめでとう！', 34, '#ffe08a');
      text(m.x, m.y + 6, '+' + GK.fmt(Math.round(1500 * mult)), 26, '#fff');
      S.shake = 16; S.flash = 0.8;
      snd.vanish();
      gainTea(m.x, m.y);
      return;
    }
    const pts = PTS(m.tier) * mult;
    addScore(pts);
    burst(m.x, m.y, m.tier, 10 + m.tier * 3, m.tier >= 6);
    S.rings.push({ x: m.x, y: m.y, r0: T.r * 0.6, r1: T.r * 1.7, t: 0, life: 0.45, c: T.c1, wd: 3 + m.tier * 0.6 });
    if (m.tier >= 6) { for (let i = 0; i < 6 + m.tier; i++) petal(m.x + (rand() - 0.5) * T.r * 2, m.y - T.r); S.shake = Math.max(S.shake, 3 + m.tier); }
    text(m.x, m.y - T.r * 0.2, '+' + GK.fmt(Math.round(pts)), 16 + m.tier * 1.6, '#fff');
    if (S.chain >= 2) text(m.x, m.y - T.r * 0.2 - 26 - m.tier, S.chain + ' れんさ！', 18 + Math.min(S.chain, 6) * 2, '#ffd27a');
    snd.merge(m.tier, S.chain);
    if (m.tier > S.top) {
      S.top = m.tier;
      const seen = rec.seen();
      if (!seen[m.tier]) { seen[m.tier] = true; if (!S.test) GK.store.set('seen', seen); if (m.tier >= 5) GK.toast(`はじめて「${T.name}」ができました！`); }
    }
    if (m.tier === S.order) {
      S.orders++;
      const bonus = PTS(m.tier) * 2;
      addScore(bonus);
      text(m.x, m.y - T.r - 40, 'ご注文 完成！ +' + GK.fmt(bonus), 20, '#ffe08a');
      snd.order();
      gainTea(m.x, m.y - T.r);
      newOrder();
    }
    if (S.chain === 3 || S.chain === 6) gainTea(m.x, m.y);
  }

  function gainTea(x, y) {
    if (S.tea >= TEA_MAX) return;
    S.tea++;
    text(x, y - 70, 'お茶 +1', 18, '#bfe6a8');
    setTimeout(() => snd.gain(), 220);
  }

  function toggleTea(on) {
    if (S.state !== 'play') return;
    const want = on == null ? !S.teaMode : on;
    if (want && S.tea <= 0) { GK.toast('お茶がありません（ご注文か 3 れんさでもらえます）'); GK.sfx('ng'); return; }
    if (want && !S.world.bodies.length) { GK.toast('まだお菓子がありません'); return; }
    S.teaMode = want;
    GK.sfx(want ? 'select' : 'click');
    if (want) GK.toast('取りのぞくお菓子をえらんでください');
  }

  function eat(b) {
    if (!b || !S.teaMode) return;
    S.world.remove(b);
    S.tea--; S.teaMode = false; S.keyPick = null;
    for (let i = 0; i < 14; i++) S.fx.push({ kind: 'steam', x: b.x + (rand() - 0.5) * b.r, y: b.y + (rand() - 0.5) * b.r * 0.6, vx: (rand() - 0.5) * 30, vy: -40 - rand() * 60, t: 0, life: 0.9 + rand() * 0.6, s: b.r * (0.25 + rand() * 0.3) });
    text(b.x, b.y, 'いただきます', 18, '#e9ffd8');
    snd.tea();
  }

  function pickAt(wp) {
    let best = null, bd = Infinity;
    for (const b of S.world.bodies) {
      const d = Math.hypot(b.x - wp.x, b.y - wp.y);
      if (d < b.r + 6 && d / b.r < bd) { bd = d / b.r; best = b; }
    }
    return best;
  }
  function pickColumn(x) { // keyboard: the topmost sweet under the aim
    let best = null;
    for (const b of S.world.bodies) if (Math.abs(b.x - x) < b.r && (!best || b.y - b.r < best.y - best.r)) best = b;
    return best;
  }

  function gameOver(msg) {
    if (S.state !== 'play') return;
    S.state = 'over'; S.overT = 0; S.overMsg = msg; S.teaMode = false; S.dragging = false;
    GK.music.stop();
    if (S.mode === 'timed' && msg === 'そこまで！') GK.sfx('win'); else GK.sfx('lose');
    const best = rec.best(S.mode);
    S.newBest = S.score > best && S.score > 0;
    if (S.newBest && !S.test) GK.store.set('best-' + S.mode, S.score);
    const gen = S.gen;
    setTimeout(() => { if (S.gen === gen && S.state === 'over') showResult(); }, S.test ? 50 : 1700);
  }

  function showResult() {
    S.state = 'result';
    $('#rMode').textContent = MODES[S.mode].name;
    $('#rHead').textContent = S.overMsg === 'そこまで！' ? 'そこまで！' : 'おしまい';
    $('#rScore').textContent = GK.fmt(S.score);
    $('#rNew').classList.toggle('on', S.newBest);
    $('#rTopImg').src = 'img/' + SPR[S.top] + '.webp';
    $('#rTopName').textContent = TIERS[S.top].name;
    $('#rMerges').textContent = GK.fmt(S.merges);
    $('#rChain').textContent = S.maxChain;
    $('#rOrders').textContent = S.orders;
    $('#rBest').textContent = GK.fmt(Math.max(rec.best(S.mode), S.score));
    $('#result').classList.add('show');
    setTimeout(() => $('#rAgain').focus({ preventScroll: true }), 60);
    if (S.newBest) setTimeout(() => GK.sfx('ok'), 300);
  }

  function toTitle() {
    S.gen++;
    S.state = 'title'; S.teaMode = false;
    GK.music.stop();
    $('#result').classList.remove('show');
    renderTitle();
    $('#title').classList.add('show');
  }

  function renderTitle() {
    $('#records').innerHTML = `ベスト　じっくり <b>${GK.fmt(rec.best('free'))}</b> 点　・　三分勝負 <b>${GK.fmt(rec.best('timed'))}</b> 点`;
    const seen = rec.seen();
    $('#dex').innerHTML = TIERS.map((t, i) => `<img src="img/${SPR[i]}.webp" alt="${seen[i] ? t.name : '？'}" title="${seen[i] ? t.name : 'まだ作っていません'}" class="${seen[i] ? '' : 'unseen'}">`).join('');
  }

  function openMenu() {
    if (S.state === 'play') {
      S.paused = true;
      GK.modal({ title: 'ひと休み', body: `<p>${MODES[S.mode].name}　いま <b>${GK.fmt(S.score)}</b> 点</p>`, buttons: [{ label: 'つづける', value: 'resume', primary: true }, { label: '最初から', value: 'restart' }, { label: 'タイトルへ', value: 'title' }] })
        .then((v) => { S.paused = false; if (v === 'restart') startGame(S.mode); else if (v === 'title') toTitle(); });
    } else if (S.state === 'title') {
      GK.modal({ title: 'メニュー', body: '<p>ベストスコアとお品書き（作ったお菓子の記録）を消すことができます。</p>', buttons: [{ label: '記録を消す', value: 'reset' }, { label: '閉じる', value: null, primary: true }] })
        .then((v) => {
          if (v !== 'reset') return;
          GK.modal({ title: '記録を消しますか？', body: '<p>この操作はもとに戻せません。</p>', buttons: [{ label: '消す', value: true }, { label: 'やめる', value: false, primary: true }] })
            .then((ok) => { if (ok) { ['best-free', 'best-timed', 'seen'].forEach((k) => GK.store.del(k)); renderTitle(); GK.toast('記録を消しました'); } });
        });
    } else {
      GK.modal({ title: 'メニュー', buttons: [{ label: 'もう一度', value: 'again', primary: true }, { label: 'タイトルへ', value: 'title' }] })
        .then((v) => { if (v === 'again') startGame(S.mode); else if (v === 'title') toTitle(); });
    }
  }

  /* ---------------- per-step logic ---------------- */
  function tick(dt) {
    S.t += dt;
    if (S.hitT > 0) S.hitT -= dt;
    if (S.state === 'play' || S.state === 'over') {
      const ev = S.world.step(dt);
      for (const m of ev.merges) onMerge(m);
      for (const h of ev.hits) snd.hit(h.v, h.tier);
    }
    if (S.state === 'play') {
      // keyboard aim
      const kl = GK.keys.has('ArrowLeft') || GK.keys.has('KeyA'), kr = GK.keys.has('ArrowRight') || GK.keys.has('KeyD');
      if (kl || kr) S.aim = GK.clamp(S.aim + (kr - kl) * 330 * dt, 0, BOX_W);
      if (S.teaMode && (kl || kr || S.keyPick)) S.keyPick = pickColumn(S.aim);
      if (S.cool > 0) S.cool -= dt;
      S.held = Math.min(1, S.held + dt * 4);
      if (S.chainT > 0) { S.chainT -= dt; if (S.chainT <= 0) S.chain = 0; }
      // overflow: a settled sweet above the red line for GRACE seconds
      let over = false;
      for (const b of S.world.bodies) if ((b.dropped ? b.age > 1.1 : b.age > 0.4) && b.y - b.r < DANGER_Y) { over = true; break; }
      if (over) {
        const before = Math.ceil(GRACE - S.danger);
        S.danger += dt;
        if (Math.ceil(GRACE - S.danger) !== before && !S.test) GK.sfx('tick');
        if (S.danger >= GRACE) gameOver('はみ出しました');
      } else S.danger = Math.max(0, S.danger - dt * 1.5);
      if (S.timeLeft > 0) {
        const before = Math.ceil(S.timeLeft);
        S.timeLeft -= dt;
        if (S.timeLeft <= 10 && Math.ceil(S.timeLeft) !== before && !S.test) GK.tone({ f: 1320, d: 0.05, type: 'square', v: 0.05 });
        if (S.timeLeft <= 0) { S.timeLeft = 0; gameOver('そこまで！'); }
      }
    }
    if (S.state === 'over') S.overT += dt;
    S.shown += (S.score - S.shown) * Math.min(1, dt * 10);
    if (Math.abs(S.score - S.shown) < 0.5) S.shown = S.score;
    if (S.orderPop > 0) S.orderPop = Math.max(0, S.orderPop - dt * 2);
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 40);
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 1.6);
    // effects
    for (const p of S.fx) {
      p.t += dt;
      if (p.kind === 'dot') { p.vy += 900 * dt; p.vx *= 0.985; }
      else if (p.kind === 'petal') { p.vy = Math.min(p.vy + 120 * dt, 70); p.vx = Math.sin(p.t * 3 + p.ph) * 50; p.rot += p.vr * dt; }
      else if (p.kind === 'steam') { p.vy *= 0.98; p.s += dt * 18; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    S.fx = S.fx.filter((p) => p.t < p.life);
    for (const r of S.rings) r.t += dt;
    S.rings = S.rings.filter((r) => r.t < r.life);
    for (const x of S.texts) x.t += dt;
    S.texts = S.texts.filter((x) => x.t < x.life);
  }

  function burst(x, y, tier, n, big) {
    const T = TIERS[tier];
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, sp = (big ? 220 : 140) + rand() * (big ? 320 : 200);
      S.fx.push({ kind: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, t: 0, life: 0.5 + rand() * 0.5, c: rand() < 0.3 ? '#fffaf0' : rand() < 0.5 ? T.c1 : T.c2, s: 2.5 + rand() * (big ? 5 : 3.5) });
    }
  }
  function petal(x, y) { S.fx.push({ kind: 'petal', x, y, vx: 0, vy: -30 - rand() * 80, t: 0, life: 2 + rand() * 1.2, ph: rand() * 6, rot: rand() * 6, vr: (rand() - 0.5) * 6, s: 5 + rand() * 4, c: rand() < 0.7 ? '#ffc4d6' : '#fff0f4' }); }
  function text(x, y, s, size, c) { S.texts.push({ x, y, s, size, c, t: 0, life: 1.1 }); }

  /* ---------------- drawing ---------------- */
  const font = (px, w = 800) => `${w} ${Math.round(px)}px ${FONT}`;
  let grain = null;
  function makeGrain() { // the wood grain of the box, drawn once
    const r = GK.rng(7), lines = [];
    for (let i = 0; i < 22; i++) {
      const x = (i / 22) * BOX_W + r() * 10, amp = 3 + r() * 6, ph = r() * 6, fq = 0.006 + r() * 0.01;
      lines.push({ x, amp, ph, fq, a: 0.05 + r() * 0.08, w: 0.8 + r() * 1.6 });
    }
    return lines;
  }

  function drawCover(img, x, y, w, h) {
    if (!img) return;
    const iw = img.width, ih = img.height, s = Math.max(w / iw, h / ih);
    const sw = w / s, sh = h / s;
    ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  }

  function sprite(tier, x, y, r, a, sq) {
    const img = IMG[tier];
    ctx.save();
    ctx.translate(x, y);
    if (sq) ctx.scale(1 + sq, 1 - sq);
    ctx.rotate(a);
    const s = (2 * r) / SPRITE_FILL;
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  function drawBox() {
    const g0 = ctx.createLinearGradient(0, -12, 0, BOX_H + FRAME);
    g0.addColorStop(0, '#4a2a19'); g0.addColorStop(1, '#22120a');
    // shadow under the box
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(BOX_W / 2, BOX_H + FRAME + 6, BOX_W / 2 + FRAME + 10, 14, 0, 0, Math.PI * 2); ctx.fill();
    // lacquered outer box
    ctx.fillStyle = g0;
    ctx.beginPath(); ctx.roundRect(-FRAME, -12, BOX_W + FRAME * 2, BOX_H + FRAME + 12, [6, 6, 12, 12]); ctx.fill();
    // inside: hinoki wood
    const g1 = ctx.createLinearGradient(0, 0, 0, BOX_H);
    g1.addColorStop(0, '#ecd4a4'); g1.addColorStop(1, '#d8b47a');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, BOX_W, BOX_H);
    if (!grain) grain = makeGrain();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, BOX_W, BOX_H); ctx.clip();
    for (const l of grain) {
      ctx.strokeStyle = `rgba(120,72,30,${l.a})`; ctx.lineWidth = l.w;
      ctx.beginPath();
      for (let y = 0; y <= BOX_H; y += 20) { const x = l.x + Math.sin(y * l.fq + l.ph) * l.amp; if (y) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
    }
    // inner shade
    let g = ctx.createLinearGradient(0, 0, 18, 0); g.addColorStop(0, 'rgba(70,40,15,.28)'); g.addColorStop(1, 'rgba(70,40,15,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 18, BOX_H);
    g = ctx.createLinearGradient(BOX_W, 0, BOX_W - 18, 0); g.addColorStop(0, 'rgba(70,40,15,.28)'); g.addColorStop(1, 'rgba(70,40,15,0)');
    ctx.fillStyle = g; ctx.fillRect(BOX_W - 18, 0, 18, BOX_H);
    g = ctx.createLinearGradient(0, BOX_H, 0, BOX_H - 22); g.addColorStop(0, 'rgba(70,40,15,.3)'); g.addColorStop(1, 'rgba(70,40,15,0)');
    ctx.fillStyle = g; ctx.fillRect(0, BOX_H - 22, BOX_W, 22);
    ctx.restore();
    // gold line (maki-e) and corner fittings
    ctx.strokeStyle = 'rgba(214,174,96,.75)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(-FRAME + 6, -6, BOX_W + FRAME * 2 - 12, BOX_H + FRAME, [3, 3, 8, 8]); ctx.stroke();
    ctx.fillStyle = '#caa45a';
    for (const [x, y, sx, sy] of [[-FRAME, -12, 1, 1], [BOX_W + FRAME, -12, -1, 1], [-FRAME, BOX_H + FRAME, 1, -1], [BOX_W + FRAME, BOX_H + FRAME, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * 30, y); ctx.lineTo(x + sx * 30, y + sy * 6); ctx.lineTo(x + sx * 6, y + sy * 6); ctx.lineTo(x + sx * 6, y + sy * 30); ctx.lineTo(x, y + sy * 30); ctx.closePath(); ctx.fill();
    }
    // a small sprig motif on the front
    ctx.save(); ctx.translate(BOX_W / 2, BOX_H + FRAME / 2 + 1); ctx.strokeStyle = 'rgba(214,174,96,.8)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(0, -7, 34, 0); ctx.stroke();
    for (const s of [-1, 1]) for (const d of [12, 24]) { ctx.beginPath(); ctx.ellipse(s * d, -3 + (d === 24 ? 1 : 0), 4.5, 2, s * 0.6, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }

  function drawDanger() {
    let top = Infinity;
    for (const b of S.world.bodies) if (b.age > 0.6) top = Math.min(top, b.y - b.r);
    const near = GK.clamp(1 - (top - DANGER_Y) / 110, 0, 1);
    const pulse = S.danger > 0 ? 0.55 + 0.45 * Math.sin(S.t * 14) : 0;
    const a = Math.max(0.22, near * 0.75, pulse);
    ctx.save();
    ctx.strokeStyle = `rgba(214,48,48,${a})`; ctx.lineWidth = S.danger > 0 ? 3 : 2;
    ctx.setLineDash([10, 8]); ctx.lineDashOffset = -S.t * 20;
    ctx.beginPath(); ctx.moveTo(4, DANGER_Y); ctx.lineTo(BOX_W - 4, DANGER_Y); ctx.stroke();
    ctx.restore();
    if (S.danger > 0 && S.state === 'play') {
      const n = Math.max(1, Math.ceil(GRACE - S.danger));
      ctx.save();
      ctx.fillStyle = 'rgba(214,48,48,.14)'; ctx.fillRect(0, 0, BOX_W, DANGER_Y);
      ctx.font = font(54); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(80,10,10,.8)'; ctx.strokeText(n, BOX_W / 2, DANGER_Y + 50);
      ctx.fillStyle = '#ffdddd'; ctx.fillText(n, BOX_W / 2, DANGER_Y + 50);
      ctx.restore();
    }
  }

  function drawChopsticks(x, y, r, open) {
    const spread = r + 2 + open * 14;
    ctx.save();
    for (const s of [-1, 1]) {
      const tx = x + s * spread * 0.92, ty = y - r * 0.28;
      const ang = -Math.PI / 2 + 0.42 + s * 0.08; // leaning to the upper right
      const len = 150;
      const ex = tx + Math.cos(ang) * len, ey = ty + Math.sin(ang) * len;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(tx + 2, ty + 3); ctx.lineTo(ex + 2, ey + 3); ctx.stroke();
      ctx.strokeStyle = '#e6c890'; ctx.lineWidth = 4.5; // bare wood tip
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + (ex - tx) * 0.3, ty + (ey - ty) * 0.3); ctx.stroke();
      ctx.strokeStyle = '#9a2b2b'; ctx.lineWidth = 6; // lacquered part
      ctx.beginPath(); ctx.moveTo(tx + (ex - tx) * 0.3, ty + (ey - ty) * 0.3); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,180,.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(tx + (ex - tx) * 0.34 - 1, ty + (ey - ty) * 0.34); ctx.lineTo(ex - 1, ey); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(L.ox + S.shx, L.oy + S.shy);
    ctx.scale(L.s, L.s);
    drawDanger();
    // guide + the sweet in the chopsticks
    const playing = S.state === 'play';
    if (playing && !S.teaMode) {
      const T = TIERS[S.cur], x = GK.clamp(S.aim, T.r, BOX_W - T.r);
      const ready = S.cool <= 0;
      if (ready) {
        const ly = S.world.landing(x, T.r, DROP_Y);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]);
        ctx.beginPath(); ctx.moveTo(x, DROP_Y + T.r + 4); ctx.lineTo(x, ly); ctx.stroke();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,.4)';
        ctx.beginPath(); ctx.arc(x, ly, T.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      const e = GK.ease.outBack(S.held), bob = Math.sin(S.t * 3) * 2;
      const r = T.r * (0.55 + 0.45 * e);
      sprite(S.cur, x, DROP_Y + bob, r, Math.sin(S.t * 1.7) * 0.15, 0);
      ctx.save();
      if (!L.land) { const cy = (L.top - L.oy) / L.s; ctx.beginPath(); ctx.rect(-FRAME - 400, cy, BOX_W + 800, 1000); ctx.clip(); }
      drawChopsticks(x, DROP_Y + bob, r, 0);
      ctx.restore();
    } else if (playing && S.teaMode) {
      drawChopsticks(S.aim, DROP_Y, 20, 1);
    }
    // the sweets
    const pickB = S.teaMode ? (S.keyPick || (S.hover ? pickAt(toWorld(S.hover)) : null)) : null;
    for (const b of S.world.bodies) {
      sprite(b.tier, b.x, b.y, b.r, b.a, b.squash);
      if (b.flash > 0) {
        ctx.save(); ctx.globalAlpha = b.flash * 0.9; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 + b.flash * 5;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + (1 - b.flash) * 10, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (S.teaMode) {
        const on = b === pickB;
        ctx.save(); ctx.strokeStyle = on ? '#8fe07a' : 'rgba(170,230,150,.55)'; ctx.lineWidth = on ? 5 : 2;
        ctx.setLineDash(on ? [] : [6, 6]); ctx.lineDashOffset = S.t * 20;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 3 + (on ? Math.sin(S.t * 10) * 2 : 0), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (S.state === 'over' || S.state === 'result') {
        ctx.fillStyle = `rgba(40,28,20,${Math.min(0.55, S.overT * 0.5)})`;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    // effects
    for (const r of S.rings) {
      const k = r.t / r.life, e = GK.ease.outCubic(k);
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.c; ctx.lineWidth = r.wd * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    for (const p of S.fx) {
      const k = p.t / p.life;
      ctx.save();
      if (p.kind === 'dot') {
        ctx.globalAlpha = 1 - k * k; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'petal') {
        ctx.globalAlpha = Math.min(1, (1 - k) * 2); ctx.fillStyle = p.c; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'steam') {
        ctx.globalAlpha = 0.45 * (1 - k); ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    for (const x of S.texts) {
      const k = x.t / x.life, y = x.y - GK.ease.outCubic(Math.min(1, k * 1.4)) * 40;
      const sc = k < 0.15 ? GK.ease.outBack(k / 0.15) : 1;
      ctx.save(); ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.translate(GK.clamp(x.x, 70, BOX_W - 70), y); ctx.scale(sc, sc);
      ctx.font = font(x.size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, x.size * 0.22); ctx.strokeStyle = 'rgba(60,30,15,.85)'; ctx.strokeText(x.s, 0, 0);
      ctx.fillStyle = x.c; ctx.fillText(x.s, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- UI (screen pixels) ---------- */
  function paper(x, y, w, h, r, a = 0.94) {
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.roundRect(x + 1, y + 4, w, h, r); ctx.fill();
    ctx.fillStyle = `rgba(251,243,226,${a})`;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    ctx.strokeStyle = 'rgba(190,150,95,.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x + 3, y + 3, w - 6, h - 6, Math.max(2, r - 3)); ctx.stroke();
  }
  function label(t, x, y, px, c, align = 'left', w = 700) { ctx.font = font(px, w); ctx.fillStyle = c; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, x, y); }
  function fitLabel(t, x, y, px, c, maxW, align = 'left', w = 700) {
    let s = px; ctx.font = font(s, w);
    while (s > 8 && ctx.measureText(t).width > maxW) { s -= 1; ctx.font = font(s, w); }
    label(t, x, y, s, c, align, w);
  }
  const mmss = (t) => { const s = Math.max(0, Math.ceil(t)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function tag(t, cx, cy, k) {
    ctx.font = font(10.5 * k); const w = ctx.measureText(t).width + 14 * k, h = 16 * k;
    ctx.fillStyle = '#caa45a'; ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#3b2416'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, cx, cy + 0.5);
  }
  function uiNext(cx, cy, R, k) {
    ctx.fillStyle = 'rgba(40,24,14,.55)';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(214,174,96,.8)'; ctx.lineWidth = 2; ctx.stroke();
    const r = Math.min(R * 0.78, TIERS[S.next].r * 0.5 * k + R * 0.3);
    sprite(S.next, cx, cy, r, 0, 0);
  }

  function uiOrder(x, y, w, h, k) {
    const pop = S.orderPop ? 1 + Math.sin(S.orderPop * Math.PI) * 0.06 : 1;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(pop, pop); ctx.translate(-(x + w / 2), -(y + h / 2));
    paper(x, y, w, h, 10 * k);
    const T = TIERS[S.order], r = Math.min(h * 0.32, 22 * k);
    sprite(S.order, x + 10 * k + r, y + h / 2 + 1, r, 0, 0);
    const tx = x + 18 * k + r * 2, tw = w - (tx - x) - 8 * k;
    label('ご注文', tx, y + h * 0.36, 11 * k, '#a2603a');
    fitLabel(T.name, tx, y + h * 0.66, 16 * k, '#3b2416', tw, 'left', 800);
    fitLabel('作ると ボーナス＋お茶', tx, y + h * 0.88, 9.5 * k, '#8a6a52', tw, 'left', 600);
    ctx.restore();
  }

  function uiTea(x, y, w, h, k) {
    L.teaBtn = { x, y, w, h };
    const on = S.teaMode, can = S.tea > 0 && S.state === 'play';
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.roundRect(x + 1, y + 3, w, h, h / 2); ctx.fill();
    ctx.fillStyle = on ? '#5f8a3c' : can ? '#2f4a2a' : 'rgba(47,74,42,.55)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = on ? '#d8ffc0' : 'rgba(190,230,160,.5)'; ctx.lineWidth = on ? 3 : 1.5;
    ctx.beginPath(); ctx.roundRect(x + 2, y + 2, w - 4, h - 4, h / 2 - 2); ctx.stroke();
    const ir = h * 0.36, icx = x + h * 0.5;
    if (GK.images.tea) { const s = (ir * 2) / SPRITE_FILL; ctx.drawImage(GK.images.tea, icx - s / 2, y + h / 2 - s / 2, s, s); }
    const tx = icx + ir + 6 * k;
    label(on ? 'やめる' : 'お茶', tx, y + h * 0.48, 14 * k, '#f1ffe6', 'left', 800);
    for (let i = 0; i < TEA_MAX; i++) {
      ctx.beginPath(); ctx.arc(tx + 5 * k + i * 13 * k, y + h * 0.74, 4.2 * k, 0, Math.PI * 2);
      ctx.fillStyle = i < S.tea ? '#9fe07f' : 'rgba(255,255,255,.18)'; ctx.fill();
    }
  }

  function uiChart(x, y, w, h, k) { // お品書き (landscape: right panel)
    paper(x, y, w, h, 14 * k);
    label('お品書き', x + w / 2, y + 30 * k, 17 * k, '#5a3420', 'center', 800);
    const seen = rec.seen(), top = y + 44 * k, rowH = Math.min(46 * k, (h - 54 * k) / TIERS.length);
    for (let i = 0; i < TIERS.length; i++) {
      const T = TIERS[i], cy = top + rowH * (i + 0.5), r = rowH * 0.4;
      const done = i <= S.top && S.state !== 'title', isOrder = i === S.order;
      if (isOrder) { ctx.fillStyle = 'rgba(184,71,95,.14)'; ctx.beginPath(); ctx.roundRect(x + 8 * k, cy - rowH / 2 + 1, w - 16 * k, rowH - 2, 8); ctx.fill(); }
      ctx.globalAlpha = seen[i] || done ? 1 : 0.35;
      sprite(i, x + 16 * k + r, cy, r, 0, 0);
      fitLabel(T.name, x + 24 * k + r * 2, cy + rowH * 0.16, Math.min(15 * k, rowH * 0.42), done ? '#3b2416' : '#7a6150', w - 70 * k - r * 2, 'left', done ? 800 : 600);
      ctx.globalAlpha = 1;
      label(i ? '+' + PTS(i) : '', x + w - 12 * k, cy + rowH * 0.14, Math.min(11 * k, rowH * 0.32), '#a2603a', 'right', 700);
      if (i < TIERS.length - 1) { ctx.fillStyle = 'rgba(160,120,80,.4)'; ctx.fillRect(x + 16 * k + r - 0.5, cy + r + 1, 1, rowH - 2 * r - 2); }
    }
  }

  function uiStrip(y, h, k) { // portrait: the eleven sweets in a row
    const n = TIERS.length, sizes = TIERS.map((_, i) => (9 + i * 1.25) * k);
    const gap = 5 * k, total = sizes.reduce((a, b) => a + b * 2, 0) + gap * (n - 1);
    const sc = Math.min(1, (L.W - 24) / total);
    let x = L.W / 2 - (total * sc) / 2;
    const seen = rec.seen(), cy = y + h / 2;
    ctx.fillStyle = 'rgba(30,18,10,.45)';
    ctx.beginPath(); ctx.roundRect(L.W / 2 - (total * sc) / 2 - 10, cy - h * 0.45, total * sc + 20, h * 0.9, h * 0.45); ctx.fill();
    for (let i = 0; i < n; i++) {
      const r = sizes[i] * sc;
      ctx.globalAlpha = seen[i] || i <= S.top ? 1 : 0.3;
      sprite(i, x + r, cy, r, 0, 0);
      ctx.globalAlpha = 1;
      if (i === S.order && S.state === 'play') { ctx.strokeStyle = '#ffb3c4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + r, cy, r + 3, 0, Math.PI * 2); ctx.stroke(); }
      x += r * 2 + gap * sc;
    }
  }

  function drawUI() {
    const k = L.k, best = Math.max(rec.best(S.mode), S.state === 'title' ? 0 : 0);
    if (L.land) {
      const P = L.left;
      let y = P.y + 6 * k;
      paper(P.x, y, P.w, 108 * k + (S.mode === 'timed' ? 46 * k : 0), 14 * k);
      label('とくてん', P.x + 16 * k, y + 26 * k, 13 * k, '#a2603a');
      fitLabel(GK.fmt(Math.round(S.shown)), P.x + 16 * k, y + 68 * k, 40 * k, '#3b2416', P.w - 32 * k, 'left', 800);
      label('ベスト ' + GK.fmt(Math.max(best, S.newBest ? S.score : 0)), P.x + 16 * k, y + 94 * k, 13 * k, '#8a6a52', 'left', 700);
      if (S.mode === 'timed') {
        const low = S.timeLeft <= 10;
        label('のこり', P.x + 16 * k, y + 132 * k, 13 * k, '#a2603a');
        label(mmss(S.timeLeft), P.x + P.w - 16 * k, y + 136 * k, 30 * k, low ? '#c8372d' : '#3b2416', 'right', 800);
        y += 46 * k;
      }
      y += 120 * k;
      uiNext(P.x + P.w / 2, y + 48 * k, 38 * k, k);
      tag('つぎ', P.x + P.w / 2, y + 88 * k, k * 1.15);
      y += 100 * k;
      uiOrder(P.x, y, P.w, 74 * k, k);
      y += 86 * k;
      uiTea(P.x + (P.w - Math.min(P.w, 180 * k)) / 2, y, Math.min(P.w, 180 * k), 58 * k, k);
      const R = L.right;
      uiChart(R.x, R.y, R.w, Math.min(R.h, 580 * k), k);
    } else {
      const pad = 12;
      label('とくてん', pad + 2, 22 * k, 12 * k, '#f3c98b');
      ctx.font = font(30 * k); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,22,12,.7)'; ctx.textAlign = 'left'; ctx.strokeText(GK.fmt(Math.round(S.shown)), pad, 52 * k);
      label(GK.fmt(Math.round(S.shown)), pad, 52 * k, 30 * k, '#fff8ea', 'left', 800);
      ctx.font = font(30 * k); const sw = ctx.measureText(GK.fmt(Math.round(S.shown))).width;
      label('ベスト ' + GK.fmt(Math.max(best, S.newBest ? S.score : 0)), pad + Math.max(sw, 60 * k) + 12, 50 * k, 11.5 * k, '#e8d2b0', 'left', 700);
      if (S.mode === 'timed') {
        const low = S.timeLeft <= 10, tx = Math.min(L.W - 150, L.W * 0.62);
        label('のこり', tx, 22 * k, 11 * k, '#f3c98b', 'right');
        label(mmss(S.timeLeft), tx, 50 * k, 24 * k, low ? '#ff8a7a' : '#fff8ea', 'right', 800);
      }
      const ry = 62 * k, rh = 50 * k;
      uiNext(pad + 26 * k, ry + rh / 2 + 2 * k, 22 * k, k * 0.62);
      tag('つぎ', pad + 26 * k, ry + rh - 1 * k, k);
      const teaW = 108 * k, teaX = L.W - pad - teaW, ox = pad + 58 * k;
      uiOrder(ox, ry, teaX - 8 - ox, rh, k * 0.92);
      uiTea(teaX, ry + 2, teaW, rh - 4, k * 0.95);
      uiStrip(L.stripY, L.stripH, k);
    }
  }

  /** the background and the box: drawn once per size into an offscreen canvas */
  function renderStatic() {
    const key = [cv.width, cv.height, L.s, L.ox, L.oy, !!GK.images.bg].join();
    if (stat && key === statKey) return;
    statKey = key;
    stat = stat || document.createElement('canvas');
    stat.width = cv.width; stat.height = cv.height;
    const main = ctx;
    ctx = stat.getContext('2d');
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const { W, H } = L;
    if (GK.images.bg) drawCover(GK.images.bg, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(28,16,9,.5)'); g.addColorStop(1, 'rgba(28,16,9,.25)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
    drawBox();
    ctx = main;
  }

  function draw() {
    const { W, H } = L;
    renderStatic();
    S.shx = S.shake ? (Math.random() - 0.5) * S.shake : 0; S.shy = S.shake ? (Math.random() - 0.5) * S.shake : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (S.shake) { ctx.fillStyle = '#22150e'; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.drawImage(stat, Math.round(S.shx * view.dpr), Math.round(S.shy * view.dpr));
    view.reset();
    drawWorld();
    drawUI();
    if (S.flash > 0) { ctx.fillStyle = `rgba(255,248,225,${S.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
    if (S.state === 'over' && S.overT < 1.7) {
      const a = Math.min(1, S.overT * 3);
      ctx.save(); ctx.globalAlpha = a;
      const size = Math.min(56, W * 0.12);
      ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(60,25,12,.9)';
      const cy = L.oy + (BOX_H * L.s) * 0.4;
      ctx.strokeText(S.overMsg, W / 2, cy); ctx.fillStyle = '#fff2d6'; ctx.fillText(S.overMsg, W / 2, cy);
      ctx.restore();
    }
  }

  /* ---------------- input ---------------- */
  GK.pointer(cv, view, {
    down(p, e) {
      if (S.state !== 'play' || S.paused) return;
      if (inRect(p, L.teaBtn)) { toggleTea(); return; }
      if (S.teaMode) {
        const b = pickAt(toWorld(p));
        if (b) eat(b); else toggleTea(false);
        return;
      }
      S.dragging = true;
      S.aim = GK.clamp(toWorld(p).x, 0, BOX_W);
    },
    move(p, e) {
      S.hover = p;
      if (S.state !== 'play' || S.teaMode) return;
      if (S.dragging || e.pointerType === 'mouse') S.aim = GK.clamp(toWorld(p).x, 0, BOX_W);
    },
    up(p) {
      if (!S.dragging) return;
      S.dragging = false;
      if (S.state !== 'play') return;
      S.aim = GK.clamp(toWorld(p).x, 0, BOX_W);
      drop();
    },
    cancel() { S.dragging = false; },
  });
  cv.addEventListener('pointerleave', () => { S.hover = null; });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back')) return;
    if (S.state === 'play' && !S.paused) {
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter' || e.code === 'KeyS') {
        e.preventDefault();
        if (S.teaMode) eat(S.keyPick || pickColumn(S.aim)); else drop();
      } else if (e.code === 'KeyT') { toggleTea(); if (S.teaMode) S.keyPick = pickColumn(S.aim); }
      else if (e.code === 'Escape' && S.teaMode) toggleTea(false);
    }
  });

  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { GK.sfx('ok'); startGame(b.dataset.mode); }));
  $('#btnHelp').addEventListener('click', () => { GK.sfx('click'); GK.help(); });
  $('#rAgain').addEventListener('click', () => { GK.sfx('ok'); startGame(S.mode); });
  $('#rTitle').addEventListener('click', () => { GK.sfx('click'); toTitle(); });

  /* ---------------- boot ---------------- */
  GK.init({ id: ID, title: '和菓子ころりん', help: HELP, menu: openMenu });
  let acc = 0, drawnTitle = false;
  GK.loadImages([...SPR, 'bg', 'key', 'tea']).then(() => {
    SPR.forEach((n, i) => { IMG[i] = GK.images[n]; });
    layout();
    renderTitle();
    // a few sweets resting in the box behind the title
    const demo = [[5, 90], [3, 230], [7, 300], [1, 160], [4, 40], [2, 200], [0, 120]];
    demo.forEach(([t, x], i) => S.world.add(t, x, 200 - i * 60));
    for (let i = 0; i < 240; i++) S.world.step(FIX, { merge: false });
    GK.loop((dt) => {
      if (!S.paused) {
        acc += dt;
        let n = 0;
        while (acc >= FIX && n < 4) { tick(FIX); acc -= FIX; n++; }
        if (n === 4) acc = 0;
      }
      // the title covers the canvas with an opaque picture: draw once, then rest
      if (S.state !== 'title' || !drawnTitle) { draw(); drawnTitle = S.state === 'title'; }
    });
  });

  window.__wmState = () => ({ state: S.state, n: S.world.bodies.length, xs: S.world.bodies.map((b) => Math.round(b.x)), aim: Math.round(S.aim), tea: S.tea, teaMode: S.teaMode, score: S.score });
  /* ---------------- self-test (npm run game-check) ---------------- */
  window.__gameSelfTest = async function () {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG ' + m); };
    const shot = async (n) => { draw(); await GK.wait(60); if (window.__shot) await window.__shot(n); };
    while (!IMG.length) await GK.wait(50);
    S.test = true;
    // 1. two minutes of simulated play with random drops (games that overflow restart)
    startGame('free');
    let games = 1, drops = 0, maxPen = 0, steps = 0, merges = 0, bad = 0;
    for (let i = 0; i < 60 * 120; i++) {
      if (S.state === 'play' && i % 34 === 0) { S.aim = rand() * BOX_W; if (drop()) drops++; }
      tick(FIX); steps++;
      if (S.state !== 'play') { merges += S.merges; games++; startGame('free'); continue; }
      if (i % 5) continue;
      const B = S.world.bodies;
      for (const b of B) {
        if (![b.x, b.y, b.vx, b.vy, b.a, b.w].every(Number.isFinite)) bad++;
        if (b.x < b.r - 0.5 || b.x > BOX_W - b.r + 0.5 || b.y > BOX_H - b.r + 0.5) bad++;
      }
      for (let a = 0; a < B.length; a++) for (let c = a + 1; c < B.length; c++) {
        const A = B[a], C = B[c];
        if (A.r < A.tr || C.r < C.tr) continue;
        maxPen = Math.max(maxPen, (A.r + C.r - Math.hypot(A.x - C.x, A.y - C.y)) / Math.min(A.r, C.r));
      }
    }
    merges += S.merges;
    if (bad) fail(`${bad} invalid / escaped states`);
    if (maxPen > 0.35) fail('overlap ratio ' + maxPen.toFixed(2));
    if (merges < 50) fail('few merges: ' + merges);
    notes.push(`stress 120 s: ${drops} drops, ${merges} merges, ${games} games, max overlap ${(maxPen * 100).toFixed(1)}% of r`);
    // 2. merging rule: two 桜餅 side by side become a 草餅 with points
    startGame('free');
    S.order = 8;
    S.world.add(3, 150, BOX_H - 32); S.world.add(3, 214, BOX_H - 32);
    for (let i = 0; i < 30; i++) tick(FIX);
    if (!S.world.bodies.some((b) => b.tier === 4) || S.score !== PTS(4) * 1) fail('merge 桜餅+桜餅 → 草餅 (score ' + S.score + ')');
    // 3. a believable board, the お茶 and a screenshot
    startGame('free');
    const plan = [0, 0, 1, 1, 2, 0, 3, 2, 1, 4, 0, 2, 3, 1, 0, 2, 4, 1, 3, 0];
    plan.forEach((t, i) => { S.cur = t; S.aim = 40 + ((i * 97) % 330); S.cool = 0; drop(); for (let j = 0; j < 40; j++) tick(FIX); });
    for (let j = 0; j < 90; j++) tick(FIX);
    S.tea = 2;
    const n0 = S.world.bodies.length;
    toggleTea(true);
    eat(S.world.bodies[0]);
    if (S.world.bodies.length !== n0 - 1 || S.tea !== 1) fail('お茶 did not remove a sweet');
    for (let j = 0; j < 30; j++) tick(FIX);
    S.cool = 0; S.held = 1; S.aim = 220;
    notes.push(`board: ${S.world.bodies.length} sweets, score ${S.score}, top ${TIERS[S.top].name}`);
    await shot('play');
    // 4. overflow → game over → result
    S.world.add(6, 200, 20).age = 5;
    S.danger = GRACE - 0.05;
    for (let j = 0; j < 12 && S.state === 'play'; j++) tick(FIX);
    if (S.state !== 'over') fail('no game over on overflow');
    await GK.wait(150);
    if (!$('#result').classList.contains('show')) fail('result screen not shown');
    await shot('result');
    // 5. timed mode runs out
    startGame('timed');
    S.timeLeft = 0.05;
    for (let j = 0; j < 10; j++) tick(FIX);
    if (S.state !== 'over') fail('timed mode did not end');
    await GK.wait(120);
    toTitle();
    S.test = false;
    await shot('title');
    return { ok, notes };
  };
})();
