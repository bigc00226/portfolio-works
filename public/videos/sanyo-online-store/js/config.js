/*
 * SANYO ONLINE STORE — 既存ストアの機能改善（ブランド横断の絞り込み・店舗在庫 / OMO・表示速度）
 * shared/kit/dom.js が読む設定
 */
window.VIDEO = {
  id: 'sanyo-online-store',
  title: 'SANYO ONLINE STORE — 既存ストアの機能改善（ブランド横断・OMO）デモ',
  start: '2026-11-05T09:55',
  steps: ['現状分析', 'ブランド横断の絞り込み', '店舗在庫の表示（OMO）', 'パフォーマンス改善'],
  intro: {
    kicker: 'Shopify Plus — 既存ストアの機能改善',
    brand: 'SANYO ONLINE STORE',
    sub: '複数ブランドの横断検索と、店舗在庫（OMO）の改善プロセス',
    url: 'store.sanyo-shokai.co.jp — 現状分析、ブランドの絞り込み、店舗在庫の表示、表示速度の改善',
    steps: ['現状分析', 'ブランド横断の絞り込み', '店舗在庫の表示（OMO）', 'パフォーマンス改善'],
  },
  store: { name: 'SANYO ONLINE STORE', handle: 'sanyo-online-store', domain: 'store.sanyo-shokai.co.jp', initials: 'SO', avatar: '#c9d3e3' },
  project: { name: 'sanyo-online-store-theme', path: 'C:\\dev\\sanyo-online-store-theme' },
  snapshot: {
    origin: 'https://store.sanyo-shokai.co.jp',
    pages: { home: '/', collection: '/collections/all?gender=WOMEN&category=01-001001012', product: '/products/h5b41876' },
    remove: ['#preview-bar-iframe', '[id^="CybotCookiebot"]', '.needsclick', '#shopify-pc__banner', '.shopify-pc__banner__dialog'],
  },
};
