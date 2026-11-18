/*
 * 喫茶しろくろ — リバーシのルール（純粋な JavaScript。ページ・Web Worker・Node で共通）
 *   盤: 10 × 10 の配列（外周は壁 = 3）。マス index = (行 + 1) * 10 + (列 + 1)、行・列は 0..7（a1 = 左上）。
 *   石: 0 = 空き、1 = 黒、2 = 白。黒が先手。
 *   着手: マスの index。PASS (= 0) はパス。
 *   ルール: 相手の石を 1 つ以上はさめるマスにだけ打て、はさんだ石（8 方向すべて）を裏返す。打てるマスがなければパス、
 *   両者とも打てなければ終局。石の多い方の勝ち（空きマスはどちらにも数えない）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ReversiRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EMPTY = 0, BLACK = 1, WHITE = 2, WALL = 3, PASS = 0;
  const DIRS = [-11, -10, -9, -1, 1, 9, 10, 11];
  const SQS = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) SQS.push((r + 1) * 10 + c + 1);
  const sq = (r, c) => (r + 1) * 10 + c + 1;
  const rowOf = (s) => ((s / 10) | 0) - 1, colOf = (s) => (s % 10) - 1;
  const name = (s) => (s === PASS ? 'パス' : 'abcdefgh'[colOf(s)] + (rowOf(s) + 1));

  function canPlay(b, s, me) {
    if (b[s] !== EMPTY) return false;
    const op = 3 - me;
    for (let i = 0; i < 8; i++) {
      const d = DIRS[i];
      let p = s + d;
      if (b[p] !== op) continue;
      p += d;
      while (b[p] === op) p += d;
      if (b[p] === me) return true;
    }
    return false;
  }
  /** fills out[] with the legal squares, returns the count */
  function genMoves(b, me, out) {
    let n = 0;
    for (let i = 0; i < 64; i++) { const s = SQS[i]; if (b[s] === EMPTY && canPlay(b, s, me)) out[n++] = s; }
    return n;
  }
  function hasMove(b, me) {
    for (let i = 0; i < 64; i++) { const s = SQS[i]; if (b[s] === EMPTY && canPlay(b, s, me)) return true; }
    return false;
  }
  /** plays s for me; the flipped squares go to fb[at..]; returns how many were flipped (0 = illegal, nothing changed) */
  function doMove(b, s, me, fb, at = 0) {
    const op = 3 - me;
    let n = 0;
    for (let i = 0; i < 8; i++) {
      const d = DIRS[i];
      let p = s + d, k = 0;
      while (b[p] === op) { p += d; k++; }
      if (k && b[p] === me) { p = s + d; while (b[p] === op) { b[p] = me; fb[at + n++] = p; p += d; } }
    }
    if (n) b[s] = me;
    return n;
  }
  function undoMove(b, s, me, fb, at, n) {
    const op = 3 - me;
    b[s] = EMPTY;
    for (let i = 0; i < n; i++) b[fb[at + i]] = op;
  }
  function count(b) {
    let x = 0, o = 0;
    for (let i = 0; i < 64; i++) { const v = b[SQS[i]]; if (v === BLACK) x++; else if (v === WHITE) o++; }
    return [x, o];
  }
  function initial() {
    const b = new Int8Array(100).fill(WALL);
    for (const s of SQS) b[s] = EMPTY;
    b[sq(3, 3)] = WHITE; b[sq(4, 4)] = WHITE; b[sq(3, 4)] = BLACK; b[sq(4, 3)] = BLACK;
    return b;
  }

  /** a game: the board, whose turn, history for undo */
  class Game {
    constructor() { this.b = initial(); this.side = BLACK; this.hist = []; this.lastFlips = []; }
    moves(me = this.side) { const out = new Int32Array(64), n = genMoves(this.b, me, out); return Array.from(out.subarray(0, n)); }
    canPlay(s) { return canPlay(this.b, s, this.side); }
    mustPass() { return !hasMove(this.b, this.side) && hasMove(this.b, 3 - this.side); }
    over() { return !hasMove(this.b, BLACK) && !hasMove(this.b, WHITE); }
    /** plays s (or PASS); returns the flipped squares */
    play(s) {
      const me = this.side;
      if (s === PASS) { this.hist.push({ s, me, flips: [] }); this.side = 3 - me; this.lastFlips = []; return []; }
      const fb = new Int32Array(24), n = doMove(this.b, s, me, fb, 0);
      if (!n) throw new Error('illegal move ' + name(s));
      const flips = Array.from(fb.subarray(0, n));
      this.hist.push({ s, me, flips });
      this.side = 3 - me;
      this.lastFlips = flips;
      return flips;
    }
    undo() {
      const h = this.hist.pop();
      if (!h) return null;
      if (h.s !== PASS) { this.b[h.s] = EMPTY; for (const f of h.flips) this.b[f] = 3 - h.me; }
      this.side = h.me;
      const prev = this.hist[this.hist.length - 1];
      this.lastFlips = prev ? prev.flips : [];
      return h;
    }
    count() { return count(this.b); }
    empties() { const [x, o] = count(this.b); return 64 - x - o; }
    last() { return this.hist.length ? this.hist[this.hist.length - 1] : null; }
  }

  /** perft: leaves at depth d; a forced pass is a move (a node) of its own; a finished game is a leaf */
  function perft(b, me, d, passed = false) {
    if (d === 0) return 1;
    const out = new Int32Array(64), n = genMoves(b, me, out);
    if (!n) {
      if (passed) return 1;
      return perft(b, 3 - me, d - 1, true);
    }
    if (d === 1) return n;
    const fb = new Int32Array(24);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const k = doMove(b, out[i], me, fb, 0), flips = Array.from(fb.subarray(0, k));
      total += perft(b, 3 - me, d - 1, false);
      b[out[i]] = EMPTY; for (const f of flips) b[f] = me ^ 3;
    }
    return total;
  }

  return { EMPTY, BLACK, WHITE, WALL, PASS, DIRS, SQS, sq, rowOf, colOf, name, canPlay, genMoves, hasMove, doMove, undoMove, count, initial, perft, Game };
});
