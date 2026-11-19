/*
 * Timeline: 株式会社ライト光機製作所 (www.light-op.co.jp) — a manufacturer's corporate site built in the Wix editor:
 * site menu (pages + subpages) -> header + main visual -> products / service on the top page, the products page
 * -> company overview -> recruit page + contact form (Wix Forms) -> the mobile editor -> publish -> the live site.
 * The editor is rebuilt (shared/wix/wix.js); every page on its canvas and the live site are the real ones (captured).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, X = window.Wix, LO = window.LO, S = window.SITE_SNAPSHOT;
  const { $, $$, wait, tween, Ease, Cursor, Caption, Issue, Keycap, KeyStrip, Win, typeInto, fieldTarget, clickUi, hoverUi, moveToEl } = D;
  const { Browser, Store, FileDialog } = K;
  const LIVE = 'https://www.light-op.co.jp';
  const V = window.VIDEO;

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '当社の製品が選ばれる理由': [{ r: 'toushanoseihinngaerabareruriyuu', segs: ['当社の', '製品が', '選ばれる', '理由'] }],
    '国内販売': [{ r: 'kokunaihannbai', segs: ['国内販売'] }],
    'ニュース': [{ r: 'nyu-su', segs: ['ニュース'] }],
    '製品紹介': [{ r: 'seihinnshoukai', segs: ['製品紹介'] }],
    'ライフルスコープ': [{ r: 'raifurusuko-pu', segs: ['ライフルスコープ'] }],
    '双眼鏡': [{ r: 'sougannkyou', segs: ['双眼鏡'] }],
    'スポッティングスコープ': [{ r: 'supothinngusuko-pu', segs: ['スポッティングスコープ'] }],
    'サービス': [{ r: 'sa-bisu', segs: ['サービス'] }],
    '企業情報': [{ r: 'kigyoujouhou', segs: ['企業情報'] }],
    '会社概要': [{ r: 'kaishagaiyou', segs: ['会社概要'] }],
    '沿革': [{ r: 'ennkaku', segs: ['沿革'] }],
    '拠点一欄': [{ r: 'kyotennichirann', segs: ['拠点', '一欄'] }],
    '一覧': [{ r: 'ichirann', segs: [{ c: ['一欄', '一覧', '位置覧'], p: 1 }], candHold: 320 }],
    '採用情報': [{ r: 'saiyoujouhou', segs: ['採用情報'] }],
    'お問い合わせ': [{ r: 'otoiawase', segs: ['お問い合わせ'], predict: ['お問い合わせ', 'お問い合わせフォーム'], yomi: ['おといあわせ', 'おといあわせふぉーむ'] }],
    '世界に挑む': [{ r: 'sekainiidomu', segs: ['世界に', '挑む'] }],
    '技術を磨き続け': [{ r: 'gijutsuwomigakitsuduke', segs: ['技術を', '磨き続け'] }],
    '品質で応える。': [{ r: 'hinnshitsudekotaeru.', segs: ['品質で', { c: ['答える。', '応える。', '堪える。'], p: 1 }], candHold: 300 }],
    '株式会社ライト光機製作所': [{ r: 'kabushikigaisharaitokoukiseisakusho', segs: ['株式会社', 'ライト', { c: ['好機', '光機', '後期'], p: 1 }, '製作所'], candHold: 300 }],
    'お問い合わせありがとうございます。担当者よりご連絡いたします。': [
      { r: 'otoiawasearigatougozaimasu.', segs: ['お問い合わせ', 'ありがとうございます。'] },
      { r: 'tanntoushayorigorennrakuitashimasu.', segs: ['担当者より', 'ご連絡', 'いたします。'] }],
  };

  /* ------------------------------------------------ the site: sections of the top page (captured DOM) */
  const SEC = ['comp-mghyjo8u', 'comp-mghzc04n', 'comp-mghzho9e', 'comp-mgis2db3', 'comp-mgisiboi', 'comp-mgitutbp', 'comp-mgixadtl', 'comp-mgss6i1y_r_comp-mgixyaxs', 'comp-mgizqrlj_r_comp-mgiyguly'];
  const HEADER = '#comp-kbgakxea', FOOTER = '#comp-kbgakxmn', LOGO = '#comp-kbgakxea_r_comp-mguijedh';
  const HERO = '#comp-mghyjo8u', HERO_COPY = '#comp-mghyno26', HERO_SUB = '#comp-mghyno2p';
  const sec = (i) => X.q('#' + SEC[i]);
  const PAGE = { home: 'ホーム', products: '製品紹介', development: 'サービス', overview: '会社概要', recruit: '採用情報', contact: 'お問い合わせ' };
  const TITLE = {};
  // the tab titles of the live site: each page's own <title> as captured
  Object.keys(PAGE).forEach((k) => { TITLE[k] = ((S.pages[k].pc || '').match(/<title[^>]*>([^<]*)/) || [])[1] || S.title; });

  /* ------------------------------------------------ helpers */
  const imgSrc = (sel, doc = X.doc) => { const i = doc && doc.querySelector(sel); return i ? i.getAttribute('src') : ''; };
  const FILES = ['logo_light-op.png', '本社外観_2025.jpg', '製品集合_item.png', 'service_bg.jpg', 'world-map.png'];
  const fd = (pick) => ({
    folder: ['PC', 'ドキュメント', 'ライト光機製作所', 'Web素材'], filter: '画像ファイル (*.jpg;*.png;*.webp)', pick,
    files: [['logo_light-op.png', 'PNG ファイル', '38 KB'], ['本社外観_2025.jpg', 'JPG ファイル', '2.4 MB'], ['製品集合_item.png', 'PNG ファイル', '1.8 MB'], ['service_bg.jpg', 'JPG ファイル', '1.1 MB'], ['world-map.png', 'PNG ファイル', '420 KB']]
      .map(([name, type, size]) => ({ name, type, size, date: '2026/11/04 16:22' })),
  });
  let MEDIA = [];
  /** the media manager: upload one picture from the PC, then put it on the page */
  async function upload(file, src) {
    X.panel('メディアの選択', LO.media(MEDIA, {}), { wide: true, foot: LO.mediaFoot() });
    await wait(600);
    await clickUi('#mdUpload', { after: 100 });
    await FileDialog.pick(fd(file));
    MEDIA = [{ src, name: file }, ...MEDIA];
    X.panelBody(LO.media(MEDIA, { up: 0 }));
    const up = $('.wx-media .up');
    await tween(Math.max(600, 900), (e) => up && up.style.setProperty('--p', Math.round(e * 100) + '%'));
    X.panelBody(LO.media(MEDIA, { on: 0 }));
    await wait(350);
    await clickUi('#mdPick', { after: 120 });
    $('#wxPanel').classList.remove('on');
  }
  /** a canvas text: double-click, type the lines (Enter between them), back to the page's own markup */
  async function typeCanvas(els, keys) {
    await clickUi(els[0], { dbl: true, kind: 'text', after: 120 });
    for (let i = 0; i < els.length; i++) {
      const t = X.textTarget(els[i]);
      if (i) { KeyStrip.special('Enter'); await wait(200); }
      await typeInto(t.target, JA[keys[i]], { kps: 12, keepStrip: i < els.length - 1 });
      t.restore();
    }
    Cursor.kind('arrow');
  }
  /** the page selector of the top bar → another page of the site on the canvas */
  async function goPage(key, o = {}) {
    await clickUi('#wxPageSel', { after: 120 });
    $('#wxPageSel').classList.add('open');
    const items = Object.keys(PAGE).map((k) => ({ t: PAGE[k], id: 'go-' + k }));
    X.ctx(items, $('#wxPageSel'));
    await wait(450);
    await clickUi('#go-' + key, { after: 60 });
    X.ctxOff();
    $('#wxPageSel').classList.remove('open');
    X.page(PAGE[key]);
    Browser.loading('wx', true);
    await X.load(key, { states: ['future', ...(o.states || [])] });
    Browser.loading('wx', false);
    await wait(500);
  }
  /** sections of the top page appear one by one, the canvas following them */
  async function revealSections(list, o = {}) {
    for (const i of list) {
      const el = sec(i);
      if (!el) continue;
      X.reveal(el);
      await wait(o.gap || 260);
    }
  }
  /** the link panel of a button: a page of the site */
  async function linkTo(btn, label, pageName) {
    X.select(btn, label, { bar: X.barHtml([{ b: 'テキストを変更' }, { c: 'link', id: 'barLink' }, { c: 'gear' }]) });
    await clickUi(btn, { after: 150 });
    await clickUi('#barLink', { after: 150 });
    X.panel('リンク先', `<div class="wx-sf"><label>リンクの種類</label><div class="wx-opt"><span class="on">ページ</span><span>URL</span><span>メール</span><span>アンカー</span></div></div>
      <div class="wx-sf"><label>ページ</label><div class="wx-in" id="lkPage"><span class="v"></span><span class="ph">ページを選択</span></div></div>`, { right: true, foot: '<span class="wx-btn pri" id="lkOk">完了</span>' });
    await wait(500);
    await clickUi('#lkPage', { after: 120 });
    $('#lkPage').innerHTML = `<span class="v">${pageName}</span>`;
    await wait(500);
    await clickUi('#lkOk', { after: 100 });
    await X.closePanel({ click: false });
    X.toast('リンクを設定しました');
    X.unselect();
  }
  /** a link in the live site's header */
  const navLink = (text) => [...Store.doc.querySelectorAll('header a')].find((a) => a.textContent.replace(/\s+/g, '') === text && a.getBoundingClientRect().width > 0);
  async function livePage(key, text) {
    const a = navLink(text);
    if (a) await clickUi(a, { kind: 'hand', after: 80 });
    Cursor.kind('arrow');
    Browser.nav('live', { url: LIVE + V.snapshot.pages[key], title: TITLE[key] });
    Browser.loading('live', true);
    await Store.load(key, { states: ['future'] });
    Browser.loading('live', false);
    await wait(900);
  }

  /* ---------------------------------------------- pages & menu */
  const LIST = [{ n: 'ホーム', home: true, on: true }];
  const showPages = (extra = {}) => X.panelBody(LO.pages(LIST.map((p) => ({ ...p, ...(extra[p.n] || {}) })), { note: 'ページを追加すると、ヘッダーのメニューにも同じ順番で並びます。' }));
  /** "ページを追加": a new row with the name field, typed through the IME */
  async function addPage(name, keys) {
    await clickUi('#pgAdd', { after: 120 });
    LIST.push({ n: '', edit: 'pgEd' });
    showPages();
    const ed = $('#pgEd');
    const typed = await typeInto(fieldTarget(ed), keys ? keys.flatMap((k) => JA[k]) : JA[name], { kps: 13, keepStrip: true });
    KeyStrip.special('Enter');
    KeyStrip.idleHide(500);
    const p = LIST[LIST.length - 1];
    delete p.edit;
    p.n = typed;
    p.new = true;
    showPages();
    p.new = false;
    await wait(260);
    return typed;
  }
  /** "…" on a row → "サブページにする" */
  async function makeSub(name) {
    const row = $(`.wx-pg[data-pg="${name}"]`);
    await hoverUi(row, { hold: 200 });
    await clickUi($('.dots', row), { after: 120 });
    X.ctx([{ t: '設定', ic: 'gear' }, { t: '名前を変更', ic: 'text' }, { t: '複製', ic: 'pages' }, { t: 'サブページにする', ic: 'sub', id: 'ctxSub' }, '-', { t: 'メニューに表示しない', ic: 'eye' }], $('.dots', row));
    await wait(400);
    await clickUi('#ctxSub', { after: 60 });
    X.ctxOff();
    LIST.find((p) => p.n === name).sub = true;
    showPages();
    await wait(300);
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — site menu: the pages of a manufacturer's site, subpages under 企業情報 */
  scene('pages', async () => {
    Caption.step(1);
    Caption.set('新しいサイト（空白のテンプレート）から制作。まずページ構成：製品・サービス・企業情報・採用・お問い合わせ');
    await hoverUi('#wxBlank > div', { hold: 1500 });
    await clickUi('.wx-tool[data-tool="pages"]', { after: 80 });
    X.tool('pages');
    X.panel('ページとメニュー', '');
    showPages();
    await wait(900);
    await addPage('当社の製品が選ばれる理由');
    await addPage('製品紹介');
    Caption.set('製品紹介の下に 3 機種のページ（サブページ）');
    for (const n of ['ライフルスコープ', '双眼鏡', 'スポッティングスコープ']) await addPage(n);
    for (const n of ['ライフルスコープ', '双眼鏡', 'スポッティングスコープ']) await makeSub(n);
    await addPage('企業情報');
    Caption.set('企業情報の下に「会社概要・沿革・拠点一覧」（ヘッダーではドロップダウンになる）');
    await addPage('会社概要');
    await addPage('沿革');
    const bad = await addPage('拠点一欄');
    // the IME's first candidate went in unchecked
    const badRow = () => $(`.wx-pg[data-pg="${bad}"]`);
    Issue.show(badRow, '誤変換', { below: true });
    Caption.issue('入力ミス', '「拠点一覧」が「拠点一欄」と誤変換されたまま確定している');
    await wait(2200);
    await clickUi(badRow(), { dbl: true, after: 120 });
    const row = LIST.find((p) => p.n === bad);
    row.edit = 'pgEd';
    showPages();
    $('#pgEd').textContent = bad;
    const fixed = await typeInto(fieldTarget($('#pgEd')), [{ key: 'Backspace', n: 2 }, ...JA['一覧']], { kps: 12, keepStrip: true, initial: bad });
    KeyStrip.special('Enter');
    KeyStrip.idleHide(500);
    delete row.edit;
    row.n = fixed;
    showPages();
    Issue.ok(() => $(`.wx-pg[data-pg="${fixed}"]`), '修正', { below: true });
    Caption.fixed('名前を変更して、変換候補から「一覧」を選び直した');
    await wait(1800);
    Issue.hide();
    for (const n of ['会社概要', '沿革', '拠点一覧']) await makeSub(n);
    await addPage('サービス');
    await addPage('国内販売');
    await addPage('ニュース');
    Caption.set('採用情報とお問い合わせはヘッダー右のボタンにも置く');
    await addPage('採用情報');
    await addPage('お問い合わせ');
    await wait(900);
    await X.closePanel();
  });

  /* 2 — header (logo + menu) and the main visual */
  scene('header', async () => {
    Caption.step(2);
    Caption.set('ヘッダー：ロゴの画像と、さきほどのページ構成から作られたメニュー');
    X.blank(false);
    X.reveal(X.q(HEADER));
    await wait(700);
    const logoBox = X.q(LOGO);
    X.select(logoBox, '画像', { bar: X.barHtml([{ b: '画像を変更', id: 'barImg' }, { c: 'link' }, { c: 'gear' }]) });
    await clickUi(logoBox, { after: 200 });
    await clickUi('#barImg', { after: 200 });
    await upload('logo_light-op.png', imgSrc(`${LOGO} img`));
    X.state('noLogo', false);
    X.select(logoBox, '画像');
    await wait(900);
    const nav = X.q(`${HEADER} nav`) || X.q(`${HEADER} [data-testid="linkElement"]`);
    if (nav) { X.select(nav.closest('nav') || nav, 'メニュー（サイトメニューと同期）'); await hoverUi(nav, { hold: 1500 }); }
    X.unselect();

    Caption.set('メインビジュアル：フルスクリーンのストリップを追加して、本社の写真を背景に');
    await X.clickTool('add');
    X.panel('追加', LO.add('ストリップ', LO.strips()), { wide: true });
    await wait(900);
    await clickUi('#addStripFull', { after: 160 });
    $('#addStripFull').classList.add('on');
    await wait(300);
    await X.closePanel({ click: false });
    const hero = X.q(HERO);
    X.reveal(hero);
    await wait(500);
    X.select(hero, 'セクション：メインビジュアル', { sec: true, bar: X.barHtml([{ b: '背景を変更', id: 'barBg' }, { c: 'gear', id: 'barBgSet' }, { c: 'layers' }]) });
    await clickUi('#barBg', { after: 200 });
    await upload('本社外観_2025.jpg', imgSrc(`#img_comp-mghyjo8u img`));
    X.state('heroNoImg', false);
    X.state('heroBoxed', true);
    X.select(hero, 'セクション：メインビジュアル', { sec: true, bar: X.barHtml([{ b: '背景を変更', id: 'barBg' }, { c: 'gear', id: 'barBgSet' }, { c: 'layers' }]) });
    await wait(900);
    // the picture went into the 980 px content area only
    Issue.show(() => X.q(HERO), '背景が全幅でない');
    Caption.issue('レイアウト', '背景の写真が中央の幅（980 px）だけに入り、左右が白く空いている');
    await wait(2400);
    await clickUi('#barBgSet', { after: 150 });
    X.panel('背景の設定', LO.bg({ stretch: false }), { right: true });
    await wait(700);
    await clickUi('#bgStretch .sw', { after: 120 });
    $('#bgStretch .sw').classList.add('on');
    X.state('heroBoxed', false);
    await wait(500);
    Issue.ok(() => X.q(HERO), '全幅');
    Caption.fixed('「ストリップの幅いっぱいに表示」をオン：写真が画面の端まで広がった');
    await wait(1800);
    Issue.hide();
    await X.closePanel();

    Caption.set('キャッチコピーを入力');
    await X.scroll(260, 900);
    const copy = $$('p', X.q(HERO_COPY));
    X.select(X.q(HERO_COPY), 'テキスト', { bar: X.barHtml([{ b: 'テキストを編集' }, { c: 'gear' }]) });
    await typeCanvas(copy, ['世界に挑む', '技術を磨き続け', '品質で応える。']);
    const sub = X.q(`${HERO_SUB} p`);
    X.select(X.q(HERO_SUB), 'テキスト');
    await clickUi(sub, { dbl: true, kind: 'text', after: 100 });
    const st = X.textTarget(sub);
    await typeInto(st.target, [{ direct: 'Shaping Technology. Defining Quality.' }], { kps: 16 });
    st.restore();
    Cursor.kind('arrow');
    X.unselect();
    await wait(500);
    Caption.set('2 つ目のセクション：会社の想いの文章と、世界地図の画像（2カラム）');
    await X.clickTool('add');
    X.panel('追加', LO.add('ストリップ', LO.strips()), { wide: true });
    await wait(700);
    await clickUi('#addStripCols', { after: 120 });
    await X.closePanel({ click: false });
    X.reveal(sec(1));
    await X.scrollToEl(sec(1), 40, 1200);
    X.select(sec(1), 'セクション', { sec: true });
    await wait(1600);
    X.unselect();
    await X.save();
  });

  /* 3 — products + service on the top page, the products page */
  scene('products', async () => {
    Caption.step(3);
    Caption.set('製品紹介：製品の写真と、3 つの製品ページへのリンク（ライフルスコープ・双眼鏡・スポッティングスコープ）');
    await X.clickTool('add');
    X.panel('追加', LO.add('ストリップ', LO.strips()), { wide: true });
    await wait(700);
    await clickUi('#addStripList', { after: 120 });
    await X.closePanel({ click: false });
    X.reveal(sec(2));
    await X.scrollToEl(sec(2), 30, 1300);
    const pic = X.q('#img-comp-mghziyz0');
    X.select(pic, '画像', { bar: X.barHtml([{ b: '画像を変更', id: 'barImg2' }, { c: 'link' }, { c: 'gear' }]) });
    await clickUi(pic, { after: 150 });
    await clickUi('#barImg2', { after: 150 });
    await upload('製品集合_item.png', imgSrc('#img-comp-mghziyz0 img'));
    X.select(pic, '画像');
    await wait(800);
    const more = [...sec(2).querySelectorAll('a')].find((a) => /View More/.test(a.textContent) && a.getBoundingClientRect().width > 0);
    if (more) await linkTo(more, 'ボタン', '製品紹介');
    X.unselect();
    Caption.set('サービス（OEM／ODM・新規開発・精密加工・一貫生産・資材手配）も同じ構成で');
    X.reveal(sec(3));
    await X.scrollToEl(sec(3), 30, 1300);
    X.select(sec(3), 'セクション：サービス', { sec: true });
    await wait(1500);
    X.unselect();
    Caption.set('会社案内（About Us）・お知らせ（ブログと連携）・お問い合わせの帯・フッターを配置');
    await revealSections([5, 6, 7, 8], { gap: 200 });
    X.reveal(X.q(FOOTER));
    const h = X.doc.documentElement.scrollHeight;
    await X.scroll(X.yOf(sec(5), 20), 1500);
    await wait(900);
    await X.scroll(X.yOf(sec(6), 20), 1300);
    await hoverUi(sec(6), { hold: 1300 });
    await X.scroll(h, 1400);
    await wait(1200);
    Caption.set('製品紹介のページ：3 機種のカード（写真・説明・詳細ボタン）');
    await goPage('products');
    await X.scrollToEl(X.q('#comp-mgkhw6gj'), 20, 1600);
    await wait(1400);
    const detail = [...X.q('#comp-mgkhw6gj').querySelectorAll('a')].find((a) => /詳細を見る/.test(a.textContent) && a.getBoundingClientRect().width > 0);
    if (detail) {
      await X.scrollToEl(detail, 260, 900);
      Caption.set('各カードの「詳細を見る」を、それぞれの製品ページ（サブページ）にリンク');
      await linkTo(detail, 'ボタン', '製品紹介 › ライフルスコープ');
    }
    await X.scroll(X.yOf(X.q('#comp-mgkhw6gj'), -500), 1600);
    await wait(1000);
    Caption.set('サービスのページ：OEM／ODM の流れから資材の手配まで、5 つのサービスを順に');
    await goPage('development');
    const hd = X.doc.documentElement.scrollHeight;
    for (const k of [0.15, 0.35, 0.55, 0.72]) { await X.scroll(hd * k, 1500); await wait(800); }
  });

  /* 4 — company overview */
  scene('overview', async () => {
    Caption.step(4);
    Caption.set('会社概要：代表挨拶・ビジョン・基本理念と、会社情報の表');
    await goPage('overview', { states: ['ovNameEmpty'] });
    await X.scroll(X.yOf(X.q('#comp-mgq05jza'), 0), 1700);
    await wait(900);
    await X.scrollToEl(X.q('#comp-mgq0x0ny'), 20, 1500);
    const cell = X.q('#comp-mgq1he8l1__item1');
    const p = cell && cell.querySelector('p');
    if (p) {
      await X.scrollToEl(cell, 320, 900);
      X.select(cell, 'テキスト', { bar: X.barHtml([{ b: 'テキストを編集' }, { c: 'gear' }]) });
      await clickUi(p, { dbl: true, kind: 'text', after: 100 });
      const t = X.textTarget(p);
      await typeInto(t.target, JA['株式会社ライト光機製作所'], { kps: 13 });
      t.restore();
      Cursor.kind('arrow');
      X.unselect();
    }
    Caption.set('英文名・創業・資本金・所在地・事業内容…は、会社案内の資料から貼り付け');
    await X.scroll(X.yOf(X.q('#comp-mgq0x0ny'), -300), 1600);
    await wait(1600);
  });

  /* 5 — recruit page + contact form */
  scene('contact', async () => {
    Caption.step(5);
    Caption.set('採用情報：メッセージ・仕事と働く環境・社員インタビュー・お知らせ・エントリー');
    await goPage('recruit');
    const h = X.doc.documentElement.scrollHeight;
    for (const k of [0.17, 0.35, 0.52, 0.68, 0.82]) { await X.scroll(h * k, 1500); await wait(900); }
    Caption.set('お問い合わせ：Wix フォームで項目（会社名・担当者・メール・電話・住所・内容）を作成');
    await goPage('contact');
    const form = X.q('form');
    await X.scrollToEl(form, 80, 1000);
    X.select(form, 'フォーム', { bar: X.barHtml([{ b: 'フォームを編集', id: 'barForm' }, { c: 'gear' }, { c: 'layers' }]) });
    await clickUi(form, { after: 150, ay: 0.2 });
    await clickUi('#barForm', { after: 150 });
    X.panel('フォームの設定', LO.form({ tab: 'fields' }), { right: true });
    await wait(900);
    await clickUi('#fmF3', { after: 150 });
    X.panelBody(LO.form({ tab: 'fields', on: 3, field: 3 }));
    await wait(500);
    await clickUi('#fmReq .sw', { after: 120 });
    X.panelBody(LO.form({ tab: 'fields', on: 3, field: 3, telReq: true }));
    Caption.set('電話番号も必須に（折り返しの連絡に使うため）');
    await wait(1300);
    await clickUi($$('#wxPanelBody .wx-pg-tabs span')[1], { after: 150 });
    X.panelBody(LO.form({ tab: 'after' }));
    Caption.set('送信後：担当者へのメール通知と、お客様に表示するメッセージ');
    await wait(700);
    await clickUi('#fmNotify .sw', { after: 150 });
    X.panelBody(LO.form({ tab: 'after', notify: true }));
    await wait(700);
    const msg = $$('#wxPanelBody .wx-in')[1];
    await clickUi(msg, { kind: 'text', after: 100 });
    msg.classList.add('focus');
    await typeInto(fieldTarget(msg), JA['お問い合わせありがとうございます。担当者よりご連絡いたします。'], { kps: 14 });
    X.panelBody(LO.form({ tab: 'after', notify: true, thanks: true }));
    Cursor.kind('arrow');
    await wait(900);
    await X.closePanel();
    X.unselect();
    await X.save();
  });

  /* 6 — the mobile editor */
  scene('mobile', async () => {
    Caption.step(6);
    Caption.set('モバイル表示：Wix はモバイル用のレイアウトを別に調整できる');
    await clickUi('#wxMob', { after: 150 });
    X.device('mobile');
    X.page('ホーム');
    Browser.nav('wx', { url: X.url({ mobile: true }) });
    Browser.loading('wx', true);
    X.pageKey = 'home';
    await X.loadSp('home', { states: ['future', 'spHeroBig'] });
    Browser.loading('wx', false);
    await wait(900);
    const copy = X.spDoc.querySelector(HERO_COPY);
    Issue.show(() => X.spDoc.querySelector(HERO), '文字がはみ出す');
    Caption.issue('表示崩れ', 'モバイルでキャッチコピーが大きすぎて、行が画面の右にはみ出している');
    await wait(2600);
    X.select(copy, 'テキスト', { bar: X.barHtml([{ b: 'テキストを編集' }, { c: 'gear', id: 'barTxSet' }]) });
    await clickUi(copy, { after: 150 });
    await clickUi('#barTxSet', { after: 150 });
    X.panel('テキストの設定', LO.textSize(44, { mobile: true }), { right: true });
    await wait(800);
    const knob = $('#txSize i');
    await moveToEl(knob);
    Cursor.press();
    const tr = $('#txSize .tr').getBoundingClientRect();
    const sx = Cursor.x;
    await tween(900, (e) => {
      const px = Math.round(44 - 18 * e);
      const pct = ((px - 12) / 48) * 100;
      Cursor.x = sx - (tr.width * 18 / 48) * e; Cursor.render();
      $('#txSize b').style.width = pct + '%'; $('#txSize i').style.left = pct + '%'; $('#txSize .n').textContent = px;
    }, Ease.inOut);
    Cursor.release();
    X.state('spHeroBig', false);
    await wait(400);
    Issue.ok(() => X.spDoc.querySelector(HERO), '収まった');
    Caption.fixed('モバイルだけフォントサイズを 44 → 26 に：3 行が画面内に収まった');
    await wait(2000);
    Issue.hide();
    await X.closePanel();
    X.unselect();
    const h = X.spDoc.documentElement.scrollHeight;
    for (const k of [0.25, 0.5, 0.8]) { await X.scroll(h * k, 1400); await wait(600); }
    await X.scroll(0, 1200);
    await clickUi('#wxDesk', { after: 120 });
    X.device('desktop');
    Browser.nav('wx', { url: X.url() });
    Browser.loading('wx', true);
    await X.load('home', { states: ['future'] });
    Browser.loading('wx', false);
    await wait(600);
  });

  /* 7 — publish */
  scene('publish', async () => {
    Caption.step(7);
    Caption.set('公開の前に、各ページの SEO（検索結果に出るタイトル）を設定');
    await clickUi('.wx-tool[data-tool="pages"]', { after: 80 });
    X.tool('pages');
    X.panel('ページとメニュー', '');
    showPages();
    await wait(700);
    const home = $('.wx-pg[data-pg="ホーム"]');
    await hoverUi(home, { hold: 200 });
    await clickUi($('.dots', home), { after: 120 });
    X.ctx([{ t: '設定', ic: 'gear' }, { t: 'SEO の基本設定', ic: 'globe', id: 'ctxSeo' }, { t: 'ソーシャルシェア', ic: 'link' }, '-', { t: '複製', ic: 'pages' }], $('.dots', home));
    await wait(400);
    await clickUi('#ctxSeo', { after: 80 });
    X.ctxOff();
    X.panel('ページの設定：ホーム', `<div class="wx-pg-tabs"><span>ページ情報</span><span>権限</span><span class="on">SEO の基本設定</span><span>ソーシャルシェア</span></div>
      <div class="wx-sf"><label>タイトルタグ（検索結果とブラウザのタブに表示）</label><div class="wx-in" id="seoTitle"><span class="v"></span><span class="ph">ページのタイトル</span></div></div>
      <div class="wx-sf"><label>URL スラッグ</label><div class="wx-in"><span class="v">www.light-op.co.jp/</span></div></div>
      <div class="wx-sf" style="font-size:12px;color:#577083">Google の検索結果のプレビュー<div style="margin-top:8px;padding:12px;border:1px solid #dfe5eb;border-radius:6px"><div style="color:#1a0dab;font-size:16px" id="seoPv">株式会社ライト光機製作所</div><div style="color:#006621">https://www.light-op.co.jp</div></div></div>`);
    await wait(700);
    const ti = $('#seoTitle');
    await clickUi(ti, { kind: 'text', after: 100 });
    ti.classList.add('focus');
    const title = await typeInto(fieldTarget(ti), [{ r: 'ho-mu', segs: ['ホーム'] }, { direct: ' | ' }, ...JA['株式会社ライト光機製作所']], { kps: 13 });
    ti.classList.remove('focus');
    ti.innerHTML = `<span class="v">${title}</span>`;
    $('#seoPv').textContent = title;
    Cursor.kind('arrow');
    await wait(1200);
    await X.closePanel();
    Caption.set('公開前にプレビューで確認：エディタの枠なしで、実際の表示どおりに');
    await clickUi('#wxPreview', { after: 100 });
    X.page('ホーム');
    Browser.loading('wx', true);
    await X.load('home', { states: ['future'] });
    X.preview(true);
    Browser.loading('wx', false);
    await wait(1400);
    const ph = X.doc.documentElement.scrollHeight;
    for (const k of [0.16, 0.3, 0.45, 0.6, 0.78]) { await X.scroll(ph * k, 1500); await wait(700); }
    await X.scroll(0, 1500);
    await wait(600);
    await clickUi('#wxBack', { after: 120 });
    X.preview(false);
    await wait(500);
    Caption.set('公開：独自ドメイン www.light-op.co.jp に接続済みのサイトへ反映');
    await clickUi('#wxPublish', { after: 80 });
    $('#wxPublish').classList.add('busy');
    $('#wxPublish').textContent = '公開中…';
    await wait(1800);
    $('#wxPublish').classList.remove('busy');
    $('#wxPublish').textContent = '公開';
    X.saved(true);
    X.modal(LO.publish(V.wix.domain));
    await wait(1600);
    await clickUi('#pubView', { after: 80 });
    X.closeModal();
  });

  /* 8 — the live site */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開サイトを確認');
    Browser.addTab({ id: 'live', title: TITLE.home, url: LIVE + '/', page: 'store', fav: 'store' }, { anim: true });
    Browser.loading('live', true);
    await Store.load('home', { states: ['future'] });
    Browser.loading('live', false);
    await wait(1500);
    const h = Store.doc.documentElement.scrollHeight;
    for (const k of [0.17, 0.32, 0.5]) { await Store.scroll(h * k, 1600); await wait(800); }
    await Store.scroll(0, 1200);
    await livePage('products', '製品紹介');
    await Store.scroll(700, 1500);
    await wait(900);
    await Store.scroll(0, 900);
    await livePage('recruit', '採用情報');
    await Store.scroll(1000, 1600);
    await wait(900);
    await Store.scroll(0, 900);
    await livePage('contact', 'お問い合わせ');
    await Store.scrollToEl('form', 120, 1200);
    Caption.set('製造業の企業ホームページ（構成・製品・サービス・会社概要・採用・お問い合わせ）が完成');
    await wait(3800);
    Caption.hide();
  });

  /* ============================================================ canvas states ("not built yet", mistakes) */
  const ST = window.StoreFrame.STATES;
  const css = (id, text) => ({ on(doc) { if (!doc.getElementById(id)) { const s = doc.createElement('style'); s.id = id; s.textContent = text; doc.head.appendChild(s); } }, off(doc) { const s = doc.getElementById(id); if (s) s.remove(); } });
  // news posted after the video's day (2026-11-10) — the live site shows them since it was captured later
  ST.future = {
    on(doc) {
      [...doc.querySelectorAll('p')].filter((p) => /2026年11月1[1-9]日/.test(p.textContent)).forEach((p) => {
        let n = p;
        while (n.parentElement && n.parentElement.children.length < 3) n = n.parentElement;
        n.setAttribute('data-demo-hidden', '');
      });
    },
    off() {},
  };
  ST.homeEmpty = {
    on(doc) { [HEADER, FOOTER, ...SEC.map((s) => '#' + s)].forEach((s) => { const e = doc.querySelector(s); if (e) e.setAttribute('data-demo-hidden', ''); }); },
    off(doc) { doc.querySelectorAll('[data-demo-hidden]').forEach((e) => e.removeAttribute('data-demo-hidden')); },
  };
  ST.noLogo = css('demo-nologo', `${LOGO} img { visibility: hidden; } ${LOGO} { outline: 1px dashed #b6c1cd; background: #f0f4f7; }`);
  ST.heroNoImg = css('demo-heronoimg', `#bgMedia_comp-mghyjo8u { visibility: hidden; } #bgLayers_comp-mghyjo8u { background: #dfe5eb; }`);
  ST.heroBoxed = css('demo-heroboxed', `#bgLayers_comp-mghyjo8u { left: calc(50% - 490px) !important; right: auto !important; width: 980px !important; } ${HERO} { background: #fff; }`);
  ST.heroCopyEmpty = {
    on(doc) { doc.querySelectorAll(`${HERO_COPY} p, ${HERO_SUB} p`).forEach((p) => { p.dataset.demoText = p.innerHTML; p.innerHTML = '&#8203;'; }); },
    off(doc) { doc.querySelectorAll('[data-demo-text]').forEach((p) => { p.innerHTML = p.dataset.demoText; delete p.dataset.demoText; }); },
  };
  ST.ovNameEmpty = {
    on(doc) { const p = doc.querySelector('#comp-mgq1he8l1__item1 p'); if (p) { p.dataset.demoText = p.innerHTML; p.innerHTML = '&#8203;'; } },
    off(doc) { doc.querySelectorAll('[data-demo-text]').forEach((p) => { p.innerHTML = p.dataset.demoText; delete p.dataset.demoText; }); },
  };
  ST.spHeroBig = css('demo-spbig', `${HERO_COPY} p, ${HERO_COPY} p span { font-size: 46px !important; white-space: nowrap !important; } ${HERO_COPY} { width: auto !important; overflow: visible !important; }`);

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home'],
    fontText: JSON.stringify(JA) + Object.values(PAGE).join('') + '拠点一欄覧一ページを追加サブページにする',
    async prepare() {
      X.mount();
      Browser.addTab({ id: 'wx', title: `${X.title()} | ${V.wix.siteName}`, url: X.url(), page: 'wix', fav: 'wix' });
      X.fit();
      X.page('ホーム');
      await X.load('home', { states: ['future', 'homeEmpty', 'noLogo', 'heroNoImg', 'heroCopyEmpty'] });
      X.blank(true);
      MEDIA = [];
      Win.open('browser', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
