/*
 * Timeline: moving store.nissin.com from makeshop to Shopify —
 * export (makeshop CSV) -> convert (Node script, Shift_JIS) -> product import -> customers + customer accounts
 * -> URL redirects (+ check) -> theme (product card with 販売単位 / tax display) -> domain + opening -> the live store.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, Clock, screenRect } = D;
  const { clickUi, hoverUi, moveToEl } = D;
  const { Code, Term, Browser, Admin, H, Store, FileDialog, typeInput, readHold } = K;
  const { MS, V, yen } = window.Nissin;
  const IT = F.ITEMS[0];
  const LIVE = 'https://store.nissin.com';
  const DEV = 'http://127.0.0.1:9292';
  const P = F.files;

  /* ------------------------------------------------ Japanese typed through the IME (romaji -> conversion) */
  const JA = {
    '販売方法': { r: 'hanbaihouhou', segs: ['販売方法'] },
    '通常購入': { r: 'tsuujoukounyuu', segs: ['通常購入'], predict: ['通常購入', '通常価格'], yomi: ['つうじょうこうにゅう', 'つうじょうかかく'] },
    '独自商品コード': { r: 'dokujishouhinko-do', segs: ['独自', '商品コード'] },
    '販売単位': { r: 'hanbaitani', segs: ['販売単位'] },
    '単品の行：商品の情報はこの': [{ r: 'tanpinnnogyou:', segs: ['単品の', '行：'] }, { r: 'shouhinnnojouhouhakono', segs: ['商品の', '情報は', 'この'] }],
    '行目に入れる': { r: 'gyoumeniireru', segs: ['行目に', '入れる'] },
    '商品名': { r: 'shouhinmei', segs: ['商品名'], predict: ['商品名', '商品'], yomi: ['しょうひんめい', 'しょうひん'] },
    'ブランド': { r: 'burando', segs: ['ブランド'] },
    '単位': { r: 'tani', segs: [{ c: ['谷', '単位', '他に'], p: 1 }], candHold: 220 },
    '品番': { r: 'hinban', segs: ['品番'] },
    '販売価格': { r: 'hanbaikakaku', segs: ['販売価格'] },
    '在庫数': { r: 'zaikosuu', segs: ['在庫数'] },
    '商品画像': { r: 'shouhingazou', segs: ['商品画像'] },
    'ケース販売は同じハンドルの': [{ r: 'ke-suhanbaiha', segs: ['ケース', '販売は'] }, { r: 'onajihandoruno', segs: ['同じ', 'ハンドルの'] }],
    '行目（バリエーション）にする': { r: 'gyoume(barie-shon)nisuru', segs: ['行目', '（バリエーション）', 'にする'] },
    'ケース入数': { r: 'ke-suirisuu', segs: ['ケース', '入数'] },
    '箱': { r: 'hako', segs: ['箱'] },
    '入': { r: 'iri', segs: ['入'] },
    'ケース販売価格': { r: 'ke-suhanbaikakaku', segs: ['ケース', '販売価格'] },
    'ケース定価': { r: 'ke-suteika', segs: ['ケース', '定価'] },
    'システム商品コード': { r: 'shisutemushouhinko-do', segs: ['システム', '商品コード'] },
    '商品カード：販売単位（1食・1箱）を選んで、その場でカートに入れる': [
      { r: 'shouhinka-do:', segs: ['商品カード', '：'] }, { r: 'hanbaitani(1shoku/1hako)', segs: ['販売単位', '（1食・1箱）'] },
      { r: 'woerande,sonobade', segs: ['を選んで、', 'その場で'] }, { r: 'ka-toniireru', segs: ['カートに', '入れる'] }],
    '価格は税込で登録（移行元の販売価格のまま）。税抜はここで計算して表示する': [
      { r: 'kakakuhazeikomidetouroku', segs: ['価格は', '税込で', '登録'] }, { r: '(ikoumotonohanbaikakakunomama).', segs: ['（移行元の', '販売価格の', 'まま）。'] },
      { r: 'zeinukihakokode', segs: ['税抜は', 'ここで'] }, { r: 'keisanshitehyoujisuru', segs: ['計算して', '表示する'] }],
    'カートに入れる': { r: 'ka-toniireru', segs: ['カートに', '入れる'] },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1100), height: y.bottom - x.top };
  };
  const termRect = (n, skip = 0) => () => {
    const ls = [...$('#vsTerm').children];
    const sel = ls.slice(Math.max(0, ls.length - n - skip), ls.length - skip);
    if (!sel.length) return null;
    const a = screenRect(sel[0]), b = screenRect(sel[sel.length - 1]);
    return { left: a.left, top: a.top, width: 980, height: b.bottom - a.top };
  };
  async function selectLine(line) {
    const l = Code.files[Code.active].lines[line];
    const ind = l.match(/^\s*/)[0].length;
    await Code.dragSelect(line, ind, l.length);
  }
  /** an "open the file" dialog of the project folder */
  const DIR = (sub) => ['PC', 'Windows (C:)', 'dev', 'nissin-shopify-migration', ...sub];
  const today = (hm) => `2026/11/02 ${hm}`;
  async function adminImport(o) {
    await clickUi(o.btn, { after: 80 });
    Admin.modal(o.body(false), { title: o.title, foot: o.foot(false) });
    await wait(500);
    await clickUi(o.add, { after: 80 });
    await FileDialog.pick({ folder: DIR(['data', 'shopify']), files: o.files, pick: o.file });
    Admin.modal(o.body(true), { title: o.title, foot: o.foot(true) });
    await wait(400);
    if (o.check) { await clickUi(o.check, { after: 60 }); $(o.check).classList.add('on'); await wait(200); }
    await clickUi('#saMd .sa-btn.pri', { after: 60 });
    await Admin.busy($('#saMd .sa-btn.pri'), o.busy || 900);
  }
  /** import progress banner on top of a page, then done */
  async function progress(text, total, ms, el = '#impBanner') {
    const b = $(el);
    const n = 10;
    for (let k = 0; k <= n; k++) {
      const v = Math.round((total * k) / n);
      b.innerHTML = `<i data-icon="reload"></i><div class="sa-progress-banner"><span>${text}（${v.toLocaleString()} / ${total.toLocaleString()}）</span>${H.prog((v / total) * 100)}</div>`;
      D.hydrateIcons(b);
      await wait(ms / n);
    }
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — makeshop: export products + members */
  scene('export', async () => {
    Caption.step(1);
    Caption.set('移行元の makeshop の管理画面（console.makeshop.jp）にログイン');
    await window.MsLoginFrame.signIn({ id: MS.ID, password: MS.PASSWORD });
    Browser.loading('ms', true);
    await wait(900);
    Browser.nav('ms', { title: MS.title('ダッシュボード'), url: MS.URL + '/dashboard', page: 'ms' });
    MS.home();
    Browser.loading('ms', false);
    await wait(500);
    Caption.set('まず商品データを CSV で書き出す：商品管理 › CSV一括処理 › 商品リストダウンロード');
    await clickUi('#msNavCsv', { after: 80 });
    Browser.nav('ms', { title: MS.title('CSV一括処理'), url: MS.URL + '/products/csv' });
    MS.csvHome();
    await wait(600);
    await clickUi('#msCsvPdl', { after: 80 });
    Browser.nav('ms', { title: MS.title('商品リストダウンロード'), url: MS.URL + '/products/csv/product-list' });
    MS.pdl();
    await wait(500);
    Caption.set('書き出す CSV の文字コードは Shift_JIS（変換するときの注意点）');
    await hoverUi('#msItems', { hold: 1400 });
    await hoverUi('.ms-panel .ms-note b', { hold: 900 });
    await clickUi('#msDlBtn', { after: 80 });
    Browser.loading('ms', true); await wait(1100); Browser.loading('ms', false);
    MS.hist('product_20261102.csv', F.ITEMS.length);
    await Browser.download('product_20261102.csv', `${Math.round(F.PRODUCT_CSV.length * 1.45 / 1024)} KB`);
    Caption.set('会員データも書き出す（パスワードは暗号化されているため出力されない）');
    await clickUi('#msNavMdl', { after: 80 });
    Browser.nav('ms', { title: MS.title('会員一覧'), url: MS.URL + '/members' });
    MS.mdl();
    await wait(600);
    await hoverUi('.ms-panel .ms-note', { ax: 0.7, hold: 1800 });
    await clickUi('#msDlBtn', { after: 80 });
    Browser.loading('ms', true); await wait(1400); Browser.loading('ms', false);
    await Browser.download('member_20261102.csv', '4.1 MB');
    Caption.set('書き出した CSV はプロジェクトの data/makeshop/ に置き、Shopify の形式に変換する');
    await wait(1200);
  });

  /* 2 — the CSV: encoding, then the converter */
  scene('convert', async () => {
    Caption.step(2);
    await Win.switchTo('code', { state: 'max' });
    Code.addFile('data/makeshop/product_20261102.csv', P['data/makeshop/product_20261102.csv']);
    Code.addFile('data/makeshop/member_20261102.csv', P['data/makeshop/member_20261102.csv']);
    await Code.openFile('data/makeshop/product_20261102.csv', { top: 0 });
    await wait(700);
    Caption.issue('文字化け', 'makeshop の CSV は Shift_JIS：VS Code が UTF-8 として開いたので日本語が読めない');
    Issue.show(linesRect(0, 4), '文字化け');
    await wait(2600);
    Issue.hide();
    Caption.set('ステータスバーの文字コード →「エンコード付きで再度開く」→ Shift JIS');
    await clickUi('#vsEnc', { after: 80 });
    await Code.quickPick([['エンコード付きで再度開く', ''], ['エンコード付きで保存', '']], 'エンコード付きで再度開く', { placeholder: 'アクションの選択' });
    await Code.quickPick([['UTF-8', 'utf8'], ['Japanese (Shift JIS)', 'shiftjis'], ['Japanese (EUC-JP)', 'eucjp'], ['UTF-16 LE', 'utf16le'], ['Western (Windows 1252)', 'windows1252']], 'Japanese (Shift JIS)', { placeholder: 'ファイルのエンコードの選択', look: 800 });
    Code.files['data/makeshop/product_20261102.csv'].enc = 'Shift JIS';
    Code.files['data/makeshop/member_20261102.csv'].enc = 'Shift JIS';
    Code.setText('data/makeshop/product_20261102.csv', F.PRODUCT_CSV);
    $('#vsEnc').textContent = 'Shift JIS';
    await wait(700);
    Caption.set('makeshop は 1 商品 = 1 行：単品の価格・品番と、ケース入数・ケース販売価格が同じ行に並ぶ');
    await hoverUi(Code.lineEl(0), { ax: 0.3, hold: 1300 });
    await Code.scrollX(760, 1300);
    await wait(1500);
    await Code.scrollX(0, 900);
    await hoverUi(Code.lineEl(1), { ax: 0.35, hold: 900 });

    // the converter
    Caption.set('変換スクリプト：Shopify の CSV は「バリエーションごとに 1 行」。単品とケースを 1 つの商品の 2 行にする');
    await Code.openFile('scripts/convert-products.mjs', { top: 0 });
    await wait(400);
    await hoverUi(Code.lineEl(7), { ax: 0.4, hold: 1300 });
    await hoverUi(Code.lineEl(11), { ax: 0.45, hold: 1500 });
    const todo = Code.find('// TODO').line;
    await Code.reveal(todo + 3, 700);
    await selectLine(todo);
    await Code.type(code(F.CONVERT_LOOP), { kps: 22 });
    await wait(300);
    await Code.save();
    const loopText = Code.text();

    Caption.set('実行して、Shopify 用の CSV を書き出す');
    await Keycap.show(['Ctrl', '@'], 600);
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await wait(300);
    await Term.run('node scripts/convert-products.mjs', [400, `${F.ITEMS.length} 商品 → ${F.ITEMS.length} 行（data/shopify/products_shopify.csv）`]);
    Code.addFile('data/shopify/products_shopify.csv', F.PRODUCTS_SHOPIFY_BAD);
    await wait(500);
    await Code.openFile('data/shopify/products_shopify.csv', { top: 0 });
    await wait(500);
    Caption.issue('変換ミス', 'Handle・Title・価格が空で「undefined」だらけ。ケースの行もできていない（商品数と行数が同じ）');
    Issue.show(linesRect(1, 5), '値が入っていない');
    await wait(3000);
    Issue.hide();
    Caption.set('原因：Shift_JIS のファイルを UTF-8 で読んでいた → 列名が化けて r[\'商品名\'] などが一致しない');
    await Code.openFile('scripts/convert-products.mjs');
    const rd = Code.find("fs.readFileSync(SRC, 'utf8')");
    await Code.reveal(rd.line, 600);
    Issue.show(linesRect(rd.line, rd.line), 'UTF-8 として読んでいる', { below: true });
    await wait(1600);
    Issue.hide();
    await Code.overwrite("fs.readFileSync(SRC, 'utf8')", "iconv.decode(fs.readFileSync(SRC), 'Shift_JIS')", { kps: 18 });
    await Code.save();
    Code.lineCls[rd.line] = 'good'; Code.render();
    if (Code.text() !== F.CONVERT_FINAL) { console.warn('[demo] convert-products.mjs differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat('convert'); }
    void loopText;
    await Term.run('node scripts/convert-products.mjs', [400, `${F.ITEMS.length} 商品 → ${F.OUT_OK.length} 行（data/shopify/products_shopify.csv）`]);
    delete Code.lineCls[rd.line];
    Code.setText('data/shopify/products_shopify.csv', F.PRODUCTS_SHOPIFY);
    await Code.openFile('data/shopify/products_shopify.csv', { top: 0 });
    Caption.fixed(`Shift_JIS で読むように直して再実行：${F.ITEMS.length} 商品 → ${F.OUT_OK.length} 行（ケースは同じハンドルの 2 行目）`);
    Issue.ok(linesRect(1, 4), '単品とケースのバリエーション');
    await readHold(2600);
    Issue.hide();
    await Code.scrollX(900, 1200);
    await wait(1000);
    await Code.scrollX(0, 700);
    await Code.panel(false);
  });

  /* 3 — import into Shopify */
  scene('import', async () => {
    Caption.step(3);
    Caption.set('Shopify の管理画面：商品管理 →「インポート」');
    await Win.switchTo('browser');
    await Browser.clickTab('adm');
    await Admin.go('products', V.productsEmpty(), { title: '商品', path: '/products' });
    await adminImport({
      btn: '#prImport', add: '#impAdd', title: 'CSV で商品をインポート', check: '#impOverwrite',
      body: (f) => V.importModal(f ? 'file' : 'pick', { name: 'products_shopify.csv', size: `${Math.round(F.PRODUCTS_SHOPIFY.length * 1.6 / 1024)} KB` }),
      foot: (f) => V.importFoot(f ? 'file' : 'pick'),
      file: 'products_shopify.csv',
      files: [{ name: '.gitkeep', date: today('09:58'), type: 'GITKEEP ファイル', size: '0 KB' }, { name: 'products_shopify.csv', date: today('10:31'), type: 'Microsoft Excel CSV ファイル', size: `${Math.round(F.PRODUCTS_SHOPIFY.length * 1.6 / 1024)} KB` }],
    });
    Admin.modal(V.importModal('preview'), { title: '商品のインポートをプレビュー', foot: V.importFoot('preview'), lg: true });
    Caption.set('1 件目のプレビュー：販売単位のバリエーション（1食 / 1箱）、タグ、価格を確認');
    await wait(500);
    await hoverUi('.sa-imp-prev h3', { hold: 1200 });
    await hoverUi('.sa-imp-prev .sa-kv dd:nth-of-type(3)', { ax: 0.3, hold: 1800 });
    await clickUi('#impGo', { after: 60 });
    await Admin.busy('#impGo', 700);
    Admin.closeModal();
    Admin.show(V.productsList({ banner: '<div class="sa-banner info" id="impBanner"></div>' }), { title: '商品', path: '/products' });
    $('#prTable').style.opacity = '0';
    await progress('商品をインポートしています', F.ITEMS.length, 4200);
    $('#impBanner').outerHTML = H.banner('ok', `${F.ITEMS.length} 件の商品をインポートしました`, `<p>${F.OUT_OK.length} 件のバリエーションを作成しました。</p>`, { id: 'impBanner' });
    K.hydrate($('#saMain'));
    $('#prTable').style.opacity = '';
    $('#prTable').classList.add('sa-flash');
    Admin.toast('インポートが完了しました');
    Caption.set(`${F.ITEMS.length} 商品を取り込んだ：商品名・販売元・カテゴリーも makeshop のデータのまま`);
    await wait(800);
    await hoverUi($('#prTable tbody tr:nth-child(2) .sa-pn span'), { hold: 900 });
    await hoverUi($('#prTable tbody tr:nth-child(5) td:nth-child(4)'), { hold: 900 });
    // one product
    await Admin.open($(`#prTable tr[data-row="${IT.code}"] .sa-pn span`), V.product(IT), { title: IT.name, path: '/products/15397110513716' });
    Caption.set(`商品ページ：販売単位「1${IT.unit}」${yen(IT.price)} と「1箱(${IT.caseN}${IT.unit}入)」${yen(IT.casePrice)} が 1 つの商品のバリエーションに`);
    await Admin.scrollToEl('#pdVarCard', 90, 900);
    Issue.ok($('#pdVarCard'), '単品とケースが 1 商品に');
    await readHold(2600);
    Issue.hide();
    Caption.set('タグ（カテゴリー_・サブカテゴリー_・配送方法_）は、コレクションの条件と絞り込みに使う');
    await Admin.scroll(0, 600);
    await hoverUi('#pdOrg .sa-tag:nth-child(1)', { hold: 1100 });
    await hoverUi('#pdOrg .sa-tag:nth-child(3)', { hold: 1100 });
  });

  /* 4 — customers */
  scene('customers', async () => {
    Caption.step(4);
    Caption.set('会員データ：退会者・メールアドレスなしを除き、会員ランクはタグにして顧客 CSV に変換');
    await Win.switchTo('code');
    await Code.openFile('scripts/convert-customers.mjs', { top: 0 });
    await wait(500);
    await hoverUi(Code.lineEl(11), { ax: 0.4, hold: 1300 });
    await hoverUi(Code.lineEl(19), { ax: 0.45, hold: 1500 });
    await Code.panel(true);
    await Term.run('node scripts/convert-customers.mjs', [600, '18,642 件 → 17,915 件（退会・メールアドレスなしを除外）']);
    Code.addFile('data/shopify/customers_shopify.csv', 'First Name,Last Name,Email,Accepts Email Marketing,Phone,Accepts SMS Marketing,Default Address Zip,Default Address Province Code,Default Address City,Default Address Address1,Tags,Note');
    await wait(700);
    await Code.panel(false);
    await Win.switchTo('browser');
    await Admin.go('customers', V.customersEmpty(), { title: '顧客', path: '/customers' });
    await adminImport({
      btn: '#cuImport', add: '#cuAdd', title: 'CSV で顧客をインポート',
      body: (f) => V.customersImportModal(f), foot: (f) => `${H.btn('キャンセル')}${H.btn('顧客をインポート', { pri: true, off: !f })}`,
      file: 'customers_shopify.csv',
      files: [{ name: 'customers_shopify.csv', date: today('10:52'), type: 'Microsoft Excel CSV ファイル', size: '2,148 KB' }, { name: 'products_shopify.csv', date: today('10:31'), type: 'Microsoft Excel CSV ファイル', size: `${Math.round(F.PRODUCTS_SHOPIFY.length * 1.6 / 1024)} KB` }],
      busy: 1100,
    });
    Admin.closeModal();
    Admin.show(H.page({ title: '顧客' }, '<div class="sa-banner info" id="impBanner"></div>'), { title: '顧客', path: '/customers' });
    await progress('顧客をインポートしています', 17915, 3200);
    Admin.show(V.customers(17915), { title: '顧客', path: '/customers' });
    Admin.toast('17,915 人の顧客をインポートしました');
    Caption.set('会員ランクと makeshop の会員 ID は、タグとメモに残す');
    await hoverUi($('.sa-tbl tbody tr:nth-child(1) td:last-child .sa-tag:nth-child(2)'), { hold: 1500 });

    // customer accounts
    Caption.set('makeshop のパスワードは移せない →「新しい顧客アカウント」（メールの確認コードでログイン）にする');
    await Admin.openSettings('accounts', V.accounts('classic'), { title: '顧客アカウント', path: 'customer_accounts' });
    await hoverUi('.sa-choice[data-acc="classic"] p', { hold: 1300 });
    await clickUi('.sa-choice[data-acc="new"]', { after: 80 });
    $$('.sa-choice').forEach((c) => c.classList.toggle('on', c.dataset.acc === 'new'));
    Admin.saveBar(true);
    await wait(500);
    await Admin.saveFromBar('顧客アカウントの設定を保存しました');
    Caption.set('移行した会員は、登録済みのメールアドレスだけで（再登録なしで）ログインできる');
    Issue.ok($('.sa-choice[data-acc="new"]'), '新しい顧客アカウント');
    await readHold(2200);
    Issue.hide();
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    await wait(200);
  });

  /* 5 — URL redirects */
  scene('redirects', async () => {
    Caption.step(5);
    Caption.set('旧 makeshop の URL（検索結果・ブックマーク・広告）を、新しい URL に 301 で転送する');
    await Win.switchTo('code');
    await Code.openFile('scripts/build-redirects.mjs', { top: 0 });
    await wait(300);
    const todo = Code.find('// TODO').line;
    await selectLine(todo);
    await Code.type(code(F.REDIRECT_LOOP), { kps: 22 });
    await Code.save();
    await Code.panel(true);
    const nCat = Object.keys(F.CATS).length;
    await Term.run('node scripts/build-redirects.mjs', [300, `商品 ${F.ITEMS.length} 件・カテゴリー ${nCat} 件 → ${F.ITEMS.length + nCat} 件`]);
    Code.addFile('data/shopify/redirects.csv', ['Redirect from,Redirect to', ...F.REDIRECTS().map((r) => r.join(','))].join('\n'));
    await Code.openFile('data/shopify/redirects.csv', { top: 0 });
    await wait(1400);
    await Win.switchTo('browser');
    // menus and URL redirects are under コンテンツ > メニュー (help.shopify.com/ja: online-store/menus-and-links)
    await Admin.go('content/menus', V.navigation().replace('<h1>ナビゲーション</h1>', '<h1>メニュー</h1>'), { title: 'メニュー', path: '/content/menus' });
    await Admin.open('#navRedir', V.redirects([]), { title: 'URL リダイレクト', path: '/content/redirects' });
    await adminImport({
      btn: '#rdImport', add: '#rdAdd', title: 'URL リダイレクトをインポート',
      body: (f) => V.redirectsImportModal(f), foot: (f) => `${H.btn('キャンセル')}${H.btn('リダイレクトをインポート', { pri: true, off: !f })}`,
      file: 'redirects.csv',
      files: [{ name: 'customers_shopify.csv', date: today('10:52'), type: 'Microsoft Excel CSV ファイル', size: '2,148 KB' }, { name: 'products_shopify.csv', date: today('10:31'), type: 'Microsoft Excel CSV ファイル', size: '61 KB' }, { name: 'redirects.csv', date: today('11:04'), type: 'Microsoft Excel CSV ファイル', size: '9 KB' }],
    });
    Admin.closeModal();
    Admin.show(V.redirects(F.REDIRECTS()), { title: 'URL リダイレクト', path: '/content/redirects' });
    $('#rdTable').classList.add('sa-flash');
    Admin.toast(`${F.ITEMS.length + nCat} 件の URL リダイレクトをインポートしました`);
    await wait(900);
    await hoverUi('#rdTable tbody tr:nth-child(1) td:nth-child(2)', { hold: 1100 });

    // check with the top pages from Search Console
    Caption.set('Search Console の上位ページ（旧 URL）に実際にアクセスして、転送を確認');
    await Win.switchTo('code');
    await Code.openFile('scripts/check-redirects.mjs', { top: 0 });
    const check = async (viewItem) => {
      const ok = F.REDIRECTS({ viewItem });
      const map = Object.fromEntries(ok);
      const out = F.TOP_PAGES.slice(1).map((u) => map[u] ? `<span class="tg">✔</span> 301 ${esc(u)} <span class="tdim">→ ${esc(map[u])}</span>` : `<span class="tr">✖ 404 ${esc(u)}</span>`);
      const ng = F.TOP_PAGES.slice(1).filter((u) => !map[u]).length;
      await Term.run('node scripts/check-redirects.mjs', [300, ...out, ng ? `<span class="tr">${ng} 件が転送されていません</span>` : `<span class="tg">すべて転送されました（${F.TOP_PAGES.length - 1} 件）</span>`], { gap: 150 });
      return ng;
    };
    await check(false);
    Caption.issue('転送漏れ', '/view/item/… が 404：makeshop のクリエイターモードで使われていた、もう 1 つの商品 URL の形式');
    Issue.show(termRect(F.TOP_PAGES.length, 1), '404 が 2 件');
    await wait(3000);
    Issue.hide();
    await Code.openFile('scripts/build-redirects.mjs');
    const ln = Code.find('/shopdetail/${').line;
    await Code.clickAt(ln, 6);
    await Keycap.show(['Shift', 'Alt', '↓'], 700);
    Code.insertLines(ln + 1, [Code.files[Code.active].lines[ln]]);
    await wait(400);
    await Code.overwrite('/shopdetail/', '/view/item/', { from: ln + 1, kps: 16 });
    const t = Code.find("']}/`", ln + 1);
    await Code.dragSelect(t.line, t.col + 3, t.col + 4);
    await Code.type([{ key: 'Backspace' }]);
    await Code.save();
    Code.lineCls[ln + 1] = 'good'; Code.render();
    await Term.run('node scripts/build-redirects.mjs', [300, `商品 ${F.ITEMS.length} 件・カテゴリー ${nCat} 件 → ${F.ITEMS.length * 2 + nCat} 件`]);
    Code.setText('data/shopify/redirects.csv', ['Redirect from,Redirect to', ...F.REDIRECTS({ viewItem: true }).map((r) => r.join(','))].join('\n'));
    delete Code.lineCls[ln + 1];
    // re-import (overwrite)
    await Win.switchTo('browser');
    await adminImport({
      btn: '#rdImport', add: '#rdAdd', title: 'URL リダイレクトをインポート', check: '#rdOverwrite',
      body: (f) => V.redirectsImportModal(f, { size: '17 KB' }), foot: (f) => `${H.btn('キャンセル')}${H.btn('リダイレクトをインポート', { pri: true, off: !f })}`,
      file: 'redirects.csv',
      files: [{ name: 'customers_shopify.csv', date: today('10:52'), type: 'Microsoft Excel CSV ファイル', size: '2,148 KB' }, { name: 'products_shopify.csv', date: today('10:31'), type: 'Microsoft Excel CSV ファイル', size: '61 KB' }, { name: 'redirects.csv', date: today('11:09'), type: 'Microsoft Excel CSV ファイル', size: '17 KB' }],
      busy: 700,
    });
    Admin.closeModal();
    Admin.show(V.redirects(F.REDIRECTS({ viewItem: true })), { title: 'URL リダイレクト', path: '/content/redirects' });
    Admin.toast(`${F.ITEMS.length * 2 + nCat} 件の URL リダイレクトをインポートしました`);
    await wait(700);
    await Win.switchTo('code');
    await check(true);
    Caption.fixed('/view/item/… の行を追加して再インポート：上位ページの旧 URL がすべて 301 で転送された');
    Issue.ok(termRect(F.TOP_PAGES.length, 1), 'すべて 301');
    await readHold(2600);
    Issue.hide();
  });

  /* 6 — theme: product card with 販売単位 + tax display */
  scene('theme', async () => {
    Caption.step(6);
    Caption.set('テーマ：Prestige をベースに、makeshop 時代と同じ「販売単位を選んでカートに入れる」商品カードを作る');
    await Code.expand('theme');
    await Code.expand('theme/snippets');
    await Term.run('shopify theme dev --store store-nissin --path theme', [
      async () => Term.spin('Syncing theme #187753955380 on store-nissin.myshopify.com', 1800, '<span class="tg">✓</span> Synced theme <span class="tdim">(#187753955380)</span>'),
      '', '<span class="tb">Preview your theme</span>', `  • <span class="tlink">${DEV}</span>`, '', '<span class="tdim">(Use Ctrl+C to stop)</span>',
    ], { noPrompt: true });
    await Win.switchTo('browser');
    Browser.addTab({ id: 'dev', title: S.title, url: DEV + '/', page: 'store', fav: 'store' }, { anim: true });
    Browser.loading('dev', true);
    await Store.load('home', { states: ['noForm'] });
    Browser.loading('dev', false);
    await wait(600);
    const card = () => Store.doc.querySelector('.ProductItem');
    await Store.scrollToEl(card(), 380, 1600);
    Caption.set('いまの商品カードは商品名だけ：価格・販売単位・カートボタンがない');
    Issue.show(Store.doc.querySelector('.ProductItem__Info') || card(), '価格もカートもない');
    await wait(2400);
    Issue.hide();

    await Win.switchTo('code');
    await Code.openFile('theme/snippets/product-item.liquid', { top: 0 });
    await Code.lineAfter('<div class="ProductItem__Bottom">', [{ direct: "{%- render 'product-item-form', product: product -%}" }], { kps: 22 });
    await Code.save();
    Caption.set('新しいスニペット product-item-form.liquid：販売単位のセレクトと数量、カートボタン、税抜・税込の価格');
    await Code.newFile('theme/snippets/product-item-form.liquid');
    await Code.type(code(F.FORM_HEAD), { kps: 20 });
    await Code.type([{ key: 'Enter' }]);
    await Code.paste(F.FORM_BODY('', '').join('\n'));
    const ex = Code.find('<span class="Price"></span>');
    await Code.clickAt(ex.line, ex.col + '<span class="Price">'.length);
    await Code.type(F.EX_BAD, { kps: 20 });
    const inc = Code.find('<span class="Price"></span>', ex.line + 1);
    await Code.clickAt(inc.line, inc.col + '<span class="Price">'.length);
    await Code.type(F.INC_BAD, { kps: 20 });
    const btn = Code.find('>カートに入れる<');
    void btn;
    await Code.save();
    Term.lines.push('<span class="tdim">11:21:42</span> <span class="tg">Synced</span> » update snippets/product-item.liquid');
    Term.lines.push('<span class="tdim">11:22:57</span> <span class="tg">Synced</span> » update snippets/product-item-form.liquid');
    Term.render(null);
    await wait(500);

    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('home', { states: ['taxWrong'] }); });
    await Store.scrollToEl(card(), 380, 0);
    await wait(500);
    const f0 = () => Store.doc.querySelector('.ProductItem__PriceList');
    Caption.issue('価格の誤り', '税込 ¥267 の商品が「¥267（税込¥288）」に：移行した価格はすでに税込なのに、さらに 1.08 倍していた');
    Issue.show(f0(), '税が二重にかかっている');
    await moveToEl(f0(), { ax: 0.6 });
    await wait(3200);
    Issue.hide();

    await Win.switchTo('code');
    const l1 = Code.find(F.EX_BAD).line;
    await Code.reveal(l1, 500);
    await Code.overwrite(F.EX_BAD, F.EX_OK, { kps: 18 });
    await Code.overwrite(F.INC_BAD, F.INC_OK, { from: l1 + 1, kps: 20 });
    await Code.save();
    if (Code.text() !== F.FORM_FINAL) { console.warn('[demo] product-item-form.liquid differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat('form'); }
    Code.lineCls[l1] = 'good'; Code.lineCls[l1 + 1] = 'good'; Code.render();
    Term.lines.push('<span class="tdim">11:24:16</span> <span class="tg">Synced</span> » update snippets/product-item-form.liquid');
    Term.render(null);
    await wait(500);
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('home'); });
    await Store.scrollToEl(card(), 380, 0);
    Caption.fixed('税込価格から税抜を計算（÷1.08 を切り上げ）：「¥248（税込¥267）」と表示');
    Issue.ok(f0(), '税抜 ¥248 / 税込 ¥267');
    await readHold(2600);
    Issue.hide();
    await hoverUi(Store.doc.querySelector('.ProductItem__FormVariant'), { hold: 900 });
    await hoverUi(Store.doc.querySelector('.ProductItem__FormSubmit'), { kind: 'hand', hold: 900 });
    Cursor.kind('arrow');
    // smartphone
    Caption.set('スマートフォン幅でも確認');
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Store.loadSp('home');
    await Store.scrollToEl(Store.spDoc.querySelector('.ProductItem'), 160, 1500, true);
    await wait(1800);
    Store.device(false);
    await Store.scroll(0, 0);
    // push to the live theme
    await Win.switchTo('code');
    delete Code.lineCls[l1]; delete Code.lineCls[l1 + 1]; Code.render();
    await Keycap.show(['Ctrl', 'C'], 600);
    Term.lines.push('');
    await Term.run('shopify theme push --live --allow-live --path theme', [
      async () => Term.progress('Uploading files ', 214, 1600, { done: '<span class="tg">✓</span> Uploaded 214 files' }),
      '<span class="tg">✓</span> Your theme was pushed to <span class="tb">store-nissin</span>',
      `  • Theme: Prestige — nissin <span class="tdim">(#187753955380, live)</span>`,
    ]);
    await wait(900);
    await Code.panel(false);
  });

  /* 7 — domain + opening the store */
  scene('launch', async () => {
    Caption.step(7);
    Caption.set('ドメイン：store.nissin.com を Shopify に接続する');
    await Win.switchTo('browser');
    await Browser.clickTab('adm');
    await Admin.openSettings('domains', V.domains(null), { title: 'ドメイン', path: 'domains' });
    await clickUi('#dmConnect', { after: 80 });
    Admin.modal(`<p class="sa-mute">接続するドメインを入力してください。</p>${H.field('ドメイン', '', { id: 'dmInput', ph: 'example.com' })}`, { title: '既存のドメインを接続', foot: H.btn('キャンセル') + H.btn('次へ', { pri: true, id: 'dmNext' }) });
    await wait(300);
    await typeInput('#dmInput', 'store.nissin.com', { kps: 13 });
    await clickUi('#dmNext', { after: 60 });
    await Admin.busy('#dmNext', 700);
    Admin.closeModal();
    Admin.settings('domains', V.domains('pending'), { title: 'ドメイン', path: 'domains' });
    Caption.set('DNS（ドメインの管理元）で CNAME を shops.myshopify.com に変更してから「接続を確認」');
    await Admin.scrollToEl('#dmCard', 40, 700, '#saSetScroll');
    await hoverUi('#dmDetail .sa-tbl tbody tr', { hold: 1800 });
    await clickUi('#dmVerify', { after: 60 });
    await Admin.busy('#dmVerify', 1500);
    Admin.settings('domains', V.domains('connected'), { title: 'ドメイン', path: 'domains' });
    await Admin.scrollToEl('#dmCard', 40, 0, '#saSetScroll');
    Admin.toast('store.nissin.com を接続しました');
    Caption.set('接続済み・SSL 証明書も自動で発行された → プライマリドメインに設定');
    await hoverUi('#dmDetail .sa-kv dd', { hold: 1200 });
    await clickUi('#dmPrimary', { after: 60 });
    await Admin.busy('#dmPrimary', 800);
    Admin.settings('domains', V.domains('primary'), { title: 'ドメイン', path: 'domains' });
    Admin.toast('プライマリドメインを変更しました');
    await wait(900);
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    Caption.set('最後にパスワード保護を外して、ストアを公開');
    await Admin.go('online/preferences', V.preferences(true), { title: '環境設定', path: '/online_store/preferences' });
    await Admin.scrollToEl('#pwCard', 70, 700);
    await clickUi('#pwCheck', { after: 80 });
    $('#pwCheck').classList.remove('on');
    $('#pwFields').classList.add('sa-dim');
    Admin.saveBar(true);
    await wait(500);
    await Admin.saveFromBar('ストアを公開しました');
    await wait(600);
  });

  /* 8 — the live store */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開したストアで、旧 makeshop の商品 URL を開いてみる');
    await Browser.newTab('live');
    await Browser.typeUrl(`store.nissin.com/shopdetail/${IT.sys}/`);
    Browser.nav('live', { url: `${LIVE}/shopdetail/${IT.sys}/`, title: 'store.nissin.com' });
    Browser.loading('live', true);
    await wait(500);
    Browser.nav('live', { url: `${LIVE}/products/${IT.code}`, title: `${IT.name}｜${S.title}`, page: 'store', fav: 'store' });
    await Store.load('product');
    Browser.loading('live', false);
    await wait(500);
    Caption.fixed(`301 で新しい商品ページ（/products/${IT.code}）に転送された`);
    Issue.ok($('#brOmni'), `/products/${IT.code} に転送`, { below: true });
    await readHold(2400);
    Issue.hide();
    await Store.scroll(320, 1600);
    await wait(900);
    // the product's own 「カートに入れる」 (a list of selectors matches in page order: the header's icon buttons come first)
    await hoverUi(Store.doc.querySelector('.ProductForm__AddToCart') || Store.doc.querySelector('[class*="AddToCart"]') || Store.doc.body, { kind: 'hand', hold: 900 });
    Cursor.kind('arrow');
    // the top page
    Caption.set('トップページ');
    const logo = Store.doc.querySelector('.Header__LogoLink, .Header__Logo a, header a[href="/"]');
    if (logo) await clickUi(logo, { kind: 'hand', after: 60 });
    Cursor.kind('arrow');
    Browser.nav('live', { url: LIVE + '/', title: S.title });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    await wait(1400);
    const d = Store.doc;
    const y = (el, off = 120) => (el ? Store.yOf(el, off) : 0);
    await Store.scroll(y(d.querySelector('.ProductItem'), 420), 2000);
    await wait(1200);
    const rank = [...d.querySelectorAll('h2, .SectionHeader__Heading')].find((h) => /ランキング/.test(h.textContent));
    await Store.scroll(y(rank, 140), 2000);
    await wait(1400);
    await Store.scroll(Store.yOf(d.body, 0) + d.documentElement.scrollHeight * 0.55, 2200);
    await wait(1200);
    await Store.scroll(0, 2400);
    Caption.set('makeshop から Shopify への移行が完了');
    await wait(3800);
    Caption.hide();
  });

  /* ============================================================ storefront states */
  const ST = window.StoreFrame.STATES;
  ST.noForm = { on(doc) { doc.querySelectorAll('.ProductItem__Form').forEach((e) => e.setAttribute('data-demo-hidden', '')); }, off(doc) { doc.querySelectorAll('.ProductItem__Form').forEach((e) => e.removeAttribute('data-demo-hidden')); } };
  ST.taxWrong = {
    on(doc) {
      doc.querySelectorAll('.ProductItem__PriceList').forEach((pl) => {
        const ex = pl.querySelector('.ProductItem__PriceWithoutTax .Price'), inc = pl.querySelector('.ProductItem__PriceTaxIn .Price');
        if (!ex || !inc) return;
        const v = parseInt(inc.textContent.replace(/[^\d]/g, ''), 10);
        if (!v) return;
        ex.dataset.demo = ex.textContent; inc.dataset.demo = inc.textContent;
        ex.textContent = '¥' + v.toLocaleString(); inc.textContent = '¥' + Math.floor(v * 1.08).toLocaleString();
      });
    },
    off(doc) { doc.querySelectorAll('[data-demo]').forEach((e) => { e.textContent = e.dataset.demo; delete e.dataset.demo; }); },
  };

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'product'],
    fontText: JSON.stringify(JA),
    async prepare() {
      const tree = [
        ['data', 'dir', 1], ['data/makeshop', 'dir', 1], ['data/makeshop/top_pages.txt'], ['data/shopify', 'dir', 1], ['data/shopify/.gitkeep'], ['data/category-map.json'],
        ['scripts', 'dir', 1], ['scripts/lib', 'dir', 0], ['scripts/lib/csv.mjs'], ['scripts/lib/jp.mjs'],
        ['scripts/build-redirects.mjs'], ['scripts/check-redirects.mjs'], ['scripts/convert-customers.mjs'], ['scripts/convert-products.mjs'],
        ['theme', 'dir', 0], ['theme/config', 'dir', 0], ['theme/config/settings_data.json'], ['theme/layout', 'dir', 0], ['theme/layout/theme.liquid'],
        ['theme/sections', 'dir', 0], ['theme/sections/featured-collection.liquid'], ['theme/snippets', 'dir', 0], ['theme/snippets/product-item.liquid'], ['theme/shopify.theme.toml'],
        ['.gitignore'], ['package.json'], ['README.md'],
      ];
      const files = Object.fromEntries(Object.entries(P).filter(([p]) => !/^data\/makeshop\/(product|member)_/.test(p)));
      Code.init(files, tree);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      // browser: the Shopify admin (setup guide) and the makeshop admin (active)
      Browser.addTab({ id: 'adm', title: Admin.title('ホーム'), url: Admin.url(''), page: 'admin', fav: 'admin' });
      Admin.show(V.home(), { nav: 'home' });
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
