/*
 * 宵月麻雀 — rules (pure functions; works in Node via require() and in the page as window.MJ).
 *
 * Tiles: kind 0–33 — 0–8 萬子 1–9, 9–17 筒子, 18–26 索子, 27–30 東南西北, 31–33 白發中.
 *        physical id 0–135 (kind = id >> 2); ids 16 / 52 / 88 are the red fives (赤ドラ) when the option is on.
 * Main entry points:
 *   shanten(counts, melds)        向聴数 (-1 = 和了形). Normal form, 七対子 and 国士無双 (closed only)
 *   waits(counts13, melds)        待ち牌 (kinds; a kind the hand already holds 4 of is not a wait)
 *   evaluate(hand, opts)          best 役・翻・符・点 over every decomposition and every reading of the winning tile
 *   payment(base, dealer, tsumo)  points paid
 */
(function (root, factory) {
  const M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M;
  else root.MJ = M;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RED_IDS = [16, 52, 88];
  const kindOf = (id) => id >> 2;
  const isHonor = (k) => k >= 27;
  const isTerminal = (k) => k < 27 && (k % 9 === 0 || k % 9 === 8);
  const isYaochu = (k) => k >= 27 || k % 9 === 0 || k % 9 === 8;
  const isDragon = (k) => k >= 31;
  const isWind = (k) => k >= 27 && k <= 30;
  const suitOf = (k) => (k < 27 ? (k / 9) | 0 : 3);
  const numOf = (k) => (k < 27 ? (k % 9) + 1 : 0);
  const YAOCHU = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  const GREEN = new Set([19, 20, 21, 23, 25, 32]);
  const KANJI_NUM = '一二三四五六七八九';
  const HONOR_CHARS = '東南西北白發中';
  const WIND_CHARS = '東南西北';
  const SUIT_CHARS = ['萬', '筒', '索'];

  /** 「5萬」「3筒」「東」 */
  function tileLabel(k) {
    if (k >= 27) return HONOR_CHARS[k - 27];
    return numOf(k) + SUIT_CHARS[suitOf(k)];
  }
  /** dora from its indicator: 9→1 in a suit, 東→南→西→北→東, 白→發→中→白 */
  function doraOf(k) {
    if (k < 27) return k - (k % 9) + (((k % 9) + 1) % 9);
    if (k < 31) return 27 + ((k - 27 + 1) % 4);
    return 31 + ((k - 31 + 1) % 3);
  }
  function counts(kinds) {
    const c = new Array(34).fill(0);
    for (const k of kinds) c[k]++;
    return c;
  }
  const countsFromIds = (ids) => counts(ids.map(kindOf));
  const isRed = (id, aka) => !!aka && RED_IDS.includes(id);

  /* ------------------------------------------------------------------ shanten */
  // Per-suit options memoised by the suit's count pattern: Pareto set of [mentsu, taatsu, pair(0|1)].
  const suitCache = new Map();
  function pareto(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      let dominated = false;
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const b = list[j];
        if (b[2] !== a[2]) continue;
        if (b[0] >= a[0] && b[0] + b[1] >= a[0] + a[1] && (b[0] > a[0] || b[0] + b[1] > a[0] + a[1] || j < i)) { dominated = true; break; }
      }
      if (!dominated) out.push(a);
    }
    return out;
  }
  function dfsSuit(a, i, m, t, p, out) {
    while (i < 9 && a[i] === 0) i++;
    if (i >= 9) { out.push([m, t, p]); return; }
    if (a[i] >= 3) { a[i] -= 3; dfsSuit(a, i, m + 1, t, p, out); a[i] += 3; }
    if (i <= 6 && a[i + 1] && a[i + 2]) { a[i]--; a[i + 1]--; a[i + 2]--; dfsSuit(a, i, m + 1, t, p, out); a[i]++; a[i + 1]++; a[i + 2]++; }
    if (a[i] >= 2) {
      a[i] -= 2;
      if (!p) dfsSuit(a, i, m, t, 1, out);
      dfsSuit(a, i, m, t + 1, p, out);
      a[i] += 2;
    }
    if (i <= 7 && a[i + 1]) { a[i]--; a[i + 1]--; dfsSuit(a, i, m, t + 1, p, out); a[i]++; a[i + 1]++; }
    if (i <= 6 && a[i + 2]) { a[i]--; a[i + 2]--; dfsSuit(a, i, m, t + 1, p, out); a[i]++; a[i + 2]++; }
    a[i]--; dfsSuit(a, i, m, t, p, out); a[i]++;
  }
  function suitOpts(c, off) {
    let key = 0;
    for (let i = 0; i < 9; i++) key = key * 5 + c[off + i];
    let r = suitCache.get(key);
    if (r) return r;
    const a = c.slice(off, off + 9);
    const out = [];
    dfsSuit(a, 0, 0, 0, 0, out);
    r = pareto(out);
    suitCache.set(key, r);
    return r;
  }
  function honorOpts(c) {
    let m = 0, pairs = 0;
    for (let k = 27; k < 34; k++) { if (c[k] >= 3) m++; else if (c[k] === 2) pairs++; }
    const r = [[m, pairs, 0]];
    if (pairs) r.push([m, pairs - 1, 1]);
    return r;
  }
  /** normal-form shanten; melds = number of called / kan sets */
  // dp[p * 5 + m] = the most taatsu reachable with m mentsu (capped at 4) and p pairs (0 | 1); -1 = unreachable
  const DP0 = [0, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  function shantenStd(c, melds = 0) {
    let dp = DP0;
    const groups = [suitOpts(c, 0), suitOpts(c, 9), suitOpts(c, 18), honorOpts(c)];
    for (let gi = 0; gi < 4; gi++) {
      const g = groups[gi];
      const nd = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
      for (let i = 0; i < 10; i++) {
        const t0 = dp[i];
        if (t0 < 0) continue;
        const p0 = i >= 5 ? 1 : 0, m0 = i % 5;
        for (let j = 0; j < g.length; j++) {
          const o = g[j];
          const p = p0 + o[2];
          if (p > 1) continue;
          const m = m0 + o[0] > 4 ? 4 : m0 + o[0];
          const t = t0 + o[1] > 4 ? 4 : t0 + o[1];
          const x = p * 5 + m;
          if (t > nd[x]) nd[x] = t;
        }
      }
      dp = nd;
    }
    const need = 4 - melds;
    let best = 8;
    for (let i = 0; i < 10; i++) {
      if (dp[i] < 0) continue;
      const p = i >= 5 ? 1 : 0;
      const m = Math.min(i % 5, need);
      const t = Math.min(dp[i], need - m);
      const s = 2 * (need - m) - t - p;
      if (s < best) best = s;
    }
    return best;
  }
  function shantenChiitoi(c) {
    let pairs = 0, kinds = 0;
    for (let k = 0; k < 34; k++) { if (c[k]) kinds++; if (c[k] >= 2) pairs++; }
    return 6 - pairs + Math.max(0, 7 - kinds);
  }
  function shantenKokushi(c) {
    let n = 0, pair = 0;
    for (const y of YAOCHU) if (c[y]) { n++; if (c[y] >= 2) pair = 1; }
    return 13 - n - pair;
  }
  /** shanten over every form (七対子・国士無双 only for a hand without melds) */
  function shanten(c, melds = 0) {
    const s = shantenStd(c, melds);
    if (melds) return s;
    return Math.min(s, shantenChiitoi(c), shantenKokushi(c));
  }
  const isAgari = (c, melds = 0) => shanten(c, melds) === -1;

  /** waiting kinds of a 13-tile (3n+1) hand */
  function waits(c, melds = 0) {
    const w = [];
    for (let k = 0; k < 34; k++) {
      if (c[k] >= 4) continue;
      c[k]++;
      if (shanten(c, melds) === -1) w.push(k);
      c[k]--;
    }
    return w;
  }
  /** 捨て牌フリテン: a wait is among the player's own discards (kinds, called-away tiles included) */
  function isDiscardFuriten(waitKinds, discardKinds) {
    for (const k of waitKinds) if (discardKinds.has ? discardKinds.has(k) : discardKinds.includes(k)) return true;
    return false;
  }

  /* ------------------------------------------------------------------ decomposition */
  /** every split of a complete 3n+2 count into pair + sets: [{ pair, sets: [{ t: 's'|'k', k }] }] */
  function decompose(c) {
    const res = [];
    const sets = [];
    const rec = (i) => {
      while (i < 34 && !c[i]) i++;
      if (i === 34) { res.push(sets.slice()); return; }
      if (c[i] >= 3) { c[i] -= 3; sets.push({ t: 'k', k: i }); rec(i); sets.pop(); c[i] += 3; }
      if (i < 27 && i % 9 <= 6 && c[i + 1] && c[i + 2]) {
        c[i]--; c[i + 1]--; c[i + 2]--; sets.push({ t: 's', k: i }); rec(i); sets.pop(); c[i]++; c[i + 1]++; c[i + 2]++;
      }
    };
    const out = [];
    for (let p = 0; p < 34; p++) {
      if (c[p] < 2) continue;
      c[p] -= 2;
      const before = res.length;
      rec(0);
      for (let j = before; j < res.length; j++) out.push({ pair: p, sets: res[j] });
      c[p] += 2;
    }
    return out;
  }
  function isChiitoiC(c) { let pairs = 0; for (let k = 0; k < 34; k++) { if (c[k] === 2) pairs++; else if (c[k]) return false; } return pairs === 7; }
  function isKokushiC(c) { let n = 0, pair = 0; for (const y of YAOCHU) { if (!c[y]) return false; n++; if (c[y] === 2) pair++; } let total = 0; for (let k = 0; k < 34; k++) total += c[k]; return n === 13 && pair === 1 && total === 14; }

  /* ------------------------------------------------------------------ scoring */
  const DEFAULT_OPTS = { kazoe: true, kiriage: false, double: false, renpuu: 4 };
  const up100 = (x) => Math.ceil(x / 100) * 100;
  function basePoints(han, fu, o) {
    if (han >= 13) return o.kazoe ? 8000 : 6000;
    if (han >= 11) return 6000;
    if (han >= 8) return 4000;
    if (han >= 6) return 3000;
    if (han >= 5) return 2000;
    if (o.kiriage && ((han === 4 && fu === 30) || (han === 3 && fu === 60))) return 2000;
    return Math.min(2000, fu * Math.pow(2, han + 2));
  }
  /** what is paid: ron → { ron }, dealer tsumo → { all } (each), other tsumo → { dealer, other } (without 本場) */
  function payment(base, dealer, tsumo) {
    if (!tsumo) return { ron: up100(base * (dealer ? 6 : 4)) };
    if (dealer) return { all: up100(base * 2) };
    return { dealer: up100(base * 2), other: up100(base) };
  }
  function limitLabel(base, yakumanMult) {
    if (yakumanMult) return yakumanMult === 1 ? '役満' : yakumanMult === 2 ? 'ダブル役満' : yakumanMult === 3 ? 'トリプル役満' : `${yakumanMult}倍役満`;
    if (base >= 8000) return '数え役満';
    if (base >= 6000) return '三倍満';
    if (base >= 4000) return '倍満';
    if (base >= 3000) return '跳満';
    if (base >= 2000) return '満貫';
    return '';
  }

  /**
   * hand = {
   *   closed: [kinds] concealed tiles including the winning tile (kans are in melds),
   *   melds: [{ type: 'chi'|'pon'|'minkan'|'ankan'|'kakan', kinds: [k, …] }],
   *   win: kind of the winning tile, tsumo: bool,
   *   seat: 自風 0–3 (0 = 東 = 親), round: 場風 0–3,
   *   riichi: 0 | 1 | 2 (ダブル立直), ippatsu, haitei, houtei, rinshan, chankan, tenhou, chiihou: bools,
   *   dora: [indicator kinds], ura: [indicator kinds] (counted only with riichi), aka: number of red fives,
   * }
   * Returns the best reading { yaku: [[name, han]], yakuman, han, fu, base, label, points, dealer } or null (not a win / no 役).
   */
  function evaluate(h, opts) {
    const o = Object.assign({}, DEFAULT_OPTS, opts || {});
    const melds = h.melds || [];
    const c = counts(h.closed);
    const menzen = melds.every((m) => m.type === 'ankan');
    const dealer = h.seat === 0;
    const allKinds = h.closed.slice();
    for (const m of melds) allKinds.push(...m.kinds);
    const allC = counts(allKinds);
    let doraN = 0;
    for (const ind of h.dora || []) doraN += allC[doraOf(ind)];
    let uraN = 0;
    if (h.riichi) for (const ind of h.ura || []) uraN += allC[doraOf(ind)];
    const akaN = h.aka || 0;
    const kanN = melds.filter((m) => m.type === 'minkan' || m.type === 'ankan' || m.type === 'kakan').length;
    const allHonor = allKinds.every(isHonor);
    const allTerm = allKinds.every(isTerminal);
    const allYaochu = allKinds.every(isYaochu);
    const noYaochu = !allKinds.some(isYaochu);
    const allGreen = allKinds.every((k) => GREEN.has(k));
    const suits = new Set(allKinds.filter((k) => k < 27).map(suitOf));
    const hasHonor = allKinds.some(isHonor);
    const candidates = [];

    // situational 役 shared by every form
    const sit = [];
    if (h.riichi === 2) sit.push(['ダブル立直', 2]);
    else if (h.riichi) sit.push(['立直', 1]);
    if (h.riichi && h.ippatsu) sit.push(['一発', 1]);
    if (menzen && h.tsumo) sit.push(['門前清自摸和', 1]);
    if (h.rinshan) sit.push(['嶺上開花', 1]);
    if (h.chankan) sit.push(['槍槓', 1]);
    if (h.haitei && h.tsumo && !h.rinshan) sit.push(['海底摸月', 1]);
    if (h.houtei && !h.tsumo) sit.push(['河底撈魚', 1]);
    const sitYakuman = [];
    if (h.tenhou) sitYakuman.push(['天和', 1]);
    if (h.chiihou) sitYakuman.push(['地和', 1]);
    const colorYaku = () => {
      const r = [];
      if (suits.size === 1 && !hasHonor) r.push(['清一色', menzen ? 6 : 5]);
      else if (suits.size === 1 && hasHonor) r.push(['混一色', menzen ? 3 : 2]);
      return r;
    };

    const finish = (yaku, yakuman, fu) => {
      if (yakuman.length) {
        const mult = yakuman.reduce((s, y) => s + y[1], 0);
        const base = 8000 * mult;
        return { yaku: yakuman.map(([n, m]) => [n, m * 13]), yakuman: mult, han: 13 * mult, fu, base, label: limitLabel(base, mult) };
      }
      let han = yaku.reduce((s, y) => s + y[1], 0);
      if (han <= 0) return null;
      const list = yaku.slice();
      if (doraN) list.push(['ドラ', doraN]);
      if (akaN) list.push(['赤ドラ', akaN]);
      if (uraN) list.push(['裏ドラ', uraN]);
      han += doraN + akaN + uraN;
      const base = basePoints(han, fu, o);
      return { yaku: list, yakuman: 0, han, fu, base, label: limitLabel(base, 0) };
    };

    // 国士無双
    if (!melds.length && isKokushiC(c)) {
      const ym = sitYakuman.slice();
      if (c[h.win] === 2) ym.push(['国士無双十三面待ち', o.double ? 2 : 1]);
      else ym.push(['国士無双', 1]);
      candidates.push(finish([], ym, 0));
    }
    // 七対子
    if (!melds.length && isChiitoiC(c)) {
      const ym = sitYakuman.slice();
      if (allHonor) ym.push(['字一色', 1]);
      if (ym.length) candidates.push(finish([], ym, 25));
      else {
        const y = sit.slice();
        y.push(['七対子', 2]);
        if (noYaochu) y.push(['断么九', 1]);
        if (allYaochu) y.push(['混老頭', 2]);
        y.push(...colorYaku());
        candidates.push(finish(y, [], 25));
      }
    }
    // normal form: every decomposition × every reading of the winning tile
    const nSets = 4 - melds.length;
    for (const dec of decompose(c.slice())) {
      if (dec.sets.length !== nSets) continue;
      const readings = [];
      if (dec.pair === h.win) readings.push({ idx: -1, wait: 'tanki' });
      dec.sets.forEach((s, i) => {
        if (s.t === 'k' && s.k === h.win) readings.push({ idx: i, wait: 'shanpon' });
        if (s.t === 's' && h.win >= s.k && h.win <= s.k + 2) {
          const pos = h.win - s.k, n = s.k % 9;
          let wait = 'ryanmen';
          if (pos === 1) wait = 'kanchan';
          else if ((pos === 2 && n === 0) || (pos === 0 && n === 6)) wait = 'penchan';
          readings.push({ idx: i, wait });
        }
      });
      const seen = new Set();
      for (const rd of readings) {
        const sig = rd.wait + ':' + (rd.idx >= 0 ? dec.sets[rd.idx].t + dec.sets[rd.idx].k : 'p');
        if (seen.has(sig)) continue;
        seen.add(sig);
        candidates.push(evalStd(dec, rd));
      }
    }

    function evalStd(dec, rd) {
      const sets = dec.sets.map((s, i) => ({ t: s.t, k: s.k, open: rd.wait === 'shanpon' && i === rd.idx && !h.tsumo, kan: false }));
      for (const m of melds) {
        if (m.type === 'chi') sets.push({ t: 's', k: Math.min(...m.kinds), open: true, kan: false });
        else sets.push({ t: 'k', k: m.kinds[0], open: m.type !== 'ankan', kan: m.type !== 'pon' });
      }
      const pair = dec.pair;
      const seatW = 27 + h.seat, roundW = 27 + h.round;
      const kous = sets.filter((s) => s.t === 'k');
      const shun = sets.filter((s) => s.t === 's');
      const ankou = kous.filter((s) => !s.open).length;
      const pairYakuhai = isDragon(pair) || pair === seatW || pair === roundW;

      // 役満
      const ym = sitYakuman.slice();
      if (ankou === 4) ym.push(rd.wait === 'tanki' ? ['四暗刻単騎', o.double ? 2 : 1] : ['四暗刻', 1]);
      if (kous.filter((s) => isDragon(s.k)).length === 3) ym.push(['大三元', 1]);
      const windK = kous.filter((s) => isWind(s.k)).length;
      if (windK === 4) ym.push(['大四喜', o.double ? 2 : 1]);
      else if (windK === 3 && isWind(pair)) ym.push(['小四喜', 1]);
      if (allHonor) ym.push(['字一色', 1]);
      if (allGreen) ym.push(['緑一色', 1]);
      if (allTerm) ym.push(['清老頭', 1]);
      if (kanN === 4) ym.push(['四槓子', 1]);
      if (!melds.length && suits.size === 1 && !hasHonor) {
        const s = suitOf(h.win), a = c.slice(s * 9, s * 9 + 9);
        if (a[0] >= 3 && a[8] >= 3 && a.slice(1, 8).every((x) => x >= 1)) {
          a[h.win % 9]--;
          const pure = a[0] === 3 && a[8] === 3 && a.slice(1, 8).every((x) => x === 1);
          ym.push(pure ? ['純正九蓮宝燈', o.double ? 2 : 1] : ['九蓮宝燈', 1]);
        }
      }
      if (ym.length) return finish([], ym, 0);

      const y = sit.slice();
      const pinfu = menzen && shun.length === 4 && !pairYakuhai && rd.wait === 'ryanmen';
      if (pinfu) y.push(['平和', 1]);
      if (noYaochu) y.push(['断么九', 1]);
      if (menzen) {
        const cnt = {};
        for (const s of shun) cnt[s.k] = (cnt[s.k] || 0) + 1;
        let peko = 0;
        for (const k in cnt) peko += Math.floor(cnt[k] / 2);
        if (peko >= 2) y.push(['二盃口', 3]);
        else if (peko === 1) y.push(['一盃口', 1]);
      }
      for (const s of kous) {
        if (s.k === 31) y.push(['役牌 白', 1]);
        if (s.k === 32) y.push(['役牌 發', 1]);
        if (s.k === 33) y.push(['役牌 中', 1]);
        if (s.k === seatW) y.push(['自風 ' + WIND_CHARS[h.seat], 1]);
        if (s.k === roundW) y.push(['場風 ' + WIND_CHARS[h.round], 1]);
      }
      for (let n = 0; n < 7; n++) if ([0, 1, 2].every((su) => shun.some((s) => s.k === su * 9 + n))) { y.push(['三色同順', menzen ? 2 : 1]); break; }
      for (let n = 0; n < 9; n++) if ([0, 1, 2].every((su) => kous.some((s) => s.k === su * 9 + n))) { y.push(['三色同刻', 2]); break; }
      for (let su = 0; su < 3; su++) if ([0, 3, 6].every((n) => shun.some((s) => s.k === su * 9 + n))) { y.push(['一気通貫', menzen ? 2 : 1]); break; }
      const setYao = (s) => (s.t === 'k' ? isYaochu(s.k) : s.k % 9 === 0 || s.k % 9 === 6);
      if (shun.length && sets.every(setYao) && isYaochu(pair)) {
        if (!hasHonor) y.push(['純全帯么九', menzen ? 3 : 2]);
        else y.push(['混全帯么九', menzen ? 2 : 1]);
      }
      if (kous.length === 4) y.push(['対々和', 2]);
      if (ankou === 3) y.push(['三暗刻', 2]);
      if (kanN === 3) y.push(['三槓子', 2]);
      if (kous.filter((s) => isDragon(s.k)).length === 2 && isDragon(pair)) y.push(['小三元', 2]);
      if (allYaochu) y.push(['混老頭', 2]);
      y.push(...colorYaku());

      // 符
      let fu;
      if (pinfu) fu = h.tsumo ? 20 : 30;
      else {
        fu = 20;
        if (menzen && !h.tsumo) fu += 10;
        if (h.tsumo) fu += 2;
        for (const s of kous) { let f = 2; if (isYaochu(s.k)) f *= 2; if (!s.open) f *= 2; if (s.kan) f *= 4; fu += f; }
        let pf = 0;
        if (isDragon(pair)) pf += 2;
        if (pair === seatW) pf += 2;
        if (pair === roundW) pf += 2;
        fu += Math.min(pf, o.renpuu);
        if (rd.wait === 'kanchan' || rd.wait === 'penchan' || rd.wait === 'tanki') fu += 2;
        if (!menzen && fu === 20) fu = 30;
        fu = Math.ceil(fu / 10) * 10;
      }
      const r = finish(y, [], fu);
      if (r) { r.wait = rd.wait; r.pinfu = pinfu; }
      return r;
    }

    let best = null;
    for (const r of candidates) {
      if (!r) continue;
      if (!best || r.base > best.base || (r.base === best.base && (r.han > best.han || (r.han === best.han && r.fu > best.fu)))) best = r;
    }
    if (best) { best.dealer = dealer; best.points = payment(best.base, dealer, !!h.tsumo); best.total = best.points.ron || (best.points.all ? best.points.all * 3 : best.points.dealer + best.points.other * 2); }
    return best;
  }

  /** the 役 list for the help screen: [name, 門前の翻, 鳴きの翻 (0 = 門前のみ), 説明] */
  const YAKU_TABLE = [
    ['立直', 1, 0, '門前でテンパイし、1000 点を出して宣言'],
    ['一発', 1, 0, '立直から 1 巡以内（鳴きが入らないうち）に和了'],
    ['門前清自摸和', 1, 0, '門前でツモ和了'],
    ['平和', 1, 0, '4 面子すべて順子・雀頭が役牌でない・両面待ち'],
    ['断么九', 1, 1, '2〜8 の数牌だけ（喰いタンあり）'],
    ['一盃口', 1, 0, '同じ順子が 2 組'],
    ['役牌（白・發・中・場風・自風）', 1, 1, 'その牌の刻子・槓子。連風牌は 2 翻'],
    ['嶺上開花', 1, 1, 'カンの後の嶺上牌で和了'],
    ['槍槓', 1, 1, '他家の加槓の牌でロン'],
    ['海底摸月', 1, 1, '最後のツモ牌で和了'],
    ['河底撈魚', 1, 1, '最後の捨て牌でロン'],
    ['ダブル立直', 2, 0, '鳴きのない第一打で立直'],
    ['三色同順', 2, 1, '萬子・筒子・索子で同じ数の順子'],
    ['三色同刻', 2, 2, '萬子・筒子・索子で同じ数の刻子'],
    ['一気通貫', 2, 1, '同じ色で 123・456・789'],
    ['混全帯么九', 2, 1, 'すべての面子と雀頭に么九牌（字牌を含む）'],
    ['七対子', 2, 0, '7 種類の対子（25 符）'],
    ['対々和', 2, 2, '4 面子すべて刻子・槓子'],
    ['三暗刻', 2, 2, '暗刻（暗槓を含む）が 3 組'],
    ['三槓子', 2, 2, '槓子が 3 組'],
    ['小三元', 2, 2, '三元牌の刻子 2 組と雀頭'],
    ['混老頭', 2, 2, '么九牌だけ'],
    ['二盃口', 3, 0, '一盃口が 2 組'],
    ['純全帯么九', 3, 2, 'すべての面子と雀頭に 1・9 の数牌（字牌なし）'],
    ['混一色', 3, 2, '1 種類の数牌と字牌だけ'],
    ['清一色', 6, 5, '1 種類の数牌だけ'],
  ];
  const YAKUMAN_TABLE = [
    ['天和', '親の配牌で和了'], ['地和', '子の最初のツモで和了（それまで鳴きなし）'], ['国士無双', '么九牌 13 種をすべてそろえ、どれか 1 つが対子'],
    ['四暗刻', '暗刻 4 組（ロンはシャンポン待ちを除く）'], ['大三元', '白・發・中の刻子 3 組'], ['字一色', '字牌だけ'], ['緑一色', '2・3・4・6・8 索と發だけ'],
    ['清老頭', '1・9 の数牌だけ'], ['小四喜', '風牌の刻子 3 組と風牌の雀頭'], ['大四喜', '風牌の刻子 4 組'], ['四槓子', '槓子 4 組'], ['九蓮宝燈', '門前の清一色で 1112345678999＋1 枚'],
  ];

  return {
    RED_IDS, YAOCHU, KANJI_NUM, HONOR_CHARS, WIND_CHARS, SUIT_CHARS, YAKU_TABLE, YAKUMAN_TABLE, DEFAULT_OPTS,
    kindOf, isHonor, isTerminal, isYaochu, isDragon, isWind, suitOf, numOf, tileLabel, doraOf, counts, countsFromIds, isRed,
    shanten, shantenStd, shantenChiitoi, shantenKokushi, isAgari, waits, isDiscardFuriten, decompose, isChiitoiC, isKokushiC,
    evaluate, payment, basePoints, limitLabel, up100,
  };
});
