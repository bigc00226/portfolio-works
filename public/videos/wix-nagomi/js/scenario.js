/*
 * Timeline: Nagomi Nature Connections (www.nagomi-nc.com) — a service-introduction site in the Wix editor whose pages
 * all lead to one booking request form (not a single landing page):
 * site menu (tour pages under ツアー紹介) -> main visual slideshow + photos -> the programmes (home + SUP page, its
 * 「リクエスト予約する」 buttons) -> features / Q&A / blog / news -> the booking request form (a tour option, the
 * auto-reply) and the booking path checked in preview -> the mobile site -> publish -> the live site, from a plan to the form.
 * The editor is rebuilt (shared/wix/wix.js); every page on its canvas and the live site are the real ones (captured).
 * Nothing is sent: the form is only looked at, never submitted.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, X = window.Wix, NG = window.NG, S = window.SITE_SNAPSHOT;
  const { $, $$, wait, tween, Ease, Cursor, Caption, Issue, KeyStrip, Win, typeInto, fieldTarget, clickUi, hoverUi, moveToEl } = D;
  const { Browser, Store, FileDialog } = K;
  const LIVE = 'https://www.nagomi-nc.com';
  const V = window.VIDEO;

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'SUP体験': [{ direct: 'SUP' }, { r: 'taikenn', segs: ['体験'] }],
    '西湖SUPレンタル': [{ r: 'saiko', segs: [{ c: ['最高', '西湖', '再考'], p: 1 }], candHold: 300 }, { direct: 'SUP' }, { r: 'renntaru', segs: ['レンタル'] }],
    '予約リクエストありがとうございます。空き状況を確認のうえ、担当者より改めてご連絡いたします。': [
      { r: 'yoyakurikuesutoarigatougozaimasu.', segs: ['予約', 'リクエスト', 'ありがとうございます。'] },
      { r: 'akijoukyouwokakuninnnoue,', segs: ['空き状況を', '確認のうえ、'] },
      { r: 'tanntoushayoriaratametegorennrakuitashimasu.', segs: ['担当者より', '改めて', 'ご連絡', 'いたします。'] }],
  };
  JA['富士山が見える'] = [{ r: 'fujisanngamieru', segs: ['富士山が', '見える'] }];
  JA['カヤック体験ツアー'] = [{ r: 'kayakkutaikenntua-', segs: ['カヤック', '体験', 'ツアー'] }];
  JA['予約リクエスト送信する'] = [{ r: 'yoyakurikuesutosoushinnsuru', segs: ['予約', 'リクエスト', '送信する'] }];
  JA['予約リクエストフォーム'] = [{ r: 'yoyakurikuesutofo-mu', segs: ['予約', 'リクエスト', 'フォーム'] }];
  const AUTO = '予約リクエストありがとうございます。空き状況を確認のうえ、担当者より改めてご連絡いたします。';

  /* ------------------------------------------------ the site (captured DOM) */
  const SEC = ['comp-lonxwqot', 'comp-lonxwqou', 'comp-lonxwqou1', 'comp-lonxwqov', 'comp-lonxwqow', 'comp-mdgv7ybt', 'comp-lonxwqoy', 'comp-lonxwqp0', 'comp-lonxwqp1'];
  const sec = (i, doc) => (doc || X.cur()).querySelector('#' + SEC[i]);
  const CTA = '#comp-mdgv7ybt';
  const SLIDES = '#comp-kxsyma61';
  const PAGE = { home: 'TOP', sup: 'SUP体験', kayak: 'カヤック体験', qa: 'Q&A', blog: 'おおさん日記', contact: '予約リクエストフォーム' };
  const TITLE = {};
  Object.keys(PAGE).forEach((k) => { TITLE[k] = ((S.pages[k].pc || '').match(/<title[^>]*>([^<]*)/) || [])[1] || S.title; });
  const URL = (k) => LIVE + V.snapshot.pages[k];

  /* ------------------------------------------------ helpers */
  const imgOf = (sel, doc = X.doc) => { const i = doc && doc.querySelector(sel); return i ? i.getAttribute('src') : ''; };
  const fd = (pick) => ({
    folder: ['PC', 'ピクチャ', 'Nagomi', 'サイト用写真'], filter: '画像ファイル (*.jpg;*.png;*.webp)', pick,
    files: [['main_motosuko_kayak.jpg', '3.1 MB'], ['main_saiko_sup.jpg', '2.8 MB'], ['main_fuji_sunset.jpg', '2.6 MB'], ['tile_about.jpg', '1.2 MB'], ['tile_question.jpg', '1.1 MB'], ['tile_blog.jpg', '1.3 MB']]
      .map(([name, size]) => ({ name, size, type: 'JPG ファイル', date: '2026/11/09 18:40' })),
  });
  let MEDIA = [];
  /** a link on the canvas (exact text, drawn) */
  const linkByText = (t, root) => [...(root || X.cur()).querySelectorAll('a')].find((a) => a.textContent.replace(/\s+/g, '') === t && a.getBoundingClientRect().width > 0);
  async function typeCanvas(el, script, o = {}) {
    await clickUi(el, { dbl: true, kind: 'text', after: 120 });
    if (o.empty) { el.dataset.demoText = el.innerHTML; el.innerHTML = ''; }
    const t = X.textTarget(el);
    await typeInto(t.target, script, { kps: o.kps || 10 });
    t.restore();
    Cursor.kind('arrow');
  }
  async function navTour() {
    const NAVROLE = { 'TOP': '入口', 'NNCの紹介': '会社とガイドの紹介', 'ツアー紹介': 'プログラムごとのページ', 'Q&A': '不安の解消', 'おおさん日記': 'ブログ', '予約リクエストフォーム': 'ゴール' };
    const navs = [...X.doc.querySelectorAll('li a, li [data-testid="linkElement"]')].filter((x) => NAVROLE[x.textContent.replace(/\s+/g, '').replace('Ｑ', 'Q')] && x.getBoundingClientRect().width > 0);
    const seen = new Set();
    for (const n of navs) {
      const k = n.textContent.replace(/\s+/g, '');
      if (seen.has(k)) continue;
      seen.add(k);
      Caption.set(`メニュー「${k}」：${NAVROLE[k]}`);
      X.hover(n);
      await hoverUi(n, { hold: 650 });
    }
    X.hover(null);
  }
  /** the editor's page selector → another page on the canvas */
  async function goPage(key, o = {}) {
    await clickUi('#wxPageSel', { after: 120 });
    $('#wxPageSel').classList.add('open');
    X.ctx(['home', 'sup', 'kayak', 'qa', 'blog', 'contact'].map((k) => ({ t: PAGE[k], id: 'go-' + k })), $('#wxPageSel'));
    await wait(450);
    await clickUi('#go-' + key, { after: 60 });
    X.ctxOff();
    $('#wxPageSel').classList.remove('open');
    await show(key, o);
  }
  async function show(key, o = {}) {
    X.page(PAGE[key]);
    Browser.loading('wx', true);
    await X.load(key, { states: ['future', ...(o.states || [])] });
    Browser.loading('wx', false);
    await wait(o.after != null ? o.after : 500);
  }
  /** the link panel of a button: pick a page from the list */
  async function linkTo(btn, pick, o = {}) {
    X.select(btn.closest('[data-testid="linkElement"]') ? btn : btn, 'ボタン', { bar: X.barHtml([{ b: 'テキストを変更' }, { c: 'link', id: 'barLink' }, { c: 'gear' }]) });
    await clickUi(btn, { after: 150 });
    await clickUi('#barLink', { after: 150 });
    X.panel('リンク先', NG.link({ page: o.from || '' }), { right: true, foot: '<span class="wx-btn pri" id="lkOk">完了</span>' });
    await wait(500);
    await clickUi('#lkPage', { after: 120 });
    X.panelBody(NG.link({ focus: true, page: o.from || '', list: ['TOP', 'NNCの紹介', 'カヤック体験', 'SUP体験', 'Q&A', '予約リクエストフォーム', 'おおさん日記'] }));
    await wait(500);
    await clickUi(`#lkList [data-lk="${pick}"]`, { after: 100 });
    X.panelBody(NG.link({ page: pick }));
    await wait(450);
    await clickUi('#lkOk', { after: 100 });
    await X.closePanel({ click: false });
    X.toast('リンクを設定しました');
    X.unselect();
  }
  /** preview: the page as visitors see it, the editor's bars gone */
  async function preview(key) {
    await clickUi('#wxPreview', { after: 100 });
    await show(key, { after: 200 });
    X.preview(true);
    await wait(900);
  }
  async function backToEditor() {
    await clickUi('#wxBack', { after: 120 });
    X.preview(false);
    await wait(400);
  }
  /** a link in the live site */
  async function liveGo(a, key) {
    if (a) await clickUi(a, { kind: 'hand', after: 80 });
    Cursor.kind('arrow');
    Browser.nav('live', { url: URL(key), title: TITLE[key] });
    Browser.loading('live', true);
    await Store.load(key, { states: ['future', 'noEmbeds'] });
    Browser.loading('live', false);
    await wait(900);
  }

  /* ---------------------------------------------- pages & menu */
  const LIST = [
    { n: 'TOP', home: true, on: true }, { n: 'NNCの紹介' }, { n: 'ツアー紹介' },
    { n: 'カヤック体験', sub: true }, { n: '樹海・洞窟探検', sub: true }, { n: '富士下山', sub: true }, { n: '学校・企業向け団体ツアー', sub: true },
    { n: 'Q&A' }, { n: 'おおさん日記' }, { n: '予約リクエストフォーム' },
  ];
  const showPages = () => X.panelBody(NG.pages(LIST, { note: 'ヘッダーの「ツアー紹介」にはサブページがドロップダウンで並びます。' }));
  const rowOf = (n) => $(`.wx-pg[data-pg="${n}"]`);

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — site menu: a service site, the tour pages under ツアー紹介, everything leading to the request form */
  scene('menu', async () => {
    Caption.step(1);
    Caption.set('1 枚の LP ではなく、ツアーごとのページ → 予約リクエストフォームへつなぐサービス紹介サイト');
    await hoverUi(X.q('#SITE_HEADER') || X.doc.body, { hold: 900 });
    Caption.set('1 枚の LP ではなく、ツアーごとのページ → 予約リクエストフォームへつなぐサービス紹介サイト');
    await wait(1200);
    await clickUi('.wx-tool[data-tool="pages"]', { after: 80 });
    X.tool('pages');
    X.panel('ページとメニュー', '');
    showPages();
    await wait(3000);
    Caption.set('ツアー紹介にサブページ「SUP体験」を追加');
    await clickUi('#pgAdd', { after: 120 });
    LIST.push({ n: '', edit: 'pgEd' });
    showPages();
    const name = await typeInto(fieldTarget($('#pgEd')), JA['SUP体験'], { kps: 12, keepStrip: true });
    KeyStrip.special('Enter');
    KeyStrip.idleHide(500);
    const p = LIST[LIST.length - 1];
    delete p.edit; p.n = name; p.new = true;
    showPages(); p.new = false;
    await wait(400);
    // "サブページにする" makes it a subpage of the row above it — which is 予約リクエストフォーム
    const row = rowOf(name);
    await hoverUi(row, { hold: 200 });
    await clickUi($('.dots', row), { after: 120 });
    X.ctx([{ t: '設定', ic: 'gear' }, { t: '名前を変更', ic: 'text' }, { t: 'サブページにする', ic: 'sub', id: 'ctxSub' }, '-', { t: 'メニューに表示しない', ic: 'eye' }], $('.dots', row));
    await wait(400);
    await clickUi('#ctxSub', { after: 60 });
    X.ctxOff();
    p.sub = true;
    showPages();
    await wait(500);
    Issue.show(() => rowOf(name), '親ページの違い', { below: true });
    Caption.issue('構成ミス', '「SUP体験」が「予約リクエストフォーム」のサブページに入ってしまった（ツアー紹介に出ない）');
    await wait(2600);
    // drag it up under カヤック体験
    const from = rowOf(name), to = rowOf('樹海・洞窟探検');
    await moveToEl(from, { ax: 0.3 });
    Cursor.press();
    from.classList.add('drag');
    const y0 = from.getBoundingClientRect().top, dy = to.getBoundingClientRect().top - y0;
    const cx = Cursor.x, cy = Cursor.y;
    await tween(1100, (e) => { from.style.transform = `translateY(${dy * e}px)`; Cursor.x = cx; Cursor.y = cy + dy * e; Cursor.render(); }, Ease.inOut);
    Cursor.release();
    LIST.splice(LIST.indexOf(p), 1);
    LIST.splice(LIST.findIndex((x) => x.n === 'カヤック体験') + 1, 0, p);
    showPages();
    Issue.ok(() => rowOf(name), 'ツアー紹介の下に', { below: true });
    Caption.fixed('ドラッグでカヤック体験の下へ：ヘッダーの「ツアー紹介」のドロップダウンに並ぶ');
    await wait(2000);
    Issue.hide();
    await X.closePanel();
  });

  /* 2 — main visual (slideshow) + the photos */
  scene('visual', async () => {
    Caption.step(2);
    Caption.set('メインビジュアル：スライドショーに湖と富士山の写真（自動で切り替え）');
    const slides = X.q(SLIDES);
    X.select(slides, 'スライドショー', { bar: X.barHtml([{ b: 'スライドを管理', id: 'barSlides' }, { c: 'gear' }, { c: 'layers' }]) });
    await clickUi(slides, { after: 150, ay: 0.3 });
    await clickUi('#barSlides', { after: 150 });
    X.panel('スライドを管理', NG.slides(0), { right: true, foot: '<span class="wx-btn" id="slAdd">＋ 画像を追加</span>' });
    await wait(700);
    await clickUi('#slAdd', { after: 150 });
    X.panel('メディアの選択', NG.media(MEDIA), { wide: true, foot: NG.mediaFoot('スライドに追加') });
    await wait(500);
    const pics = [imgOf(`${SLIDES} img`), imgOf('#comp-lonxwqow img') || imgOf('#comp-lonxwqou1 img'), imgOf('#comp-lonxwqou1 img')];
    const names = ['main_motosuko_kayak.jpg', 'main_saiko_sup.jpg', 'main_fuji_sunset.jpg'];
    for (let i = 0; i < 3; i++) {
      await clickUi('#mdUpload', { after: 100 });
      await FileDialog.pick(fd(names[i]));
      MEDIA = [{ src: pics[i], name: names[i] }, ...MEDIA];
      X.panelBody(NG.media(MEDIA, { up: 0 }));
      const up = $('.wx-media .up');
      await tween(800, (e) => up && up.style.setProperty('--p', Math.round(e * 100) + '%'));
      X.panelBody(NG.media(MEDIA, {}));
      await wait(300);
    }
    for (let i = 0; i < 3; i++) { await clickUi($$('.wx-media > div')[i], { after: 80 }); X.panelBody(NG.media(MEDIA, { on: [0, 1, 2].slice(0, i + 1) })); }
    await wait(400);
    await clickUi('#mdPick', { after: 120 });
    $('#wxPanel').classList.remove('on');
    X.panel('スライドを管理', NG.slides(3), { right: true });
    $('#slList').innerHTML = MEDIA.slice().reverse().map((m) => `<div style="background-image:url('${m.src}')"></div>`).join('');
    X.state('heroNoImg', false);
    await wait(1600);
    await X.closePanel();
    X.select(slides, 'スライドショー');
    await wait(900);
    Caption.set('キャッチコピー：「富士山が見える／カヤック体験ツアー」（「が」「える」は小さく）');
    const h1 = X.q('#comp-kzz30o5e h1');
    if (h1) {
      X.select(X.q('#comp-kzz30o5e'), 'テキスト', { bar: X.barHtml([{ b: 'テキストを編集' }, { c: 'gear' }]) });
      await typeCanvas(h1, [...JA['富士山が見える'], { key: 'Enter' }, ...JA['カヤック体験ツアー']], { empty: true });
      X.select(X.q('#comp-kzz30o5e'), 'テキスト');
      await wait(1200);
    }
    Caption.set('下に「公式ホームページからの予約がお得です」の帯：予約の詳細へのリンク');
    X.reveal(sec(1));
    await X.scrollToEl(sec(1), 140, 1300);
    const band = linkByText('＞＞詳細について') || [...sec(1).querySelectorAll('span')].find((s) => /公式ホームページからの予約/.test(s.textContent));
    if (band) { X.select(band.closest('a') || band, 'リンク'); await hoverUi(band, { hold: 1500 }); }
    X.unselect();
    Caption.set('写真のタイル（ABOUT・QUESTION・BLOG）：各ページへの入口');
    X.reveal(sec(2));
    await X.scrollToEl(sec(2), 60, 1300);
    const tiles = [...sec(2).querySelectorAll('a')].filter((a) => a.getBoundingClientRect().width > 0);
    for (const t of tiles.slice(0, 3)) { X.hover(t); await hoverUi(t, { hold: 1100 }); }
    X.hover(null);
    await X.save();
  });

  /* 3 — the programmes: home section, the SUP page and its booking buttons */
  scene('programs', async () => {
    Caption.step(3);
    Caption.set('ツアー体験プログラム：カヤック・SUP・樹海探検・富士下山の入口');
    X.reveal(sec(4));
    await X.scrollToEl(sec(4), 40, 1300);
    X.select(sec(4), 'セクション：体験プログラム', { sec: true });
    await wait(1600);
    X.unselect();
    Caption.set('SUP体験のページ：プラン（早朝・午前・午後・サンセット）ごとに料金・集合時間と予約ボタン');
    await goPage('sup');
    await X.scroll(X.yOf(X.q('#comp-lonxwqpe'), -260), 1600);
    await wait(800);
    const price = [...X.q('#comp-lonxwqpe').querySelectorAll('span')].find((e) => e.children.length === 0 && e.textContent.trim() === '7,480' && e.getBoundingClientRect().width > 0);
    if (price) {
      await X.scrollToEl(price, 360, 900);
      Caption.set('早朝プラン：料金・所要時間・集合時間（料金は 2026 年の料金表のとおり）');
      X.select(price.closest('[data-testid="richTextElement"]') || price, 'テキスト');
      await typeCanvas(price, [{ direct: '7,480' }], { empty: true, kps: 9 });
      await wait(700);
      X.unselect();
    }
    const btns = [...X.q('#comp-lonxwqpe').querySelectorAll('a')].filter((a) => /リクエスト予約する/.test(a.textContent) && a.getBoundingClientRect().width > 0);
    await X.scrollToEl(btns[0], 420, 900);
    Caption.set('「リクエスト予約する」を予約リクエストフォームにリンク');
    // the first one: Q&A, the row right above 予約リクエストフォーム, gets the click (noticed only later, in preview)
    await linkTo(btns[0], 'Q&A');
    await X.scrollToEl(btns[1], 420, 900);
    await linkTo(btns[1], '予約リクエストフォーム');
    Caption.set('午後・サンセット・レンタルの予約ボタンも同じリンク');
    await X.scroll(X.yOf(btns[3], 420), 1300);
    await hoverUi(btns[3], { hold: 900 });
    Caption.set('カヤック体験のページ：西湖・本栖湖・レンタルの各プランの予約ボタンも同じフォームへ');
    await goPage('kayak');
    const kb = [...X.q('#comp-lonxwqre').querySelectorAll('a')].filter((a) => /リクエスト予約する/.test(a.textContent) && a.getBoundingClientRect().width > 0);
    if (kb[0]) { await X.scrollToEl(kb[0], 420, 1500); await linkTo(kb[0], '予約リクエストフォーム'); }
    if (kb[1]) { await X.scrollToEl(kb[1], 420, 1300); await linkTo(kb[1], '予約リクエストフォーム'); }
    if (kb[2]) { await X.scroll(X.yOf(kb[2], 420), 1300); await hoverUi(kb[2], { hold: 800 }); }
    await X.save();
  });

  /* 4 — features, FAQ, blog / news */
  scene('content', async () => {
    Caption.step(4);
    Caption.set('トップページ：特徴の文章・お知らせ（ブログの新着が自動で並ぶ）・Q&A・掲載実績・SNS');
    await goPage('home', { states: ['homeRest'] });
    await X.scrollToEl(sec(1), 40, 1100);
    await wait(500);
    for (const i of [3, 6, 7, 8]) X.reveal(sec(i));
    X.reveal(X.q('#SITE_FOOTER'));
    Caption.set('サイト共通のメニュー：どのページからも「予約リクエストフォーム」へ');
    await navTour();
    await X.scrollToEl(sec(3), 30, 1400);
    X.select(sec(3), 'ブログ：最新の投稿', { sec: true, bar: X.barHtml([{ b: '表示を設定', id: 'barBlog' }, { c: 'gear' }]) });
    await clickUi('#barBlog', { after: 150 });
    X.panel('最新の投稿の設定', '<div class="wx-sf"><label>表示する投稿</label><div class="wx-opt"><span class="on">最新の投稿</span><span>カテゴリ</span><span>注目の投稿</span></div></div>'
      + '<div class="wx-sf"><label>表示する件数</label><div class="wx-in"><span class="v">7</span></div></div>'
      + '<div class="lo-sw-row" id="blDate">公開日を表示<span class="wx-tg"><span class="sw"></span></span></div>'
      + '<div class="lo-sw-row">「記事を読む」ボタン<span class="wx-tg"><span class="sw on"></span></span></div>', { right: true });
    await wait(700);
    await clickUi('#blDate .sw', { after: 120 });
    $('#blDate .sw').classList.add('on');
    Caption.set('お知らせはブログ（おおさん日記）の最新 7 件を日付つきで表示：ブログを書けばトップも更新');
    await wait(1600);
    await X.closePanel();
    X.unselect();
    await X.scrollToEl(sec(6), 120, 1300);
    await wait(900);
    Caption.set('よくあるご質問（Q&A）のページ：集合場所・持ち物・天候・キャンセル');
    await goPage('qa');
    const hq = X.doc.documentElement.scrollHeight;
    for (const k of [0.12, 0.24, 0.36, 0.5]) { await X.scroll(hq * k, 1400); await wait(1000); }
    Caption.set('ブログ（おおさん日記）：ツアーの様子やお知らせを更新');
    await goPage('blog');
    await X.scroll(500, 1400);
    await wait(1000);
    await X.scroll(1300, 1600);
    await wait(1200);
  });

  /* 5 — the booking request form and the booking path */
  scene('booking', async () => {
    Caption.step(5);
    Caption.set('予約リクエストフォーム：送信 → 空き状況を確認 → 担当者から連絡して予約確定');
    await goPage('contact');
    await wait(1500);
    const form = X.q('form');
    await X.scrollToEl(form, 60, 1100);
    X.select(form, 'フォーム', { bar: X.barHtml([{ b: 'フォームを編集', id: 'barForm' }, { c: 'gear' }, { c: 'layers' }]) });
    await clickUi(form, { after: 150, ay: 0.15 });
    await clickUi('#barForm', { after: 150 });
    X.panel('フォームの設定', NG.form({ tab: 'fields' }), { right: true });
    await wait(800);
    await clickUi('#fmF4', { after: 150 });
    X.panelBody(NG.form({ tab: 'fields', on: 4 }) + '<div class="wx-sf"><label>入力の種類</label><div class="wx-opt"><span>テキスト</span><span class="on">数字</span></div></div>'
      + '<div class="wx-sf"><label>最小値</label><div class="wx-in" id="fmMin"><span class="v"></span><span class="ph">なし</span></div></div>');
    Caption.set('参加人数は数字だけ・1 人以上（人数がわからないリクエストを防ぐ）');
    await wait(600);
    const mn = $('#fmMin');
    await clickUi(mn, { kind: 'text', after: 80 });
    mn.classList.add('focus');
    await typeInto(fieldTarget(mn), [{ direct: '1' }], { kps: 8 });
    mn.classList.remove('focus');
    Cursor.kind('arrow');
    await wait(900);
    await clickUi('#fmF0', { after: 150 });
    X.panelBody(NG.form({ tab: 'fields', field: 0 }));
    Caption.set('参加希望のツアーに「西湖SUPレンタル」の選択肢を追加');
    await wait(800);
    await clickUi('#fmAddOpt', { after: 120 });
    X.panelBody(NG.form({ tab: 'fields', field: 0, editing: true }));
    await typeInto(fieldTarget($('#fmNewOpt')), JA['西湖SUPレンタル'], { kps: 12 });
    X.panelBody(NG.form({ tab: 'fields', field: 0, added: true }));
    await wait(900);
    await clickUi($$('#wxPanelBody .wx-pg-tabs span')[1], { after: 150 });
    X.panelBody(NG.form({ tab: 'after' }));
    Caption.set('送信したお客様へ自動返信：「まだ予約確定ではない」ことを伝える');
    await wait(700);
    await clickUi('#fmAuto .sw', { after: 150 });
    X.panelBody(NG.form({ tab: 'after', auto: true }));
    await wait(500);
    const body = $('#fmAutoBody');
    await clickUi(body, { kind: 'text', after: 100 });
    body.classList.add('focus');
    await typeInto(fieldTarget(body), JA[AUTO], { kps: 14 });
    X.panelBody(NG.form({ tab: 'after', auto: true, body: AUTO }));
    Cursor.kind('arrow');
    await wait(900);
    await X.closePanel();
    X.unselect();
    const submit = X.q('#comp-kz6la6o8 button span');
    if (submit) {
      await X.scrollToEl(submit, 520, 1200);
      Caption.set('送信ボタンは「予約リクエスト送信する」：送信＝予約確定ではないことが伝わる文言に');
      X.select(X.q('#comp-kz6la6o8'), 'ボタン', { bar: X.barHtml([{ b: 'テキストを変更' }, { c: 'gear' }]) });
      await typeCanvas(submit, JA['予約リクエスト送信する'], { empty: true });
      await wait(900);
      X.unselect();
    }

    Caption.set('プレビューで予約導線を確認：SUP のプランから予約リクエストフォームへ');
    await preview('sup');
    const btn = () => [...X.q('#comp-lonxwqpe').querySelectorAll('a')].find((a) => /リクエスト予約する/.test(a.textContent) && a.getBoundingClientRect().width > 0);
    await X.scrollToEl(btn(), 420, 1300);
    await clickUi(btn(), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    await show('qa', { after: 600 });
    X.preview(true);
    Issue.show(() => X.q('#comp-lonxwqq5'), '行き先が Q&A');
    Caption.issue('リンクミス', '早朝プランの「リクエスト予約する」が Q&A に飛んでしまう（予約フォームに届かない）');
    await wait(2600);
    Issue.hide();
    await backToEditor();
    await goPage('sup');
    await X.scrollToEl(btn(), 420, 1000);
    await linkTo(btn(), '予約リクエストフォーム', { from: 'Q&A' });
    await preview('sup');
    await X.scrollToEl(btn(), 420, 1000);
    await clickUi(btn(), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    await show('contact', { after: 600 });
    X.preview(true);
    Issue.ok(() => X.q('form'), '予約フォームへ');
    Caption.fixed('リンク先を「予約リクエストフォーム」に直して、もう一度プレビュー：フォームが開いた');
    await wait(2200);
    Issue.hide();
    Caption.set('トップページの「予約リクエストフォームはこちら」からも確認');
    await show('home', { after: 300, states: ['noEmbeds'] });
    X.preview(true);
    const cta = [...X.q(CTA).querySelectorAll('a')].find((x) => x.getBoundingClientRect().width > 0);
    if (cta) {
      await X.scrollToEl(cta, 520, 2000);
      await clickUi(cta, { kind: 'hand', after: 120 });
      Cursor.kind('arrow');
      await show('contact', { after: 900 });
      X.preview(true);
    }
    await backToEditor();
    await X.save();
  });

  /* 6 — the mobile site */
  scene('mobile', async () => {
    Caption.step(6);
    Caption.set('スマートフォン：メニューは「MENU」、予約への入口はトップの予約バナーとボタン');
    await clickUi('#wxMob', { after: 150 });
    X.device('mobile');
    X.page('TOP');
    X.pageKey = 'home';
    Browser.nav('wx', { url: X.url({ mobile: true }) });
    Browser.loading('wx', true);
    await X.loadSp('home', { states: ['future', 'noEmbeds', 'spNoCta'] });
    Browser.loading('wx', false);
    await wait(900);
    const sd = X.spDoc;
    await X.scroll(X.yOf(sd.querySelector('#' + SEC[4]), -500), 2200);
    await wait(900);
    Issue.show(() => sd.querySelector('#comp-lonxwqoy'), '予約の入口がない');
    Caption.issue('表示漏れ', 'モバイルでは予約バナーとボタンのセクションが「非表示」：スマホから予約フォームに進めない');
    await wait(2600);
    Issue.hide();
    await clickUi('.wx-tool[data-tool="section"]', { after: 100 });
    X.panel('モバイルで非表示の要素', `<div class="wx-sf" style="font-size:12px;color:#577083">このページでモバイルに表示していない要素です。</div>
      <div class="lo-sw-row" id="hidCta">セクション：予約バナー・予約リクエストフォームへのボタン<span class="wx-btn" style="height:28px">表示する</span></div>`);
    await wait(900);
    await clickUi('#hidCta .wx-btn', { after: 150 });
    X.state('spNoCta', false);
    await X.closePanel();
    await X.scrollToEl(sd.querySelector(CTA), 10, 900);
    Issue.ok(() => sd.querySelector(CTA), '表示');
    Caption.fixed('モバイルでも表示：スマホでも「予約リクエストフォームはこちら」から予約に進める');
    await wait(1600);
    const cb = [...sd.querySelectorAll(`${CTA} a`)].find((a) => a.getBoundingClientRect().width > 0);
    if (cb) await X.scrollToEl(cb, 500, 1200);
    await wait(1300);
    Issue.hide();
    Caption.set('SUP体験のページもスマホで確認：プランの下に「リクエスト予約する」');
    X.page('SUP体験');
    X.pageKey = 'sup';
    Browser.loading('wx', true);
    await X.loadSp('sup', { states: ['future'] });
    Browser.loading('wx', false);
    const sb = [...X.spDoc.querySelectorAll('#comp-lonxwqpe a')].find((x) => /リクエスト予約する/.test(x.textContent) && x.getBoundingClientRect().width > 0);
    if (sb) { await X.scrollToEl(sb, 520, 2200); await hoverUi(sb, { hold: 1400 }); }
    Caption.set('予約リクエストフォームもスマホで：選択肢・人数・連絡先が 1 列に並ぶ');
    X.page('予約リクエストフォーム');
    X.pageKey = 'contact';
    Browser.loading('wx', true);
    await X.loadSp('contact', { states: ['future'] });
    Browser.loading('wx', false);
    const sf = X.spDoc.querySelector('form');
    if (sf) { await X.scrollToEl(sf, 40, 1800); await wait(800); await X.scroll(X.yOf(sf, -500), 2000); await wait(900); }
    await X.scroll(0, 1500);
    await clickUi('#wxDesk', { after: 120 });
    X.device('desktop');
    Browser.nav('wx', { url: X.url() });
    await show('home', { states: ['noEmbeds'] });
  });

  /* 7 — publish */
  scene('publish', async () => {
    Caption.step(7);
    Caption.set('公開の前に、予約リクエストフォームのページの SEO タイトル');
    await clickUi('.wx-tool[data-tool="pages"]', { after: 80 });
    X.tool('pages');
    X.panel('ページとメニュー', '');
    showPages();
    await wait(600);
    const fr = rowOf('予約リクエストフォーム');
    await hoverUi(fr, { hold: 200 });
    await clickUi($('.dots', fr), { after: 120 });
    X.ctx([{ t: '設定', ic: 'gear' }, { t: 'SEO の基本設定', ic: 'globe', id: 'ctxSeo' }, { t: 'ソーシャルシェア', ic: 'link' }], $('.dots', fr));
    await wait(400);
    await clickUi('#ctxSeo', { after: 80 });
    X.ctxOff();
    X.panel('ページの設定：予約リクエストフォーム', `<div class="wx-pg-tabs"><span>ページ情報</span><span>権限</span><span class="on">SEO の基本設定</span><span>ソーシャルシェア</span></div>
      <div class="wx-sf"><label>タイトルタグ（検索結果とブラウザのタブに表示）</label><div class="wx-in" id="seoTitle"><span class="v"></span><span class="ph">ページのタイトル</span></div></div>
      <div class="wx-sf"><label>URL スラッグ</label><div class="wx-in"><span class="v">www.nagomi-nc.com/contact</span></div></div>`);
    await wait(600);
    const ti = $('#seoTitle');
    await clickUi(ti, { kind: 'text', after: 100 });
    ti.classList.add('focus');
    // the part after the page name is the same on every page: copied from the TOP page's title
    const title = await typeInto(fieldTarget(ti), [...JA['予約リクエストフォーム'], { paste: '｜Nagomi Nature Connections｜なごみネイチャーコネクション' }], { kps: 12 });
    ti.classList.remove('focus');
    ti.innerHTML = `<span class="v">${title}</span>`;
    Cursor.kind('arrow');
    await wait(1200);
    await X.closePanel();
    Caption.set('公開：www.nagomi-nc.com に反映');
    await clickUi('#wxPublish', { after: 80 });
    $('#wxPublish').classList.add('busy');
    $('#wxPublish').textContent = '公開中…';
    await wait(1800);
    $('#wxPublish').classList.remove('busy');
    $('#wxPublish').textContent = '公開';
    X.saved(true);
    X.modal(NG.publish(V.wix.domain));
    await wait(2600);
    await clickUi('#pubView', { after: 80 });
    X.closeModal();
  });

  /* 8 — the live site: from the top page through a programme to the request form (nothing is sent) */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開サイトで予約までの導線を確認（トップ → SUP → プラン → 予約リクエストフォーム）');
    Browser.addTab({ id: 'live', title: TITLE.home, url: URL('home'), page: 'store', fav: 'store' }, { anim: true });
    Browser.loading('live', true);
    await Store.load('home', { states: ['future', 'noEmbeds'] });
    Browser.loading('live', false);
    await wait(1500);
    await Store.scrollToEl('#' + SEC[4], 40, 2200);
    await wait(800);
    const kay = [...Store.doc.querySelectorAll(`#${SEC[4]} a[href*="/kayak"]`)].find((x) => x.getBoundingClientRect().width > 0);
    await liveGo(kay, 'kayak');
    await Store.scroll(900, 1800);
    await wait(900);
    await Store.scroll(1600, 1600);
    await wait(900);
    // back to the top page (the browser's back button), then SUP
    await clickUi('#brBack', { after: 100 });
    Browser.nav('live', { url: URL('home'), title: TITLE.home });
    Browser.loading('live', true);
    await Store.load('home', { states: ['future', 'noEmbeds'] });
    Browser.loading('live', false);
    await Store.scrollToEl('#' + SEC[4], 40, 900);
    await wait(500);
    const sup = [...Store.doc.querySelectorAll(`#${SEC[4]} a[href*="/sup"]`)].find((a) => a.getBoundingClientRect().width > 0);
    await liveGo(sup, 'sup');
    const b = [...Store.doc.querySelectorAll('#comp-lonxwqpe a')].find((a) => /リクエスト予約する/.test(a.textContent) && a.getBoundingClientRect().width > 0);
    if (b) await Store.scrollToEl(b, 420, 2000);
    await wait(900);
    await liveGo(b, 'contact');
    await Store.scrollToEl('form', 80, 1500);
    await wait(900);
    await Store.scroll(Store.yOf(Store.doc.querySelector('form'), -400), 1600);
    await wait(1200);
    await Store.scroll(Store.yOf(Store.doc.querySelector('form'), -900), 1700);
    await wait(1200);
    Caption.set('カヤック・SUP の体験プログラムを紹介し、予約リクエストフォームまでつなぐサービス紹介サイトが完成');
    await wait(5200);
    Caption.hide();
  });

  /* ============================================================ canvas states */
  const ST = window.StoreFrame.STATES;
  const css = (id, text) => ({ on(doc) { if (!doc.getElementById(id)) { const s = doc.createElement('style'); s.id = id; s.textContent = text; doc.head.appendChild(s); } }, off(doc) { const s = doc.getElementById(id); if (s) s.remove(); } });
  const hide = (sels) => ({ on(doc) { sels.forEach((s) => doc.querySelectorAll(s).forEach((e) => e.setAttribute('data-demo-hidden', ''))); }, off(doc) { sels.forEach((s) => doc.querySelectorAll(s).forEach((e) => e.removeAttribute('data-demo-hidden'))); } });
  // anything dated after the video's day (2026-11-12): the live site shows what was posted until it was captured
  ST.future = {
    on(doc) {
      [...doc.querySelectorAll('p, span, h2')].filter((p) => p.children.length === 0 && /2026[年/.](11[年/.月]?(1[3-9]|2\d|30)|12)/.test(p.textContent)).forEach((p) => {
        let n = p;
        while (n.parentElement && n.parentElement.children.length < 3) n = n.parentElement;
        n.setAttribute('data-demo-hidden', '');
      });
    },
    off() {},
  };
  // embedded widgets (Instagram feed, Google Maps, the 旅色 player) are iframes, which the capture leaves out: their
  // empty boxes are folded away
  ST.noEmbeds = css('demo-noembeds', '#comp-lonxwqp1, #comp-lonxwqp0 [data-testid="inline-content"] > div:last-child { display: none !important; }');
  ST.heroNoImg = css('demo-heronoimg', `${SLIDES} wow-image, ${SLIDES} [id^="bgMedia_"] { visibility: hidden; } ${SLIDES} [id^="bgLayers_"], ${SLIDES} [data-testid="slidesWrapper"], ${SLIDES} { background: #dfe5eb !important; }`);
  ST.homeBuild = hide(SEC.slice(1).map((s) => '#' + s).concat('#SITE_FOOTER'));
  ST.homeRest = hide(['#' + SEC[3], '#' + SEC[6], '#' + SEC[7], '#' + SEC[8], '#SITE_FOOTER']);
  ST.spNoCta = hide([CTA]);

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home'],
    fontText: JSON.stringify(JA) + Object.values(PAGE).join('') + LIST.map((p) => p.n).join('') + 'モバイルで非表示の要素表示するスライドを管理',
    async prepare() {
      X.mount();
      Browser.addTab({ id: 'wx', title: `${X.title()} | ${V.wix.siteName}`, url: X.url(), page: 'wix', fav: 'wix' });
      X.fit();
      X.page('TOP');
      await X.load('home', { states: ['future', 'noEmbeds', 'homeBuild', 'heroNoImg'] });
      MEDIA = [];
      Win.open('browser', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
