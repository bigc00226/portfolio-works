/*
 * The Wix editor (editor.wix.com): it needs a login, so the editor is rebuilt here; the logo and the favicon are Wix's
 * own (npm run favicons: logos/wix.svg, favicons/wix.ico). Its canvas shows the real pages of the site being built,
 * captured from the published site (videos/<id>/js/site-snapshot.js, loaded by shared/kit/store-frame.js) — the
 * scenario hides what is "not built yet" with store-frame states and reveals it as it is added.
 *
 * Wix.mount()                  the editor as a page of the browser window (Browser page "wix")
 * Wix.load(page, o) / loadSp   a captured page on the desktop canvas / on the mobile canvas
 * Wix.select(el, label, o)     the editor's selection frame (+ its floating toolbar) over a canvas element
 * Wix.panel(title, html, o)    a floating panel (add, pages & menu, media, settings) · Wix.modal · Wix.toast
 * Wix.device('mobile')         the mobile editor (the page at 390 px, as the published site shows it on a phone)
 * Wix.page(name)               the page selector of the top bar
 */
(function () {
  'use strict';
  const D = window.Demo, V = window.VIDEO || {}, W = V.wix || {};
  const { $, $$, esc, wait, tween, Ease, screenRect, frameFns, clickUi } = D;

  const SV = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    section: '<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/>',
    pages: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    design: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.3"/><circle cx="12" cy="7.5" r="1.3"/><circle cx="15.5" cy="10" r="1.3"/><path d="M12 21a3 3 0 0 1 0-6h1.5a2 2 0 0 0 0-4"/>',
    apps: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M17 14v6M14 17h6"/>',
    business: '<path d="M3 7h18v13H3zM8 7V4h8v3M3 12h18"/>',
    media: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    cms: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    desktop: '<rect x="2.5" y="4" width="19" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
    mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.2 14H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.2V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    stretch: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    home: '<path d="M3 11l9-8 9 8M5 9v12h14V9"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    sub: '<path d="M6 4v8a3 3 0 0 0 3 3h11M16 11l4 4-4 4"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    form: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h5"/>',
  };
  const sv = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${SV[n] || ''}</svg>`;

  const TOOLS = [['add', 'plus', '追加'], ['section', 'section', 'セクションを追加'], ['pages', 'pages', 'ページとメニュー'], ['design', 'design', 'サイトのデザイン'], ['apps', 'apps', 'アプリを追加'], ['business', 'business', 'ビジネスツール'], ['media', 'media', 'メディア'], ['cms', 'cms', 'CMS']];
  const html = `
    <div class="wx" id="wx">
      <header class="wx-top">
        <span class="wx-logo"><img src="../../shared/logos/wix.svg" alt="Wix"></span>
        <nav class="wx-menu"><span>サイト</span><span>設定</span><span>開発モード</span><span>ヘルプ</span><span class="upg">アップグレード</span></nav>
        <div class="wx-pagesel" id="wxPageSel"><span class="l">ページ:</span><b id="wxPageName">ホーム</b>${sv('chev')}</div>
        <div class="wx-dev"><span class="on" id="wxDesk">${sv('desktop')}</span><span id="wxMob">${sv('mobile')}</span></div>
        <span class="sp"></span>
        <span class="wx-ic" id="wxUndo">${sv('undo', 18)}</span><span class="wx-ic off">${sv('redo', 18)}</span>
        <span class="wx-zoom">100%</span>
        <span class="wx-back" id="wxBack">エディタに戻る</span><span class="wx-txt" id="wxSave">保存</span><span class="wx-txt" id="wxPreview">プレビュー</span><span class="wx-pub" id="wxPublish">公開</span>
      </header>
      <div class="wx-body">
        <nav class="wx-left" id="wxLeft">${TOOLS.map(([k, ic, tip]) => `<span class="wx-tool${k === 'add' ? ' add' : ''}" data-tool="${k}">${sv(ic, 22)}<span class="tip">${tip}</span></span>`).join('')}</nav>
        <div class="wx-stage" id="wxStage">
          <div class="wx-canvas" id="wxCanvas"><div class="wx-fit" id="wxFit"><iframe id="wxFrame" title="Wix エディタのキャンバス" tabindex="-1"></iframe></div></div>
          <div class="wx-mob" id="wxMobBox"><span class="wx-mob-lbl">モバイル（390 px）</span><div class="wx-mob-scr"><iframe id="wxSpFrame" title="Wix エディタのキャンバス（モバイル）" tabindex="-1"></iframe></div></div>
          <div class="wx-hov" id="wxHov"></div>
          <div class="wx-sel" id="wxSel"><span class="lbl"></span><i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i></div>
          <div class="wx-bar" id="wxBar"></div>
          <div class="wx-addsec" id="wxAddSec">${sv('plus')}セクションを追加</div>
          <div class="wx-blank" id="wxBlank" hidden><div>このページはまだ空です<b>左の「＋」からセクションや要素を追加</b></div></div>
        </div>
        <div class="wx-panel" id="wxPanel"><div class="wx-ph"><b id="wxPanelTitle"></b><span class="c">${sv('help', 18)}</span><span class="c" id="wxPanelX">${sv('close', 18)}</span></div><div class="wx-pb" id="wxPanelBody"></div><div class="wx-pf" id="wxPanelFoot" hidden></div></div>
        <div class="wx-ctx" id="wxCtx"></div>
        <div class="wx-modal" id="wxModal"></div>
        <div class="wx-toast" id="wxToast"></div>
      </div>
    </div>`;

  // Wix pages put overflow: scroll on <body>; the browser applies it to the viewport (the page scrolls as a whole), so
  // the canvas is unchanged with body's overflow visible — and tools measuring boxes see the body as tall as the page
  const FRAME_CSS = `
    body { overflow: visible !important; }
    .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 2px; text-underline-offset: .18em; text-decoration-skip-ink: none; }
    .demo-ime.conv { text-decoration-style: solid; }
    .demo-ime.conv.active { text-decoration-thickness: 3px; background: rgba(17,109,255,.18); }
    .demo-caret { display: inline-block; width: 2px; height: 1em; background: currentColor; margin: 0 0 0 1px; vertical-align: -0.12em; animation: demoBlink 1s steps(1) infinite; }
    @keyframes demoBlink { 50% { opacity: 0; } }
    [data-wx-reveal] { animation: wxReveal .7s cubic-bezier(.2,.75,.25,1) both; }
    @keyframes wxReveal { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  `;
  const addCss = (doc) => { const s = doc.createElement('style'); s.id = 'wx-css'; s.textContent = FRAME_CSS; doc.head.appendChild(s); };

  const Wix = {
    doc: null, spDoc: null, mobile: false, sel: null, hov: null, scale: 1,
    SV, sv,
    url(o = {}) { return `https://editor.wix.com/html/editor/web/renderer/edit/${W.siteId || 'site'}?metaSiteId=${W.metaSiteId || W.siteId || 'site'}${o.mobile ? '&viewMode=mobile' : ''}`; },
    title() { return 'Wix エディタ'; },
    mount() {
      $('#brContent').insertAdjacentHTML('afterbegin', `<div class="br-page" data-page="wix">${html}</div>`);
      const FAV = window.Kit.Browser.FAV;
      FAV.wix = '<img class="br-fav img" src="../../shared/favicons/wix.ico" alt="">';
      frameFns.add(() => this.place());
      addEventListener('resize', () => this.fit());
    },
    /** the desktop canvas: the page at 1920 px, scaled to the stage width */
    fit() {
      const stage = $('#wxStage');
      if (!stage || !stage.clientWidth) return;
      const s = stage.clientWidth / 1920;
      this.scale = s;
      const f = $('#wxFit');
      f.style.width = '1920px';
      f.style.height = Math.ceil(stage.clientHeight / s) + 'px';
      f.style.transform = `scale(${s})`;
      $('.wx-zoom').textContent = Math.round(s * 100) + '%';
    },
    async load(page, o = {}) {
      this.fit();
      this.unselect();
      this.doc = await window.StoreFrame.load($('#wxFrame'), page, 'pc', { ...o, before: (d) => { addCss(d); if (o.before) o.before(d); } });
      this.pageKey = page;
      return this.doc;
    },
    async loadSp(page, o = {}) {
      this.spDoc = await window.StoreFrame.load($('#wxSpFrame'), page, 'sp', { ...o, before: (d) => { addCss(d); if (o.before) o.before(d); } });
      return this.spDoc;
    },
    cur() { return this.mobile ? this.spDoc : this.doc; },
    win() { return (this.mobile ? $('#wxSpFrame') : $('#wxFrame')).contentWindow; },
    q(sel) { return this.cur().querySelector(sel); },
    /** an element by its exact (trimmed) text, the first drawn one */
    text(t, sel = 'p, h1, h2, h3, span, a, div') { return [...this.cur().querySelectorAll(sel)].find((e) => e.textContent.replace(/\s+/g, '') === t.replace(/\s+/g, '') && e.getBoundingClientRect().width > 0) || null; },
    async scroll(y, ms = 1100) { const w = this.win(), s = w.scrollY; await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), Ease.inOut); },
    yOf(el, off = 0) { return el.getBoundingClientRect().top + this.win().scrollY - off; },
    async scrollToEl(el, off = 60, ms = 1100) { if (typeof el === 'string') el = this.q(el); if (el) await this.scroll(Math.max(0, this.yOf(el, off)), ms); return el; },
    state(key, on) { [this.doc, this.spDoc].forEach((d) => { if (d) window.StoreFrame.state(d, key, on, d === this.spDoc ? 'sp' : 'pc', this.pageKey); }); },
    /** shows parts that were hidden ("not built yet") with a short entrance */
    reveal(el) {
      if (typeof el === 'string') el = this.q(el);
      if (!el) return;
      el.removeAttribute('data-demo-hidden');
      el.setAttribute('data-wx-reveal', '');
    },
    blank(on) { $('#wxBlank').hidden = !on; },
    page(name) { $('#wxPageName').textContent = name; },
    device(kind) {
      this.mobile = kind === 'mobile';
      this.unselect();
      $('#wx').classList.toggle('mobile', this.mobile);
      $('#wxDesk').classList.toggle('on', !this.mobile);
      $('#wxMob').classList.toggle('on', this.mobile);
    },
    /** preview: the editor's bars go away, the page fills the window (the canvas is refitted) */
    preview(on) {
      this.unselect();
      $('#wx').classList.toggle('preview', on);
      this.fit();
    },
    tool(k) { $$('.wx-tool').forEach((t) => t.classList.toggle('on', t.dataset.tool === k)); },
    async clickTool(k, o = {}) {
      const t = $(`.wx-tool[data-tool="${k}"]`);
      await clickUi(t, { after: 60, ...o });
      this.tool(k);
    },
    /* -------- selection frames over the canvas */
    rel(el) {
      const a = screenRect(el), s = $('#wxStage').getBoundingClientRect();
      return { left: a.left - s.left, top: a.top - s.top, width: a.width, height: a.height };
    },
    place() {
      const put = (box, el) => {
        if (!el || !el.isConnected) { box.classList.remove('on'); return null; }
        const r = this.rel(el);
        box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
        return r;
      };
      const r = put($('#wxSel'), this.sel);
      put($('#wxHov'), this.hov);
      const bar = $('#wxBar');
      if (r && bar.classList.contains('on')) {
        const s = $('#wxStage');
        const below = r.top < 54;
        bar.style.left = Math.max(8, Math.min(r.left, s.clientWidth - bar.offsetWidth - 8)) + 'px';
        bar.style.top = (below ? Math.min(r.top + r.height + 10, s.clientHeight - 50) : r.top - 48) + 'px';
      }
      const add = $('#wxAddSec');
      if (r && add.classList.contains('on')) { add.style.left = r.left + r.width / 2 + 'px'; add.style.top = r.top + r.height + 'px'; }
    },
    hover(el) { this.hov = el; $('#wxHov').classList.toggle('on', !!el); this.place(); },
    select(el, label, o = {}) {
      this.sel = el;
      this.hov = null;
      $('#wxHov').classList.remove('on');
      const box = $('#wxSel');
      box.classList.toggle('on', !!el);
      box.classList.toggle('sec', !!o.sec);
      $('.lbl', box).textContent = label || '';
      $('.lbl', box).style.display = label ? '' : 'none';
      const bar = $('#wxBar');
      if (o.bar) { bar.innerHTML = o.bar; bar.classList.add('on'); } else bar.classList.remove('on');
      $('#wxAddSec').classList.toggle('on', !!o.addSec);
      this.place();
      box.classList.toggle('lbl-in', !!el && this.rel(el).top < 26);
    },
    unselect() { this.select(null); },
    /** the floating toolbar of a selected element: [{b:'テキストを編集'}, {c:'gear'}, …] */
    barHtml(items) { return items.map((x) => (x.b ? `<span class="b${x.plain ? ' plain' : ''}"${x.id ? ` id="${x.id}"` : ''}>${esc(x.b)}</span>` : `<span class="c"${x.id ? ` id="${x.id}"` : ''}>${sv(x.c, 18)}</span>`)).join(''); },
    /* -------- panels, menus, dialogs */
    panel(title, body, o = {}) {
      const p = $('#wxPanel');
      p.className = 'wx-panel on' + (o.wide ? ' wide' : '') + (o.right ? ' right' : '');
      $('#wxPanelTitle').textContent = title;
      $('#wxPanelBody').innerHTML = body;
      const f = $('#wxPanelFoot');
      f.hidden = !o.foot;
      f.innerHTML = o.foot || '';
      D.hydrateIcons(p);
      return p;
    },
    panelBody(body) { $('#wxPanelBody').innerHTML = body; },
    async closePanel(o = {}) {
      if (o.click !== false && $('#wxPanel').classList.contains('on')) await clickUi('#wxPanelX', { after: 60 });
      $('#wxPanel').classList.remove('on');
      this.tool(null);
    },
    ctx(items, at) {
      const c = $('#wxCtx');
      c.innerHTML = items.map((x) => (x === '-' ? '<div class="sep"></div>' : `<div${x.id ? ` id="${x.id}"` : ''}>${x.ic ? sv(x.ic, 15) : ''}${esc(x.t)}</div>`)).join('');
      const b = $('.wx-body').getBoundingClientRect(), r = at.getBoundingClientRect();
      c.style.left = r.right - b.left - 30 + 'px';
      c.style.top = r.top - b.top + r.height - 4 + 'px';
      c.classList.add('on');
    },
    ctxOff() { $('#wxCtx').classList.remove('on'); },
    modal(inner) { const m = $('#wxModal'); m.innerHTML = `<div class="wx-dlg">${inner}</div>`; m.classList.add('on'); },
    closeModal() { $('#wxModal').classList.remove('on'); },
    async toast(text, ms = 2200) {
      const t = $('#wxToast');
      t.innerHTML = sv('check') + esc(text);
      t.classList.add('on');
      wait(ms).then(() => t.classList.remove('on'));
    },
    saved(on) { const s = $('#wxSave'); s.textContent = on ? '保存済み' : '保存'; s.classList.toggle('saved', on); },
    async save() { await clickUi('#wxSave', { after: 60 }); this.saved(true); await this.toast('サイトを保存しました'); },
    /**
     * typing on the canvas: the element's own markup comes back once the text is typed (the page's real line breaks / spans)
     */
    textTarget(el) {
      const orig = el.innerHTML;
      return {
        target: D.frameTextTarget(el),
        // a state that emptied the element keeps its real markup in data-demo-text
        restore() { if (el.dataset.demoText != null) { el.innerHTML = el.dataset.demoText; delete el.dataset.demoText; } else el.innerHTML = orig; },
      };
    },
  };
  window.Wix = Wix;
})();
