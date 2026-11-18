/*
 * 縁側将棋 — 本将棋のルール（純粋な JavaScript。ページ・Web Worker・Node で共通に使います）
 *
 *   盤: 81 マス、index = y * 9 + x。x = 0..8 は 9筋..1筋（先手から見て左 → 右）、y = 0..8 は 一段..九段。
 *   駒: type | color << 4（color 0 = 先手 ▲ BLACK、1 = 後手 △ WHITE）、0 = 空き。
 *   指し手（整数）: from | to << 7 | promote << 14。駒打ちは from = 80 + 駒の種類。
 *
 *   採用したルール: 成り（敵陣に入る・敵陣の中・敵陣から出る手で任意。行き所のない駒は強制）、二歩、打ち歩詰め、
 *   行き所のない駒の打ち禁止、自玉を王手にさらす手の禁止、詰み、千日手（同一局面〔盤・持ち駒・手番〕4 回で引き分け。
 *   一方の指し手がすべて王手なら、王手をかけ続けた側の負け）。持将棋（入玉宣言）は扱わず、512 手で引き分けにします。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShogiRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const FU = 1, KY = 2, KE = 3, GI = 4, KI = 5, KA = 6, HI = 7, OU = 8, TO = 9, NY = 10, NK = 11, NG = 12, UM = 14, RY = 15;
  const BLACK = 0, WHITE = 1;
  const DROP = 80;
  const MAXPLY = 4096;
  const MAX_MOVES = 512;

  /* ---------- move tables ---------- */
  const DIRS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]; // N NE E SE S SW W NW (先手から見て)
  const N = 0, NE = 1, E = 2, SE = 3, S = 4, SW = 5, W = 6, NW = 7;
  const GOLD = [N, NE, NW, E, W, S];
  const STEP_DIRS = { 1: [N], 4: [N, NE, NW, SE, SW], 5: GOLD, 8: [N, NE, E, SE, S, SW, W, NW], 9: GOLD, 10: GOLD, 11: GOLD, 12: GOLD, 14: [N, E, S, W], 15: [NE, SE, SW, NW] };
  const SLIDE_DIRS = { 2: [N], 6: [NE, SE, SW, NW], 7: [N, E, S, W], 14: [NE, SE, SW, NW], 15: [N, E, S, W] };
  const CAN_PROMOTE = [false, true, true, true, true, false, true, true, false, false, false, false, false, false, false, false];
  const BASE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 0, 6, 7]; // 成駒 → 元の駒（持ち駒になるとき）

  const STEP_TO = [], RAYS = [], STEP_MASK = new Int32Array(32), SLIDE_MASK = new Int32Array(32);
  const bit = (dx, dy) => 1 << ((dy + 1) * 3 + dx + 1);
  for (let c = 0; c < 2; c++) {
    for (let t = 1; t <= 15; t++) {
      if (t === 13) continue;
      const p = t | (c << 4), sg = c ? -1 : 1;
      const steps = (STEP_DIRS[t] || []).map((d) => [DIRS[d][0], DIRS[d][1] * sg]);
      const jumps = t === KE ? [[1, -2 * sg], [-1, -2 * sg]] : [];
      const slides = (SLIDE_DIRS[t] || []).map((d) => [DIRS[d][0], DIRS[d][1] * sg]);
      steps.forEach(([dx, dy]) => { STEP_MASK[p] |= bit(dx, dy); });
      slides.forEach(([dx, dy]) => { SLIDE_MASK[p] |= bit(dx, dy); });
      STEP_TO[p] = []; RAYS[p] = [];
      for (let sq = 0; sq < 81; sq++) {
        const x = sq % 9, y = (sq / 9) | 0, st = [], rs = [];
        for (const [dx, dy] of steps.concat(jumps)) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) st.push(ny * 9 + nx); }
        for (const [dx, dy] of slides) {
          const r = [];
          let nx = x + dx, ny = y + dy;
          while (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) { r.push(ny * 9 + nx); nx += dx; ny += dy; }
          if (r.length) rs.push(Int8Array.from(r));
        }
        STEP_TO[p][sq] = Int8Array.from(st);
        RAYS[p][sq] = rs;
      }
    }
  }

  /* ---------- zobrist hashing (two 32-bit halves) ---------- */
  let seed = 0x2545f491;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
  const ZP_LO = new Int32Array(32 * 81), ZP_HI = new Int32Array(32 * 81), ZH_LO = new Int32Array(16 * 20), ZH_HI = new Int32Array(16 * 20);
  for (let i = 0; i < ZP_LO.length; i++) { ZP_LO[i] = rnd(); ZP_HI[i] = rnd(); }
  for (let i = 0; i < ZH_LO.length; i++) { ZH_LO[i] = rnd(); ZH_HI[i] = rnd(); }
  const ZS_LO = rnd(), ZS_HI = rnd();

  /* ---------- notation ---------- */
  const ZEN = '０１２３４５６７８９', KAN = '〇一二三四五六七八九';
  const NAME = ['', '歩', '香', '桂', '銀', '金', '角', '飛', '玉', 'と', '成香', '成桂', '成銀', '', '馬', '龍'];
  const DISP = ['', '歩', '香', '桂', '銀', '金', '角', '飛', '玉', 'と', '杏', '圭', '全', '', '馬', '龍'];
  const SFEN_CH = ['', 'P', 'L', 'N', 'S', 'G', 'B', 'R', 'K'];
  const SFEN_T = { P: FU, L: KY, N: KE, S: GI, G: KI, B: KA, R: HI, K: OU };

  const mFrom = (m) => m & 127, mTo = (m) => (m >> 7) & 127, mPromo = (m) => (m >> 14) & 1;
  const isDrop = (m) => (m & 127) > DROP;
  const mk = (from, to, pr) => from | (to << 7) | (pr ? 1 << 14 : 0);

  class Position {
    constructor() {
      this.board = new Int8Array(81);
      this.hand = new Int8Array(16); // [color * 8 + type]
      this.side = BLACK;
      this.king = new Int8Array([-1, -1]);
      this.lo = 0; this.hi = 0; this.ply = 0;
      this.caps = new Int8Array(MAXPLY);
      this.hlo = new Int32Array(MAXPLY);
      this.hhi = new Int32Array(MAXPLY);
      this.bufs = [];
    }

    static fromSFEN(sfen) {
      const pos = new Position();
      const [bd, side, hands] = sfen.trim().split(/\s+/);
      const rows = bd.split('/');
      for (let y = 0; y < 9; y++) {
        let x = 0, promo = false;
        for (const ch of rows[y]) {
          if (ch === '+') { promo = true; continue; }
          if (/\d/.test(ch)) { x += +ch; continue; }
          const up = ch.toUpperCase(), c = ch === up ? BLACK : WHITE;
          let t = SFEN_T[up];
          if (promo) t += 8;
          pos.board[y * 9 + x] = t | (c << 4);
          if (t === OU) pos.king[c] = y * 9 + x;
          x++; promo = false;
        }
      }
      pos.side = side === 'w' ? WHITE : BLACK;
      if (hands && hands !== '-') {
        let num = '';
        for (const ch of hands) {
          if (/\d/.test(ch)) { num += ch; continue; }
          const up = ch.toUpperCase(), c = ch === up ? BLACK : WHITE;
          pos.hand[c * 8 + SFEN_T[up]] += num ? +num : 1;
          num = '';
        }
      }
      pos.rehash();
      return pos;
    }

    toSFEN(moveNo = 1) {
      const rows = [];
      for (let y = 0; y < 9; y++) {
        let s = '', e = 0;
        for (let x = 0; x < 9; x++) {
          const p = this.board[y * 9 + x];
          if (!p) { e++; continue; }
          if (e) { s += e; e = 0; }
          const t = p & 15, c = p >> 4;
          let ch = SFEN_CH[t > 8 ? t - 8 : t];
          if (c) ch = ch.toLowerCase();
          s += (t > 8 ? '+' : '') + ch;
        }
        if (e) s += e;
        rows.push(s);
      }
      let h = '';
      for (const c of [BLACK, WHITE]) for (const t of [HI, KA, KI, GI, KE, KY, FU]) {
        const n = this.hand[c * 8 + t];
        if (n) h += (n > 1 ? n : '') + (c ? SFEN_CH[t].toLowerCase() : SFEN_CH[t]);
      }
      return `${rows.join('/')} ${this.side ? 'w' : 'b'} ${h || '-'} ${moveNo}`;
    }

    clone() {
      const p = Position.fromSFEN(this.toSFEN());
      return p;
    }

    rehash() {
      let lo = 0, hi = 0;
      for (let sq = 0; sq < 81; sq++) { const p = this.board[sq]; if (p) { lo ^= ZP_LO[p * 81 + sq]; hi ^= ZP_HI[p * 81 + sq]; } }
      for (let i = 0; i < 16; i++) { const n = this.hand[i]; lo ^= ZH_LO[i * 20 + n]; hi ^= ZH_HI[i * 20 + n]; }
      if (this.side) { lo ^= ZS_LO; hi ^= ZS_HI; }
      this.lo = lo; this.hi = hi;
    }

    buf() { return this.bufs[this.ply] || (this.bufs[this.ply] = new Int32Array(1024)); }

    /** is sq attacked by a piece of color `by`? */
    isAttacked(sq, by) {
      if (sq < 0) return false;
      const b = this.board, x0 = sq % 9, y0 = (sq / 9) | 0;
      for (let d = 0; d < 8; d++) {
        const dx = DIRS[d][0], dy = DIRS[d][1];
        let x = x0 + dx, y = y0 + dy, k = 1;
        while (x >= 0 && x < 9 && y >= 0 && y < 9) {
          const p = b[y * 9 + x];
          if (p) {
            if ((p >> 4) === by) {
              const bt = 1 << ((1 - dy) * 3 + 1 - dx); // the piece moves by (-dx, -dy) to reach sq
              if ((k === 1 && (STEP_MASK[p] & bt)) || (SLIDE_MASK[p] & bt)) return true;
            }
            break;
          }
          x += dx; y += dy; k++;
        }
      }
      const ky = by === BLACK ? y0 + 2 : y0 - 2;
      if (ky >= 0 && ky < 9) {
        const kn = KE | (by << 4);
        if (x0 > 0 && b[ky * 9 + x0 - 1] === kn) return true;
        if (x0 < 8 && b[ky * 9 + x0 + 1] === kn) return true;
      }
      return false;
    }

    inCheck(c = this.side) { return this.isAttacked(this.king[c], c ^ 1); }

    addBoardMoves(out, n, from, to, t, c) {
      if (CAN_PROMOTE[t]) {
        const fy = (from / 9) | 0, ty = (to / 9) | 0;
        const zone = c === BLACK ? (fy <= 2 || ty <= 2) : (fy >= 6 || ty >= 6);
        if (zone) {
          out[n++] = from | (to << 7) | 16384;
          const rel = c === BLACK ? ty : 8 - ty;
          if (!(((t === FU || t === KY) && rel === 0) || (t === KE && rel <= 1))) out[n++] = from | (to << 7);
          return n;
        }
      }
      out[n++] = from | (to << 7);
      return n;
    }

    /** pseudo-legal moves (drops obey 二歩 and 行き所; king safety / 打ち歩詰め are checked by isLegal) */
    genMoves(out) {
      const b = this.board, c = this.side;
      let n = 0;
      for (let sq = 0; sq < 81; sq++) {
        const p = b[sq];
        if (!p || (p >> 4) !== c) continue;
        const t = p & 15, st = STEP_TO[p][sq];
        for (let i = 0; i < st.length; i++) {
          const to = st[i], q = b[to];
          if (q && (q >> 4) === c) continue;
          n = this.addBoardMoves(out, n, sq, to, t, c);
        }
        const rays = RAYS[p][sq];
        for (let r = 0; r < rays.length; r++) {
          const ray = rays[r];
          for (let i = 0; i < ray.length; i++) {
            const to = ray[i], q = b[to];
            if (q && (q >> 4) === c) break;
            n = this.addBoardMoves(out, n, sq, to, t, c);
            if (q) break;
          }
        }
      }
      const h = this.hand, base = c * 8;
      let any = 0;
      for (let t = 1; t <= 7; t++) any |= h[base + t];
      if (!any) return n;
      let pawnFiles = 0;
      if (h[base + FU]) {
        const fu = FU | (c << 4);
        for (let sq = 0; sq < 81; sq++) if (b[sq] === fu) pawnFiles |= 1 << (sq % 9);
      }
      for (let to = 0; to < 81; to++) {
        if (b[to]) continue;
        const y = (to / 9) | 0, rel = c === BLACK ? y : 8 - y;
        for (let t = 7; t >= 1; t--) {
          if (!h[base + t]) continue;
          if ((t === FU || t === KY) && rel === 0) continue;
          if (t === KE && rel <= 1) continue;
          if (t === FU && (pawnFiles >> (to % 9)) & 1) continue;
          out[n++] = (DROP + t) | (to << 7);
        }
      }
      return n;
    }

    /** captures only (with promotion when it is possible), for the quiescence search */
    genCaptures(out) {
      const b = this.board, c = this.side;
      let n = 0;
      for (let sq = 0; sq < 81; sq++) {
        const p = b[sq];
        if (!p || (p >> 4) !== c) continue;
        const t = p & 15, st = STEP_TO[p][sq];
        for (let i = 0; i < st.length; i++) {
          const to = st[i], q = b[to];
          if (q && (q >> 4) !== c) n = this.addBoardMoves(out, n, sq, to, t, c);
        }
        const rays = RAYS[p][sq];
        for (let r = 0; r < rays.length; r++) {
          const ray = rays[r];
          for (let i = 0; i < ray.length; i++) {
            const q = b[ray[i]];
            if (!q) continue;
            if ((q >> 4) !== c) n = this.addBoardMoves(out, n, sq, ray[i], t, c);
            break;
          }
        }
      }
      return n;
    }

    make(m) {
      const from = m & 127, to = (m >> 7) & 127, c = this.side, b = this.board, ply = this.ply;
      let lo = this.lo, hi = this.hi;
      this.hlo[ply] = lo; this.hhi[ply] = hi;
      if (from > DROP) {
        const t = from - DROP, p = t | (c << 4), hx = c * 8 + t, n = this.hand[hx];
        lo ^= ZH_LO[hx * 20 + n] ^ ZH_LO[hx * 20 + n - 1]; hi ^= ZH_HI[hx * 20 + n] ^ ZH_HI[hx * 20 + n - 1];
        this.hand[hx] = n - 1;
        b[to] = p; lo ^= ZP_LO[p * 81 + to]; hi ^= ZP_HI[p * 81 + to];
        this.caps[ply] = 0;
      } else {
        const p = b[from], cap = b[to];
        this.caps[ply] = cap;
        lo ^= ZP_LO[p * 81 + from]; hi ^= ZP_HI[p * 81 + from];
        b[from] = 0;
        if (cap) {
          lo ^= ZP_LO[cap * 81 + to]; hi ^= ZP_HI[cap * 81 + to];
          const hx = c * 8 + BASE[cap & 15], n = this.hand[hx];
          lo ^= ZH_LO[hx * 20 + n] ^ ZH_LO[hx * 20 + n + 1]; hi ^= ZH_HI[hx * 20 + n] ^ ZH_HI[hx * 20 + n + 1];
          this.hand[hx] = n + 1;
        }
        const np = (m & 16384) ? p + 8 : p;
        b[to] = np; lo ^= ZP_LO[np * 81 + to]; hi ^= ZP_HI[np * 81 + to];
        if ((p & 15) === OU) this.king[c] = to;
      }
      this.lo = lo ^ ZS_LO; this.hi = hi ^ ZS_HI;
      this.side = c ^ 1;
      this.ply = ply + 1;
    }

    unmake(m) {
      const ply = --this.ply, c = this.side ^ 1, b = this.board, from = m & 127, to = (m >> 7) & 127;
      this.side = c;
      if (from > DROP) {
        b[to] = 0;
        this.hand[c * 8 + from - DROP]++;
      } else {
        const np = b[to], p = (m & 16384) ? np - 8 : np, cap = this.caps[ply];
        b[from] = p; b[to] = cap;
        if (cap) this.hand[c * 8 + BASE[cap & 15]]--;
        if ((p & 15) === OU) this.king[c] = from;
      }
      this.lo = this.hlo[ply]; this.hi = this.hhi[ply];
    }

    makeNull() { const ply = this.ply; this.hlo[ply] = this.lo; this.hhi[ply] = this.hi; this.caps[ply] = 0; this.lo ^= ZS_LO; this.hi ^= ZS_HI; this.side ^= 1; this.ply = ply + 1; }
    unmakeNull() { const ply = --this.ply; this.side ^= 1; this.lo = this.hlo[ply]; this.hi = this.hhi[ply]; }

    /** does a pawn drop m (already made) give check? */
    pawnDropChecks(m) {
      if ((m & 127) !== DROP + FU) return false;
      const to = (m >> 7) & 127, mover = this.side ^ 1;
      return this.king[this.side] === (mover === BLACK ? to - 9 : to + 9);
    }

    /** any move that does not leave the own king in check (used for the 打ち歩詰め test; a pawn drop never answers a pawn check) */
    hasLegalMove() {
      const buf = this.buf(), n = this.genMoves(buf), c = this.side;
      for (let i = 0; i < n; i++) {
        const m = buf[i];
        this.make(m);
        const ok = !this.isAttacked(this.king[c], c ^ 1);
        this.unmake(m);
        if (ok) return true;
      }
      return false;
    }

    isLegal(m) {
      const c = this.side;
      this.make(m);
      let ok = !this.isAttacked(this.king[c], c ^ 1);
      if (ok && this.pawnDropChecks(m) && !this.hasLegalMove()) ok = false; // 打ち歩詰め
      this.unmake(m);
      return ok;
    }

    legalMoves() {
      const buf = this.buf(), n = this.genMoves(buf), res = [];
      const copy = Array.from(buf.subarray(0, n));
      for (const m of copy) if (this.isLegal(m)) res.push(m);
      return res;
    }

    perft(depth) {
      const buf = this.buf(), n = this.genMoves(buf), moves = Array.from(buf.subarray(0, n)), c = this.side;
      let count = 0;
      for (const m of moves) {
        this.make(m);
        if (!this.isAttacked(this.king[c], c ^ 1) && !(this.pawnDropChecks(m) && !this.hasLegalMove())) count += depth <= 1 ? 1 : this.perft(depth - 1);
        this.unmake(m);
      }
      return count;
    }

    /** the 棋譜 notation of m (before it is made), e.g. "７六歩", "同　銀成", "５八金右", "４五桂打" */
    notation(m, prevTo = -1) {
      const from = m & 127, to = (m >> 7) & 127, c = this.side, x = to % 9, y = (to / 9) | 0;
      const t = from > DROP ? from - DROP : this.board[from] & 15;
      const name = NAME[t];
      const dest = to === prevTo ? '同' + (name.length === 1 ? '　' : '') : ZEN[9 - x] + KAN[y + 1];
      const legal = this.legalMoves();
      if (from > DROP) {
        const amb = legal.some((o) => (o & 127) <= DROP && ((o >> 7) & 127) === to && (this.board[o & 127] & 15) === t);
        return dest + name + (amb ? '打' : '');
      }
      const p = this.board[from];
      const others = [...new Set(legal.filter((o) => (o & 127) <= DROP && ((o >> 7) & 127) === to && (o & 127) !== from && this.board[o & 127] === p).map((o) => o & 127))];
      let rel = '';
      if (others.length) {
        const fwd = (s) => (c === BLACK ? 1 : -1) * (((s / 9) | 0) - y);
        const mot = (s) => (fwd(s) > 0 ? '上' : fwd(s) === 0 ? '寄' : '引');
        const right = (s) => (c === BLACK ? s % 9 : 8 - (s % 9));
        const my = mot(from), same = others.filter((o) => mot(o) === my), rf = right(from);
        if (!same.length) rel = my;
        else if ([GI, KI, TO, NY, NK, NG].includes(t) && from % 9 === x && fwd(from) === 1) rel = '直';
        else if (others.every((o) => rf > right(o))) rel = '右';
        else if (others.every((o) => rf < right(o))) rel = '左';
        else if (same.every((o) => rf > right(o))) rel = '右' + my;
        else if (same.every((o) => rf < right(o))) rel = '左' + my;
        else rel = my;
      }
      let promo = '';
      if (CAN_PROMOTE[t]) {
        const fy = (from / 9) | 0;
        if (c === BLACK ? (fy <= 2 || y <= 2) : (fy >= 6 || y >= 6)) promo = (m & 16384) ? '成' : '不成';
      }
      return dest + name + rel + promo;
    }
  }

  const usiSq = (s) => `${9 - (s % 9)}${'abcdefghi'[(s / 9) | 0]}`;
  function toUSI(m) {
    const from = m & 127, to = (m >> 7) & 127;
    if (from > DROP) return `${SFEN_CH[from - DROP]}*${usiSq(to)}`;
    return usiSq(from) + usiSq(to) + ((m & 16384) ? '+' : '');
  }
  function fromUSI(s) {
    const sq = (f, r) => (r.charCodeAt(0) - 97) * 9 + (9 - +f);
    if (s[1] === '*') return (DROP + SFEN_T[s[0]]) | (sq(s[2], s[3]) << 7);
    return sq(s[0], s[1]) | (sq(s[2], s[3]) << 7) | (s[4] === '+' ? 16384 : 0);
  }

  /* ---------- 手合い（駒落ちは上手 = 後手△の駒を落とし、上手から指します） ---------- */
  const HIRATE = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';
  const LOWER = 'ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
  const HANDICAPS = {
    hirate: { name: '平手', sfen: HIRATE },
    kyo: { name: '香落ち', sfen: 'lnsgkgsn1/1r5b1/' + LOWER },
    kaku: { name: '角落ち', sfen: 'lnsgkgsnl/1r7/' + LOWER },
    hisha: { name: '飛車落ち', sfen: 'lnsgkgsnl/7b1/' + LOWER },
    nimai: { name: '二枚落ち', sfen: 'lnsgkgsnl/9/' + LOWER },
    yonmai: { name: '四枚落ち', sfen: '1nsgkgsn1/9/' + LOWER },
    rokumai: { name: '六枚落ち', sfen: '2sgkgs2/9/' + LOWER },
  };

  /* ---------- a game: moves, 棋譜, end of the game ---------- */
  class Game {
    constructor(sfen = HIRATE) {
      this.startSfen = sfen;
      this.pos = Position.fromSFEN(sfen);
      this.firstSide = this.pos.side;
      this.moves = []; this.notes = []; this.movers = []; this.checks = [];
      this.keys = [this.key()];
    }
    key() { return this.pos.lo + ',' + this.pos.hi; }
    legal() { return this.pos.legalMoves(); }
    lastTo() { return this.moves.length ? (this.moves[this.moves.length - 1] >> 7) & 127 : -1; }
    play(m) {
      const note = (this.pos.side ? '△' : '▲') + this.pos.notation(m, this.lastTo());
      this.movers.push(this.pos.side);
      this.pos.make(m);
      this.moves.push(m); this.notes.push(note);
      this.checks.push(this.pos.inCheck());
      this.keys.push(this.key());
      return note;
    }
    undo() {
      if (!this.moves.length) return 0;
      const m = this.moves.pop();
      this.pos.unmake(m);
      this.notes.pop(); this.movers.pop(); this.checks.pop(); this.keys.pop();
      return m;
    }
    /** { over, winner (0/1, -1 = draw), reason: 'mate' | 'sennichite' | 'perpetual' | 'maxmoves', check } */
    status() {
      const pos = this.pos;
      if (!pos.legalMoves().length) return { over: true, winner: pos.side ^ 1, reason: 'mate' };
      const k = this.keys[this.keys.length - 1], idx = [];
      this.keys.forEach((kk, i) => { if (kk === k) idx.push(i); });
      if (idx.length >= 4) {
        const i0 = idx[idx.length - 4];
        for (const s of [BLACK, WHITE]) {
          let any = false, all = true;
          for (let j = i0; j < this.moves.length; j++) if (this.movers[j] === s) { any = true; if (!this.checks[j]) all = false; }
          if (any && all) return { over: true, winner: s ^ 1, reason: 'perpetual' };
        }
        return { over: true, winner: -1, reason: 'sennichite' };
      }
      if (this.moves.length >= MAX_MOVES) return { over: true, winner: -1, reason: 'maxmoves' };
      return { over: false, check: pos.inCheck() };
    }
    /** position after the first n moves (for 棋譜の再生) */
    positionAt(n) {
      const p = Position.fromSFEN(this.startSfen);
      for (let i = 0; i < n && i < this.moves.length; i++) p.make(this.moves[i]);
      return p;
    }
  }

  return {
    T: { FU, KY, KE, GI, KI, KA, HI, OU, TO, NY, NK, NG, UM, RY },
    BLACK, WHITE, DROP, MAX_MOVES, CAN_PROMOTE, BASE, NAME, DISP, STEP_TO, RAYS, ZEN, KAN,
    HIRATE, HANDICAPS, Position, Game, toUSI, fromUSI, mFrom, mTo, mPromo, isDrop, mk,
  };
});
