/*
 * Timeline: あみだ池大黒オンラインショップ（www.daikoku.ne.jp/shop, EC-CUBE 4）— 専用プラグインの開発（ギフトのし）:
 * the request and the live product page (のし → 備考欄) and the dev copy (the のし written in お問い合わせ) →
 * bin/console eccube:plugin:generate (the real skeleton) → Config / NoshiTitle entities, PluginManager, Nav (own menu),
 * controllers, forms, Twig → eccube:plugin:install / enable → のし・ギフト › 基本設定, 表書き一覧 (御年賀) → ProductTrait
 * (@FormAppend), ShippingTrait, ShippingTypeExtension, Event (TemplateEvent) → 注文手続き: システムエラー (the traits are not
 * in the proxies) → eccube:generate:proxies, doctrine:schema:update → 商品登録 のし対応 → 注文手続き (the 表書き check),
 * 確認, 完了 → 受注登録 and the 注文受付メール → PluginManager's 配送CSV items, 無効化 / 有効化, CSV出力項目設定, 配送CSV →
 * DaikokuGift-1.0.0.zip, 無効化 → 削除, 独自プラグインのアップロード, 有効化 → production (reconstructed) → the live shop.
 * Every EC-CUBE screen is real: EC-CUBE 4.3.1-p1 running locally with this code (js/ec-snapshot.js —
 * tools/snapshots/ec-daikoku-plugin/capture-ec.js); the shop is the live www.daikoku.ne.jp/shop (js/site-snapshot.js).
 * bin/console's output, the log line, the CSV and the zip's list are EC-CUBE's / tar's own; docker, git and the server are reconstructions.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, EC = window.EC, W11 = window.Win11, DK = window.DK;
  const { esc, wait, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, FileDialog } = K;
  const readHold = (ms) => K.readHold(Math.round(ms * 0.74));
  const SRC = F.SRC, P = F.files, PL = F.P;
  const DEV = DK.DEV, LIVE = DK.LIVE;
  const DATA = EC.data || {};
  const S = window.SITE_SNAPSHOT;
  const TITLE = (k) => ((S && S.pages[k] && S.pages[k].pc || '').match(/<title>([^<]*)<\/title>/) || [])[1] || (S && S.title) || 'あみだ池大黒';
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));
  const full = (p) => PL + p;
  const at = (rel, stage) => SRC.source(rel, stage).replace(/\n$/, '');

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'のしなし：表書き・名入れは残さない': { r: 'noshinashi:omotegaki/naireharenokosanai', segs: ['のしなし', '：', '表書き', '・', '名入れは', '残さない'] },
    'のし表書き': { r: 'noshiomotegaki', segs: ['のし', '表書き'] },
    '管理画面の左メニューに「のし・ギフト」': { r: 'kanrigamennnohidarimenyu-ni[noshi/gifuto]', segs: ['管理画面の', '左', 'メニューに', '「', 'のし', '・', 'ギフト', '」'] },
  };
  const IME = {
    guide: [{ r: 'housoushouhinnnotame,', segs: ['包装商品の', 'ため', '、'] }, { r: 'noshihagoshiteiganaikagiri', segs: ['のしは', 'ご指定が', 'ない限り'] },
      { r: '[sotonoshi]', segs: ['「', '外のし', '」'] }, { r: 'tonarimasu.', segs: ['となります。'] }],
    title: [{ r: 'gonenga', segs: ['御年賀'] }],
    name: [{ r: 'tanaka', segs: ['田中'] }],
    plugin: [{ r: 'amidaikedaikoku', segs: ['あみだ池', '大黒'] }, { direct: ' ' }, { r: 'gifutonoshi', segs: ['ギフト', 'のし'] }],
  };
  /** typing script for PSR-12 / Twig lines (4 spaces): Enter + the editor's auto-indent, corrected */
  const script = (lines, after) => K.codeScript(lines, JA, { unit: '    ', after });
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) { const f = Code.files[path]; if (f && /\.(php|twig|js|ya?ml|json)$/.test(path)) f.indent = '    '; show0(path, o); };
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); if (Code.ins && Code.active) { Code.ensureVisible(Code.ins.line); Code.render(); } Term.render('<span class="caret"></span>'); };

  /* ------------------------------------------------ what the commands print */
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 26, ...o });
  const DC = 'docker compose exec ec-cube ';
  /** bin/console's own output (captured), the paths inside the container */
  const consoleOut = (text, max = 40) => String(text || '').replace(/\/srv\/eccube/g, '/var/www/html').replace(/\r/g, '').split('\n')
    .map((l) => esc(l).replace(/^(\s*)\[OK\]/, '$1<span class="tg">[OK]</span>').replace(/^(\s*)\[ERROR\]/, '$1<span class="tr">[ERROR]</span>'))
    .filter((l, i, a) => !(l.trim() === '' && (i === 0 || a[i - 1].trim() === ''))).slice(0, max);
  const cacheClear = () => run(DC + 'bin/console cache:clear --no-warmup', ['', ' // Clearing the cache for the <span class="tc">prod</span> environment with debug <span class="tc">false</span>', '',
    ' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.', ''], { kps: 30 });
  const logOut = (L) => ((L && L.lines) || []).map((l) => {
    let t = l.replace(/\/srv\/eccube/g, '/var/www/html').replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?/, '2026-11-03T10:57:41$1');
    const cut = t.indexOf('","/var/www/html');
    if (cut > 0) t = t.slice(0, cut + 1) + ', …]';
    return esc(t);
  });
  const logFile = (L) => ((L && L.file) || 'var/log/prod/site.log').replace(/\d{4}-\d{2}-\d{2}/, '2026-11-03');

  /* ------------------------------------------------ the 配送CSV EC-CUBE exported (Shift_JIS), as PowerShell's Import-Csv shows it */
  const CSV_NAME = 'shipping_20261103112614.csv';
  function parseCsv(text) {
    const rows = [];
    let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; continue; }
      if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter((r) => r.some((x) => x !== ''));
  }
  const wide = (t) => [...String(t)].reduce((n, ch) => n + (ch.charCodeAt(0) > 0xff ? 2 : 1), 0);
  const padTo = (t, w) => t + ' '.repeat(Math.max(0, w - wide(t)));
  /** Format-Table of some columns of the CSV (the customer's name blurred) */
  function csvTable(cols) {
    const rows = parseCsv((DATA.csv && DATA.csv.text) || '');
    if (!rows.length) return ['のし のし表書き のし名入れ', '---- ---------- ----------', '外のし 御歳暮 田中'];
    const head = rows[0];
    const idx = cols.map((c) => head.indexOf(c));
    const body = rows.slice(1).map((r) => idx.map((i) => (i >= 0 ? r[i] || '' : '')));
    const w = cols.map((c, k) => Math.max(wide(c), ...body.map((r) => wide(r[k]))));
    const line = (cells, pii) => cells.map((c, k) => { const t = esc(padTo(c, w[k])); return pii && cols[k].startsWith('配送先_お名前') && c ? '<span class="pii">' + t + '</span>' : t; }).join(' ').replace(/\s+$/, '');
    return ['', line(cols), line(cols.map((c) => '-'.repeat(wide(c)))), ...body.map((r) => line(r, true)), ''];
  }

  /* ------------------------------------------------------------- frames */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? EC.el(el) : el; if (!e) return null; const r = screenRect(e); if (!r.width) return null; return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const SR = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
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
  const say = (text, ms) => { Caption.set(text); return readHold(ms != null ? ms : Math.min(3600, Math.max(1400, text.length * 43))); };
  const T = (sel, re) => DK.text(sel, re);
  /** one frame around two elements of the screen on show (e.g. two form rows) */
  const U = (fa, fb, pad = 4) => () => {
    const a = fa(), b = fb();
    if (!a || !b) return null;
    const ra = screenRect(a), rb = screenRect(b);
    const left = Math.min(ra.left, rb.left) - pad, top = Math.min(ra.top, rb.top) - pad;
    return { left, top, width: Math.max(ra.left + ra.width, rb.left + rb.width) - left + pad, height: Math.max(ra.top + ra.height, rb.top + rb.height) - top + pad };
  };
  const storeText = (sel, re) => { const d = Store.doc; if (!d) return null; const all = [...d.querySelectorAll(sel)].filter((e) => re.test(e.textContent)); return all.length ? all[all.length - 1] : null; };
  /** a frame around lines of a file shown in the editor, found by their text */
  const frameLines = (path, a, b, label, o = {}) => {
    const t = Code.text(path);
    const i = lineOf(t, a, o.from || 0);
    const j = b ? lineOf(t, b, i) : i;
    if (i < 0) return Promise.resolve();
    return Code.reveal(Math.round((i + Math.max(i, j)) / 2), 500).then(() => { const rc = linesRect(i, Math.max(i, j), o.w || 1100); if (o.issue) Issue.show(rc, label); else Issue.ok(rc, label); return readHold(o.ms || 2600); });
  };
  /** an EC-CUBE screen scrolled so that an element sits about `y` px from the top */
  const ecScrollTo = async (el, y = 260, ms = 900) => { if (!el) return; await EC.scroll(Math.max(0, el.getBoundingClientRect().top + EC.doc().defaultView.scrollY - y), ms); };

  /* ------------------------------------------------ the plugin's files in the explorer */
  function addDirs(dirs, afterPath) {
    let i = Code.tree.findIndex((n) => n.path === afterPath);
    for (const d of dirs) {
      if (Code.tree.some((n) => n.path === d)) continue;
      Code.tree.splice(++i, 0, { path: d, dir: true, open: true });
    }
    Code.renderTree();
  }
  /** folds a folder of the explorer (a click on its row) */
  async function fold(p) {
    const n = Code.tree.find((x) => x.path === p);
    if (!n || !n.open) return;
    await clickUi(Code.node(p), { after: 40 });
    n.open = false;
    Code.renderTree();
    await wait(160);
  }
  /** a new file of the plugin: the explorer's new file, then pasted (o.type: [from, to) lines typed) */
  async function newPluginFile(rel, o = {}) {
    const path = full(rel);
    const text = at(rel, o.stage || 4);
    await Code.newFile(path);
    Code.files[path].indent = '    ';
    if (!o.type) await Code.paste(text, { after: o.after });
    else {
      const A = text.split('\n');
      const [a, b] = o.type;
      await Code.paste(A.slice(0, a).join('\n'), { after: 200 });
      await Code.type(script(A.slice(a, b), A[a - 1]), { kps: o.kps || 24 });
      if (b < A.length) await Code.paste('\n' + A.slice(b).join('\n'), { flash: false, after: 200 });
    }
    await Code.save({ status: 'U' });
    check(path, text, rel);
    return path;
  }
  /** a generated file replaced: Ctrl+A, Ctrl+V of the plugin's version */
  async function replaceFile(rel, stage, o = {}) {
    const path = full(rel);
    await openAt(path, { top: 0 });
    Code.selectAll();
    await Keycap.show(['Ctrl', 'A'], 420);
    const f = Code.files[path];
    Code.ins = { line: 0, col: 0, html: '' };
    Code.msel = { a: 0, b: f.lines.length - 1 };
    await Code.paste(at(rel, stage), { after: o.after });
    Code.reveal(0, 300);
    await Code.save();
    check(path, at(rel, stage), rel);
    return path;
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request, the live product page, the dev copy (のし in お問い合わせ) */
  scene('request', async () => {
    Caption.step(1);
    const RQ = 'docs/request-2026-11.md';
    await say('依頼（EC チーム）：お歳暮・お年賀の時期に向けて、のし指定を備考欄から注文手続きの選択式に。専用プラグインで');
    await hoverUi(Code.lineEl(2), { ax: 0.3, hold: 400 });
    await frameLines(RQ, '## 背景', '書き方がまちまち', 'のし指定は備考欄・書き方がまちまち', { ms: 3200 });
    await frameLines(RQ, '1. 注文手続きで', '5. 専用プラグイン', 'お届け先ごと・表書きは管理画面・受注 / メール / CSV', { ms: 3600 });
    Issue.hide();
    // the live shop: 大阪もちまろ菓 — <のし対応について>
    await Win.switchTo('browser');
    await DK.tab('live');
    await say('公開中のあみだ池大黒オンラインショップ（EC-CUBE 4）：商品ページの「のし対応について」');
    const note = storeText('.productDetailPage-descriptionDetail, p, div', /のし対応について/);
    if (note) {
      await Store.scrollToEl(note, 260, 1300);
      Issue.ok(SR(note, 4), '「内のし」は備考欄にご記入ください');
      await readHold(3200);
      Issue.hide();
    }
    const icon = Store.doc && Store.doc.querySelector('img[alt="のし設定"]');
    if (icon) { Issue.ok(SR(icon, 6), 'のし対応の商品のアイコン'); await readHold(2200); Issue.hide(); }
    // the dev copy: 注文手続き → お問い合わせ欄, the order's お問い合わせ
    await Browser.newTab('shop');
    await Browser.typeUrl('localhost:8080/shopping');
    await DK.ec('shop', 'shop-0-msg', { load: 1300 });
    mark('shop0');
    await say('開発環境（EC-CUBE 4.3・本番の商品のコピー）の注文手続き：のし は「お問い合わせ」欄に自由に書くしかない');
    const msg = EC.el('textarea[name*="[message]"]');
    if (msg) { await hoverUi(msg, { hold: 300 }); Issue.show(R(msg, 4), '自由記入（内のし・表書き・名入れ）'); await readHold(3000); Issue.hide(); }
    await Browser.newTab('admin');
    await Browser.typeUrl(`localhost:8080/admin/order/${(DATA.order1 && DATA.order1.id) || 1}/edit`);
    await DK.ec('admin', 'order-0', { load: 1300 });
    const q = T('.row', /お問い合わせ/);
    Caption.issue('出荷担当が読み取る', '受注のお問い合わせ欄を読んで、のし紙を用意している（書き漏れ・誤記は電話で確認）');
    if (q) Issue.show(R(q, 4), 'お問い合わせ');
    await readHold(3400);
    Issue.hide();
  });

  /* 2 — the skeleton: eccube:plugin:generate */
  scene('scaffold', async () => {
    Caption.step(2);
    W11.skipTo('10:18');
    await Win.switchTo('code');
    await panel(true);
    await say('EC-CUBE のプラグインの雛形を bin/console で作る（名前・コード・バージョン）');
    await Term.run([{ direct: DC + 'bin/console eccube:plugin:generate "' }, ...IME.plugin, { direct: '" DaikokuGift 1.0.0' }], blank(['', ...consoleOut(DATA.generateOut || ' [OK] Plugin was successfully created: あみだ池大黒 ギフトのし DaikokuGift 1.0.0')]), { kps: 24 });
    Issue.ok(termFind('[OK]', 1, 1100), 'app/Plugin/DaikokuGift');
    await readHold(2200);
    Issue.hide();
    // the generated files into the explorer
    const files0 = SRC.files(0);
    const dirs = new Set([PL + 'Form/Extension', PL + 'Resource/doctrine']);
    Object.keys(files0).forEach((p) => { const a = p.split('/'); for (let i = 3; i < a.length; i++) dirs.add(a.slice(0, i).join('/')); });
    const key = (p, dir) => p.split('/').map((x, i, a) => ((i < a.length - 1 || dir) ? '0' : '1') + x).join('/');
    const nodes = [...[...dirs].map((d) => ({ path: d, dir: true, open: true })), ...Object.keys(files0).map((p) => ({ path: p, dir: false }))]
      .sort((a, b) => key(a.path, a.dir).localeCompare(key(b.path, b.dir)));
    Code.tree.splice(Code.tree.findIndex((n) => n.path === 'app/Plugin') + 1, 0, ...nodes);
    for (const [p, t] of Object.entries(files0)) { Code.addFile(p, t, { indent: '    ', silent: true }); Code.status[p] = 'U'; }
    Code.renderTree();
    Code.gitBadge();
    Code.tree.forEach((n) => { if (n.dir && (n.path === 'src' || n.path === 'docs' || n.path.endsWith('/.github') || n.path.endsWith('/Resource/locale'))) n.open = false; });
    Code.renderTree();
    await Code.panel(false);
    await say('できたもの：composer.json（コード DaikokuGift）・Event（EventSubscriber）・Nav（管理画面のメニュー）・設定画面の Controller / Entity / Form / Twig');
    await openAt(full('composer.json'), { top: 0 });
    await frameLines(full('composer.json'), '"type": "eccube-plugin"', '"code": "DaikokuGift"', 'eccube-plugin・コード', { ms: 2400 });
    Issue.hide();
    await openAt(full('Entity/Config.php'), { top: 0 });
    await frameLines(full('Entity/Config.php'), '@ORM\\Table(name="plg_daikoku_gift_config")', null, 'plg_ のテーブル（インストールで作られる）', { ms: 2600 });
    Issue.hide();
  });

  /* 3 — the data and the admin side */
  scene('code', async () => {
    Caption.step(3);
    W11.skipTo('10:22');
    await say('設定（Config）：雛形の name を、のし指定の受付・名入れの最大文字数・注文手続きの案内に');
    await replaceFile('Entity/Config.php', 1);
    await frameLines(full('Entity/Config.php'), '* 注文手続きで のし指定を受け付ける', 'private $guide_text;', '受付・名入れの文字数・案内', { ms: 2600 });
    Issue.hide();
    await say('表書きのマスタ（NoshiTitle）：御歳暮・御礼 …と水引。外のし / 内のし はこのクラスの定数');
    await newPluginFile('Entity/NoshiTitle.php');
    await frameLines(full('Entity/NoshiTitle.php'), "public const TYPES = ['outer'", 'public const MIZUHIKI', '外のし / 内のし・水引', { ms: 2400 });
    Issue.hide();
    addDirs([], 'app/Plugin/DaikokuGift/Repository');
    await newPluginFile('Repository/NoshiTitleRepository.php', { after: 200 });
    await say('PluginManager：有効化のときに設定と表書きの初期データを入れる（2 回目以降はそのまま）');
    await newPluginFile('PluginManager.php', { stage: 1 });
    await frameLines(full('PluginManager.php'), 'private const TITLES = [', "['志', '黒白結び切り'],", '表書きの初期データ', { ms: 2200 });
    Issue.hide();
    // Nav: the own menu
    await say('Nav：管理画面の左メニューに「のし・ギフト」（表書き一覧・基本設定）');
    const NV = full('Nav.php');
    await openAt(NV, { top: 0 });
    const N1 = at('Nav.php', 1).split('\n');
    const n0 = N1.findIndex((l) => l.includes('return ['));
    const n1 = N1.findIndex((l, i) => i > n0 && l.trim() === '];');
    const d0 = Code.text(NV).split('\n').findIndex((l) => l.trim() === '/**');
    const c0 = N1.findIndex((l) => l.includes('* 管理画面の左メニュー'));
    await Code.newLineAfter(d0);
    await Code.type(script(N1.slice(c0, c0 + 2), '    /**'), { kps: 20 });
    const base = Code.text(NV).split('\n');
    const r0 = base.findIndex((l) => l.includes('return [];'));
    await Code.clickAt(r0, base[r0].length);
    Code.sel = { line: r0, from: 0, to: base[r0].length };
    await Code.type(script(N1.slice(n0, n1 + 1)), { kps: 46 });
    await Code.save();
    check(NV, at('Nav.php', 1) + '\n', 'Nav');
    await frameLines(NV, "'daikoku_gift' => [", "'url' => 'daikoku_gift_admin_config',", 'のし・ギフト（fa-gift）', { ms: 2400 });
    Issue.hide();
    // controllers, forms, Twig, messages
    await say('設定画面（雛形の ConfigController / ConfigType / config.twig）を書き換え、表書き一覧の画面を足す');
    await replaceFile('Form/Type/Admin/ConfigType.php', 1, { after: 200 });
    await replaceFile('Controller/Admin/ConfigController.php', 1, { after: 200 });
    await frameLines(full('Controller/Admin/ConfigController.php'), '@Route("/%eccube_admin_route%/daikoku_gift/config"', null, 'プラグイン一覧の「設定」もこのルート', { ms: 2200 });
    Issue.hide();
    await replaceFile('Resource/template/admin/config.twig', 1, { after: 200 });
    await newPluginFile('Form/Type/Admin/NoshiTitleType.php', { after: 200 });
    await newPluginFile('Controller/Admin/NoshiTitleController.php', { after: 200 });
    await frameLines(full('Controller/Admin/NoshiTitleController.php'), '@Route("/%eccube_admin_route%/daikoku_gift/noshi_title"', '@Template("@DaikokuGift/admin/noshi_title.twig")', '一覧と登録・編集', { ms: 2400 });
    Issue.hide();
    await newPluginFile('Resource/template/admin/noshi_title.twig', { after: 200 });
    await replaceFile('Resource/locale/messages.ja.yaml', 1, { after: 200 });
    await frameLines(full('Resource/locale/messages.ja.yaml'), 'daikoku_gift.admin.nav:', 'daikoku_gift.noshi_name.none', '翻訳（メニュー・項目名・エラー）', { ms: 2200 });
    Issue.hide();
  });

  /* 4 — install / enable, the admin screens */
  scene('install', async () => {
    Caption.step(4);
    W11.skipTo('10:41');
    await panel(true);
    await say('インストール（プラグインのテーブルを作る）と有効化（PluginManager::enable で初期データ）');
    await run(DC + 'bin/console eccube:plugin:install --code=DaikokuGift', ['', ...consoleOut(DATA.installOut || ' [OK] Installed.')], { kps: 30 });
    await run(DC + 'bin/console eccube:plugin:enable --code=DaikokuGift', ['', ...consoleOut(DATA.enableOut || ' [OK] Plugin Enabled.')], { kps: 30 });
    Issue.ok(termFind('[OK] Plugin Enabled.', 1, 700), 'インストール・有効化');
    await readHold(1800);
    Issue.hide();
    await Code.panel(false);
    await Win.switchTo('browser');
    await DK.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/store/plugin');
    await DK.ec('admin', 'plugins-1', { load: 1200 });
    mark('plugins1');
    await say('オーナーズストア › プラグイン一覧：独自プラグインに「あみだ池大黒 ギフトのし」（有効）。左のメニューに「のし・ギフト」');
    const pr = T('tr', /ギフトのし|DaikokuGift/);
    if (pr) { await hoverUi(pr, { hold: 300 }); Issue.ok(R(pr, 2), 'DaikokuGift 1.0.0 — 有効'); await readHold(2400); Issue.hide(); }
    const menu = T('a, span', /^のし・ギフト$/);
    if (menu) { Issue.ok(R(menu.closest('li') || menu, 2), 'Nav のメニュー'); await readHold(2000); Issue.hide(); }
    // 基本設定: the plugin row's ⚙ (設定) — the route daikoku_gift_admin_config
    const gear = EC.el('a.btn-ec-actionIcon[href*="/daikoku_gift/config"]') || EC.el('td a[href*="/daikoku_gift/config"]');
    await clickUi(gear, { kind: 'hand', after: 60 });
    await DK.ec('admin', 'gift-config', { load: 1000 });
    await say('のし・ギフト › 基本設定：注文手続きの のし欄に出す案内を入れる（商品ページの「外のし」の案内と同じ文）');
    await DK.type('guide_text', IME.guide, { kps: 11 });
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await DK.ec('admin', 'gift-config-saved', { load: 900 });
    const ok = EC.el('.alert-success, .alert');
    Caption.fixed('保存しました（plg_daikoku_gift_config）');
    if (ok) Issue.ok(R(ok, 3), '保存しました');
    await readHold(2000);
    Issue.hide();
    // 表書き一覧: the menu's first item
    await clickUi(T('a', /^\s*表書き一覧\s*$/), { kind: 'hand', after: 60 });
    await DK.ec('admin', 'noshi-list', { load: 1000 });
    mark('noshiList');
    await say('表書き一覧：初期データの 6 件（御歳暮・御礼・御祝・内祝・粗品・志）。年末に向けて「御年賀」を追加');
    await DK.type('title_name', IME.title, { kps: 10 });
    await clickUi(T('button', /^登録$/), { kind: 'hand', after: 60 });
    await DK.ec('admin', 'noshi-list-saved', { load: 900 });
    const ny = T('tr', /御年賀/);
    Caption.fixed('御年賀（紅白蝶結び）を登録 — 注文手続きの表書きの選択肢になる');
    if (ny) Issue.ok(R(ny, 2), '御年賀');
    await readHold(2600);
    Issue.hide();
  });

  /* 5 — the order side: traits, the form extension, TemplateEvent → システムエラー → proxies */
  scene('front', async () => {
    Caption.step(5);
    W11.skipTo('10:48');
    await Win.switchTo('code');
    Code.tree.forEach((n) => { if (n.dir && (n.path.endsWith('/Controller') || n.path.endsWith('/Repository') || n.path.endsWith('/Form/Type'))) n.open = false; });
    Code.renderTree();
    await say('商品に「のし対応」：エンティティのトレイト（@EntityExtension）。@FormAppend で商品登録に入力欄が自動で出る');
    await newPluginFile('Entity/ProductTrait.php');
    await frameLines(full('Entity/ProductTrait.php'), '@EntityExtension("Eccube\\Entity\\Product")', null, 'Product を拡張', { ms: 1800 });
    await frameLines(full('Entity/ProductTrait.php'), '@FormAppend(', '"label": "daikoku_gift.noshi_enabled"', '商品登録に自動で表示', { ms: 2200 });
    Issue.hide();
    await say('お届け先（Shipping）に のし：種類（外のし / 内のし）・表書き・名入れ。表書きは選んだときの文字のまま受注に残す');
    await newPluginFile('Entity/ShippingTrait.php');
    await frameLines(full('Entity/ShippingTrait.php'), '@ORM\\Column(name="daikoku_noshi_type"', '@ORM\\Column(name="daikoku_noshi_name"', 'dtb_shipping の列', { ms: 2400 });
    Issue.hide();
    await say('FormTypeExtension：注文手続きのお届け先のフォームに 3 項目。外のし / 内のし なのに表書きがなければエラー');
    const EX = 'Form/Extension/ShippingTypeExtension.php';
    const X2 = at(EX, 2).split('\n');
    const xi = X2.findIndex((l) => l.includes('->addEventListener(FormEvents::POST_SUBMIT'));
    const xe = X2.findIndex((l, i) => i > xi && l.trim() === '});');
    await newPluginFile(EX, { type: [xi, xe + 1], kps: 44, stage: 2 });
    await frameLines(full(EX), "->add('noshi_type', ChoiceType::class", "new Length(['max' => $Config->getNameMaxLength()]),", '種類・表書き（マスタ）・名入れ', { ms: 2400 });
    await frameLines(full(EX), 'yield ShippingType::class;', null, '注文手続きの ShippingType', { ms: 1800 });
    Issue.hide();
    // Event: TemplateEvent
    await fold('app');
    await openAt('src/Eccube/Resource/template/default/Shopping/index.twig', { top: 318 });
    await say('注文手続きのテンプレート（本体）：お届け先ごとのループの「お届け時間」の下に差し込みたい');
    await frameLines('src/Eccube/Resource/template/default/Shopping/index.twig', '{{ form_errors(form.Shippings[idx].DeliveryTime) }}', null, 'ここの後（ループの中）', { ms: 2400 });
    Issue.hide();
    await say('Event（雛形の EventSubscriber）：TemplateEvent でテンプレートの文字列に include を差し込む（本体は変更しない）');
    await replaceFile('Event.php', 2);
    await frameLines(full('Event.php'), "'Shopping/index.twig' => 'onShoppingIndex',", "'Shopping/confirm.twig' => 'onShoppingConfirm',", '注文手続き・確認画面', { ms: 2200 });
    await frameLines(full('Event.php'), "$event->setParameter('DaikokuGiftConfig'", "$this->insert($event, '{{ form_errors(form.Shippings[idx].DeliveryTime) }}'", '設定を渡して include', { ms: 2400 });
    Issue.hide();
    const AD = 'app/Plugin/DaikokuGift/Resource/template/admin';
    const lastAdmin = [...Code.tree].reverse().find((n) => n.path.startsWith(AD + '/'));
    addDirs(['app/Plugin/DaikokuGift/Resource/template/default', 'app/Plugin/DaikokuGift/Resource/template/default/Shopping'], lastAdmin ? lastAdmin.path : AD);
    await newPluginFile('Resource/template/default/Shopping/noshi_form.twig');
    await frameLines(full('Resource/template/default/Shopping/noshi_form.twig'), '{% set noshiItems = shipping.productOrderItems|filter(item => item.Product.noshi_enabled) %}', '{% if DaikokuGiftConfig.accept and noshiItems|length > 0 %}', 'のし対応の商品があるお届け先だけ', { ms: 2600 });
    Issue.hide();
    await newPluginFile('Resource/template/default/Shopping/noshi_confirm.twig', { after: 200 });
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // the shop: システムエラー
    W11.skipTo('10:57');
    await Win.switchTo('browser');
    await DK.tab('shop');
    await Browser.typeUrl('localhost:8080/shopping');
    await DK.ec('shop', 'shop-error', { load: 2200, title: DATA.errorTitle });
    mark('error');
    Caption.issue('システムエラー', '注文手続きを開くとシステムエラー。ログを確認');
    const er = T('h1, h2, p, div', /システムエラー/);
    if (er) Issue.show(R(er, 6), 'システムエラーが発生しました');
    await readHold(3000);
    Issue.hide();
    await Win.switchTo('code');
    await panel(true);
    const L = DATA.errorLog;
    await run(`Get-Content ${logFile(L).replace(/\//g, '\\')} -Tail 100 | Select-String "front.ERROR"`, logOut(L).length ? logOut(L).slice(-1) : ['front.ERROR … Can\'t get a way to read the property "noshi_type" in class "Eccube\\Entity\\Shipping".'], { kps: 34 });
    Issue.show(termFind('noshi_type', 1, 1500), 'Shipping に noshi_type を読む方法がない');
    await readHold(3400);
    Issue.hide();
    await Code.panel(false);
    const PS = 'src/Eccube/Service/PluginService.php';
    await fold('app');
    await fold('src/Eccube/Resource');
    await openAt(PS, { top: 300 });
    await say('トレイトはプロキシ（app/proxy/entity）に取り込まれて初めてエンティティの一部になる。プロキシを作るのはインストール・有効化のとき');
    await frameLines(PS, 'public function generateProxyAndUpdateSchema(', null, 'インストール時にプロキシとスキーマ', { issue: true, ms: 3000 });
    Issue.hide();
    await panel(true);
    await say('インストール後に足したトレイトなので、プロキシを作り直してテーブルに列を足す');
    await run(DC + 'bin/console eccube:generate:proxies', ['', ...consoleOut(DATA.proxiesOut || ' gen -> /var/www/html/app/proxy/entity/src/Eccube/Entity/Shipping.php', 12)], { kps: 30 });
    await run(DC + 'bin/console doctrine:schema:update --dump-sql --force', ['', ...consoleOut(DATA.schemaOut || ' [OK] Database schema updated successfully!', 16)], { kps: 30 });
    Issue.ok(termFind('daikoku_noshi', 4, 1500), 'dtb_product・dtb_shipping に列');
    await readHold(2800);
    Issue.hide();
    await cacheClear();
    await Code.panel(false);
    // 商品登録: のし対応
    W11.skipTo('11:01');
    await Win.switchTo('browser');
    await DK.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/product/product/290/edit');
    await DK.ec('admin', 'product-edit', { load: 1500 });
    mark('productEdit');
    const cb = EC.el('#admin_product_noshi_enabled');
    await say('商品登録：基本情報に「のし対応」（@FormAppend）。進物用おこし「おこしおすすめ3個箱セット（A）」にチェック');
    if (cb) { Issue.ok(R(cb.closest('.row') || cb, 4), 'のし対応'); await readHold(1600); Issue.hide(); await clickUi(cb, { after: 160 }); DK.check(cb); }
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await DK.ec('admin', 'product-saved', { load: 1100 });
    Caption.fixed(`のし対応：商品ページに「のし設定」アイコンのある ${(DATA.noshiProducts || []).length || 13} 商品に設定（紙バッグ・袋入りは対象外）`);
    const cb2 = EC.el('#admin_product_noshi_enabled');
    if (cb2) Issue.ok(R(cb2.closest('.row') || cb2, 4), '保存しました');
    await readHold(2600);
    Issue.hide();
  });

  /* 6 — a test order with のし; 受注登録 and the mail */
  scene('order', async () => {
    Caption.step(6);
    W11.skipTo('11:05');
    await DK.tab('shop');
    await Browser.typeUrl('localhost:8080/shopping');
    await DK.ec('shop', 'shop-noshi', { load: 1500 });
    mark('shopNoshi');
    await say('注文手続き（3個箱セット＋紙バッグ）：お届け先の「お届け時間」の下に のし。対象は のし対応の商品だけ');
    const box = EC.el('#daikoku-noshi-0');
    if (box) { Issue.ok(R(box, 4), 'のし（お届け先ごと）'); await readHold(2600); Issue.hide(); }
    const tsel = EC.el('[id$="Shippings_0_noshi_type"]');
    await DK.pick(tsel, '外のし');
    await say('テスト：外のし を選んで、表書きを選ばずに「確認する」');
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await DK.ec('shop', 'shop-noshi-error', { load: 1500 });
    mark('noshiError');
    const em = T('p, span, div', /のしの表書きを選択してください/);
    Caption.fixed('入力チェック：「のしの表書きを選択してください。」（FormTypeExtension の POST_SUBMIT）');
    if (em) Issue.show(R(em, 4), 'のしの表書きを選択してください。');
    await readHold(3000);
    Issue.hide();
    await DK.pick(EC.el('[id$="Shippings_0_noshi_title"]'), SRC.TEST.title);
    Caption.set('表書き「御歳暮」、名入れ「田中」');
    await DK.type('noshi_name', IME.name, { kps: 10 });
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await DK.ec('shop', 'confirm-noshi', { load: 1300 });
    const cf = EC.el('.ec-orderDelivery__noshi');
    await say('ご注文内容のご確認：外のし・御歳暮、名入れ 田中');
    if (cf) { Issue.ok(R(cf, 4), 'のし（確認）'); await readHold(2200); Issue.hide(); }
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await DK.ec('shop', 'complete-noshi', { load: 1700 });
    Caption.fixed('ご注文完了 — のし はお届け先（dtb_shipping）に保存');
    await readHold(2200);
    // 受注登録・メール
    await Win.switchTo('code');
    await say('受注登録でも見られるように：同じ FormTypeExtension を管理画面の ShippingType にも、テンプレートは @admin/Order/edit.twig');
    const EX = full('Form/Extension/ShippingTypeExtension.php');
    await openAt(EX, { top: 0 });
    const X3 = at('Form/Extension/ShippingTypeExtension.php', 3).split('\n');
    await Code.lineAfter('use Eccube\\Entity\\Shipping;', script([X3.find((l) => l.includes('as AdminShippingType;'))]), { kps: 34 });
    await Code.lineAfter('yield ShippingType::class;', script([X3.find((l) => l.includes('yield AdminShippingType::class;')).trim()]), { kps: 34 });
    await Code.save();
    check(EX, at('Form/Extension/ShippingTypeExtension.php', 3), 'ext 3');
    const EV = full('Event.php');
    await openAt(EV, { top: 0 });
    const E3 = at('Event.php', 3).split('\n');
    await Code.lineAfter("'Shopping/confirm.twig' => 'onShoppingConfirm',", script(E3.filter((l) => /'@admin\/Order\/edit.twig'|'Mail\/order.twig'/.test(l)).map((l) => l.trim())), { kps: 34 });
    const b0 = E3.findIndex((l) => l.includes('* 受注登録：')) - 2;
    const b1 = E3.findIndex((l) => l.includes('* テンプレートの $needle')) - 3;
    const cur = Code.text(EV).split('\n');
    const atLine = cur.findIndex((l) => l.includes('* テンプレートの $needle')) - 3;
    await Code.reveal(atLine, 400);
    await Code.newLineAfter(atLine);
    await Code.paste('\n' + E3.slice(b0, b1 + 1).join('\n'), { after: 300 });
    await Code.save();
    check(EV, at('Event.php', 3), 'event 3');
    await frameLines(EV, "\"お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}\", 0,", "{% if Shipping.noshi_type %}", '注文受付メール（Mail/order.twig）', { ms: 2400 });
    Issue.hide();
    await newPluginFile('Resource/template/admin/order_noshi.twig', { after: 200 });
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    W11.skipTo('11:14');
    await Win.switchTo('browser');
    await DK.tab('admin');
    await Browser.typeUrl(`localhost:8080/admin/order/${(DATA.order2 && DATA.order2.id) || 2}/edit`);
    await DK.ec('admin', 'order-edit-noshi', { load: 1400 });
    mark('orderNoshi');
    await say('受注登録：お届け先に のし（外のし・御歳暮・名入れ 田中）。電話の注文もここで入れられる');
    const nt = EC.el('[id$="Shipping_noshi_type"]');
    if (nt) {
      await hoverUi(nt, { hold: 300 });
      Issue.ok(U(() => { const a = EC.el('[id$="Shipping_noshi_type"]'); return a && a.closest('.row.mb-3'); }, () => { const b = EC.el('[id$="Shipping_noshi_name"]'); return b && b.closest('.row.mb-3'); }), '外のし・御歳暮・名入れ 田中');
      await readHold(2800);
      Issue.hide();
    }
    if (EC.has && EC.has('mail-noshi')) {
      await Browser.typeUrl(`localhost:8080/admin/order/${(DATA.order2 && DATA.order2.id) || 2}/mail`);
      await DK.ec('admin', 'mail-noshi', { load: 1200 });
      await say('メール通知（注文受付メール）：お届け先の「お届け時間」の次の行に のし');
      const rect = DK.textRect(/のし：外のし・御歳暮（名入れ：田中）/);
      const r0 = rect();
      if (r0) {
        await EC.scroll(Math.max(0, r0.top - 520 + EC.doc().defaultView.scrollY), 1300);
        Issue.ok(rect, 'のし：外のし・御歳暮（名入れ：田中）');
        await readHold(3000);
        Issue.hide();
      }
    }
  });

  /* 7 — 無効化 / 有効化, 配送CSV */
  scene('toggle', async () => {
    Caption.step(7);
    W11.skipTo('11:20');
    await Win.switchTo('code');
    await say('出荷担当の配送CSV に のし の 3 項目：PluginManager の有効化で登録し、無効化・削除で外す');
    const PM = full('PluginManager.php');
    await replaceFile('PluginManager.php', 4, { after: 200 });
    await frameLines(PM, 'private const CSV = [', "['noshi_name', 'のし名入れ'],", '配送CSV の項目', { ms: 2200 });
    await frameLines(PM, 'public function disable(', 'public function uninstall(', '無効化・削除で外す', { ms: 2200 });
    Issue.hide();
    // 無効化
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/admin/store/plugin');
    await DK.ec('admin', 'plugins-1', { load: 1000 });
    const pause = EC.el('a[href$="/disable"]');
    await say('プラグイン一覧：いったん無効化（■ 停止）。有効化し直すと PluginManager::enable が CSV の項目を登録する');
    await clickUi(pause, { kind: 'hand', after: 60 });
    await DK.ec('admin', 'plugins-disabled', { load: 2400 });
    mark('disabled');
    const off = T('tr', /ギフトのし|DaikokuGift/);
    if (off) { await hoverUi(off, { hold: 200 }); Issue.ok(R(off, 2), '無効'); await readHold(1800); Issue.hide(); }
    await DK.tab('shop');
    await Browser.typeUrl('localhost:8080/shopping');
    await DK.ec('shop', 'shop-disabled', { load: 1500 });
    await say('無効のあいだ：注文手続きは元のまま（のし欄なし）。テーブルと受注の のし の列は残る');
    const act = EC.el('.ec-orderDelivery__actions');
    if (act) { Issue.ok(R(act, 4), 'お届け時間の下に のし がない'); await readHold(2600); Issue.hide(); }
    // 有効化
    await DK.tab('admin');
    const play = EC.el('a[href$="/enable"]');
    await clickUi(play, { kind: 'hand', after: 60 });
    await DK.ec('admin', 'plugins-enabled', { load: 2400 });
    Caption.fixed('有効にしました — 注文手続きの のし も、受注の のし（外のし・御歳暮・田中）も元どおり');
    await readHold(2200);
    await Browser.typeUrl('localhost:8080/admin/setting/shop/csv/4');
    await DK.ec('admin', 'csv-setting', { load: 1200 });
    mark('csv');
    await say('設定 › CSV出力項目設定（配送CSV）：出力する項目の最後に「のし・のし表書き・のし名入れ」');
    const sel = EC.els('select[multiple]').find((s) => [...s.options].some((o) => /のし/.test(o.textContent)));
    if (sel) {
      sel.scrollTop = sel.scrollHeight;   // the list box scrolled to its end, as it was captured
      const opts = [...sel.options].filter((o) => /のし/.test(o.textContent));
      await hoverUi(opts[0] || sel, { hold: 300 });
      Issue.ok(opts.length ? U(() => opts[0], () => opts[opts.length - 1], 3) : R(sel, 3), 'のし・のし表書き・のし名入れ');
      await readHold(2600);
      Issue.hide();
    }
    await Browser.typeUrl('localhost:8080/admin/order');
    await DK.ec('admin', 'orders', { load: 1200 });
    // 受注一覧 › CSVダウンロード › 配送CSVダウンロード (the real drop-down, opened as Bootstrap does)
    const dd = EC.el('#csvDownloadDropDown');
    await say('受注一覧 › CSVダウンロード › 配送CSV', 1800);
    if (dd) {
      await clickUi(dd, { kind: 'hand', after: 120 });
      const menu = dd.parentElement.querySelector('.dropdown-menu');
      if (menu) { menu.setAttribute('data-bs-popper', ''); menu.classList.add('show'); dd.classList.add('show'); }
      await wait(300);
      const item = EC.el('#shippingCsvDownload');
      if (item) { await hoverUi(item, { hold: 200 }); await clickUi(item, { kind: 'hand', after: 80 }); }
      if (menu) { menu.classList.remove('show'); dd.classList.remove('show'); }
    }
    const csvName = CSV_NAME;
    await Browser.download(csvName, `${Math.max(1, Math.round(((DATA.csv && DATA.csv.size) || 2048) / 1024))} KB`);
    // the CSV (Shift_JIS, as EC-CUBE writes it) read back in the terminal
    await Win.switchTo('code');
    await panel(true);
    await say('配送CSV（EC-CUBE の出力・Shift_JIS）：最後の 3 列が のし。無効化の前に入った注文の のし もそのまま出る');
    const COLS = ['注文番号', '商品名', '配送先_お名前(姓)', 'のし', 'のし表書き', 'のし名入れ'];
    await run(`Import-Csv ~\\Downloads\\${CSV_NAME} -Encoding Default | Select-Object ${COLS.map((c) => (/[()]/.test(c) ? "'" + c + "'" : c)).join(', ')} | Format-Table`, csvTable(COLS), { kps: 40 });
    Issue.ok(termFind('御歳暮', 2, 1500), '外のし・御歳暮・田中');
    await readHold(3200);
    Issue.hide();
    await Code.panel(false);
  });

  /* 8 — the zip, 削除 → 独自プラグインのアップロード, production */
  scene('deploy', async () => {
    Caption.step(8);
    W11.skipTo('11:32');
    await panel(true);
    const Z = DATA.zip || { name: 'DaikokuGift-1.0.0.zip', entries: ['Controller', 'Entity', 'Event.php', 'Form', 'Nav.php', 'PluginManager.php', 'Repository', 'Resource', 'TwigBlock.php', 'composer.json'], list: [], size: 30000 };
    await say('配布用の zip：雛形の release.yml と同じく .github を除き、プラグインのフォルダーの中身をそのまま（composer.json が一番上）');
    const list = (Z.list || []).filter((l) => !/\/$/.test(l));
    await run(`tar -a -c -f ${Z.name} -C app\\Plugin\\DaikokuGift ${Z.entries.join(' ')}; (Get-Item ${Z.name}).Length`, [String(Z.size)], { kps: 40 });
    Issue.ok(termFind(String(Z.size), 1, 300), `${list.length || 23} ファイル・${Math.round(Z.size / 1024)} KB`);
    await readHold(2200);
    Issue.hide();
    await Code.panel(false);
    // 削除 → アップロード
    await Win.switchTo('browser');
    await DK.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/store/plugin');
    await DK.ec('admin', 'plugins-1', { load: 900 });
    await say('本番と同じ手順を開発環境で：無効化 → 削除してから、zip を「独自プラグインのアップロード」で入れ直す');
    await clickUi(EC.el('a[href$="/disable"]'), { kind: 'hand', after: 60 });
    await DK.ec('admin', 'plugins-disabled', { load: 2000 });
    const del = EC.el('a[data-bs-target="#localPluginDeleteModal"]');
    await clickUi(del, { kind: 'hand', after: 60 });
    await DK.ec('admin', 'plugins-uninstall-modal', { load: 0 });
    mark('uninstall');
    const btn = EC.el('#localPluginDeleteModal a.btn-ec-delete');
    Caption.set('削除：プラグインのフォルダーと plg_ のテーブル（設定・表書き）、トレイトで足した列（商品の のし対応・お届け先の のし）が消える');
    await readHold(2400);
    await clickUi(btn, { kind: 'hand', after: 60 });
    await DK.ec('admin', 'plugins-uninstalled', { load: 2400 });
    const al = EC.el('.alert');
    if (al) { Issue.ok(R(al, 3), '削除しました'); await readHold(1800); Issue.hide(); }
    await Browser.typeUrl('localhost:8080/admin/store/plugin/install');
    await DK.ec('admin', 'plugin-upload', { load: 1000 });
    const file = EC.el('#plugin_local_install_plugin_archive');
    await say('オーナーズストア › 独自プラグインのアップロード');
    await clickUi(file, { kind: 'hand', after: 60 });
    const kb = Math.max(1, Math.round((Z.size || 30000) / 1024));
    await FileDialog.pick({ folder: ['PC', 'ローカル ディスク (C:)', 'work', 'daikoku-eccube'], look: 900, files: [
      { name: 'app', date: '2026/11/03 10:18', type: 'ファイル フォルダー', size: '' },
      { name: 'docs', date: '2026/10/30 17:02', type: 'ファイル フォルダー', size: '' },
      { name: 'html', date: '2026/10/22 9:40', type: 'ファイル フォルダー', size: '' },
      { name: 'src', date: '2026/10/22 9:40', type: 'ファイル フォルダー', size: '' },
      { name: Z.name, date: '2026/11/03 11:33', type: '圧縮 (zip 形式) フォルダー', size: `${kb.toLocaleString()} KB` },
    ], pick: Z.name });
    const W = EC.doc().defaultView;
    try { const dt = new W.DataTransfer(); dt.items.add(new W.File(['PK'], Z.name, { type: 'application/zip' })); file.files = dt.files; } catch (e) { /* the look only */ }
    await clickUi(T('button', /アップロード/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await DK.ec('admin', 'plugins-installed', { load: 3200 });
    mark('installed');
    const pr = T('tr', /ギフトのし|DaikokuGift/);
    await say('zip からインストールされた（無効の状態）→ 有効化');
    if (pr) { await hoverUi(pr, { hold: 200 }); Issue.ok(R(pr, 2), 'DaikokuGift 1.0.0 — 無効'); await readHold(1800); Issue.hide(); }
    await clickUi(EC.el('a[href$="/enable"]'), { kind: 'hand', after: 60 });
    await DK.ec('admin', 'plugins-final', { load: 2600 });
    const pr2 = T('tr', /ギフトのし|DaikokuGift/);
    if (pr2) { await hoverUi(pr2, { hold: 200 }); Issue.ok(R(pr2, 2), '有効'); await readHold(1800); Issue.hide(); }
    await Browser.typeUrl('localhost:8080/admin/daikoku_gift/noshi_title');
    await DK.ec('admin', 'noshi-list-final', { load: 1100 });
    Caption.issue('削除すると表書きは初期の 6 件に', '追加した「御年賀」は plg_ のテーブルと一緒に消えた（入れ直しで PluginManager::enable の初期データ）');
    const tb = EC.el('table');
    if (tb) Issue.show(R(tb, 3), '初期データ（御年賀がない）');
    await readHold(3400);
    Issue.hide();
    if (EC.has && EC.has('product-reset')) {
      await Browser.typeUrl('localhost:8080/admin/product/product/290/edit');
      await DK.ec('admin', 'product-reset', { load: 1300 });
      const cb = EC.el('#admin_product_noshi_enabled');
      Caption.issue('のし対応 も空に', '削除で dtb_product の列も消え、入れ直しで空の列に。受注の のし も同じ → 本番では削除せず、更新は「アップデート」で');
      if (cb) Issue.show(R(cb.closest('.row') || cb, 4), 'のし対応（未設定に戻った）');
      await readHold(3800);
      Issue.hide();
    }
    await DK.tab('shop');
    await Browser.typeUrl('localhost:8080/shopping');
    await DK.ec('shop', 'shop-final', { load: 1500 });
    const fb = EC.el('#daikoku-noshi-0');
    Caption.fixed(`のし対応を ${(DATA.noshiProducts2 || DATA.noshiProducts || []).length || 12} 商品に設定し直して、zip から入れ直したプラグインの注文手続き`);
    if (fb) Issue.ok(R(fb, 4), 'のし');
    await readHold(2400);
    Issue.hide();
    // production (reconstructed)
    W11.skipTo('11:45');
    await Win.switchTo('code');
    await panel(true);
    await say('本番：同じ zip をサーバーへ送り、bin/console でインストール・有効化（本番の作業は再現）');
    await run(`scp ${Z.name} daikoku-prod:/tmp/`, [`${Z.name}                     100%   ${kb}KB   1.2MB/s   00:00`], { kps: 30 });
    await run(`ssh daikoku-prod "cd /var/www/shop && bin/console eccube:plugin:install --path=/tmp/${Z.name} && bin/console eccube:plugin:enable --code=DaikokuGift && bin/console cache:clear --no-warmup"`, [
      '', ...consoleOut(DATA.installOut || ' [OK] Installed.').filter((l) => /OK/.test(l)),
      ...consoleOut(DATA.enableOut || ' [OK] Plugin Enabled.').filter((l) => /OK/.test(l)),
      ' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.', ''], { kps: 26 });
    Issue.ok(termFind('Plugin Enabled', 1, 600), '本番へ反映');
    await readHold(2000);
    Issue.hide();
    await Code.panel(false);
    // the live shop
    await Win.switchTo('browser');
    await DK.tab('live');
    Browser.nav('live', { url: LIVE + '/shop/products/detail/290', title: TITLE('gift') });
    Browser.loading('live', true);
    await Store.load('gift');
    Browser.loading('live', false);
    mark('live');
    await say('公開中の進物用おこし：お歳暮の注文は、注文手続きの のし欄で（商品ページの「備考欄に」の案内は、ショップ側で差し替え）');
    const g = storeText('.productDetailPage-descriptionDetail, p, div', /進物/);
    if (g) { await Store.scrollToEl(g, 300, 1400); Issue.ok(SR(g, 4), '進物用'); await readHold(2400); Issue.hide(); }
    D.Cursor.kind('arrow');
    Caption.set('EC-CUBE 4.3 専用プラグイン：雛形・エンティティと独自メニュー・トレイトと FormTypeExtension・TemplateEvent・PluginManager・zip で配布');
    await wait(4200);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['product', 'gift'],
    fontText: JSON.stringify(JA) + JSON.stringify(IME) + P['docs/request-2026-11.md'] + Object.values(SRC.files(4)).join('') + 'システムエラーのし対応外のし内のし御年賀',
    async prepare() {
      const tree = [
        ['app', 'dir', 1], ['app/Customize', 'dir'], ['app/Plugin', 'dir', 1], ['app/config', 'dir'], ['app/proxy', 'dir'], ['app/template', 'dir'],
        ['bin', 'dir'], ['docs', 'dir', 1], ['docs/request-2026-11.md'], ['html', 'dir'],
        ['src', 'dir', 1], ['src/Eccube', 'dir', 1], ['src/Eccube/Event', 'dir', 1], ['src/Eccube/Event/TemplateEvent.php'],
        ['src/Eccube/Form', 'dir', 1], ['src/Eccube/Form/Type', 'dir', 1], ['src/Eccube/Form/Type/Shopping', 'dir', 1], ['src/Eccube/Form/Type/Shopping/ShippingType.php'],
        ['src/Eccube/Resource', 'dir', 1], ['src/Eccube/Resource/template', 'dir', 1], ['src/Eccube/Resource/template/default', 'dir', 1],
        ['src/Eccube/Resource/template/default/Shopping', 'dir', 1], ['src/Eccube/Resource/template/default/Shopping/index.twig'],
        ['src/Eccube/Service', 'dir', 1], ['src/Eccube/Service/PluginService.php'],
        ['var', 'dir'], ['vendor', 'dir'], ['.env'], ['.gitignore'], ['composer.json'], ['README.md'],
      ];
      Code.init({ ...P }, tree);
      Code.show('docs/request-2026-11.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: TITLE('product'), url: LIVE + '/shop/products/detail/133', page: 'store', fav: 'store' });
      await Store.load('product');
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      DK.blur();
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
