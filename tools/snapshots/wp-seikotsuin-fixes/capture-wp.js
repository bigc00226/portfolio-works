/*
 * The REAL WordPress screens of the video (はらいろ整骨院's wp-admin), captured from WordPress itself with
 * tools/wp/playground.js (WordPress Playground: real WordPress in the browser, no account):
 *
 *   node tools/snapshots/wp-seikotsuin-fixes/capture-wp.js   → node tools/webp.js wp-seikotsuin-fixes
 *
 * Set up like the live site (https://harairo.com, WordPress in /wp/): site name 朝霞市 はらいろ整骨院, Japanese,
 * the plugins the live site loads that are on wordpress.org (All in One SEO, Contact Form 7, Redirection for Contact
 * Form 7, WP Statistics — with their Japanese language packs), the theme with the live site's folder name
 * harairoSeikotsuinWp (screenshot = the live site's first view), the live site's fixed pages and its 24 latest topics
 * (titles, dates and categories as listed on https://harairo.com/topics/), and All in One SEO's home page title /
 * description as the live site shows them — the description at first without the sentence the video adds.
 * Screens: wp-login.php, the dashboard, All in One SEO > 検索の外観 (before / after the description is changed).
 * Changed for the demo: the Playground address → https://harairo.com/wp (the preview line of All in One SEO →
 * https://harairo.com), the capture date → the video's (2026-10-30).
 */
const fs = require('fs');
const path = require('path');
const WPC = require('../../wp/playground');

const ID = 'wp-seikotsuin-fixes';
const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos', ID);
const SHOTS = process.env.WP_SHOTS || null;
const LIVE = 'https://harairo.com';
const DESC_AFTER = 'はらいろ整骨院は朝霞駅南口から徒歩10分、夜8時まで営業。保険治療、交通事故治療、労災治療にも対応しています。骨盤矯正・肩こり＆頭痛、慢性的な腰痛や痺れなどお客様一人ひとりの状態を把握してから痛みや不調の原因を根本的に改善できる治療を提案させていただきます。酸素カプセルもご利用いただけます。';
const ADDED = '酸素カプセルもご利用いただけます。';
const DESC_BEFORE = DESC_AFTER.slice(0, -ADDED.length);
// https://harairo.com/topics/ (pages 1–2), newest first: [date, slug, category, title]
const TOPICS = [
  ['2026-10-19', 'topics-178', 'news', '11月のお知らせ'], ['2026-09-29', 'topics-175', 'news', '10月のお知らせ'], ['2026-08-25', 'topics-172', 'news', '9月のお知らせ'],
  ['2026-08-07', 'topics-168', 'news', '8月のお知らせ'], ['2026-06-30', 'topics-164', 'news', '7月のお知らせ'], ['2026-06-30', 'topics-161', 'news', '【保険施術に関するお知らせ】'],
  ['2026-06-19', 'topics-157', 'news', '6月のお知らせ'], ['2026-04-29', 'topics-154', 'news', '5月のお知らせ'], ['2026-04-24', 'topics-151', 'news', '2026年/ゴールデンウイークの日程'],
  ['2026-04-04', 'topics-148', 'news', '4月のお知らせ'], ['2026-02-26', 'topics-145', 'news', '3月のお知らせ'], ['2026-02-26', 'topics-143', 'news', '2/26(木)'],
  ['2026-01-07', 'topics-140', 'news', '令和８年１月のお知らせ'], ['2025-11-27', 'topics-136', 'news', '12月のお知らせ'], ['2025-11-10', 'topics-133', 'news', '11月のお知らせ'],
  ['2025-10-05', 'topics-130', 'news', '10月のお知らせ'], ['2025-09-01', 'topics-128', 'news', '９月のお知らせ'], ['2025-07-22', 'topics-114', 'news', '８月のお知らせ'],
  ['2025-07-08', 'topics-105', 'information', '骨盤・姿勢矯正 ■側彎症に対する施術の仕方'], ['2025-06-30', 'topics-102', 'news', '７月のお知らせ'],
  ['2025-06-11', 'topics-98', 'voice', '口コミ 30代 女性'], ['2025-06-11', 'topics-94', 'voice', '口コミ 40代 男性'], ['2025-06-11', 'topics-92', 'information', '当院の手技療法について'],
  ['2025-05-31', 'topics-89', 'news', '６月のお知らせ'],
];
const CATS = { news: ['トピックス', 'topics-news'], information: ['治療内容のご案内', 'topics-information'], voice: ['患者様の声', 'topics-voice'] };
const PAGES = [['ホーム', 'home'], ['当院について', 'about'], ['施術メニュー', 'menu'], ['トピックス', 'topics'], ['お問い合わせ', 'contact'], ['個人情報保護方針', 'privacy']];

/** the theme's screenshot.png: the live site's first view at 1200×900 */
async function themeShot(browser) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1200, height: 900 });
  await p.goto(LIVE + '/', { waitUntil: 'networkidle2', timeout: 90000 });
  await WPC.wait(2500);
  const png = await p.screenshot({ type: 'png' });
  await p.close();
  return png;
}

/** cap.php() with a retry: a request made while the screen is still loading can fail with "Failed to fetch" */
async function php(cap, code, data) {
  for (let i = 0; ; i++) {
    try { return await cap.php(code, data); } catch (e) { if (i >= 5 || !/Failed to fetch|destroyed|detached/i.test(e.message)) throw e; await WPC.wait(2000); }
  }
}

(async () => {
  const cap = await WPC.start({ id: ID, site: LIVE + '/wp', date: '2026-10-30', time: '14:31', shots: SHOTS, serverPath: '/home/harairo/harairo.com/public_html/wp/wp-content/' });
  const shot = await themeShot(cap.browser);
  await cap.boot(WPC.blueprint({
    title: '朝霞市 はらいろ整骨院', tagline: '',
    plugins: ['all-in-one-seo-pack', 'contact-form-7', 'wpcf7-redirect', 'wp-statistics'],
    options: { show_on_front: 'page' },
  }));
  await cap.translations();
  // the theme (its folder name on the live site)
  const T = 'wp-content/themes/harairoSeikotsuinWp/';
  await cap.files({
    [T + 'style.css']: '/*\nTheme Name: harairoSeikotsuinWp\nDescription: 朝霞市 はらいろ整骨院\nVersion: 1.4.2\nText Domain: harairo\n*/\n',
    [T + 'index.php']: "<?php get_header(); while ( have_posts() ) { the_post(); the_content(); } get_footer();\n",
    [T + 'functions.php']: "<?php\nadd_theme_support( 'title-tag' );\nadd_theme_support( 'post-thumbnails' );\n",
  });
  await cap.php("file_put_contents( WP_CONTENT_DIR . '/themes/harairoSeikotsuinWp/screenshot.png', base64_decode( $data ) ); switch_theme( 'harairoSeikotsuinWp' ); return get_stylesheet();", shot.toString('base64'));
  // pages, categories, topics
  const ids = await cap.php(`$out = []; foreach ( $data['pages'] as $p ) { $out[ $p[1] ] = wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p[0], 'post_name' => $p[1], 'post_date' => '2025-03-01 10:00:00' ] ); }
    update_option( 'page_on_front', $out['home'] ); update_option( 'page_for_posts', $out['topics'] );
    wp_delete_post( 1, true ); wp_delete_post( 2, true ); wp_delete_post( 3, true );
    $cat = []; foreach ( $data['cats'] as $k => $c ) { $t = wp_insert_term( $c[0], 'category', [ 'slug' => $c[1] ] ); $cat[ $k ] = is_wp_error( $t ) ? 1 : $t['term_id']; }
    wp_update_term( 1, 'category', [ 'name' => 'その他', 'slug' => 'other' ] );
    foreach ( $data['topics'] as $t ) wp_insert_post( [ 'post_status' => 'publish', 'post_title' => $t[3], 'post_name' => $t[1], 'post_date' => $t[0] . ' 10:00:00', 'post_category' => [ $cat[ $t[2] ] ], 'post_content' => '<!-- wp:paragraph --><p>よろしくお願いいたします</p><!-- /wp:paragraph -->' ] );
    return $out;`, { pages: PAGES, cats: CATS, topics: TOPICS });
  // All in One SEO: the home page title / description as the live site shows them (before the change); no setup wizard
  await cap.php(`delete_transient( 'aioseo_activation_redirect' ); update_option( 'aioseo_setup_wizard_completed', true );
    $o = aioseo()->options; $o->searchAppearance->global->separator = '-';
    $o->searchAppearance->global->siteTitle = 'はらいろ整骨院 朝霞市';
    // the live pages share one description: the default of the post type 固定ページ (privacy has its own)
    aioseo()->dynamicOptions->searchAppearance->postTypes->page->metaDescription = $data;
    return aioseo()->dynamicOptions->searchAppearance->postTypes->page->metaDescription;`, DESC_BEFORE);
  cap.data = { pages: ids, desc: { before: DESC_BEFORE, after: DESC_AFTER, added: ADDED } };

  // ---- the login screen (the video logs in), the dashboard
  await cap.logout();
  await cap.capture('login', { inputs: [['#user_login', 'user'], ['#user_pass', 'pass']] });
  await cap.login();
  await cap.go('/wp-admin/', '#dashboard-widgets');
  // a site in use for years: the welcome panel was dismissed long ago, and All in One SEO's setup checklist box is
  // switched off in 表示オプション (the site is set up)
  const boxes = await cap.eval(() => [...document.querySelectorAll('#dashboard-widgets .postbox')].map((b) => b.id));
  const hide = boxes.filter((b) => /aioseo/.test(b));
  await WPC.wait(3000);
  await php(cap, "update_user_meta( 1, 'show_welcome_panel', 0 ); update_user_meta( 1, 'metaboxhidden_dashboard', $data ); return true;", hide);
  await cap.go('/wp-admin/', '#dashboard-widgets');
  await WPC.wait(2500);
  console.log('dashboard boxes', boxes.join(' '), 'hidden', hide.join(' '));
  await cap.capture('dashboard');
  // the All in One SEO menu opened on hover (its submenu shows in the flyout)
  // ---- All in One SEO > 検索の外観: the home page description
  await cap.go('/wp-admin/admin.php?page=aioseo-search-appearance#/content-types', '.ql-editor');
  await WPC.wait(5000);
  const descSel = await cap.eval(() => {
    // the メタディスクリプション field of the 固定ページ card (content types)
    const rows = [...document.querySelectorAll('.aioseo-settings-row')];
    const lab = (r) => (r.firstElementChild ? r.firstElementChild.textContent.trim() : '');
    const t = rows.findIndex((r) => lab(r).startsWith('固定ページ') && lab(r).endsWith('のタイトル'));
    const row = t < 0 ? null : rows.slice(t + 1).find((r) => lab(r) === 'メタディスクリプション');
    const ed = row && row.querySelector('.ql-editor');
    if (!ed) return null;
    row.setAttribute('data-demo-row', 'home-desc');
    ed.setAttribute('data-demo-desc', '');
    row.scrollIntoView({ block: 'center' });
    return true;
  });
  if (!descSel) {
    const dbg = await cap.eval(() => ({ url: location.href, title: document.title, rows: [...document.querySelectorAll('.aioseo-settings-row')].map((r) => r.firstElementChild && r.firstElementChild.textContent.trim().slice(0, 30)), eds: document.querySelectorAll('.ql-editor').length }));
    throw new Error('home description row not found ' + JSON.stringify(dbg));
  }
  await WPC.wait(1200);
  await cap.capture('aio-before');
  // type the sentence into the real field (Quill), save
  const kb = cap.frame.page().keyboard;
  for (let i = 0; i < 3; i++) {
    const el = await cap.frame.$('[data-demo-desc]');
    await el.click();
    await WPC.wait(400);
    await kb.down('Control'); await kb.press('End'); await kb.up('Control');
    await kb.type(ADDED, { delay: 12 });
    await WPC.wait(1200);
    const txt = await cap.eval(() => document.querySelector('[data-demo-desc]').textContent.replace(/[﻿\s]/g, ''));
    if (txt.endsWith(ADDED)) break;
    console.warn('  typing did not land, again');
    await cap.eval((before) => { const ed = document.querySelector('[data-demo-desc]'); ed.innerHTML = '<p>' + before + '</p>'; ed.dispatchEvent(new Event('input', { bubbles: true })); }, DESC_BEFORE);
  }
  await cap.capture('aio-typed');
  await cap.eval(() => { const b = [...document.querySelectorAll('button')].find((x) => /変更を保存/.test(x.textContent)); b.click(); });
  await WPC.wait(2500);
  await cap.capture('aio-saved');
  const saved = await cap.php("return aioseo()->dynamicOptions->searchAppearance->postTypes->page->metaDescription;");
  console.log('saved description:', saved);
  if (saved !== DESC_AFTER) console.warn('!! the saved description differs from the live one');

  await cap.finish();

  // the preview line of All in One SEO shows the Playground's host as text ("https://wpsandbox… › scope:…")
  const f = path.join(DIR, 'js', 'wp-snapshot.js');
  let js = fs.readFileSync(f, 'utf8');
  js = js.replace(/https?:\/\/wpsandbox\.wordpress\.net(?: › scope:[a-z-]+)?/g, LIVE).replace(/https?:\/\/playground\.wordpress\.net/g, LIVE);
  // WP Statistics' stylesheet starts with @import "plugin/tooltipster.bundle.css" (relative to the plugin; the shared
  // tools/wp/playground.js does not follow @import): the tooltips are not used on these screens, the import is dropped
  js = js.replace(/@import\s*\\?"plugin\/tooltipster\.bundle\.css\\?";/g, '');
  fs.writeFileSync(f, js);
  console.log('done — now: node tools/webp.js', ID);
})().catch((e) => { console.error(e); process.exit(1); });
