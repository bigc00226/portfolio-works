/*
 * 喫茶しろくろ — CPU の思考（Web Worker と Node で共通。rules.js の盤の上で動きます）
 *   think(board, me, { level, timeMs }) → { move, score, depth, nodes, ms, exact }
 *   level 0 入門: 重み付きのランダム（隅は選ばれやすく、隅の隣は選ばれにくい）
 *   level 1 初級: 欲張り（たくさん返す）＋ マスの位置の点数
 *   level 2 中級: 4 手先までのミニマックス（アルファベータ）。評価は着手可能数・隅・確定石・位置・開放度
 *   level 3 上級: 反復深化で 6〜10 手先まで（約 1.5 秒）＋ 残り 14 マス以下は最後まで読み切って石差を最大に
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rules.js'));
  else root.ReversiAI = factory(root.ReversiRules);
})(typeof self !== 'undefined' ? self : this, function (R) {
  'use strict';
  const { SQS, DIRS, EMPTY, BLACK, PASS, genMoves, doMove, undoMove, count } = R;
  const INF = 1e9, WIN = 100000;
  const T8 = [
    [120, -25, 20, 6, 6, 20, -25, 120],
    [-25, -45, -4, -3, -3, -4, -45, -25],
    [20, -4, 14, 3, 3, 14, -4, 20],
    [6, -3, 3, 2, 2, 3, -3, 6],
    [6, -3, 3, 2, 2, 3, -3, 6],
    [20, -4, 14, 3, 3, 14, -4, 20],
    [-25, -45, -4, -3, -3, -4, -45, -25],
    [120, -25, 20, 6, 6, 20, -25, 120],
  ];
  const WT = new Int32Array(100);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) WT[R.sq(r, c)] = T8[r][c];
  const CORNERS = [11, 18, 81, 88];
  // X / C squares → their corner (when the corner is taken they are no longer dangerous)
  const NEAR = new Int32Array(100);
  [[11, [12, 21, 22]], [18, [17, 28, 27]], [81, [71, 82, 72]], [88, [87, 78, 77]]].forEach(([c, l]) => l.forEach((s) => { NEAR[s] = c; }));
  // edges from each corner, for the stable-disc count
  const EDGES = [[11, 1], [11, 10], [18, -1], [18, 10], [81, 1], [81, -10], [88, -1], [88, -10]];

  function evaluate(b, me, mvBuf) {
    const op = 3 - me;
    let pos = 0, md = 0, od = 0, mf = 0, of = 0;
    for (let i = 0; i < 64; i++) {
      const s = SQS[i], v = b[s];
      if (!v) continue;
      let w = WT[s];
      if (NEAR[s] && b[NEAR[s]] !== EMPTY) w = 4;
      let front = false;
      for (let k = 0; k < 8; k++) if (b[s + DIRS[k]] === EMPTY) { front = true; break; }
      if (v === me) { pos += w; md++; if (front) mf++; } else { pos -= w; od++; if (front) of++; }
    }
    const mm = genMoves(b, me, mvBuf), om = genMoves(b, op, mvBuf);
    const mob = mm + om ? (100 * (mm - om)) / (mm + om + 2) : 0;
    let corner = 0;
    for (const c of CORNERS) { if (b[c] === me) corner++; else if (b[c] === op) corner--; }
    let stab = 0;
    for (const [c, d] of EDGES) {
      const v = b[c];
      if (!v) continue;
      let p = c, k = 0;
      while (b[p] === v && k < 7) { p += d; k++; }
      stab += v === me ? k : -k;
    }
    const empties = 64 - md - od;
    let s = pos + mob * 1.3 + corner * 30 + stab * 10 - (mf - of) * 6;
    if (empties < 18) s += (md - od) * (18 - empties) * 0.8;
    return s;
  }

  function finalDiff(b, me) { const [x, o] = count(b); return me === BLACK ? x - o : o - x; }

  function think(b0, me, opt = {}) {
    const t0 = Date.now(), level = opt.level == null ? 2 : opt.level;
    const b = Int8Array.from(b0);
    let seed = (opt.seed == null ? Math.random() * 2 ** 31 : opt.seed) | 0 || 9;
    const rand = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 100000) / 100000; };
    const root = new Int32Array(64), rn = genMoves(b, me, root);
    const done = (move, score, depth, nodes, exact) => ({ move, score, depth, nodes, exact: !!exact, ms: Date.now() - t0 });
    if (!rn) return done(PASS, 0, 0, 0);
    const moves = Array.from(root.subarray(0, rn));
    if (rn === 1 && level >= 2) return done(moves[0], 0, 0, 1);
    const fb = new Int32Array(64 * 64);

    if (level === 0) { // weighted random
      const w = moves.map((s) => Math.exp(WT[s] / 45));
      let r = rand() * w.reduce((a, x) => a + x, 0);
      for (let i = 0; i < rn; i++) { r -= w[i]; if (r <= 0) return done(moves[i], 0, 0, rn); }
      return done(moves[rn - 1], 0, 0, rn);
    }
    if (level === 1) { // greedy + position
      let best = moves[0], bs = -INF;
      for (const s of moves) {
        const k = doMove(b, s, me, fb, 0);
        undoMove(b, s, me, fb, 0, k);
        const v = k * 3 + WT[s] * 0.5 + rand() * 6;
        if (v > bs) { bs = v; best = s; }
      }
      return done(best, bs, 1, rn);
    }

    const timeMs = opt.timeMs || (level === 2 ? 2000 : 1600);
    let deadline = t0 + timeMs;
    let nodes = 0, stop = false;
    const bufs = [];
    for (let i = 0; i < 70; i++) bufs.push(new Int32Array(64));
    const evBuf = new Int32Array(64);
    const tick = () => { if ((++nodes & 2047) === 0 && Date.now() > deadline) stop = true; return stop; };
    const order = (mv, n) => { // static order: position weight
      for (let i = 1; i < n; i++) { const s = mv[i], w = WT[s]; let j = i - 1; while (j >= 0 && WT[mv[j]] < w) { mv[j + 1] = mv[j]; j--; } mv[j + 1] = s; }
    };

    function negamax(depth, alpha, beta, side, passed, ply) {
      if (tick()) return 0;
      if (depth <= 0) return evaluate(b, side, evBuf);
      const mv = bufs[ply], n = genMoves(b, side, mv);
      if (!n) {
        if (passed) { const d = finalDiff(b, side); return d > 0 ? WIN + d : d < 0 ? -WIN + d : 0; }
        return -negamax(depth - 1, -beta, -alpha, 3 - side, true, ply + 1);
      }
      order(mv, n);
      let best = -INF;
      for (let i = 0; i < n; i++) {
        const s = mv[i], k = doMove(b, s, side, fb, ply * 64);
        const v = -negamax(depth - 1, -beta, -alpha, 3 - side, false, ply + 1);
        undoMove(b, s, side, fb, ply * 64, k);
        if (stop) return 0;
        if (v > best) { best = v; if (v > alpha) { alpha = v; if (alpha >= beta) break; } }
      }
      return best;
    }

    /** exact endgame: the final disc difference for `side` with best play */
    function solve(alpha, beta, side, passed, ply, empties) {
      if (tick()) return 0;
      const mv = bufs[ply], n = genMoves(b, side, mv);
      if (!n) {
        if (passed || empties === 0) return finalDiff(b, side);
        return -solve(-beta, -alpha, 3 - side, true, ply + 1, empties);
      }
      if (empties > 6) { // fastest first: fewest replies for the opponent
        const sc = new Int32Array(n), tmp = bufs[ply + 1];
        for (let i = 0; i < n; i++) {
          const k = doMove(b, mv[i], side, fb, ply * 64);
          sc[i] = genMoves(b, 3 - side, tmp) * 16 - WT[mv[i]] / 8;
          undoMove(b, mv[i], side, fb, ply * 64, k);
        }
        for (let i = 1; i < n; i++) { const s = mv[i], v = sc[i]; let j = i - 1; while (j >= 0 && sc[j] > v) { mv[j + 1] = mv[j]; sc[j + 1] = sc[j]; j--; } mv[j + 1] = s; sc[j + 1] = v; }
      } else order(mv, n);
      let best = -INF;
      for (let i = 0; i < n; i++) {
        const s = mv[i], k = doMove(b, s, side, fb, ply * 64);
        const v = -solve(-beta, -alpha, 3 - side, false, ply + 1, empties - 1);
        undoMove(b, s, side, fb, ply * 64, k);
        if (stop) return 0;
        if (v > best) { best = v; if (v > alpha) { alpha = v; if (alpha >= beta) break; } }
      }
      return best;
    }

    const empties = 64 - count(b).reduce((a, x) => a + x, 0);
    // shuffle, then order by position, so equal moves vary from game to game
    for (let i = moves.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [moves[i], moves[j]] = [moves[j], moves[i]]; }
    moves.sort((a, c) => WT[c] - WT[a]);

    if (level >= 3 && empties <= (opt.solveAt || 14)) {
      deadline = t0 + (opt.solveMs || 3500);
      let best = moves[0], bs = -INF, alpha = -65;
      for (const s of moves) {
        const k = doMove(b, s, me, fb, 0);
        const v = -solve(-65, -alpha, 3 - me, false, 1, empties - 1);
        undoMove(b, s, me, fb, 0, k);
        if (stop) break;
        if (v > bs) { bs = v; best = s; if (v > alpha) alpha = v; }
      }
      if (!stop) return done(best, bs, empties, nodes, true);
      stop = false; deadline = Date.now() + timeMs * 0.6;
    }

    const maxDepth = level === 2 ? 4 : Math.min(opt.maxDepth || 10, empties);
    let best = moves[0], bestScore = -INF, depthDone = 0;
    for (let d = 1; d <= maxDepth; d++) {
      let alpha = -INF, iterBest = 0, iterScore = -INF;
      const scores = new Map();
      for (const s of moves) {
        const k = doMove(b, s, me, fb, 0);
        const v = -negamax(d - 1, -INF, -alpha, 3 - me, false, 1);
        undoMove(b, s, me, fb, 0, k);
        if (stop) break;
        scores.set(s, v);
        if (v > iterScore) { iterScore = v; iterBest = s; if (v > alpha) alpha = v; }
      }
      if (stop) { if (level === 2 && iterBest) { best = iterBest; bestScore = iterScore; } break; }
      best = iterBest; bestScore = iterScore; depthDone = d;
      moves.sort((a, c) => (c === best) - (a === best) || (scores.get(c) || -INF) - (scores.get(a) || -INF));
      if (Math.abs(bestScore) >= WIN) break;
      if (level >= 3 && Date.now() - t0 > timeMs * 0.4) break;
    }
    return done(best, bestScore, depthDone, nodes, false);
  }

  return { think, evaluate, WT, WIN };
});
