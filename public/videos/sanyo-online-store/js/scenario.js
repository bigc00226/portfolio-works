/*
 * Timeline: improving the existing SANYO ONLINE STORE —
 * analysis (searches without results, web performance) -> brand filter across brands (metafield, bulk script,
 * Search & Discovery, theme) -> store stock / OMO (locations, local pickup, store-stock snippet) -> speed of the
 * product page (Lighthouse, image_tag, unused app scripts) -> publish -> the live store.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect } = D;
  const { clickUi, hoverUi, moveToEl } = D;
  const { Code, Term, Browser, Admin, H, Store, DevTools, typeInput, choose, readHold } = K;
  const { V, LH } = window.Sanyo;
  const LIVE = 'https://store.sanyo-shokai.co.jp';
  const DEV = 'http://127.0.0.1:9292';
  const COLL = '/collections/all?gender=WOMEN&category=01-001001012';
  const PROD = '/products/h5b41876';
  /** the time on the video's clock (the taskbar), for the theme dev server's log lines */
  const hms = () => { const d = window.Win11.now(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map((x) => String(x).padStart(2, '0')).join(':'); };
  const P = F.files;
  const VARIANT = 'ブラック（09） / 34（XS）';

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'ブランド': { r: 'burando', segs: ['ブランド'], predict: ['ブランド', 'ブランド品'], yomi: ['ぶらんど', 'ぶらんどひん'] },
    'ブランドの表示名（絞り込み・商品カード）': [{ r: 'burandono', segs: ['ブランドの'] }, { r: 'hyoujimei(shiborikomi/shouhinka-do)', segs: ['表示名', '（絞り込み・', '商品カード）'] }],
    'は一度に': { r: 'haichidoni', segs: ['は', '一度に'] },
    '件まで': { r: 'kenmade', segs: ['件まで'] },
    '店舗在庫（ローカルピックアップを有効にした店舗）と、試着・取り置きの申し込み': [
      { r: 'tenpozaiko(ro-karupikkuappuwo', segs: ['店舗在庫', '（ローカルピックアップを'] },
      { r: 'yuukounishitatenpo)to,', segs: ['有効にした', '店舗）と、'] },
      { r: 'shichaku/toriokinomoushikomi', segs: ['試着・', '取り置きの', '申し込み'] }],
    '店舗在庫確認・試着申し込み': [{ r: 'tenpozaikokakunin/', segs: ['店舗在庫', '確認・'] }, { r: 'shichakumoushikomi', segs: ['試着', '申し込み'] }],
    '試着申し込みについて': { r: 'shichakumoushikominitsuite', segs: ['試着', '申し込みについて'] },
    'の店舗在庫': { r: 'notenpozaiko', segs: ['の', '店舗在庫'] },
    '在庫あり': { r: 'zaikoari', segs: ['在庫あり'], predict: ['在庫あり', '在庫'], yomi: ['ざいこあり', 'ざいこ'] },
    '在庫なし': { r: 'zaikonashi', segs: ['在庫なし'] },
    '試着・取り置きを申し込む': { r: 'shichaku/toriokiwomoushikomu', segs: ['試着・', '取り置きを', '申し込む'] },
    'パフォーマンス：': { r: 'pafo-mansu:', segs: ['パフォーマンス：'] },
    '秒・': { r: 'byou/', segs: ['秒・'] },
    '（要改善）': { r: '(youkaizen)', segs: ['（要改善）'] },
    '画像の': { r: 'gazouno', segs: ['画像の'] },
    'と': { r: 'to', segs: [{ c: ['と', '戸', '都'], p: 0 }] },
    '、使っていないアプリのスクリプトを削除': [{ r: ',tsukatteinaiapurino', segs: ['、', '使っていない', 'アプリの'] }, { r: 'sukuriputowosakujo', segs: ['スクリプトを', '削除'] }],
    'マッキントッシュ': { r: 'makkintosshu', segs: ['マッキントッシュ'], predict: ['マッキントッシュ', 'マッキントッシュロンドン'], yomi: ['まっきんとっしゅ', 'まっきんとっしゅろんどん'] },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1150), height: y.bottom - x.top };
  };
  async function selectLine(line) {
    const l = Code.files[Code.active].lines[line];
    const ind = l.match(/^\s*/)[0].length;
    await Code.dragSelect(line, ind, l.length);
  }
  /** the first element of a selector that is actually shown (the pages keep hidden copies for the other width) */
  const visible = (doc, sel) => [...doc.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 0) || doc.querySelector(sel);
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  /** the apps in the admin navigation (the kit's Admin.go only knows the store navigation) */
  async function openApp(id, html, o) {
    await Admin.open($(`#saApps [data-nav="app/${id}"]`), html, o);
    Admin.nav('app/' + id);
  }
  const sdList = (withBrand) => {
    const l = [['販売タイプ', '商品メタフィールド：custom.sale_type'], ['性別', '商品メタフィールド：custom.gender'], ['カテゴリ', '商品メタフィールド：custom.category'], ['カラー', 'バリエーションのオプション：カラー'], ['サイズ', 'バリエーションのオプション：サイズ'], ['柄', '商品メタフィールド：custom.pattern'], ['在庫', '在庫状況']]
      .map(([label, src]) => ({ label, src }));
    if (withBrand) l.splice(2, 0, { label: 'ブランド', src: '商品メタフィールド：custom.brand', isNew: true });
    return l;
  };
  const mfList = (withBrand) => {
    const l = [{ name: '販売タイプ', key: 'custom.sale_type', type: '単一行テキスト', filter: true, count: '19,391' }, { name: '性別', key: 'custom.gender', type: '単一行テキスト', filter: true, count: '19,391' },
      { name: 'カテゴリ', key: 'custom.category', type: '単一行テキスト', filter: true, count: '19,388' }, { name: '柄', key: 'custom.pattern', type: '単一行テキスト', filter: true, count: '17,604' },
      { name: 'サイズ区分', key: 'custom.size_category', type: '単一行テキスト', filter: true, count: '19,391' }, { name: '素材・取り扱い', key: 'custom.material', type: '複数行テキスト', filter: false, count: '19,215' }];
    if (withBrand) l.push({ name: 'ブランド', key: 'custom.brand', type: '単一行テキスト', filter: true, count: '0', isNew: true });
    return l;
  };
  const pickupList = (whOn, warn) => F.LOCATIONS.map((l) => ({ ...l, on: l.store || whOn, time: l.store ? F.PICKUP_TIME : '通常 1 時間以内に準備', warn: warn && !l.store }));
  /** Lighthouse: (a report on screen → ＋ for a new one) analyze the page load, then the report of that state of the story */
  async function lighthouse(key) {
    if (LH.root) {
      await clickUi('#lhNew', { after: 80 });
      LH.start();
      await wait(450);
    }
    await clickUi('#lhRun', { after: 60 });
    await LH.run(3400);
    LH.report(key);
    await wait(900); // the gauges fill (the renderer's own animation)
  }
  /** opens an audit of the report (its <details>) */
  async function openAudit(id) {
    const a = LH.audit(id);
    await clickUi(a.querySelector('summary'), { after: 60 });
    a.querySelector('details').open = true;
    await wait(450);
    return a;
  }
  /** the rect around several elements (for Issue.show) */
  const around = (...els) => () => {
    const rs = els.filter(Boolean).map((e) => screenRect(e));
    const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
    const right = Math.max(...rs.map((r) => r.right)), bottom = Math.max(...rs.map((r) => r.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — what to improve */
  scene('analysis', async () => {
    Caption.step(1);
    Caption.set('ストア分析：オンラインストアの検索で「結果なし」になっているキーワード');
    await hoverUi('#anNoResult tbody tr:nth-child(1) .an-q', { hold: 1300 });
    await hoverUi('#anNoResult tbody tr:nth-child(3) .an-q', { hold: 900 });
    Caption.set('ブランド名での検索と「店舗 在庫」「取り置き」の検索が上位');
    Issue.show($('#anSearch'), 'ブランド名・店舗在庫で探している');
    await hoverUi('#anNoResult tbody tr:nth-child(2) .an-q', { hold: 1400 });
    await hoverUi('#anNoResult tbody tr:nth-child(5) .an-q', { hold: 1200 });
    Issue.hide();
    Caption.set('Web パフォーマンス（実際の訪問者）：商品ページ（モバイル）の LCP・CLS が要改善');
    await hoverUi('#anPerf tbody tr:nth-child(1) td:nth-child(3)', { hold: 1300 });
    await hoverUi('#anPerf tbody tr:nth-child(2) td:nth-child(3)', { hold: 1300 });
    await hoverUi('#anPerf tbody tr:nth-child(3) td:nth-child(3)', { hold: 1000 });
    Caption.set('改善の優先順位：①ブランド横断の絞り込み ②店舗在庫の表示（OMO）③商品ページの表示速度');
    await Win.switchTo('code', { state: 'max' });
    await Code.openFile('docs/improvements-2026-08.md', { top: 0 });
    await hoverUi(Code.lineEl(2), { ax: 0.2, hold: 1300 });
    await hoverUi(Code.lineEl(7), { ax: 0.2, hold: 1200 });
    Caption.set('3 つ目（表示速度）に、計測値と対応方針を書き足す');
    await Code.lineAfter('## 3. 商品ページの表示速度', code(F.DOC_SPEED), { kps: 16 });
    await Code.save();
    check('docs/improvements-2026-08.md', P['docs/improvements-2026-08.md'] + '\n' + F.DOC_SPEED.join('\n'), 'doc');
  });

  /* 2 — a brand filter across all brands */
  scene('brand', async () => {
    Caption.step(2);
    Caption.set('テーマのローカル開発（Shopify CLI）を起動して、スカートの一覧を確認');
    await Keycap.show(['Ctrl', '@'], 600);
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await wait(250);
    await Term.run('shopify theme dev --store sanyo-online-store', [
      async () => Term.spin('Syncing theme with sanyo-online-store.myshopify.com', 1700, '<span class="tg">✓</span> Synced <span class="tdim">(development theme #146882011192)</span>'),
      '', '<span class="tb">Preview your theme</span>', `  • <span class="tlink">${DEV}</span>`, '', '<span class="tdim">(Use Ctrl+C to stop)</span>',
    ], { noPrompt: true });
    await Win.switchTo('browser');
    Browser.addTab({ id: 'dev', title: '商品一覧 | ファッション通販 - SANYO ONLINE STORE | 三陽商会', url: DEV + COLL, page: 'store', fav: 'store' }, { anim: true });
    Browser.loading('dev', true);
    await Store.load('collection', { states: ['noBrand', 'codes'] });
    Browser.loading('dev', false);
    await wait(700);
    const card = () => Store.doc.querySelector('.products-card__vendor');
    Caption.set('ブランドで絞り込めず、商品カードのブランド名も「2321」などのコードのまま');
    Issue.show(card(), 'ブランドコードが表示されている');
    await moveToEl(card(), { ax: 0.6 });
    await wait(2200);
    Issue.hide();
    await Store.scrollToEl('#sideBar-filter-gender-section', 220, 1400);
    Issue.show(Store.doc.querySelector('#sideBar-filter-gender-section'), 'ブランドの絞り込みがない', { below: true });
    await wait(2000);
    Issue.hide();
    await Store.scroll(0, 900);

    // the vendor field holds the brand code
    await Browser.clickTab('adm');
    await Admin.go('products', V.products(), { title: '商品', path: '/products' });
    Caption.set('販売元（vendor）には基幹システムのブランドコードが入っている（商品は約 19,400 件）');
    Issue.show(() => { const a = $('#prTable thead th:nth-child(4)'), b = $('#prTable tbody tr:last-child td:nth-child(4)'); if (!a || !b) return null; const x = screenRect(a), y = screenRect(b); return { left: x.left, top: x.top, width: x.width, height: y.bottom - x.top }; }, 'vendor = ブランドコード');
    await hoverUi('#prTable tbody tr:nth-child(1) td:nth-child(4) code', { hold: 1300 });
    await hoverUi('#prTable tbody tr:nth-child(4) td:nth-child(4) code', { hold: 1100 });
    Issue.hide();

    // metafield definition
    Caption.set('ブランドの表示名を持たせる商品メタフィールド「ブランド」（custom.brand）を定義');
    await Admin.openSettings('custom-data', V.metafields(mfList(false)), { title: '商品のメタフィールドの定義', path: 'custom_data/product/metafields' });
    await hoverUi('#mfTable tbody tr:nth-child(1) td:nth-child(3)', { hold: 900 });
    await clickUi('#mfAdd', { after: 80 });
    Admin.settings('custom-data', V.metafieldForm({ key: 'custom.' }), { title: '定義を追加', path: 'custom_data/product/metafields/new' });
    await wait(400);
    await typeInput('#mfName', [JA['ブランド']], { kps: 11 });
    await typeInput('#mfKey', 'brand', { keep: true, kps: 11 });
    await typeInput('#mfDesc', JA['ブランドの表示名（絞り込み・商品カード）'], { kps: 12 });
    await choose('#mfType', ['単一行テキスト', '複数行テキスト', '整数', '日付', 'ファイル', 'メタオブジェクト'], '単一行テキスト');
    await clickUi('#mfFilter', { after: 60 });
    $('#mfFilter').classList.add('on');
    Admin.saveBar(true);
    await wait(400);
    await Admin.saveFromBar('定義を保存しました');
    Admin.settings('custom-data', V.metafields(mfList(true)), { title: '商品のメタフィールドの定義', path: 'custom_data/product/metafields' });
    await wait(600);
    await hoverUi('#mfTable tbody tr:last-child td:nth-child(1) b', { hold: 1000 });
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();

    // set the brand names on all products
    Caption.set('ブランドコード → ブランド名の対応表から、全商品の custom.brand を Admin API でまとめて設定');
    await Win.switchTo('code');
    await Code.openFile('scripts/brands.json', { top: 0 });
    await hoverUi(Code.lineEl(3), { ax: 0.15, hold: 1300 });
    await hoverUi(Code.lineEl(9), { ax: 0.15, hold: 1200 });
    await Code.openFile('scripts/set-brand-metafield.mjs', { top: 0 });
    const todo = Code.find('// TODO').line;
    await Code.reveal(todo + 4, 500);
    await Code.dragSelect(todo, 0, Code.files[Code.active].lines[todo].length);
    await Code.type(code(F.SET_LOOP), { kps: 22 });
    await Code.save();
    check('scripts/set-brand-metafield.mjs', F.SET_FINAL, 'set-brand');
    Term.lines.push('');
    await Keycap.show(['Ctrl', 'Shift', '@'], 600);
    Term.prompt = 'PS C:\\dev\\sanyo-online-store-theme> ';
    await Term.run('node scripts/set-brand-metafield.mjs', [
      async () => Term.progress('custom.brand を設定中 ', F.TOTAL, 3200, { steps: 16 }),
      `<span class="tg">✓</span> ${F.TOTAL.toLocaleString()} 商品にブランドを設定しました`,
    ]);
    await wait(500);

    // the card shows the metafield
    Caption.set('商品カード：ブランドコードではなく、メタフィールドのブランド名を表示');
    await Code.expand('snippets');
    await Code.openFile('snippets/card-product.liquid', { top: 0 });
    await Code.overwrite(F.VENDOR_BEFORE, F.VENDOR_AFTER, { kps: 20 });
    await Code.save();
    Term.lines.push(`<span class="tdim">${hms()}</span> <span class="tg">Synced</span> » update snippets/card-product.liquid`);
    Term.render(null);

    // Search & Discovery
    Caption.set('Search & Discovery アプリ：フィルター「ブランド」を追加（ソースは商品メタフィールド）');
    await Win.switchTo('browser');
    await openApp('sd', V.sdFilters(sdList(false)), { title: 'Search & Discovery', path: '/apps/search-and-discovery/filters' });
    await clickUi('#sdAdd', { after: 80 });
    Admin.modal(V.sdAdd(), { title: 'フィルターを追加', foot: H.btn('キャンセル') + H.btn('追加', { pri: true, id: 'sdSave' }) });
    await wait(300);
    await choose('#sdSrc', ['在庫状況', '価格', '商品タイプ', '販売元', 'タグ', '商品メタフィールド：ブランド（custom.brand）', 'バリエーションのオプション'], '商品メタフィールド：ブランド（custom.brand）', { look: 700 });
    await typeInput('#sdLabel', [JA['ブランド']], { kps: 11 });
    await clickUi('#sdSave', { after: 60 });
    await Admin.busy('#sdSave', 600);
    Admin.closeModal();
    Admin.show(V.sdFilters(sdList(true)), { title: 'Search & Discovery', path: '/apps/search-and-discovery/filters' });
    Admin.toast('フィルターを保存しました');
    await wait(500);
    Caption.set('並び順は「性別」の次に');
    await hoverUi('#sdTable tbody tr.new td:nth-child(2) b', { hold: 1200 });

    // the storefront: card ok, filter missing
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('collection', { states: ['noBrand'] }); });
    await wait(500);
    Caption.set('商品カードにはメタフィールドのブランド名が出るようになった');
    Issue.ok(card(), 'ブランド名');
    await wait(2200);
    Issue.hide();
    await Store.scrollToEl('#sideBar-filter-gender-section', 220, 1200);
    Caption.issue('表示されない', 'ブランド名は出たが、絞り込みに「ブランド」が出てこない');
    Issue.show(Store.doc.querySelector('#sideBar-filter-gender-section'), 'ブランドがない', { below: true });
    await wait(2800);
    Issue.hide();
    Caption.set('原因：テーマの facets.liquid が、表示するフィルターを固定のリストで決めていた');
    await Win.switchTo('code');
    await Code.openFile('snippets/facets.liquid', { top: 0 });
    Issue.show(linesRect(1, 1), '表示するフィルターのリスト（ブランドがない）', { below: true });
    await wait(2600);
    Issue.hide();
    const at = Code.find('filter.p.m.custom.category', 1);
    await Code.clickAt(at.line, at.col);
    await Code.type(F.BRAND_PARAM, { kps: 16 });
    await Code.save();
    check('snippets/facets.liquid', P['snippets/facets.liquid'].replace('filter.p.m.custom.category', F.BRAND_PARAM + 'filter.p.m.custom.category'), 'facets');
    Code.lineCls[1] = 'good'; Code.render();
    Term.lines.push(`<span class="tdim">${hms()}</span> <span class="tg">Synced</span> » update snippets/facets.liquid`);
    Term.render(null);
    await wait(400);
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('collection'); });
    await Store.scrollToEl('#sideBar-filter-gender-section', 220, 0);
    const brand = Store.doc.querySelector('#sideBar-filter-brand-section');
    Caption.fixed('リストに filter.p.m.custom.brand を追加：全ブランドを横断して「ブランド」で絞り込める');
    Issue.ok(brand, 'ブランド（件数つき）');
    await readHold(2400);
    Issue.hide();
    const amaca = brand && brand.querySelector('dd label');
    if (amaca) await hoverUi(amaca, { kind: 'hand', hold: 1100 });
    Cursor.kind('arrow');
    await Store.scroll(0, 1000);
    delete Code.lineCls[1];

    // synonyms for the searches without results (katakana brand names)
    Caption.set('検索の「結果なし」対策：Search & Discovery のシノニムに、ブランドのカタカナ表記を登録');
    await Browser.clickTab('adm');
    await clickUi($('.sd-tabs span:nth-child(2)'), { after: 60 });
    Browser.loading('adm', true); await wait(300); Browser.loading('adm', false);
    Admin.show(V.sdSynonyms([]), { title: 'Search & Discovery', path: '/apps/search-and-discovery/synonyms' });
    await wait(400);
    await clickUi('#synAdd', { after: 80 });
    Admin.modal(H.field('シノニムグループ', '', { id: 'synTerms', ta: true, ph: 'カンマで区切って入力' }) + '<p class="sa-mute" style="margin:0">例：マッキントッシュ, MACKINTOSH</p>', { title: 'シノニムグループを作成', foot: H.btn('キャンセル') + H.btn('保存', { pri: true, id: 'synSave' }) });
    await wait(300);
    await typeInput('#synTerms', [JA['マッキントッシュ'], { direct: ', MACKINTOSH LONDON, MACKINTOSH PHILOSOPHY' }], { kps: 14 });
    await clickUi('#synSave', { after: 60 });
    await Admin.busy('#synSave', 600);
    Admin.closeModal();
    Admin.show(V.sdSynonyms(F.SYNONYMS.map((t, i) => ({ terms: t, isNew: i === 0 }))), { title: 'Search & Discovery', path: '/apps/search-and-discovery/synonyms' });
    Admin.toast('シノニムグループを保存しました');
    Caption.set('ほかのブランドも同じように登録：「ポールスチュアート ニット」なども検索結果に出るように');
    await hoverUi('#synTable tbody tr:nth-child(1) b', { hold: 1100 });
    await hoverUi('#synTable tbody tr:nth-child(2) b', { hold: 1200 });
  });

  /* 3 — store stock / OMO */
  scene('omo', async () => {
    Caption.step(3);
    Caption.set('実店舗の在庫を EC の商品ページへ：店舗はロケーションとして登録済み');
    await Browser.clickTab('adm');
    await Admin.openSettings('locations', V.locations(F.LOCATIONS), { title: 'ロケーション', path: 'locations' });
    await hoverUi('.loc-row:nth-child(2) b', { hold: 900 });
    await hoverUi('.loc-row:nth-child(1) b', { hold: 900 });
    Caption.set('配送と配達 → ローカルピックアップ：店舗ごとに「店舗受け取り・取り置き」を有効化');
    await clickUi($('#saSetNav [data-set="shipping"]'), { after: 60 });
    Browser.loading('adm', true); await wait(300); Browser.loading('adm', false);
    const list = pickupList(true, false);
    list.find((l) => l.id === 'yokohama').on = false;
    Admin.settings('shipping', V.pickup(list), { title: 'ローカルピックアップ', path: 'shipping/local_pickup' });
    await wait(500);
    await hoverUi('.loc-row[data-loc="ginza"] .sa-mute', { hold: 1000 });
    await clickUi('.loc-row[data-loc="yokohama"] .sa-tg', { after: 60 });
    $('.loc-row[data-loc="yokohama"] .sa-tg').classList.add('on');
    $('.loc-row[data-loc="yokohama"] .sa-mute').textContent = F.PICKUP_TIME;
    Admin.saveBar(true);
    await wait(400);
    await Admin.saveFromBar('ローカルピックアップの設定を保存しました');
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();

    // the snippet
    Caption.set('スニペット store-stock.liquid：variant.store_availabilities で店舗ごとの在庫と取り置きの目安を表示');
    await Win.switchTo('code');
    await Code.newFile('snippets/store-stock.liquid');
    await Code.type(code(F.STORE_STOCK_LINES), { kps: 23 });
    await Code.save({ status: 'U' });
    check('snippets/store-stock.liquid', F.STORE_STOCK_FINAL, 'store-stock');
    Caption.set('商品ページのカートボタンの下に読み込む');
    await Code.expand('sections');
    await Code.openFile('sections/main-product.liquid', { top: 0 });
    await Code.lineAfter("{%- render 'product-buy-buttons'", [{ direct: F.RENDER_STOCK }], { kps: 22 });
    await Code.save();
    Term.lines.push(`<span class="tdim">${hms()}</span> <span class="tg">Synced</span> » update snippets/store-stock.liquid`);
    Term.lines.push(`<span class="tdim">${hms()}</span> <span class="tg">Synced</span> » update sections/main-product.liquid`);
    Term.render(null);
    await wait(400);

    // preview: the warehouse shows up
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    await Browser.typeUrl(`127.0.0.1:9292${PROD}`);
    Browser.nav('dev', { url: DEV + PROD, title: '【Sleaford(スリーフォード)】HEAT TWEED製(コート)｜MACKINTOSH PHILOSOPHY' });
    Browser.loading('dev', true);
    await Store.load('product');
    Browser.loading('dev', false);
    await wait(600);
    const btn = () => visible(Store.doc, '.productDetail__button.stockCheck');
    await hoverUi(btn(), { kind: 'hand', hold: 500 });
    await clickUi(btn(), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    window.StoreFrame.state(Store.doc, 'stockModalWh', true);
    await wait(800);
    const wh = () => Store.doc.querySelector('.storeStock__item.wh');
    Caption.issue('表示ミス', '店舗在庫の一覧に「EC 物流センター」が出ている（物流センターのピックアップも有効になっていた）');
    Issue.show(wh(), '店舗ではない');
    await moveToEl(wh(), { ax: 0.7 });
    await wait(3000);
    Issue.hide();
    await Browser.clickTab('adm');
    await Admin.openSettings('shipping', V.pickup(pickupList(true, true)), { title: 'ローカルピックアップ', path: 'shipping/local_pickup' });
    Issue.show($('.loc-row[data-loc="wh"]'), '物流センター：ピックアップが有効');
    await wait(1600);
    Issue.hide();
    await clickUi('.loc-row[data-loc="wh"] .sa-tg', { after: 60 });
    $('.loc-row[data-loc="wh"] .sa-tg').classList.remove('on');
    $('.loc-row[data-loc="wh"] .sa-mute').textContent = '無効';
    Admin.saveBar(true);
    await wait(300);
    await Admin.saveFromBar('ローカルピックアップの設定を保存しました');
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('product'); });
    await clickUi(btn(), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    window.StoreFrame.state(Store.doc, 'stockModal', true);
    await wait(500);
    Caption.fixed('物流センターのピックアップを無効に：店舗だけの在庫と、取り置きの目安が表示された');
    Issue.ok(Store.doc.querySelector('.storeStock__box'), '店舗の在庫だけ');
    await readHold(2600);
    Issue.hide();
    await hoverUi(Store.doc.querySelector('.storeStock__apply'), { kind: 'hand', hold: 1000 });
    Cursor.kind('arrow');
    window.StoreFrame.state(Store.doc, 'stockModal', false);
    // smartphone
    Caption.set('スマートフォン幅でも確認（カートボタンの下に「店舗在庫確認・試着申し込み」）');
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Store.loadSp('product');
    await Store.scrollToEl(visible(Store.spDoc, '.productDetail__button.stockCheck'), 260, 1500, true);
    await wait(1800);
    Store.device(false);
  });

  /**
   * The Performance score: in the DevTools report the categories' gauges (.lh-category) are the other three; the score
   * sits in the scores header, and in the sticky header once the report is scrolled down.
   */
  const perfGauge = () => [LH.q('.lh-sticky-header .lh-gauge__wrapper'), LH.q('.lh-scores-header .lh-gauge__wrapper')].find((e) => e && D.visibleRect(e).height > 4) || LH.q('.lh-scores-header .lh-gauge__wrapper');

  /* 4 — product page speed */
  scene('speed', async () => {
    Caption.step(4);
    Caption.set('商品ページの表示速度：DevTools の Lighthouse（モバイル）で計測');
    await Keycap.show(['F12'], 600);
    LH.open();
    await DevTools.open(true);
    await wait(400);
    await lighthouse('before');
    Caption.issue('遅い', 'パフォーマンス 38：画像に width / height がなくレイアウトがずれ、使っていないアプリのスクリプトも読み込んでいる');
    await hoverUi(perfGauge(), { hold: 900 });
    await LH.scrollTo(LH.q('.lh-audit-group--metrics'), 74, 800);
    Issue.show(LH.audit('cumulative-layout-shift'), 'レイアウトのずれ', { below: true });
    await wait(1500);
    await LH.scrollTo(LH.q('.lh-audit-group--insights'), 74, 900);
    Issue.show(around(LH.audit('cls-culprits-insight'), LH.audit('image-delivery-insight')), 'サイズ指定のない画像・大きすぎる画像');
    await wait(1900);
    Issue.hide();
    await LH.scrollTo(LH.audit('unused-javascript'), 110, 800);
    const uj = await openAudit('unused-javascript');
    // the table groups the scripts by origin; the two app scripts are the first rows of this site's group
    const apps = [...uj.querySelectorAll('.lh-table tbody tr')].filter((tr) => /legacy-review-widget|chat-support-v1/.test(tr.textContent));
    await LH.scrollTo(apps[0], 170, 600);
    Issue.show(around(...apps), '使っていないアプリのスクリプト');
    await wait(2300);
    Issue.hide();

    await Win.switchTo('code');
    Caption.set('商品画像：image_tag で width / height と srcset（360〜1500px）を出力し、遅延読み込みに');
    await Code.openFile('snippets/product-media.liquid', { top: 0 });
    await Code.overwrite(F.IMG_BEFORE, F.IMG_AFTER, { kps: 24 });
    await Code.save();
    Caption.set('2021 年に解約したレビュー・チャットのアプリのスクリプトが残っていたので削除');
    await Code.expand('layout');
    await Code.openFile('layout/theme.liquid', { top: 0 });
    const a = Code.find('legacy-review-widget.js').line;
    Issue.show(linesRect(a, a + 1), '使っていないスクリプト', { below: true });
    await wait(1600);
    Issue.hide();
    await Code.selectLines(a, a + 1);
    await Code.type([{ key: 'Backspace' }]);
    // a second Backspace joins the empty line with the one above
    KeyStrip.special('Backspace');
    Code.files[Code.active].lines.splice(a, 1);
    Code.setCaret(a - 1, Code.files[Code.active].lines[a - 1].length);
    KeyStrip.idleHide(700);
    await wait(300);
    await Code.save();
    Term.lines.push(`<span class="tdim">${hms()}</span> <span class="tg">Synced</span> » update snippets/product-media.liquid`);
    Term.lines.push(`<span class="tdim">${hms()}</span> <span class="tg">Synced</span> » update layout/theme.liquid`);
    Term.render(null);
    await wait(300);

    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('product'); });
    Caption.set('もう一度計測');
    await lighthouse('lazy');
    Caption.issue('LCP が悪化', 'CLS は 0.02 に改善したが、1 枚目の商品画像まで loading="lazy" にしたため LCP が 7.1 秒に');
    await LH.scrollTo(LH.q('.lh-audit-group--metrics'), 74, 800);
    Issue.show(LH.audit('largest-contentful-paint'), 'LCP 7.1 秒');
    await wait(1500);
    Issue.hide();
    await LH.scrollTo(LH.q('.lh-audit-group--insights'), 74, 800);
    const ld = await openAudit('lcp-discovery-insight');
    await LH.scrollTo(ld, 72, 500);
    Issue.show(around(...ld.querySelectorAll('.lh-checklist-item'), ld.querySelector('.lh-node')), '最初の画像を遅延読み込みしている');
    await wait(2900);
    Issue.hide();
    await Win.switchTo('code');
    await Code.openFile('snippets/product-media.liquid');
    await Code.lineAfter('<div class="product-media__item">', [{ direct: F.LAZY_FIX_LINE }], { kps: 24 });
    await Code.overwrite("loading: 'lazy'", 'loading: loading', { from: 4, kps: 18 });
    await Code.save();
    check('snippets/product-media.liquid', F.MEDIA_FINAL, 'media');
    Code.lineCls[3] = 'good'; Code.render();
    Term.lines.push(`<span class="tdim">${hms()}</span> <span class="tg">Synced</span> » update snippets/product-media.liquid`);
    Term.render(null);
    await wait(400);
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('product'); });
    Caption.set('1 枚目の画像だけ eager にして、もう一度計測');
    await lighthouse('fixed');
    Caption.fixed('1 枚目だけ eager（それ以外は lazy）に：パフォーマンス 38 → 86、LCP 2.4 秒・CLS 0.02');
    await hoverUi(perfGauge(), { hold: 900 });
    await LH.scrollTo(LH.q('.lh-audit-group--metrics'), 74, 800);
    Issue.ok(LH.q('.lh-audit-group--metrics .lh-metrics-container'), 'LCP 2.4 秒・CLS 0.02');
    await readHold(2800);
    Issue.hide();
    await hoverUi(perfGauge(), { hold: 1200 });
    await Keycap.show(['F12'], 500);
    await DevTools.open(false);
    LH.close();
    delete Code.lineCls[3];

    // publish
    Caption.set('ライブテーマのコピーにアップロードして、プレビューで確認してから公開');
    await Win.switchTo('code');
    await Keycap.show(['Ctrl', 'C'], 500);
    Term.lines.push('');
    await Term.run(`shopify theme push --unpublished --theme "${F.NEW_THEME}"`, [
      async () => Term.progress('Uploading files ', 286, 1500, { done: '<span class="tg">✓</span> Uploaded 286 files' }),
      `<span class="tg">✓</span> The theme <span class="tb">${esc(F.NEW_THEME)}</span> was uploaded <span class="tdim">(#146882142264, unpublished)</span>`,
    ], { kps: 18 });
    await wait(600);
    await Code.panel(false);
    await Win.switchTo('browser');
    await Browser.clickTab('adm');
    await Admin.go('online/themes', V.themes('uploaded'), { title: 'テーマ', path: '/themes' });
    await hoverUi('#thNew b', { hold: 900 });
    await clickUi('#thPublish', { after: 60 });
    Admin.modal(`<p>「${esc(F.NEW_THEME)}」を公開しますか？</p><p class="sa-mute">現在のライブテーマ「SANYO ONLINE STORE」はテーマライブラリに移動します。</p>`, { title: 'テーマを公開', foot: H.btn('キャンセル') + H.btn('公開', { pri: true, id: 'thOk' }) });
    await wait(500);
    await clickUi('#thOk', { after: 60 });
    await Admin.busy('#thOk', 900);
    Admin.closeModal();
    Admin.show(V.themes('published'), { title: 'テーマ', path: '/themes' });
    Admin.toast(`${F.NEW_THEME} を公開しました`);
    await wait(1200);
  });

  /* 5 — the live store */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のストアで確認：スカートの一覧');
    await Browser.newTab('live');
    await Browser.typeUrl('store.sanyo-shokai.co.jp' + COLL);
    Browser.nav('live', { url: LIVE + COLL, title: '商品一覧 | ファッション通販 - SANYO ONLINE STORE | 三陽商会', page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('collection');
    Browser.loading('live', false);
    await wait(1200);
    await Store.scrollToEl('#sideBar-filter-gender-section', 220, 1600);
    const brand = Store.doc.querySelector('#sideBar-filter-brand-section');
    Caption.set('ブランドを横断して絞り込み（AMACA・EPOCA・MACKINTOSH LONDON・Paul Stuart …）');
    Issue.ok(brand, 'ブランド');
    await readHold(1800);
    Issue.hide();
    await Store.scroll(1250, 1800);
    await wait(900);
    await Store.scroll(0, 1200);
    // product page
    Caption.set('商品ページ：「店舗在庫確認・試着申し込み」とカラー × サイズごとの在庫');
    await Browser.typeUrl('store.sanyo-shokai.co.jp' + PROD);
    Browser.nav('live', { url: LIVE + PROD, title: '【Sleaford(スリーフォード)】HEAT TWEED製(コート)｜MACKINTOSH PHILOSOPHY(マッキントッシュ フィロソフィー)のファッション通販' });
    Browser.loading('live', true);
    await Store.load('product');
    Browser.loading('live', false);
    await wait(900);
    const btn = visible(Store.doc, '.productDetail__button.stockCheck');
    Issue.ok(btn, '店舗在庫確認・試着申し込み', { below: true });
    await hoverUi(btn, { kind: 'hand', hold: 1600 });
    Issue.hide();
    Cursor.kind('arrow');
    await Store.scroll(Store.yOf(Store.doc.querySelector('.productDetail__product__wrapper') || Store.doc.body, 120), 1700);
    await wait(1600);
    Caption.set('スマートフォンでも、カートボタンのすぐ下から店舗在庫を確認できる');
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Store.loadSp('product');
    const spBtn = visible(Store.spDoc, '.productDetail__button.stockCheck');
    await Store.scrollToEl(spBtn, 300, 1600, true);
    Issue.ok(spBtn, '店舗在庫確認・試着申し込み', { below: true });
    await readHold(2200);
    Issue.hide();
    Store.device(false);
    await Store.scroll(0, 1200);
    Caption.set('トップページ：WOMEN / MEN のブランドリストから、ブランドごとのページへ');
    const logo = Store.doc.querySelector('.header__logo a, a.header__heading-link, header a[href="/"]');
    if (logo) await clickUi(logo, { kind: 'hand', after: 60 });
    Cursor.kind('arrow');
    Browser.nav('live', { url: LIVE + '/', title: S.title });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    await wait(900);
    const bl = Store.doc.querySelector('#gender__womenBrand') || [...Store.doc.querySelectorAll('h2, h3')].find((h) => /BRAND|ブランド/i.test(h.textContent));
    if (bl) await Store.scrollToEl(bl, 120, 2200);
    await wait(1800);
    await Store.scroll(0, 1800);
    Caption.set('ブランド横断の絞り込み・店舗在庫（OMO）・商品ページの表示速度の改善を公開');
    await wait(3600);
    Caption.hide();
  });

  /* ============================================================ storefront states */
  const ST = window.StoreFrame.STATES;
  ST.noBrand = {
    on(doc) { doc.querySelectorAll('#sideBar-filter-brand-section').forEach((e) => e.setAttribute('data-demo-hidden', '')); },
    off(doc) { doc.querySelectorAll('#sideBar-filter-brand-section').forEach((e) => e.removeAttribute('data-demo-hidden')); },
  };
  ST.codes = {
    on(doc) { doc.querySelectorAll('.products-card__vendor').forEach((e) => { const c = F.CODE_OF[e.textContent.trim()]; if (c) { e.dataset.demo = e.textContent; e.textContent = c; } }); },
    off(doc) { doc.querySelectorAll('.products-card__vendor[data-demo]').forEach((e) => { e.textContent = e.dataset.demo; delete e.dataset.demo; }); },
  };
  /** the store-stock dialog of the snippet (the live store opens its own TRY & PICK page instead) */
  function stockModal(doc, wh) {
    const old = doc.getElementById('demoStoreStock'); if (old) old.remove();
    const rows = [...(wh ? [['EC 物流センター', true, '通常 1 時間以内に準備', 'wh']] : []), ...F.STORE_STOCK.map(([n, ok]) => [n, ok, F.PICKUP_TIME, ''])];
    const el = doc.createElement('div');
    el.id = 'demoStoreStock';
    el.innerHTML = `<style>
      #demoStoreStock { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; font-family: "Noto Sans JP", sans-serif; }
      #demoStoreStock .storeStock__box { width: 560px; background: #fff; padding: 28px 32px 30px; color: #202124; box-shadow: 0 10px 40px rgba(0,0,0,.25); }
      #demoStoreStock h2 { font-size: 17px; margin: 0 0 4px; font-weight: 700; letter-spacing: .04em; }
      #demoStoreStock .sub { font-size: 12.5px; color: #666; margin: 0 0 18px; }
      #demoStoreStock ul { list-style: none; padding: 0; margin: 0 0 22px; border-top: 1px solid #e5e5e5; }
      #demoStoreStock li { display: flex; align-items: center; gap: 16px; padding: 12px 4px; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
      #demoStoreStock .storeStock__name { flex: 1; font-weight: 500; }
      #demoStoreStock .storeStock__ok { color: #fff; background: #33478a; font-size: 12px; padding: 3px 10px; }
      #demoStoreStock .storeStock__ng { color: #888; background: #eee; font-size: 12px; padding: 3px 10px; }
      #demoStoreStock .storeStock__time { color: #666; font-size: 12px; width: 150px; text-align: right; }
      #demoStoreStock .storeStock__apply { display: block; height: 46px; line-height: 46px; text-align: center; background: #333; color: #fff; font-weight: 700; letter-spacing: .06em; text-decoration: none; }
      #demoStoreStock .x { float: right; font-size: 22px; line-height: 1; color: #555; }
    </style><div class="storeStock__box"><span class="x">×</span><h2>${esc(VARIANT)} の店舗在庫</h2><p class="sub">【Sleaford(スリーフォード)】HEAT TWEED製 ｜ 商品番号 H5B41876</p>
      <ul>${rows.map(([n, ok, t, c]) => `<li class="storeStock__item ${c}"><span class="storeStock__name">${esc(n)}</span>${ok ? `<span class="storeStock__ok">在庫あり</span><span class="storeStock__time">${esc(t.replace('お取り置き：', ''))}</span>` : '<span class="storeStock__ng">在庫なし</span><span class="storeStock__time"></span>'}</li>`).join('')}</ul>
      <a class="storeStock__apply" href="#">試着・取り置きを申し込む</a></div>`;
    doc.body.appendChild(el);
  }
  ST.stockModal = { on(doc) { stockModal(doc, false); }, off(doc) { const e = doc.getElementById('demoStoreStock'); if (e) e.remove(); } };
  ST.stockModalWh = { on(doc) { stockModal(doc, true); }, off(doc) { const e = doc.getElementById('demoStoreStock'); if (e) e.remove(); } };

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['collection', 'product'],
    fontText: JSON.stringify(JA),
    async prepare() {
      const tree = [
        ['assets', 'dir', 0], ['assets/base.css'], ['assets/chat-support-v1.js'], ['assets/global.js'], ['assets/legacy-review-widget.js'],
        ['config', 'dir', 0], ['config/settings_data.json'],
        ['docs', 'dir', 1], ['docs/improvements-2026-08.md'],
        ['layout', 'dir', 0], ['layout/theme.liquid'],
        ['scripts', 'dir', 1], ['scripts/lib', 'dir', 0], ['scripts/lib/admin.mjs'], ['scripts/brands.json'], ['scripts/set-brand-metafield.mjs'],
        ['sections', 'dir', 0], ['sections/main-collection-product-grid.liquid'], ['sections/main-product.liquid'],
        ['snippets', 'dir', 0], ['snippets/card-product.liquid'], ['snippets/facets.liquid'], ['snippets/product-media.liquid'],
        ['.env'], ['.gitignore'], ['package.json'], ['shopify.theme.toml'],
      ];
      Code.init(P, tree);
      Code.show('shopify.theme.toml', { top: 0 });
      Term.prompt = 'PS C:\\dev\\sanyo-online-store-theme> ';
      Term.render('<span class="caret"></span>');
      Admin.apps([{ id: 'sd', name: 'Search & Discovery', color: '#4f5bd5', initials: 'S' }, { id: 'pf', name: 'PageFly', color: '#2f86ff', initials: 'P' }, { id: 'bis', name: 'Back in Stock', color: '#e8833a', initials: 'B' }]);
      Browser.addTab({ id: 'adm', title: Admin.title('ストア分析'), url: Admin.url('/analytics'), page: 'admin', fav: 'admin' });
      Admin.show(V.analytics(), { nav: 'analytics', title: 'ストア分析', path: '/analytics' });
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
