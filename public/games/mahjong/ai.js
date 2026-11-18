/*
 * 宵月麻雀 — CPU players (pure; Node + browser as window.MJAI). Synchronous and fast (a few ms per decision).
 *
 *   MJAI.self(game, seat, opts, cfg) → action        cfg = { level: 0 やさしい | 1 ふつう | 2 つよい, style: { attack, call, dama } }
 *   MJAI.call(game, seat, info, cfg) → action
 * Discards: shanten → 受け入れ枚数 (tiles still unseen) → value (dora, 役牌, plan), with a "plan" for open hands
 * (役牌 / 断么九 / 混一色 / 対々和) so calls never leave the hand without 役. Defence after a riichi: 現物 → 筋 → 字牌.
 */
(function (root, factory) {
  const MJ = typeof module === 'object' && module.exports ? require('./rules.js') : root.MJ;
  const M = factory(MJ);
  if (typeof module === 'object' && module.exports) module.exports = M;
  else root.MJAI = M;
})(typeof self !== 'undefined' ? self : this, function (MJ) {
  'use strict';
  const { kindOf, countsFromIds, isYaochu, isDragon, suitOf, RED_IDS } = MJ;

  const STYLE = { attack: 0.5, call: 0.5, dama: 0.3 };
  let rand = Math.random;

  /** tiles this seat can see: own hand, every river, every meld, the dora indicators */
  function visible(game, seat) {
    const v = new Array(34).fill(0);
    for (const id of game.players[seat].hand) v[kindOf(id)]++;
    for (const p of game.players) {
      for (const r of p.river) if (!r.called) v[kindOf(r.id)]++;
      for (const m of p.melds) for (const id of m.tiles) v[kindOf(id)]++;
    }
    for (const id of game.doraIndicators()) v[kindOf(id)]++;
    return v;
  }
  const yakuhaiKind = (game, seat, k) => isDragon(k) || k === 27 + game.seatWind(seat) || k === 27 + game.roundWind;

  /* ---------------- plans for open hands ---------------- */
  function toitoiShanten(c, nm) {
    let k3 = 0, k2 = 0;
    for (let k = 0; k < 34; k++) { if (c[k] >= 3) k3++; else if (c[k] === 2) k2++; }
    const m = Math.min(4, nm + k3);
    const p = k2 > 0 ? 1 : 0;
    const t = Math.min(k2 - p, 4 - m);
    return 8 - 2 * m - Math.max(0, t) - p;
  }
  function shantenPlan(c, nm, plan) {
    if (!plan || plan.type === 'free') return MJ.shanten(c, nm);
    if (plan.type === 'toitoi') return toitoiShanten(c, nm);
    const d = c.slice();
    if (plan.type === 'tanyao') for (const y of MJ.YAOCHU) d[y] = 0;
    if (plan.type === 'honitsu') for (let k = 0; k < 27; k++) if (suitOf(k) !== plan.suit) d[k] = 0;
    return MJ.shantenStd(d, nm);
  }
  /** the 役 an open (or about to be open) hand can still make. melds: [{ type, kinds }] */
  function planFor(game, seat, c, melds) {
    if (!melds.some((m) => m.type !== 'ankan')) return null; // closed: riichi / tsumo always possible
    const kinds = [];
    for (const m of melds) kinds.push(...m.kinds);
    if (melds.some((m) => m.type !== 'chi' && yakuhaiKind(game, seat, m.kinds[0]))) return { type: 'free', name: '役牌' };
    const plans = [];
    if (!kinds.some(isYaochu)) {
      let y = 0;
      for (const k of MJ.YAOCHU) y += c[k];
      if (y <= 4) plans.push({ type: 'tanyao', name: '断么九' });
    }
    const meldSuits = new Set(kinds.filter((k) => k < 27).map(suitOf));
    if (meldSuits.size <= 1) {
      const per = [0, 0, 0];
      for (let k = 0; k < 27; k++) per[suitOf(k)] += c[k];
      let honor = 0;
      for (let k = 27; k < 34; k++) honor += c[k];
      const suit = meldSuits.size ? [...meldSuits][0] : per.indexOf(Math.max(...per));
      const other = per.reduce((s, x, i) => (i === suit ? s : s + x), 0);
      if (other <= 3 && per[suit] + honor >= 6) plans.push({ type: 'honitsu', suit, name: '混一色' });
    }
    if (melds.every((m) => m.type !== 'chi')) {
      let pairs = 0;
      for (let k = 0; k < 34; k++) if (c[k] >= 2) pairs++;
      if (pairs + melds.length >= 4) plans.push({ type: 'toitoi', name: '対々和' });
    }
    for (let k = 27; k < 34; k++) if (c[k] >= 2 && yakuhaiKind(game, seat, k)) { plans.push({ type: 'free', name: '役牌後付け', atozuke: true }); break; }
    if (!plans.length) return { type: 'none', name: '役なし' };
    let best = null, bs = 99;
    for (const pl of plans) { const s = shantenPlan(c, melds.length, pl) + (pl.atozuke ? 1 : 0); if (s < bs) { bs = s; best = pl; } }
    return best;
  }
  const meldKinds = (p) => p.melds.map((m) => ({ type: m.type, kinds: m.tiles.map(kindOf) }));

  /* ---------------- discard evaluation ---------------- */
  function evalDiscards(game, seat, allowed, cfg, plan) {
    const p = game.players[seat];
    const c = countsFromIds(p.hand);
    const nm = p.melds.length;
    const vis = visible(game, seat);
    const doraKinds = game.doraIndicators().map((id) => MJ.doraOf(kindOf(id)));
    const kinds = [...new Set(allowed.map(kindOf))];
    const out = [];
    const pl = plan && plan.type !== 'none' ? plan : null;
    for (const k of kinds) {
      c[k]--;
      const s = shantenPlan(c, nm, pl);
      let uke = 0;
      if (cfg.level > 0) {
        for (let t = 0; t < 34; t++) {
          const left = 4 - vis[t];
          if (left <= 0) continue;
          c[t]++;
          if (shantenPlan(c, nm, pl) < s) uke += left;
          c[t]--;
        }
      }
      c[k]++;
      // value of keeping k (higher = keep)
      let keep = 0;
      for (const d of doraKinds) if (d === k) keep += 6;
      if (k >= 27) {
        keep += yakuhaiKind(game, seat, k) ? (c[k] >= 2 ? 6 : 1.5) : (c[k] >= 2 ? 2 : -1.5);
        if (vis[k] >= 3 && c[k] === 1) keep -= 2;
      } else {
        const n = k % 9;
        keep += n === 0 || n === 8 ? 0 : n === 1 || n === 7 ? 1 : 2;
        let near = 0;
        for (let d = -2; d <= 2; d++) if (d && n + d >= 0 && n + d <= 8) near += c[k + d] ? (Math.abs(d) === 1 ? 2 : 1) : 0;
        keep += near * 0.6;
        if (pl && pl.type === 'tanyao' && isYaochu(k)) keep -= 8;
        if (pl && pl.type === 'honitsu' && suitOf(k) !== pl.suit) keep -= 8;
      }
      out.push({ k, s, uke, keep });
    }
    return out;
  }
  const evalScore = (e, level) => -e.s * 1000 + (level > 0 ? e.uke * 4 : 0) + e.keep * (level > 1 ? 1.5 : 1);

  /* ---------------- defence ---------------- */
  function threats(game, seat, cfg) {
    const t = [];
    for (const q of game.players) {
      if (q.seat === seat) continue;
      if (q.riichi) t.push({ seat: q.seat, w: 1 });
      else if (cfg.level >= 2) {
        const open = q.melds.filter((m) => m.type !== 'ankan').length;
        if (open >= 3) t.push({ seat: q.seat, w: 0.7 });
        else if (open >= 2 && game.liveLeft() < 30) t.push({ seat: q.seat, w: 0.4 });
      }
    }
    return t;
  }
  function danger(game, seat, k, opp, vis, cfg) {
    const op = game.players[opp];
    if (op.discardKinds.has(k) || op.afterRiichiSafe.has(k)) return 0;
    if (k >= 27) {
      const left = 4 - vis[k];
      if (left <= 0) return 0;
      const yak = isDragon(k) || k === 27 + game.seatWind(opp) || k === 27 + game.roundWind;
      return left === 1 ? 1 : left === 2 ? (yak ? 4 : 3) : yak ? 7 : 5;
    }
    const n = k % 9;
    const has = (d) => n + d >= 0 && n + d <= 8 && op.discardKinds.has(k + d);
    let d;
    if (n === 0 || n === 8) d = has(n === 0 ? 3 : -3) ? 2 : 6;
    else if (n === 1 || n === 7) d = has(n === 1 ? 3 : -3) ? 3 : 8;
    else if (n === 2 || n === 6) d = has(n === 2 ? 3 : -3) ? 4 : 9;
    else { const a = has(-3), b = has(3); d = a && b ? 4 : a || b ? 7 : 11; }
    if (cfg.level >= 2) {
      // 壁: every copy of the inner neighbour is visible → no 両面 through it
      if ((n <= 2 && vis[k + 1] >= 4) || (n >= 6 && vis[k - 1] >= 4)) d *= 0.5;
      if (vis[k] >= 3) d *= 0.6;
    }
    return d;
  }
  function dangerOf(game, seat, k, ths, vis, cfg) {
    let d = 0;
    for (const t of ths) d = Math.max(d, danger(game, seat, k, t.seat, vis, cfg) * t.w);
    return d;
  }
  function handValue(game, seat) {
    const p = game.players[seat];
    const doraKinds = game.doraIndicators().map((id) => MJ.doraOf(kindOf(id)));
    let v = 0;
    const all = p.hand.slice();
    for (const m of p.melds) all.push(...m.tiles);
    for (const id of all) { if (doraKinds.includes(kindOf(id))) v++; if (game.o.aka && RED_IDS.includes(id)) v++; }
    return v;
  }

  /* ---------------- decisions ---------------- */
  function chooseDiscard(game, seat, opts, cfg) {
    const p = game.players[seat];
    const style = Object.assign({}, STYLE, cfg.style || {});
    const plan = planFor(game, seat, countsFromIds(p.hand), meldKinds(p));
    const ev = evalDiscards(game, seat, opts.discards, cfg, plan);
    const vis = visible(game, seat);
    const ths = cfg.level > 0 ? threats(game, seat, cfg) : [];
    let pickK;
    if (cfg.level === 0) {
      const minS = Math.min(...ev.map((e) => e.s));
      const pool = ev.filter((e) => e.s === minS);
      pool.sort((a, b) => a.keep - b.keep);
      pickK = (rand() < 0.75 ? pool[0] : pool[Math.floor(rand() * pool.length)]).k;
    } else {
      for (const e of ev) e.score = evalScore(e, cfg.level);
      ev.sort((a, b) => b.score - a.score);
      const best = ev[0];
      if (ths.length) {
        const value = handValue(game, seat) + (p.riichi ? 1 : 0);
        const late = game.liveLeft() < 24;
        let fold;
        if (best.s >= 2) fold = true;
        else if (best.s === 1) fold = cfg.level < 2 ? true : !(value >= 2 && !late && style.attack > 0.4) && !(style.attack >= 0.8 && value >= 1);
        else fold = cfg.level >= 2 && best.uke <= 2 && value < 2 && style.attack < 0.8;
        for (const e of ev) e.danger = dangerOf(game, seat, e.k, ths, vis, cfg);
        if (fold) {
          ev.sort((a, b) => a.danger - b.danger || b.score - a.score);
        } else {
          const w = cfg.level >= 2 ? 30 : 10;
          ev.sort((a, b) => (b.score - b.danger * w * (b.s === best.s ? 1 : 0)) - (a.score - a.danger * w * (a.s === best.s ? 1 : 0)));
          // never break tenpai just to be safe while pushing
          if (best.s === 0 && ev[0].s > 0) ev.sort((a, b) => a.s - b.s || a.danger - b.danger);
        }
      }
      pickK = ev[0].k;
    }
    // physical tile: the drawn one when it is that kind, plain before red
    const cands = opts.discards.filter((id) => kindOf(id) === pickK);
    if (p.drawn != null && cands.includes(p.drawn) && !(game.o.aka && RED_IDS.includes(p.drawn) && cands.length > 1)) return p.drawn;
    cands.sort((a, b) => (RED_IDS.includes(a) ? 1 : 0) - (RED_IDS.includes(b) ? 1 : 0));
    return cands[0];
  }

  function riichiChoice(game, seat, opts, cfg) {
    const p = game.players[seat];
    const vis = visible(game, seat);
    let best = null;
    for (const k of opts.riichi) {
      const c = countsFromIds(p.hand);
      c[k]--;
      const w = MJ.waits(c, p.melds.length);
      let left = 0;
      for (const t of w) left += Math.max(0, 4 - vis[t]);
      const furiten = w.some((t) => p.discardKinds.has(t) || t === k);
      const score = left * 10 - (furiten ? 25 : 0) + (cfg.level > 0 ? -dangerOf(game, seat, k, threats(game, seat, cfg), vis, cfg) * 3 : 0);
      if (!best || score > best.score) best = { k, left, waits: w, furiten, score, c };
    }
    return best;
  }

  function self(game, seat, opts, cfg) {
    cfg = cfg || { level: 1 };
    const p = game.players[seat];
    const style = Object.assign({}, STYLE, cfg.style || {});
    if (opts.tsumo) return { type: 'tsumo' };
    if (opts.kyuushu) {
      const c = countsFromIds(p.hand);
      const n = MJ.YAOCHU.filter((k) => c[k]).length;
      if (n < 11 || cfg.level === 0) return { type: 'kyuushu' };
    }
    const ths = threats(game, seat, cfg);
    // kans
    for (const k of opts.ankan) {
      if (p.riichi) return { type: 'ankan', kind: k };
      const c = countsFromIds(p.hand);
      const nm = p.melds.length;
      let sNow = 9;
      for (let t = 0; t < 34; t++) if (c[t]) { c[t]--; sNow = Math.min(sNow, MJ.shanten(c, nm)); c[t]++; }
      c[k] -= 4;
      const sKan = MJ.shanten(c, nm + 1);
      if (sKan <= sNow && (!ths.length || sKan === 0)) return { type: 'ankan', kind: k };
    }
    for (const k of opts.kakan) if (!ths.length || cfg.level === 0) return { type: 'kakan', kind: k };
    if (opts.riichi.length && !p.riichi) {
      const rc = riichiChoice(game, seat, opts, cfg);
      if (rc) {
        let doRiichi = true;
        if (cfg.level > 0) {
          if (rc.left === 0 && game.liveLeft() > 8) doRiichi = false;
          // dama when the hand already has 役 and is worth a lot
          let damaBase = 0;
          for (const w of rc.waits) {
            const tmp = p.hand.filter((x, i) => i !== p.hand.findIndex((y) => kindOf(y) === rc.k));
            const r = MJ.evaluate({ closed: tmp.map(kindOf).concat([w]), melds: meldKinds(p), win: w, tsumo: false, seat: game.seatWind(seat), round: game.roundWind, dora: game.doraIndicators().map(kindOf), aka: game.o.aka ? tmp.filter((x) => RED_IDS.includes(x)).length : 0 }, game.ruleOpts);
            if (r) damaBase = Math.max(damaBase, r.base);
          }
          if (damaBase >= 2000 && cfg.level >= 2 && rand() < 0.4 + style.dama) doRiichi = false;
          else if (damaBase >= 1000 && style.dama > 0.6 && rand() < style.dama) doRiichi = false;
          if (ths.length && cfg.level >= 2 && rc.left <= 2 && damaBase === 0 && style.attack < 0.6) doRiichi = false;
        }
        if (doRiichi) {
          const ids = p.hand.filter((x) => kindOf(x) === rc.k);
          const id = p.drawn != null && kindOf(p.drawn) === rc.k ? p.drawn : ids.sort((a, b) => (RED_IDS.includes(a) ? 1 : 0) - (RED_IDS.includes(b) ? 1 : 0))[0];
          return { type: 'riichi', id };
        }
      }
    }
    return { type: 'discard', id: chooseDiscard(game, seat, opts, cfg) };
  }

  function call(game, seat, info, cfg) {
    cfg = cfg || { level: 1 };
    const o = info.opts;
    if (o.ron) return { type: 'ron' };
    if (info.chankan) return { type: 'pass' };
    const p = game.players[seat];
    const style = Object.assign({}, STYLE, cfg.style || {});
    const k = kindOf(info.id);
    const c = countsFromIds(p.hand);
    const nm = p.melds.length;
    const closed = p.melds.every((m) => m.type === 'ankan');
    const curPlan = planFor(game, seat, c, meldKinds(p));
    const s0 = shantenPlan(c, nm, curPlan && curPlan.type !== 'none' ? curPlan : null);
    const s0std = MJ.shantenStd(c, nm);
    const ths = threats(game, seat, cfg);
    const yk = yakuhaiKind(game, seat, k);
    const cands = [];
    if (o.pon) cands.push({ type: 'pon', ids: o.pon, kinds: [k, k, k], forbid: [k] });
    for (const ids of o.chi) cands.push({ type: 'chi', ids, kinds: [k, kindOf(ids[0]), kindOf(ids[1])], forbid: game.chiForbidden(k, kindOf(ids[0]), kindOf(ids[1])) });
    let best = null;
    for (const cd of cands) {
      const d = c.slice();
      for (const id of cd.ids) d[kindOf(id)]--;
      const melds = meldKinds(p).concat([{ type: cd.type, kinds: cd.kinds }]);
      const plan = planFor(game, seat, d, melds);
      let s1 = 9;
      for (let t = 0; t < 34; t++) {
        if (!d[t] || cd.forbid.includes(t)) continue;
        d[t]--;
        s1 = Math.min(s1, shantenPlan(d, nm + 1, plan && plan.type !== 'none' ? plan : null));
        d[t]++;
      }
      cd.s1 = s1; cd.plan = plan;
      let want = false;
      if (cfg.level === 0) {
        want = (cd.type === 'pon' && yk) || (s1 < s0std && rand() < 0.3);
      } else if (plan && plan.type !== 'none') {
        if (cd.type === 'pon' && yk) want = s1 <= s0 + (closed ? 0 : 1) && !(closed && s0std <= 0);
        else if (plan.atozuke) want = s1 < s0std && s1 <= 1 && style.call > 0.3;
        else want = s1 < s0std && (s1 <= 2 || plan.type === 'honitsu' || plan.type === 'toitoi') && rand() < 0.55 + style.call * 0.6;
        if (closed && s0std <= 1 && !(cd.type === 'pon' && yk) && plan.type !== 'honitsu' && cfg.level >= 2) want = want && handValue(game, seat) === 0 && rand() < 0.3;
      }
      if (ths.length && cfg.level > 0 && s1 >= 1 && !(cd.type === 'pon' && yk && s1 <= 1)) want = false;
      if (want && (!best || s1 < best.s1)) best = cd;
    }
    if (o.minkan && cfg.level > 0 && !ths.length) {
      const d = c.slice();
      d[k] -= 3;
      const melds = meldKinds(p).concat([{ type: 'minkan', kinds: [k, k, k, k] }]);
      const plan = planFor(game, seat, d, melds);
      if (plan && plan.type !== 'none' && MJ.shantenStd(d, nm + 1) <= s0std && (yk || !closed)) return { type: 'minkan' };
    }
    if (best) return best.type === 'pon' ? { type: 'pon' } : { type: 'chi', ids: best.ids };
    return { type: 'pass' };
  }

  return { self, call, visible, planFor, shantenPlan, evalDiscards, danger, threats, chooseDiscard, setRandom: (f) => { rand = f; } };
});
