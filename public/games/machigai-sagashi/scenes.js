/*
 * まちがい日和 — the six scenes, drawn in SVG by code (viewBox 800×600).
 * scene.draw(d, u) → SVG markup; d(id) is true when difference `id` is shown (the right picture), u prefixes the ids of <defs>.
 * scene.diffs: [{ id, x, y, r, lv (1 easy … 3 subtle), ja (what changed), alt: [x, y] (the other place of a moved thing) }]
 */
(function (root) {
  'use strict';
  const R = (x, y, w, h, f, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${ex}/>`;
  const C = (x, y, r, f, ex = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${ex}/>`;
  const E = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${ex}/>`;
  const P = (d, f, ex = '') => `<path d="${d}" fill="${f}" ${ex}/>`;
  const L = (x1, y1, x2, y2, s, w = 2, ex = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}" stroke-linecap="round" ${ex}/>`;
  const G = (t, inner) => `<g transform="${t}">${inner}</g>`;
  const grad = (id, stops, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

  /* ---------- shared things ---------- */
  function cloud(x, y, s, f = '#ffffff') { return G(`translate(${x} ${y}) scale(${s})`, C(-30, 6, 20, f) + C(-6, -6, 26, f) + C(22, 2, 22, f) + C(42, 10, 14, f) + R(-44, 8, 96, 20, f, 'rx="10"')); }
  function lantern(x, y, s, col, glow) {
    let ribs = '';
    for (const yy of [-12, -6, 0, 6, 12]) { const w = 15 * Math.sqrt(1 - (yy / 19) ** 2); ribs += `<path d="M${-w} ${yy} Q0 ${yy + 2.5} ${w} ${yy}" stroke="rgba(0,0,0,.18)" fill="none" stroke-width="1"/>`; }
    return G(`translate(${x} ${y}) scale(${s})`, (glow ? C(0, 0, 26, glow, 'opacity=".14"') + C(0, 0, 20, glow, 'opacity=".14"') : '') + L(0, -32, 0, -22, '#3a3340', 1.5) + R(-7, -23, 14, 5, '#2b2522', 'rx="1.5"') + E(0, 0, 15, 19, col) + ribs + E(-5, -6, 4, 8, 'rgba(255,255,255,.28)') + R(-7, 17, 14, 5, '#2b2522', 'rx="1.5"'));
  }
  function goldfish(x, y, s, col, flip) {
    return G(`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`, P('M10 0 L24 -9 Q20 0 24 9 Z', col, 'opacity=".9"') + E(0, 0, 12, 7, col) + C(-6, -2, 1.8, '#1d1d24') + P('M-2 -6 Q4 -12 8 -5', col, 'opacity=".8"'));
  }
  function blossom(x, y, r, f = '#f6b6c8', c2 = '#e98aa5') { let s = ''; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; s += C(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, f); } return s + C(x, y, r * 0.25, c2); }
  function sakuraCluster(x, y, s) { return G(`translate(${x} ${y}) scale(${s})`, C(-22, 4, 22, '#f4b4c6') + C(0, -12, 26, '#f7c3d2') + C(24, 2, 22, '#f4b4c6') + C(2, 14, 22, '#f9cfdb') + C(-8, -2, 8, '#fde3ea') + C(14, -14, 6, '#fde3ea') + C(16, 12, 3, '#e98aa5') + C(-14, -8, 3, '#e98aa5')); }
  function pine(x, y, s, snow) {
    const t = (yy, w) => P(`M0 ${yy - 36} L${w} ${yy} L${-w} ${yy} Z`, '#2f5a4a') + (snow ? P(`M0 ${yy - 36} L${w * 0.45} ${yy - 20} Q0 ${yy - 14} ${-w * 0.45} ${yy - 20} Z`, '#f4f7fb') : '');
    return G(`translate(${x} ${y}) scale(${s})`, R(-5, 0, 10, 18, '#6b4a35') + t(4, 34) + t(-18, 28) + t(-40, 22));
  }
  function cat(x, y, s, col, o = {}) {
    const tail = o.tailRight ? P('M14 18 Q40 22 34 -2 Q32 -10 28 -4 Q32 12 12 10 Z', col) : P('M-14 18 Q-40 22 -34 -2 Q-32 -10 -28 -4 Q-32 12 -12 10 Z', col);
    const eyes = o.eyes || '#f3d04f';
    return G(`translate(${x} ${y}) scale(${s})`, E(0, 26, 22, 4, 'rgba(0,0,0,.18)') + tail + E(0, 10, 17, 18, col) + C(0, -14, 14, col) + P('M-12 -20 L-11 -34 L-2 -26 Z', col) + P('M12 -20 L11 -34 L2 -26 Z', col) + E(-5, -14, 2.2, 3, eyes) + E(5, -14, 2.2, 3, eyes) + C(-5, -14, 1, '#1d1d24') + C(5, -14, 1, '#1d1d24') + P('M-2 -9 L2 -9 L0 -7 Z', '#e98aa5'));
  }
  function sparkle(x, y, r, f) { return P(`M${x} ${y - r} L${x + r * 0.25} ${y - r * 0.25} L${x + r} ${y} L${x + r * 0.25} ${y + r * 0.25} L${x} ${y + r} L${x - r * 0.25} ${y + r * 0.25} L${x - r} ${y} L${x - r * 0.25} ${y - r * 0.25} Z`, f); }
  function firework(x, y, R0, col, n = 16) {
    let s = '';
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; s += L(x + Math.cos(a) * R0 * 0.28, y + Math.sin(a) * R0 * 0.28, x + Math.cos(a) * R0 * 0.86, y + Math.sin(a) * R0 * 0.86, col, 2.2, 'opacity=".85"') + C(x + Math.cos(a) * R0, y + Math.sin(a) * R0, 2.6, col); }
    return s + C(x, y, 4, '#fff8e0');
  }
  function stripes(x, y, w, h, n, a, b) { let s = ''; const k = w / n; for (let i = 0; i < n; i++) s += R(x + i * k, y, k + 0.4, h, i % 2 ? b : a); return s; }
  function scallop(x, y, w, n, a, b, r) { let s = ''; const k = w / n; for (let i = 0; i < n; i++) s += P(`M${x + i * k} ${y} a${k / 2} ${r} 0 0 0 ${k} 0 Z`, i % 2 ? b : a); return s; }
  function dango(x, y, s, cols) { return G(`translate(${x} ${y}) scale(${s})`, L(0, -36, 0, 30, '#c79a5a', 3) + C(0, -22, 10, cols[0]) + C(0, -2, 10, cols[1]) + C(0, 18, 10, cols[2])); }

  /* =====================================================================
   * 1. 夏祭りの縁日
   * ===================================================================== */
  const matsuri = {
    id: 'matsuri', name: '夏祭りの縁日', short: '縁日', sky: '#1b234c',
    diffs: [
      { id: 'moon', x: 690, y: 80, r: 36, lv: 1, ja: '月が三日月になっている' },
      { id: 'fw', x: 150, y: 105, r: 50, lv: 1, ja: '花火の色がちがう' },
      { id: 'star', x: 548, y: 112, r: 18, lv: 3, ja: '星がひとつ多い' },
      { id: 'torii', x: 400, y: 290, r: 26, lv: 2, ja: '鳥居の横木（貫）がない' },
      { id: 'lantern', x: 350, y: 228, r: 26, lv: 1, ja: '提灯の色がちがう' },
      { id: 'lantern2', x: 650, y: 218, r: 26, lv: 2, ja: '提灯がひとつない' },
      { id: 'noren', x: 185, y: 292, r: 40, box: [60, 272, 250, 40], lv: 1, ja: 'のれんの色がちがう' },
      { id: 'fish', x: 250, y: 472, r: 22, lv: 2, ja: '金魚が 1 匹いない' },
      { id: 'apple', x: 655, y: 350, r: 22, lv: 2, ja: 'りんご飴がひとつない' },
      { id: 'bag', x: 600, y: 318, r: 26, lv: 2, ja: 'わたあめの袋の色がちがう' },
      { id: 'uchiwa', x: 440, y: 528, r: 28, lv: 3, ja: 'うちわの柄がちがう' },
      { id: 'cat', x: 384, y: 470, r: 26, lv: 2, ja: '猫のしっぽが反対側にある' },
      { id: 'yoyo', x: 350, y: 560, r: 22, lv: 3, ja: '水ヨーヨーの場所がちがう', alt: [520, 560] },
      { id: 'pin', x: 770, y: 318, r: 22, lv: 3, ja: '風車の羽の色がちがう' },
    ],
    draw(d, u) {
      let s = `<defs>${grad(u + 'sky', [[0, '#141b40'], [0.55, '#2c2a5e'], [1, '#4a3a6e']])}${grad(u + 'grd', [[0, '#3d3450'], [1, '#2a2338']])}</defs>`;
      s += R(0, 0, 800, 600, `url(#${u}sky)`);
      for (const [x, y, r] of [[40, 40, 1.6], [110, 70, 1.2], [230, 30, 1.8], [300, 92, 1.3], [455, 38, 1.6], [600, 28, 1.4], [742, 150, 1.5], [770, 30, 1.2], [500, 140, 1.2], [260, 150, 1.1], [60, 190, 1.3]]) s += C(x, y, r, '#fff6c8');
      s += sparkle(520, 70, 6, '#fff6c8') + sparkle(30, 120, 5, '#fff6c8');
      if (d('star')) s += sparkle(548, 112, 7, '#fff6c8');
      s += C(690, 80, 32, '#fbe9a6') + C(682, 72, 6, 'rgba(0,0,0,.06)') + C(700, 92, 4, 'rgba(0,0,0,.06)');
      if (d('moon')) s += C(706, 70, 28, '#181f47');
      s += firework(150, 105, 60, d('fw') ? '#ffd54f' : '#ff8fb1', 18) + firework(390, 66, 44, '#8fe3ff', 14) + firework(255, 190, 22, '#c6a0ff', 10);
      // hill and torii
      s += P('M0 300 Q 200 248 400 290 T 800 268 L800 380 L0 380 Z', '#251f45');
      s += G('translate(400 308) scale(.78)', R(-26, -36, 7, 56, '#c8402c') + R(19, -36, 7, 56, '#c8402c') + P('M-44 -44 Q0 -52 44 -44 L46 -38 L-46 -38 Z', '#2b2522') + R(-40, -38, 80, 6, '#c8402c') + (d('torii') ? '' : R(-34, -24, 68, 5, '#c8402c')) + R(-3, -32, 6, 9, '#c8402c'));
      // ground
      s += R(0, 360, 800, 240, `url(#${u}grd)`);
      for (const [x, y, rx] of [[60, 520, 40], [170, 560, 46], [300, 585, 38], [470, 590, 44], [610, 560, 40], [740, 585, 48], [520, 500, 30], [120, 470, 26], [700, 470, 28]]) s += E(x, y, rx, rx * 0.32, '#4d4263');
      // lantern string
      s += P('M0 165 Q400 215 800 160', 'none', 'stroke="#2a2433" stroke-width="2"');
      const ly = (x) => { const t = x / 800; return (1 - t) ** 2 * 165 + 2 * (1 - t) * t * 215 + t * t * 160; };
      [50, 150, 250, 350, 450, 550, 650, 750].forEach((x, i) => {
        if (i === 6 && d('lantern2')) return;
        const col = i === 3 && d('lantern') ? '#4f86c6' : i % 2 ? '#fff4dc' : '#e0452f';
        s += lantern(x, ly(x) + 32, 1.05, col, '#ffcf7a');
      });
      // left stall: goldfish scooping
      s += R(40, 250, 10, 200, '#8a5a3a') + R(320, 250, 10, 200, '#8a5a3a');
      s += stripes(25, 226, 320, 40, 10, '#d9472b', '#fff4e6') + scallop(25, 266, 320, 10, '#d9472b', '#fff4e6', 12);
      s += R(60, 272, 250, 40, d('noren') ? '#3f8a5a' : '#2f4f86') + L(143, 272, 143, 312, 'rgba(0,0,0,.25)', 2) + L(227, 272, 227, 312, 'rgba(0,0,0,.25)', 2) + goldfish(185, 292, 1.2, '#fff7ea', false);
      s += R(48, 312, 274, 88, '#3a2c3c') + R(48, 398, 274, 26, '#b07a4a') + R(48, 398, 274, 5, '#c98f5a');
      for (const x of [90, 130, 170]) s += C(x, 345, 11, 'none', 'stroke="#fff" stroke-width="3"') + L(x, 356, x, 380, '#e9b43c', 3);
      s += R(55, 430, 265, 64, '#2f8fc2', 'rx="18"') + R(63, 437, 249, 50, '#5bbbe6', 'rx="14"') + E(110, 450, 30, 5, 'rgba(255,255,255,.35)');
      s += goldfish(95, 458, 1.1, '#ff6a3d', false) + goldfish(150, 474, 1, '#ff8a3d', true) + goldfish(200, 452, 1.1, '#fff2e8', false) + (d('fish') ? '' : goldfish(250, 472, 1.05, '#ff5a3d', true)) + goldfish(290, 452, 1, '#2b2522', false);
      // right stall: candy apples and cotton candy
      s += R(470, 255, 10, 195, '#8a5a3a') + R(760, 255, 10, 195, '#8a5a3a');
      s += stripes(455, 230, 330, 40, 10, '#3f7fc0', '#f4f8ff') + scallop(455, 270, 330, 10, '#3f7fc0', '#f4f8ff', 12);
      [[520, '#ffd1e0'], [600, d('bag') ? '#c9f2c9' : '#cfe7ff'], [680, '#fff2a8']].forEach(([x, col]) => { s += L(x, 276, x, 290, '#ddd', 1.5) + R(x - 17, 290, 34, 46, col, 'rx="9"') + sparkle(x - 5, 306, 5, '#ffffff') + C(x + 7, 322, 3, '#ffffff'); });
      s += R(478, 368, 284, 12, '#9a6a3a');
      [505, 555, 605, 655, 705].forEach((x) => { if (x === 655 && d('apple')) return; s += L(x, 368, x, 352, '#e9d7b0', 3) + C(x, 350, 15, '#d9302b') + E(x - 5, 344, 4, 6, 'rgba(255,255,255,.4)'); });
      s += R(470, 398, 300, 50, '#c98a4a') + R(470, 398, 300, 6, '#dba468');
      for (let x = 490; x < 770; x += 40) s += L(x, 410, x, 444, 'rgba(0,0,0,.12)', 2);
      // pinwheels on the post
      for (const [x, y, c1, c2] of [[770, 318, d('pin') ? '#5fa35a' : '#ff8fb1', '#ffd54f'], [745, 350, '#8fe3ff', '#ff8fb1']]) s += L(x, y, x, y + 46, '#e9d7b0', 2) + P(`M${x} ${y} L${x} ${y - 14} L${x + 10} ${y - 8} Z`, c1) + P(`M${x} ${y} L${x + 14} ${y} L${x + 8} ${y + 10} Z`, c2) + P(`M${x} ${y} L${x} ${y + 14} L${x - 10} ${y + 8} Z`, c1) + P(`M${x} ${y} L${x - 14} ${y} L${x - 8} ${y - 10} Z`, c2) + C(x, y, 2.2, '#fff');
      // cat, uchiwa, yo-yo
      s += cat(392, 470, 1.15, '#22202a', { tailRight: d('cat'), eyes: '#f3d04f' });
      s += G('translate(440 528) rotate(-18)', L(0, 22, 0, 48, '#c79a5a', 4) + C(0, 0, 26, '#fffaf0') + (d('uchiwa') ? P('M-24 -6 Q-12 -14 0 -6 T24 -6 L24 2 Q12 -6 0 2 T-24 2 Z', '#3f7fc0') + P('M-22 8 Q-11 0 0 8 T22 8 L20 14 Q10 8 0 14 T-20 14 Z', '#3f7fc0') : C(-9, -6, 6, '#e0452f') + C(9, -2, 5, '#e0452f') + C(-2, 11, 5, '#e0452f')));
      const yy = d('yoyo') ? [520, 560] : [350, 560];
      s += C(yy[0], yy[1], 15, '#ff6fa0') + P(`M${yy[0] - 15} ${yy[1]} Q${yy[0]} ${yy[1] - 8} ${yy[0] + 15} ${yy[1]}`, 'none', 'stroke="#fff" stroke-width="2"') + L(yy[0], yy[1] - 15, yy[0] + 6, yy[1] - 32, '#fff', 1.2) + E(yy[0] - 5, yy[1] - 5, 3, 4, 'rgba(255,255,255,.45)');
      return s;
    },
  };

  /* =====================================================================
   * 2. 商店街
   * ===================================================================== */
  const shotengai = {
    id: 'shotengai', name: '昼下がりの商店街', short: '商店街', sky: '#bfe3f5',
    diffs: [
      { id: 'cloud', x: 360, y: 72, r: 30, lv: 2, ja: '雲がひとつ多い' },
      { id: 'bird', x: 650, y: 26, r: 18, lv: 2, ja: '電線の鳥が 1 羽いない' },
      { id: 'flag', x: 440, y: 120, r: 20, lv: 1, ja: '旗の色がちがう' },
      { id: 'tomato', x: 79, y: 338, r: 16, lv: 2, ja: 'トマトがひとつ緑色' },
      { id: 'carrot', x: 167, y: 350, r: 18, lv: 2, ja: 'にんじんが 1 本ない' },
      { id: 'cat', x: 210, y: 150, r: 30, lv: 2, ja: '猫の色がちがう' },
      { id: 'crest', x: 405, y: 270, r: 24, lv: 2, ja: 'のれんの紋の形がちがう' },
      { id: 'dango', x: 330, y: 372, r: 22, lv: 2, ja: 'だんごの色の順番がちがう' },
      { id: 'signfish', x: 620, y: 185, r: 30, lv: 3, ja: '看板の魚の向きが逆' },
      { id: 'drink', x: 742, y: 336, r: 16, lv: 2, ja: '自販機の飲み物の色がちがう' },
      { id: 'post', x: 270, y: 432, r: 28, lv: 1, ja: 'ポストの色がちがう' },
      { id: 'basket', x: 467, y: 476, r: 22, lv: 2, ja: '自転車のかごがない' },
      { id: 'lamp', x: 535, y: 296, r: 20, lv: 3, ja: '街灯の形がちがう' },
      { id: 'flower', x: 580, y: 448, r: 20, lv: 3, ja: '鉢の花の色がちがう' },
    ],
    draw(d, u) {
      let s = `<defs>${grad(u + 'sky', [[0, '#a9d8f2'], [1, '#e4f4fb']])}</defs>`;
      s += R(0, 0, 800, 600, `url(#${u}sky)`);
      s += cloud(120, 60, 1) + cloud(580, 50, 1.2) + (d('cloud') ? cloud(360, 72, 0.6) : '');
      // pole and wires
      s += R(22, 0, 12, 470, '#8a8a90') + R(8, 40, 40, 6, '#77777e') + P('M28 42 Q400 70 800 30', 'none', 'stroke="#3a3a40" stroke-width="1.6"') + P('M28 42 Q400 90 800 60', 'none', 'stroke="#3a3a40" stroke-width="1.2"');
      const bird = (x, y) => E(x, y, 8, 6, '#3b3f4a') + C(x + 6, y - 5, 4, '#3b3f4a') + P(`M${x + 9} ${y - 5} l5 1 l-5 2 Z`, '#e9a03c') + P(`M${x - 6} ${y} l-8 -3 l2 6 Z`, '#3b3f4a');
      s += bird(250, 49) + bird(285, 51) + (d('bird') ? '' : bird(650, 26));
      // shop A: greengrocer
      s += R(20, 140, 250, 330, '#f2e3c6') + R(14, 132, 262, 12, '#6b4a35');
      s += R(40, 152, 210, 52, '#8a5a3a', 'rx="4"') + R(46, 158, 198, 40, '#a8774a', 'rx="3"');
      s += P('M80 168 L104 168 L92 194 Z', '#f08a3a') + P('M86 168 l-6 -10 M92 168 l0 -12 M98 168 l6 -10', 'none', 'stroke="#5f9a52" stroke-width="3" stroke-linecap="round"') + C(140, 178, 13, '#e0452f') + P('M134 166 l6 4 l6 -4', 'none', 'stroke="#5f9a52" stroke-width="3"') + C(190, 180, 14, '#7fbf5a') + C(186, 176, 4, 'rgba(255,255,255,.35)');
      s += cat(210, 150, 0.8, d('cat') ? '#9a9aa0' : '#e8913a', { eyes: '#5fa35a' });
      s += stripes(10, 228, 270, 46, 9, '#4f9a5a', '#f6fbf2') + scallop(10, 274, 270, 9, '#4f9a5a', '#f6fbf2', 10);
      s += R(30, 284, 230, 106, '#5a4636') + R(40, 296, 100, 60, '#6b5444') + R(150, 296, 100, 60, '#6b5444');
      s += R(28, 388, 236, 18, '#9a6a3a');
      for (const x of [40, 112, 184]) s += R(x, 352, 66, 38, '#c9925a') + L(x, 364, x + 66, 364, 'rgba(0,0,0,.15)', 2);
      [[52, 348], [70, 345], [88, 348], [61, 338], [79, 338]].forEach(([x, y], i) => { const col = i === 4 && d('tomato') ? '#7fbf5a' : '#e0452f'; s += C(x, y, 9, col) + C(x - 3, y - 3, 2, 'rgba(255,255,255,.4)'); });
      [122, 137, 152, 167].forEach((x) => { if (x === 167 && d('carrot')) return; s += P(`M${x - 6} 340 L${x + 6} 340 L${x} 368 Z`, '#f08a3a') + P(`M${x - 3} 340 l-4 -9 M${x} 340 l0 -10 M${x + 3} 340 l4 -9`, 'none', 'stroke="#5f9a52" stroke-width="2.4" stroke-linecap="round"'); });
      for (const [x, y] of [[198, 343], [222, 340], [242, 346]]) s += C(x, y, 13, '#8fcf6a') + P(`M${x - 8} ${y} Q${x} ${y - 8} ${x + 8} ${y}`, 'none', 'stroke="#5f9a52" stroke-width="2"');
      // shop B: wagashi
      s += R(280, 150, 250, 320, '#ece0cf') + P('M270 156 L540 156 L520 120 L290 120 Z', '#4a4a58');
      for (let x = 300; x < 520; x += 18) s += L(x, 124, x - 4, 154, 'rgba(255,255,255,.18)', 2);
      s += R(286, 158, 10, 312, '#6b4a35') + R(514, 158, 10, 312, '#6b4a35') + R(286, 214, 238, 8, '#6b4a35');
      s += R(300, 226, 210, 92, '#2f4f86') + L(370, 226, 370, 318, 'rgba(255,255,255,.3)', 2) + L(440, 226, 440, 318, 'rgba(255,255,255,.3)', 2);
      s += d('crest') ? P('M405 252 L423 270 L405 288 L387 270 Z', 'none', 'stroke="#fff" stroke-width="5"') : C(405, 270, 17, 'none', 'stroke="#fff" stroke-width="5"');
      s += R(298, 326, 214, 96, '#d8eef5') + R(298, 326, 214, 96, 'none', 'stroke="#6b4a35" stroke-width="5"') + R(302, 392, 206, 6, '#c9b08a');
      s += dango(330, 372, 0.7, d('dango') ? ['#8fcf6a', '#fffaf0', '#f6a8bf'] : ['#f6a8bf', '#fffaf0', '#8fcf6a']) + dango(352, 372, 0.7, ['#f6a8bf', '#fffaf0', '#8fcf6a']);
      for (const x of [395, 425, 455]) s += E(x, 382, 13, 10, '#fffdf8') + E(x - 3, 378, 4, 3, 'rgba(0,0,0,.05)');
      s += E(488, 380, 14, 10, '#7fae5a') + E(488, 384, 11, 6, '#f6efe0');
      s += lantern(522, 252, 0.9, '#e0452f');
      // lamp post between B and C
      s += R(532, 300, 6, 260, '#4a4a58') + R(526, 556, 18, 6, '#4a4a58');
      s += d('lamp') ? R(522, 282, 26, 26, '#fff6c8', 'rx="3" stroke="#4a4a58" stroke-width="3"') : C(535, 295, 14, '#fff6c8', 'stroke="#4a4a58" stroke-width="3"');
      // shop C: fishmonger
      s += R(545, 150, 160, 320, '#dce8ef') + R(539, 140, 172, 12, '#4a5a6a');
      s += R(560, 160, 130, 54, '#2f4f86', 'rx="4"');
      s += G(`translate(620 187) scale(${d('signfish') ? -1 : 1} 1)`, P('M-26 0 Q-6 -16 18 -2 L30 -12 L28 0 L30 12 L18 2 Q-6 16 -26 0 Z', '#cfe7ff') + C(-16, -2, 2.4, '#2f4f86'));
      s += stripes(540, 226, 170, 44, 6, '#3f7fc0', '#f4f8ff') + scallop(540, 270, 170, 6, '#3f7fc0', '#f4f8ff', 10);
      s += R(552, 280, 146, 96, '#4a5560') + P('M550 384 L700 384 L690 410 L560 410 Z', '#e9f4fb') + R(550, 410, 150, 60, '#9aa9b6');
      s += G('translate(585 380) rotate(-6)', P('M-22 0 Q0 -10 18 0 L26 -7 L26 7 L18 0 Q0 10 -22 0 Z', '#8fa7c0')) + G('translate(630 378) rotate(4)', P('M-22 0 Q0 -10 18 0 L26 -7 L26 7 L18 0 Q0 10 -22 0 Z', '#e2595b')) + G('translate(672 382) rotate(-3)', P('M-20 0 Q0 -9 16 0 L24 -6 L24 6 L16 0 Q0 9 -20 0 Z', '#8fa7c0'));
      // vending machine
      s += R(708, 260, 74, 210, '#d9302b', 'rx="6"') + R(716, 272, 58, 92, '#e9f4fb', 'rx="3"');
      [[726, 290, '#3f7fc0'], [742, 290, '#f3c74f'], [758, 290, '#5fa35a'], [726, 336, '#ffffff'], [742, 336, d('drink') ? '#b06ad9' : '#e0452f'], [758, 336, '#2b2522']].forEach(([x, y, col]) => { s += R(x - 6, y - 14, 12, 28, col, 'rx="3" stroke="rgba(0,0,0,.15)"'); });
      for (const x of [726, 742, 758]) s += R(x - 4, 372, 8, 5, '#7fd3ff', 'rx="1"');
      s += R(718, 420, 54, 22, '#2b2522', 'rx="3"');
      // pavement
      s += R(0, 470, 800, 130, '#d9cfc2');
      for (let x = -20; x < 800; x += 60) s += L(x, 470, x - 30, 600, 'rgba(0,0,0,.07)', 2);
      s += L(0, 520, 800, 520, 'rgba(0,0,0,.07)', 2) + L(0, 565, 800, 565, 'rgba(0,0,0,.07)', 2);
      // bunting
      s += P('M0 98 Q400 136 800 98', 'none', 'stroke="#6b4a35" stroke-width="1.5"');
      const fy = (x) => { const t = x / 800; return (1 - t) ** 2 * 98 + 2 * (1 - t) * t * 136 + t * t * 98; };
      const cols = ['#e0452f', '#f3c74f', '#4f86c6', '#5fa35a'];
      for (let i = 0, x = 20; x < 800; x += 40, i++) { const col = x === 440 && d('flag') ? '#b06ad9' : cols[i % 4]; const y = fy(x); s += P(`M${x - 12} ${y} L${x + 12} ${y} L${x} ${y + 24} Z`, col); }
      // post box
      s += E(270, 470, 24, 5, 'rgba(0,0,0,.15)') + R(254, 412, 32, 58, d('post') ? '#3f7fc0' : '#d9302b', 'rx="5"') + P('M252 414 Q270 392 288 414 Z', d('post') ? '#2f6aa8' : '#b8282a') + R(260, 424, 20, 4, '#2b2522', 'rx="2"') + R(258, 440, 24, 14, 'rgba(255,255,255,.85)', 'rx="2"');
      // bicycle
      const wheel = (x) => C(x, 512, 24, 'none', 'stroke="#2b2522" stroke-width="5"') + C(x, 512, 3, '#2b2522') + L(x - 17, 512, x + 17, 512, '#9aa', 1) + L(x, 495, x, 529, '#9aa', 1);
      s += E(420, 538, 72, 6, 'rgba(0,0,0,.15)') + wheel(372) + wheel(462);
      s += P('M372 512 L404 474 L448 474 L462 512 M404 474 L420 512 L448 474 M420 512 L372 512', 'none', 'stroke="#4f86c6" stroke-width="5" stroke-linejoin="round"') + L(404, 474, 400, 462, '#2b2522', 4) + R(390, 456, 22, 6, '#2b2522', 'rx="3"') + L(448, 474, 452, 456, '#4f86c6', 4) + L(444, 456, 462, 452, '#2b2522', 4);
      if (!d('basket')) s += P('M452 462 L484 462 L480 488 L456 488 Z', '#c9925a') + L(454, 470, 482, 470, 'rgba(0,0,0,.2)', 1.5) + L(455, 478, 481, 478, 'rgba(0,0,0,.2)', 1.5);
      // potted plant
      s += P('M564 452 L596 452 L590 478 L570 478 Z', '#b5652f') + L(572, 452, 568, 430, '#5f9a52', 3) + L(580, 452, 582, 424, '#5f9a52', 3) + L(588, 452, 594, 432, '#5f9a52', 3);
      for (const [x, y] of [[568, 430], [582, 424], [594, 432]]) s += blossom(x, y, 9, d('flower') ? '#f3d04f' : '#e0452f', '#fff2a8');
      return s;
    },
  };

  /* =====================================================================
   * 3. お正月の和室
   * ===================================================================== */
  const shogatsu = {
    id: 'shogatsu', name: 'お正月の和室', short: 'お正月', sky: '#f1e6cf',
    diffs: [
      { id: 'sun', x: 170, y: 122, r: 22, lv: 1, ja: '掛け軸の太陽の色がちがう' },
      { id: 'peaks', x: 170, y: 214, r: 34, lv: 3, ja: '掛け軸の山の数がちがう' },
      { id: 'mikan', x: 262, y: 266, r: 18, lv: 1, ja: '鏡もちのみかんがない' },
      { id: 'ume', x: 66, y: 232, r: 18, lv: 3, ja: '梅の花がひとつない' },
      { id: 'kitetail', x: 632, y: 214, r: 30, lv: 2, ja: '凧のしっぽがない' },
      { id: 'basket', x: 440, y: 362, r: 20, lv: 2, ja: 'みかんがひとつ多い' },
      { id: 'cup', x: 528, y: 366, r: 18, lv: 2, ja: '湯のみがない' },
      { id: 'ribbon', x: 690, y: 420, r: 40, box: [646, 362, 88, 108], lv: 2, ja: '重箱のひもの色がちがう' },
      { id: 'zabuton', x: 155, y: 484, r: 56, box: [78, 452, 154, 64], lv: 1, ja: '座布団の色がちがう' },
      { id: 'koma', x: 330, y: 548, r: 24, lv: 2, ja: 'こまの模様の色がちがう' },
      { id: 'hagoita', x: 412, y: 186, r: 32, lv: 3, ja: '羽子板の柄が上下逆' },
      { id: 'catspot', x: 168, y: 474, r: 16, lv: 3, ja: '猫のぶちがない' },
    ],
    draw(d, u) {
      let s = `<defs>${grad(u + 'wall', [[0, '#f4ead6'], [1, '#e8dbc0']])}${grad(u + 'sky', [[0, '#8fc8ea'], [1, '#d2ecf8']])}</defs>`;
      s += R(0, 0, 800, 600, `url(#${u}wall)`);
      s += R(0, 0, 800, 22, '#8a6a4a') + R(0, 370, 800, 14, '#7a5a3a');
      // tokonoma
      s += R(36, 34, 300, 340, '#e2d1ae') + R(330, 22, 14, 352, '#8a5a3a') + R(36, 336, 300, 38, '#a87a4a') + R(36, 336, 300, 5, '#c0915e');
      s += L(170, 34, 170, 58, '#6b4a35', 1.5) + R(116, 58, 108, 10, '#4a3a2a', 'rx="3"') + R(120, 66, 100, 230, '#5a6e8a') + R(130, 80, 80, 196, '#f8f1e0');
      s += C(170, 122, 15, d('sun') ? '#e9b43c' : '#d9302b');
      s += d('peaks') ? P('M134 240 L156 196 L170 214 L186 186 L206 240 Z', '#7d8fa8') + P('M182 194 L186 186 L190 194 Z', '#fff') : P('M134 240 L160 190 L178 214 L190 200 L206 240 Z', '#7d8fa8');
      s += P('M152 204 L160 190 L168 204 Z', '#fff') + P('M134 252 Q170 244 206 256', 'none', 'stroke="#9fb6cc" stroke-width="2"');
      s += R(114, 294, 112, 10, '#4a3a2a', 'rx="4"');
      // kagami mochi
      s += P('M226 338 L298 338 L290 314 L234 314 Z', '#c99a5a') + R(230, 308, 64, 8, '#d9ae6a') + P('M232 308 L262 296 L292 308 Z', '#fffaf0');
      s += E(262, 300, 30, 13, '#fffdf5') + E(262, 284, 23, 11, '#fffdf5') + E(254, 280, 8, 3, 'rgba(0,0,0,.04)');
      s += P('M246 274 Q256 268 268 272 Q258 278 246 274 Z', '#5f9a52');
      if (!d('mikan')) s += C(262, 266, 11, '#f08a3a') + C(259, 263, 3, 'rgba(255,255,255,.35)') + C(262, 256, 2, '#5f9a52');
      // ume in a vase
      s += P('M52 336 Q44 312 56 296 L76 296 Q88 312 80 336 Z', '#3f5f9a') + P('M66 296 Q60 262 74 236 M66 290 Q82 270 94 254 M70 262 Q52 250 50 232', 'none', 'stroke="#5a3a2a" stroke-width="3" stroke-linecap="round"');
      [[74, 236], [94, 254], [50, 232], [82, 268], [66, 232]].forEach(([x, y], i) => { if (i === 4 && d('ume')) return; s += blossom(x, y, 11, '#e98aa5', '#ffe08a'); });
      // hagoita on the wall
      s += G(`translate(412 186) rotate(-8) scale(1 ${d('hagoita') ? -1 : 1})`, P('M-24 -60 Q-26 -70 -14 -72 L14 -72 Q26 -70 24 -60 L20 40 Q0 50 -20 40 Z', '#fffaf0', 'stroke="#c99a5a" stroke-width="2"') + P('M-20 -40 Q0 -64 20 -40 Q10 -30 0 -36 Q-10 -30 -20 -40 Z', '#e0452f') + blossom(0, -44, 10, '#f6b6c8', '#ffe08a') + R(-20, 0, 40, 34, '#3f5f9a') + P('M-20 10 Q-10 4 0 10 T20 10', 'none', 'stroke="#fff" stroke-width="2"') + R(-6, 42, 12, 34, '#c99a5a', 'rx="4"'));
      // shoji with a window
      s += R(466, 44, 300, 290, '#8a5a3a') + R(474, 52, 284, 274, '#fbf8ef');
      for (let x = 474 + 47; x < 758; x += 47) s += L(x, 52, x, 326, '#b08a5a', 2.5);
      for (let y = 52 + 46; y < 326; y += 46) s += L(474, y, 758, y, '#b08a5a', 2.5);
      s += R(540, 98, 160, 136, `url(#${u}sky)`) + R(540, 98, 160, 136, 'none', 'stroke="#8a5a3a" stroke-width="5"') + cloud(586, 196, 0.45);
      s += L(612, 160, 560, 232, '#6b6b6b', 1);
      if (!d('kitetail')) s += P('M612 168 Q620 190 606 206 Q618 222 640 228', 'none', 'stroke="#e0452f" stroke-width="3"') + P('M612 168 Q628 186 640 200', 'none', 'stroke="#3f7fc0" stroke-width="3"');
      s += P('M612 118 L634 142 L612 168 L590 142 Z', '#fffaf0', 'stroke="#c99a5a" stroke-width="2"') + C(612, 142, 9, '#d9302b');
      // tatami
      s += R(0, 384, 800, 216, '#d9cf98');
      s += R(0, 384, 800, 6, '#3f5a3a') + L(260, 390, 220, 600, '#3f5a3a', 5) + L(560, 390, 600, 600, '#3f5a3a', 5) + L(0, 500, 230, 500, '#3f5a3a', 5) + L(590, 500, 800, 500, '#3f5a3a', 5);
      for (let x = 10; x < 800; x += 14) s += L(x, 392, x - 8, 600, 'rgba(120,110,60,.08)', 2);
      // kotatsu
      s += P('M318 398 Q470 382 622 398 L640 520 Q470 544 300 520 Z', '#c8402c');
      for (const [x, y] of [[350, 430], [400, 470], [460, 440], [520, 480], [580, 436], [600, 500], [340, 500], [470, 505]]) s += C(x, y, 6, '#f6d6b8', 'opacity=".9"');
      s += R(330, 374, 280, 24, '#9a6a3a', 'rx="4"') + R(330, 374, 280, 6, '#b8854e', 'rx="3"');
      s += E(440, 374, 34, 9, '#b07a3a') + P('M406 372 Q440 388 474 372', 'none', 'stroke="#8a5a2a" stroke-width="3"');
      [[426, 362], [446, 360], [436, 350], ...(d('basket') ? [[458, 356]] : [])].forEach(([x, y]) => { s += C(x, y, 10, '#f08a3a') + C(x - 3, y - 3, 2.5, 'rgba(255,255,255,.35)'); });
      if (!d('cup')) s += P('M516 352 L540 352 L537 378 L519 378 Z', '#5f9a52') + E(528, 352, 12, 3, '#3f7a3a') + P('M524 346 q-4 -8 2 -14 M532 346 q4 -8 -2 -14', 'none', 'stroke="rgba(255,255,255,.7)" stroke-width="2"');
      // jubako
      const rb = d('ribbon') ? '#e0452f' : '#e9b43c';
      s += E(690, 474, 52, 8, 'rgba(0,0,0,.15)') + R(648, 380, 84, 30, '#2b2522', 'rx="3"') + R(648, 410, 84, 30, '#b8282a', 'rx="3"') + R(648, 440, 84, 30, '#2b2522', 'rx="3"') + R(646, 374, 88, 10, '#2b2522', 'rx="3"');
      s += R(686, 374, 8, 96, rb) + R(648, 421, 84, 8, rb) + P('M690 374 q-18 -16 -24 -2 q8 8 24 2 q18 -16 24 -2 q-8 8 -24 2 Z', rb) + C(690, 372, 4, rb);
      s += P('M660 392 l6 -6 l6 6 l-6 6 Z', '#e9b43c') + P('M710 452 l6 -6 l6 6 l-6 6 Z', '#e9b43c');
      // zabuton with a sleeping cat
      s += R(78, 452, 154, 64, d('zabuton') ? '#5f9a52' : '#7a5a9a', 'rx="18"') + R(86, 458, 138, 52, 'rgba(255,255,255,.08)', 'rx="14"') + C(155, 484, 4, 'rgba(0,0,0,.2)');
      s += E(156, 478, 42, 20, '#f6f2ea') + P('M124 486 Q110 470 126 458', 'none', 'stroke="#f6f2ea" stroke-width="9" stroke-linecap="round"') + C(186, 470, 15, '#f6f2ea') + P('M176 460 L180 448 L188 458 Z', '#f6f2ea') + P('M190 458 L198 448 L199 462 Z', '#f6f2ea') + P('M180 472 q4 3 8 0 M190 472 q4 3 8 0', 'none', 'stroke="#6b5a4a" stroke-width="1.6"');
      if (!d('catspot')) s += E(168, 474, 13, 9, '#9a8a7a') + C(192, 462, 5, '#9a8a7a');
      s += E(140, 486, 10, 6, '#b8a898');
      // koma
      const kc = d('koma') ? ['#3f7fc0', '#f3c74f', '#e0452f'] : ['#e0452f', '#f3c74f', '#3f7fc0'];
      s += E(330, 572, 30, 5, 'rgba(0,0,0,.15)') + L(330, 520, 330, 532, '#6b4a35', 5) + P('M300 540 Q330 526 360 540 L330 570 Z', kc[0]) + P('M306 546 Q330 536 354 546 L346 554 Q330 548 314 554 Z', kc[1]) + P('M318 558 Q330 554 342 558 L330 570 Z', kc[2]);
      return s;
    },
  };

  /* =====================================================================
   * 4. 海の家
   * ===================================================================== */
  const umi = {
    id: 'umi', name: '夏の海の家', short: '海の家', sky: '#9fd6f2',
    diffs: [
      { id: 'sun', x: 90, y: 70, r: 36, lv: 3, ja: '太陽が小さい' },
      { id: 'cloud', x: 620, y: 90, r: 40, lv: 3, ja: '雲の場所がちがう', alt: [720, 56] },
      { id: 'gull', x: 462, y: 86, r: 18, lv: 2, ja: 'かもめが 1 羽いない' },
      { id: 'sail', x: 530, y: 236, r: 30, lv: 1, ja: 'ヨットの帆の色がちがう' },
      { id: 'flag', x: 244, y: 214, r: 26, lv: 2, ja: '旗の形がちがう' },
      { id: 'menu', x: 150, y: 260, r: 16, lv: 3, ja: 'メニューの絵がひとつない' },
      { id: 'tube', x: 70, y: 300, r: 28, lv: 1, ja: '浮き輪の色がちがう' },
      { id: 'umbrella', x: 470, y: 280, r: 50, box: [374, 252, 192, 52], lv: 1, ja: 'パラソルの色がちがう' },
      { id: 'melon', x: 520, y: 418, r: 22, lv: 2, ja: 'すいかがひと切れない' },
      { id: 'ball', x: 640, y: 470, r: 24, lv: 2, ja: 'ビーチボールの色がちがう' },
      { id: 'castle', x: 336, y: 440, r: 20, lv: 2, ja: '砂のお城の旗がない' },
      { id: 'crab', x: 712, y: 540, r: 20, lv: 3, ja: 'かにのはさみがひとつない' },
      { id: 'sandal', x: 226, y: 548, r: 22, lv: 2, ja: 'ビーチサンダルが片方ない' },
      { id: 'star', x: 110, y: 560, r: 20, lv: 3, ja: 'ヒトデが増えている' },
    ],
    draw(d, u) {
      let s = `<defs>${grad(u + 'sky', [[0, '#7cc6ee'], [1, '#d8f0fb']])}${grad(u + 'sea', [[0, '#2f9ad0'], [1, '#5fc3e4']])}</defs>`;
      s += R(0, 0, 800, 600, `url(#${u}sky)`);
      s += C(90, 70, d('sun') ? 24 : 34, '#ffd54f') + C(90, 70, d('sun') ? 32 : 44, '#ffd54f', 'opacity=".25"');
      s += cloud(300, 60, 1.1) + (d('cloud') ? cloud(720, 56, 0.9) : cloud(620, 90, 0.9));
      const gull = (x, y) => P(`M${x - 12} ${y} q6 -8 12 0 q6 -8 12 0`, 'none', 'stroke="#3a4a5a" stroke-width="2.4" stroke-linecap="round"');
      s += gull(420, 60) + (d('gull') ? '' : gull(462, 86)) + gull(500, 50);
      s += P('M640 232 Q700 196 760 232 Z', '#5f9a6a') + P('M700 232 Q740 208 800 232 Z', '#4f8a5a');
      s += R(0, 230, 800, 140, `url(#${u}sea)`);
      for (const [x, y, w] of [[60, 260, 60], [200, 290, 80], [380, 270, 50], [600, 300, 70], [700, 262, 50], [470, 340, 60], [120, 330, 50]]) s += P(`M${x} ${y} q${w / 4} -6 ${w / 2} 0 t${w / 2} 0`, 'none', 'stroke="rgba(255,255,255,.55)" stroke-width="2.4" stroke-linecap="round"');
      // sailboat
      s += P('M500 262 L560 262 L552 274 L508 274 Z', '#8a5a3a') + L(530, 262, 530, 200, '#6b4a35', 2.5) + P('M532 204 L532 258 L566 258 Z', d('sail') ? '#ff8a65' : '#ffffff') + P('M528 210 L528 258 L500 258 Z', '#f4f8ff');
      // sand
      s += P('M0 360 Q200 344 400 360 T800 356 L800 600 L0 600 Z', '#f2d9a6');
      for (const [x, y] of [[300, 520], [420, 580], [600, 600], [90, 470], [740, 470], [520, 540]]) s += E(x, y, 3, 1.6, '#d9bb84');
      // beach house
      s += R(26, 190, 264, 196, '#c9925a') + P('M10 196 L306 196 L284 150 L32 150 Z', '#d9b45a') + P('M10 196 L306 196 L300 204 L16 204 Z', '#b8913a');
      for (let x = 36; x < 290; x += 12) s += L(x, 152, x - 6, 196, 'rgba(120,80,20,.25)', 2);
      s += R(40, 210, 236, 60, '#e6c78a');
      for (let y = 214; y < 268; y += 6) s += L(40, y, 276, y, 'rgba(140,100,40,.25)', 1.5);
      s += R(26, 270, 264, 116, '#8a5a3a') + R(40, 282, 236, 64, '#5a3e2a') + R(30, 344, 256, 18, '#d9a868');
      s += R(110, 236, 80, 52, '#fffaf0', 'rx="4" stroke="#8a5a3a" stroke-width="3"');
      s += E(130, 262, 12, 6, '#f6d6a8') + P('M118 262 Q130 276 142 262 Z', '#e0452f');
      if (!d('menu')) s += G('translate(150 260)', E(0, 0, 6, 11, '#f3c74f') + P('M-6 4 L-12 10 M6 4 L12 10', 'none', 'stroke="#5f9a52" stroke-width="2.5"'));
      s += P('M164 256 L180 256 L176 272 L168 272 Z', '#ffffff') + E(172, 254, 9, 6, '#ff8fb1');
      const tc = d('tube') ? ['#4fc3f7', '#e8f8ff'] : ['#ff6f61', '#ffffff'];
      s += C(70, 300, 24, 'none', `stroke="${tc[0]}" stroke-width="14"`) + P('M70 276 A24 24 0 0 1 94 300', 'none', `stroke="${tc[1]}" stroke-width="14"`) + P('M70 324 A24 24 0 0 1 46 300', 'none', `stroke="${tc[1]}" stroke-width="14"`);
      s += L(244, 196, 244, 250, '#6b4a35', 2.5);
      s += d('flag') ? R(246, 200, 36, 30, '#ffffff', 'stroke="#3f7fc0" stroke-width="1.5"') + P('M252 222 q6 -6 12 0 t12 0', 'none', 'stroke="#3f7fc0" stroke-width="3"') + C(264, 210, 5, '#e0452f') : P('M246 200 L292 214 L246 230 Z', '#ffffff', 'stroke="#3f7fc0" stroke-width="1.5"') + P('M250 222 q6 -6 12 0 t12 0', 'none', 'stroke="#3f7fc0" stroke-width="3"') + C(258, 210, 5, '#e0452f');
      // umbrella and sheet
      s += P('M380 428 L560 428 L580 470 L360 470 Z', '#3f7fc0') + L(390, 440, 570, 440, 'rgba(255,255,255,.5)', 3) + L(375, 456, 575, 456, 'rgba(255,255,255,.5)', 3);
      s += L(470, 300, 470, 430, '#f4f4f4', 5);
      const uc = d('umbrella') ? '#f3c74f' : '#e0452f';
      for (let k = 0; k < 6; k++) { const a0 = Math.PI + (k / 6) * Math.PI, a1 = Math.PI + ((k + 1) / 6) * Math.PI; s += P(`M470 300 L${470 + Math.cos(a0) * 96} ${300 + Math.sin(a0) * 46} Q${470 + Math.cos((a0 + a1) / 2) * 104} ${300 + Math.sin((a0 + a1) / 2) * 64} ${470 + Math.cos(a1) * 96} ${300 + Math.sin(a1) * 46} Z`, k % 2 ? '#ffffff' : uc); }
      s += C(470, 256, 5, '#f4f4f4');
      [[496, 422], [520, 418], [544, 422]].forEach(([x, y], i) => { if (i === 1 && d('melon')) return; s += P(`M${x - 11} ${y - 8} L${x + 11} ${y - 8} L${x} ${y + 10} Z`, '#e8463a') + P(`M${x - 12} ${y - 10} L${x + 12} ${y - 10} L${x + 11} ${y - 7} L${x - 11} ${y - 7} Z`, '#3f8a4a') + C(x - 3, y - 3, 1.2, '#2b2522') + C(x + 3, y - 2, 1.2, '#2b2522'); });
      // beach ball
      s += E(640, 494, 24, 5, 'rgba(0,0,0,.12)') + C(640, 470, 22, '#ffffff') + P('M640 448 A22 22 0 0 1 662 470 L640 470 Z', '#e0452f') + P('M640 492 A22 22 0 0 1 618 470 L640 470 Z', d('ball') ? '#e0452f' : '#3f7fc0') + P('M618 470 A22 22 0 0 1 640 448 L640 470 Z', '#f3c74f') + C(640, 470, 4, '#ffffff');
      // sand castle
      s += P('M300 486 L372 486 L366 456 L306 456 Z', '#e2c084') + R(312, 440, 14, 18, '#e2c084') + R(346, 440, 14, 18, '#e2c084') + R(326, 448, 20, 10, '#e2c084') + P('M324 486 a12 12 0 0 1 24 0 Z', '#c9a46c');
      if (!d('castle')) s += L(336, 448, 336, 424, '#6b4a35', 1.5) + P('M337 424 L350 429 L337 434 Z', '#e0452f');
      s += P('M392 528 L416 528 L412 552 L396 552 Z', '#3f9ad0') + P('M392 528 Q404 518 416 528', 'none', 'stroke="#2b6a9a" stroke-width="2"') + L(420, 552, 432, 520, '#f3c74f', 4) + E(434, 516, 6, 4, '#f3c74f');
      // crab
      s += G('translate(712 540)', E(0, 0, 18, 12, '#e0452f') + C(-6, -12, 3, '#2b2522') + C(6, -12, 3, '#2b2522') + L(-6, -10, -6, -6, '#e0452f', 2) + L(6, -10, 6, -6, '#e0452f', 2) + L(-16, 4, -26, 12, '#e0452f', 3) + L(16, 4, 26, 12, '#e0452f', 3) + L(-14, 8, -22, 16, '#e0452f', 3) + L(14, 8, 22, 16, '#e0452f', 3) + P('M-18 -4 Q-34 -12 -30 -24 Q-24 -16 -22 -20 Q-28 -6 -16 -6 Z', '#e0452f') + (d('crab') ? '' : P('M18 -4 Q34 -12 30 -24 Q24 -16 22 -20 Q28 -6 16 -6 Z', '#e0452f')));
      // sandals
      const sandal = (x, y, a) => G(`translate(${x} ${y}) rotate(${a})`, R(-9, -20, 18, 40, '#3f9ad0', 'rx="9"') + P('M0 -10 L-8 6 M0 -10 L8 6', 'none', 'stroke="#f3c74f" stroke-width="3" stroke-linecap="round"'));
      s += sandal(206, 548, -12) + (d('sandal') ? '' : sandal(232, 552, 8));
      // shells and starfish
      s += P('M552 560 a10 10 0 0 1 20 0 Z', '#f6c6c6') + L(556, 560, 558, 552, '#d99a9a', 1) + L(562, 560, 562, 550, '#d99a9a', 1) + L(568, 560, 566, 552, '#d99a9a', 1);
      s += P('M592 578 a8 8 0 0 1 16 0 Z', '#fff2d6');
      const starfish = (x, y) => { let pts = ''; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? 6 : 14; pts += `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr} `; } return `<polygon points="${pts}" fill="#f08a3a"/>`; };
      s += starfish(760, 430);
      if (d('star')) s += starfish(110, 560);
      return s;
    },
  };

  /* =====================================================================
   * 5. 雪の温泉宿
   * ===================================================================== */
  const onsen = {
    id: 'onsen', name: '雪見の温泉宿', short: '温泉宿', sky: '#3a3468',
    diffs: [
      { id: 'moon', x: 110, y: 70, r: 30, lv: 2, ja: '月の形がちがう' },
      { id: 'treesnow', x: 300, y: 245, r: 38, lv: 3, ja: '木に雪が積もっていない' },
      { id: 'window', x: 580, y: 196, r: 26, lv: 2, ja: '窓の明かりが消えている' },
      { id: 'noren', x: 580, y: 282, r: 40, box: [524, 252, 112, 60], lv: 2, ja: 'のれんの色がちがう' },
      { id: 'lantern', x: 486, y: 290, r: 22, lv: 1, ja: '提灯の色がちがう' },
      { id: 'fence', x: 221, y: 360, r: 22, lv: 3, ja: '竹垣が 1 本ない' },
      { id: 'steam', x: 330, y: 400, r: 30, lv: 3, ja: '湯気がひとつ多い' },
      { id: 'towel', x: 160, y: 418, r: 24, lv: 1, ja: 'お猿さんが頭に手ぬぐいをのせていない' },
      { id: 'tokkuri', x: 286, y: 462, r: 20, lv: 2, ja: 'お盆のとっくりがない' },
      { id: 'oke', x: 440, y: 520, r: 24, lv: 2, ja: '桶の手ぬぐいの色がちがう' },
      { id: 'toro', x: 640, y: 452, r: 26, lv: 2, ja: '灯籠の笠の形がちがう' },
      { id: 'bird', x: 372, y: 336, r: 16, lv: 3, ja: '小鳥の色がちがう' },
    ],
    draw(d, u) {
      let s = `<defs>${grad(u + 'sky', [[0, '#26214f'], [0.6, '#4a3f78'], [1, '#8a6f9a']])}${grad(u + 'yu', [[0, '#9adbe8'], [1, '#5fb3c9']])}</defs>`;
      s += R(0, 0, 800, 600, `url(#${u}sky)`);
      s += C(110, 70, 26, '#fff3c4') + C(110, 70, 38, '#fff3c4', 'opacity=".15"');
      if (d('moon')) s += C(124, 62, 22, '#29234f');
      s += P('M0 250 L120 150 L200 210 L300 130 L420 240 L520 170 L640 230 L720 160 L800 210 L800 330 L0 330 Z', '#4a4a7a') + P('M120 150 L140 168 L128 166 L112 172 L100 166 Z M300 130 L322 152 L306 148 L290 156 L280 148 Z M720 160 L740 178 L726 174 L712 180 L702 174 Z', '#eef2fa');
      s += R(0, 300, 800, 300, '#e9eef6');
      s += pine(40, 300, 1, true) + pine(300, 282, 1.1, !d('treesnow')) + pine(345, 300, 0.85, true);
      // inn
      s += R(400, 210, 360, 170, '#7a4e32') + R(400, 150, 360, 70, '#e9dcc4') + P('M380 154 L780 154 L748 118 L412 118 Z', '#3b3b4f') + P('M380 154 L780 154 L774 146 L386 146 Z', '#f4f7fb') + P('M412 118 L748 118 L740 112 L420 112 Z', '#f4f7fb');
      s += P('M384 214 L776 214 L762 196 L398 196 Z', '#3b3b4f') + P('M384 214 L776 214 L770 206 L390 206 Z', '#f4f7fb');
      [420, 500, 580, 660].forEach((x) => { s += R(x, 164, 50, 26, x === 580 && d('window') ? '#3a3550' : '#ffd98a') + L(x + 25, 164, x + 25, 190, '#7a4e32', 2) + R(x, 164, 50, 26, 'none', 'stroke="#7a4e32" stroke-width="3"'); });
      for (const x of [420, 680]) s += R(x, 240, 56, 40, '#ffd98a') + L(x + 28, 240, x + 28, 280, '#7a4e32', 2) + L(x, 260, x + 56, 260, '#7a4e32', 2);
      s += R(520, 250, 120, 130, '#3a2a24');
      s += R(524, 252, 112, 60, d('noren') ? '#8a3a5a' : '#2f4f86') + L(561, 252, 561, 312, 'rgba(255,255,255,.3)', 2) + L(598, 252, 598, 312, 'rgba(255,255,255,.3)', 2) + P('M560 288 q10 -12 20 0 t20 0', 'none', 'stroke="#fff" stroke-width="3"') + P('M560 296 q10 -12 20 0 t20 0', 'none', 'stroke="#fff" stroke-width="3"');
      s += lantern(486, 290, 1, d('lantern') ? '#e0452f' : '#ffe08a', '#ffd98a') + lantern(674, 300, 1, '#ffe08a', '#ffd98a');
      s += R(400, 372, 360, 10, '#f4f7fb');
      // fence
      for (let x = 24, i = 0; x < 420; x += 19, i++) { if (x === 214 && d('fence')) continue; s += R(x, 318, 15, 86, '#7fa35b', 'rx="6"') + L(x + 2, 344, x + 13, 344, '#5f8a42', 2) + L(x + 2, 378, x + 13, 378, '#5f8a42', 2) + E(x + 7.5, 318, 7, 3, '#f4f7fb'); }
      s += R(20, 336, 404, 6, '#6b4a35') + R(20, 386, 404, 6, '#6b4a35');
      s += G('translate(372 336)', E(0, 0, 10, 8, d('bird') ? '#6fa8dc' : '#e0705a') + C(8, -6, 6, '#4a4a58') + P('M13 -6 l6 1 l-6 2 Z', '#2b2522') + P('M-8 -2 l-10 -4 l4 8 Z', '#4a4a58') + C(10, -7, 1.2, '#fff'));
      // bath
      s += E(220, 476, 210, 92, '#8a8a96');
      for (const [x, y, rx] of [[40, 470, 34], [80, 410, 30], [160, 392, 36], [260, 388, 34], [350, 404, 36], [410, 460, 30], [380, 540, 40], [270, 566, 44], [150, 562, 40], [60, 530, 36]]) s += E(x, y, rx, rx * 0.62, '#9a9aa8') + E(x - rx * 0.2, y - rx * 0.25, rx * 0.5, rx * 0.22, '#f4f7fb');
      s += E(225, 478, 168, 66, `url(#${u}yu)`) + E(180, 460, 60, 8, 'rgba(255,255,255,.3)');
      const steam = (x, y) => P(`M${x} ${y} q-14 -18 0 -36 q14 -18 0 -36`, 'none', 'stroke="rgba(255,255,255,.55)" stroke-width="7" stroke-linecap="round"');
      s += steam(120, 450) + steam(230, 440) + steam(380, 470) + (d('steam') ? steam(330, 430) : '');
      // snow monkey
      s += G('translate(160 452)', E(0, 10, 30, 14, 'rgba(0,0,0,.08)') + E(0, 0, 26, 22, '#a08c7a') + C(-22, -10, 7, '#a08c7a') + C(22, -10, 7, '#a08c7a') + C(-22, -10, 3.5, '#f2a7a0') + C(22, -10, 3.5, '#f2a7a0') + E(0, -4, 16, 15, '#f2a7a0') + C(-6, -8, 2.2, '#2b2522') + C(6, -8, 2.2, '#2b2522') + P('M-4 2 q4 3 8 0', 'none', 'stroke="#8a4a4a" stroke-width="1.6"') + E(0, -20, 18, 7, '#a08c7a') + (d('towel') ? '' : R(-16, -36, 32, 12, '#ffffff', 'rx="4"') + L(-12, -30, 12, -30, '#9ad0e8', 2)) + E(0, 18, 40, 6, `url(#${u}yu)`));
      // tray
      s += G('translate(290 470)', E(0, 6, 34, 8, 'rgba(0,0,0,.08)') + R(-32, -6, 64, 14, '#c99a5a', 'rx="4"') + (d('tokkuri') ? '' : P('M-14 -6 Q-22 -16 -14 -24 L-14 -34 L-6 -34 L-6 -24 Q2 -16 -6 -6 Z', '#fffdf5', 'stroke="#c9b08a" stroke-width="1"') + L(-16, -18, -4, -18, '#3f5f9a', 2)) + P('M8 -6 L22 -6 L20 -14 L10 -14 Z', '#fffdf5') + E(15, -14, 6, 2, '#3f5f9a'));
      // bucket
      s += G('translate(440 520)', E(0, 22, 30, 6, 'rgba(0,0,0,.12)') + P('M-26 -14 L26 -14 L22 20 L-22 20 Z', '#c99a5a') + L(-25, -4, 25, -4, '#8a6a3a', 3) + L(-23, 12, 23, 12, '#8a6a3a', 3) + P('M-18 -14 Q-10 -30 4 -22 Q14 -30 20 -14 Z', d('oke') ? '#f6a8bf' : '#9ad0e8'));
      // stone lantern
      s += G('translate(640 452)', E(0, 70, 34, 7, 'rgba(0,0,0,.12)') + R(-8, 20, 16, 50, '#8a8a96') + R(-22, 62, 44, 10, '#9a9aa8') + R(-18, -8, 36, 30, '#9a9aa8') + R(-9, -2, 18, 16, '#ffd98a') + (d('toro') ? E(0, -16, 32, 13, '#8a8a96') + C(0, -30, 6, '#8a8a96') : P('M-32 -8 L32 -8 L14 -28 L-14 -28 Z', '#8a8a96') + C(0, -32, 6, '#8a8a96')) + E(0, -24, 20, 4, '#f4f7fb'));
      for (const [x, y] of [[60, 40], [200, 30], [260, 90], [360, 60], [450, 40], [540, 80], [620, 30], [700, 70], [770, 40], [30, 160], [180, 120], [500, 120], [760, 120], [340, 200], [60, 230], [240, 300], [700, 410], [760, 480], [520, 560], [600, 520], [740, 560]]) s += C(x, y, 2.4, '#ffffff', 'opacity=".9"');
      return s;
    },
  };

  /* =====================================================================
   * 6. 桜の公園
   * ===================================================================== */
  const hanami = {
    id: 'hanami', name: '桜の公園', short: '桜の公園', sky: '#d6eefa',
    diffs: [
      { id: 'kite', x: 636, y: 130, r: 26, lv: 2, ja: '凧のしっぽがない' },
      { id: 'cluster', x: 752, y: 150, r: 30, lv: 2, ja: '桜の花のかたまりがひとつない' },
      { id: 'bridge', x: 420, y: 376, r: 56, box: [290, 330, 260, 94], lv: 1, ja: '橋の色がちがう' },
      { id: 'duck', x: 522, y: 452, r: 22, lv: 2, ja: 'あひるが 1 羽いない' },
      { id: 'koi', x: 380, y: 470, r: 22, lv: 2, ja: '鯉の色がちがう' },
      { id: 'sheet', x: 165, y: 545, r: 70, box: [24, 488, 290, 110], lv: 1, ja: 'シートの柄の色がちがう' },
      { id: 'tamago', x: 140, y: 522, r: 14, lv: 3, ja: 'お弁当の卵焼きの色がちがう' },
      { id: 'dango', x: 236, y: 520, r: 20, lv: 2, ja: 'だんごの色の順番がちがう' },
      { id: 'slat', x: 690, y: 497, r: 22, lv: 3, ja: 'ベンチの板が 1 枚ない' },
      { id: 'lamp', x: 584, y: 312, r: 18, lv: 2, ja: '街灯の明かりの形がちがう' },
      { id: 'collar', x: 686, y: 545, r: 16, lv: 2, ja: '犬の首輪の色がちがう' },
      { id: 'balloon', x: 772, y: 380, r: 24, lv: 1, ja: '風船の色がちがう' },
    ],
    draw(d, u) {
      let s = `<defs>${grad(u + 'sky', [[0, '#bfe4f7'], [1, '#eef8fd']])}${grad(u + 'pond', [[0, '#6cb8d8'], [1, '#9fd4e8']])}</defs>`;
      s += R(0, 0, 800, 600, `url(#${u}sky)`);
      s += cloud(500, 56, 0.9) + cloud(250, 40, 0.6);
      // kite
      s += L(636, 100, 560, 360, '#8a8a8a', 1) + P('M636 64 L656 88 L636 112 L616 88 Z', '#e0452f') + P('M636 64 L636 112 M616 88 L656 88', 'none', 'stroke="#fff" stroke-width="2"');
      if (!d('kite')) s += P('M636 112 q-8 10 0 20 q8 10 0 20', 'none', 'stroke="#3f7fc0" stroke-width="3"') + P('M632 122 l-8 -3 l2 7 Z M640 140 l8 -3 l-2 7 Z', '#f3c74f');
      s += P('M0 260 Q160 200 320 250 T640 230 T800 240 L800 360 L0 360 Z', '#a8d08d') + P('M0 300 Q200 260 420 296 T800 286 L800 380 L0 380 Z', '#8fc27a');
      s += R(0, 340, 800, 260, '#9fcf7f');
      // trees
      s += P('M100 360 Q96 300 110 240 L124 240 Q118 300 126 360 Z', '#7a5a42') + P('M114 270 Q80 240 70 220 M118 260 Q150 230 168 222', 'none', 'stroke="#7a5a42" stroke-width="7" stroke-linecap="round"');
      s += sakuraCluster(70, 200, 1.2) + sakuraCluster(130, 170, 1.4) + sakuraCluster(180, 210, 1.1) + sakuraCluster(40, 250, 0.9);
      s += P('M710 380 Q704 300 716 240 L730 240 Q724 300 734 380 Z', '#7a5a42') + P('M722 260 Q690 230 676 214 M726 256 Q756 226 770 214', 'none', 'stroke="#7a5a42" stroke-width="7" stroke-linecap="round"');
      s += sakuraCluster(680, 200, 1.2) + sakuraCluster(720, 160, 1.3) + (d('cluster') ? '' : sakuraCluster(752, 150, 1.1)) + sakuraCluster(770, 230, 0.9);
      s += P('M400 300 L404 250 L412 250 L414 300 Z', '#7a5a42') + sakuraCluster(408, 236, 0.8);
      // lamp
      s += R(581, 316, 6, 220, '#3b3b4f') + R(574, 532, 20, 6, '#3b3b4f');
      s += d('lamp') ? R(572, 296, 24, 22, '#fff6c8', 'rx="3" stroke="#3b3b4f" stroke-width="3"') + P('M568 296 L600 296 L584 286 Z', '#3b3b4f') : C(584, 306, 12, '#fff6c8', 'stroke="#3b3b4f" stroke-width="3"') + P('M570 296 L598 296 L584 284 Z', '#3b3b4f');
      // pond, koi, ducks, bridge
      s += E(420, 440, 240, 74, '#7ab07a') + E(420, 440, 228, 66, `url(#${u}pond)`);
      for (const [x, y, w] of [[300, 420, 50], [470, 480, 60], [560, 430, 40], [250, 470, 40]]) s += P(`M${x} ${y} q${w / 4} -4 ${w / 2} 0 t${w / 2} 0`, 'none', 'stroke="rgba(255,255,255,.6)" stroke-width="2" stroke-linecap="round"');
      s += G('translate(380 470) rotate(-12)', P('M-18 0 Q0 -9 16 0 L26 -7 L24 0 L26 7 L16 0 Q0 9 -18 0 Z', d('koi') ? '#2b2522' : '#f08a3a') + E(-2, -1, 6, 3, '#ffffff', 'opacity=".9"')) + G('translate(470 500) rotate(8)', P('M-16 0 Q0 -8 14 0 L22 -6 L20 0 L22 6 L14 0 Q0 8 -16 0 Z', '#ffffff') + E(2, -1, 5, 3, '#e0452f'));
      const duck = (x, y) => E(x, y, 16, 10, '#ffffff') + C(x + 12, y - 10, 8, '#ffffff') + P(`M${x + 19} ${y - 11} l9 2 l-9 3 Z`, '#f3a03c') + C(x + 14, y - 12, 1.4, '#2b2522') + P(`M${x - 16} ${y - 2} l-8 -6 l2 8 Z`, '#ffffff') + E(x, y + 9, 18, 3, 'rgba(255,255,255,.5)');
      s += duck(310, 440) + (d('duck') ? '' : duck(522, 452));
      const bc = d('bridge') ? '#8a5a3a' : '#d0412b';
      s += P('M290 410 Q420 330 550 410 L550 422 Q420 344 290 422 Z', bc) + P('M300 396 Q420 318 540 396', 'none', `stroke="${bc}" stroke-width="5"`);
      for (const x of [310, 340, 370, 400, 440, 470, 500, 530]) { const t = (x - 290) / 260, y = (1 - t) ** 2 * 410 + 2 * (1 - t) * t * 330 + t * t * 410; s += L(x, y - 2, x, y - 22, bc, 4); }
      s += C(300, 392, 5, '#e9b43c') + C(540, 392, 5, '#e9b43c');
      // picnic sheet
      const sc = d('sheet') ? '#e0452f' : '#4f86c6';
      s += P('M30 488 L300 492 L312 598 L18 598 Z', '#ffffff');
      for (let k = 0; k < 6; k++) s += P(`M${30 + k * 46} 488 L${52 + k * 46} 488 L${48 + k * 48} 598 L${22 + k * 48} 598 Z`, sc, 'opacity=".55"');
      for (let k = 0; k < 4; k++) s += P(`M${28 - k} ${500 + k * 26} L${302 + k * 3} ${504 + k * 26} L${303 + k * 3} ${516 + k * 26} L${27 - k} ${512 + k * 26} Z`, sc, 'opacity=".45"');
      // bento
      s += R(84, 500, 92, 50, '#2b2522', 'rx="5"') + R(90, 506, 38, 38, '#fffdf5', 'rx="2"') + C(109, 525, 4, '#d9302b') + R(132, 506, 38, 18, d('tamago') ? '#f6a8bf' : '#f3d04f', 'rx="2"') + R(132, 528, 18, 16, '#5f9a52', 'rx="2"') + R(152, 528, 18, 16, '#e0705a', 'rx="2"');
      s += dango(222, 520, 0.75, ['#f6a8bf', '#fffaf0', '#8fcf6a']) + dango(244, 522, 0.75, d('dango') ? ['#8fcf6a', '#fffaf0', '#f6a8bf'] : ['#f6a8bf', '#fffaf0', '#8fcf6a']);
      s += P('M262 540 L280 540 L278 560 L264 560 Z', '#5f9a52') + E(271, 540, 9, 2.5, '#3f7a3a');
      // bench
      s += R(616, 518, 8, 40, '#5a4a3a') + R(756, 518, 8, 40, '#5a4a3a');
      [[480, 0], [497, 1], [514, 2]].forEach(([y, i]) => { if (i === 1 && d('slat')) return; s += R(606, y, 168, 11, '#b07a4a', 'rx="3"'); });
      s += R(612, 470, 6, 60, '#5a4a3a') + R(762, 470, 6, 60, '#5a4a3a');
      // balloon tied to the bench
      s += P('M766 476 Q760 430 772 402', 'none', 'stroke="#6b6b6b" stroke-width="1.2"') + E(772, 380, 18, 22, d('balloon') ? '#f3c74f' : '#e0452f') + E(766, 372, 4, 7, 'rgba(255,255,255,.45)') + P('M768 401 L776 401 L772 407 Z', d('balloon') ? '#f3c74f' : '#e0452f');
      // shiba dog
      s += G('translate(686 556)', E(0, 30, 26, 5, 'rgba(0,0,0,.12)') + E(0, 12, 20, 18, '#e08b3c') + E(0, 18, 11, 12, '#fff3e0') + P('M14 18 Q34 10 28 -4 Q24 6 14 8 Z', '#e08b3c') + C(0, -16, 16, '#e08b3c') + P('M-14 -22 L-12 -38 L-2 -28 Z', '#e08b3c') + P('M14 -22 L12 -38 L2 -28 Z', '#e08b3c') + E(0, -10, 10, 7, '#fff3e0') + C(-6, -18, 2, '#2b2522') + C(6, -18, 2, '#2b2522') + C(0, -12, 2.4, '#2b2522') + R(-12, -2, 24, 5, d('collar') ? '#3f7fc0' : '#e0452f', 'rx="2"'));
      // petals
      for (const [x, y, a] of [[200, 120, 20], [260, 300, -30], [330, 200, 40], [470, 140, 10], [560, 250, -20], [620, 380, 30], [360, 560, 15], [520, 560, -40], [440, 280, 60], [150, 320, 0], [700, 450, 25], [40, 420, -15]]) s += E(x, y, 4, 2.4, '#f6b6c8', `transform="rotate(${a} ${x} ${y})"`);
      return s;
    },
  };

  const SCENES = [matsuri, shotengai, shogatsu, umi, onsen, hanami];
  if (typeof module === 'object' && module.exports) module.exports = SCENES;
  else root.MS_SCENES = SCENES;
})(typeof self !== 'undefined' ? self : this);
