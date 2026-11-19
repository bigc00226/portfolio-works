/*
 * Kanro POCKeT オンラインショップ — Shopify と社内の業務システム（基幹・物流 WMS・会員基盤）の連携（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'kanro-pocket',
  title: 'Kanro POCKeT — Shopify と業務システムの連携 デモ',
  start: '2026-11-12T11:20',
  open: 'code', active: 'code',
  steps: ['連携の全体設計', '受注連携', '在庫取り込み', '出荷連携', '会員連携', '監視・リトライ'],
  intro: {
    kicker: 'Shopify × 業務システム連携',
    brand: 'Kanro POCKeT',
    sub: 'オンラインショップと社内システムをつなぐ',
    url: 'kanro.jp — 受注・在庫・出荷・会員データの連携と、その監視',
    steps: ['連携の全体設計', '受注連携（Webhook）', '在庫取り込み', '出荷連携', '会員連携', '監視・リトライ'],
  },
  store: { name: 'Kanro POCKeT', handle: 'kanroec', domain: 'kanro.jp', initials: 'KP', avatar: '#f5c26b' },
  project: { name: 'kanro-ec-gateway', path: 'C:\\dev\\kanro-ec-gateway' },
  snapshot: {
    origin: 'https://kanro.jp',
    pages: { home: '/', product: '/products/15255718166896' },
    remove: ['#preview-bar-iframe', '[id^="CybotCookiebot"]', '.needsclick', '#shopify-pc__banner', '#chat-button', '.grecaptcha-badge'],
    catalog: 250,
    products: ['15407894200688', '15255718166896', '15426074214768', '15397790581104', '15397790843248', '15407884009840', '15409094754672', '15424390365552', '15264861225328', '15197606838640', '15428492263792', '14624053461360'],
  },
};
