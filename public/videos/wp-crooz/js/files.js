/*
 * The project shown in VS Code (C:\dev\crooz-corporate): a wp-env development environment with the original theme
 * "crooz" (wp-content/themes/crooz). crooz.co.jp runs on WordPress with a theme of that name, but its source is not
 * public: these files are a reconstruction for the demo that outputs the live pages' markup (class names
 * .header / .gnav / .section-pageTitle .title-main / .table-overview / .section-block …, the theme images, the
 * Contact Form 7 field names). The company data and the business texts are the live pages' (read from the snapshot).
 * The same files are installed into the real WordPress the admin screens were captured from
 * (tools/snapshots/wp-crooz/capture-wp.js), so the theme, its menus and templates there are these.
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const F = {};
  const T = 'wp-content/themes/crooz/';
  const php = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  F['.wp-env.json'] = [
    '{',
    '  "core": null,',
    '  "phpVersion": "8.3",',
    '  "themes": ["./wp-content/themes/crooz"],',
    '  "plugins": [],',
    '  "port": 8888,',
    '  "config": {',
    '    "WP_DEBUG": true,',
    '    "WP_DEBUG_LOG": true',
    '  }',
    '}',
  ].join('\n');

  F['package.json'] = [
    '{',
    '  "name": "crooz-corporate",',
    '  "private": true,',
    '  "scripts": {',
    '    "start": "wp-env start",',
    '    "stop": "wp-env stop",',
    '    "cli": "wp-env run cli wp"',
    '  },',
    '  "devDependencies": {',
    '    "@wordpress/env": "^11.4.0"',
    '  }',
    '}',
  ].join('\n');

  F['.gitignore'] = ['node_modules/', '.DS_Store', '*.log', ''].join('\n');

  F['README.md'] = [
    '# crooz.co.jp コーポレートサイト（WordPress）',
    '',
    'クルーズ株式会社 公式企業サイトのオリジナルテーマ「crooz」と開発環境。',
    '',
    '## 開発環境',
    '',
    '```',
    'npm install',
    'npm start          # wp-env：http://localhost:8888（管理画面 /wp-admin）',
    '```',
    '',
    '## ページとテンプレート',
    '',
    '| ページ | URL | テンプレート |',
    '| --- | --- | --- |',
    '| トップ | / | front-page.php |',
    '| 企業情報 › 会社概要 | /about/overview/ | page-overview.php |',
    '| 事業・グループ会社紹介 | /business/ | page-business.php |',
    '| お問い合わせ | /contact/ | page.php ＋ Contact Form 7 |',
    '',
    '固定ページのスラッグでテンプレートが決まる（page-{スラッグ}.php）。日本語のタイトルのまま公開すると',
    'スラッグが %e4… になるため、必ず英字のスラッグに変更すること。',
    '',
    '## デザイン',
    '',
    '- 基調色：#2dafe6（ライン・リンク）／ テキスト #272727',
    '- ページタイトル：中央・字間 0.26em・下に 50×4px のライン',
    '- ブレークポイント：640px 以下をスマートフォン',
    '',
  ].join('\n');

  F[T + 'style.css'] = [
    '/*',
    'Theme Name: CROOZ',
    'Theme URI: https://crooz.co.jp/',
    'Author: CROOZ, Inc.',
    'Description: クルーズ株式会社 公式企業サイトのオリジナルテーマ',
    'Version: 1.0.0',
    'Requires at least: 6.6',
    'Requires PHP: 8.1',
    'Text Domain: crooz',
    '*/',
    '',
  ].join('\n');

  /* ---------------------------------------------------------------- functions.php (NAV_FN is typed in scene 2) */
  const NAV_FN = [
    '',
    '\tregister_nav_menus(',
    '\t\tarray(',
    "\t\t\t'global' => 'グローバルナビ',",
    "\t\t\t'footer' => 'フッターナビ',",
    '\t\t)',
    '\t);',
  ];
  const FN_HEAD = [
    '<?php',
    '/**',
    ' * CROOZ テーマの関数',
    ' *',
    ' * @package crooz',
    ' */',
    '',
    "if ( ! defined( 'ABSPATH' ) ) {",
    '\texit;',
    '}',
    '',
    "define( 'CROOZ_VERSION', '1.0.0' );",
    '',
    '/**',
    ' * テーマの基本設定',
    ' */',
    'function crooz_setup() {',
    "\tadd_theme_support( 'title-tag' );",
    "\tadd_theme_support( 'post-thumbnails' );",
    "\tadd_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );",
    "\tadd_theme_support( 'responsive-embeds' );",
  ];
  const FN_TAIL = [
    '}',
    "add_action( 'after_setup_theme', 'crooz_setup' );",
    '',
    '/**',
    ' * タイトルの区切り：会社概要｜クルーズ株式会社',
    ' */',
    "add_filter( 'document_title_separator', fn() => '｜' );",
    '',
    '/**',
    ' * CSS / JavaScript',
    ' */',
    'function crooz_assets() {',
    "\twp_enqueue_style( 'crooz-main', get_theme_file_uri( 'assets/css/main.css' ), array(), CROOZ_VERSION );",
    "\twp_enqueue_script( 'crooz-main', get_theme_file_uri( 'assets/js/main.js' ), array( 'jquery' ), CROOZ_VERSION, true );",
    '}',
    "add_action( 'wp_enqueue_scripts', 'crooz_assets' );",
    '',
  ];
  F[T + 'functions.php'] = [...FN_HEAD, ...NAV_FN, ...FN_TAIL].join('\n');
  const FN_BEFORE_NAV = [...FN_HEAD, ...FN_TAIL].join('\n');

  /* ---------------------------------------------------------------- header / footer (the live markup) */
  const NAV_HEADER = [
    '\t\t<?php',
    '\t\twp_nav_menu(',
    '\t\t\tarray(',
    "\t\t\t\t'theme_location' => 'global',",
    "\t\t\t\t'container'      => false,",
    "\t\t\t\t'menu_class'     => 'gnav',",
    "\t\t\t\t'depth'          => 1,",
    '\t\t\t)',
    '\t\t);',
    '\t\t?>',
  ];
  const HEADER_HEAD = [
    '<!doctype html>',
    '<html <?php language_attributes(); ?>>',
    '<head>',
    '<meta charset="<?php bloginfo( \'charset\' ); ?>">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<?php wp_head(); ?>',
    '</head>',
    '<body <?php body_class(); ?>>',
    '<?php wp_body_open(); ?>',
    '<header class="header">',
    '\t<div class="header-main">',
    '\t\t<div class="logo">',
    '\t\t\t<a href="<?php echo esc_url( home_url( \'/\' ) ); ?>"><img src="<?php echo esc_url( get_theme_file_uri( \'img/logo.svg\' ) ); ?>" alt="<?php bloginfo( \'name\' ); ?>" width="76"></a>',
    '\t\t</div>',
  ];
  const HEADER_TAIL = [
    '\t\t<div class="sitemap-btn">',
    '\t\t\t<img src="<?php echo esc_url( get_theme_file_uri( \'img/icn_gnav_btn.svg\' ) ); ?>" alt="" width="49">',
    '\t\t</div>',
    '\t</div>',
    '</header>',
    '<div class="wrapper">',
    '',
  ];
  F[T + 'header.php'] = [...HEADER_HEAD, ...NAV_HEADER, ...HEADER_TAIL].join('\n');
  const HEADER_BEFORE_NAV = [...HEADER_HEAD, ...HEADER_TAIL].join('\n');

  F[T + 'footer.php'] = [
    '<footer class="footer">',
    '\t<div class="container">',
    '\t\t<div class="logo">',
    '\t\t\t<a href="<?php echo esc_url( home_url( \'/\' ) ); ?>"><img src="<?php echo esc_url( get_theme_file_uri( \'img/logo.svg\' ) ); ?>" alt="<?php bloginfo( \'name\' ); ?>" width="178"></a>',
    '\t\t</div>',
    '\t</div>',
    '\t<div class="container sp_full">',
    '\t\t<?php',
    '\t\twp_nav_menu(',
    '\t\t\tarray(',
    "\t\t\t\t'theme_location'  => 'footer',",
    "\t\t\t\t'container'       => 'nav',",
    "\t\t\t\t'container_class' => 'footer-shortcut',",
    "\t\t\t\t'depth'           => 1,",
    '\t\t\t)',
    '\t\t);',
    '\t\t?>',
    '\t</div>',
    '\t<p class="copy">Copyright (C) CROOZ,Inc. All Rights Reserved.</p>',
    '</footer>',
    '</div>',
    '<?php wp_footer(); ?>',
    '</body>',
    '</html>',
    '',
  ].join('\n');

  F[T + 'index.php'] = ['<?php', 'get_header();', 'while ( have_posts() ) {', '\tthe_post();', "\tget_template_part( 'template-parts/content', get_post_type() );", '}', 'get_footer();', ''].join('\n');

  F[T + 'front-page.php'] = [
    '<?php',
    '/**',
    ' * トップページ',
    ' *',
    ' * @package crooz',
    ' */',
    '',
    'get_header();',
    '?>',
    '<article class="page-top">',
    "\t<?php get_template_part( 'template-parts/front/mv' ); ?>",
    "\t<?php get_template_part( 'template-parts/front/news' ); ?>",
    "\t<?php get_template_part( 'template-parts/front/business' ); ?>",
    "\t<?php get_template_part( 'template-parts/front/ir' ); ?>",
    "\t<?php get_template_part( 'template-parts/front/recruit' ); ?>",
    "\t<?php get_template_part( 'template-parts/front/blog' ); ?>",
    '</article>',
    '<?php',
    'get_footer();',
    '',
  ].join('\n');

  // page.php: the default (a page whose slug has no page-{slug}.php shows only its title and content)
  F[T + 'page.php'] = [
    '<?php',
    '/**',
    ' * 固定ページ（テンプレートのないページ）',
    ' *',
    ' * @package crooz',
    ' */',
    '',
    'get_header();',
    'while ( have_posts() ) :',
    '\tthe_post();',
    '\t?>',
    '\t<article class="contents">',
    '\t\t<main class="main">',
    '\t\t\t<section class="section-pageTitle">',
    '\t\t\t\t<div class="container">',
    '\t\t\t\t\t<h1 class="title-main"><?php the_title(); ?></h1>',
    '\t\t\t\t</div>',
    '\t\t\t</section>',
    '\t\t\t<div class="page-content">',
    '\t\t\t\t<div class="container">',
    '\t\t\t\t\t<?php the_content(); ?>',
    '\t\t\t\t</div>',
    '\t\t\t</div>',
    '\t\t</main>',
    '\t</article>',
    '\t<?php',
    'endwhile;',
    "get_template_part( 'template-parts/breadcrumb' );",
    'get_footer();',
    '',
  ].join('\n');

  F[T + 'template-parts/breadcrumb.php'] = [
    '<section class="section-breadcrumbs">',
    '\t<div class="container">',
    '\t\t<div id="breadcrumbs">',
    '\t\t\t<a href="<?php echo esc_url( home_url( \'/\' ) ); ?>">クルーズ株式会社TOP</a>',
    '\t\t\t<?php foreach ( array_reverse( get_post_ancestors( get_the_ID() ) ) as $crooz_parent ) : ?>',
    '\t\t\t\tー <a href="<?php echo esc_url( get_permalink( $crooz_parent ) ); ?>"><?php echo esc_html( get_the_title( $crooz_parent ) ); ?></a>',
    '\t\t\t<?php endforeach; ?>',
    '\t\t\tー <span class="breadcrumb_last" aria-current="page"><?php the_title(); ?></span>',
    '\t\t</div>',
    '\t</div>',
    '</section>',
    '',
  ].join('\n');

  /* ---------------------------------------------------------------- 会社概要: page-overview.php (the loop is typed, the data pasted) */
  const OVERVIEW = [
    ['社名', 'クルーズ株式会社（CROOZ, Inc.）'],
    ['代表者', '小渕 宏二（代表取締役社長）'],
    ['設立', '2001年5月24日'],
    ['資本金', '4億6,016万円 (2026年3月末時点)'],
    ['事業内容', '純粋持株会社として当社グループの経営戦略の立案、及び子会社への投資、経営目標の立案・実行の支援'],
    ['所在地', '〒150-0013 東京都渋谷区恵比寿四丁目3番14号 恵比寿SSビル'],
    ['上場市場', '東京証券取引所 スタンダード市場 （証券コード：2138）'],
    ['決算期', '3月'],
  ];
  const OV_HEAD = [
    '<?php',
    '/**',
    ' * 会社概要（固定ページ「会社概要」・スラッグ overview）',
    ' *',
    ' * @package crooz',
    ' */',
    '',
  ];
  const OV_DATA = [
    '$crooz_overview = array(',
    ...OVERVIEW.map(([k, v]) => `\t'${php(k)}' => '${php(v)}',`),
    ');',
    '',
  ];
  const OV_LOOP = [
    'get_header();',
    '?>',
    '<article class="article-overview contents">',
    '\t<main class="main">',
    '\t\t<section class="section-pageTitle">',
    '\t\t\t<div class="container">',
    '\t\t\t\t<h1 class="title-main"><?php the_title(); ?></h1>',
    '\t\t\t</div>',
    '\t\t</section>',
    '\t\t<div class="page-content">',
    '\t\t\t<div class="page-overview">',
    '\t\t\t\t<div class="container">',
    '\t\t\t\t\t<div class="table-overview">',
    '\t\t\t\t\t\t<?php foreach ( $crooz_overview as $crooz_label => $crooz_value ) : ?>',
    '\t\t\t\t\t\t\t<dl>',
    '\t\t\t\t\t\t\t\t<dt><?php echo esc_html( $crooz_label ); ?></dt>',
    '\t\t\t\t\t\t\t\t<dd><?php echo esc_html( $crooz_value ); ?></dd>',
    '\t\t\t\t\t\t\t</dl>',
    '\t\t\t\t\t\t<?php endforeach; ?>',
    '\t\t\t\t\t</div>',
    '\t\t\t\t</div>',
    '\t\t\t</div>',
    '\t\t</div>',
    '\t</main>',
    '</article>',
    '<?php',
    "get_template_part( 'template-parts/breadcrumb' );",
    'get_footer();',
  ];
  F[T + 'page-overview.php'] = [...OV_HEAD, ...OV_DATA, ...OV_LOOP, ''].join('\n');

  /* ---------------------------------------------------------------- 事業紹介: page-business.php (sections from the live page) */
  const bizHtml = (S && S.pages && S.pages.business && S.pages.business.pc) || '';
  const BUSINESS = [...bizHtml.matchAll(/<section class="section-block">([\s\S]*?)<\/section>/g)].map((m) => {
    const s = m[1];
    const title = ((s.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '').replace(/<br[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const paras = [...s.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((x) => x[1].replace(/\s+/g, ' ').trim());
    const img = s.match(/<img[^>]*src="[^"]*\/([^"/]+?)\.webp"[^>]*alt="([^"]*)"/) || [];
    return { title, paras, img: img[1] ? img[1] + '.webp' : '', alt: img[2] || '' };
  });
  const BIZ_DATA = [
    '$crooz_sections = array(',
    ...BUSINESS.flatMap((b) => [
      '\tarray(',
      `\t\t'title' => '${php(b.title)}',`,
      `\t\t'image' => '${php(b.img)}',`,
      `\t\t'alt'   => '${php(b.alt)}',`,
      "\t\t'text'  => array(",
      ...b.paras.map((p) => `\t\t\t'${php(p)}',`),
      '\t\t),',
      '\t),',
    ]),
    ');',
    '',
  ];
  const BIZ_LOOP = [
    '<?php foreach ( $crooz_sections as $crooz_i => $crooz_section ) : ?>',
    '\t<section class="section-block">',
    '\t\t<div class="container">',
    '\t\t\t<div class="section-heading">',
    '\t\t\t\t<div class="section-number"><?php echo esc_html( $crooz_i + 1 ); ?></div>',
    "\t\t\t\t<h3><?php echo esc_html( $crooz_section['title'] ); ?></h3>",
    '\t\t\t</div>',
    '\t\t\t<div class="text-content">',
    "\t\t\t\t<?php foreach ( $crooz_section['text'] as $crooz_p ) : ?>",
    '\t\t\t\t\t<p><?php echo esc_html( $crooz_p ); ?></p>',
    '\t\t\t\t<?php endforeach; ?>',
    '\t\t\t</div>',
    '\t\t\t<div class="image-block">',
    "\t\t\t\t<img src=\"<?php echo esc_url( get_theme_file_uri( 'img/' . $crooz_section['image'] ) ); ?>\" alt=\"<?php echo esc_attr( $crooz_section['alt'] ); ?>\">",
    '\t\t\t</div>',
    '\t\t</div>',
    '\t</section>',
    '<?php endforeach; ?>',
  ];
  const BIZ_HEAD = [
    '<?php',
    '/**',
    ' * 事業・グループ会社紹介（スラッグ business）',
    ' *',
    ' * @package crooz',
    ' */',
    '',
  ];
  const BIZ_PAGE_TOP = [
    'get_header();',
    '?>',
    '<article class="page-business contents">',
    '\t<main class="main">',
    '\t\t<section class="section-pageTitle">',
    '\t\t\t<div class="container">',
    '\t\t\t\t<h1 class="title-main"><?php the_title(); ?></h1>',
    '\t\t\t</div>',
    '\t\t</section>',
    '\t\t<div class="page-content">',
    '\t\t\t<section class="hero-section">',
    "\t\t\t\t<div class=\"hero-bg\"><img src=\"<?php echo esc_url( get_theme_file_uri( 'img/group-companies-mv.webp' ) ); ?>\" alt=\"ホテルイメージ\"></div>",
    '\t\t\t\t<div class="hero-text">',
    '\t\t\t\t\t<h2>ホテルコンバージョン事業<br>～「国家戦略「観光立国」を支える、<br>既存不動産のインフラ化・価値最大化モデル」～</h2>',
    '\t\t\t\t</div>',
    '\t\t\t</section>',
  ];
  const BIZ_PAGE_END = [
    "\t\t\t<?php get_template_part( 'template-parts/business/group-companies' ); ?>",
    '\t\t</div>',
    '\t</main>',
    '</article>',
    '<?php',
    "get_template_part( 'template-parts/breadcrumb' );",
    'get_footer();',
  ];
  F[T + 'page-business.php'] = [...BIZ_HEAD, ...BIZ_DATA, ...BIZ_PAGE_TOP, ...BIZ_LOOP.map((l) => '\t\t\t' + l), ...BIZ_PAGE_END, ''].join('\n');
  const BIZ_BEFORE_LOOP = [...BIZ_HEAD, ...BIZ_DATA, ...BIZ_PAGE_TOP, ...BIZ_PAGE_END, ''].join('\n');
  F[T + 'template-parts/business/group-companies.php'] = [
    '<div class="logo-card-section">',
    '\t<h4>事業・グループ会社公式ページ</h4>',
    '\t<div class="logo-cards">',
    "\t\t<?php foreach ( array( array( 'CROOZ Hotel ,Inc.', 'https://croozhotel.co.jp/', 'img-assets-01.webp' ), array( 'CROOZ Asset ,Inc.', 'https://croozasset.co.jp', 'img-assets-03.webp' ) ) as $crooz_c ) : ?>",
    '\t\t\t<div class="logo-card"><a class="logo-box" href="<?php echo esc_url( $crooz_c[1] ); ?>" target="_blank" rel="noopener"><p class="logo-name"><?php echo esc_html( $crooz_c[0] ); ?></p></a></div>',
    '\t\t<?php endforeach; ?>',
    '\t</div>',
    '</div>',
    '',
  ].join('\n');

  /* ---------------------------------------------------------------- CSS: the base, the design (scene 2), the smartphone fix (scene 6) */
  const CSS_BASE = [
    '/* =========================================================',
    '   CROOZ main.css',
    '   ========================================================= */',
    '',
    ':root {',
    '  --crooz-blue: #2dafe6;',
    '  --crooz-text: #272727;',
    '}',
    '',
    'body {',
    '  color: var(--crooz-text);',
    '  font-family: "Noto Sans", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;',
    '}',
  ];
  const CSS_DESIGN = [
    '',
    '/* ページタイトル：中央揃え・下にブルーのライン */',
    '.section-pageTitle .title-main {',
    '  font-size: 35px;',
    '  letter-spacing: 0.26em;',
    '  text-align: center;',
    '}',
    '',
    '.section-pageTitle .title-main::after {',
    "  content: '';",
    '  display: block;',
    '  width: 50px;',
    '  height: 4px;',
    '  margin: 30px auto 0;',
    '  background: var(--crooz-blue);',
    '}',
  ];
  const CSS_TABLE = [
    '',
    '/* 会社概要の表（dl ごとに 1 行） */',
    '.page-overview .table-overview dl {',
    '  display: table;',
    '  max-width: 1020px;',
    '  margin: 0 auto;',
    '  border-spacing: 5px 0;',
    '}',
    '',
    '.page-overview .table-overview dt,',
    '.page-overview .table-overview dd {',
    '  display: table-cell;',
    '  padding: 35px 10px;',
    '  vertical-align: middle;',
    '}',
    '',
    '.page-overview .table-overview dt {',
    '  width: 280px;',
    '  border-top: 2px solid #333;',
    '  font-weight: bold;',
    '  text-align: center;',
    '}',
    '',
    '.page-overview .table-overview dd {',
    '  width: 730px;',
    '  border-top: 1px solid #333;',
    '}',
  ];
  const CSS_SP = [
    '',
    '@media screen and (max-width: 640px) {',
    '  .page-overview .table-overview dl,',
    '  .page-overview .table-overview dt,',
    '  .page-overview .table-overview dd {',
    '    display: block;',
    '    width: 100%;',
    '  }',
    '',
    '  .page-overview .table-overview dt {',
    '    padding: 20px 10px;',
    '    text-align: left;',
    '  }',
    '',
    '  .page-overview .table-overview dd {',
    '    padding: 20px 10px;',
    '    border-top: 1px solid #e5e5e5;',
    '  }',
    '}',
  ];
  F[T + 'assets/css/main.css'] = [...CSS_BASE, ...CSS_DESIGN, ...CSS_TABLE, ...CSS_SP, ''].join('\n');
  const CSS_START = [...CSS_BASE, ...CSS_TABLE, ''].join('\n');   // before the design (typed above the table) and the smartphone fix
  F[T + 'assets/js/main.js'] = [
    '/* ヘッダー：グローバルナビのサブメニュー（マウスを乗せると開く） */',
    'jQuery(function ($) {',
    "  $('.gnav a[data-target]').on('mouseenter', function () {",
    "    $('.sub_nav').removeClass('is-open');",
    "    $($(this).data('target')).addClass('is-open');",
    '  });',
    '});',
    '',
  ].join('\n');

  /* ---------------------------------------------------------------- Contact Form 7 (the live form's markup and field names) */
  // first typed with [text* surname] [text* name] — "name" is reserved by WordPress: CF7's config validator flags it
  const CF7_FORM = (bad) => [
    '<div class="form-contact">',
    '<h2>お問い合わせ内容<span>※必須項目</span></h2>',
    '<dl>',
    '<dt class="required"><span>お問い合わせ内容</span></dt>',
    '<dd>[textarea* contact placeholder "ご相談やご質問・ご希望がございましたらご記入ください"]</dd>',
    '</dl>',
    '<h2>お客様情報<span>※必須項目</span></h2>',
    '<dl>',
    '<dt class="required"><span>お名前</span></dt>',
    bad ? '<dd>姓[text* surname class:w30p class:ml15] 名[text* name class:w30p class:ml15]</dd>'
      : '<dd>姓[text* user_surname class:w30p class:ml15] 名[text* user_name class:w30p class:ml15]</dd>',
    '</dl>',
    '<dl>',
    '<dt class="required"><span>メールアドレス</span></dt>',
    '<dd>[email* user_email]</dd>',
    '</dl>',
    '<dl>',
    '<dt class="required"><span>ご住所</span></dt>',
    '<dd>[text* add placeholder "例：東京都渋谷区恵比寿四丁目3番14号 恵比寿SSビル"]</dd>',
    '</dl>',
    '<dl>',
    '<dt>貴社名</dt>',
    '<dd>[text company placeholder "例：クルーズ株式会社"]</dd>',
    '</dl>',
    '<dl>',
    '<dt class="required"><span>電話番号</span></dt>',
    '<dd>[tel* user_tel]</dd>',
    '</dl>',
    '<div class="sendbtn">[submit "こちらの内容で送信"]</div>',
    '</div>',
  ].join('\n');
  const CF7_MAIL = {
    subject: '[_site_title] お問い合わせ（[user_surname] [user_name] 様）',
    body: [
      '[user_surname] [user_name] 様からお問い合わせがありました。',
      '',
      '貴社名：[company]',
      'メールアドレス：[user_email]',
      '電話番号：[user_tel]',
      'ご住所：[add]',
      '',
      'お問い合わせ内容：',
      '[contact]',
      '',
      '--',
      'このメールは [_site_title]（[_site_url]）のお問い合わせフォームから送信されました',
    ].join('\n'),
  };

  window.FILES = {
    files: F, T, NAV_FN, FN_BEFORE_NAV, NAV_HEADER, HEADER_BEFORE_NAV, CSS_START, CSS_DESIGN, CSS_TABLE, CSS_SP,
    OV_HEAD, OV_DATA, OV_LOOP, OVERVIEW, BUSINESS, BIZ_LOOP, BIZ_BEFORE_LOOP, CF7_FORM, CF7_MAIL,
  };
})();
