/*
 * The WordPress project as it appears in the code editor (notahotel-wp: wp-env + a classic theme "notahotel"),
 * plus a small syntax highlighter (VS Code "Dark+" colours) for PHP templates, JSON, YAML and CSS.
 *
 * notahotel.com itself is not built with WordPress (it is a Next.js site). The theme here is a reconstruction for the
 * demo: its templates carry the live site's markup (class names, attributes, inline SVG — taken from the captured page
 * at runtime), with WordPress template tags where the content comes from the CMS. File names and the build steps
 * (tokens -> theme.json) are the demo's own.
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const doc = new DOMParser().parseFromString(S.html.pc, 'text/html');
  const q = (s) => doc.querySelector(s);
  const V = S.vars || {};
  const hex = (v) => { v = String(v || '').trim().replace('#', ''); if (v.length === 3) v = v.split('').map((c) => c + c).join(''); return '#' + v.toLowerCase(); };

  /* --------------------------------------------------- markup "decompiler" for display */
  const VOID = new Set(['img', 'br', 'source', 'input', 'meta', 'link', 'path', 'circle', 'rect']);
  const INLINE = new Set(['a', 'span', 'br', 'b', 'strong', 'em', 'small', 'img', 'code', 'svg', 'path', 'circle']);
  const unlocal = (v) => String(v).replace(/assets\/site\/[^"' )]+/g, (p) => '…/' + p.split('/').pop());
  function attrs(el, skip = []) {
    return [...el.attributes].filter((a) => !skip.includes(a.name)).map((a) => {
      if (a.name === 'style' && el.hasAttribute('data-scroll')) return '';     // set by the scroll-in script at runtime
      if (a.name === 'style' && el.hasAttribute('data-fadein')) return '';
      if (a.value === '') return ' ' + a.name + (a.name === 'class' ? '=""' : '');
      return ` ${a.name}="${unlocal(a.value).replace(/"/g, '&quot;')}"`;
    }).join('');
  }
  /** one-line html of an element (svg stays on one line, as editors keep pasted icons) */
  function oneLine(el) {
    if (el.nodeType === 3) return el.textContent.replace(/\s+/g, ' ');
    if (el.nodeType !== 1) return '';
    const t = el.tagName.toLowerCase();
    const tag = el.namespaceURI === 'http://www.w3.org/2000/svg' ? el.tagName : t;
    if (VOID.has(t) && !el.childNodes.length) return `<${tag}${attrs(el)}${t === 'path' || t === 'circle' || t === 'rect' ? '></' + tag + '>' : '>'}`;
    return `<${tag}${attrs(el)}>${[...el.childNodes].map(oneLine).join('')}</${tag}>`;
  }
  const allInline = (el) => [...el.childNodes].every((c) => c.nodeType === 3 || (c.nodeType === 1 && INLINE.has(c.tagName.toLowerCase()) && allInline(c)));
  function fmtNode(node, depth, out, o = {}) {
    const pad = '\t'.repeat(depth);
    if (node.nodeType === 3) { const t = node.textContent.replace(/\s+/g, ' ').trim(); if (t) out.push(pad + t); return; }
    if (node.nodeType !== 1) return;
    const t = node.tagName.toLowerCase();
    if (o.replace && o.replace(node, depth, out)) return;
    if (t === 'svg' || allInline(node)) { out.push(pad + oneLine(node)); return; }
    out.push(`${pad}<${t}${attrs(node)}>`);
    node.childNodes.forEach((c) => fmtNode(c, depth + 1, out, o));
    out.push(`${pad}</${t}>`);
  }
  function markup(el, depth = 0, o = {}) { const out = []; if (el) fmtNode(el, depth, out, o); return out; }

  /* ------------------------------------------------------------------------ files */
  const F = {};

  F['.wp-env.json'] = JSON.stringify({
    phpVersion: '8.3',
    plugins: ['https://downloads.wordpress.org/plugin/advanced-custom-fields.latest-stable.zip', 'https://downloads.wordpress.org/plugin/wordpress-importer.latest-stable.zip'],
    themes: ['./wp-content/themes/notahotel'],
    mappings: { 'wp-content/uploads': './wp-content/uploads', 'wp-content/import': './import' },
    config: { WP_DEBUG: true, WP_DEBUG_DISPLAY: true, WP_ENVIRONMENT_TYPE: 'local' },
  }, null, 2);

  F['package.json'] = JSON.stringify({
    name: 'notahotel-wp', private: true,
    scripts: { tokens: 'node scripts/tokens-to-theme-json.mjs', 'wp-env': 'wp-env' },
    devDependencies: { '@wordpress/env': '^10.32.0' },
  }, null, 2);

  /* design tokens as exported from Figma (variables -> W3C design tokens JSON) */
  const COLORS = [
    ['black', 'Black', V['--color-black'] || '#000'],
    ['ink', 'Ink', '#0b0b0d'],
    ['white', 'White', V['--color-white'] || '#fff'],
    ['white-dark', 'White Dark', V['--color-white-dark'] || '#e5e5e5'],
    ['highlight', 'Highlight', V['--color-highlight'] || '#0171e3'],
    ['highlight-dark', 'Highlight Dark', V['--color-highlight-dark'] || '#0055b2'],
    ['green', 'Green', V['--color-green'] || '#42d083'],
    ['exclusive-gold', 'Exclusive Gold', '#e6c292'],
  ].map(([slug, name, c]) => ({ slug, name, color: hex(c) }));
  const FONTS = [
    ['text', 'Text（日本語）', V['--font-family-text'] || 'YakuHanJP, "Hiragino Sans", Meiryo, sans-serif'],
    ['english', 'English', V['--font-family-english'] || 'neue-haas-grotesk-text, "Helvetica Neue", Arial, sans-serif'],
    ['english-highlight', 'English Highlight', V['--font-family-english-highlight'] || '"Manuka Condensed", "Helvetica Neue", Arial, sans-serif'],
  ].map(([slug, name, fontFamily]) => ({ slug, name, fontFamily: fontFamily.replace(/\s+/g, ' ').trim() }));
  const LAYOUT = [
    ['padding-inline', V['--padding-inline'] || '48px'], ['gutter', V['--gutter'] || '24px'], ['section-padding-block', V['--section-padding-block'] || '60px'],
    ['header-height', V['--header_height'] || '62px'], ['max-component-width', V['--max-component-width'] || '1120px'], ['width-column-12', V['--width-column-12'] || '1392px'],
  ];
  const tokens = {
    color: Object.fromEntries(COLORS.map((c) => [c.slug, { $type: 'color', $value: c.color.toUpperCase() }])),
    font: Object.fromEntries(FONTS.map((f) => [f.slug, { $type: 'fontFamily', $value: f.fontFamily }])),
    size: { 'heading-section': { $type: 'dimension', $value: '20px' }, 'display-house': { $type: 'dimension', $value: '64px' }, body: { $type: 'dimension', $value: '16px' }, caption: { $type: 'dimension', $value: '12px' } },
    layout: Object.fromEntries(LAYOUT.map(([k, v]) => [k, { $type: 'dimension', $value: v }])),
  };
  const TOKENS_JSON = JSON.stringify(tokens, null, 2);
  F['tokens/figma-variables.json'] = TOKENS_JSON;

  F['wp-content/themes/notahotel/theme.json'] = JSON.stringify({
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings: {
      appearanceTools: true,
      layout: { contentSize: LAYOUT[4][1], wideSize: LAYOUT[5][1] },
      color: { defaultPalette: false, defaultGradients: false, palette: COLORS },
      typography: {
        defaultFontSizes: false,
        fontFamilies: FONTS.map((f) => f.slug === 'english-highlight'
          ? { ...f, fontFace: [{ fontFamily: 'Manuka Condensed', fontWeight: '700', src: ['file:./assets/fonts/manuka-condensed-bold.woff2'] }] } : f),
        fontSizes: [
          { slug: 'caption', name: 'Caption', size: '12px' }, { slug: 'body', name: 'Body', size: '16px' },
          { slug: 'heading-section', name: 'Section heading', size: '20px' }, { slug: 'display-house', name: 'Display（ハウス名）', size: '64px' },
        ],
      },
      spacing: { spacingSizes: LAYOUT.slice(0, 3).map(([k, v]) => ({ slug: k, name: k, size: v })) },
      custom: { headerHeight: LAYOUT[3][1] },
    },
    styles: {
      color: { background: 'var(--wp--preset--color--white)', text: 'var(--wp--preset--color--black)' },
      typography: { fontFamily: 'var(--wp--preset--font-family--text)' },
      elements: { link: { color: { text: 'var(--wp--preset--color--highlight)' } } },
    },
  }, null, 2);
  const THEME_JSON_STUB = JSON.stringify({ $schema: 'https://schemas.wp.org/trunk/theme.json', version: 3, settings: {}, styles: {} }, null, 2);

  F['wp-content/themes/notahotel/style.css'] = [
    '/*',
    'Theme Name: NOT A HOTEL',
    'Theme URI: https://notahotel.com/',
    'Description: NOT A HOTEL Web サイト（Brand Guidelines v1.0 / Figma「NOT A HOTEL — Brand / Web」準拠）',
    'Version: 1.0.0',
    'Requires at least: 6.6',
    'Requires PHP: 8.1',
    'Text Domain: notahotel',
    '*/',
  ].join('\n');

  F['wp-content/themes/notahotel/functions.php'] = [
    '<?php',
    '/**',
    ' * NOT A HOTEL theme',
    ' */',
    "require_once __DIR__ . '/inc/post-types.php';",
    "require_once __DIR__ . '/inc/acf.php';",
    '',
    "add_action( 'after_setup_theme', function () {",
    "\tadd_theme_support( 'title-tag' );",
    "\tadd_theme_support( 'post-thumbnails' );",
    "\tadd_theme_support( 'editor-styles' );",
    "\tadd_editor_style( 'assets/css/editor.css' );",
    '} );',
    '',
    "add_action( 'wp_enqueue_scripts', function () {",
    "\t$ver = wp_get_theme()->get( 'Version' );",
    "\twp_enqueue_style( 'notahotel', get_theme_file_uri( 'assets/css/notahotel.css' ), [], $ver );",
    "\twp_enqueue_style( 'notahotel-fonts', 'https://use.typekit.net/iuk6fsa.css', [], null );",
    "\twp_enqueue_style( 'yakuhanjp', 'https://cdn.jsdelivr.net/npm/yakuhanjp@3.4.1/dist/css/yakuhanjp.min.css', [], null );",
    "\twp_enqueue_script( 'notahotel', get_theme_file_uri( 'assets/js/notahotel.js' ), [], $ver, [ 'strategy' => 'defer' ] );",
    '',
    '\t// フロントはテーマの CSS だけを出す（theme.json はブロックエディター側のデザイントークンに使う）',
    "\twp_dequeue_style( 'wp-block-library' );",
    "\twp_dequeue_style( 'global-styles' );",
    "\twp_dequeue_style( 'classic-theme-styles' );",
    '}, 20 );',
  ].join('\n');

  const POST_TYPES = [
    '<?php',
    '/**',
    ' * ハウス（ラインナップ）— Figma: Card / House のプロパティ ＝ ACF のフィールド',
    ' */',
    "add_action( 'init', function () {",
    "\tregister_post_type( 'house', [",
    "\t\t'labels'        => [ 'name' => 'ラインナップ', 'singular_name' => 'ハウス', 'add_new_item' => 'ハウスを追加' ],",
    "\t\t'public'        => true,",
    "\t\t'show_in_rest'  => true,",
    "\t\t'menu_position' => 5,",
    "\t\t'menu_icon'     => 'dashicons-admin-home',",
    "\t\t'supports'      => [ 'title', 'thumbnail', 'page-attributes' ],",
    "\t\t'has_archive'   => 'shop',",
    "\t\t'rewrite'       => [ 'slug' => 'shop', 'with_front' => false ],",
    '\t] );',
    '} );',
  ].join('\n');
  F['wp-content/themes/notahotel/inc/post-types.php'] = POST_TYPES;
  const LABELS_LINE = "\t\t'labels'        => [ 'name' => 'ラインナップ', 'singular_name' => 'ハウス', 'add_new_item' => 'ハウスを追加' ],";

  F['wp-content/themes/notahotel/inc/acf.php'] = [
    '<?php',
    '// ACF: フィールドグループはテーマの acf-json/ で管理（Git で差分を追える）',
    "add_filter( 'acf/settings/save_json', fn() => get_theme_file_path( 'acf-json' ) );",
    "add_filter( 'acf/settings/load_json', fn( $paths ) => [ ...$paths, get_theme_file_path( 'acf-json' ) ] );",
    '',
    '// トップのヒーロー（スライド）はオプションページで編集',
    "add_action( 'acf/init', function () {",
    "\tacf_add_options_page( [ 'page_title' => 'トップページ設定', 'menu_slug' => 'top-settings', 'icon_url' => 'dashicons-format-video' ] );",
    '} );',
  ].join('\n');

  /* ACF field group (local JSON) */
  const FIELDS = [
    ['field_house_place', 'エリア', 'place', 'text', 'YUGAWARA'],
    ['field_house_concept', 'ショートコンセプト', 'short_concept', 'text', ''],
    ['field_house_sales', '販売区分', 'sales_type', 'select', 'on_sale'],
    ['field_house_price', '価格表示', 'price_label', 'text', '3,452万円〜'],
    ['field_house_new', 'NEW ラベル', 'is_new', 'true_false', ''],
    ['field_house_path', '詳細ページのパス', 'detail_path', 'text', '/shop/yugawara/onsen-suite'],
  ];
  F['wp-content/themes/notahotel/acf-json/group_house.json'] = JSON.stringify({
    key: 'group_house', title: 'ハウス情報',
    fields: FIELDS.map(([key, label, name, type]) => Object.assign({ key, label, name, type },
      type === 'select' ? { choices: { on_sale: '販売中', exclusive: 'EXCLUSIVE', waitlist: 'キャンセル待ち' } } : {})),
    location: [[{ param: 'post_type', operator: '==', value: 'house' }]],
    position: 'normal', style: 'default',
  }, null, 2);

  /* header.php — the live header markup (logo svg on one line, the navigation as a template part) */
  const header = q('header#header');
  const headerLines = markup(header, 0, {
    replace(node, depth, out) {
      if (node.classList && [...node.classList].some((c) => /_wrapper$/.test(c)) && node.closest('header') && node !== header && node.querySelector('ul')) {
        out.push('\t'.repeat(depth) + "<?php get_template_part( 'template-parts/global-nav' ); ?>");
        return true;
      }
      return false;
    },
  });
  F['wp-content/themes/notahotel/header.php'] = [
    '<?php',
    '/**',
    ' * 共通ヘッダー（Figma: Header / PC・SP）',
    ' */',
    '?><!DOCTYPE html>',
    '<html <?php language_attributes(); ?>>',
    '<head>',
    '<meta charset="<?php bloginfo( \'charset\' ); ?>">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">',
    '<?php wp_head(); ?>',
    '</head>',
    '<body>',
    '<?php wp_body_open(); ?>',
    ...headerLines,
  ].join('\n');

  F['wp-content/themes/notahotel/footer.php'] = [
    "<?php get_template_part( 'template-parts/footer/sitemap' ); ?>",
    "<?php get_template_part( 'template-parts/footer/corp' ); ?>",
    '<?php wp_footer(); ?>',
    '</body>',
    '</html>',
  ].join('\n');

  /* front-page.php — lineup section from the live markup, the cards from WP_Query */
  const lineup = q('section[class*="NK4ZyG_wrapper"]');
  const title = lineup && lineup.querySelector('[class*="titleContainer"]');
  const more = lineup && lineup.querySelector(':scope > [class*="container"] > a, :scope a[class*="primaryTextLink"]');
  const listCls = (lineup && lineup.querySelector('[class*="propertyList"]') || {}).className || 'NK4ZyG_propertyList';
  const carCls = (lineup && lineup.querySelector('[class*="propertyCarousel"]') || {}).className || 'NK4ZyG_propertyCarousel';
  const QUERY = [
    "$houses = new WP_Query( [ 'post_type' => 'house', 'posts_per_page' => 8, 'orderby' => [ 'menu_order' => 'ASC', 'date' => 'DESC' ] ] );",
    "$slides = get_field( 'hero_slides', 'option' );",
  ];
  const FRONT = [
    '<?php',
    '/**',
    ' * トップページ（Figma: Web — Top / Home・PC 1440・SP 375）',
    ' */',
    'get_header();',
    '',
    '__QUERY__',
    '?>',
    '<main>',
    "\t<?php get_template_part( 'template-parts/home/hero', null, [ 'slides' => $slides ] ); ?>",
    `\t<section class="${lineup ? lineup.className : 'NK4ZyG_wrapper'}" data-scroll="normal">`,
    ...markup(title, 2),
    `\t\t<div class="${(lineup && lineup.querySelector('[class*="_container"]') || {}).className || 'NK4ZyG_container'}">`,
    `\t\t\t<div class="${listCls}">`,
    '\t\t\t\t<?php while ( $houses->have_posts() ) : $houses->the_post(); ?>',
    "\t\t\t\t\t<?php get_template_part( 'template-parts/house-card' ); ?>",
    '\t\t\t\t<?php endwhile; ?>',
    '\t\t\t</div>',
    `\t\t\t<div class="${carCls}">`,
    "\t\t\t\t<?php get_template_part( 'template-parts/home/lineup-carousel', null, [ 'houses' => $houses ] ); ?>",
    '\t\t\t</div>',
    '\t\t</div>',
    ...(more ? [`\t\t${oneLine(more)}`] : []),
    '\t</section>',
    "\t<?php get_template_part( 'template-parts/home/cta-footer' ); ?>",
    "\t<?php get_template_part( 'template-parts/home/features' ); ?>",
    "\t<?php get_template_part( 'template-parts/home/catalog' ); ?>",
    "\t<?php get_template_part( 'template-parts/home/news' ); ?>",
    "\t<?php get_template_part( 'template-parts/home/stories' ); ?>",
    '</main>',
    '<?php',
    'wp_reset_postdata();',
    'get_footer();',
  ];
  F['wp-content/themes/notahotel/front-page.php'] = FRONT.join('\n').replace('__QUERY__', QUERY.join('\n'));
  const FRONT_BEFORE = FRONT.join('\n').replace('__QUERY__\n', '');

  /* template-parts/house-card.php — the live card markup with the ACF fields */
  const card = lineup && lineup.querySelector('[class*="propertyList"] > a');
  const cls = (frag) => { const el = card && card.querySelector(`[class*="${frag}"]`); return el ? [...el.classList].find((c) => c.includes(frag)) : 'NK4ZyG_' + frag; };
  const priceP = card && card.querySelector('[class*="_price"]');
  const exclusiveSvg = (() => { const s = doc.querySelector('[class*="propertyList"] svg[aria-label="EXCLUSIVE"]'); return s ? oneLine(s) : ''; })();
  const CARD = [
    '<?php',
    '/**',
    ' * ラインナップのカード（Figma: Card / House — プロパティ ＝ ACF フィールド）',
    ' */',
    "$type  = get_field( 'sales_type' );",
    "$price = get_field( 'price_lable' );",
    '?>',
    `<a href="<?php echo esc_attr( get_field( 'detail_path' ) ); ?>"><section class="${cls('_card')}" data-scroll="normal" data-theme="light" data-layout="default">`,
    `\t<div class="${cls('pictureContainer')}">`,
    `\t\t<div class="${cls('propertyNameContainer')}"><h3 class="${cls('propertyName')}"><?php the_title(); ?></h3></div>`,
    `\t\t<?php if ( get_field( 'is_new' ) ) : ?><span class="${cls('statusLabel')}">NEW</span><?php endif; ?>`,
    "\t\t<img src=\"<?php the_post_thumbnail_url( 'full' ); ?>\" alt=\"\" loading=\"lazy\">",
    '\t</div>',
    `\t<div class="${cls('cardInner')}">`,
    `\t\t<div class="${cls('cardDetails')}">`,
    `\t\t\t<p class="${cls('placeName')}"><?php the_field( 'place' ); ?></p>`,
    `\t\t\t<p class="${cls('shortConcept')}"><?php the_field( 'short_concept' ); ?></p>`,
    '\t\t</div>',
    `\t\t<div class="${cls('cardBottom')}">`,
    `\t\t\t<p class="${priceP ? [...priceP.classList].join(' ') : 'NK4ZyG_price'}" data-theme="light" data-component-name="price"><?php`,
    "\t\t\tif ( 'exclusive' === $type ) :",
    `\t\t\t\t?>${exclusiveSvg}<?php`,
    "\t\t\telseif ( 'waitlist' === $type ) :",
    `\t\t\t\t?><span class="${cls('soldOutText')}">キャンセル待ち</span><?php`,
    '\t\t\telse :',
    '\t\t\t\techo esc_html( $price );',
    '\t\t\tendif;',
    '\t\t\t?></p>',
    '\t\t</div>',
    '\t</div>',
    '</section></a>',
  ].join('\n');
  F['wp-content/themes/notahotel/template-parts/house-card.php'] = CARD;
  const PRICE_TYPO = "$price = get_field( 'price_lable' );";
  const PRICE_OK = "$price = get_field( 'price_label' );";

  F['.github/workflows/deploy.yml'] = [
    'name: Deploy theme to production',
    'on:',
    '  push:',
    '    branches: [main]',
    '    paths: ["wp-content/themes/notahotel/**"]',
    'jobs:',
    '  deploy:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - name: Checkout',
    '        uses: actions/checkout@v4',
    '      - name: Sync theme (rsync)',
    '        run: rsync -az --delete wp-content/themes/notahotel/ "$DEPLOY_USER@$DEPLOY_HOST:/var/www/notahotel/wp-content/themes/notahotel/"',
    '      - name: Flush cache',
    '        run: ssh "$DEPLOY_USER@$DEPLOY_HOST" "wp cache flush --path=/var/www/notahotel"',
  ].join('\n');

  /** explorer tree (folders open/closed at start) */
  const TREE = [
    ['.github', 'dir', 0], ['.github/workflows', 'dir', 1], ['.github/workflows/deploy.yml'],
    ['import', 'dir', 0], ['import/houses.xml'],
    ['node_modules', 'dir', 0],
    ['scripts', 'dir', 0], ['scripts/tokens-to-theme-json.mjs'],
    ['tokens', 'dir', 1], ['tokens/figma-variables.json'],
    ['wp-content', 'dir', 1], ['wp-content/themes', 'dir', 1], ['wp-content/themes/notahotel', 'dir', 1],
    ['wp-content/themes/notahotel/acf-json', 'dir', 0], ['wp-content/themes/notahotel/acf-json/group_house.json'],
    ['wp-content/themes/notahotel/assets', 'dir', 0],
    ['wp-content/themes/notahotel/inc', 'dir', 1], ['wp-content/themes/notahotel/inc/acf.php'], ['wp-content/themes/notahotel/inc/post-types.php'],
    ['wp-content/themes/notahotel/template-parts', 'dir', 1], ['wp-content/themes/notahotel/template-parts/footer', 'dir', 0], ['wp-content/themes/notahotel/template-parts/home', 'dir', 0],
    ['wp-content/themes/notahotel/template-parts/global-nav.php'], ['wp-content/themes/notahotel/template-parts/house-card.php'],
    ['wp-content/themes/notahotel/footer.php'], ['wp-content/themes/notahotel/front-page.php'], ['wp-content/themes/notahotel/functions.php'],
    ['wp-content/themes/notahotel/header.php'], ['wp-content/themes/notahotel/index.php'], ['wp-content/themes/notahotel/screenshot.png'],
    ['wp-content/themes/notahotel/style.css'], ['wp-content/themes/notahotel/theme.json'],
    ['wp-content/uploads', 'dir', 0],
    ['.gitignore'], ['.wp-env.json'], ['package.json'],
  ];

  /* ------------------------------------------------------------- highlighter */
  const langOf = (path) => {
    const ext = path.split('.').pop();
    return { php: 'php', css: 'css', json: 'json', yml: 'yaml', md: 'md', html: 'html', mjs: 'php', xml: 'html' }[ext] || 'txt';
  };
  const PHP_RE = /(\/\/.*$|#(?!\[).*$|\/\*.*?(\*\/|$))|('(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?)|\b(if|else|elseif|endif|while|endwhile|foreach|endforeach|for|return|require_once|require|include|echo|new|fn|function|use|as)\b|\b(true|false|null|array)\b|(\$[A-Za-z_]\w*)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_]\w*)(?=\s*\()|\b([A-Z][A-Za-z_]+)\b|(=>|->|::|\.\.\.|[{}()[\];,.:?=<>!&|+*/-])/g;
  function phpTokens(s, out) {
    let last = 0, m;
    PHP_RE.lastIndex = 0;
    while ((m = PHP_RE.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      const cls = m[1] ? 't-com' : m[3] ? 't-str' : m[4] ? 't-ctl' : m[5] ? 't-kw' : m[6] ? 't-var' : m[7] ? 't-num' : m[8] ? 't-fn' : m[9] ? 't-type' : '';
      out.push([m[0], cls]);
      last = PHP_RE.lastIndex;
      if (m[0] === '') PHP_RE.lastIndex++;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  function htmlTokens(s, st, out) {
    let i = 0;
    while (i < s.length) {
      if (st.tag) {
        const ws = s.slice(i).match(/^\s+/);
        if (ws) { out.push([ws[0], '']); i += ws[0].length; continue; }
        if (s.startsWith('/>', i)) { out.push(['/>', 't-pun']); i += 2; st.tag = false; continue; }
        if (s[i] === '>') { out.push(['>', 't-pun']); i++; st.tag = false; continue; }
        if (s[i] === '"' || s[i] === "'") {
          const qch = s[i]; const e = s.indexOf(qch, i + 1); const j = e < 0 ? s.length : e + 1;
          const v = s.slice(i, j);
          // php inside an attribute value
          if (v.includes('<?php')) { const a = v.indexOf('<?php'), b = v.indexOf('?>', a); out.push([v.slice(0, a), 't-str']); out.push(['<?php', 't-kw']); phpTokens(v.slice(a + 5, b < 0 ? v.length : b), out); if (b >= 0) { out.push(['?>', 't-kw']); out.push([v.slice(b + 2), 't-str']); } }
          else out.push([v, 't-str']);
          i = j; continue;
        }
        if (s[i] === '=') { out.push(['=', '']); i++; continue; }
        const a = s.slice(i).match(/^[^\s=>/"']+/);
        if (a) { out.push([a[0], 't-attr']); i += a[0].length; continue; }
        out.push([s[i], '']); i++; continue;
      }
      if (s.startsWith('<!--', i)) { const e = s.indexOf('-->', i); const j = e < 0 ? s.length : e + 3; out.push([s.slice(i, j), 't-com']); i = j; continue; }
      const t = s.slice(i).match(/^(<\/?)([A-Za-z][\w.:-]*|!DOCTYPE)/);
      if (t) { out.push([t[1], 't-pun']); out.push([t[2], 't-tag']); i += t[0].length; st.tag = true; continue; }
      const txt = s.slice(i).match(/^[^<]+/);
      if (txt) { out.push([txt[0], '']); i += txt[0].length; continue; }
      out.push([s[i], '']); i++;
    }
  }
  /** a PHP template line: html outside <?php … ?>, php inside (state carries over lines) */
  function phpLine(s, st, out) {
    let i = 0;
    while (i < s.length) {
      if (st.php) {
        const e = s.indexOf('?>', i);
        const seg = s.slice(i, e < 0 ? s.length : e);
        phpTokens(seg, out);
        if (e < 0) return;
        out.push(['?>', 't-kw']);
        st.php = false; i = e + 2; continue;
      }
      const k = s.indexOf('<?php', i);
      if (k < 0) { htmlTokens(s.slice(i), st, out); return; }
      const qch = s[k - 1];
      if (k > i && (qch === '"' || qch === "'")) {
        // php inside an attribute value: the whole value is one string token for htmlTokens
        const e = s.indexOf('?>', k);
        const close = e < 0 ? -1 : s.indexOf(qch, e + 2);
        const end = close < 0 ? s.length : close + 1;
        htmlTokens(s.slice(i, end), st, out);
        i = end; continue;
      }
      if (k > i) htmlTokens(s.slice(i, k), st, out);
      out.push(['<?php', 't-kw']);
      st.php = true; i = k + 5;
    }
  }
  function cssTokens(s, out) {
    const tr = s.trim();
    if (!tr) { out.push([s, '']); return; }
    if (/^\/\*|^\*/.test(tr)) { out.push([s, 't-com']); return; }
    const prop = s.match(/^(\s*)([\w-]+)(\s*:\s*)(.*?)(;?)$/);
    if (prop && !/[{,]\s*$/.test(tr)) { out.push([prop[1], '']); out.push([prop[2], 't-prop']); out.push([prop[3], '']); out.push([prop[4], 't-str']); out.push([prop[5], '']); return; }
    out.push([s, 't-sel']);
  }
  function jsonTokens(s, out) {
    const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(\b-?\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      if (m[1]) { out.push([m[1], m[2] ? 't-key' : 't-str']); if (m[2]) out.push([m[2], '']); }
      else if (m[3]) out.push([m[3], 't-num']);
      else out.push([m[4], 't-kw']);
      last = re.lastIndex;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  function yamlTokens(s, out) {
    const c = s.match(/^(\s*)(#.*)$/);
    if (c) { out.push([c[1], '']); out.push([c[2], 't-com']); return; }
    const re = /([\w-]+)(\s*:)|("[^"]*"|'[^']*')|(\b\d+\b|\btrue\b|\bfalse\b)|(-\s)/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), 't-str']);
      if (m[1]) { out.push([m[1], 't-kw']); out.push([m[2], '']); }
      else if (m[3]) out.push([m[3], 't-str']);
      else if (m[4]) out.push([m[4], 't-num']);
      else out.push([m[5], 't-pun']);
      last = re.lastIndex;
    }
    if (last < s.length) out.push([s.slice(last), 't-str']);
  }
  /** tokens for every line of a file: [[text, cls], ...][] */
  function highlight(lang, lines) {
    const res = [];
    const st = { tag: false, php: false };
    for (const s of lines) {
      const out = [];
      if (lang === 'php') phpLine(s, st, out);
      else if (lang === 'css') cssTokens(s, out);
      else if (lang === 'json') jsonTokens(s, out);
      else if (lang === 'yaml') yamlTokens(s, out);
      else if (lang === 'html') htmlTokens(s, st, out);
      else out.push([s, '']);
      res.push(out);
    }
    return res;
  }

  window.ThemeFiles = {
    files: F, tree: TREE, langOf, highlight, markup, oneLine,
    tokens, TOKENS_JSON, THEME_JSON_STUB, COLORS, FONTS, LAYOUT, FIELDS,
    QUERY, FRONT_BEFORE, LABELS_LINE, PRICE_TYPO, PRICE_OK,
  };
})();
