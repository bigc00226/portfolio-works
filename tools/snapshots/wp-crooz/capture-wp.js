/*
 * The real WordPress screens of the wp-crooz video, captured from WordPress itself (tools/wp/playground.js:
 * WordPress Playground — real WordPress + PHP in the browser, Japanese, no account).
 *
 *   node tools/snapshots/wp-crooz/capture-wp.js [screenshot folder]   → node tools/webp.js wp-crooz
 *
 * The site is set up like the video's wp-env (http://localhost:8888): site title クルーズ株式会社, the theme "crooz"
 * written from the files the video shows (public/videos/wp-crooz/js/files.js; screenshot.png = the live site's first
 * view), the pages of the live site's navigation, Contact Form 7 from wordpress.org (with its Japanese language pack).
 * Every step that changes the site on screen is done for real in WordPress before its screen is captured: the theme
 * is activated through its button, the menu saved through the form, the 会社概要 page published through the block
 * editor (its slug becomes the URL-encoded title, as WordPress does), the slug fixed through クイック編集, Contact
 * Form 7 searched / installed / activated through プラグインを追加, the form saved (WordPress' config validator reports
 * the reserved name "name"), fixed and saved again.
 * Changed for the demo (tools/wp/playground.js): the Playground address → http://localhost:8888, the capture date →
 * 2026-10-28 (the video's clock), the text boxes the video types into → look-alike boxes.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const WPC = require(path.join(ROOT, 'tools/wp/playground'));
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sharp = require(path.join(ROOT, 'node_modules/sharp'));
const ID = 'wp-crooz';
const DIR = path.join(ROOT, 'public/videos', ID);
const SHOTS = process.argv[2] || null;
const { log, wait } = WPC;

// the video's own data: files.js needs the snapshot (business texts)
const W = {};
new Function('window', fs.readFileSync(path.join(DIR, 'js/site-snapshot.js'), 'utf8'))(W);
new Function('window', fs.readFileSync(path.join(DIR, 'js/files.js'), 'utf8'))(W);
const FL = W.FILES;

/** the theme's screenshot.png: the live site's first view at 1200×900 */
async function themeScreenshot() {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--lang=ja-JP', '--hide-scrollbars'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 900 });
  await p.setExtraHTTPHeaders({ 'accept-language': 'ja' });
  await p.goto('https://crooz.co.jp/', { waitUntil: 'networkidle2', timeout: 90000 });
  await wait(4000);
  const png = await p.screenshot({ type: 'png' });
  await b.close();
  return sharp(png).png({ palette: true, quality: 90, effort: 10 }).toBuffer();
}

(async () => {
  const png = await themeScreenshot();
  log('theme screenshot', (png.length / 1024).toFixed(0), 'KB');

  const cap = await WPC.start({ id: ID, site: 'http://localhost:8888', date: '2026-10-28', time: '10:41', shots: SHOTS, serverPath: '/var/www/html/wp-content/' });
  await cap.boot(WPC.blueprint({ title: 'クルーズ株式会社', tagline: '公式企業サイト', themes: ['twentytwentyfive'] }));

  // the theme "crooz" (as in the video), its screenshot
  const theme = Object.fromEntries(Object.entries(FL.files).filter(([k]) => k.startsWith(FL.T)));
  await cap.files(theme);
  await cap.php("file_put_contents( WP_CONTENT_DIR . '/themes/crooz/screenshot.png', base64_decode( $data ) ); return true;", png.toString('base64'));

  // the pages of the live site's navigation (made before the session); the default sample content removed
  const ids = await cap.php(`
    wp_delete_post( 1, true ); wp_delete_post( 2, true );
    $mk = function ( $title, $slug, $parent = 0, $order = 0 ) { return wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug, 'post_parent' => $parent, 'menu_order' => $order, 'post_date' => '2026-10-27 18:20:00' ] ); };
    $r = [];
    $r['news'] = $mk( 'ニュース', 'news', 0, 1 );
    $r['about'] = $mk( '企業情報', 'about', 0, 2 );
    $r['business'] = $mk( '事業・グループ会社紹介', 'business', 0, 3 );
    $r['ir'] = $mk( 'IR・投資家情報', 'ir', 0, 4 );
    $r['recruit'] = $mk( '採用情報', 'recruit', 0, 5 );
    $r['contact'] = $mk( 'お問い合わせ', 'contact', 0, 6 );
    $pp = get_option( 'wp_page_for_privacy_policy' ); if ( $pp ) { wp_update_post( [ 'ID' => $pp, 'post_status' => 'publish', 'post_name' => 'privacy', 'menu_order' => 7 ] ); $r['privacy'] = (int) $pp; }
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core' => [ 'welcomeGuide' => false, 'isComplementaryAreaVisible' => true, 'enableChoosePatternModal' => false ], 'core/edit-post' => [ 'welcomeGuide' => false ], '_modified' => gmdate( 'c' ) ] );
    update_user_meta( 1, 'show_welcome_panel', 0 );
    return $r;`);
  log('pages', JSON.stringify(ids));
  cap.data.pages = ids;

  /* ---------------------------------------------------------------- 1. login, dashboard, themes */
  await cap.logout();
  await cap.capture('login', { inputs: [['#user_login', 'user'], ['#user_pass', 'pass']] });
  await cap.login();
  await cap.go('/wp-admin/', '#wpadminbar');
  await cap.capture('dashboard');
  await cap.go('/wp-admin/themes.php', '.theme-browser .theme');
  await cap.capture('themes');
  const act = await cap.eval(() => document.querySelector('.theme[data-slug="crooz"] a.activate').getAttribute('href'));
  await cap.go('/wp-admin/' + act.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), '#wpadminbar').catch(() => null);
  await cap.go('/wp-admin/themes.php?activated=true', '.theme-browser .theme');
  await cap.capture('themes-active');

  /* ---------------------------------------------------------------- 2. the global menu */
  const menu = await cap.php(`
    $id = wp_create_nav_menu( 'グローバルナビ' );
    foreach ( [ 'news', 'about', 'business', 'ir', 'recruit' ] as $i => $k ) wp_update_nav_menu_item( $id, 0, [ 'menu-item-object-id' => $data[ $k ], 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish', 'menu-item-position' => $i + 1 ] );
    return $id;`, ids);
  cap.data.menu = menu;
  await cap.go(`/wp-admin/nav-menus.php?action=edit&menu=${menu}`, '#menu-to-edit');
  await cap.capture('menus');
  await cap.eval(() => { const c = document.querySelector('#locations-global'); if (c && !c.checked) c.click(); });
  await cap.eval(() => { setTimeout(() => document.querySelector('#save_menu_footer, #save_menu_header').click(), 0); });
  await wait(1500);
  await cap.settle('#menu-to-edit');
  await cap.capture('menus-saved');

  /* ---------------------------------------------------------------- 3. 会社概要: the block editor, publish (slug = the encoded title) */
  await cap.go('/wp-admin/post-new.php?post_type=page', 'iframe[name="editor-canvas"]');
  await wait(4000);
  await cap.capture('page-new', { settle: 1500 });
  await cap.eval((about) => {
    wp.data.dispatch('core/editor').editPost({ title: '会社概要', parent: about });
  }, ids.about);
  await wait(2500);
  await cap.capture('page-titled', { settle: 1200 });
  // 公開… → the pre-publish panel → 公開
  await cap.eval(() => document.querySelector('.editor-post-publish-panel__toggle').click());
  await wait(2500);
  await cap.capture('page-prepublish', { settle: 1000 });
  await cap.eval(() => document.querySelector('.editor-post-publish-panel .editor-post-publish-button').click());
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.post-publish-panel__postpublish'))) break; }
  await wait(2000);
  const overviewId = await cap.eval(() => wp.data.select('core/editor').getCurrentPostId());
  const slug = await cap.php('return get_post_field( "post_name", (int) $data );', overviewId);
  log('会社概要', overviewId, 'slug', slug);
  cap.data.overview = { id: overviewId, slug };
  await cap.capture('page-published', { settle: 1000 });

  // 固定ページ一覧 → クイック編集: slug overview
  await cap.go('/wp-admin/edit.php?post_type=page', '.wp-list-table');
  await cap.capture('pages');
  await cap.eval((id) => document.querySelector(`#post-${id} button.editinline`).click(), overviewId);
  await wait(1200);
  await cap.capture('pages-quickedit', { inputs: [['.inline-edit-row input[name="post_name"]', 'slug']], settle: 800 });
  await cap.type('.inline-edit-row input[name="post_name"]', 'overview');
  await cap.eval(() => document.querySelector('.inline-edit-row .save').click());
  for (let i = 0; i < 40; i++) { await wait(500); if (await cap.eval((id) => !document.querySelector('.inline-edit-row:not([style*="none"]) input[name="post_name"]') && !!document.querySelector(`#post-${id}`), overviewId)) break; }
  await wait(1500);
  await cap.capture('pages-fixed');
  log('slug now', await cap.php('return get_post_field( "post_name", (int) $data );', overviewId));

  /* ---------------------------------------------------------------- 5. Contact Form 7: search, install, activate */
  await cap.go('/wp-admin/plugin-install.php?s=Contact+Form+7&tab=search&type=term', '.plugin-card');
  await wait(2500);
  await cap.capture('plugin-search', { settle: 1200 });
  await cap.eval(() => document.querySelector('.plugin-card-contact-form-7 .install-now').click());
  for (let i = 0; i < 120; i++) { await wait(1000); if (await cap.eval(() => !!document.querySelector('.plugin-card-contact-form-7 .activate-now'))) break; }
  await wait(1500);
  await cap.capture('plugin-installed', { settle: 800 });
  await cap.translations();
  const actUrl = await cap.eval(() => document.querySelector('.plugin-card-contact-form-7 .activate-now').getAttribute('href'));
  await cap.go('/wp-admin/' + actUrl.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), '#wpadminbar').catch(() => null);
  await cap.go('/wp-admin/plugins.php?activate=true', '.wp-list-table.plugins');
  await cap.capture('plugins');
  cap.info.plugins = (await cap.php("$p = []; foreach ( get_plugins() as $f => $d ) if ( is_plugin_active( $f ) ) $p[ dirname( $f ) ] = $d['Version']; return $p;"));

  // the form: new → saved with [text* name] (the config validator) → mail tab → fixed and saved
  await cap.go('/wp-admin/admin.php?page=wpcf7-new', '#wpcf7-form');
  await wait(1200);
  await cap.capture('cf7-new', { inputs: [['#title', 'title'], ['#wpcf7-form', 'form']] });
  await cap.eval((form) => {
    document.querySelector('#title').value = 'お問い合わせ（IR）';
    document.querySelector('#wpcf7-form').value = form;
    setTimeout(() => document.querySelector('#wpcf7-admin-form-element [name="wpcf7-save"]').click(), 0);
  }, FL.CF7_FORM(true));
  await wait(2000);
  await cap.settle('#wpcf7-form');
  const formId = await cap.eval(() => +new URLSearchParams(location.search).get('post'));
  cap.data.form = formId;
  log('cf7 form', formId);
  await cap.capture('cf7-error', { inputs: [['#wpcf7-form', 'form']], settle: 1000 });
  await cap.eval(() => { const t = document.querySelector('#mail-panel-tab a, a[href="#mail-panel"]'); t && t.click(); });
  await wait(1000);
  await cap.capture('cf7-mail', { inputs: [['#wpcf7-mail-subject', 'subject'], ['#wpcf7-mail-body', 'body']], settle: 800 });
  await cap.eval((o) => {
    document.querySelector('#wpcf7-form').value = o.form;
    document.querySelector('#wpcf7-mail-subject').value = o.subject;
    document.querySelector('#wpcf7-mail-body').value = o.body;
    setTimeout(() => document.querySelector('#wpcf7-admin-form-element [name="wpcf7-save"]').click(), 0);
  }, { form: FL.CF7_FORM(false), ...FL.CF7_MAIL });
  await wait(2000);
  await cap.settle('#wpcf7-form');
  await cap.capture('cf7-saved', { settle: 1000 });
  await cap.eval(() => { const t = document.querySelector('#mail-panel-tab a, a[href="#mail-panel"]'); t && t.click(); });
  await wait(800);
  await cap.capture('cf7-saved-mail', { settle: 600 });
  await cap.go('/wp-admin/admin.php?page=wpcf7', '.wp-list-table');
  await cap.capture('cf7-list');
  const shortcode = await cap.eval(() => { const i = document.querySelector('.wp-list-table input.code, .wp-list-table .shortcode input'); return i ? i.value : null; });
  cap.data.shortcode = shortcode;
  log('shortcode', shortcode);

  // the contact page: the shortcode block, 更新
  await cap.go(`/wp-admin/post.php?post=${ids.contact}&action=edit`, 'iframe[name="editor-canvas"]');
  await wait(4000);
  await cap.capture('contact-editor', { settle: 1200 });
  await cap.eval((sc) => {
    const b = wp.blocks.createBlock('core/shortcode', { text: sc });
    wp.data.dispatch('core/block-editor').insertBlocks(b);
  }, shortcode);
  await wait(2500);
  await cap.capture('contact-shortcode', { settle: 1200 });
  await cap.eval(() => document.querySelector('.editor-post-publish-button, .editor-post-save-draft, .editor-header__settings .is-primary').click());
  for (let i = 0; i < 40; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.components-snackbar'))) break; }
  await wait(800);
  await cap.capture('contact-updated', { settle: 400 });

  const out = await cap.finish();
  // e-mail addresses with the Playground's host (CF7's default sender) → wp-env's host
  const file = path.join(DIR, 'js', 'wp-snapshot.js');
  const host = new URL(out.info && cap.origin ? cap.origin : 'https://wpsandbox.wordpress.net').host;
  let txt = fs.readFileSync(file, 'utf8');
  const n = txt.split('@' + host).length - 1;
  txt = txt.split('@' + host).join('@localhost').split(host).join('localhost:8888');
  fs.writeFileSync(file, txt);
  log(`replaced ${n} e-mail address(es) with the Playground host`);
})().catch((e) => { console.error(e); process.exit(1); });
