/*
 * Timeline: ライフミール（l-meal.com, EC-CUBE 4）— 決済システムの構築: the request, the live 特定商取引法 page (クレジットカード ·
 * GMO後払い · Amazon Pay), the dev copy's 支払方法 (GMO後払い only) → GMO後払い: 手数料 330 → 0 円, 利用条件 〜55,000 円 →
 * the card payment plugin LmealPayment (PaymentMethodInterface: verify / apply / checkout, CardGateway in test mode, the
 * token field, the card form) → bin/console eccube:plugin:install / enable, プラグイン一覧, 支払方法一覧, 配送方法 (取扱支払方法)
 * → a test order: 購入エラー (the confirm page does not post the token: checkout()'s form is built with skip_add_form) →
 * the confirm page's snippet → ご注文完了 → 受注管理 (入金済み, 入金日, 取引 ID), メール通知 → 冷凍庫レンタル only by card
 * (PurchaseFlow validator), 8回まとめ買い 20食 63,200 円: no GMO後払い → git, the production server → the live plan page.
 * Every EC-CUBE screen is real: EC-CUBE 4.3.1-p1 running locally with this code (js/ec-snapshot.js —
 * tools/snapshots/ec-l-meal-payment/capture-ec.js); the shop is the live l-meal.com (js/site-snapshot.js).
 * bin/console's output and the log lines are EC-CUBE's own; docker, git and the server are reconstructions.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, EC = window.EC, W11 = window.Win11, LM = window.LM;
  const { esc, wait, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, readHold } = K;
  const SRC = F.SRC, P = F.files, PL = F.P;
  const DEV = LM.DEV, LIVE = LM.LIVE;
  const DATA = EC.data || {};
  const S = window.SITE_SNAPSHOT;
  const TITLE = (k) => ((S && S.pages[k] && S.pages[k].pc || '').match(/<title>([^<]*)<\/title>/) || [])[1] || (S && S.title) || 'ライフミール';
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));
  const src = (p) => SRC.source[p];
  const full = (p) => PL + p;

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'カード決済': { r: 'ka-dokessai', segs: ['カード', '決済'] },
    '決済エラー': { r: 'kessaiera-', segs: ['決済', 'エラー'] },
    '売上確定': { r: 'uriagekakutei', segs: ['売上', '確定'] },
    '（': { r: '(', segs: ['（'] },
    '）': { r: ')', segs: ['）'] },
    'クレジットカード（': { r: 'kurejittoka-do(', segs: ['クレジットカード', '（'] },
    '）でのお支払いが完了しました。': { r: ')denooshiharaigakanryoushimashita.', segs: ['）', 'での', 'お支払いが', '完了しました。'] },
    '注文確認：トークンを「注文する」のフォームで送り直す（': { r: 'chuumonkakunin:to-kunwo[chuumonsuru]nofo-mudeokurinaosu(', segs: ['注文確認', '：', 'トークンを', '「', '注文する', '」', 'の', 'フォームで', '送り直す', '（'] },
    'のフォームには確認画面の値しか来ない）': { r: 'nofo-muniha,kakuningamennoataishikakonai)', segs: ['の', 'フォームには', '確認画面の', '値しか', '来ない', '）'] },
    '注文確認：トークンを「注文する」のフォーム（': { r: 'chuumonkakunin:to-kunwo[chuumonsuru]nofo-mu(', segs: ['注文確認', '：', 'トークンを', '「', '注文する', '」', 'の', 'フォーム', '（'] },
    '）で送る': { r: ')deokuru', segs: ['）', 'で', '送る'] },
    '冷凍庫レンタルをお申込みの場合は、クレジットカード決済のみご利用いただけます。': [{ r: 'reitoukorentaruwoomoushikominobaaiha,', segs: ['冷凍庫', 'レンタルを', 'お申込みの', '場合は', '、'] }, { r: 'kurejittoka-dokessainomigoriyouitadakemasu.', segs: ['クレジットカード', '決済のみ', 'ご利用', 'いただけます。'] }],
  };
  // the JA entries above are keyed by whole runs; codeScript needs them exactly — the IME's own segment text joined
  /** typing script for PSR-12 / Twig lines (4 spaces): Enter + the editor's auto-indent, corrected */
  const script = (lines, after) => K.codeScript(lines, JA, { unit: '    ', after });
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) { const f = Code.files[path]; if (f && /\.(php|twig|js|ya?ml|json)$/.test(path)) f.indent = '    '; show0(path, o); };
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); if (Code.ins && Code.active) { Code.ensureVisible(Code.ins.line); Code.render(); } Term.render('<span class="caret"></span>'); };

  /* ------------------------------------------------ what the commands print */
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 26, ...o });
  const DC = 'docker compose exec ec-cube ';
  /** bin/console's own output (captured), the paths inside the container */
  const consoleOut = (text) => String(text || '').replace(/\/srv\/eccube/g, '/var/www/html').replace(/\r/g, '').split('\n')
    .map((l) => esc(l).replace(/^(\s*)\[OK\]/, '$1<span class="tg">[OK]</span>')).filter((l, i, a) => !(l.trim() === '' && (i === 0 || a[i - 1].trim() === '')));
  const cacheClear = () => run(DC + 'bin/console cache:clear --no-warmup', ['', ' // Clearing the cache for the <span class="tc">prod</span> environment with debug <span class="tc">false</span>', '',
    ' <span class="tg">[OK]</span> Cache for the "prod" environment (debug=false) was successfully cleared.', ''], { kps: 30 });
  /** EC-CUBE's own log lines (captured), shortened to the screen */
  const logOut = (L, re) => ((L && L.lines) || []).filter((l) => !re || re.test(l)).map((l) => esc(l.replace(/\/srv\/eccube/g, '/var/www/html').replace(/\s*\[\]\s*$/, '').slice(0, 150)));
  const logFile = (L) => ((L && L.file) || 'var/log/prod/site.log').replace(/\d{4}-\d{2}-\d{2}/, '2026-09-24');

  /* ------------------------------------------------------------- frames */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? EC.el(el) : el; if (!e) return null; const r = screenRect(e); if (!r.width) return null; return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const SR = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const termFind = (text, n = 1, w = 1200) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    let i = -1;
    rows.forEach((r, k) => { if (r.textContent.includes(text)) i = k; });
    if (i < 0) return null;
    const a = screenRect(rows[i]), b = screenRect(rows[Math.min(rows.length - 1, i + n - 1)]);
    return { left: a.left, top: a.top, width: Math.min(w, a.width), height: b.bottom - a.top };
  };
  const say = (text, ms) => { Caption.set(text); return readHold(ms != null ? ms : Math.min(4200, Math.max(1600, text.length * 55))); };
  const T = (sel, re) => LM.text(sel, re);
  /** the smallest element of a live page with that text */
  const storeText = (sel, re) => { const d = Store.doc; if (!d) return null; const all = [...d.querySelectorAll(sel)].filter((e) => re.test(e.textContent)); return all.length ? all[all.length - 1] : null; };
  /** a frame around lines of a file shown in the editor, found by their text */
  const frameLines = (path, a, b, label, o = {}) => {
    const t = Code.text(path);
    const i = lineOf(t, a, o.from || 0);
    const j = b ? lineOf(t, b, i) : i;
    if (i < 0) return Promise.resolve();
    return Code.reveal(Math.round((i + Math.max(i, j)) / 2), 500).then(() => { const rc = linesRect(i, Math.max(i, j), o.w || 1100); if (o.issue) Issue.show(rc, label); else Issue.ok(rc, label); return readHold(o.ms || 2600); });
  };

  /* ------------------------------------------------ the plugin's folders in the explorer */
  const DIRS = ['', '/Form', '/Form/Extension', '/Resource', '/Resource/assets', '/Resource/assets/js', '/Resource/config', '/Resource/template',
    '/Resource/template/default', '/Resource/template/default/Shopping', '/Service', '/Service/Method'].map((d) => 'app/Plugin/LmealPayment' + d);
  function addDirs(dirs, afterPath) {
    let at = Code.tree.findIndex((n) => n.path === afterPath);
    if (afterPath.startsWith('app/Plugin/LmealPayment/Service/Method')) {
      Code.tree.forEach((n, i) => { if (n.path.startsWith('app/Plugin/LmealPayment/Service/Method')) at = i; });
    }
    Code.tree.splice(at + 1, 0, ...dirs.map((p) => ({ path: p, dir: true, open: true })));
    Code.renderTree();
  }
  /** a new file of the plugin: the explorer's new file, then pasted (o.type: [from, to) lines typed) */
  async function newPluginFile(rel, o = {}) {
    const path = full(rel);
    const text = rel === 'LmealPaymentEvent.php' ? SRC.event(o.stage || 1) : src(rel);
    await Code.newFile(path);
    Code.files[path].indent = '    ';
    if (!o.type) await Code.paste(text.replace(/\n$/, ''), { after: o.after });
    else {
      const A = text.replace(/\n$/, '').split('\n');
      const [a, b] = o.type;
      await Code.paste(A.slice(0, a).join('\n'), { after: 200 });
      await Code.type(script(A.slice(a, b), A[a - 1]), { kps: o.kps || 24 });
      if (b < A.length) await Code.paste('\n' + A.slice(b).join('\n'), { flash: false, after: 200 });
    }
    await Code.save({ status: 'U' });
    check(path, text.replace(/\n$/, ''), rel);
    return path;
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request, the live shop's payments, the dev copy's 支払方法 */
  scene('request', async () => {
    Caption.step(1);
    const RQ = 'docs/request-2026-09.md';
    await say('依頼（EC チーム）：EC-CUBE 4.3 の新しい環境にカード決済（トークン方式）、GMO後払いの条件、冷凍庫レンタルはカードのみ');
    await hoverUi(Code.lineEl(2), { ax: 0.3, hold: 400 });
    await frameLines(RQ, '## 1.', '開発環境は代行会社', 'クレジットカード決済（トークン方式・入金済み・取引 ID）', { ms: 3600 });
    await frameLines(RQ, '## 2.', 'ご利用限度額', 'GMO後払い：手数料 0 円・55,000 円まで', { ms: 3000 });
    await frameLines(RQ, '## 3.', '冷凍庫レンタルのお申込み', '冷凍庫レンタルはカードのみ', { ms: 2600 });
    Issue.hide();
    // the live shop: 特定商取引法に基づく表記 › 支払方法
    await Win.switchTo('browser');
    await LM.tab('live');
    await say('公開中のライフミール（株式会社シルバーライフ）：健康冷凍弁当の定期便。特定商取引法に基づく表記の「支払方法」');
    const pay = storeText('th, dt, h2, h3, p, td', /^\s*支払方法\s*$/);
    const payRow = pay && (pay.closest('tr, dl') || pay.parentElement);
    if (payRow) {
      await Store.scrollToEl(payRow, 200, 1400);
      Issue.ok(SR(payRow, 4), 'クレジットカード・GMO後払い・Amazon Pay');
      await readHold(3000);
    } else { await Store.scroll(900, 1400); await readHold(2000); }
    const lim = storeText('p, li, td, dd', /ご利用限度額/);
    if (lim) {
      await Store.scrollToEl(lim, 320, 1200);
      Issue.ok(SR(lim, 4), 'GMO後払い：累計 55,000 円（税込）まで');
      await readHold(2800);
    }
    const fee = storeText('p, li, td, dd', /後払い手数料/);
    if (fee) { Issue.ok(SR(fee, 4), '後払い手数料 0 円'); await readHold(2200); }
    Issue.hide();
    // the dev copy: 支払方法設定
    await Browser.newTab('admin');
    await Browser.typeUrl('localhost:8080/admin/setting/shop/payment');
    await LM.ec('admin', 'pay-list-0', { load: 1300 });
    mark('payList0');
    await say('開発環境（EC-CUBE 4.3・本番の商品と設定のコピー）の支払方法設定：GMO後払いだけ。カード決済はこれから組み込む');
    const g = T('a', /^GMO後払い$/);
    const row = g && (g.closest('li, tr') || g);
    if (row) { await hoverUi(g, { hold: 500 }); Issue.ok(R(row, 2), 'GMO後払い（手数料 ￥330）'); await readHold(2600); Issue.hide(); }
  });

  /* 2 — GMO後払い: 手数料, 利用条件 */
  scene('gmo', async () => {
    Caption.step(2);
    W11.skipTo('10:16');
    const g = T('a', /^GMO後払い$/);
    await clickUi(g, { kind: 'hand', after: 60 });
    await LM.ec('admin', 'pay-gmo', { load: 900 });
    Caption.issue('手数料', '後払い手数料が 330 円のまま。特定商取引法の表記は「後払い手数料 0円」');
    const ch = EC.field('charge');
    Issue.show(R(ch, 4), '手数料 ￥330');
    await readHold(3200);
    Issue.hide();
    await LM.type('charge', '0', { clear: true });
    await say('利用条件の上限に 55,000 円：注文の合計がこれを超えると、ご注文手続きの支払方法に出なくなる');
    await LM.type('rule_max', '55000', { kps: 9 });
    const help = EC.el('[data-bs-toggle="tooltip"], [data-toggle="tooltip"], .fa-question-circle');
    if (help) await hoverUi(help, { hold: 300 });
    Issue.ok(R(() => { const a = EC.field('rule_min'); const b = EC.field('rule_max'); return a && b ? (a.closest('.row') || b.parentElement.parentElement) : null; }, 4), '￥0 〜 ￥55,000');
    await readHold(2400);
    Issue.hide();
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await LM.ec('admin', 'pay-gmo-saved', { load: 1000 });
    mark('gmoSaved');
    Caption.fixed('GMO後払い：手数料 0 円・利用条件 〜55,000 円（保存しました）');
    const ok = EC.el('.alert-success, .alert');
    if (ok) Issue.ok(R(ok, 3), '保存しました');
    await readHold(2600);
    Issue.hide();
  });

  /* 3 — the plugin: PaymentMethodInterface, CreditCard, CardGateway, the token, the card form */
  scene('plugin', async () => {
    Caption.step(3);
    W11.skipTo('10:21');
    await Win.switchTo('code');
    const PI = 'src/Eccube/Service/Payment/PaymentMethodInterface.php';
    await openAt(PI, { top: 14 });
    await say('EC-CUBE の決済の拡張ポイント：PaymentMethodInterface（verify → apply → checkout）を実装したクラスを支払方法に結びつける');
    await frameLines(PI, 'public function verify();', null, 'verify()：確認画面へ進むとき', { ms: 2000 });
    await frameLines(PI, 'public function checkout();', null, 'checkout()：決済の実行', { ms: 2000 });
    await frameLines(PI, 'public function apply();', null, 'apply()：決済の前処理（リンク式ならリダイレクト）', { ms: 2400 });
    Issue.hide();
    const SC = 'src/Eccube/Controller/ShoppingController.php';
    await openAt(SC, { top: 820 });
    await say('注文処理は、支払方法の method_class（クラス名）のサービスを取り出して呼ぶ');
    await frameLines(SC, 'private function createPaymentMethod(', 'return $PaymentMethod;', 'method_class のサービス', { ms: 3000 });
    Issue.hide();
    // the plugin's folders
    await panel(false);
    await run('mkdir app\\Plugin\\LmealPayment\\Service\\Method, app\\Plugin\\LmealPayment\\Form\\Extension, app\\Plugin\\LmealPayment\\Resource\\config, app\\Plugin\\LmealPayment\\Resource\\template\\default\\Shopping, app\\Plugin\\LmealPayment\\Resource\\assets\\js | Out-Null', [], { kps: 40 });
    addDirs(DIRS, 'app/Plugin');
    await Code.panel(false);
    await say('プラグイン LmealPayment：composer.json（コード）と PluginManager（有効化で支払方法「クレジットカード決済」を登録）');
    await newPluginFile('composer.json');
    await newPluginFile('PluginManager.php');
    await frameLines(full('PluginManager.php'), "$Payment->setMethod('クレジットカード決済')", '->setSortNo(', '支払方法を登録（method_class）', { ms: 3000 });
    Issue.hide();
    // CreditCard: the head pasted, checkout() typed
    await say('Service/Method/CreditCard：verify でトークンの有無、apply で「決済処理中」、checkout で決済して「入金済み」');
    const CC = 'Service/Method/CreditCard.php';
    const A = src(CC).replace(/\n$/, '').split('\n');
    const ci = A.findIndex((l) => l.includes('public function checkout()'));
    const ce = A.findIndex((l, i) => i > ci && l.includes('return $result->setSuccess(true);'));
    await newPluginFile(CC, { type: [ci + 2, ce + 1], kps: 30 });
    await frameLines(full(CC), 'public function verify()', 'return $result->setSuccess(true);', 'verify：カード情報（トークン）', { ms: 2200 });
    await frameLines(full(CC), '$token = (string)', '$res = $this->gateway->charge(', 'トークンで決済（代行会社）', { ms: 2400, from: ci });
    await frameLines(full(CC), '$this->shoppingPurchaseFlow->commit(', '$this->Order->setPaymentDate(', '注文を確定 → 入金済み・入金日', { ms: 2600, from: ci });
    await frameLines(full(CC), '$this->Order->setNote(', 'appendCompleteMailMessage(', '取引 ID・完了画面とメールの案内', { ms: 2600, from: ci });
    Issue.hide();
    // CardGateway (test mode), the token field, the card form, the token JS, the event
    await say('CardGateway：代行会社の API。開発環境はテストモード（接続せず、テスト用トークンに決まった応答）');
    await newPluginFile('Service/CardGateway.php');
    await frameLines(full('Service/CardGateway.php'), 'private function sandbox(', "'last4' => $m[2],", 'テストモード', { ms: 2400 });
    Issue.hide();
    await newPluginFile('Resource/config/services.yaml');
    await say('注文手続きのフォームにトークンの項目（FormTypeExtension）。カード番号そのものはショップに送らない');
    await newPluginFile('Form/Extension/OrderTypeExtension.php');
    await frameLines(full('Form/Extension/OrderTypeExtension.php'), "$builder->add('lmeal_card_token'", "'required' => false,", 'mapped => false の hidden', { ms: 2200 });
    Issue.hide();
    await say('カード情報の入力欄（Twig）：入力欄に name を付けず、トークン JS がトークンに替えて lmeal_card_token だけを送る');
    await newPluginFile('Resource/template/default/Shopping/card_form.twig');
    await frameLines(full('Resource/template/default/Shopping/card_form.twig'), 'カード番号・有効期限', '代行会社のトークン JS', 'カード番号はサーバーに送らない', { ms: 2600 });
    await frameLines(full('Resource/template/default/Shopping/card_form.twig'), 'LmealToken.create({', 'form.submit();', 'トークンを作ってから送信', { ms: 2200 });
    Issue.hide();
    await newPluginFile('Resource/assets/js/token-sandbox.js');
    await say('LmealPaymentEvent：お支払方法がクレジットカード決済のとき、注文手続きの画面にカード情報の入力欄（TemplateEvent）');
    await newPluginFile('LmealPaymentEvent.php', { stage: 1 });
    await frameLines(full('LmealPaymentEvent.php'), "'Shopping/index.twig' => 'onShoppingIndex',", null, 'Shopping/index.twig', { ms: 1800 });
    await frameLines(full('LmealPaymentEvent.php'), '$event->addSnippet(', null, 'スニペット', { ms: 1800 });
    Issue.hide();
  });

  /* 4 — install / enable, プラグイン一覧, 支払方法一覧, 配送方法 */
  scene('install', async () => {
    Caption.step(4);
    W11.skipTo('10:38');
    await panel(true);
    await say('bin/console でインストールと有効化（PluginManager::enable が支払方法を登録）');
    await run(DC + 'bin/console eccube:plugin:install --code=LmealPayment', ['', ...consoleOut(DATA.installOut || ' [OK] Installed.')], { kps: 30 });
    await run(DC + 'bin/console eccube:plugin:enable --code=LmealPayment', ['', ...consoleOut(DATA.enableOut || ' [OK] Plugin Enabled.')], { kps: 30 });
    Issue.ok(termFind('[OK]', 1, 700), 'インストール・有効化');
    await readHold(1800);
    Issue.hide();
    await Code.panel(false);
    await Win.switchTo('browser');
    await LM.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/store/plugin');
    await LM.ec('admin', 'plugins', { load: 1100 });
    await say('オーナーズストア › プラグイン一覧：独自プラグインに LmealPayment（有効）');
    const pr = T('tr', /LmealPayment|ライフミール/);
    if (pr) { await hoverUi(pr, { hold: 400 }); Issue.ok(R(pr, 2), 'LmealPayment 1.0.0 — 有効'); await readHold(2600); Issue.hide(); }
    await Browser.typeUrl('localhost:8080/admin/setting/shop/payment');
    await LM.ec('admin', 'pay-list-1', { load: 900 });
    const cc = T('a', /^クレジットカード決済$/);
    const crow = cc && (cc.closest('li, tr') || cc);
    if (crow) { await hoverUi(cc, { hold: 400 }); Issue.ok(R(crow, 2), 'クレジットカード決済（プラグインが登録）'); await readHold(2400); Issue.hide(); }
    // 配送方法: 取扱支払方法
    await Browser.typeUrl('localhost:8080/admin/setting/shop/delivery/1/edit');
    await LM.ec('admin', 'deliv', { load: 1000 });
    Caption.issue('取扱支払方法', '支払方法は配送方法ごとに選ぶ。冷凍便にチェックがないと、ご注文手続きに出ない');
    const id = DATA.cardPayment && DATA.cardPayment.id;
    const box = id && EC.el(`input[type=checkbox][name*="payments"][value="${id}"]`);
    const boxes = EC.els('input[type=checkbox][name*="payments"]');
    const group = boxes.length ? (boxes[0].closest('.card') || boxes[0].closest('.row') || boxes[0].parentElement) : null;
    if (group) Issue.show(R(group, 6), '取扱支払方法');
    await readHold(2800);
    Issue.hide();
    if (box) { await clickUi(box, { after: 160 }); LM.check(box); }
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await LM.ec('admin', 'deliv-saved', { load: 1000 });
    mark('delivSaved');
    const box2 = id && EC.el(`input[type=checkbox][name*="payments"][value="${id}"]`);
    Caption.fixed('ライフミール 冷凍便：GMO後払い・クレジットカード決済');
    if (box2) Issue.ok(R(box2.closest('.form-check, label, div') || box2, 4), 'クレジットカード決済');
    await readHold(2600);
    Issue.hide();
  });

  /* 5 — a test order: 購入エラー, the fix, ご注文完了 */
  scene('order', async () => {
    Caption.step(5);
    W11.skipTo('10:44');
    await Browser.newTab('shop');
    await Browser.typeUrl('localhost:8080/products/detail/2');
    await LM.ec('shop', 'product-2', { load: 1400 });
    await say('開発環境のショップでテスト注文（テストのお客様でログイン済み）：お得便 10食プラン ￥5,100');
    await clickUi(EC.el('button.add-cart, #form1 button[type=submit]'), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'cart-1', { load: 1000 });
    await clickUi((EC.el('a.ec-blockBtn--action[href*="buystep"]') || EC.el('.ec-cartRole a.ec-blockBtn--action')), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'shop-1', { load: 1300 });
    const radios = () => EC.els('#shopping-form input[type=radio][name$="[Payment]"]');
    const radioOf = (re) => radios().find((r) => re.test(((r.closest('div') || r.parentElement).textContent || '')));
    const card = radioOf(/クレジットカード決済/);
    const payBox = () => EC.el('#shopping-form .ec-orderPayment');
    if (payBox()) { await EC.scroll(Math.max(0, payBox().getBoundingClientRect().top + EC.doc().defaultView.scrollY - 300), 900); Issue.ok(R(payBox, 4), 'お支払方法：GMO後払い・クレジットカード決済'); await readHold(2400); Issue.hide(); }
    await clickUi(card && (card.closest('div') || card), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'shop-card', { load: 1100 });
    mark('cardForm');
    await say('クレジットカード決済を選ぶと、お支払方法の下にカード情報の入力欄（テストモード）');
    const cf = EC.el('#lmeal-card');
    if (cf) { Issue.ok(R(cf, 4), 'カード情報（テストモード）'); await readHold(2200); Issue.hide(); }
    Caption.set('テスト用のカード番号（公開されているテスト番号 4111 1111 1111 1111）');
    const C = SRC.TEST_CARD;
    await LM.type('card_number', C.number, { kps: 14 });
    await LM.type('card_exp', C.exp, { kps: 10 });
    await LM.type('card_cvc', C.cvc, { kps: 10 });
    await LM.type('card_name', C.name, { kps: 12 });
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'confirm-1', { load: 1300 });
    await say('ご注文内容のご確認：お支払方法「クレジットカード決済」→「注文する」');
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'error-1', { load: 1600 });
    mark('error1');
    Caption.issue('購入エラー', '「カード情報（トークン）がありません。」— 入力したカードのトークンが checkout() に届いていない');
    const em = T('.ec-alert-warning, .ec-alert-danger, .ec-reportDescription, p, div', /トークン/);
    if (em) Issue.show(R(em, 6), 'カード情報（トークン）がありません。');
    await readHold(3600);
    Issue.hide();
    // the log, skip_add_form
    await Win.switchTo('code');
    await panel(true);
    const L = DATA.errorLog;
    await run(`Get-Content ${logFile(L).replace(/\//g, '\\')} -Tail 200 | Select-String "カード決済|checkout"`, logOut(L).length ? logOut(L) : ['[カード決済] 決済エラー token_missing'], { kps: 34 });
    Issue.show(termFind('token_missing', 1, 1400), 'token_missing：トークンが空');
    await readHold(2800);
    Issue.hide();
    await Code.panel(false);
    const SC = 'src/Eccube/Controller/ShoppingController.php';
    await openAt(SC, { top: 410 });
    await say('注文処理（checkout）のフォームは skip_add_form：確認画面から送られてくる値（_token）しか受け取らない');
    await frameLines(SC, '// 確認画面から注文処理へ遷移する場合は', "'skip_add_form' => true,", 'skip_add_form', { issue: true, ms: 3600 });
    Issue.hide();
    // the fix: the token on the confirm page
    await say('直す：確認画面（Shopping/confirm.twig）にもスニペットでトークンを入れ、「注文する」で送り直す');
    const EV = full('LmealPaymentEvent.php');
    await openAt(EV, { top: 0 });
    const E2 = SRC.event(2).replace(/\n$/, '').split('\n');
    await Code.lineAfter("'Shopping/index.twig' => 'onShoppingIndex',", script([E2[E2.findIndex((l) => l.includes("'Shopping/confirm.twig'"))].trim()]).slice(0), { kps: 30 });
    const m0 = E2.findIndex((l) => l.includes('* 注文確認：'));
    const m1 = E2.findIndex((l, i) => i > m0 && l === '    }');
    const at = lineOf(Code.text(EV), 'private function isCard(') - 1;
    await Code.reveal(at, 400);
    await Code.newLineAfter(at);
    await Code.type(script(E2.slice(m0 - 1, m1 + 1).concat(['']), ''), { kps: 30 });
    await Code.save();
    check(EV, SRC.event(2).replace(/\n$/, ''), 'event 2');
    await newPluginFile('Resource/template/default/Shopping/card_confirm.twig');
    await frameLines(full('Resource/template/default/Shopping/card_confirm.twig'), 'form_widget(form.lmeal_card_token', null, "form 属性で #shopping-form に入れる", { ms: 2400 });
    Issue.hide();
    await openAt(EV, { top: 0 });
    await wait(400);
    await panel(true);
    await wait(500);
    await cacheClear();
    await Code.panel(false);
    // again
    W11.skipTo('10:58');
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/shopping');
    await LM.ec('shop', 'shop-card', { load: 1300 });
    await LM.type('card_number', C.number, { kps: 16, reset: true });
    await LM.type('card_exp', C.exp, { kps: 12, reset: true });
    await LM.type('card_cvc', C.cvc, { kps: 12, reset: true });
    await LM.type('card_name', C.name, { kps: 14, reset: true });
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'confirm-2', { load: 1200 });
    await clickUi(EC.el('#shopping-form button.ec-blockBtn--action'), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'complete', { load: 1800 });
    mark('complete');
    Caption.fixed('ご注文完了：「クレジットカード（VISA ****1111）でのお支払いが完了しました。」');
    const done = T('p', /お支払いが完了しました/);
    if (done) Issue.ok(R(done, 6), 'appendCompleteMessage');
    await readHold(3200);
    Issue.hide();
  });

  /* 6 — 受注管理: 入金済み, 入金日, 取引 ID; the mail */
  scene('orders', async () => {
    Caption.step(6);
    W11.skipTo('11:01');
    await LM.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/order');
    await LM.ec('admin', 'orders-1', { load: 1200 });
    await say('受注管理：カード決済の注文は「入金済み」で入る（後払いや振込は「新規受付」）');
    const st = T('span, td, .badge', /^入金済み$/);
    const orow = st && st.closest('tr');
    if (orow) { await hoverUi(orow, { hold: 400 }); Issue.ok(R(orow, 2), '入金済み'); await readHold(2800); Issue.hide(); }
    const no = orow && orow.querySelector('a[href*="/edit"]');
    await clickUi(no || T('a', /^\d+$/), { kind: 'hand', after: 60 });
    await LM.ec('admin', 'order-edit', { load: 1200, url: DEV + `/admin/order/${(DATA.order1 && DATA.order1.id) || 1}/edit` });
    const pd = T('div, dt, th, label', /^入金日$/);
    const pdRow = pd && (pd.closest('.row') || pd.parentElement);
    await say('受注登録：対応状況「入金済み」と入金日（checkout() で設定）');
    if (pdRow) { Issue.ok(R(pdRow, 3), '入金日'); await readHold(2400); Issue.hide(); }
    await LM.ec('admin', 'order-edit-note', { load: 0 });
    const note = EC.el('#order_note, textarea[name*="[note]"]');
    if (note) { await hoverUi(note, { hold: 300 }); Issue.ok(R(note, 4), 'ショップ用メモ：取引 ID・カード（下 4 桁）'); await readHold(3000); Issue.hide(); }
    if (EC.has && EC.has('order-mail-confirm')) {
      await say('メール通知：注文受付メールに、お支払い完了の案内（appendCompleteMailMessage）');
      await Browser.typeUrl(`localhost:8080/admin/order/${(DATA.order1 && DATA.order1.id) || 1}/mail`);
      await LM.ec('admin', 'order-mail-confirm', { load: 1200 });
      mark('mail');
      const rect = LM.textRect(/クレジットカード（VISA \*{4}\d{4}）でのお支払いが完了しました。/);
      const r0 = rect();
      if (r0) {
        await EC.scroll(Math.max(0, r0.top - 560 + EC.doc().defaultView.scrollY), 1400);
        Issue.ok(rect, 'お支払い完了の案内（appendCompleteMailMessage）');
        await readHold(3200);
        Issue.hide();
      }
    }
  });

  /* 7 — 冷凍庫レンタル only by card (PurchaseFlow), 8回まとめ買い 20食 over 55,000 円 */
  scene('rules', async () => {
    Caption.step(7);
    W11.skipTo('11:08');
    await LM.tab('live');
    Browser.nav('live', { url: LIVE + '/faq', title: TITLE('faq') });
    Browser.loading('live', true);
    await Store.load('faq');
    Browser.loading('live', false);
    const fq = storeText('p, li, dd, div', /冷凍庫レンタルをご希望の場合はクレジットカードのみ/);
    await say('公開中の FAQ：「冷凍庫レンタルをご希望の場合はクレジットカードのみ選択可能」');
    if (fq) { await Store.scrollToEl(fq, 320, 1500); Issue.ok(SR(fq, 4), '冷凍庫レンタル → カードのみ'); await readHold(3000); Issue.hide(); }
    await Win.switchTo('code');
    await say('PurchaseFlow のバリデーター（@ShoppingFlow）：冷凍庫レンタル（LM-FREEZER）があってカード以外なら警告');
    const VP = 'Service/PurchaseFlow/FreezerRentalPaymentValidator.php';
    // the explorer folded a little (Form, Resource, src) so the new file's name box stays in view
    Code.tree.forEach((n) => { if (n.dir && ['src', 'docs', 'app/Plugin/LmealPayment/Form', 'app/Plugin/LmealPayment/Resource'].includes(n.path)) n.open = false; });
    addDirs(['app/Plugin/LmealPayment/Service/PurchaseFlow'], 'app/Plugin/LmealPayment/Service/Method');
    const V = src(VP).replace(/\n$/, '').split('\n');
    const vi = V.findIndex((l) => l.includes('protected function validate('));
    const ve = V.length - 2;
    await newPluginFile(VP, { type: [vi + 2, ve], kps: 30 });
    await frameLines(full(VP), '* @ShoppingFlow', null, '注文手続きのフローに追加', { ms: 2000 });
    await frameLines(full(VP), 'foreach ($itemHolder->getProductOrderItems()', "null, true);", '警告（true）：注文手続きに戻す', { ms: 2600 });
    Issue.hide();
    await panel(false);
    await cacheClear();
    await Code.panel(false);
    // 冷凍庫 + GMO後払い
    await Win.switchTo('browser');
    await LM.tab('shop');
    await Browser.typeUrl('localhost:8080/cart');
    await LM.ec('shop', 'cart-freezer', { load: 1100 });
    await say('カート：10食プラン＋保存用冷凍庫 無料レンタル（￥0）');
    await clickUi((EC.el('a.ec-blockBtn--action[href*="buystep"]') || EC.el('.ec-cartRole a.ec-blockBtn--action')), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'shop-freezer-warn', { load: 1300 });
    mark('freezerWarn');
    Caption.issue('GMO後払いでは注文できない', '「冷凍庫レンタルをお申込みの場合は、クレジットカード決済のみご利用いただけます。」');
    const w = EC.el('.ec-alert-warning') || T('div, p', /冷凍庫レンタルをお申込み/);
    if (w) Issue.show(R(w, 4), '警告（確認画面へ進めない）');
    await readHold(3400);
    Issue.hide();
    const radios = () => EC.els('#shopping-form input[type=radio][name$="[Payment]"]');
    const card = radios().find((r) => /クレジットカード決済/.test((r.closest('div') || r.parentElement).textContent));
    await clickUi(card && (card.closest('div') || card), { kind: 'hand', after: 60 });
    await LM.ec('shop', 'shop-freezer-card', { load: 1100 });
    Caption.fixed('クレジットカード決済にすると警告は消え、カード情報の入力欄');
    const cf = EC.el('#lmeal-card');
    if (cf) Issue.ok(R(cf, 4), 'カードで申し込み');
    await readHold(2400);
    Issue.hide();
    // 8回まとめ買い 20食 (63,200 円)
    await Browser.typeUrl('localhost:8080/shopping');
    await LM.ec('shop', 'shop-limit', { load: 1300 });
    mark('limit');
    await say('8回まとめ買い 20食プラン（￥63,200）：GMO後払いの上限 55,000 円を超えるので、お支払方法はクレジットカード決済だけ');
    const pb = EC.el('#shopping-form .ec-orderPayment');
    if (pb) { Issue.ok(R(pb, 4), 'GMO後払いが出ない（利用条件）'); await readHold(3000); Issue.hide(); }
    // the orders now
    await LM.tab('admin');
    await Browser.typeUrl('localhost:8080/admin/order');
    await LM.ec('admin', 'orders-2', { load: 1200 });
    await say('受注一覧：カード決済の 2 件は「入金済み」、GMO後払いの注文は「新規受付」');
    const rows = EC.els('table tbody tr');
    if (rows.length) { Issue.ok(R(() => EC.el('table'), 2), '入金済み / 新規受付'); await readHold(3000); Issue.hide(); }
  });

  /* 8 — git, the production server, the live shop */
  scene('deploy', async () => {
    Caption.step(8);
    W11.skipTo('11:24');
    await Win.switchTo('code');
    await panel(true);
    await say('コミットして本番へ。本番は .env を本番モード（代行会社の本番の接続情報）にしてからプラグインを有効化');
    const files = Object.keys(SRC.files(3)).sort();
    await run('git add -A; git commit -m "決済：カード決済プラグイン LmealPayment・冷凍庫レンタルはカードのみ"', [
      esc('[main 4c1d7a2] 決済：カード決済プラグイン LmealPayment・冷凍庫レンタルはカードのみ'),
      ` ${files.length} files changed, ${files.reduce((n, f) => n + SRC.files(3)[f].split('\n').length, 0)} insertions(+)`,
      ...files.slice(0, 5).map((f) => ` create mode 100644 ${f}`), ' …'], { kps: 34 });
    await run('git push', ['To github.com:silverlife/lmeal-eccube.git', '   9e03b51..4c1d7a2  main -&gt; main'], { kps: 20 });
    await run('ssh lmeal-prod "cd /var/www/eccube && ./deploy.sh && bin/console eccube:plugin:install --code=LmealPayment && bin/console eccube:plugin:enable --code=LmealPayment"', [
      'Updating 9e03b51..4c1d7a2', 'Fast-forward', ` ${files.length} files changed`,
      ...consoleOut(DATA.installOut || ' [OK] Installed.').filter((l) => /OK/.test(l)),
      ...consoleOut(DATA.enableOut || ' [OK] Plugin Enabled.').filter((l) => /OK/.test(l)),
      'LMEAL_PAYMENT_MODE=production（.env.local）', '<span class="tg">deploy: done</span>'], { kps: 26 });
    Issue.ok(termFind('deploy: done', 1, 500), '本番へ反映');
    await readHold(2200);
    Issue.hide();
    await Code.panel(false);
    // the live plan page
    await Win.switchTo('browser');
    await LM.tab('live');
    await Browser.typeUrl('l-meal.com/shopping/plan');
    Browser.nav('live', { url: LIVE + '/shopping/plan', title: TITLE('plan') });
    Browser.loading('live', true);
    await Store.load('plan');
    Browser.loading('live', false);
    mark('live');
    await say('公開中のプランの選択：冷凍庫無料レンタルは「クレジットカード決済にてお申込み」のお客様');
    const fr = storeText('p, li, a, button, div', /冷凍庫無料レンタルを申し込む/);
    if (fr) { await Store.scrollToEl(fr, 360, 1600); Issue.ok(SR(fr, 4), '冷凍庫無料レンタル'); await readHold(2600); Issue.hide(); } else { await Store.scroll(900, 1600); }
    D.Cursor.kind('arrow');
    Caption.set('EC-CUBE 4.3：PaymentMethodInterface のカード決済（トークン方式）、支払方法の手数料・利用条件、配送方法の取扱支払方法、PurchaseFlow の支払条件');
    await wait(5200);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['tradelaw', 'faq', 'plan'],
    fontText: JSON.stringify(JA) + P['docs/request-2026-09.md'] + Object.values(F.PLUGIN).join('') + '支払方法入金済み購入エラー',
    async prepare() {
      const tree = [
        ['app', 'dir', 1], ['app/Customize', 'dir'], ['app/Plugin', 'dir', 1], ['app/config', 'dir'], ['app/proxy', 'dir'], ['app/template', 'dir'],
        ['bin', 'dir'], ['docs', 'dir', 1], ['docs/request-2026-09.md'], ['html', 'dir'],
        ['src', 'dir', 1], ['src/Eccube', 'dir', 1], ['src/Eccube/Controller', 'dir', 1], ['src/Eccube/Controller/ShoppingController.php'],
        ['src/Eccube/Service', 'dir', 1], ['src/Eccube/Service/Payment', 'dir', 1], ['src/Eccube/Service/Payment/Method', 'dir', 1],
        ['src/Eccube/Service/Payment/Method/Cash.php'], ['src/Eccube/Service/Payment/PaymentMethodInterface.php'],
        ['var', 'dir'], ['vendor', 'dir'], ['.env'], ['.gitignore'], ['composer.json'], ['README.md'],
      ];
      Code.init({ ...P }, tree);
      Code.show('docs/request-2026-09.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: TITLE('tradelaw'), url: LIVE + '/help/tradelaw', page: 'store', fav: 'store' });
      await Store.load('tradelaw');
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      LM.blur();
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
