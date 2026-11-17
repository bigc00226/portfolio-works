/*
 * The theme in VS Code: kyoubashi-wellness (京橋ウェルネスクリニック's own theme — the slug of the live site).
 * page-contact.php carries the static form of the design (the live page still has it as an HTML comment, above the
 * Contact Form 7 form); its other parts are shortened into template parts here. Its file list is a plausible theme
 * layout (the theme's source is not public), its markup / classes are the live page's.
 */
(function () {
  'use strict';
  const F = window.FORMS;
  const lines = (a) => a.join('\n');
  const T = '/wp-content/themes/kyoubashi-wellness';

  const FORM_AT = 19; // first line of the static <form> in page-contact.php (0-based)
  const PAGE_CONTACT = lines([
    '<?php',
    '/**',
    ' * Template Name: お問い合わせ',
    ' */',
    'get_header(); ?>',
    '<main class="main layout-main contact">',
    '    <section class="contact__mv sub-mv">',
    '        <h1 class="sub-mv__title">お問い合わせ</h1>',
    '        <div class="sub-mv__bg">',
    '            <img src="<?php echo esc_url( get_theme_file_uri( \'dist/images/contact/contact-mv.webp\' ) ); ?>" alt="お問い合わせ" width="1920" height="1080" fetchpriority="high">',
    '        </div>',
    '    </section>',
    "    <?php get_template_part( 'template-parts/breadcrumb' ); ?>",
    "    <?php get_template_part( 'template-parts/contact/lead' ); ?>",
    "    <?php get_template_part( 'template-parts/contact/consultation' ); ?>",
    "    <?php get_template_part( 'template-parts/contact/mail-consultation' ); ?>",
    '    <div class="contact__form-wrap">',
    '        <div class="contact__form-inner inner">',
    '            <?php // フォームはデザインのまま（送信先・name 属性は未設定） ?>',
    ...F.STATIC_FORM,
    '        </div>',
    '    </div>',
    '</main>',
    '<?php get_footer(); ?>',
    '',
  ]);
  const FUNCTIONS = lines([
    '<?php',
    '/**',
    ' * kyoubashi-wellness functions',
    ' */',
    '',
    "add_action( 'after_setup_theme', function () {",
    "    add_theme_support( 'title-tag' );",
    "    add_theme_support( 'post-thumbnails' );",
    '} );',
    '',
    "add_action( 'wp_enqueue_scripts', function () {",
    "    $ver = wp_get_theme()->get( 'Version' );",
    "    wp_enqueue_style( 'kw-main', get_theme_file_uri( 'dist/css/style.css' ), [], filemtime( get_theme_file_path( 'dist/css/style.css' ) ) );",
    "    wp_enqueue_script( 'kw-main', get_theme_file_uri( 'dist/js/main.js' ), [], filemtime( get_theme_file_path( 'dist/js/main.js' ) ), true );",
    '} );',
    '',
    "require get_theme_file_path( 'inc/news.php' );",
    '',
  ]);
  const AUTOP = ['// Contact Form 7：自動で p / br を入れない（テーマのマークアップのまま出力）', "add_filter( 'wpcf7_autop_or_not', '__return_false' );"];

  const files = {
    'page-contact.php': PAGE_CONTACT,
    'functions.php': FUNCTIONS,
    'front-page.php': "<?php get_header(); ?>\n<main class=\"main layout-main top\">\n    <?php get_template_part( 'template-parts/top/mv' ); ?>\n    <?php get_template_part( 'template-parts/top/news' ); ?>\n</main>\n<?php get_footer(); ?>\n",
    'page.php': "<?php get_header(); ?>\n<main class=\"main layout-main\">\n    <?php while ( have_posts() ) : the_post(); the_content(); endwhile; ?>\n</main>\n<?php get_footer(); ?>\n",
    'header.php': '<!DOCTYPE html>\n<html <?php language_attributes(); ?>>\n<head>\n<meta charset="<?php bloginfo( \'charset\' ); ?>">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<?php wp_head(); ?>\n</head>\n<body <?php body_class(); ?>>\n<?php get_template_part( \'template-parts/header\' ); ?>\n',
    'footer.php': "<?php get_template_part( 'template-parts/footer' ); ?>\n<?php wp_footer(); ?>\n</body>\n</html>\n",
    'style.css': '',
    'inc/news.php': "<?php\n// お知らせ（news）の一覧・アーカイブ\n",
    'template-parts/breadcrumb.php': "<div class=\"<?php echo esc_attr( get_post_field( 'post_name' ) ); ?>__breadcrumb breadcrumb\">\n    <div class=\"breadcrumb_inner inner\"><?php if ( function_exists( 'bcn_display' ) ) bcn_display(); ?></div>\n</div>\n",
    '.gitignore': 'node_modules/\n',
    'package.json': '{\n  "name": "kyoubashi-wellness",\n  "private": true,\n  "scripts": {\n    "build": "vite build",\n    "deploy": "node scripts/deploy.mjs"\n  }\n}\n',
  };
  const tree = [
    ['dist', 'dir', 0], ['inc', 'dir', 0], ['inc/news.php'], ['scripts', 'dir', 0], ['src', 'dir', 0],
    ['template-parts', 'dir', 1], ['template-parts/contact', 'dir', 0], ['template-parts/top', 'dir', 0], ['template-parts/breadcrumb.php'],
    ['.gitignore'], ['footer.php'], ['front-page.php'], ['functions.php'], ['header.php'], ['package.json'], ['page-contact.php'], ['page.php'], ['style.css'],
  ];
  window.FILES = { files, tree, FORM_AT, FORM_LEN: F.STATIC_FORM.length, AUTOP, T };
})();
