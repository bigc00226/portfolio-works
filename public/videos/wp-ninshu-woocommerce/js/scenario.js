/*
 * Timeline: building 仁秀 NINSHU's online shop on WordPress with WooCommerce —
 * setup (wp-env, WooCommerce + Stripe, the store address) -> shipping (the shop's five zones, free shipping from
 * 20,000 yen) -> payments (Stripe connected by the shop, bank transfer) -> accounts -> products (CSV import, the pair
 * price) -> orders (the status 「発送済み」) -> the live shop.
 * Every WordPress / WooCommerce screen is the real one (js/wp-snapshot.js); the shop is the live ninshu.com (js/site-snapshot.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP, NS = window.NS;
  const { esc, wait, Caption, Issue, Win, screenRect } = D;
  const { clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, FileDialog, readHold } = K;
  const P = F.files;
  const LIVE = NS.LIVE;
  const ZEN = F.PR.find((r) => r[2] === F.MISSING_PAIR);
  const PLUGIN_FILE = 'wp-content/plugins/ninshu-shop/ninshu-shop.php';

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    // the store address
    '中京区藤木町': { r: 'chuukyoukufujikichou', segs: ['中京区', '藤木町'], predict: ['中京区', '中京区役所'], yomi: ['ちゅうきょうく', 'ちゅうきょうくやくしょ'] },
    '京都市': { r: 'kyoutoshi', segs: ['京都市'], predict: ['京都', '京都市'], yomi: ['きょうと', 'きょうとし'] },
    // the first shipping zone, its first prefecture
    '関西・中部・中国・四国': { r: 'kansai/chuubu/chuugoku/shikoku', segs: ['関西', '・', '中部', '・', '中国', '・', '四国'] },
    '富山県': { r: 'toyamaken', segs: ['富山県'], predict: ['富山', '富山県'], yomi: ['とやま', 'とやまけん'] },
    // the bank account
    '株式会社仁秀': { r: 'kabushikigaishaninshuu', segs: ['株式会社', '仁秀'] },
    '楽天銀行 第二営業支店（普通）': [{ r: 'rakutenginkou', segs: ['楽天', '銀行'] }, { direct: ' ' }, { r: 'dainieigyoushiten(futsuu)', segs: ['第二', '営業', '支店', '（', '普通', '）'] }],
    // the plugin
    '注文ステータス「発送済み」（発送して送り状番号をお知らせした注文）': [{ r: 'chuumonsute-tasu[hassouzumi]', segs: ['注文', 'ステータス', '「', '発送済み', '」'] }, { r: '(hassoushiteokurijoubangouwooshiraseshitachuumon)', segs: ['（', '発送して', '送り状', '番号を', 'お知らせした', '注文', '）'] }],
    '発送済み': { r: 'hassouzumi', segs: ['発送済み'], predict: ['発送', '発送済み'], yomi: ['はっそう', 'はっそうずみ'] },
    '発送済み <span class="count">(%s)</span>': [{ r: 'hassouzumi', segs: ['発送済み'] }, { direct: ' <span class="count">(%s)</span>' }],
    // the order note
    'ヤマト運輸 送り状番号': [{ r: 'yamatounnyu', segs: ['ヤマト', '運輸'] }, { direct: ' ' }, { r: 'okurijoubangou', segs: ['送り状', '番号'], predict: ['送り状', '送り状番号'], yomi: ['おくりじょう', 'おくりじょうばんごう'] }],
    'で発送しました。': { r: 'dehassoushimashita.', segs: ['で', '発送しました。'] },
  };
  const jaScript = (text) => (Array.isArray(JA[text]) ? JA[text] : [JA[text]]);
  /** typing script for tab-indented lines (PHP, WordPress coding standards): Enter, the editor's auto-indent corrected,
   *  then the line (Japanese through the IME). Kit.codeScript counts spaces only. */
  function tabScript(lines, after) {
    const out = [];
    let prev = after;
    for (const line of lines) {
      const tabs = line.match(/^\t*/)[0].length, body = line.slice(tabs);
      out.push({ key: 'Enter' });
      const auto = K.indentAfter(prev, '\t').match(/^\t*/)[0].length;
      if (auto > tabs) out.push({ key: 'Backspace', n: auto - tabs });
      else if (auto < tabs) out.push({ direct: '\t'.repeat(tabs - auto) });
      if (body) out.push(...K.codeScript([body], JA));
      prev = line;
    }
    return out;
  }

  /* ------------------------------------------------------------- helpers */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const textEl = (sel, re) => WP.els(sel).find((e) => re.test(e.textContent.trim()));
  const row = (re, sel = '#the-list tr, table tbody tr') => WP.els(sel).find((tr) => re.test(tr.textContent));
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1100), height: y.bottom - x.top };
  };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const scrollWp = async (el, ms = 700) => { const e = typeof el === 'string' ? WP.el(el) : el; if (e != null) await WP.scroll(e, ms); };
  /** a WordPress screen in the wp-admin tab, the page loading for a moment */
  const show = (key, load = 500) => NS.wp(key, { load: Math.round(load * 2.4) });
  /** a caption, with the time to read it before the pointer moves on */
  const say = (text, ms) => { Caption.set(text); return readHold(ms != null ? ms : Math.min(4000, Math.max(1500, text.length * 55))); };
  /** a button by its text */
  const button = (re, sel = 'button, a') => textEl(sel, re);
  const save = () => WP.el('.woocommerce-save-button') || button(/^変更を保存$/, 'button');
  /** the innermost element with this text (the React screens have no ids to go by) */
  const leaf = (re) => WP.els('body *').find((e) => e.children.length === 0 && re.test(e.textContent.trim()));
  /** a button in the same row as the text `title` */
  const rowButton = (title, label) => {
    for (let n = leaf(title); n; n = n.parentElement) {
      const b = [...n.querySelectorAll('button, a')].find((x) => label.test(x.textContent.trim()));
      if (b) return b;
    }
    return null;
  };
  /** the bank account number on screen: blurred */
  const piiAccount = () => WP.els('body *').filter((e) => e.children.length === 0 && /7416313/.test(e.textContent)).forEach((e) => e.classList.add('pii'));
  const wpEnv = (cmd) => [`<span class="tdim">&gt; ninshu-ec@ wp</span>`, `<span class="tdim">&gt; wp-env run cli wp ${esc(cmd)}</span>`, '', `<span class="tc">ℹ</span> Starting 'wp ${esc(cmd)}' on the cli container.`, ''];

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — WooCommerce on the dev site, the store settings */
  scene('setup', async () => {
    Caption.step(1);
    await say('仁秀（京焼・清水焼の窯元）の器のオンラインショップを、WordPress ＋ WooCommerce で構築する');
    await hoverUi(Code.lineEl(3), { ax: 0.32, hold: 1300 });
    await hoverUi(Code.lineEl(4), { ax: 0.4, hold: 1200 });
    await say('要件：商品 158 点（単品 / ペアのバリエーション）・地域別の送料・カード決済と銀行振込・会員・注文管理');
    Issue.show(linesRect(9, 14), '送料（税込）：5 区分・2 万円以上で無料');
    await wait(2400);
    Issue.hide();
    await hoverUi(Code.lineEl(18), { ax: 0.4, hold: 1100 });
    // the dev site (wp-env) + WooCommerce / Stripe from wordpress.org
    await say('開発環境は wp-env（Docker の WordPress）：WordPress 7.1・PHP 8.3、ショップのテーマとプラグインをマウント');
    await Code.openFile('.wp-env.json', { top: 0 });
    for (const l of [1, 2, 3, 4]) await hoverUi(Code.lineEl(l), { ax: 0.35, hold: 700 });
    await Code.openFile('package.json', { top: 0 });
    await hoverUi(Code.lineEl(4), { ax: 0.4, hold: 1300 });
    await say('開発環境（wp-env）を起動して、WooCommerce と Stripe 決済のプラグインを WP-CLI で追加');
    await Code.panel(true);
    await Term.run('npm run start', ['', '<span class="tdim">&gt; ninshu-ec@ start</span>', '<span class="tdim">&gt; wp-env start</span>', '', 400,
      async () => Term.spin('Starting WordPress…', 1500, '<span class="tg">✔</span> WordPress development site started at http://localhost:8888'),
      'WordPress test site started at http://localhost:8889', 'MySQL is listening on port 52187', '', '<span class="tg">✔</span> Done! <span class="tdim">(in 38s 412ms)</span>'], { kps: 18 });
    const inst = 'plugin install woocommerce woocommerce-gateway-stripe --activate';
    await Term.run(`npm run wp -- ${inst}`, [...wpEnv(inst), 300, 'Installing WooCommerce (11.3.0)', 'Downloading installation package from https://downloads.wordpress.org/plugin/woocommerce.11.3.0.zip...', 500,
      'Unpacking the package...', 'Installing the plugin...', 'Plugin installed successfully.', "Activating 'woocommerce'...", "Plugin 'woocommerce' activated.", 300,
      'Installing WooCommerce Stripe Payment Gateway (11.2.0)', 'Downloading installation package from https://downloads.wordpress.org/plugin/woocommerce-gateway-stripe.11.2.0.zip...', 300,
      'Unpacking the package...', 'Installing the plugin...', 'Plugin installed successfully.', "Activating 'woocommerce-gateway-stripe'...", "Plugin 'woocommerce-gateway-stripe' activated.",
      '<span class="tg">Success:</span> Installed 2 of 2 plugins.'], { kps: 22, gap: 70 });
    const lang = 'language plugin install --all ja';
    await Term.run(`npm run wp -- ${lang}`, [...wpEnv(lang), 300, 'Downloading translation from https://downloads.wordpress.org/translation/plugin/woocommerce/11.3.0/ja.zip...', "Language 'ja' installed.",
      'Downloading translation from https://downloads.wordpress.org/translation/plugin/woocommerce-gateway-stripe/11.2.0/ja.zip...', "Language 'ja' installed.", '<span class="tg">Success:</span> Installed 2 of 2 languages.'], { kps: 22, gap: 70 });
    // wp-admin: the plugins
    await Win.switchTo('browser');
    await Browser.reload(async () => { await show('plugins', 200); }, { key: 'F5' });
    const woo = WP.el('tr[data-slug="woocommerce"]');
    if (woo) { Issue.ok(R(woo), 'WooCommerce 11.3.0（有効）'); await hoverUi(woo.querySelector('.plugin-title strong') || woo, { hold: 1800 }); Issue.hide(); }
    // WooCommerce > 設定 > 一般: the store address (the shop's 特定商取引法 page)
    await say('WooCommerce → 設定 → 一般：店舗の住所（送料・税の基準）と通貨（日本円・小数点なし）');
    await NS.menu('#toplevel_page_woocommerce', 'page=wc-settings');
    await show('general', 700);
    await NS.type('address', [...jaScript('中京区藤木町'), { direct: '18-1' }], { kps: 9 });
    await NS.type('city', jaScript('京都市'), { kps: 9 });
    await NS.type('postcode', '604-0992', { kps: 14 });
    const cur = WP.el('#woocommerce_currency');
    const sell = WP.el('#woocommerce_allowed_countries');
    if (sell) { await scrollWp(sell.closest('tr'), 900); await hoverUi(sell.closest('td') || sell, { hold: 1200 }); }
    const tax = WP.el('#woocommerce_calc_taxes');
    if (tax) { await say('税は価格に含めて表示（税込価格で登録）。消費税の計算は使わない'); await hoverUi(tax, { hold: 1000 }); }
    if (cur) { await scrollWp(cur.closest('tr'), 900); await hoverUi(cur.closest('td') || cur, { hold: 1300 }); }
    const dec = WP.el('#woocommerce_price_num_decimals');
    if (dec) await hoverUi(dec, { hold: 1000 });
    await scrollWp(save(), 700);
    await clickUi(save(), { kind: 'hand', after: 80 });
    await show('general-saved', 700);
    const ok = WP.el('#message, .updated');
    if (ok) { Issue.ok(R(ok), '設定を保存'); await wait(1500); Issue.hide(); }
  });

  /* 2 — shipping: the shop's five zones, free shipping from 20,000 yen */
  scene('shipping', async () => {
    Caption.step(2);
    await say('配送：お届け先の都道府県で送料が 5 段階（1,300〜2,100 円）、1 回のご注文が 2 万円以上なら送料無料');
    await clickUi(WP.el('a.nav-tab[href*="tab=shipping"]'), { after: 60 });
    await show('shipping-empty', 800);
    await clickUi(WP.el('.wc-shipping-zones-heading a.page-title-action'), { kind: 'hand', after: 80 });
    await show('zone-new', 900);
    await say('ゾーンを追加：まず送料 1,300 円の地域（関西・中部・中国・四国の 22 府県）');
    await NS.type('zoneName', jaScript('関西・中部・中国・四国'), { kps: 9 });
    if (WP.has('zone-new-pick')) {
      // the regions: typed to narrow the list, ticked one by one
      await clickUi(WP.field('region'), { kind: 'text', ax: 0.3, after: 80 });
      await show('zone-new-focus', 0);
      await wait(500);
      await NS.type('region', jaScript('富山県'), { kps: 9, click: false, blur: false });
      await show('zone-new-pick', 0);
      const rb = WP.field('region');
      if (rb) { WP.focus(rb, true); rb.insertAdjacentHTML('beforeend', '<span class="demo-caret"></span>'); }
      await wait(600);
      const opt = textEl('.woocommerce-tree-select-control__tree label', /^富山県/);
      await clickUi(opt, { after: 100 });
      await show('zone-new-picked', 0);
      await say('同じように 22 府県（富山〜高知）を選んで保存');
      await wait(1400);
      await show('zone-new-all', 0);
      await hoverUi(WP.el('.woocommerce-tree-select-control'), { hold: 1200 });
    } else {
      await say('ゾーン地域：22 府県（富山〜高知）を選んで保存');
      await hoverUi(WP.el('.woocommerce-tree-select-control'), { hold: 1400 });
      const sub = WP.el('#submit');
      if (sub) sub.removeAttribute('disabled');
    }
    await clickUi(WP.el('#submit'), { kind: 'hand', after: 80 });
    await show('zone-1', 900);
    const more = WP.el('.woocommerce-tree-select-control__show-more');
    if (more) { Issue.ok(R(more.closest('.woocommerce-tree-select-control') || more, 4), '22 府県'); await hoverUi(more, { hold: 1400 }); Issue.hide(); }
    // flat rate 1,300
    await say('配送方法を追加 →「定額送料」→ 金額 1,300 円');
    await clickUi(WP.el('.wc-shipping-zone-add-method'), { kind: 'hand', after: 80 });
    await show('zone-method', 300);
    await clickUi(WP.el('label[for="flat_rate"]'), { after: 60 });
    await show('zone-method-flat', 0);
    await wait(500);
    await clickUi(WP.el('#btn-next'), { kind: 'hand', after: 80 });
    await show('zone-flat', 300);
    await NS.type('cost', '1300', { kps: 9, clear: true });
    await clickUi(WP.el('#btn-ok'), { kind: 'hand', after: 80 });
    await show('zone-1-flat', 600);
    // free shipping 20,000
    await say('もう 1 つ →「送料無料」→ 必要条件「無料になる最低注文金額」20,000 円');
    await clickUi(WP.el('.wc-shipping-zone-add-method'), { kind: 'hand', after: 80 });
    await show('zone-method-2', 300);
    await clickUi(WP.el('label[for="free_shipping"]'), { after: 60 });
    await show('zone-method-free', 0);
    await wait(500);
    await clickUi(WP.el('#btn-next'), { kind: 'hand', after: 80 });
    await show('zone-free-none', 300);
    await NS.selectMenu('#woocommerce_free_shipping_requires', /無料になる最低注文金額/);
    await show('zone-free', 0);
    await NS.type('minAmount', '20000', { kps: 9, clear: true });
    await clickUi(WP.el('#btn-ok'), { kind: 'hand', after: 80 });
    await show('zone-1-done', 600);
    const methods = WP.el('table.wc-shipping-zone-methods');
    if (methods) { Issue.ok(R(methods), '定額送料 1,300 円 ＋ 送料無料'); await wait(1700); Issue.hide(); }
    // the other zones → the list
    await say('残りの 4 ゾーン（1,400・1,500・1,600・2,100 円）も同じように作って、一覧で見直す');
    await clickUi(WP.el('h2.wc-admin-header small a'), { after: 80 });
    await show('zones-missing', 800);
    await wait(900);
    const hk = row(/北海道・沖縄/);
    if (hk) {
      await say('「北海道・沖縄」だけ送料無料が入っていない → 2 万円以上のご注文でも送料 2,100 円がかかってしまう');
      const cell = hk.querySelector('td.wc-shipping-zone-methods') || hk;
      Issue.show(R(cell, 4), '送料無料の追加漏れ');
      await hoverUi(cell, { hold: 2600 });
      Issue.hide();
      await clickUi(hk.querySelector('a.wc-shipping-zone-action-edit') || hk, { kind: 'hand', after: 80 });
    }
    await show('zone-5', 700);
    await say('「北海道・沖縄」にも送料無料（2 万円以上）を追加');
    await clickUi(WP.el('.wc-shipping-zone-add-method'), { kind: 'hand', after: 80 });
    await show('zone-5-method-0', 300);
    await clickUi(WP.el('label[for="free_shipping"]'), { after: 60 });
    await show('zone-5-method', 0);
    await wait(300);
    await clickUi(WP.el('#btn-next'), { kind: 'hand', after: 80 });
    await show('zone-5-free-none', 300);
    await NS.selectMenu('#woocommerce_free_shipping_requires', /無料になる最低注文金額/, { hold: 250 });
    await show('zone-5-free', 0);
    await NS.type('minAmount', '20000', { kps: 9, clear: true });
    await clickUi(WP.el('#btn-ok'), { kind: 'hand', after: 80 });
    await show('zone-5-done', 500);
    await clickUi(WP.el('h2.wc-admin-header small a'), { after: 80 });
    await show('zones-fixed', 700);
    for (const tr of WP.els('table.wc-shipping-zones tbody tr, .wc-shipping-zones tr[data-id]').slice(0, 5)) await hoverUi(tr.querySelector('td.wc-shipping-zone-methods') || tr, { hold: 600 });
    const hk2 = row(/北海道・沖縄/);
    if (hk2) { Caption.fixed('5 ゾーンとも「定額送料 ＋ 送料無料（2 万円以上）」に'); Issue.ok(R(hk2.querySelector('td.wc-shipping-zone-methods') || hk2, 4), '送料無料を追加'); await readHold(2200); Issue.hide(); }
  });

  /* 3 — payments: Stripe (connected by the shop) and bank transfer */
  scene('payments', async () => {
    Caption.step(3);
    await say('決済：クレジットカードは Stripe、もう 1 つは銀行振込（入金を確認してから発送）');
    await clickUi(WP.el('a.nav-tab[href*="tab=checkout"]'), { after: 60 });
    await show('payments', 1100);
    const fin = button(/^設定を完了$/, 'button, a');
    if (fin) {
      await hoverUi(textEl('span, div, h2, h3', /^Stripe$/) || fin, { hold: 900 });
      await clickUi(fin, { kind: 'hand', after: 80 });
    }
    await show('stripe', 1000);
    await say('Stripe はショップ（仁秀様）の Stripe アカウントで接続する → 接続は仁秀様の操作で行い、ここでは導入まで');
    const connect = button(/^アカウントの作成または接続$/, 'button, a');
    if (connect) { Issue.show(R(connect, 4), 'ショップのアカウントで接続'); await hoverUi(connect, { hold: 2600 }); Issue.hide(); }
    const test = button(/^テストアカウントを作成または接続する$/, 'button, a');
    if (test) { await say('テスト決済も、接続した後に Stripe のテストモードで行う（API キーはここには入力しない）'); await hoverUi(test, { hold: 1500 }); }
    // bank transfer
    await say('銀行振込：オフラインでの支払い → 直接銀行振込 → 有効にして振込先の口座を登録');
    await clickUi(WP.el('.woocommerce-settings-payments__back-button') || button(/^Stripe$/, 'button, a'), { after: 80 });
    await show('payments', 500);
    await clickUi(textEl('h2, h3, span, div', /^オフラインでの支払いを受け取る$/), { after: 80 });
    await show('offline', 800);
    await hoverUi(leaf(/^直接銀行振込（国際口座形式）$/), { hold: 700 });
    await clickUi(rowButton(/^直接銀行振込（国際口座形式）$/, /^有効化$/), { kind: 'hand', after: 80 });
    if (WP.has('offline-enabled')) {
      await show('offline-enabled', 900);
      await clickUi(rowButton(/^直接銀行振込（国際口座形式）$/, /^(管理|設定|Manage)$/) || leaf(/^直接銀行振込（国際口座形式）$/), { kind: 'hand', after: 80 });
    }
    await show('bacs', 1000);
    const en = leaf(/^直接銀行振込を有効化$/);
    if (en) { Issue.ok(R(en.closest('.components-base-control') || en, 6), '有効'); await wait(1300); Issue.hide(); }
    const add = button(/アカウントを追加/, 'button');
    if (add) { await scrollWp(add, 900); await clickUi(add, { kind: 'hand', after: 80 }); }
    await show('bacs-modal', 300);
    await NS.type('accName', jaScript('株式会社仁秀'), { kps: 9 });
    await NS.type('bankName', jaScript('楽天銀行 第二営業支店（普通）'), { kps: 9 });
    const num = WP.field('accNumber');
    if (num) num.classList.add('pii');
    await NS.type('accNumber', '7416313', { kps: 9 });
    await clickUi(button(/^保存$/, '.components-modal__frame button'), { kind: 'hand', after: 80 });
    await show('bacs-added', 200);
    piiAccount();
    const acc = leaf(/^株式会社仁秀$/);
    if (acc) await hoverUi(acc, { hold: 1300 });
    await clickUi(save(), { kind: 'hand', after: 80 });
    await show('bacs-saved', 600);
    piiAccount();
    const done = WP.el('.components-snackbar, #message, .updated');
    if (done) { Issue.ok(R(done, 4), '設定を保存'); await wait(1600); Issue.hide(); }
    await scrollWp(0, 700);
    await clickUi(WP.el('.woocommerce-settings-payments__back-button'), { after: 80 });
    await show('offline-done', 600);
    await hoverUi(rowButton(/^直接銀行振込（国際口座形式）$/, /^管理$/) || leaf(/^直接銀行振込（国際口座形式）$/), { hold: 800 });
  });

  /* 4 — accounts: login on My Account, sign-up during checkout */
  scene('accounts', async () => {
    Caption.step(4);
    await say('会員：ログインは「マイアカウント」、会員登録はご購入の手続きの中で（ゲストのままでも購入できる）');
    await scrollWp(0, 500);
    await clickUi(WP.el('a.nav-tab[href*="tab=account"]'), { after: 60 });
    await show('accounts', 800);
    const guest = WP.el('#woocommerce_enable_guest_checkout');
    if (guest) { Issue.ok(R(guest.closest('fieldset') || guest, 6), 'ゲスト購入：そのまま'); await hoverUi(guest, { hold: 1600 }); Issue.hide(); }
    for (const id of ['woocommerce_enable_signup_and_login_from_checkout', 'woocommerce_enable_checkout_login_reminder']) {
      const c = WP.el('#' + id);
      if (!c) continue;
      await clickUi(c, { after: 80 });
      c.checked = true;
      await wait(350);
    }
    const myacc = WP.el('#woocommerce_enable_myaccount_registration');
    if (myacc) { await say('「マイアカウント」ページ上の登録は使わない（ログインだけ。公開中のショップと同じ）'); await hoverUi(myacc, { hold: 1500 }); }
    await scrollWp(save(), 600);
    await clickUi(save(), { kind: 'hand', after: 80 });
    await show('accounts-saved', 800);
    const pw = WP.el('#woocommerce_registration_generate_password');
    if (pw) { await say('購入手続き中に登録したお客様には、パスワードの設定リンクをメールで送る（既定のまま）'); await hoverUi(pw, { hold: 1200 }); }
    const on = WP.el('#woocommerce_enable_signup_and_login_from_checkout');
    if (on) { Issue.ok(R(on.closest('fieldset') || on.closest('td') || on, 6), '購入手続き中に会員登録'); await readHold(2000); Issue.hide(); }
  });

  /* 5 — products: the CSV import, the missing pair price */
  scene('products', async () => {
    Caption.step(5);
    await say(`旧サイトの商品データを WooCommerce の CSV 形式にしたもの（${F.N_PRODUCTS} 商品・単品 / ペアのバリエーション ${F.N_VARIABLE} 商品）`);
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile('data/products-woocommerce.csv', { top: 0 });
    await hoverUi(Code.lineEl(0), { ax: 0.3, hold: 1400 });
    const varRow = Code.find('variable,');
    if (varRow) {
      await Code.reveal(varRow.line, 600);
      Issue.show(linesRect(varRow.line, varRow.line + 2), '親（variable）＋ 単品 / ペア（variation）');
      await say('単品 / ペアのある商品は 3 行：親の商品（variable）と、Parent に親の SKU を書いたバリエーション 2 行', 2600);
      Issue.hide();
    }
    const zenRow = Code.find('禅｜ぜん｜フリーカップ,');
    if (zenRow) { await Code.reveal(zenRow.line, 700); await hoverUi(Code.lineEl(zenRow.line), { ax: 0.25, hold: 1200 }); }
    // 商品 > インポート
    await say('商品 →「インポート」：CSV をアップロード → 列の割り当て → インポートを実行');
    await Win.switchTo('browser');
    await clickUi(WP.el('#menu-posts-product > a'), { after: 60 });
    await show('products-empty', 900);
    const imp = leaf(/^他の場所ですでに販売していますか？$/);
    if (imp) await hoverUi(imp, { hold: 600 });
    await clickUi(imp || leaf(/CSV ファイルから商品をインポート/), { kind: 'hand', after: 80 });
    await show('import-upload', 700);
    await clickUi(WP.el('#upload'), { kind: 'hand', after: 80 });
    await FileDialog.pick({ folder: ['PC', 'ローカル ディスク (C:)', 'dev', 'ninshu-ec', 'data'], files: [{ name: 'products-woocommerce.csv', date: '2026/11/04 9:48', type: 'Microsoft Excel CSV ファイル', size: `${Math.round(F.CSV.length * 1.6 / 1024)} KB` }], pick: 'products-woocommerce.csv', filter: 'すべてのファイル (*.*)' });
    await show('import-upload-chosen', 200);
    await clickUi(WP.el('button[name="save_step"]'), { kind: 'hand', after: 80 });
    await show('import-mapping', 900);
    await say('CSV の列名（Type・SKU・Name・Parent・Regular price …）が商品の項目に自動で割り当てられる');
    for (const i of [0, 1, 3, 8]) await hoverUi(WP.el(`select[name="map_to[${i}]"]`), { hold: 700 });
    await scrollWp(WP.els('.wc-importer-mapping-table-wrapper tbody tr')[8], 1100);
    await wait(700);
    await scrollWp(WP.el('button[name="save_step"]'), 900);
    await clickUi(WP.el('button[name="save_step"]'), { kind: 'hand', after: 80 });
    Browser.loading('wp', true);
    await wait(2600);
    await show('import-done', 400);
    const msg = WP.el('.woocommerce-importer-done');
    if (msg) { Issue.ok(R(msg), 'インポート完了'); await readHold(2000); Issue.hide(); }
    await say(`件数を WP-CLI でも確認：商品 ${F.N_PRODUCTS}・バリエーション ${F.N_VARIABLE * 2}`);
    await Win.switchTo('code');
    await Code.panel(true);
    const cnt = 'post list --post_type=product --format=count', cntV = 'post list --post_type=product_variation --format=count';
    await Term.run(`npm run wp -- ${cnt}`, [...wpEnv(cnt), 300, String(F.N_PRODUCTS)], { kps: 22 });
    await Term.run(`npm run wp -- ${cntV}`, [...wpEnv(cntV), 300, String(F.N_VARIABLE * 2)], { kps: 22 });
    await wait(900);
    await Win.switchTo('browser');
    // the list: フリーカップ
    await clickUi(WP.el('a.button-primary[href$="post_type=product"]') || WP.el('#menu-posts-product > a'), { kind: 'hand', after: 80 });
    await show('products', 800);
    await hoverUi(WP.el('.subsubsub .all') || WP.el('.subsubsub'), { hold: 1000 });
    await scrollWp(WP.els('#the-list tr')[8], 1300);
    await hoverUi(WP.els('#the-list td.column-price')[8], { hold: 900 });
    await scrollWp(0, 900);
    await say('カテゴリー「フリーカップ」で絞り込んで、単品 / ペアの価格を確認');
    await NS.selectMenu('#product_cat', /フリーカップ/, { hold: 300 });
    await clickUi(WP.el('#post-query-submit'), { after: 80 });
    await show('products-fc', 600);
    const zen = row(/禅｜ぜん｜フリーカップ/);
    const zenPrice = zen && zen.querySelector('td.price, .column-price');
    if (zenPrice) {
      await scrollWp(zen, 900);
      await say(`「禅」だけ価格が ¥${ZEN[5].toLocaleString()} の 1 つ（ほかは ¥3,190 – ¥5,000 のような範囲）→ ペアに価格がない`);
      Issue.show(R(zenPrice, 4), 'ペアの価格が入っていない');
      await hoverUi(zenPrice, { hold: 2400 });
      Issue.hide();
    }
    // the editor: variations
    await clickUi(zen && zen.querySelector('a.row-title') || WP.el('#the-list a.row-title'), { kind: 'hand', after: 80 });
    await show('product-edit', 900);
    const notice = textEl('#variable_product_options .notice, #variable_product_options div, .woocommerce-notice-invalid-variation', /価格情報がありません/);
    await say('バリエーション：ペアの価格が空 → 価格のないバリエーションはストアに表示されない（旧データにペアの価格がなかった）');
    if (notice) { Issue.show(R(notice, 3), 'WooCommerce の警告'); await readHold(2600); Issue.hide(); }
    const box = WP.field('pairPrice');
    if (box) await scrollWp(box, 600);
    await NS.type('pairPrice', String(ZEN[6]), { kps: 9 });
    await clickUi(WP.el('.save-variation-changes'), { kind: 'hand', after: 80 });
    await wait(900);
    await scrollWp(0, 700);
    await clickUi(WP.el('#publish'), { kind: 'hand', after: 80 });
    await show('product-edit-saved', 900);
    await wait(700);
    await clickUi(WP.el('#menu-posts-product .wp-submenu a[href$="post_type=product"]') || WP.el('#menu-posts-product > a'), { after: 60 });
    await show('products-fc-fixed', 700);
    const zen2 = row(/禅｜ぜん｜フリーカップ/);
    if (zen2) await scrollWp(zen2, 900);
    const p2 = zen2 && zen2.querySelector('td.price, .column-price');
    if (p2) { Caption.fixed(`ペアの価格 ¥${ZEN[6].toLocaleString()} を入れて更新 →「禅」も ¥${ZEN[5].toLocaleString()} – ¥${ZEN[6].toLocaleString()}`); Issue.ok(R(p2, 4), '単品 / ペアの価格'); await readHold(2400); Issue.hide(); }
  });

  /* 6 — orders: the status 「発送済み」 */
  scene('orders', async () => {
    Caption.step(6);
    await say('注文管理：テストの注文（カード 2 件・銀行振込 1 件）。銀行振込は「保留中」＝ 入金待ち');
    await NS.menu('#toplevel_page_woocommerce', 'page=wc-orders');
    await show('orders', 900);
    const hold = row(/保留中/);
    if (hold) await hoverUi(hold.querySelector('mark.order-status') || hold, { hold: 1600 });
    // the plugin: the status 「発送済み」
    await say('発送したら「発送済み」に（標準にないステータスなので、ショップのプラグインで追加する）');
    await Win.switchTo('code');
    await Code.openFile(PLUGIN_FILE, { top: 0 });
    const last = Code.files[PLUGIN_FILE].lines.length - 2;
    await Code.newLineAfter(last);
    await Code.type(tabScript(F.STATUS('shipped'), Code.files[PLUGIN_FILE].lines[last]), { kps: 17 });
    await Code.save();
    check(PLUGIN_FILE, F.PLUGIN('shipped'), 'plugin');
    await Code.panel(true);
    await Term.run('npm run wp -- plugin activate ninshu-shop', [...wpEnv('plugin activate ninshu-shop'), 300, "Plugin 'ninshu-shop' activated.", '<span class="tg">Success:</span> Activated 1 of 1 plugins.'], { kps: 22 });
    // the order: 発送済み → 更新
    await Win.switchTo('browser');
    const first = row(/山本/);
    await clickUi(first && (first.querySelector('a.order-view') || first.querySelector('a')) || WP.el('#the-list a'), { kind: 'hand', after: 80 });
    await show('order-edit', 900);
    await say('注文の編集：ステータスに「発送済み」が増えている → 選んで「更新」');
    await clickUi(WP.el('#select2-order_status-container') || WP.el('#order_status'), { after: 80 });
    await show('order-status-open', 0);
    const opt = textEl('.select2-results__option', /^発送済み$/);
    if (opt) { await hoverUi(opt, { hold: 400 }); await clickUi(opt, { after: 80 }); }
    await show('order-edit', 0);
    const cur = WP.el('#select2-order_status-container');
    if (cur) cur.textContent = '発送済み';
    await wait(400);
    await clickUi(WP.el('button.save_order'), { kind: 'hand', after: 80 });
    await show('order-bug', 1100);
    const st = WP.el('#select2-order_status-container') || WP.el('#order_status');
    await say('更新すると「発送済み」ではなく「支払い待ち」になってしまった');
    if (st) { Issue.show(R(st.closest('p, .form-field') || st, 4), '支払い待ち？'); await readHold(2600); Issue.hide(); }
    const note = WP.el('ul.order_notes li');
    if (note) await hoverUi(note, { hold: 1600 });
    // the cause: the key needs the wc- prefix
    await say('原因：注文ステータスのキーは「wc-」で始める決まり。shipped は WooCommerce に無効なステータスとして扱われ、支払い待ちに戻された');
    await Win.switchTo('code');
    for (const needle of ["register_post_status( 'shipped'", "$out['shipped']"]) {
      const p = Code.find(needle);
      if (!p) continue;
      const col = Code.files[Code.active].lines[p.line].indexOf("'shipped'") + 1;
      await Code.reveal(p.line, 400);
      Issue.show(linesRect(p.line, p.line), "'shipped' → 'wc-shipped'");
      await Code.clickAt(p.line, col);
      await Code.type([{ direct: 'wc-' }], { kps: 8 });
      await wait(500);
      Issue.hide();
    }
    await Code.save();
    check(PLUGIN_FILE, F.PLUGIN('wc-shipped'), 'plugin-fix');
    // again: the note (the tracking number) + 発送済み
    await Win.switchTo('browser');
    await Browser.reload(async () => { await show('order-edit-2', 200); }, { key: 'F5' });
    await say('送り状番号を注文メモに残して、ステータスを「発送済み」→「更新」');
    await scrollWp(WP.field('note'), 600);
    await NS.type('note', [...jaScript('ヤマト運輸 送り状番号'), { direct: ' 4580-1123-0987 ' }, ...jaScript('で発送しました。')], { kps: 9 });
    await clickUi(WP.el('button.add_note'), { kind: 'hand', after: 80 });
    await wait(500);
    await scrollWp(0, 500);
    await clickUi(WP.el('#select2-order_status-container') || WP.el('#order_status'), { after: 80 });
    await show('order-status-open-2', 0);
    const opt2 = textEl('.select2-results__option', /^発送済み$/);
    if (opt2) { await hoverUi(opt2, { hold: 400 }); await clickUi(opt2, { after: 80 }); }
    await show('order-edit-2', 0);
    const cur2 = WP.el('#select2-order_status-container');
    if (cur2) cur2.textContent = '発送済み';
    await wait(400);
    await clickUi(WP.el('button.save_order'), { kind: 'hand', after: 80 });
    await show('order-shipped', 1100);
    const st2 = WP.el('#select2-order_status-container') || WP.el('#order_status');
    if (st2) { Caption.fixed('「発送済み」で保存され、注文メモに送り状番号とステータスの変更が残る'); Issue.ok(R(st2.closest('p, .form-field') || st2, 4), '発送済み'); await readHold(2400); Issue.hide(); }
    const n2 = WP.el('ul.order_notes');
    if (n2) { for (const li of [...n2.querySelectorAll('li')].slice(0, 3)) await hoverUi(li, { hold: 900 }); }
    await NS.menu('#toplevel_page_woocommerce', 'page=wc-orders');
    await show('orders-final', 800);
    const shipped = row(/発送済み/);
    if (shipped) await hoverUi(shipped.querySelector('mark.order-status') || shipped, { hold: 1800 });
  });

  /* 7 — the live shop */
  scene('live', async () => {
    Caption.allDone();
    await say('公開中のショップ（ninshu.com）で確認');
    await Browser.newTab('live');
    await Browser.typeUrl('ninshu.com');
    Browser.nav('live', { url: LIVE + '/', title: S.title, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    await wait(1400);
    await Store.scroll(700, 1800);
    await wait(900);
    await Store.scroll(1500, 1800);
    await wait(900);
    await say('スマートフォン幅でも確認（DevTools のデバイスモード）');
    await D.Keycap.show(['F12'], 500);
    await K.DevTools.open(true);
    await D.Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Store.loadSp('home');
    await wait(1200);
    await Store.scroll(900, 2000, true);
    await wait(1000);
    await Store.scroll(2200, 2200, true);
    await wait(1200);
    Store.device(false);
    await K.DevTools.open(false);
    await Store.scroll(0, 800);
    // the product with its variations
    await say(`「禅」のフリーカップ：単品 / ペアを選ぶと価格が切り替わる（ペア ¥${ZEN[6].toLocaleString()}・税込）`);
    await Browser.typeUrl('ninshu.com/product/fc-zen');
    Browser.nav('live', { url: LIVE + '/product/fc-zen/', title: `${ZEN[4]} - ${S.title}` });
    Browser.loading('live', true);
    await Store.load('product');
    Browser.loading('live', false);
    await wait(1000);
    const sel = Store.doc.querySelector('form.variations_form select');
    if (sel) {
      await Store.scroll(500, 1600);
      await wait(1200);
      await Store.scrollToEl(sel, 360, 1200);
      await clickUi(sel, { after: 300 });
      await Store.load('product', { states: ['pairChosen'] });
      await Store.scrollToEl(Store.doc.querySelector('form.variations_form select'), 360, 0);
      const price = Store.doc.querySelector('.single_variation .woocommerce-variation-price');
      if (price) { Issue.ok(R(price, 6), `ペア ¥${ZEN[6].toLocaleString()}（税込）`); await readHold(2200); Issue.hide(); }
    }
    // the cart: 20,000 yen or more
    await say('カート：2 万円以上（月雲の大皿 ¥20,900 ほか）のご注文は送料無料');
    Browser.nav('live', { url: LIVE + '/cart/', title: 'カート - ' + S.title });
    Browser.loading('live', true);
    await Store.load('cart');
    Browser.loading('live', false);
    await wait(1200);
    const totals = Store.doc.querySelector('.cart_totals');
    if (totals) {
      await Store.scrollToEl(totals, 200, 1200);
      const ship = totals.querySelector('.woocommerce-shipping-totals, .shipping') || totals;
      await hoverUi(ship, { hold: 2000 });
      await hoverUi(totals.querySelector('.order-total') || totals, { hold: 1400 });
    }
    // my account
    await say('マイアカウント：会員のログイン（会員登録はご購入の手続きの中で）');
    Browser.nav('live', { url: LIVE + '/my-account/', title: 'マイアカウント - ' + S.title });
    Browser.loading('live', true);
    await Store.load('account');
    Browser.loading('live', false);
    await wait(1200);
    const login = Store.doc.querySelector('form.woocommerce-form-login, form.login');
    if (login) { await Store.scrollToEl(login, 220, 1200); await hoverUi(login, { hold: 1800 }); }
    await Store.scroll(0, 1400);
    await say('商品登録・送料・決済・会員・注文管理まで、WooCommerce でショップが動く');
    await wait(4200);
    await wait(1500);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'product', 'cart', 'account'],
    fontText: JSON.stringify(JA),
    async prepare() {
      const tree = [
        ['data', 'dir', 1], ['data/products-woocommerce.csv'],
        ['docs', 'dir', 1], ['docs/requirements.md'],
        ['wp-content', 'dir', 1], ['wp-content/plugins', 'dir', 1], ['wp-content/plugins/ninshu-shop', 'dir', 1], [PLUGIN_FILE],
        ['wp-content/themes', 'dir', 1], ['wp-content/themes/ego_woocommerce_tcd079', 'dir', 0],
        ['.gitignore'], ['.wp-env.json'], ['package.json'], ['README.md'],
      ];
      Code.init(P, tree);
      Code.files[PLUGIN_FILE].indent = '\t';   // WordPress coding standards: tabs
      Code.show('docs/requirements.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      // the tab icon: the shop's WordPress site icon (wp-admin shows it as the favicon)
      Browser.FAV.siteicon = '<img class="br-fav img" src="assets/favicon/site-icon-32.webp" alt="">';
      Browser.addTab({ id: 'wp', title: WP.title('plugins'), url: WP.url('plugins'), page: 'wp', fav: 'siteicon' });
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      // the test orders' (fictitious) customers: name, address, e-mail, phone blurred wherever they show
      for (const [key, f] of Object.entries(WP.frames)) {
        if (!/^order/.test(key)) continue;
        const d = f.contentDocument;
        d.querySelectorAll('.order_data_column .address p, .order_data_column a[href^="mailto:"], .order_data_column a[href^="tel:"], #the-list td.column-billing_address, #the-list td.column-shipping_address').forEach((e) => e.classList.add('pii'));
        d.querySelectorAll('#the-list td.order_number a.order-view strong, #the-list td.order_number a.order-view').forEach((s) => {
          if (s.querySelector('strong, .pii')) return;
          const m = s.textContent.trim().match(/^(#\d+)\s+(.+)$/);
          if (m) s.innerHTML = `${esc(m[1])} <span class="pii">${esc(m[2])}</span>`;
        });
      }
      // 「ゾーンを追加」 as it opens: the region list closed, no tag — the capture's look-alike boxes focused the region box
      // for a moment while the screen was saved (WooCommerce then opened its list and tagged 「どこにでも」)
      const zn = WP.doc('zone-new');
      if (zn) {
        zn.querySelectorAll('.woocommerce-tree-select-control__tree, .woocommerce-tree-select-control__tags .woocommerce-tag').forEach((e) => e.remove());
        zn.querySelectorAll('.woocommerce-tree-select-control__control').forEach((c) => c.classList.remove('has-tags', 'is-focused', 'is-active'));
      }
      // personal data blurred inside the screens too (shared/win11.css only reaches the top document); a typed box: its text only
      for (const f of Object.values(WP.frames)) {
        const st = f.contentDocument.createElement('style');
        st.textContent = '.pii{filter:blur(5px)} [data-demo-input].pii{filter:none;color:transparent!important;text-shadow:0 0 7px rgba(30,30,30,.85)} [data-demo-input].pii .demo-caret{background:#1e1e1e}';
        f.contentDocument.head.appendChild(st);
      }
      await WP.show('plugins');
      Browser.activate('wp');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
