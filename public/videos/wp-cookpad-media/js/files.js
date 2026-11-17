/*
 * The project shown in VS Code (C:\dev\cookpad-info): a wp-env development environment with the corporate theme
 * "cookpad-info" (wp-content/themes/cookpad-info), the data of the old おしらせ (data/news.csv) and the import script.
 * info.cookpad.com's おしらせ is a WordPress post type (the live list has body class "type-pr_news archive", its RSS is
 * WordPress' feed, its images are wp-content/uploads), but the theme's source is not public: these files are a
 * reconstruction for the demo that outputs the live pages' markup (#main_content[data-page="news"], .nav_news_category,
 * .block_number, .filter_year, .list_news li.n, #pager_news, #article_header, #article_body …). The rows of
 * data/news.csv are the live list (js/news-data.js). The same files are installed into the real WordPress the admin
 * screens were captured from (tools/snapshots/wp-cookpad-media/capture-wp.js).
 * PHP is written with 4 spaces here and turned into tabs (WordPress coding standards).
 */
(function () {
  'use strict';
  const T = 'wp-content/themes/cookpad-info/';
  const ROWS = window.NEWS_DATA || [];
  /** template text (4-space indent) → lines with tabs */
  const L = (s) => s.replace(/^\n/, '').replace(/\n$/, '').split('\n').map((l) => l.replace(/^(?: {4})+/, (m) => '\t'.repeat(m.length / 4)));
  const J = (...parts) => parts.flat().join('\n') + '\n';
  const F = {};

  /* ------------------------------------------------------------------ the project */
  F['.wp-env.json'] = [
    '{',
    '  "core": null,',
    '  "phpVersion": "8.3",',
    '  "themes": ["./wp-content/themes/cookpad-info"],',
    '  "plugins": ["https://downloads.wordpress.org/plugin/advanced-custom-fields.zip"],',
    '  "mappings": {',
    '    "data": "./data",',
    '    "scripts": "./scripts"',
    '  },',
    '  "port": 8888,',
    '  "config": {',
    '    "WP_DEBUG": true',
    '  }',
    '}',
    '',
  ].join('\n');

  F['package.json'] = [
    '{',
    '  "name": "cookpad-info",',
    '  "private": true,',
    '  "scripts": {',
    '    "start": "wp-env start",',
    '    "stop": "wp-env stop",',
    '    "cli": "wp-env run cli wp",',
    '    "import": "wp-env run cli wp eval-file scripts/import-news.php"',
    '  },',
    '  "devDependencies": {',
    '    "@wordpress/env": "^11.4.0"',
    '  }',
    '}',
    '',
  ].join('\n');

  F['README.md'] = [
    '# info.cookpad.com — WordPress',
    '',
    'コーポレートサイトのテーマ（wp-content/themes/cookpad-info）と開発環境。',
    '',
    '## 開発環境',
    '',
    '- `npm start` — wp-env（http://localhost:8888）',
    '- `npm run cli -- <command>` — WP-CLI',
    '- `npm run import` — data/news.csv（旧サイトのおしらせ）を取り込む',
    '',
    '## おしらせ（/news）',
    '',
    '- 投稿タイプ `pr_news`、カテゴリー `pr_news_category`（リリース / お知らせ / 出版）',
    '- 外部リンク（ACF：`news_url`）がある記事は、一覧から別タブでリンク',
    '- 一覧は 10 件ずつ・年（/news/2026）とカテゴリー（/news/category/release）で絞り込み',
    '',
  ].join('\n');

  /* data/news.csv: the old site's おしらせ (the live list, newest first) */
  const csvCell = (v) => (/[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  F['data/news.csv'] = ['date,category,title,slug,url,image,body', ...ROWS.map((r) => [r.date, r.category, r.title, r.slug, r.url, r.image, r.body.replace(/\n/g, '')].map(csvCell).join(','))].join('\n') + '\n';
  const IMPORT = { rows: ROWS.length, external: ROWS.filter((r) => r.url).length, images: ROWS.filter((r) => r.image).length };

  F['scripts/import-news.php'] = J(L(`
<?php
/**
 * 旧サイトのおしらせ（data/news.csv）を投稿タイプ pr_news に取り込む。
 *   npm run import（wp-env run cli wp eval-file scripts/import-news.php）
 *
 * @package cookpad-info
 */

$cookpad_info_csv  = new SplFileObject( ABSPATH . 'data/news.csv' );
$cookpad_info_rows = array();
$cookpad_info_csv->setFlags( SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::READ_AHEAD );
foreach ( $cookpad_info_csv as $cookpad_info_i => $cookpad_info_row ) {
    if ( 0 === $cookpad_info_i ) {
        $cookpad_info_head = $cookpad_info_row;
        continue;
    }
    $cookpad_info_rows[] = array_combine( $cookpad_info_head, $cookpad_info_row );
}

$cookpad_info_bar = WP_CLI\\Utils\\make_progress_bar( '取り込み中', count( $cookpad_info_rows ) );
$cookpad_info_n   = array(
    'posts'  => 0,
    'links'  => 0,
    'images' => 0,
);
foreach ( array_reverse( $cookpad_info_rows ) as $cookpad_info_item ) {
    $cookpad_info_id = wp_insert_post(
        array(
            'post_type'    => 'pr_news',
            'post_status'  => 'publish',
            'post_title'   => $cookpad_info_item['title'],
            'post_name'    => $cookpad_info_item['slug'],
            'post_content' => $cookpad_info_item['body'],
            'post_date'    => $cookpad_info_item['date'] . ' 10:00:00',
        ),
        true
    );
    $cookpad_info_bar->tick();
    if ( is_wp_error( $cookpad_info_id ) ) {
        WP_CLI::warning( $cookpad_info_item['title'] . ': ' . $cookpad_info_id->get_error_message() );
        continue;
    }
    ++$cookpad_info_n['posts'];
    wp_set_object_terms( $cookpad_info_id, $cookpad_info_item['category'], 'pr_news_category' );
    if ( $cookpad_info_item['url'] ) {
        update_field( 'news_url', $cookpad_info_item['url'], $cookpad_info_id );
        ++$cookpad_info_n['links'];
    }
    if ( $cookpad_info_item['image'] ) {
        $cookpad_info_img = media_sideload_image( WP_Http::make_absolute_url( $cookpad_info_item['image'], 'https://info.cookpad.com/' ), $cookpad_info_id, null, 'id' );
        if ( ! is_wp_error( $cookpad_info_img ) ) {
            set_post_thumbnail( $cookpad_info_id, $cookpad_info_img );
            ++$cookpad_info_n['images'];
        }
    }
}
$cookpad_info_bar->finish();

WP_CLI::success( sprintf( '%d 件のおしらせを取り込みました（外部リンク %d 件・アイキャッチ画像 %d 件）。', $cookpad_info_n['posts'], $cookpad_info_n['links'], $cookpad_info_n['images'] ) );
`));

  /* ------------------------------------------------------------------ the theme (existing files) */
  F[T + 'style.css'] = [
    '/*',
    'Theme Name: cookpad info',
    'Theme URI: https://info.cookpad.com/',
    'Author: Cookpad Inc.',
    'Description: クックパッド株式会社 コーポレートサイトのテーマ',
    'Version: 2.4.0',
    'Requires at least: 6.6',
    'Requires PHP: 8.1',
    'Text Domain: cookpad-info',
    '*/',
    '',
  ].join('\n');

  const FN_HEAD = L(`
<?php
/**
 * cookpad-info functions and definitions
 *
 * @package cookpad-info
 */

defined( 'ABSPATH' ) || exit;

define( 'COOKPAD_INFO_VERSION', '2.4.0' );

require_once get_theme_file_path( 'inc/setup.php' );
require_once get_theme_file_path( 'inc/assets.php' );
require_once get_theme_file_path( 'inc/template-tags.php' );`);
  const FN_PT = "require_once get_theme_file_path( 'inc/post-types.php' );";
  const FN_FIELDS = "require_once get_theme_file_path( 'inc/fields.php' );";
  const FN_NEWS = "require_once get_theme_file_path( 'inc/news.php' );";
  const FN = (...more) => J(FN_HEAD, more);

  F[T + 'inc/setup.php'] = J(L(`
<?php
/**
 * Theme setup.
 *
 * @package cookpad-info
 */

add_action(
    'after_setup_theme',
    function () {
        add_theme_support( 'title-tag' );
        add_theme_support( 'post-thumbnails' );
        add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
        add_theme_support( 'automatic-feed-links' );
        register_nav_menus(
            array(
                'global' => 'グローバルナビ',
                'footer' => 'フッターナビ',
            )
        );
    }
);
`));

  F[T + 'inc/assets.php'] = J(L(`
<?php
/**
 * Styles and scripts.
 *
 * @package cookpad-info
 */

add_action(
    'wp_enqueue_scripts',
    function () {
        wp_enqueue_style( 'yakuhanjp', 'https://cdn.jsdelivr.net/npm/yakuhanjp@3.4.1/dist/css/yakuhanjp.min.css', array(), '3.4.1' );
        wp_enqueue_style( 'cookpad-info', get_theme_file_uri( 'assets/styles/main.css' ), array( 'yakuhanjp' ), COOKPAD_INFO_VERSION );
        wp_enqueue_script( 'cookpad-info', get_theme_file_uri( 'assets/scripts/main.js' ), array( 'jquery' ), COOKPAD_INFO_VERSION, true );
    }
);
`));

  F[T + 'inc/template-tags.php'] = J(L(`
<?php
/**
 * Template tags.
 *
 * @package cookpad-info
 */

/**
 * An icon of assets/images/common/sprite.svg.
 *
 * @param string $name  The symbol (icon_arrow_small_left …).
 * @param string $title Its title.
 */
function cookpad_info_icon( $name, $title = '' ) {
    printf(
        '<i class="icon"><svg role="img"><title>%1$s</title><use xlink:href="%2$s#%3$s"></use></svg></i>',
        esc_html( $title ),
        esc_url( get_theme_file_uri( 'assets/images/common/sprite.svg' ) ),
        esc_attr( $name )
    );
}
`));

  F[T + 'header.php'] = J(L(`
<?php
/**
 * The header: <head>, the logo.
 *
 * @package cookpad-info
 */

?>
<!DOCTYPE html>
<html class="loading" <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport">
    <?php wp_head(); ?>
</head>
<body <?php body_class( 'ja' ); ?>>
    <header id="global_header">
        <h1><a class="internal" href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php bloginfo( 'name' ); ?>">
            <img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/common/logo.svg' ) ); ?>" alt="<?php bloginfo( 'name' ); ?>"></a>
        </h1>
    </header>
    <div id="wrapper">
        <main>
            <div id="main_inner">
`));

  F[T + 'footer.php'] = J(L(`
<?php
/**
 * The footer: the banners, the navigation, the copyright.
 *
 * @package cookpad-info
 */

?>
            </div>
        </main>
    </div>
    <footer id="global_footer" data-block>
        <?php get_template_part( 'template-parts/footer/banners' ); ?>
        <div class="footer_inner">
            <?php get_template_part( 'template-parts/footer/nav' ); ?>
            <div class="footer_bottom">
                <p class="copy">&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> Cookpad Inc.</p>
            </div>
        </div>
    </footer>
    <?php wp_footer(); ?>
</body>
</html>
`));

  F[T + 'index.php'] = J(L(`
<?php
/**
 * The fallback template.
 *
 * @package cookpad-info
 */

get_header();
while ( have_posts() ) :
    the_post();
    the_content();
endwhile;
get_footer();
`));

  F[T + 'front-page.php'] = J(L(`
<?php
/**
 * The top page: the main visual, 私たちのこと, サービスのこと, the latest おしらせ.
 *
 * @package cookpad-info
 */

get_header();
?>
<div id="main_content" data-page="top" data-bg-type="top">
    <?php get_template_part( 'template-parts/top/mainvisual' ); ?>
    <?php get_template_part( 'template-parts/top/about' ); ?>
    <?php get_template_part( 'template-parts/top/service' ); ?>
    <?php get_template_part( 'template-parts/top/news' ); ?>
</div>
<?php
get_footer();
`));

  F[T + 'page.php'] = J(L(`
<?php
/**
 * A page (私たちのこと, 会社概要 …).
 *
 * @package cookpad-info
 */

get_header();
while ( have_posts() ) :
    the_post();
    get_template_part( 'template-parts/page/' . get_post_field( 'post_name' ), null, array( 'fallback' => true ) );
endwhile;
get_footer();
`));

  F[T + '404.php'] = J(L(`
<?php
/**
 * Not found.
 *
 * @package cookpad-info
 */

get_header();
?>
<h1>404</h1>
<?php
get_footer();
`));

  F[T + 'assets/styles/main.css'] = '/* compiled from src/styles (npm run build:css) — do not edit */\n@charset "UTF-8";\n';
  F[T + 'assets/scripts/main.js'] = '/* compiled from src/scripts (npm run build:js) — do not edit */\n';

  /* ------------------------------------------------------------------ 1. the post type (typed in scene 1) */
  const PT_HEAD = L(`
<?php
/**
 * おしらせ: the post type pr_news and its categories.
 *
 * @package cookpad-info
 */
`);
  const PT_CPT = L(`
add_action( 'init', 'cookpad_info_register_news' );

/**
 * Registers the post type pr_news (/news).
 */
function cookpad_info_register_news() {
    register_post_type(
        'pr_news',
        array(
            'label'         => 'おしらせ',
            'public'        => true,
            'has_archive'   => 'news',
            'rewrite'       => array(
                'slug'       => 'news',
                'with_front' => false,
            ),
            'menu_position' => 5,
            'menu_icon'     => 'dashicons-megaphone',
            'supports'      => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        )
    );
}`);
  const PT_REST = "\t\t\t'show_in_rest'  => true,";
  // scene 2: the categories, registered before the post type (their /news/category/… rules come first)
  const PT_TAX = L(`
    register_taxonomy(
        'pr_news_category',
        'pr_news',
        array(
            'label'             => 'おしらせカテゴリー',
            'hierarchical'      => true,
            'show_admin_column' => true,
            'show_in_rest'      => true,
            'rewrite'           => array(
                'slug'       => 'news/category',
                'with_front' => false,
            ),
        )
    );
`);
  const ptWith = (rest, tax) => {
    const body = [...PT_CPT];
    if (rest) body.splice(body.findIndex((l) => /'supports'/.test(l)) + 1, 0, PT_REST);
    if (tax) {
      body.splice(body.findIndex((l) => /^\tregister_post_type\(/.test(l)), 0, ...PT_TAX, '');
    }
    return J(PT_HEAD, '', body);
  };
  F[T + 'inc/post-types.php'] = ptWith(true, true);

  /* ------------------------------------------------------------------ 3. the external link (ACF, pasted in scene 3) */
  F[T + 'inc/fields.php'] = J(L(`
<?php
/**
 * おしらせ: 外部リンク (Advanced Custom Fields).
 *
 * @package cookpad-info
 */

add_action( 'acf/init', 'cookpad_info_news_fields' );

/**
 * 外部リンク: with a URL, the list links to that page (news.cookpad.com, PR TIMES …) in a new tab.
 */
function cookpad_info_news_fields() {
    acf_add_local_field_group(
        array(
            'key'      => 'group_cp_news_link',
            'title'    => '外部リンク',
            'fields'   => array(
                array(
                    'key'          => 'field_cp_news_url',
                    'label'        => 'リンク先 URL',
                    'name'         => 'news_url',
                    'type'         => 'url',
                    'instructions' => '入力すると、一覧からこの URL に別タブでリンクします（本文は表示されません）。',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param'    => 'post_type',
                        'operator' => '==',
                        'value'    => 'pr_news',
                    ),
                ),
            ),
            'position' => 'side',
        )
    );
}
`));

  /* ------------------------------------------------------------------ 4. the article (scene 4) */
  const SINGLE_HEAD = L(`
<?php
/**
 * おしらせ: one article (/news/{slug}).
 *
 * @package cookpad-info
 */

get_header();

while ( have_posts() ) :
    the_post();
    $cookpad_info_cats = wp_get_post_terms( get_the_ID(), 'pr_news_category' );
    ?>`);
  // typed: the article's header and body (the live page's markup)
  const SINGLE_BODY = L(`
    <div id="main_content" data-page="news_detail" data-bg-type="news">
        <div id="page_content" data-block data-bg-id="0">
            <article>
                <div id="article_header" data-block data-bg-id="1">
                    <div class="back"><a class="btn_back internal" href="<?php echo esc_url( get_post_type_archive_link( 'pr_news' ) ); ?>" title="">
                        <?php cookpad_info_icon( 'icon_arrow_small_left', 'back' ); ?><span>一覧にもどる</span></a></div>
                    <h2><?php the_title(); ?></h2>
                    <div class="article_info">
                        <div class="info">
                            <ul class="tags">
                                <?php foreach ( $cookpad_info_cats as $cookpad_info_cat ) : ?>
                                    <li><a href="<?php echo esc_url( get_term_link( $cookpad_info_cat ) ); ?>" title="<?php echo esc_attr( $cookpad_info_cat->name ); ?>">
                                        <span><?php echo esc_html( $cookpad_info_cat->name ); ?></span></a></li>
                                <?php endforeach; ?>
                            </ul>
                            <p class="date"><?php echo esc_html( get_the_date( 'Y.m.d' ) ); ?></p>
                        </div>
                    </div>
                </div>
                <div id="article_body">
                    <div class="body"><?php the_content(); ?></div>
                </div>
            </article>
        </div>
    </div>`);
  const SINGLE_TAIL = L(`
    <?php
endwhile;

get_footer();`);
  F[T + 'single-pr_news.php'] = J(SINGLE_HEAD, SINGLE_BODY, SINGLE_TAIL);

  /* ------------------------------------------------------------------ 5. the list (scene 5) */
  const NEWS_BASE = L(`
<?php
/**
 * おしらせ: the list's query, the year archives, the links.
 *
 * @package cookpad-info
 */

/**
 * 10 per page on /news, its categories and years.
 *
 * @param WP_Query $query The main query.
 */
function cookpad_info_news_query( $query ) {
    if ( is_admin() || ! $query->is_main_query() ) {
        return;
    }
    if ( $query->is_post_type_archive( 'pr_news' ) || $query->is_tax( 'pr_news_category' ) ) {
        $query->set( 'posts_per_page', 10 );
    }
}
add_action( 'pre_get_posts', 'cookpad_info_news_query' );

/**
 * /news/2026: the year's おしらせ (before the post type's own /news/{slug}).
 */
function cookpad_info_news_rewrite() {
    add_rewrite_rule( '^news/([0-9]{4})/?$', 'index.php?post_type=pr_news&year=$matches[1]', 'top' );
    add_rewrite_rule( '^news/([0-9]{4})/page/([0-9]+)/?$', 'index.php?post_type=pr_news&year=$matches[1]&paged=$matches[2]', 'top' );
}
add_action( 'init', 'cookpad_info_news_rewrite' );`);
  // the fix (typed in scene 5): an item links to its 外部リンク when it has one — also in the RSS feed
  const NEWS_LINK = L(`

/**
 * Where an おしらせ links to: its 外部リンク (news.cookpad.com, PR TIMES …) or its own page.
 *
 * @param int $post_id The post.
 * @return array{url: string, external: bool}
 */
function cookpad_info_news_link( $post_id = 0 ) {
    $post_id = $post_id ? $post_id : get_the_ID();
    $url     = get_field( 'news_url', $post_id );
    if ( $url ) {
        return array(
            'url'      => $url,
            'external' => true,
        );
    }
    return array(
        'url'      => get_permalink( $post_id ),
        'external' => false,
    );
}
add_filter(
    'the_permalink_rss',
    function ( $url ) {
        return 'pr_news' === get_post_type() ? cookpad_info_news_link()['url'] : $url;
    }
);`);
  F[T + 'inc/news.php'] = J(NEWS_BASE, NEWS_LINK);

  F[T + 'archive-pr_news.php'] = J(L(`
<?php
/**
 * おしらせ: the list (/news, /news/category/{slug}, /news/2026).
 *
 * @package cookpad-info
 */

get_header();

$cookpad_info_cats = get_terms(
    array(
        'taxonomy'   => 'pr_news_category',
        'hide_empty' => false,
        'orderby'    => 'term_id',
    )
);
$cookpad_info_term = is_tax( 'pr_news_category' ) ? get_queried_object() : null;
?>
<div id="main_content" data-page="news" data-bg-type="news">
    <div id="page_content" data-block data-bg-id="0">
        <div class="page_header" data-block data-bg-id="1">
            <h2>お知らせ</h2>
            <div class="nav_news_category">
                <ul>
                    <li><a class="<?php echo $cookpad_info_term ? '' : 'active'; ?>" href="<?php echo esc_url( get_post_type_archive_link( 'pr_news' ) ); ?>" title="すべて"><span>すべて</span></a></li>
                    <?php foreach ( $cookpad_info_cats as $cookpad_info_cat ) : ?>
                        <li><a class="<?php echo $cookpad_info_term && $cookpad_info_term->term_id === $cookpad_info_cat->term_id ? 'active' : ''; ?>"
                            href="<?php echo esc_url( get_term_link( $cookpad_info_cat ) ); ?>" title="<?php echo esc_attr( $cookpad_info_cat->name ); ?>">
                            <span><?php echo esc_html( $cookpad_info_cat->name ); ?></span></a></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
        <div id="content">
            <div id="news_info">
                <div class="info_cols">
                    <div class="block_number">
                        <p><span class="num"><?php echo esc_html( $wp_query->found_posts ); ?></span><span class="unit">件</span></p>
                    </div>
                    <?php get_template_part( 'template-parts/news/filter-year' ); ?>
                </div>
            </div>
            <div class="list_news">
                <ul>
                    <?php
                    while ( have_posts() ) :
                        the_post();
                        get_template_part( 'template-parts/news/item' );
                    endwhile;
                    ?>
                </ul>
            </div>
            <?php get_template_part( 'template-parts/news/pager' ); ?>
        </div>
    </div>
</div>
<?php
get_footer();
`));

  F[T + 'taxonomy-pr_news_category.php'] = J(L(`
<?php
/**
 * おしらせ: one category (/news/category/{slug}) — the same list.
 *
 * @package cookpad-info
 */

get_template_part( 'archive', 'pr_news' );
`));

  const ITEM_HEAD = L(`
<?php
/**
 * おしらせ: one item of the list.
 *
 * @package cookpad-info
 */

$cookpad_info_cats = wp_get_post_terms( get_the_ID(), 'pr_news_category' );`);
  const ITEM_LINK_FIX = '$cookpad_info_link = cookpad_info_news_link();';
  const ITEM_A_BAD = '<li class="n"><a href="<?php the_permalink(); ?>" title="<?php the_title_attribute(); ?>" target="_self" rel="">';
  const ITEM_A_GOOD = [
    '<li class="n"><a href="<?php echo esc_url( $cookpad_info_link[\'url\'] ); ?>" title="<?php the_title_attribute(); ?>"',
    "\t<?php echo $cookpad_info_link['external'] ? 'target=\"_blank\" rel=\"noopener\"' : 'target=\"_self\" rel=\"\"'; ?>>",
  ];
  // typed in scene 5: the item (the live list's markup)
  const ITEM_BODY = L(`
        <div class="cols">
            <div class="img_news">
                <picture>
                    <?php if ( has_post_thumbnail() ) : ?>
                        <?php the_post_thumbnail( 'large', array( 'alt' => '' ) ); ?>
                    <?php else : ?>
                        <img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/news/thumb_noimg.png' ) ); ?>" alt=""/>
                    <?php endif; ?>
                </picture>
            </div>
            <div class="col_r">
                <h4><?php the_title(); ?></h4>
                <div class="info">
                    <ul class="tags">
                        <?php foreach ( $cookpad_info_cats as $cookpad_info_cat ) : ?>
                            <li><span><?php echo esc_html( $cookpad_info_cat->name ); ?></span></li>
                        <?php endforeach; ?>
                    </ul>
                    <p class="date"><?php echo esc_html( get_the_date( 'Y.m.d' ) ); ?></p>
                </div>
            </div>
        </div></a></li>`);
  const itemFile = (good) => J(ITEM_HEAD, good ? [ITEM_LINK_FIX, '?>', ...ITEM_A_GOOD] : ['?>', ITEM_A_BAD], ITEM_BODY);
  F[T + 'template-parts/news/item.php'] = itemFile(true);

  F[T + 'template-parts/news/pager.php'] = J(L(`
<?php
/**
 * おしらせ: the page numbers (1 2 … 89 →).
 *
 * @package cookpad-info
 */

$cookpad_info_pages = paginate_links(
    array(
        'type'      => 'array',
        'mid_size'  => 1,
        'end_size'  => 1,
        'prev_next' => false,
    )
);
if ( ! $cookpad_info_pages ) {
    return;
}
?>
<div id="pager_news">
    <ul>
        <?php foreach ( $cookpad_info_pages as $cookpad_info_page ) : ?>
            <li><?php echo wp_kses_post( str_replace( array( 'page-numbers current', 'page-numbers' ), array( 'internal active', 'internal' ), $cookpad_info_page ) ); ?></li>
        <?php endforeach; ?>
    </ul>
    <?php if ( get_next_posts_link() ) : ?>
        <a class="btn_next internal" href="<?php echo esc_url( get_next_posts_page_link() ); ?>" title="NEXT"><?php cookpad_info_icon( 'icon_arrow_small_right', 'NEXT' ); ?></a>
    <?php endif; ?>
</div>
`));

  F[T + 'template-parts/news/filter-year.php'] = J(L(`
<?php
/**
 * おしらせ: the year select (最新 / 2026 … 2008).
 *
 * @package cookpad-info
 */

$cookpad_info_year  = (int) get_query_var( 'year' );
$cookpad_info_first = get_posts(
    array(
        'post_type'   => 'pr_news',
        'numberposts' => 1,
        'order'       => 'ASC',
        'fields'      => 'ids',
    )
);
$cookpad_info_from  = $cookpad_info_first ? (int) get_the_date( 'Y', $cookpad_info_first[0] ) : (int) current_time( 'Y' );
?>
<div class="filter_year">
    <select>
        <option value="<?php echo esc_url( get_post_type_archive_link( 'pr_news' ) ); ?>"<?php selected( $cookpad_info_year, 0 ); ?>> 最新 </option>
        <?php for ( $cookpad_info_y = (int) current_time( 'Y' ); $cookpad_info_y >= $cookpad_info_from; $cookpad_info_y-- ) : ?>
            <option value="<?php echo esc_url( home_url( '/news/' . $cookpad_info_y ) ); ?>"<?php selected( $cookpad_info_year, $cookpad_info_y ); ?>><?php echo esc_html( $cookpad_info_y ); ?></option>
        <?php endfor; ?>
    </select><?php cookpad_info_icon( 'icon_arrow_small_down', 'arrow' ); ?>
</div>
`));

  // the theme as it is in each part of the capture / the video
  F.files = F;   // (kept for the same shape as wp-crooz: FILES.files[path])
  window.FILES = {
    files: Object.fromEntries(Object.entries(F).filter(([k]) => k !== 'files')),
    T, L, J, IMPORT,
    FN, FN_PT, FN_FIELDS, FN_NEWS,
    PT_HEAD, PT_CPT, PT_REST, PT_TAX, ptWith,
    SINGLE_HEAD, SINGLE_BODY, SINGLE_TAIL,
    NEWS_BASE, NEWS_LINK,
    ITEM_HEAD, ITEM_BODY, ITEM_A_BAD, ITEM_A_GOOD, ITEM_LINK_FIX, itemFile,
  };
})();
