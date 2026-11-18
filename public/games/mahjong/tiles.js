/*
 * 宵月麻雀 — tiles drawn in code (window.TILES). Every face is canvas paths + system mincho glyphs; no image files.
 *   TILES.sprite(face, px, side)  → canvas of a tile lying on the table (face + the edge toward the viewer)
 *                                   face: kind 0–33, 34/35/36 = red 5萬/5筒/5索, 'back'. px = width in device pixels.
 *                                   side: turned 90° (riichi tile, called tile). Size: px × px·1.54 (side: px·1.36 × px·1.18)
 *   TILES.url(face, side)         → data URL (for <img> in the result screens)
 *   TILES.faceOf(id, aka)
 */
(function () {
  'use strict';
  const SERIF = '"Yu Mincho", YuMincho, "Hiragino Mincho ProN", "Noto Serif JP", "BIZ UDPMincho", "MS PMincho", serif';
  const HR = 1.36, TR = 0.18; // face height / width, edge / width
  const C = {
    ink: '#1b2140', red: '#c4182c', green: '#14774a', blue: '#1f4f9c', gold: '#e2a33a',
    face1: '#fffdf7', face2: '#efe6d2', ivory: '#e2d6bb', back1: '#e0913a', back2: '#a65d1c',
  };
  const KANJI = '一二三四五六七八九';
  const HONOR = '東南西北白發中';
  const cache = new Map();

  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function disc(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }

  /* ---------------- faces, in a 60 × 82 design box ---------------- */
  function man(g, n, red) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = red ? C.red : C.ink;
    g.strokeStyle = g.fillStyle; g.lineWidth = 0.9; g.lineJoin = 'round';
    g.font = `900 31px ${SERIF}`;
    g.fillText(KANJI[n - 1], 30, 24); g.strokeText(KANJI[n - 1], 30, 24);
    g.fillStyle = C.red; g.strokeStyle = C.red;
    g.font = `900 33px ${SERIF}`;
    g.fillText('萬', 30, 59); g.strokeText('萬', 30, 59);
  }
  function coin(g, x, y, r, col) {
    g.fillStyle = col; disc(g, x, y, r);
    g.fillStyle = '#fffaf0'; disc(g, x, y, r * 0.8);
    g.fillStyle = col; disc(g, x, y, r * 0.6);
    g.fillStyle = '#fffaf0'; disc(g, x, y, r * 0.24);
    if (r >= 8) {
      g.fillStyle = col;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; disc(g, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.065); }
    }
  }
  const PIN = {
    2: [[30, 22, 12, 'g'], [30, 60, 12, 'b']],
    3: [[15, 17, 10, 'b'], [30, 41, 10, 'r'], [45, 65, 10, 'g']],
    4: [[17, 22, 11, 'b'], [43, 22, 11, 'g'], [17, 60, 11, 'g'], [43, 60, 11, 'b']],
    5: [[16, 17, 10, 'b'], [44, 17, 10, 'g'], [30, 41, 10, 'r'], [16, 65, 10, 'g'], [44, 65, 10, 'b']],
    6: [[18, 15, 9, 'g'], [42, 15, 9, 'g'], [18, 41, 9, 'r'], [42, 41, 9, 'r'], [18, 67, 9, 'r'], [42, 67, 9, 'r']],
    7: [[13, 12, 7.5, 'g'], [30, 20, 7.5, 'g'], [47, 28, 7.5, 'g'], [18, 50, 8.5, 'r'], [42, 50, 8.5, 'r'], [18, 70, 8.5, 'r'], [42, 70, 8.5, 'r']],
    8: [12, 31, 51, 70].flatMap((y) => [[18, y, 8.2, 'b'], [42, y, 8.2, 'b']]),
    9: [[15, 'b'], [41, 'r'], [67, 'g']].flatMap(([y, c]) => [13, 30, 47].map((x) => [x, y, 8, c])),
  };
  function pin(g, n, red) {
    const col = { b: C.blue, g: C.green, r: C.red };
    if (n === 1) {
      g.fillStyle = C.blue; disc(g, 30, 41, 23);
      g.fillStyle = '#fffaf0'; disc(g, 30, 41, 19.5);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.fillStyle = i % 2 ? C.green : C.red;
        g.beginPath(); g.ellipse(30 + Math.cos(a) * 15, 41 + Math.sin(a) * 15, 3.6, 2, a, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = red ? C.red : C.green; disc(g, 30, 41, 10);
      g.fillStyle = '#fffaf0'; disc(g, 30, 41, 6.5);
      g.fillStyle = C.red; disc(g, 30, 41, 3.2);
      return;
    }
    for (const [x, y, r, c] of PIN[n]) coin(g, x, y, r, red ? C.red : col[c]);
  }
  function stick(g, x, y, h, col, ang) {
    g.save(); g.translate(x, y); if (ang) g.rotate(ang);
    const w = 7.4;
    g.fillStyle = col; rr(g, -w / 2, -h / 2, w, h, w / 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)';
    g.fillRect(-w / 2 + 0.8, -0.7, w - 1.6, 1.4);
    g.fillRect(-w / 2 + 0.8, -h / 2 + 2.4, w - 1.6, 1);
    g.fillRect(-w / 2 + 0.8, h / 2 - 3.4, w - 1.6, 1);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-w / 2 + 1.4, -h / 2 + 3.5, 1.5, h - 7);
    g.restore();
  }
  function bird(g, red) {
    const body = red ? C.red : C.green;
    g.lineCap = 'round';
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(9, 69); g.lineTo(52, 62); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(41, 64); g.lineTo(47, 73); g.stroke();
    [[2.25, C.blue], [2.6, C.green], [2.95, C.red]].forEach(([a, c]) => {
      g.fillStyle = c; g.beginPath(); g.ellipse(21 + Math.cos(a) * 9, 53 + Math.sin(a) * 9 + 6, 10.5, 3.3, a, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = body; g.beginPath(); g.ellipse(32, 44, 12.5, 15.5, -0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0b04a'; g.beginPath(); g.ellipse(36.5, 49, 6.5, 9.5, -0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.moveTo(23, 37); g.quadraticCurveTo(29, 52, 21, 59); g.quadraticCurveTo(34, 53, 33, 39); g.closePath(); g.fill();
    g.fillStyle = body; disc(g, 40, 25, 8.5);
    g.fillStyle = C.red; g.beginPath(); g.moveTo(36.5, 18); g.lineTo(40.5, 9); g.lineTo(44, 18.5); g.closePath(); g.fill();
    g.fillStyle = '#fff'; disc(g, 42.6, 23.6, 2.7);
    g.fillStyle = C.ink; disc(g, 43.2, 23.8, 1.45);
    g.fillStyle = '#e08a1e'; g.beginPath(); g.moveTo(47.5, 22.5); g.lineTo(55.5, 26.2); g.lineTo(47, 28.8); g.closePath(); g.fill();
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(31, 58); g.lineTo(30, 64.5); g.moveTo(36, 57); g.lineTo(37, 63.5); g.stroke();
  }
  const SOU = {
    2: [[30, 22, 27], [30, 60, 27]],
    3: [[30, 22, 27], [18, 60, 27], [42, 60, 27]],
    4: [[19, 22, 27], [41, 22, 27], [19, 60, 27], [41, 60, 27]],
    5: [[15, 22, 25], [45, 22, 25], [30, 41, 25, 1], [15, 60, 25], [45, 60, 25]],
    6: [14, 30, 46].flatMap((x) => [[x, 22, 27], [x, 60, 27]]),
    7: [[30, 13, 19, 1], ...[14, 30, 46].flatMap((x) => [[x, 40, 22], [x, 66, 22]])],
    8: [[12.5, 22, 27, 0, 0.3], [24.5, 22, 27, 0, -0.3], [35.5, 22, 27, 0, 0.3], [47.5, 22, 27, 0, -0.3],
      [12.5, 60, 27, 0, -0.3], [24.5, 60, 27, 0, 0.3], [35.5, 60, 27, 0, -0.3], [47.5, 60, 27, 0, 0.3]],
    9: [15, 41, 67].flatMap((y) => [[14, y, 22], [30, y, 22, 1], [46, y, 22]]),
  };
  function sou(g, n, red) {
    if (n === 1) { bird(g, red); return; }
    for (const [x, y, h, r, a] of SOU[n]) stick(g, x, y, h, red || r ? C.red : C.green, a || 0);
  }
  function honor(g, i) {
    if (i === 4) {
      g.strokeStyle = '#2d6db5'; g.lineWidth = 2.8; rr(g, 13, 15, 34, 52, 4); g.stroke();
      g.lineWidth = 1.1; rr(g, 17, 19, 26, 44, 2.5); g.stroke();
      return;
    }
    const col = i === 5 ? C.green : i === 6 ? C.red : C.ink;
    g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1; g.lineJoin = 'round';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 41px ${SERIF}`;
    g.fillText(HONOR[i], 30, 43); g.strokeText(HONOR[i], 30, 43);
  }
  function art(g, face) {
    let k = face, red = false;
    if (face >= 34) { red = true; k = [4, 13, 22][face - 34]; }
    if (k < 9) man(g, k + 1, red);
    else if (k < 18) pin(g, k - 8, red);
    else if (k < 27) sou(g, k - 17, red);
    else honor(g, k - 27);
  }

  /* ---------------- the whole tile ---------------- */
  function sprite(face, px, side) {
    px = Math.max(8, Math.round(px));
    const key = `${face}:${px}:${side ? 1 : 0}`;
    let cv = cache.get(key);
    if (cv) return cv;
    if (cache.size > 2400) cache.clear();
    const W = px, Hf = Math.round(px * HR), T = Math.max(2, Math.round(px * TR));
    const fw = side ? Hf : W, fh = side ? W : Hf;
    cv = document.createElement('canvas');
    cv.width = fw; cv.height = fh + T;
    const g = cv.getContext('2d');
    const r = Math.max(2, W * 0.13);
    // the edge toward the viewer: ivory layer, then the coloured back layer
    let gr = g.createLinearGradient(0, fh - r, 0, fh + T);
    gr.addColorStop(0, C.ivory); gr.addColorStop(0.42, C.ivory); gr.addColorStop(0.46, C.back1); gr.addColorStop(1, C.back2);
    g.fillStyle = gr; rr(g, 0, 0, fw, fh + T, r); g.fill();
    // face
    if (face === 'back') {
      gr = g.createLinearGradient(0, 0, fw, fh);
      gr.addColorStop(0, '#f0a54c'); gr.addColorStop(1, C.back2);
      g.fillStyle = gr; rr(g, 0, 0, fw, fh, r); g.fill();
      g.strokeStyle = 'rgba(255,240,210,.35)'; g.lineWidth = Math.max(1, W * 0.04); rr(g, W * 0.12, W * 0.12, fw - W * 0.24, fh - W * 0.24, r * 0.6); g.stroke();
    } else {
      gr = g.createLinearGradient(0, 0, 0, fh);
      gr.addColorStop(0, C.face1); gr.addColorStop(1, C.face2);
      g.fillStyle = gr; rr(g, 0, 0, fw, fh, r); g.fill();
      g.save();
      if (side) { g.translate(0, fh); g.rotate(-Math.PI / 2); }
      const inset = 0.06;
      g.translate(W * inset, Hf * inset);
      g.scale((W * (1 - inset * 2)) / 60, (Hf * (1 - inset * 2)) / 82);
      art(g, face);
      g.restore();
    }
    g.strokeStyle = 'rgba(60,40,20,.28)'; g.lineWidth = Math.max(0.8, W * 0.025); rr(g, 0.5, 0.5, fw - 1, fh + T - 1, r); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(0.6, W * 0.02); rr(g, 1.2, 1.2, fw - 2.4, fh - 2.4, r * 0.9); g.stroke();
    cache.set(key, cv);
    return cv;
  }
  const urls = new Map();
  function url(face, side) {
    const key = face + (side ? 's' : '');
    if (!urls.has(key)) urls.set(key, sprite(face, 88, side).toDataURL('image/png'));
    return urls.get(key);
  }
  const RED_IDS = [16, 52, 88];
  const faceOf = (id, aka) => (aka && RED_IDS.includes(id) ? 34 + RED_IDS.indexOf(id) : id >> 2);

  window.TILES = { sprite, url, faceOf, HR, TR, TOT: HR + TR };
})();
