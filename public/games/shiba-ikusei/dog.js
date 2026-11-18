/*
 * こしば日和 — the Shiba drawn in code (canvas). window.Shiba.draw(g, o) draws at the current transform; (0, 0) is the ground
 * under the dog and 1 unit = 1 px at scale 1 (the caller scales).
 *   o.pose   'sit' | 'lie' | 'sleep' | 'side'
 *   o.stage  'puppy' | 'young' | 'adult'
 *   o.t      time (s) · o.blink 0..1 · o.eyes 'normal'|'happy'|'closed'|'wide'|'sad'|'half' · o.mouth 'smile'|'open'|'tongue'|'munch'|'flat'
 *   o.ears 0 (up) .. 1 (flat back) · o.wag 0..1.5 · o.look -1..1 · o.tilt rad · o.headDown 0..1 · o.pawUp 'L'|'R'|'both' · o.blush
 *   side view: o.phase (leg cycle), o.walk / o.run, o.holdBall · o.pal (another coat: other dogs on the walk)
 */
(function () {
  'use strict';
  const PAL = { fur: '#e3923f', furD: '#c4752d', cream: '#fdf1df', creamD: '#ecd6ba', nose: '#2a1f1b', eye: '#2b1d16', inner: '#f6cdb8', tongue: '#ef7d8a', mouthIn: '#7b3a2d', collar: '#86c26a', bell: '#f2c94c' };
  const STAGE = {
    puppy: { head: 40, bw: 33, bh: 34, leg: 11, ear: 13, tail: 10, sc: 0.8 },
    young: { head: 37, bw: 37, bh: 44, leg: 17, ear: 17, tail: 12, sc: 1.0 },
    adult: { head: 36, bw: 42, bh: 52, leg: 22, ear: 17, tail: 14, sc: 1.14 },
  };
  const TAU = Math.PI * 2;
  function oval(g, c, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fillStyle = c; g.fill(); }
  function rrect(g, c, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = c; g.fill(); }

  function tail(g, P, x, y, r, wag, dir) {
    g.save();
    g.translate(x, y); g.rotate(wag);
    g.lineCap = 'round';
    g.beginPath(); g.arc(dir * r * 0.7, -r * 0.75, r, dir > 0 ? Math.PI * 0.62 : Math.PI * 0.38, dir > 0 ? Math.PI * 2.3 : -Math.PI * 1.3, dir < 0);
    g.lineWidth = r * 1.0; g.strokeStyle = P.fur; g.stroke();
    g.lineWidth = r * 0.42; g.strokeStyle = P.cream; g.stroke();
    g.restore();
  }
  function ear(g, P, S, H, side, o) {
    const flat = Math.min(1, Math.max(0, o.ears || 0)) + (o.earTwitch && side > 0 ? o.earTwitch : 0);
    g.save();
    g.translate(side * H * 0.56, -H * 0.5);
    g.rotate(side * (0.16 + flat * 0.95));
    const h = S.ear * 1.9 * (1 - flat * 0.35), w = S.ear * 1.3;
    g.beginPath(); g.moveTo(-w * 0.55, h * 0.18); g.quadraticCurveTo(-w * 0.32, -h * 0.62, 0, -h); g.quadraticCurveTo(w * 0.32, -h * 0.62, w * 0.55, h * 0.18); g.closePath();
    g.fillStyle = P.fur; g.fill();
    g.beginPath(); g.moveTo(-w * 0.3, h * 0.05); g.quadraticCurveTo(-w * 0.16, -h * 0.5, 0, -h * 0.74); g.quadraticCurveTo(w * 0.16, -h * 0.5, w * 0.3, h * 0.05); g.closePath();
    g.fillStyle = P.inner; g.fill();
    g.restore();
  }
  /** the face, centred at (0, 0), head radius H */
  function face(g, P, S, H, o) {
    const lx = (o.look || 0) * H * 0.22;
    ear(g, P, S, H, -1, o); ear(g, P, S, H, 1, o);
    oval(g, P.fur, 0, 0, H * 1.05, H * 0.9);
    oval(g, P.cream, lx - H * 0.5, H * 0.27, H * 0.42, H * 0.36);
    oval(g, P.cream, lx + H * 0.5, H * 0.27, H * 0.42, H * 0.36);
    oval(g, P.cream, lx, H * 0.37, H * 0.6, H * 0.43);
    oval(g, P.cream, lx - H * 0.36, -H * 0.43, H * 0.11, H * 0.075);
    oval(g, P.cream, lx + H * 0.36, -H * 0.43, H * 0.11, H * 0.075);
    // eyes
    const ey = -H * 0.12, er = H * 0.1;
    g.lineCap = 'round';
    for (const s of [-1, 1]) {
      const x = lx + s * H * 0.36;
      g.strokeStyle = P.eye; g.fillStyle = P.eye; g.lineWidth = H * 0.06;
      const e = o.eyes || 'normal';
      if (e === 'happy') { g.beginPath(); g.arc(x, ey + H * 0.06, er * 1.05, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (e === 'closed') { g.beginPath(); g.arc(x, ey - H * 0.03, er, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
      else if (e === 'wide') { oval(g, P.eye, x, ey, er * 1.3, er * 1.5); oval(g, '#fff', x + er * 0.4, ey - er * 0.5, er * 0.42, er * 0.42); oval(g, '#fff', x - er * 0.35, ey + er * 0.5, er * 0.2, er * 0.2); }
      else if (e === 'half') { oval(g, P.eye, x, ey + er * 0.35, er * 0.95, er * 0.6); g.lineWidth = H * 0.045; g.beginPath(); g.moveTo(x - er * 1.2, ey - er * 0.15); g.lineTo(x + er * 1.2, ey - er * 0.15); g.stroke(); }
      else {
        const k = 1 - Math.min(1, o.blink || 0);
        if (k < 0.18) { g.beginPath(); g.moveTo(x - er, ey + er * 0.1); g.lineTo(x + er, ey + er * 0.1); g.stroke(); }
        else {
          oval(g, P.eye, x, ey, er, er * 1.25 * k);
          oval(g, '#fff', x + er * 0.32, ey - er * 0.45 * k, er * 0.34, er * 0.34 * k);
        }
        if (e === 'sad') { g.lineWidth = H * 0.045; g.beginPath(); g.moveTo(x - s * er * 1.3, ey - er * 1.05); g.lineTo(x + s * er * 0.9, ey - er * 1.75); g.stroke(); }
      }
    }
    // nose
    const ny = H * 0.15;
    g.beginPath(); g.moveTo(lx - H * 0.12, ny); g.quadraticCurveTo(lx, ny - H * 0.07, lx + H * 0.12, ny); g.quadraticCurveTo(lx + H * 0.1, ny + H * 0.11, lx, ny + H * 0.14); g.quadraticCurveTo(lx - H * 0.1, ny + H * 0.11, lx - H * 0.12, ny); g.closePath();
    g.fillStyle = P.nose; g.fill();
    oval(g, 'rgba(255,255,255,.55)', lx - H * 0.03, ny + H * 0.01, H * 0.035, H * 0.02);
    // mouth
    let m = o.mouth || 'smile';
    if (m === 'munch') m = Math.sin((o.t || 0) * 16) > 0 ? 'open' : 'smile';
    g.strokeStyle = '#5a3320'; g.lineWidth = H * 0.04;
    const my = ny + H * 0.14;
    if (m === 'open' || m === 'tongue') {
      g.beginPath(); g.moveTo(lx - H * 0.17, my + H * 0.02); g.quadraticCurveTo(lx, my + H * 0.3, lx + H * 0.17, my + H * 0.02); g.closePath(); g.fillStyle = P.mouthIn; g.fill();
      oval(g, P.tongue, lx, my + H * (m === 'tongue' ? 0.22 : 0.15), H * 0.085, H * (m === 'tongue' ? 0.12 : 0.07));
    } else if (m === 'flat') {
      g.beginPath(); g.moveTo(lx, my - H * 0.02); g.lineTo(lx, my + H * 0.04); g.moveTo(lx - H * 0.1, my + H * 0.08); g.lineTo(lx + H * 0.1, my + H * 0.08); g.stroke();
    } else {
      g.beginPath(); g.moveTo(lx, my - H * 0.02); g.lineTo(lx, my + H * 0.04);
      g.arc(lx - H * 0.075, my + H * 0.04, H * 0.075, 0, Math.PI, false);
      g.moveTo(lx + H * 0.15, my + H * 0.04); g.arc(lx + H * 0.075, my + H * 0.04, H * 0.075, 0, Math.PI, false);
      g.stroke();
    }
    if (o.blush) { oval(g, 'rgba(246,128,140,.4)', lx - H * 0.66, H * 0.2, H * 0.15, H * 0.085); oval(g, 'rgba(246,128,140,.4)', lx + H * 0.66, H * 0.2, H * 0.15, H * 0.085); }
  }
  function collar(g, P, y, w) {
    g.beginPath(); g.ellipse(0, y, w, w * 0.2, 0, 0, Math.PI); g.lineWidth = w * 0.16; g.strokeStyle = P.collar; g.lineCap = 'round'; g.stroke();
    oval(g, P.bell, 0, y + w * 0.3, w * 0.13, w * 0.13);
    oval(g, 'rgba(255,255,255,.6)', -w * 0.04, y + w * 0.26, w * 0.04, w * 0.03);
  }

  function sit(g, P, S, o) {
    const { head: H, bw, bh } = S, t = o.t || 0;
    const br = 1 + Math.sin(t * 2.2) * 0.012;
    oval(g, 'rgba(70,40,15,.16)', 0, 0, bw * 1.35, 6);
    tail(g, P, bw * 0.72, -bh * 0.66, S.tail, Math.sin(t * (6 + (o.wag || 0) * 8)) * 0.35 * (o.wag == null ? 0.5 : o.wag), 1);
    oval(g, P.furD, -bw * 0.62, -bh * 0.3, bw * 0.46, bh * 0.34);
    oval(g, P.furD, bw * 0.62, -bh * 0.3, bw * 0.46, bh * 0.34);
    oval(g, P.cream, -bw * 0.88, -3, bw * 0.27, 5.5);
    oval(g, P.cream, bw * 0.88, -3, bw * 0.27, 5.5);
    oval(g, P.fur, 0, -bh * 0.58, bw * 0.84, bh * 0.62 * br);
    oval(g, P.cream, 0, -bh * 0.55, bw * 0.52, bh * 0.52 * br);
    const lw = bw * 0.32;
    for (const s of [-1, 1]) {
      const up = o.pawUp === 'both' || (o.pawUp === 'L' && s < 0) || (o.pawUp === 'R' && s > 0);
      const x = s * bw * 0.28;
      if (up) continue;
      {
        rrect(g, P.cream, x - lw / 2, -bh * 0.55, lw, bh * 0.55, lw / 2.2);
        oval(g, P.cream, x, -3.5, lw * 0.62, 5.2);
        g.strokeStyle = P.creamD; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x - lw * 0.18, -6); g.lineTo(x - lw * 0.18, -1); g.moveTo(x + lw * 0.18, -6); g.lineTo(x + lw * 0.18, -1); g.stroke();
      }
    }
    collar(g, P, -bh * 1.02, bw * 0.6);
    const hy = -bh * 1.02 - H * 0.55 + (o.headDown || 0) * H * 0.85 + (o.bob || 0);
    g.save(); g.translate((o.look || 0) * H * 0.08, hy); g.rotate(o.tilt || 0);
    face(g, P, S, H, o);
    g.restore();
    for (const s of [-1, 1]) {
      if (!(o.pawUp === 'both' || (o.pawUp === 'L' && s < 0) || (o.pawUp === 'R' && s > 0))) continue;
      const px = s * bw * 0.62, py = -bh * 0.62;
      g.save(); g.translate(s * bw * 0.3, -bh * 0.42); g.rotate(Math.atan2(py + bh * 0.42, px - s * bw * 0.3) - Math.PI / 2);
      const L = Math.hypot(px - s * bw * 0.3, py + bh * 0.42);
      rrect(g, P.cream, -lw / 2, 0, lw, L, lw / 2.2);
      g.restore();
      oval(g, P.cream, px, py, lw * 0.66, lw * 0.56);
      g.strokeStyle = P.creamD; g.lineWidth = 1.3; g.beginPath(); g.moveTo(px - 3, py - 4); g.lineTo(px - 3, py + 1); g.moveTo(px + 3, py - 4); g.lineTo(px + 3, py + 1); g.stroke();
    }
    if (o.holdBall) drawBall(g, (o.look || 0) * H * 0.1, hy + H * 0.55, H * 0.3);
  }
  function lie(g, P, S, o) {
    const { head: H, bw, bh } = S, t = o.t || 0;
    const sleep = o.pose === 'sleep';
    const br = 1 + Math.sin(t * (sleep ? 1.3 : 2.2)) * (sleep ? 0.035 : 0.015);
    oval(g, 'rgba(70,40,15,.16)', bw * 0.1, 0, bw * 1.8, 6.5);
    tail(g, P, bw * 1.25, -bh * 0.5, S.tail * 0.95, Math.sin(t * 7) * 0.2 * (sleep ? 0 : o.wag || 0.3), 1);
    oval(g, P.fur, bw * 0.22, -bh * 0.4 * br, bw * 1.42, bh * 0.43 * br);
    oval(g, P.furD, bw * 0.95, -bh * 0.34, bw * 0.48, bh * 0.33);
    oval(g, P.cream, bw * 1.2, -3.5, bw * 0.3, 5);
    oval(g, P.cream, -bw * 0.35, -bh * 0.27, bw * 0.62, bh * 0.25);
    oval(g, P.cream, -bw * 1.12, -4.5, bw * 0.33, 6);
    oval(g, P.cream, -bw * 0.62, -3.8, bw * 0.3, 5.5);
    g.save();
    g.translate(-bw * 0.78, -H * (sleep ? 0.72 : 0.92));
    g.rotate(sleep ? -0.12 : (o.tilt || 0));
    g.scale(0.94, 0.94);
    face(g, P, S, H, Object.assign({}, o, { eyes: sleep ? 'closed' : o.eyes, ears: sleep ? 0.45 : o.ears, mouth: sleep ? 'smile' : o.mouth }));
    g.restore();
  }
  function legSide(g, c, x, y, len, w, ang, paw) {
    g.save(); g.translate(x, y); g.rotate(ang);
    rrect(g, c, -w / 2, 0, w, len, w / 2.2);
    oval(g, paw, w * 0.18, len - 1, w * 0.62, w * 0.42);
    g.restore();
  }
  function side(g, P, S, o) {
    const { head: H, bw, bh, leg } = S, t = o.t || 0, ph = o.phase || 0;
    const amp = o.run ? 0.8 : o.walk ? 0.42 : 0;
    const by = -leg - bh * 0.4 - (o.run ? Math.abs(Math.sin(ph)) * 4 : 0);
    const len = leg + bh * 0.28, lw = bw * 0.26;
    oval(g, 'rgba(70,40,15,.16)', 0, 0, bw * 1.35, 5.5);
    legSide(g, P.furD, bw * 0.7, by + bh * 0.12, len, lw, Math.sin(ph + Math.PI) * amp, P.creamD);
    legSide(g, P.furD, -bw * 0.62, by + bh * 0.12, len, lw, Math.sin(ph) * amp, P.creamD);
    tail(g, P, -bw * 0.98, by - bh * 0.3, S.tail, Math.sin(t * (8 + (o.wag || 0) * 8)) * 0.3 * (o.wag == null ? 0.6 : o.wag), -1);
    oval(g, P.fur, 0, by, bw * 1.15, bh * 0.42);
    oval(g, P.cream, bw * 0.05, by + bh * 0.2, bw * 0.82, bh * 0.19);
    oval(g, P.cream, bw * 0.86, by + bh * 0.02, bw * 0.32, bh * 0.33);
    legSide(g, P.cream, bw * 0.78, by + bh * 0.1, len, lw, Math.sin(ph) * amp, P.cream);
    legSide(g, P.fur, -bw * 0.55, by + bh * 0.1, len, lw, Math.sin(ph + Math.PI) * amp, P.cream);
    g.save(); g.translate(bw * 0.98, by - bh * 0.3); g.rotate(-1.05);
    g.beginPath(); g.ellipse(0, 0, bw * 0.3, bw * 0.06, 0, 0, TAU); g.fillStyle = P.collar; g.fill();
    g.restore();
    // head
    const hx = bw * 1.05, hy = by - bh * 0.42 - H * 0.42 + (o.headDown || 0) * H * 0.7;
    g.save(); g.translate(hx, hy); g.rotate(o.tilt || 0);
    const flat = o.ears || 0;
    g.save(); g.translate(-H * 0.18, -H * 0.55); g.rotate(-0.2 - flat * 0.9);
    const eh = S.ear * 1.9 * (1 - flat * 0.3), ew = S.ear * 1.25;
    g.beginPath(); g.moveTo(-ew * 0.55, eh * 0.2); g.quadraticCurveTo(-ew * 0.3, -eh * 0.6, 0, -eh); g.quadraticCurveTo(ew * 0.32, -eh * 0.6, ew * 0.55, eh * 0.2); g.closePath(); g.fillStyle = P.fur; g.fill();
    g.beginPath(); g.moveTo(-ew * 0.25, eh * 0.05); g.quadraticCurveTo(-ew * 0.12, -eh * 0.45, 0, -eh * 0.7); g.quadraticCurveTo(ew * 0.14, -eh * 0.45, ew * 0.28, eh * 0.05); g.closePath(); g.fillStyle = P.inner; g.fill();
    g.restore();
    oval(g, P.fur, 0, 0, H * 0.78, H * 0.7);
    oval(g, P.cream, H * 0.62, H * 0.2, H * 0.44, H * 0.28);
    oval(g, P.cream, H * 0.1, H * 0.3, H * 0.42, H * 0.3);
    oval(g, P.cream, H * 0.26, -H * 0.36, H * 0.1, H * 0.07);
    oval(g, P.nose, H * 1.02, H * 0.08, H * 0.1, H * 0.085);
    g.strokeStyle = P.eye; g.fillStyle = P.eye; g.lineWidth = H * 0.06; g.lineCap = 'round';
    if (o.eyes === 'happy' || o.eyes === 'closed') { g.beginPath(); g.arc(H * 0.32, -H * 0.08, H * 0.09, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else { oval(g, P.eye, H * 0.32, -H * 0.1, H * 0.085, H * 0.11); oval(g, '#fff', H * 0.35, -H * 0.15, H * 0.03, H * 0.03); }
    if (o.run || o.mouth === 'tongue') { oval(g, P.mouthIn, H * 0.72, H * 0.4, H * 0.14, H * 0.07); oval(g, P.tongue, H * 0.68, H * 0.5, H * 0.08, H * 0.12); }
    else { g.lineWidth = H * 0.035; g.strokeStyle = '#5a3320'; g.beginPath(); g.moveTo(H * 0.98, H * 0.22); g.quadraticCurveTo(H * 0.8, H * 0.38, H * 0.62, H * 0.3); g.stroke(); }
    if (o.holdBall) drawBall(g, H * 0.95, H * 0.42, H * 0.3);
    g.restore();
  }
  function drawBall(g, x, y, r) {
    oval(g, '#e8505b', x, y, r, r);
    g.save(); g.beginPath(); g.ellipse(x, y, r, r, 0, 0, TAU); g.clip();
    g.fillStyle = '#fff'; g.fillRect(x - r, y - r * 0.18, r * 2, r * 0.36);
    g.restore();
    oval(g, 'rgba(255,255,255,.5)', x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.16);
  }

  window.Shiba = {
    PAL, STAGE, drawBall,
    draw(g, o) {
      const P = o.pal ? Object.assign({}, PAL, o.pal) : PAL;
      const S = STAGE[o.stage] || STAGE.puppy;
      if (o.pose === 'lie' || o.pose === 'sleep') lie(g, P, S, o);
      else if (o.pose === 'side') side(g, P, S, o);
      else sit(g, P, S, o);
    },
    /** rough parts of the sitting dog (unscaled units, ground at 0) — for touch zones */
    parts(stage) {
      const S = STAGE[stage] || STAGE.puppy;
      return { headY: -S.bh * 1.02 - S.head * 0.55, headR: S.head, bodyY: -S.bh * 0.58, bodyRX: S.bw * 0.84, bodyRY: S.bh * 0.62, tailX: S.bw * 0.95, tailY: -S.bh * 0.8, tailR: S.tail * 1.8, height: S.bh * 1.02 + S.head * 1.6 + S.ear };
    },
  };
})();
