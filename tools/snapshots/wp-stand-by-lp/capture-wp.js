/*
 * The real WordPress screens of the wp-stand-by-lp video, captured from WordPress itself (WordPress Playground via
 * tools/wp/playground.js) into public/videos/wp-stand-by-lp/js/wp-snapshot.js + assets/wp/.
 *
 *   node tools/snapshots/wp-stand-by-lp/capture-wp.js [shots folder]   → node tools/webp.js wp-stand-by-lp
 *
 * The site is set up like stand-by.jp (read from its public REST API, 2026-11-17):
 *   - WordPress (latest, Japanese), site title / tagline of the live site, WordPress in /wp (the screens show
 *     https://stand-by.jp/wp/wp-admin/… and the pages at https://stand-by.jp/<slug>)
 *   - the plugins its REST API shows: Yoast Duplicate Post, WP Super Cache, All-in-One WP Migration, Site Kit by Google
 *   - the theme "Stand by Beauty Clinic" (stand_by_beauty_clinic) with its real style.css header and screenshot.png;
 *     its PHP is a stand-in (the theme's source is not public) that registers the site's post types 症例 / コラム / FAQ
 *   - the 45 pages the live site had on the video's date (titles, slugs, parents, dates, the real ids), the October
 *     campaign page (442) with its real content and banner, the December banner (678) — the page duplicated on screen
 *     becomes 677, as on the live site
 *   - 追加 CSS: the live site's own, without the two parts the video adds (the fixed reservation buttons, and the rule
 *     that hides them on PC)
 * Then the screens, in the order of the video: login, dashboard, pages, Duplicate Post → the block editor (each step of
 * the edit), publishing, the URL (slug) panel, WP Super Cache, the Customizer's 追加 CSS (before, pasted, typed, saved).
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

(async () => {
  log('reading the live site (REST API) …');
  const pages = await get(`${LIVE}/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,title,date,modified,parent,menu_order,featured_media`, true);
  const site = await get(`${LIVE}/wp-json/`, true);
  const p442 = await get(`${LIVE}/wp-json/wp/v2/pages/442`, true);
  const p677 = await get(`${LIVE}/wp-json/wp/v2/pages/677`, true);
  const oldSpec = spec(p442.content.rendered), newSpec = spec(p677.content.rendered);
  const oldBanner = await get(`${LIVE}/wp/wp-content/uploads/2026/10/campaign_01.png`);
  const newBanner = await get(`${LIVE}/wp/wp-content/uploads/2026/11/2612-2701_______________________________.png`);
  const lineIcon = await get(`${LIVE}/wp/wp-content/uploads/2026/09/icons8-line-48.png`);
  const shot = await get(`${LIVE}/wp/wp-content/themes/${THEME}/screenshot.png`);
  // the live site's 追加 CSS (from its page source) without what the video adds
  const html = (await get(`${LIVE}/campaign_202612`)).toString();
  const liveCss = html.match(/<style id="wp-custom-css">([\s\S]*?)<\/style>/)[1].replace(/^\n+/, '');
  const CSS = window_css(liveCss);
  log(`pages ${pages.length}, old content ${oldSpec.length} blocks, new ${newSpec.length}, 追加CSS ${liveCss.length} chars`);

  const cap = await WPC.start({ id: ID, site: `${LIVE}/wp`, date: '2026-11-02', time: '13:34', shots: SHOTS, serverPath: '/home/standby/stand-by.jp/public_html/wp/wp-content/' });
  await cap.boot(WPC.blueprint({
    title: site.name,
    tagline: site.description,
    plugins: ['duplicate-post', 'wp-super-cache', 'all-in-one-wp-migration', 'google-site-kit'],
    options: { permalink_structure: '/%postname%/' },
  }));
  await cap.translations();

  // ---- the theme
  await cap.files(themeFiles());
  await cap.php(`file_put_contents( get_theme_root() . '/${THEME}/screenshot.png', base64_decode( $data ) ); switch_theme( '${THEME}' ); return get_stylesheet();`, shot.toString('base64'));

  // ---- media (the live ids and dates), the pages (live ids, slugs, parents, dates), the October campaign
  const MEDIA = `require_once ABSPATH . 'wp-admin/includes/image.php'; require_once ABSPATH . 'wp-admin/includes/file.php'; require_once ABSPATH . 'wp-admin/includes/media.php';
    $tmp = wp_tempnam( $data['name'] ); file_put_contents( $tmp, base64_decode( $data['b64'] ) );
    $id = media_handle_sideload( [ 'name' => $data['name'], 'tmp_name' => $tmp ], 0, $data['title'], [ 'import_id' => $data['id'], 'post_date' => $data['date'], 'post_date_gmt' => get_gmt_from_date( $data['date'] ) ] );
    if ( is_wp_error( $id ) ) throw new Exception( $id->get_error_message() ); return $id;`;
  const m627 = await cap.php(MEDIA, { id: 627, name: 'campaign_01.png', title: 'campaign_01', date: '2026-10-09 10:24:34', b64: oldBanner.toString('base64') });
  const mLine = await cap.php(MEDIA, { id: 593, name: 'icons8-line-48.png', title: 'icons8-line-48', date: '2026-09-24 16:12:05', b64: lineIcon.toString('base64') });
  log('media', m627, mLine);
  const list = pages.filter((p) => p.id !== 677).sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0));
  await cap.php(`foreach ( $data as $p ) {
      $id = wp_insert_post( [ 'import_id' => $p['id'], 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_parent' => $p['parent'], 'menu_order' => $p['menu_order'], 'post_date' => $p['date'], 'post_date_gmt' => get_gmt_from_date( $p['date'] ), 'post_content' => '' ] );
      $GLOBALS['wpdb']->update( $GLOBALS['wpdb']->posts, [ 'post_modified' => $p['modified'], 'post_modified_gmt' => get_gmt_from_date( $p['modified'] ) ], [ 'ID' => $id ] );
    } update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', 14 ); clean_post_cache( 14 ); return count( $data );`,
  list.map((p) => ({ id: p.id, slug: p.slug, title: p.title.rendered.replace(/&#8211;/g, '–').replace(/&amp;/g, '&'), parent: p.parent, menu_order: p.menu_order, date: p.date.replace('T', ' '), modified: p.modified.replace('T', ' ') })));
  // the next post becomes 677 (the duplicated page), the uploaded banner 678 — the ids of the live site
  await cap.php("wp_insert_post( [ 'import_id' => 676, 'post_type' => 'post', 'post_status' => 'auto-draft', 'post_title' => '自動下書き' ] ); return true;");
  // 追加 CSS before the video
  await cap.php(`wp_update_custom_css_post( $data, [ 'stylesheet' => '${THEME}' ] ); return true;`, CSS.before);
  // WP Super Cache on (as on the live site), no first-run notices; the block editor's welcome guide was closed long ago
  await cap.php(`if ( function_exists( 'wp_cache_enable' ) ) { wp_cache_enable(); } update_option( 'ossdl_off_cdn_url', home_url() );
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core/edit-post' => [ 'welcomeGuide' => false, 'welcomeGuideTemplate' => false ], 'core' => [ 'isComplementaryAreaVisible' => true, 'editorTool' => 'edit' ], '_modified' => gmdate( 'c' ) ] );
    update_user_meta( 1, 'show_admin_bar_front', 'false' ); return true;`);

  // the October page's real content, built with the block editor's own serializer (so the blocks are valid)
  async function serialize(sp, map) {
    return cap.eval((sp, map) => {
      const { createBlock, serialize: ser } = window.wp.blocks;
      return ser(sp.map(([t, a]) => {
        if (t === 'image') { const id = map[a] || a; return createBlock('core/image', { id, url: map.url[id], alt: '', sizeSlug: 'full', linkDestination: 'none' }); }
        if (t === 'h2' || t === 'h3') return createBlock('core/heading', { level: t === 'h2' ? 2 : 3, content: a });
        return createBlock('core/paragraph', { content: a });
      }));
    }, sp, map);
  }
  await cap.go('/wp-admin/post.php?post=442&action=edit', '.editor-post-title__input, iframe[name="editor-canvas"]');
  await wait(2500);
  const urls = await cap.php("return [ 627 => wp_get_attachment_url( 627 ) ];");
  const oldContent = await serialize(oldSpec, { url: urls });
  await cap.php("wp_update_post( [ 'ID' => 442, 'post_content' => $data ] ); set_post_thumbnail( 442, 627 ); $GLOBALS['wpdb']->update( $GLOBALS['wpdb']->posts, [ 'post_modified' => '2026-10-09 10:25:19', 'post_modified_gmt' => '2026-10-09 01:25:19' ], [ 'ID' => 442 ] ); return true;", oldContent);
  // the editor's lock / autosave of 442 must not stay behind
  await cap.php("delete_post_meta( 442, '_edit_lock' ); delete_post_meta( 442, '_edit_last' ); return true;");

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

  // Duplicate Post: 新規下書きとして複製 on the October campaign
  const dupHref = await cap.eval(() => { const a = document.querySelector('#post-442 .row-actions a[href*="duplicate_post_new_draft"], #post-442 .row-actions .edit_as_new_draft a'); return a && a.getAttribute('href'); });
  if (!dupHref) throw new Error('Duplicate Post: no 新規下書きとして複製 link');
  await cap.go('/wp-admin/' + dupHref.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), 'iframe[name="editor-canvas"]').catch(async () => cap.settle('iframe[name="editor-canvas"]'));
  await wait(4000);
  const newId = await cap.eval(() => window.wp.data.select('core/editor').getCurrentPostId());
  log('duplicated as', newId);
  cap.data.page = newId;
  const ready = () => cap.eval(() => { const f = document.querySelector('iframe[name="editor-canvas"]'); return !!(f && f.contentDocument && f.contentDocument.querySelector('.editor-post-title__input')); });
  for (let i = 0; i < 40 && !(await ready()); i++) await wait(500);
  await cap.eval(() => { window.wp.data.dispatch('core/block-editor').clearSelectedBlock(); });
  await wait(800);
  await cap.capture('ed-dup', { settle: 1200 });

  // the title (typed on screen), then the banner: select the image block → 置換
  const NEW_TITLE = p677.title.rendered;
  await cap.eval((t) => window.wp.data.dispatch('core/editor').editPost({ title: t }), NEW_TITLE);
  const imgId = await cap.eval(() => window.wp.data.select('core/block-editor').getBlocks().find((b) => b.name === 'core/image').clientId);
  await cap.eval((c) => window.wp.data.dispatch('core/block-editor').selectBlock(c), imgId);
  await wait(1500);
  await cap.capture('ed-imgsel', { settle: 800 });
  const replace = await cap.eval(() => { const b = [...document.querySelectorAll('.block-editor-block-toolbar button, .block-editor-block-contextual-toolbar button')].find((x) => /置換/.test(x.textContent)); if (b) { b.click(); return true; } return false; });
  if (!replace) throw new Error('no 置換 button');
  await wait(1200);
  await cap.capture('ed-replace', { settle: 600 });
  // アップロード → the December banner (678, as on the live site) replaces the image
  const m678 = await cap.php(MEDIA, { id: 678, name: '2612-2701_______________________________.png', title: '2612-2701_______________________________', date: '2026-11-02 13:33:20', b64: newBanner.toString('base64') });
  log('banner', m678);
  urls[678] = await cap.php('return wp_get_attachment_url( 678 );');
  await cap.eval(() => document.activeElement && document.activeElement.blur());
  await cap.eval(() => { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  await cap.eval((c, url) => window.wp.data.dispatch('core/block-editor').updateBlockAttributes(c, { id: 678, url, alt: '' }), imgId, urls[678]);
  await cap.eval(() => window.wp.data.dispatch('core/block-editor').clearSelectedBlock());
  await wait(1500);
  await cap.capture('ed-banner', { settle: 800 });

  // アイキャッチ画像 → the media library (the new banner selected)
  const featBtn = await cap.eval(() => { const b = document.querySelector('.editor-post-featured-image__preview, .editor-post-featured-image__toggle, .editor-post-featured-image button'); if (b) { b.click(); return true; } return false; });
  if (!featBtn) throw new Error('no featured image button');
  await cap.settle('.media-modal .attachments .attachment', 60000);
  await wait(2500);
  await cap.eval(() => { const a = document.querySelector('.media-modal .attachment[data-id="678"]'); if (a) a.click(); });
  await wait(1500);
  await cap.capture('ed-feat-modal', { settle: 600 });
  await cap.eval(() => { const b = document.querySelector('.media-modal .media-button-select'); if (b) b.click(); });
  await wait(1500);

  // the period (typed on screen), then the details and the prices (pasted on screen) → the December content
  const NEW_MAP = { url: urls };
  const newContent = await serialize(newSpec, NEW_MAP);
  await cap.eval((html) => { const { parse } = window.wp.blocks; window.wp.data.dispatch('core/block-editor').resetBlocks(parse(html)); }, newContent);
  await cap.eval(() => window.wp.data.dispatch('core/block-editor').clearSelectedBlock());
  await wait(1800);
  await cap.capture('ed-final', { settle: 1000 });
  cap.data.periodIndex = newSpec.findIndex(([t]) => t === 'p');

  // 公開 → 公開してもよいですか？ → 公開
  await cap.eval(() => { const b = document.querySelector('.editor-post-publish-panel__toggle, .editor-post-publish-button__button'); b.click(); });
  await cap.settle('.editor-post-publish-panel', 30000);
  await wait(1500);
  await cap.capture('ed-prepub', { settle: 800 });
  await cap.eval(() => { const b = document.querySelector('.editor-post-publish-panel .editor-post-publish-button, .editor-post-publish-panel__header-publish-button button'); b.click(); });
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.post-publish-panel__postpublish'))) break; }
  await wait(1500);
  await cap.capture('ed-published', { settle: 800 });
  cap.data.autoSlug = await cap.php("return get_post_field( 'post_name', $data );", newId);
  // close the panel → the page's URL panel (スラッグ)
  await cap.eval(() => { const b = document.querySelector('.editor-post-publish-panel__header button[aria-label]'); if (b) b.click(); });
  await wait(1200);
  const linkBtn = await cap.eval(() => { const b = document.querySelector('.editor-post-url__panel-toggle, .editor-post-url__panel-dropdown button'); if (b) { b.click(); return true; } return false; });
  if (!linkBtn) throw new Error('no URL panel toggle');
  await cap.settle('.editor-post-url input, .editor-post-url__input input', 20000);
  await wait(800);
  await cap.capture('ed-slug', { settle: 600, inputs: [['.editor-post-url input, .editor-post-url__input input', 'slug']] });
  // スラッグ → campaign_202612, 保存
  await cap.php("wp_update_post( [ 'ID' => $data, 'post_name' => 'campaign_202612' ] ); return true;", newId);
  await cap.go(`/wp-admin/post.php?post=${newId}&action=edit`, 'iframe[name="editor-canvas"]');
  await wait(3500);
  await cap.eval(() => { const b = document.querySelector('.editor-post-url__panel-toggle, .editor-post-url__panel-dropdown button'); if (b) b.click(); });
  await wait(1000);
  await cap.eval(() => { window.wp.data.dispatch('core/notices').createSuccessNotice('固定ページを更新しました。', { type: 'snackbar', id: 'editor-save', actions: [{ label: '固定ページを表示', url: window.wp.data.select('core/editor').getPermalink() }] }); });
  await wait(900);
  await cap.capture('ed-updated', { settle: 300, inputs: [['.editor-post-url input, .editor-post-url__input input', 'slug']] });

  // WP Super Cache: 設定 › WP Super Cache › キャッシュを削除
  await cap.go('/wp-admin/options-general.php?page=wpsupercache', '#wpbody-content');
  await cap.capture('wpsc');
  const del = await cap.eval(() => { const b = [...document.querySelectorAll('#wpbody-content input[type="submit"], #wpbody-content button')].find((x) => /キャッシュを削除|Delete Cache/i.test(x.value || x.textContent)); if (b) { setTimeout(() => b.click(), 0); return true; } return false; });
  log('delete cache button', del);
  if (del) { await wait(2500); await cap.settle('#wpbody-content'); }
  await cap.capture('wpsc-deleted');

  // the Customizer, 追加 CSS: before → the fixed buttons pasted → the PC rule typed → 公開
  await cap.go('/wp-admin/customize.php?autofocus[section]=custom_css', '#customize-controls');
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!(window.wp && wp.customize && wp.customize.control('custom_css') && wp.customize.control('custom_css').editor && wp.customize.control('custom_css').editor.codemirror))) break; }
  await wait(2500);
  const cmSet = (css, line) => cap.eval((css, line) => {
    const cm = wp.customize.control('custom_css').editor.codemirror;
    if (css != null) cm.setValue(css);
    cm.scrollIntoView({ line, ch: 0 }, 260);
    cm.getInputField().blur();
    return cm.lineCount();
  }, css, line);
  await cmSet(null, CSS.atLine - 16);
  await wait(1200);
  await cap.capture('cz', { settle: 600 });
  await cmSet(CSS.pasted, CSS.atLine - 6);
  await wait(1200);
  await cap.capture('cz-pasted', { settle: 600 });
  await cmSet(CSS.final, CSS.pcLine - 10);
  await wait(1200);
  await cap.capture('cz-final', { settle: 600 });
  await cap.eval(() => { document.getElementById('save').click(); });
  for (let i = 0; i < 40; i++) { await wait(500); if (await cap.eval(() => wp.customize.state('saved').get())) break; }
  await wait(1500);
  await cap.capture('cz-saved', { settle: 600 });
  cap.data.css = { atLine: CSS.atLine, pcLine: CSS.pcLine, stickyLines: CSS.sticky.split('\n').length, pcLines: CSS.pc.split('\n').length };

  const out = await cap.finish();
  // WordPress is in /wp, the site at the root: the page links (not wp-admin / wp-content / …) lose the /wp
  const file = path.join(DIR, 'js', 'wp-snapshot.js');
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/https:\/\/stand-by\.jp\/wp\/(?!wp-|xmlrpc|index\.php|\?)/g, 'https://stand-by.jp/').replace(/https:\/\/stand-by\.jp\/wp(?=["'<\s\\])/g, 'https://stand-by.jp')
    .replace(/https:\\\/\\\/stand-by\.jp\\\/wp\\\/(?!wp-|xmlrpc|index\.php|\?)/g, 'https:\\/\\/stand-by.jp\\/');
  fs.writeFileSync(file, s);
  log('done', Object.keys(out.pages).join(' '));
})().catch((e) => { console.error(e); process.exit(1); });

/** the live 追加 CSS → before (without the fixed reservation buttons and the PC rule), pasted, final */
function window_css(live) {
  const lines = live.split('\n');
  const find = (re, from = 0) => { const i = lines.findIndex((l, k) => k >= from && re.test(l)); if (i < 0) throw new Error('CSS: ' + re); return i; };
  const s0 = find(/^\/\* 画面下部に固定する枠 \*\//);
  const s1 = find(/^\.green-reserve-btn\.line-btn \.sub-text-frame \{/, s0);
  const s1e = find(/^\}/, s1);
  const p0 = find(/^\/\* PC版（画面幅768px以上）ではフッター固定ボタンを非表示にする \*\//);
  const p1e = find(/^\}/, find(/^\s+display: none !important;/, p0) + 1);
  const sticky = lines.slice(s0, s1e + 1).join('\n');
  const pc = lines.slice(p0, p1e + 1).join('\n');
  const rest = lines.filter((l, k) => !(k >= s0 && k <= s1e) && !(k >= p0 && k <= p1e));
  // where the block goes: where it is on the live site (after the case-card rule); the PC rule right after it
  const at = rest.findIndex((l) => /^\/\* 症例カード枠の背景色を白にする \*\//.test(l));
  const atEnd = rest.findIndex((l, k) => k > at && /^\}/.test(l)) + 1;
  const before = rest.join('\n');
  const pastedLines = [...rest.slice(0, atEnd), '', ...sticky.split('\n'), ...rest.slice(atEnd)];
  const finalLines = [...rest.slice(0, atEnd), '', ...sticky.split('\n'), '', ...pc.split('\n'), ...rest.slice(atEnd)];
  return { before, pasted: pastedLines.join('\n'), final: finalLines.join('\n'), sticky, pc, atLine: atEnd + 1, pcLine: atEnd + 1 + sticky.split('\n').length + 1 };
}
