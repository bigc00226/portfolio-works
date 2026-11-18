/*
 * 宵月麻雀 — the game flow (pure; Node + browser as window.MJEngine). No drawing here.
 *
 *   const g = new Game(options, agents, on);   agents[seat] = { self(game, seat, opts) → action, call(game, seat, info) → action } (may return Promises)
 *   await g.run();                            plays the whole game; on(type, data, game) is awaited at every event (animation hooks)
 *
 * Seats 0–3 are fixed; the dealer moves. 自風 = (seat − dealer) mod 4. Actions:
 *   self: { type: 'discard' | 'riichi', id } · { type: 'tsumo' } · { type: 'ankan' | 'kakan', kind } · { type: 'kyuushu' }
 *   call: { type: 'ron' } · { type: 'pon' } · { type: 'minkan' } · { type: 'chi', ids: [a, b] } · { type: 'pass' }
 * Events: gameStart, handStart, draw, riichiDeclare, discard, riichiStick, call, kan, handEnd, gameEnd.
 */
(function (root, factory) {
  const MJ = typeof module === 'object' && module.exports ? require('./rules.js') : root.MJ;
  const M = factory(MJ);
  if (typeof module === 'object' && module.exports) module.exports = M;
  else root.MJEngine = M;
})(typeof self !== 'undefined' ? self : this, function (MJ) {
  'use strict';
  const { kindOf, countsFromIds, RED_IDS } = MJ;

  const DEFAULTS = {
    length: 'tonpuu', // 'tonpuu' 東風戦 | 'hanchan' 半荘戦
    aka: true, kazoe: true, kiriage: false, double: false, renpuu: 4,
    kyuushu: true, suufon: true, suucha: true, suukan: true,
    tobi: true, start: 25000, ret: 30000, oka: true, uma: [20, 10, -10, -20],
    seed: undefined,
  };

  function rng(seed) {
    let a = (seed == null ? (Math.random() * 2 ** 32) >>> 0 : seed >>> 0) || 1;
    const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.int = (n) => Math.floor(r() * n);
    return r;
  }
  const sortIds = (ids) => ids.sort((a, b) => (a >> 2) - (b >> 2) || a - b);
  const WIND = '東南西北';

  class Game {
    constructor(opt, agents, on) {
      this.o = Object.assign({}, DEFAULTS, opt || {});
      if (!this.o.oka) this.o.ret = this.o.start;
      this.rng = rng(this.o.seed);
      this.agents = agents;
      this.on = on || null;
      this.scores = [0, 1, 2, 3].map(() => this.o.start);
      this.kiicha = this.rng.int(4); // 起家
      this.kyoku = 0; // 0–3 東1–4局, 4–7 南1–4局
      this.honba = 0;
      this.kyoutaku = 0;
      this.handNo = 0;
      this.over = false;
      this.history = [];
      this.players = [];
      this.ruleOpts = { kazoe: this.o.kazoe, kiriage: this.o.kiriage, double: this.o.double, renpuu: this.o.renpuu };
    }
    get dealer() { return (this.kiicha + this.kyoku) % 4; }
    get roundWind() { return Math.min(3, Math.floor(this.kyoku / 4)); }
    get lastKyoku() { return this.o.length === 'hanchan' ? 7 : 3; }
    seatWind(s) { return (s - this.dealer + 4) % 4; }
    roundName() { return `${WIND[this.roundWind]}${(this.kyoku % 4) + 1}局`; }
    isAllLast() { return this.kyoku === this.lastKyoku; }
    async emit(type, data) { if (this.on) await this.on(type, data || {}, this); }
    liveLeft() { return 122 - this.pos - this.kans; }
    doraIndicators() { return this.dead.slice(4, 4 + this.doraShown); }
    uraIndicators() { return this.dead.slice(9, 9 + this.doraShown); }
    /** seats from first to last: score, then closer to 起家 */
    ranking(scores = this.scores) {
      return [0, 1, 2, 3].sort((a, b) => scores[b] - scores[a] || ((a - this.kiicha + 4) % 4) - ((b - this.kiicha + 4) % 4));
    }

    async run() {
      await this.emit('gameStart');
      while (!this.over) {
        const res = await this.playHand();
        this.afterHand(res);
      }
      const fin = this.finalResult();
      await this.emit('gameEnd', fin);
      return fin;
    }

    /* ---------------------------------------------------------------- setup */
    setupHand() {
      const ids = [];
      for (let i = 0; i < 136; i++) ids.push(i);
      for (let i = ids.length - 1; i > 0; i--) { const j = this.rng.int(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
      this.wall = ids;
      this.dead = ids.slice(122);
      this.pos = 0;
      this.kans = 0;
      this.kanOwners = [];
      this.rinshanUsed = 0;
      this.doraShown = 1;
      this.noCalls = true;
      this.firstWinds = [];
      this.suukanPending = false;
      this.turn = this.dealer;
      this.lastDiscard = null;
      this.players = [0, 1, 2, 3].map((s) => ({
        seat: s, hand: [], drawn: null, melds: [], river: [], discardKinds: new Set(), riichi: 0, riichiIdx: -1, ippatsu: false,
        furitenTemp: false, furitenRiichi: false, waits: [], rinshanNow: false, kuikae: null, afterRiichiSafe: new Set(),
      }));
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const p = this.players[(this.dealer + i) % 4]; for (let j = 0; j < 4; j++) p.hand.push(this.wall[this.pos++]); }
      for (let i = 0; i < 4; i++) this.players[(this.dealer + i) % 4].hand.push(this.wall[this.pos++]);
      for (const p of this.players) { sortIds(p.hand); p.waits = MJ.waits(countsFromIds(p.hand), 0); }
    }

    /* ---------------------------------------------------------------- one hand */
    async playHand() {
      this.setupHand();
      await this.emit('handStart');
      let turn = this.dealer, needDraw = true;
      for (let guard = 0; guard < 400; guard++) {
        this.turn = turn;
        const p = this.players[turn];
        if (needDraw) {
          if (this.liveLeft() <= 0) return this.exhaustive();
          const id = this.wall[this.pos++];
          p.hand.push(id); p.drawn = id; p.rinshanNow = false;
          await this.emit('draw', { seat: turn, id });
        }
        const sp = await this.selfPhase(turn);
        if (sp.end) return sp.end;
        const d = await this.doDiscard(turn, sp.discard, sp.riichi);
        if (d.result) return d.result;
        if (d.call) { turn = d.call.seat; needDraw = false; continue; }
        if (this.liveLeft() <= 0) return this.exhaustive();
        turn = (turn + 1) % 4; needDraw = true;
      }
      return this.abort('進行エラー');
    }

    /** what the player whose turn it is may do now */
    selfOptions(s) {
      const p = this.players[s];
      const c = countsFromIds(p.hand);
      const nm = p.melds.length;
      const o = { seat: s, tsumo: null, riichi: [], ankan: [], kakan: [], kyuushu: false, afterCall: !!p.kuikae, forbidden: p.kuikae ? [...p.kuikae] : [], discards: [] };
      if (!p.kuikae) {
        if (MJ.shanten(c, nm) === -1) o.tsumo = this.scoreWin(s, p.drawn, true, {});
        if (this.o.kyuushu && this.noCalls && p.river.length === 0 && MJ.YAOCHU.filter((k) => c[k]).length >= 9) o.kyuushu = true;
        if (this.liveLeft() > 0 && this.kans < 4) {
          for (let k = 0; k < 34; k++) if (c[k] === 4 && (!p.riichi || this.riichiKanOk(p, k))) o.ankan.push(k);
          if (!p.riichi) for (const m of p.melds) if (m.type === 'pon' && c[kindOf(m.tiles[0])]) o.kakan.push(kindOf(m.tiles[0]));
        }
        const menzen = p.melds.every((m) => m.type === 'ankan');
        if (!p.riichi && menzen && this.scores[s] >= 1000 && this.liveLeft() >= 4) {
          for (let k = 0; k < 34; k++) {
            if (!c[k]) continue;
            c[k]--;
            if (MJ.shanten(c, nm) === 0) o.riichi.push(k);
            c[k]++;
          }
        }
      }
      if (p.riichi && p.drawn != null) o.discards = [p.drawn];
      else o.discards = p.hand.filter((id) => !o.forbidden.includes(kindOf(id)));
      return o;
    }
    /** 立直後の暗槓: only the drawn tile, and the waits must not change */
    riichiKanOk(p, k) {
      if (p.drawn == null || kindOf(p.drawn) !== k) return false;
      const before = p.waits.join(',');
      const c = countsFromIds(p.hand);
      c[k] -= 4;
      const after = MJ.waits(c, p.melds.length + 1).join(',');
      return before !== '' && before === after;
    }

    validateSelf(act, o, s) {
      const p = this.players[s];
      act = act || {};
      if (act.type === 'tsumo' && o.tsumo) return act;
      if (act.type === 'kyuushu' && o.kyuushu) return act;
      if (act.type === 'ankan' && o.ankan.includes(act.kind)) return act;
      if (act.type === 'kakan' && o.kakan.includes(act.kind)) return act;
      if (act.type === 'riichi' && p.hand.includes(act.id) && o.riichi.includes(kindOf(act.id))) return act;
      if (act.type === 'discard' && o.discards.includes(act.id)) return act;
      return { type: 'discard', id: o.discards.includes(p.drawn) ? p.drawn : o.discards[o.discards.length - 1] };
    }

    async selfPhase(s) {
      const p = this.players[s];
      for (let guard = 0; guard < 8; guard++) {
        const o = this.selfOptions(s);
        const act = this.validateSelf(await this.agents[s].self(this, s, o), o, s);
        if (act.type === 'tsumo') return { end: await this.winTsumo(s) };
        if (act.type === 'kyuushu') return { end: await this.abort('九種九牌', s) };
        if (act.type === 'ankan' || act.type === 'kakan') {
          const k = act.kind;
          if (act.type === 'kakan') {
            const meld = p.melds.find((m) => m.type === 'pon' && kindOf(m.tiles[0]) === k);
            const id = p.hand.find((x) => kindOf(x) === k);
            p.hand.splice(p.hand.indexOf(id), 1);
            meld.type = 'kakan'; meld.tiles.push(id); meld.added = id;
            p.drawn = null;
            await this.emit('kan', { seat: s, type: 'kakan', meld });
            const r = await this.reactions(s, id, { chankan: true });
            if (r.ron != null) return { end: await this.winRon(r.ron, s, id, { chankan: true }) };
          } else {
            const tiles = p.hand.filter((x) => kindOf(x) === k);
            p.hand = p.hand.filter((x) => kindOf(x) !== k);
            const meld = { type: 'ankan', tiles, from: 0 };
            p.melds.push(meld);
            p.drawn = null;
            await this.emit('kan', { seat: s, type: 'ankan', meld });
          }
          this.afterKan(s);
          await this.rinshanDraw(s);
          continue;
        }
        return { discard: act.id, riichi: act.type === 'riichi' };
      }
      const o = this.selfOptions(s);
      return { discard: o.discards[o.discards.length - 1], riichi: false };
    }
    afterKan(s) {
      this.noCalls = false;
      for (const q of this.players) q.ippatsu = false;
      this.kans++;
      this.kanOwners.push(s);
      this.doraShown = Math.min(5, this.doraShown + 1); // カンドラは即めくり
      if (this.o.suukan && this.kans === 4 && new Set(this.kanOwners).size > 1) this.suukanPending = true;
    }
    async rinshanDraw(s) {
      const p = this.players[s];
      const id = this.dead[this.rinshanUsed++];
      p.hand.push(id); p.drawn = id; p.rinshanNow = true;
      await this.emit('draw', { seat: s, id, rinshan: true });
    }

    async doDiscard(s, id, riichi) {
      const p = this.players[s];
      const first = p.river.length === 0;
      p.hand.splice(p.hand.indexOf(id), 1);
      const tsumogiri = id === p.drawn;
      p.drawn = null; p.rinshanNow = false; p.kuikae = null; p.furitenTemp = false;
      if (p.riichi && !riichi) p.ippatsu = false;
      if (riichi) {
        p.riichi = this.noCalls && first ? 2 : 1;
        p.riichiIdx = p.river.length;
        await this.emit('riichiDeclare', { seat: s, double: p.riichi === 2 });
      }
      p.river.push({ id, riichi: !!riichi, called: false, tsumogiri });
      p.discardKinds.add(kindOf(id));
      sortIds(p.hand);
      p.waits = MJ.waits(countsFromIds(p.hand), p.melds.length);
      if (this.noCalls && first) this.firstWinds.push(kindOf(id));
      this.lastDiscard = { seat: s, id };
      for (const q of this.players) if (q.seat !== s && q.riichi && q.riichiIdx >= 0 && !(q.seat === s)) q.afterRiichiSafe.add(kindOf(id));
      await this.emit('discard', { seat: s, id, riichi: !!riichi, tsumogiri });
      const r = await this.reactions(s, id, {});
      if (r.ron != null) return { result: await this.winRon(r.ron, s, id, {}) };
      if (riichi) {
        this.scores[s] -= 1000; this.kyoutaku++;
        p.ippatsu = true;
        await this.emit('riichiStick', { seat: s });
        if (this.o.suucha && this.players.every((q) => q.riichi)) return { result: await this.abort('四家立直') };
      }
      if (this.o.suufon && this.noCalls && this.firstWinds.length === 4 && MJ.isWind(this.firstWinds[0]) && this.firstWinds.every((k) => k === this.firstWinds[0])) return { result: await this.abort('四風連打') };
      if (this.suukanPending) return { result: await this.abort('四開槓') };
      if (r.call) { await this.performCall(r.call, s, id); return { call: r.call }; }
      return {};
    }

    /** can seat s win on tile id (not their own)? → evaluate() result or null */
    canRon(s, id, flags) {
      const p = this.players[s];
      const k = kindOf(id);
      if (!p.waits.includes(k)) return null;
      if (p.furitenTemp || p.furitenRiichi || MJ.isDiscardFuriten(p.waits, p.discardKinds)) return null;
      return this.scoreWin(s, id, false, flags || {});
    }
    furitenState(s) {
      const p = this.players[s];
      if (p.furitenRiichi) return '立直後の見逃し';
      if (p.furitenTemp) return '同巡内の見逃し';
      if (MJ.isDiscardFuriten(p.waits, p.discardKinds)) return '捨て牌に待ち牌';
      return '';
    }
    scoreWin(s, winId, tsumo, flags) {
      const p = this.players[s];
      const handIds = tsumo ? p.hand.slice() : p.hand.concat([winId]);
      const allIds = handIds.slice();
      for (const m of p.melds) allIds.push(...m.tiles);
      const dealer = s === this.dealer;
      const first = this.noCalls && p.river.length === 0;
      return MJ.evaluate({
        closed: handIds.map(kindOf), melds: p.melds.map((m) => ({ type: m.type, kinds: m.tiles.map(kindOf) })), win: kindOf(winId), tsumo,
        seat: this.seatWind(s), round: this.roundWind, riichi: p.riichi, ippatsu: p.ippatsu,
        haitei: tsumo && this.liveLeft() === 0 && !p.rinshanNow, houtei: !tsumo && this.liveLeft() === 0 && !flags.chankan,
        rinshan: tsumo && p.rinshanNow, chankan: !!flags.chankan, tenhou: tsumo && dealer && first, chiihou: tsumo && !dealer && first,
        dora: this.doraIndicators().map(kindOf), ura: this.uraIndicators().map(kindOf), aka: this.o.aka ? allIds.filter((x) => RED_IDS.includes(x)).length : 0,
      }, this.ruleOpts);
    }

    /** pick ids of a kind from a hand, plain tiles before red fives */
    pick(hand, k, n) {
      const xs = hand.filter((x) => kindOf(x) === k).sort((a, b) => (RED_IDS.includes(a) ? 1 : 0) - (RED_IDS.includes(b) ? 1 : 0) || a - b);
      return xs.length >= n ? xs.slice(0, n) : null;
    }
    leavesDiscard(p, used, forbidden) {
      const rest = p.hand.filter((x) => !used.includes(x));
      return rest.some((x) => !forbidden.includes(kindOf(x)));
    }
    chiForbidden(k, a, b) {
      const lo = Math.min(k, a, b), hi = Math.max(k, a, b), f = [k];
      if (k === lo && (k % 9) + 3 <= 8) f.push(k + 3);
      if (k === hi && (k % 9) - 3 >= 0) f.push(k - 3);
      return f;
    }
    callOptions(s, id, from) {
      const p = this.players[s];
      const k = kindOf(id);
      const o = { seat: s, ron: this.canRon(s, id, {}), pon: null, minkan: null, chi: [] };
      if (p.riichi || this.liveLeft() <= 0) return o;
      const two = this.pick(p.hand, k, 2);
      if (two && this.leavesDiscard(p, two, [k])) o.pon = two;
      const three = this.pick(p.hand, k, 3);
      if (three && this.kans < 4) o.minkan = three;
      if (s === (from + 1) % 4 && k < 27) {
        const n = k % 9;
        for (const [da, db] of [[-2, -1], [-1, 1], [1, 2]]) {
          if (n + da < 0 || n + db > 8) continue;
          const a = this.pick(p.hand, k + da, 1), b = this.pick(p.hand, k + db, 1);
          if (!a || !b) continue;
          const ids = [a[0], b[0]];
          if (this.leavesDiscard(p, ids, this.chiForbidden(k, k + da, k + db))) o.chi.push(ids);
        }
      }
      return o;
    }

    /** asks the other three what they do with a discard (or a 加槓 tile when chankan) */
    async reactions(from, id, flags) {
      const k = kindOf(id);
      const opts = [];
      for (let i = 1; i <= 3; i++) {
        const s = (from + i) % 4;
        opts.push(flags.chankan ? { seat: s, ron: this.canRon(s, id, flags), pon: null, minkan: null, chi: [] } : this.callOptions(s, id, from));
      }
      const asks = opts.map((o) => (o.ron || o.pon || o.minkan || o.chi.length ? this.agents[o.seat].call(this, o.seat, { id, from, opts: o, chankan: !!flags.chankan }) : { type: 'pass' }));
      const dec = (await Promise.all(asks)).map((d, i) => {
        const o = opts[i];
        d = d || { type: 'pass' };
        if (d.type === 'ron' && o.ron) return d;
        if (d.type === 'pon' && o.pon) return { type: 'pon', ids: o.pon };
        if (d.type === 'minkan' && o.minkan) return { type: 'minkan', ids: o.minkan };
        if (d.type === 'chi' && o.chi.length) {
          const pickd = o.chi.find((c) => d.ids && c[0] === d.ids[0] && c[1] === d.ids[1]) || o.chi[0];
          return { type: 'chi', ids: pickd };
        }
        return { type: 'pass' };
      });
      let winner = null;
      for (let i = 0; i < 3; i++) if (dec[i].type === 'ron') { winner = opts[i].seat; break; } // 頭ハネ
      for (let i = 0; i < 3; i++) {
        const q = this.players[opts[i].seat];
        if (q.seat !== winner && q.waits.includes(k)) { q.furitenTemp = true; if (q.riichi) q.furitenRiichi = true; }
      }
      if (winner != null) return { ron: winner };
      if (flags.chankan) return {};
      for (let i = 0; i < 3; i++) if (dec[i].type === 'pon' || dec[i].type === 'minkan') return { call: Object.assign({ seat: opts[i].seat }, dec[i]) };
      for (let i = 0; i < 3; i++) if (dec[i].type === 'chi') return { call: Object.assign({ seat: opts[i].seat }, dec[i]) };
      return {};
    }

    async performCall(call, from, id) {
      const p = this.players[call.seat];
      const fp = this.players[from];
      fp.river[fp.river.length - 1].called = true;
      p.hand = p.hand.filter((x) => !call.ids.includes(x));
      const k = kindOf(id);
      const rel = (from - call.seat + 4) % 4; // 3 上家 · 2 対面 · 1 下家
      const tiles = sortIds(call.ids.concat([id]));
      const meld = { type: call.type, tiles, called: id, from: rel };
      p.melds.push(meld);
      this.noCalls = false;
      for (const q of this.players) q.ippatsu = false;
      if (call.type === 'chi') p.kuikae = this.chiForbidden(k, kindOf(call.ids[0]), kindOf(call.ids[1]));
      else if (call.type === 'pon') p.kuikae = [k];
      p.drawn = null;
      await this.emit('call', { seat: call.seat, from, type: call.type, meld });
      if (call.type === 'minkan') {
        this.afterKan(call.seat);
        await this.rinshanDraw(call.seat);
      }
    }

    /* ---------------------------------------------------------------- endings */
    async winTsumo(s) {
      const p = this.players[s];
      const r = this.scoreWin(s, p.drawn, true, {});
      const delta = [0, 0, 0, 0];
      for (let o = 0; o < 4; o++) {
        if (o === s) continue;
        const pay = (s === this.dealer ? r.points.all : o === this.dealer ? r.points.dealer : r.points.other) + 100 * this.honba;
        delta[o] -= pay; delta[s] += pay;
      }
      return this.finishWin('tsumo', s, null, p.drawn, r, delta);
    }
    async winRon(s, from, id, flags) {
      const r = this.scoreWin(s, id, false, flags);
      const delta = [0, 0, 0, 0];
      const pay = r.points.ron + 300 * this.honba;
      delta[from] -= pay; delta[s] += pay;
      return this.finishWin('ron', s, from, id, r, delta);
    }
    async finishWin(type, s, from, id, score, delta) {
      const p = this.players[s];
      const sticks = this.kyoutaku;
      delta[s] += sticks * 1000;
      this.kyoutaku = 0;
      const before = this.scores.slice();
      for (let i = 0; i < 4; i++) this.scores[i] += delta[i];
      const res = {
        type, winner: s, from, winTile: id, score, delta, before, after: this.scores.slice(), sticks, honba: this.honba,
        hand: type === 'tsumo' ? p.hand.filter((x) => x !== id) : p.hand.slice(), melds: p.melds.map((m) => Object.assign({}, m, { tiles: m.tiles.slice() })),
        dora: this.doraIndicators(), ura: p.riichi ? this.uraIndicators() : [], riichi: p.riichi, renchan: s === this.dealer, dealer: this.dealer,
      };
      await this.emit('handEnd', res);
      return res;
    }
    async exhaustive() {
      const tenpai = this.players.map((p) => p.waits.length > 0);
      const n = tenpai.filter(Boolean).length;
      const delta = [0, 0, 0, 0];
      if (n > 0 && n < 4) for (let s = 0; s < 4; s++) delta[s] = tenpai[s] ? 3000 / n : -3000 / (4 - n);
      const before = this.scores.slice();
      for (let i = 0; i < 4; i++) this.scores[i] += delta[i];
      const res = { type: 'ryuukyoku', reason: '荒牌平局', tenpai, delta, before, after: this.scores.slice(), renchan: tenpai[this.dealer], dealer: this.dealer, hands: this.players.map((p) => p.hand.slice()), melds: this.players.map((p) => p.melds.slice()) };
      await this.emit('handEnd', res);
      return res;
    }
    async abort(reason, seat) {
      const res = { type: 'abort', reason, seat, delta: [0, 0, 0, 0], before: this.scores.slice(), after: this.scores.slice(), renchan: true, dealer: this.dealer, hand: seat != null ? this.players[seat].hand.slice() : null };
      await this.emit('handEnd', res);
      return res;
    }

    afterHand(res) {
      const dealer = this.dealer;
      const won = res.type === 'tsumo' || res.type === 'ron';
      this.history.push({ round: this.roundName(), honba: this.honba, type: res.type, winner: res.winner, from: res.from, label: won ? res.score.label : res.reason, total: won ? res.score.total : 0, delta: res.delta.slice() });
      this.handNo++;
      if (won && !res.renchan) this.honba = 0; else this.honba++;
      if (this.o.tobi && this.scores.some((x) => x < 0)) { this.over = true; this.endReason = '飛び'; return; }
      if (this.handNo >= 64) { this.over = true; this.endReason = '規定局数'; return; }
      if (!res.renchan) {
        if (this.kyoku >= this.lastKyoku) { this.over = true; this.endReason = '終局'; return; }
        this.kyoku++;
        return;
      }
      // オーラスの親がトップでアガリ・テンパイ → 終了（アガリやめ・テンパイやめ）
      if (this.kyoku === this.lastKyoku && res.type !== 'abort' && this.ranking()[0] === dealer) { this.over = true; this.endReason = '親のアガリやめ'; }
    }
    finalResult() {
      const order = this.ranking();
      if (this.kyoutaku) { this.scores[order[0]] += this.kyoutaku * 1000; this.kyoutaku = 0; }
      const rank = this.ranking();
      const uma = this.o.uma || [0, 0, 0, 0];
      const oka = this.o.oka ? ((this.o.ret - this.o.start) * 4) / 1000 : 0;
      const rows = rank.map((s, i) => {
        const pt = (this.scores[s] - this.o.ret) / 1000 + uma[i] + (i === 0 ? oka : 0);
        return { seat: s, rank: i + 1, score: this.scores[s], point: Math.round(pt * 10) / 10 };
      });
      return { rows, reason: this.endReason || '終局', history: this.history };
    }
  }

  return { Game, DEFAULTS, rng, sortIds, WIND };
});
