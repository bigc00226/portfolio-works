/*
 * ナンプレ帖 — puzzle core (pure: no DOM). Browser global NP, Worker importScripts('sudoku.js'), Node require().
 *
 *   NP.countSolutions(grid, limit, out)   backtracking (bitmasks, fewest-candidates first); out receives the first solution
 *   NP.generate(level, seed, opts)        a puzzle with ONE solution, 180° symmetric givens, graded exactly `level` (1–4)
 *   NP.grade(grid, maxTier)               solve like a person (simplest technique first) → { solved, tier, score, steps, techs }
 *   NP.hint(values)                       the next logical step from a position → { chain: [eliminations…], step: placement }
 *   NP.describe(step)                     Japanese explanation of a step
 *
 * Tiers: 1 singles · 2 pointing / claiming / naked & hidden pairs · 3 triples, X-Wing · 4 Swordfish, XY-Wing, XYZ-Wing, quads.
 * Level = the hardest tier the puzzle needs (かんたん 1 · ふつう 2 · むずかしい 3 · 達人 4).
 */
(function (root, factory) {
  const NP = factory();
  if (typeof module === 'object' && module.exports) module.exports = NP;
  else root.NP = NP;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- geometry ---------- */
  const R = new Uint8Array(81), C = new Uint8Array(81), B = new Uint8Array(81);
  for (let i = 0; i < 81; i++) { R[i] = (i / 9) | 0; C[i] = i % 9; B[i] = ((R[i] / 3) | 0) * 3 + ((C[i] / 3) | 0); }
  const HOUSES = [];
  for (let r = 0; r < 9; r++) HOUSES.push(Array.from({ length: 9 }, (_, k) => r * 9 + k));
  for (let c = 0; c < 9; c++) HOUSES.push(Array.from({ length: 9 }, (_, k) => k * 9 + c));
  for (let b = 0; b < 9; b++) {
    const r0 = ((b / 3) | 0) * 3, c0 = (b % 3) * 3;
    HOUSES.push(Array.from({ length: 9 }, (_, k) => (r0 + ((k / 3) | 0)) * 9 + c0 + (k % 3)));
  }
  const PEERS = [], PEER = new Uint8Array(81 * 81);
  for (let i = 0; i < 81; i++) {
    const s = new Set();
    for (const h of [R[i], 9 + C[i], 18 + B[i]]) for (const j of HOUSES[h]) if (j !== i) s.add(j);
    PEERS.push([...s]);
    for (const j of s) PEER[i * 81 + j] = 1;
  }
  const sees = (a, b) => PEER[a * 81 + b] === 1;
  const POP = new Uint8Array(512), DIGS = [];
  for (let m = 0; m < 512; m++) { const ds = []; for (let d = 1; d <= 9; d++) if (m & (1 << (d - 1))) ds.push(d); POP[m] = ds.length; DIGS.push(ds); }
  const bit = (d) => 1 << (d - 1);
  const digitOf = (b) => 32 - Math.clz32(b);

  /* ---------- seeded random (mulberry32) ---------- */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.int = (n) => Math.floor(r() * n);
    r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
    return r;
  }

  /* ---------- brute force ---------- */
  const toArr = (g) => (typeof g === 'string' ? Array.from(g, (ch) => (ch >= '1' && ch <= '9' ? +ch : 0)) : g);
  const toStr = (g) => Array.from(g, (d) => (d ? String(d) : '.')).join('');

  /** number of solutions, stopping at `limit`; `out` (length 81) receives the first one */
  function countSolutions(grid, limit = 2, out = null) {
    grid = toArr(grid);
    const a = new Uint8Array(81), rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9), emp = [];
    for (let i = 0; i < 81; i++) {
      const d = grid[i] | 0;
      if (d) {
        const b = bit(d);
        if ((rm[R[i]] | cm[C[i]] | bm[B[i]]) & b) return 0;
        rm[R[i]] |= b; cm[C[i]] |= b; bm[B[i]] |= b; a[i] = d;
      } else emp.push(i);
    }
    const n = emp.length;
    let count = 0;
    const rec = (k) => {
      if (k === n) { count++; if (out && count === 1) for (let i = 0; i < 81; i++) out[i] = a[i]; return count >= limit; }
      let bj = k, bmask = 0, bc = 10;
      for (let j = k; j < n; j++) {
        const i = emp[j], m = ~(rm[R[i]] | cm[C[i]] | bm[B[i]]) & 511, c = POP[m];
        if (c < bc) { bc = c; bj = j; bmask = m; if (c < 2) break; }
      }
      if (bc === 0) return false;
      const t = emp[k]; emp[k] = emp[bj]; emp[bj] = t;
      const i = emp[k], r = R[i], c = C[i], x = B[i];
      let m = bmask;
      while (m) {
        const b = m & -m; m ^= b;
        a[i] = digitOf(b); rm[r] |= b; cm[c] |= b; bm[x] |= b;
        if (rec(k + 1)) return true;
        rm[r] ^= b; cm[c] ^= b; bm[x] ^= b;
      }
      a[i] = 0;
      return false;
    };
    rec(0);
    return count;
  }

  /** a random complete grid */
  function randomSolution(r) {
    const a = new Uint8Array(81), rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9);
    const emp = Array.from({ length: 81 }, (_, i) => i);
    const rec = (k) => {
      if (k === 81) return true;
      let bj = k, bmask = 0, bc = 10;
      for (let j = k; j < 81; j++) {
        const i = emp[j], m = ~(rm[R[i]] | cm[C[i]] | bm[B[i]]) & 511, c = POP[m];
        if (c < bc) { bc = c; bj = j; bmask = m; if (c < 2) break; }
      }
      if (bc === 0) return false;
      const t = emp[k]; emp[k] = emp[bj]; emp[bj] = t;
      const i = emp[k];
      for (const d of r.shuffle(DIGS[bmask].slice())) {
        const b = bit(d);
        a[i] = d; rm[R[i]] |= b; cm[C[i]] |= b; bm[B[i]] |= b;
        if (rec(k + 1)) return true;
        rm[R[i]] ^= b; cm[C[i]] ^= b; bm[B[i]] ^= b;
      }
      a[i] = 0;
      return false;
    };
    rec(0);
    return a;
  }

  /* ---------- human-style logic ---------- */
  function makeState(values) {
    values = toArr(values);
    const v = Uint8Array.from(values), c = new Uint16Array(81);
    for (let i = 0; i < 81; i++) {
      if (v[i]) continue;
      let m = 511;
      for (const p of PEERS[i]) if (v[p]) m &= ~bit(v[p]);
      c[i] = m;
    }
    return { v, c };
  }
  function place(st, i, d) {
    st.v[i] = d; st.c[i] = 0;
    const b = ~bit(d);
    for (const p of PEERS[i]) st.c[p] &= b;
  }
  function apply(st, step) {
    if (step.place) place(st, step.place[0], step.place[1]);
    if (step.elim) for (const [i, m] of step.elim) st.c[i] &= ~m;
  }
  const houseKind = (h) => (h < 9 ? 'row' : h < 18 ? 'col' : 'box');

  function* combos(arr, n, start = 0, acc = []) {
    if (acc.length === n) { yield acc.slice(); return; }
    for (let i = start; i <= arr.length - (n - acc.length); i++) { acc.push(arr[i]); yield* combos(arr, n, i + 1, acc); acc.pop(); }
  }

  const HOUSE_ORDER = [18, 19, 20, 21, 22, 23, 24, 25, 26, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  function hiddenSingle(st) {
    for (const h of HOUSE_ORDER) {
      for (let d = 1; d <= 9; d++) {
        const b = bit(d);
        let only = -1, n = 0;
        for (const i of HOUSES[h]) if (!st.v[i] && st.c[i] & b) { n++; only = i; if (n > 1) break; }
        if (n === 1) return { tech: 'hidden-single', tier: 1, house: h, digit: d, cells: [only], place: [only, d] };
      }
    }
    return null;
  }
  function nakedSingle(st) {
    for (let i = 0; i < 81; i++) if (!st.v[i] && POP[st.c[i]] === 1) return { tech: 'naked-single', tier: 1, digit: digitOf(st.c[i]), cells: [i], place: [i, digitOf(st.c[i])] };
    return null;
  }
  function pointing(st) {
    for (let bx = 18; bx < 27; bx++) {
      for (let d = 1; d <= 9; d++) {
        const b = bit(d), cells = HOUSES[bx].filter((i) => !st.v[i] && st.c[i] & b);
        if (cells.length < 2) continue;
        for (const line of [R[cells[0]], 9 + C[cells[0]]]) {
          if (!cells.every((i) => (line < 9 ? R[i] : 9 + C[i]) === line)) continue;
          const elim = HOUSES[line].filter((i) => B[i] !== bx - 18 && !st.v[i] && st.c[i] & b).map((i) => [i, b]);
          if (elim.length) return { tech: 'pointing', tier: 2, house: bx, line, digit: d, cells, elim };
        }
      }
    }
    return null;
  }
  function claiming(st) {
    for (let line = 0; line < 18; line++) {
      for (let d = 1; d <= 9; d++) {
        const b = bit(d), cells = HOUSES[line].filter((i) => !st.v[i] && st.c[i] & b);
        if (cells.length < 2) continue;
        const bx = B[cells[0]];
        if (!cells.every((i) => B[i] === bx)) continue;
        const elim = HOUSES[18 + bx].filter((i) => !HOUSES[line].includes(i) && !st.v[i] && st.c[i] & b).map((i) => [i, b]);
        if (elim.length) return { tech: 'claiming', tier: 2, house: 18 + bx, line, digit: d, cells, elim };
      }
    }
    return null;
  }
  function nakedSubset(st, n, tier) {
    for (const h of HOUSE_ORDER) {
      const empty = HOUSES[h].filter((i) => !st.v[i]);
      if (empty.length <= n) continue;
      const pool = empty.filter((i) => POP[st.c[i]] >= 2 && POP[st.c[i]] <= n);
      if (pool.length < n) continue;
      for (const set of combos(pool, n)) {
        let u = 0;
        for (const i of set) u |= st.c[i];
        if (POP[u] !== n) continue;
        const elim = empty.filter((i) => !set.includes(i) && st.c[i] & u).map((i) => [i, st.c[i] & u]);
        if (elim.length) return { tech: 'naked-' + n, tier, house: h, digits: DIGS[u], cells: set, elim };
      }
    }
    return null;
  }
  function hiddenSubset(st, n, tier) {
    for (const h of HOUSE_ORDER) {
      const cells = HOUSES[h];
      const empty = cells.filter((i) => !st.v[i]);
      if (empty.length <= n) continue;
      const pos = {}, ds = [];
      for (let d = 1; d <= 9; d++) {
        const b = bit(d);
        let m = 0;
        for (let k = 0; k < 9; k++) if (!st.v[cells[k]] && st.c[cells[k]] & b) m |= 1 << k;
        if (POP[m] >= 2 && POP[m] <= n) { pos[d] = m; ds.push(d); }
      }
      if (ds.length < n) continue;
      for (const set of combos(ds, n)) {
        let u = 0, dm = 0;
        for (const d of set) { u |= pos[d]; dm |= bit(d); }
        if (POP[u] !== n) continue;
        const sel = [];
        for (let k = 0; k < 9; k++) if (u & (1 << k)) sel.push(cells[k]);
        const elim = sel.filter((i) => st.c[i] & ~dm).map((i) => [i, st.c[i] & ~dm]);
        if (elim.length) return { tech: 'hidden-' + n, tier, house: h, digits: set, cells: sel, elim };
      }
    }
    return null;
  }
  function fish(st, n, tier) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      for (const rowsBase of [true, false]) {
        const base = [], pos = {};
        for (let k = 0; k < 9; k++) {
          let m = 0;
          for (let j = 0; j < 9; j++) { const i = rowsBase ? k * 9 + j : j * 9 + k; if (!st.v[i] && st.c[i] & b) m |= 1 << j; }
          if (POP[m] >= 2 && POP[m] <= n) { base.push(k); pos[k] = m; }
        }
        if (base.length < n) continue;
        for (const set of combos(base, n)) {
          let u = 0;
          for (const k of set) u |= pos[k];
          if (POP[u] !== n) continue;
          const elim = [], cells = [];
          for (let j = 0; j < 9; j++) {
            if (!(u & (1 << j))) continue;
            for (let k = 0; k < 9; k++) {
              const i = rowsBase ? k * 9 + j : j * 9 + k;
              if (st.v[i] || !(st.c[i] & b)) continue;
              if (set.includes(k)) cells.push(i); else elim.push([i, b]);
            }
          }
          if (elim.length) {
            const lines = [], covers = [];
            for (const k of set) lines.push(rowsBase ? k : 9 + k);
            for (let j = 0; j < 9; j++) if (u & (1 << j)) covers.push(rowsBase ? 9 + j : j);
            return { tech: n === 2 ? 'x-wing' : n === 3 ? 'swordfish' : 'jellyfish', tier, digit: d, rows: rowsBase, lines, covers, cells, elim };
          }
        }
      }
    }
    return null;
  }
  function xyWing(st) {
    const bi = [];
    for (let i = 0; i < 81; i++) if (!st.v[i] && POP[st.c[i]] === 2) bi.push(i);
    for (const p of bi) {
      const pm = st.c[p];
      const wings = bi.filter((x) => x !== p && sees(p, x) && POP[st.c[x] & pm] === 1);
      for (const x of wings) {
        const z = st.c[x] & ~pm, ym = (pm & ~st.c[x]) | z;
        for (const y of wings) {
          if (y === x || st.c[y] !== ym) continue;
          const elim = [];
          for (let i = 0; i < 81; i++) if (i !== x && i !== y && i !== p && !st.v[i] && st.c[i] & z && sees(i, x) && sees(i, y)) elim.push([i, z]);
          if (elim.length) return { tech: 'xy-wing', tier: 4, digit: digitOf(z), cells: [p, x, y], pivot: p, elim };
        }
      }
    }
    return null;
  }
  function xyzWing(st) {
    for (let p = 0; p < 81; p++) {
      if (st.v[p] || POP[st.c[p]] !== 3) continue;
      const pm = st.c[p];
      const wings = PEERS[p].filter((x) => !st.v[x] && POP[st.c[x]] === 2 && (st.c[x] & ~pm) === 0);
      for (let a = 0; a < wings.length; a++) for (let b2 = a + 1; b2 < wings.length; b2++) {
        const x = wings[a], y = wings[b2];
        if ((st.c[x] | st.c[y]) !== pm) continue;
        const z = st.c[x] & st.c[y];
        if (POP[z] !== 1) continue;
        const elim = [];
        for (let i = 0; i < 81; i++) if (i !== x && i !== y && i !== p && !st.v[i] && st.c[i] & z && sees(i, p) && sees(i, x) && sees(i, y)) elim.push([i, z]);
        if (elim.length) return { tech: 'xyz-wing', tier: 4, digit: digitOf(z), cells: [p, x, y], pivot: p, elim };
      }
    }
    return null;
  }

  const TECHS = [
    [hiddenSingle, 1, 1], [nakedSingle, 1, 1],
    [pointing, 2, 4], [claiming, 2, 4], [(s) => nakedSubset(s, 2, 2), 2, 6], [(s) => hiddenSubset(s, 2, 2), 2, 8],
    [(s) => nakedSubset(s, 3, 3), 3, 14], [(s) => hiddenSubset(s, 3, 3), 3, 16], [(s) => fish(s, 2, 3), 3, 18],
    [(s) => fish(s, 3, 4), 4, 30], [xyWing, 4, 30], [xyzWing, 4, 36], [(s) => nakedSubset(s, 4, 4), 4, 30], [(s) => hiddenSubset(s, 4, 4), 4, 34],
  ];
  function nextStep(st, maxTier = 4) {
    for (const [fn, tier, w] of TECHS) {
      if (tier > maxTier) break;
      const s = fn(st);
      if (s) { s.weight = w; return s; }
    }
    return null;
  }
  const filled = (st) => { for (let i = 0; i < 81; i++) if (!st.v[i]) return false; return true; };

  /** solves like a person. → { solved, tier, score, steps, techs: { name: count }, grid } */
  function grade(grid, maxTier = 4) {
    const st = makeState(grid);
    let tier = 0, score = 0, steps = 0;
    const techs = {};
    for (let guard = 0; guard < 2000; guard++) {
      if (filled(st)) return { solved: true, tier, score, steps, techs, grid: toStr(st.v) };
      for (let i = 0; i < 81; i++) if (!st.v[i] && !st.c[i]) return { solved: false, broken: true, tier, score, steps, techs };
      const s = nextStep(st, maxTier);
      if (!s) return { solved: false, tier, score, steps, techs };
      apply(st, s);
      tier = Math.max(tier, s.tier); score += s.weight; steps++;
      techs[s.tech] = (techs[s.tech] || 0) + 1;
    }
    return { solved: false, tier, score, steps, techs };
  }

  /** the next placement a person can find from `values` (eliminations needed on the way in chain) */
  function hint(values) {
    const st = makeState(values);
    const chain = [];
    for (let guard = 0; guard < 60; guard++) {
      const s = nextStep(st, 4);
      if (!s) return { chain, step: null };
      if (s.place) return { chain, step: s };
      chain.push(s);
      apply(st, s);
    }
    return { chain, step: null };
  }

  /* ---------- explanations ---------- */
  const HN = { row: '行', col: '列', box: 'ブロック' };
  const NAMES = {
    'hidden-single': 'ここだけ（隠れたシングル）', 'naked-single': '残りひとつ（唯一の候補）',
    pointing: 'ブロックから行・列へ（ポインティング）', claiming: '行・列からブロックへ（クレーミング）',
    'naked-2': '2 マスで 2 数字（ネイキッドペア）', 'hidden-2': '2 数字が 2 マスだけ（隠れたペア）',
    'naked-3': '3 マスで 3 数字（ネイキッドトリプル）', 'hidden-3': '3 数字が 3 マスだけ（隠れたトリプル）',
    'naked-4': '4 マスで 4 数字（ネイキッドクアッド）', 'hidden-4': '4 数字が 4 マスだけ（隠れたクアッド）',
    'x-wing': '四隅の形（X-Wing）', swordfish: '3 本の並び（ソードフィッシュ）', jellyfish: '4 本の並び',
    'xy-wing': '3 マスの連鎖（XY-Wing）', 'xyz-wing': '3 マスの連鎖（XYZ-Wing）',
  };
  const join = (ds) => ds.join('・');
  function describe(s) {
    if (!s) return '';
    const n = s.cells ? s.cells.length : 0;
    switch (s.tech) {
      case 'hidden-single': return `この${HN[houseKind(s.house)]}で ${s.digit} が入れるのは、このマスだけです。`;
      case 'naked-single': return `このマスに入る数字は ${s.digit} だけです（縦・横・ブロックに、ほかの 8 つの数字がそろっています）。`;
      case 'pointing': {
        const l = HN[houseKind(s.line)];
        return `このブロックで ${s.digit} が入れるのは、1 本の${l}の上だけです。だから、同じ${l}のブロックの外のマスには ${s.digit} は入りません。`;
      }
      case 'claiming': {
        const l = HN[houseKind(s.line)];
        return `この${l}で ${s.digit} が入れるのは、1 つのブロックの中だけです。だから、そのブロックのほかのマスには ${s.digit} は入りません。`;
      }
      case 'naked-2': case 'naked-3': case 'naked-4':
        return `この ${n} マスに入るのは ${join(s.digits)} の ${n} つだけです。だから、この${HN[houseKind(s.house)]}のほかのマスには ${join(s.digits)} は入りません。`;
      case 'hidden-2': case 'hidden-3': case 'hidden-4':
        return `この${HN[houseKind(s.house)]}で ${join(s.digits)} が入れるのは、この ${n} マスだけです。だから、この ${n} マスには、ほかの数字は入りません。`;
      case 'x-wing': case 'swordfish': case 'jellyfish': {
        const k = s.lines.length, base = s.rows ? '行' : '列', cov = s.rows ? '列' : '行';
        return `${k} つの${base}で、${s.digit} が入れる場所が同じ ${k} つの${cov}にそろっています。${s.digit} はこの${cov}のどこかに必ず入るので、その${cov}のほかのマスには ${s.digit} は入りません。`;
      }
      case 'xy-wing':
        return `候補が 2 つずつの 3 マスがつながっています。真ん中のマスがどちらの数字でも、両端のどちらかに ${s.digit} が入るので、両端の両方から見えるマスには ${s.digit} は入りません。`;
      case 'xyz-wing':
        return `候補が 3 つのマスと、それにつながる 2 マスの組み合わせです。3 マスのどれかに必ず ${s.digit} が入るので、3 マスすべてから見えるマスには ${s.digit} は入りません。`;
      default: return '';
    }
  }

  /* ---------- generator ---------- */
  const MIN_GIVENS = { 1: 36, 2: 28, 3: 22, 4: 22 };
  /**
   * A puzzle of exactly `level` (1–4). Clues are removed in 180°-symmetric pairs as long as the solution stays unique and
   * the logic grade stays within the level; the result must then need the level's techniques.
   * opts: { maxAttempts = 3000, timeLimit (ms) } → { puzzle, solution, level, tier, score, givens, techs, attempts } | null
   */
  function generate(level, seed, opts = {}) {
    level = Math.max(1, Math.min(4, level | 0));
    const r = rng(seed == null ? (Math.random() * 4294967296) >>> 0 : seed);
    const maxAttempts = opts.maxAttempts || 3000;
    const deadline = opts.timeLimit ? Date.now() + opts.timeLimit : Infinity;
    const minGivens = MIN_GIVENS[level];
    for (let att = 1; att <= maxAttempts; att++) {
      const sol = randomSolution(r);
      const p = Uint8Array.from(sol);
      const order = r.shuffle(Array.from({ length: 41 }, (_, i) => i));
      let givens = 81;
      for (const i of order) {
        const j = 80 - i, k = i === j ? 1 : 2;
        if (givens - k < minGivens) continue;
        const vi = p[i], vj = p[j];
        p[i] = 0; p[j] = 0;
        let ok = countSolutions(p, 2) === 1;
        if (ok) { const g = grade(p, level); ok = g.solved; }
        if (ok) givens -= k; else { p[i] = vi; p[j] = vj; }
      }
      const g = grade(p, level);
      if (g.solved && g.tier === level) {
        return { puzzle: toStr(p), solution: toStr(sol), level, tier: g.tier, score: g.score, givens, techs: g.techs, attempts: att };
      }
      if (Date.now() > deadline) break;
    }
    return null;
  }

  /** a date (local) → seed and level of 今日の一問 */
  function dailyFor(date) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let h = 2166136261;
    for (const ch of 'nanpure-daily:' + key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const level = [3, 1, 2, 2, 2, 3, 3][date.getDay()]; // 日 むずかしい・月 かんたん・火〜木 ふつう・金土 むずかしい
    return { key, seed: h >>> 0, level };
  }

  return { R, C, B, HOUSES, PEERS, POP, DIGS, bit, rng, toArr, toStr, countSolutions, randomSolution, makeState, place, apply, nextStep, grade, hint, describe, generate, dailyFor, houseKind, NAMES, MIN_GIVENS };
});
