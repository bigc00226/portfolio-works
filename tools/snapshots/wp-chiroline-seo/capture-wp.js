/*
 * The real WordPress screens of the wp-chiroline-seo video, captured from WordPress itself (tools/wp/playground.js:
 * WordPress Playground — real WordPress + PHP in the browser, Japanese, no account).
 *
 *   node tools/snapshots/wp-chiroline-seo/capture-wp.js [screenshot folder]   → node tools/webp.js wp-chiroline-seo
 *
 * The site is set up like chiroline-mitakain.com (live-data.json: its pages, posts and categories from its public REST
 * API): site title / tagline, the permalink structure /column/%postname%/, the theme Arkhe (wordpress.org) with a child
 * theme of the live slug arkhe_child, the post types 症例一覧 (symptom → /symptoms/) and 患者さんの声 (voice → /voice/).
 * Not installable: Arkhe Blocks Pro (paid; the free Arkhe Blocks was closed on wordpress.org), Arkhe Toolkit and Arkhe
 * CSS Editor (LOOS' own downloads) — the screens the video shows do not depend on them.
 * Every step the video shows is done for real before its screen is captured: SEO SIMPLE PACK searched / installed /
 * activated through プラグインを追加, its settings saved through its own form (the front page description, the GA4 ID,
 * the custom post type archives' noindex — on by default — switched off), the 料金情報 page's description saved through
 * the meta box of the block editor, the category セルフケア・ストレッチ's slug and description saved through its edit
 * screen. The front-end HTML WordPress outputs at those moments (robots / title / description) is kept in
 * WP_SNAPSHOT.data for the page-source views of the video.
 * Changed for the demo (tools/wp/playground.js): the Playground address → https://chiroline-mitakain.com, the capture
 * date → 2026-11-09 (the video's clock), the text boxes the video types into → look-alike boxes.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const WPC = require(path.join(ROOT, 'tools/wp/playground'));
const ID = 'wp-chiroline-seo';
const SHOTS = process.argv[2] || null;
const { log, wait } = WPC;
const LIVE = JSON.parse(fs.readFileSync(path.join(__dirname, 'live-data.json'), 'utf8'));
const SITE = 'https://chiroline-mitakain.com';

/** what the video types / saves — the live site's values (its page source, 2026-11-18) */
const V = {
  homeDesc: '三鷹で肩こり・腰痛・猫背の改善ならカイロライン三鷹整体院へ。マッサージで治らないつらい症状も、筋肉と背骨の専門家が根本原因にアプローチし改善に導きます。医師も推薦する施術、改善率98%の実績と専門家のアプローチで、長年のつらい腰痛や身体の歪みを整え、健康な体へ導きます。',
  gaId: 'G-6P09HMHJE9',
  priceDesc: 'カイロライン三鷹整体院の施術料金です。初回限定の割引料金から、2回目以降の通常料金を掲載しています。各種クレジットカード、電子マネーもご利用いただけますのでご安心ください。',
  catSlug: 'self-care',
  catDesc: '肩こりや腰痛、猫背などのつらい症状を自分で和らげるための簡単なストレッチやセルフケア方法を専門家が解説します。デスクワークの合間やご自宅でできる予防・改善法で、痛みのない毎日を目指しましょう。',
};
/** the category slugs / descriptions of the live site (set after the one the video edits) */
const CATS = {
  'self-care': V.catDesc,
  'body-mechanism': '「なぜ私の肩こりは治らないの？」「腰痛はどこから来るの？」といった疑問に、身体の専門家がお答えします。骨盤の歪みや背骨の重要性、自律神経との関係など、痛みの根本原因を分かりやすく解説します。',
  'lifestyle-tips': '痛みを繰り返さないための、日常生活での身体の使い方や習慣についてのアドバイス。正しい座り方やスマホの持ち方、枕の選び方など、今日から実践できる健康づくりのヒントが満載です。',
  'treatment-info': '当院の施術について詳しく解説します。カイロプラクティックと整体の違い、施術の流れ、期待できる効果、どのような症状に適しているかなど、初めての方の疑問や不安にお答えします。',
  'womens-care': '産後の骨盤の開きや腰痛、育児による肩こり、女性ホルモンの乱れによる不調など、女性特有のお悩みに特化した情報をお届けします。マタニティ期のケアについても専門家が解説します。',
  'kids-health': 'スマホやゲームによる子どもの猫背、姿勢の悪化が気になる保護者の方へ。成長期の身体のケアや、スポーツによるケガの予防など、お子様の健やかな成長をサポートするための情報です。',
  information: '臨時休業やキャンペーン情報、院長の健康に関する考えや日々の出来事などを発信するブログです。当院の最新情報はこちらをご確認ください。',
};

/** the 料金情報 page in core blocks: the live page's own texts (its Arkhe Blocks Pro layout is not available) */
const PRICE_BLOCKS = [
  ['h2', '初回料金 （初めての方）'], ['p', '初回施術料 ¥8,500 （税込）　検査＋施術時間目安 約６０分'], ['p', 'つらい症状から卒業したい方へ'],
  ['h2', '毎月先着10名さま限定割引！'], ['p', '初回施術料8,500円(税込)　初回60分※2回目以降は施術料8,500円'],
  ['p', '◎初回は「カウンセリング」と「検査」の時間をしっかりとります。それを踏まえて施術をいたしますので時間が長くなります。'],
  ['h2', '施術料金 （２回目以降の方）'], ['p', '肩こり・腰痛・猫背などをその場しのぎで終わらせず、背骨の硬さと深層筋の緊張の両方にアプローチ。都度利用・回数券・定期コースから、お身体の状態や通院ペースに合わせてお選びいただけます'],
  ['h2', 'こんな方におすすめ'], ['ul', ['肩こり・首こり・背中の張りを繰り返している方', '姿勢の崩れや猫背、巻き肩が気になる方', 'その場しのぎではなく、根本的に整えていきたい方', '継続しやすい料金で、無理なく身体をメンテナンスしたい方']],
  ['h2', 'まずはご自身に合う通い方から'], ['p', '初回のお試しから、継続的なメンテナンス、根本改善を目指す定期コースまで、目的に応じて選びやすい構成にしています。'],
];
const blocks = (list) => list.map(([t, v]) => {
  if (t === 'p') return `<!-- wp:paragraph -->\n<p>${v}</p>\n<!-- /wp:paragraph -->`;
  if (t === 'ul') return `<!-- wp:list -->\n<ul class="wp-block-list">${v.map((x) => `<!-- wp:list-item -->\n<li>${x}</li>\n<!-- /wp:list-item -->`).join('')}</ul>\n<!-- /wp:list -->`;
  return `<!-- wp:heading -->\n<h2 class="wp-block-heading">${v}</h2>\n<!-- /wp:heading -->`;
}).join('\n\n');

/** the child theme arkhe_child (the live slug): the post types of the live site */
const CHILD = {
  'wp-content/themes/arkhe_child/style.css': '/*\nTheme Name: Arkhe Child\nTemplate: arkhe\nDescription: カイロライン三鷹整体院\n*/\n',
  'wp-content/themes/arkhe_child/functions.php': `<?php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'arkhe-child-style', get_stylesheet_uri(), array( 'arkhe-main-style' ), wp_get_theme()->get( 'Version' ) );
} );
require_once __DIR__ . '/inc/post-types.php';
`,
  'wp-content/themes/arkhe_child/inc/post-types.php': `<?php
add_action( 'init', function () {
	register_post_type( 'symptom', array(
		'label'        => '症例一覧',
		'public'       => true,
		'has_archive'  => 'symptoms',
		'rewrite'      => array( 'slug' => 'symptoms', 'with_front' => false ),
		'menu_icon'    => 'dashicons-heart',
		'show_in_rest' => true,
		'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
	) );
	register_post_type( 'voice', array(
		'label'        => '患者さんの声',
		'public'       => true,
		'has_archive'  => 'voice',
		'rewrite'      => array( 'slug' => 'voice', 'with_front' => false ),
		'menu_icon'    => 'dashicons-format-quote',
		'show_in_rest' => true,
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
	) );
} );
`,
};

/** the head of a front-end page as WordPress outputs it right now (fetched inside the Playground) */
const head = (cap, rel) => cap.eval(async (u) => { const t = await (await fetch(u, { credentials: 'omit' })).text(); return t.slice(0, t.indexOf('</head>') + 7); }, cap.origin + rel);
const pick = (h) => ({
  title: (h.match(/<title>[^<]*<\/title>/) || [''])[0],
  robots: (h.match(/<meta name=['"]robots['"][^>]*>/) || [''])[0],
  description: (h.match(/<meta name="description"[^>]*>/) || [''])[0],
  canonical: (h.match(/<link rel=['"]canonical['"][^>]*>/) || [''])[0],
  ssp: (h.match(/<!-- SEO SIMPLE PACK[\s\S]*?<!-- \/ SEO SIMPLE PACK -->/) || [''])[0],
});
/** the bottom pane of the block editor (メタボックス) open, scrolled to SEO SIMPLE PACK's box */
async function openMetaBoxes(cap) {
  await cap.eval(() => {
    try { wp.data.dispatch('core/preferences').set('core/edit-post', 'metaBoxesMainOpenHeight', 560); } catch (e) { /* older editor */ }
    const t = [...document.querySelectorAll('button, [role="button"]')].find((b) => /メタボックス/.test(b.textContent) || /メタボックス/.test(b.getAttribute('aria-label') || ''));
    const pane = document.querySelector('.edit-post-meta-boxes-main');
    if (t && pane && !pane.classList.contains('is-open')) t.click();
  });
  await wait(1500);
  await cap.eval(() => {
    const box = document.querySelector('#ssp_metabox');
    const pane = box && (box.closest('.edit-post-meta-boxes-main__liner') || box.closest('.edit-post-meta-boxes-main') || box.parentElement);
    if (pane) pane.scrollTop = Math.max(0, box.offsetTop - 8);
  });
  await wait(800);
}
const tab = (cap, label) => cap.eval((l) => { const t = [...document.querySelectorAll('.ssp-page__tabs a, .ssp-page__tabs button, a, button')].find((x) => x.textContent.trim() === l); if (t) t.click(); return !!t; }, label);
const sspSave = (cap) => cap.eval(() => { const b = [...document.querySelectorAll('input[type="submit"], button[type="submit"]')].find((x) => /保存/.test(x.value || x.textContent)); setTimeout(() => b.click(), 0); return !!b; });

(async () => {
  const cap = await WPC.start({ id: ID, site: SITE, date: '2026-11-09', time: '13:31', shots: SHOTS, serverPath: '/home/chiroline/chiroline-mitakain.com/public_html/wp-content/' });
  await cap.boot(WPC.blueprint({
    title: 'カイロライン三鷹整体院', tagline: '三鷹で肩こり・腰痛・猫背を根本改善する整体', themes: ['arkhe'],
    options: { permalink_structure: '/column/%postname%/' },
  }));
  await cap.files(CHILD);

  // the site as it was before the session (live-data.json); the default sample content removed
  const ids = await cap.php(`
    switch_theme( 'arkhe_child' );
    wp_delete_post( 1, true ); wp_delete_post( 2, true );
    $pp = (int) get_option( 'wp_page_for_privacy_policy' ); if ( $pp ) wp_delete_post( $pp, true );
    $r = [ 'pages' => [], 'posts' => [], 'cats' => [] ];
    foreach ( $data['categories'] as $c ) { $t = wp_insert_term( $c['name'], 'category' ); $r['cats'][ $c['slug'] ] = is_wp_error( $t ) ? 0 : $t['term_id']; }
    // the live site has no 未分類 (its categories: live-data.json): another default category, WordPress' own one removed
    update_option( 'default_category', $r['cats']['information'] ); wp_delete_term( 1, 'category' );
    $mod = [ 'top' => '2025-09-29 16:38:46', 'voice' => '2025-10-06 21:17:54', 'column' => '2025-10-06 18:49:14', 'shops' => '2025-10-06 21:21:18', 'price' => '2025-10-06 10:57:38', 'access' => '2025-10-06 11:02:10', 'symptoms' => '2025-10-06 21:19:23' ];
    $order = [ 'top', 'voice', 'symptoms', 'price', 'access', 'shops', 'column' ];
    foreach ( array_reverse( $data['pages'] ) as $p ) {
      $id = wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'menu_order' => array_search( $p['slug'], $order ), 'post_date' => $mod[ $p['slug'] ] ?? '2025-10-06 10:00:00', 'post_content' => $p['slug'] === 'price' ? $data['price'] : '' ] );
      $r['pages'][ $p['slug'] ] = $id;
    }
    update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', $r['pages']['top'] );
    $u = wp_insert_user( [ 'user_login' => 'chiroline', 'user_pass' => wp_generate_password(), 'display_name' => 'カイロライン三鷹整体院', 'nickname' => 'カイロライン三鷹整体院', 'role' => 'editor' ] );
    $catid = [];
    foreach ( $data['categories'] as $c ) $catid[ $c['id'] ] = $r['cats'][ $c['slug'] ];
    foreach ( array_reverse( $data['posts'] ) as $p ) {
      $id = wp_insert_post( [ 'post_type' => 'post', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_date' => str_replace( 'T', ' ', $p['date'] ), 'post_author' => $u, 'post_category' => array_map( fn( $x ) => $catid[ $x ], $p['categories'] ), 'post_content' => '<!-- wp:paragraph --><p>' . $p['title'] . '</p><!-- /wp:paragraph -->' ] );
      $r['posts'][] = $id;
    }
    wp_update_user( [ 'ID' => 1, 'display_name' => 'カイロライン三鷹整体院', 'nickname' => 'カイロライン三鷹整体院' ] );
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core' => [ 'welcomeGuide' => false, 'isComplementaryAreaVisible' => true, 'enableChoosePatternModal' => false ], 'core/edit-post' => [ 'welcomeGuide' => false, 'metaBoxesMainOpenHeight' => 560 ], '_modified' => gmdate( 'c' ) ] );
    update_user_meta( 1, 'show_welcome_panel', 0 );
    update_user_meta( 1, 'closedpostboxes_dashboard', [ 'dashboard_primary' ] );
    flush_rewrite_rules();
    return $r;`, { ...LIVE, price: blocks(PRICE_BLOCKS) });
  log('site', JSON.stringify(ids));
  cap.data.ids = ids;
  cap.data.values = V;

  // the front end before SEO SIMPLE PACK (WordPress' own title / canonical)
  cap.data.before = { home: pick(await head(cap, '/')), voice: pick(await head(cap, '/voice/')), price: pick(await head(cap, '/price/')) };
  log('before', JSON.stringify(cap.data.before));

  /* ---------------------------------------------------------------- 2. SEO SIMPLE PACK: search, install, activate */
  await cap.go('/wp-admin/', '#wpadminbar');
  await cap.capture('dashboard');
  await cap.go('/wp-admin/plugin-install.php', '.plugin-install-php');
  await wait(2500);
  await cap.capture('plugin-add', { inputs: [['#search-plugins', 'psearch']], settle: 1200 });
  await cap.go('/wp-admin/plugin-install.php?s=SEO+SIMPLE+PACK&tab=search&type=term', '.plugin-card');
  await wait(2500);
  await cap.capture('plugin-search', { settle: 1200 });
  await cap.eval(() => document.querySelector('.plugin-card-seo-simple-pack .install-now').click());
  for (let i = 0; i < 120; i++) { await wait(1000); if (await cap.eval(() => !!document.querySelector('.plugin-card-seo-simple-pack .activate-now'))) break; }
  await wait(1500);
  await cap.capture('plugin-installed', { settle: 800 });
  await cap.translations();
  await cap.eval(() => document.querySelector('.plugin-card-seo-simple-pack .activate-now').click());
  await wait(6000);
  log('after activate at', await cap.eval(() => location.href));
  await cap.settle('#wpadminbar');
  await cap.capture('plugin-activated', { settle: 800 });
  cap.info.plugins = await cap.php("$p = []; foreach ( get_plugins() as $f => $d ) if ( is_plugin_active( $f ) ) $p[ dirname( $f ) ] = $d['Version']; return $p;");
  log('plugins', JSON.stringify(cap.info.plugins));
  cap.data.activated = pick(await head(cap, '/'));

  /* ---------------------------------------------------------------- SEO PACK › 一般設定 */
  await cap.go('/wp-admin/admin.php?page=ssp_main_setting', '#wpadminbar');
  await wait(1500);
  await cap.capture('ssp-basic', { inputs: [['textarea[name="home_desc"]', 'homeDesc']], settle: 1000 });
  await cap.eval((v) => { document.querySelector('textarea[name="home_desc"]').value = v; }, V.homeDesc);
  await sspSave(cap);
  await wait(2500);
  await cap.settle('#wpadminbar');
  await cap.capture('ssp-basic-saved', { settle: 1000 });
  // Googleアナリティクス
  await tab(cap, 'Googleアナリティクス');
  await wait(800);
  await cap.capture('ssp-ga', { inputs: [['#google_g_id', 'gaId']], settle: 800 });
  await cap.eval((v) => { document.querySelector('#google_g_id').value = v; }, V.gaId);
  await sspSave(cap);
  await wait(2500);
  await cap.settle('#wpadminbar');
  await tab(cap, 'Googleアナリティクス');
  await wait(800);
  await cap.capture('ssp-ga-saved', { settle: 800 });
  cap.data.afterBasic = { home: pick(await head(cap, '/')), voice: pick(await head(cap, '/voice/')), symptoms: pick(await head(cap, '/symptoms/')) };
  log('after basic', JSON.stringify(cap.data.afterBasic));

  // その他アーカイブ: 「カスタム投稿タイプ」のアーカイブページをインデックスさせない (on by default) → off
  await tab(cap, 'その他アーカイブ');
  await wait(800);
  await cap.eval(() => { const c = document.querySelector('#pt_archive_noindex'); const box = c && (c.closest('.ssp-field') || c.closest('tr') || c.parentElement); if (box) window.scrollTo(0, box.getBoundingClientRect().top + window.scrollY - 360); });
  await wait(800);
  await cap.capture('ssp-archive', { settle: 800 });
  await cap.eval(() => { const c = document.querySelector('#pt_archive_noindex'); if (c.checked) c.click(); });
  await wait(500);
  await cap.capture('ssp-archive-off', { settle: 500 });
  await sspSave(cap);
  await wait(2500);
  await cap.settle('#wpadminbar');
  await cap.capture('ssp-archive-saved', { settle: 800 });   // after saving: the screen as SEO SIMPLE PACK shows it (its first tab, the notice)
  await tab(cap, 'その他アーカイブ');
  await wait(800);
  await cap.eval(() => { const c = document.querySelector('#pt_archive_noindex'); const box = c && (c.closest('.ssp-field') || c.closest('tr') || c.parentElement); if (box) window.scrollTo(0, box.getBoundingClientRect().top + window.scrollY - 360); });
  await wait(800);
  await cap.capture('ssp-archive-saved-tab', { settle: 800 });
  cap.data.afterArchive = { voice: pick(await head(cap, '/voice/')), symptoms: pick(await head(cap, '/symptoms/')) };
  log('after archive', JSON.stringify(cap.data.afterArchive));

  /* ---------------------------------------------------------------- 3. 料金情報: the description in the meta box */
  cap.data.beforePrice = pick(await head(cap, '/price/'));
  await cap.go('/wp-admin/edit.php?post_type=page', '.wp-list-table');
  await cap.capture('pages');
  await cap.go(`/wp-admin/post.php?post=${ids.pages.price}&action=edit`, 'iframe[name="editor-canvas"]');
  await wait(5000);
  await cap.capture('edit-price', { settle: 1200 });
  await openMetaBoxes(cap);
  await cap.capture('edit-price-meta', { inputs: [['textarea[name="ssp_meta_description"]', 'pageDesc']], settle: 1200 });
  await cap.eval((v) => {
    const t = document.querySelector('textarea[name="ssp_meta_description"]');
    t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true }));
    wp.data.dispatch('core/editor').editPost({ meta: {} });
  }, V.priceDesc);
  await wait(600);
  await cap.eval(() => { const b = document.querySelector('.editor-post-publish-button, .editor-header__settings .is-primary'); b.click(); });
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.components-snackbar'))) break; }
  await wait(1500);
  await cap.capture('edit-price-saved', { settle: 400 });
  const saved = await cap.php('return get_post_meta( (int) $data, "ssp_meta_description", true );', ids.pages.price);
  log('price description saved:', saved);
  if (!saved) {   // the meta box is saved by a second request after the post: make sure it is there for the next steps
    await cap.php('update_post_meta( (int) $data[0], "ssp_meta_description", $data[1] ); return true;', [ids.pages.price, V.priceDesc]);
  }
  cap.data.afterPrice = pick(await head(cap, '/price/'));
  log('after price', JSON.stringify(cap.data.afterPrice));

  /* ---------------------------------------------------------------- 5. categories: slug, description */
  await cap.go('/wp-admin/edit-tags.php?taxonomy=category', '.wp-list-table');
  await cap.capture('cats', { settle: 800 });
  const selfCare = ids.cats['self-care'];
  await cap.go(`/wp-admin/term.php?taxonomy=category&tag_ID=${selfCare}&post_type=post`, '#edittag');
  await cap.capture('cat-edit', { inputs: [['#slug', 'slug'], ['#description', 'catDesc']], settle: 800 });
  await cap.eval((v) => { document.querySelector('#slug').value = v.catSlug; document.querySelector('#description').value = v.catDesc; setTimeout(() => document.querySelector('#edittag input[type="submit"]').click(), 0); }, V);
  await wait(2500);
  await cap.settle('#edittag');
  await cap.capture('cat-saved', { settle: 800 });
  // the other categories: as on the live site (the video says they were done the same way)
  await cap.php(`foreach ( $data['cats'] as $slug => $id ) { if ( $slug === 'self-care' ) continue; wp_update_term( $id, 'category', [ 'slug' => $slug, 'description' => $data['desc'][ $slug ] ] ); } return true;`, { cats: ids.cats, desc: CATS });
  await cap.go('/wp-admin/edit-tags.php?taxonomy=category', '.wp-list-table');
  await cap.capture('cats-done', { settle: 800 });
  cap.data.afterCat = pick(await head(cap, '/column/category/self-care/'));
  log('after cat', JSON.stringify(cap.data.afterCat));

  await cap.finish();
})().catch((e) => { console.error(e); process.exit(1); });
