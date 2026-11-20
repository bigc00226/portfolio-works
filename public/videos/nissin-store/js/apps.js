/*
 * The screens of this video on top of the shared Shopify kit (shared/kit/kit.js):
 *   MS     — the makeshop byGMO shop admin (migration source): the real login page (js/makeshop-login.js, shown by
 *            js/makeshop-login-frame.js), then the admin — a reconstruction (it needs an account) with the admin's own logo,
 *            icons, menu labels, routes and colours from its public JavaScript (js/makeshop-ui.js): home, CSV一括処理 ›
 *            商品リストダウンロード, 会員アップロード・ダウンロード
 *   Views  — the Shopify admin pages of the migration: product import, products, a product, customers + import,
 *            customer accounts setting, URL redirects + import, domains, online store preferences (password)
 * The page contents come from js/files.js (the store's own catalogue, converted).
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, icon, wait, clickUi } = D;
  const { H } = K;
  const img = Object.fromEntries((S.products || []).map((p) => [p.handle, p.image]));
  const yen = (v) => '¥' + Number(v).toLocaleString('ja-JP');

  /* ===================================================================== makeshop admin */
  // the admin's frame (js/makeshop-login-frame.js: MsUi.shell) — the left menu as this account shows it
  // (会員情報CSV is opened from 会員一覧 › CSV一括処理, as in the admin)
  const MS_FRAME = {
    shopName: '日清食品グループ オンラインストア', shopId: 'nissinstore', avatar: 'blue-lighten-3', homeId: 'msNavHome',
    groups: {
      order: [['', '注文一覧']],
      product: [['', '商品一覧'], ['', 'カテゴリ設定'], ['msNavCsv', 'CSV一括処理']],
      member: [['msNavMdl', '会員一覧'], ['', '会員グループ一覧']],
    },
  };
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mslogin"><iframe id="msLoginFrame" title="管理画面ログイン - makeshop byGMO"></iframe></div>
    <div class="br-page" data-page="ms"><div class="ms-adm">${window.MsUi.shell(MS_FRAME)}</div></div>`);

  const MS = {
    URL: 'https://console.makeshop.jp',
    ID: 'nissinstore',          // the login ID (shown blurred)
    PASSWORD: 'Nissin-mig2026',  // shown as ••• by the page
    /** "<page> - makeshop byGMO" (the admin's own title format) */
    title: (t) => window.MsUi.title(t),
    crumb(c) { $('#msCrumb').innerHTML = window.MsUi.crumbs(c); },
    nav(id) {
      $$('.ms-adm .ms-subitem').forEach((e) => e.classList.toggle('on', e.id === id));
      $('#msNavHome').classList.toggle('on', id === 'msNavHome');
    },
    /** /dashboard — where the login lands (no breadcrumbs; its blocks as the manual names them: 注文サマリー, 会員数, ランキング) */
    home() {
      this.nav('msNavHome');
      this.crumb([]);
      $('#msMain').innerHTML = `
        <h1 class="ms-h1">ダッシュボード</h1>
        <div class="ms-home">
          <div class="ms-card"><h3>注文サマリー</h3><p class="ms-mute">今日・前日・今月・先月の売上総額と注文件数</p><div class="ms-ph"></div></div>
          <div class="ms-card"><h3>会員数：男女比</h3><p class="ms-mute">会員登録数（退会済み会員は含めません）</p><div class="ms-ph"></div></div>
          <div class="ms-card"><h3>ランキング：売上金額</h3><p class="ms-mute">今日・昨日・今月・先月</p><div class="ms-ph"></div></div>
        </div>`;
    },
    /**
     * /products/csv — CSV一括処理 as the admin lays it out (ProductCsvHomePage; manual.makeshop.jp/hc/ja/articles/53559390589721):
     * CSV処理ジョブ管理, then a card per CSV (アップロード / ダウンロード / フォーマット管理), then 旧CSV一括処理 (the older screens)
     */
    csvHome() {
      this.nav('msNavCsv');
      this.crumb(['ホーム', '商品管理', '商品一覧', 'CSV一括処理']);
      const acts = (fmt) => `<span class="ms-csv-acts"><span><i data-ms-icon="upload"></i>アップロード</span><span><i data-ms-icon="download"></i>ダウンロード</span>${fmt ? '<span>フォーマット管理</span>' : ''}</span>`;
      const card = (t, d, fmt) => `<div class="ms-csv-card"><div class="t">${esc(t)}</div><p>${esc(d)}</p>${acts(fmt)}</div>`;
      const old = (t, id) => `<span class="ms-csv-old"${id ? ` id="${id}"` : ''}>${esc(t)}</span>`;
      $('#msMain').innerHTML = `
        <h1 class="ms-h1">CSV一括処理</h1>
        <div class="ms-panel ms-csv-job"><div class="t">CSV処理ジョブ管理</div><p>商品情報一括アップロードの結果を確認できます。</p><div class="lk"><span>アップロード一覧</span><span>ダウンロード一覧</span></div></div>
        <div class="ms-csv-grid">
          ${card('商品情報一括アップロード', 'すべての商品情報を一括で管理（登録・編集・削除・出力）できます。出力する項目はフォーマット管理で登録したフォーマットで指定できます。', true)}
          ${card('バリエーション一括登録・修正', 'CSV形式のファイルをダウンロード・アップロードして、バリエーションを一括で登録・更新できます。出力する項目はフォーマット管理で登録したフォーマットで指定できます。', true)}
          ${card('商品の並び順一括登録・修正', 'CSV形式のファイルをアップロードすると、商品の表示優先度を一括登録・変更することができます。')}
          ${card('商品のカテゴリ一括登録・解除', 'CSV形式のファイルをアップロードすると、商品の属するカテゴリを一括で登録・解除することができます。')}
        </div>
        <div class="ms-panel ms-csv-job"><div class="t">旧CSV一括処理</div><div class="lk">${old('商品一括登録')}${old('商品一括修正')}${old('商品リストダウンロード', 'msCsvPdl')}${old('オプショングループ一括登録')}</div></div>`;
      window.MsUi.hydrate($('#msMain'));
    },
    /**
     * /products/csv/product-list — 旧CSV一括処理 › 商品リストダウンロード: the admin shows its older screen here
     * (/makeshop/newmanager/product_download.html in a frame; manual.makeshop.jp/hc/ja/articles/44242885925401)
     */
    pdl() {
      this.nav('msNavCsv');
      this.crumb(['ホーム', '商品管理', '商品一覧', 'CSV一括処理', '商品リストダウンロード']);
      const opt = (t, on, more) => `<div class="ms-lg-opt"><span class="ms-radio${on ? ' on' : ''}"></span>${esc(t)}${more ? ' <u>(詳細はこちら)</u>' : ''}</div>`;
      $('#msMain').innerHTML = `
        <h1 class="ms-h1">商品リストダウンロード</h1>
        <div class="ms-panel ms-legacy">
          <p class="ms-note">MakeShopに登録した商品データを様々なモールのCSV形式に合わせてダウンロードすることができます。（CSVの文字コードは <b>Shift_JIS</b>）</p>
          <div class="ms-lg-h">カテゴリを選択してください</div>
          <span class="ms-sel" id="msItems">すべての商品</span>
          <div class="ms-lg-h">ダウンロードするCSV形式を選択してください</div>
          ${opt('楽天市場(RMS)　通常商品登録用CSVでダウンロード', false, true)}${opt('楽天市場(RMS)　項目選択肢登録用CSVでダウンロード', false, true)}${opt('標準の形式で商品リストダウンロード', true)}
          <div class="ms-lg-btn"><span id="msDlBtn">↓ 上記の選択した形式で商品データダウンロード</span></div>
        </div>`;
      window.MsUi.hydrate($('#msMain'));
    },
    /**
     * /members — 会員一覧 with its CSVダウンロード dialog open (the admin writes the member CSV from 会員一覧:
     * "会員一覧で絞り込んだ会員を、選んだフォーマットの項目・並び順でCSVに出力します。" — its own text)
     */
    mdl() {
      this.nav('msNavMdl');
      this.crumb(['ホーム', '会員管理', '会員一覧']);
      $('#msMain').innerHTML = `
        <div class="ms-phead"><h1 class="ms-h1">会員一覧</h1><span class="ms-btn ghost">CSV一括処理</span></div>
        <div class="ms-panel"><div class="ms-ph"></div><div class="ms-ph"></div></div>
        <div class="ms-dlg-bg"></div>
        <div class="ms-panel ms-dlg"><h3>CSVダウンロード</h3>
          <p class="ms-note">会員一覧で絞り込んだ会員を、選んだフォーマットの項目・並び順でCSVに出力します。パスワードは暗号化されているため出力されません。</p>
          <div class="ms-form"><label>フォーマット</label><div><span class="ms-sel">基本フォーマット</span></div></div>
          <div class="ms-dlg-b"><span class="ms-btn ghost">閉じる</span><span class="ms-btn" id="msDlBtn">ダウンロード</span></div>
        </div>`;
      window.MsUi.hydrate($('#msMain'));
    },
    /** (the older download screen keeps no history list) */
    hist() {},
  };

  /* ===================================================================== Shopify admin views */
  const V = {
    home() {
      const step = (done, t, d) => `<div class="sa-setup${done ? ' done' : ''}"><span class="sa-setup-ck">${done ? icon('check') : ''}</span><div><b>${t}</b><p class="sa-mute">${d}</p></div></div>`;
      return H.page({ title: 'ホーム' },
        H.card('ストアの立ち上げ準備', `<p class="sa-mute">makeshop からの移行：残り 4 / 7 件</p>${H.prog(43)}` +
          step(true, '決済の設定', 'Shopify ペイメント・後払い・コンビニ決済') + step(true, '配送の設定', '常温・冷凍の配送プロファイルと送料') + step(true, '税金の設定', '軽減税率 8%（食品）・標準税率 10%') +
          step(false, '商品を追加', 'makeshop の商品データを CSV でインポート') + step(false, '顧客を追加', '会員データの移行') + step(false, 'テーマをカスタマイズ', 'Prestige をベースに商品カード・ページを構築') + step(false, 'ドメインを接続', 'store.nissin.com')));
    },
    productsEmpty() {
      return H.page({ title: '商品', actions: [H.btn('インポート', { id: 'prImport' }), H.btn('商品を追加', { pri: true })] },
        H.card('', `<div class="sa-empty big"><div class="sa-empty-art">${K.ic('tag')}</div><h3>まずは商品を追加しましょう</h3><p>販売する商品を追加するか、CSV ファイルからまとめてインポートします。</p><div class="sa-empty-b">${H.btn('商品をインポート', { id: 'prImport2' })}${H.btn('商品を追加', { pri: true })}</div></div>`));
    },
    importModal(state, o = {}) {
      const file = state !== 'pick';
      if (state === 'preview') {
        const it = F.ITEMS[0];
        return `<p class="sa-mute">CSV ファイルの 1 件目の商品です。問題がなければインポートしてください。</p>
          <div class="sa-imp-prev">
            <div class="sa-imp-img" style="background-image:url('${esc(img[it.code] || '')}')"></div>
            <div><h3>${esc(it.name)}</h3>
              ${H.kv([['販売元', esc(it.brand)], ['タグ', `カテゴリー_${esc(it.cat)}, サブカテゴリー_${esc(it.sub)}, 配送方法_${esc(it.ship)}, 販売方法_通常購入`], ['バリエーション', `販売単位：1${esc(it.unit)} ${yen(it.price)} / 1箱(${it.caseN}${esc(it.unit)}入) ${yen(it.casePrice)}`], ['ステータス', 'アクティブ']])}
            </div>
          </div>
          <p class="sa-mute" style="margin-top:12px">${F.ITEMS.length.toLocaleString()} 件の商品（${F.OUT_OK.length.toLocaleString()} 行のバリエーション）をインポートします。</p>`;
      }
      return `<div class="sa-drop${file ? ' has' : ''}" id="impDrop">${file
        ? `<div class="sa-file"><span class="ic">CSV</span><div><b>${esc(o.name)}</b><div class="sa-mute">${esc(o.size)}</div></div><span class="sp"></span><span class="sa-btn plain">置き換える</span></div>`
        : `${H.btn('ファイルを追加', { id: 'impAdd' })}<div class="sa-mute" style="margin-top:8px">またはファイルをドロップしてアップロード</div>`}</div>
        <div class="sa-f" style="margin:14px 0 0"><span class="sa-ck${o.overwrite ? ' on' : ''}" id="impOverwrite"></span>　同じハンドルを持つ既存の商品を上書きする</div>
        ${o.publish !== false ? `<div class="sa-f" style="margin:8px 0 0"><span class="sa-ck on"></span>　すべての販売チャネルに商品を公開する</div>` : ''}
        <p class="sa-mute" style="margin:12px 0 0"><span class="sa-link">サンプル CSV テンプレート</span>をダウンロードして形式を確認できます。</p>`;
    },
    importFoot(state) {
      return state === 'preview' ? `${H.btn('キャンセル')}${H.btn('商品をインポート', { pri: true, id: 'impGo' })}`
        : `${H.btn('キャンセル')}${H.btn('アップロードしてプレビュー', { pri: true, id: 'impUp', off: state === 'pick' })}`;
    },
    productsList(o = {}) {
      const rows = F.ITEMS.slice(0, o.n || 14).map((it) => [H.ck(), `<span class="sa-pn">${H.thumb(img[it.code] || '', {})}<span>${esc(it.name)}</span></span>`,
        H.badge('アクティブ', 'ok'), `<span class="sa-mute">在庫 ${(it.stock + (it.caseN ? Math.floor(it.stock / it.caseN) : 0)).toLocaleString()}（${it.caseN ? 2 : 1} バリエーション）</span>`, esc(it.cat), esc(it.brand)]);
      return H.page({ title: '商品', actions: [H.btn('エクスポート'), H.btn('インポート', { id: 'prImport' }), H.btn('商品を追加', { pri: true })] },
        (o.banner || '') +
        H.card('', `<div class="sa-tabs"><span class="on">すべて</span><span>アクティブ</span><span>下書き</span><span>アーカイブ済み</span><span class="sp"></span><span class="sa-mute" style="margin-left:auto">${F.ITEMS.length} 件の商品</span></div>` +
          H.table([['', 'ck'], '商品', 'ステータス', '在庫', 'カテゴリー', '販売元'], rows, { id: 'prTable', rowId: (r, i) => F.ITEMS[i].code }), { flush: true }));
    },
    product(it) {
      const vrow = (t, p, cmp, sku, n) => [`<b>${esc(t)}</b>`, `<span class="sa-in-s">${yen(p)}</span>`, cmp ? `<span class="sa-mute">${yen(cmp)}</span>` : '<span class="sa-mute">—</span>', `<code>${esc(sku)}</code>`, `<span class="num">${n}</span>`];
      const vars = [vrow(`1${it.unit}`, it.price, '', it.sku, it.stock)];
      if (it.caseN) vars.push(vrow(`1箱(${it.caseN}${it.unit}入)`, it.casePrice, it.caseList, it.sku + '-c', Math.floor(it.stock / it.caseN)));
      return H.page({ title: it.name, back: true, badge: H.badge('アクティブ', 'ok'), actions: [H.btn('複製'), H.btn('プレビュー'), H.btn('その他の操作')] },
        `<div class="sa-grid"><div>
          ${H.card('', H.field('タイトル', it.name) + H.field('説明', '', { ta: true, ph: '（説明文は makeshop の商品説明 HTML から別途移行）' }) + `<label class="sa-lbl">メディア</label><div class="sa-media"><span class="sa-th big" style="background-image:url('${esc(img[it.code] || '')}')"></span><span class="sa-media-add">${icon('plus')}</span></div>`)}
          ${H.card('バリエーション', `<div class="sa-opt"><span class="sa-mute">販売単位</span>${[`1${it.unit}`, it.caseN ? `1箱(${it.caseN}${it.unit}入)` : ''].filter(Boolean).map((x) => `<span class="sa-pill">${esc(x)}</span>`).join('')}</div>` + H.table(['バリエーション', '価格', '比較対象価格', 'SKU', ['在庫', 'num']], vars, { id: 'pdVars' }), { id: 'pdVarCard' })}
        </div><div>
          ${H.card('ステータス', `<div class="sa-in sel"><span class="v">アクティブ</span></div>`)}
          ${H.card('商品整理', H.field('販売元', it.brand) + H.field('タグ', `<span class="sa-tag">カテゴリー_${esc(it.cat)}</span><span class="sa-tag">サブカテゴリー_${esc(it.sub)}</span><span class="sa-tag">配送方法_${esc(it.ship)}</span><span class="sa-tag">販売方法_通常購入</span>`, { html: true }), { id: 'pdOrg' })}
          ${H.card('販売チャネル', '<p>オンラインストア</p><p class="sa-mute">ハンドル：/products/' + esc(it.code) + '</p>')}
        </div></div>`);
    },
    customersEmpty() {
      return H.page({ title: '顧客', actions: [H.btn('インポート', { id: 'cuImport' }), H.btn('顧客を追加', { pri: true })] },
        H.card('', `<div class="sa-empty big"><div class="sa-empty-art">${K.ic('user')}</div><h3>顧客を管理しましょう</h3><p>既存の顧客リストを CSV でインポートできます。</p></div>`));
    },
    customersImportModal(file) {
      return `<div class="sa-drop${file ? ' has' : ''}">${file ? `<div class="sa-file"><span class="ic">CSV</span><div><b>customers_shopify.csv</b><div class="sa-mute">2.1 MB</div></div></div>` : `${H.btn('ファイルを追加', { id: 'cuAdd' })}<div class="sa-mute" style="margin-top:8px">またはファイルをドロップしてアップロード</div>`}</div>
        <div class="sa-f" style="margin:14px 0 0"><span class="sa-ck"></span>　同じメールアドレスまたは電話番号を持つ既存の顧客を上書きする</div>
        <div class="sa-banner info" style="margin:14px 0 0"><i data-icon="info"></i><div>メールマーケティングの同意（Accepts Email Marketing）は CSV の値のまま取り込まれます。</div></div>`;
    },
    customers(n) {
      const LAST = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田'];
      const FIRST = ['陽菜', '蓮', '結衣', '大翔', '美咲', '悠真', '葵', '湊', '凛', '翔太', '彩', '健'];
      const rank = ['ゴールド', 'シルバー', 'レギュラー', 'レギュラー', 'シルバー', 'レギュラー'];
      const rows = LAST.map((l, i) => [H.ck(), `<span class="pii">${l} ${FIRST[(i * 5) % FIRST.length]}</span>`, i % 3 ? H.badge('購読中', 'ok') : H.badge('未購読'), `<span class="pii">${['東京都', '大阪府', '神奈川県', '愛知県'][i % 4]}</span>`, '0 件', `<span class="sa-tag">makeshop移行</span><span class="sa-tag">会員ランク_${rank[i % rank.length]}</span>`]);
      return H.page({ title: '顧客', actions: [H.btn('エクスポート'), H.btn('インポート'), H.btn('顧客を追加', { pri: true })] },
        H.card('', `<div class="sa-tools">${icon('search')}<span>すべての顧客を検索</span><span class="sp"></span><span>${n.toLocaleString()} 人の顧客</span></div>` + H.table([['', 'ck'], '顧客名', 'メール配信', '所在地', '注文', 'タグ'], rows), { flush: true }));
    },
    accounts(sel) {
      const opt = (k, t, d, badge) => `<div class="sa-choice${sel === k ? ' on' : ''}" data-acc="${k}"><span class="sa-rd"></span><div><b>${t}${badge || ''}</b><p class="sa-mute">${d}</p></div></div>`;
      return `<div class="sa-page">${H.card('顧客アカウント', '<p class="sa-mute">ストアとチェックアウトでの顧客のログイン方法を選びます。</p>' +
        opt('new', '新しい顧客アカウント', 'パスワード不要。登録メールアドレスに届く 6 桁の確認コードでログインします。注文履歴の確認・再注文に対応。', ' ' + H.badge('推奨', 'info')) +
        opt('classic', '従来の顧客アカウント', 'メールアドレスとパスワードでログインします。移行した顧客は招待メールからパスワードを設定する必要があります。'), { id: 'accCard' })}
        ${H.card('ログイン表示', '<div class="sa-f"><span class="sa-ck on"></span>　オンラインストアのヘッダーとチェックアウトにログインのリンクを表示する</div>')}</div>`;
    },
    navigation() {
      return H.page({ title: 'ナビゲーション', actions: [H.btn('URL リダイレクトを表示', { id: 'navRedir' }), H.btn('メニューを追加', { pri: true })] },
        H.card('', H.table(['メニュー', 'メニュー項目'], [['<b>メインメニュー</b>', 'トップ, 完全メシ, キャンペーン, 新商品, ランキング, セール, 定期購入, ポイントプログラム'], ['<b>フッターメニュー</b>', 'ご利用ガイド, よくあるご質問, お問い合わせ, 特定商取引法に基づく表記, プライバシーポリシー']]), { flush: true }));
    },
    redirects(rows, o = {}) {
      const show = rows.slice(0, 13).map(([a, b]) => [H.ck(), `<code>${esc(a)}</code>`, `<code>${esc(b)}</code>`]);
      return H.page({ title: 'URL リダイレクト', back: true, actions: [H.btn('エクスポート'), H.btn('インポート', { id: 'rdImport' }), H.btn('URL リダイレクトを作成', { pri: true })] },
        (o.banner || '') + H.card('', rows.length
          ? `<div class="sa-tools">${icon('search')}<span>リダイレクトを検索</span><span class="sp"></span><span>${rows.length.toLocaleString()} 件</span></div>` + H.table([['', 'ck'], 'リダイレクト元', 'リダイレクト先'], show, { id: 'rdTable' })
          : `<div class="sa-empty big"><div class="sa-empty-art">${K.ic('external')}</div><h3>URL リダイレクトを管理する</h3><p>リダイレクトを作成すると、古い URL にアクセスした人を新しいページに転送できます。</p></div>`, { flush: true }));
    },
    redirectsImportModal(file, o = {}) {
      return `<div class="sa-drop${file ? ' has' : ''}">${file ? `<div class="sa-file"><span class="ic">CSV</span><div><b>redirects.csv</b><div class="sa-mute">${o.size || '19 KB'}</div></div></div>` : `${H.btn('ファイルを追加', { id: 'rdAdd' })}<div class="sa-mute" style="margin-top:8px">「Redirect from」「Redirect to」の 2 列の CSV</div>`}</div>
        <div class="sa-f" style="margin:14px 0 0"><span class="sa-ck${o.overwrite ? ' on' : ''}" id="rdOverwrite"></span>　同じパスを持つ既存のリダイレクトを上書きする</div>`;
    },
    domains(state) {
      const rows = [[`<b>store-nissin.myshopify.com</b>`, state === 'primary' ? '<span class="sa-mute">—</span>' : H.badge('プライマリ', 'info'), H.badge('接続済み', 'ok', { dot: true, full: true })]];
      if (state) rows.unshift([`<b>store.nissin.com</b>`, state === 'primary' ? H.badge('プライマリ', 'info') : '', state === 'pending' ? H.badge('確認中', 'att', { dot: true }) : H.badge('接続済み', 'ok', { dot: true, full: true })]);
      return H.page({ title: 'ドメイン', actions: [H.btn('既存のドメインを接続', { id: 'dmConnect' }), H.btn('新しいドメインを購入')] },
        H.card('', H.table(['ドメイン', '', 'ステータス'], rows, { id: 'dmTable' }), { flush: true }) +
        (state ? H.card('store.nissin.com', `<div id="dmDetail">${V.dnsTable(state)}</div>`, { id: 'dmCard' }) : ''));
    },
    dnsTable(state) {
      return `<p class="sa-mute">ドメインの DNS 設定で、次のレコードを Shopify に向けてください。</p>` +
        H.table(['タイプ', '名前', '値', '状態'], [['CNAME', 'store', 'shops.myshopify.com', state === 'pending' ? H.badge('確認中', 'att') : H.badge('検証済み', 'ok')]]) +
        `<div class="sa-hr"></div>${H.kv([['SSL 証明書', state === 'pending' ? '<span class="sa-mute">ドメインの接続後に自動で発行されます</span>' : H.badge('発行済み', 'ok') + ' <span class="sa-mute">Let\'s Encrypt</span>']])}
        <div style="margin-top:12px;display:flex;gap:8px">${state === 'pending' ? H.btn('接続を確認', { pri: true, id: 'dmVerify' }) : state === 'connected' ? H.btn('プライマリドメインに設定', { pri: true, id: 'dmPrimary' }) : ''}</div>`;
    },
    preferences(locked) {
      return H.page({ title: '環境設定' },
        H.card('タイトルとメタディスクリプション', H.field('ホームページのタイトル', '日清食品グループ オンラインストア') + H.field('ホームページのメタディスクリプション', '日清食品グループの公式オンラインストア。カップヌードル、完全メシ、どん兵衛など…', { ta: true })) +
        H.card('パスワード保護', `<div class="sa-f"><span class="sa-ck${locked ? ' on' : ''}" id="pwCheck"></span>　パスワードでアクセスを制限する</div>` +
          `<div id="pwFields" class="${locked ? '' : 'sa-dim'}">${H.field('パスワード', '••••••••••')}${H.field('訪問者へのメッセージ', 'ただいまリニューアル準備中です。まもなくオープンします。', { ta: true })}</div>`, { id: 'pwCard' }));
    },
  };

  window.Nissin = { MS, V, img, yen };
})();
