/*
 * Demo engine (shared by the production-process videos): clock, scripted pointer, windows, caption band, issue markers, key display and the
 * Microsoft-IME-like Japanese input (romaji -> kana composition -> conversion candidates -> commit).
 */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const Ease = {
    linear: (t) => t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    smooth: (t) => t * t * (3 - 2 * t),
  };

  /* ------------------------------------------------------------------ icons (stroke style, no brand marks) */
  const P = {
    menu: 'M4 6h16M4 12h16M4 18h16',
    pointer: 'M5 3l13 7-6 1.6L9.4 18z',
    frame: 'M8 3v18M16 3v18M3 8h18M3 16h18',
    square: 'M4 4h16v16H4z',
    pen: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.6 7.6M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    type: 'M4 7V4h16v3M9 20h6M12 4v16',
    hand: 'M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
    comment: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    'chevron-down': 'M6 9l6 6 6-6', 'chevron-right': 'M9 6l6 6-6 6', 'chevron-up': 'M6 15l6-6 6 6', 'chevron-left': 'M15 18l-6-6 6-6',
    play: 'M6 4l14 8-14 8z',
    min: 'M5 12h14', max: 'M5 5h14v14H5z', close: 'M6 6l12 12M18 6L6 18',
    check: 'M20 6L9 17l-5-5', plus: 'M12 5v14M5 12h14', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
    files: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v6h6',
    git: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
    debug: 'M8 5v14l11-7z', blocks: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
    'x-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6',
    alert: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    'arrow-left': 'M19 12H5M12 19l-7-7 7-7', 'arrow-right': 'M5 12h14M12 5l7 7-7 7',
    reload: 'M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
    puzzle: 'M19.4 14.9a2.5 2.5 0 1 0 0-5H18V6a2 2 0 0 0-2-2h-3.9v1.4a2.5 2.5 0 1 1-5 0V4H4v4.1h1.4a2.5 2.5 0 1 1 0 5H4V20h3.1v-1.4a2.5 2.5 0 1 1 5 0V20H16a2 2 0 0 0 2-2v-3.1z',
    globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
    volume: 'M11 5L6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07',
    image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
    layers: 'M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    database: 'M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3zM21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.83 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
    tag: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
    bolt: 'M13 2L3 14h9l-1 8 10-12h-9z',
    variable: 'M8 21s-4-3-4-9 4-9 4-9M16 3s4 3 4 9-4 9-4 9M15 9l-6 6M9 9l6 6',
    chart: 'M18 20V10M12 20V4M6 20v-6',
    home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
    cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'align-c': 'M18 10H6M21 6H3M21 14H3M18 18H6',
    text: 'M17 6H3M21 12H3M15 18H3',
    lang: 'M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
    pencil: 'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
    copy: 'M9 9h13v13H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
    box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7L12 12l8.7-5M12 22V12',
    cart: 'M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    brush: 'M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z',
    trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    grid4: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    mobile: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01',
    dots: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    inspect: 'M3 3h7M3 3v7M21 3h-7M21 3v7M3 21h7M3 21v-7M21 21h-4M21 21v-4M12 12l9 9',
    ban: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM4.93 4.93l14.14 14.14',
    'menu-dots': 'M5 12h.01M12 12h.01M19 12h.01',
    bug: 'M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 1 1 6 0v1M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6zM12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4',
  };
  function icon(name) {
    const d = P[name];
    if (!d) return '';
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  }
  function hydrateIcons(root = document) { $$('i[data-icon]', root).forEach((i) => { if (!i.firstChild) i.innerHTML = icon(i.dataset.icon); }); }

  /* ------------------------------------------------------------------ clock (shared/stage.js: deterministic timeline) */
  const St = window.Stage;
  const { Clock, wait, tween, frameFns, twoFrames } = St;
  /** keystroke-level pause (kept in turbo seeking too, so the timeline never changes) */
  const kw = (ms) => wait(ms);
  /** pause for a CSS transition: on the demo clock as well (transitions are switched off while seeking) */
  const realWait = (ms) => wait(ms);

  /* ----------------------------------------------------------- geometry (main page + iframes) */
  /** viewport rect of any element, also inside (scaled) iframes */
  function screenRect(el) {
    const r = el.getBoundingClientRect();
    let x = r.left, y = r.top, w = r.width, h = r.height;
    let win = el.ownerDocument.defaultView;
    while (win && win.frameElement) {
      const fe = win.frameElement;
      const fr = fe.getBoundingClientRect();
      const sx = fe.offsetWidth ? fr.width / fe.offsetWidth : 1;
      const sy = fe.offsetHeight ? fr.height / fe.offsetHeight : 1;
      x = fr.left + x * sx; y = fr.top + y * sy; w *= sx; h *= sy;
      win = fe.ownerDocument.defaultView;
    }
    return { left: x, top: y, width: w, height: h, right: x + w, bottom: y + h };
  }
  function pointOf(el, ax = 0.5, ay = 0.5) {
    const r = el.getBoundingClientRect ? screenRect(el) : el;
    return [r.left + r.width * ax, r.top + r.height * ay];
  }

  /* ----------------------------------------------------------------- cursor */
  const UI = {
    hovered: null,
    hover(el) {
      if (this.hovered && this.hovered !== el) this.unhover();
      this.hovered = el;
      if (!el) return;
      if (el.ownerDocument !== document) { const w = el.ownerDocument.defaultView; if (w.__demoHover) w.__demoHover(el, true); }
      else el.classList.add('is-hover');
    },
    unhover() {
      const el = this.hovered;
      if (!el) return;
      if (el.ownerDocument !== document) { const w = el.ownerDocument.defaultView; if (w && w.__demoHover) w.__demoHover(el, false); }
      else el.classList.remove('is-hover');
      this.hovered = null;
    },
  };
  const Cursor = {
    el: null, x: 0, y: 0,
    init() { this.el = $('#cursor'); this.x = innerWidth * 0.55; this.y = innerHeight * 0.62; this.render(); },
    /** a real pointer sits on whole pixels */
    render() { this.el.style.transform = `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`; },
    kind(k) { this.el.dataset.kind = k || 'arrow'; },
    /**
     * Hand-on-a-mouse movement: a slightly curved path, a quick start and a long settle (minimum-jerk profile,
     * skewed early), a duration that varies a little from move to move, and on long free moves now and then a
     * small overshoot that is corrected back onto the target.
     */
    async moveTo(x, y, o = {}) {
      if (!o.keepHover) UI.unhover();
      const sx = this.x, sy = this.y, dx = x - sx, dy = y - sy;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) return;
      const free = o.ms == null && !o.onMove && !o.easing;
      const ms = o.ms != null ? o.ms : clamp(200 + dist * 0.32, 240, 760) * (0.88 + Math.random() * 0.24);
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
      const mj = (t) => { const s = Math.pow(t, 0.82); return s * s * s * (10 - 15 * s + 6 * s * s); };
      await tween(ms, (e) => {
        const u = 1 - e;
        this.x = u * u * sx + 2 * u * e * cx + e * e * ex;
        this.y = u * u * sy + 2 * u * e * cy + e * e * ey;
        this.render();
        if (o.onMove) o.onMove(this.x, this.y);
      }, o.easing || mj);
      if (overshoot) {
        const bx = this.x, by = this.y;
        await tween(110 + Math.random() * 90, (e) => { this.x = bx + (x - bx) * e; this.y = by + (y - by) * e; this.render(); }, Ease.out);
      }
    },
    press() { this.el.classList.add('down'); ripple(this.x, this.y); },
    release() { this.el.classList.remove('down'); },
    async click() { this.press(); await wait(110); this.release(); await wait(70); },
    async dblclick() { this.press(); await wait(70); this.release(); await wait(60); this.press(); await wait(70); this.release(); await wait(70); },
  };
  function ripple(x, y) {
    if (Clock.ff) return;
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }
  async function moveToEl(el, o = {}) {
    const [x, y] = pointOf(el, o.ax != null ? o.ax : 0.5, o.ay != null ? o.ay : 0.5);
    await Cursor.moveTo(x + (o.dx || 0), y + (o.dy || 0), o);
  }
  async function clickUi(target, o = {}) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) { console.warn('[demo] click target missing', target); return; }
    Cursor.kind(o.kind || 'arrow');
    await moveToEl(el, o);
    UI.hover(el);
    await wait(o.pause != null ? o.pause : 90);
    if (el.classList && el.ownerDocument === document) el.classList.add('is-pressed');
    if (o.dbl) await Cursor.dblclick(); else await Cursor.click();
    if (el.classList && el.ownerDocument === document) el.classList.remove('is-pressed');
    if (o.after != null) await wait(o.after);
  }
  async function hoverUi(target, o = {}) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (o.kind) Cursor.kind(o.kind);
    await moveToEl(el, o);
    UI.hover(el);
    if (o.hold) await wait(o.hold);
  }

  /* ---------------------------------------------------------------- windows + taskbar */
  const Win = {
    z: 10,
    el(app) { return $('#win-' + app); },
    open(app, state) {
      const w = this.el(app);
      if (state) this.state(app, state);
      w.classList.remove('hidden');
      this.front(app);
      $(`.tb-app[data-app="${app}"]`).classList.add('open');
    },
    state(app, s) {
      const w = this.el(app);
      w.classList.remove('max', 'snap-left', 'snap-right');
      w.classList.add(s);
    },
    front(app) {
      this.el(app).style.zIndex = ++this.z;
      $$('.tb-app').forEach((b) => b.classList.toggle('active', b.dataset.app === app));
    },
    hide(app) { this.el(app).classList.add('hidden'); },
    /** taskbar click: bring the app to front */
    async switchTo(app, o = {}) {
      await clickUi($(`.tb-app[data-app="${app}"]`), { after: 60, ...o });
      this.open(app, o.state);
      await realWait(260);
    },
  };

  /* -------------------------------------------------------------- caption band */
  const Caption = {
    step(n) {
      $$('#bandSteps span').forEach((s) => {
        const k = +s.dataset.step;
        s.classList.toggle('on', k === n);
        s.classList.toggle('done', k < n);
      });
    },
    allDone() { $$('#bandSteps span').forEach((s) => { s.classList.remove('on'); s.classList.add('done'); }); },
    _set(cls, chip, text) {
      const c = $('#caption');
      c.classList.remove('issue', 'fixed');
      if (cls) c.classList.add(cls);
      $('#capChip').textContent = chip;
      $('#capText').textContent = text;
      c.classList.add('show');
    },
    set(text) { this._set('', '', text); },
    issue(kind, text) { this._set('issue', '⚠ ' + kind, text); },
    fixed(text) { this._set('fixed', '✓ 修正', text); },
    hide() { $('#caption').classList.remove('show'); },
  };

  /** red frame + label around the place a mistake shows up (green once fixed); follows its target */
  const Issue = {
    target: null, o: {}, fn: null,
    show(target, label, o = {}) { this._on(target, '⚠ ' + label, false, o); },
    ok(target, label, o = {}) { this._on(target, '✓ ' + label, true, o); },
    _on(target, label, ok, o) {
      this.target = target; this.o = o;
      const b = $('#issueBox');
      $('#issueLbl').textContent = label;
      b.classList.remove('show', 'ok', 'below');
      void b.offsetWidth;
      b.classList.add('show');
      b.classList.toggle('ok', ok);
      b.classList.toggle('below', !!o.below);
      if (!this.fn) { this.fn = () => this.place(); frameFns.add(this.fn); }
      this.place();
    },
    place() {
      if (!this.target) return;
      const pad = this.o.pad != null ? this.o.pad : 6;
      let r = typeof this.target === 'function' ? this.target() : screenRect(this.target);
      if (!r) return;
      const b = $('#issueBox');
      b.style.left = r.left - pad + 'px';
      b.style.top = r.top - pad + 'px';
      b.style.width = r.width + pad * 2 + 'px';
      b.style.height = r.height + pad * 2 + 'px';
    },
    hide() {
      $('#issueBox').classList.remove('show', 'ok');
      this.target = null;
      if (this.fn) { frameFns.delete(this.fn); this.fn = null; }
    },
  };

  const Keycap = {
    token: 0,
    async show(keys, hold = 900) {
      const k = $('#keycap');
      k.innerHTML = keys.map((x) => `<kbd>${esc(x)}</kbd>`).join('<span class="plus">+</span>');
      k.classList.add('show');
      const tk = ++this.token;
      wait(hold).then(() => { if (tk === this.token) k.classList.remove('show'); });
      await wait(300);
    },
  };

  const Notif = {
    token: 0,
    /** Windows 11 toast; o.app / o.src: the sending app and site (e.g. Google Chrome · mail.google.com) */
    show(title, text, hold = 4200, iconName = '', o = {}) {
      $('#notifIc').innerHTML = iconName ? icon(iconName) : '';
      const app = $('#notifApp'); if (app) app.textContent = o.app || 'Google Chrome';
      const src = $('#notifSrc'); if (src) src.textContent = o.src || '';
      $('#notifTitle').textContent = title;
      $('#notifText').textContent = text;
      $('#notif').classList.add('show');
      const tk = ++this.token;
      wait(hold).then(() => { if (tk === this.token) $('#notif').classList.remove('show'); });
    },
    hide() { $('#notif').classList.remove('show'); },
  };

  const Ghost = {
    show(html) { const g = $('#ghost'); g.innerHTML = html; g.classList.add('show'); },
    move(x, y) { $('#ghost').style.transform = `translate(${x + 12}px, ${y + 14}px)`; },
    hide() { $('#ghost').classList.remove('show'); },
  };

  /* ---------------------------------------------------------- Japanese IME */
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
    xyu: 'ゅ', lyu: 'ゅ', xya: 'ゃ', xyo: 'ょ',
  };
  const KANA_PUNCT = { ',': '、', '.': '。', '-': 'ー', '/': '・', '[': '「', ']': '」', '~': '〜', '!': '！', '?': '？', '(': '（', ')': '）', '|': '｜', ':': '：' };
  const KANA_PREFIX = new Set();
  Object.keys(KANA).forEach((k) => { for (let i = 1; i <= k.length; i++) KANA_PREFIX.add(k.slice(0, i)); });
  /** romaji buffer -> { kana, rest } (rest = romaji still being typed, shown as-is like the IME does) */
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
      if (KANA_PREFIX.has(buf.slice(i))) break;
      out += c;
      i++;
    }
    return { kana: out, rest: buf.slice(i) };
  }

  /** the keys being pressed (romaji / code letters, then special keys) + IME mode あ / A (mirrored in the tray) */
  const KeyStrip = {
    typed: '', keys: [], token: 0,
    show() { $('#keystrip').classList.add('show'); this.token++; },
    render() {
      const MAX = 46;
      const full = this.typed;
      const t = full.length > MAX ? full.slice(-MAX) : full;
      $('#ksKeys').innerHTML = (t ? `<span class="typed">${full.length > MAX ? '…' : ''}${esc(t.slice(0, -1))}<b>${esc(t.slice(-1))}</b></span>` : '') +
        this.keys.map((k) => `<kbd>${esc(k)}</kbd>`).join('');
    },
    mode(on) {
      const m = $('#ksMode');
      m.textContent = on ? 'あ' : 'A';
      m.classList.toggle('off', !on);
      $('#trayIme').textContent = on ? 'あ' : 'A';
    },
    visible() { return $('#keystrip').classList.contains('show'); },
    fresh() { if (!this.visible()) { this.typed = ''; this.keys = []; } },
    key(ch) {
      this.fresh();
      if (this.keys.length) { this.typed = ''; this.keys = []; }
      this.typed += ch === '\n' ? '⏎' : ch;
      this.render();
      this.show();
    },
    special(label) {
      this.fresh();
      this.keys.push(label);
      if (this.keys.length > 6) this.keys.shift();
      this.render();
      this.show();
    },
    idleHide(ms = 1100) {
      const tk = this.token;
      wait(ms).then(() => { if (tk === this.token) $('#keystrip').classList.remove('show'); });
    },
    hideNow() { $('#keystrip').classList.remove('show'); },
  };

  const Ime = {
    on: true,
    async setMode(on, quiet) {
      if (this.on === on) return;
      this.on = on;
      if (!quiet) KeyStrip.special('半角/全角');
      KeyStrip.mode(on);
      if (!quiet) await kw(240);
    },
    show(kind, items, sel, anchor) {
      const el = $('#ime');
      el.className = 'ime show ' + kind;
      el.innerHTML = items.map((x, i) => `<div class="ime-item${i === sel ? ' sel' : ''}"><span class="n">${i + 1}</span><span>${esc(x)}</span></div>`).join('') +
        (kind === 'predict'
          ? '<div class="ime-foot"><span>Tab キーで予測候補を選択</span></div>'
          : `<div class="ime-foot"><span>${sel + 1} / ${items.length}</span><span>Enter で確定</span></div>`);
      const w = el.offsetWidth, h = el.offsetHeight;
      let x = anchor.left - 6, y = anchor.top + anchor.height + 8;
      const ks = $('#keystrip');
      // the key display sits near the bottom unless it moved to the top to keep the typing position in view
      const bottom = KeyStrip.visible() && !ks.classList.contains('ks-top') ? ks.getBoundingClientRect().top - 10 : innerHeight - 96;
      if (y + h > bottom) y = anchor.top - h - 8;
      el.style.left = clamp(x, 8, innerWidth - w - 8) + 'px';
      el.style.top = clamp(y, 8, innerHeight - h - 8) + 'px';
    },
    hide() { $('#ime').classList.remove('show'); },
  };

  function predictFor(s, kana) {
    if (!s.predict) return [];
    if (!s.yomi) return s.predict;
    return s.predict.filter((w, i) => s.yomi[i] && s.yomi[i].startsWith(kana));
  }
  const segOf = (x) => (typeof x === 'string' ? { c: [x], p: 0 } : { c: x.c, p: x.p || 0 });
  const chunkOut = (s) => (s.raw ? romajiToKana(s.r).kana : s.tab != null ? s.predict[s.tab] : s.segs.map((x) => { const g = segOf(x); return g.c[g.p]; }).join(''));
  /** the text a typing script produces (checked against the wanted text before playing) */
  function scriptText(script, initial = '') {
    const a = [...initial];
    for (const s of script) {
      if (s.r != null) a.push(...chunkOut(s));
      else if (s.direct != null) a.push(...s.direct);
      else if (s.paste != null) a.push(...s.paste);
      else if (s.key) for (let i = 0; i < (s.n || 1); i++) {
        if (s.key === 'Backspace') a.pop();
        else if (s.key === 'Enter') a.push('\n');
        else if (s.key === 'Space') a.push('　');
      }
    }
    return a.join('');
  }

  /**
   * Types into a "target" like a person with Microsoft IME:
   *   romaji key by key -> kana composition with prediction hints -> Space converts (candidate list from the
   *   2nd Space) -> Enter commits; half-width text with the IME off; Ctrl+V pastes.
   * target: { cls?: {comp, caret}, render(text, compHtml), anchor() -> rect, enter?(text) -> string }
   * script: {r, segs, predict, yomi, tab} | {r, raw: true} (commit kana) | {direct} | {paste} | {key, n} | {wait} | {call}
   */
  /**
   * The key display (bottom centre) must never cover what is being typed: when the typing position is down where the
   * strip sits (a terminal's prompt line, a field near the bottom of the screen), the strip moves to the top.
   * Decided from the strip's resting place (taskbar + caption offsets), not its current one, so it does not flip-flop.
   */
  function placeStrip(anchorFn) {
    const ks = $('#keystrip');
    if (!ks || !anchorFn) return;
    let a;
    try { a = anchorFn(); } catch (e) { return; }
    if (!a) return;
    const root = getComputedStyle(document.documentElement);
    const tbH = parseFloat(root.getPropertyValue('--tb-h')) || 48;
    const pad = parseFloat(root.getPropertyValue('--player-pad')) || 0;
    const off = document.body.classList.contains('no-captions') ? 22 : 78;
    const stripBottom = innerHeight - (tbH + off + pad);
    const stripTop = stripBottom - Math.max(46, ks.offsetHeight) - 14;
    ks.classList.toggle('ks-top', a.top + a.height > stripTop && a.top < stripBottom + 10);
  }

  async function typeInto(target, script, o = {}) {
    const chars = [...(o.initial || '')];
    const text = () => chars.join('');
    const cc = (target.cls && target.cls.comp) || 'ime-c';
    const kps = o.kps || 11;
    const gap = () => (1000 / kps) * (0.55 + Math.random() * 0.9);
    const render = (comp = '') => { target.render(text(), comp); placeStrip(target.anchor); };
    const push = (str) => { for (const ch of str) chars.push(ch); };
    const anchor = () => target.anchor();

    async function chunk(s) {
      await Ime.setMode(true);
      let buf = '', hinted = false;
      for (const ch of s.r) {
        buf += ch;
        KeyStrip.key(ch);
        const { kana, rest } = romajiToKana(buf);
        render(`<span class="${cc}">${esc(kana + rest)}</span>`);
        const vis = [...kana].length >= (s.predictAt || 2) ? predictFor(s, kana) : [];
        if (vis.length && !Clock.ff) { Ime.show('predict', vis, -1, anchor()); hinted = true; }
        else if (hinted) { Ime.hide(); hinted = false; }
        await kw(gap());
      }
      await kw(s.think != null ? s.think : 200);
      if (s.raw) {
        // Enter on the composition: commits the kana as typed (no conversion)
        if (hinted) Ime.hide();
        KeyStrip.special('Enter');
        push(romajiToKana(s.r).kana);
        render();
        await kw(240);
        return;
      }
      if (s.tab != null) {
        const pick = s.predict[s.tab];
        let list = predictFor(s, romajiToKana(s.r).kana);
        if (list.indexOf(pick) < 0) list = s.predict;
        for (let t = 0; t <= list.indexOf(pick); t++) {
          KeyStrip.special('Tab');
          render(`<span class="${cc} conv active">${esc(list[t])}</span>`);
          if (!Clock.ff) Ime.show('predict', list, t, anchor());
          await kw(400);
        }
        KeyStrip.special('Enter');
        Ime.hide();
        push(pick);
        render();
        await kw(240);
        return;
      }
      if (hinted) Ime.hide();
      const segs = s.segs.map(segOf);
      const choice = segs.map(() => 0);
      let active = 0;
      const conv = () => segs.map((g, i) => `<span class="${cc} conv${i === active ? ' active' : ''}">${esc(g.c[choice[i]])}</span>`).join('');
      KeyStrip.special('Space');
      render(conv());
      await kw(420);
      for (let i = 0; i < segs.length; i++) {
        if (!segs[i].p) continue;
        while (active < i) { active++; KeyStrip.special('→'); render(conv()); await kw(240); }
        for (let k = 1; k <= segs[i].p; k++) {
          KeyStrip.special('Space');
          choice[i] = k;
          render(conv());
          if (!Clock.ff) Ime.show('cand', segs[i].c, k, anchor());
          await kw(k === 1 ? 560 : 380);
        }
        await kw(s.candHold != null ? s.candHold : 260);
      }
      KeyStrip.special('Enter');
      Ime.hide();
      push(segs.map((g, i) => g.c[choice[i]]).join(''));
      render();
      await kw(240);
    }

    render();
    for (const s of script) {
      if (s.call) { await s.call(); continue; }
      if (s.wait) { await kw(s.wait); continue; }
      if (s.paste != null) {
        await Keycap.show(['Ctrl', 'V'], 700);
        push(s.paste);
        render();
        await kw(300);
        continue;
      }
      if (s.direct != null) {
        await Ime.setMode(false, o.quietMode);
        for (const ch of s.direct) {
          KeyStrip.key(ch);
          push(ch);
          render();
          await kw(ch === ' ' ? gap() * 0.6 : gap());
        }
        continue;
      }
      if (s.key) {
        if (s.key === 'Space') await Ime.setMode(true);
        for (let i = 0; i < (s.n || 1); i++) {
          if (s.key === 'Backspace') chars.pop();
          else if (s.key === 'Enter') push(target.enter ? target.enter(text()) : '\n');
          else if (s.key === 'Space') push('　');
          KeyStrip.special(s.key);
          render();
          await kw(s.key === 'Backspace' ? 170 : 260);
        }
        continue;
      }
      if (s.r != null) await chunk(s);
    }
    Ime.hide();
    await kw(o.hold != null ? o.hold : 260);
    if (!o.keepStrip) KeyStrip.idleHide();
    return text();
  }

  /** an input-like box in the page (CMS / Tag Manager / address bar fields) */
  function fieldTarget(el, o = {}) {
    const base = o.base != null ? o.base : '';
    const after = o.after || '';
    const fmt = (s) => esc(s).replace(/\n/g, '<br>');
    return {
      render(text, comp) {
        const html = fmt(base + text) + comp + (o.noCaret ? '' : '<span class="caret"></span>') + fmt(after);
        if (o.into) o.into.innerHTML = html; else el.innerHTML = html;
      },
      anchor() { const c = el.querySelector('.ime-c.active') || el.querySelector('.ime-c') || el.querySelector('.caret') || el; return screenRect(c); },
    };
  }
  /** an element inside an iframe (text being placed on the design canvas) */
  function frameTextTarget(el, o = {}) {
    return {
      cls: { comp: 'demo-ime' },
      render(text, comp) { el.innerHTML = esc((o.base || '') + text).replace(/\n/g, '<br>') + comp + '<span class="demo-caret"></span>'; },
      anchor() { const c = el.querySelector('.demo-ime.active') || el.querySelector('.demo-ime') || el.querySelector('.demo-caret') || el; return screenRect(c); },
    };
  }

  /* ---------------------------------------------------------------- fonts */
  /** is one of these local fonts installed? (canvas width differs from the generic fallback) */
  function hasLocalFont(names) {
    const c = document.createElement('canvas').getContext('2d');
    const s = '味わうために、泊まる。Né mmwwii';
    const gen = ['monospace', 'sans-serif'];
    return names.some((n) => gen.some((g) => {
      c.font = `40px ${g}`; const a = c.measureText(s).width;
      c.font = `40px "${n}", ${g}`; const b = c.measureText(s).width;
      return Math.abs(a - b) > 0.5;
    }));
  }
  /**
   * The site sets Japanese in "Yu Mincho" / Hiragino Mincho etc. (local fonts, no web font). When this machine has
   * none of them, alias "Yu Mincho" to a similar web font so the recording shows the Mincho design, not a gothic
   * fallback. The site's own CSS stays untouched; ?font=local turns this off.
   */
  async function minchoAlias() {
    const p = new URLSearchParams(location.search);
    if (p.get('font') === 'local') return '';
    if (hasLocalFont(['Yu Mincho', 'YuMincho', '游明朝', 'Hiragino Mincho ProN', 'Tsukushi A Old Mincho'])) return '';
    try {
      const res = await fetch('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400&display=block');
      const css = await res.text();
      return css.replace(/font-family:\s*'Noto Serif JP'/g, "font-family: 'Yu Mincho'");
    } catch (e) {
      console.warn('[demo] Mincho fallback font could not be loaded', e);
      return '';
    }
  }
  async function preloadFontText(doc, text) {
    const t = [...new Set(String(text))].filter((c) => c.trim()).join('');
    if (!t) return;
    try { await Promise.race([doc.fonts.load('400 16px "Yu Mincho"', t), new Promise((r) => setTimeout(r, 8000))]); } catch (e) {}
  }

  window.Demo = {
    $, $$, clamp, esc, Ease, icon, hydrateIcons,
    Clock, wait, kw, tween, realWait, twoFrames, frameFns,
    screenRect, pointOf, UI, Cursor, ripple, moveToEl, clickUi, hoverUi,
    Win, Caption, Issue, Keycap, Notif, Ghost,
    KeyStrip, Ime, romajiToKana, predictFor, scriptText, typeInto, fieldTarget, frameTextTarget,
    hasLocalFont, minchoAlias, preloadFontText,
  };
})();
