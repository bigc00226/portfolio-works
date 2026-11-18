/*
 * Timeline: CAGIANA《カジーナ》(cagiana.jp, EC-CUBE 3) → EC-CUBE 4.3 — the data migration:
 * the survey (the live shop's ?v=3.0.17, plugin traces, the old copy's counts) → the backup (EC-CUBE's backup plugin for 3.0:
 * CSV tar.gz, the pictures, auth_magic) → EC-CUBE 4.3 (the data migration plugin, its libraries, install / enable) → the
 * migration: システムエラー on SQLite (the log: PostgreSQL's SET), the patch, ECCUBE_AUTH_MAGIC, the run → the counts and
 * records in both admins, a migrated member's login → the pictures, the theme (Twig 3) → the old URLs (check, 301) → the
 * switch-over (members / orders only, DNS, the live shop).
 * Every EC-CUBE screen is real (js/ec-snapshot.js — capture-ec3.js: EC-CUBE 3.0.18-p7, capture-ec.js: EC-CUBE 4.3.1-p1 with
 * the migration really run); the live shop is js/site-snapshot.js. bin/console / app/console output, the log line, the tar
 * listing, the counts SQL and the URL statuses are real; docker, composer's download lines, ssh, DNS and the switch-over are
 * reconstructions (docs/videos/ec-cagiana-migration.md).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, EC = window.EC, W11 = window.Win11, AP = window.AP, CG = window.CG;
  const P = window.CAGIANA_PROJECT;
  const { esc, wait, Cursor, Caption, Issue, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const FILES = F.files, SRC = F.SRC;
  const DATA = (window.EC_SNAPSHOT && window.EC_SNAPSHOT.data) || {};
  const C3 = (DATA.ec3 && DATA.ec3.counts) || {};
  const C3b = (DATA.ec3 && DATA.ec3.counts2) || {};
  const C4 = DATA.after || {};
  const C4b = DATA.after2 || {};
  const has = (k) => !!(window.EC_SNAPSHOT && window.EC_SNAPSHOT.pages[k]);
  const PLUGIN = SRC.PLUGIN, ENV = '.env', CONF3 = 'migration/ec3/config.yml', DETAIL = 'app/template/cagiana/Product/detail.twig', FRAME = 'app/template/cagiana/default_frame.twig';
  const SUB = SRC.SUBSCRIBER_PATH, CHECK = SRC.CHECK_PATH, URLS = 'scripts/old-urls.txt';
  const BACKUP = 'backup_20261014104512.tar.gz', BACKUP2 = 'backup_20261014210408.tar.gz';
  const TITLE = { home: (S.pages.home && S.pages.home.title) || S.title, product: (S.pages.product && S.pages.product.title) || 'AKATSUKI《暁》 Black', list: (S.pages.list && S.pages.list.title) || S.title };
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); if (Code.ins && Code.active) { Code.ensureVisible(Code.ins.line); Code.render(); } Term.render('<span class="caret"></span>'); };
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) { const f = Code.files[path]; if (f && /\.(php|twig)$/.test(path)) f.indent = '    '; show0(path, o); };

  /* ------------------------------------------------ what the commands print */
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 26, ...o });
  const DC = 'docker compose exec ec-cube ';
  /** console output as captured, the paths inside the container */
  const consoleOut = (text) => String(text || '').replace(/\/srv\/eccube/g, '/var/www/html').replace(/\r/g, '').split('\n').map((l) => esc(l).replace(/^(\s*)\[OK\]/, '$1<span class="tg">[OK]</span>')).filter((l, i, a) => !(l.trim() === '' && (i === 0 || a[i - 1].trim() === '')));
  /** eccube:plugin:install / enable: their own lines up to the cache:clear they start at the end (run separately below) */
  const pluginOut = (text) => consoleOut(String(text || '').split(/\n\s*\n?In Process\.php|\[\d{4}-\d\d-\d\dT/)[0]).filter((l) => l.trim() && !/onConsoleError|Unable to launch/.test(l)).slice(0, 6);
  const cacheClear = () => run(DC + 'bin/console cache:clear --no-warmup', ['', ' // Clearing the cache for the <span class="tc">prod</span> environment with debug <span class="tc">false</span>', '',
    ' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.', ''], { kps: 30 });
  /** the tar listing (captured): the capture's date and time → the backup's */
  const tarList = () => (DATA.backup1 && DATA.backup1.list ? DATA.backup1.list : []).map((l) => esc(l.replace(/\b(Nov|11月)\s+18\s+\d\d:\d\d/, 'Oct 14 10:45')));
  const tarPick = () => { const L = tarList(); const want = ['dtb_base_info', 'dtb_category.csv', 'dtb_customer.csv', 'dtb_order.csv', 'dtb_order_detail', 'dtb_product.csv', 'dtb_product_class', 'dtb_product_image', 'dtb_shipping.csv']; const out = L.filter((l) => want.some((w) => l.includes(w))); return [...out, esc(`… ${L.length} files`)]; };
  /** EC-CUBE 4's log line (captured): the capture's date → the video's */
  const errLog = () => {
    const L = DATA.errorLog && DATA.errorLog.lines ? DATA.errorLog.lines : [];
    const line = L.find((l) => /SQLSTATE/.test(l)) || L[0] || '';
    const m = /(SQLSTATE\[[^\]]+\]: [^"\\]*?(?:syntax error|error)[^"\\]*)/.exec(line);
    return { file: ((DATA.errorLog && DATA.errorLog.file) || 'var/log/prod/admin.log').replace(/\d{4}-\d{2}-\d{2}/, '2026-10-14'), text: m ? m[1] : 'SQLSTATE[HY000]: General error: 1 near "SET": syntax error' };
  };
  /** status codes (captured): [code, location, url] */
  const urlLines = (rows, onlyBad) => rows.filter((r) => !onlyBad || r[0] !== 200).map((r) => `<span class="${r[0] >= 400 ? 't404' : r[0] >= 300 ? 't3xx' : ''}">${r[0]}</span> ${esc(r[1] ? r[1] + ' ' : '')}${esc(r[2])}`);

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
  /** the smallest visible element of the screen on show whose text matches */
  const ecText = (re, sel = 'body *') => EC.els(sel).filter((e) => re.test(e.textContent) && e.getBoundingClientRect().width > 0).sort((a, b) => a.textContent.length - b.textContent.length)[0] || null;
  const storeText = (re, sel = 'body *') => (Store.doc ? [...Store.doc.querySelectorAll(sel)] : []).filter((e) => re.test(e.textContent) && e.getBoundingClientRect().width > 0).sort((a, b) => a.textContent.length - b.textContent.length)[0] || null;
  async function ecInto(el, off = 260, ms = 900) {
    if (!el) return null;
    const win = el.ownerDocument.defaultView;
    const y = el.getBoundingClientRect().top + win.scrollY - off;
    await EC.scroll(Math.max(0, y), ms);
    await wait(250);
    return el;
  }
  const frame = async (el, label, o = {}) => { if (!el) return; if (o.scroll !== false) await ecInto(el, o.off || 300); if (o.hover) await hoverUi(el, { hold: 300 }); const box = R(el, o.pad != null ? o.pad : 4); if (o.bad) Issue.show(box, label); else Issue.ok(box, label); await wait(o.hold || 3000); Issue.hide(); };

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
    const t = Browser.tab(id);
    if (t.page === 'wp' && CG.keys[id]) await EC.show(CG.keys[id]);
    if (t.page === 'store' && t.store) await Store.load(t.store, {});
  }
  /** before the pictures are copied (scene 6) the shop's product pictures were 404 on the dev copy: drawn broken, as they were */
  const noImages = (key) => { const d = EC.doc(key); if (d) d.querySelectorAll('img[src*="save_image"]').forEach((i) => { i.removeAttribute('srcset'); i.src = 'data:,'; }); };
  /** an EC screen, if it was captured */
  const ec = async (key, o) => (has(key) ? CG.ec(key, o) : null);
  /** the folders of a new file */
  function ensureDirs(path) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length - 1; i++) {
      const d = parts.slice(0, i + 1).join('/'), parent = parts.slice(0, i).join('/');
      if (Code.tree.some((n) => n.path === d)) continue;
      const at = Code.tree.findIndex((n) => n.path === parent) + 1;
      Code.tree.splice(at, 0, { path: d, dir: true, open: true });
    }
    Code.renderTree();
  }
  /** the old copy's folder in the terminal (cd ..\cagiana-ec3) */
  const PROMPT = Term.prompt;
  const cdOld = async () => { await run('cd ..\\cagiana-ec3', [], { kps: 22 }); Term.prompt = PROMPT.replace('cagiana-ec4', 'cagiana-ec3'); Term.render('<span class="caret"></span>'); };
  const cdNew = async () => { await run('cd ..\\cagiana-ec4', [], { kps: 22 }); Term.prompt = PROMPT; Term.render('<span class="caret"></span>'); };
  /** the plugin's upload form: the file chosen, then アップロード */
  async function uploadBackup(name, o = {}) {
    const box = EC.el('input[type=file]');
    if (box) { await clickUi(box, { kind: 'hand', ax: 0.12, after: 120 }); }
    Caption.set(o.caption || `ファイルを選択：migration\\${name}`);
    await wait(1600);
    if (o.delta) {
      const cb = EC.el('#upload-form input[type=checkbox]');
      if (cb) { await clickUi(cb, { kind: 'hand', after: 120 }); cb.checked = true; }
    }
    const btn = EC.el('#upload-button') || ecText(/アップロード|移行/, 'button');
    if (btn) { await ecInto(btn, 500); await clickUi(btn, { kind: 'hand', after: 100 }); }
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the survey: the live shop, the old copy's admin */
  scene('survey', async () => {
    Caption.step(1);
    Caption.set('依頼：EC-CUBE 3 で動いているショップを EC-CUBE 4.3 へ。まず旧サイトの棚卸し（README）');
    const t = Code.text('README.md');
    const r = lineOf(t, '## 棚卸し');
    await Code.reveal(r, 500);
    Issue.ok(linesRect(r + 2, r + 11, 1100), '商品・カテゴリ・会員・受注・プラグイン・テーマ');
    await wait(3800);
    Issue.hide();
    await Win.switchTo('browser');
    await Browser.typeUrl('cagiana.jp/ec');
    await sitePage('live', 'home', CG.LIVE + '/ec');
    mark('live');
    Caption.set('本番 cagiana.jp：パターンオーダーの靴（ス・ミズーラ）のショップ');
    await wait(2600);
    await Browser.typeUrl('cagiana.jp/products/detail/103');
    await sitePage('live', 'product', CG.LIVE + '/products/detail/103');
    const name = Store.doc.querySelector('.item_name');
    if (name) { await hoverUi(name, { hold: 400 }); Issue.ok(SR(name.closest('#item_detail_area') || name, 4), '商品 ID 103 — AKATSUKI《暁》'); }
    Caption.set('商品ページ /products/detail/103：この URL は検索エンジンや SNS にも載っている');
    await wait(3400);
    Issue.hide();
    // the version and the plugins from the public HTML
    await Win.switchTo('code');
    await panel(true);
    Caption.set('公開中の HTML から、EC-CUBE のバージョンとプラグインを確認');
    await run("curl.exe -s https://cagiana.jp/ec | Select-String 'v=3\\.0'", P.live.version.map(esc), { kps: 28 });
    Issue.show(termFind('3.0.17', 1, 1100), 'EC-CUBE 3.0.17（3 系はサポート終了）');
    await wait(3400);
    Issue.hide();
    await run("curl.exe -s https://cagiana.jp/products/detail/103 | Select-String 'plugin'", P.live.plugins.map(esc), { kps: 28 });
    Issue.ok(termFind('パンくず', 3, 1100), 'パンくずリスト・メーカー管理のプラグイン');
    await wait(3200);
    Issue.hide();
    await Code.panel(false);
    // the old copy
    await Win.switchTo('browser');
    await Browser.newTab('old');
    await Browser.typeUrl('localhost:8030/admin');
    await ec('ec3-login', { tab: 'old', load: 1200 });
    Caption.set('旧環境：本番のファイルと DB から作ったローカルの EC-CUBE 3（3.0 系の最終版 3.0.18-p7 で起動）');
    await CG.type('login_id', 'admin', { kps: 10 });
    await CG.password('password');
    await clickUi(EC.el('button[type=submit]'), { kind: 'hand', after: 80 });
    await ec('ec3-home', { tab: 'old', load: 1000 });
    await wait(1600);
    await Browser.typeUrl('localhost:8030/admin/product');
    await ec('ec3-products', { tab: 'old', load: 1000 });
    await frame(ecText(/件\s*が該当/), `商品 ${C3.products || 37} 件`, { off: 400 });
    await Browser.typeUrl('localhost:8030/admin/customer');
    await ec('ec3-customers', { tab: 'old', load: 900 });
    Caption.set('会員・受注も件数を控える（会員・注文者の情報はダミー）');
    await frame(ecText(/件\s*が該当/), `会員 ${C3.customers || 12} 件`, { off: 400, hold: 2400 });
    await Browser.typeUrl('localhost:8030/admin/order');
    await ec('ec3-orders', { tab: 'old', load: 900 });
    await frame(ecText(/件\s*が該当/), `受注 ${C3.orders || 16} 件`, { off: 400, hold: 2600 });
  });

  /* 2 — the backup: the plugin, the CSV tar.gz, the pictures, auth_magic */
  scene('backup', async () => {
    Caption.step(2);
    await Win.switchTo('code');
    await panel(true);
    Caption.set('EC-CUBE 公式の「EC-CUBE4系移行用バックアッププラグイン（3.0 系）」を旧環境に入れる');
    await cdOld();
    await run('php app/console plugin:develop install --path=DataBackup3.tar.gz', ['success'], { kps: 28 });
    await run('php app/console plugin:develop enable --code=DataBackup3', ['success'], { kps: 28 });
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8030/admin/store/plugin');
    await ec('ec3-plugins', { tab: 'old', load: 1000 });
    await frame(ecText(/移行用バックアッププラグイン/, 'td, div, span, a'), 'DataBackup3 1.0.0（有効）', { off: 360, pad: 6 });
    await Browser.typeUrl('localhost:8030/admin/plugin/DataBackup3/config');
    await ec('ec3-backup', { tab: 'old', load: 900 });
    Caption.set('バックアップ実行：全テーブルを CSV にして tar.gz でダウンロード');
    const btn = ecText(/バックアップ\s*実行/, 'button');
    if (btn) await clickUi(btn, { kind: 'hand', after: 120 });
    await wait(1400);
    await Browser.download(BACKUP, '35 KB');
    mark('backup');
    await Win.switchTo('code');
    await panel(true);
    await cdNew();
    Caption.set('中身：テーブルごとの CSV（dtb_product・dtb_customer・dtb_order …）');
    await run(`tar -tzvf migration\\${BACKUP}`, tarPick(), { kps: 30 });
    Issue.ok(termFind('dtb_product.csv', 1, 1300), '商品・会員・受注… 1 テーブル 1 CSV');
    await wait(3200);
    Issue.hide();
    Caption.set('商品画像はファイル（html/upload/save_image）なので別に退避');
    await run('Copy-Item ..\\cagiana-ec3\\html\\upload\\save_image migration\\save_image -Recurse; (Get-ChildItem migration\\save_image).Count', [String(DATA.images ? DATA.images.count : 146)], { kps: 26 });
    await Code.panel(false);
    // auth_magic
    await openAt(CONF3, { top: 0 });
    const am = lineOf(Code.text(CONF3), 'auth_magic');
    Caption.set('旧サイトの config.yml：会員・管理者のパスワードは auth_magic と組み合わせて保存されている（値はローカルのコピーのもの）');
    Issue.ok(linesRect(am, am + 1, 900), 'auth_magic・sha256 → 新しい .env へ');
    await wait(4200);
    Issue.hide();
  });

  /* 3 — EC-CUBE 4.3: the dev copy, the data migration plugin */
  scene('prepare', async () => {
    Caption.step(3);
    await panel(true);
    Caption.set('移行先：EC-CUBE 4.3.1-p1 の開発環境（localhost:8080・SQLite）');
    await run('docker compose up -d', ['[+] Running 2/2', ' <span class="tg">✔</span> Network cagiana-ec4_default       <span class="tg">Created</span>', () => wait(700),
      ' <span class="tg">✔</span> Container cagiana-ec4-ec-cube-1  <span class="tg">Started</span>'], { kps: 18 });
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.newTab('dev');
    await Browser.typeUrl('localhost:8080/admin');
    await ec('admin-login', { tab: 'dev', load: 1200 });
    await CG.type('login_id', 'admin', { kps: 10 });
    await CG.password('password');
    await clickUi(EC.el('button[type=submit]'), { kind: 'hand', after: 80 });
    await ec('admin-home', { tab: 'dev', load: 1000 });
    Caption.set('インストールしたばかりの EC-CUBE 4.3（サンプルの商品だけ）');
    await wait(2600);
    // the plugin
    await Win.switchTo('code');
    await openAt('app/Plugin/DataMigration42/composer.json', { top: 0 });
    Caption.set('「データ移行プラグイン for EC-CUBE4」の 4.3 対応版（DataMigration42）を app/Plugin へ。依存ライブラリは composer で');
    const cj = Code.text('app/Plugin/DataMigration42/composer.json');
    const rq = lineOf(cj, '"require"');
    Issue.ok(linesRect(rq, rq + 6, 900), 'archive_tar・unified-archive・bulk-insert-query');
    await wait(3600);
    Issue.hide();
    await panel(true);
    const deps = DATA.deps || [];
    await run(DC + 'composer require pear/archive_tar wapmorgan/unified-archive:^1.1 nobuhiko/bulk-insert-query', [
      './composer.json has been updated', 'Loading composer repositories with package information', 'Updating dependencies', `Lock file operations: ${deps.length} installs, 0 updates, 0 removals`,
      () => wait(900), ...deps.map((d) => `  - Installing ${esc(d.name)} (${esc(d.version)})`), 'Generating optimized autoload files'], { kps: 24 });
    Caption.set('インストールと有効化（bin/console）');
    await run(DC + 'bin/console eccube:plugin:install --code=DataMigration42', ['', ...pluginOut(DATA.install)], { kps: 30 });
    await run(DC + 'bin/console eccube:plugin:enable --code=DataMigration42', ['', ...pluginOut(DATA.enable)], { kps: 30 });
    await cacheClear();
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/admin/store/plugin');
    await ec('admin-plugins', { tab: 'dev', load: 1200 });
    await frame(ecText(/データ移行プラグイン/, 'td, a, span, div'), `データ移行プラグイン ${(DATA.pluginState && DATA.pluginState.version) || '4.3.0'}（有効）`, { off: 360, pad: 6, hold: 3000 });
    await Browser.typeUrl('localhost:8080/admin/data_migration42/config');
    await ec('dm-config', { tab: 'dev', load: 1000 });
    Caption.set('プラグインの画面：移行後に ECCUBE_AUTH_MAGIC を旧サイトの値にする、と案内がある');
    await frame(ecText(/ECCUBE_AUTH_MAGIC を旧サイト|ECCUBE_AUTH_MAGICを旧サイト/, 'li, div'), 'AUTH_MAGIC を旧サイトの値に', { off: 300, hold: 3600 });
  });

  /* 4 — the migration: the error on SQLite, the patch, AUTH_MAGIC, the run */
  scene('migrate', async () => {
    Caption.step(4);
    Caption.set('バックアップの tar.gz を選んで取り込む');
    await uploadBackup(BACKUP);
    await ec('dm-error', { tab: 'dev', load: 2600 });
    mark('error');
    Caption.issue('システムエラー', '取り込みが途中で止まった');
    const msg = ecText(/システムエラー/, 'h1, h2, h3, p, div');
    if (msg) Issue.show(R(msg, 8), 'システムエラーが発生しました');
    await wait(3200);
    Issue.hide();
    await Win.switchTo('code');
    await panel(true);
    const E = errLog();
    await run(DC + `grep -o 'SQLSTATE[^"]*' ${E.file} | tail -1`, [esc(E.text)], { kps: 30 });
    Caption.issue('原因', 'SET session_replication_role は PostgreSQL の SQL — 開発環境の SQLite では通らない');
    Issue.show(termFind('SQLSTATE', 1, 1500), 'near "SET": syntax error');
    await wait(4200);
    Issue.hide();
    await Code.panel(false);
    // the plugin's code
    await openAt(PLUGIN, { top: 175 });
    const T = Code.text(PLUGIN);
    const s1 = lineOf(T, "SET session_replication_role");
    await Code.reveal(s1 - 4, 600);
    Caption.set('プラグインは「MySQL かそれ以外（＝PostgreSQL）」の 2 通り。SQLite は想定していない');
    Issue.show(linesRect(s1 - 4, s1 + 1, 1000), 'else = PostgreSQL 用');
    await wait(3800);
    Issue.hide();
    Caption.set('else を PostgreSQL のときだけに（同じ 4 か所）。SQLite ではそのまま進む');
    await Code.overwrite('} else {', [{ direct: SRC.ELSE_NEW_LINE }], { from: s1 - 2, kps: 22 });
    // the other three: the same replacement (Ctrl+H)
    if (D.Keycap && D.Keycap.show) await D.Keycap.show(['Ctrl', 'H'], 700);
    const fixed = SRC.patch(Code.text(PLUGIN));
    const withoutSeq = fixed.src.replace(SRC.SEQ_GUARD.join('\n') + '\n', '');
    Code.files[PLUGIN].lines = withoutSeq.split('\n');
    Code.render();
    await wait(1200);
    const sq = lineOf(Code.text(PLUGIN), 'private function setIdSeq');
    await Code.reveal(sq, 700);
    Caption.set('setIdSeq() は PostgreSQL のシーケンス（pg_class・setval）。SQLite の AUTOINCREMENT は最大の id から続く');
    Issue.show(linesRect(sq, sq + 8, 1000), 'pg_class は SQLite にない');
    await wait(3400);
    Issue.hide();
    await Code.newLineAfter(sq + 1);
    await Code.type(K.codeScript(SRC.SEQ_GUARD, {}, { unit: '    ', after: Code.files[PLUGIN].lines[sq + 1] }), { kps: 22 });
    await Code.save();
    check(PLUGIN, fixed.src, 'ConfigController.php');
    Issue.ok(linesRect(sq + 2, sq + 4, 1000), 'PostgreSQL のときだけ');
    await wait(2400);
    Issue.hide();
    // .env: ECCUBE_AUTH_MAGIC
    await openAt(ENV, { top: 30 });
    const am = lineOf(Code.text(ENV), 'ECCUBE_AUTH_MAGIC=');
    await Code.reveal(am, 500);
    Caption.set('.env の ECCUBE_AUTH_MAGIC を旧サイトの auth_magic に（会員・管理者のパスワードがそのまま使える）');
    const old = Code.files[ENV].lines[am].slice('ECCUBE_AUTH_MAGIC='.length);
    await Code.overwrite(old, [{ direct: DATA.authMagic || 'Xq7mTzR4vKc2WnB8sYhL5dPa9GfJ3eUo' }], { from: am, kps: 30 });
    await Code.save();
    Issue.ok(linesRect(am, am, 900), 'config.yml の auth_magic と同じ値');
    await wait(2600);
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // again
    await Win.switchTo('browser');
    await Browser.reload(async () => { await ec('dm-config', { tab: 'dev', load: 0 }); });
    Caption.set('もう一度取り込む');
    await uploadBackup(BACKUP);
    if (has('admin-login-2')) {
      await ec('admin-login-2', { tab: 'dev', load: 3600 });
      Caption.set('管理者も旧サイトのものに置き換わったので、ログインし直す（旧サイトと同じ ID・パスワード）');
      await CG.type('login_id', 'admin', { kps: 10 });
      await CG.password('password');
      await clickUi(EC.el('button[type=submit]'), { kind: 'hand', after: 80 });
    }
    await ec('dm-done', { tab: 'dev', load: 1600 });
    mark('migrated');
    Caption.fixed('今度はエラーなし。完了のメッセージはログアウトで消えたので、件数と中身で確かめる');
    await wait(3600);
  });

  /* 5 — the counts and records in both admins, a member's login */
  scene('verify', async () => {
    Caption.step(5);
    await Win.switchTo('code');
    await panel(true);
    Caption.set('件数を照合：新しい DB を数える');
    await run(DC + 'bin/console dbal:run-sql "SELECT (SELECT COUNT(*) FROM dtb_product) AS products, (SELECT COUNT(*) FROM dtb_category) AS categories, (SELECT COUNT(*) FROM dtb_customer) AS customers, (SELECT COUNT(*) FROM dtb_order) AS orders"', consoleOut(DATA.countSql), { kps: 40 });
    Issue.ok(termFind('products', 3, 1100), `旧 ${C3.products}・${C3.categories}・${C3.customers}・${C3.orders} → 新 ${C4.products}・${C4.categories}・${C4.customers}・${C4.orders}`);
    await wait(4200);
    Issue.hide();
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/admin/product');
    await ec('admin-products', { tab: 'dev', load: 1100 });
    Caption.set('商品一覧：商品 ID・商品名・画像のファイル名もそのまま');
    await wait(2600);
    await Browser.typeUrl('localhost:8080/admin/product/product/103/edit');
    await ec('admin-product-103', { tab: 'dev', load: 1100 });
    await frame(EC.el('#admin_product_name') ? EC.el('#admin_product_name').closest('.row') || EC.el('#admin_product_name') : null, '新：AKATSUKI《暁》 Black', { off: 300, hold: 2200 });
    const pr = EC.el('#admin_product_class_price02');
    if (pr) await frame(pr.closest('.row') || pr, '販売価格 118,000 円（税抜）', { off: 320, hold: 2400 });
    await tabTo('old');
    await Browser.typeUrl('localhost:8030/admin/product/product/103/edit');
    await ec('ec3-product-103', { tab: 'old', load: 900 });
    Caption.set('旧サイトの同じ商品と見比べる（商品名・価格・商品コード・説明・画像）');
    const pr3 = EC.el('#admin_product_class_price02');
    if (pr3) await frame(pr3.closest('.form-group') || pr3, '旧：118,000 円', { off: 320, hold: 2600 });
    // members, orders
    await tabTo('dev');
    await Browser.typeUrl('localhost:8080/admin/customer');
    await ec('admin-customers', { tab: 'dev', load: 1000 });
    await frame(ecText(/検索結果[:：]?\s*\d+\s*件|\d+\s*件が該当/), `会員 ${C4.customers} 件`, { off: 400, hold: 2600 });
    await Browser.typeUrl('localhost:8080/admin/order/7/edit');
    await ec('admin-order-7', { tab: 'dev', load: 1200 });
    Caption.set('受注 7（見本 花子・AKATSUKI《暁》 Extra Color）：商品・金額・対応状況は旧サイトと同じ');
    const tot = ecText(/129,800/, 'td, span, div, strong');
    if (tot) await frame(tot.closest('tr, .row') || tot, '129,800 円（旧サイトと同じ）', { off: 420, hold: 3000 });
    else await wait(3000);
    Caption.issue('確認リストへ', '明細の規格名（旧：ダークブラウン）はプラグインでは移らない → 受注の備考に追記して運用で補う');
    await wait(4200);
    // a member logs in with the old password
    await Browser.newTab('shop');
    await Browser.typeUrl('localhost:8080/mypage/login');
    await ec('front-login', { tab: 'shop', load: 1200 });
    Caption.set('移行した会員で、旧サイトのパスワードのままログインできるか');
    await CG.type('login_email', 'sample02@example.com', { kps: 14 });
    await CG.password('login_pass', 11);
    const lb = ecText(/^\s*ログイン\s*$/, 'button') || EC.el('button[type=submit]');
    if (lb) await clickUi(lb, { kind: 'hand', after: 80 });
    await ec('front-mypage', { tab: 'shop', load: 1400 });
    noImages('front-mypage');
    const hist = EC.el('.ec-historyRole') || ecText(/ご注文番号|注文番号/, 'div, dl, dt, span');
    Caption.fixed('ログインできた：パスワードも注文履歴も移っている');
    if (hist) await frame(hist, '旧サイトの注文履歴', { off: 300, hold: 3400 });
    else await wait(3400);
  });

  /* 6 — the pictures and the theme */
  scene('theme', async () => {
    Caption.step(6);
    await Browser.typeUrl('localhost:8080/products/detail/103');
    await ec('front-103-noimg', { tab: 'shop', load: 1300 });
    noImages('front-103-noimg');
    mark('noimg');
    Caption.issue('画像が出ない', 'DB には画像のファイル名が入ったが、ファイルはまだ旧サーバーにある');
    const img = EC.el('.item_visual img, .ec-sliderItemRole img, img');
    if (img) Issue.show(R(img.closest('.item_visual, .ec-sliderItemRole, div') || img, 4), '画像のファイルがない');
    await wait(3400);
    Issue.hide();
    await Win.switchTo('code');
    await panel(false);
    await run('Copy-Item migration\\save_image\\* html\\upload\\save_image\\; (Get-ChildItem html\\upload\\save_image -File).Count', [String(DATA.imagesCopied || 146)], { kps: 26 });
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.reload(async () => { await ec('front-103-img', { tab: 'shop', load: 0 }); });
    Caption.set('画像が出た。ただし見た目は EC-CUBE 4 の標準テーマ');
    await wait(2800);
    // the theme
    await Win.switchTo('code');
    await openAt(DETAIL, { top: 34 });
    Caption.set('テーマ cagiana を Twig 3 で作り直す：公開中のページと同じマークアップに EC-CUBE 4 の変数（CSS・画像は旧テーマのまま）');
    const dt = Code.text(DETAIL);
    const pr = lineOf(dt, 'getPrice02IncTaxMin');
    await Code.reveal(pr - 6, 600);
    Issue.ok(linesRect(pr - 3, pr, 1150), '商品名・商品コード・価格（EC-CUBE 4 の書き方）');
    await wait(3400);
    Issue.hide();
    await Code.lineAfter('<div class="cart__position"></div>', [{ direct: FINAL_DESC.trim() }], { kps: 26 });
    await Code.save();
    check(DETAIL, FILES[DETAIL], 'detail.twig');
    Issue.ok(linesRect(pr + 2, pr + 2, 1150), '商品説明（旧テーマと同じく nl2br）');
    await wait(2400);
    Issue.hide();
    await openAt(ENV, { top: 30 });
    const tc = lineOf(Code.text(ENV), 'ECCUBE_TEMPLATE_CODE=');
    await Code.reveal(tc, 400);
    await Code.overwrite('default', [{ direct: 'cagiana' }], { from: tc, kps: 16 });
    await Code.save();
    Caption.set('使うテーマを cagiana に（.env の ECCUBE_TEMPLATE_CODE、管理画面のテンプレート一覧にも登録）');
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    await Win.switchTo('browser');
    await tabTo('dev');
    await Browser.typeUrl('localhost:8080/admin/store/template');
    await ec('admin-templates', { tab: 'dev', load: 1100 });
    await frame(ecText(/CAGIANA/, 'td, span, div'), 'CAGIANA（使用中）', { off: 300, hold: 2400 });
    await tabTo('shop');
    await Browser.reload(async () => { await ec('front-103-theme', { tab: 'shop', load: 0 }); });
    mark('theme');
    Caption.fixed('EC-CUBE 4.3 の商品ページ：旧サイトと同じ見た目');
    await wait(3000);
    await tabTo('live');
    Caption.set('本番（EC-CUBE 3）の同じページ');
    await wait(2800);
    await tabTo('shop');
    await Browser.typeUrl('localhost:8080/products/list');
    await ec('front-list-theme', { tab: 'shop', load: 1200 });
    Caption.set('商品一覧も同じマークアップ（li#result_list_box--{商品 ID}）');
    await wait(3000);
  });

  /* 7 — the old URLs */
  scene('urls', async () => {
    Caption.step(7);
    await Win.switchTo('code');
    await openAt(URLS, { top: 0 });
    const n = (DATA.urlList || []).length;
    Caption.set(`旧サイトの URL ${n} 件（公開ページのリンク・商品・カテゴリ・画像）を新しいサイトに投げて確かめる`);
    await wait(2600);
    await openAt(CHECK, { top: 0 });
    await wait(1600);
    await panel(true);
    const rows1 = DATA.urls1 || [];
    await run(".\\scripts\\check-urls.ps1 | Select-String -NotMatch '^200 '", urlLines(rows1, true), { kps: 30 });
    await run(".\\scripts\\check-urls.ps1 | Measure-Object | Select-Object -ExpandProperty Count", [String(rows1.length)], { kps: 30 });
    Caption.issue('404', `${rows1.filter((r) => r[0] === 404).length} 件：/help/guide（EC-CUBE 4 では /guide）と旧トップ /ec。商品・カテゴリは ID を引き継いだので 200`);
    Issue.show(termFind('/help/guide', 1, 900), 'EC-CUBE 3 だけの URL');
    await wait(4600);
    Issue.hide();
    await Code.panel(false);
    // the subscriber
    ensureDirs(SUB);
    await Code.newFile(SUB);
    const L = SRC.SUBSCRIBER.split('\n');
    const a = L.findIndex((l) => l.includes("'/help/guide' =>")), b = a + 2;
    await Code.paste([...L.slice(0, a), ...L.slice(b)].join('\n'), { after: 500 });
    await Code.reveal(Math.max(0, a - 8), 500);
    await Code.newLineAfter(a - 1);
    await Code.type(K.codeScript(L.slice(a, b), {}, { unit: '    ', after: L[a - 1] }), { kps: 22 });
    await Code.save({ status: 'U' });
    check(SUB, SRC.SUBSCRIBER, 'LegacyUrlSubscriber.php');
    Caption.set('EC-CUBE 4 の EventSubscriber：ルーティングの前に旧 URL を 301 で新しい URL へ');
    Issue.ok(linesRect(a - 1, b, 900), '旧 URL → 新 URL');
    await wait(3000);
    const ev = lineOf(Code.text(SUB), "KernelEvents::REQUEST");
    Issue.ok(linesRect(ev, ev, 1000), '優先度 64（RouterListener より先）');
    await wait(2600);
    Issue.hide();
    await panel(true);
    await cacheClear();
    const rows2 = DATA.urls2 || [];
    await run(".\\scripts\\check-urls.ps1 | Select-String -NotMatch '^200 '", urlLines(rows2, true), { kps: 30 });
    Issue.ok(termFind('301', rows2.filter((r) => r[0] !== 200).length, 1100), '301 で転送（404 は 0 件）');
    await wait(3600);
    Issue.hide();
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/help/guide');
    await ec('front-guide', { tab: 'shop', load: 1300 });
    Caption.set('/help/guide → /guide（ご利用ガイド）');
    await wait(2600);
  });

  /* 8 — the switch-over: the delta, DNS, the live shop */
  scene('switch', async () => {
    Caption.step(8);
    await Win.switchTo('code');
    await openAt('README.md', { top: 0 });
    const t = Code.text('README.md');
    const r = lineOf(t, '## 本番切り替え');
    await Code.reveal(r, 500);
    Caption.set('切り替えの手順：旧サイトを止めて、当日までの会員・受注だけをもう一度移す');
    Issue.ok(linesRect(r + 2, r + 7, 1100), '本番切り替えのチェックリスト');
    await wait(4000);
    Issue.hide();
    W11.skipTo('21:02');
    await Win.switchTo('browser');
    await tabTo('old');
    await Browser.typeUrl('localhost:8030/admin/order');
    await ec('ec3-orders-2', { tab: 'old', load: 1000 });
    Caption.set(`21:00 旧サイトをメンテナンス表示に。今日も注文が 2 件（受注 ${C3b.orders || 18} 件・会員 ${C3b.customers || 13} 件）`);
    const row17 = ecText(/^\s*17\s*$/, 'a, td');
    if (row17) await frame(row17.closest('tr') || row17, '今日の注文（移行後に入ったもの）', { off: 300, hold: 3000 });
    else await wait(3000);
    await Browser.typeUrl('localhost:8030/admin/plugin/DataBackup3/config');
    await ec('ec3-backup', { tab: 'old', load: 800 });
    const btn = ecText(/バックアップ\s*実行/, 'button');
    if (btn) await clickUi(btn, { kind: 'hand', after: 120 });
    await wait(1200);
    await Browser.download(BACKUP2, '35 KB');
    await tabTo('dev');
    await Browser.typeUrl('localhost:8080/admin/data_migration42/config');
    await ec('dm-delta', { tab: 'dev', load: 1000 });
    Caption.set('「会員と受注データのみ移行する」：商品・カテゴリはそのまま、会員と受注だけ入れ直す');
    const cb = EC.el('#upload-form input[type=checkbox]');
    if (cb) await frame(cb.closest('.form-check, div') || cb, '会員と受注データのみ', { off: 360, hold: 2600 });
    await uploadBackup(BACKUP2, { caption: `ファイルを選択：migration\\${BACKUP2}` });
    await ec('dm-delta-done', { tab: 'dev', load: 1800 });
    await wait(1600);
    await Browser.typeUrl('localhost:8080/admin/order');
    await ec('admin-orders-2', { tab: 'dev', load: 1100 });
    Caption.fixed(`受注 ${C4b.orders || 18} 件・会員 ${C4b.customers || 13} 件：今日の注文も移った`);
    await frame(ecText(/検索結果[:：]?\s*\d+\s*件|\d+\s*件が該当/), `受注 ${C4b.orders || 18} 件`, { off: 400, hold: 3000 });
    // DNS
    await Win.switchTo('code');
    await panel(true);
    Caption.set('DNS：cagiana.jp の A レコードを新しいサーバーへ（TTL は前日に 300 秒にしてある）');
    await run('Resolve-DnsName cagiana.jp -Type A -Server 8.8.8.8 | Select-Object Name, TTL, IPAddress', ['', 'Name       TTL IPAddress', '----       --- ---------', 'cagiana.jp 300 <span class="pii">203.0.113.24</span>'], { kps: 26 });
    await wait(1400);
    await run('Resolve-DnsName cagiana.jp -Type A -Server 8.8.8.8 | Select-Object Name, TTL, IPAddress', ['', 'Name       TTL IPAddress', '----       --- ---------', 'cagiana.jp 300 <span class="pii">198.51.100.71</span>'], { kps: 26 });
    Issue.ok(termFind('198.51', 1, 900), '新しいサーバー（EC-CUBE 4.3）');
    await wait(2600);
    Issue.hide();
    await Code.panel(false);
    // the live shop on EC-CUBE 4.3
    await Win.switchTo('browser');
    await tabTo('live');
    await Browser.typeUrl('cagiana.jp/products/detail/103');
    await ec('front-103-theme', { tab: 'live', load: 1600, url: CG.LIVE + '/products/detail/103' });
    mark('live2');
    Caption.fixed('本番 cagiana.jp が EC-CUBE 4.3 に：同じ URL・同じ見た目・同じ商品 ID');
    const nm = EC.el('.item_name');
    if (nm) await frame(nm.closest('#item_detail_area') || nm, 'EC-CUBE 4.3.1-p1', { off: 200, hold: 3400 });
    else await wait(3400);
    Cursor.kind('arrow');
    Caption.set(`EC-CUBE 3 → 4.3：商品 ${C4.products}・カテゴリ ${C4.categories}・会員 ${C4b.customers || C4.customers}・受注 ${C4b.orders || C4.orders} 件、画像、テーマ（Twig 3）、旧 URL の 301、当日の差分まで移行`);
    await wait(5200);
    Caption.hide();
  });

  /* the description line of detail.twig typed in the video (the file starts without it) */
  const FINAL_DESC = (FILES[DETAIL] || '').split('\n').find((l) => l.includes('description_detail|raw|nl2br')) || '';
  if (FINAL_DESC) FILES[DETAIL + '#start'] = FILES[DETAIL].split('\n').filter((l) => l !== FINAL_DESC).join('\n');

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'product', 'list'],
    fontText: Object.values(TITLE).join('') + FILES['README.md'] + SRC.SUBSCRIBER + SRC.CHECK + (P.live.plugins || []).join('') + 'システムエラー原因画像が出ない会員と受注データのみ移行する本番切り替え件旧新ログインできたパスワード注文履歴',
    async prepare() {
      const files = { ...FILES };
      files[DETAIL] = FILES[DETAIL + '#start'] || FILES[DETAIL];
      delete files[DETAIL + '#start'];
      const tree = [
        ['app', 'dir', 1], ['app/Customize', 'dir', 1], ['app/Plugin', 'dir', 1], ['app/Plugin/DataMigration42', 'dir', 1], ['app/Plugin/DataMigration42/Controller', 'dir', 1], ['app/Plugin/DataMigration42/Controller/Admin', 'dir', 1], [PLUGIN],
        ['app/Plugin/DataMigration42/composer.json'],
        ['app/template', 'dir', 1], ['app/template/cagiana', 'dir', 1], ['app/template/cagiana/Product', 'dir', 1], [DETAIL], ['app/template/cagiana/Product/list.twig'], [FRAME],
        ['html', 'dir', 0], ['migration', 'dir', 1], ['migration/ec3', 'dir', 1], [CONF3],
        ['scripts', 'dir', 1], [CHECK], [URLS], ['src', 'dir', 0], ['var', 'dir', 0], ['vendor', 'dir', 0],
        [ENV], ['README.md'],
      ];
      Code.init(files, tree);
      for (const p of Object.keys(files)) if (/\.(php|twig)$/.test(p)) Code.files[p].indent = '    ';
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: '新しいタブ', url: '', page: 'blank', fav: 'blank' });
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      ['front-103-noimg', 'front-mypage'].forEach((k) => { try { noImages(k); } catch (e) { /* not built yet */ } });
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
})();
