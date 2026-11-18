/*
 * 縁側将棋 — CPU の思考（Web Worker と Node で共通。rules.js の Position の上で動きます）
 *   think(pos, { level, timeMs }) → { move, score, depth, nodes, ms }
 *   level 0 入門: ほぼランダム（ただし、ただで取れる駒は取る・詰みがあれば指す）
 *   level 1 初級: 2 手読み + 駒の取り合いの読み（静止探索）、評価にゆらぎ
 *   level 2 中級: 反復深化のアルファベータ探索 + 静止探索 + 指し手の並べ替え（約 1.5 秒）
 *   level 3 上級: さらに置換表・ヌルムーブ・後半の手の削減（LMR）で深く読む（約 3 秒）
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rules.js'));
  else root.ShogiAI = factory(root.ShogiRules);
})(typeof self !== 'undefined' ? self : this, function (R) {
  'use strict';
  const { FU, KA, HI, OU, UM, RY } = R.T;
  const DROP = R.DROP, BASE = R.BASE, RAYS = R.RAYS;
  const INF = 32000, MATE = 30000;

  /* ---------- evaluation (先手から見た点数 → 手番側から見た点数) ---------- */
  //           -  歩   香   桂   銀   金   角   飛  玉   と   杏   圭   全  -   馬    龍
  const VAL = [0, 100, 280, 320, 450, 520, 650, 760, 0, 560, 520, 520, 520, 0, 900, 1050];
  const HAND = [0, 112, 300, 340, 480, 550, 700, 830];
  const CAPV = VAL.map((v, t) => v + (HAND[BASE[t]] || 0)); // 取ったときの得
  const ATK_W = [0, 0.25, 0.35, 0.6, 0.9, 0.9, 0.45, 0.45, 0, 1, 0.9, 0.9, 0.9, 0, 0.8, 0.9];
  const DEF_W = [0, 0.15, 0.1, 0.2, 0.8, 1, 0.1, 0.1, 0, 0.4, 0.5, 0.5, 0.6, 0, 0.8, 0.3];
  const ATK_D = [0, 62, 40, 17, 5, 0, 0, 0, 0], DEF_D = [0, 46, 28, 8, 0, 0, 0, 0, 0];
  const KING_REL = [0, -12, -50, -105, -165, -205, -230, -240, -250];
  const ATK = new Int16Array(16 * 9), DEF = new Int16Array(16 * 9);
  for (let t = 0; t < 16; t++) for (let d = 0; d < 9; d++) { ATK[t * 9 + d] = Math.round(ATK_W[t] * ATK_D[d]); DEF[t * 9 + d] = Math.round(DEF_W[t] * DEF_D[d]); }
  const DIST = new Int8Array(81 * 81);
  for (let a = 0; a < 81; a++) for (let b = 0; b < 81; b++) DIST[a * 81 + b] = Math.max(Math.abs((a % 9) - (b % 9)), Math.abs(((a / 9) | 0) - ((b / 9) | 0)));

  function evaluate(pos, noise) {
    const b = pos.board, kb = pos.king[0], kw = pos.king[1];
    let s = 0;
    for (let sq = 0; sq < 81; sq++) {
      const p = b[sq];
      if (!p) continue;
      const t = p & 15, c = p >> 4;
      let v;
      if (t === OU) {
        const y = (sq / 9) | 0;
        v = KING_REL[c ? y : 8 - y];
      } else {
        v = VAL[t] + ATK[t * 9 + DIST[sq * 81 + (c ? kb : kw)]] + DEF[t * 9 + DIST[sq * 81 + (c ? kw : kb)]];
        if (t === KA || t === HI || t === UM || t === RY) {
          const rays = RAYS[p][sq];
          let mob = 0;
          for (let r = 0; r < rays.length; r++) { const ray = rays[r]; for (let i = 0; i < ray.length; i++) { mob++; if (b[ray[i]]) break; } }
          v += mob * 3;
        }
      }
      s += c ? -v : v;
    }
    const h = pos.hand;
    for (let t = 1; t <= 7; t++) s += (h[t] - h[8 + t]) * HAND[t];
    if (noise) s += ((pos.lo ^ (pos.hi >>> 7)) % noise);
    return pos.side ? -s : s;
  }

  /* ---------- transposition table (上級) ---------- */
  const TT_BITS = 20, TT_MASK = (1 << TT_BITS) - 1;
  let ttLo = null, ttHi, ttM, ttS, ttD, ttF;
  function ttInit() {
    if (ttLo) return;
    ttLo = new Int32Array(1 << TT_BITS); ttHi = new Int32Array(1 << TT_BITS); ttM = new Int32Array(1 << TT_BITS);
    ttS = new Int16Array(1 << TT_BITS); ttD = new Int8Array(1 << TT_BITS); ttF = new Int8Array(1 << TT_BITS);
  }
  const EXACT = 1, LOWER = 2, UPPER = 3;

  const LEVELS = [
    { timeMs: 300, maxDepth: 1 },
    { timeMs: 600, maxDepth: 2, noise: 90, rootNoise: 70 },
    { timeMs: 1500, maxDepth: 30, rootNoise: 14 },
    { timeMs: 3000, maxDepth: 40, tt: true, nullMove: true, lmr: true, rootNoise: 8 },
  ];

  /** 入門: a nearly random move that still takes free material and plays a mate in one */
  function thinkBeginner(pos, rand) {
    const moves = pos.legalMoves();
    let best = 0, bs = -Infinity;
    for (const m of moves) {
      const to = (m >> 7) & 127, from = m & 127, cap = pos.board[to];
      const t = from > DROP ? from - DROP : (pos.board[from] & 15) + ((m >> 14) & 1) * 8;
      let s = rand() * 160;
      if (cap) s += CAPV[cap & 15] * 0.8;
      if ((m >> 14) & 1) s += 60;
      pos.make(m);
      if (pos.isAttacked(to, pos.side)) s -= VAL[t] * (rand() < 0.75 ? 0.8 : 0);
      if (pos.inCheck() && !pos.legalMoves().length) s += 5000;
      pos.unmake(m);
      if (s > bs) { bs = s; best = m; }
    }
    return { move: best, score: 0, depth: 1, nodes: moves.length };
  }

  function think(pos, opt = {}) {
    const t0 = Date.now();
    const lv = LEVELS[opt.level == null ? 2 : opt.level];
    const cfg = Object.assign({}, lv, opt);
    let seed = (opt.seed == null ? (Math.random() * 2 ** 31) : opt.seed) | 0 || 7;
    const rand = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 100000) / 100000; };
    if ((opt.level | 0) === 0 && !opt.full) { const r = thinkBeginner(pos, rand); r.ms = Date.now() - t0; return r; }

    const deadline = t0 + cfg.timeMs, useTT = !!cfg.tt, useNull = !!cfg.nullMove, useLMR = !!cfg.lmr, enoise = cfg.noise || 0;
    if (useTT) ttInit();
    let nodes = 0, stopped = false;
    const killers = new Int32Array(512), hist = new Int32Array(88 * 81);
    const bufs = [], scs = [];
    for (let i = 0; i < 130; i++) { bufs.push(new Int32Array(1024)); scs.push(new Int32Array(1024)); }
    const ev = () => evaluate(pos, enoise);
    const timeUp = () => { if ((nodes & 1023) === 0 && Date.now() > deadline) stopped = true; return stopped; };
    const isRep = () => {
      const ply = pos.ply, lo = pos.lo, hi = pos.hi, lim = Math.max(0, ply - 48);
      for (let i = ply - 4; i >= lim; i -= 2) if (pos.hlo[i] === lo && pos.hhi[i] === hi) return true;
      return false;
    };
    const histIdx = (m) => (m & 127) * 81 + ((m >> 7) & 127);

    function order(buf, sc, n, ply, ttMove) {
      const b = pos.board, k0 = killers[ply * 2], k1 = killers[ply * 2 + 1];
      for (let i = 0; i < n; i++) {
        const m = buf[i], to = (m >> 7) & 127, from = m & 127, cap = b[to];
        let s;
        if (m === ttMove) s = 1 << 29;
        else if (cap) s = (1 << 26) + CAPV[cap & 15] * 32 - (from > DROP ? 0 : VAL[b[from] & 15]) + ((m >> 14) & 1) * 400;
        else if ((m >> 14) & 1) s = (1 << 25) + VAL[(b[from] & 15) + 8];
        else if (m === k0) s = (1 << 24) + 2;
        else if (m === k1) s = (1 << 24) + 1;
        else s = Math.min(hist[histIdx(m)], (1 << 23)) - (from > DROP ? 40 : 0);
        sc[i] = s;
      }
    }
    function pick(buf, sc, n, i) {
      let bi = i;
      for (let j = i + 1; j < n; j++) if (sc[j] > sc[bi]) bi = j;
      if (bi !== i) { const m = buf[i]; buf[i] = buf[bi]; buf[bi] = m; const s = sc[i]; sc[i] = sc[bi]; sc[bi] = s; }
      return buf[i];
    }

    function qsearch(alpha, beta, ply, qd) {
      nodes++;
      if (timeUp()) return 0;
      const inCheck = pos.inCheck();
      let best, stand = 0;
      if (!inCheck) {
        stand = ev();
        if (stand >= beta || qd >= 8 || ply >= 126) return stand;
        if (stand > alpha) alpha = stand;
        best = stand;
      } else {
        if (qd >= 8 || ply >= 126) return ev();
        best = -MATE + ply;
      }
      const buf = bufs[ply], sc = scs[ply];
      const n = inCheck ? pos.genMoves(buf) : pos.genCaptures(buf);
      order(buf, sc, n, ply, 0);
      let legal = 0;
      for (let i = 0; i < n; i++) {
        const m = pick(buf, sc, n, i), cap = pos.board[(m >> 7) & 127];
        if (!inCheck && stand + CAPV[cap & 15] + 200 <= alpha && !((m >> 14) & 1)) continue; // delta pruning
        const me = pos.side;
        pos.make(m);
        if (pos.isAttacked(pos.king[me], pos.side) || (pos.pawnDropChecks(m) && !pos.hasLegalMove())) { pos.unmake(m); continue; }
        legal++;
        const v = -qsearch(-beta, -alpha, ply + 1, qd + 1);
        pos.unmake(m);
        if (stopped) return 0;
        if (v > best) { best = v; if (v > alpha) { alpha = v; if (v >= beta) break; } }
      }
      return best;
    }

    function negamax(depth, alpha, beta, ply, canNull) {
      if (isRep()) return 0;
      const inCheck = pos.inCheck();
      if (inCheck && ply < 40) depth++;
      if (depth <= 0) return qsearch(alpha, beta, ply, 0);
      nodes++;
      if (timeUp()) return 0;
      if (ply >= 120) return ev();
      let ttMove = 0;
      const ti = pos.lo & TT_MASK;
      if (useTT && ttLo[ti] === pos.lo && ttHi[ti] === pos.hi) {
        ttMove = ttM[ti];
        if (ttD[ti] >= depth) {
          let s = ttS[ti];
          if (s > MATE - 500) s -= ply; else if (s < -MATE + 500) s += ply;
          const f = ttF[ti];
          if (f === EXACT || (f === LOWER && s >= beta) || (f === UPPER && s <= alpha)) return s;
        }
      }
      if (useNull && canNull && !inCheck && depth >= 3 && beta < MATE - 500 && ev() >= beta) {
        pos.makeNull();
        const v = -negamax(depth - 3, -beta, -beta + 1, ply + 1, false);
        pos.unmakeNull();
        if (stopped) return 0;
        if (v >= beta) return beta;
      }
      const buf = bufs[ply], sc = scs[ply], n = pos.genMoves(buf);
      order(buf, sc, n, ply, ttMove);
      const a0 = alpha;
      let best = -INF, bestMove = 0, legal = 0;
      for (let i = 0; i < n; i++) {
        const m = pick(buf, sc, n, i), to = (m >> 7) & 127, cap = pos.board[to], quiet = !cap && !((m >> 14) & 1);
        const me = pos.side;
        pos.make(m);
        if (pos.isAttacked(pos.king[me], pos.side)) { pos.unmake(m); continue; }
        const gives = pos.inCheck();
        if (gives && pos.pawnDropChecks(m) && !pos.hasLegalMove()) { pos.unmake(m); continue; }
        legal++;
        let v;
        if (legal === 1) v = -negamax(depth - 1, -beta, -alpha, ply + 1, true);
        else {
          const r = useLMR && depth >= 3 && legal > 4 && quiet && !inCheck && !gives ? (legal > 14 ? 2 : 1) : 0;
          v = -negamax(depth - 1 - r, -alpha - 1, -alpha, ply + 1, true);
          if (!stopped && r && v > alpha) v = -negamax(depth - 1, -alpha - 1, -alpha, ply + 1, true);
          if (!stopped && v > alpha && v < beta) v = -negamax(depth - 1, -beta, -alpha, ply + 1, true);
        }
        pos.unmake(m);
        if (stopped) return 0;
        if (v > best) {
          best = v; bestMove = m;
          if (v > alpha) {
            alpha = v;
            if (v >= beta) {
              if (quiet) {
                if (killers[ply * 2] !== m) { killers[ply * 2 + 1] = killers[ply * 2]; killers[ply * 2] = m; }
                hist[histIdx(m)] += depth * depth;
              }
              break;
            }
          }
        }
      }
      if (!legal) return -MATE + ply;
      if (useTT) {
        let s = best;
        if (s > MATE - 500) s += ply; else if (s < -MATE + 500) s -= ply;
        ttLo[ti] = pos.lo; ttHi[ti] = pos.hi; ttM[ti] = bestMove; ttS[ti] = s; ttD[ti] = depth;
        ttF[ti] = best >= beta ? LOWER : best > a0 ? EXACT : UPPER;
      }
      return best;
    }

    /* ---- root: iterative deepening ---- */
    const root = pos.legalMoves();
    if (!root.length) return { move: 0, score: -MATE, depth: 0, nodes: 0, ms: Date.now() - t0 };
    if (root.length === 1) return { move: root[0], score: 0, depth: 0, nodes: 1, ms: Date.now() - t0 };
    const rn = new Map();
    const rootNoise = cfg.rootNoise && (cfg.level <= 1 || pos.ply < 24) ? cfg.rootNoise : 0;
    root.forEach((m) => rn.set(m, rootNoise ? Math.round((rand() * 2 - 1) * rootNoise) : 0));
    { // initial order: captures first
      const sc = root.map((m) => { const cap = pos.board[(m >> 7) & 127]; return (cap ? CAPV[cap & 15] * 10 : 0) + ((m >> 14) & 1) * 300 + rn.get(m); });
      const idx = root.map((m, i) => i).sort((a, b) => sc[b] - sc[a]);
      const copy = idx.map((i) => root[i]);
      root.length = 0; root.push(...copy);
    }
    let best = root[0], bestScore = -INF, done = 0;
    const scores = new Map();
    for (let d = 1; d <= cfg.maxDepth; d++) {
      let alpha = -INF, iterBest = 0, iterScore = -INF;
      for (let i = 0; i < root.length; i++) {
        const m = root[i];
        pos.make(m);
        let v;
        if (i === 0) v = -negamax(d - 1, -INF, -alpha, 1, true);
        else {
          v = -negamax(d - 1, -alpha - 1, -alpha, 1, true);
          if (!stopped && v > alpha) v = -negamax(d - 1, -INF, -alpha, 1, true);
        }
        pos.unmake(m);
        if (stopped) break;
        v += rn.get(m);
        scores.set(m, v);
        if (v > iterScore) { iterScore = v; iterBest = m; if (v > alpha) alpha = v; }
      }
      if (stopped) { if (iterBest && iterScore > -INF) { best = iterBest; bestScore = iterScore; } break; }
      best = iterBest; bestScore = iterScore; done = d;
      root.sort((a, b) => (b === best) - (a === best) || (scores.get(b) || -INF) - (scores.get(a) || -INF));
      if (Math.abs(bestScore) > MATE - 500) break;
      if (Date.now() - t0 > cfg.timeMs * 0.45) break;
    }
    return { move: best, score: bestScore, depth: done, nodes, ms: Date.now() - t0 };
  }

  return { think, evaluate, LEVELS, MATE, VAL };
});
