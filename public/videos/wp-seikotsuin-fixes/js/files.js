/*
 * The files of the maintenance workspace (C:\dev\maintenance) shown in VS Code:
 *   requests/2026-10-30.md          today's requests from the two clinics
 *   harairo/…                       the theme of はらいろ整骨院 (folder name harairoSeikotsuinWp on the server)
 *   heiwajima/…                     the theme of へいわじま整骨院
 * The markup is the live sites' own (class names, texts, links as the pages show them); the PHP around it is what such
 * a classic theme looks like (the themes' sources are not public). The stylesheets are the live files as the servers send
 * them (js/theme-css.js): harairo's common/css/base.css without the styles of the green box's reservation link
 * (.ctaYoyaku: PC, tablet, smartphone) that the video adds, heiwajima's style.css as it is.
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const SQUARE = 'https://app.squareup.com/appointments/book/ldr8ui1hm3fc9x/LCHKZR3WPG6C6/start';

  /* ------------------------------------------------------------------ the requests */
  const REQUESTS = [
    '# 修正依頼 2026/10/30',
    '',
    '## はらいろ整骨院（harairo.com）',
    '',
    '1. 酸素カプセル（10 月導入）をトップの「施術メニュー」に 10 番目として追加',
    '   - アイコン：ico_menu_10.svg（デザイン済み・受領）',
    '2. トップの予約案内（緑の枠）に、酸素カプセルの予約リンク（Square の予約ページ）を追加',
    '   - フッターの予約欄・スマホ下の固定ボタンと同じリンク（10/23 に追加済み）',
    `   - ${SQUARE}`,
    '3. フッターの表記を右側の「診療時間・予約」タブに合わせる',
    '   - 土曜 17:00 → 18:00、「祝日は要問い合わせ」を追記',
    '4. 検索結果に出る説明文（固定ページ）の最後に、酸素カプセルのことを追記',
    '',
    '## へいわじま整骨院（heiwajima-seikotsuin.com）',
    '',
    '1. 診療時間の表記を変更（11 月から 19 時以降・土日祝の 12 時以降は予約制）',
    '   - 平日 10-21時 → 10-19時 / 19-21時は予約制',
    '   - 土日祝日 9-15時 → 9-12時 / 12-15時は予約制',
    '2. スマホで住所が「…巳の丸ビ／ル」と途中で折り返して読みにくい',
    '   - 丁目のあとで改行する',
    '',
  ].join('\n');

  /* ------------------------------------------------------------------ はらいろ整骨院 */
  const MENU = [
    ['01', '保険治療', '保険治療'], ['02', '交通事故治療', '交通事故治療'], ['03', '労災治療', '労災治療'], ['04', '骨盤・姿勢矯正', '骨盤・姿勢矯正'],
    ['05', '肩こり＆頭痛 スッキリ回復プラン', '肩こり＆頭痛<br>スッキリ回復プラン'], ['06', '慢性腰痛＆しびれ 解消プラン', '慢性腰痛＆しびれ<br>解消プラン'],
    ['07', '心と体のリラックスコース', '心と体の<br>リラックスコース'], ['08', '3Dオーダーメイド トータル整体', '3Dオーダーメイド<br>トータル整体'],
    ['09', '健康×美姿勢×運動不足プログラム', '健康×美姿勢×<br>運動不足プログラム'],
  ];
  const item = ([n, alt, label]) => [
    '\t\t\t<div class="item">',
    `\t\t\t\t<span class="num">${n}</span>`,
    `\t\t\t\t<span class="img"><img src="<?php echo get_template_directory_uri(); ?>/common/images/menu/ico_menu_${n}.svg" alt="${alt}"></span>`,
    `\t\t\t\t<p>${label}</p>`,
    '\t\t\t</div>',
  ];
  /** the item the video adds (typed) */
  const ITEM_10 = item(['10', '酸素カプセル', '酸素カプセル']);
  const FRONT = [
    '<?php',
    '/**',
    ' * トップページ',
    ' */',
    'get_header();',
    '?>',
    '<div id="container">',
    '',
    '\t<?php get_template_part( \'parts/top\', \'mainvisual\' ); ?>',
    '\t<?php get_template_part( \'parts/top\', \'topics\' ); ?>',
    '',
    '\t<section id="topAbout">',
    '\t\t<?php get_template_part( \'parts/top\', \'about\' ); ?>',
    '\t\t<div class="btn">',
    '\t\t\t<a href="<?php echo esc_url( home_url( \'/about/\' ) ); ?>">当院について</a>',
    '\t\t</div>',
    '\t\t<div class="cCtaBox01">',
    '\t\t<div class="ctaBoxIn">',
    '\t\t\t<div class="ctaTit">',
    '\t\t\t\t<span class="sub">予約優先制/ 当日予約OK</span>',
    '\t\t\t\t<p><span>かんたんWEB予約</span></p>',
    '\t\t\t</div>',
    '\t\t\t<div class="ctaFlow">',
    '\t\t\t\t<img src="<?php echo get_template_directory_uri(); ?>/common/images/cta_flow.svg" alt="まずは友だち追加 → ご希望メニュー選択 → ご希望日時選択 → ご予約確定"/>',
    '\t\t\t</div>',
    '\t\t\t<div class="ctaLine">',
    '\t\t\t\t<p><span>LINEで24時間<br>いつでも受付</span></p>',
    '\t\t\t\t<div class="ctaLineBtn">',
    '\t\t\t\t\t<a href="https://lin.ee/ci09fPR" target="_blank"><span>かんたんWEB予約</span></a>',
    '\t\t\t\t</div>',
    '\t\t\t</div>',
    '\t\t\t<div class="ctaTel">',
    '\t\t\t\t<a href="tel:0482028387">',
    '\t\t\t\t\t<p>お急ぎの方はこちら</p>',
    '\t\t\t\t\t<div><span>TEL.</span>048-202-8387</div>',
    '\t\t\t\t</a>',
    '\t\t\t</div>',
    '\t\t</div>',
    '\t\t<ul>',
    '\t\t\t<li> 料金・施術時間はWEB予約からご確認いただけます。</li>',
    '\t\t</ul>',
    '\t\t</div>',
    '\t</section>',
    '',
    '\t<section id="topMenu">',
    '\t\t<div class="wrapBox">',
    '\t\t<div class="imgBox01">',
    '\t\t\t<img src="<?php echo get_template_directory_uri(); ?>/common/images/top/img_top_menu_01n.jpg" width="1500" height="964" alt="image:施術メニュー">',
    '\t\t\t<img src="<?php echo get_template_directory_uri(); ?>/common/images/top/img_top_menu_02n.jpg" width="1500" height="964" alt="image:施術メニュー">',
    '\t\t</div>',
    '\t\t<h2><span>施術メニュー</span></h2>',
    '\t\t<p>どのような症状でお困りですか？<br>',
    '\t\t当院では、お客様一人ひとりの状態を把握してから痛みや不調の原因を<br class="forTB forPC">根本的に改善できる治療を提案させていただきます。<br>',
    '\t\t保険治療、交通事故治療、労災治療にも対応しています。</p>',
    '',
    '\t\t<div class="inner mhBox">',
    ...MENU.flatMap(item),
    '\t\t</div>',
    '\t\t<div class="btn"><a href="<?php echo esc_url( home_url( \'/menu/\' ) ); ?>">施術メニュー</a></div>',
    '\t\t<div class="imgBox02">',
    '\t\t\t<img src="<?php echo get_template_directory_uri(); ?>/common/images/top/img_top_menu_03n.jpg" width="1500" height="964" alt="image:施術メニュー">',
    '\t\t</div>',
    '\t\t</div>',
    '\t</section>',
    '',
    '\t<?php get_template_part( \'parts/top\', \'faq\' ); ?>',
    '',
    '</div>',
    '<!--/container-->',
    '<?php get_footer(); ?>',
    '',
  ];

  /** the footer's reservation link (added on 10/23 with the smartphone button; the video copies it into the green box) */
  const GRID_LINK = [
    '\t\t\t<div class="grid-link">',
    `\t\t\t\t<p><a href="${SQUARE}" target="_blank">酸素カプセルのご予約はこちら</a></p>`,
    '\t\t\t</div>',
  ];
  /** the reservation link of the green box: the footer's, with its own class */
  const CTA_YOYAKU = GRID_LINK.map((l) => l.replace('grid-link', 'ctaYoyaku'));
  const NOTE_BEFORE = '\t\t\t<p>予約優先制/木曜午後・日曜休み/<br class="forSP">土曜17:00まで</p>';
  const NOTE_AFTER = '\t\t\t<p>予約優先制/木曜午後・日曜休み/<br class="forSP">土曜18:00まで/祝日は要問い合わせ</p>';
  const FOOTER = [
    '<!--footer-->',
    '<footer>',
    '\t<div class="logo"><a href="<?php echo esc_url( home_url( \'/\' ) ); ?>">朝霞市 はらいろ整骨院</a></div>',
    '\t<div id="ftrCta">',
    '\t\t<div class="tit">朝霞駅南口徒歩10分<span>/</span><br class="forSP">LINEでいつでも予約受付</div>',
    '\t\t<div class="gridbox">',
    '\t\t\t<div class="grid-btn">',
    '\t\t\t\t<a href="https://lin.ee/ci09fPR" target="_blank"><span>かんたんWEB予約</span></a>',
    '\t\t\t</div>',
    ...GRID_LINK,
    '\t\t\t<div class="grid-tel">',
    '\t\t\t\t<a href="tel:0482028387">',
    '\t\t\t\t\t<p class="forSP">お急ぎの方はこちら</p>',
    '\t\t\t\t\t<div><span>TEL.</span>048-202-8387</div>',
    '\t\t\t\t\t<p>お急ぎの方はお電話でお受けしています。</p>',
    '\t\t\t\t</a>',
    '\t\t\t</div>',
    '\t\t\t<div class="grid-txt">',
    '\t\t\t\t<ul>',
    '\t\t\t\t\t<li>料金・施術時間はWEB予約からご確認いただけます。</li>',
    '\t\t\t\t</ul>',
    '\t\t\t</div>',
    '\t\t</div>',
    '\t</div>',
    '\t<div id="ftrIn">',
    '\t\t<div class="ftrInfo">',
    '\t\t\t<p>〒351-0011　埼玉県朝霞市本町1-7-24<br>',
    '\t\t\t東武東上線 朝霞駅 南口徒歩10分<br>',
    '\t\t\tマルエツ本町店近く、こころ菓子ほそやさんと八百屋さんの間の道沿い</p>',
    '\t\t\t<div class="week">',
    '\t\t\t\t<img src="<?php echo get_template_directory_uri(); ?>/common/images/ftr_cal.svg" alt="診療時間">',
    '\t\t\t</div>',
    NOTE_BEFORE,
    '\t\t\t<div class="sns">',
    '\t\t\t\t<a href="https://www.instagram.com/harairo_seikotsuin" target="_blank">Instagram</a>',
    '\t\t\t</div>',
    '\t\t</div>',
    '\t\t<div class="ftrMap">',
    '\t\t\t<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3236.06362580443!2d139.59278989999999!3d35.7983713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018e94a0664604f%3A0xf8580858c506cbf!2z44Gv44KJ44GE44KN5pW06aqo6Zmi!5e0!3m2!1sja!2sjp!4v1740182996203!5m2!1sja!2sjp" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    '\t\t</div>',
    '\t\t<nav>',
    '\t\t\t<?php wp_nav_menu( [ \'theme_location\' => \'footer\', \'container\' => false ] ); ?>',
    '\t\t</nav>',
    '\t\t<p class="copy"><a href="<?php echo esc_url( home_url( \'/\' ) ); ?>">&copy; 朝霞市 はらいろ整骨院.</a></p>',
    '\t</div>',
    '</footer>',
    '<!--/footer-->',
    '',
    '<?php get_template_part( \'parts/fixbtn\' ); ?>',
    '',
    '</div>',
    '<!--/wrapper-->',
    '<?php wp_footer(); ?>',
    '</body>',
    '</html>',
    '',
  ];
  const H_FUNCTIONS = [
    '<?php',
    '/**',
    ' * はらいろ整骨院 テーマの機能',
    ' */',
    '',
    'add_action( \'after_setup_theme\', function () {',
    '\tadd_theme_support( \'title-tag\' );',
    '\tadd_theme_support( \'post-thumbnails\' );',
    '\tregister_nav_menus( [ \'global\' => \'グローバル\', \'footer\' => \'フッター\' ] );',
    '} );',
    '',
    '// CSS（更新のたびにブラウザのキャッシュを使わないよう、日時を付ける）',
    'add_action( \'wp_enqueue_scripts\', function () {',
    '\t$ver = date_i18n( \'Ymd-Hi\' );',
    '\t$css = get_template_directory_uri() . \'/common/css/\';',
    '\twp_enqueue_style( \'harairo-swiper\', get_template_directory_uri() . \'/common/swiper/swiper.min.css\', [], null );',
    '\twp_enqueue_style( \'harairo-base\', $css . \'base.css\', [], $ver );',
    '\twp_enqueue_style( \'harairo-edit\', $css . \'edit.css\', [ \'harairo-base\' ], $ver );',
    '} );',
    '',
  ];
  const H_STYLE = ['/*', 'Theme Name: harairoSeikotsuinWp', 'Description: 朝霞市 はらいろ整骨院', 'Version: 1.4.2', 'Text Domain: harairo', '*/', ''];

  /* base.css: the live file (from the snapshot) — addresses back to the theme's own, the two link styles taken out
     (the video pastes them in) */
  const BASE_LIVE = window.THEME_CSS['harairo/common/css/base.css'];
  /** a nested-style block: from the line `start` to the line before `next` (both at the same indentation) */
  function block(text, start, next, firstProp) {
    const lines = text.split('\n');
    const a = lines.findIndex((l, i) => l === start && (!firstProp || lines[i + 1].trim() === firstProp));
    const b = lines.findIndex((l, i) => i > a && l === next);
    if (a < 0 || b < 0) throw new Error('base.css: block not found ' + start);
    return { at: a, lines: lines.slice(a, b) };
  }
  // the green box link's styles: PC (typed in scene 2), tablet and smartphone (scene 5)
  const CTA_CSS = block(BASE_LIVE, '  #container section .cCtaBox01 .ctaBoxIn .ctaYoyaku {', '  #container section .cCtaBox01 .ctaBoxIn .ctaTel {', 'padding-top: 68px;');
  const CTA_TB = block(BASE_LIVE, '  #container section .cCtaBox01 .ctaBoxIn .ctaYoyaku {', '  #container section .cCtaBox01 .ctaBoxIn .ctaTel a {', 'padding-top: 68px; }');
  const CTA_SP = block(BASE_LIVE, '    #container section .cCtaBox01 .ctaBoxIn .ctaYoyaku {', '    #container section .cCtaBox01 .ctaBoxIn .ctaTel a {', 'padding-top: 20px;');
  if (!(CTA_CSS.at < CTA_TB.at && CTA_TB.at < CTA_SP.at)) throw new Error('base.css: unexpected order');
  /** base.css without some blocks (taken out from the bottom up, so the earlier ones keep their line numbers) */
  const without = (blocks) => {
    const l = BASE_LIVE.split('\n');
    [...blocks].sort((a, b) => b.at - a.at).forEach((b) => l.splice(b.at, b.lines.length));
    return l.join('\n');
  };
  const BASE_BEFORE = without([CTA_CSS, CTA_TB, CTA_SP]);   // at the start
  const BASE_MID = without([CTA_TB, CTA_SP]);               // after scene 2 (the PC styles added)

  /* ------------------------------------------------------------------ へいわじま整骨院 */
  const ADDR_BEFORE = '\t\t\t\t\t\t東京都大田区大森北６丁目１２−９巳の丸ビル</td>';
  const ADDR_AFTER = '\t\t\t\t\t\t東京都大田区大森北６丁目<br class="br_sp">１２−９巳の丸ビル</td>';
  const W_FOOTER = [
    '<?php',
    '$tpl = get_template_directory_uri();',
    '?>',
    '<footer class="footer" id="access">',
    '\t<div class="footer_top">',
    '\t\t<div class="footer_map">',
    '\t\t\t<?php get_template_part( \'template-parts/map\' ); ?>',
    '\t\t</div>',
    '\t\t<div class="footer_right">',
    '\t\t\t<div class="footer_images">',
    '\t\t\t\t<?php foreach ( [ \'01\', \'02\', \'03\' ] as $n ) : ?>',
    '\t\t\t\t<picture class="footer_image">',
    '\t\t\t\t\t<source media="(max-width: 767px)" srcset="<?php echo $tpl; ?>/images/image_footer_<?php echo $n; ?>_sp.jpg">',
    '\t\t\t\t\t<img src="<?php echo $tpl; ?>/images/image_footer_<?php echo $n; ?>_pc.jpg" alt="">',
    '\t\t\t\t</picture>',
    '\t\t\t\t<?php endforeach; ?>',
    '\t\t\t</div>',
    '\t\t\t<div class="footer_content">',
    '\t\t\t\t<div class="footer_logo">',
    '\t\t\t\t\t<img src="<?php echo $tpl; ?>/images/logo_footer.png" alt="">',
    '\t\t\t\t</div>',
    '\t\t\t\t<table class="footer_info_table">',
    '\t\t\t\t\t<tr>',
    '\t\t\t\t\t\t<th>所在地</th>',
    '\t\t\t\t\t\t<td>〒143-0016<br>',
    ADDR_BEFORE,
    '\t\t\t\t\t</tr>',
    '\t\t\t\t\t<tr>',
    '\t\t\t\t\t\t<th>電話番号</th>',
    '\t\t\t\t\t\t<td><a href="te:03-6436-8485">03-6436-8485</a></td>',
    '\t\t\t\t\t</tr>',
    '\t\t\t\t\t<tr>',
    '\t\t\t\t\t\t<th>診療時間</th>',
    '\t\t\t\t\t\t<td>',
    '\t\t\t\t\t\t\t<dl class="hours_list">',
    '\t\t\t\t\t\t\t\t<dt>平日</dt>',
    '\t\t\t\t\t\t\t\t<dd>10-21時</dd>',
    '\t\t\t\t\t\t\t</dl>',
    '\t\t\t\t\t\t\t<dl class="hours_list">',
    '\t\t\t\t\t\t\t\t<dt>土日祝日</dt>',
    '\t\t\t\t\t\t\t\t<dd>9-15時</dd>',
    '\t\t\t\t\t\t\t</dl>',
    '\t\t\t\t\t\t</td>',
    '\t\t\t\t\t</tr>',
    '\t\t\t\t\t<tr>',
    '\t\t\t\t\t\t<th>休診日</th>',
    '\t\t\t\t\t\t<td>不定休</td>',
    '\t\t\t\t\t</tr>',
    '\t\t\t\t\t<tr>',
    '\t\t\t\t\t\t<th>最寄駅</th>',
    '\t\t\t\t\t\t<td>平和島駅西口から徒歩1分</td>',
    '\t\t\t\t\t</tr>',
    '\t\t\t\t</table>',
    '\t\t\t</div>',
    '\t\t</div>',
    '\t</div>',
    '\t<div class="footer_bottom">',
    '\t\t<div class="inner footer_bottom_inner">',
    '\t\t\t<?php get_template_part( \'template-parts/footer-nav\' ); ?>',
    '\t\t\t<small class="copyright">',
    '\t\t\t\t<span><?php echo date( \'Y\' ); ?> © へいわじま整骨院</span>',
    '\t\t\t\t<span>/ Website by <a target="_blank" rel="noopener noreferrer" href="https://www.kop.co.jp/">KOP</a></span>',
    '\t\t\t</small>',
    '\t\t</div>',
    '\t</div>',
    '</footer>',
    '<?php wp_footer(); ?>',
    '</body>',
    '</html>',
    '',
  ];
  const W_FUNCTIONS = [
    '<?php',
    '// へいわじま整骨院',
    'add_action( \'wp_enqueue_scripts\', function () {',
    '\twp_enqueue_style( \'heiwajima-google-fonts-mplus\', \'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800;900&display=swap\' );',
    '\t$path = get_template_directory() . \'/style.css\';',
    '\twp_enqueue_style( \'heiwajima-style\', get_template_directory_uri() . \'/style.css?\' . date( \'ymdHis\', filemtime( $path ) ) );',
    '} );',
    '',
  ];
  const W_STYLE = window.THEME_CSS['heiwajima/style.css'];

  const files = {
    'requests/2026-10-30.md': REQUESTS,
    'harairo/common/css/base.css': BASE_BEFORE,
    'harairo/common/css/edit.css': S.css[Object.keys(S.css).find((k) => /edit\.css/.test(k))],
    'harairo/common/images/menu/ico_menu_10.svg': '<?xml version=\"1.0\" encoding=\"UTF-8\"?><svg id=\"b\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41.477 41.477\"><defs><style>.d{fill:#0d7142;}</style></defs><g id=\"c\"><path class=\"d\" d=\"M36.781,7.604h1.239c.382,0,.691-.309.691-.691s-.31-.691-.691-.691h-2.765c-.382,0-.691.31-.691.691v2.765c0,.382.309.691.691.691s.691-.309.691-.691v-.914c2.686,3.403,4.148,7.591,4.148,11.974,0,10.673-8.683,19.356-19.356,19.356S1.383,31.411,1.383,20.738,10.065,1.383,20.738,1.383c3.057,0,5.981.692,8.691,2.056.342.173.757.034.928-.307.172-.341.034-.757-.306-.928-2.905-1.462-6.038-2.204-9.312-2.204C9.303,0,0,9.303,0,20.738s9.303,20.738,20.738,20.738,20.738-9.303,20.738-20.738c0-4.829-1.66-9.435-4.695-13.134Z\"/><path class=\"d\" d=\"M14.517,16.591c-3.994,0-6.913,7.772-6.913,11.818,0,4.156,3.101,7.538,6.913,7.538s6.913-3.382,6.913-7.538c0-4.045-2.919-11.818-6.913-11.818ZM14.517,34.564c-3.049,0-5.53-2.761-5.53-6.156,0-3.74,2.787-10.435,5.53-10.435s5.53,6.695,5.53,10.435c0,3.394-2.481,6.156-5.53,6.156Z\"/><path class=\"d\" d=\"M11.996,26.423l-1.347-.309c-.119.517-.201,1.013-.244,1.472l1.376.13c.038-.399.11-.834.215-1.293Z\"/><path class=\"d\" d=\"M10.437,29.163c.183,1.192.731,2.256,1.544,2.998l.932-1.021c-.58-.53-.974-1.307-1.11-2.187l-1.366.21Z\"/><path class=\"d\" d=\"M21.43,19.422c0,4.156,3.101,7.538,6.913,7.538s6.913-3.382,6.913-7.538c0-4.045-2.919-11.818-6.913-11.818s-6.913,7.772-6.913,11.818ZM33.873,19.422c0,3.394-2.481,6.156-5.53,6.156s-5.53-2.761-5.53-6.156c0-3.74,2.787-10.435,5.53-10.435s5.53,6.695,5.53,10.435Z\"/><path class=\"d\" d=\"M25.821,17.436l-1.347-.309c-.119.517-.201,1.013-.244,1.472l1.376.13c.038-.399.11-.834.215-1.293Z\"/><path class=\"d\" d=\"M24.262,20.177c.183,1.192.731,2.256,1.544,2.998l.932-1.021c-.58-.53-.975-1.307-1.11-2.187l-1.366.21Z\"/></g></svg>',
    'harairo/footer.php': FOOTER.join('\n'),
    'harairo/front-page.php': FRONT.join('\n'),
    'harairo/functions.php': H_FUNCTIONS.join('\n'),
    'harairo/header.php': ['<!DOCTYPE html>', '<html <?php language_attributes(); ?>>', '<head>', '<meta charset="<?php bloginfo( \'charset\' ); ?>">', '<?php wp_head(); ?>', '</head>', '<body <?php body_class(); ?>>', '<div id="wrapper">', ''].join('\n'),
    'harairo/style.css': H_STYLE.join('\n'),
    'heiwajima/footer.php': W_FOOTER.join('\n'),
    'heiwajima/functions.php': W_FUNCTIONS.join('\n'),
    'heiwajima/header.php': ['<!DOCTYPE html>', '<html <?php language_attributes(); ?>>', '<head>', '<meta charset="<?php bloginfo( \'charset\' ); ?>">', '<?php wp_head(); ?>', '</head>', '<body <?php body_class(); ?>>', ''].join('\n'),
    'heiwajima/style.css': W_STYLE,
  };

  window.FILES = {
    files, SQUARE, ITEM_10, CTA_YOYAKU, GRID_LINK, NOTE_BEFORE, NOTE_AFTER, ADDR_BEFORE, ADDR_AFTER,
    CTA_CSS: CTA_CSS.lines, CTA_TB: CTA_TB.lines, CTA_SP: CTA_SP.lines, CTA_AT: { pc: CTA_CSS.at, tb: CTA_TB.at, sp: CTA_SP.at }, BASE_LIVE, BASE_BEFORE, BASE_MID, MENU,
  };
})();
