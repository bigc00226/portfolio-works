/*
 * Timeline of the demo: building the ワイエス建装 corporate site in a STUDIO-style editor — the page structure,
 * header, main visual, greeting, business / works with photos, CMS news, company profile, the contact form and the
 * way to it, the tablet / mobile check, publishing, then browsing the published site.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?speed=1.25   ?from=4 (start at scene 4)   ?captions=0   ?autoplay=1
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$, wait, tween, Ease, Cursor, Site, Editor, Layers, Props, Panels, Caption, Keycap, Clock, Pop } = D;
  const { clickUi, hoverUi, pointAt, select, addElement, dropAsset, pickColor, pickFont, cascade } = D;
  const { Issue, Toast, KeyStrip, Ime } = D;
  /** hold for reading a "✓ 修正" caption: keeps its speed-1 length in real time when ?speed is above 1 */
  const readHold = (ms) => wait(ms * Math.max(1, Clock.speed));

  /* ------------------------------------------------ Japanese typing scripts (see yoshitake-koumuten/js/scenario.js)
   *   {r, segs, predict, yomi}  romaji → kana → Space converts → Enter   ·  {r, tab, predict, yomi}  pick a prediction
   *   {direct}  half-width input   ·  {key, n}  ·  {mark, ok} / {unmark} / {wait} / {call}  the mistake episode
   */
  const JA = {
    // the left side text: 「建装」 is converted to 「喧騒」 — the mistake episode is set in below
    sideL: null,
    sideR: [{ r: 'kyoumo,konomachitotomoni', segs: ['今日も、', 'この', '街と', { c: ['共に', 'ともに', '友に'], p: 1 }],
      predict: ['今日', '今日も', '今日は'], yomi: ['きょう', 'きょうも', 'きょうは'] }],
    logo: [{ direct: 'YSK' }],
    nav: [
      [{ r: 'goaisatsu', segs: [{ c: ['ご挨拶', '御挨拶', 'ごあいさつ'] }],
        predict: ['ご挨拶', 'ご挨拶申し上げます'], yomi: ['ごあいさつ', 'ごあいさつもうしあげます'] }],
      [{ r: 'watashitachinoshigoto', segs: ['私たちの', '仕事'],
        predict: ['私', '私たち', '私たちの'], yomi: ['わたし', 'わたしたち', 'わたしたちの'] }],
      [{ r: 'oshirase', segs: [{ c: ['お知らせ', 'お報せ', 'おしらせ'] }],
        predict: ['お知らせ', 'お知らせします'], yomi: ['おしらせ', 'おしらせします'] }],
      [{ r: 'kaishajouhou', segs: ['会社情報'], predict: ['会社', '会社情報', '会社案内'], yomi: ['かいしゃ', 'かいしゃじょうほう', 'かいしゃあんない'] }],
      [{ r: 'otoiawase', segs: [{ c: ['お問い合わせ', 'お問合せ', 'お問い合せ'] }],
        predict: ['お問い合わせ', 'お問い合わせ先'], yomi: ['おといあわせ', 'おといあわせさき'] }],
    ],
    mvTitle: [{ direct: 'CONSTRUCTION' }, { key: 'Enter' }, { direct: 'AND' }, { key: 'Enter' }, { direct: 'INTERIOR DESIGN' }],
    msgLabel: [{ r: 'goai', tab: 0, predict: ['ご挨拶', 'ご愛顧'], yomi: ['ごあいさつ', 'ごあいこ'] }],
    // the IME offers the phrase typed into the side text a minute ago
    msgHeading: [{ r: 'kyoumo', tab: 0, predict: ['今日も、この街とともに', '今日も'], yomi: ['きょうも、このまちとともに', 'きょうも'] }],
    worksLabel: [{ r: 'watashi', tab: 0, predict: ['私たちの仕事', '私', '私たち'], yomi: ['わたしたちのしごと', 'わたし', 'わたしたち'] }],
    b1num: [{ direct: '1' }],
    b1title: [{ r: 'juutakukenchiku', segs: ['住宅', '建築'], predict: ['住宅', '住宅ローン'], yomi: ['じゅうたく', 'じゅうたくろーん'] }],
    b2num: [{ direct: '2' }],
    b2title: [
      { r: 'interiadezainn', segs: [{ c: ['インテリアデザイン', 'いんてりあでざいん'] }],
        predict: ['インテリア', 'インテリアデザイン'], yomi: ['いんてりあ', 'いんてりあでざいん'] },
      { key: 'Shift+Space' },
    ],
    infoLabel: [{ r: 'oshi', tab: 0, predict: ['お知らせ', '教え'], yomi: ['おしらせ', 'おしえ'] }],
    coLabel: [{ r: 'kaisha', tab: 0, predict: ['会社情報', '会社', '会社案内'], yomi: ['かいしゃじょうほう', 'かいしゃ', 'かいしゃあんない'] }],
    coSign: [
      { r: 'daihyoutorishimariyaku', segs: ['代表取締役'],
        predict: ['代表', '代表取締役', '代表取締役社長'], yomi: ['だいひょう', 'だいひょうとりしまりやく', 'だいひょうとりしまりやくしゃちょう'] },
      { key: 'Shift+Space' },
      { r: 'yamadatarou', segs: ['山田', '太郎'], predict: ['山田', '山田さん'], yomi: ['やまだ', 'やまださん'] },
      { key: 'Enter' },
    ],
    // the IME learned 建装 when the side text was fixed, so it now comes first
    coName: [{ r: 'waiesukensou', segs: [{ c: ['ワイエス', 'わいえす'] }, { c: ['建装', '喧騒'] }],
      predict: ['ワイエス建装'], yomi: ['わいえすけんそう'] }],
    cTitle: [{ r: 'otoi', tab: 0, predict: ['お問い合わせ', 'お問い合わせ先'], yomi: ['おといあわせ', 'おといあわせさき'] }, { key: 'Enter' }],
  };

  // Mistake 1 (入力ミス): 「建装会社」 is converted to 「喧騒会社」 and committed, then noticed, deleted and re-converted.
  JA.sideL = [
    { r: 'sougyougojuunenn', segs: ['創業', '五十年'], predict: ['創業', '創業者', '創業以来'], yomi: ['そうぎょう', 'そうぎょうしゃ', 'そうぎょういらい'] },
    { key: 'Shift+Space' },
    { r: 'kagoshimakennkagoshimashino', segs: ['鹿児島県', '鹿児島市の'], predict: ['鹿児島', '鹿児島県', '鹿児島市'], yomi: ['かごしま', 'かごしまけん', 'かごしまし'] },
    { r: 'kensougaisha', segs: ['喧騒', '会社'], predict: ['検索', '建設', '建設会社'], yomi: ['けんさく', 'けんせつ', 'けんせつがいしゃ'] },
    { wait: 450 },
    { mark: 4 },
    {
      call: async (el) => {
        // the pointer moves off to the right first (the text is vertical: the IME windows open to its right)
        const m = Site.rect(el.querySelector('.demo-mark'));
        await Cursor.moveTo(Math.max(Cursor.x, m.left + m.width + 170), m.top + m.height / 2, { ms: 420, bend: 0.03 });
        Caption.issue('入力ミス', '「建装会社」が「喧騒会社」と誤変換されたまま確定してしまった');
        Issue.show(el.querySelector('.demo-mark'), '誤変換');
        await wait(2600);
      },
    },
    // the frame goes as the marked text is deleted (its target is the text being removed)
    { call: async () => { Issue.hide(); } },
    { key: 'Backspace', n: 4 },
    { r: 'kensou', segs: [{ c: ['喧騒', '建装', '県葬', 'けんそう', 'ケンソウ'], p: 1 }], candHold: 1100,
      predict: ['検索', '建設'], yomi: ['けんさく', 'けんせつ'] },
    { r: 'gaisha', segs: [{ c: ['会社', '外車', 'がいしゃ'] }], predict: ['会社', '会社員'], yomi: ['がいしゃ', 'がいしゃいん'] },
    { mark: 4, ok: true },
    {
      call: async (el) => {
        Issue.ok(el.querySelector('.demo-mark'), '修正');
        Caption.fixed('文字を消して入力し直し、変換候補から「建装」を選んで修正');
        await readHold(3200);
        Issue.hide();
      },
    },
    { unmark: true },
  ];

  /* ------------------------------------------------ resolve the real page */
  function resolve(doc) {
    const q = (sel, root) => (root || doc).querySelector(sel);
    const kids = (el) => (el ? Array.from(el.children) : []);
    const R = {};
    R.root = q('.StudioCanvas > .sd');
    [R.fixL, R.fixR, R.menuBtn, R.header, R.mv, R.message, R.works, R.info, R.banner, R.company, R.contact, R.footer] = kids(R.root);
    R.sideL = R.fixL.firstElementChild;
    R.sideR = R.fixR.firstElementChild;

    [R.logoWrap, R.nav] = kids(R.header);
    R.logo = R.logoWrap.firstElementChild;
    R.navUl = R.nav.firstElementChild;
    R.navItems = kids(R.navUl);
    R.navLinks = R.navItems.map((li) => li.firstElementChild);

    R.mvImage = R.mv.firstElementChild;
    R.mvTitleBox = R.mvImage.children[0];
    R.mvTitle = R.mvTitleBox.firstElementChild;

    [R.msgLabelBox, R.msgCol, R.wide] = kids(R.message);
    R.msgLabel = R.msgLabelBox.firstElementChild;
    [R.msgHeading, R.msgHeadingSp, R.msgText, R.msgImg] = kids(R.msgCol);
    R.wideImage = R.wide.firstElementChild;

    R.worksInner = R.works.firstElementChild;
    [R.worksLabelBox, R.worksCol] = kids(R.worksInner);
    R.worksLabel = R.worksLabelBox.firstElementChild;
    [R.block1, R.block2, R.moreRow] = kids(R.worksCol);
    R.more = R.moreRow.firstElementChild;
    const blk = (b) => {
      const [head, text, row] = kids(b);
      const [numWrap, title] = kids(head);
      return { head, num: numWrap.children[0], slash: numWrap.children[1], title, text, row, imgs: kids(row) };
    };
    R.b1 = blk(R.block1);
    R.b2 = blk(R.block2);

    [R.infoLabelBox, R.iList] = kids(R.info);
    R.infoLabel = R.infoLabelBox.firstElementChild;
    R.cards = kids(R.iList);
    R.cardInner = R.cards.map((a) => a.firstElementChild);

    R.bannerImage = R.banner.firstElementChild;

    R.coInner = R.company.firstElementChild;
    [R.coLabelBox, R.coBody] = kids(R.coInner);
    R.coLabel = R.coLabelBox.firstElementChild;
    [R.coTop, R.coTable] = kids(R.coBody);
    const topRow = R.coTop.firstElementChild;
    [R.coPhoto, R.coTextBox] = kids(topRow);
    [R.coText, R.coSign] = kids(R.coTextBox);
    R.coRows = kids(R.coTable);
    R.coName = R.coRows[0].children[1];

    [R.cTitle, R.cLead, R.cLeadSp, R.form] = kids(R.contact);
    R.formItems = kids(R.form);

    R.fItems = kids(R.footer);
    return R;
  }

  /** text layer name = first line of the text, like the editor does ('テキスト' while it is still empty) */
  function firstLine(html) {
    const s = D.plainOf(html).split('\n')[0].trim();
    return s ? (s.length > 18 ? s.slice(0, 18) + '…' : s) : 'テキスト';
  }
  const shownName = (el) => firstLine(el.innerHTML);
  const textOpts = (el, parent, extra = {}) =>
    Object.assign({ empty: true, type: 'text', name: 'テキスト', label: 'Text', parent, visible: { bottomPad: 330 } }, extra);
  /** like a person, move the mouse out of the way before typing (IME windows open below / right of the text) */
  async function moveAside(el) {
    const cur = el.innerHTML;
    el.innerHTML = Site.original(el);
    const r = Site.rect(el);
    const vertical = /vertical/.test(Site.win.getComputedStyle(el).writingMode);
    el.innerHTML = cur;
    const c = Editor.canvas.getBoundingClientRect();
    let x, y;
    if (vertical) {
      if (Cursor.x < r.left - 12 && Cursor.x > c.left + 10) return;
      x = r.left - 46;
      if (x < c.left + 24) x = Math.min(r.left + r.width + 330, c.right - 24);
      y = D.clamp(Cursor.y, r.top + 10, r.top + Math.max(10, r.height - 10));
    } else {
      if (Cursor.y < r.top - 12 && Cursor.y > c.top + 10) return;
      y = r.top - 46;
      if (y < c.top + 24) y = Math.min(r.top + r.height + 270, c.bottom - 24);
      x = D.clamp(Cursor.x, r.left + 30, r.left + r.width + 40);
    }
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
    else if (o.ja) await typeJaIn(el, o.ja);
    else { await moveAside(el); await Site.type(el, { cps: o.cps || 12 }); D.syncName(el, D.plainOf(Site.original(el))); }
  }
  function canvasPoint(fx, fy) {
    const r = Editor.canvas.getBoundingClientRect();
    return [r.left + r.width * fx, r.top + r.height * fy];
  }
  /** the 「リンク」 field of the properties panel: a list of the site's pages and of this page's sections */
  const LINKS = [
    ['page', 'Home', '/'], ['page', 'works', '/works'], ['page', 'privacy-policy', '/privacy-policy'],
    ['sec', 'ご挨拶', '/#message'], ['sec', '私たちの仕事', '/#works'], ['sec', 'お知らせ', '/#info'],
    ['sec', '会社情報', '/#company'], ['sec', 'お問い合わせ', '/#contact'],
  ];
  async function pickLink(href, o = {}) {
    const f = $('#pp-link');
    await clickUi(f);
    f.classList.add('focus');
    const row = ([kind, name, h]) =>
      `<div class="pop-item lk" data-link="${h}">${D.icon(kind === 'page' ? 'file' : 'link')}${D.esc(name)}<small>${h}</small></div>`;
    Pop.open(f, `<div class="pop-title">ページ</div>${LINKS.filter((l) => l[0] === 'page').map(row).join('')}` +
      `<div class="pop-title">このページのセクション</div>${LINKS.filter((l) => l[0] === 'sec').map(row).join('')}`);
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
  /** an empty section collapses to its paddings: hold it open while its content is being added, so the first
   *  text dropped in stays on the page (the frame ends with the page) */
  const roomFor = (sec) => Site.override(sec, 'min-height', '460px');

  /** category / date / title / cover of a post card in the CMS list (read from the captured page) */
  function cmsItem(card) {
    const ps = Array.from(card.querySelectorAll('p'));
    const img = card.querySelector('img');
    return { tag: ps[0] ? ps[0].textContent.trim() : '', date: ps[1] ? ps[1].textContent.trim() : '', title: ps[2] ? ps[2].textContent.trim() : '', cover: img ? img.getAttribute('src') : '' };
  }
  function buildCmsPanel() {
    const items = R.cards.map(cmsItem);
    $('#cmsCount').textContent = items.length;
    $('#cmsItems').innerHTML = items.map((it) => `
      <div class="cms-item">
        <div class="cms-thumb"${it.cover ? ` style="background-image:url('${it.cover}')"` : ''}></div>
        <div class="cms-meta">
          <div class="cms-title">${D.esc(it.title)}</div>
          <div class="cms-sub"><span class="pill pill-green">公開</span>${D.esc(it.tag)}・${D.esc(it.date)}</div>
        </div>
      </div>`).join('');
  }

  /** put the page into its "empty project" state */
  function prepareEmptyPage() {
    Site.hideAll(Array.from(R.root.children));
    Site.hideAll([R.logoWrap, R.nav, ...R.navItems]);
    Site.noImg(R.mvImage);
    Site.hide(R.mvTitleBox);
    Site.hideAll([R.msgLabelBox, R.msgHeading, R.msgText, R.msgImg, R.wide]);
    Site.noImg(R.msgImg);
    Site.hideAll([R.worksLabelBox, R.block1, R.block2, R.moreRow]);
    Site.hideAll([R.infoLabelBox, R.iList]);
    Site.hideAll([R.coLabelBox, R.coPhoto, R.coText, R.coSign, R.coTable]);
    Site.noImg(R.coPhoto);
    // the news cards stay side by side at every width until the mobile check (mistake 3)
    R.cardInner.forEach((c) => Site.override(c, 'flex-direction', 'row'));
    // pages not created yet
    $$('.pg-row[data-page="works"], .pg-row[data-page="privacy"]').forEach((r) => r.classList.add('demo-off'));
    Site.doc.documentElement.classList.add('demo-ready');
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', async () => {
    Caption.set('', 'STUDIOで「ワイエス建装」のコーポレートサイトを制作');
    await wait(900);
    await Cursor.moveTo(...canvasPoint(0.5, 0.45));
    await wait(1400);
  });

  scene('pages', async () => {
    Caption.set(1, 'サイトのページ構成を作成');
    await Panels.open('pages');
    await wait(400);
    await hoverUi('.pg-row[data-page="home"]');
    await wait(600);
    // add the 施工実績 page and the privacy policy page, typing their URLs
    const add = async (page, name) => {
      await clickUi('.lp[data-panel="pages"] .lp-head-ic');
      const row = $(`.pg-row[data-page="${page}"]`);
      const label = row.querySelector('span'), small = row.querySelector('small');
      label.textContent = '';
      small.textContent = '/';
      row.classList.remove('demo-off');
      row.classList.add('new', 'editing');
      await wait(450);
      await Ime.setMode(false);
      for (const ch of name) {
        KeyStrip.key(ch);
        label.textContent += ch;
        small.textContent = '/' + label.textContent;
        await wait(95 + Math.random() * 80);
      }
      await wait(280);
      KeyStrip.special('Enter');
      row.classList.remove('editing');
      KeyStrip.idleHide();
      Toast.show('success', `ページ「${name}」を追加しました`, 1600);
      await wait(900);
    };
    await add('works', 'works');
    await add('privacy', 'privacy-policy');
    await hoverUi('.pg-row[data-page="info"]');
    await wait(1100);
    await hoverUi('.pg-row[data-page="home"]');
    await Cursor.click();
    await wait(400);
    await Panels.open('layers');
    await wait(300);
  });

  scene('header', async () => {
    Caption.set(2, 'ヘッダー・ナビゲーションを作成');
    await addElement('box', R.header, { name: 'Header', label: 'Header', at: [0.5, 0.6] });
    await addElement('text', R.logo, textOpts(R.logo, R.header, {
      at: [0.5, 0.5],
      prepare: () => Site.show(R.logoWrap, null),
      beforeShow: () => Site.override(R.logo, 'font-family', "'Noto Sans JP'"),
      ov: { 'font-family': "'Noto Sans JP'" },
    }));
    await typeJaIn(R.logo, JA.logo);
    await pickFont('GFS Didot', () => { Site.clearOverride(R.logo, 'font-family'); Props.clear('font-family'); });

    // navigation: a list with the first link, then duplicate it
    const [first, ...rest] = R.navItems;
    await addElement('box', R.nav, {
      name: 'Nav', parent: R.header, at: [0.5, 0.5],
      prepare: () => Site.show(first, null),
      onDrop: () => Site.empty(R.navLinks[0]),
    });
    Layers.add(R.navLinks[0], { name: 'テキスト', type: 'link', parent: R.nav });
    select(R.navLinks[0], { type: 'link', name: 'テキスト', label: 'Text' });
    await typeJaIn(R.navLinks[0], JA.nav[0]);
    for (let i = 0; i < rest.length; i++) {
      const li = rest[i], a = R.navLinks[i + 1], prev = R.navLinks[i];
      await Keycap.show(['Ctrl', 'D'], 650);
      Site.override(a, 'min-width', 'max-content');
      Site.setHTML(a, prev.innerHTML);
      Site.show(li, 'pop');
      Layers.add(a, { name: shownName(a), type: 'link', parent: R.nav });
      select(a, { type: 'link', name: shownName(a), label: 'Text' });
      await wait(200);
      await pointAt(a, { ax: 0.5, ay: 0.5 });
      await Cursor.dblclick();
      Site.selectAll(a);
      await wait(320);
      await typeJaIn(a, JA.nav[i + 1]);
      Site.clearOverride(a, 'min-width');
    }
    await wait(300);
    D.deselect();
    Layers.collapse(R.header);

    // the two vertical texts fixed at the sides of the screen (the left one holds the mistake episode)
    Caption.set(2, '左右の縦書きテキストを配置');
    await Editor.scrollTo(0, 120);
    await addElement('box', R.fixL, { name: 'Box', at: [0.5, 0.5], beforeShow: () => Site.hide(R.sideL) });
    await addElement('text', R.sideL, textOpts(R.sideL, R.fixL, { at: [0.5, 0.2], visible: {} }));
    await hoverUi('#pp-wm span:last-child');
    await wait(500);
    await typeJaIn(R.sideL, JA.sideL);
    Caption.set(2, '左右の縦書きテキストを配置');
    await addElement('box', R.fixR, { name: 'Box', at: [0.5, 0.5], beforeShow: () => Site.hide(R.sideR) });
    await addElement('text', R.sideR, textOpts(R.sideR, R.fixR, { at: [0.5, 0.2], visible: {} }));
    await typeJaIn(R.sideR, JA.sideR);
    Site.show(R.menuBtn, null);
    await wait(400);
    D.deselect();
  });

  scene('mv', async () => {
    Caption.set(3, 'メインビジュアルを配置');
    await addElement({ asset: '23448c44' }, R.mv, {
      name: 'Box', at: [0.5, 0.45],
      child: { el: R.mvImage, name: 'Image', type: 'image', label: 'Image' },
      onDrop: () => Site.setImg(R.mvImage),
    });
    await wait(500);
    await addElement('text', R.mvTitle, textOpts(R.mvTitle, R.mvImage, {
      at: [0.5, 0.3],
      prepare: () => Site.show(R.mvTitleBox, null),
      beforeShow: () => { Site.override(R.mvTitle, 'font-family', "'Noto Sans JP'"); Site.override(R.mvTitle, 'color', '#000000'); },
      ov: { 'font-family': "'Noto Sans JP'", color: '#000000' },
    }));
    await typeJaIn(R.mvTitle, JA.mvTitle);
    await pickFont('Rubik', () => { Site.clearOverride(R.mvTitle, 'font-family'); Props.clear('font-family'); });
    await pickColor('#pp-color', 'cfffffff', () => { Site.clearOverride(R.mvTitle, 'color'); Props.clear('color'); });
    await wait(500);
    D.deselect();
    Layers.collapse(R.mv);
  });

  scene('message', async () => {
    Caption.set(4, '会社紹介（ご挨拶）を作成');
    await addElement('box', R.message, { name: 'Box', at: [0.5, 0.3], beforeShow: () => roomFor(R.message) });
    await addElement('text', R.msgLabel, textOpts(R.msgLabel, R.message, { prepare: () => Site.show(R.msgLabelBox, null) }));
    await typeJaIn(R.msgLabel, JA.msgLabel);
    await addElement('text', R.msgHeading, textOpts(R.msgHeading, R.message, { at: [0.35, 0.5] }));
    await typeJaIn(R.msgHeading, JA.msgHeading);
    await addElement('text', R.msgText, textOpts(R.msgText, R.message, { at: [0.3, 0.3] }));
    await pasteIn(R.msgText);
    await addElement('image', R.msgImg, { name: 'Image', type: 'image', label: 'Image', parent: R.message, at: [0.5, 0.4] });
    await dropAsset('unsplash', R.msgImg, { at: [0.5, 0.45] });
    await wait(400);
    await addElement({ asset: '89faf744' }, R.wide, {
      name: 'Box', parent: R.message, at: [0.5, 0.4],
      child: { el: R.wideImage, name: 'Image', type: 'image', label: 'Image' },
    });
    await wait(500);
    Site.clearOverride(R.message, 'min-height');
    D.deselect();
    Layers.collapse(R.message);
  });

  scene('works', async () => {
    Caption.set(5, '事業内容・施工写真のセクションを作成');
    await addElement('box', R.works, { name: 'Box', at: [0.5, 0.5], beforeShow: () => roomFor(R.works) });
    await addElement('text', R.worksLabel, textOpts(R.worksLabel, R.works, { prepare: () => Site.show(R.worksLabelBox, null) }));
    await typeJaIn(R.worksLabel, JA.worksLabel);

    const b1 = R.b1, b2 = R.b2;
    await addElement('box', R.block1, {
      name: 'Box', parent: R.works, at: [0.5, 0.45],
      beforeShow: () => { [b1.num, b1.title, b1.text].forEach((e) => Site.empty(e)); b1.imgs.forEach((e) => Site.noImg(e)); },
    });
    await editText(b1.num, R.block1, { ax: 0, ja: JA.b1num });
    await editText(b1.title, R.block1, { ax: 0, ja: JA.b1title });
    await editText(b1.text, R.block1, { ax: 0, paste: true });
    Layers.add(b1.row, { name: '施工写真', parent: R.block1 });
    const ids1 = ['68386d2e', 'f2d9f61e', '1e7a42a6'];
    for (let i = 0; i < 3; i++) await dropAsset(ids1[i], b1.imgs[i], { after: 120 });
    await wait(300);

    // duplicate the block and rewrite it as 2
    await pointAt(R.block1, { ax: 0.985, ay: 0.12 });
    await Cursor.click();
    select(R.block1, { name: 'Box', label: 'Box' });
    await wait(350);
    await Keycap.show(['Ctrl', 'D']);
    Site.setHTML(b2.num, b1.num.innerHTML);
    Site.setHTML(b2.title, b1.title.innerHTML);
    Site.setHTML(b2.text, b1.text.innerHTML);
    b2.imgs.forEach((im, i) => Site.bgOverride(im, Site.imageUrl(b1.imgs[i])));
    Site.show(R.block2, 'pop');
    Layers.collapse(R.block1);
    Layers.add(R.block2, { name: 'Box', parent: R.works });
    select(R.block2, { name: 'Box', label: 'Box' });
    await wait(500);
    await Editor.ensureVisible(Site.rect(R.block2));
    await editText(b2.num, R.block2, { ax: 0.5, selectAll: true, ja: JA.b2num });
    await editText(b2.title, R.block2, { ax: 0.4, selectAll: true, ja: JA.b2title });
    await editText(b2.text, R.block2, { ax: 0.3, selectAll: true, paste: true });
    Layers.add(b2.row, { name: '施工写真', parent: R.block2 });
    const ids2 = ['e7c7aed6', '2a5bd354', '22cf95da'];
    for (let i = 0; i < 3; i++) await dropAsset(ids2[i], b2.imgs[i], { after: 120 });
    await wait(300);

    // 「view more」 leads to the 施工実績 page made at the start
    Caption.set(5, '「view more」から施工実績ページへリンク');
    await addElement('button', R.moreRow, {
      name: 'view more', type: 'link', label: 'Link', parent: R.works, at: [0.85, 0.5],
      child: { el: R.more, name: 'view more', type: 'link', label: 'Link' },
    });
    Props.extra.linkLabel = '未設定';
    Props.render(true);
    await wait(400);
    await pickLink('/works');
    await wait(500);
    Props.extra.linkLabel = '';
    Site.clearOverride(R.works, 'min-height');
    D.deselect();
    Layers.collapse(R.works);
  });

  scene('cms', async () => {
    Caption.set(6, 'CMSと連携した「お知らせ」一覧');
    await addElement('box', R.info, { name: 'Box', at: [0.5, 0.3], beforeShow: () => roomFor(R.info) });
    await addElement('text', R.infoLabel, textOpts(R.infoLabel, R.info, { prepare: () => Site.show(R.infoLabelBox, null) }));
    await typeJaIn(R.infoLabel, JA.infoLabel);
    await Panels.open('cms');
    await clickUi('#cmsCollection');
    $('#cmsCollection').classList.add('open');
    $('#cmsItems').classList.add('open');
    await wait(900);
    await addElement({ cms: true }, R.iList, {
      name: 'お知らせ', type: 'cms', cms: true, label: 'CMS ‣ お知らせ', parent: R.info, at: [0.5, 0.3],
      beforeShow: () => R.cards.forEach((c) => Site.hide(c)),
    });
    await wait(350);
    // the list fills itself with the published posts (category · date · title · excerpt · cover)
    for (const c of R.cards) {
      Site.show(c, 'pop');
      Layers.add(c, { name: cmsItem(c).title || 'Item', type: 'link', parent: R.iList, cms: true });
      await wait(160);
    }
    await wait(1100);
    await pointAt(R.cards[0], { ax: 0.6, ay: 0.4 });
    await wait(800);
    Site.clearOverride(R.info, 'min-height');
    D.deselect();
    Layers.collapse(R.info);
  });

  scene('company', async () => {
    Caption.set(7, '会社情報を作成');
    await addElement({ asset: '582823f4' }, R.banner, {
      name: 'Box', at: [0.5, 0.45],
      child: { el: R.bannerImage, name: 'Image', type: 'image', label: 'Image' },
    });
    await wait(400);
    D.deselect();
    Layers.collapse(R.banner);

    await addElement('box', R.company, { name: 'Box', at: [0.5, 0.3], beforeShow: () => roomFor(R.company) });
    await addElement('text', R.coLabel, textOpts(R.coLabel, R.company, { prepare: () => Site.show(R.coLabelBox, null) }));
    await typeJaIn(R.coLabel, JA.coLabel);
    await addElement('image', R.coPhoto, { name: '代表写真', type: 'image', label: 'Image', parent: R.company, at: [0.5, 0.4] });
    await dropAsset('a387d9da', R.coPhoto, { at: [0.5, 0.45], name: '代表写真' });
    await addElement('text', R.coText, textOpts(R.coText, R.company, { at: [0.3, 0.25] }));
    await pasteIn(R.coText);
    await addElement('text', R.coSign, textOpts(R.coSign, R.company, { at: [0.3, 0.5] }));
    await typeJaIn(R.coSign, JA.coSign);
    // the company table: the rows come in, the company name is typed (建装 now converts right away)
    await addElement('box', R.coTable, {
      name: '会社概要', parent: R.company, at: [0.4, 0.3],
      beforeShow: () => { R.coRows.forEach((r) => Site.hide(r)); Site.empty(R.coName); },
    });
    await cascade(R.coRows, 140);
    await wait(300);
    await editText(R.coName, R.coTable, { ax: 0.1, ja: JA.coName });
    await wait(500);
    Site.clearOverride(R.company, 'min-height');
    D.deselect();
    Layers.collapse(R.company);
  });

  scene('contact', async () => {
    Caption.set(8, 'お問い合わせフォームと導線を作成');
    await addElement('box', R.contact, {
      name: 'お問い合わせ', at: [0.5, 0.3],
      beforeShow: () => {
        [R.cTitle, R.cLead, R.form].forEach((e) => Site.hide(e));
        Site.override(R.contact, 'background', '#ffffff');
      },
      ov: { background: 'transparent' },
    });
    await pickColor('#pp-fill', 'cf5f5f5a', () => { Site.clearOverride(R.contact, 'background'); Props.clear('background'); });
    await addElement('text', R.cTitle, textOpts(R.cTitle, R.contact));
    await typeJaIn(R.cTitle, JA.cTitle);
    await addElement('text', R.cLead, textOpts(R.cLead, R.contact));
    await pasteIn(R.cLead);
    await addElement('form', R.form, {
      name: 'お問い合わせフォーム', type: 'form', label: 'Form', parent: R.contact, at: [0.5, 0.3],
      beforeShow: () => R.formItems.forEach((i) => Site.hide(i)),
    });
    await cascade(R.formItems.slice(0, -2), 140);
    await Editor.ensureVisible(Site.measure(R.formItems[R.formItems.length - 1]), { bottomPad: 190, ms: 600 });
    await cascade(R.formItems.slice(-2), 140);
    await wait(500);
    D.deselect();
    Layers.collapse(R.contact);

    await addElement('box', R.footer, {
      name: 'Footer', label: 'Footer', at: [0.5, 0.5],
      beforeShow: () => { Site.override(R.footer, 'background', '#ffffff'); R.fItems.forEach((i) => Site.hide(i)); },
      ov: { background: 'transparent' },
    });
    await pickColor('#pp-fill', 'c3232320', () => { Site.clearOverride(R.footer, 'background'); Props.clear('background'); });
    await cascade(R.fItems, 150);
    await wait(600);
    D.deselect();
    Layers.collapse(R.footer);

    // the way to the form: the header's 「お問い合わせ」 jumps to the contact section
    Caption.set(8, 'ナビの「お問い合わせ」からフォームへ移動できるようにリンクを設定');
    await Editor.scrollTo(0, 1500);
    await wait(300);
    const link = R.navLinks[4];
    await pointAt(link, { ax: 0.5, ay: 0.5 });
    await Cursor.click();
    select(link, { type: 'link', name: 'お問い合わせ', label: 'Text' });
    Props.extra.linkLabel = '未設定';
    Props.render(true);
    await wait(600);

    // Mistake 2 (設定ミス): 「会社情報」 (#company), the row above, is picked instead of 「お問い合わせ」
    await pickLink('/#company');
    Caption.issue('設定ミス', 'リンク先に1つ上の「会社情報」（#company）を選んでしまった');
    Issue.show($('#pp-link'), 'リンク先の誤り');
    await wait(2700);
    Issue.hide();
    await pickLink('/#contact', { via: '/#company' });
    Issue.ok($('#pp-link'), '修正');
    Caption.fixed('リンク先を「お問い合わせ」（#contact）に選び直して修正');
    await readHold(3000);
    Issue.hide();
    Props.extra.linkLabel = '';
    D.deselect();
    await wait(300);
  });

  scene('responsive', async () => {
    Caption.set(9, 'タブレット・スマホの表示を確認');
    await Cursor.moveTo(...canvasPoint(0.62, 0.5));
    await Editor.scrollTo(0, 1200);
    await wait(300);
    await clickUi('#bp-tablet');
    await Editor.setBreakpoint('tablet');
    await Cursor.moveTo(...canvasPoint(0.66, 0.55), { ms: 650 });
    await wait(600);
    await Editor.scrollBy(Editor.canvas.clientHeight * 0.9, 1500);
    await wait(700);
    await Editor.scrollTo(0, 1000);
    await clickUi('#bp-mobile');
    await Editor.setBreakpoint('mobile');
    await Cursor.moveTo(...canvasPoint(0.64, 0.55), { ms: 650 });
    await wait(500);
    // read down the mobile layout to the news list
    const listTop = Site.rect(R.iList).top - Editor.canvas.getBoundingClientRect().top;
    await Editor.scrollBy(listTop - 120, 4200);
    await wait(500);

    // Mistake 3 (表示崩れ): the news cards keep their side-by-side layout at 375px — the text is squeezed beside the photo
    const card = R.cardInner[0];
    Caption.issue('表示崩れ', 'スマホで「お知らせ」のカードが横並びのまま、文字が詰まって読めない');
    Issue.show(R.iList, '横並びのまま');
    await wait(2500);
    await pointAt(card, { ax: 0.75, ay: 0.3 });
    await Cursor.click();
    select(card, { name: 'Box', label: 'Box', ov: { 'flex-direction': 'row' } });
    await wait(800);
    const dirBtn = () => {
      const sec = $$('#props .rp-sec').find((s) => /レイアウト/.test(s.querySelector('.rp-sec-title').textContent));
      return sec && sec.querySelector('.icon-seg span');
    };
    await clickUi(dirBtn());
    R.cardInner.forEach((c) => Site.clearOverride(c, 'flex-direction'));
    Props.clear('flex-direction');
    await wait(300);
    Issue.ok(R.iList, '修正');
    Caption.fixed('モバイルだけカードを縦並びにして、写真の下に文字を配置');
    await Cursor.moveTo(...canvasPoint(0.78, 0.5), { ms: 600 });
    await readHold(2800);
    Issue.hide();
    D.deselect();
    Caption.set(9, 'タブレット・スマホの表示を確認');
    await Editor.scrollBy(Editor.canvas.clientHeight * 0.8, 1800);
    await wait(600);
    await Editor.scrollTo(0, 2000);
    await wait(300);
    await clickUi('#bp-pc');
    await Editor.setBreakpoint('pc');
    await wait(900);
  });

  scene('publish', async () => {
    Caption.set(10, 'サイトを公開');
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
    $('#browser').classList.add('show');
    const lw = $('#liveFrame').contentWindow;
    if (lw.__demoStart) lw.__demoStart();
    await wait(600);
  });

  scene('live', async () => {
    const lf = $('#liveFrame');
    const lw = lf.contentWindow;
    const ld = lf.contentDocument;
    const pt = (el, ax = 0.5, ay = 0.5) => {
      const f = lf.getBoundingClientRect(), r = el.getBoundingClientRect();
      return [f.left + r.left + r.width * ax, f.top + r.top + r.height * ay];
    };
    const vp = (fx, fy) => {
      const f = lf.getBoundingClientRect();
      return [f.left + f.width * fx, f.top + f.height * fy];
    };
    const maxY = () => ld.documentElement.scrollHeight - lw.innerHeight;
    const scrollTo = (y, ms) => {
      const from = lw.scrollY;
      const to = Math.max(0, Math.min(maxY(), y));
      return tween(ms, (e) => lw.scrollTo(0, from + (to - from) * e), Ease.inOutSine);
    };
    const hover = (el, on) => {
      if (!lw.__demoHover) return;
      const f = lf.getBoundingClientRect();
      const hit = on ? ld.elementFromPoint(Cursor.x - f.left, Cursor.y - f.top) : null;
      lw.__demoHover(hit && el.contains(hit) ? hit : el, on);
    };
    await Cursor.moveTo(...vp(0.6, 0.55));
    await wait(1500);

    // the photos of the works section
    const nav = (h) => ld.querySelector(`header a[href="${h}"]`);
    const go = async (h, id, ms) => {
      const a = nav(h);
      await Cursor.moveTo(...pt(a));
      Cursor.kind('hand');
      hover(a, true);
      await wait(650);
      await Cursor.click();
      hover(a, false);
      Cursor.kind('arrow');
      await scrollTo(ld.getElementById(id).getBoundingClientRect().top + lw.scrollY, ms);
    };
    await go('/#works', 'works', 1300);
    await Cursor.moveTo(...vp(0.8, 0.5), { ms: 700 });
    await wait(900);
    await scrollTo(lw.scrollY + lw.innerHeight * 0.6, 1100);
    await wait(700);

    // back to the top and into the form from 「お問い合わせ」 (the link fixed in the editor)
    await scrollTo(0, 1400);
    await wait(300);
    await go('/#contact', 'contact', 1800);
    await wait(500);
    const send = ld.querySelector('form button');
    const sendY = () => send.getBoundingClientRect().top + lw.scrollY - lw.innerHeight * 0.62;
    await scrollTo(sendY(), 1300);
    await Cursor.moveTo(...pt(send));
    Cursor.kind('hand');
    hover(send, true);
    await wait(1300);
    hover(send, false);
    Cursor.kind('arrow');
    await Cursor.moveTo(...vp(0.72, 0.42), { ms: 500 });
    await scrollTo(maxY(), 1000);
    await wait(900);
    await scrollTo(0, 2200);
    await Cursor.moveTo(...vp(0.62, 0.6), { ms: 900 });
    await wait(2200);
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
          LINKS.map((l) => l.join(' ')).join(' ') + pickLink.toString() + 'ページ「works」「privacy-policy」を追加しました',
        jaText + '0123456789&-〒　YSKCONSTRUCTIONANDINTERIORDESIGN',
        doc.body.textContent
      );
      prepareEmptyPage();
      await window.SiteFrame.load($('#liveFrame'), 'live');
    },
    onStart() { $('#hint').style.transition = 'none'; $('#hint').classList.add('hide'); },
  });
})();
