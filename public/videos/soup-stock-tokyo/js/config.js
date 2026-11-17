/*
 * Soup Stock Tokyo 公式オンラインショップ — 倉庫・店舗の在庫と EC の在庫・商品の同期（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'soup-stock-tokyo',
  title: 'Soup Stock Tokyo 公式オンラインショップ — 在庫連携（倉庫・店舗 ⇄ Shopify）デモ',
  start: '2026-08-25T15:41',   // the first scheduled run watched live is the one of 15:45
  steps: ['在庫連携の設計', 'ロケーション設定', '同期スクリプト', 'エラー処理・再試行', '定期実行', '在庫・ストア表示の確認'],
  intro: {
    kicker: 'Shopify × 倉庫・店舗の在庫連携',
    brand: 'Soup Stock Tokyo',
    sub: '公式オンラインショップ 在庫同期の構築プロセス',
    url: 'ec.soup-stock-tokyo.com — 冷凍・常温倉庫と店舗の在庫を、Admin API で Shopify に同期',
    steps: ['在庫連携の設計', 'ロケーション設定', '同期スクリプト', 'エラー処理・再試行', '定期実行', '在庫・ストア表示の確認'],
  },
  store: { name: 'Soup Stock Tokyo オンラインショップ', handle: 'soup-stock-tokyo', domain: 'ec.soup-stock-tokyo.com', initials: 'SS', avatar: '#f5d76e' },
  project: { name: 'sst-inventory-sync', path: 'C:\\dev\\sst-inventory-sync' },
  snapshot: {
    origin: 'https://ec.soup-stock-tokyo.com',
    pages: { home: '/', select: '/products/106001a', gift: '/products/100011a', soup: '/collections/soup' },
    remove: ['#shopify-pc__banner', '.shopify-pc__banner__dialog', '#preview-bar-iframe', '[id^="CybotCookiebot"]', '#chat-button', '.needsclick', '#shopify-chat'],
    // the product column is sticky on the live store; static here so a scripted scroll can bring the cart button up
    css: '.Product__Info { position: relative !important; top: 0 !important; }',
    catalog: 250,
    products: ['106001a', '105612a', '100006a', '106004a', '105755a', '106005a', '100001a', '105703a', '100062a', '106057a', '105622a', '100011a'],
  },
};
