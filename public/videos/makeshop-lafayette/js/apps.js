/*
 * The screens of this video on top of the shared kit (shared/kit/kit.js — VS Code, Chrome, the captured shop):
 *   MS — the makeshop byGMO shop admin: the real login page (js/makeshop-login.js, shown by js/makeshop-login-frame.js),
 *        then the admin — a reconstruction (it needs an account) with the admin's own logo, icons, font, menu groups and
 *        colours from its public JavaScript (js/makeshop-ui.js): home, カテゴリー設定 (ブランド / アイテムの 2 系統),
 *        商品登録 (カラー × サイズのバリエーションと在庫), 商品一覧ページの設定・商品検索, 会員設定 (ポイント・ランク・
 *        お気に入り・再入荷通知), カート・送料・決済, 在庫一覧, 商品編集の販売期間
 * The catalogue and the category trees come from js/files.js (the shop's own public pages).
 */
(function () {
  'use strict';
  const D = window.Demo, F = window.FILES;
  const { $, $$, esc } = D;
  const yen = (v) => '¥' + Number(v).toLocaleString('ja-JP');

  /* the two hoodies of the video (the shop's own products; stock counts are the demo's) */
  const BOX = { code: '000000036275', no: 'LA260501', name: 'LFYT エルエフワイティー LFYT BOX LOGO HOODIE プルオーバーフーディー LA260501', price: 16500 };
  const QLT = { code: '000000036374', no: 'LA260502', name: 'LFYT エルエフワイティー Lafayette LOGO QUILTED HOODIE プルオーバーフーディー LA260502', price: 22000 };
  const COLORS = ['BLACK', 'HEATHER GRAY'];
  const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  // as the live product page shows them: XL / XXL of BLACK and M / L of HEATHER GRAY are sold out
  const STOCK = { 'BLACK-S': 3, 'BLACK-M': 2, 'BLACK-L': 4, 'BLACK-XL': 0, 'BLACK-XXL': 0, 'HEATHER GRAY-S': 2, 'HEATHER GRAY-M': 0, 'HEATHER GRAY-L': 0, 'HEATHER GRAY-XL': 1, 'HEATHER GRAY-XXL': 2 };
  const sku = (c, s) => `${BOX.no}-${c === 'BLACK' ? 'BK' : 'HG'}-${s}`;

  /* ---------------------------------------------------------------- the admin shell */
  const MENU = [
    ['grp', '日々のショップ運営をスムーズにする'],
    ['msNavHome', 'home', 'ホーム'],
    ['', 'product', '商品管理', [['msNavItems', '商品一覧'], ['msNavNew', '商品登録'], ['msNavCats', 'カテゴリー設定'], ['msNavStock', '在庫一覧']]],
    ['', 'order', '注文管理', [['msNavOrders', '注文一覧']]],
    ['', 'customer', '会員管理', [['msNavMembers', '会員一覧'], ['msNavMemberCfg', '会員設定']]],
    ['', 'design', 'ショップデザイン', [['msNavList', '商品一覧ページ・検索'], ['msNavCreator', 'クリエイターモード']]],
    ['grp', '現状を分析して、売上につなげる'],
    ['', 'analysis', '分析・販促管理'],
    ['grp', '便利な機能を追加する'],
    ['', 'app', 'アプリ管理'],
    ['', 'config', '機能・設定', [['msNavCart', 'カート・送料・決済'], ['msNavOpen', 'ショップ公開設定']]],
  ];
  const menuHtml = MENU.map((m) => {
    if (m[0] === 'grp') return `<div class="ms-grp">${esc(m[1])}</div>`;
    const [id, ic, label, sub] = m;
    return `<div class="ms-item${sub ? ' open' : ''}"${id ? ` id="${id}"` : ''}><i data-ms-icon="${ic}"></i>${esc(label)}${sub ? '<i class="chev" data-icon="chevron-down"></i>' : ''}</div>` +
      (sub ? `<div class="ms-sub open">${sub.map(([sid, sl]) => `<div class="ms-subitem" id="${sid}">${esc(sl)}</div>`).join('')}</div>` : '');
  }).join('');
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mslogin"><iframe id="msLoginFrame" title="管理画面ログイン - makeshop byGMO"></iframe></div>
    <div class="br-page" data-page="ms"><div class="ms-adm">
      <div class="ms-shell">
        <aside class="ms-side">
          <div class="ms-brand"><img class="ms-brand-logo" src="assets/makeshop/ms-logo-typeA.svg" alt="makeshop byGMO"><span class="ms-collapse" title="メニューを折りたたむ"><i data-ms-icon="collapseHorizontal"></i></span></div>
          <div class="ms-shop"><div class="ms-shop-name">Lafayette 公式通販サイト</div><div class="ms-shop-id">ID: <span class="pii">lafayette</span><span class="ms-st on">公開中</span></div></div>
          <div class="ms-menu">${menuHtml}</div>
        </aside>
        <div class="ms-body">
          <header class="ms-top"><div class="ms-crumb" id="msCrumb"></div><span class="sp"></span><span class="ms-tl" id="msPreview"><i data-ms-icon="eye"></i>ショップを見る</span><span class="ms-tl"><i data-ms-icon="help"></i>ヘルプ</span><span class="ms-tl"><i data-ms-icon="account"></i>アカウント</span></header>
          <main class="ms-main" id="msMain"></main>
        </div>
      </div>
      <div class="ms-toast" id="msToast"></div>
    </div></div>`);

  const field = (label, value, o = {}) => `<label>${esc(label)}${o.req ? '<span class="ms-req">必須</span>' : ''}</label><div>${o.html != null ? o.html : `<span class="ms-in${o.wide ? ' wide' : ''}${o.num ? ' num' : ''}" id="${o.id || ''}"><span class="v">${esc(value)}</span>${o.suffix ? `<span class="sfx">${esc(o.suffix)}</span>` : ''}</span>`}${o.help ? `<p class="ms-help">${esc(o.help)}</p>` : ''}</div>`;
  const radios = (opts, on, name) => opts.map((x) => `<span class="ms-rd" data-r="${name}:${esc(x)}"><span class="ms-radio${x === on ? ' on' : ''}"></span>${esc(x)}</span>`).join('');
  const toggle = (on, id) => `<span class="ms-tg${on ? ' on' : ''}"${id ? ` id="${id}"` : ''}><i></i></span>`;
  const thumb = (src) => `<span class="ms-th" style="background-image:url('${esc(src || '')}')"></span>`;
  const ck = (t, on, id) => `<span class="ms-ckl"${id ? ` id="${id}"` : ''}><span class="ms-check${on ? ' on' : ''}"></span>${esc(t)}</span>`;
  const img = (code) => ((F.ITEMS.concat(F.NEW)).find((i) => i.code === code) || {}).img;

  const TASKS = [['cats', 'LFYT 2026 A/W のカテゴリー'], ['items', 'BOX LOGO HOODIE の登録（カラー × サイズ）'], ['list', '新着一覧の並び順・検索'], ['member', 'ポイント・会員ランク・お気に入り'], ['cart', '送料・送料無料ライン・決済'], ['ops', '新作 3 型の販売開始の予約']];
  const MS = {
    URL: 'https://console.makeshop.jp',
    ID: 'lafayette',
    PASSWORD: 'Lafayette-ms2026',
    done: new Set(),
    BOX, QLT, COLORS, SIZES, STOCK, sku,
    title: (t) => window.MsUi.title(t),
    crumb(c) { $('#msCrumb').innerHTML = c.map((x, i) => (i ? '<span class="sl">/</span>' : '') + `<span>${esc(x)}</span>`).join(''); },
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

    home() {
      const t = ([k, x]) => `<div class="ms-setup${this.done.has(k) ? ' done' : ''}"><span class="ck"></span><div><b>${esc(x)}</b></div></div>`;
      this.put(`<h1 class="ms-h1">ホーム</h1>
        <div class="ms-home2"><div class="ms-card"><h3>今日の作業（LFYT 2026 A/W の準備）</h3>${TASKS.map(t).join('')}</div>
        <div class="ms-card"><h3>本日の状況</h3><p class="ms-mute">新規注文 <b class="ms-n">14</b> 件　発送待ち <b class="ms-n">9</b> 件</p><p class="ms-mute">再入荷通知の申込 <b class="ms-n">23</b> 件</p><p class="ms-mute">在庫切れの SKU <b class="ms-n">186</b> 件</p></div></div>`, ['ホーム'], 'msNavHome');
    },

    /** 商品管理 › カテゴリー設定（ブランドから探す / アイテムから探す） */
    cats(o = {}) {
      const subs = (o.aw ? [{ key: 'lfyt_2026aw', name: 'LFYT 2026 Autumn/Winter Collection', n: 33 }] : []).concat(F.LFYT_SUBS.filter((s) => s.key !== 'lafayette_sweatshirt' || o.sweat));
      const brandRows = F.BRANDS.map((b) => `<tr data-cat="${b.key}"${b.key === 'lafayette' ? ' class="open"' : ''}><td>${b.key === 'lafayette' ? '▾ ' : ''}${esc(b.name)}</td><td><code>/view/category/${esc(b.key)}</code></td><td>${toggle(true)}</td></tr>` +
        (b.key === 'lafayette' ? subs.map((s) => `<tr data-cat="${s.key}"${o.flash === s.key ? ' class="new"' : ''}><td><span class="ms-tree">└</span>${esc(s.name)}<span class="ms-cnt">${s.n}</span></td><td><code>/view/category/${esc(s.key)}</code></td><td>${toggle(true)}</td></tr>`).join('') : '')).join('');
      const itemRows = F.ITEM_CATS.map((c) => `<tr data-cat="${c.key}"><td>${esc(c.name)}</td><td><code>/view/category/${esc(c.key)}</code></td><td>${toggle(true)}</td></tr>`).join('');
      this.put(`<h1 class="ms-h1">カテゴリー設定</h1>
        <div class="ms-two">
          <div><div class="ms-panel"><h3>ブランドから探す</h3><table class="ms-tbl" id="brandTbl"><thead><tr><th>カテゴリー名</th><th>URL</th><th>表示</th></tr></thead><tbody>${brandRows}</tbody></table></div></div>
          <div><div class="ms-panel"><h3>カテゴリーを追加</h3><div class="ms-form one">
            ${field('親カテゴリー', '', { html: `<span class="ms-sel" id="catParent">${esc(o.parent || 'ブランドから探す')}</span>` })}
            ${field('カテゴリー名', o.name || '', { id: 'catName', req: true, wide: true })}
            ${field('URL（カテゴリーID）', o.slug || '', { id: 'catSlug', wide: true })}
          </div><span class="ms-btn" id="catAdd"><i data-ms-icon="plus"></i>追加する</span></div>
          <div class="ms-panel"><h3>アイテムから探す</h3><table class="ms-tbl" id="itemTbl"><tbody>${itemRows}</tbody></table></div></div>
        </div>`, ['商品管理', 'カテゴリー設定'], 'msNavCats');
    },

    /** 商品管理 › 商品登録（カラー × サイズ） */
    product(o = {}) {
      const chips = (arr, id) => `<div class="ms-chips" id="${id}">${arr.map((x) => `<span class="ms-chip">${esc(x)}<i>×</i></span>`).join('')}${o.typing === id ? '<span class="ms-in sm" id="varIn"><span class="v"></span></span>' : '<span class="ms-chip add">＋ 追加</span>'}</div>`;
      const rows = (o.colors || []).flatMap((c) => (o.sizes || []).map((s) => {
        const n = o.stock ? STOCK[`${c}-${s}`] : '';
        return `<tr data-sku="${c}-${s}"><td>${esc(c)}</td><td>${esc(s)}</td><td><code>${esc(sku(c, s))}</code></td><td class="r"><span class="ms-in num sm${o.stockOff ? ' off' : ''}"><span class="v">${o.stockOff ? '—' : n}</span></span></td><td>${o.stockOff ? '<span class="ms-mute">在庫管理しない</span>' : n === 0 ? '<span class="ms-badge warn">再入荷通知を受付</span>' : '<span class="ms-badge">販売中</span>'}</td></tr>`;
      })).join('');
      this.put(`<h1 class="ms-h1">商品登録</h1>
        <div class="ms-panel"><h3>基本情報</h3><div class="ms-form">
          ${field('商品名', o.name || '', { id: 'pdName', req: true, wide: true })}
          ${field('品番', o.no || '', { id: 'pdNo' })}
          ${field('販売価格（税込）', o.price || '', { id: 'pdPrice', num: true, suffix: '円' })}
          ${field('カテゴリー', '', { html: `<div class="ms-chips" id="pdCats">${(o.cats || []).map((x) => `<span class="ms-chip">${esc(x)}<i>×</i></span>`).join('')}<span class="ms-chip add" id="pdCatAdd">＋ 追加</span></div>`, help: 'ブランド（LFYT）とアイテム（パーカー）の両方に入れる' })}
        </div></div>
        <div class="ms-panel" id="varPanel"><h3>バリエーション</h3><div class="ms-form">
          ${field('項目 1：カラー', '', { html: chips(o.colors || [], 'varColor') })}
          ${field('項目 2：サイズ', '', { html: chips(o.sizes || [], 'varSize') })}
          ${field('在庫管理', '', { html: radios(['在庫管理しない', 'バリエーションごとに管理する'], o.stockOff === false ? 'バリエーションごとに管理する' : '在庫管理しない', 'stk') })}
          ${field('在庫 0 の表示', '', { html: radios(['売り切れ', '再入荷通知を受け付ける'], '再入荷通知を受け付ける', 'zero') })}
        </div>
        ${rows ? `<table class="ms-tbl" id="skuTbl"><thead><tr><th>カラー</th><th>サイズ</th><th>SKU コード</th><th class="r">在庫数</th><th>表示</th></tr></thead><tbody>${rows}</tbody></table>` : ''}</div>
        <div class="ms-foot"><span class="ms-btn ghost" id="pdPreview"><i data-ms-icon="eye"></i>プレビュー</span><span class="ms-btn" id="pdSave">保存する</span></div>`, ['商品管理', '商品登録'], 'msNavNew');
    },

    /** ショップデザイン › 商品一覧ページ・検索 */
    list(o = {}) {
      const SORTS = ['新着順（登録日の新しい順）', '登録日の古い順', '価格の低い順', '価格の高い順', 'おすすめ順'];
      this.put(`<h1 class="ms-h1">商品一覧ページ・検索</h1>
        <div class="ms-panel" id="lpPanel"><h3>商品一覧ページ</h3><div class="ms-form">
          ${field('1 ページの表示件数', '48', { num: true, suffix: '件' })}
          ${field('並び順の初期値', '', { html: `<span class="ms-sel" id="lpSort">${esc(o.sort || SORTS[2])}</span>`, help: '「新着から探す」や各カテゴリーを開いたときの並び順' })}
          ${field('選べる並び順', '', { html: ['価格の低い順', '価格の高い順', 'おすすめ順', '新着順'].map((x) => ck(x, true)).join(' ') })}
          ${field('件数の表示', '', { html: toggle(true) + ' 「全 ◯ 件中 ◯ 件表示」' })}
          ${field('子カテゴリー', '', { html: toggle(true) + ' 一覧の上に子カテゴリーと件数を表示（LFYT › LFYT Tシャツ (◯) …）' })}
        </div></div>
        <div class="ms-panel" id="srPanel"><h3>商品検索</h3><div class="ms-form">
          ${field('検索の対象', '', { html: [['商品名', true], ['品番', true], ['カテゴリー名（ブランド）', true], ['商品説明', false]].map(([x, on]) => ck(x, on, x === 'カテゴリー名（ブランド）' ? 'srBrand' : '')).join(' '), help: 'ブランドの読み（カーハート・ニューエラ など）でも見つかるように' })}
          ${field('並び順', '', { html: radios(['新着順', 'おすすめ順'], '新着順', 'srs') })}
        </div></div>
        <div class="ms-foot"><span class="ms-btn" id="lpSave">保存する</span></div>`, ['ショップデザイン', '商品一覧ページ・検索'], 'msNavList');
    },
    SORTS: ['新着順（登録日の新しい順）', '登録日の古い順', '価格の低い順', '価格の高い順', 'おすすめ順'],

    /** 会員管理 › 会員設定 */
    member(o = {}) {
      const RANK = [['スタンダード', '新規登録時', '1%'], ['ランク 2', '直近 1 年の購入額に応じて', '—'], ['ランク 3', '〃', '—'], ['ランク 4', '〃', '—'], ['ランク 5', '〃', '10%']];
      this.put(`<h1 class="ms-h1">会員設定</h1>
        <div class="ms-panel"><h3>ポイント</h3><div class="ms-form">
          ${field('通常の付与率', o.rate || '', { id: 'mbRate', num: true, suffix: '%', help: 'ご購入額（手数料・送料を除く）に対して。配送完了の 1 日後に付与' })}
          ${field('新規登録ポイント', o.signup || '', { id: 'mbSignup', num: true, suffix: 'pt' })}
          ${field('有効期限', '最後に配送を行った日から 1 年', {})}
        </div></div>
        <div class="ms-panel"><h3>会員ランク</h3><table class="ms-tbl" id="rankTbl"><thead><tr><th>ランク</th><th>条件</th><th class="r">ポイント還元</th></tr></thead><tbody>${RANK.map(([a, b, c]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td><td class="r">${esc(c)}</td></tr>`).join('')}</tbody></table><p class="ms-help">毎月 1 日に、直近 1 年間の累計購入金額でランクを確定（5 段階・最大 10%）</p></div>
        <div class="ms-panel" id="favPanel"><h3>お気に入り・再入荷通知</h3>
          <div class="ms-pay"><div><b>お気に入り</b><p class="ms-mute">商品ページ・SKU ごとの「お気に入りに追加」、マイページのお気に入り一覧</p></div>${toggle(!!o.fav, 'mbFav')}</div>
          <div class="ms-pay"><div><b>再入荷通知</b><p class="ms-mute">在庫 0 の SKU に「再入荷通知を受け取る」を表示し、入荷したらメールでお知らせ</p></div>${toggle(!!o.restock, 'mbRestock')}</div>
          <div class="ms-pay"><div><b>お気に入り商品の値下げ・再入荷のお知らせ</b><p class="ms-mute">お気に入りに入れた商品が値下げ・再入荷したときにメール</p></div>${toggle(!!o.favMail, 'mbFavMail')}</div>
        </div>
        <div class="ms-foot"><span class="ms-btn" id="mbSave">保存する</span></div>`, ['会員管理', '会員設定'], 'msNavMemberCfg');
    },

    /** 機能・設定 › カート・送料・決済 */
    cart(o = {}) {
      const FEES = [['関東・信越・南東北・北陸・中部', 600], ['北東北・関西', 700], ['中国', 800], ['四国', 900], ['北海道・九州', 1000], ['沖縄', 1100]];
      const PAY = ['クレジットカード', 'クロネコ代金後払い', '楽天ペイ', 'LINE Pay', 'Paidy', 'キャリア決済', 'Amazon Pay'];
      this.put(`<h1 class="ms-h1">カート・送料・決済</h1>
        <div class="ms-two">
          <div><div class="ms-panel"><h3>送料（税込・ヤマト運輸）</h3><table class="ms-tbl" id="feeTbl"><tbody>${FEES.map(([a, f]) => `<tr><td>${esc(a)}</td><td class="r">${yen(f)}</td></tr>`).join('')}</tbody></table>
            <div class="ms-form">${field('送料無料', o.free || '', { id: 'freeLine', num: true, suffix: '円以上', help: '税込の購入合計金額' })}${field('店舗受け取り', '', { html: toggle(true) + ' Lafayette 各店舗で受け取り（送料なし）' })}</div></div></div>
          <div><div class="ms-panel"><h3>決済方法</h3><div class="ms-chips">${PAY.map((p) => `<span class="ms-chip on">${esc(p)}</span>`).join('')}</div><p class="ms-help">予約商品を含む注文では LINE Pay を選べない</p></div>
            <div class="ms-panel"><h3>カート</h3><div class="ms-form">
              ${field('送料無料までの表示', '', { html: toggle(!!o.remain, 'cartRemain') + ' カートに「あと ◯ 円で送料無料」を表示' })}
              ${field('予約商品', '', { html: radios(['通常商品と別のカート', '同じカート'], '通常商品と別のカート', 'rsv') })}
            </div></div></div>
        </div>
        <div class="ms-foot"><span class="ms-btn" id="cartSave">保存する</span></div>`, ['機能・設定', 'カート・送料・決済'], 'msNavCart');
    },

    /** 商品管理 › 在庫一覧 */
    stock(o = {}) {
      const rows = COLORS.flatMap((c) => SIZES.map((s) => [c, s])).map(([c, s]) => { const n = STOCK[`${c}-${s}`]; return `<tr class="${n === 0 ? 'zero' : n <= 1 ? 'low' : ''}"><td>${thumb(img(BOX.code))}</td><td>LFYT BOX LOGO HOODIE<div class="ms-mute">${esc(BOX.no)}</div></td><td>${esc(c)} / ${esc(s)}</td><td><code>${esc(sku(c, s))}</code></td><td class="r"><b>${n}</b></td><td class="r">${n === 0 ? [4, 3, 6, 2][(c.length + s.length) % 4] : '—'}</td></tr>`; }).join('');
      this.put(`<h1 class="ms-h1">在庫一覧<span class="ms-count">SKU 単位</span></h1>
        <div class="ms-panel"><div class="ms-filters"><span class="ms-chip on">LA260501</span><span class="ms-chip">在庫 0</span><span class="ms-chip">残りわずか（1 以下）</span></div>
        <table class="ms-tbl items" id="stkTbl"><thead><tr><th></th><th>商品</th><th>カラー / サイズ</th><th>SKU コード</th><th class="r">在庫</th><th class="r">再入荷通知の申込</th></tr></thead><tbody>${rows}</tbody></table></div>`, ['商品管理', '在庫一覧'], 'msNavStock');
    },

    /** 商品管理 › 商品編集（販売期間） */
    schedule(o = {}) {
      this.put(`<h1 class="ms-h1">商品編集<span class="ms-count">${esc(QLT.no)}</span></h1>
        <div class="ms-panel"><div class="ms-od-item">${thumb(img(QLT.code))}<div><b>${esc(QLT.name)}</b><p class="ms-mute">${yen(QLT.price)}（税込）・BLACK / GRAY / GREEN × S〜XXL</p></div></div></div>
        <div class="ms-panel" id="spPanel"><h3>販売期間</h3><div class="ms-form">
          ${field('販売開始', '', { html: `<span class="ms-in" id="spDate"><span class="v">2026/11/21</span></span> <span class="ms-in" id="spTime"><span class="v">${esc(o.time || '')}</span></span>` })}
          ${field('販売終了', '設定しない', {})}
          ${field('販売開始前の表示', '', { html: radios(['「販売期間外の商品です ◯◯より販売開始」と表示', '非表示'], '「販売期間外の商品です ◯◯より販売開始」と表示', 'pre') })}
          ${field('新着一覧', '', { html: toggle(true) + ' 販売開始と同時に「新着から探す」の先頭に表示' })}
        </div></div>
        <div class="ms-foot"><span class="ms-btn ghost" id="spPreview"><i data-ms-icon="eye"></i>プレビュー</span><span class="ms-btn" id="spSave">保存する</span></div>`, ['商品管理', '商品一覧', QLT.no], 'msNavItems');
    },
  };

  window.Lafayette = { MS, yen, img };
})();
