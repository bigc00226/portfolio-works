/* まちがい日和 — UI: title (difficulty, stages, tour) → play (two SVG pictures) → stage clear → tour result. Scenes in scenes.js. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const SC = window.MS_SCENES;
  const NS = 'http://www.w3.org/2000/svg';
  const LEVELS = [
    { key: 'easy', name: 'やさしい', n: 5, t3: 45, t2: 90 },
    { key: 'normal', name: 'ふつう', n: 6, t3: 60, t2: 120 },
    { key: 'hard', name: 'むずかしい', n: 7, t3: 80, t2: 160 },
  ];
  const PENALTY = 5, HINT_COST = 10;
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const settings = Object.assign({ bgm: false }, GK.store.get('settings', {}));
  let lv = GK.store.get('level', 1);
  let screen = 'title';

  /* ---------------- sound ---------------- */
  const found = (k) => { if (GK.muted) return; [0, 2, 4].forEach((s, i) => GK.tone({ f: GK.scaleFreq('G4', 'yo', s + k), d: 0.22, type: 'triangle', v: 0.16, at: i * 0.06 })); GK.tone({ f: GK.scaleFreq('G5', 'yo', k + 4), d: 0.5, type: 'sine', v: 0.08, at: 0.18 }); };
  const missSnd = () => { if (!GK.muted) { GK.tone({ f: 196, f2: 150, d: 0.2, type: 'triangle', v: 0.18 }); GK.noise({ d: 0.06, v: 0.12, f: 400, filter: 'lowpass' }); } };
  const hintSnd = () => { if (!GK.muted) [0, 4, 7].forEach((s, i) => GK.tone({ f: GK.scaleFreq('C5', 'yo', s), d: 0.4, type: 'sine', v: 0.08, at: i * 0.1 })); };
  const SONG = {
    bpm: 92, steps: 2, loop: true,
    tracks: [
      { type: 'triangle', v: 0.06, notes: 'G4 A4 C5 . D5 C5 A4 . G4 . E4 G4 A4 - - . | C5 D5 E5 . D5 C5 A4 . C5 . A4 G4 E4 - - . | G4 A4 C5 . D5 E5 D5 . C5 . A4 C5 D5 - - . | E5 D5 C5 A4 G4 . E4 . G4 - - - - - . .' },
      { type: 'sine', v: 0.08, notes: 'C3 - - - G2 - - - A2 - - - E2 - - - | F2 - - - C3 - - - D3 - - - G2 - - - | C3 - - - G2 - - - A2 - - - E2 - - - | F2 - - - G2 - - - C3 - - - - - - -' },
    ],
    drums: { h: '. . x . . . x . . . x . . . x .' },
  };
  const syncMusic = () => { const want = settings.bgm && !GK.muted; if (want && !GK.music.playing) GK.music.play(SONG); else if (!want && GK.music.playing) GK.music.stop(); };

  /* ---------------- records ---------------- */
  const best = () => GK.store.get('best', {});
  const keyOf = (sc, l) => `${sc.id}:${LEVELS[l].key}`;
  const starsFor = (t, l) => (t <= LEVELS[l].t3 ? 3 : t <= LEVELS[l].t2 ? 2 : 1);
  const starSvg = (on, size = 44) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="${on ? '#f3b63a' : '#e6dccb'}" stroke="${on ? '#d9902a' : '#d6cab6'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;

  /* ---------------- title ---------------- */
  function refreshTitle() {
    const seg = $('#seg');
    seg.innerHTML = '';
    LEVELS.forEach((L, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === lv));
      b.innerHTML = `${L.name}<small>間違い ${L.n} つ</small>`;
      b.addEventListener('click', () => { lv = i; GK.store.set('level', i); GK.sfx('click'); refreshTitle(); });
      seg.appendChild(b);
    });
    const B = best();
    const box = $('#stages');
    box.innerHTML = '';
    SC.forEach((sc, i) => {
      const r = B[keyOf(sc, lv)];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'st';
      b.innerHTML = `<svg viewBox="0 0 800 600" aria-hidden="true">${sc.draw(() => false, 'th' + i)}</svg><span class="st-row"><b>${sc.name}</b><span class="mini-stars">${[1, 2, 3].map((k) => starSvg(r && r.stars >= k, 15)).join('')}</span></span><span class="st-row"><small>${r ? `ベスト ${fmt(r.t)}` : 'まだ遊んでいません'}</small></span>`;
      b.addEventListener('click', () => { GK.sfx('select'); startStage(i, null); });
      box.appendChild(b);
    });
    const tb = GK.store.get('tour', {})[LEVELS[lv].key];
    $('#tourBest').textContent = tb ? `めぐりのベスト（${LEVELS[lv].name}）: ${fmt(tb.t)}・星 ${tb.stars} / 18` : '6 つの景色を続けて遊び、合計タイムを競います。';
  }

  /* ---------------- play ---------------- */
  let G = null; // { sc, idx, diffs: [], found: Set, miss, hints, t, done, tour, lock }
  let tour = null; // { results: [] }
  const picA = $('#picA'), picB = $('#picB');

  function pickDiffs(sc, l) {
    const L = LEVELS[l];
    const bbox = (d) => (d.box ? { x0: d.box[0], y0: d.box[1], x1: d.box[0] + d.box[2], y1: d.box[1] + d.box[3] } : { x0: d.x - d.r, y0: d.y - d.r, x1: d.x + d.r, y1: d.y + d.r });
    const overlap = (a, b) => { const A = bbox(a), Bb = bbox(b); return !(A.x1 + 6 < Bb.x0 || Bb.x1 + 6 < A.x0 || A.y1 + 6 < Bb.y0 || Bb.y1 + 6 < A.y0) || (a.alt && Math.hypot(a.alt[0] - b.x, a.alt[1] - b.y) < a.r + b.r + 6) || (b.alt && Math.hypot(b.alt[0] - a.x, b.alt[1] - a.y) < a.r + b.r + 6); };
    for (let attempt = 0; attempt < 200; attempt++) {
      const pool = GK.random.shuffle(sc.diffs.slice());
      const out = [];
      const want3 = l === 2 ? 2 : 0, max3 = l === 0 ? 0 : l === 1 ? 1 : 3;
      // the subtle ones first for むずかしい, then the rest
      pool.sort((a, b) => (l === 2 ? (b.lv === 3) - (a.lv === 3) : 0));
      for (const d of pool) {
        if (out.length >= L.n) break;
        if (d.lv === 3 && out.filter((x) => x.lv === 3).length >= max3) continue;
        if (out.some((x) => overlap(x, d))) continue;
        out.push(d);
      }
      if (out.length === L.n && out.filter((x) => x.lv === 3).length >= Math.min(want3, sc.diffs.filter((x) => x.lv === 3).length) && (l > 0 || out.filter((x) => x.lv === 1).length >= 2)) return out;
    }
    return sc.diffs.slice(0, L.n);
  }

  function svgOf(sc, on, u) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<svg viewBox="0 0 800 600" xmlns="${NS}" preserveAspectRatio="none" aria-hidden="true">${sc.draw(on, u)}<g class="marks"></g></svg>`;
    return wrap.firstChild;
  }
  function startStage(idx, tourState) {
    const sc = SC[idx];
    tour = tourState;
    const diffs = pickDiffs(sc, lv);
    const ids = new Set(diffs.map((d) => d.id));
    // the changed picture is on the right most of the time, sometimes on the left
    const swap = GK.random() < 0.25;
    G = { sc, idx, diffs, ids, found: new Set(), miss: 0, hints: 0, t: 0, done: false, lock: 0, swap };
    for (const p of [picA, picB]) { const old = p.querySelector('svg'); if (old) old.remove(); p.querySelector('.spot').classList.remove('on'); }
    picA.insertBefore(svgOf(sc, swap ? (id) => ids.has(id) : () => false, 'a'), picA.firstChild);
    picB.insertBefore(svgOf(sc, swap ? () => false : (id) => ids.has(id), 'b'), picB.firstChild);
    picA.querySelector('.tag').textContent = 'ひだり';
    picB.querySelector('.tag').textContent = 'みぎ';
    $('#sName').textContent = sc.name;
    $('#sSub').textContent = tour ? `めぐり その ${tour.results.length + 1} / ${SC.length}・${LEVELS[lv].name}` : `${LEVELS[lv].name}・間違いは ${diffs.length} つ`;
    $('#dots').innerHTML = diffs.map(() => '<i></i>').join('');
    $('#clear').hidden = true; $('#final').hidden = true;
    show('play');
    layout();
  }

  function layout() {
    const W = innerWidth, H = innerHeight;
    const top = W <= 640 ? 106 : H <= 520 ? 46 : 56, g = 12, padB = 10;
    $('#pics').style.top = top + 'px';
    const side = Math.min((W - 3 * g) / 2, ((H - top - g - padB) * 4) / 3);
    const stack = Math.min(W - 2 * g, (((H - top - 2 * g - padB) / 2) * 4) / 3);
    const isStack = stack > side;
    const w = Math.floor(Math.max(side, stack));
    $('#pics').classList.toggle('stack', isStack);
    document.documentElement.style.setProperty('--pw', w + 'px');
    document.documentElement.style.setProperty('--ph', Math.round((w * 3) / 4) + 'px');
  }
  addEventListener('resize', () => { if (screen === 'play') layout(); });

  /* ---------------- tapping ---------------- */
  function onTap(e, pic) {
    if (!G || G.done || screen !== 'play') return;
    const now = performance.now();
    if (now < G.lock) return;
    const rect = pic.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800, y = ((e.clientY - rect.top) / rect.height) * 600;
    const unit = 800 / rect.width;
    const tol = Math.max(6, (e.pointerType === 'touch' ? 16 : 9) * unit);
    let hit = null, bestD = Infinity;
    for (const d of G.diffs) {
      let dist;
      if (d.box) {
        const [bx, by, bw, bh] = d.box;
        const dx = Math.max(bx - x, 0, x - (bx + bw)), dy = Math.max(by - y, 0, y - (by + bh));
        dist = Math.hypot(dx, dy) - tol;
      } else {
        dist = Math.hypot(x - d.x, y - d.y) - d.r - tol;
        if (d.alt) dist = Math.min(dist, Math.hypot(x - d.alt[0], y - d.alt[1]) - d.r - tol);
      }
      if (dist <= 0 && dist < bestD) { bestD = dist; hit = d; }
    }
    if (hit && G.found.has(hit.id)) { GK.sfx('tick'); return; }
    if (hit) return foundDiff(hit, e.clientX, e.clientY);
    // a miss: a cross where you tapped, and some seconds
    G.miss++;
    G.t += PENALTY;
    G.lock = now + 380;
    missSnd();
    const g = pic.querySelector('.marks');
    const m = document.createElementNS(NS, 'path');
    const s = 14 * unit;
    m.setAttribute('d', `M${x - s} ${y - s} L${x + s} ${y + s} M${x + s} ${y - s} L${x - s} ${y + s}`);
    m.setAttribute('class', 'miss');
    m.style.strokeWidth = 5 * unit;
    g.appendChild(m);
    setTimeout(() => m.remove(), 900);
    pic.classList.remove('shake'); void pic.offsetWidth; pic.classList.add('shake');
    floatText(`+${PENALTY}秒`, e.clientX, e.clientY, 'bad');
    updateHud();
  }
  [picA, picB].forEach((p) => p.addEventListener('pointerdown', (e) => onTap(e, p)));

  function markShape(d, cls, extra) {
    let el;
    if (d.box) {
      el = document.createElementNS(NS, 'ellipse');
      el.setAttribute('cx', d.box[0] + d.box[2] / 2); el.setAttribute('cy', d.box[1] + d.box[3] / 2);
      el.setAttribute('rx', d.box[2] / 2 + 10 + extra); el.setAttribute('ry', d.box[3] / 2 + 10 + extra);
    } else {
      el = document.createElementNS(NS, 'circle');
      el.setAttribute('cx', d.x); el.setAttribute('cy', d.y); el.setAttribute('r', d.r + 4 + extra);
    }
    el.setAttribute('class', cls);
    const len = d.box ? Math.PI * (d.box[2] + d.box[3] + 40) : 2 * Math.PI * (d.r + 4);
    el.style.setProperty('--len', len);
    el.style.strokeDasharray = len;
    return el;
  }
  function foundDiff(d, cx, cy) {
    G.found.add(d.id);
    found(G.found.size);
    for (const p of [picA, picB]) {
      const g = p.querySelector('.marks');
      g.appendChild(markShape(d, 'mark-w', 0));
      g.appendChild(markShape(d, 'mark', 0));
      p.querySelector('.spot').classList.remove('on');
    }
    if (cx != null) floatText('みつけた！', cx, cy, 'good');
    updateHud();
    if (G.found.size === G.diffs.length) stageClear();
  }
  function floatText(text, x, y, cls) {
    const el = document.createElement('div');
    el.className = 'float ' + cls;
    el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    $('#fx').appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  function updateHud() {
    if (!G) return;
    $('#timer').textContent = fmt(G.t);
    document.querySelectorAll('#dots i').forEach((el, i) => el.classList.toggle('on', i < G.found.size));
  }

  /* ---------------- hint: a soft spotlight ---------------- */
  let spotTimer = 0;
  function hint() {
    if (!G || G.done) return;
    const left = G.diffs.filter((d) => !G.found.has(d.id));
    if (!left.length) return;
    const d = left[Math.floor(GK.random() * left.length)];
    G.hints++;
    G.t += HINT_COST;
    hintSnd();
    const cx = d.box ? d.box[0] + d.box[2] / 2 : d.x, cy = d.box ? d.box[1] + d.box[3] / 2 : d.y;
    const rr = (d.box ? Math.max(d.box[2], d.box[3]) / 2 : d.r) * 1.9 + 46;
    const ox = (GK.random() - 0.5) * rr * 0.5, oy = (GK.random() - 0.5) * rr * 0.5;
    for (const p of [picA, picB]) {
      const s = p.querySelector('.spot');
      const w = p.getBoundingClientRect().width, k = w / 800;
      s.style.background = `radial-gradient(circle at ${((cx + ox) / 8).toFixed(1)}% ${((cy + oy) / 6).toFixed(1)}%, rgba(255,250,235,.0) ${Math.round(rr * k)}px, rgba(20,14,8,.55) ${Math.round(rr * k * 1.6)}px)`;
      s.classList.add('on');
    }
    floatText(`ヒント +${HINT_COST}秒`, innerWidth / 2, 90, 'bad');
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => document.querySelectorAll('.spot').forEach((s) => s.classList.remove('on')), 3600);
    updateHud();
  }
  $('#hintBtn').addEventListener('click', hint);

  /* ---------------- timer ---------------- */
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    if (G && !G.done && screen === 'play' && !document.hidden && !document.querySelector('.gk-modal-back')) { G.t += (now - last) / 1000; $('#timer').textContent = fmt(G.t); }
    last = now;
  }, 200);

  /* ---------------- clear & results ---------------- */
  function stageClear() {
    G.done = true;
    const t = Math.round(G.t), stars = starsFor(t, lv);
    const B = best(), k = keyOf(G.sc, lv), old = B[k];
    const rec = !old || t < old.t;
    if (rec) B[k] = { t, stars: Math.max(stars, old ? old.stars : 0) };
    else if (stars > old.stars) B[k] = { t: old.t, stars };
    GK.store.set('best', B);
    if (tour) tour.results.push({ idx: G.idx, t, stars, miss: G.miss });
    setTimeout(() => GK.sfx('win'), 350);
    setTimeout(() => {
      $('#cKicker').textContent = `${G.sc.name}・${LEVELS[lv].name}`;
      $('#cTitle').textContent = stars === 3 ? 'お見事！ ぜんぶ見つけた' : 'ぜんぶ見つけた！';
      $('#cStars').innerHTML = [1, 2, 3].map((n) => starSvg(n <= stars)).join('');
      $('#cTime').textContent = fmt(t);
      $('#cBest').textContent = fmt(B[k].t) + (rec && old ? ' 更新' : '');
      $('#cMiss').textContent = G.miss + (G.hints ? `・ヒント ${G.hints}` : '');
      $('#cList').innerHTML = G.diffs.map((d) => `<li>${d.ja}</li>`).join('');
      const act = $('#cAct');
      act.innerHTML = '';
      const btn = (label, primary, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'gk-btn' + (primary ? ' primary' : ''); b.textContent = label; b.addEventListener('click', () => { GK.sfx('click'); fn(); }); act.appendChild(b); return b; };
      let first;
      if (tour) {
        btn('やめる', false, () => { tour = null; show('title'); });
        first = btn(tour.results.length < SC.length ? '次の景色へ' : '結果を見る', true, () => { if (tour.results.length < SC.length) startStage(tour.results.length, tour); else showFinal(); });
      } else {
        btn('景色をえらぶ', false, () => show('title'));
        btn('もう一度', false, () => startStage(G.idx, null));
        first = btn('次の景色へ', true, () => startStage((G.idx + 1) % SC.length, null));
      }
      $('#clear').hidden = false;
      setTimeout(() => first.focus({ preventScroll: true }), 60);
    }, 1100);
  }
  function showFinal() {
    $('#clear').hidden = true;
    const total = tour.results.reduce((a, r) => a + r.t, 0), stars = tour.results.reduce((a, r) => a + r.stars, 0);
    const T = GK.store.get('tour', {}), k = LEVELS[lv].key, old = T[k];
    const rec = !old || total < old.t;
    if (rec) T[k] = { t: total, stars };
    GK.store.set('tour', T);
    $('#fKicker').textContent = `6 つの景色をめぐりました・${LEVELS[lv].name}`;
    $('#fTitle').textContent = stars >= 16 ? '名人の目ですね！' : stars >= 12 ? 'よく見つけました！' : 'おつかれさまでした';
    const avg = stars / tour.results.length;
    $('#fStars').innerHTML = [1, 2, 3].map((n) => starSvg(n <= Math.round(avg))).join('');
    $('#fTime').textContent = fmt(total);
    $('#fStarN').textContent = `${stars} / ${SC.length * 3}`;
    $('#fBest').textContent = fmt(T[k].t) + (rec && old ? ' 更新' : '');
    $('#fList').innerHTML = tour.results.map((r) => `<li><span>${SC[r.idx].name}</span><span>${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}　${fmt(r.t)}</span></li>`).join('');
    $('#final').hidden = false;
    GK.sfx('win');
    setTimeout(() => $('#fAgain').focus({ preventScroll: true }), 60);
  }

  /* ---------------- screens & menus ---------------- */
  function show(name) {
    screen = name;
    $('#title').hidden = name !== 'title';
    $('#play').hidden = name !== 'play';
    if (name === 'title') { $('#clear').hidden = true; $('#final').hidden = true; refreshTitle(); }
    if (GK.hudEl) GK.hudEl.classList.add('light');
  }
  function openSettings() {
    const body = document.createElement('div');
    body.className = 'ms-set';
    body.innerHTML = `<label><input type="checkbox" ${settings.bgm ? 'checked' : ''}><span><b>BGM を流す</b><small>陽音階の明るく静かなオリジナル曲（はじめはオフ）</small></span></label>`;
    body.querySelector('input').addEventListener('change', (e) => { settings.bgm = e.target.checked; GK.store.set('settings', settings); syncMusic(); });
    return GK.modal({ title: '設定', body, buttons: [{ label: '閉じる', primary: true }] });
  }
  async function openMenu() {
    const playing = screen === 'play' && G && !G.done;
    const v = await GK.modal({ title: 'メニュー', body: playing ? `<p>${G.sc.name}・見つけた数 ${G.found.size} / ${G.diffs.length}</p>` : '<p>設定と記録の管理です。</p>', buttons: [...(playing ? [{ label: '間違いを入れかえて最初から', value: 'redo' }, { label: 'タイトルへ', value: 'title' }] : [{ label: '記録を消す', value: 'reset', ghost: true }]), { label: '設定', value: 'set' }, { label: playing ? 'つづける' : '閉じる', value: null, primary: true }] });
    if (v === 'redo') startStage(G.idx, tour ? Object.assign(tour, { results: tour.results }) : null);
    else if (v === 'title') { tour = null; show('title'); }
    else if (v === 'set') openSettings();
    else if (v === 'reset') {
      const ok = await GK.modal({ title: '記録を消しますか？', body: '<p>景色ごとのベストと星、めぐりのベストがすべて消えます。</p>', buttons: [{ label: 'やめる', value: false }, { label: '消す', value: true, primary: true }] });
      if (ok) { GK.store.del('best'); GK.store.del('tour'); GK.toast('記録を消しました'); refreshTitle(); }
    }
  }
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back')) return;
    if (screen === 'play' && (e.key === 'h' || e.key === 'H')) hint();
  });

  const HELP = `
    <h3>遊び方</h3>
    <p>左右（スマホの縦向きでは上下）に、ほとんど同じ 2 枚の絵が並んでいます。<b>ちがうところ</b>を見つけたら、どちらかの絵のその場所をタップ（クリック）してください。両方の絵に丸がつきます。全部見つけるとクリアです。</p>
    <ul>
      <li>ちがうのは、色・あるかないか・形・向き・場所などです。</li>
      <li>間違いの場所は<b>遊ぶたびに変わります</b>（それぞれの景色に 12 か所以上の候補があり、そこから選ばれます）。</li>
      <li>見当ちがいの場所をタップすると「おてつき」になり、<b>${PENALTY} 秒</b>加算されます。</li>
      <li>「ヒント」（<kbd>H</kbd>）を押すと、まだ見つけていない間違いのあたりがふんわり明るくなります（${HINT_COST} 秒加算）。</li>
    </ul>
    <h3>むずかしさと星</h3>
    <table>
      <tr><th>やさしい</th><td>間違い 5 つ・わかりやすいものが中心。★★★ は 45 秒以内</td></tr>
      <tr><th>ふつう</th><td>間違い 6 つ。★★★ は 60 秒以内</td></tr>
      <tr><th>むずかしい</th><td>間違い 7 つ・細かいものも入ります。★★★ は 80 秒以内</td></tr>
    </table>
    <h3>めぐり</h3>
    <p>「6 つの景色をめぐる」で、縁日から桜の公園まで 6 つの景色を続けて遊び、合計タイムと星の数を記録します。景色ごとのベストと星も、むずかしさごとに残ります。</p>`;
  GK.init({ id: 'machigai-sagashi', title: 'まちがい日和', help: HELP, menu: openMenu });
  if (GK.hudEl) GK.hudEl.classList.add('light');
  GK.loadImages(['key-visual', 'title-bg', 'result-cat']);
  fetch('img/title-bg.webp').then((r) => r.arrayBuffer()).then((b) => {
    const u = new Uint8Array(b), pat = 'game-images-sample';
    outer: for (let i = 0; i < u.length - pat.length; i++) { for (let k = 0; k < pat.length; k++) if (u[i + k] !== pat.charCodeAt(k)) continue outer; document.documentElement.classList.add('ms-sample-bg'); break; }
  }).catch(() => {});
  $('#tourBtn').addEventListener('click', () => { GK.sfx('select'); startStage(0, { results: [] }); });
  $('#backBtn').addEventListener('click', () => { GK.sfx('click'); tour = null; show('title'); });
  $('#fTitleBtn').addEventListener('click', () => { GK.sfx('click'); tour = null; show('title'); });
  $('#fAgain').addEventListener('click', () => { GK.sfx('select'); startStage(0, { results: [] }); });
  addEventListener('pointerdown', syncMusic, { once: true });
  const origMute = GK.setMuted;
  GK.setMuted = (m) => { origMute(m); syncMusic(); };
  show('title');

  /* ---------------- self test ---------------- */
  window.__ms = { get game() { return G; }, startStage, SC };
  window.__gameSelfTest = async function () {
    const notes = [];
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    const tap = (pic, x, y, type = 'mouse') => { const r = pic.getBoundingClientRect(); pic.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + (x / 800) * r.width, clientY: r.top + (y / 600) * r.height, pointerType: type, bubbles: true })); };
    const center = (d) => (d.box ? [d.box[0] + d.box[2] / 2, d.box[1] + d.box[3] / 2] : [d.x, d.y]);
    GK.store.del('best'); GK.store.del('tour');
    lv = 0; show('title'); await wait(150);
    await shot('title');
    document.querySelector('#stages .st').click();
    await wait(250);
    if (screen !== 'play' || !G) return { ok: false, notes: ['stage card did not start'] };
    if (G.diffs.length !== 5) return { ok: false, notes: ['easy should have 5 differences'] };
    // find one on the right picture
    const [x0, y0] = center(G.diffs[0]);
    tap(picB, x0, y0);
    if (G.found.size !== 1) return { ok: false, notes: ['tap on a difference was not found'] };
    // a miss far from every difference costs time
    let mx = 0, my = 0;
    for (let k = 0; k < 400; k++) { const x = 40 + ((k * 97) % 720), y = 40 + ((k * 61) % 520); if (G.sc.diffs.every((d) => Math.hypot(d.x - x, d.y - y) > d.r + 60 && !(d.box && x > d.box[0] - 40 && x < d.box[0] + d.box[2] + 40 && y > d.box[1] - 40 && y < d.box[1] + d.box[3] + 40))) { mx = x; my = y; break; } }
    const t0 = G.t;
    tap(picA, mx, my);
    if (G.miss !== 1 || G.t < t0 + PENALTY - 0.5) return { ok: false, notes: ['miss penalty not applied'] };
    await wait(450);
    hint();
    await wait(400);
    if (!picA.querySelector('.spot.on')) return { ok: false, notes: ['hint spotlight not shown'] };
    await shot('hint');
    // the rest on the left picture, with touch
    for (const d of G.diffs.slice(1)) { const [x, y] = center(d); tap(picA, x, y, 'touch'); await wait(30); }
    if (!G.done) return { ok: false, notes: ['stage not cleared: ' + G.found.size] };
    await wait(1300);
    if ($('#clear').hidden) return { ok: false, notes: ['clear card not shown'] };
    await shot('clear');
    notes.push(`${G.sc.name}: ${$('#cTime').textContent}, stars ${$('#cStars').querySelectorAll('svg').length}`);
    // a whole tour at むずかしい (every scene, 7 differences each)
    lv = 2;
    startStage(0, { results: [] });
    for (let i = 0; i < SC.length; i++) {
      await wait(60);
      if (G.diffs.length !== 7) return { ok: false, notes: [`hard ${G.sc.id} has ${G.diffs.length} differences`] };
      for (const d of G.diffs) { const [x, y] = center(d); tap(picB, x, y); await wait(10); }
      if (!G.done) return { ok: false, notes: ['tour stage not cleared ' + G.sc.id] };
      if (i === 2) await shot('play-hard');
      await wait(1250);
      document.querySelector('#cAct .gk-btn.primary').click();
    }
    await wait(300);
    if ($('#final').hidden) return { ok: false, notes: ['final result not shown'] };
    await shot('final');
    notes.push('tour: ' + $('#fTime').textContent + ' ' + $('#fStarN').textContent);
    $('#fTitleBtn').click();
    await wait(100);
    return { ok: screen === 'title', notes };
  };
})();
