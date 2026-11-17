/*
 * The real WordPress screens of the wp-cookpad-media video, captured from WordPress itself (tools/wp/playground.js:
 * WordPress Playground — real WordPress + PHP in the browser, Japanese, no account).
 *
 *   node tools/snapshots/wp-cookpad-media/capture-wp.js [screenshot folder]   → node tools/webp.js wp-cookpad-media
 *
 * The site is set up like the video's wp-env (http://localhost:8888): site title クックパッド株式会社 and tagline
 * 毎日の料理を楽しみにする (the live RSS feed's channel), the theme "cookpad-info" written from the files the video shows
 * (public/videos/wp-cookpad-media/js/files.js), Advanced Custom Fields from wordpress.org (with its Japanese language
 * pack), as in the video's .wp-env.json. The theme's files change between the screens as they do in the video:
 *   1  no おしらせ yet → inc/post-types.php with the post type pr_news without show_in_rest (WordPress opens the
 *      classic editor for it) → with show_in_rest (the block editor); 設定 › パーマリンク saved through its form
 *   2  + the taxonomy pr_news_category: リリース / お知らせ / 出版 added through the real form (their slugs become the
 *      URL-encoded names, as WordPress does), then fixed one by one through クイック編集 (release / announce / publish)
 *   3  + inc/fields.php (the ACF field 外部リンク); the 882 おしらせ of the live list imported (js/news-data.js — the
 *      same rows as the video's data/news.csv; title, date, category, slug, 外部リンク; no images, no bodies but the
 *      one article the video shows); the 2026-11-11 article written in the block editor (title, category, the live
 *      list's image as アイキャッチ画像, 外部リンク, the date) and scheduled through 予約投稿
 * The post is scheduled for 2026-12-11 15:00 (a date after the capture day, so that WordPress schedules it) and the
 * texts are turned into 2026-11-11 afterwards (fixDates) — the video's day is 2026-11-06.
 * Changed for the demo (tools/wp/playground.js): the Playground address → http://localhost:8888, the capture date →
 * 2026-11-06 (the video's clock), the text boxes the video types into → look-alike boxes.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const WPC = require(path.join(ROOT, 'tools/wp/playground'));
const ID = 'wp-cookpad-media';
const DIR = path.join(ROOT, 'public/videos', ID);
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const { log, wait } = WPC;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

// the video's own files and data
const W = {};
new Function('window', fs.readFileSync(path.join(DIR, 'js/news-data.js'), 'utf8'))(W);
new Function('window', fs.readFileSync(path.join(DIR, 'js/files.js'), 'utf8'))(W);
const FL = W.FILES, T = FL.T, ROWS = W.NEWS_DATA, NEXT = W.NEWS_NEXT;
const SCHEDULE = '2026-12-11T15:00:00';

/** the scheduled date (after the capture day) → the article's real date, 2026-11-11 */
function fixDates(txt) {
  return txt.split('2026年12月11日').join('2026年11月11日').split('2026/12/11').join('2026/11/11').split('2026-12-11').join('2026-11-11')
    .split('12月11日').join('11月11日')
    // the permalink screen's examples use WordPress' own clock (UTC: the day before the capture day in Japan)
    .split('2026/11/17/').join('2026/11/06/').split('/2026/11/17').join('/2026/11/06');
}
if (process.argv.includes('--fix-dates')) {
  const f = path.join(DIR, 'js', 'wp-snapshot.js');
  fs.writeFileSync(f, fixDates(fs.readFileSync(f, 'utf8')));
  log('fixed the scheduled date in', path.relative(ROOT, f));
  process.exit(0);
}

const themeAt = (stage) => {
  // the theme files as they are at each stage (the rest of the theme is installed at the start)
  const files = { [T + 'functions.php']: FL.FN() };
  if (stage >= 1) { files[T + 'functions.php'] = FL.FN(FL.FN_PT); files[T + 'inc/post-types.php'] = FL.ptWith(stage >= 1.5, stage >= 2); }
  if (stage >= 3) { files[T + 'functions.php'] = FL.FN(FL.FN_PT, FL.FN_FIELDS); files[T + 'inc/fields.php'] = FL.files[T + 'inc/fields.php']; }
  return files;
};

(async () => {
  const cap = await WPC.start({ id: ID, site: 'http://localhost:8888', date: '2026-11-06', time: '13:40', shots: SHOTS, serverPath: '/var/www/html/wp-content/' });
  await cap.boot(WPC.blueprint({ title: 'クックパッド株式会社', tagline: '毎日の料理を楽しみにする', themes: ['twentytwentyfive'], plugins: ['advanced-custom-fields'] }));
  await cap.translations();

  // the theme (without the おしらせ parts the video writes), active; sample content removed; editor preferences
  const base = Object.fromEntries(Object.entries(FL.files).filter(([k]) => k.startsWith(T) && !/inc\/(post-types|fields|news)\.php$|archive-pr_news|single-pr_news|taxonomy-pr_news|template-parts\/news\//.test(k)));
  await cap.files({ ...base, ...themeAt(0) });
  await cap.php(`
    switch_theme( 'cookpad-info' );
    wp_delete_post( 1, true ); wp_delete_post( 2, true );
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core' => [ 'welcomeGuide' => false, 'isComplementaryAreaVisible' => true, 'enableChoosePatternModal' => false ], 'core/edit-post' => [ 'welcomeGuide' => false ], '_modified' => gmdate( 'c' ) ] );
    update_user_meta( 1, 'show_welcome_panel', 0 );
    return get_stylesheet();`);

  /* ---------------------------------------------------------------- 1. the post type */
  await cap.go('/wp-admin/', '#wpadminbar');
  await cap.capture('dashboard');
  await cap.files(themeAt(1));
  await cap.go('/wp-admin/', '#menu-posts-pr_news');
  await cap.capture('dashboard-news');
  await cap.go('/wp-admin/post-new.php?post_type=pr_news', '#post');
  await cap.capture('news-classic');
  await cap.files(themeAt(1.5));
  await cap.go('/wp-admin/post-new.php?post_type=pr_news', 'iframe[name="editor-canvas"]');
  await wait(4000);
  await cap.capture('news-block', { settle: 1500 });
  await cap.go('/wp-admin/options-permalink.php', '#submit');
  await cap.capture('permalink');
  await cap.eval(() => { setTimeout(() => document.querySelector('#submit').click(), 0); });
  await wait(1500);
  await cap.settle('#submit');
  await cap.capture('permalink-saved');

  /* ---------------------------------------------------------------- 2. the categories */
  await cap.files(themeAt(2));
  const TERMS = '/wp-admin/edit-tags.php?taxonomy=pr_news_category&post_type=pr_news';
  await cap.go(TERMS, '#addtag');
  await cap.capture('terms', { inputs: [['#tag-name', 'name'], ['#tag-slug', 'slug']] });
  for (const name of ['リリース', 'お知らせ', '出版']) {
    const n0 = await cap.eval(() => document.querySelectorAll('#the-list tr[id^="tag-"]').length);
    await cap.type('#tag-name', name);
    await cap.eval(() => document.querySelector('#submit').click());
    for (let i = 0; i < 40; i++) { await wait(500); if (await cap.eval((n) => document.querySelectorAll('#the-list tr[id^="tag-"]').length > n && !document.querySelector('#addtag .spinner.is-active'), n0)) break; }
    await wait(800);
  }
  await cap.capture('terms-added', { inputs: [['#tag-name', 'name'], ['#tag-slug', 'slug']] });
  const terms = await cap.php("$r = []; foreach ( get_terms( [ 'taxonomy' => 'pr_news_category', 'hide_empty' => false ] ) as $t ) $r[ $t->name ] = [ 'id' => $t->term_id, 'slug' => $t->slug ]; return $r;");
  log('terms', JSON.stringify(terms));
  cap.data.terms = terms;
  // クイック編集: 出版 → publish, お知らせ → announce, リリース → release
  for (const [i, [name, slug]] of [['出版', 'publish'], ['お知らせ', 'announce'], ['リリース', 'release']].entries()) {
    const id = terms[name].id;
    await cap.eval((tid) => document.querySelector(`#tag-${tid} button.editinline, #tag-${tid} .editinline`).click(), id);
    await wait(1000);
    await cap.capture('terms-qe' + (i + 1), { inputs: [['.inline-edit-row input[name="slug"]', 'slug']], settle: 600 });
    await cap.type('.inline-edit-row input[name="slug"]', slug);
    await cap.eval(() => document.querySelector('.inline-edit-row .save, .inline-edit-row button.save').click());
    for (let k = 0; k < 40; k++) { await wait(500); if (await cap.eval((tid) => !!document.querySelector(`#tag-${tid}`) && !document.querySelector('.inline-edit-row:not([style*="none"]) input[name="slug"]'), id)) break; }
    await wait(1000);
  }
  await cap.capture('terms-fixed');
  log('slugs', JSON.stringify(await cap.php("return wp_list_pluck( get_terms( [ 'taxonomy' => 'pr_news_category', 'hide_empty' => false ] ), 'slug', 'name' );")));

  /* ---------------------------------------------------------------- 3. ACF, the import, the 2026-11-11 article */
  await cap.files(themeAt(3));
  // the import (as scripts/import-news.php: oldest first, so the IDs grow with the dates)
  const rows = [...ROWS].reverse();
  for (let i = 0; i < rows.length; i += 120) {
    const n = await cap.php(`
      $n = 0;
      foreach ( $data as $r ) {
        $id = wp_insert_post( [ 'post_type' => 'pr_news', 'post_status' => 'publish', 'post_title' => $r['title'], 'post_name' => $r['slug'], 'post_content' => $r['body'], 'post_date' => $r['date'] . ' 10:00:00' ], true );
        if ( is_wp_error( $id ) ) continue;
        wp_set_object_terms( $id, $r['category'], 'pr_news_category' );
        if ( $r['url'] ) update_field( 'news_url', $r['url'], $id );
        $n++;
      }
      return $n;`, rows.slice(i, i + 120));
    log('imported', i + n);
  }
  const ids = await cap.php(`
    $q = new WP_Query( [ 'post_type' => 'pr_news', 'posts_per_page' => 12, 'orderby' => 'date', 'order' => 'DESC' ] );
    return array_map( fn( $p ) => [ 'id' => $p->ID, 'title' => $p->post_title, 'slug' => $p->post_name, 'url' => get_field( 'news_url', $p->ID ) ], $q->posts );`);
  cap.data.latest = ids;
  cap.data.counts = await cap.php("return wp_list_pluck( get_terms( [ 'taxonomy' => 'pr_news_category', 'hide_empty' => false ] ), 'count', 'slug' );");
  log('latest', JSON.stringify(ids.slice(0, 3)), JSON.stringify(cap.data.counts));
  await cap.go('/wp-admin/edit.php?post_type=pr_news', '.wp-list-table');
  await cap.capture('news-list');

  // the image of the 2026-11-11 article (the live list's)
  const img = Buffer.from(await (await fetch('https://info.cookpad.com' + NEXT.image, { headers: { 'user-agent': UA } })).arrayBuffer());
  const mediaId = await cap.media(path.basename(NEXT.image), img, path.parse(NEXT.image).name);
  log('media', mediaId, img.length);
  cap.data.media = mediaId;

  await cap.go('/wp-admin/post-new.php?post_type=pr_news', 'iframe[name="editor-canvas"]');
  await wait(5000);
  const URL_INPUT = '#acf-field_cp_news_url';
  // the category panel open (as the editor keeps it for this user once opened)
  await cap.eval(() => { const b = [...document.querySelectorAll('.components-panel__body-toggle')].find((x) => /カテゴリー/.test(x.textContent)); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
  await wait(1200);
  await cap.capture('news-new', { inputs: [[URL_INPUT, 'url']], settle: 1500 });
  // title, category 出版 (as typed / ticked in the video), then the featured image through the media modal
  await cap.eval((o) => {
    wp.data.dispatch('core/editor').editPost({ title: o.title, pr_news_category: [o.term] });
  }, { title: NEXT.title, term: terms['出版'].id });
  await wait(1500);
  await cap.eval(() => document.querySelector('.editor-post-featured-image__toggle, .editor-post-featured-image button').click());
  for (let i = 0; i < 30; i++) {
    await wait(500);
    const st = await cap.eval(() => ({ att: !!document.querySelector('.media-modal .attachments .attachment'), modal: !!document.querySelector('.media-modal'), browse: !!document.querySelector('.media-modal #menu-item-browse:not(.active)') }));
    if (st.att) break;
    if (st.browse) await cap.eval(() => document.querySelector('.media-modal #menu-item-browse').click());
    if (i === 29) log('media modal:', JSON.stringify(st));
  }
  await wait(1500);
  await cap.eval((mid) => { const li = document.querySelector(`.media-modal .attachment[data-id="${mid}"]`) || document.querySelector('.media-modal .attachment'); li.querySelector('.attachment-preview, .thumbnail').click(); }, mediaId);
  await wait(1500);
  await cap.capture('news-media', { settle: 1000 });
  await cap.eval(() => document.querySelector('.media-modal .media-button-select').click());
  await wait(2500);
  await cap.capture('news-thumb', { inputs: [[URL_INPUT, 'url']], settle: 1200 });
  // 外部リンク, the date (scheduled)
  await cap.eval((o) => {
    const inp = document.querySelector(o.sel);
    inp.value = o.url; inp.setAttribute('value', o.url);
    inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
    wp.data.dispatch('core/editor').editPost({ date: o.date });
  }, { sel: URL_INPUT, url: NEXT.link, date: SCHEDULE });
  await wait(2000);
  await cap.capture('news-date', { settle: 1000 });
  await cap.eval(() => document.querySelector('.editor-post-publish-panel__toggle').click());
  await wait(2500);
  await cap.capture('news-prepublish', { settle: 1000 });
  await cap.eval(() => document.querySelector('.editor-post-publish-panel .editor-post-publish-button').click());
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.post-publish-panel__postpublish'))) break; }
  await wait(4000);   // (the meta boxes — ACF — are saved after the post)
  const postId = await cap.eval(() => wp.data.select('core/editor').getCurrentPostId());
  cap.data.post = { id: postId, ...(await cap.php("$p = get_post( (int) $data ); return [ 'status' => $p->post_status, 'date' => $p->post_date, 'slug' => $p->post_name, 'url' => get_field( 'news_url', $p->ID ), 'thumb' => get_post_thumbnail_id( $p ), 'terms' => wp_list_pluck( wp_get_post_terms( $p->ID, 'pr_news_category' ), 'slug' ) ];", postId)) };
  log('post', JSON.stringify(cap.data.post));
  await cap.capture('news-scheduled', { settle: 1000 });
  await cap.go('/wp-admin/edit.php?post_type=pr_news', '.wp-list-table');
  await cap.capture('news-list2');

  await cap.finish();
  const file = path.join(DIR, 'js', 'wp-snapshot.js');
  fs.writeFileSync(file, fixDates(fs.readFileSync(file, 'utf8')));
  log('fixed the scheduled date (2026-12-11 → 2026-11-11)');
})().catch((e) => { console.error(e); process.exit(1); });
