/*
 * Timeline: GMOアリーナさいたま (www.saitama-arena.co.jp, the WordPress multisite moved to the new servers on 2026-11-10)
 * — the custom plugin "Arena Events Sync": the spec (the 催事管理システム's API) → the API client (wp_remote_get) → the
 * admin (Settings API: イベント連携 › 設定, the network activation, the settings) → 今すぐ同期: WordPress' 「重大なエラー」
 * (the API's 404 → count(null), a PHP 8 TypeError) → the errors handled, the URL fixed → 12 events → 本日開催のイベント
 * from the plugin's function: a 11/14 event shows on 11/13 (gmdate: the dates in UTC) → wp_date, `wp arena-events sync`
 * → the REST API → WP-Cron, PHPCS (unsanitized $_GET, unescaped output) → git → the production server → the live site.
 * Every WordPress screen is real (js/wp-snapshot.js — tools/snapshots/wp-saitama-arena-plugin/capture-wp.js: this
 * plugin, js/plugin-src.js, installed and run at each stage); the site is the live www.saitama-arena.co.jp
 * (js/site-snapshot.js). The 催事管理システム, the servers and the terminal output around them are reconstructions.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP, W11 = window.Win11, AP = window.AP;
  const { $, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store } = K;
  const P = F.files, PL = F.PL;
  const DEV = 'http://localhost:8888', WWW = 'https://www.saitama-arena.co.jp';
  const PD = PL.DIR;
  const MAIN = PD + 'arena-events.php', API = PD + 'includes/class-arena-events-api.php', ADMIN = PD + 'includes/class-arena-events-admin.php';
  const IMP = PD + 'includes/class-arena-events-importer.php', FUNCS = PD + 'includes/functions.php', DAILY = F.DAILY;
  const at = (stage, file) => PL.files(stage)[file.slice(PD.length)];
  const TITLE = { home: S.title, schedule: 'イベントスケジュール｜GMOアリーナさいたま' };
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '催事管理システム（': { r: 'saijikanrisisutemu(', segs: ['催事', '管理', 'システム（'] },
    '）': { r: ')', segs: ['）'] },
    'の': { r: 'no', segs: ['の'] },
    '例：': { r: 'rei:', segs: ['例：'] },
    '催事管理システムの': { r: 'saijikanrisisutemuno', segs: ['催事', '管理', 'システムの'] },
    'エラー（': { r: 'era-(', segs: ['エラー（'] },
    '）：': { r: '):', segs: ['）：'] },
    '応答を読み取れません': { r: 'outouwoyomitoremasen', segs: ['応答を', '読み取れません'] },
    '関数内でエスケープ済み。': { r: 'kansuunaideesuke-puzumi.', segs: ['関数内で', 'エスケープ', '済み。'] },
    '結果を表示するだけ（処理はしない）。': [{ r: 'kekkawohyoujisurudake(', segs: ['結果を', '表示', 'するだけ（'] }, { r: 'shorihashinai).', segs: ['処理は', 'しない）。'] }],
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
  // PHP files: tabs (WordPress coding standards); the API key in the docs blurred like personal data
  /** a file opened from the explorer: scrolled to the first column (VS Code keeps the view per file; ours follows the caret) */
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  /** the terminal panel (tall for long output): the terminal scrolled to its prompt again after the resize */
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); if (Code.ins && Code.active) { Code.ensureVisible(Code.ins.line); Code.render(); } Term.render('<span class="caret"></span>'); };
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) {
    const f = Code.files[path];
    if (f && /\.php$/.test(path)) f.indent = '\t';
    show0(path, o);
  };

  /* ------------------------------------------------ what the commands print (at the video's clock) */
  const pii = (t) => `<span class="pii">${esc(t)}</span>`;
  const blank = (lines) => lines.map((l) => (l === '' ? ' ' : l));
  const run = (cmd, out, o = {}) => Term.run(cmd, blank(out), { kps: 24, ...o });
  /** a WP-CLI / MySQL style table (East Asian characters count two columns, as in a terminal) */
  const cw = (s) => [...String(s)].reduce((n, c) => n + (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(c) ? 2 : 1), 0);
  const padW = (s, w) => String(s) + ' '.repeat(Math.max(0, w - cw(s)));
  /** a terminal draws East Asian characters two columns wide: each in a 2ch box, so padded columns line up */
  const wide = (html) => html.replace(/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/g, (c) => `<span class="w2">${c}</span>`);
  function cliTable(cols, rows) {
    const w = cols.map((c, i) => Math.max(cw(c), ...rows.map((r) => cw(r[i]))));
    const line = '+' + w.map((n) => '-'.repeat(n + 2)).join('+') + '+';
    const row = (r) => '| ' + r.map((v, i) => padW(v, w[i])).join(' | ') + ' |';
    return [line, row(cols), line, ...rows.map(row), line].map((l) => wide(esc(l)));
  }
  /** npm run cli -- … → wp-env run cli wp … */
  const ms = () => `${2 + Math.floor(Math.random() * 2)}s ${100 + Math.floor(Math.random() * 800)}ms`;
  async function cli(args, out, o = {}) {
    await run('npm run cli -- ' + args, ['', `<span class="tdim">&gt; saitama-arena-wp@ cli</span>`, `<span class="tdim">&gt; wp-env run cli wp ${esc(args)}</span>`, '',
      `<span class="tc">ℹ</span> Starting 'wp ${esc(args)}' on the cli container. `, '', ...(o.wait ? [() => wait(o.wait)] : []), ...out,
      `<span class="tg">✔</span> Ran \`wp ${esc(args)}\` in 'cli'. <span class="tdim">(in ${ms()})</span>`], o);
  }
  const ok = (t) => `<span class="tg">Success:</span> ${esc(t)}`;
  const DATA = WP.data || {};

  /* ------------------------------------------------------------- editor / terminal / browser helpers */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? WP.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
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
  const SD = (rel) => DEV + '/schedule/wp-admin/' + rel;
  const wpKey = {};
  /** a WordPress screen in a tab (its real title and address), the page loading for a moment */
  async function wpScreen(key, o = {}) {
    const tab = o.tab || 'wp';
    if (o.loading !== false) { Browser.loading(tab, true); await wait(o.ms || 450); }
    await WP.show(key);
    wpKey[tab] = key;
    Browser.nav(tab, { title: WP.title(key), url: o.url || WP.url(key), page: 'wp', fav: 'wp' });
    if (o.loading !== false) Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 300);
  }
  async function tabTo(id) {
    await Browser.clickTab(id);
    if (Browser.tab(id).page === 'wp' && wpKey[id]) await WP.show(wpKey[id]);
  }
  async function wpType(name, text, o = {}) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 60 });
    WP.focus(box, true);
    await typeInto(WP.typeInto(name, null, o.base ? { base: o.base } : {}), [{ direct: text }], { kps: 12 });
    WP.blur(name);
  }
  /** an API key typed into a captured box: ● in the key display, • in the box */
  async function wpSecret(name, n) {
    const box = WP.field(name);
    await clickUi(box, { kind: 'text', ax: 0.12, after: 60 });
    WP.focus(box, true);
    await D.Ime.setMode(false, true);
    for (let k = 1; k <= n; k++) {
      KeyStrip.key('●');
      box.innerHTML = '•'.repeat(k) + '<span class="demo-caret"></span>';
      await D.kw(1000 / 14 * (0.55 + Math.random() * 0.9));
    }
    KeyStrip.idleHide(700);
    WP.blur(name);
  }
  const textEl = (sel, re) => WP.els(sel).find((e) => re.test(e.textContent));
  /** the site (the live snapshot) at an address */
  async function sitePage(tab, page, url, o = {}) {
    Browser.nav(tab, { title: TITLE[page], url, page: 'store', fav: 'store' });
    Browser.loading(tab, true);
    await Store.load(page, { states: o.states || [] });
    Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 500);
    return Store.doc;
  }
  /** 本日開催のイベント on the home page: scrolled into view */
  async function toDaily() {
    const el = Store.doc.querySelector('#daily-event');
    const y = el ? el.getBoundingClientRect().top + Store.doc.defaultView.scrollY - 70 : 600;
    await Store.scroll(y, 1100);
    await wait(400);
  }
  const dailyRect = () => () => screenRect(Store.doc.querySelector('.daily-event_body') || Store.doc.querySelector('#daily-event'));

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the spec: the 催事管理システム's API, what is there from yesterday */
  scene('spec', async () => {
    Caption.step(1);
    Caption.set('依頼：催事管理システムに登録したイベントを、イベントスケジュール（/schedule/）へ自動で取り込む');
    await hoverUi(Code.lineEl(2), { ax: 0.3, hold: 900 });
    Issue.ok(linesRect(5, 13, 980), '要件');
    await wait(3600);
    Issue.hide();
    Caption.set('催事管理システムの API：GET /events（Bearer 認証）。日時は日本時間（+09:00）の ISO 8601');
    await hoverUi(Code.lineEl(16), { ax: 0.3, hold: 600 });
    Issue.ok(linesRect(15, 20, 980), 'API v1');
    await wait(3000);
    Issue.hide();
    await openAt('docs/api-sample.json', { top: 0 });
    Caption.set('応答の例：1 件ごとに ID・タイトル・開始 / 終了日時・カテゴリー・会場タイプ・入場料・お問合せ・リンク・画像');
    Issue.ok(linesRect(4, 16, 900), '2026さいたまるしぇ（11/14〜15）');
    await wait(3400);
    Issue.hide();
    Caption.set('昨日までに作ったもの：取り込み（importer）・同期ログの一覧（WP_List_Table）・WP-CLI コマンド');
    for (const n of ['functions.php', 'class-arena-events-importer.php', 'class-arena-events-log-table.php', 'class-arena-events-cli.php']) {
      const node = Code.node(PD + 'includes/' + n);
      if (node) await hoverUi(node, { hold: 420 });
    }
    await wait(500);
    // the importer: one event → one post (the theme's own meta keys), skipped when nothing changed
    await openAt(IMP);
    const se = lineOf(Code.text(IMP), 'private function save_event(');
    await Code.reveal(se + 14, 700);
    const mi = lineOf(Code.text(IMP), '$meta    = array(');
    Caption.set('取り込み：イベント ID で投稿を探し、なければ追加・変わっていれば更新。開催日はテーマが使っているメタ（event_start / event_end）');
    Issue.ok(linesRect(mi, mi + 8, 900), '投稿のメタ');
    await wait(3400);
    const un = lineOf(Code.text(IMP), '$this->unchanged( $post_id');
    Issue.ok(linesRect(un, un + 2, 900), '変わっていなければ保存しない');
    await wait(2600);
    Issue.hide();
    // today: the theme queries the posts itself (the dates typed in by hand)
    await openAt(DAILY, { top: 20 });
    const od = F.files[DAILY].split('\n').indexOf(F.DAILY_OLD[0]);
    Caption.set('いまのトップページ：テーマが投稿を検索して「本日開催のイベント」を出している（開催日は担当者の手入力）');
    Issue.ok(linesRect(od + 1, od + 11, 1000), 'テーマで検索（event_start / event_end）');
    await wait(3600);
    Issue.hide();
    Caption.set('開発環境：wp-env（本番のマルチサイトのデータベースをコピー）');
    await panel(false);
    await run('npm start', ['', '<span class="tdim">&gt; saitama-arena-wp@ start</span>', '<span class="tdim">&gt; wp-env start</span>', '', 200,
      async () => Term.spin('Starting WordPress…', 1800, '<span class="tg">✔</span> WordPress development site started at <span class="tc">http://localhost:8888</span>'),
      '<span class="tg">✔</span> WordPress test site started at http://localhost:8889',
      '<span class="tg">✔</span> MySQL is listening on port 51723', '',
      '<span class="tg">✔</span> Done! <span class="tdim">(in 21s 307ms)</span>'], { kps: 14 });
    await wait(900);
  });

  /* 2 — the API client */
  scene('api', async () => {
    Caption.step(2);
    await Code.panel(false);
    Caption.set('API クライアント：includes/class-arena-events-api.php（API の URL と API キーを受け取るクラス）');
    const A = at(0, API).split('\n');
    const gi = A.findIndex((l) => /public function get_events/.test(l));
    const end = A.findIndex((l, i) => i > gi && l === '\t}');
    await Code.newFile(API);
    await Code.paste([...A.slice(0, gi + 1), ...A.slice(end)].join('\n'));
    await wait(600);
    Caption.set('get_events()：wp_remote_get でイベントを取得。タイムアウト 15 秒、Authorization: Bearer で API キーを送る');
    await Code.reveal(gi, 500);
    await Code.newLineAfter(gi);
    await Code.type(tabScript(A.slice(gi + 1, end), A[gi]), { kps: 20 });
    await Code.save({ status: 'U' });
    check(API, at(0, API), 'api.php');
    const h = lineOf(Code.text(API), "'headers' => array(");
    Issue.ok(linesRect(h - 1, h + 3, 760), 'タイムアウト・Bearer 認証');
    await wait(2600);
    Issue.hide();
    const r = lineOf(Code.text(API), "return $data['events'];");
    Issue.ok(linesRect(r - 1, r, 760), 'JSON の events を返す');
    await wait(2200);
    Issue.hide();
    // the API itself, from this PC (the office network): the key from an environment variable
    Caption.set('API の動作確認：社内ネットワークから Invoke-RestMethod で叩いてみる（API キーは環境変数から）');
    await panel(true);
    const evs = (DATA.cliSync && DATA.cliSync.changes) || [];
    const wi = Math.max(2, ...evs.map((e) => cw(e.id)));
    await run('(Invoke-RestMethod "https://saiji.sa.internal/api/v1/events?from=2026-11-01&to=2027-04-30" -Headers @{ Authorization = "Bearer $env:SAIJI_API_KEY" }).events | Format-Table id, start_date, title',
      ['', `${padW('id', wi)} start_date                title`, `${padW('--', wi)} ----------                -----`,
        ...evs.map((e) => wide(esc(`${padW(e.id, wi)} ${e.start}T00:00:00+09:00 ${e.title}`))), ''], { kps: 34, gap: 70 });
    Issue.ok(termFind('EV2604-165', evs.length, 1000), `${evs.length} 件（11 月のイベント）`);
    await wait(3200);
    Issue.hide();
    await panel(false);
  });

  /* 3 — the admin: Settings API, the network activation, the settings */
  scene('admin', async () => {
    Caption.step(3);
    Caption.set('管理画面：includes/class-arena-events-admin.php（メニュー「イベント連携」、同期ログと設定のページ）');
    const L = at(0, ADMIN).split('\n');
    const fl = L.findIndex((l) => /add_settings_section\( 'arena_events_api'/.test(l));
    await Code.newFile(ADMIN);
    await Code.paste([...L.slice(0, fl), ...L.slice(fl + 2)].join('\n'));
    await wait(500);
    const mn = lineOf(Code.text(ADMIN), 'public function menu()');
    await Code.reveal(mn + 2, 600);
    Issue.ok(linesRect(mn + 1, mn + 3, 1150), 'イベント連携 › 同期ログ / 設定（manage_options）');
    await wait(2800);
    Issue.hide();
    Caption.set('設定は Settings API：register_setting と、API の URL・API キーなどの入力欄（add_settings_field）');
    await Code.reveal(fl - 1, 600);
    await Code.newLineAfter(fl - 1);
    await Code.type(tabScript(L.slice(fl, fl + 2), L[fl - 1]), { kps: 21 });
    await Code.save({ status: 'U' });
    check(ADMIN, at(0, ADMIN), 'admin.php');
    const san = lineOf(Code.text(ADMIN), 'public function sanitize(');
    await Code.reveal(san, 700);
    Issue.ok(linesRect(san, san + 9, 900), '保存前に整える（esc_url_raw ほか）');
    await wait(2600);
    Issue.hide();
    // the main file
    Caption.set('プラグイン本体 arena-events.php：Network: true（マルチサイト全体で有効化）。管理画面と自動同期はイベントスケジュールのサイトだけ');
    await Code.newFile(MAIN);
    await Code.paste(at(0, MAIN));
    await Code.save({ status: 'U' });
    await Code.reveal(0, 300);
    Issue.ok(linesRect(2, 11, 820), 'Arena Events Sync 1.0.0');
    await wait(2600);
    const ini = lineOf(Code.text(MAIN), 'function arena_events_init()');
    await Code.reveal(ini + 6, 600);
    Issue.ok(linesRect(ini + 5, ini + 12, 820), '/schedule/ だけ');
    await wait(2400);
    Issue.hide();
    await cli('plugin activate arena-events --network', ["Plugin 'arena-events' network activated.", ok('Network activated 1 of 1 plugins.')], { wait: 900 });
    await wait(600);
    // the network's plugins
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8888/wp-admin/network/plugins.php');
    await wpScreen('net-plugins', { ms: 700 });
    const row = WP.el('tr[data-slug="arena-events"]') || textEl('.wp-list-table tr', /Arena Events Sync/);
    if (row) { await hoverUi(row.querySelector('.plugin-title strong') || row, { hold: 600 }); Issue.ok(R(row, 2), 'ネットワークで有効'); await wait(2600); Issue.hide(); }
    // the settings on the schedule site
    Caption.set('イベントスケジュールの管理画面：イベント連携 › 設定');
    await Browser.typeUrl('localhost:8888/schedule/wp-admin/admin.php?page=arena-events-settings');
    await wpScreen('settings', { ms: 800 });
    await hoverUi(WP.el('#toplevel_page_arena-events > a') || WP.el('#adminmenu'), { hold: 700 });
    Caption.set('API の URL・API キー（催事管理システムの「外部連携」で発行）・通知先を入力して保存');
    await wpType('api_url', 'https://saiji.sa.internal/api');
    await wpSecret('api_key', 26);
    await wpType('notify', 'web-team@saitama-arena.example');
    await clickUi(WP.el('#submit'), { kind: 'hand', after: 60 });
    await wpScreen('settings-saved', { ms: 700 });
    Issue.ok(R(WP.el('#setting-error-settings_updated') || WP.el('.notice'), 2), '設定を保存しました');
    await wait(2200);
    Issue.hide();
  });

  /* 4 — 今すぐ同期: the fatal error, the errors handled, the URL */
  scene('sync', async () => {
    Caption.step(4);
    W11.skipTo('10:44');
    Caption.set('イベント連携 › 同期ログ：まだ同期していない。「今すぐ同期」で取り込んでみる');
    await clickUi(WP.el('#toplevel_page_arena-events > a'), { kind: 'hand', after: 60 });
    await wpScreen('log-empty');
    const nx = textEl('.wrap p', /次回の自動同期/);
    if (nx) { Issue.ok(R(nx, 2), '毎日 5:00 に自動同期'); await wait(2200); Issue.hide(); }
    await clickUi(WP.el('.page-title-action'), { kind: 'hand', after: 60 });
    await wpScreen('fatal', { ms: 1100 });
    mark('fatal');
    Caption.issue('重大なエラー', '「このサイトで重大なエラーが発生しました」：同期の途中で PHP が止まった');
    Issue.show(R(WP.el('.wp-die-message') || WP.el('body'), 6), '重大なエラー');
    await wait(3600);
    Issue.hide();
    // debug.log
    await Win.switchTo('code');
    const raw = String(DATA.fatal || '');
    // the real debug.log of the capture (the last 10 lines: the warning, the fatal error, its stack trace): its first 4
    const logLines = raw.split('\n').filter((l) => /PHP (Warning|Fatal error)|^Stack trace|^#0 /.test(l)).slice(0, 4)
      .map((l) => l.replace(/^\[[^\]]+\]/, '[13-Nov-2026 01:44:31 UTC]').replace(/\/wordpress\//g, '/var/www/html/'));
    const lines = logLines.length === 4 ? logLines : [
      '[13-Nov-2026 01:44:31 UTC] PHP Warning:  Undefined array key "events" in /var/www/html/wp-content/plugins/arena-events/includes/class-arena-events-api.php on line 66',
      '[13-Nov-2026 01:44:31 UTC] PHP Fatal error:  Uncaught TypeError: count(): Argument #1 ($value) must be of type Countable|array, null given in /var/www/html/wp-content/plugins/arena-events/includes/class-arena-events-importer.php:35',
      'Stack trace:',
      "#0 /var/www/html/wp-content/plugins/arena-events/includes/class-arena-events-admin.php(159): Arena_Events_Importer->sync('manual')"];
    await panel(true);
    await cli('eval "echo implode( \'\', array_slice( file( WP_CONTENT_DIR . \'/debug.log\' ), -10, 4 ) );"', lines.map((l) => esc(l).replace(/(PHP Fatal error:.*)$/, '<span class="tr">$1</span>').replace(/(PHP Warning:.*)$/, '<span class="ty">$1</span>')), { kps: 34 });
    Issue.show(termFind('Fatal error', 1, 1250), 'count() に null：TypeError（PHP 8）');
    await wait(3300);
    Issue.show(termFind('Undefined array key', 1, 1250), 'API の応答に events がない');
    Caption.issue('原因', 'API がエラー（404）を返したのに、確認せず $data[\'events\'] を使っていた');
    await wait(3600);
    Issue.hide();
    // the API errors handled
    Caption.set('応答を確認：通信エラー（WP_Error）・200 以外・events がない → WP_Error で返す');
    await panel(false);
    await openAt(API);
    const b0 = PL.bug(0);
    const a0 = lineOf(Code.text(API), '$data = json_decode(');
    await Code.reveal(a0, 500);
    await Code.selectLines(a0, a0 + 1);
    await Code.type(tabScript(b0.good.split('\n')), { kps: 21 });
    await Code.save();
    check(API, at(1, API), 'api.php errors');
    Caption.set('取り込み側：WP_Error なら同期ログに記録し、担当者へメールで通知して終わる');
    await openAt(IMP);
    const b1 = PL.bug(1);
    const x = b1.bad.replace(/\n$/, '');
    const e0 = lineOf(Code.text(IMP), x.trim());
    await Code.reveal(e0 + 4, 500);
    await Code.newLineAfter(e0);
    await Code.paste(b1.good.slice(x.length, b1.good.length - 1));
    await Code.save();
    check(IMP, at(1, IMP), 'importer errors');
    Issue.ok(linesRect(e0 + 2, e0 + 8, 900), 'ログ・通知して終了');
    await wait(2400);
    Issue.hide();
    // again
    W11.skipTo('10:46');
    await Win.switchTo('browser');
    await Keycap.show(['Alt', '←'], 600);
    await wpScreen('log-empty', { ms: 500 });
    await clickUi(WP.el('.page-title-action'), { kind: 'hand', after: 60 });
    await wpScreen('log-error', { ms: 900 });
    mark('apiError');
    const notice = WP.el('.notice-error') || WP.el('.notice');
    Caption.issue('API エラー（404）', 'Not Found: GET /api/events ── API の URL に /v1 が抜けていた');
    Issue.show(R(notice, 2), 'URL の入力ミス');
    await wait(3600);
    Issue.hide();
    const row = WP.el('.wp-list-table tbody tr');
    if (row) { Issue.ok(R(row, 1), '同期ログにも記録'); await wait(2000); Issue.hide(); }
    // the URL
    await clickUi(textEl('#toplevel_page_arena-events .wp-submenu a', /設定/), { kind: 'hand', after: 60 });
    await wpScreen('settings2');
    Caption.set('API の URL を https://saiji.sa.internal/api/v1 に直して保存');
    await wpType('api_url3', '/v1', { ax: 0.98, base: WP.value('api_url3') });
    await clickUi(WP.el('#submit'), { kind: 'hand', after: 60 });
    await wpScreen('settings-saved2', { ms: 700 });
    await wait(500);
    // 今すぐ同期
    W11.skipTo('10:48');
    await clickUi(textEl('#toplevel_page_arena-events .wp-submenu a', /同期ログ/), { kind: 'hand', after: 60 });
    await wpScreen('log-error', { after: 100 });
    WP.els('.notice').forEach((n) => { n.style.display = 'none'; });
    Caption.set('もう一度「今すぐ同期」');
    await wait(500);
    await clickUi(WP.el('.page-title-action'), { kind: 'hand', after: 60 });
    await wpScreen('log-ok', { ms: 1400 });
    mark('synced');
    Caption.fixed('同期できた：催事管理システムから 12 件を取得して、イベントスケジュールへ 12 件追加');
    Issue.ok(R(WP.el('.notice-success') || WP.el('.notice'), 2), '取得 12 件・追加 12 件');
    await wait(3000);
    Issue.ok(R(WP.el('.wp-list-table'), 2), '同期ログ');
    await wait(2200);
    Issue.hide();
  });

  /* 5 — 本日開催のイベント: the theme uses the plugin; the time zone; the REST API */
  scene('today', async () => {
    Caption.step(5);
    Caption.set('トップページの「本日開催のイベント」：テーマで投稿を検索していた部分を、プラグインの関数に置き換え');
    await Win.switchTo('code');
    await openAt(DAILY, { top: 14 });
    const o0 = F.files[DAILY].split('\n').indexOf(F.DAILY_OLD[0]);
    Issue.show(linesRect(o0, o0 + F.DAILY_OLD.length - 1, 1000), 'テーマの検索とループ（24 行）');
    await wait(2600);
    Issue.hide();
    await Code.selectLines(o0, o0 + F.DAILY_OLD.length - 1);
    await Code.type(tabScript([F.DAILY_NEW]), { kps: 20 });
    await Code.save();
    const head = F.files[DAILY].split('\n').slice(0, o0), tail = F.files[DAILY].split('\n').slice(o0 + F.DAILY_OLD.length);
    check(DAILY, [...head, F.DAILY_NEW, ...tail].join('\n'), 'daily-event.php');
    await openAt(FUNCS);
    const tl = lineOf(Code.text(FUNCS), 'function arena_events_today_list(');
    await Code.reveal(tl + 8, 600);
    Issue.ok(linesRect(tl, tl + 22, 1150), 'テーマと同じマークアップ（エスケープ済み）');
    await wait(3000);
    Issue.hide();
    // the dev site
    await Win.switchTo('browser');
    await Browser.newTab('dev');
    await Browser.typeUrl('localhost:8888');
    await sitePage('dev', 'home', DEV + '/', { states: ['today13', 'tzBug'] });
    await toDaily();
    mark('tzBug');
    Caption.issue('表示ミス', '11/13 の「本日開催」に、明日（11/14）からの「2026さいたまるしぇ」が出ている');
    Issue.show(() => { const li = [...Store.doc.querySelectorAll('.event-list_item')].find((e) => /るしぇ/.test(e.textContent)); return li ? screenRect(li) : dailyRect()(); }, '11/14〜15 のイベント');
    await wait(3800);
    Issue.hide();
    // the posts: the start dates
    await tabTo('wp');
    await clickUi(WP.el('#menu-posts > a'), { kind: 'hand', after: 60 });
    await wpScreen('posts-tz', { ms: 700 });
    const mr = textEl('.wp-list-table tbody tr', /るしぇ/);
    const cell = mr && (mr.querySelector('.column-event_date') || mr);
    Caption.issue('原因', '開催日が 2026/11/13 から：API の 2026-11-14T00:00:00+09:00 より 1 日早い（全件）');
    if (cell) { await hoverUi(cell, { hold: 600 }); Issue.show(R(cell, 3), '開始日が 1 日早い'); }
    await wait(3600);
    Issue.hide();
    // gmdate → wp_date
    await Win.switchTo('code');
    await openAt(IMP);
    const g = lineOf(Code.text(IMP), "gmdate( 'Y-m-d'");
    await Code.reveal(g, 700);
    Caption.issue('gmdate', 'gmdate は UTC の日付：日本時間 11/14 0:00 は UTC では 11/13 15:00');
    Issue.show(linesRect(g - 7, g, 900), 'UTC で日付にしていた');
    await wait(3600);
    Issue.hide();
    Caption.set('wp_date（サイトのタイムゾーン：Asia/Tokyo）で日付にする');
    await Code.overwrite('gmdate', [{ direct: 'wp_date' }], { from: g });
    await Code.save();
    check(IMP, at(2, IMP), 'importer wp_date');
    // sync again from WP-CLI
    W11.skipTo('10:55');
    await panel(true);
    Caption.set('WP-CLI で同期し直す：--dry-run で変わる内容を確認してから実行');
    const changes = (DATA.cliSync && DATA.cliSync.changes) || [];
    const rows = changes.map((c) => [c.id, c.title, c.start, c.status]);
    await cli('arena-events sync --url=localhost:8888/schedule/ --dry-run', [...cliTable(['id', 'title', 'start', 'status'], rows),
      ok(`取得 ${DATA.cliSync ? DATA.cliSync.fetched : 12} 件・追加 0 件・更新 ${rows.length} 件（dry run：保存していません）`)], { wait: 1300, kps: 30 });
    Issue.show(termFind('2026さいたまるしぇ', 1, 1200), 'さいたまるしぇ：2026-11-14 から');
    await wait(3000);
    Issue.hide();
    await cli('arena-events sync --url=localhost:8888/schedule/', [...cliTable(['id', 'title', 'start', 'status'], rows),
      ok(`取得 ${DATA.cliSync ? DATA.cliSync.fetched : 12} 件・追加 0 件・更新 ${rows.length} 件`)], { wait: 1500, kps: 30 });
    await wait(800);
    // the dev site again
    await Win.switchTo('browser');
    await tabTo('dev');
    await Browser.reload(async () => { await Store.load('home', { states: ['today13'] }); }, { key: 'F5' });
    await toDaily();
    mark('tzFixed');
    Caption.fixed('本日開催のイベント：11/13 に開催中の 3 件だけになった');
    Issue.ok(dailyRect(), '11/13 の 3 件');
    await wait(3200);
    Issue.hide();
    await tabTo('wp');
    await Keycap.show(['F5'], 400);
    await wpScreen('posts-ok', { ms: 600 });
    const mr2 = textEl('.wp-list-table tbody tr', /るしぇ/);
    if (mr2) { Issue.ok(R(mr2.querySelector('.column-event_date') || mr2, 3), '2026/11/14 ～ 2026/11/15'); await wait(2400); Issue.hide(); }
    // the REST API (the calendar on the home page)
    await Win.switchTo('code');
    // the REST API for the calendar: written now
    await panel(false);
    Caption.set('カレンダー用の REST API：register_rest_route（GET /wp-json/arena-events/v1/daily?date=…）');
    await openAt(FUNCS);
    const fl0 = Code.text(FUNCS).split('\n');
    const sc = fl0.findIndex((l) => l.startsWith('function arena_events_today_shortcode('));
    const close = fl0.findIndex((l, i) => i > sc && l === '}');
    await Code.reveal(close, 600);
    await Code.newLineAfter(close);
    const RA = F.REST_A.slice(0, -1).split('\n');
    const dEnd = RA.indexOf(' */');
    await Code.paste('\n\n' + RA.slice(0, dEnd + 1).join('\n'), { flash: false });
    await Code.type(tabScript(RA.slice(dEnd + 1), ' */'), { kps: 22 });
    await Code.paste('\n' + F.REST_B.slice(0, -2));
    await Code.save();
    check(FUNCS, at(3, FUNCS), 'functions.php REST');
    const rr = lineOf(Code.text(FUNCS), "'permission_callback' => '__return_true',");
    await Code.reveal(rr, 500);
    Issue.ok(linesRect(rr - 2, rr + 7, 900), '公開の情報・date は YYYY-MM-DD だけ');
    await wait(3000);
    Issue.hide();
    await panel(true);
    Caption.set('カレンダー用の REST API：/wp-json/arena-events/v1/daily?date=2026-11-14');
    const d14 = DATA.daily14 || [];
    const w1 = Math.max(5, ...d14.map((e) => cw(e.start))), w2 = Math.max(3, ...d14.map((e) => cw(e.end)));
    await run('(Invoke-RestMethod "http://localhost:8888/wp-json/arena-events/v1/daily?date=2026-11-14").events | Format-Table start, end, title',
      ['', `${padW('start', w1)} ${padW('end', w2)} title`, `${padW('-----', w1)} ${padW('---', w2)} -----`, ...d14.map((e) => wide(esc(`${padW(e.start, w1)} ${padW(e.end, w2)} ${e.title}`))), ''], { kps: 34 });
    Issue.ok(termFind('るしぇ', 1, 900), '11/14 にはさいたまるしぇが入る');
    await wait(3000);
    Issue.hide();
  });

  /* 6 — WP-Cron, PHPCS, git */
  scene('auto', async () => {
    await panel(true);
    Caption.step(6);
    Caption.set('毎日の自動同期（WP-Cron）：次回は 11/14 5:00（日本時間）');
    await cli('cron event list --url=localhost:8888/schedule/ --fields=hook,next_run_gmt,recurrence', cliTable(['hook', 'next_run_gmt', 'recurrence'], [
      ['wp_privacy_delete_old_export_files', '2026-11-13 02:12:40', '1 hour'],
      ['wp_version_check', '2026-11-13 12:31:07', '12 hours'],
      ['wp_update_plugins', '2026-11-13 12:31:07', '12 hours'],
      ['wp_update_themes', '2026-11-13 12:31:07', '12 hours'],
      ['arena_events_daily_sync', '2026-11-13 20:00:00', '1 day'],
      ['wp_scheduled_delete', '2026-11-14 00:21:44', '1 day'],
      ['delete_expired_transients', '2026-11-14 00:21:44', '1 day'],
      ['wp_site_health_scheduled_check', '2026-11-19 00:21:44', '1 week'],
    ]), { wait: 900, kps: 30 });
    Issue.ok(termFind('arena_events_daily_sync', 1, 820), '20:00 UTC = 5:00 日本時間・毎日');
    await wait(3000);
    Issue.hide();
    W11.skipTo('10:58');
    Caption.set('自動同期をいま 1 回だけ動かしてみる（wp cron event run）');
    await cli('cron event run arena_events_daily_sync --url=localhost:8888/schedule/', ["Executed the cron event 'arena_events_daily_sync' in 1.204s.", ok('Executed a total of 1 cron event.')], { wait: 1400, kps: 30 });
    await wait(600);
    await Win.switchTo('browser');
    await clickUi(WP.el('#toplevel_page_arena-events > a'), { kind: 'hand', after: 60 });
    await wpScreen(WP.has('log-cron') ? 'log-cron' : 'log-cli', { ms: 600 });
    Caption.set('同期ログ：手動・WP-CLI・自動（WP-Cron）の実行がすべて残る。今回は変更なし');
    const first = WP.el('.wp-list-table tbody tr');
    if (first) { Issue.ok(R(first, 1), '自動（WP-Cron）：取得 12・変更 0'); await wait(2800); }
    Issue.ok(R(WP.el('.wp-list-table'), 2), '同期ログ');
    await wait(2000);
    Issue.hide();
    // PHPCS
    await Win.switchTo('code');
    Caption.set('コミットの前に PHPCS（WordPress Coding Standards）でチェック');
    const A2 = at(2, ADMIN).split('\n');
    const l1 = A2.findIndex((l) => l.includes("$result = $_GET['arena_events_result']")) + 1;
    const l2 = A2.findIndex((l) => l.includes('echo \'<div class="notice notice-\'')) + 1;
    const W = 100, bar = '-'.repeat(W);
    const msg = (n, kind, lines) => lines.map((t, i) => esc(`${i ? '    ' : String(n).padStart(4)} | ${i ? '       ' : kind.padEnd(7)} | ${t}`));
    await run('composer lint', ['<span class="tdim">&gt; phpcs</span>', '',
      esc('FILE: C:\\work\\saitama-arena-wp\\wp-content\\plugins\\arena-events\\includes\\class-arena-events-admin.php'), bar,
      '<span class="tr">FOUND 4 ERRORS AND 1 WARNING AFFECTING 2 LINES</span>', bar,
      ...msg(l1, 'WARNING', ['Processing form data without nonce verification.', '(WordPress.Security.NonceVerification.Recommended)']),
      ...msg(l1, 'ERROR', ["$_GET['arena_events_result'] not unslashed before sanitization. Use wp_unslash() or similar", '(WordPress.Security.ValidatedSanitizedInput.MissingUnslash)']),
      ...msg(l1, 'ERROR', ["Detected usage of a non-sanitized input variable: $_GET['arena_events_result']", '(WordPress.Security.ValidatedSanitizedInput.InputNotSanitized)']),
      ...msg(l2, 'ERROR', ['All output should be run through an escaping function (see the Security sections in the', "WordPress Developer Handbook), found '$type'.", '(WordPress.Security.EscapeOutput.OutputNotEscaped)']),
      ...msg(l2, 'ERROR', ['All output should be run through an escaping function (see the Security sections in the', "WordPress Developer Handbook), found '$message'.", '(WordPress.Security.EscapeOutput.OutputNotEscaped)']),
      bar, '', 'Time: 712ms; Memory: 16MB', '', '<span class="tr">Script phpcs handling the lint event returned with error code 2</span>'], { kps: 18, gap: 60 });
    mark('phpcs');
    Caption.issue('コードチェック', '$_GET をサニタイズせずに使い、通知の HTML をエスケープせずに出力していた');
    Issue.show(termFind('FOUND 4 ERRORS', 1, 760), 'エラー 4・警告 1');
    await wait(3400);
    Issue.hide();
    await panel(false);
    await openAt(ADMIN);
    await Code.reveal(l1 - 1, 600);
    Issue.show(linesRect(l1 - 1, l1 - 1, 900), "$_GET をそのまま");
    await wait(2000);
    Issue.hide();
    const b3 = PL.bug(3), b4 = PL.bug(4);
    await Code.selectLines(l1 - 1, l1 - 1);
    await Code.type(tabScript(b3.good.split('\n')), { kps: 20 });
    const e2 = lineOf(Code.text(ADMIN), b4.bad.trim());
    await Code.reveal(e2, 500);
    await Code.selectLines(e2, e2);
    await Code.type(tabScript(b4.good.split('\n')), { kps: 20 });
    await Code.save();
    check(ADMIN, at(3, ADMIN), 'admin.php phpcs');
    Issue.ok(linesRect(l1 - 1, l1, 1100), 'wp_unslash → sanitize_key（表示だけなので nonce は不要）');
    await wait(2600);
    Issue.ok(linesRect(e2, e2, 1100), 'esc_attr / esc_html');
    await wait(2200);
    Issue.hide();
    await run('composer lint', ['<span class="tdim">&gt; phpcs</span>', ''], { kps: 18 });
    Caption.fixed('PHPCS：エラーなし');
    Issue.ok(termFind('> phpcs', 1, 400), 'エラー 0');
    await wait(2000);
    Issue.hide();
    // git
    Caption.set('コミットしてプッシュ');
    await run('git add -A; git commit -m "イベント連携プラグイン（催事管理システム API・同期ログ・本日開催のイベント）"', [
      esc('[main 4c1e7a2] イベント連携プラグイン（催事管理システム API・同期ログ・本日開催のイベント）'),
      ' 8 files changed, 958 insertions(+), 25 deletions(-)',
      ' create mode 100644 wp-content/plugins/arena-events/arena-events.php',
      ' create mode 100644 wp-content/plugins/arena-events/includes/class-arena-events-admin.php',
      ' create mode 100644 wp-content/plugins/arena-events/includes/class-arena-events-api.php'], { kps: 34 });
    await run('git push', ['To github.com:saitama-arena/saitama-arena-wp.git', '   8d2f3b1..4c1e7a2  main -&gt; main'], { kps: 20 });
    await wait(700);
  });

  /* 7 — the production server (web01, from the move of 2026-11-10), the live site */
  scene('deploy', async () => {
    Caption.step(7);
    await panel(true);
    W11.skipTo('11:18');
    Caption.set('本番サーバー web01（11/10 に移転した新サーバー）へ反映');
    await run('ssh web01', [`Last login: Thu Nov 12 17:40:02 2026 from ${pii('10.0.0.15')}`], { kps: 16 });
    AP.Shell.remote('deploy', 'web01');
    Term.render('<span class="caret"></span>');
    await run('cd /var/www/html/wp-content && git pull --ff-only', ['Updating 8d2f3b1..4c1e7a2', 'Fast-forward',
      ' plugins/arena-events/arena-events.php                      |  45 +++',
      ' plugins/arena-events/includes/class-arena-events-admin.php | 279 ++++++++++++',
      ' plugins/arena-events/includes/class-arena-events-api.php   |  83 ++++',
      ' themes/saitamaarena/template-parts/daily-event.php         |  26 +-',
      ' 8 files changed, 958 insertions(+), 25 deletions(-)'], { kps: 26 });
    AP.Shell.cd('wp-content');
    Term.render('<span class="caret"></span>');
    await run('wp plugin activate arena-events --network', ["Plugin 'arena-events' network activated.", ok('Network activated 1 of 1 plugins.')], { kps: 26 });
    Caption.set('本番の API キーと通知先を設定（キーはサーバーのファイルから。画面には出さない）');
    await run(`wp option update arena_events_settings --format=json --url=${WWW}/schedule/ < ~/arena-events-settings.json`, [ok("Updated 'arena_events_settings' option.")], { kps: 30 });
    Caption.set('本番で同期：既存のイベントは前日に ID を紐付け済み → 変更なし');
    await run(`wp arena-events sync --url=${WWW}/schedule/`, [() => wait(1400), ok('取得 12 件・追加 0 件・更新 0 件')], { kps: 30 });
    Issue.ok(termFind('取得 12 件', 1, 700), '本番：12 件');
    await wait(2200);
    Issue.hide();
    await run('exit', ['logout', 'Connection to web01 closed.'], { kps: 12 });
    AP.Shell.local();
    Term.render('<span class="caret"></span>');
    // the live site
    await Win.switchTo('browser');
    await Browser.newTab('live');
    await Browser.typeUrl('www.saitama-arena.co.jp');
    await sitePage('live', 'home', WWW + '/', { states: ['today13'] });
    mark('live');
    await wait(1200);
    await toDaily();
    Caption.set('公開中のサイト：トップページの「本日開催のイベント」はプラグインの出力');
    Issue.ok(dailyRect(), '本日開催のイベント（11/13）');
    await wait(3400);
    Issue.hide();
    await Browser.typeUrl('www.saitama-arena.co.jp/schedule/');
    await sitePage('live', 'schedule', WWW + '/schedule/');
    Caption.set('イベントスケジュール：催事管理システムのイベントが毎朝自動で入る');
    await wait(1400);
    await Store.scroll(520, 1400);
    await wait(2200);
    Cursor.kind('arrow');
    Caption.set('独自プラグイン：管理画面（設定・同期ログ）・催事管理システムの API 連携・本日開催のイベント（REST API）・毎日の自動同期と通知');
    await wait(4600);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'schedule'],
    fontText: JSON.stringify(JA) + Object.values(TITLE).join('') + P['README.md'] + P['docs/api-sample.json'] + '取得追加更新件同期ログ本日開催のイベント',
    async prepare() {
      const tree = [
        ['docs', 'dir', 1], ['docs/api-sample.json'],
        ['wp-content', 'dir', 1], ['wp-content/plugins', 'dir', 1], ['wp-content/plugins/arena-events', 'dir', 1], ['wp-content/plugins/arena-events/includes', 'dir', 1],
        [FUNCS.replace('functions.php', 'class-arena-events-cli.php')], [IMP], [PD + 'includes/class-arena-events-log-table.php'], [FUNCS],
        ['wp-content/themes', 'dir', 1], ['wp-content/themes/saitamaarena', 'dir', 1], ['wp-content/themes/saitamaarena/template-parts', 'dir', 1], [DAILY],
        ['.gitignore'], ['.wp-env.json'], ['composer.json'], ['package.json'], ['phpcs.xml.dist'], ['README.md'],
      ];
      Code.init({ ...P }, tree);
      for (const p of Object.keys(P)) if (/\.php$/.test(p)) Code.files[p].indent = '\t';
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
