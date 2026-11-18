/*
 * クレーン横丁 — physics of the machines. Works in the page (window.CranePhysics) and in Node (tests).
 * Units: about 1 cm. x: left → right (-W/2 … W/2), y: up (floor 0), z: front → back (0 … D).
 *
 * Pile (ぬいぐるみの山): every plush is one or more particles (balls: 1, long plush: 3 in a stiff line) solved with small-step
 * position-based dynamics: gravity, the stiff links of a long plush, particle against particle, the claw (kinematic spheres that push
 * and can be blocked), the floor with the chute hole, the walls and the acrylic guard around the hole. Floor friction stops rolling.
 * Bridge (橋渡し): the box is a 2D rigid body (x-y, turning about the z axis) resting on two bars that run front to back; contacts
 * with the bars and the claw are solved with impulses (restitution, Coulomb friction, rotation). The claw's push is limited by its
 * arm strength. A box whose centre drops below the bars falls into the pit: a win.
 */
(function (root) {
  'use strict';
  const W = 60, D = 40, H = 56;
  const HOLE = { x0: -W / 2, x1: -W / 2 + 13, z0: 0, z1: 13 }, GUARD_H = 5, GUARD_T = 0.6;
  const G = 95;

  /* ---------------- the pile ---------------- */
  function Pile() { this.parts = []; this.prizes = []; this.colliders = []; this.blocked = 0; }
  /** kind: { shape: 'ball'|'long', r, mass } ; o: { x, y, z, yaw } */
  Pile.prototype.add = function (kind, o) {
    const pr = { kind, parts: [], links: [], held: false, won: false, roll: 0, id: this.prizes.length + 1 + Math.random() };
    const mk = (x, y, z, r) => { const p = { x, y, z, px: x, py: y, pz: z, vx: 0, vy: 0, vz: 0, r, inv: 1 / (kind.mass || 1), pr, floor: false }; pr.parts.push(p); this.parts.push(p); return p; };
    if (kind.shape === 'long') {
      const half = kind.len / 2 - kind.r, c = Math.cos(o.yaw || 0), s = Math.sin(o.yaw || 0);
      const a = mk(o.x - c * half, o.y, o.z - s * half, kind.r), b = mk(o.x, o.y, o.z, kind.r * 1.05), e = mk(o.x + c * half, o.y, o.z + s * half, kind.r);
      pr.links.push([a, b, half], [b, e, half], [a, e, half * 2]);
    } else mk(o.x, o.y, o.z, kind.r);
    this.prizes.push(pr);
    return pr;
  };
  Pile.prototype.remove = function (pr) {
    this.prizes = this.prizes.filter((x) => x !== pr);
    this.parts = this.parts.filter((p) => p.pr !== pr);
  };
  Pile.prototype.com = function (pr) {
    let x = 0, y = 0, z = 0;
    for (const p of pr.parts) { x += p.x; y += p.y; z += p.z; }
    const n = pr.parts.length;
    return { x: x / n, y: y / n, z: z / n };
  };

  function guardBoxes() {
    return [
      { x0: HOLE.x1 - GUARD_T / 2, x1: HOLE.x1 + GUARD_T / 2, z0: HOLE.z0, z1: HOLE.z1 + GUARD_T / 2 },
      { x0: HOLE.x0, x1: HOLE.x1 + GUARD_T / 2, z0: HOLE.z1 - GUARD_T / 2, z1: HOLE.z1 + GUARD_T / 2 },
    ].map((b) => Object.assign(b, { y0: -20, y1: GUARD_H }));
  }
  const GUARDS = guardBoxes();
  const inHole = (x, z) => x < HOLE.x1 && z < HOLE.z1;

  function pushOutBox(p, b) { // sphere against an axis-aligned box
    const cx = Math.max(b.x0, Math.min(p.x, b.x1)), cy = Math.max(b.y0, Math.min(p.y, b.y1)), cz = Math.max(b.z0, Math.min(p.z, b.z1));
    let dx = p.x - cx, dy = p.y - cy, dz = p.z - cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= p.r * p.r) return;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (p.r - d) / d; p.x += dx * k; p.y += dy * k; p.z += dz * k; return; }
    // centre inside the box: out through the nearest face
    const opts = [[b.x0 - p.r - p.x, 'x'], [b.x1 + p.r - p.x, 'x'], [b.y1 + p.r - p.y, 'y'], [b.z0 - p.r - p.z, 'z'], [b.z1 + p.r - p.z, 'z']];
    opts.sort((a, c) => Math.abs(a[0]) - Math.abs(c[0]));
    p[opts[0][1]] += opts[0][0];
  }

  /** dt seconds; colliders: [{ x, y, z, r }] kinematic spheres (the claw). Returns { won: [prize], blocked: max overlap left on the claw } */
  Pile.prototype.step = function (dt, colliders) {
    const SUB = 6, h = dt / SUB, P = this.parts, n = P.length;
    colliders = colliders || [];
    let blocked = 0;
    for (let s = 0; s < SUB; s++) {
      for (const p of P) {
        if (p.pr.held) continue;
        p.px = p.x; p.py = p.y; p.pz = p.z;
        p.vy -= G * h;
        p.vx *= 0.999; p.vz *= 0.999;
        p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
        p.floor = false;
      }
      for (let it = 0; it < 2; it++) {
        // stiff links of the long plush
        for (const pr of this.prizes) {
          if (pr.held) continue;
          for (const [a, b, len] of pr.links) {
            const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-6, k = (d - len) / d / 2;
            a.x += dx * k; a.y += dy * k; a.z += dz * k; b.x -= dx * k; b.y -= dy * k; b.z -= dz * k;
          }
        }
        // plush against plush
        for (let i = 0; i < n; i++) {
          const a = P[i];
          for (let j = i + 1; j < n; j++) {
            const b = P[j];
            if (a.pr === b.pr) continue;
            const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, R = a.r + b.r;
            if (dx > R || dx < -R || dy > R || dy < -R || dz > R || dz < -R) continue;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 >= R * R) continue;
            const d = Math.sqrt(d2) || 1e-6, wa = a.pr.held ? 0 : a.inv, wb = b.pr.held ? 0 : b.inv, ws = wa + wb;
            if (!ws) continue;
            const pen = (R - d) / d / ws;
            a.x -= dx * pen * wa; a.y -= dy * pen * wa; a.z -= dz * pen * wa;
            b.x += dx * pen * wb; b.y += dy * pen * wb; b.z += dz * pen * wb;
          }
        }
        // the claw pushes (and is pushed back by what cannot move)
        for (const c of colliders) {
          for (const p of P) {
            if (p.pr.held) continue;
            const dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z, R = p.r + c.r, d2 = dx * dx + dy * dy + dz * dz;
            if (d2 >= R * R) continue;
            const d = Math.sqrt(d2) || 1e-6, k = (R - d) / d;
            p.x += dx * k; p.y += dy * k; p.z += dz * k;
          }
        }
        // the machine: floor (with the hole), walls, guard
        for (const p of P) {
          if (p.pr.held) continue;
          if (!inHole(p.x, p.z) && p.y < p.r) {
            // over the rim of the hole the floor ends: only a particle whose centre is outside the hole stands on it
            p.y = p.r; p.floor = true;
          }
          if (inHole(p.x, p.z) && p.y < 0) { // inside the hole: its walls
            if (p.x > HOLE.x1 - p.r) p.x = HOLE.x1 - p.r;
            if (p.z > HOLE.z1 - p.r) p.z = HOLE.z1 - p.r;
          }
          if (p.x < -W / 2 + p.r) p.x = -W / 2 + p.r; else if (p.x > W / 2 - p.r) p.x = W / 2 - p.r;
          if (p.z < p.r) p.z = p.r; else if (p.z > D - p.r) p.z = D - p.r;
          if (p.y > H - p.r) p.y = H - p.r;
          for (const b of GUARDS) pushOutBox(p, b);
        }
      }
      for (const c of colliders) for (const p of P) {
        if (p.pr.held || c.noBlock) continue; // only the claw body stops the descent: arms sink into soft plush
        const R = p.r + c.r, ov = R - Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z);
        if (ov > blocked) blocked = ov;
      }
      for (const p of P) {
        if (p.pr.held) continue;
        p.vx = (p.x - p.px) / h; p.vy = (p.y - p.py) / h; p.vz = (p.z - p.pz) / h;
        if (p.floor) { const f = 1 - Math.min(1, 14 * h); p.vx *= f; p.vz *= f; if (p.vy < 0) p.vy = 0; }
        const v = Math.hypot(p.vx, p.vy, p.vz);
        if (v > 120) { p.vx *= 120 / v; p.vy *= 120 / v; p.vz *= 120 / v; }
      }
      // plush is soft: neighbours drag each other a little (no endless sliding on top of each other)
      for (const pr of this.prizes) {
        if (pr.held || pr.parts.length < 2) continue;
        let vx = 0, vz = 0;
        for (const p of pr.parts) { vx += p.vx; vz += p.vz; }
        vx /= pr.parts.length; vz /= pr.parts.length;
        for (const p of pr.parts) { p.vx += (vx - p.vx) * 0.1; p.vz += (vz - p.vz) * 0.1; }
      }
    }
    const won = [];
    for (const pr of this.prizes) {
      if (pr.held) continue;
      const c = this.com(pr);
      const p0 = pr.parts[0];
      pr.roll += (p0.vx * dt) / p0.r;
      if (c.y < -6 && inHole(c.x, c.z)) won.push(pr);
    }
    for (const pr of won) { pr.won = true; this.remove(pr); }
    this.blocked = blocked;
    return { won, blocked };
  };

  /* ---------------- the bridge ---------------- */
  const BR = { x: 6, gap: 11.4, y: 18, r: 0.9, z0: 9, z1: 35, wall: 12.5, mu: 0.3 };
  function Bridge() { this.box = null; }
  Bridge.prototype.setBox = function (kind, dx) {
    const hx = kind.w / 2, hy = kind.h / 2;
    const m = 1, I = (m * ((2 * hx) ** 2 + (2 * hy) ** 2)) / 12;
    this.box = { kind, x: BR.x + (dx || 0), y: BR.y + BR.r + hy, a: 0, vx: 0, vy: 0, w: 0, hx, hy, hd: kind.d / 2, z: (BR.z0 + BR.z1) / 2, m, I, won: false, rest: 0 };
    return this.box;
  };
  /** closest point of the box to (cx, cy) → contact with a circle of radius r, or null */
  function rectCircle(B, cx, cy, r) {
    const c = Math.cos(B.a), s = Math.sin(B.a);
    const lx = (cx - B.x) * c + (cy - B.y) * s, ly = -(cx - B.x) * s + (cy - B.y) * c;
    let qx = Math.max(-B.hx, Math.min(lx, B.hx)), qy = Math.max(-B.hy, Math.min(ly, B.hy));
    let nx, ny, pen;
    if (qx === lx && qy === ly) { // centre inside: out through the nearest side
      const dx = B.hx - Math.abs(lx), dy = B.hy - Math.abs(ly);
      if (dx < dy) { nx = Math.sign(lx) || 1; ny = 0; qx = nx * B.hx; pen = dx + r; } else { nx = 0; ny = Math.sign(ly) || 1; qy = ny * B.hy; pen = dy + r; }
    } else {
      const dx = lx - qx, dy = ly - qy, d = Math.hypot(dx, dy);
      if (d >= r) return null;
      nx = dx / d; ny = dy / d; pen = r - d;
    }
    // to world: n points from the box toward the circle
    return { nx: nx * c - ny * s, ny: nx * s + ny * c, px: B.x + qx * c - qy * s, py: B.y + qx * s + qy * c, pen };
  }
  /** colliders: [{ x, y, z, r, vx, vy }] (the claw); arm: 0..1 limits how hard the claw can push */
  Bridge.prototype.step = function (dt, colliders, arm) {
    const B = this.box;
    if (!B || B.won) return { won: false, blocked: 0 };
    const SUB = 8, h = dt / SUB;
    let blocked = 0;
    const bars = [{ x: BR.x - BR.gap / 2, y: BR.y, r: BR.r, vx: 0, vy: 0, mu: BR.mu, lim: Infinity }, { x: BR.x + BR.gap / 2, y: BR.y, r: BR.r, vx: 0, vy: 0, mu: BR.mu, lim: Infinity }];
    const claw = (colliders || []).filter((c) => Math.abs(c.z - B.z) < B.hd + c.r).map((c) => ({ x: c.x, y: c.y, r: c.r, vx: c.vx || 0, vy: c.vy || 0, mu: 0.25, lim: (arm == null ? 0.6 : arm) * 2.2 * B.m * G * h, claw: true }));
    for (let s = 0; s < SUB; s++) {
      B.vy -= G * h;
      B.x += B.vx * h; B.y += B.vy * h; B.a += B.w * h;
      for (const c of bars.concat(claw)) {
        const k = rectCircle(B, c.x, c.y, c.r);
        if (!k) continue;
        // position: the box moves out (the claw only as far as its strength allows)
        const corr = c.claw ? Math.min(k.pen, 0.05 + (arm || 0.6) * 0.12) : k.pen * 0.9;
        B.x -= k.nx * corr; B.y -= k.ny * corr;
        if (c.claw && k.pen - corr > blocked) blocked = k.pen - corr;
        // velocity: impulse at the contact point
        const rx = k.px - B.x, ry = k.py - B.y;
        const vpx = B.vx - B.w * ry, vpy = B.vy + B.w * rx;
        const rvx = vpx - c.vx, rvy = vpy - c.vy, vn = rvx * k.nx + rvy * k.ny;
        if (vn <= 0) continue; // already separating
        const rn = rx * k.ny - ry * k.nx;
        let j = (1.15 * vn) / (1 / B.m + (rn * rn) / B.I);
        if (j > c.lim) j = c.lim;
        B.vx -= (j * k.nx) / B.m; B.vy -= (j * k.ny) / B.m; B.w -= (j * rn) / B.I;
        // friction
        const tx = -k.ny, ty = k.nx, vt = rvx * tx + rvy * ty, rt = rx * ty - ry * tx;
        let jt = vt / (1 / B.m + (rt * rt) / B.I);
        const lim = c.mu * j;
        if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
        B.vx -= (jt * tx) / B.m; B.vy -= (jt * ty) / B.m; B.w -= (jt * rt) / B.I;
      }
      // side plates beside the bars
      const c = Math.cos(B.a), sn = Math.sin(B.a);
      for (const [lx, ly] of [[-B.hx, -B.hy], [B.hx, -B.hy], [B.hx, B.hy], [-B.hx, B.hy]]) {
        const x = B.x + lx * c - ly * sn;
        if (x < BR.x - BR.wall) { B.x += BR.x - BR.wall - x; if (B.vx < 0) B.vx *= -0.2; }
        else if (x > BR.x + BR.wall) { B.x -= x - (BR.x + BR.wall); if (B.vx > 0) B.vx *= -0.2; }
      }
      B.vx *= 1 - 0.4 * h; B.vy *= 1 - 0.1 * h; B.w *= 1 - 1.2 * h;
    }
    const still = Math.abs(B.vx) + Math.abs(B.vy) + Math.abs(B.w) * 5 < 1.5;
    B.rest = still ? B.rest + dt : 0;
    if (B.y < BR.y - BR.r - 2.5 && B.x > BR.x - BR.gap / 2 && B.x < BR.x + BR.gap / 2) { B.won = true; return { won: true, blocked }; }
    return { won: false, blocked };
  };

  const api = { W, D, H, HOLE, GUARD_H, GUARDS, G, BR, Pile, Bridge, rectCircle, inHole };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CranePhysics = api;
})(this);
