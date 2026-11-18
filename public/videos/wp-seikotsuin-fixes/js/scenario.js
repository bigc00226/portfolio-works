/*
 * Timeline: one maintenance session for two clinics' WordPress sites (fix requests of 2026/10/30) —
 * the requests → はらいろ整骨院: 施術メニュー 10 (酸素カプセル) + the green box's reservation link (front-page.php,
 * common/css/base.css; mistake: the new icon not uploaded) → the footer note (footer.php) + the search description
 * (All in One SEO in the real wp-admin) → へいわじま整骨院: the hours (footer.php) → smartphone width: the address line
 * break (mistake: class "br-sp" instead of the theme's "br_sp") and the green box link (mistake: no tablet / smartphone
 * rules) → both live sites.
 * The sites in the browser are the live harairo.com / heiwajima-seikotsuin.com (js/site-snapshot.js), shown as they
 * were before each fix with the states of js/apps.js; every WordPress screen is the real wp-admin with the real
 * All in One SEO (js/wp-snapshot.js, tools/snapshots/wp-seikotsuin-fixes/capture-wp.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP;
  const { $, esc, wait, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, clickUi, hoverUi, moveToEl } = D;
  const { Code, Term, Browser, Store, DevTools, readHold } = K;
  const SK = window.SEIK;
  const P = F.files;
  const HR = 'https://harairo.com', HW = 'https://heiwajima-seikotsuin.com';
  const H_DIR = 'harairo:harairo.com/public_html/wp/wp-content/themes/harairoSeikotsuinWp';
  const W_DIR = 'heiwajima:heiwajima-seikotsuin.com/public_html/wp-content/themes/heiwajima';
  const URL = { harairo: HR + '/', heiwajima: HW + '/', 'heiwajima-menu': HW + '/menu' };
  const titleOf = (page) => ((S.pages[page].pc.match(/<title>([^<]*)<\/title>/) || [])[1] || '').replace(/&amp;/g, '&');
  const WD = WP.data;
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '酸素カプセル': { r: 'sansokapuseru', segs: ['酸素', 'カプセル'], predict: ['酸素', '酸素カプセル'], yomi: ['さんそ', 'さんそかぷせる'] },
    '祝日は要問い合わせ': { r: 'shukujitsuhayoutoiawase', segs: ['祝日は', '要問い合わせ'] },
    '時': { r: 'ji', segs: [{ c: ['時', '字', '次'], p: 0 }] },
    '時は予約制': { r: 'jihayoyakusei', segs: ['時は', '予約制'] },
    '酸素カプセルもご利用いただけます。': { r: 'sansokapuserumogoriyouitadakemasu.', segs: ['酸素カプセルも', 'ご利用', 'いただけます。'] },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);

  /* ------------------------------------------------------------- helpers */
  const L = () => Code.files[Code.active].lines;
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  /** an element of the site in the browser (PC frame, or the smartphone frame in device mode) */
  const R = (fn, pad = 0) => () => { const e = fn(); if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const check = (path, want, tag) => {
    if (Code.text(path) === want) return;
    console.warn('[demo] ' + path + ' differs from the expected text');
    window.__typeDiff = (window.__typeDiff || []).concat(tag);
    (window.__checks = window.__checks || {})[tag] = { got: Code.text(path), want };
  };
  const bytes = (text) => new TextEncoder().encode(text).length;
  /** scp's progress line (OpenSSH): name, 100%, size, rate, time */
  const scpOut = (path) => {
    const name = path.split('/').pop(), b = bytes(Code.text(path));
    const size = b >= 10000 ? `${Math.round(b / 1024)}KB` : String(b);
    const rate = (b / 1024 / (0.05 + Math.random() * 0.06)).toFixed(1);
    return `${name}${' '.repeat(Math.max(2, 46 - name.length))}100% ${size.padStart(5)} ${rate.padStart(7)}KB/s   00:00`;
  };
  async function scp(path, dirExpr) {
    await Term.run(`scp ${path} "${dirExpr}"`, [450, scpOut(path)], { kps: 24 });
  }
  /** ↑ in the terminal: the last command again */
  async function again(cmd, out) {
    Term.render(`<span class="tw2">${esc(cmd)}</span><span class="caret"></span>`);
    await Keycap.show(['↑'], 500);
    await wait(300);
    KeyStrip.special('Enter');
    KeyStrip.idleHide(700);
    Term.lines.push(esc(Term.prompt) + `<span class="tw2">${esc(cmd)}</span>`);
    Term.render(null);
    await Term.out(out);
    Term.render('<span class="caret"></span>');
  }
  /** whole lines a..b copied (Shift+click selection, Ctrl+C) */
  async function copyLines(a, b) {
    await Code.reveal(b, 600);
    await Code.selectLines(a, b);
    await Keycap.show(['Ctrl', 'C'], 500);
    return L().slice(a, b + 1);
  }
  /** pasted as whole lines above line `at` (caret at its start, Ctrl+V) */
  async function pasteLinesAt(at, lines) {
    await Code.clickAt(at, 0);
    await Code.paste(lines.join('\n') + '\n');
  }

  /* ---- the two sites: one tab each, sharing the kit's store page (PC frame / smartphone frame in device mode) */
  const TABS = {
    hr: { page: 'harairo', states: ['h10', 'hCta', 'hNote'], y: 0, fav: 'harairo' },
    hw: { page: 'heiwajima', states: ['wHours', 'wAddr'], y: 0, fav: 'heiwajima' },
  };
  let device = false;
  const doc = () => (device ? Store.spDoc : Store.doc);
  const q = (sel) => doc() && doc().querySelector(sel);
  const scrollTo = (el, off = 120, ms = 1200) => (el ? Store.scrollToEl(el, off, ms, device) : null);
  /** (re)loads the tab's page with its current states */
  async function loadSite(tab, o = {}) {
    const t = TABS[tab];
    if (o.page) t.page = o.page;
    if (o.states) t.states = o.states;
    Browser.nav(tab, { url: URL[t.page], title: titleOf(t.page) });
    const states = t.page === 'harairo' ? ['hSide', ...t.states] : t.states;
    if (device) await Store.loadSp(t.page, { states });
    else await Store.load(t.page, { states });
  }
  /** はらいろ's side tab 「診療時間・予約」: a click on its title opens / closes it */
  async function sideTab(open) {
    await clickUi(q('#fixbtn .fixBtnTit'), { kind: 'hand', after: 60 });
    SK.side(doc(), open, true);
    await wait(500);
  }
  /** navigation in the active tab (address typed or link clicked before): the page loads */
  async function navSite(tab, o = {}) {
    Browser.loading(tab, true);
    await loadSite(tab, o);
    await wait(250);
    Browser.loading(tab, false);
  }
  /** F5 in the active site tab */
  async function reloadSite(tab, states) {
    // F5 keeps the scroll position (as Chrome does): what was being looked at stays on screen
    const y = Store.win(device).scrollY;
    await Browser.reload(async () => { await loadSite(tab, { states }); Store.win(device).scrollTo(0, y); }, { key: 'F5' });
  }
  /** switching tabs: the store page shows the other site (scroll position kept per tab) */
  async function toTab(id) {
    const from = Browser.active;
    if (TABS[from]) TABS[from].y = Store.win(device).scrollY;
    await clickUi(Browser.tabEl(id), { kind: 'arrow', after: 60 });
    // (the store page is shared: hidden only while the other site is put in it)
    if (TABS[id]) $('#stPage').classList.add('swap');
    Browser.activate(id);
    if (TABS[id]) {
      await loadSite(id);
      Store.win(device).scrollTo(0, TABS[id].y);
    }
    $('#stPage').classList.remove('swap');
    await wait(300);
  }
  async function deviceMode(on) {
    if (TABS[Browser.active]) TABS[Browser.active].y = 0;
    await Keycap.show(['Ctrl', 'Shift', 'M'], 600);
    device = on;
    Store.device(on);
    if (TABS[Browser.active]) await loadSite(Browser.active);
    await wait(300);
  }

  /* ---- WordPress (the real wp-admin of harairo.com) */
  async function wpScreen(key, o = {}) {
    if (o.loading !== false) { Browser.loading('wp', true); await wait(o.ms || 450); }
    await WP.show(key);
    Browser.nav('wp', { title: WP.title(key), url: o.url || WP.url(key), page: 'wp', fav: 'harairo' });
    if (o.loading !== false) Browser.loading('wp', false);
    await wait(o.after != null ? o.after : 300);
  }
  /** a hidden admin flyout opened by the pointer (WordPress' own menu script does this on hover) */
  async function adminMenu(id, href) {
    const li = WP.el(`#${id}`);
    await hoverUi(WP.el(`#${id} > a`), { hold: 250 });
    li.classList.add('opensub');
    await wait(300);
    await clickUi(WP.el(`#${id} .wp-submenu a[href$="${href}"]`), { kind: 'hand', after: 80 });
    li.classList.remove('opensub');
  }
  /** the 固定ページ description row of All in One SEO › 検索の外観 › コンテンツタイプ */
  const descRow = (key) => WP.el('[data-demo-row="home-desc"]', key);
  const descEditor = (key) => WP.el('[data-demo-desc]', key);
  const saveBtn = (key) => WP.els('button.aioseo-button', key).filter((b) => /変更を保存/.test(b.textContent)).pop();

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the requests, the two sites as they are */
  scene('requests', async () => {
    Caption.step(1);
    Caption.set('今日の修正依頼：はらいろ整骨院（4 件）と、へいわじま整骨院（2 件）');
    await hoverUi(Code.lineEl(2), { ax: 0.25, hold: 900 });
    await hoverUi(Code.lineEl(4), { ax: 0.3, hold: 1300 });
    await hoverUi(Code.lineEl(6), { ax: 0.35, hold: 1300 });
    await hoverUi(Code.lineEl(9), { ax: 0.3, hold: 1100 });
    await hoverUi(Code.lineEl(11), { ax: 0.35, hold: 1100 });
    await hoverUi(Code.lineEl(15), { ax: 0.35, hold: 1100 });
    await hoverUi(Code.lineEl(18), { ax: 0.3, hold: 1100 });
    // はらいろ整骨院 now
    await Win.switchTo('browser');
    Caption.set('はらいろ整骨院（harairo.com）の今のトップページ：施術メニューは 9 つ');
    await scrollTo(q('#topMenu h2'), 120, 1600);
    await wait(500);
    const items = [...doc().querySelectorAll('#topMenu .item')].filter((e) => !e.hasAttribute('data-demo-hidden'));
    await hoverUi(items[items.length - 1], { hold: 1200 });
    Caption.set('予約案内（緑の枠）：LINE の WEB 予約と電話。右下が空いている');
    await scrollTo(q('.cCtaBox01'), 220, 1300);
    await hoverUi(q('.cCtaBox01 .ctaBoxIn'), { ax: 0.85, ay: 0.78, hold: 1400 });
    Caption.set('フッターの表記は「土曜17:00まで」');
    await scrollTo(q('#ftrIn'), 160, 1500);
    Issue.show(R(() => SK.noteP(doc()), 4), '土曜17:00まで');
    await wait(1600);
    Issue.hide();
    Caption.set('右の「診療時間・予約」タブは「土曜は18:00まで／祝日は要問い合わせ」：食い違っている');
    await sideTab(true);
    await hoverUi(q('#fixbtn .fixBtnIn img:nth-child(2)'), { hold: 2200 });
    await sideTab(false);
    // へいわじま整骨院 now
    Caption.set('へいわじま整骨院（heiwajima-seikotsuin.com）：フッターの診療時間');
    await toTab('hw');
    await scrollTo(q('.footer_info_table'), 200, 1700);
    await hoverUi(SK.hoursDd(doc())[0], { hold: 1200 });
    await hoverUi(SK.hoursDd(doc())[1], { hold: 1000 });
    mark('requests');
  });

  /* 2 — はらいろ: menu item 10 + the green box's link (mistake 1: the icon not uploaded) */
  scene('menu', async () => {
    Caption.step(2);
    window.Win11.skipTo('14:12');
    await Win.switchTo('code');
    Caption.set('トップページ（front-page.php）：施術メニューの 09 をコピーして 10 番目を作る');
    const FRONT = 'harairo/front-page.php';
    await Code.openFile(FRONT, { top: 100 });
    const a = L().indexOf('\t\t\t\t<span class="num">09</span>') - 1, b = a + 4;
    const item = await copyLines(a, b);
    await pasteLinesAt(b + 1, item);
    await Code.overwrite('09', '10', { from: b + 2, kps: 9 });
    await Code.overwrite('09', '10', { from: b + 3, kps: 9 });
    Caption.set('画像は ico_menu_10.svg、メニュー名は「酸素カプセル」');
    await Code.overwrite('健康×美姿勢×運動不足プログラム', [JA['酸素カプセル']], { from: b + 3, kps: 12 });
    await Code.overwrite('健康×美姿勢×<br>運動不足プログラム', [JA['酸素カプセル']], { from: b + 4, kps: 12 });
    // the reservation link: the footer's (10/23), copied
    Caption.set('予約案内のリンクは、10/23 にフッターへ入れたものと同じ：footer.php からコピー');
    await Code.openFile('harairo/footer.php', { top: 8 });
    const g = Code.find('<div class="grid-link">').line;
    const link = await copyLines(g, g + 2);
    await Code.openFile(FRONT);
    const t = Code.find('<div class="ctaTel">').line;
    await Code.reveal(t, 700);
    await pasteLinesAt(t, link);
    Caption.set('クラス名を ctaYoyaku に（緑の枠の右下：base.css のグリッドで場所が決まっている）');
    await Code.overwrite('grid-link', 'ctaYoyaku', { from: t, kps: 12 });
    await Code.save();
    {
      const want = P[FRONT].split('\n');
      const ti = want.indexOf('\t\t\t<div class="ctaTel">');
      want.splice(ti, 0, ...F.CTA_YOYAKU);
      const ni = want.lastIndexOf('\t\t\t\t<span class="num">09</span>') + 4;
      want.splice(ni, 0, ...F.ITEM_10);
      check(FRONT, want.join('\n'), 'front-page');
    }
    // the styles (PC)
    const CSS = 'harairo/common/css/base.css';
    await Code.openFile(CSS, { top: 0 });
    const ga = Code.find('.ctaBoxIn .ctaYoyaku {').line;
    await Code.reveal(ga + 4, 900);
    Caption.set('base.css：予約案内の枠は 3 列 × 2 行のグリッド。右下が ctaYoyaku の場所');
    await hoverUi(Code.lineEl(ga), { ax: 0.4, hold: 1200 });
    await hoverUi(Code.lineEl(ga + 1), { ax: 0.4, hold: 1000 });
    const prev = F.CTA_AT.pc - 1;   // (the line before: the end of the .ctaLine styles)
    await Code.reveal(prev + 14, 900);
    Caption.set('リンクのスタイルを追加：枠の右下に下寄せ（LINE の WEB 予約ボタンの下）');
    await Code.newLineAfter(prev);
    const css = F.CTA_CSS;
    await Code.type(code(css.slice(0, 9), { after: L()[prev] }), { kps: 30 });
    Caption.set('文字は画面の幅に合わせて 14〜18px・折り返さない');
    await Code.type(code(css.slice(9, 17), { after: css[8] }), { kps: 30 });
    Caption.set('下線はフッターの予約リンクと同じ動き（マウスを乗せると右へ消える）');
    await Code.type(code(css.slice(17), { after: css[16] }), { kps: 32 });
    await Code.save();
    check(CSS, F.BASE_MID, 'base.css (PC)');
    // upload
    Caption.set('サーバーにアップロード（SSH の scp）：テーマの front-page.php と common/css/base.css');
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await wait(300);
    await Term.run(`$h = "${H_DIR}"`, [], { kps: 26 });
    await scp('harairo/front-page.php', '$h/');
    await scp('harairo/common/css/base.css', '$h/common/css/');
    await wait(400);
    await Win.switchTo('browser');
    await toTab('hr');
    await reloadSite('hr', ['hIcon', 'hNote']);
    await scrollTo(q('#topMenu .inner'), 260, 1500);
    await wait(500);
    Caption.issue('アップロード漏れ', 'アイコンが出ない：新しい画像 ico_menu_10.svg をアップロードしていなかった');
    Issue.show(R(() => SK.item10(doc()), 6), '画像が見つからない');
    await moveToEl(SK.item10(doc()).querySelector('.img') || SK.item10(doc()), { ay: 0.4 });
    await wait(2400);
    Issue.hide();
    await Win.switchTo('code');
    await Code.expand('harairo/common/images');
    await Code.expand('harairo/common/images/menu');
    await hoverUi(Code.node('harairo/common/images/menu/ico_menu_10.svg'), { hold: 1000 });
    Caption.set('受け取ったアイコンの画像も、テーマの common/images/menu/ にアップロード');
    await scp('harairo/common/images/menu/ico_menu_10.svg', '$h/common/images/menu/');
    await wait(400);
    await Win.switchTo('browser');
    TABS.hr.states = ['hNote'];
    await reloadSite('hr');
    Caption.fixed('施術メニューに「10 酸素カプセル」：アイコンも表示された');
    Issue.ok(R(() => SK.item10(doc()), 6), '10 酸素カプセル');
    await readHold(2200);
    Issue.hide();
    Caption.set('予約案内の右下に「酸素カプセルのご予約はこちら」（Square の予約ページ）');
    await scrollTo(q('.cCtaBox01'), 220, 1300);
    const ya = q('.cCtaBox01 .ctaYoyaku a');
    Issue.ok(R(() => q('.cCtaBox01 .ctaYoyaku'), 6), '酸素カプセルの予約リンク');
    await wait(1200);
    Issue.hide();
    await hoverUi(ya, { kind: 'hand', hold: 1600 });
    await hoverUi(q('.cCtaBox01 .ctaBoxIn .ctaTel'), { kind: 'arrow', ax: 0.5, ay: 0.2, hold: 400 });
    mark('menu');
  });

  /* 3 — はらいろ: the footer note + the search description (All in One SEO) */
  scene('footer', async () => {
    Caption.step(3);
    window.Win11.skipTo('14:26');
    await Win.switchTo('code');
    Caption.set('フッター（footer.php）を右側のタブに合わせる：土曜は 18:00 まで、祝日は要問い合わせ');
    await Code.openFile('harairo/footer.php');
    const n = Code.find('土曜17:00まで').line;
    await Code.reveal(n, 700);
    await Code.overwrite('17', '18', { from: n, kps: 8 });
    await Code.clickAt(n, L()[n].indexOf('</p>'));
    await Code.type([{ direct: '/' }, JA['祝日は要問い合わせ']], { kps: 12 });
    await Code.save();
    check('harairo/footer.php', P['harairo/footer.php'].replace(F.NOTE_BEFORE, F.NOTE_AFTER), 'footer.php');
    await scp('harairo/footer.php', '$h/');
    await wait(300);
    await Win.switchTo('browser');
    TABS.hr.states = [];
    await reloadSite('hr');
    await scrollTo(q('#ftrIn'), 160, 0);
    await wait(300);
    Caption.fixed('フッターの表記がタブと同じに：土曜18:00まで／祝日は要問い合わせ');
    Issue.ok(R(() => SK.noteP(doc()), 4), '土曜18:00まで/祝日は要問い合わせ');
    await readHold(1600);
    await sideTab(true);
    await hoverUi(q('#fixbtn .fixBtnIn img:nth-child(2)'), { hold: 1600 });
    Issue.hide();
    await sideTab(false);
    // the search description: All in One SEO (wp-admin)
    Caption.set('検索結果に出る説明文は、SEO プラグイン All in One SEO の設定：WordPress の管理画面へ');
    await Browser.newTab('wp');
    await Browser.typeUrl('harairo.com/wp/wp-admin/');
    await wpScreen('login', { url: HR + '/wp/wp-login.php?redirect_to=https%3A%2F%2Fharairo.com%2Fwp%2Fwp-admin%2F&reauth=1', ms: 600 });
    // Chrome fills in the saved login (the user name blurred)
    const user = WP.field('user'), pass = WP.field('pass');
    const filled = (box, html) => { box.setAttribute('style', `${box.getAttribute('style')};background-color:#e8f0fe`); box.innerHTML = html; };
    filled(user, '<span style="filter:blur(6px)">harairo-staff</span>');
    filled(pass, '•'.repeat(16));
    await wait(700);
    await clickUi(WP.el('#wp-submit'), { kind: 'hand', after: 60 });
    await wpScreen('dashboard', { ms: 800 });
    await wait(400);
    Caption.set('All in One SEO › 検索の外観 › コンテンツタイプ › 固定ページの説明文');
    await adminMenu('toplevel_page_aioseo', 'page=aioseo-search-appearance');
    const top0 = WP.snapshot.pages['aio-before'].scroll[1];
    WP.doc('aio-before').defaultView.scrollTo(0, 0);
    await wpScreen('aio-before', { ms: 1000 });
    await wait(500);
    await WP.scroll(top0, 1400);
    await hoverUi(descRow().querySelector('.name') || descRow(), { hold: 900 });
    const ed = descEditor();
    const p = ed.querySelector('p') || ed;
    await hoverUi(p, { kind: 'text', ax: 0.5, ay: 0.5, hold: 1200 });
    Caption.set('最後に「酸素カプセルもご利用いただけます。」を追記');
    await clickUi(p, { kind: 'text', ax: 0.97, ay: 0.88, after: 80 });
    await Keycap.show(['Ctrl', 'End'], 450);
    const typed = await typeInto(D.frameTextTarget(p, { base: WD.desc.before }), [JA['酸素カプセルもご利用いただけます。']], { kps: 12 });
    if (WD.desc.before + typed !== WD.desc.after) window.__typeDiff = (window.__typeDiff || []).concat('aioseo');
    await wait(300);
    // the screen as WordPress shows it with the new text (counter, preview), then 変更を保存
    const rowTop = descRow().getBoundingClientRect().top;
    const align = (key) => { const w = WP.doc(key).defaultView; w.scrollTo(0, descRow(key).getBoundingClientRect().top + w.scrollY - rowTop); };
    align('aio-typed');
    await wpScreen('aio-typed', { loading: false, after: 400 });
    const ted = descEditor('aio-typed');
    if (ted) { const c = ted.ownerDocument.createElement('span'); c.className = 'demo-caret'; (ted.querySelector('p') || ted).appendChild(c); }
    await wait(500);
    const sb = saveBtn('aio-typed');
    await clickUi(sb, { kind: 'hand', after: 60 });
    if (ted) ted.querySelectorAll('.demo-caret').forEach((c) => c.remove());
    sb.classList.add('demo-hover');
    await wait(700);
    align('aio-saved');
    await wpScreen('aio-saved', { loading: false, after: 300 });
    Caption.fixed('保存：トップページの説明文（meta description）の最後に酸素カプセルの一文');
    Issue.ok(() => screenRect(descEditor('aio-saved') || descRow('aio-saved')), '説明文');
    await readHold(2400);
    Issue.hide();
    mark('footer');
  });

  /* 4 — へいわじま: the hours (footer.php) */
  scene('hours', async () => {
    Caption.step(4);
    window.Win11.skipTo('14:41');
    await Win.switchTo('code');
    Caption.set('へいわじま整骨院の footer.php：11 月から 19 時以降・土日祝の 12 時以降は予約制');
    const FT = 'heiwajima/footer.php';
    await Code.openFile(FT, { top: 12 });
    const h1 = Code.find('<dd>10-21時</dd>').line;
    await hoverUi(Code.lineEl(h1), { ax: 0.3, hold: 900 });
    await Code.overwrite('10-21時', [{ direct: '10-19' }, JA['時'], { direct: '<br>19-21' }, JA['時は予約制']], { from: h1, kps: 13 });
    await Code.overwrite('9-15時', [{ direct: '9-12' }, JA['時'], { direct: '<br>12-15' }, JA['時は予約制']], { from: h1, kps: 13 });
    await Code.save();
    check(FT, P[FT].replace('<dd>10-21時</dd>', '<dd>10-19時<br>19-21時は予約制</dd>').replace('<dd>9-15時</dd>', '<dd>9-12時<br>12-15時は予約制</dd>'), 'heiwajima footer');
    await Term.run(`$w = "${W_DIR}"`, [], { kps: 26 });
    await scp(FT, '$w/');
    await wait(300);
    await Win.switchTo('browser');
    await toTab('hw');
    TABS.hw.states = ['wAddr'];
    await reloadSite('hw');
    await scrollTo(q('.footer_info_table'), 200, 0);
    await wait(300);
    Caption.fixed('診療時間：平日 10-19時（19-21時は予約制）、土日祝日 9-12時（12-15時は予約制）');
    Issue.ok(R(() => SK.hoursDd(doc())[0].closest('td'), 6), '新しい診療時間');
    await readHold(2400);
    Issue.hide();
    Caption.set('フッターは全ページ共通：料金メニューのページでも同じ表記');
    await Store.scroll(0, 1000);
    const nav = q('.header_nav_link[href$="/menu"]');
    if (nav) await clickUi(nav, { kind: 'hand', after: 60 });
    await navSite('hw', { page: 'heiwajima-menu' });
    await wait(900);
    await scrollTo(q('.footer_info_table'), 200, 1700);
    await hoverUi(SK.hoursDd(doc())[1], { hold: 1500 });
    mark('hours');
  });

  /* 5 — smartphone width: へいわじま's address (mistake 2: br-sp), はらいろ's link (mistake 3: no tablet / smartphone rules) */
  scene('sp', async () => {
    Caption.step(5);
    window.Win11.skipTo('14:48');
    Caption.set('スマホの幅で確認：Chrome のデベロッパーツール（デバイスモード・幅 390px）');
    await Keycap.show(['F12'], 500);
    await DevTools.open(true);
    await deviceMode(true);
    await scrollTo(q('.footer_info_table'), 140, 1600);
    await wait(400);
    Caption.issue('表示崩れ', '住所が「…巳の丸ビ／ル」と、ビル名の途中で折り返している');
    Issue.show(R(() => SK.addrTd(doc()), 4), '途中で折り返し');
    await wait(2400);
    Issue.hide();
    // the line break
    const FT = 'heiwajima/footer.php';
    await Win.switchTo('code');
    await Code.openFile(FT);
    const al = Code.find('６丁目').line;
    Caption.set('「丁目」のあとに、スマホのときだけの改行を入れる');
    await Code.clickAt(al, L()[al].indexOf('丁目') + 2);
    await Code.type([{ direct: '<br class="br-sp">' }], { kps: 13 });
    await Code.save();
    await again(`scp ${FT} "$w/"`, [450, scpOut(FT)]);
    await Win.switchTo('browser');
    TABS.hw.states = ['wTypo'];
    await reloadSite('hw');
    await scrollTo(q('.footer_info_table'), 140, 0);
    Caption.set('スマホでは「６丁目」のあとで改行された');
    await hoverUi(SK.addrTd(doc()), { ax: 0.4, hold: 1300 });
    Caption.set('PC の表示も確認');
    await deviceMode(false);
    await scrollTo(q('.footer_info_table'), 200, 0);
    await wait(500);
    Caption.issue('改行の誤り', 'PC でも「丁目」のあとで改行されている（PC は 1 行のはず）');
    Issue.show(R(() => SK.addrTd(doc()), 4), 'PC でも改行');
    await wait(2300);
    Issue.hide();
    await Win.switchTo('code');
    await Code.openFile('heiwajima/style.css', { top: 0 });
    const bl = Code.find('.br_sp {').line;
    await Code.reveal(bl + 6, 900);
    Caption.set('原因：テーマのクラスは br_sp（アンダースコア）。br-sp は CSS がなく常に改行');
    Issue.show(linesRect(bl, bl + 2, 420), '.br_sp は PC で非表示', { below: true });
    await wait(2600);
    Issue.hide();
    await Code.openFile(FT);
    await Code.overwrite('br-sp', '_', { from: al, offset: 2, len: 1, kps: 8 });
    await Code.save();
    check(FT, P[FT].replace('<dd>10-21時</dd>', '<dd>10-19時<br>19-21時は予約制</dd>').replace('<dd>9-15時</dd>', '<dd>9-12時<br>12-15時は予約制</dd>').replace(F.ADDR_BEFORE, F.ADDR_AFTER), 'heiwajima address');
    await again(`scp ${FT} "$w/"`, [450, scpOut(FT)]);
    await Win.switchTo('browser');
    TABS.hw.states = [];
    await reloadSite('hw');
    await scrollTo(q('.footer_info_table'), 200, 0);
    Caption.fixed('PC は 1 行のまま、スマホだけ「丁目」のあとで改行（テーマの br_sp クラス）');
    Issue.ok(R(() => SK.addrTd(doc()), 4), 'PC：1 行');
    await readHold(1700);
    Issue.hide();
    await deviceMode(true);
    await scrollTo(q('.footer_info_table'), 140, 0);
    Issue.ok(R(() => SK.addrTd(doc()), 4), 'スマホ：丁目のあとで改行');
    await readHold(1700);
    Issue.hide();
    // はらいろ at 390px
    Caption.set('はらいろ整骨院もスマホの幅で確認：予約案内（緑の枠）');
    TABS.hr.states = ['hNoSp'];
    await toTab('hr');
    await scrollTo(q('.cCtaBox01 .ctaLine'), 130, 1700);
    await wait(400);
    Caption.issue('表示崩れ', 'リンクが右にずれ、上に大きな余白：PC 用のスタイルがスマホにもかかっている');
    Issue.show(R(() => q('.cCtaBox01 .ctaYoyaku'), 4), 'PC のスタイルのまま');
    await wait(2600);
    Issue.hide();
    const CSS = 'harairo/common/css/base.css';
    await Win.switchTo('code');
    await Code.openFile(CSS);
    Caption.set('タブレット（768〜1239px）とスマホ（767px 以下）のメディアクエリにも ctaYoyaku を追加');
    const tb = F.CTA_AT.tb - 1;
    await Code.reveal(tb, 900);
    await Code.newLineAfter(tb);
    await Code.type(code(F.CTA_TB, { after: L()[tb] }), { kps: 30 });
    const sp = F.CTA_AT.sp - 1;
    await Code.reveal(sp, 900);
    Caption.set('スマホ：枠いっぱいに中央揃え、上下の余白 20px、文字 16px');
    await Code.newLineAfter(sp);
    await Code.type(code(F.CTA_SP, { after: L()[sp] }), { kps: 30 });
    await Code.save();
    check(CSS, F.BASE_LIVE, 'base.css (tablet / smartphone)');
    await scp(CSS, '$h/common/css/');
    await wait(300);
    await Win.switchTo('browser');
    TABS.hr.states = [];
    await reloadSite('hr');
    await scrollTo(q('.cCtaBox01 .ctaLine'), 130, 0);
    Caption.fixed('スマホでは LINE・電話の下に、中央揃えで「酸素カプセルのご予約はこちら」');
    Issue.ok(R(() => q('.cCtaBox01 .ctaYoyaku'), 4), 'スマホ：中央揃え');
    await readHold(2200);
    Issue.hide();
    await deviceMode(false);
    await Keycap.show(['F12'], 400);
    await DevTools.open(false);
    mark('sp');
  });

  /* 6 — both live sites */
  scene('live', async () => {
    Caption.allDone();
    window.Win11.skipTo('14:58');
    Caption.set('公開中のサイトで最終確認：はらいろ整骨院（harairo.com）');
    await Browser.reload(async () => { await loadSite('hr'); }, { key: 'F5' });
    Store.win(false).scrollTo(0, 0);
    await wait(1000);
    await scrollTo(q('.cCtaBox01'), 220, 1700);
    await hoverUi(q('.cCtaBox01 .ctaYoyaku a'), { kind: 'hand', hold: 1200 });
    await scrollTo(q('#topMenu .inner'), 200, 1500);
    await hoverUi(SK.item10(doc()), { kind: 'arrow', hold: 1300 });
    await scrollTo(q('#ftrIn'), 160, 1600);
    await hoverUi(SK.noteP(doc()), { hold: 1300 });
    Caption.set('へいわじま整骨院（heiwajima-seikotsuin.com）：診療時間と住所');
    await toTab('hw');
    await scrollTo(q('.footer_info_table'), 200, 1200);
    await hoverUi(SK.hoursDd(doc())[0], { hold: 1100 });
    await hoverUi(SK.addrTd(doc()), { ax: 0.4, hold: 1100 });
    Caption.set('スマホの幅でも：住所は「丁目」のあとで改行、予約案内のリンクは中央に');
    await Keycap.show(['F12'], 400);
    await DevTools.open(true);
    await deviceMode(true);
    await scrollTo(q('.footer_info_table'), 140, 1200);
    await hoverUi(SK.addrTd(doc()), { ax: 0.4, hold: 1600 });
    await toTab('hr');
    await scrollTo(q('.cCtaBox01 .ctaLine'), 130, 1300);
    await hoverUi(q('.cCtaBox01 .ctaYoyaku a'), { kind: 'hand', hold: 1300 });
    await scrollTo(q('#topMenu .inner'), 130, 1500);
    await wait(1200);
    await deviceMode(false);
    await Keycap.show(['F12'], 400);
    await DevTools.open(false);
    Store.win(false).scrollTo(0, 0);
    Caption.set('2 つの整骨院サイトの修正依頼 6 件が完了：HTML・CSS（スマホ含む）・SEO の説明文');
    await wait(4500);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['harairo', 'heiwajima', 'heiwajima-menu'],
    fontText: JSON.stringify(JA) + P['requests/2026-10-30.md'] + WD.desc.after + Object.keys(URL).map(titleOf).join(''),
    async prepare() {
      const H = 'harairo/', W = 'heiwajima/';
      const icons = Array.from({ length: 10 }, (_, i) => [`${H}common/images/menu/ico_menu_${String(i + 1).padStart(2, '0')}.svg`]);
      const tree = [
        ['harairo', 'dir', 1], [H + 'common', 'dir', 1], [H + 'common/css', 'dir', 1], [H + 'common/css/base.css'], [H + 'common/css/edit.css'],
        [H + 'common/images', 'dir', 0], [H + 'common/images/menu', 'dir', 0], ...icons, [H + 'common/images/cta_flow.svg'], [H + 'common/images/ftr_cal.svg'],
        [H + 'parts', 'dir', 0], [H + 'parts/fixbtn.php'], [H + 'parts/top-about.php'], [H + 'parts/top-faq.php'], [H + 'parts/top-mainvisual.php'], [H + 'parts/top-topics.php'],
        [H + 'footer.php'], [H + 'front-page.php'], [H + 'functions.php'], [H + 'header.php'], [H + 'index.php'], [H + 'page.php'], [H + 'style.css'],
        ['heiwajima', 'dir', 1], [W + 'images', 'dir', 0], [W + 'template-parts', 'dir', 0], [W + 'template-parts/footer-nav.php'], [W + 'template-parts/map.php'],
        [W + 'footer.php'], [W + 'front-page.php'], [W + 'functions.php'], [W + 'header.php'], [W + 'style.css'],
        ['requests', 'dir', 1], ['requests/2026-10-30.md'],
      ];
      Code.init(P, tree);
      Object.keys(P).filter((p) => /\.php$/.test(p)).forEach((p) => { Code.files[p].indent = '\t'; });
      Code.status[H + 'common/images/menu/ico_menu_10.svg'] = 'U';
      Code.show('requests/2026-10-30.md', { top: 0 });
      Code.renderTree();
      Code.gitBadge();
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'hr', title: titleOf('harairo'), url: URL.harairo, page: 'store', fav: 'harairo' });
      Browser.addTab({ id: 'hw', title: titleOf('heiwajima'), url: URL.heiwajima, page: 'store', fav: 'heiwajima' }, { activate: false });
      Browser.activate('hr');
      await loadSite('hr');
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      Object.keys(window.WP_SNAPSHOT.pages).forEach((k) => {
        const d = WP.doc(k);
        if (!d) return;
        const s = d.createElement('style');
        s.textContent = '#wp-admin-bar-my-account .display-name, #wp-admin-bar-user-info .display-name, #wp-admin-bar-user-info .username { filter: blur(5px); }';
        d.head.appendChild(s);
      });
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
