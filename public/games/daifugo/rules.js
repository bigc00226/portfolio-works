/*
 * 番狂わせ大富豪 — rules, legal plays, game engine and CPU logic (pure: no DOM). Browser: window.DaifugoRules · Node: require().
 *
 * Cards: "S03".."C15" (suit S♠ H♥ D♦ C♣, rank 03–10, 11 J, 12 Q, 13 K, 14 A, 15 2) and jokers "X1" (/"X2").
 * Seats 0–3 play in order 0 → 1 → 2 → 3. A play: { cards, type: single | group | seq, n, rank (seq: lowest), top, joker, suits }.
 */
(function (root, factory) {
  const R = factory();
  if (typeof module === 'object' && module.exports) module.exports = R;
  else root.DaifugoRules = R;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SUITS = ['S', 'H', 'D', 'C'];
  const SUIT_JA = { S: 'スペード', H: 'ハート', D: 'ダイヤ', C: 'クラブ' };
  const SUIT_MARK = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const RANK_LABEL = { 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: 'JOKER' };
  const DEFAULT_OPT = { revolution: true, seqRev: false, eight: true, jback: true, shibari: true, spade3: true, miyako: true, hansoku: true, seven: false, ten: false, passLock: true, jokers: 1 };
  const POS_NAME = ['大富豪', '富豪', '貧民', '大貧民'];
  const POS_POINTS = [3, 2, 1, 0];

  const CACHE = {};
  function card(id) {
    if (CACHE[id]) return CACHE[id];
    const c = id[0] === 'X' ? { id, s: 'X', r: 16, joker: true } : { id, s: id[0], r: +id.slice(1), joker: false };
    return (CACHE[id] = c);
  }
  function makeDeck(jokers = 1) {
    const d = [];
    for (const s of SUITS) for (let r = 3; r <= 15; r++) d.push(s + String(r).padStart(2, '0'));
    for (let i = 1; i <= jokers; i++) d.push('X' + i);
    return d;
  }
  const label = (id) => { const c = card(id); return c.joker ? 'ジョーカー' : SUIT_MARK[c.s] + RANK_LABEL[c.r]; };
  /** effective strength 0 (weakest) … 12 (strongest), joker 13 */
  const val = (r, rev) => (r >= 16 ? 13 : rev ? 15 - r : r - 3);
  const normalSort = (a, b) => val(card(a).r, false) - val(card(b).r, false) || SUITS.indexOf(card(a).s) - SUITS.indexOf(card(b).s);

  /* ---------------- plays ---------------- */
  /** every way a set of cards can be played */
  function interpret(ids) {
    const cs = ids.map(card), n = ids.length;
    const jk = cs.filter((c) => c.joker).length, reals = cs.filter((c) => !c.joker);
    const out = [];
    const mk = (o) => Object.assign({ cards: ids.slice(), n, joker: false, suits: reals.map((c) => c.s).sort() }, o);
    if (n === 1) { out.push(mk(cs[0].joker ? { type: 'single', rank: 16, top: 16, joker: true } : { type: 'single', rank: reals[0].r, top: reals[0].r })); return out; }
    if (!reals.length) { if (n === 2) out.push(mk({ type: 'group', rank: 16, top: 16, joker: true })); return out; }
    if (n <= 5 && reals.every((c) => c.r === reals[0].r)) out.push(mk({ type: 'group', rank: reals[0].r, top: reals[0].r }));
    if (n >= 3 && reals.every((c) => c.s === reals[0].s)) {
      const rs = reals.map((c) => c.r).sort((a, b) => a - b);
      if (new Set(rs).size === rs.length) {
        const gaps = rs[rs.length - 1] - rs[0] + 1 - rs.length;
        if (gaps <= jk) {
          const extra = jk - gaps;
          for (let lo = rs[0] - extra; lo <= rs[0]; lo++) {
            const hi = lo + n - 1;
            if (lo >= 3 && hi <= 15 && hi >= rs[rs.length - 1]) out.push(mk({ type: 'seq', rank: lo, top: hi, seqSuit: reals[0].s }));
          }
        }
      }
    }
    return out;
  }
  const isRev = (st) => st.rev !== st.jback;
  const multisetSub = (a, b) => { const m = {}; b.forEach((x) => { m[x] = (m[x] || 0) + 1; }); return a.every((x) => (m[x] = (m[x] || 0) - 1) >= 0); };
  /** can play beat the current top (null top = leading)? */
  function beats(st, play) {
    const top = st.top;
    if (!top) return true;
    if (play.type !== top.type || play.n !== top.n) return false;
    if (top.joker && top.type === 'single') return st.opt.spade3 && play.cards[0] === 'S03';
    if (top.joker) return false;
    if (st.lock && !multisetSub(play.suits, st.lock)) return false;
    if (play.joker) return true;
    const rev = isRev(st);
    return val(play.rank, rev) > val(top.rank, rev);
  }
  function combos(k, arr) {
    const out = [];
    const rec = (start, acc) => { if (acc.length === k) { out.push(acc.slice()); return; } for (let i = start; i < arr.length; i++) { acc.push(arr[i]); rec(i + 1, acc); acc.pop(); } };
    rec(0, []);
    return out;
  }
  /** every play that can be made from a hand (ignoring the table) */
  function allPlays(hand) {
    const plays = [];
    const jokers = hand.filter((id) => card(id).joker);
    const reals = hand.filter((id) => !card(id).joker);
    hand.forEach((id) => plays.push(...interpret([id])));
    const byRank = {};
    reals.forEach((id) => { (byRank[card(id).r] = byRank[card(id).r] || []).push(id); });
    for (const r in byRank) {
      const cs = byRank[r];
      for (let k = 2; k <= Math.min(5, cs.length + jokers.length); k++) {
        for (let j = 0; j <= Math.min(jokers.length, k - 1); j++) {
          if (k - j > cs.length || k - j < 1) continue;
          for (const sub of combos(k - j, cs)) plays.push(...interpret(sub.concat(jokers.slice(0, j))).filter((p) => p.type === 'group'));
        }
      }
    }
    if (jokers.length >= 2) plays.push(...interpret(jokers.slice(0, 2)));
    for (const s of SUITS) {
      const has = new Set(reals.filter((id) => card(id).s === s).map((id) => card(id).r));
      for (let lo = 3; lo <= 13; lo++) {
        for (let len = 3; lo + len - 1 <= 15; len++) {
          let need = 0;
          const ids = [];
          for (let r = lo; r < lo + len; r++) { if (has.has(r)) ids.push(s + String(r).padStart(2, '0')); else { need++; } }
          if (need > jokers.length) break;
          if (ids.length < 2) continue;
          const all = ids.concat(jokers.slice(0, need));
          const ps = interpret(all).filter((p) => p.type === 'seq' && p.rank === lo);
          plays.push(...ps);
        }
      }
    }
    // dedupe
    const seen = new Set();
    return plays.filter((p) => { const k = p.type + p.rank + ':' + p.cards.slice().sort().join(','); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function legalPlays(st, p) { if (st.opt.passLock && st.top && st.locked && st.locked.includes(p)) return []; return allPlays(st.hands[p]).filter((pl) => beats(st, pl)); }
  /** would finishing with this play be 反則上がり? */
  function forbiddenFinish(st, play) {
    if (!st.opt.hansoku) return false;
    const cs = play.cards.map(card);
    if (cs.some((c) => c.joker)) return true;
    if (st.opt.eight && cs.some((c) => c.r === 8)) return true;
    if (st.opt.spade3 && play.cards[0] === 'S03' && play.n === 1 && st.top && st.top.joker) return true;
    const strongest = isRev(st) ? 3 : 15;
    return cs.some((c) => c.r === strongest);
  }

  /* ---------------- engine ---------------- */
  const nextActive = (st, p) => { for (let i = 1; i <= 4; i++) { const q = (p + i) % 4; if (st.pos[q] < 0) return q; } return -1; };
  const activeCount = (st) => st.pos.filter((x) => x < 0).length;

  /** a new game: deal, find the leader. prev = positions of the previous game (or null) */
  function newGame(rng, opt, prev) {
    opt = Object.assign({}, DEFAULT_OPT, opt);
    const deck = makeDeck(opt.jokers);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const start = Math.floor(rng() * 4);
    const hands = [[], [], [], []];
    deck.forEach((id, i) => hands[(start + i) % 4].push(id));
    hands.forEach((h) => h.sort(normalSort));
    const st = {
      opt, hands, rev: false, jback: false, lock: null, top: null, trick: [], last: -1, passed: [], locked: [], turn: 0,
      pos: [-1, -1, -1, -1], nextTop: 0, nextBottom: 3, prev: prev || null, daifugo: prev ? prev.indexOf(0) : -1, over: false, log: [], flags: {}, pending: null,
    };
    st.turn = prev ? prev.indexOf(3) : hands.findIndex((h) => h.includes('D03'));
    return st;
  }
  /** card exchange: the poorer give their strongest automatically → returns [{ from, to, n }] (richer choose afterwards) */
  function exchangePlan(prev) {
    if (!prev) return [];
    const who = (pos) => prev.indexOf(pos);
    return [{ from: who(3), to: who(0), n: 2 }, { from: who(2), to: who(1), n: 1 }];
  }
  function strongest(hand, n) { return hand.slice().sort(normalSort).reverse().slice(0, n); }
  function give(st, from, to, ids) {
    ids.forEach((id) => { const i = st.hands[from].indexOf(id); if (i < 0) throw new Error('give: not in hand ' + id); st.hands[from].splice(i, 1); st.hands[to].push(id); });
    st.hands[to].sort(normalSort);
  }

  /** phase 1 of a play: cards leave the hand, the table changes. Returns events; st.pending tells what is still needed (7渡し / 10捨て) */
  function applyPlay(st, p, play) {
    const ev = [];
    const hand = st.hands[p];
    play.cards.forEach((id) => { const i = hand.indexOf(id); if (i < 0) throw new Error('play: not in hand ' + id + ' of ' + p); hand.splice(i, 1); });
    const prevTop = st.top;
    const reals = play.cards.map(card).filter((c) => !c.joker);
    const spade3 = !!(prevTop && prevTop.joker && prevTop.type === 'single' && play.cards[0] === 'S03');
    const forbidden = hand.length === 0 && forbiddenFinish(st, play);
    if (st.opt.shibari && !st.lock && prevTop && !prevTop.joker && !play.joker && play.suits.length === play.n && prevTop.suits.length === prevTop.n && play.suits.join() === prevTop.suits.join()) {
      st.lock = play.suits.slice(); ev.push({ type: 'lock', suits: st.lock });
    }
    st.top = play; st.trick.push({ p, play }); st.last = p; st.passed = [];
    st.log.push({ p, play });
    if (st.opt.revolution && ((play.type === 'group' && play.n >= 4) || (st.opt.seqRev && play.type === 'seq' && play.n >= 5))) { st.rev = !st.rev; ev.push({ type: 'revolution', on: st.rev }); }
    if (st.opt.jback && reals.some((c) => c.r === 11)) { st.jback = !st.jback; ev.push({ type: 'jback', on: st.jback }); }
    const eight = st.opt.eight && reals.some((c) => c.r === 8);
    if (eight) ev.push({ type: 'eight' });
    if (spade3) ev.push({ type: 'spade3' });
    const n7 = st.opt.seven ? reals.filter((c) => c.r === 7).length : 0;
    const n10 = st.opt.ten ? reals.filter((c) => c.r === 10).length : 0;
    st.pending = { p, eight, spade3, forbidden, give: Math.min(n7, hand.length), discard: 0, n10, giveTo: nextActive(st, p) };
    if (st.pending.give === 0) st.pending.discard = Math.min(n10, hand.length);
    return ev;
  }
  /** phase 2: 7渡し / 10捨て with the chosen cards, then 上がり / 都落ち / 8切り / the next turn. Returns events */
  function finishPlay(st, giveIds = [], discardIds = []) {
    const pd = st.pending, p = pd.p, ev = [];
    st.pending = null;
    if (giveIds.length) { give(st, p, pd.giveTo, giveIds); ev.push({ type: 'seven', to: pd.giveTo, ids: giveIds }); }
    const nd = Math.min(pd.n10, st.hands[p].length);
    if (nd && discardIds.length) { discardIds.slice(0, nd).forEach((id) => st.hands[p].splice(st.hands[p].indexOf(id), 1)); ev.push({ type: 'ten', ids: discardIds.slice(0, nd) }); }
    if (st.hands[p].length === 0) {
      if (pd.forbidden) { st.pos[p] = st.nextBottom--; ev.push({ type: 'finish', p, pos: st.pos[p], hansoku: true }); }
      else {
        const first = st.nextTop === 0;
        st.pos[p] = st.nextTop++;
        ev.push({ type: 'finish', p, pos: st.pos[p] });
        if (first && st.opt.miyako && st.daifugo >= 0 && st.daifugo !== p && st.pos[st.daifugo] < 0) {
          const d = st.daifugo;
          st.pos[d] = st.nextBottom--;
          st.hands[d] = [];
          ev.push({ type: 'miyako', p: d, pos: st.pos[d] });
        }
      }
    }
    if (activeCount(st) <= 1) {
      const q = st.pos.findIndex((x) => x < 0);
      if (q >= 0) { st.pos[q] = st.nextTop++; ev.push({ type: 'finish', p: q, pos: st.pos[q], last: true }); }
      st.over = true;
      ev.push({ type: 'over' });
      return ev;
    }
    if (pd.eight || pd.spade3) { clearTrick(st, st.pos[p] < 0 ? p : nextActive(st, p)); ev.push({ type: 'clear', reason: pd.eight ? 'eight' : 'spade3' }); return ev; }
    st.turn = nextActive(st, p);
    return ev;
  }
  function clearTrick(st, leader) {
    st.top = null; st.trick = []; st.lock = null; st.jback = false; st.passed = []; st.locked = []; st.turn = leader;
  }
  /** a pass; the trick clears when every other active player has passed since the last play */
  function pass(st, p) {
    const ev = [{ type: 'pass', p }];
    if (!st.passed.includes(p)) st.passed.push(p);
    if (st.opt.passLock && st.locked && !st.locked.includes(p)) st.locked.push(p);
    const others = [0, 1, 2, 3].filter((q) => st.pos[q] < 0 && q !== st.last);
    if (others.every((q) => st.passed.includes(q))) {
      const leader = st.pos[st.last] < 0 ? st.last : nextActive(st, st.last);
      clearTrick(st, leader);
      ev.push({ type: 'clear' });
    } else st.turn = nextActive(st, p);
    return ev;
  }

  /* ---------------- CPU ---------------- */
  const PERSONA = {
    hayate: { shed: 1.6, cost: 0.8, pass: 3, eight: 4, rev: 1, group: 0 },
    shion: { shed: 1.0, cost: 1.25, pass: -0.5, eight: 1.5, rev: 1, group: 0.3 },
    gonzo: { shed: 1.0, cost: 1.0, pass: 1, eight: 2, rev: 2.4, group: 1.4 },
    plain: { shed: 1.0, cost: 1.0, pass: 0, eight: 2, rev: 1, group: 0.3 },
  };
  const LEVEL = [{ noise: 7, randPass: 0.22, count: false }, { noise: 1.5, randPass: 0, count: false }, { noise: 0, randPass: 0, count: true }];
  /** rough number of plays needed to empty a hand (weak leftovers count more) */
  function movesEstimate(hand, rev) {
    const reals = hand.filter((id) => !card(id).joker);
    const byRank = {};
    reals.forEach((id) => { const r = card(id).r; byRank[r] = (byRank[r] || 0) + 1; });
    let m = 0;
    for (const r in byRank) m += 1 + Math.max(0, (6 - val(+r, rev)) / 10);
    for (const s of SUITS) {
      let run = 0;
      for (let r = 3; r <= 16; r++) {
        const single = r <= 15 && byRank[r] === 1 && reals.includes(s + String(r).padStart(2, '0'));
        if (single) run++; else { if (run >= 3) m -= (run - 1) * 0.9; run = 0; }
      }
    }
    return m;
  }
  const precious = (v) => (v >= 11 ? (v - 8) * 2.6 : v >= 9 ? (v - 8) * 1.2 : v * 0.18);
  /** cards nobody else has played or holds visibly — for counting (strong CPUs) */
  function unseenBeaters(st, p, play) {
    if (play.joker) return 0;
    const mine = new Set(st.hands[p]);
    const others = [0, 1, 2, 3].filter((q) => q !== p).flatMap((q) => st.hands[q]);
    if (play.type !== 'single') return others.length ? 1 : 0;
    const rev = isRev(st);
    return others.filter((id) => { const c = card(id); return !mine.has(id) && (c.joker || val(c.r, rev) > val(play.rank, rev)); }).length;
  }
  function scorePlay(st, p, play, persona, level, rng) {
    const P = PERSONA[persona] || PERSONA.plain, L = LEVEL[level] || LEVEL[1];
    const hand = st.hands[p].filter((id) => !play.cards.includes(id));
    let rev = isRev(st);
    let s = 0;
    const revolution = st.opt.revolution && ((play.type === 'group' && play.n >= 4) || (st.opt.seqRev && play.type === 'seq' && play.n >= 5));
    if (revolution) {
      const before = hand.reduce((a, id) => a + val(card(id).r, st.rev), 0), after = hand.reduce((a, id) => a + val(card(id).r, !st.rev), 0);
      s += ((after - before) / Math.max(1, hand.length)) * 2.2 * P.rev;
      rev = !rev;
    }
    if (!hand.length) return 1000;
    s -= movesEstimate(hand, rev) * 10;
    s -= play.cards.reduce((a, id) => a + precious(val(card(id).r, isRev(st))), 0) * P.cost * (hand.length <= 3 ? 0.35 : 1);
    s += play.n * P.shed;
    if (play.type !== 'single') s += P.group * play.n;
    const reals = play.cards.map(card).filter((c) => !c.joker);
    if (st.opt.eight && reals.some((c) => c.r === 8)) s += P.eight + (hand.length <= 4 ? 4 : 0);
    if (L.count && unseenBeaters(st, p, play) === 0) s += 4;
    // leading with something hard to follow when few cards left
    if (!st.top && hand.length <= 3) s += play.n * 1.5;
    if (L.noise) s += (rng() - 0.5) * L.noise * 2;
    return s;
  }
  /** the CPU's move: a play, or null to pass */
  function aiPlay(st, p, persona, level, rng) {
    const L = LEVEL[level] || LEVEL[1], P = PERSONA[persona] || PERSONA.plain;
    const plays = legalPlays(st, p);
    if (!plays.length) return null;
    // finish now when it is clean
    const clean = plays.filter((pl) => pl.n === st.hands[p].length && !forbiddenFinish(st, pl));
    if (clean.length) return clean[0];
    const scored = plays.map((pl) => ({ pl, s: scorePlay(st, p, pl, persona, level, rng) }))
      .filter((x) => !(st.hands[p].length - x.pl.n === 0 && forbiddenFinish(st, x.pl)) || plays.length === 1);
    if (!scored.length) return st.top ? null : plays[0];
    scored.sort((a, b) => b.s - a.s);
    if (!st.top) return scored[0].pl;
    if (L.randPass && rng() < L.randPass) return null;
    const rev = isRev(st);
    let passScore = -movesEstimate(st.hands[p], rev) * 10 - 3 - P.pass;
    const danger = [0, 1, 2, 3].some((q) => q !== p && st.pos[q] < 0 && st.hands[q].length <= 2);
    if (danger) passScore -= 8;
    return scored[0].s > passScore ? scored[0].pl : null;
  }
  /** which cards to hand over (exchange, 7渡し) or throw away (10捨て): the weakest loose ones */
  function aiChooseGive(st, p, n, level) {
    const hand = st.hands[p].slice();
    const rev = isRev(st);
    const byRank = {};
    hand.forEach((id) => { const r = card(id).r; byRank[r] = (byRank[r] || 0) + 1; });
    const cost = (id) => { const c = card(id); return val(c.r, rev) * 2 + (byRank[c.r] > 1 ? 6 : 0) + (c.joker ? 99 : 0) + (st.opt.eight && c.r === 8 ? 8 : 0) + (level === 0 ? Math.random() * 6 : 0); };
    return hand.sort((a, b) => cost(a) - cost(b)).slice(0, n);
  }

  /** a whole game with 4 CPUs (tests) → st */
  function simulate(rng, opt, prev, personas, levels) {
    const st = newGame(rng, opt, prev);
    for (const ex of exchangePlan(prev)) { give(st, ex.from, ex.to, strongest(st.hands[ex.from], ex.n)); }
    for (const ex of exchangePlan(prev)) { give(st, ex.to, ex.from, aiChooseGive(st, ex.to, ex.n, levels[ex.to])); }
    let guard = 0;
    while (!st.over && guard++ < 2000) {
      const p = st.turn;
      const pl = aiPlay(st, p, personas[p], levels[p], rng);
      if (!pl) { if (!st.top) throw new Error('pass while leading'); pass(st, p); continue; }
      if (!beats(st, pl)) throw new Error('illegal play by AI');
      applyPlay(st, p, pl);
      const pd = st.pending;
      finishPlay(st, pd.give ? aiChooseGive(st, p, pd.give, levels[p]) : [], pd.discard ? aiChooseGive(st, p, pd.discard, levels[p]) : []);
    }
    if (!st.over) throw new Error('game did not end');
    return st;
  }

  const playName = (pl) => {
    if (!pl) return '';
    if (pl.type === 'single') return pl.joker ? 'ジョーカー' : '1 枚';
    if (pl.type === 'group') return pl.joker && pl.rank === 16 ? 'ジョーカー 2 枚' : ['', '', 'ペア', '3 枚', '4 枚', '5 枚'][pl.n];
    return `階段（${pl.n} 枚）`;
  };

  return {
    SUITS, SUIT_JA, SUIT_MARK, RANK_LABEL, DEFAULT_OPT, POS_NAME, POS_POINTS, PERSONA,
    card, makeDeck, label, val, normalSort, interpret, beats, allPlays, legalPlays, forbiddenFinish, isRev,
    newGame, exchangePlan, strongest, give, applyPlay, finishPlay, pass, nextActive, activeCount,
    aiPlay, aiChooseGive, movesEstimate, simulate, playName,
  };
});
