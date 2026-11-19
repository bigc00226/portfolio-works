/*
 * Timeline: ＠ベリーネット（b-net.tackleberry.co.jp, EC-CUBE 4; タックルベリー）— 店舗システムとの連携: the request, the live shop's
 * 「店頭展示併売品」 and 特定商取引法 (中古品は全国の店舗の在庫) → the dev copy's 商品一覧 → Web API プラグイン (Api42): プラグイン一覧,
 * enabled, eccube:api:dump-schema → OAuth管理: a client (redirect URI, read / write), store-link authorize → the admin's 認可 screen
 * → 許可 → /callback (token) → POS の書き出し → updateProductStock (stock_unlimited missing: GraphQL's error → fixed) → 商品一覧
 * (在庫 0), 品切れ → WebHook管理: a WebHook (secret) → order A: 401 (the receiver reads 'X-ECCUBE-Signature'; Node's header names are
 * lower case), EC-CUBE's log → fixed → order B: 出荷指示 → 受注一覧 → the store's 出荷実績 → updateShipped (出荷完了メール) → 受注一覧
 * (発送済み), 受注登録 → orders (the catch-up), an hour on: the access token expired → refreshed → order A gets its 出荷指示
 * → crontab → git, the production server → the live shop.
 * Every EC-CUBE screen and every API response is real: EC-CUBE 4.3.1-p1 running locally (js/ec-snapshot.js —
 * tools/snapshots/ec-tackleberry-api/capture-ec.js) with the store-link of js/link-src.js really talking to it; the shop is the
 * live b-net.tackleberry.co.jp (js/site-snapshot.js). docker, git and the servers are reconstructions.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, EC = window.EC, W11 = window.Win11, TB = window.TB;
  const { esc, wait, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, readHold } = K;
  const SRC = F.SRC, SL = F.SL, LINK = F.LINK;
  const LIVE = TB.LIVE;
  const DATA = EC.data || {};
  const S = window.SITE_SNAPSHOT;
  const TITLE = (k) => ((S && S.pages[k] && S.pages[k].pc || '').match(/<title>([^<]*)<\/title>/) || [])[1] || (S && S.title) || '＠ベリーネット';
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));
  const nl = (s) => String(s || '').replace(/\n$/, '');

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '店舗の在庫数を': { r: 'tenponozaikosuuwo', segs: ['店舗の', '在庫数を'] },
    'へ（中古品は': { r: 'he(chuukohinha', segs: ['へ', '（', '中古品は'] },
    '点もの：在庫は無制限にしない）': { r: 'tenmono:zaikohamuseigennishinai)', segs: ['点もの', '：', '在庫は', '無制限に', 'しない', '）'] },
    '先に': { r: 'sakini', segs: ['先に'] },
    'を返し、処理はそのあと': { r: 'wokaeshi,shorihasonoato', segs: ['を', '返し', '、', '処理は', 'そのあと'] },
  };
  const script = (lines, after) => K.codeScript(lines, JA, { unit: '  ', after });
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); if (Code.ins && Code.active) { Code.ensureVisible(Code.ins.line); Code.render(); } Term.render('<span class="caret"></span>'); };
  const L = (p) => SL + p;

  /* ------------------------------------------------ what the commands print */
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 26, ...o });
  const DC = 'docker compose exec ec-cube ';
  const tone = (l) => {
    const e = esc(l);
    if (/失敗|errors?\b|Error|401|一致しません|invalid_client|TypeError/.test(l)) return `<span class="terr">${e}</span>`;
    if (/出荷指示|認可 OK|\[OK\]|→ 0|→ 1|メール送信 済|新規受付 \d/.test(l)) return `<span class="tok">${e}</span>`;
    return e;
  };
  const lines = (arr, fb) => ((arr && arr.length ? arr : fb) || []).map(tone);
  /** bin/console's own output (captured) */
  const consoleOut = (text) => String(text || '').replace(/\r/g, '').split('\n').map((l) => esc(l).replace(/^(\s*)\[OK\]/, '$1<span class="tg">[OK]</span>'))
    .filter((l, i, a) => !(l.trim() === '' && (i === 0 || a[i - 1].trim() === '')));
  const secret = (s) => `<span class="pii">${esc(s)}</span>`;

  /* ------------------------------------------------------------- frames */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? EC.el(el) : el; if (!e) return null; const r = screenRect(e); if (!r.width) return null; return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const SR = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const termFind = (text, n = 1, w = 1300) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    let i = -1;
    rows.forEach((r, k) => { if (r.textContent.includes(text)) i = k; });
    if (i < 0) return null;
    const a = screenRect(rows[i]), b = screenRect(rows[Math.min(rows.length - 1, i + n - 1)]);
    return { left: a.left, top: a.top, width: Math.min(w, a.width), height: b.bottom - a.top };
  };
  const say = (text, ms) => { Caption.set(text); return readHold(ms != null ? ms : Math.min(4200, Math.max(1600, text.length * 55))); };
  const T = (sel, re) => TB.text(sel, re);
  const storeText = (sel, re) => { const d = Store.doc; if (!d) return null; const all = [...d.querySelectorAll(sel)].filter((e) => re.test(e.textContent)); return all.length ? all[all.length - 1] : null; };
  const frameLines = (path, a, b, label, o = {}) => {
    const t = Code.text(path);
    const i = lineOf(t, a, o.from || 0);
    const j = b ? lineOf(t, b, i) : i;
    if (i < 0) return Promise.resolve();
    return Code.reveal(Math.round((i + Math.max(i, j)) / 2), 500).then(() => { const rc = linesRect(i, Math.max(i, j), o.w || 1100); if (o.issue) Issue.show(rc, label); else Issue.ok(rc, label); return readHold(o.ms || 2600); });
  };
  const hold = async (rect, label, ms = 2600, issue = false) => { if (issue) Issue.show(rect, label); else Issue.ok(rect, label); await readHold(ms); Issue.hide(); };
  /** the row of the screen on show whose text has `re` */
  const row = (re, sel = 'tr') => T(sel, re);

  /* ------------------------------------------------ the store-link's files in the editor */
  /** types `lines` from the caret (after the line `prev`): ASCII runs typed, runs with Japanese pasted */
  async function typeChunks(lines, prev, o = {}) {
    let i = 0;
    let first = prev == null;
    while (i < lines.length) {
      const ja = /[^\x00-\x7f]/.test(lines[i]) && !o.typeJa;
      let j = i;
      while (j < lines.length && (/[^\x00-\x7f]/.test(lines[j]) && !o.typeJa) === ja) j++;
      const chunk = lines.slice(i, j);
      if (ja) { await Code.paste((first ? '' : '\n') + chunk.join('\n'), { after: 160 }); if (Code.ins) { Code.ensureVisible(Code.ins.line, 4); Code.render(); } }
      else await Code.type(script(chunk, first ? null : (i ? lines[i - 1] : prev)), { kps: o.kps || 30 });
      first = false;
      i = j;
    }
  }
  /** a new file of the store-link: the explorer's new file, then pasted (o.type: [from, to) lines typed) */
  async function newLinkFile(rel, text, o = {}) {
    const path = L(rel);
    await Code.newFile(path);
    Code.files[path].indent = '  ';
    const A = nl(text).split('\n');
    if (!o.type) await Code.paste(A.join('\n'), { after: o.after });
    else {
      const [a, b] = o.type;
      if (a > 0) await Code.paste(A.slice(0, a).join('\n'), { after: 200 });
      await typeChunks(A.slice(a, b), a > 0 ? A[a - 1] : null, o);
      if (b < A.length) await Code.paste('\n' + A.slice(b).join('\n'), { flash: false, after: 200 });
    }
    await Code.save({ status: 'U' });
    check(path, nl(text), rel);
    return path;
  }
  /** inserts `block` into the open link.mjs after the line that has `after` (typed; o.paste: pasted) */
  async function insertBlock(path, block, after, o = {}) {
    const t = Code.text(path);
    const at = lineOf(t, after, o.from || 0);
    await Code.reveal(at, 400);
    await Code.newLineAfter(at);
    const A = nl(block).split('\n');
    if (o.paste) await Code.paste('\n' + A.join('\n'), { after: 300 });
    else await typeChunks(A, t.split('\n')[at], o);
  }
  function addDirs(dirs, afterPath) {
    const at = Code.tree.findIndex((n) => n.path === afterPath);
    Code.tree.splice(at + 1, 0, ...dirs.map((p) => ({ path: p, dir: true, open: true })));
    Code.renderTree();
  }
  const fold = (paths) => { Code.tree.forEach((n) => { if (n.dir && paths.includes(n.path)) n.open = false; }); Code.renderTree(); };

  const DATAOUT = {
    callback: DATA.callback, stock1: DATA.stockRun1, stock2: DATA.stockRun2, hookA: DATA.hookA, hookB: DATA.hookB,
    ship: DATA.shipRun, orders1: DATA.ordersRun1, orders2: DATA.ordersRun2,
  };
  const linkStage = (n) => nl(SRC.link[n]);
  /** the schema as the redirect writes it (stdout only: the command's error and log lines go to stderr) */
  const SCHEMA = (() => { const s = String(DATA.schema || 'type Query {\n}\n'); const j = s.indexOf(' => '); const t = j > 0 ? s.slice(0, j) : s; return t.slice(0, t.lastIndexOf('\n}') + 2); })();
  const RESTART_B = (DATA.hookB || []).find((l) => /store-link http/.test(l)) || '[10:50:31] store-link http://localhost:3100（/callback /webhook）';
  const HOOK_B = (DATA.hookB || []).filter((l) => !/store-link http/.test(l));

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request, the live shop (店頭展示併売品・各店舗の在庫), the dev copy's 商品一覧 */
  scene('request', async () => {
    Caption.step(1);
    const RQ = 'docs/request-2026-10.md';
    await say('依頼（EC 運営・店舗システム担当）：中古品は全国の店舗の在庫そのもの。店頭と EC の両方で売れるので、在庫と注文を店舗の在庫システムとつなぐ');
    await hoverUi(Code.lineEl(4), { ax: 0.3, hold: 400 });
    await frameLines(RQ, '## 背景', 'EC で売れた商品は', '店頭展示併売品・1 点もの', { ms: 2800 });
    await frameLines(RQ, '## 1. 在庫', '取置解除', '在庫：店舗 → EC', { ms: 2400 });
    await frameLines(RQ, '## 2. 注文', '取りこぼし確認', '注文：EC → 在庫店舗', { ms: 2200 });
    await frameLines(RQ, '## 方式', '連携スクリプト', 'Web API プラグイン（GraphQL・OAuth2.0・WebHook）', { ms: 2800 });
    Issue.hide();
    // the live shop: a used reel's page
    await Win.switchTo('browser');
    await TB.tab('live');
    await say('公開中の＠ベリーネット：中古のリール 15レブロス 2000（ランク B+・数量 1）');
    const note = storeText('p, li, div, span', /^\s*※商品は店頭展示併売品となります。\s*$/);
    if (note) {
      await Store.scrollToEl(note, 380, 1600);
      await hold(SR(note, 4), '店頭展示併売品：店頭でも売れる', 3000);
      const sold = storeText('p, li, div, span', /^\s*※万が一品切れの場合は別途メールにて/);
      if (sold) await hold(SR(sold, 4), '品切れなら別途メール', 2400, true);
    } else { await Store.scroll(700, 1400); await readHold(2000); }
    // 特定商取引法：中古商品は全国の店舗の在庫
    await Browser.typeUrl('b-net.tackleberry.co.jp/help/tradelaw');
    Browser.nav('live', { url: LIVE + '/help/tradelaw', title: TITLE('tradelaw') });
    Browser.loading('live', true);
    await Store.load('tradelaw');
    Browser.loading('live', false);
    Caption.set('特定商取引法に基づく表記：中古商品は全国の店舗の在庫を掲載、商品は各店舗から発送');
    const law = storeText('p, td, dd, div', /中古商品は全国のタックルベリー各店舗の在庫商品を掲載/);
    if (law) { await Store.scrollToEl(law, 360, 1500); await hold(SR(law, 4), '全国の店舗の在庫を掲載・店舗から発送', 3200); }
    // the dev copy: 商品一覧
    await Browser.newTab('admin');
    await Browser.typeUrl('localhost:8080/admin/product');
    await TB.ec('admin', 'products-0', { load: 1300 });
    mark('products0');
    await say('開発環境（EC-CUBE 4.3・本番の中古品の一部をコピー）：商品コードは店舗のバーコード 13 桁、在庫はどれも 1');
    const r = row(/4023351010975/);
    if (r) { await hoverUi(r, { hold: 400 }); await hold(R(r, 2), 'シェリー CR62L — 4023351010975・在庫 1', 2800); }
  });

  /* 2 — Web API プラグイン (Api42) */
  scene('plugin', async () => {
    Caption.step(2);
    W11.skipTo('10:12');
    await Browser.typeUrl('localhost:8080/admin/store/plugin');
    await TB.ec('admin', 'plugins-0', { load: 1100 });
    await say('オーナーズストア › プラグイン一覧：EC-CUBE 4.3 に同梱の「Web API」（Api42）はまだ無効');
    const api = row(/Web API/);
    if (api) { await hoverUi(api, { hold: 400 }); await hold(R(api, 2), 'Web API 4.3.2 — 無効', 2600); }
    await Win.switchTo('code');
    await panel(true);
    await say('bin/console で有効化（インストール：OAuth2 と WebHook のテーブルを作成 → 有効化）');
    const ok = consoleOut(DATA.cacheOut || ' [OK] Cache for the "prod" environment (debug=false) was successfully cleared.');
    await run(DC + 'bin/console eccube:plugin:enable --code=Api42', ['', ' Run bin/console cache:clear --no-warmup...', ...ok, ' <span class="tg">[OK]</span> Plugin Enabled.', ''], { kps: 30 });
    Issue.ok(termFind('Plugin Enabled', 1, 600), '有効化');
    await readHold(1600);
    Issue.hide();
    // the schema
    await say('GraphQL のスキーマを書き出して、使える Query / Mutation を確かめる');
    const err = DATA.schemaErr || 'TypeError: Return value of "Plugin\\Api42\\Command\\DumpSchemaCommand::execute()" must be of the type int, "null" returned.';
    await run(DC + 'bin/console eccube:api:dump-schema > var/schema.graphql', ['', `<span class="terr">In Command.php line 329:</span>`, ' ', `<span class="terr">  ${esc(err.replace(/^TypeError: /, ''))}</span>`, ' '], { kps: 30 });
    Issue.show(termFind('In Command.php', 3, 1500), 'execute() が int を返さない（Symfony 6）');
    await readHold(2600);
    Issue.hide();
    Code.addFile('var/schema.graphql', SCHEMA, { silent: true });
    Code.files['var/schema.graphql'].indent = '  ';
    Code.tree.splice(Code.tree.findIndex((n) => n.path === 'var') + 1, 0, { path: 'var/schema.graphql', dir: false });
    Code.tree.find((n) => n.path === 'var').open = true;
    Code.renderTree();
    await Code.panel(false);
    const sch = 'var/schema.graphql';
    await openAt(sch, { top: Math.max(0, lineOf(Code.text(sch), 'type Mutation') - 2) });
    await say('エラーは書き出しのあと（戻り値の型）で、スキーマは出ている：Mutation は updateProductStock と updateShipped');
    await frameLines(sch, 'updateProductStock(', 'stock_unlimited: Boolean!', 'updateProductStock（商品コードで在庫）', { ms: 3000 });
    await frameLines(sch, 'updateShipped(', 'is_send_mail', 'updateShipped（出荷済み・メール）', { ms: 2600 });
    Issue.hide();
    await Win.switchTo('browser');
    Caption.set('プラグイン一覧を読み込み直す：Web API（Api42 4.3.2）が有効、管理画面の設定に「API管理」');
    await Browser.reload(async () => { await wait(700); await TB.ec('admin', 'plugins-1', { load: 0 }); });
    mark('plugins1');
    const api1 = row(/Web API/);
    if (api1) await hold(R(api1, 2), 'Web API — 有効', 2400);
  });

  /* 3 — the OAuth client, authorize, the token */
  scene('oauth', async () => {
    Caption.step(3);
    W11.skipTo('10:16');
    await Browser.typeUrl('localhost:8080/admin/api/oauth');
    await TB.ec('admin', 'oauth-0', { load: 1100 });
    await say('設定 › API管理 › OAuth管理：店舗システムの連携スクリプトを API クライアントとして登録する');
    const nav = T('a, li', /^OAuth管理$/);
    if (nav) await hold(R(nav, 3), 'API管理（Api42 が追加）', 2000);
    await clickUi(T('a', /^新規登録$/) || EC.el('a.btn-ec-regular'), { kind: 'hand', after: 60 });
    await TB.ec('admin', 'oauth-new', { load: 1000 });
    const idBox = EC.el('input[id$="_identifier"]');
    if (idBox) await hold(R(idBox.closest('.row') || idBox, 4), 'クライアント ID・シークレット（自動生成）', 2600);
    await say('リダイレクト URI は連携スクリプトの受け口（開発環境は localhost:3100）。スコープは read と write（在庫・出荷の更新）');
    await TB.type('redirect', 'http://localhost:3100/callback', { kps: 16 });
    for (const v of ['read', 'write']) {
      const c = EC.els('input[type=checkbox]').find((x) => x.value === v && /scope/.test(x.id));
      if (c) { await clickUi(c, { after: 120 }); TB.check(c); }
    }
    const gr = EC.els('input[type=checkbox]').find((x) => /grant/.test(x.id));
    if (gr) await hold(R(gr.closest('.row') || gr.parentElement, 4), 'Authorization code（認可コード）', 2200);
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await TB.ec('admin', 'oauth-list', { load: 1000 });
    mark('oauthList');
    const cr = row(/localhost:3100/);
    if (cr) await hold(R(cr, 2), 'API クライアント（read write）', 2600);
    // the store-link
    await Win.switchTo('code');
    await say('連携スクリプト store-link（店舗システム側・Node.js 22、依存なし）：OAuth2.0 のトークンと GraphQL の呼び出し');
    fold(['src', 'app', 'docs', 'var', 'vendor', 'html']);
    addDirs([SL.slice(0, -1), L('graphql'), L('lib')], 'integration');
    await newLinkFile('.env.example', SRC.files['.env.example']);
    await newLinkFile('lib/util.mjs', SRC.files['lib/util.mjs']);
    const S1 = linkStage(1).split('\n');
    const a = S1.findIndex((l) => l.startsWith('async function tokenRequest'));
    const b = S1.findIndex((l, i) => i > a && l === '}');
    await newLinkFile('link.mjs', linkStage(1), { type: [a, b + 1], kps: 42 });
    const LM = L('link.mjs');
    await frameLines(LM, 'async function tokenRequest', 'return token;', 'トークンエンドポイント /token', { ms: 2400 });
    await frameLines(LM, 'async function accessToken', "grant_type: 'refresh_token'", '期限切れならリフレッシュトークンで更新', { ms: 2400 });
    await frameLines(LM, 'async function api(', 'Authorization: `Bearer', 'GraphQL（/api）に Bearer トークン', { ms: 2400 });
    await frameLines(LM, "if (cmd === 'authorize')", "scope: 'read write'", '認可の URL（read write）', { ms: 2400 });
    Issue.hide();
    // .env (the client's id / secret), authorize, serve
    await panel(true);
    await run('cd integration\\store-link; Copy-Item .env.example .env', [], { kps: 34 });
    Term.prompt = 'PS C:\\work\\berrynet-eccube\\integration\\store-link> ';
    Term.render('<span class="caret"></span>');
    Code.addFile(L('.env'), nl(SRC.files['.env.example']).replace('CLIENT_ID=', 'CLIENT_ID=' + ((DATA.client && DATA.client.id) || '')).replace('CLIENT_SECRET=', 'CLIENT_SECRET=' + ((DATA.client && DATA.client.secret) || '')), { silent: true });
    Code.tree.splice(Code.tree.findIndex((n) => n.path === L('.env.example')), 0, { path: L('.env'), dir: false });
    Code.renderTree();
    await Code.panel(false);
    await openAt(L('.env'), { top: 0 });
    await say('.env に OAuth管理のクライアント ID とシークレット（シークレットはぼかし）');
    await frameLines(L('.env'), 'CLIENT_ID=', 'REDIRECT_URI=', 'クライアント ID・シークレット・リダイレクト URI', { ms: 2600 });
    Issue.hide();
    await panel(true);
    const t0 = (DATAOUT.callback && DATAOUT.callback[0] || '[10:22:00]').slice(0, 10);
    await run('$s = Start-Process node link.mjs,serve -NoNewWindow -PassThru', [tone(`${t0.replace(/\d\d\]$/, '40]').replace(/:\d\d:/, ':20:')} store-link http://localhost:3100（/callback /webhook）`)], { kps: 30 });
    await run('node link.mjs authorize', [esc(DATA.authorizeUrl || 'http://localhost:8080/admin/authorize?response_type=code')], { kps: 30 });
    Issue.ok(termFind('/admin/authorize?', 2, 1500), '認可の URL（管理画面）');
    await readHold(2200);
    Issue.hide();
    // the admin's 認可 screen (Ctrl + click on the URL in the terminal)
    const urlRow = [...document.querySelectorAll('#vsTerm > div')].filter((r) => r.textContent.includes('/admin/authorize?')).pop();
    await Keycap.show(['Ctrl'], 300);
    await clickUi(urlRow, { kind: 'hand', ax: 0.2, after: 60 });
    await Win.switchTo('browser');
    Browser.addTab({ id: 'auth', title: '新しいタブ', url: '', page: 'blank', fav: 'blank' }, { anim: true });
    Browser.activate('auth');
    await TB.ec('auth', 'authorize', { load: 1300, url: DATA.authorizeUrl });
    mark('authorize');
    await say('管理画面の認可：ログイン中の管理者（admin）が、このアプリに読み取り・書き込みを許可する');
    const box = EC.el('form#form1') || EC.el('form');
    if (box) await hold(R(box.parentElement || box, 6), '読み取り・書き込み（read write）', 2800);
    await clickUi(EC.els('button').find((x) => /approve/.test(x.name || x.id)) || T('button', /^許可する$/), { kind: 'hand', after: 60 });
    await TB.ec('auth', 'callback', { load: 1600 });
    mark('callback');
    await say('リダイレクト URI（store-link の /callback）へ認可コード → store-link がトークンに交換して保存');
    await Win.switchTo('code');
    await Term.out(lines(DATAOUT.callback, ['[10:22:05] 認可 OK（admin・scope read write）トークンを var/token.json に保存']));
    Issue.ok(termFind('認可 OK', 1, 1200), 'アクセストークン（1 時間）・リフレッシュトークン');
    await readHold(2800);
    Issue.hide();
  });

  /* 4 — POS → updateProductStock: the mistake (stock_unlimited), the fix, 在庫 0 */
  scene('stock', async () => {
    Caption.step(4);
    W11.skipTo('10:28');
    await Code.panel(false);
    addDirs([L('pos')], L('lib/util.mjs'));
    await say('POS の書き出し（店舗システム）：店頭で売れた 2 点と、取置を解除した 1 点。在庫数は店舗の実数');
    await newLinkFile('pos/sales-20261114-1030.csv', F.DATAFILES[L('pos/sales-20261114-1030.csv')]);
    await frameLines(L('pos/sales-20261114-1030.csv'), '店頭販売,0', '取置解除,1', '店頭販売 → 0・取置解除 → 1', { ms: 2600 });
    Issue.hide();
    await say('Mutation は .graphql に分けて、変数（商品コード・在庫数）で呼ぶ');
    const V1 = nl(SRC.stockV1).split('\n');
    await newLinkFile('graphql/update-stock.graphql', SRC.stockV1, { type: [0, V1.length], typeJa: true, kps: 26 });
    await openAt(L('link.mjs'), { top: Math.max(0, lineOf(Code.text(L('link.mjs')), "if (cmd === 'stock')") - 8) });
    await frameLines(L('link.mjs'), "if (cmd === 'stock')", 'process.exitCode = 1;', 'CSV の行ごとに updateProductStock', { ms: 2600 });
    Issue.hide();
    await panel(true);
    await run('node link.mjs stock pos/sales-20261114-1030.csv', lines(DATAOUT.stock1, ['在庫 失敗']), { kps: 30 });
    mark('stockError');
    Caption.issue('GraphQL のエラー', '3 行とも失敗：引数 stock_unlimited（Boolean!）は必須なのに渡していない');
    Issue.show(termFind('stock_unlimited', 1, 1500), 'Boolean! の必須引数');
    await readHold(3000);
    Issue.hide();
    await Code.panel(false);
    await openAt(SRC.core && 'app/Plugin/Api42/GraphQL/Mutation/UpdateProductStockMutation.php', { top: 50 });
    Code.files['app/Plugin/Api42/GraphQL/Mutation/UpdateProductStockMutation.php'].indent = '    ';
    await say('Api42 の updateProductStock：stock_unlimited は nonNull。在庫無制限でないなら stock が必須');
    await frameLines('app/Plugin/Api42/GraphQL/Mutation/UpdateProductStockMutation.php', "'stock_unlimited' => [", "'type' => Type::nonNull(Type::boolean()),", 'stock_unlimited は必須', { issue: true, ms: 2800 });
    await frameLines('app/Plugin/Api42/GraphQL/Mutation/UpdateProductStockMutation.php', "if (!array_key_exists('stock', $args))", null, '有限なら stock が必要', { ms: 2200 });
    Issue.hide();
    // the fix: 中古品は 1 点もの — stock_unlimited: false
    const G = L('graphql/update-stock.graphql');
    await openAt(G, { top: 0 });
    await say('直す：中古品は 1 点もの。在庫は常に有限（stock_unlimited: false）');
    const g0 = Code.text(G).split('\n');
    const li = g0.findIndex((l) => l.includes('updateProductStock(code: $code, stock: $stock)'));
    await Code.clickAt(li, g0[li].indexOf(') {'), {});
    await Code.type(', stock_unlimited: false', { kps: 22 });
    await Code.save();
    check(G, nl(SRC.files['graphql/update-stock.graphql']), 'update-stock fix');
    await panel(true);
    await run('node link.mjs stock pos/sales-20261114-1030.csv', lines(DATAOUT.stock2, ['在庫 → 0']), { kps: 30 });
    mark('stockOk');
    Issue.ok(termFind('在庫 ', 3, 1100), 'updateProductStock：0・0・1');
    await readHold(2800);
    Issue.hide();
    await Code.panel(false);
    // the admin, the shop
    await Win.switchTo('browser');
    await TB.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/product');
    await TB.ec('admin', 'products-1', { load: 1100 });
    await say('商品一覧：店頭で売れた 2 点は在庫 0、取置を解除したアンタレス RH は在庫 1');
    for (const [re, label] of [[/3461086007708/, '15イグジスト 2508PE — 在庫 0'], [/3921052011431/, 'アンタレス RH — 在庫 1']]) {
      const r = row(re);
      if (r) { await EC.scroll(Math.max(0, r.getBoundingClientRect().top + EC.doc().defaultView.scrollY - 380), 900); await hold(R(r, 2), label, 2200); }
    }
    await Browser.newTab('shop');
    await Browser.typeUrl('localhost:8080/products/detail/1370013');
    await TB.ec('shop', 'front-soldout', { load: 1300 });
    mark('soldout');
    const so = T('button, div, p', /ただいま品切れ中です/);
    await say('ショップの商品ページ：カートに入れられない（店頭で売れた商品の注文を受けない）');
    if (so) await hold(R(so, 4), 'ただいま品切れ中です', 2600);
  });

  /* 5 — WebHook: the receiver's mistake (header case) → 401, the fix, 出荷指示 */
  scene('webhook', async () => {
    Caption.step(5);
    W11.skipTo('10:38');
    await TB.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/api/webhook');
    await TB.ec('admin', 'webhook-0', { load: 1000 });
    await say('注文はすぐ在庫店舗へ：WebHook管理。商品・受注・会員が変わると、登録した URL に通知（POST）');
    await clickUi(T('a', /^新規登録$/) || EC.el('a.btn-ec-regular'), { kind: 'hand', after: 60 });
    await TB.ec('admin', 'webhook-new', { load: 900 });
    await TB.type('payload', 'http://localhost:3100/webhook', { kps: 16 });
    // a secret
    await Win.switchTo('code');
    await panel(false);
    await run('node -e "console.log(require(\'crypto\').randomBytes(20).toString(\'hex\'))"', [secret(DATA.webhookSecret || '0'.repeat(40))], { kps: 34 });
    await Keycap.show(['Ctrl', 'C'], 400);
    await Win.switchTo('browser');
    await TB.type('secret', DATA.webhookSecret || '', { paste: true, pii: true });
    const sw = EC.el('input[type=checkbox][id$="_enabled"]');
    if (sw) { await clickUi(sw.closest('label, .form-check, .c-toggleSwitch, div') || sw, { after: 120 }); TB.check(sw); }
    await say('シークレット：EC-CUBE は通知の本文を HMAC-SHA256 で署名し、X-ECCUBE-Signature ヘッダーに入れる');
    const sb = EC.field('secret');
    if (sb) await hold(R(sb.closest('.row') || sb, 4), 'シークレット（ぼかし）', 2000);
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await TB.ec('admin', 'webhook-list', { load: 900 });
    const wr = EC.el('.alert-success') || EC.el('.alert');
    if (wr) await hold(R(wr, 2), '保存しました（Payload URL・シークレット・有効）', 2200);
    // WebHookService (read only), the receiver
    await Win.switchTo('code');
    await Code.panel(false);
    const WS = 'app/Plugin/Api42/Service/WebHookService.php';
    Code.files[WS].indent = '    ';
    await openAt(WS, { top: 95 });
    await frameLines(WS, "$headers['X-ECCUBE-Signature'] = hash_hmac(", null, '本文の HMAC-SHA256', { ms: 2400 });
    await frameLines(WS, "'connect_timeout' => 1,", "'timeout' => 5,", '受け側は素早く 200 を返す', { ms: 2200 });
    Issue.hide();
    const LM = L('link.mjs');
    await openAt(LM, { top: 40 });
    await say('store-link：在庫台帳（商品コード → 在庫店舗・棚番）、受注を GraphQL で確かめて出荷指示、署名の検証');
    addDirs([L('data')], L('.env'));
    Code.addFile(L('data/ledger.csv'), F.DATAFILES[L('data/ledger.csv')], { silent: true });
    Code.tree.splice(Code.tree.findIndex((n) => n.path === L('data')) + 1, 0, { path: L('data/ledger.csv'), dir: false });
    Code.renderTree();
    await newLinkFile('graphql/order.graphql', SRC.files['graphql/order.graphql']);
    await openAt(LM, { top: 0 });
    const S2 = linkStage(2);
    await Code.lineAfter("const TOKEN = 'var/token.json';", "const PICKED = 'var/picked.json';", { kps: 22 });
    // the ledger, pick() and verify() after api()
    const t1 = Code.text(LM).split('\n');
    const apiEnd = t1.findIndex((l, i) => i > lineOf(Code.text(LM), 'return json.data;') && l === '}');
    await Code.reveal(apiEnd, 400);
    await Code.newLineAfter(apiEnd);
    await Code.paste('\n\n' + SRC.blocks.A.replace(/\n+$/, ''), { after: 300 });
    await frameLines(LM, 'async function pick(', "if (order.OrderStatus.id !== '1') return;", '新規受付だけ（購入処理中の仮受注は除く）', { ms: 2600 });
    Issue.hide();
    // the /webhook handler, typed (with the header name as the docs write it)
    const B = SRC.blocks.B.replace(SRC.blocks.BUG[0], SRC.blocks.BUG[1]);
    const t2 = Code.text(LM).split('\n');
    const before404 = t2.findIndex((l) => l.includes('res.writeHead(404).end();')) - 1;
    await Code.reveal(before404, 400);
    await Code.newLineAfter(before404);
    await typeChunks(B.replace(/\n+$/, '').split('\n'), t2[before404], { kps: 40 });
    await Code.save();
    check(LM, S2, 'link stage 2');
    await frameLines(LM, 'if (!verify(raw, req.headers[', null, '署名を検証', { ms: 2000 });
    await frameLines(LM, 'res.writeHead(200).end();', null, '先に 200、処理はそのあと', { ms: 2000 });
    Issue.hide();
    await Code.save({ noStatus: true });
    Code.setText(L('.env'), Code.text(L('.env')).replace('WEBHOOK_SECRET=', 'WEBHOOK_SECRET=' + (DATA.webhookSecret || '')));
    await panel(true);
    await run('Stop-Process $s; $s = Start-Process node link.mjs,serve -NoNewWindow -PassThru', [tone('[10:44:12] store-link http://localhost:3100（/callback /webhook）')], { kps: 34 });
    await Code.panel(false);
    // order A
    await Win.switchTo('browser');
    await TB.tab('shop');
    await Browser.typeUrl('localhost:8080/products/detail/1370083');
    await TB.ec('shop', 'product-a', { load: 1200 });
    await say('開発環境のショップでテスト注文（テストのお客様でログイン済み）：23エアリティ PC LT2500-H');
    await clickUi(EC.el('button.add-cart, #form1 button[type=submit]'), { kind: 'hand', after: 60 });
    await TB.ec('shop', 'shopping-a', { load: 1600, url: TB.DEV + '/shopping' });
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await TB.ec('shop', 'confirm-a', { load: 1100 });
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await TB.ec('shop', 'complete-a', { load: 1600 });
    mark('completeA');
    await Win.switchTo('code');
    await panel(true);
    await Term.out(lines(DATAOUT.hookA, ['[10:47:02] WebHook 署名が一致しません → 401']));
    Caption.issue('WebHook が 401', '署名が「一致しない」— シークレットは同じなのに、注文の通知をすべて拒否している');
    Issue.show(termFind('一致しません', 2, 1200), '401');
    await readHold(3400);
    Issue.hide();
    const HL = DATA.hookLog || {};
    await run(`Get-Content ..\\..\\${(HL.file || 'var/log/prod/site-2026-11-14.log').replace(/\d{4}-\d{2}-\d{2}/, '2026-11-14').replace(/\//g, '\\')} -Tail 100 | Select-String webhook`,
      ((HL.lines && HL.lines.length) ? HL.lines : ['401 Unauthorized']).map((l) => tone(l.replace(/\s*\[\]\s*$/, '').slice(0, 200))), { kps: 34 });
    Issue.show(termFind('401', 1, 1500), 'EC-CUBE 側のログ：通知は失敗（再送はない）');
    await readHold(3000);
    Issue.hide();
    await Code.panel(false);
    await say("原因：Node の req.headers はヘッダー名が小文字。'X-ECCUBE-Signature' では undefined");
    await frameLines(LM, "req.headers['X-ECCUBE-Signature']", null, 'undefined → 不一致', { issue: true, ms: 3000 });
    Issue.hide();
    await Code.overwrite("'X-ECCUBE-Signature'", "'x-eccube-signature'", { kps: 18 });
    await Code.save();
    check(LM, linkStage(2).replace(SRC.blocks.BUG[1], SRC.blocks.BUG[0]), 'header fix');
    await panel(true);
    await run('Stop-Process $s; $s = Start-Process node link.mjs,serve -NoNewWindow -PassThru', [tone(RESTART_B)], { kps: 34 });
    await Code.panel(false);
    // order B
    W11.skipTo('10:51');
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/products/detail/1370007');
    await TB.ec('shop', 'product-b', { load: 1200 });
    await say('もう一度テスト注文：ロキサーニSP 2500SH（ランク A）');
    await clickUi(EC.el('button.add-cart, #form1 button[type=submit]'), { kind: 'hand', after: 60 });
    Caption.set('カート → ご注文手続き → ご注文内容の確認 → 注文する');
    await TB.ec('shop', 'complete-b', { load: 2600 });
    mark('completeB');
    await Win.switchTo('code');
    await panel(true);
    await Term.out(lines(HOOK_B, ['[10:52:10] 出荷指示']));
    await say('通知は注文手続きの途中（購入処理中の仮受注）にも届く。対応状況を API で確かめて、新規受付で出荷指示');
    Issue.ok(termFind('出荷指示', 1, 1500), '在庫店舗へ出荷指示（棚番・出荷 ID）');
    await readHold(3000);
    Issue.hide();
    await Code.panel(false);
    const pk = Object.keys(DATA.picking || {})[0];
    if (pk) {
      addDirs([L('outbox')], L('pos/sales-20261114-1030.csv'));
      Code.addFile(L('outbox/' + pk), nl(DATA.picking[pk]), { silent: true });
      Code.tree.splice(Code.tree.findIndex((n) => n.path === L('outbox')) + 1, 0, { path: L('outbox/' + pk), dir: false });
      Code.renderTree();
      await openAt(L('outbox/' + pk), { top: 0 });
      await say(`店舗 ${pk.replace(/\D/g, '')} の出荷指示（店舗システムが読み、スタッフが棚から出す）`, 2600);
    }
    await Win.switchTo('browser');
    await TB.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/order');
    await TB.ec('admin', 'orders-1', { load: 1100 });
    await say('受注一覧：2 件とも新規受付。1 件目は通知が 401 で、店舗に届いていない');
    const t = EC.el('table');
    if (t) await hold(R(t, 2), '新規受付 2 件', 2600);
  });

  /* 6 — the store's 出荷実績 → updateShipped */
  scene('ship', async () => {
    Caption.step(6);
    W11.skipTo('11:40');
    await Win.switchTo('code');
    await say('店舗が発送：店舗システムの出荷実績（受注番号・出荷 ID・配送業者・お問い合わせ番号）');
    await newLinkFile('pos/shipped-20261114-1140.csv', F.DATAFILES[L('pos/shipped-20261114-1140.csv')]);
    await newLinkFile('graphql/update-shipped.graphql', SRC.files['graphql/update-shipped.graphql'], { type: [1, 3], kps: 34 });
    await frameLines(L('graphql/update-shipped.graphql'), 'tracking_number: $tracking', 'is_send_mail: true', 'お問い合わせ番号・出荷完了メール', { ms: 2600 });
    Issue.hide();
    const LM = L('link.mjs');
    await openAt(LM, { top: 120 });
    const S3 = linkStage(3);
    await insertBlock(LM, SRC.blocks.HS, '//   node link.mjs stock <csv>', { paste: true });
    const end = Code.text(LM).split('\n').length - 1;
    await Code.reveal(end, 400);
    await Code.newLineAfter(end);
    const Dl = nl(SRC.blocks.D).split('\n');
    await Code.paste('\n\n' + Dl[0], { after: 200 });
    await typeChunks(Dl.slice(1, 5), Dl[0], { kps: 36 });
    await Code.paste('\n' + Dl.slice(5).join('\n'), { after: 300 });
    await Code.save();
    check(LM, S3, 'link stage 3');
    await panel(true);
    await run('node link.mjs ship pos/shipped-20261114-1140.csv', lines(DATAOUT.ship, ['出荷']), { kps: 30 });
    mark('ship');
    Issue.ok(termFind('出荷 受注', 1, 1400), 'updateShipped：出荷済み・メール送信');
    await readHold(2800);
    Issue.hide();
    await Code.panel(false);
    await Win.switchTo('browser');
    await TB.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/order');
    await TB.ec('admin', 'orders-2', { load: 1100 });
    await say('受注一覧：ロキサーニSP の注文は発送済み（受注のすべての出荷が出荷済み → 対応状況も発送済み）');
    const st = T('span, td, .badge', /^発送済み$/);
    const orow = st && st.closest('tr');
    if (orow) { await hoverUi(orow, { hold: 300 }); await hold(R(orow, 2), '発送済み', 2400); }
    await clickUi((orow && orow.querySelector('a[href*="/edit"]')) || T('a', /^\d+$/), { kind: 'hand', after: 60 });
    await TB.ec('admin', 'order-edit-b', { load: 1200, url: TB.DEV + `/admin/order/${(DATA.orderB && DATA.orderB.id) || 2}/edit` });
    mark('orderEdit');
    await say('受注登録：対応状況「発送済み」と出荷日・お問い合わせ番号（4419-6203-7751）は API から。出荷完了メールも送信済み');
    const sdl = EC.els('span, div, label').find((e) => e.textContent.trim() === '出荷日');
    if (sdl) await hold(R(sdl.closest('.row') || sdl.parentElement, 4), '出荷日（updateShipped の実行日時）', 2200);
    const tn = EC.el('input[id*="tracking_number"]') || T('div, td, span', /4419-6203-7751/);
    if (tn) {
      await EC.scroll(Math.max(0, tn.getBoundingClientRect().top + EC.doc().defaultView.scrollY - 420), 1200);
      await hold(R(tn.closest('.row') || tn, 4), 'お問い合わせ番号', 2400);
    } else await readHold(1200);
  });

  /* 7 — the catch-up (orders), an hour on: the token refreshed, crontab */
  scene('refresh', async () => {
    Caption.step(7);
    W11.skipTo('11:55');
    await Win.switchTo('code');
    await say('取りこぼし対策：新規受付の注文を定期的に確かめる（orders クエリ）。WebHook が 401 だった 1 件目を拾う');
    await newLinkFile('graphql/orders.graphql', SRC.files['graphql/orders.graphql'], { type: [1, 3], kps: 34 });
    const LM = L('link.mjs');
    await openAt(LM, { top: 0 });
    await insertBlock(LM, SRC.blocks.HO, '//   node link.mjs stock <csv>', { paste: true });
    const C = SRC.blocks.C.replace(/\n+$/, '');
    const at = lineOf(Code.text(LM), "if (cmd === 'ship') {") - 1;
    await Code.reveal(at, 400);
    await Code.clickAt(at, 0, {});
    await Code.paste('\n' + C + '\n', { after: 300 });
    await Code.save();
    check(LM, linkStage(4), 'link stage 4');
    await frameLines(LM, "if (cmd === 'orders')", 'for (const o of orders.nodes) await pick(o.id);', '新規受付 → まだなら出荷指示', { ms: 2400 });
    Issue.hide();
    await frameLines(LM, 'async function accessToken', "grant_type: 'refresh_token'", '1 時間たったアクセストークンは自動で更新', { ms: 2400 });
    Issue.hide();
    await panel(true);
    await run('node link.mjs orders', lines(DATAOUT.orders1, ['新規受付 1 件']), { kps: 30 });
    mark('catchUp');
    await say('アクセストークンは 1 時間で期限切れ → リフレッシュトークンで更新して続行。401 で届かなかった 1 件目を出荷指示');
    Issue.ok(termFind('期限切れ', 1, 1500), 'refresh_token で更新');
    await readHold(2200);
    Issue.ok(termFind('出荷指示', 1, 1500), '1 件目（23エアリティ）を在庫店舗へ');
    await readHold(2800);
    Issue.hide();
    await Code.panel(false);
    // crontab
    addDirs([L('deploy')], L('data/ledger.csv'));
    await newLinkFile('deploy/crontab', LINK[L('deploy/crontab')]);
    await say('店舗システムのサーバーで定期実行：在庫（5 分）・出荷実績（15 分）・取りこぼし確認（10 分）、WebHook の受け口は常駐');
    await frameLines(L('deploy/crontab'), '*/5 * * * *', '*/10 * * * *', 'cron', { ms: 2800 });
    Issue.hide();
  });

  /* 8 — git, production, the live shop */
  scene('deploy', async () => {
    Caption.step(8);
    W11.skipTo('12:10');
    await panel(true);
    await say('コミットして本番へ。本番は Web API プラグインを有効化し、本番の管理画面でクライアントと WebHook を登録');
    const files = Object.keys(LINK).filter((f) => !/\.env$/.test(f)).sort();
    await run('cd ..\\..; git add -A; git commit -m "店舗システム連携：store-link（在庫・WebHook・出荷・取りこぼし確認）"', [
      esc('[main 7b2e4d1] 店舗システム連携：store-link（在庫・WebHook・出荷・取りこぼし確認）'),
      ` ${files.length + 1} files changed, ${files.reduce((n, f) => n + LINK[f].split('\n').length, 0) + 6} insertions(+)`,
      ...files.slice(0, 5).map((f) => ` create mode 100644 ${f}`), ' …'], { kps: 34 });
    Term.prompt = 'PS C:\\work\\berrynet-eccube> ';
    await run('git push', ['To github.com:tackleberry/berrynet-eccube.git', '   5d81c0a..7b2e4d1  main -&gt; main'], { kps: 20 });
    await run('ssh berrynet-prod "cd /var/www/eccube && ./deploy.sh && bin/console eccube:plugin:enable --code=Api42"', [
      'Updating 5d81c0a..7b2e4d1', 'Fast-forward', ` ${files.length + 1} files changed`,
      ' <span class="tg">[OK]</span> Plugin Enabled.', '<span class="tg">deploy: done</span>'], { kps: 26 });
    await run('ssh store-sys "cd /opt/store-link && git pull && crontab deploy/crontab && sudo systemctl restart store-link"', [
      'Already up to date.', '<span class="tg">store-link.service: active (running)</span> — https://store-link.internal/webhook'], { kps: 26 });
    Issue.ok(termFind('deploy: done', 3, 900), '本番へ反映');
    await readHold(2200);
    Issue.hide();
    await Code.panel(false);
    await Win.switchTo('browser');
    await TB.tab('live');
    await Browser.typeUrl('b-net.tackleberry.co.jp/products/detail/1370032');
    Browser.nav('live', { url: LIVE + '/products/detail/1370032', title: TITLE('detail') });
    Browser.loading('live', true);
    await Store.load('detail');
    Browser.loading('live', false);
    mark('live');
    await say('公開中の＠ベリーネット：店頭で売れた商品はすぐ在庫 0、EC の注文は在庫店舗へすぐ出荷指示');
    await Store.scroll(260, 1400);
    D.Cursor.kind('arrow');
    Caption.set('EC-CUBE 4.3 の Web API（Api42）：OAuth2.0 の認可、GraphQL の updateProductStock・order・orders・updateShipped、署名つき WebHook で店舗の在庫システムと連携');
    await wait(5200);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['detail', 'tradelaw'],
    fontText: JSON.stringify(JA) + F.files['docs/request-2026-10.md'] + Object.values(LINK).join('') + JSON.stringify(DATAOUT) + '在庫店舗出荷指示発送済み',
    async prepare() {
      const tree = [
        ['app', 'dir', 0], ['app/Customize', 'dir'], ['app/Plugin', 'dir'], ['app/config', 'dir'], ['app/template', 'dir'],
        ['bin', 'dir'], ['docs', 'dir', 1], ['docs/request-2026-10.md'], ['html', 'dir'], ['integration', 'dir', 1],
        ['src', 'dir'], ['var', 'dir'], ['vendor', 'dir'], ['.env'], ['.gitignore'], ['README.md'],
      ];
      Code.init({ ...F.files }, tree);
      Code.show('docs/request-2026-10.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: TITLE('detail'), url: LIVE + '/products/detail/1370032', page: 'store', fav: 'store' });
      await Store.load('detail');
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      TB.blur();
      TB.watch();
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
