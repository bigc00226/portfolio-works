/*
 * The project the video works in (VS Code): C:\dev\ninshu-ec — the shop's WordPress (wp-env) with WooCommerce.
 *   docs/requirements.md                     the requirements (the shop's real rules: shipping table, payments, …)
 *   data/products-woocommerce.csv             the catalogue in WooCommerce's CSV import format — from the shop's real
 *                                            products (js/products-data.js); the pair price of 禅 フリーカップ is missing
 *                                            (mistake 1, fixed in the admin)
 *   wp-content/plugins/ninshu-shop/…         the shop's small plugin: the order status 「発送済み」 (typed in the video;
 *                                            first without the wc- prefix — mistake 3)
 * The capture of the real WordPress screens (tools/snapshots/wp-ninshu-woocommerce/capture-wp.js) imports this CSV and
 * runs this plugin, so the screens show what the video types.
 */
(function () {
  'use strict';
  const PR = window.NINSHU_PRODUCTS;

  /* ------------------------------------------------------------ the catalogue → WooCommerce CSV */
  const q = (v) => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const HEAD = ['Type', 'SKU', 'Name', 'Parent', 'Published', 'Visibility in catalog', 'Short description', 'In stock?', 'Regular price', 'Categories', 'Attribute 1 name', 'Attribute 1 value(s)', 'Attribute 1 visible', 'Attribute 1 global'];
  /** the shop's SKU, or (for the products the shop left without one) the slug in capitals */
  const skuOf = (r) => r[3] || r[2].toUpperCase();
  const MISSING_PAIR = 'fc-zen';   // 禅｜ぜん｜フリーカップ: the pair price is not in the old shop's export
  const csvRows = [];
  for (const r of PR) {
    const [, t, slug, , name, price, pair, cats, attr, terms, short] = r;
    if (t === 's') { csvRows.push(['simple', skuOf(r), name, '', 1, 'visible', short, 1, price, cats, '', '', '', '']); continue; }
    const [single, double] = terms.split('|');
    csvRows.push(['variable', skuOf(r), name, '', 1, 'visible', short, 1, '', cats, attr, `${single}, ${double}`, 1, 0]);
    csvRows.push(['variation', `${skuOf(r)}-1`, `${name} - ${single}`, skuOf(r), 1, 'visible', '', 1, price, '', attr, single, '', 0]);
    csvRows.push(['variation', `${skuOf(r)}-2`, `${name} - ${double}`, skuOf(r), 1, 'visible', '', 1, slug === MISSING_PAIR ? '' : pair, '', attr, double, '', 0]);
  }
  const CSV = [HEAD.join(','), ...csvRows.map((row) => row.map(q).join(','))].join('\n');
  const N_PRODUCTS = PR.length, N_VARIABLE = PR.filter((r) => r[1] === 'v').length;

  /* ------------------------------------------------------------ the files */
  const REQ = [
    '# 仁秀 オンラインショップ（WooCommerce）構築メモ',
    '',
    '## 商品',
    `- 商品 ${N_PRODUCTS} 点（器 ${N_PRODUCTS - 3} 点・抹茶 3 点）、カテゴリー 16（客人碗・フリーカップ・豆皿 など）`,
    `- 客人碗・フリーカップは「単品 / ペア」のバリエーション（${N_VARIABLE} 商品）`,
    '- 価格はすべて税込表示（1 円未満は切り上げ）',
    '- 旧サイトの商品データを WooCommerce の CSV 形式にして一括登録 → data/products-woocommerce.csv',
    '',
    '## 配送・送料（税込）',
    '- 1,300 円：富山・石川・福井・岐阜・静岡・愛知・三重・関西・中国・四国',
    '- 1,400 円：関東・山梨・新潟・長野・九州（沖縄を除く）',
    '- 1,500 円：宮城・山形・福島',
    '- 1,600 円：青森・岩手・秋田',
    '- 2,100 円：北海道・沖縄',
    '- 1 回のご注文が 20,000 円（税込）以上で送料無料',
    '',
    '## 決済',
    '- クレジットカード・Alipay（Stripe）… Stripe アカウントの連携は仁秀様のアカウントで',
    '- 銀行振込（入金確認後に発送）',
    '',
    '## 会員',
    '- ログインは「マイアカウント」、会員登録はご購入の手続きの中で（ゲスト購入も可）',
    '',
    '## 注文管理',
    '- 銀行振込：保留中 →（入金確認）→ 処理中',
    '- 発送したら「発送済み」に（送り状番号をメモで残す）… ステータスを追加',
    '',
  ].join('\n');

  const PLUGIN_HEAD = [
    '<?php',
    '/**',
    ' * Plugin Name: 仁秀 ショップ設定',
    ' * Description: 仁秀オンラインショップの WooCommerce 用カスタマイズ',
    ' * Version: 1.0.0',
    ' * Requires Plugins: woocommerce',
    ' */',
    '',
    "defined( 'ABSPATH' ) || exit;",
  ];
  /** the order status 「発送済み」 as typed: `key` is the status key (first 'shipped' — WooCommerce wants 'wc-shipped') */
  const STATUS = (key) => [
    '',
    '// 注文ステータス「発送済み」（発送して送り状番号をお知らせした注文）',
    "add_action( 'init', function () {",
    `\tregister_post_status( '${key}', [`,
    "\t\t'label'                     => '発送済み',",
    "\t\t'public'                    => false,",
    "\t\t'show_in_admin_all_list'    => true,",
    "\t\t'show_in_admin_status_list' => true,",
    "\t\t'label_count'               => _n_noop( '発送済み <span class=\"count\">(%s)</span>', '発送済み <span class=\"count\">(%s)</span>' ),",
    '\t] );',
    '} );',
    '',
    "add_filter( 'wc_order_statuses', function ( $statuses ) {",
    '\t$out = [];',
    '\tforeach ( $statuses as $key => $label ) {',
    '\t\t$out[ $key ] = $label;',
    "\t\tif ( 'wc-processing' === $key ) {",
    `\t\t\t$out['${key}'] = '発送済み';`,
    '\t\t}',
    '\t}',
    '\treturn $out;',
    '} );',
  ];
  const PLUGIN = (key) => [...PLUGIN_HEAD, ...(key ? STATUS(key) : []), ''].join('\n');

  const WPENV = JSON.stringify({
    core: 'WordPress/WordPress#7.1.4',
    phpVersion: '8.3',
    themes: ['./wp-content/themes/ego_woocommerce_tcd079'],
    plugins: ['./wp-content/plugins/ninshu-shop'],
    config: { WP_DEBUG: true, WPLANG: 'ja' },
  }, null, 2);
  const PKG = JSON.stringify({
    name: 'ninshu-ec',
    private: true,
    scripts: { start: 'wp-env start', stop: 'wp-env stop', wp: 'wp-env run cli wp' },
    devDependencies: { '@wordpress/env': '^11.4.0' },
  }, null, 2);

  const files = {
    'docs/requirements.md': REQ,
    'data/products-woocommerce.csv': CSV,
    'wp-content/plugins/ninshu-shop/ninshu-shop.php': PLUGIN(null),
    '.wp-env.json': WPENV,
    '.gitignore': ['node_modules/', '.env', 'wp-content/uploads/', ''].join('\n'),
    'package.json': PKG,
    'README.md': ['# ninshu-ec', '', '仁秀オンラインショップ（ninshu.com）の WordPress / WooCommerce。', '', '```', 'npm run start          # http://localhost:8888', 'npm run wp -- <コマンド>  # WP-CLI', '```', ''].join('\n'),
  };

  window.FILES = { files, CSV, HEAD, PLUGIN, STATUS, PLUGIN_HEAD, MISSING_PAIR, N_PRODUCTS, N_VARIABLE, skuOf, PR };
})();
