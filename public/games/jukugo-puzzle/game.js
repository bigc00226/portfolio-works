/* 筆まる漢字帖 ― 熟語クロス・四字熟語・難読漢字・今日の10問 */
(() => {
  'use strict';
  const { CROSS, DICT, YOJI, NANDOKU } = window.KANJI_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LEVELS = [['初級', '小学校の前半で習う漢字'], ['中級', '小学校の後半で習う漢字'], ['上級', '中学校以上で習う漢字']];
  const CATS = ['すべて', '魚', '野菜・植物', '動物', '地名', '食べ物'];
  const N = 10;
  const OK_SAY = ['お見事！', 'さすがだね', '冴えてる！', 'その調子！', 'いい筆さばき！', '正解だよ'];
  const NG_SAY = ['おしい！', '次はきっと大丈夫', 'これで覚えたね', 'ここが勉強のしどころ', 'もう一度見ておこう'];

  /* ---------------- records ---------------- */
  const best = () => GK.store.get('best', {});
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const daySeed = (s) => Number(s.replace(/-/g, ''));

  /* ---------------- sound ---------------- */
  GK.sfx.define('brush', () => { GK.noise({ d: 0.18, v: 0.25, f: 2600, q: 0.6, filter: 'bandpass' }); GK.noise({ d: 0.1, v: 0.15, f: 900, q: 0.8, at: 0.04 }); });
  GK.sfx.define('stamp', () => { GK.tone({ f: 220, f2: 120, d: 0.12, type: 'sine', v: 0.35 }); GK.noise({ d: 0.05, v: 0.3, f: 1500, q: 1.2 }); });
  const SONG = {
    bpm: 78, steps: 2,
    tracks: [
      { type: 'triangle', v: 0.11, notes: 'G4 - A4 C5 D5 - C5 A4 | G4 - - - E4 - G4 - | A4 - C5 - D5 E5 D5 C5 | A4 - - - . . . . | C5 - D5 E5 G5 - E5 D5 | C5 - A4 G4 A4 - - - | E4 - G4 A4 C5 - A4 G4 | G4 - - - . . . .' },
      { type: 'sine', v: 0.09, notes: 'G2 . . . D3 . . . | C3 . . . G2 . . . | A2 . . . E3 . . . | D3 . . . D3 . . . | C3 . . . G3 . . . | A2 . . . E3 . . . | C3 . . . D3 . . . | G2 . . . G2 . . .' },
    ],
  };
  let gestured = false;
  const music = (on) => { if (on && gestured) { if (!GK.music.playing) GK.music.play(SONG); } else if (!on) GK.music.stop(); };
  const first = () => { if (!gestured) { gestured = true; music(cur === 'title'); } };
  addEventListener('pointerdown', first, { capture: true });
  addEventListener('keydown', first, { capture: true });

  /* ---------------- question makers ---------------- */
  function makeCross(item, r) {
    const [lv, c, words, wrong] = item;
    return { type: 'cross', lv, item, answer: c, options: r.shuffle([c, ...wrong]) };
  }
  function makeYoji(item, r) {
    const [w, , , pos, wrong] = item;
    return { type: 'yoji', item, answer: w[pos], options: r.shuffle([w[pos], ...wrong]) };
  }
  function makeNandoku(item, r) {
    return { type: 'nandoku', item, answer: item[2], options: r.shuffle([item[2], ...item[3].split('、')]) };
  }
  function buildSet(mode, opt, r) {
    if (mode === 'cross') return r.shuffle(CROSS.filter((x) => x[0] === opt)).slice(0, N).map((x) => makeCross(x, r));
    if (mode === 'yoji') return r.shuffle(YOJI.slice()).slice(0, N).map((x) => makeYoji(x, r));
    if (mode === 'nandoku') return r.shuffle(NANDOKU.filter((x) => opt === 'すべて' || x[0] === opt)).slice(0, N).map((x) => makeNandoku(x, r));
    // daily: 4 crosses (one of each level, then any), 3 yoji, 3 nandoku — the same for everyone on the same date
    const cs = [1, 2, 3].map((lv) => r.pick(CROSS.filter((x) => x[0] === lv)));
    cs.push(r.pick(CROSS.filter((x) => !cs.includes(x))));
    const ys = r.shuffle(YOJI.slice()).slice(0, 3), ns = r.shuffle(NANDOKU.slice()).slice(0, 3);
    const qs = [makeCross(cs[0], r), makeYoji(ys[0], r), makeNandoku(ns[0], r), makeCross(cs[1], r), makeYoji(ys[1], r), makeNandoku(ns[1], r), makeCross(cs[2], r), makeNandoku(ns[2], r), makeYoji(ys[2], r), makeCross(cs[3], r)];
    return qs;
  }
  const modeKey = (mode, opt) => (mode === 'cross' ? `cross${opt}` : mode === 'nandoku' ? `nandoku-${opt}` : mode);
  const modeLabel = (mode, opt) => (mode === 'cross' ? `熟語クロス ${LEVELS[opt - 1][0]}` : mode === 'yoji' ? '四字熟語' : mode === 'nandoku' ? `難読漢字（${opt}）` : `今日の10問（${today().slice(5).replace('-', '/')}）`);

  /* ---------------- screens ---------------- */
  let cur = 'title';
  function show(id) {
    cur = id;
    $$('.screen').forEach((s) => s.classList.toggle('on', s.id === 'sc-' + id));
    GK.hudEl && GK.hudEl.classList.add('light');
    if (id === 'title') { refreshTitle(); music(true); }
  }
  function refreshTitle() {
    const b = best();
    const cr = [1, 2, 3].map((l) => b['cross' + l]).filter((x) => x != null);
    $('#rec-cross').textContent = cr.length ? `最高 ${Math.max(...cr)}点` : '';
    $('#rec-yoji').textContent = b.yoji != null ? `最高 ${b.yoji}点` : '';
    const nd = Object.keys(b).filter((k) => k.startsWith('nandoku-')).map((k) => b[k]);
    $('#rec-nandoku').textContent = nd.length ? `最高 ${Math.max(...nd)}点` : '';
    const d = GK.store.get('daily', {}), st = GK.store.get('dailyStreak', { last: '', count: 0 });
    const t = d[today()];
    $('#daily-info').textContent = t != null ? `今日の記録 ${t.score}点（${t.ok}/10 問正解）${st.count > 1 ? `・${st.count}日連続` : ''}　もう一度挑戦できます` : `毎日かわる 10 問（クロス・四字熟語・難読漢字）${st.count > 0 && st.last ? `・連続 ${st.count}日` : ''}`;
  }

  /* ---------------- quiz ---------------- */
  const Q = { list: [], i: 0, score: 0, ok: 0, streak: 0, maxStreak: 0, times: [], answered: false, t0: 0, total0: 0 };
  function startQuiz(mode, opt, seed) {
    const r = GK.rng(seed == null ? undefined : seed);
    Object.assign(Q, { mode, opt, list: buildSet(mode, opt, r), i: -1, score: 0, ok: 0, streak: 0, maxStreak: 0, times: [], total0: performance.now() });
    $('#qz-mode').textContent = modeLabel(mode, opt);
    show('quiz');
    music(true);
    next();
  }
  function next() {
    Q.i++;
    if (Q.i >= Q.list.length) return finish();
    Q.answered = false;
    const q = Q.list[Q.i];
    $('#qz-step').textContent = `${Q.i + 1} / ${Q.list.length}`;
    $('#qz-exp').hidden = true;
    const area = $('#qz-area'), opts = $('#qz-opts');
    opts.style.display = '';
    if (q.type === 'cross') {
      const [, c, words] = q.item;
      const pos = [[1, 3], [3, 1], [3, 5], [5, 3]]; // top, left, right, bottom (row, col in a 5×5 grid)
      const arrowPos = [[2, 3], [3, 2], [3, 4], [4, 3]];
      // arrow: the reading direction. top: outer→center ↓ / center→outer ↑ …
      const arrows = words.map((w, k) => { const inward = w[1] === c; return [inward ? '↓' : '↑', inward ? '→' : '←', inward ? '←' : '→', inward ? '↑' : '↓'][k]; });
      let html = '<div class="cross" role="img" aria-label="熟語クロス">';
      words.forEach((w, k) => { const o = w[0] === c ? w[1] : w[0]; html += `<div class="cell" style="grid-row:${pos[k][0]};grid-column:${pos[k][1]}">${o}</div><div class="arrow" style="grid-row:${arrowPos[k][0]};grid-column:${arrowPos[k][1]}">${arrows[k]}</div>`; });
      html += '<div class="cell center" id="center" style="grid-row:3;grid-column:3">？</div></div>';
      area.innerHTML = html;
      $('#qz-prompt').textContent = '真ん中に入れると、矢印の向きに読んで四つの熟語ができる漢字は？';
      opts.className = 'qz-opts';
      opts.innerHTML = q.options.map((o, k) => `<button class="opt" type="button" data-k="${k}"><span class="k">${k + 1}</span>${o}</button>`).join('');
    } else if (q.type === 'yoji') {
      const [w, , , p] = q.item;
      area.innerHTML = `<div><div class="yoji">${[...w].map((ch, k) => `<div class="cell${k === p ? ' center' : ''}" ${k === p ? 'id="center"' : ''}>${k === p ? '？' : ch}</div>`).join('')}</div><div class="yoji-read" id="yoji-read"></div></div>`;
      $('#qz-prompt').textContent = '四字熟語の空いているところに入る漢字は？';
      opts.className = 'qz-opts k4';
      opts.innerHTML = q.options.map((o, k) => `<button class="opt" type="button" data-k="${k}"><span class="k">${k + 1}</span>${o}</button>`).join('');
    } else {
      const [cat, k] = q.item;
      area.innerHTML = `<div class="nd"><span class="nd-cat">${cat}</span><div class="nd-kanji">${k}</div><div class="nd-read" id="nd-read"></div></div>`;
      $('#qz-prompt').textContent = 'この漢字の読みは？';
      opts.className = 'qz-opts k4';
      opts.innerHTML = q.options.map((o, i) => `<button class="opt kana" type="button" data-k="${i}"><span class="k">${i + 1}</span>${o}</button>`).join('');
    }
    Q.t0 = performance.now();
    updateHud();
  }
  function updateHud() {
    $('#qz-score').textContent = GK.fmt(Q.score);
    $('#qz-streak').textContent = Q.streak;
  }
  function answer(k) {
    if (Q.answered || cur !== 'quiz') return;
    const q = Q.list[Q.i];
    if (!q || k < 0 || k >= q.options.length) return;
    Q.answered = true;
    const dt = (performance.now() - Q.t0) / 1000;
    const ok = q.options[k] === q.answer;
    const btns = $$('#qz-opts .opt');
    btns.forEach((b, i) => { b.disabled = true; if (q.options[i] === q.answer) b.classList.add('ok'); else if (i === k) b.classList.add('ng'); else b.classList.add('dim'); });
    let gain = 0;
    if (ok) {
      Q.ok++; Q.streak++; Q.maxStreak = Math.max(Q.maxStreak, Q.streak); Q.times.push(dt);
      gain = 100 + Math.round(Math.max(0, 10 - dt) * 5) + Math.min(Q.streak - 1, 5) * 10;
      Q.score += gain;
      GK.sfx('ok');
    } else { Q.streak = 0; GK.sfx('ng'); }
    // fill the blank
    const center = $('#center');
    if (center) { center.textContent = q.answer; center.classList.add('filled'); if (!ok) center.classList.add('ng'); setTimeout(() => GK.sfx('stamp'), 120); }
    if (q.type === 'yoji') $('#yoji-read').textContent = q.item[1];
    if (q.type === 'nandoku') $('#nd-read').textContent = q.item[2];
    // explanation
    $('#ex-res').textContent = ok ? `正解！ +${gain}` : '残念…';
    $('#ex-res').className = ok ? 'ok' : 'ng';
    $('#ex-say').textContent = (ok ? GK.random.pick(OK_SAY) : GK.random.pick(NG_SAY)) + (ok ? `（${dt.toFixed(1)}秒）` : `　正解は「${q.answer}」`);
    $('#ex-mascot').src = `img/mascot-${ok ? 'happy' : 'sad'}.webp`;
    let body = '';
    if (q.type === 'cross') {
      body = '<ul>' + q.item[2].map((w) => `<li><b>${w}</b><small>${DICT[w][0]}</small><br>${DICT[w][1]}</li>`).join('') + '</ul>';
    } else if (q.type === 'yoji') {
      body = `<div><span class="big">${q.item[0]}</span><span class="yomi">${q.item[1]}</span></div><div>${q.item[2]}</div>`;
    } else {
      body = `<div><span class="big">${q.item[1]}</span><span class="yomi">${q.item[2]}</span>　<small>${q.item[0]}</small></div><div>${q.item[4]}</div>`;
    }
    $('#ex-body').innerHTML = body;
    $('#btn-next').textContent = Q.i + 1 >= Q.list.length ? '結果を見る' : '次へ';
    setTimeout(() => { if (Q.answered && cur === 'quiz') { $('#qz-exp').hidden = false; $('#qz-opts').style.display = 'none'; } }, 380);
    updateHud();
  }
  function finish() {
    const key = Q.mode === 'daily' ? null : modeKey(Q.mode, Q.opt);
    const all = best();
    let isBest = false, prev = null;
    if (key) { prev = all[key]; isBest = prev == null || Q.score > prev; if (isBest && !Q.test) { all[key] = Q.score; GK.store.set('best', all); } }
    let dailyNote = '';
    if (Q.mode === 'daily' && !Q.test) {
      const d = GK.store.get('daily', {}), t = today(), had = d[t];
      if (!had || Q.score > had.score) d[t] = { score: Q.score, ok: Q.ok };
      GK.store.set('daily', d);
      const st = GK.store.get('dailyStreak', { last: '', count: 0 });
      if (st.last !== t) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        const ys = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
        st.count = st.last === ys ? st.count + 1 : 1; st.last = t;
        GK.store.set('dailyStreak', st);
      }
      dailyNote = `${st.count}日連続の挑戦です。${had ? `今日のこれまでの記録は ${had.score}点。` : ''}明日はまた新しい 10 問になります。`;
      isBest = !had || Q.score > had.score;
    }
    const avg = Q.times.length ? Q.times.reduce((a, b) => a + b, 0) / Q.times.length : null;
    const face = Q.ok >= 7 ? 'happy' : Q.ok >= 4 ? 'normal' : 'sad';
    GK.sfx(Q.ok >= 7 ? 'win' : 'ok');
    const body = `<img class="res-mascot" src="img/mascot-${face}.webp" alt="">
      <p class="res-big">${GK.fmt(Q.score)}点</p>
      <p class="res-sub">${Q.ok} / ${Q.list.length} 問正解　${Q.ok === Q.list.length ? '― 全問正解、お見事！' : Q.ok >= 7 ? '― よくできました' : Q.ok >= 4 ? '― あと少し' : '― 解説で覚えて、もう一度'}</p>
      <div class="res-stats">
        <div><span>正解の平均時間</span><b>${avg == null ? '―' : avg.toFixed(1) + '秒'}</b></div>
        <div><span>最大連続正解</span><b>${Q.maxStreak}問</b></div>
        <div><span>かかった時間</span><b>${((performance.now() - Q.total0) / 1000).toFixed(0)}秒</b></div>
        <div><span>${key ? 'これまでの最高' : '今日の挑戦'}</span><b>${key ? (prev == null ? '―' : prev + '点') : '記録しました'}</b></div>
      </div>
      <p class="res-best">${dailyNote || (isBest ? (prev == null ? '初めての記録です！' : '最高点を更新しました！') : '')}</p>`;
    GK.modal({ title: modeLabel(Q.mode, Q.opt) + ' の結果', body, dismissable: false, buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: 'もう一度', value: 'again', primary: true }] })
      .then((v) => { if (v === 'again') startQuiz(Q.mode, Q.opt, Q.mode === 'daily' ? daySeed(today()) : undefined); else show('title'); });
  }

  $('#qz-opts').addEventListener('click', (e) => { const b = e.target.closest('.opt'); if (b) answer(+b.dataset.k); });
  $('#btn-next').addEventListener('click', () => { GK.sfx('click'); next(); });
  addEventListener('keydown', (e) => {
    if (document.querySelector('.gk-modal-back') || cur !== 'quiz') return;
    if (/^[1-8]$/.test(e.key)) answer(+e.key - 1);
    else if ((e.key === 'Enter' || e.key === ' ') && Q.answered && !$('#qz-exp').hidden) { e.preventDefault(); next(); }
    else if (e.key === 'Escape') openMenu();
  });
  GK.loop(() => { if (cur === 'quiz' && !Q.answered && Q.i >= 0) $('#qz-time').textContent = ((performance.now() - Q.t0) / 1000).toFixed(1); });

  /* ---------------- mode pickers ---------------- */
  function pickLevel() {
    const b = best();
    const root = document.createElement('div');
    root.className = 'lv-pick';
    root.innerHTML = LEVELS.map(([n, d], i) => `<button type="button" data-lv="${i + 1}"><span><b>${n}</b><br><small>${d}・${CROSS.filter((x) => x[0] === i + 1).length}題から10問</small></span><i>${b['cross' + (i + 1)] != null ? `最高 ${b['cross' + (i + 1)]}点` : ''}</i></button>`).join('');
    let close = null;
    root.addEventListener('click', (e) => { const x = e.target.closest('button'); if (!x) return; GK.sfx('select'); close(+x.dataset.lv); });
    GK.modal({ title: '熟語クロス ― 級を選ぶ', body: root, buttons: [{ label: 'やめる', value: null, ghost: true }], onOpen: (c, cl) => { close = cl; } })
      .then((v) => { if (v) startQuiz('cross', v); });
  }
  function pickCat() {
    const b = best();
    const root = document.createElement('div');
    root.className = 'cat-pick';
    root.innerHTML = CATS.map((c) => `<button type="button" data-c="${c}"><span><b>${c}</b><br><small>${c === 'すべて' ? NANDOKU.length : NANDOKU.filter((x) => x[0] === c).length}題</small></span><i>${b['nandoku-' + c] != null ? `最高 ${b['nandoku-' + c]}点` : ''}</i></button>`).join('');
    let close = null;
    root.addEventListener('click', (e) => { const x = e.target.closest('button'); if (!x) return; GK.sfx('select'); close(x.dataset.c); });
    GK.modal({ title: '難読漢字 ― 分野を選ぶ', body: root, wide: true, buttons: [{ label: 'やめる', value: null, ghost: true }], onOpen: (c, cl) => { close = cl; } })
      .then((v) => { if (v) startQuiz('nandoku', v); });
  }
  $('#sc-title').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]'); if (!b) return;
    GK.sfx('select');
    if (b.dataset.mode === 'cross') pickLevel(); else if (b.dataset.mode === 'nandoku') pickCat(); else startQuiz('yoji');
  });
  $('#btn-daily').addEventListener('click', () => { GK.sfx('select'); startQuiz('daily', null, daySeed(today())); });

  /* ---------------- menu & help ---------------- */
  function openMenu() {
    if (cur === 'title') return GK.help();
    GK.modal({ title: 'メニュー', body: '<p>この回をやめてタイトルに戻りますか？</p>', buttons: [{ label: 'タイトルへ', value: 'title', ghost: true }, { label: '最初から', value: 'retry' }, { label: '続ける', value: null, primary: true }] })
      .then((v) => { if (v === 'title') show('title'); else if (v === 'retry') startQuiz(Q.mode, Q.opt, Q.mode === 'daily' ? daySeed(today()) : undefined); });
  }
  const HELP = `
    <p>漢字の問題を 1 回 10 問。答えると、読みと意味の解説が出ます。速く答えるほど、続けて正解するほど得点が上がります。</p>
    <h3>熟語クロス</h3>
    <p>真ん中の「？」に一字を入れて、上・左・右・下の漢字とそれぞれ二字の熟語を作ります。<b>矢印の向きに読みます</b>（例: 上に「大」、↓ なら「大＋？」、右に「校」、→ なら「？＋校」）。8 つの候補から選びます。初級・中級・上級の 3 つの級があります。</p>
    <h3>四字熟語</h3>
    <p>四字熟語の空いている一字を、4 つから選びます。「危機一髪」「五里霧中」など、書きまちがえやすい字も出ます。</p>
    <h3>難読漢字</h3>
    <p>魚・野菜・植物・動物・地名・食べ物の、読むのが難しい漢字の読みを 4 つから選びます。</p>
    <h3>今日の10問</h3>
    <p>日付で決まる 10 問（クロス 4・四字熟語 3・難読漢字 3）。同じ日はだれが遊んでも同じ問題です。続けて挑戦した日数も記録します。</p>
    <h3>得点</h3>
    <p>正解 100 点 ＋ 速さのボーナス（10 秒以内で最大 50 点）＋ 連続正解のボーナス（最大 50 点）。</p>
    <h3>操作</h3>
    <p>候補をクリック / タップ。キーボードでは <kbd>1</kbd>〜<kbd>8</kbd> で答え、<kbd>Enter</kbd> で次へ、<kbd>Esc</kbd> でメニュー。</p>`;
  GK.init({ id: 'jukugo-puzzle', title: '筆まる漢字帖', help: HELP, menu: openMenu });
  show('title');

  /* ---------------- self-test (npm run game-check) ---------------- */
  const until = async (fn, ms = 4000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) return false; await GK.wait(25); } return true; };
  const clickBtn = async (label) => { await until(() => $$('.gk-modal .gk-btn').some((b) => b.textContent.includes(label)), 3000); const b = $$('.gk-modal .gk-btn').find((x) => x.textContent.includes(label)); if (b) b.click(); await GK.wait(260); return !!b; };
  window.__gameSelfTest = async () => {
    const notes = [];
    let ok = true;
    const fail = (m) => { ok = false; notes.push('NG: ' + m); };
    Q.test = true;
    // data sanity
    if (CROSS.length + YOJI.length + NANDOKU.length < 120) fail('fewer than 120 items');
    // 熟語クロス
    startQuiz('cross', 1);
    const q1 = Q.list[0];
    answer(q1.options.indexOf(q1.answer));
    if (Q.ok !== 1) fail('cross: correct answer not counted');
    await until(() => !$('#qz-exp').hidden, 1500);
    if (window.__shot) await window.__shot('cross');
    $('#btn-next').click();
    const q2 = Q.list[1];
    answer((q2.options.indexOf(q2.answer) + 1) % q2.options.length);
    if (Q.ok !== 1 || Q.streak !== 0) fail('cross: wrong answer counted');
    await until(() => !$('#qz-exp').hidden, 1500);
    if (window.__shot) await window.__shot('cross-wrong');
    Q.i = Q.list.length - 1; next();
    await until(() => !!$('.gk-modal'), 2000);
    if (window.__shot) await window.__shot('result');
    await clickBtn('タイトルへ');
    // 四字熟語
    startQuiz('yoji');
    answer(Q.list[0].options.indexOf(Q.list[0].answer));
    await until(() => !$('#qz-exp').hidden, 1500);
    if (window.__shot) await window.__shot('yoji');
    // 難読漢字
    startQuiz('nandoku', '魚');
    if (Q.list.some((q) => q.item[0] !== '魚')) fail('nandoku category filter');
    if (window.__shot) await window.__shot('nandoku');
    answer(Q.list[0].options.indexOf(Q.list[0].answer));
    // 今日の10問: same date → same questions
    const a = buildSet('daily', null, GK.rng(20261118)).map((q) => q.answer + q.options.join(''));
    const b = buildSet('daily', null, GK.rng(20261118)).map((q) => q.answer + q.options.join(''));
    const c = buildSet('daily', null, GK.rng(20261119)).map((q) => q.answer + q.options.join(''));
    if (a.join() !== b.join()) fail('daily set is not stable for a date');
    if (a.join() === c.join()) fail('daily set does not change by date');
    if (a.length !== 10) fail('daily has ' + a.length);
    startQuiz('daily', null, daySeed(today()));
    if (window.__shot) await window.__shot('daily');
    notes.push(`cross/yoji/nandoku/daily ok; ${CROSS.length + YOJI.length + NANDOKU.length} items`);
    show('title');
    Q.test = false;
    return { ok, notes };
  };
})();
