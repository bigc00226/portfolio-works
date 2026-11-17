/*
 * Timeline: moving www.tabisuruwagashi.com from makeshop's basic mode to creator mode —
 * design set -> modules -> top page converted to creator-mode tags -> CSS / JS -> preview + fixes -> smartphone check
 * -> apply to the shop -> the live shop.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?speed=1.3   ?from=4 (start at scene 4)   ?to=4   ?captions=0   ?autoplay=1
 */
(function () {
  'use strict';
  const D = window.Demo;
  const A = window.Apps;
  const Tpl = window.Tpl;
  const S = window.SITE_SNAPSHOT;
  const { $, $$, esc, wait, kw, tween, Ease, Cursor, Clock, Caption, Issue, Keycap, KeyStrip, UI } = D;
  const { clickUi, hoverUi, moveToEl, screenRect, realWait } = D;
  const { Browser, Admin, Picker, Cm, Basic, Preview, Live, typeInput, now } = A;
  /** hold for reading a "✓ 修正" caption: keeps its speed-1 length in real time when ?speed is above 1 */
  const readHold = (ms) => wait(ms * Math.max(1, Clock.speed));

  const SET_NAME = '旅わが 2026';
  const SHOP_ID = 'gaxwagashi'; // shown blurred (the login ID of the admin)
  const PASSWORD = 'w4gashi-Tabi26'; // shown as ••• by the page
  const ADMIN_URL = 'https://console.makeshop.jp';
  const SHOP = 'https://www.tabisuruwagashi.com';
  const BAD_BASE = 'https://www.tabisuruwagashi.com/blog';

  /* ------------------------------------------------ Japanese typing scripts (Microsoft IME)
   *   {r: romaji, segs: [...], predict: [...], yomi: [...]}  romaji -> kana composition (+ prediction hints that
   *        narrow with every key), Space converts, further Spaces walk the candidate list ({c: [...], p: index}), Enter
   *   {r, raw: true}  Enter on the composition (kana as typed)        {direct: 'abc'}  half-width (IME off)
   *   {key: 'Enter' | 'Backspace', n}
   */
  const JA = {
    setName: [
      { r: 'tabi', segs: [{ c: ['旅', 'たび', '度', '足袋'] }], predict: ['旅', '旅先', '旅立ち'], yomi: ['たび', 'たびさき', 'たびだち'] },
      { r: 'waga', raw: true },
      { direct: ' 2026' },
    ],
    header: [{ r: 'hedda-', segs: ['ヘッダー'], predict: ['ヘッダー', 'ヘッダ'], yomi: ['へっだー', 'へっだ'] }],
    footer: [{ r: 'futta-', segs: ['フッター'], predict: ['フッター', 'フッターメニュー'], yomi: ['ふったー', 'ふったーめにゅー'] }],
    // the 2nd segment is sent one candidate too far: 賞品 instead of 商品 (nobody notices until the preview)
    h2: [
      { direct: '  <h2 class="c-heading--lev2"><span class="c-heading-en">new item</span><span class="c-heading-jp">' },
      { r: 'shinchakushouhin', segs: ['新着', { c: ['商品', '賞品', '小品', '承認'], p: 1 }], predict: ['新着', '新着情報', '新着順'], yomi: ['しんちゃく', 'しんちゃくじょうほう', 'しんちゃくじゅん'], candHold: 160 },
      { direct: '</span></h2>' },
    ],
    // the IME has learned 賞品 and offers it first now: one more Space to 商品
    fixShohin: [{ r: 'shouhin', segs: [{ c: ['賞品', '商品', '小品', '承認'], p: 1 }], predict: ['賞品', '商品', '商品券'], yomi: ['しょうひん', 'しょうひん', 'しょうひんけん'], candHold: 420 }],
    gap: [
      { direct: '/* ' },
      { r: 'sumaho:', segs: ['スマホ：'], predict: ['スマホ', 'スマホケース'], yomi: ['すまほ', 'すまほけーす'] },
      { r: 'aikonga', segs: ['アイコンが'], predict: ['アイコン', 'アイコン画像'], yomi: ['あいこん', 'あいこんがぞう'] },
      { direct: '1' },
      { r: 'tsufuerutame', segs: ['つ', '増えるため'] },
      { r: 'kankakuwotsumeru', segs: ['間隔を', '詰める'], predict: ['間隔', '間隔を空ける'], yomi: ['かんかく', 'かんかくをあける'] },
      { r: '(haba', segs: ['（幅'] },
      { direct: '360px' },
      { r: 'demorogotokasanaranai)', segs: ['でも', 'ロゴと', '重ならない）'], predict: ['でも', 'ロゴ', 'ロゴマーク'], yomi: ['でも', 'ろご', 'ろごまーく'] },
      { direct: ' */' },
      { key: 'Enter' },
      { direct: '@media screen and (max-width: 767px) {' },
      { key: 'Enter' },
      { direct: '  .p-header__menu-list { gap: 8px; }' },
      { key: 'Enter' },
      { key: 'Backspace', n: 2 },
      { direct: '}' },
    ],
  };

  /* ------------------------------------------------------------- helpers */
  const ed = () => Cm.ed;
  const lineOf = (e, needle, from = 0) => { const p = e.find(needle, from); if (!p) throw new Error('not found: ' + needle); return p; };
  /** drag over `text` (first occurrence at/after line `from`) and type over it */
  async function overwrite(e, text, script, o = {}) {
    const p = lineOf(e, text, o.from || 0);
    const col = p.col + (o.offset || 0);
    const len = o.len != null ? o.len : text.length - (o.offset || 0);
    if (p.line < e.top + 2 || p.line > e.top + e.rows() - 4) await e.reveal(p.line, o.scrollMs);
    await e.dragSelect(p.line, col, p.line, col + len, { ms: o.dragMs });
    return e.type(script, o);
  }
  /** caret at the end of the line containing `needle`, Enter (keeps indentation), then type */
  async function lineAfter(e, needle, script, o = {}) {
    const p = lineOf(e, needle, o.from || 0);
    if (p.line < e.top + 2 || p.line > e.top + e.rows() - 4) await e.reveal(p.line, o.scrollMs);
    await e.newLineAfter(p.line);
    return e.type([{ key: 'Enter' }, ...(typeof script === 'string' ? [{ direct: script }] : script)], o);
  }
  async function switchTab(id) { await Browser.clickTab(id); }
  async function editorPane(which) {
    const el = { html: '#secHtml', css: '#secCss', js: '#secJs' }[which];
    await Cm.scrollTo(el);
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  /* 0 — title card */
  scene('intro', async () => {
    const intro = $('#intro');
    intro.classList.remove('hide');
    intro.classList.add('play');
    const items = $$('.intro-steps li');
    for (let i = 0; i < items.length; i++) { await wait(380); items[i].classList.add('ok'); }
    await wait(2200);
    intro.classList.add('hide');
    await wait(900);
  });

  /* 1 — sign in (the real login page), the shop runs on basic mode */
  scene('current', async () => {
    Caption.step(1);
    Caption.set('makeshop の管理画面（console.makeshop.jp）にログイン');
    await window.MsLoginFrame.signIn({ id: SHOP_ID, password: PASSWORD });
    Browser.loading('adm', true);
    await wait(900);
    Browser.setTitle('adm', window.MsUi.title('ホーム'));
    Browser.setUrl('adm', ADMIN_URL + '/dashboard');
    Browser.setPage('adm', 'admin');
    Browser.loading('adm', false);
    await wait(500);
    Caption.set('管理画面ホーム：現在のショップは「ベーシックモード」でデザインを管理している');
    await hoverUi('#homeMode', { hold: 1600 });
    await clickUi('#navDesign', { after: 80 });
    Admin.openDesign(true);
    await wait(420);
    await clickUi('#navTemplate', { after: 60 });
    Browser.setTitle('adm', window.MsUi.title('テンプレート選択・編集'));
    Browser.setUrl('adm', ADMIN_URL + '/shop-design/ms-design-creator');
    Admin.view('dslist', ['ホーム', 'ショップデザイン', 'テンプレート選択・編集']);
    await wait(500);
    Caption.set('テンプレート選択・編集（クリエイターモード）：デザインセットはまだ 1 つもない');
    await hoverUi('#dsStrip .cm-mode', { hold: 1400 });
    await hoverUi('#dsPlus', { hold: 900 });
  });

  /* 2 — design set from a base template */
  scene('designset', async () => {
    Caption.step(2);
    Caption.set('「＋」からベーステンプレートを選んで、新しいデザインセットを作成');
    await clickUi('#dsPlus', { after: 80 });
    Picker.show(true);
    await wait(700);
    await Picker.hover('Complete', 700);
    await Picker.hover('Garden', 500);
    await Picker.hover('Basics', 900);
    Caption.set('シンプルな「Basics」をベースにする（デザインは移行元の HTML / CSS に置き換える）');
    await Picker.make('Basics');
    Picker.show(false);
    $('#msModal').classList.add('show');
    await wait(500);
    Caption.set('デザインセット名を入力（管理用の名称）');
    await typeInput($('#mdName'), JA.setName, { kps: 10 });
    await clickUi('#mdSave', { after: 120 });
    $('#msModal').classList.remove('show');
    const set = { name: SET_NAME, thumb: Picker.thumb('Basics'), updated: now(), applied: false };
    Admin.sets.push(set);
    Admin.current = set;
    Admin.renderSets({ newIdx: 0 });
    await wait(700);
    Caption.set('作成したデザインセットは「ショップに適用」するまで公開中のショップには影響しない');
    await hoverUi($('.ds-apply', Admin.card(0)), { hold: 1200 });
    await Admin.hoverCard(0, 600);
    await Admin.clickCardBtn(0, 'code');
    Admin.unhoverCards();
    Browser.setTitle('adm', window.MsUi.title('ページの編集'));
    Browser.setUrl('adm', ADMIN_URL + '/shop-design/ms-design-creator/1/pages');
    Cm.show(true, SET_NAME);
    Cm.showPage('トップ');
    await wait(600);
    Caption.set('コード編集画面：ページごとに HTML・CSS・JavaScript を編集（いまは Basics の初期コード）');
    await hoverUi(ed().html.el, { ax: 0.3, ay: 0.3, hold: 1300 });
  });

  /* 3 — header / footer become modules */
  scene('modules', async () => {
    Caption.step(3);
    Caption.set('移行元：ベーシックモードの共通ヘッダーを開く（旧デザイン編集画面）');
    await clickUi('#cm .cm-old', { after: 80 });
    Browser.addTab({ id: 'old', title: window.MsUi.title('テンプレート選択・編集'), url: ADMIN_URL + '/shop-design/ms-design-basic', page: 'basic', fav: 'old' }, { anim: true });
    Basic.show('top');
    await wait(500);
    await Basic.open('header');
    await Basic.copyAll();
    Caption.set('クリエイターモードでは共通部分を「モジュール」にして、各ページからタグで呼び出す');
    await switchTab('adm');
    await Cm.openModules();
    await clickUi('#modAdd', { after: 80 });
    Cm.newModule();
    await wait(350);
    await Cm.typeModId('header');
    await Cm.typeModName(JA.header);
    await ed().mod.clickAt(0, 0);
    await ed().mod.paste(Tpl.BASIC.header);
    await ed().mod.scrollTo(16, 900);
    await wait(500);
    await Cm.saveModule();
    Caption.set('モジュールタグ <{$module.header}> で呼び出せるようになった');
    await ed().mod.scrollTo(0, 500);
    // footer, the same way
    await switchTab('old');
    await Basic.open('footer');
    await Basic.copyAll({ after: 120 });
    await switchTab('adm');
    await Cm.openModules();
    await clickUi('#modAdd', { after: 80 });
    Cm.newModule();
    await wait(250);
    await Cm.typeModId('footer');
    await Cm.typeModName(JA.footer);
    await ed().mod.clickAt(0, 0);
    await ed().mod.paste(Tpl.BASIC.footer);
    await wait(300);
    await Cm.saveModule();
    await Cm.openModules();
    Caption.set('ヘッダー・フッターの 2 つのモジュールを登録');
    await hoverUi('#modRows tr:last-child code', { hold: 1300 });
  });

  /* 4 — the top page: paste, then convert to creator-mode tags */
  scene('top', async () => {
    Caption.step(4);
    Caption.set('ベーシックモードのトップページ HTML をコピー');
    await switchTab('old');
    await Basic.open('top');
    await Basic.copyAll({ after: 120 });
    await switchTab('adm');
    await Cm.clickPage('トップ');
    const h = ed().html;
    Caption.set('「トップ」の HTML に貼り付けて、makeshop が出力する部分をクリエイターモードのタグに書き換えていく');
    await h.clickAt(4, 0, { noScroll: true });
    await h.replaceAll(Tpl.BASIC.top);
    await wait(500);

    // <head>
    Caption.set('head：タイトル・説明文は「ページ情報」タグ、CSS / JS はページごとに生成されるファイルを読み込む');
    await overwrite(h, '<title>' + Tpl.T.title + '</title>', '<{$page.title}>', { offset: 7, len: Tpl.T.title.length });
    await lineAfter(h, '<link rel="preload" as="image"', '<link rel="stylesheet" href="<{$page.css}>">');
    {
      const p = lineOf(h, '<meta name="description" content="');
      const col = p.col + '<meta name="description" content="'.length;
      await h.clickAt(p.line, col);
      KeyStrip.special('Shift');
      KeyStrip.special('End');
      h.sel = { a: { line: p.line, col }, b: { line: p.line, col: h.lines[p.line].length } };
      h.ins = null; h.render();
      await wait(380);
      await h.type('<{$page.description}>">');
    }
    await lineAfter(h, 'https://fonts.googleapis.com/css2?', '<script src="<{$page.javascript}>" defer></script>');
    Caption.set('<{$makeshop.head}> / body_top / body_bottom：makeshop が必要なタグを出力する場所（必須）');
    await lineAfter(h, '<!-- End Google Tag Manager -->', '<{$makeshop.head}>');
    {
      const p = lineOf(h, '<body id="page-top"');
      await h.clickAt(p.line + 1, 0);
      await h.type('<{$makeshop.body_top}>');
    }
    Caption.set('ヘッダーはモジュールタグで呼び出す');
    await lineAfter(h, '<div class="l-wrapper">', '<{$module.header}>');
    Caption.set('メインビジュアル：管理画面に登録したスライドを <{$shop.mainvisual}> で出力');
    await lineAfter(h, '<div class="top-main-visual__wrapper">', '        <{$shop.mainvisual}>');

    // 新着商品: heading + loop
    const nNew = lineOf(h, '<!-- 新着アイテム -->').line;
    Caption.set('新着商品：ベーシックモードでは自動表示だった見出しと一覧を、自分で書く');
    await lineAfter(h, '<div class="top-ranking__title c-text-more-wrap">', JA.h2, { from: nNew });
    Caption.set('商品 1 件分の HTML を <{section}> で囲み、$new_item のデータでループ出力する');
    await lineAfter(h, '<ul class="p-product-list__list">', Tpl.NEW.open, { from: nNew });
    const v = Tpl.T.newVal;
    await overwrite(h, v.url, Tpl.NEW.url, { from: nNew });
    await overwrite(h, v.img, Tpl.NEW.img, { from: nNew, dragMs: 700 });
    await overwrite(h, `alt="${v.name}"`, Tpl.NEW.name, { from: nNew, offset: 5, len: v.name.length });
    await overwrite(h, `[${v.maker}]`, Tpl.NEW.maker, { from: nNew, offset: 1, len: v.maker.length });
    await overwrite(h, `c-ellipsis">${v.name}</p>`, Tpl.NEW.name, { from: nNew, offset: 12, len: v.name.length });
    await overwrite(h, `<span class="c-price">${v.price}<`, Tpl.NEW.price, { from: nNew, offset: 22, len: v.price.length });
    Caption.set('アイコン（NEW・期間限定など）も商品ごとのループで出力');
    await overwrite(h, v.icons, Tpl.NEW.icons, { from: nNew });
    await wait(500);

    // 人気ランキング: the same, pasted
    const nRank = lineOf(h, '<!-- 人気ランキング -->').line;
    Caption.set('人気ランキングも同じ要領でループ化（$ranking_item・順位は section の連番）');
    {
      const a = lineOf(h, '<li class="p-product-list__item c-ranking-label-item">', nRank);
      const end = h.findLine(/^\s*<\/li>\s*$/, a.line);
      await h.shiftSelect(a.line, 0, end, h.lines[end].length, { scrollMs: 1100 });
      await h.paste(Tpl.RANK_LOOP);
      await wait(400);
    }

    // footer + body_bottom
    Caption.set('フッターもモジュールタグで呼び出し、最後に <{$makeshop.body_bottom}>');
    await lineAfter(h, '</main>', '<{$module.footer}>', { scrollMs: 1200 });
    await lineAfter(h, '</div><!--/ l-wrapper -->', '<{$makeshop.body_bottom}>');
    await wait(400);

    // mistake 1: the loop is never closed -> the save is refused
    const err = await Cm.save();
    if (err) {
      Caption.issue('構文エラー', '保存できない：新着商品の <{section}> に閉じタグ <{/section}> を書き忘れていた');
      Issue.show($('#cmAlert'), '保存エラー');
      await wait(2600);
      await h.reveal(err.line - 1, 900);
      Issue.show(() => screenRect(h.lineEl(err.line - 1)), 'ここから始まるループ', { pad: 2 });
      await wait(1600);
      const open = err.line - 1;
      const liEnd = h.findLine(/^\s*<\/li>\s*$/, open);
      Issue.hide();
      await h.newLineAfter(liEnd);
      await h.type([{ key: 'Enter' }, { direct: '  <{/section}>' }]);
      h.lineCls[liEnd + 1] = 'good'; h.render();
      await wait(500);
      const again = await Cm.save();
      h.lineCls = {}; h.render();
      if (!again) {
        Caption.fixed('<{/section}> を追加して保存できた');
        Issue.ok(() => screenRect(h.lineEl(liEnd + 1) || h.el), '閉じタグを追加', { pad: 2 });
        await readHold(2400);
        Issue.hide();
      }
    }
  });

  /* 5 — CSS / JavaScript */
  scene('cssjs', async () => {
    Caption.step(5);
    Caption.set('全ページ共通：ローカル環境でビルドした CSS / JS（normalize・Swiper・Splide を含む）を貼り付け');
    await Cm.scrollTo(0, 400);
    await Cm.clickPage('全ページ共通');
    await ed().css.clickAt(1, 0, { noScroll: true });
    await ed().css.replaceAll(Tpl.FINAL.commonCss);
    await hoverUi(ed().css.lineEl(2) || ed().css.el, { ax: 0.5, hold: 1500 });
    await ed().css.scrollTo(3, 600);
    await wait(500);
    await editorPane('js');
    await ed().js.clickAt(0, 0, { noScroll: true });
    await ed().js.paste(Tpl.FINAL.commonJs);
    await wait(600);
    await Cm.save();
    Caption.set('トップページ専用の JavaScript（WordPress の特集・記事・お知らせを読み込む処理）を移植');
    await switchTab('old');
    await Basic.open('js');
    await Basic.copyAll({ after: 120 });
    await switchTab('adm');
    await Cm.scrollTo(0, 300);
    await Cm.clickPage('トップ');
    await editorPane('js');
    await ed().js.clickAt(0, 0, { noScroll: true });
    await ed().js.paste(Tpl.BASIC.js);
    await wait(500);
    Caption.set('API の URL を、ブログ（WordPress）の絶対 URL に書き換え');
    const js = ed().js;
    await overwrite(js, "'/blog/'", [{ direct: "'" + BAD_BASE + "'" }]);
    await wait(500);
    await Cm.save();
  });

  /* 6 — preview: typo + WordPress lists */
  scene('preview', async () => {
    Caption.step(6);
    Caption.set('プレビューで確認（ショップに適用する前のデザインセットを表示）');
    await Cm.scrollTo(0, 500);
    await clickUi('#cmPreview', { after: 80 });
    Browser.addTab({ id: 'pv', title: '和菓子専門お取り寄せ＜公式＞｜旅するように和菓子と出逢う', url: SHOP + '/?preview_design_set=1', page: 'preview', fav: 'shop' }, { anim: true });
    Preview.bar(`デザインセット「${SET_NAME}」をプレビュー中（ショップには未適用）`);
    Browser.loading('pv', true);
    await Preview.load(['typo', 'wpEmpty']);
    Browser.loading('pv', false);
    await wait(1400);
    const d = Preview.doc;
    const newH = [...d.querySelectorAll('.c-heading-jp')].find((e) => /新着/.test(e.textContent));
    await Preview.scroll(Preview.yOf(newH, 260), 1500);
    await wait(500);
    // mistake 2: 新着賞品
    Caption.issue('入力ミス', '見出しが「新着賞品」になっている（変換候補を 1 つ送りすぎて確定していた）');
    Issue.show(newH, '誤変換「新着賞品」');
    Cursor.kind('arrow');
    await moveToEl(newH, { ax: 0.9, ay: 0.6 });
    await wait(2600);
    Issue.hide();
    await switchTab('adm');
    await editorPane('html');
    const h = ed().html;
    const p = lineOf(h, '新着賞品');
    await h.reveal(p.line, 800);
    await h.dragSelect(p.line, p.col + 2, p.line, p.col + 4);
    await h.type(JA.fixShohin, { kps: 11 });
    await wait(300);
    await Cm.save();
    await switchTab('pv');
    await Browser.reload('pv', async () => { await Preview.load(['wpEmpty']); });
    const newH2 = [...Preview.doc.querySelectorAll('.c-heading-jp')].find((e) => /新着/.test(e.textContent));
    await Preview.scroll(Preview.yOf(newH2, 260), 0);
    Caption.fixed('「新着商品」に直った');
    Issue.ok(newH2, '新着商品');
    await readHold(2200);
    Issue.hide();

    // mistake 3: the WordPress-fed lists stay empty
    const topics = Preview.doc.querySelector('.top-topics');
    await Preview.scroll(Preview.yOf(topics, 60), 1400);
    await wait(400);
    Caption.issue('表示されない', '「今、よく見られている特集」が空（JOURNAL・お知らせも同じ）');
    Issue.show(topics, '特集が表示されない');
    Cursor.kind('arrow');
    await moveToEl(topics, { ay: 0.4 });
    await wait(2200);
    Issue.hide();
    await Keycap.show(['F12'], 700);
    Preview.clearConsole();
    await Preview.devtools(true);
    Preview.wpErrors(BAD_BASE);
    await wait(700);
    Caption.issue('API エラー', 'URL が「…/blogwp-json/…」になって 404：baseUrl の末尾の「/」が抜けていた');
    Issue.show($('#dtCon'), 'コンソールのエラー');
    await moveToEl($('#dtCon .dt-msg'), { ax: 0.32 });
    await wait(3000);
    Issue.hide();
    await switchTab('adm');
    await editorPane('js');
    const js = ed().js;
    const q = lineOf(js, "const baseUrl = '");
    await js.reveal(q.line, 400);
    const at = js.lines[q.line].indexOf("';");
    await js.clickAt(q.line, at);
    await js.type('/');
    await wait(300);
    await Cm.save();
    await switchTab('pv');
    Preview.clearConsole();
    await Browser.reload('pv', async () => { await Preview.load([]); });
    const topics2 = Preview.doc.querySelector('.top-topics');
    await Preview.scroll(Preview.yOf(topics2, 60), 0);
    await wait(300);
    Caption.fixed('特集・JOURNAL・お知らせが読み込まれ、コンソールのエラーも消えた');
    Issue.ok(topics2, '特集が表示された');
    await readHold(2400);
    Issue.hide();
    const journal = Preview.doc.querySelector('.top-journal');
    await Preview.scroll(Preview.yOf(journal, 80), 1600);
    await wait(1200);
  });

  /* 7 — smartphone width */
  scene('sp', async () => {
    Caption.step(7);
    Caption.set('デバイスモードでスマートフォン（幅 360px）の表示を確認');
    await Preview.scroll(0, 900);
    await clickUi('#dtDevice', { after: 80 });
    Preview.device(true);
    await Preview.loadSp(['spGap']);
    await wait(1200);
    // mistake 4: logo and icons collide at 360px
    const hd = Preview.spDoc.querySelector('.p-header__container');
    Caption.issue('表示崩れ', '幅 360px でヘッダーのロゴと検索アイコンが重なっている（お気に入りアイコンを追加したため）');
    Issue.show(hd, 'ロゴとアイコンが重なる', { below: true });
    Cursor.kind('arrow');
    await moveToEl(Preview.spDoc.querySelector('.p-header__menu-item--search'), { ay: 0.6 });
    await wait(2800);
    Issue.hide();
    await switchTab('adm');
    await Cm.scrollTo(0, 300);
    await Cm.openModules();
    await clickUi('#modRows tr[data-mod="header"] a', { after: 80 });
    Cm.editModule('header');
    await wait(400);
    Caption.set('ヘッダーモジュールの <style> に、スマホ用の余白調整を追加');
    const m = ed().mod;
    await lineAfter(m, '.p-header__menu-item--cart .icon-cart-num[hidden]', JA.gap, { kps: 18 });
    await wait(500);
    await Cm.saveModule();
    await switchTab('pv');
    await Browser.reload('pv', async () => { await Preview.loadSp([]); await Preview.load([]); });
    const hd2 = Preview.spDoc.querySelector('.p-header__container');
    Caption.fixed('アイコンの間隔を 8px に詰めて、360px でもロゴと重ならなくなった');
    Issue.ok(hd2, '重ならない', { below: true });
    await readHold(2400);
    Issue.hide();
    await Preview.scroll(Preview.yOf(Preview.spDoc.querySelector('.top-ranking'), 40, true), 1500, true);
    await wait(1200);
    await Preview.scroll(0, 900, true);
    await clickUi('#dtDevice', { after: 60 });
    Preview.device(false);
    await Keycap.show(['F12'], 600);
    await Preview.devtools(false);
    await wait(300);
  });

  /* 8 — apply the design set to the shop */
  scene('apply', async () => {
    Caption.step(8);
    Caption.set('確認できたので、デザインセット一覧から「ショップに適用」');
    await switchTab('adm');
    await clickUi('#cmBack', { after: 80 });
    Cm.show(false);
    Browser.setTitle('adm', window.MsUi.title('テンプレート選択・編集'));
    Browser.setUrl('adm', ADMIN_URL + '/shop-design/ms-design-creator');
    Admin.renderSets();
    await wait(500);
    await clickUi($('.ds-apply', Admin.card(0)), { after: 100 });
    $('#applyText').innerHTML = `デザインセット「${esc(SET_NAME)}」をショップに適用します。<br>適用すると、ショップのデザインがクリエイターモードに切り替わります。`;
    $('#msApply').classList.add('show');
    await wait(900);
    await clickUi('#applyOk', { after: 120 });
    $('#msApply').classList.remove('show');
    Admin.current.applied = true;
    Admin.setMode('creator');
    Admin.renderSets();
    await wait(600);
    Caption.set('「クリエイターモード適用中」に切り替わった');
    await hoverUi('#dsStrip .cm-mode', { hold: 1300 });
    await hoverUi($('.ds-state', Admin.card(0)), { hold: 1000 });
  });

  /* 9 — the live shop */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のショップ（www.tabisuruwagashi.com）を確認');
    await Browser.newTab('live');
    await Browser.typeUrl('www.tabisuruwagashi.com');
    Cursor.kind('arrow');
    Browser.setTitle('live', '和菓子専門お取り寄せ＜公式＞｜旅するように和菓子と出逢う');
    Browser.setUrl('live', SHOP + '/');
    Browser.setPage('live', 'live');
    Browser.setFav('live', 'shop');
    Browser.loading('live', true);
    await Live.load();
    Browser.loading('live', false);
    await wait(2600);
    const d = Live.doc;
    const at = (sel, off = 90) => { const el = d.querySelector(sel); return el ? Live.yOf(el, off) : 0; };
    await Live.scroll(at('.top-ranking'), 1800);
    const item = d.querySelector('.top-ranking .p-product-list__item a');
    if (item) { await hoverUi(item, { kind: 'hand', ay: 0.35, hold: 1100 }); }
    Cursor.kind('arrow');
    await Live.scroll(at('.top-topics'), 1600);
    await wait(900);
    await Live.scroll(at('.top-antowa'), 1700);
    await wait(900);
    await Live.scroll(at('.top-map'), 2000);
    await wait(900);
    await Live.scroll(at('.top-journal'), 1600);
    await wait(900);
    await Live.scroll(at('.top-news'), 1800);
    await wait(1100);
    await Live.scroll(0, 2400);
    Caption.set('ベーシックモードからクリエイターモードへの移行が完了');
    await wait(3500);
    Caption.hide();
  });

  /* ============================================================ setup */
  async function prepare(fast) {
    D.hydrateIcons();
    D.Cursor.init();
    if (!Tpl.ok) throw new Error('template split failed: the shop page structure changed (re-check js/template.js markers)');
    Cm.init();
    Picker.render();
    Admin.renderSets();
    Admin.setMode('basic');
    // the admin tab opens on the real login page (js/makeshop-login.js); scene 1 signs in
    Browser.addTab({ id: 'adm', title: window.MAKESHOP_LOGIN.title, url: ADMIN_URL + '/login', page: 'login', fav: 'ms' });
    await window.MsLoginFrame.load($('#msLoginFrame'));
    window.MsUi.hydrate();
    window.MsUi.fonts();
    Admin.view('home', ['ホーム']);
    // fonts of the admin + every Japanese glyph that will be typed, before recording
    const typed = JSON.stringify(JA) + Object.values(JA).flat().filter((s) => s && s.r).map((s) => D.romajiToKana(s.r).kana).join('');
    const all = document.body.textContent + typed + Tpl.BASIC.top.slice(0, 4000);
    try {
      await Promise.race([Promise.all(['400 14px "Noto Sans JP"', '700 14px "Noto Sans JP"', '500 16px "Shippori Mincho"'].map((f) => document.fonts.load(f, [...new Set(all)].join('')))), new Promise((r) => setTimeout(r, 8000))]);
    } catch (e) {}
    // warm the image / font cache with the shop page once (hidden); after a seek-reload the cache is warm already
    if (fast) return;
    const warm = document.createElement('iframe');
    warm.style.cssText = 'position:fixed;left:-3000px;top:0;width:1920px;height:900px;visibility:hidden';
    document.body.appendChild(warm);
    await window.SiteFrame.load(warm, 'pc');
    const warm2 = document.createElement('iframe');
    warm2.style.cssText = 'position:fixed;left:-3000px;top:0;width:360px;height:740px;visibility:hidden';
    document.body.appendChild(warm2);
    await window.SiteFrame.load(warm2, 'sp');
    // decode the images further down the page too
    await Promise.race([Promise.all([...warm.contentDocument.images].map((i) => { i.loading = 'eager'; return i.decode ? i.decode().catch(() => {}) : null; })), new Promise((r) => setTimeout(r, 12000))]);
    warm.remove(); warm2.remove();
  }

  /* ============================================================== runner (shared/stage.js) */
  window.Stage.run({
    scenes: SCENES,
    async prepare(fast) {
      $('#intro').classList.add('hide');
      $('#intro').style.transition = 'none';
      await prepare(fast);
      await new Promise((r) => setTimeout(r, 50));
      $('#intro').style.transition = '';
      $('#intro').classList.remove('hide'); // the title card waits for play
      window.__JA = JA;
    },
    onStart() { $('#hint').style.transition = 'none'; $('#hint').classList.add('hide'); },
    afterSeek() { if (KeyStrip.visible()) KeyStrip.idleHide(400); },
  });

  // for the identity check (tools/snapshots/tabisuruwagashi/test)
  window.__demoFinal = () => ({
    top: Cm.data['トップ'], common: Cm.data['全ページ共通'],
    modules: Cm.modules.map((m) => ({ id: m.id, name: m.name, html: m.html })),
  });
})();
