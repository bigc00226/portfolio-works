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
 * 2026-11-07 (the video's clock), the text boxes the video types into → look-alike boxes.
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

/**
 * the capture's own clock where tools/wp/playground.js does not turn it into the video's (it rewrites dates written as
 * text, 「2026年11月18日 1:23 AM」 → 「2026年11月7日 10:41 AM」):
 *   - the block editor works out times in the browser: the post-publish panel's 「今日 1:23 AM」 → 10:41 (as the
 *     固定ページ list shows for the same page); the contact page's 「最終編集21日前。」 (modified 2026-10-27 18:20) → as
 *     seen at about 10:45 on 2026-11-07
 *   - クイック編集's date fields (numbers in the list's hidden inline data and in the inputs / the month select) of the
 *     page published during the capture → 2026-11-07 10:41
 * Also run on its own: node capture-wp.js --fix-clock
 */
function fixClock(txt) {
  const head = 'window.WP_SNAPSHOT = ';
  const at = txt.indexOf(head);
  const snap = JSON.parse(txt.slice(at + head.length).replace(/;\s*$/, ''));
  const fixHtml = (h) => {
    h = h.replace(/今日 \d{1,2}:\d{2} [AP]M/g, '今日 10:41 AM').replace(/最終編集\d+日前。/g, '最終編集16時間前。');
    const old = [];
    h = h.replace(/<div class="jj">(\d+)<\/div>(\s*)<div class="mm">(\d+)<\/div>(\s*)<div class="aa">(\d+)<\/div>(\s*)<div class="hh">(\d+)<\/div>(\s*)<div class="mn">(\d+)<\/div>(\s*)<div class="ss">(\d+)<\/div>/g,
      (m, jj, s1, mm, s2, aa, s3, hh, s4, mn, s5, ss) => {
        if (`${aa}-${mm}-${jj}` <= '2026-11-07') return m;   // the pages made for the site (2026-10-27 18:20)
        old.push({ jj, mm, hh, mn, ss });
        return `<div class="jj">28</div>${s1}<div class="mm">10</div>${s2}<div class="aa">2026</div>${s3}<div class="hh">10</div>${s4}<div class="mn">41</div>${s5}<div class="ss">00</div>`;
      });
    for (const o of old) {
      h = h.split(`name="jj" value="${o.jj}"`).join('name="jj" value="28"').split(`name="hh" value="${o.hh}"`).join('name="hh" value="10"')
        .split(`name="mn" value="${o.mn}"`).join('name="mn" value="41"').split(`name="ss" value="${o.ss}"`).join('name="ss" value="00"');
      if (o.mm !== '10') h = h.replace(new RegExp(`(<option value="${o.mm}" data-text="[^"]*") selected=""`, 'g'), '$1').replace(/(<option value="10" data-text="10月")>/g, '$1 selected="">');
    }
    return h;
  };
  const fixPage = (p) => ({ ...p, html: fixHtml(p.html), frames: Object.fromEntries(Object.entries(p.frames || {}).map(([k, f]) => [k, fixPage(f)])) });
  for (const k of Object.keys(snap.pages)) snap.pages[k] = fixPage(snap.pages[k]);
  return txt.slice(0, at) + head + JSON.stringify(snap) + ';\n';
}
if (process.argv[2] === '--fix-clock') {
  const f = path.join(DIR, 'js', 'wp-snapshot.js');
  fs.writeFileSync(f, fixClock(fs.readFileSync(f, 'utf8')));
  log('fixed the editor clock texts in', path.relative(ROOT, f));
  process.exit(0);
}

(async () => {
  const png = await themeScreenshot();
  log('theme screenshot', (png.length / 1024).toFixed(0), 'KB');

  const cap = await WPC.start({ id: ID, site: 'http://localhost:8888', date: '2026-11-07', time: '10:41', shots: SHOTS, serverPath: '/var/www/html/wp-content/' });
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
    $pp = get_option( 'wp_page_for_privacy_policy' ); if ( $pp ) { wp_update_post( [ 'ID' => $pp, 'post_title' => 'プライバシーポリシー', 'post_status' => 'publish', 'post_name' => 'privacy', 'menu_order' => 7, 'post_date' => '2026-10-27 18:20:00' ] ); $r['privacy'] = (int) $pp; }
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core' => [ 'welcomeGuide' => false, 'isComplementaryAreaVisible' => true, 'enableChoosePatternModal' => false ], 'core/edit-post' => [ 'welcomeGuide' => false ], '_modified' => gmdate( 'c' ) ] );
    update_user_meta( 1, 'show_welcome_panel', 0 );
    // 「WordPress イベントとニュース」 collapsed (its events are picked by the capturing machine's location)
    update_user_meta( 1, 'closedpostboxes_dashboard', [ 'dashboard_primary' ] );
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
  await cap.eval(() => document.querySelector('#mail-panel-tab').click());
  await wait(1000);
  await cap.capture('cf7-mail', { inputs: [['#wpcf7-mail-subject', 'subject'], ['#wpcf7-mail-additional-headers', 'headers'], ['#wpcf7-mail-body', 'body']], settle: 800 });
  await cap.eval((o) => {
    document.querySelector('#wpcf7-form').value = o.form;
    document.querySelector('#wpcf7-mail-subject').value = o.subject;
    document.querySelector('#wpcf7-mail-body').value = o.body;
    document.querySelector('#wpcf7-mail-additional-headers').value = o.headers;
    setTimeout(() => document.querySelector('#wpcf7-admin-form-element [name="wpcf7-save"]').click(), 0);
  }, { form: FL.CF7_FORM(false), ...FL.CF7_MAIL });
  await wait(2000);
  await cap.settle('#wpcf7-form');
  await cap.capture('cf7-saved', { settle: 1000 });
  // ショートコードの表示を切替 → the shortcode to copy
  await cap.eval(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /ショートコードの表示/.test(x.textContent)); if (b) b.click(); });
  await wait(800);
  await cap.capture('cf7-saved-sc', { settle: 600 });
  await cap.eval(() => document.querySelector('#mail-panel-tab').click());
  await wait(800);
  await cap.capture('cf7-saved-mail', { settle: 600 });
  await cap.go('/wp-admin/admin.php?page=wpcf7', '.wp-list-table');
  await cap.capture('cf7-list');
  const shortcode = await cap.php('$f = wpcf7_contact_form( (int) $data ); return $f ? $f->shortcode() : null;', formId);
  cap.data.shortcode = shortcode;
  log('shortcode', shortcode);

  // the contact page: the shortcode block, 更新
  await cap.go(`/wp-admin/post.php?post=${ids.contact}&action=edit`, 'iframe[name="editor-canvas"]');
  await wait(4000);
  await cap.capture('contact-editor', { settle: 1200 });
  // the block inserter: search "contact" → the Contact Form 7 block (CF7 recommends its block over the shortcode)
  const SEARCH = '.block-editor-inserter__search input, .editor-inserter-sidebar input[type="search"], .components-search-control__input';
  await cap.eval(() => document.querySelector('.editor-document-tools__inserter-toggle').click());
  await wait(2000);
  await cap.capture('contact-inserter', { inputs: [[SEARCH, 'search']], settle: 1000 });
  await cap.type(SEARCH, 'contact');
  await wait(2000);
  await cap.capture('contact-inserter-search', { inputs: [[SEARCH, 'search']], settle: 1000 });
  const hash = await cap.php('return get_post_meta( (int) $data, "_hash", true );', formId);
  await cap.eval(() => { const b = [...document.querySelectorAll('.block-editor-block-types-list__item')].find((x) => /コンタクトフォーム|Contact Form/i.test(x.textContent)); b.click(); });
  await wait(2500);
  await cap.eval((o) => {
    const sel = wp.data.select('core/block-editor').getSelectedBlock() || wp.data.select('core/block-editor').getBlocks().find((x) => /contact-form-7/.test(x.name));
    if (sel) wp.data.dispatch('core/block-editor').updateBlockAttributes(sel.clientId, { id: o.id, hash: o.hash ? o.hash.slice(0, 7) : undefined, title: o.title });
  }, { id: formId, hash, title: 'お問い合わせ（IR）' });
  await wait(2500);
  cap.data.block = await cap.eval(() => wp.data.select('core/block-editor').getBlocks().map((x) => ({ name: x.name, attrs: x.attributes })));
  log('blocks', JSON.stringify(cap.data.block));
  await cap.capture('contact-block', { settle: 1200 });
  await cap.eval(() => document.querySelector('.editor-post-publish-button, .editor-header__settings .is-primary').click());
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
  txt = fixClock(txt);
  fs.writeFileSync(file, txt);
  log(`replaced ${n} e-mail address(es) with the Playground host`);
})().catch((e) => { console.error(e); process.exit(1); });
