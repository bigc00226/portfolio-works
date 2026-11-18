/*
 * 宵灯りのほこら — engine: view, input (keys / pad / pointer), UI layers (message, menus), field (map, movement, camera,
 * objects, events, encounters), menus, shops, inn, save / load, title, prologue, ending, game over, debug & self-test.
 * Battle: battle.js. Story scripts and dialogue: story.js.
 */
(function () {
  'use strict';
  const HR = window.HR, GFX = window.GFX, AU = window.AUDIO;
  const G = (window.G = {});
  const TS = 16;
  const qs = new URLSearchParams(location.search);
  G.debug = qs.has('debug');
  const $ = (s) => document.querySelector(s);

  /* =========================== view =========================== */
  const cv = $('#cv'), ctx = cv.getContext('2d');
  const V = (G.V = { W: 320, H: 240, s: 1, dpr: 1, ox: 0, oy: 0 });
  function resize() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    V.dpr = dpr;
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    const s = Math.min(r.width / 320, r.height / 240);
    V.W = Math.floor(Math.min(r.width / s, 432)); V.H = Math.floor(Math.min(r.height / s, 420)); V.s = s;
    V.ox = (r.width - V.W * s) / 2; V.oy = (r.height - V.H * s) / 2;
  }
  new ResizeObserver(resize).observe(cv);
  resize();
  G.toLocal = (cx, cy) => { const r = cv.getBoundingClientRect(); return { x: (cx - r.left - V.ox) / V.s, y: (cy - r.top - V.oy) / V.s }; };
  const kitModalOpen = () => !!document.querySelector('.gk-modal-back');
  /** the first y (logical) below the kit's round buttons, for windows that reach the right edge */
  G.safeTop = function () {
    const hud = GK.hudEl; if (!hud) return 4;
    const h = hud.getBoundingClientRect(), c = cv.getBoundingClientRect();
    const bottom = (h.bottom - c.top - V.oy) / V.s, left = (h.left - c.left - V.ox) / V.s;
    return bottom > 0 && left < V.W ? Math.max(4, Math.ceil(bottom + 3)) : 4;
  };

  /* =========================== state =========================== */
  const S = (G.S = { party: [], chars: {}, inv: {}, gold: 0, flags: {}, opened: {}, time: 0, goal: '' });
  const R = (G.R = { mode: 'boot', t: 0, busy: false, fade: 1, map: null, mapId: null, cam: { x: 0, y: 0 }, shake: 0, flash: null, banner: null, parts: [], encSteps: 20 });
  const P = (G.P = { x: 0, y: 0, dir: 'down', moving: false, t: 1, dur: 0.15, walkT: 0, hist: [] });
  const SETTINGS = (G.SETTINGS = Object.assign({ textSpeed: 1, bgm: 3 }, GK.store.get('settings', {})));
  const saveSettings = () => GK.store.set('settings', SETTINGS);
  G.GAMEOVER = { gameover: true };

  /* =========================== input =========================== */
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyZ: 'ok', Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', KeyX: 'cancel', Escape: 'cancel', Backspace: 'cancel', KeyC: 'menu', ShiftLeft: 'run', ShiftRight: 'run' };
  const DIRS = ['up', 'down', 'left', 'right'];
  const held = (G.held = { up: 0, down: 0, left: 0, right: 0, run: 0 });
  const dirOrder = [];
  const queue = (G.queue = []);
  let padDir = null, ptr = null;
  const pushDir = (d) => { const i = dirOrder.indexOf(d); if (i >= 0) dirOrder.splice(i, 1); dirOrder.push(d); };
  addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code];
    if (!a || kitModalOpen()) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName) && a === 'ok') return;
    e.preventDefault();
    if (a in held) { held[a] = 1; if (DIRS.includes(a)) pushDir(a); }
    if (a === 'run') return;
    if (e.repeat && !DIRS.includes(a)) return;
    queue.push(a);
  });
  addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a && a in held) { held[a] = 0; const i = dirOrder.indexOf(a); if (i >= 0) dirOrder.splice(i, 1); } });
  addEventListener('blur', () => { for (const k in held) held[k] = 0; dirOrder.length = 0; padDir = null; ptr = null; });
  G.press = (a) => queue.push(a);
  function heldDir() {
    for (let i = dirOrder.length - 1; i >= 0; i--) if (held[dirOrder[i]]) return dirOrder[i];
    if (padDir) return padDir;
    if (G.testDir) return G.testDir;
    if (ptr && ptr.walk) {
      const sx = P.px - R.cam.x + 8, sy = P.py - R.cam.y + 8, dx = ptr.x - sx, dy = ptr.y - sy;
      if (Math.abs(dx) < 9 && Math.abs(dy) < 9) return null;
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    return null;
  }
  // virtual pad (touch)
  (function pad() {
    const dpad = $('#dpad');
    if (!dpad) return;
    let rep = 0, repT = 0, lastDir = null;
    const setDir = (d) => {
      if (d === lastDir) return;
      lastDir = d; padDir = d;
      dpad.dataset.dir = d || '';
      clearTimeout(repT); clearInterval(rep);
      if (d) { queue.push(d); repT = setTimeout(() => { rep = setInterval(() => queue.push(d), 110); }, 380); }
    };
    const dirAt = (e) => {
      const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.12) return lastDir;
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    };
    dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); try { dpad.setPointerCapture(e.pointerId); } catch (x) { /* */ } GK.audio(); setDir(dirAt(e)); });
    dpad.addEventListener('pointermove', (e) => { if (lastDir) setDir(dirAt(e)); });
    const up = () => setDir(null);
    dpad.addEventListener('pointerup', up); dpad.addEventListener('pointercancel', up);
    const btn = (sel, a) => { const b = $(sel); if (!b) return; b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); GK.audio(); queue.push(a); }); const off = () => b.classList.remove('on'); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); };
    btn('#btnA', 'ok'); btn('#btnB', 'cancel');
  })();
  // pointer on the canvas: tap menus, hold to walk, tap a neighbour to talk
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', (e) => {
    if (kitModalOpen()) return;
    const p = G.toLocal(e.clientX, e.clientY);
    const top = topInput();
    if (top) { if (top.tap) top.tap(p); else top.key('ok'); return; }
    if (R.mode === 'field' && !R.busy) { try { cv.setPointerCapture(e.pointerId); } catch (x) { /* */ } ptr = { x: p.x, y: p.y, x0: p.x, y0: p.y, t0: performance.now(), walk: false }; }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!ptr) return;
    const p = G.toLocal(e.clientX, e.clientY);
    ptr.x = p.x; ptr.y = p.y;
    if (!ptr.walk && (Math.hypot(p.x - ptr.x0, p.y - ptr.y0) > 6 || performance.now() - ptr.t0 > 220)) ptr.walk = true;
  });
  const ptrUp = () => {
    if (!ptr) return;
    const short = !ptr.walk && performance.now() - ptr.t0 < 260;
    const p = ptr; ptr = null;
    if (short && R.mode === 'field' && !R.busy && !P.moving) tapField(p);
  };
  cv.addEventListener('pointerup', ptrUp); cv.addEventListener('pointercancel', () => { ptr = null; });
  setInterval(() => { if (ptr && !ptr.walk && performance.now() - ptr.t0 > 220) ptr.walk = true; }, 60);

  /* =========================== UI layers =========================== */
  const layers = (G.layers = []);
  G.push = (l) => { layers.push(l); return l; };
  G.pop = (l) => { const i = layers.indexOf(l); if (i >= 0) layers.splice(i, 1); };
  function topInput() { for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; if (l.key && (!l.wants || l.wants())) return l; } return null; }
  G.topInput = topInput;
  const textSpeed = () => [26, 48, 110, 9999][SETTINGS.textSpeed];

  /** message window: name tag, portrait, typewriter. Splits long text into pages of 3 lines. */
  G.say = async function (name, face, text, o = {}) {
    const W = V.W, faceW = face ? 50 : 0;
    const lines = GFX.wrap(ctx, text, W - 24 - faceW, 11);
    for (let i = 0; i < lines.length; i += 3) await sayPage(name, face, lines.slice(i, i + 3), o);
  };
  function sayPage(name, face, lines, o) {
    return new Promise((resolve) => {
      const total = lines.join('').length;
      const L = {
        kind: 'msg', name, face, lines, n: 0, t: 0, narr: o.narr,
        wants: () => true,
        key(a) { if (a === 'ok' || a === 'cancel') adv(); },
        tap() { adv(); },
        update(dt) {
          if (L.n < total) { const before = Math.floor(L.n); L.n = Math.min(total, L.n + dt * textSpeed()); if (Math.floor(L.n) !== before && Math.floor(L.n) % 3 === 0 && !o.narr) GK.sfx('talk'); }
          else if (G.autoMsg) { L.t += dt; if (L.t > (G.autoMsg === 'fast' ? 0.02 : 0.35)) adv(); }
        },
        draw: (g) => (o.narr ? drawNarr(g, L) : drawMsg(g, L)),
      };
      function adv() { if (L.n < total) { L.n = total; return; } G.pop(L); resolve(); }
      G.push(L);
    });
  }
  G.narr = (text) => G.say(null, null, text, { narr: true });
  function visibleLines(L) {
    let left = Math.floor(L.n);
    return L.lines.map((ln) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length; return s; });
  }
  function drawMsg(g, L) {
    const W = V.W, H = V.H, h = 58, x = 4, y = H - h - 4, w = W - 8;
    GFX.frame(g, x, y, w, h);
    let tx = x + 10;
    if (L.face) { GFX.face(g, GK.images[L.face], x + 5, y + 5, h - 10); tx = x + h + 2; }
    if (L.name) {
      g.font = GFX.font(10);
      const nw = g.measureText(L.name).width + 16;
      GFX.frame(g, x + 4, y - 14, nw, 16, { bg: 'rgba(120,52,36,.96)' });
      GFX.text(g, L.name, x + 4 + nw / 2, y - 11, { size: 10, align: 'center', color: '#fff6e0' });
    }
    visibleLines(L).forEach((s, i) => GFX.text(g, s, tx, y + 9 + i * 15, { size: 11 }));
    if (L.n >= L.lines.join('').length) GFX.cursor(g, x + w - 10, y + h - 9 + Math.sin(R.t * 6) * 1.2, R.t);
  }
  function drawNarr(g, L) {
    const W = V.W, H = V.H, h = 22 + L.lines.length * 16, y = Math.round(H * 0.42 - h / 2);
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, 'rgba(8,8,18,0)'); gr.addColorStop(0.2, 'rgba(8,8,18,.82)'); gr.addColorStop(0.8, 'rgba(8,8,18,.82)'); gr.addColorStop(1, 'rgba(8,8,18,0)');
    g.fillStyle = gr; g.fillRect(0, y, W, h);
    visibleLines(L).forEach((s, i) => GFX.text(g, s, W / 2, y + 12 + i * 16, { size: 12, align: 'center', serif: true, color: '#f6ead0' }));
    if (L.n >= L.lines.join('').length) GFX.cursor(g, W / 2, y + h - 6, R.t);
  }

  /**
   * A list window. o = { items: [{ label, right, disabled, desc }], x, y, w, rows, title, cancel (default true), rowH, drawItem, desc: { x, y, w, h } }
   * m.choose() → Promise<index | -1>. The window stays until m.close().
   */
  class Menu {
    constructor(o) {
      Object.assign(this, { items: [], x: 4, y: 4, w: 90, rows: 0, title: null, cancel: true, rowH: 14, i: 0, top: 0, active: false, size: 11 }, o);
      this.i = Math.max(0, Math.min(this.i, this.items.length - 1));
      G.push(this);
    }
    get vis() { return Math.max(1, Math.min(this.rows || this.items.length, this.items.length || 1)); }
    get h() { return (this.title ? 15 : 0) + this.vis * this.rowH + 8; }
    wants() { return this.active; }
    choose() {
      this.active = true;
      const p = new Promise((res) => (this._res = res));
      if (G.autoChoice && !this.noAuto) setTimeout(() => { if (this.active) this.finish(Math.max(0, this.items.findIndex((it) => !it.disabled))); }, 20);
      return p;
    }
    finish(v) { this.active = false; const r = this._res; this._res = null; if (r) r(v); }
    close() { G.pop(this); if (this._res) this.finish(-1); }
    move(d) {
      const n = this.items.length; if (!n) return;
      this.i = (this.i + d + n) % n;
      if (this.i < this.top) this.top = this.i;
      if (this.i >= this.top + this.vis) this.top = this.i - this.vis + 1;
      GK.sfx('cursor');
      if (this.onMove) this.onMove(this.i);
    }
    key(a) {
      if (!this.active) return;
      if (a === 'up') this.move(-1);
      else if (a === 'down') this.move(1);
      else if ((a === 'left' || a === 'right') && this.onSide) this.onSide(a === 'left' ? -1 : 1, this.i);
      else if (a === 'left' && this.vis < this.items.length) this.move(-Math.min(this.vis, this.i || this.vis));
      else if (a === 'right' && this.vis < this.items.length) this.move(Math.min(this.vis, this.items.length - 1 - this.i || this.vis));
      else if (a === 'ok') this.pick(this.i);
      else if ((a === 'cancel' || a === 'menu') && this.cancel) { GK.sfx('cancel'); this.finish(-1); }
    }
    pick(i) {
      const it = this.items[i];
      if (!it || it.disabled) { GK.sfx('ng'); return; }
      GK.sfx('decide'); this.finish(i);
    }
    tap(p) {
      if (!this.active) return;
      const y0 = this.y + 4 + (this.title ? 15 : 0);
      if (p.x >= this.x && p.x <= this.x + this.w && p.y >= this.y && p.y <= this.y + this.h) {
        const r = Math.floor((p.y - y0) / this.rowH);
        if (r < 0) return;
        if (r >= this.vis) { this.move(1); return; }
        const i = this.top + r;
        if (i < this.items.length) { if (this.onSide && this.i === i && this.sideTap) { this.onSide(1, i); return; } this.i = i; if (this.onMove) this.onMove(i); this.pick(i); }
        return;
      }
      if (this.cancel) { GK.sfx('cancel'); this.finish(-1); }
    }
    draw(g) {
      GFX.frame(g, this.x, this.y, this.w, this.h);
      let y = this.y + 4;
      if (this.title) { GFX.text(g, this.title, this.x + 8, y + 1, { size: 10, color: '#d6b262' }); y += 15; }
      for (let r = 0; r < this.vis; r++) {
        const i = this.top + r, it = this.items[i];
        if (!it) break;
        const sel = i === this.i;
        const ry = y + r * this.rowH;
        if (sel && (this.active || this.showSel)) { g.fillStyle = 'rgba(214,178,98,.16)'; g.fillRect(this.x + 4, ry, this.w - 8, this.rowH); }
        if (this.drawItem) { this.drawItem(g, it, this.x + 4, ry, this.w - 8, sel); }
        else {
          const col = it.disabled ? 'rgba(244,239,226,.38)' : it.color || '#f4efe2';
          GFX.text(g, it.label, this.x + 16, ry + (this.rowH - this.size) / 2, { size: this.size, color: col });
          if (it.right != null) GFX.text(g, String(it.right), this.x + this.w - 8, ry + (this.rowH - this.size) / 2, { size: this.size - 1, align: 'right', color: it.disabled ? 'rgba(244,239,226,.38)' : '#e8dcc0' });
        }
        if (sel && this.active) GFX.cursor(g, this.x + 9, ry + this.rowH / 2, R.t);
      }
      if (this.top > 0) tri(g, this.x + this.w / 2, y - 2, -1);
      if (this.top + this.vis < this.items.length) tri(g, this.x + this.w / 2, y + this.vis * this.rowH + 2, 1);
      if (this.desc && this.items[this.i]) {
        const d = this.desc;
        GFX.frame(g, d.x, d.y, d.w, d.h);
        const text = typeof this.items[this.i].desc === 'function' ? this.items[this.i].desc() : this.items[this.i].desc || '';
        GFX.wrap(g, text, d.w - 16, 10).slice(0, Math.max(1, Math.floor((d.h - 8) / 13))).forEach((s, k) => GFX.text(g, s, d.x + 8, d.y + 6 + k * 13, { size: 10 }));
      }
    }
  }
  function tri(g, x, y, dir) { g.fillStyle = '#d6b262'; g.beginPath(); g.moveTo(x - 3, y - dir * 1.5); g.lineTo(x + 3, y - dir * 1.5); g.lineTo(x, y + dir * 2); g.fill(); }
  G.Menu = Menu;
  /** quick choice next to the message window */
  G.choose = async function (opts, o = {}) {
    const w = Math.max(70, ...opts.map((s) => s.length * 11 + 30));
    const m = new Menu(Object.assign({ items: opts.map((s) => ({ label: s })), w, x: V.W - w - 6, y: V.H - 66 - (opts.length * 14 + 8), cancel: o.cancel !== false }, o));
    const i = await m.choose();
    m.close();
    return o.cancel === false ? Math.max(0, i) : i;
  };
  G.ask = async (name, face, text, opts) => { const q = G.say(name, face, text); await q; return G.choose(opts || ['はい', 'いいえ'], { cancel: true }); };
  /** a static panel layer (no input) */
  G.panel = (draw) => G.push({ draw });

  /* =========================== characters & items =========================== */
  G.newChar = function (id, lv) {
    const c = { lv, exp: HR.expTotal(lv), eq: Object.assign({}, HR.CHARS[id].eq), hp: 1, mp: 0 };
    const s = HR.charStats(id, c); c.hp = s.hp; c.mp = s.mp;
    return c;
  };
  G.stats = (id) => HR.charStats(id, S.chars[id]);
  G.healAll = () => { for (const id of S.party) { const c = S.chars[id], s = G.stats(id); c.hp = s.hp; c.mp = s.mp; } };
  G.give = (item, n = 1) => { S.inv[item] = (S.inv[item] || 0) + n; };
  G.take = (item, n = 1) => { S.inv[item] = Math.max(0, (S.inv[item] || 0) - n); if (!S.inv[item]) delete S.inv[item]; };
  /** adds exp; returns level-up infos */
  G.gainExp = function (id, n) {
    const c = S.chars[id], ups = [];
    c.exp += n;
    while (c.lv < HR.MAX_LV && c.exp >= HR.expTotal(c.lv + 1)) {
      const before = G.stats(id), sk0 = HR.skillsAt(id, c.lv);
      c.lv++;
      const after = G.stats(id);
      c.hp += after.hp - before.hp; c.mp += after.mp - before.mp;
      ups.push({ id, lv: c.lv, before, after, skills: HR.skillsAt(id, c.lv).filter((s) => !sk0.includes(s)) });
    }
    return ups;
  };
  const fmtTime = (G.fmtTime = (s) => { s = Math.floor(s); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; });

  /* =========================== map =========================== */
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const DXY = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  G.DXY = DXY;
  function makeObj(o) {
    const ob = Object.assign({ fx: o.x * TS, fy: o.y * TS, step: 0, wanderT: 1 + Math.random() * 2, homeX: o.x, homeY: o.y }, o);
    ob.def = o;
    if (o.t === 'npc') ob.dir = o.dir || 'down';
    return ob;
  }
  G.objHidden = (o) => (o.t === 'npc' && o.hideIf && S.flags[o.hideIf]) || (o.hideUnless && !S.flags[o.hideUnless]) || o.gone;
  function objSolid(o) {
    if (G.objHidden(o)) return false;
    if (o.t === 'warp') return false;
    if (o.t === 'barrier') return !S.flags[o.flag];
    return true;
  }
  G.loadMap = function (id, x, y, dir) {
    const def = HR.MAPS[id], p = HR.parseMap(id);
    const m = { id, def, w: p.w, h: p.h, tiles: p.tiles.map((r) => r.slice()), style: def.style, ground: def.ground, shopColors: def.shopColors };
    if (S.flags['pit_' + id]) m.tiles.forEach((r) => r.forEach((t, i) => { if (t === 'O') r[i] = 'C'; })); // a crossing once made stays open
    m.tile = (tx, ty) => (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h ? null : m.tiles[ty][tx]);
    m.isMarkOn = () => false;
    m.img = GFX.renderMap(m);
    m.border = GFX.borderPattern(ctx, m, { village: 'T', field: 'T', forest: 'F', shrine: 'T', cave: 'X' }[def.style] || '0');
    m.objs = p.objs.map(makeObj);
    m.decos = (def.decos || []).map((d) => Object.assign({}, d));
    R.map = m; R.mapId = id;
    P.x = x; P.y = y; P.dir = dir || P.dir; P.moving = false; P.t = 1;
    P.hist = Array.from({ length: 5 }, () => ({ x, y }));
    P.px = x * TS; P.py = y * TS;
    const c = camTarget(); R.cam.x = c.x; R.cam.y = c.y;
    R.encSteps = 8 + Math.random() * 8;
    R.parts = [];
    R.mode = 'field';
    AU.play(def.music);
    R.banner = { text: def.name, t: 0 };
    updateTopbar();
  };
  function tileSolid(x, y) {
    const t = R.map.tile(x, y);
    if (t == null) return true;
    const d = HR.TILES[t];
    return !d || !!d.solid;
  }
  function objAt(x, y, pred) { return R.map.objs.find((o) => o.x === x && o.y === y && !G.objHidden(o) && (!pred || pred(o))); }
  G.objAt = objAt;
  function blocked(x, y, self) {
    if (tileSolid(x, y)) return true;
    if (R.map.objs.some((o) => o !== self && o.x === x && o.y === y && objSolid(o))) return true;
    return false;
  }
  function camTarget() {
    const m = R.map, mw = m.w * TS, mh = m.h * TS;
    let x = P.px + 8 - V.W / 2, y = P.py + 8 - V.H / 2 - 6;
    x = mw <= V.W ? (mw - V.W) / 2 : Math.max(0, Math.min(mw - V.W, x));
    y = mh <= V.H ? (mh - V.H) / 2 : Math.max(0, Math.min(mh - V.H, y));
    return { x, y };
  }

  /* =========================== field update =========================== */
  let bumpT = 0;
  function canControl() { return R.mode === 'field' && !R.busy && !topInput() && !G.lock; }
  function tryMove(d) {
    P.dir = d;
    const [dx, dy] = DXY[d], nx = P.x + dx, ny = P.y + dy;
    const bo = objAt(nx, ny, (o) => o.t === 'boulder');
    if (bo) { pushBoulder(bo, dx, dy); return; }
    if (blocked(nx, ny)) { if (bumpT <= 0) { GK.sfx('bump'); bumpT = 0.35; } return; }
    startMove(nx, ny);
  }
  function startMove(nx, ny) {
    P.hist.unshift({ x: nx, y: ny }); P.hist.length = 5;
    P.x = nx; P.y = ny; P.moving = true; P.t = 0; P.dur = held.run ? 0.085 : 0.145;
  }
  function pushBoulder(bo, dx, dy) {
    const bx = bo.x + dx, by = bo.y + dy, t = R.map.tile(bx, by);
    const free = !R.map.objs.some((o) => o !== bo && o.x === bx && o.y === by && objSolid(o));
    if ((t === 'C' || t === 'O') && free) {
      GK.sfx('push');
      bo.x = bx; bo.y = by;
      if (t === 'O') {
        R.map.tiles[by][bx] = 'C'; bo.gone = true; S.flags['pit_' + R.mapId] = true;
        R.map.img = GFX.renderMap(R.map);
        GK.sfx('quake'); R.shake = 0.25;
        GK.toast('岩が穴をふさいだ！');
      }
      startMove(bo.x - dx, bo.y - dy);
    } else if (bumpT <= 0) { GK.sfx('bump'); bumpT = 0.35; }
  }
  G.resetBoulders = () => G.warp(R.mapId, P.x, P.y, P.dir, { quiet: true });

  function updateField(dt) {
    bumpT -= dt;
    const m = R.map;
    // NPCs wander
    if (!R.busy && !topInput()) for (const o of m.objs) {
      if (o.t !== 'npc' || !o.wander || G.objHidden(o)) continue;
      if (o.moving) continue;
      o.wanderT -= dt;
      if (o.wanderT > 0) continue;
      o.wanderT = 1.4 + Math.random() * 2.6;
      const d = DIRS[Math.floor(Math.random() * 4)], [dx, dy] = DXY[d], nx = o.x + dx, ny = o.y + dy;
      o.dir = d;
      if (Math.abs(nx - o.homeX) > o.wander || Math.abs(ny - o.homeY) > o.wander) continue;
      if (blocked(nx, ny, o) || (nx === P.x && ny === P.y) || P.hist.slice(0, S.party.length + 1).some((h) => h.x === nx && h.y === ny)) continue;
      if (R.map.def.doors && R.map.def.doors[nx + ',' + ny]) continue;
      if (objAt(nx, ny, (q) => q.t === 'warp')) continue;
      o.x = nx; o.y = ny; o.moving = { t: 0, fx: o.fx, fy: o.fy };
    }
    for (const o of m.objs) {
      if (o.moving) { o.moving.t += dt / 0.3; const k = Math.min(1, o.moving.t); o.fx = GK.lerp(o.moving.fx, o.x * TS, k); o.fy = GK.lerp(o.moving.fy, o.y * TS, k); o.step = Math.floor(k * 4) % 4; if (k >= 1) { o.moving = null; o.step = 0; } }
      else if (o.t === 'boulder') { o.fx += (o.x * TS - o.fx) * Math.min(1, dt * 14); o.fy += (o.y * TS - o.fy) * Math.min(1, dt * 14); }
    }
    // player
    if (P.moving) {
      P.t = Math.min(1, P.t + dt / P.dur);
      P.walkT += dt;
      if (P.t >= 1) { P.moving = false; onStep(); }
    }
    if (!P.moving && canControl()) {
      const d = heldDir();
      if (d) tryMove(d);
    }
    const a = P.hist[1] || P.hist[0], b = P.hist[0];
    P.px = GK.lerp(a.x, b.x, P.t) * TS; P.py = GK.lerp(a.y, b.y, P.t) * TS;
    // camera
    const c = camTarget(), k = Math.min(1, dt * 9);
    R.cam.x += (c.x - R.cam.x) * k; R.cam.y += (c.y - R.cam.y) * k;
    if (Math.abs(c.x - R.cam.x) < 0.3) R.cam.x = c.x;
    if (Math.abs(c.y - R.cam.y) < 0.3) R.cam.y = c.y;
    if (R.banner) { R.banner.t += dt; if (R.banner.t > 3.2) R.banner = null; }
    updateParts(dt);
  }

  function onStep() {
    const m = R.map, key = P.x + ',' + P.y;
    const door = m.def.doors && m.def.doors[key];
    if (door) { GK.sfx('door'); runEvent(() => G.warp(door.to, door.x, door.y, door.dir)); return; }
    const w = objAt(P.x, P.y, (o) => o.t === 'warp');
    if (w) { runEvent(() => G.warp(w.dest.to, w.dest.x, w.dest.y, w.dest.dir)); return; }
    for (const t of m.def.triggers || []) {
      if (P.x >= t.x && P.x < t.x + t.w && P.y >= t.y && P.y < t.y + t.h && !(t.unless && S.flags[t.unless])) {
        const fn = HR.STORY.trigger[t.id];
        if (fn) { runEvent(fn); return; }
      }
    }
    // encounters
    const tile = HR.TILES[m.tile(P.x, P.y)];
    const zone = (m.def.zones || []).find((z) => P.x >= z.x && P.x < z.x + z.w && P.y >= z.y && P.y < z.y + z.h);
    if (zone && tile && tile.enc && !G.noEnc) {
      R.encSteps -= tile.enc;
      if (R.encSteps <= 0) {
        const rate = m.def.rate || [14, 14];
        R.encSteps = rate[0] + Math.random() * rate[1];
        const table = HR.TABLES[zone.after && S.flags[zone.after] ? zone.table2 : zone.table];
        const group = table[Math.floor(Math.random() * table.length)];
        runEvent(() => G.battle(group, { bg: m.def.bg }));
      }
    }
  }

  /** runs a story script; a lost battle ends it (game over → last record) */
  async function runEvent(fn, arg) {
    if (R.busy) return;
    R.busy = true; ptr = null;
    try { await fn(E, arg); }
    catch (e) { if (e !== G.GAMEOVER) console.error(e); }
    finally { R.busy = false; }
  }
  G.runEvent = runEvent;

  function frontTile() { const [dx, dy] = DXY[P.dir]; return { x: P.x + dx, y: P.y + dy, dx, dy }; }
  function interactAt(x, y, dx, dy) {
    let o = objAt(x, y, (q) => q.t !== 'warp');
    if (!o && HR.TILES[R.map.tile(x, y)] && HR.TILES[R.map.tile(x, y)].counter) {
      for (const k of [0, -1, 1]) { o = objAt(x + dx + (dy ? k : 0), y + dy + (dx ? k : 0), (q) => q.t === 'npc'); if (o) break; }
    }
    if (!o) return false;
    runEvent(() => interact(o));
    return true;
  }
  function interactFront() { const f = frontTile(); interactAt(f.x, f.y, f.dx, f.dy); }
  function tapField(p) {
    const wx = Math.floor((p.x + R.cam.x) / TS), wy = Math.floor((p.y + R.cam.y + 4) / TS);
    const dx = wx - P.x, dy = wy - P.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) { P.dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down'; interactAt(wx, wy, dx, dy); }
    else if (Math.abs(dx) + Math.abs(dy) === 2 && (Math.abs(dx) === 2 || Math.abs(dy) === 2)) { const ddx = Math.sign(dx), ddy = Math.sign(dy); if (HR.TILES[R.map.tile(P.x + ddx, P.y + ddy)] && HR.TILES[R.map.tile(P.x + ddx, P.y + ddy)].counter) { P.dir = ddx < 0 ? 'left' : ddx > 0 ? 'right' : ddy < 0 ? 'up' : 'down'; interactAt(P.x + ddx, P.y + ddy, ddx, ddy); } }
  }
  async function interact(o) {
    const ST = HR.STORY;
    if (o.t === 'npc') {
      if (!o.shopKeeper && !o.trapped) o.dir = OPP[P.dir];
      const fn = ST.talk[o.talk]; if (fn) await fn(E, o);
      return;
    }
    if (o.t === 'chest') return openChest(o);
    if (o.t === 'save') return saveLantern();
    if (o.t === 'sign' || o.t === 'deco' || o.t === 'barrier') { const fn = ST.talk[o.talk]; if (fn) await fn(E, o); return; }
    if (o.t === 'lantern') return ST.lantern(E, o);
    if (o.t === 'kage') return ST.kage(E, o);
    if (o.t === 'boulder') {
      await G.say(null, null, '大きな岩だ。押せば動きそうだ。\n岩を元の場所にもどしますか？');
      if ((await G.choose(['もどす', 'そのまま'])) === 0) { GK.sfx('quake'); await G.resetBoulders(); }
    }
  }
  async function openChest(o) {
    if (S.opened[o.id]) { await G.say(null, null, '宝箱はからっぽだ。'); return; }
    S.opened[o.id] = true; GK.sfx('chest');
    if (o.gold) { S.gold += o.gold; await G.say(null, null, `宝箱をあけた！\n${o.gold} 文を手に入れた！`); return; }
    const n = o.n || 1;
    G.give(o.item, n);
    await G.say(null, null, `宝箱をあけた！\n${HR.ITEMS[o.item].name}${n > 1 ? ` を ${n} つ` : ''}を手に入れた！`);
  }

  /* =========================== warps, fades =========================== */
  G.fadeTo = (v, ms = 220) => GK.tween(R, { fade: v }, ms, GK.ease.inOutQuad);
  G.warp = async function (to, x, y, dir, o = {}) {
    await G.fadeTo(1, o.quiet ? 160 : 200);
    G.loadMap(to, x, y, dir);
    await GK.wait(40);
    await G.fadeTo(0, 220);
    G.autosave();
    const enter = HR.STORY.enter[to];
    if (enter) await enter(E);
  };
  G.autosave = () => { if (R.mode === 'field' && !G.noSave) GK.store.set('auto', snapshot()); };

  /* =========================== save / load =========================== */
  function snapshot() {
    return { v: 1, map: R.mapId, x: P.x, y: P.y, dir: P.dir, party: S.party.slice(), chars: JSON.parse(JSON.stringify(S.chars)), inv: Object.assign({}, S.inv), gold: S.gold, flags: Object.assign({}, S.flags), opened: Object.assign({}, S.opened), time: S.time, goal: S.goal, savedAt: Date.now(), lv: S.chars.koharu ? S.chars.koharu.lv : 1, place: HR.MAPS[R.mapId] ? HR.MAPS[R.mapId].name : '' };
  }
  G.snapshot = snapshot;
  G.applySave = function (d) {
    S.party = d.party.slice(); S.chars = JSON.parse(JSON.stringify(d.chars)); S.inv = Object.assign({}, d.inv); S.gold = d.gold;
    S.flags = Object.assign({}, d.flags); S.opened = Object.assign({}, d.opened); S.time = d.time || 0; S.goal = d.goal || '';
    G.loadMap(d.map, d.x, d.y, d.dir);
    // an event that was cut short (e.g. lost battle) starts again on arrival
    const enter = HR.STORY.enter[d.map];
    if (enter) setTimeout(() => runEvent(enter), 80);
  };
  const SLOTS = ['slot1', 'slot2', 'slot3'];
  G.latestSave = () => ['auto', ...SLOTS].map((k) => ({ k, d: GK.store.get(k, null) })).filter((x) => x.d).sort((a, b) => b.d.savedAt - a.d.savedAt)[0];
  const slotLabel = (k, d) => (d ? `${k === 'auto' ? 'オート' : '記録 ' + k.slice(4)}　Lv${d.lv}　${d.place}` : `${k === 'auto' ? 'オート' : '記録 ' + k.slice(4)}　―― なし ――`);
  const slotRight = (d) => (d ? fmtTime(d.time) : '');
  async function saveLantern() {
    GK.sfx('heal'); G.healAll();
    R.flash = { c: 'rgba(255,214,140,', t: 0.5 };
    await G.say(null, null, '灯籠に手を合わせた。体がぽかぽかと温かくなる……。\nHP と気が、すっかり回復した！');
    const c = await G.choose(['記録する', 'やめる']);
    if (c !== 0) return;
    await G.saveMenu();
  }
  G.saveMenu = async function () {
    const m = new Menu({ title: 'どこに記録しますか？', items: SLOTS.map((k) => { const d = GK.store.get(k, null); return { label: slotLabel(k, d), right: slotRight(d) }; }), x: 8, y: 8, w: V.W - 16 });
    while (true) {
      const i = await m.choose();
      if (i < 0) break;
      const k = SLOTS[i];
      if (GK.store.get(k, null)) { const ok = await G.choose(['上書きする', 'やめる']); if (ok !== 0) continue; }
      GK.store.set(k, snapshot()); GK.store.set('auto', snapshot());
      GK.sfx('save'); GK.toast(`記録 ${i + 1} に記録しました`);
      break;
    }
    m.close();
  };
  async function loadMenu() {
    const keys = ['auto', ...SLOTS];
    const m = new Menu({ title: 'どの記録から始めますか？', items: keys.map((k) => { const d = GK.store.get(k, null); return { label: slotLabel(k, d), right: slotRight(d), disabled: !d }; }), x: 8, y: Math.max(8, V.H - 104), w: V.W - 16 });
    const i = await m.choose();
    m.close();
    if (i < 0) return false;
    const d = GK.store.get(keys[i], null);
    if (!d) return false;
    await G.fadeTo(1, 250);
    hideTitle();
    G.applySave(d);
    await G.fadeTo(0, 300);
    return true;
  }

  /* =========================== field menu =========================== */
  function partyRows(o = {}) {
    const items = S.party.map((id) => ({ id, label: HR.CHARS[id].name }));
    return new Menu(Object.assign({
      items, x: 84, y: G.safeTop(), w: V.W - 88, rowH: 40, cancel: true, showSel: false,
      drawItem: (g, it, x, y, w) => drawMemberRow(g, it.id, x, y, w, 40),
    }, o));
  }
  function drawMemberRow(g, id, x, y, w, h) {
    const c = S.chars[id], s = G.stats(id);
    GFX.face(g, GK.images[HR.CHARS[id].face], x + 12, y + 4, 32, { dim: c.hp <= 0 });
    const tx = x + 50;
    GFX.text(g, HR.CHARS[id].name, tx, y + 4, { size: 11 });
    GFX.text(g, `Lv ${c.lv}`, x + w - 6, y + 5, { size: 10, align: 'right', color: '#e8dcc0' });
    const bw = w - 60 - 4;
    GFX.text(g, 'HP', tx, y + 18, { size: 8, color: '#9fd08a' });
    GFX.gauge(g, tx + 14, y + 20, bw - 52, 4, c.hp / s.hp, c.hp < s.hp * 0.3 ? '#e8604a' : '#7cc46a');
    GFX.text(g, `${c.hp}/${s.hp}`, x + w - 6, y + 17, { size: 9, align: 'right' });
    GFX.text(g, '気', tx, y + 28, { size: 8, color: '#8ab8e8' });
    GFX.gauge(g, tx + 14, y + 30, bw - 52, 4, s.mp ? c.mp / s.mp : 0, '#6aa0e0');
    GFX.text(g, `${c.mp}/${s.mp}`, x + w - 6, y + 27, { size: 9, align: 'right' });
    if (c.hp <= 0) GFX.text(g, '倒れている', tx + 40, y + 4, { size: 9, color: '#e8806a' });
  }
  G.drawMemberRow = drawMemberRow;
  function infoPanel() {
    return G.panel((g) => {
      const W = V.W, H = V.H, h = 34, y = H - h - 4;
      GFX.frame(g, 4, y, W - 8, h);
      GFX.text(g, '目的', 12, y + 5, { size: 9, color: '#d6b262' });
      GFX.text(g, S.goal || '―', 36, y + 4, { size: 10 });
      GFX.text(g, `${GK.fmt(S.gold)} 文`, 12, y + 19, { size: 10, color: '#f0d890' });
      GFX.text(g, `プレイ時間 ${fmtTime(S.time)}`, W - 12, y + 19, { size: 10, align: 'right', color: '#e8dcc0' });
    });
  }
  G.openMenu = async function () {
    if (!canControl() || P.moving) return;
    R.busy = true; ptr = null;
    GK.sfx('decide');
    const items = [{ label: 'どうぐ' }, { label: 'わざ' }, { label: 'そうび' }, { label: 'つよさ' }, { label: 'せってい' }, { label: 'タイトルへ' }];
    if (G.debug) items.push({ label: 'デバッグ', color: '#ffb0a0' });
    const info = infoPanel();
    const pm = partyRows();
    const m = new Menu({ items, x: 4, y: 4, w: 76 });
    try {
      while (true) {
        const i = await m.choose();
        if (i < 0) break;
        if (i === 0) await itemMenu(pm);
        else if (i === 1) await skillMenu(pm);
        else if (i === 2) await equipMenu(pm);
        else if (i === 3) await statusMenu(pm);
        else if (i === 4) await settingsMenu();
        else if (i === 5) { if ((await G.choose(['タイトルへもどる', 'やめる'])) === 0) { m.close(); pm.close(); G.pop(info); R.busy = false; return G.toTitle(); } }
        else if (i === 6) { const r = await debugMenu(); if (r === 'close') break; }
      }
    } catch (e) { if (e !== 'closeMenu') throw e; } finally { m.close(); pm.close(); G.pop(info); R.busy = false; }
  };
  async function pickMember(pm, filter) {
    pm.items.forEach((it) => (it.disabled = filter ? !filter(it.id) : false));
    pm.i = Math.max(0, pm.items.findIndex((it) => !it.disabled));
    const i = await pm.choose();
    pm.items.forEach((it) => (it.disabled = false));
    return i < 0 ? null : S.party[i];
  }
  function useItemOn(itemId, id) {
    const it = HR.ITEMS[itemId], c = S.chars[id], s = G.stats(id);
    if (it.revive) { if (c.hp > 0) return null; c.hp = Math.round(s.hp * it.revive); return `${HR.CHARS[id].name}が起き上がった！`; }
    if (c.hp <= 0) return null;
    const msg = [];
    if (it.heal) { if (c.hp >= s.hp) return null; const b = c.hp; c.hp = Math.min(s.hp, c.hp + it.heal); msg.push(`HP が ${c.hp - b} 回復`); }
    if (it.mpheal) { if (c.mp >= s.mp) return null; const b = c.mp; c.mp = Math.min(s.mp, c.mp + it.mpheal); msg.push(`気が ${c.mp - b} 回復`); }
    if (it.cure) return `${HR.CHARS[id].name}は元気だ（毒などは戦いが終わると治ります）`;
    return msg.length ? `${HR.CHARS[id].name}の${msg.join('・')}した！` : null;
  }
  async function itemMenu(pm) {
    const build = () => {
      const keys = Object.keys(S.inv).filter((k) => S.inv[k] > 0).sort((a, b) => kindOrder(a) - kindOrder(b));
      return keys.map((k) => ({ key: k, label: HR.ITEMS[k].name, right: HR.ITEMS[k].kind === 'key' ? '大事' : '×' + S.inv[k], desc: HR.ITEMS[k].desc + (HR.ITEMS[k].kind === 'battle' ? '（戦いの中で使う）' : '') }));
    };
    let items = build();
    if (!items.length) { await G.say(null, null, '何も持っていない。'); return; }
    const descH = 30;
    const m = new Menu({ items, x: 84, y: G.safeTop(), w: V.W - 88, rows: Math.max(3, Math.floor((V.H - G.safeTop() - descH - 12 - 8) / 14)), desc: { x: 4, y: V.H - descH - 4, w: V.W - 8, h: descH } });
    try {
      while (true) {
        const i = await m.choose();
        if (i < 0) return;
        const k = items[i].key, it = HR.ITEMS[k];
        if (it.kind === 'use' && (it.heal || it.mpheal || it.revive || it.cure)) {
          G.pop(pm); G.push(pm);
          const id = await pickMember(pm);
          if (!id) continue;
          const r = useItemOn(k, id);
          if (!r) { GK.sfx('ng'); GK.toast('使っても効果がない'); continue; }
          G.take(k); GK.sfx('heal'); GK.toast(r);
        } else if (it.kind === 'field') {
          if (['village', 'interior'].includes(R.map.def.style)) { GK.sfx('ng'); GK.toast('ここでは使えない'); continue; }
          G.take(k); m.close(); GK.sfx('holy');
          const V2 = HR.VILLAGE_RETURN;
          setTimeout(() => runEvent(async () => { await G.say(null, null, `${it.name}を使った！\n札がふわりと光り、体が軽くなった……。`); await G.warp(V2.map, V2.x, V2.y, V2.dir); }), 0);
          throw 'closeMenu';
        } else if (it.kind === 'w' || it.kind === 'a' || it.kind === 'c') { GK.toast('「そうび」から身につけられます'); }
        else if (it.kind === 'battle') { GK.sfx('ng'); GK.toast('戦いの中で使う道具です'); }
        else { GK.toast(it.desc); }
        items = build(); m.items = items; m.i = Math.min(m.i, items.length - 1);
        if (!items.length) return;
      }
    } finally { m.close(); }
  }
  const kindOrder = (k) => ({ use: 0, field: 1, battle: 2, w: 3, a: 4, c: 5, key: 6 })[HR.ITEMS[k].kind];
  async function skillMenu(pm) {
    while (true) {
      const id = await pickMember(pm);
      if (!id) return;
      const c = S.chars[id];
      const sks = HR.skillsAt(id, c.lv);
      const fieldOk = (k) => ['heal', 'revive', 'cure'].includes(HR.SKILLS[k].type);
      const mk = () => sks.map((k) => ({ key: k, label: HR.SKILLS[k].name, right: '気' + HR.SKILLS[k].mp, disabled: !fieldOk(k) || c.mp < HR.SKILLS[k].mp || c.hp <= 0, desc: HR.SKILLS[k].desc + (fieldOk(k) ? '' : '（戦いの中で使う）') }));
      const m = new Menu({ items: mk(), x: 84, y: G.safeTop(), w: V.W - 88, title: `${HR.CHARS[id].name}のわざ　気 ${c.mp}/${G.stats(id).mp}`, desc: { x: 4, y: V.H - 34, w: V.W - 8, h: 30 } });
      while (true) {
        const i = await m.choose();
        if (i < 0) break;
        const k = sks[i], sk = HR.SKILLS[k], st = G.stats(id);
        let targets;
        if (sk.target === 'allies') targets = S.party.filter((p) => S.chars[p].hp > 0);
        else { G.pop(pm); G.push(pm); const t = await pickMember(pm, sk.type === 'revive' ? (p) => S.chars[p].hp <= 0 : (p) => S.chars[p].hp > 0); G.pop(m); G.push(m); if (!t) continue; targets = [t]; }
        let did = false;
        for (const t of targets) {
          const tc = S.chars[t], ts = G.stats(t);
          if (sk.type === 'revive' && tc.hp <= 0) { tc.hp = Math.round(ts.hp * 0.5); did = true; }
          if (sk.type === 'heal' && tc.hp < ts.hp) { tc.hp = Math.min(ts.hp, tc.hp + HR.healAmt(sk.power, st.spi, sk.k, Math.random())); did = true; }
        }
        if (!did) { GK.sfx('ng'); GK.toast('使っても効果がない'); continue; }
        c.mp -= sk.mp; GK.sfx('heal'); GK.toast(`${HR.CHARS[id].name}の${sk.name}！`);
        m.items = mk(); m.title = `${HR.CHARS[id].name}のわざ　気 ${c.mp}/${G.stats(id).mp}`;
      }
      m.close();
    }
  }
  function statDiff(id, slot, itemId) {
    const c = S.chars[id], before = HR.charStats(id, c);
    const eq = Object.assign({}, c.eq, { [slot]: itemId });
    const after = HR.charStats(id, Object.assign({}, c, { eq }));
    return ['atk', 'def', 'agi', 'spi'].filter((k) => before[k] !== after[k]).map((k) => `${HR.STAT_NAMES[k]} ${before[k]}→${after[k]}${after[k] > before[k] ? '↑' : '↓'}`).join('　') || '変化なし';
  }
  G.statDiff = statDiff;
  async function equipMenu(pm) {
    while (true) {
      const id = await pickMember(pm);
      if (!id) return;
      const c = S.chars[id];
      const slots = ['w', 'a', 'c'];
      const mkSlots = () => slots.map((s) => ({ label: `${HR.SLOT_NAMES[s]}：${c.eq[s] ? HR.ITEMS[c.eq[s]].name : 'なし'}`, desc: c.eq[s] ? HR.ITEMS[c.eq[s]].desc : '何も身につけていない' }));
      const sm = new Menu({ items: mkSlots(), x: 84, y: G.safeTop(), w: V.W - 88, title: `${HR.CHARS[id].name}のそうび`, desc: { x: 4, y: V.H - 34, w: V.W - 8, h: 30 } });
      while (true) {
        const si = await sm.choose();
        if (si < 0) break;
        const slot = slots[si];
        const cands = Object.keys(S.inv).filter((k) => S.inv[k] > 0 && HR.ITEMS[k].kind === slot && HR.canEquip(id, k));
        const items = cands.map((k) => ({ key: k, label: HR.ITEMS[k].name, right: '×' + S.inv[k], desc: () => statDiff(id, slot, k) + '　' + HR.ITEMS[k].desc }));
        if (c.eq[slot]) items.push({ key: null, label: 'はずす', desc: () => statDiff(id, slot, null) });
        if (!items.length) { GK.sfx('ng'); GK.toast('身につけられる物を持っていない'); continue; }
        const ly = sm.y + sm.h + 2;
        const lm = new Menu({ items, x: 96, y: ly, w: V.W - 100, rows: Math.max(2, Math.min(items.length, Math.floor((V.H - ly - 34 - 4 - 10) / 14))), desc: { x: 4, y: V.H - 34, w: V.W - 8, h: 30 } });
        const li = await lm.choose();
        lm.close();
        if (li < 0) continue;
        const k = items[li].key;
        if (c.eq[slot]) G.give(c.eq[slot]);
        if (k) G.take(k);
        c.eq[slot] = k;
        const s = G.stats(id); c.hp = Math.min(c.hp, s.hp); c.mp = Math.min(c.mp, s.mp);
        GK.sfx('decide');
        sm.items = mkSlots();
      }
      sm.close();
    }
  }
  async function statusMenu(pm) {
    while (true) {
      const id = await pickMember(pm);
      if (!id) return;
      await new Promise((resolve) => {
        const L = G.push({
          wants: () => true, key: () => { G.pop(L); GK.sfx('cancel'); resolve(); }, tap: () => { G.pop(L); resolve(); },
          draw: (g) => drawStatus(g, id),
        });
      });
    }
  }
  function drawStatus(g, id) {
    const W = V.W, H = V.H, c = S.chars[id], s = G.stats(id), ch = HR.CHARS[id];
    GFX.frame(g, 4, 4, W - 8, H - 8);
    const fs = Math.min(84, H * 0.32);
    GFX.face(g, GK.images[ch.face], 12, 12, fs, { full: true });
    const x = 20 + fs;
    GFX.text(g, ch.name, x, 14, { size: 14 });
    GFX.text(g, ch.role, x, 32, { size: 10, color: '#d6b262' });
    GFX.text(g, `Lv ${c.lv}　　次のレベルまで ${c.lv >= HR.MAX_LV ? '―' : HR.expTotal(c.lv + 1) - c.exp}`, x, 48, { size: 10 });
    GFX.text(g, `HP ${c.hp} / ${s.hp}　　気 ${c.mp} / ${s.mp}`, x, 63, { size: 10 });
    const sy = Math.max(84, fs + 20);
    ['atk', 'def', 'agi', 'spi'].forEach((k, i) => GFX.text(g, `${HR.STAT_NAMES[k]} ${s[k]}`, 14 + i * 56, sy, { size: 11 }));
    GFX.text(g, 'そうび', 14, sy + 20, { size: 9, color: '#d6b262' });
    ['w', 'a', 'c'].forEach((k, i) => GFX.text(g, `${HR.SLOT_NAMES[k]}　${c.eq[k] ? HR.ITEMS[c.eq[k]].name : 'なし'}`, 14, sy + 33 + i * 13, { size: 10 }));
    const sx = Math.min(W / 2 + 10, 180);
    GFX.text(g, 'わざ', sx, sy + 20, { size: 9, color: '#d6b262' });
    HR.skillsAt(id, c.lv).forEach((k, i) => GFX.text(g, `${HR.SKILLS[k].name}（気${HR.SKILLS[k].mp}）`, sx + (i >= 4 ? 84 : 0), sy + 33 + (i % 4) * 13, { size: 10 }));
    GFX.wrap(g, ch.desc, W - 28, 10).slice(0, 2).forEach((l, i) => GFX.text(g, l, 14, H - 36 + i * 13, { size: 10, color: '#e8dcc0' }));
  }
  async function settingsMenu() {
    const SPD = ['おそい', 'ふつう', 'はやい', 'すぐ'];
    const mk = () => [{ label: '文字の速さ', right: SPD[SETTINGS.textSpeed] }, { label: 'BGM の音量', right: '●'.repeat(SETTINGS.bgm) + '○'.repeat(3 - SETTINGS.bgm) }, { label: 'もどる' }];
    const m = new Menu({ items: mk(), x: 84, y: G.safeTop(), w: Math.min(200, V.W - 88), onSide: (d, i) => change(i, d), sideTap: true });
    function change(i, d) {
      if (i === 0) SETTINGS.textSpeed = (SETTINGS.textSpeed + d + 4) % 4;
      if (i === 1) { SETTINGS.bgm = (SETTINGS.bgm + d + 4) % 4; AU.setVolume(SETTINGS.bgm / 3); }
      saveSettings(); GK.sfx('cursor'); m.items = mk();
    }
    while (true) { const i = await m.choose(); if (i < 0 || i === 2) break; change(i, 1); }
    m.close();
  }

  /* =========================== shops & inn =========================== */
  G.shop = async function (kind) {
    const sh = HR.SHOPS[kind];
    const goldPanel = G.panel((g) => { const w = 96; GFX.frame(g, 4, 4, w, 20); GFX.text(g, `${GK.fmt(S.gold)} 文`, 4 + w - 8, 8, { size: 10, align: 'right', color: '#f0d890' }); GFX.text(g, '所持金', 12, 8.5, { size: 9, color: '#d6b262' }); });
    const top = new Menu({ items: [{ label: '買う' }, { label: '売る' }, { label: 'やめる' }], x: 4, y: 28, w: 76 });
    try {
      while (true) {
        const i = await top.choose();
        if (i < 0 || i === 2) break;
        if (i === 0) await buy(sh);
        else await sell();
      }
    } finally { top.close(); G.pop(goldPanel); }
  };
  function equipNote(k) {
    const it = HR.ITEMS[k];
    if (!['w', 'a', 'c'].includes(it.kind)) return it.desc + `（いま ${S.inv[k] || 0} 個）`;
    const who = S.party.filter((id) => HR.canEquip(id, k));
    if (!who.length) return it.desc + '　※いまの仲間は装備できない';
    return who.map((id) => `${HR.CHARS[id].name}：${S.chars[id].eq[it.kind] === k ? '装備中' : statDiff(id, it.kind, k)}`).join('　');
  }
  async function buy(sh) {
    const list = sh.list.filter(([, f]) => !f || S.flags[f]).map(([k]) => k);
    const items = list.map((k) => ({ key: k, label: HR.ITEMS[k].name, right: HR.ITEMS[k].price + '文', desc: () => equipNote(k) }));
    const m = new Menu({ items, x: 84, y: G.safeTop(), w: V.W - 88, rows: Math.max(3, Math.min(items.length, Math.floor((V.H - 48 - G.safeTop()) / 14))), desc: { x: 4, y: V.H - 40, w: V.W - 8, h: 36 } });
    try {
      while (true) {
        const i = await m.choose();
        if (i < 0) return;
        const k = list[i], it = HR.ITEMS[k];
        const n = await qtyPicker(k);
        if (!n) continue;
        if (S.gold < it.price * n) { GK.sfx('ng'); GK.toast('お金が足りない'); continue; }
        S.gold -= it.price * n; G.give(k, n); GK.sfx('coin');
        GK.toast(`${it.name}を ${n} つ買った`);
        if (['w', 'a', 'c'].includes(it.kind)) {
          const who = S.party.filter((id) => HR.canEquip(id, k) && S.chars[id].eq[it.kind] !== k);
          if (who.length) {
            const opts = who.map((id) => `${HR.CHARS[id].name}が装備する`).concat(['あとで']);
            const c = await G.choose(opts);
            if (c >= 0 && c < who.length) { const id = who[c], ch = S.chars[id]; if (ch.eq[it.kind]) G.give(ch.eq[it.kind]); G.take(k); ch.eq[it.kind] = k; GK.sfx('decide'); GK.toast(`${HR.CHARS[id].name}は${it.name}を身につけた`); }
          }
        }
      }
    } finally { m.close(); }
  }
  function qtyPicker(k) {
    const it = HR.ITEMS[k];
    return new Promise((resolve) => {
      let n = 1;
      const max = () => Math.max(1, Math.min(99, Math.floor(S.gold / it.price) || 1));
      const w = 150, h = 46, x = V.W - w - 6, y = V.H - 40 - h - 6;
      const L = G.push({
        wants: () => true,
        key(a) {
          if (a === 'left' || a === 'down') { n = n > 1 ? n - 1 : max(); GK.sfx('cursor'); }
          if (a === 'right' || a === 'up') { n = n < max() ? n + 1 : 1; GK.sfx('cursor'); }
          if (a === 'ok') { G.pop(L); GK.sfx('decide'); resolve(n); }
          if (a === 'cancel' || a === 'menu') { G.pop(L); GK.sfx('cancel'); resolve(0); }
        },
        tap(p) {
          if (p.x < x || p.x > x + w || p.y < y || p.y > y + h) { G.pop(L); resolve(0); return; }
          if (p.x < x + 40) L.key('left'); else if (p.x > x + w - 40 && p.y < y + 26) L.key('right'); else L.key('ok');
        },
        draw(g) {
          GFX.frame(g, x, y, w, h);
          GFX.text(g, 'いくつ買いますか？', x + 8, y + 6, { size: 9, color: '#d6b262' });
          GFX.text(g, `◀　${n}　▶`, x + 40, y + 22, { size: 12, align: 'center' });
          GFX.text(g, `${it.price * n} 文`, x + w - 8, y + 23, { size: 11, align: 'right', color: S.gold >= it.price * n ? '#f0d890' : '#e8806a' });
        },
      });
    });
  }
  async function sell() {
    while (true) {
      const keys = Object.keys(S.inv).filter((k) => S.inv[k] > 0 && HR.ITEMS[k].kind !== 'key');
      if (!keys.length) { await G.say(null, null, '売れる物を持っていない。'); return; }
      const items = keys.map((k) => ({ key: k, label: `${HR.ITEMS[k].name}×${S.inv[k]}`, right: Math.floor(HR.ITEMS[k].price / 2) + '文', desc: HR.ITEMS[k].desc }));
      const m = new Menu({ items, x: 84, y: G.safeTop(), w: V.W - 88, rows: Math.max(3, Math.min(items.length, Math.floor((V.H - 48 - G.safeTop()) / 14))), desc: { x: 4, y: V.H - 40, w: V.W - 8, h: 36 } });
      const i = await m.choose();
      m.close();
      if (i < 0) return;
      const k = keys[i];
      const c = await G.choose([`${Math.floor(HR.ITEMS[k].price / 2)} 文で売る`, 'やめる']);
      if (c !== 0) continue;
      G.take(k); S.gold += Math.floor(HR.ITEMS[k].price / 2); GK.sfx('coin');
    }
  }
  G.inn = async function () {
    const c = await G.choose([`泊まる（${HR.INN_PRICE}文）`, 'やめる']);
    if (c !== 0) { await G.say('おかみ', null, 'またどうぞ。気をつけていってらっしゃい。'); return; }
    if (S.gold < HR.INN_PRICE) { await G.say('おかみ', null, 'あらあら、お代が足りないみたいね。……里の灯籠に手を合わせれば、少しは疲れもとれますよ。'); return; }
    S.gold -= HR.INN_PRICE;
    await G.say('おかみ', null, 'ごゆっくりどうぞ。');
    await G.fadeTo(1, 500);
    AU.stop();
    GK.sfx('save');
    G.healAll();
    await GK.wait(1400);
    AU.play(R.map.def.music, true);
    await G.fadeTo(0, 500);
    await G.say('おかみ', null, 'おはようございます。ゆうべは、よく眠れました？');
  };

  /* =========================== title, prologue, ending, game over =========================== */
  const titleEl = $('#title');
  function hideTitle() { titleEl.hidden = true; }
  function showTitle() { titleEl.hidden = false; }
  G.toTitle = async function () {
    await G.fadeTo(1, 300);
    layers.length = 0;
    R.mode = 'title'; R.map = null; R.busy = false;
    showTitle(); updateTopbar();
    AU.play('title');
    await G.fadeTo(0, 400);
    titleMenu();
  };
  async function titleMenu() {
    while (R.mode === 'title') {
      const has = !!G.latestSave();
      const rec = GK.store.get('records', null);
      const items = [{ label: 'はじめから' }, { label: 'つづきから', disabled: !has }, { label: 'クリアの記録', disabled: !rec }];
      const w = 128;
      const m = new Menu({ items, x: (V.W - w) / 2, y: Math.round(V.H * 0.62), w, cancel: false, i: has ? 1 : 0, size: 12, rowH: 17, noAuto: true });
      const i = await m.choose();
      m.close();
      if (R.mode !== 'title') return;
      if (i === 0) {
        if (has && (await G.choose(['はじめから遊ぶ', 'やめる'], { y: Math.round(V.H * 0.62) - 8 })) !== 0) continue;
        return G.newGame();
      }
      if (i === 1) { if (await loadMenu()) return; }
      if (i === 2 && rec) {
        await GK.modal({ title: 'クリアの記録', body: `<p>クリアした回数：<b>${rec.clears} 回</b></p><p>いちばん速いクリア：<b>${fmtTime(rec.best)}</b></p><p>最後のクリア：${new Date(rec.last).toLocaleDateString('ja-JP')}（Lv ${rec.lv}）</p>`, buttons: [{ label: '閉じる', primary: true }] });
      }
    }
  }
  G.newGame = async function (o = {}) {
    await G.fadeTo(1, 400);
    hideTitle();
    layers.length = 0;
    S.party = ['koharu']; S.chars = { koharu: G.newChar('koharu', 1) }; S.inv = {}; S.gold = 0; S.flags = {}; S.opened = {}; S.time = 0; S.goal = '';
    R.mode = 'prologue';
    AU.play('title');
    await G.fadeTo(0, 300);
    if (!o.skipPrologue) await HR.STORY.prologue(E);
    await G.fadeTo(1, 300);
    G.loadMap('home', 5, 4, 'up');
    R.banner = null;
    await G.fadeTo(0, 500);
    await runEvent(HR.STORY.opening);
  };
  G.gameOver = async function () {
    layers.length = 0;
    R.mode = 'gameover';
    AU.play('gameover');
    await G.fadeTo(0, 300);
    await GK.wait(600);
    const save = G.latestSave();
    const items = [{ label: '最後の記録から', disabled: !save }, { label: 'タイトルへ' }];
    const w = 130;
    const m = new Menu({ items, x: (V.W - w) / 2, y: Math.round(V.H * 0.58), w, cancel: false, i: save ? 0 : 1 });
    const i = await m.choose();
    m.close();
    await G.fadeTo(1, 400);
    if (i === 0 && save) {
      G.applySave(save.d);
      G.healAll();
      await G.fadeTo(0, 400);
      GK.toast('灯籠の加護で、HP と気が回復した');
    } else {
      G.toTitle();
    }
    throw G.GAMEOVER;
  };
  G.ending = async function () {
    R.mode = 'ending';
    layers.length = 0;
    const rec = GK.store.get('records', { clears: 0, best: 0 });
    rec.clears = (rec.clears || 0) + 1;
    rec.best = rec.best ? Math.min(rec.best, S.time) : S.time;
    rec.last = Date.now(); rec.lv = S.chars.koharu.lv;
    GK.store.set('records', rec);
    R.endT = 0; R.endTime = S.time;
    AU.play('ending');
    await G.fadeTo(0, 1200);
    await HR.STORY.ending(E);
    R.credits = { t: 0 };
    await new Promise((resolve) => {
      const L = G.push({ wants: () => R.credits && R.credits.t > 3, key: (a) => { if (a === 'ok' || a === 'cancel') { if (R.credits.t < R.credits.len) R.credits.t = R.credits.len; else { G.pop(L); resolve(); } } }, tap: () => L.key('ok'), draw: () => {} });
      if (G.autoMsg) setTimeout(() => { G.pop(L); resolve(); }, 300);
    });
    R.credits = null;
    await G.fadeTo(1, 1000);
    G.toTitle();
  };

  /* =========================== event API (for story.js) =========================== */
  const SPK = () => HR.SPEAKERS || {};
  const E = (G.E = {
    say: (spk, text) => { const s = SPK()[spk]; return G.say(s ? s[0] : spk, s ? s[1] : null, text); },
    narr: (text) => G.narr(text),
    msg: (text) => G.say(null, null, text),
    choice: (opts) => G.choose(opts, { cancel: true }),
    flag: (k) => !!S.flags[k],
    set: (k, v = true) => { S.flags[k] = v; },
    has: (id) => S.party.includes(id),
    join: async (id) => {
      if (S.party.includes(id)) return;
      const lv = Math.max(S.chars.koharu.lv, id === 'suzu' ? 5 : 2);
      S.chars[id] = G.newChar(id, lv); S.party.push(id);
      GK.sfx('levelup');
      await G.say(null, null, `${HR.CHARS[id].name}が仲間になった！`);
    },
    give: (item, n = 1) => G.give(item, n),
    gold: (n) => { S.gold += n; },
    battle: (group, o = {}) => G.battle(HR.GROUPS[group] || group, Object.assign({ bg: R.map ? R.map.def.bg : 'bg-field' }, o)),
    goal: (t) => { S.goal = t; GK.toast('目的：' + t, 2600); },
    wait: (ms) => GK.wait(G.autoMsg ? Math.min(ms, 30) : ms),
    fade: (v, ms) => G.fadeTo(v, ms),
    music: (n) => AU.play(n),
    sfx: (n) => GK.sfx(n),
    heal: () => G.healAll(),
    inn: () => G.inn(),
    shop: (k) => G.shop(k),
    obj: (id) => R.map.objs.find((o) => o.id === id),
    face: (dir) => { P.dir = dir; },
    shake: (s = 0.4) => { R.shake = s; },
    flash: (c = 'rgba(255,255,255,', t = 0.4) => { R.flash = { c, t }; },
    warp: (m, x, y, d) => G.warp(m, x, y, d),
    autosave: () => G.autosave(),
    ending: () => G.ending(),
    map: () => R.mapId,
    lv: () => S.chars.koharu.lv,
    S, R, P,
  });

  /* =========================== particles & drawing =========================== */
  function updateParts(dt) {
    const amb = R.map && R.map.def.ambient;
    const want = amb === 'fireflies' ? 16 : amb === 'dust' ? 22 : amb === 'wisps' ? 12 : R.map && R.map.def.style === 'field' ? 6 : R.map && R.map.def.style === 'village' ? 5 : 0;
    while (R.parts.length < want) R.parts.push({ x: Math.random() * V.W, y: Math.random() * V.H, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 6, ph: Math.random() * 6 });
    for (const p of R.parts) {
      p.ph += dt;
      if (amb === 'dust') { p.vy = 3; p.vx = Math.sin(p.ph) * 3; }
      else if (!amb) { p.vy = 9; p.vx = 6 + Math.sin(p.ph * 2) * 4; }
      else { p.vx += (Math.random() - 0.5) * dt * 20; p.vy += (Math.random() - 0.5) * dt * 20; p.vx *= 0.98; p.vy *= 0.98; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -4) p.x += V.W + 8; if (p.x > V.W + 4) p.x -= V.W + 8; if (p.y < -4) p.y += V.H + 8; if (p.y > V.H + 4) p.y -= V.H + 8;
    }
  }
  function drawParts(g) {
    const amb = R.map.def.ambient;
    g.save();
    for (const p of R.parts) {
      if (amb === 'fireflies') { const a = 0.4 + 0.6 * Math.max(0, Math.sin(p.ph * 2.2)); g.fillStyle = `rgba(220,255,140,${a * 0.25})`; g.beginPath(); g.arc(p.x, p.y, 3, 0, 7); g.fill(); g.fillStyle = `rgba(240,255,190,${a})`; g.fillRect(p.x - 0.5, p.y - 0.5, 1.2, 1.2); }
      else if (amb === 'dust') { g.fillStyle = 'rgba(220,210,190,.35)'; g.fillRect(p.x, p.y, 1, 1); }
      else if (amb === 'wisps') { const a = 0.5 + 0.5 * Math.sin(p.ph * 1.5); g.fillStyle = `rgba(150,130,255,${0.18 * a})`; g.beginPath(); g.arc(p.x, p.y, 4, 0, 7); g.fill(); g.fillStyle = `rgba(210,200,255,${0.8 * a})`; g.fillRect(p.x - 0.6, p.y - 0.6, 1.4, 1.4); }
      else { g.fillStyle = R.map.def.style === 'village' ? 'rgba(255,190,210,.8)' : 'rgba(255,255,230,.55)'; g.fillRect(p.x, p.y, 2, 1); }
    }
    g.restore();
  }
  function drawField(g) {
    const m = R.map, W = V.W, H = V.H;
    let cx = Math.round(R.cam.x), cy = Math.round(R.cam.y);
    if (R.shake > 0) { cx += Math.round((Math.random() - 0.5) * 4); cy += Math.round((Math.random() - 0.5) * 4); }
    g.fillStyle = '#0b0a10'; g.fillRect(0, 0, W, H);
    if (m.border && (cx < 0 || cy < 0 || cx + W > m.w * TS || cy + H > m.h * TS)) { g.save(); g.imageSmoothingEnabled = false; g.translate(-cx, -cy); g.fillStyle = m.border; g.fillRect(cx, cy, W, H); g.restore(); g.fillStyle = 'rgba(6,5,14,.35)'; g.fillRect(0, 0, W, H); }
    g.imageSmoothingEnabled = false;
    const img = m.img[Math.floor(R.t * 1.6) % 2];
    const sx = Math.max(0, cx), sy = Math.max(0, cy), dx = sx - cx, dy = sy - cy;
    const sw = Math.min(img.width - sx, W - dx), sh = Math.min(img.height - sy, H - dy);
    if (sw > 0 && sh > 0) g.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
    // sprites sorted by their feet
    const list = [];
    for (const o of m.objs) { if (G.objHidden(o) || o.t === 'warp') continue; list.push({ y: o.fy + 15, d: () => drawObj(g, o, o.fx - cx, o.fy - cy) }); }
    for (const d of m.decos) { if (d.hideIf && S.flags[d.hideIf]) continue; list.push({ y: d.y * TS + 15, d: () => drawDeco(g, d, cx, cy) }); }
    const n = S.party.length;
    for (let k = n - 1; k >= 0; k--) {
      const a = P.hist[k + 1] || P.hist[k], b = P.hist[k];
      const t = P.moving ? P.t : 1;
      const x = GK.lerp(a.x, b.x, t) * TS, y = GK.lerp(a.y, b.y, t) * TS;
      let dir = P.dir;
      if (k > 0) dir = b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : b.y < a.y ? 'up' : (P.hist[k].dir || P.dir);
      const step = P.moving ? Math.floor(P.walkT * 7) % 4 : 0;
      const id = S.party[k];
      list.push({ y: y + 15 + (k === 0 ? 0.5 : -k * 0.01), d: () => drawChar(g, id, dir, step, x - cx, y - cy) });
    }
    list.sort((p, q) => p.y - q.y).forEach((it) => it.d());
    // darkness & lights
    const dark = m.def.dark || 0;
    if (dark) {
      const px = P.px - cx + 8, py = P.py - cy + 4;
      const gr = g.createRadialGradient(px, py, 26, px, py, Math.max(W, H) * 0.62);
      gr.addColorStop(0, 'rgba(6,5,18,0)'); gr.addColorStop(1, `rgba(6,5,18,${dark + 0.2})`);
      g.fillStyle = `rgba(6,5,18,${dark * 0.35})`; g.fillRect(0, 0, W, H);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const o of m.objs) {
        const lit = o.t === 'save' || (o.t === 'lantern' && S.flags['lit_' + o.id]) || (o.t === 'kage' && S.flags[o.id]);
        const shadow = o.t === 'kage' && !S.flags[o.id];
        if (!lit && !shadow) continue;
        const lx = o.fx - cx + 8, ly = o.fy - cy + 2, r = 26 + Math.sin(R.t * 3 + o.x) * 2;
        const lg = g.createRadialGradient(lx, ly, 1, lx, ly, r);
        lg.addColorStop(0, shadow ? 'rgba(120,70,200,.35)' : 'rgba(255,170,80,.42)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = lg; g.fillRect(lx - r, ly - r, r * 2, r * 2);
      }
      g.restore();
    } else if (m.def.style === 'interior') {
      const gr = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.7);
      gr.addColorStop(0, 'rgba(255,200,120,.05)'); gr.addColorStop(1, 'rgba(10,6,4,.35)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    drawParts(g);
    if (R.banner) {
      const b = R.banner, a = Math.min(1, b.t * 3, (3.2 - b.t) * 2.5);
      g.save(); g.globalAlpha = Math.max(0, a);
      g.font = GFX.font(13, 700, true);
      const w = g.measureText(b.text).width + 34;
      const gr = g.createLinearGradient(6, 0, 6 + w, 0); gr.addColorStop(0, 'rgba(12,12,26,.85)'); gr.addColorStop(0.8, 'rgba(12,12,26,.6)'); gr.addColorStop(1, 'rgba(12,12,26,0)');
      g.fillStyle = gr; g.fillRect(6, 8, w, 24);
      g.fillStyle = '#d6b262'; g.fillRect(6, 8, 2, 24);
      GFX.text(g, b.text, 16, 13, { size: 13, serif: true, color: '#f6ead0' });
      g.restore();
    }
  }
  function drawShadow(g, x, y, w = 6) { g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x + 8, y + 15, w, 2.2, 0, 0, 7); g.fill(); }
  function drawChar(g, id, dir, step, x, y) {
    x = Math.round(x); y = Math.round(y);
    const pal = GFX.PAL[id];
    drawShadow(g, x, y);
    if (pal && pal.float) { const b = Math.round(Math.sin(R.t * 3) * 1.5) - 2; g.drawImage(GFX.person(id, dir, 0), x, y - 4 + b); return; }
    g.drawImage(GFX.person(id, dir, step), x, y - 4);
  }
  function drawObj(g, o, x, y) {
    x = Math.round(x); y = Math.round(y);
    if (o.t === 'npc') {
      if (o.spr === 'cat') { drawShadow(g, x, y, 5); g.drawImage(GFX.cat(o.dir, o.step || (Math.floor(R.t * 2) % 2)), x, y - 4); return; }
      drawChar(g, o.spr, o.dir, o.step || 0, x, y);
      if (o.trapped) { g.strokeStyle = '#4a3220'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 2 + i * 9, y + 16); g.quadraticCurveTo(x + 8, y - 4 - i * 3, x + 18 - i * 9, y + 14); g.stroke(); } }
      return;
    }
    if (o.t === 'chest') { g.drawImage(GFX.chest(S.opened[o.id]), x, y); return; }
    if (o.t === 'save') { GFX.stoneLantern(g, x, y - 4, 'save', R.t); const a = 0.25 + Math.sin(R.t * 3) * 0.08; g.fillStyle = `rgba(255,200,110,${a})`; g.beginPath(); g.arc(x + 8, y + 4, 9, 0, 7); g.fill(); return; }
    if (o.t === 'sign') { g.drawImage(GFX.sign(), x, y); return; }
    if (o.t === 'boulder') { g.drawImage(GFX.boulder(), x, y); return; }
    if (o.t === 'lantern') { GFX.stoneLantern(g, x, y - 4, S.flags['lit_' + o.id] ? 'lit' : 'none', R.t); return; }
    if (o.t === 'kage') { GFX.stoneLantern(g, x, y - 4, S.flags[o.id] ? 'lit' : 'shadow', R.t); return; }
    if (o.t === 'deco') {
      if (o.kind === 'jizo') g.drawImage(GFX.jizo(), x, y - 4);
      else if (o.kind === 'oak') g.drawImage(GFX.oak(S.flags.forest), x - 24, y - 44);
      else if (o.kind === 'spring') g.drawImage(GFX.spring(R.t), x, y);
      return;
    }
    if (o.t === 'barrier') {
      if (S.flags[o.flag]) return;
      if (o.kind === 'mist') { for (let i = 0; i < 3; i++) { const a = 0.35 + 0.15 * Math.sin(R.t * 1.5 + i + o.x); g.fillStyle = `rgba(230,236,240,${a})`; g.beginPath(); g.arc(x + 4 + i * 4 + Math.sin(R.t + i) * 2, y + 6 + (i % 2) * 5, 7, 0, 7); g.fill(); } }
      else if (o.kind === 'rope') {
        g.fillStyle = '#5a3e26'; g.fillRect(x, y - 2, 2, 18); g.fillRect(x + 14, y - 2, 2, 18);
        g.strokeStyle = '#d8c08a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x + 8, y + 7, x + 16, y + 2); g.stroke();
        g.fillStyle = '#fff'; for (const sx2 of [4, 10]) { g.beginPath(); g.moveTo(x + sx2, y + 4); g.lineTo(x + sx2 + 2, y + 7); g.lineTo(x + sx2, y + 9); g.lineTo(x + sx2 + 2, y + 12); g.lineTo(x + sx2 + 1, y + 12); g.lineTo(x + sx2 - 1, y + 9); g.lineTo(x + sx2 + 1, y + 7); g.fill(); }
      } else if (o.kind === 'shadow') { for (let i = 0; i < 4; i++) { const a = 0.4 + 0.2 * Math.sin(R.t * 2 + i * 1.7 + o.x); g.fillStyle = `rgba(40,20,70,${a})`; g.beginPath(); g.arc(x + 8 + Math.sin(R.t * 1.3 + i * 2) * 4, y + 8 + Math.cos(R.t * 1.1 + i) * 4, 7, 0, 7); g.fill(); } g.fillStyle = 'rgba(155,107,214,.5)'; g.fillRect(x + 7 + Math.sin(R.t * 3 + o.x) * 4, y + 6, 1.5, 1.5); }
    }
  }
  function drawDeco(g, d, cx, cy) {
    const x = Math.round(d.x * TS - cx), y = Math.round(d.y * TS - cy);
    if (d.kind === 'torii') g.drawImage(GFX.torii(d.w), x, y - 32);
    else if (d.kind === 'hanzaki') g.drawImage(GFX.hanzaki(R.t), x - 36, y - 16);
    else if (d.kind === 'yoigurai') { g.save(); g.globalAlpha = 0.85 + Math.sin(R.t * 2) * 0.1; g.drawImage(GFX.yoigurai(R.t), x - 28, y - 46 + Math.sin(R.t * 1.5) * 2); g.restore(); }
  }
  // title / prologue / ending backgrounds
  const motes = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random(), ph: Math.random() * 6 }));
  function drawMotes(g, a = 1) {
    const W = V.W, H = V.H;
    for (const m of motes) {
      const y = ((m.y - R.t * 0.012 * m.s) % 1 + 1) % 1, x = m.x + Math.sin(R.t * 0.5 + m.ph) * 0.01;
      const al = a * (0.35 + 0.35 * Math.sin(R.t * 1.4 + m.ph));
      g.fillStyle = `rgba(255,190,110,${al * 0.25})`; g.beginPath(); g.arc(x * W, y * H, 3.5 * m.s, 0, 7); g.fill();
      g.fillStyle = `rgba(255,226,170,${al})`; g.beginPath(); g.arc(x * W, y * H, 1 * m.s, 0, 7); g.fill();
    }
  }
  function drawTitle(g) {
    const W = V.W, H = V.H;
    const img = W / H < 1.05 ? GK.images['title-bg'] : GK.images.key;
    GFX.cover(g, img, 0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(10,8,24,.45)'); gr.addColorStop(0.45, 'rgba(10,8,24,.15)'); gr.addColorStop(1, 'rgba(10,8,24,.8)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    drawMotes(g);
    GFX.text(g, GK.isTouch ? 'A：決定　B：もどる' : 'Z・Enter：決定　X・Esc：もどる　矢印キー：選ぶ', W / 2, H - 13, { size: 8, align: 'center', color: 'rgba(246,234,208,.6)' });
  }
  function drawPrologueBg(g) {
    const W = V.W, H = V.H;
    g.fillStyle = '#0a0916'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(W / 2, H * 0.9, 10, W / 2, H * 0.9, H);
    gr.addColorStop(0, 'rgba(120,60,40,.35)'); gr.addColorStop(1, 'rgba(10,9,22,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // mountains silhouette
    g.fillStyle = '#141228';
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, H * 0.72 - Math.sin(x * 0.02) * 18 - Math.sin(x * 0.051 + 1) * 10); g.lineTo(W, H); g.fill();
    g.fillStyle = '#0d0c1c';
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, H * 0.82 - Math.sin(x * 0.03 + 2) * 10); g.lineTo(W, H); g.fill();
    // the shrine light on the mountain (goes out with the flag)
    if (!R.lightOut) { const a = 0.6 + Math.sin(R.t * 3) * 0.1; const lx = W * 0.62, ly = H * 0.6; const lg = g.createRadialGradient(lx, ly, 1, lx, ly, 22); lg.addColorStop(0, `rgba(255,200,120,${a})`); lg.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = lg; g.fillRect(lx - 22, ly - 22, 44, 44); }
    drawMotes(g, R.lightOut ? 0.3 : 0.8);
  }
  function drawEnding(g) {
    const W = V.W, H = V.H;
    GFX.cover(g, GK.images['cg-ending'], 0, 0, W, H);
    g.fillStyle = 'rgba(8,6,20,.25)'; g.fillRect(0, 0, W, H);
    drawMotes(g);
    if (R.credits) {
      const c = R.credits;
      const lines = HR.STORY.credits(fmtTime(R.endTime), S.chars.koharu.lv);
      const lh = 18, total = lines.length * lh + H;
      c.len = total / 22;
      const y0 = H - c.t * 22;
      g.fillStyle = 'rgba(8,6,20,.55)'; g.fillRect(0, 0, W, H);
      lines.forEach((ln, i) => {
        const y = y0 + i * lh;
        if (y < -20 || y > H + 10) return;
        GFX.text(g, ln.t, W / 2, y, { size: ln.big ? 16 : ln.head ? 9 : 11, align: 'center', serif: !!(ln.big || ln.t.length < 14), color: ln.head ? '#d6b262' : '#f6ead0' });
      });
      if (c.t >= c.len) GFX.text(g, 'おわり', W / 2, H / 2 - 8, { size: 18, align: 'center', serif: true, color: '#fff2d0' });
    }
  }
  function drawGameOver(g) {
    const W = V.W, H = V.H;
    g.fillStyle = '#07060c'; g.fillRect(0, 0, W, H);
    const a = 0.25 + Math.sin(R.t * 1.5) * 0.08;
    const lg = g.createRadialGradient(W / 2, H * 0.35, 1, W / 2, H * 0.35, 60);
    lg.addColorStop(0, `rgba(160,90,60,${a})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    GFX.text(g, '灯が、消えてしまった……', W / 2, H * 0.34, { size: 15, align: 'center', serif: true, color: '#e8d8c0' });
  }

  /* =========================== loop =========================== */
  function updateTopbar() {
    const el = $('#area');
    if (el) el.textContent = R.mode === 'field' && R.map ? R.map.def.name : R.mode === 'battle' ? '戦闘中' : '';
  }
  G.updateTopbar = updateTopbar;
  function update(dt) {
    R.t += dt;
    if (['field', 'battle'].includes(R.mode)) S.time += dt;
    if (R.mode === 'ending' && R.credits) R.credits.t += dt;
    if (R.shake > 0) R.shake -= dt;
    if (R.flash) { R.flash.t -= dt; if (R.flash.t <= 0) R.flash = null; }
    // input
    while (queue.length) {
      const a = queue.shift();
      if (kitModalOpen()) continue;
      const top = topInput();
      if (top) { top.key(a); continue; }
      if (R.mode === 'field' && canControl() && !P.moving) {
        if (a === 'ok') interactFront();
        else if (a === 'cancel' || a === 'menu') G.openMenu();
      }
    }
    for (const l of layers.slice()) if (l.update) l.update(dt);
    if (R.mode === 'field' && R.map) updateField(dt);
    if (R.mode === 'battle' && G.B) G.B.update(dt);
  }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, cv.width, cv.height);
    const k = V.dpr * V.s;
    ctx.setTransform(k, 0, 0, k, V.dpr * V.ox, V.dpr * V.oy);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, V.W, V.H); ctx.clip();
    if (R.mode === 'title') drawTitle(ctx);
    else if (R.mode === 'prologue') drawPrologueBg(ctx);
    else if (R.mode === 'field' && R.map) drawField(ctx);
    else if (R.mode === 'battle' && G.B) G.B.draw(ctx);
    else if (R.mode === 'ending') drawEnding(ctx);
    else if (R.mode === 'gameover') drawGameOver(ctx);
    else { ctx.fillStyle = '#0a0916'; ctx.fillRect(0, 0, V.W, V.H); GFX.text(ctx, '読み込み中…', V.W / 2, V.H / 2 - 6, { size: 11, align: 'center' }); }
    for (const l of layers) l.draw(ctx);
    if (R.flash) { ctx.fillStyle = R.flash.c + Math.min(0.6, R.flash.t) + ')'; ctx.fillRect(0, 0, V.W, V.H); }
    if (R.fade > 0) { ctx.fillStyle = `rgba(4,3,10,${Math.min(1, R.fade)})`; ctx.fillRect(0, 0, V.W, V.H); }
    ctx.restore();
  }
  G.boot = async function () {
    GK.init({ id: 'hokora-rpg', title: '宵灯りのほこら', help: HR.STORY.help, menu: () => { if (R.mode === 'field') G.openMenu(); else GK.help(); } });
    AU.setVolume(SETTINGS.bgm / 3);
    GK.loop((dt) => { if (R.hold && performance.now() < R.hold) return; update(dt); render(); });
    await GK.loadImages(HR.IMAGES);
    R.mode = 'title'; showTitle();
    // draw the title once, then let the page settle for a moment (the HTML title fades in) before the animation starts
    R.fade = 0; render(); R.hold = performance.now() + 1500;
    await G.fadeTo(0, 500);
    AU.play('title');
    G.ready = true;
    if (G.debug && qs.get('start')) { const st = +qs.get('start'); hideTitle(); await G.debugStage(st); return; }
    titleMenu();
  };

  /* =========================== debug & self-test =========================== */
  const WARPS = { '里': ['village', 15, 12, 'down'], '家': ['home', 5, 4, 'up'], '宿屋': ['inn', 7, 5, 'up'], '野原': ['field', 7, 2, 'down'], '茶屋の前': ['field', 27, 5, 'down'], '森の入口': ['forest', 17, 29, 'up'], '森の霧の前': ['forest', 17, 12, 'up'], '森の主の前': ['forest', 17, 9, 'up'], '洞の入口': ['cave', 15, 27, 'up'], '洞の岩の部屋': ['cave', 15, 17, 'up'], '洞の主の前': ['cave', 15, 8, 'up'], '奥ノ祠': ['shrine', 11, 27, 'up'], '祠の結界の前': ['shrine', 11, 12, 'up'], '祠の主の前': ['shrine', 11, 8, 'up'] };
  /** sets the story to a stage: 0 start · 1 ゲンタ · 2 森クリア · 3 しめ縄 · 4 洞クリア · 5 影灯籠 */
  G.debugStage = async function (st) {
    const lv = [1, 4, 7, 9, 11, 13][st];
    S.party = ['koharu', 'genta', 'suzu'].slice(0, st === 0 ? 1 : st === 1 ? 2 : 3);
    S.chars = {}; S.party.forEach((id) => (S.chars[id] = G.newChar(id, lv)));
    S.inv = { dango: 5, omusubi: st >= 2 ? 3 : 0, yomigaeri: st >= 2 ? 1 : 0 }; S.gold = 200 * (st + 1); S.flags = {}; S.opened = {}; S.time = 0;
    const F = [[], ['intro', 'genta'], ['intro', 'genta', 'mist', 'forest', 'lit_L1', 'lit_L2', 'lit_L3'], ['intro', 'genta', 'mist', 'forest', 'rope', 'lit_L1', 'lit_L2', 'lit_L3'], ['intro', 'genta', 'mist', 'forest', 'rope', 'cave', 'shrineIn', 'lit_L1', 'lit_L2', 'lit_L3'], ['intro', 'genta', 'mist', 'forest', 'rope', 'cave', 'shrineIn', 'kage1', 'kage2', 'kageOpen', 'lit_L1', 'lit_L2', 'lit_L3']][st];
    F.forEach((f) => (S.flags[f] = true));
    if (st >= 4) { S.inv.hidane = 1; S.flags.pit_cave = true; }
    const eqs = [{}, { koharu: 'kashi', genta: 'kitaenata' }, { koharu: 'ginkushi', genta: 'hagane', suzu: 'dousuzu' }, { koharu: 'ginkushi', genta: 'hagane', suzu: 'dousuzu' }, { koharu: 'tsukishiro', genta: 'iwakudaki', suzu: 'kazakiri' }, { koharu: 'tsukishiro', genta: 'yamagami', suzu: 'kazakiri' }][st];
    for (const [id, w] of Object.entries(eqs)) if (S.chars[id]) S.chars[id].eq.w = w;
    if (st >= 2) S.party.forEach((id) => (S.chars[id].eq.a = st >= 4 ? 'kariginu' : 'sashiko'));
    S.goal = ['宵ノ森でスズを探す', '宵ノ森でスズを探す', '鳴き岩の洞で火種石を手に入れる', '鳴き岩の洞で火種石を手に入れる', '奥ノ祠で宵灯をともす', '奥ノ祠で宵灯をともす'][st];
    G.healAll();
    const w = [WARPS['家'], WARPS['森の入口'], WARPS['茶屋の前'], WARPS['洞の入口'], WARPS['奥ノ祠'], WARPS['祠の主の前']][st];
    hideTitle(); layers.length = 0;
    G.loadMap(...w);
    await G.fadeTo(0, 200);
  };
  async function debugMenu() {
    const m = new Menu({ items: [{ label: 'ワープ' }, { label: '進行度を設定' }, { label: 'レベル +3' }, { label: 'お金 +1000' }, { label: `エンカウント：${G.noEnc ? 'なし' : 'あり'}` }, { label: 'テスト戦闘' }, { label: '全回復' }], x: 20, y: 12, w: 130, title: 'デバッグ' });
    try {
      const i = await m.choose();
      if (i === 0) { const keys = Object.keys(WARPS); const wm = new Menu({ items: keys.map((k) => ({ label: k })), x: 40, y: 8, w: 130, rows: Math.floor((V.H - 30) / 14) }); const j = await wm.choose(); wm.close(); if (j >= 0) { setTimeout(() => runEvent(() => G.warp(...WARPS[keys[j]])), 0); return 'close'; } }
      if (i === 1) { const sm = new Menu({ items: ['0 はじめ', '1 ゲンタ加入', '2 森クリア', '3 しめ縄', '4 洞クリア', '5 影灯籠'].map((l) => ({ label: l })), x: 40, y: 20, w: 130 }); const j = await sm.choose(); sm.close(); if (j >= 0) { setTimeout(() => G.debugStage(j), 0); return 'close'; } }
      if (i === 2) { S.party.forEach((id) => { const c = S.chars[id]; c.exp = HR.expTotal(Math.min(HR.MAX_LV, c.lv + 3)); G.gainExp(id, 0); }); G.healAll(); GK.toast('レベル +3'); }
      if (i === 3) { S.gold += 1000; GK.toast('お金 +1000'); }
      if (i === 4) { G.noEnc = !G.noEnc; GK.toast(G.noEnc ? 'エンカウントなし' : 'エンカウントあり'); }
      if (i === 5) { const keys = Object.keys(HR.TABLES).concat(Object.keys(HR.GROUPS)); const tm = new Menu({ items: keys.map((k) => ({ label: k })), x: 40, y: 8, w: 130, rows: Math.floor((V.H - 30) / 14) }); const j = await tm.choose(); tm.close(); if (j >= 0) { const k = keys[j]; const grp = HR.GROUPS[k] || HR.TABLES[k][Math.floor(Math.random() * HR.TABLES[k].length)]; setTimeout(() => runEvent(() => G.battle(grp, { bg: R.map.def.bg, boss: !!HR.GROUPS[k] && HR.ENEMIES[grp[0]].boss })), 0); return 'close'; } }
      if (i === 6) { G.healAll(); GK.toast('全回復'); }
    } finally { m.close(); }
    return null;
  }
  window.HRDBG = { G, S, R, P, stage: (n) => G.debugStage(n), warp: (k) => G.warp(...WARPS[k]), WARPS };

  const until = async (cond, ms = 8000) => { const t0 = performance.now(); while (!cond()) { if (performance.now() - t0 > ms) return false; await GK.wait(40); } return true; };
  G.until = until;
  window.__gameSelfTest = async function () {
    const notes = [];
    const shot = async (n) => { if (window.__shot) await window.__shot(n); };
    const backup = {};
    ['slot3', 'auto'].forEach((k) => (backup[k] = GK.store.get(k, null)));
    try {
      if (!(await until(() => G.ready && R.mode === 'title' && topInput(), 15000))) return { ok: false, notes: ['title did not appear'] };
      await shot('title');
      const speed = SETTINGS.textSpeed; SETTINGS.textSpeed = 3;
      G.noEnc = true;
      G.newGame({ skipPrologue: true });
      let faced = false;
      for (let k = 0; k < 12 && !faced; k++) {
        if (!(await until(() => layers.some((l) => l.kind === 'msg'), 10000))) return { ok: false, notes: ['opening dialogue did not appear'] };
        if (layers.some((l) => l.kind === 'msg' && l.face)) { faced = true; break; }
        G.press('ok'); await GK.wait(150);
      }
      if (!faced) return { ok: false, notes: ['no dialogue with a portrait'] };
      await GK.wait(200);
      await shot('talk');
      G.autoMsg = 'fast';
      if (!(await until(() => R.mode === 'field' && !R.busy && !topInput(), 20000))) return { ok: false, notes: ['opening event did not finish'] };
      G.autoMsg = false;
      notes.push(`opening done at ${R.mapId} (${P.x},${P.y})`);
      // walk down to the door → village
      G.testDir = 'down';
      await until(() => R.mapId === 'village' && !R.busy, 6000);
      G.testDir = null;
      if (R.mapId !== 'village') return { ok: false, notes: notes.concat(['could not walk out of the house: ' + R.mapId + ' ' + P.x + ',' + P.y]) };
      await until(() => !R.busy && R.fade < 0.05, 3000);
      G.testDir = 'down'; await GK.wait(500); G.testDir = null;
      await until(() => !P.moving, 2000);
      notes.push(`walked to village (${P.x},${P.y})`);
      await shot('village');
      // menu
      G.openMenu();
      await GK.wait(350);
      await shot('menu');
      G.press('cancel'); await until(() => !R.busy && !topInput(), 3000);
      // battle via debug path, auto-played
      G.autoBattle = true; G.autoMsg = 'fast';
      let result = null;
      runEvent(async () => { G.healAll(); result = await G.battle(['nezumi'], { bg: 'bg-field' }); });
      await until(() => R.mode === 'battle', 4000);
      await GK.wait(900);
      await shot('battle');
      if (!(await until(() => result != null && R.mode === 'field' && !R.busy, 30000))) return { ok: false, notes: notes.concat(['battle did not finish (' + R.mode + ')']) };
      notes.push('battle: ' + result + ', Lv ' + S.chars.koharu.lv);
      G.autoBattle = false; G.autoMsg = false;
      // save / load
      GK.store.set('slot3', snapshot());
      const at = { map: R.mapId, x: P.x, y: P.y, gold: S.gold };
      G.loadMap('field', 7, 2, 'down'); S.gold = 0;
      G.applySave(GK.store.get('slot3', null));
      const ok = R.mapId === at.map && P.x === at.x && P.y === at.y && S.gold === at.gold;
      notes.push('save/load ' + (ok ? 'ok' : 'MISMATCH'));
      SETTINGS.textSpeed = speed; G.noEnc = false;
      return { ok, notes };
    } catch (e) {
      return { ok: false, notes: notes.concat(['error: ' + (e && e.stack || e)]) };
    } finally {
      ['slot3', 'auto'].forEach((k) => (backup[k] ? GK.store.set(k, backup[k]) : GK.store.del(k)));
    }
  };
})();
