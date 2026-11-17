/*
 * The desktop apps of the demo:
 *   Design  — Figma desktop app: two pages (Brand Guidelines boards, Web — Top frames that render the real page),
 *             local variables, Dev Mode inspect, a variables -> JSON plugin window
 *   Code    — VS Code: explorer, tabs, editor (vertical AND horizontal scrolling that follows the caret, like the real
 *             editor, so code typed past the right edge of a snapped window stays in view), terminal
 *   Browser — Chrome: tabs, omnibox, the WordPress front (live mode frame), device mode, DevTools console
 * The WordPress admin screens live in wp.js. All UIs are simplified look-alikes; the taskbar / title bars show the
 * real app icons.
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$, esc, icon, clamp, wait, kw, tween, Ease, Cursor, UI, screenRect, clickUi, Keycap, KeyStrip, typeInto, fieldTarget, Clock } = D;
  const S = window.SITE_SNAPSHOT;
  const TF = window.ThemeFiles;

  /* ====================================================================== DESIGN */
  const Design = {
    cam: { x: 0, y: 0, z: 0.5 },
    frames: {},
    page: 'brand',
    sel: null, hov: null,
    init() {
      this.canvas = $('#fgCanvas');
      this.world = $('#fgWorld');
      this.apply();
      D.frameFns.add(() => this.track());
      Props.empty();
    },
    apply() {
      const { x, y, z } = this.cam;
      this.world.style.transform = `translate(${(-x * z).toFixed(2)}px, ${(-y * z).toFixed(2)}px) scale(${z})`;
      $('#fgZoom').textContent = Math.round(z * 100) + '%';
      Object.values(this.frames).forEach((f) => { f.label.style.fontSize = 12 / z + 'px'; f.label.style.paddingBottom = 5 / z + 'px'; });
      $$('.fg-cmp-tag', this.world).forEach((t) => { t.style.fontSize = 11 / z + 'px'; });
    },
    view() { const r = this.canvas.getBoundingClientRect(); return { w: r.width, h: r.height, r }; },
    camFor(x, y, w, h, o = {}) {
      const v = this.view();
      const pad = o.pad != null ? o.pad : 70;
      const z = o.z || Math.min((v.w - pad * 2) / w, (v.h - pad * 2) / h);
      return { x: x + w / 2 - v.w / 2 / z, y: o.top != null ? y - o.top / z : y + h / 2 - v.h / 2 / z, z };
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

    /** a board: plain html frame on the canvas (brand guideline pages) */
    addBoard(id, o) {
      const el = document.createElement('div');
      el.className = 'fg-frame fg-board';
      el.dataset.page = o.page || 'brand';
      el.style.left = o.x + 'px';
      el.style.top = o.y + 'px';
      el.innerHTML = `<div class="fg-flabel">${esc(o.label)}</div><div class="fg-fbody" style="width:${o.w}px;height:${o.h}px;background:${o.bg || '#fff'}">${o.html || ''}</div>`;
      this.world.appendChild(el);
      const f = { id, el, label: el.querySelector('.fg-flabel'), body: el.querySelector('.fg-fbody'), x: o.x, y: o.y, w: o.w, h: o.h, name: o.label, page: el.dataset.page };
      this.frames[id] = f;
      if (o.hidden) el.style.visibility = 'hidden';
      this.apply();
      return f;
    },
    /** a frame that renders the real page (static mode) */
    async addSiteFrame(id, o) {
      const el = document.createElement('div');
      el.className = 'fg-frame';
      el.dataset.page = o.page || 'web';
      el.style.left = o.x + 'px';
      el.style.top = o.y + 'px';
      el.innerHTML = `<div class="fg-flabel">${esc(o.label)}</div><div class="fg-fbody"><iframe scrolling="no" tabindex="-1"></iframe></div>`;
      this.world.appendChild(el);
      const f = { id, el, label: el.querySelector('.fg-flabel'), body: el.querySelector('.fg-fbody'), iframe: el.querySelector('iframe'), x: o.x, y: o.y, w: o.w, h: o.h, name: o.label, page: el.dataset.page };
      f.iframe.style.width = o.w + 'px';
      f.iframe.style.height = (o.ih || 9600) + 'px';
      f.body.style.width = o.w + 'px';
      f.body.style.height = o.h + 'px';
      if (o.hiddenUntilLoad) el.style.visibility = 'hidden';
      this.frames[id] = f;
      this.apply();
      f.doc = await window.SiteFrame.load(f.iframe, 'static', { view: o.view || 'pc', vh: o.vh || 9, w: o.w, before: o.before });
      f.win = f.iframe.contentWindow;
      return f;
    },
    /** a frame with a sheet of real site components (the site's CSS, chosen pieces of its markup) */
    async addSheet(id, o) {
      const el = document.createElement('div');
      el.className = 'fg-frame';
      el.dataset.page = o.page || 'brand';
      el.style.left = o.x + 'px';
      el.style.top = o.y + 'px';
      el.innerHTML = `<div class="fg-flabel">${esc(o.label)}</div><div class="fg-fbody" style="width:${o.w}px;height:${o.h}px"><iframe scrolling="no" tabindex="-1" style="width:${o.w}px;height:${o.h}px"></iframe></div>`;
      this.world.appendChild(el);
      const f = { id, el, label: el.querySelector('.fg-flabel'), body: el.querySelector('.fg-fbody'), iframe: el.querySelector('iframe'), x: o.x, y: o.y, w: o.w, h: o.h, name: o.label, page: el.dataset.page };
      if (o.hidden) el.style.visibility = 'hidden';
      this.frames[id] = f;
      this.apply();
      f.doc = await window.SiteFrame.loadSheet(f.iframe, o.body, o.css || '');
      f.win = f.iframe.contentWindow;
      return f;
    },
    showPage(p) {
      this.page = p;
      Object.values(this.frames).forEach((f) => { f.el.style.display = f.page === p ? '' : 'none'; });
      $$('.fg-note', this.world).forEach((n) => { n.style.display = (n.dataset.page || 'web') === p ? '' : 'none'; });
      $$('#fgPages .fg-page').forEach((e) => { const on = e.dataset.page === p; e.classList.toggle('on', on); e.querySelector('i').innerHTML = on ? icon('check') : ''; });
      Layers.page(p);
    },
    rename(f, name) { f.name = name; f.label.textContent = name; },
    contentH(f) { return Math.ceil(f.doc.body.getBoundingClientRect().height); },
    fitHeight(f) { f.h = Math.max(200, this.contentH(f)); f.body.style.height = f.h + 'px'; },
    worldY(f, el) { return f.y + el.getBoundingClientRect().top + (f.win ? f.win.scrollY : 0); },

    select(target) {
      this.sel = target;
      $('#fgSel').classList.toggle('show', !!target);
      $('#fgSel').classList.toggle('cmp', !!(target && target.cmp));
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
        place($('#fgSel'), this.sel);
        const t = this.sel;
        const w = t.el ? t.el.getBoundingClientRect().width : t.frame.w;
        const h = t.el ? t.el.getBoundingClientRect().height : t.frame.h;
        $('#fgSelSize').textContent = `${Math.round(w)} × ${Math.round(h)}`;
      }
      if (this.hov) place($('#fgHov'), this.hov);
    },
    setTool(name) { $$('.fg-tool[data-tool]').forEach((t) => t.classList.toggle('active', t.dataset.tool === name)); },
    leftTab(name) {
      $$('.fg-ltabs span').forEach((s) => s.classList.toggle('on', s.dataset.ltab === name));
      $$('.fg-lpane').forEach((p) => p.classList.toggle('on', p.dataset.lpane === name));
    },
    note(page, x, y, html, o = {}) {
      const n = document.createElement('div');
      n.className = 'fg-note' + (Clock.ff ? '' : ' pop');
      n.dataset.page = page;
      n.style.left = x + 'px';
      n.style.top = y + 'px';
      if (o.w) n.style.width = o.w + 'px';
      n.innerHTML = html;
      this.world.appendChild(n);
      return n;
    },
  };

  const Layers = {
    items: { brand: [], web: [] }, cur: 'brand',
    page(p) { this.cur = p; this.render(); },
    get list() { return this.items[this.cur]; },
    render() {
      const IC = { frame: 'frame', section: 'square', text: 'type', image: 'image', group: 'layers', component: 'blocks', instance: 'blocks' };
      $('#fgLayers').innerHTML = this.list.map((it) =>
        `<div class="fg-layer ${it.kind}${it.sel ? ' sel' : ''}${it.isNew ? ' new' : ''}" data-key="${it.key}" style="padding-left:${8 + it.depth * 16}px">` +
        `<span class="lic">${icon(IC[it.kind] || 'square')}</span><span>${esc(it.name)}</span></div>`).join('');
      this.list.forEach((it) => { it.isNew = false; });
    },
    add(item, o = {}) {
      const page = o.page || this.cur;
      const L = this.items[page];
      item.isNew = !Clock.ff;
      const i = o.after ? L.findIndex((x) => x.key === o.after) : -1;
      if (o.first) L.unshift(item);
      else if (i >= 0) {
        let j = i + 1;
        while (j < L.length && L[j].depth > L[i].depth) j++;
        if (o.child) j = i + 1;
        L.splice(j, 0, item);
      } else L.push(item);
      if (page === this.cur) this.render();
    },
    rename(key, name) { const it = this.list.find((x) => x.key === key); if (it) { it.name = name; this.render(); } },
    kind(key, kind) { const it = this.list.find((x) => x.key === key); if (it) { it.kind = kind; this.render(); } },
    select(key) { this.list.forEach((x) => { x.sel = x.key === key; }); this.render(); },
    el(key) { return $(`.fg-layer[data-key="${key}"]`); },
  };

  function rgbToHex(rgb) {
    const m = String(rgb).match(/\d+(\.\d+)?/g);
    if (!m) return '';
    return '#' + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  const varOfColor = (hx) => { const c = TF.COLORS.find((k) => k.color.toUpperCase() === String(hx).toUpperCase()); return c ? 'color/' + c.slug : ''; };

  const Props = {
    root() { return $('#fgProps'); },
    tabs(dev) { $('#fgRtabs').innerHTML = dev ? '<span class="on">インスペクト</span><span>プラグイン</span>' : '<span class="on">デザイン</span><span>プロトタイプ</span>'; },
    empty() {
      this.tabs(false);
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-ps-h">ページ</div>
        <div class="fg-row one"><div class="fg-in"><span class="sw" style="background:#F5F5F5"></span><span class="v">F5F5F5</span><span class="k" style="margin-left:auto">100%</span></div></div></div>
        <div class="fg-ps"><div class="fg-ps-h">ローカル変数<span class="ic" id="fgVarsBtn">${icon('variable')}</span></div><div class="fg-hint">ブランドの色・書体・レイアウト値を変数として定義し、デザインと WordPress テーマ（theme.json）で共有します。</div></div>
        <div class="fg-ps"><div class="fg-ps-h">スタイル</div><div class="fg-hint">テキストスタイル 6 ・ カラースタイル 8</div></div>
        <div class="fg-ps"><div class="fg-ps-h">書き出し<span class="ic">${icon('plus')}</span></div></div>`;
    },
    fillRow(hx) {
      const v = varOfColor(hx);
      return `<div class="fg-row one"><div class="fg-in" data-f="fill">${v ? `<span class="fg-var"><span class="sw" style="background:${hx}"></span>${esc(v)}</span><span class="k" style="margin-left:auto">${hx.slice(1)}</span>` : `<span class="sw" style="background:${hx}"></span><span class="v">${hx.slice(1)}</span>`}</div></div>`;
    },
    frame(f) {
      this.tabs(false);
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-title">${icon('frame')}${esc(f.name)}<small>フレーム</small></div></div>
        <div class="fg-ps"><div class="fg-ps-h">フレーム</div>
          <div class="fg-row"><div class="fg-in"><span class="k">X</span><span class="v">${Math.round(f.x)}</span></div><div class="fg-in"><span class="k">Y</span><span class="v">${Math.round(f.y)}</span></div></div>
          <div class="fg-row"><div class="fg-in" data-f="w"><span class="k">W</span><span class="v">${f.w}</span></div><div class="fg-in" data-f="h"><span class="k">H</span><span class="v">${f.h}</span></div></div></div>
        <div class="fg-ps"><div class="fg-ps-h">レイアウトグリッド<span class="ic">${icon('plus')}</span></div>
          <div class="fg-row one"><div class="fg-in"><span class="v">${f.w > 800 ? '12 列 ・ 余白 48（padding-inline）・ 溝 24（gutter）' : '4 列 ・ 余白 16 ・ 溝 15'}</span></div></div></div>`;
    },
    text(el, name, o = {}) {
      this.tabs(false);
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? 0 : parseFloat(cs.lineHeight);
      const ls = parseFloat(cs.letterSpacing) || 0;
      const fam = o.family || cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const hx = rgbToHex(cs.color);
      const r1 = (n) => Math.round(n * 10) / 10;
      const wt = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' }[cs.fontWeight] || cs.fontWeight;
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-title">${icon('type')}${esc(name)}<small>テキスト</small></div></div>
        <div class="fg-ps"><div class="fg-ps-h">タイポグラフィ<span class="ic">${icon('settings')}</span></div>
          ${o.style ? `<div class="fg-row one"><div class="fg-in"><span class="fg-var">${icon('type')}${esc(o.style)}</span></div></div>` : ''}
          <div class="fg-row one"><div class="fg-in"><span class="v">${esc(fam)}</span></div></div>
          <div class="fg-row"><div class="fg-in"><span class="v">${esc(wt)}</span></div><div class="fg-in" data-f="size"><span class="v">${r1(size)}</span></div></div>
          <div class="fg-row"><div class="fg-in"><span class="k">行間</span><span class="v">${lh ? Math.round((lh / size) * 100) + '%' : 'Auto'}</span></div><div class="fg-in"><span class="k">字間</span><span class="v">${r1((ls / size) * 100)}%</span></div></div>
        </div>
        <div class="fg-ps"><div class="fg-ps-h">塗り<span class="ic">${icon('plus')}</span></div>${this.fillRow(hx)}</div>`;
    },
    /** component properties (Figma: component set / instance) */
    component(name, props, o = {}) {
      this.tabs(false);
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-title cmp">${icon('blocks')}${esc(name)}<small>${o.instance ? 'インスタンス' : 'コンポーネント'}</small></div></div>
        <div class="fg-ps"><div class="fg-ps-h">プロパティ<span class="ic">${icon('plus')}</span></div>
          ${props.map(([k, kind, v], i) => `<div class="fg-prop${Clock.ff || !o.anim ? '' : ' new'}" style="animation-delay:${i * 90}ms" data-prop="${esc(k)}"><span class="pk">${icon(kind === 'bool' ? 'check' : kind === 'variant' ? 'blocks' : 'type')}${esc(k)}</span><span class="pv">${esc(v)}</span></div>`).join('')}
        </div>
        ${o.note ? `<div class="fg-ps"><div class="fg-hint">${o.note}</div></div>` : ''}`;
    },
    /** Dev Mode: inspect panel with the CSS of the selected element (computed in the frame) */
    inspect(el, name) {
      this.tabs(true);
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const bg = rgbToHex(cs.backgroundColor), fg = rgbToHex(cs.color);
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const lines = [
        `display: ${cs.display === 'inline' ? 'inline-flex' : cs.display};`,
        `width: ${Math.round(r.width)}px;`, `height: ${Math.round(r.height)}px;`,
        `padding: ${cs.padding};`,
        `border-radius: ${cs.borderTopLeftRadius};`,
        `background: var(--color-highlight, ${bg});`,
        `color: var(--color-white, ${fg});`,
        `font-family: ${fam};`, `font-size: ${cs.fontSize};`, `font-weight: ${cs.fontWeight};`,
      ];
      this.root().innerHTML = `<div class="fg-ps"><div class="fg-title cmp">${icon('blocks')}${esc(name)}<small>Button / Primary</small></div></div>
        <div class="fg-ps"><div class="fg-ps-h">変数</div>
          <div class="fg-row one"><div class="fg-in"><span class="fg-var"><span class="sw" style="background:${bg}"></span>color/highlight</span><span class="k" style="margin-left:auto">${bg.slice(1)}</span></div></div>
          <div class="fg-row one"><div class="fg-in"><span class="fg-var"><span class="sw" style="background:${fg};box-shadow:inset 0 0 0 1px #ccc"></span>color/white</span><span class="k" style="margin-left:auto">${fg.slice(1)}</span></div></div></div>
        <div class="fg-ps"><div class="fg-ps-h">コード<span class="k">CSS</span></div><pre class="fg-code">${lines.map((l) => { const [k, ...v] = l.split(':'); return `<span class="ck">${esc(k)}</span>:${esc(v.join(':'))}`; }).join('\n')}</pre></div>`;
    },
    field(name) { return $(`.fg-in[data-f="${name}"]`, this.root()); },
    flash(name) { const f = this.field(name); if (f) { f.classList.remove('changed'); void f.offsetWidth; f.classList.add('changed'); } },
  };

  const Vars = {
    open() { $('#fgVars').classList.add('show'); },
    close() { $('#fgVars').classList.remove('show'); },
    rows(coll) {
      if (coll === 'color') return TF.COLORS.map((c) => ['color/' + c.slug, c.color, 'color']);
      if (coll === 'type') return TF.FONTS.map((f) => ['font/' + f.slug, f.fontFamily, 'str']).concat([['size/heading-section', '20', 'num'], ['size/display-house', '64', 'num'], ['size/body', '16', 'num'], ['size/caption', '12', 'num']]);
      return TF.LAYOUT.map(([k, v]) => ['layout/' + k, String(v).replace('px', ''), 'num']);
    },
    async show(coll, o = {}) {
      $$('.fg-vcoll').forEach((c) => c.classList.toggle('on', c.dataset.coll === coll));
      const t = $('#fgVarTable');
      t.innerHTML = `<div class="fg-vrow head"><span>名前</span><span>値</span><span>CSS / theme.json</span></div>`;
      for (const [k, v, kind] of this.rows(coll)) {
        const val = kind === 'color' ? `<span class="sw" style="background:${v}"></span>${v.slice(1).toUpperCase()}` : esc(v.length > 30 ? v.slice(0, 29) + '…' : v);
        const css = kind === 'color' ? `--wp--preset--color--${k.split('/')[1]}` : kind === 'str' ? `--wp--preset--font-family--${k.split('/')[1]}` : k.startsWith('size') ? `--wp--preset--font-size--${k.split('/')[1]}` : `--${k.split('/')[1]}`;
        t.insertAdjacentHTML('beforeend', `<div class="fg-vrow${Clock.ff ? '' : ' new'}"><span class="nm">${icon(kind === 'color' ? 'eye' : 'variable')}${esc(k)}</span><span class="vl">${val}</span><span class="vl" style="color:#888">${esc(css)}</span></div>`);
        await kw(o.gap || 150);
      }
    },
  };

  const Plugin = {
    show() { $('#fgPluginJson').textContent = TF.TOKENS_JSON; $('#fgPlugin').classList.add('show'); },
    hide() { $('#fgPlugin').classList.remove('show'); },
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
    files: {}, tabs: [], active: null, top: 0, left: 0,
    ins: null, sel: null, sq: [], lineCls: {}, status: {},
    tree: [],
    init() {
      for (const [p, text] of Object.entries(TF.files)) this.files[p] = { path: p, lang: TF.langOf(p), lines: text.split('\n'), dirty: false };
      this.tree = TF.tree.map(([path, kind, open]) => ({ path, dir: kind === 'dir', open: !!open }));
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
    clearStatus() { this.status = {}; this.renderTree(); this.gitBadge(); },
    /* ---- tabs + view */
    show(path, o = {}) {
      if (!this.tabs.includes(path)) this.tabs.push(path);
      this.active = path;
      const f = this.files[path];
      this.top = o.top != null ? o.top : (f.lastTop || 0);
      this.left = f.lastLeft || 0;
      this.lockLeft = false;
      this.ins = null; this.sel = null; this.sq = []; this.lineCls = {};
      $('#vsLang').textContent = { php: 'PHP', css: 'CSS', json: 'JSON', yaml: 'YAML', md: 'Markdown', html: 'XML' }[f.lang] || 'Plain Text';
      $('#vsIndent').textContent = f.lang === 'php' ? 'タブのサイズ: 4' : 'スペース: 2';
      $('#vsPos').textContent = 'Ln 1, Col 1';
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
    /** open a closed folder in the explorer (click on it) */
    async expand(path) {
      const n = this.tree.find((x) => x.path === path);
      if (!n || n.open) return;
      await clickUi(this.node(path), { after: 40 });
      n.open = true;
      this.renderTree();
      await wait(160);
    },
    renderTabs() {
      $('#vsTabs').innerHTML = this.tabs.map((p) => {
        const f = this.files[p];
        return `<div class="vs-tab${p === this.active ? ' on' : ''}${f.dirty ? ' dirty' : ''}" data-tab="${esc(p)}">${fileIcon(p)}<span class="nm">${esc(p.split('/').pop())}</span><span class="x">${ci('close')}</span></div>`;
      }).join('');
      const p = this.active ? this.active.split('/') : [];
      $('#vsCrumbs').innerHTML = p.map((x, i) => (i ? ci('chevron-right') : '') + (i === p.length - 1 ? fileIcon(this.active) : '') + `<span>${esc(x)}</span>`).join('');
    },
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
      if (!f) { box.innerHTML = `<div class="vs-empty">${icon('code')}<span>ファイルを開いて編集を開始</span></div>`; this.hbar(0, 0, 0); return; }
      f.lastTop = this.top;
      const toks = TF.highlight(f.lang, f.lines);
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
     * Horizontal scrolling like the real editor: when the caret (or the IME composition) goes past the right edge the
     * view scrolls so it stays visible with some room ahead; when it comes back left of the view it scrolls back.
     */
    follow() {
      const box = $('#vsLines');
      const lc = box.querySelector('.lc');
      if (!lc) return;
      const vw = lc.clientWidth;
      const mark = box.querySelector('.probe') || box.querySelector('.caret');
      if (mark && vw && !this.lockLeft) {
        const x = mark.offsetLeft;          // position in the line, not affected by the scroll transform
        const comp = box.querySelector('.ime-c');
        const right = Math.max(x, comp ? comp.offsetLeft + comp.offsetWidth : 0);
        // like the editor: once the caret reaches the right edge the view follows it, a few characters ahead
        if (right - this.left > vw - 28) this.left = Math.ceil(right - vw + 56);
        else if (x - this.left < 10) this.left = Math.max(0, Math.floor(x - Math.min(120, vw * 0.25)));
        if (x < vw - 40 && this.left > 0 && right < vw - 28) this.left = 0;
      }
      const f = this.files[this.active];
      if (f) f.lastLeft = this.left;
      box.style.setProperty('--hx', this.left + 'px');
      // scrollbar thumb (shown while any visible line is wider than the view)
      let widest = 0;
      box.querySelectorAll('.lx').forEach((x) => { widest = Math.max(widest, x.offsetWidth); });
      this.hbar(vw, widest, this.left);
    },
    hbar(vw, widest, left) {
      const bar = $('#vsHbar');
      if (!bar) return;
      const on = widest > vw + 4 || left > 0;
      bar.classList.toggle('show', on);
      if (!on) return;
      const total = Math.max(widest + 40, left + vw);
      const th = bar.firstElementChild;
      th.style.width = Math.max(30, (vw / total) * 100) + '%';
      th.style.left = (left / total) * 100 + '%';
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
    /** horizontal scroll animation (e.g. to read the end of a long line) */
    async scrollX(left, ms = 700) {
      const s = this.left;
      this._hold = true;
      await tween(ms, (e) => { this.left = s + (left - s) * e; $('#vsLines').style.setProperty('--hx', this.left + 'px'); }, Ease.inOut);
      this._hold = false;
      this.lockLeft = true;
      this.render();
    },
    /** screen rect of a column position on a line (scrolls the line and the column into view first) */
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
    /** x position of a column in its line (px from the line start) and the visible width, without scrolling */
    measureCol(line, col) {
      const keep = this.lockLeft;
      this.lockLeft = true;
      this.probe = { line, col };
      this.render();
      const p = $('#vsLines .probe');
      const lc = p && p.closest('.lc');
      const out = { x: p ? p.offsetLeft : 0, vw: lc ? lc.clientWidth : 0 };
      this.probe = null;
      this.render();
      this.lockLeft = keep;
      return out;
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
      const a = this.colRect(line, from);
      Cursor.kind('text');
      await Cursor.moveTo(a.left + 1, a.top + LH / 2);
      Cursor.press();
      const b = this.colRect(line, to);
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
    /** select the whole file (Ctrl+A) */
    selectAll() {
      const f = this.files[this.active];
      this.selAll = true;
      $('#vsLines').classList.add('selall');
      void f;
    },
    clearSelectAll() { this.selAll = false; $('#vsLines').classList.remove('selall'); },
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
        // VS Code-like: keep the indentation, one more after an opening bracket, none after a closing doc comment
        enter(text) {
          const cur = (before + text).split('\n').pop();
          if (/^\s*\*\/\s*$/.test(cur)) return '\n';
          return '\n' + cur.match(/^\s*/)[0] + (/[[{(]\s*$/.test(cur) ? '\t' : '');
        },
      };
    },
    async type(script, o = {}) {
      if (typeof script === 'string') script = [{ direct: script }];
      await typeInto(this.target(), script, { kps: 20, ...o });
      this.ins.html = '<span class="caret"></span>';
      this.render();
    },
    /** End key on a line (caret at its end) */
    async newLineAfter(line, o = {}) {
      const f = this.files[this.active];
      await this.clickAt(line, Math.min(f.lines[line].length, o.clickCol != null ? o.clickCol : 4), o);
      KeyStrip.special('End');
      this.setCaret(line, f.lines[line].length);
      await kw(160);
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
    prompt: 'PS C:\\dev\\notahotel-wp> ',
    keep: 80,
    /** the terminal scrolls like the real one: the newest line (the prompt being typed) always stays in view */
    render(input) {
      const keep = this.lines.slice(-this.keep);
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
      this.lines.push(esc(this.prompt) + `<span class="tw2">${o.shown != null ? o.shown : esc(typed)}</span>`);
      this.render();
      for (const line of out) {
        if (typeof line === 'number') { await wait(line); continue; }
        if (typeof line === 'function') { await line(); continue; }
        this.lines.push(line);
        this.render();
        await kw(o.gap || 90);
      }
      this.render(o.noPrompt ? null : '<span class="caret"></span>');
    },
    /** a spinner line that is replaced by its result (wp-env, gh run watch) */
    async spin(text, ms, done) {
      const frames = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
      this.lines.push('');
      const i = this.lines.length - 1;
      const n = Math.max(1, Math.round(ms / 110));
      for (let k = 0; k < n; k++) { this.lines[i] = `<span class="tc">${frames[k % frames.length]}</span> ${text}`; this.render(null); await wait(110); }
      this.lines[i] = done;
      this.render(null);
    },
  };

  /* ===================================================================== BROWSER */
  const FI = (f) => `<img class="br-fav img" src="../../shared/favicons/${f}" alt="">`;
  const FAV = {
    site: FI('notahotel.ico'),        // the WordPress site icon (= the site's favicon) shows on the front and in wp-admin
    wp: FI('notahotel.ico'),
    dev: FI('default.png'),
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
      if (t.onShow) t.onShow();
    },
    showUrl(url) {
      const m = String(url).match(/^(https?:\/\/)?([^/]+)(.*)$/);
      const secure = /^https/.test(url);
      $('#brLock').innerHTML = secure ? window.Win11.SVG.tune : icon('info');
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
    async typeUrl(text, o = {}) {
      await clickUi('#brOmni', { kind: 'text' });
      $('#brOmni').classList.add('focus');
      $('#brUrl').innerHTML = `<span class="selbg" style="background:#c6dafc">${esc($('#brUrl').textContent)}</span>`;
      await wait(200);
      await typeInto(fieldTarget($('#brUrl')), [{ direct: text }], { kps: 14, keepStrip: true });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(800);
      $('#brOmni').classList.remove('focus');
      await wait(o.after != null ? o.after : 100);
    },
    async newTab(id) {
      await clickUi('#brNewTab', { kind: 'arrow', after: 80 });
      this.addTab({ id, title: '新しいタブ', url: '', page: 'blank', fav: 'blank' }, { anim: true });
      await wait(250);
    },
    async reload(o = {}) {
      if (o.key) await Keycap.show([o.key], 600);
      else await clickUi('#brReload', { after: 60 });
      const id = this.active;
      this.loading(id, true);
      await wait(o.ms || 450);
      this.loading(id, false);
    },
  };

  /* ---------------------------------------------------------- site frames (dev / live) */
  const SiteView = {
    async load(iframe, o = {}) { return window.SiteFrame.load(iframe, 'live', o); },
    async scroll(iframe, y, ms = 1200, easing = Ease.inOut) {
      const w = iframe.contentWindow;
      const s = w.scrollY;
      await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), easing);
    },
    yOf(iframe, el, offset = 0) { return el.getBoundingClientRect().top + iframe.contentWindow.scrollY - offset; },
  };

  /* ---------------------------------------------------------------- device mode */
  const Device = {
    on: false,
    async set(on, o = {}) {
      this.on = on;
      const page = $('.br-page[data-page="site"]');
      page.classList.toggle('device', on);
      const fr = $('#devFrame');
      if (on) {
        fr.style.width = (o.w || 375) + 'px';
        fr.style.height = (o.h || 812) + 'px';
      } else { fr.style.width = ''; fr.style.height = ''; }
      this.fit();
      await D.realWait(200);
    },
    /** the device screen is scaled to fit the page area (like Chrome's "fit to window" zoom) */
    fit() {
      const dev = $('#brDevice');
      const fr = $('#devFrame');
      if (!this.on) { dev.style.removeProperty('--dz'); return; }
      const area = dev.getBoundingClientRect();
      const z = Math.min(1, (area.height - 24) / (parseFloat(fr.style.height) || 812));
      dev.style.setProperty('--dz', z.toFixed(3));
      const zl = $('#brDevbar span:nth-child(5)');
      if (zl) zl.innerHTML = `${Math.round(z * 100)}% ${icon('chevron-down')}`;
    },
  };

  /* -------------------------------------------------------------------- DevTools */
  const DevTools = {
    lines: [],
    async open(on) { $('#devtools').classList.toggle('show', on); await D.realWait(320); Device.fit(); },
    clear() { this.lines = []; this.render(); },
    log(kind, text, src) { this.lines.push({ kind, text, src }); this.render(); },
    render() {
      const errs = this.lines.filter((l) => l.kind === 'err').length, warns = this.lines.filter((l) => l.kind === 'warn').length;
      $('#dtErrs').innerHTML = (errs ? `<span class="e">${icon('x-circle')} ${errs}</span>` : '') + (warns ? `<span class="w">${icon('alert')} ${warns}</span>` : '');
      $('#dtCon').innerHTML = this.lines.map((l) => `<div class="dt-l ${l.kind}">${l.kind === 'err' ? icon('x-circle') : l.kind === 'warn' ? icon('alert') : '<span class="dt-i"></span>'}<span class="tx">${l.text}</span>${l.src ? `<span class="src">${esc(l.src)}</span>` : ''}</div>`).join('') +
        '<div class="dt-l prompt"><span class="dt-i">›</span><span class="caret"></span></div>';
      const c = $('#dtCon'); c.scrollTop = c.scrollHeight;
    },
  };

  window.Apps = { Design, Layers, Props, Vars, Plugin, Code, Term, Browser, SiteView, Device, DevTools, rgbToHex, varOfColor, LH };
})();
