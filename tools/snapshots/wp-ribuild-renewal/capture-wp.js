/*
 * The REAL WordPress screens of the video wp-ribuild-renewal (整体りびるど, ribuild.jp), captured from WordPress itself
 * (WordPress Playground, tools/wp/playground.js) into public/videos/wp-ribuild-renewal/js/wp-snapshot.js + assets/wp/.
 *
 *   node tools/snapshots/wp-ribuild-renewal/capture-wp.js [screenshot folder]   → node tools/webp.js wp-ribuild-renewal
 *
 * The WordPress is set up as the production site is on the day of the video (2026-10-29), before the renewal:
 *   - WordPress (latest, Japanese), site title / tagline / site icon = ribuild.jp's own (REST API, the live favicon)
 *   - the old theme: Lightning (wordpress.org) with a header menu; the theme of the renewal "rebuild" is uploaded
 *     during the video (the files the video types: public/videos/wp-ribuild-renewal/js/files.js, with the live theme's
 *     own screenshot.png and style.min.css)
 *   - plugins the live site uses that are on wordpress.org: Contact Form 7, Elementor, Custom Post Type UI (お知らせ),
 *     All-in-One WP Migration, Useful Blocks — with their Japanese translations
 *   - the pages, posts (up to the video's date), categories and news of the live site (REST API: titles, slugs, dates,
 *     IDs); the symptom pages still at the top level, the contact page still at /お問い合わせ/
 *   - the Elementor landing page 四十肩・五十肩 (canvas template) rebuilt from the live page's own images and texts
 * Then the screens are reached through the real UI (typing, bulk edit, quick edit, theme upload …) and captured.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const WPC = require('../../wp/playground');

const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos/wp-ribuild-renewal');
const SHOTS = process.argv[2] || null;
const LIVE = 'https://ribuild.jp';
const DATE = '2026-10-29';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const { log, wait } = WPC;

// the live site is read once per day: a re-run (the capture often needs several) uses the copy in the temp folder
const CACHE = path.join(os.tmpdir(), 'wp-ribuild-renewal-live', DATE);
const cached = async (u, fn) => {
  const f = path.join(CACHE, require('crypto').createHash('sha1').update(u).digest('hex'));
  if (fs.existsSync(f)) return fs.readFileSync(f);
  const b = await fn();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(f, b);
  return b;
};
const get = async (u, bin) => {
  const b = await cached(u, async () => { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(`${r.status} ${u}`); return Buffer.from(await r.arrayBuffer()); });
  return bin ? b : b.toString('utf8');
};
const getAll = async (rest) => {
  const out = [];
  for (let p = 1; p < 10; p++) {
    let j;
    try { j = JSON.parse(await get(`${LIVE}/wp-json/wp/v2/${rest}${rest.includes('?') ? '&' : '?'}per_page=100&page=${p}`)); } catch (e) { if (/^\d{3} /.test(e.message)) break; throw e; }
    if (!Array.isArray(j) || !j.length) break;
    out.push(...j);
  }
  return out;
};
const dec = (s) => String(s).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&#8211;/g, '–');

/* ------------------------------------------------------------------ the video's files (window.FILES) */
const FILES = (() => { const w = {}; new Function('window', fs.readFileSync(path.join(DIR, 'js/files.js'), 'utf8'))(w); return w.FILES; })();

/**
 * rebuild.zip, made as in the video:
 *   bad   Windows PowerShell 5.1 "Compress-Archive -Path .\wp-content\themes\rebuild" — its zip entries are named with
 *         backslashes (rebuild\style.css), which the server does not read as folders: WordPress finds no style.css
 *   good  Windows' own tar (bsdtar) "tar -a -c -f rebuild.zip -C wp-content\themes rebuild" — rebuild/style.css
 */
async function makeZips() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ribuild-zip-'));
  const theme = path.join(tmp, 'wp-content/themes/rebuild');
  for (const [k, v] of Object.entries(FILES.final())) {
    if (!k.startsWith(FILES.T)) continue;
    const f = path.join(tmp, k);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, v);
  }
  // the live theme's own screenshot and compiled CSS / images the files refer to
  const own = ['screenshot.png', 'assets/css/style.min.css', 'assets/images/common/logo-mark.png', 'assets/images/common/logo-font.svg',
    'assets/images/common/icon-tel-header.svg', 'assets/images/common/icon-contact.svg', 'assets/images/common/icon-web-reserve.svg', 'assets/images/common/icon-tel.svg'];
  for (const f of own) { fs.mkdirSync(path.dirname(path.join(theme, f)), { recursive: true }); fs.writeFileSync(path.join(theme, f), await get(`${LIVE}/wp-content/themes/rebuild/${f}`, true)); }
  for (const f of ['assets/js/vendor.js', 'assets/js/common.js', 'assets/js/home.js']) { fs.mkdirSync(path.dirname(path.join(theme, f)), { recursive: true }); fs.writeFileSync(path.join(theme, f), '/* build */\n'); }
  const good = path.join(tmp, 'good', 'rebuild.zip'), bad = path.join(tmp, 'bad', 'rebuild.zip');
  fs.mkdirSync(path.dirname(good)); fs.mkdirSync(path.dirname(bad));
  const ps = (cmd) => execFileSync('powershell.exe', ['-NoProfile', '-Command', cmd], { stdio: 'inherit' });
  ps(`Compress-Archive -Path '${theme}' -DestinationPath '${bad}' -Force`);
  execFileSync(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', good, '-C', path.join(tmp, 'wp-content', 'themes'), 'rebuild'], { stdio: 'inherit' });
  const names = (z) => { const b = fs.readFileSync(z); const i = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])); let o = b.readUInt32LE(i + 16); const out = []; for (let k = 0; k < b.readUInt16LE(i + 10); k++) { const l = b.readUInt16LE(o + 28); out.push(b.slice(o + 46, o + 46 + l).toString()); o += 46 + l + b.readUInt16LE(o + 30) + b.readUInt16LE(o + 32); } return out; };
  log('zip entries — bad:', JSON.stringify(names(bad).slice(0, 4)), fs.statSync(bad).size, '/ good:', JSON.stringify(names(good).slice(0, 4)), fs.statSync(good).size);
  return { good, bad, screenshot: fs.readFileSync(path.join(theme, 'screenshot.png')) };
}

(async () => {
  /* ---------------------------------------------------------------- the live site's data */
  log('reading ribuild.jp (REST API) …');
  const site = JSON.parse(await get(`${LIVE}/wp-json/`));
  const cut = `${DATE}T12:00:00`;
  const pages = (await getAll('pages?_fields=id,slug,title,parent,menu_order,template,date')).filter((p) => p.date < cut);
  const posts = (await getAll('posts?_fields=id,slug,title,date,categories')).filter((p) => p.date < cut);
  const cats = await getAll('categories?_fields=id,name,slug,parent');
  const news = (await getAll('news?_fields=id,slug,title,date')).filter((p) => p.date < cut);
  log(`pages ${pages.length}, posts ${posts.length} (until ${DATE}), categories ${cats.length}, news ${news.length}`);
  const zips = await makeZips();
  log('zips', zips.good, zips.bad);

  const cap = await WPC.start({ id: 'wp-ribuild-renewal', site: LIVE, date: DATE, time: '13:33', shots: SHOTS, serverPath: '/home/ribuild/www/wp-content/' });
  await cap.boot(WPC.blueprint({
    title: dec(site.name), tagline: dec(site.description),
    themes: ['lightning', 'twentytwentyfive'], activate: 'lightning',
    plugins: ['contact-form-7', 'elementor', 'custom-post-type-ui', 'all-in-one-wp-migration', 'useful-blocks'],
    options: { show_on_front: 'posts' },
  }));
  await cap.translations();
  // from here on no calls to outside services: in Playground they hold up every wp-admin request (the dashboard's news
  // feed, plugin promotions); nothing on the captured screens needs them (Playground itself already turns WP-Cron off)
  await cap.files({ 'wp-content/mu-plugins/capture-offline.php': `<?php
add_filter( 'pre_http_request', function ( $pre, $args, $url ) {
	$host = wp_parse_url( $url, PHP_URL_HOST );
	return ( $host && wp_parse_url( home_url(), PHP_URL_HOST ) !== $host ) ? new WP_Error( 'http_request_blocked', 'offline' ) : $pre;
}, 10, 3 );
` });

  /* ---------------------------------------------------------------- content */
  // the admin user as on a working site: no welcome panel, block editor guide dismissed, 50 pages per screen
  await cap.php(`$u = 1; wp_update_user( [ 'ID' => $u, 'display_name' => 'ribuild', 'nickname' => 'ribuild' ] ); update_user_meta( $u, 'show_welcome_panel', 0 );
    update_user_meta( $u, 'edit_page_per_page', 50 ); update_user_meta( $u, 'metaboxhidden_dashboard', [ 'dashboard_primary' ] ); update_user_meta( $u, 'tgmpa_dismissed_notice_tgmpa', 1 ); update_user_meta( $u, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core/edit-post' => [ 'welcomeGuide' => false ], 'core' => [ 'isComplementaryAreaVisible' => true, 'inactivePanels' => [], 'openPanels' => [ 'post-status' ] ], '_modified' => gmdate( 'c' ) ] );
    update_option( 'elementor_onboarded', true ); update_option( 'elementor_tracker_notice', '1' ); update_user_meta( $u, 'elementor_introduction', [ 'ai-get-started-announcement' => true, 'globals_introduction' => true ] );
    return true;`);
  // WordPress' own sample content out (the live site's pages keep their IDs: the privacy policy is page 3)
  await cap.php('foreach ( [ 1, 2, 3 ] as $id ) wp_delete_post( $id, true ); return true;');
  // site icon (the live favicon)
  const iconId = await cap.media('logo2.png', await get(`${LIVE}/wp-content/uploads/2025/09/logo2.png`, true), 'logo2');
  await cap.php('update_option( "site_icon", $data ); return true;', iconId);
  // categories, posts (real IDs / slugs / dates), news via Custom Post Type UI (as on the live site)
  await cap.php(`foreach ( $data as $c ) { if ( ! term_exists( $c['slug'], 'category' ) ) wp_insert_term( $c['name'], 'category', [ 'slug' => $c['slug'] ] ); } return true;`,
    cats.filter((c) => c.slug !== 'uncategorized').map((c) => ({ name: dec(c.name), slug: decodeURIComponent(c.slug) })));
  const catSlug = Object.fromEntries(cats.map((c) => [c.id, decodeURIComponent(c.slug)]));
  for (let i = 0; i < posts.length; i += 60) {
    await cap.php(`foreach ( $data as $p ) { $cat = []; foreach ( $p['cats'] as $s ) { $t = get_term_by( 'slug', $s, 'category' ); if ( $t ) $cat[] = $t->term_id; }
      wp_insert_post( [ 'import_id' => $p['id'], 'post_type' => 'post', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_date' => $p['date'], 'post_category' => $cat, 'post_content' => '' ] ); } return true;`,
    posts.slice(i, i + 60).map((p) => ({ id: p.id, title: dec(p.title.rendered), slug: decodeURIComponent(p.slug), date: p.date.replace('T', ' '), cats: (p.categories || []).map((c) => catSlug[c]).filter(Boolean) })));
  }
  await cap.php(`$o = get_option( 'cptui_post_types', [] ); $o['news'] = [ 'name' => 'news', 'label' => 'お知らせ', 'singular_label' => 'お知らせ', 'description' => '', 'public' => 'true', 'publicly_queryable' => 'true', 'show_ui' => 'true', 'show_in_nav_menus' => 'true', 'delete_with_user' => 'false', 'show_in_rest' => 'true', 'rest_base' => '', 'rest_controller_class' => '', 'rest_namespace' => '', 'has_archive' => 'true', 'has_archive_string' => '', 'exclude_from_search' => 'false', 'capability_type' => 'post', 'hierarchical' => 'false', 'can_export' => 'true', 'rewrite' => 'true', 'rewrite_slug' => '', 'rewrite_withfront' => 'true', 'query_var' => 'true', 'query_var_slug' => '', 'menu_position' => '5', 'show_in_menu' => 'true', 'show_in_menu_string' => '', 'menu_icon' => 'dashicons-megaphone', 'register_meta_box_cb' => null, 'supports' => [ 'title', 'editor', 'thumbnail' ], 'taxonomies' => [], 'labels' => [], 'custom_supports' => '', 'enter_title_here' => '' ];
    update_option( 'cptui_post_types', $o ); if ( ! post_type_exists( 'news' ) ) register_post_type( 'news', [ 'public' => true, 'label' => 'お知らせ' ] );
    foreach ( $data as $n ) wp_insert_post( [ 'import_id' => $n['id'], 'post_type' => 'news', 'post_status' => 'publish', 'post_title' => $n['title'], 'post_name' => $n['slug'], 'post_date' => $n['date'] ] ); return true;`,
  news.map((n) => ({ id: n.id, title: dec(n.title.rendered), slug: decodeURIComponent(n.slug), date: n.date.replace('T', ' ') })));

  // media for the old front page and the landing page (the live site's own images)
  const lpImgs = ['6d2d893c2139acb9f8d42270d624b4d9.webp', '7667c6e502198a7d60e8c5bd53bb8b40.webp', '6355412019449ee1d0cd87b8cd76e084.webp', '2c942ba6b8c056aff9603cff0a69ac79.webp', '066cbabe5696e8741de24b072e6be9fe.webp', '536be289237a85636051ace1213efe34.webp'];
  const lp = {};
  for (const f of lpImgs) lp[f] = await cap.php('return [ $data, wp_get_attachment_url( $data ) ];', await cap.media(f, await get(`${LIVE}/wp-content/uploads/2026/05/${f}`, true)));
  // the old top page's slide: the clinic's own photo
  const slide = await cap.media('mv2.webp', await get(`${LIVE}/wp-content/themes/rebuild/assets/images/home/mv2.webp`, true), 'mv2');
  const slideUrl = await cap.php('return wp_get_attachment_url( $data );', slide);

  // the contact form (Contact Form 7, the live form's ID)
  const cf7 = await cap.php(`$f = WPCF7_ContactForm::get_template( [ 'title' => 'お問い合わせ' ] ); $f->save(); return $f->id();`);

  // pages: the live site's, as before the renewal (no /symptoms/ yet, contact still at /お問い合わせ/)
  const OLD_FRONT = `<!-- wp:heading {"textAlign":"center"} -->
<h2 class="wp-block-heading has-text-align-center">松本市・安曇野市の整体院・出張整体</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">ー心身『再構築』のきっかけをあなたにー</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>当院は、「自分の身体は自分で整える」という考え方を大切にしながら、感覚と動きのズレを整え、あなた本来の身体に戻るきっかけを届ける整体院です。担当するセラピストは医療や介護の第一線で約20年の臨床経験を積んできた松本市生まれの理学療法士です。</p>
<!-- /wp:paragraph -->
<!-- wp:heading -->
<h2 class="wp-block-heading">施術メニュー</h2>
<!-- /wp:heading -->
<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item --><li>ベーシック整体コース</li><!-- /wp:list-item --><!-- wp:list-item --><li>脳卒中後遺症ケアコース</li><!-- /wp:list-item --><!-- wp:list-item --><li>パーキンソン病ケアコース</li><!-- /wp:list-item --><!-- wp:list-item --><li>定期メンテナンスコース</li><!-- /wp:list-item --><!-- wp:list-item --><li>出張整体コース</li><!-- /wp:list-item --></ul>
<!-- /wp:list -->
<!-- wp:heading -->
<h2 class="wp-block-heading">受付時間・アクセス</h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>受付時間：9:30～17:30（日曜・祝日休み）<br>〒390-0313 長野県松本市岡田下岡田18-1 コニファーマンション岡田101</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>ご予約・お問い合わせは<a href="${LIVE}/お問い合わせ/">お問い合わせフォーム</a>、またはお電話（090-6933-8025）で承ります。</p>
<!-- /wp:paragraph -->`;
  const symptomIds = pages.filter((p) => p.parent === 4292).map((p) => p.id);
  const PAGE_ROWS = pages.filter((p) => p.id !== 4292).map((p) => ({
    id: p.id, title: dec(p.title.rendered), date: p.date.replace('T', ' '), order: p.menu_order, template: p.template || '',
    slug: p.id === 3244 ? 'お問い合わせ' : decodeURIComponent(p.slug), parent: p.parent === 4292 ? 0 : p.parent,
    content: p.id === 3120 ? OLD_FRONT : p.id === 3244 ? `[contact-form-7 id="${cf7}" title="お問い合わせ"]` : '',
  }));
  // parents first
  PAGE_ROWS.sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0));
  await cap.php(`foreach ( $data as $p ) { $id = wp_insert_post( [ 'import_id' => $p['id'], 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_parent' => $p['parent'], 'post_date' => $p['date'], 'menu_order' => $p['order'], 'post_content' => $p['content'], 'page_template' => $p['template'] ] ); }
    update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', 3120 ); update_option( 'page_for_posts', 3122 ); update_option( 'wp_page_for_privacy_policy', 3 ); return true;`, PAGE_ROWS);

  // the Elementor landing page: the live page's first view (its own images and headings, 800 px wide)
  const img = (f) => ({ id: 'i' + f.slice(0, 6), elType: 'widget', widgetType: 'image', settings: { image: { id: lp[f][0], url: lp[f][1] }, image_size: 'full' }, elements: [] });
  const head = (id, t, size, color) => ({ id, elType: 'widget', widgetType: 'heading', settings: { title: t, header_size: size || 'h2', align: 'center', ...(color ? { title_color: color } : {}) }, elements: [] });
  const LP = [{ id: 'c1a2b3c', elType: 'container', settings: { content_width: 'boxed', boxed_width: { unit: 'px', size: 800 }, flex_gap: { unit: 'px', size: 0, column: '0', row: '0' } }, elements: [
    img(lpImgs[0]), img(lpImgs[1]),
    head('h1first', 'はじめての方限定！', 'h2', '#0B2F6B'), head('h2basic', 'ベーシック整体コース', 'h3', '#0B2F6B'), head('h3first', '（初回はカウンセリング込80分）', 'h4'),
    img(lpImgs[2]), head('h4price', '2回目以降8,000円(税込)(40-60分)', 'h4'), img(lpImgs[3]), img(lpImgs[4]), img(lpImgs[5]),
  ] }];
  await cap.php(`foreach ( [ 3943, 4118 ] as $id ) { update_post_meta( $id, '_elementor_edit_mode', 'builder' ); update_post_meta( $id, '_elementor_template_type', 'wp-page' ); update_post_meta( $id, '_elementor_version', ELEMENTOR_VERSION ); update_post_meta( $id, '_elementor_data', wp_slash( wp_json_encode( $data ) ) ); update_post_meta( $id, '_wp_page_template', 'elementor_canvas' ); } return true;`, LP);

  // the old theme's header menu (Lightning): every page in one flat list
  const loc = await cap.php('return get_registered_nav_menus();');
  log('menu locations', JSON.stringify(loc));
  const MENU = [[3120, 'ホーム'], [3142, '当院について'], [3148, '施術メニュー・料金'], [4318, '腰痛'], [4348, '肩の痛み'], [4371, '首・肩の痛み'], [4383, '膝の痛み'], [3152, 'よくあるご質問'], [3154, 'お客様の声'], [3122, 'ブログ'], [3244, 'お問い合わせ']];
  await cap.php(`$m = wp_create_nav_menu( 'グローバルメニュー' ); foreach ( $data['items'] as $i => [ $id, $label ] ) wp_update_nav_menu_item( $m, 0, [ 'menu-item-title' => $label, 'menu-item-object-id' => $id, 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish', 'menu-item-position' => $i + 1 ] );
    $l = get_theme_mod( 'nav_menu_locations', [] ); foreach ( array_keys( get_registered_nav_menus() ) as $k ) { if ( preg_match( '/global|header|primary/i', $k ) ) $l[ $k ] = $m; } set_theme_mod( 'nav_menu_locations', $l ); return $l;`, { items: MENU });
  // the old top page slide (Lightning's slider): the clinic's own photo and copy instead of the theme's sample slides
  await cap.php(`$o = get_option( 'lightning_theme_options', [] ); $o = array_merge( is_array( $o ) ? $o : [], [ 'top_slide_display' => 'display', 'top_slide_image_1' => $data, 'top_slide_url_1' => '',
    'top_slide_text_title_1' => '松本市・安曇野市の整体院・出張整体', 'top_slide_text_caption_1' => 'ー心身『再構築』のきっかけをあなたにー', 'top_slide_text_btn_1' => '', 'top_slide_text_align_1' => 'left',
    'top_slide_text_color_1' => '#ffffff', 'top_slide_cover_color_1' => '#000000', 'top_slide_cover_opacity_1' => '25', 'top_slide_text_shadow_use_1' => false,
    'top_slide_image_2' => '', 'top_slide_image_3' => '', 'top_slide_text_title_2' => '', 'top_slide_text_title_3' => '' ] ); update_option( 'lightning_theme_options', $o ); return true;`, slideUrl);
  // Lightning's "古いオプションが存在するため、データベースを更新する必要があります" (shown on any new install): what its
  // 「データベースを更新」 button runs — a site that has used the theme for years has done this long ago
  await cap.php("if ( class_exists( 'VK_Old_Options_Notice' ) ) { VK_Old_Options_Notice::option_judgment( 'update' ); } return true;");
  cap.data = { cf7, symptomIds, contactId: 3244, lpId: 3943, siteIcon: iconId };
  // notices a working site has dismissed long ago (the theme's plugin recommendation — user meta above —, Elementor's
  // promotions): Elementor's own "viewed" flag for each notice on the screens, as its dismiss button sets it
  for (const [rel, ready] of [['/wp-admin/edit.php?post_type=page', '.wp-list-table'], ['/wp-admin/', '#dashboard-widgets'], ['/wp-admin/themes.php', '.theme-browser']]) {
    await cap.go(rel, ready);
    const notices = await cap.eval(() => [...document.querySelectorAll('#wpbody-content .notice, #wpbody-content .e-notice, #wpbody-content [data-notice_id]')].map((n) => ({ id: n.dataset.notice_id || n.getAttribute('data-notice-id') || n.id || '', cls: n.className.slice(0, 60), text: n.textContent.trim().replace(/\s+/g, ' ').slice(0, 60) })));
    log('notices on', rel, JSON.stringify(notices));
    const ids = notices.map((n) => n.id).filter(Boolean);
    if (ids.length) log('  dismissed', JSON.stringify(await cap.php("$out = []; foreach ( $data as $id ) { if ( class_exists( '\\\\Elementor\\\\User' ) && method_exists( '\\\\Elementor\\\\User', 'set_user_notice' ) ) { \\Elementor\\User::set_user_notice( $id, true ); $out[] = $id; } } return $out;", ids)));
    // other promotion banners (Elementor Pro on the dashboard): their own close button
    for (let k = 0; k < 3; k++) {
      const hit = await cap.eval(() => {
        const box = [...document.querySelectorAll('#wpbody-content div')].find((d) => /Elementor Pro でサイトを|アップグレードしましょう/.test(d.textContent) && d.querySelector('button, .notice-dismiss, [class*="dismiss"], [class*="close"]') && d.textContent.length < 600 && d.offsetParent);
        if (!box) return null;
        const b = box.querySelector('[class*="dismiss"], [class*="close"], button[aria-label]') || box.querySelector('button');
        const info = (box.outerHTML.match(/^<[^>]+>/) || [''])[0].slice(0, 200) + ' → ' + (b.outerHTML.match(/^<[^>]+>/) || [''])[0].slice(0, 160);
        b.click();
        return info;
      });
      if (!hit) break;
      log('  closed banner', hit);
      await wait(1500);
    }
  }

  /* ---------------------------------------------------------------- 1. the old site + the admin */
  await cap.go('/', '#site-header, header');
  await cap.capture('old-front');
  await cap.go('/wp-admin/', '#dashboard-widgets');
  await cap.capture('dashboard');
  await cap.go('/wp-admin/edit.php?post_type=page', '.wp-list-table');
  await cap.capture('pages-before');

  /* ---------------------------------------------------------------- 2. the parent page 症状別のお悩み (block editor) */
  await cap.go('/wp-admin/post-new.php?post_type=page', '.editor-header, .edit-post-header');
  const canvas = async () => { for (let i = 0; i < 60; i++) { const fr = cap.frame.childFrames().find((c) => c.name() === 'editor-canvas'); if (fr) { try { if (await fr.$('.editor-post-title__input, h1.wp-block-post-title')) return fr; } catch (e) { /* loading */ } } await wait(500); } throw new Error('no editor canvas'); };
  let cv = await canvas();
  await wait(2500);
  await cap.capture('page-new', { settle: 1200 });
  // the title (typed for real, the video draws the same typing on the empty capture)
  await (await cv.$('.editor-post-title__input, h1.wp-block-post-title')).click();
  await cv.type('.editor-post-title__input, h1.wp-block-post-title', '症状別のお悩み', { delay: 10 });
  await wait(800);
  // the URL row of the page panel → its popover with the slug field
  const urlBtn = await cap.eval(() => {
    const row = [...document.querySelectorAll('.editor-post-panel__row')].find((r) => /スラッグ|URL/.test((r.querySelector('.editor-post-panel__row-label') || {}).textContent || ''));
    const b = row && row.querySelector('button');
    if (!b) return [...document.querySelectorAll('.editor-post-panel__row')].map((r) => r.textContent.slice(0, 40)).join(' | ');
    b.setAttribute('data-demo-url', '1'); return 'ok ' + b.textContent;
  });
  log('URL button:', urlBtn);
  await cap.click('[data-demo-url]');
  await wait(1200);
  const slugSel = await cap.eval(() => {
    const i = document.querySelector('.editor-post-url input, .components-popover input[type="text"], .components-popover input');
    if (!i) return null; i.setAttribute('data-demo-slug', '1'); return i.outerHTML.slice(0, 200);
  });
  log('slug input:', slugSel);
  // the capture takes the focus away first, and the popover closes when its field loses the focus: keep it there
  await cap.eval(() => {
    const a = document.activeElement; if (a && a !== document.body) a.blur = () => {};
    window.__keepOpen = (e) => e.stopImmediatePropagation();
    for (const t of ['focusout', 'blur']) window.addEventListener(t, window.__keepOpen, true);
  });
  await cap.capture('page-url', { inputs: [['[data-demo-slug]', 'slug']], settle: 800 });
  log('slug field after the capture:', await cap.eval(() => !!document.querySelector('[data-demo-slug]')));
  await cap.eval(() => { for (const t of ['focusout', 'blur']) window.removeEventListener(t, window.__keepOpen, true); });
  if (!(await cap.frame.$('[data-demo-slug]'))) {
    await cap.click('[data-demo-url]');
    await wait(1200);
    await cap.eval(() => { const i = document.querySelector('.editor-post-url input, .components-popover input[type="text"], .components-popover input'); if (i) i.setAttribute('data-demo-slug', '1'); });
  }
  await cap.type('[data-demo-slug]', 'symptoms');
  await wait(600);
  const slugEl = await cap.frame.$('[data-demo-slug]');
  if (slugEl) { await slugEl.press('Enter').catch(() => null); await wait(500); }
  const still = await cap.frame.$('[data-demo-slug]');
  if (still) { await still.press('Escape').catch(() => null); await wait(500); }
  await wait(600);
  await cap.click('.editor-post-publish-panel__toggle, .editor-post-publish-button__button');
  await wait(1800);
  await cap.capture('page-prepublish', { settle: 800 });
  await cap.click('.editor-post-publish-panel__header-publish-button button, .editor-post-publish-panel .editor-post-publish-button');
  for (let i = 0; i < 60; i++) { if (await cap.eval(() => !!document.querySelector('.post-publish-panel__postpublish, .editor-post-publish-panel__postpublish'))) break; await wait(500); }
  await wait(1500);
  await cap.capture('page-published', { settle: 800 });
  const parentId = await cap.eval(() => +new URLSearchParams(location.search).get('post') || +(document.querySelector('#post_ID') || {}).value || 0);
  const pid = parentId || await cap.php("$p = get_page_by_path( 'symptoms' ); return $p ? $p->ID : 0;");
  log('parent page', pid);
  cap.data.parentId = pid;

  /* ---------------------------------------------------------------- 3. bulk edit: the symptom pages under it */
  await cap.go('/wp-admin/edit.php?post_type=page', '.wp-list-table');
  await cap.capture('pages-mid');
  await cap.eval((ids) => { ids.forEach((id) => { const c = document.getElementById('cb-select-' + id); if (c) c.checked = true; }); const s = document.getElementById('bulk-action-selector-top'); s.value = 'edit'; }, symptomIds);
  await cap.click('#doaction');
  await wait(1500);
  await cap.capture('pages-bulk', { settle: 800 });
  await cap.eval((pid) => { const s = document.querySelector('#bulk-edit select[name="post_parent"]'); s.value = String(pid); s.dispatchEvent(new Event('change', { bubbles: true })); }, pid);
  await wait(500);
  await cap.capture('pages-bulk-set', { settle: 500 });
  await cap.eval(() => { setTimeout(() => document.getElementById('bulk_edit').click(), 0); });
  await wait(1500);
  await cap.settle('.wp-list-table');
  await cap.capture('pages-after');

  /* ---------------------------------------------------------------- 4. quick edit: the contact page's slug */
  await cap.eval(() => { const r = document.getElementById('post-3244'); r.querySelector('button.editinline, .editinline').click(); });
  await wait(1500);
  await cap.capture('pages-quick', { inputs: [['#edit-3244 input[name="post_name"]', 'slug']], settle: 800 });
  await cap.type('#edit-3244 input[name="post_name"]', 'contact');
  await cap.eval(() => document.querySelector('#edit-3244 .save').click());
  for (let i = 0; i < 40; i++) { if (await cap.eval(() => !document.getElementById('edit-3244') && !!document.getElementById('post-3244'))) break; await wait(500); }
  await wait(1000);
  await cap.capture('pages-final');
  // pages (hierarchical) get no _wp_old_slug, so WordPress itself does not redirect the old URL: the theme does (functions.php)
  log('old slug kept by WordPress:', JSON.stringify(await cap.php("return get_post_meta( 3244, '_wp_old_slug' );")));

  /* ---------------------------------------------------------------- 4b. a backup before the theme changes: All-in-One WP Migration */
  const evr = async (fn, ...a) => { for (let i = 0; ; i++) { try { return await cap.eval(fn, ...a); } catch (e) { if (i > 5 || !/context was destroyed|detached/i.test(e.message)) throw e; await wait(1500); } } };
  await cap.go('/wp-admin/admin.php?page=ai1wm_export', '.ai1wm-button-export, #ai1wm-export-file, .ai1wm-container');
  await cap.capture('ai-export', { settle: 800 });
  log('ai1wm buttons', JSON.stringify(await evr(() => [...document.querySelectorAll('.ai1wm-button-export, #ai1wm-export-file')].map((e) => (e.id || e.className.slice(0, 50)) + ': ' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)))));
  await evr(() => { const b = document.querySelector('.ai1wm-button-export'); if (b) b.click(); });
  await wait(900);
  await cap.capture('ai-export-menu', { settle: 400 });
  await evr(() => { const a = document.querySelector('#ai1wm-export-file'); if (a) a.click(); });
  let aiDone = '';
  for (let i = 0; i < 150; i++) {
    const st = await evr(() => { const m = document.querySelector('.ai1wm-modal-container'); return m ? m.innerText.replace(/\s+/g, ' ').slice(0, 240) : ''; }).catch(() => '');
    if (i % 10 === 0) log('  ai1wm', st.slice(0, 120));
    if (/ダウンロード|Download|エラー|Error|失敗/.test(st)) { aiDone = st; break; }
    await wait(1000);
  }
  log('ai1wm result', aiDone);
  if (aiDone) {
    await wait(800);
    await cap.capture('ai-export-done', { settle: 600 });
    cap.data.aiFile = await evr(() => { const a = document.querySelector('.ai1wm-modal-container a[href*=".wpress"], .ai1wm-modal-container a.ai1wm-button-green'); return a ? { text: a.innerText.trim(), href: a.getAttribute('href') } : null; });
    log('ai1wm file', JSON.stringify(cap.data.aiFile));
  }

  /* ---------------------------------------------------------------- 5. the new theme: upload (wrong zip, right zip) + activate */
  await cap.go('/wp-admin/themes.php', '.theme-browser .theme');
  await cap.capture('themes-before');
  await cap.go('/wp-admin/theme-install.php', '.upload-view-toggle, .wrap');
  await cap.eval(() => { const b = document.querySelector('.upload-view-toggle'); if (b) b.click(); });
  await wait(1200);
  await cap.capture('theme-upload', { settle: 800 });
  // the page can still be navigating when it is read: retry those reads
  const ev = async (fn, ...a) => { for (let i = 0; ; i++) { try { return await cap.eval(fn, ...a); } catch (e) { if (i > 5 || !/context was destroyed|detached/i.test(e.message)) throw e; await wait(1500); } } };
  const upload = async (zip) => {
    await cap.go('/wp-admin/theme-install.php', '.upload-view-toggle, .wrap');
    await ev(() => { const b = document.querySelector('.upload-view-toggle'); if (b) b.click(); });
    await wait(800);
    const input = await cap.frame.$('#themezip');
    await input.uploadFile(zip);
    await wait(500);
    await ev(() => { setTimeout(() => document.querySelector('#install-theme-submit').click(), 0); });
    await wait(2000);
    await cap.settle('.wrap');
    for (let i = 0; i < 60; i++) { if (await ev(() => /完了|失敗|できません|ありません/.test(document.querySelector('.wrap').textContent))) break; await wait(500); }
    await wait(1000);
  };
  await upload(zips.bad);
  await cap.capture('theme-install-failed');
  await upload(zips.good);
  await cap.capture('theme-installed');
  const act = await cap.eval(() => { const a = [...document.querySelectorAll('.wrap a')].find((x) => /action=activate/.test(x.href)); return a ? a.getAttribute('href') : null; });
  log('activate link', act);
  await cap.go('/wp-admin/' + act.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), 'body').catch(() => null);
  await cap.go('/wp-admin/themes.php?activated=true', '.theme-browser .theme');
  await cap.capture('themes-after');
  log('active theme', await cap.php('return [ get_stylesheet(), wp_get_theme()->get( "Name" ) ];'));
  // the old contact URL with the new theme: its redirect (functions.php) → /contact/
  log('old URL', JSON.stringify(await cap.eval(async (o) => { const r = await fetch(o + '/' + encodeURIComponent('お問い合わせ') + '/'); return { status: r.status, redirected: r.redirected, url: r.url.replace(o, '') }; }, cap.origin)));

  /* ---------------------------------------------------------------- 6. the landing page in Elementor (desktop, mobile) */
  const elReady = async (sel) => { for (let i = 0; i < 90; i++) { const ok = await cap.eval((s) => { const f = document.getElementById('elementor-preview-iframe'); try { return !!(f && f.contentDocument && f.contentDocument.querySelector(s)) && !document.body.classList.contains('elementor-editor-loading'); } catch (e) { return false; } }, sel).catch(() => false); if (ok) return; await wait(1000); } throw new Error('elementor not ready'); };
  const elState = () => cap.eval(() => { const f = document.getElementById('elementor-preview-iframe'); let pv = null; try { pv = f && f.contentDocument ? { url: f.contentDocument.location.href.slice(-120), title: f.contentDocument.title, body: (f.contentDocument.body ? f.contentDocument.body.className : '').slice(0, 200), text: (f.contentDocument.body ? f.contentDocument.body.innerText : '').slice(0, 300) } : null; } catch (e) { pv = String(e); } return { body: document.body.className.slice(0, 200), src: f ? f.src.slice(-120) : null, pv, msg: (document.querySelector('.dialog-message, .elementor-loading-title, #elementor-try-safe-mode') || {}).innerText }; }).catch((e) => ({ err: e.message }));
  await cap.go('/wp-admin/post.php?post=3943&action=elementor', '#elementor-preview-iframe');
  let elOk = true;
  try {
    await elReady('.elementor-widget-image img');
  } catch (e) {
    elOk = false;
    log('elementor not ready:', JSON.stringify(await elState()));
    const pg = (await cap.browser.pages()).pop();
    await pg.screenshot({ path: path.join(SHOTS || DIR, 'wp-el-failed.jpg'), type: 'jpeg', quality: 70 }).catch(() => null);
  }
  if (elOk) await captureElementor();
  await cap.finish();
  require('./link-wp-fonts')();

  async function captureElementor() {
  await wait(4000);
  await cap.capture('el-desktop', { settle: 1000 });
  const mob = await cap.eval(() => {
    const b = [...document.querySelectorAll('button, [role="tab"], a')].find((x) => /モバイル|mobile/i.test((x.getAttribute('aria-label') || '') + (x.getAttribute('title') || '') + (x.getAttribute('value') || '') + (x.dataset.device || '')));
    if (!b) return null; b.setAttribute('data-demo-mobile', '1'); return (b.getAttribute('aria-label') || b.getAttribute('title') || b.outerHTML.slice(0, 120));
  });
  log('mobile switch', mob);
  if (mob) { await cap.click('[data-demo-mobile]'); await wait(4000); await cap.capture('el-mobile', { settle: 1200 }); }
  }
})().catch((e) => { console.error(e); process.exit(1); });
