/* 宵祭り金魚すくい — the goldfish: kinds (data for the 図鑑) and the code-drawn top-down fish. window.Kingyo */
(function () {
  'use strict';
  /*
   * w: how many of each in the tub (weight), pts: points, mass: how hard it pulls on the paper, len: body length (units),
   * spd: cruising speed (units/s), body: slim | round | chubby, tail: fork | long | veil | short (tl: tail length × len)
   */
  const KINDS = [
    { id: 'wakin', name: '和金', yomi: 'わきん', w: 40, pts: 10, mass: 1.0, len: 50, spd: 72, body: 'slim', tail: 'fork', tl: 0.36, c1: '#ff6c2c', c2: '#d9330c', rare: 1,
      desc: '金魚の祖先のフナに近い、細身の体と短い尾びれの品種。丈夫で泳ぎが速く、金魚すくいでおなじみの「小赤」は和金の子どもです。' },
    { id: 'ryukin', name: '琉金', yomi: 'りゅうきん', w: 14, pts: 30, mass: 1.5, len: 46, spd: 46, body: 'round', tail: 'veil', tl: 0.62, c1: '#f5492b', c2: '#c4261a', white: 0.45, rare: 2,
      desc: '丸く短い体に、ひらひらと長い尾びれ。琉球（沖縄）を経て伝わったことが名前の由来とされます。紅白の模様が華やかです。' },
    { id: 'demekin', name: '出目金', yomi: 'でめきん', w: 12, pts: 30, mass: 1.4, len: 46, spd: 40, body: 'round', tail: 'veil', tl: 0.5, eyes: 'deme', c1: '#f2552c', c2: '#b9301b', rare: 2,
      desc: '左右に大きく飛び出した目がとくちょう。のんびり泳ぐので、すくいやすい金魚です。' },
    { id: 'kurodeme', name: '黒出目金', yomi: 'くろでめきん', w: 10, pts: 40, mass: 1.4, len: 46, spd: 40, body: 'round', tail: 'veil', tl: 0.5, eyes: 'deme', c1: '#3a3540', c2: '#121015', rare: 2,
      desc: '全身が黒い出目金。赤い金魚の中でよく目立つ、金魚すくいの人気者です。' },
    { id: 'comet', name: 'コメット', yomi: 'こめっと', w: 8, pts: 40, mass: 1.1, len: 54, spd: 98, body: 'slim', tail: 'long', tl: 0.72, c1: '#ff5d22', c2: '#d22c08', rare: 3,
      desc: 'アメリカで作られた品種。細長い体と吹き流しのような長い尾びれで、とても速く泳ぎます。' },
    { id: 'shubunkin', name: '朱文金', yomi: 'しゅぶんきん', w: 8, pts: 50, mass: 1.1, len: 54, spd: 92, body: 'slim', tail: 'long', tl: 0.66, calico: true, c1: '#b4c6d4', c2: '#7d93a8', rare: 3,
      desc: '明治時代に日本で作られた品種。青・赤・黒などがまじる、まだら（キャリコ）の模様と長い尾びれがきれいです。' },
    { id: 'ranchu', name: 'らんちゅう', yomi: 'らんちゅう', w: 5, pts: 80, mass: 1.9, len: 50, spd: 30, body: 'chubby', tail: 'short', tl: 0.32, nodorsal: true, hood: true, c1: '#f4632b', c2: '#c4401a', rare: 4,
      desc: '背びれがなく、頭にこぶ（肉瘤）のある丸い金魚。「金魚の王様」とも呼ばれます。重いので、ポイの紙には大敵。' },
    { id: 'tancho', name: '丹頂', yomi: 'たんちょう', w: 3, pts: 120, mass: 1.6, len: 50, spd: 44, body: 'round', tail: 'veil', tl: 0.56, cap: true, c1: '#fbf8f2', c2: '#d8d1c6', rare: 5,
      desc: '白い体で、頭のてっぺんだけが赤い金魚。鶴の丹頂（たんちょう）にちなんだ名前です。めったに見られない当たり。' },
  ];
  const BYID = Object.fromEntries(KINDS.map((k) => [k.id, k]));

  /** per-fish pattern (white patches, calico specks), from a random function */
  function pattern(kind, r) {
    const spots = [];
    if (kind.white) { const n = 2 + Math.floor(r() * 3); for (let i = 0; i < n; i++) spots.push({ x: r() * 0.5 - 0.25, y: (r() - 0.5) * 0.3, r: 0.08 + r() * 0.1, c: '#fff6ee' }); }
    if (kind.id === 'wakin' && r() < 0.3) { for (let i = 0; i < 2; i++) spots.push({ x: r() * 0.5 - 0.3, y: (r() - 0.5) * 0.25, r: 0.07 + r() * 0.08, c: '#fff3e6' }); }
    if (kind.calico) {
      for (let i = 0; i < 4; i++) spots.push({ x: r() * 0.6 - 0.3, y: (r() - 0.5) * 0.25, r: 0.06 + r() * 0.08, c: r() < 0.5 ? '#e8462a' : '#f08a3a' });
      for (let i = 0; i < 7; i++) spots.push({ x: r() * 0.6 - 0.3, y: (r() - 0.5) * 0.26, r: 0.015 + r() * 0.03, c: '#23202a' });
    }
    return spots;
  }

  function tail(g, K, L, sw, ph) {
    const T = L * K.tl;
    g.fillStyle = K.tail === 'veil' || K.tail === 'short' ? K.c1 : K.c2;
    if (K.tail === 'fork' || K.tail === 'long') {
      const deep = K.tail === 'long' ? 0.5 : 0.62, spread = K.tail === 'long' ? 0.32 : 0.42;
      g.globalAlpha = 0.85;
      g.beginPath();
      g.moveTo(2, -L * 0.03);
      g.quadraticCurveTo(-T * 0.5, -T * spread * 0.4, -T, -T * spread + sw * T * 0.2);
      g.quadraticCurveTo(-T * deep, 0, -T, T * spread + sw * T * 0.2);
      g.quadraticCurveTo(-T * 0.5, T * spread * 0.4, 2, L * 0.03);
      g.closePath(); g.fill();
    } else {
      // double tail: two soft lobes spread sideways, each swaying a little out of step
      g.globalAlpha = K.tail === 'short' ? 0.85 : 0.62;
      for (const s of [-1, 1]) {
        const w = Math.sin(ph * 1.3 + s) * 0.12;
        g.beginPath();
        g.moveTo(2, s * L * 0.02);
        g.bezierCurveTo(-T * 0.3, s * T * 0.5, -T * 0.8, s * T * (0.75 + w), -T * 1.02, s * T * (0.42 + w));
        g.quadraticCurveTo(-T * 0.7, s * T * 0.18, -T * 0.86, s * 0.02 * T);
        g.quadraticCurveTo(-T * 0.4, 0, 2, 0);
        g.closePath(); g.fill();
      }
    }
    // fin rays
    g.globalAlpha = 0.25; g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(0.6, L * 0.012);
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-T * 0.15, i * T * 0.04); g.lineTo(-T * 0.85, i * T * (K.tail === 'veil' ? 0.28 : 0.13)); g.stroke(); }
    g.globalAlpha = 1;
  }

  /**
   * draws a fish seen from above, nose toward +x after rotating by f.ang.
   * f = { x, y, ang, ph (tail phase), spd, kind (object), spots, size (1 = normal), flop (extra bend) }
   */
  /** body, pattern, dorsal fin and eyes (everything that does not move), drawn at the origin, nose toward +x */
  function drawBody(g, f) {
    const K = f.kind, L = K.len * (f.size || 1);
    const slim = K.body === 'slim', chub = K.body === 'chubby';
    const hl = (slim ? 0.36 : 0.3) * L, hw = (slim ? 0.15 : chub ? 0.25 : 0.23) * L;
    // body
    const a0 = g.globalAlpha;
    const body = () => {
      g.beginPath();
      g.moveTo(hl, 0);
      g.bezierCurveTo(hl * 1.02, -hw * 1.05, -hl * 0.35, -hw * 1.2, -hl, -L * 0.035);
      g.lineTo(-hl, L * 0.035);
      g.bezierCurveTo(-hl * 0.35, hw * 1.2, hl * 1.02, hw * 1.05, hl, 0);
      g.closePath();
    };
    const gr = g.createLinearGradient(0, -hw, 0, hw);
    gr.addColorStop(0, K.c1); gr.addColorStop(0.5, K.c2); gr.addColorStop(1, K.c1);
    body(); g.fillStyle = gr; g.fill();
    g.save(); body(); g.clip();
    for (const s of f.spots || []) { g.fillStyle = s.c; g.beginPath(); g.ellipse(s.x * L, s.y * L, s.r * L * 1.3, s.r * L, 0, 0, Math.PI * 2); g.fill(); }
    if (K.hood) { g.fillStyle = 'rgba(255,190,120,.55)'; for (const [x, y, r] of [[0.2, -0.07, 0.07], [0.22, 0.07, 0.07], [0.27, 0, 0.06], [0.16, 0, 0.06]]) { g.beginPath(); g.arc(x * L, y * L, r * L, 0, Math.PI * 2); g.fill(); } }
    if (K.cap) { g.fillStyle = '#e0262b'; g.beginPath(); g.ellipse(hl * 0.55, 0, L * 0.09, L * 0.075, 0, 0, Math.PI * 2); g.fill(); }
    // spine shade + soft highlight
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(hl * 0.1, -hw * 0.38, hl * 0.6, hw * 0.22, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    if (!K.nodorsal) { // dorsal fin along the back
      g.strokeStyle = K.c2; g.globalAlpha = a0 * 0.55; g.lineWidth = Math.max(1, L * 0.035); g.lineCap = 'round';
      g.beginPath(); g.moveTo(hl * 0.25, 0); g.quadraticCurveTo(-hl * 0.2, 0, -hl * 0.65, 0); g.stroke();
      g.globalAlpha = a0;
    }
    // eyes
    const er = L * (K.eyes === 'deme' ? 0.075 : 0.042);
    for (const s of [-1, 1]) {
      const ex = hl * (K.eyes === 'deme' ? 0.55 : 0.68), ey = s * (K.eyes === 'deme' ? hw * 1.05 : hw * 0.62);
      if (K.eyes === 'deme') { g.fillStyle = K.c2; g.beginPath(); g.arc(ex, ey, er * 1.25, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = K.id === 'kurodeme' ? '#0a090b' : '#1b1414'; g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(ex + er * 0.3, ey - er * 0.3, er * 0.35, 0, Math.PI * 2); g.fill();
    }
  }

  /** a fish's still parts as a sprite at px pixels per unit (rebuilt when the scale changes) */
  function bodySprite(f, px) {
    if (f.bc && Math.abs(f.bc.px - px) / px < 0.12) return f.bc;
    const L = f.kind.len * (f.size || 1), w = L * 0.82, h = L * 0.74;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * px); c.height = Math.ceil(h * px);
    const g = c.getContext('2d');
    g.scale(px, px); g.translate(w * 0.5, h / 2);
    drawBody(g, f);
    f.bc = { c, px, x: -w * 0.5, y: -h / 2, w, h };
    return f.bc;
  }

  function drawFish(g, f, alpha, px) {
    const K = f.kind, L = K.len * (f.size || 1);
    const slim = K.body === 'slim', chub = K.body === 'chubby';
    const hl = (slim ? 0.36 : 0.3) * L, hw = (slim ? 0.15 : chub ? 0.25 : 0.23) * L;
    const sway = Math.sin(f.ph) * (0.22 + Math.min(0.45, (f.spd || 0) / K.spd * 0.1)) + (f.flop || 0);
    g.save();
    g.translate(f.x, f.y);
    g.rotate(f.ang + Math.sin(f.ph) * 0.05);
    if (alpha != null) g.globalAlpha = alpha;
    const a0 = g.globalAlpha;
    // tail
    g.save(); g.translate(-hl * 0.92, 0); g.rotate(sway); tail(g, K, L, sway, f.ph); g.restore();
    g.globalAlpha = a0;
    // pectoral fins
    g.fillStyle = K.c1; g.globalAlpha = a0 * 0.6;
    for (const s of [-1, 1]) {
      g.save(); g.translate(hl * 0.25, s * hw * 0.8); g.rotate(s * (0.9 + Math.sin(f.ph * 1.7) * 0.25));
      g.beginPath(); g.ellipse(-L * 0.06, 0, L * 0.1, L * 0.04, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
    g.globalAlpha = a0;
    if (px) { const b = bodySprite(f, px); g.drawImage(b.c, b.x, b.y, b.w, b.h); } else drawBody(g, f);
    g.restore();
  }

  /** the dark silhouette on the floor of the tub */
  function drawShadow(g, f, dx, dy) {
    const K = f.kind, L = K.len * (f.size || 1);
    g.save(); g.translate(f.x + dx, f.y + dy); g.rotate(f.ang);
    g.beginPath(); g.ellipse(-L * 0.05, 0, L * 0.42, L * (K.body === 'slim' ? 0.13 : 0.2), 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  /** a small picture of a kind (for the result list) */
  function icon(kind, size) {
    const c = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = Math.round(size * dpr);
    c.style.width = c.style.height = size + 'px';
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const s = (size * 0.78) / (kind.len * (1 + kind.tl));
    g.translate(size * (0.5 + kind.tl * 0.18), size / 2); g.scale(s, s);
    drawFish(g, { x: 0, y: 0, ang: -0.0, ph: 0.6, spd: 0, kind, spots: pattern(kind, mul(7)) });
    return c;
  }
  function mul(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  window.Kingyo = { KINDS, BYID, drawFish, drawShadow, pattern, icon };
})();
