/*
 * Timeline: 小山弓具 公式オンラインショップ (www.koyama-kyugu.com, EC-CUBE 4) — improving the existing shop:
 * the request (受注生産 told only in the product name / description; 送料無料 at 55,000 円 when the order has 矢・矢筒) →
 * the dev copy (docker compose, http://localhost:8080, the shop's products) → ProductTrait (@EntityExtension),
 * eccube:generate:proxies — the schema update forgotten: the product page's システムエラー, the log, schema:update →
 * the admin product form (FormType extension, auto_render): 受注生産 / 納期の目安 saved → the Twig function
 * stock_badge() in the theme's Product/detail.twig → the badges → the delivery fee rule (PurchaseFlow, @ShoppingFlow):
 * the checkout charges 1,980 円 but the cart still says 送料無料 → the cart's EventSubscriber (TemplateEvent) → the
 * test order, 受注管理 → git, the production server, the live product page.
 * Every EC-CUBE screen is real (js/ec-snapshot.js — tools/snapshots/ec-koyama-kyugu/capture-ec.js: EC-CUBE 4.3.1-p1 with
 * this code, js/customize-src.js, at each stage); the live shop is js/site-snapshot.js. The console output of
 * bin/console (proxies, the SQL, the error log line) is EC-CUBE's own; docker, git and the server are reconstructions.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, EC = window.EC, W11 = window.Win11, AP = window.AP, KY = window.KY;
  const { esc, wait, Cursor, Caption, Issue, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const P = F.files, SRC = F.SRC;
  const DEV = 'http://localhost:8080', WWW = 'https://www.koyama-kyugu.com';
  const C = SRC.DIR;
  const TRAIT = C + 'Entity/ProductTrait.php', FORM = C + 'Form/Extension/Admin/ProductTypeExtension.php', TWIGX = C + 'Twig/Extension/StockBadgeExtension.php';
  const RULE = C + 'Service/DeliveryFreeRule.php', PROC = C + 'Service/PurchaseFlow/Processor/ArrowDeliveryFeeProcessor.php', SUB = C + 'EventSubscriber/CartDeliveryFreeSubscriber.php';
  const DETAIL = 'app/template/default/Product/detail.twig', CSS = 'html/user_data/assets/css/customize.css';
  const src = (path) => SRC.source[path.slice(C.length)];
  const DATA = EC.data || {};
  const TITLE = { home: S.title, product: (S.pages.product && S.pages.product.title) || '小山弓具公式オンラインショップ / 清芳　前煤竹［受注生産］', guide: (S.pages.guide && S.pages.guide.title) || '小山弓具公式オンラインショップ / ご購入ガイド' };
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '受注生産': { r: 'juchuuseisan', segs: ['受注', '生産'] },
    '在庫品': { r: 'zaikohin', segs: ['在庫品'] },
    '納期の目安': { r: 'noukinomeyasu', segs: ['納期の', '目安'] },
    '例：約3～4ヶ月': { r: 'rei:yaku3~4kagetu', segs: ['例：', '約3～4ヶ月'] },
    '納期': { r: 'nouki', segs: ['納期'] },
    '約1年': { r: 'yaku1nen', segs: ['約1年'] },
  };
  /** typing script for space-indented code (PSR-12 / Twig, 4 spaces): Enter + auto-indent, corrected */
  const script = (lines, after) => K.codeScript(lines, JA, { unit: '    ', after });
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); if (Code.ins && Code.active) { Code.ensureVisible(Code.ins.line); Code.render(); } Term.render('<span class="caret"></span>'); };
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) { const f = Code.files[path]; if (f && /\.(php|twig|css)$/.test(path)) f.indent = '    '; show0(path, o); };

  /* ------------------------------------------------ what the commands print */
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 26, ...o });
  const DC = 'docker compose exec ec-cube ';
  /** bin/console's own output (captured), the paths inside the container */
  const consoleOut = (text) => String(text || '').replace(/\/srv\/eccube/g, '/var/www/html').replace(/\r/g, '').split('\n').map((l) => esc(l).replace(/^(\s*)\[OK\]/, '$1<span class="tg">[OK]</span>')).filter((l, i, a) => !(l.trim() === '' && (i === 0 || a[i - 1].trim() === '')));
  const sqlOut = (text) => consoleOut(text).map((l) => (/^\s*(ALTER|CREATE|INSERT|DROP|UPDATE)/.test(l) ? `<span class="tsql">${l}</span>` : l));
  const cacheClear = () => run(DC + 'bin/console cache:clear --no-warmup', ['', ' // Clearing the cache for the <span class="tc">prod</span> environment with debug <span class="tc">false</span>', '',
    ' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.', ''], { kps: 30 });
  /** EC-CUBE's log line (captured): the capture's date → the video's */
  const errLog = () => {
    const L = DATA.errorLog && DATA.errorLog.lines ? DATA.errorLog.lines : [];
    const line = L.find((l) => /CRITICAL|ERROR/.test(l)) || L[0] || '';
    return line.replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2})?/, '2026-09-02T10:31:48.211+09:00').replace(/\/srv\/eccube/g, '/var/www/html');
  };
  const logFile = () => ((DATA.errorLog && DATA.errorLog.file) || 'var/log/prod/site.log').replace(/\d{4}-\d{2}-\d{2}/, '2026-09-02');

  /* ------------------------------------------------------------- frames */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? EC.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const SR = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? Store.doc && Store.doc.querySelector(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const termFind = (text, n = 1, w = 1200) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    let i = -1;
    rows.forEach((r, k) => { if (r.textContent.includes(text)) i = k; });
    if (i < 0) return null;
    const a = screenRect(rows[i]), b = screenRect(rows[Math.min(rows.length - 1, i + n - 1)]);
    return { left: a.left, top: a.top, width: Math.min(w, a.width), height: b.bottom - a.top };
  };
  /** the smallest element of the screen on show whose text matches (sel narrows the search) */
  const ecText = (re, sel = 'body *') => EC.els(sel).filter((e) => re.test(e.textContent) && e.getBoundingClientRect().width > 0).sort((a, b) => a.textContent.length - b.textContent.length)[0] || null;
  const storeText = (re, sel = 'body *') => (Store.doc ? [...Store.doc.querySelectorAll(sel)] : []).filter((e) => re.test(e.textContent) && e.getBoundingClientRect().width > 0).sort((a, b) => a.textContent.length - b.textContent.length)[0] || null;
  /** an element of the EC screen into view (the screen scrolls; returns it) */
  async function ecInto(el, off = 260, ms = 900) {
    if (!el) return null;
    const win = el.ownerDocument.defaultView;
    const y = el.getBoundingClientRect().top + win.scrollY - off;
    await EC.scroll(Math.max(0, y), ms);
    await wait(250);
    return el;
  }

  /** the live shop (the snapshot) in a tab */
  async function sitePage(tab, page, url, o = {}) {
    Browser.nav(tab, { title: TITLE[page], url, page: 'store', fav: 'store' });
    Browser.loading(tab, true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 600);
    return Store.doc;
  }
  async function storeInto(el, off = 200, ms = 1100) {
    if (!el) return;
    const y = el.getBoundingClientRect().top + Store.doc.defaultView.scrollY - off;
    await Store.scroll(Math.max(0, y), ms);
    await wait(300);
  }
  async function tabTo(id) {
    await Browser.clickTab(id);
    if (Browser.tab(id).page === 'wp' && KY.keys[id]) await EC.show(KY.keys[id]);
  }
  /** the folders of a new file (VS Code makes them when the new file's name has its path) */
  function ensureDirs(path) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length - 1; i++) {
      const d = parts.slice(0, i + 1).join('/'), parent = parts.slice(0, i).join('/');
      if (Code.tree.some((n) => n.path === d)) continue;
      let at = Code.tree.findIndex((n) => n.path === parent) + 1;
      while (at < Code.tree.length && Code.tree[at].dir && Code.tree[at].path.split('/').length === i + 1 && Code.tree[at].path.startsWith(parent + '/') && Code.tree[at].path < d) {
        const p = Code.tree[at].path;
        at++;
        while (at < Code.tree.length && Code.tree[at].path.startsWith(p + '/')) at++;
      }
      Code.tree.splice(at, 0, { path: d, dir: true, open: true });
    }
    Code.renderTree();
  }
  const newFile = async (path) => { ensureDirs(path); await Code.newFile(path); };
  /** a new file in app/Customize: the skeleton pasted, then the lines typedFrom … typedTo of the final file typed */
  async function writeFile(path, final, typedFrom, typedTo, o = {}) {
    const L = final.split('\n');
    await newFile(path);
    await Code.paste([...L.slice(0, typedFrom), ...L.slice(typedTo)].join('\n'), { after: 500 });
    await Code.reveal(Math.max(0, typedFrom - 6), 500);
    await Code.newLineAfter(typedFrom - 1);
    await Code.type(script(L.slice(typedFrom, typedTo), L[typedFrom - 1]), { kps: o.kps || 22 });
    await Code.save({ status: 'U' });
    check(path, final, path.split('/').pop());
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request: the live shop */
  scene('request', async () => {
    Caption.step(1);
    Caption.set('依頼：既存の EC-CUBE 4 のショップに 2 つの改修（README の「改修の依頼」）');
    const t = Code.text('README.md');
    const r1 = lineOf(t, '1. 受注生産'), r2 = lineOf(t, '2. 送料無料');
    await hoverUi(Code.lineEl(r1), { ax: 0.3, hold: 600 });
    Issue.ok(linesRect(r1, r1 + 3, 1100), '受注生産・在庫の表示');
    await wait(3600);
    Issue.ok(linesRect(r2, r2 + 3, 1100), '送料無料の条件');
    await wait(3600);
    Issue.hide();
    // the live product page
    await Win.switchTo('browser');
    await Browser.typeUrl('www.koyama-kyugu.com/products/detail/7');
    await sitePage('live', 'product', WWW + '/products/detail/7');
    mark('live');
    Caption.set('本番の商品ページ：「清芳 前煤竹」は受注生産。いまは商品名の［受注生産］で知らせている');
    const name = Store.doc.querySelector('.detail01');
    if (name) { await hoverUi(name, { hold: 500 }); Issue.show(SR(name, 4), '［受注生産］は商品名に手書き'); }
    await wait(3400);
    Issue.hide();
    const desc = storeText(/製作に約1年程度/, '.detailAsus p, .detailAsus');
    await storeInto(desc, 260);
    Caption.set('納期は説明文の中（「製作に約1年程度お時間をいただきます」）。価格の近くには何も出ていない');
    if (desc) Issue.show(SR(desc, 4), '納期は説明文を読まないと分からない');
    await wait(3800);
    Issue.hide();
    // the guide: the 送料無料 rule
    await Browser.typeUrl('www.koyama-kyugu.com/user_data/guide');
    await sitePage('live', 'guide', WWW + '/user_data/guide');
    const rule = storeText(/55,000円以上/, 'p, li');
    await storeInto(rule, 300, 1400);
    Caption.set('ご購入ガイド：15,000 円以上で送料無料。ただし矢・矢筒を含むご注文は 55,000 円以上');
    if (rule) Issue.ok(SR(rule, 4), '矢・矢筒を含む場合は 55,000 円以上');
    await wait(4200);
    Issue.hide();
  });

  /* 2 — the dev copy: docker compose, the admin */
  scene('devenv', async () => {
    Caption.step(2);
    await Win.switchTo('code');
    await openAt('docker-compose.yml', { top: 14 });
    Caption.set('開発環境：EC-CUBE 4.3 の docker-compose.yml（localhost:8080・SQLite に本番の商品データをコピー）');
    const y = Code.text('docker-compose.yml');
    const pl = lineOf(y, '- 8080:80'), ev = lineOf(y, 'APP_ENV:');
    Issue.ok(linesRect(pl, pl, 600), 'localhost:8080');
    await wait(2400);
    Issue.ok(linesRect(ev, ev + 2, 900), '本番と同じ prod モード・SQLite');
    await wait(2800);
    Issue.hide();
    await panel(false);
    await run('docker compose up -d', ['[+] Running 3/3', ' <span class="tg">✔</span> Network koyama-kyugu-ec_backend          <span class="tg">Created</span>', () => wait(500),
      ' <span class="tg">✔</span> Container koyama-kyugu-ec-mailcatcher-1  <span class="tg">Started</span>', () => wait(900), ' <span class="tg">✔</span> Container koyama-kyugu-ec-ec-cube-1      <span class="tg">Started</span>'], { kps: 18 });
    await wait(600);
    // the admin
    await Win.switchTo('browser');
    await Browser.newTab('admin');
    await Browser.typeUrl('localhost:8080/admin');
    await KY.ec('admin-login', { tab: 'admin', load: 1400 });
    Caption.set('ローカルの EC-CUBE の管理画面にログイン');
    await KY.type('login_id', 'admin', { kps: 10 });
    const pw = EC.field('password');
    if (pw) {
      await clickUi(pw, { kind: 'text', ax: 0.15, after: 60 });
      EC.focus(pw, true);
      for (let k = 1; k <= 8; k++) { D.KeyStrip.key('●'); pw.innerHTML = '•'.repeat(k) + '<span class="demo-caret"></span>'; await D.kw(70); }
      D.KeyStrip.idleHide(600);
      EC.focus(pw, false);
    }
    await clickUi(EC.el('button[type=submit]'), { kind: 'hand', after: 80 });
    await KY.ec('admin-home', { tab: 'admin', load: 1000 });
    await wait(900);
    // 商品管理 (its submenu opens, as the admin's collapse does) → 商品一覧
    const navTop = EC.el('a[href="#nav-product"]') || ecText(/商品管理/, '.c-mainNavArea a');
    if (navTop) { await clickUi(navTop, { kind: 'hand', after: 60 }); const sub = EC.el('#nav-product'); if (sub) sub.classList.add('show'); await wait(300); }
    await clickUi(EC.el('#nav-product a[href$="/admin/product"]') || EC.el('a[href$="/admin/product"]'), { kind: 'hand', after: 60 });
    await KY.ec('admin-products', { tab: 'admin', load: 900 });
    Caption.set('商品管理：本番からコピーした商品（弓・弦・矢・矢筒・弓道着・カケ…）');
    const list = EC.el('table tbody') || EC.el('.c-contentsArea');
    if (list) { Issue.ok(R(list, 2), '本番と同じ商品 ID・カテゴリ'); await wait(3600); Issue.hide(); }
    // 基本設定: the 送料無料 amount
    await Browser.typeUrl('localhost:8080/admin/setting/shop');
    await KY.ec('admin-shop', { tab: 'admin', load: 900 });
    const amount = EC.el('#shop_master_delivery_free_amount');
    const row = amount && (amount.closest('.row') || amount.parentElement);
    Caption.set('基本設定の「送料無料条件（金額）」は 15,000 円の 1 つだけ。矢・矢筒の 55,000 円はコードで');
    if (row) { await hoverUi(amount, { hold: 400 }); Issue.ok(R(row, 4), '送料無料条件：15,000 円'); }
    await wait(3800);
    Issue.hide();
  });

  /* 3 — the entity extension: ProductTrait, proxies, the schema update forgotten */
  scene('entity', async () => {
    Caption.step(3);
    await Win.switchTo('code');
    await Code.panel(false);
    Caption.set('商品に「受注生産」「納期の目安」を追加：app/Customize/Entity/ProductTrait.php（本体の src/ は変えない）');
    const T = src(TRAIT).split('\n');
    const a = T.findIndex((l) => l.includes('    /**')), b = T.findIndex((l) => l.includes('private $lead_time;')) + 1;
    await writeFile(TRAIT, src(TRAIT), a, b);
    const ex = lineOf(Code.text(TRAIT), '@EntityExtension');
    await Code.reveal(Math.max(0, ex - 4), 500);
    Issue.ok(linesRect(ex, ex, 900), '@EntityExtension：Product にトレイトを足す');
    await wait(3000);
    const c1 = lineOf(Code.text(TRAIT), '@ORM\\Column(name="made_to_order"');
    Issue.ok(linesRect(c1, c1 + 7, 1000), 'dtb_product の列：made_to_order・lead_time');
    await wait(3000);
    Issue.hide();
    Caption.set('プロキシを生成：本体の Product クラスにトレイトを組み込んだクラス（app/proxy/entity）を作る');
    await panel(true);
    await run(DC + 'bin/console eccube:generate:proxies', ['', ...consoleOut(DATA.proxies || 'gen -> /var/www/html/app/proxy/entity/src/Eccube/Entity/Product.php')], { kps: 30 });
    Issue.ok(termFind('Product.php', 1, 1000), 'app/proxy/entity/…/Product.php');
    await wait(2400);
    Issue.hide();
    await cacheClear();
    await Code.panel(false);
    // the product page: the system error
    await Win.switchTo('browser');
    await Browser.newTab('shop');
    await Browser.typeUrl('localhost:8080/products/detail/7');
    await KY.ec('front-error', { tab: 'shop', load: 1600 });
    mark('error');
    const msg = ecText(/システムエラー|エラーが発生/, 'h1, h2, h3, p, div');
    Caption.issue('システムエラー', '商品ページが開かない');
    if (msg) Issue.show(R(msg, 6), 'システムエラー');
    await wait(3000);
    Issue.hide();
    // the log
    await Win.switchTo('code');
    await panel(true);
    // EC-CUBE's own log (front-YYYY-MM-DD.log): the message the error page does not show
    const sql = (errLog().match(/SQLSTATE[^"]*/) || ['SQLSTATE[HY000]: General error: 1 no such column: d0_.made_to_order'])[0];
    await run(DC + `grep -o 'SQLSTATE.*made_to_order' ${logFile()}`, [esc(sql)], { kps: 30 });
    Caption.issue('原因', 'no such column: made_to_order — プロキシは作ったが、テーブルに列を追加していない');
    Issue.show(termFind('made_to_order', 1, 1600), 'テーブルに列がない');
    await wait(4200);
    Issue.hide();
    Caption.set('doctrine:schema:update：まず --dump-sql で実行する SQL を確認');
    await run(DC + 'bin/console doctrine:schema:update --dump-sql', ['', ...sqlOut(DATA.schemaDump)], { kps: 30 });
    Issue.ok(termFind('made_to_order', 2, 1300), 'ALTER TABLE dtb_product（2 列の追加だけ）');
    await wait(3400);
    Issue.hide();
    await run(DC + 'bin/console doctrine:schema:update --force', ['', ...consoleOut(DATA.schemaForce)], { kps: 30 });
    await wait(600);
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.reload(async () => { await KY.ec('front-7', { tab: 'shop', load: 0 }); });
    Caption.fixed('列を追加して、商品ページが元どおり表示される（表示はまだ変わらない）');
    await wait(3200);
  });

  /* 4 — the admin product form: FormType extension */
  scene('adminForm', async () => {
    Caption.step(4);
    await Win.switchTo('code');
    Caption.set('商品登録に入力欄：FormType 拡張（AbstractTypeExtension で管理画面の ProductType に項目を追加）');
    const L = src(FORM).split('\n');
    const a = L.findIndex((l) => l.includes('$builder')), b = L.findIndex((l) => l.includes(']);')) + 1;
    await writeFile(FORM, src(FORM), a, b, { kps: 24 });
    const ar = lineOf(Code.text(FORM), "'eccube_form_options'");
    await Code.reveal(Math.max(0, ar - 8), 400);
    Issue.ok(linesRect(ar, ar, 1000), 'auto_render：商品登録の画面に自動で並ぶ');
    await wait(3000);
    const ge = lineOf(Code.text(FORM), 'yield ProductType::class');
    await Code.reveal(ge, 400);
    Issue.ok(linesRect(ge - 2, ge, 900), '拡張する Form：Admin\\ProductType');
    await wait(2400);
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // 商品登録 of 清芳 前煤竹
    await Win.switchTo('browser');
    await tabTo('admin');
    await Browser.typeUrl('localhost:8080/admin/product/product/7/edit');
    await KY.ec('admin-product-7', { tab: 'admin', load: 1200 });
    const tg = EC.el('#admin_product_made_to_order');
    const lt = EC.field('lead_time');
    const rowOf = (e) => e && (e.closest('.row') || e.parentElement);
    Caption.set('商品登録（清芳 前煤竹）：拡張した 2 つの項目が並ぶ');
    if (tg && lt) { Issue.ok(() => { const x = screenRect(rowOf(tg)), y = screenRect(rowOf(lt)); return { left: x.left - 4, top: x.top - 4, width: Math.max(x.width, y.width) + 8, height: y.bottom - x.top + 8 }; }, '受注生産・納期の目安'); await wait(3000); Issue.hide(); }
    Caption.set('受注生産をオンにして、納期の目安「約1年」（説明文の「製作に約1年程度」）');
    await KY.toggle('#admin_product_made_to_order', true);
    await KY.type('lead_time', [JA['約1年']], { kps: 10 });
    const save = ecText(/^\s*登録\s*$/, 'button');
    await clickUi(save || EC.el('button[type=submit]'), { kind: 'hand', after: 80 });
    await KY.ec('admin-product-7-saved', { tab: 'admin', load: 1300 });
    const lt2 = EC.field('lead_time') || EC.el('#admin_product_lead_time');
    if (lt2) Issue.ok(R(rowOf(lt2), 4), '受注生産・約1年');
    Caption.set('ほかの受注生産品も同じく設定（小山雅司：約2年、特作鵠心 アーチカーボン：約8～9ヶ月）');
    await wait(3400);
    Issue.hide();
  });

  /* 5 — the product page: the Twig function and the template */
  scene('badge', async () => {
    Caption.step(5);
    await Win.switchTo('code');
    Caption.set('表示の判定は Twig 拡張に：stock_badge(Product) → 受注生産 / 品切れ中 / 残りわずか（3 点以下）/ 在庫あり');
    const L = src(TWIGX).split('\n');
    const a = L.findIndex((l) => l.includes('if ($Product->isMadeToOrder())')), b = L.findIndex((l, i) => i > a && l === '        }') + 1;
    await writeFile(TWIGX, src(TWIGX), a, b, { kps: 22 });
    const fw = lineOf(Code.text(TWIGX), 'private const FEW');
    await Code.reveal(Math.max(0, fw - 3), 400);
    Issue.ok(linesRect(fw - 1, fw, 900), '残りわずか：在庫 3 点以下');
    await wait(2400);
    const lp = lineOf(Code.text(TWIGX), 'foreach ($Product->getProductClasses()');
    await Code.reveal(lp + 4, 500);
    Issue.ok(linesRect(lp, lp + 9, 900), '規格ごとの在庫を合計（無制限なら在庫あり）');
    await wait(2800);
    Issue.hide();
    // the theme's detail.twig: the empty p.detail04 under the price
    await openAt(DETAIL, { top: 60 });
    const d4 = lineOf(Code.text(DETAIL), SRC.DETAIL_OLD.trim());
    await Code.reveal(d4, 600);
    Caption.set('テーマの Product/detail.twig：価格・送料サイズの下、付属品などの説明（p.detail04）の上に表示する');
    Issue.ok(linesRect(d4 - 7, d4, 1000), '送料サイズ（タグ）と p.detail04');
    await wait(2600);
    Issue.hide();
    await Code.newLineAfter(d4 - 1);
    await Code.type(script(SRC.BADGE, Code.files[DETAIL].lines[d4 - 1]), { kps: 22 });
    await Code.save();
    check(DETAIL, SRC.detail(P[DETAIL], 3), 'detail.twig');
    Issue.ok(linesRect(d4, d4 + SRC.BADGE.length - 1, 1100), 'stock_badge(Product)');
    await wait(2400);
    Issue.hide();
    // customize.css
    await openAt(CSS, { top: 0 });
    const end = Code.files[CSS].lines.length - 1;
    await Code.newLineAfter(end);
    await Code.paste((Code.files[CSS].lines[end] === '' ? '' : '\n') + '\n' + SRC.CSS.slice(1).join('\n'), { after: 400 });
    await Code.save();
    check(CSS, SRC.css(P[CSS], 3).replace(/\n$/, ''), 'customize.css');
    Caption.set('色は customize.css（テーマの CSS は触らない）：受注生産は茶、在庫ありは緑、残りわずかは赤');
    await wait(2600);
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // the product pages
    await Win.switchTo('browser');
    await tabTo('shop');
    await Browser.reload(async () => { await KY.ec('front-7-badge', { tab: 'shop', load: 0 }); });
    const bd = EC.el('p.stockBadges');
    Caption.set('清芳 前煤竹：価格の下に「受注生産　納期 約1年」');
    if (bd) { await hoverUi(bd, { hold: 400 }); Issue.ok(R(bd, 6), '受注生産・納期 約1年'); }
    await wait(3600);
    Issue.hide();
    await Browser.typeUrl('localhost:8080/products/detail/139');
    await KY.ec('front-139', { tab: 'shop', load: 900 });
    Caption.set('三ツカケ 控え無し：在庫 2 点 →「残りわずか」');
    if (EC.el('p.stockBadges')) Issue.ok(R('p.stockBadges', 6), '残りわずか（在庫 2 点）');
    await wait(3200);
    await Browser.typeUrl('localhost:8080/products/detail/93');
    await KY.ec('front-93', { tab: 'shop', load: 900 });
    Caption.set('ショルダー型矢筒：在庫あり');
    if (EC.el('p.stockBadges')) Issue.ok(R('p.stockBadges', 6), '在庫あり');
    await wait(2600);
    Issue.hide();
  });

  /* 6 — the delivery fee rule: PurchaseFlow */
  scene('purchaseflow', async () => {
    Caption.step(6);
    await Win.switchTo('code');
    Caption.set('送料無料の条件：矢（カテゴリ 4 とその下）・矢筒（46）を含むかの判定を 1 か所に（Service/DeliveryFreeRule.php）');
    await newFile(RULE);
    await Code.paste(src(RULE), { after: 500 });
    await Code.save({ status: 'U' });
    const k = lineOf(Code.text(RULE), 'ARROW_FREE_AMOUNT = 55000');
    await Code.reveal(0, 300);
    Issue.ok(linesRect(k, k + 3, 1000), '55,000 円・矢と矢筒のカテゴリ');
    await wait(3000);
    const gp = lineOf(Code.text(RULE), 'getPath()');
    Issue.ok(linesRect(gp, gp + 4, 1000), '親カテゴリまでたどる（アルミ矢 › 1913 も矢）');
    await wait(2600);
    Issue.hide();
    Caption.set('PurchaseFlow のプロセッサー：標準の判定（15,000 円で送料 0 円）のあとに、矢・矢筒なら送料を戻す');
    const L = src(PROC).split('\n');
    const a = L.findIndex((l) => l.includes('$total = 0;')), b = L.findIndex((l) => l.includes('$Item->setQuantity(1);')) + 3;
    await writeFile(PROC, src(PROC), a, b, { kps: 24 });
    const an = lineOf(Code.text(PROC), '@ShoppingFlow');
    await Code.reveal(Math.max(0, an - 6), 500);
    Issue.ok(linesRect(an - 4, an, 1100), '@ShoppingFlow：ご注文手続きのフローに追加');
    await wait(3000);
    const sq = lineOf(Code.text(PROC), 'setQuantity(1)');
    await Code.reveal(sq, 500);
    Issue.ok(linesRect(sq - 6, sq, 1000), '55,000 円未満なら送料の明細を 1 に戻す');
    await wait(2800);
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // the test: 矢筒 + 三ツカケ
    await Win.switchTo('browser');
    Caption.set('テスト会員でログイン済み。三ツカケ（17,600 円）に、矢筒（4,800 円）をカートへ');
    const sel1 = EC.el('#classcategory_id1');
    if (sel1) await hoverUi(sel1, { hold: 300 });
    await clickUi(EC.el('input.add-cart') || EC.el('.add-cart'), { kind: 'hand', after: 80 });
    await KY.ec('cart-1', { tab: 'shop', load: 1200 });
    mark('cart1');
    const free = ecText(/送料無料/, 'p, div, span, strong');
    Caption.set('カート：合計 22,400 円 → 標準の判定のまま「送料無料」と出ている');
    if (free) Issue.show(R(free, 4), '「送料無料」のまま');
    await wait(3400);
    Issue.hide();
    await clickUi(EC.el('a.ec-blockBtn--action[href*="buystep"]') || ecText(/レジに進む/, 'a'), { kind: 'hand', after: 80 });
    await KY.ec('shopping-1', { tab: 'shop', load: 1500 });
    const fee = ecText(/送料/, '.ec-totalBox__spec') || ecText(/送料/, 'dl');
    if (fee) await ecInto(fee, 420);
    Caption.issue('食い違い', 'ご注文手続きでは送料 1,980 円（プロセッサーは正しい）。カートの表示が合っていない');
    if (fee) Issue.ok(R(fee, 4), '送料 1,980 円（東京都・C サイズ）');
    await wait(4200);
    Issue.hide();
  });

  /* 7 — the cart page: EventSubscriber, the test order, 受注管理 */
  scene('cart', async () => {
    Caption.step(7);
    await Win.switchTo('code');
    Caption.set('カートの「あと○円で送料無料」は CartController が計算 → EventSubscriber で Cart/index.twig に渡す値を差し替える');
    const L = src(SUB).split('\n');
    const a = L.findIndex((l) => l.includes("foreach ($event->getParameter('Carts')")), b = L.findIndex((l) => l.includes('$least[$key] = max(')) + 2;
    await writeFile(SUB, src(SUB), a, b, { kps: 24 });
    const ev = lineOf(Code.text(SUB), "'Cart/index.twig' =>");
    await Code.reveal(Math.max(0, ev - 4), 400);
    Issue.ok(linesRect(ev, ev, 900), 'テンプレートのイベント（TemplateEvent）');
    await wait(2600);
    const lq = lineOf(Code.text(SUB), '$least[$key] = max(');
    Issue.ok(linesRect(lq - 1, lq, 1000), '矢・矢筒を含むカートは 55,000 円で計算');
    await wait(2800);
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/cart');
    await KY.ec('cart-2', { tab: 'shop', load: 1000 });
    const least = ecText(/あと/, 'p, div, span');
    Caption.fixed('カート：「あと 32,600 円のお買い上げで送料無料」');
    if (least) Issue.ok(R(least, 4), 'あと 32,600 円');
    await wait(3600);
    Issue.hide();
    Caption.set('テスト注文：ご注文手続き → 確認 → 注文する');
    await clickUi(EC.el('a.ec-blockBtn--action[href*="buystep"]') || ecText(/レジに進む/, 'a'), { kind: 'hand', after: 80 });
    await KY.ec('shopping-2', { tab: 'shop', load: 1300 });
    const btn = EC.el('#shopping-form button.ec-blockBtn--action') || ecText(/確認する/, 'button');
    if (btn) { await ecInto(btn, 600); await clickUi(btn, { kind: 'hand', after: 80 }); }
    await KY.ec('confirm', { tab: 'shop', load: 1300 });
    const ord = EC.el('#shopping-form button.ec-blockBtn--action') || ecText(/注文する/, 'button');
    if (ord) { await ecInto(ord, 600); await clickUi(ord, { kind: 'hand', after: 80 }); }
    await KY.ec('complete', { tab: 'shop', load: 1600 });
    await wait(1600);
    // 受注管理
    await tabTo('admin');
    await Browser.typeUrl('localhost:8080/admin/order');
    await KY.ec('admin-orders', { tab: 'admin', load: 1100 });
    Caption.set('受注管理：いまのテスト注文');
    const oid = DATA.order ? DATA.order.id : 1;
    const link = EC.el(`a[href*="/order/${oid}/edit"]`);
    if (link) { await hoverUi(link, { hold: 500 }); await clickUi(link, { kind: 'hand', after: 80 }); }
    await KY.ec('admin-order-edit', { tab: 'admin', load: 1200 });
    const fe = ecText(/^\s*送料\s*$/, 'span, label, div, th, td, dt') || ecText(/送料/, 'span, label, div, th, td, dt');
    const feRow = fe && (fe.closest('.row') || fe.parentElement);
    if (feRow) { await ecInto(feRow, 380); Issue.ok(R(feRow, 4), `送料 ${((DATA.order && DATA.order.fee) || 1980).toLocaleString()} 円で受注`); }
    Caption.fixed('受注にも送料が入っている（商品 22,400 円 ＋ 送料 1,980 円）');
    await wait(3800);
    Issue.hide();
  });

  /* 8 — git, the production server, the live shop */
  scene('deploy', async () => {
    Caption.step(8);
    await Win.switchTo('code');
    await panel(true);
    W11.skipTo('11:52');
    const added = [TRAIT, FORM, TWIGX, RULE, PROC, SUB];
    const ins = added.reduce((n, p) => n + src(p).split('\n').length - 1, 0) + SRC.BADGE.length + SRC.CSS.length;
    Caption.set('コミットしてプッシュ');
    await run('git add -A; git commit -m "受注生産・在庫の表示、矢・矢筒を含む場合の送料無料の条件"', [
      esc('[main 7d4e1a9] 受注生産・在庫の表示、矢・矢筒を含む場合の送料無料の条件'),
      ` 8 files changed, ${ins} insertions(+), 1 deletion(-)`,
      ...added.map((p) => ` create mode 100644 ${p}`)], { kps: 34 });
    await run('git push', ['To github.com:koyama-kyugu/koyama-kyugu-ec.git', '   b81c03e..7d4e1a9  main -&gt; main'], { kps: 20 });
    Caption.set('本番サーバーへ反映：プロキシの生成・スキーマの更新・キャッシュの削除（README の手順）');
    await run('ssh koyama-prod', ['Last login: Tue Sep  1 18:12:40 2026'], { kps: 16 });
    AP.Shell.remote('deploy', 'koyama-prod', 'ec-cube');
    Term.render('<span class="caret"></span>');
    await run('git pull --ff-only && composer install --no-dev --optimize-autoloader -q', ['Updating b81c03e..7d4e1a9', 'Fast-forward', ...added.map((p) => ` ${p}`), ` ${DETAIL}`, ` ${CSS}`, ` 8 files changed, ${ins} insertions(+), 1 deletion(-)`], { kps: 26 });
    await run('bin/console eccube:generate:proxies', consoleOut(DATA.proxies || ''), { kps: 30 });
    await run('bin/console doctrine:schema:update --dump-sql --force', ['', ...sqlOut(DATA.schemaDump).filter((l) => l.trim()), '', ...consoleOut(DATA.schemaForce)], { kps: 30 });
    Issue.ok(termFind('made_to_order', 1, 1300), '本番にも列を追加');
    await wait(2200);
    Issue.hide();
    await run('bin/console cache:clear --no-warmup', [' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.'], { kps: 30 });
    await run('exit', ['logout', 'Connection to koyama-prod closed.'], { kps: 12 });
    AP.Shell.local();
    Term.render('<span class="caret"></span>');
    // the live shop
    await Win.switchTo('browser');
    await tabTo('live');
    Caption.set('本番の管理画面で受注生産の商品に納期を設定 → 公開中の商品ページ');
    await Browser.typeUrl('www.koyama-kyugu.com/products/detail/7');
    await sitePage('live', 'product', WWW + '/products/detail/7', { states: ['badge'] });
    mark('live2');
    const bd = Store.doc.querySelector('p.stockBadges');
    if (bd) { await hoverUi(bd, { hold: 400 }); Issue.ok(SR(bd, 6), '受注生産・納期 約1年'); }
    await wait(3800);
    Issue.hide();
    Cursor.kind('arrow');
    Caption.set('既存の EC-CUBE 4 に：受注生産・納期・在庫の表示（エンティティ拡張・FormType 拡張・Twig 拡張）と送料無料の条件（PurchaseFlow・EventSubscriber）');
    await wait(4800);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['product', 'guide'],
    fontText: JSON.stringify(JA) + Object.values(TITLE).join('') + P['README.md'] + Object.values(SRC.source).join('') + SRC.CSS.join('') + '受注生産納期約年在庫あり残りわずか品切れ中送料無料あと円のお買い上げで',
    async prepare() {
      const tree = [
        ['app', 'dir', 1], ['app/Customize', 'dir', 1], ['app/Customize/Entity', 'dir', 0],
        ['app/template', 'dir', 1], ['app/template/default', 'dir', 1], ['app/template/default/Product', 'dir', 1], [DETAIL], ['app/template/default/default_frame.twig'],
        ['bin', 'dir', 0], ['html', 'dir', 1], ['html/user_data', 'dir', 1], ['html/user_data/assets', 'dir', 1], ['html/user_data/assets/css', 'dir', 1], [CSS],
        ['src', 'dir', 0], ['var', 'dir', 0], ['vendor', 'dir', 0],
        ['composer.json'], ['docker-compose.yml'], ['README.md'],
      ];
      Code.init({ ...P }, tree);
      for (const p of Object.keys(P)) if (/\.(php|twig|css)$/.test(p)) Code.files[p].indent = '    ';
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: '新しいタブ', url: '', page: 'blank', fav: 'blank' });
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
