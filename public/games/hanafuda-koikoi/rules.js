/*
 * 花暦こいこい — rules, scoring and CPU logic (pure: no DOM). Browser: window.HanaRules · Node: require('./rules.js').
 *
 * Cards: id "MM-K" (month 01–12, K 1–4 in the order 光/タネ → 短冊 → カス). Image name "card-MM-K".
 * State (one month): { hands: [[ids], [ids]], field: [id | null …] (slots), deck: [ids] (top = last), capt: [[ids], [ids]],
 *                      koi: [n, n] (こいこい calls), shown: [pts, pts] (score at the last decision), opt }
 */
(function (root, factory) {
  const R = factory();
  if (typeof module === 'object' && module.exports) module.exports = R;
  else root.HanaRules = R;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MONTHS = [
    null,
    { plant: '松', color: '#2e6b3f', dark: '#163a22' },
    { plant: '梅', color: '#b8336a', dark: '#5e1535' },
    { plant: '桜', color: '#e07fa6', dark: '#8a3a5c' },
    { plant: '藤', color: '#7b5ba8', dark: '#3b2858' },
    { plant: '菖蒲', color: '#3b4f9e', dark: '#1b2552' },
    { plant: '牡丹', color: '#c22f4c', dark: '#5f1424' },
    { plant: '萩', color: '#9c3f6e', dark: '#4a1a34' },
    { plant: '芒', color: '#a77a22', dark: '#3a2a10' },
    { plant: '菊', color: '#c99a12', dark: '#5e4708' },
    { plant: '紅葉', color: '#c4451c', dark: '#5c1f0b' },
    { plant: '柳', color: '#4f7a46', dark: '#24381f' },
    { plant: '桐', color: '#6a4a86', dark: '#2f2040' },
  ];

  // [month, k, type, name, sub]  — type: hikari | tane | tan | kasu · sub (tan): aka (赤短・文字入り) | ao (青短) | red (無地の赤い短冊)
  const DEFS = [
    [1, 1, 'hikari', '松に鶴'], [1, 2, 'tan', '松に赤短', 'aka'], [1, 3, 'kasu', '松のカス'], [1, 4, 'kasu', '松のカス'],
    [2, 1, 'tane', '梅に鶯'], [2, 2, 'tan', '梅に赤短', 'aka'], [2, 3, 'kasu', '梅のカス'], [2, 4, 'kasu', '梅のカス'],
    [3, 1, 'hikari', '桜に幕'], [3, 2, 'tan', '桜に赤短', 'aka'], [3, 3, 'kasu', '桜のカス'], [3, 4, 'kasu', '桜のカス'],
    [4, 1, 'tane', '藤に杜鵑'], [4, 2, 'tan', '藤に短冊', 'red'], [4, 3, 'kasu', '藤のカス'], [4, 4, 'kasu', '藤のカス'],
    [5, 1, 'tane', '菖蒲に八橋'], [5, 2, 'tan', '菖蒲に短冊', 'red'], [5, 3, 'kasu', '菖蒲のカス'], [5, 4, 'kasu', '菖蒲のカス'],
    [6, 1, 'tane', '牡丹に蝶'], [6, 2, 'tan', '牡丹に青短', 'ao'], [6, 3, 'kasu', '牡丹のカス'], [6, 4, 'kasu', '牡丹のカス'],
    [7, 1, 'tane', '萩に猪'], [7, 2, 'tan', '萩に短冊', 'red'], [7, 3, 'kasu', '萩のカス'], [7, 4, 'kasu', '萩のカス'],
    [8, 1, 'hikari', '芒に月'], [8, 2, 'tane', '芒に雁'], [8, 3, 'kasu', '芒のカス'], [8, 4, 'kasu', '芒のカス'],
    [9, 1, 'tane', '菊に盃'], [9, 2, 'tan', '菊に青短', 'ao'], [9, 3, 'kasu', '菊のカス'], [9, 4, 'kasu', '菊のカス'],
    [10, 1, 'tane', '紅葉に鹿'], [10, 2, 'tan', '紅葉に青短', 'ao'], [10, 3, 'kasu', '紅葉のカス'], [10, 4, 'kasu', '紅葉のカス'],
    [11, 1, 'hikari', '柳に小野道風'], [11, 2, 'tane', '柳に燕'], [11, 3, 'tan', '柳に短冊', 'red'], [11, 4, 'kasu', '柳のカス（雷）'],
    [12, 1, 'hikari', '桐に鳳凰'], [12, 2, 'kasu', '桐のカス'], [12, 3, 'kasu', '桐のカス'], [12, 4, 'kasu', '桐のカス'],
  ];
  const pad = (n) => String(n).padStart(2, '0');
  const TYPE_JA = { hikari: '光', tane: 'タネ', tan: '短冊', kasu: 'カス' };
  const TYPE_ORDER = { hikari: 0, tane: 1, tan: 2, kasu: 3 };
  const CARDS = DEFS.map(([m, k, type, name, sub]) => ({ id: `${pad(m)}-${k}`, m, k, type, name, sub: sub || null, img: `card-${pad(m)}-${k}`, plant: MONTHS[m].plant }));
  const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
  const card = (id) => BY_ID[id];
  const badgeOf = (c) => (c.type === 'tan' ? (c.sub === 'aka' ? '赤短' : c.sub === 'ao' ? '青短' : '短冊') : TYPE_JA[c.type]);

  const RAIN = '11-1', SAKURA = '03-1', MOON = '08-1', SAKE = '09-1';
  const ISC = ['07-1', '10-1', '06-1'];
  const AKA = ['01-2', '02-2', '03-2'];
  const AO = ['06-2', '09-2', '10-2'];
  const HIKARI = ['01-1', '03-1', '08-1', '11-1', '12-1'];

  const DEFAULT_OPT = { kikuKasu: true, double7: true, koiGaeshi: true, teyaku: true };

  const YAKU_NAME = {
    goko: '五光', shiko: '四光', ameshiko: '雨四光', sanko: '三光', hanami: '花見で一杯', tsukimi: '月見で一杯',
    isc: '猪鹿蝶', akaao: '赤短・青短の重複', akatan: '赤短', aotan: '青短', tane: 'タネ', tan: 'タン', kasu: 'カス',
    teshi: '手四', kuttsuki: 'くっつき',
  };

  /** the 役 of a pile of captured cards → { list: [{ key, name, pts, cards, extra }], total } */
  function yaku(ids, opt) {
    opt = Object.assign({}, DEFAULT_OPT, opt);
    const has = new Set(ids);
    const h = (id) => has.has(id);
    const cs = ids.map(card);
    const list = [];
    const add = (key, pts, cards, extra) => list.push({ key, name: YAKU_NAME[key], pts, cards, extra: extra || 0 });
    const hik = HIKARI.filter(h), rain = h(RAIN);
    if (hik.length === 5) add('goko', 10, hik);
    else if (hik.length === 4) add(rain ? 'ameshiko' : 'shiko', rain ? 7 : 8, hik);
    else if (hik.length === 3 && !rain) add('sanko', 5, hik);
    if (h(SAKURA) && h(SAKE)) add('hanami', 5, [SAKURA, SAKE]);
    if (h(MOON) && h(SAKE)) add('tsukimi', 5, [MOON, SAKE]);
    const tane = cs.filter((c) => c.type === 'tane').map((c) => c.id);
    const tan = cs.filter((c) => c.type === 'tan').map((c) => c.id);
    const kasu = cs.filter((c) => c.type === 'kasu').map((c) => c.id);
    if (opt.kikuKasu && h(SAKE)) kasu.push(SAKE);
    // 猪鹿蝶: 5点、ほかのタネ 1 枚ごとに +1（タネの役とは重ねて数えない）
    if (ISC.every(h)) add('isc', 5 + (tane.length - 3), tane, tane.length - 3);
    else if (tane.length >= 5) add('tane', tane.length - 4, tane);
    // 赤短・青短: 5点、ほかの短冊 1 枚ごとに +1。両方そろうと「赤短・青短の重複」10点（+1）。成立中はタンの役を重ねない
    const aka = AKA.every(h), ao = AO.every(h);
    if (aka && ao) add('akaao', 10 + (tan.length - 6), tan, tan.length - 6);
    else if (aka) add('akatan', 5 + (tan.length - 3), tan, tan.length - 3);
    else if (ao) add('aotan', 5 + (tan.length - 3), tan, tan.length - 3);
    else if (tan.length >= 5) add('tan', tan.length - 4, tan);
    if (kasu.length >= 10) add('kasu', kasu.length - 9, kasu);
    return { list, total: list.reduce((s, y) => s + y.pts, 0) };
  }

  /** how far each 役 is (for the display): [{ key, name, have, need, done }] */
  function progress(ids, opt) {
    opt = Object.assign({}, DEFAULT_OPT, opt);
    const has = new Set(ids);
    const n = (arr) => arr.filter((id) => has.has(id)).length;
    const cs = ids.map(card);
    const cnt = (t) => cs.filter((c) => c.type === t).length;
    const hikNoRain = n(HIKARI.filter((x) => x !== RAIN));
    const out = [
      { key: 'hikari', name: '光', have: Math.max(hikNoRain, n(HIKARI) >= 4 ? n(HIKARI) : 0), need: 3, w: 5 },
      { key: 'isc', name: '猪鹿蝶', have: n(ISC), need: 3, w: 5 },
      { key: 'akatan', name: '赤短', have: n(AKA), need: 3, w: 5 },
      { key: 'aotan', name: '青短', have: n(AO), need: 3, w: 5 },
      { key: 'hanami', name: '花見', have: n([SAKURA, SAKE]), need: 2, w: 5 },
      { key: 'tsukimi', name: '月見', have: n([MOON, SAKE]), need: 2, w: 5 },
      { key: 'tane', name: 'タネ', have: cnt('tane'), need: 5, w: 1 },
      { key: 'tan', name: 'タン', have: cnt('tan'), need: 5, w: 1 },
      { key: 'kasu', name: 'カス', have: cnt('kasu') + (opt.kikuKasu && has.has(SAKE) ? 1 : 0), need: 10, w: 1 },
    ];
    out.forEach((p) => { p.done = p.have >= p.need; });
    return out;
  }

  /** 手役 at the deal: 手四 (four of a month) or くっつき (four pairs) → { key, name, pts } | null */
  function teyaku(hand) {
    const by = {};
    hand.forEach((id) => { const m = card(id).m; by[m] = (by[m] || 0) + 1; });
    const counts = Object.values(by);
    if (counts.some((c) => c === 4)) return { key: 'teshi', name: YAKU_NAME.teshi, pts: 6 };
    if (hand.length === 8 && counts.length === 4 && counts.every((c) => c === 2)) return { key: 'kuttsuki', name: YAKU_NAME.kuttsuki, pts: 6 };
    return null;
  }

  /** the points of a win: base × (7点以上で倍) × (こいこい返し) */
  function settle(base, opt, oppKoi) {
    opt = Object.assign({}, DEFAULT_OPT, opt);
    let pts = base;
    const mult = [];
    if (opt.double7 && base >= 7) { pts *= 2; mult.push('7点以上で倍'); }
    if (opt.koiGaeshi && oppKoi) { pts *= 2; mult.push('こいこい返し'); }
    return { pts, mult };
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  const fieldMonthFour = (field) => { const by = {}; field.forEach((id) => { const m = card(id).m; by[m] = (by[m] || 0) + 1; }); return Object.values(by).some((c) => c === 4); };

  /** deals a month (8/8/8, redealt while the field holds four of a month). oya deals first to … (order does not matter) */
  function deal(rng, opt) {
    let st, tries = 0;
    do {
      const ids = shuffle(CARDS.map((c) => c.id), rng);
      st = { hands: [ids.slice(0, 8), ids.slice(8, 16)], field: ids.slice(16, 24), deck: ids.slice(24), capt: [[], []], koi: [0, 0], shown: [0, 0], redeals: tries, opt: Object.assign({}, DEFAULT_OPT, opt) };
      tries++;
    } while (fieldMonthFour(st.field) && tries < 100);
    st.redeals = tries - 1;
    return st;
  }

  const fieldCards = (st) => st.field.filter(Boolean);
  const matchesOf = (id, field) => field.filter((f) => f && card(f).m === card(id).m);

  function takeFromHand(st, p, id) {
    const i = st.hands[p].indexOf(id);
    if (i < 0) throw new Error('card not in hand: ' + id);
    st.hands[p].splice(i, 1);
  }
  function drawTop(st) { return st.deck.pop(); }
  function placeOnField(st, id) {
    const i = st.field.indexOf(null);
    if (i >= 0) st.field[i] = id; else st.field.push(id);
  }
  /** the field cards a card would take: none / one (the chosen one when two match) / all three */
  function takes(st, id, target) {
    const ms = matchesOf(id, st.field);
    if (ms.length === 0) return [];
    if (ms.length === 2) return [ms.includes(target) ? target : ms[0]];
    return ms; // 1 or 3 (三枚とも取る)
  }
  /** resolves a played or drawn card: captures or places it. → { took: [ids] } */
  function resolve(st, p, id, target) {
    const took = takes(st, id, target);
    if (!took.length) { placeOnField(st, id); return { took }; }
    took.forEach((t) => { st.field[st.field.indexOf(t)] = null; });
    st.capt[p].push(id, ...took);
    return { took };
  }
  const sortCapt = (ids) => ids.slice().sort((a, b) => TYPE_ORDER[card(a).type] - TYPE_ORDER[card(b).type] || card(a).m - card(b).m || card(a).k - card(b).k);
  /** 親決め: the earlier month wins; the same month → the higher card (smaller k) */
  const oyaCompare = (a, b) => card(a).m - card(b).m || card(a).k - card(b).k;

  /* ---------------- CPU ---------------- */
  const BASE = { hikari: 3, tane: 1.5, tan: 1.2, kasu: 0.5 };
  const GROUPS = [
    { cards: HIKARI.filter((x) => x !== RAIN), need: 3, pts: 5 },
    { cards: ISC, need: 3, pts: 5 }, { cards: AKA, need: 3, pts: 5 }, { cards: AO, need: 3, pts: 5 },
    { cards: [SAKURA, SAKE], need: 2, pts: 5 }, { cards: [MOON, SAKE], need: 2, pts: 5 },
  ];
  /** how good a pile is for its owner (yaku points weighted high, progress and card values a little) */
  function potential(ids, opt, blocked) {
    const has = new Set(ids);
    let v = yaku(ids, opt).total * 6;
    for (const g of GROUPS) {
      const have = g.cards.filter((c) => has.has(c)).length;
      if (have >= g.need) continue;
      if (blocked && g.cards.some((c) => blocked.has(c))) continue; // the other player already holds a card of it
      v += 3 * Math.pow(have / g.need, 2) * g.pts / 5;
    }
    const cs = ids.map(card);
    const counts = { tane: cs.filter((c) => c.type === 'tane').length, tan: cs.filter((c) => c.type === 'tan').length, kasu: cs.filter((c) => c.type === 'kasu').length };
    v += 1.4 * Math.pow(Math.min(counts.tane, 5) / 5, 2) + 1.4 * Math.pow(Math.min(counts.tan, 5) / 5, 2) + 1.4 * Math.pow(Math.min(counts.kasu, 10) / 10, 2);
    v += cs.reduce((s, c) => s + BASE[c.type] * 0.35, 0);
    return v;
  }
  const LEVELS = [
    { deny: 0, risk: 0.25, noise: 3.0 },
    { deny: 0.55, risk: 0.7, noise: 0.6 },
    { deny: 0.95, risk: 1.0, noise: 0 },
  ];
  function gainFor(st, p, cards) {
    const mine = st.capt[p], opp = st.capt[1 - p];
    const bOpp = new Set(opp), bMine = new Set(mine);
    return {
      me: potential(mine.concat(cards), st.opt, bOpp) - potential(mine, st.opt, bOpp),
      opp: potential(opp.concat(cards), st.opt, bMine) - potential(opp, st.opt, bMine),
    };
  }
  /** cards p cannot see (the other hand + the deck) */
  function unseenCount(st, p) { return st.hands[1 - p].length + st.deck.length; }
  function unseenOfMonth(st, p, m) {
    const seen = st.hands[p].concat(fieldCards(st), st.capt[0], st.capt[1]).filter((id) => card(id).m === m).length;
    return 4 - seen;
  }
  function placeRisk(st, p, id, extraOnField) {
    const m = card(id).m;
    const u = unseenOfMonth(st, p, m) - (extraOnField ? 1 : 0);
    if (u <= 0) return 0;
    const U = Math.max(1, unseenCount(st, p));
    const oppHand = st.hands[1 - p].length;
    const pr = 1 - Math.pow(1 - Math.min(1, (oppHand + 1) / U), u);
    const pile = [id].concat(matchesOf(id, st.field));
    return gainFor(st, 1 - p, pile).me * pr;
  }
  function evalTake(st, p, cards, lv) { const g = gainFor(st, p, cards); return g.me + lv.deny * g.opp; }

  /** the CPU's hand play → { card, target } */
  function aiChooseHand(st, p, level, rng) {
    const lv = LEVELS[level] || LEVELS[1];
    let best = null;
    for (const id of st.hands[p]) {
      const ms = matchesOf(id, st.field);
      const options = ms.length === 2 ? ms.map((t) => [t]) : [ms];
      for (const take of options) {
        let v;
        if (take.length) {
          v = evalTake(st, p, [id].concat(take), lv);
          // keeping a pair of the field for later is fine; taking the last of a month is safe
        } else {
          v = -lv.risk * placeRisk(st, p, id, false) - 0.2 * BASE[card(id).type];
        }
        if (lv.noise) v += (rng() - 0.5) * lv.noise;
        if (!best || v > best.v) best = { card: id, target: take.length === 1 ? take[0] : null, v };
      }
    }
    return best;
  }
  /** which of two matching field cards to take with a card (hand or drawn) */
  function aiChooseTarget(st, p, id, level, rng) {
    const lv = LEVELS[level] || LEVELS[1];
    const ms = matchesOf(id, st.field);
    if (ms.length !== 2) return ms[0] || null;
    const vs = ms.map((t) => evalTake(st, p, [id, t], lv) + (lv.noise ? (rng() - 0.5) * lv.noise * 0.3 : 0));
    return vs[0] >= vs[1] ? ms[0] : ms[1];
  }
  /** how close the other player is to a new 役 (points that could come soon) */
  function threat(st, p) {
    const q = 1 - p, have = new Set(st.capt[q]), mine = new Set(st.capt[p]);
    let t = 0;
    for (const g of GROUPS) {
      const missing = g.cards.filter((c) => !have.has(c));
      if (missing.length === 1 && !mine.has(missing[0])) t += g.pts;
      else if (missing.length === 2 && g.need === 3 && !missing.some((c) => mine.has(c))) t += 1;
    }
    const pr = progress(st.capt[q], st.opt);
    for (const k of ['tane', 'tan', 'kasu']) { const x = pr.find((y) => y.key === k); if (x.need - x.have === 1) t += 1.5; }
    if (st.koi[q]) t += 2;
    return t;
  }
  function nearMine(st, p) {
    const have = new Set(st.capt[p]), opp = new Set(st.capt[1 - p]);
    let n = 0;
    for (const g of GROUPS) {
      const missing = g.cards.filter((c) => !have.has(c));
      if (missing.length === 1 && !opp.has(missing[0])) n++;
    }
    return n;
  }
  /** true = こいこい, false = 勝負 */
  function aiKoikoi(st, p, level, rng) {
    const S = yaku(st.capt[p], st.opt).total;
    const left = st.hands[p].length, other = st.hands[1 - p].length;
    if (left === 0 || (left <= 1 && other === 0)) return false;
    const th = threat(st, p);
    if (level === 0) return S < 5 && left >= 3 && rng() < 0.45;
    if (st.koi[1 - p]) return false;
    if (level === 1) return S <= 3 && left >= 4 && th < 4;
    if (st.opt.double7 && S >= 7) return false;
    if (th >= 5) return false;
    const near = nearMine(st, p);
    if (st.opt.double7 && S >= 4 && near >= 1 && left >= 3 && th < 3) return true;
    if (S <= 3 && left >= 4 && th <= 2) return true;
    if (S <= 2 && left >= 3 && near >= 1 && th < 2) return true;
    return false;
  }

  /** plays a whole month with CPUs on both sides (for tests). → { winner: 0|1|-1, pts, base, yaku, teyaku } */
  function simulateMonth(rng, opt, levels, oya) {
    const st = deal(rng, opt);
    if (st.opt.teyaku) {
      const t0 = teyaku(st.hands[0]), t1 = teyaku(st.hands[1]);
      if (t0 && t1) return { winner: -1, pts: 0, teyaku: true, st };
      if (t0 || t1) return { winner: t0 ? 0 : 1, pts: 6, base: 6, teyaku: true, st };
    }
    let p = oya;
    while (st.hands[0].length || st.hands[1].length) {
      if (!st.hands[p].length) { p = 1 - p; continue; }
      const ch = aiChooseHand(st, p, levels[p], rng);
      takeFromHand(st, p, ch.card);
      resolve(st, p, ch.card, ch.target || aiChooseTarget(st, p, ch.card, levels[p], rng));
      const d = drawTop(st);
      resolve(st, p, d, aiChooseTarget(st, p, d, levels[p], rng));
      const y = yaku(st.capt[p], st.opt);
      if (y.total > st.shown[p]) {
        st.shown[p] = y.total;
        if (aiKoikoi(st, p, levels[p], rng)) st.koi[p]++;
        else { const s = settle(y.total, st.opt, st.koi[1 - p] > 0); return { winner: p, pts: s.pts, base: y.total, yaku: y, st }; }
      }
      p = 1 - p;
    }
    return { winner: -1, pts: 0, st };
  }

  return {
    MONTHS, CARDS, BY_ID, card, TYPE_JA, TYPE_ORDER, badgeOf, YAKU_NAME, DEFAULT_OPT, HIKARI, ISC, AKA, AO, RAIN, SAKE,
    yaku, progress, teyaku, settle, deal, shuffle, matchesOf, fieldCards, takeFromHand, drawTop, placeOnField, takes, resolve,
    sortCapt, oyaCompare, potential, aiChooseHand, aiChooseTarget, aiKoikoi, threat, simulateMonth,
  };
});
