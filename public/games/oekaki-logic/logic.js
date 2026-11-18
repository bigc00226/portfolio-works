/*
 * ロジック絵巻 — nonogram core (pure: no DOM). Browser global OL, Node require().
 *   OL.clues(art)                       → { rows: [[3,1],…], cols: […] } from the picture (any non-'.' char is filled)
 *   OL.lineSolve(clue, line)            line: array of 0 unknown / 1 filled / 2 empty → deduced copy, or null (contradiction)
 *   OL.solve(rows, cols, grid?)         line logic only, until nothing changes → { status: solved|stuck|contradiction, grid }
 *   OL.hintStep(rows, cols, grid)       the line whose clue decides the most new cells from `grid` → { kind, index, cells:[[i, v]] }
 *   OL.doneClues(clue, line)            which clue numbers are visibly finished (from both ends) → array of booleans
 */
(function (root, factory) {
  const OL = factory();
  if (typeof module === 'object' && module.exports) module.exports = OL;
  else root.OL = OL;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function runs(cells) {
    const out = [];
    let n = 0;
    for (const v of cells) { if (v === 1) n++; else if (n) { out.push(n); n = 0; } }
    if (n) out.push(n);
    return out;
  }
  function clues(art) {
    const H = art.length, W = art[0].length;
    const filled = (r, c) => (art[r][c] !== '.' ? 1 : 0);
    const rows = [], cols = [];
    for (let r = 0; r < H; r++) rows.push(runs(Array.from({ length: W }, (_, c) => filled(r, c))));
    for (let c = 0; c < W; c++) cols.push(runs(Array.from({ length: H }, (_, r) => filled(r, c))));
    return { rows, cols };
  }

  /** every arrangement of the clue that fits the known cells, summarised per cell (DP from both ends) */
  function lineSolve(clue, line) {
    const n = line.length, k = clue.length;
    const emp = new Int32Array(n + 1);
    for (let i = 0; i < n; i++) emp[i + 1] = emp[i] + (line[i] === 2 ? 1 : 0);
    const fits = (p, len) => p + len <= n && emp[p + len] - emp[p] === 0 && (p + len === n || line[p + len] !== 1);
    const F = [], G = [];
    for (let j = 0; j <= k; j++) { F.push(new Uint8Array(n + 1)); G.push(new Uint8Array(n + 1)); }
    F[0][0] = 1;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= k; j++) {
        if (!F[j][i]) continue;
        if (i < n && line[i] !== 1) F[j][i + 1] = 1;
        if (j < k && fits(i, clue[j])) { const e = i + clue[j]; F[j + 1][e === n ? n : e + 1] = 1; }
      }
    }
    if (!F[k][n]) return null;
    G[k][n] = 1;
    for (let i = n - 1; i >= 0; i--) {
      for (let j = k; j >= 0; j--) {
        let v = line[i] !== 1 && G[j][i + 1] ? 1 : 0;
        if (!v && j < k && fits(i, clue[j])) { const e = i + clue[j]; v = e === n ? G[j + 1][n] : G[j + 1][e + 1]; }
        G[j][i] = v;
      }
    }
    const canEmpty = new Uint8Array(n), diff = new Int32Array(n + 1);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= k; j++) {
        if (!F[j][i]) continue;
        if (line[i] !== 1 && G[j][i + 1]) canEmpty[i] = 1;
        if (j < k && fits(i, clue[j])) {
          const e = i + clue[j];
          if (e === n ? G[j + 1][n] : G[j + 1][e + 1]) { diff[i]++; diff[e]--; if (e < n) canEmpty[e] = 1; }
        }
      }
    }
    const out = line.slice();
    let acc = 0;
    for (let i = 0; i < n; i++) {
      acc += diff[i];
      const f = acc > 0, e = canEmpty[i] === 1;
      if (!f && !e) return null;
      if (line[i] === 0) out[i] = f && !e ? 1 : e && !f ? 2 : 0;
    }
    return out;
  }

  function getLine(grid, W, H, kind, idx) {
    const out = [];
    if (kind === 'row') for (let c = 0; c < W; c++) out.push(grid[idx * W + c]);
    else for (let r = 0; r < H; r++) out.push(grid[r * W + idx]);
    return out;
  }
  const cellOf = (W, kind, idx, k) => (kind === 'row' ? idx * W + k : k * W + idx);

  function solve(rows, cols, start) {
    const H = rows.length, W = cols.length;
    const grid = start ? Int8Array.from(start) : new Int8Array(W * H);
    const dirtyR = new Uint8Array(H).fill(1), dirtyC = new Uint8Array(W).fill(1);
    let passes = 0, changed = true;
    while (changed) {
      changed = false;
      passes++;
      for (const [kind, clue, dirty, other] of [['row', rows, dirtyR, dirtyC], ['col', cols, dirtyC, dirtyR]]) {
        for (let i = 0; i < clue.length; i++) {
          if (!dirty[i]) continue;
          dirty[i] = 0;
          const line = getLine(grid, W, H, kind, i);
          const res = lineSolve(clue[i], line);
          if (!res) return { status: 'contradiction', grid, passes };
          for (let k = 0; k < res.length; k++) {
            if (res[k] !== line[k]) { grid[cellOf(W, kind, i, k)] = res[k]; other[k] = 1; changed = true; }
          }
        }
      }
    }
    let unknown = 0;
    for (const v of grid) if (!v) unknown++;
    return { status: unknown ? 'stuck' : 'solved', grid, unknown, passes };
  }

  /** the most helpful single line from the player's (correct) cells */
  function hintStep(rows, cols, grid) {
    const H = rows.length, W = cols.length;
    let best = null;
    for (const [kind, clue] of [['row', rows], ['col', cols]]) {
      for (let i = 0; i < clue.length; i++) {
        const line = getLine(grid, W, H, kind, i);
        const res = lineSolve(clue[i], line);
        if (!res) continue;
        const cells = [];
        let fills = 0;
        for (let k = 0; k < res.length; k++) if (res[k] !== line[k]) { cells.push([cellOf(W, kind, i, k), res[k]]); if (res[k] === 1) fills++; }
        if (!cells.length) continue;
        const known = line.filter((v) => v).length;
        const score = fills * 2 + cells.length - known * 0.01;
        if (!best || score > best.score) best = { kind, index: i, cells, fills, marks: cells.length - fills, known, score, clue: clue[i] };
      }
    }
    return best;
  }

  /** which clue numbers are visibly done: runs closed by an edge or × (2), matched from the left and from the right */
  function doneClues(clue, line) {
    const k = clue.length, out = new Array(k).fill(false);
    if (!k) return out;
    const r = runs(line);
    if (r.length === k && r.every((x, i) => x === clue[i])) return out.fill(true);
    const scan = (cells, cl) => {
      const done = [];
      let i = 0, j = 0;
      const n = cells.length;
      while (i < n && j < cl.length) {
        if (cells[i] === 2) { i++; continue; }
        if (cells[i] === 0) break;
        let e = i;
        while (e < n && cells[e] === 1) e++;
        if (e < n && cells[e] !== 2) break;
        if (e - i !== cl[j]) break;
        done.push(j);
        j++;
        i = e;
      }
      return done;
    };
    for (const j of scan(line, clue)) out[j] = true;
    for (const j of scan(line.slice().reverse(), clue.slice().reverse())) out[k - 1 - j] = true;
    return out;
  }

  return { runs, clues, lineSolve, solve, hintStep, doneClues, getLine };
});
