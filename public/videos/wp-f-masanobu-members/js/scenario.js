/*
 * Timeline: the member features of 福岡正信自然農園 (f-masanobu.jp, WordPress + WooCommerce) —
 * registration on the マイアカウント page (WooCommerce's setting) → the registration form's fields (the theme's code;
 * a test registration) → 会員情報 in the admin (the wrong meta key) → マイページ: 会員ステータス (the endpoint's 404 until
 * the permalinks are saved) → 卸会員: B2BKing's group, group price, the member in the group → 卸会員さま専用ページ:
 * Members' role and content permission (the member lacks the role) → the live site.
 * Every WordPress screen is the real wp-admin (js/wp-snapshot.js, tools/snapshots/wp-f-masanobu-members/capture-wp.js);
 * the site itself is the live f-masanobu.jp (js/site-snapshot.js), shown as the dev site at http://localhost:8888, with
 * the member's pages as WordPress rendered them for her (js/apps.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP;
  const { $, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, frameTextTarget, clickUi, hoverUi } = D;
  const { Code, Browser, Store } = K;
  const { Front, blurWp, visible } = window.FM;
  const P = F.files, T = F.T;
  const ACC = T + 'inc/account.php';
  const DEV = 'http://localhost:8888', LIVE = 'https://f-masanobu.jp';
  const WD = WP.data;
  const titleOf = (k) => ((S.pages[k] && S.pages[k].pc || '').match(/<title>([^<]*)<\/title>/) || [])[1] || S.title;
  const TITLE = {
    account: titleOf('account'), register: titleOf('account'), product: titleOf('product'), bigpurchase: titleOf('bigpurchase'),
    notfound: titleOf('notfound'), home: titleOf('home'), status: '会員ステータス | 福岡正信自然農園 official site', wholesale: '卸会員さま専用ページ | 福岡正信自然農園 official site',
  };
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '森田': { r: 'morita', segs: ['森田'] },
    '由紀': { r: 'yuki', segs: ['由紀'], cands: ['雪', 'ゆき', '由紀', '有紀'], pick: 2 },
    'もりた': { r: 'morita', raw: true },
    'ゆき': { r: 'yuki', raw: true },
    '卸会員': { r: 'oroshikaiin', segs: ['卸', '会員'] },
    // the comments / strings typed in inc/account.php
    '登録フォームの先頭：氏名・よみがな・住所・電話': [{ r: 'tourokufo-munosentou:', segs: ['登録', 'フォームの', '先頭：'] }, { r: 'shimei/yomigana/juusho/denwa', segs: ['氏名・', 'よみがな・', '住所・', '電話'] }],
    '管理画面のユーザー編集：会員情報（生年月日・性別）': [{ r: 'kanrigamennoyu-za-henshuu:', segs: ['管理画面の', 'ユーザー', '編集：'] }, { r: 'kaiinjouhou(seinengappi/seibetsu)', segs: ['会員情報（', '生年月日・', '性別）'] }],
    'ユーザー': { r: 'yu-za-', segs: ['ユーザー'] },
    '会員情報': { r: 'kaiinjouhou', segs: ['会員情報'] },
    '生年月日': { r: 'seinengappi', segs: ['生年月日'] },
    '性別': { r: 'seibetsu', segs: ['性別'] },
    '回答なし': { r: 'kaitounashi', segs: ['回答なし'] },
    'マイページのメニュー：「会員ステータス」を追加、ダウンロードは使わない': [{ r: 'maipe-jinomenyu-:', segs: ['マイページの', 'メニュー：'] }, { r: '[kaiinsute-tasu]wotsuika,', segs: ['「会員', 'ステータス」を', '追加、'] }, { r: 'daunro-dohatsukawanai', segs: ['ダウンロードは', '使わない'] }],
    'メニュー': { r: 'menyu-', segs: ['メニュー'] },
    '会員ステータス': { r: 'kaiinsute-tasu', segs: ['会員ステータス'] },
    '—': { direct: '—' },
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
      // the line's own indentation (tabs, and the space of a docblock's " * ") against what Enter put there
      const lead = line.match(/^[\t ]*/)[0], body = line.slice(lead.length);
      if (prev != null) {
        out.push({ key: 'Enter' });
        const auto = K.indentAfter(prev, '\t');
        if (auto !== lead) {
          let same = 0;
          while (same < auto.length && same < lead.length && auto[same] === lead[same]) same++;
          if (auto.length > same) out.push({ key: 'Backspace', n: auto.length - same });
          if (lead.length > same) out.push({ direct: lead.slice(same) });
        }
      } else if (lead) out.push({ direct: lead });
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
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? WP.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const SR = (fn, pad = 0) => () => { const e = typeof fn === 'function' ? fn() : fn; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const textEl = (sel, re, key) => WP.els(sel, key).find((e) => re.test(e.textContent));
  const check = (path, want, tag) => { if (Code.text(path) !== want) { const a = Code.text(path).split('\n'), b = want.split('\n'); const i = a.findIndex((l, k) => l !== b[k]); console.error('[demo] ' + tag + ' line ' + i + ' got ' + JSON.stringify(a[i]) + ' want ' + JSON.stringify(b[i]) + ' (' + a.length + '/' + b.length + ' lines)'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  /** a WordPress screen in the admin tab (its real title and address), the page loading for a moment */
  async function wpScreen(key, o = {}) {
    if (o.loading !== false) { Browser.loading('wp', true); await wait(o.ms || 450); }
    await WP.show(key);
    blurWp(key);
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
  /** a checkbox of the captured screen: clicked, its state changed */
  async function tick(el, on = true) {
    if (!el) return;
    await clickUi(el, { after: 80 });
    el.checked = on;
    if (on) el.setAttribute('checked', ''); else el.removeAttribute('checked');
    await wait(250);
  }
  /** an admin menu entry (hover → its submenu) */
  async function adminMenu(top, sub) {
    const li = WP.el(top);
    await hoverUi(li.querySelector('a'), { hold: 200 });
    if (sub && !li.querySelector(sub)) sub = null;
    if (sub) {
      li.classList.add('opensub');
      await wait(250);
      await clickUi(li.querySelector(sub), { kind: 'hand', after: 60 });
      li.classList.remove('opensub');
    } else await clickUi(li.querySelector('a'), { kind: 'hand', after: 60 });
  }
  /** the dev site (http://localhost:8888) in the "dev" tab */
  async function devPage(page, path, o = {}) {
    Browser.nav(o.tab || 'dev', { title: o.title || TITLE[page], url: o.url || DEV + path, page: 'store', fav: 'store' });
    Browser.loading(o.tab || 'dev', true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading(o.tab || 'dev', false);
    await wait(o.after != null ? o.after : 500);
    return Store.doc;
  }
  const sd = (s) => Store.doc.querySelector(s);
  const SRect = (s, pad = 0) => SR(() => (typeof s === 'string' ? sd(s) : s), pad);

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — WooCommerce: registration on the マイアカウント page */
  scene('settings', async () => {
    Caption.step(1);
    Caption.set('今回の作業：会員登録・会員情報・マイページ・卸会員・卸会員さま専用ページ（README の要件）');
    Issue.ok(linesRect(10, 16, 760), '会員機能の要件');
    await hoverUi(Code.lineEl(12), { ax: 0.3, hold: 2200 });
    Issue.hide();
    await Store.load('account', { states: ['noRegister'] });
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    Caption.set('今のマイアカウント（/account/）はログインフォームだけ：新規登録ができない');
    await hoverUi(sd('form.login'), { ax: 0.3, hold: 1600 });
    Issue.show(SRect('.woocommerce-register-switch-link', 6), '「新規登録はこちら」がない');
    await wait(1800);
    Issue.hide();
    // WooCommerce › 設定 › アカウントとプライバシー
    Caption.set('WooCommerce › 設定 › アカウントとプライバシー：「マイアカウント」ページでのアカウント作成を許可');
    await Browser.clickTab('wp');
    await adminMenu('#toplevel_page_woocommerce', 'a[href="admin.php?page=wc-settings"]');
    await wpScreen('wc-account', { url: DEV + '/wp-admin/admin.php?page=wc-settings&tab=account', ms: 700 });
    const reg = WP.el('#woocommerce_enable_myaccount_registration');
    await hoverUi(textEl('label', /マイアカウント/) || reg, { hold: 500 });
    await tick(reg, true);
    Caption.set('パスワードはお客様が登録フォームで決める（本番と同じ）：「パスワードの設定リンクを送信」はオフ');
    const pw = WP.el('#woocommerce_registration_generate_password');
    await hoverUi(textEl('label', /パスワードの設定リンク/) || pw, { hold: 600 });
    await tick(pw, false);
    await WP.scroll(WP.el('.woocommerce-save-button'), 700);
    await clickUi(WP.el('.woocommerce-save-button'), { kind: 'hand', after: 60 });
    await wpScreen('wc-account-saved', { ms: 800 });
    Issue.ok(R('#message, .notice-success, .updated', 2), '設定を保存しました');
    await wait(1600);
    Issue.hide();
    // the page again: 新規登録はこちら → WooCommerce's own form
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('account'); }, { key: 'F5' });
    Caption.set('「新規登録はこちら」が出た（テーマの form-login.php が ?register=1 で登録フォームに切り替え）');
    const sw = sd('.register-switch-register');
    await hoverUi(sw, { kind: 'hand', hold: 700 });
    await clickUi(sw, { kind: 'hand', after: 60 });
    await devPage('register', '/account/?register=1', { states: ['registerPlain'], after: 600 });
    Caption.set('WooCommerce 標準の登録フォームは、メールアドレスとパスワードだけ');
    Issue.show(SRect('form.register', 8), '項目が足りない');
    await wait(2200);
    Issue.hide();
  });

  /* 2 — the registration form's fields (the theme), a test registration */
  scene('register', async () => {
    Caption.step(2);
    Caption.set('テーマの inc/account.php：登録フォームの項目（請求先住所＋よみがな）と生年月日・性別の定義を貼り付け');
    await Win.switchTo('code');
    await Code.openFile(ACC, { top: 0 });
    const last = Code.files[ACC].lines.length - 2;
    await Code.newLineAfter(last);
    await Code.paste('\n' + F.REG_FIELDS.join('\n'));
    await wait(400);
    Issue.ok(linesRect(Code.find('function fm_register_fields').line, Code.find('return $fields;').line + 1, 820), 'Japanized for WooCommerce のよみがなも含む');
    await wait(1900);
    Issue.hide();
    Caption.set('登録フォームの先頭に、項目を woocommerce_form_field で出力（woocommerce_register_form_start）');
    const end = Code.files[ACC].lines.length - 2;
    await Code.reveal(end, 600);
    await Code.newLineAfter(end);
    const H = F.REG_HOOKS;
    const cut = H.indexOf("add_action( 'woocommerce_register_form_start', 'fm_register_form_start' );");
    await Code.type(tabScript(H.slice(0, cut + 1), Code.files[ACC].lines[end]), { kps: 21 });
    Caption.set('生年月日・性別の出力、必須項目のチェック、登録時の保存（同じ形で追加）');
    // (the pasted block ends at the bottom of the editor: the key display goes away at once, the end scrolls up)
    await Code.scrollTo(Math.max(0, Code.ins.line - 2), 300);
    await Code.paste('\n' + H.slice(cut + 1).join('\n'), { after: 0 });
    KeyStrip.idleHide(0);
    await Code.reveal(Code.files[ACC].lines.length - 1, 300, 14);
    await Code.save();
    check(ACC, F.ACCOUNT(1), 'account.php (1)');
    // the form
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('register'); }, { key: 'F5' });
    Caption.set('本番と同じ登録フォーム：氏名・よみがな・会社名・住所・電話・メール・パスワード・生年月日・性別');
    await Store.scrollToEl(sd('#billing_phone_field'), 420, 1400);
    await wait(500);
    await Store.scrollToEl(sd('#gender_field'), 520, 1100);
    await wait(700);
    await Store.scroll(0, 900);
    // a test registration (invented, blurred)
    Caption.set('テスト登録：卸売りを検討中のカフェのオーナーという想定（個人情報はぼかし）');
    await Front.type('billing_last_name', [JA['森田']], { pii: true, kps: 10 });
    await Front.type('billing_first_name', [JA['由紀']], { pii: true, kps: 10 });
    await Front.type('billing_yomigana_last_name', [JA['もりた']], { pii: true, kps: 10 });
    await Front.type('billing_yomigana_first_name', [JA['ゆき']], { pii: true, kps: 10 });
    Caption.set('住所・電話は Chrome の自動入力');
    await Front.autofill('billing_postcode', ['森田 由紀', '〒631-0033 奈良県奈良市あやめ池南 1-2-3'], {
      billing_company: 'カフェ こもれび', billing_postcode: '631-0033', billing_state: 'JP29', billing_city: '奈良市', billing_address_1: 'あやめ池南 1-2-3', billing_phone: '0742-00-0000',
    });
    await Store.scrollToEl(sd('#reg_email'), 360, 900);
    await Front.type('email', 'komorebi.morita@example.jp', { pii: true, kps: 16 });
    await Front.type('password', '', { secret: 'Komorebi#2026-nara' });
    await Store.scrollToEl(sd('#birth_date_field'), 420, 700);
    await Front.type('birth_year', '1986', { kps: 10 });
    await Front.type('birth_month', '4', { kps: 10 });
    await Front.type('birth_day', '12', { kps: 10 });
    await Front.check('gender', '女性');
    const btn = sd('button[name="register"]');
    await Store.scrollToEl(btn, 520, 600);
    await clickUi(btn, { kind: 'hand', after: 60 });
    Browser.loading('dev', true);
    await wait(900);
    await devPage('account', '/account/', { states: ['memberDash'], after: 600 });
    mark('registered');
    Caption.fixed('登録完了：WooCommerce がそのままログインして、マイアカウントのダッシュボードへ');
    Issue.ok(SRect('.woocommerce-MyAccount-content', 6), 'ログイン中の会員');
    await wait(2300);
    Issue.hide();
  });

  /* 3 — 会員情報 in the admin */
  scene('admin', async () => {
    Caption.step(3);
    Caption.set('管理画面のユーザー編集に「会員情報」（生年月日・性別）を表示：show_user_profile / edit_user_profile');
    await Win.switchTo('code');
    const end = Code.files[ACC].lines.length - 2;
    await Code.reveal(end, 600);
    await Code.newLineAfter(end);
    const A = F.ADMIN_PROFILE(true);
    await Code.type(tabScript(A, Code.files[ACC].lines[end]), { kps: 23 });
    await Code.save();
    check(ACC, F.ACCOUNT(2), 'account.php (2)');
    // ユーザー → the member
    await Win.switchTo('browser');
    await Browser.clickTab('wp');
    await adminMenu('#menu-users');
    await wpScreen('users', { ms: 600 });
    const row = WP.el(`#user-${WD.member.id}`);
    Caption.set('ユーザー一覧：登録した会員（権限グループ「顧客」）');
    if (row) { Issue.ok(R(row, 2), '新しい会員（顧客）'); await wait(1700); Issue.hide(); }
    await clickUi(row ? row.querySelector('.row-title, strong a') : WP.el('.row-title'), { kind: 'hand', after: 60 });
    await wpScreen('user-edit-bad', { ms: 700 });
    const h2 = textEl('#your-profile h2', /会員情報/);
    await WP.scroll(h2, 1300);
    const birthRow = () => textEl('#your-profile tr', /生年月日/);
    Caption.issue('表示ミス', '生年月日が「—」：登録フォームでは 1986 / 4 / 12 と入力している');
    Issue.show(R(birthRow, 3), '生年月日が出ない');
    await wait(2700);
    Issue.hide();
    // the cause: the meta key
    await Win.switchTo('code');
    const bad = Code.find('$user->birthday');
    await Code.reveal(bad.line, 500);
    Caption.issue('原因', '保存しているキーは birth_year / birth_month / birth_day：$user->birthday というメタはない');
    Issue.show(linesRect(bad.line, bad.line, 760), '存在しないメタ');
    await wait(2500);
    Issue.hide();
    Caption.set('年・月・日を「/」でつないで表示');
    await Code.overwrite('$user->birthday', [{ direct: F.BIRTH_EXPR }], { kps: 23 });
    await Code.save();
    check(ACC, F.ACCOUNT(3), 'account.php (3)');
    await Win.switchTo('browser');
    await Browser.reload(async () => { await WP.show('user-edit-fixed'); blurWp('user-edit-fixed'); }, { key: 'F5' });
    await WP.scroll(textEl('#your-profile h2', /会員情報/), 0);
    Caption.fixed('会員情報：生年月日と性別が表示された');
    Issue.ok(R(() => textEl('#your-profile table', /生年月日/), 3), '生年月日・性別');
    await wait(2400);
    Issue.hide();
  });

  /* 4 — マイページ: 会員ステータス */
  scene('mypage', async () => {
    Caption.step(4);
    Caption.set('マイページのメニュー：「会員ステータス」を追加、ダウンロードは使わないので外す（woocommerce_account_menu_items）');
    await Win.switchTo('code');
    const end = Code.files[ACC].lines.length - 2;
    await Code.reveal(end, 600);
    await Code.newLineAfter(end);
    const M = F.ACCOUNT_MENU;
    const cut = M.indexOf("add_filter( 'woocommerce_account_menu_items', 'fm_account_menu_items' );");
    await Code.type(tabScript(M.slice(0, cut + 1), Code.files[ACC].lines[end]), { kps: 22 });
    Caption.set('エンドポイント member-status（woocommerce_get_query_vars）と、その内容のテンプレート');
    await Code.paste('\n' + M.slice(cut + 1).join('\n'));
    await Code.save();
    check(ACC, F.ACCOUNT(4), 'account.php (4)');
    await Code.newFile(T + 'woocommerce/myaccount/member-status.php');
    await Code.paste(P[T + 'woocommerce/myaccount/member-status.php']);
    await Code.save();
    Issue.ok(linesRect(11, 12, 900), 'B2BKing の会員グループ（b2bking_customergroup）');
    await wait(2000);
    Issue.hide();
    // マイページ
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('account', { states: ['memberDash2'] }); }, { key: 'F5' });
    Caption.set('マイページのメニューに「会員ステータス」');
    const item = sd('.woocommerce-MyAccount-navigation-link--member-status a');
    if (item) { Issue.ok(SRect(item.parentElement, 4), '会員ステータス'); await wait(1300); Issue.hide(); }
    await clickUi(item, { kind: 'hand', after: 60 });
    await devPage('notfound', '/account/member-status/', { after: 600 });
    mark('404');
    Caption.issue('404', '「ページが見つかりませんでした」：新しいエンドポイントの URL がまだ WordPress のリライトルールにない');
    await hoverUi($('#brOmni'), { ax: 0.25, hold: 2400 });
    // 設定 › パーマリンク → 変更を保存
    Caption.set('設定 › パーマリンク で「変更を保存」：リライトルールを作り直す');
    await Browser.clickTab('wp');
    await adminMenu('#menu-settings', 'a[href="options-permalink.php"]');
    await wpScreen('permalinks', { ms: 600 });
    await hoverUi(WP.el('#permalink-input-post-name, input[value="/%postname%/"]') || WP.el('#submit'), { hold: 600 });
    await WP.scroll(WP.el('#submit'), 800);
    await clickUi(WP.el('#submit'), { kind: 'hand', after: 60 });
    await wpScreen('permalinks-saved', { ms: 700 });
    Issue.ok(R('#setting-error-settings_updated, .notice-success, .updated', 2), 'パーマリンク構造を更新しました');
    await wait(1500);
    Issue.hide();
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('account', { states: ['memberStatusGeneral'] }); }, { key: 'F5' });
    Browser.nav('dev', { title: TITLE.status });
    Caption.fixed('会員ステータス：一般会員（卸売りのお申し込み案内つき）');
    Issue.ok(SRect('.woocommerce-MyAccount-content', 6), '会員区分：一般会員');
    await wait(2300);
    Issue.hide();
  });

  /* 5 — 卸会員: B2BKing */
  scene('b2b', async () => {
    Caption.step(5);
    Caption.set('卸売りのお申し込み（卸売りについて のフォーム）を承認した会員を「卸会員」に：B2BKing の会員グループ');
    await Browser.clickTab('wp');
    await adminMenu('#toplevel_page_b2bkingcore', 'a[href="edit.php?post_type=b2bking_group"]');
    await wpScreen('b2b-groups', { url: DEV + '/wp-admin/edit.php?post_type=b2bking_group', ms: 700 });
    const create = textEl('a, button', /Create new customer group/);
    await hoverUi(create, { hold: 400 });
    await clickUi(create, { kind: 'hand', after: 60 });
    await wpScreen('b2b-group-new', { ms: 600 });
    await wpType('groupTitle', [JA['卸会員']], { kps: 10 });
    await clickUi(WP.el('#publish'), { kind: 'hand', after: 60 });
    await wpScreen('b2b-group-saved', { ms: 800 });
    Issue.ok(R('#message, .notice-success, .updated', 2), 'グループ「卸会員」');
    await wait(1400);
    Issue.hide();
    // the group price on the product
    Caption.set('商品 › 伊予柑マーマレード：B2BKing が追加した、グループごとの価格に卸価格を入力');
    await adminMenu('#menu-posts-product');
    await wpScreen('product-edit', { url: DEV + `/wp-admin/post.php?post=${WD.setup.products.iyokanmarmalade}&action=edit`, ms: 900 });
    await wpType('groupPrice', [{ direct: '1458' }], { kps: 8 });
    await WP.scroll(0, 900);
    await clickUi(WP.el('#publish'), { kind: 'hand', after: 60 });
    await wpScreen('product-saved', { ms: 900 });
    Issue.ok(R(() => WP.field('groupPrice') || WP.el(`#b2bking_regular_product_price_group_${WD.group}`), 4), '卸会員：¥1,458');
    await wait(1800);
    Issue.hide();
    // the member → 卸会員
    Caption.set('ユーザー › 会員の編集：B2B User Settings の Customer Group を「卸会員」に');
    await adminMenu('#menu-users');
    await wpScreen('users', { ms: 500 });
    const row = WP.el(`#user-${WD.member.id}`);
    await clickUi(row ? row.querySelector('.row-title, strong a') : WP.el('.row-title'), { kind: 'hand', after: 60 });
    await wpScreen('user-edit-b2b', { ms: 700 });
    const sel = WP.el('#b2bking_customergroup');
    await K.choose(sel, (WD.front.groupOptions || []).map((o) => o[1]), '卸会員');
    const opt = [...sel.options].find((o) => /卸会員/.test(o.textContent));
    if (opt) sel.value = opt.value;
    await wait(300);
    await WP.scroll(WP.el('#submit'), 1100);
    await clickUi(WP.el('#submit'), { kind: 'hand', after: 60 });
    await wpScreen('user-b2b-saved', { ms: 800 });
    Issue.ok(R('#message, .notice-success, .updated', 2), 'ユーザーを更新しました');
    await wait(1400);
    Issue.hide();
    // as the member: the product, 会員ステータス
    await Browser.clickTab('dev');
    await Browser.typeUrl('localhost:8888/product/iyokanmarmalade/');
    await devPage('product', '/product/iyokanmarmalade/', { states: ['wholesalePrice'], after: 500 });
    await Store.scrollToEl(visible(Store.doc, 'p.price.demo-wholesale'), 360, 1000);
    Caption.fixed('卸会員でログインしていると、伊予柑マーマレードは卸価格 ¥1,458（一般は ¥1,620）');
    Issue.ok(SR(() => visible(Store.doc, 'p.price.demo-wholesale'), 6), '卸価格');
    await wait(2500);
    Issue.hide();
    await Browser.typeUrl('localhost:8888/account/member-status/');
    await devPage('account', '/account/member-status/', { states: ['memberStatus'], title: TITLE.status, after: 500 });
    Caption.fixed('会員ステータス：卸会員（卸会員さま専用ページへのリンク）');
    Issue.ok(SRect('.woocommerce-MyAccount-content', 6), '会員区分：卸会員');
    await wait(2200);
    Issue.hide();
  });

  /* 6 — 卸会員さま専用ページ: Members */
  scene('members', async () => {
    Caption.step(6);
    Caption.set('卸会員さま専用ページは卸会員だけが見られるように：権限グループとコンテンツの権限を管理する Members を追加');
    await Browser.clickTab('wp');
    await adminMenu('#menu-plugins', 'a[href="plugin-install.php"]');
    await WP.show('plugin-search');
    const results = WP.el('#plugin-filter'), search = WP.el('#search-plugins');
    results.style.visibility = 'hidden';
    const searched = search.value;
    search.value = '';
    await wpScreen('plugin-search', { ms: 600, url: DEV + '/wp-admin/plugin-install.php' });
    await clickUi(search, { kind: 'text', ax: 0.2, after: 60 });
    search.classList.add('demo-focus');
    for (const ch of searched) { KeyStrip.key(ch); search.value += ch; await D.kw(85); }
    KeyStrip.idleHide(600);
    Browser.loading('wp', true); await wait(800);
    results.style.visibility = '';
    Browser.loading('wp', false);
    Browser.nav('wp', { url: WP.url('plugin-search') });
    const card = WP.el('.plugin-card-members');
    await hoverUi(card.querySelector('.name a, h3') || card, { hold: 900 });
    const ib = card.querySelector('.install-now');
    await clickUi(ib, { kind: 'hand', after: 60 });
    ib.textContent = 'インストール中…'; ib.classList.add('updating-message');
    await wait(1800);
    await wpScreen('plugin-installed', { loading: false, after: 300 });
    await clickUi(WP.el('.plugin-card-members .activate-now'), { kind: 'hand', after: 60 });
    await wpScreen('plugins', { ms: 700 });
    Issue.ok(R('tr[data-slug="members"]', 2), 'Members（有効）');
    await wait(1300);
    Issue.hide();
    // the role
    Caption.set('Members › Roles：新しい権限グループ「卸会員」（wholesale_member）、権限は read（閲覧）だけ');
    await adminMenu('#toplevel_page_members', 'a[href="admin.php?page=roles"]');
    await wpScreen('roles', { ms: 600 });
    const add = WP.el('.page-title-action');
    await clickUi(add, { kind: 'hand', after: 60 });
    await wpScreen('role-new', { ms: 600 });
    await wpType('roleName', [JA['卸会員']], { kps: 10 });
    // the slug: Members makes it from the name (a Japanese name gives none) — Role: Edit → wholesale_member
    const edit = WP.els('#wpbody-content button, #wpbody-content a').find((x) => /^\s*(Edit|編集)\s*$/.test(x.textContent) && x.closest('form'));
    if (edit) await clickUi(edit, { kind: 'hand', after: 60 });
    await wpScreen('role-new-slug', { loading: false, after: 200 });
    await wpType('roleSlug', [{ direct: 'wholesale_member' }], { kps: 14 });
    await wpScreen('role-new-filled', { loading: false, after: 300 });
    const read = WP.el('input[name="grant-caps[]"][value="read"]');
    if (read) { await hoverUi(read, { hold: 500 }); Issue.ok(R(read.closest('tr, li, label') || read, 3), 'read（閲覧）'); await wait(1400); Issue.hide(); }
    const save = WP.el('#publish') || WP.el('#wpbody-content form [type="submit"].button-primary');
    await clickUi(save, { kind: 'hand', after: 60 });
    await wpScreen('role-saved', { ms: 700 });
    // the page
    Caption.set('固定ページ「卸会員さま専用ページ」（お店で書いた下書き）：コンテンツの権限で「卸会員」だけに');
    await adminMenu('#menu-pages');
    await wpScreen('page-edit', { url: DEV + `/wp-admin/post.php?post=${WD.page}&action=edit`, ms: 900 });
    // the sidebar panel 「Content Permissions (Members)」: the role 卸会員 (Members saves it right away)
    const cbRow = WP.els('.members-cp-document-panel .components-checkbox-control').find((x) => /卸会員/.test(x.textContent));
    const cb = cbRow && cbRow.querySelector('input[type="checkbox"]');
    if (cb) {
      await hoverUi(cb, { hold: 500 });
      await tick(cb, true);
    }
    await wpScreen('page-edit-checked', { loading: false, after: 400 });
    await clickUi(WP.el('.editor-post-publish-panel__toggle'), { kind: 'hand', after: 60 });
    await wait(700);
    await wpScreen('page-published', { loading: false, after: 900 });
    mark('published');
    // as the member
    await Browser.clickTab('dev');
    await Browser.typeUrl('localhost:8888/wholesale/');
    await devPage('bigpurchase', '/wholesale/', { states: ['wholesaleDenied'], title: TITLE.wholesale, after: 600 });
    Caption.issue('閲覧できない', '卸会員でログインしているのに Members の「Sorry, but you do not have permission to view this content.」');
    Issue.show(SRect('.demo-wholesale-body', 6), '権限がない');
    await wait(2600);
    Issue.hide();
    Caption.issue('原因', 'B2BKing のグループ（価格）と WordPress の権限グループは別：会員の権限グループは「顧客」のまま');
    await wait(2600);
    // the role on the user screen
    Caption.set('ユーザー › 会員の編集：権限グループに「卸会員」を追加（Members で複数の権限グループを持てる）');
    await Browser.clickTab('wp');
    await adminMenu('#menu-users');
    await wpScreen('users', { ms: 500 });
    const row = WP.el(`#user-${WD.member.id}`);
    await clickUi(row ? row.querySelector('.row-title, strong a') : WP.el('.row-title'), { kind: 'hand', after: 60 });
    await wpScreen('user-edit-roles', { ms: 700 });
    const rc = WP.el('input[name="members_user_roles[]"][value="wholesale_member"]');
    if (rc) await tick(rc, true);
    await WP.scroll(WP.el('#submit'), 1100);
    await clickUi(WP.el('#submit'), { kind: 'hand', after: 60 });
    await wpScreen('user-roles-saved', { ms: 800 });
    Issue.ok(R('#message, .notice-success, .updated', 2), 'ユーザーを更新しました');
    await wait(1300);
    Issue.hide();
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('bigpurchase', { states: ['wholesaleAllowed'] }); }, { key: 'F5' });
    Caption.fixed('卸会員さま専用ページが表示された（ログアウト中・一般会員には権限のメッセージ）');
    Issue.ok(SRect('.demo-wholesale-body', 6), '卸会員だけが見られるページ');
    await wait(2400);
    Issue.hide();
    await Store.scrollToEl(sd('.demo-wholesale-body h2:last-of-type') || sd('.demo-wholesale-body'), 300, 1200);
    await wait(800);
  });

  /* 7 — the live site */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のサイト（f-masanobu.jp）');
    await Browser.newTab('live');
    await Browser.typeUrl('f-masanobu.jp');
    Browser.nav('live', { url: LIVE + '/', title: TITLE.home, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    mark('live');
    await wait(1400);
    const login = sd('.cm-hnew__infoOtherLink.is-login a');
    Caption.set('ヘッダーの「ログイン・登録」からマイアカウントへ');
    await hoverUi(login, { kind: 'hand', hold: 900 });
    await clickUi(login, { kind: 'hand', after: 60 });
    await devPage('account', '/account/', { tab: 'live', url: LIVE + '/account/', after: 900 });
    const sw = sd('.register-switch-register');
    await hoverUi(sw, { kind: 'hand', hold: 700 });
    await clickUi(sw, { kind: 'hand', after: 60 });
    await devPage('register', '/account/?register=1', { tab: 'live', url: LIVE + '/account/?register=1', after: 600 });
    Caption.set('会員登録：氏名・よみがな・住所・電話・生年月日・性別（WooCommerce のアカウント）');
    await Store.scrollToEl(sd('#billing_postcode_field'), 300, 1500);
    await wait(700);
    await Store.scrollToEl(sd('#gender_field'), 420, 1300);
    await wait(900);
    await Browser.typeUrl('f-masanobu.jp/big-purchase');
    await devPage('bigpurchase', '/big-purchase', { tab: 'live', url: LIVE + '/big-purchase', after: 800 });
    Caption.set('卸売りについて：お申し込みのあったお客様を卸会員に（卸価格・卸会員さま専用ページ）');
    await Store.scrollToEl(sd('.p-bigpurchase__bodyForm') || sd('.p-bigpurchase__body'), 200, 1600);
    await wait(1600);
    await Store.scroll(0, 900);
    Cursor.kind('arrow');
    Caption.set('WordPress（WooCommerce）の会員機能：会員登録・会員情報・マイページ・卸会員・会員限定ページ');
    await wait(4200);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['account', 'register', 'product', 'bigpurchase', 'notfound', 'home'],
    fontText: JSON.stringify(JA) + Object.values(TITLE).join('') + 'もりたゆき森田由紀カフェこもれび奈良県奈良市あやめ池南',
    async prepare() {
      const tree = [
        ['wp-content', 'dir', 1], ['wp-content/themes', 'dir', 1], ['wp-content/themes/fmasanobu_shop', 'dir', 1],
        [T + 'assets', 'dir', 0], [T + 'assets/css/main.css'], [T + 'assets/js/main.js'],
        [T + 'inc', 'dir', 1], [T + 'inc/account.php'], [T + 'inc/setup.php'], [T + 'inc/shop.php'],
        [T + 'template-parts', 'dir', 0], [T + 'template-parts/footer/footer.php'], [T + 'template-parts/header/nav.php'],
        [T + 'woocommerce', 'dir', 1], [T + 'woocommerce/myaccount', 'dir', 1], [T + 'woocommerce/myaccount/form-login.php'],
        [T + '404.php'], [T + 'footer.php'], [T + 'functions.php'], [T + 'header.php'], [T + 'index.php'], [T + 'page.php'], [T + 'style.css'],
        ['.gitignore'], ['.wp-env.json'], ['package.json'], ['README.md'],
      ];
      const files = { ...P, [ACC]: F.ACCOUNT(0) };
      delete files[T + 'woocommerce/myaccount/member-status.php'];
      Code.init(files, tree);
      Code.show('README.md', { top: 0 });
      Browser.addTab({ id: 'wp', title: WP.title('dashboard'), url: WP.url('dashboard'), page: 'wp', fav: 'wp' });
      Browser.addTab({ id: 'dev', title: TITLE.account, url: DEV + '/account/', page: 'store', fav: 'store' });
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      Object.keys(window.WP_SNAPSHOT.pages).forEach(blurWp);
      await WP.show('dashboard');
      Browser.activate('dev');
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
