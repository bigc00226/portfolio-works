/*
 * 宵灯りのほこら — code-drawn pixel graphics: map tiles, walking sprites (4 directions), big decorations, window frames,
 * text helpers. Everything is drawn into small canvases once and cached.
 */
(function () {
  'use strict';
  const GFX = (window.GFX = {});
  const TS = 16;
  GFX.TS = TS;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  GFX.mk = mk;
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  GFX.hash = hash;

  /* ---------------- tiles ---------------- */
  const C = {
    grass: '#79a548', grassD: '#5f8b38', grassL: '#97c15e', flowerY: '#f3d35a', flowerP: '#f39ab4', flowerW: '#fbf6ea',
    dirt: '#c9a46a', dirtD: '#a98650', dirtL: '#dcbd86', stone: '#b7b0a2', stoneD: '#8c8578', stoneL: '#d2ccbf',
    water: '#3f7fae', waterD: '#2f6690', waterL: '#7fb6da', foam: '#d9eef7', sand: '#e1cd98', sandD: '#cdb47c',
    leaf: '#3f7a3a', leafD: '#2b5a2c', leafL: '#5f9a4c', trunk: '#6b4a2e', fleaf: '#2d5b35', fleafD: '#1e3f25', fleafL: '#467a45',
    floorF: '#3e5e33', floorFD: '#33502b', floorFL: '#4d6f3e', rock: '#8c8070', rockD: '#655a4e', rockL: '#ada18e',
    plaster: '#efe6d2', beam: '#6b4a2e', roofR: '#9a4a36', roofRD: '#6e2e22', roofRL: '#b9634a', roofQ: '#4a5a80', roofQD: '#303c5a', roofQL: '#6676a0',
    wood: '#b58a58', woodD: '#94693f', woodL: '#cba070', tatami: '#c9c98a', tatamiD: '#a6a868', tatamiE: '#5f6d3a',
    caveF: '#6e6256', caveFD: '#5d5248', caveFL: '#837563', caveP: '#4f453e', cavePD: '#423a34', cavePL: '#5f544b', caveW: '#382f2b', caveWD: '#241e1b', caveWL: '#56493f',
    shrineF: '#3a4636', shrineFD: '#2e3a2c', shrineFL: '#46553f', verm: '#b8432f', vermD: '#86301f', ink: '#1d1620',
  };
  GFX.C = C;
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  function speckle(g, x0, y0, tx, ty, cols, n, seed) {
    for (let i = 0; i < n; i++) {
      const px = Math.floor(hash(tx, ty, seed + i * 3) * 16), py = Math.floor(hash(tx, ty, seed + i * 3 + 1) * 16);
      R(g, x0 + px, y0 + py, 1, 1, cols[i % cols.length]);
    }
  }
  function grass(g, x, y, tx, ty, style) {
    const night = style === 'shrine';
    const forest = style === 'forest';
    R(g, x, y, 16, 16, night ? C.shrineF : forest ? C.floorF : C.grass);
    speckle(g, x, y, tx, ty, night ? [C.shrineFD, C.shrineFL] : forest ? [C.floorFD, C.floorFL] : [C.grassD, C.grassL], 9, 1);
    // little tufts
    if (hash(tx, ty, 7) < 0.45) { const px = x + 2 + Math.floor(hash(tx, ty, 8) * 11), py = y + 3 + Math.floor(hash(tx, ty, 9) * 10); const c = night ? C.shrineFD : forest ? C.floorFD : C.grassD; R(g, px, py, 1, 2, c); R(g, px + 2, py, 1, 2, c); R(g, px + 1, py - 1, 1, 3, c); }
  }
  const T = {};
  T['.'] = (g, x, y, tx, ty, m) => grass(g, x, y, tx, ty, m.style);
  T[';'] = (g, x, y, tx, ty, m) => grass(g, x, y, tx, ty, m.style === 'shrine' ? 'shrine' : 'forest');
  T[','] = (g, x, y, tx, ty, m) => {
    grass(g, x, y, tx, ty, m.style);
    for (let i = 0; i < 3; i++) {
      const px = x + 2 + Math.floor(hash(tx, ty, 20 + i) * 11), py = y + 2 + Math.floor(hash(tx, ty, 30 + i) * 11);
      const col = [C.flowerY, C.flowerP, C.flowerW][Math.floor(hash(tx, ty, 40 + i) * 3)];
      R(g, px, py - 1, 1, 1, col); R(g, px - 1, py, 3, 1, col); R(g, px, py + 1, 1, 1, col); R(g, px, py, 1, 1, '#c8862a');
    }
  };
  T['"'] = (g, x, y, tx, ty, m) => {
    grass(g, x, y, tx, ty, m.style);
    for (let i = 0; i < 4; i++) {
      const px = x + 1 + (i % 2) * 8 + Math.floor(hash(tx, ty, i) * 3), py = y + 2 + Math.floor(i / 2) * 7;
      R(g, px, py + 1, 1, 5, '#3f6f2c'); R(g, px + 2, py, 1, 6, '#4e8436'); R(g, px + 4, py + 2, 1, 4, '#3f6f2c'); R(g, px + 1, py + 5, 4, 1, '#355f26');
      R(g, px + 2, py, 1, 1, '#a9d07a');
    }
  };
  function edgeSoft(g, x, y, m, tx, ty, same, col) {
    const n = (dx, dy) => same(m.tile(tx + dx, ty + dy));
    if (!n(0, -1)) R(g, x, y, 16, 1, col);
    if (!n(0, 1)) R(g, x, y + 15, 16, 1, col);
    if (!n(-1, 0)) R(g, x, y, 1, 16, col);
    if (!n(1, 0)) R(g, x + 15, y, 1, 16, col);
  }
  T[':'] = (g, x, y, tx, ty, m) => {
    R(g, x, y, 16, 16, C.dirt);
    speckle(g, x, y, tx, ty, [C.dirtD, C.dirtL, C.dirtD], 10, 3);
    edgeSoft(g, x, y, m, tx, ty, (c) => c === ':' || c === '=' || c === '-' || c === 'D' || c === 'S' || m.isMarkOn(c), C.dirtD);
  };
  T['='] = (g, x, y, tx, ty) => {
    R(g, x, y, 16, 16, C.stoneD);
    const off = (ty % 2) * 4;
    for (let r = 0; r < 2; r++) for (let c = -1; c < 2; c++) {
      const bx = x + c * 8 + off + (r ? 4 : 0), by = y + r * 8;
      const sx = Math.max(x, bx + 1), ex = Math.min(x + 16, bx + 8);
      if (ex > sx) { R(g, sx, by + 1, ex - sx, 6, hash(tx * 3 + c, ty * 2 + r) < 0.5 ? C.stone : '#aea797'); R(g, sx, by + 1, ex - sx, 1, C.stoneL); }
    }
  };
  T['!'] = (g, x, y) => {
    for (let i = 0; i < 4; i++) { R(g, x, y + i * 4, 16, 4, C.stoneD); R(g, x, y + i * 4, 16, 3, C.stone); R(g, x, y + i * 4, 16, 1, C.stoneL); }
  };
  T.S = (g, x, y, tx, ty) => { R(g, x, y, 16, 16, C.sand); speckle(g, x, y, tx, ty, [C.sandD, '#efe0b4'], 8, 5); };
  T['~'] = (g, x, y, tx, ty, m, f) => {
    R(g, x, y, 16, 16, C.water);
    for (let i = 0; i < 3; i++) { const wy = y + 3 + i * 5, wx = x + ((tx * 5 + i * 7 + f * 3) % 12); R(g, wx, wy, 4, 1, C.waterL); }
    if (hash(tx, ty, 2) < 0.3) R(g, x + 3 + f * 5, y + 9, 2, 1, C.waterD);
    const n = (dx, dy) => { const c = m.tile(tx + dx, ty + dy); return c === '~' || c === '-' || c == null; };
    if (!n(0, -1)) { R(g, x, y, 16, 2, C.foam); R(g, x, y + 2, 16, 1, C.waterL); }
    if (!n(0, 1)) R(g, x, y + 15, 16, 1, C.waterD);
    if (!n(-1, 0)) R(g, x, y, 1, 16, C.foam);
    if (!n(1, 0)) R(g, x + 15, y, 1, 16, C.foam);
  };
  T['-'] = (g, x, y, tx, ty, m, f) => {
    T['~'](g, x, y, tx, ty, m, f);
    R(g, x + 1, y, 14, 16, '#8a5e34');
    for (let i = 0; i < 4; i++) { R(g, x + 1, y + i * 4, 14, 3, '#a87444'); R(g, x + 1, y + i * 4, 14, 1, '#c08a55'); }
    R(g, x, y, 2, 16, '#5c3c20'); R(g, x + 14, y, 2, 16, '#5c3c20');
  };
  function treeCanopy(g, x, y, cols, tx, ty) {
    const [base, dark, light] = cols;
    g.fillStyle = C.ink;
    g.beginPath(); g.arc(x + 8, y + 7, 7.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = dark; g.beginPath(); g.arc(x + 8, y + 7, 6.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = base; g.beginPath(); g.arc(x + 7.4, y + 6.2, 5.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = light; g.beginPath(); g.arc(x + 6, y + 4.6, 2.6, 0, Math.PI * 2); g.fill();
    R(g, x + 9, y + 9, 2, 1, dark); R(g, x + 4, y + 8, 1, 1, dark);
    if (hash(tx, ty, 11) < 0.25) R(g, x + 10, y + 4, 1, 1, '#d9e8a0');
  }
  T.T = (g, x, y, tx, ty, m) => {
    const st = m.style;
    if (st === 'shrine') { grass(g, x, y, tx, ty, 'shrine'); R(g, x + 7, y + 11, 3, 5, '#3a2a1e'); treeCanopy(g, x, y - 1, ['#2a4a3a', '#1b3227', '#3b5e4a'], tx, ty); return; }
    grass(g, x, y, tx, ty, st === 'forest' ? 'forest' : 'field');
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + 8, y + 14, 6, 2, 0, 0, Math.PI * 2); g.fill();
    R(g, x + 7, y + 10, 3, 5, C.ink); R(g, x + 7, y + 10, 2, 5, C.trunk);
    treeCanopy(g, x, y - 1, [C.leaf, C.leafD, C.leafL], tx, ty);
  };
  T.F = (g, x, y, tx, ty, m) => {
    R(g, x, y, 16, 16, C.fleafD);
    const blob = (cx, cy, r, s) => { g.fillStyle = C.ink; g.beginPath(); g.arc(cx, cy, r + 0.8, 0, 7); g.fill(); g.fillStyle = C.fleaf; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.fillStyle = C.fleafL; g.beginPath(); g.arc(cx - r * 0.35, cy - r * 0.4, r * 0.38, 0, 7); g.fill(); if (s) { R(g, cx + 1, cy + 1, 1, 1, '#a7c98a'); } };
    blob(x + 4, y + 4, 4.5, hash(tx, ty, 1) < 0.2); blob(x + 12, y + 5, 4.5, 0); blob(x + 8, y + 11, 5, hash(tx, ty, 2) < 0.2); blob(x + 1, y + 13, 3.5, 0); blob(x + 15, y + 13, 3.5, 0);
    const below = m.tile(tx, ty + 1);
    if (below && below !== 'F' && below !== 'T') { R(g, x + 3, y + 12, 2, 4, C.trunk); R(g, x + 11, y + 13, 2, 3, C.trunk); R(g, x, y + 15, 16, 1, 'rgba(0,0,0,.25)'); }
  };
  T['^'] = (g, x, y, tx, ty, m) => {
    R(g, x, y, 16, 16, C.rock);
    speckle(g, x, y, tx, ty, [C.rockD, C.rockL], 10, 6);
    const v = hash(tx, ty, 4);
    g.fillStyle = C.rockD; g.beginPath(); g.moveTo(x + 2 + v * 4, y + 15); g.lineTo(x + 8, y + 3 + v * 3); g.lineTo(x + 14, y + 15); g.fill();
    g.fillStyle = C.rockL; g.beginPath(); g.moveTo(x + 4 + v * 4, y + 15); g.lineTo(x + 8, y + 5 + v * 3); g.lineTo(x + 9, y + 15); g.fill();
    if (m.tile(tx, ty + 1) !== '^') R(g, x, y + 14, 16, 2, C.rockD);
  };
  T['&'] = (g, x, y, tx, ty, m) => { grass(g, x, y, tx, ty, m.style); g.fillStyle = C.ink; g.beginPath(); g.ellipse(x + 8, y + 10, 7, 5.5, 0, 0, 7); g.fill(); g.fillStyle = C.rockD; g.beginPath(); g.ellipse(x + 8, y + 10, 6, 4.6, 0, 0, 7); g.fill(); g.fillStyle = C.rockL; g.beginPath(); g.ellipse(x + 6.5, y + 8.5, 3.5, 2.2, 0, 0, 7); g.fill(); };
  T.B = (g, x, y, tx, ty, m) => { grass(g, x, y, tx, ty, m.style); g.fillStyle = C.ink; g.beginPath(); g.ellipse(x + 8, y + 9, 7.5, 6, 0, 0, 7); g.fill(); g.fillStyle = '#4c8a3c'; g.beginPath(); g.ellipse(x + 8, y + 9, 6.5, 5, 0, 0, 7); g.fill(); g.fillStyle = '#6eac52'; g.beginPath(); g.ellipse(x + 6, y + 7, 3, 2, 0, 0, 7); g.fill(); R(g, x + 10, y + 7, 1, 1, '#f39ab4'); R(g, x + 5, y + 11, 1, 1, '#f39ab4'); };
  // buildings
  function roof(g, x, y, tx, ty, m, base, dark, light) {
    R(g, x, y, 16, 16, base);
    for (let r = 0; r < 4; r++) { R(g, x, y + r * 4 + 3, 16, 1, dark); for (let c = 0; c < 4; c++) R(g, x + c * 4 + (r % 2) * 2, y + r * 4, 1, 3, dark); }
    R(g, x, y, 16, 1, light);
    const up = m.tile(tx, ty - 1), down = m.tile(tx, ty + 1), lt = m.tile(tx - 1, ty), rt = m.tile(tx + 1, ty);
    const isRoof = (c) => c === 'R' || c === 'Q';
    if (!isRoof(up)) { R(g, x, y, 16, 3, light); R(g, x, y + 3, 16, 1, C.ink); }
    if (!isRoof(down)) { R(g, x, y + 13, 16, 3, dark); R(g, x, y + 15, 16, 1, C.ink); }
    if (!isRoof(lt)) R(g, x, y, 1, 16, C.ink);
    if (!isRoof(rt)) R(g, x + 15, y, 1, 16, C.ink);
  }
  T.R = (g, x, y, tx, ty, m) => roof(g, x, y, tx, ty, m, C.roofR, C.roofRD, C.roofRL);
  T.Q = (g, x, y, tx, ty, m) => roof(g, x, y, tx, ty, m, C.roofQ, C.roofQD, C.roofQL);
  function wallBase(g, x, y, interior) {
    if (interior) { R(g, x, y, 16, 16, '#8a6440'); for (let i = 0; i < 4; i++) R(g, x + i * 4, y, 1, 16, '#6e4e30'); R(g, x, y + 12, 16, 4, '#5a3e26'); R(g, x, y, 16, 1, '#a07a50'); return; }
    R(g, x, y, 16, 16, C.plaster); R(g, x, y, 16, 2, C.beam); R(g, x, y + 12, 16, 4, '#7a6a58'); R(g, x, y + 12, 16, 1, C.beam); R(g, x, y, 2, 16, C.beam); R(g, x + 14, y, 2, 16, C.beam);
  }
  T['#'] = (g, x, y, tx, ty, m) => {
    if (m.style === 'interior') {
      const below = m.tile(tx, ty + 1);
      if (below === '#' || below === 'D' || below === '0' || below == null) { R(g, x, y, 16, 16, '#3a2a1e'); R(g, x, y, 16, 1, '#5a4030'); return; }
      wallBase(g, x, y, true); return;
    }
    wallBase(g, x, y, false);
  };
  T.W = (g, x, y) => { wallBase(g, x, y, false); R(g, x + 3, y + 3, 10, 8, C.ink); R(g, x + 4, y + 4, 8, 6, '#f4ecd6'); R(g, x + 8, y + 4, 1, 6, '#8a6a48'); R(g, x + 4, y + 7, 8, 1, '#8a6a48'); };
  T.D = (g, x, y, tx, ty, m) => {
    if (m.style === 'interior') { R(g, x, y, 16, 16, '#2a1e16'); R(g, x + 2, y, 12, 16, '#6e5034'); R(g, x + 3, y + 1, 10, 15, '#e9dcbc'); R(g, x + 8, y + 1, 1, 15, '#8a6a48'); for (let i = 0; i < 4; i++) R(g, x + 3, y + 3 + i * 4, 10, 1, '#b8a682'); return; }
    wallBase(g, x, y, false); R(g, x + 2, y + 2, 12, 14, '#3a2a1e'); R(g, x + 3, y + 3, 10, 13, '#5a4430');
    const nc = m.style === 'village' && tx > 16 ? '#2f4a7a' : '#7a2f2a';
    R(g, x + 2, y + 2, 12, 6, nc); R(g, x + 8, y + 2, 1, 6, 'rgba(0,0,0,.35)'); R(g, x + 4, y + 4, 2, 2, '#efe6d2');
  };
  T.N = (g, x, y, tx, ty, m) => {
    R(g, x, y, 16, 16, '#3a2a1e'); R(g, x, y + 10, 16, 6, '#4a3626');
    // shelves of goods behind the counter
    for (let i = 0; i < 3; i++) R(g, x + 2 + i * 5, y + 7 + (i % 2), 3, 3, ['#c9a46a', '#7aa0c0', '#c86a50'][(tx + i) % 3]);
    const col = (m.shopColors && m.shopColors[tx + ',' + ty]) || (m.shopColors && (m.shopColors[(tx - 1) + ',' + ty] || m.shopColors[(tx + 1) + ',' + ty])) || '#7a2f2a';
    R(g, x, y, 16, 6, col); R(g, x, y + 5, 16, 1, 'rgba(0,0,0,.35)'); R(g, x + 7, y, 1, 6, 'rgba(0,0,0,.3)'); R(g, x + 15, y, 1, 6, 'rgba(0,0,0,.3)');
  };
  T.K = (g, x, y) => { R(g, x, y, 16, 16, '#6b4a2e'); R(g, x, y, 16, 5, C.woodL); R(g, x, y + 4, 16, 1, '#5a3e26'); for (let i = 0; i < 4; i++) R(g, x + i * 4 + 1, y + 6, 1, 10, '#5a3e26'); R(g, x, y + 15, 16, 1, C.ink); };
  T._ = (g, x, y, tx, ty) => { R(g, x, y, 16, 16, C.wood); for (let i = 0; i < 4; i++) { R(g, x, y + i * 4 + 3, 16, 1, C.woodD); R(g, x + ((tx * 7 + i * 5) % 16), y + i * 4, 1, 3, C.woodD); } R(g, x + 3, y + 1, 2, 1, C.woodL); };
  T.Y = (g, x, y, tx, ty) => { R(g, x, y, 16, 16, '#7a5434'); for (let i = 0; i < 4; i++) { R(g, x, y + i * 4 + 3, 16, 1, '#5e3f25'); R(g, x + ((tx * 5 + i * 3) % 16), y + i * 4, 1, 3, '#5e3f25'); } };
  T.J = (g, x, y, tx, ty) => { R(g, x, y, 16, 16, C.tatami); for (let i = 0; i < 8; i++) R(g, x, y + i * 2, 16, 1, C.tatamiD); if (ty % 2 === 0) R(g, x, y, 16, 1, C.tatamiE); if (tx % 2 === 0) R(g, x, y, 1, 16, C.tatamiE); };
  T.E = (g, x, y, tx, ty) => { T.J(g, x, y, tx, ty); R(g, x + 1, y + 1, 14, 14, C.ink); R(g, x + 2, y + 2, 12, 12, '#e8e2f2'); R(g, x + 2, y + 6, 12, 8, '#5a6ea8'); R(g, x + 2, y + 6, 12, 1, '#3e4e80'); R(g, x + 4, y + 2, 8, 3, '#fff'); };
  T.M = (g, x, y) => { T._(g, x, y, 0, 0); R(g, x + 1, y, 14, 15, C.ink); R(g, x + 2, y + 1, 12, 13, '#7a5434'); R(g, x + 2, y + 7, 12, 1, '#5a3e26'); R(g, x + 3, y + 3, 3, 4, '#c9a46a'); R(g, x + 8, y + 2, 4, 5, '#7aa0c0'); R(g, x + 4, y + 9, 4, 4, '#c86a50'); R(g, x + 9, y + 10, 3, 3, '#e8e2d0'); };
  T.U = (g, x, y, tx, ty, m) => { (m.style === 'interior' ? T._ : T['.'])(g, x, y, tx, ty, m); g.fillStyle = C.ink; g.beginPath(); g.ellipse(x + 8, y + 9, 5.5, 6, 0, 0, 7); g.fill(); g.fillStyle = '#9a6a4a'; g.beginPath(); g.ellipse(x + 8, y + 9, 4.5, 5, 0, 0, 7); g.fill(); R(g, x + 5, y + 3, 6, 2, '#6a4430'); R(g, x + 6, y + 7, 2, 3, '#c08a66'); };
  T.V = (g, x, y, tx, ty, m) => { T._(g, x, y, tx, ty, m); R(g, x + 1, y + 1, 14, 14, C.ink); R(g, x + 2, y + 2, 12, 12, '#8a6440'); R(g, x + 4, y + 4, 8, 8, '#9a9088'); R(g, x + 5, y + 6, 6, 4, '#3a3230'); R(g, x + 7, y + 7, 2, 2, '#e8803a'); R(g, x + 8, y, 1, 6, '#2a2220'); };
  T.P = (g, x, y, tx, ty, m, f) => { R(g, x, y, 16, 16, '#6d9a62'); R(g, x, y, 16, 16, 'rgba(120,170,200,.25)'); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const px = x + c * 4 + 1, py = y + r * 4 + 1; R(g, px, py, 1, 3, '#3f7a34'); R(g, px + 1, py + 1, 1, 2, '#58994a'); } if (f) R(g, x + 6, y + 9, 3, 1, 'rgba(255,255,255,.4)'); };
  T['|'] = (g, x, y, tx, ty, m) => {
    grass(g, x, y, tx, ty, m.style);
    const n = (dx, dy) => m.tile(tx + dx, ty + dy) === '|';
    const col = '#7a5434', dk = '#4e3420';
    if (n(-1, 0) || n(1, 0)) { R(g, n(-1, 0) ? x : x + 7, y + 6, n(-1, 0) && n(1, 0) ? 16 : 9, 2, col); R(g, n(-1, 0) ? x : x + 7, y + 10, n(-1, 0) && n(1, 0) ? 16 : 9, 2, col); }
    if (n(0, -1) || n(0, 1)) R(g, x + 7, n(0, -1) ? y : y + 6, 2, n(0, -1) && n(0, 1) ? 16 : 10, col);
    R(g, x + 6, y + 3, 4, 11, dk); R(g, x + 7, y + 4, 2, 9, col);
  };
  T['*'] = (g, x, y, tx, ty, m) => { T['='](g, x, y, tx, ty, m); g.fillStyle = C.ink; g.beginPath(); g.arc(x + 8, y + 9, 7, 0, 7); g.fill(); g.fillStyle = '#9a9488'; g.beginPath(); g.arc(x + 8, y + 9, 6, 0, 7); g.fill(); g.fillStyle = '#1f3a50'; g.beginPath(); g.arc(x + 8, y + 9, 3.6, 0, 7); g.fill(); R(g, x + 6, y + 8, 2, 1, '#6fa0c8'); R(g, x + 2, y, 1, 9, '#5a3e26'); R(g, x + 13, y, 1, 9, '#5a3e26'); R(g, x + 1, y, 14, 2, '#7a5434'); };
  T.L = (g, x, y, tx, ty, m) => { (T[m.ground] || T['.'])(g, x, y, tx, ty, m); drawStoneLantern(g, x, y - 4, 'none'); };
  T.I = (g, x, y, tx, ty, m) => { (T[m.ground] || T['.'])(g, x, y, tx, ty, m); };
  T[0] = (g, x, y) => R(g, x, y, 16, 16, '#0b0a10');
  // cave
  T.C = (g, x, y, tx, ty) => { R(g, x, y, 16, 16, C.caveF); speckle(g, x, y, tx, ty, [C.caveFD, C.caveFL], 9, 12); if (hash(tx, ty, 13) < 0.3) { R(g, x + 5, y + 9, 3, 2, C.caveFD); R(g, x + 5, y + 9, 2, 1, C.caveFL); } };
  T["'"] = (g, x, y, tx, ty) => { R(g, x, y, 16, 16, C.caveP); speckle(g, x, y, tx, ty, [C.cavePD, C.cavePL], 10, 14); if (hash(tx, ty, 15) < 0.18) { R(g, x + 9, y + 4, 2, 1, '#5e7a4a'); R(g, x + 10, y + 3, 1, 1, '#6e8a5a'); } };
  T.X = (g, x, y, tx, ty, m) => {
    R(g, x, y, 16, 16, C.caveW);
    speckle(g, x, y, tx, ty, [C.caveWD, C.caveWL], 8, 16);
    const below = m.tile(tx, ty + 1);
    if (below && below !== 'X') { R(g, x, y + 8, 16, 8, '#4a3e36'); for (let i = 0; i < 4; i++) R(g, x + i * 4 + Math.floor(hash(tx, i) * 3), y + 8, 1, 8, '#3a302a'); R(g, x, y + 8, 16, 1, C.caveWL); R(g, x, y + 15, 16, 1, '#241e1b'); }
  };
  T.O = (g, x, y) => { R(g, x, y, 16, 16, C.caveP); R(g, x + 1, y + 1, 14, 14, '#100c0a'); R(g, x + 1, y + 1, 14, 3, '#2a221e'); R(g, x + 3, y + 5, 10, 8, '#050404'); };
  T.H = (g, x, y) => { R(g, x, y, 16, 16, '#2a221e'); for (let i = 0; i < 4; i++) { R(g, x + 1, y + i * 4, 14, 3, '#8c8070'); R(g, x + 1, y + i * 4, 14, 1, '#ab9f8c'); } };
  // shrine
  T.Z = (g, x, y, tx) => { R(g, x, y, 16, 16, '#e8dcc4'); R(g, x, y, 16, 3, C.vermD); R(g, x, y + 12, 16, 4, '#3a2a1e'); R(g, x + (tx % 2 ? 0 : 12), y, 4, 16, C.verm); R(g, x + (tx % 2 ? 1 : 13), y, 1, 16, '#d8604a'); };

  /** builds the static map image (2 animation frames) */
  GFX.renderMap = function (m) {
    const W = m.w * TS, H = m.h * TS;
    const frames = [mk(W, H), mk(W, H)];
    frames.forEach((cv, f) => {
      const g = cv.getContext('2d');
      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
        const ch = m.tiles[ty][tx];
        const fn = T[ch] || T['.'];
        fn(g, tx * TS, ty * TS, tx, ty, m, f);
      }
    });
    return frames;
  };

  /** a repeating pattern of the map's border tile (shown outside the map when the screen is larger than the map) */
  GFX.borderPattern = function (g, m, ch) {
    const c = mk(32, 32), x = c.getContext('2d');
    const fake = Object.assign({}, m, { tile: () => ch });
    for (let i = 0; i < 4; i++) (T[ch] || T[0])(x, (i % 2) * 16, Math.floor(i / 2) * 16, i, 7, fake, 0);
    return g.createPattern(c, 'repeat');
  };

  /* ---------------- stone lanterns and other small sprites ---------------- */
  function drawStoneLantern(g, x, y, state, t = 0) {
    // 16 wide, 20 tall, drawn with its base at y+20
    R(g, x + 4, y + 17, 8, 3, C.ink); R(g, x + 5, y + 17, 6, 2, '#8c857a');
    R(g, x + 6, y + 12, 4, 6, C.ink); R(g, x + 7, y + 12, 2, 5, '#9c958a');
    R(g, x + 3, y + 6, 10, 7, C.ink); R(g, x + 4, y + 7, 8, 5, state === 'shadow' ? '#4a4652' : '#a8a196');
    R(g, x + 6, y + 8, 4, 3, state === 'lit' ? '#ffd27a' : state === 'shadow' ? '#2a1a3a' : state === 'save' ? '#ffcf6a' : '#3a3530');
    if (state === 'lit' || state === 'save') { const fl = Math.sin(t * 9) > 0 ? 1 : 0; R(g, x + 7, y + 8 + fl, 2, 2, '#fff2c4'); }
    if (state === 'shadow') { const fl = Math.sin(t * 7) > 0 ? 1 : 0; R(g, x + 7, y + 8 + fl, 2, 2, '#9b6bd6'); }
    g.fillStyle = C.ink; g.beginPath(); g.moveTo(x + 1, y + 7); g.lineTo(x + 8, y + 1); g.lineTo(x + 15, y + 7); g.fill();
    g.fillStyle = state === 'shadow' ? '#5a5462' : '#b8b1a5'; g.beginPath(); g.moveTo(x + 2.5, y + 6.2); g.lineTo(x + 8, y + 2.3); g.lineTo(x + 13.5, y + 6.2); g.fill();
    R(g, x + 7, y, 2, 2, C.ink);
  }
  GFX.stoneLantern = drawStoneLantern;

  const spriteCache = {};
  function cached(key, w, h, draw) { if (!spriteCache[key]) { const c = mk(w, h); draw(c.getContext('2d')); spriteCache[key] = c; } return spriteCache[key]; }

  GFX.chest = (open) => cached('chest' + (open ? 1 : 0), 16, 16, (g) => {
    R(g, 1, 4, 14, 11, C.ink); R(g, 2, 5, 12, 9, '#8a3a26'); R(g, 2, 9, 12, 1, '#5e2418');
    if (open) { R(g, 2, 5, 12, 4, '#2a1410'); R(g, 1, 1, 14, 4, C.ink); R(g, 2, 2, 12, 2, '#a84a30'); }
    else { R(g, 2, 5, 12, 2, '#a84a30'); R(g, 7, 7, 2, 4, '#e8c060'); R(g, 7, 8, 2, 1, '#8a6a20'); }
    R(g, 2, 13, 12, 1, '#5e2418'); R(g, 3, 5, 1, 9, '#d8b050'); R(g, 12, 5, 1, 9, '#d8b050');
  });
  GFX.sign = () => cached('sign', 16, 16, (g) => { R(g, 7, 8, 2, 8, C.ink); R(g, 7, 9, 2, 7, '#6b4a2e'); R(g, 1, 2, 14, 8, C.ink); R(g, 2, 3, 12, 6, '#c9a46a'); R(g, 4, 5, 8, 1, '#7a5a3a'); R(g, 4, 7, 6, 1, '#7a5a3a'); });
  GFX.boulder = () => cached('boulder', 16, 16, (g) => { g.fillStyle = C.ink; g.beginPath(); g.arc(8, 9, 7.5, 0, 7); g.fill(); g.fillStyle = '#7a7068'; g.beginPath(); g.arc(8, 9, 6.5, 0, 7); g.fill(); g.fillStyle = '#9a9086'; g.beginPath(); g.arc(6.5, 7, 3.5, 0, 7); g.fill(); R(g, 9, 11, 3, 1, '#5a524a'); R(g, 4, 12, 2, 1, '#5a524a'); });
  GFX.jizo = () => cached('jizo', 16, 20, (g) => {
    R(g, 3, 17, 10, 3, C.ink); R(g, 4, 17, 8, 2, '#8c857a');
    g.fillStyle = C.ink; g.beginPath(); g.ellipse(8, 12, 5.5, 6.5, 0, 0, 7); g.fill(); g.beginPath(); g.arc(8, 5, 4.5, 0, 7); g.fill();
    g.fillStyle = '#a8a196'; g.beginPath(); g.ellipse(8, 12, 4.5, 5.5, 0, 0, 7); g.fill(); g.beginPath(); g.arc(8, 5, 3.6, 0, 7); g.fill();
    R(g, 6, 5, 1, 1, '#5a544a'); R(g, 9, 5, 1, 1, '#5a544a'); R(g, 4, 9, 8, 4, '#c8402e'); R(g, 5, 13, 6, 1, '#a0301e');
  });

  /* ---------------- characters (16×20, 4 directions × 4 walk frames) ---------------- */
  const PAL = {
    koharu: { hair: '#2a2230', hairL: '#4a4058', skin: '#f6d8bc', cloth: '#f4f0e6', clothD: '#c9c2b0', sash: '#e8742c', pants: '#34406e', shoe: '#5a3a2a', style: 'bob', acc: '#ff9a3a' },
    genta: { hair: '#5a3a22', hairL: '#7a5232', skin: '#e8b88e', cloth: '#4f7a46', clothD: '#3a5c34', sash: '#2a2420', pants: '#4a4036', shoe: '#3a2a1e', style: 'spiky', acc: '#f4f0e6' },
    suzu: { hair: '#eef0f6', hairL: '#ffffff', skin: '#fbe6d6', cloth: '#e8c860', clothD: '#c49e3a', sash: '#c8402e', pants: '#e8c860', shoe: '#c49e3a', style: 'long', acc: '#d8a830', float: true },
    yone: { hair: '#c8c4cc', hairL: '#e4e0e8', skin: '#ecc8a8', cloth: '#6a4a7a', clothD: '#4e3460', sash: '#c8a860', pants: '#4e3460', shoe: '#3a2a2a', style: 'bun' },
    child: { hair: '#2a2220', hairL: '#4a3a30', skin: '#f6d0b0', cloth: '#d8584a', clothD: '#a83a30', sash: '#2a3a5a', pants: '#2a3a5a', shoe: '#3a2a1e', style: 'short', small: true },
    child2: { hair: '#3a2a20', hairL: '#5a4030', skin: '#f6d0b0', cloth: '#e8a0b8', clothD: '#c07890', sash: '#f4f0e6', pants: '#c07890', shoe: '#3a2a1e', style: 'tied', small: true },
    oldman: { hair: '#d8d4d0', hairL: '#f0ece8', skin: '#e8c0a0', cloth: '#7a6a50', clothD: '#5a4c38', sash: '#3a3028', pants: '#5a4c38', shoe: '#3a2a1e', style: 'bald' },
    villager: { hair: '#2a2420', hairL: '#4a3e34', skin: '#ecc4a0', cloth: '#5a7aa0', clothD: '#40587a', sash: '#2a2a30', pants: '#3a3a44', shoe: '#3a2a1e', style: 'short' },
    villager2: { hair: '#3a2a1e', hairL: '#5a4030', skin: '#e8bc94', cloth: '#a07a4a', clothD: '#7a5a34', sash: '#3a3028', pants: '#4a4036', shoe: '#3a2a1e', style: 'short' },
    smith: { hair: '#3a3430', hairL: '#5a524c', skin: '#d8a07a', cloth: '#5a5a5a', clothD: '#3e3e3e', sash: '#8a5a3a', pants: '#3a3430', shoe: '#2a2420', style: 'bald', acc: '#f4f0e6' },
    tailor: { hair: '#2a2028', hairL: '#4a3a48', skin: '#f2cfb4', cloth: '#7a4a8c', clothD: '#5a3268', sash: '#e8c860', pants: '#5a3268', shoe: '#3a2a2a', style: 'tied' },
    merchant: { hair: '#2a2420', hairL: '#4a3e34', skin: '#ecc4a0', cloth: '#2f5d8a', clothD: '#204466', sash: '#e8d8b0', pants: '#2a3040', shoe: '#3a2a1e', style: 'short', acc: '#f4f0e6' },
    farmer: { hair: '#2a2420', hairL: '#4a3e34', skin: '#d8a880', cloth: '#8a8a5a', clothD: '#6a6a40', sash: '#4a3a2a', pants: '#4a4a3a', shoe: '#3a2a1e', style: 'hat' },
    woman: { hair: '#2a2028', hairL: '#4a3a48', skin: '#f2cfb4', cloth: '#c86a50', clothD: '#a04c36', sash: '#f4e0b0', pants: '#a04c36', shoe: '#3a2a2a', style: 'tied' },
    innkeeper: { hair: '#2a2028', hairL: '#4a3a48', skin: '#f2cfb4', cloth: '#3a5a7a', clothD: '#2a4258', sash: '#e8a060', pants: '#2a4258', shoe: '#3a2a2a', style: 'tied' },
    traveler: { hair: '#2a2420', hairL: '#4a3e34', skin: '#e0b48c', cloth: '#7a7060', clothD: '#5a5244', sash: '#3a3028', pants: '#4a4436', shoe: '#3a2a1e', style: 'hat' },
    teagirl: { hair: '#2a2028', hairL: '#4a3a48', skin: '#f6d8bc', cloth: '#d86a8a', clothD: '#b04c6a', sash: '#f4f0e6', pants: '#b04c6a', shoe: '#3a2a2a', style: 'kerchief', acc: '#f4f0e6' },
  };
  GFX.PAL = PAL;

  function outline(c) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const d = g.getImageData(0, 0, w, h), p = d.data, o = new Uint8ClampedArray(p);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (p[i + 3]) continue;
      const on = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && p[(yy * w + xx) * 4 + 3] > 0;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { o[i] = 29; o[i + 1] = 22; o[i + 2] = 32; o[i + 3] = 255; }
    }
    d.data.set(o); g.putImageData(d, 0, 0);
  }

  function drawPerson(g, P, dir, step) {
    const px = (x, y, w, h, c) => R(g, x, y, w, h, c);
    const walk = step === 1 ? -1 : step === 3 ? 1 : 0; // which leg is forward
    const sm = P.small ? 2 : 0; // children are shorter
    const by = (step === 1 || step === 3 ? 1 : 0) + sm; // body bob
    const side = dir === 'left' || dir === 'right';
    // legs
    if (P.float) {
      px(4, 15, 8, 2, P.clothD); px(3, 17, 10, 1, P.clothD); px(5, 18, 6, 1, P.acc || P.clothD);
    } else if (!side) {
      const ly = 16 + sm;
      const lh = (forward) => (forward ? 2 : 3);
      px(5, ly, 2, lh(walk < 0), P.pants); px(9, ly, 2, lh(walk > 0), P.pants);
      px(5, ly + lh(walk < 0), 2, 1, P.shoe); px(9, ly + lh(walk > 0), 2, 1, P.shoe);
    } else {
      const ly = 16 + sm;
      if (walk === 0) { px(6, ly, 3, 3, P.pants); px(6, ly + 3, 3, 1, P.shoe); }
      else { px(4, ly, 2, 3, P.pants); px(9, ly, 2, 3, P.pants); px(3, ly + 2, 3, 1, P.shoe); px(9, ly + 2, 3, 1, P.shoe); }
    }
    // body
    const bx = side ? 5 : 4, bw = side ? 6 : 8;
    px(bx, 10 + by, bw, 6 - (P.small ? 1 : 0), P.cloth);
    px(bx, 14 + by - (P.small ? 1 : 0), bw, 2, P.clothD);
    px(bx, 13 + by - (P.small ? 1 : 0), bw, 1, P.sash);
    if (dir === 'down') { px(7, 10 + by, 2, 1, P.skin); px(6, 10 + by, 1, 2, P.clothD); px(9, 10 + by, 1, 2, P.clothD); }
    // arms
    if (!side) {
      const sw = walk;
      px(3, 11 + by + (sw < 0 ? -1 : 0), 1, 3, P.clothD); px(12, 11 + by + (sw > 0 ? -1 : 0), 1, 3, P.clothD);
      px(3, 14 + by + (sw < 0 ? -1 : 0), 1, 1, P.skin); px(12, 14 + by + (sw > 0 ? -1 : 0), 1, 1, P.skin);
    } else {
      const ax = 7 + walk;
      px(ax, 11 + by, 2, 3, P.clothD); px(ax, 14 + by, 2, 1, P.skin);
    }
    // head
    const hy = by;
    px(4, 3 + hy, 8, 7, P.skin);
    const H = P.hair, HL = P.hairL;
    if (dir === 'up') {
      px(3, 1 + hy, 10, 9, H); px(4, 0 + hy, 8, 1, H); px(5, 2 + hy, 3, 1, HL);
    } else if (dir === 'down') {
      px(4, 0 + hy, 8, 1, H); px(3, 1 + hy, 10, 3, H); px(3, 4 + hy, 2, 2, H); px(11, 4 + hy, 2, 2, H); px(5, 4 + hy, 2, 1, H); px(9, 4 + hy, 1, 1, H); px(5, 1 + hy, 3, 1, HL);
      px(5, 6 + hy, 1, 2, '#2a1e1a'); px(10, 6 + hy, 1, 2, '#2a1e1a'); px(5, 6 + hy, 1, 1, '#4a3a4a');
      px(4, 8 + hy, 1, 1, '#f0a8a0'); px(11, 8 + hy, 1, 1, '#f0a8a0'); px(7, 8 + hy, 2, 1, '#d89a80');
    } else {
      // facing left (right is mirrored later)
      px(4, 0 + hy, 8, 1, H); px(3, 1 + hy, 10, 3, H); px(8, 4 + hy, 5, 5, H); px(4, 4 + hy, 2, 1, H); px(5, 1 + hy, 3, 1, HL);
      px(5, 6 + hy, 1, 2, '#2a1e1a'); px(4, 8 + hy, 1, 1, '#f0a8a0'); px(3, 6 + hy, 1, 2, P.skin);
    }
    // hair styles
    if (P.style === 'bob') {
      if (dir !== 'up') { px(3, 4 + hy, 1, 5, H); if (dir === 'down') px(12, 4 + hy, 1, 5, H); else px(12, 4 + hy, 1, 6, H); }
      else px(3, 9 + hy, 10, 1, H);
      px(dir === 'right' ? 4 : 11, 1 + hy, 2, 2, P.acc); px(dir === 'right' ? 4 : 11, 0 + hy, 1, 1, '#ffd27a');
    } else if (P.style === 'spiky') {
      px(4, -1 + hy + 1, 1, 1, H); px(7, -1 + hy + 1, 2, 1, H); px(11, -1 + hy + 1, 1, 1, H);
      px(3, 3 + hy, 10, 1, P.acc);
      if (dir === 'up' || side) px(dir === 'left' ? 12 : 3, 4 + hy, 1, 3, P.acc);
    } else if (P.style === 'long') {
      if (dir === 'up') px(3, 9 + hy, 10, 5, H);
      else if (dir === 'down') { px(2, 4 + hy, 2, 9, H); px(12, 4 + hy, 2, 9, H); }
      else px(9, 8 + hy, 4, 6, H);
      px(7, -1 + hy + 1, 2, 1, '#c8402e'); px(dir === 'right' ? 3 : 11, 2 + hy, 2, 2, P.acc); px(dir === 'right' ? 3 : 11, 4 + hy, 2, 1, '#8a6a20');
    } else if (P.style === 'bun') {
      px(6, -1 + hy + 1, 4, 1, H); px(6, 0 + hy, 4, 2, H); px(7, 0 + hy, 2, 1, HL);
      px(9, 1 + hy, 3, 1, '#c8402e');
    } else if (P.style === 'bald') {
      px(3, 1 + hy, 10, 2, P.skin); px(4, 0 + hy, 8, 1, P.skin); px(3, 3 + hy, 10, 1, P.acc || H);
      if (dir === 'down') { px(5, 4 + hy, 1, 1, H); px(10, 4 + hy, 1, 1, H); }
      if (P.hair === '#d8d4d0' && dir !== 'up') { px(6, 8 + hy, 4, 2, P.hair); }
    } else if (P.style === 'tied') {
      if (dir === 'down') { px(3, 4 + hy, 1, 4, H); px(12, 4 + hy, 1, 4, H); }
      px(dir === 'left' ? 11 : dir === 'right' ? 2 : 6, (dir === 'up' ? 9 : 1) + hy, dir === 'up' ? 4 : 3, 3, H);
      px(dir === 'left' ? 11 : 5, 1 + hy, 2, 1, '#e8c860');
    } else if (P.style === 'hat') {
      px(1, 2 + hy, 14, 2, '#d8b56a'); px(3, 0 + hy, 10, 2, '#c9a45a'); px(5, -1 + hy + 1, 6, 1, '#e8c87a'); px(1, 3 + hy, 14, 1, '#a8843a');
    } else if (P.style === 'kerchief') {
      px(3, 1 + hy, 10, 2, P.acc); px(4, 0 + hy, 8, 1, P.acc); px(dir === 'left' ? 11 : 3, 3 + hy, 2, 2, P.acc);
    }
  }

  /** a walking frame: key = palette name, dir, step 0..3 */
  GFX.person = function (name, dir, step) {
    const P = PAL[name] || PAL.villager;
    const flip = dir === 'right';
    const d = flip ? 'left' : dir;
    return cached(`p:${name}:${dir}:${step}`, 16, 20, (g) => {
      const c = mk(16, 20), gg = c.getContext('2d');
      drawPerson(gg, P, d, P.float ? 0 : step);
      outline(c);
      if (flip) { g.translate(16, 0); g.scale(-1, 1); }
      g.drawImage(c, 0, 0);
    });
  };
  GFX.cat = function (dir, step) {
    return cached(`cat:${dir}:${step}`, 16, 20, (g) => {
      const c = mk(16, 20), x = c.getContext('2d');
      const o = '#e89a4a', od = '#c0702a', w = '#fbf0e0';
      const side = dir === 'left' || dir === 'right';
      if (!side) {
        R(x, 9, 12, 6, 6, o); R(x, 8, 16, 2, 3, o); R(x, 12, 16, 2, 3, o); R(x, 10, 13, 2, 3, w);
        R(x, 3, 9, 7, 6, o); R(x, 3, 8, 2, 2, o); R(x, 8, 8, 2, 2, o); R(x, 4, 9, 1, 1, '#f0a8a0'); R(x, 9, 9, 1, 1, '#f0a8a0');
        if (dir === 'down') { R(x, 4, 11, 1, 1, '#2a1e1a'); R(x, 8, 11, 1, 1, '#2a1e1a'); R(x, 6, 12, 1, 1, '#d87a6a'); R(x, 5, 13, 3, 1, w); }
        R(x, 14, 11 + (step % 2), 1, 5, od);
      } else {
        R(x, 4, 12, 9, 5, o); R(x, 5, 17, 2, 2, o); R(x, 10, 17, 2, 2, o); R(x, 6, 14, 4, 1, od);
        R(x, 1, 8, 6, 6, o); R(x, 1, 7, 2, 2, o); R(x, 5, 7, 2, 2, o); R(x, 2, 10, 1, 1, '#2a1e1a'); R(x, 1, 12, 2, 1, w);
        R(x, 13, 9 + (step % 2), 1, 5, od); R(x, 14, 8, 1, 2, od);
      }
      outline(c);
      if (dir === 'right') { g.translate(16, 0); g.scale(-1, 1); }
      g.drawImage(c, 0, 0);
    });
  };

  /* ---------------- big decorations ---------------- */
  GFX.oak = (calm) => cached('oak' + (calm ? 1 : 0), 64, 64, (g) => {
    const c = mk(64, 64), x = c.getContext('2d');
    const leaf = calm ? ['#3f7a3a', '#2b5a2c', '#5f9a4c'] : ['#3a3a4a', '#26263a', '#50506a'];
    // roots
    x.fillStyle = '#4a3220';
    for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(14 + i * 9, 58, 6, 3, (i - 2) * 0.3, 0, 7); x.fill(); }
    // twisted trunk
    x.fillStyle = '#5a3e26'; x.beginPath(); x.moveTo(22, 60); x.bezierCurveTo(18, 44, 34, 40, 26, 26); x.lineTo(40, 26); x.bezierCurveTo(46, 40, 30, 46, 42, 60); x.fill();
    x.strokeStyle = '#3a2616'; x.lineWidth = 2; x.beginPath(); x.moveTo(28, 58); x.bezierCurveTo(26, 46, 36, 42, 32, 30); x.stroke();
    if (!calm) { x.fillStyle = '#ff5a3a'; x.fillRect(27, 40, 3, 2); x.fillRect(35, 40, 3, 2); x.fillStyle = '#1a0c08'; x.fillRect(28, 46, 8, 3); }
    else { x.fillStyle = '#3a2616'; x.fillRect(28, 41, 2, 1); x.fillRect(35, 41, 2, 1); }
    const blob = (cx, cy, r) => { x.fillStyle = leaf[1]; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.fillStyle = leaf[0]; x.beginPath(); x.arc(cx - 1, cy - 2, r - 2, 0, 7); x.fill(); x.fillStyle = leaf[2]; x.beginPath(); x.arc(cx - r * 0.4, cy - r * 0.45, r * 0.35, 0, 7); x.fill(); };
    blob(18, 20, 12); blob(46, 20, 12); blob(32, 13, 13); blob(24, 28, 9); blob(42, 28, 9);
    outline(c); g.drawImage(c, 0, 0);
  });
  GFX.hanzaki = (t) => cached('hanzaki' + (Math.floor(t * 2) % 2), 72, 40, (g) => {
    const c = mk(72, 40), x = c.getContext('2d'), br = Math.floor(t * 2) % 2;
    x.fillStyle = '#5a5244'; x.beginPath(); x.ellipse(40, 24, 30, 12 + br, 0, 0, 7); x.fill();
    x.beginPath(); x.ellipse(14, 22, 14, 11, 0, 0, 7); x.fill();
    x.fillStyle = '#6e6656'; x.beginPath(); x.ellipse(36, 20, 22, 6, 0, 0, 7); x.fill();
    x.fillStyle = '#3e382e'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(20 + i * 6, 18 + (i % 3) * 5, 2, 0, 7); x.fill(); }
    x.fillStyle = '#4a4438'; x.fillRect(16, 32, 6, 6); x.fillRect(52, 32, 6, 6); x.fillRect(64, 26, 8, 4);
    x.fillStyle = '#e8d070'; x.fillRect(8, 18, 2, 2); x.fillRect(16, 18, 2, 2);
    x.fillStyle = '#2a2620'; x.fillRect(4, 27, 18, 1);
    outline(c); g.drawImage(c, 0, 0);
  });
  GFX.yoigurai = (t) => cached('yoi' + (Math.floor(t * 3) % 3), 56, 64, (g) => {
    const c = mk(56, 64), x = c.getContext('2d'), k = Math.floor(t * 3) % 3;
    x.fillStyle = '#181428';
    x.beginPath(); x.moveTo(28, 2); x.bezierCurveTo(50, 8, 54, 40, 50, 62); x.lineTo(6, 62); x.bezierCurveTo(2, 40, 6, 8, 28, 2); x.fill();
    x.fillStyle = '#2a2244'; x.beginPath(); x.ellipse(28, 22, 13, 12, 0, 0, 7); x.fill();
    x.fillStyle = '#e8e0ff'; x.beginPath(); x.arc(28, 22, 9, 0.2, Math.PI - 0.2); x.fill();
    x.fillStyle = '#181428'; x.beginPath(); x.arc(28, 18, 9, 0.2, Math.PI - 0.2); x.fill();
    const eyes = [[16, 34], [38, 30], [22, 44], [34, 48], [12, 50], [44, 46]];
    eyes.forEach(([ex, ey], i) => { x.fillStyle = (i + k) % 3 === 0 ? '#ffb04a' : '#9b6bd6'; x.fillRect(ex, ey, 2, 2); });
    for (let i = 0; i < 6; i++) { x.fillStyle = '#181428'; x.fillRect(4 + i * 9 + k, 60, 4, 4); }
    outline(c); g.drawImage(c, 0, 0);
  });
  GFX.torii = (w) => cached('torii' + w, w * 16, 48, (g) => {
    const W = w * 16, c = mk(W, 48), x = c.getContext('2d');
    const pl = 5, pr = W - 11;
    x.fillStyle = C.verm; x.fillRect(pl, 8, 6, 40); x.fillRect(pr, 8, 6, 40);
    x.fillStyle = '#d8604a'; x.fillRect(pl + 1, 8, 1, 40); x.fillRect(pr + 1, 8, 1, 40);
    x.fillStyle = '#2a2220'; x.fillRect(pl - 1, 42, 8, 6); x.fillRect(pr - 1, 42, 8, 6);
    x.fillStyle = C.verm; x.fillRect(2, 14, W - 4, 4);
    x.fillStyle = '#2a2220'; x.beginPath(); x.moveTo(0, 2); x.quadraticCurveTo(W / 2, 8, W, 2); x.lineTo(W, 7); x.quadraticCurveTo(W / 2, 12, 0, 7); x.fill();
    x.fillStyle = C.verm; x.fillRect(4, 7, W - 8, 4);
    x.fillStyle = '#e8dcc4'; x.fillRect(W / 2 - 4, 11, 8, 7);
    outline(c); g.drawImage(c, 0, 0);
  });
  GFX.spring = (t) => {
    const k = Math.floor(t * 3) % 3;
    return cached('spring' + k, 16, 16, (g) => {
      g.fillStyle = C.ink; g.beginPath(); g.ellipse(8, 9, 7.5, 6, 0, 0, 7); g.fill();
      g.fillStyle = '#8c857a'; g.beginPath(); g.ellipse(8, 9, 6.6, 5.2, 0, 0, 7); g.fill();
      g.fillStyle = '#4aa0c8'; g.beginPath(); g.ellipse(8, 9, 4.8, 3.6, 0, 0, 7); g.fill();
      R(g, 5 + k, 8, 2, 1, '#c8f0ff'); R(g, 9 - k, 10, 2, 1, '#c8f0ff');
    });
  };

  /* ---------------- text & window frames (UI) ---------------- */
  GFX.FONT = '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", Meiryo, "Noto Sans JP", sans-serif';
  GFX.SERIF = '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", serif';
  const fontCache = {};
  GFX.font = (size, weight = 700, serif) => fontCache[size + ':' + weight + ':' + serif] || (fontCache[size + ':' + weight + ':' + serif] = `${weight} ${size}px ${serif ? GFX.SERIF : GFX.FONT}`);
  GFX.text = function (g, str, x, y, o = {}) {
    g.font = GFX.font(o.size || 11, o.weight || 700, o.serif);
    g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'top';
    if (o.shadow !== false) { g.fillStyle = o.shadowColor || 'rgba(0,0,0,.55)'; g.fillText(str, x + 0.6, y + 0.8); }
    g.fillStyle = o.color || '#f4efe2';
    g.fillText(str, x, y);
  };
  const NO_START = '、。，．・：；？！ー」』）】〕…‥ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ'; // kinsoku: never at the start of a line
  /** wraps Japanese text (explicit \n, width in logical px) → lines */
  GFX.wrap = function (g, str, maxW, size) {
    g.font = GFX.font(size || 11);
    const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const ch of para) {
        if (g.measureText(line + ch).width > maxW && line) {
          if (NO_START.includes(ch)) { line += ch; continue; }
          out.push(line); line = ch;
        } else line += ch;
      }
      out.push(line);
    }
    return out;
  };
  /** the game's window: deep indigo with a thin gold line and corner knots */
  GFX.frame = function (g, x, y, w, h, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    g.save();
    g.fillStyle = o.bg || 'rgba(17,19,40,.97)';
    g.beginPath(); g.roundRect(x, y, w, h, 4); g.fill();
    const grd = g.createLinearGradient(0, y, 0, y + h); grd.addColorStop(0, 'rgba(255,255,255,.06)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.roundRect(x, y, w, h, 4); g.fill();
    g.strokeStyle = o.line || 'rgba(214,178,98,.9)'; g.lineWidth = 0.8;
    g.beginPath(); g.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 3); g.stroke();
    g.strokeStyle = 'rgba(214,178,98,.28)'; g.lineWidth = 0.5;
    g.beginPath(); g.roundRect(x + 3.5, y + 3.5, w - 7, h - 7, 2); g.stroke();
    // corner knots (a small diamond like a cord knot)
    g.fillStyle = o.line || '#d6b262';
    for (const [cx, cy] of [[x + 1.5, y + 1.5], [x + w - 1.5, y + 1.5], [x + 1.5, y + h - 1.5], [x + w - 1.5, y + h - 1.5]]) { g.beginPath(); g.moveTo(cx, cy - 2.2); g.lineTo(cx + 2.2, cy); g.lineTo(cx, cy + 2.2); g.lineTo(cx - 2.2, cy); g.fill(); }
    g.restore();
  };
  /** the selection cursor: a small flame */
  GFX.cursor = function (g, x, y, t) {
    const s = 1 + Math.sin(t * 8) * 0.12;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(0, -5); g.quadraticCurveTo(4, -1, 2.6, 2.4); g.quadraticCurveTo(0, 4.2, -2.6, 2.4); g.quadraticCurveTo(-4, -1, 0, -5); g.fill();
    g.fillStyle = '#ffe2a0'; g.beginPath(); g.moveTo(0, -1.6); g.quadraticCurveTo(1.8, 0.6, 1, 2); g.quadraticCurveTo(0, 2.8, -1, 2); g.quadraticCurveTo(-1.8, 0.6, 0, -1.6); g.fill();
    g.restore();
  };
  GFX.gauge = function (g, x, y, w, h, frac, col, back) {
    g.fillStyle = back || 'rgba(0,0,0,.5)'; g.fillRect(x, y, w, h);
    g.fillStyle = col; g.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, Math.max(0.5, h * 0.35));
  };
  /** a portrait image cropped to its upper part (the face), in a rounded box */
  GFX.face = function (g, img, x, y, s, o = {}) {
    g.save();
    g.beginPath(); g.roundRect(x, y, s, s, o.r == null ? 3 : o.r); g.clip();
    g.fillStyle = o.bg || '#2a2c48'; g.fillRect(x, y, s, s);
    if (img) {
      const iw = img.width || 512, ih = img.height || 512;
      const crop = o.full ? 1 : 0.62;
      const sw = iw * crop, sh = ih * crop;
      g.imageSmoothingEnabled = true;
      g.drawImage(img, (iw - sw) / 2, o.full ? 0 : ih * 0.02, sw, sh, x, y, s, s);
    }
    if (o.dim) { g.fillStyle = 'rgba(10,10,20,.6)'; g.fillRect(x, y, s, s); }
    g.restore();
    g.strokeStyle = 'rgba(214,178,98,.75)'; g.lineWidth = 0.7; g.beginPath(); g.roundRect(x + 0.35, y + 0.35, s - 0.7, s - 0.7, o.r == null ? 3 : o.r); g.stroke();
  };
  /** draws an image to cover the rect */
  GFX.cover = function (g, img, x, y, w, h, ax = 0.5, ay = 0.5) {
    if (!img) return;
    const iw = img.width, ih = img.height, s = Math.max(w / iw, h / ih);
    const sw = w / s, sh = h / s;
    g.imageSmoothingEnabled = true;
    g.drawImage(img, (iw - sw) * ax, (ih - sh) * ay, sw, sh, x, y, w, h);
  };
})();
