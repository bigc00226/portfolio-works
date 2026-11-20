/*
 * The screens of this video on top of the shared kit (shared/kit/kit.js — VS Code, Chrome, the captured shop):
 *   MS — the makeshop byGMO shop admin: the real login page (js/makeshop-login.js, shown by js/makeshop-login-frame.js),
 *        then the admin — a reconstruction (it needs an account) with the admin's own logo, icons, font, menu labels and
 *        colours from its public JavaScript (js/makeshop-ui.js): home (ショップ開設の準備), カテゴリ設定, 商品登録,
 *        商品一括登録 (CSV), 商品一覧, ショップデザイン › クリエイターモード (トップページ), 会員設定, 決済設定, 配送設定,
 *        注文一覧 / 注文詳細, ショップ公開設定
 * The catalogue and the page HTML come from js/files.js (the shop's own public pages).
 */
(function () {
  'use strict';
  const D = window.Demo, F = window.FILES;
  const { $, $$, esc } = D;
  const yen = (v) => '¥' + Number(v).toLocaleString('ja-JP');
  const IT = F.ITEMS.find((i) => i.code === '000000001982'); // ミディ胡蝶蘭 ホワイト (商品番号 6WO01)
  const catOf = (k) => F.CATS.find((c) => c.key === k);

  /* ---------------------------------------------------------------- the admin's frame (js/makeshop-login-frame.js: MsUi.shell) */
  // the left menu as this account shows it: the categories it works in are open, with the items it uses
  // (the left menu lets each account show / hide its items; 商品登録 is opened from 商品一覧, as in the admin)
  const MS_FRAME = {
    shopName: '花・フラワーギフト Hanahiro', shopId: 'hanahiro8787', avatar: 'cyan-lighten-3', homeId: 'msNavHome', shopLinkId: 'msPreview',
    groups: {
      order: [['msNavOrders', '注文一覧']],
      product: [['msNavItems', '商品一覧'], ['msNavCats', 'カテゴリ設定'], ['msNavCsv', 'CSV一括処理']],
      member: [['msNavMembers', '会員一覧'], ['msNavMemberCfg', '登録フォーム項目']],
      design: [['msNavCreator', 'テンプレート選択・編集']],
      config: [['', '設定'], ['msNavShip', '配送方法設定'], ['msNavPay', '決済一覧'], ['msNavOpen', '開店状態の設定']],
    },
  };
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mslogin"><iframe id="msLoginFrame" title="管理画面ログイン - makeshop byGMO"></iframe></div>
    <div class="br-page" data-page="ms"><div class="ms-adm">${window.MsUi.shell(MS_FRAME)}<div class="ms-toast" id="msToast"></div></div></div>`);

  const field = (label, value, o = {}) => `<label>${esc(label)}${o.req ? '<span class="ms-req">必須</span>' : ''}</label><div>${o.html != null ? o.html : `<span class="ms-in${o.wide ? ' wide' : ''}${o.num ? ' num' : ''}" id="${o.id || ''}"><span class="v">${esc(value)}</span>${o.suffix ? `<span class="sfx">${esc(o.suffix)}</span>` : ''}</span>`}${o.help ? `<p class="ms-help">${esc(o.help)}</p>` : ''}</div>`;
  const radios = (opts, on, name) => opts.map((x) => `<span class="ms-rd" data-r="${name}:${esc(x)}"><span class="ms-radio${x === on ? ' on' : ''}"></span>${esc(x)}</span>`).join('');
  const toggle = (on, id) => `<span class="ms-tg${on ? ' on' : ''}"${id ? ` id="${id}"` : ''}><i></i></span>`;
  const thumb = (src) => `<span class="ms-th" style="background-image:url('${esc(src || '')}')"></span>`;

  /* ---------------------------------------------------------------- pages */
  const SETUP = [
    ['cats', 'カテゴリの設定', 'シーン別・スタイル別のカテゴリ'], ['items', '商品の登録', '商品情報・画像・価格・在庫'], ['design', 'ショップデザイン', 'トップページ・ヘッダー・フッター'],
    ['member', '会員の設定', '会員登録の項目・ポイント'], ['pay', '決済の設定', 'クレジットカード・Amazon Pay・PayPay'], ['ship', '配送の設定', '配送方法・送料・お届け日'], ['open', 'ショップの公開', 'テスト注文の確認と公開'],
  ];
  const MS = {
    URL: 'https://console.makeshop.jp',
    ID: 'hanahiro8787',            // the login ID (shown blurred)
    PASSWORD: 'Hanahiro-ms2026',   // shown as ••• by the page
    done: new Set(),
    title: (t) => window.MsUi.title(t),
    crumb(c) { $('#msCrumb').innerHTML = window.MsUi.crumbs(c); },
    nav(id) {
      $$('.ms-adm .ms-subitem').forEach((e) => e.classList.toggle('on', e.id === id));
      $('#msNavHome').classList.toggle('on', id === 'msNavHome');
    },
    put(html, crumb, nav) {
      this.nav(nav); this.crumb(crumb);
      $('#msMain').innerHTML = `<div class="ms-scroll" id="msScroll">${html}</div>`;
      window.MsUi.hydrate($('#msMain'));
      D.hydrateIcons($('#msMain'));
    },
    toast(t) { const el = $('#msToast'); el.textContent = t; el.classList.add('show'); clearTimeout(this._t); this._t = setTimeout(() => el.classList.remove('show'), 2600 / D.Clock.speed); },
    // (the admin's frame shows no open / closed badge: the state is on 開店状態の設定 and on the dashboard card)
    published(on) { this.isOpen = on; },

    home() {
      const step = ([k, t, d]) => `<div class="ms-setup${this.done.has(k) ? ' done' : ''}"><span class="ck"></span><div><b>${esc(t)}</b><p class="ms-mute">${esc(d)}</p></div></div>`;
      // (since 2026-03-18 the お知らせ / メンテナンス情報 are in the right side bar, not on the dashboard; the dashboard has no breadcrumbs)
      this.put(`<h1 class="ms-h1">ダッシュボード</h1>
        <div class="ms-home2"><div class="ms-card"><h3>ショップ初期設定</h3><p class="ms-mute">設定を完了して、ショップをオープンしましょう。（ショップは現在<b class="ms-closed">${this.isOpen ? '開店' : '閉店'}</b>）</p>${SETUP.map(step).join('')}</div></div>`, [], 'msNavHome');
    },

    /** 商品管理 › カテゴリ設定 */
    cats(o = {}) {
      const have = o.have || [];
      const row = (c, sub) => `<tr data-cat="${c.key}"${o.flash === c.key ? ' class="new"' : ''}><td>${sub ? '<span class="ms-tree">└</span>' : ''}${esc(c.name)}</td><td><code>/view/category/${esc(c.key)}</code></td><td>${sub ? toggle(true) : ''}</td></tr>`;
      const grp = (g, name) => `<tr class="grp"><td><b>${esc(name)}</b></td><td><code>—</code></td><td>${toggle(true)}</td></tr>` + F.CATS.filter((c) => c.group === g && have.includes(c.key)).map((c) => row(c, true)).join('');
      this.put(`<h1 class="ms-h1">カテゴリ設定</h1>
        <div class="ms-two">
          <div class="ms-panel"><h3>カテゴリ一覧</h3><table class="ms-tbl" id="catTbl"><thead><tr><th>カテゴリ名</th><th>URL</th><th>表示</th></tr></thead><tbody>${grp('scene', 'シーン別（By scene）')}${grp('style', 'スタイル別（Style）')}</tbody></table></div>
          <div class="ms-panel"><h3>カテゴリを追加</h3><div class="ms-form one">
            ${field('親カテゴリ', '', { html: `<span class="ms-sel" id="catParent">${esc(o.parent || 'シーン別（By scene）')}</span>` })}
            ${field('カテゴリ名', o.name || '', { id: 'catName', req: true, wide: true })}
            ${field('URL（カテゴリID）', o.slug || '', { id: 'catSlug', wide: true, help: '半角英数字・ハイフン。/view/category/ に続く文字列になります' })}
            ${field('表示', '', { html: toggle(true) + ' 表示する' })}
          </div><span class="ms-btn" id="catAdd"><i data-ms-icon="plus"></i>追加する</span></div>
        </div>`, ['ホーム', '商品管理', 'カテゴリ設定'], 'msNavCats');
    },

    /** 商品管理 › 商品登録 */
    productNew(o = {}) {
      const opt = (n, v) => `<div class="ms-opt"><b>${esc(n)}</b><span class="ms-mute">${esc(v)}</span></div>`;
      this.put(`<h1 class="ms-h1">商品登録</h1>
        <div class="ms-panel"><h3>基本情報</h3><div class="ms-form">
          ${field('商品名', o.name || '', { id: 'pnName', req: true, wide: true })}
          ${field('商品番号', o.no || '', { id: 'pnNo' })}
          ${field('販売価格', o.price || '', { id: 'pnPrice', req: true, num: true, suffix: '円' })}
          ${field('価格の入力', '', { html: radios(['税込', '税抜'], '税込', 'tax') + '<span class="ms-help in">（ご利用ガイドの表示は税込価格）</span>' })}
          ${field('在庫数', o.stock || '', { id: 'pnStock', num: true, suffix: '個' })}
          ${field('カテゴリ', '', { html: `<div class="ms-chips" id="pnCats">${(o.cats || []).map((k) => `<span class="ms-chip">${esc(catOf(k).name)}<i>×</i></span>`).join('')}<span class="ms-chip add" id="pnCatAdd">＋ 追加</span></div>` })}
        </div></div>
        <div class="ms-panel"><h3>商品画像</h3><div class="ms-imgs" id="pnImgs">${o.img ? `<span class="ms-img" style="background-image:url('${esc(IT.img)}')"><i>メイン</i></span>` : ''}<span class="ms-img add" id="pnImgAdd"><i data-ms-icon="upload"></i>画像を追加</span></div><p class="ms-help">JPEG / PNG・横 1200px 推奨。1 枚目が一覧・詳細のメイン画像になります</p></div>
        <div class="ms-panel"><h3>商品説明</h3><div class="ms-ta" id="pnDesc">${o.desc ? esc(o.desc) : '<span class="ph">商品ページに表示する説明文</span>'}</div></div>
        <div class="ms-panel"><h3>オプション（購入時の選択項目）</h3>${opt('ご用途', 'ウインターギフト / クリスマス / 御歳暮 / お祝い / お礼 …（必須）')}${opt('お届け希望日', '11月25日(水) 〜（ウインターギフトのお届け期間・必須）')}${opt('2027年 Hanahiroオリジナル フラワーカレンダー', '付ける（+660円）/ 付けない（必須）')}${opt('ウィンターコフレ ～焼菓子4個入～', '付ける（+1800円）/ 付けない（お届け 12/5〜12/25 限定）')}${opt('ケーク ショコラレザンノワ', '付ける（+1100円）/ 付けない（お届け 12/5〜12/25 限定）')}</div>
        <div class="ms-foot"><span class="ms-btn ghost">下書き保存</span><span class="ms-btn" id="pnSave">登録する</span></div>`, ['ホーム', '商品管理', '商品一覧', '商品登録'], 'msNavItems');
    },

    /** 商品管理 › CSV一括処理 › 商品情報一括アップロード (/products/csv/upload) */
    csv(o = {}) {
      this.put(`<h1 class="ms-h1">商品情報一括アップロード</h1>
        <div class="ms-panel"><p class="ms-note">CSV ファイルで商品をまとめて登録します。文字コードは <b>Shift_JIS</b> / UTF-8（BOM 付き）に対応しています。画像は商品画像フォルダに先にアップロードしておくと、ファイル名で紐付けます。</p>
          <div class="ms-drop${o.file ? ' has' : ''}" id="csvDrop">${o.file ? `<span class="ms-file"><b>CSV</b>${esc(o.file)}<span class="ms-mute">${esc(o.size)}</span></span>` : `<span class="ms-btn ghost" id="csvPick"><i data-ms-icon="upload"></i>ファイルを選択</span><span class="ms-mute">またはドラッグ＆ドロップ</span>`}</div>
          <div class="ms-form"><label>同じ商品番号の商品</label><div>${radios(['上書きする', 'スキップする'], '上書きする', 'ow')}</div></div>
          <span class="ms-btn${o.file ? '' : ' off'}" id="csvGo"><i data-ms-icon="upload"></i>アップロードして登録</span><div id="csvProg"></div></div>`, ['ホーム', '商品管理', '商品一覧', 'CSV一括処理', '商品情報一括アップロード'], 'msNavCsv');
    },
    progress(n, total) { $('#csvProg').innerHTML = `<div class="ms-prog"><span>登録中… ${n} / ${total} 件</span><i style="width:${Math.round((n / total) * 100)}%"></i></div>`; },
    /** the result of the upload: registered rows, and the rows that failed */
    csvResult(ok, errs) {
      $('#csvProg').innerHTML = `<div class="ms-res${errs.length ? ' err' : ''}"><b>${ok} 件を登録しました${errs.length ? `／${errs.length} 件はエラーのため登録されていません` : ''}</b>${errs.length ? `
        <table class="ms-tbl" id="csvErr"><thead><tr><th>行</th><th>商品コード</th><th>エラー内容</th></tr></thead><tbody>${errs.map((e) => `<tr><td>${e.row}</td><td><code>${esc(e.code)}</code></td><td>${esc(e.msg)}</td></tr>`).join('')}</tbody></table>
        <div class="ms-res-b"><span class="ms-btn ghost sm" id="csvImgUp"><i data-ms-icon="upload"></i>商品画像フォルダにアップロード</span><span class="ms-btn sm" id="csvRetry">エラーの行を再登録</span></div>` : ''}</div>`;
      window.MsUi.hydrate($('#csvProg'));
    },

    /** 商品管理 › 商品一覧 */
    items(n) {
      const list = n === 1 ? [IT] : F.ITEMS.slice(0, n);
      const rows = list.map((it) => `<tr data-code="${it.code}"><td>${thumb(it.img)}</td><td><b>${esc(it.name)}</b><div class="ms-mute">${esc(it === IT ? '6WO01' : it.code)}</div></td><td class="r">${yen(it.price)}</td><td class="r">${it === IT && n === 1 ? 10 : it.code === '000000002016' ? 300 : 20}</td><td>${esc(it.cats.slice(0, 2).map((k) => catOf(k).name).join('・'))}</td><td>${toggle(true)}</td></tr>`).join('');
      // page head: the title, and 商品登録 on the right (the admin opens 商品登録 from here: /products/new)
      this.put(`<div class="ms-phead"><h1 class="ms-h1">商品一覧<span class="ms-count">${n} 件</span></h1><span class="ms-btn" id="msItemsNew">商品登録</span></div>
        <div class="ms-panel"><table class="ms-tbl items"><thead><tr><th></th><th>商品名 / 商品番号</th><th class="r">販売価格（税込）</th><th class="r">在庫</th><th>カテゴリ</th><th>表示</th></tr></thead><tbody>${rows}</tbody></table></div>`, ['ホーム', '商品管理', '商品一覧'], 'msNavItems');
    },

    /** ショップデザイン › クリエイターモード › ページ編集（トップ） */
    creator(code, o = {}) {
      const lines = code ? code.split('\n') : [''];
      const hl = window.Kit.Hi.highlight('html', lines).map((toks, i) => `<div class="ms-cl"><span class="n">${i + 1}</span><span class="t">${toks.map(([t, c]) => (c ? `<span class="${c}">${esc(t)}</span>` : esc(t))).join('') || ' '}</span></div>`).join('');
      this.put(`<h1 class="ms-h1">ページの編集<span class="ms-count">デザインセット：Hanahiro 2026（編集中）</span></h1>
        <div class="ms-cm">
          <div class="ms-cm-side"><div class="h">ページ</div>${['トップ', '商品一覧', '商品詳細', 'カート', 'ご利用ガイド'].map((x, i) => `<div class="i${i ? '' : ' on'}">${esc(x)}</div>`).join('')}<div class="h">モジュール</div>${['ヘッダー', 'フッター', 'サイドメニュー'].map((x) => `<div class="i">${esc(x)}</div>`).join('')}<div class="h">共通</div><div class="i">CSS</div><div class="i">JavaScript</div></div>
          <div class="ms-cm-main"><div class="ms-cm-bar"><span class="tb on">HTML</span><span class="tb">CSS</span><span class="tb">JavaScript</span><span class="sp"></span><span class="ms-btn ghost sm" id="cmPreview"><i data-ms-icon="eye"></i>プレビュー</span><span class="ms-btn sm" id="cmSave">保存</span></div>
            <div class="ms-cm-code${o.sel ? ' sel' : ''}" id="cmCode">${hl}</div></div>
        </div>`, ['ホーム', 'ショップデザイン', 'テンプレート選択・編集', 'ページの編集'], 'msNavCreator');
    },

    /** 会員管理 › 会員設定 */
    memberCfg(o = {}) {
      const ck = (t, on, req) => `<span class="ms-ckl"><span class="ms-check${on ? ' on' : ''}"></span>${esc(t)}${req ? '<span class="ms-req">必須</span>' : ''}</span>`;
      this.put(`<h1 class="ms-h1">登録フォーム項目</h1>
        <div class="ms-panel"><h3>会員制度</h3><div class="ms-form">
          ${field('会員登録', '', { html: radios(['会員登録あり（ゲスト購入も可）', '会員のみ購入可', '会員登録なし'], '会員登録あり（ゲスト購入も可）', 'mem') })}
          ${field('ログイン ID', '', { html: radios(['メールアドレス', '任意の ID'], 'メールアドレス', 'lid') })}
          ${field('パスワード', '', { html: '<span class="ms-mute">8 文字以上・英字と数字を含む</span>' })}
        </div></div>
        <div class="ms-panel"><h3>会員登録の項目</h3><div class="ms-cks" id="mcItems">${ck('氏名', true, true)}${ck('フリガナ', true, true)}${ck('メールアドレス', true, true)}${ck('電話番号', true, true)}${ck('住所', true, true)}${ck('生年月日', !!o.birthday)}${ck('性別', false)}${ck('メールマガジンの購読', true)}</div><p class="ms-help">お届け先（贈り先）は注文ごとに入力するため、会員の住所とは別に管理します</p></div>
        <div class="ms-panel"><h3>ポイント</h3><div class="ms-form">
          ${field('ポイント制度', '', { html: toggle(true) + ' 利用する' })}
          ${field('付与率', o.rate || '', { id: 'mcRate', num: true, suffix: '%', help: '購入金額（税込・送料を除く）に対して' })}
          ${field('有効期限', '最終購入日から 1 年', {})}
        </div></div>
        <div class="ms-foot"><span class="ms-btn" id="mcSave">保存する</span></div>`, ['ホーム', '会員管理', '登録フォーム項目'], 'msNavMemberCfg');
    },

    /** 機能・設定 › 決済設定 */
    pay(on = {}) {
      const row = (k, name, d, logos) => `<div class="ms-pay" data-pay="${k}"><div><b>${esc(name)}</b><p class="ms-mute">${esc(d)}</p>${logos ? `<div class="ms-brands">${logos.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}</div>${toggle(!!on[k], 'pay-' + k)}</div>`;
      this.put(`<h1 class="ms-h1">決済一覧</h1>
        <div class="ms-panel"><h3>ご利用いただける決済方法</h3>
          ${row('card', 'クレジットカード決済', 'makeshop クレジット決済（3D セキュア 2.0）', ['VISA', 'Mastercard', 'JCB', 'AMEX', 'Diners'])}
          ${row('amazon', 'Amazon Pay', 'Amazon アカウントの住所・決済情報で購入')}
          ${row('paypay', 'PayPay', 'PayPay アプリで支払い')}
          ${row('cod', '代金引換', '生花は贈り先への配送のため使用しない')}
          ${row('bank', '銀行振込（前払い）', '入金確認後の発送')}
        </div>
        <div class="ms-panel"><h3>表示</h3><div class="ms-form">${field('価格の表示', '', { html: radios(['税込', '税抜'], '税込', 'pt') })}${field('消費税', '10%（円未満四捨五入）', {})}</div></div>
        <div class="ms-foot"><span class="ms-btn" id="paySave">保存する</span></div>`, ['ホーム', 'ショップ構築', '設定', '決済', '決済一覧'], 'msNavPay');
    },

    /** 機能・設定 › 配送設定 */
    REGIONS: [
      { k: 'tokyo', name: '東京都下', fee: 770, prefs: ['東京都'] },
      { k: 'kanto', name: '関東地区', fee: 1100, prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '神奈川県', '山梨県'] },
      { k: 'honshu', name: '上記以外の本州・四国', fee: 1320, prefs: ['新潟県', '富山県', '長野県', '静岡県', '愛知県', '大阪府', '京都府', '兵庫県', '広島県', '香川県', '…'] },
      { k: 'far', name: '北海道・九州・沖縄本島・離島', fee: 1815, prefs: ['北海道', '福岡県', '熊本県', '鹿児島県', '沖縄県', '…'] },
    ],
    ship(o = {}) {
      const regs = this.REGIONS.map((r) => ({ ...r, prefs: r.k === 'tokyo' && o.tokyoMissing ? [] : r.k === 'honshu' && o.tokyoMissing ? ['東京都', ...r.prefs] : r.prefs }));
      const fees = o.fees || {};
      const reg = (r) => `<tr data-reg="${r.k}"><td><b>${esc(r.name)}</b></td><td class="prefs">${r.prefs.length ? r.prefs.map((p) => `<span class="ms-pref${p === '東京都' ? ' tk' : ''}">${esc(p)}</span>`).join('') : '<span class="ms-mute">（都道府県が未設定）</span>'}</td><td class="r"><span class="ms-in num sm" id="fee-${r.k}"><span class="v">${fees[r.k] != null ? Number(fees[r.k]).toLocaleString() : ''}</span><span class="sfx">円</span></span></td></tr>`;
      const sim = o.sim || {};
      this.put(`<h1 class="ms-h1">配送方法設定</h1>
        <div class="ms-panel"><h3>配送方法</h3><div class="ms-form">${field('配送方法', '', { html: '<b>宅配便（ヤマト運輸）</b><span class="ms-mute">　都内の一部は自社配送</span>' })}${field('送料の設定', '', { html: radios(['全国一律', '地域別'], '地域別', 'sf') })}</div>
          <table class="ms-tbl" id="shipTbl"><thead><tr><th>地域グループ</th><th>都道府県</th><th class="r">送料（税込）</th></tr></thead><tbody>${regs.map(reg).join('')}</tbody></table></div>
        <div class="ms-panel" id="leadPanel"><h3>お届け日指定</h3><div class="ms-form">
          ${field('お届け日の指定', '', { html: toggle(true) + ' 指定できる（お届け希望日のオプションがない商品のカート画面）' })}
          ${field('最短お届け日', o.lead != null ? String(o.lead) : '', { id: 'leadDays', num: true, suffix: '日後から', help: 'ご注文日から数えた日数' })}
          ${field('当日受付の締め時刻', '17:00', { help: 'これ以降のご注文は翌日受付として数えます' })}
          ${field('選択できる期間', '60 日先まで', {})}
        </div>
        <div class="ms-pv" id="leadPv"><span class="ms-mute">お客様の注文画面での表示（今日 11/7 13 時台に注文した場合）</span><div class="ms-pv-sel"><span class="lab">お届け日</span><span class="ms-sel" id="leadSel">${o.lead ? esc(this.firstDay(o.lead)) + ' から選択' : '—'}</span></div></div></div>
        <div class="ms-panel" id="simPanel"><h3>送料シミュレーション</h3><div class="ms-sim"><span class="ms-sel" id="simPref">${esc(sim.pref || '都道府県を選択')}</span><span class="ms-btn ghost sm" id="simGo">計算</span><span class="ms-sim-r" id="simRes">${sim.fee ? `送料 <b>${yen(sim.fee)}</b>（${esc(sim.reg)}）` : ''}</span></div></div>
        <div class="ms-foot"><span class="ms-btn" id="shipSave">保存する</span></div>`, ['ホーム', 'ショップ構築', '設定', '配送', '配送方法設定'], 'msNavShip');
    },
    firstDay(n) { const d = new Date(2026, 10, 7 + n); return `${d.getMonth() + 1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`; },

    /** 注文管理 › 注文一覧 / 注文詳細 */
    orders() {
      this.put(`<h1 class="ms-h1">注文一覧</h1>
        <div class="ms-panel"><table class="ms-tbl"><thead><tr><th>注文番号</th><th>注文日時</th><th>ご注文者</th><th>お届け先</th><th class="r">合計</th><th>決済</th><th>状態</th></tr></thead>
        <tbody><tr class="new" id="ordRow"><td><b>T-0001</b><span class="ms-tag">テスト</span></td><td>2026/11/07 14:52</td><td><span class="pii">制作担当（テスト会員）</span></td><td>東京都</td><td class="r">${yen(IT.price + 660 + 770)}</td><td>クレジットカード</td><td><span class="ms-badge">新規受付</span></td></tr></tbody></table></div>`, ['ホーム', '注文管理', '注文一覧'], 'msNavOrders');
    },
    order(o = {}) {
      const kv = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      this.put(`<h1 class="ms-h1">注文詳細<span class="ms-count">T-0001（テスト注文）</span></h1>
        <div class="ms-two">
          <div class="ms-panel" id="odItems"><h3>ご注文商品</h3><div class="ms-od-item">${thumb(IT.img)}<div><b>${esc(IT.name)}</b><p class="ms-mute">ご用途：ウインターギフト　／　お届け希望日：<b id="odDate">11月25日(水)</b>　／　フラワーカレンダー：付ける（+660円）　／　ウィンターコフレ・ケーク：付けない</p></div><span class="r">${yen(IT.price + 660)}</span></div>
            <dl class="ms-kv" id="odSum">${kv('商品合計', yen(IT.price + 660))}${kv('送料（東京都）', `<b id="odShip">${yen(770)}</b>`)}${kv('合計（税込）', `<b>${yen(IT.price + 660 + 770)}</b>`)}</dl></div>
          <div class="ms-panel"><h3>お届け先・お支払い</h3><dl class="ms-kv">${kv('お届け先', '<span class="pii">東京都中央区 …</span>')}${kv('配送方法', '宅配便（ヤマト運輸）')}${kv('お支払い', 'クレジットカード（VISA・テストカード）')}${kv('注文確認メール', '送信済み（テスト会員のアドレス）')}</dl>
            <div class="ms-foot left"><span class="ms-btn ghost" id="odCancel">この注文をキャンセル</span></div></div>
        </div>`, ['ホーム', '注文管理', '注文一覧', '注文詳細'], 'msNavOrders');
      if (o.cancelled) $('#odCancel').outerHTML = '<span class="ms-badge gray">キャンセル済み</span>';
    },

    /** ショップ構築 › 設定 › ショップ情報 › 開店状態の設定 (/settings/shop-info/open-state; labels: the admin's own) */
    open(on) {
      const seg = (t, sel) => `<span class="ms-rd ms-seg${sel ? ' on' : ''}">${t}</span>`;
      this.put(`<h1 class="ms-h1">開店状態の設定</h1>
        <div class="ms-panel"><h3>開店状態の設定</h3><div class="ms-form one">
          <label>ショップの開閉状態</label><div>${seg('開店', on)}${seg('閉店', !on)}<p class="ms-help">閉店時はメンテナンス画面が表示されます。</p></div>
        </div><span class="ms-btn" id="opSave">更新</span></div>`, ['ホーム', 'ショップ構築', '設定', 'ショップ情報', '開店状態の設定'], 'msNavOpen');
    },
  };

  window.Hanahiro = { MS, yen, IT, catOf };
})();
