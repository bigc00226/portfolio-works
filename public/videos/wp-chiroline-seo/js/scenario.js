/*
 * Timeline: SEO for カイロライン三鷹整体院 (chiroline-mitakain.com, WordPress + Arkhe) —
 * the page source as it was → SEO SIMPLE PACK (install, title format, the front page description, GA4) → the custom
 * post type archives' noindex (SEO SIMPLE PACK's default) → the 料金情報 page's description (the meta box) →
 * JSON-LD in the child theme (a typo caught by JSON.parse() in Chrome's console) → the categories' slugs / descriptions,
 * the breadcrumb → the live pages.
 * Every WordPress screen is the real wp-admin (js/wp-snapshot.js, tools/snapshots/wp-chiroline-seo/capture-wp.js); the
 * site is the live chiroline-mitakain.com (js/site-snapshot.js), its page source the live HTML (js/sources.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, WP = window.WP, C = window.Chiro;
  const { $, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const { VSRC, CON, SRC, LIVE, DEV } = C;
  const T = F.T, P = F.files;
  const POST_SLUG = 'なぜあなたの腰痛は繰り返すのか？三鷹の整体師';
  const TITLE = {
    home: 'カイロライン三鷹整体院 | 三鷹で肩こり・腰痛・猫背を根本改善する整体',
    post: 'なぜあなたの腰痛は繰り返すのか？三鷹の整体師が教える背骨との関係性 | カイロライン三鷹整体院',
    category: 'セルフケア・ストレッチ | カイロライン三鷹整体院',
  };
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    PRICE: [
      { r: 'kairorainmitakaseitaiinno', segs: ['カイロライン', '三鷹', '整体院の'] },
      { r: 'sejutsuryoukindesu.', segs: ['施術', '料金です。'] },
      { r: 'shokaigenteino', segs: ['初回', '限定の'] },
      { r: 'waribikiryoukinkara,', segs: ['割引', '料金から、'] },
      { direct: '2' },
      { r: 'kaimeiikouno', segs: ['回目', '以降の'] },
      { r: 'tsuujouryoukinwo', segs: ['通常', '料金を'] },
      { r: 'keisaishiteimasu.', segs: ['掲載しています。'] },
      { r: 'kakushukurejittoka-do,', segs: ['各種', 'クレジットカード、'] },
      { r: 'denshimane-mo', segs: ['電子', 'マネーも'] },
      { r: 'goriyouitadakemasunode', segs: ['ご利用', 'いただけますので'] },
      { r: 'goanshinkudasai.', segs: ['ご安心', 'ください。'] },
    ],
  };

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? WP.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const SR = (sel, pad = 0) => R(() => Store.doc && Store.doc.querySelector(sel), pad);
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
    await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, ay: o.ay, after: 60 });
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
  /** a captured box: Ctrl+V of a whole text (the box was empty) */
  async function boxPaste(name, text, o = {}) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.3, ay: o.ay != null ? o.ay : 0.3, after: 60 });
    WP.focus(box, true);
    await Keycap.show(['Ctrl', 'V'], 600);
    box.textContent = text;
    box.scrollTop = 0;
    await wait(300);
    WP.blur(name);
  }
  /** line `n` of the open file copied: the caret on it, Ctrl+C with nothing selected (VS Code copies the whole line) */
  async function copyLine(n) {
    await Code.reveal(n, 500);
    await Code.clickAt(n, 2);
    await Keycap.show(['Ctrl', 'C'], 550);
  }
  const findCapture = (re) => WP.els('input[type="submit"], button').find((b) => re.test(b.value || b.textContent));
  /** the page source (Ctrl+U) of the page on show, in a new tab */
  async function viewSource(tab, url, text, o = {}) {
    await Keycap.show(['Ctrl', 'U'], 650);
    if (!Browser.tab(tab)) Browser.addTab({ id: tab, title: 'view-source:' + url, url: 'view-source:' + url, page: 'vsrc', fav: 'dev' }, { anim: true });
    else { Browser.activate(tab); Browser.nav(tab, { title: 'view-source:' + url, url: 'view-source:' + url, page: 'vsrc' }); }
    Browser.loading(tab, true);
    await wait(380);
    VSRC.show(o.name || tab, text, { top: o.top });
    Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 500);
  }
  /** F5 in a source tab: the source again (as the server sends it now) */
  async function reloadSource(text, o = {}) {
    await Browser.reload(async () => { await wait(300); VSRC.show(VSRC.key, text, { top: o.top }); }, { key: 'F5' });
    await wait(o.after != null ? o.after : 400);
  }
  /** the live site in the "live" tab */
  async function livePage(page, url, title, o = {}) {
    Browser.nav('live', { title, url, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading('live', false);
    await wait(o.after != null ? o.after : 600);
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
  const srcLine = (re, from = 0) => { const n = VSRC.find(re, from); if (n < 0) throw new Error('source: not found ' + re); return n; };

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the page source as it is */
  scene('check', async () => {
    Caption.step(1);
    Caption.set('今日の作業メモ：カイロライン三鷹整体院（WordPress・Arkhe）の SEO 対策');
    await hoverUi(Code.lineEl(3), { ax: 0.3, hold: 1700 });
    await hoverUi(Code.lineEl(8), { ax: 0.3, hold: 1700 });
    await Win.switchTo('browser');
    Caption.set('公開中のトップページ：検索エンジンが読む head の中身を、ページのソース（Ctrl+U）で確認');
    await hoverUi(Store.doc.querySelector('.cl-header, header'), { ax: 0.5, hold: 900 });
    await viewSource('src', LIVE + '/', SRC.homeBefore(), { name: 'home' });
    const tl = srcLine(/<title>/);
    Issue.show(VSRC.rect(tl), 'title：サイト名 – キャッチフレーズ（WordPress の標準）');
    await wait(3500);
    Issue.hide();
    const sl = srcLine(/rel="canonical"/);
    await VSRC.scrollTo(Math.max(0, sl - 12), 700);
    Caption.issue('現状', 'description がない（検索結果の説明文は Google まかせ）。SNS 用の OGP もない');
    Issue.show(VSRC.rect(sl), 'canonical だけ（WordPress の標準）');
    await wait(3800);
    Issue.hide();
    await VSRC.scrollTo(VSRC.lines.length - 1, 1100);
    Caption.issue('現状', '構造化データ（JSON-LD）も出力されていない');
    Issue.show(VSRC.rect(VSRC.lines.length - 3, VSRC.lines.length - 1), '</body> まで JSON-LD なし');
    await wait(3200);
    Issue.hide();
  });

  /* 2 — SEO SIMPLE PACK */
  scene('ssp', async () => {
    Caption.step(2);
    Caption.set('SEO SIMPLE PACK（テーマ Arkhe と同じ LOOS 製）を導入：プラグイン › 新規プラグインを追加');
    await Browser.clickTab('wp');
    await hoverUi(WP.el('#menu-plugins > a'), { hold: 250 });
    WP.el('#menu-plugins').classList.add('opensub');
    await wait(250);
    await clickUi(WP.el('#menu-plugins .wp-submenu a[href="plugin-install.php"]'), { kind: 'hand', after: 60 });
    WP.el('#menu-plugins').classList.remove('opensub');
    await wpScreen('plugin-add', { ms: 700 });
    await wpType('psearch', [{ direct: 'SEO SIMPLE PACK' }], { kps: 13 });
    KeyStrip.special('Enter');
    KeyStrip.idleHide(700);
    await wpScreen('plugin-search', { loading: false, after: 500 });
    const card = WP.el('.plugin-card-seo-simple-pack');
    await hoverUi(card.querySelector('.name, h3') || card, { hold: 900 });
    await clickUi(card.querySelector('.install-now'), { kind: 'hand', after: 60 });
    await wait(1300);
    await wpScreen('plugin-installed', { loading: false, after: 300 });
    await clickUi(WP.el('.plugin-card-seo-simple-pack .activate-now'), { kind: 'hand', after: 60 });
    await wpScreen('plugin-activated', { ms: 900 });
    Issue.ok(R('#toplevel_page_ssp_main_setting', 2), 'SEO PACK');
    await wait(2000);
    Issue.hide();
    // 一般設定 › 基本設定
    await clickUi(WP.el('#toplevel_page_ssp_main_setting > a'), { kind: 'hand', after: 60 });
    await wpScreen('ssp-basic');
    Caption.set('一般設定：区切り文字は「|」、トップページの title は「サイト名 | キャッチフレーズ」（%_site_title_% %_sep_% %_tagline_%）');
    const sep = WP.els('.ssp-field').find((e) => /区切り文字/.test(e.textContent));
    if (sep) await hoverUi(sep.querySelector('.ssp-field__body') || sep, { ax: 0.1, hold: 900 });
    const preview = WP.els('.ssp-field__preview').find((e) => /三鷹で肩こり/.test(e.textContent)) || WP.el('.ssp-field__preview');
    if (preview) { Issue.ok(R(preview, 3), 'カイロライン三鷹整体院 | 三鷹で肩こり・腰痛…'); await wait(2700); Issue.hide(); }
    await WP.scroll(WP.field('homeDesc'), 800);
    Caption.set('トップページのディスクリプション：メモの文言（院長確認済み）をコピーして貼り付け');
    await Win.switchTo('code');
    await copyLine(Code.find('三鷹で肩こり・腰痛・猫背の改善なら').line);
    await Win.switchTo('browser');
    await boxPaste('homeDesc', F.HOME_DESC);
    await wait(500);
    await clickUi(findCapture(/設定を保存/), { kind: 'hand', after: 60 });
    await wpScreen('ssp-basic-saved', { ms: 800 });
    const notice = WP.el('.notice-success, .updated, .notice');
    if (notice) { Issue.ok(R(notice, 2), '設定を保存'); await wait(2000); Issue.hide(); }
    // Googleアナリティクス (GA4)
    Caption.set('Googleアナリティクス：GA4 の測定 ID を設定（SEO SIMPLE PACK が gtag.js を出力）');
    await clickUi(textEl('a, button', /^Googleアナリティクス$/), { kind: 'hand', after: 60 });
    await wpScreen('ssp-ga', { loading: false, after: 400 });
    await wpType('gaId', [{ direct: 'G-6P09HMHJE9' }], { kps: 11 });
    await clickUi(findCapture(/設定を保存/), { kind: 'hand', after: 60 });
    await wpScreen('ssp-ga-saved', { ms: 800 });
    await wait(600);
    // the source again
    await Browser.clickTab('src');
    await reloadSource(SRC.homeAfter());
    const a = srcLine(/<!-- SEO SIMPLE PACK/), b = srcLine(/<!-- \/ SEO SIMPLE PACK -->/);
    await VSRC.scrollTo(Math.max(0, a - 10), 800);
    Caption.set('ページのソース：SEO SIMPLE PACK の出力（description・canonical・OGP・GA4）');
    Issue.ok(VSRC.rect(a, b), 'SEO SIMPLE PACK');
    await wait(3500);
    Issue.hide();
    await VSRC.scrollTo(0, 600);
    Issue.ok(VSRC.rect(srcLine(/<title>/)), 'title：カイロライン三鷹整体院 | 三鷹で…');
    await wait(2600);
    Issue.hide();
  });

  /* 3 — noindex on the post type archives, the 料金情報 page */
  scene('pages', async () => {
    Caption.step(3);
    Caption.set('ほかのページも確認：患者さんの声（/voice/）のソース');
    await Browser.typeUrl('view-source:chiroline-mitakain.com/voice/');
    Browser.nav('src', { title: 'view-source:' + LIVE + '/voice/', url: 'view-source:' + LIVE + '/voice/' });
    Browser.loading('src', true);
    await wait(400);
    VSRC.show('voice', SRC.voiceNoindex());
    Browser.loading('src', false);
    await wait(500);
    const rl = srcLine(/<meta name="robots" content="noindex">/);
    Caption.issue('noindex', '患者さんの声・症例一覧の一覧ページに noindex：このままでは検索結果に出なくなる');
    Issue.show(VSRC.rect(rl), 'noindex');
    await wait(3900);
    Issue.hide();
    Caption.issue('原因', 'SEO SIMPLE PACK の初期設定：「カスタム投稿タイプ」のアーカイブページをインデックスさせない＝オン');
    await Browser.clickTab('wp');
    await clickUi(textEl('a, button', /^その他アーカイブ$/), { kind: 'hand', after: 60 });
    await wpScreen('ssp-archive', { loading: false, after: 300 });
    const cb = WP.el('#pt_archive_noindex');
    const row = cb && (cb.closest('.ssp-field') || cb.closest('tr') || cb.parentElement);
    await WP.scroll(row, 700);
    Issue.show(R(row, 4), 'インデックスさせない：オン');
    await wait(3200);
    Issue.hide();
    await clickUi(cb.nextElementSibling && cb.nextElementSibling.tagName === 'LABEL' ? cb.nextElementSibling : (cb.closest('label') || cb), { kind: 'hand', after: 60 });
    await wpScreen('ssp-archive-off', { loading: false, after: 400 });
    await clickUi(findCapture(/設定を保存/), { kind: 'hand', after: 60 });
    await wpScreen('ssp-archive-saved', { ms: 800 });
    await wait(500);
    await Browser.clickTab('src');
    await reloadSource(SRC.voiceAfter());
    Caption.fixed('/voice/・/symptoms/ の noindex が外れた（SEO SIMPLE PACK の robots タグが出なくなった）');
    const sb = srcLine(/<!-- SEO SIMPLE PACK/);
    Issue.ok(VSRC.rect(sb, sb + 2), 'noindex なし');
    await wait(3100);
    Issue.hide();
    // 料金情報: the meta box
    Caption.set('料金情報：このページだけのディスクリプションを、エディター下の「SEO SIMPLE PACK 設定」で');
    await Browser.clickTab('wp');
    await clickUi(WP.el('#menu-pages > a'), { kind: 'hand', after: 60 });
    await wpScreen('pages');
    const tr = WP.el(`#post-${WP.data.ids.pages.price}`);
    await clickUi(tr.querySelector('.row-title'), { kind: 'hand', after: 60 });
    await wpScreen('edit-price', { ms: 1000 });
    const toggle = WP.els('button, [role="button"]').find((b) => /メタボックス/.test(b.textContent + (b.getAttribute('aria-label') || '')));
    if (toggle) await clickUi(toggle, { kind: 'hand', after: 60 });
    await wpScreen('edit-price-meta', { loading: false, after: 400 });
    await wpType('pageDesc', JA.PRICE, { kps: 13, ax: 0.05, ay: 0.25 });
    await clickUi(WP.el('.editor-post-publish-button, .editor-header__settings .is-primary'), { kind: 'hand', after: 60 });
    await wpScreen('edit-price-saved', { loading: false, after: 300 });
    const snack = WP.el('.components-snackbar');
    if (snack) { Issue.ok(R(snack, 3), '固定ページを更新'); await wait(2200); Issue.hide(); }
    Caption.set('アクセス・コラムなど主要な固定ページも、それぞれの内容に合わせたディスクリプションを設定');
    await wait(3000);
  });

  /* 4 — JSON-LD in the child theme */
  scene('jsonld', async () => {
    Caption.step(4);
    Caption.set('構造化データ（JSON-LD）：子テーマに inc/structured-data.php を追加し functions.php で読み込む');
    await Win.switchTo('code');
    await Code.openFile(T + 'functions.php', { top: 0 });
    const at = Code.find("require_once __DIR__ . '/inc/post-types.php';").line;
    await Code.newLineAfter(at);
    await Code.type([{ key: 'Enter' }, { direct: F.FN_REQUIRE }], { kps: 26 });
    await Code.save();
    check(T + 'functions.php', P[T + 'functions.php'], 'functions.php');
    await Code.newFile(T + 'inc/structured-data.php');
    Code.files[T + 'inc/structured-data.php'].indent = '\t';   // WordPress coding standards: tabs
    $('#vsIndent').textContent = 'タブのサイズ: 4';
    // the skeleton pasted (the hooks, the front page's WebSite, the output); the Article typed
    const el = F.SD_HEAD.findIndex((l) => /elseif \( is_singular/.test(l));
    await Code.paste([...F.SD_HEAD.slice(0, el + 1), ...F.SD_TAIL].join('\n'));
    await wait(400);
    Caption.set('トップページは WebSite（サイト内検索）。フックと出力の部分まで貼り付け');
    const ws = Code.find('"@type": "WebSite"').line;
    Issue.ok(linesRect(ws - 2, ws + 7, 640), 'WebSite');
    await wait(3000);
    Issue.hide();
    Caption.set('投稿・固定ページは Article：見出し・画像・公開日・更新日・著者・発行者、description は SEO SIMPLE PACK と同じもの');
    const elLine = Code.find('} elseif ( is_singular').line;
    await Code.reveal(elLine, 500);
    await Code.newLineAfter(elLine);
    await Code.type([{ key: 'Enter' }, ...tabScript(F.SD_HEAD.slice(el + 1), F.SD_HEAD[el])], { kps: 38 });
    const art = Code.find('"@type": "Article"').line;
    const endArt = Code.find("\t}';", art).line;
    await Code.scrollTo(Math.max(0, art - 5), 500);
    Issue.ok(linesRect(art - 2, endArt, 760), 'Article');
    await wait(2700);
    Issue.hide();
    // the category's BreadcrumbList (typed; the typo: "]," at the end of itemListElement)
    Caption.set('投稿にはカテゴリーのパンくず（BreadcrumbList）：URL は get_category_link() で取得');
    await Code.reveal(endArt, 500);
    const crumb = F.SD_CRUMB.map((l, i) => (i === F.SD_TYPO_LINE ? l + ',' : l));
    await Code.type([{ key: 'Enter' }, ...tabScript(crumb, F.SD_HEAD[F.SD_HEAD.length - 1])], { kps: 30 });
    await Code.save();
    mark('typo');
    // the local site: the page source, then the JSON-LD read by Chrome's own JSON parser (DevTools console)
    Caption.set('ローカル（wp-env）の記事ページで出力を確認');
    await Win.switchTo('browser');
    await Browser.newTab('dev');
    await pasteUrl('localhost:8888/column/' + POST_SLUG + '/');
    Browser.nav('dev', { title: TITLE.post, url: DEV + '/column/' + POST_SLUG + '/', page: 'store', fav: 'store' });
    Browser.loading('dev', true);
    await Store.load('post');
    Browser.loading('dev', false);
    await wait(800);
    await viewSource('devsrc', DEV + '/column/' + POST_SLUG + '/', SRC.postDev(true), { name: 'dev' });
    Browser.nav('devsrc', { title: 'view-source:' + DEV + '/column/' + encodeURIComponent(POST_SLUG).toLowerCase() + '/' });
    const d0 = srcLine(/application\/ld\+json/);
    await VSRC.scrollTo(Math.max(0, d0 - 6), 1100);
    Caption.set('</body> の直前に JSON-LD が出力された。見た目では誤りに気づきにくいので、ブラウザの JSON パーサーで確認');
    Issue.show(VSRC.rect(d0, VSRC.lines.length - 3, 1300), 'JSON-LD');
    await wait(3500);
    Issue.hide();
    await Browser.clickTab('dev');
    Caption.set('DevTools のコンソールで JSON.parse()：JSON-LD がそのまま読めるか');
    await CON.open();
    await CON.run();
    CON.answer(SRC.postDev(true));
    Caption.issue('構文エラー', 'JSON として読めない（line 32 column 2）：BreadcrumbList の配列のあとに余分な「,」');
    Issue.show(CON.lastRect(), 'SyntaxError');
    await wait(4300);
    Issue.hide();
    // the fix
    Caption.set('修正：itemListElement の配列のあとの「,」を削除して保存 → 再読み込みして、もう一度 JSON.parse()');
    await Win.switchTo('code');
    const typo = Code.find('}}],').line;
    await Code.reveal(typo, 500);
    const cf = Code.files[Code.active];
    await Code.clickAt(typo, cf.lines[typo].length);
    await wait(300);
    // Backspace: the "," before the caret (kit's typing only takes back text it typed itself — this is one key on the line)
    KeyStrip.special('Backspace');
    cf.lines[typo] = cf.lines[typo].slice(0, -1);
    if (!cf.dirty) { cf.dirty = true; Code.renderTabs(); }
    Code.setCaret(typo, cf.lines[typo].length);
    KeyStrip.idleHide(700);
    await wait(400);
    await Code.save();
    check(T + 'inc/structured-data.php', P[T + 'inc/structured-data.php'], 'structured-data.php');
    await Win.switchTo('browser');
    await Browser.reload(async () => { K.DevTools.clear(); CON.fix(); await Store.load('post'); }, { key: 'F5' });
    await CON.run({ history: true });
    CON.answer(SRC.postDev(false), { open: true });
    Caption.fixed('JSON-LD が読めた：Article と BreadcrumbList の 2 件（エラーなし）');
    Issue.ok(CON.lastRect(), 'Article・BreadcrumbList');
    await wait(3900);
    Issue.hide();
    await CON.close();
    // to the server
    Caption.set('本番へ反映：git にコミットし、子テーマのファイルをサーバーへアップロード');
    await Win.switchTo('code');
    await Code.panel(true);
    await Term.run('git add -A; git commit -m "構造化データ（JSON-LD）を追加"', [
      '[main 4c1e9a2] 構造化データ（JSON-LD）を追加',
      ' 2 files changed, 91 insertions(+)',
      ' create mode 100644 arkhe_child/inc/structured-data.php',
    ], { kps: 22 });
    await Term.run('scp -r .\\arkhe_child\\functions.php .\\arkhe_child\\inc chiroline:~/chiroline-mitakain.com/public_html/wp-content/themes/arkhe_child/', [
      'functions.php                                 100%  712    35.6KB/s   00:00',
      'post-types.php                                100% 1186    61.2KB/s   00:00',
      'structured-data.php                           100% 3121   160.4KB/s   00:00',
    ], { kps: 30 });
    await wait(600);
  });

  /** typing script for tab-indented lines (PHP, WordPress coding standards): Enter + the editor's auto-indent, corrected */
  function tabScript(lines, after) {
    const out = [];
    let prev = after;
    lines.forEach((line, i) => {
      const tabs = line.match(/^\t*/)[0].length, body = line.slice(tabs);
      if (i > 0) out.push({ key: 'Enter' });
      const auto = K.indentAfter(i === 0 ? prev : lines[i - 1], '\t').match(/^\t*/)[0].length;
      if (i === 0 && auto !== tabs) { /* the first line: Enter above made the indentation */ }
      if (auto > tabs) out.push({ key: 'Backspace', n: auto - tabs });
      else if (auto < tabs) out.push({ direct: '\t'.repeat(tabs - auto) });
      if (body) out.push({ direct: body });
      prev = line;
    });
    return out;
  }

  /* 5 — categories, the breadcrumb */
  scene('cats', async () => {
    Caption.step(5);
    Caption.set('投稿 › カテゴリー：スラッグが日本語のまま（URL が /column/category/%e3%82%bb… と長い）、説明も空');
    await Win.switchTo('browser');
    await Browser.clickTab('wp');
    await hoverUi(WP.el('#menu-posts > a'), { hold: 250 });
    WP.el('#menu-posts').classList.add('opensub');
    await wait(250);
    await clickUi(WP.el('#menu-posts .wp-submenu a[href="edit-tags.php?taxonomy=category"]'), { kind: 'hand', after: 60 });
    WP.el('#menu-posts').classList.remove('opensub');
    await wpScreen('cats');
    const slugCol = WP.els('td.slug, .column-slug').slice(0, 7);
    if (slugCol.length) { Issue.show(R(() => slugCol[0].closest('table'), 2), 'スラッグ・説明'); await wait(3200); Issue.hide(); }
    const link = WP.els('a.row-title').find((a) => /セルフケア/.test(a.textContent));
    await clickUi(link, { kind: 'hand', after: 60 });
    await wpScreen('cat-edit');
    Caption.set('カテゴリーの編集：英語のスラッグ self-care、説明文はカテゴリーページの description にもなる');
    await wpType('slug', [{ direct: 'self-care' }], { selectAll: true, kps: 11 });
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile('docs/seo-memo.md', { top: 6 });
    await copyLine(Code.find('肩こりや腰痛、猫背などのつらい症状を').line);
    await Win.switchTo('browser');
    await boxPaste('catDesc', F.CAT_DESC, { ay: 0.2 });
    await WP.scroll(WP.el('#edittag input[type="submit"], #edittag .button-primary'), 600);
    await clickUi(WP.el('#edittag input[type="submit"], #edittag .button-primary'), { kind: 'hand', after: 60 });
    await wpScreen('cat-saved', { ms: 700 });
    const msg = WP.el('#message, .notice-success, .updated');
    if (msg) { Issue.ok(R(msg, 2), 'カテゴリーを更新'); await wait(2000); Issue.hide(); }
    Caption.set('ほかの 6 つのカテゴリーも、メモどおりのスラッグと説明文に');
    await clickUi(WP.el('#menu-posts .wp-submenu a[href="edit-tags.php?taxonomy=category"]') || WP.el('#menu-posts > a'), { kind: 'hand', after: 60 });
    await wpScreen('cats-done');
    Issue.ok(R(() => WP.els('table.wp-list-table')[0], 2), '英語のスラッグ・説明文');
    await wait(3000);
    Issue.hide();
    // the category page, the breadcrumb of a post (the site frame showed the local page: the live tab's page first)
    await Store.load('home');
    await Browser.clickTab('live');
    await Browser.typeUrl('chiroline-mitakain.com/column/category/self-care/');
    await livePage('category', LIVE + '/column/category/self-care/', TITLE.category);
    Caption.set('カテゴリーページ：短く読める URL。説明文はページの冒頭と検索結果のディスクリプションに');
    const desc = Store.doc.querySelector('.p-archive__desc');
    if (desc) { Issue.ok(R(desc, 4), 'カテゴリーの説明'); await wait(2700); Issue.hide(); }
    // its source: the description as SEO SIMPLE PACK outputs it (%_term_description_%)
    await viewSource('src3', LIVE + '/column/category/self-care/', SRC.categoryLive(), { name: 'category' });
    const md = srcLine(/<meta name="description"/);
    Caption.set('ソースでも：カテゴリーの説明文がそのまま meta description（SEO SIMPLE PACK の %_term_description_%）');
    Issue.ok(VSRC.rect(md, md, 1500), 'description');
    await wait(3600);
    Issue.hide();
    await Browser.clickTab('live');
    const card =[...Store.doc.querySelectorAll('.p-postList__link')].find((x) => /なぜあなたの腰痛/.test(x.textContent));
    if (card) {
      await Store.scrollToEl(card, 260, 900);
      await clickUi(card, { kind: 'hand', after: 60 });
    }
    await livePage('post', LIVE + '/column/' + POST_SLUG + '/', TITLE.post);
    Caption.set('記事のパンくず（ホーム › カテゴリー）：同じカテゴリーの記事一覧への内部リンク。BreadcrumbList と同じリンク先');
    const bc = Store.doc.querySelector('.p-breadcrumb');
    if (bc) { Issue.ok(SR('.p-breadcrumb__list, .p-breadcrumb', 3), 'パンくず'); await wait(3100); Issue.hide(); }
    await Store.scroll(700, 1300);
    await wait(900);
  });

  /* 6 — the live pages */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('本番の記事ページのソース：JSON-LD（Article・BreadcrumbList）が出力されている');
    await Store.scroll(0, 600);
    await viewSource('src2', LIVE + '/column/' + POST_SLUG + '/', SRC.postLive(), { name: 'post' });
    Browser.nav('src2', { title: 'view-source:' + LIVE + '/column/' + encodeURIComponent(POST_SLUG).toLowerCase() + '/' });
    const l0 = srcLine(/application\/ld\+json/);
    await VSRC.scrollTo(Math.max(0, l0 - 6), 1200);
    Issue.ok(VSRC.rect(l0, VSRC.lines.length - 3, 1300), 'JSON-LD');
    await wait(3200);
    Issue.hide();
    // the console on the live page
    await Browser.clickTab('live');
    Caption.set('本番の記事ページでもコンソールで JSON.parse()：Article・BreadcrumbList の 2 件がエラーなく読める');
    await CON.open();
    await CON.run();
    CON.answer(SRC.postLive(), { open: true });
    mark('live');
    Issue.ok(CON.lastRect(), '本番の JSON-LD');
    await wait(3800);
    Issue.hide();
    await CON.close();
    // the top page
    await Browser.typeUrl('chiroline-mitakain.com');
    await livePage('home', LIVE + '/', TITLE.home);
    Caption.set('SEO SIMPLE PACK のメタタグ・GA4、ページごとのディスクリプション、構造化データ、カテゴリーの整理');
    await hoverUi(Store.doc.querySelector('.cl-header, header'), { ax: 0.4, hold: 2000 });
    await wait(4700);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'post', 'category'],
    fontText: JSON.stringify(JA) + F.HOME_DESC + F.CAT_DESC + F.PRICE_DESC + Object.values(TITLE).join('') + POST_SLUG,
    async prepare() {
      const tree = [
        ['arkhe_child', 'dir', 1], [T + 'css', 'dir', 0], [T + 'css/style.css'], [T + 'images', 'dir', 0], [T + 'inc', 'dir', 1], [T + 'inc/post-types.php'],
        [T + 'functions.php'], [T + 'style.css'], ['docs', 'dir', 1], ['docs/seo-memo.md'], ['.gitignore'], ['.wp-env.json'], ['package.json'], ['README.md'],
      ];
      const files = { ...P, [T + 'functions.php']: F.FN_BEFORE };
      delete files[T + 'inc/structured-data.php'];
      Code.init(files, tree);
      Object.values(Code.files).forEach((f) => { if (/\.php$/.test(f.path)) f.indent = '\t'; });
      Code.show('docs/seo-memo.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: TITLE.home, url: LIVE + '/', page: 'store', fav: 'store' });
      Browser.addTab({ id: 'wp', title: 'ダッシュボード ‹ カイロライン三鷹整体院 — WordPress', url: LIVE + '/wp-admin/', page: 'wp', fav: 'wp' }, { activate: false });
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      await WP.show('dashboard');
      await Store.load('home');
      Browser.activate('live');
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
