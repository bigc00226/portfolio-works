/*
 * The real WordPress screens of the wp-saitama-arena-migration video, captured from WordPress itself
 * (tools/wp/playground.js: WordPress Playground — real WordPress + PHP in the browser, Japanese, no account).
 *
 *   node tools/snapshots/wp-saitama-arena-migration/capture-wp.js [screenshot folder]
 *   → node tools/webp.js wp-saitama-arena-migration
 *
 * The site is set up like the live www.saitama-arena.co.jp: a WordPress multisite (subdirectory type, made with the
 * Playground's own enableMultisite step) with the three sites the live site has — / (the arena; theme slug
 * "saitamaarena"), /schedule/ (イベントスケジュール; theme "schedule"), /news/ (お知らせ; theme "news") — the
 * site title and tagline of the live site, WP-PageNavi (used by the live site) network-activated.
 * The themes are stand-ins with the real slugs (their files are not public; no theme screen is shown).
 * Every step shown is done for real before its screen is captured: All-in-One WP Migration (from wordpress.org) is
 * network-activated through its link on the network's プラグイン screen — the free plugin then shows its real notice
 * that a multisite needs the paid Multisite Extension (it has no export screen on a network); the maintenance screen
 * is WordPress' own (wp-content/../.maintenance, as `wp maintenance-mode activate` writes it).
 * Changed for the demo (tools/wp/playground.js): the Playground address → https://www.saitama-arena.co.jp, the capture
 * date → 2026-11-10 (the time of day → the video's clock), the login boxes → look-alike boxes.
 * Invented: the administrator's user name, the dates the sites were registered / last updated.
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const WPC = require(path.join(ROOT, 'tools/wp/playground'));
const ID = 'wp-saitama-arena-migration';
const SHOTS = process.argv[2] || null;
const { log, wait } = WPC;
const USER = 'sa_webadmin';

(async () => {
  const cap = await WPC.start({ id: ID, site: 'https://www.saitama-arena.co.jp', date: '2026-11-10', time: '22:12', shots: SHOTS, serverPath: '/var/www/html/wp-content/' });
  await cap.boot(WPC.blueprint({
    title: 'GMOアリーナさいたま',
    tagline: 'GMOアリーナさいたまのサイトです。',
    themes: ['twentytwentyfive'],
    plugins: [{ slug: 'all-in-one-wp-migration', activate: false }, { slug: 'wp-pagenavi', activate: false }],
    steps: [{ step: 'enableMultisite' }],
  }));

  // the three themes (stand-ins with the live slugs), the sites, WP-PageNavi for the network, the administrator
  const theme = (slug, name) => ({
    [`wp-content/themes/${slug}/style.css`]: `/*\nTheme Name: ${name}\nAuthor: GMOアリーナさいたま\nVersion: 3.2.0\nText Domain: ${slug}\n*/\n`,
    [`wp-content/themes/${slug}/index.php`]: '<?php\nget_header();\nget_footer();\n',
  });
  await cap.files({ ...theme('saitamaarena', 'saitamaarena'), ...theme('schedule', 'schedule'), ...theme('news', 'news') });
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
      restore_current_blog();
    }
    // when the sites were made / last updated (invented: the schedule and news sites from 2020, as their uploads)
    global $wpdb;
    $wpdb->update( $wpdb->blogs, [ 'registered' => '2016-03-01 10:00:00', 'last_updated' => '2026-11-09 18:42:10' ], [ 'blog_id' => 1 ] );
    $wpdb->update( $wpdb->blogs, [ 'registered' => '2020-11-24 14:05:31', 'last_updated' => '2026-11-09 17:20:44' ], [ 'blog_id' => $s ] );
    $wpdb->update( $wpdb->blogs, [ 'registered' => '2020-11-24 14:08:12', 'last_updated' => '2026-10-28 15:31:02' ], [ 'blog_id' => $n ] );
    // the event schedule and the news are public sites, as on the live site; WordPress' sample plugin is not on a production server
    $wpdb->update( $wpdb->blogs, [ 'public' => 1 ], [ 'blog_id' => $s ] );
    $wpdb->update( $wpdb->blogs, [ 'public' => 1 ], [ 'blog_id' => $n ] );
    if ( file_exists( WP_PLUGIN_DIR . '/hello.php' ) ) unlink( WP_PLUGIN_DIR . '/hello.php' );
    update_user_meta( $u, 'show_welcome_panel', 0 );
    return [ 'user' => $u, 'schedule' => $s, 'news' => $n ];`);
  log('sites', JSON.stringify(ids));
  cap.data.sites = ids;
  await cap.translations();

  /* ---------------------------------------------------------------- the login, the network admin */
  await cap.logout();
  await cap.capture('login', { inputs: [['#user_login', 'user'], ['#user_pass', 'pass']] });
  await cap.login(USER, 'password');
  await cap.go('/wp-admin/network/', '#wpadminbar');
  await cap.capture('net-dashboard');
  await cap.go('/wp-admin/network/sites.php', '.wp-list-table');
  await cap.capture('net-sites');
  await cap.go('/wp-admin/network/site-info.php?id=1', '#wpbody-content');
  await cap.capture('site-info');

  /* ---------------------------------------------------------------- All-in-One WP Migration on the network */
  await cap.go('/wp-admin/network/plugins.php', '.wp-list-table.plugins');
  await cap.capture('net-plugins');
  const act = await cap.eval(() => { const a = document.querySelector('tr[data-slug="all-in-one-wp-migration"] .activate a'); return a && a.getAttribute('href'); });
  log('activate link', act);
  await cap.go('/wp-admin/network/' + act.replace(/^.*wp-admin\/network\//, '').replace(/&amp;/g, '&'), '#wpadminbar', { redirect: true }).catch((e) => log('activate nav', e.message.slice(0, 120)));
  await cap.go('/wp-admin/network/plugins.php?activate=true', '.wp-list-table.plugins');
  await wait(1500);
  await cap.capture('net-plugins-ai1wm');
  log('ai1wm notice', await cap.eval(() => [...document.querySelectorAll('.notice, .error, .updated, .ai1wm-message')].map((n) => n.innerText.trim()).join(' | ')));
  // サイトネットワークで無効化 (back as it was: the new server gets the database without it)
  const off = await cap.eval(() => { const a = document.querySelector('tr[data-slug="all-in-one-wp-migration"] .deactivate a'); return a && a.getAttribute('href'); });
  await cap.go('/wp-admin/network/' + off.replace(/^.*wp-admin\/network\//, '').replace(/&amp;/g, '&'), '#wpadminbar', { redirect: true }).catch((e) => log('deactivate nav', e.message.slice(0, 120)));
  await cap.go('/wp-admin/network/plugins.php?deactivate=true', '.wp-list-table.plugins');
  await wait(1000);
  await cap.capture('net-plugins-off');
  cap.info.plugins = await cap.php("$p = []; foreach ( get_plugins() as $f => $d ) $p[ dirname( $f ) ] = $d['Version']; return $p;");

  /* ---------------------------------------------------------------- WordPress' maintenance screen */
  await cap.php("file_put_contents( ABSPATH . '.maintenance', '<?php $upgrading = ' . time() . '; ?>' ); return true;");
  await cap.go('/', 'body');
  await wait(1000);
  await cap.capture('maintenance');
  log('maintenance', await cap.eval(() => document.title + ' / ' + document.body.innerText.slice(0, 200)));
  await cap.php("@unlink( ABSPATH . '.maintenance' ); return true;").catch(() => null);

  await cap.finish();
})().catch((e) => { console.error(e); process.exit(1); });
