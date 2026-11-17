/*
 * The real WordPress screens of the wp-stand-by-lp video, captured from WordPress itself (WordPress Playground via
 * tools/wp/playground.js) into public/videos/wp-stand-by-lp/js/wp-snapshot.js + assets/wp/.
 *
 *   node tools/snapshots/wp-stand-by-lp/capture-wp.js [shots folder]   → node tools/webp.js wp-stand-by-lp
 *   node tools/snapshots/wp-stand-by-lp/capture-wp.js --post           (only the rewriting after the capture, see postProcess)
 *
 * The site is set up like stand-by.jp (read from its public REST API and page source, 2026-11-17):
 *   - WordPress (latest, Japanese), site title / tagline of the live site, WordPress in /wp (the screens show
 *     https://stand-by.jp/wp/wp-admin/… and the pages at https://stand-by.jp/<slug>)
 *   - the plugins its REST API shows: Yoast Duplicate Post, WP Super Cache, All-in-One WP Migration, Site Kit by Google
 *     (from wordpress.org, with their Japanese translations)
 *   - the theme "Stand by Beauty Clinic" (stand_by_beauty_clinic) with its real style.css header and screenshot.png;
 *     its PHP is a stand-in (the theme's source is not public) that registers the site's post types 症例 / コラム / FAQ
 *   - the 45 pages the live site had on the video's date (titles, slugs, parents, dates, the real ids), the October
 *     campaign page (442) with its real content and banner (627); the page duplicated on screen becomes 677 and the
 *     uploaded December banner 678, the ids they have on the live site
 *   - 追加 CSS: the live site's own, without the two parts the video adds (the fixed reservation buttons, and the rule
 *     that hides them on PC)
 * Then the screens, in the order of the video: login, dashboard, pages, Duplicate Post → the block editor (each step of
 * the edit, made with the editor's own data API or real clicks / typing), publishing, the slug, WP Super Cache, the
 * Customizer's 追加 CSS (before, pasted, typed, published).
 */
const fs = require('fs');
const path = require('path');
const WPC = require('../../wp/playground');

const ID = 'wp-stand-by-lp';
const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos', ID);
const SHOTS = process.argv[2] || null;
const LIVE = 'https://stand-by.jp';
const THEME = 'stand_by_beauty_clinic';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const get = async (u, json) => { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(`${r.status} ${u}`); return json ? r.json() : Buffer.from(await r.arrayBuffer()); };
const { log, wait } = WPC;

/** the live page content (rendered HTML of core blocks) → [type, …] for the editor's own block serializer */
function spec(html) {
  const out = [];
  const re = /<(figure|h2|h3|p)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, tag, , inner] = m;
    if (tag === 'figure') out.push(['image', +(inner.match(/wp-image-(\d+)/) || [])[1]]);
    else out.push([tag, inner.trim()]);
  }
  return out;
}

/** the live 追加 CSS → before (without the fixed reservation buttons and the PC rule), pasted, final */
function splitCss(live) {
  const lines = live.split('\n');
  const find = (re, from = 0) => { const i = lines.findIndex((l, k) => k >= from && re.test(l)); if (i < 0) throw new Error('CSS: ' + re); return i; };
  const s0 = find(/^\/\* 画面下部に固定する枠 \*\//);
  const s1e = find(/^\}/, find(/^\.green-reserve-btn\.line-btn \.sub-text-frame \{/, s0));
  const p0 = find(/^\/\* PC版（画面幅768px以上）ではフッター固定ボタンを非表示にする \*\//);
  const p1e = find(/^\}/, find(/^\s+display: none !important;/, p0) + 1);
  const sticky = lines.slice(s0, s1e + 1).join('\n');
  const pc = lines.slice(p0, p1e + 1).join('\n');
  const rest = lines.filter((l, k) => !(k >= s0 && k <= s1e) && !(k >= p0 && k <= p1e));
  // the block goes where it is on the live site (after the case-card rule); the PC rule is typed right after it
  const at = rest.findIndex((l) => /^\/\* 症例カード枠の背景色を白にする \*\//.test(l));
  const atEnd = rest.findIndex((l, k) => k > at && /^\}/.test(l)) + 1;
  const pasted = [...rest.slice(0, atEnd), '', ...sticky.split('\n'), ...rest.slice(atEnd)];
  const final = [...rest.slice(0, atEnd), '', ...sticky.split('\n'), '', ...pc.split('\n'), ...rest.slice(atEnd)];
  return { before: rest.join('\n'), pasted: pasted.join('\n'), final: final.join('\n'), sticky, pc, atLine: atEnd + 1, pcLine: atEnd + 1 + sticky.split('\n').length + 1 };
}

/** the theme as installed on the site: real style.css header + screenshot.png; the PHP is a stand-in */
function themeFiles() {
  const t = `wp-content/themes/${THEME}/`;
  return {
    [t + 'style.css']: '@charset "UTF-8";\n/*\nTheme Name: Stand by Beauty Clinic\nTheme URI: \nDescription:\nVersion: 1.0\nAuthor: \nAuthor URI: \n*/\n',
    [t + 'functions.php']: `<?php
add_action( 'after_setup_theme', function () {
\tadd_theme_support( 'title-tag' );
\tadd_theme_support( 'post-thumbnails' );
\tregister_nav_menus( [ 'global' => 'グローバルナビ' ] );
} );
add_action( 'init', function () {
\tforeach ( [ 'case' => [ '症例', 'case_category', '症例カテゴリー' ], 'column' => [ 'コラム', 'column_category', 'コラムカテゴリー' ], 'faq' => [ 'FAQ', 'faq_category', 'FAQカテゴリー' ] ] as $type => [ $label, $tax, $tax_label ] ) {
\t\tregister_post_type( $type, [ 'label' => $label, 'public' => true, 'has_archive' => true, 'show_in_rest' => true, 'menu_position' => 5, 'supports' => [ 'title', 'editor', 'thumbnail' ] ] );
\t\tregister_taxonomy( $tax, $type, [ 'label' => $tax_label, 'hierarchical' => true, 'show_in_rest' => true ] );
\t}
} );
`,
    [t + 'index.php']: "<?php get_header(); ?>\n<main class=\"wrapCo\"><?php while ( have_posts() ) { the_post(); the_content(); } ?></main>\n<?php get_footer(); ?>\n",
    [t + 'page.php']: "<?php get_header(); ?>\n<main class=\"wrapCo\"><div class=\"postWrap\"><h1 class=\"menuTitle\"><?php the_title(); ?></h1><?php while ( have_posts() ) { the_post(); the_content(); } ?></div></main>\n<?php get_footer(); ?>\n",
    [t + 'header.php']: "<!DOCTYPE html>\n<html <?php language_attributes(); ?>>\n<head><meta charset=\"<?php bloginfo( 'charset' ); ?>\"><?php wp_head(); ?></head>\n<body class=\"contents\"><?php wp_body_open(); ?><div id=\"standWrap\">\n",
    [t + 'footer.php']: "</div><!--standWrap-->\n<?php wp_footer(); ?>\n</body>\n</html>\n",
  };
}

/** a real pointer click on the element the code `find` returns (React reacts only to real events) */
async function realClick(cap, find) {
  const ok = await cap.eval((src) => { const el = new Function(src)(); if (!el) return false; el.setAttribute('data-demo-click', ''); return true; }, find);
  if (!ok) return false;
  await cap.click('[data-demo-click]');
  await cap.eval(() => document.querySelectorAll('[data-demo-click]').forEach((e) => e.removeAttribute('data-demo-click'))).catch(() => null);
  return true;
}
const key = (cap, k) => cap.frame.page().keyboard.press(k);
/** capture() blurs the focused element first, which closes an open dropdown / popover: keep it open for the capture */
const keepFocus = (cap) => cap.eval(() => { const a = document.activeElement; if (a && a !== document.body) a.blur = () => {}; });

if (process.argv.includes('--post')) { postProcess(); console.log('post-processed'); process.exit(0); }

(async () => {
  log('reading the live site (REST API, page source) …');
  const pages = await get(`${LIVE}/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,title,date,modified,parent,menu_order,featured_media`, true);
  const site = await get(`${LIVE}/wp-json/`, true);
  const p442 = await get(`${LIVE}/wp-json/wp/v2/pages/442`, true);
  const p677 = await get(`${LIVE}/wp-json/wp/v2/pages/677`, true);
  const oldSpec = spec(p442.content.rendered), newSpec = spec(p677.content.rendered);
  const oldBanner = await get(`${LIVE}/wp/wp-content/uploads/2026/10/campaign_01.png`);
  const newBanner = await get(`${LIVE}/wp/wp-content/uploads/2026/11/2612-2701_______________________________.png`);
  const lineIcon = await get(`${LIVE}/wp/wp-content/uploads/2026/09/icons8-line-48.png`);
  const shot = await get(`${LIVE}/wp/wp-content/themes/${THEME}/screenshot.png`);
  const html = (await get(`${LIVE}/campaign_202612`)).toString();
  const CSS = splitCss(html.match(/<style id="wp-custom-css">([\s\S]*?)<\/style>/)[1].replace(/^\n+/, ''));
  log(`pages ${pages.length}, old content ${oldSpec.length} blocks, new ${newSpec.length}`);

  const cap = await WPC.start({ id: ID, site: `${LIVE}/wp`, date: '2026-11-02', time: '13:34', shots: SHOTS, serverPath: '/home/standby/stand-by.jp/public_html/wp/wp-content/' });
  await cap.boot(WPC.blueprint({
    title: site.name,
    tagline: site.description,
    plugins: ['duplicate-post', 'wp-super-cache', 'all-in-one-wp-migration', 'google-site-kit'],
  }));
  await cap.translations();
  // a site in use for a year and a half: no first-run notices, no sample content, WP Super Cache on
  await cap.php(`update_option( 'duplicate_post_show_notice', 0 ); update_user_meta( 1, 'show_welcome_panel', 0 );
    foreach ( [ 1, 2, 3 ] as $id ) wp_delete_post( $id, true );
    if ( function_exists( 'wp_cache_enable' ) ) wp_cache_enable();
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core/edit-post' => [ 'welcomeGuide' => false, 'welcomeGuideTemplate' => false ], 'core' => [ 'isComplementaryAreaVisible' => true ], '_modified' => gmdate( 'c' ) ] );
    update_user_meta( 1, 'show_admin_bar_front', 'false' ); return true;`);

  // ---- the theme
  await cap.files(themeFiles());
  await cap.php(`file_put_contents( get_theme_root() . '/${THEME}/screenshot.png', base64_decode( $data ) ); switch_theme( '${THEME}' ); return get_stylesheet();`, shot.toString('base64'));

  // ---- media (the live ids and dates), the pages (live ids, slugs, parents, dates)
  const MEDIA = `require_once ABSPATH . 'wp-admin/includes/image.php'; require_once ABSPATH . 'wp-admin/includes/file.php'; require_once ABSPATH . 'wp-admin/includes/media.php';
    $tmp = wp_tempnam( $data['name'] ); file_put_contents( $tmp, base64_decode( $data['b64'] ) );
    $id = media_handle_sideload( [ 'name' => $data['name'], 'tmp_name' => $tmp ], 0, $data['title'], [ 'import_id' => $data['id'], 'post_date' => $data['date'], 'post_date_gmt' => get_gmt_from_date( $data['date'] ) ] );
    if ( is_wp_error( $id ) ) throw new Exception( $id->get_error_message() ); return $id;`;
  log('media', await cap.php(MEDIA, { id: 627, name: 'campaign_01.png', title: 'campaign_01', date: '2026-10-09 10:24:34', b64: oldBanner.toString('base64') }),
    await cap.php(MEDIA, { id: 593, name: 'icons8-line-48.png', title: 'icons8-line-48', date: '2026-09-24 16:12:05', b64: lineIcon.toString('base64') }));
  const list = pages.filter((p) => p.id !== 677).sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0));
  await cap.php(`foreach ( $data as $p ) {
      $id = wp_insert_post( [ 'import_id' => $p['id'], 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_parent' => $p['parent'], 'menu_order' => $p['menu_order'], 'post_date' => $p['date'], 'post_date_gmt' => get_gmt_from_date( $p['date'] ), 'post_content' => '' ] );
      $GLOBALS['wpdb']->update( $GLOBALS['wpdb']->posts, [ 'post_modified' => $p['modified'], 'post_modified_gmt' => get_gmt_from_date( $p['modified'] ) ], [ 'ID' => $id ] );
    } update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', 14 ); update_option( 'wp_page_for_privacy_policy', 41 ); return count( $data );`,
  list.map((p) => ({ id: p.id, slug: p.slug, title: p.title.rendered.replace(/&#8211;/g, '–').replace(/&amp;/g, '&'), parent: p.parent, menu_order: p.menu_order, date: p.date.replace('T', ' '), modified: p.modified.replace('T', ' ') })));
  // 追加 CSS before the video
  await cap.php(`wp_update_custom_css_post( $data, [ 'stylesheet' => '${THEME}' ] ); return true;`, CSS.before);

  // the October page's real content, built with the block editor's own serializer (so the blocks are valid)
  const serialize = (sp, urls) => cap.eval((sp, urls) => {
    const { createBlock, serialize: ser } = window.wp.blocks;
    return ser(sp.map(([t, a]) => {
      if (t === 'image') return createBlock('core/image', { id: a, url: urls[a], alt: '', sizeSlug: 'full', linkDestination: 'none' });
      if (t === 'h2' || t === 'h3') return createBlock('core/heading', { level: t === 'h2' ? 2 : 3, content: a });
      return createBlock('core/paragraph', { content: a });
    }));
  }, sp, urls);
  await cap.go('/wp-admin/post.php?post=442&action=edit', 'iframe[name="editor-canvas"]');
  await wait(2500);
  const urls = { 627: await cap.php('return wp_get_attachment_url( 627 );') };
  const oldContent = await serialize(oldSpec, urls);
  await cap.php(`wp_update_post( [ 'ID' => 442, 'post_content' => $data ] ); set_post_thumbnail( 442, 627 );
    $GLOBALS['wpdb']->update( $GLOBALS['wpdb']->posts, [ 'post_modified' => '2026-10-09 10:25:19', 'post_modified_gmt' => '2026-10-09 01:25:19' ], [ 'ID' => 442 ] );
    delete_post_meta( 442, '_edit_lock' ); delete_post_meta( 442, '_edit_last' );
    foreach ( wp_get_post_revisions( 442 ) as $r ) wp_delete_post_revision( $r ); return true;`, oldContent);

  // ---------------------------------------------------------------- the screens
  // login (the developer opens /wp/wp-admin/ → redirected to the login)
  await cap.logout();
  await cap.go('/wp-login.php?redirect_to=' + encodeURIComponent(cap.origin + '/wp-admin/') + '&reauth=1', '#loginform');
  await cap.capture('login', { inputs: [['#user_login', 'user'], ['#user_pass', 'pass']] });
  await cap.login();
  await cap.go('/wp-admin/', '#wpadminbar');
  await cap.capture('dashboard');
  await cap.go('/wp-admin/edit.php?post_type=page', '.wp-list-table');
  await cap.capture('pages');

  // Duplicate Post: 新規下書き on the October campaign
  const dupHref = await cap.eval(() => { const a = document.querySelector('#post-442 .row-actions a[href*="duplicate_post_new_draft"]'); return a && a.getAttribute('href'); });
  if (!dupHref) throw new Error('Duplicate Post: no 新規下書き link');
  // the duplicated page becomes 677, the uploaded banner 678 — their ids on the live site
  const maxId = await cap.php("global $wpdb; return (int) $wpdb->get_var( \"SELECT MAX(ID) FROM {$wpdb->posts}\" );");
  if (maxId < 676) await cap.php("wp_insert_post( [ 'import_id' => 676, 'post_type' => 'post', 'post_status' => 'auto-draft', 'post_title' => '自動下書き' ] ); return true;");
  // (the link redirects to post.php: wait for the editor, not for the link's own path)
  await cap.eval((h) => { location.href = h; }, dupHref.replace(/&amp;/g, '&'));
  await wait(2500);
  await cap.settle('iframe[name="editor-canvas"]', 90000);
  const newId = await cap.eval(() => window.wp.data.select('core/editor').getCurrentPostId());
  log('duplicated as', newId, '(max id before:', maxId + ')');
  cap.data.page = newId;
  log('banner', await cap.php(MEDIA, { id: 678, name: '2612-2701_______________________________.png', title: '2612-2701_______________________________', date: '2026-11-02 13:33:20', b64: newBanner.toString('base64') }));
  urls[678] = await cap.php('return wp_get_attachment_url( 678 );');
  const canvasReady = () => cap.eval(() => { const f = document.querySelector('iframe[name="editor-canvas"]'); return !!(f && f.contentDocument && f.contentDocument.querySelector('.editor-post-title__input')); });
  for (let i = 0; i < 40 && !(await canvasReady()); i++) await wait(500);
  await wait(2500);
  await cap.eval(() => window.wp.data.dispatch('core/block-editor').clearSelectedBlock());
  await cap.capture('ed-dup', { settle: 1200 });

  // the title (typed on screen); the banner: the image block → 置換 → アップロード
  await cap.eval((t) => window.wp.data.dispatch('core/editor').editPost({ title: t }), p677.title.rendered);
  const imgId = await cap.eval(() => window.wp.data.select('core/block-editor').getBlocks().find((b) => b.name === 'core/image').clientId);
  await cap.eval((c) => window.wp.data.dispatch('core/block-editor').selectBlock(c), imgId);
  await wait(1500);
  await cap.capture('ed-imgsel', { settle: 800 });
  if (!(await realClick(cap, "return [...document.querySelectorAll('.block-editor-block-toolbar button')].find((x) => /置換/.test(x.textContent));"))) throw new Error('no 置換 button');
  await wait(1200);
  await keepFocus(cap);
  await cap.capture('ed-replace', { settle: 600 });
  await key(cap, 'Escape');
  await wait(600);
  await cap.eval((c, url) => window.wp.data.dispatch('core/block-editor').updateBlockAttributes(c, { id: 678, url, alt: '' }), imgId, urls[678]);
  await cap.eval(() => window.wp.data.dispatch('core/block-editor').clearSelectedBlock());
  await wait(1500);
  await cap.capture('ed-banner', { settle: 800 });

  // アイキャッチ画像 → the media library → the new banner
  await cap.eval(() => { const t = [...document.querySelectorAll('.editor-sidebar__panel-tabs button, .editor-sidebar__panel-tab, [role="tab"]')].find((b) => /固定ページ/.test(b.textContent)); if (t) t.click(); });
  await wait(600);
  if (!(await realClick(cap, "return document.querySelector('.editor-post-featured-image__preview, .editor-post-featured-image__toggle, .editor-post-featured-image button');"))) throw new Error('no featured image button');
  await cap.settle('.media-modal .media-menu-item, .media-modal .media-router button', 30000);
  await wait(1200);
  // (a fresh user opens on 「ファイルをアップロード」: the library tab)
  await realClick(cap, "const b = [...document.querySelectorAll('.media-modal .media-router button, .media-modal .media-menu-item')].find((x) => /ライブラリ/.test(x.textContent)); return b && !b.classList.contains('active') ? b : null;");
  await cap.settle('.media-modal .attachments .attachment', 60000);
  await wait(2500);
  await realClick(cap, "return document.querySelector('.media-modal .attachment[data-id=\"678\"]');");
  await wait(1500);
  await cap.capture('ed-feat-modal', { settle: 600 });
  await realClick(cap, "return document.querySelector('.media-modal .media-button-select');");
  await wait(1800);
  await cap.capture('ed-banner2', { settle: 900 });

  // the period (typed on screen), the details (pasted), the prices (pasted)
  const iPrices = newSpec.findIndex(([t]) => t === 'h3'), oPrices = oldSpec.findIndex(([t]) => t === 'h3');
  const withBanner = (sp) => sp.map((b) => (b[0] === 'image' ? ['image', 678] : b));
  const reset = async (sp) => {
    const content = await serialize(withBanner(sp), urls);
    await cap.eval((h) => { window.wp.data.dispatch('core/block-editor').resetBlocks(window.wp.blocks.parse(h)); }, content);
    await cap.eval(() => window.wp.data.dispatch('core/block-editor').clearSelectedBlock());
    await wait(1500);
  };
  await reset([...newSpec.slice(0, iPrices), ...oldSpec.slice(oPrices)]);
  await cap.capture('ed-details', { settle: 900 });
  await reset(newSpec);
  await cap.capture('ed-final', { settle: 1000 });
  cap.data.blocks = { details: newSpec.findIndex(([t, a]) => t === 'p' && /^スタンドバイ/.test(a)), periodBlock: 2 };

  // 公開 → 公開してもよいですか？ → 公開
  await realClick(cap, "return document.querySelector('.editor-post-publish-panel__toggle, .editor-post-publish-button__button');");
  await cap.settle('.editor-post-publish-panel', 30000);
  await wait(1500);
  await cap.capture('ed-prepub', { settle: 800 });
  await realClick(cap, "return document.querySelector('.editor-post-publish-panel .editor-post-publish-button, .editor-post-publish-panel__header-publish-button button');");
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.post-publish-panel__postpublish'))) break; }
  await wait(1500);
  await cap.capture('ed-published', { settle: 800 });
  cap.data.autoSlug = await cap.php("return get_post_field( 'post_name', $data );", newId);
  log('slug after publishing', decodeURIComponent(cap.data.autoSlug));
  // close the panel → the slug panel
  await realClick(cap, "return document.querySelector('.editor-post-publish-panel__header button[aria-label]');");
  await wait(1200);
  const slugToggle = "return document.querySelector('.editor-post-url__panel-toggle') || [...document.querySelectorAll('.editor-post-panel__row')].filter((r) => /スラッグ|リンク/.test(r.textContent)).map((r) => r.querySelector('button'))[0];";
  if (!(await realClick(cap, slugToggle))) throw new Error('no slug toggle');
  await cap.settle('.editor-post-url input, .editor-post-url__input input, .components-popover input', 20000);
  await wait(800);
  const SLUG_INPUT = '.editor-post-url__input input, .editor-post-url input, .components-popover input';
  log('slug popover', await cap.eval(() => { const p = document.querySelector('.components-popover input'); return p ? p.className + ' = ' + p.value : 'none'; }));
  await keepFocus(cap);
  await cap.capture('ed-slug', { settle: 600, inputs: [[SLUG_INPUT, 'slug']] });
  await wait(800);
  // (the capture's own focus / blur of the input may have closed the popover)
  if (!(await cap.eval(() => !!document.querySelector('.components-popover input')))) {
    await realClick(cap, slugToggle);
    await cap.settle('.components-popover input', 20000);
    await wait(600);
  }
  // スラッグ → campaign_202612 (typed into the real input), 保存
  await cap.type(SLUG_INPUT, 'campaign_202612');
  await key(cap, 'Tab');
  await wait(600);
  await key(cap, 'Escape');
  await wait(600);
  await realClick(cap, "return document.querySelector('.editor-post-publish-button, .editor-post-publish-button__button');");
  for (let i = 0; i < 40; i++) { await wait(500); if (await cap.eval(() => [...document.querySelectorAll('.components-snackbar')].some((x) => /更新/.test(x.textContent)))) break; }
  await wait(700);
  await cap.capture('ed-updated', { settle: 200 });
  cap.data.slug = await cap.php("return get_post_field( 'post_name', $data );", newId);
  log('slug', cap.data.slug);

  // WP Super Cache: 設定 › WP Super Cache › キャッシュを削除
  await cap.go('/wp-admin/options-general.php?page=wpsupercache', '#wpbody-content');
  await cap.capture('wpsc');
  const del = await realClick(cap, "return [...document.querySelectorAll('#wpbody-content input[type=\"submit\"], #wpbody-content button')].find((x) => /キャッシュを削除/.test(x.value || x.textContent));");
  log('delete cache button', del);
  if (del) { await wait(2500); await cap.settle('#wpbody-content'); }
  await cap.capture('wpsc-deleted');

  // the Customizer, 追加 CSS: before → the fixed buttons pasted → the PC rule typed → 公開
  await cap.go('/wp-admin/customize.php?autofocus[section]=custom_css', '#customize-controls');
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!(window.wp && wp.customize && wp.customize.control('custom_css') && wp.customize.control('custom_css').editor && wp.customize.control('custom_css').editor.codemirror))) break; }
  await wait(2500);
  const cm = (css, line) => cap.eval((css, line) => {
    const c = wp.customize.control('custom_css').editor.codemirror;
    if (css != null) c.setValue(css);
    c.scrollTo(null, c.heightAtLine(Math.max(0, line), 'local'));
    c.getInputField().blur();
    return c.lineCount();
  }, css, line);
  await cm(null, CSS.atLine - 14);
  await wait(1200);
  await cap.capture('cz', { settle: 600 });
  await cm(CSS.pasted, CSS.atLine - 14);
  await wait(1200);
  await cap.capture('cz-pasted', { settle: 600 });
  await cm(CSS.final, CSS.pcLine - 14);
  await wait(1200);
  await cap.capture('cz-final', { settle: 600 });
  await cap.eval(() => document.getElementById('save').click());
  for (let i = 0; i < 40; i++) { await wait(500); if (await cap.eval(() => wp.customize.state('saved').get())) break; }
  await wait(1500);
  await cap.capture('cz-saved', { settle: 600 });
  cap.data.css = { atLine: CSS.atLine, pcLine: CSS.pcLine, stickyLines: CSS.sticky.split('\n').length, pcLines: CSS.pc.split('\n').length, pc: CSS.pc };

  await cap.finish();
  postProcess();
  log('done');
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * after finish(): what tools/wp/playground.js does not rewrite
 *   - WordPress is in /wp, the site at the root: the page links (not wp-admin / wp-content / …) lose the /wp
 *   - the Playground's own host where WordPress prints it (Site Kit's site card, the canvas frame's blob address)
 *   - the block editor's relative time of the publish ("今日 1:36 AM", the capture's clock) → the video's (the video
 *     also sets it to the time it publishes at, at run time)
 * (node capture-wp.js --post re-applies it to the existing js/wp-snapshot.js)
 */
function postProcess() {
  const file = path.join(DIR, 'js', 'wp-snapshot.js');
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/https:\/\/stand-by\.jp\/wp\/(?!wp-|xmlrpc|index\.php|\?)/g, 'https://stand-by.jp/')
    .replace(/https:\/\/stand-by\.jp\/wp(?=["'<\s\\])/g, 'https://stand-by.jp')
    .replace(/#blob%3Ahttps%3A%2F%2Fwpsandbox\.wordpress\.net%2F[0-9a-f-]+/g, '')
    .replace(/wpsandbox\.wordpress\.net/g, 'stand-by.jp')
    .replace(/今日 \d{1,2}:\d{2} [AP]M/g, '今日 1:52 PM');
  fs.writeFileSync(file, s);
}
