/*
 * Timeline: the December campaign's landing page for Stand by Beauty Clinic (stand-by.jp) —
 * the brief and the flow (the live site: the top banner → the October LP) → the price list (a script from the price
 * sheet; mistake 1: the fixed special prices) → the LP in WordPress (Duplicate Post → the block editor: title, banner,
 * featured image, period, details, prices → 公開) → the way in from the top (a second banner in front-page.php, scp,
 * WP Super Cache; mistake 2: the Japanese slug made from the title → 404) → the fixed reservation buttons (footer.php,
 * 追加 CSS in the Customizer; mistake 3: shown on PC too) → the smartphone and the live pages.
 * Every WordPress screen is the real wp-admin (js/wp-snapshot.js, tools/snapshots/wp-stand-by-lp/capture-wp.js); the
 * site is the live stand-by.jp (js/site-snapshot.js), with the states before the work applied (js/apps.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP, LP = window.LP;
  const { $, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, frameTextTarget } = D;
  const { clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, FileDialog } = K;
  const P = F.files;
  const LIVE = 'https://stand-by.jp';
  const THEME_DIR = '~/stand-by.jp/public_html/wp/wp-content/themes/stand_by_beauty_clinic/';
  const decode = (s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };
  const titleOf = (k) => decode((S.pages[k].pc.match(/<title>([^<]*)<\/title>/) || [])[1] || S.title);
  const TITLE = { home: titleOf('home'), lp: titleOf('lp'), prev: titleOf('prev'), notfound: titleOf('notfound') };
  const AUTO_SLUG = decodeURIComponent(WP.data.autoSlug);   // the slug WordPress made from the title
  const BRIEF_P = 'docs/lp/campaign-202612.md';
  const FRONT = 'lp';   // the site's tab from scene 3 on (opened by 「固定ページを表示」)

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '導線': { r: 'dousen', segs: ['導線'] },
    'トップのバナーを2つ並べる：': { r: 'toppunobana-wo2tunaraberu:', segs: ['トップの', 'バナーを', '2つ', '並べる：'] },
    'スマホの固定ボタンを新しく（': { r: 'sumahonokoteibotanwoatarasiku(', segs: ['スマホの', '固定ボタンを', '新しく（'] },
    '予約・': { r: 'yoyaku/', segs: ['予約・'] },
    '）': { r: ')', segs: ['）'] },
    '定価（': { r: 'teika(', segs: ['定価（'] },
    '〜）から': { r: '~)kara', segs: ['〜）から'] },
    'の料金表を作る：30％オフ、': { r: 'noryoukinhyouwotukuru:30%ofu,', segs: ['の', '料金表を', '作る：', '30％', 'オフ、'] },
    'は40％オフ': { r: 'ha40%ofu', segs: ['は', '40％', 'オフ'] },
    '¥': { direct: '¥' },
    '、18歳以下': { r: ',18saiika', segs: ['、', '18歳以下'] },
    '・': { r: '/', segs: ['・'] },
    '⇒': { r: 'yajirusi', segs: ['⇒'] },
    '予約': { r: 'yoyaku', segs: ['予約'] },
    '時間受付': { r: 'jikanuketuke', segs: ['時間', '受付'] },
    'から無料相談・予約': { r: 'karamuryousoudan/yoyaku', segs: ['から', '無料相談・', '予約'] },
    '版（画面幅': { r: 'ban(gamenhaba', segs: ['版（', '画面幅'] },
    '以上）ではフッター固定ボタンを非表示にする': { r: 'ijou)dehafutta-koteibotanwohihyoujinisuru', segs: ['以上）では', 'フッター', '固定ボタンを', '非表示に', 'する'] },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);
  /** the page title and the period, typed into the block editor */
  const TITLE_SCRIPT = [
    { r: 'atarasiijibundesinnnenwomukaeru!', segs: ['新しい', '自分で', '新年を', '迎える！'] },
    { direct: '12-1' },
    { r: 'gatugenteikyanpe-nwokaisaiitasimasu.', segs: ['月限定', 'キャンペーンを', '開催', 'いたします。'] },
  ];
  const PERIOD_SCRIPT = [
    { direct: '12' },
    { r: 'gatu1niti(ka)~', segs: ['月1日', '（火）', '〜'] },
    { direct: '1' },
    { r: 'gatu31niti(niti)nosejutu', segs: ['月31日', '（日）', 'の施術'] },
  ];

  /* ------------------------------------------------------------- helpers */
  const wpRect = (sel) => () => { const e = typeof sel === 'string' ? WP.el(sel) : sel; return e ? screenRect(e) : null; };
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const byText = (sel, re, key) => WP.els(sel, key).find((e) => re.test(e.textContent));
  /** the WordPress screen on show in each WordPress tab (the tabs share the browser's WordPress page) */
  const tabKey = {};
  async function wpScreen(key, o = {}) {
    const tab = o.tab || 'wp';
    if (o.loading !== false) { Browser.loading(tab, true); await wait(o.ms || 450); }
    await LP.wp(key, { ...o, tab });
    tabKey[tab] = key;
    Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 250);
  }
  async function toTab(id) {
    await Browser.clickTab(id);
    if (tabKey[id]) await LP.wp(tabKey[id], { tab: id });
  }
  /** a page of the live site in a browser tab */
  async function site(tab, page, url, o = {}) {
    Browser.nav(tab, { title: o.title || TITLE[page], url, page: 'store', fav: 'store' });
    Browser.loading(tab, true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 450);
    return Store.doc;
  }
  /** types into a captured text box (data-demo-input) */
  async function wpType(name, script, o = {}) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 60 });
    WP.focus(box, true);
    if (o.select) { box.innerHTML = `<span style="background:#b4d5fe">${D.esc(box.textContent)}</span>`; await Keycap.show(['Ctrl', 'A'], 450); }
    if (o.clear !== false) box.textContent = '';
    const t = await typeInto(WP.typeInto(name, undefined, { base: '' }), script, { kps: o.kps || 12 });
    if (o.blur !== false) WP.blur(name);
    return t;
  }
  async function wpPassword(name, text) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.12, after: 60 });
    WP.focus(box, true);
    await D.Ime.setMode(false);
    let v = '';
    for (const ch of text) {
      KeyStrip.key('●');
      v += ch;
      box.innerHTML = '•'.repeat(v.length) + '<span class="demo-caret"></span>';
      await D.kw(1000 / 11 * (0.55 + Math.random() * 0.9));
    }
    KeyStrip.idleHide(700);
    WP.blur(name);
  }
  /** a hidden admin flyout opened by the pointer (WordPress' own menu script does this on hover) */
  async function adminMenu(id, href) {
    const li = WP.el(`#${id}`);
    await hoverUi(WP.el(`#${id} > a`), { hold: 200 });
    li.classList.add('opensub');
    await wait(250);
    await clickUi(WP.el(`#${id} .wp-submenu a[href$="${href}"]`), { kind: 'hand', after: 80 });
    li.classList.remove('opensub');
  }
  /** a block of the editor's canvas: click into it, its text selected (triple click) */
  async function selectBlockText(el) {
    await clickUi(el, { kind: 'text', ax: 0.3, after: 60, dbl: true });
    LP.selectText(el, true);
    await wait(250);
  }
  const ampm = (d) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
  const scpOut = (file, kb, rate) => `${file}${' '.repeat(Math.max(2, 74 - file.length))}100%   ${kb}KB ${rate}KB/s   00:00`;

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the brief, the current site, the flow */
  scene('plan', async () => {
    Caption.step(1);
    Caption.set('クリニックからの依頼：12-1月限定キャンペーンの LP（ランディングページ）を作る');
    await Code.openFile(BRIEF_P, { top: 0 });
    await hoverUi(Code.lineEl(Code.find('- タイトル').line), { ax: 0.35, hold: 1300 });
    await hoverUi(Code.lineEl(Code.find('- 対象期間').line), { ax: 0.3, hold: 900 });
    await hoverUi(Code.lineEl(Code.find('- 次世代型糸リフト').line), { ax: 0.4, hold: 1300 });
    await hoverUi(Code.lineEl(Code.find('- ページは前回').line), { ax: 0.3, hold: 1000 });
    // the live site: the top banner → the October LP
    Caption.set('今のサイトを確認：トップのキャンペーンバナーから前回の LP（/campaign_2）へ');
    await Win.switchTo('browser');
    const banner = Store.doc.querySelector('.campaign-container a');
    await Store.scrollToEl(banner, 260, 1300);
    await hoverUi(banner, { kind: 'hand', hold: 700 });
    await clickUi(banner, { kind: 'hand', after: 60 });
    await site('site', 'prev', LIVE + '/campaign_2', { states: ['oldCta'] });
    Caption.set('前回の LP の構成：タイトル → バナー → 対象期間 → 詳細 → 施術内容一覧 → ご予約はこちら');
    await Store.scroll(420, 1300);
    await wait(700);
    await Store.scrollToEl([...Store.doc.querySelectorAll('.postWrap h2')].find((h) => /対象期間/.test(h.textContent)), 160, 1100);
    await wait(900);
    await Store.scrollToEl([...Store.doc.querySelectorAll('.postWrap h2')].find((h) => /施術内容一覧/.test(h.textContent)), 140, 1500);
    await wait(700);
    await Store.scrollToEl(Store.doc.querySelector('#reservationWrap'), 160, 1600);
    await wait(900);
    await Store.scroll(0, 900);
    // the flow, in the brief
    Caption.set('導線をメモ：トップにバナーを 2 つ並べて LP へ、スマホは画面下の固定ボタンから予約');
    await Win.switchTo('code');
    await Code.lineAfter('皆様のご来院', code(F.FLOW, { after: '' }), { kps: 16 });
    await Code.save();
    await wait(400);
  });

  /* 2 — the price list (mistake 1: the fixed special prices) */
  scene('price', async () => {
    Caption.step(2);
    Caption.set('料金表の元データ（data/price-202612.csv）：12/1 からの定価・区分・特別価格');
    await Code.openFile('data/price-202612.csv', { top: 0 });
    await hoverUi(Code.lineEl(0), { ax: 0.15, hold: 1000 });
    await hoverUi(Code.lineEl(Code.find('ボラックス').line), { ax: 0.55, hold: 1100 });
    Caption.set('定価から LP の料金表（Markdown）を作るスクリプト：30％オフ、18歳以下は40％オフ');
    await Code.newFile('scripts/campaign-price.mjs');
    await Code.type(code(F.PRICE_SCRIPT), { kps: 30 });
    await Code.save({ status: 'U' });
    check('scripts/campaign-price.mjs', F.PRICE_SCRIPT.join('\n'), 'campaign-price.mjs');
    await Code.panel(true);
    const out = (ok) => F.priceMd(ok).trim().split('\n').map(D.esc);
    await Term.run('node scripts/campaign-price.mjs', out(false), { gap: 22 });
    await wait(500);
    // the special prices of the brief vs the output
    Caption.set('依頼内容と見比べる');
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile(BRIEF_P, { top: 0 });
    const sp = Code.find('次世代型糸リフト').line;
    Issue.ok(linesRect(sp, sp, 760), '依頼：糸リフト ¥10,000～・鼻 ¥18,000～（特別価格）');
    await wait(1600);
    Issue.hide();
    Code.addFile('out/lp-price-202612.md', F.priceMd(false).replace(/\n$/, ''));
    await Code.openFile('out/lp-price-202612.md', { top: 40 });
    const ito = Code.find('ヴィーナスリフト:PDO').line + 1;
    Caption.issue('計算ミス', '特別価格の施術まで 30％オフで計算（糸リフトが ¥10,500：依頼は ¥10,000）');
    Issue.show(linesRect(ito, ito, 520), '¥10,500（特別価格 ¥10,000 のはず）');
    await wait(2600);
    Issue.hide();
    // the fix: the special price column wins
    Caption.set('特別価格の列があればその金額を使う');
    await Code.openFile('scripts/campaign-price.mjs');
    const at = Code.find('const camp = price * 0.7;');
    await Code.overwrite('price * 0.7;', [{ direct: 'special ? Number(special) : price * 0.7;' }], { from: at.line, kps: 22 });
    await Code.save();
    check('scripts/campaign-price.mjs', [...F.PRICE_SCRIPT.slice(0, 8), F.PRICE_FIX, ...F.PRICE_SCRIPT.slice(9)].join('\n'), 'campaign-price fix');
    await Code.panel(true);
    Term.clear();
    await Term.run('node scripts/campaign-price.mjs', out(true), { gap: 18 });
    Code.setText('out/lp-price-202612.md', F.priceMd(true).replace(/\n$/, ''));
    await Code.panel(false);
    await Code.openFile('out/lp-price-202612.md', { top: 40 });
    const ok = Code.find('ヴィーナスリフト:PDO').line + 1;
    Caption.fixed('特別価格の施術は ¥10,000・¥18,000・¥42,000 に。ほかは 30％オフ');
    Issue.ok(linesRect(ok, ok + 7, 520), '特別価格');
    await wait(2200);
    Issue.hide();
  });

  /* 3 — the LP in WordPress */
  scene('lp', async () => {
    Caption.step(3);
    window.Win11.skipTo('13:46');
    Caption.set('WordPress の管理画面にログイン（stand-by.jp/wp/wp-admin）');
    await Win.switchTo('browser');
    await Browser.newTab('wp');
    await Browser.typeUrl('stand-by.jp/wp/wp-admin/');
    await wpScreen('login', { ms: 600 });
    await wpType('user', [{ direct: 'admin' }], { kps: 10 });
    await wpPassword('pass', 'xxxxxxxxxxxxxx');
    await clickUi(WP.el('#wp-submit'), { kind: 'hand', after: 60 });
    await wpScreen('dashboard', { ms: 800 });
    await wait(500);
    // 固定ページ › the October LP › 新規下書き (Duplicate Post)
    Caption.set('前回の LP を Duplicate Post の「新規下書き」で複製（ブロックの構成をそのまま使う）');
    await clickUi(WP.el('#menu-pages > a'), { kind: 'hand', after: 60 });
    await wpScreen('pages');
    const row = WP.el('#post-442');
    await hoverUi(row.querySelector('.row-title'), { hold: 500 });
    row.classList.add('demo-hover');
    const dup = [...row.querySelectorAll('.row-actions a')].find((a) => /新規下書き/.test(a.textContent));
    await hoverUi(dup, { kind: 'hand', hold: 500 });
    await clickUi(dup, { kind: 'hand', after: 60 });
    row.classList.remove('demo-hover');
    await wpScreen('ed-dup', { ms: 1100, after: 500 });
    // the title (typed over the old one)
    Caption.set('タイトルを入力');
    const title = WP.el('.editor-post-title__input');
    await clickUi(title, { kind: 'text', ax: 0.4, ay: 0.3, after: 60 });
    title.innerHTML = `<span style="background:#b4d7ff">${D.esc(title.textContent)}</span>`;
    await Keycap.show(['Ctrl', 'A'], 500);
    title.removeAttribute('data-rich-text-placeholder');
    await typeInto(frameTextTarget(title), TITLE_SCRIPT, { kps: 13 });
    // the banner: the image block → 置換 → アップロード
    Caption.set('バナーを差し替え：画像ブロックの「置換」→ アップロード（982×446 の PNG）');
    const img = WP.el('.wp-block-image img');
    await clickUi(img, { after: 60 });
    await LP.step('ed-imgsel');
    await wait(500);
    const rep = byText('.block-editor-block-toolbar button', /置換/);
    await clickUi(rep, { kind: 'hand', after: 60 });
    await LP.step('ed-replace');
    await wait(500);
    const up = byText('.block-editor-media-replace-flow__options [role="menuitem"], .block-editor-media-replace-flow__options button, .block-editor-media-replace-flow__options label', /アップロード/);
    await hoverUi(up, { kind: 'hand', hold: 300 });
    await clickUi(up, { kind: 'hand', after: 120 });
    await FileDialog.pick({
      folder: ['PC', 'ダウンロード'],
      files: [
        { name: F.BANNER, date: '2026/11/02 11:48', type: 'PNG ファイル', size: '547 KB' },
        { name: 'campaign_202612_sp.png', date: '2026/11/02 11:48', type: 'PNG ファイル', size: '412 KB' },
        { name: 'price_202612.pdf', date: '2026/10/30 18:05', type: 'Microsoft Edge PDF Document', size: '208 KB' },
      ],
      pick: F.BANNER,
    });
    Browser.loading('wp', true);
    await wait(900);
    Browser.loading('wp', false);
    await LP.step('ed-banner');
    tabKey.wp = 'ed-banner';
    await wait(700);
    // the featured image
    Caption.set('アイキャッチ画像も新しいバナーに：メディアライブラリから選択');
    const feat = WP.el('.editor-post-featured-image__preview');
    await hoverUi(feat, { kind: 'hand', hold: 400 });
    await clickUi(feat, { kind: 'hand', after: 60 });
    const modal = await LP.step('ed-feat-modal');
    const tile = modal.querySelector('.attachment[data-id="678"]');
    const side = modal.querySelector('.media-sidebar');
    tile.classList.remove('selected', 'details');
    if (side) side.style.visibility = 'hidden';
    await wait(500);
    await clickUi(tile, { after: 100 });
    tile.classList.add('selected', 'details');
    if (side) side.style.visibility = '';
    await wait(800);
    await clickUi(modal.querySelector('.media-button-select'), { kind: 'hand', after: 60 });
    await LP.step('ed-banner2');
    tabKey.wp = 'ed-banner2';
    await wait(500);
    // the period (typed)
    Caption.set('対象期間を入力');
    const period = [...LP.canvasDoc().querySelectorAll('p')].find((p) => p.textContent === F.OLD_PERIOD);
    await LP.canvasScroll(Math.max(0, period.getBoundingClientRect().top + LP.canvasWin().scrollY - 420), 700);
    await selectBlockText(period);
    await typeInto(frameTextTarget(period), PERIOD_SCRIPT, { kps: 13 });
    await wait(300);
    // the details: copied from the brief
    Caption.set('詳細の本文は依頼の文面をコピーして貼り付け');
    await Win.switchTo('code');
    await Code.openFile(BRIEF_P, { top: 12 });
    const d0 = Code.find('スタンドバイビューティークリニックは').line, d1 = Code.find('皆様のご来院').line;
    await Code.selectLines(d0, d1);
    await Keycap.show(['Ctrl', 'C'], 600);
    Code.setCaret(d1, 0);
    await Win.switchTo('browser');
    const det = [...LP.canvasDoc().querySelectorAll('p')].find((p) => /^スタンドバイビューティークリニックは/.test(p.textContent));
    await LP.canvasScroll(Math.max(0, det.getBoundingClientRect().top + LP.canvasWin().scrollY - 300), 900);
    await selectBlockText(det);
    await Keycap.show(['Ctrl', 'V'], 650);
    await LP.step('ed-details');
    await wait(900);
    // the prices: the script's output pasted over the old list (Markdown headings become heading blocks)
    Caption.set('料金表：スクリプトの出力（out/lp-price-202612.md）を古い料金の上に貼り付け');
    await Win.switchTo('code');
    await Code.openFile('out/lp-price-202612.md', { top: 0 });
    Code.selectAll();
    await Keycap.show(['Ctrl', 'A'], 450);
    await Keycap.show(['Ctrl', 'C'], 600);
    Code.clearSelectAll();
    await Win.switchTo('browser');
    const old = LP.blocks('ed-details', /^⚫人気目元施術/, /^(?!)/);
    await LP.canvasScroll(old[0].getBoundingClientRect().top + LP.canvasWin().scrollY - 160, 1100);
    await clickUi(old[0], { kind: 'text', ax: 0.1, after: 80 });
    await LP.canvasScroll(old[old.length - 1].getBoundingClientRect().top + LP.canvasWin().scrollY - 520, 1300);
    KeyStrip.special('Shift');
    await clickUi(old[old.length - 1], { kind: 'text', ax: 0.6, after: 60 });
    LP.select(old, true);
    await wait(600);
    await Keycap.show(['Ctrl', 'V'], 650);
    LP.select(old, false);
    const y = LP.canvasWin().scrollY;
    await LP.step('ed-final', { y });
    await LP.canvasScroll(Math.max(0, y - 900), 1400);
    await wait(500);
    const ito = [...LP.canvasDoc().querySelectorAll('p')].find((p) => /ヴィーナスリフト:PDO/.test(p.textContent));
    if (ito) { await LP.canvasScroll(ito.getBoundingClientRect().top + LP.canvasWin().scrollY - 360, 900); Issue.ok(() => screenRect(ito), '特別価格 ¥10,000', { below: true }); await wait(1400); Issue.hide(); }
    // 公開
    Caption.set('公開');
    await clickUi(WP.el('.editor-post-publish-panel__toggle'), { kind: 'hand', after: 60 });
    await LP.step('ed-prepub');
    await wait(600);
    const chk = WP.el('.editor-post-publish-panel__prepublish');
    if (chk) await hoverUi(chk, { ax: 0.5, ay: 0.3, hold: 1300 });
    await clickUi(WP.el('.editor-post-publish-panel .editor-post-publish-button'), { kind: 'hand', after: 60 });
    Browser.loading('wp', true);
    await wait(900);
    const pub = `今日 ${ampm(window.Win11.now())}`;
    for (const k of ['ed-slug', 'ed-updated']) { await WP.preload([k]); LP.setText(k, '今日 1:52 PM', pub); }
    await LP.step('ed-published');
    tabKey.wp = 'ed-published';
    Browser.loading('wp', false);
    await wait(1200);
    // the page
    const view = byText('.post-publish-panel__postpublish-buttons a, .post-publish-panel__postpublish a', /固定ページを表示/);
    await clickUi(view, { kind: 'hand', after: 80 });
    Browser.addTab({ id: 'lp', title: TITLE.lp, url: '', page: 'store', fav: 'blank' }, { anim: true });
    await site('lp', 'lp', `${LIVE}/${AUTO_SLUG}/`, { states: ['oldCta'], after: 700 });
    Caption.set('LP が公開された：タイトル・バナー・対象期間・詳細・施術内容一覧');
    await Store.scroll(500, 1500);
    await wait(500);
    const head = [...Store.doc.querySelectorAll('.postWrap h2')].find((h) => /施術内容一覧/.test(h.textContent));
    await Store.scrollToEl(head, 120, 1500);
    await wait(1200);
    await Store.scroll(0, 900);
  });

  /* 4 — the way in from the top page (mistake 2: the slug) */
  scene('link', async () => {
    Caption.step(4);
    window.Win11.skipTo('14:02');
    Caption.set('トップページ（front-page.php）：キャンペーンバナーをコピーして 2 つ目を追加');
    await Win.switchTo('code');
    await Code.openFile('front-page.php', { top: 10 });
    const a = Code.find('<a href="https://stand-by.jp/campaign_2">').line;
    await Code.selectLines(a, a + 2);
    await Keycap.show(['Ctrl', 'C'], 550);
    await Code.clickAt(a + 2, Code.files['front-page.php'].lines[a + 2].length);
    KeyStrip.special('Enter');
    await Keycap.show(['Ctrl', 'V'], 600);
    Code.insertLines(a + 3, F.BANNER_LINES);
    await wait(500);
    Caption.set('リンク先を新しい LP（/campaign_202612）、画像を 12-1月のバナーに');
    await Code.overwrite('campaign_2"', [{ direct: 'campaign_202612"' }], { from: a + 4, kps: 16 });
    await Code.overwrite('10/campaign_01.png', [{ direct: '11/' + F.BANNER }], { from: a + 5, kps: 26 });
    await Code.save();
    Issue.ok(linesRect(a + 4, a + 6, 900), '2 つ目のバナー → /campaign_202612');
    await wait(1500);
    Issue.hide();
    // deploy
    Caption.set('本番に反映（scp でテーマフォルダへ）');
    await Code.panel(true);
    Term.clear();
    await Term.run(`scp front-page.php standby:${THEME_DIR}`, [500, scpOut('front-page.php', 23, '486.2')]);
    await wait(500);
    // WP Super Cache
    Caption.set('WP Super Cache：キャッシュを削除（トップページの古いキャッシュが残らないように）');
    await Win.switchTo('browser');
    await Browser.newTab('cache');
    await Browser.typeUrl('stand-by.jp/wp/wp-admin/options-general.php?page=wpsupercache');
    await wpScreen('wpsc', { tab: 'cache', ms: 700 });
    const delBtn = WP.els('#wpbody-content input[type="submit"], #wpbody-content button').find((x) => /キャッシュを削除/.test(x.value || x.textContent));
    await WP.scroll(delBtn, 1200);
    await wait(400);
    await clickUi(delBtn, { kind: 'hand', after: 60 });
    await wpScreen('wpsc-deleted', { tab: 'cache', ms: 700 });
    const stats = byText('#wpbody-content h3, #wpbody-content h4, #wpbody-content p, #wpbody-content li', /キャッシュページ数/);
    if (stats) { await WP.scroll(stats, 1000); Issue.ok(wpRect(stats), 'キャッシュ 0 件'); await wait(1300); Issue.hide(); }
    // the top page: two banners → the new one
    Caption.set('トップページを確認：バナーが 2 つ並んだ。新しいバナーをクリック');
    await Browser.clickTab(FRONT);
    await Browser.typeUrl('stand-by.jp');
    await site(FRONT, 'home', LIVE + '/', { states: ['oldCta'] });
    const cont = Store.doc.querySelector('.campaign-container');
    await Store.scrollToEl(cont, 220, 1300);
    await wait(600);
    const nb = Store.doc.querySelector('.campaign-container a[href$="campaign_202612"]');
    await hoverUi(nb, { kind: 'hand', hold: 700 });
    await clickUi(nb, { kind: 'hand', after: 60 });
    await site(FRONT, 'notfound', LIVE + '/campaign_202612', { after: 600 });
    Caption.issue('リンク切れ', 'トップのバナーから LP に行けない：/campaign_202612 が 404');
    const nf = Store.doc.querySelector('h1, h2, .menuTitle');
    Issue.show(() => screenRect(nf || Store.doc.body), '404 ページが見つかりません');
    await wait(2200);
    Issue.hide();
    // the cause: the slug
    await toTab('wp');
    Caption.issue('原因', 'スラッグがタイトルから自動で作られた日本語のまま（campaign_202612 ではない）');
    const addr = WP.el('.post-publish-panel__postpublish input[readonly], .post-publish-panel__postpublish input');
    if (addr) { await hoverUi(addr, { ax: 0.4, hold: 600 }); Issue.show(wpRect(addr), 'スラッグが日本語のまま'); await wait(2200); Issue.hide(); }
    // the fix: スラッグ → campaign_202612
    Caption.set('スラッグを campaign_202612 に変更して保存');
    await clickUi(WP.el('.editor-post-publish-panel__header button[aria-label]') || WP.el('.editor-post-publish-panel__header button'), { after: 60 });
    const sd = WP.doc('ed-slug');
    const pop = sd.querySelector('.editor-post-url__panel-dialog');
    if (pop) pop.style.visibility = 'hidden';
    await LP.wp('ed-slug');
    tabKey.wp = 'ed-slug';
    await wait(400);
    const slugBtn = sd.querySelector('.editor-post-url__panel-toggle') || [...sd.querySelectorAll('.editor-post-panel__row')].filter((r) => /スラッグ/.test(r.textContent)).map((r) => r.querySelector('button'))[0];
    await hoverUi(slugBtn, { kind: 'hand', hold: 400 });
    await clickUi(slugBtn, { kind: 'hand', after: 80 });
    if (pop) pop.style.visibility = '';
    await wait(500);
    await wpType('slug', [{ direct: 'campaign_202612' }], { select: true, kps: 11 });
    await wait(300);
    KeyStrip.special('Enter');
    if (pop) pop.style.visibility = 'hidden';
    if (slugBtn) slugBtn.textContent = 'campaign_202612';   // (the sidebar shows the slug as edited, not saved yet)
    await wait(300);
    await clickUi(sd.querySelector('.editor-post-publish-button'), { kind: 'hand', after: 60 });
    Browser.loading('wp', true);
    await wait(700);
    await LP.wp('ed-updated');
    tabKey.wp = 'ed-updated';
    Browser.loading('wp', false);
    const slugRow = [...WP.doc().querySelectorAll('.editor-post-panel__row')].find((r) => /スラッグ/.test(r.textContent));
    if (slugRow) { Issue.ok(wpRect(slugRow), 'campaign_202612'); await wait(1400); Issue.hide(); }
    // the banner again
    await Browser.clickTab(FRONT);
    await Browser.reload(async () => { await Store.load('lp', { states: ['oldCta'] }); }, { key: 'F5' });
    Browser.nav(FRONT, { title: TITLE.lp });
    Caption.fixed('/campaign_202612 で LP が表示された（トップのバナーからつながる）');
    await wait(1200);
    await Store.scroll(380, 1200);
    await wait(900);
    await Store.scroll(0, 800);
  });

  /* 5 — the fixed reservation buttons (mistake 3: on PC too) */
  scene('cta', async () => {
    Caption.step(5);
    window.Win11.skipTo('14:17');
    Caption.set('スマホの画面下の予約ボタン（画像 1 枚）を、WEB予約と LINE の 2 つのボタンに作り替える');
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Store.loadSp('lp', { states: ['oldCta'] });
    await Store.scroll(900, 1600, true);
    const oldBtn = Store.spDoc.querySelector('#bottomWebBtn');
    if (oldBtn) { Issue.ok(() => screenRect(oldBtn), '今の固定ボタン（画像 1 枚）'); await wait(2000); Issue.hide(); }
    // footer.php: the old one commented out, the new markup
    await Win.switchTo('code');
    Caption.set('footer.php：古いボタンをコメントアウトして、新しいボタンの HTML を追加');
    await Code.panel(false);
    const FP = 'footer.php';
    await Code.openFile(FP, { top: 0 });
    const b0 = Code.find('<div id="bottomWebBtn">').line, b1 = Code.find('</div>', b0).line;
    await Code.selectLines(b0, b1);
    await Keycap.show(['Ctrl', '/'], 650);
    const f = Code.files[FP];
    f.lines[b0] = '<!-- ' + f.lines[b0];
    f.lines[b1] = f.lines[b1] + ' -->';
    f.dirty = true;
    Code.renderTabs();
    Code.setCaret(b1, f.lines[b1].length);
    await wait(500);
    await Code.lineAfter('</div> -->', code(['', ...F.STICKY_HTML], { after: '</div> -->' }).slice(1), { kps: 30 });
    await Code.save();
    Issue.ok(linesRect(b1 + 2, b1 + 2 + F.STICKY_HTML.length - 1, 900), 'WEB予約／LINE のボタン');
    await wait(1600);
    Issue.hide();
    await Code.panel(true);
    Term.clear();
    await Term.run(`scp footer.php standby:${THEME_DIR}`, [500, scpOut('footer.php', 6, '211.7')]);
    await wait(400);
    // cache
    await Win.switchTo('browser');
    Store.device(false);
    Caption.set('反映したので WP Super Cache のキャッシュを削除');
    await toTab('cache');
    await wpScreen('wpsc', { tab: 'cache', ms: 600 });
    const delBtn = WP.els('#wpbody-content input[type="submit"], #wpbody-content button').find((x) => /キャッシュを削除/.test(x.value || x.textContent));
    await WP.scroll(delBtn, 0);
    await clickUi(delBtn, { kind: 'hand', after: 60 });
    await wpScreen('wpsc-deleted', { tab: 'cache', ms: 600 });
    // the Customizer: 追加 CSS
    Caption.set('ボタンのデザインは 追加 CSS に：外観 › カスタマイズ › 追加 CSS');
    await toTab('wp');
    await Browser.typeUrl('stand-by.jp/wp/wp-admin/customize.php?autofocus[section]=custom_css');
    await wpScreen('cz', { ms: 1300, states: ['cssBefore'] });
    const pv = LP.czDoc('cz');
    Caption.set('プレビュー：ボタンの HTML は入ったが、CSS がまだないのでページ下に素のリンクのまま');
    await LP.czScroll(pv.documentElement.scrollHeight, 1800);
    const raw = pv.querySelector('.sticky-footer-wrap');
    if (raw) { Issue.show(() => screenRect(raw), 'CSS がまだない'); await wait(1800); Issue.hide(); }
    await LP.czScroll(0, 900);
    // the CSS: pasted from docs/lp/sticky-cta.css
    Caption.set('ボタンの CSS（docs/lp/sticky-cta.css）をコピーして 追加 CSS に貼り付け');
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile('docs/lp/sticky-cta.css', { top: 0 });
    Code.selectAll();
    await Keycap.show(['Ctrl', 'A'], 450);
    await Keycap.show(['Ctrl', 'C'], 600);
    Code.clearSelectAll();
    await Win.switchTo('browser');
    const css = WP.data.css;
    const at = LP.cm.line(css.atLine + 1, WP.doc('cz')) || LP.cm.line(css.atLine, WP.doc('cz'));
    await clickUi(at.pre, { kind: 'text', ax: 0.05, after: 80 });
    await Keycap.show(['Ctrl', 'V'], 650);
    await wpScreen('cz-pasted', { loading: false, states: ['cssPasted'], after: 200 });
    LP.cm.lines().filter((l) => l.n > css.atLine && l.n <= css.atLine + css.stickyLines).forEach((l) => { l.div.style.transition = 'background 1.2s'; l.div.style.background = 'rgba(255, 213, 79, .35)'; setTimeout(() => { l.div.style.background = ''; }, 1400 / window.Stage.Clock.speed); });
    await wait(1200);
    // mistake 3: on PC too
    const sticky = LP.czDoc('cz-pasted').querySelector('.sticky-footer-wrap');
    Caption.issue('表示ミス', 'PC でも画面下にボタンが固定表示される（PC はヘッダーに予約ボタンがある）');
    await wait(1800);
    Caption.hide();   // (the buttons sit at the bottom of the preview, where the caption is)
    Issue.show(() => { const r = screenRect(sticky); const btns = [...sticky.querySelectorAll('a')].map(screenRect); const top = Math.min(...btns.map((b) => b.top)); const left = Math.min(...btns.map((b) => b.left)); return { left, top, width: Math.max(...btns.map((b) => b.right)) - left, height: r.bottom - top - 6 }; }, 'PC でも画面下に固定ボタン');
    await wait(2600);
    Issue.hide();
    // the fix: hidden at 768px and wider
    Caption.set('画面幅 768px 以上では固定ボタンを非表示にするルールを追加');
    await wpScreen('cz-final', { loading: false, states: ['cssPasted'], after: 0 });
    const target = LP.cm.target(css.pcLine, css.pcLines + 1);
    const endOf = LP.cm.line(css.pcLine - 1);
    await clickUi(endOf.pre, { kind: 'text', ax: 0.9, after: 80 });
    KeyStrip.special('End');
    await typeInto(target, code(['', ...css.pc.split('\n')], { after: '}' }), { kps: 22 });
    target.done();
    window.StoreFrame.state(LP.czDoc('cz-final'), 'cssPasted', false);
    await wait(700);
    Caption.fixed('PC のプレビューから固定ボタンが消えた（スマホ幅だけに表示）');
    await wait(1800);
    await clickUi(WP.el('#save'), { kind: 'hand', after: 60 });
    await wpScreen('cz-saved', { loading: false, ms: 0, states: [], after: 600 });
    Issue.ok(wpRect('#save'), '公開済み');
    await wait(1200);
    Issue.hide();
  });

  /* 6 — the smartphone, the live pages */
  scene('sp', async () => {
    Caption.step(6);
    Caption.set('スマホで確認：画面下に WEB予約・LINE のボタンが固定される');
    await Browser.clickTab(FRONT);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Browser.reload(async () => { await Store.loadSp('lp'); }, { key: 'F5' });
    await wait(900);
    const btns = Store.spDoc.querySelector('.sticky-footer-wrap');
    Issue.ok(() => screenRect(btns), 'WEB予約／LINE');
    await wait(1600);
    Issue.hide();
    await Store.scroll(1400, 2200, true);
    await wait(600);
    const head = [...Store.spDoc.querySelectorAll('.postWrap h3')].find((h) => /次世代型糸リフト/.test(h.textContent));
    if (head) { await Store.scrollToEl(head, 200, 1800, true); await wait(1400); }
    const resv = Store.spDoc.querySelector('#reservationWrap');
    if (resv) { await Store.scrollToEl(resv, 160, 2000, true); await wait(1200); }
    await hoverUi(Store.spDoc.querySelector('.sticky-footer-wrap .green-reserve-btn'), { kind: 'hand', hold: 900 });
    await hoverUi(Store.spDoc.querySelector('.sticky-footer-wrap .line-btn'), { kind: 'hand', hold: 900 });
    Cursor.kind('arrow');
    // the top page on the phone
    Caption.set('トップページ：バナーはスマホでは縦に 2 つ並ぶ');
    Browser.nav(FRONT, { title: TITLE.home, url: LIVE + '/' });
    await Browser.reload(async () => { await Store.loadSp('home'); });
    await Store.scrollToEl(Store.spDoc.querySelector('.campaign-container'), 140, 1800, true);
    await wait(1800);
    // PC
    Caption.set('PC：バナーは横に 2 つ。固定ボタンは出ない');
    Store.device(false);
    await site(FRONT, 'home', LIVE + '/', { after: 300 });
    await Store.scrollToEl(Store.doc.querySelector('.campaign-container'), 220, 1400);
    await wait(900);
    const nb = Store.doc.querySelector('.campaign-container a[href$="campaign_202612"]');
    await clickUi(nb, { kind: 'hand', after: 60 });
    await site(FRONT, 'lp', LIVE + '/campaign_202612', { after: 700 });
    Caption.allDone();
    Caption.set('キャンペーン LP が完成：トップのバナー → LP → 予約（スマホは固定ボタン）');
    await Store.scroll(520, 1600);
    await wait(1500);
    await Store.scrollToEl([...Store.doc.querySelectorAll('.postWrap h2')].find((h) => /施術内容一覧/.test(h.textContent)), 120, 1800);
    await wait(1800);
    await Store.scroll(0, 1200);
    await wait(3000);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'lp', 'prev', 'notfound'],
    fontText: JSON.stringify(JA) + F.BRIEF + F.priceMd(true) + F.STICKY_HTML.join('') + F.TITLE + F.PERIOD,
    async prepare() {
      const tree = [
        ['data', 'dir', 1], ['data/notes-202612.md'], ['data/price-202612.csv'],
        ['docs', 'dir', 1], ['docs/lp', 'dir', 1], ['docs/lp/campaign-202612.md'], ['docs/lp/campaign_2.md'], ['docs/lp/sticky-cta.css'],
        ['inc', 'dir', 0], ['inc/post-types.php'],
        ['out', 'dir', 1], ['out/.gitkeep'],
        ['scripts', 'dir', 1], ['scripts/.gitkeep'],
        ['.gitignore'], ['footer.php'], ['front-page.php'], ['functions.php'], ['header.php'], ['package.json'], ['page.php'], ['README.md'], ['style.css'],
      ];
      Code.init({ ...P }, tree);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      // the browser: the live site (before the work: one campaign banner, the old fixed button)
      Browser.addTab({ id: 'site', title: TITLE.home, url: LIVE + '/', page: 'store', fav: 'store' });
      D.Win.open('code', 'max');
      D.Win.open('browser', 'max');
      D.Win.front('code');
      K.hydrate();
      await Store.load('home', { states: ['oneBanner', 'oldCta'] });
      await WP.preload(['login', 'dashboard', 'pages']);
    },
  });
  window.__JA = JA;
})();
