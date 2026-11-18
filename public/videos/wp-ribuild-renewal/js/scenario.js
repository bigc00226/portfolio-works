/*
 * Timeline: the renewal of 整体りびるど (ribuild.jp) —
 * the old site (theme Lightning) → the page structure in wp-admin (the parent page 症状別のお悩み, the symptom pages
 * under it, the contact page's slug) → the new theme "rebuild" in the dev environment (the navigation item, the phone
 * button) → smartphone (the header, the footer under the fixed buttons) → production (the theme zip, upload, activate,
 * the old URL, the Elementor LP) → the live site.
 * WordPress screens are the real wp-admin (js/wp-snapshot.js, tools/snapshots/wp-ribuild-renewal/capture-wp.js); the
 * new site is the live ribuild.jp (js/site-snapshot.js), shown as the dev site at http://localhost:8888 and at the end
 * as the live site.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP, RB = window.RB;
  const { $, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, frameTextTarget } = D;
  const { clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, DevTools, FileDialog } = K;
  const T = F.T, FINAL = F.final();
  const DEV = 'http://localhost:8888', LIVE = 'https://ribuild.jp';
  const WD = WP.data || {};
  const TITLE = { home: S.title, symptoms: '松本市で痛みのお悩みなら｜症状別に見る整体りびるどの施術' };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '症状別のお悩み': { r: 'shoujoubetsunoonayami', segs: ['症状別の', 'お悩み'], predict: ['症状別', '症状別の'], yomi: ['しょうじょうべつ', 'しょうじょうべつの'] },
    '電話予約': { r: 'denwayoyaku', segs: ['電話予約'], predict: ['電話', '電話予約'], yomi: ['でんわ', 'でんわよやく'] },
    'リニューアル前の': { r: 'rinyu-arumaeno', segs: ['リニューアル', '前の'] },
    'を新しい': { r: 'woatarashii', segs: ['を', '新しい'] },
    'へ': { r: 'he', segs: ['へ'] },
    'で転送': { r: 'detensou', segs: ['で', '転送'] },
    'お問い合わせ': { r: 'otoiawase', segs: ['お問い合わせ'], predict: ['お問い合わせ', 'お問い合わせフォーム'], yomi: ['おといあわせ', 'おといあわせふぉーむ'] },
  };

  /* ------------------------------------------------------------- helpers */
  const check = (path, tag) => { if (Code.text(path) !== FINAL[path]) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const wpRect = (sel, pad = 0) => () => { const e = typeof sel === 'string' ? WP.el(sel) : sel; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const docRect = (sel, sp) => () => { const d = sp ? Store.spDoc : Store.doc; const e = typeof sel === 'string' ? d.querySelector(sel) : sel; return e ? screenRect(e) : null; };
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const pad = (n) => String(n).padStart(2, '0');
  /** the taskbar clock at this point of the video (file dates, the Date header of the response) */
  const hm = () => { const d = window.Win11.now(); return `${d.getHours()}:${pad(d.getMinutes())}`; };
  const gmt = () => { const d = window.Win11.now(); return `${pad(d.getHours() - 9)}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const AI_SIZE = () => { const t = (WP.el('.ai1wm-modal-container') || {}).textContent || ''; const m = t.match(/([\d.,]+\s*[KMG]B)/i); return m ? m[1] : '—'; };
  const byText = (sel, re) => WP.els(sel).find((e) => re.test(e.textContent.trim()));
  /** a WordPress screen in a tab (its real title and address) */
  async function wpScreen(tab, key, o = {}) {
    await RB.wp(tab, key, { load: o.loading !== false, ms: o.ms, url: o.url });
    await wait(o.after != null ? o.after : 300);
    return WP.doc(key);
  }
  /** a flyout of the admin menu (what WordPress' menu script does on hover) */
  async function adminMenu(id, href) {
    const li = WP.el(`#${id}`);
    await hoverUi(WP.el(`#${id} > a`), { hold: 200 });
    li.classList.add('opensub');
    await wait(250);
    const a = WP.el(`#${id} .wp-submenu a[href="${href}"]`);
    await clickUi(a, { kind: 'hand', after: 80 });
    li.classList.remove('opensub');
  }
  /** types into a captured text box (data-demo-input) */
  async function wpType(name, script, o = {}) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 60 });
    WP.focus(box, true);
    if (o.select) { box.innerHTML = `<span style="background:#b4d5fe">${D.esc(box.textContent)}</span>`; await Keycap.show(['Ctrl', 'A'], 500); }
    const t = await typeInto(WP.typeInto(name, null, { base: '' }), script, { kps: o.kps || 12 });
    box.textContent = t;
    if (o.blur !== false) WP.blur(name);
    return t;
  }
  /** the dev site (http://localhost:8888) in the "dev" tab */
  async function devPage(page, path, o = {}) {
    Browser.nav('dev', { title: TITLE[page], url: DEV + path, page: 'store', fav: 'wp' });
    Browser.loading('dev', true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading('dev', false);
    await wait(o.after != null ? o.after : 500);
    return Store.doc;
  }

  /* -------------------------------------------- PHP typed in the editor (tabs, VS Code's indent after an open tag) */
  const VOID = /^(img|br|input|meta|link|hr|source)$/i;
  function smartIndent(line) {
    const ind = line.match(/^\t*/)[0];
    const m = line.match(/^\s*<([a-zA-Z][\w-]*)\b.*>\s*$/);
    const open = m && !VOID.test(m[1]) && !/<\//.test(line) && !/\/>\s*$/.test(line);
    return ind + (open || /[[{(]\s*$/.test(line) ? '\t' : '');
  }
  function phpScript(lines, after) {
    const out = [];
    let prev = after;
    for (const line of lines) {
      const ind = line.match(/^\t*/)[0].length, body = line.slice(ind);
      out.push({ key: 'Enter' });
      const auto = smartIndent(prev).length;
      if (auto > ind) out.push({ key: 'Backspace', n: auto - ind });
      else if (auto < ind) out.push({ direct: '\t'.repeat(ind - auto) });
      const re = /[^\x00-\x7f]+/g;
      let last = 0, m;
      while ((m = re.exec(body))) {
        if (m.index > last) out.push({ direct: body.slice(last, m.index) });
        const c = JA[m[0]];
        if (!c) throw new Error('no IME entry for 「' + m[0] + '」');
        out.push(c);
        last = re.lastIndex;
      }
      if (last < body.length) out.push({ direct: body.slice(last) });
      prev = line;
    }
    return out;
  }
  async function typePhp(lines, atLine, o = {}) {
    const f = Code.files[Code.active];
    await Code.reveal(atLine, 600);
    await Code.newLineAfter(atLine);
    const orig = Code.target;
    Code.target = function () { const t = orig.call(Code); return { ...t, enter: () => '\n' + smartIndent(f.lines[Code.ins.line]) }; };
    try { await Code.type(phpScript(lines, f.lines[atLine]), { kps: o.kps || 26 }); } finally { Code.target = orig; }
  }
  /** rebuild.zip: the real entries / sizes of the zips the two commands make (tools/snapshots/…/capture-wp.js makeZips) */
  const ZIP = {
    list: '$z = [IO.Compression.ZipFile]::OpenRead("$PWD\\rebuild.zip"); $z.Entries.FullName | Select-Object -First 4; $z.Dispose()',
    badList: ['rebuild\\assets\\', 'rebuild\\footer.php', 'rebuild\\front-page.php', 'rebuild\\functions.php'],
    goodList: ['rebuild/', 'rebuild/assets/', 'rebuild/footer.php', 'rebuild/front-page.php'],
    bad: '821 KB', good: '824 KB',
  };
  /** the last `n` output lines of the terminal */
  const termRect = (n) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    const out = rows.slice(-n - 1, -1);
    if (!out.length) return null;
    const a = screenRect(out[0]), b = screenRect(out[out.length - 1]);
    return { left: a.left - 4, top: a.top - 2, width: 420, height: b.bottom - a.top + 4 };
  };
  /** a command from the history (↑), run again */
  async function termAgain(cmd, out, presses = 1) {
    for (let i = 0; i < presses; i++) await Keycap.show(['↑'], 420);
    Term.render(D.esc(cmd) + '<span class="caret"></span>');
    await wait(600);
    KeyStrip.special('Enter');
    KeyStrip.idleHide(900);
    Term.lines.push(D.esc(Term.prompt) + `<span class="tw2">${D.esc(cmd)}</span>`);
    Term.render(null);
    await Term.out(out);
    Term.render('<span class="caret"></span>');
  }
  async function build() {
    await Term.run('npm run build', ['', '<span class="tdim">&gt; ribuild-renewal@ build</span>',
      `<span class="tdim">&gt; sass src/scss/style.scss ${T}assets/css/style.min.css --style=compressed --no-source-map</span>`, '', 700], { kps: 15 });
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the site before the renewal */
  scene('current', async () => {
    Caption.step(1);
    Caption.set('リニューアル前の ribuild.jp：WordPress テーマ「Lightning」のまま。トップはスライドの写真とキャッチコピー');
    await wait(1200);
    await hoverUi(WP.el('.ltg-slide-text-title, .slide-text-title, .ltg-slide-text-set') || WP.el('#global-nav'), { hold: 1600 });
    const nav = WP.el('#global-nav');
    Caption.set('メニューには症状別のページ（腰痛・肩の痛み・首・肩の痛み・膝の痛み）がそのまま並び、右端は画面からはみ出している');
    const items = WP.els('#global-nav li > a');
    for (const i of [3, 4, 5, 6, 7]) if (items[i]) await hoverUi(items[i], { kind: 'hand', hold: 520 });
    Issue.show(wpRect(nav, 4), 'メニュー 11 項目：症状別のページが並列');
    await wait(3400);
    Issue.hide();
    Cursor.kind('arrow');
    Caption.set('予約の入口もない：ヘッダーに電話番号・予約ボタンがなく、トップから予約までが遠い');
    Issue.show(wpRect('.site-header-container, .site-header .container, #site-header', 2), '電話・予約の入口がない');
    await wait(3400);
    Issue.hide();
    // the admin
    Caption.set('管理画面（ribuild.jp/wp-admin）：WordPress 7.1、テーマは Lightning');
    await Browser.clickTab('admin');
    await wait(400);
    const glance = WP.el('#dashboard_right_now');
    if (glance) { await hoverUi(glance.querySelector('.inside p:last-of-type, #wp-version-message, .inside'), { hold: 400 }); Issue.show(wpRect(glance), '固定ページ 21 件 / Lightning テーマ'); await wait(3000); Issue.hide(); }
    await clickUi(WP.el('#menu-pages > a'), { kind: 'hand', after: 60 });
    await wpScreen('admin', 'pages-before');
    Caption.set('固定ページ：症状別の 7 ページはすべて親なし（第一階層）。お問い合わせのスラッグは日本語（/お問い合わせ/）');
    const sym = (WD.symptomIds || []).map((id) => WP.el(`#post-${id}`)).filter(Boolean);
    if (sym.length) {
      await WP.scroll(sym[0], 1100);
      sym.forEach((r) => { r.dataset.bg = r.getAttribute('style') || ''; r.style.background = '#fcf9e8'; });
      await hoverUi(sym[0].querySelector('.row-title'), { hold: 600 });
      Issue.show(wpRect(sym[0]), '症状別の 7 ページ：親なし（第一階層）');
      await wait(3200);
      Issue.hide();
      sym.forEach((r) => r.setAttribute('style', r.dataset.bg));
    }
    const contact = WP.el(`#post-${WD.contactId || 3244}`);
    if (contact) {
      await WP.scroll(contact, 900);
      await hoverUi(contact.querySelector('.row-title'), { hold: 300 });
      contact.classList.add('demo-hover');
      Issue.show(wpRect(contact), 'スラッグ：お問い合わせ（URL が日本語）');
      await wait(3000);
      Issue.hide();
      contact.classList.remove('demo-hover');
      await WP.scroll(0, 700);
    }
  });

  /* 2 — the page structure, the way to the booking */
  scene('structure', async () => {
    Caption.step(2);
    Caption.set('症状別のページをまとめる親ページ「症状別のお悩み」を新規作成（URL は /symptoms/）');
    await adminMenu('menu-pages', 'post-new.php?post_type=page');
    await wpScreen('admin', 'page-new', { ms: 900, after: 600 });
    const title = WP.el('.editor-post-title__input, h1.wp-block-post-title');
    await clickUi(title, { kind: 'text', ax: 0.05, after: 60 });
    title.removeAttribute('data-rich-text-placeholder');
    await typeInto(frameTextTarget(title), [JA['症状別のお悩み']], { kps: 10 });
    await wait(600);
    // the slug: the page panel's slug row
    const row = [...WP.els('.editor-post-panel__row')].find((r) => /スラッグ|URL/.test((r.querySelector('.editor-post-panel__row-label') || {}).textContent || ''));
    if (row) { await hoverUi(row, { hold: 500 }); await clickUi(row.querySelector('button'), { kind: 'hand', after: 80 }); }
    await wpScreen('admin', 'page-url', { loading: false, after: 300 });
    Caption.set('スラッグは自動ではタイトルの日本語のまま → 英語の symptoms に（URL が %E7%97%87… と長くならない）');
    Issue.show(wpRect(WP.field('slug'), 4), 'スラッグ：症状別のお悩み');
    await wait(3200);
    Issue.hide();
    await wpType('slug', [{ direct: 'symptoms' }], { kps: 9, select: true });
    await wait(700);
    await clickUi(WP.el('.editor-post-publish-panel__toggle'), { kind: 'hand', after: 60 });
    await wpScreen('admin', 'page-prepublish', { loading: false, after: 900 });
    await clickUi(WP.el('.editor-post-publish-panel__header-publish-button button, .editor-post-publish-panel .editor-post-publish-button'), { kind: 'hand', after: 60 });
    await wpScreen('admin', 'page-published', { ms: 900 });
    Issue.ok(wpRect('.post-publish-panel__postpublish-header, .post-publish-panel__postpublish'), '公開：/symptoms/');
    await wait(2700);
    Issue.hide();

    // bulk edit: the 7 symptom pages under it
    Caption.set('一括編集：症状別の 7 ページを選んで、親ページを「症状別のお悩み」に');
    await clickUi(WP.el('.editor-header__back-button a, .editor-header__back-button, .edit-post-fullscreen-mode-close'), { kind: 'hand', after: 60 }).catch(() => null);
    await wpScreen('admin', 'pages-mid', { ms: 800 });
    const ids = (WD.symptomIds || []).filter((id) => WP.el(`#cb-select-${id}`));
    if (ids.length) await WP.scroll(WP.el(`#post-${ids[0]}`), 1000);
    for (const id of ids) {
      const cb = WP.el(`#cb-select-${id}`);
      await clickUi(cb, { after: 60 });
      cb.checked = true;
    }
    await wait(500);
    await WP.scroll(0, 900);
    await RB.select(WP.el('#bulk-action-selector-top'), /^\s*(一括)?編集\s*$/);
    await clickUi(WP.el('#doaction'), { kind: 'arrow', after: 60 });
    await wpScreen('admin', 'pages-bulk', { loading: false, after: 700 });
    Issue.show(wpRect('#bulk-titles, .inline-edit-col-left', 2), '選んだ 7 ページ');
    await wait(2700);
    Issue.hide();
    await RB.select(WP.el('#bulk-edit select[name="post_parent"]'), /症状別のお悩み/);
    await wpScreen('admin', 'pages-bulk-set', { loading: false, after: 500 });
    await clickUi(WP.el('#bulk_edit'), { kind: 'arrow', after: 60 });
    await wpScreen('admin', 'pages-after', { ms: 900 });
    const kids = [WD.parentId, ...(WD.symptomIds || [])].map((id) => WP.el(`#post-${id}`)).filter(Boolean);
    if (kids.length) {
      await WP.scroll(kids[0], 1100);
      Caption.fixed('症状別の 7 ページが「症状別のお悩み」の子ページに（URL は /symptoms/…）');
      Issue.ok(() => { const rs = kids.map(screenRect); const top = Math.min(...rs.map((r) => r.top)), bot = Math.max(...rs.map((r) => r.bottom)); return { left: rs[0].left, top, width: rs[0].width, height: bot - top }; }, '症状別のお悩み — 子ページ 7 件');
      await wait(3400);
      Issue.hide();
    }

    // the contact page's slug: quick edit
    Caption.set('お問い合わせのスラッグも英語の contact に（クイック編集）');
    const c = WP.el(`#post-${WD.contactId || 3244}`);
    await WP.scroll(c, 900);
    await hoverUi(c.querySelector('.row-title'), { hold: 400 });
    c.classList.add('demo-hover');
    await clickUi(c.querySelector('button.editinline, .editinline'), { kind: 'hand', after: 60 });
    await wpScreen('admin', 'pages-quick', { loading: false, after: 500 });
    await wpType('slug', [{ direct: 'contact' }], { kps: 9, select: true });
    await clickUi(WP.el('.inline-edit-row .save'), { kind: 'arrow', after: 60 });
    await wpScreen('admin', 'pages-final', { ms: 700 });
    Issue.ok(wpRect(`#post-${WD.contactId || 3244}`), 'お問い合わせ（/contact/）');
    await wait(1600);
    Caption.set('固定ページは旧スラッグが記録されず、旧 URL（/お問い合わせ/）は転送されない → 転送は新テーマに入れる');
    await wait(3600);
    Issue.hide();
  });

  /* 3 — the new theme */
  scene('theme', async () => {
    Caption.step(3);
    Caption.set('新テーマ「rebuild」はローカルで作成。リニューアルの方針は README に');
    await Win.switchTo('code');
    await hoverUi(Code.lineEl(Code.find('リニューアルの方針').line), { ax: 0.3, hold: 900 });
    Issue.show(linesRect(Code.find('テーマを Lightning').line, Code.find('LP（四十肩').line, 760), '方針');
    await wait(3600);
    Issue.hide();
    Caption.set('テーマのヘッダー（style.css）：テーマ名「整体りびるど 公式サイト」');
    await Code.openFile(T + 'style.css', { top: 0 });
    Issue.show(linesRect(2, 5, 520), 'Theme Name / Author / Version');
    await wait(3000);
    Issue.hide();
    Caption.set('開発環境：wp-env（Docker）の WordPress に、テーマのフォルダーを読み込む');
    await Code.openFile('.wp-env.json', { top: 0 });
    await hoverUi(Code.lineEl(3), { ax: 0.4, hold: 1400 });
    await Code.panel(true);
    await Term.run('npm run env', ['', '<span class="tdim">&gt; ribuild-renewal@ env</span>', '<span class="tdim">&gt; wp-env start</span>', '', 300,
      async () => Term.spin('WordPress を起動しています…', 2600, '<span class="tg">✔</span> WordPress development site started at <span class="tc">http://localhost:8888</span>'),
      '<span class="tg">✔</span> WordPress test site started at http://localhost:8889',
      '<span class="tg">✔</span> MySQL is listening on port 53214',
      '<span class="tg">✔</span> MySQL for automated testing is listening on port 53219', '',
      '<span class="tg">✔</span> Done! <span class="tdim">(in 41s 207ms)</span>'], { kps: 12 });
    await wait(700);
    // the dev site: the new design, without the item yet
    await Win.switchTo('browser');
    await Browser.newTab('dev');
    await Browser.typeUrl('localhost:8888');
    await devPage('home', '/', { states: ['noSymptoms', 'noTel'], after: 900 });
    Caption.set('開発サイト（テーマ rebuild）：ヘッダー・メインビジュアル・各セクションのデザインを刷新');
    await Store.scrollToEl(Store.doc.querySelector('.p-concept'), 80, 1600);
    await wait(900);
    await Store.scrollToEl(Store.doc.querySelector('.p-homeMenu'), 80, 1500);
    await wait(900);
    await Store.scroll(0, 1200);
    Caption.set('グローバルナビには、まだ症状別のページへの入口がない');
    await hoverUi(Store.doc.querySelector('.p-gnav'), { ax: 0.5, hold: 900 });
    Issue.show(docRect('.p-gnav'), 'ナビ：症状別のお悩み がない');
    await wait(3200);
    Issue.hide();

    // header.php: the navigation item
    Caption.set('header.php：グローバルナビの「施術メニュー・料金」の後に「症状別のお悩み」を追加');
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile(T + 'header.php', { top: 26 });
    const at = Code.text().split('\n').indexOf(F.NAV_AFTER) + 1;
    await typePhp(F.NAV_ADD, at, { kps: 12 });
    await Code.save();
    check(T + 'header.php', 'header.php');
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('home', { states: ['noTel'] }); }, { key: 'F5' });
    await wait(500);
    const item = Store.doc.querySelector('.p-gnavItem--symptoms > a');
    await hoverUi(item, { kind: 'hand', hold: 700 });
    Issue.ok(docRect('.p-gnavItem--symptoms'), '症状別のお悩み');
    await wait(1500);
    Issue.hide();
    await clickUi(item, { kind: 'hand', after: 60 });
    await devPage('symptoms', '/symptoms/', { states: ['noTel'], after: 800 });
    Caption.set('症状別のお悩み（/symptoms/）：症状ごとの子ページへの入口');
    await Store.scrollToEl(Store.doc.querySelector('.symptoms-hub-symptoms'), 140, 1800);
    await wait(3000);
    await Store.scroll(0, 900);
    Cursor.kind('arrow');

    // functions.php: the old URL of the contact page
    Caption.set('旧 URL の転送：固定ページは旧スラッグが記録されないので、functions.php で /お問い合わせ/ を /contact/ へ 301 転送');
    await Win.switchTo('code');
    await Code.openFile(T + 'functions.php', { top: 22 });
    await typePhp(F.REDIRECT_ADD, Code.files[Code.active].lines.lastIndexOf('}'), { kps: 12 });
    await Code.save();
    check(T + 'functions.php', 'functions.php');
    const r1 = Code.find("'お問い合わせ' =>").line;
    Issue.show(linesRect(r1, r1, 520), '/お問い合わせ/ → /contact/');
    await wait(3200);
    Issue.hide();
  });

  /* 4 — smartphone */
  scene('sp', async () => {
    Caption.step(4);
    Caption.set('スマートフォン表示：DevTools のデバイスモード（幅 390px）でトップページを確認');
    // (VS Code is in front after the last scene: the browser first)
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8888');
    await devPage('home', '/', { after: 300 });
    await Keycap.show(['F12'], 500);
    await DevTools.open(true);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 650);
    Store.device(true);
    await Store.loadSp('home', { states: ['spHeader', 'spFooter', 'noTel'] });
    await wait(900);
    Caption.issue('表示崩れ', 'PC 用の「お電話からのご予約」がヘッダーに残り、ロゴが潰れてメニューボタンが押し出されている');
    Issue.show(docRect('.p-header__inner', true), 'ヘッダーに収まっていない');
    await wait(3600);
    Issue.hide();
    // _header.scss
    Caption.set('_header.scss：スマートフォンではヘッダーの電話番号を出さない（電話は下の固定ボタンから）');
    await Win.switchTo('code');
    await Code.openFile('src/scss/layout/_header.scss', { top: 14 });
    const f = Code.files[Code.active];
    const last = f.lines.length - 1;
    await Code.reveal(last, 600);
    await Code.clickAt(last, 0);
    await Code.type(K.codeScript([...F.HEADER_SP, ''], JA, { after: '' }), { kps: 11 });
    await Code.save();
    check('src/scss/layout/_header.scss', '_header.scss');
    await Code.panel(true);
    await build();
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.loadSp('home', { states: ['spFooter', 'noTel'] }); }, { key: 'F5' });
    await wait(500);
    Caption.fixed('ヘッダーはロゴとメニューボタンだけに');
    Issue.ok(docRect('.p-header__inner', true), 'ロゴ / メニュー');
    await wait(3000);
    Issue.hide();
    // the booking buttons at the bottom: the phone (a smartphone-only button)
    Caption.set('画面の下の予約ボタンは「ご予約・お問合せ」「WEB予約」の 2 つ。電話での予約が多いので「電話予約」を追加');
    Issue.show(docRect('.p-contactBtn', true), '予約ボタン：2 つ');
    await wait(3200);
    Issue.hide();
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile(T + 'template-parts/contact-btn.php', { top: 0 });
    const lines = Code.text().split('\n');
    await typePhp(F.TEL_ADD, lines.lastIndexOf('</div>') - 1, { kps: 14 });
    await Code.save();
    check(T + 'template-parts/contact-btn.php', 'contact-btn.php');
    Caption.set('_contact-btn.scss：スマートフォンは画面の下に横並び。電話予約（タップで発信）は PC では出さない');
    await Code.openFile('src/scss/project/_contact-btn.scss', { top: 0 });
    Issue.show(linesRect(Code.find('@include mq(pc)').line, Code.find('@include mq(pc)').line + 5, 560), 'PC：電話予約は非表示');
    await wait(3400);
    Issue.hide();
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.loadSp('home', { states: ['spFooter'] }); }, { key: 'F5' });
    await wait(500);
    await hoverUi(Store.spDoc.querySelector('.p-contactBtnItem--tel a'), { kind: 'hand', hold: 600 });
    Caption.fixed('画面の下に「電話予約」（タップで 090-6933-8025 に発信）');
    Issue.ok(docRect('.p-contactBtnItem--tel', true), '電話予約');
    await wait(3000);
    Issue.hide();
    Cursor.kind('arrow');
    // the bottom of the page
    Caption.set('ページの一番下まで確認');
    const sd = Store.spDoc;
    await Store.scroll(sd.scrollingElement.scrollHeight * 0.45, 2200, true);
    await wait(500);
    await Store.scroll(sd.scrollingElement.scrollHeight, 2200, true);
    await wait(700);
    Caption.issue('表示崩れ', 'プライバシーポリシーとコピーライトが、下の固定ボタンに隠れている');
    Issue.show(docRect('.p-footer__policy', true), '固定ボタンの下に隠れている');
    await wait(3400);
    Issue.hide();
    // the cause: padding-block
    await Win.switchTo('code');
    await Code.panel(false);
    await Code.openFile('src/scss/layout/_footer.scss', { top: 0 });
    const pb = Code.find('padding-block').line;
    await hoverUi(Code.lineEl(Code.find('padding-bottom').line), { ax: 0.35, hold: 1200 });
    Issue.show(linesRect(pb, pb, 640), 'padding-block = 上と下');
    Caption.issue('原因', 'スマートフォン用の padding-block が、固定ボタンの分の padding-bottom まで上書きしていた');
    await wait(3200);
    Issue.hide();
    Caption.set('スマートフォンで変えるのは上の余白だけ：padding-top に');
    await Code.overwrite('padding-block', [{ direct: 'padding-top' }], { kps: 11 });
    await Code.save();
    check('src/scss/layout/_footer.scss', '_footer.scss');
    await Code.panel(true);
    await build();
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.loadSp('home'); await Store.scroll(Store.spDoc.scrollingElement.scrollHeight, 0, true); }, { key: 'F5' });
    await wait(500);
    Caption.fixed('固定ボタンの分の余白が戻り、プライバシーポリシーとコピーライトが見える');
    Issue.ok(docRect('.p-footer__copyright', true), '© REBUILD');
    await wait(3000);
    Issue.hide();
    // the symptoms page at 390px
    Caption.set('画面の下には予約ボタンが 3 つ（ご予約・お問合せ / WEB予約 / 電話予約）');
    await Store.scroll(Store.spDoc.scrollingElement.scrollHeight * 0.3, 2200, true);
    await wait(900);
    Issue.ok(docRect('.p-contactBtn', true), 'ご予約・お問合せ / WEB予約 / 電話予約');
    await wait(3000);
    Issue.hide();
    Store.device(false);
    await DevTools.open(false);
  });

  /* 5 — production: the theme zip, upload, activate */
  scene('deploy', async () => {
    Caption.step(5);
    if (WP.has('ai-export')) {
      Caption.set('テーマを入れ替える前に本番をバックアップ（All-in-One WP Migration → エクスポート → ファイル）');
      await Win.switchTo('browser');
      await Browser.clickTab('admin');
      await clickUi(WP.el('#toplevel_page_ai1wm_export > a'), { kind: 'hand', after: 60 });
      await wpScreen('admin', 'ai-export', { after: 900 });
      await clickUi(WP.el('.ai1wm-button-export'), { kind: 'hand', after: 60 });
      await wpScreen('admin', 'ai-export-menu', { loading: false, after: 700 });
      await clickUi(WP.el('#ai1wm-export-file'), { kind: 'hand', after: 60 });
      if (WP.has('ai-export-done')) {
        await wait(2400);
        await wpScreen('admin', 'ai-export-done', { loading: false, after: 900 });
        const dl = WP.el('.ai1wm-modal-container a[href*=".wpress"]') || WP.el('.ai1wm-modal-container a.ai1wm-button-green');
        await hoverUi(dl, { kind: 'hand', hold: 400 });
        await clickUi(dl, { kind: 'hand', after: 60 });
        const d = window.Win11.now();
        const file = `ribuild.jp-20261029-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-7k2qxm.wpress`;
        Caption.fixed('バックアップを保存（.wpress）：テーマの入れ替えで問題が出ても、この時点に戻せる');
        await Browser.download(file, AI_SIZE(), { hold: 2600 });
        // the export dialog stays over the screen until it is closed (閉じる): closed before going on in the menu
        const close = WP.el('.ai1wm-modal-container .ai1wm-button-red');
        if (close) {
          await clickUi(close, { kind: 'hand', after: 60 });
          WP.els('.ai1wm-overlay, .ai1wm-modal-container').forEach((e) => { e.style.display = 'none'; });
          await wait(300);
        }
      }
      await wait(600);
    }
    Caption.set('本番へ：テーマのフォルダー rebuild を zip にして、管理画面（外観 › テーマ）からアップロード');
    await Win.switchTo('code');
    await Code.panel(true);
    await Term.run(String.raw`Compress-Archive -Path .\wp-content\themes\rebuild -DestinationPath rebuild.zip`, [], { kps: 12 });
    await wait(700);
    await Win.switchTo('browser');
    await Browser.clickTab('admin');
    await clickUi(WP.el('#menu-appearance > a'), { kind: 'hand', after: 60 });
    await wpScreen('admin', 'themes-before', { after: 500 });
    await hoverUi(WP.el('.theme.active .theme-screenshot'), { hold: 900 });
    await clickUi(WP.el('.page-title-action, a.hide-if-no-js.page-title-action'), { kind: 'hand', after: 60 });
    await wpScreen('admin', 'theme-upload', { ms: 700, after: 500 });
    const pick = async (size) => {
      await clickUi(WP.el('#themezip'), { ax: 0.15, after: 80 });
      await FileDialog.pick({ folder: ['PC', 'ローカル ディスク (C:)', 'dev', 'ribuild-renewal'], look: 900, files: [
        { name: '.gitignore', date: '2026/10/27 10:12', type: 'テキスト ドキュメント', size: '1 KB' },
        { name: '.wp-env.json', date: '2026/10/27 10:15', type: 'JSON ファイル', size: '1 KB' },
        { name: 'package.json', date: '2026/10/27 10:15', type: 'JSON ファイル', size: '1 KB' },
        { name: 'README.md', date: '2026/10/28 17:40', type: 'Markdown ファイル', size: '1 KB' },
        { name: 'rebuild.zip', date: '2026/10/29 ' + hm(), type: '圧縮 (zip 形式) フォルダー', size },
      ], pick: 'rebuild.zip' });
      const inp = WP.el('#themezip');
      const W = inp.ownerDocument.defaultView;
      const dt = new W.DataTransfer();
      dt.items.add(new W.File(['PK'], 'rebuild.zip', { type: 'application/zip' }));
      inp.files = dt.files;
      await wait(500);
    };
    await pick(ZIP.bad);
    await clickUi(WP.el('#install-theme-submit'), { kind: 'arrow', after: 60 });
    await wpScreen('admin', 'theme-install-failed', { ms: 1800 });
    Caption.issue('インストール失敗', '「パッケージをインストールできませんでした。テーマに style.css スタイルシートがありません。」');
    Issue.show(wpRect(byText('.wrap p', /style\.css/) || WP.el('.wrap'), 4), 'style.css が見つからない');
    await wait(3600);
    Issue.hide();
    // the zip's entries
    Caption.set('style.css は rebuild フォルダーに入っているはず：zip の中のパスを確認');
    await Win.switchTo('code');
    await Term.run(ZIP.list, ZIP.badList, { kps: 15 });
    Issue.show(termRect(4), 'パスの区切りが「\\」');
    Caption.issue('原因', 'Windows PowerShell 5.1 の Compress-Archive は zip 内のパスを「\\」で区切る → サーバーではフォルダーにならない');
    await wait(3800);
    Issue.hide();
    Caption.set('Windows 標準の tar で作り直す（パスの区切りは「/」）');
    await Term.run(String.raw`tar -a -c -f rebuild.zip -C wp-content\themes rebuild`, [], { kps: 15 });
    await wait(500);
    await termAgain(ZIP.list, ZIP.goodList, 2);
    Issue.ok(termRect(4), 'rebuild/style.css の形');
    await wait(3000);
    Issue.hide();
    // upload again
    await Win.switchTo('browser');
    await wpScreen('admin', 'theme-upload', { ms: 600, after: 400 });
    await pick(ZIP.good);
    await clickUi(WP.el('#install-theme-submit'), { kind: 'arrow', after: 60 });
    await wpScreen('admin', 'theme-installed', { ms: 1800 });
    Caption.fixed('テーマ「整体りびるど 公式サイト」をインストールしました');
    Issue.ok(wpRect(byText('.wrap p', /完了|インストールしました/) || WP.el('.wrap'), 4), 'インストール完了');
    await wait(3000);
    Issue.hide();
    const activate = WP.els('.wrap a').find((a) => /action=activate/.test(a.getAttribute('href') || ''));
    await hoverUi(activate, { kind: 'hand', hold: 300 });
    await clickUi(activate, { kind: 'hand', after: 60 });
    await wpScreen('admin', 'themes-after', { ms: 900 });
    Caption.fixed('新しいテーマを有効化：Lightning → 整体りびるど 公式サイト');
    Issue.ok(wpRect('.theme.active'), '有効：整体りびるど 公式サイト');
    await wait(3000);
    Issue.hide();

    // the old URL of the contact page: the theme's redirect
    Caption.set('旧 URL の確認：テーマの functions.php の転送（/お問い合わせ/ → /contact/）');
    await Win.switchTo('code');
    await Code.openFile(T + 'functions.php', { top: Code.files[T + 'functions.php'].lines.findIndex((l) => /リニューアル前の URL/.test(l)) - 2 });
    const r0 = Code.find("'お問い合わせ' =>").line;
    Issue.show(linesRect(r0, r0, 520), '/お問い合わせ/ → /contact/');
    await wait(3200);
    Issue.hide();
    await Term.run([{ direct: 'curl.exe -sI https://ribuild.jp/' }, JA['お問い合わせ'], { direct: '/' }], [
      '<span class="ty">HTTP/1.1 301 Moved Permanently</span>', 'Server: nginx', 'Date: Thu, 29 Oct 2026 ' + gmt() + ' GMT', 'Content-Type: text/html; charset=UTF-8',
      'X-Redirect-By: WordPress', '<span class="tg">Location: https://ribuild.jp/contact/</span>'], { kps: 14 });
    Caption.fixed('301（恒久的な転送）で /contact/ へ。ブックマークや検索結果からのアクセスも新しいページに届く');
    await wait(3600);

    // the Elementor LP
    if (WP.has('el-desktop')) {
      Caption.set('Elementor の LP（四十肩・五十肩）はテーマと切り離されたキャンバス：切り替え後のモバイル表示も確認');
      await Win.switchTo('browser');
      await wpScreen('admin', 'el-desktop', { ms: 1400, after: 1400 });
      const mob = WP.el('[data-demo-mobile]');
      if (mob && WP.has('el-mobile')) {
        await clickUi(mob, { kind: 'arrow', after: 60 });
        await wpScreen('admin', 'el-mobile', { loading: false, after: 2400 });
      }
    }
  });

  /* 6 — the live site */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のサイト（ribuild.jp）で確認');
    await Win.switchTo('browser');
    await Browser.clickTab('live');
    await wait(600);
    await Browser.reload(async () => {
      Browser.tab('live').wpKey = null;
      Browser.nav('live', { url: LIVE + '/', title: TITLE.home, page: 'store', fav: 'store' });
      await Store.load('home');
    }, { key: 'F5' });
    await wait(1600);
    Caption.set('新しいデザイン：ヘッダーに電話番号、ナビに「症状別のお悩み」、右下に予約ボタン');
    await hoverUi(Store.doc.querySelector('.p-headerTel'), { hold: 900 });
    await hoverUi(Store.doc.querySelector('.p-gnavItem--symptoms > a'), { kind: 'hand', hold: 900 });
    Cursor.kind('arrow');
    for (const sel of ['.p-concept', '.p-homeMenu', '.p-therapist', '.p-homeBlog', '.p-homeNews', '.p-contact', '.p-info']) {
      const el = Store.doc.querySelector(sel);
      if (el) { await Store.scrollToEl(el, 90, 1500); await wait(800); }
    }
    await Store.scroll(0, 1200);
    const item = Store.doc.querySelector('.p-gnavItem--symptoms > a');
    await hoverUi(item, { kind: 'hand', hold: 400 });
    await clickUi(item, { kind: 'hand', after: 60 });
    Browser.nav('live', { url: LIVE + '/symptoms/', title: TITLE.symptoms });
    Browser.loading('live', true);
    await Store.load('symptoms');
    Browser.loading('live', false);
    await wait(1000);
    Caption.set('症状別のお悩み（/symptoms/）：腰痛・肩・首・膝… 症状ごとのページへ');
    await Store.scrollToEl(Store.doc.querySelector('.symptoms-hub-symptoms'), 140, 1800);
    await wait(3000);
    Caption.set('スマートフォンでも確認：ヘッダーはロゴとメニュー、画面の下に予約ボタン 3 つ');
    await Keycap.show(['F12'], 500);
    await DevTools.open(true);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 650);
    Store.device(true);
    await Store.loadSp('home');
    await wait(1800);
    await Store.scrollToEl(Store.spDoc.querySelector('.p-homeMenu'), 90, 2000, true);
    await wait(1600);
    await Store.scroll(Store.spDoc.scrollingElement.scrollHeight, 2600, true);
    await wait(3200);
    Store.device(false);
    await DevTools.open(false);
    await Store.scroll(0, 1000);
    Caption.set('WordPress サイトのリニューアルが完了：新テーマ・ページ構成と予約導線・スマートフォン表示');
    await wait(4800);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'symptoms'],
    fontText: JSON.stringify(JA) + F.NAV_ADD.join('') + F.TEL_ADD.join(''),
    async prepare() {
      Code.init({ ...F.files }, F.tree);
      RB.phpLang();
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: '', url: '', page: 'wp', fav: 'store' });
      Browser.addTab({ id: 'admin', title: '', url: '', page: 'wp', fav: 'store' }, { activate: false });
      await WP.preload(['old-front', 'dashboard', 'pages-before']);
      // Elementor hides its loading screen once the editor has started (the captured page still has it)
      const els = ['el-desktop', 'el-mobile'].filter((k) => WP.has(k));
      await WP.preload(els);
      els.forEach((k) => WP.docs(k).forEach((d) => { const l = d.getElementById('elementor-loading'); if (l) l.style.display = 'none'; }));
      // the export's download button names the site by its host: Playground's, here the production domain
      if (WP.has('ai-export-done')) {
        await WP.preload(['ai-export-done']);
        WP.docs('ai-export-done').forEach((d) => { const w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) if (/wpsandbox.wordpress.net/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/wpsandbox.wordpress.net/gi, (m) => (m === m.toUpperCase() ? 'RIBUILD.JP' : 'ribuild.jp')); });
      }
      await RB.wp('admin', 'dashboard', { load: false });
      await RB.wp('live', 'old-front', { load: false });
      Browser.activate('live');
      D.Win.open('code', 'max');
      D.Win.open('browser', 'max');
      D.Win.front('browser');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
