/*
 * 日清食品グループ オンラインストア — makeshop から Shopify Plus への移行（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'nissin-store',
  title: '日清食品グループ オンラインストア — makeshop → Shopify 移行 デモ',
  start: '2026-06-09T10:12',
  steps: ['データ書き出し', 'CSV 変換', '商品インポート', '顧客データ移行', 'URL リダイレクト', 'テーマ構築', 'ドメイン切り替え・公開'],
  intro: {
    kicker: 'makeshop → Shopify Plus',
    brand: '日清食品グループ オンラインストア',
    sub: 'ストア移行プロセス',
    url: 'store.nissin.com — 商品・顧客データの移行、URL リダイレクト、テーマ構築、ドメイン切り替え',
    steps: ['データ書き出し', 'CSV 変換', '商品インポート', '顧客データ移行', 'URL リダイレクト', 'テーマ構築', 'ドメイン切り替え'],
  },
  store: { name: '日清食品グループ オンラインストア', handle: 'store-nissin', domain: 'store.nissin.com', initials: '日清', avatar: '#ffb3b3' },
  project: { name: 'nissin-shopify-migration', path: 'C:\\dev\\nissin-shopify-migration' },
  snapshot: {
    origin: 'https://store.nissin.com',
    pages: { home: '/', product: '/products/13772' },
    remove: ['#shopify-pc__banner', '.shopify-pc__banner__dialog', '#preview-bar-iframe', '[id^="CybotCookiebot"]', '.needsclick'],
    catalog: 500,
    products: ['13772', '14001', '14000', '13999', '12329', '12331', '13809', '14067', '14066', '14033', '14032', '14031', '14030', '14029', '14028'],
  },
};
