/*
 * The on-screen apps: Chrome-like browser, the makeshop byGMO login page (the real one: js/makeshop-login.js) and the shop
 * admin after it (a reconstruction — it needs an account — with the admin's own logo, icons, labels, route paths and
 * colours from its public JavaScript: js/makeshop-ui.js), the base-template picker,
 * the creator-mode code editor (pages / modules / save checks), the old basic-mode design editor (migration source),
 * the preview tab with DevTools (console + device mode) and the live shop.
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$, esc, icon, clamp, wait, kw, tween, Ease, Cursor, UI, Clock, screenRect, clickUi, hoverUi, moveToEl, Keycap, KeyStrip, typeInto, fieldTarget } = D;
  const S = window.SITE_SNAPSHOT;
  const Tpl = window.Tpl;
  const PC_W = 1920; // the width the PC page was captured at (laid out exactly as captured, scaled to the window)

  /* ===================================================================== BROWSER */
  // tab icons: the shop's own favicon; the shop admin (console.makeshop.jp) shows makeshop's (npm run favicons)
  const FAV = {
    ms: '<img class="br-fav img" src="../../shared/favicons/makeshop.ico" alt="">',
    old: '<img class="br-fav img" src="../../shared/favicons/makeshop.ico" alt="">',
    shop: '<img class="br-fav img" src="../../shared/favicons/tabisuruwagashi.png" alt="">',
    blank: '<span class="br-fav" style="background:transparent"></span>',
  };
  const Browser = {
    tabs: [], active: null,
    tabEl(id) { return $(`.br-tab[data-tab="${id}"]`); },
    addTab(t, o = {}) {
      const tab = { fav: 'ms', ...t };
      this.tabs.push(tab);
      const el = document.createElement('div');
      el.className = 'br-tab' + (o.anim && !Clock.ff ? ' new' : '');
      el.dataset.tab = tab.id;
      el.innerHTML = `<span class="fav">${FAV[tab.fav] || FAV.ms}</span><span class="tt"></span><span class="x">${icon('close')}</span>`;
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
      if (t.page === 'preview') Preview.fit();
      if (t.page === 'live') Live.fit();
    },
    showUrl(url) {
      const m = String(url).match(/^(https?:\/\/)?([^/]+)(.*)$/);
      $('#brLock').innerHTML = /^https/.test(url) ? window.Win11.SVG.tune : icon('info'); // Chrome's site-info (tune) icon
      $('#brUrl').innerHTML = m ? `${esc(m[2])}<span class="dim">${esc(m[3])}</span>` : esc(url);
    },
    setTitle(id, title) { const t = this.tab(id); t.title = title; $('.tt', this.tabEl(id)).textContent = title; },
    setUrl(id, url) { this.tab(id).url = url; if (this.active === id) this.showUrl(url); },
    setPage(id, page) { this.tab(id).page = page; if (this.active === id) this.activate(id); },
    setFav(id, fav) { this.tab(id).fav = fav; $('.fav', this.tabEl(id)).innerHTML = FAV[fav]; },
    loading(id, on) {
      const f = $('.fav', this.tabEl(id));
      f.innerHTML = on ? '<span class="br-fav spin"></span>' : (FAV[this.tab(id).fav] || FAV.ms);
    },
    async clickTab(id, o = {}) { await clickUi(this.tabEl(id), { kind: 'arrow', after: 60, ...o }); this.activate(id); await wait(160); },
    async reload(id, fn) {
      await clickUi('#brReload', { after: 40 });
      this.loading(id, true);
      await fn();
      await wait(250);
      this.loading(id, false);
    },
    async typeUrl(text, o = {}) {
      await clickUi('#brOmni', { kind: 'text' });
      $('#brOmni').classList.add('focus');
      $('#brUrl').innerHTML = `<span style="background:#c6dafc">${esc($('#brUrl').textContent)}</span>`;
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
  };

  /* ====================================================================== ADMIN */
  const TEMPLATES = [
    { name: 'Complete', hero: 'linear-gradient(135deg,#5b4636,#c29a62 60%,#2b2b2b)', tiles: ['#8fb3d9', '#c44', '#ddd', '#7a9a6a'] },
    { name: 'Garden', hero: 'linear-gradient(160deg,#173d22,#3f7a3f 55%,#0e2614)', tiles: ['#2f5d34', '#b8c9a8', '#e7e2d3', '#3d6b42'] },
    { name: 'Simplecase', hero: 'linear-gradient(180deg,#5c4a3a,#b7987a)', tiles: ['#20374f', '#8aa1b8', '#f1e7d6', '#333'] },
    { name: 'Basics', hero: 'linear-gradient(180deg,#efe9df,#d8cbb6 70%,#b49b7a)', tiles: ['#e8e0d4', '#cbb89f', '#a9927a', '#efe9df'] },
    { name: 'Manabito', hero: 'linear-gradient(135deg,#6b3b22,#d0894a 50%,#3b2a1c)', tiles: ['#c9783d', '#efe2cf', '#7b4b2b', '#d9b48c'] },
    { name: '&more', hero: 'linear-gradient(135deg,#1e3a4f,#b07b4f 55%,#e9e2d8)', tiles: ['#9fb6c6', '#d7c2a6', '#3b4b5c', '#e6d9c8'] },
  ];
  function wireframe(t) {
    return `<div class="wf"><div class="bar"><i></i><u></u></div><div class="hero" style="background:${t.hero}"></div>` +
      `<div class="txt"></div><div class="row">${t.tiles.map((c) => `<span style="background:${c}"></span>`).join('')}</div></div>`;
  }
  /** the wall-clock time at this point of the video (taskbar clock, "last updated" stamps) */
  const now = () => window.Win11.fmt.stamp();

  /* the admin's frame (js/makeshop-login-frame.js: MsUi.shell — left menu, header, right side bar as the admin draws
     them since 2026-07-27); the views of index.html go into its page area. ショップデザイン is folded until the video opens it. */
  const MS_FRAME = {
    shopName: '旅するように和菓子と出逢う', shopId: 'gaxwagashi', avatar: 'purple', homeId: 'msNavHome',
    groups: { design: [['navTemplate', 'テンプレート選択・編集'], ['', 'お知らせの管理']] },
    closed: { design: true }, groupIds: { design: 'navDesign' }, subIds: { design: 'navDesignSub' },
  };
  (() => {
    const sh = $('#msShell');
    const views = [...sh.querySelectorAll('.ms-view')];
    sh.classList.add('ms-adm');
    sh.innerHTML = window.MsUi.shell(MS_FRAME);
    views.forEach((v) => $('#msMain').appendChild(v));
  })();

  const Admin = {
    mode: 'basic',
    sets: [],
    view(name, crumb) {
      $$('#msShell .ms-view').forEach((v) => v.classList.toggle('on', v.dataset.view === name));
      if (crumb) $('#msCrumb').innerHTML = window.MsUi.crumbs(crumb);
      $$('.ms-item, .ms-subitem').forEach((e) => e.classList.remove('on'));
      if (name === 'home') $('.ms-item[data-nav="home"]').classList.add('on');
      if (name === 'dslist') $('#navTemplate').classList.add('on');
    },
    openDesign(on = true) { $('#navDesign').classList.toggle('open', on); $('#navDesignSub').classList.toggle('open', on); },
    setMode(m) {
      this.mode = m;
      const txt = m === 'creator' ? 'クリエイターモード適用中' : 'ベーシックモード適用中';
      $$('.cm-strip').forEach((s) => s.classList.toggle('creator', m === 'creator'));
      $$('.cm-mode').forEach((s) => { s.textContent = txt; });
      $('#homeMode').textContent = m === 'creator' ? 'クリエイターモード' : 'ベーシックモード';
    },
    renderSets(o = {}) {
      const g = $('#dsGrid');
      g.innerHTML = this.sets.map((s, i) => `
        <div class="ds-card${s.applied ? ' applied' : ''}${o.newIdx === i && !Clock.ff ? ' new' : ''}" data-set="${i}">
          <div class="ds-thumb">${s.thumb}<div class="ds-hover"><span class="ds-hbtn" data-act="code">コードを編集</span><span class="ds-hbtn sub" data-act="preview">プレビュー</span></div></div>
          <div class="ds-name">${esc(s.name)}${icon('pencil')}</div>
          ${s.applied ? '<div class="ds-state"><span>適用中</span></div>' : '<span class="ds-apply" data-act="apply">ショップに適用</span>'}
          <div class="ds-meta">最終更新日：${esc(s.updated)}<span class="ic">${icon('copy')}${icon('download')}</span></div>
        </div>`).join('') + '<div class="ds-plus" id="dsPlus">' + icon('plus') + '</div>';
    },
    card(i) { return $(`.ds-card[data-set="${i}"]`); },
    async hoverCard(i, hold = 300) {
      const c = this.card(i);
      await hoverUi($('.ds-thumb', c));
      c.classList.add('hov');
      await wait(hold);
    },
    unhoverCards() { $$('.ds-card').forEach((c) => c.classList.remove('hov')); },
    async clickCardBtn(i, act) {
      const c = this.card(i);
      c.classList.add('hov');
      await clickUi($(`[data-act="${act}"]`, c), { after: 120 });
    },
  };

  const Picker = {
    render() {
      $('#pkGrid').innerHTML = TEMPLATES.map((t) => `
        <div class="pk-card" data-tpl="${esc(t.name)}">
          <div class="pk-card-h">${esc(t.name)}<span class="pk-badge">レスポンシブ</span></div>
          <div class="pk-thumb">${wireframe(t)}<div class="pk-hover"><span class="pk-make">これでデザインセットを作る</span><span class="pk-sample">サンプルショップを見る</span></div></div>
        </div>`).join('');
    },
    show(on = true) { $('#msPick').classList.toggle('show', on); },
    card(name) { return $(`.pk-card[data-tpl="${CSS.escape(name)}"]`); },
    async hover(name, hold = 500) {
      $$('.pk-card').forEach((c) => c.classList.remove('hov'));
      const c = this.card(name);
      await hoverUi($('.pk-thumb', c), { ay: 0.35 });
      c.classList.add('hov');
      await wait(hold);
    },
    async make(name) {
      const c = this.card(name);
      await clickUi($('.pk-make', c), { after: 160 });
      c.classList.remove('hov');
    },
    thumb(name) { return wireframe(TEMPLATES.find((t) => t.name === name)); },
  };

  /** a single-line input (modal / module form): click, type (IME or direct) */
  async function typeInput(el, script, o = {}) {
    await clickUi(el, { kind: 'text', after: 80 });
    el.classList.add('focus');
    const v = $('.v', el);
    const text = await typeInto(fieldTarget(v), script, { kps: o.kps || 12, ...o });
    v.textContent = text;
    el.classList.remove('focus');
    return text;
  }

  /* ========================================================= CREATOR-MODE EDITOR */
  const PAGES = ['全ページ共通', 'トップ', '商品カテゴリー', '商品検索結果', '商品詳細', '商品レビュー一覧', '商品レビュー投稿', '買い物カゴ',
    'お知らせ一覧', 'お知らせ詳細', 'まとめ買い割引', '利用案内', '会社概要', '特定商取引法', 'プライバシーポリシー', '会員制/年齢確認', 'カタログ'];
  /** the admin's own routes (console.makeshop.jp): the creator-mode editor of design set DS_ID */
  const DS_ID = 1;
  const CREATOR = `/shop-design/ms-design-creator/${DS_ID}`;
  /** keep the admin tab's title ("<page> - makeshop byGMO", the admin's own format) / address in step with the editor view */
  function adminAt(title, path) { if (Browser.tab('adm')) { Browser.setTitle('adm', window.MsUi.title(title)); Browser.setUrl('adm', 'https://console.makeshop.jp' + path); } }
  const Cm = {
    page: null, view: null, ed: {},
    data: {},     // saved source per page: { html, css, js }
    modules: [],  // { id, name, html }
    modEditing: null,
    init() {
      this.ed.html = new window.CodeView('#edHtml', { lang: 'html' });
      this.ed.css = new window.CodeView('#edCss', { lang: 'css' });
      this.ed.js = new window.CodeView('#edJs', { lang: 'js' });
      this.ed.mod = new window.CodeView('#edMod', { lang: 'html' });
      this.ed.basic = new window.CodeView('#edBasic', { lang: 'html' });
      $('#cmPages').innerHTML = PAGES.map((p) => `<div class="cm-pg" data-pg="${esc(p)}">${esc(p)}</div>`).join('');
      PAGES.forEach((p) => { this.data[p] = { html: p === '全ページ共通' ? '' : Tpl.DEFAULT.top, css: p === '全ページ共通' ? Tpl.DEFAULT.css : '', js: '' }; });
      this.renderModules();
    },
    show(on = true, setName) { $('#cm').classList.toggle('show', on); if (setName) $('#cmSetName').textContent = setName; },
    pgEl(p) { return $(`.cm-pg[data-pg="${CSS.escape(p)}"]`); },
    setView(v) {
      this.view = v;
      $$('#cmMain .cm-view').forEach((e) => e.classList.toggle('on', e.dataset.cv === v));
      $('#cmModules').classList.toggle('on', v === 'modules' || v === 'module');
      if (v !== 'page') $$('.cm-pg').forEach((e) => e.classList.remove('on'));
      $('#modDel').classList.toggle('show', v === 'module' && this.modEditing && this.modEditing.saved);
      $('#cmSave').style.display = v === 'modules' ? 'none' : '';
      $('#cmMain').scrollTop = 0;
      if (v === 'modules' || v === 'module') adminAt('モジュール一覧', CREATOR + '/modules');
    },
    showPage(p) {
      this.page = p;
      this.setView('page');
      $$('.cm-pg').forEach((e) => e.classList.toggle('on', e.dataset.pg === p));
      $('#cmPageTitle').textContent = p;
      $('#cmCrumbPage').textContent = p;
      adminAt('ページの編集', CREATOR + '/pages');
      $('#secHtml').classList.toggle('hide', p === '全ページ共通');
      $('#cmPreview').style.visibility = p === '全ページ共通' ? 'hidden' : '';
      const d = this.data[p];
      this.ed.html.setText(d.html); this.ed.css.setText(d.css); this.ed.js.setText(d.js);
      Object.values(this.ed).forEach((e) => e.focus(false));
      this.alert(null);
    },
    async clickPage(p) { await clickUi(this.pgEl(p), { after: 80 }); this.showPage(p); await wait(300); },
    /** scroll the editor column so a section is in view */
    async scrollTo(target, ms = 650) {
      const main = $('#cmMain');
      let y = 0;
      if (typeof target === 'number') y = target;
      else { const el = typeof target === 'string' ? $(target) : target; y = el.offsetTop - 14; }
      y = clamp(y, 0, main.scrollHeight - main.clientHeight);
      const s = main.scrollTop;
      await tween(ms, (e) => { main.scrollTop = s + (y - s) * e; }, Ease.inOut);
    },
    alert(html, el = '#cmAlert') {
      const a = $(el);
      if (!html) { a.classList.remove('show'); a.innerHTML = ''; return; }
      a.innerHTML = html; a.classList.add('show');
    },
    toast(text) {
      const t = $('#cmToast');
      $('span', t).textContent = text;
      t.classList.add('show');
      wait(1900).then(() => t.classList.remove('show'));
    },
    /** creator-mode tag check run on save (what makes the save fail) */
    check(text) {
      const re = /<\{\s*(\/?)(section|if|foreach)\b/g;
      const stack = [];
      let m;
      while ((m = re.exec(text))) {
        const line = text.slice(0, m.index).split('\n').length;
        if (!m[1]) stack.push({ tag: m[2], line });
        else if (stack.length && stack[stack.length - 1].tag === m[2]) stack.pop();
        else return { tag: m[2], line, kind: 'close' };
      }
      if (stack.length) return { ...stack[stack.length - 1], kind: 'open' };
      const mod = text.match(/<\{\$module\.(\w+)\}>/g) || [];
      for (const t of mod) { const id = t.match(/module\.(\w+)/)[1]; if (!this.modules.some((x) => x.id === id && x.saved)) return { kind: 'module', id, line: text.slice(0, text.indexOf(t)).split('\n').length }; }
      return null;
    },
    async clickSave() {
      await clickUi('#cmSave', { after: 60 });
      $('#cmSave').classList.add('busy');
      await wait(520);
      $('#cmSave').classList.remove('busy');
    },
    /** save the current page: returns the error (and shows it) or null */
    async save(o = {}) {
      await this.clickSave();
      const p = this.page;
      const html = this.ed.html.text();
      const err = p === '全ページ共通' ? null : this.check(html);
      if (err) {
        const msg = err.kind === 'module'
          ? `<b>保存できませんでした</b>HTML ${err.line}行目：モジュール <code>$module.${esc(err.id)}</code> は登録されていません。`
          : err.kind === 'open'
            ? `<b>保存できませんでした（テンプレートの構文エラー）</b>HTML ${err.line}行目：<code>&lt;{${esc(err.tag)}}&gt;</code> に対応する終了タグ <code>&lt;{/${esc(err.tag)}}&gt;</code> がありません。`
            : `<b>保存できませんでした（テンプレートの構文エラー）</b>HTML ${err.line}行目：開始タグのない <code>&lt;{/${esc(err.tag)}}&gt;</code> があります。`;
        this.alert(msg);
        this.ed.html.markLine(err.line - 1, 'err');
        return err;
      }
      this.alert(null);
      Object.keys(this.ed.html.marks).forEach((k) => this.ed.html.markLine(+k, null));
      this.data[p] = { html: p === '全ページ共通' ? '' : html, css: this.ed.css.text(), js: this.ed.js.text() };
      this.toast(o.toast || '保存しました');
      if (Admin.current) Admin.current.updated = now();
      await wait(400);
      return null;
    },
    /* ---- modules */
    renderModules(o = {}) {
      const rows = this.modules.filter((m) => m.saved);
      $('#modRows').innerHTML = rows.length ? rows.map((m, i) =>
        `<tr class="${o.newId === m.id && !Clock.ff ? 'new' : ''}" data-mod="${esc(m.id)}"><td><a>${esc(m.name)}</a></td><td><code>&lt;{$module.${esc(m.id)}}&gt;</code></td><td class="del">削除</td></tr>`).join('')
        : '<tr class="empty"><td colspan="3">モジュールは登録されていません</td></tr>';
    },
    async openModules() { await clickUi('#cmModules', { after: 80 }); this.setView('modules'); await wait(300); },
    newModule() {
      this.modEditing = { id: '', name: '', html: '', saved: false };
      $('#modTitle').textContent = 'モジュール追加'; $('#modCrumb').textContent = 'モジュール追加';
      $('#modId .v').textContent = ''; $('#modName .v').textContent = '';
      $('#modTag').textContent = '<{$module.}>';
      this.ed.mod.setText('');
      this.alert(null, '#modAlert');
      this.setView('module');
    },
    editModule(id) {
      const m = this.modules.find((x) => x.id === id);
      this.modEditing = m;
      $('#modTitle').textContent = 'モジュール編集'; $('#modCrumb').textContent = m.name;
      $('#modId .v').textContent = m.id; $('#modName .v').textContent = m.name;
      $('#modTag').textContent = `<{$module.${m.id}}>`;
      this.ed.mod.setText(m.html);
      this.alert(null, '#modAlert');
      this.setView('module');
    },
    async typeModId(id) {
      const el = $('#modId');
      await clickUi(el, { kind: 'text', after: 80 });
      el.classList.add('focus');
      const v = $('.v', el);
      const t = {
        render(text, comp) { v.innerHTML = esc(text) + comp + '<span class="caret"></span>'; $('#modTag').textContent = `<{$module.${text}}>`; },
        anchor() { return screenRect($('.caret', v) || v); },
      };
      const text = await typeInto(t, [{ direct: id }], { kps: 11 });
      v.textContent = text;
      el.classList.remove('focus');
      this.modEditing.id = id;
    },
    async typeModName(script) { const n = await typeInput($('#modName'), script); this.modEditing.name = n; return n; },
    async saveModule() {
      await this.clickSave();
      const m = this.modEditing;
      m.html = this.ed.mod.text();
      const isNew = !m.saved;
      m.saved = true;
      if (!this.modules.includes(m)) this.modules.push(m);
      this.toast('モジュールを保存しました');
      $('#modTitle').textContent = 'モジュール編集'; $('#modCrumb').textContent = m.name;
      $('#modDel').classList.add('show');
      this.renderModules({ newId: isNew ? m.id : null });
      await wait(500);
    },
  };

  /* ================================================== OLD (BASIC-MODE) DESIGN EDITOR */
  const Basic = {
    src: { header: ['共通ヘッダー', 'html'], footer: ['共通フッター', 'html'], top: ['トップページ', 'html'], css: ['CSS', 'css'], js: ['トップページ JavaScript', 'js'] },
    text(k) { return { header: Tpl.BASIC.header, footer: Tpl.BASIC.footer, top: Tpl.BASIC.top, css: Tpl.BASIC.css, js: Tpl.BASIC.js }[k]; },
    show(k) {
      $$('.bm-it').forEach((e) => e.classList.toggle('on', e.dataset.bm === k));
      $('#bmTitle').textContent = this.src[k][0];
      const ed = Cm.ed.basic;
      ed.lang = this.src[k][1];
      ed.setText(this.text(k));
      ed.focus(false);
      this.cur = k;
    },
    async open(k) { await clickUi($(`.bm-it[data-bm="${k}"]`), { after: 60 }); this.show(k); await wait(260); },
    /** click into the source, Ctrl+A, Ctrl+C */
    async copyAll(o = {}) {
      const ed = Cm.ed.basic;
      await ed.clickAt(Math.min(3, ed.lines.length - 1), 0, { noScroll: true });
      await Keycap.show(['Ctrl', 'A'], 600);
      ed.selectAll(); ed.render();
      await wait(320);
      await Keycap.show(['Ctrl', 'C'], 650);
      await wait(o.after != null ? o.after : 260);
      return ed.text();
    },
  };

  /* ===================================================================== PREVIEW */
  function fitPc(fitEl, box) {
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return 1;
    const s = W / PC_W;
    fitEl.style.width = PC_W + 'px';
    fitEl.style.height = Math.ceil(H / s) + 'px';
    fitEl.style.transform = `scale(${s})`;
    return s;
  }
  const jsLine = (needle) => { const i = (S.userJs || '').split('\n').findIndex((l) => l.includes(needle)); return i >= 0 ? i + 1 : 1; };
  const JS_FILE = (S.userJsSrc || '/view/asset/user.js').split('/').pop();
  const Preview = {
    doc: null, spDoc: null, states: [],
    fit() { fitPc($('#pvFit'), $('#pvStage')); this.fitDevice(); },
    fitDevice() {
      const st = $('#pvStage');
      const h = st.clientHeight - 34 - 24;
      if (h <= 0) return;
      const s = Math.min(1, h / 740);
      const scr = $('#dvScreen');
      scr.style.width = Math.round(360 * s) + 'px';
      scr.style.height = Math.round(740 * s) + 'px';
      $('#pvSpFrame').style.transform = `scale(${s})`;
    },
    bar(text) { $('#pvBarText').textContent = text; },
    async load(states = []) {
      this.states = states.slice();
      this.fit();
      this.doc = await window.SiteFrame.load($('#pvFrame'), 'pc', { states });
      return this.doc;
    },
    async loadSp(states = []) {
      this.fitDevice();
      this.spDoc = await window.SiteFrame.load($('#pvSpFrame'), 'sp', { states });
      return this.spDoc;
    },
    win() { return $('#pvFrame').contentWindow; },
    spWin() { return $('#pvSpFrame').contentWindow; },
    async scroll(y, ms = 1200, sp = false) {
      const w = sp ? this.spWin() : this.win();
      const s = w.scrollY;
      await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), Ease.inOut);
    },
    yOf(el, offset = 0, sp = false) { return el.getBoundingClientRect().top + (sp ? this.spWin() : this.win()).scrollY - offset; },
    async devtools(on) { $('#dt').classList.toggle('show', on); await D.realWait(340); this.fit(); },
    device(on) {
      $('#pvStage').classList.toggle('device', on);
      $('#dtDevice').classList.toggle('on', on);
      $('#dt').classList.toggle('compact', on);
      this.fit();
    },
    /* ---- console */
    con: [],
    clearConsole() { this.con = []; $('#dtCon').innerHTML = ''; this.count(); },
    log(kind, html, src) {
      this.con.push(kind);
      const el = document.createElement('div');
      el.className = 'dt-msg ' + kind;
      el.innerHTML = `<span class="ic"></span><span class="tx">${html}</span>${src ? `<span class="src">${esc(src)}</span>` : ''}`;
      $('#dtCon').appendChild(el);
      this.count();
    },
    count() {
      const n = this.con.filter((k) => k === 'err').length;
      const c = $('#dtCount');
      c.innerHTML = n ? `${icon('x-circle')} ${n}` : '';
      c.classList.toggle('show', n > 0);
    },
    /** what the console shows when the WordPress API URL is wrong (fetch 404 -> HTML -> JSON parse error) */
    wpErrors(baseUrl) {
      const fl = jsLine('fetch(url)'), el = jsLine("console.error('Error:'");
      const eps = ['wp-json/wp/v2/top_display', 'wp-json/wp/v2/news?per_page=3&orderby=date&order=desc', 'wp-json/wp/v2/journal?per_page=10&orderby=date&order=desc'];
      eps.forEach((p) => this.log('err', `<b>GET</b> ${esc(baseUrl + p)} <b>404 (Not Found)</b>`, `${JS_FILE}:${fl}`));
      eps.forEach(() => this.log('err', `Error: SyntaxError: Unexpected token '&lt;', "&lt;!DOCTYPE "... is not valid JSON`, `${JS_FILE}:${el}`));
    },
  };

  const Live = {
    doc: null,
    fit() { fitPc($('#liveFit'), $$('.br-page[data-page="live"]')[0]); },
    async load() { this.fit(); this.doc = await window.SiteFrame.load($('#liveFrame'), 'pc', {}); return this.doc; },
    win() { return $('#liveFrame').contentWindow; },
    async scroll(y, ms = 1400, easing = Ease.inOut) {
      const w = this.win();
      const s = w.scrollY;
      await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), easing);
    },
    yOf(el, offset = 0) { return el.getBoundingClientRect().top + this.win().scrollY - offset; },
  };

  window.addEventListener('resize', () => { Preview.fit(); Live.fit(); });

  window.Apps = { Browser, Admin, Picker, Cm, Basic, Preview, Live, typeInput, now, PAGES, TEMPLATES };
})();
