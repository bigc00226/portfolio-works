/*
 * Timeline: syncing the warehouses' stock (WMS) into ec.soup-stock-tokyo.com —
 * design (source of truth, locations) -> locations in Shopify (+ ambient warehouse, stores not shipping online orders)
 * -> sync script (SKU match, inventorySetQuantities) -> errors (leading zeros / THROTTLED) -> schedule (GitHub Actions)
 * -> inventory per location + 売り切れ on the store -> the live store.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, wait, Cursor, Caption, Issue, Keycap, Win, screenRect } = D;
  const { clickUi, hoverUi, moveToEl } = D;
  const { Code, Term, Browser, Admin, H, Store, typeInput, readHold } = K;
  const { V } = window.SST;
  const LIVE = 'https://ec.soup-stock-tokyo.com';
  const P = F.files;
  const N = F.ITEMS.length;
  const GIFT = F.GIFT;

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '品番と区分から': { r: 'hinbantokubunkara', segs: ['品番と', '区分から'] },
    'を作る（': { r: 'wotsukuru(', segs: ['を', '作る', '（'] },
    'スープ・': { r: 'su-pu/', segs: ['スープ・'] },
    'カレー・': { r: 'kare-/', segs: ['カレー・'] },
    'セット）': { r: 'setto)', segs: ['セット）'] },
    '品番': { r: 'hinban', segs: ['品番'], predict: ['品番', '品番号'], yomi: ['ひんばん', 'ひんばんごう'] },
    '区分': { r: 'kubun', segs: ['区分'] },
    '倉庫コード': { r: 'soukoko-do', segs: ['倉庫', 'コード'] },
    '引当可能数': { r: 'hikiatekanousuu', segs: ['引当', '可能数'] },
    '照合': { r: 'shougou', segs: [{ c: ['正午', '照合', '称号'], p: 1 }], candHold: 260 },
    '件': { r: 'kenn', segs: ['件'] },
    '（見つからない': { r: '(mitsukaranai', segs: ['（', '見つからない'] },
    '件：': { r: 'kenn:', segs: ['件', '：'] },
    '）': { r: ')', raw: true },
    '件の在庫を更新しました': { r: 'kennnozaikowokoushinshimashita', segs: ['件の', '在庫を', '更新しました'] },
    'ロケーションごとの': { r: 'roke-shonngotono', segs: ['ロケーション', 'ごとの'] },
    'を、まとめて設定する': { r: 'wo,matometesetteisuru', segs: ['を、', 'まとめて', '設定する'] },
    '件ずつまとめて送る（': { r: 'kenzutsumatometeokuru(', segs: ['件ずつ', 'まとめて', '送る', '（'] },
    '件ずつ並列に送ると上限を超える）': [{ r: 'kenzutsuheiretsuniokuruto', segs: ['件ずつ', '並列に', '送ると'] }, { r: 'jougenwokoeru)', segs: ['上限を', '超える）'] }],
    '分ごと（': { r: 'funngoto(', segs: ['分ごと', '（'] },
    'の在庫更新に合わせる）': { r: 'nozaikokoushinnniawaseru)', segs: ['の', '在庫更新に', '合わせる）'] },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1150), height: y.bottom - x.top };
  };
  const termRect = (n, skip = 0) => () => {
    const ls = [...$('#vsTerm').children];
    const sel = ls.slice(Math.max(0, ls.length - n - skip), ls.length - skip);
    if (!sel.length) return null;
    const a = screenRect(sel[0]), b = screenRect(sel[sel.length - 1]);
    return { left: a.left, top: a.top, width: 1180, height: b.bottom - a.top };
  };
  async function selectLine(line) {
    const l = Code.files[Code.active].lines[line];
    const ind = l.match(/^\s*/)[0].length;
    await Code.dragSelect(line, ind, l.length);
  }
  const sample = F.MISSING.slice(0, 4).map((it) => F.wmsCode(it) + it.kind).join(', ');
  const nFrozen = F.FROZEN.length, nAmbient = F.AMBIENT.length;

  /* GitHub Actions (the real pages, js/apps.js): the scheduled runs of 15:45 (#1) and 16:00 (#2) — ids of that time.
     The log lines are what the steps of .github/workflows/inventory-sync.yml print (a `run:` step opens with its
     collapsed "Run …" group; secrets are masked as ***). */
  const { GH } = window.SST;
  const GH_RUN = { 1: 28734512096, 2: 28734981607 }, GH_JOB = { 1: 87341205583 };
  const WMS_GET = { kind: 'group', html: GH.runGroup('Run curl -fsS -H "Authorization: Bearer ***" "$WMS_EXPORT_URL" -o data/wms/stock.csv') };
  const SYNC_RUN = { kind: 'group', html: GH.runGroup('Run node src/sync-inventory.mjs data/wms/stock.csv') };
  const SYNC_OK = `<span class="ansifg-g">✔</span> ${N} 件の在庫を更新しました（冷凍倉庫 ${nFrozen} / 常温倉庫 ${nAmbient}）`;

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — design: what is the source of truth */
  scene('design', async () => {
    Caption.step(1);
    Caption.set('選べる「スープとカレー」セット：お客さまが中身のスープ・カレーを 1 つずつ選ぶ');
    await Browser.newTab('st');
    await Browser.typeUrl('ec.soup-stock-tokyo.com/products/106001a');
    Browser.nav('st', { title: `選べる「スープとカレー」10個セット/ギフトボックス｜${S.title}`, url: `${LIVE}/products/106001a`, page: 'store', fav: 'store' });
    Browser.loading('st', true);
    await Store.load('select');
    Browser.loading('st', false);
    await wait(700);
    const sel = Store.doc.querySelector('.c-eraberu');
    if (sel) {
      await Store.scrollToEl(sel, 60, 1600);
      const cards = Store.doc.querySelectorAll('.c-eraberu__card');
      if (cards[1]) await hoverUi(cards[1].querySelector('[data-eraberu-step="1"]'), { kind: 'hand', hold: 900 });
      Cursor.kind('arrow');
      Caption.set('中身のスープ 1 つ 1 つが在庫の単位：倉庫で切れたスープは選べないようにしたい');
      await Store.scroll(Store.yOf(sel, 0) + 640, 1800);
      await wait(1200);
    }
    Caption.set('いまの運用：中身のスープ（商品「（単品）」）の在庫は 9,999 のまま。完売したら商品名に【完売】と手で書いている');
    await Browser.clickTab('adm');
    await wait(500);
    const soldRow = $(`#cmpTable tr[data-row="${(F.ITEMS.find((it) => it.kind === 'S' && it.soldOut) || F.ITEMS[0]).sku}"] .sa-pn span`);
    await hoverUi(soldRow, { hold: 900 });
    Issue.show(() => {
      const rs = $$('#cmpTable tbody tr').filter((tr) => /【完売】/.test(tr.textContent));
      if (!rs.length) return null;
      const a = screenRect(rs[0]), b = screenRect(rs[rs.length - 1]);
      return { left: a.left, top: a.top, width: a.width, height: b.bottom - a.top };
    }, '完売を手で管理');
    await wait(2400);
    Issue.hide();
    Caption.set('倉庫の在庫と連動していないので、倉庫で切れたスープも注文できてしまう（売り越し）');
    await hoverUi($('#cmpTable tbody tr:nth-child(2) td:last-child'), { hold: 1600 });
    await Win.switchTo('code', { state: 'max' });
    Caption.set('設計：EC で売る在庫の正は倉庫管理システム（WMS）の「引当可能数」。Shopify はそれに合わせる');
    await Code.openFile('docs/inventory-sync.md', { top: 0 });
    await hoverUi(Code.lineEl(3), { ax: 0.35, hold: 1500 });
    Caption.set('ロケーションは冷凍倉庫・常温倉庫。店舗の在庫は店舗販売用で、EC の販売可能数には含めない');
    await hoverUi(Code.lineEl(10), { ax: 0.3, hold: 1200 });
    await hoverUi(Code.lineEl(12), { ax: 0.3, hold: 1200 });
    Caption.set('15 分ごとに WMS の在庫 CSV を取得 → SKU で照合 → inventorySetQuantities でロケーションごとに設定');
    await hoverUi(Code.lineEl(16), { ax: 0.3, hold: 1300 });
    await hoverUi(Code.lineEl(19), { ax: 0.3, hold: 1600 });
  });

  /* 2 — locations */
  scene('locations', async () => {
    Caption.step(2);
    Caption.set('Shopify のロケーション：冷凍倉庫に加えて、フリーズドライ・レトルトを出荷する常温倉庫を追加');
    await Win.switchTo('browser');
    await Admin.openSettings('locations', V.locations(), { title: 'ロケーション', path: 'locations' });
    await hoverUi('#locList .ss-loc[data-loc="F01"] b', { hold: 900 });
    await clickUi('#locAdd', { after: 80 });
    Browser.loading(Admin.tab, true); await wait(350); Browser.loading(Admin.tab, false);
    Admin.settings('locations', V.locationForm(), { title: 'ロケーションを追加', path: 'locations/new' });
    await wait(300);
    await typeInput('#locName', [{ r: 'jouonsouko(', segs: ['常温', '倉庫', '（'] }, { direct: 'D01' }, { r: ')', raw: true }], { kps: 11 });
    await clickUi('#locOnline', { after: 60 });
    $('#locOnline').classList.add('on');
    Admin.saveBar(true);
    await wait(400);
    await Admin.saveFromBar('ロケーションを追加しました');
    Admin.settings('locations', V.locations({ ambient: true, newId: 'D01' }), { title: 'ロケーション', path: 'locations' });
    await wait(700);
    Caption.set('店舗（POS）の在庫は店舗で売る分：このロケーションからはオンライン注文を発送しない');
    await clickUi('#locList .ss-loc[data-loc="POS"] b', { after: 60 });
    Browser.loading(Admin.tab, true); await wait(320); Browser.loading(Admin.tab, false);
    Admin.settings('locations', V.storeLocation(true), { title: 'Soup Stock Tokyo 店舗（POS）', path: 'locations/71839629499' });
    await wait(500);
    await clickUi('#posOnline', { after: 60 });
    $('#posOnline').classList.remove('on');
    Admin.saveBar(true);
    await wait(400);
    await Admin.saveFromBar('ロケーションを保存しました');
    // the location id for the sync script: the last number of the admin URL
    Caption.set('同期スクリプトの設定に、常温倉庫のロケーション ID（管理画面の URL の末尾の数字）をコピー');
    await clickUi('#brOmni', { kind: 'text', after: 60 });
    $('#brOmni').classList.add('focus');
    $('#brUrl').innerHTML = `<span style="background:#c6dafc">${esc($('#brUrl').textContent)}</span>`;
    await Keycap.show(['Ctrl', 'C'], 650);
    await wait(300);
    $('#brOmni').classList.remove('focus');
    Browser.showUrl(Browser.tab(Admin.tab).url);
    await Win.switchTo('code', { state: 'max' });
    await Code.openFile('src/locations.mjs', { top: 0 });
    const d1 = Code.find("Location/',");
    await Code.clickAt(d1.line, d1.col + 'Location/'.length);
    await Code.type([{ paste: '71839629499' }]);
    await Code.save();
    await wait(400);
    await Win.switchTo('browser');
    Admin.settings('locations', V.locations({ ambient: true, storeOff: true }), { title: 'ロケーション', path: 'locations' });
    await wait(500);
    Caption.set('注文ルーティング：冷凍の商品は冷凍倉庫、常温の商品は常温倉庫から発送');
    await Admin.scrollToEl('#routeCard', 60, 700, '#saSetScroll');
    await hoverUi('#locRoute li:nth-child(1)', { hold: 900 });
    await hoverUi('#locRoute li:nth-child(2)', { hold: 900 });
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    await wait(200);
  });

  /* 3 — the sync script (+ leading zeros) */
  scene('script', async () => {
    Caption.step(3);
    Caption.set('WMS の在庫 CSV：倉庫コード（F01 冷凍 / D01 常温）・品番・区分・商品名・引当可能数');
    await Win.switchTo('code');
    await Code.openFile('data/wms/stock_20261107.csv', { top: 0 });
    await hoverUi(Code.lineEl(0), { ax: 0.25, hold: 1300 });
    await hoverUi(Code.lineEl(2), { ax: 0.2, hold: 1000 });
    Caption.set('Admin GraphQL API：在庫は inventorySetQuantities で、ロケーションごとの available をまとめて設定できる');
    await Code.openFile('src/queries.mjs', { top: 0 });
    await hoverUi(Code.lineEl(2), { ax: 0.35, hold: 1100 });
    {
      const t = Code.find('// TODO').line;
      await selectLine(t);
      await Code.type(code(F.SET_QUANTITIES), { kps: 22 });
      await Code.save();
      if (Code.text() !== F.QUERIES_FINAL) { console.warn('[demo] queries.mjs differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat('queries'); }
    }
    Caption.set('同期スクリプト：Shopify の全バリエーションを取得して、SKU → 在庫アイテム ID の対応表を作る');
    await Code.openFile('src/sync-inventory.mjs', { top: 0 });
    await hoverUi(Code.lineEl(11), { ax: 0.4, hold: 1300 });
    await hoverUi(Code.lineEl(16), { ax: 0.35, hold: 1100 });
    Caption.set('WMS の各行を SKU で照合して、ロケーションごとの available（販売可能数）の配列にする');
    const todo = Code.find('// TODO').line;
    await Code.reveal(todo + 4, 600);
    await selectLine(todo);
    await Code.type(code(F.SYNC_MATCH), { kps: 22 });
    await Code.save();
    // dry run
    Caption.set('まずは照合だけ（--dry-run）で確認');
    await Keycap.show(['Ctrl', '@'], 600);
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await wait(300);
    await Term.run('npm run sync:dry', ['', '<span class="tdim">&gt; sst-inventory-sync@ sync:dry</span>', '<span class="tdim">&gt; node src/sync-inventory.mjs --dry-run</span>', '', 600,
      `照合 ${N - F.MISSING.length} / ${N} 件（見つからない SKU ${F.MISSING.length} 件：${sample}）`]);
    Caption.issue('照合エラー', `${F.MISSING.length} 件の SKU が見つからない：WMS の品番は数値なので先頭の 0 が落ちている（${F.wmsCode(F.MISSING[0])}${F.MISSING[0].kind} ⇔ ${F.MISSING[0].sku}）`);
    Issue.show(termRect(1, 1), `見つからない SKU ${F.MISSING.length} 件`);
    await wait(3000);
    Issue.hide();
    // the CSV row and the store's SKU
    await Code.openFile('data/wms/stock_20261107.csv');
    const row = Code.find(`,${F.wmsCode(F.MISSING[0])},`);
    Issue.show(linesRect(row.line, row.line), `品番 ${F.wmsCode(F.MISSING[0])}（Shopify の SKU は ${F.MISSING[0].sku}）`, { below: true });
    await wait(2400);
    Issue.hide();
    Caption.set('品番を 6 桁にゼロ埋めしてから区分をつける');
    await Code.openFile('src/sync-inventory.mjs');
    const p = Code.find("${r['品番']}");
    await Code.clickAt(p.line, p.col + "${r['品番']".length);
    await Code.type([{ direct: ".padStart(6, '0')" }], { kps: 14 });
    await Code.save();
    Code.lineCls[p.line] = 'good'; Code.render();
    await Term.run('npm run sync:dry', ['', '<span class="tdim">&gt; node src/sync-inventory.mjs --dry-run</span>', '', 500, `照合 ${N} / ${N} 件`]);
    Caption.fixed(`padStart(6, '0') で 004355S の形に：${N} 件すべて照合できた`);
    Issue.ok(termRect(1, 1), `照合 ${N} / ${N} 件`);
    await readHold(2400);
    Issue.hide();
    delete Code.lineCls[p.line];
    Code.render();
  });

  /* 4 — sync for real: THROTTLED, then batches + retry */
  scene('errors', async () => {
    Caption.step(4);
    Caption.set('本番ストアに同期する');
    await Term.run('npm run sync', ['', '<span class="tdim">&gt; node src/sync-inventory.mjs</span>', '', 500, `照合 ${N} / ${N} 件`, 700,
      '<span class="tr">file:///C:/dev/sst-inventory-sync/src/shopify.mjs:16</span>',
      '<span class="tr">  if (json.errors) throw new ShopifyError(json.errors, json.extensions?.cost);</span>',
      '<span class="tr">                          ^</span>',
      '<span class="tr">ShopifyError: Throttled</span>',
      '<span class="tdim">    at gql (file:///C:/dev/sst-inventory-sync/src/shopify.mjs:16:31)</span>',
      `<span class="tdim">  code: 'THROTTLED', cost: { requestedQueryCost: 10, throttleStatus: { maximumAvailable: 1000, currentlyAvailable: 4, restoreRate: 50 } }</span>`,
    ], { gap: 70 });
    Caption.issue('API エラー', `THROTTLED：1 件ずつのミューテーションを ${N} 件まとめて並列に送り、API のコストの上限（1,000）を超えた`);
    Issue.show(termRect(6, 1), 'THROTTLED（レート制限）');
    await wait(3200);
    Issue.hide();
    Caption.set('src/shopify.mjs の withRetry：THROTTLED のときは、コストが回復するまでの秒数を計算して待ってから再試行');
    await Code.openFile('src/shopify.mjs', { top: 0 });
    await Code.scrollTo(15, 700);
    await hoverUi(Code.lineEl(Code.find('const wait = s ?').line), { ax: 0.45, hold: 1600 });
    await hoverUi(Code.lineEl(Code.find('console.warn(').line), { ax: 0.4, hold: 1100 });
    await Code.openFile('src/sync-inventory.mjs');
    Caption.set('inventorySetQuantities は 1 回で複数件を設定できる：100 件ずつまとめ、withRetry で包む');
    const l = Code.find(F.CALL_BAD).line;
    await Code.reveal(l, 600);
    Issue.show(linesRect(l, l), '1 件ずつ・すべて並列', { below: true });
    await wait(1600);
    Issue.hide();
    await selectLine(l);
    await Code.type(code(F.CALL_OK), { kps: 22 });
    await Code.save();
    if (Code.text() !== F.SYNC_FINAL) { console.warn('[demo] sync-inventory.mjs differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat('sync'); }
    for (let i = 0; i < 4; i++) Code.lineCls[l + i] = 'good';
    Code.render();
    await Term.run('npm run sync', ['', '<span class="tdim">&gt; node src/sync-inventory.mjs</span>', '', 500, `照合 ${N} / ${N} 件`,
      async () => Term.progress('  在庫を更新中 ', N, 1800, { done: `  在庫を更新中 <span class="tdim">（100 件ずつ ${Math.ceil(N / 100)} 回）</span>` }),
      `<span class="tg">✔</span> ${N} 件の在庫を更新しました <span class="tdim">（冷凍倉庫 ${nFrozen} / 常温倉庫 ${nAmbient}）</span>`]);
    Caption.fixed(`100 件ずつまとめて送るように直した：${N} 件を ${Math.ceil(N / 100)} 回の API 呼び出しで更新`);
    Issue.ok(termRect(2, 1), `${N} 件を更新`);
    await readHold(2600);
    Issue.hide();
    Code.lineCls = {}; Code.render();
  });

  /* 5 — every 15 minutes (GitHub Actions) */
  scene('schedule', async () => {
    Caption.step(5);
    Caption.set('定期実行：GitHub Actions で 15 分ごとに WMS の CSV を取得して同期する');
    await Code.openFile('.github/workflows/inventory-sync.yml', { top: 0 });
    await Code.newLineAfter(Code.find('workflow_dispatch:').line);
    await Code.type(code(F.CRON, { after: '  workflow_dispatch:' }), { kps: 20 });
    await Code.save();
    await hoverUi(Code.lineEl(Code.find('SHOPIFY_ADMIN_TOKEN: ${{').line), { ax: 0.35, hold: 1100 });
    await Term.run([{ direct: 'git commit -am "' }, { r: 'zaikodoukiwo', segs: ['在庫', '同期を'] }, { direct: ' 15 ' }, { r: 'funngotonijikkou', segs: ['分ごとに', '実行'] }, { direct: '"' }],
      ['[main 7c41e2a] 在庫同期を 15 分ごとに実行', ' 4 files changed, 58 insertions(+), 3 deletions(-)'], { kps: 16 });
    await Term.run('git push', ['To github.com:soupstocktokyo/sst-inventory-sync.git', '   1d08b3f..7c41e2a  main -&gt; main']);
    // orders reach the WMS right away (between two syncs nothing is sold twice)
    await Win.switchTo('browser');
    await Browser.clickTab('adm');
    Caption.set('15 分の間に売り越さないように、注文が入ったらすぐ WMS に引き当てる（Webhook：注文作成）');
    await Admin.openSettings('notifications', V.webhooks(), { title: 'Webhook', path: 'notifications/webhooks' });
    await clickUi('#whAdd', { after: 80 });
    $('#saSet').appendChild($('#saOv'));   // the modal covers the settings too
    Admin.modal(V.webhookForm(), { title: 'Webhook を作成', foot: H.btn('キャンセル') + H.btn('保存', { pri: true, id: 'whSave' }) });
    await wait(400);
    await K.choose('#whEvent', ['カートの作成', '在庫レベルの更新', '注文作成', '注文の支払い', '注文のキャンセル', '商品の更新'], '注文作成', { look: 700 });
    await typeInput('#whUrl', 'https://wms.example.jp/hooks/shopify/orders', { kps: 16 });
    await clickUi('#whSave', { after: 60 });
    await Admin.busy('#whSave', 700);
    Admin.closeModal();
    $('.sa-main').appendChild($('#saOv'));
    Admin.settings('notifications', V.webhooks({ added: true }), { title: 'Webhook', path: 'notifications/webhooks' });
    Admin.toast('Webhook を作成しました');
    await hoverUi('#whTable tbody tr td:nth-child(2)', { hold: 1300 });
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    // the run of 15:45 on GitHub (the real job page: js/github-snapshot.js), watched live
    Browser.addTab({ id: 'gh', title: GH.title, url: GH.url(GH_RUN[1], GH_JOB[1]), page: 'gh', fav: 'github' }, { anim: true });
    Browser.loading('gh', true);
    await GH.open('jobRunning');
    Browser.loading('gh', false);
    GH.job({ run: 1, current: 3, ago: '9s', logs: { 3: [WMS_GET] }, open: [3] });
    Caption.set('15:45 の定期実行：WMS の CSV を取得 → Shopify に同期');
    await wait(1400);
    GH.job({ run: 1, current: 4, ago: '12s', logs: { 4: [SYNC_RUN, `照合 ${N} / ${N} 件`] }, open: [4] });
    await wait(1600);
    GH.job({ run: 1, state: 'done', ago: 'now', total: '21s', logs: { 4: [SYNC_RUN, `照合 ${N} / ${N} 件`, SYNC_OK] }, open: [4] });
    await hoverUi(GH.log(4), { ax: 0.3, hold: 1800 });
  });

  /* 6 — the result in the admin and on the store */
  scene('check', async () => {
    Caption.step(6);
    Caption.set('管理画面：中身のスープの在庫が 9,999 から倉庫の実数に。【完売】と書いていたスープは 0');
    await Browser.clickTab('adm');
    await Admin.go('products', V.products(), { title: '商品', path: '/products' });
    await hoverUi('#prTable tbody tr:nth-child(4) td:nth-child(4)', { hold: 900 });
    await Admin.open($('#prTable tbody tr:nth-child(4) .sa-pn span'), V.components({ synced: true }), { title: '（単品）', path: '/products/7461237948603' });
    const z = $$('#cmpTable tbody tr').find((tr) => tr.querySelector('.ss-zero'));
    if (z) {
      await hoverUi(z.querySelector('.ss-zero'), { hold: 400 });
      Issue.ok(z, '在庫 0 → 選べるセットで選べない');
      await readHold(2400);
      Issue.hide();
    }
    Caption.set('在庫ページ：ロケーションごとの販売可能数が、WMS の引当可能数と同じになっている');
    await Admin.go('products/inventory', V.inventory('F01', { synced: true }), { title: '在庫', path: '/products/inventory?location_id=71839563963' });
    await hoverUi('#invTable tbody tr:nth-child(1) .ss-av', { hold: 1000 });
    await hoverUi('#invTable tbody tr:nth-child(3) .ss-av', { hold: 800 });
    // ambient warehouse: the stock went to the wrong location
    Caption.set('常温倉庫：フリーズドライ・レトルトのセット');
    const LOCS = ['冷凍倉庫（F01）', '常温倉庫（D01）', 'Soup Stock Tokyo 店舗（POS）'];
    const showLoc = async (label, loc, o, path) => {
      await K.choose('#invLoc', LOCS, label, { look: 500 });
      Browser.loading(Admin.tab, true); await wait(300); Browser.loading(Admin.tab, false);
      Admin.show(V.inventory(loc, o), { title: '在庫', path: '/products/inventory?location_id=' + path });
    };
    await showLoc('常温倉庫（D01）', 'D01', { zero: true }, '71839596731');
    Caption.issue('ロケーション違い', '常温倉庫の販売可能数がすべて 0：同期した常温の在庫が、別のロケーションに入っている');
    Issue.show($('#invTable tbody'), '常温倉庫が 0 のまま');
    await moveToEl($('#invTable tbody tr:nth-child(2) .ss-av'));
    await wait(2600);
    Issue.hide();
    await showLoc('Soup Stock Tokyo 店舗（POS）', 'POS', { synced: true }, '71839629499');
    Caption.issue('ロケーション違い', '常温の在庫が店舗（POS）に入っていた：D01 に店舗のロケーション ID を貼っていた');
    Issue.show($('#invTable tbody'), '店舗（POS）に入っている');
    await wait(1800);
    Issue.show(() => screenRect($('#brOmni')), '店舗のロケーション ID 71839629499', { below: true });
    await wait(2000);
    Issue.hide();
    // fix the id (the ambient warehouse's id is in its admin URL: …/locations/71839596731)
    Caption.set('locations.mjs の D01 を、常温倉庫のロケーション ID（…596731）に直して、もう一度同期');
    await Win.switchTo('code');
    await Code.openFile('src/locations.mjs', { top: 0 });
    const li = Code.find('71839629499');
    Issue.show(linesRect(li.line, li.line), '店舗（POS）の ID', { below: true });
    await wait(1400);
    Issue.hide();
    await Code.overwrite('71839629499', [{ direct: '71839596731' }], { kps: 12 });
    await Code.save();
    D.KeyStrip.hideNow();
    Code.lineCls[li.line] = 'good'; Code.render();
    await Code.panel(true);
    await Term.run('npm run sync', ['', '<span class="tdim">&gt; node src/sync-inventory.mjs</span>', '', 400, `照合 ${N} / ${N} 件`,
      async () => Term.progress('  在庫を更新中 ', N, 1200, { done: `  在庫を更新中 <span class="tdim">（100 件ずつ ${Math.ceil(N / 100)} 回）</span>` }),
      `<span class="tg">✔</span> ${N} 件の在庫を更新しました <span class="tdim">（冷凍倉庫 ${nFrozen} / 常温倉庫 ${nAmbient}）</span>`]);
    await wait(600);
    delete Code.lineCls[li.line]; Code.render();
    await Code.panel(false);
    await Win.switchTo('browser');
    await showLoc('常温倉庫（D01）', 'D01', { synced: true }, '71839596731');
    Caption.fixed('常温倉庫の ID に直して再同期：フリーズドライ・レトルトの在庫が常温倉庫に入った');
    Issue.ok($('#invTable tbody'), '常温倉庫の在庫');
    await readHold(2400);
    Issue.hide();
    await hoverUi('#invTable tbody tr:nth-child(1) .sa-pn span', { hold: 800 });
    // the gift set that is out of stock at the warehouse
    Caption.set(`ストアでは：冷凍倉庫で在庫 0 の「${GIFT.name}」が自動で「売り切れ」に`);
    await Browser.clickTab('st');
    await Browser.typeUrl('ec.soup-stock-tokyo.com/collections/soup');
    Browser.nav('st', { title: '冷凍スープ｜Soup Stock Tokyo オンラインショップ', url: LIVE + '/collections/soup' });
    Browser.loading('st', true);
    await Store.load('soup', { states: ['giftSoldOut'] });
    Browser.loading('st', false);
    await wait(500);
    const card = () => [...Store.doc.querySelectorAll('.ProductItem')].find((e) => e.querySelector(`a[href*="/products/${GIFT.handle}"]`));
    if (card()) {
      await Store.scrollToEl(card(), 240, 1800);
      Issue.ok(card(), '売り切れ');
      await readHold(2200);
      Issue.hide();
      await clickUi(card().querySelector('a[href*="/products/"]'), { kind: 'hand', after: 60 });
      Cursor.kind('arrow');
    }
    Browser.nav('st', { title: `${GIFT.name}｜${S.title}`, url: `${LIVE}/products/${GIFT.handle}` });
    Browser.loading('st', true);
    await Store.load('gift', { states: ['giftSoldOutBtn'] });
    Browser.loading('st', false);
    const btn = () => Store.doc.querySelector('.ProductForm__AddToCart');
    if (btn()) {
      await Store.scrollToEl(btn(), 420, 1000);
      Issue.ok(btn(), '売り切れ（カートに入れられない）');
      await readHold(2400);
      Issue.hide();
    }
    // restock
    Caption.set('WMS で入荷（引当可能数 120）→ 次の定期実行（16:00）で販売が再開する');
    await wait(900);
    window.Win11.skipTo('16:01');   // a cut in the recording: the run of 16:00 has just finished
    await Browser.clickTab('gh');
    // the run of 16:00 (its summary page)
    Browser.nav('gh', { url: GH.url(GH_RUN[2]), title: GH.title });
    Browser.loading('gh', true);
    await GH.open('runDone');
    GH.summary({ run: 2, ago: '1 minute ago', total: '23s', jobTime: '19s' });
    Browser.loading('gh', false);
    await hoverUi(GH.q('.PageHeader-title'), { hold: 1200 });
    await Browser.clickTab('st');
    await Browser.reload(async () => { await Store.load('gift'); }, { key: 'F5' });
    if (btn()) {
      await Store.scrollToEl(btn(), 420, 0);
      Caption.fixed('在庫が戻り「カートに追加する」に。倉庫の在庫だけ直せば、ストアの表示は自動で変わる');
      Issue.ok(btn(), 'カートに追加する');
      await readHold(2400);
      Issue.hide();
    }
  });

  /* 7 — the live store */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のストア');
    await Browser.typeUrl('ec.soup-stock-tokyo.com');
    Browser.nav('st', { title: S.title, url: LIVE + '/' });
    Browser.loading('st', true);
    await Store.load('home');
    Browser.loading('st', false);
    await wait(1400);
    const h = Store.doc.documentElement.scrollHeight;
    await Store.scroll(h * 0.2, 2200);
    await wait(1100);
    await Store.scroll(h * 0.4, 2200);
    await wait(1100);
    Caption.set('選べる「スープとカレー」セット：中身のスープ・カレーも倉庫の在庫と連動');
    Browser.nav('st', { title: `選べる「スープとカレー」10個セット/ギフトボックス｜${S.title}`, url: `${LIVE}/products/106001a` });
    Browser.loading('st', true);
    await Store.load('select');
    Browser.loading('st', false);
    await wait(700);
    const d = Store.doc;
    const cur = d.querySelector('#panel-curry') || d.querySelector('.c-eraberu');
    if (cur) {
      await Store.scrollToEl(cur, 80, 2400);
      await wait(1000);
      const cards = cur.querySelectorAll('.c-eraberu__card');
      if (cards[2]) await hoverUi(cards[2].querySelector('.c-eraberu__thumb'), { kind: 'hand', hold: 900 });
      Cursor.kind('arrow');
    }
    await Store.scroll(0, 2400);
    Caption.set('倉庫・店舗と EC の在庫連携が完了');
    await wait(3600);
    Caption.hide();
  });

  /* ============================================================ storefront states */
  const ST = window.StoreFrame.STATES;
  const giftCard = (doc) => [...doc.querySelectorAll('.ProductItem')].find((e) => e.querySelector(`a[href*="/products/${GIFT.handle}"]`));
  ST.giftSoldOut = {
    on(doc) {
      const c = giftCard(doc);
      if (!c) return;
      // the card's own label row (冷凍 / ギフト / 送料込) gets the theme's sold-out label
      const row = c.querySelector('.label-usage') || c.querySelector('.c-label-wrapper') || c;
      const lb = doc.createElement('span');
      lb.className = 'ProductItem__Label Heading Text--subdued label-usage_item';
      lb.dataset.demoAdded = '1';
      lb.style.cssText = 'background:#4a4a4a;color:#fff;border-color:#4a4a4a';
      lb.textContent = '売り切れ';
      row.prepend(lb);
      const img = c.querySelector('.ProductItem__ImageWrapper');
      if (img) { img.dataset.demoOp = '1'; img.style.opacity = '.55'; }
    },
    off(doc) { doc.querySelectorAll('[data-demo-added]').forEach((e) => e.remove()); doc.querySelectorAll('[data-demo-op]').forEach((e) => { e.style.opacity = ''; }); },
  };
  ST.giftSoldOutBtn = {
    on(doc) {
      const b = doc.querySelector('.ProductForm__AddToCart');
      if (!b) return;
      b.dataset.demoHtml = b.innerHTML;
      b.innerHTML = '<span>売り切れ</span>';
      b.setAttribute('disabled', '');
      b.classList.add('Button--secondary');
      b.classList.remove('Button--primary');
    },
    off(doc) { const b = doc.querySelector('.ProductForm__AddToCart'); if (b && b.dataset.demoHtml) { b.innerHTML = b.dataset.demoHtml; b.removeAttribute('disabled'); b.classList.remove('Button--secondary'); b.classList.add('Button--primary'); } },
  };

  /* ============================================================ setup */
  $('#brContent').insertAdjacentHTML('afterbegin', '<div class="br-page" data-page="gh"><div id="ghRoot"></div></div>');
  K.run({
    scenes: SCENES,
    warm: ['home', 'select', 'gift', 'soup'],
    fontText: JSON.stringify(JA),
    async prepare() {
      const tree = [
        ['.github', 'dir', 1], ['.github/workflows', 'dir', 1], ['.github/workflows/inventory-sync.yml'],
        ['data', 'dir', 1], ['data/wms', 'dir', 1], ['data/wms/README.md'], ['data/wms/stock_20261107.csv'],
        ['docs', 'dir', 1], ['docs/inventory-sync.md'],
        ['src', 'dir', 1], ['src/lib', 'dir', 0], ['src/lib/csv.mjs'], ['src/locations.mjs'], ['src/queries.mjs'], ['src/shopify.mjs'], ['src/sync-inventory.mjs'],
        ['.env.example'], ['.gitignore'], ['package.json'], ['README.md'],
      ];
      Code.init({ ...P, 'data/wms/stock_20261107.csv': F.STOCK_CSV }, tree);
      Code.files['data/wms/stock_20261107.csv'].enc = 'UTF-8 with BOM';
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'adm', title: Admin.title('（単品）'), url: Admin.url('/products/7461237948603'), page: 'admin', fav: 'admin' });
      Admin.show(V.components(), { nav: 'products', title: '（単品）', path: '/products/7461237948603' });
      K.hydrate();
      // every typed block must have its IME entries (fails here, before playing, instead of mid-video)
      [F.SET_QUANTITIES, F.SYNC_MATCH, F.CALL_OK, F.CRON].forEach((l) => code(l));
      // and the segments must make the run they stand for
      Object.entries(JA).forEach(([run, c]) => {
        const out = (Array.isArray(c) ? c : [c]).map((x) => (x.raw ? D.romajiToKana(x.r).kana : x.segs.map((g) => (typeof g === 'string' ? g : g.c[g.p || 0])).join(''))).join('');
        if (out !== run) console.warn('[demo] IME entry does not make its run:', run, '→', out);
      });
    },
  });
  window.__JA = JA;
})();
