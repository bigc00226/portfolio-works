/* 千代紙飛行 — art & music: origami sprites, bosses, parallax backgrounds and the original BGM, all made in code. window.OZ */
(() => {
  'use strict';
  const OZ = (window.OZ = {});
  const PI = Math.PI, TAU = PI * 2;
  let RS = 3;
  /** sprites are drawn at the screen's pixel scale, so that each one is a 1:1 blit */
  OZ.setRS = function (v) {
    v = Math.max(1, Math.min(4, Math.round(v * 2) / 2));
    if (v === RS) return;
    RS = v;
    for (const [k, c] of memo) if (typeof c !== 'string') memo.delete(k);
  };

  /* ---------- paper shading ---------- */
  const memo = new Map();
  function shade(hex, f) {
    const k = hex + '|' + f;
    let v = memo.get(k);
    if (v) return v;
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f >= 1) { const t = Math.min(1, f - 1); r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; } else { r *= f; g *= f; b *= f; }
    v = `rgb(${r | 0},${g | 0},${b | 0})`;
    memo.set(k, v);
    return v;
  }
  OZ.shade = shade;
  function path(g, p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
  OZ.path = path;
  /** faces: [[shade, [x,y,…], colour?], …] — each face a flat fold of paper */
  function faces(g, list, col, edge = 0.55, ink = 'rgba(40,24,16,.5)') {
    for (const f of list) { path(g, f[1]); g.fillStyle = shade(f[2] || col, f[0]); g.fill(); }
    if (edge) { g.lineJoin = 'round'; g.lineWidth = edge; g.strokeStyle = ink; for (const f of list) { path(g, f[1]); g.stroke(); } }
  }
  OZ.faces = faces;
  function shadow(g, list, dx = 2.2, dy = 3.2, a = 0.22) {
    g.save(); g.translate(dx, dy); g.fillStyle = `rgba(20,12,8,${a})`;
    for (const f of list) { path(g, f[1]); g.fill(); }
    g.restore();
  }
  const rotP = (p, a) => { const c = Math.cos(a), s = Math.sin(a), o = []; for (let i = 0; i < p.length; i += 2) o.push(p[i] * c - p[i + 1] * s, p[i] * s + p[i + 1] * c); return o; };
  const scaleGeo = (list, s) => list.map((f) => [f[0], f[1].map((v) => v * s), f[2]]);

  /** the crane, facing up (−y). flap: wing-tip offset */
  function craneGeo(flap, body, wing) {
    return [
      [1.22, [-2.4, -3, -18, 1 + flap, -9, 2.5], wing],
      [0.84, [-2.4, -3, -9, 2.5, -2.4, 5], wing],
      [0.98, [2.4, -3, 18, 1 + flap, 9, 2.5], wing],
      [0.66, [2.4, -3, 9, 2.5, 2.4, 5], wing],
      [1.08, [0, -6, -3.2, 0, 0, 7], body],
      [0.8, [0, -6, 3.2, 0, 0, 7], body],
      [1.1, [0, -17, -1.7, -5, 0, -4], body],
      [0.82, [0, -17, 1.7, -5, 0, -4], body],
      [1.0, [0, -17, 3.2, -14.4, 0.6, -15], body],
      [1.0, [0, 6, -1.7, 5, 0, 16], body],
      [0.74, [0, 6, 1.7, 5, 0, 16], body],
    ];
  }
  OZ.craneGeo = craneGeo;

  /* ---------- canvases ---------- */
  function mk(size, fn) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = Math.ceil(size * RS);
    const g = cv.getContext('2d');
    g.scale(RS, RS); g.translate(size / 2, size / 2);
    fn(g);
    cv.size = size; cv.rs = RS;
    return cv;
  }

  /* ---------- enemy bullets (pointing +x) ---------- */
  const DARK = 'rgba(28,16,10,.82)';
  const BT = {
    rice: { size: 16, hit: 2.8, rot: true, draw(g, c) {
      g.beginPath(); g.ellipse(0, 0, 7, 4.1, 0, 0, TAU); g.fillStyle = DARK; g.fill();
      g.beginPath(); g.ellipse(0, 0, 6, 3.2, 0, 0, TAU); g.fillStyle = c; g.fill();
      g.beginPath(); g.ellipse(0, 0, 6, 3.2, 0, PI, TAU); g.closePath(); g.fillStyle = shade(c, 1.4); g.fill();
      g.beginPath(); g.ellipse(0.8, 0, 3.2, 1.3, 0, 0, TAU); g.fillStyle = '#fff'; g.fill();
    } },
    scale: { size: 18, hit: 3.1, rot: true, draw(g, c) {
      path(g, [8.6, 0, 0, -5.4, -7.6, 0, 0, 5.4]); g.fillStyle = DARK; g.fill();
      path(g, [7, 0, 0, -4.2, -6.2, 0]); g.fillStyle = shade(c, 1.35); g.fill();
      path(g, [7, 0, -6.2, 0, 0, 4.2]); g.fillStyle = c; g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-3.5, 0); g.lineTo(5.5, 0); g.stroke();
    } },
    orb: { size: 16, hit: 3.7, rot: false, draw(g, c) {
      g.beginPath(); g.arc(0, 0, 6.8, 0, TAU); g.fillStyle = DARK; g.fill();
      g.beginPath(); g.arc(0, 0, 5.8, 0, TAU); g.fillStyle = c; g.fill();
      g.beginPath(); g.arc(0, 0, 5.8, PI * 0.75, PI * 1.75); g.closePath(); g.fillStyle = shade(c, 1.35); g.fill();
      g.beginPath(); g.arc(0, 0, 2.9, 0, TAU); g.fillStyle = '#fff'; g.fill();
    } },
    big: { size: 36, hit: 9.5, rot: false, draw(g, c) {
      g.beginPath(); g.arc(0, 0, 16.5, 0, TAU); g.fillStyle = shade(c, 1.2).replace('rgb', 'rgba').replace(')', ',.22)'); g.fill();
      g.beginPath(); g.arc(0, 0, 13.6, 0, TAU); g.fillStyle = DARK; g.fill();
      g.beginPath(); g.arc(0, 0, 12.4, 0, TAU); g.fillStyle = c; g.fill();
      g.beginPath(); g.arc(0, 0, 12.4, PI * 0.75, PI * 1.75); g.closePath(); g.fillStyle = shade(c, 1.3); g.fill();
      g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
    } },
    star: { size: 20, hit: 3.8, rot: true, draw(g, c) {
      const pts = []; for (let i = 0; i < 8; i++) { const r = i % 2 ? 3.2 : 8.4, a = (i / 8) * TAU; pts.push(Math.cos(a) * r, Math.sin(a) * r); }
      path(g, pts.map((v) => v * 1.18)); g.fillStyle = DARK; g.fill();
      for (let i = 0; i < 8; i++) { const a = pts.slice(i * 2, i * 2 + 2), b = pts.slice(((i + 1) % 8) * 2, ((i + 1) % 8) * 2 + 2); path(g, [0, 0, a[0], a[1], b[0], b[1]]); g.fillStyle = i % 2 ? c : shade(c, 1.4); g.fill(); }
      g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fillStyle = '#fff'; g.fill();
    } },
    needle: { size: 24, hit: 1.9, rot: true, draw(g, c) {
      path(g, [11.5, 0, 0, -3, -11.5, 0, 0, 3]); g.fillStyle = DARK; g.fill();
      path(g, [10, 0, 0, -2, -10, 0]); g.fillStyle = shade(c, 1.4); g.fill();
      path(g, [10, 0, -10, 0, 0, 2]); g.fillStyle = c; g.fill();
    } },
    petal: { size: 18, hit: 3.1, rot: true, draw(g, c) {
      const pet = () => { g.beginPath(); g.moveTo(-6, 0); g.bezierCurveTo(-3, -6, 4, -6, 7, -2.2); g.lineTo(5, 0); g.lineTo(7, 2.2); g.bezierCurveTo(4, 6, -3, 6, -6, 0); g.closePath(); };
      g.save(); g.scale(1.18, 1.25); pet(); g.fillStyle = DARK; g.fill(); g.restore();
      pet(); g.fillStyle = c; g.fill();
      g.save(); pet(); g.clip(); g.fillStyle = shade(c, 1.4); g.fillRect(-8, -8, 16, 8); g.restore();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-0.5, 0, 2.8, 1.1, 0, 0, TAU); g.fill();
    } },
    crane: { size: 24, hit: 3.6, rot: true, draw(g, c) {
      g.rotate(PI / 2); g.scale(0.52, 0.52);
      const geo = craneGeo(0, '#fbf6ec', c);
      g.save(); g.scale(1.22, 1.22); for (const f of geo) { path(g, f[1]); g.fillStyle = DARK; g.fill(); } g.restore();
      faces(g, geo, c, 0.6);
    } },
  };
  OZ.BT = BT;
  OZ.bspr = function (type, color) {
    const k = 'b' + type + color;
    let v = memo.get(k);
    if (!v) { v = mk(BT[type].size, (g) => BT[type].draw(g, color)); memo.set(k, v); }
    return v;
  };

  /* ---------- player shots ---------- */
  OZ.pspr = function (kind) {
    const k = 'p' + kind;
    let v = memo.get(k);
    if (v) return v;
    if (kind === 'dart') v = mk(20, (g) => {
      g.globalAlpha = 0.85;
      path(g, [9, 0, -8, -3.2, -5, 0]); g.fillStyle = '#fffaf0'; g.fill();
      path(g, [9, 0, -5, 0, -8, 3.2]); g.fillStyle = '#f2b8a8'; g.fill();
      g.strokeStyle = 'rgba(214,70,60,.9)'; g.lineWidth = 0.8; path(g, [9, 0, -8, -3.2, -5, 0, -8, 3.2]); g.stroke();
    });
    else if (kind === 'side') v = mk(16, (g) => {
      g.globalAlpha = 0.8;
      path(g, [7, 0, -6, -2.4, -4, 0]); g.fillStyle = '#fff3c2'; g.fill();
      path(g, [7, 0, -4, 0, -6, 2.4]); g.fillStyle = '#e9c35a'; g.fill();
    });
    else if (kind === 'pcrane') v = mk(22, (g) => { g.rotate(PI / 2); g.scale(0.5, 0.5); g.globalAlpha = 0.9; faces(g, craneGeo(0, '#fff8e8', '#f0c24a'), '#fff', 0.5); });
    else if (kind === 'needle') v = mk(22, (g) => { g.globalAlpha = 0.85; path(g, [10, 0, 0, -1.8, -10, 0, 0, 1.8]); g.fillStyle = '#ffe9a6'; g.fill(); g.fillStyle = '#fff'; g.fillRect(-6, -0.5, 14, 1); });
    memo.set(k, v);
    return v;
  };

  /* ---------- items (色紙 = power, 星 = points) ---------- */
  OZ.ispr = function (kind) {
    const k = 'i' + kind;
    let v = memo.get(k);
    if (v) return v;
    const sq = (g, s, c, mark) => {
      g.rotate(PI / 4);
      g.fillStyle = 'rgba(30,18,10,.55)'; g.fillRect(-s - 1.2, -s - 1.2, 2 * s + 2.4, 2 * s + 2.4);
      path(g, [-s, -s, s, -s, -s, s]); g.fillStyle = shade(c, 1.3); g.fill();
      path(g, [s, -s, s, s, -s, s]); g.fillStyle = c; g.fill();
      g.rotate(-PI / 4);
      if (mark) mark(g);
    };
    if (kind === 'p') v = mk(16, (g) => sq(g, 4.4, '#e5484d'));
    else if (kind === 'P') v = mk(24, (g) => sq(g, 7.2, '#e5484d', (g2) => { g2.fillStyle = '#fff'; g2.beginPath(); g2.arc(0, 0, 3, 0, TAU); g2.fill(); }));
    else if (kind === 'pt') v = mk(16, (g) => sq(g, 4.4, '#3b6fe0', (g2) => { g2.fillStyle = '#fff'; g2.fillRect(-0.8, -3, 1.6, 6); g2.fillRect(-3, -0.8, 6, 1.6); }));
    else if (kind === 'b') v = mk(24, (g) => sq(g, 7.2, '#2f9e63', (g2) => { g2.fillStyle = '#fff'; [[-2.5, -2], [2.4, -1], [-0.5, 2.6]].forEach(([x, y]) => g2.fillRect(x - 1.2, y - 1.2, 2.4, 2.4)); }));
    else if (kind === 'star') v = mk(12, (g) => { path(g, [0, -4.4, 2, 0, 0, 4.4, -2, 0]); g.fillStyle = '#ffd55a'; g.fill(); g.strokeStyle = 'rgba(120,70,0,.7)'; g.lineWidth = 0.6; g.stroke(); });
    memo.set(k, v);
    return v;
  };

  /* ---------- enemies (facing down, +y) ---------- */
  const GEO = {
    plane: [[1.18, [0, 12, -11, -11, -2.2, -11]], [0.78, [0, 12, -2.2, -11, 0, -8]], [0.6, [0, 12, 0, -8, 2.2, -11]], [0.95, [0, 12, 2.2, -11, 11, -11]]],
    frog: [
      [1.0, [-6, -4, -13, -12, -3, -7]], [0.8, [6, -4, 13, -12, 3, -7]],
      [0.9, [-5, 5, -12, 11, -3, 8]], [0.72, [5, 5, 12, 11, 3, 8]],
      [1.12, [0, -10, -8, 0, 0, 0]], [0.84, [-8, 0, 0, 10, 0, 0]], [0.95, [0, -10, 8, 0, 0, 0]], [0.68, [8, 0, 0, 10, 0, 0]],
    ],
    fish: [
      [1.1, [0, -7, -9, -17, -1, -12]], [0.8, [0, -7, 1, -12, 9, -17]],
      [1.15, [0, 11, -6, 2, -4, -6, 0, -8]], [0.78, [0, 11, 0, -8, 4, -6, 6, 2]],
      [1.25, [-6, 2, -11, 6, -5, 6], '#f5efe2'], [0.95, [6, 2, 11, 6, 5, 6], '#f5efe2'],
    ],
    boat: [
      [1.2, [-14, -7, 14, -7, 10, 0, -10, 0]], [0.72, [-10, 0, 10, 0, 14, 7, -14, 7]],
      [1.0, [-18, 0, -14, -7, -10, 0]], [0.6, [-18, 0, -10, 0, -14, 7]],
      [0.92, [18, 0, 14, -7, 10, 0]], [0.55, [18, 0, 10, 0, 14, 7]],
      [1.35, [-6, 0, 0, -5, 6, 0]], [1.05, [-6, 0, 6, 0, 0, 5]],
    ],
    kabuto: [
      [0.62, [-17, -9, 17, -9, 14, -14, -14, -14]],
      [1.15, [-14, -9, 0, -9, 0, 13]], [0.78, [0, -9, 14, -9, 0, 13]],
      [1.3, [-9, -9, -22, -22, -5, -9], '#e2b54a'], [1.0, [9, -9, 22, -22, 5, -9], '#e2b54a'],
      [1.2, [-4, -2, 0, -6, 4, -2, 0, 3], '#e2b54a'],
    ],
  };
  function shurikenGeo(c1, c2) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const a = (i * PI) / 2, c = i % 2 ? c2 : c1;
      out.push([i % 2 ? 0.8 : 1.15, rotP([-4, -4, 4, -4, -4, -15], a), c]);
      out.push([i % 2 ? 0.95 : 1.3, rotP([-4, -4, 0, 0, 4, -4], a), c]);
    }
    return out;
  }
  OZ.enemySprite = function (type, col, col2) {
    const k = 'e' + type + col + (col2 || '');
    let v = memo.get(k);
    if (v) return v;
    const size = type === 'kabuto' ? 52 : type === 'boat' ? 44 : type === 'crow' ? 44 : 36;
    v = mk(size, (g) => {
      if (type === 'crow') {
        g.rotate(PI); g.scale(1.15, 1.15);
        const geo = craneGeo(0, col2 || '#4a4152', col);
        shadow(g, geo, -2, -3); faces(g, geo, col, 0.5, 'rgba(255,220,200,.25)');
        g.fillStyle = '#e5484d'; g.beginPath(); g.arc(0.6, -15.4, 1.3, 0, TAU); g.fill();
        return;
      }
      const geo = type === 'shuriken' ? shurikenGeo(col, col2 || '#f1c232') : GEO[type];
      shadow(g, geo);
      faces(g, geo, col);
      if (type === 'frog') { for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 3.4, 6.2, 2, 0, TAU); g.fill(); g.fillStyle = '#1b1410'; g.beginPath(); g.arc(s * 3.4, 6.8, 1, 0, TAU); g.fill(); } }
      if (type === 'fish') { g.fillStyle = '#1b1410'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 2.6, 6.5, 1.1, 0, TAU); g.fill(); } }
      if (type === 'boat') { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-1, -4, 2, 8); }
    });
    memo.set(k, v);
    return v;
  };

  /* ---------- mid-bosses and bosses (drawn live) ---------- */
  const FROG_BIG = scaleGeo(GEO.frog, 1);
  OZ.drawBoss = {
    balloon(g, b, t) {
      g.save(); g.translate(b.x, b.y + Math.sin(t * 2) * 3);
      const R = 26, cols = ['#e5484d', '#fbf3e4', '#3b6fe0', '#f1c232', '#2f9e63', '#fbf3e4'];
      g.fillStyle = 'rgba(20,12,8,.25)'; g.beginPath(); g.arc(4, 6, R, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
      const off = (t * 0.9) % (TAU / 6);
      for (let i = -1; i < 7; i++) {
        const a0 = -PI / 2 + off + (i * PI) / 6, a1 = a0 + PI / 6;
        const x0 = R * Math.sin(Math.max(-PI / 2, Math.min(PI / 2, a0))), x1 = R * Math.sin(Math.max(-PI / 2, Math.min(PI / 2, a1)));
        g.fillStyle = cols[((i % 6) + 6) % 6]; g.fillRect(x0, -R, x1 - x0 + 0.5, 2 * R);
      }
      const sh = g.createRadialGradient(-9, -10, 2, 0, 0, R);
      sh.addColorStop(0, 'rgba(255,255,255,.45)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(40,20,10,.35)');
      g.fillStyle = sh; g.fillRect(-R, -R, 2 * R, 2 * R);
      g.restore();
      g.strokeStyle = 'rgba(40,24,16,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
      g.fillStyle = '#3a2a20'; g.beginPath(); g.arc(0, -R + 3, 3, 0, TAU); g.fill();
      g.restore();
    },
    yakko(g, b, t) {
      g.save(); g.translate(b.x, b.y);
      const sw = Math.sin(t * 2.4) * 0.08;
      const geo = [
        [0.7, [-10, 4, 10, 4, 15, 26, -15, 26], '#30365e'],
        [1.0, [-10, 4, 0, 4, 0, 26, -15, 26], '#30365e'],
        [1.12, rotP([-9, -8, -32, -14, -34, 6, -9, 4], -sw), '#3b4a8a'],
        [0.86, rotP([9, -8, 32, -14, 34, 6, 9, 4], sw), '#3b4a8a'],
        [1.0, [-9, -8, 9, -8, 9, 5, -9, 5], '#e7e0cf'],
        [0.85, [0, -8, 9, -8, 9, 5, 0, 5], '#e7e0cf'],
        [1.15, [0, -22, -8, -14, 0, -6], '#d6452f'], [0.85, [0, -22, 8, -14, 0, -6], '#d6452f'],
      ];
      shadow(g, geo); faces(g, geo, '#3b4a8a', 0.7);
      g.fillStyle = '#f5efe2'; g.fillRect(-4, -16, 8, 2);
      g.restore();
    },
    pinwheel(g, b, t) {
      g.save(); g.translate(b.x, b.y);
      g.fillStyle = '#6b4a2a'; g.fillRect(-1.5, 0, 3, 40);
      g.rotate(t * 3.2);
      const cols = ['#e5484d', '#f1c232', '#3b6fe0', '#2f9e63'];
      for (let i = 0; i < 4; i++) {
        const a = (i * PI) / 2;
        const f1 = [1.25, rotP([0, 0, 0, -30, 14, -16], a), cols[i]], f2 = [0.8, rotP([0, 0, 14, -16, 4, -4], a), cols[i]];
        shadow(g, [f1, f2], 2, 3, 0.18); faces(g, [f1, f2], cols[i], 0.6);
      }
      g.fillStyle = '#fbf3e4'; g.beginPath(); g.arc(0, 0, 3.5, 0, TAU); g.fill(); g.strokeStyle = '#3a2a20'; g.stroke();
      g.restore();
    },
    frog(g, b, t) {
      g.save(); g.translate(b.x, b.y);
      g.save(); g.scale(1, 0.8);
      g.fillStyle = 'rgba(20,40,20,.25)'; g.beginPath(); g.arc(5, 10, 50, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(0, 4); g.arc(0, 4, 48, -PI / 2 + 0.22, -PI / 2 - 0.22 + TAU); g.closePath(); g.fillStyle = '#3d7a47'; g.fill();
      g.strokeStyle = 'rgba(200,235,190,.35)'; g.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) { const a = -PI / 2 + 0.5 + i * 0.66; g.beginPath(); g.moveTo(0, 4); g.lineTo(Math.cos(a) * 44, 4 + Math.sin(a) * 44); g.stroke(); }
      g.restore();
      const s = 3.2 + Math.sin(t * 3) * 0.08 + (b.squash || 0);
      g.scale(s, s * (1 - (b.squash || 0) * 0.6));
      faces(g, FROG_BIG, '#62ad5a', 0.35);
      for (const k of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(k * 3.4, 6.2, 2.1, 0, TAU); g.fill(); g.fillStyle = '#1b1410'; g.beginPath(); g.arc(k * 3.4, 6.8, 1.05, 0, TAU); g.fill(); }
      g.fillStyle = '#e5484d'; g.beginPath(); g.moveTo(-2, -2); g.lineTo(2, -2); g.lineTo(0, 1); g.fill();
      g.restore();
    },
    carp(g, b, t) {
      g.save(); g.translate(b.x, b.y);
      const w = Math.sin(t * 4) * 0.22;
      const ink = '#1d1b28', red = '#d6452f';
      g.save(); g.translate(0, -30); g.rotate(w);
      g.fillStyle = red; path(g, [-5, 0, -30, -30, -8, -22, 0, -34, 8, -22, 30, -30, 5, 0]); g.fill();
      g.strokeStyle = 'rgba(255,230,210,.4)'; g.lineWidth = 1; for (const x of [-18, -9, 0, 9, 18]) { g.beginPath(); g.moveTo(0, -2); g.lineTo(x, -26); g.stroke(); }
      g.restore();
      g.fillStyle = red;
      path(g, [-16, 10, -36, 26, -14, 20]); g.fill(); path(g, [16, 10, 36, 26, 14, 20]); g.fill();
      path(g, [0, -26, -5, 4, 0, 14, 5, 4]); g.fill();
      const body = [0, 46, -14, 32, -20, 8, -17, -16, -9, -32, 0, -36, 9, -32, 17, -16, 20, 8, 14, 32];
      g.fillStyle = 'rgba(10,8,20,.3)'; g.save(); g.translate(3, 4); path(g, body); g.fill(); g.restore();
      path(g, body); g.fillStyle = ink; g.fill();
      g.save(); path(g, body); g.clip();
      g.strokeStyle = '#3d4a80'; g.lineWidth = 1.6;
      for (let r = 0; r < 6; r++) for (let c = -2; c <= 2; c++) { const x = c * 8 + (r % 2) * 4, y = -24 + r * 9; g.beginPath(); g.arc(x, y, 4.2, 0.15 * PI, 0.85 * PI); g.stroke(); }
      g.restore();
      g.strokeStyle = red; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-13, 30); g.quadraticCurveTo(0, 22, 13, 30); g.stroke();
      for (const k of [-1, 1]) { g.fillStyle = '#f5efe2'; g.beginPath(); g.arc(k * 7.5, 34, 3.2, 0, TAU); g.fill(); g.fillStyle = '#d6452f'; g.beginPath(); g.arc(k * 7.5, 34.6, 1.6, 0, TAU); g.fill(); }
      g.strokeStyle = '#f5efe2'; g.lineWidth = 1; g.beginPath(); g.moveTo(-5, 45); g.quadraticCurveTo(-14, 54 + w * 10, -20, 52); g.moveTo(5, 45); g.quadraticCurveTo(14, 54 - w * 10, 20, 52); g.stroke();
      g.restore();
    },
    dragon(g, b, t) {
      const tr = b.trail || [];
      for (let i = tr.length - 1; i >= 1; i -= 1) {
        const p = tr[i], q = tr[i - 1];
        const a = Math.atan2(q.y - p.y, q.x - p.x), s = 1 - i / (tr.length + 4);
        g.save(); g.translate(p.x, p.y); g.rotate(a); g.scale(s, s);
        const seg = [[1.2, [9, 0, -9, -11, -6, 0], i % 2 ? '#c7322e' : '#e2b54a'], [0.75, [9, 0, -6, 0, -9, 11], i % 2 ? '#c7322e' : '#e2b54a']];
        shadow(g, seg, 3, 4, 0.18); faces(g, seg, '#c7322e', 0.6);
        g.restore();
      }
      g.save(); g.translate(b.x, b.y);
      const head = [
        [0.6, [-14, -14, -30, -32, -8, -18], '#e2b54a'], [0.85, [14, -14, 30, -32, 8, -18], '#e2b54a'],
        [1.15, [0, -18, -18, -8, -12, 14, 0, 26]], [0.78, [0, -18, 18, -8, 12, 14, 0, 26]],
        [1.3, [-12, 14, -6, 34, 0, 26], '#e2b54a'], [0.95, [12, 14, 6, 34, 0, 26], '#e2b54a'],
        [1.05, [0, -18, -8, -8, 0, 4]], [0.7, [0, -18, 8, -8, 0, 4]],
      ];
      shadow(g, head, 3, 5); faces(g, head, '#c7322e', 0.7);
      for (const k of [-1, 1]) {
        g.fillStyle = '#fff4c8'; g.beginPath(); g.moveTo(k * 5, 8); g.lineTo(k * 12, 6); g.lineTo(k * 9, 12); g.fill();
        g.fillStyle = '#1b1410'; g.beginPath(); g.arc(k * 9, 9, 1.4, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,236,170,.85)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(k * 8, 26); g.quadraticCurveTo(k * 26, 30 + Math.sin(t * 3 + k) * 6, k * 34, 18 + Math.sin(t * 2 + k) * 8); g.stroke();
      }
      g.restore();
    },
  };

  /* ---------- player ---------- */
  OZ.drawPlayer = function (g, x, y, t, tilt, alpha) {
    g.save(); g.translate(x, y); g.scale(1.15, 1.15); g.globalAlpha = alpha;
    g.scale(1 - Math.abs(tilt) * 0.18, 1);
    const geo = craneGeo(Math.sin(t * 9) * 2.4, '#fbf6ec', '#d93f3a');
    shadow(g, geo, 3, 5, 0.25);
    faces(g, geo, '#d93f3a', 0.6);
    g.strokeStyle = 'rgba(241,194,50,.9)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-5, -1); g.lineTo(-14, 1.6); g.moveTo(5, -1); g.lineTo(14, 1.6); g.stroke();
    g.restore();
  };

  /* ---------- backgrounds: painterly image (low contrast) + code-drawn parallax ---------- */
  const L = 1280;
  OZ.makeDecor = function (stage) {
    const r = GK.rng(300 + stage * 17), layers = [];
    if (stage === 0) {
      const tiles = [];
      for (let y = 0; y < L; y += 92) for (let x = -30; x < 390; x += 122) tiles.push({ x: x + r.range(-8, 8), y: y + r.range(-6, 6), w: r.range(98, 118), h: r.range(70, 84), c: r.pick(['#9fbf7a', '#b5cd8a', '#8fb36f', '#c9d79c', '#d8cf9a']), a: r.range(-0.05, 0.05) });
      layers.push({ kind: 'tiles', items: tiles, speed: 30, alpha: 0.42 });
      const clouds = []; for (let i = 0; i < 7; i++) clouds.push({ x: r.range(-30, 390), y: r.range(0, L), s: r.range(0.8, 1.5) });
      layers.push({ kind: 'cloud', items: clouds, speed: 95, alpha: 0.6, col: '#ffffff' });
    } else if (stage === 1) {
      const rip = []; for (let i = 0; i < 70; i++) rip.push({ x: r.range(0, 360), y: r.range(0, L), w: r.range(14, 46) });
      layers.push({ kind: 'ripple', items: rip, speed: 46, alpha: 0.35 });
      const lan = []; for (let i = 0; i < 14; i++) lan.push({ x: r.range(30, 330), y: r.range(0, L), s: r.range(0.7, 1.2), ph: r() * 6 });
      layers.push({ kind: 'lantern', items: lan, speed: 26, alpha: 0.9 });
      const reed = []; for (let i = 0; i < 18; i++) reed.push({ side: i % 2, y: r.range(0, L), h: r.range(60, 130), n: 2 + r.int(3) });
      layers.push({ kind: 'reed', items: reed, speed: 120, alpha: 0.85 });
    } else {
      const band = []; for (let i = 0; i < 9; i++) band.push({ x: r.range(-40, 400), y: r.range(0, L), w: r.range(160, 300), c: r.pick(['#f0b04a', '#e06a3a', '#f6d48a']) });
      layers.push({ kind: 'band', items: band, speed: 18, alpha: 0.2 });
      const roofs = []; for (let i = 0; i < 8; i++) roofs.push({ side: i % 2, y: (i * L) / 8 + r.range(-30, 30), w: r.range(70, 110) });
      layers.push({ kind: 'roof', items: roofs, speed: 72, alpha: 0.75 });
      const sp = []; for (let i = 0; i < 40; i++) sp.push({ x: r.range(0, 360), y: r.range(0, L), s: r.range(0.6, 1.4) });
      layers.push({ kind: 'spark', items: sp, speed: 150, alpha: 0.55 });
    }
    return layers;
  };
  const wrapY = (y) => ((y % L) + L) % L - 160;
  const STATIC = { tiles: 1, ripple: 1, band: 1, spark: 1 };
  /** a canvas strip at screen resolution, drawn twice per frame to scroll seamlessly */
  function strip(key, w, h, fk, draw) {
    let c = memo.get(key);
    if (c && c.fk === fk) return c;
    c = document.createElement('canvas');
    c.width = Math.ceil(w * fk); c.height = Math.ceil(h * fk);
    const g = c.getContext('2d');
    g.scale(fk, fk); draw(g); c.fk = fk;
    memo.set(key, c);
    return c;
  }
  function drawStrip(g, c, h, off, W, H) { g.drawImage(c, 0, off - h, W, h); if (off < H) g.drawImage(c, 0, off, W, h); }
  let glow = null;
  OZ.drawBg = function (g, stage, st, scroll, img, layers, W, H, time, fk) {
    fk = Math.max(1, Math.round((fk || 1) * 4) / 4);
    if (img && img.width) {
      const ih = (W * img.height) / img.width;
      const c = strip('bgimg' + stage + '|' + img.width, W, 2 * ih, fk, (s) => {
        s.fillStyle = st.base; s.fillRect(0, 0, W, 2 * ih);
        s.globalAlpha = st.imgA; s.drawImage(img, 0, 0, W, ih);
        s.save(); s.translate(0, 2 * ih); s.scale(1, -1); s.drawImage(img, 0, 0, W, ih); s.restore();
        s.globalAlpha = st.wash; s.fillStyle = st.base; s.fillRect(0, 0, W, 2 * ih);
      });
      drawStrip(g, c, 2 * ih, (scroll * 16) % (2 * ih), W, H);
    } else { g.fillStyle = st.base; g.fillRect(0, 0, W, H); }
    layers.forEach((ly, li) => {
      if (!STATIC[ly.kind]) return;
      const c = strip('ly' + stage + '|' + li, W, L, fk, (s) => {
        s.globalAlpha = ly.alpha;
        for (const it of ly.items) for (const dy of [-L, 0, L]) drawItem(s, ly, it, it.y + dy, 0);
      });
      drawStrip(g, c, L, (scroll * ly.speed) % L, W, H);
    });
    for (const ly of layers) {
      if (STATIC[ly.kind]) continue;
      g.globalAlpha = ly.alpha;
      const sc = scroll * ly.speed;
      for (const it of ly.items) {
        const y = wrapY(it.y + sc);
        if (y < -160 || y > H + 160) continue;
        drawItem(g, ly, it, y, time);
      }
    }
    g.globalAlpha = 1;
  };
  function drawItem(g, ly, it, y, time) {
    {
      {
        switch (ly.kind) {
          case 'tiles': {
            g.save(); g.translate(it.x + it.w / 2, y + it.h / 2); g.rotate(it.a);
            path(g, [-it.w / 2, -it.h / 2, it.w / 2, -it.h / 2, -it.w / 2, it.h / 2]); g.fillStyle = shade(it.c, 1.12); g.fill();
            path(g, [it.w / 2, -it.h / 2, it.w / 2, it.h / 2, -it.w / 2, it.h / 2]); g.fillStyle = it.c; g.fill();
            g.strokeStyle = 'rgba(90,110,60,.5)'; g.lineWidth = 1; g.strokeRect(-it.w / 2, -it.h / 2, it.w, it.h);
            g.restore(); break;
          }
          case 'cloud': {
            g.save(); g.translate(it.x, y); g.scale(it.s, it.s);
            path(g, [-34, 6, -26, -8, -10, -14, 4, -10, 18, -16, 34, -4, 36, 6]); g.fillStyle = '#ffffff'; g.fill();
            path(g, [-34, 6, 36, 6, 30, 12, -28, 12]); g.fillStyle = '#e6e2d6'; g.fill();
            g.restore(); break;
          }
          case 'ripple': g.fillStyle = '#9fb4ff'; g.fillRect(it.x, y, it.w, 1.5); break;
          case 'lantern': {
            const fl = 0.8 + Math.sin(time * 5 + it.ph) * 0.15;
            g.save(); g.translate(it.x + Math.sin(time * 0.6 + it.ph) * 6, y); g.scale(it.s, it.s);
            if (!glow) { glow = document.createElement('canvas'); glow.width = glow.height = 64; const q = glow.getContext('2d'), gl = q.createRadialGradient(32, 32, 1, 32, 32, 32); gl.addColorStop(0, 'rgba(255,190,90,.5)'); gl.addColorStop(1, 'rgba(255,150,60,0)'); q.fillStyle = gl; q.fillRect(0, 0, 64, 64); }
            const ga = g.globalAlpha; g.globalAlpha = ga * fl; g.drawImage(glow, -22, -22, 44, 44); g.globalAlpha = ga;
            g.fillStyle = '#f6d7a0'; g.fillRect(-5, -6, 10, 11); g.fillStyle = '#d9a35b'; g.fillRect(0, -6, 5, 11); g.fillStyle = '#3a2a20'; g.fillRect(-6, 5, 12, 2);
            g.restore(); break;
          }
          case 'reed': {
            const x0 = it.side ? 360 : 0, dir = it.side ? -1 : 1;
            g.fillStyle = '#0b0d1a';
            for (let i = 0; i < it.n; i++) { const bx = x0 + dir * (4 + i * 9); path(g, [bx - 3 * dir, y + it.h, bx + dir * 3, y + it.h, bx + dir * (8 + i * 3), y - i * 10]); g.fill(); }
            path(g, [x0, y + it.h + 10, x0 + dir * 26, y + it.h, x0 + dir * 30, y + it.h + 30, x0, y + it.h + 40]); g.fill();
            break;
          }
          case 'band': g.fillStyle = it.c; g.beginPath(); g.ellipse(it.x, y, it.w / 2, 16, 0, 0, TAU); g.fill(); break;
          case 'roof': {
            const x0 = it.side ? 360 : 0, d = it.side ? -1 : 1;
            path(g, [x0, y - 10, x0 + d * it.w, y + 4, x0 + d * (it.w + 14), y - 6, x0 + d * (it.w + 4), y + 14, x0, y + 22]); g.fillStyle = '#2a1414'; g.fill();
            g.strokeStyle = '#e2b54a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y - 10); g.lineTo(x0 + d * it.w, y + 4); g.lineTo(x0 + d * (it.w + 14), y - 6); g.stroke();
            break;
          }
          case 'spark': g.fillStyle = '#ffe2a0'; g.fillRect(it.x, y, 1.6 * it.s, 4 * it.s); break;
        }
      }
    }
  }

  /* ---------- original BGM (Japanese pentatonic scales) ---------- */
  const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const nm = (m) => NN[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  function deg(root, sc, str) {
    const s = GK.scales[sc] || sc, n = s.length;
    return str.replace(/\|/g, ' ').trim().split(/\s+/).map((tk) => {
      if (tk === '.' || tk === '-') return tk;
      const d = parseInt(tk, 10), o = Math.floor(d / n), i = ((d % n) + n) % n;
      return nm(root + s[i] + 12 * o);
    }).join(' ');
  }
  const bass = (root, sc, roots) => { const n = (GK.scales[sc] || sc).length; return deg(root, sc, roots.map((r) => `${r} . ${r + n} . ${r} ${r} ${r + n} .`).join(' ')); };
  const pad = (root, sc, roots, up) => deg(root, sc, roots.map((r) => `${r + up} - - - - - - -`).join(' '));
  OZ.SONGS = {
    title: { bpm: 84, steps: 2, tracks: [
      { type: 'triangle', v: 0.16, notes: deg(67, 'yo', '2 - - 3 4 - 2 - | 1 - - - 0 - - - | 2 - - 3 4 - 5 - | 4 - - - - - - - | 5 - 6 - 5 4 2 - | 3 - - 2 1 - - - | 2 - 1 - 0 - -1 - | 0 - - - - - - -') },
      { type: 'sine', v: 0.12, notes: pad(55, 'yo', [0, -1, 0, 1, 2, 1, 0, 0], 0) },
      { type: 'sine', v: 0.07, notes: deg(79, 'yo', '. . 4 . . . 2 . | . . 3 . . . 1 . | . . 4 . . . 2 . | . . 3 . 2 . 1 .').repeat(1) + ' ' + deg(79, 'yo', '. . 4 . . . 2 . | . . 3 . . . 1 . | . . 4 . . . 2 . | . . 3 . 2 . 1 .') },
    ], drums: { h: '. . . . x . . .' } },
    s0: { bpm: 150, steps: 2, tracks: [
      { type: 'square', v: 0.07, notes: deg(62, 'yo', '2 3 4 - 3 2 1 - | 2 3 4 5 4 - 3 - | 4 5 6 - 5 4 3 - | 2 - 1 - 2 - - - | 2 3 4 - 3 2 1 - | 0 1 2 3 2 - 1 - | 0 1 2 - 4 3 2 - | 1 - 0 - 0 - - - | 5 - 6 5 4 - 5 - | 6 - 7 6 5 - 4 - | 5 4 3 4 5 - 6 - | 7 - 6 - 5 - - - | 4 5 6 - 7 6 5 - | 4 3 2 - 3 4 5 - | 6 5 4 3 2 - 1 - | 2 - - - 0 - - -') },
      { type: 'triangle', v: 0.17, notes: bass(38, 'yo', [0, 0, 3, 1, 0, -1, 0, 0, 3, 3, 1, 2, 3, 1, 2, 0]) },
      { type: 'sine', v: 0.06, notes: pad(62, 'yo', [0, 0, 3, 1, 0, -1, 0, 0, 3, 3, 1, 2, 3, 1, 2, 0], 2) },
    ], drums: { k: 'x . . x x . . .', s: '. . x . . . x .', h: 'x x x x x x x x', t: 'x . . . . . . . . . . . x . x .' } },
    s1: { bpm: 132, steps: 2, tracks: [
      { type: 'triangle', v: 0.17, notes: deg(64, 'in', '0 - 1 - 2 - 1 0 | -1 - - - 0 - - - | 2 - 3 - 4 - 3 2 | 1 - - - 2 - - - | 4 - 5 - 4 3 2 - | 3 - 2 1 0 - - - | 1 - 2 - 3 2 1 0 | -1 - - - 0 - - - | 5 - - 4 5 - 6 - | 7 - 6 5 4 - - - | 3 - 4 5 4 - 3 2 | 1 - 2 - 3 - - - | 5 - - 4 5 - 6 7 | 8 - 7 6 5 - 4 - | 3 2 1 - 2 1 0 - | -1 - - - 0 - - -') },
      { type: 'sine', v: 0.2, notes: bass(40, 'in', [0, -1, 2, 1, 2, 0, 1, 0, 3, 2, 1, 0, 3, 3, 1, 0]) },
      { type: 'sawtooth', v: 0.03, notes: deg(76, 'in', '. 2 . 2 . 2 . 2').repeat(1) + ' ' + deg(76, 'in', '. 1 . 1 . 1 . 1') },
    ], drums: { k: 'x . . . x . x .', h: '. x . x . x . x', t: 'x . . . . . . . . . . . . . . .' } },
    s2: { bpm: 164, steps: 2, tracks: [
      { type: 'square', v: 0.065, notes: deg(69, 'minor', '0 . 0 2 3 - 4 - | 3 2 0 - -1 - 0 - | 0 . 0 2 3 - 4 5 | 6 - 5 - 4 - - - | 4 . 4 5 6 - 7 - | 6 5 4 - 3 - 4 - | 2 3 4 - 3 2 1 - | 0 - - - - - - - | 7 - 6 - 5 - 4 - | 5 - 4 - 3 - 2 - | 3 - 4 - 5 - 6 - | 7 - - - 9 - - - | 7 - 6 - 5 - 4 - | 5 - 4 - 3 - 2 - | 3 4 5 4 3 2 1 - | 0 - - - - - - -') },
      { type: 'triangle', v: 0.18, notes: bass(45, 'minor', [0, 0, 0, 5, 3, 3, 1, 0, 5, 3, 2, 4, 5, 3, 1, 0]) },
      { type: 'sine', v: 0.06, notes: pad(69, 'minor', [0, 0, 0, 5, 3, 3, 1, 0, 5, 3, 2, 4, 5, 3, 1, 0], 2) },
    ], drums: { k: 'x . x . x . x .', s: '. . x . . . x x', h: 'x x x x x x x x' } },
    boss: { bpm: 172, steps: 2, tracks: [
      { type: 'sawtooth', v: 0.05, notes: deg(62, 'in', '0 0 2 0 3 0 2 0 | 1 1 3 1 4 - 3 - | 0 0 2 0 3 0 5 - | 4 - 3 - 2 - 1 - | 5 - 4 - 5 - 7 - | 6 - 5 - 4 - 3 - | 5 - 4 - 5 - 8 - | 7 - 6 - 5 - - -') },
      { type: 'triangle', v: 0.2, notes: bass(38, 'in', [0, 1, 0, 2, 3, 2, 3, 0]) },
      { type: 'square', v: 0.035, notes: deg(74, 'in', '. . 0 . . . 0 . | . . 1 . . . 1 .').repeat(1) },
    ], drums: { k: 'x . . x x . x .', s: '. . x . . . x .', h: 'x x x x x x x x', t: 'x . . . x . . . x . . . x . x x' } },
    clear: { bpm: 120, steps: 2, loop: false, tracks: [
      { type: 'triangle', v: 0.2, notes: deg(67, 'yo', '0 2 4 5 4 - 5 - | 7 - - - - - - -') },
      { type: 'sine', v: 0.14, notes: deg(55, 'yo', '0 - - - 2 - - - | 0 - - - - - - -') },
    ], drums: { t: 'x . . . x . x . | x . . . . . . .' } },
  };
})();
