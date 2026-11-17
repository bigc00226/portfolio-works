/*
 * The three desktop apps of the demo and the web tools opened in the browser:
 *   Design  — Figma-style canvas with frames that render the real page (static mode)
 *   Code    — VS Code-style editor + terminal (files from code-files.js)
 *   Browser — Chrome-style tabs: dev server / production site (live mode), Sveltia CMS, Tag Manager,
 *             Tag Assistant, Analytics DebugView, Schema Markup Validator, view-source, plain text
 * Real UIs, captured (js/real-ui.js): Sveltia CMS (open source, run with the site's own config), the Schema Markup
 * Validator (public page), Chrome's view-source page. Look-alikes: the design tool and the editor, Tag Manager /
 * Tag Assistant / Analytics (they need a Google login) — with their real icons; the taskbar shows the real app icons.
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$, esc, icon, clamp, wait, kw, tween, Ease, Cursor, UI, screenRect, pointOf, clickUi, moveToEl, Keycap, KeyStrip, typeInto, fieldTarget, Clock } = D;
  const S = window.SITE_SNAPSHOT;
  const CF = window.CodeFiles;

  /* ====================================================================== DESIGN */
  const ROOT_VARS = (() => {
    const m = (Object.values(S.css)[0] || '').match(/:root\{([^}]*)\}/);
    const out = {};
    if (m) m[1].split(';').forEach((d) => { const i = d.indexOf(':'); if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim(); });
    return out;
  })();
  const COLOR_VARS = ['--bg', '--bg-alt', '--ink', '--ink-body', '--annotation', '--fv', '--hair'].filter((k) => ROOT_VARS[k]);
  const hex6 = (v) => { v = v.replace('#', ''); if (v.length === 3) v = v.split('').map((c) => c + c).join(''); return '#' + v.slice(0, 6).toUpperCase(); };
  function rgbToHex(rgb) {
    const m = String(rgb).match(/\d+(\.\d+)?/g);
    if (!m) return '';
    return '#' + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function varOfColor(hex) { return COLOR_VARS.find((k) => hex6(ROOT_VARS[k]) === hex) || ''; }

  const Design = {
    cam: { x: 0, y: 0, z: 0.5 },
    frames: {},
    sel: null, hov: null,
    init() {
      this.canvas = $('#fgCanvas');
      this.world = $('#fgWorld');
      const photos = ['Ne_226_PR', 'Ne_222_PR', 'Ne_0156', 'Ne_233_PR_m', 'Ne_0040', 'Ne_24', 'Ne_232_PR', 'Ne_view', 'Ne_sui_1', 'Ne_0123', 'Ne_0082', 'Ne_208_PR', 'Ne_0165', 'Ne_0037', 'Ne_0157'];
      $('#fgAssets').innerHTML = photos.map((p) => `<div class="fg-asset" data-asset="${p}"><div class="th" style="background-image:url(assets/photos/${p}.webp)"></div><span>${p}.jpg</span></div>`).join('');
      $('#fgLogos').innerHTML = [['architizer-winner-2026', 'Architizer'], ['aficionados-white', 'Aficionados'], ['good-design', 'Good Design']]
        .map(([f, n]) => `<div class="fg-asset" data-logo="${f}"><div class="th" style="background-image:url(assets/logos/${f}.webp)"></div><span>${n}</span></div>`).join('');
      this.apply();
      D.frameFns.add(() => this.track());
      Props.empty();
    },
    apply() {
      const { x, y, z } = this.cam;
      this.world.style.transform = `translate(${(-x * z).toFixed(2)}px, ${(-y * z).toFixed(2)}px) scale(${z})`;
      $('#fgZoom').textContent = Math.round(z * 100) + '%';
      Object.values(this.frames).forEach((f) => { f.label.style.fontSize = 12 / z + 'px'; f.label.style.paddingBottom = 5 / z + 'px'; });
    },
    view() { const r = this.canvas.getBoundingClientRect(); return { w: r.width, h: r.height, r }; },
    /** camera that shows world rect (x, y, w, h) — anchored top-left with padding */
    camFor(x, y, w, h, o = {}) {
      const v = this.view();
      const pad = o.pad != null ? o.pad : 70;
      const z = o.z || Math.min((v.w - pad * 2) / w, (v.h - pad * 2) / h);
      const cx = x + w / 2, cy = o.top != null ? null : y + h / 2;
      return { x: cx - v.w / 2 / z, y: o.top != null ? y - o.top / z : cy - v.h / 2 / z, z };
    },
    async camTo(c, ms = 900) {
      const s = { ...this.cam };
      await tween(ms, (e) => {
        this.cam.x = s.x + (c.x - s.x) * e;
        this.cam.y = s.y + (c.y - s.y) * e;
        this.cam.z = s.z + (c.z - s.z) * e;
        this.apply();
      }, Ease.inOut);
    },
    toScreen(wx, wy) { const r = this.canvas.getBoundingClientRect(); return [r.left + (wx - this.cam.x) * this.cam.z, r.top + (wy - this.cam.y) * this.cam.z]; },
    toWorld(sx, sy) { const r = this.canvas.getBoundingClientRect(); return [(sx - r.left) / this.cam.z + this.cam.x, (sy - r.top) / this.cam.z + this.cam.y]; },

    async addFrame(id, o) {
      const el = document.createElement('div');
      el.className = 'fg-frame';
      el.style.left = o.x + 'px';
      el.style.top = o.y + 'px';
      el.innerHTML = `<div class="fg-flabel">${esc(o.label)}</div><div class="fg-fbody"><iframe scrolling="no" tabindex="-1"></iframe></div>`;
      this.world.appendChild(el);
      const f = { id, el, label: el.querySelector('.fg-flabel'), body: el.querySelector('.fg-fbody'), iframe: el.querySelector('iframe'), x: o.x, y: o.y, w: o.w, h: o.h, vh: o.vh, name: o.label };
      f.iframe.style.width = o.w + 'px';
      f.iframe.style.height = (o.ih || 11000) + 'px';
      f.body.style.width = o.w + 'px';
      f.body.style.height = o.h + 'px';
      f.body.style.background = '#F7F7F6';
      if (o.hiddenUntilLoad) el.style.visibility = 'hidden';
      this.frames[id] = f;
      this.apply();
      f.doc = await window.SiteFrame.load(f.iframe, 'static', { vh: o.vh, before: o.before });
      f.win = f.iframe.contentWindow;
      return f;
    },
    rename(f, name) { f.name = name; f.label.textContent = name; },
    setWidth(f, w, vh) {
      f.w = w;
      f.iframe.style.width = w + 'px';
      f.body.style.width = w + 'px';
      if (vh) f.doc.documentElement.style.setProperty('--demo-vh', vh + 'px');
    },
    contentH(f) { return Math.ceil(f.doc.body.getBoundingClientRect().height); },
    fitHeight(f) { f.h = Math.max(200, this.contentH(f)); f.body.style.height = f.h + 'px'; },
    /** world y of an element inside a frame */
    worldY(f, el) { return f.y + el.getBoundingClientRect().top + f.win.scrollY; },

    select(target) {
      this.sel = target;
      $('#fgSel').classList.toggle('show', !!target);
      $$('.fg-flabel').forEach((l) => l.classList.remove('sel'));
      if (target && target.frame && !target.el) target.frame.label.classList.add('sel');
      if (!$('#fgSel .h')) $('#fgSel').insertAdjacentHTML('afterbegin', '<span class="h" style="left:0;top:0"></span><span class="h" style="left:100%;top:0"></span><span class="h" style="left:0;top:100%"></span><span class="h" style="left:100%;top:100%"></span>');
      this.track();
    },
    hover(target) { this.hov = target; $('#fgHov').classList.toggle('show', !!target); this.track(); },
    rectOf(t) { return t.el ? screenRect(t.el) : screenRect(t.frame.body); },
    track() {
      const c = this.canvas.getBoundingClientRect();
      const place = (box, t) => {
        const r = this.rectOf(t);
        box.style.left = r.left - c.left + 'px';
        box.style.top = r.top - c.top + 'px';
        box.style.width = r.width + 'px';
        box.style.height = r.height + 'px';
        return r;
      };
      if (this.sel) {
        const r = place($('#fgSel'), this.sel);
        const t = this.sel;
        const w = t.el ? t.el.getBoundingClientRect().width : t.frame.w;
        const h = t.el ? t.el.getBoundingClientRect().height : t.frame.h;
        $('#fgSelSize').textContent = `${Math.round(w)} × ${Math.round(h)}`;
        void r;
      }
      if (this.hov) place($('#fgHov'), this.hov);
    },
    setTool(name) { $$('.fg-tool[data-tool]').forEach((t) => t.classList.toggle('active', t.dataset.tool === name)); },
    leftTab(name) {
      $$('.fg-ltabs span').forEach((s) => s.classList.toggle('on', s.dataset.ltab === name));
      $$('.fg-lpane').forEach((p) => p.classList.toggle('on', p.dataset.lpane === name));
    },
  };

  const Layers = {
    items: [],
    render() {
      const IC = { frame: 'frame', section: 'square', text: 'type', image: 'image', group: 'layers', component: 'blocks' };
      $('#fgLayers').innerHTML = this.items.map((it) =>
        `<div class="fg-layer ${it.kind}${it.sel ? ' sel' : ''}${it.isNew ? ' new' : ''}" data-key="${it.key}" style="padding-left:${8 + it.depth * 16}px">` +
        `<span class="lic">${icon(IC[it.kind] || 'square')}</span><span>${esc(it.name)}</span></div>`).join('');
      this.items.forEach((it) => { it.isNew = false; });
    },
    add(item, o = {}) {
      item.isNew = !Clock.ff;
      const i = o.after ? this.items.findIndex((x) => x.key === o.after) : -1;
      if (o.first) this.items.unshift(item);
      else if (i >= 0) {
        let j = i + 1;
        while (j < this.items.length && this.items[j].depth > this.items[i].depth) j++;
        if (o.child) j = i + 1;
        this.items.splice(j, 0, item);
      } else this.items.push(item);
      this.render();
    },
    rename(key, name) { const it = this.items.find((x) => x.key === key); if (it) { it.name = name; this.render(); } },
    select(key) { this.items.forEach((x) => { x.sel = x.key === key; }); this.render(); },
    el(key) { return $(`.fg-layer[data-key="${key}"]`); },
  };

  const Props = {
    root() { return $('#fgProps'); },
    empty() {
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-ps-h">ページ</div>
        <div class="fg-row one"><div class="fg-in"><span class="sw" style="background:#F0F0F0"></span><span class="v">F0F0F0</span><span class="k" style="margin-left:auto">100%</span></div></div></div>
        <div class="fg-ps"><div class="fg-ps-h">ローカル変数<span class="ic" id="fgVarsBtn">${icon('variable')}</span></div><div class="fg-hint">カラー・タイポグラフィ・余白の値を変数として定義し、デザインと実装（CSS カスタムプロパティ）で共有します。</div></div>
        <div class="fg-ps"><div class="fg-ps-h">書き出し<span class="ic">${icon('plus')}</span></div></div>`;
    },
    presets() {
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-ps-h">フレーム</div>
        <div class="fg-hint" style="margin-bottom:8px">デスクトップ</div>
        <div class="fg-row one"><div class="fg-in" data-preset="desktop"><span class="v">Desktop</span><span class="k" style="margin-left:auto">1440 × 900</span></div></div>
        <div class="fg-row one"><div class="fg-in"><span class="v">MacBook Air</span><span class="k" style="margin-left:auto">1280 × 832</span></div></div>
        <div class="fg-hint" style="margin:12px 0 8px">スマートフォン</div>
        <div class="fg-row one"><div class="fg-in"><span class="v">iPhone 13 mini</span><span class="k" style="margin-left:auto">375 × 812</span></div></div>
        <div class="fg-row one"><div class="fg-in"><span class="v">iPhone 16</span><span class="k" style="margin-left:auto">393 × 852</span></div></div></div>`;
    },
    fillRow(hex, label) {
      const v = varOfColor(hex);
      return `<div class="fg-row one"><div class="fg-in" data-f="fill">${v ? `<span class="fg-var"><span class="sw" style="background:${hex}"></span>${esc(v.replace('--', ''))}</span><span class="k" style="margin-left:auto">${hex.slice(1)}</span>` : `<span class="sw" style="background:${hex}"></span><span class="v">${hex.slice(1)}</span>`}</div></div>`;
    },
    frame(f) {
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-title">${icon('frame')}${esc(f.name)}<small>フレーム</small></div></div>
        <div class="fg-ps"><div class="fg-ps-h">フレーム</div>
          <div class="fg-row"><div class="fg-in"><span class="k">X</span><span class="v">${Math.round(f.x)}</span></div><div class="fg-in"><span class="k">Y</span><span class="v">${Math.round(f.y)}</span></div></div>
          <div class="fg-row"><div class="fg-in" data-f="w"><span class="k">W</span><span class="v">${f.w}</span></div><div class="fg-in" data-f="h"><span class="k">H</span><span class="v">${f.h}</span></div></div>
          <div class="fg-row one"><div class="fg-in"><span class="k">${icon('check')}</span><span class="v">コンテンツをクリップ</span></div></div></div>
        <div class="fg-ps"><div class="fg-ps-h">塗り<span class="ic">${icon('plus')}</span></div>${this.fillRow('#F7F7F6')}</div>
        <div class="fg-ps"><div class="fg-ps-h">レイアウトグリッド<span class="ic">${icon('plus')}</span></div>
          <div class="fg-row one"><div class="fg-in"><span class="v">最大幅 72rem（1152）・余白 clamp(1.5rem, 1rem + 3vw, 4rem)</span></div></div></div>`;
    },
    text(el, name) {
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? 0 : parseFloat(cs.lineHeight);
      const ls = parseFloat(cs.letterSpacing) || 0;
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const hex = rgbToHex(cs.color);
      const r1 = (n) => Math.round(n * 10) / 10;
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-title">${icon('type')}${esc(name)}<small>テキスト</small></div></div>
        <div class="fg-ps"><div class="fg-ps-h">タイポグラフィ<span class="ic">${icon('settings')}</span></div>
          <div class="fg-row one"><div class="fg-in"><span class="v" style="font-family:'Yu Mincho',serif">${esc(fam)}</span></div></div>
          <div class="fg-row"><div class="fg-in"><span class="v">Regular</span></div><div class="fg-in" data-f="size"><span class="v">${r1(size)}</span></div></div>
          <div class="fg-row"><div class="fg-in"><span class="k">行間</span><span class="v">${lh ? Math.round((lh / size) * 100) + '%' : 'Auto'}</span></div><div class="fg-in"><span class="k">字間</span><span class="v">${Math.round((ls / size) * 100)}%</span></div></div>
          <div class="fg-row"><div class="fg-in"><span class="k">${icon('align-c')}</span><span class="v">${cs.textAlign === 'center' ? '中央揃え' : '左揃え'}</span></div><div class="fg-in" data-f="wrap"><span class="k">${icon('text')}</span><span class="v">${cs.whiteSpace === 'nowrap' ? '自動幅' : '固定幅'}</span></div></div>
        </div>
        <div class="fg-ps"><div class="fg-ps-h">塗り<span class="ic">${icon('plus')}</span></div>${this.fillRow(hex)}</div>`;
    },
    image(el, name, file) {
      const r = el.getBoundingClientRect();
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-title">${icon('image')}${esc(name)}<small>セクション</small></div></div>
        <div class="fg-ps"><div class="fg-ps-h">レイアウト</div>
          <div class="fg-row"><div class="fg-in"><span class="k">W</span><span class="v">${Math.round(r.width)}</span></div><div class="fg-in"><span class="k">H</span><span class="v">${Math.round(r.height)}</span></div></div></div>
        <div class="fg-ps"><div class="fg-ps-h">塗り<span class="ic">${icon('plus')}</span></div>
          <div class="fg-row one"><div class="fg-in"><span class="sw" style="background:url(assets/photos/${file}.webp) center/cover"></span><span class="v">${file}.jpg</span><span class="k" style="margin-left:auto">フィル</span></div></div>
          <div class="fg-row one"><div class="fg-in"><span class="sw" style="background:linear-gradient(#120f0c4d,#120f0c80)"></span><span class="v">グラデーション 30–50%</span></div></div></div>`;
    },
    field(name) { return $(`.fg-in[data-f="${name}"]`, this.root()); },
    flash(name) { const f = this.field(name); if (f) { f.classList.remove('changed'); void f.offsetWidth; f.classList.add('changed'); } },
  };

  const Vars = {
    open() { $('#fgVars').classList.add('show'); },
    close() { $('#fgVars').classList.remove('show'); },
    rows(coll) {
      const COLL = {
        color: COLOR_VARS.map((k) => [k, ROOT_VARS[k], 'color']),
        type: ['--fs-display', '--fs-h1', '--fs-h2', '--fs-body', '--fs-caption', '--lh-body', '--lh-head', '--ls', '--serif'].filter((k) => ROOT_VARS[k]).map((k) => [k, ROOT_VARS[k], 'num']),
        space: ['--section-y', '--gutter', '--maxw', '--measure', '--space-1', '--space-2', '--space-3', '--space-4'].filter((k) => ROOT_VARS[k]).map((k) => [k, ROOT_VARS[k], 'num']),
      };
      return COLL[coll] || [];
    },
    async show(coll, o = {}) {
      $$('.fg-vcoll').forEach((c) => c.classList.toggle('on', c.dataset.coll === coll));
      const t = $('#fgVarTable');
      t.innerHTML = `<div class="fg-vrow head"><span>名前</span><span>値</span><span>CSS</span></div>`;
      for (const [k, v, kind] of this.rows(coll)) {
        const val = kind === 'color'
          ? `<span class="sw" style="background:${v}"></span>${hex6(v).slice(1)}`
          : esc(v.length > 34 ? v.slice(0, 33) + '…' : v);
        t.insertAdjacentHTML('beforeend', `<div class="fg-vrow${Clock.ff ? '' : ' new'}"><span class="nm">${icon(kind === 'color' ? 'eye' : 'variable')}${esc(k.replace('--', ''))}</span><span class="vl">${val}</span><span class="vl" style="color:#888">var(${esc(k)})</span></div>`);
        await kw(o.gap || 170);
      }
    },
  };

  /* ======================================================================== CODE */
  const LH = 21;
  // VS Code's file icons (Seti) and codicons: public/shared/vscode.js
  const fileIcon = (p) => window.VSC.fileIcon(p);
  const ci = (n) => window.VSC.ci(n);

  /** html of one line: tokens + range classes + zero-width inserts (caret / IME composition) */
  function lineHtml(tokens, ranges, inserts) {
    let total = 0;
    tokens.forEach(([t]) => { total += t.length; });
    const cuts = new Set();
    ranges.forEach((r) => { cuts.add(r.from); cuts.add(r.to); });
    inserts.forEach((x) => cuts.add(Math.min(x.at, total)));
    const pieces = [];
    let pos = 0;
    for (const [t, c] of tokens) {
      let s = 0;
      const local = [...cuts].filter((k) => k > pos && k < pos + t.length).sort((a, b) => a - b);
      for (const k of local) { pieces.push([t.slice(s, k - pos), c, pos + s]); s = k - pos; }
      pieces.push([t.slice(s), c, pos + s]);
      pos += t.length;
    }
    let html = '';
    const done = new Set();
    const emitIns = (p) => inserts.forEach((x, i) => { if (!done.has(i) && Math.min(x.at, total) === p) { html += x.html; done.add(i); } });
    for (const [t, c, start] of pieces) {
      emitIns(start);
      if (!t) continue;
      const rc = ranges.filter((r) => start >= r.from && start < r.to).map((r) => r.cls).join(' ');
      const cls = [c, rc].filter(Boolean).join(' ');
      html += cls ? `<span class="${cls}">${esc(t)}</span>` : esc(t);
    }
    emitIns(total);
    return html;
  }

  const Code = {
    files: {}, tabs: [], active: null, top: 0,
    ins: null, sel: null, sq: [], lineCls: {}, status: {},
    tree: [],
    init() {
      for (const [p, text] of Object.entries(CF.files)) this.files[p] = { path: p, lang: CF.langOf(p), lines: text.split('\n'), dirty: false };
      this.tree = CF.tree.map(([path, kind, open]) => ({ path, dir: kind === 'dir', open: !!open }));
      this.renderTree();
      this.render();
    },
    /* ---- explorer */
    renderTree() {
      const openDirs = new Set(this.tree.filter((n) => n.dir && n.open).map((n) => n.path));
      const visible = (p) => { const parts = p.split('/'); for (let i = 1; i < parts.length; i++) if (!openDirs.has(parts.slice(0, i).join('/'))) return false; return true; };
      $('#vsTree').innerHTML = this.tree.filter((n) => visible(n.path)).map((n) => {
        const depth = n.path.split('/').length - 1;
        const name = n.path.split('/').pop();
        const st = this.status[n.path] || '';
        return `<div class="vs-node${n.path === this.active ? ' focus' : ''}${st === 'M' ? ' mod' : st === 'U' ? ' add' : ''}" data-path="${esc(n.path)}" style="padding-left:${6 + depth * 12}px">` +
          (n.dir ? `<span class="tw">${ci(n.open ? 'chevron-down' : 'chevron-right')}</span>` : `<span class="tw"></span>${fileIcon(n.path)}`) +
          `<span class="nm">${esc(name)}</span>${st && !n.dir ? `<span class="st">${st}</span>` : ''}</div>`;
      }).join('');
    },
    node(path) { return $(`.vs-node[data-path="${CSS.escape(path)}"]`); },
    mark(path, st) { this.status[path] = st; this.renderTree(); this.gitBadge(); },
    gitBadge() { const n = Object.keys(this.status).length; const b = $('#vsGitBadge'); b.textContent = n; b.classList.toggle('show', n > 0); },
    /* ---- tabs + view */
    show(path, o = {}) {
      if (!this.tabs.includes(path)) this.tabs.push(path);
      this.active = path;
      this.top = o.top != null ? o.top : (this.files[path].lastTop || 0);
      this.left = this.files[path].lastLeft || 0;
      this.lockLeft = false;
      this.ins = null; this.sel = null; this.sq = []; this.lineCls = {};
      $('#vsLang').textContent = { astro: 'Astro', ts: 'TypeScript', css: 'CSS', json: 'JSON', yaml: 'YAML', md: 'Markdown', robots: 'Plain Text', html: 'HTML' }[this.files[path].lang] || 'Plain Text';
      this.renderTabs();
      this.renderTree();
      this.render();
    },
    async openFile(path, o = {}) {
      const n = this.node(path);
      if (n) await clickUi(n, { after: 60 });
      this.show(path, o);
      await wait(o.after != null ? o.after : 260);
    },
    renderTabs() {
      $('#vsTabs').innerHTML = this.tabs.map((p) => {
        const f = this.files[p];
        return `<div class="vs-tab${p === this.active ? ' on' : ''}${f.dirty ? ' dirty' : ''}" data-tab="${esc(p)}">${fileIcon(p)}<span class="nm">${esc(p.split('/').pop())}</span><span class="x">${ci('close')}</span></div>`;
      }).join('');
      const p = this.active ? this.active.split('/') : [];
      $('#vsCrumbs').innerHTML = p.map((x, i) => (i ? ci('chevron-right') : '') + (i === p.length - 1 ? fileIcon(this.active) : '') + `<span>${esc(x)}</span>`).join('');
    },
    /** visible rows: editor + terminal panel share a fixed height; the panel is 252px when shown. Measured once —
     *  reading the height after every render forced a full layout per keystroke (and could catch the panel mid-slide) */
    rows() {
      if (!this._hAll || this._rowsW !== innerWidth) {
        const h = $('#vsLines').clientHeight;
        if (!h) return 5;
        this._hAll = h + Math.max(0, $('#vsPanel').offsetHeight - 1);
        this._rowsW = innerWidth;
      }
      const on = $('#vsPanel').classList.contains('show');
      return Math.max(5, Math.floor((this._hAll - (on ? 252 : 0)) / LH));
    },
    render() {
      const box = $('#vsLines');
      const f = this.files[this.active];
      if (!f) { box.innerHTML = `<div class="vs-empty">${icon('code')}<span>ファイルを開いて編集を開始</span></div>`; window.VSC.minimap($('#vsMini'), null); return; }
      f.lastTop = this.top;
      const toks = CF.highlight(f.lang, f.lines);
      const start = Math.max(0, Math.floor(this.top)), frac = this.top - start;
      const end = Math.min(f.lines.length, start + this.rows() + 2);
      let html = '';
      for (let i = start; i < end; i++) {
        const ranges = [];
        if (this.sel && this.sel.line === i) ranges.push({ from: this.sel.from, to: this.sel.to, cls: 'selbg' });
        this.sq.filter((q) => q.line === i).forEach((q) => ranges.push({ from: q.from, to: q.to, cls: 'sq-err' }));
        const inserts = [];
        if (this.ins && this.ins.line === i) inserts.push({ at: this.ins.col, html: this.ins.html });
        if (this.probe && this.probe.line === i) inserts.push({ at: this.probe.col, html: '<span class="probe"></span>' });
        const cur = this.ins && this.ins.line === i;
        html += `<div class="vs-line${cur ? ' cur' : ''}${this.lineCls[i] ? ' ' + this.lineCls[i] : ''}" data-l="${i}"><span class="ln">${i + 1}</span><span class="lc"><span class="lx">${lineHtml(toks[i] || [], ranges, inserts)}</span></span></div>`;
      }
      box.innerHTML = html;
      box.style.paddingTop = 2 - frac * LH + 'px';
      window.VSC.minimap($('#vsMini'), toks, this.top);
      if (this.ins) $('#vsPos').textContent = `Ln ${this.ins.line + 1}, Col ${this.ins.col + 1}`;
      this.follow();
    },
    /**
     * Horizontal scrolling like the real editor: when the caret (or the IME composition) goes past the right edge of
     * the (snapped, half-width) editor the view follows it a few characters ahead; when it comes back left of the view
     * it scrolls back. A scrollbar thumb shows at the bottom while lines are wider than the view.
     */
    follow() {
      const box = $('#vsLines');
      const lc = box.querySelector('.lc');
      if (!lc) return;
      const vw = lc.clientWidth;
      const mark = box.querySelector('.probe') || box.querySelector('.caret');
      if (mark && vw && !this.lockLeft) {
        const x = mark.offsetLeft;
        const comp = box.querySelector('.ime-c');
        const right = Math.max(x, comp ? comp.offsetLeft + comp.offsetWidth : 0);
        if (right - this.left > vw - 28) this.left = Math.ceil(right - vw + 56);
        else if (x - this.left < 10) this.left = Math.max(0, Math.floor(x - Math.min(120, vw * 0.25)));
        if (x < vw - 40 && this.left > 0 && right < vw - 28) this.left = 0;
      }
      const f = this.files[this.active];
      if (f) f.lastLeft = this.left;
      box.style.setProperty('--hx', this.left + 'px');
      let widest = 0;
      box.querySelectorAll('.lx').forEach((x) => { widest = Math.max(widest, x.offsetWidth); });
      const bar = $('#vsHbar');
      if (!bar) return;
      const on = widest > vw + 4 || this.left > 0;
      bar.classList.toggle('show', on);
      if (!on) return;
      const total = Math.max(widest + 40, this.left + vw);
      bar.firstElementChild.style.width = Math.max(30, (vw / total) * 100) + '%';
      bar.firstElementChild.style.left = (this.left / total) * 100 + '%';
    },
    lineEl(i) { return $(`.vs-line[data-l="${i}"]`); },
    ensureVisible(line, margin = 3) {
      const rows = this.rows();
      if (line < this.top + 1) this.top = Math.max(0, line - margin);
      else if (line > this.top + rows - margin) this.top = line - rows + margin + 1;
    },
    async scrollTo(top, ms = 700) {
      const s = this.top;
      await tween(ms, (e) => { this.top = s + (top - s) * e; this.render(); }, Ease.inOut);
    },
    /** screen rect of a column position on a line (line must be in view) */
    colRect(line, col) {
      this.lockLeft = false;
      this.probe = { line, col };
      this.render();
      const p = $('#vsLines .probe');
      const r = p ? p.getBoundingClientRect() : this.lineEl(line).getBoundingClientRect();
      this.probe = null;
      this.lockLeft = true; // keep the column in view until the click puts the caret there
      this.render();
      return { left: r.left, top: r.top, width: 0, height: LH, right: r.left, bottom: r.top + LH };
    },
    find(text, from = 0) {
      const f = this.files[this.active];
      for (let i = from; i < f.lines.length; i++) { const c = f.lines[i].indexOf(text); if (c >= 0) return { line: i, col: c }; }
      return null;
    },
    setCaret(line, col) { this.lockLeft = false; this.ins = { line, col, html: '<span class="caret"></span>' }; this.sel = null; this.render(); },
    async clickAt(line, col, o = {}) {
      this.ensureVisible(line, o.margin || 6);
      this.render();
      const r = this.colRect(line, col);
      Cursor.kind('text');
      await Cursor.moveTo(r.left + 1, r.top + LH / 2, o);
      await Cursor.click();
      this.setCaret(line, col);
      await wait(o.after != null ? o.after : 160);
    },
    async dragSelect(line, from, to) {
      this.ensureVisible(line, 6);
      this.render();
      const a = this.colRect(line, from), b = this.colRect(line, to);
      Cursor.kind('text');
      await Cursor.moveTo(a.left + 1, a.top + LH / 2);
      Cursor.press();
      this.ins = null;
      await Cursor.moveTo(b.left + 1, b.top + LH / 2, {
        ms: 520, easing: Ease.out,
        onMove: (x) => {
          const col = clamp(from + Math.round((x - a.left) / Math.max(1, (b.left - a.left) / Math.max(1, to - from))), from, to);
          this.sel = { line, from, to: col };
          this.render();
        },
      });
      Cursor.release();
      this.sel = { line, from, to };
      this.render();
      await wait(220);
    },
    /** typing target at the caret (or replacing the selection) */
    target() {
      const f = this.files[this.active];
      const line = this.sel ? this.sel.line : this.ins.line;
      const c0 = this.sel ? this.sel.from : this.ins.col;
      const c1 = this.sel ? this.sel.to : this.ins.col;
      const orig = f.lines.slice();
      const before = orig[line].slice(0, c0), after = orig[line].slice(c1);
      this.sel = null;
      const self = this;
      return {
        render(text, comp) {
          self.lockLeft = false;
          const parts = (before + text).split('\n');
          f.lines = [...orig.slice(0, line), ...parts.slice(0, -1), parts[parts.length - 1] + after, ...orig.slice(line + 1)];
          if (!f.dirty) { f.dirty = true; self.renderTabs(); }
          const cl = line + parts.length - 1, cc = parts[parts.length - 1].length;
          self.ins = { line: cl, col: cc, html: comp + '<span class="caret"></span>' };
          self.ensureVisible(cl);
          self.render();
        },
        anchor() { const c = $('#vsLines .ime-c.active') || $('#vsLines .ime-c') || $('#vsLines .caret'); return screenRect(c || $('#vsLines')); },
        enter(text) { const cur = (before + text).split('\n').pop(); return '\n' + cur.match(/^\s*/)[0]; },
      };
    },
    async type(script, o = {}) {
      if (typeof script === 'string') script = [{ direct: script }];
      await typeInto(this.target(), script, { kps: 20, ...o });
      this.ins.html = '<span class="caret"></span>';
      this.render();
    },
    /** End key + Enter on a line, then type */
    async newLineAfter(line, o = {}) {
      const f = this.files[this.active];
      await this.clickAt(line, f.lines[line].length, o);
      KeyStrip.special('End');
      await kw(120);
    },
    insertLines(at, lines, o = {}) {
      const f = this.files[this.active];
      f.lines.splice(at, 0, ...lines);
      if (!f.dirty) { f.dirty = true; this.renderTabs(); }
      if (o.flash !== false && !Clock.ff) { for (let i = 0; i < lines.length; i++) this.lineCls[at + i] = 'flash'; setTimeout(() => { this.lineCls = {}; this.render(); }, 1400 / Clock.speed); }
      const last = at + lines.length - 1;
      this.ins = { line: last, col: lines[lines.length - 1].length, html: '<span class="caret"></span>' };
      this.ensureVisible(last);
      this.render();
    },
    replaceLines(at, count, lines) { const f = this.files[this.active]; f.lines.splice(at, count, ...lines); this.render(); },
    async save(o = {}) {
      await Keycap.show(['Ctrl', 'S'], 700);
      const f = this.files[this.active];
      f.dirty = false;
      this.renderTabs();
      if (!o.noStatus && !this.status[this.active]) this.mark(this.active, o.status || 'M');
      await wait(200);
    },
    setText(path, text) { this.files[path].lines = text.split('\n'); if (path === this.active) this.render(); },
    text(path) { return this.files[path].lines.join('\n'); },
    async panel(on) { $('#vsPanel').classList.toggle('show', on); await D.realWait(320); this.render(); },
  };

  const Term = {
    lines: [],
    prompt: 'PS C:\\dev\\ne-auberge> ',
    /** the terminal scrolls like the real one: the newest line (the prompt being typed) always stays in view */
    render(input) {
      const keep = this.lines.slice(-80);
      const el = $('#vsTerm');
      el.innerHTML = keep.map((l) => `<div>${l}</div>`).join('') + (input != null ? `<div>${esc(this.prompt)}<span id="termIn">${input}</span></div>` : '');
      el.scrollTop = el.scrollHeight;
    },
    clear() { this.lines = []; this.render(''); },
    async run(cmd, out = [], o = {}) {
      this.render('<span class="caret"></span>');
      const inEl = $('#termIn');
      const script = typeof cmd === 'string' ? [{ direct: cmd }] : cmd;
      const typed = await typeInto(fieldTarget(inEl), script, { kps: o.kps || 15, keepStrip: true });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(900);
      this.lines.push(esc(this.prompt) + `<span class="tw2">${esc(typed)}</span>`);
      this.render();
      for (const line of out) {
        if (typeof line === 'number') { await wait(line); continue; }
        this.lines.push(line);
        this.render();
        await kw(o.gap || 90);
      }
      this.render(o.noPrompt ? null : '<span class="caret"></span>');
    },
  };

  /* ===================================================================== BROWSER */
  // tab icons: ne-auberge.jp, the dev server and view-source have no favicon (Chrome's own icon); Sveltia CMS shows its logo
  // (the site's config sets no logo_url); the Google tools and the validator show theirs (npm run favicons)
  const FI = (f) => `<img class="br-fav img" src="../../shared/favicons/${f}" alt="">`;
  const FAV = {
    site: FI('default.png'),
    cms: FI('sveltia.svg'),
    gtm: FI('gtm.svg'),
    ta: FI('ta.svg'),
    ga: FI('ga.svg'),
    val: FI('schema.ico'),
    src: FI('default.png'),
    blank: '<span class="br-fav" style="background:transparent"></span>',
  };
  const Browser = {
    tabs: [], active: null,
    tabEl(id) { return $(`.br-tab[data-tab="${id}"]`); },
    addTab(t, o = {}) {
      const tab = { fav: 'site', ...t };
      this.tabs.push(tab);
      const el = document.createElement('div');
      el.className = 'br-tab' + (o.anim && !Clock.ff ? ' new' : '');
      el.dataset.tab = tab.id;
      el.innerHTML = `<span class="fav">${FAV[tab.fav] || FAV.site}</span><span class="tt"></span><span class="x">${icon('close')}</span>`;
      $('#brTabs').appendChild(el);
      this.setTitle(tab.id, tab.title);
      if (o.activate !== false) this.activate(tab.id);
      return tab;
    },
    tab(id) { return this.tabs.find((t) => t.id === id); },
    activate(id) {
      this.active = id;
      const t = this.tab(id);
      $$('.br-tab').forEach((e) => e.classList.toggle('on', e.dataset.tab === id));
      $$('.br-page').forEach((p) => p.classList.toggle('on', p.dataset.page === t.page));
      this.showUrl(t.url);
    },
    showUrl(url) {
      const m = String(url).match(/^(https?:\/\/)?([^/]+)(.*)$/);
      const secure = /^https/.test(url);
      $('#brLock').innerHTML = secure ? window.Win11.SVG.tune : icon('info'); // Chrome's site-info (tune) icon
      const blur = (t) => esc(t).replace(/\{\{(.*?)\}\}/g, '<span class="pii">$1</span>');
      $('#brUrl').innerHTML = m ? `${blur(m[2])}<span class="dim">${blur(m[3])}</span>` : blur(url);
    },
    setTitle(id, title) { const t = this.tab(id); t.title = title; $('.tt', this.tabEl(id)).textContent = title; },
    setUrl(id, url) { this.tab(id).url = url; if (this.active === id) this.showUrl(url); },
    setPage(id, page) { this.tab(id).page = page; if (this.active === id) this.activate(id); },
    loading(id, on) {
      const f = $('.fav', this.tabEl(id));
      if (on) f.innerHTML = '<span class="br-fav spin"></span>';
      else f.innerHTML = FAV[this.tab(id).fav] || FAV.site;
    },
    async clickTab(id, o = {}) { await clickUi(this.tabEl(id), { kind: 'arrow', after: 60, ...o }); this.activate(id); await wait(160); },
    /** focus the omnibox and type an address (half-width), Enter */
    async typeUrl(text, o = {}) {
      await clickUi('#brOmni', { kind: 'text' });
      $('#brOmni').classList.add('focus');
      $('#brUrl').innerHTML = `<span class="selbg" style="background:#c6dafc">${$('#brUrl').textContent}</span>`;
      await wait(200);
      await typeInto(fieldTarget($('#brUrl')), [{ direct: text }], { kps: 14, keepStrip: true });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(800);
      $('#brOmni').classList.remove('focus');
      await wait(o.after != null ? o.after : 100);
    },
    async newTab(id, o = {}) {
      await clickUi('#brNewTab', { kind: 'arrow', after: 80 });
      this.addTab({ id, title: '新しいタブ', url: '', page: 'blank', fav: 'blank' }, { anim: true });
      await wait(250);
    },
  };

  /* ---------------------------------------------------------- dev / live site frames */
  const SiteView = {
    async load(iframe, o = {}) {
      try { if (o.intro) sessionStorage.removeItem('ne_intro_seen'); else sessionStorage.setItem('ne_intro_seen', '1'); } catch (e) {}
      const doc = await window.SiteFrame.load(iframe, 'live', o);
      return doc;
    },
    async scroll(iframe, y, ms = 1200, easing = Ease.inOut) {
      const w = iframe.contentWindow;
      const s = w.scrollY;
      await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), easing);
    },
    yOf(iframe, el, offset = 0) { return el.getBoundingClientRect().top + iframe.contentWindow.scrollY - offset; },
  };

  const AstroErr = {
    show(path, line, srcLines, hlIdx) {
      $('#aeTitle').innerHTML = `Could not import <code>${esc(path)}</code>.`;
      $('#aeLoc').textContent = `src/pages/[...slug].astro:${line}:26`;
      $('#aeCode').innerHTML = srcLines.map((l, i) => `<span class="${i === hlIdx ? 'hl' : ''}"><span class="n">${line - hlIdx + i}</span>${esc(l)}</span>`).join('');
      $('#astroErr').classList.add('show');
    },
    hide() { $('#astroErr').classList.remove('show'); },
  };

  /* ========================================================================= CMS
   * The real Sveltia CMS with the site's own /admin/config.yml, captured state by state (js/cms-snapshot.js,
   * tools/snapshots/ne-auberge/capture-cms.js) and shown in a frame (js/real-ui.js). The typing is drawn over the CMS's
   * own inputs; the state after each step is the one the CMS rendered for that input. */
  const strip = (t) => String(t || '').replace(/[⁦-⁩]/g, '');
  const Cms = {
    snap: window.CMS_SNAPSHOT,
    frame: null,
    async init() { this.frame = await new window.RealUI.Frame($('#cmsPage'), this.snap, { title: 'Sveltia CMS' }).load('settingsList'); },
    show(name, o) { this.frame.show(name, o); return this; },
    /** the address and the tab title the CMS had in that state */
    url(name) { return this.snap.states[name].url; },
    title(name) { return strip(this.snap.states[name].title); },
    row(re) { return this.frame.$$('[role="row"]').find((r) => re.test(r.textContent.trim())); },
    coll(label) { return this.frame.$(`[role="treeitem"][data-label="${label}"]`); },
    input(key) { return this.frame.$(`section[data-key-path="${key}"] input`); },
    saveButton() { return this.frame.$$('button').find((b) => b.textContent.trim() === '保存'); },
    /** scrolls the editor so the field sits in its upper half (as the mouse wheel would) */
    async reveal(key, ms = 900) {
      const inp = this.input(key);
      let box = inp.parentElement;
      while (box && !(box.scrollHeight > box.clientHeight + 2 && /auto|scroll/.test(this.frame.win.getComputedStyle(box).overflowY))) box = box.parentElement;
      if (!box) return;
      const r = inp.getBoundingClientRect(), br = box.getBoundingClientRect();
      await this.frame.scrollBox(box, Math.max(0, box.scrollTop + r.top - br.top - br.height * 0.42), ms);
    },
    async type(key, script, o = {}) {
      const inp = this.input(key);
      await clickUi(inp, { kind: 'text', ax: 0.15, after: 80 });
      const t = this.frame.typeTarget(inp);
      const text = await typeInto(t, script, { kps: o.kps || 12 });
      t.done(text);
      return text;
    },
  };

  /* ================================================================ Tag Manager */
  const GTM_ID = S.gtmId || 'GTM-MCB2MDKB';
  const Gtm = {
    tags: [
      { name: 'Google タグ - G-GREWV04PEW', type: 'Google タグ', trig: 'Initialization - All Pages', init: true, date: '3 日前' },
      { name: 'gtag.js - G-88EYJ4NSQJ', type: 'カスタム HTML', trig: 'All Pages', date: '3 日前' },
      { name: 'Meta Pixel - PageView', type: 'カスタム HTML', trig: 'All Pages', date: '3 日前' },
    ],
    cur: { name: '', tagId: '' },
    init() {
      $('#gtmPage').innerHTML = `<div class="gtm">
        <div class="gtm-top"><span class="gtm-prod"><img class="lg-img" src="../../shared/favicons/gtm.svg" alt="">Tag Manager</span>
          <span class="gtm-acc"><small>すべてのアカウント › Né</small><b>ne-auberge.jp</b></span>
          <span class="gtm-acc"><small>コンテナ</small><b>${GTM_ID}</b></span>
          <div class="r"><span class="gtm-ws">ワークスペース: Default Workspace</span><span class="gbtn out" id="gtmPreview">プレビュー</span><span class="gbtn fill" id="gtmSubmit">送信</span></div></div>
        <div class="gtm-body">
          <nav class="gtm-nav"><div class="ws">現在のワークスペース<b>Default Workspace</b></div>
            <div class="gtm-ni" data-nav="overview">${icon('home')}概要</div>
            <div class="gtm-ni" data-nav="tags">${icon('tag')}タグ</div>
            <div class="gtm-ni" data-nav="triggers">${icon('bolt')}トリガー</div>
            <div class="gtm-ni" data-nav="vars">${icon('variable')}変数</div>
            <div class="gtm-ni">${icon('folder')}フォルダ</div>
            <div class="gtm-ni">${icon('blocks')}テンプレート</div></nav>
          <main class="gtm-main" id="gtmMain"></main>
          <div class="gtm-panel" id="gtmPanel"></div>
          <div class="gtm-pick" id="gtmPick"></div>
        </div>
        <div class="gtm-dlg" id="gtmDlg"></div></div>`;
      this.overview();
    },
    nav(k) { $$('.gtm-ni').forEach((n) => n.classList.toggle('on', n.dataset.nav === k)); },
    overview() {
      this.nav('overview');
      $('#gtmMain').innerHTML = `<div class="gtm-overview">
        <div class="gtm-card"><small>ワークスペースの変更</small><b>0</b></div>
        <div class="gtm-card"><small>公開中のバージョン</small><b>Version 3</b></div>
        <div class="gtm-card"><small>コンテナ ID</small><b>${GTM_ID}</b></div></div>
        <div class="gtm-card"><div class="gtm-card-h">計測設計（ne-auberge.jp）</div>
        <table class="gtm-tbl"><tr><th>目的</th><th>計測</th><th>送信先</th></tr>
        <tr><td>サイト全体の流入・回遊</td><td>page_view / scroll / user_engagement（拡張計測）</td><td>GA4（メイン / 関連プロパティ）</td></tr>
        <tr><td>予約サイトへの送客</td><td>click（外部リンク：CHILLNN / TableCheck）</td><td>GA4</td></tr>
        <tr><td>広告の最適化</td><td>PageView</td><td>Meta Pixel</td></tr></table></div>`;
    },
    tagsView(newIdx = -1) {
      this.nav('tags');
      $('#gtmMain').innerHTML = `<div class="gtm-card"><div class="gtm-card-h">タグ<span class="gbtn fill" id="gtmNew">新規</span></div>
        <table class="gtm-tbl"><tr><th>名前</th><th>タイプ</th><th>配信トリガー</th><th>最終編集日</th></tr>
        ${this.tags.map((t, i) => `<tr class="${i === newIdx && !Clock.ff ? 'new' : ''}" data-row="${i}"><td class="nm">${esc(t.name)}</td><td>${esc(t.type)}</td><td><span class="trg${t.init ? ' init' : ''}">${esc(t.trig)}</span></td><td>${t.date}</td></tr>`).join('')}
        </table></div>`;
    },
    row(i) { return $(`tr[data-row="${i}"] td.nm`); },
    panel(t) {
      const typeHtml = t.tagId != null
        ? `<div class="gtm-type"><span class="ic" style="background:#1a73e8">G</span><span class="tt"><b>Google タグ</b><small>Google マーケティング プラットフォーム</small></span></div>
           <div class="gtm-fl">タグ ID</div><div class="gtm-in" id="gtmTagId">${esc(t.tagId)}</div>
           <div class="gtm-fl">設定パラメータ ・ 共有イベント設定</div>`
        : `<div class="gtm-empty" id="gtmChooseType"><span class="big">${icon('tag')}</span><span>タグタイプを選択して設定を開始…</span></div>`;
      const trgHtml = t.trig
        ? `<div class="gtm-type"><span class="ic" style="background:#1e8e3e">${icon('eye')}</span><span class="tt"><b>${esc(t.trig)}</b><small>ページビュー</small></span></div>`
        : `<div class="gtm-empty" id="gtmChooseTrig"><span class="big">${icon('bolt')}</span><span>トリガーを選択してこのタグを配信…</span></div>`;
      $('#gtmPanel').innerHTML = `<div class="gtm-ph">${icon('close')}<span class="gtm-name" id="gtmName">${t.name ? esc(t.name) : '<span style="color:#9aa0a6">名前のないタグ</span>'}</span>
          <div class="r"><span class="gbtn fill" id="gtmSave">保存</span></div></div>
        <div class="gtm-pb"><div class="gtm-sec"><h4>タグの設定</h4>${typeHtml}</div><div class="gtm-sec"><h4>トリガー</h4>${trgHtml}</div></div>`;
    },
    picker(kind) {
      const opts = kind === 'type'
        ? [['G', '#1a73e8', 'Google タグ', 'Google マーケティング プラットフォーム', 'googtag'], ['G', '#e37400', 'Google アナリティクス: GA4 イベント', 'Google マーケティング プラットフォーム', 'ga4evt'], ['&lt;/&gt;', '#5f6368', 'カスタム HTML', 'カスタム HTML タグ', 'html']]
        : [['', '#1e8e3e', 'All Pages', 'ページビュー', 'all'], ['', '#f29900', 'Initialization - All Pages', '初期化', 'init'], ['', '#9334e6', 'Consent Initialization - All Pages', '同意の初期化', 'consent']];
      $('#gtmPick').innerHTML = `<h4>${kind === 'type' ? 'タグタイプを選択' : 'トリガーの選択'}</h4>` + opts.map(([l, c, n, s, k]) =>
        `<div class="gtm-opt" data-opt="${k}"><span class="gtm-type" style="padding:0"><span class="ic" style="background:${c}">${kind === 'type' ? l : icon('eye')}</span><span class="tt"><b>${n}</b><small>${s}</small></span></span></div>`).join('');
    },
    dialog(html) { const d = $('#gtmDlg'); d.innerHTML = html; d.classList.toggle('show', !!html); },
  };

  /* =============================================================== Tag Assistant */
  const TA = {
    render(state, tagsOk = true) {
      if (state === 'connect') {
        $('#taPage').innerHTML = `<div class="ta"><div class="ta-top"><img class="lg-img" src="../../shared/favicons/ta.svg" alt=""><span class="t">Tag Assistant</span></div>
          <div style="display:flex;justify-content:center;padding-top:90px"><div class="gtm-dlg-box" style="box-shadow:0 1px 3px rgba(60,64,67,.3)">
            <h3>ウェブサイトに接続</h3><div style="color:#5f6368;margin-bottom:14px">コンテナ ${GTM_ID} のプレビューを開始します。ウェブサイトの URL を入力してください。</div>
            <div class="gtm-fl">ウェブサイトの URL</div><div class="gtm-in" id="taUrl" style="width:100%"></div>
            <div class="row"><span class="gbtn">キャンセル</span><span class="gbtn fill" id="taConnect">接続</span></div></div></div></div>`;
        return;
      }
      const ev = ['Consent Initialization', 'Initialization', 'Container Loaded', 'DOM Ready', 'Window Loaded'];
      const fired = [
        ['Google タグ - G-GREWV04PEW', 'Initialization'],
        ['GA4 - Google タグ', 'Container Loaded', this.tagId],
        ['gtag.js - G-88EYJ4NSQJ', 'Container Loaded'],
        ['Meta Pixel - PageView', 'Container Loaded'],
      ];
      $('#taPage').innerHTML = `<div class="ta"><div class="ta-top"><img class="lg-img" src="../../shared/favicons/ta.svg" alt=""><span class="t">Tag Assistant</span><span class="ta-conn">接続済み: localhost:4321</span>
          <span style="margin-left:auto;color:#5f6368;font-size:12.5px">コンテナ ${GTM_ID} ・ Default Workspace</span></div>
        <div class="ta-body"><div class="ta-left"><h6>概要</h6>${ev.map((e, i) => `<div class="ta-ev${i === 2 ? ' on' : ''}${Clock.ff ? '' : ' new'}" style="animation-delay:${i * 120}ms"><span class="n">${i + 1}</span>${e}</div>`).join('')}</div>
          <div class="ta-main"><div class="ta-tabs"><span class="on">タグ</span><span>変数</span><span>データレイヤー</span><span>同意</span></div>
            <div class="ta-h">発動したタグ（${fired.length}）</div>
            <div class="ta-tags">${fired.map(([n, e, id], i) => `<div class="ta-tag${Clock.ff ? '' : ' new'}" style="animation-delay:${300 + i * 140}ms" ${id ? 'id="taMain"' : ''}><span class="cnt">1 回発動</span><b>${esc(n)}</b><small>${id ? 'tag_id: ' + esc(id) : e}</small></div>`).join('')}</div>
            <div class="ta-h">発動しなかったタグ（0）</div></div></div></div>`;
      void tagsOk;
    },
    tagId: '',
  };

  /* ================================================================== Analytics */
  const GA = {
    events: [],
    render(view) {
      const top = `<div class="ga-top"><img class="lg-img" src="../../shared/favicons/ga.svg" alt=""><span class="t">Analytics</span>
        <span class="ga-prop"><small>すべてのアカウント › Né</small><b>ne-auberge.jp（GA4）</b></span></div>`;
      const rail = `<div class="ga-rail"><span>${icon('home')}</span><span>${icon('chart')}</span><span>${icon('search')}</span><span class="${view === 'admin' ? 'on' : ''}" id="gaAdminBtn">${icon('settings')}</span></div>`;
      let main;
      if (view === 'admin') {
        main = `<div class="ga-h">管理 › データ ストリーム</div><div class="ga-admin"><h4>ウェブ ストリームの詳細</h4><div class="u">https://ne-auberge.jp</div>
          <div class="ga-kv"><span>ストリーム名</span><b style="font-family:inherit">ne-auberge.jp</b><span>ストリーム URL</span><b>https://ne-auberge.jp</b><span>測定 ID</span><b id="gaMid">G-MEEEN9DKT1</b><span>拡張計測機能</span><b style="font-family:inherit">ページビュー・スクロール・離脱クリック・サイト内検索 ほか</b></div></div>`;
      } else {
        const n = this.events.length;
        const stream = n
          ? `<div class="ga-stream">${this.events.map((e) => `<div class="ga-evt${e.conv ? ' conv' : ''}"><span class="tm">${e.t}</span><span class="dot"></span><span class="pill">${esc(e.name)}</span><span class="pm">${esc(e.pm || '')}</span></div>`).join('')}</div>`
          : `<div class="ga-emptymsg"><b>デバッグ デバイスが見つかりません</b>GTM のプレビュー（Tag Assistant）や debug_mode を有効にした端末からのイベントが、<br>ここにリアルタイムで表示されます。</div>`;
        const counts = {};
        this.events.forEach((e) => { counts[e.name] = (counts[e.name] || 0) + 1; });
        main = `<div class="ga-h">DebugView<span class="ga-dev">デバッグ デバイス: <b id="gaDevN">${n ? '1' : '0'}</b></span></div>
          <div class="ga-grid"><div class="ga-col"><h5>過去 30 分</h5><div class="ga-min">${[30, 25, 20, 15, 10, 5, 1].map((m, i) => `<span class="${n && i === 6 ? 'on' : ''}">${n && i === 6 ? n : 0}</span>`).join('')}</div></div>
          <div class="ga-col" id="gaStream"><h5>秒ストリーム</h5>${stream}</div>
          <div class="ga-col"><h5>上位イベント（30 分）</h5><div class="ga-top10">${Object.entries(counts).map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join('') || '<div style="color:#9aa0a6;font-family:inherit">—</div>'}</div></div></div>`;
      }
      $('#gaPage').innerHTML = `<div class="ga">${top}<div class="ga-body">${rail}<div class="ga-main">${main}</div></div></div>`;
    },
  };

  /* =================================================================== validator
   * The real Schema Markup Validator (validator.schema.org), driven with this page's source and captured state by state
   * (js/validator-snapshot.js, tools/snapshots/ne-auberge/capture-validator.js). */
  const Val = {
    snap: window.VALIDATOR_SNAPSHOT,
    frame: null,
    async init() { this.frame = await new window.RealUI.Frame($('#valPage'), this.snap, { title: this.snap.title }).load('dialogUrl'); },
    show(name, o) { this.frame.show(name, o); return this; },
    resultList() { return this.frame.$('#results-cell ul.mdl-list'); },
    title() { return this.snap.title; },
    url(name) { return this.snap.states[name].url; },
    dialog() { return this.frame.$$('.XKSfm-Sx9Kwc').find((d) => d.getClientRects().length); },
    snippetTab() { return this.frame.$('#new-test-code'); },
    dialogEditor() { const d = this.dialog(); return d && d.querySelector('.CodeMirror'); },
    runButton() { return this.frame.$$('button, [role=button]').filter((e) => e.textContent.trim() === 'テストを実行' && e.getClientRects().length).pop(); },
    editor() { return this.frame.$$('.CodeMirror').find((c) => !c.closest('.XKSfm-Sx9Kwc')); },
    playButton() { return this.frame.$$('button, [role=button]').find((e) => e.textContent.trim() === 'play_arrow'); },
    errorItem() { return this.frame.$('#results-cell li.mdl-list__item'); },
    results() { return this.frame.$('#results-cell'); },
    /** the line of the editor the validator marks with the error icon */
    errorLine() { const m = this.frame.$$('.CodeMirror-gutter-elt').find((e) => !/^\d+$/.test(e.textContent.trim())); return m && m.closest('.CodeMirror-code > div, .CodeMirror-line, pre') ; },
  };

  /* ================================================================ view-source
   * Chrome's own view-source page of the dev server's HTML (js/view-source-snapshot.js: the markup Blink built and its
   * view-source.css, tools/snapshots/ne-auberge/capture-view-source.js). Ctrl+A is a real selection in the frame. */
  const VS = window.VIEW_SOURCE_SNAPSHOT;
  const Src = {
    frame: null,
    async init() {
      const snap = { styles: [VS.css], htmlAttrs: VS.states.broken.htmlAttrs, states: VS.states };
      // Chrome on Windows draws a selection in the system highlight colour, with white text
      this.frame = await new window.RealUI.Frame($('#srcPage'), snap, { title: 'view-source', extraCss: '::selection { background-color: rgb(51, 103, 209); color: #fff; }' }).load('broken');
    },
    render(which) { this.frame.show(which); this.frame.win.scrollTo(0, 0); },
    selectAll(on) {
      const sel = this.frame.doc.getSelection();
      sel.removeAllRanges();
      if (on) sel.selectAllChildren(this.frame.doc.body);
    },
  };

  window.Apps = { Design, Layers, Props, Vars, Code, Term, Browser, SiteView, AstroErr, Cms, Gtm, TA, GA, Val, Src, rgbToHex, varOfColor, ROOT_VARS };
})();
