/*
 * Hanahiro ONLINE SHOP — makeshop での EC サイト新規構築（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'makeshop-hanahiro',
  title: 'Hanahiro ONLINE SHOP — makeshop EC サイト新規構築 デモ',
  start: '2026-11-07T13:10',
  steps: ['カテゴリ設定', '商品登録', 'トップページ構築', '会員登録・ログイン', '決済・配送設定', '注文フローの確認', '公開'],
  intro: {
    kicker: 'makeshop byGMO',
    brand: '花・フラワーギフト Hanahiro｜ONLINE SHOP',
    sub: 'EC サイト新規構築プロセス',
    url: 'www.hanahiro-onlineshop.jp — カテゴリ・商品登録、トップページ、会員、決済・配送、注文フローの確認、公開',
    steps: ['カテゴリ設定', '商品登録', 'トップページ構築', '会員登録・ログイン', '決済・配送設定', '注文フローの確認', '公開'],
  },
  store: { name: '花・フラワーギフト Hanahiro｜ONLINE SHOP', handle: 'hanahiro8787', domain: 'www.hanahiro-onlineshop.jp', initials: '花', avatar: '#e8c9cf' },
  project: { name: 'hanahiro-makeshop', path: 'C:\\dev\\hanahiro-makeshop' },
  // the live shop (a makeshop shop: pages only — the product data comes from its public list / item pages, js/files.js)
  snapshot: {
    origin: 'https://www.hanahiro-onlineshop.jp',
    pages: { home: '/', list: '/view/category/mothorchid', all: '/view/category/all_items', product: '/view/item/000000001982', guide: '/view/guide' },
    // the notice of 2026-11-13 (after the video's day) is taken out of the top page and the news lists
    remove: ['section.home-important-notice-v2', 'dd:has(a[href*="20261113112330"])', 'dt:has(+ dd a[href*="20261113112330"])', '#onetrust-consent-sdk', 'iframe'],
  },
};
