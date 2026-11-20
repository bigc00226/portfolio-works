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
    eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
    gap: '<path d="M5 4v16M19 4v16M10 9l2 3-2 3M14 9l-2 3 2 3"/>',
    shadow: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M16 9.5a6.5 6.5 0 0 1-6.5 7.9" stroke-width="3.2"/>',
    filter: '<circle cx="9" cy="10" r="5"/><circle cx="15" cy="10" r="5"/><circle cx="12" cy="15" r="5"/>',
    pin: '<rect x="7" y="4.5" width="10" height="15" rx="1.5"/><path d="M12 8.5v7"/>',
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
    '59b96079': ['黒', 'rgb(30, 30, 30)', '#1E1E1E'],
    'f9ac78d0': ['ダークグレー', '#686868', '#686868'],
    'd4a360d2': ['ライトグレー', 'rgb(220, 220, 220)', '#DCDCDC'],
    '7b922015': ['キーカラー_青', '#1a5999', '#1A5999'],
    'd484dd2e': ['白', '#fff', '#FFFFFF'],
    '6d9b9387': ['グレー背景', 'rgb(247, 247, 247)', '#F7F7F7'],
    '5280730f': ['フッター背景', 'rgb(50, 50, 50)', '#323232'],
  };
  const FONT_VARS = {
    'd09cd289': 'A1ゴシック M JIS2004',
    '89862173': 'A1ゴシック R JIS2004',
    '0180e749': 'Rubik',
    '4bb6f8ab': 'Noto Sans JP',
    'df8e08df': 'Shippori Mincho',
    'b689786f': 'Zen Old Mincho',
    'ac89e456': 'Noto Sans JP',
  };
  const FONT_LIST = [
    ['A1ゴシック M JIS2004', '太字'],
    ['A1ゴシック R JIS2004', '細字'],
    ['Rubik', '英数字'],
    ['Noto Sans JP', ''],
    ['Shippori Mincho', ''],
    ['Zen Old Mincho', ''],
  ];
  const ASSETS = [
    ['f1b0faa1', 'f1b0faa1-1f4e-4982-b75d-573082112b38_middle.webp'],
    ['d9f06294', 'd9f06294-2089-4cec-9063-f97233a37653_middle.webp'],
    ['15abdb35', '15abdb35-bea8-42a1-86c2-5a474f071dbe_middle.webp'],
    ['aba6438f', 'aba6438f-d91f-4b28-a5ec-1b00504621d7_small.webp'],
    ['c18cd020', 'c18cd020-c6ac-4a10-bd6d-69bc6400ef49_regular.webp'],
    ['388a8797', '388a8797-2ad4-47be-adce-7514a280847d_small.webp'],
    ['e8e4cd70', 'e8e4cd70-f95a-407b-89a3-4b2095b883a7_small.webp'],
    ['c22a4902', 'c22a4902-74a5-4ff2-85af-dfa00101a569_small.webp'],
    ['6723001f', '6723001f-616d-47c4-9e82-22eb6565f537_small.webp'],
  ];

  function colorInfo(v) {
    if (!v || v === 'transparent' || v === 'none' || v === 'rgba(0, 0, 0, 0)') return { name: 'なし', css: 'transparent', none: true, hex: '' };
    const m = String(v).match(/--s-color-([0-9a-f]{8})/);
    if (m && COLORS[m[1]]) return { name: COLORS[m[1]][0], css: COLORS[m[1]][1], hex: COLORS[m[1]][2] };
    return { name: v, css: v, hex: '' };
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
    // declarations inside STUDIO's breakpoint media queries (tablet: max-width 960px, mobile: max-width 540px)
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
          const bp = mw && (mw[1] === '960' ? 'tablet' : mw[1] === '540' ? 'mobile' : null);
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
      if (el) { $('#ovTag').textContent = `<${(el.tagName || 'div').toLowerCase()}>`; $('#ovSel').classList.toggle('cms', !!o.cms); }
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
  // The right panel of STUDIO's editor (Editor 5.0, the default editor since 2025-11-25; help.studio.design/ja screenshots
  // 2025-12 … 2026-10): the element's name with 条件スタイル, text tabs (テキスト|画像 / ボックス / 変形 / 設定), labels above
  // filled fields, sections レイアウト / 外観 / ポジション. Nothing selected: ページ / サイト tabs with ページ設定 / 公開情報.
  const fld = (k, v, u, attrs = '') => `<div class="fld" ${attrs}>${k ? `<span class="k">${k}</span>` : ''}<span class="v">${v}</span>${u ? `<span class="u">${u}</span>` : ''}</div>`;
  const prow = (...items) => `<div class="rp-row">${items.join('')}</div>`;
  const lrow = (label, ...items) => `<div class="rp-row"><span class="rp-lbl">${label}</span>${items.join('')}</div>`;
  const sec = (title, body, ic = '') => `<div class="rp-sec"><div class="rp-sec-title"><span>${title}</span>${ic ? icon(ic) : ''}</div>${body}</div>`;
  /** a field with its label above it */
  const lab = (label, inner, cls = '') => `<div class="rp-f${cls ? ' ' + cls : ''}">${label ? `<div class="rp-l">${label}</div>` : ''}${inner}</div>`;
  const pair = (a, b) => `<div class="rp-2">${a}${b}</div>`;
  const chev = () => icon('chevron-down', 'rp-chev');
  const sel = (v, attrs = '', pre = '') => `<div class="fld sel" ${attrs}>${pre}<span class="v">${v}</span>${chev()}</div>`;
  const tog = (on) => `<span class="rp-tog${on ? ' on' : ''}"></span>`;
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
  // the first tab of an element whose content has its own settings (text / image …); every element has ボックス・変形・設定
  const FIRST_TAB = { text: 'テキスト', image: '画像', embed: '埋め込み', form: 'フォーム' };
  // the page itself: its settings as the project has them (the published page's own title / description / OGP image)
  const PAGE = { title: "株式会社吉武工務店", desc: "創業百余年、愛媛県今治市にある総合建設業。 今日も、この街とともに。", cmsLink: "info/:slug" };
  // side icons of the margin / padding fields (top, right, bottom, left)
  const SIDE = ['<path d="M5 5h14M9 9h6v10H9z"/>', '<path d="M19 5v14M5 9h10v6H5z"/>', '<path d="M5 19h14M9 5h6v10H9z"/>', '<path d="M5 5v14M9 9h10v6H9z"/>'];
  const side = (i) => `<svg class="ic side" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${SIDE[i]}</svg>`;

  const Props = {
    root: null, cur: null, ov: {}, tab: null,
    init() { this.root = $('#props'); this.show(null); },
    show(target) {
      this.cur = target;
      this.ov = (target && target.ov) || {};
      this.tab = this.tabsFor(target)[0];
      this.render(false);
    },
    set(k, v) { this.ov[k] = v; this.render(true, k); },
    clear(k) { delete this.ov[k]; this.render(true, k); },
    extra: {},
    tabsFor(t) {
      if (!t || !t.el) return ['ページ', 'サイト'];
      const type = t.type || 'box';
      return [FIRST_TAB[type], 'ボックス', '変形', '設定', type === 'cms' ? 'データ' : null].filter(Boolean);
    },
    render(soft, changedKey) {
      this.root.classList.toggle('soft', !!soft);
      const t = this.cur;
      let html = '';
      if (!t || !t.el) html = this.pageHtml();
      else html = this.elHtml(t);
      this.root.innerHTML = html;
      this.applyTab();
      if (soft) $$('.rp-sec', this.root).forEach((s) => (s.style.animation = 'none'));
      if (changedKey) { const f = $(`[data-k="${changedKey}"]`, this.root); if (f) f.classList.add('changed'); }
    },
    tabsHtml() { return `<div class="rp-tabs">${this.tabsFor(this.cur).map((n) => `<span data-tab="${n}">${n}</span>`).join('')}</div>`; },
    pane(name, body) { return `<div class="rp-pane" data-pane="${name}">${body}</div>`; },
    applyTab() {
      if (!this.tabsFor(this.cur).includes(this.tab)) this.tab = this.tabsFor(this.cur)[0];
      $$('.rp-tabs [data-tab]', this.root).forEach((s) => s.classList.toggle('on', s.dataset.tab === this.tab));
      $$('.rp-pane', this.root).forEach((p) => p.classList.toggle('on', p.dataset.pane === this.tab));
    },
    /** a field on a tab that is not open: the pointer opens that tab first (as a person would) */
    async reveal(el) {
      const pane = el && el.closest && el.closest('#props .rp-pane');
      if (!pane || pane.classList.contains('on')) return;
      const tab = $(`#props .rp-tabs [data-tab="${pane.dataset.pane}"]`);
      if (tab) await clickUi(tab, { pause: 110 });
      this.tab = pane.dataset.pane;
      this.applyTab();
      await wait(220);
    },
    pageHtml() {
      const page = sec('ページ設定',
        lab('ページ名', fld('', 'Home', '')) +
        lab('パス', fld('', '<span class="muted">/</span>', '')) +
        lab('タイプ', sel('ホーム', '', icon('home'))) +
        `<div class="rp-sw"><span>ページを非公開にする</span>${tog(false)}</div>`) +
        sec('公開情報',
          lab('ページタイトル', fld('', `<span class="muted">${esc(PAGE.title)}</span>`, '')) +
          lab('ページ説明文', `<div class="fld area"><span class="v muted">${esc(PAGE.desc)}</span></div>`) +
          lab('ソーシャルカバー', '<div class="rp-ogp" style="background-image:url(assets/img/ogp.webp)"></div>') +
          `<div class="rp-sw"><span>ファビコン</span><span class="rp-upl">${icon('upload')}</span></div>` +
          lab('言語', sel('<span class="muted">言語を選択してください</span>')) +
          `<div class="rp-sw"><span>noindexを設定する</span>${tog(false)}</div>`) +
        `<div class="rp-sec rp-fold"><div class="rp-sec-title"><span>カスタムコード<span class="rp-paid">有料プラン</span></span>${icon('chevron-down')}</div></div>`;
      return `<div class="rp-pagehead"></div>${this.tabsHtml()}${this.pane('ページ', page)}${this.pane('サイト', '')}`;
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
      const bpChip = bp !== 'pc' ? `<span class="bp-chip ${bp}">${bp === 'mobile' ? 'モバイル' : 'タブレット'}</span>` : '';
      let h = `<div class="rp-head"><span class="rp-eye">${icon('eye')}</span><span class="rp-name">${esc(t.name || 'Box')}</span>${chev()}${bpChip}<span class="rp-cond">条件スタイル</span></div>` + this.tabsHtml();

      // first tab: the content of a text / image / embed / form
      if (type === 'text') h += this.pane('テキスト', this.textSec(el, decls, ov, cs));
      if (type === 'image') h += this.pane('画像', this.imageSec(el));
      if (type === 'embed') {
        const code = this.extra.embedCode, err = this.extra.embedError;
        h += this.pane('埋め込み', sec('コード', (code
          ? `<div class="rp-code${err ? ' error' : ''}" id="pp-embed">${code}</div>`
          : `<div class="rp-code empty" id="pp-embed">HTMLコードを貼り付け</div>`) +
          (err ? `<div class="rp-err">${icon('alert')}<span>${err}</span></div>` : '')));
      }
      if (type === 'form') {
        h += this.pane('フォーム', sec('フォーム', `
          <div class="rp-kv"><span>フォーム名</span><b>お問い合わせフォーム</b></div>
          <div class="rp-kv"><span>項目数</span><b>6</b></div>
          <div class="rp-kv"><span>送信後</span><b>モーダル：thanks</b></div>`));
      }
      // ボックス: layout, appearance, position
      h += this.pane('ボックス', this.layoutSec(d, el, bpKeys) + this.lookSec(d, type) + this.posSec(d, cs));
      // 変形: transform and animation
      h += this.pane('変形', sec('変形', pair(lab('移動', fld('→', '0', 'px')), lab('&nbsp;', fld('↑', '0', 'px'))) +
        pair(lab('回転', fld('', '0', '°')), lab('拡大・縮小', fld('', '100', '%'))) + pair(lab('傾き', fld('', '0', '°')), lab('原点', this.dots(1, 1)))));
      // 設定: link (and the per-breakpoint visibility)
      let set = '';
      if (type === 'link' || type === 'button') {
        const href = el.getAttribute('href') || (el.querySelector('a') && el.querySelector('a').getAttribute('href')) || '';
        set += sec('リンク', lab('URL', fld('', esc(this.extra.linkLabel || href || '未設定'), '', 'id="pp-link" data-k="href"')));
      }
      if (t.vis) set += sec('表示', lab(bp === 'tablet' ? 'タブレット' : '表示', `<div class="fld sel" id="pp-vis" data-k="display">${(ov.display || cs.display) === 'none' ? '<span class="bp-dot"></span>' : ''}<span class="v">${(ov.display || cs.display) === 'none' ? '非表示' : '表示'}</span>${chev()}</div>`));
      set += sec('属性', pair(lab('タグ', sel(esc(el.tagName.toLowerCase()))), lab('ID', fld('', '<span class="muted">—</span>', ''))));
      h += this.pane('設定', set);
      if (type === 'cms') {
        h += this.pane('データ', sec('CMS', `
          <div class="rp-kv"><span>モデル</span><b><span class="bind">${icon('file')}${esc(t.cmsName || 'お知らせ')}</span></b></div>
          <div class="rp-kv"><span>表示件数</span><b>${esc(t.cmsCount || '3')}</b></div>
          <div class="rp-kv"><span>並び順</span><b>${esc(t.cmsSort || '公開日（新しい順）')}</b></div>
          <div class="rp-kv"><span>リンク先</span><b>${esc(t.cmsLink || PAGE.cmsLink)}</b></div>`));
      }
      return h;
    },
    dots(r, c) { let cells = ''; for (let i = 0; i < 9; i++) cells += `<i class="${i === r * 3 + c ? 'on' : ''}"></i>`; return `<div class="align-grid sm">${cells}</div>`; },
    textSec(el, decls, ov, cs) {
      const fam = 'font-family' in ov ? fontInfo(ov['font-family']) : fontInfo(decls['font-family'] || cs.fontFamily);
      const size = fmtLen(decls['font-size'] || cs.fontSize)[0];
      const weight = parseInt(decls['font-weight'] || cs.fontWeight, 10) || 400;
      const lh = decls['line-height'] || '1.4';
      const ls = decls['letter-spacing'] || '0';
      const align = decls['text-align'] || 'left';
      const wm = 'writing-mode' in ov ? ov['writing-mode'] : cs.writingMode;
      const vertical = /vertical/.test(wm);
      const col = colorInfo('color' in ov ? ov.color : (decls.color || cs.color));
      const txt = plainOf(el.innerHTML).replace(/\s+/g, ' ').trim();
      return sec('テキスト', `<div class="fld tx"><span class="v">${esc(txt.slice(0, 60)) || '<span class="muted">テキスト</span>'}</span></div>`) +
        sec('タイポグラフィ',
          lab('テキストスタイル', sel('<span class="muted">未設定</span>')) +
          lab('色', `<div class="fld" id="pp-color" data-k="color"><span class="sw" style="background:${col.css}"></span><span class="v">${esc(col.none ? 'なし' : col.name && col.name !== col.css ? col.name : col.hex || col.name)}</span><span class="u">100 %</span></div>`) +
          lab('フォント', `<div class="fld sel" id="pp-font" data-k="font-family"><span class="v" style="font-family:'${esc(fam)}'">${esc(fam)}</span>${chev()}</div>`) +
          pair(lab('サイズ', fld('', size, `px${chev()}`)), lab('太さ', sel(String(weight)))) +
          pair(lab('行間', fld('', esc(lh), '')), lab('文字間隔', fld('', esc(ls), ''))) +
          lab('揃え', prow(`<div class="icon-seg"><span class="${align === 'left' ? 'on' : ''}">${icon('align-left')}</span><span class="${align === 'center' ? 'on' : ''}">${icon('align-center')}</span><span class="${align === 'right' ? 'on' : ''}">${icon('align-right')}</span></div>`,
            `<div class="icon-seg" id="pp-wm" style="margin-left:auto"><span class="${!vertical ? 'on' : ''}">${icon('text-h')}</span><span class="${vertical ? 'on' : ''}">${icon('text-v')}</span></div>`)));
    },
    imageSec(el) {
      const has = Site.hasImg(el) || el.hasAttribute('data-demo-bg');
      let url = '';
      if (has) url = el.hasAttribute('data-demo-bg') ? (el.style.getPropertyValue('--demo-bg').match(/url\("?(.*?)"?\)/) || [])[1] : Site.imageUrl(el);
      const file = url ? String(url).split('/').pop() : '';
      return sec('画像',
        `<div class="rp-thumb" id="pp-img"><i style="${url ? `background-image:url('${url}')` : ''}"></i>${url ? '' : icon('image')}</div>` +
        `<div class="fld"><span class="v">${file ? 'https://storage.googleapis.com/studio-design-asset-files/projects/…/' + esc(file) : '<span class="muted">URL</span>'}</span></div>`) +
        `<div class="rp-sec">${pair(lab('背景位置', this.dots(1, 1)), '<div>' + lab('繰り返し', '<span class="rp-chk"></span>') + lab('背景サイズ', sel('cover')) + '</div>')}${lab('フィルター', fld('', '<span class="muted">なし</span>', ''))}</div>`;
    },
    layoutSec(d, el, bpKeys = new Set()) {
      const w = fmtLen(d('width')), hh = fmtLen(d('height'));
      const mwRaw = d('max-width');
      const mw = mwRaw === 'none' ? 'なし' : fmtLen(mwRaw || 'auto').join('');
      // fields carry ids (for scripted editing) and an orange dot when the value is specific to the current breakpoint
      const f = (v, u, id, prop) =>
        `<div class="fld" id="${id}" data-k="${prop}">${bpKeys.has(prop) ? '<span class="bp-dot"></span>' : ''}<span class="v">${v === 'Auto' ? '--' : v}</span><span class="u">${v === 'Auto' ? 'auto' : u || 'px'}${chev()}</span></div>`;
      const m = box4(d('margin')), p = box4(d('padding'));
      const four = (vals, kind) => `<div class="rp-4"><div class="rp-2">${fld(side(0), vals[0], '')}${fld(side(1), vals[1], '')}</div><div class="rp-2">${fld(side(2), vals[2], '')}${fld(side(3), vals[3], '')}</div><span class="rp-link ${kind}"></span></div>`;
      const dir = d('flex-direction') || 'column';
      const wrap = d('flex-wrap') === 'wrap';
      const di = wrap ? 2 : { column: 0, row: 1, 'row-reverse': 3, 'column-reverse': 4 }[dir] ?? 0;
      const dirs = ['arrow-down', 'arrow-right', 'wrap', 'arrow-left', 'arrow-up'].map((ic, i) => `<span class="${i === di ? 'on' : ''}">${icon(ic)}</span>`).join('');
      const pos = (v) => (v === 'center' ? 1 : v === 'flex-end' || v === 'end' ? 2 : v === 'space-between' ? 1 : 0);
      const jc = d('justify-content') || 'flex-start', ai = d('align-items') || 'center';
      let r, c;
      if (dir === 'row') { c = pos(jc); r = pos(ai); } else { r = pos(jc); c = pos(ai); }
      const H = ['左寄せ', '中央寄せ', '右寄せ'][c], V = ['上揃え', '中央揃え', '下揃え'][r];
      const gap = fmtLen(d('gap') || '0px')[0];
      return sec('レイアウト',
        pair(lab('幅', f(w[0], w[1], 'pp-w', 'width')), lab('高さ', f(hh[0], hh[1], 'pp-h', 'height'))) +
        pair(lab('最大幅', `<div class="fld" id="pp-maxw" data-k="max-width">${bpKeys.has('max-width') ? '<span class="bp-dot"></span>' : ''}<span class="v">${mw === 'Auto' ? '--' : mw}</span></div>`), lab('最小幅', fld('', '--', ''))) +
        lab('マージン', four(m, 'mg')) + lab('パディング', four(p, 'pd')) +
        lab('方向', `<div class="icon-seg dir">${dirs}</div>`) +
        lab('ギャップ', fld(icon('gap'), gap, '')) +
        lab('配置', `<div class="rp-2 al">${this.dots(r, c)}<div>${lab('水平', sel(H))}${lab('垂直', sel(V))}</div></div>`));
    },
    lookSec(d, type) {
      const bg = colorInfo(d('background') || d('background-color'));
      return sec('外観',
        lab('背景色', `<div class="fld" id="pp-fill" data-k="background"><span class="sw ${bg.none ? 'none' : ''}" style="background:${bg.none ? '' : bg.css}"></span><span class="v">${esc(bg.none ? 'なし' : bg.name && bg.name !== bg.css ? bg.name : bg.hex || bg.name)}</span></div>`) +
        lab('角丸', `<div class="rp-2 rad">${fld(icon('radius'), fmtRadius(d('border-radius')), `px${chev()}`)}<span class="rp-ic4"></span></div>`) +
        pair(lab('不透明度', fld('', '100', '%')), lab('枠線', fld(icon('square'), '<span class="muted">なし</span>', ''))) +
        pair(lab('影', fld(icon('shadow'), '<span class="muted">なし</span>', '')), lab('フィルター', fld(icon('filter'), '<span class="muted">なし</span>', ''))));
    },
    posSec(d, cs) {
      const pos = d('position') || cs.position;
      const name = pos === 'absolute' ? '絶対' : pos === 'fixed' ? '固定' : pos === 'sticky' ? 'スティッキー' : '相対';
      return sec('ポジション', pair(lab('位置', sel(name, '', icon('pin'))), lab('重ね順', '<div class="rp-z"><span>−</span><span class="n">0</span><span>+</span></div>')) +
        lab('はみ出し', sel('表示')));
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
      this.open(anchor, `<div class="pop-tabs"><span>カスタム</span><span class="on">スタイル</span>${icon('x')}</div>${items}`);
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
    await Props.reveal(el);
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
    await Props.reveal(el);
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
    box: ['square', 'Box'], text: ['type', 'Text'], image: ['image', 'Image'], button: ['square', 'Box'],
    link: ['type', 'Text'], embed: ['code', 'Blank'], form: ['form', 'Form1'],
  };
  const TILE_OF = { button: 'box', link: 'text' };
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
      source = $(`.tile[data-tile="${TILE_OF[from] || from}"]`);
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
    const source = $(`.tile[data-tile="${TILE_OF[tile] || tile}"]`);
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
    return [Props.pageHtml, Props.elHtml, Props.textSec, Props.imageSec, Props.layoutSec, Props.lookSec, Props.posSec, Props.dots, rebuildChrome,
      Caption.set, Caption.issue, Caption.fixed, Issue.show, Issue.ok, Ime.show, Ime.setMode, KeyStrip.render, KeyStrip.mode, Toast.show, Clip.open]
      .map((f) => f.toString()).join('') + JSON.stringify(TYPE_LABEL) + JSON.stringify(PAGE) + JSON.stringify(RAIL) + JSON.stringify(TILES) + JSON.stringify(COLORS) + JSON.stringify(FONT_LIST) + Object.values(WEIGHTS).join('');
  }

  /* ------------------------------------------------------- editor chrome */
  /**
   * STUDIO's editor as it is now (Editor 5.0: released 2025-11-25 as the default editor; help.studio.design/ja, screenshots
   * up to 2026-10): no top bar — a narrow icon rail with the /S menu, the left panel headed by 「プロジェクト / ページ ▾」,
   * the right panel headed by zoom · members · preview · 公開, and a floating breakpoint toolbar at the bottom of the canvas.
   * The page markup still carries the older layout; it is rearranged here before the first frame (ids kept for scenario.js).
   */
  const RAIL = [
    ['add', '追加', '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><path d="M16.75 13.2v7.1M13.2 16.75h7.1"/>'],
    ['pages', 'ページ', '<path class="fillable" d="M13.6 3H7.2A2.2 2.2 0 0 0 5 5.2v13.6A2.2 2.2 0 0 0 7.2 21h9.6a2.2 2.2 0 0 0 2.2-2.2V8.4z"/><path d="M13.6 3v5.4H19"/>'],
    ['layers', 'レイヤー', '<path d="m12 3 9 4.6-9 4.6-9-4.6z"/><path d="m3 12.2 9 4.6 9-4.6"/><path d="m3 16.6 9 4.6 9-4.6"/>'],
    ['style', 'スタイル', '<path d="m3 19 5.6-14h1.2l5.6 14M5.3 13.6h7.8"/><path d="M18.2 11.6c1.4 1.8 2.4 3.1 2.4 4.4a2.4 2.4 0 0 1-4.8 0c0-1.3 1-2.6 2.4-4.4z"/>'],
    ['assets', 'アップロード', '<path d="M3 7.2A2.2 2.2 0 0 1 5.2 5h3.9l2 2.2h7.7A2.2 2.2 0 0 1 21 9.4v8.4a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8z"/><path d="M3 10.4h18"/>'],
    ['stock', 'ストック', '<path d="M12.5 4H6.2A2.2 2.2 0 0 0 4 6.2v11.6A2.2 2.2 0 0 0 6.2 20h11.6a2.2 2.2 0 0 0 2.2-2.2v-6"/><path d="M17.5 3v6M14.5 6h6"/><circle cx="9" cy="9.5" r="1.6"/><path d="m4.5 18.5 5.2-5.2 3.3 3.3 2.2-2.2 4.3 4.3"/>'],
    ['cms', '接続', '<path d="M4 7.5h10"/><circle cx="17" cy="7.5" r="2.6"/><circle cx="7" cy="16.5" r="2.6"/><path d="M10 16.5h10"/>'],
    ['comp', 'コンポーネント', '<path d="M12 3.2 15.2 6.4 12 9.6 8.8 6.4zM12 14.4l3.2 3.2-3.2 3.2-3.2-3.2zM6.4 8.8 9.6 12l-3.2 3.2L3.2 12zM17.6 8.8 20.8 12l-3.2 3.2-3.2-3.2z"/>'],
    null,
    ['history', 'バージョン履歴', '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6l-2.5 2.5"/><path d="M3.5 4v4.5H8"/><path d="M12 7.5V12l3 2"/>'],
    ['comment', 'コメント', '<path d="M7.6 19.6A8.5 8.5 0 1 0 4.4 16.4L3 21z"/><path d="M8.3 12h.01M12 12h.01M15.7 12h.01" stroke-width="2.4"/>'],
    ['content', 'コンテンツ編集', '<path d="M16.9 3.6a2.3 2.3 0 0 1 3.3 3.3L8 19.1 3.6 20.4l1.3-4.4z"/><path d="m14.8 5.7 3.3 3.3"/>'],
    '-',
    ['guide', 'Studio設定ガイド', '<path d="M12 6.6C10 5 7 4.5 4 4.8v13.6c3-.3 6 .2 8 1.8 2-1.6 5-2.1 8-1.8V4.8c-3-.3-6 .2-8 1.8z"/><path d="M12 6.6v13.6"/>'],
    ['help', 'ヘルプ', '<path d="M9.2 9.2a2.9 2.9 0 1 1 4 2.6c-.8.4-1.2 1-1.2 1.8v.8"/><path d="M12 18h.01" stroke-width="2.4"/>'],
  ];
  const railSvg = (p) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const TILE_ICONS = {
    section: '<path d="M7 3v18M17 3v18M3 7h18M3 17h18"/>',
    box: '<rect x="4.5" y="4.5" width="15" height="15" rx="2"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="m4.5 17 4.5-4.5 3 3 2.5-2.5 5 5"/>',
    text: '<path d="M6 5h12M12 5v14"/>',
    icon: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    rich: '<rect x="4.5" y="4" width="15" height="16" rx="1.5"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>',
    video: '<rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/><path d="m10.4 9.2 4.4 2.8-4.4 2.8z"/>',
    blank: '<path d="m9 8-4 4 4 4M15 8l4 4-4 4"/>',
    form1: '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M7.5 7.5h9v3h-9zM7.5 13h9v3h-9z"/>',
    form2: '<rect x="4" y="7.5" width="16" height="9" rx="1.5"/><rect x="8" y="10.5" width="8" height="3" rx=".8"/>',
    form3: '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M7.5 7.5h4v3h-4zM12.5 7.5h4v3h-4zM7.5 13h9v3h-9z"/>',
    input: '<rect x="3.5" y="8" width="17" height="8" rx=".8"/><path d="M7 10.2v3.6M6 10.2h2M6 13.8h2"/>',
    area: '<rect x="3.5" y="4.5" width="17" height="15" rx=".8"/><path d="M7 8h4M9 8v5M17.5 16.5l-2 2"/>',
    select: '<rect x="3.5" y="8" width="17" height="8" rx=".8"/><path d="m14.5 11 1.5 1.5 1.5-1.5"/>',
    radio: '<circle cx="6.5" cy="8" r="2"/><circle cx="6.5" cy="16" r="2"/><path d="M11 8h9M11 16h9"/>',
  };
  const tileSvg = (k) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${TILE_ICONS[k]}</svg>`;
  // the tiles of 追加 › 基本 (English names, as in the editor); data-tile keeps the scenario's element kinds
  const TILES = [
    ['基本', [['section', 'Section', 'section'], ['box', 'Box', 'box'], ['image', 'Image', 'image'], ['text', 'Text', 'text'], ['icon', 'Icon', 'icon'], ['rich', 'RichText', 'rich'], ['video', 'Video', 'video']]],
    ['埋め込み', [['blank', 'Blank', 'embed'], ['map', 'Map', 'map'], ['yt', 'YouTube', 'yt'], ['vimeo', 'Vimeo', 'vimeo'], ['lottie', 'Lottie', 'lottie']]],
    ['フォーム', [['form1', 'Form1', 'form'], ['form2', 'Form2', 'form2'], ['form3', 'Form3', 'form3']]],
    ['フォームパーツ', [['input', '', 'input'], ['area', '', 'area'], ['select', '', 'select'], ['radio', '', 'radio']]],
  ];
  const BRAND = {
    map: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 4.6 6.5 12.5 6.5 12.5S18.5 13.6 18.5 9A6.5 6.5 0 0 0 12 2.5z" fill="#ea4335"/><path d="M12 2.5A6.5 6.5 0 0 0 7 4.9l5 6.1z" fill="#1a73e8"/><path d="M5.5 9c0 1.1.4 2.4 1 3.7L12 11 7 4.9A6.5 6.5 0 0 0 5.5 9z" fill="#fbbc04"/><path d="M6.5 12.7c1.6 3.6 5.5 8.8 5.5 8.8l2.3-3.3L12 11z" fill="#34a853"/><circle cx="12" cy="9" r="2.3" fill="#a52714"/></svg>',
    yt: '<svg class="ic" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" fill="#ff0000"/><path d="m10 9 5 3-5 3z" fill="#fff"/></svg>',
    vimeo: '<svg class="ic" viewBox="0 0 24 24"><path d="M21.5 7.4c-.1 1.9-1.4 4.4-3.9 7.6-2.6 3.3-4.7 5-6.5 5-1.1 0-2-1-2.8-3l-1.5-5.5c-.6-2-1.2-3-1.8-3-.1 0-.6.3-1.5.9L2.6 8.2 5.4 5.7c1.3-1.1 2.2-1.7 2.8-1.7 1.5-.1 2.4.9 2.8 3.1.4 2.4.7 3.9.8 4.5.4 1.9.9 2.9 1.4 2.9.4 0 1-.6 1.8-1.9.8-1.3 1.3-2.2 1.3-2.9.1-1.1-.3-1.6-1.3-1.6-.5 0-.9.1-1.4.3.9-3 2.7-4.5 5.3-4.4 1.9 0 2.8 1.3 2.6 3.4z" fill="#1ab7ea"/></svg>',
    lottie: '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4.5" fill="#00ddb3"/><path d="M7.5 16c2.5 0 3-2.4 4.1-5S14 7.5 16.5 7.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  function rebuildChrome(o) {
    const app = $('#app');
    const project = ($('.tb-project-name') || {}).textContent || '';
    // ---- the rail: the /S menu, the panels, then history / comments / content editing, the guide and help
    const rail = $('.rail');
    rail.innerHTML = `<div class="rail-logo"><img src="../../shared/logos/studio.svg" alt="Studio"></div>` + RAIL.map((r) => (r === null ? '<div class="rail-spacer"></div>' : r === '-' ? '<div class="rail-div"></div>'
      : `<button class="rail-btn${r[0] === 'layers' ? ' active' : ''}" data-tab="${r[0]}" title="${r[1]}">${railSvg(r[2])}</button>`)).join('');
    // ---- the left panel: 「project / page ▾」 and the collapse button above every panel
    const left = $('.left-panel');
    left.insertAdjacentHTML('afterbegin', `<div class="lp-crumb"><b class="pj">${esc(project)}</b><span class="sl">/</span><b class="pg" id="crumbPage">Home</b>${icon('chevron-down')}<span class="sp"></span><svg class="ic lp-collapse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H9M13 8l-4 4 4 4M5 5v14"/></svg></div>`);
    // 追加: 基本 / パーツ / セクション, then the element tiles
    const add = $('.lp[data-panel="add"]');
    add.innerHTML = `<div class="lp-head"><span>追加</span></div><div class="seg seg3"><span class="on">基本</span><span>パーツ</span><span>セクション</span></div>
      <div class="lp-scroll">${TILES.map(([g, list]) => `<div class="lp-group-title">${g}</div><div class="tile-grid">${list.map(([ic, name, kind]) =>
        `<div class="tile${name ? '' : ' part'}" data-tile="${kind}"><div class="tile-box">${BRAND[ic] || tileSvg(ic)}</div>${name ? `<span>${name}</span>` : ''}</div>`).join('')}</div>`).join('')}</div>`;
    // ページ: rows with the path in grey; the home / 404 / modal icons; CMS pages as a folder
    const pg = $('.lp[data-panel="pages"]');
    $$('.pg-group', pg).forEach((g) => g.remove());
    $$('.pg-row', pg).forEach((row) => {
      const ic = row.querySelector('svg, i');
      const name = row.querySelector('span'), small = row.querySelector('small');
      const key = row.dataset.page;
      let svg = '<path d="M13.6 3H7.2A2.2 2.2 0 0 0 5 5.2v13.6A2.2 2.2 0 0 0 7.2 21h9.6a2.2 2.2 0 0 0 2.2-2.2V8.4z"/><path d="M13.6 3v5.4H19"/>';
      if (key === 'home') { svg += '<path d="M8.6 17v-3.4L12 11l3.4 2.6V17z"/>'; row.classList.add('active'); }
      else if (key === '404') svg += '<path d="M10.4 12.4a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.5-.7 1M12 17.2h.01"/>';
      else if (row.querySelector('[data-icon="modal"]') || /modal/.test(ic && ic.innerHTML || '')) svg = '<rect x="4.5" y="4.5" width="15" height="15" rx="1.5" stroke-dasharray="2 2"/><rect x="8.5" y="9" width="7" height="6" rx="1"/>';
      if (row.classList.contains('cms')) {
        // a CMS page lives in the folder of its path: 「› 📁 /news」
        const dir = (name.textContent.split('/')[0] || '').trim();
        name.textContent = '/' + dir;
        if (small) small.remove();
        svg = '<path d="M3 7.2A2.2 2.2 0 0 1 5.2 5h3.9l2 2.2h7.7A2.2 2.2 0 0 1 21 9.4v8.4a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8z"/>';
        row.insertAdjacentHTML('afterbegin', `<span class="pg-chev">${icon('chevron-down')}</span>`);
      }
      if (ic) ic.outerHTML = railSvg(svg);
      if (small && key === 'home') small.textContent = '/';
    });
    // アップロード: 「すべて ▾」 and +, search, kinds, then the files (built in boot)
    const as = $('.lp[data-panel="assets"]');
    $('.lp-head', as).innerHTML = '<span>アップロード</span>';
    $('.seg', as).outerHTML = `<div class="as-bar"><b>すべて</b>${icon('chevron-down')}<span class="sp"></span>${icon('plus')}</div>
      <div class="lp-search">${icon('search')}<span>Search</span></div><div class="as-kinds"><span class="on">全種類</span><span>画像</span><span>動画</span><span>PDF</span></div>`;
    // 接続 › CMS: one heading per model, with its 「リスト」 and 「カルーセル」 previews (the list shows the model's items)
    const cms = $('.lp[data-panel="cms"]');
    $('.lp-head', cms).innerHTML = '<span>接続</span>';
    const sc = $('.lp-scroll', cms);
    const models = $$('.cms-col', sc).map((col) => ({ col, items: col.nextElementSibling && col.nextElementSibling.classList.contains('cms-items') ? col.nextElementSibling : null }));
    const html = [];
    sc.innerHTML = '';
    sc.insertAdjacentHTML('beforebegin', '<div class="seg seg3"><span class="on">CMS</span><span>API</span><span>RSS</span></div>');
    models.forEach(({ col, items }) => {
      const nm = col.querySelector('.cms-col-name').textContent;
      const count = col.querySelector('.cms-count');
      const model = document.createElement('div');
      model.className = 'cn-model';
      model.innerHTML = `<div class="cn-h">${icon('file')}<b>${esc(nm)}</b></div>`;
      col.className = 'cn-card cms-col';
      col.innerHTML = '';
      if (items) col.appendChild(items);
      col.insertAdjacentHTML('beforeend', '<span class="cn-lbl">リスト</span>');
      if (count) { count.hidden = true; col.appendChild(count); }
      model.appendChild(col);
      model.insertAdjacentHTML('beforeend', '<div class="cn-card car"><div class="cn-car"><i></i></div><span class="cn-lbl">カルーセル</span></div>');
      // the carousel preview shows the model's first item, once the list has been filled
      if (items) new MutationObserver(() => { const t = items.querySelector('.cms-thumb'); const c = model.querySelector('.cn-car i'); if (t && c) c.style.backgroundImage = t.style.backgroundImage; }).observe(items, { childList: true });
      sc.appendChild(model);
    });
    // レイヤー: the header's two buttons and the 「名称」 column
    const ly = $('.lp[data-panel="layers"]');
    $('.lp-head', ly).innerHTML = `<span>レイヤー</span><span class="lp-head-btns"><span class="hb on">${railSvg('<path d="m8 6-6 6 6 6M16 6l6 6-6 6" stroke-width="1.5"/>')}</span><span class="hb">${railSvg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>')}</span></span>`;
    $('.lp-head', ly).insertAdjacentHTML('afterend', `<div class="ly-cols"><span>名称</span>${railSvg('<path d="m5 4 5.5 15 2.2-6.3L19 10.5z"/>')}${railSvg('<path d="M5 17h14M8 13.5a4 4 0 0 1 8 0M12 5v2M5.5 8l1.4 1.4M18.5 8l-1.4 1.4"/>')}</div>`);
    // ---- the right panel: zoom · members · preview · 公開 above the properties
    const props = $('#props');
    const right = document.createElement('aside');
    right.className = 'right-panel';
    props.className = 'rp-body';
    props.replaceWith(right);
    const zoom = $('#zoomLabel'), prev = $('#btnPreview'), pub = $('#btnPublish');
    right.innerHTML = `<div class="rp-top"><svg class="ic rp-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h11M11 8l4 4-4 4M19 5v14"/></svg><span class="sp"></span>
      <span class="rp-zoom" id="rpZoom"></span><span class="rp-mem"><span class="inv">${icon('plus')}</span><span class="av"></span></span></div>`;
    $('#rpZoom').append(zoom);
    $('#rpZoom').insertAdjacentHTML('beforeend', icon('chevron-down'));
    prev.className = 'rp-prev';
    prev.innerHTML = railSvg('<path d="M8 5.5v13l10.5-6.5z"/>');
    pub.className = 'rp-pub';
    $('.rp-top', right).append(prev, pub);
    right.appendChild(props);
    // ---- the canvas: the page label with its buttons, and the breakpoint toolbar floating at the bottom
    const fl = $('.frame-label');
    $('.fl-size', fl).hidden = true;
    fl.insertAdjacentHTML('beforeend', `<span class="fl-tools">${railSvg('<path d="M5 7h14M10 11v6M14 11v6M6.5 7l1 12.5h9L17.5 7M9.5 7V4.5h5V7"/>')}${railSvg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>')}${icon('plus')}</span>`);
    const bpw = $('#bpWidth');
    const bar = document.createElement('div');
    bar.className = 'bp-bar';
    bar.innerHTML = `<span class="bp-w"></span><div class="bp-switch"></div><span class="bp-more">${railSvg('<path d="M12 5.5h.01M12 12h.01M12 18.5h.01" stroke-width="2.6"/>')}</span>`;
    $('.bp-w', bar).append(bpw);
    $('.bp-w', bar).insertAdjacentHTML('beforeend', 'px');
    const sw = $('.bp-switch', bar);
    const devs = {
      'bp-pc': '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M9 20h6"/>',
      'bp-small': '<rect x="5" y="5" width="14" height="10" rx="1.2"/><path d="M3 18h18"/>',
      'bp-tablet': '<rect x="5.5" y="3" width="13" height="18" rx="2"/><path d="M5.5 6.5h13"/>',
      'bp-mobile': '<rect x="7" y="3.5" width="10" height="17" rx="2"/><path d="M7 7h10"/>',
    };
    ['bp-pc', ...(o.small ? ['bp-small'] : []), 'bp-tablet', 'bp-mobile'].forEach((id) => {
      let b = document.getElementById(id);
      if (!b) { b = document.createElement('button'); b.className = 'bp-btn'; b.id = id; }
      b.innerHTML = railSvg(devs[id]);
      sw.appendChild(b);
    });
    $('#canvas').appendChild(bar);
    $('.topbar').remove();
    // ---- 公開: a sheet sliding down over the editor — the site's URL, 独自ドメイン設定, the status, the 「⤒ 公開」 button
    const pm = $('#publishModal');
    const url = $('.m-url', pm).textContent.trim();
    const doBtn = $('#btnDoPublish'), cancel = $('#btnCancel'), open = $('#btnOpenSite');
    const prog = $('#mProgress'), ok = $('#mSuccess'), st = $('#mStatus');
    pm.classList.add('pubsheet');
    const m = $('.modal', pm);
    m.innerHTML = `<img class="ps-logo" src="../../shared/logos/studio.svg" alt="Studio"><div class="ps-act"></div>
      <div class="ps-mid"><div class="ps-url"><span class="ps-x">${railSvg('<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" stroke="#fff" stroke-width="1.8"/>')}</span><span class="m-url">https://${esc(url)}</span></div><span class="ps-dom">独自ドメイン設定</span></div>
      <div class="ps-state"></div>`;
    doBtn.className = 'ps-pub';
    doBtn.innerHTML = `${railSvg('<path d="M6 4.5h12M12 20V9M7.5 13.5 12 9l4.5 4.5"/>')}公開`;
    cancel.className = 'ps-cancel';
    $('.ps-act', m).append(doBtn, cancel);
    open.className = 'ps-open';
    open.innerHTML = railSvg('<path d="M14 4h6v6M10 14 20 4M18 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5"/>');
    $('.ps-url', m).append(open);
    $('.ps-mid', m).append(prog, ok);
    st.className = o.published ? 'pill pill-green' : 'pill';
    st.textContent = o.published ? '公開中' : '非公開';
    $('.ps-state', m).append(st);
    $('.ps-state', m).insertAdjacentHTML('beforeend', `<small>https://${esc(url)}</small>`);
    app.classList.add('s5');
  }

  /* ------------------------------------------------------------- bootstrap */
  async function boot(fast) {
    rebuildChrome({"small": false, "published": false});
    hydrateIcons();
    // assets panel
    $('#assetGrid').innerHTML = ASSETS.map(([id, file]) =>
      `<div class="asset" data-asset="${id}"><div class="a-img"><i style="background-image:url(assets/img/${file})"></i></div><small>${icon('image')}${id}.webp</small></div>`).join('');
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
    Issue, Toast, Clip, KeyStrip, Ime, typeJa, romajiToKana, scriptText, plainOf, syncName, predictFor,
    colorInfo, fontInfo, COLORS, ASSETS, boot, preloadFonts, uiStrings,
  };
})();
