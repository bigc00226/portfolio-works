/*
 * The Shopify admin pages of this video on top of the shared kit (shared/kit/kit.js):
 *   the soup components product（（単品）: the store's own variant names, some marked 【完売】 by hand）, locations
 *   (+ add a location, order routing), inventory per location, the products list; and the state of the real GitHub Actions
 *   pages (js/github-snapshot.js: running / finished, step icons, log lines).
 * Names / SKUs come from js/files.js (the store's catalogue); stock numbers are made up.
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, esc, icon } = D;
  const { H } = K;
  const yen = (v) => '¥' + Number(v).toLocaleString('ja-JP');
  const num = (n) => Number(n).toLocaleString('ja-JP');

  /* soup / curry pictures: the cards of the 選べる set page carry an image per SKU (…/products/004355s.jpg) */
  const IMG = {};
  try {
    const doc = new DOMParser().parseFromString(S.pages.select.pc, 'text/html');
    doc.querySelectorAll('.c-eraberu__card').forEach((c) => {
      const img = c.querySelector('img');
      const src = img && img.getAttribute('src');
      const m = (c.getAttribute('data-img') || '').match(/\/(\d{6}[sc])\.jpg/i);
      if (src && m) IMG[m[1].toUpperCase()] = src;
    });
  } catch (e) { console.warn('[demo] soup images', e); }
  (S.products || []).forEach((p) => { const v = p.variants[0]; if (v && v.sku && p.image) IMG[v.sku] = p.image; });
  const img = (sku) => IMG[sku] || '';

  const V = {
    /** the product that holds every soup of the 選べる sets as variants */
    components(o = {}) {
      const list = F.ITEMS.filter((it) => it.kind === 'S').slice(0, 13);
      const rows = list.map((it) => [H.ck(), `<span class="sa-pn">${H.thumb(img(it.sku), { sm: true })}<span>${esc(it.title.replace(/\t/g, ''))}</span></span>`, `<code>${it.sku}</code>`,
        `<span class="num${o.synced ? ' ss-num' : ''}${o.synced && !it.stock ? ' ss-zero' : ''}">${num(o.synced ? it.stock : 9999)}</span>`]);
      return H.page({ title: '（単品）', back: true, badge: H.badge('アクティブ', 'ok'), actions: [H.btn('複製'), H.btn('その他の操作')] },
        `<div class="sa-grid"><div>
          ${H.card('バリエーション', `<div class="sa-opt"><span class="sa-mute">スープ・カレー</span><span class="sa-pill">${F.ITEMS.filter((it) => it.kind !== 'A').length} 種類</span></div>` +
            H.table([['', 'ck'], 'バリエーション', 'SKU', ['在庫', 'num']], rows, { id: 'cmpTable', rowId: (r, i) => list[i].sku }), { id: 'cmpCard' })}
        </div><div>
          ${H.card('ステータス', '<div class="sa-in sel"><span class="v">アクティブ</span></div>')}
          ${H.card('商品整理', H.field('商品タイプ', 'セット内スープ') + H.field('タグ', '<span class="sa-tag">検索非表示</span><span class="sa-tag">配送希望日時指定不可</span>', { html: true }))}
          ${H.card('在庫', '<p class="sa-mute">選べるセット・定期便の中身として販売</p>' + H.kv([['在庫を追跡', 'する'], ['在庫切れのとき', '販売しない']]))}
        </div></div>`);
    },
    locations(o = {}) {
      const card = (name, code, kind, online, extra = '') => `<div class="ss-loc${o.newId === code ? ' new' : ''}" data-loc="${code}">
          <span class="ss-loc-ic">${K.ic(kind === 'store' ? 'store' : 'building')}</span>
          <div><b>${esc(name)}</b><p class="sa-mute"><span class="pii">東京都・・・区・・・</span></p></div>
          <span class="sp"></span>${extra}${online ? H.badge('オンライン注文を発送', 'ok') : H.badge('オンライン注文を発送しない')}</div>`;
      const locs = [card('冷凍倉庫（F01）', 'F01', 'wh', true, H.badge('デフォルト', 'info') + ' ')];
      if (o.ambient) locs.push(card('常温倉庫（D01）', 'D01', 'wh', true));
      locs.push(card('Soup Stock Tokyo 店舗（POS）', 'POS', 'store', !o.storeOff));
      return H.page({ title: 'ロケーション', actions: [H.btn('ロケーションを追加', { pri: true, id: 'locAdd' })] },
        `<p class="sa-mute" style="margin:-8px 0 14px">在庫を保管し、注文を発送する場所です。ロケーションごとに在庫数を管理します。</p>` +
        H.card('', `<div class="ss-locs" id="locList">${locs.join('')}</div>`, { flush: true }) +
        H.card('注文ルーティング', `<p class="sa-mute">オンライン注文を発送するロケーションの優先順位</p><ol class="ss-route" id="locRoute"><li><span class="ss-drag">⋮⋮</span>冷凍倉庫（F01）</li>${o.ambient ? '<li><span class="ss-drag">⋮⋮</span>常温倉庫（D01）</li>' : ''}</ol>`, { id: 'routeCard' }));
    },
    locationForm() {
      return H.page({ title: 'ロケーションを追加', back: true },
        H.card('', H.field('ロケーション名', '', { id: 'locName', ph: '例：常温倉庫' }) +
          `<div class="sa-row">${H.field('都道府県', '<span class="pii">・・・県</span>', { html: true, select: true })}${H.field('郵便番号', '<span class="pii">000-0000</span>', { html: true })}</div>` +
          H.field('住所', '<span class="pii">・・・市・・・ 0-0-0</span>', { html: true })) +
        H.card('注文の発送', `<div class="sa-f"><span class="sa-ck" id="locOnline"></span>　このロケーションからオンライン注文を発送する</div><p class="sa-mute">オフにすると、このロケーションの在庫はオンラインストアの販売可能数に含まれません。</p>`));
    },
    storeLocation(on) {
      return H.page({ title: 'Soup Stock Tokyo 店舗（POS）', back: true },
        H.card('注文の発送', `<div class="sa-f"><span class="sa-ck${on ? ' on' : ''}" id="posOnline"></span>　このロケーションからオンライン注文を発送する</div><p class="sa-mute">店舗の在庫は店舗での販売用です。オフにすると、オンラインストアの販売可能数に含まれません。</p>`, { id: 'posCard' }) +
        H.card('POS', '<p class="sa-mute">店舗の POS で販売した数は、このロケーションの在庫から引かれます。</p>'));
    },
    /** 商品管理 > 在庫, one location */
    inventory(loc, o = {}) {
      const list = (loc === 'F01' ? F.FROZEN : F.AMBIENT).filter((it) => o.only ? o.only(it) : true).slice(0, 13);
      const rows = list.map((it) => {
        const av = o.zero ? 0 : o.synced ? it.stock : 9999;
        const cm = o.synced ? it.committed : 0;
        return [H.ck(), `<span class="sa-pn">${H.thumb(img(it.sku), { sm: true })}<span><b>${esc(it.kind === 'A' ? it.name : '（単品）')}</b>${it.kind === 'A' ? '' : `<br><span class="sa-mute">${esc(it.name)}</span>`}</span></span>`,
          `<code>${it.sku}</code>`, `<span class="num">${num(cm)}</span>`,
          `<span class="ss-av${o.synced ? ' ss-num' : ''}${o.synced && !av ? ' ss-zero' : ''}">${num(av)}</span>`, `<span class="num">${num(av + cm)}</span>`];
      });
      const name = { F01: '冷凍倉庫（F01）', D01: '常温倉庫（D01）', POS: 'Soup Stock Tokyo 店舗（POS）' }[loc];
      return H.page({ title: '在庫', actions: [H.btn('エクスポート'), H.btn('インポート')] },
        `<div class="ss-locsel" id="invLoc">${K.ic(loc === 'POS' ? 'store' : 'building')}<b>${name}</b>${icon('chevron-down')}</div>` +
        (o.banner || '') +
        H.card('', `<div class="sa-tabs"><span class="on">すべて</span><span>在庫切れ</span><span>在庫わずか</span><span class="sp"></span><span class="sa-mute" style="margin-left:auto">${(loc === 'F01' ? F.FROZEN : F.AMBIENT).length} 件の SKU</span></div>` +
          H.table([['', 'ck'], '商品', 'SKU', ['引当済み', 'num'], ['販売可能', 'num'], ['手持ち', 'num']], rows, { id: 'invTable', rowId: (r, i) => list[i].sku }), { flush: true }));
    },
    /** 商品管理: the sets (with their pictures) and the soup components product */
    products() {
      const rows = (S.products || []).slice(0, 9).map((p) => [H.ck(), `<span class="sa-pn">${H.thumb(p.image)}<span>${esc(p.title)}</span></span>`, H.badge('アクティブ', 'ok'),
        `<span class="sa-mute">${(F.ITEMS.find((it) => it.sku === (p.variants[0] || {}).sku) || {}).stock != null ? '在庫 ' + num(F.ITEMS.find((it) => it.sku === p.variants[0].sku).stock) : '在庫を追跡していません'}</span>`, esc(p.type || '')]);
      rows.splice(3, 0, [H.ck(), `<span class="sa-pn">${H.thumb(img('004303S'))}<span>（単品）</span></span>`, H.badge('アクティブ', 'ok'), `<span class="sa-mute">在庫 ${num(F.ITEMS.filter((it) => it.kind !== 'A').reduce((a, it) => a + it.stock, 0))}（${F.ITEMS.filter((it) => it.kind !== 'A').length} バリエーション）</span>`, 'セット内スープ']);
      return H.page({ title: '商品', actions: [H.btn('エクスポート'), H.btn('インポート'), H.btn('商品を追加', { pri: true })] },
        H.card('', `<div class="sa-tabs"><span class="on">すべて</span><span>アクティブ</span><span>下書き</span><span>アーカイブ済み</span></div>` +
          H.table([['', 'ck'], '商品', 'ステータス', '在庫', '商品タイプ'], rows, { id: 'prTable', rowId: (r, i) => String(i) }), { flush: true }));
    },
    /** 設定 > 通知 > Webhook */
    webhooks(o = {}) {
      const rows = o.added ? [['注文作成', '<code>https://wms.example.jp/hooks/shopify/orders</code>', 'JSON', '2026-07']] : [];
      return H.page({ title: 'Webhook', back: true, actions: [H.btn('Webhook を作成', { pri: true, id: 'whAdd' })] },
        `<p class="sa-mute" style="margin:-8px 0 14px">ストアで起きたイベント（注文・在庫など）を、指定した URL に JSON で送ります。</p>` +
        H.card('', rows.length ? H.table(['イベント', 'URL', '形式', 'API バージョン'], rows, { id: 'whTable', rowCls: () => (o.added && !D.Clock.ff ? 'new' : '') }) : '<div class="sa-empty">Webhook はまだありません</div>', { flush: true }) +
        H.banner('info', '', '<p style="margin:0">この Webhook は署名（X-Shopify-Hmac-Sha256）付きで送られます。受け側で署名を検証してください。</p>'));
    },
    webhookForm() {
      return H.field('イベント', '', { id: 'whEvent', select: true, ph: 'イベントを選択' }) +
        `<div class="sa-row">${H.field('形式', 'JSON', { select: true })}${H.field('Webhook API のバージョン', '2026-07', { select: true })}</div>` +
        H.field('URL', '', { id: 'whUrl', ph: 'https://' });
    },
  };

  /* =====================================================================================================
   * GitHub Actions — the real pages of github.com (js/github-snapshot.js, tools/snapshots/soup-stock-tokyo/capture-github.js):
   * GitHub's own markup and stylesheets, captured logged out from public repositories and renamed to the video's
   * repository; the logged-in header is drawn by GitHub's own code. Here only what changes while the run goes on is set —
   * with the markup GitHub itself uses: its step icons, its run / job status icons, and the log lines of its log viewer
   * (`js-check-step-line CheckStep-line …`, the template in GitHub's bundle).
   * ===================================================================================================== */
  const GHS = window.GITHUB_SNAPSHOT;
  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
  const GHI = (() => {
    const leading = (html) => { const a = parse(html).querySelector('a[data-test-selector="job-link"] [data-component="ActionList.LeadingVisual"]'); return a ? a.innerHTML : ''; };
    return {
      step: GHS.pages.jobRunning.icons,                       // done / run / wait, from the running job page
      titleRun: GHS.pages.jobRunning.titleIcon, titleDone: GHS.pages.jobDone.titleIcon,
      navRun: leading(GHS.pages.jobRunning.body), navDone: leading(GHS.pages.jobDone.body),
    };
  })();
  const KEBAB = '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-kebab-horizontal"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>';
  const FRAME_CSS = 'html,body{scrollbar-width:none}::-webkit-scrollbar{display:none}*{transition:none!important}';
  /** the job's steps (.github/workflows/inventory-sync.yml) and their durations once finished */
  const STEP_TIME = ['1s', '1s', '2s', '1s', '14s', '0s', '0s', '0s'];
  /** one line of GitHub's log viewer */
  const logLine = (step, n, html, kind = 'plain') => `<div class="js-check-step-line CheckStep-line d-flex log-line-${kind}"><a class="CheckStep-line-number color-fg-muted d-inline-block text-mono text-normal flex-shrink-0" href="#step:${step}:${n}">${n}</a><span class="CheckStep-line-content d-inline-block flex-auto tmp-ml-3 js-check-line-content">${html}</span></div>`;
  /** a `run:` step's first line: the collapsed group "Run <script>" */
  const runGroup = (text) => `<details class="js-checks-log-group"><summary>${esc(text)}</summary></details>`;

  const GH = {
    frame: null, doc: null, page: null,
    url: (run, job) => `https://github.com/${GHS.nwo}/actions/runs/${run}${job ? `/job/${job}` : ''}`,
    title: `inventory-sync · ${GHS.nwo}@b7e41c9 · GitHub`,
    q(s) { return this.doc && this.doc.querySelector(s); },
    qa(s) { return this.doc ? [...this.doc.querySelectorAll(s)] : []; },
    /** shows a captured page ('jobRunning' = the job page, 'runDone' = the run's summary) */
    open(page) {
      if (!this.frame) {
        $('#ghRoot').innerHTML = '<iframe class="gh-frame" title="GitHub"></iframe>';
        this.frame = $('#ghRoot iframe');
      }
      if (this.page === page) return Promise.resolve(this.doc);
      this.page = page;
      const p = GHS.pages[page];
      const base = new URL('.', location.href).href;
      return window.Stage.hold(new Promise((resolve) => {
        this.frame.addEventListener('load', async () => {
          this.doc = this.frame.contentDocument;
          const imgs = [...this.doc.images].filter((i) => !i.complete);
          await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 4000))]);
          try { await Promise.race([this.doc.fonts.ready, new Promise((r) => setTimeout(r, 4000))]); } catch (e) { /* */ }
          resolve(this.doc);
        }, { once: true });
        this.frame.srcdoc = `<!DOCTYPE html><html ${p.htmlAttrs}><head><meta charset="utf-8"><base href="${base}"><style>${GHS.css}</style><style>${FRAME_CSS}</style></head><body ${p.bodyAttrs}>${p.body}</body></html>`;
      }));
    },
    /** title, owner's buttons, the job in the side bar — the parts the run page and the job page share */
    head(o) {
      const done = o.state === 'done';
      const t = this.q('.PageHeader-title .markdown-title');
      if (t) t.textContent = 'inventory-sync';
      const n = this.q('.PageHeader-title .color-fg-muted');
      if (n) n.textContent = `#${o.run}`;
      const lead = this.q('.PageHeader-leadingVisual');
      if (lead) lead.innerHTML = done ? GHI.titleDone : GHI.titleRun;
      const act = this.q('[data-demo="actions"]');
      if (act) act.innerHTML = `<div class="d-flex flex-items-center">${done ? '<button type="button" class="btn">Re-run all jobs</button>' : '<button type="button" class="btn">Cancel workflow</button>'}<button type="button" class="btn ml-2 px-2" aria-label="Show options">${KEBAB}</button></div>`;
      const nav = this.q('a[data-test-selector="job-link"] [data-component="ActionList.LeadingVisual"]');
      if (nav) nav.innerHTML = done ? GHI.navDone : GHI.navRun;
      // the branch the run is on
      this.qa('a.branch-name').forEach((a) => { a.textContent = 'main'; a.title = 'main'; a.href = `https://github.com/${GHS.nwo}/tree/refs/heads/main`; });
      this.qa('relative-time').forEach((r) => { r.textContent = o.ago || 'now'; });
    },
    /** the job page: o = { run, state: 'running' | 'done', current (the running step), ago, total, logs: { step: [html …] }, open: [steps] } */
    job(o) {
      const done = o.state === 'done';
      this.head(o);
      const hd = this.q('.CheckRun-log-title span.d-block.f6');
      if (hd) hd.textContent = done ? `succeeded ${o.ago} in ${o.total}` : `Started ${o.ago} ago`;
      this.qa('check-step').forEach((s, i) => {
        const st = done || i < o.current ? 'done' : i === o.current ? 'run' : 'wait';
        const sum = s.querySelector('summary');
        const icon = [...sum.querySelectorAll('svg')].find((x) => !x.classList.contains('js-check-step-loader'));
        if (icon) icon.outerHTML = GHI.step[st];
        s.setAttribute('data-conclusion', st === 'done' ? 'success' : 'null');
        const dur = sum.querySelector('.float-right');
        if (dur) dur.textContent = st === 'done' ? STEP_TIME[i] : '';
        const det = s.querySelector('details');
        const box = s.querySelector('.js-checks-log-display-container');
        const lines = (o.logs || {})[i];
        if (lines && (o.open || []).includes(i)) {
          det.setAttribute('open', '');
          box.innerHTML = lines.map((l, k) => (typeof l === 'string' ? logLine(i + 1, k + 1, l) : logLine(i + 1, k + 1, l.html, l.kind))).join('');
        } else { det.removeAttribute('open'); if (box) box.innerHTML = ''; }
      });
    },
    /** the run's summary page: o = { run, ago, total, jobTime } */
    summary(o) {
      this.head({ ...o, state: 'done' });
      const dur = this.q('a[href$="/usage"].h4');
      if (dur) dur.textContent = o.total;
      const graph = this.q('.WorkflowJob-title .flex-self-baseline');
      if (graph) graph.textContent = o.jobTime;
    },
    /** the log of the step "Shopify に同期" (index 4) */
    log: (step) => GH.q(`#check-step-${step + 1} .js-checks-log-display-container`),
    runGroup,
  };

  window.SST = { V, img, yen, num, GH };
})();
