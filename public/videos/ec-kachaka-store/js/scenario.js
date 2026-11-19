/*
 * Timeline: the design renewal of kachaka Online Store (store.kachaka.life, EC-CUBE 4) —
 * the dev copy on EC-CUBE's default theme (shop data imported from the public store) → the template "kachaka" uploaded
 * and selected (オーナーズストア > テンプレート) → default_frame.twig + kachaka.css, the header / footer blocks (and the
 * compiled Twig that APP_ENV=prod keeps: キャッシュ管理) → ブロック管理 (お知らせバー) and レイアウト管理 (the left
 * column) → index.twig (a missing {% endfor %}: EC-CUBE's error page and its log), Product/list.twig, Product/detail.twig,
 * the cart → smartphone width (the header) → git / deploy → the live store.
 * Every EC-CUBE screen is the real EC-CUBE 4.3.1-p1 rendering the files typed here (js/ec-snapshot.js,
 * tools/snapshots/ec-kachaka-store/capture-ec.js); the live store is the public store.kachaka.life (js/site-snapshot.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, EC = window.EC, KS = window.KS, S = window.SITE_SNAPSHOT;
  const { wait, Cursor, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, FileDialog } = K;
  const T = F.T, A = F.A;
  const DEV = 'http://localhost:8080', LIVE = 'https://store.kachaka.life';
  const ED = EC.data || {};

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'お問い合わせ': { r: 'otoiawase', segs: ['お問い合わせ'], predict: ['お問い合わせ'], yomi: ['おといあわせ'] },
    '税込': { r: 'zeikomi', segs: ['税込'], predict: ['税込', '税込み'], yomi: ['ぜいこみ', 'ぜいこみ'] },
    'スマートフォンのヘッダー': { r: 'suma-tofonnnohedda-', segs: ['スマートフォンの', 'ヘッダー'] },
    'お知らせバー': { r: 'oshiraseba-', segs: ['お知らせ', 'バー'], predict: ['お知らせ'], yomi: ['おしらせ'] },
    'テーマ': { r: 'te-ma', segs: ['テーマ'] },
    'のデザインリニューアル': { r: 'nodezainnrinyu-aru', segs: ['の', 'デザイン', 'リニューアル'] },
  };

  /* ------------------------------------------------------------- helpers */
  const twig = (p) => /\.twig$/.test(p);
  const prepFile = (p) => { const f = Code.files[p]; if (f && twig(p)) f.indent = '    '; return f; };
  const check = (path, expected, tag) => { if (Code.text(path) !== expected) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const ecRect = (sel, pad = 0) => () => { const e = typeof sel === 'string' ? EC.el(sel) : (typeof sel === 'function' ? sel() : sel); if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const docRect = (sel, sp) => () => { const d = sp ? Store.spDoc : Store.doc; const e = typeof sel === 'string' ? d.querySelector(sel) : sel; return e ? screenRect(e) : null; };
  const byText = (sel, re) => EC.els(sel).find((e) => re.test(e.textContent.replace(/\s+/g, ' ').trim())) || null;
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const termRect = (n, w = 1180) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    const out = rows.slice(-n - 1, -1);
    if (!out.length) return null;
    const a = screenRect(out[0]), b = screenRect(out[out.length - 1]);
    return { left: a.left - 4, top: a.top - 2, width: w, height: b.bottom - a.top + 4 };
  };
  const flash = () => EC.el('.c-contentsArea .alert-success, .c-container .alert-success, .alert-success');
  /** the admin's left menu: a group opened (Bootstrap's collapse, as its script does), then the item */
  async function adminNav(group, path) {
    const title = EC.el(`a.c-mainNavArea__navItemTitle[href="#nav-${group}"]`);
    const ul = EC.el(`#nav-${group}`);
    if (ul && !ul.classList.contains('show')) {
      await clickUi(title, { kind: 'hand', after: 120 });
      ul.classList.add('show');
      title.classList.remove('collapsed');
      await wait(300);
    }
    const a = EC.els(`#nav-${group} a`).find((x) => (x.getAttribute('href') || '').replace(/[?#].*$/, '').endsWith(path));
    // a third level (オーナーズストア › テンプレート › テンプレート一覧): its sub-menu opened first
    const sub = a && a.closest('ul.collapse');
    if (sub && sub !== ul && !sub.classList.contains('show')) {
      const st = EC.el(`a[href="#${sub.id}"]`);
      await clickUi(st, { kind: 'hand', after: 120 });
      sub.classList.add('show');
      if (st) st.classList.remove('collapsed');
      await wait(300);
    }
    await clickUi(a, { kind: 'hand', after: 80 });
  }
  /** an admin screen in the admin tab */
  const admin = (key, o = {}) => KS.ec('admin', key, { load: 650, after: 400, ...o });
  /** the dev copy's shop in the dev tab, reloaded (F5) or opened */
  async function devReload(key, o = {}) {
    await Browser.reload(async () => { await KS.ec('dev', key, { load: 0 }); }, { key: 'F5' });
    await wait(o.after != null ? o.after : 600);
    return EC.doc(key);
  }
  /** a file of the theme: written by the template upload / a terminal command (no typing) */
  function addFile(path, text) {
    Code.addFile(path, text, { silent: true });
    prepFile(path);
    KS.tree(1);
  }
  /** a new file from the explorer, pasted (copied from default or written beforehand), saved */
  async function newPasted(path, text, o = {}) {
    await Code.newFile(path);
    prepFile(path);
    await Code.paste(text, { after: o.after != null ? o.after : 500 });
    Code.top = 0;
    Code.render();
    if (o.save !== false) await Code.save({ status: 'U' });
    KS.tree(1);
  }
  /** lines typed after line `at` (Enter + VS Code's indent corrected), Japanese through the IME */
  async function typeLines(lines, at, o = {}) {
    const f = Code.files[Code.active];
    await Code.reveal(at, 600);
    await Code.newLineAfter(at);
    await Code.type(K.codeScript(lines, JA, { after: f.lines[at], unit: f.indent }), { kps: o.kps || 30 });
  }
  const pad = (n) => String(n).padStart(2, '0');
  const lineOf = (needle, from = 0) => { const p = Code.find(needle, from); return p ? p.line : 0; };

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the store on EC-CUBE's default theme */
  scene('current', async () => {
    Caption.step(1);
    Caption.set('開発環境（Docker の EC-CUBE 4.3.1、http://localhost:8080）。本番のカテゴリ・商品を取り込み、デザインは標準テーマのまま');
    await wait(1400);
    const head = EC.el('.ec-headerNaviRole') || EC.el('header');
    await hoverUi(EC.el('.ec-headerTitle, .ec-headerRole__title, .ec-headerRole') || head, { hold: 900 });
    Issue.show(ecRect('.ec-layoutRole__header', 2), '標準テーマ：文字のロゴ・検索・横並びのカテゴリ');
    await wait(3200);
    Issue.hide();
    await EC.scroll(620, 1500);
    await wait(900);
    Caption.set('トップは標準テーマのスライド・特集のまま。カテゴリ・商品の並びも本番の構成と違う');
    await wait(2600);
    await EC.scroll(0, 1000);
    // the admin
    Caption.set('管理画面：商品管理 › 商品一覧。本番と同じ 7 商品（商品名・型番・価格）');
    await Browser.clickTab('admin');
    await wait(400);
    await adminNav('product', '/admin/product');
    await admin('a-products');
    const rows = EC.els('table tbody tr');
    if (rows.length) {
      await hoverUi(rows[0], { hold: 500 });
      Issue.ok(ecRect(() => EC.el('table'), 2), '7 商品（カテゴリ 4）');
      await wait(3000);
      Issue.hide();
    }
    Caption.set('オーナーズストア › テンプレート：使えるテンプレートは「デフォルト」だけ');
    await adminNav('store', '/admin/store/template');
    await admin('a-template');
    Issue.show(ecRect(() => (EC.el('input[name=template]:checked') || EC.el('table')).closest('tr') || EC.el('table'), 2), 'デフォルト（default）');
    await wait(3200);
    Issue.hide();
    // the plan
    Caption.set('リニューアルの方針（README）：色・フォント・カテゴリの左カラム・トップの構成');
    await Win.switchTo('code');
    await hoverUi(Code.lineEl(lineOf('## 方針')), { ax: 0.25, hold: 600 });
    Issue.show(linesRect(lineOf('標準テーマ（default）'), lineOf('スマートフォン（〜767px）'), 900), '方針');
    await wait(4200);
    Issue.hide();
  });

  /* 2 — the template kachaka: upload, select */
  scene('template', async () => {
    Caption.step(2);
    Caption.set('新しいテンプレート「kachaka」の雛形：default の assets をコピーして zip に（app/ と html/）');
    await Code.panel(true);
    await Term.run(String.raw`New-Item -ItemType Directory theme\kachaka\app, theme\kachaka\html | Out-Null`, [], { kps: 22 });
    await Term.run(String.raw`Copy-Item html\template\default\assets theme\kachaka\html\assets -Recurse`, [], { kps: 22 });
    await Term.run(String.raw`tar -a -c -f kachaka.zip -C theme\kachaka app html`, [], { kps: 20 });
    const kb = Math.round((ED.zipSize || 1450000) / 1024);
    await Term.run('Get-Item kachaka.zip | Format-Table Name, Length', ['', '<span class="tg">Name        Length</span>', '<span class="tg">----        ------</span>', `kachaka.zip ${ED.zipSize || ''}`, ''], { kps: 20 });
    await wait(600);
    // upload
    Caption.set('管理画面：テンプレート › 新規作成。テンプレートコード・名前・zip ファイルを指定してアップロード');
    await Win.switchTo('browser');
    await clickUi(EC.el('a.btn-ec-regular[href*="template/install"]') || byText('a.btn', /新規/), { kind: 'hand', after: 80 });
    await admin('a-template-add');
    await KS.type('code', 'kachaka', { kps: 10 });
    await KS.type('name', 'kachaka Online Store', { kps: 12 });
    const inp = EC.el('#admin_template_file');
    await clickUi(inp, { ax: 0.12, after: 80 });
    await FileDialog.pick({ folder: ['PC', 'ローカル ディスク (C:)', 'dev', 'kachaka-store'], look: 900, files: [
      { name: 'app', date: '2026/09/08 18:22', type: 'ファイル フォルダー', size: '' },
      { name: 'html', date: '2026/09/08 18:22', type: 'ファイル フォルダー', size: '' },
      { name: 'theme', date: '2026/11/07 ' + hm(), type: 'ファイル フォルダー', size: '' },
      { name: '.env', date: '2026/09/08 18:20', type: 'ENV ファイル', size: '1 KB' },
      { name: 'kachaka.zip', date: '2026/11/07 ' + hm(), type: '圧縮 (zip 形式) フォルダー', size: `${kb.toLocaleString()} KB` },
      { name: 'README.md', date: '2026/09/09 17:05', type: 'Markdown ファイル', size: '2 KB' },
    ], pick: 'kachaka.zip' });
    if (inp) {
      const W = inp.ownerDocument.defaultView;
      const dt = new W.DataTransfer();
      dt.items.add(new W.File(['PK'], 'kachaka.zip', { type: 'application/zip' }));
      inp.files = dt.files;
    }
    await wait(500);
    await clickUi(EC.el('button.btn-ec-conversion[type=submit]'), { kind: 'arrow', after: 60 });
    await admin('a-template-added', { load: 1500 });
    const row = () => { const r = EC.els('input[name=template]').find((x) => /kachaka/.test(x.closest('tr').textContent)); return r && r.closest('tr'); };
    Caption.fixed('アップロードが完了：テンプレート「kachaka Online Store」（コード kachaka）');
    Issue.ok(ecRect(row, 2), 'kachaka');
    await wait(3000);
    Issue.hide();
    Caption.set('kachaka を選んで登録：EC-CUBE が .env の ECCUBE_TEMPLATE_CODE を書き換えてキャッシュを削除');
    const radio = row() && row().querySelector('input[name=template]');
    await clickUi(radio, { after: 80 });
    if (radio) { EC.els('input[name=template]').forEach((x) => { x.checked = false; x.removeAttribute('checked'); }); radio.checked = true; radio.setAttribute('checked', ''); }
    await wait(300);
    await clickUi(EC.el('button.btn-ec-conversion[type=submit]'), { kind: 'arrow', after: 60 });
    await admin('a-template-saved', { load: 1600 });
    Issue.ok(ecRect(flash, 2), '保存しました');
    await wait(2400);
    Issue.hide();
    // .env and the theme folders
    await Win.switchTo('code');
    await Code.panel(false);
    Code.files['.env'].lines = Code.files['.env'].lines.map((l) => l.replace('ECCUBE_TEMPLATE_CODE=default', 'ECCUBE_TEMPLATE_CODE=kachaka'));
    addFile(A + 'css/style.css', F.files[A + 'css/style.css']);
    await Code.openFile('.env', { top: 0 });
    const ln = lineOf('ECCUBE_TEMPLATE_CODE');
    Code.lineCls[lineOf('ECCUBE_AUTH_MAGIC')] = 'pii';
    Code.render();
    Caption.set('.env：ECCUBE_TEMPLATE_CODE=kachaka。app/template/kachaka と html/template/kachaka ができた');
    Issue.ok(linesRect(ln, ln, 520), 'ECCUBE_TEMPLATE_CODE=kachaka');
    await wait(3000);
    Issue.hide();
    await hoverUi(Code.node('app/template/kachaka'), { hold: 700 });
    await hoverUi(Code.node('html/template/kachaka/assets'), { hold: 900 });
    Caption.set('テンプレートのファイルはまだ空：kachaka にないファイルは default のものが使われ、見た目は変わらない');
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    await devReload('f-default', { after: 2600 });
  });

  /* 3 — default_frame, kachaka.css, the header / footer (and the Twig cache) */
  scene('common', async () => {
    Caption.step(3);
    Caption.set('デザインデータのロゴ・アイコン・フォント（Poppins）をテーマの assets に');
    await Win.switchTo('code');
    await Code.panel(true);
    await Term.run(String.raw`Copy-Item ..\design\kachaka-assets\* html\template\kachaka\assets -Recurse -Force`, [], { kps: 22 });
    await Term.run(String.raw`Get-ChildItem html\template\kachaka\assets\img\common, html\template\kachaka\assets\fonts -Name`, ['favicon-32.png', 'logo-white.svg', 'logo.svg', 'poppins-400.woff2', 'poppins-500.woff2', 'poppins-600.woff2'], { kps: 24 });
    await wait(500);
    // kachaka.css
    Caption.set('kachaka.css：色・フォントの変数、ヘッダー・左カラム・トップ・商品ページ・フッター（標準の style.css の後に読み込む）');
    await Code.panel(false);
    await newPasted(A + 'css/kachaka.css', F.CSS_BEFORE);
    Issue.show(linesRect(lineOf(':root'), lineOf('--kc-width'), 640), 'ネイビー・クリーム・ベージュ・コーラル');
    await wait(3400);
    Issue.hide();
    // default_frame.twig
    Caption.set('default_frame.twig（全ページの枠）を default からコピーして、kachaka.css を読み込む 1 行を追加');
    await Code.panel(true);
    await Term.run(String.raw`Copy-Item src\Eccube\Resource\template\default\default_frame.twig app\template\kachaka`, [], { kps: 24 });
    addFile(T + 'default_frame.twig', F.FRAME);
    Code.mark(T + 'default_frame.twig', 'U');
    await Code.panel(false);
    await Code.openFile(T + 'default_frame.twig', { top: 22 });
    await typeLines([F.FRAME_LINK], lineOf("asset('assets/css/style.css')"), { kps: 26 });
    await Code.save({ noStatus: true });
    check(T + 'default_frame.twig', F.frameWithLink(), 'default_frame.twig');
    await Win.switchTo('browser');
    await devReload('f-css', { after: 800 });
    Caption.set('kachaka.css が効いた：クリームの背景・Poppins・左カラムの幅（ヘッダーとフッターはまだ標準）');
    await wait(3000);
    // the header / footer blocks
    Caption.set('ヘッダー・フッターは Block/header.twig・footer.twig を kachaka に作って上書き（ロゴ・ナビ・カート）');
    await Win.switchTo('code');
    KS.dirs.add(T + 'Block');
    KS.tree(1);
    await newPasted(T + 'Block/header.twig', F.HEADER_V1);
    Issue.show(linesRect(lineOf('<nav class="ec-headerNav">'), lineOf('</nav>'), 980), 'ナビ');
    await wait(2600);
    Issue.hide();
    await newPasted(T + 'Block/nav_sp.twig', F.NAV_SP, { after: 300 });
    await newPasted(T + 'Block/footer.twig', F.FOOTER, { after: 300 });
    await wait(600);
    await Win.switchTo('browser');
    await devReload('f-header1', { after: 900 });
    Caption.set('ヘッダー（ロゴ・ナビ・丸いカート）とフッター（ネイビー）が新しいデザインに');
    Issue.ok(ecRect('.ec-headerNaviRole__inner', 2), 'ロゴ / ナビ / カート');
    await wait(2800);
    Issue.hide();
    await EC.scroll(EC.doc().scrollingElement.scrollHeight, 1600);
    await wait(1600);
    await EC.scroll(0, 1000);
    // + お問い合わせ
    Caption.set('ナビに「お問い合わせ」が抜けている → header.twig に追加');
    Issue.show(ecRect('.ec-headerNav', 6), 'お問い合わせ がない');
    await wait(2600);
    Issue.hide();
    await Win.switchTo('code');
    await Code.openFile(T + 'Block/header.twig', { top: 8 });
    await typeLines(F.HEADER_ADD, lineOf(F.HEADER_ANCHOR.trim()), { kps: 28 });
    await Code.save({ noStatus: true });
    check(T + 'Block/header.twig', F.HEADER_V2, 'header.twig');
    await Win.switchTo('browser');
    await devReload('f-header-stale', { after: 700 });
    Caption.issue('反映されない', 'header.twig を保存して再読み込みしても、ナビが変わらない');
    Issue.show(ecRect('.ec-headerNav', 6), '変わらない');
    await wait(3400);
    Issue.hide();
    Caption.issue('原因', 'APP_ENV=prod（本番モード）の EC-CUBE は、一度コンパイルした Twig をキャッシュから使い続ける');
    await Win.switchTo('code');
    await Code.openFile('.env', { top: 0 });
    Code.lineCls[lineOf('ECCUBE_AUTH_MAGIC')] = 'pii';
    Code.render();
    Issue.show(linesRect(0, 0, 360), 'APP_ENV=prod');
    await wait(3400);
    Issue.hide();
    // キャッシュ管理
    Caption.set('管理画面：コンテンツ管理 › キャッシュ管理（「Twig ファイルを入れ替えた場合は Twig キャッシュの削除が必要」）→ キャッシュ削除');
    await Win.switchTo('browser');
    await Browser.clickTab('admin');
    await adminNav('content', '/admin/content/cache');
    await admin('a-cache');
    await clickUi(byText('button', /削除/) || EC.el('button[type=submit]'), { kind: 'arrow', after: 60 });
    await admin('a-cache-done', { load: 1800 });
    Issue.ok(ecRect(flash, 2), '削除しました');
    await wait(2000);
    Issue.hide();
    await Browser.clickTab('dev');
    await devReload('f-header2', { after: 700 });
    Caption.fixed('キャッシュを消すと「お問い合わせ」が出た（以降はターミナルで bin/console cache:clear）');
    Issue.ok(ecRect(() => EC.els('.ec-headerNav__item').pop(), 6), 'お問い合わせ');
    await wait(3000);
    Issue.hide();
  });

  /* 4 — ブロック管理 / レイアウト管理 */
  scene('layout', async () => {
    Caption.step(4);
    Caption.set('ヘッダーの上にお知らせの帯（ネイビー）：新しいブロック「お知らせバー」を ブロック管理 で作る');
    await Browser.clickTab('admin');
    await adminNav('content', '/admin/content/block');
    await admin('a-blocks');
    await clickUi(EC.el('a.btn-ec-regular[href*="block/new"]') || byText('a.btn', /新規/), { kind: 'hand', after: 80 });
    await admin('a-block-new');
    await KS.type('name', [JA['お知らせバー']], { kps: 10 });
    await KS.type('file', 'header_news', { kps: 10 });
    await clickUi(EC.el('#editor'), { kind: 'text', ax: 0.2, ay: 0.08, after: 80 });
    await Keycap.show(['Ctrl', 'V'], 650);
    await KS.ec('admin', 'a-block-filled', { load: 0, after: 400 });
    Caption.set('最新のお知らせを 1 件だけ表示（お知らせがないときは帯だけ）');
    Issue.show(ecRect('#editor', 2), 'Block/header_news.twig');
    await wait(3400);
    Issue.hide();
    await clickUi(EC.el('button.btn-ec-conversion[type=submit]'), { kind: 'arrow', after: 60 });
    await admin('a-block-saved', { load: 1300 });
    Issue.ok(ecRect(flash, 2), '保存しました');
    await wait(2000);
    Issue.hide();
    // the file in the theme
    await Win.switchTo('code');
    addFile(T + 'Block/header_news.twig', F.HEADER_NEWS);
    Code.mark(T + 'Block/header_news.twig', 'U');
    await Code.openFile(T + 'Block/header_news.twig', { top: 0 });
    Caption.set('管理画面で作ったブロックは、使用中のテンプレートの Block/ にファイルとして保存される');
    await wait(3000);
    // layouts
    Caption.set('レイアウト管理 › トップページ用レイアウト：ブロックをドラッグで配置');
    await Win.switchTo('browser');
    await adminNav('content', '/admin/content/layout');
    await admin('a-layouts');
    await clickUi(EC.el('a[href$="/admin/content/layout/1/edit"]'), { kind: 'hand', after: 80 });
    await admin('a-layout1', { load: 900 });
    const blk = (name) => EC.els('[id^="detail_box__layout_item"]').find((b) => (b.querySelector('input.name') || {}).value === name);
    const news = blk('お知らせバー'), cat = blk('カテゴリナビ(PC)');
    if (news) await KS.drag(news, EC.el('#position_3'));
    await EC.scroll(260, 800);
    if (cat) await KS.drag(cat, EC.el('#position_5'));
    for (const n of ['ロゴ', '新入荷商品特集', 'トピック', '新着商品', 'カテゴリ', '新着情報']) { const b = blk(n); if (b) b.style.opacity = '.4'; }
    await KS.ec('admin', 'a-layout1-moved', { load: 0, after: 300 });
    await EC.scroll(EC.el('#position_3'), 700);
    Caption.set('ヘッダー：お知らせバー＋ヘッダー（ロゴのブロックは外す）。カテゴリナビ(PC) は左カラムへ。標準のトップのブロックも外す');
    Issue.show(ecRect('#position_3', 2), 'ヘッダー');
    await wait(2600);
    Issue.ok(ecRect('#position_5', 2), '左カラム：カテゴリナビ(PC)');
    await wait(2600);
    Issue.hide();
    await clickUi(byText('button[type=submit]', /登録/), { kind: 'arrow', after: 60 });
    await admin('a-layout1-saved', { load: 1300 });
    Issue.ok(ecRect(flash, 2), '保存しました');
    await wait(1600);
    Issue.hide();
    Caption.set('下層ページ用レイアウト（商品一覧・詳細など）も同じように');
    await admin('a-layout2-saved', { load: 1200 });
    await wait(1800);
    // the left column's block
    Caption.set('左カラムのカテゴリ：Block/category_nav_pc.twig を kachaka 用に（見出し Categories、トップの各カテゴリへ）');
    await Win.switchTo('code');
    await Code.newFile(T + 'Block/category_nav_pc.twig');
    prepFile(T + 'Block/category_nav_pc.twig');
    await Code.paste(F.CATNAV_HEAD, { after: 400 });
    const f = Code.files[Code.active];
    await typeLines(F.CATNAV_TYPE, f.lines.length - 1, { kps: 32 });
    await Code.save({ status: 'U' });
    check(T + 'Block/category_nav_pc.twig', F.CATNAV.replace(/\n$/, ''), 'category_nav_pc.twig');
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    await devReload('f-layout', { after: 800 });
    Caption.fixed('ヘッダーの上にお知らせバー（お知らせ 0 件なので帯だけ）、左カラムに Categories');
    Issue.ok(ecRect('.ec-layoutRole__left', 4), 'Categories');
    await wait(3000);
    Issue.hide();
    Caption.set('中央はまだ default の index.twig（スライド）');
    await wait(2200);
  });

  /* 5 — index.twig, Product/list.twig, Product/detail.twig */
  scene('pages', async () => {
    Caption.step(5);
    Caption.set('index.twig：カテゴリごとに見出しと商品（並びは新しい順、在庫切れは SOLD OUT）');
    await Win.switchTo('code');
    await Code.newFile(T + 'index.twig');
    prepFile(T + 'index.twig');
    await Code.paste(F.INDEX_HEAD, { after: 400 });
    const f = Code.files[Code.active];
    await typeLines([...F.INDEX_LOOP, ...F.INDEX_TAIL], f.lines.length - 1, { kps: 38 });
    await Code.save({ status: 'U' });
    check(T + 'index.twig', F.INDEX_BAD.replace(/\n$/, ''), 'index.twig (1)');
    await Code.panel(true);
    await Term.run('docker compose exec ec-cube bin/console cache:clear --no-warmup', ['', ' // Clearing the cache for the <span class="ty">prod</span> environment with debug <span class="ty">false</span>', '', ' <span class="tg">[OK] Cache for the "prod" environment (debug=false) was successfully cleared.</span>', ''], { kps: 24 });
    await Win.switchTo('browser');
    await devReload('f-error', { after: 800 });
    Caption.issue('システムエラー', 'トップページが「システムエラーが発生しました」');
    Issue.show(ecRect(() => byText('h1, h2, h3, p', /システムエラー/) || EC.el('body'), 10), 'システムエラー');
    await wait(3200);
    Issue.hide();
    // the log
    await Win.switchTo('code');
    const L = ED.errorLog || { file: 'var/log/prod/site-2026-11-07.log', line: '' };
    const d0 = window.Win11.now();
    let log = L.line.replace(/T\d\d:\d\d:\d\d/, 'T' + pad(d0.getHours()) + ':' + pad(d0.getMinutes()) + ':' + pad(d0.getSeconds()));
    const cut = log.indexOf(',"#0');
    if (cut > 0) log = log.slice(0, cut) + ',"#0 …';
    await Term.run(`docker compose exec ec-cube tail -n 1 ${L.file}`, [`<span class="tlog">${D.esc(log).replace(/(Unexpected [^(]*\([^)]*\)\.)/, '<span class="tr">$1</span>')}</span>`, ''], { kps: 24 });
    Caption.issue('原因', 'Twig の構文エラー：「endblock」の前に for が閉じていない → 商品のループの {% endfor %} が抜けていた');
    Issue.show(termRect(2), 'Unexpected "endblock" tag');
    await wait(4600);
    Issue.hide();
    await Code.panel(false);
    const li = Code.files[T + 'index.twig'].lines.findIndex((l, i, a) => l.trim() === '</li>' && a[i + 1] && a[i + 1].trim() === '</ul>');
    Issue.show(linesRect(li - 10, li + 1, 900), 'for … の閉じ忘れ');
    await wait(2000);
    Issue.hide();
    await typeLines([F.INDEX_ENDFOR], li, { kps: 18 });
    await Code.save({ noStatus: true });
    check(T + 'index.twig', F.INDEX.replace(/\n$/, ''), 'index.twig (2)');
    await Win.switchTo('browser');
    await devReload('f-top', { after: 900 });
    Caption.fixed('カテゴリごとの商品：Kachaka / Furniture / Accessory / Subscription（本番と同じ構成）');
    Issue.ok(ecRect('.ec-newItemRole', 4), 'カテゴリごとの商品');
    await wait(2800);
    Issue.hide();
    await hoverUi(EC.el('.ec-soldout'), { hold: 900 });
    await KS.scrollTo('#category_id_8', 140, 1500);
    await wait(1200);
    await EC.scroll(0, 1100);
    // list / detail
    Caption.set('商品一覧（Product/list.twig：4 列・一覧コメント）と商品詳細（Product/detail.twig：画像・型番・本体価格とカート）');
    await Win.switchTo('code');
    KS.dirs.add(T + 'Product');
    KS.tree(1);
    await newPasted(T + 'Product/list.twig', F.LIST, { after: 300 });
    await newPasted(T + 'Product/detail.twig', F.DETAIL, { after: 300 });
    await Code.scrollTo(Math.max(0, lineOf('<form class="ec-productRole__cart"') - 6), 700);
    Issue.show(linesRect(lineOf('<form class="ec-productRole__cart"'), lineOf('{{ form_rest(form) }}'), 980), '本体価格・数量・カートに入れる');
    await wait(3400);
    Issue.hide();
    await Win.switchTo('browser');
    const card = EC.el('.ec-item__listItem a[href$="/products/detail/1"]');
    await clickUi(card, { kind: 'hand', after: 60 });
    await KS.ec('dev', 'f-detail', { load: 900, after: 900 });
    Caption.set('商品詳細：カチャカシェルフ 3段（画像・型番 ks0001・説明は本番のもの）');
    Issue.ok(ecRect('.ec-productRole__profile', 4), '商品名・価格（税込）・型番');
    await wait(3000);
    Issue.hide();
    await KS.scrollTo('.ec-productRole__cart', 260, 1400);
    await wait(900);
    const add = EC.el('button.add-cart');
    await hoverUi(add, { kind: 'hand', hold: 500 });
    await clickUi(add, { kind: 'hand', after: 60 });
    await KS.ec('dev', 'f-cart', { load: 1300, after: 900 });
    Caption.set('カートに入った（ヘッダーのカートに数量）。カートのページは標準のテンプレートに kachaka.css の色');
    Issue.ok(ecRect('.ec-headerCart', 6), 'カート 1');
    await wait(3000);
    Issue.hide();
    await Browser.typeUrl('localhost:8080/products/list');
    await KS.ec('dev', 'f-list', { load: 1000, after: 900 });
    Caption.set('商品一覧：価格の安い順に 7 商品');
    await KS.scrollTo('.ec-shelfGrid', 200, 1300);
    await wait(2200);
    await EC.scroll(0, 900);
  });

  /* 6 — smartphone width */
  scene('sp', async () => {
    Caption.step(6);
    Caption.set('スマートフォン表示：DevTools のデバイスモード（幅 390px）でトップページを確認');
    await clickUi(EC.el('.ec-headerTitle a'), { kind: 'hand', after: 60 });
    await KS.ec('dev', 'f-top', { load: 700, after: 400 });
    await Keycap.show(['F12'], 500);
    await KS.devtools(true);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 650);
    KS.device(true);
    await KS.ec('dev', 's-top-bad', { load: 600, after: 900 });
    Caption.issue('表示崩れ', 'PC のヘッダーのまま：ナビが 1 行に収まらず、ロゴが大きすぎてカートが画面の外');
    Issue.show(ecRect('.ec-layoutRole__header', 2), 'ヘッダーが収まっていない');
    await wait(3800);
    Issue.hide();
    Caption.set('kachaka.css のスマートフォン用（〜767px）に、ヘッダーの指定を追加：メニューボタン・ロゴ・カートの 1 行');
    await Win.switchTo('code');
    await Code.openFile(A + 'css/kachaka.css', { top: 0 });
    const f = Code.files[Code.active];
    const end = f.lines.lastIndexOf('}');
    await typeLines(F.CSS_SP_HEADER, end - 1, { kps: 34 });
    await Code.save({ noStatus: true });
    check(A + 'css/kachaka.css', F.CSS_FINAL, 'kachaka.css');
    await Win.switchTo('browser');
    await Browser.reload(async () => { await KS.ec('dev', 's-top', { load: 0 }); }, { key: 'F5' });
    await wait(700);
    Caption.fixed('メニューボタン・ロゴ・カートの 1 行に（ナビの項目はメニューの中）');
    Issue.ok(ecRect('.ec-headerNaviRole__inner', 2), 'メニュー / ロゴ / カート');
    await wait(3000);
    Issue.hide();
    Caption.set('商品は 2 列、カテゴリは縦に並ぶ');
    await KS.scrollTo('#category_id_7', 60, 1600);
    await wait(1300);
    await KS.scrollTo('#category_id_12', 60, 1600);
    await wait(1300);
    await EC.scroll(EC.doc().scrollingElement.scrollHeight, 1600);
    await wait(1400);
    await EC.scroll(0, 900);
    await clickUi(EC.el('.ec-item__listItem a[href$="/products/detail/1"]'), { kind: 'hand', after: 60 });
    await KS.ec('dev', 's-detail', { load: 900, after: 900 });
    Caption.set('商品詳細（スマートフォン）：画像・商品名・価格、下にカートボタン');
    await KS.scrollTo('.ec-productRole__profile', 30, 1500);
    await wait(1200);
    await KS.scrollTo('.ec-productRole__cart', 120, 1500);
    await wait(1600);
    KS.device(false);
    await KS.devtools(false);
    await KS.ec('dev', 'f-top', { load: 0, after: 300 });
  });

  /* 7 — git, deploy */
  scene('deploy', async () => {
    Caption.step(7);
    Caption.set('本番へ：テーマのファイル（app/template/kachaka・html/template/kachaka）を git でコミットして反映');
    await Win.switchTo('code');
    await Code.panel(true, { tall: true });
    Term.clear();
    await Term.run('git status --short', ['<span class="tr">?? app/template/kachaka/</span>', '<span class="tr">?? html/template/kachaka/</span>', ''], { kps: 20 });
    await Term.run('git add app/template/kachaka html/template/kachaka', [], { kps: 22 });
    const twigFiles = [T + 'Block/category_nav_pc.twig', T + 'Block/footer.twig', T + 'Block/header.twig', T + 'Block/header_news.twig', T + 'Block/nav_sp.twig', T + 'Product/detail.twig', T + 'Product/list.twig', T + 'default_frame.twig', T + 'index.twig'];
    const ins = 20712 + 103 + [F.CATNAV, F.FOOTER, F.HEADER_V2, F.HEADER_NEWS, F.NAV_SP, F.DETAIL, F.LIST, F.frameWithLink(), F.INDEX, F.CSS_FINAL].reduce((n, t) => n + t.replace(/\n$/, '').split('\n').length, 0);
    await Term.run([{ direct: 'git commit -m "' }, JA['テーマ'], { direct: ' kachaka ' }, JA['のデザインリニューアル'], { direct: '"' }], [
      '[main 4e1c7b2] テーマ kachaka のデザインリニューアル',
      ` 137 files changed, ${ins.toLocaleString('en-US')} insertions(+)`,
      ...twigFiles.slice(0, 4).map((p) => ` create mode 100644 ${p}`), ' <span class="tdim">…</span>', ''], { kps: 18 });
    await Term.run('git push origin main', ['Enumerating objects: 162, done.', 'Writing objects: 100% (158/158), 1.21 MiB | 4.86 MiB/s, done.', 'To github.com:<span class="pii">kachaka-web</span>/kachaka-store.git', '   9b0d3e1..4e1c7b2  main -&gt; main', ''], { kps: 22 });
    // production
    Caption.set('本番サーバー：git pull と Twig のキャッシュ削除');
    await Term.run('ssh kachaka-prod', ['Last login: Wed Sep  9 18:42:10 2026', ''], { kps: 20 });
    window.Shell.remote('[deploy@store eccube]$ ');
    Term.render('<span class="caret"></span>');
    await Term.run('git pull --ff-only origin main', ['From github.com:<span class="pii">kachaka-web</span>/kachaka-store', ' * branch            main       -&gt; FETCH_HEAD', 'Updating 9b0d3e1..4e1c7b2', 'Fast-forward', ` 137 files changed, ${ins.toLocaleString('en-US')} insertions(+)`, ''], { kps: 22 });
    await Term.run('bin/console cache:clear --no-warmup', ['', ' // Clearing the cache for the <span class="ty">prod</span> environment with debug <span class="ty">false</span>', '', ' <span class="tg">[OK] Cache for the "prod" environment (debug=false) was successfully cleared.</span>', ''], { kps: 22 });
    await Term.run('exit', ['logout', 'Connection to kachaka-prod closed.', ''], { kps: 14 });
    window.Shell.local();
    Term.render('<span class="caret"></span>');
    Caption.set('本番の管理画面でも同じ手順：テンプレートを kachaka に切り替え、ブロック「お知らせバー」とレイアウトを設定');
    await Win.switchTo('browser');
    await Browser.clickTab('admin');
    await admin('a-template-final', { load: 700 });
    Issue.ok(ecRect(() => { const r = EC.els('input[name=template]').find((x) => /kachaka/.test(x.closest('tr').textContent)); return r && r.closest('tr'); }, 2), '使用中：kachaka');
    await wait(3400);
    Issue.hide();
  });

  /* the live store */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のストア（store.kachaka.life）で確認');
    await Browser.newTab('live');
    await Browser.typeUrl('store.kachaka.life');
    Browser.nav('live', { url: LIVE + '/', title: (S.pages.home.pc || {}).title || S.title, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    await wait(1600);
    Caption.set('お知らせの帯・ロゴとナビ・左のカテゴリ・カテゴリごとの商品・ネイビーのフッター');
    await hoverUi(Store.doc.querySelector('.ec-layoutRole__header .ec-headerNav') || Store.doc.querySelector('.ec-headerNav'), { hold: 900 });
    const sec = Store.doc.querySelectorAll('.ec-newItemRole__others--category');
    if (sec[2]) { await Store.scrollToEl(sec[2], 120, 1600); await wait(1200); }
    await Store.scroll(Store.doc.scrollingElement.scrollHeight, 1600);
    await wait(1400);
    await Store.scroll(0, 1000);
    const card = Store.doc.querySelector('a[href$="/products/detail/1"]');
    if (card && S.pages.detail) {
      await hoverUi(card, { kind: 'hand', hold: 400 });
      await clickUi(card, { kind: 'hand', after: 60 });
      Browser.nav('live', { url: LIVE + '/products/detail/1', title: (S.pages.detail.pc || {}).title || 'kachaka Online Store / カチャカシェルフ 3段' });
      Browser.loading('live', true);
      await Store.load('detail');
      Browser.loading('live', false);
      await wait(1800);
      await Store.scroll(700, 1600);
      await wait(1600);
      await Store.scroll(0, 900);
    }
    Caption.set('スマートフォンでも確認');
    await Keycap.show(['F12'], 500);
    await K.DevTools.open(true);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 650);
    Store.device(true);
    await Store.loadSp('home');
    await wait(1800);
    await Store.scroll(Store.spDoc.scrollingElement.scrollHeight * 0.35, 2200, true);
    await wait(1800);
    Store.device(false);
    await K.DevTools.open(false);
    Caption.set('EC-CUBE 4 のデザインリニューアルが完了：テンプレート kachaka・ブロック / レイアウト・トップと商品ページ・スマートフォン表示');
    await wait(4800);
    Caption.hide();
  });

  function hm() { const d = window.Win11.now(); return `${d.getHours()}:${pad(d.getMinutes())}`; }

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'detail'],
    fontText: JSON.stringify(JA),
    async prepare() {
      Code.init({ ...F.files }, F.treeBase);
      KS.tree(0);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'dev', title: '', url: '', page: 'wp', fav: 'shop' });
      Browser.addTab({ id: 'admin', title: '', url: '', page: 'wp', fav: 'ec' }, { activate: false });
      await EC.preload(['f-default', 'a-dashboard', 'a-products', 'a-template']);
      await KS.ec('admin', 'a-dashboard', { load: 0, after: 0 });
      await KS.ec('dev', 'f-default', { load: 0, after: 0 });
      Browser.activate('dev');
      D.Win.open('code', 'max');
      D.Win.open('browser', 'max');
      D.Win.front('browser');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
