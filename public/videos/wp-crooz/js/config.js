/*
 * クルーズ株式会社 — WordPress によるコーポレートサイトの新規制作（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-crooz',
  title: 'クルーズ株式会社 — WordPress コーポレートサイト制作 デモ',
  start: '2026-11-07T10:39',
  open: 'code', active: 'code',
  steps: ['開発環境・テーマ導入', 'デザイン・メニュー', '会社概要ページ', '事業紹介ページ', 'お問い合わせフォーム', 'スマートフォン対応'],
  intro: {
    kicker: 'WordPress コーポレートサイト制作',
    brand: 'クルーズ株式会社',
    sub: '企業ホームページの新規制作',
    url: 'crooz.co.jp — オリジナルテーマ・会社概要・事業紹介・お問い合わせ・レスポンシブ対応',
    steps: ['開発環境・テーマ導入', 'デザイン・メニュー', '会社概要', '事業紹介', 'お問い合わせ（Contact Form 7）', 'スマートフォン対応'],
  },
  store: { name: 'クルーズ株式会社', handle: 'crooz', domain: 'crooz.co.jp', initials: 'CR', avatar: '#9fd3f0' },
  project: { name: 'crooz-corporate', path: 'C:\\dev\\crooz-corporate' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://crooz.co.jp',
    pages: { home: '/', overview: '/about/overview', business: '/business', contact: '/contact' },
    remove: ['.grecaptcha-badge', 'iframe', '#wpadminbar'],
  },
};
