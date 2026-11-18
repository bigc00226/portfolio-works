/*
 * Timeline: a new WordPress corporate site for クルーズ株式会社 (crooz.co.jp) —
 * dev environment (wp-env) + the original theme → design and the global menu → 会社概要 (page-overview.php; the
 * Japanese slug) → 事業・グループ会社紹介 (page-business.php) → お問い合わせ (Contact Form 7: the config validator) →
 * smartphone (the 会社概要 table) → the live site.
 * Every WordPress screen is the real wp-admin (js/wp-snapshot.js, tools/snapshots/wp-crooz/capture-wp.js); the site
 * itself is the live crooz.co.jp (js/site-snapshot.js), shown as the dev site at http://localhost:8888.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP;
  const { $, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, frameTextTarget, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const SF = window.StoreFrame;
  const P = F.files, T = F.T;
  const DEV = 'http://localhost:8888', LIVE = 'https://crooz.co.jp';
  const TITLE = {
    home: 'クルーズ株式会社｜公式企業サイト', overview: '会社概要｜クルーズ株式会社', business: '事業・グループ会社紹介｜クルーズ株式会社', contact: 'お問い合わせ｜クルーズ株式会社',
    liveHome: S.title, liveOverview: '会社概要｜クルーズ株式会社', liveContact: 'お問い合わせページ｜クルーズ株式会社',
  };
  const WD = WP.data;
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'グローバルナビ': { r: 'guro-barunabi', segs: ['グローバルナビ'] },
    'フッターナビ': { r: 'futta-nabi', segs: ['フッターナビ'] },
    'ページタイトル：中央揃え・下にブルーのライン': [{ r: 'pe-jitaitoru:', segs: ['ページ', 'タイトル：'] }, { r: 'chuuouzoroe/shitaniburu-norain', segs: ['中央揃え・', '下に', 'ブルーの', 'ライン'] }],
    '会社概要': { r: 'kaishagaiyou', segs: ['会社概要'], predict: ['会社', '会社概要'], yomi: ['かいしゃ', 'かいしゃがいよう'] },
    'お問い合わせ（': { r: 'otoiawase(', segs: ['お問い合わせ（'] },
    '）': { r: ')', segs: ['）'] },
    '様）': { r: 'sama)', segs: ['様）'] },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);
  // PHP files: WordPress coding standards indent with tabs (the status bar shows タブのサイズ: 4)
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) {
    const f = Code.files[path];
    if (f && /\.php$/.test(path)) f.indent = '\t';
    show0(path, o);
  };
  /** typing script for tab-indented lines (PHP, WordPress coding standards): Enter + auto-indent, corrected */
  function tabScript(lines, after) {
    const out = [];
    let prev = after;
    for (const line of lines) {
      const tabs = line.match(/^\t*/)[0].length, body = line.slice(tabs);
      if (prev != null) {
        out.push({ key: 'Enter' });
        const auto = K.indentAfter(prev, '\t').match(/^\t*/)[0].length;
        if (auto > tabs) out.push({ key: 'Backspace', n: auto - tabs });
        else if (auto < tabs) out.push({ direct: '\t'.repeat(tabs - auto) });
      } else if (tabs) out.push({ direct: '\t'.repeat(tabs) });
      if (body) out.push(...K.codeScript([body], JA));
      prev = line;
    }
    return out;
  }

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  // Contact Form 7 has a second (hidden) save button in the form: the one on screen is in the ステータス box
  const cf7Save = () => WP.els('#wpcf7-admin-form-element [name="wpcf7-save"]').find((b) => b.getBoundingClientRect().width > 0);
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? WP.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  /** an element of the device-mode page, clipped to the device screen (the page scrolls inside it) */
  const spRect = (fn) => () => {
    const e = fn();
    if (!e) return null;
    const r = screenRect(e), f = $('#stSpFrame').getBoundingClientRect();
    const top = Math.max(r.top, f.top), bottom = Math.min(r.bottom, f.bottom);
    return { left: r.left, top, width: r.width, height: Math.max(0, bottom - top) };
  };
  const textEl = (sel, re) => WP.els(sel).find((e) => re.test(e.textContent));
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  /** a WordPress screen in the admin tab (its real title and address), the page loading for a moment */
  async function wpScreen(key, o = {}) {
    if (o.loading !== false) { Browser.loading('wp', true); await wait(o.ms || 450); }
    await WP.show(key);
    Browser.nav('wp', { title: WP.title(key), url: o.url || WP.url(key), page: 'wp' });
    if (o.loading !== false) Browser.loading('wp', false);
    await wait(o.after != null ? o.after : 300);
  }
  /** types into a captured text box (data-demo-input) */
  async function wpType(name, script, o = {}) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 60 });
    WP.focus(box, true);
    if (o.selectAll) {
      await Keycap.show(['Ctrl', 'A'], 500);
      box.innerHTML = `<span style="background:#b4d5fe">${esc(box.textContent)}</span>`;
      await wait(250);
    }
    const t = await typeInto(WP.typeInto(name, undefined, { base: o.base || '' }), script, { kps: o.kps || 12 });
    if (o.blur !== false) WP.blur(name);
    return t;
  }
  /** a password typed into a captured box: ● in the key display, • in the box */
  async function wpPassword(name, text) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.12, after: 60 });
    WP.focus(box, true);
    await D.Ime.setMode(false, true);
    for (let n = 1; n <= text.length; n++) {
      KeyStrip.key('●');
      box.innerHTML = '•'.repeat(n) + '<span class="demo-caret"></span>';
      await D.kw(1000 / 11 * (0.55 + Math.random() * 0.9));
    }
    KeyStrip.idleHide(700);
    WP.blur(name);
  }
  /** double-clicks `word` (inside the first `within` in the box) and types over it */
  async function boxReplace(name, within, word, script, o = {}) {
    const box = WP.field(name);
    const all = box.textContent;
    const w = all.indexOf(within);
    if (w < 0) throw new Error('boxReplace: not found ' + within);
    const at = w + within.indexOf(word);
    const before = all.slice(0, at), after = all.slice(at + word.length);
    box.innerHTML = esc(before) + `<span class="demo-sel">${esc(word)}</span>` + esc(after);
    const sel = box.querySelector('.demo-sel');
    await clickUi(sel, { kind: 'text', dbl: true, after: 60 });
    sel.style.background = '#b4d5fe';
    WP.focus(box, true);
    await wait(300);
    const target = {
      cls: { comp: 'demo-ime' },
      render(text, comp) { box.innerHTML = esc(before + text) + comp + '<span class="demo-caret"></span>' + esc(after); },
      anchor() { const c = box.querySelector('.demo-ime.active') || box.querySelector('.demo-ime') || box.querySelector('.demo-caret') || box; return screenRect(c); },
    };
    const t = await typeInto(target, script, { kps: o.kps || 13 });
    box.textContent = before + t + after;
    WP.blur(name);
    return t;
  }
  /** a captured box: Ctrl+A, Ctrl+V of a whole text */
  async function boxPaste(name, text) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.3, ay: 0.2, after: 60 });
    WP.focus(box, true);
    await Keycap.show(['Ctrl', 'A'], 500);
    box.innerHTML = `<span style="background:#b4d5fe">${esc(box.textContent)}</span>`;
    await wait(250);
    await Keycap.show(['Ctrl', 'V'], 600);
    box.textContent = text;
    box.scrollTop = 0;
    await wait(300);
    WP.blur(name);
  }
  /** a real <input> of a captured screen (no look-alike box): its value typed key by key */
  async function inputType(inp, text, o = {}) {
    await clickUi(inp, { kind: 'text', ax: 0.2, after: 60 });
    inp.classList.add('demo-focus');
    if (inp.value) await Keycap.show(['Ctrl', 'A'], 450);
    await D.Ime.setMode(false, true);
    inp.value = '';
    for (const ch of text) { KeyStrip.key(ch); inp.value += ch; await D.kw(1000 / (o.kps || 12) * (0.55 + Math.random() * 0.9)); }
    KeyStrip.special('Enter');
    KeyStrip.idleHide(700);
    inp.classList.remove('demo-focus');
  }
  /** the dev site (http://localhost:8888) in the "dev" tab */
  async function devPage(page, path, o = {}) {
    Browser.nav('dev', { title: TITLE[page], url: o.url || DEV + path, page: 'store', fav: 'wp' });
    Browser.loading('dev', true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading('dev', false);
    await wait(o.after != null ? o.after : 500);
    return Store.doc;
  }
  /** an address pasted into the omnibox (Ctrl+V, Enter) */
  async function pasteUrl(text) {
    await clickUi('#brOmni', { kind: 'text' });
    $('#brOmni').classList.add('focus');
    $('#brUrl').innerHTML = `<span style="background:#c6dafc">${esc($('#brUrl').textContent)}</span>`;
    await wait(200);
    await Keycap.show(['Ctrl', 'V'], 600);
    $('#brUrl').textContent = text;
    await wait(250);
    KeyStrip.special('Enter');
    KeyStrip.idleHide(700);
    $('#brOmni').classList.remove('focus');
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the dev environment, the theme */
  scene('setup', async () => {
    Caption.step(1);
    Caption.set('ローカルに WordPress の開発環境を用意：wp-env（Docker）で WordPress と MySQL を起動');
    await hoverUi(Code.lineEl(10), { ax: 0.3, hold: 900 });
    await Code.openFile('.wp-env.json', { top: 0 });
    await hoverUi(Code.lineEl(3), { ax: 0.4, hold: 1200 });
    await hoverUi(Code.lineEl(5), { ax: 0.3, hold: 700 });
    // the original theme: its header in style.css (the name WordPress lists it under)
    Caption.set('オリジナルテーマ「CROOZ」：wp-content/themes/crooz（style.css のテーマ情報）を wp-env でマウント');
    await Code.openFile(T + 'style.css', { top: 0 });
    Issue.ok(linesRect(0, 9, 640), 'テーマ名 CROOZ');
    await wait(2200);
    Issue.hide();
    await Code.panel(true);
    await Term.run('npm start', ['', '<span class="tdim">&gt; crooz-corporate@ start</span>', '<span class="tdim">&gt; wp-env start</span>', '', 300,
      async () => Term.spin('Starting WordPress…', 2200, '<span class="tg">✔</span> WordPress development site started at <span class="tc">http://localhost:8888</span>'),
      '<span class="tg">✔</span> WordPress test site started at http://localhost:8889',
      '<span class="tg">✔</span> MySQL is listening on port 52814',
      '<span class="tg">✔</span> MySQL for automated testing is listening on port 52820', '',
      '<span class="tg">✔</span> Done! <span class="tdim">(in 38s 412ms)</span>'], { kps: 14 });
    await wait(500);
    // the admin: the real login screen of this WordPress
    Caption.set('管理画面にログイン（http://localhost:8888/wp-admin）');
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8888/wp-admin');
    await wpScreen('login', { url: DEV + '/wp-login.php?redirect_to=http%3A%2F%2Flocalhost%3A8888%2Fwp-admin%2F&reauth=1' });
    await wpType('user', [{ direct: 'admin' }], { kps: 10 });
    await wpPassword('pass', 'password');
    await clickUi(WP.el('#wp-submit'), { kind: 'hand', after: 60 });
    // 「WordPress イベントとニュース」 collapsed, as WordPress draws a closed box (its events follow the capturing
    // machine's location; capture-wp.js now stores it closed for the admin user)
    const events = WP.el('#dashboard_primary', 'dashboard');
    if (events) events.classList.add('closed');
    await wpScreen('dashboard', { ms: 700 });
    await wait(600);
    // the theme: 外観 › テーマ → CROOZ を有効化
    Caption.set('外観 › テーマ：オリジナルテーマ「CROOZ」（wp-content/themes/crooz）を有効化');
    await clickUi(WP.el('#menu-appearance > a'), { kind: 'hand', after: 60 });
    await wpScreen('themes');
    const card = WP.el('.theme[data-slug="crooz"]');
    await hoverUi(card.querySelector('.theme-screenshot') || card, { hold: 900 });
    await clickUi(card.querySelector('.theme-actions .activate'), { kind: 'hand', after: 60 });
    await wpScreen('themes-active', { ms: 600 });
    Issue.ok(R('.theme.active', 4), '有効：CROOZ');
    await wait(2000);
    Issue.hide();
    // the site in a new tab
    await Browser.newTab('dev');
    await Browser.typeUrl('localhost:8888');
    await devPage('home', '/', { states: ['noMenu'] });
    Caption.set('テーマのトップページ（front-page.php）が表示された。ヘッダーのナビゲーションはまだ空');
    await hoverUi(Store.doc.querySelector('.header-main'), { ax: 0.5, hold: 1500 });
    await hoverUi(Store.doc.querySelector('.mv-text') || Store.doc.querySelector('.section-mv'), { ax: 0.3, hold: 1400 });
  });

  /* 2 — the design, the global menu */
  scene('design', async () => {
    Caption.step(2);
    Caption.set('メニューの位置を登録：functions.php の register_nav_menus（グローバルナビ・フッターナビ）');
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile(T + 'functions.php', { top: 8 });
    const at = Code.find("add_theme_support( 'responsive-embeds' );").line;
    await Code.newLineAfter(at);
    await Code.type(tabScript(F.NAV_FN, Code.files[Code.active].lines[at]), { kps: 18 });
    await Code.save();
    check(T + 'functions.php', P[T + 'functions.php'], 'functions.php');
    // header.php already outputs the menu of that location (wp_nav_menu, class gnav)
    await Code.openFile(T + 'header.php', { top: 6 });
    const nav = Code.find("'theme_location' => 'global'").line;
    Issue.ok(linesRect(nav - 3, nav + 6, 700), 'header.php：位置 global のメニューを ul.gnav で出力');
    await wait(2300);
    Issue.hide();
    // the page title: the corporate design (the live site's page titles: centred, a blue line under them)
    Caption.set('デザイン：ページタイトルは中央揃え・字間を広く、下にコーポレートカラー（#2dafe6）のライン');
    await Code.openFile(T + 'assets/css/main.css', { top: 0 });
    const bodyEnd = Code.find('}', Code.find('body {').line).line;
    await Code.newLineAfter(bodyEnd);
    await Code.type(code(F.CSS_DESIGN, { after: '}' }), { kps: 22 });
    await Code.save();
    // the menu in WordPress
    Caption.set('外観 › メニュー：「グローバルナビ」のメニューを、位置「グローバルナビ」に割り当てて保存');
    await Win.switchTo('browser');
    await Browser.clickTab('wp');
    await clickUi(WP.el('#menu-appearance .wp-submenu a[href="nav-menus.php"]'), { kind: 'hand', after: 60 });
    await wpScreen('menus');
    await hoverUi(WP.el('#menu-to-edit > li:first-child .menu-item-title'), { hold: 600 });
    await hoverUi(WP.el('#menu-to-edit > li:last-child .menu-item-title'), { hold: 500 });
    await WP.scroll(WP.el('#locations-global'), 800);
    const loc = WP.el('#locations-global');
    await clickUi(loc, { after: 80 });
    loc.checked = true; loc.setAttribute('checked', '');
    await wait(400);
    await clickUi(WP.el('#save_menu_footer'), { kind: 'hand', after: 60 });
    await wpScreen('menus-saved', { ms: 600 });
    Issue.ok(R('#message, .notice-success, .updated', 2), 'グローバルナビを保存');
    await wait(1900);
    Issue.hide();
    // the site again
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('home'); }, { key: 'F5' });
    Caption.set('ヘッダーにグローバルナビ：ニュース・企業情報・事業・グループ会社紹介・IR・投資家情報・採用情報');
    await hoverUi(Store.doc.querySelector('.gnav li:nth-child(2) a'), { kind: 'hand', hold: 900 });
    await hoverUi(Store.doc.querySelector('.gnav li:nth-child(3) a'), { kind: 'hand', hold: 800 });
    Cursor.kind('arrow');
    await wait(300);
  });

  /* 3 — 会社概要: the template, the page (the Japanese slug) */
  scene('overview', async () => {
    Caption.step(3);
    Caption.set('会社概要のテンプレート page-overview.php：会社情報（資料の内容）と page.php の骨組みを貼り付け');
    await Win.switchTo('code');
    await Code.newFile(T + 'page-overview.php');
    const L = F.OV_LOOP, open = L.findIndex((l) => /table-overview/.test(l)), end = L.findIndex((l) => /endforeach/.test(l));
    await Code.paste([...F.OV_HEAD, ...F.OV_DATA, ...L.slice(0, open + 1), ...L.slice(end + 1), ''].join('\n'));
    await wait(500);
    Caption.set('表の部分：項目ごとに dl（dt：項目名 / dd：内容）を foreach で出力');
    const row = Code.find('<div class="table-overview">').line;
    await Code.reveal(row, 600);
    await Code.newLineAfter(row);
    await Code.type(tabScript(L.slice(open + 1, end + 1), L[open]), { kps: 24 });
    await Code.save();
    check(T + 'page-overview.php', P[T + 'page-overview.php'], 'page-overview.php');
    Issue.ok(linesRect(Code.find('<?php foreach').line, Code.find('<?php endforeach').line, 760), 'foreach：8 項目を dl で出力');
    await wait(2200);
    Issue.hide();
    // the page in WordPress
    Caption.set('固定ページ › 新規追加：タイトル「会社概要」、親ページは「企業情報」');
    await Win.switchTo('browser');
    await Browser.clickTab('wp');
    const pages = WP.el('#menu-pages');
    await hoverUi(WP.el('#menu-pages > a'), { hold: 200 });
    pages.classList.add('opensub');
    await wait(250);
    await clickUi(WP.el('#menu-pages .wp-submenu a[href="post-new.php?post_type=page"]'), { kind: 'hand', after: 60 });
    pages.classList.remove('opensub');
    await wpScreen('page-new', { ms: 900 });
    const title = WP.el('.editor-post-title__input, h1.wp-block-post-title');
    await clickUi(title, { kind: 'text', ax: 0.06, after: 60 });
    await typeInto(frameTextTarget(title), [JA['会社概要']], { kps: 11 });
    const parent = textEl('.editor-post-panel__row', /^\s*親/);
    const pBtn = parent && (parent.querySelector('.editor-post-panel__row-control button, button') || parent);
    if (pBtn) await clickUi(pBtn, { kind: 'hand', after: 300 });
    await wpScreen('page-titled', { loading: false, after: 200 });
    const parent2 = textEl('.editor-post-panel__row', /^\s*親/);
    if (parent2) { Issue.ok(R(parent2, 3), '親：企業情報'); await wait(1800); Issue.hide(); }
    await clickUi(WP.el('.editor-post-publish-panel__toggle'), { kind: 'hand', after: 60 });
    await wpScreen('page-prepublish', { loading: false, after: 700 });
    await clickUi(WP.el('.editor-post-publish-panel .editor-post-publish-button'), { kind: 'hand', after: 60 });
    await wpScreen('page-published', { loading: false, after: 600 });
    mark('published');
    const copy = WP.els('.post-publish-panel__postpublish button').find((b) => /コピー/.test(b.textContent));
    if (copy) await clickUi(copy, { kind: 'hand', after: 300 });
    // the page on the site: no table
    await Browser.clickTab('dev');
    await pasteUrl('localhost:8888/about/会社概要/');
    await devPage('overview', '/about/会社概要/', { states: ['noTemplate'], after: 700 });
    Caption.issue('表示ミス', '会社概要の表が出ない：page-overview.php ではなく page.php（タイトルだけ）で表示されている');
    Issue.show(() => screenRect(Store.doc.querySelector('.article-overview .page-content') || Store.doc.querySelector('.page-content')), 'テンプレートが使われていない');
    await wait(2900);
    Issue.hide();
    const encoded = encodeURIComponent('会社概要').toLowerCase();
    Caption.issue('原因', `スラッグが日本語のまま（${encoded.slice(0, 18)}…）。page-overview.php はスラッグ overview 用`);
    await hoverUi($('#brOmni'), { ax: 0.22, hold: 2400 });
    // 固定ページ一覧 → クイック編集
    await Browser.clickTab('wp');
    // (the block editor hides the admin menu: its back button goes to the list of pages)
    await clickUi(WP.el('.editor-header__back-button a') || WP.el('#menu-pages > a'), { kind: 'hand', after: 60 });
    await wpScreen('pages');
    const tr = WP.el(`#post-${WD.overview.id}`);
    await hoverUi(tr.querySelector('.row-title'), { hold: 500 });
    await clickUi(tr.querySelector('button.editinline'), { kind: 'hand', after: 60 });
    await wpScreen('pages-quickedit', { loading: false, after: 300 });
    Caption.set('固定ページ一覧 › クイック編集：スラッグを overview に変更');
    await wpType('slug', [{ direct: 'overview' }], { kps: 11, selectAll: true });
    await clickUi(WP.el('.inline-edit-row .save'), { kind: 'hand', after: 60 });
    await wpScreen('pages-fixed', { ms: 600 });
    Issue.ok(R(`#post-${WD.overview.id}`, 2), '— 会社概要（/about/overview/）');
    await wait(1900);
    Issue.hide();
    // the site: the table
    await Browser.clickTab('dev');
    await Browser.typeUrl('localhost:8888/about/overview/');
    await devPage('overview', '/about/overview/', { after: 500 });
    Caption.fixed('/about/overview/ で page-overview.php が使われ、会社概要の表が表示された');
    await hoverUi(Store.doc.querySelector('.section-pageTitle .title-main'), { hold: 900 });
    await Store.scrollToEl(Store.doc.querySelector('.table-overview'), 150, 1200);
    Issue.ok(() => screenRect(Store.doc.querySelector('.table-overview')), '会社概要（9 項目）');
    await wait(2300);
    Issue.hide();
    await Store.scroll(0, 900);
  });

  /* 4 — 事業・グループ会社紹介 */
  scene('business', async () => {
    Caption.step(4);
    Caption.set('事業紹介 page-business.php：5 つのセクション（番号・見出し・本文・画像）をループで出力');
    await Win.switchTo('code');
    await Code.openFile(T + 'page-business.php', { top: 6 });
    await hoverUi(Code.lineEl(10), { ax: 0.35, hold: 1200 });
    const hero = Code.find('<section class="hero-section">').line;
    const at = Code.find('</section>', hero).line;
    await Code.reveal(at, 700);
    await Code.newLineAfter(at);
    await Code.type(tabScript(F.BIZ_LOOP.map((l) => '\t\t\t' + l), Code.files[Code.active].lines[at]), { kps: 30 });
    await Code.save();
    check(T + 'page-business.php', P[T + 'page-business.php'], 'page-business.php');
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8888/business/');
    await devPage('business', '/business/', { after: 400 });
    Caption.set('ヒーロー画像の下に、番号付きの 5 つのセクション（$crooz_sections の順）');
    const d = Store.doc;
    const blocks = [...d.querySelectorAll('.section-block')];
    for (const [i, b] of blocks.slice(0, 3).entries()) {
      await Store.scrollToEl(b, 120, 1200);
      if (i === 0) await hoverUi(b.querySelector('.section-number') || b, { hold: 900 });
      await wait(400);
    }
    await Store.scrollToEl(d.querySelector('.logo-card-section') || blocks[blocks.length - 1], 260, 1300);
    await wait(800);
    await Store.scroll(0, 900);
  });

  /* 5 — お問い合わせ: Contact Form 7 */
  scene('contact', async () => {
    Caption.step(5);
    Caption.set('お問い合わせフォーム：プラグインを追加 › 「Contact Form 7」を検索してインストール');
    await Browser.clickTab('wp');
    const plug = WP.el('#menu-plugins');
    await hoverUi(WP.el('#menu-plugins > a'), { hold: 200 });
    plug.classList.add('opensub');
    await wait(250);
    await clickUi(WP.el('#menu-plugins .wp-submenu a[href="plugin-install.php"]'), { kind: 'hand', after: 60 });
    plug.classList.remove('opensub');
    // the search results screen, shown before the search as the empty プラグインを追加 (no results, empty box)
    await WP.show('plugin-search');
    const results = WP.el('#plugin-filter'), search = WP.el('#search-plugins');
    results.style.visibility = 'hidden';
    search.value = '';
    await wpScreen('plugin-search', { ms: 700, url: DEV + '/wp-admin/plugin-install.php' });
    await inputType(search, 'Contact Form 7', { kps: 13 });
    Browser.loading('wp', true); await wait(800);
    results.style.visibility = '';
    Browser.loading('wp', false);
    Browser.nav('wp', { url: WP.url('plugin-search') });
    await wait(300);
    const cardEl = WP.el('.plugin-card-contact-form-7');
    await hoverUi(cardEl.querySelector('.name a, h3') || cardEl, { hold: 800 });
    const btn = cardEl.querySelector('.install-now');
    await clickUi(btn, { kind: 'hand', after: 60 });
    btn.textContent = 'インストール中…'; btn.classList.add('updating-message');
    await wait(1900);
    await wpScreen('plugin-installed', { loading: false, after: 300 });
    await clickUi(WP.el('.plugin-card-contact-form-7 .activate-now'), { kind: 'hand', after: 60 });
    await wpScreen('plugins', { ms: 700 });
    Issue.ok(R('tr[data-slug="contact-form-7"]', 2), 'Contact Form 7 6.2.5（有効）');
    await wait(1200);
    Issue.hide();
    // the form: the live form's markup with the form tags
    Caption.set('お問い合わせ › コンタクトフォームを追加：本番デザインのマークアップにフォームタグを入れたテンプレートを貼り付け');
    const cf = WP.el('[id^="toplevel_page_wpcf7"]');
    await hoverUi(cf.querySelector('a'), { hold: 200 });
    cf.classList.add('opensub');
    await wait(250);
    await clickUi(cf.querySelector('.wp-submenu a[href="admin.php?page=wpcf7-new"]'), { kind: 'hand', after: 60 });
    cf.classList.remove('opensub');
    await wpScreen('cf7-new', { ms: 700 });
    await wpType('title', [JA['お問い合わせ（'], { direct: 'IR' }, JA['）']], { kps: 11 });
    await boxPaste('form', F.CF7_FORM(true));
    await wait(400);
    await clickUi(cf7Save(), { kind: 'hand', after: 60 });
    await wpScreen('cf7-error', { ms: 800 });
    mark('cf7-error');
    Caption.issue('設定エラー', 'フォームタブで 1 件の設定エラー：保存はされたが、このままでは使えない');
    const fErr = WP.els('#form-panel .config-error');
    Issue.show(R(fErr[0], 3), 'このタブパネルで1件の設定エラー');
    await wait(2200);
    Issue.hide();
    // the error under the form box (the form box is long: scroll down to it)
    const win = WP.doc().defaultView;
    const errY = fErr[1].getBoundingClientRect().top + win.scrollY;
    await WP.scroll(Math.max(0, errY - 760), 900);
    Caption.issue('設定エラー', 'フォームタブ：使用できない名前 "name"（WordPress の予約語）がフォーム項目に使われている');
    Issue.show(R(fErr[1], 3), 'フォームコントロールに使用できない名前');
    await wait(2900);
    Issue.hide();
    await WP.scroll(0, 800);
    await hoverUi(WP.el('#mail-panel-tab'), { hold: 900 });
    Caption.issue('設定エラー', 'メールタブにも「!」：エラーを 1 件ずつ直す');
    await wait(1600);
    Caption.set('お名前の項目名を本番と同じ user_surname / user_name に変更');
    await boxReplace('form', '[text* surname', 'surname', [{ direct: 'user_surname' }], { kps: 14 });
    await boxReplace('form', '[text* name ', 'name', [{ direct: 'user_name' }], { kps: 14 });
    await wait(300);
    // the mail tab
    await clickUi(WP.el('#mail-panel-tab'), { kind: 'hand', after: 60 });
    await wpScreen('cf7-mail', { loading: false, after: 300 });
    const hdr = WP.field('headers');
    await WP.scroll(hdr, 700);
    Caption.issue('設定エラー', 'メールタブ：追加ヘッダーの Reply-To が雛形の [your-email] のまま（このフォームの項目は user_email）');
    const mErr = WP.els('#mail-panel .config-error');
    Issue.show(R(mErr[1] || hdr, 3), 'Reply-To 項目に不正なメールボックス構文');
    await wait(2700);
    Issue.hide();
    await boxReplace('headers', '[your-email]', 'your-email', [{ direct: 'user_email' }], { kps: 14 });
    Caption.set('件名と本文も、このフォームの項目（[user_surname] [user_name] [company] …）に合わせる');
    await WP.scroll(WP.field('subject'), 600);
    await wpType('subject', [{ direct: '[_site_title] ' }, JA['お問い合わせ（'], { direct: '[user_surname] [user_name] ' }, JA['様）']], { kps: 15, selectAll: true });
    await boxPaste('body', F.CF7_MAIL.body);
    await wait(300);
    await clickUi(cf7Save(), { kind: 'hand', after: 60 });
    await wpScreen('cf7-saved', { ms: 800 });
    Caption.fixed('保存：設定エラーはなくなった（フォーム・メールとも）');
    Issue.ok(R('#message, .notice-success, .updated', 2), 'コンタクトフォームを保存しました（エラーなし）');
    await wait(2300);
    Issue.hide();
    // the page: the Contact Form 7 block
    Caption.set('固定ページ「お問い合わせ」に、Contact Form 7 のブロックでフォームを配置');
    await clickUi(WP.el('#menu-pages > a'), { kind: 'hand', after: 60 });
    await wpScreen('pages-fixed', { url: WP.url('pages') });
    const crow = WP.els('.wp-list-table .row-title').find((a) => a.textContent.trim() === 'お問い合わせ');
    await clickUi(crow, { kind: 'hand', after: 60 });
    await wpScreen('contact-editor', { ms: 900 });
    await clickUi(WP.el('.editor-document-tools__inserter-toggle'), { kind: 'hand', after: 60 });
    await wpScreen('contact-inserter', { loading: false, after: 200 });
    await wpType('search', [{ direct: 'contact' }], { kps: 10, blur: false });
    await wpScreen('contact-inserter-search', { loading: false, after: 300 });
    const item = WP.els('.block-editor-block-types-list__item').find((x) => /Contact Form 7|コンタクトフォーム/i.test(x.textContent));
    await clickUi(item, { kind: 'hand', after: 60 });
    await wpScreen('contact-block', { loading: false, after: 400 });
    const blk = WP.el('.wp-block[data-type^="contact-form-7"]') || WP.el('[class*="contact-form-selector"]');
    if (blk) { Issue.ok(R(blk, 4), 'コンタクトフォーム：お問い合わせ（IR）'); await wait(1900); Issue.hide(); }
    await clickUi(WP.el('.editor-post-publish-button, .editor-header__settings .is-primary'), { kind: 'hand', after: 60 });
    await wpScreen('contact-updated', { loading: false, after: 900 });
    // the form on the site: 送信 with the required fields empty
    Caption.set('サイトで確認：注意事項に同意して、まず必須項目を空のまま送信');
    await Browser.clickTab('dev');
    await Browser.typeUrl('localhost:8888/contact/');
    await devPage('contact', '/contact/', { after: 1300 });
    const n = window.Crooz.notice(Store.doc);
    if (n) {
      await hoverUi(n.cb.closest('label') || n.cb, { hold: 300 });
      await clickUi(n.cb, { kind: 'hand', after: 200 });
      n.cb.checked = true;
      await wait(300);
      SF.state(Store.doc, 'contactReady', true);
    }
    await wait(400);
    const form = window.Crooz.activeForm(Store.doc);
    await Store.scrollToEl(form, 160, 1200);
    const send = form.querySelector('.wpcf7-submit');
    await Store.scrollToEl(send, 560, 900);
    await clickUi(send, { kind: 'hand', after: 500 });
    SF.state(Store.doc, 'contactInvalid', true);
    await wait(300);
    Caption.fixed('Contact Form 7 の入力チェック：必須項目に「入力してください。」（項目名がフォームと一致）');
    const out = form.querySelector('.wpcf7-response-output');
    if (out) Issue.ok(() => screenRect(out), '入力チェックが動作');
    await wait(2300);
    Issue.hide();
    await Store.scrollToEl(form, 160, 1200);
    const tip = form.querySelector('.wpcf7-not-valid-tip');
    if (tip) { Issue.ok(() => screenRect(tip.closest('dl') || tip), '必須項目のエラー表示'); await wait(2200); Issue.hide(); }
  });

  /* 6 — smartphone */
  scene('sp', async () => {
    Caption.step(6);
    Caption.set('スマートフォン表示の確認：Chrome のデバイスモード（iPhone 14 Pro Max・幅 390px）');
    await Browser.typeUrl('localhost:8888/about/overview/');
    await devPage('overview', '/about/overview/', { after: 300 });
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Store.loadSp('overview', { states: ['spBroken'] });
    await wait(500);
    await Store.scrollToEl(Store.spDoc.querySelector('.table-overview'), 90, 1000, true);
    Caption.issue('表示崩れ', '会社概要の表：項目名（dt）が 280px のまま横に並び、内容（dd）が細い列に押し込まれている');
    Issue.show(spRect(() => Store.spDoc.querySelector('.table-overview')), '表が横に並んだまま');
    await wait(2900);
    Issue.hide();
    // the media query
    Caption.set('640px 以下では dt / dd を縦に並べる（本番サイトと同じブレークポイント）');
    await Win.switchTo('code');
    await Code.openFile(T + 'assets/css/main.css', { top: 30 });
    const lines = Code.files[Code.active].lines;
    const end = lines[lines.length - 1] === '' ? lines.length - 2 : lines.length - 1;
    await Code.reveal(end, 600);
    await Code.newLineAfter(end);
    await Code.type(code(F.CSS_SP, { after: '}' }), { kps: 24 });
    await Code.save();
    check(T + 'assets/css/main.css', P[T + 'assets/css/main.css'], 'main.css');
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.loadSp('overview'); }, { key: 'F5' });
    await Store.scrollToEl(Store.spDoc.querySelector('.table-overview'), 90, 0, true);
    Caption.fixed('スマートフォンでは 1 項目ずつ、項目名の下に内容が並ぶ');
    Issue.ok(spRect(() => Store.spDoc.querySelector('.table-overview')), '項目名と内容が縦に並ぶ');
    await wait(2400);
    Issue.hide();
    await Store.scroll(Store.yOf(Store.spDoc.querySelector('.table-overview dl:nth-child(5)'), 80, true), 1200, true);
    await wait(800);
    // the other pages at 390px
    Caption.set('事業紹介・お問い合わせもスマートフォンの幅で確認');
    await Browser.typeUrl('localhost:8888/business/');
    Browser.nav('dev', { title: TITLE.business, url: DEV + '/business/' });
    Browser.loading('dev', true);
    await Store.loadSp('business');
    Browser.loading('dev', false);
    await wait(600);
    const sb = Store.spDoc.querySelector('.section-block');
    if (sb) await Store.scrollToEl(sb, 60, 1300, true);
    await wait(1000);
    await Browser.typeUrl('localhost:8888/contact/');
    Browser.nav('dev', { title: TITLE.contact, url: DEV + '/contact/' });
    Browser.loading('dev', true);
    await Store.loadSp('contact', { states: ['contactReady'] });
    Browser.loading('dev', false);
    await wait(600);
    const f = window.Crooz.activeForm(Store.spDoc);
    if (f) await Store.scrollToEl(f, 60, 1300, true);
    await wait(1500);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 500);
    Store.device(false);
  });

  /* 7 — the live site */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開後のサイト（crooz.co.jp）');
    await Browser.newTab('live');
    await Browser.typeUrl('crooz.co.jp');
    Browser.nav('live', { url: LIVE + '/', title: TITLE.liveHome, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    mark('live');
    await wait(1600);
    await hoverUi(Store.doc.querySelector('.mv-text') || Store.doc.querySelector('.section-mv'), { ax: 0.3, hold: 1800 });
    await Browser.typeUrl('crooz.co.jp/about/overview');
    Browser.nav('live', { url: LIVE + '/about/overview', title: TITLE.liveOverview });
    Browser.loading('live', true);
    await Store.load('overview');
    Browser.loading('live', false);
    Caption.set('企業情報 › 会社概要：オリジナルテーマのテンプレートで表示');
    await wait(900);
    await Store.scrollToEl(Store.doc.querySelector('.table-overview'), 150, 1300);
    await wait(1800);
    await Store.scroll(0, 700);
    await Browser.typeUrl('crooz.co.jp/business');
    Browser.nav('live', { url: LIVE + '/business', title: TITLE.business });
    Browser.loading('live', true);
    await Store.load('business');
    Browser.loading('live', false);
    Caption.set('事業・グループ会社紹介：5 つのセクションとグループ会社');
    await wait(1000);
    await Store.scrollToEl(Store.doc.querySelector('.section-block'), 120, 1400);
    await wait(1200);
    await Store.scrollToEl(Store.doc.querySelector('.logo-card-section') || Store.doc.querySelector('.section-block:last-of-type'), 260, 1600);
    await wait(1200);
    await Browser.typeUrl('crooz.co.jp/contact');
    Browser.nav('live', { url: LIVE + '/contact', title: TITLE.liveContact });
    Browser.loading('live', true);
    await Store.load('contact');
    Browser.loading('live', false);
    Caption.set('お問い合わせ：注意事項に同意すると、Contact Form 7 のフォーム（IR / その他のお問い合わせ）');
    await wait(1300);
    const n = window.Crooz.notice(Store.doc);
    if (n) { await clickUi(n.cb, { kind: 'hand', after: 200 }); window.Crooz.closeNotice(Store.doc); }
    await wait(300);
    await Store.scrollToEl(window.Crooz.activeForm(Store.doc) || Store.doc.querySelector('.form_tab'), 260, 1300);
    await wait(1800);
    // back to the top page (the logo)
    const logo = Store.doc.querySelector('.header .logo a');
    await Store.scroll(0, 900);
    await clickUi(logo, { kind: 'hand', after: 60 });
    Browser.nav('live', { url: LIVE + '/', title: TITLE.liveHome });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    Cursor.kind('arrow');
    Caption.set('WordPress のコーポレートサイト：オリジナルテーマ・会社概要・事業紹介・お問い合わせ・スマートフォン対応');
    await wait(4500);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'overview', 'business', 'contact'],
    fontText: JSON.stringify(JA) + F.CF7_FORM(true) + F.CF7_MAIL.body + Object.values(TITLE).join(''),
    async prepare() {
      const tree = [
        ['wp-content', 'dir', 1], ['wp-content/themes', 'dir', 1], ['wp-content/themes/crooz', 'dir', 1],
        [T + 'assets', 'dir', 1], [T + 'assets/css', 'dir', 1], [T + 'assets/css/main.css'], [T + 'assets/js', 'dir', 0], [T + 'assets/js/main.js'],
        [T + 'template-parts', 'dir', 1], [T + 'template-parts/business', 'dir', 0], [T + 'template-parts/business/group-companies.php'], [T + 'template-parts/breadcrumb.php'],
        [T + 'footer.php'], [T + 'front-page.php'], [T + 'functions.php'], [T + 'header.php'], [T + 'index.php'], [T + 'page-business.php'], [T + 'page.php'], [T + 'style.css'],
        ['.gitignore'], ['.wp-env.json'], ['package.json'], ['README.md'],
      ];
      // as on screen at the start: functions.php without the menus, main.css without the design / the smartphone fix,
      // page-business.php without its loop; page-overview.php is made in scene 3
      const files = { ...P, [T + 'functions.php']: F.FN_BEFORE_NAV, [T + 'assets/css/main.css']: F.CSS_START, [T + 'page-business.php']: F.BIZ_BEFORE_LOOP };
      delete files[T + 'page-overview.php'];
      Code.init(files, tree);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'wp', title: '新しいタブ', url: '', page: 'blank', fav: 'blank' });
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
