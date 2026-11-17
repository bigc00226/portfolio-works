/*
 * 仁秀 NINSHU（ninshu.com）— WooCommerce による EC サイト構築（shared/kit/dom.js が読む設定）
 * WordPress の画面は本物（tools/snapshots/wp-ninshu-woocommerce/capture-wp.js → js/wp-snapshot.js）、
 * ストアの画面は公開中のサイトの取り込み（npm run snapshot -- wp-ninshu-woocommerce → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'wp-ninshu-woocommerce',
  title: '仁秀 NINSHU — WooCommerce による EC サイト構築 デモ',
  start: '2026-11-04T10:05',
  open: 'code', active: 'code',
  steps: ['WooCommerce の導入', '商品登録・商品管理', '配送方法・送料', 'オンライン決済', '会員登録・ログイン', '注文管理'],
  intro: {
    kicker: 'WordPress × WooCommerce',
    brand: '仁秀 NINSHU',
    sub: '京焼・清水焼の器のオンラインショップを WooCommerce で構築',
    url: 'ninshu.com — 商品登録・決済・送料・会員登録・注文管理',
    steps: ['WooCommerce の導入・ストア設定', '商品登録（CSV インポート）', '配送方法・送料設定', 'オンライン決済', '会員登録・ログイン', '注文管理'],
  },
  store: { name: '仁秀｜NINSHU', handle: 'ninshu', domain: 'ninshu.com', initials: '仁', avatar: '#b9975b' },
  project: { name: 'ninshu-ec', path: 'C:\dev\ninshu-ec' },
  pages: { wp: '<div id="wpPage"></div>' },   // the real WordPress screens (shared/wordpress/wp-frame.js)
  snapshot: {
    origin: 'https://ninshu.com',
    pages: { home: '/', product: '/product/fc-zen/', cart: '/cart/?add-to-cart=494', account: '/my-account/' },
    remove: ['#cookie-notice', '.grecaptcha-badge', '#wpadminbar'],
  },
};
