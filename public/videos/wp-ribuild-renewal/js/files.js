/*
 * The project the video works in (C:\dev\ribuild-renewal): wp-env + the new theme "rebuild" (wp-content/themes/rebuild)
 * + its Sass sources (src/scss → assets/css/style.min.css).
 * The markup and class names are the live site's own (ribuild.jp: p-header, p-gnav, p-contactBtn, p-footer …); the
 * PHP around them is written for the video. The same theme files are installed in the WordPress the screens were
 * captured from (tools/snapshots/wp-ribuild-renewal/capture-wp.js), so 外観 > テーマ shows this theme.
 */
(function () {
  'use strict';
  const T = 'wp-content/themes/rebuild/';
  const files = {};

  files['.wp-env.json'] = `{
  "core": "WordPress/WordPress#7.1",
  "phpVersion": "8.3",
  "themes": [ "./wp-content/themes/rebuild" ],
  "plugins": [
    "https://downloads.wordpress.org/plugin/contact-form-7.zip",
    "https://downloads.wordpress.org/plugin/elementor.zip",
    "https://downloads.wordpress.org/plugin/custom-post-type-ui.zip"
  ],
  "config": {
    "WP_DEBUG": true
  }
}`;

  files['package.json'] = `{
  "name": "ribuild-renewal",
  "private": true,
  "scripts": {
    "env": "wp-env start",
    "build": "sass src/scss/style.scss ${T}assets/css/style.min.css --style=compressed --no-source-map",
    "watch": "npm run build -- --watch"
  },
  "devDependencies": {
    "@wordpress/env": "^11.4.0",
    "sass": "^1.93.2"
  }
}`;

  files['README.md'] = `# 整体りびるど リニューアル

- 開発環境：\`npm run env\`（wp-env → http://localhost:8888、管理画面 /wp-admin）
- CSS：\`src/scss\` を編集して \`npm run build\`（assets/css/style.min.css を出力）
- 本番：テーマフォルダ \`rebuild\` を zip にして、外観 > テーマ > テーマのアップロード

## リニューアルの方針

- テーマを Lightning から専用テーマ「rebuild」へ（デザイン刷新）
- 症状別のページは「症状別のお悩み（/symptoms/）」の下にまとめる
- 予約・お問い合わせ：ヘッダーの電話番号と、右下の固定ボタン（ご予約・お問合せ / WEB予約 / 電話予約）
- お問い合わせページは /contact/ へ（旧 URL /お問い合わせ/ は WordPress が 301 で転送）
- LP（四十肩・五十肩）は Elementor のキャンバスのまま
`;

  files[T + 'style.css'] = `@charset "UTF-8";
/*!
Theme Name: 整体りびるど 公式サイト
Author: TONE
Description: 整体りびるど
Version: 1.0
*/
`;

  files[T + 'functions.php'] = `<?php
/**
 * 整体りびるど 公式サイト
 */

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', [ 'search-form', 'gallery', 'caption', 'style', 'script' ] );
} );

add_action( 'wp_enqueue_scripts', function () {
	$ver = fn( $file ) => filemtime( get_theme_file_path( $file ) );
	wp_enqueue_style( 'rebuild', get_theme_file_uri( 'assets/css/style.min.css' ), [], $ver( 'assets/css/style.min.css' ) );
	wp_enqueue_script( 'rebuild-vendor', get_theme_file_uri( 'assets/js/vendor.js' ), [], $ver( 'assets/js/vendor.js' ), true );
	wp_enqueue_script( 'rebuild-common', get_theme_file_uri( 'assets/js/common.js' ), [ 'rebuild-vendor' ], $ver( 'assets/js/common.js' ), true );
	if ( is_front_page() ) {
		wp_enqueue_script( 'rebuild-home', get_theme_file_uri( 'assets/js/home.js' ), [ 'rebuild-common' ], $ver( 'assets/js/home.js' ), true );
	}
} );

/** body のクラス：pg-（スラッグ）。ページごとのスタイル（.pg-home / .pg-contact …）に使う */
add_filter( 'body_class', function ( $classes ) {
	if ( is_front_page() ) {
		$classes[] = 'pg-home';
	} elseif ( is_page() ) {
		$classes[] = 'pg-' . get_post_field( 'post_name', get_queried_object_id() );
	}
	return $classes;
} );

/** 予約・連絡先（ヘッダー・固定ボタン・フッターで共通） */
function rebuild_contact() {
	return [
		'tel'     => '090-6933-8025',
		'web'     => 'https://terasawa.v4.pos-s.net/reserve/',
		'contact' => home_url( '/contact/' ),
	];
}

/** グローバルナビの現在地 */
function rebuild_current( $slug ) {
	if ( 'home' === $slug ) {
		return is_front_page() ? ' is-active' : '';
	}
	$page = get_page_by_path( $slug );
	return $page && ( is_page( $page->ID ) || in_array( $page->ID, get_post_ancestors( get_queried_object_id() ), true ) ) ? ' is-active' : '';
}
`;

  /** typed in the video (functions.php, after rebuild_current()): the old URLs → the new ones (301). Pages keep no old
   *  slug in WordPress (only posts do), so the old /お問い合わせ/ would be a 404 after the slug change */
  const REDIRECT_ADD = [
    '',
    '// リニューアル前の URL を新しい URL へ 301 で転送',
    "add_action( 'template_redirect', function () {",
    '\t$old = [',
    "\t\t'お問い合わせ' => '/contact/',",
    '\t];',
    "\t$last = urldecode( basename( (string) wp_parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ) ) );",
    '\tif ( is_404() && isset( $old[ $last ] ) ) {',
    '\t\twp_safe_redirect( home_url( $old[ $last ] ), 301 );',
    '\t\texit;',
    '\t}',
    '} );',
  ];

  const HEADER_BEFORE = [
    '<!DOCTYPE html>',
    '<html <?php language_attributes(); ?>>',
    '<head>',
    '<meta charset="<?php bloginfo( \'charset\' ); ?>">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<?php wp_head(); ?>',
    '</head>',
    '<body <?php body_class(); ?>>',
    '<?php wp_body_open(); ?>',
    '<div class="l-wrapper">',
    '<header class="p-header js-header">',
    '\t<div class="p-header__inner">',
    '\t\t<h1 class="p-headerLogo">',
    '\t\t\t<a href="<?php echo esc_url( home_url( \'/\' ) ); ?>">',
    '\t\t\t\t<span class="c-logo">',
    '\t\t\t\t\t<img class="c-logo__mark" src="<?php echo esc_url( get_theme_file_uri( \'assets/images/common/logo-mark.png\' ) ); ?>" width="68" height="68" alt="りびるど 戻る整体">',
    '\t\t\t\t\t<img class="c-logo__font" src="<?php echo esc_url( get_theme_file_uri( \'assets/images/common/logo-font.svg\' ) ); ?>" width="90" height="21" alt="整体りびるど">',
    '\t\t\t\t</span>',
    '\t\t\t</a>',
    '\t\t</h1>',
    '\t\t<div class="p-headerMenuArea js-menuArea">',
    '\t\t\t<div class="p-headerSubNav">',
    '\t\t\t\t<ul class="p-headerSubNavList">',
    '\t\t\t\t\t<li class="p-headerSubNavItem p-headerSubNavItem--home"><a href="<?php echo esc_url( home_url( \'/\' ) ); ?>">ホーム</a></li>',
    '\t\t\t\t\t<li class="p-headerSubNavItem"><a href="<?php echo esc_url( home_url( \'/news/\' ) ); ?>">お知らせ</a></li>',
    '\t\t\t\t\t<li class="p-headerSubNavItem"><a href="<?php echo esc_url( home_url( \'/blog/\' ) ); ?>">ブログ</a></li>',
    '\t\t\t\t</ul>',
    '\t\t\t</div>',
    '\t\t\t<nav class="p-gnav">',
    '\t\t\t\t<ul class="p-gnavList">',
    '\t\t\t\t\t<li class="p-gnavItem p-gnavItem--home<?php echo rebuild_current( \'home\' ); ?>">',
    '\t\t\t\t\t\t<a href="<?php echo esc_url( home_url( \'/\' ) ); ?>">ホーム</a>',
    '\t\t\t\t\t</li>',
    '\t\t\t\t\t<li class="p-gnavItem p-gnavItem--about<?php echo rebuild_current( \'about\' ); ?>">',
    '\t\t\t\t\t\t<a href="<?php echo esc_url( home_url( \'/about/\' ) ); ?>">当院について</a>',
    '\t\t\t\t\t\t<?php get_template_part( \'template-parts/gnav-lower\', null, [ \'page\' => \'about\' ] ); ?>',
    '\t\t\t\t\t</li>',
    '\t\t\t\t\t<li class="p-gnavItem p-gnavItem--menu<?php echo rebuild_current( \'menu\' ); ?>">',
    '\t\t\t\t\t\t<a href="<?php echo esc_url( home_url( \'/menu/\' ) ); ?>">施術メニュー・料金</a>',
    '\t\t\t\t\t\t<?php get_template_part( \'template-parts/gnav-lower\', null, [ \'page\' => \'menu\' ] ); ?>',
    '\t\t\t\t\t</li>',
    '\t\t\t\t\t<li class="p-gnavItem p-gnavItem--faq<?php echo rebuild_current( \'faq\' ); ?>">',
    '\t\t\t\t\t\t<a href="<?php echo esc_url( home_url( \'/faq/\' ) ); ?>">よくあるご質問</a>',
    '\t\t\t\t\t</li>',
    '\t\t\t\t\t<li class="p-gnavItem p-gnavItem--voice<?php echo rebuild_current( \'voice\' ); ?>">',
    '\t\t\t\t\t\t<a href="<?php echo esc_url( home_url( \'/voice/\' ) ); ?>">お客様の声</a>',
    '\t\t\t\t\t</li>',
    '\t\t\t\t</ul>',
    '\t\t\t</nav>',
    '\t\t</div>',
    '\t\t<div class="p-headerInfo">',
    '\t\t\t<div class="p-headerAccess">',
    '\t\t\t\t<a href="#access" class="js-closeMenu"><span class="c-icon c-icon--pin"></span><span class="p-headerAccess__txt">アクセス</span></a>',
    '\t\t\t</div>',
    '\t\t\t<div class="p-headerTel">',
    '\t\t\t\t<p class="p-headerTel__label">',
    '\t\t\t\t\t<span class="p-headerTel_icon"><img src="<?php echo esc_url( get_theme_file_uri( \'assets/images/common/icon-tel-header.svg\' ) ); ?>" width="30" height="30" alt=""></span>',
    '\t\t\t\t\tお電話からのご予約',
    '\t\t\t\t</p>',
    '\t\t\t\t<p class="p-headerTel__number"><?php echo esc_html( rebuild_contact()[\'tel\'] ); ?></p>',
    '\t\t\t</div>',
    '\t\t\t<button class="p-headerMenuIcon js-toggleMenu" aria-label="メニュー開閉">',
    '\t\t\t\t<span class="p-headerMenuIcon__bars"><span class="p-headerMenuIcon__bar" aria-hidden="true"></span><span class="p-headerMenuIcon__bar" aria-hidden="true"></span></span>',
    '\t\t\t\t<span class="p-headerMenuIcon__label js-toggleMenuLabel">メニュー</span>',
    '\t\t\t</button>',
    '\t\t</div>',
    '\t</div>',
    '</header>',
    '<?php get_template_part( \'template-parts/contact-btn\' ); ?>',
    '<main class="l-main">',
    '',
  ];
  /** typed in the video: the new item of the global navigation (after 施術メニュー・料金) */
  const NAV_ADD = [
    '\t\t\t\t\t<li class="p-gnavItem p-gnavItem--symptoms<?php echo rebuild_current( \'symptoms\' ); ?>">',
    '\t\t\t\t\t\t<a href="<?php echo esc_url( home_url( \'/symptoms/\' ) ); ?>">症状別のお悩み</a>',
    '\t\t\t\t\t</li>',
  ];
  const NAV_AFTER = '\t\t\t\t\t\t<?php get_template_part( \'template-parts/gnav-lower\', null, [ \'page\' => \'menu\' ] ); ?>';
  files[T + 'header.php'] = HEADER_BEFORE.join('\n');

  files[T + 'footer.php'] = `</main>
<footer class="p-footer">
	<div class="p-footer__links">
		<ul>
			<?php
			$links = [
				'/'         => 'ホーム',
				'/about/'   => '当院について',
				'/menu/'    => '施術メニュー・料金',
				'/faq/'     => 'よくあるご質問',
				'/voice/'   => 'お客様の声',
				'/news/'    => 'お知らせ',
				'/blog/'    => 'ブログ',
				'/contact/' => 'ご予約・お問い合わせ',
			];
			foreach ( $links as $path => $label ) :
				?>
				<li class="c-hvLine"><a href="<?php echo esc_url( home_url( $path ) ); ?>"><?php echo esc_html( $label ); ?></a></li>
			<?php endforeach; ?>
		</ul>
	</div>
	<?php get_template_part( 'template-parts/footer-bnrs' ); ?>
	<p class="p-footer__policy"><a href="<?php echo esc_url( get_privacy_policy_url() ); ?>" class="c-txtLink">プライバシーポリシー</a></p>
	<small class="p-footer__copyright u-en">&copy; REBUILD. ALL RIGHTS RESERVED.</small>
</footer>
</div>
<?php wp_footer(); ?>
</body>
</html>
`;

  const CONTACT_BEFORE = [
    '<?php',
    '/**',
    ' * 予約の固定ボタン（PC：右下に縦並び / スマートフォン：画面下に横並び）',
    ' */',
    '$c = rebuild_contact();',
    '?>',
    '<div class="p-contactBtn js-fixedContact">',
    '\t<div class="p-contactBtnItem p-contactBtnItem--contact">',
    '\t\t<a href="<?php echo esc_url( $c[\'contact\'] ); ?>">',
    '\t\t\t<span class="p-contactBtnItem__icon"><img src="<?php echo esc_url( get_theme_file_uri( \'assets/images/common/icon-contact.svg\' ) ); ?>" width="55" height="55" alt=""></span>',
    '\t\t\t<span class="p-contactBtnItem__label">ご予約<br>お問合せ</span>',
    '\t\t</a>',
    '\t</div>',
    '\t<div class="p-contactBtnItem p-contactBtnItem--line">',
    '\t\t<a href="<?php echo esc_url( $c[\'web\'] ); ?>" target="_blank" rel="noopener noreferrer">',
    '\t\t\t<span class="p-contactBtnItem__icon"><img src="<?php echo esc_url( get_theme_file_uri( \'assets/images/common/icon-web-reserve.svg\' ) ); ?>" width="55" height="55" alt=""></span>',
    '\t\t\t<span class="p-contactBtnItem__label">WEB予約</span>',
    '\t\t</a>',
    '\t</div>',
    '</div>',
    '',
  ];
  /** typed in the video: the phone button (after the WEB予約 button) */
  const TEL_ADD = [
    '\t<div class="p-contactBtnItem p-contactBtnItem--tel">',
    '\t\t<a href="tel:<?php echo esc_attr( str_replace( \'-\', \'\', $c[\'tel\'] ) ); ?>">',
    '\t\t\t<span class="p-contactBtnItem__icon"><img src="<?php echo esc_url( get_theme_file_uri( \'assets/images/common/icon-tel.svg\' ) ); ?>" width="55" height="55" alt=""></span>',
    '\t\t\t<span class="p-contactBtnItem__label">電話予約</span>',
    '\t\t</a>',
    '\t</div>',
  ];
  files[T + 'template-parts/contact-btn.php'] = CONTACT_BEFORE.join('\n');

  files[T + 'template-parts/gnav-lower.php'] = `<?php
/**
 * グローバルナビの下層メニュー（当院について・施術メニュー）
 */
$items = [
	'about' => [
		'philosophy' => '施術方針',
		'therapist'  => 'セラピストのご紹介',
		'features'   => '<span>当院の特徴と</span><span>他院との違い</span>',
		'treatment'  => '<span>対応する症状・</span><span>お悩み</span>',
	],
	'menu'  => [
		'menu'      => '施術メニュー・料金',
		'step'      => '施術までの流れ',
		'guarantee' => '安心保証について',
	],
][ $args['page'] ] ?? [];
?>
<ul class="p-gnavLowerList">
	<?php foreach ( $items as $id => $label ) : ?>
		<li class="p-gnavLowerItem c-hvArr">
			<a href="<?php echo esc_url( home_url( '/' . $args['page'] . '/#' . $id ) ); ?>"><?php echo wp_kses_post( $label ); ?> <span class="c-arr c-arr--key"></span></a>
		</li>
	<?php endforeach; ?>
</ul>
`;

  files[T + 'template-parts/footer-bnrs.php'] = `<div class="p-bnrs">
	<div class="p-bnrs__item">
		<div class="c-partnership c-hvOpacity">
			<p class="c-partnership__ttl">連携医療機関</p>
			<a href="https://takeuchi-seikei.jp/" target="_blank"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/common/bnr-takeuchi.jpg' ) ); ?>" width="200" height="60" alt="武内整形外科クリニック" loading="lazy"></a>
			<p class="c-partnership__name">武内整形外科クリニック</p>
		</div>
	</div>
</div>
<div class="p-footer__sns">
	<p>整体りびるど公式</p>
	<ul>
		<li class="c-hvOpacity --x"><a href="https://x.com/pt_terasawa" target="_blank" rel="noopener noreferrer"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/common/icon-sns-x.svg' ) ); ?>" width="30" height="30" alt="X" loading="lazy"></a></li>
		<li class="c-hvOpacity --instagram"><a href="https://www.instagram.com/terasawa.pt/" target="_blank" rel="noopener noreferrer"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/common/icon-sns-instagram.svg' ) ); ?>" width="30" height="30" alt="Instagram" loading="lazy"></a></li>
	</ul>
</div>
`;

  files[T + 'front-page.php'] = `<?php
/**
 * トップページ
 */
get_header();

foreach ( [ 'mv', 'worry', 'concept', 'menu', 'therapist', 'blog', 'news', 'contact', 'access' ] as $section ) {
	get_template_part( 'template-parts/home/' . $section );
}

get_footer();
`;

  files[T + 'page.php'] = `<?php
/**
 * 固定ページ
 */
get_header();

while ( have_posts() ) :
	the_post();
	get_template_part( 'template-parts/page-header' );
	?>
	<div class="p-pageBody">
		<?php the_content(); ?>
	</div>
	<?php
endwhile;

get_footer();
`;

  files[T + 'index.php'] = `<?php
get_header();
get_template_part( 'template-parts/archive', get_post_type() );
get_footer();
`;

  /* -------------------------------------------------------------- Sass */
  files['src/scss/style.scss'] = `@charset "UTF-8";

@use "foundation/variables";
@use "foundation/mixin";
@use "foundation/base";

@use "layout/header";
@use "layout/footer";

@use "component/logo";
@use "component/button";

@use "project/gnav";
@use "project/contact-btn";
@use "project/home";
`;

  files['src/scss/foundation/_mixin.scss'] = `@use "sass:map";

$breakpoints: (
  "sp": "(max-width: 768px)",
  "tab": "(max-width: 1030px)",
  "pc": "(min-width: 769px)",
);

/// 画面幅ごとのスタイル：@include mq(sp) { … }
@mixin mq($bp: sp) {
  @media #{map.get($breakpoints, $bp)} {
    @content;
  }
}
`;

  const HEADER_SCSS = [
    '@use "../foundation/mixin" as *;',
    '',
    '.p-header {',
    '  position: fixed;',
    '  inset: 2.5rem 6.7rem auto;',
    '  z-index: 100;',
    '}',
    '',
    '.p-header__inner {',
    '  display: flex;',
    '  align-items: center;',
    '  border-radius: 1rem;',
    '  background-color: rgb(255 255 255 / 80%);',
    '  backdrop-filter: blur(1rem);',
    '}',
    '',
    '.p-headerInfo {',
    '  display: flex;',
    '  align-items: center;',
    '  margin-left: auto;',
    '}',
    '',
    '.p-headerTel {',
    '  border-left: .1rem dashed #b4b4b4;',
    '  padding-top: clamp(.4666666667rem, .3472222222vw, .5rem);',
    '  padding-inline: 1.7361111111vw 2.4305555556vw;',
    '  position: relative;',
    '}',
    '',
    '.p-headerTel__number {',
    '  font-family: var(--font-en);',
    '  font-size: clamp(1.8666666667rem, 1.3888888889vw, 2rem);',
    '  letter-spacing: .08em;',
    '  white-space: nowrap;',
    '}',
    '',
    '.p-headerMenuIcon {',
    '  display: none;',
    '}',
    '',
    '@include mq(tab) {',
    '  .p-headerMenuIcon {',
    '    display: block;',
    '  }',
    '}',
    '',
  ];
  /** typed in the video: the smartphone header (no phone number: it is in the fixed buttons) */
  const HEADER_SP = [
    '@include mq(sp) {',
    '  .p-headerInfo {',
    '    padding-block: .8rem;',
    '  }',
    '  .p-headerTel {',
    '    display: none;',
    '  }',
    '  .p-headerMenuIcon {',
    '    width: 7rem;',
    '  }',
    '}',
  ];
  files['src/scss/layout/_header.scss'] = HEADER_SCSS.join('\n');

  const FOOTER_SCSS = [
    '@use "../foundation/mixin" as *;',
    '',
    '.p-footer {',
    '  background-color: var(--color-base);',
    '  // 下は固定の予約ボタンの分だけ空ける',
    '  padding-bottom: clamp(9.3333333333rem, 6.9444444444vw, 10rem);',
    '  padding-top: clamp(9.3333333333rem, 6.9444444444vw, 10rem);',
    '  position: relative;',
    '}',
    '',
    '.p-footer__links ul {',
    '  display: flex;',
    '  gap: clamp(1.8666666667rem, 1.3888888889vw, 2rem);',
    '  justify-content: center;',
    '}',
    '',
    '.p-footer__copyright {',
    '  display: block;',
    '  font-size: 1.1rem;',
    '  text-align: center;',
    '}',
    '',
    '@include mq(sp) {',
    '  .p-footer {',
    '    padding-block: min(5.3333333333vw, 2.2857142857rem);',
    '  }',
    '  .p-footer__links ul {',
    '    border-top: .1rem dashed var(--color-border);',
    '    display: grid;',
    '    grid-template-columns: 1fr 1fr;',
    '  }',
    '}',
    '',
  ];
  const FOOTER_BAD = '    padding-block: min(5.3333333333vw, 2.2857142857rem);';
  const FOOTER_OK = '    padding-top: min(5.3333333333vw, 2.2857142857rem);';
  files['src/scss/layout/_footer.scss'] = FOOTER_SCSS.join('\n');

  files['src/scss/project/_contact-btn.scss'] = `@use "../foundation/mixin" as *;

// 予約の固定ボタン
.p-contactBtn {
  display: flex;
  z-index: 200;
}

.p-contactBtnItem a {
  background-color: #d6e7f7;
  display: block;
  transition: background-color var(--easeOutQuart) .5s;
}

.p-contactBtnItem__label {
  display: block;
  font-size: clamp(1.1rem, .9027777778vw, 1.3rem);
  line-height: 1.4;
}

// お問い合わせページ・完了ページでは出さない
.pg-complete .p-contactBtn,
.pg-contact .p-contactBtn,
.pg-contact_complete .p-contactBtn {
  visibility: hidden;
}

@include mq(sp) {
  .p-contactBtn {
    inset: auto 0 0;
    padding-inline: min(2.6666666667vw, 1.1428571429rem);
    position: fixed;
  }
}

@include mq(pc) {
  // 電話予約はスマートフォンだけ（タップで発信）
  .p-contactBtnItem--tel {
    display: none;
  }
}
`;

  files['src/scss/foundation/_variables.scss'] = `:root {
  --color-base: #f9f8f3;
  --color-key: #0b2f6b;
  --color-border: #c8d3e0;
  --color-red: #d9534f;
  --font-en: "Barlow", sans-serif;
  --easeOutQuart: cubic-bezier(.25, 1, .5, 1);
  --mg-sp: 5.3333333333vw;
}
`;

  /* the explorer (order as VS Code sorts it) */
  const tree = [
    ['src', 'dir', 1], ['src/scss', 'dir', 1], ['src/scss/component', 'dir', 0], ['src/scss/foundation', 'dir', 1],
    ['src/scss/foundation/_mixin.scss'], ['src/scss/foundation/_variables.scss'], ['src/scss/layout', 'dir', 1], ['src/scss/layout/_footer.scss'], ['src/scss/layout/_header.scss'],
    ['src/scss/project', 'dir', 1], ['src/scss/project/_contact-btn.scss'], ['src/scss/style.scss'],
    ['wp-content', 'dir', 1], ['wp-content/themes', 'dir', 1], ['wp-content/themes/rebuild', 'dir', 1],
    [T + 'assets', 'dir', 0], [T + 'template-parts', 'dir', 1], [T + 'template-parts/home', 'dir', 0],
    [T + 'template-parts/contact-btn.php'], [T + 'template-parts/footer-bnrs.php'], [T + 'template-parts/gnav-lower.php'],
    [T + 'footer.php'], [T + 'front-page.php'], [T + 'functions.php'], [T + 'header.php'], [T + 'index.php'], [T + 'page.php'], [T + 'style.css'],
    ['.gitignore'], ['.wp-env.json'], ['package.json'], ['README.md'],
  ];
  files['.gitignore'] = 'node_modules/\n*.zip\n';

  window.FILES = {
    files, tree, T,
    REDIRECT_ADD, HEADER_BEFORE, NAV_ADD, NAV_AFTER, CONTACT_BEFORE, TEL_ADD, HEADER_SCSS, HEADER_SP, FOOTER_SCSS, FOOTER_BAD, FOOTER_OK,
    /** the theme as it is at the end of the video (what goes into rebuild.zip) */
    final() {
      const out = { ...files };
      const fn = files[T + 'functions.php'].split('\n');
      fn.splice(fn.lastIndexOf('}') + 1, 0, ...REDIRECT_ADD);
      out[T + 'functions.php'] = fn.join('\n');
      const h = HEADER_BEFORE.slice();
      h.splice(h.indexOf(NAV_AFTER) + 2, 0, ...NAV_ADD);
      out[T + 'header.php'] = h.join('\n');
      const c = CONTACT_BEFORE.slice();
      c.splice(c.lastIndexOf('</div>'), 0, ...TEL_ADD);
      out[T + 'template-parts/contact-btn.php'] = c.join('\n');
      out['src/scss/layout/_header.scss'] = [...HEADER_SCSS, ...HEADER_SP, ''].join('\n');
      out['src/scss/layout/_footer.scss'] = FOOTER_SCSS.join('\n').replace(FOOTER_BAD, FOOTER_OK);
      return out;
    },
  };
})();
