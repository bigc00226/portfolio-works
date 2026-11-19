/*
 * Timeline of the demo: renewing the 有限会社長谷川興業 site in STUDIO — checking the existing top page and the page
 * structure first, then rebuilding the top page's business section, the vehicles (service / works information), the
 * recruit / member and news sections, the tablet / mobile check, a link and contact check in the preview, publishing,
 * and the published site.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?speed=1.25   ?from=4 (start at scene 4)   ?captions=0   ?autoplay=1
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$, wait, tween, Ease, Cursor, Site, Editor, Layers, Props, Panels, Caption, Keycap, Clock, Pop } = D;
  const { clickUi, hoverUi, pointAt, select, addElement, dropAsset, cascade } = D;
  const { Issue, Toast } = D;
  const readHold = (ms) => wait(ms * Math.max(1, Clock.speed));

  /* ------------------------------------------------ Japanese typing scripts (see yoshitake-koumuten/js/scenario.js) */
  const JA = {
    bizEn: [{ direct: 'BUSINESS' }],
    bizH1: [{ r: 'jigyouannnai', segs: ['事業', '案内'], predict: ['事業', '事業所', '事業案内'], yomi: ['じぎょう', 'じぎょうしょ', 'じぎょうあんない'] }],
    c1En: [{ direct: 'CONCRETE PLACING WORK' }],
    c1H2: [
      { r: 'konkuri-todasetsukouji', segs: [{ c: ['コンクリート', 'こんくりーと'] }, { c: ['打設', 'ダセツ', 'だせつ'] }, '工事'],
        predict: ['コンクリート', 'コンクリート打ち'], yomi: ['こんくりーと', 'こんくりーとうち'] },
      { key: 'Enter' },
    ],
    c2En: [{ direct: 'SALES AND ARRANGEMENT OF READY-MIXED CONCRETE' }],
    c2H2: [
      { r: 'namakonnhannbai/tehai', segs: [{ c: ['生コン', 'ナマコン', '生こん'] }, '販売', '・', '手配'],
        predict: ['生', '生コン', '生コン車'], yomi: ['なま', 'なまこん', 'なまこんしゃ'] },
      { key: 'Enter' },
    ],
    carsH1: [{ r: 'hoyuusharyou', segs: ['保有', '車両'], predict: ['保有', '保有者'], yomi: ['ほゆう', 'ほゆうしゃ'] }],
    carsEn: [{ direct: 'POSSESSION CARS' }],
    num0: [{ direct: '2' }],
    num1: null, // the mistake episode, below
    num2: [{ direct: '1' }],
    recEn: [{ direct: 'RECRUIT' }],
    recH1: [{ r: 'saiyoujouhou', segs: ['採用', '情報'], predict: ['採用', '採用情報', '採用担当'], yomi: ['さいよう', 'さいようじょうほう', 'さいようたんとう'] }],
    newsH1: [{ r: 'oshirase', segs: [{ c: ['お知らせ', 'お報せ', 'おしらせ'] }], predict: ['お知らせ', 'お知らせします'], yomi: ['おしらせ', 'おしらせします'] }],
    newsEn: [{ direct: 'NEWS' }],
  };
  // Mistake 1 (入力ミス): the 2t squeeze trucks are entered as 9 (the fleet total from the text) instead of 6
  JA.num1 = [
    { direct: '9' },
    { wait: 500 },
    { mark: 1 },
    {
      call: async (el) => {
        const m = Site.rect(el.querySelector('.demo-mark'));
        await Cursor.moveTo(m.left - 160, m.top + m.height / 2 + 10, { ms: 420, bend: 0.03 });
        Caption.issue('入力ミス', '2t スクイズ車両を「9台」と入力（合計が12台になり、本文の「現在9台」と合わない）');
        Issue.show(el.querySelector('.demo-mark'), '台数の誤り');
        await wait(2800);
        Issue.hide(); // the frame goes before the number is deleted
      },
    },
    { key: 'Backspace' },
    { direct: '6' },
    { mark: 1, ok: true },
    {
      call: async (el) => {
        Issue.ok(el.querySelector('.demo-mark'), '修正');
        Caption.fixed('いただいた車両リストで確かめて「6台」に修正（2＋6＋1＝9台）');
        await readHold(3000);
        Issue.hide();
      },
    },
    { unmark: true },
    { key: 'Enter' },
  ];

  /* ------------------------------------------------ resolve the real page */
  function resolve(doc) {
    const q = (sel, root) => (root || doc).querySelector(sel);
    const kids = (el) => (el ? Array.from(el.children) : []);
    const at = (el, path) => { for (const i of path) el = el.children[i]; return el; };
    const R = {};
    R.root = q('.StudioCanvas > .sd');
    [R.header, R.topBtn, R.main, R.sns, R.contactWrap] = kids(R.root);
    [R.logo, R.nav] = kids(R.header);
    [R.navLinks, R.navContact, R.menuBtn] = kids(R.nav);
    [R.hero, R.about, R.biz, R.cars, R.recruit, R.news] = kids(R.main);

    // 事業案内
    [R.bizInner, R.bizBg] = kids(R.biz);
    [R.bizEn, R.bizH1, R.bizCards] = kids(R.bizInner);
    const card = (c) => { const [img, en, h2, text, btn] = kids(c); return { el: c, img, en, h2, text, btn }; };
    R.c1 = card(R.bizCards.children[0]);
    R.c2 = card(R.bizCards.children[1]);

    // 保有車両
    [R.carsHead, R.carSlider, R.carsBody] = kids(R.cars);
    [R.carsH1, R.carsEn] = kids(R.carsHead);
    R.slides = kids(R.carSlider);
    [R.carsRow, R.carsBtn] = kids(R.carsBody);
    [R.carsTextCol, R.carList] = kids(R.carsRow);
    [R.carsHeading, R.carsHeadingSp, R.carsText] = kids(R.carsTextCol);
    R.carItems = kids(R.carList);
    R.carNums = R.carItems.map((li) => li.children[1].children[0]);

    // 採用情報・メンバー
    R.recBox = at(R.recruit, [0, 0]);
    [R.recTop, R.memHead, R.memSlider] = kids(R.recBox);
    [R.recLeft, R.recPhotoBox, R.recSp, R.recEntry] = kids(R.recTop); // recSp: the catch copy / text / button laid out for mobile
    [R.recEn, R.recH1] = kids(R.recLeft);
    R.recCopy = kids(R.recLeft).slice(2); // the catch copy, text and button (PC / tablet)
    R.recPhoto = R.recPhotoBox.children[0];
    R.memCards = kids(R.memSlider).slice(1);
    R.memArrows = R.memSlider.children[0];

    // お知らせ
    [R.newsLeft, R.newsList, R.newsBtnSp] = kids(R.news);
    [R.newsH1, R.newsEn, R.newsBtn] = kids(R.newsLeft);
    R.newsItem = at(R.newsList, [0, 0]);

    R.slogan = at(R.hero, [0, 1, 0, 1]);
    // お問い合わせ
    R.contactLinks = kids(at(R.contactWrap, [0, 0, 1]));
    return R;
  }

  function firstLine(html) {
    const s = D.plainOf(html).split('\n')[0].trim();
    return s ? (s.length > 18 ? s.slice(0, 18) + '…' : s) : 'テキスト';
  }
  const shownName = (el) => firstLine(el.innerHTML);
  const textOpts = (el, parent, extra = {}) =>
    Object.assign({ empty: true, type: 'text', name: 'テキスト', label: 'Text', parent, visible: { bottomPad: 330 } }, extra);
  async function moveAside(el) {
    const cur = el.innerHTML;
    el.innerHTML = Site.original(el);
    const r = Site.rect(el);
    el.innerHTML = cur;
    const c = Editor.canvas.getBoundingClientRect();
    if (Cursor.y < r.top - 12 && Cursor.y > c.top + 10) return;
    let y = r.top - 46;
    if (y < c.top + 24) y = Math.min(r.top + r.height + 270, c.bottom - 24);
    const x = D.clamp(Cursor.x, r.left + 30, r.left + r.width + 40);
    await Cursor.moveTo(x, y, { ms: 420, bend: 0.03 });
  }
  async function typeJaIn(el, script) { await moveAside(el); await D.typeJa(el, script); }
  async function pasteIn(el) {
    await moveAside(el);
    await Keycap.show(['Ctrl', 'V']);
    D.syncName(el, D.plainOf(Site.original(el)));
    await Site.paste(el);
  }
  async function editText(el, parent, o = {}) {
    await pointAt(el, { ax: o.ax != null ? o.ax : 0.3, ay: 0.5 });
    await Cursor.dblclick();
    if (!Layers.byEl.has(el)) Layers.add(el, { name: shownName(el), type: 'text', parent });
    select(el, { type: 'text', name: shownName(el), label: 'Text' });
    if (o.selectAll) { Site.selectAll(el); await wait(320); }
    if (o.paste) await pasteIn(el);
    else await typeJaIn(el, o.ja);
  }
  function canvasPoint(fx, fy) {
    const r = Editor.canvas.getBoundingClientRect();
    return [r.left + r.width * fx, r.top + r.height * fy];
  }
  /** an <img> shown with another file for a while (the duplicated card), then given back its own */
  const setSrc = (img, src) => { if (!img.dataset.demoSrc) img.dataset.demoSrc = img.getAttribute('src'); img.setAttribute('src', src); };
  const restoreSrc = (img) => { if (img.dataset.demoSrc) { img.setAttribute('src', img.dataset.demoSrc); delete img.dataset.demoSrc; } };
  /** a link of the duplicated card keeps the copied target until it is set (mistake 3) */
  const setHref = (a, href) => { if (!a.dataset.demoHref) a.dataset.demoHref = a.getAttribute('href'); a.setAttribute('href', href); };
  const restoreHref = (a) => { if (a.dataset.demoHref) { a.setAttribute('href', a.dataset.demoHref); delete a.dataset.demoHref; } };
  /** an empty section collapses to its paddings: hold it open while its content is added */
  const roomFor = (sec) => Site.override(sec, 'min-height', '520px');

  /** the 「リンク」 field: the site's pages */
  const LINKS = [['Home', '/'], ['company', '/company'], ['construction', '/construction'], ['selling', '/selling'], ['recruit', '/recruit'], ['news', '/news'], ['contact', '/contact']];
  async function pickLink(href, o = {}) {
    const f = $('#pp-link');
    await clickUi(f);
    f.classList.add('focus');
    Pop.open(f, `<div class="pop-title">ページ</div>${LINKS.map(([name, h]) =>
      `<div class="pop-item lk" data-link="${h}">${D.icon('file')}${D.esc(name)}<small>${h}</small></div>`).join('')}`);
    await wait(420);
    if (o.via) { await hoverUi(`#popover [data-link="${o.via}"]`, { ms: 600 }); await wait(240); }
    await hoverUi(`#popover [data-link="${href}"]`);
    await wait(260);
    await Cursor.click();
    Props.extra.linkLabel = href;
    Pop.close();
    Props.render(true, 'href');
    await wait(450);
  }

  let R;

  function buildCmsPanel() {
    const news = { date: R.newsItem.children[0].textContent.trim(), title: R.newsItem.children[1].textContent.trim() };
    $('#cmsItems').innerHTML = `<div class="cms-item"><div class="cms-thumb"></div><div class="cms-meta"><div class="cms-title">${D.esc(news.title)}</div>
      <div class="cms-sub"><span class="pill pill-green">公開</span>${D.esc(news.date)}</div></div></div>`;
    // the five members (the slider repeats some of them)
    const seen = new Map();
    R.memCards.forEach((a) => {
      const href = a.getAttribute('href');
      if (seen.has(href)) return;
      const ps = a.querySelectorAll('p');
      seen.set(href, { role: ps[0] ? ps[0].textContent.trim() : '', name: ps[1] ? ps[1].textContent.trim() : '' });
    });
    $('#cmsCount2').textContent = seen.size;
    $('#cmsItems2').innerHTML = [...seen.values()].map((m) => `<div class="cms-item"><div class="cms-thumb"></div><div class="cms-meta">
      <div class="cms-title">${D.esc(m.name)}</div><div class="cms-sub"><span class="pill pill-green">公開</span>${D.esc(m.role)}</div></div></div>`).join('');
  }

  /** the project as the renewal starts: header, main visual, company message, SNS, contact and footer are there */
  function prepareExisting() {
    Site.hideAll([R.biz, R.cars, R.recruit, R.news]);
    const L = [
      [R.header, 'Header'], [R.main, 'Main'], [R.sns, 'SNS'], [R.contactWrap, 'Contact / Footer'],
    ];
    L.forEach(([el, name]) => Layers.add(el, { name, type: 'box' }));
    Layers.add(R.hero, { name: 'メインビジュアル', parent: R.main });
    Layers.add(R.about, { name: '会社紹介', parent: R.main });
    [R.header, R.main, R.sns, R.contactWrap].forEach((el) => Layers.collapse(el));
    // card 2 is made by duplicating card 1: its image and button target start as card 1's
    setSrc(R.c2.img, R.c1.img.getAttribute('src'));
    setHref(R.c2.btn, '/construction');
    Site.doc.documentElement.classList.add('demo-ready');
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', async () => {
    Caption.set('', 'STUDIOで「有限会社長谷川興業」のサイトをリニューアル');
    await wait(900);
    await Cursor.moveTo(...canvasPoint(0.5, 0.45));
    await wait(1400);
  });

  scene('existing', async () => {
    Caption.set(1, 'リニューアル前のトップページのデザインを確認');
    await Cursor.moveTo(...canvasPoint(0.7, 0.55), { ms: 700 });
    await wait(600);
    // read down the current top page: header, main visual, company message, SNS, contact, footer
    await Editor.scrollBy(Editor.canvas.clientHeight * 0.9, 2200);
    await wait(900);
    await Editor.scrollBy(Editor.canvas.clientHeight * 1.2, 2400);
    await wait(1100);
    await Panels.open('layers');
    await hoverUi($$('.ly-row')[0]);
    await wait(700);
    await Editor.scrollTo(0, 1800);
    await wait(300);

    // the styles the renewal keeps: the project's fonts and colours (read on the slogan of the main visual)
    Caption.set(1, '引き継ぐフォントとカラーを確認');
    await pointAt(R.slogan, { ax: 0.3, ay: 0.5 });
    await Cursor.click();
    select(R.slogan, { type: 'text', name: shownName(R.slogan), label: 'Text' });
    await wait(700);
    const font = $('#pp-font');
    await clickUi(font);
    font.classList.add('focus');
    Pop.fonts(font, 'Outfit');
    await wait(1600);
    Pop.close();
    font.classList.remove('focus');
    await wait(300);
    const col = $('#pp-color');
    await clickUi(col);
    col.classList.add('focus');
    Pop.palette(col, 'c15141aa');
    await wait(2000);
    Pop.close();
    col.classList.remove('focus');
    D.deselect();
    await wait(400);

    Caption.set(1, 'ページ構成を確認（会社案内・事業案内 2 ページ・採用・お知らせ・お問い合わせ）');
    await Panels.open('pages');
    await wait(400);
    for (const p of ['company', 'construction', 'selling', 'recruit', 'news', 'contact']) {
      await hoverUi(`.pg-row[data-page="${p}"]`, { ms: 360 });
      await wait(380);
    }
    await hoverUi('.pg-row[data-page="member"]');
    await wait(500);
    await hoverUi('.pg-row[data-page="newspost"]');
    await wait(800);
    Caption.set(1, 'トップページに「事業案内・保有車両・採用・お知らせ」を作り直して、各ページへの入口にする');
    await hoverUi('.pg-row[data-page="home"]');
    await Cursor.click();
    await wait(2200);
    await Panels.open('layers');
    await wait(300);
  });

  scene('business', async () => {
    Caption.set(2, '事業案内（打設工事・生コン販売）を作成');
    await addElement('box', R.biz, {
      name: '事業案内', parent: R.main, at: [0.5, 0.3],
      beforeShow: () => { roomFor(R.biz); Site.hideAll([R.bizBg, R.bizEn, R.bizH1, R.bizCards]); },
    });
    await addElement({ asset: 'd6f87cf2' }, R.bizBg, { name: '背景写真', type: 'image', label: 'Image', parent: R.biz, at: [0.5, 0.3] });
    // a new text starts in the default font: the English headings get the project's Outfit
    await addElement('text', R.bizEn, textOpts(R.bizEn, R.biz, {
      beforeShow: () => Site.override(R.bizEn, 'font-family', "'Noto Sans JP'"), ov: { 'font-family': "'Noto Sans JP'" },
    }));
    await typeJaIn(R.bizEn, JA.bizEn);
    await D.pickFont('Outfit', () => { Site.clearOverride(R.bizEn, 'font-family'); Props.clear('font-family'); });
    await addElement('text', R.bizH1, textOpts(R.bizH1, R.biz));
    await typeJaIn(R.bizH1, JA.bizH1);

    // card 1
    const c1 = R.c1, c2 = R.c2;
    await addElement('box', R.bizCards, {
      name: 'カード', parent: R.biz, at: [0.25, 0.4],
      beforeShow: () => { Site.hide(c2.el); Site.hideAll([c1.img, c1.btn]); [c1.en, c1.h2, c1.text].forEach((e) => Site.empty(e)); },
    });
    await addElement({ asset: '80cdc2a0' }, c1.img, { name: '写真', type: 'image', label: 'Image', parent: c1.el, at: [0.5, 0.5] });
    Site.override(c1.en, 'font-family', "'Noto Sans JP'");
    await editText(c1.en, c1.el, { ax: 0.1, ja: JA.c1En });
    select(c1.en, { type: 'text', name: shownName(c1.en), label: 'Text', ov: { 'font-family': "'Noto Sans JP'" } });
    await D.pickFont('Outfit', () => { Site.clearOverride(c1.en, 'font-family'); Props.clear('font-family'); });
    await editText(c1.h2, c1.el, { ax: 0.1, ja: JA.c1H2 });
    await editText(c1.text, c1.el, { ax: 0.1, paste: true });
    await addElement('button', c1.btn, { name: '詳しくはこちら', type: 'link', label: 'Link', parent: c1.el, at: [0.3, 0.5] });
    Props.extra.linkLabel = '未設定';
    Props.render(true);
    await wait(300);
    await pickLink('/construction');
    Props.extra.linkLabel = '';

    // card 2: duplicate card 1 and rewrite it (its button keeps the copied link — noticed in the link check)
    await pointAt(c1.el, { ax: 0.97, ay: 0.06 });
    await Cursor.click();
    select(c1.el, { name: 'カード', label: 'Box' });
    await wait(350);
    await Keycap.show(['Ctrl', 'D']);
    Site.setHTML(c2.en, c1.en.innerHTML);
    Site.setHTML(c2.h2, c1.h2.innerHTML);
    Site.setHTML(c2.text, c1.text.innerHTML);
    Site.show(c2.el, 'pop');
    Layers.collapse(c1.el);
    Layers.add(c2.el, { name: 'カード', parent: R.biz });
    select(c2.el, { name: 'カード', label: 'Box' });
    await wait(600);
    await dropAsset('aecca46c', c2.img, { at: [0.5, 0.5], name: '写真' });
    restoreSrc(c2.img);
    await editText(c2.en, c2.el, { ax: 0.1, selectAll: true, ja: JA.c2En });
    await editText(c2.h2, c2.el, { ax: 0.15, selectAll: true, ja: JA.c2H2 });
    await editText(c2.text, c2.el, { ax: 0.2, selectAll: true, paste: true });
    await wait(500);
    Site.clearOverride(R.biz, 'min-height');
    D.deselect();
    Layers.collapse(R.biz);
  });

  scene('cars', async () => {
    Caption.set(3, '保有車両（サービス・施工の情報）を作成');
    await addElement('box', R.cars, {
      name: '保有車両', parent: R.main, at: [0.5, 0.3],
      beforeShow: () => { roomFor(R.cars); Site.hideAll([R.carsHead, R.carSlider, R.carsBody]); },
    });
    await addElement('text', R.carsH1, textOpts(R.carsH1, R.cars, { prepare: () => { Site.show(R.carsHead, null); Site.hide(R.carsEn); } }));
    await typeJaIn(R.carsH1, JA.carsH1);
    await addElement('text', R.carsEn, textOpts(R.carsEn, R.cars));
    await typeJaIn(R.carsEn, JA.carsEn);

    // the photo slider: the four trucks (the slider repeats them at both ends)
    Caption.set(3, '車両写真をスライダーに配置');
    await addElement('box', R.carSlider, {
      name: 'スライダー', parent: R.cars, at: [0.5, 0.5],
      beforeShow: () => R.slides.forEach((s) => Site.hide(s)),
    });
    await cascade(R.slides, 170);
    await wait(500);
    // the photos on screen, one by one (the image panel shows each truck)
    const onScreen = R.slides.filter((sl) => { const r = Site.rect(sl), c = Editor.canvas.getBoundingClientRect(); return r.left > c.left && r.left + r.width < c.right; });
    for (const sl of onScreen.slice(0, 3)) {
      const img = sl.firstElementChild;
      await pointAt(img, { ax: 0.5, ay: 0.45 });
      await Cursor.click();
      select(img, { type: 'image', name: '車両写真', label: 'Image' });
      await wait(1100);
    }
    D.deselect();

    // text and the list of vehicles (the numbers typed — mistake 1)
    Caption.set(3, '車両の説明と台数を入力');
    await addElement('box', R.carsBody, {
      name: 'Box', parent: R.cars, at: [0.3, 0.3],
      beforeShow: () => { Site.hideAll([R.carsHeading, R.carsText, R.carList, R.carsBtn]); },
    });
    await addElement('text', R.carsHeading, textOpts(R.carsHeading, R.carsBody, { at: [0.3, 0.5] }));
    await pasteIn(R.carsHeading);
    await addElement('text', R.carsText, textOpts(R.carsText, R.carsBody, { at: [0.3, 0.3] }));
    await pasteIn(R.carsText);
    await addElement('box', R.carList, {
      name: '車両リスト', parent: R.carsBody, at: [0.5, 0.3],
      beforeShow: () => { R.carItems.forEach((li) => Site.hide(li)); R.carNums.forEach((n) => Site.empty(n)); },
    });
    await cascade(R.carItems, 160);
    await wait(300);
    await editText(R.carNums[0], R.carList, { ax: 0.5, ja: JA.num0 });
    await editText(R.carNums[1], R.carList, { ax: 0.5, ja: JA.num1 });
    Caption.set(3, '車両の説明と台数を入力');
    await editText(R.carNums[2], R.carList, { ax: 0.5, ja: JA.num2 });
    await cascade([R.carsBtn], 100);
    await wait(500);
    Site.clearOverride(R.cars, 'min-height');
    D.deselect();
    Layers.collapse(R.cars);
  });

  scene('recruit', async () => {
    Caption.set(4, '採用情報とメンバー紹介（写真・レイアウト）を作成');
    await addElement('box', R.recruit, {
      name: '採用情報', parent: R.main, at: [0.5, 0.3],
      beforeShow: () => { roomFor(R.recruit); Site.hideAll([R.recEn, R.recH1, ...R.recCopy, R.recEntry, R.memHead, R.memSlider]); Site.noImg(R.recPhoto); },
    });
    await addElement('text', R.recEn, textOpts(R.recEn, R.recruit));
    await typeJaIn(R.recEn, JA.recEn);
    await addElement('text', R.recH1, textOpts(R.recH1, R.recruit));
    await typeJaIn(R.recH1, JA.recH1);
    await cascade(R.recCopy, 160);
    Layers.add(R.recPhotoBox, { name: 'Box', parent: R.recruit });
    Layers.add(R.recPhoto, { name: '集合写真', type: 'image', parent: R.recPhotoBox });
    await dropAsset('02bd7741', R.recPhoto, { at: [0.5, 0.5], name: '集合写真' });
    await wait(400);
    // the photo fills its frame (フィット：カバー) with the faces in view: checked in the image panel
    await hoverUi('#pp-img');
    await wait(1700);
    await Cursor.moveTo(...canvasPoint(0.55, 0.45), { ms: 500 });
    // the ENTRY card overlaps the photo's lower right corner
    await addElement('button', R.recEntry, { name: 'ENTRY', type: 'link', label: 'Link', parent: R.recruit, at: [0.5, 0.5] });
    await wait(500);

    // members from the CMS (the slider shows them in turn)
    await addElement('text', R.memHead, { name: 'メンバー紹介', type: 'text', label: 'Text', parent: R.recruit, at: [0.2, 0.5] });
    await Panels.open('cms');
    await clickUi('#cmsCollection2');
    $('#cmsCollection2').classList.add('open');
    $('#cmsItems2').classList.add('open');
    await wait(800);
    await addElement({ cms: true, src: '#cmsCollection2', name: 'メンバー' }, R.memSlider, {
      name: 'メンバー', type: 'cms', cms: true, label: 'CMS ‣ メンバー', parent: R.recruit, at: [0.5, 0.4],
      cmsName: 'メンバー', cmsLink: 'member/:slug', cmsCount: '5', cmsSort: '並び順（手動）',
      beforeShow: () => R.memCards.forEach((c) => Site.hide(c)),
    });
    await cascade(R.memCards, 140);
    await wait(800);
    Site.clearOverride(R.recruit, 'min-height');
    D.deselect();
    Layers.collapse(R.recruit);

    // news from the CMS
    Caption.set(4, 'お知らせ（CMS）を配置');
    await addElement('box', R.news, {
      name: 'お知らせ', parent: R.main, at: [0.5, 0.3],
      beforeShow: () => { roomFor(R.news); Site.hideAll([R.newsH1, R.newsEn, R.newsBtn, R.newsList]); },
    });
    await addElement('text', R.newsH1, textOpts(R.newsH1, R.news));
    await typeJaIn(R.newsH1, JA.newsH1);
    await addElement('text', R.newsEn, textOpts(R.newsEn, R.news));
    await typeJaIn(R.newsEn, JA.newsEn);
    await cascade([R.newsBtn], 100);
    await Panels.open('cms');
    await clickUi('#cmsCollection');
    $('#cmsCollection').classList.add('open');
    $('#cmsItems').classList.add('open');
    await wait(700);
    await addElement({ cms: true }, R.newsList, {
      name: 'お知らせ', type: 'cms', cms: true, label: 'CMS ‣ お知らせ', parent: R.news, at: [0.5, 0.5],
      cmsName: 'お知らせ', cmsLink: 'news/:slug', cmsCount: '3',
    });
    await wait(900);
    Site.clearOverride(R.news, 'min-height');
    D.deselect();
    Layers.collapse(R.news);
  });

  scene('responsive', async () => {
    Caption.set(5, 'タブレット・スマホの表示を確認');
    await Cursor.moveTo(...canvasPoint(0.62, 0.5));
    await Editor.scrollTo(0, 1600);
    await wait(300);
    // the tablet header was left with the PC links on (mistake 2)
    Site.override(R.navLinks, 'display', 'flex');
    Site.override(R.menuBtn, 'display', 'none');
    await clickUi('#bp-tablet');
    await Editor.setBreakpoint('tablet');
    await Cursor.moveTo(...canvasPoint(0.66, 0.55), { ms: 650 });
    await wait(700);
    Caption.issue('表示崩れ', 'タブレットでヘッダーのリンクが表示されたまま、ロゴと重なっている');
    Issue.show(R.header, '重なり', { inside: true });
    await wait(2700);
    await pointAt(R.navLinks, { ax: 0.5, ay: 0.5 });
    await Cursor.click();
    select(R.navLinks, { name: 'リンク', label: 'Box', vis: true, ov: { display: 'flex' } });
    await wait(700);
    const vis = $('#pp-vis');
    await clickUi(vis);
    vis.classList.add('focus');
    Pop.open(vis, `<div class="pop-title">タブレットでの表示</div><div class="pop-item lk" data-vis="1">表示<small>display: flex</small></div><div class="pop-item lk" data-vis="0">非表示<small>display: none</small></div>`);
    await wait(400);
    await hoverUi('#popover [data-vis="0"]');
    await wait(260);
    await Cursor.click();
    Pop.close();
    Site.clearOverride(R.navLinks, 'display');
    Site.clearOverride(R.menuBtn, 'display');
    Props.clear('display');
    Props.render(true, 'display');
    await wait(400);
    Issue.ok(R.header, '修正', { inside: true });
    Caption.fixed('タブレットではリンクを非表示にして、メニューボタン（≡）に切り替え');
    await readHold(3000);
    Issue.hide();
    D.deselect();
    Caption.set(5, 'タブレット・スマホの表示を確認');
    await Editor.scrollBy(Editor.canvas.clientHeight * 1.1, 2000);
    await wait(600);
    await Editor.scrollTo(0, 1200);
    await clickUi('#bp-mobile');
    await Editor.setBreakpoint('mobile');
    await Cursor.moveTo(...canvasPoint(0.64, 0.55), { ms: 650 });
    await wait(600);
    await Editor.scrollBy(Editor.canvas.clientHeight * 2.4, 5200);
    await wait(700);
    await Editor.scrollTo(0, 1600);
    await clickUi('#bp-pc');
    await Editor.setBreakpoint('pc');
    await wait(800);
  });

  /* ------------------------------------------------ the preview / published site in the browser window */
  const live = () => {
    const lf = $('#liveFrame');
    return { lf, lw: lf.contentWindow, ld: lf.contentDocument };
  };
  const lpt = (el, ax = 0.5, ay = 0.5) => { const { lf } = live(); const f = lf.getBoundingClientRect(), r = el.getBoundingClientRect(); return [f.left + r.left + r.width * ax, f.top + r.top + r.height * ay]; };
  const lvp = (fx, fy) => { const f = live().lf.getBoundingClientRect(); return [f.left + f.width * fx, f.top + f.height * fy]; };
  const lmax = () => { const { ld, lw } = live(); return ld.documentElement.scrollHeight - lw.innerHeight; };
  const lscroll = (y, ms) => { const { lw } = live(); const from = lw.scrollY, to = Math.max(0, Math.min(lmax(), y)); return tween(ms, (e) => lw.scrollTo(0, from + (to - from) * e), Ease.inOutSine); };
  const ltop = (el) => el.getBoundingClientRect().top + live().lw.scrollY;
  let host = 'ponpuya.com';
  /** hover a link of the page in the browser: hand pointer, the page's hover style, and Chrome's link bubble */
  async function hoverLink(el, hold = 1100) {
    const { lw, ld } = live();
    await Cursor.moveTo(...lpt(el));
    Cursor.kind('hand');
    if (lw.__demoHover) lw.__demoHover(el, true);
    const href = el.getAttribute('href') || '';
    $('#cwStatus').innerHTML = /^(tel:|https?:)/.test(href) ? D.esc(href) : `${host}${D.esc(href)}`;
    $('#cwStatus').classList.add('show');
    await wait(hold);
    $('#cwStatus').classList.remove('show');
    if (lw.__demoHover) lw.__demoHover(el, false);
    Cursor.kind('arrow');
    void ld;
  }
  /** the caption follows into the browser window while it is open (it lives on the editor canvas otherwise) */
  const captionTo = (where) => { const c = $('#caption'); (where === 'browser' ? $('.br-view') : Editor.canvas).appendChild(c); };
  /** a red / green frame drawn inside the previewed page (the editor's frame is under the window) */
  function liveMark(el, label, ok) {
    const { ld } = live();
    let st = ld.getElementById('demo-live-mark');
    if (!st) {
      st = ld.createElement('style');
      st.id = 'demo-live-mark';
      st.textContent = `.demo-live-mark{outline:2.5px solid #e5484d!important;outline-offset:6px;border-radius:4px}.demo-live-mark.ok{outline-color:#1e9d57!important}
        .demo-live-tag{position:absolute;z-index:9999;padding:0 11px;height:25px;line-height:25px;border-radius:7px;background:#e5484d;color:#fff;font:700 12.5px/25px "Noto Sans JP",sans-serif;white-space:nowrap;box-shadow:0 4px 12px rgba(229,72,77,.3)}
        .demo-live-tag.ok{background:#1e9d57}`;
      ld.head.appendChild(st);
    }
    ld.querySelectorAll('.demo-live-mark').forEach((n) => n.classList.remove('demo-live-mark', 'ok'));
    ld.querySelectorAll('.demo-live-tag').forEach((n) => n.remove());
    if (!el) return;
    el.classList.add('demo-live-mark');
    el.classList.toggle('ok', !!ok);
    const r = el.getBoundingClientRect(), lw = live().lw;
    const tag = ld.createElement('div');
    tag.className = 'demo-live-tag' + (ok ? ' ok' : '');
    tag.textContent = (ok ? '✓ ' : '⚠ ') + label;
    tag.style.left = r.left + lw.scrollX + r.width - 4 + 'px';
    tag.style.top = r.top + lw.scrollY - 40 + 'px';
    ld.body.appendChild(tag);
  }
  function openBrowser(url) {
    $('#liveUrl').innerHTML = url;
    $('#browser').classList.add('show');
    const { lw } = live();
    if (lw.__demoStart) lw.__demoStart();
    captionTo('browser');
  }
  function closeBrowser() {
    $('#browser').classList.remove('show');
    captionTo('canvas');
  }
  const PREVIEW_URL = 'preview.studio.site<span class="dim">/live/<span class="pii">Wd8xPqA2nV</span></span>';

  scene('linkcheck', async () => {
    Caption.set(6, 'プレビューでリンクとお問い合わせの動作を確認');
    await clickUi('#btnPreview');
    host = 'preview.studio.site/live/●●●●';
    // the previewed page shows the current state: card 2's button still points at /construction
    const { ld } = live();
    const mainBtn = (h) => [...ld.querySelectorAll(`main a[href="${h}"]`)].find((a) => /詳しく/.test(a.textContent));
    const lb2 = mainBtn('/selling');
    lb2.setAttribute('href', '/construction');
    openBrowser(PREVIEW_URL);
    await wait(900);
    const navA = (h) => ld.querySelector(`header a[href="${h}"], .fixed a[href="${h}"]`);
    await hoverLink(navA('/company') || ld.querySelector('a[href="/company"]'), 800);
    await hoverLink(ld.querySelector('a[href="/recruit"]'), 800);
    // the business section: 詳しくはこちら of both cards
    const b1 = mainBtn('/construction'), b2 = lb2;
    await lscroll(ltop(b1) - 560, 1500);
    await wait(400);
    await hoverLink(b1, 1200);
    await hoverLink(b2, 600);
    // Mistake 3 (リンクミス): the duplicated card's button still leads to the concrete placing page
    $('#cwStatus').innerHTML = `${host}/construction`;
    $('#cwStatus').classList.add('show');
    Cursor.kind('hand');
    Caption.issue('リンクミス', '「生コン販売・手配」の「詳しくはこちら」が打設工事のページ（/construction）のまま');
    liveMark(b2, 'リンク先の誤り');
    await wait(3000);
    $('#cwStatus').classList.remove('show');
    Cursor.kind('arrow');
    liveMark(null);

    // back to the editor: set the button's target
    Caption.set(6, 'エディタに戻ってリンク先を修正');
    await clickUi('#browser .cw-tab:not(.on)');
    closeBrowser();
    await wait(500);
    await Editor.ensureVisible(Site.rect(R.c2.btn));
    await pointAt(R.c2.btn, { ax: 0.4, ay: 0.5 });
    await Cursor.click();
    select(R.c2.btn, { type: 'link', name: '詳しくはこちら', label: 'Link' });
    Props.extra.linkLabel = '/construction';
    Props.render(true);
    Issue.show(R.c2.btn, '複製元のリンクのまま');
    await wait(1200);
    Issue.hide();
    await pickLink('/selling', { via: '/construction' });
    restoreHref(R.c2.btn);
    lb2.setAttribute('href', '/selling');
    Issue.ok(R.c2.btn, '修正');
    Caption.fixed('リンク先を「生コン販売・手配」のページ（/selling）に変更');
    await readHold(2800);
    Issue.hide();
    Props.extra.linkLabel = '';
    D.deselect();

    // preview again: the button, then the ways to get in touch
    Caption.set(6, 'プレビューでリンクとお問い合わせの動作を確認');
    await clickUi('#btnPreview');
    openBrowser(PREVIEW_URL);
    await wait(700);
    await hoverLink(b2, 1000);
    liveMark(b2, '修正', true);
    await wait(1400);
    liveMark(null);
    const contact = ld.querySelector('a[href="tel:090-3276-5754"]');
    await lscroll(ltop(contact) - 260, 2200);
    await wait(400);
    await hoverLink(contact, 1300);
    const lines = ld.querySelectorAll('a[href^="https://lin.ee"]');
    await hoverLink(lines[lines.length - 1], 1200);
    const form = [...ld.querySelectorAll('a[href="/contact"]')].find((a) => /フォーム/.test(a.textContent));
    await hoverLink(form, 1300);
    // the SNS cards just above
    const tiktok = ld.querySelector('a[href*="tiktok.com"]'), insta = ld.querySelector('a[href*="instagram.com"]');
    await lscroll(ltop(tiktok) - 300, 1200);
    await hoverLink(tiktok, 1100);
    await hoverLink(insta, 1100);
    await lscroll(0, 1600);
    await hoverLink(ld.querySelector('a[href="/contact"]'), 1100);
    await wait(400);
    await clickUi('#browser .cw-tab:not(.on)');
    closeBrowser();
    await wait(500);
  });

  scene('publish', async () => {
    Caption.set(7, 'サイトを公開');
    await clickUi('#btnPublish');
    $('#publishModal').classList.add('show');
    await wait(1100);
    await clickUi('#btnDoPublish');
    const btn = $('#btnDoPublish');
    btn.classList.add('loading');
    btn.textContent = '公開中…';
    $('#btnCancel').style.visibility = 'hidden';
    $('#mProgress').classList.add('show');
    await tween(2200, (e) => { $('#mBar').style.width = (e * 100).toFixed(1) + '%'; }, Ease.inOutSine);
    $('#mProgress').classList.remove('show');
    $('#mSuccess').classList.add('show');
    const st = $('#mStatus');
    st.className = 'pill pill-green';
    st.textContent = '公開中';
    btn.style.display = 'none';
    $('#btnOpenSite').style.display = 'inline-flex';
    await wait(1200);
    await clickUi('#btnOpenSite');
    await wait(150);
    Caption.hide();
    $('#publishModal').classList.remove('show');
    host = 'ponpuya.com';
    live().lw.scrollTo(0, 0);
    openBrowser('ponpuya.com');
    await wait(600);
  });

  scene('live', async () => {
    const { ld } = live();
    await Cursor.moveTo(...lvp(0.6, 0.55));
    await wait(1600);
    const biz = [...ld.querySelectorAll('main a[href="/selling"]')].find((a) => /詳しく/.test(a.textContent));
    await lscroll(ltop(biz) - 520, 2400);
    await wait(500);
    await hoverLink(biz, 1500);
    await Cursor.moveTo(...lvp(0.78, 0.5), { ms: 600 });
    await lscroll(ltop(biz) + 700, 2000);
    await wait(1200);
    // the members from the CMS
    const member = [...ld.querySelectorAll('a[href^="/member/"]')].find((a) => { const r = a.getBoundingClientRect(); return r.left > 60 && r.right < innerWidth - 60; });
    await lscroll(ltop(member) - 260, 2000);
    await wait(500);
    if (member) await hoverLink(member, 1400);
    await Cursor.moveTo(...lvp(0.7, 0.4), { ms: 600 });
    await wait(600);
    await lscroll(lmax(), 2600);
    await wait(900);
    await lscroll(0, 2600);
    await Cursor.moveTo(...lvp(0.62, 0.6), { ms: 900 });
    await wait(3800);
  });

  /* ============================================================ runner (shared/stage.js) */
  window.Stage.run({
    scenes: SCENES,
    async prepare(fast) {
      const doc = await D.boot(fast);
      R = resolve(doc);
      window.__R = R;
      window.__JA = JA;
      buildCmsPanel();
      const jaText = JSON.stringify(JA) + Object.values(JA).flat(2).filter((x) => x && x.r).map((x) => D.romajiToKana(x.r).kana).join('');
      const jaCalls = Object.values(JA).flat(2).filter((x) => x && x.call).map((x) => x.call.toString()).join('');
      await D.preloadFonts(
        document.body.textContent + D.uiStrings() + SCENES.map((x) => x.fn.toString()).join('') + jaText + jaCalls + doc.body.textContent +
          LINKS.map((l) => l.join(' ')).join(' ') + pickLink.toString() + liveMark.toString(),
        jaText + '0123456789&-〒　BUSINESSCONCRETEPLACINGWORKSALESANDARRANGEMENTOFREADY-MIXEDPOSSESSIONCARSRECRUITNEWS',
        doc.body.textContent
      );
      prepareExisting();
      await window.SiteFrame.load($('#liveFrame'), 'live');
    },
    onStart() { $('#hint').style.transition = 'none'; $('#hint').classList.add('hide'); },
  });
})();
