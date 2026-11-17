/*
 * The project shown in VS Code (C:\dev\chiroline-mitakain): the child theme arkhe_child of chiroline-mitakain.com
 * (parent theme: Arkhe by LOOS) in git, with a wp-env for local checks (the production data imported).
 * The live site runs Arkhe with a child theme of that slug, but its source is not public: these files are a
 * reconstruction for the demo. inc/structured-data.php outputs the JSON-LD the live site outputs, character for
 * character (WebSite on the front page; Article on posts and pages, BreadcrumbList of the category on posts — tools/
 * snapshots/wp-chiroline-seo/live-src/*.html); on the live site it may come from elsewhere (see the doc).
 */
(function () {
  'use strict';
  const F = {};
  const T = 'arkhe_child/';

  F['.wp-env.json'] = [
    '{',
    '  "core": null,',
    '  "phpVersion": "8.3",',
    '  "themes": ["https://downloads.wordpress.org/theme/arkhe.zip", "./arkhe_child"],',
    '  "plugins": ["https://downloads.wordpress.org/plugin/seo-simple-pack.zip"],',
    '  "port": 8888,',
    '  "config": {',
    '    "WP_DEBUG": true',
    '  }',
    '}',
  ].join('\n');

  F['package.json'] = [
    '{',
    '  "name": "chiroline-mitakain",',
    '  "private": true,',
    '  "scripts": {',
    '    "start": "wp-env start",',
    '    "stop": "wp-env stop"',
    '  },',
    '  "devDependencies": {',
    '    "@wordpress/env": "^11.4.0"',
    '  }',
    '}',
  ].join('\n');

  F['.gitignore'] = ['node_modules/', '*.log', '.DS_Store', ''].join('\n');

  F['README.md'] = [
    '# chiroline-mitakain.com 子テーマ（arkhe_child）',
    '',
    'カイロライン三鷹整体院のサイト（WordPress・親テーマ Arkhe）の子テーマ。',
    '',
    '- ローカル確認：`npm start`（wp-env：http://localhost:8888、本番データをインポート済み）',
    '- 本番への反映：変更したファイルを `scp` でサーバーの `wp-content/themes/arkhe_child/` へ',
    '',
    '## ファイル',
    '',
    '- `functions.php`：子テーマの CSS、各ファイルの読み込み',
    '- `inc/post-types.php`：カスタム投稿タイプ 症例一覧（/symptoms/）・患者さんの声（/voice/）',
    '- `css/style.css`：サイト全体のスタイル',
    '',
  ].join('\n');

  F['docs/seo-memo.md'] = [
    '# chiroline-mitakain.com SEO 対策メモ（2026-11-09）',
    '',
    '## 現状',
    '- title はテーマ任せ（サイト名 – キャッチフレーズ）、description・OGP なし',
    '- 構造化データ（JSON-LD）なし',
    '- カテゴリーのスラッグが日本語のまま（URL が %e3%82%bb… と長い）、説明文なし',
    '',
    '## 対応',
    '1. SEO SIMPLE PACK（Arkhe と同じ LOOS 製）：title の形式・トップの description・OGP・GA4',
    '2. 主要な固定ページ（料金情報・アクセス・コラム）に個別の description',
    '3. 子テーマで JSON-LD：トップ＝WebSite／投稿・固定ページ＝Article／投稿はカテゴリーの BreadcrumbList',
    '4. カテゴリー：英語のスラッグと説明文（カテゴリーページの description にもなる）',
    '5. JSON-LD はローカルで JSON として読めるか確認してから本番へ',
    '',
    '## トップページの description（院長確認済み）',
    '三鷹で肩こり・腰痛・猫背の改善ならカイロライン三鷹整体院へ。マッサージで治らないつらい症状も、筋肉と背骨の専門家が根本原因にアプローチし改善に導きます。医師も推薦する施術、改善率98%の実績と専門家のアプローチで、長年のつらい腰痛や身体の歪みを整え、健康な体へ導きます。',
    '',
    '## カテゴリー（スラッグ／説明文）',
    '- セルフケア・ストレッチ → self-care',
    '  肩こりや腰痛、猫背などのつらい症状を自分で和らげるための簡単なストレッチやセルフケア方法を専門家が解説します。デスクワークの合間やご自宅でできる予防・改善法で、痛みのない毎日を目指しましょう。',
    '- 身体の仕組みと痛みの原因 → body-mechanism',
    '- 日常生活のヒント・予防法 → lifestyle-tips',
    '- 施術について → treatment-info',
    '- 女性特有のお悩み・産後ケア → womens-care',
    '- 子どもの姿勢と健康 → kids-health',
    '- お知らせ・院長ブログ → information',
    '',
  ].join('\n');
  F.HOME_DESC = '三鷹で肩こり・腰痛・猫背の改善ならカイロライン三鷹整体院へ。マッサージで治らないつらい症状も、筋肉と背骨の専門家が根本原因にアプローチし改善に導きます。医師も推薦する施術、改善率98%の実績と専門家のアプローチで、長年のつらい腰痛や身体の歪みを整え、健康な体へ導きます。';
  F.CAT_DESC = '肩こりや腰痛、猫背などのつらい症状を自分で和らげるための簡単なストレッチやセルフケア方法を専門家が解説します。デスクワークの合間やご自宅でできる予防・改善法で、痛みのない毎日を目指しましょう。';
  F.PRICE_DESC = 'カイロライン三鷹整体院の施術料金です。初回限定の割引料金から、2回目以降の通常料金を掲載しています。各種クレジットカード、電子マネーもご利用いただけますのでご安心ください。';

  F[T + 'style.css'] = [
    '/*',
    'Theme Name: Arkhe Child',
    'Template: arkhe',
    'Description: カイロライン三鷹整体院',
    'Version: 1.0.0',
    '*/',
    '',
  ].join('\n');

  F.FN_REQUIRE = "require_once __DIR__ . '/inc/structured-data.php';";
  F[T + 'functions.php'] = [
    '<?php',
    '/**',
    ' * Arkhe 子テーマ：カイロライン三鷹整体院',
    ' *',
    ' * @package arkhe_child',
    ' */',
    '',
    "add_action( 'wp_enqueue_scripts', 'chiroline_enqueue', 20 );",
    '',
    '/**',
    ' * 子テーマの CSS',
    ' */',
    'function chiroline_enqueue() {',
    "\t$ver = wp_get_theme()->get( 'Version' );",
    "\twp_enqueue_style( 'arkhe-child-style', get_stylesheet_uri(), array( 'arkhe-main-style' ), $ver );",
    "\twp_enqueue_style( 'arkhe-child-custom-style', get_stylesheet_directory_uri() . '/css/style.css', array( 'arkhe-child-style' ), $ver );",
    '}',
    '',
    "require_once __DIR__ . '/inc/post-types.php';",
    F.FN_REQUIRE,
    '',
  ].join('\n');
  F.FN_BEFORE = F[T + 'functions.php'].replace(F.FN_REQUIRE + '\n', '');

  F[T + 'inc/post-types.php'] = [
    '<?php',
    '/**',
    ' * カスタム投稿タイプ：症例一覧（/symptoms/）・患者さんの声（/voice/）',
    ' *',
    ' * @package arkhe_child',
    ' */',
    '',
    "add_action( 'init', 'chiroline_post_types' );",
    '',
    '/**',
    ' * 投稿タイプの登録',
    ' */',
    'function chiroline_post_types() {',
    '\tregister_post_type(',
    "\t\t'symptom',",
    '\t\tarray(',
    "\t\t\t'label'        => '症例一覧',",
    "\t\t\t'public'       => true,",
    "\t\t\t'has_archive'  => 'symptoms',",
    "\t\t\t'rewrite'      => array( 'slug' => 'symptoms', 'with_front' => false ),",
    "\t\t\t'menu_icon'    => 'dashicons-heart',",
    "\t\t\t'show_in_rest' => true,",
    "\t\t\t'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt' ),",
    '\t\t)',
    '\t);',
    '\tregister_post_type(',
    "\t\t'voice',",
    '\t\tarray(',
    "\t\t\t'label'        => '患者さんの声',",
    "\t\t\t'public'       => true,",
    "\t\t\t'has_archive'  => 'voice',",
    "\t\t\t'rewrite'      => array( 'slug' => 'voice', 'with_front' => false ),",
    "\t\t\t'menu_icon'    => 'dashicons-format-quote',",
    "\t\t\t'show_in_rest' => true,",
    "\t\t\t'supports'     => array( 'title', 'editor', 'thumbnail' ),",
    '\t\t)',
    '\t);',
    '}',
    '',
  ].join('\n');

  // inc/structured-data.php: pasted up to the Article, the category's BreadcrumbList typed (SD_CRUMB; the typo: a comma
  // after the itemListElement array — SD_CRUMB_TYPO)
  F.SD_HEAD = [
    '<?php',
    '/**',
    ' * 構造化データ（JSON-LD）',
    ' * - トップページ：WebSite（サイト内検索）',
    ' * - 投稿・固定ページ：Article（投稿はカテゴリーのパンくず BreadcrumbList も）',
    ' * description は SEO SIMPLE PACK が出力するディスクリプションと同じもの',
    ' *',
    ' * @package arkhe_child',
    ' */',
    '',
    "add_filter( 'ssp_output_description', 'chiroline_keep_description' );",
    "add_action( 'wp_footer', 'chiroline_json_ld', 99 );",
    '',
    '/**',
    ' * SEO SIMPLE PACK のディスクリプションを JSON-LD でも使う',
    ' *',
    ' * @param string $description ディスクリプション.',
    ' */',
    'function chiroline_keep_description( $description ) {',
    "\t$GLOBALS['chiroline_description'] = $description;",
    '\treturn $description;',
    '}',
    '',
    '/**',
    ' * JSON-LD を出力する',
    ' */',
    'function chiroline_json_ld() {',
    '\tif ( is_front_page() ) {',
    "\t\t$json = '[{",
    '\t\t\t"@context": "http://schema.org",',
    '\t\t\t"@type": "WebSite",',
    "\t\t\t\"url\": \"' . esc_url( home_url( '/' ) ) . '\",",
    '\t\t\t"potentialAction": {',
    '\t\t\t"@type": "SearchAction",',
    "\t\t\t\"target\": \"' . esc_url( home_url( '/' ) ) . '?s={s}\",",
    '\t\t\t"query-input": "name=s required"',
    '\t\t\t}',
    "\t\t}]';",
    "\t} elseif ( is_singular( array( 'post', 'page' ) ) ) {",
    "\t\t$json = '[{",
    '\t\t"@context": "http://schema.org",',
    '\t\t"@type": "Article",',
    '\t\t"mainEntityOfPage":{',
    '\t\t\t"@type":"WebPage",',
    "\t\t\t\"@id\":\"' . esc_url( get_permalink() ) . '\"",
    '\t\t},',
    "\t\t\"headline\":\"' . esc_html( get_the_title() ) . '\",",
    '\t\t"image": {',
    '\t\t\t"@type": "ImageObject",',
    "\t\t\t\"url\": \"' . esc_url( get_the_post_thumbnail_url( null, 'large' ) ) . '\"",
    '\t\t},',
    "\t\t\"datePublished\": \"' . get_the_date( 'Y-m-d H:i:s' ) . '\",",
    "\t\t\"dateModified\": \"' . get_the_modified_date( 'Y-m-d H:i:s' ) . '\",",
    '\t\t"author": {',
    '\t\t\t"@type": "Person",',
    "\t\t\t\"name\": \"' . esc_html( get_the_author_meta( 'display_name', get_post_field( 'post_author' ) ) ) . '\"",
    '\t\t},',
    '\t\t"publisher": {',
    '\t\t\t"@type": "Organization",',
    "\t\t\t\"name\": \"' . esc_html( get_bloginfo( 'name' ) ) . '\",",
    '\t\t\t"logo": {',
    '\t\t\t\t"@type": "ImageObject",',
    "\t\t\t\t\"url\": \"' . esc_url( home_url( '/wp-content/uploads/2025/10/logo.jpg' ) ) . '\"",
    '\t\t\t}',
    '\t\t},',
    "\t\t\"description\": \"' . esc_html( $GLOBALS['chiroline_description'] ?? '' ) . '\"",
    "\t}';",
  ];
  F.SD_CRUMB = [
    '\t\tif ( is_single() && get_the_category() ) {',
    '\t\t\t$cat   = get_the_category()[0];',
    "\t\t\t$json .= ',{",
    '\t\t"@context": "http://schema.org",',
    '\t\t"@type": "BreadcrumbList",',
    "\t\t\"itemListElement\": [{\"@type\": \"ListItem\",\"position\": 1,\"item\": {\"@id\": \"' . esc_url( get_category_link( $cat ) ) . '\",\"name\": \"' . esc_html( $cat->name ) . '\"}}]",
    "\t}';",
    '\t\t}',
  ];
  F.SD_TYPO_LINE = 5;   // SD_CRUMB[5]: typed with a "," after "}}]"
  F.SD_TAIL = [
    "\t\t$json .= ']';",
    '\t} else {',
    '\t\treturn;',
    '\t}',
    "\techo '<script type=\"application/ld+json\">' . $json . '</script>' . \"\\n\";",
    '}',
    '',
  ];
  F[T + 'inc/structured-data.php'] = [...F.SD_HEAD, ...F.SD_CRUMB, ...F.SD_TAIL].join('\n');

  F[T + 'css/style.css'] = [
    '@charset "UTF-8";',
    '/* カイロライン三鷹整体院：サイト全体のスタイル（Arkhe の上書き） */',
    '',
  ].join('\n');

  window.FILES = { files: Object.fromEntries(Object.entries(F).filter(([k]) => /[./]/.test(k) && !/^[A-Z_]+$/.test(k))), T, ...F };
})();
