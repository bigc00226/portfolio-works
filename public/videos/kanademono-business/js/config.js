/*
 * KANADEMONO for BUSINESS — 法人向けの見積もり・お問い合わせ機能（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'kanademono-business',
  title: 'KANADEMONO for BUSINESS — 法人向け見積もり・お問い合わせ機能 デモ',
  start: '2026-11-08T10:30',
  steps: ['要件整理', '法人会員登録フォーム', '会社・法人カタログ', 'カンタン見積もり', '下書き注文・請求書', '通知メール', '動作テスト'],
  intro: {
    kicker: 'Shopify Plus B2B',
    brand: 'KANADEMONO for BUSINESS',
    sub: '法人向け 見積もり・お問い合わせ機能の開発プロセス',
    url: 'kanademono.design/pages/business — 法人会員登録、法人価格（カタログ）、カンタン見積もり、請求書払い、お問い合わせ',
    steps: ['要件整理', '法人会員登録フォーム', '会社・法人カタログ', 'カンタン見積もり', '下書き注文・請求書', '通知メール', '動作テスト'],
  },
  store: { name: 'KANADEMONO', handle: 'kanademono', domain: 'kanademono.design', initials: 'KA', avatar: '#d9c7a8' },
  project: { name: 'kanademono-b2b', path: 'C:\\dev\\kanademono-b2b' },
  snapshot: {
    origin: 'https://kanademono.design',
    pages: { business: '/pages/business', product: '/products/och-125', desk: '/products/dsk-k72-lft2' },
    remove: ['#shopify-section-newsletter-popup', '#preview-bar-iframe', '[id^="CybotCookiebot"]', '.needsclick', '#chat-button', '[id*="chat-widget"]', '.shopify-pc__banner__dialog', '#shopify-pc__banner'],
    css: '#register-sec .video-wrapper { display: none !important; }',
    catalog: 250,
    products: ['och-125', 'och-126', 'och-124', 'dsk-k72-lft2', 'dsk-k73-lft2', 'dsk-k75-lft2', 'ltb-111', 'sdt-135', 'sf-149', 'ctb-k60r-pin4-bk-m', 'bnc-109', 'bnc-111', 'mnt-105', 'try-k0087'],
  },
};
