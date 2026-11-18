/*
 * 和菓子ころりん — circle physics for the 重箱 (box).
 * Small-step position-based dynamics (after Müller et al., "Detailed Rigid Body Simulation with Extended Position Based
 * Dynamics" / "Small Steps in Physics Simulation"): every frame is split into SUB substeps; each substep integrates,
 * projects the contacts (mass weighted, clamped so overlaps never explode), derives the velocities from the positions and
 * then solves restitution + Coulomb friction at velocity level with the discs' rotation (so pieces roll), plus rolling
 * resistance so nothing rolls for ever. Works in the page (window.WagashiPhysics) and in Node (module.exports) for tests.
 * World units: x 0..BOX_W (inner width), y grows downward, 0 = the rim of the box, BOX_H = the floor. Walls are infinitely
 * high, so nothing can leave the box sideways.
 */
(function (root) {
  'use strict';
  const BOX_W = 400, BOX_H = 520;

  /** the eleven sweets, smallest first (radius in world units, sample colours) */
  const TIERS = [
    { key: 'konpeito', name: '金平糖', yomi: 'こんぺいとう', r: 14, c1: '#cdbcf8', c2: '#9883e2' },
    { key: 'kuromame', name: '黒豆', yomi: 'くろまめ', r: 19, c1: '#4d3853', c2: '#1d1322' },
    { key: 'kurikinton', name: '栗きんとん', yomi: 'くりきんとん', r: 25, c1: '#f6d35f', c2: '#d49d1c' },
    { key: 'sakuramochi', name: '桜餅', yomi: 'さくらもち', r: 32, c1: '#fbc2d4', c2: '#e8869f' },
    { key: 'kusamochi', name: '草餅', yomi: 'くさもち', r: 40, c1: '#a3c66f', c2: '#5c8838' },
    { key: 'monaka', name: '最中', yomi: 'もなか', r: 48, c1: '#efd8aa', c2: '#c59c5d' },
    { key: 'mizumanju', name: '水まんじゅう', yomi: 'みずまんじゅう', r: 57, c1: '#bde7f2', c2: '#66b0cc' },
    { key: 'ohagi', name: 'おはぎ', yomi: 'おはぎ', r: 67, c1: '#8f4450', c2: '#4b1d24' },
    { key: 'dorayaki', name: 'どら焼き', yomi: 'どらやき', r: 78, c1: '#e0934c', c2: '#97511d' },
    { key: 'daifuku', name: '大福', yomi: 'だいふく', r: 90, c1: '#fdfaf3', c2: '#d9cfbd' },
    { key: 'kagamimochi', name: '鏡餅', yomi: 'かがみもち', r: 104, c1: '#fff8e4', c2: '#f39a2c' },
  ];

  const P = {
    g: 1500,          // gravity (units / s²)
    sub: 10,          // substeps per step
    mu: 0.42,         // friction between sweets
    muWall: 0.3,      // friction against the box
    e: 0.16,          // restitution (a little bounce)
    roll: 2.4,        // rolling resistance (1/s, per contact)
    air: 0.04,        // air drag (1/s)
    maxV: 1500,       // speed limit (units / s)
    maxCorr: 3,       // most a contact may push per substep (gentle when a merged sweet grows into its neighbours)
    growTime: 0.16,   // seconds a merged sweet takes to grow to its size
  };

  function mass(b) { b.m = b.tr * b.tr; b.inv = 1 / b.m; b.invI = 2 / (b.m * b.r * b.r); } // disc: I = ½ m r²

  function World() {
    this.bodies = [];
    this.uid = 1;
    this.time = 0;
    this.pool = [];
    this.nc = 0;
  }

  World.prototype.add = function (tier, x, y, o) {
    o = o || {};
    const T = TIERS[tier];
    const b = {
      id: this.uid++, tier, x, y, px: x, py: y, vx: o.vx || 0, vy: o.vy || 0, ovx: 0, ovy: 0,
      a: o.a || 0, w: o.w || 0, r: o.r || T.r, tr: T.r, grow: 0, age: 0, dead: false,
      merged: !!o.merged, hitT: 0, squash: 0, flash: o.merged ? 1 : 0,
    };
    b.grow = (b.tr - b.r) / P.growTime;
    mass(b);
    this.bodies.push(b);
    return b;
  };

  World.prototype.remove = function (b) { b.dead = true; this.bodies = this.bodies.filter((x) => !x.dead); };

  World.prototype.contact = function (A, B, nx, ny, jn) {
    let c = this.pool[this.nc];
    if (!c) { c = {}; this.pool[this.nc] = c; }
    this.nc++;
    c.A = A; c.B = B; c.nx = nx; c.ny = ny; c.jn = jn;
    return c;
  };

  /** advances dt seconds; returns { merges: [{x, y, tier, from, body, vanish}], hits: [{x, y, v, tier}] } */
  World.prototype.step = function (dt, opts) {
    opts = opts || {};
    const B = this.bodies, n = B.length, h = dt / P.sub;
    const ev = { merges: [], hits: [] };
    const airK = 1 / (1 + P.air * h), rollK = 1 / (1 + P.roll * h), bounceMin = 2.5 * P.g * h;
    for (let s = 0; s < P.sub; s++) {
      // 1. integrate
      for (let i = 0; i < n; i++) {
        const b = B[i];
        if (b.r < b.tr) { b.r = Math.min(b.tr, b.r + b.grow * h); mass(b); }
        b.px = b.x; b.py = b.y;
        b.vy += P.g * h;
        b.vx *= airK; b.vy *= airK;
        b.ovx = b.vx; b.ovy = b.vy;
        b.x += b.vx * h; b.y += b.vy * h;
        b.a += b.w * h;
      }
      // 2. project the contacts: sweet against sweet …
      this.nc = 0;
      for (let i = 0; i < n; i++) {
        const A = B[i];
        for (let j = i + 1; j < n; j++) {
          const C = B[j];
          const dx = C.x - A.x, dy = C.y - A.y, R = A.r + C.r;
          if (dx > R || dx < -R || dy > R || dy < -R) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 >= R * R) continue;
          let d = Math.sqrt(d2), nx, ny;
          if (d < 1e-6) { nx = 0; ny = 1; d = 0; } else { nx = dx / d; ny = dy / d; }
          const pen = R - d, ws = A.inv + C.inv;
          // full correction between settled sweets; gentle while one is growing or was just dropped in
          const corr = (A.r < A.tr || C.r < C.tr || A.age < 0.1 || C.age < 0.1) && pen > P.maxCorr ? P.maxCorr : pen;
          const ca = (corr * A.inv) / ws, cc = (corr * C.inv) / ws;
          A.x -= nx * ca; A.y -= ny * ca; C.x += nx * cc; C.y += ny * cc;
          this.contact(A, C, nx, ny, corr / (h * ws));
        }
      }
      // … and against the box (hard: never clamped, so nothing leaves the box)
      for (let i = 0; i < n; i++) {
        const b = B[i];
        if (b.x < b.r) { const pen = b.r - b.x; b.x = b.r; this.contact(null, b, 1, 0, pen / (h * b.inv)); }
        else if (b.x > BOX_W - b.r) { const pen = b.x - (BOX_W - b.r); b.x = BOX_W - b.r; this.contact(null, b, -1, 0, pen / (h * b.inv)); }
        if (b.y > BOX_H - b.r) { const pen = b.y - (BOX_H - b.r); b.y = BOX_H - b.r; this.contact(null, b, 0, -1, pen / (h * b.inv)); }
      }
      // 3. velocities from the positions
      for (let i = 0; i < n; i++) {
        const b = B[i];
        b.vx = (b.x - b.px) / h; b.vy = (b.y - b.py) / h;
      }
      // 4. velocity solve: restitution, friction with spin, rolling resistance
      for (let k = 0; k < this.nc; k++) {
        const c = this.pool[k], A = c.A, C = c.B, nx = c.nx, ny = c.ny, tx = -ny, ty = nx;
        const invA = A ? A.inv : 0, invC = C.inv;
        const rAx = A ? nx * A.r : 0, rAy = A ? ny * A.r : 0, rCx = -nx * C.r, rCy = -ny * C.r;
        const oAx = A ? A.ovx : 0, oAy = A ? A.ovy : 0;
        const ovn = (C.ovx - oAx) * nx + (C.ovy - oAy) * ny;
        const vn = (C.vx - (A ? A.vx : 0)) * nx + (C.vy - (A ? A.vy : 0)) * ny;
        if (ovn < -bounceMin) {
          const target = -P.e * ovn;
          if (vn < target) {
            const j = (target - vn) / (invA + invC);
            C.vx += nx * j * invC; C.vy += ny * j * invC;
            if (A) { A.vx -= nx * j * invA; A.vy -= ny * j * invA; }
          }
          if (-ovn > 260 && C.hitT <= 0) { C.hitT = 0.12; C.squash = Math.min(0.16, -ovn / 6000); ev.hits.push({ x: C.x - nx * C.r, y: C.y - ny * C.r, v: -ovn, tier: C.tier }); }
        }
        const vAx = A ? A.vx - A.w * rAy : 0, vAy = A ? A.vy + A.w * rAx : 0;
        const vCx = C.vx - C.w * rCy, vCy = C.vy + C.w * rCx;
        const vt = (vCx - vAx) * tx + (vCy - vAy) * ty;
        let jt = -vt / (3 * (invA + invC)); // discs: 1/m + r²/I = 3/m
        const lim = (A ? P.mu : P.muWall) * c.jn;
        if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
        const Px = tx * jt, Py = ty * jt;
        C.vx += Px * invC; C.vy += Py * invC; C.w += (rCx * Py - rCy * Px) * C.invI;
        if (A) { A.vx -= Px * invA; A.vy -= Py * invA; A.w -= (rAx * Py - rAy * Px) * A.invI; A.w *= rollK; }
        C.w *= rollK;
      }
      for (let i = 0; i < n; i++) {
        const b = B[i];
        const v2 = b.vx * b.vx + b.vy * b.vy;
        if (v2 > P.maxV * P.maxV) { const k = P.maxV / Math.sqrt(v2); b.vx *= k; b.vy *= k; }
        if (b.w > 40) b.w = 40; else if (b.w < -40) b.w = -40;
      }
    }
    this.time += dt;
    for (let i = 0; i < n; i++) {
      const b = B[i];
      b.age += dt;
      if (b.hitT > 0) b.hitT -= dt;
      b.squash *= Math.pow(0.0008, dt);
      if (b.flash > 0) b.flash = Math.max(0, b.flash - dt * 3);
    }
    // 5. equal sweets that touch become the next one
    if (opts.merge !== false) {
      for (let i = 0; i < n; i++) {
        const A = B[i];
        if (A.dead) continue;
        for (let j = i + 1; j < n; j++) {
          const C = B[j];
          if (C.dead || C.tier !== A.tier) continue;
          const dx = C.x - A.x, dy = C.y - A.y, R = A.r + C.r + 0.8;
          if (dx * dx + dy * dy > R * R) continue;
          ev.merges.push(this.merge(A, C));
          break;
        }
      }
      if (ev.merges.length) this.bodies = this.bodies.filter((b) => !b.dead);
    }
    return ev;
  };

  World.prototype.merge = function (A, C) {
    A.dead = true; C.dead = true;
    const x = (A.x + C.x) / 2, y = (A.y + C.y) / 2, from = A.tier;
    if (from === TIERS.length - 1) return { x, y, tier: from, from, vanish: true };
    const T = TIERS[from + 1];
    const r0 = Math.max(A.r, T.r * 0.74);
    const nb = this.add(from + 1, Math.min(Math.max(x, r0), BOX_W - r0), Math.min(y, BOX_H - r0), {
      vx: (A.vx + C.vx) / 2, vy: (A.vy + C.vy) / 2 - 70, w: (A.w + C.w) / 2, a: (A.a + C.a) / 2,
      r: r0, merged: true,
    });
    return { x, y, tier: from + 1, from, body: nb };
  };

  /** the y where a sweet of radius r dropped at x comes to rest first (centre), for the guide line */
  World.prototype.landing = function (x, r, fromY) {
    let best = BOX_H - r;
    for (const b of this.bodies) {
      const dx = Math.abs(b.x - x), R = b.r + r;
      if (dx >= R || b.y < fromY) continue;
      const y = b.y - Math.sqrt(R * R - dx * dx);
      if (y < best) best = y;
    }
    return best;
  };

  const api = { World, TIERS, BOX_W, BOX_H, P };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WagashiPhysics = api;
})(this);
