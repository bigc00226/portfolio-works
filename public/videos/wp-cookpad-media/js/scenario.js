/*
 * Timeline: the WordPress おしらせ (news / owned media) of クックパッド株式会社 (info.cookpad.com) —
 * the post type pr_news (show_in_rest: the classic editor) → its categories (the Japanese slugs: the old URL is a 404)
 * → 外部リンク (ACF), the import of the old おしらせ, a new article scheduled → the article template → the list
 * (the links of 外部リンク articles) → the live site.
 * Every WordPress screen is the real wp-admin (js/wp-snapshot.js, tools/snapshots/wp-cookpad-media/capture-wp.js); the
 * site itself is the live info.cookpad.com (js/site-snapshot.js), shown as the dev site at http://localhost:8888.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, WP = window.WP, CP = window.Cookpad;
  const { $, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, frameTextTarget, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const P = F.files, T = F.T;
  const DEV = 'http://localhost:8888', LIVE = 'https://info.cookpad.com';
  const NEXT = window.NEWS_NEXT;
  const SITE = 'クックパッド株式会社';
  const ARTICLE = '新機能についていただいたご意見と、今後の取り組みについて';
  const ARTICLE_PATH = '/news/%e6%96%b0%e6%a9%9f%e8%83%bd%e3%81%ab%e3%81%a4%e3%81%84%e3%81%a6%e3%81%84%e3%81%9f%e3%81%a0%e3%81%84%e3%81%9f%e3%81%94%e6%84%8f%e8%a6%8b%e3%81%a8%e3%80%81%e4%bb%8a%e5%be%8c%e3%81%ae%e5%8f%96%e3%82%8a';
  const TITLE = {
    news: 'おしらせ | ' + SITE, publish: '出版 | おしらせカテゴリー | ' + SITE, article: ARTICLE + ' | ' + SITE,
    marine: CP.MARINE + ' | ' + SITE, notfound: 'Page not found | ' + SITE, home: SITE,
  };
  const WD = WP.data;
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'おしらせ': { r: 'oshirase', segs: ['おしらせ'] },
    'カテゴリー': { r: 'kategori-', segs: ['カテゴリー'] },
    'リリース': { r: 'riri-su', segs: ['リリース'] },
    'お知らせ': { r: 'oshirase', segs: ['お知らせ'], predict: ['お知らせ', 'おしらせ'], yomi: ['おしらせ', 'おしらせ'] },
    '出版': { r: 'shuppan', segs: ['出版'] },
    'おしらせカテゴリー': { r: 'oshirasekategori-', segs: ['おしらせ', 'カテゴリー'] },
  };
  // PHP files: tabs (WordPress coding standards; VS Code detects them from the file)
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) {
    const f = Code.files[path];
    if (f && /\.php$/.test(path)) f.indent = '\t';
    show0(path, o);
  };
  /** typing script for tab-indented lines: Enter + the editor's auto-indent, corrected */
  function tabScript(lines, after) {
    const out = [];
    let prev = after;
    for (const line of lines) {
      const want = line.match(/^[\t ]*/)[0], body = line.slice(want.length);
      if (prev != null) {
        out.push({ key: 'Enter' });
        const auto = K.indentAfter(prev, '\t');
        if (want.startsWith(auto)) { if (want.length > auto.length) out.push({ direct: want.slice(auto.length) }); } else {
          out.push({ key: 'Backspace', n: auto.length });
          if (want) out.push({ direct: want });
        }
      } else if (want) out.push({ direct: want });
      if (body) out.push(...K.codeScript([body], JA));
      prev = line;
    }
    return out;
  }

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b, w = 900) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? WP.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const SR = (fn, pad = 0) => () => { const e = fn(); if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const textEl = (sel, re, key) => WP.els(sel, key).find((e) => re.test(e.textContent));
  const norm = (s) => s.replace(/\n+$/, '');
  const check = (path, want, tag) => { if (norm(Code.text(path)) !== norm(want)) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); (window.__typeDiffText = window.__typeDiffText || []).push({ tag, got: Code.text(path), want }); } };
  /** a WordPress screen in the admin tab (its real title and address), the page loading for a moment */
  async function wpScreen(key, o = {}) {
    if (o.loading !== false) { Browser.loading('wp', true); await wait(o.ms || 450); }
    if (o.before) o.before(WP.docs(key));
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
  /** opens a submenu of the admin menu (hover, the flyout) and clicks one of its links */
  async function adminMenu(top, href) {
    const li = WP.el(top);
    await hoverUi(li.querySelector('a'), { hold: 200 });
    li.classList.add('opensub');
    await wait(250);
    await clickUi(li.querySelector(`.wp-submenu a[href="${href}"]`), { kind: 'hand', after: 60 });
    li.classList.remove('opensub');
  }
  /** the dev site (http://localhost:8888) in the "dev" tab */
  async function devPage(page, path, o = {}) {
    Browser.nav('dev', { title: o.title || TITLE[page], url: o.url || DEV + path, page: 'store', fav: 'wp' });
    Browser.loading('dev', true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading('dev', false);
    await wait(o.after != null ? o.after : 500);
    return Store.doc;
  }
  /** hovers a link of the page: Chrome's status bubble shows its address */
  async function hoverLink(a, origin, hold = 1200) {
    await hoverUi(a, { kind: 'hand', hold: 10 });
    CP.status(decodeURI(CP.linkUrl(a, origin)));
    await wait(hold);
  }
  const unhover = () => { CP.status(null); Cursor.kind('arrow'); };
  /** the quick-edit row of a term in the captured terms screen: closed (the list as it is) / open */
  function quickEdit(key, open) {
    const row = WP.el('.inline-edit-row', key);
    if (!row) return;
    const id = (row.id || '').replace(/^edit-/, '');
    const orig = WP.el('#tag-' + id, key);
    row.style.display = open ? '' : 'none';
    if (orig) orig.style.display = open ? 'none' : '';
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the post type おしらせ */
  scene('cpt', async () => {
    Caption.step(1);
    Caption.set('「おしらせ」を WordPress で投稿・管理できるようにする：まず専用の投稿タイプ pr_news（/news）');
    await hoverUi(Code.lineEl(10), { ax: 0.3, hold: 1100 });
    await Code.newFile(T + 'inc/post-types.php');
    await Code.paste(F.PT_HEAD.join('\n') + '\n\n');
    Caption.set('register_post_type：一覧は /news（has_archive）、記事は /news/{スラッグ}、アイキャッチ画像と抜粋を使う');
    await Code.type(tabScript(F.PT_CPT, null), { kps: 24 });
    await Code.save();
    check(T + 'inc/post-types.php', F.ptWith(false, false), 'post-types.php (1)');
    await Code.openFile(T + 'functions.php', { top: 0 });
    await Code.lineAfter("inc/template-tags.php", [{ direct: F.FN_PT }], { kps: 26 });
    await Code.save();
    // the admin: F5 → the menu おしらせ
    await Win.switchTo('browser');
    await Browser.reload(async () => { await WP.show('dashboard-news'); Browser.nav('wp', { title: WP.title('dashboard-news'), url: WP.url('dashboard-news') }); }, { key: 'F5' });
    Issue.ok(R('#menu-posts-pr_news', 2), 'メニューに「おしらせ」');
    await wait(1600);
    Issue.hide();
    await adminMenu('#menu-posts-pr_news', 'post-new.php?post_type=pr_news');
    await wpScreen('news-classic', { ms: 700 });
    mark('classic');
    Caption.issue('編集画面', 'ブロックエディターではなく、クラシックエディターが開いた');
    Issue.show(R('#postdivrich', 4), 'クラシックエディター');
    await wait(2600);
    Issue.hide();
    Caption.issue('原因', 'show_in_rest がない投稿タイプは REST API に出ないため、ブロックエディターで編集できない');
    await Win.switchTo('code');
    await Code.openFile(T + 'inc/post-types.php', { top: 0 });
    const sup = Code.find("'supports'").line;
    Issue.show(linesRect(Code.find("register_post_type(").line, sup + 2, 820), 'show_in_rest の指定がない');
    await wait(2300);
    Issue.hide();
    await Code.lineAfter("'supports'", [{ direct: F.PT_REST.trim() }], { kps: 22 });
    await Code.save();
    check(T + 'inc/post-types.php', F.ptWith(true, false), 'post-types.php (2)');
    await Win.switchTo('browser');
    await Browser.reload(async () => { await WP.show('news-block'); Browser.nav('wp', { title: WP.title('news-block'), url: WP.url('news-block') }); }, { key: 'F5' });
    await wait(500);
    Caption.fixed("'show_in_rest' => true で、おしらせもブロックエディターで書けるようになった");
    Issue.ok(R(() => WP.el('.editor-post-title__input, h1.wp-block-post-title') || WP.el('.editor-header'), 6), 'ブロックエディター');
    await wait(2200);
    Issue.hide();
    // the rewrite rules: 設定 › パーマリンク → 変更を保存
    Caption.set('設定 › パーマリンク：「変更を保存」で、/news・/news/{スラッグ} のリライトルールを登録し直す');
    // (the block editor hides the admin menu: straight to the settings screen by its address)
    await Browser.typeUrl('localhost:8888/wp-admin/options-permalink.php');
    await wpScreen('permalink', { ms: 600 });
    await WP.scroll(WP.el('#submit'), 900);
    await clickUi(WP.el('#submit'), { kind: 'hand', after: 60 });
    await wpScreen('permalink-saved', { ms: 700 });
    Issue.ok(R('#setting-error-settings_updated, .notice-success, .updated', 2), 'パーマリンク構造を更新');
    await wait(1700);
    Issue.hide();
  });

  /* 2 — the categories */
  scene('cats', async () => {
    Caption.step(2);
    Caption.set('カテゴリー：本番と同じ「リリース・お知らせ・出版」を、おしらせ専用のタクソノミー pr_news_category で');
    await Win.switchTo('code');
    const fn = Code.find('function cookpad_info_register_news() {').line;
    await Code.reveal(fn, 600);
    await Code.newLineAfter(fn);
    Caption.set('投稿タイプより先に登録：/news/category/… のルールが /news/{記事} のルールより先になる');
    await Code.type(tabScript([...F.PT_TAX, ''], Code.files[Code.active].lines[fn]), { kps: 24 });
    await Code.save();
    check(T + 'inc/post-types.php', F.ptWith(true, true), 'post-types.php (3)');
    // the terms
    await Win.switchTo('browser');
    Caption.set('おしらせ › おしらせカテゴリー：リリース・お知らせ・出版を追加');
    // (the menu of this screen was drawn before the taxonomy existed: the new screen is opened by its address)
    await Browser.typeUrl('localhost:8888/wp-admin/edit-tags.php?taxonomy=pr_news_category&post_type=pr_news');
    await wpScreen('terms', { ms: 700 });
    // terms-added: the rows appear one by one (WordPress adds each row to the list without reloading)
    const added = WP.els('#the-list tr[id^="tag-"]', 'terms-added');
    const rowOf = (name) => added.find((tr) => (tr.querySelector('.row-title, .name a') || tr).textContent.trim() === name);
    added.forEach((tr) => { tr.style.display = 'none'; });
    for (const [i, name] of ['リリース', 'お知らせ', '出版'].entries()) {
      if (i > 0) { await WP.show('terms-added'); }
      await wpType('name', [JA[name]], { kps: 11 });
      await clickUi(WP.el('#submit'), { kind: 'hand', after: 60 });
      await WP.show('terms-added');
      // WordPress empties the form after adding the term
      const nameBox = WP.field('name', 'terms-added');
      if (nameBox) { nameBox.textContent = ''; WP.blur('name', 'terms-added'); }
      const tr = rowOf(name);
      await wait(500);
      if (tr) tr.style.display = '';
      if (i === 0) {
        const emptyRow = WP.el('#the-list tr.no-items', 'terms-added');
        if (emptyRow) emptyRow.style.display = 'none';
      }
      await wait(500);
    }
    await hoverUi(WP.el('#the-list'), { ax: 0.55, ay: 0.4, hold: 900 });
    // the old URL
    Caption.set('旧サイトと同じ URL か確認：/news/category/publish（出版）');
    await Browser.newTab('dev');
    await Browser.typeUrl('localhost:8888/news/category/publish');
    await devPage('notfound', '/news/category/publish', { after: 600 });
    mark('404');
    Caption.issue('404', '/news/category/publish が見つからない（Page not found）');
    Issue.show(SR(() => Store.doc.querySelector('#main_inner h1') || Store.doc.querySelector('#main_inner'), 10), '404');
    await wait(2600);
    Issue.hide();
    await Browser.clickTab('wp');
    const slugCell = () => { const tr = rowOf('出版'); return tr && (tr.querySelector('td.slug, td.column-slug') || tr); };
    Caption.issue('原因', 'スラッグを空欄で追加したので、名前の「出版」がそのままスラッグに（URL は /news/category/%e5%87%ba%e7%89%88）');
    Issue.show(SR(slugCell, 4), 'スラッグが日本語のまま');
    await wait(2800);
    Issue.hide();
    // クイック編集: publish / announce / release
    Caption.set('クイック編集でスラッグを旧サイトと同じ英字に：出版 → publish、お知らせ → announce、リリース → release');
    const FIX = [['出版', 'publish', 'terms-qe1'], ['お知らせ', 'announce', 'terms-qe2'], ['リリース', 'release', 'terms-qe3']];
    for (const [i, [name, slug, key]] of FIX.entries()) {
      quickEdit(key, false);
      await WP.show(key);
      const row = WP.els('#the-list tr[id^="tag-"]', key).find((tr) => (tr.querySelector('.row-title, .name a') || tr).textContent.trim() === name);
      if (row) {
        await hoverUi(row.querySelector('.row-title') || row, { hold: 300 });
        row.classList.add('demo-hover');
        const qe = row.querySelector('button.editinline, .editinline');
        if (qe) await clickUi(qe, { kind: 'hand', after: 60 });
        row.classList.remove('demo-hover');
      }
      quickEdit(key, true);
      await wait(300);
      await wpType('slug', [{ direct: slug }], { kps: 11, selectAll: true });
      await clickUi(WP.el('.inline-edit-row .save', key), { kind: 'hand', after: 60 });
      await wait(i === 2 ? 300 : 500);
    }
    await wpScreen('terms-fixed', { loading: false, after: 300 });
    Issue.ok(R('#the-list', 2), 'release / announce / publish');
    await wait(1800);
    Issue.hide();
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await devPage('notfound', '/news/category/publish', { states: ['fallback'], title: '出版 | おしらせカテゴリー | ' + SITE, after: 0 }); }, { key: 'F5' });
    Caption.fixed('/news/category/publish が出版のカテゴリーとして開くように（一覧の表示は 5 で作る）');
    await wait(2400);
  });

  /* 3 — 外部リンク (ACF), the import, a new おしらせ */
  scene('content', async () => {
    Caption.step(3);
    Caption.set('外部リンク：書籍や PR TIMES のおしらせは、一覧から外部のページへ（ACF のフィールド news_url）');
    await Win.switchTo('code');
    await Code.openFile('.wp-env.json', { top: 0 });
    Issue.ok(linesRect(4, 4, 760), 'Advanced Custom Fields（wordpress.org）');
    await wait(1900);
    Issue.hide();
    await Code.newFile(T + 'inc/fields.php');
    await Code.paste(P[T + 'inc/fields.php'].replace(/\n$/, ''));
    await Code.reveal(Code.find("'name'").line, 500);
    Issue.ok(linesRect(Code.find("'key'          =>").line, Code.find("'instructions'").line, 900), 'URL フィールド：news_url');
    await wait(2200);
    Issue.hide();
    await Code.save();
    await Code.openFile(T + 'functions.php', { top: 0 });
    await Code.lineAfter("inc/post-types.php", [{ direct: F.FN_FIELDS }], { kps: 26 });
    await Code.save();
    // the import
    Caption.set('既存のおしらせを移行：旧サイトから書き出した data/news.csv（882 件）を WP-CLI のスクリプトで取り込む');
    await Code.openFile('data/news.csv', { top: 0 });
    await hoverUi(Code.lineEl(0), { ax: 0.15, hold: 900 });
    await hoverUi(Code.lineEl(2), { ax: 0.35, hold: 1100 });
    await Code.openFile('scripts/import-news.php', { top: 22 });
    const ins = Code.find('wp_insert_post(').line;
    Issue.ok(linesRect(ins, Code.find("update_field( 'news_url'").line, 980), '記事・カテゴリー・外部リンクを登録');
    await wait(2400);
    Issue.hide();
    await Code.panel(true);
    const I = F.IMPORT;
    await Term.run('npm run import', ['', '<span class="tdim">&gt; cookpad-info@ import</span>', '<span class="tdim">&gt; wp-env run cli wp eval-file scripts/import-news.php</span>', '',
      'ℹ Starting \'wp eval-file scripts/import-news.php\' on the cli container. ', '', 200,
      async () => Term.progress('取り込み中  ', I.rows, 3600, { unit: '' }),
      async () => { window.Win11 && window.Win11.skipTo && window.Win11.skipTo('13:18'); },
      `<span class="tg">Success:</span> ${I.rows} 件のおしらせを取り込みました（外部リンク ${I.external} 件・アイキャッチ画像 ${I.images} 件）。`,
      '<span class="tg">✔</span> Ran `wp eval-file scripts/import-news.php` in \'cli\'. <span class="tdim">(in 2m 51s 204ms)</span>'], { kps: 14 });
    await wait(600);
    await Win.switchTo('browser');
    await Browser.clickTab('wp');
    await clickUi(WP.el('#menu-posts-pr_news > a', 'terms-fixed'), { kind: 'hand', after: 60 });
    WP.els('#the-list .demo-hover', 'news-list').forEach((e) => e.classList.remove('demo-hover'));
    await wpScreen('news-list', { ms: 700 });
    Caption.set('おしらせ一覧：882 件。カテゴリーの列（リリース・お知らせ・出版）と公開日も旧サイトのまま');
    Issue.ok(R('.tablenav.top .displaying-num', 3), '882 個の項目');
    await wait(1600);
    Issue.hide();
    await hoverUi(WP.el('#the-list tr:first-child .column-taxonomy-pr_news_category, #the-list tr:first-child td:nth-child(3)'), { hold: 900 });
    // a new おしらせ: the book out on 11/11
    Caption.set('新しいおしらせを入稿：11 月 11 日発売の書籍（記事はクックパッドニュース）');
    await clickUi(WP.el('.page-title-action'), { kind: 'hand', after: 60 });
    await wpScreen('news-new', { ms: 900 });
    const title = WP.el('.editor-post-title__input, h1.wp-block-post-title', 'news-new');
    await clickUi(title, { kind: 'text', ax: 0.06, after: 60 });
    await Keycap.show(['Ctrl', 'V'], 600);
    title.textContent = NEXT.title;
    title.classList.remove('is-placeholder');
    await wait(500);
    // category 出版
    const cat = WP.els('.editor-post-taxonomies__hierarchical-terms-choice, .components-checkbox-control', 'news-new').find((x) => /出版/.test(x.textContent));
    const box = cat && cat.querySelector('input[type="checkbox"]');
    if (box) {
      await clickUi(box, { kind: 'hand', after: 60 });
      box.checked = true; box.setAttribute('checked', '');
      const ctl = box.closest('.components-checkbox-control__input-container');
      if (ctl && !ctl.querySelector('svg')) ctl.insertAdjacentHTML('beforeend', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="components-checkbox-control__checked" aria-hidden="true" focusable="false"><path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 7.9z"></path></svg>');
      await wait(500);
    }
    // the featured image: the media library
    Caption.set('アイキャッチ画像：書籍の表紙（メディアライブラリにアップロード済み）');
    await clickUi(WP.el('.editor-post-featured-image__toggle, .editor-post-featured-image button', 'news-new'), { kind: 'hand', after: 60 });
    const sel = WP.els('.media-modal .attachment.selected', 'news-media');
    sel.forEach((li) => li.classList.remove('selected', 'details'));
    await wpScreen('news-media', { loading: false, after: 400 });
    const att = WP.el('.media-modal .attachment', 'news-media');
    await clickUi(att, { kind: 'hand', after: 60 });
    sel.forEach((li) => li.classList.add('selected', 'details'));
    await wait(600);
    await clickUi(WP.el('.media-modal .media-button-select', 'news-media'), { kind: 'hand', after: 60 });
    await wpScreen('news-thumb', { loading: false, after: 300 });
    // 外部リンク
    Caption.set('外部リンク：クックパッドニュースの記事の URL（一覧から別タブで開く）');
    const url = WP.field('url');
    const side = url && url.closest('.interface-complementary-area, .editor-sidebar, .interface-interface-skeleton__sidebar');
    if (side && url.getBoundingClientRect().bottom > side.getBoundingClientRect().bottom - 40) {
      const to = side.scrollTop + url.getBoundingClientRect().top - side.getBoundingClientRect().top - 260;
      await D.tween(700, (k) => { side.scrollTop = side.scrollTop + (to - side.scrollTop) * k; });
    }
    await clickUi(url, { kind: 'text', ax: 0.2, after: 60 });
    WP.focus(url, true);
    await Keycap.show(['Ctrl', 'V'], 600);
    url.textContent = NEXT.link;
    await wait(400);
    WP.blur('url');
    // the date: 11/11 15:00 → 予約投稿
    Caption.set('公開日時を発売日の 11 月 11 日 15:00 に → 「予約投稿」');
    const pub = textEl('.editor-post-panel__row', /^\s*公開/, 'news-thumb');
    if (pub) await clickUi(pub.querySelector('button') || pub, { kind: 'hand', after: 300 });
    await wpScreen('news-date', { loading: false, after: 400 });
    const pub2 = textEl('.editor-post-panel__row', /^\s*公開/, 'news-date');
    if (pub2) { Issue.ok(R(pub2, 3), '2026年11月11日 3:00 PM'); await wait(1700); Issue.hide(); }
    await clickUi(WP.el('.editor-post-publish-panel__toggle', 'news-date'), { kind: 'hand', after: 60 });
    await wpScreen('news-prepublish', { loading: false, after: 700 });
    await clickUi(WP.el('.editor-post-publish-panel .editor-post-publish-button', 'news-prepublish'), { kind: 'hand', after: 60 });
    await wpScreen('news-scheduled', { loading: false, after: 400 });
    mark('scheduled');
    Issue.ok(R('.post-publish-panel__postpublish-header, .post-publish-panel__postpublish', 2), '予約済み：11月11日 15:00 に公開');
    await wait(2000);
    Issue.hide();
    WP.els('#the-list .demo-hover', 'news-list2').forEach((e) => e.classList.remove('demo-hover'));
    await clickUi(WP.el('.editor-header__back-button a, .edit-post-fullscreen-mode-close, a[aria-label*="戻る"]', 'news-scheduled') || WP.el('.editor-header', 'news-scheduled'), { kind: 'hand', after: 60 });
    await wpScreen('news-list2', { ms: 700 });
    Issue.ok(R('#the-list tr:first-child', 1), '予約済み 2026年11月11日 3:00 PM');
    await wait(1900);
    Issue.hide();
  });

  /* 4 — the article template */
  scene('single', async () => {
    Caption.step(4);
    Caption.set('記事テンプレート single-pr_news.php：本番の記事ページと同じマークアップ（もどるリンク・見出し・カテゴリー・日付・本文）');
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.newFile(T + 'single-pr_news.php');
    const B = F.SINGLE_BODY, i0 = B.findIndex((l) => /class="article_info"/.test(l));
    const block = B.slice(i0, i0 + 11);
    await Code.paste([...F.SINGLE_HEAD, ...B.slice(0, i0), ...B.slice(i0 + 11), ...F.SINGLE_TAIL].join('\n') + '\n');
    Caption.set('カテゴリー（記事のタームへのリンク）と日付（2026.03.22 の形式）の部分を書く');
    const h2 = Code.find('<h2><?php the_title(); ?></h2>').line;
    await Code.reveal(h2, 600);
    await Code.newLineAfter(h2);
    await Code.type(tabScript(block, Code.files[Code.active].lines[h2]), { kps: 25 });
    await Code.save();
    check(T + 'single-pr_news.php', P[T + 'single-pr_news.php'], 'single-pr_news.php');
    // an article with a body (お知らせ, 2026-03-22)
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    Caption.set('本文のある記事（お知らせ）を開いて確認');
    await Browser.typeUrl('localhost:8888/news/新機能についていただいたご意見と、今後の取り');
    await devPage('article', ARTICLE_PATH, { url: DEV + decodeURI(ARTICLE_PATH), after: 600 });
    Issue.ok(SR(() => Store.doc.querySelector('#article_header'), 6), '見出し・カテゴリー・日付');
    await wait(2000);
    Issue.hide();
    await Store.scrollToEl(Store.doc.querySelector('#article_body'), 160, 1300);
    await wait(1400);
    await Store.scroll(0, 800);
  });

  /* 5 — the list */
  scene('list', async () => {
    Caption.step(5);
    Caption.set('一覧ページ：1 ページ 10 件（pre_get_posts）と、年別の /news/2026（リライトルール）');
    await Win.switchTo('code');
    await Code.newFile(T + 'inc/news.php');
    await Code.paste(F.NEWS_BASE.join('\n') + '\n');
    await Code.save();
    await Code.openFile(T + 'functions.php', { top: 0 });
    await Code.lineAfter("inc/fields.php", [{ direct: F.FN_NEWS }], { kps: 26 });
    await Code.save();
    Caption.set('archive-pr_news.php：カテゴリーのタブ・件数・年の選択・一覧・ページ送り（本番のマークアップ）');
    await Code.newFile(T + 'archive-pr_news.php');
    await Code.paste(P[T + 'archive-pr_news.php'].replace(/\n$/, ''));
    Issue.ok(linesRect(Code.find('<div class="list_news">').line, Code.find('<?php get_template_part( \'template-parts/news/pager\' ); ?>').line, 820), '1 件ずつ template-parts/news/item.php');
    await wait(2000);
    Issue.hide();
    await Code.save();
    await Code.newFile(T + 'taxonomy-pr_news_category.php');
    await Code.paste(P[T + 'taxonomy-pr_news_category.php'].replace(/\n$/, ''));
    await Code.save();
    for (const part of ['pager', 'filter-year']) {
      await Code.newFile(T + `template-parts/news/${part}.php`);
      await Code.paste(P[T + `template-parts/news/${part}.php`].replace(/\n$/, ''), { after: 150 });
      await Code.save();
    }
    Caption.set('一覧の 1 件（template-parts/news/item.php）：画像・タイトル・カテゴリー・日付');
    await Code.newFile(T + 'template-parts/news/item.php');
    await Code.paste([...F.ITEM_HEAD, '?>', F.ITEM_A_BAD].join('\n'));
    await Code.type(tabScript(F.ITEM_BODY, F.ITEM_A_BAD), { kps: 26 });
    await Code.save();
    check(T + 'template-parts/news/item.php', F.itemFile(false), 'item.php (1)');
    // the list on the dev site
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8888/news');
    await devPage('news', '/news', { states: ['before1111', 'internalLinks'], after: 600 });
    Caption.set('おしらせ一覧：882 件、カテゴリーのタブ、10 件ずつのページ送り');
    Issue.ok(SR(() => Store.doc.querySelector('#news_info'), 6), '882 件');
    await wait(1500);
    Issue.hide();
    await Store.scrollToEl(Store.doc.querySelector('.list_news'), 200, 1200);
    await wait(500);
    await Store.scrollToEl(Store.doc.querySelector('#pager_news'), 520, 1300);
    await hoverUi(Store.doc.querySelector('#pager_news'), { hold: 900 });
    await Store.scroll(0, 900);
    // the first item: a book (外部リンク)
    const first = () => [...Store.doc.querySelectorAll('.list_news li.n')].find((li) => li.style.display !== 'none').querySelector('a');
    await hoverLink(first(), DEV, 1100);
    await clickUi(first(), { kind: 'hand', after: 60 });
    unhover();
    await devPage('article', '/news/' + CP.MARINE_SLUG, { url: DEV + '/news/' + decodeURIComponent(CP.MARINE_SLUG), title: TITLE.marine, states: ['emptyArticle'], after: 700 });
    mark('empty');
    Caption.issue('リンク', '書籍のおしらせが中身のない記事ページに：クックパッドニュースの記事（外部リンク）へ飛ばない');
    Issue.show(SR(() => Store.doc.querySelector('#article_body') || Store.doc.querySelector('#article_header'), 8), '本文が空');
    await wait(2800);
    Issue.hide();
    await Win.switchTo('code');
    const aLine = Code.find('<li class="n"><a href="<?php the_permalink(); ?>"').line;
    Caption.issue('原因', 'item.php が the_permalink()（記事ページ）のまま。外部リンク（news_url）を見ていない');
    Issue.show(linesRect(aLine, aLine, 1000), 'the_permalink()');
    await wait(2600);
    Issue.hide();
    // the fix: cookpad_info_news_link() in inc/news.php, used by the item (and by the RSS feed)
    Caption.set('リンク先を決める関数 cookpad_info_news_link()：外部リンクがあればその URL（別タブ）、なければ記事ページ');
    await Code.openFile(T + 'inc/news.php', { top: 14 });
    const NL = F.NEWS_LINK, iFn = NL.findIndex((l) => /^function cookpad_info_news_link/.test(l)), iFilter = NL.findIndex((l) => /^add_filter\(/.test(l));
    const lastBase = Code.find("add_action( 'init', 'cookpad_info_news_rewrite' );").line;
    await Code.reveal(lastBase, 600);
    await Code.newLineAfter(lastBase);
    await Code.paste('\n' + NL.slice(0, iFn).join('\n'), { after: 200 });
    await Code.type(tabScript(NL.slice(iFn, iFilter), NL[iFn - 1]), { kps: 25 });
    Caption.set('RSS（/news/feed）のリンクも同じ関数で：本番の RSS と同じく外部リンクの URL');
    await Code.paste('\n' + NL.slice(iFilter).join('\n'), { after: 400 });
    await Code.save();
    check(T + 'inc/news.php', P[T + 'inc/news.php'], 'news.php');
    await Code.openFile(T + 'template-parts/news/item.php', { top: 0 });
    await Code.lineAfter('$cookpad_info_cats = wp_get_post_terms', [{ direct: F.ITEM_LINK_FIX }], { kps: 26 });
    await Code.overwrite(F.ITEM_A_BAD, tabScript(F.ITEM_A_GOOD, null), { kps: 34 });
    await Code.save();
    check(T + 'template-parts/news/item.php', F.itemFile(true), 'item.php (2)');
    // the list again
    Caption.set('一覧をもう一度開いて、リンク先を確認');
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8888/news');
    await devPage('news', '/news', { states: ['before1111'], after: 500 });
    await hoverLink(first(), DEV, 1600);
    Caption.fixed('外部リンクのあるおしらせは news.cookpad.com へ（別タブ）、本文のあるおしらせは記事ページへ');
    const internal = [...Store.doc.querySelectorAll('.list_news li.n a')].find((a) => /^\/news\//.test(a.getAttribute('href')));
    await hoverLink(internal, DEV, 1400);
    unhover();
    // the year
    Caption.set('年の選択：2026 → /news/2026（追加したリライトルール）');
    const yearSel = Store.doc.querySelector('.filter_year select');
    await clickUi(yearSel, { kind: 'hand', after: 300 });
    const opt = [...yearSel.options].find((o) => /2026/.test(o.textContent));
    if (opt) { yearSel.value = opt.value; [...yearSel.options].forEach((o) => { o.selected = o === opt; }); }
    await wait(500);
    await devPage('year', '/news/2026', { states: ['before1111'], title: '2026 | おしらせ | ' + SITE, after: 600 });
    const ys = Store.doc.querySelector('.filter_year select');
    const yo = ys && [...ys.options].find((o) => /2026/.test(o.textContent));
    if (yo) ys.value = yo.value;
    Issue.ok(SR(() => Store.doc.querySelector('#news_info'), 6), '2026 年：4 件');
    await wait(1600);
    Issue.hide();
    await Store.scrollToEl(Store.doc.querySelector('.list_news'), 200, 1100);
    await wait(700);
    await Store.scroll(0, 700);
    // a category
    Caption.set('カテゴリーのタブ：出版（/news/category/publish）');
    const tab = [...Store.doc.querySelectorAll('.nav_news_category a')].find((a) => /出版/.test(a.textContent));
    await hoverLink(tab, DEV, 700);
    await clickUi(tab, { kind: 'hand', after: 60 });
    unhover();
    await devPage('publish', '/news/category/publish', { states: ['before1111'], after: 600 });
    Issue.ok(SR(() => Store.doc.querySelector('.nav_news_category a.active') || Store.doc.querySelector('.nav_news_category'), 4), '出版：296 件');
    await wait(1800);
    Issue.hide();
  });

  /* 6 — the live site */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のサイト（info.cookpad.com）：トップページの新着おしらせ');
    await Browser.newTab('live');
    await Browser.typeUrl('info.cookpad.com');
    Browser.nav('live', { url: LIVE + '/', title: TITLE.home, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('home', { states: ['before1111'] });
    Browser.loading('live', false);
    await wait(1200);
    const bn = Store.doc.querySelector('#block_news');
    if (bn) { await Store.scrollToEl(bn, 120, 1600); await wait(1600); }
    Caption.set('おしらせ一覧（info.cookpad.com/news）');
    await Browser.typeUrl('info.cookpad.com/news');
    Browser.nav('live', { url: LIVE + '/news', title: TITLE.news, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('news', { states: ['before1111'] });
    Browser.loading('live', false);
    mark('live');
    await wait(1200);
    await Store.scrollToEl(Store.doc.querySelector('.list_news'), 200, 1300);
    await wait(900);
    // (the page keeps hidden copies of the list for its other layouts: the link on screen)
    const ext = [...Store.doc.querySelectorAll('.list_news li.n a[target="_blank"]')].find((x) => x.getBoundingClientRect().width > 0);
    if (ext) await hoverLink(ext, LIVE, 1300);
    unhover();
    await Store.scroll(0, 800);
    Caption.set('カテゴリー「出版」：/news/category/publish');
    const tab = [...Store.doc.querySelectorAll('.nav_news_category a')].find((a) => /出版/.test(a.textContent));
    await clickUi(tab, { kind: 'hand', after: 60 });
    Browser.nav('live', { url: LIVE + '/news/category/publish', title: TITLE.publish });
    Browser.loading('live', true);
    await Store.load('publish', { states: ['before1111'] });
    Browser.loading('live', false);
    await wait(1100);
    await Store.scrollToEl(Store.doc.querySelector('.list_news'), 200, 1200);
    await wait(900);
    await Store.scroll(0, 700);
    // the article
    Caption.set('本文のあるおしらせは記事ページ（single-pr_news.php）');
    await Browser.typeUrl('info.cookpad.com/news/新機能についていただいたご意見と、今後の取り');
    Browser.nav('live', { url: LIVE + decodeURI(ARTICLE_PATH), title: TITLE.article });
    Browser.loading('live', true);
    await Store.load('article');
    Browser.loading('live', false);
    await wait(1200);
    await Store.scrollToEl(Store.doc.querySelector('#article_body'), 160, 1300);
    await wait(1000);
    await Store.scroll(0, 800);
    const back = Store.doc.querySelector('#article_header .btn_back');
    if (back) {
      await hoverLink(back, LIVE, 500);
      await clickUi(back, { kind: 'hand', after: 60 });
      unhover();
      Browser.nav('live', { url: LIVE + '/news', title: TITLE.news });
      Browser.loading('live', true);
      await Store.load('news', { states: ['before1111'] });
      Browser.loading('live', false);
    }
    Cursor.kind('arrow');
    Caption.set('WordPress のおしらせ：投稿タイプ・カテゴリー・外部リンク・記事テンプレート・一覧ページ（11/11 の書籍は予約投稿済み）');
    await wait(4500);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'news', 'publish', 'article', 'notfound', 'year'],
    fontText: JSON.stringify(JA) + Object.values(TITLE).join('') + NEXT.title + '予約済み外部リンク',
    async prepare() {
      const D0 = 'wp-content/themes/cookpad-info';
      const tree = [
        ['data', 'dir', 0], ['data/news.csv'],
        ['scripts', 'dir', 0], ['scripts/import-news.php'],
        ['wp-content', 'dir', 1], ['wp-content/themes', 'dir', 1], [D0, 'dir', 1],
        [T + 'assets', 'dir', 0], [T + 'assets/images', 'dir', 0], [T + 'assets/scripts', 'dir', 0], [T + 'assets/scripts/main.js'], [T + 'assets/styles', 'dir', 0], [T + 'assets/styles/main.css'],
        [T + 'inc', 'dir', 1], [T + 'inc/assets.php'], [T + 'inc/setup.php'], [T + 'inc/template-tags.php'],
        [T + 'template-parts', 'dir', 1], [T + 'template-parts/footer', 'dir', 0], [T + 'template-parts/news', 'dir', 0], [T + 'template-parts/page', 'dir', 0], [T + 'template-parts/top', 'dir', 0],
        [T + '404.php'], [T + 'footer.php'], [T + 'front-page.php'], [T + 'functions.php'], [T + 'header.php'], [T + 'index.php'], [T + 'page.php'], [T + 'style.css'],
        ['.wp-env.json'], ['package.json'], ['README.md'],
      ];
      // as on screen at the start: no おしらせ files yet; functions.php without them
      const files = { ...P, [T + 'functions.php']: F.FN() };
      for (const k of Object.keys(files)) if (/inc\/(post-types|fields|news)\.php$|archive-pr_news|single-pr_news|taxonomy-pr_news|template-parts\/news\//.test(k)) delete files[k];
      Code.init(files, tree);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'wp', title: WP_SNAPSHOT_TITLE(), url: DEV + '/wp-admin/', page: 'wp', fav: 'wp' });
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      await WP.show('dashboard');
      Browser.nav('wp', { title: WP.title('dashboard'), url: WP.url('dashboard'), page: 'wp' });
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  function WP_SNAPSHOT_TITLE() { const p = window.WP_SNAPSHOT.pages.dashboard; return p ? p.title : 'ダッシュボード'; }
  void WD; void frameTextTarget;
  window.__JA = JA;
})();
