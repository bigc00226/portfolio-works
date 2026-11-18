/*
 * Timeline: a booking system for アジアンリトリート (asianretreat.jp, 湘南発の出張マッサージ) with Booking Package —
 * the request and a backup → the plugin (プラグインを追加) → the calendar and its services (the live menu & prices) →
 * the time slots of a day (時間枠を設定) → the input fields and the notification e-mails → online payment (Stripe: the
 * paid plan) → the booking page (a shortcode block) and a test booking → the e-mails (the address missing in the shop's
 * notification) and the travel time between visits (準備時間) → the bookings in the admin → the live page on a phone.
 * Every WordPress screen is real (js/wp-snapshot.js, tools/snapshots/wp-asianretreat-booking/capture-wp.js) — the
 * booking page too: the live page's own markup with the plugin's real calendar inside. The site's other pages are the
 * live asianretreat.jp (js/site-snapshot.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP, AR = window.AR, Mail = window.Mail;
  const { $, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const SITE = 'https://asianretreat.jp';
  const WD = WP.data || {};
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const skip = (hhmm) => { if (window.Win11 && window.Win11.skipTo) window.Win11.skipTo(hhmm); };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    calname: [{ r: 'shucchou', segs: ['出張'] }, { r: 'massa-jino', segs: ['マッサージの'] }, { r: 'goyoyaku', segs: ['ご予約'] }],
    momi: [{ r: 'momihogusi', segs: ['もみほぐし'] }, { direct: ' 60' }, { r: 'hun', segs: ['分'] }],
    addr: [{ r: 'gohoumonsakino', segs: ['ご訪問先の'] }, { r: 'gojuusho', segs: ['ご住所'] }],
    name: [{ r: 'yamamoto', segs: ['山本'] }, { direct: ' ' }, { r: 'aya', segs: ['彩'] }],
    kana: [{ r: 'yamamoto', segs: ['ヤマモト'] }, { direct: ' ' }, { r: 'aya', segs: ['アヤ'] }],
    visit: [{ r: 'kanagawaken', segs: ['神奈川県'] }, { r: 'fujisawashi', segs: ['藤沢市'] }, { r: 'kugenumakaigan', segs: ['鵠沼海岸'] }, { direct: ' 3-2-1-506' }],
    shop: [{ r: 'ajianritori-to', segs: ['アジアンリトリート'] }],
    subject: [{ r: '[', segs: ['【'] }, { r: 'ajianritori-to', segs: ['アジアンリトリート'] }, { r: ']', segs: ['】'] }, { r: 'goyoyakuwo', segs: ['ご予約を'] }, { r: 'uketamawarimashita', segs: ['承りました'] }, { r: '(', segs: ['（'] }, { direct: '[bookingDateAndTime]' }, { r: ')', segs: ['）'] }],
    visitTag: [{ r: 'gohoumonsaki', segs: ['ご訪問先'] }, { r: ':', segs: ['：'] }, { direct: '[address]' }],
  };
  const BOOK = {
    name: '山本 彩', kana: 'ヤマモト アヤ', email: 'aya.yamamoto@example.jp', phone: '090-1234-5678', addr: '神奈川県藤沢市鵠沼海岸 3-2-1-506',
    date: '2026年11月21日（土）13:00', service: 'タイ古式マッサージ 90分', cost: 15300,
  };

  /* ------------------------------------------------------------- helpers */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? WP.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const byText = (sel, re) => WP.els(sel).find((e) => e.offsetParent !== null && re.test(e.textContent.trim()));
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  async function click(el, o = {}) { if (el) await clickUi(el, { kind: 'hand', after: 60, ...o }); else await wait(400); }
  async function hover(el, hold = 800, o = {}) { if (el) await hoverUi(el, { hold, ...o }); else await wait(hold); }
  /** a WordPress screen in the current tab (its real title and address), the page loading for a moment */
  /** the paid plan of Booking Package, once subscribed in scene 5 (RECONSTRUCTED look: js/apps.js AR.unlock) */
  let PAID = null;
  const LAST = {};
  /** Booking Package's editor dialog and its backdrop */
  const EDITOR = '#editPanelForSchedule, #blockPanel';
  /** closes the editor dialog with its × (after 保存 it stays open over the screen) */
  async function closeEditor() {
    const x = WP.el('#media_modal_close_for_schedule');
    if (x && x.getBoundingClientRect().width) await click(x);
    WP.els(EDITOR).forEach((e) => { e.style.display = 'none'; });
    await wait(300);
  }
  async function toTab(id) {
    await Browser.clickTab(id);
    if (LAST[id]) { await WP.show(LAST[id]); if (PAID && id === 'wp') AR.unlock(WP.doc(LAST[id]), PAID); if (LAST[id] === 'front-times-fixed') AR.prepSlots(WP.doc()); }
  }
  async function wpScreen(key, o = {}) {
    const tab = o.tab || 'wp';
    if (o.loading !== false) { Browser.loading(tab, true); await wait(o.ms || 450); }
    await WP.show(key);
    // Booking Package's editor dialog: as captured, or closed (a list screen captured with the dialog still open)
    WP.els(EDITOR, key).forEach((e) => { e.style.display = o.noEditor ? 'none' : ''; });
    LAST[o.tab || 'wp'] = key;
    if (PAID && !/^(front|page|plugin|dashboard)/.test(key)) AR.unlock(WP.doc(key), PAID);
    Browser.nav(tab, { title: o.title || WP.title(key), url: o.url || WP.url(key), page: 'wp' });
    if (o.loading !== false) Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 300);
  }
  /** types into a captured text box (data-demo-input) */
  async function wpType(name, script, o = {}) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 60 });
    WP.focus(box, true);
    if (o.selectAll && box.textContent) {
      await Keycap.show(['Ctrl', 'A'], 500);
      box.innerHTML = `<span style="background:#b4d5fe">${esc(box.textContent)}</span>`;
      await wait(250);
    }
    const t = await typeInto(WP.typeInto(name, undefined, { base: o.base || '' }), script, { kps: o.kps || 12 });
    if (o.blur !== false) WP.blur(name);
    return t;
  }
  /** a captured box: Ctrl+A, Ctrl+V of a whole text (copied from the notes in VS Code) */
  async function boxPaste(name, text) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.3, ay: 0.2, after: 60 });
    WP.focus(box, true);
    await Keycap.show(['Ctrl', 'A'], 500);
    box.innerHTML = `<span style="background:#b4d5fe">${esc(box.textContent)}</span>`;
    await wait(250);
    await Keycap.show(['Ctrl', 'V'], 600);
    box.textContent = text;
    box.scrollTop = 0;
    await wait(300);
    WP.blur(name);
  }
  /** a real <input> of a captured screen (no look-alike box): its value typed key by key */
  async function inputType(inp, text, o = {}) {
    await clickUi(inp, { kind: 'text', ax: 0.2, after: 60 });
    inp.classList.add('demo-focus');
    await D.Ime.setMode(false, true);
    inp.value = '';
    for (const ch of text) { KeyStrip.key(ch); inp.value += ch; await D.kw(1000 / (o.kps || 12) * (0.55 + Math.random() * 0.9)); }
    if (o.enter !== false) KeyStrip.special('Enter');
    KeyStrip.idleHide(700);
    inp.classList.remove('demo-focus');
  }
  /** a secret typed into a real input of a captured screen: ● in the key display, blurred in the box */
  async function secretType(inp, text) {
    await clickUi(inp, { kind: 'text', ax: 0.2, after: 60 });
    inp.classList.add('pii');
    await D.Ime.setMode(false, true);
    inp.value = '';
    for (const ch of text) { KeyStrip.key('●'); inp.value += ch; await D.kw(1000 / 22 * (0.55 + Math.random() * 0.9)); }
    KeyStrip.idleHide(700);
  }
  /** Booking Package's admin menu: a submenu link */
  async function bpMenu(href, key, o = {}) {
    const li = WP.el('#toplevel_page_booking-package-index');
    if (li && !li.classList.contains('wp-has-current-submenu')) { await hover(li.querySelector('a'), 200); li.classList.add('opensub'); await wait(250); }
    await click(WP.el(`#toplevel_page_booking-package-index a[href*="${href}"]`) || li);
    if (li) li.classList.remove('opensub');
    await wpScreen(key, o);
  }
  /** a tab of the calendar (スケジュール / 入力フィールド / 通知 / 設定 …): the click on the current screen, the next screen */
  async function bpTab(id, key, o = {}) {
    await click(WP.el('#' + id));
    await wpScreen(key, { loading: false, after: 400, ...o });
  }
  const yen = (n) => Number(n).toLocaleString('ja-JP') + '円';

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request, a backup, the plugin */
  scene('plugin', async () => {
    Caption.step(1);
    Caption.set('ご依頼：LINE・メールだけの予約を、サイトのカレンダーから 24 時間受け付けたい（カード決済・通知メール・予約管理も）');
    await Code.openFile('docs/web-booking.md', { top: 0 });
    await hover(Code.lineEl(6), 1500, { ax: 0.4 });
    Issue.ok(linesRect(11, 17, 900), 'メニューと料金：サイトの「メニュー＆料金」と同じ');
    await wait(2400);
    Issue.hide();
    await hover(Code.lineEl(21), 1100, { ax: 0.4 });
    // a backup of the production database before installing anything
    Caption.set('本番サイトで作業する前に、データベースをバックアップ（WP-CLI）');
    await Code.panel(true);
    await Term.run('ssh asianretreat', ['<span class="tdim">Last login: Tue Nov 10 18:42:07 2026</span>'], { kps: 16 });
    Term.prompt = '[asianretreat@sv ~]$ ';
    Term.render('<span class="caret"></span>');
    await wait(300);
    await Term.run('wp db export ~/backup/asianretreat-20261112.sql --path=public_html', ['<span class="tg">Success:</span> Exported to \'/home/asianretreat/backup/asianretreat-20261112.sql\'.'], { kps: 22 });
    await wait(700);
    // the plugin
    Caption.set('プラグイン › 新規追加：「Booking Package」（日本の開発者による予約プラグイン・無料）を検索');
    await Win.switchTo('browser');
    const plug = WP.el('#menu-plugins');
    await hover(WP.el('#menu-plugins > a'), 200);
    if (plug) plug.classList.add('opensub');
    await wait(250);
    await click(WP.el('#menu-plugins .wp-submenu a[href="plugin-install.php"]'));
    if (plug) plug.classList.remove('opensub');
    await WP.show('plugin-search');
    const results = WP.el('#plugin-filter'), search = WP.el('#search-plugins');
    if (results) results.style.visibility = 'hidden';
    if (search) search.value = '';
    await wpScreen('plugin-search', { ms: 700, url: SITE + '/wp-admin/plugin-install.php' });
    if (search) await inputType(search, 'Booking Package', { kps: 13 });
    Browser.loading('wp', true); await wait(800);
    if (results) results.style.visibility = '';
    Browser.loading('wp', false);
    Browser.nav('wp', { url: WP.url('plugin-search') });
    await wait(300);
    const card = WP.el('.plugin-card-booking-package');
    await hover(card && (card.querySelector('.name a, h3') || card), 1200);
    if (card) { Issue.ok(R(card, 3), 'Booking Package（有効インストール数 1万以上）'); await wait(1900); Issue.hide(); }
    const btn = card && card.querySelector('.install-now');
    await click(btn);
    if (btn) { btn.textContent = 'インストール中…'; btn.classList.add('updating-message'); }
    await wait(1900);
    await wpScreen('plugin-installed', { loading: false, after: 300 });
    await click(WP.el('.plugin-card-booking-package .activate-now'));
    await wpScreen('plugins', { ms: 700 });
    Issue.ok(R('tr[data-slug="booking-package"]', 2), 'Booking Package（有効）');
    await wait(1700);
    Issue.hide();
  });

  /* 2 — the calendar, the services (the menu and its prices) */
  scene('services', async () => {
    Caption.step(2);
    Caption.set('Booking Package › カレンダーアカウント：最初からある「First Calendar」（時間枠の予約）を使う');
    await bpMenu('booking-package_schedule_page', 'cal-list', { ms: 700 });
    const row = WP.els('#calendar_list_table tr').find((t) => /^First Calendar$/.test(((t.children[1] || {}).textContent || '').trim()));
    await hover(row, 900);
    await click(row);
    await wpScreen('cal-setting', { loading: false, after: 300 });
    await click(WP.el('#settingLink'));
    Caption.set('設定タブ：カレンダーの名前を「出張マッサージのご予約」に（予約画面とメールに出る名前）');
    await wpType('calname', JA.calname, { kps: 11, selectAll: true });
    Caption.set('メールアドレス：予約メールの受信用・送信用をお店のアドレスに、送信者名はお店の名前');
    const calDoc = WP.doc('cal-setting');
    for (const inp of [...calDoc.querySelectorAll('#settingPanel input[type="text"], #settingPanel input:not([type])')].filter((x) => /^(admin@localhost.com|First Calendar)$/.test(x.value))) {
      const shopName = inp.value === 'First Calendar';
      await clickUi(inp, { kind: 'text', ax: 0.2, after: 60 });
      await Keycap.show(['Ctrl', 'A'], 400);
      inp.value = '';
      if (shopName) { inp.value = 'アジアンリトリート'; KeyStrip.key('アジアンリトリート'); await wait(700); KeyStrip.idleHide(500); }
      else await inputType(inp, 'asianretreat.jp@gmail.com', { kps: 18, enter: false });
    }
    await click(byText('button', /^保存$/));
    // the plugin titles the page with the calendar's name: the renamed one from now on
    Browser.setTitle('wp', '出張マッサージのご予約');
    await wait(900);
    // the services
    Caption.set('サービス：メニュー × 施術時間ごとに、所要時間と料金（税込）を登録');
    await bpTab('courseLink', 'svc-empty');
    await click(byText('#coursePanel button, button', /新規項目を追加/));
    await wpScreen('svc-add', { loading: false, after: 300 });
    await wpType('svcname', JA.momi, { kps: 11 });
    await wpType('svccost', [{ direct: '9900' }], { kps: 10, selectAll: true });
    Caption.set('サービスの所要時間：60分（この時間ぶん、続く時間枠が埋まる）');
    await WP.show('svc-add-time');
    const sel = WP.els('select').find((s) => [...s.options].some((o) => o.value === '120') && [...s.options].some((o) => o.value === '5'));
    if (sel) { await click(sel); await wait(400); Issue.ok(R(sel, 4), '60分'); await wait(1500); Issue.hide(); }
    await click(byText('button', /^保存$/));
    await wait(500);
    skip('10:31');
    Caption.set('同じように、もみほぐし・タイ古式・バリニーズアロマ（60 / 90 / 120分）と台湾式足つぼ 60分の 10 件');
    await wpScreen('svc-list', { loading: false, after: 400 });
    await WP.scroll(400, 1200);
    await wait(600);
    await WP.scroll(0, 800);
    // the plugin's own warning: the services are registered but the feature is off (the calendar would not offer them)
    const warn = WP.els('#coursePanel *').find((e) => e.children.length === 0 && /機能が無効/.test(e.textContent));
    Caption.issue('設定もれ', '「有効なアイテムがあるにも関わらず、『サービス』の機能が無効」：このままでは予約画面でメニューを選べない');
    Issue.show(R(warn || WP.el('#coursePanel'), 4), 'サービスの機能が OFF');
    await wait(3000);
    Issue.hide();
    const sw = WP.el('[data-cap="svcswitch"]') || WP.els('#coursePanel *').find((e) => e.children.length === 0 && /^OFF$/.test(e.textContent.trim()));
    await click(sw);
    await wpScreen('svc-list-on', { loading: false, after: 400 });
    Caption.fixed('「この機能を有効化する」を ON：メニュー 10 件を予約画面で選べるように');
    const list = WP.el('#coursePanel') || WP.el('#tabFrame');
    if (list) { Issue.ok(R(list, 2), 'サービス 10 件（サイトの料金表と同じ）'); await wait(2400); Issue.hide(); }
  });

  /* 3 — the time slots */
  scene('slots', async () => {
    Caption.step(3);
    Caption.set('スケジュール：公開日の 11/19（木）をクリックして、その日の時間枠を作る');
    await bpTab('calendarLink', 'sched-month-empty');
    const day = WP.el('[data-day="19"][data-month="11"]');
    await hover(day, 700);
    await click(day);
    await wpScreen('sched-day-set', { loading: false, after: 400 });
    Caption.set('時間枠を設定：10:00 から 20:00 まで・30分間隔・予約可能な枠 1（セラピスト 1 名）');
    await wpScreen('sched-day-set-filled', { loading: false, after: 300 });
    const times = WP.els('input[type="time"]');
    for (const t of times.slice(0, 2)) { await hover(t, 700); }
    // (the page has hidden selects too — the 1〜31 days of the delete form contain a 30 as well): the one in the dialog
    const iv = WP.els('select').find((s) => s.getBoundingClientRect().width > 0 && [...s.options].some((o) => o.value === '30' && /分/.test(o.textContent)));
    if (iv) { await hover(iv, 800); Issue.ok(R(iv, 4), '30分'); await wait(1300); Issue.hide(); }
    await click(byText('button', /^適用$/));
    await wpScreen('sched-day-filled', { loading: false, after: 400 });
    // the time-slot table of the day (the first table of the page is a hidden one)
    const slotTable = WP.els('table').filter((t) => t.getBoundingClientRect().height > 0).sort((a, b) => b.querySelectorAll('tr').length - a.querySelectorAll('tr').length)[0];
    Issue.ok(R(slotTable || WP.el('body'), -2), '10:00〜20:00 の 21 枠');
    await wait(2000);
    Issue.hide();
    await click(byText('button', /^保存$/));
    await wait(700);
    Caption.set('同じ時間枠を 12 月末まで公開（日付をまとめて選んで「編集」）');
    skip('10:40');
    await wpScreen('sched-month', { loading: false, after: 400 });
    for (const n of ['19', '20', '21', '22']) { await hover(WP.el(`[data-day="${n}"][data-month="11"]`), 450); }
    const d21 = WP.el('[data-day="21"][data-month="11"]');
    if (d21) { Issue.ok(R(d21, 2), '各日 10:00〜20:00 の 21 枠'); await wait(2200); Issue.hide(); }
    Caption.set('12 日〜18 日は枠なし（WEB 予約の受付は 11/19 から）。それまでは今まで通り LINE・メールで受付');
    await hover(WP.el('[data-day="16"][data-month="11"]'), 1800);
  });

  /* 4 — the input fields, the notification e-mails */
  scene('fields', async () => {
    Caption.step(4);
    Caption.set('入力フィールド：出張先の住所が必須。「Address」を「ご訪問先のご住所」（必須）に');
    await bpTab('formLink', 'form-list');
    const edits = WP.els('#formPanel .dnd_edit');
    await hover(edits[5], 700);
    await click(edits[5]);
    await wpScreen('form-edit', { loading: false, after: 300 });
    await wpType('fname', JA.addr, { kps: 11, selectAll: true });
    await WP.show('form-edit-filled');
    const req = WP.els('input[name="required"]')[0];
    if (req) { await click(req, { kind: 'arrow' }); req.checked = true; }
    await click(byText('button', /^保存$/));
    await wait(500);
    skip('10:46');
    Caption.set('ほかの項目も日本語に：お名前・フリガナ・メールアドレス・電話番号・キャンセルポリシー');
    await wpScreen('form-list-ja', { loading: false, after: 400 });
    Issue.ok(R('#formPanel', 2), '入力フィールド（日本語）');
    await wait(2200);
    Issue.hide();
    // the notification e-mails
    Caption.set('通知 › 新規：予約が入ったときのメール。お客様向けと管理者（お店）向けを日本語に');
    await bpTab('emailLink', 'mail-list-new', { noEditor: true });
    await click(byText('#emailPanel th, #emailPanel td, #emailPanel div', /^新規$/));
    await wpScreen('mail-new', { loading: false, after: 300 });
    const help = WP.els('*').find((e) => e.children.length === 0 && /\[address\]/.test(e.textContent));
    if (help) { await hover(help, 900); Issue.ok(R(help, 3), '入力フィールドの ID がタグになる'); await wait(1800); Issue.hide(); }
    // the wording agreed with the owner: docs/mail-templates.md
    Caption.set('文面はオーナー様と決めたもの（docs/mail-templates.md）を貼り付ける');
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile('docs/mail-templates.md', { top: 0 });
    await hover(Code.lineEl(4), 900, { ax: 0.4 });
    Issue.ok(linesRect(4, 24, 900), 'お客様向け');
    await wait(1600);
    Issue.hide();
    await Keycap.show(['Ctrl', 'C'], 500);
    await Win.switchTo('browser');
    Caption.set('件名は入力：お店の名前と予約日時（[bookingDateAndTime] は予約の日時に置き換わる）');
    await wpType('msubj', JA.subject, { kps: 12, selectAll: true });
    Caption.set('本文は貼り付け：お名前・予約番号・日時・メニュー・支払い方法・合計金額・ご訪問先');
    await boxPaste('mbody', F.MAIL.body);
    Caption.set('管理者向け：WEB予約が入ったことをお店に知らせるメール');
    await click(byText('*', /^管理者向け$/));
    await wpScreen('mail-new-admin', { loading: false, after: 300 });
    await boxPaste('asubj', F.MAIL.adminSubject);
    await boxPaste('abody', F.MAIL.adminBody);
    await click(byText('button', /^保存$/));
    await wait(800);
    await closeEditor();
  });

  /* 5 — online payment */
  scene('payment', async () => {
    Caption.step(5);
    Caption.set('一般設定：サイト名とメールアドレスが初期値のまま（Site Name / admin@localhost.com）');
    await bpMenu('booking-package_setting_page', 'settings', { ms: 600 });
    if (WP.field('sitename')) {
      await hover(WP.field('sitename'), 900);
      Caption.set('サイト名はお店の名前、メールはサイトに載せているお店のアドレス（予約メールの送信元・通知の宛先）');
      await wpType('sitename', JA.shop, { kps: 11, selectAll: true });
      await wpType('mailto', [{ direct: 'asianretreat.jp@gmail.com' }], { kps: 16, selectAll: true });
      await wpType('fromname', JA.shop, { kps: 11, selectAll: true });
      await wpType('mailfrom', [{ direct: 'asianretreat.jp@gmail.com' }], { kps: 16, selectAll: true });
      await click(byText('button', /変更を保存/));
      await wpScreen('settings-saved', { after: 600 });
      Issue.ok(R(WP.field('sitename') || '#setting_table', 4), 'アジアンリトリート');
      await wait(1600);
      Issue.hide();
    }
    Caption.set('オンライン決済：一般設定 › Stripe');
    await wpScreen('settings-stripe', { loading: false, after: 400 });
    Caption.issue('有料版の機能', 'Stripe・PayPal の決済は Booking Package の有料購読が必要（無料版では入力できない）');
    const note = WP.els('*').find((e) => e.children.length === 0 && /有料購読への加入が必要/.test(e.textContent));
    Issue.show(R(note, 4), '有料購読への加入が必要');
    await wait(2900);
    Issue.hide();
    await WP.scroll(0, 600);
    await click(WP.el('#subscriptionLink'));
    await wpScreen('subscription', { loading: false, after: 400 });
    Caption.set('オーナー様に確認のうえ、有料版を購読（月額・管理画面から申し込み）');
    await wait(2600);
    skip('11:02');
    // RECONSTRUCTED: the same screen once the paid plan is active (the free plugin draws these fields disabled)
    await wpScreen('settings-stripe', { loading: false, after: 300 });
    PAID = { stripe: false, prep: false };
    AR.paid(WP.doc());
    AR.unlock(WP.doc(), PAID);
    const stripeH = WP.els('*').find((e) => e.children.length === 0 && /^Stripe$/.test(e.textContent.trim()));
    if (stripeH) await WP.scroll(stripeH, 700);
    Caption.set('購読後：Stripe を有効にして、テスト環境の公開鍵とシークレットキーを入力');
    const inputs = WP.els('input[type="text"]').filter((i) => /公開鍵|シークレット/.test((i.closest('tr') || i.parentElement.parentElement || {}).textContent || ''));
    const radios = WP.els('input[type="radio"]').filter((r) => /^有効$/.test(((r.closest('label') || r.parentElement || {}).textContent || '').trim()));
    if (radios[0]) { await click(radios[0], { kind: 'arrow' }); radios[0].checked = true; }
    if (inputs[0]) await secretType(inputs[0], 'pk_test_51Q8xAsianRetreatDemoKey000000000000');
    if (inputs[1]) await secretType(inputs[1], 'sk_test_51Q8xAsianRetreatDemoKey000000000000');
    await click(byText('button', /変更を保存/));
    await wait(700);
    // the calendar: the payment methods
    Caption.set('カレンダーの設定 › 支払い方法：「現地で支払う」に「Stripe で支払う」を追加');
    await bpMenu('booking-package_schedule_page', 'cal-list', { ms: 500 });
    await click(WP.els('#calendar_list_table tr')[1]);
    await wpScreen('cal-payment', { loading: false, after: 300 });
    const stripe = WP.els('input[name="paymentMethod"]').find((c) => /Stripe で支払う/.test((c.closest('label') || c.parentElement || {}).textContent || ''));
    if (stripe) { await click(stripe, { kind: 'arrow' }); stripe.checked = true; stripe.removeAttribute('disabled'); PAID.stripe = true; Issue.ok(R(stripe.closest('td') || stripe, 4), '現地払い + Stripe（カード）'); await wait(1900); Issue.hide(); }
    await click(byText('button', /^保存$/));
    await wait(600);
  });

  /* 6 — the booking page, a test booking, the e-mails */
  scene('page', async () => {
    Caption.step(6);
    Caption.set('固定ページ「ご予約」：LINE の案内の上に、予約カレンダーのショートコードを追加');
    await click(WP.el('#menu-pages > a'));
    await wpScreen('page-edit', { ms: 900 });
    await click(WP.el('.editor-document-tools__inserter-toggle'));
    // the inserter's search box: 「ショートコード」 typed through the IME
    await WP.show('page-inserter');
    const sbox = WP.field('search');
    const found = sbox ? sbox.textContent : '';
    if (sbox) sbox.textContent = '';
    WP.els('.block-editor-block-types-list__item, .block-editor-inserter__panel-content').forEach((x) => { x.style.visibility = 'hidden'; });
    await wpScreen('page-inserter', { loading: false, after: 200 });
    if (sbox) await wpType('search', [{ r: 'sho-tokoーdo'.replace('ー', '-'), segs: [found || 'ショートコード'] }], { kps: 11 });
    WP.els('.block-editor-block-types-list__item, .block-editor-inserter__panel-content').forEach((x) => { x.style.visibility = ''; });
    await wait(500);
    const item = WP.els('.block-editor-block-types-list__item').find((x) => /ショートコード/.test(x.textContent));
    await click(item);
    await wpScreen('page-sc', { loading: false, after: 300 });
    // the shortcode block's text box (inside the editor's canvas): the shortcode from the calendar list
    const sc = WP.el('textarea.blocks-shortcode__textarea');
    if (sc) await inputType(sc, '[booking_package id=1]', { kps: 12, enter: false });
    await click(WP.el('.editor-post-publish-button, .editor-header__settings .is-primary'));
    await wpScreen('page-updated', { loading: false, after: 700 });
    // the page as a visitor (a private window would be the same: the admin bar is not there)
    Caption.set('予約ページを確認：サイトのデザインのまま、予約カレンダーが表示された（11/19 から予約可能）');
    await Browser.newTab('site');
    await Browser.typeUrl('asianretreat.jp/booking/');
    await wpScreen('front-cal', { tab: 'site', url: SITE + '/booking/', ms: 800 });
    mark('front');
    const cal = WP.el('[id^="booking-package"]');
    if (cal) { Issue.ok(R(cal, 4), '予約カレンダー'); await wait(2000); Issue.hide(); }
    // a test booking
    Caption.set('テスト予約：11/21（土）13:00〜 タイ古式マッサージ 90分');
    // the steps in the order the plugin showed them in the capture: the day → (the menu) → the time → (the menu) → the form
    const d = WP.els('.selectable_day_slot, .day_slot').find((x) => x.getAttribute('data-day') === '21');
    await click(d);
    await wpScreen('front-day', { tab: 'site', loading: false, after: 400 });
    const pickSvc = async () => {
      const s = WP.els('.selectable_service_slot').find((x) => x.textContent.includes(BOOK.service));
      await hover(s, 500);
      await click(s);
      await wpScreen('front-svc', { tab: 'site', loading: false, after: 300 });
      const next = byText('button', /次へ|次のページ/);
      if (next) await click(next);
    };
    let svcDone = false;
    if (WP.els('.selectable_service_slot').length) { await pickSvc(); svcDone = true; }
    if (WP.has('front-times')) await wpScreen('front-times', { tab: 'site', loading: false, after: 300 });
    const t13 = WP.els('.selectable_time_slot').find((x) => x.textContent.includes('13:00'));
    await hover(t13, 500);
    await click(t13);
    if (!svcDone && WP.has('front-svc')) await pickSvc();
    await wpScreen('front-form', { tab: 'site', loading: false, after: 300 });
    Caption.set('お客様情報を入力（テスト用の名前・住所）');
    if (WP.field('f-first_name')) await wpType('f-first_name', JA.name, { kps: 11 });
    if (WP.field('f-last_name')) await wpType('f-last_name', JA.kana, { kps: 11 });
    if (WP.field('f-email')) await wpType('f-email', [{ direct: BOOK.email }], { kps: 16 });
    if (WP.field('f-phone')) await wpType('f-phone', [{ direct: BOOK.phone }], { kps: 14 });
    if (WP.field('f-address')) await wpType('f-address', JA.visit, { kps: 12 });
    const agree = WP.els('input[type="checkbox"]').find((c) => /同意/.test((c.closest('label, .row, div') || {}).textContent || ''));
    if (agree) { await click(agree, { kind: 'arrow' }); agree.checked = true; }
    // RECONSTRUCTED: the payment method and Stripe's card field (Booking Package's paid plan; see js/apps.js)
    Caption.set('お支払い方法：Stripe（テストモードのカード 4242 4242 4242 4242）');
    const card = AR.card(WP.doc(), WP.el('.book_now_button'));
    if (card) {
      await WP.scroll(card.box, 700);
      await click(card.box, { kind: 'text' });
      card.box.classList.add('focus');
      await typeInto(card.target('num'), [{ direct: '4242 4242 4242 4242' }], { kps: 14 });
      await typeInto(card.target('exp'), [{ direct: '12 / 28' }], { kps: 10 });
      await typeInto(card.target('cvc'), [{ direct: '123' }], { kps: 10 });
      card.box.classList.remove('focus');
    }
    await click(WP.el('.book_now_button') || byText('button', /予約する/));
    await wpScreen('front-done', { tab: 'site', loading: false, after: 500 });
    Caption.fixed('予約が完了した');
    await wait(1600);
    // the e-mails
    skip('11:21');
    Caption.set('お店の受信トレイ：WEB予約の通知メール（管理者向け）');
    const b = { id: '1', bookingDateAndTime: BOOK.date, services: BOOK.service, paymentMethod: 'Stripe で支払う', totalAmount: '¥15,300', first_name: BOOK.name, last_name: BOOK.kana, phone: BOOK.phone, email: BOOK.email, address: BOOK.addr };
    const tpl = F.MAIL;
    Mail.list = [];
    Mail.add({ from: 'アジアンリトリート', addr: 'asianretreat.jp@gmail.com', to: 'asianretreat.jp@gmail.com', subject: AR.mailText(tpl.adminSubject || '', b), snippet: 'WEB予約が入りました。', text: AR.mailText(tpl.adminBody || '', b), time: '11:20', label: 'WEB予約' });
    await Browser.newTab('mail');
    await Browser.typeUrl('mail.google.com');
    Browser.nav('mail', { url: 'https://mail.google.com/mail/u/0/#inbox', title: '受信トレイ (1) - asianretreat.jp@gmail.com - Gmail', page: 'mail', fav: 'gmail' });
    Mail.render({ newIdx: 0 });
    await wait(600);
    await click(Mail.row(0));
    Mail.list[0].read = true;
    Mail.render({ open: 0 });
    await wait(1200);
    Caption.issue('通知メールの不足', 'お店への通知に「ご訪問先」がない：セラピストがどこへ行けばよいか分からない');
    Issue.show(() => screenRect($('#wmText')), 'ご訪問先（住所）がない');
    await wait(3000);
    Issue.hide();
    // the fix: the admin template + [address]
    await toTab('wp');
    // (the tab still shows the page in the block editor, which hides the admin menu: the calendars by their address)
    await Browser.typeUrl('asianretreat.jp/wp-admin/admin.php?page=booking-package_schedule_page');
    await wpScreen('cal-list', { ms: 500 });
    await click(WP.els('#calendar_list_table tr')[1]);
    await wpScreen('sched-month', { loading: false, after: 300 });
    await bpTab('emailLink', 'mail-list-new', { noEditor: true });
    await click(byText('#emailPanel th, #emailPanel td, #emailPanel div', /^新規$/));
    await wpScreen('mail-new', { loading: false, after: 600 });
    await click(byText('*', /^管理者向け$/));
    await wpScreen('mail-new-admin', { loading: false, after: 300 });
    const body = WP.field('abody');
    if (body) { body.textContent = AR.mailText(tpl.adminBody || '', {}); }
    Caption.set('管理者向けの本文に「ご訪問先：[address]」（入力フィールド ID: address）を追加');
    await wpType('abody', [{ direct: '\n\n' }, ...JA.visitTag], { kps: 11, base: body ? body.textContent : '' });
    await click(byText('button', /^保存$/));
    await wait(600);
    await closeEditor();
    skip('11:26');
    Mail.add({ from: 'アジアンリトリート', addr: 'asianretreat.jp@gmail.com', to: 'asianretreat.jp@gmail.com', subject: AR.mailText(tpl.adminSubject || '', { ...b, id: '2', bookingDateAndTime: '2026年11月22日（日）11:00' }), snippet: 'WEB予約が入りました。', text: AR.mailText(tpl.adminBodyFixed || '', { ...b, id: '2', bookingDateAndTime: '2026年11月22日（日）11:00', services: 'もみほぐし 60分', totalAmount: '¥9,900' }), time: '11:26', label: 'WEB予約' });
    await Browser.clickTab('mail');
    Mail.render({ newIdx: 0 });
    await wait(500);
    await click(Mail.row(0));
    Mail.list[0].read = true;
    Mail.render({ open: 0 });
    Caption.fixed('もう一度テスト予約：通知に「ご訪問先」が入った');
    Issue.ok(() => screenRect($('#wmText')), 'ご訪問先あり');
    await wait(2600);
    Issue.hide();
  });

  /* 7 — the travel time, the bookings */
  scene('manage', async () => {
    Caption.step(7);
    Caption.set('11/21 の予約画面をもう一度：13:00〜14:30 の予約のすぐ後、14:30 がまだ選べる');
    await toTab('site');
    await wpScreen('front-times-after', { tab: 'site', url: SITE + '/booking/', ms: 600 });
    const t1430 = WP.els('.selectable_time_slot').find((x) => x.textContent.includes('14:30'));
    Caption.issue('移動時間がない', '出張なので、次のお客様の所へ移動する時間が必要（湘南エリア内で約 30 分）');
    Issue.show(R(t1430, 3), '14:30 が予約できてしまう');
    await wait(3000);
    Issue.hide();
    // the fix: 準備時間 30分（前後）
    await toTab('wp');
    await bpMenu('booking-package_schedule_page', 'cal-list', { ms: 500 });
    await click(WP.els('#calendar_list_table tr')[1]);
    await wpScreen('sched-month', { loading: false, after: 300 });
    await bpTab('settingLink', 'cal-prep');
    Caption.set('カレンダーの設定 › 準備時間：30分（予約の前後）');
    PAID.prep = true;
    await wpScreen('cal-prep-set', { loading: false, after: 300 });
    const prep = WP.els('select').find((s) => s.value === '30');
    if (prep) { await click(prep); Issue.ok(R(prep.closest('td') || prep, 4), '準備時間 30分'); await wait(1700); Issue.hide(); }
    await click(byText('button', /^保存$/));
    await wait(600);
    await toTab('site');
    await Browser.reload(async () => { await WP.show('front-times-fixed'); LAST.site = 'front-times-fixed'; AR.prepSlots(WP.doc()); }, { key: 'F5' });
    Caption.fixed('13:00 の予約の前後 30 分が埋まり、次に選べるのは 15:00 から');
    const t15 = WP.els('.selectable_time_slot').find((x) => x.textContent.includes('15:00'));
    Issue.ok(R(t15 || WP.el('.selectable_time_slot'), 3), '移動時間を確保');
    await wait(2600);
    Issue.hide();
    // the bookings in the admin
    Caption.set('予約済みの顧客：日付ごとの予約、お客様の情報（ご訪問先・電話番号）');
    await toTab('wp');
    await bpMenu('booking-package/index.php', 'customers', { ms: 700 });
    const c21 = WP.el('[data-day="21"][data-month="11"]');
    await click(c21);
    await wpScreen('customers-day', { loading: false, after: 400 });
    const rowY = WP.els('tr, .row, div').filter((e) => e.offsetParent !== null && /山本/.test(e.textContent)).sort((x, y) => x.textContent.length - y.textContent.length)[0];
    if (rowY) { await hover(rowY, 900); Issue.ok(R(rowY, 3), '11/21 13:00 山本 彩 様（タイ古式 90分）'); await wait(2000); Issue.hide(); }
    if (WP.has('customers-detail')) {
      await click(rowY);
      await wpScreen('customers-detail', { loading: false, after: 400 });
      Caption.set('予約の詳細：メニュー・料金・お客様の情報（ご訪問先・電話番号）。変更やキャンセルもここから');
      const addr = WP.els('*').find((e) => e.children.length === 0 && /鵠沼海岸/.test(e.textContent));
      if (addr) { await hover(addr, 800); Issue.ok(R(addr.closest('tr, .row, div') || addr, 3), 'ご訪問先'); await wait(2200); Issue.hide(); }
    }
    await wait(2000);
  });

  /* 8 — the live site, a phone */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のサイト：トップ › ご予約（スマートフォンでも確認）');
    await toTab('site');
    await Browser.typeUrl('asianretreat.jp');
    Browser.nav('site', { url: SITE + '/', title: S.title, page: 'store', fav: 'store' });
    Browser.loading('site', true);
    await Store.load('home');
    Browser.loading('site', false);
    mark('live');
    await wait(1800);
    await Store.scroll(700, 1400);
    await wait(900);
    await Browser.typeUrl('asianretreat.jp/booking/');
    await wpScreen('front-cal', { tab: 'site', url: SITE + '/booking/', ms: 700 });
    await wait(1200);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    $('#wpPage').classList.add('ar-device');
    await wpScreen('front-cal-sp', { tab: 'site', url: SITE + '/booking/', loading: false, after: 600 });
    Caption.set('スマートフォン（幅 390px）：カレンダーが画面の幅に収まり、そのまま予約できる');
    await wait(2600);
    await WP.scroll(500, 1400);
    await wait(1200);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 500);
    $('#wpPage').classList.remove('ar-device');
    await wpScreen('front-cal', { tab: 'site', url: SITE + '/booking/', loading: false, after: 300 });
    Caption.set('WordPress に予約システム：カレンダー予約・Stripe 決済・通知メール・予約と顧客の管理');
    await wait(4200);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home'],
    fontText: JSON.stringify(JA) + F.REQ + F.NOTES + F.TEMPLATES + BOOK.addr,
    async prepare() {
      const tree = [['docs', 'dir', 1], ['docs/mail-templates.md'], ['docs/notes.md'], ['docs/web-booking.md'], ['README.md']];
      Code.init(F.files, tree);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'wp', title: WP.title('dashboard'), url: WP.url('dashboard'), page: 'wp', fav: 'wp' });
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      await WP.show('dashboard');
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
