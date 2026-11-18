/*
 * Timeline: GMOアリーナさいたま (www.saitama-arena.co.jp, a WordPress multisite: / · /schedule/ · /news/) moves to the
 * new server — the runbook, the old server (wp site list, the uploads), All-in-One WP Migration (a multisite needs the
 * paid extension → WP-CLI), the maintenance screen, the database export → rsync and the import on web01 (DB_HOST still
 * "localhost") → the load balancer and the ACM certificates → hosts: the new server first on this PC only (the redirect
 * loop behind the load balancer: X-Forwarded-Proto) → Route 53 (www → the load balancer), curl → the new domain
 * arena.gmo: a temporary 302 to www until the postponed URL change, the search-replace for that day as a dry run →
 * the live site.
 * Every WordPress screen is real (js/wp-snapshot.js, tools/snapshots/wp-saitama-arena-migration/capture-wp.js); the site
 * is the live www.saitama-arena.co.jp (js/site-snapshot.js). Public and shown as they are: the DNS answers, the load
 * balancer's redirect, the response headers of www / arena.gmo, the certificates; the servers behind them are invented.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP, W11 = window.Win11, SA = window.SA;
  const { $, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const P = F.files;
  const WWW = 'https://www.saitama-arena.co.jp';
  const CONFIG = 'web01/wp-config.php', GMO = 'web01/httpd/arena-gmo.conf', DNS = 'dns/www-alias-alb.json', HOSTS = F.HOSTS_PATH;
  const TITLE = { home: S.title, schedule: 'イベントスケジュール｜GMOアリーナさいたま', notice: '本ホームページのURLの変更について（延期）｜GMOアリーナさいたま' };
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'で': { r: 'de', segs: ['で'] },
    'を終端：転送元のプロトコルを見る': [{ r: 'woshuutan:', segs: ['を', '終端：'] }, { r: 'tensoumotonopurotokoruwomiru', segs: ['転送元の', 'プロトコルを', '見る'] }],
    '変更日まで：現行サイトへ一時転送': [{ r: 'henkoubimade:', segs: ['変更日', 'まで：'] }, { r: 'genkousaitoheichijitensou', segs: ['現行', 'サイトへ', '一時', '転送'] }],
    '変更日以降の': { r: 'henkoubiikouno', segs: ['変更日', '以降の'] },
    'は': { r: 'ha', segs: ['は'] },
    '側に設定': { r: 'gawanisettei', segs: ['側に', '設定'] },
    '移転確認': { r: 'itenkakunin', segs: ['移転', '確認'] },
  };
  /** typing script for tab-indented lines (PHP, WordPress coding standards): Enter + auto-indent, corrected */
  function tabScript(lines, after) {
    const out = [];
    let prev = after;
    for (const line of lines) {
      const tabs = line.match(/^\t*/)[0].length, body = line.slice(tabs);
      if (prev != null) {
        out.push({ key: 'Enter' });
        const auto = K.indentAfter(prev, '\t').match(/^\t*/)[0].length;
        if (auto > tabs) out.push({ key: 'Backspace', n: auto - tabs });
        else if (auto < tabs) out.push({ direct: '\t'.repeat(tabs - auto) });
      } else if (tabs) out.push({ direct: '\t'.repeat(tabs) });
      if (body) out.push(...K.codeScript([body], JA));
      prev = line;
    }
    return out;
  }

  // the editor: Apache configs indented with 4 spaces, the hosts file with tabs (VS Code detects them); the fake secrets
  // of wp-config.php (DB password, keys) blurred like personal data
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) {
    show0(path, o);
    if (/\.conf$/.test(path)) $('#vsIndent').textContent = 'スペース: 4';
    if (path === HOSTS) $('#vsIndent').textContent = 'タブのサイズ: 4';
  };
  const render0 = Code.render.bind(Code);
  Code.render = function (...a) {
    render0(...a);
    if (this.active !== CONFIG) return;
    document.querySelectorAll('#vsLines .vs-line').forEach((l) => {
      if (!/DB_PASSWORD|_KEY'/.test(l.textContent)) return;
      const s = l.querySelectorAll('.t-str');
      if (s.length > 1) s[s.length - 1].classList.add('pii');
    });
  };

  /* ------------------------------------------------ what the commands print (at the video's clock) */
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const utc = (sec = 0) => new Date(W11.now().getTime() - 9 * 3600e3 + sec * 1000);
  const httpDate = (sec = 0) => { const d = utc(sec); return `${DAYS[d.getDay()]}, ${pad(d.getDate())} ${MONS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} GMT`; };
  const lsTime = () => { const d = W11.now(); return `${MONS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const isoUtc = () => { const d = utc(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}000+00:00`; };
  const pii = (t) => `<span class="pii">${esc(t)}</span>`;
  const okLine = (t) => `<span class="tg">Success:</span> ${esc(t)}`;
  /** a WP-CLI / MySQL style table */
  function cliTable(cols, rows) {
    const w = cols.map((c, i) => Math.max(c.length, ...rows.map((r) => String(r[i]).length)));
    const line = '+' + w.map((n) => '-'.repeat(n + 2)).join('+') + '+';
    const row = (r) => '| ' + r.map((v, i) => String(v).padEnd(w[i])).join(' | ') + ' |';
    return [line, row(cols), line, ...rows.map(row), line].map(esc);
  }
  /** an AWS CLI --output table (the title centred, the columns in key order, values after two spaces) */
  function awsTable(title, cols, rows) {
    const w = cols.map((c, i) => Math.max(c.length, ...rows.map((r) => String(r[i]).length)) + 4);
    const inner = w.reduce((a, b) => a + b, 0) + w.length - 1;
    const center = (t, n) => { const l = Math.floor((n - t.length) / 2); return ' '.repeat(l) + t + ' '.repeat(n - t.length - l); };
    const sep = '+' + w.map((n) => '-'.repeat(n)).join('+') + '+';
    return ['-'.repeat(inner + 2), '|' + center(title, inner) + '|', sep, ...(cols[0] ? ['|' + cols.map((c, i) => center(c, w[i])).join('|') + '|', sep] : []),
      ...rows.map((r) => '|' + r.map((v, i) => ('  ' + v).padEnd(w[i])).join('|') + '|'), sep].map(esc);
  }
  /** Resolve-DnsName's table */
  const dnsTable = (rows) => ['', 'Name                                           Type   TTL   Section    IPAddress', '----                                           ----   ---   -------    ---------',
    ...rows.map(([n, ttl, ip]) => `${esc(n.padEnd(47))}A      ${String(ttl).padEnd(6)}Answer     ${ip}`), ''];
  /** response headers (curl -I) */
  const H200 = () => ['HTTP/1.1 200 OK', `Date: ${httpDate()}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Length: 98662', 'Connection: keep-alive', 'Server: Apache',
    'X-Frame-Options: SAMEORIGIN', 'Vary: Accept-Encoding,Cookie', `Last-Modified: ${httpDate()}`, 'Accept-Ranges: bytes', 'Cache-Control: max-age=3600, public', `Expires: ${httpDate(3600)}`,
    'Referrer-Policy: no-referrer-when-downgrade', 'Pragma: public', 'X-XSS-Protection: 1; mode=block', 'X-Content-Type-Options: nosniff', ''];
  /** a terminal line that changes in place (rsync's progress) */
  async function liveLine(frames, ms) {
    Term.lines.push('');
    const i = Term.lines.length - 1;
    for (const f of frames) { Term.lines[i] = f; Term.render(null); await wait(ms / frames.length); }
  }
  // an empty output line keeps its height (an empty <div> would collapse)
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 26, ...o });
  const out = (lines) => Term.out(blank(lines));
  /** the new server's access log (Apache combined): the load balancer's health check and visitors, at the video's clock */
  function accessLog() {
    const d = W11.now();
    const at = (s) => { const t = new Date(d.getTime() - s * 1000); return `[${pad(t.getDate())}/${MONS[t.getMonth()]}/${t.getFullYear()}:${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())} +0900]`; };
    const CH = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
    const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
    return [
      [24, '10.0.1.87', 'GET /healthz.html HTTP/1.1" 200 2 "-" "ELB-HealthChecker/2.0'],
      [19, '10.0.2.143', `GET / HTTP/1.1" 200 98662 "-" "${IOS}`],
      [18, '10.0.2.143', `GET /wp-content/themes/saitamaarena/css/style_sp.css HTTP/1.1" 200 41873 "https://www.saitama-arena.co.jp/" "${IOS}`],
      [12, '10.0.1.87', `GET /schedule/ HTTP/1.1" 200 116431 "https://www.saitama-arena.co.jp/" "${CH}`],
      [9, '10.0.2.143', 'GET /healthz.html HTTP/1.1" 200 2 "-" "ELB-HealthChecker/2.0'],
      [3, '10.0.1.87', `GET /news/2026/10283546.html HTTP/1.1" 200 90418 "https://www.saitama-arena.co.jp/" "${CH}`],
    ].map(([s, ip, rest]) => `${pii(ip)} - - ${at(s)} "${esc(rest)}"`);
  }
  async function ssh(host) {
    await run(`ssh ${host}`, [`Last login: Mon Nov  9 18:12:40 2026 from ${pii('10.0.0.15')}`], { kps: 16 });
    SA.Shell.remote('deploy', host);
    Term.render('<span class="caret"></span>');
  }
  async function exitSsh(host) {
    await run('exit', ['logout', `Connection to ${host} closed.`], { kps: 12 });
    SA.Shell.local();
    Term.render('<span class="caret"></span>');
  }

  /* ------------------------------------------------------------- browser helpers */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? WP.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  /** the last `n` lines of the terminal */
  const termRect = (n, w = 1200) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    const last = rows.filter((r) => r.textContent.trim() !== '' || r.querySelector('.caret')).slice(-1)[0] || rows[rows.length - 1];
    const end = rows.indexOf(last);
    const first = rows[Math.max(0, end - n + 1)];
    if (!first || !last) return null;
    const a = screenRect(first), b = screenRect(last);
    return { left: a.left, top: a.top, width: Math.min(w, a.width), height: b.bottom - a.top };
  };
  /** lines of the terminal from the one containing `text` (n lines) */
  const termFind = (text, n = 1, w = 1200) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    let i = -1;
    rows.forEach((r, k) => { if (r.textContent.includes(text)) i = k; });
    if (i < 0) return null;
    const a = screenRect(rows[i]), b = screenRect(rows[Math.min(rows.length - 1, i + n - 1)]);
    return { left: a.left, top: a.top, width: Math.min(w, a.width), height: b.bottom - a.top };
  };
  const wpKey = {};
  /** a WordPress screen in a tab (its real title and address), the page loading for a moment */
  async function wpScreen(key, o = {}) {
    const tab = o.tab || 'wp';
    if (o.loading !== false) { Browser.loading(tab, true); await wait(o.ms || 450); }
    await WP.show(key);
    wpKey[tab] = key;
    Browser.nav(tab, { title: WP.title(key), url: o.url || WP.url(key), page: 'wp', fav: o.fav || 'wp' });
    if (o.loading !== false) Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 300);
  }
  /** a tab click; a tab with a WordPress screen shows its screen again (the screens share one page) */
  async function tabTo(id) {
    await Browser.clickTab(id);
    if (Browser.tab(id).page === 'wp' && wpKey[id]) await WP.show(wpKey[id]);
  }
  async function wpType(name, text) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.12, after: 60 });
    WP.focus(box, true);
    await typeInto(WP.typeInto(name), [{ direct: text }], { kps: 11 });
    WP.blur(name);
  }
  /** a password typed into a captured box: ● in the key display, • in the box */
  async function wpPassword(name, n) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.12, after: 60 });
    WP.focus(box, true);
    await D.Ime.setMode(false, true);
    for (let k = 1; k <= n; k++) {
      KeyStrip.key('●');
      box.innerHTML = '•'.repeat(k) + '<span class="demo-caret"></span>';
      await D.kw(1000 / 11 * (0.55 + Math.random() * 0.9));
    }
    KeyStrip.idleHide(700);
    WP.blur(name);
  }
  /** the site (the live snapshot) in a tab */
  async function sitePage(tab, page, path, o = {}) {
    Browser.nav(tab, { title: TITLE[page], url: WWW + path, page: 'store', fav: 'store' });
    Browser.loading(tab, true);
    await Store.load(page, { states: o.states || (page === 'home' ? ['today'] : []) });
    Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 500);
    return Store.doc;
  }
  const textEl = (sel, re) => WP.els(sel).find((e) => re.test(e.textContent));
  /** saving the hosts file: VS Code needs administrator rights (retry as administrator) */
  async function saveHosts() {
    await Keycap.show(['Ctrl', 'S'], 500);
    SA.VsNotify.show("'hosts' の保存に失敗しました: アクセス許可が不十分です。管理者として再試行するには、'管理者として再試行' を選択してください。", ['管理者として再試行...', 'キャンセル']);
    await wait(1800);
    await clickUi(SA.VsNotify.btn(0), { kind: 'arrow', after: 120 });
    SA.VsNotify.hide();
    await wait(500);
    Code.files[HOSTS].dirty = false;
    Code.renderTabs();
    await wait(300);
  }

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — before the move: the runbook, the DNS TTL, the old server */
  scene('before', async () => {
    Caption.step(1);
    Caption.set('移転手順書：旧サーバー → 新サーバー（ロードバランサー + web01 + db01）。WordPress はマルチサイト 3 サイト');
    await hoverUi(Code.lineEl(5), { ax: 0.3, hold: 900 });
    Issue.ok(linesRect(4, 12, 900), '構成');
    await wait(3500);
    Issue.hide();
    await hoverUi(Code.lineEl(17), { ax: 0.3, hold: 600 });
    Issue.ok(linesRect(14, 23, 900), '今夜の手順');
    await wait(3200);
    Issue.hide();
    await Code.panel(true, { tall: true });
    Caption.set('前日に www の TTL を 300 秒へ下げておいた：DNS を切り替えたら、5 分ほどで新サーバーに向く');
    await run('Resolve-DnsName www.saitama-arena.co.jp', dnsTable([['www.saitama-arena.co.jp', 300, pii('203.0.113.24')]]));
    Issue.ok(termFind('Answer', 1, 760), 'TTL 300');
    await wait(3000);
    Issue.hide();
    // the old server
    Caption.set('旧サーバーに SSH：WordPress マルチサイトの 3 サイト（本体・/schedule/・/news/）を確認');
    await ssh('old-web');
    await run('cd /var/www/html && wp site list --fields=blog_id,url,last_updated', cliTable(['blog_id', 'url', 'last_updated'], [
      [1, WWW + '/', '2026-11-09 18:42:10'], [2, WWW + '/schedule/', '2026-11-09 17:20:44'], [3, WWW + '/news/', '2026-10-28 15:31:02']]), { kps: 24 });
    SA.Shell.cd('html');
    Term.render('<span class="caret"></span>');
    await wait(2200);
    await run('wp core version && wp db size --human-readable', ['7.1.4', '+---------------+----------+', '| Name          | Size     |', '+---------------+----------+', '| saitama_arena | 1.21 GB  |', '+---------------+----------+'], { kps: 22 });
    Caption.set('プラグインは WP-PageNavi（ネットワークで有効）と、移行用に入れておいた All-in-One WP Migration');
    await run('wp plugin list --fields=name,status,version', cliTable(['name', 'status', 'version'], [['all-in-one-wp-migration', 'inactive', '7.113'], ['wp-pagenavi', 'active-network', '3.0.1']]), { kps: 24 });
    await wait(2400);
    Caption.set('アップロード 6.8GB。WordPress の外にも /img/ や静的ページ（/floor_map/ など）がある');
    await run('du -sh wp-content/uploads img floor_map access', ['6.8G\twp-content/uploads', '41M\timg', '5.2M\tfloor_map', '2.4M\taccess'], { kps: 22 });
    await wait(2400);
  });

  /* 2 — the backup: All-in-One WP Migration (multisite), maintenance, the database export */
  scene('backup', async () => {
    Caption.step(2);
    Caption.set('まずは移行プラグイン All-in-One WP Migration で書き出せないか、旧サーバーの管理画面で確認');
    await Win.switchTo('browser');
    await Browser.typeUrl('www.saitama-arena.co.jp/wp-admin/network/');
    await wpScreen('login', { url: WWW + '/wp-login.php?redirect_to=https%3A%2F%2Fwww.saitama-arena.co.jp%2Fwp-admin%2Fnetwork%2F&reauth=1' });
    await wpType('user', 'sa_webadmin');
    await wpPassword('pass', 14);
    await clickUi(WP.el('#wp-submit'), { kind: 'hand', after: 60 });
    await wpScreen('net-dashboard', { ms: 700 });
    await wait(500);
    await clickUi(WP.el('#menu-plugins > a') || textEl('#adminmenu a', /プラグイン/), { kind: 'hand', after: 60 });
    await wpScreen('net-plugins');
    const row = WP.el('tr[data-slug="all-in-one-wp-migration"]');
    await hoverUi(row.querySelector('.plugin-title strong') || row, { hold: 900 });
    await clickUi(row.querySelector('.activate a'), { kind: 'hand', after: 60 });
    await wpScreen('net-plugins-ai1wm', { ms: 800 });
    mark('ai1wm');
    // the plugin's own notice: the smallest box holding the message (not the page around it)
    const notice = WP.els('div').filter((d) => /Multisite Extension/.test(d.textContent)).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    Caption.issue('移行プラグイン', '「WordPress マルチサイトには … Multisite Extension が必要です」：無料版はマルチサイトを書き出せない');
    Issue.show(R(notice, 2), 'マルチサイトは有料の拡張機能が必要');
    await wait(4900);
    Issue.hide();
    // back as it was; WP-CLI and rsync instead
    Caption.set('プラグインは無効化して元に戻す。データベースは WP-CLI、ファイルは rsync で移す');
    const off = WP.el('tr[data-slug="all-in-one-wp-migration"] .deactivate a');
    await clickUi(off, { kind: 'hand', after: 60 });
    await wpScreen('net-plugins-off', { ms: 600 });
    await wait(1600);
    // maintenance: no edits while the data moves
    Caption.set('移行中に記事が更新されないよう、メンテナンスモードに（サイトはメンテナンス画面）');
    await Win.switchTo('code');
    await run('wp maintenance-mode activate', ['Enabling Maintenance mode...', okLine('Activated Maintenance mode.')], { kps: 20 });
    await Win.switchTo('browser');
    await Browser.newTab('site');
    await Browser.typeUrl('www.saitama-arena.co.jp');
    await wpScreen('maintenance', { tab: 'site', url: WWW + '/', fav: 'neterr', ms: 600 });
    Issue.ok(R(WP.el('body > *') || WP.el('body'), 8), 'メンテナンス中');
    await wait(3200);
    Issue.hide();
    // the database
    Caption.set('データベースを書き出し：--single-transaction（書き出し中もテーブルをロックしない）');
    await Win.switchTo('code');
    await run('wp db export /tmp/saitama-arena_20261110.sql --single-transaction --default-character-set=utf8mb4', [() => wait(1600), okLine("Exported to '/tmp/saitama-arena_20261110.sql'.")], { kps: 30 });
    await run('ls -lh /tmp/saitama-arena_20261110.sql', [`-rw-rw-r-- 1 deploy deploy 412M ${lsTime()} /tmp/saitama-arena_20261110.sql`], { kps: 26 });
    await wait(1600);
    await exitSsh('old-web');
  });

  /* 3 — onto the new server: rsync, wp-config.php, the import (DB_HOST) */
  scene('transfer', async () => {
    Caption.step(3);
    Caption.set('新サーバー web01 へ：WordPress 本体・wp-content・/img/ などの静的ファイルを丸ごと rsync');
    await ssh('web01');
    await run('rsync -az --info=progress2 --exclude=wp-config.php --exclude=.maintenance old-web:/var/www/html/ /var/www/html/', [], { kps: 30 });
    const total = 7301118446;
    const frames = [];
    for (let k = 1; k <= 14; k++) {
      const done = Math.round(total * Math.min(1, (k / 14) ** 1.08));
      const pct = Math.round((done / total) * 100);
      const rate = (44 + (k * 7) % 11 + 0.37 * k).toFixed(2);
      frames.push(esc(`  ${done.toLocaleString('en-US').padStart(15)} ${String(pct).padStart(3)}%   ${rate}MB/s    0:${pad(Math.floor(k * 9.6 / 60))}:${pad(Math.round(k * 9.6) % 60)} (xfr#${Math.round(48213 * k / 14)}, ir-chk=${Math.max(0, 1000 - k * 71)}/${48213})`));
    }
    frames.push(esc('  7,301,118,446 100%   52.14MB/s    0:02:14 (xfr#48213, to-chk=0/48213)'));
    await liveLine(frames, 6800);
    W11.skipTo('22:31');
    Term.render('<span class="caret"></span>');
    await wait(800);
    await run('rsync -az old-web:/tmp/saitama-arena_20261110.sql /tmp/', [], { kps: 28 });
    await exitSsh('web01');
    // wp-config.php for the new server (prepared from the old one)
    Caption.set('新サーバー用の wp-config.php：旧サーバーのものをコピーして準備（認証キーはそのまま）');
    await Code.openFile(CONFIG, { top: 0 });
    await hoverUi(Code.lineEl(5), { ax: 0.3, hold: 700 });
    await hoverUi(Code.lineEl(25), { ax: 0.3, hold: 900 });
    await run('scp web01/wp-config.php web01:/var/www/html/', ['wp-config.php                                 100% 1890   402.7KB/s   00:00'], { kps: 24 });
    Caption.set('データベースをインポート');
    await run('ssh web01 "cd /var/www/html && wp db import /tmp/saitama-arena_20261110.sql"', [() => wait(700),
      "ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/var/lib/mysql/mysql.sock' (2)"], { kps: 28 });
    mark('dbhost');
    Caption.issue('DB 接続', 'MySQL に接続できない：DB_HOST が旧サーバーのまま localhost。新しい構成では DB は別サーバー（db01）');
    Issue.show(termFind('ERROR 2002', 1, 1000), 'localhost に MySQL がない');
    await wait(3500);
    const at = Code.find("define( 'DB_HOST', 'localhost' );").line;
    await Code.reveal(at, 500);
    Issue.show(linesRect(at, at, 520), "DB_HOST 'localhost'");
    await wait(2700);
    Issue.hide();
    await Code.overwrite('localhost', [{ direct: 'db01.sa.internal' }], { from: at });
    await Code.save();
    check(CONFIG, [...P[CONFIG].split('\n').map((l) => (l === "define( 'DB_HOST', 'localhost' );" ? F.DB_HOST_FIXED : l))].join('\n'), 'wp-config DB_HOST');
    await run('scp web01/wp-config.php web01:/var/www/html/', ['wp-config.php                                 100% 1897   415.3KB/s   00:00'], { kps: 26 });
    await run('ssh web01 "cd /var/www/html && wp db import /tmp/saitama-arena_20261110.sql && wp site list --fields=blog_id,url"', [() => wait(2200),
      okLine("Imported from '/tmp/saitama-arena_20261110.sql'."),
      ...cliTable(['blog_id', 'url'], [[1, WWW + '/'], [2, WWW + '/schedule/'], [3, WWW + '/news/']])], { kps: 30 });
    Caption.fixed('DB_HOST を db01 に直してインポート完了：3 サイトとも新サーバーの DB に入った');
    Issue.ok(termRect(7, 760), '3 サイト');
    await wait(4100);
    Issue.hide();
    Caption.set('テーブルのチェック：本体（wp_）と 2 つのサイト（wp_2_・wp_3_）のテーブルがすべて OK');
    const TABLES = ['commentmeta', 'comments', 'links', 'options', 'postmeta', 'posts', 'term_relationships', 'term_taxonomy', 'termmeta', 'terms'];
    const all = [...TABLES.map((t) => 'wp_2_' + t), ...TABLES.map((t) => 'wp_3_' + t), 'wp_blogmeta', 'wp_blogs', ...TABLES.slice(0, 6).map((t) => 'wp_' + t), 'wp_registration_log', 'wp_signups', 'wp_site', 'wp_sitemeta', ...TABLES.slice(6).map((t) => 'wp_' + t), 'wp_usermeta', 'wp_users'];
    await run('ssh web01 "cd /var/www/html && wp db check"', [() => wait(500), ...all.map((t) => esc(`saitama_arena.${t}`.padEnd(50) + 'OK')), okLine('Database checked.')], { kps: 30, gap: 32 });
    Issue.ok(termFind('Database checked', 1, 520), 'OK');
    await wait(3000);
    Issue.hide();
    await run('ssh web01 "sudo chown -R apache:apache /var/www/html/wp-content/uploads"', [], { kps: 30 });
    await wait(600);
  });

  /* 4 — the load balancer, the certificates */
  scene('alb', async () => {
    Caption.step(4);
    Caption.set('SSL はロードバランサー（ALB）で終端：ACM の証明書は www と新ドメイン arena.gmo の 2 枚');
    await run('aws acm list-certificates --query "CertificateSummaryList[].{Domain:DomainName,Status:Status,InUse:InUse}" --output table', awsTable('ListCertificates', ['Domain', 'InUse', 'Status'], [
      ['www.saitama-arena.co.jp', 'True', 'ISSUED'], ['arena.gmo', 'True', 'ISSUED']]), { kps: 34 });
    await wait(2200);
    Caption.set('リスナー：HTTP:80 は HTTPS へ 301 リダイレクト、HTTPS:443 は web01 へ転送（web01 は http で受ける）');
    await run('aws elbv2 describe-listeners --load-balancer-arn $env:ALB_ARN --query "Listeners[].{Port:Port,Protocol:Protocol,Action:DefaultActions[0].Type}" --output table', awsTable('DescribeListeners', ['Action', 'Port', 'Protocol'], [
      ['redirect', '80', 'HTTP'], ['forward', '443', 'HTTPS']]), { kps: 36 });
    await wait(1900);
    // the HTTPS listener serves both certificates (SNI): www (default) and arena.gmo
    Caption.set('HTTPS:443 のリスナーに証明書 2 枚（SNI）：www が既定、arena.gmo は追加の証明書');
    const ACCT = '418273956021';
    await run('aws elbv2 describe-listener-certificates --listener-arn $env:HTTPS_LISTENER_ARN --query "Certificates[].{Certificate:CertificateArn,Default:IsDefault}" --output table', awsTable('DescribeListenerCertificates', ['Certificate', 'Default'], [
      [`arn:aws:acm:ap-northeast-1:${ACCT}:certificate/3b7e19c4-0d2a-4f6e-9a51-c8e2f07d4b13`, 'True'], [`arn:aws:acm:ap-northeast-1:${ACCT}:certificate/9c04ad7e-51b3-4e28-8f6d-2a7b3e90c5f1`, 'False']]).map((l) => l.replace(ACCT, pii(ACCT)).replace(/certificate\/([0-9a-f-]{36})/, (m, u) => 'certificate/' + pii(u))), { kps: 38 });
    await wait(2600);
    await run('aws elbv2 describe-target-health --target-group-arn $env:TG_ARN --query "TargetHealthDescriptions[].{Target:Target.Id,Port:Target.Port,State:TargetHealth.State}" --output table', [], { kps: 36 });
    await out(awsTable('DescribeTargetHealth', ['Port', 'State', 'Target'], [['80', 'healthy', '10.0.11.24']]).map((l) => l.replace('10.0.11.24', pii('10.0.11.24'))));
    Term.render('<span class="caret"></span>');
    Issue.ok(termFind('healthy', 1, 640), 'web01：healthy');
    await wait(2700);
    Issue.hide();
    await Code.openFile('web01/httpd/saitama-arena.conf', { top: 0 });
    Caption.set('web01 の Apache は :80 の VirtualHost（ALB のヘルスチェック用ページも）');
    await hoverUi(Code.lineEl(1), { ax: 0.3, hold: 800 });
    await hoverUi(Code.lineEl(11), { ax: 0.3, hold: 1200 });
  });

  /* 5 — hosts: the new server on this PC first; the redirect loop */
  scene('hosts', async () => {
    Caption.step(5);
    Caption.set('hosts に ALB の IP を書いて、この PC だけ先に新サーバーを見る（DNS はまだ旧サーバー）');
    await run('code C:\\Windows\\System32\\drivers\\etc\\hosts', [], { kps: 26 });
    Code.show(HOSTS, { top: 4 });
    await wait(500);
    const last = Code.files[HOSTS].lines.length - 1;
    await Code.clickAt(last, 0);
    await Code.type(K.codeScript([F.HOSTS_LINE], JA), { kps: 18 });
    await saveHosts();
    check(HOSTS, F.done.hosts, 'hosts');
    await run('ipconfig /flushdns', ['', 'Windows IP 構成', '', 'DNS リゾルバー キャッシュは正常にフラッシュされました。'], { kps: 18 });
    // the site on the new server
    await Win.switchTo('browser');
    await Browser.clickTab('site');
    await Browser.reload(async () => { await wait(900); }, { key: 'F5' });
    SA.NetErr.show('www.saitama-arena.co.jp');
    Browser.nav('site', { title: 'www.saitama-arena.co.jp', url: WWW + '/', page: 'neterr', fav: 'neterr' });
    mark('loop');
    Caption.issue('リダイレクトループ', '新サーバーで「このページは動作していません」：リダイレクトが繰り返し行われた');
    Issue.show(R(() => $('#netErr .ne-msg'), 10), 'ERR_TOO_MANY_REDIRECTS');
    await wait(4100);
    Issue.hide();
    await Win.switchTo('code');
    await run('curl.exe -sI https://www.saitama-arena.co.jp/', ['HTTP/1.1 301 Moved Permanently', `Date: ${httpDate()}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Length: 0', 'Connection: keep-alive', 'Server: Apache', 'X-Redirect-By: WordPress', 'Location: https://www.saitama-arena.co.jp/', ''], { kps: 22 });
    Caption.issue('リダイレクトループ', 'https で開いても WordPress が https へリダイレクト：ALB で HTTPS を終端しているので、web01 には http で届く');
    Issue.show(termFind('X-Redirect-By', 2, 640), 'https → https へ 301');
    await wait(4300);
    Issue.hide();
    // wp-config.php: X-Forwarded-Proto
    Caption.set('wp-config.php：ALB が付ける X-Forwarded-Proto を見て、https のアクセスとして扱う');
    await Code.panel(true);
    await Code.openFile(CONFIG, { top: 20 });
    const before = Code.find("if ( ! defined( 'ABSPATH' ) ) {").line;
    await Code.clickAt(before, 0);
    await Code.type([...tabScript(F.PROXY_FIX.slice(0, -1)), { key: 'Enter' }, { key: 'Enter' }], { kps: 22 });
    await Code.save();
    check(CONFIG, F.done.config, 'wp-config proxy');
    await Code.panel(true, { tall: true });
    await run('scp web01/wp-config.php web01:/var/www/html/', ['wp-config.php                                 100% 2061   431.9KB/s   00:00'], { kps: 26 });
    await run('curl.exe -sI https://www.saitama-arena.co.jp/', H200(), { kps: 22 });
    Caption.fixed('200 OK：ループが解消。新サーバー（Server: Apache）からページが返る');
    Issue.ok(termFind('HTTP/1.1 200 OK', 6, 640), '200 OK');
    await wait(3200);
    Issue.hide();
    // the site, the admin on the new server
    await Win.switchTo('browser');
    await Browser.reload(async () => { await sitePage('site', 'home', '/', { after: 0 }); }, { key: 'F5' });
    Caption.fixed('新サーバーでトップページが表示された');
    await wait(1600);
    await hoverUi(Store.doc.querySelector('header') || Store.doc.body, { ax: 0.5, ay: 0.5, hold: 1200 });
    await Browser.typeUrl('www.saitama-arena.co.jp/schedule/');
    await sitePage('site', 'schedule', '/schedule/');
    Caption.set('/schedule/（イベントスケジュールのサイト）も新サーバーで表示');
    await wait(1900);
    await Store.scroll(520, 1300);
    await wait(900);
    await tabTo('wp');
    await Browser.typeUrl('www.saitama-arena.co.jp/wp-admin/network/sites.php');
    await wpScreen('net-sites', { ms: 600 });
    Caption.set('管理画面もそのまま：認証キーが旧サーバーと同じなのでログイン状態が続く。3 サイトとも表示');
    Issue.ok(R('#the-list', 4), '3 サイト');
    await wait(4100);
    Issue.hide();
    // the main site: its address stays as it is
    const first = WP.el('#the-list tr:first-child');
    await hoverUi(first.querySelector('.column-blogname strong a'), { hold: 600 });
    await clickUi(first.querySelector('.row-actions .edit a'), { kind: 'hand', after: 60 });
    await wpScreen('site-info');
    Caption.set('メインサイトの編集画面：サイトアドレス（URL）は https://www.saitama-arena.co.jp/ のまま（今回の移転では URL を変えない）');
    const addr = WP.els('.form-table tr').find((tr) => /サイトアドレス/.test(tr.textContent));
    Issue.ok(R(addr, 4), 'URL はそのまま');
    await wait(4600);
    Issue.hide();
  });

  /* 6 — Route 53: www → the load balancer */
  scene('dns', async () => {
    Caption.step(6);
    Caption.set('Route 53：www を ALB のエイリアスに切り替える（UPSERT）');
    await Win.switchTo('code');
    await Code.openFile(DNS, { top: 0 });
    Issue.ok(linesRect(5, 13, 900), 'www → ALB（エイリアス）');
    await wait(3200);
    Issue.hide();
    // the hosts line goes first (then this PC sees what everybody sees)
    Code.show(HOSTS, { top: 4 });
    await wait(300);
    const hl = Code.files[HOSTS].lines.length - 1;
    await Code.clickAt(hl, 8);
    await Keycap.show(['Ctrl', 'Shift', 'K'], 500);
    Code.setText(HOSTS, F.HOSTS_BASE.join('\n'));
    Code.files[HOSTS].dirty = true;
    Code.renderTabs();
    await wait(300);
    await saveHosts();
    // the zone as it is: only www changes (the mail, the name servers, the certificate's validation record stay)
    Caption.set('ゾーンの中身を確認：変えるのは www の A レコードだけ。メール（MX）・NS・証明書の検証用 CNAME はそのまま');
    const VAL = '_8f3c2a91d6e07b4f5a1c9e2d7b60a3f1';
    await run('aws route53 list-resource-record-sets --hosted-zone-id $env:ZONE_ID --query "ResourceRecordSets[].[Name,Type,TTL]" --output table', awsTable('ListResourceRecordSets', ['', '', ''], [
      ['saitama-arena.co.jp.', 'MX', '60'], ['saitama-arena.co.jp.', 'NS', '172800'], ['saitama-arena.co.jp.', 'SOA', '900'],
      [`${VAL}.www.saitama-arena.co.jp.`, 'CNAME', '300'], ['www.saitama-arena.co.jp.', 'A', '300']]).map((l) => l.replace(VAL, pii(VAL))), { kps: 34 });
    Issue.ok(termFind('www.saitama-arena.co.jp.  ', 1, 620), 'これだけ変更');
    await wait(4100);
    Issue.hide();
    Caption.set('Route 53：www を ALB のエイリアスに切り替える（UPSERT）');
    await run('aws route53 change-resource-record-sets --hosted-zone-id $env:ZONE_ID --change-batch file://dns/www-alias-alb.json', [], { kps: 34 });
    const id = 'C08423751K3XQ9PZ2B1MV';
    await out(['{', '    "ChangeInfo": {', `        "Id": "/change/${id}",`, '        "Status": "PENDING",', `        "SubmittedAt": "${isoUtc()}",`, '        "Comment": "www を新サーバー（ALB）へ 2026-11-10"', '    }', '}'].map(esc));
    Term.render('<span class="caret"></span>');
    await wait(1600);
    await run(`aws route53 get-change --id ${id} --query ChangeInfo.Status`, [() => wait(500), '"INSYNC"'], { kps: 30 });
    Issue.ok(termFind('INSYNC', 1, 320), '反映済み');
    await wait(1900);
    Issue.hide();
    W11.skipTo('22:58');
    Caption.set('TTL（300 秒）が切れるのを待って確認：www は ALB の 2 つの IP に（エイリアスなので TTL 60）');
    await run('ipconfig /flushdns', ['', 'Windows IP 構成', '', 'DNS リゾルバー キャッシュは正常にフラッシュされました。'], { kps: 22 });
    await run('Resolve-DnsName www.saitama-arena.co.jp', dnsTable([['www.saitama-arena.co.jp', 60, '52.198.113.180'], ['www.saitama-arena.co.jp', 60, '57.180.176.201']]), { kps: 22 });
    Issue.ok(termFind('52.198.113.180', 2, 760), '新サーバー（ALB）');
    await wait(3000);
    Issue.hide();
    Caption.set('http は ALB が https へ 301（awselb）、https は新サーバーの Apache が 200');
    await run('curl.exe -sI http://www.saitama-arena.co.jp/', ['HTTP/1.1 301 Moved Permanently', 'Server: awselb/2.0', `Date: ${httpDate()}`, 'Content-Type: text/html', 'Content-Length: 134', 'Connection: keep-alive', 'Location: https://www.saitama-arena.co.jp:443/', ''], { kps: 22 });
    Issue.ok(termFind('Server: awselb/2.0', 5, 640), 'ALB → https');
    await wait(2400);
    Issue.hide();
    await run('curl.exe -sI https://www.saitama-arena.co.jp/', H200(), { kps: 22 });
    await wait(2200);
    Caption.set('新サーバーのアクセスログ：ALB のヘルスチェックと、閲覧者のリクエストが届き始めた');
    await run('ssh web01 "sudo tail -n 6 /var/log/httpd/saitama-arena_access.log"', accessLog(), { kps: 30 });
    Issue.ok(termRect(7, 1500), '新サーバーで配信中');
    await wait(4600);
    Issue.hide();
  });

  /* 7 — the new domain arena.gmo: a temporary redirect until the URL change; that day's search-replace as a dry run */
  scene('gmo', async () => {
    Caption.step(7);
    Caption.set('新ドメイン arena.gmo：URL 変更は 12 月に延期（10/28 のお知らせ）。それまでは現行サイトへ一時転送（302）');
    await Win.switchTo('browser');
    await Browser.clickTab('site');
    await Browser.typeUrl('www.saitama-arena.co.jp/news/2026/10283546.html');
    await sitePage('site', 'notice', '/news/2026/10283546.html');
    const body = Store.doc.querySelector('main') || Store.doc.querySelector('article') || Store.doc.body;
    const para = [...Store.doc.querySelectorAll('p, div')].find((e) => /arena\.gmo/.test(e.textContent) && e.textContent.length < 400) || body;
    await Store.scrollToEl(para, 260, 1200);
    Issue.ok(R(para, 6), '（新）https://arena.gmo/', { below: true });
    await wait(4300);
    Issue.hide();
    // the virtual host of arena.gmo
    await Win.switchTo('code');
    await Code.openFile(GMO, { top: 0 });
    Caption.set('arena.gmo の VirtualHost：https のアクセスを www へ 302（変更日には www 側から arena.gmo へ 301）');
    const at = Code.find('DocumentRoot').line;
    await Code.newLineAfter(at);
    await Code.type(K.codeScript(['', ...F.VHOST_GMO_RULES], JA, { after: Code.files[GMO].lines[at], unit: '    ' }), { kps: 22 });
    await Code.save();
    check(GMO, F.done.gmo, 'arena-gmo.conf');
    await run('scp web01/httpd/arena-gmo.conf web01:/tmp/; ssh web01 "sudo mv /tmp/arena-gmo.conf /etc/httpd/conf.d/ && sudo apachectl configtest && sudo systemctl reload httpd"', [
      'arena-gmo.conf                                100%  498   112.4KB/s   00:00', () => wait(600), 'Syntax OK'], { kps: 34 });
    await run('curl.exe -sI https://arena.gmo/', ['HTTP/1.1 302 Found', `Date: ${httpDate()}`, 'Content-Type: text/html; charset=UTF-8', 'Connection: keep-alive', 'Server: Apache', 'X-Frame-Options: SAMEORIGIN',
      'Vary: X-Forwarded-Proto', 'Location: https://www.saitama-arena.co.jp/', 'Cache-Control: max-age=3600', `Expires: ${httpDate(3600)}`, 'Referrer-Policy: no-referrer-when-downgrade', 'X-XSS-Protection: 1; mode=block', ''], { kps: 22 });
    Issue.ok(termFind('HTTP/1.1 302 Found', 8, 640), 'arena.gmo → www（302）');
    await wait(3000);
    Issue.hide();
    // the URL change day: the replacement as a dry run
    Caption.set('URL 変更日に流す置換を --dry-run で確認：3 サイト分。guid は変えない（--skip-columns=guid）');
    await run("ssh web01 \"cd /var/www/html && wp search-replace 'https://www.saitama-arena.co.jp' 'https://arena.gmo' --network --skip-columns=guid --dry-run --report-changed-only\"", [() => wait(1500),
      ...cliTable(['Table', 'Column', 'Replacements', 'Type'], [
        ['wp_2_options', 'option_value', 4, 'PHP'], ['wp_2_postmeta', 'meta_value', 2841, 'PHP'], ['wp_2_posts', 'post_content', 4127, 'SQL'],
        ['wp_3_options', 'option_value', 4, 'PHP'], ['wp_3_posts', 'post_content', 1964, 'SQL'], ['wp_options', 'option_value', 7, 'PHP'],
        ['wp_postmeta', 'meta_value', 512, 'PHP'], ['wp_posts', 'post_content', 3388, 'SQL'], ['wp_sitemeta', 'meta_value', 1, 'PHP']]),
      okLine('12848 replacements to be made.')], { kps: 36 });
    Issue.ok(termFind('replacements to be made', 1, 600), '変更日に実行（--dry-run を外す）');
    await wait(3800);
    Issue.hide();
    Caption.set('変更日の手順：この置換・wp-config の DOMAIN_CURRENT_SITE・wp_blogs のドメイン → www から 301');
    await Code.openFile('README.md', { top: 14 });
    Issue.ok(linesRect(25, 28, 900), '12 月の URL 変更');
    await wait(3500);
    Issue.hide();
  });

  /* 8 — the live site */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中のサイト：arena.gmo は現行の www へ転送、サイトは新サーバーから');
    await Win.switchTo('browser');
    await Browser.newTab('live');
    await Browser.typeUrl('arena.gmo');
    Browser.nav('live', { title: 'arena.gmo', url: 'https://arena.gmo/', page: 'blank', fav: 'blank' });
    Browser.loading('live', true);
    await wait(500);
    await sitePage('live', 'home', '/', { after: 0 });
    mark('live');
    await wait(1900);
    // the certificate the load balancer serves (ACM)
    Caption.set('証明書の確認：ロードバランサーの ACM 証明書（発行元 Amazon RSA 2048 M01）');
    await clickUi($('#brLock'), { kind: 'arrow', after: 120 });
    SA.Cert.bubble(1);
    await wait(900);
    await clickUi(SA.Cert.el('.sa-pi-row.sec'), { kind: 'arrow', after: 120 });
    SA.Cert.bubble(2);
    await wait(1400);
    await clickUi(SA.Cert.el('.sa-pi-row.cert'), { kind: 'arrow', after: 120 });
    SA.Cert.hideBubble();
    const cv = SA.Cert.viewer(true);
    await wait(500);
    Issue.ok(R(() => cv.querySelector('.sa-cert-b'), 2), '発行元 Amazon RSA 2048 M01', { below: true });
    await hoverUi(cv.querySelectorAll('.sa-cert-b dl')[1], { hold: 1600 });
    await wait(3500);
    Issue.hide();
    await clickUi(cv.querySelectorAll('.sa-cert-wc')[1], { kind: 'arrow', after: 100 });
    SA.Cert.viewer(false);
    Caption.set('公開中のサイト：arena.gmo は現行の www へ転送、サイトは新サーバーから');
    await wait(800);
    await Store.scroll(700, 1600);
    await wait(1600);
    await Store.scroll(1500, 1600);
    await wait(1600);
    await Store.scroll(0, 1000);
    await Browser.typeUrl('www.saitama-arena.co.jp/schedule/');
    await sitePage('live', 'schedule', '/schedule/');
    Caption.set('イベントスケジュール（/schedule/）：マルチサイトの 3 サイトとも新サーバーで公開中');
    await wait(1600);
    await Store.scroll(600, 1500);
    await wait(2000);
    Cursor.kind('arrow');
    Caption.set('サーバー移転：WP-CLI と rsync でマルチサイトを移行・ロードバランサー + SSL・DNS 切り替え・新ドメイン arena.gmo の準備');
    await wait(4500);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'schedule', 'notice'],
    fontText: JSON.stringify(JA) + Object.values(TITLE).join('') + F.README.join('') + 'このページは動作していませんでリダイレクトが繰り返し行われました。Cookie を削除してみてください。再読み込み管理者として再試行キャンセル保存に失敗しましたアクセス許可が不十分ですを選択してください構成DNS リゾルバー キャッシュは正常にフラッシュされました。',
    async prepare() {
      const tree = [
        ['dns', 'dir', 1], ['dns/www-alias-alb.json'], ['dns/www-ttl-300.json'],
        ['web01', 'dir', 1], ['web01/httpd', 'dir', 1], ['web01/httpd/arena-gmo.conf'], ['web01/httpd/saitama-arena.conf'], ['web01/wp-config.php'],
        ['.gitignore'], ['README.md'],
      ];
      Code.init({ ...P }, tree);
      Code.files[CONFIG].indent = '\t';
      Code.files[GMO].indent = '    ';
      Code.files['web01/httpd/saitama-arena.conf'].indent = '    ';
      Code.addFile(HOSTS, F.HOSTS_BASE.join('\n'), { silent: true });
      Code.files[HOSTS].crlf = true;
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'wp', title: '新しいタブ', url: '', page: 'blank', fav: 'blank' });
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
