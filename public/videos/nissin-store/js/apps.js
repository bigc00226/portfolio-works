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
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mslogin"><iframe id="msLoginFrame" title="管理画面ログイン - makeshop byGMO"></iframe></div>
    <div class="br-page" data-page="ms"><div class="ms-adm">
      <div class="ms-shell">
        <aside class="ms-side">
          <div class="ms-brand"><img class="ms-brand-logo" src="assets/makeshop/ms-logo-typeA.svg" alt="makeshop byGMO"><span class="ms-collapse" title="メニューを折りたたむ"><i data-ms-icon="collapseHorizontal"></i></span></div>
          <div class="ms-shop"><div class="ms-shop-name">日清食品グループ オンラインストア</div><div class="ms-shop-id">ID: <span class="pii">nissinstore</span></div></div>
          <div class="ms-grp">日々のショップ運営をスムーズにする</div>
          <div class="ms-item" id="msNavHome"><i data-ms-icon="home"></i>ホーム</div>
          <div class="ms-item"><i data-ms-icon="menuBook"></i>メインメニュー</div>
          <div class="ms-item open" id="msNavItem"><i data-ms-icon="product"></i>商品管理<i class="chev" data-icon="chevron-down"></i></div>
          <div class="ms-sub open"><div class="ms-subitem">商品一覧</div><div class="ms-subitem">商品登録</div><div class="ms-subitem" id="msNavCsv">CSV一括処理</div></div>
          <div class="ms-item"><i data-ms-icon="order"></i>注文管理<i class="chev" data-icon="chevron-down"></i></div>
          <div class="ms-item open"><i data-ms-icon="customer"></i>会員管理<i class="chev" data-icon="chevron-down"></i></div>
          <div class="ms-sub open"><div class="ms-subitem">会員一覧</div><div class="ms-subitem" id="msNavMdl">会員アップロード・ダウンロード</div></div>
          <div class="ms-item"><i data-ms-icon="design"></i>ショップデザイン<i class="chev" data-icon="chevron-down"></i></div>
          <div class="ms-grp">現状を分析して、売上につなげる</div>
          <div class="ms-item"><i data-ms-icon="analysis"></i>分析・販促管理<i class="chev" data-icon="chevron-down"></i></div>
          <div class="ms-grp">便利な機能を追加する</div>
          <div class="ms-item"><i data-ms-icon="app"></i>アプリ管理<i class="chev" data-icon="chevron-down"></i></div>
          <div class="ms-item ms-bottom"><i data-ms-icon="config"></i>機能・設定</div>
        </aside>
        <div class="ms-body">
          <header class="ms-top"><div class="ms-crumb" id="msCrumb"></div><span class="sp"></span><span class="ms-tl"><i data-ms-icon="search"></i>検索</span><span class="ms-tl"><i data-ms-icon="help"></i>ヘルプ</span><span class="ms-tl"><i data-ms-icon="account"></i>アカウント</span></header>
          <main class="ms-main" id="msMain"></main>
        </div>
      </div>
    </div></div>`);

  const MS = {
    URL: 'https://console.makeshop.jp',
    ID: 'nissinstore',          // the login ID (shown blurred)
    PASSWORD: 'Nissin-mig2026',  // shown as ••• by the page
    /** "<page> - makeshop byGMO" (the admin's own title format) */
    title: (t) => window.MsUi.title(t),
    crumb(c) { $('#msCrumb').innerHTML = c.map((x, i) => (i ? '<span class="sl">/</span>' : '') + `<span>${esc(x)}</span>`).join(''); },
    nav(id) {
      $$('.ms-adm .ms-subitem').forEach((e) => e.classList.toggle('on', e.id === id));
      $('#msNavHome').classList.toggle('on', id === 'msNavHome');
    },
    /** /dashboard — where the login lands */
    home() {
      this.nav('msNavHome');
      this.crumb(['ホーム']);
      $('#msMain').innerHTML = `
        <h1 class="ms-h1">ホーム</h1>
        <div class="ms-home">
          <div class="ms-card"><h3>受注</h3><p class="ms-mute">新規受注・発送待ちの確認</p><div class="ms-ph"></div></div>
          <div class="ms-card"><h3>商品</h3><p class="ms-mute">商品登録・在庫の管理</p><div class="ms-ph"></div></div>
          <div class="ms-card"><h3>会員</h3><p class="ms-mute">会員情報・メールマガジン</p><div class="ms-ph"></div></div>
        </div>`;
    },
    /** /products/csv — CSV一括処理 (the operations under their names in the admin) */
    csvHome() {
      this.nav('msNavCsv');
      this.crumb(['CSV一括処理']);
      const row = (t, id) => `<div class="ms-op"${id ? ` id="${id}"` : ''}><span>${esc(t)}</span><i data-ms-icon="arrowForward"></i></div>`;
      const up = ['商品情報一括アップロード', '商品一括登録', '商品一括修正', '商品一括削除', '商品の並び順一括登録・修正', '商品のカテゴリ一括登録・解除', 'サブ画像一括登録・修正', 'バリエーション一括登録・修正', '会員グループ別価格一括登録'];
      $('#msMain').innerHTML = `
        <h1 class="ms-h1">CSV一括処理</h1>
        <div class="ms-ops">
          <div class="ms-panel"><h3><i data-ms-icon="upload"></i>アップロード</h3>${up.map((t) => row(t)).join('')}</div>
          <div class="ms-panel"><h3><i data-ms-icon="download"></i>ダウンロード</h3>${row('商品リストダウンロード', 'msCsvPdl')}${row('ダウンロード一覧')}${row('アップロード一覧')}</div>
        </div>`;
      window.MsUi.hydrate($('#msMain'));
    },
    /** /products/csv/product-list — CSV一括処理 › 商品リストダウンロード */
    pdl() {
      this.nav('msNavCsv');
      this.crumb(['CSV一括処理', '商品リストダウンロード']);
      $('#msMain').innerHTML = `
        <h1 class="ms-h1">商品リストダウンロード</h1>
        <div class="ms-panel">
          <p class="ms-note">登録されている商品データを CSV ファイルでダウンロードします。CSV ファイルの文字コードは <b>Shift_JIS</b> です。</p>
          <div class="ms-form">
            <label>対象商品</label><div><span class="ms-radio on"></span>すべての商品（${F.ITEMS.length.toLocaleString()} 件）　<span class="ms-radio"></span>検索条件で絞り込む</div>
            <label>ダウンロード項目</label><div><span class="ms-sel" id="msItems">基本情報・価格・在庫・カテゴリー・画像 URL</span></div>
            <label>オプション</label><div><span class="ms-check on"></span>ケース販売（セット）情報を含める　<span class="ms-check on"></span>非表示の商品を含める</div>
          </div>
          <span class="ms-btn" id="msDlBtn"><i data-ms-icon="download"></i>CSV ダウンロード</span>
        </div>
        <div class="ms-panel"><h3>ダウンロード履歴</h3><table class="ms-tbl"><thead><tr><th>日時</th><th>ファイル名</th><th>件数</th></tr></thead><tbody id="msHist"><tr><td colspan="3" class="ms-mute">履歴はありません</td></tr></tbody></table></div>`;
      window.MsUi.hydrate($('#msMain'));
    },
    /** /members/member-csv — 会員一覧 › 会員アップロード・ダウンロード */
    mdl() {
      this.nav('msNavMdl');
      this.crumb(['会員一覧', '会員アップロード・ダウンロード']);
      $('#msMain').innerHTML = `
        <h1 class="ms-h1">会員アップロード・ダウンロード</h1>
        <div class="ms-panel">
          <p class="ms-note">会員情報を CSV ファイルでダウンロードします（文字コード：Shift_JIS）。パスワードは暗号化されているため出力されません。</p>
          <div class="ms-form">
            <label>対象会員</label><div><span class="ms-radio on"></span>すべての会員　<span class="ms-radio"></span>会員グループで絞り込む</div>
            <label>出力項目</label><div><span class="ms-sel">会員ID・氏名・連絡先・住所・会員グループ・メルマガ購読・登録日・退会</span></div>
          </div>
          <span class="ms-btn" id="msDlBtn"><i data-ms-icon="download"></i>CSV ダウンロード</span>
        </div>`;
      window.MsUi.hydrate($('#msMain'));
    },
    hist(name, n) { $('#msHist').innerHTML = `<tr class="new"><td>${esc(window.Win11.fmt.stamp())}</td><td>${esc(name)}</td><td>${n}</td></tr>`; },
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
