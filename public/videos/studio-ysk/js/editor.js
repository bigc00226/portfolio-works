/*
 * STUDIO-style editor replica — engine
 * Clock / cursor / canvas / overlay / layers / properties / popovers / actions.
 * The timeline itself lives in scenario.js.
 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const Ease = {
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    linear: (t) => t,
  };

  /* ------------------------------------------------------------------ icons */
  const ICONS = {
    // neutral "back to the dashboard" grid (no product logo)
    logo: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/>',
    phone: '<rect x="6.5" y="2" width="11" height="20" rx="2"/><path d="M11 18h2"/>',
    'cloud-check': '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9.5 14 2 2 3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    files: '<path d="M15.5 2H8.6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9.8a2 2 0 0 0 2-2V6.6z"/><path d="M3.6 7.6v12.8a1.6 1.6 0 0 0 1.6 1.6h9.8"/><path d="M15 2v5h5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    square: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    type: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    button: '<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M8 12h8"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4z"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    form: '<rect x="3" y="3.5" width="18" height="5" rx="1.5"/><rect x="3" y="11.5" width="18" height="5" rx="1.5"/><path d="M3 21h8"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    modal: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="8" width="10" height="8" rx="1"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    'align-left': '<path d="M3 6h18M3 12h12M3 18h16"/>',
    'align-center': '<path d="M3 6h18M6 12h12M4 18h16"/>',
    'align-right': '<path d="M3 6h18M9 12h12M5 18h16"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    wrap: '<path d="M3 6h18M3 12h15a3 3 0 1 1 0 6h-4"/><path d="m16 16-2 2 2 2"/><path d="M3 18h7"/>',
    'text-h': '<path d="M4 5h10M9 5v10"/><path d="M5 20h14M16 17l3 3-3 3"/>',
    'text-v': '<path d="M4 4h8M8 4v9"/><path d="M18 5v15M15 17l3 3 3-3"/>',
    radius: '<path d="M4 20V10a6 6 0 0 1 6-6h10"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  };
  function icon(name, cls = '') {
    return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }
  function hydrateIcons(root = document) {
    $$('i[data-icon]', root).forEach((i) => {
      const t = document.createElement('template');
      t.innerHTML = icon(i.dataset.icon, i.className);
      const svg = t.content.firstChild;
      if (i.id) svg.id = i.id;
      i.replaceWith(svg);
    });
  }

  /* ---------------------------------------------------- project style vars */
  // From the project's STUDIO style settings (colors / fonts registered in the project).
  const COLORS = {
    'c0000000': ['黒', '#000000', '#000000'],
    'c3333333': ['テキスト', '#333', '#333333'],
    'c025f82a': ['キーカラー', '#025f82', '#025F82'],
    'cccccccc': ['ライン', '#cccccc', '#CCCCCC'],
    'ceeeeeee': ['画像背景', '#EEEEEE', '#EEEEEE'],
    'cf5f5f5a': ['グレー背景', '#f5f5f5', '#F5F5F5'],
    'c3232320': ['フッター背景', '#323232', '#323232'],
    'cfffffff': ['白', '#FFFFFF', '#FFFFFF'],
  };
  const FONT_VARS = {
    'c88b5b13': 'Noto Sans JP',
    '559784c0': 'Noto Sans JP',
    'b6b57d97': 'Rubik',
    '399da130': 'GFS Didot',
    '2aaff4ab': 'Bad Script',
    '3591db03': 'Lato',
    '8dbcfe95': 'Bodoni Moda',
    '23b1f2c5': 'Libre Bodoni',
  };
  const FONT_LIST = [
    ['Noto Sans JP', '本文'],
    ['GFS Didot', 'ロゴ'],
    ['Rubik', '英数字'],
    ['Bad Script', '筆記体'],
    ['Lato', ''],
    ['Bodoni Moda', ''],
  ];
  const ASSETS = [
    ['23448c44', '23448c44-c7ff-4cf9-b215-2ff428bb9e16_middle.webp'],
    ['89faf744', '89faf744-aa9f-42f3-8fc8-74fd267f58a8_middle.webp'],
    ['582823f4', '582823f4-50e0-48bc-aae4-31660f950fdf_middle.webp'],
    ['68386d2e', '68386d2e-6d2f-4d84-9b29-733b09da3632_small.webp'],
    ['f2d9f61e', 'f2d9f61e-45ef-4d2a-ac02-cc22f0011c54_small.webp'],
    ['1e7a42a6', '1e7a42a6-380c-4ce5-89c6-8a8cdd55ec39_small.webp'],
    ['e7c7aed6', 'e7c7aed6-2141-4fa2-9c77-e1947c7fde8d_small.webp'],
    ['2a5bd354', '2a5bd354-0f08-438a-a2d1-77a9331c7525_small.webp'],
    ['22cf95da', '22cf95da-b041-416b-9af1-959a792a7899_small.webp'],
    ['a387d9da', 'a387d9da-df2c-402d-aaaa-90238d4364f8_small.webp'],
    ['unsplash', 'unsplash-1644899391350-27bfce1f15be.webp'],
  ];

  /** '#025f82' / '#333' / 'rgb(2, 95, 130)' → '#025F82' (null for anything else) */
  function toHex(v) {
    v = String(v).trim();
    let m = v.match(/^#([0-9a-f]{3})$/i);
    if (m) return '#' + m[1].split('').map((c) => c + c).join('').toUpperCase();
    m = v.match(/^#([0-9a-f]{6})$/i);
    if (m) return '#' + m[1].toUpperCase();
    m = v.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*1)?\s*\)$/);
    if (m) return '#' + m.slice(1, 4).map((n) => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
    return null;
  }
  function colorInfo(v) {
    if (!v || v === 'transparent' || v === 'none' || /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0(?:\.0+)?\s*\)$/.test(String(v).trim())) return { name: 'なし', css: 'transparent', none: true, hex: '' };
    const m = String(v).match(/--s-color-([0-9a-f]{8})/);
    if (m && COLORS[m[1]]) return { name: COLORS[m[1]][0], css: COLORS[m[1]][1], hex: COLORS[m[1]][2] };
    const hex = toHex(v);
    const hit = hex && Object.values(COLORS).find((c) => c[2] === hex);
    if (hit) return { name: hit[0], css: hit[1], hex: hit[2] };
    return { name: v, css: v, hex: hex || '' };
  }
  function fontInfo(v) {
    if (!v) return '';
    const m = String(v).match(/--s-font-([0-9a-f]{8})/);
    if (m && FONT_VARS[m[1]]) return FONT_VARS[m[1]];
    return String(v).split(',')[0].replace(/["']/g, '').trim();
  }

  /* --------------------------------------- STUDIO rule parser (real values) */
  const Studio = {
    rules: new Map(),
    // declarations inside STUDIO's breakpoint media queries (tablet: max-width 840px, mobile: max-width 540px)
    bpRules: { tablet: new Map(), mobile: new Map() },
    parse(css, target) {
      target = target || this.rules;
      const n = css.length;
      let i = 0;
      while (i < n) {
        while (i < n && /\s/.test(css[i])) i++;
        if (css.startsWith('/*', i)) { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
        const ob = css.indexOf('{', i);
        if (ob < 0) break;
        const sel = css.slice(i, ob).trim();
        if (sel.startsWith('@')) {
          let depth = 1, j = ob + 1;
          while (j < n && depth > 0) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
          const mw = sel.match(/^@media[^{]*max-width:\s*(\d+)px/);
          const bp = mw && (mw[1] === '840' ? 'tablet' : mw[1] === '540' ? 'mobile' : null);
          if (bp && target === this.rules) this.parse(css.slice(ob + 1, j - 1), this.bpRules[bp]);
          i = j; continue;
        }
        const cb = css.indexOf('}', ob);
        if (cb < 0) break;
        const body = css.slice(ob + 1, cb);
        i = cb + 1;
        // node ids are UUIDs, or short ids such as data-s-6Scemd0Q (HTML lowercases attribute names, so keys are lowercased)
        const m = sel.match(/^\.sd\[data-s-([0-9A-Za-z-]+)\]$/);
        if (m) {
          const key = m[1].toLowerCase();
          const decls = target.get(key) || {};
          body.split(';').forEach((d) => {
            const k = d.indexOf(':');
            if (k > 0) decls[d.slice(0, k).trim()] = d.slice(k + 1).trim();
          });
          target.set(key, decls);
        }
      }
    },
    hasRules(id) { return this.rules.has(id) || this.bpRules.tablet.has(id) || this.bpRules.mobile.has(id); },
    /** the node's own style id: its UUID when that has rules, else any id with rules (presets such as data-s-c3848b96 have none) */
    idOf(el) {
      if (!el || !el.attributes) return null;
      let short = null;
      for (const a of el.attributes) {
        const m = a.name.match(/^data-s-([0-9a-z-]+)$/);
        if (!m || !this.hasRules(m[1])) continue;
        if (m[1].length === 36) return m[1];
        if (!short) short = m[1];
      }
      return short;
    },
    /** effective declarations of a node at a breakpoint (base, then tablet, then mobile — like the cascade) */
    decls(el, bp) {
      const id = this.idOf(el);
      if (!id) return {};
      const out = Object.assign({}, this.rules.get(id) || {});
      if (bp === 'tablet' || bp === 'mobile') Object.assign(out, this.bpRules.tablet.get(id) || {});
      if (bp === 'mobile') Object.assign(out, this.bpRules.mobile.get(id) || {});
      return out;
    },
    /** property names that a breakpoint overrides for this node */
    bpKeys(el, bp) {
      const id = this.idOf(el);
      const keys = new Set();
      if (!id) return keys;
      if (bp === 'tablet' || bp === 'mobile') Object.keys(this.bpRules.tablet.get(id) || {}).forEach((k) => keys.add(k));
      if (bp === 'mobile') Object.keys(this.bpRules.mobile.get(id) || {}).forEach((k) => keys.add(k));
      return keys;
    },
  };

  /* ------------------------------------------------------------------ clock (shared/stage.js: deterministic timeline) */
  const { Clock, wait, tween, frameFns, afterFns } = window.Stage;
  /** pause for a CSS transition: on the video clock too (transitions are switched off while seeking) */
  const realWait = (ms) => wait(ms);

  /* ----------------------------------------------------------------- cursor */
  const UI = {
    hovered: null,
    hover(el) { if (this.hovered && this.hovered !== el) this.hovered.classList.remove('is-hover'); this.hovered = el; if (el) el.classList.add('is-hover'); },
    clear() { if (this.hovered) this.hovered.classList.remove('is-hover'); this.hovered = null; },
  };
  const Cursor = {
    el: null, x: 0, y: 0,
    init() { this.el = $('#cursor'); this.x = innerWidth * 0.62; this.y = innerHeight * 0.74; this.render(); },
    /** a real pointer sits on whole pixels */
    render() { this.el.style.transform = `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`; },
    kind(k) { this.el.dataset.kind = k || 'arrow'; },
    async moveTo(x, y, o = {}) {
      UI.clear();
      Overlay.hover(null);
      const sx = this.x, sy = this.y, dx = x - sx, dy = y - sy;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) return;
      // hand-on-a-mouse: slightly curved, quick start + long settle, varying a little; long free moves sometimes
      // overshoot and come back onto the target
      const free = o.ms == null && !o.onMove && !o.easing;
      const ms = o.ms != null ? o.ms : clamp(240 + dist * 0.4, 280, 900) * (0.88 + Math.random() * 0.24);
      const nx = -dy / dist, ny = dx / dist;
      const bendK = o.bend != null ? o.bend : (0.03 + Math.random() * 0.07) * (Math.random() < 0.8 ? 1 : -1);
      const bend = bendK * dist * (dx >= 0 ? 1 : -1);
      let ex = x, ey = y;
      const overshoot = free && dist > 380 && Math.random() < 0.45;
      if (overshoot) {
        const k = 6 + Math.random() * Math.min(14, dist * 0.02);
        ex = x + (dx / dist) * k + nx * (Math.random() * 6 - 3);
        ey = y + (dy / dist) * k + ny * (Math.random() * 6 - 3);
      }
      const cx = sx + (ex - sx) / 2 + nx * bend, cy = sy + (ey - sy) / 2 + ny * bend;
      const mj = (t) => { const q = Math.pow(t, 0.82); return q * q * q * (10 - 15 * q + 6 * q * q); };
      await tween(ms, (e) => {
        const u = 1 - e;
        this.x = u * u * sx + 2 * u * e * cx + e * e * ex;
        this.y = u * u * sy + 2 * u * e * cy + e * e * ey;
        this.render();
        if (o.onMove) o.onMove(this.x, this.y);
      }, o.easing || mj);
      if (overshoot) {
        const bx = this.x, by = this.y;
        await tween(110 + Math.random() * 90, (e) => { this.x = bx + (x - bx) * e; this.y = by + (y - by) * e; this.render(); }, (t) => 1 - Math.pow(1 - t, 3));
      }
    },
    press() { this.el.classList.add('down'); ripple(this.x, this.y); },
    release() { this.el.classList.remove('down'); },
    async click() { this.press(); await wait(110); this.release(); await wait(80); },
    async dblclick() { this.press(); await wait(70); this.release(); await wait(60); this.press(); await wait(70); this.release(); await wait(80); },
  };
  function ripple(x, y) {
    if (Clock.ff) return;
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 700);
  }
  function uiPoint(el, ax = 0.5, ay = 0.5) {
    const r = el.getBoundingClientRect();
    return [r.left + r.width * ax, r.top + r.height * ay];
  }

  /** rect of any element on this page's screen, also inside (scaled) iframes — stops at this page's window */
  function screenRect(el) {
    const r = el.getBoundingClientRect();
    let x = r.left, y = r.top, w = r.width, h = r.height;
    let win = el.ownerDocument.defaultView;
    while (win && win !== window && win.frameElement) {
      const fe = win.frameElement;
      const fr = fe.getBoundingClientRect();
      const sx = fe.offsetWidth ? fr.width / fe.offsetWidth : 1;
      const sy = fe.offsetHeight ? fr.height / fe.offsetHeight : 1;
      x = fr.left + (fe.clientLeft + x) * sx; y = fr.top + (fe.clientTop + y) * sy; w *= sx; h *= sy;
      win = fe.ownerDocument.defaultView;
    }
    return { left: x, top: y, width: w, height: h, right: x + w, bottom: y + h };
  }

  /* ------------------------------------------------------------- site frame */
  const Site = {
    iframe: null, doc: null, win: null,
    store: new Map(), imgSrc: new Map(),
    hide(el) { if (el) el.setAttribute('data-demo-hidden', ''); },
    hideAll(list) { list.forEach((el) => this.hide(el)); },
    show(el, anim = 'pop') {
      if (!el) return;
      el.removeAttribute('data-demo-hidden');
      if (anim && !Clock.ff) {
        const cls = anim === 'fade' ? 'demo-fadein' : 'demo-pop';
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        setTimeout(() => el.classList.remove(cls), 800);
      }
    },
    isHidden(el) { return el.hasAttribute('data-demo-hidden'); },
    /** viewport rect of an element inside the canvas iframe */
    rect(el) {
      const fr = this.iframe.getBoundingClientRect();
      const s = fr.width / this.iframe.offsetWidth;
      const r = el.getBoundingClientRect();
      return { left: fr.left + r.left * s, top: fr.top + r.top * s, width: r.width * s, height: r.height * s };
    },
    /** rect of an element as it WILL be once shown */
    measure(el) {
      const hidden = this.isHidden(el);
      if (hidden) { el.removeAttribute('data-demo-hidden'); el.setAttribute('data-demo-measure', ''); }
      const r = this.rect(el);
      if (hidden) { el.removeAttribute('data-demo-measure'); el.setAttribute('data-demo-hidden', ''); }
      return r;
    },
    original(el) { return this.store.has(el) ? this.store.get(el) : el.innerHTML; },
    empty(el) { if (!this.store.has(el)) this.store.set(el, el.innerHTML); el.innerHTML = ''; },
    setHTML(el, html) { if (!this.store.has(el)) this.store.set(el, el.innerHTML); el.innerHTML = html; },
    restore(el) { if (this.store.has(el)) el.innerHTML = this.store.get(el); },
    tokens(html) {
      const t = document.createElement('template');
      t.innerHTML = html;
      const out = [];
      const walk = (node) => {
        node.childNodes.forEach((n) => {
          if (n.nodeType === 3) { for (const ch of n.textContent) out.push(esc(ch)); }
          else if (n.nodeType === 1) {
            if (n.tagName === 'BR') out.push('<br>');
            else {
              const open = n.outerHTML.slice(0, n.outerHTML.indexOf('>') + 1);
              out.push(open); walk(n); out.push(`</${n.tagName.toLowerCase()}>`);
            }
          }
        });
      };
      walk(t.content);
      return out;
    },
    async type(el, o = {}) {
      const target = o.html != null ? o.html : this.original(el);
      const vertical = /vertical/.test(this.win.getComputedStyle(el).writingMode);
      el.classList.toggle('demo-vertical', vertical);
      const toks = this.tokens(target);
      const cps = o.cps || 16;
      let out = '';
      {
        for (let i = 0; i < toks.length; i++) {
          out += toks[i];
          if (toks[i].startsWith('<') && !toks[i].startsWith('<br')) continue;
          el.innerHTML = `<span class="demo-typing-wrap">${out}<span class="demo-caret"></span></span>`;
          const ch = toks[i];
          let d = 1000 / cps * (0.6 + Math.random() * 0.8);
          if (/[、。，．]/.test(ch)) d += 140;
          if (ch === '<br>') d += 220;
          await wait(d);
        }
        el.innerHTML = `<span class="demo-typing-wrap">${target}<span class="demo-caret"></span></span>`;
        await wait(o.hold != null ? o.hold : 380);
      }
      el.innerHTML = target;
      el.classList.remove('demo-vertical');
    },
    async paste(el, o = {}) {
      const target = o.html != null ? o.html : this.original(el);
      el.innerHTML = `<span class="demo-typing-wrap demo-selected-text">${target}</span>`;
      await wait(o.hold || 520);
      el.innerHTML = target;
    },
    selectAll(el) { el.innerHTML = `<span class="demo-typing-wrap demo-selected-text">${el.innerHTML}</span>`; },
    noImg(el) {
      if (!el) return;
      if (el.tagName === 'IMG') {
        if (!this.imgSrc.has(el)) this.imgSrc.set(el, el.getAttribute('src'));
        const w = Math.max(10, Math.round(el.getBoundingClientRect().width || 775));
        const h = Math.max(10, Math.round(el.getBoundingClientRect().height || 581));
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#eceef1"/><g transform="translate(${w / 2 - 28},${h / 2 - 28}) scale(2.333)" fill="none" stroke="#9aa3ad" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></g></svg>`;
        el.setAttribute('src', 'data:image/svg+xml,' + encodeURIComponent(svg));
        el.setAttribute('data-demo-noimg-img', '');
      } else {
        el.setAttribute('data-demo-noimg', '');
      }
    },
    hasImg(el) { return el && !el.hasAttribute('data-demo-noimg') && !el.hasAttribute('data-demo-noimg-img'); },
    setImg(el) {
      if (!el) return;
      if (el.tagName === 'IMG') {
        if (this.imgSrc.has(el)) el.setAttribute('src', this.imgSrc.get(el));
        el.removeAttribute('data-demo-noimg-img');
        this.anim(el, 'demo-fadein', 800);
      } else {
        el.removeAttribute('data-demo-noimg');
        this.clearBg(el);
        // STUDIO's `.image:before { transition: inherit }` (all .3s) would cross-fade from the previous picture, and the
        // right panel would read that old URL: jump to the new picture (the demo-imgfade animation still fades it in)
        try { el.getAnimations({ subtree: true }).forEach((a) => { if (a.transitionProperty === 'background-image') a.finish(); }); } catch (e) {}
        this.anim(el, 'demo-imgfade', 900);
      }
    },
    bgOverride(el, url) { el.style.setProperty('--demo-bg', `url("${url}")`); el.setAttribute('data-demo-bg', ''); },
    clearBg(el) { el.style.removeProperty('--demo-bg'); el.removeAttribute('data-demo-bg'); this.dropEmptyStyle(el); },
    /** removing the last inline property leaves style="" behind; drop it so the DOM matches the snapshot exactly */
    dropEmptyStyle(el) { if (el.hasAttribute('style') && !el.getAttribute('style').trim()) el.removeAttribute('style'); },
    imageUrl(el) {
      if (!el) return '';
      if (el.tagName === 'IMG') return this.imgSrc.get(el) || el.getAttribute('src');
      const m = this.win.getComputedStyle(el, '::before').backgroundImage.match(/url\("?(.*?)"?\)/);
      return m ? m[1] : '';
    },
    anim(el, cls, ms) {
      if (Clock.ff) return;
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms);
    },
    override(el, prop, val) { el.style.setProperty(prop, val, 'important'); },
    clearOverride(el, prop) { el.style.removeProperty(prop); this.dropEmptyStyle(el); },
  };

  /* ---------------------------------------------------------------- overlay */
  const Overlay = {
    hoverEl: null, selEl: null, dropRect: null, selOpts: {}, issueTarget: null, issueInside: false,
    hover(el) { this.hoverEl = el; },
    /** red (or green when ok) marker around a node / rect getter, used to point out a mistake and its fix
     *  (inside: put the label inside the box, e.g. when the space above it holds other content) */
    issue(target, label, ok, inside) {
      this.issueTarget = target || null;
      this.issueInside = !!inside;
      if (target) { $('#ovIssueTag').textContent = label || ''; $('#ovIssue').classList.toggle('ok', !!ok); }
      this.refresh();
    },
    /** apply a state change in the same frame (avoids one stale frame in the recording) */
    refresh() { if (Editor.canvasRect) this.update(); },
    select(el, o = {}) {
      this.selEl = el;
      this.selOpts = o;
      if (el) { $('#ovTag').textContent = o.label || 'Box'; $('#ovSel').classList.toggle('cms', !!o.cms); }
      this.refresh();
    },
    drop(rect) { this.dropRect = rect; },
    place(box, r, minH = 0) {
      const c = Editor.canvasRect;
      box.classList.add('show');
      box.style.transform = `translate(${(r.left - c.left).toFixed(1)}px, ${(r.top - c.top).toFixed(1)}px)`;
      box.style.width = Math.max(2, r.width).toFixed(1) + 'px';
      box.style.height = Math.max(minH, r.height).toFixed(1) + 'px';
    },
    update() {
      const hov = $('#ovHover'), sel = $('#ovSel'), drop = $('#ovDrop');
      const ok = (el) => el && el.isConnected && !el.closest('[data-demo-hidden]');
      if (ok(this.hoverEl) && this.hoverEl !== this.selEl) this.place(hov, Site.rect(this.hoverEl)); else hov.classList.remove('show');
      if (ok(this.selEl)) {
        const r = Site.rect(this.selEl);
        this.place(sel, r, 16);
        const s = Editor.s;
        $('#ovSize').textContent = `${Math.round(r.width / s)} × ${Math.round(r.height / s)}`;
        const c = Editor.canvasRect;
        // tag above the box unless there is no room; size badge below the box unless it would leave the canvas
        sel.classList.toggle('inside', r.top - c.top < 26);
        sel.classList.toggle('size-in', r.top + r.height + 30 > c.top + c.height);
        // an element that is still empty (text before typing) shows no "0 × 0" badge
        sel.classList.toggle('nosize', r.width < 3 || r.height < 3);
        // keep the size badge from piling up under the shortcut keycap
        const kc = $('#keycap');
        let under = false;
        if (kc.classList.contains('show')) {
          const a = $('#ovSize').getBoundingClientRect(), b = kc.getBoundingClientRect();
          under = a.right > b.left - 8 && a.left < b.right + 8 && a.bottom > b.top - 8 && a.top < b.bottom + 8;
        }
        sel.classList.toggle('kc-under', under);
      } else sel.classList.remove('show');
      if (this.dropRect) this.place(drop, this.dropRect, 12); else drop.classList.remove('show');
      const iss = $('#ovIssue');
      const t = this.issueTarget;
      const ir = typeof t === 'function' ? t() : ok(t) ? Site.rect(t) : null;
      if (ir) {
        const pad = 7;
        this.place(iss, { left: ir.left - pad, top: ir.top - pad, width: ir.width + pad * 2, height: ir.height + pad * 2 }, 20);
        iss.classList.toggle('inside', this.issueInside || ir.top - pad - Editor.canvasRect.top < 36);
      } else iss.classList.remove('show');
      // mirror for tools/check-pointer.js (an issue frame that is up but cannot be drawn)
      const mirror = $('#issueBox');
      if (mirror) { mirror.style.visibility = t && !ir ? 'hidden' : ''; $('#issueLbl').textContent = $('#ovIssueTag').textContent; }
    },
  };

  /* ----------------------------------------------------------------- editor */
  const Editor = {
    W: 1280, s: 1, scroll: 0, H: 800, ch: 800, frameTop: 64, canvasRect: null,
    init() {
      this.canvas = $('#canvas');
      this.inner = $('#canvasInner');
      this.wrap = $('#frameWrap');
      this.frame = $('#frame');
      this.iframe = $('#siteFrame');
      afterFns.push(() => this.sync());
    },
    sync() {
      const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
      this.ch = ch;
      this.canvasRect = this.canvas.getBoundingClientRect();
      this.s = Math.min(1, (cw - 96) / 1280);
      const doc = Site.doc;
      if (doc) {
        const sc = doc.querySelector('.StudioCanvas');
        const h = sc ? sc.offsetHeight : 800;
        if (h > 0) this.H = h;
      }
      const s = this.s, W = this.W, H = this.H;
      this.iframe.style.width = W + 'px';
      this.iframe.style.height = H + 'px';
      this.iframe.style.transform = `scale(${s})`;
      this.frame.style.width = W * s + 'px';
      this.frame.style.height = H * s + 'px';
      this.wrap.style.width = W * s + 'px';
      this.wrap.style.left = (cw - W * s) / 2 + 'px';
      this.wrap.style.top = this.frameTop + 'px';
      // a scroll may run past the current page end to make room for an element that is about to be dropped there;
      // allow that position until the page has grown (otherwise the eased scroll would stop dead half-way)
      const max = this.maxScroll();
      if (this.scrollRoom && max >= this.scrollRoom) this.scrollRoom = 0;
      this.scroll = clamp(this.scroll, 0, Math.max(max, this.scrollRoom || 0));
      this.inner.style.transform = `translateY(${-this.scroll}px)`;
      $('#zoomLabel').textContent = Math.round(s * 100) + '%';
      $('#bpWidth').textContent = Math.round(W);
      $('#frameSize').textContent = Math.round(W) + ' × ' + Math.round(H);
      // HUD pieces stay centred on the canvas, also when the window is resized during a take
      const cx = this.canvasRect.left + this.canvasRect.width / 2 + 'px';
      for (const id of ['keystrip', 'toast', 'keycap']) { const h = document.getElementById(id); if (h && h.style.left !== cx) h.style.left = cx; }
      Overlay.update();
    },
    maxScroll() { return Math.max(0, this.frameTop + this.H * this.s + this.ch * 0.55 - this.ch); },
    scrollRoom: 0,
    async scrollTo(y, ms) {
      const from = this.scroll;
      const to = Math.max(0, y);
      // the room also covers where the scroll starts, so starting a new scroll never snaps the canvas back first
      const room = Math.max(to, from);
      this.scrollRoom = room > this.maxScroll() ? room : 0;
      const d = Math.abs(to - from);
      if (!(d >= 1)) return;
      await tween(ms != null ? ms : clamp(400 + d * 0.5, 500, 1400), (e) => { this.scroll = from + (to - from) * e; }, Ease.inOut);
    },
    async scrollBy(dy, ms) { return this.scrollTo(this.scroll + dy, ms); },
    /** scroll the canvas so that a viewport rect is comfortably visible */
    async ensureVisible(r, o = {}) {
      const c = this.canvas.getBoundingClientRect();
      const top = r.top - c.top, bottom = top + r.height;
      const minTop = o.minTop != null ? o.minTop : 70;
      const maxBottom = c.height - (o.bottomPad != null ? o.bottomPad : 110);
      let delta = 0;
      if (r.height > maxBottom - minTop || top < minTop) delta = top - minTop - (o.extra || 0);
      else if (bottom > maxBottom) delta = bottom - maxBottom + (o.extra || 30);
      if (Math.abs(delta) > 2) await this.scrollTo(this.scroll + delta, o.ms);
    },
    bp: 'pc',
    async setBreakpoint(name) {
      const W = { pc: 1280, tablet: 768, mobile: 375 }[name];
      this.bp = name;
      $$('.bp-btn').forEach((b) => b.classList.toggle('active', b.id === 'bp-' + name));
      // switch through a quick fade: sweeping the width would lay the page out at in-between widths it was never
      // designed for (characters stacking one per line, clipped headings) for a few frames
      await tween(170, (e) => { this.frame.style.opacity = String(1 - e); }, Ease.linear);
      // switch with the site's own CSS transitions off, so the new layout is final in the first frame
      const root = Site.doc.documentElement;
      root.classList.add('demo-bp-switch');
      this.W = W;
      this.sync();
      void this.iframe.offsetWidth; // parent layout: the iframe gets its new width (media queries switch)
      void Site.doc.body.offsetHeight; // canvas document restyled at that width without transitions
      root.classList.remove('demo-bp-switch');
      this.sync();
      await wait(90);
      await tween(300, (e) => { this.frame.style.opacity = String(e); }, Ease.out);
      this.frame.style.opacity = '';
    },
  };

  /* ----------------------------------------------------------------- layers */
  const Layers = {
    list: null, rows: [], byEl: new Map(),
    init() {
      this.list = $('#layerList');
      this.page = this.add(null, { name: 'Home', type: 'page' });
    },
    add(el, o = {}) {
      const parent = o.parent ? this.byEl.get(o.parent) : this.page;
      const depth = parent ? parent.depth + 1 : 0;
      const row = document.createElement('div');
      row.className = 'ly-row' + (o.type === 'page' ? ' page' : '') + (o.cms ? ' cms' : '');
      row.style.setProperty('--d', depth);
      const ic = { page: 'file', box: 'square', text: 'type', image: 'image', link: 'link', form: 'form', embed: 'code', cms: 'database', button: 'button' }[o.type || 'box'];
      row.innerHTML = `${icon('chevron-down', 'ly-caret empty')}${icon(ic, 'ly-ic')}<span>${esc(o.name || 'Box')}</span>`;
      const rec = { el, row, depth, parent, collapsed: false, children: [] };
      // insert after the parent's last descendant
      let anchor = parent;
      while (anchor && anchor.children.length) anchor = anchor.children[anchor.children.length - 1];
      if (anchor) anchor.row.after(row); else this.list.appendChild(row);
      if (parent) {
        parent.children.push(rec);
        parent.row.querySelector('.ly-caret').classList.remove('empty');
        if (parent.collapsed) this.expand(parent.el);
      }
      this.rows.push(rec);
      if (el) this.byEl.set(el, rec);
      return rec;
    },
    rename(el, name) { const r = this.byEl.get(el); if (r) r.row.querySelector('span').textContent = name; },
    remove(el) {
      const rec = this.byEl.get(el);
      if (!rec) return;
      [rec, ...this.descendants(rec)].forEach((d) => {
        d.row.remove();
        if (d.el) this.byEl.delete(d.el);
        const k = this.rows.indexOf(d);
        if (k >= 0) this.rows.splice(k, 1);
      });
      if (rec.parent) {
        rec.parent.children = rec.parent.children.filter((c) => c !== rec);
        if (!rec.parent.children.length) rec.parent.row.querySelector('.ly-caret').classList.add('empty');
      }
    },
    select(el) {
      this.rows.forEach((r) => r.row.classList.toggle('selected', !!el && r.el === el));
      const r = el && this.byEl.get(el);
      if (r) this.reveal(r.row);
    },
    reveal(row) {
      const L = this.list;
      const target = clamp(row.offsetTop - L.clientHeight * 0.55, 0, Math.max(0, L.scrollHeight - L.clientHeight));
      const from = L.scrollTop;
      if (Math.abs(target - from) > 4) tween(350, (e) => { L.scrollTop = from + (target - from) * e; });
    },
    descendants(rec) { const out = []; const walk = (r) => r.children.forEach((c) => { out.push(c); walk(c); }); walk(rec); return out; },
    collapse(el) {
      const rec = this.byEl.get(el);
      if (!rec) return;
      rec.collapsed = true;
      rec.row.classList.add('collapsed');
      this.descendants(rec).forEach((d) => {
        d.row.classList.add('hidden-row');
        // nested groups fold too, so expanding the parent later shows them closed (caret ▸), like their hidden children
        if (d.children.length) { d.collapsed = true; d.row.classList.add('collapsed'); }
      });
    },
    expand(el) {
      const rec = this.byEl.get(el);
      if (!rec) return;
      rec.collapsed = false;
      rec.row.classList.remove('collapsed');
      rec.children.forEach((c) => c.row.classList.remove('hidden-row'));
    },
  };

  /* ------------------------------------------------------------- properties */
  const fld = (k, v, u, attrs = '') => `<div class="fld" ${attrs}>${k ? `<span class="k">${k}</span>` : ''}<span class="v">${v}</span>${u ? `<span class="u">${u}</span>` : ''}</div>`;
  const prow = (...items) => `<div class="rp-row">${items.join('')}</div>`;
  const lrow = (label, ...items) => `<div class="rp-row"><span class="rp-lbl">${label}</span>${items.join('')}</div>`;
  const sec = (title, body, ic = 'plus') => `<div class="rp-sec"><div class="rp-sec-title"><span>${title}</span>${ic ? icon(ic) : ''}</div>${body}</div>`;
  function fmtLen(v) {
    if (v == null || v === '') return ['Auto', ''];
    v = String(v).trim();
    // STUDIO writes gap-aware sizes like calc(33.33% - (var(--gap-h-…) * 0.67)); its own size field shows just
    // the percentage (the gap is a separate setting), so drop the gap term
    v = v.replace(/\s*-\s*\(var\(--gap-[hv]-[0-9a-z-]+\)\s*\*\s*[\d.]+\)/gi, '');
    const simple = v.match(/^calc\(\s*(-?[\d.]+(?:px|%))\s*\)$/);
    if (simple) v = simple[1];
    if (v === 'auto') return ['Auto', ''];
    if (/demo-vh/.test(v)) { const n = v.match(/calc\(([\d.]+)/); return [n ? n[1] : '100', 'vh']; }
    const m = v.match(/^(-?[\d.]+)(px|%|em|rem|vw|vh)?$/);
    if (m) return [String(Math.round(parseFloat(m[1]) * 100) / 100), m[2] || ''];
    // STUDIO writes "fill minus margin" sizes as calc(100% - 80px): show the expression itself
    // (a negative margin gives calc(100% - -2px), which reads as 100% + 2px)
    const c = v.match(/^calc\((.*)\)$/);
    if (c) return [c[1].replace(/\s+/g, ' ').replace(/-\s*-\s*(?=[\d.])/g, '+ ').replace(/(\d+\.\d{2})\d+/g, '$1'), ''];
    return [v, ''];
  }
  /** corner radius: one number, or the four corners when they differ (the unit is shown once, after the field) */
  function fmtRadius(v) {
    const p = String(v || '0').trim().split(/\s+/).map((x) => String(Math.round((parseFloat(x) || 0) * 100) / 100));
    return p.every((x) => x === p[0]) ? p[0] : p.slice(0, 4).join(' ');
  }
  function box4(v) {
    const p = String(v || '0').trim().split(/\s+/).map((x) => (x === '0' ? '0' : String(parseFloat(x) || 0)));
    if (p.length === 1) return [p[0], p[0], p[0], p[0]];
    if (p.length === 2) return [p[0], p[1], p[0], p[1]];
    if (p.length === 3) return [p[0], p[1], p[2], p[1]];
    return p.slice(0, 4);
  }
  const WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
  const TYPE_LABEL = { box: 'ボックス', text: 'テキスト', image: '画像', link: 'リンク', form: 'フォーム', embed: '埋め込み', cms: 'CMSリスト', button: 'ボタン' };

  const Props = {
    root: null, cur: null, ov: {},
    init() { this.root = $('#props'); this.show(null); },
    show(target) { this.cur = target; this.ov = (target && target.ov) || {}; this.render(false); },
    set(k, v) { this.ov[k] = v; this.render(true, k); },
    clear(k) { delete this.ov[k]; this.render(true, k); },
    extra: {},
    render(soft, changedKey) {
      this.root.classList.toggle('soft', !!soft);
      const t = this.cur;
      let html = '';
      if (!t || !t.el) html = this.pageHtml();
      else html = this.elHtml(t);
      this.root.innerHTML = html;
      if (soft) $$('.rp-sec', this.root).forEach((s) => (s.style.animation = 'none'));
      if (changedKey) { const f = $(`[data-k="${changedKey}"]`, this.root); if (f) f.classList.add('changed'); }
    },
    pageHtml() {
      return `<div class="rp-head">${icon('file')}<span class="rp-name">Home</span><span class="pill pill-blue">ページ</span></div>
        <div class="rp-tabs"><span class="on">ページ設定</span><span>SEO</span></div>` +
        sec('基本設定', `
          <div class="rp-kv"><span>タイトル</span><b>ワイエス建装</b></div>
          <div class="rp-kv"><span>URL</span><b>/</b></div>
          <div class="rp-kv"><span>言語</span><b>ja</b></div>`, '') +
        sec('ディスクリプション', `<div class="rp-note">創業五十年、鹿児島県鹿児島市の建装会社。住宅建築とインテリアデザインで、今日も、この街とともに。</div>`, '') +
        sec('OGP画像', `<div class="rp-ogp" style="background-image:url(assets/img/ogp.webp)"></div>`, '') +
        sec('ブレイクポイント', `
          <div class="rp-kv"><span>PC</span><b>1280px〜</b></div>
          <div class="rp-kv"><span>タブレット</span><b>〜840px</b></div>
          <div class="rp-kv"><span>モバイル</span><b>〜540px</b></div>`, '');
    },
    elHtml(t) {
      const el = t.el;
      const bp = Editor.bp;
      const decls = Studio.decls(el, bp);
      const bpKeys = Studio.bpKeys(el, bp);
      const ov = this.ov;
      const d = (k) => (k in ov ? ov[k] : decls[k]);
      const cs = Site.win.getComputedStyle(el);
      const type = t.type || 'box';
      const bpChip = bp !== 'pc' ? `<span class="bp-chip">${bp === 'mobile' ? 'モバイル' : 'タブレット'}</span>` : '';
      let h = `<div class="rp-head">${icon({ text: 'type', image: 'image', link: 'link', form: 'form', embed: 'code', cms: 'database', button: 'button' }[type] || 'square')}
        <span class="rp-name">${esc(t.name || 'Box')}</span>${bpChip}${t.cms ? '<span class="pill" style="background:var(--cms-soft);color:var(--cms)">CMS</span>' : `<span class="pill pill-blue">${TYPE_LABEL[type] || 'ボックス'}</span>`}</div>
        <div class="rp-tabs"><span class="on">スタイル</span><span>アニメーション</span><span>リンク</span></div>`;

      if (type === 'cms') {
        h += sec('CMS', `
          <div class="rp-kv"><span>コレクション</span><b><span class="bind">${icon('database')}お知らせ</span></b></div>
          <div class="rp-kv"><span>表示件数</span><b>3</b></div>
          <div class="rp-kv"><span>並び順</span><b>公開日（新しい順）</b></div>
          <div class="rp-kv"><span>リンク先</span><b>GvtQcmfy/:slug</b></div>`, '');
      }
      if (type === 'form') {
        h += sec('フォーム', `
          <div class="rp-kv"><span>フォーム名</span><b>お問い合わせフォーム</b></div>
          <div class="rp-kv"><span>項目数</span><b>6</b></div>
          <div class="rp-kv"><span>送信後</span><b>モーダル：thanks</b></div>`, '');
      }
      if (type === 'text') h += this.textSec(el, decls, ov, cs);
      if (type === 'image') h += this.imageSec(el);
      if (type === 'embed') {
        const code = this.extra.embedCode, err = this.extra.embedError;
        h += sec('埋め込みコード', (code
          ? `<div class="rp-code${err ? ' error' : ''}" id="pp-embed">${code}</div>`
          : `<div class="rp-code empty" id="pp-embed">HTMLコードを貼り付け</div>`) +
          (err ? `<div class="rp-err">${icon('alert')}<span>${err}</span></div>` : ''), '');
      }
      if (type === 'link' || type === 'button') {
        const href = el.getAttribute('href') || (el.querySelector('a') && el.querySelector('a').getAttribute('href')) || '';
        h += sec('リンク', lrow('URL', fld('', esc(this.extra.linkLabel || href || '未設定'), '', 'id="pp-link" data-k="href"')), '');
      }
      if (/flex/.test(cs.display) && type !== 'text') h += this.layoutSec(d);
      h += this.sizeSec(d, el, bpKeys);
      h += this.spacingSec(d);
      if (type !== 'text' && type !== 'embed') {
        const bg = colorInfo(d('background') || d('background-color'));
        h += sec('塗り', prow(`<div class="fld" id="pp-fill" data-k="background"><span class="sw ${bg.none ? 'none' : ''}" style="background:${bg.none ? '' : bg.css}"></span><span class="v">${esc(bg.name)}</span><span class="u">${bg.hex}</span></div>`) +
          lrow('角丸', fld('', fmtRadius(d('border-radius')), 'px')));
      }
      const pos = d('position') || cs.position;
      h += sec('位置', prow(`<div class="icon-seg" style="flex:1"><span class="${pos !== 'absolute' && pos !== 'fixed' ? 'on' : ''}" style="flex:1;width:auto">相対</span><span class="${pos === 'absolute' ? 'on' : ''}" style="flex:1;width:auto">絶対</span><span class="${pos === 'fixed' ? 'on' : ''}" style="flex:1;width:auto">固定</span></div>`), '');
      return h;
    },
    textSec(el, decls, ov, cs) {
      const fam = 'font-family' in ov ? fontInfo(ov['font-family']) : fontInfo(decls['font-family'] || cs.fontFamily);
      const size = fmtLen(decls['font-size'] || cs.fontSize)[0];
      const weight = WEIGHTS[parseInt(decls['font-weight'] || cs.fontWeight, 10)] || 'Regular';
      const lh = decls['line-height'] || '1.4';
      const ls = decls['letter-spacing'] || '0';
      const align = decls['text-align'] || 'left';
      const wm = 'writing-mode' in ov ? ov['writing-mode'] : cs.writingMode;
      const vertical = /vertical/.test(wm);
      const col = colorInfo('color' in ov ? ov.color : (decls.color || cs.color));
      return sec('テキスト',
        prow(`<div class="fld" id="pp-font" data-k="font-family"><span class="v" style="font-family:'${esc(fam)}';font-size:12.5px">${esc(fam)}</span>${icon('chevron-down')}</div>`) +
        prow(fld('', weight, ''), fld('', size, 'px')) +
        prow(fld('LH', esc(lh), ''), fld('LS', esc(ls), '')) +
        prow(`<div class="icon-seg"><span class="${align === 'left' ? 'on' : ''}">${icon('align-left')}</span><span class="${align === 'center' ? 'on' : ''}">${icon('align-center')}</span><span class="${align === 'right' ? 'on' : ''}">${icon('align-right')}</span></div>`,
          `<div class="icon-seg" id="pp-wm" style="margin-left:auto"><span class="${!vertical ? 'on' : ''}">${icon('text-h')}</span><span class="${vertical ? 'on' : ''}">${icon('text-v')}</span></div>`) +
        prow(`<div class="fld" id="pp-color" data-k="color"><span class="sw" style="background:${col.css}"></span><span class="v">${esc(col.name)}</span><span class="u">${col.hex}</span></div>`), '');
    },
    imageSec(el) {
      const has = Site.hasImg(el) || el.hasAttribute('data-demo-bg');
      let url = '';
      if (has) url = el.hasAttribute('data-demo-bg') ? (el.style.getPropertyValue('--demo-bg').match(/url\("?(.*?)"?\)/) || [])[1] : Site.imageUrl(el);
      return sec('画像',
        `<div class="rp-thumb" id="pp-img" style="${url ? `background-image:url('${url}')` : ''}">${url ? '' : icon('image')}</div>` +
        `<div class="rp-btn">${icon('upload')}${url ? '画像を変更' : '画像を選択'}</div>` +
        lrow('フィット', fld('', 'カバー', '')) + lrow('代替テキスト', fld('', '—', '')), '');
    },
    layoutSec(d) {
      const dir = d('flex-direction') || 'column';
      const pos = (v) => (v === 'center' ? 1 : v === 'flex-end' || v === 'end' ? 2 : v === 'space-between' ? 1 : 0);
      const jc = d('justify-content') || 'flex-start', ai = d('align-items') || 'center';
      let r, c;
      if (dir === 'row') { c = pos(jc); r = pos(ai); } else { r = pos(jc); c = pos(ai); }
      let cells = '';
      for (let i = 0; i < 9; i++) cells += `<i class="${i === r * 3 + c ? 'on' : ''}"></i>`;
      const gap = fmtLen(d('gap') || '0px')[0];
      return sec('レイアウト', `<div class="rp-row" style="gap:10px;align-items:flex-start">
        <div class="align-grid ${dir === 'row' ? '' : 'col'}">${cells}</div>
        <div style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0">
          <div class="icon-seg"><span class="${dir === 'column' ? 'on' : ''}">${icon('arrow-down')}</span><span class="${dir === 'row' ? 'on' : ''}">${icon('arrow-right')}</span><span class="${d('flex-wrap') === 'wrap' ? 'on' : ''}">${icon('wrap')}</span></div>
          ${fld('G', gap, 'px')}
        </div></div>`);
    },
    sizeSec(d, el, bpKeys = new Set()) {
      const w = fmtLen(d('width')), h = fmtLen(d('height'));
      const mwRaw = d('max-width');
      const mw = mwRaw === 'none' ? 'なし' : fmtLen(mwRaw || 'auto').join('');
      // fields carry ids (for scripted editing) and an orange dot when the value is specific to the current breakpoint
      const f = (k, v, u, id, prop) =>
        `<div class="fld" id="${id}" data-k="${prop}">${bpKeys.has(prop) ? '<span class="bp-dot"></span>' : ''}<span class="k">${k}</span><span class="v">${v}</span>${u ? `<span class="u">${u}</span>` : ''}</div>`;
      return sec('サイズ', prow(f('W', w[0], w[1], 'pp-w', 'width'), f('H', h[0], h[1], 'pp-h', 'height')) +
        prow(f('最大幅', mw, '', 'pp-maxw', 'max-width'), fld('最小幅', 'Auto', '')), '');
    },
    spacingSec(d) {
      const m = box4(d('margin')), p = box4(d('padding'));
      return sec('余白', `<div class="spacing"><span class="cap">MARGIN</span>
        <span style="left:50%;top:14px">${m[0]}</span><span style="left:calc(100% - 18px);top:50%">${m[1]}</span>
        <span style="left:50%;top:calc(100% - 14px)">${m[2]}</span><span style="left:18px;top:50%">${m[3]}</span>
        <div class="inner"><span class="cap">PADDING</span>
          <span style="left:50%;top:10px">${p[0]}</span><span style="left:calc(100% - 16px);top:50%">${p[1]}</span>
          <span style="left:50%;top:calc(100% - 10px)">${p[2]}</span><span style="left:16px;top:50%">${p[3]}</span>
        </div></div>`, '');
    },
  };

  /* --------------------------------------------------------------- popover */
  const Pop = {
    el: null,
    init() { this.el = $('#popover'); },
    open(anchor, html) {
      this.el.innerHTML = html;
      const a = anchor.getBoundingClientRect();
      const pw = 236;
      this.el.style.left = Math.max(8, a.left - pw - 14) + 'px';
      this.el.classList.add('show');
      const ph = this.el.offsetHeight;
      this.el.style.top = clamp(a.top - 40, 60, innerHeight - ph - 12) + 'px';
    },
    close() { this.el.classList.remove('show'); },
    palette(anchor, currentKey) {
      const items = Object.entries(COLORS).map(([k, [name, css, hex]]) =>
        `<div class="pop-item ${k === currentKey ? 'on' : ''}" data-color="${k}"><span class="sw" style="background:${css}"></span>${name}<small>${hex}</small></div>`).join('');
      this.open(anchor, `<div class="pop-title">プロジェクトカラー</div>${items}`);
    },
    fonts(anchor, current) {
      const items = FONT_LIST.map(([f, tag]) =>
        `<div class="pop-item font ${f === current ? 'on' : ''}" data-font="${esc(f)}" style="font-family:'${esc(f)}'">${esc(f)}${tag ? `<small>${tag}</small>` : ''}</div>`).join('');
      this.open(anchor, `<div class="pop-title">プロジェクトフォント</div>${items}`);
    },
  };

  /* ----------------------------------------------------------------- panels */
  const Panels = {
    current: 'layers',
    async open(tab, viaCursor = true) {
      if (this.current === tab) return;
      const btn = $(`.rail-btn[data-tab="${tab}"]`);
      if (viaCursor) await clickUi(btn);
      $$('.rail-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
      $$('.lp').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab));
      this.current = tab;
      await wait(220);
    },
  };

  /* ------------------------------------------------------ small HUD things */
  const Caption = {
    set(step, text) {
      const c = $('#caption');
      c.classList.remove('issue', 'fixed');
      $('#capStep').textContent = step ? 'STEP ' + step : '';
      $('#capText').textContent = text;
      c.classList.add('show');
    },
    /** a mistake happened: red chip with its kind (入力ミス / 操作ミス / エラー / 表示崩れ) */
    issue(kind, text) {
      const c = $('#caption');
      c.classList.remove('fixed');
      c.classList.add('issue', 'show');
      $('#capStep').textContent = '⚠ ' + kind;
      $('#capText').textContent = text;
    },
    /** the mistake was corrected: green chip */
    fixed(text) {
      const c = $('#caption');
      c.classList.remove('issue');
      c.classList.add('fixed', 'show');
      $('#capStep').textContent = '✓ 修正';
      $('#capText').textContent = text;
    },
    hide() { $('#caption').classList.remove('show'); },
  };
  /** markers around the canvas node that shows a mistake, turning green once it is fixed */
  const Issue = {
    get target() { return Overlay.issueTarget; },
    show(target, label, o = {}) { Overlay.issue(target, '⚠ ' + label, false, o.inside); },
    ok(target, label, o = {}) { Overlay.issue(target, '✓ ' + label, true, o.inside); },
    hide() { Overlay.issue(null); },
  };
  /** editor notification at the top of the canvas */
  const Toast = {
    token: 0,
    show(kind, text, hold = 2400) {
      const t = $('#toast');
      t.className = 'toast show ' + (kind || '');
      $('#toastIc').innerHTML = icon(kind === 'error' ? 'alert' : kind === 'success' ? 'check' : 'undo');
      $('#toastText').textContent = text;
      const c = Editor.canvas.getBoundingClientRect();
      t.style.left = c.left + c.width / 2 + 'px';
      t.style.top = c.top + 16 + 'px';
      const tk = ++this.token;
      wait(hold).then(() => { if (tk === this.token) t.classList.remove('show'); });
    },
  };
  /** Windows clipboard history (Win + V) */
  const Clip = {
    open(anchor, entries) {
      $('#clipList').innerHTML = entries.map((x, i) => `<div class="clip-item" data-clip="${i}">${esc(x)}</div>`).join('');
      const el = $('#clip');
      el.classList.add('show');
      const a = anchor.getBoundingClientRect();
      el.style.left = clamp(a.left - el.offsetWidth - 16, 8, innerWidth - el.offsetWidth - 8) + 'px';
      el.style.top = clamp(a.top - 24, 60, innerHeight - el.offsetHeight - 12) + 'px';
    },
    close() { $('#clip').classList.remove('show'); },
  };
  const Keycap = {
    token: 0,
    async show(keys, hold = 900) {
      const k = $('#keycap');
      k.innerHTML = keys.map((x) => `<kbd>${esc(x)}</kbd>`).join('<span class="plus">+</span>');
      const c = Editor.canvas.getBoundingClientRect();
      k.style.left = c.left + c.width / 2 + 'px';
      k.classList.add('show');
      const tk = ++this.token;
      wait(hold).then(() => { if (tk === this.token) k.classList.remove('show'); });
      await wait(260);
    },
  };
  const Ghost = {
    el: null,
    init() { this.el = $('#ghost'); },
    show(html, cls = '') { this.el.className = 'drag-ghost show ' + cls; this.el.innerHTML = html; },
    move(x, y) { this.el.style.transform = `translate(${x + 14}px, ${y + 16}px)`; },
    hide() { this.el.className = 'drag-ghost'; },
  };

  /* ---------------------------------------------------------- Japanese IME */
  // Romaji -> hiragana, the way Microsoft IME reacts key by key.
  const KANA = {
    a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
    ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ', ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
    sa: 'さ', si: 'し', shi: 'し', su: 'す', se: 'せ', so: 'そ', za: 'ざ', zi: 'じ', ji: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
    ta: 'た', ti: 'ち', chi: 'ち', tu: 'つ', tsu: 'つ', te: 'て', to: 'と', da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
    na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の', ha: 'は', hi: 'ひ', hu: 'ふ', fu: 'ふ', he: 'へ', ho: 'ほ',
    ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ', pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
    ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も', ya: 'や', yu: 'ゆ', yo: 'よ',
    ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ', wa: 'わ', wo: 'を', nn: 'ん', "n'": 'ん',
    kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ', gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
    sha: 'しゃ', shu: 'しゅ', sho: 'しょ', she: 'しぇ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
    ja: 'じゃ', ju: 'じゅ', jo: 'じょ', je: 'じぇ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',
    cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', che: 'ちぇ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
    nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ', hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ', bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
    pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ', mya: 'みゃ', myu: 'みゅ', myo: 'みょ', rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
    fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', xtu: 'っ', ltu: 'っ', xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ',
  };
  const KANA_PUNCT = { ',': '、', '.': '。', '-': 'ー', '/': '・', '[': '「', ']': '」', '~': '〜', '!': '！', '?': '？' };
  const KANA_PREFIX = new Set();
  Object.keys(KANA).forEach((k) => { for (let i = 1; i <= k.length; i++) KANA_PREFIX.add(k.slice(0, i)); });
  /** romaji buffer -> { kana, rest } where rest is the romaji still being typed (shown as-is, like the IME) */
  function romajiToKana(buf) {
    let out = '', i = 0;
    while (i < buf.length) {
      const c = buf[i], nx = buf[i + 1];
      if (KANA_PUNCT[c]) { out += KANA_PUNCT[c]; i++; continue; }
      if (c === 'n' && nx !== undefined && nx !== 'n' && !/[aiueoy']/.test(nx)) { out += 'ん'; i++; continue; }
      if (nx !== undefined && c === nx && /[bcdfghjklmpqrstvwxz]/.test(c)) { out += 'っ'; i++; continue; }
      let hit = 0;
      for (let L = 3; L >= 1; L--) {
        const s = buf.substr(i, L);
        if (s.length === L && KANA[s]) { out += KANA[s]; hit = L; break; }
      }
      if (hit) { i += hit; continue; }
      if (KANA_PREFIX.has(buf.slice(i))) break; // still being typed
      out += c; // not romaji at all: the IME keeps the letter
      i++;
    }
    return { kana: out, rest: buf.slice(i) };
  }

  /** the keys being pressed (romaji letters, then special keys) + the IME mode indicator あ / A */
  const KeyStrip = {
    typed: '', keys: [], token: 0,
    show() {
      const ks = $('#keystrip');
      const c = Editor.canvas.getBoundingClientRect();
      ks.style.left = c.left + c.width / 2 + 'px';
      ks.classList.add('show');
      this.token++;
    },
    render() {
      const MAX = 44;
      const full = this.typed;
      const t = full.length > MAX ? full.slice(-MAX) : full;
      $('#ksKeys').innerHTML = (t ? `<span class="typed">${full.length > MAX ? '…' : ''}${esc(t.slice(0, -1))}<b>${esc(t.slice(-1))}</b></span>` : '') +
        this.keys.map((k) => `<kbd>${esc(k)}</kbd>`).join('');
    },
    mode(on) { const m = $('#ksMode'); m.textContent = on ? 'あ' : 'A'; m.classList.toggle('off', !on); },
    visible() { return $('#keystrip').classList.contains('show'); },
    /** a new input session (the strip was hidden): do not bring back keys typed for an earlier text */
    fresh() { if (!this.visible()) { this.typed = ''; this.keys = []; } },
    key(ch) {
      this.fresh();
      if (this.keys.length) { this.typed = ''; this.keys = []; }
      this.typed += ch;
      this.render();
      this.show();
    },
    special(label) {
      this.fresh();
      this.keys.push(label);
      if (this.keys.length > 7) this.keys.shift();
      this.render();
      this.show();
    },
    idleHide(ms = 1200) {
      const tk = this.token;
      wait(ms).then(() => { if (tk === this.token) $('#keystrip').classList.remove('show'); });
    },
  };

  /** IME state + the prediction / conversion candidate window */
  const Ime = {
    on: true,
    async setMode(on) {
      if (this.on === on) return;
      this.on = on;
      KeyStrip.special('半角/全角');
      KeyStrip.mode(on);
      await wait(260);
    },
    show(kind, items, sel, anchor, vertical) {
      const el = $('#ime');
      el.className = 'ime show ' + kind;
      el.innerHTML = items.map((x, i) => `<div class="ime-item${i === sel ? ' sel' : ''}"><span class="n">${i + 1}</span><span>${esc(x)}</span></div>`).join('') +
        (kind === 'predict'
          ? '<div class="ime-foot"><span>Tab キーで予測候補を選択</span></div>'
          : `<div class="ime-foot"><span>${sel + 1} / ${items.length}</span><span>Enter で確定</span></div>`);
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = vertical ? anchor.left + anchor.width + 12 : anchor.left - 6;
      let y = vertical ? anchor.top : anchor.top + anchor.height + 8;
      // like MS-IME, open above the text when there is no room below — here "below" ends at the key strip,
      // which must stay readable (it shows the keys and the あ/A mode)
      const ks = $('#keystrip');
      const bottom = KeyStrip.visible() ? innerHeight - parseFloat(getComputedStyle(ks).bottom) - ks.offsetHeight - 10 : innerHeight - 8;
      if (!vertical && y + h > bottom) y = anchor.top - h - 8;
      el.style.left = clamp(x, 8, innerWidth - w - 8) + 'px';
      el.style.top = clamp(y, 8, bottom - h) + 'px';
    },
    hide() { $('#ime').classList.remove('show'); },
  };

  const kw = (ms) => wait(ms); // keystroke-level pause (kept while seeking, so the timeline never changes)
  function plainOf(html) {
    const t = document.createElement('template');
    t.innerHTML = String(html).replace(/<br\s*\/?>/gi, '\n');
    return t.content.textContent;
  }
  /** layer + panel title of a text follow its committed text (first line), like the editor names text layers */
  function syncName(el, text) {
    const s = String(text || '').split('\n')[0].trim();
    if (!s) return;
    const n = s.length > 18 ? s.slice(0, 18) + '…' : s;
    Layers.rename(el, n);
    if (Props.cur && Props.cur.el === el && Props.cur.name !== n) {
      Props.cur.name = n;
      const h = $('.rp-name', Props.root);
      if (h) h.textContent = n;
    }
  }
  /** prediction hints still matching the reading typed so far (MS-IME narrows the list on every key and closes it when nothing matches) */
  function predictFor(s, kana) {
    if (!s.predict) return [];
    if (!s.yomi) return s.predict;
    return s.predict.filter((w, i) => s.yomi[i] && s.yomi[i].startsWith(kana));
  }
  const segOf = (x) => (typeof x === 'string' ? { c: [x], p: 0 } : { c: x.c, p: x.p || 0 });
  const chunkOut = (s) => (s.tab != null ? s.predict[s.tab] : s.segs.map((x) => { const g = segOf(x); return g.c[g.p]; }).join(''));
  /** the text a typing script produces — checked against the real text before it is played */
  function scriptText(script) {
    const a = [];
    for (const s of script) {
      if (s.r != null) a.push(...chunkOut(s));
      else if (s.direct != null) a.push(...s.direct);
      else if (s.key) {
        for (let i = 0; i < (s.n || 1); i++) {
          if (s.key === 'Backspace') a.pop();
          else if (s.key === 'Enter') a.push('\n');
          else if (s.key === 'Space') a.push('　');
          else if (s.key === 'Shift+Space') a.push(' ');
        }
      }
    }
    return a.join('');
  }

  /**
   * Types Japanese into a canvas text node like a person using Microsoft IME:
   * romaji key by key -> kana composition (dotted underline) with prediction hints ->
   * Space converts (candidate window from the 2nd Space) -> Enter commits.
   * Script steps: {r, segs|tab, predict, yomi} chunk, {direct}, {key, n}, {mark, ok}, {unmark}, {wait}, {call}.
   * The node always ends with its exact original markup.
   */
  async function typeJa(el, script, o = {}) {
    const target = Site.original(el);
    const want = plainOf(target), got = scriptText(script);
    if (want !== got) {
      console.warn('[demo] typing script does not match the text; using plain typing instead', { want, got });
      await Site.type(el, { cps: 14 });
      syncName(el, want);
      return;
    }
    const vertical = /vertical/.test(Site.win.getComputedStyle(el).writingMode);
    el.classList.toggle('demo-vertical', vertical);
    const toks = [];
    let markFrom = null, markOk = false, named = '';
    const committed = () => (markFrom == null ? toks.join('')
      : toks.slice(0, markFrom).join('') + `<span class="demo-mark${markOk ? ' ok' : ''}">${toks.slice(markFrom).join('')}</span>`);
    const render = (comp = '') => {
      el.innerHTML = `<span class="demo-typing-wrap">${committed()}${comp}<span class="demo-caret"></span></span>`;
      const now = plainOf(toks.join(''));
      if (now !== named) { named = now; syncName(el, now); }
    };
    const push = (str) => { for (const ch of str) toks.push(ch === '\n' ? '<br>' : esc(ch)); };
    const rectOf = (sel) => Site.rect(el.querySelector(sel) || el);
    const gap = () => (1000 / (o.kps || 12)) * (0.55 + Math.random() * 0.9);

    async function chunk(s) {
      await Ime.setMode(true);
      let buf = '', hinted = false;
      for (const ch of s.r) {
        buf += ch;
        KeyStrip.key(ch);
        const { kana, rest } = romajiToKana(buf);
        render(`<span class="demo-ime">${esc(kana + rest)}</span>`);
        const vis = [...kana].length >= (s.predictAt || 2) ? predictFor(s, kana) : [];
        if (vis.length) { Ime.show('predict', vis, -1, rectOf('.demo-ime'), vertical); hinted = true; }
        else if (hinted) { Ime.hide(); hinted = false; }
        await kw(gap());
      }
      await kw(s.think != null ? s.think : 220);
      if (s.tab != null) {
        // pick the suggestion from the prediction list (Tab), then commit
        const pick = s.predict[s.tab];
        let list = predictFor(s, romajiToKana(s.r).kana);
        if (list.indexOf(pick) < 0) list = s.predict;
        for (let t = 0; t <= list.indexOf(pick); t++) {
          KeyStrip.special('Tab');
          render(`<span class="demo-ime conv active">${esc(list[t])}</span>`);
          Ime.show('predict', list, t, rectOf('.demo-ime'), vertical);
          await kw(420);
        }
        KeyStrip.special('Enter');
        Ime.hide();
        push(pick);
        render();
        await kw(260);
        return;
      }
      if (hinted) Ime.hide();
      const segs = s.segs.map(segOf);
      const choice = segs.map(() => 0);
      let active = 0;
      const conv = () => segs.map((g, i) => `<span class="demo-ime conv${i === active ? ' active' : ''}">${esc(g.c[choice[i]])}</span>`).join('');
      KeyStrip.special('Space');
      render(conv());
      await kw(440);
      for (let i = 0; i < segs.length; i++) {
        if (!segs[i].p) continue;
        while (active < i) { active++; KeyStrip.special('→'); render(conv()); await kw(260); }
        for (let k = 1; k <= segs[i].p; k++) {
          KeyStrip.special('Space');
          choice[i] = k;
          render(conv());
          Ime.show('cand', segs[i].c, k, rectOf('.demo-ime.active'), vertical);
          await kw(k === 1 ? 600 : 400);
        }
        await kw(s.candHold != null ? s.candHold : 280); // candHold: keep an important pick on screen longer
      }
      KeyStrip.special('Enter');
      Ime.hide();
      push(segs.map((g, i) => g.c[choice[i]]).join(''));
      render();
      await kw(260);
    }

    // selected text stays highlighted until the first key replaces it
    if (!el.querySelector('.demo-selected-text')) render();
    for (const s of script) {
      if (s.call) { await s.call(el); continue; }
      if (s.wait) { await kw(s.wait); continue; }
      if (s.mark != null) { markFrom = Math.max(0, toks.length - s.mark); markOk = !!s.ok; render(); continue; }
      if (s.unmark) { markFrom = null; render(); continue; }
      if (s.direct != null) {
        await Ime.setMode(false);
        for (const ch of s.direct) { KeyStrip.key(ch); push(ch); render(); await kw(gap() * 1.15); }
        continue;
      }
      if (s.key) {
        if (s.key === 'Space') await Ime.setMode(true); // a full-width space needs Japanese input on
        for (let i = 0; i < (s.n || 1); i++) {
          if (s.key === 'Backspace') { toks.pop(); if (markFrom != null && markFrom >= toks.length) markFrom = null; }
          else if (s.key === 'Enter') push('\n');
          else if (s.key === 'Space') push('　');
          else if (s.key === 'Shift+Space') push(' ');
          KeyStrip.special(s.key);
          render();
          await kw(s.key === 'Backspace' ? 180 : 300);
        }
        continue;
      }
      if (s.r != null) await chunk(s);
    }
    Ime.hide();
    await kw(o.hold != null ? o.hold : 340);
    el.innerHTML = target;
    el.classList.remove('demo-vertical');
    syncName(el, want);
    KeyStrip.idleHide();
  }

  /* ---------------------------------------------------------------- actions */
  async function clickUi(target, o = {}) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const [x, y] = uiPoint(el, o.ax != null ? o.ax : 0.5, o.ay != null ? o.ay : 0.5);
    await Cursor.moveTo(x, y, o);
    UI.hover(el);
    await wait(o.pause != null ? o.pause : 140);
    el.classList.add('is-pressed');
    await Cursor.click();
    el.classList.remove('is-pressed');
  }
  async function hoverUi(target, o = {}) {
    const el = typeof target === 'string' ? $(target) : target;
    const [x, y] = uiPoint(el, o.ax != null ? o.ax : 0.5, o.ay != null ? o.ay : 0.5);
    await Cursor.moveTo(x, y, o);
    UI.hover(el);
  }
  /** move to an element on the canvas and hover it */
  async function pointAt(el, o = {}) {
    const r = Site.rect(el);
    await Cursor.moveTo(r.left + r.width * (o.ax != null ? o.ax : 0.5), r.top + r.height * (o.ay != null ? o.ay : 0.5), o);
    Overlay.hover(el);
  }
  function select(el, o = {}) {
    Overlay.select(el, { label: o.label || o.name || 'Box', cms: o.cms });
    Layers.select(el);
    Props.show(el ? { el, type: o.type, name: o.name || o.label, cms: o.cms, ov: o.ov } : null);
  }
  function deselect() { Overlay.select(null); Layers.select(null); Props.show(null); }

  const GHOSTS = {
    box: ['square', 'ボックス'], text: ['type', 'テキスト'], image: ['image', '画像'], button: ['button', 'ボタン'],
    link: ['link', 'リンク'], embed: ['code', '埋め込み'], form: ['form', 'フォーム'],
  };
  /**
   * Drag a tile from the "add" panel (or an asset / CMS collection) and drop it onto the canvas.
   *   from:  'box' | 'text' | ...  or  {asset:'id'} or {cms:true}
   *   el:    element (inside the iframe) that the drop creates
   */
  function assetGhost(id) {
    const file = ASSETS.find((a) => a[0] === id)[1];
    return `<div class="g-img" style="background-image:url(assets/img/${file})"></div>`;
  }
  /** press on a panel item, carry a ghost to `rect` on the canvas and release (onEnter: once, when it reaches the canvas) */
  async function dragGhost(source, ghost, ghostCls, rect, at = [0.5, 0.5], onEnter = null) {
    await hoverUi(source);
    await wait(120);
    source.classList.add('is-pressed');
    Cursor.press();
    await wait(140);
    source.classList.remove('is-pressed');
    Ghost.show(ghost, ghostCls);
    Ghost.move(Cursor.x, Cursor.y);
    const tx = rect.left + rect.width * at[0], ty = rect.top + rect.height * at[1];
    const cr = Editor.canvas.getBoundingClientRect();
    let entered = false;
    await Cursor.moveTo(tx, ty, {
      onMove: (x, y) => {
        Ghost.move(x, y);
        const inside = x > cr.left && x < cr.right;
        if (inside && !entered) { entered = true; if (onEnter) onEnter(); }
        Overlay.drop(inside ? rect : null);
      },
    });
    if (!entered && onEnter) onEnter();
    await wait(240);
    Cursor.release();
    Ghost.hide();
    Overlay.drop(null);
  }
  async function addElement(from, el, o = {}) {
    if (!el) return;
    let source, ghost, ghostCls = '';
    if (from && from.asset) {
      await Panels.open('assets');
      source = $(`.asset[data-asset="${from.asset}"]`);
      ghost = assetGhost(from.asset);
    } else if (from && from.cms) {
      await Panels.open('cms');
      source = $('#cmsCollection');
      ghost = `${icon('database')}お知らせ`;
      ghostCls = 'cms';
    } else {
      await Panels.open('add');
      source = $(`.tile[data-tile="${from}"]`);
      ghost = `${icon(GHOSTS[from][0])}${GHOSTS[from][1]}`;
    }
    if (o.prepare) o.prepare();
    // scroll for the finished element (its children are revealed right after the drop and must be in view)…
    const full = Site.measure(el);
    // …but aim the drop at what actually appears: beforeShow runs while the element is still hidden, so the drop
    // target and the release point match the drop result (a section whose children come later is much shorter)
    if (o.beforeShow) o.beforeShow();
    await Editor.ensureVisible(full, o.visible || {});
    const textBox = o.empty && o.type === 'text';
    if (o.empty) {
      Site.empty(el);
      // an empty text box waits with a blinking caret (one line high) until typing / pasting starts
      if (textBox) {
        el.classList.toggle('demo-vertical', /vertical/.test(Site.win.getComputedStyle(el).writingMode));
        el.innerHTML = '<span class="demo-typing-wrap"><span class="demo-caret"></span></span>';
      }
    }
    let rect = Site.measure(el);
    if (textBox) {
      // a new text is one line where the text starts, across the width (height, if vertical) it will take
      const vertical = el.classList.contains('demo-vertical');
      const f = full;
      rect = vertical
        ? { left: rect.left, top: f.top, width: Math.max(rect.width, 12), height: f.height }
        : { left: f.left, top: rect.top, width: f.width, height: Math.max(rect.height, 12) };
    }

    // when the dragged item reaches the canvas, the page makes room for the element (laid out, still invisible),
    // so the drop target lies on the page and the release happens there, not on the grey canvas below it
    const reserve = () => { if (Site.isHidden(el)) { el.removeAttribute('data-demo-hidden'); el.setAttribute('data-demo-measure', ''); } };
    await dragGhost(source, ghost, ghostCls, rect, o.at, reserve);
    el.removeAttribute('data-demo-measure');

    if (o.onDrop) o.onDrop();
    Site.show(el, o.anim || 'pop');
    if (o.layer !== false) Layers.add(el, { name: o.name || 'Box', type: o.type || 'box', parent: o.parent, cms: o.cms });
    if (o.child) {
      Layers.add(o.child.el, { name: o.child.name, type: o.child.type, parent: el, cms: o.child.cms });
      select(o.child.el, o.child);
    } else select(el, o);
    await wait(o.after != null ? o.after : 260);
  }
  /** drag an asset onto an image element that is already on the canvas */
  async function dropAsset(id, el, o = {}) {
    await Panels.open('assets');
    const source = $(`.asset[data-asset="${id}"]`);
    let rect = Site.rect(el);
    await Editor.ensureVisible(rect, o.visible || {});
    rect = Site.rect(el);
    await dragGhost(source, assetGhost(id), '', rect, o.at);
    Site.setImg(el);
    select(el, { type: 'image', name: o.name || 'Image', label: 'Image' });
    await wait(o.after != null ? o.after : 200);
  }

  /** drag a tile of the "add" panel onto any rect of the canvas (the caller decides what the drop does) */
  async function dragTileTo(tile, rect, at) {
    await Panels.open('add');
    const source = $(`.tile[data-tile="${tile}"]`);
    await dragGhost(source, `${icon(GHOSTS[tile][0])}${GHOSTS[tile][1]}`, '', rect, at);
  }

  /** open the color palette from a field of the properties panel and pick a color */
  async function pickColor(fieldSel, key, apply) {
    const f = $(fieldSel);
    await clickUi(f);
    f.classList.add('focus');
    Pop.palette(f, null);
    await wait(380);
    const item = $(`#popover [data-color="${key}"]`);
    await hoverUi(item);
    await wait(260);
    await Cursor.click();
    apply();
    Pop.close();
    await wait(450);
  }
  async function pickFont(family, apply) {
    const f = $('#pp-font');
    await clickUi(f);
    f.classList.add('focus');
    const cur = f.textContent.trim();
    Pop.fonts(f, cur);
    await wait(380);
    // glide past a couple of fonts on the way, like a person browsing the list
    const item = $(`#popover [data-font="${family}"]`);
    await hoverUi(item, { ms: 700 });
    await wait(260);
    await Cursor.click();
    apply();
    Pop.close();
    await wait(450);
  }

  /** run a series of reveals with a stagger, for "cascade" style building */
  async function cascade(els, gap = 110, anim = 'pop') {
    for (const el of els) { if (!el) continue; Site.show(el, anim); await wait(gap); }
  }

  /**
   * Web fonts are split into unicode-range slices that load only when a character first shows up. Load every slice
   * the demo will need before playback, so no text is drawn in a fallback font mid-recording:
   *   uiText     – everything the editor UI will display (panels, captions, layer names, toasts…)
   *   canvasText – characters typed on the canvas (kana while composing, conversion candidates)
   *   siteText   – the page's own text: shown for a while in Noto Sans JP, the "default" font that new texts start
   *                with before the real font is picked (the site itself never uses it, so it is not loaded yet)
   */
  async function preloadFonts(uiText, canvasText, siteText) {
    const uniq = (s) => [...new Set(String(s))].filter((c) => c.trim()).join('');
    const ui = uniq(uiText), cv = uniq(canvasText), st = uniq(String(siteText || '') + canvasText);
    const jobs = [];
    const load = (fonts, spec, text) => { if (text) jobs.push(fonts.load(spec, text).catch(() => {})); };
    for (const w of [400, 500, 600, 700]) load(document.fonts, `${w} 12px "Inter"`, ui);
    for (const w of [400, 500, 700]) load(document.fonts, `${w} 12px "Noto Sans JP"`, ui);
    // font picker previews and the font field show each family name in its own face
    FONT_LIST.forEach(([f, tag]) => load(document.fonts, `400 13px "${f}"`, f + tag));
    if (Site.doc) {
      const fams = [...new Set(FONT_LIST.map(([f]) => f))];
      for (const f of fams) for (const w of [400, 500, 700]) load(Site.doc.fonts, `${w} 16px "${f}"`, f === 'Noto Sans JP' ? st : cv);
    }
    await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 9000))]);
  }
  /** fixed labels the engine itself writes: right panel, popovers, caption chips (⚠ / ✓), IME window (for preloadFonts) */
  function uiStrings() {
    return [Props.pageHtml, Props.elHtml, Props.textSec, Props.imageSec, Props.layoutSec, Props.sizeSec, Props.spacingSec,
      Caption.set, Caption.issue, Caption.fixed, Issue.show, Issue.ok, Ime.show, Ime.setMode, KeyStrip.render, KeyStrip.mode, Toast.show, Clip.open]
      .map((f) => f.toString()).join('') + JSON.stringify(TYPE_LABEL) + JSON.stringify(COLORS) + JSON.stringify(FONT_LIST) + Object.values(WEIGHTS).join('');
  }

  /* ------------------------------------------------------------- bootstrap */
  async function boot(fast) {
    hydrateIcons();
    // assets panel
    $('#assetGrid').innerHTML = ASSETS.map(([id, file]) =>
      `<div class="asset" data-asset="${id}"><div class="a-img" style="background-image:url(assets/img/${file})"></div><small>${file.replace(/^(.{8})[^.]*/, "$1")}</small></div>`).join('');
    Cursor.init();
    Ghost.init();
    Pop.init();
    Editor.init();
    Layers.init();
    Studio.parse(window.SITE_SNAPSHOT.css);

    Site.iframe = Editor.iframe;
    const doc = await window.SiteFrame.load(Editor.iframe, 'editor');
    Site.doc = doc;
    Site.win = Editor.iframe.contentWindow;
    Props.init();
    // preload every image so nothing pops in late during the recording
    if (!fast) await Promise.all(ASSETS.map(([, f]) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = 'assets/img/' + f; })));
    return doc;
  }

  window.Demo = {
    $, $$, clamp, esc, Ease, icon,
    Clock, wait, realWait, tween,
    Cursor, UI, Site, Overlay, Editor, Layers, Props, Pop, Panels, Caption, Keycap, Ghost, Studio,
    clickUi, hoverUi, pointAt, select, deselect, addElement, dropAsset, dragTileTo, pickColor, pickFont, cascade,
    Issue, Toast, Clip, KeyStrip, Ime, typeJa, romajiToKana, scriptText, plainOf, syncName, predictFor, screenRect,
    colorInfo, fontInfo, COLORS, ASSETS, boot, preloadFonts, uiStrings,
  };
})();
