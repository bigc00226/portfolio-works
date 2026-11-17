/*
 * The VS Code project of the video: the theme "Stand by Beauty Clinic" (stand_by_beauty_clinic) in its git repository,
 * with the campaign brief, the price sheet and the script that turns it into the LP's price list.
 *   - front-page.php / footer.php: written from the live site's HTML (the theme's source is not public) — the markup,
 *     classes, texts and addresses are the live site's; the PHP around them is the minimum a classic theme needs
 *   - docs/lp/sticky-cta.css: the live site's own 追加 CSS for the fixed reservation buttons (byte for byte)
 *   - data/price-202612.csv: the December campaign's list prices (from 12/1) and the fixed special prices, as the live
 *     LP shows them; scripts/campaign-price.mjs is typed in the video
 */
(function () {
  'use strict';
  const T = (s) => s.replace(/^\n/, '');

  /** the campaign: what the live LP (stand-by.jp/campaign_202612) shows */
  const TITLE = '新しい自分で新年を迎える！12-1月限定キャンペーンを開催いたします。';
  const PERIOD = '12月1日（火）〜1月31日（日）の施術';
  const OLD_PERIOD = '10月1日（木）〜11月30日（月）の施術';
  const BANNER = '2612-2701_______________________________.png';
  /** [heading] or [name, list price, 'U18' (目元・口元: 30 % off, 18歳以下 40 % off) | '', fixed special price | ''] */
  const PRICES = [
    ['### ⚫人気目元施術30％オフ！U18は40％オフ！'],
    ['オーダーメイド二重埋没法', 180000, 'U18', ''],
    ['オーダーメイド二重埋没法＋選べる1施術（クマ取り/目頭切開法/目尻切開法/上まぶたの脂肪取り）', 280000, 'U18', ''],
    ['オーダーメイド二重埋没法＋選べる2施術（クマ取り/目頭切開法/目尻切開法/上まぶたの脂肪取り）', 380000, 'U18', ''],
    ['オーダーメイド二重埋没法＋ヒアルロン酸注入（涙袋）', 240000, 'U18', ''],
    ['目頭切開法', 190000, 'U18', ''],
    ['目尻切開法', 190000, 'U18', ''],
    ['クマ取り:下まぶたの脂肪取り（脱脂）', 180000, 'U18', ''],
    ['グラマラスライン形成（たれ目形成、切開法）', 270000, 'U18', ''],
    ['眉下リフト', 230000, 'U18', ''],
    ['眉下リフト＋上まぶたの脂肪取り', 270000, 'U18', ''],
    ['### ⚫人気口元施術30％オフ！U18は40％オフ！'],
    ['人中短縮術', 180000, 'U18', ''],
    ['M字リップ形成術', 180000, 'U18', ''],
    ['口唇縮小術：上唇', 180000, 'U18', ''],
    ['口唇縮小術：下唇', 180000, 'U18', ''],
    ['### ⚫アラガン製ヒアルロン酸注入30％オフ'],
    ['ヒアルロン酸注入:ジュビダーム®ボルベラXC 1cc', 60000, '', ''],
    ['ヒアルロン酸注入:ジュビダーム®ボリフトXC 1cc', 60000, '', ''],
    ['ヒアルロン酸注入:ジュビダーム®ボリューマXC 1cc', 60000, '', ''],
    ['ヒアルロン酸注入:ジュビダーム®ボラックスXC 1cc', 65000, '', 42000],
    ['### ⚫次世代型糸リフト ¥10,000～'],
    ['ヴィーナスリフト:PDO 3Dメッシュ1本', 15000, '', 10000],
    ['ヴィーナスリフト:PLCL 3Dメッシュ1本', 18000, '', 10000],
    ['ヴィーナスリフト:PLLA 3Dメッシュ1本', 18000, '', 10000],
    ['### ⚫切らない鼻整形（テストリフトノーズ） ¥18,000～'],
    ['切らない隆鼻術：テスリフトノーズ ND 1本', 30000, '', 18000],
    ['切らない鼻中隔延長：テスリフトノーズ NC 1本', 30000, '', 18000],
  ];
  const CSV = ['施術,定価,区分,特別価格', ...PRICES.map((r) => (r.length === 1 ? r[0] : r.join(',')))].join('\n') + '\n';
  const NOTES = '※記載価格は全顔モニター価格です（ヒアルロン酸注入のみ部分モニターの価格）。\n※部分モニター価格のご用意もございます。\n※上記に記載されている定価は、12/1からの価格となります。\n';
  /** what scripts/campaign-price.mjs prints: wrong = the fixed special prices ignored (the mistake), right = as on the live LP */
  const yen = (n) => '¥' + Number(n).toLocaleString('ja-JP');
  function priceMd(useSpecial) {
    const out = [];
    for (const r of PRICES) {
      if (r.length === 1) { out.push(r[0]); continue; }
      const [name, price, type, special] = r;
      const camp = useSpecial && special ? Number(special) : price * 0.7;
      const u18 = type === 'U18' ? `、18歳以下 ${yen(price * 0.6)}` : '';
      out.push(`・${name}\n${yen(price)}⇒${yen(camp)}${u18}`);
    }
    return out.join('\n\n') + '\n\n' + NOTES;
  }

  /** the live site's 追加 CSS for the fixed reservation buttons (docs/lp/sticky-cta.css, pasted into 追加 CSS) */
  const STICKY_CSS = "/* 画面下部に固定する枠 */\n.sticky-footer-wrap {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  padding: 10px 15px calc(10px + env(safe-area-inset-bottom));\n  box-sizing: border-box;\n  z-index: 9999;\n  pointer-events: none;\n\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n}\n\n/* ボタン共通の基本デザイン */\n.green-reserve-btn {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: center;\n  gap: 12px;\n  width: 100%;\n  max-width: 420px;\n  height: 46px;\n  border-radius: 9999px;\n\n  background:\n    radial-gradient(60% 70% at 50% 0%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 100%),\n    radial-gradient(120% 100% at 50% 0%, #85AB1E 0%, #385008 80%);\n\n  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);\n  color: #FFFFFF;\n  text-decoration: none;\n  pointer-events: auto;\n  transition: transform 0.2s, opacity 0.2s;\n}\n\n/* ホバー・タップ動作 */\n.green-reserve-btn:hover {\n  opacity: 0.95;\n  transform: translateY(-2px);\n}\n.green-reserve-btn:active {\n  transform: translateY(1px);\n}\n\n/* WEB予約のテキスト */\n.green-reserve-btn .main-text {\n  font-size: 18px;\n  font-weight: 700;\n  letter-spacing: 0.08em;\n  line-height: 1;\n}\n\n.green-reserve-btn .sub-text-frame {\n  font-size: 12px;\n  font-weight: 500;\n  letter-spacing: 0.05em;\n  padding: 3px 10px;\n  border: 1px solid rgba(255, 255, 255, 0.85);\n  line-height: 1;\n  white-space: nowrap;\n}\n\n\n/* =========================================\n   LINE予約ボタン（専用スタイル）\n========================================= */\n.green-reserve-btn.line-btn {\n  background: #FFFFFF;\n  border: 3px solid #06C755;\n  color: #06C755;\n  box-shadow: 0 4px 10px rgba(6, 199, 85, 0.15);\n  gap: 0px; /* 画像が入るため間隔を調整 */\n}\n\n/* ★追加: LINEアイコン（画像）のサイズ調整 */\n.green-reserve-btn.line-btn .line-icon-img {\n  width: 30px;\n  height: 30px;\n  object-fit: contain;\n  flex-shrink: 0;\n}\n\n/* LINE予約ボタンのみ文字間を詰める */\n.green-reserve-btn.line-btn .main-text {\n  letter-spacing: 0;\n}\n\n.green-reserve-btn.line-btn .sub-text-frame {\n  border: 1px solid #06C755;\n  letter-spacing: 0;\n}";

  const BRIEF = T(`
# 12-1月限定キャンペーン LP（campaign_202612）

クリニックからの依頼（10/30 受領）

- タイトル：${TITLE}
- 対象期間：${PERIOD}
- 目元・口元：30％オフ、18歳以下は40％オフ
- ヒアルロン酸注入（アラガン製）：30％オフ
- 次世代型糸リフト ¥10,000～／切らない鼻整形 ¥18,000～（特別価格）
- 定価は 12/1 から改定 → data/price-202612.csv
- バナー：${BANNER}（982×446、デザイナーから受領）
- ページは前回（campaign_2）を複製して作る

## 詳細（本文）

スタンドバイビューティークリニックは、特別な年末年始を最高の笑顔で過ごしたいあなたを応援します！
クリスマスやカウントダウン、初詣や新年の集まりなど、華やかなイベントが続くこの季節。まとまったお休みを取りやすい年末年始は、ダウンタイムをじっくり確保して施術を受ける絶好のチャンスです。
今年1年頑張った自分へのご褒美に、「理想のビジュアル」で新しい年をスタートしませんか？

対象期間中、人気の目元・口元施術を30％オフにてご提供します。
18歳以下の方はさらにお得な40％オフになりますので、この機会にぜひ当院へご相談ください。

また、この夏休みに印象を変えたいけど、絶対バレたくない・・という方におすすめのプチ施術も特別価格にてご提供します。
ご予約はWEBサイトもしくは公式LINE（LINE ID:@standby.bc）から承っております。

皆様のご来院、心よりお待ちしております。
`);
  /** typed in the video under the brief */
  const FLOW = ['## 導線', '', '- トップのバナーを2つ並べる：/campaign_202612', '- スマホの固定ボタンを新しく（WEB予約・LINE）'];

  /** front-page.php: the top of the theme's home template, as the live home page renders it */
  const FRONT = T(`
<?php
/**
 * トップページ
 */
get_header();
?>

<section id="kvWrap">
  <video class="pc" autoplay loop muted playsinline poster="<?php echo get_template_directory_uri(); ?>/assets/img/fv_movie.png">
    <source src="<?php echo get_template_directory_uri(); ?>/assets/movie/fv.mp4" type="video/mp4">
  </video>

<video class="sp" autoplay loop muted playsinline poster="<?php echo get_template_directory_uri(); ?>/assets/img/webp/fv_movie.webp">
    <source src="<?php echo get_template_directory_uri(); ?>/assets/movie/fv.mp4" type="video/mp4">
  </video>
<div id="mainCopy"><br class="br-sp"></div>
<div id="scrollFont">SCROLL</div>
<div id="scroll"></div>
<div id="scrollAni"></div>
</section>

<section id="indexFeaturesWrap">
<div class="campaign-container wow fadeInUp" style="margin-top: 20px;">
  <a href="https://stand-by.jp/campaign_2">
    <img src="https://stand-by.jp/wp/wp-content/uploads/2026/10/campaign_01.png" alt="年末のイベントシーズンに向けて理想のビジュアルに！10月限定キャンペーンを開催いたします。" class="campaign-banner">
  </a>
</div>

	<div id="menu" class="blank"></div>
<h2 class="titleWrap wow fadeInUp">Features<span>Stand by Beauty Clinicの特徴</span></h2>
<div class="wrap940">
<ul class="p-aboutFeature__list">
  <li class="p-aboutFeature__item">
    <a href="<?php echo home_url( '/case/' ); ?>" class="p-aboutFeature__itemLink">
`);
  /** the second banner (copied from the first, then the address and the image changed) */
  const BANNER_LINES = ['', '  <a href="https://stand-by.jp/campaign_2">', '    <img src="https://stand-by.jp/wp/wp-content/uploads/2026/10/campaign_01.png" alt="年末のイベントシーズンに向けて理想のビジュアルに！10月限定キャンペーンを開催いたします。" class="campaign-banner">', '  </a>'];

  /** footer.php: the end of the theme's footer, as the live pages render it (the old image button still active) */
  const FOOTER = T(`
<div id="copyright">Copyright © 2025 <br class="br-sp">Stand by Beauty Clinic. <br class="br-sp">All rights reserved.</div>
<a href="#top" id="pagetop"></a>

<!-- footer -->
<div id="bottomWebBtn">
<a href="https://standby.b4a.clinic/" target="_blank">
<picture>
<source srcset="<?php echo get_template_directory_uri(); ?>/assets/img/webp/web_btn_bottom.webp" type="image/webp">
<img src="<?php echo get_template_directory_uri(); ?>/assets/img/web_btn_bottom.png" alt="WEB予約／24時間受付">
</picture>
</a>
</div>

</div><!--standWrap-->
<?php wp_footer(); ?>
</body>
</html>
`);
  /** the new fixed buttons (typed in the video), as the live site has them */
  const STICKY_HTML = [
    '<!-- footer_2 -->',
    '<div class="sticky-footer-wrap">',
    '  <a href="https://standby.b4a.clinic/" class="green-reserve-btn">',
    '    <span class="main-text" style="color: #ffffff;">WEB予約</span>',
    '    <span class="sub-text-frame" style="color: #ffffff;">24時間受付</span>',
    '  </a>',
    '',
    '  <a href="https://line.me/R/ti/p/@589khiiu" class="green-reserve-btn line-btn">',
    '    <img src="https://stand-by.jp/wp/wp-content/uploads/2026/09/icons8-line-48.png" alt="LINE" class="line-icon-img">',
    '    <span class="main-text">LINEから無料相談・予約</span>',
    '  </a>',
    '</div>',
  ];

  const FUNCTIONS = T(`
<?php
/**
 * Stand by Beauty Clinic functions
 */

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
} );

/* CSS / JS（更新日時をバージョンにしてキャッシュを切る） */
add_action( 'wp_enqueue_scripts', function () {
	$dir = get_template_directory();
	$uri = get_template_directory_uri();
	$ver = date( 'Ymd-His', filemtime( $dir . '/assets/css/style.css' ) );
	foreach ( [ 'style', 'common', 'common-sp' => 'common_sp', 'navigation', 'newstyles2026' ] as $handle => $file ) {
		$handle = is_int( $handle ) ? $file : $handle;
		wp_enqueue_style( $handle . '-css', "$uri/assets/css/$file.css", [], $ver );
	}
	wp_enqueue_style( 'fontawesome', 'https://use.fontawesome.com/releases/v6.4.2/css/all.css', [], '6.4.2' );
	wp_enqueue_style( 'splide-css', 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide-core.min.css', [], '4.1.4' );
	wp_enqueue_script( 'base-js', "$uri/assets/js/base.js", [], $ver, true );
} );

require get_template_directory() . '/inc/post-types.php';
`);

  const files = {
    'README.md': T(`
# stand_by_beauty_clinic

Stand by Beauty Clinic（https://stand-by.jp/）の WordPress テーマ。

- 本番：https://stand-by.jp/（WordPress は /wp）
- 反映：\`scp\` で本番のテーマフォルダへ（ssh の接続先は \`standby\`）
- キャンペーン LP：固定ページ（前回のページを Duplicate Post で複製して作る）
- 予約：WEB予約 https://standby.b4a.clinic/ ／ 公式 LINE
`),
    'docs/lp/campaign-202612.md': BRIEF,
    'docs/lp/campaign_2.md': T(`
# 10-11月限定キャンペーン LP（campaign_2）

- 公開：2026/09/09、11月末まで延長（10/09）
- 目元・口元：30％オフ、18歳以下は40％オフ
`),
    'docs/lp/sticky-cta.css': STICKY_CSS + '\n',
    'data/price-202612.csv': CSV,
    'data/notes-202612.md': NOTES,
    'out/.gitkeep': '',
    'scripts/.gitkeep': '',
    'inc/post-types.php': T(`
<?php
/**
 * 症例・コラム・FAQ
 */
add_action( 'init', function () {
	register_post_type( 'case', [ 'label' => '症例', 'public' => true, 'has_archive' => true, 'show_in_rest' => true, 'menu_position' => 5, 'supports' => [ 'title', 'editor', 'thumbnail' ] ] );
	register_post_type( 'column', [ 'label' => 'コラム', 'public' => true, 'has_archive' => true, 'show_in_rest' => true, 'menu_position' => 5, 'supports' => [ 'title', 'editor', 'thumbnail' ] ] );
	register_post_type( 'faq', [ 'label' => 'FAQ', 'public' => true, 'has_archive' => true, 'show_in_rest' => true, 'menu_position' => 5, 'supports' => [ 'title', 'editor' ] ] );
} );
`),
    'front-page.php': FRONT,
    'footer.php': FOOTER,
    'functions.php': FUNCTIONS,
    'header.php': T(`
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="<?php echo get_template_directory_uri(); ?>/assets/img/favicon.ico">
<link rel="apple-touch-icon" href="<?php echo get_template_directory_uri(); ?>/assets/img/apple-touch-icon.png">
<?php wp_head(); ?>
</head>
<body class="contents">
<div id="standWrap">
`),
    'page.php': T(`
<?php get_header(); ?>
<main class="wrapCo">
<div class="postWrap<?php echo str_starts_with( $post->post_name, 'campaign' ) ? ' campaign' : ''; ?>">
<h1 class="menuTitle"><?php the_title(); ?></h1>
<?php the_content(); ?>
</div><!--wrapCo-->
<?php get_template_part( 'parts/reservation' ); ?>
<?php get_template_part( 'parts/menu' ); ?>
</main>
<?php get_footer(); ?>
`),
    'style.css': '@charset "UTF-8";\n/*\nTheme Name: Stand by Beauty Clinic\nTheme URI: \nDescription:\nVersion: 1.0\nAuthor: \nAuthor URI: \n*/\n',
    'package.json': T(`
{
  "name": "stand_by_beauty_clinic",
  "private": true,
  "scripts": {
    "price": "node scripts/campaign-price.mjs"
  }
}
`),
    '.gitignore': 'node_modules/\nout/*.md\n',
  };
  /** the price script as typed on screen (with the fix of the mistake: the fixed special prices) */
  const PRICE_SCRIPT = [
    '// 定価（12/1〜）から LP の料金表を作る：30％オフ、U18 は40％オフ',
    "import { readFileSync, writeFileSync } from 'node:fs';",
    '',
    "const yen = (n) => '¥' + Number(n).toLocaleString('ja-JP');",
    'const out = [];',
    "for (const line of readFileSync('data/price-202612.csv', 'utf8').trim().split(/\\r?\\n/).slice(1)) {",
    "  if (line.startsWith('###')) { out.push(line); continue; }",
    "  const [name, price, type, special] = line.split(',');",
    '  const camp = price * 0.7;',
    "  const u18 = type === 'U18' ? `、18歳以下 ${yen(price * 0.6)}` : '';",
    '  out.push(`・${name}\\n${yen(price)}⇒${yen(camp)}${u18}`);',
    '}',
    "const md = out.join('\\n\\n') + '\\n\\n' + readFileSync('data/notes-202612.md', 'utf8');",
    "writeFileSync('out/lp-price-202612.md', md);",
    'console.log(md);',
  ];
  const PRICE_FIX = '  const camp = special ? Number(special) : price * 0.7;';

  window.FILES = { files, TITLE, PERIOD, OLD_PERIOD, BANNER, PRICES, CSV, NOTES, priceMd, BRIEF, FLOW, BANNER_LINES, STICKY_HTML, STICKY_CSS, PRICE_SCRIPT, PRICE_FIX };
})();
