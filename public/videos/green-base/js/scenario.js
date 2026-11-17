/*
 * Timeline: GREEN BASE (green-base.jp) — choosing the theme (Flow) and building the plant care section on metafields:
 * theme store -> metaobject "植物" + product metafield custom.plant -> care data entry (パキラ) + the products that use it
 * -> Liquid section (VS Code + shopify theme dev) -> theme editor (dynamic source) -> mobile check + publish -> live store.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, icon, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, fieldTarget } = D;
  const { clickUi, hoverUi, moveToEl } = D;
  const { Code, Term, Browser, Admin, H, Store, TE, typeInput, readHold } = K;
  const { TS, V, img } = window.GB;
  const P = F.files;
  const LIVE = 'https://green-base.jp';
  const PRODUCT = (S.products || []).find((p) => p.handle === 'pachira_s-rhomb_s_beige');
  const PROD = { handle: PRODUCT.handle, title: PRODUCT.title, body: PRODUCT.body, price: PRODUCT.variants[0].price.replace(/\.0+$/, '') };
  // the pot variations of the same plant (the store's product list + the captured products)
  const SAME = [];
  [...F.PACHIRA, ...(S.products || []).filter((p) => /^パキラ S ×/.test(p.title)).map((p) => ({ handle: p.handle, title: p.title, price: p.variants[0].price }))]
    .forEach((p) => { if (!SAME.some((x) => x.title === p.title)) SAME.push(p); });
  const EDITOR = Admin.url('/themes/140318343264/editor?previewPath=%2Fproducts%2Fpachira_s-rhomb_s_beige');

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '植物': { r: 'shokubutsu', segs: ['植物'] },
    '日当たり': { r: 'hiatari', segs: ['日当たり'], predict: ['日当たり', '日当たりの良い'], yomi: ['ひあたり', 'ひあたりのよい'] },
    'みずやり': { r: 'mizuyari', raw: true },
    '原産地': { r: 'gensanchi', segs: ['原産地'] },
    '花言葉': { r: 'hanakotoba', segs: ['花言葉'] },
    '気温': { r: 'kion', segs: [{ c: ['機音', '気温', '基音'], p: 1 }], candHold: 200 },
    '注意': { r: 'chuui', segs: ['注意'] },
    'ペット・': { r: 'petto/', segs: ['ペット・'] },
    '赤ちゃん': { r: 'akachann', segs: ['赤ちゃん'] },
    'ペット・赤ちゃん': { r: 'petto/akachann', segs: ['ペット・', '赤ちゃん'] },
    'パキラ': { r: 'pakira', segs: ['パキラ'] },
    '中南米': { r: 'chuunanbei', segs: ['中南米'] },
    '快活': { r: 'kaikatsu', segs: ['快活'] },
    '勝利': { r: 'shouri', segs: ['勝利'] },
    '毒性はありません。': { r: 'dokuseihaarimasenn.', segs: ['毒性は', 'ありません。'] },
    '植物の詳細：育て方は「植物」メタオブジェクトから表示する': [
      { r: 'shokubutsunoshousai:', segs: ['植物の', '詳細', '：'] }, { r: 'sodatekataha[shokubutsu]', segs: ['育て方は', '「植物」'] },
      { r: 'metaobujekutokara', segs: ['メタオブジェクトから'] }, { r: 'hyoujisuru', segs: ['表示する'] }],
    '鉢違いの商品も同じ植物エントリを参照するので、入力は植物ごとに': [
      { r: 'hachichigainoshouhinmo', segs: ['鉢違いの', '商品も'] }, { r: 'onajishokubutsuentoriwo', segs: ['同じ', '植物', 'エントリを'] },
      { r: 'sanshousurunode,', segs: ['参照するので、'] }, { r: 'nyuuryokuhashokubutsugotoni', segs: ['入力は', '植物ごとに'] }],
    '回': { r: 'kai', segs: [{ c: ['会', '回', '階'], p: 1 }], candHold: 200 },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);
  const ja = (text) => (Array.isArray(JA[text]) ? JA[text] : [JA[text]]);

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1250), height: y.bottom - x.top };
  };
  /** a field of the admin: click, Ctrl+V a long text (copied from the care-card data) */
  async function pasteInto(el, text) {
    if (typeof el === 'string') el = $(el);
    await clickUi(el, { kind: 'text', after: 80 });
    el.classList.add('focus');
    await Keycap.show(['Ctrl', 'V'], 600);
    $('.v', el).textContent = text;
    await wait(250);
    el.classList.remove('focus');
  }
  /** a list field: type a value, Enter makes it a tag */
  async function typeList(el, values) {
    el = $(el);
    await clickUi(el, { kind: 'text', after: 80 });
    el.classList.add('focus');
    const v = $('.v', el);
    for (const x of values) {
      await typeInto(fieldTarget(v), ja(x), { kps: 12, keepStrip: true });
      KeyStrip.special('Enter');
      v.insertAdjacentHTML('beforebegin', `<span class="sa-tag">${esc(x)}</span>`);
      v.textContent = '';
      await wait(250);
    }
    KeyStrip.idleHide(600);
    el.classList.remove('focus');
  }
  /** settings page of the admin (the overlay) scrolled to an element */
  const setScroll = (el, off = 60, ms = 600) => Admin.scrollToEl(el, off, ms, '#saSetScroll');

  /* ---------------------------------------------- theme editor: tree + settings */
  const TREE = (withDetail) => [
    { grp: 'ヘッダー', items: [{ id: 'announce', name: 'お知らせバー', ic: 'text' }, { id: 'header', name: 'ヘッダー', ic: 'layers' }] },
    { grp: 'テンプレート', add: true, items: [
      { id: 'product-form', name: '商品情報', ic: 'tag', open: true, blocks: [{ id: 'b-title', name: 'タイトル', ic: 'text' }, { id: 'b-price', name: '価格', ic: 'yen' }, { id: 'b-merit', name: 'メリットタグ', ic: 'tag' }, { id: 'b-buy', name: '購入ボタン', ic: 'cart' }] },
      { id: 'liquid-1', name: 'カスタム Liquid', ic: 'code' },
      ...(withDetail ? [{ id: 'detail', name: '植物の詳細', ic: 'image' }] : []),
      { id: 'liquid-2', name: 'カスタム Liquid', ic: 'code' },
      { id: 'related', name: 'おすすめ商品', ic: 'grid' },
    ] },
    { grp: 'フッター', items: [{ id: 'footer', name: 'フッター', ic: 'layers' }] },
  ];
  const detailSettings = (o = {}) => `
    <div class="sa-f"><label>植物</label><div class="gb-dyn-row"><div class="sa-in sel" id="setPlant"><span class="v">${o.dyn ? '<span class="te-dyn">商品 › 植物</span>' : ''}</span>${o.dyn ? '' : '<span class="ph">エントリを選択</span>'}</div><span class="gb-src" id="setPlantSrc">${K.ic('database')}</span></div>
      <div class="hint">動的ソースに接続すると、商品ごとのエントリを表示します</div></div>
    <div class="sa-f"><label>日当たりのアイコン</label><div class="sa-in"><span class="v">${o.icons ? 'sun2.svg' : ''}</span>${o.icons ? '' : '<span class="ph">画像を選択</span>'}</div></div>
    <div class="sa-f"><label>みずやりのアイコン</label><div class="sa-in"><span class="v">${o.icons ? 'jyouro2.svg' : ''}</span>${o.icons ? '' : '<span class="ph">画像を選択</span>'}</div></div>
    <div class="sa-hr"></div><p class="sa-mute">セクション：<code>sections/parts-item-detail.liquid</code></p>`;
  const detailEl = () => TE.doc && TE.doc.querySelector('.p-detail__content');

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — theme selection */
  scene('theme', async () => {
    Caption.step(1);
    Caption.set('リニューアルの要件：植物の写真を大きく、条件（日当たり・サイズ・育てやすさ）で探せる、商品ページに育て方');
    await hoverUi(Code.lineEl(3), { ax: 0.3, hold: 1500 });
    await hoverUi(Code.lineEl(5), { ax: 0.35, hold: 1600 });
    await hoverUi(Code.lineEl(6), { ax: 0.35, hold: 1200 });
    Caption.set('候補のテーマを、写真の見せ方・絞り込み・商品ページのセクションの自由度で比べる');
    await hoverUi(Code.lineEl(13), { ax: 0.3, hold: 1100 });
    await hoverUi(Code.lineEl(17), { ax: 0.3, hold: 1300 });
    await Win.switchTo('browser', { state: 'max' });
    // the real Theme Store (themes.shopify.com, captured): the list filtered by 業種「ガーデン」 is open
    Caption.set('テーマストア：業種「ガーデン」で絞り込み（29 件）。植物ストア向けの見本で、写真の見せ方を比べる');
    await hoverUi(TS.el('label[for="garden"]'), { hold: 700 });
    for (const [preset, hold] of [['greenhouse', 1000], ['peace', 800], ['seed', 700]]) await hoverUi(TS.el(`a[href*="/presets/${preset}"] img`), { hold });
    Caption.set('メモの候補（Dawn / Flow / Impulse / Prestige）のうち、写真を大きく見せられる Flow をテーマ名で検索');
    await clickUi(TS.el('button[aria-label="検索"]'), { after: 80 });
    TS.search('empty');
    await wait(500);
    const q = window.TSFrame.typeTarget(TS.doc('list'));
    q.done(await typeInto(q, [{ direct: 'flow' }], { kps: 9, keepStrip: true, quietMode: true }));
    TS.search('typed');
    KeyStrip.idleHide(600);
    await wait(700);
    const sug = TS.el('.theme-search__results-section--quick-links a[href*="/themes/flow/"]');
    await hoverUi(sug, { hold: 400 });
    await clickUi(sug, { after: 80 });
    Browser.loading('ts', true); await wait(600); Browser.loading('ts', false);
    TS.show('flow');
    TS.search('closed');
    await wait(700);
    Caption.set('Flow（Eight Themes・$320）：高度なフィルタリング、高画質の画像・画像ギャラリー・商品タブなど、商品ページの機能がそろう');
    await TS.scroll(TS.yOf(TS.text('h1', 'Flow', 'flow')) - 120, 1300);
    await hoverUi(TS.text('h3', '無限のカスタマイズ'), { ax: 0.3, hold: 1300 });
    await TS.scroll(TS.yOf(TS.text('h2', '機能')) - 150, 1100);
    for (const [t, hold] of [['商品のフィルタリングと並び替え', 1000], ['高画質の画像', 700], ['画像ギャラリー', 700], ['商品タブ', 800], ['用途に関する情報', 1100]]) await hoverUi(TS.text('li', t), { ax: 0.12, hold });
    Caption.set('モバイル版のプレビューも確認（注文の 8 割以上がスマートフォン）');
    await TS.scroll(0, 1100);
    await clickUi(TS.el('button[aria-label="モバイル版"]'), { after: 60 });
    TS.show('flowSp');
    await wait(300);
    await hoverUi(TS.el('img[data-demo-preview]'), { ay: 0.45, hold: 1600 });
    Caption.set('「テーマを試す」でストアに追加：公開するまで料金はかからず、公開中の Dawn はそのまま');
    const tryBtn = [...TS.doc().querySelectorAll('a[href*="login?ux=signup"]')].filter((e) => e.getBoundingClientRect().width > 0).sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
    await hoverUi(tryBtn, { hold: 500 });
    await clickUi(tryBtn, { after: 80 });
    Browser.loading('ts', true); await wait(700); Browser.loading('ts', false);
    await Browser.clickTab('adm');
    Admin.show(V.themes({ flow: true }), { nav: 'online/themes', title: 'テーマ', path: '/themes' });
    $('.gb-lib').classList.add('new');
    Admin.toast('Flow をテーマライブラリに追加しました');
    Caption.set('テーマライブラリに Flow（39.9.1）を追加：公開中の Dawn はそのままで、Flow をカスタマイズしていく');
    await hoverUi('.gb-lib b', { hold: 1600 });
  });

  /* 2 — metaobject definition + product metafield */
  scene('define', async () => {
    Caption.step(2);
    Caption.set('育て方は植物ごとに同じ（鉢違いの商品が多い）→ 植物ごとの「メタオブジェクト」にして、商品から参照する');
    await Admin.openSettings('custom-data', V.customData(), { title: 'カスタムデータ', path: 'custom_data' });
    await hoverUi('#cdMo p', { ax: 0.4, hold: 1200 });
    await clickUi('#cdMoAdd', { after: 80 });
    Admin.settings('custom-data', V.moDef([]), { title: 'メタオブジェクトの定義を追加', path: 'custom_data/metaobjects/create' });
    await wait(400);
    await typeInput('#moName', ja('植物'), { kps: 12 });
    await typeInput('#moType', 'plant', { kps: 12 });
    Admin.saveBar(true, '保存されていないメタオブジェクトの定義');
    Caption.set('フィールド：公開中の商品ページの育て方（日当たり・みずやり・原産地・花言葉・気温・注意・ペット）に合わせる');
    const done = [];
    for (const f of F.FIELDS) {
      const [name, key, label, list] = f;
      await clickUi('#fdAdd', { after: 80 });
      Admin.modal(V.fieldModal('type'), { title: 'フィールドを追加' });
      await wait(350);
      const ty = /複数行/.test(label) ? '複数行テキスト' : '1 行テキスト';
      await clickUi($(`.gb-ty[data-ty="${ty}"]`), { after: 60 });
      Admin.modal(V.fieldModal('name'), { title: `フィールドを追加：${ty}`, foot: H.btn('キャンセル') + H.btn('追加', { pri: true, id: 'fdOk' }) });
      await wait(250);
      await typeInput('#fdName', ja(name), { kps: 14 });
      await typeInput('#fdKey', key, { kps: 16 });
      if (list) {
        Caption.set('花言葉は値が複数（例：快活、勝利）→「値のリストを保存する」にチェック');
        await clickUi('#fdList', { after: 80 });
        $('#fdList').classList.add('on');
        await wait(500);
      }
      await clickUi('#fdOk', { after: 60 });
      Admin.closeModal();
      done.push(f);
      Admin.settings('custom-data', V.moDef(done, { name: '植物', type: 'plant', newKey: key }), { title: 'メタオブジェクトの定義を追加', path: 'custom_data/metaobjects/create' });
      await setScroll($('.gb-fd:last-child') || '#fdAdd', 360, 0);
      await wait(200);
    }
    await wait(500);
    await Admin.saveFromBar('メタオブジェクトの定義「植物」を保存しました');
    Admin.settings('custom-data', V.moDef(F.FIELDS, { name: '植物', type: 'plant', saved: true }), { title: '植物', path: 'custom_data/metaobjects/plant' });
    await wait(600);
    // product metafield custom.plant -> metaobject reference
    Caption.set('商品のメタフィールド「植物」（custom.plant）：タイプは「メタオブジェクト」で、植物の定義を参照');
    Admin.settings('custom-data', V.customData(), { title: 'カスタムデータ', path: 'custom_data' });
    await clickUi($('#cdRes .gb-res[data-res="商品"]'), { after: 80 });
    Admin.settings('custom-data', H.page({ title: '商品のメタフィールドの定義', back: true, actions: [H.btn('定義を追加', { pri: true, id: 'pmAdd' })] }, H.card('', '<div class="sa-empty"><p>定義がありません</p></div>')), { title: '商品のメタフィールドの定義', path: 'custom_data/product' });
    await wait(400);
    await clickUi('#pmAdd', { after: 80 });
    Admin.settings('custom-data', V.productMfDef(), { title: '商品のメタフィールドの定義を追加', path: 'custom_data/product/create' });
    await wait(300);
    await typeInput('#pmName', ja('植物'), { kps: 12 });
    await typeInput('#pmKey', 'custom.plant', { kps: 14 });
    Admin.saveBar(true, '保存されていないメタフィールドの定義');
    await K.choose('#pmType', ['1 行テキスト', '複数行テキスト', '商品', 'メタオブジェクト', 'ファイル'], 'メタオブジェクト');
    Admin.settings('custom-data', V.productMfDef({ name: '植物', key: 'custom.plant', type: 'メタオブジェクト' }), { title: '商品のメタフィールドの定義を追加', path: 'custom_data/product/create' });
    await wait(500);
    await Admin.saveFromBar('メタフィールドの定義を保存しました');
    await wait(300);
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
  });

  /* 3 — the care data of パキラ + the products that use it */
  scene('data', async () => {
    Caption.step(3);
    Caption.set('コンテンツ → メタオブジェクト → 植物：パキラのエントリを追加（文面は同封のケアカードと同じ）');
    await Admin.go('content/metaobjects', H.page({ title: 'メタオブジェクト' }, H.card('', H.table(['定義', 'エントリ', 'タイプ'], [['<b>植物</b>', '0', '<code>plant</code>']], { id: 'moList' }), { flush: true })), { title: 'メタオブジェクト', path: '/content/metaobjects' });
    await Admin.open($('#moList tbody tr td:first-child b'), V.entries([]), { title: '植物', path: '/content/metaobjects/entries/plant' });
    await Admin.open('#enAdd', V.entry({}), { title: '植物のエントリを追加', path: '/content/metaobjects/entries/plant/new' });
    const p = F.PLANT;
    await typeInput('#en_name', ja('パキラ'), { kps: 12 });
    Admin.saveBar(true, '保存されていないエントリ');
    await pasteInto('#en_hiatari', p.hiatari);
    await pasteInto('#en_mizuyari', p.mizuyari);
    await typeInput('#en_gensanchi', ja('中南米'), { kps: 12 });
    await Admin.scrollToEl('[data-f="hanakotoba"]', 200, 600);
    await typeList('#en_hanakotoba', p.hanakotoba);
    await pasteInto('#en_kion', p.kion);
    await pasteInto('#en_chuui', p.chuui);
    await typeInput('#en_pet', ja('毒性はありません。'), { kps: 12 });
    await Admin.saveFromBar('エントリ「パキラ」を保存しました');
    await Admin.scroll(0, 500);

    // the product
    Caption.set('商品「パキラ S × ロムS ベージュ」のメタフィールド「植物」で、エントリ「パキラ」を選ぶ');
    const list = H.page({ title: '商品' }, H.card('', `<div class="sa-tools">${icon('search')}<span>パキラ S ×</span></div>` +
      H.table([['', 'ck'], '商品', 'ステータス', '在庫'], SAME.map((s) => [H.ck(), H.prod(s.title, img[s.handle] || ''), H.badge('アクティブ', 'ok'), '<span class="sa-mute">在庫 1</span>']), { id: 'prTable', rowId: (r, i) => SAME[i].handle }), { flush: true }));
    await Admin.go('products', list, { title: '商品', path: '/products?query=パキラ S ×' });
    await Admin.open($(`#prTable tr[data-row="${PROD.handle}"] .sa-pn span`), V.product(PROD), { title: PROD.title, path: '/products/7563816075360' });
    await Admin.scrollToEl('#pmCard', 200, 800);
    await clickUi('#pmPick', { after: 80 });
    const r = $('#pmPick').getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'sa-pop';
    pop.innerHTML = `<div class="sa-pop-i" style="color:#8a8a8a">${icon('search')}　エントリを検索</div><div class="sa-pop-i pk"><span class="gb-ent">${K.ic('cube')}パキラ</span></div>`;
    pop.style.left = r.left + 'px'; pop.style.top = r.bottom + 4 + 'px'; pop.style.minWidth = r.width + 'px';
    document.body.appendChild(pop);
    await wait(600);
    await clickUi($('.pk', pop), { after: 60 });
    pop.remove();
    $('#pmPick').innerHTML = `<span class="v"><span class="gb-ent">${K.ic('cube')}パキラ</span></span>`;
    Admin.saveBar(true);
    await wait(400);
    await Admin.saveFromBar('商品を保存しました');
    Caption.set('鉢違いのパキラも一括編集で同じ「パキラ」を参照（育て方の入力は植物ごとに 1 回で済む）');
    const bulk = (n) => H.page({ title: '商品を一括編集', back: true }, H.card('', H.table(['商品', 'メタフィールド：植物 (custom.plant)'], SAME.map((s, i) => [H.prod(s.title, img[s.handle] || ''), i < n ? `<span class="gb-ent">${K.ic('cube')}パキラ</span>` : '<span class="sa-mute">—</span>']), { id: 'bkTable' }), { flush: true }));
    Admin.show(bulk(1), { title: '商品を一括編集', path: '/bulk?resource_name=Product&edit=metafields.custom.plant' });
    await wait(500);
    for (let i = 2; i <= SAME.length; i++) {
      await hoverUi($(`#bkTable tbody tr:nth-child(${i}) td:last-child`), { hold: 100 });
      Admin.show(bulk(i), {});
      await wait(220);
    }
    Admin.saveBar(true);
    await Admin.saveFromBar(`${SAME.length} 件の商品を保存しました`);
    // the entry lists the products that use it
    Caption.set('エントリ「パキラ」を参照している商品：鉢違いのパキラすべて');
    await Admin.go('content/metaobjects', V.entry(Object.assign({}, F.PLANT, { refs: SAME })), { title: '植物：パキラ', path: '/content/metaobjects/entries/plant/1' });
    $$('#enRefs .gb-ref').forEach((r) => r.classList.add('new'));
    await hoverUi('#enRefs .gb-ref:nth-child(2) span', { hold: 1300 });
    await hoverUi('#enRefs .gb-ref:last-child span', { hold: 1000 });
  });

  /* 4 — the section in Liquid */
  scene('liquid', async () => {
    Caption.step(4);
    Caption.set('VS Code：Flow のテーマに、育て方のセクション parts-item-detail.liquid を作る');
    await Win.switchTo('code');
    await Code.newFile('sections/parts-item-detail.liquid');
    await Code.type(code(F.SECTION_TYPED), { kps: 22 });
    Caption.set('schema：設定「植物」はメタオブジェクト型 → テーマエディタで動的ソース（商品のメタフィールド）に接続できる');
    await Code.paste('\n' + F.SCHEMA.join('\n'));
    const ln = Code.find('"type": "metaobject"').line;
    await Code.reveal(ln, 600);
    Issue.ok(linesRect(ln, ln), 'メタオブジェクト型の設定', { below: true });
    await readHold(1800);
    Issue.hide();
    await Code.save({ status: 'U' });
    await Keycap.show(['Ctrl', '@'], 600);
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await Term.run('shopify theme dev --store greenbase-online --theme-editor-sync', [
      async () => Term.spin('Syncing theme #140318343264 on greenbase-online.myshopify.com', 1500, '<span class="tg">✓</span> Synced theme <span class="tdim">(#140318343264)</span>'),
      '', '<span class="tb">Preview your theme</span>', '  • <span class="tlink">http://127.0.0.1:9292</span>', '',
      '<span class="tb">Customize this theme in the Theme Editor</span>', `  • <span class="tlink" id="teLink">https://greenbase-online.myshopify.com/admin/themes/140318343264/editor</span>`, '', '<span class="tdim">(Use Ctrl+C to stop)</span>',
    ], { noPrompt: true });
    await wait(600);
  });

  /* 5 — theme editor: add the section, connect the dynamic source */
  scene('editor', async () => {
    Caption.step(5);
    Caption.set('テーマエディタ（開発中のテーマ）で商品ページを開き、セクション「植物の詳細」を追加');
    await hoverUi('#teLink', { kind: 'hand', hold: 300 });
    await Keycap.show(['Ctrl', 'クリック'], 500);
    Cursor.kind('arrow');
    await Win.switchTo('browser');
    Browser.addTab({ id: 'te', title: '商品 · Flow · テーマエディタ', url: EDITOR, page: 'editor', fav: 'admin' }, { anim: true });
    TE.open({ theme: 'Flow', badge: '開発', page: 'デフォルトの商品', tree: TREE(false) });
    Browser.loading('te', true);
    await TE.load('product', { states: ['noDetail'] });
    Browser.loading('te', false);
    await wait(500);
    await TE.scroll(TE.yOf(TE.doc.querySelector('[id*="custom_liquid_MD4Prp"]') || TE.doc.body, 520), 1400);
    await clickUi(TE.item('テンプレート+'), { after: 80 });
    const r = TE.item('テンプレート+').getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'gb-add-pop';
    pop.innerHTML = `<div class="s">${icon('search')}セクションを検索</div><h5>テーマのセクション</h5>` +
      [['植物の詳細', 'image'], ['画像付きテキスト', 'image'], ['よくある質問', 'help'], ['コレクションリスト', 'grid'], ['カスタム Liquid', 'code']].map(([n, i], k) => `<div class="i${k === 0 ? ' pk' : ''}">${K.ic(i)}${esc(n)}</div>`).join('');
    pop.style.left = r.right + 8 + 'px'; pop.style.top = Math.max(120, r.top - 120) + 'px';
    document.body.appendChild(pop);
    await wait(700);
    await clickUi($('.pk', pop), { after: 60 });
    pop.remove();
    TE.tree = TREE(true);
    TE.cur = 'detail';
    TE.renderTree({ newId: 'detail' });
    TE.setSettings('植物の詳細', detailSettings());
    await TE.load('product', { states: ['aboutOnly'] });
    await TE.scroll(TE.yOf(detailEl(), 120), 0);
    await wait(500);
    Caption.issue('表示されない', 'ABOUT だけで育て方が出ない：セクションの設定「植物」が空のまま（plant が blank）');
    Issue.show(detailEl(), '育て方が表示されない');
    await wait(2600);
    Issue.hide();
    Caption.set('「植物」は商品ごとに違う → 固定のエントリではなく、動的ソース「商品 › 植物」に接続');
    await clickUi('#setPlantSrc', { after: 80 });
    const rr = $('#setPlantSrc').getBoundingClientRect();
    const dp = document.createElement('div');
    dp.className = 'gb-dyn-pop';
    dp.innerHTML = '<h5>動的ソースに接続</h5><div class="pk">' + K.ic('tag') + '商品 › 植物<small>custom.plant</small></div><div>' + K.ic('store') + 'ストア › …</div>';
    dp.style.left = rr.right - 300 + 'px'; dp.style.top = rr.bottom + 6 + 'px';
    document.body.appendChild(dp);
    await wait(700);
    await clickUi($('.pk', dp), { after: 60 });
    dp.remove();
    TE.setSettings('植物の詳細', detailSettings({ dyn: true }));
    await wait(300);
    // the icons
    await clickUi($$('#teSetB .sa-in')[1], { after: 60 });
    TE.setSettings('植物の詳細', detailSettings({ dyn: true, icons: true }));
    await wait(300);
    Browser.loading('te', true);
    await TE.load('product', { states: ['hanaJson'] });
    Browser.loading('te', false);
    await TE.scroll(TE.yOf(detailEl(), 100), 0);
    await wait(400);
    await TE.scroll(TE.yOf(TE.doc.querySelector('.l-icon__gensanchi') || detailEl(), 240), 900);
    const dd = () => TE.doc.querySelector('.l-icon__hanakotoba dd');
    Caption.issue('表示ミス', '花言葉が「["快活","勝利"]」：リスト型の値を、そのまま出力していた');
    Issue.show(dd(), 'リストがそのまま出ている');
    await moveToEl(dd(), { ax: 0.4 });
    await wait(2800);
    Issue.hide();
    await Win.switchTo('code');
    const l = Code.find(F.DD_BAD.trim()).line;
    await Code.reveal(l, 500);
    await Code.overwrite('{{ plant[key] }}', [{ direct: "{%- if plant[key].list? -%}{{ plant[key].value | join: '" }, { r: ',', raw: true }, { direct: "' }}{%- else -%}{{ plant[key] }}{%- endif -%}" }], { kps: 20 });
    await Code.save();
    if (Code.text() !== F.SECTION_FINAL) { console.warn('[demo] parts-item-detail.liquid differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat('section'); }
    Code.lineCls[l] = 'good'; Code.render();
    Term.lines.push('<span class="tdim">14:31:06</span> <span class="tg">Synced</span> » update sections/parts-item-detail.liquid');
    Term.lines.push('<span class="tdim">14:31:06</span> <span class="tg">Synced</span> » update templates/product.json <span class="tdim">(テーマエディタから)</span>');
    Term.render(null);
    Code.setText('templates/product.json', F.TEMPLATE(true));
    await wait(700);
    await Win.switchTo('browser');
    Browser.loading('te', true);
    await TE.load('product');
    Browser.loading('te', false);
    await TE.scroll(TE.yOf(TE.doc.querySelector('.l-icon__gensanchi') || detailEl(), 240), 0);
    Caption.fixed('リストは join で区切って表示：「快活、勝利」（.list? でリスト型かどうかを判定）');
    Issue.ok(dd(), '快活、勝利');
    await readHold(2400);
    Issue.hide();
    await TE.scroll(TE.yOf(detailEl(), 100), 1200);
    TE.hl(detailEl(), '植物の詳細');
    Caption.set('テンプレートに追加したセクションは、テーマエディタから順番の入れ替え・非表示もできる');
    await wait(1800);
    await TE.scroll(TE.yOf(TE.doc.querySelector('.l-icon__kion') || detailEl(), 300), 1400);
    await wait(900);
    TE.hl(null);
    await TE.save();
  });

  /* 6 — mobile + publish */
  scene('mobile', async () => {
    Caption.step(6);
    Caption.set('モバイル表示で確認（幅 390px）');
    await clickUi($('#teDev [data-dev="sp"]'), { after: 60 });
    $$('#teDev span').forEach((s) => s.classList.toggle('on', s.dataset.dev === 'sp'));
    TE.dev = 'sp';
    Browser.loading('te', true);
    await TE.load('product', { states: ['spOverflow'] });
    Browser.loading('te', false);
    await TE.scroll(TE.yOf(detailEl(), 20), 0);
    await wait(300);
    await TE.scroll(TE.yOf(TE.doc.querySelector('.l-icon__hiatari') || detailEl(), 160), 900);
    const box = () => TE.doc.querySelector('.l-detail__block__icon');
    Caption.issue('表示崩れ', '育て方の文章が画面の右で切れている：一覧の幅を 620px に固定していた');
    Issue.show(() => screenRect($('#teCanvas')), '右にはみ出している');
    await wait(2800);
    Issue.hide();
    await Win.switchTo('code');
    await Code.openFile('assets/parts-item-detail.css', { top: 0 });
    await Code.overwrite(F.CSS_BAD, F.CSS_OK, { kps: 18 });
    await Code.save();
    if (Code.text() !== F.CSS_FINAL) { console.warn('[demo] parts-item-detail.css differs'); window.__typeDiff = (window.__typeDiff || []).concat('css'); }
    Term.lines.push('<span class="tdim">14:36:48</span> <span class="tg">Synced</span> » update assets/parts-item-detail.css');
    Term.render(null);
    await wait(600);
    await Win.switchTo('browser');
    Browser.loading('te', true);
    await TE.load('product');
    Browser.loading('te', false);
    await TE.scroll(TE.yOf(TE.doc.querySelector('.l-icon__hiatari') || detailEl(), 160), 0);
    Caption.fixed('幅を 100%（最大 620px）にして、スマートフォンでも画面に収まった');
    Issue.ok(() => screenRect(box() || $('#teCanvas')), '画面に収まる');
    await readHold(2400);
    Issue.hide();
    await TE.scroll(TE.yOf(TE.doc.querySelector('.l-icon__pet') || detailEl(), 300), 1200);
    await wait(800);
    await TE.scroll(TE.yOf(detailEl(), 60), 1300);
    await wait(1200);
    await TE.save();
    TE.dev = 'pc';
    $$('#teDev span').forEach((s) => s.classList.toggle('on', s.dataset.dev === 'pc'));

    // push + publish
    Caption.set('テーマライブラリの Flow に反映して、公開');
    await Win.switchTo('code');
    await Keycap.show(['Ctrl', 'C'], 600);
    Term.lines.push('');
    await Term.run('shopify theme push --theme "Flow"', [
      async () => Term.progress('Uploading files ', 168, 1400, { done: '<span class="tg">✓</span> Uploaded 168 files' }),
      '<span class="tg">✓</span> Your theme was pushed to <span class="tb">greenbase-online</span>  <span class="tdim">(Flow #140318343264, unpublished)</span>',
    ]);
    await wait(500);
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.clickTab('adm');
    Admin.show(V.themes({ flow: true, edited: true }), { nav: 'online/themes', title: 'テーマ', path: '/themes' });
    await wait(400);
    await clickUi('#libPublish', { after: 80 });
    Admin.modal('<p>テーマ「Flow」を購入して公開します。現在のテーマ「Dawn」はテーマライブラリに移動します。</p>', { title: 'Flow を公開しますか？', foot: H.btn('キャンセル') + H.btn('購入して公開', { pri: true, id: 'pubOk' }) });
    await wait(700);
    await clickUi('#pubOk', { after: 60 });
    await Admin.busy('#pubOk', 1100);
    Admin.closeModal();
    Admin.show(V.themes({ flowLive: true }), { nav: 'online/themes', title: 'テーマ', path: '/themes' });
    Admin.toast('Flow を公開しました');
    await hoverUi('.gb-th.live .sa-bd', { hold: 1200 });
  });

  /* 7 — the live store */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のストアで商品ページを確認');
    await Browser.newTab('live');
    await Browser.typeUrl('green-base.jp/products/pachira_s-rhomb_s_beige');
    Browser.nav('live', { url: `${LIVE}/products/pachira_s-rhomb_s_beige`, title: `${PROD.title} | GREEN BASE`, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('product');
    Browser.loading('live', false);
    await wait(1200);
    await hoverUi(Store.doc.querySelector('.merit__tag-inner') || Store.doc.body, { hold: 900 });
    const vars = [...Store.doc.querySelectorAll('.planter_variation li a')];
    if (vars[1]) { await hoverUi(vars[1], { kind: 'hand', hold: 700 }); await hoverUi(vars[3] || vars[1], { kind: 'hand', hold: 700 }); }
    Cursor.kind('arrow');
    await Store.scrollToEl('.p-detail__content', 140, 2000);
    Caption.set('育て方は「植物」メタオブジェクトから：同じ植物の鉢違いの商品にも、同じ内容が表示される');
    await wait(2200);
    await Store.scroll(Store.yOf(Store.doc.querySelector('.l-icon__pet') || Store.doc.body, 520), 1600);
    await wait(1200);
    Caption.set('トップページ');
    await Store.scroll(0, 1400);
    const logo = [...Store.doc.querySelectorAll('a.site-header__logo-image, header a[href="/"]')].find((a) => a.getBoundingClientRect().width > 0);
    if (logo) await clickUi(logo, { kind: 'hand', after: 60 });
    Cursor.kind('arrow');
    Browser.nav('live', { url: LIVE + '/', title: S.title });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    await wait(1400);
    const h = Store.doc.documentElement.scrollHeight;
    await Store.scroll(h * 0.18, 2200);
    await wait(1100);
    await Store.scroll(h * 0.42, 2200);
    await wait(1100);
    await Store.scroll(h * 0.62, 2000);
    await wait(1200);
    await Store.scroll(0, 2400);
    Caption.set('テーマ選定とメタオブジェクトによる商品ページのカスタマイズが完了');
    await wait(3800);
    Caption.hide();
  });

  /* ============================================================ storefront states */
  const ST = window.StoreFrame.STATES;
  const hide = (sel) => ({ on(doc) { doc.querySelectorAll(sel).forEach((e) => e.setAttribute('data-demo-hidden', '')); }, off(doc) { doc.querySelectorAll(sel).forEach((e) => e.removeAttribute('data-demo-hidden')); } });
  ST.noDetail = hide('[id*="parts_item_detail"]');
  ST.aboutOnly = hide('.l-detail__block__icon');
  ST.hanaJson = {
    on(doc) { const d = doc.querySelector('.l-icon__hanakotoba dd'); if (d) { d.dataset.demo = d.textContent; d.textContent = '["快活","勝利"]'; } },
    off(doc) { doc.querySelectorAll('[data-demo]').forEach((e) => { e.textContent = e.dataset.demo; delete e.dataset.demo; }); },
  };
  ST.spOverflow = {
    on(doc) { const s = doc.createElement('style'); s.id = 'demo-sp-overflow'; s.textContent = '.l-detail__block__icon{width:620px!important;max-width:none!important}html,body{overflow-x:auto!important}'; doc.head.appendChild(s); },
    off(doc) { const s = doc.getElementById('demo-sp-overflow'); if (s) s.remove(); },
  };

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'product'],
    fontText: JSON.stringify(JA) + F.SECTION_TYPED.join(''),
    async prepare() {
      const tree = [
        ['assets', 'dir', 1], ['assets/parts-item-detail.css'], ['config', 'dir', 0], ['config/settings_schema.json'], ['docs', 'dir', 1], ['docs/theme-selection.md'],
        ['layout', 'dir', 0], ['layout/theme.liquid'], ['sections', 'dir', 1], ['sections/main-product.liquid'], ['snippets', 'dir', 1], ['snippets/merit-tags.liquid'],
        ['templates', 'dir', 1], ['templates/product.json'], ['.shopifyignore'], ['README.md'], ['shopify.theme.toml'],
      ];
      Code.init(P, tree);
      Code.show('docs/theme-selection.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      // browser: the admin (themes) and the theme store (filtered)
      Browser.addTab({ id: 'adm', title: Admin.title('テーマ'), url: Admin.url('/themes'), page: 'admin', fav: 'admin' });
      Admin.show(V.themes({ flow: false }), { nav: 'online/themes', title: 'テーマ', path: '/themes' });
      const list = window.TSFrame.page('list');
      Browser.addTab({ id: 'ts', title: list.title, url: list.url, page: 'ts', fav: 'shopify' });
      await TS.load();
      TS.show('list');
      Admin.apps([]);
      K.hydrate();
      // VS Code is in front at the start (the requirements)
      Win.open('code', 'max');
    },
  });
  window.__JA = JA;
})();
