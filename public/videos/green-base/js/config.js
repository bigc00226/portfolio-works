/*
 * GREEN BASE — テーマ選定とメタフィールド（メタオブジェクト）による商品ページのカスタマイズ（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'green-base',
  title: 'GREEN BASE — Shopify テーマ選定・メタフィールドによるカスタマイズ デモ',
  start: '2026-07-07T13:40',
  steps: ['テーマ選定', 'メタオブジェクト定義', '商品データ入力', 'Liquid カスタマイズ', 'テーマエディタで接続', 'レスポンシブ確認'],
  intro: {
    kicker: 'Shopify テーマ × メタフィールド',
    brand: 'GREEN BASE',
    sub: 'テーマ選定と商品ページのカスタマイズ',
    url: 'green-base.jp — 観葉植物の通販：テーマ選定、育て方データのメタオブジェクト化、Liquid、テーマエディタ',
    steps: ['テーマ選定', 'メタオブジェクト定義', '商品データ入力', 'Liquid カスタマイズ', 'テーマエディタで接続', 'レスポンシブ確認'],
  },
  store: { name: 'GREEN BASE', handle: 'greenbase-online', domain: 'green-base.jp', initials: 'GB', avatar: '#b9dfb0' },
  project: { name: 'greenbase-theme', path: 'C:\\dev\\greenbase-theme' },
  snapshot: {
    origin: 'https://green-base.jp',
    pages: { home: '/', product: '/products/pachira_s-rhomb_s_beige' },
    remove: ['#shopify-pc__banner', '#preview-bar-iframe', '[id^="CybotCookiebot"]', '.needsclick', '#chat-button', '[id*="line-friends"]', '#shopify-chat', 'inbox-online-store-chat'],
    catalog: 250,
    products: ['pachira_s-rhomb_s_beige', 'パキラ-s-ロムs-ブラック', 'monstera_s-rhomb_s_black', 'monstera_s-rhomb_s_bluegray', 'monstera_s-rhomb_s_beige', 'monstera_s-particlepot_m_brown', 'monstera_s-tidypot_s_white', 'monstera_s-glossy_s_black', 'sansevieria_l-cautes_m_white', 'pachira_s-musa_s_white', 'pachira_s-riabowl_l_gray'],
  },
};
