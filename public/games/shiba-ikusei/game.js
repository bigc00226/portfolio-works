/*
 * こしば日和 — a Shiba puppy raised in (accelerated) real time.
 * The dog is drawn in code (dog.js); the room, the walk, the ball game, the training and the bath are canvas scenes.
 * Saved with GK.store('dog'). Time: game minutes advance with the real clock × the chosen speed; offline decay is capped.
 */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = GK.clamp, lerp = GK.lerp, rnd = Math.random;
  const pick = (a) => a[(rnd() * a.length) | 0];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const DOG = window.Shiba;
  const store = GK.store;

  /* ================= data ================= */
  const SPEEDS = {
    normal: { label: 'ふつう', perDay: 3, note: '現実の 1 日で 3 日ぶん育ちます' },
    fast: { label: 'はやい', perDay: 24, note: '現実の 1 時間で 1 日ぶん' },
    demo: { label: 'デモ', perDay: 480, note: '現実の 3 分で 1 日ぶん（成長を見るためのモード）' },
  };
  const STAGES = [{ id: 'puppy', name: '子犬', from: 0 }, { id: 'young', name: '若犬', from: 5 }, { id: 'adult', name: '成犬', from: 14 }];
  const FOODS = {
    dry: { name: 'ドライフード', icon: '🥣', price: 0, hunger: 34, mood: 3, note: 'いつものごはん（何度でも）' },
    imo: { name: 'ふかしいも', icon: '🍠', price: 20, hunger: 28, mood: 9, note: 'ほくほく。ごきげんが少し上がる' },
    sasami: { name: 'ささみ', icon: '🍗', price: 30, hunger: 40, mood: 12, aff: 1, note: '大好物。なつき度も少し上がる' },
    special: { name: '特製ごはん', icon: '🍲', price: 60, hunger: 60, mood: 18, aff: 2, note: 'ごちそう。おなかいっぱいに' },
  };
  const TREATS = {
    boro: { name: 'たまごボーロ', icon: '🍪', price: 10, mood: 10, aff: 1.5, note: '小さくて、あげやすい' },
    jerky: { name: 'ジャーキー', icon: '🥓', price: 25, mood: 16, aff: 2.5, note: 'しっぽがちぎれそうなほど喜ぶ' },
    gum: { name: '骨ガム', icon: '🦴', price: 40, mood: 22, aff: 4, note: 'じっくりかじって大満足' },
  };
  const FURN = {
    rug: { name: 'まるいラグ', icon: '🟠', price: 100, note: '部屋があたたかい雰囲気に' },
    clock: { name: 'かべ時計', icon: '🕰️', price: 90, note: '現実の時刻を指します' },
    plant: { name: '観葉植物', icon: '🪴', price: 120, note: '部屋に緑を' },
    toybox: { name: 'おもちゃ箱', icon: '🧸', price: 140, note: 'ひとりでも遊べて、ごきげんが下がりにくくなる' },
    cushion: { name: 'ふかふかベッド', icon: '🛏️', price: 160, note: '眠っているときの体力の回復が早くなる' },
    season: { name: '季節のかざり', icon: '🎐', price: 200, note: '桜・風鈴・紅葉・雪うさぎ。季節ごとに変わります' },
  };
  const TRICKS = [
    { id: 'osuwari', name: 'おすわり', stage: 0 }, { id: 'ote', name: 'お手', stage: 0 },
    { id: 'fuse', name: 'ふせ', stage: 1 }, { id: 'mate', name: 'まて', stage: 1 },
    { id: 'okawari', name: 'おかわり', stage: 2 }, { id: 'kururin', name: 'くるりん', stage: 2 },
  ];
  const LV = [0, 5, 12, 20];
  const TRAITS = { genki: '元気いっぱい', kashikoi: 'かしこい', amae: 'あまえんぼう', nonbiri: 'のんびりや' };
  const SEASON = {
    spring: { name: '春', item: '桜の花びら', icon: '🌸' }, summer: { name: '夏', item: '四つ葉のクローバー', icon: '🍀' },
    autumn: { name: '秋', item: 'どんぐり', icon: '🌰' }, winter: { name: '冬', item: 'まつぼっくり', icon: '🌲' },
  };
  const STAT_DEF = [['hunger', 'おなか', '🍖'], ['mood', 'ごきげん', '♪'], ['clean', '清潔', '✨'], ['energy', '体力', '⚡'], ['aff', 'なつき度', '♥']];
  const dbg = { tod: null, season: null, walkDur: null, rounds: null };
  const tod = () => dbg.tod || (() => { const hr = new Date().getHours(); return hr >= 5 && hr < 16 ? 'day' : hr >= 16 && hr < 19 ? 'evening' : 'night'; })();
  const season = () => dbg.season || (() => { const m = new Date().getMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'; })();

  /* ================= save data ================= */
  function freshDog(name) {
    return {
      v: 1, name, gm: 0, last: Date.now(), born: Date.now(), speed: 'normal',
      st: { hunger: 70, mood: 72, clean: 85, energy: 85, aff: 10 },
      hid: { weight: 0, play: 0, train: 0, pet: 0, sulk: false, treats: 0, treatDay: 0, petAff: 0, petAffT: 0, day: 1 },
      tricks: {}, points: 120, inv: { food: { imo: 1, sasami: 1 }, treat: { boro: 3 } }, furn: {}, sleeping: false, lightsOff: false,
      diary: [], album: [], rec: { walkBest: 0, ballBest: 0, walks: 0, balls: 0, baths: 0, pets: 0, lessons: 0, items: 0 }, stageSeen: { puppy: Date.now() }, firsts: {},
    };
  }
  let S = store.get('dog', null);
  const save = () => { if (S) { S.last = Date.now(); store.set('dog', S); } };
  setInterval(save, 5000);
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else if (S) catchUp(); });

  const days = () => S.gm / 1440;
  const dayNum = () => Math.floor(days()) + 1;
  const stageIdx = () => (days() >= STAGES[2].from ? 2 : days() >= STAGES[1].from ? 1 : 0);
  const stage = () => STAGES[stageIdx()].id;
  const moodKey = () => (S.hid.sulk || S.st.mood < 30 ? 'sad' : S.st.mood >= 65 ? 'happy' : 'normal');
  function trait() {
    if (stageIdx() < 2) return null;
    const { play, train, pet } = S.hid;
    const m = Math.max(play, train, pet / 3);
    if (m < 4) return 'nonbiri';
    return m === play ? 'genki' : m === train ? 'kashikoi' : 'amae';
  }
  const learned = () => TRICKS.filter((t) => (S.tricks[t.id] || 0) >= LV[3]);
  const trickLv = (id) => { const e = S.tricks[id] || 0; return e >= LV[3] ? 3 : e >= LV[2] ? 2 : e >= LV[1] ? 1 : 0; };

  /* ================= time ================= */
  const gmPerMs = () => (SPEEDS[S.speed].perDay * 1440) / 86400000;
  function decay(gmins) {
    const hrs = gmins / 60, st = S.st, sl = S.sleeping;
    st.hunger -= hrs * (sl ? 1.3 : 2.5);
    st.mood -= hrs * (S.furn.toybox ? 0.9 : 1.4) * (st.hunger < 25 ? 1.6 : 1) * (sl ? 0.4 : 1);
    st.clean -= hrs * 0.95;
    st.energy += sl ? hrs * (S.furn.cushion ? 15 : 10) * (S.lightsOff ? 1.4 : 1) : -hrs * 0.9;
    if (st.hunger < 20 || st.clean < 15 || st.mood < 15) st.aff -= hrs * 0.12;
    st.hunger = clamp(st.hunger, 8, 100); st.mood = clamp(st.mood, 5, 100); st.clean = clamp(st.clean, 5, 100);
    st.energy = clamp(st.energy, 3, 100); st.aff = clamp(st.aff, 0, 100);
  }
  function addTime(gmins, decayMins) {
    const before = stageIdx(), d0 = dayNum();
    decay(decayMins == null ? gmins : decayMins);
    S.gm += gmins;
    if (dayNum() !== d0) onNewDay(d0, dayNum());
    if (stageIdx() !== before) onStage();
    if (!S.hid.sulk && S.st.mood < 18 && !S.sleeping) { S.hid.sulk = true; diary(`${S.name}がすねて、こっちを向いてくれない。さびしい思いをさせてしまったかな。`); }
    if (S.hid.sulk && S.st.mood >= 40) { S.hid.sulk = false; diary(`${S.name}の機嫌がなおった。ぴったりくっついてきて、はなれない。`); }
    if (S.sleeping && !S.lightsOff && S.st.energy >= 75) wake(true);
    if (S.sleeping && S.lightsOff && S.st.energy >= 100) wake(true);
  }
  function catchUp() {
    const now = Date.now(), el = Math.max(0, now - (S.last || now));
    S.last = now;
    if (el < 1000) return;
    const gm = el * gmPerMs();
    addTime(gm, Math.min(gm, 18 * 60));
    if (el > 3 * 3600000) {
      const hrs = Math.round(el / 3600000);
      diary(`${hrs >= 24 ? Math.round(hrs / 24) + '日' : hrs + '時間'}ぶりに会えた。${S.name}は玄関まで走ってきて、ぐるぐる回っていた。`);
      R.welcome = true;
    }
  }
  function onNewDay(from, to) {
    const n = Math.min(3, to - from);
    S.points += 20 * n;
    S.hid.treats = 0;
    if (R.ready) GK.toast(`あたらしい一日（${to}日目）　+${20 * n}pt`);
    [3, 7, 10, 20, 30, 50, 100].forEach((m) => { if (from < m && to >= m) { diary(`${S.name}がうちに来て${m}日。${m >= 30 ? 'すっかり家族の一員だ。' : 'だんだん、この家に慣れてきた。'}`); if (m === 7 || m === 30 || m === 100) moment(`うちに来て${m}日`); } });
  }
  function onStage() {
    const sid = stage();
    if (S.stageSeen[sid]) return;
    S.stageSeen[sid] = Date.now();
    if (sid === 'young') diary(`${S.name}が少し大きくなった。足がすらりと伸びて、走るのが速くなった気がする。`);
    if (sid === 'adult') diary(`${S.name}はすっかりおとなの柴犬になった。${TRAITS[trait()]}な子に育ったみたい。`);
    moment(sid === 'young' ? '若犬になった日' : 'おとなになった日');
    if (R.ready) { GK.sfx('win'); GK.toast(`${S.name}が${STAGES[stageIdx()].name}に育ちました！`, 2600); burst(pupScreen().x, pupScreen().y - 80, 'star', 14); }
  }

  /* ================= diary & album ================= */
  function diary(text) {
    S.diary.unshift({ t: Date.now(), d: dayNum(), text });
    if (S.diary.length > 150) S.diary.length = 150;
    renderDiaryMini();
  }
  const pendingMoments = [];
  function moment(title) { pendingMoments.push(title); }
  function captureMoment() {
    const titles = pendingMoments.splice(0);
    try {
      const c = document.createElement('canvas'); c.width = 220; c.height = 220;
      const g = c.getContext('2d');
      const p = pupScreen(), sz = Math.min(view.w, view.h) * 0.62;
      const sx = clamp(p.x - sz / 2, 0, Math.max(0, view.w - sz)), sy = clamp(p.y - sz * 0.62, 0, Math.max(0, view.h - sz));
      g.drawImage(cv, sx * view.dpr, sy * view.dpr, sz * view.dpr, sz * view.dpr, 0, 0, 220, 220);
      const thumb = c.toDataURL('image/jpeg', 0.72);
      titles.forEach((title) => S.album.unshift({ t: Date.now(), d: dayNum(), title, stage: stage(), thumb }));
      if (S.album.length > 30) S.album.length = 30;
    } catch (e) { /* ignore */ }
  }

  /* ================= runtime ================= */
  const R = { ready: false, mode: 'title', t: 0, welcome: false };
  const cv = $('#cv');
  const view = GK.fit(cv);
  const pup = { x: 0.5, z: 0.35, dir: 1, pose: 'sit', moving: false, run: false, phase: 0, tx: 0.5, tz: 0.35, speed: 0.4, act: 'idle', actT: 2, blink: 0, blinkT: 2,
    react: null, reactT: 0, bounce: 0, vy: 0, look: 0, tilt: 0, bubble: null, bubbleT: 0, hold: false, food: null, after: null, spin: 0, trick: null };
  const parts = [];
  const geom = () => { const W = view.w, H = view.h; return { W, H, floorTop: H * 0.62, floorBot: H * 0.95, base: Math.min(W * 1.25, H * 1.0) / 330 }; };
  function floorPos(x, z) { const G = geom(); return { X: x * G.W, Y: lerp(G.floorBot, G.floorTop + G.H * 0.05, z), s: G.base * (1 - 0.3 * z) }; }
  function pupScreen() { const f = floorPos(pup.x, pup.z), sc = f.s * DOG.STAGE[stage()].sc; return { x: f.X, y: f.Y - pup.bounce * sc, s: sc, ground: f.Y }; }

  /* ================= sound ================= */
  GK.sfx.define('bark', () => { const pp = stageIdx() === 0 ? 1.35 : stageIdx() === 1 ? 1.1 : 0.9; GK.tone({ f: 620 * pp, f2: 380 * pp, d: 0.12, type: 'square', v: 0.09 }); GK.noise({ d: 0.07, v: 0.14, f: 1300 * pp, q: 1.2 }); });
  GK.sfx.define('whine', () => GK.tone({ f: 900, f2: 1250, d: 0.32, type: 'sine', v: 0.12 }));
  GK.sfx.define('munch', () => { for (let i = 0; i < 3; i++) GK.noise({ d: 0.05, v: 0.22, f: 1800 + i * 300, q: 2, at: i * 0.13 }); });
  GK.sfx.define('scrub', () => GK.noise({ d: 0.09, v: 0.12, f: 2600, q: 0.8 }));
  GK.sfx.define('squeak', () => GK.tone({ f: 1250, f2: 1750, d: 0.09, type: 'triangle', v: 0.16 }));
  GK.sfx.define('shower', () => GK.noise({ d: 1.4, v: 0.16, f: 5000, filter: 'highpass' }));
  GK.sfx.define('pat', () => GK.tone({ f: 520, f2: 620, d: 0.08, type: 'sine', v: 0.12 }));
  const arp = (ch) => ch.map((c) => { const [a, b, d] = c.split(' '); return `${a} ${b} ${d} ${b} ${a} ${b} ${d} ${b}`; }).join(' | ');
  const halfs = (n) => n.map((x) => `${x} - - - ${x} - - -`).join(' | ');
  const whole = (n) => n.map((x) => `${x} - - - - - - -`).join(' | ');
  const SONGS = {
    day: { bpm: 104, steps: 2, tracks: [
      { type: 'triangle', v: 0.12, notes: 'C5 - E5 G5 E5 - C5 - | D5 - F5 A5 G5 - - - | E5 - G5 C6 B5 - G5 - | A5 - G5 E5 D5 - - - | C5 - E5 G5 A5 - G5 E5 | F5 - E5 D5 C5 - A4 - | G4 - C5 E5 D5 - B4 - | C5 - - - - - . .' },
      { type: 'sine', v: 0.06, notes: arp(['C4 G4 E5', 'D4 A4 F5', 'C4 G4 E5', 'F3 C4 A4', 'C4 G4 E5', 'F3 C4 A4', 'G3 D4 B4', 'C4 G4 E5']) },
      { type: 'triangle', v: 0.12, notes: halfs(['C3', 'D3', 'C3', 'F2', 'C3', 'F2', 'G2', 'C3']) },
    ], drums: { h: '. . x . . . x .' } },
    night: { bpm: 62, steps: 2, tracks: [
      { type: 'sine', v: 0.13, notes: 'A4 - - C5 A4 - G4 - | F4 - - - G4 - - - | A4 - C5 - D5 - C5 - | A4 - - - - - . . | Bb4 - - A4 G4 - F4 - | G4 - A4 - C5 - - - | A4 - G4 - E4 - G4 - | F4 - - - - - . .' },
      { type: 'sine', v: 0.045, notes: arp(['F4 C5 A5', 'C4 G4 E5', 'F4 C5 A5', 'F4 C5 A5', 'Bb3 F4 D5', 'C4 G4 E5', 'C4 G4 E5', 'F4 C5 A5']) },
      { type: 'triangle', v: 0.1, notes: whole(['F3', 'C3', 'F3', 'F3', 'Bb2', 'C3', 'C3', 'F3']) },
    ] },
    walk: { bpm: 120, steps: 2, tracks: [
      { type: 'square', v: 0.05, notes: 'G4 - B4 D5 B4 - G4 - | A4 - C5 E5 D5 - - - | B4 - D5 G5 F#5 - D5 - | E5 - D5 B4 A4 - - - | G4 - B4 D5 E5 - D5 B4 | C5 - B4 A4 G4 - E4 - | D4 - G4 B4 A4 - F#4 - | G4 - - - - - . .' },
      { type: 'triangle', v: 0.1, notes: 'G4 - B4 D5 B4 - G4 - | A4 - C5 E5 D5 - - - | B4 - D5 G5 F#5 - D5 - | E5 - D5 B4 A4 - - - | G4 - B4 D5 E5 - D5 B4 | C5 - B4 A4 G4 - E4 - | D4 - G4 B4 A4 - F#4 - | G4 - - - - - . .' },
      { type: 'triangle', v: 0.13, notes: halfs(['G2', 'A2', 'B2', 'C3', 'G2', 'C3', 'D3', 'G2']) },
    ], drums: { k: 'x . . . x . . .', h: '. . x . . . x .' } },
    game: { bpm: 132, steps: 2, tracks: [
      { type: 'triangle', v: 0.12, notes: 'D5 - F#5 - A5 - F#5 - | G5 - E5 - C#5 - A4 - | B4 - D5 - F#5 - D5 - | E5 - - - . . . . | D5 - F#5 - A5 - B5 - | A5 - G5 - F#5 - E5 - | D5 - E5 - F#5 - E5 - | D5 - - - . . . .' },
      { type: 'triangle', v: 0.12, notes: halfs(['D3', 'A2', 'B2', 'A2', 'D3', 'A2', 'G2', 'D3']) },
    ], drums: { k: 'x . . . x . . .', h: 'x . x . x . x .' } },
  };
  let song = null, audioOn = false;
  function music(name) {
    if (song === name && GK.music.playing) return;
    song = name;
    if (!audioOn) return;
    if (name) GK.music.play(SONGS[name]); else GK.music.stop();
  }
  const roomSong = () => (S && S.sleeping ? 'night' : tod() === 'night' ? 'night' : 'day');
  const unlock = () => { if (audioOn) return; audioOn = true; const s = song; song = null; music(s || 'day'); };
  addEventListener('pointerdown', unlock, true);
  addEventListener('keydown', unlock, true);

  /* ================= particles ================= */
  function burst(x, y, kind, n = 6) {
    for (let i = 0; i < n; i++) parts.push({ kind, x: x + (rnd() - 0.5) * 30, y: y + (rnd() - 0.5) * 16, vx: (rnd() - 0.5) * (kind === 'drop' ? 260 : 60), vy: kind === 'drop' ? -120 - rnd() * 160 : -40 - rnd() * 50, life: 0, max: 0.9 + rnd() * 0.6, s: 0.7 + rnd() * 0.6, rot: rnd() * 6 });
  }
  function heart(g, x, y, s, c) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-9, -3, -5, -11, 0, -6); g.bezierCurveTo(5, -11, 9, -3, 0, 4); g.fillStyle = c; g.fill();
    g.restore();
  }
  function drawParts(g, dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life > p.max) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'drop' || p.kind === 'crumb') p.vy += 600 * dt;
      const a = 1 - p.life / p.max;
      g.globalAlpha = Math.min(1, a * 1.6);
      if (p.kind === 'heart') heart(g, p.x, p.y, p.s * 1.3, '#f2708a');
      else if (p.kind === 'star') { g.fillStyle = '#ffd66b'; g.font = `${16 * p.s + 6}px sans-serif`; g.textAlign = 'center'; g.fillText('✦', p.x, p.y); }
      else if (p.kind === 'note') { g.fillStyle = '#7a5ad8'; g.font = `700 ${14 * p.s + 8}px sans-serif`; g.textAlign = 'center'; g.fillText('♪', p.x, p.y); }
      else if (p.kind === 'drop') { g.fillStyle = '#7cc3ee'; g.beginPath(); g.ellipse(p.x, p.y, 2.5 * p.s, 4 * p.s, 0, 0, 7); g.fill(); }
      else if (p.kind === 'crumb') { g.fillStyle = '#c08a4a'; g.fillRect(p.x, p.y, 3, 3); }
      else if (p.kind === 'foam') { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(p.x, p.y, 5 * p.s, 0, 7); g.fill(); }
      else if (p.kind === 'z') { g.fillStyle = '#9fb4ff'; g.font = `700 ${12 * p.s + 10}px sans-serif`; g.textAlign = 'center'; g.fillText('Z', p.x, p.y); }
      else if (p.kind === 'text') { g.fillStyle = p.c || '#e0566e'; g.font = `800 ${p.size || 20}px ${getComputedStyle(document.body).getPropertyValue('--gk-round') || 'sans-serif'}`; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = '#fff'; g.strokeText(p.text, p.x, p.y); g.fillText(p.text, p.x, p.y); }
    }
    g.globalAlpha = 1;
  }
  function popText(text, x, y, c, size) { parts.push({ kind: 'text', text, x, y, vx: 0, vy: -36, life: 0, max: 1.3, s: 1, c, size }); }

  /* ================= the dog in the room ================= */
  function say(text, sec = 2.2) { pup.bubble = text; pup.bubbleT = sec; }
  function react(kind, sec = 1) { pup.react = kind; pup.reactT = sec; }
  function hop(v = 420) { if (pup.bounce <= 0) pup.vy = v; }
  function goTo(x, z, run, after) { pup.tx = clamp(x, 0.1, 0.9); pup.tz = clamp(z, -0.1, 0.95); pup.moving = true; pup.run = !!run; pup.speed = run ? 0.75 : 0.28; pup.after = after || null; }
  function expr() {
    const st = S.st;
    const o = { eyes: 'normal', mouth: 'smile', ears: 0, wag: 0.5, blush: false, look: pup.look, tilt: pup.tilt };
    if (st.mood >= 70) { o.mouth = 'tongue'; o.wag = 1.1; o.blush = st.aff >= 60; }
    else if (st.mood < 35) { o.mouth = 'flat'; o.wag = 0.1; o.ears = 0.35; if (st.mood < 22) o.eyes = 'sad'; }
    if (st.energy < 25) o.eyes = 'half';
    if (S.hid.sulk) Object.assign(o, { eyes: 'half', mouth: 'flat', ears: 0.85, wag: 0 });
    const r = pup.react;
    if (r === 'happy') Object.assign(o, { eyes: 'happy', mouth: 'tongue', wag: 1.4, blush: true, ears: 0.2 });
    else if (r === 'pat') Object.assign(o, { eyes: 'happy', mouth: 'smile', ears: 0.75, wag: 1.2, blush: true });
    else if (r === 'chin') Object.assign(o, { eyes: 'happy', mouth: 'tongue', wag: 1.3, tilt: 0.18 });
    else if (r === 'surprise') Object.assign(o, { eyes: 'wide', mouth: 'open', ears: 0, wag: 0 });
    else if (r === 'eat') Object.assign(o, { eyes: 'happy', mouth: 'munch', wag: 1.2 });
    else if (r === 'huh') Object.assign(o, { eyes: 'normal', mouth: 'smile', tilt: 0.32, wag: 0.3 });
    else if (r === 'bark') Object.assign(o, { mouth: 'open', wag: 1 });
    else if (r === 'sad') Object.assign(o, { eyes: 'sad', mouth: 'flat', ears: 0.7, wag: 0 });
    else if (r === 'wait') Object.assign(o, { eyes: 'wide', mouth: 'smile', wag: 0.2 });
    o.blink = pup.blink;
    return o;
  }
  function updatePup(dt) {
    pup.blinkT -= dt;
    if (pup.blinkT < 0) { pup.blink = 1; pup.blinkT = 1.8 + rnd() * 3.5; }
    pup.blink = Math.max(0, pup.blink - dt * 7);
    if (pup.bounce > 0 || pup.vy > 0) { pup.vy -= 1500 * dt; pup.bounce = Math.max(0, pup.bounce + pup.vy * dt); if (pup.bounce === 0) pup.vy = 0; }
    if (pup.reactT > 0) { pup.reactT -= dt; if (pup.reactT <= 0) pup.react = null; }
    if (pup.bubbleT > 0) pup.bubbleT -= dt;
    if (pup.moving) {
      const dx = pup.tx - pup.x, dz = pup.tz - pup.z, d = Math.hypot(dx, dz * 0.7);
      if (d < 0.008) { pup.moving = false; pup.pose = 'sit'; pup.run = false; if (pup.after) { const f = pup.after; pup.after = null; f(); } }
      else {
        const v = Math.min(d, pup.speed * dt);
        pup.x += (dx / d) * v; pup.z += (dz / d) * v;
        if (Math.abs(dx) > 0.002) pup.dir = dx > 0 ? 1 : -1;
        pup.phase += dt * (pup.run ? 17 : 10);
        pup.pose = 'side';
      }
    }
  }
  function roomAI(dt) {
    if (S.sleeping) { pup.pose = 'sleep'; pup.moving = false; if (rnd() < dt * 0.8) { const p = pupScreen(); burst(p.x - 20 * p.s, p.y - 60 * p.s, 'z', 1); } return; }
    if (pup.act === 'eat') { pup.actT -= dt; pup.pose = 'sit'; if (rnd() < dt * 6) { const p = pupScreen(); burst(p.x, p.y - 8, 'crumb', 1); } if (pup.actT <= 0) finishEat(); return; }
    if (pup.moving || pup.act === 'trick') { if (pup.act === 'trick') { pup.actT -= dt; if (pup.actT <= 0) { pup.act = 'idle'; pup.trick = null; } } return; }
    pup.actT -= dt;
    if (pup.actT > 0) return;
    pup.actT = 3 + rnd() * 5;
    const st = S.st, tr = trait();
    if (st.energy < 12) { nap(); return; }
    if (S.hid.sulk) { pup.pose = 'sit'; pup.look = rnd() < 0.5 ? 1 : -1; if (rnd() < 0.4) say('ぷい'); return; }
    const need = st.hunger < 30 ? '🍖' : st.clean < 28 ? '🛁' : st.energy < 28 ? '💤' : st.mood < 40 ? '🎾' : null;
    if (need && rnd() < 0.6) { pup.pose = 'sit'; pup.look = 0; say(need, 2.6); GK.sfx('whine'); return; }
    const r = rnd();
    if (r < 0.34) goTo(0.15 + rnd() * 0.7, rnd() * 0.65, tr === 'genki' && rnd() < 0.5);
    else if (r < 0.46 && (st.energy < 60 || tr === 'nonbiri')) { pup.pose = 'lie'; pup.actT = 5 + rnd() * 5; }
    else if (r < 0.56 && tr === 'genki' && st.energy > 40) { goTo(rnd() < 0.5 ? 0.12 : 0.88, rnd() * 0.5, true, () => goTo(0.5, 0.3, true)); say('！'); }
    else if (r < 0.64 && S.furn.toybox) goTo(0.8, 0.12, false, () => { say('♪'); react('happy', 1.2); hop(300); });
    else if (r < 0.72 && learned().length && (tr === 'kashikoi' || rnd() < 0.3)) { const t = pick(learned()); doTrick(t.id, 1.6); say('♪'); }
    else { pup.pose = 'sit'; pup.look = (rnd() - 0.5) * 1.4; pup.tilt = rnd() < 0.2 ? 0.25 : 0; if (rnd() < 0.25) say(pick(['♪', '…', '？'])); }
  }
  function doTrick(id, sec) { pup.act = 'trick'; pup.trick = id; pup.actT = sec; pup.spin = 0; pup.moving = false; if (id === 'osuwari') hop(260); }
  function trickPose(o) {
    const id = pup.trick;
    if (!id) return o;
    if (id === 'ote') o.pawUp = 'L';
    else if (id === 'okawari') o.pawUp = 'R';
    else if (id === 'fuse') o.pose = 'lie';
    else if (id === 'mate') Object.assign(o, { eyes: 'wide', wag: 0.15 });
    else if (id === 'kururin') o.pose = 'side';
    return o;
  }
  function nap() { S.sleeping = true; S.lightsOff = false; pup.pose = 'sleep'; say('💤'); renderActions(); }
  function wake(auto) {
    S.sleeping = false;
    const dark = S.lightsOff;
    S.lightsOff = false;
    pup.pose = 'sit'; pup.actT = 1.5;
    if (!auto && S.st.energy < 45) { S.st.mood -= 3; react('sad', 1.4); say('ねむい…'); } else { react('happy', 1.2); say(dark ? 'おはよう！' : '♪'); }
    music(roomSong());
    renderActions();
  }

  /* ---------- draw the room ---------- */
  let bgCur = null, bgPrev = null, bgFade = 1;
  function drawCover(g, im, W, H, alpha) {
    if (!im) return;
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    const s = Math.max(W / iw, H / ih);
    g.globalAlpha = alpha;
    g.drawImage(im, (W - iw * s) / 2, (H - ih * s) * 0.7, iw * s, ih * s);
    g.globalAlpha = 1;
  }
  function drawBg(g, dt) {
    const G = geom(), key = 'room-' + tod();
    if (bgCur !== key) { bgPrev = bgCur; bgCur = key; bgFade = bgPrev ? 0 : 1; }
    bgFade = Math.min(1, bgFade + dt * 0.6);
    if (bgPrev && bgFade < 1) drawCover(g, GK.images[bgPrev], G.W, G.H, 1);
    drawCover(g, GK.images[bgCur], G.W, G.H, bgPrev ? bgFade : 1);
    const fl = g.createLinearGradient(0, G.floorTop, 0, G.H);
    fl.addColorStop(0, 'rgba(150,100,55,0)'); fl.addColorStop(0.25, 'rgba(150,100,55,.14)'); fl.addColorStop(1, 'rgba(120,80,40,.22)');
    g.fillStyle = fl; g.fillRect(0, G.floorTop, G.W, G.H - G.floorTop);
  }
  function drawFurniture(g, layer) {
    const G = geom(), f = S.furn, u = G.base;
    if (layer === 'wall') {
      if (f.clock) {
        const x = G.W * 0.16, y = G.floorTop * 0.42, r = 24 * u;
        g.fillStyle = '#8a5a34'; g.beginPath(); g.arc(x, y, r + 4 * u, 0, 7); g.fill();
        g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        const d = new Date(), hh = (d.getHours() % 12 + d.getMinutes() / 60) / 12, mm = d.getMinutes() / 60;
        g.strokeStyle = '#3a2a20'; g.lineCap = 'round';
        g.lineWidth = 3 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(hh * 6.283) * r * 0.5, y - Math.cos(hh * 6.283) * r * 0.5); g.stroke();
        g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(mm * 6.283) * r * 0.78, y - Math.cos(mm * 6.283) * r * 0.78); g.stroke();
        g.fillStyle = '#c0533f'; g.beginPath(); g.arc(x, y, 2.5 * u, 0, 7); g.fill();
      }
      if (f.season) drawSeasonDecor(g, G.W * 0.84, G.floorTop * 0.52, u * 0.78);
      return;
    }
    if (layer === 'floor') {
      if (f.rug) {
        const p = floorPos(0.5, 0.32);
        g.fillStyle = '#e9a77a'; g.beginPath(); g.ellipse(p.X, p.Y, G.W * 0.3, 26 * u, 0, 0, 7); g.fill();
        g.strokeStyle = '#f7d2b0'; g.lineWidth = 4 * u; g.beginPath(); g.ellipse(p.X, p.Y, G.W * 0.24, 19 * u, 0, 0, 7); g.stroke();
      }
      if (f.cushion) {
        const p = floorPos(0.2, 0.62);
        g.fillStyle = '#c98b6b'; g.beginPath(); g.ellipse(p.X, p.Y - 6 * p.s, 54 * p.s, 20 * p.s, 0, 0, 7); g.fill();
        g.fillStyle = '#f3d9c9'; g.beginPath(); g.ellipse(p.X, p.Y - 9 * p.s, 42 * p.s, 13 * p.s, 0, 0, 7); g.fill();
      }
      if (f.plant) {
        const p = floorPos(0.9, 0.85), s = p.s;
        g.fillStyle = '#b5683e'; g.beginPath(); g.moveTo(p.X - 18 * s, p.Y - 34 * s); g.lineTo(p.X + 18 * s, p.Y - 34 * s); g.lineTo(p.X + 13 * s, p.Y); g.lineTo(p.X - 13 * s, p.Y); g.fill();
        g.fillStyle = '#5f9e57';
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.38; g.beginPath(); g.ellipse(p.X + Math.cos(a) * 26 * s, p.Y - 34 * s + Math.sin(a) * 30 * s, 9 * s, 22 * s, a + Math.PI / 2, 0, 7); g.fill(); }
      }
    }
    if (layer === 'front' && f.toybox) {
      const p = floorPos(0.84, 0.05), s = p.s;
      g.fillStyle = '#7fb4d8'; g.beginPath(); g.roundRect(p.X - 30 * s, p.Y - 34 * s, 60 * s, 34 * s, 6 * s); g.fill();
      DOG.drawBall(g, p.X - 10 * s, p.Y - 38 * s, 9 * s);
      g.fillStyle = '#f2c94c'; g.beginPath(); g.arc(p.X + 12 * s, p.Y - 38 * s, 8 * s, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = `700 ${12 * s}px sans-serif`; g.textAlign = 'center'; g.fillText('♪', p.X, p.Y - 13 * s);
    }
  }
  function drawSeasonDecor(g, x, y, u) {
    const se = season();
    g.save(); g.translate(x, y); g.scale(u, u);
    if (se === 'summer') {
      const sw = Math.sin(R.t * 2) * 0.15;
      g.strokeStyle = '#6a5a4a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -40); g.lineTo(0, -18); g.stroke();
      g.rotate(sw);
      g.fillStyle = 'rgba(160,220,240,.85)'; g.beginPath(); g.arc(0, -8, 13, Math.PI, 0); g.lineTo(13, -4); g.lineTo(-13, -4); g.fill();
      g.fillStyle = '#e65a5a'; g.fillRect(-7, -8, 3, 3); g.fillRect(3, -11, 3, 3);
      g.strokeStyle = '#6a5a4a'; g.beginPath(); g.moveTo(0, -4); g.lineTo(0, 14); g.stroke();
      g.fillStyle = '#f7f3e6'; g.fillRect(-5, 14, 10, 18);
    } else {
      g.fillStyle = '#c9d6e3'; g.beginPath(); g.moveTo(-12, 40); g.lineTo(12, 40); g.lineTo(9, 0); g.lineTo(-9, 0); g.fill();
      if (se === 'winter') {
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, -10, 18, 12, 0, 0, 7); g.fill();
        g.fillStyle = '#e04a4a'; g.beginPath(); g.arc(-7, -13, 2, 0, 7); g.fill(); g.beginPath(); g.arc(4, -13, 2, 0, 7); g.fill();
        g.fillStyle = '#6aa05a'; g.beginPath(); g.ellipse(-6, -24, 3, 8, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(4, -24, 3, 8, 0.4, 0, 7); g.fill();
      } else {
        g.strokeStyle = '#7a5032'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(-6, -30, -22, -52); g.moveTo(-3, -18); g.quadraticCurveTo(10, -36, 20, -46); g.stroke();
        const col = se === 'spring' ? ['#f7b8c9', '#fde3ea'] : ['#e0663a', '#f2a541'];
        [[-22, -52], [-14, -40], [-8, -28], [20, -46], [12, -36], [2, -48], [-26, -36]].forEach(([px, py], i) => { g.fillStyle = col[i % 2]; g.beginPath(); g.arc(px, py, 5.5, 0, 7); g.fill(); });
      }
    }
    g.restore();
  }
  function drawPup(g, extra) {
    const p = pupScreen();
    let o = Object.assign({ pose: pup.pose, stage: stage(), t: R.t, phase: pup.phase, run: pup.run, walk: !pup.run, holdBall: pup.hold }, expr(), extra || {});
    if (pup.act === 'trick') o = trickPose(o);
    if (pup.act === 'eat') { o.headDown = 0.32 + Math.sin(R.t * 10) * 0.04; o.mouth = 'munch'; o.eyes = 'happy'; }
    g.save();
    g.translate(p.x, p.y);
    const flip = o.pose === 'side' ? pup.dir : 1;
    let sx = p.s * flip;
    if (pup.trick === 'kururin' && pup.act === 'trick') { pup.spin += 1 / 60; sx = p.s * Math.cos(pup.spin * 7); }
    g.scale(sx, p.s);
    if (tod() === 'night' && !S.sleeping) g.filter = 'brightness(.9) saturate(.92)';
    DOG.draw(g, o);
    g.restore();
    if (pup.act === 'eat' && pup.food && pup.food.bowl) {
      const s = p.s;
      g.fillStyle = '#d9534f'; g.beginPath(); g.ellipse(p.x, p.ground + 2 * s, 22 * s, 9 * s, 0, 0, 7); g.fill();
      g.fillStyle = '#b9433f'; g.beginPath(); g.ellipse(p.x, p.ground - 2 * s, 18 * s, 5 * s, 0, 0, 7); g.fill();
      g.fillStyle = '#c99a5b'; g.beginPath(); g.ellipse(p.x, p.ground - 3 * s, 14 * s, 3.5 * s, 0, 0, 7); g.fill();
    }
    if (pup.bubble && pup.bubbleT > 0) {
      const hy = p.y - DOG.parts(stage()).height * p.s - 18;
      const a = Math.min(1, pup.bubbleT * 3);
      g.globalAlpha = a;
      g.font = `700 ${Math.round(16 + 4 * p.s)}px ${getComputedStyle(document.documentElement).getPropertyValue('--gk-round')}`;
      const w = Math.max(40, g.measureText(pup.bubble).width + 22), bx = clamp(p.x + 26 * p.s, w / 2 + 6, view.w - w / 2 - 6);
      g.fillStyle = '#fff'; g.strokeStyle = 'rgba(80,50,20,.25)'; g.lineWidth = 1.5;
      g.beginPath(); g.roundRect(bx - w / 2, hy - 18, w, 34, 17); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(bx - 8, hy + 15); g.lineTo(bx - 14, hy + 26); g.lineTo(bx + 2, hy + 15); g.fill();
      g.fillStyle = '#4a3220'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(pup.bubble, bx, hy);
      g.textBaseline = 'alphabetic'; g.globalAlpha = 1;
    }
  }
  function drawRoom(g, dt) {
    drawBg(g, dt);
    drawFurniture(g, 'wall');
    drawFurniture(g, 'floor');
    drawPup(g);
    drawFurniture(g, 'front');
    if (S.sleeping && S.lightsOff) {
      const G = geom();
      g.fillStyle = 'rgba(12,16,44,.62)'; g.fillRect(0, 0, G.W, G.H);
      const p = pupScreen(), rg = g.createRadialGradient(p.x, p.y - 30, 10, p.x, p.y - 30, Math.max(G.W, G.H) * 0.5);
      rg.addColorStop(0, 'rgba(255,240,200,.16)'); rg.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = rg; g.fillRect(0, 0, G.W, G.H);
    }
  }

  /* ================= actions (room) ================= */
  const busy = () => R.mode !== 'room' || pup.act === 'eat';
  function canPlay(what) {
    if (S.sleeping) { GK.toast(`${S.name}は眠っています`); return false; }
    if (S.hid.sulk) { GK.toast(`${S.name}はすねています。なでたり、おやつをあげたりしてみよう`); react('sad', 1); say('ぷい'); return false; }
    if (S.st.energy < 18) { GK.toast(`${S.name}はつかれているみたい。ねかせてあげよう`); say('💤'); return false; }
    if (what === 'walk' && S.st.hunger < 15) { GK.toast('おなかがすいて歩けないみたい。先にごはんを'); say('🍖'); return false; }
    return true;
  }
  function feed(kind, id) {
    if (busy()) return;
    if (S.sleeping) { GK.toast(`${S.name}は眠っています`); return; }
    const item = (kind === 'food' ? FOODS : TREATS)[id];
    if (id !== 'dry' && !(S.inv[kind][id] > 0)) { GK.toast('もっていません。ショップで買えます'); return; }
    if (kind === 'food' && S.st.hunger >= 92) { GK.toast(`${S.name}はおなかいっぱいみたい`); react('huh', 1); say('けぷ'); return; }
    if (id !== 'dry') S.inv[kind][id]--;
    pup.moving = false; pup.pose = 'sit'; pup.look = 0;
    pup.act = 'eat'; pup.food = Object.assign({ kind, id, bowl: kind === 'food' }, item); pup.actT = kind === 'food' ? 2.6 : 1.4;
    react('eat', pup.actT);
    GK.sfx('munch');
    const iv = setInterval(() => { if (pup.act !== 'eat') clearInterval(iv); else GK.sfx('munch'); }, 600);
    renderActions();
  }
  function finishEat() {
    const f = pup.food, st = S.st;
    pup.act = 'idle'; pup.food = null; pup.actT = 2;
    if (!f) return;
    if (f.kind === 'food') { st.hunger = clamp(st.hunger + f.hunger, 0, 100); st.mood = clamp(st.mood + f.mood, 0, 100); st.aff = clamp(st.aff + (f.aff || 0.4), 0, 100); }
    else {
      st.mood = clamp(st.mood + f.mood, 0, 100); st.aff = clamp(st.aff + f.aff, 0, 100); st.hunger = clamp(st.hunger + 4, 0, 100);
      S.hid.treats++;
      if (S.hid.treats > 4) { S.hid.weight++; if (S.hid.treats === 5) { GK.toast('おやつは ほどほどに……'); diary(`今日はおやつをあげすぎたかもしれない。${S.name}のおなかがまるい。`); } }
    }
    if (S.st.mood >= 40 && S.hid.sulk) { S.hid.sulk = false; diary(`${f.name}をあげたら、${S.name}の機嫌がなおった。現金な子だ。`); }
    if (!S.firsts.eat && f.kind === 'food') { S.firsts.eat = 1; diary(`はじめてのごはん。お皿に顔をつっこんで、あっというまに${f.name}を食べてしまった。`); }
    react('happy', 1.3); hop(300); GK.sfx('pop');
    const p = pupScreen(); burst(p.x, p.y - 70 * p.s, 'heart', 4);
    renderActions();
  }
  /* petting with the pointer */
  const petState = { down: false, last: null, acc: 0, zone: null, tap: true, start: null, cool: 0 };
  function zoneAt(x, y) {
    if (pup.pose === 'side' || pup.moving) return null;
    const p = pupScreen(), P = DOG.parts(stage()), s = p.s;
    if (pup.pose === 'sit') {
      const hx = p.x, hy = p.y + P.headY * s, hr = P.headR * s;
      if (Math.hypot(x - hx, (y - hy) * 1.1) < hr * 1.25) return y < hy - hr * 0.2 ? 'head' : y > hy + hr * 0.3 ? 'chin' : 'cheek';
      if (Math.hypot(x - (p.x + P.tailX * s), y - (p.y + P.tailY * s)) < P.tailR * s * 1.2) return 'tail';
      const dx = (x - p.x) / (P.bodyRX * s), dy = (y - (p.y + P.bodyY * s)) / (P.bodyRY * s);
      if (dx * dx + dy * dy < 1.35) return y > p.y - 10 * s ? 'paw' : dy > 0.1 ? 'belly' : 'back';
      return null;
    }
    const dx = (x - (p.x + 5 * s)) / (90 * s), dy = (y - (p.y - 28 * s)) / (40 * s);
    return dx * dx + dy * dy < 1.2 ? 'back' : null;
  }
  function petTick(zone, x, y) {
    const st = S.st;
    S.rec.pets++;
    S.hid.pet++;
    if (S.sleeping) { st.mood = clamp(st.mood + 0.8, 0, 100); burst(x, y, 'heart', 1); say('すや…', 1); return; }
    const now = Date.now();
    if (now - S.hid.petAffT > 3600000) { S.hid.petAffT = now; S.hid.petAff = 0; }
    const gain = S.hid.petAff < 6 ? 0.35 : 0.05;
    S.hid.petAff += gain;
    st.aff = clamp(st.aff + gain, 0, 100);
    st.mood = clamp(st.mood + (S.hid.sulk ? 4 : 2.2), 0, 100);
    if (S.hid.sulk && st.mood >= 40) { S.hid.sulk = false; diary(`なでていたら、${S.name}がやっとこっちを向いてくれた。`); }
    burst(x, y, 'heart', 1);
    GK.sfx('pat');
    if (zone === 'head') react('pat', 0.9);
    else if (zone === 'chin' || zone === 'cheek') react('chin', 0.9);
    else if (zone === 'belly') { react('happy', 1); if (rnd() < 0.3) say('♪'); }
    else if (zone === 'back') react('happy', 0.8);
    if (!S.firsts.pet) { S.firsts.pet = 1; diary(`はじめてなでた。${zone === 'head' ? '頭' : 'せなか'}をなでると、目を細めてうっとりしていた。`); }
  }
  function touchZone(zone, x, y) {
    if (S.sleeping) return;
    if (zone === 'tail') { if (petState.cool > 0) return; petState.cool = 1.5; react('surprise', 0.9); hop(460); GK.sfx('bark'); say('！'); S.st.mood = clamp(S.st.mood - 1, 0, 100); GK.toast('しっぽはびっくりするみたい'); return; }
    if (zone === 'paw') { react('happy', 1); doTrick(trickLv('ote') >= 1 ? 'ote' : 'osuwari', 1.2); say(trickLv('ote') >= 1 ? 'お手！' : '？'); return; }
    react('bark', 0.5); GK.sfx('bark'); hop(240); pup.look = 0;
  }

  /* ================= the action bar ================= */
  const actionsEl = $('#actions');
  const ROOM_ACTIONS = [['feed', 'ごはん', '🍚'], ['treat', 'おやつ', '🍪'], ['pet', 'なでる', '✋'], ['play', 'あそぶ', '🎾'], ['walk', 'さんぽ', '🐾'], ['bath', 'おふろ', '🛁'], ['sleep', 'ねる', '🌙'], ['train', 'しつけ', '🎓']];
  function renderActions() {
    if (R.mode === 'room' && S) {
      actionsEl.className = 'room';
      actionsEl.innerHTML = ROOM_ACTIONS.map(([id, label, icon]) => {
        let l = label, ic = icon, dis = false;
        if (id === 'sleep' && S.sleeping) { l = 'おきる'; ic = '☀️'; }
        if (S.sleeping && id !== 'sleep' && id !== 'pet') dis = true;
        if (pup.act === 'eat' && id !== 'pet') dis = true;
        return `<button type="button" data-a="${id}"${dis ? ' disabled' : ''}><span class="ic">${ic}</span><span>${l}</span></button>`;
      }).join('');
    } else if (R.mode !== 'room' && MG[R.mode]) {
      actionsEl.className = 'mini';
      actionsEl.innerHTML = MG[R.mode].controls().map((c) => `<button type="button" data-c="${c.id}" class="${c.primary ? 'primary' : ''}"${c.disabled ? ' disabled' : ''}>${c.icon ? `<span class="ic">${c.icon}</span>` : ''}<span>${c.label}</span></button>`).join('');
    }
  }
  actionsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    unlock();
    if (b.dataset.a) roomAction(b.dataset.a);
    else if (b.dataset.c && MG[R.mode]) MG[R.mode].control(b.dataset.c);
  });
  function roomAction(a) {
    if (R.mode !== 'room') return;
    GK.sfx('click');
    switch (a) {
      case 'feed': chooseItem('food'); break;
      case 'treat': chooseItem('treat'); break;
      case 'pet': {
        if (pup.moving) { pup.moving = false; pup.pose = 'sit'; }
        const p = pupScreen(), P = DOG.parts(stage());
        petTick('head', p.x, p.y + P.headY * p.s - 20);
        GK.toast('🐾 犬をなでるように、指やマウスでこすってみよう');
        break;
      }
      case 'play': if (canPlay('play')) startMini('ball'); break;
      case 'walk': if (canPlay('walk')) startMini('walk'); break;
      case 'bath': if (S.sleeping) GK.toast(`${S.name}は眠っています`); else startMini('bath'); break;
      case 'sleep':
        if (S.sleeping) wake(false);
        else { S.sleeping = true; S.lightsOff = true; pup.moving = false; pup.pose = 'sleep'; music('night'); GK.toast('おやすみなさい。あかりを消しました'); if (!S.firsts.sleep) { S.firsts.sleep = 1; diary(`はじめていっしょの部屋で眠った。${S.name}の寝息が聞こえる。`); } renderActions(); }
        break;
      case 'train': if (canPlay('train')) chooseTrick(); break;
      default: break;
    }
  }
  function chooseItem(kind) {
    if (busy() || S.sleeping) { if (S.sleeping) GK.toast(`${S.name}は眠っています`); return; }
    const list = kind === 'food' ? FOODS : TREATS;
    const body = h('div', 'items');
    body.innerHTML = Object.entries(list).map(([id, it]) => {
      const n = id === 'dry' ? '∞' : S.inv[kind][id] || 0;
      return `<button type="button" class="item" data-id="${id}"${n === 0 ? ' disabled' : ''}><span class="ii">${it.icon}</span><span class="in"><b>${esc(it.name)}</b><small>${esc(it.note)}</small></span><span class="iq">×${n}</span></button>`;
    }).join('') + `<p class="hint">${kind === 'treat' ? `今日あげたおやつ：${S.hid.treats} 個（あげすぎ注意）・` : ''}足りないものは「ショップ」で買えます。</p>`;
    let close = null;
    body.addEventListener('click', (e) => { const b = e.target.closest('.item'); if (b && !b.disabled && close) close(b.dataset.id); });
    GK.modal({ title: kind === 'food' ? 'ごはんをあげる' : 'おやつをあげる', body, cls: 'sb-items', buttons: [{ label: 'ショップへ', value: '#shop', ghost: true }, { label: 'とじる', value: null }], onOpen: (c, cl) => { close = cl; } })
      .then((v) => { if (v === '#shop') openShop(kind); else if (v) feed(kind, v); });
  }
  function chooseTrick() {
    const si = stageIdx();
    const body = h('div', 'items');
    body.innerHTML = TRICKS.map((t) => {
      const lock = t.stage > si, lv = trickLv(t.id);
      return `<button type="button" class="item" data-id="${t.id}"${lock ? ' disabled' : ''}><span class="ii">${lock ? '🔒' : '🎓'}</span><span class="in"><b>${t.name}</b><small>${lock ? `${STAGES[t.stage].name}になると教えられます` : lv >= 3 ? '覚えた！（練習するともっと上手に）' : `経験 ${S.tricks[t.id] || 0} / ${LV[3]}`}</small></span><span class="iq stars">${'★'.repeat(lv)}${'☆'.repeat(3 - lv)}</span></button>`;
    }).join('') + '<p class="hint">わっかが点線の円に重なった瞬間にタップ（またはスペースキー）で合図を出します。5 回で 1 回の練習です。</p>';
    let close = null;
    body.addEventListener('click', (e) => { const b = e.target.closest('.item'); if (b && !b.disabled && close) close(b.dataset.id); });
    GK.modal({ title: 'しつけ ― どれを教える？', body, cls: 'sb-items', buttons: [{ label: 'とじる', value: null }], onOpen: (c, cl) => { close = cl; } })
      .then((v) => { if (v) startMini('train', v); });
  }

  /* ================= mini-games ================= */
  const MG = {};
  function startMini(kind, arg) {
    R.mode = kind;
    pup.moving = false; pup.act = 'idle'; pup.trick = null; pup.hold = false; pup.react = null;
    document.body.classList.add('in-mini');
    MG[kind].start(arg);
    renderActions();
    renderHud();
  }
  function endMini() {
    R.mode = 'room';
    document.body.classList.remove('in-mini');
    $('#hud').innerHTML = ''; $('#prompt').hidden = true;
    pup.x = 0.5; pup.z = 0.3; pup.pose = 'sit'; pup.hold = false; pup.trick = null; pup.act = 'idle'; pup.actT = 2; pup.dir = 1;
    music(roomSong());
    renderActions();
    save();
  }
  async function results(title, rows, extra) {
    const body = `<table class="res">${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>${extra || ''}`;
    await GK.modal({ title, body, cls: 'sb-res', buttons: [{ label: 'へやにもどる', value: true, primary: true }] });
  }
  function renderHud() { if (MG[R.mode] && MG[R.mode].hud) $('#hud').innerHTML = MG[R.mode].hud(); }
  const mstat = (k, v) => { S.st[k] = clamp(S.st[k] + v, 0, 100); };

  /* ---------- ball (あそぶ) ---------- */
  const B = {};
  MG.ball = {
    start() {
      Object.assign(B, { round: 0, rounds: dbg.rounds || 5, score: 0, phase: 'ready', t: 0, ball: null, dn: null, catches: 0, msg: '' });
      pup.x = 0.5; pup.z = 0.18; pup.pose = 'sit'; pup.dir = 1;
      music('game');
    },
    hud: () => `<span>🎾 ${Math.min(B.round + 1, B.rounds)} / ${B.rounds} 投め</span><span>得点 <b>${B.score}</b></span>`,
    controls: () => [{ id: 'act', label: B.phase === 'ready' ? 'なげる' : 'キャッチ！', icon: B.phase === 'ready' ? '🎾' : '⤴️', primary: true, disabled: !(B.phase === 'ready' || B.phase === 'flying') }, { id: 'quit', label: 'やめる', icon: '🏠' }],
    control(id) { if (id === 'act') this.primary(); if (id === 'quit') this.finish(true); },
    primary() { if (B.phase === 'ready') this.throw(0.2 + rnd() * 0.6, 0.45 + rnd() * 0.5); else if (B.phase === 'flying') this.tryCatch(); },
    throw(x, z) {
      if (B.phase !== 'ready') return;
      const T = 0.85 + z * 0.55;
      B.ball = { x0: 0.5, z0: -0.18, x1: clamp(x, 0.12, 0.88), z1: clamp(z, 0.25, 0.98), T, t: 0, peak: 150 + z * 150, landed: false };
      B.phase = 'flying'; B.tried = false; B.msg = '';
      GK.sfx('jump');
      goTo(B.ball.x1, B.ball.z1, true);
      pup.speed = Math.hypot(B.ball.x1 - pup.x, (B.ball.z1 - pup.z) * 0.7) / (T * 0.82) + 0.02;
      renderActions(); renderHud();
    },
    tryCatch() {
      if (B.phase !== 'flying' || B.tried) return;
      B.tried = true;
      const rem = B.ball.T - B.ball.t;
      const near = Math.hypot(pup.x - B.ball.x1, pup.z - B.ball.z1) < 0.06;
      hop(520);
      if (rem <= 0.42 && rem >= 0.04 && near) {
        const perfect = rem >= 0.12 && rem <= 0.3;
        B.score += perfect ? 20 : 12; B.catches++;
        B.phase = 'return'; pup.hold = true; react('happy', 1.4);
        const p = pupScreen();
        popText(perfect ? 'パーフェクト！' : 'ナイスキャッチ！', p.x, p.y - 120 * p.s, perfect ? '#e0566e' : '#e07b2a', 22);
        GK.sfx(perfect ? 'coin' : 'ok'); burst(p.x, p.y - 80 * p.s, 'star', perfect ? 8 : 4);
        this.back();
      } else { const p = pupScreen(); popText(rem > 0.42 ? 'はやい！' : 'おそい！', p.x, p.y - 110 * p.s, '#6b7da8', 20); GK.sfx('ng'); }
      renderActions(); renderHud();
    },
    back() { B.phase = 'return'; pup.hold = true; setTimeout(() => goTo(0.5, 0.18, true, () => this.drop()), 350); },
    drop() {
      pup.hold = false; GK.sfx('squeak'); react('happy', 1); say('♪', 1.2);
      B.round++;
      if (B.round >= B.rounds) { setTimeout(() => this.finish(false), 700); B.phase = 'done'; }
      else B.phase = 'ready';
      renderActions(); renderHud();
    },
    update(dt) {
      const b = B.ball;
      if (B.phase === 'flying' && b) {
        b.t += dt;
        if (b.t >= b.T && !b.landed) {
          b.landed = true; GK.sfx('hit');
          const p = pupScreen();
          if (!B.tried) popText('おしい！', p.x, p.y - 110 * p.s, '#6b7da8', 20);
          B.score += 3; B.phase = 'fetch';
          setTimeout(() => { if (R.mode === 'ball') { pup.hold = true; this.back(); } }, 450);
          renderActions(); renderHud();
        }
      }
    },
    draw(g, dt) {
      drawBg(g, dt); drawFurniture(g, 'wall'); drawFurniture(g, 'floor');
      const b = B.ball;
      let bp = null;
      if (b && !pup.hold && (B.phase === 'flying' || B.phase === 'fetch')) {
        const k = Math.min(1, b.t / b.T);
        const x = lerp(b.x0, b.x1, k), z = lerp(b.z0, b.z1, k), f = floorPos(x, z);
        const hgt = b.landed ? Math.abs(Math.sin((b.t - b.T) * 9)) * 16 * Math.max(0, 1 - (b.t - b.T) * 2) : 4 * b.peak * k * (1 - k) * f.s;
        g.fillStyle = 'rgba(60,40,20,.2)'; g.beginPath(); g.ellipse(f.X, f.Y, 10 * f.s, 4 * f.s, 0, 0, 7); g.fill();
        bp = { x: f.X, y: f.Y - hgt - 9 * f.s, r: 9 * f.s };
        if (b.landed) b.t += 0;
      }
      if (B.phase === 'flying' && b) {
        const rem = b.T - b.t;
        if (rem < 0.6) {
          const p = pupScreen(), rr = 34 * p.s + Math.max(0, rem - 0.12) * 120;
          g.strokeStyle = rem <= 0.42 && rem >= 0.04 ? 'rgba(240,90,110,.9)' : 'rgba(255,255,255,.75)'; g.lineWidth = 3;
          g.beginPath(); g.arc(p.x, p.y - 60 * p.s, rr, 0, 7); g.stroke();
        }
      }
      const behind = bp && b && lerp(b.z0, b.z1, Math.min(1, b.t / b.T)) > pup.z;
      if (bp && behind) DOG.drawBall(g, bp.x, bp.y, bp.r);
      drawPup(g);
      if (bp && !behind) DOG.drawBall(g, bp.x, bp.y, bp.r);
      if (B.phase === 'ready') {
        const G = geom();
        DOG.drawBall(g, G.W * 0.5, G.H * 0.93, 14 * G.base);
        g.fillStyle = 'rgba(60,40,20,.75)'; g.font = `700 ${Math.round(13 + G.base * 2)}px ${getComputedStyle(document.documentElement).getPropertyValue('--gk-round')}`; g.textAlign = 'center';
        g.fillText('ボールを上へスワイプ（タップでもOK）', G.W * 0.5, G.H * 0.86);
      }
      drawFurniture(g, 'front');
    },
    down(p) { if (B.phase === 'ready') B.dn = p; else if (B.phase === 'flying') this.tryCatch(); },
    up(p) {
      if (B.phase !== 'ready' || !B.dn) return;
      const dx = p.x - B.dn.x, dy = B.dn.y - p.y, G = geom();
      B.dn = null;
      if (Math.hypot(dx, dy) < 24 || dy < 10) { this.throw(0.2 + rnd() * 0.6, 0.45 + rnd() * 0.5); return; }
      this.throw(0.5 + (dx / G.W) * 1.6, dy / (G.H * 0.45));
    },
    async finish(quit) {
      if (R.mode !== 'ball') return;
      const sc = B.score;
      R.mode = 'result';
      const pts = sc;
      S.points += pts; S.rec.balls++; S.hid.play++;
      if (B.round > 0) { mstat('mood', 6 + B.round * 2); mstat('energy', -4 - B.round * 2); mstat('hunger', -2 - B.round); mstat('aff', 0.4 * B.round); }
      const best = sc > S.rec.ballBest; if (best) S.rec.ballBest = sc;
      if (!S.firsts.ball) { S.firsts.ball = 1; diary(`はじめてボールあそびをした。投げると、全力で追いかけていく。`); moment('はじめてのボールあそび'); }
      else if (best && sc >= 60) diary(`ボールあそびで${sc}点！ ジャンプしてキャッチするのが上手になってきた。`);
      if (!quit || B.round > 0) await results('ボールあそび', [['得点', `${sc} 点${best ? '（ベスト！）' : ''}`], ['キャッチ', `${B.catches} / ${B.round} 回`], ['もらったポイント', `+${pts} pt`], ['ごきげん', '↑ 上がった'], ['体力', '↓ 少しつかれた']]);
      endMini();
    },
  };

  /* ---------- walk (さんぽ) ---------- */
  const Wk = {};
  MG.walk = {
    start() {
      Object.assign(Wk, { t: 0, dur: dbg.walkDur || 40, dist: 0, y: 0, vy: 0, objs: [], next: 1.4, score: 0, found: 0, muddy: 0, combo: 0, slow: 0, enc: null, encN: 0, phase: 0, scroll: 0, ended: false, greet: 0, treats: 0 });
      music('walk');
    },
    hud: () => `<span>🐾 ${Math.round(Wk.dist)} m</span><span>得点 <b>${Wk.score}</b></span><span class="tbar"><i style="width:${Math.max(0, 100 - (Wk.t / Wk.dur) * 100)}%"></i></span>`,
    controls: () => [{ id: 'jump', label: 'ジャンプ', icon: '⤴️', primary: true }, { id: 'quit', label: 'かえる', icon: '🏠' }],
    control(id) { if (id === 'jump') this.primary(); if (id === 'quit') this.finish(); },
    unit() { return view.h / 360; },
    primary() {
      if (Wk.enc) { this.answer(true); return; }
      if (Wk.y <= 0.01) { Wk.vy = 760; GK.sfx('jump'); }
    },
    spawn() {
      const u = this.unit(), r = rnd();
      const x = view.w + 60 * u;
      if (r < 0.2 && !Wk.enc && Wk.t < Wk.dur - 7 && Wk.encN < 3) { Wk.encN++; Wk.objs.push({ type: 'enc', kind: pick(['dog', 'cat', 'person']), x, w: 70 }); return; }
      if (r < 0.42) Wk.objs.push({ type: 'puddle', x, w: 58, h: 10 });
      else if (r < 0.58) Wk.objs.push({ type: 'stone', x, w: 30, h: 26 });
      else if (r < 0.85) Wk.objs.push({ type: 'bone', x, w: 26, hgt: rnd() < 0.4 ? 95 : 22 });
      else Wk.objs.push({ type: 'item', x, w: 26, hgt: rnd() < 0.5 ? 110 : 30 });
    },
    answer(ok) {
      const e = Wk.enc;
      if (!e) return;
      Wk.enc = null; $('#prompt').hidden = true;
      e.o.done = true;
      const p = { x: view.w * 0.26, y: view.h * 0.6 };
      if (e.o.kind === 'dog') { Wk.score += 10; Wk.greet++; mstat('mood', 3); popText('あいさつ！ +10', p.x, p.y, '#e07b2a'); GK.sfx('bark'); }
      else if (e.o.kind === 'person') { Wk.score += 8; Wk.treats++; S.inv.treat.boro = (S.inv.treat.boro || 0) + 1; popText('ボーロをもらった！', p.x, p.y, '#e07b2a'); GK.sfx('ok'); }
      else if (ok) { Wk.score += 12; S.tricks.mate = (S.tricks.mate || 0) + (stageIdx() >= 1 ? 1 : 0); popText('えらい！ まてができた', p.x, p.y, '#e0566e'); GK.sfx('ok'); }
      else { Wk.combo = 0; popText('ねこを追いかけたい……', p.x, p.y, '#6b7da8'); GK.sfx('bark'); Wk.slow = 1; }
      renderHud();
    },
    update(dt) {
      if (Wk.ended) return;
      const u = this.unit();
      if (Wk.enc) {
        Wk.enc.timer -= dt;
        $('#prompt .pt i') && ($('#prompt .pt i').style.width = Math.max(0, (Wk.enc.timer / Wk.enc.max) * 100) + '%');
        if (Wk.enc.timer <= 0) this.answer(Wk.enc.o.kind !== 'cat');
        return;
      }
      Wk.t += dt;
      const v = 210 * u * (Wk.slow > 0 ? 0.5 : 1) * (1 + Wk.t / Wk.dur * 0.35);
      Wk.slow -= dt;
      Wk.scroll += v * dt; Wk.dist += (v * dt) / u / 30;
      Wk.phase += dt * 15;
      Wk.vy -= 2300 * dt; Wk.y = Math.max(0, Wk.y + Wk.vy * dt); if (Wk.y === 0 && Wk.vy < 0) Wk.vy = 0;
      Wk.next -= dt;
      if (Wk.next <= 0) { this.spawn(); Wk.next = 0.85 + rnd() * 0.8; }
      const dogX = view.w * 0.26;
      for (let i = Wk.objs.length - 1; i >= 0; i--) {
        const o = Wk.objs[i];
        o.x -= v * dt;
        if (o.x < -100 * u) { Wk.objs.splice(i, 1); continue; }
        if (o.hit || o.done) continue;
        const dx = Math.abs(o.x - dogX);
        if (o.type === 'enc' && o.x - dogX < 170 * u) {
          o.hit = true;
          const T = { dog: ['お友だちのわんこ', 'あいさつする', 4], cat: ['ねこがいる！', 'まて！', 1.6], person: ['近所のおばあさん', 'こんにちは', 4] }[o.kind];
          Wk.enc = { o, timer: T[2], max: T[2] };
          const pr = $('#prompt');
          pr.innerHTML = `<p>${T[0]}</p><button type="button" class="gk-btn primary">${T[1]}</button><span class="pt"><i></i></span>`;
          pr.hidden = false;
          pr.querySelector('button').onclick = (e) => { e.stopPropagation(); this.answer(true); };
          if (o.kind === 'cat') GK.sfx('whine');
          continue;
        }
        if (o.type === 'puddle' && dx < (o.w / 2 + 14) * u && Wk.y < 8 * u) { o.hit = true; Wk.muddy++; Wk.combo = 0; GK.sfx('splash'); burst(dogX, view.h * 0.84, 'drop', 8); popText('どろんこ…', dogX, view.h * 0.6, '#6b7da8'); }
        if (o.type === 'stone' && dx < (o.w / 2 + 12) * u && Wk.y < o.h * u) { o.hit = true; Wk.combo = 0; Wk.slow = 0.8; GK.sfx('hit'); popText('つまずいた！', dogX, view.h * 0.6, '#6b7da8'); }
        if ((o.type === 'bone' || o.type === 'item') && dx < 30 * u && Math.abs(Wk.y - o.hgt * u) < 42 * u) {
          o.hit = true; Wk.combo++;
          const add = (o.type === 'bone' ? 5 : 8) + Math.min(10, Wk.combo);
          Wk.score += add; if (o.type === 'item') Wk.found++;
          GK.sfx(o.type === 'bone' ? 'coin' : 'ok'); popText(`+${add}`, o.x, view.h * 0.84 - o.hgt * u - 20 * u, '#e07b2a');
        }
      }
      if (Wk.t >= Wk.dur) this.finish();
      if ((Wk.t * 10 | 0) % 3 === 0) renderHud();
    },
    draw(g, dt) {
      const W = view.w, H = view.h, u = this.unit(), gy = H * 0.84, se = season(), td = tod();
      const sky = g.createLinearGradient(0, 0, 0, gy);
      const SK = { day: ['#9fd6f2', '#e9f7ff'], evening: ['#f3a07a', '#fde0c4'], night: ['#1f2a55', '#46507c'] }[td];
      sky.addColorStop(0, SK[0]); sky.addColorStop(1, SK[1]); g.fillStyle = sky; g.fillRect(0, 0, W, gy);
      const im = GK.images['walk-bg'];
      if (im) {
        const s = (gy * 1.02) / (im.naturalHeight || im.height), tw = (im.naturalWidth || im.width) * s;
        let x0 = -((Wk.scroll * 0.25) % tw);
        for (let x = x0; x < W; x += tw) g.drawImage(im, x, 0, tw, gy * 1.02);
      }
      const tint = { spring: 'rgba(255,190,210,.10)', summer: 'rgba(120,200,120,.06)', autumn: 'rgba(240,140,60,.14)', winter: 'rgba(230,240,255,.28)' }[se];
      g.fillStyle = tint; g.fillRect(0, 0, W, gy);
      if (td === 'night') { g.fillStyle = 'rgba(15,20,60,.38)'; g.fillRect(0, 0, W, gy); }
      // hedges (mid layer)
      const HC = { spring: '#86bf73', summer: '#5aa653', autumn: '#d58a3c', winter: '#e8eef6' }[se];
      const off = (Wk.scroll * 0.6) % (140 * u);
      for (let x = -off - 140 * u; x < W + 140 * u; x += 140 * u) {
        g.fillStyle = HC; g.beginPath(); g.ellipse(x + 40 * u, gy - 8 * u, 60 * u, 26 * u, 0, Math.PI, 0); g.fill();
        g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(x + 30 * u, gy - 20 * u, 22 * u, 8 * u, 0, 0, 7); g.fill();
        if (se === 'spring') { g.fillStyle = '#f7c1cf'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + (12 + k * 14) * u, gy - (14 + (k % 2) * 10) * u, 3 * u, 0, 7); g.fill(); } }
        g.fillStyle = '#b48a5e'; g.fillRect(x + 104 * u, gy - 34 * u, 6 * u, 34 * u);
      }
      // the path
      g.fillStyle = '#e9d6ad'; g.fillRect(0, gy, W, H - gy);
      g.fillStyle = '#d7c095'; for (let x = -((Wk.scroll) % (60 * u)); x < W; x += 60 * u) { g.beginPath(); g.ellipse(x, gy + (H - gy) * 0.55, 8 * u, 2.5 * u, 0, 0, 7); g.fill(); }
      g.fillStyle = se === 'winter' ? '#f2f6fb' : '#7fbf6a'; g.fillRect(0, gy - 3 * u, W, 6 * u);
      // objects
      for (const o of Wk.objs) {
        const x = o.x;
        if (o.type === 'puddle') { g.fillStyle = o.hit ? '#8fb6cf' : '#9fd0ee'; g.beginPath(); g.ellipse(x, gy + 6 * u, o.w / 2 * u, 7 * u, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x - 8 * u, gy + 4 * u, 9 * u, 2 * u, 0, 0, 7); g.fill(); }
        else if (o.type === 'stone') { g.fillStyle = '#9a948c'; g.beginPath(); g.ellipse(x, gy - 8 * u, 16 * u, 13 * u, 0, Math.PI, 0); g.lineTo(x + 16 * u, gy + 2 * u); g.lineTo(x - 16 * u, gy + 2 * u); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(x - 5 * u, gy - 14 * u, 5 * u, 3 * u, 0, 0, 7); g.fill(); }
        else if ((o.type === 'bone' || o.type === 'item') && !o.hit) {
          const y = gy - o.hgt * u + Math.sin(R.t * 4 + x) * 3 * u;
          if (o.type === 'bone') {
            g.fillStyle = '#fff4e0'; g.strokeStyle = '#d9b98a'; g.lineWidth = 1.5;
            g.beginPath(); g.roundRect(x - 10 * u, y - 3.5 * u, 20 * u, 7 * u, 3 * u); g.fill(); g.stroke();
            for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.beginPath(); g.arc(x + sx * 10 * u, y + sy * 3.5 * u, 4 * u, 0, 7); g.fill(); g.stroke(); }
          } else drawSeasonItem(g, x, y, u, se);
        } else if (o.type === 'enc') drawEncounter(g, o, x, gy, u);
      }
      // the dog and the leash
      const dogX = W * 0.26, sc = u * 0.95 * DOG.STAGE[stage()].sc, dy = gy - Wk.y * 1;
      g.strokeStyle = '#c0533f'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(dogX + 38 * sc, dy - 62 * sc); g.quadraticCurveTo(dogX - 40 * u, dy - 90 * u, -10, gy - 170 * u); g.stroke();
      g.save(); g.translate(dogX, dy); g.scale(sc, sc);
      DOG.draw(g, { pose: 'side', stage: stage(), t: R.t, phase: Wk.phase, run: !Wk.enc, walk: false, eyes: Wk.enc && Wk.enc.o.kind === 'cat' ? 'wide' : 'normal', wag: 1.2 });
      g.restore();
      // seasonal weather
      if (se !== 'summer' && rnd() < dt * 4) parts.push({ kind: se === 'winter' ? 'snow' : se === 'autumn' ? 'leaf' : se === 'spring' ? 'petal' : 'none', x: rnd() * W, y: -10, vx: -40 - rnd() * 60, vy: 40 + rnd() * 40, life: 0, max: 6, s: 1, rot: rnd() * 6 });
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (!['snow', 'leaf', 'petal', 'none'].includes(p.kind)) continue;
        p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 2;
        if (p.y > gy || p.life > p.max || p.kind === 'none') { parts.splice(i, 1); continue; }
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.globalAlpha = 0.85; g.fillStyle = p.kind === 'snow' ? '#fff' : p.kind === 'leaf' ? '#e08a4a' : '#f7c1cf';
        g.beginPath(); if (p.kind === 'snow') g.arc(0, 0, 2.5 * u, 0, 7); else g.ellipse(0, 0, 3.4 * u, 2 * u, 0, 0, 7); g.fill();
        g.restore(); g.globalAlpha = 1;
      }
    },
    down() { this.primary(); },
    async finish() {
      if (R.mode !== 'walk' || Wk.ended) return;
      Wk.ended = true; $('#prompt').hidden = true;
      R.mode = 'result';
      const dist = Math.round(Wk.dist), pts = Wk.score + Math.round(dist / 10);
      S.points += pts; S.rec.walks++; S.rec.items += Wk.found; S.hid.play += 1;
      const best = dist > S.rec.walkBest; if (best) S.rec.walkBest = dist;
      const k = Math.min(1, Wk.t / 40);
      mstat('mood', 6 + 12 * k); mstat('energy', -6 - 16 * k); mstat('hunger', -4 - 10 * k); mstat('clean', -4 - 8 * k - Wk.muddy * 5); mstat('aff', 1 + 2 * k);
      const se = SEASON[season()];
      const foundTxt = Wk.found ? `${se.item}を${Wk.found}こ見つけて、うれしそうだった。` : 'においをかぐのに夢中だった。';
      diary(`さんぽで${dist}m歩いた。${foundTxt}${Wk.muddy ? '水たまりでどろんこになった。' : ''}`);
      if (!S.firsts.walk) { S.firsts.walk = 1; moment('はじめてのさんぽ'); }
      await results('さんぽ', [['歩いた距離', `${dist} m${best ? '（ベスト！）' : ''}`], [`見つけた${se.item}`, `${Wk.found} こ ${se.icon}`], ['あいさつ', `${Wk.greet} 回`], ['もらったポイント', `+${pts} pt`], ['清潔', Wk.muddy ? '↓ どろんこ（おふろに入れよう）' : '↓ 少しよごれた']]);
      endMini();
    },
  };
  function drawSeasonItem(g, x, y, u, se) {
    g.save(); g.translate(x, y); g.scale(u, u);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fill();
    if (se === 'spring') { g.fillStyle = '#f7a9bf'; for (let i = 0; i < 5; i++) { g.save(); g.rotate((i * Math.PI * 2) / 5); g.beginPath(); g.ellipse(0, -6, 4, 6.5, 0, 0, 7); g.fill(); g.restore(); } g.fillStyle = '#f3d36b'; g.beginPath(); g.arc(0, 0, 2.5, 0, 7); g.fill(); }
    else if (se === 'summer') { g.fillStyle = '#4fa64a'; for (let i = 0; i < 4; i++) { g.save(); g.rotate((i * Math.PI) / 2 + 0.78); g.beginPath(); g.arc(-3, -5, 4, 0, 7); g.arc(3, -5, 4, 0, 7); g.fill(); g.restore(); } }
    else if (se === 'autumn') { g.fillStyle = '#a8662f'; g.beginPath(); g.ellipse(0, 3, 6, 8, 0, 0, 7); g.fill(); g.fillStyle = '#6e4423'; g.beginPath(); g.ellipse(0, -4, 7.5, 4, 0, 0, 7); g.fill(); }
    else { g.fillStyle = '#8a5a34'; g.beginPath(); g.ellipse(0, 0, 6.5, 10, 0, 0, 7); g.fill(); g.strokeStyle = '#5a3a20'; g.lineWidth = 1.2; for (let i = -6; i <= 6; i += 4) { g.beginPath(); g.moveTo(-6, i); g.lineTo(6, i + 2); g.stroke(); } }
    g.restore();
  }
  function drawEncounter(g, o, x, gy, u) {
    if (o.kind === 'dog') {
      g.save(); g.translate(x, gy); g.scale(-u * 0.9, u * 0.9);
      DOG.draw(g, { pose: 'side', stage: 'adult', t: R.t, phase: 0, wag: 1.2, pal: { fur: '#3b302b', furD: '#2a221f', cream: '#f1dfc6', creamD: '#dcc6a8', collar: '#5aa0e0' } });
      g.restore();
    } else if (o.kind === 'cat') {
      g.save(); g.translate(x, gy); g.scale(u, u);
      g.fillStyle = '#9a9aa6'; g.beginPath(); g.ellipse(0, -14, 20, 13, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(-18, -30, 11, 0, 7); g.fill();
      g.beginPath(); g.moveTo(-27, -36); g.lineTo(-24, -48); g.lineTo(-18, -39); g.fill(); g.beginPath(); g.moveTo(-15, -39); g.lineTo(-10, -48); g.lineTo(-8, -35); g.fill();
      g.strokeStyle = '#9a9aa6'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(18, -16); g.quadraticCurveTo(34, -30, 26, -44); g.stroke();
      g.fillStyle = '#2b2b33'; g.beginPath(); g.arc(-22, -31, 1.8, 0, 7); g.arc(-14, -31, 1.8, 0, 7); g.fill();
      g.restore();
    } else {
      g.save(); g.translate(x, gy); g.scale(u, u);
      g.fillStyle = '#6d7aa8'; g.beginPath(); g.roundRect(-16, -70, 32, 58, 10); g.fill();
      g.fillStyle = '#4a4a55'; g.fillRect(-12, -14, 9, 14); g.fillRect(3, -14, 9, 14);
      g.fillStyle = '#f2d2b6'; g.beginPath(); g.arc(0, -84, 15, 0, 7); g.fill();
      g.fillStyle = '#d8d8de'; g.beginPath(); g.arc(0, -90, 14, Math.PI, 0); g.fill(); g.beginPath(); g.arc(0, -104, 6, 0, 7); g.fill();
      g.fillStyle = '#c9925a'; g.beginPath(); g.roundRect(-30, -46, 18, 14, 3); g.fill();
      g.strokeStyle = '#3a2a20'; g.lineWidth = 1.6; g.beginPath(); g.arc(-5, -84, 2, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(5, -84, 2, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.restore();
    }
  }

  /* ---------- training (しつけ) ---------- */
  const Tr = {};
  MG.train = {
    start(id) {
      const t = TRICKS.find((x) => x.id === id);
      Object.assign(Tr, { trick: t, cue: 0, cues: 5, hits: 0, phase: 'cue', ring: 0, dur: 1.55 - trickLv(id) * 0.08, wait: 0.8, msg: '' });
      pup.x = 0.5; pup.z = 0.28; pup.pose = 'sit'; pup.dir = 1;
      music('game');
    },
    hud: () => `<span>🎓 「${Tr.trick.name}」</span><span>${Tr.cue} / ${Tr.cues}</span><span>せいこう <b>${Tr.hits}</b></span>`,
    controls: () => [{ id: 'cue', label: '合図！', icon: '👉', primary: true }, { id: 'quit', label: 'やめる', icon: '🏠' }],
    control(id) { if (id === 'cue') this.primary(); if (id === 'quit') this.finish(true); },
    targetR() { const p = pupScreen(); return DOG.parts(stage()).height * p.s * 0.55; },
    primary() {
      if (Tr.phase !== 'cue' || Tr.wait > 0) return;
      const R0 = this.targetR(), r = this.ringR();
      const tol = R0 * (0.17 + trickLv(Tr.trick.id) * 0.03);
      const p = pupScreen();
      if (Math.abs(r - R0) < tol) {
        Tr.hits++; Tr.phase = 'act'; Tr.act = 1.4; doTrick(Tr.trick.id, 1.4); if (Tr.trick.id === 'mate') say('…', 1.4);
        GK.sfx('ok'); burst(p.x, p.y - 80 * p.s, 'heart', 4); popText(Math.abs(r - R0) < tol * 0.45 ? 'ばっちり！' : 'よしよし！', p.x, p.y - DOG.parts(stage()).height * p.s - 26, '#e0566e', 22);
      } else { Tr.phase = 'act'; Tr.act = 1.0; react('huh', 1); say('？', 1); GK.sfx('ng'); popText(r > R0 ? 'はやい' : 'おそい', p.x, p.y - DOG.parts(stage()).height * p.s - 26, '#6b7da8', 20); }
      renderHud();
    },
    ringR() { const R0 = this.targetR(); return lerp(R0 * 2.3, R0 * 0.45, Tr.ring); },
    update(dt) {
      if (Tr.phase === 'cue') {
        if (Tr.wait > 0) { Tr.wait -= dt; return; }
        Tr.ring += dt / Tr.dur;
        if (Tr.ring >= 1) { Tr.phase = 'act'; Tr.act = 0.8; react('huh', 0.8); say('？', 0.8); GK.sfx('ng'); }
      } else if (Tr.phase === 'act') {
        Tr.act -= dt;
        if (Tr.act <= 0) { pup.act = 'idle'; pup.trick = null; Tr.cue++; renderHud(); if (Tr.cue >= Tr.cues) { Tr.phase = 'done'; this.finish(false); } else { Tr.phase = 'cue'; Tr.ring = 0; Tr.wait = 0.5; } }
      }
    },
    draw(g, dt) {
      drawBg(g, dt); drawFurniture(g, 'wall'); drawFurniture(g, 'floor');
      drawPup(g);
      const p = pupScreen(), cy = p.y - DOG.parts(stage()).height * p.s * 0.45;
      if (Tr.phase === 'cue' && Tr.wait <= 0) {
        const R0 = this.targetR(), r = this.ringR(), tol = R0 * (0.17 + trickLv(Tr.trick.id) * 0.03);
        g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, cy, R0, 0, 7); g.stroke(); g.setLineDash([]);
        g.strokeStyle = Math.abs(r - R0) < tol ? '#f05a78' : '#ffb347'; g.lineWidth = 5; g.beginPath(); g.arc(p.x, cy, r, 0, 7); g.stroke();
      }
      const G = geom();
      g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.roundRect(G.W / 2 - 110, 14, 220, 40, 20); g.fill();
      g.fillStyle = '#5a3a20'; g.font = `800 20px ${getComputedStyle(document.documentElement).getPropertyValue('--gk-round')}`; g.textAlign = 'center'; g.fillText(`「${Tr.trick.name}」`, G.W / 2, 41);
      drawFurniture(g, 'front');
    },
    down() { this.primary(); },
    async finish(quit) {
      if (R.mode !== 'train') return;
      R.mode = 'result';
      const id = Tr.trick.id, before = trickLv(id);
      S.tricks[id] = (S.tricks[id] || 0) + Tr.hits;
      const after = trickLv(id);
      const pts = Tr.hits * 4 + (after === 3 && before < 3 ? 50 : 0);
      S.points += pts; S.rec.lessons++; S.hid.train++;
      if (Tr.cue > 0) { mstat('energy', -6); mstat('mood', Tr.hits >= 3 ? 5 : -3); mstat('aff', Tr.hits * 0.3); }
      if (after === 3 && before < 3) { diary(`「${Tr.trick.name}」を覚えた！ 何度もやってみせてくれる。`); moment(`「${Tr.trick.name}」を覚えた日`); GK.sfx('win'); }
      if (!quit || Tr.cue > 0) await results('しつけ', [['教えたこと', `「${Tr.trick.name}」`], ['せいこう', `${Tr.hits} / ${Tr.cue} 回`], ['じょうず度', `${'★'.repeat(after)}${'☆'.repeat(3 - after)}${after > before ? '（アップ！）' : ''}`], ['もらったポイント', `+${pts} pt`]], after === 3 && before < 3 ? `<p class="new">「${Tr.trick.name}」を覚えました！ ごきげんなとき、ひとりでもやってみせてくれます。</p>` : '');
      endMini();
    },
  };

  /* ---------- bath (おふろ) ---------- */
  const Bt = {};
  MG.bath = {
    start() {
      Object.assign(Bt, { foam: new Set(), phase: 'scrub', t: 0, drag: false, lastS: 0 });
      pup.x = 0.5; pup.z = 0.22; pup.pose = 'sit'; pup.dir = 1;
      react(S.st.aff >= 50 ? 'happy' : 'sad', 1.5);
      music('game');
    },
    cov() { return Bt.foam.size / 36; },
    hud: () => `<span>🧼 あわあわ ${Math.round(MG.bath.cov() * 100)}%</span><span>${Bt.phase === 'scrub' ? 'こすって あわだてよう' : Bt.phase === 'rinse' ? 'シャワー中…' : 'ぶるぶる！'}</span>`,
    controls: () => [{ id: 'scrub', label: 'ごしごし', icon: '🧼', disabled: Bt.phase !== 'scrub' }, { id: 'rinse', label: 'シャワー', icon: '🚿', primary: true, disabled: Bt.phase !== 'scrub' || MG.bath.cov() < 0.7 }, { id: 'quit', label: 'やめる', icon: '🏠', disabled: Bt.phase !== 'scrub' }],
    control(id) { if (id === 'scrub') { for (let i = 0; i < 4; i++) Bt.foam.add((rnd() * 36) | 0); GK.sfx('scrub'); renderHud(); renderActions(); } if (id === 'rinse') this.rinse(); if (id === 'quit') this.finish(true); },
    primary() { if (Bt.phase === 'scrub') { if (this.cov() >= 0.7) this.rinse(); else this.control('scrub'); } },
    box() { const p = pupScreen(), P = DOG.parts(stage()), hgt = P.height * p.s, w = P.bodyRX * 2.6 * p.s; return { x: p.x - w / 2, y: p.y - hgt, w, h: hgt * 0.92 }; },
    rub(pt) {
      if (Bt.phase !== 'scrub') return;
      const b = this.box();
      const cx = Math.floor(((pt.x - b.x) / b.w) * 6), cy = Math.floor(((pt.y - b.y) / b.h) * 6);
      if (cx < 0 || cy < 0 || cx > 5 || cy > 5) return;
      const k = cy * 6 + cx;
      if (!Bt.foam.has(k)) { Bt.foam.add(k); burst(pt.x, pt.y, 'foam', 2); renderHud(); if (this.cov() >= 0.7) renderActions(); }
      const now = performance.now(); if (now - Bt.lastS > 140) { Bt.lastS = now; GK.sfx('scrub'); }
    },
    rinse() { if (Bt.phase !== 'scrub' || this.cov() < 0.7) return; Bt.phase = 'rinse'; Bt.t = 0; GK.sfx('shower'); renderActions(); renderHud(); },
    update(dt) {
      Bt.t += dt;
      if (Bt.phase === 'rinse') { const b = this.box(); for (let i = 0; i < 3; i++) parts.push({ kind: 'drop', x: b.x + rnd() * b.w, y: b.y - 40, vx: 0, vy: 200, life: 0, max: 0.7, s: 1 }); if (Bt.t > 0.4 && Bt.foam.size) Bt.foam.delete([...Bt.foam][0]); if (Bt.t > 1.7) { Bt.phase = 'shake'; Bt.t = 0; renderHud(); } }
      else if (Bt.phase === 'shake') { if (rnd() < dt * 30) { const p = pupScreen(); burst(p.x, p.y - 50 * p.s, 'drop', 2); } if (Bt.t > 1.3) { Bt.phase = 'done'; this.finish(false); } }
    },
    draw(g, dt) {
      drawBg(g, dt);
      const p = pupScreen(), s = p.s, G = geom();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, G.W, G.H);
      g.fillStyle = '#e3eef5'; g.beginPath(); g.ellipse(p.x, p.y - 26 * s, 95 * s, 22 * s, 0, 0, 7); g.fill();
      g.fillStyle = '#b8d9ee'; g.beginPath(); g.ellipse(p.x, p.y - 26 * s, 84 * s, 16 * s, 0, 0, 7); g.fill();
      const shake = Bt.phase === 'shake' ? Math.sin(Bt.t * 40) * 0.35 : 0;
      drawPup(g, { tilt: shake, look: shake, ears: Bt.phase === 'scrub' ? 0.6 : 0.2, eyes: Bt.phase === 'shake' ? 'closed' : S.st.aff >= 50 ? 'happy' : 'half', wag: 0.2 });
      const b = this.box();
      for (const k of Bt.foam) {
        const cx = b.x + ((k % 6) + 0.5) * (b.w / 6), cy = b.y + (((k / 6) | 0) + 0.5) * (b.h / 6);
        for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(cx + Math.sin(k * 3 + i * 2) * 7 * s, cy + Math.cos(k * 5 + i) * 6 * s, (5.5 + i * 1.6) * s, 0, 7); g.fill(); }
      }
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(p.x - 100 * s, p.y - 28 * s); g.lineTo(p.x + 100 * s, p.y - 28 * s); g.quadraticCurveTo(p.x + 96 * s, p.y + 18 * s, p.x + 70 * s, p.y + 22 * s); g.lineTo(p.x - 70 * s, p.y + 22 * s); g.quadraticCurveTo(p.x - 96 * s, p.y + 18 * s, p.x - 100 * s, p.y - 28 * s); g.fill();
      g.strokeStyle = '#cfe3ef'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(p.x - 98 * s, p.y - 26 * s); g.lineTo(p.x + 98 * s, p.y - 26 * s); g.stroke();
      if (Bt.phase === 'rinse') { g.fillStyle = '#9aa8b4'; g.beginPath(); g.roundRect(p.x + 50 * s, b.y - 70 * s, 34 * s, 16 * s, 6 * s); g.fill(); }
    },
    down(pt) { Bt.drag = true; this.rub(pt); },
    move(pt) { if (Bt.drag) this.rub(pt); },
    up() { Bt.drag = false; },
    async finish(quit) {
      if (R.mode !== 'bath') return;
      R.mode = 'result';
      if (quit) { endMini(); return; }
      const likes = S.st.aff >= 50;
      S.st.clean = 100; mstat('mood', likes ? 6 : -4); S.points += 5; S.rec.baths++;
      if (!S.firsts.bath) { S.firsts.bath = 1; diary(`はじめてのおふろ。${likes ? '気持ちよさそうに目を細めていた。' : 'ちょっとふるえていたけど、がんばった。'}ぶるぶるっとして、部屋じゅう水だらけ。`); moment('はじめてのおふろ'); }
      await results('おふろ', [['清潔', '100（ぴかぴか！）'], ['ごきげん', likes ? '↑ 気持ちよかったみたい' : '↓ ちょっとにがて'], ['もらったポイント', '+5 pt']]);
      endMini();
    },
  };

  /* ================= panels ================= */
  function renderStatus() {
    if (!S) return;
    const si = stageIdx(), tr = trait();
    const portrait = `img/shiba-${stage()}-${moodKey()}.webp`;
    document.querySelectorAll('.js-portrait').forEach((im) => { if (!im.src.endsWith(portrait)) im.src = portrait; });
    document.querySelectorAll('.js-name').forEach((e) => { e.textContent = S.name; });
    document.querySelectorAll('.js-age').forEach((e) => { e.textContent = `${STAGES[si].name}・${dayNum()}日目`; });
    document.querySelectorAll('.js-pts').forEach((e) => { e.textContent = GK.fmt(S.points); });
    document.querySelectorAll('.js-trait').forEach((e) => { e.textContent = S.hid.sulk ? 'いまは すねている…' : S.sleeping ? 'すやすや ねている' : tr ? `性格：${TRAITS[tr]}` : si === 0 ? 'わんぱく盛りの子犬' : 'すくすく成長中'; });
    document.querySelectorAll('.bars').forEach((box) => {
      if (!box.children.length) box.innerHTML = STAT_DEF.map(([k, l, ic]) => `<div class="bar" data-k="${k}"><span class="bl"><i>${ic}</i>${l}</span><span class="tr"><b></b></span></div>`).join('');
      STAT_DEF.forEach(([k]) => { const v = S.st[k], b = box.querySelector(`[data-k="${k}"] b`); b.style.width = v + '%'; b.parentNode.parentNode.classList.toggle('low', v < 25 && k !== 'aff'); });
    });
    const c = $('#clock');
    const d = new Date(), se = SEASON[season()];
    c.textContent = `${se.name}・${{ day: '昼', evening: '夕方', night: '夜' }[tod()]}　${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  function renderDiaryMini() {
    const ol = $('#diaryMini');
    if (!ol || !S) return;
    ol.innerHTML = S.diary.slice(0, 8).map((e) => `<li><small>${e.d}日目</small>${esc(e.text)}</li>`).join('') || '<li class="empty">まだ日記はありません</li>';
  }
  function openDiary() {
    const body = h('div', 'diary');
    body.innerHTML = S.diary.length ? `<ol>${S.diary.map((e) => { const d = new Date(e.t); return `<li><small>${e.d}日目・${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}</small><p>${esc(e.text)}</p></li>`; }).join('')}</ol>` : '<p class="hint">まだ日記はありません。</p>';
    return GK.modal({ title: `${S.name}の日記`, body, wide: true, cls: 'sb-diary', buttons: [{ label: 'とじる', value: null }] });
  }
  function openAlbum() {
    const body = h('div', 'album');
    const stages = STAGES.filter((s) => S.stageSeen[s.id]);
    body.innerHTML = `<h3>成長の記録</h3><div class="stages">${STAGES.map((s) => S.stageSeen[s.id]
      ? `<figure><img src="img/shiba-${s.id}-happy.webp" alt=""><figcaption>${s.name}<small>${new Date(S.stageSeen[s.id]).toLocaleDateString('ja-JP')}</small></figcaption></figure>`
      : `<figure class="locked"><span>？</span><figcaption>${s.name}<small>まだ</small></figcaption></figure>`).join('')}</div>
      <h3>思い出の写真 <small>${S.album.length} 枚</small></h3><div class="moments">${S.album.map((m) => `<figure><img src="${m.thumb}" alt=""><figcaption>${esc(m.title)}<small>${m.d}日目</small></figcaption></figure>`).join('') || '<p class="hint">はじめてのさんぽ・技を覚えた日・成長した日などに、写真が増えていきます。</p>'}</div>`;
    void stages;
    return GK.modal({ title: 'アルバム', body, wide: true, cls: 'sb-album', buttons: [{ label: 'とじる', value: null }] });
  }
  function openRecords() {
    const r = S.rec, tr = trait();
    const body = `<table class="res"><tr><th>なまえ</th><td>${esc(S.name)}（${STAGES[stageIdx()].name}）</td></tr><tr><th>いっしょに</th><td>${dayNum()} 日目</td></tr><tr><th>性格</th><td>${tr ? TRAITS[tr] : 'おとなになるとわかります'}</td></tr>
      <tr><th>覚えた技</th><td>${TRICKS.map((t) => `${t.name} ${'★'.repeat(trickLv(t.id))}${'☆'.repeat(3 - trickLv(t.id))}`).join('<br>')}</td></tr>
      <tr><th>さんぽ</th><td>${r.walks} 回（いちばん長い：${r.walkBest} m）</td></tr><tr><th>ボールあそび</th><td>${r.balls} 回（ベスト：${r.ballBest} 点）</td></tr>
      <tr><th>なでた回数</th><td>${GK.fmt(r.pets)} 回</td></tr><tr><th>おふろ・しつけ</th><td>${r.baths} 回・${r.lessons} 回</td></tr><tr><th>見つけた宝もの</th><td>${r.items} こ</td></tr><tr><th>時間の速さ</th><td>${SPEEDS[S.speed].label}（${SPEEDS[S.speed].note}）</td></tr></table>`;
    return GK.modal({ title: 'きろく', body, wide: true, cls: 'sb-res', buttons: [{ label: 'とじる', value: null }] });
  }
  function openShop(tab) {
    tab = tab || 'food';
    const body = h('div', 'shop');
    const render = () => {
      const list = tab === 'food' ? FOODS : tab === 'treat' ? TREATS : FURN;
      body.innerHTML = `<div class="tabs">${[['food', 'ごはん'], ['treat', 'おやつ'], ['furn', 'へや']].map(([k, l]) => `<button type="button" data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="wallet">もっているポイント <b>${GK.fmt(S.points)} pt</b></p>
        ${Object.entries(list).filter(([id]) => id !== 'dry').map(([id, it]) => {
          const owned = tab === 'furn' ? !!S.furn[id] : (S.inv[tab][id] || 0);
          const can = S.points >= it.price && !(tab === 'furn' && owned);
          return `<div class="item"><span class="ii">${it.icon}</span><span class="in"><b>${esc(it.name)}</b><small>${esc(it.note)}</small></span><span class="iq">${tab === 'furn' ? (owned ? 'おいてある' : '') : `×${owned}`}</span><button type="button" class="buy" data-id="${id}"${can ? '' : ' disabled'}>${tab === 'furn' && owned ? '✓' : `${it.price} pt`}</button></div>`;
        }).join('')}<p class="hint">ポイントは、さんぽ・ボールあそび・しつけ・おふろ、そして毎日のログインでもらえます。</p>`;
    };
    body.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) { tab = t.dataset.tab; GK.sfx('click'); render(); return; }
      const b = e.target.closest('.buy');
      if (!b || b.disabled) return;
      const id = b.dataset.id, it = (tab === 'food' ? FOODS : tab === 'treat' ? TREATS : FURN)[id];
      if (S.points < it.price) return;
      S.points -= it.price;
      if (tab === 'furn') { S.furn[id] = Date.now(); diary(`${it.name}を買った。${S.name}はさっそくにおいをかいでいる。`); }
      else S.inv[tab][id] = (S.inv[tab][id] || 0) + 1;
      GK.sfx('coin'); GK.toast(`${it.name}を買いました`);
      render(); renderStatus(); save();
    });
    render();
    return GK.modal({ title: 'ショップ', body, wide: true, cls: 'sb-shop', buttons: [{ label: 'とじる', value: null }] });
  }
  function openSettings() {
    const body = h('div', 'settings');
    body.innerHTML = `<label class="row"><span>なまえ</span><input type="text" maxlength="8" value="${esc(S.name)}" id="setName"></label>
      <div class="row"><span>時間の速さ</span><div class="speeds">${Object.entries(SPEEDS).map(([k, s]) => `<label><input type="radio" name="spd" value="${k}"${S.speed === k ? ' checked' : ''}> <b>${s.label}</b><small>${s.note}</small></label>`).join('')}</div></div>
      <p class="hint">犬は弱ったり、いなくなったりしません。長く留守にすると、すねてしまうことがあります（なでたり、おやつをあげると元気に）。留守のあいだの変化は、半日ぶんまでです。</p>`;
    return GK.modal({ title: '設定', body, wide: true, cls: 'sb-settings', buttons: [{ label: 'はじめからやり直す', value: 'reset', ghost: true }, { label: 'OK', value: 'ok', primary: true }] }).then(async (v) => {
      const nm = (body.querySelector('#setName').value || '').trim();
      if (nm && nm !== S.name) { diary(`なまえを「${nm}」にした。呼ぶと、ちゃんとふり向く。`); S.name = nm.slice(0, 8); }
      const sp = body.querySelector('input[name="spd"]:checked');
      if (sp && sp.value !== S.speed) { S.speed = sp.value; GK.toast(`時間の速さ：${SPEEDS[S.speed].label}`); }
      if (v === 'reset') {
        const ok = await GK.modal({ title: 'やり直しの確認', body: `<p>${esc(S.name)}との記録（日記・アルバム・ポイント）がすべて消えます。本当にはじめからやり直しますか？</p>`, buttons: [{ label: 'やめる', value: false, ghost: true }, { label: 'やり直す', value: true, primary: true }] });
        if (ok) { store.del('dog'); S = null; showTitle(); return; }
      }
      save(); renderStatus();
    });
  }
  async function openMenu() {
    if (document.querySelector('.gk-modal-back') || !S || R.mode === 'title') return;
    const body = h('div', 'menu-list');
    body.innerHTML = [['shop', '🛒 ショップ'], ['diary', '📔 日記'], ['album', '📷 アルバム'], ['rec', '🏅 きろく'], ['set', '⚙️ 設定'], ['title', '🏠 タイトルへ']].map(([k, l]) => `<button type="button" class="gk-btn" data-m="${k}">${l}</button>`).join('');
    let close = null;
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b && close) close(b.dataset.m); });
    const v = await GK.modal({ title: 'メニュー', body, cls: 'sb-menu', buttons: [{ label: 'とじる', value: null, ghost: true }], onOpen: (c, cl) => { close = cl; } });
    link(v);
  }
  function link(v) {
    if (v === 'shop') openShop(); else if (v === 'diary') openDiary(); else if (v === 'album') openAlbum(); else if (v === 'rec') openRecords(); else if (v === 'set') openSettings();
    else if (v === 'title') { if (R.mode !== 'room' && MG[R.mode]) endMini(); save(); showTitle(); }
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-link]'); if (b) { GK.sfx('click'); link(b.dataset.link); } });

  /* ================= title ================= */
  function showTitle() {
    R.mode = 'title';
    document.body.classList.add('at-title');
    $('#title').hidden = false;
    const has = !!S;
    $('#tCont').hidden = !has;
    $('#tNew').textContent = has ? 'はじめから' : 'はじめる';
    $('#tNew').classList.toggle('primary', !has);
    $('#tCont').innerHTML = has ? `つづきから<small>${esc(S.name)}・${STAGES[stageIdx()].name}・${dayNum()}日目</small>` : '';
    music('day');
  }
  async function newGame() {
    if (S) {
      const ok = await GK.modal({ title: 'はじめから', body: `<p>いまの${esc(S.name)}との記録は消えてしまいます。はじめからにしますか？</p>`, buttons: [{ label: 'やめる', value: false, ghost: true }, { label: 'はじめから', value: true, primary: true }] });
      if (!ok) return;
    }
    const body = h('div', 'naming');
    body.innerHTML = `<p>あたらしい家族の、柴犬の子犬がやってきました。名前をつけてあげてください。</p><input type="text" id="nameIn" maxlength="8" value="こむぎ" aria-label="なまえ"><div class="sugg">${['こむぎ', 'きなこ', 'だいず', 'もみじ', 'たろう', 'はな'].map((n) => `<button type="button" class="chip">${n}</button>`).join('')}</div>`;
    body.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) body.querySelector('#nameIn').value = c.textContent; });
    const v = await GK.modal({ title: 'なまえをつける', body, cls: 'sb-naming', buttons: [{ label: 'この名前にする', value: true, primary: true }], dismissable: false, onOpen: (c, close) => { const i = c.querySelector('#nameIn'); setTimeout(() => i.select(), 60); i.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(true); }); } });
    if (!v) return;
    const nm = (body.querySelector('#nameIn').value || '').trim().slice(0, 8) || 'こむぎ';
    S = freshDog(nm);
    diary(`${nm}がうちにやってきた。小さくて、ふわふわで、ずっとしっぽをふっている。`);
    moment('うちに来た日');
    enterRoom();
    GK.toast(`${nm}との毎日がはじまりました`, 2400);
  }
  function enterRoom() {
    document.body.classList.remove('at-title');
    $('#title').hidden = true;
    R.mode = 'room';
    pup.x = 0.5; pup.z = 0.3; pup.pose = S.sleeping ? 'sleep' : 'sit'; pup.act = 'idle'; pup.actT = 1.5;
    catchUp();
    renderStatus(); renderDiaryMini(); renderActions();
    music(roomSong());
    if (R.welcome) { R.welcome = false; react('happy', 2); hop(420); say('おかえり！', 2.4); }
    save();
  }
  $('#title').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    unlock(); GK.sfx('select');
    if (b.id === 'tNew') newGame();
    if (b.id === 'tCont' && S) enterRoom();
  });

  /* ================= input ================= */
  GK.pointer(cv, null, {
    down(p) {
      if (R.mode === 'room') {
        petState.down = true; petState.last = p; petState.acc = 0; petState.tap = true; petState.start = p;
        petState.zone = zoneAt(p.x, p.y);
      } else if (MG[R.mode] && MG[R.mode].down) MG[R.mode].down(p);
    },
    move(p) {
      if (R.mode === 'room') {
        if (!petState.down) { const pz = zoneAt(p.x, p.y); cv.style.cursor = pz ? 'grab' : 'default'; const ps = pupScreen(); if (!pup.moving && !S.sleeping && !S.hid.sulk && pup.pose === 'sit') pup.look = clamp((p.x - ps.x) / 220, -0.8, 0.8); return; }
        const d = Math.hypot(p.x - petState.last.x, p.y - petState.last.y);
        if (Math.hypot(p.x - petState.start.x, p.y - petState.start.y) > 10) petState.tap = false;
        const z = zoneAt(p.x, p.y);
        if (z && z !== 'tail' && z !== 'paw') { petState.acc += d; if (petState.acc > 55) { petState.acc = 0; petTick(z, p.x, p.y); } }
        petState.last = p;
      } else if (MG[R.mode] && MG[R.mode].move) MG[R.mode].move(p);
    },
    up(p) {
      if (R.mode === 'room') {
        if (petState.down && petState.tap && petState.zone) touchZone(petState.zone, p.x, p.y);
        petState.down = false;
      } else if (MG[R.mode] && MG[R.mode].up) MG[R.mode].up(p);
    },
  });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back') || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.code === 'Escape') { openMenu(); return; }
    if (R.mode !== 'room' && MG[R.mode] && (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp')) { e.preventDefault(); MG[R.mode].primary(); return; }
    if (R.mode === 'room') {
      const n = { Digit1: 'feed', Digit2: 'treat', Digit3: 'pet', Digit4: 'play', Digit5: 'walk', Digit6: 'bath', Digit7: 'sleep', Digit8: 'train' }[e.code];
      if (n) { const b = actionsEl.querySelector(`[data-a="${n}"]`); if (b && !b.disabled) roomAction(n); }
    }
  });

  /* ================= layout ================= */
  function layout() {
    const W = innerWidth, H = innerHeight;
    const cls = W / H < 0.95 ? 'lay-port' : H < 560 ? 'lay-land-s' : 'lay-land';
    document.documentElement.classList.remove('lay-port', 'lay-land', 'lay-land-s');
    document.documentElement.classList.add(cls);
  }
  addEventListener('resize', layout);
  layout();

  /* ================= help ================= */
  const HELP = `
    <p>柴犬の子犬と暮らす、育成ゲームです。現実の時間に合わせて（少し早く）時間が流れ、子犬 → 若犬 → 成犬と育っていきます。犬は弱ったりいなくなったりしません。さびしいと、すねるだけです。</p>
    <h3>お世話</h3>
    <table>
      <tr><th>🍚 ごはん</th><td>おなかを満たします。ドライフードはいつでも、ほかはショップで</td></tr>
      <tr><th>🍪 おやつ</th><td>ごきげん・なつき度が上がります（あげすぎ注意）</td></tr>
      <tr><th>✋ なでる</th><td>犬を指やマウスでこすってなでます。頭・あご・せなか・おなかで反応がちがいます。しっぽはびっくり！</td></tr>
      <tr><th>🎾 あそぶ</th><td>ボールなげ。上へスワイプ（タップ・スペースでも）で投げ、ボールが落ちてくる瞬間に「キャッチ！」</td></tr>
      <tr><th>🐾 さんぽ</th><td>横スクロールのさんぽ。タップ／スペースでジャンプ。水たまり・石をよけて、おやつや季節の宝ものを集め、出会いにはボタンで答えます</td></tr>
      <tr><th>🛁 おふろ</th><td>犬をこすってあわだて、シャワーで流します</td></tr>
      <tr><th>🌙 ねる</th><td>あかりを消して眠らせると、体力がよく回復します</td></tr>
      <tr><th>🎓 しつけ</th><td>わっかが点線に重なった瞬間に合図。★3 で技を覚えます（成長すると新しい技）</td></tr>
    </table>
    <h3>ステータス</h3>
    <p>おなか・ごきげん・清潔・体力は時間とともに下がり、なつき度はお世話で少しずつ上がります。おとなになったときの性格（元気いっぱい・かしこい・あまえんぼう・のんびりや）は、育て方で決まります。</p>
    <h3>時間と季節</h3>
    <p>部屋の明るさ（昼・夕方・夜）と季節は、現実の時計に合わせて変わります。時間の速さは「設定」で選べます（デモ：3 分で 1 日）。留守のあいだの変化は半日ぶんまで。ポイントは遊びや毎日のログインでもらえ、ショップでごはん・おやつ・家具を買えます。</p>
    <h3>キーボード</h3>
    <p><kbd>1</kbd>〜<kbd>8</kbd> お世話のボタン　<kbd>Space</kbd> ミニゲームの操作（ジャンプ・なげる・キャッチ・合図）　<kbd>Esc</kbd> メニュー</p>`;
  GK.init({ id: 'shiba-ikusei', title: 'こしば日和', help: HELP, menu: openMenu });

  /* ================= loop & boot ================= */
  let statusT = 0;
  GK.loop((dt, t) => {
    R.t = t;
    if (S && R.mode !== 'title') {
      addTime(dt * 1000 * gmPerMs());
      S.last = Date.now();
      updatePup(dt);
      if (petState.cool > 0) petState.cool -= dt;
      if (R.mode === 'room') roomAI(dt);
      else if (MG[R.mode] && MG[R.mode].update) MG[R.mode].update(dt);
      statusT -= dt;
      if (statusT <= 0) { statusT = 0.4; renderStatus(); }
    }
    const g = view.ctx;
    view.clear();
    if (R.mode === 'title') { drawTitleDog(t); return; }
    if (!S) return;
    if (MG[R.mode] && MG[R.mode].draw) MG[R.mode].draw(g, dt);
    else drawRoom(g, dt);
    drawParts(g, dt);
    if (pendingMoments.length && R.mode === 'room') captureMoment();
  });
  const tdog = $('#tdog');
  function drawTitleDog(t) {
    const r = tdog.getBoundingClientRect(), dpr = Math.min(2.5, devicePixelRatio || 1);
    if (!r.width) return;
    const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (tdog.width !== W || tdog.height !== H) { tdog.width = W; tdog.height = H; }
    const g = tdog.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    const s = (r.height / 132) * dpr, hop = Math.max(0, Math.sin(t * 2.2)) ** 6 * 10;
    g.translate(W / 2, H - 6 * dpr - hop * s); g.scale(s, s);
    DOG.draw(g, { pose: 'sit', stage: 'puppy', t, eyes: hop > 4 ? 'happy' : 'normal', mouth: 'tongue', wag: 1.3, blink: t % 3.6 < 0.12 ? 1 : 0, tilt: Math.sin(t * 0.9) * 0.12, blush: true });
  }
  const IMAGES = ['key-visual', 'room-day', 'room-evening', 'room-night', 'walk-bg'];
  STAGES.forEach((s) => ['normal', 'happy', 'sad'].forEach((m) => IMAGES.push(`shiba-${s.id}-${m}`)));
  GK.loadImages(IMAGES).then(() => {
    $('#loading').remove();
    R.ready = true;
    showTitle();
    window.__shibaReady = true;
  });

  /* ================= debug & self-test ================= */
  window.__shiba = {
    get S() { return S; }, R, pup, dbg, MG, B, Wk, Tr, Bt,
    advanceDays(n) { addTime(n * 1440, Math.min(n * 1440, 6 * 60)); renderStatus(); },
    feed, startMini, roomAction, petTick, openDiary, openAlbum, openShop, enterRoom, showTitle,
  };
  window.__gameSelfTest = async function () {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG ' + m); };
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await sleep(40); } return false; };
    const closeModal = async () => { const b = document.querySelector('.gk-modal-back .gk-btn.primary') || document.querySelector('.gk-modal-back .gk-btn'); if (b) b.click(); await sleep(260); };
    const PREFIX = 'game:shiba-ikusei:';
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(PREFIX)) backup[k] = localStorage.getItem(k); }
    const S0 = S;
    try {
      await until(() => window.__shibaReady, 10000);
      await sleep(400);
      await shot('title');
      S = null; showTitle();
      $('#tNew').click();
      await until(() => document.querySelector('#nameIn'), 3000);
      document.querySelector('#nameIn').value = 'こむぎ';
      await closeModal();
      if (!(await until(() => R.mode === 'room' && S, 3000))) fail('room not entered');
      await sleep(900);
      await shot('room');
      // feed
      S.st.hunger = 40;
      feed('food', 'sasami');
      await sleep(1300);
      await shot('eat');
      await until(() => pup.act !== 'eat', 4000);
      if (!(S.st.hunger > 70)) fail('feeding did not fill the stomach: ' + S.st.hunger);
      // pet: pointer events on the head
      pup.moving = false; pup.pose = 'sit'; pup.act = 'idle'; pup.actT = 30;
      const ps = pupScreen(), P = DOG.parts(stage()), r = cv.getBoundingClientRect();
      const hx = r.left + ps.x, hy = r.top + ps.y + P.headY * ps.s - P.headR * ps.s * 0.4;
      const ev = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, bubbles: true, pointerType: 'mouse', buttons: 1 }));
      const pets0 = S.rec.pets;
      ev('pointerdown', hx - 30, hy);
      for (let i = 0; i < 16; i++) { ev('pointermove', hx + (i % 2 ? 30 : -30), hy + (i % 3) * 3); await sleep(30); }
      await shot('pet');
      ev('pointerup', hx, hy);
      if (S.rec.pets <= pets0) fail('petting did not register');
      else notes.push(`pets ${S.rec.pets - pets0}`);
      // ball game
      dbg.rounds = 2;
      startMini('ball');
      MG.ball.throw(0.35, 0.6);
      await until(() => B.phase === 'flying' && B.ball && B.ball.T - B.ball.t < 0.24, 4000);
      MG.ball.tryCatch();
      await sleep(250);
      await shot('ball');
      await until(() => B.phase === 'ready', 6000);
      MG.ball.throw(0.7, 0.5);
      await until(() => document.querySelector('.sb-res'), 9000);
      if (S.rec.balls !== 1) fail('ball game not recorded');
      notes.push(`ball score ${S.rec.ballBest}, catches ${B.catches}`);
      await closeModal();
      dbg.rounds = null;
      // walk
      dbg.walkDur = 7;
      startMini('walk');
      await sleep(1600);
      MG.walk.primary();
      await sleep(250);
      await shot('walk');
      await until(() => { if (Wk.enc) MG.walk.answer(true); return document.querySelector('.sb-res'); }, 14000);
      if (S.rec.walks !== 1) fail('walk not recorded');
      await closeModal();
      dbg.walkDur = null;
      // training
      startMini('train', 'osuwari');
      for (let i = 0; i < 5; i++) {
        await until(() => Tr.phase === 'cue' && Tr.wait <= 0 && Math.abs(MG.train.ringR() - MG.train.targetR()) < MG.train.targetR() * 0.08, 4000);
        MG.train.primary();
        if (i === 1) { await sleep(300); await shot('train'); }
        await until(() => Tr.phase === 'cue' || Tr.phase === 'done', 4000);
      }
      await until(() => document.querySelector('.sb-res'), 4000);
      notes.push(`train hits ${Tr.hits}/5`);
      if (Tr.hits < 3) fail('training timing');
      await closeModal();
      // bath
      startMini('bath');
      for (let i = 0; i < 12; i++) MG.bath.control('scrub');
      await sleep(200);
      await shot('bath');
      MG.bath.rinse();
      await until(() => document.querySelector('.sb-res'), 6000);
      if (S.st.clean < 99) fail('bath ' + S.st.clean);
      await closeModal();
      // growth through the debug path
      window.__shiba.advanceDays(5.2);
      await sleep(600);
      if (stage() !== 'young') fail('not young after 5 days: ' + stage());
      await shot('young');
      S.hid.play = 8;
      window.__shiba.advanceDays(9);
      await sleep(700);
      if (stage() !== 'adult') fail('not adult after 14 days');
      if (!S.album.some((m) => m.title === 'おとなになった日')) fail('no album moment for the adult stage');
      notes.push(`stage ${stage()}, trait ${trait()}, album ${S.album.length}, diary ${S.diary.length}`);
      S.furn = { rug: 1, cushion: 1, plant: 1, clock: 1, toybox: 1, season: 1 };
      await shot('adult');
      roomAction('sleep');
      await sleep(600);
      await shot('night');
      roomAction('sleep');
      openAlbum(); await sleep(400); await shot('album'); await closeModal();
      openShop('furn'); await sleep(300); await shot('shop'); await closeModal();
    } catch (e) {
      fail('threw ' + (e && e.stack || e));
    } finally {
      dbg.rounds = null; dbg.walkDur = null;
      for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k.startsWith(PREFIX) && !(k in backup)) store.del(k.slice(PREFIX.length)); }
      Object.entries(backup).forEach(([k, v]) => { try { store.set(k.slice(PREFIX.length), JSON.parse(v)); } catch (e) { /* ignore */ } });
      S = S0 ? store.get('dog', null) : null;
      if (!S0) store.del('dog');
      document.querySelectorAll('.gk-modal-back').forEach((b) => b.remove());
      document.body.classList.remove('in-mini');
      $('#hud').innerHTML = ''; $('#prompt').hidden = true;
      showTitle();
    }
    return { ok, notes };
  };
})();
