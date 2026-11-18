/*
 * Timeline: 呉竹 BtoBオンライン注文サイト (order.kuretake.co.jp, EC-CUBE 4) — BtoB features on the dev copy of EC-CUBE 4.3:
 * the request and the public site → 取引先情報 (Customer / Product entity extensions, admin forms, proxies, schema update)
 * → 会員登録の承認制 (仮会員機能, 会社名 required, no self-activation, the admin approves → 本登録完了 mail) → 卸価格
 * (Doctrine postLoad: 定価 × 掛率 — the first version writes the 卸価格 into the product master on flush; fixed) →
 * 発注単位 (a cart PurchaseFlow validator) → 掛け払い (a payment for approved 取引先 only; the 配送方法 setting) →
 * 受注管理 → git / deploy → the public site.
 * Every EC-CUBE screen is the real EC-CUBE 4.3.1-p1 running the code typed here (js/ec-snapshot.js,
 * tools/snapshots/ec-kuretake-btob/capture-ec.js); the public site is order.kuretake.co.jp (js/site-snapshot.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, EC = window.EC, KB = window.KB;
  const { esc, wait, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  /** holds for reading, a little shorter than the kit's default pace (the video is long) */
  const readHold = (ms) => K.readHold(Math.round(ms * 0.7));
  const SRC = F.SRC, CORE = F.CORE, TPL = SRC.templates(CORE);
  const C = SRC.C, TD = SRC.T;
  const DEV = KB.DEV, LIVE = KB.LIVE;
  const DATA = EC.data || {};
  const S = window.SITE_SNAPSHOT;
  const AP = SRC.ACCOUNTS.applicant;
  /** a password is typed as the browser shows it */
  const DOTS = '•'.repeat(AP.pass.length);
  const TITLE = (k) => ((S && S.pages[k] && S.pages[k].pc || '').match(/<title>([^<]*)<\/title>/) || [])[1] || (S && S.title) || '呉竹 BtoBオンライン注文サイト';
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '有限会社さくら書道用品（テスト）': [{ r: 'yuugengaishasakura', segs: ['有限会社', 'さくら'] }, { r: 'shodouyouhin(tesuto)', segs: ['書道用品', '（', 'テスト', '）'] }],
    'テスト': { r: 'tesuto', segs: ['テスト'] },
    '一郎': { r: 'ichirou', segs: ['一郎'] },
    '掛け払い': { r: 'kakebarai', segs: ['掛け払い'] },
    '掛け払い（請求書払い）': { r: 'kakebarai(seikyuushobarai)', segs: ['掛け払い', '（', '請求書払い', '）'] },
    '通常価格': { r: 'tsuujoukakaku', segs: ['通常価格'] },
    '定価': { r: 'teika', segs: ['定価'] },
    '卸価格・発注単位（取引先）': { r: 'oroshikakaku/hacchuutanni(torihikisaki)', segs: ['卸価格', '・', '発注単位', '（', '取引先', '）'] },
    '卸価格（掛率': { r: 'oroshikakaku(kakeritsu', segs: ['卸価格', '（', '掛率'] },
    '）：': { r: '):', segs: ['）：'] },
    '税抜': { r: 'zeinuki', segs: ['税抜'] },
    '発注単位：': { r: 'hacchuutanni:', segs: ['発注単位', '：'] },
    '個': { r: 'ko', segs: ['個'] },
    'ログインして注文する': { r: 'roguinnshitechuumonsuru', segs: ['ログインして', '注文する'] },
    '卸価格の表示とご注文は、お取引先様のアカウントでログインしてからご利用いただけます。': [
      { r: 'oroshikakakunohyoujitogochuumonha,', segs: ['卸価格の', '表示と', 'ご注文は', '、'] },
      { r: 'otorihikisakisamanoakaunntoderoguinnshitekara', segs: ['お取引先様の', 'アカウントで', 'ログインしてから'] },
      { r: 'goriyouitadakemasu.', segs: ['ご利用', 'いただけます。'] }],
    '品番：': { r: 'hinban:', segs: ['品番', '：'] },
    '　発注単位：': { r: ' hacchuutanni:', segs: ['　', '発注単位', '：'] },
    '取引先を承認：本登録完了メールを送信': { r: 'torihikisakiwoshounin:honntourokukanryoume-ruwosoushinn', segs: ['取引先を', '承認', '：', '本登録', '完了', 'メールを', '送信'] },
    '画面のための値：読み込んだ時点の値として': { r: 'gamennnotamenoatai:yomikondajitennnoataitoshite', segs: ['画面のための', '値', '：', '読み込んだ', '時点の', '値として'] },
    'に記録し、': { r: 'nikirokushi,', segs: ['に', '記録し', '、'] },
    'でデータベースへ書き戻さない': { r: 'dede-tabe-suhekakimodosanai', segs: ['で', 'データベースへ', '書き戻さない'] },
    '「': { r: '[', segs: ['「'] },
    '」は': { r: ']ha', segs: ['」は'] },
    '個単位でのご注文です。数量を': { r: 'kotannidenogochuumondesu.suuryouwo', segs: ['個', '単位での', 'ご注文です。', '数量を'] },
    '個にしました。': { r: 'konishimashita.', segs: ['個に', 'しました。'] },
    '機能（承認制・卸価格・発注単位・掛け払い）': { r: 'kinou(shouninnsei/oroshikakaku/hacchuutanni/kakebarai)', segs: ['機能', '（', '承認制', '・', '卸価格', '・', '発注単位', '・', '掛け払い', '）'] },
  };

  /* ------------------------------------------------ the editor */
  const script = (lines, after) => K.codeScript(lines, JA, { unit: '    ', after });
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) { const f = Code.files[path]; if (f && /\.(php|twig|ya?ml|json|css)$/.test(path)) f.indent = '    '; show0(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); Term.render('<span class="caret"></span>'); };
  const src = (p) => SRC.F[p].replace(/\n$/, '');
  /** a new file from the explorer: pasted, with lines [a, b) typed (o.type), saved */
  async function newFile(path, text, o = {}) {
    KB.tree([path.split('/').slice(0, -1).join('/') + '/']);
    await Code.newFile(path);
    Code.files[path].indent = '    ';
    const A = text.replace(/\n$/, '').split('\n');
    if (!o.type) await Code.paste(A.join('\n'), { after: o.after != null ? o.after : 400 });
    else {
      const [a, b] = o.type;
      // the file without those lines pasted (the caret ends at the last line's start), then the lines typed in place
      await Code.paste([...A.slice(0, a), ...A.slice(b)].join('\n'), { after: 0 });
      Code.ensureVisible(Code.ins.line);
      Code.render();
      await wait(200);
      await typeLines(A.slice(a, b), a - 1, { kps: o.kps || 44 });
    }
    if (!o.type) { Code.top = 0; Code.render(); }
    await Code.save({ status: 'U' });
    check(path, A.join('\n'), path.split('/').pop());
    KB.tree();
    return path;
  }
  /** lines typed after line `at` of the file on show (Enter + VS Code's indent corrected) */
  async function typeLines(lines, at, o = {}) {
    const f = Code.files[Code.active];
    await Code.reveal(at, 600);
    await Code.newLineAfter(at);
    await Code.type(script(lines, f.lines[at]), { kps: o.kps || 46 });
  }
  /** lines pasted after line `at` of the file on show (a prepared snippet) */
  async function pasteLines(lines, at) {
    await Code.reveal(at, 600);
    await Code.newLineAfter(at);
    await Code.paste(String.fromCharCode(10) + lines.join(String.fromCharCode(10)), { after: 700 });
  }
  /** a frame around lines of a file shown in the editor, found by their text */
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const frameLines = async (path, a, b, label, o = {}) => {
    const t = Code.text(path);
    const i = lineOf(t, a, o.from || 0);
    const j = b ? lineOf(t, b, i) : i;
    if (i < 0) return;
    await Code.reveal(Math.round((i + Math.max(i, j)) / 2), 500);
    if (o.issue) Issue.show(linesRect(i, Math.max(i, j), o.w || 1100), label); else Issue.ok(linesRect(i, Math.max(i, j), o.w || 1100), label);
    await readHold(o.ms || 2600);
  };

  /* ------------------------------------------------ what the commands print */
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 40, ...o });
  const DC = 'docker compose exec ec-cube ';
  const consoleOut = (text, max = 14) => {
    const a = String(text || '').replace(/\/srv\/eccube/g, '/var/www/html').replace(/\r/g, '').split('\n')
      .map((l) => esc(l).replace(/^(\s*)\[OK\]/, '$1<span class="tg">[OK]</span>')).filter((l, i, x) => !(l.trim() === '' && (i === 0 || x[i - 1].trim() === '')));
    return a.length > max ? [...a.slice(0, max - 1), '<span class="tdim">…</span>'] : a;
  };
  const sqlOut = (text, max = 7) => {
    const a = String(text || '').replace(/\r/g, '').split('\n').filter((l) => l.trim());
    const out = a.slice(0, max).map((l) => `<span class="tsql">${esc(l.length > 170 ? l.slice(0, 168) + ' …' : l)}</span>`);
    if (a.length > max) out.push(`<span class="tdim">…（ほか ${a.length - max} 行。SQLite はテーブルを作り直して列を追加）</span>`);
    return out;
  };
  const cacheClear = () => run(DC + 'bin/console cache:clear --no-warmup', ['', ' // Clearing the cache for the <span class="tc">prod</span> environment with debug <span class="tc">false</span>', '',
    ' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.', ''], { kps: 46 });
  /** EC-CUBE's own log lines (captured): the request details cut, the date / time of the video */
  const logOut = (L) => ((L && L.lines) || []).map((l) => {
    const d = window.Win11.now();
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const t = l.replace(/\/srv\/eccube/g, '/var/www/html').replace(/\d{4}-\d\d-\d\dT\d\d:\d\d/, '2026-10-01T' + hm).replace(/\.\d{6}\+09:00/, '+09:00')
      .replace(/ \[\w{8}\] \[\w{7}\] \[\d+\] \[Eccube\\Log\\Logger:log:\d+\]/, '').replace(/ \[(POST|GET), .*\]\s*$/, '').replace(/\s*\[\]\s*$/, '');
    return `<span class="tlog">${esc(t.slice(0, 200))}</span>`;
  });
  const logFile = (L) => ((L && L.file) || 'var/log/prod/admin-2026-10-01.log').replace(/\d{4}-\d{2}-\d{2}/, '2026-10-01');

  /* ------------------------------------------------------------- frames */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? EC.el(el) : el; if (!e) return null; const r = screenRect(e); if (!r.width) return null; return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  /** one frame around the form rows of two fields (label column included) */
  const RU = (a, b, pad = 4) => () => {
    const x = a(), y = b();
    const ra = x && (x.closest('.row') || x), rb = y && (y.closest('.row') || y);
    if (!ra || !rb) return null;
    const r1 = screenRect(ra), r2 = screenRect(rb);
    return { left: Math.min(r1.left, r2.left) - pad, top: r1.top - pad, width: Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left) + pad * 2, height: r2.bottom - r1.top + pad * 2 };
  };
  const termFind = (text, n = 1, w = 1200) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    let i = -1;
    rows.forEach((r, k) => { if (r.textContent.includes(text)) i = k; });
    if (i < 0) return null;
    const a = screenRect(rows[i]), b = screenRect(rows[Math.min(rows.length - 1, i + n - 1)]);
    return { left: a.left, top: a.top, width: Math.min(w, a.width), height: b.bottom - a.top };
  };
  const say = (text, ms) => { Caption.set(text); return readHold(ms != null ? ms : Math.min(3500, Math.max(1600, text.length * 46))); };
  const T = (sel, re) => KB.text(sel, re);
  const shown = (e) => !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().width > 0;
  /** the first element on screen (laid out) with that text — the header's, not the hidden drawer's */
  const TV = (sel, re) => EC.els(sel).find((e) => shown(e) && re.test(e.textContent.replace(/\s+/g, ' ').trim())) || null;
  const storeText = (sel, re) => { const d = Store.doc; if (!d) return null; const all = [...d.querySelectorAll(sel)].filter((e) => re.test(e.textContent)); return all.length ? all[all.length - 1] : null; };
  const flash = () => EC.el('.alert-success') || EC.el('.c-contentsArea .alert');
  const row = (re) => () => { const r = EC.els('table tbody tr').filter((x) => re.test(x.textContent)); return r[0] || null; };
  const scrollTo = async (el, offset = 160, ms = 900) => {
    if (typeof el === 'string') el = EC.el(el);
    if (!el) return;
    const win = EC.doc().defaultView;
    await EC.scroll(Math.max(0, el.getBoundingClientRect().top + win.scrollY - offset), ms);
  };
  /** the admin's left menu: a group opened (Bootstrap's collapse, as its script does), then the item */
  async function adminNav(group, path) {
    const title = EC.el(`a.c-mainNavArea__navItemTitle[href="#nav-${group}"]`);
    const ul = EC.el(`#nav-${group}`);
    if (ul && !ul.classList.contains('show')) {
      await clickUi(title, { kind: 'hand', after: 120 });
      ul.classList.add('show');
      if (title) title.classList.remove('collapsed');
      await wait(300);
    }
    const a = EC.els(`#nav-${group} a`).find((x) => (x.getAttribute('href') || '').replace(/[?#].*$/, '').endsWith(path));
    const sub = a && a.closest('ul.collapse');
    if (sub && sub !== ul && !sub.classList.contains('show')) {
      const st = EC.el(`a[href="#${sub.id}"]`);
      if (st) await clickUi(st, { kind: 'hand', after: 120 });
      sub.classList.add('show');
      if (st) st.classList.remove('collapsed');
      await wait(300);
    }
    if (a) await clickUi(a, { kind: 'hand', after: 80 });
  }
  const admin = (key, o = {}) => KB.ec('admin', key, { load: 900, ...o });
  const dev = (key, o = {}) => KB.ec('dev', key, { load: 900, ...o });
  const submit = (re = /登録|保存/) => clickUi(T('button', re) || EC.el('.c-conversionArea button[type=submit]') || EC.el('button.btn-ec-conversion'), { kind: 'arrow', after: 60 });

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request, the public site, the dev copy */
  scene('request', async () => {
    Caption.step(1);
    const RQ = 'docs/request-2026-09.md';
    await say('依頼（営業管理部）：取引先専用の注文サイトに、取引先情報・承認制の会員登録・卸価格・発注単位・掛け払いを');
    await hoverUi(Code.lineEl(0), { ax: 0.3, hold: 300 });
    await frameLines(RQ, '## 2.', '会社名', '会員登録は承認制（仮登録 → 本登録）', { ms: 2800 });
    await frameLines(RQ, '## 3.', 'ゲスト購入なし', '卸価格 = 定価 × 掛率（ログインした取引先だけ）', { ms: 2800 });
    await frameLines(RQ, '## 5.', '与信審査', '掛け払いは承認済みの取引先だけ', { ms: 2400 });
    Issue.hide();
    // the public site
    await Win.switchTo('browser');
    await KB.tab('live');
    await say('公開中の BtoB オンライン注文サイト（EC-CUBE 4）：カテゴリ・定価・発注単位は誰でも見られ、ご注文はログインが必要');
    const login = Store.doc && Store.doc.querySelector('a[href$="/mypage/login"]');
    if (login) { await hoverUi(login, { hold: 700 }); }
    await Browser.typeUrl('order.kuretake.co.jp/products/list?category_id=128');
    Browser.nav('live', { url: LIVE + '/products/list?category_id=128', title: TITLE('list') });
    Browser.loading('live', true);
    await Store.load('list');
    Browser.loading('live', false);
    await wait(500);
    const unit = storeText('p', /発注単位：10個/);
    if (unit) {
      await Store.scrollToEl(unit, 360, 1200);
      Issue.show(() => { const r = screenRect(unit.closest('li') || unit); return { left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 }; }, '品番・定価・発注単位：10個');
      await readHold(3200);
      Issue.hide();
    }
    await Browser.typeUrl('order.kuretake.co.jp/features/new_customer');
    Browser.nav('live', { url: LIVE + '/features/new_customer', title: TITLE('entry') });
    Browser.loading('live', true);
    await Store.load('entry');
    Browser.loading('live', false);
    const kari = storeText('p, div, li', /本登録完了のメール/);
    if (kari) {
      await Store.scrollToEl(kari, 300, 1000);
      Issue.show(() => screenRect(kari), '仮登録 → 本登録完了のメール');
    }
    await say('新規会員登録は「仮登録」→ 呉竹が確認して本登録 → 本登録完了のメール');
    Issue.hide();
    // the dev copy
    await KB.tab('dev');
    await say('開発環境（Docker の EC-CUBE 4.3.1、http://localhost:8080）：本番の公開データ（カテゴリ・29 商品・お知らせ）を取り込み済み');
    await scrollTo('.ec-shelfGrid', 120, 1000);
    Caption.issue('今は標準のまま', '誰でも「カートに入れる」が押せて、価格は定価（税込）だけ');
    const add = EC.el('.add-cart');
    if (add) { await hoverUi(add, { kind: 'hand', hold: 500 }); Issue.show(R(add, 4), 'ゲストでも注文できる'); }
    await readHold(3000);
    Issue.hide();
    await EC.scroll(0, 600);
    await KB.tab('admin');
    await adminNav('customer', '/admin/customer');
    await admin('a-customers-0');
    await say('管理画面 › 会員管理：取引先は会員（会社名・担当者）として登録。取引先コードや掛率を持つ欄はまだない');
    Issue.show(R('.c-contentsArea table', 2), '会員 3 件（テスト用の取引先）');
    await readHold(2600);
    Issue.hide();
  });

  /* 2 — 取引先情報: entity extensions, admin forms, proxies, schema */
  scene('entity', async () => {
    Caption.step(2);
    await Win.switchTo('code');
    await say('会員（Customer）を Trait で拡張：取引先コード・業界・掛率・掛け払い（app/Customize/Entity）');
    const CT = C + 'Entity/CustomerTrait.php';
    await newFile(CT, src(CT), { after: 500 });
    await frameLines(CT, '@EntityExtension', '@EntityExtension', '@EntityExtension("Eccube\\Entity\\Customer")', { ms: 2200, w: 700 });
    await frameLines(CT, '掛率（%）', 'private $wholesale_rate', '掛率（smallint）', { ms: 2200, w: 900 });
    Issue.hide();
    const PT = C + 'Entity/ProductTrait.php';
    await newFile(PT, src(PT), { after: 300 });
    await say('管理画面の入力欄は FormExtension で追加（auto_render：会員登録・商品登録の画面に自動で出る）');
    const CX = C + 'Form/Extension/Admin/CustomerTypeExtension.php';
    await newFile(CX, src(CX), { after: 300 });
    await frameLines(CX, "->add('wholesale_rate'", "'eccube_form_options'", 'auto_render', { ms: 2400, w: 900, from: lineOf(Code.text(CX), "->add('wholesale_rate'") });
    Issue.hide();
    const PX = C + 'Form/Extension/Admin/ProductTypeExtension.php';
    await newFile(PX, src(PX), { after: 300 });
    // proxies + schema
    await panel(true);
    await say('プロキシを生成して、データベースに列を追加（--dump-sql で SQL を確認してから --force）');
    await run(DC + 'bin/console eccube:generate:proxies', consoleOut(DATA.proxies, 8));
    await cacheClear();
    await run(DC + 'bin/console doctrine:schema:update --dump-sql', ['', ...sqlOut(DATA.schemaDump, 6), '']);
    Issue.show(termFind('dtb_customer', 1, 1300), 'dtb_customer・dtb_product に列を追加');
    await readHold(2600);
    Issue.hide();
    await run(DC + 'bin/console doctrine:schema:update --force', consoleOut(DATA.schemaForce, 8));
    Issue.ok(termFind('[OK]', 1, 900), 'Database schema updated successfully!');
    await readHold(1800);
    Issue.hide();
    await Code.panel(false);
    // the admin forms
    await Win.switchTo('browser');
    await KB.tab('admin');
    await say('取引先（株式会社みなと文具）の会員登録画面：下に「取引先コード・業界・掛率・掛け払い」');
    const minato = row(/minato.test/)();
    if (minato) await clickUi(minato.querySelector('a') || minato, { kind: 'hand', after: 60 });
    await admin('a-customer-ext', { load: 1200 });
    Issue.ok(RU(() => EC.el('#admin_customer_customer_code'), () => EC.el('#admin_customer_invoice_payment_1')), '取引先情報（基幹の取引先マスタの値）');
    await readHold(3400);
    Issue.hide();
    await say('商品登録：美文字筆ぺん 中字に発注単位 10（ほかの商品は基幹の品番マスタから一括で登録）');
    await adminNav('product', '/admin/product');
    await admin('a-products-0', { load: 700, after: 200 });
    const fude = row(/XT3-10S|美文字筆ぺん 中字/)();
    if (fude) await clickUi(fude.querySelector('a[href*="/edit"]') || fude, { kind: 'hand', after: 60 });
    await admin('a-product-991', { load: 1100 });
    await KB.type('order_unit', '10', { kps: 8 });
    await submit(/登録/);
    await admin('a-product-991-saved', { load: 1200 });
    Issue.ok(R('#admin_product_order_unit', 6), '発注単位 10');
    await readHold(2200);
    Issue.hide();
  });

  /* 3 — 会員登録の承認制 */
  scene('approval', async () => {
    Caption.step(3);
    await say('設定 › 店舗設定 › 基本設定：「仮会員機能」を有効に（登録はまず仮会員）');
    await Browser.typeUrl('localhost:8080/admin/setting/shop');
    await admin('a-shop', { load: 1100 });
    const actRow = () => { const e = EC.el('#shop_master_option_customer_activate'); return e && (e.closest('.row') || e.parentElement); };
    await scrollTo(actRow(), 420, 800);
    const tg = EC.el('#shop_master_option_customer_activate');
    const tgBox = tg && (tg.closest('.form-check, .custom-switch, label, .col') || tg);
    await clickUi(tgBox, { after: 80 });
    KB.check(tg, true);
    await wait(500);
    await submit(/登録/);
    await admin('a-shop-saved', { load: 1200 });
    await scrollTo(actRow(), 420, 600);
    Issue.ok(R(actRow, 4), '仮会員機能：有効');
    await readHold(2200);
    Issue.hide();
    // the code
    await Win.switchTo('code');
    await say('新規会員登録の会社名を必須に（EntryType の FormExtension）');
    const EX = C + 'Form/Extension/EntryTypeExtension.php';
    await newFile(EX, src(EX), { after: 300 });
    await frameLines(EX, "add('company_name'", 'NotBlank', '会社名：必須', { ms: 1800, w: 800 });
    Issue.hide();
    await say('承認制：仮登録メールの本登録 URL は使えなくし、管理画面で「本会員」にしたときに本登録完了メール');
    const AS = C + 'EventSubscriber/CustomerApprovalSubscriber.php';
    const A1 = src(AS).split('\n');
    const at = A1.findIndex((l) => l.includes('if ($this->statusBefore === CustomerStatus::PROVISIONAL'));
    await newFile(AS, src(AS), { type: [at, at + 3], kps: 30 });
    await frameLines(AS, 'if ($this->statusBefore', 'log_info(', '仮会員 → 本会員：sendCustomerCompleteMail()', { ms: 2600, w: 1200 });
    Issue.hide();
    // templates
    await say('仮登録完了の画面と仮登録メールの文面：EC-CUBE の標準をコピーして、本登録 URL の案内を差し替え');
    await panel(false);
    await run(String.raw`Copy-Item src\Eccube\Resource\template\default\Entry\complete.twig app\template\default\Entry\ -Force; Copy-Item src\Eccube\Resource\template\default\Mail\entry_confirm*.twig app\template\default\Mail\ -Force`, [], { kps: 64 });
    await Code.panel(false);
    for (const k of ['Entry/complete.twig', 'Mail/entry_confirm.twig', 'Mail/entry_confirm.html.twig']) { Code.addFile(TD + k, TPL[TD + k], { silent: true }); Code.files[TD + k].indent = '    '; Code.mark(TD + k, 'U'); }
    KB.tree();
    await Code.openFile(TD + 'Mail/entry_confirm.twig', { top: 14 });
    await readHold(1600);
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // the dev shop: register a test 取引先
    await Win.switchTo('browser');
    await KB.tab('dev');
    await say('開発環境で新規会員登録：会社名が必須に（テスト用の取引先。住所などは入力済み）');
    await clickUi(TV('a', /新規会員登録/), { kind: 'hand', after: 60 });
    await dev('f-entry', { load: 1200 });
    Issue.show(R(() => { const b = EC.field('company'); return b && (b.closest('dl') || b); }, 4), '会社名 必須');
    await readHold(1600);
    Issue.hide();
    await KB.type('company', [JA['有限会社さくら書道用品（テスト）']].flat(), { kps: 20 });
    await KB.type('name01', [JA['テスト']], { kps: 18 });
    await KB.type('name02', [JA['一郎']], { kps: 18 });
    await scrollTo(EC.field('email1'), 300, 900);
    await KB.type('email1', AP.email, { kps: 26 });
    await KB.type('email2', AP.email, { kps: 30 });
    await KB.type('pass1', DOTS, { kps: 40, });
    await KB.type('pass2', DOTS, { kps: 40, });
    const pol = EC.el('#entry_user_policy_check');
    if (pol) { await scrollTo(pol, 400, 700); await clickUi(pol, { after: 60 }); KB.check(pol, true); }
    await clickUi(T('button', /確認/) || EC.el('button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await dev('f-entry-confirm', { load: 1300 });
    await say('確認画面 → 会員登録をする', 1600);
    const reg = T('button', /登録/);
    if (reg) { await scrollTo(reg, 500, 900); await clickUi(reg, { kind: 'hand', after: 60 }); }
    await dev('f-entry-complete', { load: 1500 });
    Caption.fixed('仮登録完了：「呉竹で確認して本登録の手続きが終わったら本登録完了のメール」');
    Issue.ok(R('.ec-reportDescription', 6), '仮登録（本登録 URL なし）');
    await readHold(3000);
    Issue.hide();
    // the login fails while 仮会員
    await clickUi(TV('a', /ログイン/), { kind: 'hand', after: 60 });
    Caption.set('仮会員のままログインしてみる');
    await dev('f-login', { load: 900 });
    await KB.type('email', AP.email, { kps: 30 });
    await KB.type('pass', DOTS, { kps: 40, });
    await clickUi(T('button', /ログイン/), { kind: 'hand', after: 60 });
    await dev('f-login-fail', { load: 1100 });
    Caption.set('仮会員のあいだはログインできない（承認待ち）');
    Issue.show(R(() => T('p, div, span', /ログインできませんでした/), 6), 'ログインできない');
    await readHold(2600);
    Issue.hide();
    // the admin approves
    await KB.tab('admin');
    await say('管理画面：会員一覧に仮会員の取引先。取引の確認がとれたら取引先情報を入れて「本会員」に');
    await Browser.typeUrl('localhost:8080/admin/customer');
    await admin('a-customers', { load: 1100 });
    const newRow = row(/sakura.test/)();
    if (newRow) { Issue.show(R(newRow, 2), '会員 ID 4：仮会員（再送のアイコン）'); await readHold(2000); Issue.hide(); await clickUi(newRow.querySelector('a') || newRow, { kind: 'hand', after: 60 }); }
    await admin('a-customer-new-b2b', { load: 1100 });
    await KB.type('code', AP.code, { kps: 12 });
    const bt = EC.el('#admin_customer_business_type');
    if (bt) { await clickUi(bt, { after: 200 }); KB.select(bt, AP.business); }
    await KB.type('rate', String(AP.rate), { kps: 8 });
    const inv = EC.el('#admin_customer_invoice_payment_1') || EC.els('input[name*="[invoice_payment]"]').pop();
    if (inv) { await clickUi(inv, { after: 60 }); KB.radio(inv); }
    await KB.ec('admin', 'a-customer-new-filled', { load: 0, after: 200 });
    Caption.set('取引先コード T-20481・書道専門店・掛率 60%・掛け払い 利用可、会員ステータスは「本会員」');
    const st2 = EC.el('#admin_customer_status');
    if (st2) { await clickUi(st2, { after: 300 }); }
    await readHold(1400);
    await submit(/登録/);
    await admin('a-customer-approved', { load: 1500 });
    Issue.ok(R(flash, 2), '保存しました');
    await readHold(1600);
    Issue.hide();
    // the mail (EC-CUBE's log)
    await Win.switchTo('code');
    await panel(false);
    const L = DATA.approveLog;
    await run(`${DC}tail -n 3 ${logFile(L)}`, [...logOut(L), ''], { kps: 30 });
    Caption.fixed('承認と同時に本登録完了メール（EC-CUBE の MailService が送信、ログに記録）');
    Issue.ok(termFind('取引先を承認', 1, 1400), '本登録完了メールを送信');
    await readHold(2800);
    Issue.hide();
    await Code.panel(false);
  });

  /* 4 — 卸価格 */
  scene('wholesale', async () => {
    Caption.step(4);
    await say('卸価格：ログイン中の取引先には「定価 × 掛率」を販売価格に。Doctrine の postLoad で ProductClass の価格を差し替える');
    const WP = C + 'Doctrine/EventSubscriber/WholesalePriceSubscriber.php';
    const W1 = SRC.wholesale(false).replace(/\n$/, '');
    const wl = W1.split('\n');
    const w0 = wl.findIndex((l) => l.includes('$price = (string) floor('));
    await newFile(WP, W1, { type: [w0, w0 + 3], kps: 30 });
    await frameLines(WP, '$price = (string) floor(', 'setPrice02IncTax(', '販売価格 = 定価 × 掛率（税込も計算し直す）', { ms: 3000, w: 1250 });
    Issue.hide();
    await say('カート・ご注文手続きはログインした取引先だけ（未ログインはログイン画面へ）');
    const MO = C + 'EventSubscriber/MemberOnlyOrderSubscriber.php';
    await newFile(MO, src(MO), { after: 300 });
    await frameLines(MO, "preg_match('/^(cart|product_add_cart|shopping)/'", 'RedirectResponse($url)', 'cart・shopping はログイン必須', { ms: 2400, w: 1250 });
    Issue.hide();
    // templates: detail / list
    await say('商品詳細・一覧のテンプレート：標準をコピーして、卸価格・発注単位と「ログインして注文する」を追加');
    await panel(false);
    await run(String.raw`Copy-Item src\Eccube\Resource\template\default\Product\detail.twig, src\Eccube\Resource\template\default\Product\list.twig app\template\default\Product -Force`, [], { kps: 64 });
    await Code.panel(false);
    const DT = TD + 'Product/detail.twig', LT = TD + 'Product/list.twig';
    for (const k of [DT, LT]) { Code.addFile(k, CORE[k.replace(TD, 'src/Eccube/Resource/template/default/')], { silent: true }); Code.files[k].indent = '    '; Code.mark(k, 'U'); }
    KB.tree();
    await Code.openFile(DT, { top: 330 });
    const f = () => Code.files[DT];
    await pasteLines(SRC.DETAIL_B2B, f().lines.findIndex((l) => l.trim() === '{# 商品コード #}') - 1);
    const formAt = f().lines.findIndex((l) => l.includes("url('product_add_cart', {id:Product.id})"));
    await typeLines(SRC.DETAIL_IF, formAt - 1, { kps: 30 });
    const endAt = f().lines.findIndex((l, i) => i > formAt && l.trim() === '</form>');
    await pasteLines(SRC.DETAIL_ELSE, endAt);
    await Code.save({ noStatus: true });
    check(DT, TPL[DT], 'detail.twig');
    await frameLines(DT, "{% if is_granted('ROLE_USER') %}", '<form action=', 'ログインしているときだけカート', { ms: 2000, w: 1000 });
    Issue.hide();
    await Code.openFile(LT, { top: 150 });
    const g = () => Code.files[LT];
    const item = g().lines.findIndex((l) => l.trim() === '<li class="ec-shelfGrid__item">');
    await pasteLines(SRC.LIST_CODE, g().lines.findIndex((l, i) => i > item && l.trim() === '</a>') - 1);
    await typeLines(SRC.LIST_IF, g().lines.findIndex((l) => l.trim() === '{% if Product.stock_find %}') - 1, { kps: 30 });
    const li = g().lines.findIndex((l, i) => i > item && l.trim() === '</li>');
    await typeLines(SRC.LIST_ENDIF, li - 1, { kps: 30 });
    await Code.save({ noStatus: true });
    check(LT, TPL[LT], 'list.twig');
    // the label 通常価格 → 定価, the CSS
    await say('「通常価格」の表記は翻訳ファイルで「定価」に（app/Customize/Resource/locale/messages.ja.yaml）');
    const YM = 'app/Customize/Resource/locale/messages.ja.yaml';
    const yl = src(YM).split('\n');
    await newFile(YM, src(YM), { type: [1, 2], kps: 14 });
    void yl;
    const CSS = SRC.CSS;
    Code.files[CSS].lines = SRC.F[CSS].replace(/\n$/, '').split('\n');
    Code.mark(CSS, 'M');
    Code.show(CSS, { top: 0 });
    await readHold(900);
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // guest: 定価 only
    await Win.switchTo('browser');
    await KB.tab('dev');
    await Browser.typeUrl('localhost:8080/products/detail/286');
    await dev('f-detail-guest', { load: 1300 });
    await say('ログインしていない状態：定価と発注単位だけ。カートの代わりに「ログインして注文する」');
    await scrollTo(TV('a', /ログインして注文する/), 520, 900);
    Issue.ok(R(() => TV('a', /ログインして注文する/), 6), 'ログインして注文する');
    await readHold(2600);
    Issue.hide();
    // the approved 取引先 signs in
    await clickUi(TV('a', /ログインして注文する/), { kind: 'hand', after: 60 });
    await dev('f-login', { load: 900 });
    await KB.type('email', AP.email, { kps: 30, reset: true });
    await KB.type('pass', DOTS, { kps: 40, reset: true, });
    await clickUi(T('button', /ログイン/), { kind: 'hand', after: 60 });
    Caption.set('承認された取引先（掛率 60%）でログイン：今度はログインできる');
    await dev('f-list-member', { load: 1500, url: DEV + '/products/list?category_id=128' });
    await scrollTo('.ec-shelfGrid', 120, 900);
    Caption.set('一覧の価格が卸価格に（清書用墨滴 定価 ¥495 → ¥297・税込）。品番・発注単位も');
    Issue.ok(R(() => { const a = EC.els('.ec-shelfGrid__item').find((x) => /清書用墨滴/.test(x.textContent)); return a; }, 4), '卸価格（税込）');
    await readHold(2600);
    Issue.hide();
    const it = EC.els('.ec-shelfGrid__item a').find((x) => /清書用墨滴/.test(x.textContent));
    if (it) await clickUi(it, { kind: 'hand', after: 60 });
    await dev('f-detail-member', { load: 1100 });
    Issue.ok(R('.ec-productRole__b2b', 4), '卸価格（掛率 60%）：¥270 税抜');
    Caption.set('商品詳細：定価 ¥495（税込）、卸価格 ¥270（税抜・掛率 60%）');
    await readHold(3000);
    Issue.hide();
    await KB.type('qty', '10', { kps: 8, clear: true });
    await scrollTo(EC.el('button.add-cart'), 560, 700);
    await clickUi(EC.el('button.add-cart'), { kind: 'hand', after: 60 });
    await dev('f-detail-286-modal', { load: 900, after: 800 });
    await clickUi(T('a', /カートへ進む/), { kind: 'hand', after: 60 });
    await dev('f-cart-1', { load: 1100 });
    Caption.set('カート：清書用墨滴 × 10、卸価格で計算（¥297 × 10 = ¥2,970）');
    Issue.ok(R('.ec-cartRole__cart, .ec-cartTable, .ec-cartRow', 4), '卸価格 × 10');
    await readHold(2600);
    Issue.hide();
    // the bug
    await KB.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/product');
    await admin('a-products-bug', { load: 1100 });
    Caption.issue('マスタの価格が変わった', '商品一覧の清書用墨滴の販売価格が ¥270（卸価格）になっている。ほかの取引先にも ¥270 で売れてしまう');
    const bug = row(/BA10-18|清書用墨滴/)();
    if (bug) { await scrollTo(bug, 420, 1000); Issue.show(R(bug, 2), '販売価格 ¥450 → ¥270'); }
    await readHold(3600);
    Issue.hide();
    await Win.switchTo('code');
    await panel(true);
    const rows = DATA.sqlBug || [];
    await run(`${DC}bin/console dbal:run-sql "SELECT product_id, product_code, price01, price02 FROM dtb_product_class WHERE price01 <> price02"`, ['',
      ' ------------ -------------- --------- --------- ',
      '  product_id   product_code   price01   price02  ',
      ' ------------ -------------- --------- --------- ',
      ...rows.map((r) => `  ${String(r.id).padEnd(12)} ${String(r.product_code).padEnd(14)} ${String(r.price01).padEnd(9)} <span class="tr">${String(r.price02).padEnd(9)}</span>`),
      ' ------------ -------------- --------- --------- ', ''], { kps: 40 });
    Caption.issue('原因', 'postLoad で書き換えた price02 を、カートの保存（flush）で Doctrine が変更として UPDATE した');
    Issue.show(termFind('BA10-18', 1, 900), 'price02 が卸価格のまま保存');
    await readHold(4000);
    Issue.hide();
    await Code.panel(false);
    await say('修正：書き換えた値を「読み込んだときの値」として UnitOfWork に記録 → flush しても変更とみなされない');
    await Code.openFile(WP, { top: 30 });
    const fixAt = Code.files[WP].lines.findIndex((l) => l.includes('setPrice02IncTax('));
    await typeLines(SRC.WHOLESALE_FIX, fixAt, { kps: 32 });
    await Code.save({ noStatus: true });
    check(WP, SRC.wholesale(true).replace(/\n$/, ''), 'WholesalePriceSubscriber.php');
    await frameLines(WP, 'setOriginalEntityProperty', null, 'setOriginalEntityProperty(…, \'price02\', $price)', { ms: 2600, w: 1300 });
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // the master restored, checked
    await Win.switchTo('browser');
    await say('商品マスタの販売価格を元に戻す（清書用墨滴 ¥450）');
    const bug2 = row(/BA10-18|清書用墨滴/)();
    if (bug2) await clickUi(bug2.querySelector('a[href*="/edit"]') || bug2, { kind: 'hand', after: 60 });
    await admin('a-product-286', { load: 1100 });
    await KB.type('price02', '450', { kps: 8, clear: true });
    await submit(/登録/);
    await admin('a-product-286-saved', { load: 1200 });
    await KB.tab('dev');
    await Browser.reload(async () => { await KB.ec('dev', 'f-cart-2', { load: 0 }); }, { key: 'F5' });
    await wait(600);
    await KB.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/product');
    await admin('a-products-ok', { load: 1000 });
    Caption.fixed('取引先がカートを開いても、商品マスタは定価のまま（卸価格は画面と注文の上だけ）');
    const ok = row(/BA10-18|清書用墨滴/)();
    if (ok) { await scrollTo(ok, 420, 1000); Issue.ok(R(ok, 2), '販売価格 ¥450'); }
    await readHold(3000);
    Issue.hide();
  });

  /* 5 — 発注単位 */
  scene('unit', async () => {
    Caption.step(5);
    await Win.switchTo('code');
    await say('発注単位：カートの PurchaseFlow に ItemValidator（@CartFlow）。倍数でなければ切り上げてお知らせ');
    const OV = C + 'Service/PurchaseFlow/Processor/OrderUnitValidator.php';
    const ol = src(OV).split('\n');
    const o0 = ol.findIndex((l) => l.includes('if ($unit > 1 && $item->getQuantity() % $unit !== 0)'));
    await newFile(OV, src(OV), { type: [o0, o0 + 4], kps: 30 });
    await frameLines(OV, '@CartFlow', '@CartFlow', '@CartFlow', { ms: 1400, w: 500 });
    await frameLines(OV, 'protected function handle', '$item->setQuantity(', 'handle()：数量を発注単位の倍数に', { ms: 2400, w: 1200 });
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    await Win.switchTo('browser');
    await KB.tab('dev');
    await Browser.typeUrl('localhost:8080/products/detail/991');
    await dev('f-detail-991', { load: 1100 });
    await say('美文字筆ぺん 中字（発注単位 10 個）を 3 個でカートに入れてみる');
    await KB.type('qty', '3', { kps: 6, clear: true });
    await scrollTo(EC.el('button.add-cart'), 560, 700);
    await clickUi(EC.el('button.add-cart'), { kind: 'hand', after: 60 });
    await dev('f-detail-991-modal', { load: 900, after: 600 });
    Issue.show(R(() => EC.el('.ec-modal-wrap') || EC.el('.ec-modal'), 4), '10 個単位でのご注文です');
    Caption.set('「美文字筆ぺん 中字 黒・セリース は 10 個単位でのご注文です。数量を 10 個にしました。」');
    await readHold(3200);
    Issue.hide();
    await clickUi(T('a', /カートへ進む/), { kind: 'hand', after: 60 });
    await dev('f-cart-unit', { load: 1100 });
    const r991 = () => EC.els('.ec-cartRow').find((x) => /美文字筆ぺん/.test(x.textContent));
    Caption.fixed('カートの数量は 10（ケース単位）。清書用墨滴 10 と合わせて卸価格で計算');
    Issue.ok(R(r991, 4), '数量 10');
    await readHold(2800);
    Issue.hide();
  });

  /* 6 — 掛け払い */
  scene('invoice', async () => {
    Caption.step(6);
    await KB.tab('admin');
    await say('設定 › 店舗設定 › 支払方法設定：新しい支払方法「掛け払い（請求書払い）」（手数料 0 円）');
    await Browser.typeUrl('localhost:8080/admin/setting/shop/payment');
    await admin('a-payments', { load: 1000 });
    await clickUi(EC.el('a[href$="/payment/new"]') || T('a', /新規/), { kind: 'hand', after: 60 });
    await admin('a-payment-new', { load: 1100 });
    await KB.type('method', [JA['掛け払い（請求書払い）']], { kps: 18 });
    await KB.type('charge', '0', { kps: 8, clear: true });
    await submit(/登録/);
    await admin('a-payment-saved', { load: 1200 });
    Issue.ok(R(() => flash() || EC.el('#payment_register_method'), 2), '掛け払い（請求書払い）を登録');
    await readHold(2000);
    Issue.hide();
    // the code
    await Win.switchTo('code');
    await say('ご注文手続きの支払方法：掛け払いを承認していない取引先には出さない（OrderType の FormExtension）');
    const OT = C + 'Form/Extension/OrderTypeExtension.php';
    const tl = src(OT).split('\n');
    const t0 = tl.findIndex((l) => l.includes('$choices = array_values(array_filter('));
    await newFile(OT, src(OT), { type: [t0, t0 + 1], kps: 34 });
    await frameLines(OT, 'addEventListener(FormEvents::POST_SET_DATA', 'addEventListener(FormEvents::PRE_SUBMIT', 'OrderType のあと（優先度 -10）で絞り込む', { ms: 2400, w: 1250 });
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // the mistake: 配送方法
    await Win.switchTo('browser');
    await KB.tab('dev');
    await Browser.typeUrl('localhost:8080/cart');
    await dev('f-cart-unit', { load: 800, after: 300 });
    await clickUi(T('a', /レジに進む/) || EC.el('a.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await dev('f-shopping-nokake', { load: 1300 });
    Caption.issue('掛け払いが出ない', '承認済みの取引先（掛け払い 利用可）なのに、お支払方法が銀行振込だけ');
    Issue.show(R('.ec-orderPayment', 4), '銀行振込だけ');
    await readHold(3400);
    Issue.hide();
    Caption.issue('原因', 'EC-CUBE の支払方法は配送方法ごとに選ぶ。佐川急便の「取扱支払方法」に掛け払いが入っていない');
    await KB.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/setting/shop/delivery/1/edit');
    await admin('a-delivery', { load: 1100 });
    const cb = EC.els('input[type=checkbox][name*="payments"]').find((x) => /掛け払い/.test((x.closest('label') || x.parentElement).textContent));
    if (cb) { Issue.show(R(cb.closest('label') || cb.parentElement, 4), 'チェックがない'); await readHold(2400); Issue.hide(); await clickUi(cb, { after: 80 }); KB.check(cb, true); }
    await wait(400);
    await submit(/登録/);
    await admin('a-delivery-saved', { load: 1200 });
    Issue.ok(R(flash, 2), '保存しました');
    await readHold(1400);
    Issue.hide();
    await KB.tab('dev');
    await Browser.reload(async () => { await KB.ec('dev', 'f-shopping-1', { load: 0 }); }, { key: 'F5' });
    await wait(500);
    await scrollTo('.ec-orderPayment', 300, 900);
    const kake = EC.els('.ec-orderPayment input[type=radio]').find((x) => /掛け払い/.test((x.closest('div') || x.parentElement).textContent));
    if (kake) { await clickUi(kake, { after: 80 }); }
    await dev('f-shopping-kake', { load: 900 });
    Caption.fixed('掛け払い（請求書払い）が選べるようになった');
    Issue.ok(R('.ec-orderPayment', 4), '掛け払い（請求書払い）');
    await readHold(2400);
    Issue.hide();
    await clickUi(T('button', /確認する/) || EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await dev('f-confirm', { load: 1300 });
    Caption.set('ご注文内容の確認：卸価格の明細・お支払方法 掛け払い');
    const go = T('button', /注文する/);
    if (go) { await scrollTo(go, 500, 900); await clickUi(go, { kind: 'hand', after: 60 }); }
    await dev('f-complete', { load: 1600 });
    Caption.fixed('テスト注文が完了（承認済みの取引先・掛け払い）');
    await readHold(2200);
    // another 取引先 without 掛け払い
    await say('掛け払いを承認していない取引先（株式会社みなと文具・掛率 65%）でログインし直して確認');
    await Browser.typeUrl('localhost:8080/shopping');
    await dev('f-shopping-minato', { load: 1600 });
    Issue.ok(R('.ec-orderPayment', 4), '銀行振込だけ（掛け払いは出ない）');
    Caption.fixed('みなと文具（掛け払い 利用不可）には掛け払いが出ない。卸価格は掛率 65% で計算');
    await readHold(3200);
    Issue.hide();
  });

  /* 7 — 受注管理 */
  scene('orders', async () => {
    Caption.step(7);
    await KB.tab('admin');
    await say('受注管理 › 受注一覧：取引先の注文（注文者・お支払方法・金額）');
    await Browser.typeUrl('localhost:8080/admin/order');
    await admin('a-orders', { load: 1200 });
    const o1 = row(/掛け払い|一郎|sakura/)();
    if (o1) { Issue.ok(R(o1, 2), '掛け払いの注文'); await readHold(2400); Issue.hide(); await clickUi(o1.querySelector('a[href*="/edit"]') || o1.querySelector('a') || o1, { kind: 'hand', after: 60 }); }
    await admin('a-order-edit', { load: 1300 });
    await KB.ec('admin', 'a-order-edit-company', { load: 0, after: 300 });
    Caption.set('受注登録：注文者の会社名（有限会社さくら書道用品）・お支払方法 掛け払い（請求書払い）');
    const comp = EC.els('[id$="company_name"]').find(shown);
    if (comp) Issue.ok(R(comp.closest('.row') || comp, 4), '会社名');
    await readHold(2800);
    Issue.hide();
    await KB.ec('admin', 'a-order-edit-items', { load: 0, after: 300 });
    Caption.set('明細は卸価格（清書用墨滴 ¥270・美文字筆ぺん 中字 ¥210 × 10）');
    await readHold(3000);
  });

  /* 8 — git, deploy, the public site */
  scene('deploy', async () => {
    Caption.step(8);
    await Win.switchTo('code');
    await panel(true);
    Term.clear();
    await say('本番へ：app/Customize とテンプレートを git でコミットして反映');
    await run('git status --short', ['<span class="tr">?? app/Customize/</span>', '<span class="tr">?? app/template/default/</span>', '<span class="tr"> M html/user_data/assets/css/customize.css</span>', ''], { kps: 22 });
    await run('git add app/Customize app/template/default html/user_data/assets/css/customize.css', [], { kps: 30 });
    const files = Object.keys(SRC.files(6, CORE));
    await Term.run([{ direct: 'git commit -m "BtoB ' }, JA['機能（承認制・卸価格・発注単位・掛け払い）'], { direct: '"' }], [
      '[main 7c2e9a1] BtoB 機能（承認制・卸価格・発注単位・掛け払い）',
      ` ${files.length} files changed, ${files.reduce((n, p) => n + (SRC.files(6, CORE)[p].split('\n').length), 0).toLocaleString('en-US')} insertions(+)`,
      ...files.filter((p) => p.startsWith(C)).slice(0, 4).map((p) => ` create mode 100644 ${p}`), ' <span class="tdim">…</span>', ''], { kps: 18 });
    await run('git push origin main', ['Enumerating objects: 41, done.', 'Writing objects: 100% (36/36), 14.62 KiB | 2.44 MiB/s, done.', 'To github.com:<span class="pii">kuretake-web</span>/kuretake-b2b.git', '   3f81c0d..7c2e9a1  main -&gt; main', ''], { kps: 24 });
    await run('ssh kuretake-b2b-prod', ['Last login: Tue Sep 29 18:12:40 2026', ''], { kps: 20 });
    window.Shell.remote('[deploy@b2b eccube]$ ');
    Term.render('<span class="caret"></span>');
    await run('git pull --ff-only origin main', ['Updating 3f81c0d..7c2e9a1', 'Fast-forward', ` ${files.length} files changed`, ''], { kps: 24 });
    await run('bin/console eccube:generate:proxies && bin/console cache:clear --no-warmup', ['gen -&gt; /var/www/eccube/app/proxy/entity/src/Eccube/Entity/Customer.php', 'gen -&gt; /var/www/eccube/app/proxy/entity/src/Eccube/Entity/Product.php', '', ' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.', ''], { kps: 24 });
    await run('bin/console doctrine:schema:update --force', ['', ' Updating database schema...', '', '     2 queries were executed', '', ' <span class="tg">[OK]</span> Database schema updated successfully!', ''], { kps: 24 });
    await run('exit', ['logout', 'Connection to kuretake-b2b-prod closed.', ''], { kps: 14 });
    window.Shell.local();
    Term.render('<span class="caret"></span>');
    await say('本番の管理画面でも同じ設定：仮会員機能・支払方法「掛け払い」・配送方法の取扱支払方法、取引先の掛率は基幹から一括登録', 3800);
    await Code.panel(false);
  });

  /* the public site */
  scene('live', async () => {
    Caption.allDone();
    await Win.switchTo('browser');
    await KB.tab('live');
    await Browser.typeUrl('order.kuretake.co.jp/products/detail/286');
    Browser.nav('live', { url: LIVE + '/products/detail/286', title: TITLE('detail') });
    Browser.loading('live', true);
    await Store.load('detail');
    Browser.loading('live', false);
    await say('公開中のサイト：清書用墨滴（品番 BA10-18・定価 ¥450）。卸価格・ご注文は取引先のログインのあと');
    await Store.scroll(260, 1200);
    await readHold(1800);
    await Browser.typeUrl('order.kuretake.co.jp/mypage/login');
    Browser.nav('live', { url: LIVE + '/mypage/login', title: TITLE('login') });
    Browser.loading('live', true);
    await Store.load('login');
    Browser.loading('live', false);
    await say('取引先のログイン → 本登録済みの取引先だけが卸価格で発注（ここから先はお取引先様のアカウント）', 3200);
    Caption.set('EC-CUBE 4 の BtoB 機能が完成：取引先情報・承認制の会員登録・掛率の卸価格・発注単位・掛け払い・受注管理');
    await readHold(5200);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'list', 'entry', 'detail', 'login'],
    fontText: JSON.stringify(JA) + F.files['docs/request-2026-09.md'] + Object.values(SRC.files(6, CORE)).join('') + '仮会員本会員卸価格掛率発注単位掛け払い',
    async prepare() {
      Code.init({ ...F.files }, F.tree);
      Code.show('docs/request-2026-09.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: TITLE('home'), url: LIVE + '/', page: 'store', fav: 'store' });
      await Store.load('home');
      Browser.addTab({ id: 'dev', title: '', url: '', page: 'wp', fav: 'shop' }, { activate: false });
      Browser.addTab({ id: 'admin', title: '', url: '', page: 'wp', fav: 'ec' }, { activate: false });
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      KB.blur();
      await KB.ec('admin', 'a-products-0', { load: 0, after: 0 });
      await KB.ec('dev', 'f-list-0', { load: 0, after: 0 });
      Browser.activate('live');
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
