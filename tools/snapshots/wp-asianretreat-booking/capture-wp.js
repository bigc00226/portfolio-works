/*
 * The real WordPress screens of the wp-asianretreat-booking video, captured from WordPress itself
 * (tools/wp/playground.js: WordPress Playground — real WordPress + PHP in the browser, Japanese, no account).
 *
 *   node tools/snapshots/wp-asianretreat-booking/capture-wp.js [screenshot folder]   → node tools/webp.js wp-asianretreat-booking
 *
 * The site: title アジアンリトリート, the page ご予約 (/booking/) with the live page's text. The live site's theme is
 * TCD「HAKU」(haku_tcd080), a paid theme that cannot be installed: a stand-in theme with the same folder name / name /
 * version outputs the live /booking/ page's own HTML (fetched from asianretreat.jp, scripts removed, its stylesheets
 * linked from asianretreat.jp) around the page content — so the plugin's calendar is drawn inside the real page.
 * screenshot.png = the live site's first view.
 * Booking Package (wordpress.org, with its Japanese language pack) is searched / installed / activated through
 * プラグインを追加; every setting the video shows is made through the plugin's own screens (the calendar's name, the
 * services, the time slots of a day through 「時間枠を設定」, the input fields, the notification e-mails, the
 * preparation time), and a test booking is made through the real booking calendar on /booking/ as a visitor.
 * Done in PHP (not shown being made): the same time slots on the other days until the end of December (the plugin's
 * own INSERT), the other nine services' second step (same screen as the first), the live pages.
 * Changed for the demo (tools/wp/playground.js): the Playground address → https://asianretreat.jp, the capture date →
 * 2026-11-12 (the video's clock); here: the admin calendar's "past day" shading moved to the video's today (12).
 * wp_mail is switched off in the Playground (an mu-plugin: pre_wp_mail → true): the Playground cannot send mail.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const WPC = require(path.join(ROOT, 'tools/wp/playground'));
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sharp = require(path.join(ROOT, 'node_modules/sharp'));
const ID = 'wp-asianretreat-booking';
const DIR = path.join(ROOT, 'public/videos', ID);
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const { log, wait } = WPC;
const LIVE = 'https://asianretreat.jp';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const DEBUG = {};

/* ------------------------------------------------------------------ the data (the live menu & price pages) */
const SERVICES = [
  ['もみほぐし 60分', 60, 9900], ['もみほぐし 90分', 90, 14400], ['もみほぐし 120分', 120, 18600],
  ['タイ古式マッサージ 60分', 60, 10500], ['タイ古式マッサージ 90分', 90, 15300], ['タイ古式マッサージ 120分', 120, 19800],
  ['バリニーズアロマ 60分', 60, 11400], ['バリニーズアロマ 90分', 90, 16650], ['バリニーズアロマ 120分', 120, 21600],
  ['台湾式足つぼ 60分', 60, 10500],
];
const CAL_NAME = '出張マッサージのご予約';
const MAIL = {
  subject: '【アジアンリトリート】ご予約を承りました（[bookingDateAndTime]）',
  body: `[first_name] 様

このたびはアジアンリトリートをご予約いただき、誠にありがとうございます。
以下の内容でご予約を承りました。

ご予約番号：[id]
ご予約日時：[bookingDateAndTime]
メニュー：[services]
お支払い方法：[paymentMethod]
合計金額：[totalAmount]

ご訪問先：[address]

セラピストがすべての備品をお持ちいたします。
当日はお部屋でリラックスしてお待ちください。
ご予約の変更・キャンセルは LINE またはこのメールへの返信でお知らせください。

アジアンリトリート
湘南発出張マッサージ（藤沢・鎌倉・茅ヶ崎）
https://asianretreat.jp/`,
  adminSubject: '【WEB予約】[bookingDateAndTime] [first_name] 様',
  adminBody: `WEB予約が入りました。

ご予約番号：[id]
ご予約日時：[bookingDateAndTime]
メニュー：[services]
お支払い方法：[paymentMethod]
合計金額：[totalAmount]

お名前：[first_name]（[last_name]）
電話番号：[phone]
メール：[email]`,
};
MAIL.adminBodyFixed = MAIL.adminBody.replace('メール：[email]', 'メール：[email]\n\nご訪問先：[address]');
const FIELDS = { first_name: 'お名前', last_name: 'フリガナ', email: 'メールアドレス', phone: '電話番号', address: 'ご訪問先のご住所', terms: 'キャンセルポリシー' };
const BOOKER = { first_name: '山本 彩', last_name: 'ヤマモト アヤ', email: 'aya.yamamoto@example.jp', phone: '090-1234-5678', address: '神奈川県藤沢市鵠沼海岸 3-2-1-506' };

/* ------------------------------------------------------------------ the live page and the theme screenshot */
async function liveBooking() {
  const r = await fetch(LIVE + '/booking/', { headers: { 'user-agent': UA, 'accept-language': 'ja' } });
  let h = await r.text();
  h = h.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
  // what the theme's scripts do once the page is shown: the content blocks fade in (class "active" when scrolled
  // into view); HAKU marks the device on <html> (pc / mobile, from wp_is_mobile())
  h = h.replace(/class="([^"]*)\bdc2_animate_item\b([^"]*)"/g, 'class="$1dc2_animate_item active$2"');
  h = h.replace('<html class="pc"', '<html class="<?php echo wp_is_mobile() ? \'mobile\' : \'pc\'; ?>"');
  // the live stylesheets inlined (fetched here: the capture's in-page fetch of another origin's CSS comes back empty),
  // their url()s absolute — downloaded with the screens like any other asset
  for (const m of [...h.matchAll(/<link[^>]+rel=['"]stylesheet['"][^>]*>/gi)]) {
    const href = (m[0].match(/href=['"]([^'"]+)['"]/) || [])[1];
    if (!href || !/^https:\/\/asianretreat\.jp\//.test(href)) continue;
    try {
      let css = await (await fetch(href, { headers: { 'user-agent': UA } })).text();
      css = css.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => (/^(data:|#)/.test(u) ? all : `url(${q}${new URL(u, href).href}${q})`));
      h = h.replace(m[0], () => `<style data-live="${href.replace(/"/g, '')}">${css.replace(/<\/style/gi, '<\\/style')}</style>`);
    } catch (e) { log('css failed', href, e.message); }
  }
  const open = h.indexOf('<div class="post_content clearfix">');
  const inner = h.indexOf('>', open) + 1;
  const close = h.indexOf('</div>', h.indexOf('</p>', h.lastIndexOf('asianretreat.jp@gmail.com')));
  const head = h.slice(0, h.indexOf('</head>'));
  return {
    before: h.slice(0, inner).replace('</head>', '<?php wp_head(); ?>\n</head>'),
    content: h.slice(inner, close).trim(),
    after: h.slice(close).replace('</body>', '<?php wp_footer(); ?>\n</body>'),
    headOk: !!head,
  };
}
async function themeScreenshot() {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--lang=ja-JP', '--hide-scrollbars'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 900 });
  await p.setExtraHTTPHeaders({ 'accept-language': 'ja' });
  await p.goto(LIVE + '/', { waitUntil: 'networkidle2', timeout: 90000 });
  await wait(5000);
  const png = await p.screenshot({ type: 'png' });
  await b.close();
  return sharp(png).png({ palette: true, quality: 90, effort: 10 }).toBuffer();
}

/* ------------------------------------------------------------------ helpers */
const SCHED = '/wp-admin/admin.php?page=booking-package_schedule_page';
async function openCalendar(cap, tab) {
  await cap.go(SCHED, '#calendar_list_table tr td');
  const find = (n) => { const tr = [...document.querySelectorAll('#calendar_list_table tr')].find((t) => { const x = ((t.children[1] || {}).textContent || '').trim(); return x === n || x === 'First Calendar'; }); if (!tr) return false; tr.click(); return true; };
  let ok = false;
  for (let i = 0; i < 30 && !ok; i++) { await wait(700); ok = await cap.eval(find, CAL_NAME); }
  if (!ok) throw new Error('calendar row not found');
  await wait(3500);
  if (tab) { await cap.eval((t) => document.getElementById(t).click(), tab); await wait(3500); }
}
const clickText = (cap, sel, re) => cap.eval((s, r) => { const e = [...document.querySelectorAll(s)].filter((x) => x.offsetParent).find((x) => new RegExp(r).test(x.textContent.trim())); if (!e) return false; e.click(); return true; }, sel, re);
const setVal = (cap, sel, v) => cap.eval((s, val) => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return false; e.value = val; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; }, sel, v);
/** marks the n-th visible element matching `sel` (inside `within`) with data-cap="name" (for capture inputs / clicks) */
const mark = (cap, sel, name, n = 0, within = 'body') => cap.eval((s, nm, i, w) => { const R = document.querySelector(w) || document.body; const e = [...R.querySelectorAll(s)].filter((x) => x.offsetParent)[i]; if (!e) return false; e.setAttribute('data-cap', nm); return true; }, sel, name, n, within);
async function dump(cap, key) {
  DEBUG[key] = await cap.eval(() => [...document.querySelectorAll('input, select, textarea, button, .selectable_day_slot, .selectable_time_slot, .selectable_service_slot, [id]')].filter((e) => e.offsetParent).slice(0, 160)
    .map((e) => `${e.tagName}${e.id ? '#' + e.id : ''}${e.name ? '[name=' + e.name + ']' : ''}${e.type ? '[' + e.type + ']' : ''}.${String(e.className).slice(0, 40)} ${String(e.value || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)}`)).catch((e) => ['dump failed ' + e.message]);
  fs.writeFileSync(path.join(SHOTS || DIR, 'capture-debug.json'), JSON.stringify(DEBUG, null, 1));
}

if (!process.argv.includes('--fix-today')) (async () => {
  const [png, page] = await Promise.all([themeScreenshot(), liveBooking()]);
  log('theme screenshot', (png.length / 1024).toFixed(0), 'KB; live booking page', page.content.length, 'chars');

  const cap = await WPC.start({ id: ID, site: LIVE, date: '2026-11-12', time: '10:15', shots: SHOTS, serverPath: '/home/asianretreat/public_html/wp-content/' });
  await cap.boot(WPC.blueprint({ title: 'アジアンリトリート', tagline: '湘南発出張マッサージ', themes: ['twentytwentyfive'] }));
  // the plugin answers some actions with alert() / confirm(): accepted (and logged), as a person would click OK
  const pg = (await cap.browser.pages()).filter((p) => /playground/.test(p.url())).pop();
  pg.on('dialog', async (d) => { log('dialog:', d.type(), JSON.stringify(d.message()).slice(0, 200)); DEBUG.dialogs = (DEBUG.dialogs || []).concat(d.message()); await d.accept().catch(() => null); });

  // the stand-in for TCD「HAKU」: the live /booking/ page's HTML around the page content
  const tpl = `<?php\n/* stand-in for TCD HAKU (haku_tcd080): the live page's markup around the content */\nwhile ( have_posts() ) : the_post(); ?>\n${page.before}\n<?php the_content(); ?>\n${page.after}\n<?php endwhile;\n`;
  const T = 'wp-content/themes/haku_tcd080/';
  await cap.files({
    [T + 'style.css']: '/*\nTheme Name: HAKU\nTheme URI: https://tcd-theme.com/tcd080\nDescription: WordPressテーマ「HAKU」\nAuthor: Design Plus\nAuthor URI: https://tcd-theme.com/\nVersion: 2.8.3\nText Domain: tcd-haku\n*/\n',
    [T + 'index.php']: tpl,
    [T + 'page.php']: tpl,
    [T + 'functions.php']: "<?php\nadd_theme_support( 'post-thumbnails' );\n",
    'wp-content/mu-plugins/demo-no-mail.php': "<?php\n/* the Playground cannot send mail: wp_mail() reports success without sending */\nadd_filter( 'pre_wp_mail', '__return_true' );\n",
  });
  await cap.php("file_put_contents( WP_CONTENT_DIR . '/themes/haku_tcd080/screenshot.png', base64_decode( $data ) ); switch_theme( 'haku_tcd080' ); return true;", png.toString('base64'));
  const ids = await cap.php(`
    wp_delete_post( 1, true ); wp_delete_post( 2, true );
    $mk = function ( $title, $slug, $content = '', $order = 0 ) { return wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug, 'post_content' => $content, 'menu_order' => $order, 'post_date' => '2023-09-14 23:00:27' ] ); };
    $r = [];
    $r['about'] = $mk( 'ASIAN RETREATについて', 'about', '', 1 );
    $r['therapists'] = $mk( 'セラピスト一覧', 'therapists', '', 2 );
    $r['menu'] = $mk( 'メニュー＆料金', 'menu', '', 3 );
    $r['booking'] = $mk( 'ご予約', 'booking', '<!-- wp:html -->' . "\\n" . $data . "\\n" . '<!-- /wp:html -->', 4 );
    $r['blog'] = $mk( 'ブログ＆お知らせ', 'blog', '', 5 );
    update_option( 'permalink_structure', '/%postname%/' ); flush_rewrite_rules();
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core' => [ 'welcomeGuide' => false, 'isComplementaryAreaVisible' => true, 'enableChoosePatternModal' => false ], 'core/edit-post' => [ 'welcomeGuide' => false ], '_modified' => gmdate( 'c' ) ] );
    update_user_meta( 1, 'show_welcome_panel', 0 );
    return $r;`, page.content);
  log('pages', JSON.stringify(ids));
  cap.data.pages = ids;

  /* ---------------------------------------------------------------- 1. dashboard, the plugin */
  await cap.go('/wp-admin/', '#wpadminbar');
  await cap.capture('dashboard');
  await cap.go('/wp-admin/plugin-install.php?s=Booking+Package&tab=search&type=term', '.plugin-card');
  await wait(2500);
  await cap.capture('plugin-search', { settle: 1200 });
  await cap.eval(() => document.querySelector('.plugin-card-booking-package .install-now').click());
  for (let i = 0; i < 120; i++) { await wait(1000); if (await cap.eval(() => !!document.querySelector('.plugin-card-booking-package .activate-now'))) break; }
  await wait(1500);
  await cap.capture('plugin-installed', { settle: 800 });
  await cap.translations();
  const actUrl = await cap.eval(() => document.querySelector('.plugin-card-booking-package .activate-now').getAttribute('href'));
  await cap.go('/wp-admin/' + actUrl.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), '#wpadminbar').catch(() => null);
  await cap.go('/wp-admin/plugins.php?activate=true', '.wp-list-table.plugins');
  await cap.translations();
  await cap.go('/wp-admin/plugins.php?activate=true', '.wp-list-table.plugins');
  await cap.capture('plugins');
  cap.info.plugins = await cap.php("$p = []; foreach ( get_plugins() as $f => $d ) if ( is_plugin_active( $f ) ) $p[ dirname( $f ) ] = $d['Version']; return $p;");

  /* ---------------------------------------------------------------- 2. the calendar, its name; the services */
  await cap.go(SCHED, '#calendar_list_table tr td');
  await wait(2500);
  await cap.capture('cal-list', { settle: 800 });
  await openCalendar(cap, 'settingLink');
  await mark(cap, '#settingPanel input.regular-text', 'calname');
  await cap.capture('cal-setting', { inputs: [['[data-cap="calname"]', 'calname']], settle: 800 });
  await cap.eval((n) => { const e = document.querySelector('[data-cap="calname"]'); e.value = n; e.dispatchEvent(new Event('change', { bubbles: true })); }, CAL_NAME);
  await clickText(cap, '#settingPanel button, button', '^保存$');
  await wait(3500);
  await dump(cap, 'after-calname');
  // the services
  await openCalendar(cap, 'courseLink');
  await cap.capture('svc-empty', { settle: 800 });
  for (const [i, [name, min, cost]] of SERVICES.entries()) {
    await clickText(cap, '#coursePanel button', '新規項目を追加');
    await wait(2500);
    await mark(cap, '#addCoursePanel input.regular-text', 'svcname', 0);
    await mark(cap, '#addCoursePanel input[type="text"]:not(.regular-text)', 'svccost', 0);
    if (i === 0) {
      await cap.eval(() => window.scrollTo(0, 0));
      await cap.capture('svc-add', { inputs: [['[data-cap="svcname"]', 'svcname'], ['[data-cap="svccost"]', 'svccost']], settle: 800 });
    }
    await cap.eval((o) => {
      const set = (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
      set(document.querySelector('[data-cap="svcname"]'), o.name);
      set(document.querySelector('[data-cap="svccost"]'), String(o.cost));
      const sel = [...document.querySelectorAll('#addCoursePanel select')].find((s) => [...s.options].some((x) => x.value === '120') && [...s.options].some((x) => x.value === '5'));
      if (sel) set(sel, String(o.min));
    }, { name, cost, min });
    if (i === 0) {
      await cap.eval(() => { const s = [...document.querySelectorAll('#addCoursePanel select')].find((x) => [...x.options].some((o) => o.value === '120')); if (s) s.scrollIntoView({ block: 'center' }); });
      await cap.capture('svc-add-time', { settle: 600 });
    }
    await clickText(cap, '#addCoursePanel button, #coursePanel button, button', '^保存$');
    await wait(3000);
  }
  await openCalendar(cap, 'courseLink');
  await cap.capture('svc-list', { settle: 800 });
  // 「この機能を有効化する」: the services are only offered once the feature is switched on (the plugin warns in red)
  const sw = await cap.eval(() => {
    const area = document.querySelector('#coursePanel .switchArea');
    if (!area) return 'no switch';
    const c = area.querySelector('input[type="checkbox"]'), lab = area.querySelector('label') || area;
    lab.setAttribute('data-cap', 'svcswitch');
    c.click();
    return `checked=${c.checked}`;
  });
  log('services switch', sw);
  await wait(3000);
  await cap.capture('svc-list-on', { settle: 800 });
  log('services feature', JSON.stringify(await cap.php("global $wpdb; return $wpdb->get_row( \"SELECT courseBool, courseTitle FROM {$wpdb->prefix}booking_package_calendar_accounts WHERE `key` = 1\", ARRAY_A );")));
  cap.data.services = await cap.php("global $wpdb; return $wpdb->get_results( \"SELECT `key`, name, time, cost FROM {$wpdb->prefix}booking_package_services ORDER BY ranking, `key`\", ARRAY_A );");

  /* ---------------------------------------------------------------- 3. the time slots of a day; the month */
  await openCalendar(cap, 'calendarLink');
  await cap.capture('sched-month-empty', { settle: 800 });
  await cap.eval(() => document.querySelector('#schedulePage [data-day="19"][data-month="11"]').click());
  await wait(3000);
  await dump(cap, 'sched-day');
  await cap.capture('sched-day-set', { settle: 800 });
  // 時間枠を設定: 10:00 から 20:00 まで、30分間隔、締め切り 0、枠 1
  const setOk = await cap.eval(() => {
    const times = [...document.querySelectorAll('input')].filter((e) => e.offsetParent && /^\d\d:\d\d$/.test(e.value));
    if (times.length < 2) return 'times ' + times.length;
    let dlg = times[0];
    while (dlg && !(dlg.querySelectorAll && dlg.querySelectorAll('select').length >= 2 && [...dlg.querySelectorAll('button')].some((b) => /適用/.test(b.textContent)))) dlg = dlg.parentElement;
    if (!dlg) return 'no dialog';
    dlg.setAttribute('data-cap', 'slotdlg');
    times[0].setAttribute('data-cap', 'from'); times[1].setAttribute('data-cap', 'to');
    const sels = [...dlg.querySelectorAll('select')];
    const set = (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    set(times[0], '10:00'); set(times[1], '20:00');
    const iv = sels.find((s) => [...s.options].some((o) => o.value === '30'));
    if (iv) { set(iv, '30'); iv.setAttribute('data-cap', 'interval'); }
    return 'ok ' + times.map((t) => t.type + '=' + t.value).join(',') + ' | ' + sels.map((s) => s.value + ':' + [...s.options].slice(0, 5).map((o) => o.value).join('/')).join(' | ');
  });
  log('time slot dialog', setOk);
  await cap.capture('sched-day-set-filled', { settle: 600 });
  await cap.eval(() => { const b = [...document.querySelectorAll('[data-cap="slotdlg"] button')].find((x) => /適用/.test(x.textContent)); if (b) b.click(); });
  await wait(2000);
  await cap.capture('sched-day-filled', { settle: 800 });
  await clickText(cap, 'button', '^保存$');
  await wait(4000);
  await dump(cap, 'sched-saved');
  // the same slots on the other days (as 「編集」 with the days selected does): 2026-11-20 … 2026-12-31
  const pub = await cap.php(`
    global $wpdb; $t = $wpdb->prefix . 'booking_package_schedules'; $n = 0;
    $acc = (int) $wpdb->get_var( "SELECT \`key\` FROM {$wpdb->prefix}booking_package_calendar_accounts WHERE type = 'day' ORDER BY \`key\` LIMIT 1" );
    $rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $t WHERE accountKey = %d AND year = 2026 AND month = 11 AND day = 19", $acc ), ARRAY_A );
    for ( $d = strtotime( '2026-11-20' ); $d <= strtotime( '2026-12-31' ); $d += 86400 ) {
      $y = (int) gmdate( 'Y', $d ); $m = (int) gmdate( 'n', $d ); $dd = (int) gmdate( 'j', $d );
      foreach ( $rows as $r ) {
        $u = (int) date( 'U', mktime( $r['hour'], $r['min'], 0, $m, $dd, $y ) );
        $wpdb->query( $wpdb->prepare( "INSERT INTO $t (accountKey, unixTime, year, month, day, weekKey, hour, min, title, capacity, remainder, stop, holiday, cost, deadlineTime, publishingDate) VALUES (%d,%d,%d,%d,%d,%d,%d,%d,%s,%d,%d,%s,%s,%d,%d,%d)",
          $acc, $u, $y, $m, $dd, (int) date( 'w', $u ), $r['hour'], $r['min'], $r['title'], $r['capacity'], $r['remainder'], $r['stop'], 'false', 0, $r['deadlineTime'], 0 ) ); $n++;
      }
    }
    return [ 'account' => $acc, 'perDay' => count( $rows ), 'inserted' => $n ];`);
  log('published', JSON.stringify(pub));
  cap.data.slots = pub;
  await openCalendar(cap, 'calendarLink');
  await cap.capture('sched-month', { settle: 1000 });

  /* ---------------------------------------------------------------- 4. the input fields */
  await openCalendar(cap, 'formLink');
  await cap.capture('form-list', { settle: 800 });
  const order = ['first_name', 'last_name', 'email', 'phone', 'zip', 'address', 'terms'];
  for (const id of ['address', 'first_name', 'last_name', 'email', 'phone', 'terms']) {
    const idx = order.indexOf(id);
    await cap.eval((i) => [...document.querySelectorAll('#formPanel .dnd_edit')][i].click(), idx);
    await wait(2500);
    await mark(cap, 'input.regular-text', 'fname', 1);
    if (id === 'address') await cap.capture('form-edit', { inputs: [['[data-cap="fname"]', 'fname']], settle: 800 });
    await cap.eval((o) => {
      const set = (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
      set(document.querySelector('[data-cap="fname"]'), o.name);
      if (o.required) { const r = [...document.querySelectorAll('input[name="required"]')][0]; if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }
      if (o.options) { const op = document.querySelector('[id="0_0"]'); if (op) set(op, o.options); }
    }, { name: FIELDS[id], required: id === 'address', options: id === 'terms' ? '同意する' : '' });
    if (id === 'address') await cap.capture('form-edit-filled', { settle: 600 });
    await clickText(cap, 'button', '^保存$');
    await wait(3000);
  }
  await cap.php(`global $wpdb; $t = $wpdb->prefix . 'booking_package_form'; $row = $wpdb->get_row( "SELECT * FROM $t WHERE accountKey = 1", ARRAY_A ); return $row ? substr( $row['data'], 0, 400 ) : null;`).then((x) => log('form', x));
  await openCalendar(cap, 'formLink');
  await cap.capture('form-list-ja', { settle: 800 });

  /* ---------------------------------------------------------------- 5. the notification e-mails (新規) */
  async function openMail() {
    await openCalendar(cap, 'emailLink');
    await clickText(cap, '#emailPanel th, #emailPanel td, #emailPanel div, #emailPanel span', '^新規$');
    await wait(3000);
  }
  await openMail();
  await cap.capture('mail-list-new', { settle: 600 });
  await cap.capture('mail-new', { inputs: [['#subject', 'msubj'], ['#emailContent', 'mbody']], settle: 800 });
  await cap.eval((m) => { const s = document.querySelector('#subject'), b = document.querySelector('#emailContent'); s.value = m.subject; b.value = m.body; s.dispatchEvent(new Event('change', { bubbles: true })); b.dispatchEvent(new Event('change', { bubbles: true })); }, MAIL);
  await clickText(cap, '#email_edit_panel *, .edit_tab, div, span, label', '^管理者向け$');
  await wait(1500);
  await dump(cap, 'mail-admin');
  const adminIds = await cap.eval(() => [...document.querySelectorAll('input[type="text"], textarea')].filter((e) => e.offsetParent).map((e) => e.id || e.name || e.className));
  log('admin tab fields', JSON.stringify(adminIds));
  await mark(cap, 'input.mail_subject, input[type="text"]', 'asubj', 0, '#email_edit_panel');
  await mark(cap, 'textarea', 'abody', 0, '#email_edit_panel');
  await cap.capture('mail-new-admin', { inputs: [['[data-cap="asubj"]', 'asubj'], ['[data-cap="abody"]', 'abody']], settle: 800 });
  await cap.eval((m) => { const s = document.querySelector('[data-cap="asubj"]'), b = document.querySelector('[data-cap="abody"]'); s.value = m.adminSubject; b.value = m.adminBody; s.dispatchEvent(new Event('change', { bubbles: true })); b.dispatchEvent(new Event('change', { bubbles: true })); }, MAIL);
  await clickText(cap, '#buttonPanel_for_schedule button, button', '^保存$');
  await wait(3500);
  cap.data.mail = await cap.php("global $wpdb; return $wpdb->get_results( \"SELECT * FROM {$wpdb->prefix}booking_package_email_settings\", ARRAY_A );");
  log('mail settings', JSON.stringify(cap.data.mail).slice(0, 600));

  /* ---------------------------------------------------------------- 6. payments: the general settings (Stripe needs the paid plan) */
  await cap.go('/wp-admin/admin.php?page=booking-package_setting_page', '#setting_table');
  await wait(3500);
  // 一般 › サイト名・メールアドレス: the shop's name and its public address (on the live /booking/ page), saved through the form
  const SHOP = { name: 'アジアンリトリート', mail: 'asianretreat.jp@gmail.com' };
  const sMarks = await cap.eval(() => {
    const ins = [...document.querySelectorAll('#setting_table input[type="text"], #setting_table input[type="email"], #setting_table input:not([type])')].filter((e) => e.offsetParent).slice(0, 4);
    ['sitename', 'mailto', 'fromname', 'mailfrom'].forEach((k, i) => ins[i] && ins[i].setAttribute('data-cap', k));
    return ins.map((e) => e.value);
  });
  log('settings fields', JSON.stringify(sMarks));
  await cap.capture('settings', { inputs: [['[data-cap="sitename"]', 'sitename'], ['[data-cap="mailto"]', 'mailto'], ['[data-cap="fromname"]', 'fromname'], ['[data-cap="mailfrom"]', 'mailfrom']], settle: 800 });
  await cap.eval((s) => {
    const set = (k, v) => { const e = document.querySelector(`[data-cap="${k}"]`); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
    set('sitename', s.name); set('mailto', s.mail); set('fromname', s.name); set('mailfrom', s.mail);
  }, SHOP);
  await clickText(cap, '#setting_table button, button', '変更を保存');
  await wait(3500);
  await cap.go('/wp-admin/admin.php?page=booking-package_setting_page', '#setting_table');
  await wait(3500);
  await cap.capture('settings-saved', { settle: 800 });
  log('settings saved', JSON.stringify(await cap.eval(() => [...document.querySelectorAll('#setting_table input[type="text"]')].filter((e) => e.offsetParent).slice(0, 4).map((e) => e.value))));
  await cap.eval(() => { const h = [...document.querySelectorAll('#setting_table *')].find((e) => /^Stripe$/.test(e.textContent.trim()) && e.children.length === 0); if (h) h.scrollIntoView(); window.scrollBy(0, -20); });
  await wait(800);
  await cap.capture('settings-stripe', { settle: 600 });
  await cap.eval(() => window.scrollTo(0, 0));
  await cap.eval(() => document.getElementById('subscriptionLink').click()).catch(() => null);
  await wait(3000);
  await cap.capture('subscription', { settle: 800 });
  // the calendar's payment methods (in its 設定 tab)
  await openCalendar(cap, 'settingLink');
  await cap.eval(() => { const th = [...document.querySelectorAll('#settingPanel th')].find((x) => /支払い方法/.test(x.textContent)); if (th) th.scrollIntoView({ block: 'center' }); });
  await wait(800);
  await cap.capture('cal-payment', { settle: 600 });
  await cap.eval(() => { const th = [...document.querySelectorAll('#settingPanel th')].find((x) => /準備時間/.test(x.textContent)); if (th) th.scrollIntoView({ block: 'center' }); });
  await wait(800);
  await cap.capture('cal-prep', { settle: 600 });
  await dump(cap, 'cal-setting-rows');

  /* ---------------------------------------------------------------- 7. the page: the shortcode block */
  cap.data.shortcode = '[booking_package id=1]';
  await cap.go(`/wp-admin/post.php?post=${ids.booking}&action=edit`, 'iframe[name="editor-canvas"]');
  await wait(4500);
  await cap.capture('page-edit', { settle: 1200 });
  const SEARCH = '.block-editor-inserter__search input, .editor-inserter-sidebar input[type="search"], .components-search-control__input';
  await cap.eval(() => document.querySelector('.editor-document-tools__inserter-toggle').click());
  await wait(2000);
  await cap.type(SEARCH, 'ショートコード');
  await wait(2000);
  await cap.capture('page-inserter', { inputs: [[SEARCH, 'search']], settle: 1000 });
  // the block goes at the top of the page's content (before the HTML block with the live text)
  await cap.eval(() => {
    const b = wp.blocks.createBlock('core/shortcode', { text: '' });
    wp.data.dispatch('core/block-editor').insertBlocks(b, 0);
    wp.data.dispatch('core/block-editor').selectBlock(b.clientId);
  });
  await wait(2500);
  await cap.eval(() => { const t = document.querySelector('.editor-inserter-sidebar__close-button, .block-editor-inserter__close-button'); if (t) t.click(); });
  await wait(1000);
  const scSel = 'textarea.blocks-shortcode__textarea, .wp-block-shortcode textarea';
  await cap.capture('page-sc', { inputs: [[scSel, 'sc']], settle: 1200 }).catch(async (e) => { log('page-sc', e.message); });
  await cap.eval((sc) => { const blk = wp.data.select('core/block-editor').getBlocks().find((x) => x.name === 'core/shortcode'); wp.data.dispatch('core/block-editor').updateBlockAttributes(blk.clientId, { text: sc }); }, cap.data.shortcode);
  await wait(1500);
  await cap.eval(() => document.querySelector('.editor-post-publish-button, .editor-header__settings .is-primary').click());
  for (let i = 0; i < 40; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.components-snackbar'))) break; }
  await wait(800);
  await cap.capture('page-updated', { settle: 400 });

  try {
  /* ---------------------------------------------------------------- 8. the booking calendar as a visitor; a test booking */
  await cap.logout();
  async function front(key, view = 'max') {
    await cap.view(view);
    await cap.go('/booking/', 'body');
    await wait(4000);
    await cap.eval(() => { const c = document.querySelector('[id^="booking-package"]'); if (c) c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); });
    await wait(800);
    if (key) await cap.capture(key, { settle: 800 });
  }
  await front('front-cal');
  await dump(cap, 'front-cal');
  // 11/21 (土)
  const pickDay = () => cap.eval(() => { const d = [...document.querySelectorAll('.selectable_day_slot, .day_slot')].find((x) => x.offsetParent && x.getAttribute('data-day') === '21' && x.getAttribute('data-month') === '11') || [...document.querySelectorAll('.selectable_day_slot')].find((x) => /^21\b/.test(x.textContent.trim())); if (!d) return false; d.click(); return true; });
  log('day', await pickDay());
  await wait(3000);
  await cap.eval(() => window.scrollTo(0, 0));
  await cap.eval(() => { const c = document.querySelector('[id^="booking-package"]'); if (c) c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); });
  await dump(cap, 'front-day');
  await cap.capture('front-day', { settle: 800 });
  // the order of the steps depends on the plugin (services before or after the time): handle both
  async function pickService(name) {
    return cap.eval((n) => { const s = [...document.querySelectorAll('.selectable_service_slot')].find((x) => x.offsetParent && x.textContent.includes(n)); if (!s) return false; s.click(); return true; }, name);
  }
  async function pickTime(hhmm) {
    return cap.eval((t) => { const s = [...document.querySelectorAll('.selectable_time_slot')].find((x) => x.offsetParent && x.textContent.includes(t) && !x.classList.contains('closed')); if (!s) return false; s.click(); return true; }, hhmm);
  }
  let svc = await pickService('タイ古式マッサージ 90分');
  if (svc) { await wait(2500); await dump(cap, 'front-svc'); await cap.capture('front-svc', { settle: 800 }); await clickText(cap, 'button, .nextPageBookingDetails', '次へ|次のページ').catch(() => null); await wait(2500); }
  await cap.capture('front-times', { settle: 800 });
  log('time', await pickTime('13:00'));
  await wait(2500);
  if (!svc) { svc = await pickService('タイ古式マッサージ 90分'); await wait(2500); await cap.capture('front-svc', { settle: 800 }); await clickText(cap, 'button, .nextPageBookingDetails', '次へ|次のページ').catch(() => null); await wait(2500); }
  await dump(cap, 'front-form');
  const formSel = (id) => `#formMainPanel [id*="${id}"] input, #formMainPanel input[name="${id}"], #formMainPanel [data-key="${id}"] input`;
  const inputs = [];
  for (const k of ['first_name', 'last_name', 'email', 'phone', 'address']) if (await mark(cap, formSel(k), 'f-' + k)) inputs.push([`[data-cap="f-${k}"]`, 'f-' + k]);
  if (inputs.length < 5) {
    // by order: the visible text inputs of the form
    const n = await cap.eval(() => { const ins = [...document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea')].filter((e) => e.offsetParent); ['first_name', 'last_name', 'email', 'phone', 'address'].forEach((k, i) => ins[i] && ins[i].setAttribute('data-cap', 'f-' + k)); return ins.length; });
    log('form inputs by order', n);
    inputs.length = 0;
    for (const k of ['first_name', 'last_name', 'email', 'phone', 'address']) inputs.push([`[data-cap="f-${k}"]`, 'f-' + k]);
  }
  await cap.capture('front-form', { inputs, settle: 800 });
  await cap.eval((b) => { for (const [k, v] of Object.entries(b)) { const e = document.querySelector(`[data-cap="f-${k}"]`); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } } const t = [...document.querySelectorAll('#formMainPanel input[type="checkbox"]')]; t.forEach((c) => { if (!c.checked) c.click(); }); }, BOOKER);
  await cap.capture('front-form-filled', { settle: 600 });
  await clickText(cap, 'button, .nextPageBookingDetails', '^(次へ|次のページ|確認|入力内容を確認)');
  await wait(3000);
  await dump(cap, 'front-confirm');
  await cap.capture('front-confirm', { settle: 800 });
  await clickText(cap, 'button, .book_now_button, #confirmBookingButton', '予約する|予約を確定');
  await wait(5000);
  await dump(cap, 'front-done');
  log('after 予約する:', JSON.stringify(await cap.eval(() => { const p = document.querySelector('#booking-package') || document.querySelector('[id*="booking_package"]') || document.body; return (p.innerText || '').replace(/\s+/g, ' ').slice(0, 400); }).catch(() => '')));
  await cap.capture('front-done', { settle: 800 });
  cap.data.booking = await cap.php("global $wpdb; return $wpdb->get_row( \"SELECT * FROM {$wpdb->prefix}booking_package_booked_customers ORDER BY `key` DESC LIMIT 1\", ARRAY_A );").catch(() => null);
  log('booking', JSON.stringify(cap.data.booking || {}).slice(0, 500));

  // the same day again: 14:30 can be booked right after the 13:00–14:30 visit (no travel time) — the mistake
  await front(null);
  await pickDay(); await wait(3000);
  if (await pickService('もみほぐし 60分')) { await wait(2500); await clickText(cap, 'button, .nextPageBookingDetails', '次へ|次のページ').catch(() => null); await wait(2500); }
  await cap.eval(() => { const t = document.querySelector('.selectable_time_slot'); if (t) t.scrollIntoView({ block: 'center' }); });
  await cap.capture('front-times-after', { settle: 800 });

  // the fix: 準備時間 30分（前後）in the calendar's 設定 — through its screen, as admin
  await cap.login();
  await cap.view('max');
  await openCalendar(cap, 'settingLink');
  const prep = await cap.eval(() => {
    const th = [...document.querySelectorAll('#settingPanel th')].find((x) => /準備時間/.test(x.textContent));
    if (!th) return 'no row';
    th.scrollIntoView({ block: 'center' });
    const row = th.closest('tr');
    const sel = [...row.querySelectorAll('select')];
    const set = (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); };
    const s30 = sel.find((s) => [...s.options].some((o) => o.value === '30'));
    if (s30) set(s30, '30');
    return sel.map((s) => s.value + ':' + [...s.options].map((o) => o.value).slice(0, 6).join('/')).join(' | ');
  });
  log('prep', prep);
  await cap.capture('cal-prep-set', { settle: 600 });
  await clickText(cap, '#settingPanel button, button', '^保存$');
  await wait(3500);
  cap.data.prep = await cap.php("global $wpdb; return $wpdb->get_row( \"SELECT preparationTime, positionPreparationTime FROM {$wpdb->prefix}booking_package_calendar_accounts WHERE type = 'day' LIMIT 1\", ARRAY_A );");
  if (cap.data.prep && cap.data.prep.preparationTime === '0') {
    // the screen's 保存 did not store it (the select was set by script): the same column, as that save writes it
    log('prep: the 保存 of the screen did not store it — written in PHP');
    await cap.php("global $wpdb; $wpdb->update( $wpdb->prefix . 'booking_package_calendar_accounts', [ 'preparationTime' => 30, 'positionPreparationTime' => 'before_after' ], [ 'key' => 1 ] ); return true;");
  }
  log('prep saved', JSON.stringify(cap.data.prep));
  await cap.logout();
  await front(null);
  await pickDay(); await wait(3000);
  if (await pickService('もみほぐし 60分')) { await wait(2500); await clickText(cap, 'button, .nextPageBookingDetails', '次へ|次のページ').catch(() => null); await wait(2500); }
  await cap.eval(() => { const t = document.querySelector('.selectable_time_slot'); if (t) t.scrollIntoView({ block: 'center' }); });
  await cap.capture('front-times-fixed', { settle: 800 });
  // the smartphone
  // (an iPhone's user agent — wp_is_mobile() → <html class="mobile"> — at 390 px; no isMobile: it reloads the frame)
  await pg.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1');
  await front('front-cal-sp', { width: 390, height: 844 });
  await pg.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');

  /* ---------------------------------------------------------------- 9. the bookings in the admin */
  await cap.view('max');
  await cap.login();
  await cap.go('/wp-admin/admin.php?page=booking-package%2Findex.php', '#wpadminbar');
  await wait(4500);
  await dump(cap, 'customers');
  await cap.capture('customers', { settle: 1000 });
  await cap.eval(() => { const b = [...document.querySelectorAll('[data-day="21"], .day_slot')].find((x) => x.getAttribute('data-day') === '21' && x.getAttribute('data-month') === '11'); if (b) b.click(); });
  await wait(3000);
  await cap.capture('customers-day', { settle: 800 });
  await dump(cap, 'customers-day');
  await cap.eval(() => { const r = [...document.querySelectorAll('tr, .row, div')].filter((x) => x.offsetParent && /山本/.test(x.textContent) && x.children.length > 1).pop(); if (r) r.click(); });
  await wait(2500);
  await cap.capture('customers-detail', { settle: 800 });

  } catch (e) { log('VISITOR / ADMIN STEPS FAILED (the screens so far are kept):', e.message.slice(0, 300)); }
  fs.writeFileSync(path.join(SHOTS || DIR, 'capture-debug.json'), JSON.stringify(DEBUG, null, 1));
  await cap.finish();
  // the admin calendar draws the days before "today" shaded: the capture's today (its own date) → the video's (12)
  const file = path.join(DIR, 'js', 'wp-snapshot.js');
  let txt = fs.readFileSync(file, 'utf8');
  txt = fixToday(txt);
  fs.writeFileSync(file, txt);
  log('done');
})().catch((e) => { console.error(e); try { fs.writeFileSync(path.join(SHOTS || DIR, 'capture-debug.json'), JSON.stringify(DEBUG, null, 1)); } catch (er) {} process.exit(1); });

/** the days 12–17 of November were in the capture's past (shaded / not selectable): in the video they are today and later */
function fixToday(txt) {
  // the plugin's own m/d/Y dates of the capture day (一般設定's 日付フォーマット sample, a booking's 送信日時): the video's day
  txt = txt.split('11/18/2026').join('11/12/2026');
  txt = txt.split('神奈川県藤沢市鵠沼海岸 3-2-1 ホテルシーサイド鵠沼 506号室').join('神奈川県藤沢市鵠沼海岸 3-2-1-506');
  // the service form's 有効期限 (day selects default to the capture's day): the video's day
  // (only in a select where 18 is the selected day: 12 comes before it in the same list)
  txt = txt.replace(/(<option value=\\"12\\")(>12<\/option>(?:(?!<\/select>).)*?<option value=\\"18\\") selected=\\"\\"(>18<\/option>)/g, '$1 selected=\\"\\"$2$3');
  return txt.replace(/(class=\\"day_slot[^"\\]*?)\s*closeDay([^"\\]*?\\" [^>]*?data-day=\\"(1[2-8])\\" data-month=\\"11\\")/g, '$1$2');
}
if (process.argv.includes('--fix-today')) {
  const f = path.join(DIR, 'js', 'wp-snapshot.js');
  fs.writeFileSync(f, fixToday(fs.readFileSync(f, 'utf8')));
  log('fixed today in', path.relative(ROOT, f));
  process.exit(0);
}
