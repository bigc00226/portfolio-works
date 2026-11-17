/*
 * The screens of this video on top of the shared Shopify kit (shared/kit/kit.js):
 *   V   — Shopify admin pages: analytics (searches without results, web performance), products (vendor = brand code),
 *         custom data (product metafield definition), Search & Discovery filters, locations, local pickup, themes
 *   LH  — the Lighthouse panel of Chrome DevTools: the real Lighthouse report renderer + the data of a real run
 * Product data (titles, brand codes, prices, images) come from the captured store (js/site-snapshot.js).
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, esc, icon, wait } = D;
  const { H } = K;
  const yen = (v) => '¥' + Number(v).toLocaleString('ja-JP');

  /* ===================================================================== admin pages */
  const V = {
    analytics() {
      const kpi = (l, v, d, up) => `<div class="an-kpi"><span>${l}</span><b>${v}<i class="${up ? 'up' : 'dn'}">${d}</i></b></div>`;
      const bars = [38, 42, 40, 47, 51, 44, 39, 41, 46, 55, 58, 49, 45, 43, 48, 52, 61, 57, 50, 47, 44, 49, 53, 60, 66, 58, 51, 48, 46, 54];
      const rows = F.NO_RESULT.map(([q, n, w]) => [`<span class="an-q">${esc(q)}</span>`, `<span class="an-bar" style="width:${w}px"></span>${n.toLocaleString()}`]);
      return H.page({ title: 'ストア分析', wide: true, actions: [H.btn('過去 30 日間', { icon: 'clock' }), H.btn('比較：前期間')] },
        `<div class="an-kpis">${kpi('セッション', '1,284,310', '↑ 6%', true)}${kpi('コンバージョン率', '1.12%', '↓ 0.2pt')}${kpi('モバイルの割合', '81%', '↑ 3pt', true)}${kpi('平均注文額', '¥31,840', '↑ 2%', true)}</div>` +
        `<div class="sa-grid even">` +
        H.card('オンラインストアの検索：結果なし（上位）', H.table(['検索キーワード', ['検索回数', '']], rows, { id: 'anNoResult' }), { id: 'anSearch' }) +
        H.card('Web パフォーマンス（実際の訪問者のデータ）', `<div class="an-chart">${bars.map((h) => `<i style="height:${h}%"></i>`).join('')}</div>` +
          H.table(['指標', '値', '評価'], [['LCP（最大コンテンツの描画）', '<b>4.8 秒</b>', H.badge('要改善', 'warn')], ['CLS（レイアウトのずれ）', '<b>0.28</b>', H.badge('低速', 'crit')], ['INP（操作への応答）', '<b>190 ms</b>', H.badge('良好', 'ok')]], { id: 'anPerf' }) +
          '<p class="sa-mute" style="margin:8px 0 0">商品ページ（モバイル）がもっとも遅い</p>', { id: 'anWeb' }) +
        `</div>`);
    },
    products() {
      const rows = F.ITEMS.slice(0, 11).map((it) => [H.ck(), `<span class="sa-pn">${H.thumb(it.img || '')}<span>${esc(it.title)}</span></span>`, H.badge('アクティブ', 'ok'), `<code class="vd">${esc(it.vendor)}</code>`, yen(it.price)]);
      return H.page({ title: '商品', actions: [H.btn('エクスポート'), H.btn('インポート'), H.btn('商品を追加', { pri: true })] },
        H.card('', `<div class="sa-tabs"><span class="on">すべて</span><span>アクティブ</span><span>下書き</span><span>アーカイブ済み</span><span class="sa-mute" style="margin-left:auto">${F.TOTAL.toLocaleString()} 件の商品</span></div>` +
          H.table([['', 'ck'], '商品', 'ステータス', '販売元（vendor）', '価格'], rows, { id: 'prTable' }), { flush: true }));
    },
    metafields(list) {
      const rows = list.map((m) => [`<b>${esc(m.name)}</b><div class="sa-mute">${esc(m.key)}</div>`, esc(m.type), m.filter ? H.badge('フィルター', 'info') : '', `<span class="sa-mute">${m.count}</span>`]);
      return H.page({ title: '商品のメタフィールドの定義', back: true, actions: [H.btn('定義を追加', { pri: true, id: 'mfAdd' })] },
        H.card('', H.table(['名前', 'タイプ', '', '使用中の商品'], rows, { id: 'mfTable', rowCls: (r, i) => (list[i].isNew ? 'new' : '') }), { flush: true }));
    },
    metafieldForm(o = {}) {
      return H.page({ title: '定義を追加', back: true },
        `<div class="sa-grid"><div>` +
        H.card('', H.field('名前', o.name || '', { id: 'mfName', ph: '例：ブランド' }) +
          H.field('ネームスペースとキー', o.key || '', { id: 'mfKey', ph: 'custom.' }) +
          H.field('説明', o.desc || '', { id: 'mfDesc', ph: '任意' }) +
          H.field('タイプ', o.type || 'タイプを選択', { id: 'mfType', select: true }) +
          `<div class="sa-f"><span class="sa-ck on"></span>　1 つの値</div>`) +
        H.card('アクセス', `<div class="sa-f"><span class="sa-ck on"></span>　ストアフロント（テーマ・Storefront API）から読み取る</div><div class="sa-f" style="margin:0"><span class="sa-ck${o.filter ? ' on' : ''}" id="mfFilter"></span>　フィルターと自動コレクションの条件に使う</div>`, { id: 'mfAccess' }) +
        `</div><div>${H.card('この定義の使い方', '<p class="sa-mute">テーマでは <code>product.metafields.custom.brand</code> で参照できます。Search &amp; Discovery のフィルターのソースとして選べます。</p>')}</div></div>`);
    },
    sdFilters(list) {
      const rows = list.map((f) => [`<span class="sd-drag">⋮⋮</span>`, `<b>${esc(f.label)}</b>`, `<span class="sd-src">${esc(f.src)}</span>`, f.isNew ? H.badge('新規', 'info') : '']);
      return `<div class="sa-page"><div class="sd-head"><span class="sd-ic">${icon('search')}</span><h1>Search &amp; Discovery</h1><span class="acts" style="margin-left:auto;display:flex;gap:8px">${H.btn('フィルターを追加', { pri: true, id: 'sdAdd' })}</span></div>
        <div class="sd-tabs"><span class="on">フィルター</span><span>シノニム</span><span>レコメンド</span><span>ブースト</span><span>設定</span></div>
        ${H.card('', `<p class="sa-mute" style="padding:12px 16px 0;margin:0">ストアのコレクションと検索結果に表示するフィルター（並び順もこのとおり）</p>` + H.table(['', 'ラベル', 'ソース', ''], rows, { id: 'sdTable', rowCls: (r, i) => (list[i].isNew ? 'new' : '') }), { flush: true })}</div>`;
    },
    sdSynonyms(groups) {
      const rows = groups.map((g) => [`<b>${esc(g.terms)}</b>`, g.isNew ? H.badge('新規', 'info') : '<span class="sa-mute">2026/08/04</span>']);
      return `<div class="sa-page"><div class="sd-head"><span class="sd-ic">${icon('search')}</span><h1>Search &amp; Discovery</h1><span class="acts" style="margin-left:auto;display:flex;gap:8px">${H.btn('シノニムグループを作成', { pri: true, id: 'synAdd' })}</span></div>
        <div class="sd-tabs"><span>フィルター</span><span class="on">シノニム</span><span>レコメンド</span><span>ブースト</span><span>設定</span></div>
        ${H.card('', groups.length ? `<p class="sa-mute" style="padding:12px 16px 0;margin:0">同じグループの言葉は、ストアの検索で同じ意味として扱われます</p>` + H.table(['シノニムグループ', ''], rows, { id: 'synTable', rowCls: (r, i) => (groups[i].isNew ? 'new' : '') })
          : `<div class="sa-empty big"><div class="sa-empty-art">${icon('search')}</div><h3>シノニムグループはまだありません</h3><p>「マッキントッシュ」と「MACKINTOSH」のように、同じものを指す言葉をまとめると、検索結果に表示されるようになります。</p></div>`, { flush: true })}</div>`;
    },
    sdAdd(o = {}) {
      return H.field('ソース', o.src || 'ソースを選択', { id: 'sdSrc', select: true }) + H.field('ラベル', o.label || '', { id: 'sdLabel', ph: 'ストアに表示する名前' }) +
        `<div class="sa-f"><label>値の表示</label><div class="sa-in sel"><span class="v">商品数の多い順（件数を表示）</span></div></div>`;
    },
    locations(list) {
      return H.page({ title: 'ロケーション', back: true, actions: [H.btn('ロケーションを追加', { pri: true })] },
        H.card('', list.map((l) => `<div class="loc-row"><span class="ic">${K.ic(l.store ? 'store' : 'truck')}</span><div><b>${esc(l.name)}</b><span class="sa-mute">${esc(l.addr)}</span></div><span class="sp"></span>${l.store ? H.badge('店舗', 'info') : H.badge('EC 出荷元', '')}${l.def ? ' ' + H.badge('デフォルト', '') : ''}</div>`).join(''), { flush: true }));
    },
    pickup(list) {
      return H.page({ title: 'ローカルピックアップ（店舗受け取り・取り置き）', back: true },
        H.banner('info', '', '<p style="margin:0">ローカルピックアップを有効にしたロケーションは、商品ページの <code>variant.store_availabilities</code>（店舗在庫）とチェックアウトの「店舗で受け取る」に表示されます。</p>') +
        H.card('ロケーション', list.map((l) => `<div class="loc-row${l.warn ? ' warn' : ''}" data-loc="${esc(l.id)}"><span class="ic">${K.ic(l.store ? 'store' : 'truck')}</span><div><b>${esc(l.name)}</b><span class="sa-mute">${l.on ? esc(l.time) : '無効'}</span></div><span class="sp"></span><span class="sa-tg${l.on ? ' on' : ''}"></span></div>`).join(''), { flush: true, id: 'puCard' }));
    },
    themes(state) {
      const shot = F.THEME_SHOT;
      const live = state === 'published' ? F.NEW_THEME : 'SANYO ONLINE STORE';
      const other = state === 'published' ? 'SANYO ONLINE STORE' : F.NEW_THEME;
      return H.page({ title: 'テーマ' },
        H.card('', `<div class="th-cur"><div class="th-shot" style="background-image:url('${esc(shot)}')"></div><div><p>${H.badge('ライブテーマ', 'ok')}</p><h2 style="font-size:16px;margin:6px 0">${esc(live)}</h2><p class="sa-mute">Dawn バージョン 7.0.1</p><div style="display:flex;gap:8px;margin-top:10px">${H.btn('…')}${H.btn('カスタマイズ', { pri: true })}</div></div></div>`) +
        (state ? H.card('テーマライブラリ', `<div class="th-row" id="thNew"><span class="th-mini" style="background-image:url('${esc(shot)}')"></span><div><b>${esc(other)}</b><div class="sa-mute">${state === 'published' ? '2026/08/04 に追加' : 'Shopify CLI からアップロード · 2026/08/04'}</div></div><span class="sp"></span>${H.btn('…')}${state === 'published' ? '' : H.btn('公開', { id: 'thPublish' })}${H.btn('カスタマイズ')}</div>`, { flush: true }) : ''));
    },
  };

  /* ===================================================================== Lighthouse (Chrome DevTools)
   * The report is REAL Lighthouse output: Lighthouse's own report renderer (js/lighthouse-report.js, the code DevTools
   * uses) renders the data of a real Lighthouse run on the product page (js/lighthouse-data.js), the way DevTools does it:
   * renderReport(lhr, {disableDarkMode: true}) + .lh-devtools, in its own shadow root (DevTools widgets are shadow roots).
   * Both files come from tools/snapshots/sanyo-online-store/build-lighthouse.js. The panel around it (toolbar, start view,
   * status dialog) follows devtools-frontend (LighthouseStartView / LighthouseStatusView, their ja strings and images).
   */
  const DTI = (n) => `<img class="lhp-i" src="assets/devtools/${n}.svg" alt="">`;
  const PAGE_URL = 'http://127.0.0.1:9292/products/h5b41876';
  const radio = (label, on) => `<label class="lhp-radio"><span class="lhp-rd${on ? ' on' : ''}"></span>${label}</label>`;
  const check = (label, on) => `<label class="lhp-check"><span class="lhp-ck${on ? ' on' : ''}"></span>${label}</label>`;
  const LH = {
    root: null, // the rendered report (.lh-root) of the report on screen
    open() {
      $('#devtools').classList.add('lh-on');
      K.DevTools.panel('lighthouse', `<div class="lhp">
        <div class="lhp-tb"><span class="lhp-b" id="lhNew" title="監査を実行します…">${DTI('plus')}</span><span class="lhp-sel" id="lhSel"><span id="lhSelTx">（新しいレポート）</span>${DTI('triangle-down')}</span><span class="lhp-b off" id="lhClear" title="すべてクリア">${DTI('clear')}</span><span class="sp"></span><span class="lhp-b" title="Lighthouse の設定">${DTI('gear')}</span></div>
        <div class="lhp-body" id="lhBody"></div>
      </div>`);
      this.start();
    },
    close() { $('#devtools').classList.remove('lh-on'); },
    /** the start view (devtools-frontend LighthouseStartView) */
    start() {
      this.root = null;
      if ($('#lhSelTx')) $('#lhSelTx').textContent = '（新しいレポート）';
      $('#lhBody').innerHTML = `<form class="lhp-start">
        <header><img class="lhp-logo" src="assets/devtools/lighthouse_logo.svg" alt=""><h1>Lighthouse レポートの生成</h1><span class="lhp-run" id="lhRun">ページ読み込みを分析</span></header>
        <div class="lhp-opts">
          <div class="lhp-sec"><div class="lhp-lbl">モード <span class="lhp-more">詳細</span></div>${radio('ナビゲーション（デフォルト）', true)}${radio('測定期間')}${radio('スナップショット')}</div>
          <div class="lhp-sec"><div class="lhp-lbl">デバイス</div>${radio('モバイル', true)}${radio('パソコン')}</div>
          <div class="lhp-sec"><div class="lhp-lbl">カテゴリ</div>${check('パフォーマンス', true)}${check('ユーザー補助', true)}${check('ベスト プラクティス', true)}${check('SEO', true)}</div>
        </div></form>`;
    },
    /** the status dialog while Lighthouse runs (devtools-frontend LighthouseStatusView: phases and their ja strings) */
    async run(ms = 3400) {
      $('#lhBody').insertAdjacentHTML('beforeend', `<div class="lhp-glass"><div class="lhp-dlg"><span class="lhp-dh">127.0.0.1:9292 の監査…</span>
        <div class="lhp-prog"><i id="lhBar"></i></div><div class="lhp-st" id="lhStep"></div><span class="lhp-cancel">キャンセル</span></div></div>`);
      const phases = [
        [0, 'Lighthouse は準備中です…'],
        [0.12, '3G のモバイル デバイスにおけるパフォーマンス測定のために、Lighthouse がスロットリングによってページを読み込んでいます'],
        [0.55, 'Lighthouse がスコア計算のためにページに関する情報を収集しています'],
        [0.85, 'もう少しで完了です。Lighthouse がレポートを生成しています。'],
      ];
      for (let k = 0; k <= 24; k++) {
        const f = k / 24;
        $('#lhBar').style.width = (f < 0.55 ? f / 0.55 * 45 : f < 0.85 ? 45 + (f - 0.55) / 0.3 * 40 : 85 + (f - 0.85) / 0.15 * 12) + '%';
        $('#lhStep').textContent = phases.filter(([at]) => f >= at).pop()[1];
        await wait(ms / 24);
      }
    },
    /** the report of one state of the story: the real run + that state's audits (js/lighthouse-data.js) */
    report(key) {
      const L = window.LH_DATA, v = L.variants[key];
      const lhr = JSON.parse(JSON.stringify(L.base));
      Object.assign(lhr.audits, v.audits);
      lhr.categories.performance.score = v.perf;
      const at = window.Win11.now(); // the run ends now on the video's clock
      lhr.fetchTime = new Date(at.getTime() - 4000).toISOString();
      const host = document.createElement('div');
      host.className = 'lhp-report';
      $('#lhBody').innerHTML = '';
      $('#lhBody').appendChild(host);
      const el = window.LighthouseReport.renderReport(lhr, { disableDarkMode: true });
      el.classList.add('lh-devtools');
      host.attachShadow({ mode: 'open' }).appendChild(el);
      this.root = el;
      $('#lhSelTx').textContent = `${at.toLocaleTimeString('ja-JP')} - 127.0.0.1:9292`;
      $('#lhClear').classList.remove('off');
      return el;
    },
    /** an element of the report on screen */
    q(sel) { return this.root && this.root.querySelector(sel); },
    audit(id) { return this.q(`#${id}`); },
    scroller() { return this.q('.lh-container'); },
    /** scrolls the report so that `el` sits `offset` px below the top of the scroll area (smooth, on the video clock) */
    async scrollTo(el, offset = 70, ms = 700) {
      const c = this.scroller();
      if (!c || !el) return;
      const from = c.scrollTop;
      const to = Math.max(0, Math.min(c.scrollHeight - c.clientHeight, from + el.getBoundingClientRect().top - c.getBoundingClientRect().top - offset));
      const n = Math.max(1, Math.round(ms / 16));
      for (let k = 1; k <= n; k++) {
        const t = k / n, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        c.scrollTop = from + (to - from) * e;
        c.dispatchEvent(new Event('scroll')); // the renderer's sticky header follows the scroll
        await wait(16);
      }
    },
    url: PAGE_URL,
  };

  window.Sanyo = { V, LH, yen };
})();
