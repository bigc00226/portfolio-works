/*
 * Timeline of the demo: building the 株式会社吉武工務店 page in a STUDIO-style editor,
 * checking breakpoints, publishing, then browsing the published site.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?speed=1.25   ?from=4 (start at scene 4)   ?captions=0   ?autoplay=1
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, wait, tween, Ease, Cursor, Site, Editor, Layers, Props, Panels, Caption, Keycap, Clock } = D;
  const { clickUi, hoverUi, pointAt, select, deselect, addElement, dropAsset, pickColor, pickFont, cascade } = D;
  const { Issue, Toast, Clip, KeyStrip, Ime } = D;
  /** hold for reading a "✓ 修正" caption: keeps its speed-1 length in real time when ?speed is above 1 */
  const readHold = (ms) => wait(ms * Math.max(1, Clock.speed));

  /* ------------------------------------------------ Japanese typing scripts
   * Each text is typed the way a person types it with Microsoft IME:
   *   {r: romaji, segs: [...], predict: [...], yomi: [...]}  type romaji (kana composition + prediction hints), Space to convert, Enter
   *       segs:    'fixed text' or {c: [candidates...], p: index picked with further Spaces}
   *       predict: prediction hints; yomi: their readings — the hint list narrows with every key to the entries whose
   *                reading still starts with what has been typed, and closes when none is left (as MS-IME does)
   *   {r, tab: i, predict, yomi}  accept the i-th prediction with Tab instead of converting
   *   {direct: '794-0084'}  half-width input (半角/全角 toggles the IME off)
   *   {key: 'Enter' | 'Space' | 'Shift+Space' | 'Backspace', n}
   *   {mark: n, ok}, {unmark}, {wait: ms}, {call: async (el) => ...}  annotations for the mistake episode
   * typeJa() checks that a script produces exactly the real text before playing it.
   */
  const JA = {
    headerText: [
      { r: 'kabushikigaisha', segs: [{ c: ['株式会社', 'かぶしきがいしゃ', 'カブシキガイシャ'] }],
        predict: ['株式会社', '株式', '株式市場'], yomi: ['かぶしきがいしゃ', 'かぶしき', 'かぶしきしじょう'] },
      { r: 'yoshitakekoumutenn', segs: [{ c: ['吉竹', '吉武', '義武', '良竹', 'よしたけ'], p: 1 }, '工務店'],
        predict: ['良し', '吉田', '吉竹', '吉武'], yomi: ['よし', 'よしだ', 'よしたけ', 'よしたけ'] },
      { key: 'Enter' },
      { r: 'yuubinn', segs: [{ c: ['郵便', '〒', 'ゆうびん', 'ユウビン'], p: 1 }],
        predict: ['郵便番号', '郵便局', '郵便'], yomi: ['ゆうびんばんごう', 'ゆうびんきょく', 'ゆうびん'] },
      { direct: '794-0084' },
      { key: 'Space' },
      { r: 'ehimekennimabarishi', segs: ['愛媛県', '今治市'],
        predict: ['愛媛県', '愛媛県今治市'], yomi: ['えひめけん', 'えひめけんいまばりし'] },
      { r: 'enki', segs: [{ c: ['延期', '延喜', '塩基', '円規', 'えんき'], p: 1 }],
        predict: ['延期', '延期します'], yomi: ['えんき', 'えんきします'] },
      { r: 'kou', segs: [{ c: ['高', '甲', '校', '項', '港', '公', '光', '工', 'こう'], p: 1 }] },
      { direct: '249' },
      { r: 'bannchi', segs: ['番地'], predict: ['番地', '番号'], yomi: ['ばんち', 'ばんごう'] },
      { direct: '42' },
    ],
    nav: [
      [{ r: 'goaisatsu', segs: [{ c: ['ご挨拶', '御挨拶', 'ごあいさつ'] }],
        predict: ['ご挨拶', 'ご挨拶申し上げます'], yomi: ['ごあいさつ', 'ごあいさつもうしあげます'] }],
      [{ r: 'jigyounaiyou', segs: ['事業内容'], predict: ['事業', '事業内容', '事業所'], yomi: ['じぎょう', 'じぎょうないよう', 'じぎょうしょ'] }],
      null, // 会社情報・沿革 — the mis-conversion episode, built below
      [{ r: 'oshirase', segs: [{ c: ['お知らせ', 'お報せ', 'おしらせ'] }],
        predict: ['お知らせ', 'お知らせします'], yomi: ['おしらせ', 'おしらせします'] }],
      [{ r: 'otoiawase', segs: [{ c: ['お問い合わせ', 'お問合せ', 'お問い合せ'] }],
        predict: ['お問い合わせ', 'お問い合わせ先'], yomi: ['おといあわせ', 'おといあわせさき'] }],
    ],
    heroText: [{ r: 'imabaritotomoniayundehyakuyonenn', segs: ['今治と', '共に', '歩んで', '百余年'],
      predict: ['今', '今治', '今治市'], yomi: ['いま', 'いまばり', 'いまばりし'] }],
    msgLabel: [{ r: 'goai', tab: 0, predict: ['ご挨拶', 'ご愛顧'], yomi: ['ごあいさつ', 'ごあいこ'] }],
    msgHeading: [
      { r: 'taterukotode,machigaumareru.', segs: [{ c: ['立てる', '建てる', '経てる', 'たてる'], p: 1 }, 'ことで、', '街が', '生まれる。'],
        predict: ['立てる', '建てる', '建物'], yomi: ['たてる', 'たてる', 'たてもの'] },
      { key: 'Enter' },
      { r: 'naosukotode,machigatsuduku.', segs: ['直すことで、', '街が', '続く。'], predict: ['直す', '治す'], yomi: ['なおす', 'なおす'] },
    ],
    worksLabel: [{ r: 'jigyou', tab: 0, predict: ['事業内容', '事業', '事業所'], yomi: ['じぎょうないよう', 'じぎょう', 'じぎょうしょ'] }],
    b1num: [{ direct: '01' }],
    b1title: [{ r: 'tatemononoshinchikukouji', segs: ['建物の', '新築工事'], predict: ['建物', '建物名'], yomi: ['たてもの', 'たてものめい'] }],
    b2num: [{ direct: '02' }],
    b2title: [
      { r: 'shuuzenn', segs: ['修繕'], predict: ['修繕', '修繕費'], yomi: ['しゅうぜん', 'しゅうぜんひ'] },
      { direct: '&' },
      { r: 'rinobe-shonn', segs: [{ c: ['リノベーション', 'りのべーしょん'] }],
        predict: ['リノベーション', 'リノベーション工事'], yomi: ['りのべーしょん', 'りのべーしょんこうじ'] },
    ],
    coLabel: [{ r: 'kaisha', tab: 0, predict: ['会社情報', '会社', '会社案内'], yomi: ['かいしゃじょうほう', 'かいしゃ', 'かいしゃあんない'] }],
    coHeading: [{ r: 'korekaramo,konomachitotomoni', segs: ['これからも、', 'この', '街と', { c: ['共に', 'ともに', '友に'], p: 1 }],
      predict: ['これから', 'これからも'], yomi: ['これから', 'これからも'] }],
    coSign: [
      { r: 'daihyoutorishimariyaku', segs: ['代表取締役'],
        predict: ['代表', '代表取締役', '代表取締役社長'], yomi: ['だいひょう', 'だいひょうとりしまりやく', 'だいひょうとりしまりやくしゃちょう'] },
      { key: 'Shift+Space' },
      { r: 'yoshitakeseiji', segs: ['吉武', { c: ['政治', '誠治', '正治', '清治'], p: 1 }],
        predict: ['吉武', '吉武工務店'], yomi: ['よしたけ', 'よしたけこうむてん'] },
    ],
    // the IME learned 沿革 when the mis-conversion was fixed, so it now comes first
    hLabel: [{ r: 'enkaku', segs: [{ c: ['沿革', '遠隔'] }], predict: ['沿革', '遠隔'], yomi: ['えんかく', 'えんかく'] }],
    cTitle: [{ r: 'otoi', tab: 0, predict: ['お問い合わせ', 'お問い合わせフォーム'], yomi: ['おといあわせ', 'おといあわせふぉーむ'] }],
  };

  // Mistake 1 (入力ミス): 「沿革」 is converted to 「遠隔」 and committed, then noticed, deleted and re-converted.
  JA.nav[2] = [
    { r: 'kaishajouhou/enkaku', segs: ['会社情報', '・', '遠隔'], predict: ['会社', '会社情報', '会社案内'], yomi: ['かいしゃ', 'かいしゃじょうほう', 'かいしゃあんない'] },
    { wait: 450 },
    { mark: 2 },
    {
      call: async (el) => {
        // the pointer moves off to the left first, so it does not cover the marker's label
        const m = Site.rect(el.querySelector('.demo-mark'));
        await Cursor.moveTo(Math.min(Cursor.x, m.left - 150), Cursor.y - 6, { ms: 420, bend: 0.03 });
        Caption.issue('入力ミス', '「沿革」が「遠隔」と誤変換されたまま確定してしまった');
        Issue.show(el.querySelector('.demo-mark'), '誤変換');
        await wait(2600);
      },
    },
    { key: 'Backspace', n: 2 },
    { call: async () => { Issue.hide(); } },
    { r: 'enkaku', segs: [{ c: ['遠隔', '沿革', 'えんかく', 'エンカク'], p: 1 }], candHold: 1100,
      predict: ['遠隔', '遠隔操作'], yomi: ['えんかく', 'えんかくそうさ'] },
    { mark: 2, ok: true },
    {
      call: async (el) => {
        Issue.ok(el.querySelector('.demo-mark'), '修正');
        Caption.fixed('文字を消して入力し直し、変換候補から「沿革」を選んで修正');
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
    R.header = q(':scope > header', R.root);
    R.fixedMenu = q(':scope > .fixed', R.root);
    R.main = q(':scope > main', R.root);
    R.footer = q(':scope > footer', R.root);

    R.headerLink = q(':scope > a', R.header);
    R.headerText = q(':scope > p', R.header);
    R.nav = q(':scope > header', R.header);
    R.navLinks = kids(R.nav);

    [R.hero, R.message, R.wide, R.works, R.banner, R.company, R.history, R.info, R.contact] = kids(R.main);
    R.heroImage = q('.image', R.hero);
    R.heroText = q('.image > p', R.hero);

    [R.msgLabel, R.msgCol] = kids(R.message.firstElementChild);
    [R.msgHeading, R.msgText, R.msgImg] = kids(R.msgCol);

    R.wideImage = q('.image', R.wide);

    const [worksRow, worksLink] = kids(R.works);
    R.worksLink = worksLink;
    [R.worksLabel, R.worksCol] = kids(worksRow);
    [R.block1, R.block2] = kids(R.worksCol);
    const blk = (b) => { const [num, title, text, row] = kids(b); return { num, title, text, row, imgs: kids(row) }; };
    R.b1 = blk(R.block1);
    R.b2 = blk(R.block2);

    R.bannerImage = q('.image', R.banner);

    const [coRow, coMap] = kids(R.company);
    R.coMap = coMap;
    [R.coLabel, R.coWrap] = kids(coRow);
    [R.coHeading, R.coText, R.coSign, R.coTable] = kids(R.coWrap.firstElementChild);
    R.coRows = kids(R.coTable);

    [R.hLabel, R.hWrap] = kids(R.history.firstElementChild);
    R.hRows = kids(R.hWrap.firstElementChild.firstElementChild);

    [R.iLabel, R.iCol] = kids(R.info.firstElementChild);
    R.iList = R.iCol.firstElementChild;
    R.iCard = R.iList && R.iList.firstElementChild;

    R.cBox = R.contact.firstElementChild;
    [R.cTitle, R.cLead, R.form] = kids(R.cBox);
    R.formItems = kids(R.form);

    R.fItems = kids(R.footer.firstElementChild);
    return R;
  }

  /** text layer name = first line of the text, like the editor does ('テキスト' while it is still empty) */
  function firstLine(html) {
    const s = D.plainOf(html).split('\n')[0].trim();
    return s ? (s.length > 18 ? s.slice(0, 18) + '…' : s) : 'テキスト';
  }
  const shownName = (el) => firstLine(el.innerHTML); // what the canvas shows right now
  // a new text starts out named 'テキスト'; typeJa renames it as text is committed. bottomPad keeps room under the
  // text for the IME windows, so they do not run into the key strip at the bottom of the screen
  const textOpts = (el, parent, extra = {}) =>
    Object.assign({ empty: true, type: 'text', name: 'テキスト', label: 'Text', parent, visible: { bottomPad: 330 } }, extra);
  /**
   * Like a person, move the mouse out of the way before typing. The IME windows open below horizontal
   * text and to the right of vertical text, so the cursor goes above / to the left of the finished text.
   */
  async function moveAside(el) {
    const cur = el.innerHTML;
    el.innerHTML = Site.original(el);
    const r = Site.rect(el);
    const vertical = /vertical/.test(Site.win.getComputedStyle(el).writingMode);
    el.innerHTML = cur;
    const c = Editor.canvas.getBoundingClientRect();
    let x, y;
    if (vertical) {
      if (Cursor.x < r.left - 12 && Cursor.x > c.left + 10) return; // already left of the text
      x = r.left - 46;
      if (x < c.left + 24) x = Math.min(r.left + r.width + 330, c.right - 24);
      y = D.clamp(Cursor.y, r.top + 10, r.top + Math.max(10, r.height - 10));
    } else {
      if (Cursor.y < r.top - 12 && Cursor.y > c.top + 10) return; // already above the text
      y = r.top - 46;
      if (y < c.top + 24) y = Math.min(r.top + r.height + 270, c.bottom - 24);
      x = D.clamp(Cursor.x, r.left + 30, r.left + r.width + 40);
    }
    await Cursor.moveTo(x, y, { ms: 420, bend: 0.03 });
  }
  async function typeIn(el, cps) { await moveAside(el); await Site.type(el, { cps }); D.syncName(el, D.plainOf(Site.original(el))); }
  async function typeJaIn(el, script) { await moveAside(el); await D.typeJa(el, script); }
  async function pasteIn(el) {
    await moveAside(el);
    await Keycap.show(['Ctrl', 'V']);
    D.syncName(el, D.plainOf(Site.original(el)));
    await Site.paste(el);
  }
  async function editText(el, parent, o = {}) {
    // double-click an existing text on the canvas, select all, retype
    await pointAt(el, { ax: o.ax != null ? o.ax : 0.3, ay: 0.5 });
    await Cursor.dblclick();
    if (!Layers.byEl.has(el)) Layers.add(el, { name: shownName(el), type: 'text', parent });
    select(el, { type: 'text', name: shownName(el), label: 'Text' });
    if (o.selectAll) { Site.selectAll(el); await wait(320); }
    if (o.paste) await pasteIn(el);
    else if (o.ja) await typeJaIn(el, o.ja);
    else await typeIn(el, o.cps || 12);
  }
  /** click a field of the properties panel, select its value, type a new one (half-width) and press Enter */
  async function editField(id, text, apply) {
    const f = $('#' + id);
    await clickUi(f);
    f.classList.add('focus');
    const v = f.querySelector('.v');
    v.classList.add('sel');
    await wait(450);
    await Ime.setMode(false);
    v.classList.remove('sel');
    v.textContent = '';
    for (const ch of text) {
      KeyStrip.key(ch);
      v.textContent += ch;
      await wait(120 + Math.random() * 90);
    }
    await wait(300);
    KeyStrip.special('Enter');
    apply();
    KeyStrip.idleHide();
    await wait(400);
  }
  function canvasPoint(fx, fy) {
    const r = Editor.canvas.getBoundingClientRect();
    return [r.left + r.width * fx, r.top + r.height * fy];
  }

  let R;

  /** title / date / cover of a post card in the CMS list (read from the captured page) */
  function cmsItem(card) {
    const title = card.querySelector('h3, h2, h4');
    const date = Array.from(card.querySelectorAll('p')).find((p) => /\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(p.textContent));
    const img = card.querySelector('img');
    return {
      title: title ? title.textContent.trim() : '',
      date: date ? date.textContent.trim() : '',
      cover: img ? img.getAttribute('src') : '',
    };
  }
  /** the CMS panel lists the posts that the captured page shows, so it stays in step after a re-capture */
  function buildCmsPanel() {
    const items = Array.from(R.iList ? R.iList.children : []).map(cmsItem);
    $('#cmsCount').textContent = items.length;
    $('#cmsItems').innerHTML = items.map((it) => `
      <div class="cms-item">
        <div class="cms-thumb"${it.cover ? ` style="background-image:url('${it.cover}')"` : ''}></div>
        <div class="cms-meta">
          <div class="cms-title">${D.esc(it.title)}</div>
          <div class="cms-sub"><span class="pill pill-green">公開</span>${D.esc(it.date)}</div>
        </div>
      </div>`).join('');
  }

  /** put the page into its "empty project" state */
  function prepareEmptyPage() {
    Site.hideAll([R.header, R.footer, ...Array.from(R.main.children)]);
    Site.hideAll([R.headerText, R.nav, ...R.navLinks]);
    Site.hide(R.heroText);
    Site.noImg(R.heroImage);
    Site.hideAll([R.msgLabel, R.msgHeading, R.msgText, R.msgImg]);
    Site.noImg(R.msgImg);
    Site.hideAll([R.worksLabel, R.block1, R.block2, R.worksLink]);
    Site.hideAll([R.coLabel, R.coHeading, R.coText, R.coSign, R.coTable, R.coMap]);
    Site.doc.documentElement.classList.add('demo-ready');
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', async () => {
    Caption.set('', 'STUDIOで「株式会社吉武工務店」のWebサイトを制作');
    await wait(900);
    await Cursor.moveTo(...canvasPoint(0.5, 0.45));
    await wait(500);
    await Panels.open('pages');
    await wait(500);
    await hoverUi('.pg-row[data-page="home"]');
    await wait(700);
    await Panels.open('layers');
    await wait(300);
  });

  scene('header', async () => {
    Caption.set(1, 'ヘッダーを作成');
    await addElement('box', R.header, {
      name: 'Header', label: 'Header', at: [0.5, 0.6],
      beforeShow: () => Site.override(R.header, 'background', '#ffffff'),
      ov: { background: 'transparent' },
    });
    await wait(200);
    await pickColor('#pp-fill', '6d9b9387', () => { Site.clearOverride(R.header, 'background'); Props.clear('background'); });

    await addElement('text', R.headerText, textOpts(R.headerText, R.header, {
      at: [0.3, 0.5],
      beforeShow: () => Site.override(R.headerText, 'font-family', "'Noto Sans JP'"),
      ov: { 'font-family': "'Noto Sans JP'" },
    }));
    await typeJaIn(R.headerText, JA.headerText);
    await pickFont('Zen Old Mincho', () => { Site.clearOverride(R.headerText, 'font-family'); Props.clear('font-family'); });

    // navigation: a box with the first link, then duplicate it
    Site.show(R.headerLink, null);
    const [first, ...rest] = R.navLinks;
    await addElement('box', R.nav, {
      name: 'Box', parent: R.header, at: [0.5, 0.5],
      prepare: () => Site.show(first, null),
      onDrop: () => Site.empty(first), // the drop target is sized for one link; the link is then typed
    });
    Layers.add(first, { name: 'テキスト', type: 'link', parent: R.nav });
    select(first, { type: 'link', name: 'テキスト', label: 'Text' });
    await typeJaIn(first, JA.nav[0]);
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i], prev = i === 0 ? first : rest[i - 1];
      // Ctrl+D duplicates the link that was just typed; double-click to edit its text, select it all and type over it
      await Keycap.show(['Ctrl', 'D'], 650);
      // a duplicate is as wide as its source: keep the copied text on one line even in a fixed-width link (link 4: W 86px)
      Site.override(a, 'min-width', 'max-content');
      Site.setHTML(a, prev.innerHTML);
      Site.show(a, 'pop');
      Layers.add(a, { name: shownName(a), type: 'link', parent: R.nav });
      select(a, { type: 'link', name: shownName(a), label: 'Text' });
      await wait(200);
      await pointAt(a, { ax: 0.5, ay: 0.5 });
      await Cursor.dblclick();
      Site.selectAll(a);
      await wait(320);
      await typeJaIn(a, JA.nav[i + 1]);
      Site.clearOverride(a, 'min-width');
      if (i + 1 === 2) Caption.set(1, 'ヘッダーを作成'); // back from the mistake episode
    }
    await wait(300);
    D.deselect();
    Layers.collapse(R.header);
  });

  scene('hero', async () => {
    Caption.set(2, 'メインビジュアルを配置');

    // Mistake 2 (操作ミス): the image is dropped INTO the header, which breaks the layout -> Ctrl+Z -> drop again below it
    await D.dragTileTo('image', Site.rect(R.header), [0.44, 0.62]);
    const wrong = Site.doc.createElement('div');
    wrong.className = 'demo-temp-img';
    R.header.appendChild(wrong);
    Site.anim(wrong, 'demo-pop', 700);
    Layers.add(wrong, { name: 'Image', type: 'image', parent: R.header });
    select(wrong, { type: 'image', name: 'Image', label: 'Image' });
    await wait(900);
    Caption.issue('操作ミス', '画像をヘッダーの中に入れてしまい、レイアウトが崩れた');
    Issue.show(wrong, '配置ミス');
    await wait(900);
    // the layer tree confirms it: the Image sits inside Header
    await Panels.open('layers');
    const wrongRow = Layers.byEl.get(wrong).row;
    wrongRow.classList.add('err');
    await hoverUi(wrongRow);
    await wait(1600);
    await Keycap.show(['Ctrl', 'Z']);
    wrong.remove();
    Layers.remove(wrong);
    Issue.hide();
    D.deselect();
    Layers.collapse(R.header);
    Toast.show('info', '操作を取り消しました');
    await wait(1100);

    // the fix is complete once the image sits below the header: only then the green marker and caption
    await addElement('image', R.hero, {
      name: 'Box', at: [0.5, 0.45],
      child: { el: R.heroImage, name: 'Image', type: 'image', label: 'Image' },
    });
    // marker on the image box itself (its label inside, so it does not cover the navigation above it)
    Issue.ok(R.heroImage, '修正', { inside: true });
    Caption.fixed('Ctrl + Z で取り消し、ヘッダーの下に置き直して修正');
    await readHold(3200);
    Issue.hide();
    Caption.set(2, 'メインビジュアルを配置');
    await wait(200);
    await Panels.open('assets');
    await clickUi('.asset[data-asset="f1b0faa1"]');
    Site.setImg(R.heroImage);
    Props.render(true);
    await wait(900);

    await addElement('text', R.heroText, textOpts(R.heroText, R.heroImage, { at: [0.5, 0.3] }));
    await typeJaIn(R.heroText, JA.heroText);
    await hoverUi('#pp-wm span:last-child');
    await wait(700);
    D.deselect();
    Layers.collapse(R.hero);
  });

  scene('message', async () => {
    Caption.set(3, 'ご挨拶セクションを作成');
    await addElement('box', R.message, { name: 'Box', at: [0.5, 0.5] });
    await addElement('text', R.msgLabel, textOpts(R.msgLabel, R.message));
    await typeJaIn(R.msgLabel, JA.msgLabel);
    await addElement('text', R.msgHeading, textOpts(R.msgHeading, R.message, { at: [0.35, 0.5] }));
    await typeJaIn(R.msgHeading, JA.msgHeading);

    await addElement('text', R.msgText, textOpts(R.msgText, R.message, {
      at: [0.3, 0.3],
      beforeShow: () => Site.override(R.msgText, 'font-family', "'Noto Sans JP'"),
      ov: { 'font-family': "'Noto Sans JP'" },
    }));
    await pasteIn(R.msgText);
    await wait(300);
    await pickFont('Shippori Mincho', () => { Site.clearOverride(R.msgText, 'font-family'); Props.clear('font-family'); });

    await addElement('image', R.msgImg, { name: 'Image', type: 'image', label: 'Image', parent: R.message, at: [0.5, 0.4] });
    await dropAsset('d9f06294', R.msgImg, { at: [0.5, 0.45] });
    await wait(600);
    D.deselect();
    Layers.collapse(R.message);
  });

  scene('works', async () => {
    Caption.set(4, '写真と「事業内容」セクションを作成');
    await addElement({ asset: '15abdb35' }, R.wide, {
      name: 'Box', at: [0.5, 0.4],
      child: { el: R.wideImage, name: 'Image', type: 'image', label: 'Image' },
    });
    await wait(500);
    D.deselect();
    Layers.collapse(R.wide);

    await addElement('box', R.works, { name: 'Box', at: [0.5, 0.5] });
    await addElement('text', R.worksLabel, textOpts(R.worksLabel, R.works));
    await typeJaIn(R.worksLabel, JA.worksLabel);

    // block 01
    const b1 = R.b1, b2 = R.b2;
    await addElement('box', R.block1, {
      name: 'Box', parent: R.works, at: [0.5, 0.45],
      beforeShow: () => { [b1.num, b1.title, b1.text].forEach((e) => Site.empty(e)); b1.imgs.forEach((e) => Site.noImg(e)); },
    });
    await editText(b1.num, R.block1, { ax: 0, ja: JA.b1num });
    await editText(b1.title, R.block1, { ax: 0, ja: JA.b1title });
    await editText(b1.text, R.block1, { ax: 0, paste: true });
    Layers.add(b1.row, { name: 'Box', parent: R.block1 });
    const ids1 = ['aba6438f', 'c18cd020', '388a8797'];
    for (let i = 0; i < 3; i++) await dropAsset(ids1[i], b1.imgs[i], { after: 120 });
    await wait(300);

    // duplicate the block and rewrite it as 02
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
    Layers.add(b2.row, { name: 'Box', parent: R.block2 });
    const ids2 = ['e8e4cd70', 'c22a4902', '6723001f'];
    for (let i = 0; i < 3; i++) await dropAsset(ids2[i], b2.imgs[i], { after: 120 });
    await wait(300);

    await addElement('button', R.worksLink, { name: '施工実績ページへ', type: 'link', label: 'Link', parent: R.works });
    await wait(600);
    D.deselect();
    Layers.collapse(R.works);
  });

  scene('company', async () => {
    Caption.set(5, '会社情報・沿革を作成');
    await addElement({ asset: 'c18cd020' }, R.banner, {
      name: 'Box', at: [0.5, 0.45],
      child: { el: R.bannerImage, name: 'Image', type: 'image', label: 'Image' },
    });
    await wait(400);
    D.deselect();
    Layers.collapse(R.banner);

    await addElement('box', R.company, { name: 'Box', at: [0.5, 0.4] });
    await addElement('text', R.coLabel, textOpts(R.coLabel, R.company));
    await typeJaIn(R.coLabel, JA.coLabel);
    await addElement('text', R.coHeading, textOpts(R.coHeading, R.company, { at: [0.4, 0.5] }));
    await typeJaIn(R.coHeading, JA.coHeading);
    await addElement('text', R.coText, textOpts(R.coText, R.company, { at: [0.3, 0.25] }));
    await pasteIn(R.coText);
    await addElement('text', R.coSign, textOpts(R.coSign, R.company, { at: [0.85, 0.5] }));
    await typeJaIn(R.coSign, JA.coSign);
    await addElement('box', R.coTable, {
      name: 'Box', parent: R.company, at: [0.4, 0.4],
      beforeShow: () => R.coRows.forEach((r) => Site.hide(r)),
    });
    await cascade(R.coRows, 150);
    await wait(300);

    // Google Map via embed
    let ph;
    await addElement('embed', R.coMap, {
      name: 'Embed', type: 'embed', label: 'Embed', parent: R.company, at: [0.55, 0.5],
      beforeShow: () => {
        ph = Site.doc.createElement('div');
        ph.className = 'demo-embed-ph';
        ph.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>Embed';
        R.coMap.appendChild(ph);
        Props.extra.embedCode = '';
        Props.extra.embedError = '';
      },
    });

    // Mistake 3 (エラー): the map's share link is pasted instead of the embed code -> error ->
    // pick the iframe code from the clipboard history (Win + V) -> the map loads
    const SHARE_URL = 'https://maps.app.goo.gl/q7HUZv3sJkKpXo2t8';
    const IFRAME_TEXT = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d802.7857106127392!2d132.95952768218493!3d34.06345151330422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35503b6ce5adce41%3A0x1d4085dc936455ed!2z44CSNzk0LTAwODQg5oSb5aqb55yM5LuK5rK75biC5bu25Zac77yS77yU77yZ4oiS77yU77yS!5e0!3m2!1sja!2sjp!4v1771682919764!5m2!1sja!2sjp" width="600" height="450" style="border:0;" allowfullscreen loading="lazy"></iframe>';
    const IFRAME_HTML =
      '<span class="tag">&lt;iframe</span> <span class="attr">src</span>=<span class="str">"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d802.7857106127392!2d132.95952768218493!3d34.06345151330422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35503b6ce5adce41%3A0x1d4085dc936455ed!2z44CSNzk0LTAwODQg5oSb5aqb55yM5LuK5rK75biC5bu25Zac77yS77yU77yZ4oiS77yU77yS!5e0!3m2!1sja!2sjp!4v1771682919764!5m2!1sja!2sjp"</span> ' +
      '<span class="attr">width</span>=<span class="str">"600"</span> <span class="attr">height</span>=<span class="str">"450"</span> ' +
      '<span class="attr">style</span>=<span class="str">"border:0;"</span> <span class="attr">allowfullscreen</span> ' +
      '<span class="attr">loading</span>=<span class="str">"lazy"</span><span class="tag">&gt;&lt;/iframe&gt;</span>';
    await clickUi('#pp-embed');
    $('#pp-embed').classList.add('focus');
    await Keycap.show(['Ctrl', 'V']);
    Props.extra.embedCode = `<span class="str">${SHARE_URL}</span>`;
    Props.render(true);
    $('#pp-embed').classList.add('focus');
    await wait(800);
    Props.extra.embedError = '&lt;iframe&gt; タグが見つかりません。Googleマップの「共有」→「地図を埋め込む」に表示される HTML を貼り付けてください。';
    Props.render(true);
    ph.classList.add('err');
    ph.innerHTML = `${D.icon('alert').replace('class="ic ', 'width="24" height="24" class="ic ')}埋め込みコードを読み込めませんでした`;
    Toast.show('error', '埋め込みコードを読み込めませんでした', 2800);
    Caption.issue('エラー', '地図の「共有リンク」を貼ってしまい、埋め込みに失敗した');
    Issue.show(R.coMap, 'エラー');
    await wait(2600);
    await clickUi('#pp-embed');
    $('#pp-embed').classList.add('focus');
    await Keycap.show(['Ctrl', 'A'], 600);
    $('#pp-embed').classList.add('selall');
    await wait(500);
    await Keycap.show(['Win', 'V']);
    Clip.open($('#pp-embed'), [SHARE_URL, IFRAME_TEXT]);
    await wait(800);
    await hoverUi('#clipList [data-clip="1"]');
    await wait(450);
    await Cursor.click();
    Clip.close();
    Props.extra.embedCode = IFRAME_HTML;
    Props.extra.embedError = '';
    Props.render(true);
    $('#pp-embed').classList.add('focus');
    await wait(600);
    ph.style.opacity = '0';
    await wait(500);
    ph.remove();
    Toast.show('success', '地図を読み込みました');
    Issue.ok(R.coMap, '解決');
    Caption.fixed('埋め込み用の iframe コードを貼り直して解決');
    await readHold(3000);
    Issue.hide();
    Caption.set(5, '会社情報・沿革を作成');
    await wait(400);
    D.deselect();
    Layers.collapse(R.company);

    // 沿革
    await addElement('box', R.history, {
      name: 'Box', at: [0.5, 0.45],
      beforeShow: () => { Site.hide(R.hLabel); R.hRows.forEach((r) => Site.hide(r)); },
    });
    await addElement('text', R.hLabel, textOpts(R.hLabel, R.history));
    await typeJaIn(R.hLabel, JA.hLabel);
    await cascade(R.hRows, 150);
    await wait(500);
    D.deselect();
    Layers.collapse(R.history);
  });

  scene('cms', async () => {
    Caption.set(6, 'CMSと連携した「お知らせ」一覧');
    await Panels.open('cms');
    await clickUi('#cmsCollection');
    $('#cmsCollection').classList.add('open');
    $('#cmsItems').classList.add('open');
    await wait(900);
    const cards = Array.from(R.iList.children);
    await addElement({ cms: true }, R.info, {
      name: 'Box', at: [0.5, 0.5],
      beforeShow: () => cards.forEach((c) => Site.hide(c)),
      child: { el: R.iList, name: 'お知らせ', type: 'cms', cms: true, label: 'CMS ‣ お知らせ' },
    });
    await wait(350);
    // the list fills itself with the published posts
    for (const c of cards) {
      Site.show(c, 'pop');
      Layers.add(c, { name: cmsItem(c).title || 'Item', type: 'link', parent: R.iList, cms: true });
      await wait(160);
    }
    await wait(1150);
    await pointAt(R.iCard, { ax: 0.6, ay: 0.4 });
    await wait(800);
    D.deselect();
    Layers.collapse(R.info);
  });

  scene('contact', async () => {
    Caption.set(7, 'お問い合わせフォーム・フッターを作成');
    await addElement('box', R.contact, {
      name: 'Box', at: [0.5, 0.3],
      beforeShow: () => [R.cTitle, R.cLead, R.form].forEach((e) => Site.hide(e)),
    });
    await addElement('text', R.cTitle, textOpts(R.cTitle, R.contact));
    await typeJaIn(R.cTitle, JA.cTitle);
    await addElement('text', R.cLead, textOpts(R.cLead, R.contact));
    await pasteIn(R.cLead);
    // the form starts without a max width (W 600px only) — invisible on PC, it is the cause of mistake 4 later
    await addElement('form', R.form, {
      name: 'お問い合わせフォーム', type: 'form', label: 'Form', parent: R.contact, at: [0.5, 0.3],
      beforeShow: () => { R.formItems.forEach((i) => Site.hide(i)); Site.override(R.form, 'max-width', 'none'); },
      ov: { 'max-width': 'none' },
    });
    // the form is taller than the screen: reveal its fields, scroll on, and let the note and 送信 appear in view
    // (above the caption) — measured while still hidden, so the extra 190 px cover the note that comes first
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
    await pickColor('#pp-fill', '5280730f', () => { Site.clearOverride(R.footer, 'background'); Props.clear('background'); });
    await cascade(R.fItems, 150);
    await wait(700);
    D.deselect();
    Layers.collapse(R.footer);
  });

  scene('responsive', async () => {
    Caption.set(8, 'レスポンシブ表示を確認');
    await Cursor.moveTo(...canvasPoint(0.62, 0.5));
    await Editor.scrollTo(0, 1800);
    await wait(300);
    await clickUi('#bp-tablet');
    await Editor.setBreakpoint('tablet');
    await Cursor.moveTo(...canvasPoint(0.66, 0.55), { ms: 650 });
    await wait(600);
    await Editor.scrollBy(Editor.canvas.clientHeight * 0.9, 1500);
    await wait(700);
    await Editor.scrollTo(0, 1100);
    await clickUi('#bp-mobile');
    await Editor.setBreakpoint('mobile');
    await Cursor.moveTo(...canvasPoint(0.64, 0.55), { ms: 650 });
    await wait(500);
    // read down the mobile layout to the contact form
    const formTop = Site.rect(R.form).top - Editor.canvas.getBoundingClientRect().top;
    await Editor.scrollBy(formTop - 150, 4600);
    await wait(500);

    // Mistake 4 (表示崩れ): the 600px form overflows the 375px screen because its max width was never set
    Caption.issue('表示崩れ', 'モバイル表示でフォームが画面からはみ出している');
    Issue.show(R.form, 'はみ出し');
    await wait(2400);
    await pointAt(R.form, { ax: 0.1, ay: 0.45 });
    await Cursor.click();
    select(R.form, { type: 'form', name: 'お問い合わせフォーム', label: 'Form', ov: { 'max-width': 'none' } });
    await wait(800);
    await hoverUi('#pp-maxw');
    await wait(500);
    await editField('pp-maxw', '100%', () => { Site.clearOverride(R.form, 'max-width'); Props.clear('max-width'); });
    Issue.ok(R.form, '修正');
    Caption.fixed('フォームの「最大幅」を 100% に設定して画面内に収める');
    await Cursor.moveTo(...canvasPoint(0.7, 0.5), { ms: 600 });
    await readHold(2700);
    Issue.hide();
    D.deselect();
    Caption.set(8, 'レスポンシブ表示を確認');
    await Editor.scrollTo(0, 2000);
    await wait(300);
    await clickUi('#bp-pc');
    await Editor.setBreakpoint('pc');
    await wait(900);
  });

  scene('publish', async () => {
    Caption.set(9, 'サイトを公開');
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
    // element point / viewport point (the live page is not scaled)
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
    await Cursor.moveTo(...vp(0.6, 0.55));
    await wait(1500);

    // the site's own hover styles react to the scripted pointer (see __demoHover in site-frame.js)
    const hover = (el, on) => {
      if (!lw.__demoHover) return;
      // like :hover, from the innermost element under the pointer up through its ancestors
      const f = lf.getBoundingClientRect();
      const hit = on ? ld.elementFromPoint(Cursor.x - f.left, Cursor.y - f.top) : null;
      lw.__demoHover(hit && el.contains(hit) ? hit : el, on);
    };

    // jump to 事業内容 from the header navigation
    const nav = ld.querySelector('header a[href="/#works"]');
    await Cursor.moveTo(...pt(nav));
    Cursor.kind('hand');
    hover(nav, true);
    await wait(650);
    await Cursor.click();
    const works = ld.getElementById('works');
    hover(nav, false);
    Cursor.kind('arrow');
    await scrollTo(works.getBoundingClientRect().top + lw.scrollY, 1300);
    await Cursor.moveTo(...vp(0.8, 0.5), { ms: 700 });
    await wait(900);

    // read down to the contact form
    const send = ld.querySelector('form button');
    const sendY = () => send.getBoundingClientRect().top + lw.scrollY - lw.innerHeight * 0.62;
    while (lw.scrollY < Math.min(sendY(), maxY()) - 4) {
      await scrollTo(Math.min(lw.scrollY + lw.innerHeight * 0.85, sendY()), 1100);
      await wait(380);
    }
    await Cursor.moveTo(...pt(send));
    Cursor.kind('hand');
    hover(send, true);
    await wait(1300);
    hover(send, false);
    Cursor.kind('arrow');
    await Cursor.moveTo(...vp(0.72, 0.42), { ms: 500 });
    await scrollTo(maxY(), 1000);
    await wait(900);

    // back to the top
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
      // load every web-font slice the video will draw (UI labels, captions, layer names, IME candidates) up front
      const jaText = JSON.stringify(JA) + Object.values(JA).flat(2).filter((x) => x && x.r).map((x) => D.romajiToKana(x.r).kana).join('');
      const jaCalls = Object.values(JA).flat(2).filter((x) => x && x.call).map((x) => x.call.toString()).join(''); // E1 captions
      await D.preloadFonts(
        document.body.textContent + D.uiStrings() + SCENES.map((x) => x.fn.toString()).join('') + jaText + jaCalls + doc.body.textContent,
        jaText + '0123456789&-〒　',
        doc.body.textContent
      );
      prepareEmptyPage();
      await window.SiteFrame.load($('#liveFrame'), 'live');
    },
    onStart() { $('#hint').style.transition = 'none'; $('#hint').classList.add('hide'); },
  });
})();
