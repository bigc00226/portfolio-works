/* 宵祭り金魚すくい — tub, poi, rules, keeper, screens. Fish kinds and drawing in fish.js. */
(function () {
  'use strict';
  const { KINDS, BYID, drawFish, drawShadow, pattern, icon } = window.Kingyo;
  const ID = 'kingyo-sukui';
  const ROUND = 90, POIS = 3, PR = 58, BOWL_R = 80, FIX = 1 / 60;
  const GRADES = {
    4: { name: '4号', dmg: 0.6, soak: 16, mult: 1, frame: '#33b3a6', note: '厚い紙・やさしい' },
    5: { name: '5号', dmg: 1.0, soak: 11, mult: 1.3, frame: '#ff6c9c', note: 'ふつう' },
    6: { name: '6号', dmg: 1.55, soak: 7, mult: 1.7, frame: '#ffad2a', note: '薄い紙・むずかしい' },
  };
  const FONT = '"Hiragino Maru Gothic ProN","Yu Gothic UI","Yu Gothic",YuGothic,Meiryo,system-ui,sans-serif';
  const $ = (s) => document.querySelector(s);
  const cv = $('#cv');
  let fitted = false;
  const view = GK.fit(cv, { onResize: () => { if (fitted) layout(); } });
  fitted = true;
  let ctx = view.ctx;
  let L = {};
  const rng = GK.rng();

  const HELP = `
    <p>夏祭りの夜店で金魚すくい。<b>ポイ</b>（紙を張った輪）で金魚をすくって、<b>お椀</b>に入れましょう。ポイは 3 枚、時間は 90 秒です。</p>
    <h3>操作</h3>
    <table>
      <tr><th>スマホ</th><td>水面を<b>押す</b>とポイが水に入り、押したまま動かすと水中を動きます。<b>指をはなすと持ち上げ</b>、上にいる金魚をすくいます。すくったら、なぞってお椀まで運びます。</td></tr>
      <tr><th>マウス</th><td>動かすとポイが水面の上を動きます。<b>押している間</b>は水の中、はなすと持ち上げます。金魚をのせたまま、お椀の上へ。</td></tr>
      <tr><th>キーボード</th><td><kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> で移動、<kbd>Space</kbd> を押している間は水の中、はなすと持ち上げ。</td></tr>
    </table>
    <h3>ポイの紙が破れるとき</h3>
    <ul>
      <li>水につけている時間が長いほど紙が濡れて弱くなります（右上の「紙」のメーターが減ります）。</li>
      <li>水の中で速く動かす・金魚が勢いよくぶつかる・重い金魚をたくさんのせる・ポイの上で金魚が跳ねると、紙が傷みます。</li>
      <li>金魚は、ポイを速く動かすと逃げます。静かに待つと、近くに寄ってきます。金魚の<b>真下</b>から、まっすぐ持ち上げるのがコツ。</li>
      <li>ポイの上の金魚は跳ねて逃げることがあるので、早めにお椀へ。</li>
    </ul>
    <h3>ポイの号数</h3>
    <p>号数が大きいほど紙が薄く、破れやすくなります。<b>4号</b>は厚くてやさしい、<b>5号</b>はふつう（得点 1.3 倍）、<b>6号</b>は薄くてむずかしい（得点 1.7 倍）。</p>
    <h3>得点と図鑑</h3>
    <p>めずらしい金魚ほど高得点（和金 10 点 〜 丹頂 120 点）。一度に何匹もお椀に入れるとボーナス。すくった金魚は<b>金魚図鑑</b>に記録されます（全 8 種類）。</p>`;

  /* ---------------- records ---------------- */
  const rec = {
    best: (g) => GK.store.get('best-' + g, { score: 0, count: 0 }),
    dex: () => GK.store.get('dex', {}),
  };

  /* ---------------- state ---------------- */
  const S = {
    state: 'title', grade: 5, fish: [], bowl: [], time: 0, score: 0, count: 0, poiLeft: 0, poi: null, nextPoiT: 0,
    ripples: [], drops: [], texts: [], say: { text: '', face: 'normal', until: 0, prio: 0, t: 0 }, gen: 0, caught: {}, newKinds: [],
    test: false, TW: 900, TH: 600, bowlX: 0, bowlY: 0, aim: { x: 450, y: 300 }, drag: null, t: 0, chirpT: 4, warned10: false,
    fastCD: 0, endMsg: '', best: false, endT: 0,
  };
  const r = () => rng();

  /* ---------------- layout ---------------- */
  function layout() {
    const W = view.w, H = view.h, land = W > H * 1.05;
    L = { W, H, land };
    let ax, ay, aw, ah;
    if (land) {
      const pw = GK.clamp(W * 0.25, 190, 340);
      L.panel = { x: 12, y: 12, w: pw - 12, h: H - 24 };
      const kh = Math.min((pw - 12) * 1.15, H * 0.56);
      L.keeper = { x: 12, y: 12, w: pw - 12, h: kh };
      L.bubble = { x: 16, y: 12 + kh + 10, w: pw - 20, h: Math.min(150, H - kh - 40) };
      L.hud = { x: pw + 14, y: 10, w: W - pw - 14 - 150, h: 44 };
      ax = pw + 14; ay = 62; aw = W - pw - 26; ah = H - ay - 12;
      L.k = GK.clamp(Math.min(pw / 300, H / 760), 0.7, 1.15);
    } else {
      const k = GK.clamp(W / 400, 0.85, 1.4);
      L.k = k;
      L.hud = { x: 10, y: 8, w: W - 158, h: 42 * k };
      L.row = { x: 10, y: 8 + 48 * k, w: W - 20, h: 70 * k };
      ax = 10; ay = L.row.y + L.row.h + 8; aw = W - 20; ah = H - ay - 10;
    }
    const s = GK.clamp(Math.min(aw, ah) / 600, 0.58, 1.3);
    const TW = aw / s, TH = ah / s;
    if (S.fish.length && (Math.abs(TW - S.TW) > 1 || Math.abs(TH - S.TH) > 1)) {
      const kx = TW / S.TW, ky = TH / S.TH;
      for (const f of S.fish) { f.x *= kx; f.y *= ky; }
      if (S.poi) { S.poi.x *= kx; S.poi.y *= ky; }
      S.aim.x *= kx; S.aim.y *= ky;
    }
    S.TW = TW; S.TH = TH;
    L.s = s; L.tx = ax + (aw - TW * s) / 2; L.ty = ay + (ah - TH * s) / 2;
    if (land) { S.bowlX = TW - BOWL_R - 34; S.bowlY = TH - BOWL_R - 34; } else { S.bowlX = TW / 2; S.bowlY = TH - BOWL_R - 30; }
    stat = null;
  }
  const toTank = (p) => ({ x: (p.x - L.tx) / L.s, y: (p.y - L.ty) / L.s });

  /* ---------------- sound ---------------- */
  const snd = {
    plunge() { GK.noise({ d: 0.22, v: 0.22, f: 1300, q: 0.7 }); GK.tone({ f: 220, f2: 120, d: 0.12, type: 'sine', v: 0.18 }); },
    lift() { for (let i = 0; i < 4; i++) GK.tone({ f: 1500 + Math.random() * 900, d: 0.05, type: 'sine', v: 0.08, at: 0.06 + i * 0.09 + Math.random() * 0.05 }); GK.noise({ d: 0.15, v: 0.1, f: 2500, q: 1 }); },
    catch() { GK.tone({ f: 520, f2: 1040, d: 0.12, type: 'sine', v: 0.22 }); },
    plop(n) { GK.tone({ f: 320, f2: 760, d: 0.1, type: 'sine', v: 0.25 }); GK.noise({ d: 0.12, v: 0.12, f: 1800, q: 1.2 }); for (let i = 1; i < Math.min(n, 5); i++) GK.tone({ f: GK.scaleFreq('D5', 'yo', i * 2), d: 0.14, type: 'triangle', v: 0.14, at: i * 0.08 }); },
    flop() { GK.noise({ d: 0.05, v: 0.08, f: 3000, q: 2 }); },
    tear() { for (let i = 0; i < 5; i++) GK.noise({ d: 0.05, v: 0.22, f: 2600 + i * 400, filter: 'highpass', at: i * 0.035 }); GK.noise({ d: 0.3, v: 0.12, f: 900, q: 0.8, at: 0.15 }); },
    rare() { GK.tone({ f: 1568, d: 0.8, type: 'sine', v: 0.12 }); GK.tone({ f: 2093, d: 0.9, type: 'sine', v: 0.1, at: 0.12 }); },
    whistle() { GK.tone({ f: 2100, f2: 2300, d: 0.55, type: 'sine', v: 0.18 }); GK.tone({ f: 2150, d: 0.5, type: 'triangle', v: 0.05, detune: 30 }); },
    chirp() { for (let i = 0; i < 3; i++) GK.tone({ f: 4200 + Math.random() * 300, d: 0.025, type: 'sine', v: 0.025, at: i * 0.07 }); },
  };
  const bars = (...b) => b.join(' | ');
  const SONG = { // a festival tune in the yo scale (fue, a plucked bass, taiko and kane)
    bpm: 104, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.09, notes: bars('D6 - B5 A5 B5 - D6 E6', 'D6 - B5 - A5 - - .', 'G5 A5 B5 D6 B5 A5 G5 E5', 'G5 - - - . . . .', 'A5 - B5 D6 E6 - D6 B5', 'D6 - E6 G6 E6 - D6 .', 'B5 A5 G5 A5 B5 - A5 G5', 'E5 - G5 - A5 - - .') },
      { type: 'sine', v: 0.05, detune: 9, notes: bars('D6 - B5 A5 B5 - D6 E6', 'D6 - B5 - A5 - - .', 'G5 A5 B5 D6 B5 A5 G5 E5', 'G5 - - - . . . .', 'A5 - B5 D6 E6 - D6 B5', 'D6 - E6 G6 E6 - D6 .', 'B5 A5 G5 A5 B5 - A5 G5', 'E5 - G5 - A5 - - .') },
      { type: 'triangle', v: 0.07, notes: bars('D3 . A3 . D3 . A3 .', 'G3 . D3 . G3 . D3 .', 'E3 . B3 . E3 . B3 .', 'G3 . D3 . G3 . B3 .', 'A3 . E3 . A3 . E3 .', 'D3 . A3 . D3 . A3 .', 'E3 . B3 . G3 . D3 .', 'A3 . E3 . A3 . . .') },
    ],
    drums: {
      t: bars('x . . x x . x .', 'x . . x x . . .', 'x . . x x . x .', 'x . x . x x x .', 'x . . x x . x .', 'x . . x x . . .', 'x . . x x . x .', 'x x . x x . x x'),
      h: bars('. . x . . . x .', '. . x . . . x .', '. . x . . . x .', '. . x . . x x .', '. . x . . . x .', '. . x . . . x .', '. . x . . . x .', '. . x . x . x .'),
    },
  };

  /* ---------------- keeper ---------------- */
  const LINES = {
    start: ['らっしゃい！紙は濡れるほど弱くなるよ。手早く、そーっとな。', 'へい、いらっしゃい！ポイは水の中でゆっくり動かすのがコツだ。'],
    catch: ['おっ、うまいねえ！', 'いい手つきだ！', 'その調子、その調子！', 'お見事！'],
    multi: ['いっぺんに {n} 匹かい！やるねえ！', '{n} 匹すくいとは、こりゃ参った！'],
    rare: { ranchu: 'らんちゅうだ！重たいのに、よくすくったね！', tancho: '丹頂じゃないか！今夜いちばんの当たりだよ！', shubunkin: '朱文金とはお目が高い！', comet: 'すばしっこいコメットを捕まえるとはね！' },
    tear: ['あちゃー、破れちまったか。', '惜しい！紙は濡れると弱いんだ。', 'ありゃりゃ、穴が開いちまった。'],
    fast: ['そんなに振り回したら破れちまうよ！', 'あわてない、あわてない。'],
    escape: ['おっと、逃げられた！', 'ぴちっと跳ねて逃げちまった！'],
    newpoi: ['はい、次のポイ！', 'ほら、新しいポイだよ。'],
    miss: ['おしい！金魚の真下からすくうんだ。', 'もうちょい真ん中で、まっすぐ上げてごらん。'],
    last: ['あと十秒！'],
  };
  const pick = (a) => a[Math.floor(r() * a.length)];
  function say(text, face = 'normal', prio = 1, ms = 2600) {
    const now = S.t;
    if (S.say.until > now && S.say.prio > prio) return;
    S.say = { text, face, until: now + ms / 1000, prio, t: now };
  }
  function endLine(n) {
    if (n === 0) return ['今夜は金魚の機嫌が悪かったね。また来なよ！', 'normal'];
    if (n <= 3) return [`${n} 匹か、なかなかやるね。また来なよ！`, 'normal'];
    if (n <= 9) return [`${n} 匹とは大したもんだ！金魚もびっくりだよ。`, 'wow'];
    if (n <= 19) return [`${n} 匹！こりゃあ名人だ、まいったまいった。`, 'wow'];
    return [`${n} 匹だって!? こりゃ店じまいだよ！`, 'wow'];
  }

  /* ---------------- fish ---------------- */
  function spawnFish() {
    const n = GK.clamp(Math.round((S.TW * S.TH) / 14000), 18, 34);
    const total = KINDS.reduce((a, k) => a + k.w, 0);
    const kinds = [];
    if (r() < 0.75) kinds.push(BYID.ranchu);
    if (r() < 0.45) kinds.push(BYID.tancho);
    while (kinds.length < n) { let x = r() * total; for (const k of KINDS) { x -= k.w; if (x < 0) { kinds.push(k); break; } } }
    S.fish = kinds.map((k) => newFish(k));
  }
  function newFish(k) {
    let x, y, n = 0;
    do { x = 60 + r() * (S.TW - 120); y = 60 + r() * (S.TH - 120); } while (Math.hypot(x - S.bowlX, y - S.bowlY) < BOWL_R + 70 && n++ < 30);
    const a = r() * Math.PI * 2;
    return { kind: k, x, y, ang: a, want: a, wt: r() * 2, cruise: k.spd * (0.6 + r() * 0.5), spd: k.spd * 0.6, ph: r() * 6, dash: 0, bump: 0, size: 0.9 + r() * 0.2, spots: pattern(k, r), flop: 0 };
  }
  function startle(x, y, R, p = 0.7) {
    for (const f of S.fish) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < R && r() < p) { f.dash = 0.35 + r() * 0.4; f.want = Math.atan2(f.y - y, f.x - x); f.wt = 0.8; }
    }
  }
  function updateFish(dt) {
    const P = S.poi, under = P && P.under && !P.torn, TW = S.TW, TH = S.TH;
    for (const f of S.fish) {
      const K = f.kind;
      f.wt -= dt;
      if (f.wt <= 0) { f.want = f.ang + (r() - 0.5) * 2.4; f.wt = 0.8 + r() * 2.4; f.cruise = K.spd * (0.5 + r() * 0.65); }
      let sx = Math.cos(f.want), sy = Math.sin(f.want);
      const m = 50 + K.len * 0.6;
      if (f.x < m) sx += ((m - f.x) / m) * 3; else if (f.x > TW - m) sx -= ((f.x - (TW - m)) / m) * 3;
      if (f.y < m) sy += ((m - f.y) / m) * 3; else if (f.y > TH - m) sy -= ((f.y - (TH - m)) / m) * 3;
      const bx = f.x - S.bowlX, by = f.y - S.bowlY, bd = Math.hypot(bx, by) || 1, av = BOWL_R + 30 + K.len * 0.5;
      if (bd < av) { sx += (bx / bd) * ((av - bd) / 25); sy += (by / bd) * ((av - bd) / 25); }
      for (const o of S.fish) {
        if (o === f) continue;
        const dx = f.x - o.x, dy = f.y - o.y, R = (K.len + o.kind.len) * 0.42;
        if (dx > R || dx < -R || dy > R || dy < -R) continue;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 0.01) { sx += (dx / d) * ((R - d) / R) * 1.5; sy += (dy / d) * ((R - d) / R) * 1.5; }
      }
      if (under) {
        const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1;
        if (P.speed > 170 && d < 175) { sx += (dx / d) * 3; sy += (dy / d) * 3; if (f.dash <= 0) f.dash = 0.4 + r() * 0.4; }
        else if (P.stillT > 0.9 && d < 250 && d > 26 && f.dash <= 0) { sx -= (dx / d) * 0.55; sy -= (dy / d) * 0.55; } // curious about a still poi
        if (f.dash > 0 && f.spd > K.spd * 2 && d < PR * 0.85 && f.bump <= 0) { f.bump = 0.9; damage(0.012 * (0.5 + P.wet)); ripple(f.x, f.y, 0.4); } // a fleeing fish bumps the paper
      }
      if (f.bump > 0) f.bump -= dt;
      let target = f.cruise;
      if (f.dash > 0) { f.dash -= dt; target = K.spd * 3.1; }
      const want = Math.atan2(sy, sx);
      let da = want - f.ang;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      const turn = (f.dash > 0 ? 6 : 2.3) * dt;
      f.ang += GK.clamp(da, -turn, turn);
      f.spd += (target - f.spd) * Math.min(1, dt * (f.dash > 0 ? 6 : 1.8));
      f.x = GK.clamp(f.x + Math.cos(f.ang) * f.spd * dt, 10, TW - 10);
      f.y = GK.clamp(f.y + Math.sin(f.ang) * f.spd * dt, 10, TH - 10);
      f.ph += dt * (4 + f.spd * 0.07);
    }
  }

  /* ---------------- poi ---------------- */
  function newPoi(x, y) {
    const cr = [];
    for (let i = 0; i < 5; i++) { const a = r() * Math.PI * 2, d = r() * PR * 0.6; cr.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, a: r() * Math.PI, l: 10 + r() * 22 }); }
    const hole = [];
    for (let i = 0; i < 18; i++) hole.push(0.55 + r() * 0.45);
    return { x, y, under: false, hp: 1, wet: 0, carry: [], torn: 0, speed: 0, stillT: 0, cracks: cr, hole, lift: 0, dip: 0, born: S.t };
  }
  function damage(a) {
    const P = S.poi;
    if (!P || P.torn) return;
    P.hp -= a * GRADES[S.grade].dmg;
    if (P.hp <= 0) tear();
  }
  function plunge(x, y) {
    const P = S.poi;
    if (S.state !== 'play' || !P || P.torn || P.under || P.carry.length) return;
    if (Math.hypot(x - S.bowlX, y - S.bowlY) < BOWL_R + 6) return;
    P.x = GK.clamp(x, PR * 0.5, S.TW - PR * 0.5); P.y = GK.clamp(y, PR * 0.5, S.TH - PR * 0.5);
    S.aim.x = P.x; S.aim.y = P.y;
    P.under = true; P.speed = 0; P.stillT = 0; P.dip = 1;
    damage(0.015 * (0.5 + P.wet));
    ripple(P.x, P.y, 1); splash(P.x, P.y, 6);
    startle(P.x, P.y, 150, 0.55);
    snd.plunge();
  }
  function lift() {
    const P = S.poi;
    if (!P || !P.under || P.torn) return;
    P.under = false; P.lift = 1;
    const got = [];
    let near = 0;
    for (const f of S.fish) {
      const d = Math.hypot(f.x - P.x, f.y - P.y);
      if (d < PR + f.kind.len * 0.6) near++;
      let ok = d < PR * 0.8 || (d < PR + f.kind.len * 0.2 && r() < 0.4);
      if (ok && f.dash > 0 && r() < 0.5) ok = false;
      if (ok) got.push(f);
    }
    ripple(P.x, P.y, 0.9); splash(P.x, P.y, 4 + got.length * 3);
    snd.lift();
    if (got.length) damage(got.reduce((a, f) => a + f.kind.mass, 0) * 0.09 * (0.45 + 1.1 * P.wet));
    if (P.torn) { for (const f of got) { f.dash = 0.5; } return; }
    for (const f of got) {
      S.fish.splice(S.fish.indexOf(f), 1);
      f.ox = f.x - P.x; f.oy = f.y - P.y;
      const d = Math.hypot(f.ox, f.oy);
      if (d > PR * 0.7) { f.ox *= (PR * 0.7) / d; f.oy *= (PR * 0.7) / d; }
      f.flopT = 0.35 + r() * 0.5; f.flop = 0;
      P.carry.push(f);
    }
    startle(P.x, P.y, 130, 0.6);
    if (got.length) {
      snd.catch();
      text(P.x, P.y - PR - 10, got.length > 1 ? `${got.length} 匹！` : 'すくった！', 20, '#fff');
    } else if (near) say(pick(LINES.miss), 'normal', 1, 2000);
  }
  function tear() {
    const P = S.poi;
    if (!P || P.torn) return;
    P.hp = 0; P.torn = 0.0001;
    for (const f of P.carry) { f.x = GK.clamp(P.x + f.ox, 10, S.TW - 10); f.y = GK.clamp(P.y + f.oy, 10, S.TH - 10); f.dash = 0.6; f.flop = 0; S.fish.push(f); splash(f.x, f.y, 4); }
    P.carry = [];
    S.poiLeft--;
    S.nextPoiT = 1.3;
    snd.tear();
    say(pick(LINES.tear), 'normal', 2);
    if (!P.under) ripple(P.x, P.y, 0.6);
  }
  function transfer() {
    const P = S.poi, G = GRADES[S.grade], n = P.carry.length;
    let pts = 0, rare = null;
    const dex = rec.dex();
    for (const f of P.carry) {
      pts += f.kind.pts;
      S.caught[f.kind.id] = (S.caught[f.kind.id] || 0) + 1;
      if (!dex[f.kind.id] && !S.newKinds.includes(f.kind.id)) S.newKinds.push(f.kind.id);
      dex[f.kind.id] = (dex[f.kind.id] || 0) + 1;
      if (LINES.rare[f.kind.id] && (!rare || f.kind.pts > rare.pts)) rare = f.kind;
      S.bowl.push({ kind: f.kind, spots: f.spots, a: r() * Math.PI * 2, rr: 14 + r() * (BOWL_R * 0.45), w: (0.5 + r() * 0.6) * (r() < 0.5 ? -1 : 1), ph: r() * 6, size: 0.55 });
    }
    if (!S.test) GK.store.set('dex', dex);
    pts = Math.round(pts * G.mult * (1 + 0.2 * (n - 1)));
    S.score += pts; S.count += n;
    P.carry = [];
    splash(S.bowlX, S.bowlY, 10); ripple(S.bowlX, S.bowlY, 0.5);
    text(S.bowlX, S.bowlY - BOWL_R - 6, '+' + pts, 22, '#ffe28a');
    snd.plop(n);
    if (rare) { say(LINES.rare[rare.id], 'wow', 3, 3000); snd.rare(); }
    else if (n >= 2) say(pick(LINES.multi).replace('{n}', n), 'wow', 2);
    else say(pick(LINES.catch), 'normal', 1, 1800);
  }

  /* ---------------- effects ---------------- */
  function ripple(x, y, k) { S.ripples.push({ x, y, t: 0, life: 0.9 + k * 0.5, r1: 40 + k * 90 }); }
  function splash(x, y, n) { for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, sp = 60 + r() * 140; S.drops.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, z: 0, vz: 120 + r() * 160, t: 0, life: 0.7 }); } }
  function text(x, y, s, size, c) { S.texts.push({ x, y, s, size, c, t: 0, life: 1.2 }); }

  /* ---------------- flow ---------------- */
  function startRound(grade) {
    S.gen++;
    Object.assign(S, {
      state: 'play', grade, bowl: [], time: ROUND, score: 0, count: 0, poiLeft: POIS, nextPoiT: 0, ripples: [], drops: [], texts: [],
      caught: {}, newKinds: [], drag: null, warned10: false, fastCD: 0, endMsg: '', best: false, endT: 0,
    });
    layout();
    spawnFish();
    S.poi = newPoi(S.TW * 0.45, S.TH * 0.55);
    S.aim = { x: S.poi.x, y: S.poi.y };
    $('#title').classList.remove('show');
    $('#result').classList.remove('show');
    say(pick(LINES.start), 'normal', 3, 3600);
    if (!S.test) GK.music.play(SONG);
  }
  function endRound(msg) {
    if (S.state !== 'play') return;
    S.state = 'end'; S.endMsg = msg; S.endT = 0;
    const P = S.poi;
    if (P && P.under) P.under = false;
    if (P && P.carry.length) transfer.call(null);
    GK.music.stop();
    snd.whistle();
    const b = rec.best(S.grade);
    S.best = S.score > b.score;
    if (!S.test) {
      GK.store.set('best-' + S.grade, { score: Math.max(b.score, S.score), count: Math.max(b.count, S.count) });
      GK.store.set('plays', GK.store.get('plays', 0) + 1);
    }
    const [line, face] = endLine(S.count);
    say(line, face, 9, 60000);
    const gen = S.gen;
    setTimeout(() => { if (S.gen === gen && S.state === 'end') showResult(); }, S.test ? 60 : 1700);
  }
  function showResult() {
    S.state = 'result';
    const G = GRADES[S.grade];
    $('#rGrade').textContent = `${G.name}のポイ ・ ${S.endMsg}`;
    $('#rCount').textContent = S.count;
    $('#rScore').textContent = GK.fmt(S.score);
    $('#rNew').classList.toggle('on', S.best && S.score > 0);
    $('#rSay').textContent = S.say.text;
    $('#rKeeper').src = 'img/' + (S.say.face === 'wow' ? 'keeper-wow' : 'keeper') + '.webp';
    const list = $('#rList');
    list.innerHTML = '';
    const ids = KINDS.filter((k) => S.caught[k.id]);
    if (!ids.length) list.innerHTML = '<span class="none">すくえた金魚はいませんでした</span>';
    for (const k of ids) {
      const chip = document.createElement('span');
      chip.className = 'chip' + (S.newKinds.includes(k.id) ? ' new' : '');
      chip.appendChild(icon(k, 30));
      chip.appendChild(document.createTextNode(`${k.name} ×${S.caught[k.id]}`));
      list.appendChild(chip);
    }
    $('#result').classList.add('show');
    setTimeout(() => $('#rAgain').focus({ preventScroll: true }), 60);
    if (S.best && S.score > 0) setTimeout(() => GK.sfx('win'), 250);
  }
  function toTitle() {
    S.gen++;
    S.state = 'title';
    GK.music.stop();
    $('#result').classList.remove('show');
    renderTitle();
    $('#title').classList.add('show');
  }
  function renderTitle() {
    const dex = rec.dex(), got = KINDS.filter((k) => dex[k.id]).length;
    const parts = [4, 5, 6].map((g) => { const b = rec.best(g); return `${g}号 <b>${b.count}</b> 匹（${GK.fmt(b.score)} 点）`; });
    $('#records').innerHTML = `最高記録　${parts.join('　')}<br>金魚図鑑 <b>${got}</b> / ${KINDS.length} 種類`;
  }
  function openDex() {
    const dex = rec.dex(), got = KINDS.filter((k) => dex[k.id]).length;
    const cards = KINDS.map((k) => {
      const n = dex[k.id] || 0;
      return `<div class="dex-card${n ? '' : ' unseen'}"><img src="img/fish-${k.id}.webp" alt="${n ? k.name : '？？？'}">
        <h4>${n ? k.name : '？？？'}</h4><div class="meta"><span class="stars">${'★'.repeat(k.rare)}${'☆'.repeat(5 - k.rare)}</span>　${k.pts} 点</div><div class="meta">${n ? `すくった数 ${n} 匹` : 'まだ見つけていません'}</div>
        ${n ? `<p>${k.desc}</p>` : ''}</div>`;
    }).join('');
    return GK.modal({ title: '金魚図鑑', wide: true, body: `<p class="dex-sum">${got} / ${KINDS.length} 種類</p><div class="dex-grid">${cards}</div>` });
  }
  function openMenu() {
    if (S.state === 'play') {
      S.paused = true;
      GK.modal({ title: 'ひと休み', body: `<p>${GRADES[S.grade].name}のポイ　のこり ${Math.ceil(S.time)} 秒・${S.count} 匹</p>`, buttons: [{ label: 'つづける', value: 'resume', primary: true }, { label: '最初から', value: 'restart' }, { label: 'ポイをえらぶ', value: 'title' }] })
        .then((v) => { S.paused = false; if (v === 'restart') startRound(S.grade); else if (v === 'title') toTitle(); });
    } else {
      GK.modal({ title: 'メニュー', buttons: [{ label: '金魚図鑑', value: 'dex', primary: true }, { label: '記録を消す', value: 'reset' }, { label: '閉じる', value: null, ghost: true }] })
        .then((v) => {
          if (v === 'dex') openDex();
          if (v !== 'reset') return;
          GK.modal({ title: '記録を消しますか？', body: '<p>最高記録と金魚図鑑を消します。もとに戻せません。</p>', buttons: [{ label: '消す', value: true }, { label: 'やめる', value: false, primary: true }] })
            .then((ok) => { if (ok) { ['best-4', 'best-5', 'best-6', 'dex', 'plays'].forEach((k) => GK.store.del(k)); renderTitle(); GK.toast('記録を消しました'); } });
        });
    }
  }

  /* ---------------- step ---------------- */
  function tick(dt) {
    S.t += dt;
    if (S.state === 'play' || S.state === 'end' || S.state === 'result' || S.state === 'title') updateFish(dt);
    const P = S.poi;
    if (S.state === 'play' && P) {
      // keyboard movement
      const kx = (GK.keys.has('ArrowRight') || GK.keys.has('KeyD')) - (GK.keys.has('ArrowLeft') || GK.keys.has('KeyA'));
      const ky = (GK.keys.has('ArrowDown') || GK.keys.has('KeyS')) - (GK.keys.has('ArrowUp') || GK.keys.has('KeyW'));
      if (kx || ky) { S.aim.x += kx * 260 * dt; S.aim.y += ky * 260 * dt; }
      const m = P.under ? PR * 0.5 : -PR * 0.3;
      S.aim.x = GK.clamp(S.aim.x, m, S.TW - m); S.aim.y = GK.clamp(S.aim.y, m, S.TH - m);
      if (!P.torn) {
        const inst = Math.hypot(S.aim.x - P.x, S.aim.y - P.y) / dt;
        P.x = S.aim.x; P.y = S.aim.y;
        P.speed = P.speed * 0.7 + inst * 0.3;
        if (P.under) {
          const G = GRADES[S.grade];
          P.wet = Math.min(1, P.wet + dt / G.soak);
          P.stillT = P.speed < 40 ? P.stillT + dt : 0;
          damage(dt * ((P.speed / 650) ** 2 * (0.4 + P.wet) + 0.02 * (0.3 + P.wet)));
          if (P.speed > 120 && Math.random() < dt * 8) ripple(P.x, P.y, 0.2);
          if (P.speed > 520 && P.hp < 0.75 && S.fastCD <= 0) { say(pick(LINES.fast), 'normal', 2, 2000); S.fastCD = 6; }
        }
        // fish on the poi flop, and may jump back into the water
        const overBowl = Math.hypot(P.x - S.bowlX, P.y - S.bowlY) < BOWL_R - 8;
        for (const f of P.carry.slice()) {
          f.flopT -= dt; f.flop *= Math.pow(0.02, dt); f.ph += dt * 3;
          if (f.flopT <= 0 && !P.torn) {
            f.flopT = 0.45 + r() * 0.7; f.flop = (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5);
            snd.flop();
            damage(0.012 * f.kind.mass * (0.5 + P.wet));
            if (!overBowl && r() < 0.1 * (1 + P.wet) && P.carry.includes(f)) {
              P.carry.splice(P.carry.indexOf(f), 1);
              const a = Math.atan2(f.oy, f.ox) || r() * 6;
              f.x = GK.clamp(P.x + Math.cos(a) * (PR + 24), 10, S.TW - 10); f.y = GK.clamp(P.y + Math.sin(a) * (PR + 24), 10, S.TH - 10);
              f.dash = 0.6; f.flop = 0; f.ang = a;
              S.fish.push(f); splash(f.x, f.y, 6); ripple(f.x, f.y, 0.5);
              say(pick(LINES.escape), 'normal', 1, 1800);
            }
          }
        }
        if (P.carry.length && overBowl && !P.torn) transfer();
      }
      if (P.lift > 0) P.lift = Math.max(0, P.lift - dt * 4);
      if (P.dip > 0) P.dip = Math.max(0, P.dip - dt * 4);
      if (P.torn) P.torn += dt;
      if (S.nextPoiT > 0) {
        S.nextPoiT -= dt;
        if (S.nextPoiT <= 0) {
          if (S.poiLeft > 0) { S.poi = newPoi(P.x, P.y); S.aim = { x: P.x, y: P.y }; say(pick(LINES.newpoi), 'normal', 1, 1800); GK.sfx('select'); }
          else endRound('ポイがなくなりました');
        }
      }
      if (S.fastCD > 0) S.fastCD -= dt;
      S.time -= dt;
      if (S.time <= 10 && !S.warned10) { S.warned10 = true; say(LINES.last[0], 'normal', 2, 2000); }
      if (S.time <= 10 && Math.ceil(S.time) !== Math.ceil(S.time + dt) && !S.test) GK.sfx('tick');
      if (S.time <= 0) { S.time = 0; endRound('時間切れ'); }
      S.chirpT -= dt;
      if (S.chirpT <= 0) { S.chirpT = 3 + r() * 5; if (!S.test) snd.chirp(); }
    }
    if (S.state === 'end') S.endT += dt;
    for (const b of S.bowl) { b.a += b.w * dt * 0.8; b.ph += dt * 5; }
    for (const p of S.ripples) p.t += dt;
    S.ripples = S.ripples.filter((p) => p.t < p.life);
    for (const d of S.drops) { d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vz -= 700 * dt; d.z += d.vz * dt; }
    S.drops = S.drops.filter((d) => d.t < d.life && d.z > -2);
    for (const x of S.texts) x.t += dt;
    S.texts = S.texts.filter((x) => x.t < x.life);
  }

  /* ---------------- drawing ---------------- */
  const font = (px, w = 800) => `${w} ${Math.round(px)}px ${FONT}`;
  let stat = null, caustic = null;
  function makeCaustic() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), q = GK.rng(11);
    g.filter = 'blur(1.6px)';
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const x = q() * 256, y = q() * 256, a = q() * Math.PI * 2, l = 30 + q() * 50, b = (q() - 0.5) * 50;
      g.lineWidth = 1.5 + q() * 3;
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
        g.beginPath(); g.moveTo(x + ox, y + oy);
        g.quadraticCurveTo(x + ox + Math.cos(a) * l * 0.5 - Math.sin(a) * b, y + oy + Math.sin(a) * l * 0.5 + Math.cos(a) * b, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
        g.stroke();
      }
    }
    return c;
  }
  function drawCover(img, x, y, w, h) {
    const iw = img.width, ih = img.height, s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
    ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  }
  function renderStatic() {
    if (stat && stat.width === cv.width && stat.height === cv.height) return;
    stat = stat || document.createElement('canvas');
    stat.width = cv.width; stat.height = cv.height;
    const main = ctx; ctx = stat.getContext('2d');
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const { W, H } = L;
    if (GK.images.bg) drawCover(GK.images.bg, 0, 0, W, H);
    ctx.fillStyle = 'rgba(8,12,30,.45)'; ctx.fillRect(0, 0, W, H);
    // the tub (light blue plastic) and its floor
    const x = L.tx, y = L.ty, w = S.TW * L.s, h = S.TH * L.s, rim = Math.max(10, 18 * L.s);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.roundRect(x - rim + 4, y - rim + 10, w + rim * 2, h + rim * 2, rim * 1.6); ctx.fill();
    let g = ctx.createLinearGradient(0, y - rim, 0, y + h + rim);
    g.addColorStop(0, '#8fd6f2'); g.addColorStop(1, '#3f95c6');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - rim, y - rim, w + rim * 2, h + rim * 2, rim * 1.6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - rim + 3, y - rim + 3, w + rim * 2 - 6, h + rim * 2 - 6, rim * 1.4); ctx.stroke();
    g = ctx.createRadialGradient(x + w * 0.5, y + h * 0.45, Math.min(w, h) * 0.1, x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.75);
    g.addColorStop(0, '#9fdcf3'); g.addColorStop(1, '#4fa6d4');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, rim); ctx.fill();
    ctx.strokeStyle = 'rgba(20,70,110,.35)'; ctx.lineWidth = 3; ctx.stroke();
    ctx = main;
  }

  function drawPoi(P) {
    const G = GRADES[S.grade];
    const under = P.under, k = under ? 0.97 - P.dip * 0.04 : 1.05 + P.lift * 0.05;
    ctx.save();
    if (!under) { // its shadow on the water
      ctx.fillStyle = 'rgba(10,40,80,.22)';
      ctx.beginPath(); ctx.ellipse(P.x + 16, P.y + 22, PR * 1.02, PR * 0.96, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.translate(P.x, P.y); ctx.scale(k, k);
    if (under) ctx.globalAlpha = 0.86;
    const ha = 0.78, hx = Math.cos(ha), hy = Math.sin(ha);
    // handle
    ctx.save(); ctx.translate(hx * (PR + 2), hy * (PR + 2)); ctx.rotate(ha);
    ctx.fillStyle = G.frame; ctx.beginPath(); ctx.roundRect(-2, -8, 128, 16, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.roundRect(4, -6, 116, 4, 2); ctx.fill();
    ctx.restore();
    // paper
    const wet = P.wet;
    const pa = under ? 0.42 - wet * 0.12 : 0.9 - wet * 0.32;
    if (!P.torn) {
      ctx.fillStyle = `rgba(${255 - wet * 25},${253 - wet * 12},${247},${pa})`;
      ctx.beginPath(); ctx.arc(0, 0, PR, 0, Math.PI * 2); ctx.fill();
      if (P.hp < 0.6) { // tiny tears
        ctx.strokeStyle = `rgba(90,110,130,${Math.min(0.8, (0.6 - P.hp) * 2)})`; ctx.lineWidth = 1.2;
        for (const c of P.cracks) { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + Math.cos(c.a) * c.l * (1 - P.hp), c.y + Math.sin(c.a) * c.l * (1 - P.hp)); ctx.stroke(); }
      }
    } else {
      // torn: a jagged hole opens, the rest of the paper hangs at the rim
      const e = GK.ease.outCubic(Math.min(1, P.torn / 0.35)), n = P.hole.length;
      ctx.beginPath(); ctx.arc(0, 0, PR, 0, Math.PI * 2);
      for (let i = n; i >= 0; i--) { const a = (i / n) * Math.PI * 2, rr = PR * (0.25 + 0.72 * e) * P.hole[i % n]; if (i === n) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath();
      ctx.fillStyle = `rgba(240,245,248,${pa * (1 - Math.min(0.6, P.torn))})`; ctx.fill('evenodd');
    }
    // frame
    ctx.strokeStyle = G.frame; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, PR + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, PR + 3.5, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    ctx.restore();
  }

  function drawTank() {
    const P = S.poi, TW = S.TW, TH = S.TH;
    ctx.save();
    ctx.translate(L.tx, L.ty); ctx.scale(L.s, L.s);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, TW, TH, 18 / L.s); ctx.clip();
    // light on the floor
    if (!caustic) caustic = makeCaustic();
    const pat = ctx.createPattern(caustic, 'repeat');
    ctx.globalCompositeOperation = 'lighter';
    for (const [sp, sc, al] of [[14, 1.8, 0.2]]) {
      pat.setTransform(new DOMMatrix().translateSelf((S.t * sp) % 512, (S.t * sp * 0.6) % 512).scaleSelf(sc, sc));
      ctx.fillStyle = pat; ctx.globalAlpha = al; ctx.fillRect(0, 0, TW, TH);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // fish shadows, the poi under water, the fish
    ctx.fillStyle = 'rgba(15,60,100,.2)';
    for (const f of S.fish) drawShadow(ctx, f, 8, 12);
    if (P && P.under) drawPoi(P);
    const px = L.s * view.dpr;
    for (const f of S.fish) drawFish(ctx, f, null, px);
    // the water surface: tint, lanterns reflected, ripples
    ctx.fillStyle = 'rgba(30,110,170,.13)'; ctx.fillRect(0, 0, TW, TH);
    ctx.globalCompositeOperation = 'lighter';
    for (const [fx, fy, c] of [[0.14, 0.1, '255,150,70'], [0.42, 0.06, '255,190,90'], [0.7, 0.09, '255,120,80'], [0.9, 0.18, '255,180,90']]) {
      const x = fx * TW + Math.sin(S.t * 1.3 + fx * 9) * 6, y = fy * TH, rr = 60 + Math.sin(S.t * 2 + fy * 20) * 6;
      const g = ctx.createRadialGradient(x, y, 2, x, y, rr);
      g.addColorStop(0, `rgba(${c},.32)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1.4 + Math.sin(S.t * 1.7 + fx * 5) * 0.1, 0.7); ctx.translate(-x, -y);
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const p of S.ripples) {
      const k = p.t / p.life;
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 2.5 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, 8 + p.r1 * GK.ease.outCubic(k), 0, Math.PI * 2); ctx.stroke();
      if (k < 0.6) { ctx.beginPath(); ctx.arc(p.x, p.y, 4 + p.r1 * 0.55 * GK.ease.outCubic(k), 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore(); // clip
    // the bowl (お椀) floating at the edge
    const bx = S.bowlX, by = S.bowlY;
    ctx.fillStyle = 'rgba(10,40,80,.28)'; ctx.beginPath(); ctx.ellipse(bx + 10, by + 14, BOWL_R + 6, BOWL_R + 2, 0, 0, Math.PI * 2); ctx.fill();
    let g = ctx.createRadialGradient(bx - 20, by - 24, 10, bx, by, BOWL_R + 8);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9dde3');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, BOWL_R + 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c8303a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, BOWL_R + 4, 0, Math.PI * 2); ctx.stroke();
    g = ctx.createRadialGradient(bx, by, 10, bx, by, BOWL_R);
    g.addColorStop(0, '#cdeefa'); g.addColorStop(1, '#8cc9e6');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, BOWL_R - 2, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(bx, by, BOWL_R - 3, 0, Math.PI * 2); ctx.clip();
    for (const b of S.bowl) {
      const x = bx + Math.cos(b.a) * b.rr, y = by + Math.sin(b.a) * b.rr;
      b.x = x; b.y = y; b.ang = b.a + (b.w > 0 ? Math.PI / 2 : -Math.PI / 2); b.spd = 20;
      drawFish(ctx, b, null, px);
    }
    ctx.restore();
    if (!S.bowl.length && S.state === 'play') {
      ctx.font = font(15, 700); ctx.fillStyle = 'rgba(40,90,130,.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('お椀', bx, by);
    }
    // the poi above water, with the fish on it
    if (P && !P.under) {
      drawPoi(P);
      const k = 1.05 + P.lift * 0.05;
      for (const f of P.carry) drawFish(ctx, { kind: f.kind, spots: f.spots, x: P.x + f.ox * k, y: P.y + f.oy * k, ang: f.ang, ph: f.ph, spd: 0, size: f.size, flop: f.flop * 0.8, bc: f.bc }, null, px);
    }
    // drops and texts
    ctx.fillStyle = 'rgba(235,250,255,.85)';
    for (const d of S.drops) { ctx.beginPath(); ctx.arc(d.x, d.y - d.z * 0.3, 2.2, 0, Math.PI * 2); ctx.fill(); }
    for (const x of S.texts) {
      const k = x.t / x.life, y = x.y - GK.ease.outCubic(Math.min(1, k * 1.5)) * 34;
      ctx.save(); ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.font = font(x.size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,30,60,.85)'; ctx.strokeText(x.s, x.x, y);
      ctx.fillStyle = x.c; ctx.fillText(x.s, x.x, y); ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- HUD, keeper ---------- */
  function pill(x, y, w, h) {
    ctx.fillStyle = 'rgba(12,20,44,.72)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,140,.35)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function txt(t, x, y, px, c, align = 'left', w = 800) { ctx.font = font(px, w); ctx.fillStyle = c; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); }
  const mmss = (t) => { const s = Math.max(0, Math.ceil(t)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function drawPoiStatus(x, y, w, h, k) {
    pill(x, y, w, h);
    const G = GRADES[S.grade], P = S.poi;
    txt('ポイ', x + 12 * k, y + h * 0.32, 10 * k, '#ffc27a', 'left', 700);
    for (let i = 0; i < POIS; i++) {
      const cx = x + 44 * k + i * 15 * k, cy = y + h * 0.32, ok = i < S.poiLeft;
      ctx.strokeStyle = ok ? G.frame : 'rgba(255,255,255,.25)'; ctx.lineWidth = 2.4 * k;
      ctx.beginPath(); ctx.arc(cx, cy, 5 * k, 0, Math.PI * 2); ctx.stroke();
      if (ok) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill(); }
    }
    txt('紙', x + 12 * k, y + h * 0.72, 10 * k, '#ffc27a', 'left', 700);
    const bx = x + 32 * k, bw = w - 44 * k, bh = 7 * k, by = y + h * 0.72 - bh / 2;
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();
    const hp = P && !P.torn ? Math.max(0, P.hp) : 0;
    ctx.fillStyle = hp > 0.6 ? '#8fe08a' : hp > 0.3 ? '#ffd166' : '#ff6b5b';
    if (hp > 0) { ctx.beginPath(); ctx.roundRect(bx, by, Math.max(bh, bw * hp), bh, bh / 2); ctx.fill(); }
    if (P && P.wet > 0.02) { ctx.fillStyle = 'rgba(120,190,255,.55)'; ctx.fillRect(bx, by + bh + 1.5 * k, bw * P.wet, 2 * k); }
  }

  function drawHUD() {
    const H = L.hud, k = L.land ? L.k : L.k * 0.95, h = H.h;
    let x = H.x;
    const low = S.time <= 10 && S.state === 'play';
    const tw = 92 * k; pill(x, H.y, tw, h);
    txt('のこり', x + 12 * k, H.y + h / 2, 10 * k, '#ffc27a', 'left', 700);
    txt(mmss(S.time), x + tw - 10 * k, H.y + h / 2 + 1, 20 * k, low ? '#ff7a6a' : '#fff', 'right');
    x += tw + 8;
    const sw = 104 * k; pill(x, H.y, sw, h);
    txt(GK.fmt(S.score), x + sw - 28 * k, H.y + h / 2 + 1, 19 * k, '#fff', 'right');
    txt('点', x + sw - 12 * k, H.y + h / 2 + 2, 11 * k, '#ffc27a', 'right', 700);
    x += sw + 8;
    const cw = 64 * k;
    if (x + cw <= H.x + H.w + 4) {
      pill(x, H.y, cw, h);
      txt(String(S.count), x + cw - 26 * k, H.y + h / 2 + 1, 19 * k, '#fff', 'right');
      txt('匹', x + cw - 10 * k, H.y + h / 2 + 2, 11 * k, '#ffc27a', 'right', 700);
      x += cw + 8;
    }
    if (L.land) drawPoiStatus(x, H.y, Math.min(170 * k, H.x + H.w - x), h, k);
  }

  function wrap(t, maxW) {
    const lines = []; let cur = '';
    for (const ch of t) { if (ctx.measureText(cur + ch).width > maxW && cur) { if ('、。！？」'.includes(ch)) { cur += ch; continue; } lines.push(cur); cur = ch; } else cur += ch; }
    if (cur) lines.push(cur);
    return lines;
  }
  function bubble(x, y, w, h, tailX, tailY, size, fitH) {
    const showing = S.say.until > S.t || S.state !== 'play';
    const a = showing ? Math.min(1, (S.t - S.say.t) * 6 + 0.001) : 0.5;
    ctx.save(); ctx.globalAlpha = Math.max(0.35, a);
    if (fitH) { ctx.font = font(size, 700); h = Math.min(h, wrap(S.say.text || '', w - 22).length * size * 1.45 + 24); }
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tailX.x0, tailX.y0); ctx.lineTo(tailX.x1, tailX.y1); ctx.lineTo(tailY.x, tailY.y); ctx.closePath(); ctx.fill();
    ctx.font = font(size, 700);
    const lines = wrap(S.say.text || '', w - 22);
    const lh = size * 1.45, maxL = Math.max(1, Math.floor((h - 12) / lh));
    const shown = lines.slice(0, maxL);
    ctx.fillStyle = '#2a2220'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    shown.forEach((ln, i) => ctx.fillText(ln, x + 11, y + h / 2 + (i - (shown.length - 1) / 2) * lh));
    ctx.restore();
    return h;
  }
  const LEGEND = KINDS.map((k) => ({ kind: k, spots: pattern(k, GK.rng(5)), x: 0, y: 0, ang: 0, ph: 0.8, spd: 0, size: 1 }));
  function drawLegend(x, y, w, h) { // landscape: the kinds, their points and this round's catch
    const rowH = Math.min(34 * L.k, h / (KINDS.length + 1.2));
    if (rowH < 17) return;
    ctx.fillStyle = 'rgba(12,20,44,.6)'; ctx.beginPath(); ctx.roundRect(x, y, w, rowH * (KINDS.length + 1.2), 14); ctx.fill();
    txt('金魚の点数', x + 12, y + rowH * 0.62, Math.min(13 * L.k, rowH * 0.5), '#ffc27a', 'left', 700);
    txt('すくった数', x + w - 12, y + rowH * 0.62, Math.min(11 * L.k, rowH * 0.42), '#ffc27a', 'right', 700);
    KINDS.forEach((k, i) => {
      const cy = y + rowH * (i + 1.7), F = LEGEND[i], fl = rowH * 1.25;
      F.size = fl / k.len / (1 + k.tl * 0.6); F.x = x + 12 + fl * 0.62; F.y = cy; F.ph = S.t * 3 + i;
      drawFish(ctx, F, null, view.dpr);
      const n = S.caught[k.id] || 0;
      txt(k.name, x + 18 + fl * 1.15, cy, Math.min(13 * L.k, rowH * 0.46), '#fff4e2', 'left', 700);
      txt(k.pts + ' 点', x + w * 0.66, cy, Math.min(12 * L.k, rowH * 0.42), '#d9c6ad', 'right', 600);
      txt(n ? '×' + n : '−', x + w - 14, cy, Math.min(14 * L.k, rowH * 0.48), n ? '#ffe28a' : 'rgba(255,255,255,.35)', 'right', 800);
    });
  }
  function keeperImg() { return GK.images[S.say.face === 'wow' && S.say.until > S.t ? 'keeper-wow' : 'keeper'] || GK.images.keeper; }

  function drawKeeper() {
    const img = keeperImg();
    if (L.land) {
      const K = L.keeper, s = Math.min(K.w / img.width, K.h / img.height), w = img.width * s, h = img.height * s;
      const bob = S.say.until > S.t && S.t - S.say.t < 0.3 ? Math.sin((S.t - S.say.t) * 30) * 3 : 0;
      ctx.drawImage(img, K.x + (K.w - w) / 2, K.y + K.h - h + bob, w, h);
      const B = L.bubble;
      const bh = bubble(B.x, B.y, B.w, B.h, { x0: B.x + B.w * 0.4, y0: B.y + 1, x1: B.x + B.w * 0.58, y1: B.y + 1 }, { x: B.x + B.w * 0.5, y: B.y - 12 }, 15 * L.k, true);
      const ly = B.y + Math.max(bh, 15 * L.k * 3.3) + 14;
      drawLegend(B.x - 4, ly, B.w + 4, L.panel.y + L.panel.h - ly);
    } else {
      const R = L.row, k = L.k, av = R.h - 4;
      // round portrait: the face (upper part of the picture)
      ctx.save();
      ctx.beginPath(); ctx.arc(R.x + av / 2, R.y + av / 2 + 2, av / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#1d2c55'; ctx.fill(); ctx.clip();
      const sw = img.width * 0.8, sx = img.width * 0.1;
      ctx.drawImage(img, sx, 0, sw, sw, R.x, R.y + 2, av, av);
      ctx.restore();
      ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(R.x + av / 2, R.y + av / 2 + 2, av / 2, 0, Math.PI * 2); ctx.stroke();
      const sw2 = 104 * k, bx = R.x + av + 12, bw = R.w - av - 12 - sw2 - 8;
      bubble(bx, R.y + 4, bw, R.h - 8, { x0: bx + 1, y0: R.y + R.h * 0.4, x1: bx + 1, y1: R.y + R.h * 0.62 }, { x: bx - 10, y: R.y + R.h * 0.55 }, 12.5 * k);
      drawPoiStatus(R.x + R.w - sw2, R.y + 8 * k, sw2, R.h - 16 * k, k * 0.95);
    }
  }

  function draw() {
    renderStatic();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(stat, 0, 0);
    view.reset();
    drawTank();
    drawHUD();
    drawKeeper();
    if (S.state === 'end' && S.endT < 1.7) {
      ctx.save(); ctx.globalAlpha = Math.min(1, S.endT * 3);
      const size = Math.min(52, L.W * 0.1), cx = L.tx + (S.TW * L.s) / 2, cy = L.ty + (S.TH * L.s) * 0.4;
      ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(15,22,48,.9)'; ctx.strokeText(S.endMsg, cx, cy);
      ctx.fillStyle = '#fff3dc'; ctx.fillText(S.endMsg, cx, cy);
      ctx.restore();
    }
  }

  /* ---------------- input ---------------- */
  const touchOffset = (p, e) => (e && e.pointerType === 'touch' ? { x: p.x, y: p.y - 46 } : p);
  GK.pointer(cv, view, {
    down(p, e) {
      if (S.state !== 'play' || S.paused || !S.poi || S.poi.torn) return;
      const t = toTank(touchOffset(p, e)), P = S.poi;
      S.down = true;
      if (P.carry.length) { S.drag = { ox: P.x - t.x, oy: P.y - t.y }; return; }
      if (Math.hypot(t.x - S.bowlX, t.y - S.bowlY) < BOWL_R + 6) { GK.toast('お椀の上ではすくえません'); return; }
      plunge(t.x, t.y);
    },
    move(p, e) {
      if (S.state !== 'play' || S.paused) return;
      const t = toTank(touchOffset(p, e));
      if (S.drag) { S.aim.x = t.x + S.drag.ox; S.aim.y = t.y + S.drag.oy; }
      else if (S.down || e.pointerType === 'mouse') { S.aim.x = t.x; S.aim.y = t.y; }
    },
    up() {
      S.down = false;
      if (S.drag) { S.drag = null; return; }
      if (S.state === 'play' && S.poi && S.poi.under) lift();
    },
  });
  addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat || document.querySelector('.gk-modal-back')) return;
    if (S.state === 'play' && S.poi && !S.paused) { e.preventDefault(); plunge(S.poi.x, S.poi.y); }
  });
  addEventListener('keyup', (e) => { if (e.code === 'Space' && S.state === 'play' && S.poi && S.poi.under) lift(); });

  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => { GK.sfx('ok'); startRound(+b.dataset.grade); }));
  $('#btnHelp').addEventListener('click', () => { GK.sfx('click'); GK.help(); });
  $('#btnDex').addEventListener('click', () => { GK.sfx('click'); openDex(); });
  $('#rAgain').addEventListener('click', () => { GK.sfx('ok'); startRound(S.grade); });
  $('#rDex').addEventListener('click', () => { GK.sfx('click'); openDex(); });
  $('#rTitle').addEventListener('click', () => { GK.sfx('click'); toTitle(); });

  /* ---------------- boot ---------------- */
  GK.init({ id: ID, title: '宵祭り金魚すくい', help: HELP, menu: openMenu });
  let acc = 0, drawnTitle = false;
  GK.loadImages(['bg', 'key', 'keeper', 'keeper-wow', ...KINDS.map((k) => 'fish-' + k.id)]).then(() => {
    layout();
    spawnFish();
    renderTitle();
    S.say = { text: 'らっしゃい、らっしゃい！金魚すくい、一回どうだい？', face: 'normal', until: 0, prio: 0, t: 0 };
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

  window.__ksState = () => ({ state: S.state, under: !!(S.poi && S.poi.under), carry: S.poi ? S.poi.carry.length : 0, hp: S.poi ? +S.poi.hp.toFixed(3) : 0, count: S.count, poiLeft: S.poiLeft, x: S.poi && Math.round(S.poi.x), y: S.poi && Math.round(S.poi.y) });

  /* ---------------- self-test (npm run game-check) ---------------- */
  window.__gameSelfTest = async function () {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG ' + m); };
    const shot = async (n) => { draw(); await GK.wait(60); if (window.__shot) await window.__shot(n); };
    const run = (n) => { for (let i = 0; i < n; i++) tick(FIX); };
    while (!GK.images.keeper) await GK.wait(50);
    S.test = true;
    // 1. a minute of swimming: nothing escapes, nothing breaks
    startRound(4);
    S.time = 999;
    let bad = 0;
    for (let i = 0; i < 3600; i++) {
      tick(FIX);
      if (i % 10) continue;
      for (const f of S.fish) if (!Number.isFinite(f.x + f.y + f.ang + f.spd) || f.x < 0 || f.y < 0 || f.x > S.TW || f.y > S.TH) bad++;
    }
    if (bad) fail(bad + ' fish out of the tub / NaN');
    // 2. scoop for real: plunge under a slow fish, follow it gently, lift, carry to the bowl
    let tries = 0;
    for (; tries < 60 && S.count < 3 && S.state === 'play'; tries++) {
      if (S.poi.torn || S.nextPoiT > 0) { run(90); continue; }
      const f = S.fish.filter((x) => Math.hypot(x.x - S.bowlX, x.y - S.bowlY) > BOWL_R + 120).sort((a, b) => a.spd - b.spd)[0];
      if (!f) break;
      S.aim = { x: f.x, y: f.y }; tick(FIX);
      plunge(f.x, f.y);
      for (let i = 0; i < 14; i++) { S.aim.x += (f.x - S.aim.x) * 0.25; S.aim.y += (f.y - S.aim.y) * 0.25; tick(FIX); }
      lift();
      for (let i = 0; i < 80 && S.poi.carry.length && !S.poi.torn; i++) { S.aim.x += (S.bowlX - S.aim.x) * 0.12; S.aim.y += (S.bowlY - S.aim.y) * 0.12; tick(FIX); }
      run(20);
    }
    if (S.count < 1) fail(`no fish scooped in ${tries} tries`);
    notes.push(`scooped ${S.count} fish in ${tries} tries, score ${S.score}, poi left ${S.poiLeft}, hp ${S.poi.hp.toFixed(2)}`);
    // a fish on the poi, for the picture
    if (S.state === 'play' && !S.poi.torn) {
      const f = S.fish[0];
      S.aim = { x: S.TW * 0.4, y: S.TH * 0.45 }; tick(FIX);
      f.x = S.aim.x + 8; f.y = S.aim.y; f.dash = 0;
      plunge(S.aim.x, S.aim.y); run(5); f.x = S.poi.x + 6; f.y = S.poi.y; f.dash = 0; lift(); run(3);
    }
    await shot('play');
    // 3. scrubbing hard tears the paper
    const left = S.poiLeft;
    if (S.poi.carry.length) { S.aim = { x: S.bowlX, y: S.bowlY }; run(3); }
    if (!S.poi.torn) {
      plunge(S.TW * 0.3, S.TH * 0.4);
      for (let i = 0; i < 240 && !S.poi.torn; i++) { S.aim.x = S.TW * 0.3 + Math.sin(i * 0.5) * 200; S.aim.y = S.TH * 0.4; tick(FIX); }
      if (!S.poi.torn) fail('fast scrubbing did not tear the paper');
      if (S.poiLeft !== left - 1) fail('poi count did not go down');
      await shot('torn');
    }
    // 4. time up → result
    S.time = 0.05; run(5);
    if (S.state !== 'end') fail('round did not end');
    await GK.wait(150);
    if (!$('#result').classList.contains('show')) fail('result not shown');
    await shot('result');
    // 5. the 図鑑
    const m = openDex();
    await GK.wait(250);
    await shot('dex');
    document.querySelector('.gk-modal-back .gk-btn').click();
    await m;
    toTitle();
    S.test = false;
    return { ok, notes };
  };
})();
