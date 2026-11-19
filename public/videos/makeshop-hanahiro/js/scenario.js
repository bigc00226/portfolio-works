/*
 * Timeline: building the Hanahiro ONLINE SHOP on makeshop —
 * categories -> products (one by hand, the rest by CSV) -> the top page in creator mode (+ preview) -> member settings
 * -> payment and delivery (fees by region, earliest delivery date) -> a test order -> opening the shop -> the live shop.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES;
  const { $, $$, wait, Cursor, Caption, Issue, Keycap, Win, screenRect } = D;
  const { clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, FileDialog, typeInput, choose, readHold } = K;
  const { MS, yen, IT } = window.Hanahiro;
  const W11 = window.Win11;
  const LIVE = 'https://www.hanahiro-onlineshop.jp';
  const P = F.files;
  const ALL_CATS = F.CATS.map((c) => c.key);

  /* ------------------------------------------------ Japanese typed through the IME (romaji -> conversion) */
  const JA = {
    '胡蝶蘭': { r: 'kochouran', segs: ['胡蝶蘭'], predict: ['胡蝶蘭', '胡蝶蘭 白'], yomi: ['こちょうらん', 'こちょうらん しろ'] },
    'ミディ': { r: 'midhi', segs: ['ミディ'] },
    'ホワイト': { r: 'howaito', segs: ['ホワイト'], predict: ['ホワイト', 'ホワイトデー'], yomi: ['ほわいと', 'ほわいとでー'] },
    '花束・ブーケ': { r: 'hanataba/bu-ke', segs: ['花束', '・', 'ブーケ'], predict: ['花束', '花束・ブーケ'], yomi: ['はなたば', 'はなたば・ぶーけ'] },
  };
  const ja = (w) => [JA[w]];

  /* ------------------------------------------------------------- the store's temporary looks */
  window.StoreFrame.STATES.noScene = {
    // before the BY SCENE block is added
    on(doc) { const g = doc.querySelector('.home-scene-grid-v2'); const s = g && g.closest('section'); if (s) s.setAttribute('data-demo-hidden', ''); },
    off(doc) { doc.querySelectorAll('[data-demo-hidden]').forEach((e) => e.removeAttribute('data-demo-hidden')); },
  };
  window.StoreFrame.STATES.gridTypo = {
    // the BY SCENE grid with the class typed without "-v2": the shop's CSS no longer lays the cards out
    on(doc) { doc.querySelectorAll('.home-scene-grid-v2').forEach((e) => { e.classList.remove('home-scene-grid-v2'); e.classList.add('home-scene-grid'); }); },
    off(doc) { doc.querySelectorAll('.home-scene-grid').forEach((e) => { e.classList.remove('home-scene-grid'); e.classList.add('home-scene-grid-v2'); }); },
  };

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1000), height: y.bottom - x.top };
  };
  async function go(navId, render, title, path) {
    await clickUi('#' + navId, { after: 80 });
    Browser.loading('ms', true);
    await wait(380);
    Browser.nav('ms', { title: MS.title(title), url: MS.URL + path });
    render();
    Browser.loading('ms', false);
    await wait(420);
  }
  const scrollMain = async (y, ms = 700) => { const el = $('#msScroll'); const s = el.scrollTop; await D.tween(ms, (e) => { el.scrollTop = s + (y - s) * e; }, D.Ease.inOut); };
  const toEl = async (sel, off = 120, ms = 700) => { const el = $(sel), box = $('#msScroll'); await scrollMain(el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - off, ms); };
  const done = (k) => MS.done.add(k);
  const DIR = (sub) => ['PC', 'Windows (C:)', 'dev', 'hanahiro-makeshop', ...sub];
  // a target of the pointer below / above the admin's visible area: scroll it into view first (as a person scrolls)
  if (D.revealers) D.revealers.push(async (el) => {
    const box = $('#msScroll');
    if (!box || !el || !el.closest || !box.contains(el)) return null;
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.top >= b.top + 10 && r.bottom <= b.bottom - 60) return null;
    await scrollMain(Math.max(0, r.top - b.top + box.scrollTop - b.height * 0.45), 650);
    return el;
  });

  /* the top page's BY SCENE block, typed / pasted into design/top.html */
  const SC = F.SCENE_HTML.split('\n');
  const GRID = SC.findIndex((l) => l.includes('home-scene-grid-v2'));
  const HEAD = SC.slice(0, GRID);                 // <section> … the heading and lead
  const REST = SC.slice(GRID + 1);                // the six cards … </section>

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — categories */
  scene('cats', async () => {
    Caption.step(1);
    Caption.set('makeshop のショップ管理画面（console.makeshop.jp）にログイン');
    await window.MsLoginFrame.signIn({ id: MS.ID, password: MS.PASSWORD });
    Browser.loading('ms', true);
    await wait(900);
    Browser.nav('ms', { title: MS.title('ホーム'), url: MS.URL + '/dashboard', page: 'ms' });
    MS.home();
    Browser.loading('ms', false);
    await wait(600);
    Caption.set('ショップ開設の準備：まずはカテゴリーから（シーン別とスタイル別の 2 系統）');
    await hoverUi('.ms-setup', { hold: 1100 });
    await go('msNavCats', () => MS.cats(), 'カテゴリー設定', '/products/categories');
    Caption.set('シーン別に「胡蝶蘭」を追加：URL はトップページや特集からリンクする文字列');
    await choose('#catParent', ['シーン別（By scene）', 'スタイル別（Style）'], 'シーン別（By scene）', { look: 400 });
    await typeInput('#catName', ja('胡蝶蘭'), { kps: 11 });
    await typeInput('#catSlug', 'mothorchid', { kps: 11 });
    await clickUi('#catAdd', { after: 80 });
    await wait(300);
    MS.cats({ have: ['mothorchid'], flash: 'mothorchid' });
    MS.toast('カテゴリーを追加しました');
    await wait(900);
    await hoverUi('#catTbl tbody tr[data-cat="mothorchid"]', { hold: 900 });
    Caption.set('スタイル別には「花束・ブーケ」（URL：bouquets）');
    await choose('#catParent', ['シーン別（By scene）', 'スタイル別（Style）'], 'スタイル別（Style）', { look: 500 });
    await typeInput('#catName', ja('花束・ブーケ'), { kps: 11 });
    await typeInput('#catSlug', 'bouquets', { kps: 11 });
    await clickUi('#catAdd', { after: 80 });
    await wait(300);
    MS.cats({ have: ['mothorchid', 'bouquets'], flash: 'bouquets', parent: 'スタイル別（Style）' });
    MS.toast('カテゴリーを追加しました');
    await wait(1000);
    Caption.set('残りのカテゴリーも同じ手順で登録（シーン別 7・スタイル別 7）');
    const order = ['birthday-anniversary', 'congratulatory', 'roses', 'offering', 'promotion-arewell', 'express', 'arrangement', 'preserved', 'stands', 'ct126', 'namabana', 'ct278'];
    const have = ['mothorchid', 'bouquets'];
    for (const k of order) {
      have.push(k);
      MS.cats({ have: ALL_CATS.filter((x) => have.includes(x)), flash: k });
      await wait(260);
    }
    W11.skipTo('13:24');
    await wait(500);
    Caption.set('URL はトップページ・特集・メニューからのリンク先になる');
    await hoverUi('#catTbl tbody tr[data-cat="mothorchid"] code', { hold: 1400 });
    await hoverUi('#catTbl tbody tr[data-cat="bouquets"] code', { hold: 1400 });
    done('cats');
  });

  /* 2 — products: one by hand, the rest by CSV */
  scene('items', async () => {
    Caption.step(2);
    Caption.set('商品登録：まず 1 商品を画面から登録して、項目と表示を確かめる');
    await go('msNavNew', () => MS.productNew(), '商品登録', '/products/new');
    await typeInput('#pnName', [...ja('ミディ'), ...ja('胡蝶蘭'), { direct: ' ' }, ...ja('ホワイト')], { kps: 11 });
    await typeInput('#pnNo', '6WO01', { kps: 10 });
    await typeInput('#pnPrice', '19800', { kps: 9 });
    Caption.set('価格は税込で入力（ショップの表示・ご利用ガイドと同じ）');
    await hoverUi('.ms-rd', { hold: 900 });
    await typeInput('#pnStock', '10', { kps: 8 });
    await choose('#pnCatAdd', F.CATS.map((c) => c.name).slice(0, 9), '胡蝶蘭', { look: 500 });
    MS.productNew({ name: 'ミディ胡蝶蘭 ホワイト', no: '6WO01', price: '19,800', stock: '10', cats: ['mothorchid'] });
    await wait(300);
    Caption.set('商品画像：撮影した写真を追加');
    await toEl('#pnImgAdd', 220);
    await clickUi('#pnImgAdd', { after: 80 });
    await FileDialog.pick({ folder: DIR(['images', 'items']), pick: 'mini-cho-white_6WO01.jpg', files: [
      { name: 'mini-cho-white_6WO01.jpg', date: '2026/11/05 18:22', type: 'JPG ファイル', size: '412 KB' },
      { name: 'mini-cho-pink_6PI02.jpg', date: '2026/11/05 18:20', type: 'JPG ファイル', size: '398 KB' },
      { name: 'follor_6FO01.jpg', date: '2026/11/05 18:11', type: 'JPG ファイル', size: '455 KB' },
      { name: 'grandbell_6GB01.jpg', date: '2026/11/05 18:09', type: 'JPG ファイル', size: '470 KB' },
    ] });
    const desc = '清らかな純白のミディ胡蝶蘭に、光沢感のある赤いオーナメントボールとアンティークゴールドの鉢カバーをあわせた、ラグジュアリーなクリスマスをイメージした鉢物です。';
    MS.productNew({ name: 'ミディ胡蝶蘭 ホワイト', no: '6WO01', price: '19,800', stock: '10', cats: ['mothorchid'], img: true });
    await toEl('#pnImgAdd', 220, 0);
    await wait(600);
    Caption.set('商品説明（原稿から貼り付け）と、購入時に選ぶオプション（ご用途・お届け希望日・同梱ギフト）');
    await clickUi('#pnDesc', { kind: 'text', after: 80 });
    await Keycap.show(['Ctrl', 'V'], 600);
    $('#pnDesc').textContent = desc;
    await wait(500);
    await toEl('.ms-opt', 160);
    await hoverUi('.ms-opt', { hold: 1600 });
    await clickUi('#pnSave', { after: 80 });
    Browser.loading('ms', true); await wait(700); Browser.loading('ms', false);
    MS.toast('商品を登録しました');
    await wait(500);
    await go('msNavItems', () => MS.items(1), '商品一覧', '/products');
    Caption.set('一覧で確認：画像・税込価格・カテゴリー');
    await hoverUi('#msMain .ms-tbl tbody tr', { hold: 1800 });
    // the CSV of the other products
    Caption.set('残りの 47 商品は CSV で一括登録（商品画像は先にまとめてアップロード済み）');
    await Win.switchTo('code');
    await Code.openFile('data/products_hanahiro.csv', { top: 0 });
    await wait(900);
    await hoverUi(Code.lineEl(0), { hold: 1500 });
    Issue.ok(linesRect(1, 6), '商品コード・税込価格・カテゴリー・画像ファイル名');
    await readHold(2000);
    Issue.hide();
    await Win.switchTo('browser');
    await go('msNavCsv', () => MS.csv(), '商品一括登録', '/products/csv/upload');
    await clickUi('#csvPick', { after: 80 });
    await FileDialog.pick({ folder: DIR(['data']), pick: 'products_hanahiro.csv', files: [{ name: 'products_hanahiro.csv', date: '2026/11/07 12:48', type: 'Microsoft Excel CSV', size: '6 KB' }] });
    MS.csv({ file: 'products_hanahiro.csv', size: '6 KB・48 行' });
    await wait(400);
    await clickUi('#csvGo', { after: 80 });
    for (let n = 0; n <= 47; n += 6) { MS.progress(Math.min(n, 47), 47); await wait(140); }
    MS.progress(47, 47);
    await wait(400);
    const CAL = F.ITEMS.find((i) => i.code === '000000002016');
    MS.csvResult(46, [{ row: 6, code: CAL.code, msg: '商品画像「000000002016_B9VUtRt.jpg」が商品画像フォルダにありません' }]);
    await wait(300);
    Caption.issue('登録エラー', `1 件が未登録：「${CAL.name}」の画像だけ、商品画像フォルダにアップロードしていなかった`);
    Issue.show($('#csvErr'), '画像が見つからない');
    await readHold(2600);
    Issue.hide();
    Caption.set('カレンダーの画像をアップロードしてから、エラーの行だけ再登録');
    await clickUi('#csvImgUp', { after: 80 });
    await FileDialog.pick({ folder: DIR(['images', 'items']), pick: '000000002016_B9VUtRt.jpg', files: [
      { name: '000000002016_B9VUtRt.jpg', date: '2026/11/06 17:48', type: 'JPG ファイル', size: '388 KB' },
      { name: '000000002015_0BdZMaL.jpg', date: '2026/11/06 17:45', type: 'JPG ファイル', size: '421 KB' },
      { name: '000000002014_HIkgxNM.jpg', date: '2026/11/06 17:44', type: 'JPG ファイル', size: '402 KB' },
    ] });
    MS.toast('画像を 1 件アップロードしました');
    await wait(500);
    await clickUi('#csvRetry', { after: 80 });
    Browser.loading('ms', true); await wait(600); Browser.loading('ms', false);
    MS.csvResult(47, []);
    Caption.fixed('47 件すべて登録できた');
    Issue.ok($('#csvProg .ms-res'), '47 / 47 件');
    await readHold(2000);
    Issue.hide();
    W11.skipTo('13:46');
    await go('msNavItems', () => MS.items(F.ITEMS.length), '商品一覧', '/products');
    MS.toast('47 件の商品を登録しました');
    Issue.ok($('#msMain .ms-h1'), `${F.ITEMS.length} 商品を登録`);
    await readHold(1800);
    Issue.hide();
    await scrollMain(380, 1400);
    await wait(600);
    await scrollMain(0, 900);
    done('items');
  });

  /* 3 — the top page (creator mode) */
  scene('top', async () => {
    Caption.step(3);
    Caption.set('トップページ：いまのプレビュー（季節のバナー・STYLE・おすすめ商品のブロックは作成済み）');
    await clickUi('#msPreview', { after: 80 });
    await Browser.newTab('pv');
    Browser.nav('pv', { url: LIVE + '/?preview=1', title: '花・フラワーギフト Hanahiro｜ONLINE SHOP（プレビュー）', page: 'store', fav: 'store' });
    Browser.loading('pv', true);
    await Store.load('home', { states: ['noScene'] });
    Browser.loading('pv', false);
    await wait(1200);
    const style0 = Store.doc.querySelector('.home-style-grid-v2');
    if (style0) await Store.scrollToEl(style0, 520, 2200);
    await wait(1000);
    Caption.set('季節のバナーの下に、シーン別のカテゴリーへの入口（BY SCENE）を追加する');
    await Store.scroll(0, 1400);
    await Win.switchTo('code');
    await Code.openFile('design/top.html', { top: 0 });
    await wait(700);
    Caption.set('見出し・リード文は下の STYLE と同じ形で書く');
    await Code.lineAfter('トップページ', [{ key: 'Enter' }]);
    await Code.paste(HEAD.join('\n'));
    // the grid line (typed): "-v2" forgotten
    await Code.type([{ key: 'Enter' }, { direct: '<div class="home-scene-grid">' }], { kps: 14 });
    Caption.set('6 つのシーンのカードを並べる（リンク先はさっき登録したカテゴリーの URL）');
    await Code.paste('\n' + REST.join('\n'));
    await wait(400);
    await Code.scrollTo(Math.max(0, Code.find('/view/category/mothorchid').line - 6), 1200);
    await wait(1400);
    await Code.save();
    // into the admin
    Caption.set('クリエイターモードのトップページに反映して、プレビュー');
    await Keycap.show(['Ctrl', 'A'], 500);
    await Keycap.show(['Ctrl', 'C'], 500);
    await Win.switchTo('browser');
    await Browser.clickTab('ms');
    await go('msNavCreator', () => MS.creator(''), 'クリエイターモード', '/design/creator/pages/top');
    await clickUi('#cmCode .ms-cl', { kind: 'text', after: 80 });
    await Keycap.show(['Ctrl', 'V'], 600);
    MS.creator(Code.text('design/top.html'));
    await wait(500);
    await clickUi('#cmSave', { after: 80 });
    MS.toast('保存しました');
    await wait(400);
    await clickUi('#cmPreview', { after: 80 });
    await Browser.clickTab('pv');
    await Browser.reload(async () => { await Store.load('home', { states: ['gridTypo'] }); });
    await wait(700);
    const grid = () => Store.doc.querySelector('.home-scene-grid, .home-scene-grid-v2');
    await Store.scrollToEl(grid(), 260, 1600);
    await wait(500);
    Caption.issue('レイアウト崩れ', 'カードが 1 列に縦に並んで、画像が画面いっぱいの大きさになっている');
    Issue.show(grid(), 'グリッドになっていない');
    await readHold(2600);
    Issue.hide();
    Caption.set('STYLE と見比べる：クラス名の「-v2」が抜けていた（home-scene-grid-v2 で CSS が当たる）');
    await Win.switchTo('code');
    const p = Code.find('class="home-scene-grid"');
    await Code.reveal(p.line);
    Issue.show(linesRect(p.line, p.line), 'home-scene-grid');
    await readHold(1800);
    Issue.hide();
    await Code.clickAt(p.line, p.col + 'class="home-scene-grid'.length);
    await Code.type('-v2', { kps: 8 });
    await Code.save();
    await Keycap.show(['Ctrl', 'A'], 400);
    await Keycap.show(['Ctrl', 'C'], 400);
    await Win.switchTo('browser');
    await Browser.clickTab('ms');
    await clickUi('#cmCode .ms-cl', { kind: 'text', after: 60 });
    await Keycap.show(['Ctrl', 'V'], 500);
    MS.creator(Code.text('design/top.html'));
    await clickUi('#cmSave', { after: 80 });
    MS.toast('保存しました');
    await wait(300);
    await Browser.clickTab('pv');
    await Browser.reload(async () => { await Store.load('home'); });
    await Store.scrollToEl(grid(), 260, 0);
    await wait(400);
    Caption.fixed('シーン別のカードが STYLE と同じグリッド（3 列 × 2 段）で並んだ');
    Issue.ok(grid(), 'BY SCENE');
    await readHold(2400);
    Issue.hide();
    const style = Store.doc.querySelector('.home-style-grid-v2');
    if (style) await Store.scrollToEl(style, 300, 1400);
    await wait(900);
    Caption.set('スマートフォンの表示も確認');
    Store.device(true);
    await Store.loadSp('home');
    await wait(500);
    const spGrid = Store.spDoc.querySelector('.home-scene-grid-v2');
    if (spGrid) await Store.scrollToEl(spGrid, 160, 1800, true);
    await wait(1600);
    Store.device(false);
    await wait(300);
    done('design');
    W11.skipTo('14:12');
  });

  /* 4 — members */
  scene('member', async () => {
    Caption.step(4);
    Caption.set('会員登録・ログイン：ゲスト購入もできる会員制度、ログイン ID はメールアドレス');
    await Browser.clickTab('ms');
    await go('msNavMemberCfg', () => MS.memberCfg(), '会員設定', '/members/settings');
    await hoverUi('.ms-rd', { hold: 900 });
    Caption.set('登録項目に「生年月日」を追加（お誕生日・記念日のご案内用）');
    await toEl('#mcItems', 160);
    const bd = [...$$('#mcItems .ms-ckl')].find((e) => /生年月日/.test(e.textContent));
    await clickUi(bd.querySelector('.ms-check'), { after: 80 });
    bd.querySelector('.ms-check').classList.add('on');
    await wait(300);
    Caption.set('ポイント：購入金額の 5%（商品ページに獲得ポイントが出る）');
    await toEl('#mcRate', 200);
    await typeInput('#mcRate', '5', { kps: 8 });
    await clickUi('#mcSave', { after: 80 });
    MS.toast('会員設定を保存しました');
    await wait(800);
    done('member');
    Caption.set('ショップのヘッダーに「ログイン」「会員登録」が出る（会員登録ページは makeshop 標準の画面）');
    await Browser.clickTab('pv');
    await Store.scroll(0, 900);
    const hd = [...Store.doc.querySelectorAll('header a, header li, header span')];
    for (const re of [/ログイン/, /会員登録/]) { const el = hd.find((e) => re.test(e.textContent) && e.textContent.trim().length < 12); if (el) await hoverUi(el, { kind: 'hand', hold: 900 }); }
    Cursor.kind('arrow');
    await wait(400);
  });

  /* 5 — payment + delivery */
  scene('payship', async () => {
    Caption.step(5);
    Caption.set('決済：クレジットカード・Amazon Pay・PayPay（ご利用ガイドのとおり）');
    await Browser.clickTab('ms');
    await go('msNavPay', () => MS.pay(), '決済設定', '/settings/payment');
    for (const k of ['card', 'amazon', 'paypay']) { await clickUi('#pay-' + k, { after: 60 }); $('#pay-' + k).classList.add('on'); await wait(250); }
    await hoverUi('.ms-pay[data-pay="card"] .ms-brands', { hold: 1400 });
    await hoverUi('.ms-pay[data-pay="cod"]', { hold: 1200 });
    await clickUi('#paySave', { after: 80 });
    MS.toast('決済設定を保存しました');
    done('pay');
    await wait(500);
    Caption.set('配送：宅配便・地域別の送料（東京都下 770 円／関東 1,100 円／本州・四国 1,320 円／北海道・九州・沖縄 1,815 円）');
    await go('msNavShip', () => MS.ship({ tokyoMissing: true }), '配送設定', '/settings/delivery');
    await hoverUi('#shipTbl tbody tr[data-reg="kanto"] td.prefs', { hold: 1500 });
    const fees = { tokyo: 770, kanto: 1100, honshu: 1320, far: 1815 };
    for (const k of Object.keys(fees)) await typeInput('#fee-' + k, String(fees[k]), { kps: 10 });
    Caption.set('お届け日の指定：最短のお届け日を入力');
    await toEl('#leadPanel', 90);
    await typeInput('#leadDays', '3', { kps: 8 });
    MS.ship({ tokyoMissing: true, fees, lead: 3 });
    await toEl('#leadPanel', 90, 0);
    await wait(400);
    await clickUi('#shipSave', { after: 80 });
    MS.toast('配送設定を保存しました');
    await wait(500);
    // check: the fee to Tokyo
    Caption.set('送料シミュレーションで確認：東京都に送ると…');
    await toEl('#simPanel', 140);
    await choose('#simPref', ['北海道', '埼玉県', '千葉県', '東京都', '神奈川県', '大阪府'], '東京都', { look: 400 });
    await clickUi('#simGo', { after: 80 });
    MS.ship({ tokyoMissing: true, fees, lead: 3, sim: { pref: '東京都', fee: 1320, reg: '上記以外の本州・四国' } });
    await toEl('#simPanel', 140, 0);
    await wait(300);
    Caption.issue('送料の誤り', '東京都が 1,320 円：「東京都下」のグループに東京都が入っておらず、本州・四国の送料になっている');
    Issue.show($('#simRes'), '770 円のはず');
    await readHold(2600);
    Issue.hide();
    await scrollMain(0, 800);
    Issue.show($('#shipTbl tr[data-reg="honshu"] .ms-pref.tk'), '東京都がここに');
    await readHold(1800);
    Issue.hide();
    Caption.set('東京都を「東京都下」のグループへ移す');
    await clickUi('#shipTbl tr[data-reg="honshu"] .ms-pref.tk', { after: 80 });
    await clickUi('#shipTbl tr[data-reg="tokyo"] td.prefs', { after: 80 });
    MS.ship({ fees, lead: 3 });
    await clickUi('#shipSave', { after: 80 });
    MS.toast('配送設定を保存しました');
    await toEl('#simPanel', 140);
    await choose('#simPref', ['北海道', '埼玉県', '千葉県', '東京都', '神奈川県', '大阪府'], '東京都', { look: 300 });
    await clickUi('#simGo', { after: 80 });
    MS.ship({ fees, lead: 3, sim: { pref: '東京都', fee: 770, reg: '東京都下' } });
    await toEl('#simPanel', 140, 0);
    Caption.fixed('東京都への送料が 770 円に');
    Issue.ok($('#simRes'), '東京都下 770 円');
    await readHold(2200);
    Issue.hide();
    // check: the earliest delivery date against the shop's rules
    Caption.set('お届け日：今日 13 時台の注文で、最短はいつになるか');
    await toEl('#leadPanel', 90);
    await hoverUi('#leadSel', { hold: 1000 });
    await Win.switchTo('code');
    await Code.openFile('docs/shop-rules.md', { top: 0 });
    const rl = Code.findLine(/生花：ご注文の 4 日以降/);
    await wait(500);
    Caption.issue('お届け日の誤り', '生花は「ご注文の 4 日以降」なのに、最短が 3 日後（11月10日）になっている');
    Issue.show(linesRect(rl, rl), '4 日以降');
    await readHold(2600);
    Issue.hide();
    await Win.switchTo('browser');
    await typeInput('#leadDays', '4', { kps: 8 });
    MS.ship({ fees, lead: 4, sim: { pref: '東京都', fee: 770, reg: '東京都下' } });
    await toEl('#leadPanel', 90, 0);
    await clickUi('#shipSave', { after: 80 });
    MS.toast('配送設定を保存しました');
    Caption.fixed('最短のお届け日が 4 日後（11月11日）に');
    Issue.ok($('#leadSel'), '11月11日(水) から');
    await readHold(2200);
    Issue.hide();
    done('ship');
  });

  /* 6 — a test order */
  scene('order', async () => {
    Caption.step(6);
    Caption.set('注文フローの確認：テスト会員で、商品ページからカートへ');
    await Browser.clickTab('pv');
    Browser.nav('pv', { url: LIVE + '/view/item/000000001982', title: `${IT.name} | ウインターギフト,クリスマス | 花・フラワーギフト Hanahiro｜ONLINE SHOP` });
    Browser.loading('pv', true);
    await Store.load('product');
    Browser.loading('pv', false);
    await wait(600);
    const sel = (n) => Store.doc.querySelector(`select[data-id="makeshop-item-option${n}"]`);
    if (sel(1)) await Store.scrollToEl(sel(1), 300, 1500);
    Caption.set('ご用途・お届け希望日・同梱ギフトのオプションを選ぶ（すべて必須）');
    for (const n of [1, 2, 3, 4, 5]) if (sel(n)) await hoverUi(sel(n), { hold: 1300 });
    const cart = [...Store.doc.querySelectorAll('a, button')].find((e) => /カートに入れる/.test(e.textContent)) || Store.doc.querySelector('a[href^="#makeshop-item-cart-entry-url"]');
    if (cart) { await Store.scrollToEl(cart, 420, 900); await clickUi(cart, { kind: 'hand', after: 120 }); }
    Cursor.kind('arrow');
    Caption.set('カート → ご注文手続き（お届け先：東京都・クレジットカードはテスト用のカード）');
    await wait(900);
    W11.skipTo('14:52');
    await Browser.clickTab('ms');
    await go('msNavOrders', () => MS.orders(), '注文一覧', '/orders');
    Caption.set('管理画面に届いた注文を確認');
    await clickUi('#ordRow', { after: 80 });
    Browser.nav('ms', { title: MS.title('注文詳細'), url: MS.URL + '/orders/T-0001' });
    MS.order();
    await wait(500);
    await hoverUi('#odItems .ms-od-item', { hold: 1200 });
    Issue.ok($('#odSum'), `送料 ${yen(770)}・合計 ${yen(IT.price + 660 + 770)}`);
    await readHold(2200);
    Issue.hide();
    Caption.set('注文確認メールも届いた。テスト注文はキャンセルして在庫を戻す');
    await clickUi('#odCancel', { after: 80 });
    MS.order({ cancelled: true });
    MS.toast('注文をキャンセルしました（在庫を戻しました）');
    await wait(900);
    W11.skipTo('15:05');
  });

  /* 7 — open the shop */
  scene('open', async () => {
    Caption.step(7);
    Caption.set('準備ができたので、ショップを公開');
    await go('msNavOpen', () => MS.open(false), 'ショップ公開設定', '/settings/open');
    await clickUi([...$$('.ms-rd')].find((e) => /公開する/.test(e.textContent)), { after: 80 });
    MS.open(true);
    await clickUi('#opSave', { after: 80 });
    Browser.loading('ms', true); await wait(700); Browser.loading('ms', false);
    MS.published(true);
    MS.toast('ショップを公開しました');
    done('open');
    await wait(600);
    await go('msNavHome', () => MS.home(), 'ホーム', '/dashboard');
    Caption.set('ショップ開設の準備がすべて完了');
    for (const el of [...$$('.ms-setup')].slice(0, 7)) await hoverUi(el, { hold: 380 });
    await wait(900);
  });

  /* 8 — the live shop */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開したショップ（www.hanahiro-onlineshop.jp）');
    await Browser.clickTab('pv');
    Browser.nav('pv', { url: LIVE + '/', title: '花・フラワーギフト Hanahiro｜ONLINE SHOP' });
    Browser.loading('pv', true);
    await Store.load('home');
    Browser.loading('pv', false);
    await wait(1400);
    const d = Store.doc;
    await Store.scrollToEl(d.querySelector('.home-scene-grid-v2'), 260, 2000);
    await wait(900);
    const stops = [d.querySelector('.home-style-grid-v2'), [...d.querySelectorAll('h2')].find((h) => /RECOMMEND/.test(h.textContent)), [...d.querySelectorAll('h2')].find((h) => /FEATURES/.test(h.textContent))].filter(Boolean);
    for (const el of stops) { await Store.scrollToEl(el, 200, 1800); await wait(1100); }
    Caption.set('シーン別の「胡蝶蘭」から商品を探す');
    await Store.scrollToEl(d.querySelector('.home-scene-grid-v2'), 260, 2000);
    await wait(500);
    const orchid = d.querySelector('.home-scene-grid-v2 a[href="/view/category/mothorchid"]');
    if (orchid) await clickUi(orchid, { kind: 'hand', after: 80 });
    Cursor.kind('arrow');
    Browser.nav('pv', { url: LIVE + '/view/category/mothorchid', title: '胡蝶蘭 | 花・フラワーギフト Hanahiro｜ONLINE SHOP' });
    Browser.loading('pv', true);
    await Store.load('list');
    Browser.loading('pv', false);
    await wait(900);
    Caption.set('カテゴリー「胡蝶蘭」の商品一覧');
    const card = Store.doc.querySelector('a[href*="000000001982"]');
    await Store.scroll(700, 2200);
    await wait(1200);
    if (card) await Store.scrollToEl(card, 380, 1800);
    await wait(900);
    if (card) await clickUi(card.closest('article') || card, { kind: 'hand', after: 80 });
    Cursor.kind('arrow');
    Browser.nav('pv', { url: LIVE + '/view/item/000000001982', title: `${IT.name} | ウインターギフト,クリスマス | 花・フラワーギフト Hanahiro｜ONLINE SHOP` });
    Browser.loading('pv', true);
    await Store.load('product');
    Browser.loading('pv', false);
    await wait(900);
    Caption.set('商品詳細（画像・価格・説明・購入オプション）');
    await Store.scroll(420, 2200);
    await wait(1200);
    const opt = Store.doc.querySelector('select[data-id="makeshop-item-option1"]');
    if (opt) { await Store.scrollToEl(opt, 360, 2000); await wait(1600); }
    await Store.scroll(0, 1600);
    Caption.set('makeshop での EC サイト構築が完了');
    await wait(3600);
    Caption.hide();
  });

  K.run({
    scenes: SCENES,
    warm: ['home', 'product', 'list'],
    fontText: JSON.stringify(JA) + F.ITEMS.map((i) => i.name).join('') + F.CATS.map((c) => c.name).join(''),
    async prepare() {
      const tree = [
        ['data', 'dir', 1], ['data/products_hanahiro.csv'], ['design', 'dir', 1], ['design/top.html'], ['docs', 'dir', 1], ['docs/shop-rules.md'],
        ['images', 'dir', 0], ['README.md'],
      ];
      Code.init(P, tree);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      // the makeshop tab opens on the real login page (js/makeshop-login.js); scene 1 signs in
      Browser.addTab({ id: 'ms', title: window.MAKESHOP_LOGIN.title, url: MS.URL + '/login', page: 'mslogin', fav: 'ms' });
      await window.MsLoginFrame.load($('#msLoginFrame'));
      window.MsUi.hydrate();
      window.MsUi.fonts();
      MS.home();
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
