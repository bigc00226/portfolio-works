/*
 * The screens of this video on top of the shared Shopify kit (shared/kit/kit.js):
 *   MON    — the integration monitor of the middleware (a generic dashboard look-alike): webhook deliveries, jobs,
 *            the 基幹 (back-office) uploads with their results, the dead-letter queue
 *   V      — Shopify admin pages: home, inventory (物流センター), an order with its fulfilment + timeline,
 *            a customer with metafields, the customer metafield definitions (settings > カスタムデータ)
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES;
  const { $, $$, esc, icon } = D;
  const { H } = K;
  const yen = (v) => '¥' + Number(v).toLocaleString('ja-JP');

  /* ===================================================================== integration monitor */
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mon"><div class="mon">
      <aside class="mon-side">
        <div class="mon-brand"><span class="mon-mark">${K.ic('webhook')}</span><b>ec-gateway</b><span class="mon-env" id="monEnv">staging</span></div>
        <div class="mon-ni on" data-mon="webhooks">${K.ic('webhook')}Webhook 受信</div>
        <div class="mon-ni" data-mon="jobs">${K.ic('clock')}ジョブ</div>
        <div class="mon-ni" data-mon="kikan">${K.ic('building')}基幹連携</div>
        <div class="mon-ni" data-mon="dlq">${K.ic('inbox')}デッドレター<span class="mon-cnt" id="monDlq">0</span></div>
        <div class="mon-ni">${K.ic('bell')}アラート</div>
      </aside>
      <main class="mon-main">
        <header class="mon-top"><h1 id="monTitle">Webhook 受信</h1><span class="sp"></span><span class="mon-live"><i></i>ライブ</span><span class="mon-range">過去 24 時間</span></header>
        <div class="mon-kpis" id="monKpis"></div>
        <div class="mon-card" id="monCard"></div>
      </main>
    </div></div>`);

  const MON = {
    URL: 'https://ec-gateway.kanro-pocket.example/monitor',
    hooks: [], jobs: [], kikan: [],
    nav(k) {
      $$('.mon-ni').forEach((e) => e.classList.toggle('on', e.dataset.mon === k));
      const t = { webhooks: 'Webhook 受信', jobs: 'ジョブ', kikan: '基幹連携', dlq: 'デッドレター' }[k];
      if (K.Browser.tab('mon')) K.Browser.nav('mon', { title: `${t} | ec-gateway モニター`, url: `${this.URL}/${k}` });
    },
    kpis(list) { $('#monKpis').innerHTML = list.map(([l, v, tone]) => `<div class="mon-kpi ${tone || ''}"><span>${esc(l)}</span><b>${v}</b></div>`).join(''); },
    stat(code) { return `<span class="mon-st s${String(code)[0]}">${code}</span>`; },
    webhooks(o = {}) {
      this.nav('webhooks');
      $('#monTitle').textContent = 'Webhook 受信';
      const ok = this.hooks.filter((h) => h.status === 200).length, ng = this.hooks.filter((h) => h.status >= 400).length;
      this.kpis([['受信', this.hooks.length], ['成功（2xx）', ok, 'ok'], ['失敗', ng, ng ? 'ng' : ''], ['平均応答', o.avg || '—']]);
      $('#monCard').innerHTML = `<table class="mon-tbl" id="monTbl"><thead><tr><th>受信日時</th><th>トピック</th><th>注文</th><th>Event ID</th><th>応答</th><th>処理時間</th><th>メッセージ</th></tr></thead><tbody>${
        this.hooks.slice().reverse().map((h, i) => `<tr class="${h.status >= 400 ? 'ng' : ''}${i === 0 && o.flash ? ' new' : ''}${h.dup ? ' dup' : ''}"><td>${esc(h.at)}</td><td><code>orders/paid</code></td><td>${esc(h.order || '—')}</td><td><code>${esc(h.event)}</code></td><td>${this.stat(h.status)}</td><td class="num${h.slow ? ' slow' : ''}">${esc(h.ms)}</td><td>${esc(h.msg)}</td></tr>`).join('') ||
        '<tr><td colspan="7" class="mon-empty">まだ受信はありません</td></tr>'}</tbody></table>`;
    },
    kikanView(o = {}) {
      this.nav('kikan');
      $('#monTitle').textContent = '基幹連携（受注 CSV）';
      const ng = this.kikan.filter((k) => k.ng).length;
      this.kpis([['送信ファイル', this.kikan.length], ['取り込み OK', this.kikan.length - ng, 'ok'], ['取り込みエラー', ng, ng ? 'ng' : ''], ['最終送信', this.kikan.length ? this.kikan[this.kikan.length - 1].at.slice(11) : '—']]);
      $('#monCard').innerHTML = `<table class="mon-tbl" id="monTbl"><thead><tr><th>送信日時</th><th>ファイル</th><th>受注番号</th><th>明細</th><th>基幹の取り込み結果</th></tr></thead><tbody>${
        this.kikan.slice().reverse().map((k, i) => `<tr class="${k.ng ? 'ng' : ''}${i === 0 && o.flash ? ' new' : ''}"><td>${esc(k.at)}</td><td><code>${esc(k.file)}</code></td><td>${esc(k.order)}</td><td class="num">${k.lines}</td><td>${k.ng ? `<span class="mon-st s4">エラー</span> ${esc(k.ng)}` : '<span class="mon-st s2">OK</span>'}</td></tr>`).join('')}</tbody></table>
        ${o.csv ? `<div class="mon-csv"><div class="mon-csv-h">${esc(o.csvName)}<span>Shift_JIS・CRLF</span></div><pre>${esc(o.csv)}</pre></div>` : ''}`;
    },
  };

  MON.jobsView = function () {
    this.nav('jobs');
    $('#monTitle').textContent = 'ジョブ';
    this.kpis([['実行（24 時間）', 128], ['成功', 128, 'ok'], ['失敗', 0], ['次の実行', '11:30']]);
    const J = (n, s, last, res, d) => `<tr><td><b>${esc(n)}</b></td><td><code>${esc(s)}</code></td><td>${esc(last)}</td><td>${res === '—' ? '<span class="sa-mute">—</span>' : `<span class="mon-st s2">OK</span> ${esc(res)}`}</td><td class="num">${esc(d)}</td></tr>`;
    $('#monCard').innerHTML = `<table class="mon-tbl" id="monTbl"><thead><tr><th>ジョブ</th><th>スケジュール</th><th>最終実行</th><th>結果</th><th>所要時間</th></tr></thead><tbody>
      ${J('在庫取り込み（WMS → Shopify）', '*/15 * * * *', '2026/11/12 11:15', `${F.STOCK.length} SKU・更新 ${F.CHANGED.length} 件`, '0.9 s')}
      ${J('出荷実績の反映（WMS → Shopify）', '*/10 * * * *', '2026/11/12 11:20', '発送済み 3 件', '1.4 s')}
      ${J('会員ランク・ポイント（会員基盤 → Shopify）', '0 5 * * *', '2026/11/12 05:00', '1,284 件', '38.2 s')}
      ${J('受注 CSV の再送（デッドレター）', '手動', '—', '—', '—')}</tbody></table>`;
  };
  MON.dlqView = function (items) {
    this.nav('dlq');
    $('#monTitle').textContent = 'デッドレター';
    this.kpis([['未処理', items.length, items.length ? 'ng' : ''], ['今日の再実行', 0], ['今日の破棄', items.length ? 0 : 1], ['保管期間', '14 日']]);
    $('#monCard').innerHTML = `<table class="mon-tbl" id="monTbl"><thead><tr><th>発生日時</th><th>処理</th><th>対象</th><th>エラー</th><th></th></tr></thead><tbody>${
      items.map((d) => `<tr class="ng"><td>${esc(d.at)}</td><td>基幹連携（受注 CSV）</td><td>${esc(d.order)}</td><td>${esc(d.err)}</td><td><span class="mon-btn" id="dlqRetry">再実行</span> <span class="mon-btn ng" id="dlqDrop">破棄</span></td></tr>`).join('') ||
      '<tr><td colspan="5" class="mon-empty">デッドレターはありません</td></tr>'}</tbody></table>`;
  };

  /* ===================================================================== Shopify admin views */
  const thumb = (it) => H.thumb(it.image || '', { sm: true });
  const V = {
    home() {
      return H.page({ title: 'ホーム' },
        `<div class="sa-grid three">${H.card('', '<p class="sa-mute">今日の売上</p><h2 style="font-size:22px;margin:4px 0 0">¥48,620</h2>')}${H.card('', '<p class="sa-mute">注文</p><h2 style="font-size:22px;margin:4px 0 0">14</h2>')}${H.card('', '<p class="sa-mute">発送待ち</p><h2 style="font-size:22px;margin:4px 0 0">9</h2>')}</div>` +
        H.card('アプリ', `<div class="sa-file"><span class="ic" style="background:#e8eefc;color:#2b4bb3">GW</span><div><b>kanro-ec-gateway</b><div class="sa-mute">カスタムアプリ・社内システム連携（受注・在庫・出荷・会員）</div></div><span class="sp"></span>${H.badge('インストール済み', 'ok')}</div>`));
    },
    appsSettings() {
      return H.page({ title: 'アプリと販売チャネル', actions: [H.btn('アプリを開発', { id: 'appDev' })] },
        H.card('インストール済みのアプリ', `<div class="sa-file" id="appRow" style="margin-bottom:8px"><span class="ic" style="background:#e8eefc;color:#2b4bb3">GW</span><div><b>kanro-ec-gateway</b><div class="sa-mute">カスタムアプリ・社内システム連携（受注・在庫・出荷・会員）</div></div><span class="sp"></span>${H.badge('カスタム', 'info')}</div>` +
          ['オンラインストア', 'POS', 'Shopify Flow', 'Search & Discovery'].map((n) => `<div class="sa-file" style="margin-bottom:8px"><span class="ic" style="background:#f1f1f1;color:#616161">${esc(n[0])}</span><div><b>${esc(n)}</b></div></div>`).join('')));
    },
    appCreds() {
      const sec = (label, id, prefix, note) => `<div class="sa-f"><label>${esc(label)}</label><div class="sa-row" style="align-items:center"><div class="sa-in"><span class="v"><code>${prefix}••••••••••••••••••••••••••</code></span></div><span style="flex:none">${H.btn('コピー', { id, icon: 'copy' })}</span></div>${note ? `<div class="hint">${note}</div>` : ''}</div>`;
      return H.page({ title: 'kanro-ec-gateway', back: true, badge: H.badge('カスタムアプリ', 'info') },
        `<div class="sa-tabs" style="border:0;padding:0 0 12px"><span>概要</span><span>設定</span><span class="on">API 認証情報</span></div>` +
        H.card('Admin API アクセストークン', sec('アクセストークン', 'copyToken', 'shpat_', 'サーバー側の環境変数にだけ保存し、リポジトリには入れません。')) +
        H.card('API キーとシークレットキー', sec('API キー', 'copyKey', '', '') + sec('API シークレットキー', 'copySecret', 'shpss_', 'Webhook の署名（HMAC）の検証に使います。')) +
        H.card('Admin API のアクセススコープ', '<p class="sa-mute">read_orders, read_customers, write_customers, read_products, read_inventory, write_inventory, write_merchant_managed_fulfillment_orders</p>'));
    },
    locations() {
      const loc = (n, addr, badges, id) => `<div class="sa-file"${id ? ` id="${id}"` : ''} style="margin-bottom:8px"><span class="ic" style="background:#f1f1f1;color:#4a4a4a">${K.ic('location')}</span><div><b>${esc(n)}</b><div class="sa-mute">${addr}</div></div><span class="sp"></span>${badges}</div>`;
      return H.page({ title: 'ロケーション', actions: [H.btn('ロケーションを追加', { pri: true })] },
        H.card('', loc('物流センター（WMS）', '在庫連携：kanro-ec-gateway（15 分ごと）', H.badge('オンライン注文の発送元', 'info') + ' ' + H.badge('デフォルト'), 'locWms') +
          loc('本社（返品受付）', '在庫を持たない（返品・交換の受付のみ）', H.badge('在庫なし'))) +
        H.card('オンライン注文の発送元の優先順位', '<p class="sa-mute">注文は在庫のある「物流センター（WMS）」から発送されます。在庫数は WMS の在庫 CSV から自動で更新されるため、管理画面では編集しません。</p>'));
    },
    orders(shipped) {
      const rows = F.ORDERS.slice(0, 3).map((o, i) => [H.ck(), `<b>${esc(o.no)}</b>`, esc(o.at.slice(5)), '<span class="pii">山田 花子</span>'.replace('山田 花子', ['山田 花子', '佐藤 結衣', '鈴木 蓮', '高橋 葵'][i]), `<span class="num">${K.H.yen(o.total)}</span>`,
        H.badge('支払い済み', '', { dot: true, full: true }), shipped && i < 3 ? H.badge('発送済み', '', { dot: true, full: true }) : H.badge('未発送', 'att', { dot: true }), `${o.lines.reduce((s, l) => s + l.qty, 0)} 個`]);
      return H.page({ title: '注文管理', actions: [H.btn('エクスポート'), H.btn('注文を作成', { pri: true })] },
        H.card('', `<div class="sa-tabs"><span class="on">すべて</span><span>未発送</span><span>未払い</span><span>オープン</span></div>` + H.table([['', 'ck'], '注文', '日付', 'お客様', ['合計', 'num'], '支払いステータス', '発送ステータス', 'アイテム'], rows, { id: 'odTable', rowId: (r, i) => F.ORDERS[i].no }), { flush: true }));
    },
    inventory(after, o = {}) {
      const rows = F.STOCK.slice(0, 13).map((s) => {
        const q = after ? s.after : s.before;
        const ch = after && s.after !== s.before;
        return [`<span class="sa-pn">${thumb(s)}<span>${esc(s.title)}</span></span>`, `<code>${esc(s.sku)}</code>`, `<span class="num">${s.reserved}</span>`,
          `<span class="sa-inv${ch ? ' ch' : ''}${q === 0 ? ' zero' : ''}">${q.toLocaleString()}</span>`, `<span class="num">${(q + s.reserved).toLocaleString()}</span>`];
      });
      return H.page({ title: '在庫', actions: [H.btn('エクスポート'), H.btn('インポート')] },
        `<div class="sa-tools" style="padding:0 0 12px;border:0"><span class="sa-pill">${K.ic('location')}物流センター（WMS）${icon('chevron-down')}</span><span class="sp"></span><span class="sa-mute">${o.note || ''}</span></div>` +
        H.card('', H.table(['商品', 'SKU', ['引当済み', 'num'], ['販売可能', 'num'], ['手持ち', 'num']], rows, { id: 'invTable', rowId: (r, i) => F.STOCK[i].sku }), { flush: true }));
    },
    order(o, st = {}) {
      const items = o.lines.map((l) => `<div class="od-li">${thumb(l)}<div><b>${esc(l.title)}</b><div class="sa-mute">SKU: ${esc(l.sku)}</div></div><span>${yen(l.price)} × ${l.qty}</span><b>${yen(l.price * l.qty)}</b></div>`).join('');
      const tl = (st.timeline || []).map(([t, txt, cls]) => `<div class="od-ev ${cls || ''}"><span class="od-dot"></span><div>${txt}</div><span class="sa-mute">${esc(t)}</span></div>`).join('');
      return H.page({ title: o.no, back: true, badge: H.badge('支払い済み', '', { dot: true, full: true }) + ' ' + (st.shipped ? H.badge('発送済み', '', { dot: true, full: true }) : H.badge('未発送', 'att', { dot: true })), actions: [H.btn('返金'), H.btn('編集'), H.btn('その他の操作')] },
        `<p class="sa-mute" style="margin:-10px 0 14px">${esc(o.at)}・オンラインストア</p><div class="sa-grid"><div>
          ${H.card(st.shipped ? `${H.badge('発送済み', 'ok')} <span class="sa-mute" style="font-weight:400">物流センター（WMS）</span>` : `${H.badge('未発送', 'att')} <span class="sa-mute" style="font-weight:400">物流センター（WMS）</span>`, items + (st.shipped ? `<div class="od-track" id="odTrack">${K.ic('truck')}<div><b>ヤマト運輸</b><div><span class="sa-link">${esc(F.TRACK[o.no])}</span></div></div></div>` : ''), { id: 'odFul', right: st.shipped ? '<span class="sa-btn" id="odNotify">発送通知を送信</span>' : '' })}
          ${H.card('支払い済み', H.kv([['小計', `${o.lines.reduce((s, l) => s + l.qty, 0)} 個のアイテム　${yen(o.sub)}`], ['送料', yen(o.ship)], ['合計', `<b>${yen(o.total)}</b>`]]))}
          ${H.card('タイムライン', `<div class="od-tl" id="odTl">${tl}</div>`, { id: 'odTlCard' })}
        </div><div>
          ${H.card('お客様', '<p class="sa-link"><span class="pii">山田 花子</span></p><p class="sa-mute">注文 7 件</p><p class="pii">hanako@example.jp</p>')}
          ${H.card('配送先住所', '<p class="pii">〒150-0001<br>東京都渋谷区 ・・・</p>')}
          ${H.card('タグ', '<span class="sa-tag">基幹連携済み</span>')}
        </div></div>`);
    },
    customer(withMf) {
      const mf = withMf ? [['会員番号', '<span class="pii">KM-00418273</span>'], ['会員ランク', '<b>ゴールド</b>'], ['保有ポイント', '<b>1,250</b>'], ['ポイント有効期限', '2027/03/31']] : [['会員番号', '<span class="sa-mute">—</span>'], ['会員ランク', '<span class="sa-mute">—</span>'], ['保有ポイント', '<span class="sa-mute">—</span>'], ['ポイント有効期限', '<span class="sa-mute">—</span>']];
      return H.page({ title: '山田 花子', back: true, actions: [H.btn('その他の操作')] },
        `<div class="sa-grid"><div>
          ${H.card('', '<div class="cu-head"><span class="cu-av">山</span><div><b class="pii">山田 花子</b><div class="sa-mute">東京都・お客様歴 3 年</div></div><span class="sp"></span><div class="cu-num"><span class="sa-mute">合計購入額</span><b>¥28,460</b></div><div class="cu-num"><span class="sa-mute">注文</span><b>7</b></div></div>')}
          ${H.card('最新の注文', `<div class="od-li">${thumb(F.ORDERS[0].lines[0])}<div><b>#1001</b><div class="sa-mute">${esc(F.ORDERS[0].at)}</div></div><span>${H.badge('発送済み', '', { dot: true, full: true })}</span><b>${yen(F.ORDERS[0].total)}</b></div>`)}
        </div><div>
          ${H.card('お客様', '<p class="pii">hanako@example.jp</p><p class="sa-mute">メールマーケティングに登録済み</p>')}
          ${H.card('メタフィールド', H.kv(mf), { id: 'cuMf', right: '<span class="sa-link">すべて表示</span>' })}
          ${H.card('タグ', '<span class="sa-tag">会員基盤連携</span>')}
        </div></div>`);
    },
    metaDefs(rows) {
      return H.page({ title: '顧客のメタフィールドの定義', back: true, actions: [H.btn('定義を追加', { pri: true, id: 'mfAdd' })] },
        H.card('', H.table(['名前', '名前空間とキー', 'タイプ', '使用中'], rows.map((r) => [`<b>${esc(r[0])}</b>`, `<code>${esc(r[1])}</code>`, esc(r[2]), r[3] || '<span class="sa-mute">—</span>']), { id: 'mfTable' }), { flush: true }));
    },
    metaDefForm() {
      return H.page({ title: '顧客のメタフィールドの定義を追加', back: true },
        H.card('', H.field('名前', '', { id: 'mfName', ph: '例：保有ポイント' }) + H.field('名前空間とキー', '', { id: 'mfKey', ph: 'custom.key' }) + H.field('説明', '', { id: 'mfDesc', ph: '任意' }) +
          `<label class="sa-lbl">タイプ</label><div class="sa-in sel" id="mfType"><span class="v" style="color:#8a8a8a">タイプを選択</span></div>` +
          '<div class="sa-f" style="margin-top:12px"><span class="sa-ck on"></span>　Storefront API でのアクセスを許可する（テーマの Liquid から表示）</div>'));
    },
  };

  window.Kanro = { MON, V, yen };
})();
