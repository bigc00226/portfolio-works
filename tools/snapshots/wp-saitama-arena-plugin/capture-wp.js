/*
 * The real WordPress screens of the wp-saitama-arena-plugin video, captured from WordPress itself
 * (tools/wp/playground.js: WordPress Playground — real WordPress + PHP in the browser, Japanese, no account).
 *
 *   node tools/snapshots/wp-saitama-arena-plugin/capture-wp.js [screenshot folder]
 *   → node tools/webp.js wp-saitama-arena-plugin
 *
 * The site is set up as the wp-saitama-arena-migration video found www.saitama-arena.co.jp (a WordPress multisite,
 * subdirectory type: / the arena — theme "saitamaarena", /schedule/ イベントスケジュール — theme "schedule", /news/
 * お知らせ — theme "news"; the themes are stand-ins with the real slugs; WP-PageNavi network-activated), here as the
 * developer's local copy (http://localhost:8888, as wp-env serves it).
 * The plugin is the video's own (public/videos/wp-saitama-arena-plugin/js/plugin-src.js — the same source VS Code
 * shows), installed and network-activated for real; every screen is its real output at that stage of the work:
 *   stage 0  as first written: 今すぐ同期 with the API URL missing /v1 → the API's 404 → count(null) → WordPress' own
 *            「重大なエラー」 screen
 *   stage 1  the API errors handled → the error notice and the log row; the URL fixed → 12 events imported
 *            (with the dates still converted in UTC: every event starts a day early)
 *   stage 2  the dates in the site's time zone → synced again (as `wp arena-events sync` does): 12 updated
 *   stage 3  PHPCS clean (no visible change)
 * The external 催事管理システム (https://saiji.sa.internal/api/v1) is invented: a capture-only must-use plugin answers
 * its requests (pre_http_request) with events.json — the twelve events of the live /schedule/ page (2026年11月のイベント:
 * titles, dates, fees, contacts, categories, venue types, links, images as published; the ids and field names invented).
 * Changed for the demo: the Playground address → http://localhost:8888, the capture date → 2026-11-13; the log entries'
 * and the imported posts' times are set to the video's clock; WP-Cron is off during the capture (DISABLE_WP_CRON) and the
 * daily event is scheduled for 2026-11-14 05:00, as the plugin schedules it on that day.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const WPC = require(path.join(ROOT, 'tools/wp/playground'));
const PLUGIN = require(path.join(ROOT, 'public/videos/wp-saitama-arena-plugin/js/plugin-src.js'));
const ID = 'wp-saitama-arena-plugin';
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const { log, wait } = WPC;
const USER = 'sa_webadmin';
const DEV = 'http://localhost:8888';
const EVENTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'events.json'), 'utf8')).events.map(({ live_id, ...e }) => e);
const API_BAD = 'https://saiji.sa.internal/api', API_OK = 'https://saiji.sa.internal/api/v1';
const API_KEY = 'sk_live_7f3Kq9vB2mXcT8wR4nLp';
const NOTIFY = 'web-team@saitama-arena.example';

// the mock of the 催事管理システム and the dev site's look (no must-use plugin tab: a plain dev copy has none)
const MOCK = `<?php
/* capture only: answers the requests to the (invented) 催事管理システム */
add_filter( 'pre_http_request', function ( $pre, $args, $url ) {
\t$p = wp_parse_url( $url );
\tif ( 'saiji.sa.internal' !== ( $p['host'] ?? '' ) ) return $pre;
\t$ok = '/api/v1/events' === ( $p['path'] ?? '' ) && 'Bearer ${API_KEY}' === ( $args['headers']['Authorization'] ?? '' );
\t$body = $ok ? file_get_contents( WP_CONTENT_DIR . '/demo-saiji-events.json' ) : wp_json_encode( array( 'error' => 'not_found', 'message' => 'Not Found: GET ' . ( $p['path'] ?? '' ) ) );
\treturn array( 'headers' => array( 'content-type' => 'application/json; charset=utf-8' ), 'body' => $body, 'response' => array( 'code' => $ok ? 200 : 404, 'message' => $ok ? 'OK' : 'Not Found' ), 'cookies' => array(), 'filename' => null );
}, 10, 3 );
add_filter( 'show_advanced_plugins', fn( $show, $type ) => 'mustuse' === $type || 'dropins' === $type ? false : $show, 10, 2 );
add_filter( 'pre_wp_mail', '__return_true' );
`;

const pluginFiles = (stage) => Object.fromEntries(Object.entries(PLUGIN.files(stage)).map(([p, t]) => [PLUGIN.DIR + p, t]));
const JST = (hms) => `strtotime( '2026-11-13 ${hms} Asia/Tokyo' )`;

/*
 * finish() turns the capturing machine's date into the video's (2026-11-13) everywhere — also inside event dates that
 * fall on that day (the flea market of 2026-11-18). The event dates are put back from events.json: the 開催日 cells of
 * the posts lists (by post id: as the plugin printed them at that stage — first in UTC, then in the site's time zone)
 * and the event dates in the data the video prints. Runs after the capture, or alone:
 *   node tools/snapshots/wp-saitama-arena-plugin/capture-wp.js --fix-dates
 */
function fixEventDates() {
  const file = path.join(ROOT, 'public/videos', ID, 'js/wp-snapshot.js');
  const src = fs.readFileSync(file, 'utf8');
  const head = src.slice(0, src.indexOf('window.WP_SNAPSHOT = '));
  const W = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
  const ev = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
  const local = (iso) => iso.slice(0, 10);
  const utc = (iso) => new Date(iso).toISOString().slice(0, 10);
  const byPost = Object.fromEntries((W.data.imported || []).map((p) => [p.id, ev[p.ext]]));
  const cell = (html, dates) => html.replace(/<tr id="post-(\d+)"[\s\S]*?<\/tr>/g, (row, id) => {
    const e = byPost[id];
    if (!e) return row;
    const [a, b] = dates(e);
    return row.replace(/(<td[^>]*column-event_date[^>]*>)[^<]*(<\/td>)/, (m, o, c) => `${o}${a.replace(/-/g, '/')} ～ ${b.replace(/-/g, '/')}${c}`);
  });
  if (W.pages['posts-tz']) W.pages['posts-tz'].html = cell(W.pages['posts-tz'].html, (e) => [utc(e.start_date), utc(e.end_date)]);
  if (W.pages['posts-ok']) W.pages['posts-ok'].html = cell(W.pages['posts-ok'].html, (e) => [local(e.start_date), local(e.end_date)]);
  const d = W.data;
  (d.imported || []).forEach((p) => { const e = ev[p.ext]; if (e) { p.start = utc(e.start_date); p.end = utc(e.end_date); } });
  (d.fixed || []).forEach((p) => { const e = byPost[p.id]; if (e) { p.start = local(e.start_date); p.end = local(e.end_date); } });
  for (const r of [d.cliSync, d.dryRun]) (r && r.changes || []).forEach((c) => { const e = ev[c.id]; if (e) c.start = local(e.start_date); });
  fs.writeFileSync(file, head + 'window.WP_SNAPSHOT = ' + JSON.stringify(W) + ';\n');
  log('event dates put back');
}

if (process.argv.includes('--fix-dates')) { fixEventDates(); process.exit(0); }

(async () => {
  const cap = await WPC.start({ id: ID, site: DEV, date: '2026-11-13', time: '10:40', shots: SHOTS, serverPath: '/var/www/html/wp-content/' });
  await cap.boot(WPC.blueprint({
    title: 'GMOアリーナさいたま',
    tagline: 'GMOアリーナさいたまのサイトです。',
    themes: ['twentytwentyfive'],
    plugins: [{ slug: 'wp-pagenavi', activate: false }],
    consts: { DISABLE_WP_CRON: true, WP_DEBUG: true, WP_DEBUG_LOG: true, WP_DEBUG_DISPLAY: false },
    steps: [{ step: 'enableMultisite' }],
  }));

  /* ---------------------------------------------------------------- the multisite, as in the migration video */
  const theme = (slug) => ({
    [`wp-content/themes/${slug}/style.css`]: `/*\nTheme Name: ${slug}\nAuthor: GMOアリーナさいたま\nVersion: 3.2.0\nText Domain: ${slug}\n*/\n`,
    [`wp-content/themes/${slug}/index.php`]: '<?php\nget_header();\nget_footer();\n',
  });
  await cap.files({
    ...theme('saitamaarena'), ...theme('schedule'), ...theme('news'),
    'wp-content/mu-plugins/zz-demo-saiji-mock.php': MOCK,
    'wp-content/demo-saiji-events.json': JSON.stringify({ count: EVENTS.length, events: EVENTS }),
  });
  const ids = await cap.php(`
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
    require_once ABSPATH . 'wp-admin/includes/user.php';
    activate_plugin( 'wp-pagenavi/wp-pagenavi.php', '', true );
    $net = get_network();
    update_network_option( null, 'site_name', 'GMOアリーナさいたま' );
    update_network_option( null, 'allowedthemes', [ 'saitamaarena' => true, 'schedule' => true, 'news' => true ] );
    $u = wp_create_user( '${USER}', 'password', 'webmaster@saitama-arena.example' );
    grant_super_admin( $u );
    wp_update_user( [ 'ID' => $u, 'role' => 'administrator' ] );
    $s = wpmu_create_blog( $net->domain, $net->path . 'schedule/', 'イベントスケジュール', $u );
    $n = wpmu_create_blog( $net->domain, $net->path . 'news/', 'お知らせ', $u );
    foreach ( [ 1 => 'saitamaarena', $s => 'schedule', $n => 'news' ] as $id => $t ) {
      switch_to_blog( $id );
      switch_theme( $t );
      add_user_to_blog( $id, $u, 'administrator' );
      update_option( 'timezone_string', 'Asia/Tokyo' );
      update_option( 'date_format', 'Y年n月j日' );
      update_option( 'time_format', 'H:i' );
      update_option( 'permalink_structure', '/%postname%/' );
      foreach ( get_posts( [ 'post_type' => [ 'post', 'page' ], 'post_status' => 'any', 'numberposts' => -1 ] ) as $p ) wp_delete_post( $p->ID, true );
      restore_current_blog();
    }
    // the schedule site's categories (the live list's) and venue types (会場タイプ)
    switch_to_blog( $s );
    foreach ( [ 'concert-show' => 'コンサート・ショー', 'sports' => 'スポーツ', 'ceremony' => '集会・式典・セミナー', 'exhibition' => '物販・展示会', 'other' => 'その他' ] as $slug => $name ) wp_insert_term( $name, 'category', [ 'slug' => $slug ] );
    register_taxonomy( 'venue', 'post', [ 'hierarchical' => true ] );
    foreach ( [ 'arena' => 'アリーナ', 'community-arena' => 'コミュニティアリーナ', 'keyakihiroba' => 'けやきひろば', 'other' => 'その他' ] as $slug => $name ) wp_insert_term( $name, 'venue', [ 'slug' => $slug ] );
    flush_rewrite_rules( false );
    restore_current_blog();
    global $wpdb;
    $wpdb->update( $wpdb->blogs, [ 'public' => 1 ], [ 'blog_id' => $s ] );
    $wpdb->update( $wpdb->blogs, [ 'public' => 1 ], [ 'blog_id' => $n ] );
    if ( file_exists( WP_PLUGIN_DIR . '/hello.php' ) ) unlink( WP_PLUGIN_DIR . '/hello.php' );
    if ( is_dir( WP_PLUGIN_DIR . '/akismet' ) ) { require_once ABSPATH . 'wp-admin/includes/file.php'; delete_plugins( [ 'akismet/akismet.php' ] ); }
    update_user_meta( $u, 'show_welcome_panel', 0 );
    return [ 'user' => $u, 'schedule' => $s, 'news' => $n ];`);
  log('sites', JSON.stringify(ids));
  cap.data.sites = ids;

  /* ---------------------------------------------------------------- the plugin (stage 0), checked, network-activated */
  await cap.files(pluginFiles(0));
  const lint = await cap.php(`$bad = []; foreach ( array_merge( glob( WP_PLUGIN_DIR . '/arena-events/*.php' ), glob( WP_PLUGIN_DIR . '/arena-events/includes/*.php' ) ) as $f ) { try { token_get_all( file_get_contents( $f ), TOKEN_PARSE ); } catch ( ParseError $e ) { $bad[] = basename( $f ) . ':' . $e->getLine() . ' ' . $e->getMessage(); } } return $bad;`);
  if (lint.length) throw new Error('PHP syntax: ' + lint.join(' | '));
  log('plugin syntax ok');
  const act = await cap.php("require_once ABSPATH . 'wp-admin/includes/plugin.php'; $r = activate_plugin( 'arena-events/arena-events.php', '', true ); return is_wp_error( $r ) ? $r->get_error_message() : 'ok';");
  log('activate', act);
  // the daily sync as the plugin schedules it on 2026-11-13 (tomorrow 05:00)
  await cap.php("switch_to_blog( 2 ); wp_clear_scheduled_hook( ARENA_EVENTS_CRON_HOOK ); wp_schedule_event( strtotime( '2026-11-14 05:00:00 Asia/Tokyo' ), 'daily', ARENA_EVENTS_CRON_HOOK ); restore_current_blog(); return true;");
  await cap.translations();
  await cap.logout();
  await cap.login(USER, 'password');

  /* ---------------------------------------------------------------- the network's plugins */
  await cap.go('/wp-admin/network/plugins.php', '.wp-list-table.plugins');
  await cap.capture('net-plugins');
  cap.info.plugins = await cap.php("$p = []; foreach ( get_plugins() as $f => $d ) $p[ dirname( $f ) ] = $d['Version']; return $p;");

  /* ---------------------------------------------------------------- the schedule site: イベント連携 */
  const S = '/schedule/wp-admin/';
  await cap.go(S + 'admin.php?page=arena-events', '#wpbody-content .wrap');
  await cap.capture('log-empty');
  await cap.go(S + 'admin.php?page=arena-events-settings', '#arena_events_api_url');
  await cap.capture('settings', { inputs: [['#arena_events_api_url', 'api_url'], ['#arena_events_api_key', 'api_key'], ['#arena_events_notify_email', 'notify']] });
  // saved as typed in the video: the URL without /v1
  await cap.type('#arena_events_api_url', API_BAD);
  await cap.type('#arena_events_api_key', API_KEY);
  await cap.type('#arena_events_notify_email', NOTIFY);
  await cap.click('#submit');
  await cap.settle('#setting-error-settings_updated, .notice-success');
  await cap.capture('settings-saved', { inputs: [['#arena_events_api_url', 'api_url2']] });
  log('saved', JSON.stringify(await cap.php("switch_to_blog( 2 ); $o = get_option( 'arena_events_settings' ); restore_current_blog(); return $o;")));

  // 今すぐ同期 (stage 0): the fatal error
  await cap.go(S + 'admin.php?page=arena-events', '.page-title-action');
  const syncHref = await cap.eval(() => document.querySelector('.page-title-action').getAttribute('href'));
  const syncRel = '/schedule/wp-admin/' + syncHref.replace(/^.*\/wp-admin\//, '').replace(/&amp;/g, '&');
  log('sync link', syncRel);
  await cap.go(syncRel, 'body');
  await wait(800);
  log('fatal page', await cap.eval(() => document.title + ' / ' + document.body.innerText.slice(0, 200)));
  await cap.capture('fatal');
  cap.data.fatal = await cap.php("$f = WP_CONTENT_DIR . '/debug.log'; return file_exists( $f ) ? substr( file_get_contents( $f ), -1500 ) : ( error_get_last()['message'] ?? '' );");

  // stage 1: the API errors handled → the error notice
  await cap.files(pluginFiles(1));
  await cap.go(syncRel, '#wpbody-content .wrap', { redirect: true });
  await cap.php(`switch_to_blog( 2 ); $l = get_option( 'arena_events_log' ); $l[0]['time'] = ${JST('10:46:12')}; update_option( 'arena_events_log', $l, false ); restore_current_blog(); return true;`);
  await cap.go(S + 'admin.php?page=arena-events&arena_events_result=error', '#wpbody-content .wrap');
  await cap.capture('log-error');
  log('error notice', await cap.eval(() => [...document.querySelectorAll('.notice')].map((n) => n.innerText.trim()).join(' | ')));

  // the URL fixed
  await cap.go(S + 'admin.php?page=arena-events-settings', '#arena_events_api_url');
  await cap.capture('settings2', { inputs: [['#arena_events_api_url', 'api_url3']] });
  await cap.type('#arena_events_api_url', API_OK);
  await cap.click('#submit');
  await cap.settle('#setting-error-settings_updated, .notice-success');
  await cap.capture('settings-saved2');

  // 今すぐ同期: 12 imported (dates still in UTC)
  await cap.go(syncRel, '#wpbody-content .wrap', { redirect: true });
  const fixTimes = async (stamps) => cap.php(`switch_to_blog( 2 ); $l = get_option( 'arena_events_log' ); foreach ( $data as $i => $t ) { if ( isset( $l[ $i ] ) ) $l[ $i ]['time'] = strtotime( '2026-11-13 ' . $t . ' Asia/Tokyo' ); } update_option( 'arena_events_log', $l, false ); restore_current_blog(); return count( $l );`, stamps);
  await fixTimes(['10:48:37', '10:46:12']);
  // the posts: imported at 10:48:37 (one second apart, in the API's order), the daily sync scheduled for 2026-11-14 05:00
  cap.data.imported = await cap.php(`switch_to_blog( 2 );
    global $wpdb;
    $ids = get_posts( [ 'post_type' => 'post', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC', 'fields' => 'ids' ] );
    $out = [];
    foreach ( $ids as $i => $id ) {
      $t = ${JST('10:48:37')} + $i;
      $wpdb->update( $wpdb->posts, [ 'post_date' => wp_date( 'Y-m-d H:i:s', $t ), 'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $t ), 'post_modified' => wp_date( 'Y-m-d H:i:s', $t ), 'post_modified_gmt' => gmdate( 'Y-m-d H:i:s', $t ) ], [ 'ID' => $id ] );
      clean_post_cache( $id );
      $out[] = [ 'id' => $id, 'title' => get_post_field( 'post_title', $id ), 'slug' => get_post_field( 'post_name', $id ), 'start' => get_post_meta( $id, 'event_start', true ), 'end' => get_post_meta( $id, 'event_end', true ), 'ext' => get_post_meta( $id, 'arena_event_id', true ) ];
    }
    wp_clear_scheduled_hook( ARENA_EVENTS_CRON_HOOK );
    wp_schedule_event( ${'strtotime'}( '2026-11-14 05:00:00 Asia/Tokyo' ), 'daily', ARENA_EVENTS_CRON_HOOK );
    restore_current_blog();
    return $out;`);
  log('imported', cap.data.imported.length, JSON.stringify(cap.data.imported.slice(0, 3)));
  await cap.go(S + 'admin.php?page=arena-events&arena_events_result=success', '#wpbody-content .wrap');
  await cap.capture('log-ok');
  log('ok notice', await cap.eval(() => [...document.querySelectorAll('.notice')].map((n) => n.innerText.trim()).join(' | ')));
  await cap.go(S + 'edit.php', '.wp-list-table');
  await cap.capture('posts-tz');
  cap.data.dailyBug = await cap.php("return arena_events_get_by_date( '2026-11-13' );");

  // stage 2: the dates in the site's time zone → synced again (WP-CLI)
  await cap.files(pluginFiles(2));
  cap.data.dryRun = await cap.php("switch_to_blog( 2 ); $r = ( new Arena_Events_Importer() )->sync( 'cli', true ); restore_current_blog(); return $r;");
  cap.data.cliSync = await cap.php("switch_to_blog( 2 ); $r = ( new Arena_Events_Importer() )->sync( 'cli' ); restore_current_blog(); return $r;");
  log('cli sync', JSON.stringify(cap.data.cliSync).slice(0, 300));
  await fixTimes(['10:56:04', '10:48:37', '10:46:12']);
  cap.data.fixed = await cap.php(`switch_to_blog( 2 );
    $out = [];
    foreach ( get_posts( [ 'post_type' => 'post', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC' ] ) as $p ) $out[] = [ 'id' => $p->ID, 'title' => $p->post_title, 'start' => get_post_meta( $p->ID, 'event_start', true ), 'end' => get_post_meta( $p->ID, 'event_end', true ), 'url' => get_permalink( $p ) ];
    restore_current_blog();
    return $out;`);
  cap.data.daily13 = await cap.php("return arena_events_get_by_date( '2026-11-13' );");
  cap.data.daily14 = await cap.php("return arena_events_get_by_date( '2026-11-14' );");
  cap.data.cron = await cap.php("switch_to_blog( 2 ); $n = wp_next_scheduled( ARENA_EVENTS_CRON_HOOK ); restore_current_blog(); return wp_date( 'Y-m-d H:i:s', $n );");
  await cap.go(S + 'edit.php', '.wp-list-table');
  await cap.capture('posts-ok');
  await cap.go(S + 'admin.php?page=arena-events', '#wpbody-content .wrap');
  await cap.capture('log-cli');
  // the daily sync run once by hand (as `wp cron event run arena_events_daily_sync` does): nothing changed
  cap.data.cronRun = await cap.php("switch_to_blog( 2 ); arena_events_run_scheduled_sync(); $l = get_option( 'arena_events_log' ); restore_current_blog(); return $l[0];");
  await fixTimes(['10:58:41', '10:56:04', '10:48:37', '10:46:12']);
  await cap.go(S + 'admin.php?page=arena-events', '#wpbody-content .wrap');
  await cap.capture('log-cron');

  // stage 3 (PHPCS): the same output; the final files are installed
  await cap.files(pluginFiles(3));
  await cap.go(S + 'admin.php?page=arena-events&arena_events_result=success', '#wpbody-content .wrap');
  log('final notice', await cap.eval(() => [...document.querySelectorAll('.notice')].map((n) => n.innerText.trim()).join(' | ')));

  await cap.finish();
  fixEventDates();
})().catch((e) => { console.error(e); process.exit(1); });
