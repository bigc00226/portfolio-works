/*
 * Timeline: 販促品直ナビ（www.chokunavi.shop, EC-CUBE 4; 敷島産業株式会社）— サーバー・セキュリティ・保守: the request (保守契約の
 * 初回の点検), what anyone sees from outside (response headers, the template's scripts = EC-CUBE 4.1's default_frame, the
 * certificate, no DNS for the bare domain) → the staging copy (EC-CUBE 4.3.1): ホーム, システム情報, プラグイン一覧, ログイン履歴
 * (failed logins at /admin from elsewhere), ログ表示 → セキュリティ管理's warning, the security-check plugin (Securitychecker42) and its
 * result → 担当者ごとのアカウント (ops01) and 2段階認証, 管理画面URL・許可IP (TRUSTED_PROXIES), 403 / 404 / the lockout, admin's 2FA set-up
 * → .htaccess (the live headers come from it), nginx.conf.sample, the production server's Apache / PHP / .env permissions → backup
 * (VACUUM INTO, tar), the staged loss and the restore → 4.3.1-p1 (the MFA bypass: /two_factor_auth/set without the code), メンテナンス
 * モード (503), the patch, cache:clear, システム情報 4.3.1-p1, the bypass closed, メンテナンス off → production (reconstructed), cron /
 * logrotate / monitoring, the live shop, the report.
 * Every EC-CUBE screen and output is real: EC-CUBE 4.3.1 → 4.3.1-p1 running locally (js/ec-snapshot.js —
 * tools/snapshots/ec-chokunavi-maintenance/capture-ec.js); the shop is the live www.chokunavi.shop (js/site-snapshot.js); the
 * headers / certificate / script tags are what www.chokunavi.shop sends (outside.js). docker, git and the servers are reconstructions.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, EC = window.EC, W11 = window.Win11, CN = window.CN;
  const { esc, wait, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, readHold } = K;
  const LIVE = CN.LIVE, DEV = CN.DEV;
  const DATA = EC.data || {};
  const SRC = window.CN_SRC || {};
  const OUT = SRC.outside || {};
  const S = window.SITE_SNAPSHOT;
  const TITLE = (k) => ((S && S.pages[k] && S.pages[k].pc || '').match(/<title>([^<]*)<\/title>/) || [])[1] || (S && S.title) || '販促品直ナビ';
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));
  const nl = (s) => String(s || '').replace(/\r/g, '').replace(/\n+$/, '');
  const ROUTE = 'mng_7f3k2q';
  const ADM = DEV + '/' + ROUTE;

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    unei: { r: 'unneitantou', segs: ['運営', '担当'] },
    dept: { r: 'unnei', segs: ['運営'] },
  };

  /* ------------------------------------------------ what the commands print */
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 26, ...o });
  const DC = 'docker compose exec ec-cube ';
  const PROD = 'PS C:\\work\\chokunavi-eccube> ';
  const tone = (l) => {
    const e = esc(l);
    if (/\b(403|404|500|503)\b|Forbidden|Not Found|Unavailable|-rw-rw-r--|DNS 名/.test(l)) return `<span class="terr">${e}</span>`;
    if (/\b200 OK\b|^\s*200\s*$|\[OK\]|Syntax OK|^ok$|^\s*ok\s*$/.test(l)) return `<span class="tok">${e}</span>`;
    return e;
  };
  const toned = (arr) => (arr || []).map(tone);
  /** bin/console's own output (captured) */
  const consoleOut = (text) => String(text || '').replace(/\r/g, '').split('\n').map((l) => esc(l).replace(/^(\s*)\[OK\]/, '$1<span class="tg">[OK]</span>'))
    .filter((l, i, a) => !(l.trim() === '' && (i === 0 || a[i - 1].trim() === '')));
  const CACHE_OK = ' [OK] Cache for the "prod" environment (debug=false) was successfully cleared.';
  const cacheLines = (s) => consoleOut((s && s.trim()) ? s : '\n // Clearing the cache for the prod environment with debug false\n\n' + CACHE_OK + '\n');

  /* the public response headers, moved to the video's clock (one ordinary request on 2026-11-18; dates shifted by the same amount) */
  const HEAD = (() => {
    const lines = OUT.head || ['HTTP/1.1 200 OK'];
    const dl = lines.find((l) => /^Date: /.test(l));
    const t0 = dl ? Date.parse(dl.slice(6)) : NaN;
    const target = Date.parse('2026-11-17T01:04:12Z');
    const shift = isNaN(t0) ? 0 : target - t0;
    const fmt = (ms, dash) => { const s = new Date(ms).toUTCString(); return dash ? s.replace(/^(\w+), (\d+) (\w+) (\d+)/, '$1, $2-$3-$4') : s; };
    return lines.map((l) => l
      .replace(/\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT/g, (m) => fmt(Date.parse(m) + shift))
      .replace(/\w{3}, \d{2}-\w{3}-\d{4} \d{2}:\d{2}:\d{2} GMT/g, (m) => fmt(Date.parse(m.replace(/-/g, ' ')) + shift, true)));
  })();
  const CERT = OUT.cert || {};
  const jst = (s) => { const d = new Date(Date.parse(s) + 9 * 3600e3); const p = (n) => String(n).padStart(2, '0'); return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())} ${d.getUTCHours()}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`; };
  const dn = (o) => Object.entries(o || {}).reverse().map(([k, v]) => `${k}=${v}`).join(', ');

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
  const T = (sel, re) => CN.text(sel, re);
  const frameLines = (path, a, b, label, o = {}) => {
    const t = Code.text(path);
    const i = lineOf(t, a, o.from || 0);
    const j = b ? lineOf(t, b, i) : i;
    if (i < 0) return Promise.resolve();
    return Code.reveal(Math.round((i + Math.max(i, j)) / 2), 500).then(() => { const rc = linesRect(i, Math.max(i, j), o.w || 1100); if (o.issue) Issue.show(rc, label); else Issue.ok(rc, label); return readHold(o.ms || 2600); });
  };
  const hold = async (rect, label, ms = 2600, issue = false) => { if (issue) Issue.show(rect, label); else Issue.ok(rect, label); await readHold(ms); Issue.hide(); };
  const tframe = async (text, n, label, o = {}) => { const f = termFind(text, n, o.w || 1300); if (!f()) return; if (o.issue) Issue.show(f, label); else Issue.ok(f, label); await readHold(o.ms || 2400); Issue.hide(); };
  const row = (re, sel = 'tr') => T(sel, re);
  const toggleOn = (tg) => { CN.check(tg); const box = tg.closest('.row') || tg.parentElement; [...box.querySelectorAll('span, label, div')].filter((e) => !e.children.length && e.textContent.trim() === '無効').forEach((e) => { e.textContent = '有効'; }); };
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); Term.render('<span class="caret"></span>'); };
  /** a new file (explorer's new file, pasted) */
  async function newFile(path, text, o = {}) {
    // folders the explorer does not have yet (ops/apache …): added open, right after their parent
    const parts = path.split('/');
    for (let i = 2; i < parts.length; i++) {
      const dir = parts.slice(0, i).join('/');
      if (Code.tree.some((n) => n.path === dir)) continue;
      const parent = parts.slice(0, i - 1).join('/');
      const at = Code.tree.findIndex((n) => n.path === parent);
      Code.tree.splice(at + 1, 0, { path: dir, dir: true, open: true });
      Code.tree.find((n) => n.path === parent).open = true;
      Code.renderTree();
    }
    await Code.newFile(path);
    await Code.paste(nl(text), { after: o.after || 300 });
    await Code.save({ status: 'U' });
    return path;
  }
  /** an admin screen typed into the address bar */
  async function go(urlText, key, o = {}) {
    await Browser.typeUrl(urlText);
    return CN.ec(o.tab || 'stg', key, { load: o.load || 1000, ...o });
  }
  const ls = (size, name, time = '10:49', own = 'www-data www-data') => `-rw-r--r-- 1 ${own} ${String(size).padStart(8)} Nov 17 ${time} ${name}`;

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request, the live shop, what anyone sees from outside */
  scene('request', async () => {
    Caption.step(1);
    const RQ = 'docs/request-2026-11.md';
    await say('依頼（敷島産業 EC 担当）：前任から引き継いだ EC-CUBE の保守。初回は点検・管理画面の防御・バックアップ・セキュリティパッチ');
    await hoverUi(Code.lineEl(4), { ax: 0.3, hold: 400 });
    await frameLines(RQ, '## 背景', '2段階認証の回避', '設定は公開時のまま・脆弱性が未対応', { ms: 3000, issue: true });
    await frameLines(RQ, '## お願いしたいこと', '6. 監視', '点検 6 項目', { ms: 2600 });
    await frameLines(RQ, '## 引き継ぎ資料より', '作業時間', '本番の構成・admin を 3 名で共有', { ms: 2800, issue: true });
    Issue.hide();
    // the live shop
    await Win.switchTo('browser');
    await CN.tab('live');
    await say('公開中の販促品直ナビ：名入れのノベルティ・販促品。外から見える情報だけで、まず現状をつかむ');
    await Store.scroll(620, 1500);
    await readHold(1200);
    await Store.scroll(0, 900);
    // outside: headers, the template, the certificate, DNS
    await Win.switchTo('code');
    await panel(true);
    Caption.set('応答ヘッダー（誰でも見える範囲。スキャンや攻撃のようなアクセスはしない）');
    await run('curl.exe -sI https://www.chokunavi.shop/', toned(HEAD), { kps: 30, gap: 40 });
    mark('headers');
    await tframe('maintenance_token=deleted', 1, 'EC-CUBE 4.1 以降（メンテナンスモードの Cookie）', { ms: 2600 });
    await tframe('X-Frame-Options', 1, 'EC-CUBE の .htaccess と同じヘッダー（Apache）', { ms: 2000 });
    await tframe('Strict-Transport-Security', 1, 'HSTS（手前のロードバランサー）', { ms: 2200 });
    const scripts = (OUT.scripts || []).filter((s) => /^https?:/.test(s));
    const shown = scripts.map((s) => (/jquery-3\.6\.0/.test(s) ? `<script src="${s}" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>` : `<script src="${s}"></script>`));
    await run('(curl.exe -s https://www.chokunavi.shop/) -split "`n" | Select-String "<script src=.https"', ['', ...shown.map((l) => esc(l)), ''], { kps: 34 });
    await tframe('jquery-3.6.0', 3, 'EC-CUBE 4.1 の default_frame.twig と同じ 3 本（4.2 以降は front.bundle.js）', { ms: 3400 });
    await say('フロントのテンプレートは 4.1 がもと。本体を更新してもテンプレートは置き換わらない → 報告書に「次の改修の候補」');
    Term.clear();
    await run('$t = [Net.Sockets.TcpClient]::new("www.chokunavi.shop", 443); $s = [Net.Security.SslStream]::new($t.GetStream()); $s.AuthenticateAsClient("www.chokunavi.shop"); [Security.Cryptography.X509Certificates.X509Certificate2]$s.RemoteCertificate | Format-List Subject, Issuer, NotBefore, NotAfter', [
      '', `Subject   : ${esc(dn(CERT.subject) || 'CN=www.chokunavi.shop')}`, `Issuer    : ${esc(dn(CERT.issuer) || 'CN=GlobalSign GCC R46 AlphaSSL CA 2025, O=GlobalSign nv-sa, C=BE')}`,
      `NotBefore : ${CERT.valid_from ? jst(CERT.valid_from) : '2026/11/14 3:10:43'}`, `<span class="tw">NotAfter  : ${CERT.valid_to ? jst(CERT.valid_to) : '2026/12/17 10:07:07'}</span>`, ''], { kps: 60 });
    await tframe('NotAfter', 1, '証明書の期限まで 30 日', { ms: 2600, issue: true });
    await run('Resolve-DnsName chokunavi.shop', ['<span class="terr">Resolve-DnsName : chokunavi.shop : DNS 名が存在しません</span>', '<span class="terr">発生場所 行:1 文字:1</span>'], { kps: 22 });
    await tframe('DNS 名が存在しません', 1, 'www なしのドメインは DNS がない（答えるのは www. だけ）', { ms: 2800, issue: true });
    await Code.panel(false);
  });

  /* 2 — the staging copy: ホーム, システム情報, プラグイン一覧, ログイン履歴, ログ表示 */
  scene('health', async () => {
    Caption.step(2);
    W11.skipTo('10:10');
    await Win.switchTo('browser');
    await Browser.newTab('stg');
    await Browser.typeUrl('localhost:8080/admin');
    await CN.ec('stg', 'login', { load: 1300, url: DEV + '/admin/login' });
    await say('検証環境（本番のバックアップから作った EC-CUBE 4.3.1。会員・受注などの個人情報は入れない）');
    await CN.type('login_id', 'admin', { kps: 10 });
    await clickUi(T('button', /ログイン/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'home-0', { load: 1500, url: DEV + '/admin/' });
    mark('home0');
    await readHold(1200);
    await go('localhost:8080/admin/setting/system/system', 'system-0');
    await say('システム設定 › システム情報：EC-CUBE 4.3.1・PHP 8.3');
    const ver = T('td, dd, div', /^4\.3\.1$/) || T('td, dd, div', /4\.3\.1/);
    if (ver) await hold(R(ver.closest('tr') || ver, 3), 'EC-CUBE 4.3.1（4.3.1-p1 が出ている）', 2800, true);
    await go('localhost:8080/admin/store/plugin', 'plugins-0');
    await say('プラグイン一覧：4.3 に同梱のプラグインはどれも無効、アップデート対象もなし（セキュリティチェックも無効のまま）');
    const sc = row(/セキュリティチェック|Securitychecker/);
    if (sc) await hold(R(sc, 2), 'Securitychecker42（公式のセキュリティチェック）— 無効', 2400);
    await go('localhost:8080/admin/setting/system/login_history', 'loginhist');
    mark('loginhist');
    await say('ログイン履歴：初期値の /admin に、事務所以外のアドレスから admin・administrator・test などで失敗が続いている');
    const fails = EC.els('tr').filter((r) => /失敗/.test(r.textContent) && /198\.51\.100\.23|203\.0\.113\.77/.test(r.textContent));
    if (fails.length) {
      const top = fails[0], bot = fails[fails.length - 1];
      await hold(() => { const a = screenRect(top), b = screenRect(bot); return a.width ? { left: a.left - 2, top: a.top - 2, width: a.width + 4, height: b.bottom - a.top + 4 } : null; }, `外部から ${fails.length} 回の失敗（総当たり）`, 3200, true);
    }
    const ok = EC.els('tr').filter((r) => /成功/.test(r.textContent)).pop();
    if (ok) await hold(R(ok, 2), '成功は事務所の IP（203.0.113.24）だけ', 2200);
    await go('localhost:8080/admin/setting/system/log', 'log-0');
    await say('ログ表示：EC-CUBE のログ（var/log/prod、日ごとのファイル）。エラーは出ていない');
    await readHold(1400);
  });

  /* 3 — セキュリティ管理's warning, the security-check plugin */
  scene('checker', async () => {
    Caption.step(3);
    W11.skipTo('10:16');
    await go('localhost:8080/admin/setting/system/security', 'security-0');
    await say('セキュリティ管理：EC-CUBE 自身が「管理画面 URL が初期値（admin）」と警告している');
    const warn = EC.el('.alert-warning') || T('div', /管理画面URL|admin/);
    if (warn) await hold(R(warn, 2), '管理画面 URL が admin のまま', 2800, true);
    await Win.switchTo('code');
    await panel(true);
    await say('公式のセキュリティチェックプラグイン（Securitychecker42、4.3 に同梱）を有効化');
    const en = cacheLines(DATA.cacheOut1);
    await run(DC + 'bin/console eccube:plugin:enable --code=Securitychecker42', ['', ' Run bin/console cache:clear --no-warmup...', ...en, ' <span class="tg">[OK]</span> Plugin Enabled.', ''], { kps: 30 });
    await tframe('Plugin Enabled', 1, '有効化', { w: 600, ms: 1600 });
    await Code.panel(false);
    await Win.switchTo('browser');
    await go('localhost:8080/admin/store/plugin', 'plugins-1');
    const sc = row(/Securitychecker42/);
    if (sc) await hold(R(sc, 2), '有効', 1800);
    await go(`localhost:8080/admin/store/plugin/Securitychecker4/config`, 'sc-0');
    await say('チェックする：var・vendor・.env が外から見えないか、デバッグモード、SSL、信頼するホスト、不正なデータ');
    const agree = EC.els('input[type=checkbox]').find((x) => /tools_agreement/.test(x.id));
    if (agree) { await clickUi(agree, { after: 120 }); CN.check(agree); }
    const btn = T('button', /チェック/) || EC.el('.c-contentsArea button[type=submit]');
    await clickUi(btn, { kind: 'hand', after: 60 });
    Browser.loading('stg', true);
    Caption.set(`サイト自身に var・vendor・.env を取りに行かせて確かめる（${Math.min(60, Math.max(8, Math.round((DATA.checkSeconds || 20) / 10)))} 秒ほど）`);
    await wait(2600);
    await CN.ec('stg', 'sc-1', { load: 0 });
    Browser.loading('stg', false);
    mark('scResult');
    await say('結果：var・vendor・.env は外から見えない、デバッグモードは OFF。検証環境は http なので SSL の項目だけ注意（本番は https）');
    const items = EC.els('tr, li, .card-body > div, .row').filter((e) => /SSL|https/.test(e.textContent) && e.textContent.length < 400);
    if (items.length) await hold(R(items[items.length - 1], 2), '検証環境は http（本番は https・SSL 強制）', 2800);
    await EC.scroll(0, 600);
  });

  /* 4 — members and 2FA, the admin route and allowed addresses, 403 / 404, the lockout, the 2FA set-up */
  scene('harden', async () => {
    Caption.step(4);
    W11.skipTo('10:24');
    await go('localhost:8080/admin/setting/system/member', 'members-0');
    await say('メンバー管理：admin 1 つを 3 名で共有 → 担当者ごとのアカウントにして、全員に 2段階認証');
    await clickUi(T('a', /新規登録/) || EC.el('a.btn-ec-regular'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'member-new', { load: 1000 });
    await CN.type('m_name', [JA.unei], { kps: 12 });
    await CN.type('m_dept', [{ direct: 'EC ' }, JA.dept], { kps: 12 });
    await CN.type('m_login', 'ops01', { kps: 10 });
    const pw = EC.els('input').find((x) => /plain_password_first/.test(x.id));
    if (pw) await hold(R(pw.closest('.row') || pw, 4), 'パスワード：12 文字以上・英字と数字（パスワード管理ツールで生成）', 2600);
    const tg = EC.els('input[type=checkbox]').find((x) => /two_factor_auth_enabled/.test(x.id));
    if (tg) { await clickUi(EC.el(`label[for="${tg.id}"]`) || tg.parentElement, { after: 160 }); toggleOn(tg); await hold(R(tg.closest('.row') || tg.parentElement, 4), '2段階認証を有効', 2000); }
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'members-1', { load: 1100, url: DEV + '/admin/setting/system/member' });
    const op = row(/ops01|運営担当/);
    if (op) await hold(R(op, 2), '運営担当（ops01）', 1800);
    // admin's 2FA
    await clickUi(EC.el('a[href*="/member/1/edit"]') || (row(/管理者/) && row(/管理者/).querySelector('a')) || T('a', /管理者/), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'member-edit', { load: 1000, url: DEV + '/admin/setting/system/member/1/edit' });
    const tg2 = EC.els('input[type=checkbox]').find((x) => /two_factor_auth_enabled/.test(x.id));
    if (tg2) { await clickUi(EC.el(`label[for="${tg2.id}"]`) || tg2.parentElement, { after: 160 }); toggleOn(tg2); }
    Caption.set('管理者（admin）も 2段階認証を有効にして登録');
    await clickUi(T('button', /^登録$/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'tfa-set', { load: 1300 });
    mark('tfaSet');
    await say('自分のアカウントなので、すぐ 2段階認証の登録：QR コードを認証アプリで読み取って、表示された 6 桁を入れる');
    const qr = EC.el('#qrcode');
    if (qr) await hold(R(qr, 6), 'QR コード（ぼかし）', 2200);
    await CN.type('code', '482913', { kps: 6 });
    await clickUi(T('button', /登録|認証|送信/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'home-1', { load: 1300, url: DEV + '/admin/' });
    const fl = EC.el('.alert-success, .alert');
    if (fl) await hold(R(fl, 2), '2段階認証を設定', 2000);
    // セキュリティ管理
    await go('localhost:8080/admin/setting/system/security', 'security-form');
    mark('securityForm');
    await say('管理画面 URL を推測されにくいものに、管理画面に入れるアドレスを事務所（と検証環境の自分）だけに');
    await CN.type('route', ROUTE, { clear: true, kps: 10 });
    await CN.type('allow', [{ direct: '127.0.0.1' }, { key: 'Enter' }, { direct: '203.0.113.24' }], { kps: 11 });
    const ssl = EC.els('input[type=checkbox]').find((x) => /force_ssl/.test(x.id));
    if (ssl) await say('SSL 強制は本番だけ ON（検証環境は http）', 2000);
    await clickUi(T('button', /^登録$/) || EC.el('.c-conversionArea button[type=submit]') || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'login-new', { load: 2600, url: ADM + '/login' });
    mark('loginNew');
    await say(`URL を変えるとログアウトされ、新しい URL（/${ROUTE}）のログイン画面へ`);
    // .env
    await Win.switchTo('code');
    Code.setText('.env', F.env1);
    await openAt('.env', { top: 0 });
    await say('セキュリティ管理は .env を書き換える。本番はロードバランサーの後ろなので TRUSTED_PROXIES も（ないとプロキシのアドレスで判定される）');
    await frameLines('.env', 'ECCUBE_ADMIN_ALLOW_HOSTS', 'ECCUBE_ADMIN_ALLOW_HOSTS', '許可するアドレス（JSON）', { ms: 2200 });
    await frameLines('.env', 'TRUSTED_PROXIES', 'TRUSTED_PROXIES', 'X-Forwarded-For を信じるプロキシ', { ms: 2200 });
    await frameLines('.env', 'ECCUBE_ADMIN_ROUTE', 'ECCUBE_ADMIN_ROUTE', '管理画面 URL', { ms: 2000 });
    Issue.hide();
    await panel(true);
    Term.clear();
    const st = DATA.status || {};
    const code = (x, d) => String((x && x.status) || d);
    const curl = (ip, p) => `curl.exe -s -o NUL -w "%{http_code}\`n" ${ip ? `-H "X-Forwarded-For: ${ip}" ` : ''}http://localhost:8080${p}`;
    await run(curl('203.0.113.24', `/${ROUTE}/login`), [tone(code(st.office, 200))], { kps: 40 });
    await run(curl('198.51.100.23', `/${ROUTE}/login`), [tone(code(st.other, 403))], { kps: 40 });
    await run(curl(null, '/admin/login'), [tone(code(st.oldAdmin, 404))], { kps: 40 });
    mark('statusTests');
    await tframe(`X-Forwarded-For: 203.0.113.24`, 2, '事務所 → 200', { ms: 1800 });
    await tframe(`X-Forwarded-For: 198.51.100.23`, 2, 'ほかのアドレス → 403', { ms: 2000, issue: true });
    await tframe('/admin/login', 2, '古い /admin → 404', { ms: 1800 });
    await Code.panel(false);
    // the lockout
    await Win.switchTo('browser');
    await say('ロック：同じアカウント・アドレスで 5 回失敗すると 30 分ログインできない（EC-CUBE 4.3 の標準）。ops01 で確かめる');
    await CN.type('login_id', 'ops01', { kps: 10 });
    for (let i = 0; i < 2; i++) { await clickUi(T('button', /ログイン/) || EC.el('button[type=submit]'), { kind: 'hand', after: 80 }); await Browser.reload(null, { ms: 500 }); }
    Caption.set('5 回間違えたあと、正しいパスワードで入っても…');
    await wait(900);
    await clickUi(T('button', /ログイン/) || EC.el('button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'lockout', { load: 1200, url: ADM + '/login' });
    mark('lockout');
    const msg = T('p, div, span, li', /試行回数/);
    if (msg) await hold(R(msg, 4), '5 回失敗：正しいパスワードでも 30 分入れない', 3000, true);
  });

  /* 5 — .htaccess, nginx.conf.sample, the production server (reconstructed) */
  scene('server', async () => {
    Caption.step(5);
    W11.skipTo('10:38');
    await Win.switchTo('code');
    await openAt('.htaccess', { top: 0 });
    await say('EC-CUBE の .htaccess：設定ファイル（.env・composer・*.yml・*.twig…）を拒否し、セキュリティヘッダーを付ける');
    await frameLines('.htaccess', '<FilesMatch "^composer', '</FilesMatch>', '設定ファイルを外から読ませない', { ms: 2800, from: 0 });
    await frameLines('.htaccess', 'Header always set X-Frame-Options', 'X-Content-Type-Options', '本番の応答ヘッダーと同じ 3 行 → .htaccess が効いている', { ms: 3000 });
    Issue.hide();
    await openAt('nginx.conf.sample', { top: 40 });
    await say('nginx では .htaccess が効かない：EC-CUBE の nginx.conf.sample の deny（最後の 2 つ）を必ず入れる（本番は Apache なので対象外）');
    await frameLines('nginx.conf.sample', 'location ~ /\\.', 'deny all;', 'ドットファイル（.env）', { ms: 2000, from: 60 });
    await frameLines('nginx.conf.sample', 'location ~^/(var|test|vendor|app|src|bin)', 'deny all;', 'var・vendor・app・src…', { ms: 2200, from: 60 });
    Issue.hide();
    // production server (reconstructed)
    await newFile('ops/apache/chokunavi.conf', F.OPS['ops/apache/chokunavi.conf']);
    await frameLines('ops/apache/chokunavi.conf', 'AllowOverride All', 'AllowOverride All', '.htaccess を有効に', { ms: 1800 });
    await frameLines('ops/apache/chokunavi.conf', 'ServerTokens Prod', 'TraceEnable Off', '版を出さない・TRACE を止める', { ms: 2000 });
    Issue.hide();
    await newFile('ops/php/99-chokunavi.ini', F.OPS['ops/php/99-chokunavi.ini']);
    await panel(true);
    Term.clear();
    await run('ssh chokunavi-prod', ['Last login: Mon Nov 16 18:02:51 2026 from 203.0.113.24'], { kps: 18 });
    Term.prompt = '[deploy@chokunavi-web01 ~]$ ';
    Term.render('<span class="caret"></span>');
    await run('php -v | head -1; httpd -v | head -1', ['PHP 8.3.27 (cli) (built: Oct 22 2026 12:04:51) (NTS gcc x86_64)', 'Server version: Apache/2.4.62 (AlmaLinux)'], { kps: 26 });
    await run('cd /var/www/chokunavi && grep -E "^APP_(ENV|DEBUG)=" .env && ls -l .env', ['APP_ENV=prod', 'APP_DEBUG=0', '-rw-rw-r--. 1 deploy apache 1208 Mar 18  2025 .env'], { kps: 28 });
    await tframe('-rw-rw-r--', 1, '.env がグループ書き込み可（664）', { ms: 2400, issue: true });
    await run('chmod 640 .env && ls -l .env && find . -path ./vendor -prune -o -type f -perm -o+w -print | head', ['-rw-r-----. 1 deploy apache 1208 Mar 18  2025 .env'], { kps: 30 });
    await run('sudo cp ~/ops/apache/chokunavi.conf /etc/httpd/conf.d/ && sudo cp ~/ops/php/99-chokunavi.ini /etc/php.d/ && sudo apachectl configtest && sudo systemctl reload httpd php-fpm', ['Syntax OK'], { kps: 32 });
    await tframe('Syntax OK', 1, '本番の Web サーバー（再現）', { ms: 1800, w: 600 });
    await run('exit', ['logout', 'Connection to chokunavi-prod closed.'], { kps: 14 });
    Term.prompt = PROD;
    await Code.panel(false);
  });

  /* 6 — backup and the restore test */
  scene('backup', async () => {
    Caption.step(6);
    W11.skipTo('10:46');
    await say('バックアップ：本番は毎日 3:30 に DB（mysqldump）と設定・画像を 14 日分、サーバーの外へ');
    await newFile('ops/backup.sh', F.OPS['ops/backup.sh']);
    await frameLines('ops/backup.sh', 'mysqldump', '--default-character-set', 'ロックしない一貫したダンプ', { ms: 2200 });
    await frameLines('ops/backup.sh', 'tar -czf', 'html/upload', '設定・カスタマイズ・画像', { ms: 2000 });
    await frameLines('ops/backup.sh', 'rclone copy', 'rclone copy', 'サーバーの外へ', { ms: 1800 });
    Issue.hide();
    await panel(true);
    Term.clear();
    await say('検証環境で「戻せるか」を確かめる：取る → 消す → 戻す → 件数を比べる（検証環境の DB は SQLite）');
    const SQLC = '"SELECT (SELECT COUNT(*) FROM dtb_product) AS products, (SELECT COUNT(*) FROM dtb_product_class) AS product_classes, (SELECT COUNT(*) FROM dtb_category) AS categories, (SELECT COUNT(*) FROM dtb_member) AS members, (SELECT COUNT(*) FROM dtb_plugin WHERE enabled = 1) AS plugins"';
    await run(DC + 'bin/console dbal:run-sql ' + SQLC, consoleOut(DATA.count0), { kps: 60 });
    await run(DC + `bin/console dbal:run-sql "VACUUM INTO 'var/backup/eccube-20261117.db'"`, consoleOut(DATA.vacuum && DATA.vacuum.out || ' [OK] The query yielded an empty result set.'), { kps: 40 });
    const tarList = ((DATA.tar && DATA.tar.lines) || []).map((l) => l.replace(/^a /, ''));
    await run(DC + 'tar -czvf var/backup/files-20261117.tar.gz .env app/Customize app/PluginData app/template html/upload html/user_data', [...tarList.slice(0, 6).map(esc), `… ${tarList.length} 件`], { kps: 40, gap: 30 });
    const db = DATA.dbBak || {}, tz = DATA.tarBak || {};
    await run(DC + 'ls -l var/backup', [`total ${Math.ceil(((db.size || 0) + (tz.size || 0)) / 1024)}`, esc(ls(db.size || 0, 'eccube-20261117.db')), esc(ls(tz.size || 0, 'files-20261117.tar.gz'))], { kps: 34 });
    mark('backupDone');
    await tframe('eccube-20261117.db', 2, 'DB と画像・設定のバックアップ', { ms: 2000 });
    Term.clear();
    Caption.set('わざと消す：DB と商品画像');
    await run(DC + 'sh -c "rm var/eccube.db html/upload/save_image/*"', [], { kps: 34 });
    await run('curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:8080/products/list', [tone(String((DATA.lostStatus && DATA.lostStatus.status) || 500))], { kps: 40 });
    await tframe('/products/list', 2, 'ショップが表示できない', { ms: 1600, issue: true });
    Caption.set('戻す：DB はバックアップのファイル、画像は tar から');
    const untar = ((DATA.untar && DATA.untar.lines) || []).map((l) => l.replace(/^x /, ''));
    await run(DC + 'sh -c "cp var/backup/eccube-20261117.db var/eccube.db && tar -xzvf var/backup/files-20261117.tar.gz html/upload"', [...untar.slice(0, 4).map(esc), `… ${untar.length} 件`], { kps: 40, gap: 30 });
    await run(DC + 'bin/console cache:clear --no-warmup', cacheLines(DATA.cacheOut3), { kps: 34 });
    await run(DC + 'bin/console dbal:run-sql ' + SQLC, consoleOut(DATA.count1), { kps: 60 });
    await run(DC + 'bin/console dbal:run-sql "PRAGMA integrity_check"', consoleOut(DATA.integrity), { kps: 40 });
    mark('restoreCounts');
    await tframe('products', 3, 'バックアップ前と同じ件数', { ms: 2400 });
    await Code.panel(false);
    await Win.switchTo('browser');
    await go(`localhost:8080/${ROUTE}/product`, 'products-restored', { url: ADM + '/product' });
    await say('復元した検証環境：商品一覧（18 商品）と画像が元どおり');
    await readHold(800);
    await Browser.typeUrl('localhost:8080/products/list?category_id=9');
    await CN.ec('stg', 'front-restored', { load: 1200 });
    await readHold(1600);
  });

  /* 7 — 4.3.1-p1: the bypass, maintenance mode, the patch, the check */
  scene('patch', async () => {
    Caption.step(7);
    W11.skipTo('10:58');
    await Win.switchTo('code');
    Code.addFile('patches/eccube-4.3.1-p1.diff', nl(SRC.diff), { silent: true });
    Code.tree.splice(Code.tree.findIndex((n) => n.path === 'patches') + 1, 0, { path: 'patches/eccube-4.3.1-p1.diff', dir: false });
    Code.tree.find((n) => n.path === 'patches').open = true;
    Code.renderTree();
    const PD = 'patches/eccube-4.3.1-p1.diff';
    await openAt(PD, { top: Math.max(0, lineOf(Code.text(PD), 'TwoFactorAuthController.php') - 1) });
    await say('EC-CUBE 4.3.1-p1（2026/03 公開）：2段階認証の回避（MFA バイパス）の修正。差分は 2段階認証の 3 ファイル');
    await frameLines(PD, '既に2FAキーが設定されている場合は', "return $this->redirectToRoute('admin_two_factor_auth');", '設定済みなら再設定の画面を出さない', { ms: 2800 });
    await frameLines(PD, "-    public const ROUTE_EXCLUDE = ['admin_two_factor_auth', 'admin_two_factor_auth_set'];", "+    public const ROUTE_EXCLUDE_WHEN_NOT_CONFIGURED", '再設定の画面がチェックの対象外だった', { ms: 3000, issue: true });
    Issue.hide();
    // the bypass on 4.3.1 (staging)
    await Win.switchTo('browser');
    await say('検証環境（4.3.1）で確かめる：パスワードだけでログインした状態（6 桁のコードはまだ）');
    await go(`localhost:8080/${ROUTE}/two_factor_auth/auth`, 'vuln-auth', { url: ADM + '/two_factor_auth/auth' });
    await readHold(900);
    await Browser.typeUrl(`localhost:8080/${ROUTE}/two_factor_auth/set`);
    await CN.ec('stg', 'vuln-set', { load: 1200, url: ADM + '/two_factor_auth/set' });
    mark('vulnSet');
    const qr = EC.el('#qrcode');
    await hold(R(qr ? (qr.closest('.card') || qr) : 'body', 4), 'コードなしで認証アプリを登録し直せてしまう（4.3.1）', 3200, true);
    // maintenance mode
    await go(`localhost:8080/${ROUTE}/content/maintenance`, 'maint-0', { url: ADM + '/content/maintenance' });
    await say('コンテンツ管理 › メンテナンス管理：パッチを当てる間はメンテナンスモード（管理者はショップも見られる）');
    await clickUi(T('button', /有効|メンテナンスモード/) || EC.el('.c-contentsArea button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'maint-1', { load: 1200 });
    const on = EC.el('.alert-success, .alert') || T('button', /無効/);
    if (on) await hold(R(on, 3), 'メンテナンスモード 有効', 1800);
    await Browser.newTab('cust');
    await Browser.typeUrl('localhost:8080/products/list?category_id=9');
    await CN.ec('cust', 'front-503', { load: 1100, url: DEV + '/products/list?category_id=9', title: 'メンテナンス中' });
    mark('front503');
    await say('お客様から見たショップ：503 のメンテナンス画面（検索エンジンにも「一時的に止めている」と伝わる）');
    // the patch
    await Win.switchTo('code');
    await panel(true);
    Term.clear();
    await run('git apply --stat patches/eccube-4.3.1-p1.diff', [
      ' package.json                                                         |    2 +-',
      ' src/Eccube/Common/Constant.php                                       |    2 +-',
      ' .../Controller/Admin/Setting/System/TwoFactorAuthController.php      |    7 +++++++',
      ' src/Eccube/EventListener/TwoFactorAuthListener.php                   |   20 +++++++++++++++++---',
      ' src/Eccube/Service/TwoFactorAuthService.php                          |    5 ++++-',
      ' 5 files changed, 31 insertions(+), 5 deletions(-)'], { kps: 34 });
    await run('git apply patches/eccube-4.3.1-p1.diff', [], { kps: 34 });
    await run(DC + 'bin/console cache:clear --no-warmup', cacheLines(DATA.cacheOut4), { kps: 34 });
    mark('patched');
    await tframe('[OK] Cache', 1, 'キャッシュを消して反映', { ms: 1600, w: 900 });
    await Code.panel(false);
    await Win.switchTo('browser');
    await CN.tab('stg');
    await go(`localhost:8080/${ROUTE}/setting/system/system`, 'system-1', { url: ADM + '/setting/system/system' });
    const v1 = T('td, dd, div', /^4\.3\.1-p1$/) || T('td, dd, div', /4\.3\.1-p1/);
    if (v1) await hold(R(v1.closest('tr') || v1, 3), 'EC-CUBE 4.3.1-p1', 2200);
    await say('もう一度パスワードだけの状態で再設定の URL へ → コードの入力画面に戻される');
    await Browser.typeUrl(`localhost:8080/${ROUTE}/two_factor_auth/set`);
    await CN.ec('stg', 'vuln-fixed', { load: 1300, url: ADM + '/two_factor_auth/auth' });
    mark('vulnFixed');
    const box = EC.field('code');
    await hold(R(box ? (box.closest('form') || box) : 'form', 6), '/set → /auth（塞がった）', 2600);
    // maintenance off
    await go(`localhost:8080/${ROUTE}/content/maintenance`, 'maint-1', { url: ADM + '/content/maintenance' });
    await clickUi(T('button', /無効|メンテナンスモード/) || EC.el('.c-contentsArea button[type=submit]'), { kind: 'hand', after: 60 });
    await CN.ec('stg', 'maint-2', { load: 1100 });
    await CN.tab('cust');
    await Browser.reload(async () => { await wait(500); await CN.ec('cust', 'front-1', { load: 0 }); });
    await say('メンテナンスモードを解除 → ショップが表示される（止めていたのは約 8 分）');
  });

  /* 8 — production (reconstructed), monitoring, the live shop, the report */
  scene('deploy', async () => {
    Caption.step(8);
    W11.skipTo('11:20');
    await Win.switchTo('code');
    await panel(true);
    Term.clear();
    await say('本番へ：同じ手順（管理画面でメンテナンスモード → バックアップ → パッチ → キャッシュ削除 → 確認 → 解除）');
    await run('git add patches ops && git commit -qm "EC-CUBE 4.3.1-p1・保守の設定" && git push -q', [], { kps: 34 });
    await run('ssh chokunavi-prod', ['Last login: Tue Nov 17 10:40:12 2026 from 203.0.113.24'], { kps: 18 });
    Term.prompt = '[deploy@chokunavi-web01 chokunavi]$ ';
    Term.render('<span class="caret"></span>');
    await run('/opt/ops/backup.sh && ls -lh /backup/chokunavi | tail -2', ['-rw-------. 1 deploy deploy  41M Nov 17 11:21 db-20261117.sql.gz', '-rw-------. 1 deploy deploy 1.3G Nov 17 11:22 files-20261117.tar.gz'], { kps: 28 });
    await run('git pull -q && git apply patches/eccube-4.3.1-p1.diff && sudo -u apache bin/console cache:clear --no-warmup', ['', CACHE_OK.replace('[OK]', '<span class="tg">[OK]</span>'), ''], { kps: 28 });
    await run('grep VERSION src/Eccube/Common/Constant.php && curl -sI https://www.chokunavi.shop/ | head -1', ["    public const VERSION = '4.3.1-p1';", tone('HTTP/1.1 200 OK')], { kps: 28 });
    await run('crontab ~/ops/crontab && sudo cp ~/ops/logrotate/chokunavi /etc/logrotate.d/ && crontab -l | grep -c ops', ['4'], { kps: 30 });
    mark('prod');
    await tframe("VERSION = '4.3.1-p1'", 2, '本番も 4.3.1-p1（再現）', { ms: 2200, w: 900 });
    await run('exit', ['logout', 'Connection to chokunavi-prod closed.'], { kps: 14 });
    Term.prompt = PROD;
    await Code.panel(false);
    await say('管理画面 URL・許可 IP・担当者のアカウントと 2段階認証は、本番の管理画面でも同じように設定');
    // monitoring
    await newFile('ops/crontab', F.OPS['ops/crontab']);
    await frameLines('ops/crontab', '0 9 * * *', '0 9 * * *', '証明書の期限（12/17）を 30 日前から通知', { ms: 2200 });
    await frameLines('ops/crontab', '*/5 * * * *', '*/5 * * * *', '外形監視（メンテナンスのままも検知）', { ms: 2000 });
    Issue.hide();
    await newFile('ops/logrotate/chokunavi', F.OPS['ops/logrotate/chokunavi']);
    await openAt('app/config/eccube/packages/prod/monolog.yml', { top: 8 });
    await frameLines('app/config/eccube/packages/prod/monolog.yml', 'main_rotating_file:', 'max_files: 60', 'EC-CUBE のログは日ごとに 60 ファイル（logrotate の対象外）', { ms: 2600, from: 10 });
    Issue.hide();
    // the live shop
    await Win.switchTo('browser');
    await CN.tab('live');
    await Browser.typeUrl('www.chokunavi.shop/products/detail/14554');
    Browser.nav('live', { url: LIVE + '/products/detail/14554', title: TITLE('detail') });
    Browser.loading('live', true);
    await Store.load('detail');
    Browser.loading('live', false);
    mark('live');
    await say('公開中のショップ：表示・自動見積・注文の流れは変わらない');
    await Store.scroll(360, 1400);
    await readHold(1000);
    // the report
    await Win.switchTo('code');
    await openAt('docs/report-2026-11.md', { top: 0 });
    await Code.clickAt(0, 0, {});
    await Code.paste(nl(F.REPORT), { after: 300 });
    await Code.save();
    await say('保守作業の報告書：実施したこと・確認していただきたいこと（証明書の期限、www なしの DNS、テンプレート）');
    await frameLines('docs/report-2026-11.md', '| EC-CUBE |', '| 監視 |', '実施したこと', { ms: 2600 });
    await frameLines('docs/report-2026-11.md', '## ご確認・ご相談', '管理画面の新しい URL', 'ご確認・ご相談', { ms: 2600 });
    Issue.hide();
    D.Cursor.kind('arrow');
    Caption.set('EC-CUBE 4 の保守：外からの確認・健康診断・セキュリティチェック・管理画面の防御（URL・IP・2段階認証・ロック）・バックアップと復元テスト・4.3.1-p1 を検証環境から本番へ');
    await wait(5600);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'detail'],
    fontText: JSON.stringify(JA) + Object.values(F.files).join('') + Object.values(F.OPS).join('') + F.REPORT + HEAD.join('') + 'DNS 名が存在しません発生場所行文字',
    async prepare() {
      const tree = [
        ['app', 'dir', 1], ['app/Customize', 'dir'], ['app/Plugin', 'dir'], ['app/config', 'dir', 1], ['app/config/eccube', 'dir', 1], ['app/config/eccube/packages', 'dir', 1],
        ['app/config/eccube/packages/prod', 'dir', 1], ['app/config/eccube/packages/prod/monolog.yml'], ['app/template', 'dir'],
        ['bin', 'dir'], ['docs', 'dir', 1], ['docs/report-2026-11.md'], ['docs/request-2026-11.md'], ['html', 'dir'], ['ops', 'dir', 1], ['patches', 'dir'],
        ['src', 'dir'], ['var', 'dir'], ['vendor', 'dir'], ['.env'], ['.gitignore'], ['.htaccess'], ['nginx.conf.sample'], ['README.md'],
      ];
      Code.init({ ...F.files }, tree);
      Code.show('docs/request-2026-11.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: TITLE('home'), url: LIVE + '/', page: 'store', fav: 'store' });
      await Store.load('home');
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      CN.blur();
      CN.watch();
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
