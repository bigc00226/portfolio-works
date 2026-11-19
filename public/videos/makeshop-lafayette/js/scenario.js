/*
 * Timeline: building / customising the Lafayette apparel shop on makeshop for the LFYT 2026 A/W season —
 * brand and item category trees -> a hoodie with colour × size variations and per-SKU stock (+ the product page's
 * SKU table) -> list sort order and search -> points, member ranks, favourites, restock notices -> fees, free-shipping
 * line, payments -> stock list and the release schedule of the next drop -> the live shop.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES;
  const { $, $$, wait, Cursor, Caption, Issue, Keycap, Win, screenRect } = D;
  const { clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, typeInput, choose, readHold } = K;
  const { MS, yen } = window.Lafayette;
  const { BOX, QLT, COLORS, SIZES } = MS;
  const W11 = window.Win11;
  const LIVE = 'https://www.lafayettecrew.jp';

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'クルースウェット': { r: 'kuru-suwetto', segs: ['クルースウェット'], predict: ['クルースウェット', 'クルーネック'], yomi: ['くるーすうぇっと', 'くるーねっく'] },
    'パーカー': { r: 'pa-ka-', segs: ['パーカー'], predict: ['パーカー', 'パーカーコート'], yomi: ['ぱーかー', 'ぱーかーこーと'] },
  };

  /* ------------------------------------------------------------- the shop's temporary looks (on the captured pages) */
  const ST = window.StoreFrame.STATES;
  // stock not managed: every SKU row of the product page offers 「カートにいれる」, the sold-out ones too
  ST.noStock = {
    on(doc) {
      const cartCell = [...doc.querySelectorAll('.sku-cart')].find((e) => /カートにいれる/.test(e.textContent));
      if (!cartCell) return;
      doc.querySelectorAll('.sku-cart').forEach((e) => { if (/再入荷/.test(e.textContent)) { e.dataset.demoWas = e.innerHTML; e.innerHTML = cartCell.innerHTML; e.classList.add('demo-cart'); } });
    },
    off(doc) { doc.querySelectorAll('.sku-cart.demo-cart').forEach((e) => { e.innerHTML = e.dataset.demoWas; e.classList.remove('demo-cart'); }); },
  };
  // the new-arrivals list sorted by price, cheapest first (the default sort set to 価格の低い順)
  const mainList = (doc) => [...doc.querySelectorAll('.itemWrapper')].sort((a, b) => b.children.length - a.children.length)[0];
  ST.cheapFirst = {
    on(doc) {
      const w = mainList(doc); if (!w) return;
      const price = (e) => Number((e.querySelector('.itempropPrice') || {}).textContent || 0);
      [...w.children].sort((a, b) => price(a) - price(b)).forEach((c) => w.appendChild(c));
    },
    off() {},
  };
  // the release time typed as 01:00
  ST.release0100 = {
    on(doc) { doc.querySelectorAll('.cartTbl, .item-detail-addcart, .item-detail-soldout, div, p, span').forEach((e) => { if (e.children.length === 0 && /11：00より販売開始/.test(e.textContent)) e.textContent = e.textContent.replace('11：00より', '01：00より'); }); },
    off() {},
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
  const toEl = async (sel, off = 120, ms = 700) => { const el = typeof sel === 'string' ? $(sel) : sel, box = $('#msScroll'); await scrollMain(el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - off, ms); };
  if (D.revealers) D.revealers.push(async (el) => {
    const box = $('#msScroll');
    if (!box || !el || !el.closest || !box.contains(el)) return null;
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.top >= b.top + 10 && r.bottom <= b.bottom - 60) return null;
    await scrollMain(Math.max(0, r.top - b.top + box.scrollTop - b.height * 0.45), 650);
    return el;
  });
  const done = (k) => MS.done.add(k);
  const save = async (id, toast) => { await clickUi(id, { after: 80 }); Browser.loading('ms', true); await wait(500); Browser.loading('ms', false); MS.toast(toast); await wait(500); };
  const pickRadio = async (text) => { const r = [...$$('.ms-rd')].find((e) => e.textContent.includes(text)); await clickUi(r.querySelector('.ms-radio'), { after: 80 }); };
  /** open a captured page in the shop tab */
  async function shop(page, url, title, o = {}) {
    if (!Browser.tab('pv')) { await Browser.newTab('pv'); }
    else await Browser.clickTab('pv');
    Browser.nav('pv', { url: LIVE + url, title, page: 'store', fav: 'store' });
    Browser.loading('pv', true);
    await Store.load(page, o);
    Browser.loading('pv', false);
    await wait(600);
  }
  const skuRow = (c, s) => [...Store.doc.querySelectorAll('.sku tr, .sku li, .sku > *')].find((e) => e.textContent.includes(c) && new RegExp(`\\b${s}\\b`).test(e.textContent) && !/HEATHER/.test(c === 'BLACK' ? e.textContent : ''));
  const skuTable = () => Store.doc.querySelector('.sku') || Store.doc.querySelector('.cartTbl');
  const P = { product: [BOX.name + 'の通販｜Lafayette (ラファイエット)'], quilted: [QLT.name + 'の通販｜Lafayette (ラファイエット)'] };

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — brand / item categories */
  scene('cats', async () => {
    Caption.step(1);
    Caption.set('makeshop のショップ管理画面にログイン（公開中のショップ：LFYT 2026 A/W の準備）');
    await window.MsLoginFrame.signIn({ id: MS.ID, password: MS.PASSWORD });
    Browser.loading('ms', true);
    await wait(900);
    Browser.nav('ms', { title: MS.title('ホーム'), url: MS.URL + '/dashboard', page: 'ms' });
    MS.home();
    Browser.loading('ms', false);
    await wait(500);
    await hoverUi('.ms-setup', { hold: 1400 });
    Caption.set('カテゴリーは 2 系統：「ブランドから探す」と「アイテムから探す」');
    await go('msNavCats', () => MS.cats(), 'カテゴリー設定', '/products/categories');
    for (const k of ['lafayette', 'carhartt', 'newera', 'adidas']) await hoverUi(`#brandTbl tbody tr[data-cat="${k}"]`, { hold: 700 });
    await hoverUi('#itemTbl tbody tr[data-cat="tshirts"]', { hold: 1100 });
    Caption.set('LFYT の下に「LFYT クルースウェット/パーカー」を追加');
    await choose('#catParent', ['ブランドから探す', 'LFYT エルエフワイティー', 'アイテムから探す'], 'LFYT エルエフワイティー', { look: 500 });
    await typeInput('#catName', [{ direct: 'LFYT ' }, JA['クルースウェット'], { direct: '/' }, JA['パーカー']], { kps: 9 });
    await typeInput('#catSlug', 'lafayette_sweatshirt', { kps: 9 });
    await clickUi('#catAdd', { after: 80 });
    await wait(300);
    MS.cats({ sweat: true, flash: 'lafayette_sweatshirt' });
    MS.toast('カテゴリーを追加しました');
    await wait(700);
    await hoverUi('#brandTbl tbody tr[data-cat="lafayette_sweatshirt"]', { hold: 1300 });
    Caption.set('シーズンのコレクションも LFYT の下に（LFYT 2026 Autumn/Winter Collection）');
    await choose('#catParent', ['ブランドから探す', 'LFYT エルエフワイティー', 'アイテムから探す'], 'LFYT エルエフワイティー', { look: 400 });
    await typeInput('#catName', 'LFYT 2026 Autumn/Winter Collection', { kps: 9 });
    await typeInput('#catSlug', 'lfyt_2026aw', { kps: 9 });
    await clickUi('#catAdd', { after: 80 });
    await wait(300);
    MS.cats({ sweat: true, aw: true, flash: 'lfyt_2026aw' });
    MS.toast('カテゴリーを追加しました');
    await wait(600);
    await hoverUi('#brandTbl tbody tr[data-cat="lfyt_2026aw"]', { hold: 1300 });
    Caption.set('パーカーはアイテム別の「パーカー」にも入れて、ブランドとアイテムの両方の入口から見つかるようにする');
    await hoverUi('#itemTbl tbody tr[data-cat="ct1277"]', { hold: 1800 });
    done('cats');
    W11.skipTo('15:52');
  });

  /* 2 — a hoodie with colour × size variations, stock per SKU */
  scene('items', async () => {
    Caption.step(2);
    Caption.set(`商品登録：${BOX.no} BOX LOGO HOODIE（商品名は品番表から貼り付け）`);
    await go('msNavNew', () => MS.product(), '商品登録', '/products/new');
    await clickUi('#pdName', { kind: 'text', after: 80 });
    await Keycap.show(['Ctrl', 'V'], 600);
    MS.product({ name: BOX.name });
    await typeInput('#pdNo', BOX.no, { kps: 9 });
    await typeInput('#pdPrice', '16500', { kps: 9 });
    await choose('#pdCatAdd', ['LFYT クルースウェット/パーカー', 'LFYT トップス', 'パーカー', 'トップス'], 'LFYT クルースウェット/パーカー', { look: 400 });
    MS.product({ name: BOX.name, no: BOX.no, price: '16,500', cats: ['LFYT クルースウェット/パーカー'] });
    await choose('#pdCatAdd', ['LFYT クルースウェット/パーカー', 'LFYT トップス', 'パーカー', 'トップス'], 'パーカー', { look: 400 });
    const base = { name: BOX.name, no: BOX.no, price: '16,500', cats: ['LFYT クルースウェット/パーカー', 'パーカー'] };
    MS.product(base);
    await wait(300);
    Caption.set('バリエーション：カラー 2 色 × サイズ 5 つ（S〜XXL）');
    await toEl('#varPanel', 90);
    const colors = [], sizes = [];
    const chipIn = async (id, v, more) => {
      await clickUi(`#${id} .ms-chip.add`, { after: 60 });
      MS.product({ ...base, colors, sizes, typing: id, ...more });
      await toEl('#varPanel', 90, 0);
      await typeInput('#varIn', v, { kps: 9 });
      await Keycap.show(['Enter'], 300);
    };
    for (const c of COLORS) { await chipIn('varColor', c); colors.push(c); MS.product({ ...base, colors, sizes }); await toEl('#varPanel', 90, 0); await wait(200); }
    for (const s of SIZES) { await chipIn('varSize', s, { stockOff: true }); sizes.push(s); MS.product({ ...base, colors, sizes, stockOff: true }); await toEl('#varPanel', 90, 0); await wait(150); }
    Caption.set('10 個の SKU（カラー × サイズ）ができた');
    await hoverUi('#skuTbl tbody tr', { hold: 1400 });
    await hoverUi('#skuTbl tbody tr code', { hold: 1500 });
    await save('#pdSave', '商品を保存しました');
    // preview the product page
    Caption.set('商品ページで、サイズ・カラーごとの表示を確認');
    await clickUi('#pdPreview', { after: 80 });
    await shop('product', `/view/item/${BOX.code}`, P.product[0], { states: ['noStock'] });
    await Store.scrollToEl(skuTable(), 300, 1600);
    await wait(500);
    Caption.issue('在庫の表示', '売り切れの BLACK XL / XXL・HEATHER GRAY M / L まで「カートにいれる」になっている（在庫管理が「しない」のまま）');
    Issue.show(skuTable(), '全サイズ購入できてしまう');
    await readHold(3500);
    Issue.hide();
    Caption.set('在庫をバリエーション（SKU）ごとに管理する。在庫数は倉庫の棚卸表から貼り付け');
    await Browser.clickTab('ms');
    await toEl('#varPanel', 90);
    await pickRadio('バリエーションごとに管理する');
    MS.product({ ...base, colors, sizes, stockOff: false });
    await toEl('#varPanel', 90, 0);
    await clickUi('#skuTbl tbody tr .ms-in', { kind: 'text', after: 80 });
    await Keycap.show(['Ctrl', 'V'], 600);
    MS.product({ ...base, colors, sizes, stockOff: false, stock: true });
    await toEl('#varPanel', 90, 0);
    await hoverUi('#skuTbl tbody tr[data-sku="BLACK-XL"]', { hold: 1300 });
    await save('#pdSave', '商品を保存しました');
    await Browser.clickTab('pv');
    await Browser.reload(async () => { await Store.load('product'); });
    await Store.scrollToEl(skuTable(), 300, 0);
    await wait(400);
    Caption.fixed('在庫 0 の SKU は「再入荷通知を受け取る」に、在庫のある SKU だけ「カートにいれる」');
    Issue.ok(skuTable(), 'SKU ごとの在庫表示');
    await readHold(3300);
    Issue.hide();
    Caption.set('スマートフォンでも、サイズ・カラーごとのボタンが押しやすいか確認');
    Store.device(true);
    await Store.loadSp('product');
    await wait(500);
    const spSku = Store.spDoc.querySelector('.sku') || Store.spDoc.querySelector('.cartTbl');
    if (spSku) await Store.scrollToEl(spSku, 120, 1800, true);
    await wait(2200);
    Store.device(false);
    await wait(300);
    const sz = Store.doc.querySelector('.lf_shop_detail_table02');
    if (sz) { Caption.set('サイズ表（着丈・身幅・肩幅・袖丈）は商品説明に'); await Store.scrollToEl(sz, 360, 1600); await hoverUi(sz, { hold: 1800 }); }
    done('items');
    W11.skipTo('16:18');
  });

  /* 3 — list sort order + search */
  scene('list', async () => {
    Caption.step(3);
    Caption.set('「新着から探す」の一覧を確認');
    await shop('news', '/view/category/new_arrival', '新着から探す｜Lafayette｜ラファイエット公式通販サイト', { states: ['cheapFirst'] });
    const first = () => mainList(Store.doc);
    await Store.scrollToEl(first(), 260, 1600);
    await wait(500);
    Caption.issue('並び順の誤り', '新着の一覧なのに、安い商品から並んでいる（並び順の初期値が「価格の低い順」）');
    Issue.show(first(), '価格の低い順');
    await readHold(3300);
    Issue.hide();
    await Browser.clickTab('ms');
    await go('msNavList', () => MS.list(), '商品一覧ページ・検索', '/design/item-list');
    await hoverUi('#lpSort', { hold: 900 });
    await choose('#lpSort', MS.SORTS, MS.SORTS[0], { look: 500 });
    MS.list({ sort: MS.SORTS[0] });
    await save('#lpSave', '設定を保存しました');
    await Browser.clickTab('pv');
    await Browser.reload(async () => { await Store.load('news'); });
    await Store.scrollToEl(first(), 260, 0);
    await wait(400);
    Caption.fixed('新しい商品から並んだ');
    Issue.ok(first(), '新着順');
    await readHold(2900);
    Issue.hide();
    await Store.scroll(Store.win().scrollY + 700, 1800);
    await wait(1200);
    const sort = Store.doc.querySelector('.list-head-sort');
    if (sort) { Caption.set('お客様が選べる並び順（価格の低い順・高い順・おすすめ順・新着順）と件数の表示'); await Store.scrollToEl(sort, 300, 900); await hoverUi(sort, { hold: 1600 }); }
    Caption.set('ブランドのページ：子カテゴリーと件数（LFYT 2026 Autumn/Winter Collection・クルースウェット/パーカー）');
    await shop('brand', '/view/category/lafayette', 'LFYT エルエフワイティー｜Lafayette｜ラファイエット公式通販サイト');
    const kids = [...Store.doc.querySelectorAll('.child-category-item')];
    const aw = kids.find((e) => /2026 Autumn/.test(e.textContent)), sw = kids.find((e) => /クルースウェット/.test(e.textContent));
    if (aw) { await Store.scrollToEl(aw, 380, 1800); await hoverUi(aw, { kind: 'hand', hold: 1500 }); }
    if (sw) await hoverUi(sw, { kind: 'hand', hold: 1500 });
    Cursor.kind('arrow');
    // search
    Caption.set('商品検索：商品名・品番・ブランド名が対象。「HOODIE」で検索');
    await Browser.clickTab('ms');
    await toEl('#srPanel', 100);
    await hoverUi('#srPanel .ms-ckl', { hold: 1200 });
    await shop('search', '/view/search?search_keyword=HOODIE', '商品検索｜Lafayette｜ラファイエット公式通販サイト');
    const cnt = Store.doc.querySelector('.list-head-count');
    if (cnt) { await Store.scrollToEl(cnt, 300, 1400); await hoverUi(cnt, { hold: 1500 }); }
    await Store.scroll(Store.win().scrollY + 520, 1600);
    await wait(1200);
    await Store.scroll(Store.win().scrollY + 620, 1800);
    await wait(1200);
    done('list');
    W11.skipTo('16:44');
  });

  /* 4 — members, points, favourites, restock notices */
  scene('member', async () => {
    Caption.step(4);
    Caption.set('会員：ご購入額の 1% をポイント還元・新規登録で 500 ポイント（会員特典のページのとおり）');
    await Browser.clickTab('ms');
    await go('msNavMemberCfg', () => MS.member(), '会員設定', '/members/settings');
    await typeInput('#mbRate', '1', { kps: 8 });
    await typeInput('#mbSignup', '500', { kps: 9 });
    Caption.set('会員ランクは 5 段階・毎月 1 日に確定（最大 10%）');
    await toEl('#rankTbl', 120);
    for (const el of [...$$('#rankTbl tbody tr')]) await hoverUi(el, { hold: 600 });
    Caption.set('お気に入り・再入荷通知・お気に入り商品のお知らせメールを有効に');
    await toEl('#favPanel', 100);
    for (const id of ['#mbFav', '#mbRestock', '#mbFavMail']) { await clickUi(id, { after: 60 }); $(id).classList.add('on'); await wait(250); }
    await save('#mbSave', '会員設定を保存しました');
    Caption.set('商品ページの SKU ごとに「お気に入りに追加」「再入荷通知を受け取る」');
    await shop('product', `/view/item/${BOX.code}`, P.product[0]);
    await Store.scrollToEl(skuTable(), 300, 1200);
    const pts = [...Store.doc.querySelectorAll('p, span, div')].find((e) => e.children.length === 0 && /ポイント獲得/.test(e.textContent));
    if (pts) { Caption.set('価格の下に獲得ポイント（¥16,500 の 1% = 165 ポイント）'); await Store.scrollToEl(pts, 300, 900); await hoverUi(pts, { hold: 1700 }); Caption.set('商品ページの SKU ごとに「お気に入りに追加」「再入荷通知を受け取る」'); await Store.scrollToEl(skuTable(), 300, 900); }
    const fav = Store.doc.querySelector('.sku-favorite');
    const rs = [...Store.doc.querySelectorAll('.sku-cart')].find((e) => /再入荷/.test(e.textContent));
    if (fav) await hoverUi(fav, { kind: 'hand', hold: 1300 });
    if (rs) await hoverUi(rs, { kind: 'hand', hold: 1300 });
    Caption.set('ヘッダーの「Wishlist」からマイページのお気に入り一覧へ（ログインした会員だけ）');
    await Store.scroll(0, 1200);
    const wl = [...Store.doc.querySelectorAll('header a, a')].find((e) => /Wishlist/.test(e.textContent) && e.textContent.trim().length < 20);
    if (wl) await hoverUi(wl, { kind: 'hand', hold: 1500 });
    Cursor.kind('arrow');
    done('member');
    W11.skipTo('17:02');
  });

  /* 5 — fees, free shipping, payments */
  scene('cart', async () => {
    Caption.step(5);
    Caption.set('送料：地域別 600〜1,100 円（ヤマト運輸）と、送料無料のライン');
    await Browser.clickTab('ms');
    await go('msNavCart', () => MS.cart(), 'カート・送料・決済', '/settings/cart');
    for (const el of [...$$('#feeTbl tbody tr')].slice(0, 3)) await hoverUi(el, { hold: 700 });
    await typeInput('#freeLine', '11000', { kps: 9 });
    Caption.set('カートに「あと ◯ 円で送料無料」を出す。決済はカード・後払い・楽天ペイ・LINE Pay・Paidy・キャリア決済・Amazon Pay');
    await clickUi('#cartRemain', { after: 60 }); $('#cartRemain').classList.add('on');
    for (const el of [...$$('.ms-two > div:last-child .ms-chips .ms-chip')]) await hoverUi(el, { hold: 420 });
    await hoverUi('[data-r="rsv:通常商品と別のカート"]', { hold: 1400 });
    await save('#cartSave', '設定を保存しました');
    Caption.set('ショップのヘッダーの「11,000円以上ご購入で送料無料！」と、商品ページのカートボタン');
    await shop('home', '/', 'Lafayette｜ラファイエット公式通販サイト');
    const bn = [...Store.doc.querySelectorAll('p, div, a, span')].find((e) => e.children.length < 2 && /11,000円以上ご購入で送料無料/.test(e.textContent));
    if (bn) await hoverUi(bn, { hold: 1500 });
    await shop('product', `/view/item/${BOX.code}`, P.product[0]);
    await Store.scrollToEl(skuTable(), 300, 1200);
    const cart = [...Store.doc.querySelectorAll('.sku-cart')].find((e) => /カートにいれる/.test(e.textContent));
    if (cart) await hoverUi(cart, { kind: 'hand', hold: 1400 });
    Cursor.kind('arrow');
    done('cart');
    W11.skipTo('17:20');
  });

  /* 6 — stock list and the release of the next drop */
  scene('ops', async () => {
    Caption.step(6);
    Caption.set('運用：在庫一覧（SKU 単位）で在庫 0 と残りわずかを確認、再入荷通知の申込数も見る');
    await Browser.clickTab('ms');
    await go('msNavStock', () => MS.stock(), '在庫一覧', '/products/stocks');
    for (const el of [...$$('#stkTbl tbody tr.zero')].slice(0, 2)) await hoverUi(el, { hold: 1100 });
    await hoverUi('#stkTbl tbody tr.low', { hold: 1300 });
    await hoverUi('#stkTbl thead th:last-child', { hold: 1100 });
    const zf = [...$$('.ms-filters .ms-chip')].find((e) => /在庫 0/.test(e.textContent));
    await clickUi(zf, { after: 80 });
    zf.classList.add('on');
    $$('#stkTbl tbody tr:not(.zero)').forEach((tr) => { tr.style.display = 'none'; });
    Caption.set('在庫 0 の SKU だけに絞り込み：再入荷通知の申込が多いものから追加発注');
    await hoverUi('#stkTbl tbody tr.zero', { hold: 1800 });
    Caption.set(`新作 3 型の販売開始を予約：${QLT.no} LOGO QUILTED HOODIE を 11/21（土）11:00 に`);
    await go('msNavItems', () => MS.schedule(), '商品編集', `/products/${QLT.code}`);
    await hoverUi('#spPanel .ms-tg', { hold: 1300 });
    await typeInput('#spTime', '01:00', { kps: 8 });
    await save('#spSave', '商品を保存しました');
    await clickUi('#spPreview', { after: 80 });
    await shop('quilted', `/view/item/${QLT.code}`, P.quilted[0], { states: ['release0100'] });
    const pre = () => [...Store.doc.querySelectorAll('.item-detail-addcart, .cartTbl')].find((e) => /販売開始/.test(e.textContent)) || Store.doc.body;
    await Store.scrollToEl(pre(), 360, 1400);
    await wait(400);
    Caption.issue('時刻の誤り', '「11月21日01：00より販売開始」になっている：告知は 11:00（午前 1 時に販売が始まってしまう）');
    Issue.show(pre(), '01:00');
    await readHold(3100);
    Issue.hide();
    await Win.switchTo('code');
    await Code.openFile('docs/shop-rules.md', { top: 0 });
    const ln = Code.findLine(/11:00 販売開始/);
    await wait(400);
    Issue.show(linesRect(ln, ln), '告知は 11:00');
    await readHold(2500);
    Issue.hide();
    await Win.switchTo('browser');
    await Browser.clickTab('ms');
    await typeInput('#spTime', '11:00', { kps: 8 });
    await save('#spSave', '商品を保存しました');
    await Browser.clickTab('pv');
    await Browser.reload(async () => { await Store.load('quilted'); });
    await Store.scrollToEl(pre(), 360, 0);
    await wait(400);
    Caption.fixed('11月21日 11:00 から販売開始（それまでは「販売期間外の商品です」）');
    Issue.ok(pre(), '11：00より販売開始');
    await readHold(3100);
    Issue.hide();
    done('ops');
    W11.skipTo('17:34');
  });

  /* 7 — the live shop */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のショップ（www.lafayettecrew.jp）');
    await shop('home', '/', 'Lafayette｜ラファイエット公式通販サイト');
    await wait(900);
    await Store.scroll(900, 2200);
    await wait(1300);
    await Store.scroll(1900, 2200);
    await wait(1300);
    await Store.scroll(3000, 2400);
    await wait(1300);
    await Store.scroll(4200, 2400);
    await wait(1400);
    Caption.set('ブランド「LFYT」：子カテゴリーと件数・並び順・商品一覧');
    await shop('brand', '/view/category/lafayette', 'LFYT エルエフワイティー｜Lafayette｜ラファイエット公式通販サイト');
    const subs = Store.doc.querySelector('.child-category-item');
    if (subs) { await Store.scrollToEl(subs, 300, 1600); await hoverUi(subs, { hold: 1200 }); }
    await Store.scroll(Store.win().scrollY + 700, 2000);
    await wait(900);
    const card = Store.doc.querySelector(`a[href*="${BOX.code}"]`);
    if (card) { await Store.scrollToEl(card, 380, 1400); await clickUi(card, { kind: 'hand', after: 80 }); }
    Cursor.kind('arrow');
    await shop('product', `/view/item/${BOX.code}`, P.product[0]);
    await wait(900);
    await Store.scrollToEl(skuTable(), 300, 2000);
    await wait(1800);
    const sz2 = Store.doc.querySelector('.lf_shop_detail_table02');
    if (sz2) { await Store.scrollToEl(sz2, 360, 1800); await wait(1400); }
    await Store.scroll(0, 1800);
    Caption.set('makeshop でのアパレル EC サイトの構築・カスタマイズが完了');
    await wait(5200);
    Caption.hide();
  });

  K.run({
    scenes: SCENES,
    warm: ['home', 'product'],
    fontText: JSON.stringify(JA) + F.BRANDS.map((b) => b.name).join('') + F.LFYT_SUBS.map((s) => s.name).join('') + F.ITEM_CATS.map((c) => c.name).join('') + BOX.name + QLT.name,
    async prepare() {
      Code.init(F.files, [['docs', 'dir', 1], ['docs/shop-rules.md'], ['README.md']]);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
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
