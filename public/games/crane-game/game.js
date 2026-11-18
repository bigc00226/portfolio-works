/* クレーン横丁 — the machines (pseudo-3D view), the claw, the rules, coins, 景品棚, screens. Physics in physics.js. */
(function () {
  'use strict';
  const CP = window.CranePhysics;
  const { W, D, H, HOLE, GUARD_H, BR, Pile, Bridge } = CP;
  const ID = 'crane-game';
  const FIX = 1 / 60, TOP = 44;
  const HOME = { x: (HOLE.x0 + HOLE.x1) / 2, z: (HOLE.z0 + HOLE.z1) / 2 };
  const XMAX = W / 2 - 5, ZMAX = D - 5;
  const SPEED = { x: 9, z: 7, down: 11, up: 8, back: 13 };
  const ARM_OPEN = 0.95, ARM_SHUT = 0.1, ARM_UP = 5.6, ARM_LO = 3.6;
  const PRIZES = [
    { id: 'usa', name: 'もちうさ', shape: 'ball', r: 4.6, mass: 1, c: ['#fff4f4', '#f3b8c8'] },
    { id: 'neko', name: 'ころねこ', shape: 'ball', r: 4.4, mass: 1, c: ['#ffd29a', '#e8893a'] },
    { id: 'shiba', name: 'まめしば', shape: 'ball', r: 4.8, mass: 1.1, c: ['#f6c48a', '#c97b3a'] },
    { id: 'pen', name: 'ぺんたろう', shape: 'ball', r: 4.5, mass: 1, c: ['#8da0c2', '#2f3d5c'] },
    { id: 'hiyo', name: 'ひよこまる', shape: 'ball', r: 4.0, mass: 0.8, c: ['#fff1a0', '#f2c230'] },
    { id: 'kuma', name: 'くまだんご', shape: 'ball', r: 5.2, mass: 1.3, c: ['#c99a6e', '#7a4f2e'] },
    { id: 'azarashi', name: 'ねそべりアザラシ', shape: 'long', r: 3.4, len: 15, mass: 1.35, c: ['#eef2f8', '#9fb0c4'] },
    { id: 'dachs', name: 'のびーるダックス', shape: 'long', r: 3.2, len: 16, mass: 1.35, c: ['#e6a868', '#a35f28'] },
  ];
  const BOXES = [
    { id: 'snack', name: 'おかしの大箱', w: 14, h: 5.5, d: 9, c: ['#ffcf5a', '#e2622b'] },
    { id: 'robo', name: 'ロボットのおもちゃ', w: 14, h: 5.5, d: 8.4, c: ['#8fd3ff', '#3a6fd8'] },
  ];
  const ALL = PRIZES.map((p) => ({ ...p, img: 'p-' + p.id })).concat(BOXES.map((b) => ({ ...b, img: 'box-' + b.id, box: true })));
  const MACHINES = { pile: 'ぬいぐるみの山', bridge: '橋渡し' };
  const ARMS = { 0.85: '強め', 0.65: 'ふつう', 0.47: '本格' };
  const BRIDGE_GAP = { 0.85: 11.8, 0.65: 11.4, 0.47: 11.2 }, BRIDGE_PUSH = 0.65;
  const FONT = '"Hiragino Maru Gothic ProN","Yu Gothic UI","Yu Gothic",YuGothic,Meiryo,system-ui,sans-serif';

  const $ = (s) => document.querySelector(s);
  const cv = $('#cv');
  let fitted = false;
  const view = GK.fit(cv, { onResize: () => { if (fitted) layout(); } });
  fitted = true;
  let ctx = view.ctx;
  let L = {};
  const rng = GK.rng();
  const r = () => rng();

  const HELP = `
    <p>2 ボタンのクレーンゲームです。ボタンは<b>それぞれ 1 回だけ</b>、押している間だけアームが動きます。</p>
    <h3>操作</h3>
    <table>
      <tr><th>①（右へ）</th><td>押している間、アームが右へ動きます。はなすと止まります。</td></tr>
      <tr><th>②（奥へ）</th><td>押している間、アームが奥へ動きます。はなすとアームが開いて下り、つかんで上がり、取り出し口（左手前の穴）へ戻ります。</td></tr>
      <tr><th>キーボード</th><td><kbd>→</kbd> か <kbd>1</kbd> が ①、<kbd>↑</kbd> か <kbd>2</kbd> が ②（押している間だけ）。<kbd>C</kbd> でカメラ、<kbd>Enter</kbd> で 100 円を入れます。</td></tr>
    </table>
    <p>奥行きは、<b>左上の「上から見た図」</b>、床に落ちる<b>アームの影</b>、<b>「横から見る」</b>カメラで確かめられます。</p>
    <h3>お金</h3>
    <p>100 円で 1 回、500 円で 6 回。おさいふが空になったら「両替機」でおこづかいを足せます（遊びのお金です）。やめるとき、残りの回数ぶんはお返しします。</p>
    <h3>ぬいぐるみの山</h3>
    <ul>
      <li>アームの爪が<b>ぬいぐるみの重心の両側</b>に下りて、<b>真ん中より下</b>をはさむと、しっかりつかめます。ずれるほど、上がる途中や止まった瞬間に落ちやすくなります。</li>
      <li>長いぬいぐるみは、細い向き（奥行き方向にのびている）だとつかみやすく、横向きだと爪が端にかかります。</li>
      <li>つかめなくても、押したり転がしたりして<b>取り出し口に落とす</b>のもあり。透明の仕切りを越えれば獲得です。</li>
    </ul>
    <h3>橋渡し</h3>
    <ul>
      <li>2 本の棒の上に箱が渡してあります。箱は重くて持ち上がりません。爪で<b>箱の端を押し下げたり</b>、<b>はみ出した端の下に爪を入れて持ち上げたり</b>して、少しずつ傾けてずらします。</li>
      <li>箱が棒のすき間を<b>縦に</b>通り抜けたら獲得です。</li>
    </ul>
    <h3>アームの強さ</h3>
    <p>タイトルで「強め・ふつう・本格」をえらべます。ぬいぐるみの山ではアームのつかむ力が、橋渡しでは 2 本の棒のすき間（強めほど広い）が変わります。取った景品は<b>景品棚</b>に飾られます。</p>`;

  /* ---------------- records ---------------- */
  const rec = {
    wallet: () => GK.store.get('wallet', 1000),
    shelf: () => GK.store.get('shelf', {}),
  };

  /* ---------------- state ---------------- */
  const S = {
    state: 'title', machine: 'pile', arm: 0.65, pile: null, bridge: null, credits: 0, costs: [], used: 0, wallet: rec.wallet(), spent: 0, plays: 0, won: [],
    cam: 'front', t: 0, blocked: 0, texts: [], fx: [], banner: null, restockT: 0, nextBoxT: 0, test: false, gen: 0, paused: false,
    stats: { closes: 0, touch: 0, grabs: 0, slips: 0 },
    input: { p1: false, p2: false, k1: false, k2: false, t1: false, t2: false }, hint: '', humT: 0, sessionStart: 0,
  };
  const CL = { x: HOME.x, y: TOP, z: HOME.z, a: ARM_SHUT, state: 'idle', t: 0, held: null, hold: 0, vx: 0, vy: 0, vz: 0, tips: null, used: false };
  const b1 = () => S.input.p1 || S.input.k1 || S.input.t1;
  const b2 = () => S.input.p2 || S.input.k2 || S.input.t2;

  /* ---------------- camera ---------------- */
  function makeCam(px, py, pz, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const f = [sy * cp, -sp, cy * cp], rr = [cy, 0, -sy];
    const u = [f[1] * rr[2] - f[2] * rr[1], f[2] * rr[0] - f[0] * rr[2], f[0] * rr[1] - f[1] * rr[0]];
    return { p: [px, py, pz], f, r: rr, u, F: 1, ox: 0, oy: 0 };
  }
  const CAMS = { front: makeCam(0, 54, -66, 0, 0.42), side: makeCam(84, 50, 20, -Math.PI / 2, 0.36) };
  const CAM_WIDE = { front: CAMS.front, side: CAMS.side };
  function proj(C, x, y, z) {
    const dx = x - C.p[0], dy = y - C.p[1], dz = z - C.p[2];
    const zc = dx * C.f[0] + dy * C.f[1] + dz * C.f[2];
    const xc = dx * C.r[0] + dz * C.r[2];
    const yc = dx * C.u[0] + dy * C.u[1] + dz * C.u[2];
    const k = C.F / Math.max(1, zc);
    return { x: C.ox + xc * k, y: C.oy - yc * k, s: k, z: zc };
  }
  function fitCam(C, R) {
    C.F = 1; C.ox = 0; C.oy = 0;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const x of [-W / 2, W / 2]) for (const y of [0, H]) for (const z of [0, D]) { const p = proj(C, x, y, z); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    C.F = Math.min(R.w / (x1 - x0), R.h / (y1 - y0));
    C.ox = R.x + R.w / 2 - ((x0 + x1) / 2) * C.F;
    C.oy = R.y + R.h / 2 - ((y0 + y1) / 2) * C.F;
    const w = (x1 - x0) * C.F, h = (y1 - y0) * C.F;
    return { x: R.x + (R.w - w) / 2, y: R.y + (R.h - h) / 2, w, h };
  }

  /* ---------------- layout ---------------- */
  function layout() {
    const W2 = view.w, H2 = view.h, pr = $('#panel').getBoundingClientRect();
    const side = pr.top < 2 && pr.height > H2 * 0.8;
    const area = side ? { x: 0, y: 0, w: pr.left, h: H2 } : { x: 0, y: 48, w: W2, h: pr.top - 48 }; // portrait: below the round buttons
    const pad = Math.min(area.w, area.h) * 0.05;
    const sign = Math.max(34, Math.min(56, area.h * 0.08));
    L = { W: W2, H: H2, area, side, sign };
    const room = { x: area.x + pad + 8, y: area.y + sign + pad * 0.6 + (side ? 0 : 8), w: area.w - pad * 2 - 16, h: area.h - sign - pad * 1.6 - 14 };
    // the cabinet hugs the machine: fit, then shrink the view to what the machine covers
    const used = fitCam(CAMS.front, room);
    L.view = { x: used.x - 6, y: used.y - 6, w: used.w + 12, h: used.h + 12 };
    L.guide = null;
    const spare = room.h - used.h;
    if (!side && spare > 150) { // phones: the machine at the top, a big map of it below
      const gw = Math.min(room.w * 0.62, (spare - 60) * (W / D) * 0.9);
      L.view.y = room.y + 2;
      L.guide = { x: area.x + (area.w - gw) / 2, y: L.view.y + L.view.h + 26 + (spare - 40 - gw * (D / W)) * 0.35, w: gw };
    }
    fitCam(CAMS.front, L.view);
    fitCam(CAMS.side, L.view);
    L.k = GK.clamp(Math.min(area.w, area.h) / 520, 0.7, 1.3);
    stat = {};
  }

  /* ---------------- sound ---------------- */
  const snd = {
    hum() { GK.tone({ f: 82 + Math.random() * 6, d: 0.09, type: 'sawtooth', v: 0.035 }); },
    clack() { GK.noise({ d: 0.06, v: 0.25, f: 2200, q: 3 }); GK.tone({ f: 330, f2: 180, d: 0.08, type: 'square', v: 0.06 }); },
    slip() { GK.tone({ f: 700, f2: 220, d: 0.4, type: 'triangle', v: 0.18 }); },
    get() { GK.sfx('win'); GK.tone({ f: 1568, d: 0.6, type: 'sine', v: 0.1, at: 0.6 }); },
    thud() { GK.tone({ f: 140, f2: 60, d: 0.15, type: 'sine', v: 0.3 }); },
    press() { GK.tone({ f: 520, d: 0.05, type: 'square', v: 0.06 }); },
  };
  const bars = (...b) => b.join(' | ');
  const SONG = { // an original arcade tune in the major pentatonic
    bpm: 124, steps: 2,
    tracks: [
      { type: 'square', v: 0.045, notes: bars('E5 G5 A5 G5 E5 - D5 C5', 'D5 E5 G5 - E5 - - .', 'C5 D5 E5 G5 A5 - G5 E5', 'D5 - C5 D5 E5 - - .', 'G5 A5 C6 A5 G5 - E5 G5', 'A5 G5 E5 D5 E5 - - .', 'C5 D5 E5 D5 C5 - A4 C5', 'D5 - - . C5 - - .') },
      { type: 'triangle', v: 0.12, notes: bars('C3 . G3 . C3 . G3 .', 'A2 . E3 . A2 . E3 .', 'F2 . C3 . F2 . C3 .', 'G2 . D3 . G2 . D3 .', 'C3 . G3 . C3 . G3 .', 'A2 . E3 . A2 . E3 .', 'F2 . C3 . G2 . D3 .', 'C3 . G2 . C3 . . .') },
    ],
    drums: { k: bars('x . . . x . . .', 'x . . . x . . .', 'x . . . x . . .', 'x . . . x . x .'), h: bars('. x . x . x . x', '. x . x . x . x', '. x . x . x . x', '. x . x . x x x') },
  };

  /* ---------------- machines ---------------- */
  const pickPrize = () => PRIZES[Math.floor(r() * PRIZES.length)];
  function fillPile(n, fromTop) {
    for (let i = 0; i < n; i++) S.pile.add(pickPrize(), { x: -6 + r() * 30, y: fromTop ? 40 + i * 5 : 6 + i * 4.2, z: 9 + r() * 25, yaw: r() * Math.PI });
  }
  function startMachine(machine, arm) {
    S.gen++;
    Object.assign(S, { state: 'play', machine, arm, credits: 0, costs: [], used: 0, spent: 0, plays: 0, won: [], texts: [], fx: [], banner: null, restockT: 0, nextBoxT: 0, hint: '' });
    Object.assign(CL, { x: HOME.x, y: TOP, z: HOME.z, a: ARM_SHUT, state: 'idle', t: 0, held: null, hold: 0, vx: 0, vy: 0, vz: 0, tips: null });
    if (machine === 'pile') {
      S.pile = new Pile(); S.bridge = null;
      fillPile(14);
      for (let i = 0; i < 300; i++) { const res = S.pile.step(FIX, []); if (res.won.length) fillPile(res.won.length, true); }
    } else {
      // the bridge: the claw always pushes the same; the setting changes the gap between the bars (wider = easier)
      BR.gap = BRIDGE_GAP[arm] || 11.4;
      S.bridge = new Bridge(); S.pile = null;
      S.bridge.setBox(BOXES[Math.floor(r() * BOXES.length)], (r() - 0.5) * 1.2);
      for (let i = 0; i < 90; i++) S.bridge.step(FIX, [], BRIDGE_PUSH);
    }
    $('#title').classList.remove('show');
    $('#result').classList.remove('show');
    $('#panel').style.visibility = 'visible';
    layout();
    syncUI();
    if (!S.test) GK.music.play(SONG);
  }

  /* ---------------- coins ---------------- */
  function insert(yen) {
    if (S.state !== 'play') return;
    if (S.wallet < yen) { GK.toast('おさいふのお金が足りません'); GK.sfx('ng'); return; }
    S.wallet -= yen; S.spent += yen;
    if (yen === 500) for (let i = 0; i < 6; i++) S.costs.push(500 / 6); else S.costs.push(100);
    S.credits = S.costs.length;
    if (!S.test) GK.store.set('wallet', S.wallet);
    GK.sfx('coin');
    syncUI();
  }
  function refill() {
    S.wallet += 1000;
    if (!S.test) { GK.store.set('wallet', S.wallet); GK.store.set('refills', GK.store.get('refills', 0) + 1); }
    GK.sfx('coin'); GK.toast('両替機でおこづかいを 1,000 円もらいました');
    syncUI();
  }

  /* ---------------- the claw ---------------- */
  function arms(c) {
    const out = [];
    for (const s of [-1, 1]) {
      const px = c.x + s * 1.4, py = c.y - 1.2;
      const ex = px + s * Math.sin(c.a) * ARM_UP, ey = py - Math.cos(c.a) * ARM_UP;
      const b = c.a - 0.62;
      out.push({ s, px, py, ex, ey, tx: ex + s * Math.sin(b) * ARM_LO, ty: ey - Math.cos(b) * ARM_LO });
    }
    return out;
  }
  function colliders(dt) {
    const A = arms(CL), prev = CL.tips;
    const list = [{ x: CL.x, y: CL.y, z: CL.z, r: 2.2, vx: CL.vx, vy: CL.vy }];
    A.forEach((a, i) => {
      list.push({ x: a.ex, y: a.ey, z: CL.z, r: 0.9, vx: CL.vx, vy: CL.vy, noBlock: S.machine === 'pile' });
      const vx = prev ? (a.tx - prev[i].x) / dt : 0, vy = prev ? (a.ty - prev[i].y) / dt : 0;
      list.push({ x: a.tx, y: a.ty, z: CL.z, r: 1.1, vx, vy, tip: true, noBlock: S.machine === 'pile' });
    });
    CL.tips = A.map((a) => ({ x: a.tx, y: a.ty }));
    return list;
  }
  function tipLow() { const A = arms(CL); return Math.min(A[0].ty, A[1].ty); }

  /** called every step while the arms close: the moment both tips squeeze the same plush, the arms grip (or slide off) */
  function tryGrab(final) {
    const A = arms(CL), tips = A.map((a) => ({ x: a.tx, y: a.ty, z: CL.z }));
    let best = null;
    for (const pr of S.pile.prizes) {
      let tl = Infinity, tr = Infinity;
      for (const p of pr.parts) {
        tl = Math.min(tl, Math.hypot(p.x - tips[0].x, p.y - tips[0].y, p.z - tips[0].z) - p.r - 1.1);
        tr = Math.min(tr, Math.hypot(p.x - tips[1].x, p.y - tips[1].y, p.z - tips[1].z) - p.r - 1.1);
      }
      if (tl > 0.5 || tr > 0.5) continue;
      const c = S.pile.com(pr), K = pr.kind;
      const off = Math.hypot(c.x - CL.x, c.z - CL.z);
      let span = K.r * 1.25;
      if (K.shape === 'long') { const a = pr.parts[0], e = pr.parts[2], along = Math.abs(e.x - a.x) / (Math.hypot(e.x - a.x, e.z - a.z) || 1); span = K.r * 1.3 + (1 - along) * K.len * 0.3; if (along > 0.7) span *= 0.7; }
      const below = Math.max(tips[0].y, tips[1].y) < c.y + K.r * 0.25;
      const q = GK.clamp(1 - off / span, 0, 1) * (below ? 1 : 0.4);
      if (!best || q > best.q) best = { pr, q };
    }
    if (final) S.stats.closes++;
    if (!best) return;
    if (CL.tried) return;
    CL.tried = true;
    S.stats.touch++;
    const hold = S.arm * (0.5 + 0.5 * best.q) - (best.pr.kind.mass - 1) * 0.12;
    if (hold < 0.3) { text(CL.x, CL.y - 9, 'つかめない…', '#fff'); return; }
    const pr = best.pr;
    pr.held = true;
    for (const p of pr.parts) { p.ox = (p.x - CL.x) * 0.7; p.oy = p.y - CL.y; p.oz = (p.z - CL.z) * 0.7; }
    CL.held = pr; CL.hold = hold;
    S.stats.grabs++;
  }
  function letGo(kind) {
    const pr = CL.held;
    if (!pr) return;
    pr.held = false;
    for (const p of pr.parts) { p.vx = CL.vx + (r() - 0.5) * 8; p.vy = CL.vy; p.vz = CL.vz + (r() - 0.5) * 8; p.px = p.x; p.py = p.y; p.pz = p.z; }
    CL.held = null;
    if (kind === 'slip') { text(CL.x, CL.y - 6, 'あっ！', '#ffe36b'); snd.slip(); S.stats.slips++; }
  }
  function slipCheck(dt, f) { if (CL.held && r() < Math.max(0, 0.78 - CL.hold) * 1.25 * f * dt) letGo('slip'); }

  function updateClaw(dt) {
    const ox = CL.x, oy = CL.y, oz = CL.z;
    const moving = (sp) => { S.humT -= dt; if (S.humT <= 0 && !S.test) { snd.hum(); S.humT = 0.085; } return sp; };
    switch (CL.state) {
      case 'idle':
        if (b1() && S.credits > 0 && S.state === 'play') { S.used += S.costs.shift(); S.credits = S.costs.length; S.plays++; CL.state = 'x'; snd.press(); syncUI(); }
        break;
      case 'x':
        if (b1() && CL.x < XMAX) CL.x = Math.min(XMAX, CL.x + moving(SPEED.x) * dt);
        else { CL.state = 'wz'; CL.t = 0; syncUI(); }
        break;
      case 'wz':
        CL.t += dt;
        if (b2()) { CL.state = 'z'; snd.press(); syncUI(); } else if (CL.t > 12) { CL.state = 'open'; CL.t = 0; syncUI(); }
        break;
      case 'z':
        if (b2() && CL.z < ZMAX) CL.z = Math.min(ZMAX, CL.z + moving(SPEED.z) * dt);
        else { CL.state = 'open'; CL.t = 0; syncUI(); }
        break;
      case 'open':
        CL.t += dt; CL.a = GK.lerp(ARM_SHUT, ARM_OPEN, GK.ease.inOutQuad(Math.min(1, CL.t / 0.5)));
        if (CL.t >= 0.6) CL.state = 'down';
        break;
      case 'down': {
        CL.y -= moving(SPEED.down) * dt;
        const low = tipLow();
        let stop = S.blocked > 0.3 || CL.y < 9.5;
        if (S.machine === 'pile') stop = stop || (low <= 0.9 && !CP.inHole(CL.x, CL.z));
        else {
          const onBars = CL.z > BR.z0 - 1 && CL.z < BR.z1 + 1 && arms(CL).some((a) => Math.abs(a.tx - (BR.x - BR.gap / 2)) < 2 || Math.abs(a.tx - (BR.x + BR.gap / 2)) < 2) && low < BR.y + BR.r + 1.1;
          stop = stop || onBars || low < 11;
        }
        if (stop) { CL.state = 'close'; CL.t = 0; CL.tried = false; if (!S.test) snd.clack(); }
        break;
      }
      case 'close':
        CL.t += dt;
        if (S.pile && !CL.held) tryGrab(false);
        if (!CL.held) CL.a = GK.lerp(ARM_OPEN, ARM_SHUT, GK.ease.inOutQuad(Math.min(1, CL.t / 0.9))); // a gripping arm stops closing
        if (CL.t >= 1.15) { if (S.pile) { CL.tried = false; S.stats.closes++; } CL.state = 'up'; CL.t = 0; if (!S.test) snd.clack(); }
        break;
      case 'up':
        CL.y += moving(SPEED.up) * dt;
        slipCheck(dt, 1);
        if (CL.y >= TOP) {
          CL.y = TOP; CL.state = 'back';
          if (CL.held && r() < Math.max(0, 0.72 - CL.hold) * 1.1) letGo('slip'); // the jolt at the top
        }
        break;
      case 'back': {
        const dx = HOME.x - CL.x, dz = HOME.z - CL.z, step = moving(SPEED.back) * dt;
        CL.x += GK.clamp(dx, -step, step); CL.z += GK.clamp(dz, -step, step);
        slipCheck(dt, 0.45);
        if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) { CL.state = 'drop'; CL.t = 0; }
        break;
      }
      case 'drop':
        CL.t += dt; CL.a = GK.lerp(ARM_SHUT, ARM_OPEN, Math.min(1, CL.t / 0.4));
        if (CL.held && CL.t > 0.15) letGo('drop');
        if (CL.t > 1.2) { CL.state = 'shut'; CL.t = 0; }
        break;
      case 'shut':
        CL.t += dt; CL.a = GK.lerp(ARM_OPEN, ARM_SHUT, Math.min(1, CL.t / 0.5));
        if (CL.t > 0.6) { CL.a = ARM_SHUT; CL.state = 'idle'; syncUI(); if (!S.credits && !S.test) GK.toast('100 円を入れると、もう 1 回遊べます'); }
        break;
    }
    CL.vx = (CL.x - ox) / dt; CL.vy = (CL.y - oy) / dt; CL.vz = (CL.z - oz) / dt;
    if (CL.held) {
      const sw = Math.sin(S.t * 7) * (CL.state === 'back' ? 0.5 : 0.2);
      for (const p of CL.held.parts) { p.x = CL.x + p.ox + sw; p.y = CL.y + p.oy; p.z = CL.z + p.oz; p.px = p.x; p.py = p.y; p.pz = p.z; }
    }
  }

  function onWin(kind) {
    const K = ALL.find((a) => a.id === kind.id);
    S.won.push(K.id);
    const shelf = rec.shelf();
    const first = !shelf[K.id];
    shelf[K.id] = (shelf[K.id] || 0) + 1;
    if (!S.test) GK.store.set('shelf', shelf);
    S.banner = { K, t: 0, first };
    snd.get();
    for (let i = 0; i < 40; i++) S.fx.push({ x: L.view.x + L.view.w * (0.2 + r() * 0.6), y: L.view.y + L.view.h * 0.3, vx: (r() - 0.5) * 500, vy: -200 - r() * 300, t: 0, life: 1.4 + r(), c: ['#ff4f8b', '#ffd23f', '#52d1ff', '#8cf07a', '#fff'][i % 5], s: 4 + r() * 4, rot: r() * 6 });
  }

  /* ---------------- step ---------------- */
  function tick(dt) {
    S.t += dt;
    if (S.state === 'play' || S.state === 'result') {
      updateClaw(dt);
      const cols = colliders(dt);
      if (S.pile) {
        const res = S.pile.step(dt, CL.state === 'idle' ? [] : cols);
        S.blocked = res.blocked;
        for (const pr of res.won) onWin(pr.kind);
        if (S.pile.prizes.length < 9 && CL.state === 'idle') { S.restockT += dt; if (S.restockT > 1.5) { S.restockT = 0; fillPile(4, true); if (!S.test) GK.toast('店員さんが景品を足してくれました'); } }
      } else if (S.bridge) {
        const res = S.bridge.step(dt, cols, BRIDGE_PUSH);
        S.blocked = res.blocked;
        if (res.won) { onWin(S.bridge.box.kind); S.nextBoxT = 2.4; }
        const B = S.bridge.box;
        if (B.won) B.y -= 30 * dt;
        if (S.nextBoxT > 0) { S.nextBoxT -= dt; if (S.nextBoxT <= 0) { S.bridge.setBox(BOXES[Math.floor(r() * BOXES.length)], (r() - 0.5) * 1.2); if (!S.test) GK.toast('新しい箱がセットされました'); } }
      }
    }
    if (S.banner) { S.banner.t += dt; if (S.banner.t > 2.6) S.banner = null; }
    for (const p of S.fx) { p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 6; }
    S.fx = S.fx.filter((p) => p.t < p.life);
    for (const x of S.texts) x.t += dt;
    S.texts = S.texts.filter((x) => x.t < 1.2);
  }
  function text(x, y, s, c) { S.texts.push({ x, y, z: CL.z, s, c, t: 0 }); }

  /* ---------------- UI sync ---------------- */
  function syncUI() {
    $('#credit').textContent = S.credits;
    $('#wallet').textContent = GK.fmt(S.wallet);
    $('#c100').disabled = S.wallet < 100;
    $('#c500').disabled = S.wallet < 500;
    $('#refill').classList.toggle('on', S.wallet < 100);
    const can1 = (CL.state === 'idle' && S.credits > 0) || CL.state === 'x';
    const can2 = CL.state === 'wz' || CL.state === 'z';
    $('#b1').disabled = !can1; $('#b2').disabled = !can2;
    $('#b1').classList.toggle('ready', CL.state === 'idle' && S.credits > 0);
    $('#b2').classList.toggle('ready', CL.state === 'wz');
    S.hint = CL.state === 'idle' ? (S.credits > 0 ? '① を押して、右へ動かそう' : '100 円を入れてね') : CL.state === 'x' ? '① をはなすと止まります' : CL.state === 'wz' ? '② を押して、奥へ動かそう' : CL.state === 'z' ? '② をはなすと、アームが下ります' : '';
  }

  /* ---------------- drawing ---------------- */
  const font = (px, w = 800) => `${w} ${Math.round(px)}px ${FONT}`;
  let stat = {};
  function quad(C, pts, fill, stroke, lw) {
    ctx.beginPath();
    pts.forEach((p, i) => { const q = proj(C, p[0], p[1], p[2]); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  function line3(C, a, b, color, w) { const p = proj(C, ...a), q = proj(C, ...b); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  function drawCover(img, x, y, w, h) { const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s; ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h); }

  function drawStatic(C) {
    const A = L.area, V = L.view;
    if (GK.images.bg) drawCover(GK.images.bg, 0, 0, L.W, L.H);
    ctx.fillStyle = 'rgba(20,8,36,.45)'; ctx.fillRect(0, 0, L.W, L.H);
    // the cabinet
    const fx0 = V.x - 12, fy0 = V.y - 12, fw = V.w + 24, fh = V.h + 24;
    const g = ctx.createLinearGradient(0, fy0, 0, fy0 + fh);
    g.addColorStop(0, '#ff8cc0'); g.addColorStop(1, '#d93a7c');
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(fx0 + 6, fy0 - L.sign + 10, fw, fh + L.sign, 22); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(fx0, fy0 - L.sign + 4, fw, fh + L.sign - 4, 22); ctx.fill();
    // sign
    ctx.fillStyle = '#2a1036'; ctx.beginPath(); ctx.roundRect(fx0 + 14, fy0 - L.sign + 12, fw - 28, L.sign - 16, 12); ctx.fill();
    ctx.font = font(Math.min(L.sign * 0.5, 26)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff36b'; ctx.shadowColor = '#ff4f8b'; ctx.shadowBlur = 12;
    ctx.fillText('クレーン横丁 ・ ' + MACHINES[S.machine], fx0 + fw / 2, fy0 - L.sign / 2 + 4);
    ctx.shadowBlur = 0;
    // the inside
    ctx.save(); ctx.beginPath(); ctx.roundRect(V.x - 4, V.y - 4, V.w + 8, V.h + 8, 14); ctx.clip();
    ctx.fillStyle = '#2b1640'; ctx.fillRect(V.x - 4, V.y - 4, V.w + 8, V.h + 8);
    const bw = ctx.createLinearGradient(0, proj(C, 0, H, D).y, 0, proj(C, 0, 0, D).y);
    bw.addColorStop(0, '#ffd6ea'); bw.addColorStop(1, '#ffb3d3');
    quad(C, [[-W / 2, 0, D], [W / 2, 0, D], [W / 2, H, D], [-W / 2, H, D]], C === CAMS.side ? '#f7c4dc' : bw);
    quad(C, [[-W / 2, 0, 0], [-W / 2, 0, D], [-W / 2, H, D], [-W / 2, H, 0]], '#f5b5d2');
    quad(C, [[W / 2, 0, 0], [W / 2, 0, D], [W / 2, H, D], [W / 2, H, 0]], C === CAMS.side ? '#ffd6ea' : '#efa6c8');
    quad(C, [[-W / 2, H, 0], [W / 2, H, 0], [W / 2, H, D], [-W / 2, H, D]], '#3a2050');
    quad(C, [[-W / 2, 0, 0], [W / 2, 0, 0], [W / 2, 0, D], [-W / 2, 0, D]], '#fff1f7');
    ctx.globalAlpha = 0.35;
    for (let x = -W / 2 + 5; x < W / 2; x += 5) line3(C, [x, 0.01, 0], [x, 0.01, D], '#f2bcd5', 1);
    for (let z = 5; z < D; z += 5) line3(C, [-W / 2, 0.01, z], [W / 2, 0.01, z], '#f2bcd5', 1);
    ctx.globalAlpha = 1;
    // stars on the back wall
    if (C === CAMS.front) for (let i = 0; i < 9; i++) { const p = proj(C, -26 + i * 6.5, 30 + Math.sin(i * 2.1) * 9, D - 0.1); ctx.fillStyle = i % 2 ? '#fff6b0' : '#ffffff'; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 * p.s, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // the chute (取り出し口)
    quad(C, [[HOLE.x0, 0.02, HOLE.z0], [HOLE.x1, 0.02, HOLE.z0], [HOLE.x1, 0.02, HOLE.z1], [HOLE.x0, 0.02, HOLE.z1]], '#1a0c26');
    quad(C, [[HOLE.x0, -12, HOLE.z1], [HOLE.x1, -12, HOLE.z1], [HOLE.x1, 0, HOLE.z1], [HOLE.x0, 0, HOLE.z1]], '#2c1640');
    // the bridge: pit, posts and bars (the part behind the box)
    if (S.machine === 'bridge') {
      const xa = BR.x - BR.gap / 2, xb = BR.x + BR.gap / 2;
      quad(C, [[xa, 0.03, BR.z0], [xb, 0.03, BR.z0], [xb, 0.03, BR.z1], [xa, 0.03, BR.z1]], '#1a0c26');
      quad(C, [[BR.x - BR.wall, 0, BR.z1 + 1], [BR.x + BR.wall, 0, BR.z1 + 1], [BR.x + BR.wall, BR.y - 4, BR.z1 + 1], [BR.x - BR.wall, BR.y - 4, BR.z1 + 1]], '#c86aa0');
      for (const x of [xa, xb]) for (const z of [BR.z0, BR.z1]) line3(C, [x, 0, z], [x, BR.y, z], '#b8bfcc', 2.2 * proj(C, x, 0, z).s);
      for (const x of [BR.x - BR.wall, BR.x + BR.wall]) quad(C, [[x, BR.y - 4, BR.z0], [x, BR.y + 9, BR.z0], [x, BR.y + 9, BR.z1], [x, BR.y - 4, BR.z1]], 'rgba(255,255,255,.18)', 'rgba(255,255,255,.4)', 1);
      drawBars(C, (BR.z0 + BR.z1) / 2 - 4.5, BR.z1);
    }
    ctx.restore();
  }
  function drawBars(C, z0, z1) {
    for (const x of [BR.x - BR.gap / 2, BR.x + BR.gap / 2]) {
      const s = proj(C, x, BR.y, (z0 + z1) / 2).s;
      line3(C, [x, BR.y, z0], [x, BR.y, z1], '#8d97a8', 2 * BR.r * s);
      line3(C, [x, BR.y + BR.r * 0.4, z0], [x, BR.y + BR.r * 0.4, z1], 'rgba(255,255,255,.75)', 0.5 * s);
    }
  }

  function drawPrize(C, pr) {
    const K = pr.kind, img = GK.images['p-' + K.id];
    if (K.shape === 'ball') {
      const p = pr.parts[0], P = proj(C, p.x, p.y, p.z), sz = 2 * p.r * P.s * 1.12;
      ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(Math.sin(pr.roll) * 0.5); ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz); ctx.restore();
    } else {
      const a = pr.parts[0], e = pr.parts[2], m = pr.parts[1];
      const A = proj(C, a.x, a.y, a.z), E = proj(C, e.x, e.y, e.z), M = proj(C, m.x, m.y, m.z);
      let ang = Math.atan2(E.y - A.y, E.x - A.x);
      if (Math.cos(ang) < 0) ang += Math.PI;
      const th = 2 * K.r * M.s * 1.2, len = Math.max(th * 1.1, Math.hypot(E.x - A.x, E.y - A.y) + th);
      ctx.save(); ctx.translate(M.x, M.y); ctx.rotate(ang); ctx.drawImage(img, -len / 2, -th / 2, len, th); ctx.restore();
    }
  }
  function drawBox(C, B) {
    const c = Math.cos(B.a), s = Math.sin(B.a);
    const P = (lx, ly, lz) => [B.x + lx * c - ly * s, B.y + lx * s + ly * c, B.z + lz];
    const V = [];
    for (const lz of [-B.hd, B.hd]) for (const [lx, ly] of [[-B.hx, -B.hy], [B.hx, -B.hy], [B.hx, B.hy], [-B.hx, B.hy]]) V.push(P(lx, ly, lz));
    const faces = [
      { i: [0, 1, 2, 3], n: [0, 0, -1], art: true }, { i: [5, 4, 7, 6], n: [0, 0, 1], art: true },
      { i: [3, 2, 6, 7], n: [-s, c, 0], top: true }, { i: [4, 5, 1, 0], n: [s, -c, 0] },
      { i: [1, 5, 6, 2], n: [c, s, 0] }, { i: [4, 0, 3, 7], n: [-c, -s, 0] },
    ];
    const K = B.kind, img = GK.images['box-' + K.id];
    const list = [];
    for (const f of faces) {
      const pts = f.i.map((k) => V[k]);
      const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4, cz = pts.reduce((a, p) => a + p[2], 0) / 4;
      const vis = (C.p[0] - cx) * f.n[0] + (C.p[1] - cy) * f.n[1] + (C.p[2] - cz) * f.n[2];
      if (vis > 0) list.push({ f, pts, d: proj(C, cx, cy, cz).z });
    }
    list.sort((a, b) => b.d - a.d);
    for (const { f, pts } of list) {
      const light = 0.75 + 0.25 * (f.n[1] * 0.8 - f.n[0] * 0.3 - f.n[2] * 0.2);
      quad(C, pts, shade(K.c[f.top ? 0 : 1], light), 'rgba(0,0,0,.25)', 1);
      if (f.art && img) { // the box art, mapped onto the face
        const p0 = proj(C, ...pts[3]), p1 = proj(C, ...pts[2]), p3 = proj(C, ...pts[0]);
        const iw = img.width, ih = img.height, d = view.dpr;
        ctx.save();
        ctx.setTransform(((p1.x - p0.x) / iw) * d, ((p1.y - p0.y) / iw) * d, ((p3.x - p0.x) / ih) * d, ((p3.y - p0.y) / ih) * d, p0.x * d, p0.y * d);
        ctx.globalAlpha = 0.95; ctx.drawImage(img, 0, 0);
        ctx.restore(); view.reset();
      }
    }
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function drawClaw(C) {
    const top = H - 3, car = proj(C, CL.x, top, CL.z);
    line3(C, [-W / 2, top, CL.z], [W / 2, top, CL.z], '#9aa3b5', 2.2 * car.s);
    ctx.fillStyle = '#5c6478'; ctx.beginPath(); ctx.roundRect(car.x - 3 * car.s, car.y - 1.5 * car.s, 6 * car.s, 3 * car.s, 2); ctx.fill();
    const B = proj(C, CL.x, CL.y, CL.z);
    line3(C, [CL.x, top, CL.z], [CL.x, CL.y + 2, CL.z], '#3a3046', Math.max(1.2, 0.35 * B.s));
    const A = arms(CL);
    for (const a of A) {
      const p = proj(C, a.px, a.py, CL.z), e = proj(C, a.ex, a.ey, CL.z), t = proj(C, a.tx, a.ty, CL.z);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#7d6a2a'; ctx.lineWidth = 1.6 * B.s;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(e.x, e.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      ctx.strokeStyle = '#f2d36b'; ctx.lineWidth = 0.9 * B.s;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(e.x, e.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      ctx.fillStyle = '#ffeaa0'; ctx.beginPath(); ctx.arc(t.x, t.y, 0.9 * B.s, 0, Math.PI * 2); ctx.fill();
    }
    const g = ctx.createRadialGradient(B.x - 0.8 * B.s, B.y - 0.8 * B.s, 0.2 * B.s, B.x, B.y, 2.4 * B.s);
    g.addColorStop(0, '#fff6c4'); g.addColorStop(0.5, '#f2c84b'); g.addColorStop(1, '#a87a12');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(B.x, B.y, 2.3 * B.s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5a10'; ctx.beginPath(); ctx.ellipse(B.x, B.y - 2 * B.s, 1.2 * B.s, 0.5 * B.s, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawScene() {
    const C = CAMS[S.cam], V = L.view;
    const key = S.cam + S.machine;
    if (!stat[key] || stat[key].width !== cv.width || stat[key].height !== cv.height) {
      const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
      const g = c.getContext('2d'); g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      const main = ctx; ctx = g; drawStatic(C); ctx = main;
      stat[key] = c;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(stat[key], 0, 0); view.reset();
    ctx.save(); ctx.beginPath(); ctx.roundRect(V.x - 4, V.y - 4, V.w + 8, V.h + 8, 14); ctx.clip();
    // shadows on the floor
    const sh = (x, z, rr, y) => {
      if (CP.inHole(x, z)) return;
      const p = proj(C, x, 0.05, z), k = GK.clamp(1 - y / 50, 0.25, 1);
      ctx.fillStyle = `rgba(90,30,70,${0.22 * k})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, rr * p.s * 1.05, rr * p.s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    };
    if (S.pile) for (const p of S.pile.parts) sh(p.x, p.z, p.r, p.y);
    sh(CL.x, CL.z, 3.4, CL.y);
    if (S.cam === 'front' || true) { const p = proj(C, CL.x, 0.06, CL.z); ctx.strokeStyle = 'rgba(255,60,120,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, 1.2 * p.s, 0.5 * p.s, 0, 0, Math.PI * 2); ctx.stroke(); }
    // depth-sorted items
    const items = [];
    if (S.pile) for (const pr of S.pile.prizes) { const c = S.pile.com(pr); items.push({ d: proj(C, c.x, c.y, c.z).z, f: () => drawPrize(C, pr) }); }
    if (S.bridge && S.bridge.box) {
      const B = S.bridge.box;
      items.push({ d: proj(C, B.x, B.y, B.z).z, f: () => drawBox(C, B) });
      items.push({ d: proj(C, BR.x, BR.y, BR.z0 + 2).z, f: () => drawBars(C, BR.z0, (BR.z0 + BR.z1) / 2 - 4.5) });
    }
    items.push({ d: proj(C, CL.x, CL.y - 4, CL.z).z - 3, f: () => drawClaw(C) });
    items.push({ d: proj(C, (HOLE.x0 + HOLE.x1) / 2, 2, HOLE.z1).z, f: () => quad(C, [[HOLE.x0, 0, HOLE.z1], [HOLE.x1, 0, HOLE.z1], [HOLE.x1, GUARD_H, HOLE.z1], [HOLE.x0, GUARD_H, HOLE.z1]], 'rgba(220,240,255,.28)', 'rgba(255,255,255,.75)', 1.5) });
    items.push({ d: proj(C, HOLE.x1, 2, HOLE.z1 / 2).z - 1, f: () => quad(C, [[HOLE.x1, 0, 0], [HOLE.x1, 0, HOLE.z1], [HOLE.x1, GUARD_H, HOLE.z1], [HOLE.x1, GUARD_H, 0]], 'rgba(220,240,255,.28)', 'rgba(255,255,255,.75)', 1.5) });
    items.sort((a, b) => b.d - a.d);
    for (const it of items) it.f();
    for (const x of S.texts) {
      const p = proj(C, x.x, x.y + x.t * 6, x.z);
      ctx.globalAlpha = 1 - x.t / 1.2; ctx.font = font(18 * L.k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = '#3a1036'; ctx.strokeText(x.s, p.x, p.y); ctx.fillStyle = x.c; ctx.fillText(x.s, p.x, p.y); ctx.globalAlpha = 1;
    }
    // glass
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.beginPath(); ctx.moveTo(V.x + V.w * 0.12, V.y); ctx.lineTo(V.x + V.w * 0.3, V.y); ctx.lineTo(V.x + V.w * 0.12, V.y + V.h); ctx.lineTo(V.x - V.w * 0.06, V.y + V.h); ctx.fill();
    ctx.restore();
    if (S.cam === 'side') {
      ctx.font = font(13 * L.k, 700); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textBaseline = 'bottom';
      const f = proj(C, W / 2, 0, 0), b = proj(C, W / 2, 0, D);
      ctx.textAlign = 'center'; ctx.fillText('手前', f.x, V.y + V.h - 4); ctx.fillText('奥', b.x, V.y + V.h - 4);
    }
  }

  function drawGuide() { // the mini map: seen from above
    const V = L.view, k = L.k, gw = L.guide ? L.guide.w : Math.min(140 * k, V.w * 0.32), gh = gw * (D / W), x0 = L.guide ? L.guide.x : V.x + 8, y0 = L.guide ? L.guide.y : V.y + 8;
    const tx = (x) => x0 + ((x + W / 2) / W) * gw, tz = (z) => y0 + gh - (z / D) * gh;
    ctx.fillStyle = 'rgba(30,12,44,.72)'; ctx.beginPath(); ctx.roundRect(x0 - 6, y0 - 18 * k, gw + 12, gh + 24 * k, 10); ctx.fill();
    ctx.font = font(10 * k, 700); ctx.fillStyle = '#ffb3d6'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('上から見た図', x0, y0 - 9 * k);
    ctx.fillStyle = '#fff1f7'; ctx.fillRect(x0, y0, gw, gh);
    ctx.fillStyle = '#1a0c26'; ctx.fillRect(tx(HOLE.x0), tz(HOLE.z1), tx(HOLE.x1) - tx(HOLE.x0), tz(0) - tz(HOLE.z1));
    if (S.bridge) {
      ctx.fillStyle = '#3a1e4a'; ctx.fillRect(tx(BR.x - BR.gap / 2), tz(BR.z1), tx(BR.x + BR.gap / 2) - tx(BR.x - BR.gap / 2), tz(BR.z0) - tz(BR.z1));
      ctx.strokeStyle = '#8d97a8'; ctx.lineWidth = 2;
      for (const x of [BR.x - BR.gap / 2, BR.x + BR.gap / 2]) { ctx.beginPath(); ctx.moveTo(tx(x), tz(BR.z0)); ctx.lineTo(tx(x), tz(BR.z1)); ctx.stroke(); }
      const B = S.bridge.box;
      if (B && !B.won) { const ex = B.hx * Math.abs(Math.cos(B.a)) + B.hy * Math.abs(Math.sin(B.a)); ctx.fillStyle = B.kind.c[1]; ctx.globalAlpha = 0.85; ctx.fillRect(tx(B.x - ex), tz(B.z + B.hd), tx(B.x + ex) - tx(B.x - ex), tz(B.z - B.hd) - tz(B.z + B.hd)); ctx.globalAlpha = 1; }
    }
    if (S.pile) for (const p of S.pile.parts) { ctx.fillStyle = p.pr.kind.c[1]; ctx.beginPath(); ctx.arc(tx(p.x), tz(p.z), Math.max(1.5, (p.r / W) * gw), 0, Math.PI * 2); ctx.fill(); }
    const cx = tx(CL.x), cz = tz(CL.z), span = ((7.1 + 1.1) / W) * gw;
    ctx.strokeStyle = '#ff2f6d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - span, cz); ctx.lineTo(cx + span, cz); ctx.moveTo(cx, cz - 4); ctx.lineTo(cx, cz + 4); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cz, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#ff2f6d'; ctx.fill();
  }

  function draw() {
    view.clear();
    drawScene();
    drawGuide();
    const V = L.view;
    if (S.hint && S.state === 'play') {
      ctx.font = font(14 * L.k, 700); const w = ctx.measureText(S.hint).width + 28;
      const x = V.x + V.w - w - 8, y = V.y + 8;
      ctx.fillStyle = 'rgba(30,12,44,.78)'; ctx.beginPath(); ctx.roundRect(x, y, w, 28 * L.k, 14 * L.k); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.hint, x + w / 2, y + 14 * L.k);
    }
    for (const p of S.fx) { ctx.save(); ctx.globalAlpha = Math.min(1, (p.life - p.t) * 2); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
    if (S.banner) {
      const b = S.banner, e = GK.ease.outBack(Math.min(1, b.t / 0.4)), a = b.t > 2.2 ? (2.6 - b.t) / 0.4 : 1;
      const cx = V.x + V.w / 2, cy = V.y + V.h * 0.42, img = GK.images[b.K.img];
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(cx, cy); ctx.scale(e, e);
      const bw = Math.min(V.w * 0.8, 340 * L.k), bh = bw * 0.55;
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 22); ctx.fill();
      ctx.strokeStyle = '#ff4f8b'; ctx.lineWidth = 5; ctx.stroke();
      const isz = bh * 0.62;
      if (img) { const iw = b.K.box || b.K.shape === 'long' ? isz * 1.6 : isz; ctx.drawImage(img, -bw / 2 + 18, -isz / 2 + 6, iw * (b.K.box ? 1 : 1), isz * (b.K.box ? 0.8 : b.K.shape === 'long' ? 0.8 : 1)); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tx = (b.K.box || b.K.shape === 'long' ? 0.24 : 0.16) * bw;
      ctx.font = font(bh * 0.24); ctx.fillStyle = '#ff2f6d'; ctx.fillText('ゲット！', tx, -bh * 0.16);
      ctx.font = font(Math.min(bh * 0.13, 20), 700); ctx.fillStyle = '#4a1d3a';
      let nm = b.K.name; const maxW = bw * 0.5; let fs = Math.min(bh * 0.13, 20); while (ctx.measureText(nm).width > maxW && fs > 9) { fs--; ctx.font = font(fs, 700); }
      ctx.fillText(nm, tx, bh * 0.08);
      if (b.first) { ctx.font = font(Math.min(bh * 0.1, 14), 700); ctx.fillStyle = '#e2622b'; ctx.fillText('はじめての景品！', tx, bh * 0.28); }
      ctx.restore();
    }
  }

  /* ---------------- screens ---------------- */
  function quit() {
    if (S.state !== 'play') return;
    if (CL.state !== 'idle') { GK.toast('アームが戻ってから、やめられます'); return; }
    const left = S.credits, refund = Math.round(S.costs.reduce((a, b) => a + b, 0) / 10) * 10;
    if (left) { S.wallet += refund; S.costs = []; S.credits = 0; if (!S.test) GK.store.set('wallet', S.wallet); }
    S.state = 'result';
    GK.music.stop();
    const back = left ? `のこり ${left} 回ぶん（${GK.fmt(refund)} 円）はお返ししました。` : '';
    $('#rMachine').textContent = `${MACHINES[S.machine]} ・ アーム${ARMS[S.arm]}`;
    $('#rHead').textContent = S.won.length ? `${S.won.length} 個ゲット！` : '今日の成果';
    const box = $('#rPrizes'); box.innerHTML = '';
    if (!S.won.length) box.innerHTML = '<span class="none">景品は取れませんでした</span>';
    for (const id of S.won) { const K = ALL.find((a) => a.id === id); const f = document.createElement('figure'); f.innerHTML = `<img src="img/${K.img}.webp" alt=""><figcaption>${K.name}</figcaption>`; box.appendChild(f); }
    $('#rPlays').textContent = S.plays + ' 回';
    const used = Math.round(S.used);
    $('#rSpent').textContent = GK.fmt(used) + '円';
    $('#rPer').textContent = S.won.length ? GK.fmt(Math.round(used / S.won.length)) + '円' : '—';
    const per = S.won.length ? used / S.won.length : Infinity;
    $('#rNote').textContent = back + (per <= 300 ? 'お見事！ 名人級の腕前です。' : per <= 800 ? 'いい勝負でした！' : S.won.length ? '粘り勝ち！' : 'アームの位置と、重心の真ん中を意識してみよう。');
    if (!S.test) GK.store.set('plays', GK.store.get('plays', 0) + S.plays);
    $('#panel').style.visibility = 'hidden';
    $('#result').classList.add('show');
    syncUI();
  }
  function toTitle() {
    S.gen++;
    S.state = 'title';
    GK.music.stop();
    $('#result').classList.remove('show');
    $('#panel').style.visibility = 'hidden';
    renderTitle();
    $('#title').classList.add('show');
  }
  function renderTitle() {
    const shelf = rec.shelf(), kinds = ALL.filter((a) => shelf[a.id]).length, total = Object.values(shelf).reduce((a, b) => a + b, 0);
    $('#records').innerHTML = `景品棚 <b>${kinds}</b> / ${ALL.length} 種類（全部で <b>${total}</b> 個）　おさいふ <b>${GK.fmt(S.wallet)}</b> 円`;
  }
  function openShelf() {
    const shelf = rec.shelf(), kinds = ALL.filter((a) => shelf[a.id]).length;
    const cells = ALL.map((K) => { const n = shelf[K.id] || 0; return `<div class="${n ? '' : 'unseen'}"><img src="img/${K.img}.webp" alt=""><b>${n ? K.name : '？？？'}</b><small>${n ? `× ${n}` : 'まだ取っていません'}</small></div>`; }).join('');
    return GK.modal({ title: `景品棚（${kinds} / ${ALL.length} 種類）`, wide: true, body: `<div class="shelf">${cells}</div>` });
  }
  function openMenu() {
    if (S.state === 'play') {
      S.paused = true;
      GK.modal({ title: 'メニュー', body: `<p>${MACHINES[S.machine]}　のこり ${S.credits} 回</p>`, buttons: [{ label: 'つづける', value: 'resume', primary: true }, { label: '景品棚', value: 'shelf' }, { label: 'やめる', value: 'quit' }] })
        .then((v) => { S.paused = false; if (v === 'shelf') openShelf(); else if (v === 'quit') quit(); });
    } else {
      GK.modal({ title: 'メニュー', buttons: [{ label: '景品棚', value: 'shelf', primary: true }, { label: '記録を消す', value: 'reset' }, { label: '閉じる', value: null, ghost: true }] })
        .then((v) => {
          if (v === 'shelf') openShelf();
          if (v !== 'reset') return;
          GK.modal({ title: '記録を消しますか？', body: '<p>景品棚とおさいふを最初の状態に戻します。</p>', buttons: [{ label: '消す', value: true }, { label: 'やめる', value: false, primary: true }] })
            .then((ok) => { if (ok) { ['shelf', 'wallet', 'plays', 'refills'].forEach((k) => GK.store.del(k)); S.wallet = 1000; renderTitle(); GK.toast('記録を消しました'); } });
        });
    }
  }

  /* ---------------- input ---------------- */
  function holdButton(el, keyName) {
    const on = (e) => { if (el.disabled) return; e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } S.input[keyName] = true; el.classList.add('down'); };
    const off = () => { S.input[keyName] = false; el.classList.remove('down'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  holdButton($('#b1'), 'p1');
  holdButton($('#b2'), 'p2');
  const KEY1 = ['ArrowRight', 'Digit1', 'Numpad1'], KEY2 = ['ArrowUp', 'Digit2', 'Numpad2'];
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back') || S.state !== 'play') return;
    if (KEY1.includes(e.code)) { S.input.k1 = true; $('#b1').classList.add('down'); e.preventDefault(); }
    else if (KEY2.includes(e.code)) { S.input.k2 = true; $('#b2').classList.add('down'); e.preventDefault(); }
    else if (e.code === 'KeyC' && !e.repeat) toggleCam();
    else if (e.code === 'Enter' && !e.repeat && !/BUTTON/.test(e.target.tagName)) insert(100);
  });
  addEventListener('keyup', (e) => {
    if (KEY1.includes(e.code)) { S.input.k1 = false; $('#b1').classList.remove('down'); }
    if (KEY2.includes(e.code)) { S.input.k2 = false; $('#b2').classList.remove('down'); }
  });
  addEventListener('blur', () => { Object.keys(S.input).forEach((k) => { S.input[k] = false; }); });
  function toggleCam() { S.cam = S.cam === 'front' ? 'side' : 'front'; $('#cam').textContent = S.cam === 'front' ? '横から見る' : '正面から見る'; $('#cam').classList.toggle('on', S.cam === 'side'); GK.sfx('click'); }
  $('#cam').addEventListener('click', toggleCam);
  $('#c100').addEventListener('click', () => insert(100));
  $('#c500').addEventListener('click', () => insert(500));
  $('#refill').addEventListener('click', refill);
  $('#shelfBtn').addEventListener('click', () => { GK.sfx('click'); openShelf(); });
  $('#quit').addEventListener('click', () => { GK.sfx('click'); quit(); });
  $('#tShelf').addEventListener('click', () => { GK.sfx('click'); openShelf(); });
  $('#btnHelp').addEventListener('click', () => { GK.sfx('click'); GK.help(); });
  const armValue = () => +document.querySelector('input[name=arm]:checked').value;
  document.querySelectorAll('[data-machine]').forEach((b) => b.addEventListener('click', () => { GK.sfx('ok'); GK.store.set('arm', armValue()); startMachine(b.dataset.machine, armValue()); }));
  $('#rAgain').addEventListener('click', () => { GK.sfx('ok'); S.state = 'play'; S.spent = 0; S.used = 0; S.costs = []; S.plays = 0; S.won = []; $('#result').classList.remove('show'); $('#panel').style.visibility = 'visible'; syncUI(); GK.music.play(SONG); });
  $('#rShelf').addEventListener('click', () => { GK.sfx('click'); openShelf(); });
  $('#rTitle').addEventListener('click', () => { GK.sfx('click'); toTitle(); });

  /* ---------------- boot ---------------- */
  const savedArm = GK.store.get('arm', 0.65);
  const radio = document.querySelector(`input[name=arm][value="${savedArm}"]`);
  if (radio) radio.checked = true;
  $('#panel').style.visibility = 'hidden';
  GK.init({ id: ID, title: 'クレーン横丁', help: HELP, menu: openMenu });
  let acc = 0, drawnTitle = false;
  GK.loadImages(['bg', 'key', ...PRIZES.map((p) => 'p-' + p.id), ...BOXES.map((b) => 'box-' + b.id)]).then(() => {
    layout();
    renderTitle();
    S.pile = new Pile(); fillPile(12);
    for (let i = 0; i < 200; i++) S.pile.step(FIX, []);
    GK.loop((dt) => {
      if (!S.paused) {
        acc += dt;
        let n = 0;
        while (acc >= FIX && n < 4) { tick(FIX); acc -= FIX; n++; }
        if (n === 4) acc = 0;
      }
      if (S.state !== 'title' || !drawnTitle) { draw(); drawnTitle = S.state === 'title'; }
    });
  });

  window.__crState = () => ({ state: S.state, claw: CL.state, x: +CL.x.toFixed(1), z: +CL.z.toFixed(1), credits: S.credits, wallet: S.wallet, won: S.won.length, held: !!CL.held });

  /* ---------------- self-test (npm run game-check) ---------------- */
  window.__gameSelfTest = async function () {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG ' + m); };
    const shot = async (n) => { draw(); await GK.wait(60); if (window.__shot) await window.__shot(n); };
    while (!GK.images.bg) await GK.wait(50);
    S.test = true;
    const wallet0 = S.wallet;
    S.wallet = 100000;
    let shotUp = false;
    const play = async (tx, tz, picture) => {
      S.input.t1 = true;
      for (let i = 0; i < 900 && CL.x < tx && CL.state !== 'wz'; i++) tick(FIX);
      S.input.t1 = false; tick(FIX);
      S.input.t2 = true;
      for (let i = 0; i < 900 && CL.z < tz && CL.state !== 'open'; i++) tick(FIX);
      S.input.t2 = false;
      for (let i = 0; i < 60 * 40 && CL.state !== 'idle'; i++) {
        tick(FIX);
        if (picture && !shotUp && CL.state === 'up' && CL.y > 24) { shotUp = true; await shot(picture); }
      }
      if (CL.state !== 'idle') fail('the claw did not come back (' + CL.state + ')');
    };
    const sane = () => {
      if (S.pile) for (const p of S.pile.parts) if (![p.x, p.y, p.z].every(Number.isFinite) || Math.abs(p.x) > W / 2 + 0.1 || p.z < -0.1 || p.z > D + 0.1) return false;
      if (S.bridge && S.bridge.box) { const B = S.bridge.box; if (![B.x, B.y, B.a].every(Number.isFinite)) return false; }
      return true;
    };
    // 1. the plush pile: aim at the prize nearest to the chute, up to 12 plays
    startMachine('pile', 0.85);
    insert(500); insert(500); insert(100);
    if (S.credits !== 13) fail('credits after 1,100 yen: ' + S.credits);
    for (let k = 0; k < 12 && S.won.length < 1 && S.credits > 0; k++) {
      const pr = S.pile.prizes.slice().sort((a, b) => { const A = S.pile.com(a), B = S.pile.com(b); return (A.x + A.z) - (B.x + B.z); })[k % 3];
      const c = S.pile.com(pr);
      await play(Math.max(HOME.x, c.x), Math.max(HOME.z, c.z), 'pile-lift');
      if (!sane()) { fail('pile: invalid state'); break; }
    }
    notes.push(`pile: ${S.plays} plays, ${S.won.length} won (closes ${S.stats.closes}, both claws on a prize ${S.stats.touch}, grabbed ${S.stats.grabs}, slipped ${S.stats.slips}), ${S.pile.prizes.length} prizes in the machine`);
    await shot('pile');
    toggleCam(); await shot('side'); toggleCam();
    // 2. the bridge: push the right end of the box, up to 14 plays
    startMachine('bridge', 0.85);
    insert(500); insert(500); insert(500);
    for (let k = 0; k < 14 && S.won.length < 1 && S.credits > 0; k++) {
      const B = S.bridge.box, c = Math.cos(B.a), sn = Math.sin(B.a);
      const ends = [{ x: B.x + B.hx * c, y: B.y + B.hx * sn, s: 1 }, { x: B.x - B.hx * c, y: B.y - B.hx * sn, s: -1 }].sort((p, q) => q.y - p.y);
      // a flat box: aim just outside its right end; a tilted one: press beside the high end, then on it, then near the low end
      const aim = Math.abs(B.a) < 0.12 ? ends.find((p) => p.s === 1).x + 3.2 - (k % 3) * 0.8 : [ends[0].x + ends[0].s * 3.5, ends[0].x - ends[0].s * 2.5, ends[1].x - ends[1].s * 2][k % 3];
      if (aim > HOME.x) await play(aim, B.z, null);
      else { insert(100); S.credits--; }
      for (let i = 0; i < 180; i++) tick(FIX);
      if (window.__log) notes.push(`#${k} aim ${aim.toFixed(1)} → x ${S.bridge.box.x.toFixed(1)} y ${S.bridge.box.y.toFixed(1)} a ${(S.bridge.box.a * 57.3).toFixed(0)}`);
      if (!sane()) { fail('bridge: invalid state'); break; }
    }
    const B = S.bridge.box;
    notes.push(`bridge: ${S.plays} plays, ${S.won.length} won, box at x ${B.x.toFixed(1)} y ${B.y.toFixed(1)} angle ${(B.a * 57.3).toFixed(0)}°`);
    await shot('bridge');
    // 3. result and the shelf
    quit();
    if (!$('#result').classList.contains('show')) fail('result not shown');
    await shot('result');
    const m = openShelf(); await GK.wait(250); await shot('shelf');
    document.querySelector('.gk-modal-back .gk-btn').click(); await m;
    toTitle();
    S.wallet = wallet0; syncUI(); renderTitle();
    S.test = false;
    return { ok, notes };
  };
})();
