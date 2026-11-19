/*
 * Timeline: connecting the Kanro POCKeT store (Shopify) with the company's systems through a small middleware —
 * design -> orders (webhook orders/paid + HMAC) -> stock (WMS CSV -> inventorySetQuantities) -> shipments
 * (fulfillmentCreate + tracking, customer notification) -> members (customer metafields) -> monitoring / retries
 * (idempotent webhook handling) -> the live store.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect } = D;
  const { clickUi, hoverUi, moveToEl } = D;
  const { Code, Term, Browser, Admin, H, Store, typeInput, readHold } = K;
  const { MON, V } = window.Kanro;
  const P = F.files;
  const LIVE = 'https://kanro.jp';
  const HOOK_URL = 'https://ec-gateway.kanro-pocket.example/webhooks/orders-paid';
  const O1 = F.ORDERS[0];

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '在庫を更新しました': { r: 'zaikowokoushinshimashita', segs: ['在庫を', '更新しました'], predict: ['在庫', '在庫数'], yomi: ['ざいこ', 'ざいこすう'] },
    '保有ポイント': { r: 'hoyuupointo', segs: ['保有', 'ポイント'], predict: ['保有', '保有ポイント'], yomi: ['ほゆう', 'ほゆうぽいんと'] },
    '再送された': { r: 'saisousareta', segs: [{ c: ['再送', '催促', '再走'], p: 0 }, 'された'] },
    '（同じ': { r: '(onaji', segs: ['（同じ'] },
    '）は': { r: ')ha', segs: ['）は'] },
    '回だけ処理する': { r: 'kaidakeshorisuru', segs: ['回だけ', '処理する'] },
    '基幹は': { r: 'kikanha', segs: ['基幹は'] },
    '明細': { r: 'meisai', segs: ['明細'] },
    '行。受注日時は日本時間、送料は': [{ r: 'gyou.juchuunichijiha', segs: ['行。', '受注', '日時は'] }, { r: 'nihonjikan,souryouha', segs: ['日本時間、', '送料は'] }],
    '行目にだけ入れる': { r: 'gyoumenidakeireru', segs: ['行目に', 'だけ', '入れる'] },
    '送り状番号': { r: 'okurijoubangou', segs: ['送り状', '番号'], predict: ['送り状', '送り状番号'], yomi: ['おくりじょう', 'おくりじょうばんごう'] },
    'テスト中はお客様にメールを送らない': [{ r: 'tesutochuuha', segs: ['テスト中は'] }, { r: 'okyakusamanime-ruwookuranai', segs: ['お客様に', 'メールを', '送らない'] }],
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);

  /* ------------------------------------------------------------- helpers */
  const now = () => window.Win11.fmt.stamp();
  const ago = (s) => { const d = new Date(window.Win11.now().getTime() - s * 1000); return window.Win11.fmt.stamp(d); };
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
  const rowsRect = (sel) => () => {
    const els = $$(sel);
    if (!els.length) return null;
    const a = screenRect(els[0]), b = screenRect(els[els.length - 1]);
    return { left: Math.min(a.left, b.left), top: a.top, width: Math.max(a.width, b.width), height: b.bottom - a.top };
  };
  async function selectLine(line) {
    const l = Code.files[Code.active].lines[line];
    await Code.dragSelect(line, l.match(/^\s*/)[0].length, l.length);
  }
  async function selectWhole(line) { await Code.dragSelect(line, 0, Code.files[Code.active].lines[line].length); }
  /** new lines typed after the line containing `needle` (indentation like the editor) */
  async function typeAfter(needle, lines, o = {}) {
    const p = Code.find(needle);
    if (!p) throw new Error('not found: ' + needle);
    await Code.reveal(p.line, 500);
    await Code.newLineAfter(p.line);
    await Code.type(code(lines, { after: Code.files[Code.active].lines[p.line] }), { kps: o.kps || 22 });
  }
  /** ↑ in the terminal: the last command again */
  async function again(cmd, out, o = {}) {
    Term.render(`<span class="tw2">${esc(cmd)}</span><span class="caret"></span>`);
    await Keycap.show(['↑'], 500);
    await wait(300);
    KeyStrip.special('Enter');
    KeyStrip.idleHide(700);
    Term.lines.push(esc(Term.prompt) + `<span class="tw2">${esc(cmd)}</span>`);
    Term.render(null);
    await Term.out(out, o);
    Term.render('<span class="caret"></span>');
  }
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const TRIGGER = `shopify app webhook trigger --topic orders/paid --api-version 2026-07 --delivery-method http --address ${HOOK_URL}`;
  const DEPLOY_OUT = (v) => ['', '<span class="tdim">&gt; kanro-ec-gateway@1.4.0 deploy</span>', '<span class="tdim">&gt; node scripts/deploy.js</span>', 300,
    async () => Term.spin('ステージングにデプロイしています…', 1300, `<span class="tg">✔</span> ステージングにデプロイしました <span class="tdim">(ec-gateway.kanro-pocket.example・リビジョン ${v})</span>`)];

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the design */
  scene('design', async () => {
    Caption.step(1);
    Caption.set('Kanro POCKeT（Shopify）と、社内の基幹・物流 WMS・会員基盤を中継サーバー「ec-gateway」でつなぐ');
    await hoverUi(Code.lineEl(4), { ax: 0.3, hold: 1400 });
    await hoverUi(Code.lineEl(5), { ax: 0.42, hold: 1300 });
    await hoverUi(Code.lineEl(6), { ax: 0.42, hold: 1300 });
    await hoverUi(Code.lineEl(8), { ax: 0.42, hold: 1300 });
    Caption.set('連携は 4 つ：受注は Webhook で受け取り、在庫・出荷・会員は定期ジョブから Admin API（GraphQL）で書き込む');
    await Code.scrollTo(6, 800);
    Issue.show(linesRect(12, 17), '連携の一覧');
    await wait(2600);
    Issue.hide();
    Caption.set('決めごと：商品は SKU（基幹の 5 桁の商品コード）で紐づけ、Webhook には 5 秒以内に応答する');
    await hoverUi(Code.lineEl(21), { ax: 0.35, hold: 1500 });
    await hoverUi(Code.lineEl(22), { ax: 0.35, hold: 1500 });
    // the app configuration
    Caption.set('連携用のカスタムアプリ：必要な権限（スコープ）と、受け取る Webhook（orders/paid）を設定');
    await Code.openFile('shopify.app.toml', { top: 0 });
    await hoverUi(Code.lineEl(7), { ax: 0.4, hold: 1600 });
    const last = Code.files['shopify.app.toml'].lines.length - 1;
    await Code.newLineAfter(last);
    await Code.type(code(F.TOML_ADD, { after: Code.files['shopify.app.toml'].lines[last] }), { kps: 20 });
    await Code.save();
    check('shopify.app.toml', [P['shopify.app.toml'], ...F.TOML_ADD].join('\n'), 'toml');
    // the app credentials -> .env (ignored by git)
    Caption.set('アプリの API 認証情報（アクセストークン・API シークレット）は .env に保存（.gitignore 済み・リポジトリには入れない）');
    await Win.switchTo('browser');
    await Admin.openSettings('apps', V.appsSettings(), { title: 'アプリと販売チャネル', path: 'apps' });
    await clickUi('#appRow', { after: 60 });
    Browser.loading('adm', true); await wait(400); Browser.loading('adm', false);
    Admin.settings('apps', V.appCreds(), { title: 'kanro-ec-gateway', path: 'apps/development/kanro-ec-gateway/api_credentials' });
    await wait(500);
    await hoverUi('#copySecret', { hold: 500 });
    await clickUi('#copySecret', { after: 60 });
    Admin.toast('クリップボードにコピーしました');
    await wait(600);
    await Win.switchTo('code');
    await Code.newFile('.env');
    delete Code.status['.env']; Code.renderTree(); Code.gitBadge();
    await Code.type(code(['SHOPIFY_SHOP=kanroec.myshopify.com', 'SHOPIFY_API_SECRET=']), { kps: 20 });
    await Code.paste('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', { flash: false });
    Code.lineCls[1] = 'secret'; Code.render();
    await Win.switchTo('browser');
    await clickUi('#copyToken', { after: 60 });
    Admin.toast('クリップボードにコピーしました');
    await wait(500);
    await Win.switchTo('code');
    await Code.type(code(['SHOPIFY_ADMIN_TOKEN='], { after: Code.files['.env'].lines[1] }), { kps: 20 });
    await Code.paste('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', { flash: false });
    Code.lineCls[2] = 'secret'; Code.render();
    await Code.save({ noStatus: true });
    await wait(600);
    await Win.switchTo('browser');
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    await wait(300);
  });

  /* 2 — orders: webhook + signature check (mistake 1) */
  scene('orders', async () => {
    Caption.step(2);
    Caption.set('受注連携：支払いが完了した注文を Webhook で受け取り、基幹システムの受注 CSV にして送る');
    await Win.switchTo('code');
    await Code.openFile('src/lib/kikan.js', { top: 0 });
    await wait(600);
    Caption.set('注文を基幹の受注 CSV の形（1 明細 1 行・商品コード＝SKU・日本時間）に変換する');
    const kt = Code.find('// TODO').line;
    await selectLine(kt);
    await Code.type(code(F.KIKAN_FN), { kps: 24 });
    await Code.save();
    check('src/lib/kikan.js', F.KIKAN_FINAL, 'kikan');
    Caption.set('Webhook のルート：署名を検証してから、変換した受注 CSV を基幹の SFTP に置く');
    await Code.openFile('src/routes/webhooks.js', { top: 0 });
    await hoverUi(Code.lineEl(8), { ax: 0.45, hold: 1500 });
    await hoverUi(Code.lineEl(14), { ax: 0.3, hold: 1100 });
    Caption.set('最初に署名（X-Shopify-Hmac-Sha256）を検証して、本当に Shopify から届いたものか確かめる');
    await Code.openFile('src/webhooks/verify.js', { top: 0 });
    await Code.clickAt(3, 0);
    await Code.type(code(F.VERIFY_FN(F.VERIFY_BAD)), { kps: 22 });
    await Code.save();
    await Keycap.show(['Ctrl', '@'], 600);
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await wait(300);
    Caption.set('アプリの設定（Webhook の登録）をリリースし、中継サーバーをステージングにデプロイ');
    await Term.run('shopify app deploy', [
      async () => Term.spin('Releasing a new app version…', 1500, '<span class="tg">✔</span> New version released to users.'),
      '  kanro-ec-gateway-12 <span class="tdim">[webhooks: orders/paid → /webhooks/orders-paid]</span>',
    ]);
    await Term.run('npm run deploy', DEPLOY_OUT(41));
    Caption.set('テスト用の Webhook（orders/paid のサンプル）を送ってみる');
    await Term.run(TRIGGER, [500, '<span class="tg">✔</span> Success! Webhook has been enqueued for delivery.'], { kps: 26 });
    await wait(500);
    await Win.switchTo('browser');
    await Browser.clickTab('mon');
    MON.hooks.push({ at: now(), order: '#9999（サンプル）', event: '1f0e8c3a…', status: 401, ms: '12 ms', msg: 'HMAC mismatch' });
    MON.webhooks({ flash: true });
    await wait(500);
    Caption.issue('署名エラー', 'テストの Webhook が 401：署名（HMAC）が一致しない');
    Issue.show(() => screenRect($('#monTbl tbody tr')), '401 HMAC mismatch');
    await moveToEl($('#monTbl tbody tr td:last-child'));
    await wait(2600);
    Issue.hide();
    await Win.switchTo('code');
    Caption.set('原因：express.json() で解析済みの本文を JSON.stringify し直して検証していた → 届いたバイト列と一致しない');
    const vl = Code.find(F.VERIFY_BAD).line;
    Issue.show(linesRect(vl, vl), '本文を作り直している', { below: true });
    await wait(2600);
    Issue.hide();
    await Code.overwrite(F.VERIFY_BAD, 'req.body', { kps: 18 });
    await Code.save();
    check('src/webhooks/verify.js', F.VERIFY_FINAL, 'verify');
    await Code.openFile('src/routes/webhooks.js');
    Caption.set('Webhook のルートだけ express.raw() にして、届いた本文そのもの（Buffer）で検証する');
    await Code.overwrite('express.json()', "express.raw({ type: 'application/json' })", { kps: 22 });
    const ol = Code.find('const order = req.body;').line;
    await Code.overwrite('req.body;', 'JSON.parse(req.body);', { from: ol, kps: 20 });
    await Code.save();
    check('src/routes/webhooks.js', F.ROUTE({ raw: true }).join('\n'), 'route');
    Code.lineCls[8] = 'good'; Code.lineCls[ol] = 'good'; Code.render();
    await again('npm run deploy', DEPLOY_OUT(42));
    await again(TRIGGER, [500, '<span class="tg">✔</span> Success! Webhook has been enqueued for delivery.']);
    delete Code.lineCls[8]; delete Code.lineCls[ol]; Code.render();
    await Win.switchTo('browser');
    MON.hooks.push({ at: now(), order: '#9999（サンプル）', event: '7c41d2b9…', status: 200, ms: '1.8 s', msg: '基幹に受注 #9999 を送信' });
    MON.webhooks({ flash: true });
    Caption.fixed('元の本文で検証するように直して 200：基幹への受注 CSV も送られた');
    Issue.ok(() => screenRect($('#monTbl tbody tr')), '200 OK');
    await readHold(2400);
    Issue.hide();
    // a test order -> the 基幹 CSV
    Caption.set('テスト注文 #1001：基幹の受注 CSV（Shift_JIS・1 明細 1 行、商品コード＝SKU）を確認');
    O1.at = now().slice(0, 16);
    MON.hooks.push({ at: now(), order: '#1001', event: '3a9be071…', status: 200, ms: '1.6 s', msg: '基幹に受注 #1001 を送信' });
    MON.webhooks({ flash: true });
    await wait(900);
    await clickUi($('.mon-ni[data-mon="kikan"]'), { after: 80 });
    MON.kikan.push({ at: now(), file: 'KP1001.csv', order: '#1001', lines: O1.lines.length });
    MON.kikanView({ flash: true, csv: F.KIKAN(O1).map((l) => l.replace(/2026\/10\/06 \d+:\d+:12/, O1.at + ':12')).join('\n'), csvName: '/inbox/juchu/KP1001.csv' });
    await wait(500);
    await hoverUi('.mon-csv pre', { ax: 0.4, hold: 4200 });
  });

  /* 3 — stock: WMS CSV -> inventorySetQuantities */
  scene('stock', async () => {
    Caption.step(3);
    Caption.set('在庫：物流 WMS が 15 分ごとに置く在庫 CSV から、Shopify の在庫数（物流センター）を更新する');
    await Browser.clickTab('adm');
    await Admin.go('products/inventory', V.inventory(false, { note: '最終更新：11:00（手動）' }), { title: '在庫', path: '/products/inventory?location_id=71093321886' });
    await hoverUi($('#invTable tbody tr:nth-child(2) .sa-inv'), { hold: 1300 });
    Caption.set('反映先は「物流センター（WMS）」ロケーション：オンライン注文の発送元で、在庫数は管理画面では編集しない');
    await Admin.openSettings('locations', V.locations(), { title: 'ロケーション', path: 'locations' });
    await hoverUi('#locWms', { hold: 2200 });
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    await wait(300);
    await Win.switchTo('code');
    Code.files['data/wms/zaiko_20261112_1115.csv'].enc = 'Shift JIS';
    await Code.openFile('data/wms/zaiko_20261112_1115.csv', { top: 0 });
    await hoverUi(Code.lineEl(0), { ax: 0.25, hold: 1400 });
    await hoverUi(Code.lineEl(2), { ax: 0.3, hold: 1000 });
    await Code.openFile('src/jobs/import-stock.js', { top: 0 });
    Caption.set('変わった SKU だけを、inventorySetQuantities で 250 件ずつまとめて設定する');
    await hoverUi(Code.lineEl(9), { ax: 0.5, hold: 1500 });
    const todo = Code.find('// TODO').line;
    await selectLine(todo);
    await Code.type(code(F.STOCK_LOOP), { kps: 24 });
    await Code.save();
    check('src/jobs/import-stock.js', [...F.STOCK_HEAD, ...F.STOCK_LOOP].join('\n'), 'stock');
    await Term.run('npm run job:stock', ['', '<span class="tdim">&gt; kanro-ec-gateway@1.4.0 job:stock</span>', '<span class="tdim">&gt; node src/jobs/import-stock.js</span>', '', 500,
      `WMS 在庫 ${F.STOCK.length} SKU（変更あり ${F.CHANGED.length} 件）`, 700, '在庫を更新しました']);
    await wait(500);
    await Win.switchTo('browser');
    await Browser.reload(async () => { await wait(300); Admin.show(V.inventory(true, { note: `最終更新：${now().slice(11, 16)}（WMS 連携）` }), { title: '在庫', path: '/products/inventory?location_id=71093321886' }); });
    Caption.fixed(`変更のあった ${F.CHANGED.length} SKU の販売可能数が WMS の在庫に揃った（0 になった商品はストアで売り切れ表示）`);
    Issue.ok(rowsRect('#invTable .sa-inv.ch'), '更新された在庫数');
    await readHold(2600);
    Issue.hide();
    const zero = $('#invTable .sa-inv.zero');
    if (zero) await hoverUi(zero, { hold: 1600 });
  });

  /* 4 — shipments: fulfillmentCreate (mistake 2: no shipping email) */
  scene('ship', async () => {
    Caption.step(4);
    Caption.set('出荷：WMS の出荷実績（送り状番号）を受けて、注文を「発送済み」にする（fulfillmentCreate）');
    await Win.switchTo('code');
    Code.files['data/wms/shukka_20261112_1130.csv'].enc = 'Shift JIS';
    await Code.openFile('data/wms/shukka_20261112_1130.csv', { top: 0 });
    await hoverUi(Code.lineEl(1), { ax: 0.3, hold: 1300 });
    await Code.openFile('src/jobs/import-shipments.js', { top: 0 });
    await hoverUi(Code.lineEl(11), { ax: 0.45, hold: 1300 });
    const stl = Code.find('// TODO').line;
    await selectWhole(stl);
    await Code.type(code(F.SHIP_F('bad')), { kps: 24 });
    await Code.save();
    check('src/jobs/import-shipments.js', F.SHIP('bad').join('\n'), 'ship1');
    await Term.run('npm run job:ship', ['', '<span class="tdim">&gt; node src/jobs/import-shipments.js</span>', '', 400,
      ...F.ORDERS.slice(0, 3).map((o) => `${o.no} を発送済みに（ヤマト運輸 ${F.TRACK[o.no]}）`)], { gap: 260 });
    await Win.switchTo('browser');
    const shippedAt = now().slice(11, 16);
    const TL = [[shippedAt, `ヤマト運輸 の送り状番号 ${F.TRACK[O1.no]} で ${O1.lines.reduce((s, l) => s + l.qty, 0)} 個のアイテムを発送済みにしました。<span class="sa-mute">（kanro-ec-gateway）</span>`],
      [O1.at.slice(11), '基幹システムに受注を送信しました。<span class="sa-mute">（kanro-ec-gateway）</span>'], [O1.at.slice(11), `${K.H.yen(O1.total)} の支払いが処理されました。`], [O1.at.slice(11), 'お客様がこの注文を確定しました。']];
    await Admin.go('orders', V.orders(true), { title: '注文管理', path: '/orders' });
    Caption.set('注文管理：出荷実績のあった 3 件が「発送済み」になった');
    await hoverUi($('#odTable tbody tr:nth-child(2) td:nth-child(7)'), { hold: 1200 });
    await Admin.open($('#odTable tbody tr:nth-child(1) td:nth-child(2)'), V.order(O1, { shipped: true, timeline: TL }), { title: `注文 ${O1.no}`, path: '/orders/6481930518640' });
    await hoverUi('#odTrack', { hold: 2200 });
    await Admin.scrollToEl('#odTlCard', 120, 800);
    Caption.issue('通知漏れ', '発送済みになったのに、お客様に「発送完了メール」が送られていない（タイムラインに記録がない）');
    Issue.show($('#odTlCard'), '発送完了メールがない');
    await wait(2800);
    Issue.hide();
    await Win.switchTo('code');
    Caption.set('原因：テスト中に入れた notifyCustomer: false（メールを送らない）のままにしていた');
    const nl = Code.find('notifyCustomer: false').line;
    Issue.show(linesRect(nl - 1, nl), 'notifyCustomer: false のまま', { below: true });
    await wait(2400);
    Issue.hide();
    await Code.clickAt(nl - 1, 6);
    await Keycap.show(['Ctrl', 'Shift', 'K'], 600);
    Code.files[Code.active].lines.splice(nl - 1, 1);
    Code.files[Code.active].dirty = true; Code.renderTabs();
    Code.setCaret(nl - 1, 4);
    await wait(300);
    await Code.overwrite('notifyCustomer: false', 'true', { offset: 16, kps: 14 });
    await Code.save();
    check('src/jobs/import-shipments.js', F.SHIP('ok').join('\n'), 'ship');
    await again('npm run deploy', DEPLOY_OUT(43));
    await Win.switchTo('browser');
    Caption.set('これからの出荷はメールが自動で届く。発送済みにした 3 件は、管理画面から発送通知を送る');
    await Admin.scroll(0, 600);
    await clickUi('#odNotify', { after: 60 });
    Admin.modal(`<p>お客様に「発送完了」のメール（送り状番号と配送状況のリンク付き）を送信します。</p>${H.kv([['宛先', '<span class="pii">hanako@example.jp</span>'], ['運送会社', 'ヤマト運輸'], ['送り状番号', F.TRACK[O1.no]]])}`, { title: '発送通知を送信', foot: H.btn('キャンセル') + H.btn('通知を送信', { pri: true, id: 'odSend' }) });
    await wait(700);
    await clickUi('#odSend', { after: 60 });
    await Admin.busy('#odSend', 700);
    Admin.closeModal();
    Admin.show(V.order(O1, { shipped: true, timeline: [[now().slice(11, 16), '発送完了メールを <span class="pii">山田 花子</span> さん（<span class="pii">hanako@example.jp</span>）に送信しました。', 'mail new'], ...TL] }), { title: `注文 ${O1.no}`, path: '/orders/6481930518640' });
    Admin.toast('通知を送信しました');
    await Admin.scrollToEl('#odTlCard', 120, 700);
    Caption.fixed('notifyCustomer: true に直してデプロイ：発送完了メールの送信がタイムラインに記録された');
    Issue.ok(() => screenRect($('#odTl .od-ev')), '発送完了メールを送信');
    await readHold(2400);
    Issue.hide();
  });

  /* 5 — members: customer metafields */
  scene('members', async () => {
    Caption.step(5);
    Caption.set('会員：会員基盤の会員ランク・ポイントを、Shopify の顧客メタフィールドに毎朝同期する');
    const defs = [['会員番号', 'custom.member_id', '1 行のテキスト', '18,412'], ['会員ランク', 'custom.member_rank', '1 行のテキスト', '18,412'], ['ポイント有効期限', 'custom.points_expire', '日付', '9,861']];
    await Admin.openSettings('custom-data', V.metaDefs(defs), { title: '顧客のメタフィールドの定義', path: 'custom_data/customer/metafields' });
    await hoverUi('#mfTable tbody tr:nth-child(2) code', { hold: 1200 });
    Caption.set('ポイント数を入れる「保有ポイント」（整数）の定義を追加');
    await clickUi('#mfAdd', { after: 80 });
    Admin.settings('custom-data', V.metaDefForm(), { title: '顧客のメタフィールドの定義を追加', path: 'custom_data/customer/metafields/new' });
    await wait(400);
    await typeInput('#mfName', [{ r: 'hoyuupointo', segs: ['保有', 'ポイント'], predict: ['保有', '保有ポイント'], yomi: ['ほゆう', 'ほゆうぽいんと'] }], { kps: 11 });
    await typeInput('#mfKey', 'custom.points', { kps: 14 });
    await K.choose('#mfType', ['1 行のテキスト', '複数行のテキスト', '整数', '小数', '日付', 'True または false'], '整数', { look: 700 });
    $('#mfType .v').style.color = '';
    Admin.saveBar(true);
    await wait(400);
    await Admin.saveFromBar('定義を追加しました');
    Admin.settings('custom-data', V.metaDefs([...defs.slice(0, 2), ['保有ポイント', 'custom.points', '整数', ''], defs[2]]), { title: '顧客のメタフィールドの定義', path: 'custom_data/customer/metafields' });
    $('#mfTable tbody tr:nth-child(3)').classList.add('new');
    await wait(1200);
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    // the sync job
    await Win.switchTo('code');
    await Code.openFile('src/jobs/sync-members.js', { top: 0 });
    Caption.set('会員基盤の前日からの差分を、metafieldsSet で 25 件ずつ書き込む（会員ランク・保有ポイント）');
    const mtl = Code.find('// TODO').line;
    await selectWhole(mtl);
    await Code.type(code(F.MEMBER_PUSH), { kps: 26 });
    await Code.save();
    check('src/jobs/sync-members.js', P['src/jobs/sync-members.js'].replace('  // TODO: 会員ランク・保有ポイント', F.MEMBER_PUSH.join('\n')), 'members');
    await hoverUi(Code.lineEl(12), { ax: 0.3, hold: 1100 });
    await Term.run('npm run job:members', ['', '<span class="tdim">&gt; node src/jobs/sync-members.js</span>', '',
      async () => Term.spin('会員基盤 API から差分を取得しています…', 1400, '<span class="tdim">会員基盤：差分 1,284 件</span>'),
      async () => Term.progress('metafieldsSet ', 103, 1600, { done: '<span class="tg">✔</span> metafieldsSet 103 / 103' }),
      '会員 1,284 件のランク・ポイントを更新しました（metafieldsSet 103 回）']);
    Caption.set('マイページのテーマでは customer.metafields.custom.points で表示する');
    await Code.openFile('theme/snippets/member-status.liquid', { top: 0 });
    await hoverUi(Code.lineEl(4), { ax: 0.45, hold: 1700 });
    await Win.switchTo('browser');
    await Admin.go('customers', V.customer(true), { title: '顧客', path: '/customers/7310984405136' });
    $('.sa-ph h1').innerHTML = '<span class="pii">山田 花子</span>';
    await Admin.scrollToEl('#cuMf', 120, 600);
    Caption.set('顧客の詳細：会員ランク「ゴールド」・保有ポイント 1,250 が会員基盤から入った');
    Issue.ok($('#cuMf'), '会員基盤と同期');
    await readHold(3000);
    Issue.hide();
  });

  /* 6 — monitoring + retries (mistake 3: duplicate order in 基幹) */
  scene('monitor', async () => {
    Caption.step(6);
    Caption.set('監視：連携モニターで Webhook・ジョブ・基幹への送信結果を確認する');
    await Browser.clickTab('mon');
    const O4 = F.ORDERS[3];
    MON.hooks.push({ at: ago(140), order: O4.no, event: '5d8e21fa…', status: 200, ms: '6.4 s', msg: `基幹に受注 ${O4.no} を送信`, slow: true });
    MON.hooks.push({ at: ago(134), order: O4.no, event: '5d8e21fa…', status: 200, ms: '1.3 s', msg: `基幹に受注 ${O4.no} を送信`, dup: true });
    MON.kikan.push({ at: ago(139), file: 'KP1004.csv', order: O4.no, lines: O4.lines.length });
    MON.kikan.push({ at: ago(133), file: 'KP1004.csv', order: O4.no, lines: O4.lines.length, ng: '受注番号 KP1004 が重複しています' });
    $('#monDlq').textContent = '1'; $('#monDlq').classList.add('ng');
    MON.kikanView();
    await wait(600);
    Caption.issue('二重取り込み', `${O4.no} が基幹に 2 回送られ、2 回目が「受注番号の重複」エラー`);
    Issue.show(() => screenRect($('#monTbl tbody tr.ng')), '受注番号の重複');
    await moveToEl($('#monTbl tbody tr.ng td:last-child'));
    await wait(2600);
    Issue.hide();
    await clickUi($('.mon-ni[data-mon="webhooks"]'), { after: 80 });
    MON.webhooks({ avg: '1.6 s' });
    await wait(400);
    Caption.set('原因：基幹への送信（6.4 秒）を待ってから応答 → 5 秒を超えたので Shopify が同じ Webhook を再送した');
    Issue.show(rowsRect('#monTbl tbody tr:nth-child(-n+2)'), '同じ Event ID が 2 回');
    await moveToEl($('#monTbl tbody tr:nth-child(2) td.slow'));
    await wait(3600);
    Issue.hide();
    await Win.switchTo('code');
    await Code.openFile('src/routes/webhooks.js', { top: 0 });
    Caption.set('同じ X-Shopify-Event-Id は 1 回だけ処理し、200 は先に返してから基幹に送る');
    await typeAfter("import { log } from '../lib/monitor.js';", ["import { processed } from '../lib/processed.js';"]);
    await typeAfter('const order = JSON.parse(req.body);', ['  // 再送された Webhook（同じ X-Shopify-Event-Id）は 1 回だけ処理する', "  if (await processed.seen(req.get('X-Shopify-Event-Id'))) return res.sendStatus(200);"], { kps: 22 });
    // move "res.sendStatus(200);" above the upload (Alt+↑ twice)
    let rl = Code.files[Code.active].lines.lastIndexOf('  res.sendStatus(200);');
    await Code.clickAt(rl, 22);
    for (let k = 0; k < 2; k++) {
      await Keycap.show(['Alt', '↑'], 450);
      const L = Code.files[Code.active].lines;
      [L[rl - 1], L[rl]] = [L[rl], L[rl - 1]];
      rl--;
      Code.files[Code.active].dirty = true;
      Code.setCaret(rl, 22);
      await wait(250);
    }
    Code.renderTabs();
    await Code.save();
    check('src/routes/webhooks.js', F.ROUTE({ raw: true, dedupe: true }).join('\n'), 'dedupe');
    Code.lineCls[rl] = 'good'; Code.lineCls[rl - 1] = 'good'; Code.render();
    await again('npm run deploy', DEPLOY_OUT(44));
    Caption.set('保存しておいたテスト用の Webhook を、同じ内容で 2 回送って確かめる');
    await Term.run('npm run replay -- data/webhooks/orders-paid-test.json --times 2', ['', '<span class="tdim">&gt; node scripts/replay.js data/webhooks/orders-paid-test.json --times 2</span>', 400, '1 200', 300, '2 200'], { kps: 24 });
    delete Code.lineCls[rl]; delete Code.lineCls[rl - 1]; Code.render();
    await Win.switchTo('browser');
    MON.hooks.push({ at: now(), order: '#9999（テスト）', event: 'c62a90d7…', status: 200, ms: '0.1 s', msg: '基幹に受注 #9999 を送信' });
    MON.hooks.push({ at: now(), order: '#9999（テスト）', event: 'c62a90d7…', status: 200, ms: '0.0 s', msg: '再送のため処理をスキップ（処理済み）' });
    MON.webhooks({ flash: true, avg: '0.1 s' });
    Caption.fixed('2 回目はスキップされ、基幹への送信は 1 回だけ。応答も 0.1 秒に（基幹の重複分はデッドレターから取り消し）');
    Issue.ok(rowsRect('#monTbl tbody tr:nth-child(-n+2)'), '1 回だけ処理');
    await readHold(2800);
    Issue.hide();
    Caption.set('定期ジョブ（在庫 15 分ごと・出荷 10 分ごと・会員 毎朝 5:00）の実行結果も同じモニターで確認');
    await clickUi($('.mon-ni[data-mon="jobs"]'), { after: 80 });
    MON.jobsView();
    await wait(400);
    await hoverUi($('#monTbl tbody tr:nth-child(1) td:nth-child(4)'), { hold: 1300 });
    await hoverUi($('#monTbl tbody tr:nth-child(3) td:nth-child(2)'), { hold: 1100 });
    Caption.set(`基幹で重複エラーになった ${O4.no} の 2 回目は、デッドレターから破棄する`);
    await clickUi($('.mon-ni[data-mon="dlq"]'), { after: 80 });
    MON.dlqView([{ at: ago(300), order: `${O4.no}（KP1004.csv・2 回目）`, err: '受注番号 KP1004 が重複しています' }]);
    await wait(700);
    await clickUi('#dlqDrop', { after: 80 });
    MON.dlqView([]);
    $('#monDlq').textContent = '0'; $('#monDlq').classList.remove('ng');
    await wait(1400);
  });

  /* 7 — the live store */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のストア（kanro.jp）で確認');
    await Browser.newTab('live');
    await Browser.typeUrl('kanro.jp');
    Browser.nav('live', { url: LIVE + '/', title: S.title, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('home');
    Browser.loading('live', false);
    await wait(1600);
    const d = Store.doc;
    const y = (el, off = 120) => (el ? Store.yOf(el, off) : 0);
    const head = (re) => [...d.querySelectorAll('h2, h3, .section-header__title, .h2')].find((h) => re.test(h.textContent));
    await Store.scroll(y(head(/新商品/), 140), 1800);
    await wait(900);
    const label = [...d.querySelectorAll('span, div')].find((e) => e.children.length === 0 && /^\s*オンライン限定\s*$/.test(e.textContent) && e.getBoundingClientRect().top > 0);
    if (label) { Caption.set('「オンライン限定」「数量限定」などのラベルは、商品のタグ（_label_…）から表示'); await hoverUi(label, { kind: 'arrow', hold: 1800 }); }
    await wait(400);
    await Store.scroll(y(head(/ヒトツブカンロ/), 140), 1800);
    await wait(1100);
    await Store.scroll(y(head(/オンライン限定/), 140), 1800);
    await wait(1100);
    await Store.scroll(y(head(/キャンペーン/), 140), 1800);
    await wait(1200);
    Caption.set('オンライン販売の商品：在庫数は物流センター（WMS）、商品コード（SKU）で基幹とつながっている');
    await Browser.typeUrl('kanro.jp/products/15255718166896');
    Browser.nav('live', { url: LIVE + '/products/15255718166896', title: (S.products.find((p) => p.handle === '15255718166896') || {}).title || S.title });
    Browser.loading('live', true);
    await Store.load('product');
    Browser.loading('live', false);
    await wait(1200);
    const pd = Store.doc;
    const btn = [...pd.querySelectorAll('button, a')].find((b) => /カートに追加/.test(b.textContent)) || pd.querySelector('button[name="add"]');
    const price = [...pd.querySelectorAll('span, div, p')].find((e) => e.children.length < 2 && /^\s*¥214/.test(e.textContent));
    if (price) { await hoverUi(price, { kind: 'arrow', hold: 1300 }); }
    if (btn) { await Store.scrollToEl(btn, 520, 1400); await wait(800); await hoverUi(btn, { kind: 'hand', hold: 1400 }); Cursor.kind('arrow'); }
    const allergy = [...pd.querySelectorAll('h2, h3, h4, dt, th, p, div')].find((e) => e.children.length < 3 && /^\s*アレルギー表示\s*$/.test(e.textContent));
    if (allergy) {
      Caption.set('アレルギー表示などの商品情報も、基幹の商品マスタと同じ商品コードで管理');
      await Store.scrollToEl(allergy, 160, 1600);
      await wait(2600);
    }
    await Store.scroll(0, 1800);
    Caption.set('受注・在庫・出荷・会員の連携が完了：オンラインショップと社内システムが同じデータで動く');
    await wait(4500);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'product'],
    fontText: JSON.stringify(JA),
    async prepare() {
      const tree = [
        ['data', 'dir', 1], ['data/webhooks', 'dir', 0], ['data/webhooks/orders-paid-1004.json'], ['data/wms', 'dir', 1], ['data/wms/shukka_20261112_1130.csv'], ['data/wms/zaiko_20261112_1115.csv'],
        ['docs', 'dir', 1], ['docs/integration.md'],
        ['scripts', 'dir', 0], ['scripts/deploy.js'], ['scripts/replay.js'],
        ['src', 'dir', 1], ['src/jobs', 'dir', 1], ['src/jobs/import-shipments.js'], ['src/jobs/import-stock.js'], ['src/jobs/sync-members.js'],
        ['src/lib', 'dir', 0], ['src/lib/kikan.js'], ['src/lib/monitor.js'], ['src/lib/processed.js'], ['src/lib/shopify.js'], ['src/lib/wms.js'],
        ['src/routes', 'dir', 1], ['src/routes/webhooks.js'], ['src/webhooks', 'dir', 1], ['src/webhooks/verify.js'], ['src/server.js'],
        ['theme', 'dir', 1], ['theme/snippets', 'dir', 1], ['theme/snippets/member-status.liquid'],
        ['.env.example'], ['.gitignore'], ['package.json'], ['README.md'], ['shopify.app.toml'],
      ];
      Code.init(P, tree);
      Code.show('docs/integration.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'adm', title: Admin.title('ホーム'), url: Admin.url(''), page: 'admin', fav: 'admin' });
      Admin.show(V.home(), { nav: 'home' });
      Browser.addTab({ id: 'mon', title: 'Webhook 受信 | ec-gateway モニター', url: MON.URL + '/webhooks', page: 'mon', fav: 'dev' });
      MON.webhooks();
      Browser.activate('adm');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
