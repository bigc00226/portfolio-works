/*
 * 株式会社ライト光機製作所 — Wix 企業ホームページの新規制作（shared/kit/dom.js が読む設定）
 * The Wix editor (login-only) is rebuilt by shared/wix/wix.js; its canvas shows the real pages of www.light-op.co.jp
 * (captured: js/site-snapshot.js, npm run snapshot -- wix-light-op).
 */
window.VIDEO = {
  id: 'wix-light-op',
  title: '株式会社ライト光機製作所 — Wix 企業ホームページ制作 デモ',
  start: '2026-11-10T14:05',
  pins: 'explorer edge chrome:browser',
  steps: ['ページ構成', 'ヘッダー・メインビジュアル', '製品・サービス', '会社概要', '採用・お問い合わせ', 'モバイル調整', '公開'],
  intro: {
    kicker: 'Wix × 企業ホームページ',
    brand: '株式会社ライト光機製作所',
    sub: '製造業の企業ホームページを Wix で新規制作',
    url: 'www.light-op.co.jp — ライフルスコープ・双眼鏡の光学機器メーカー：構成設計からページ制作・レスポンシブ・公開まで',
    steps: ['ページ構成・サイトメニュー', 'ヘッダー・メインビジュアル', '製品紹介・サービス', '会社概要', '採用情報・お問い合わせ', 'モバイル調整', '公開・公開サイトの確認'],
  },
  wix: { site: 'light-op', siteName: 'ライト光機製作所', domain: 'www.light-op.co.jp', siteId: '3f1c6a2e-8b4d-4e57-9a1c-6d2f0b7e4c18' },
  snapshot: {
    origin: 'https://www.light-op.co.jp',
    pages: { home: '/', products: '/products', overview: '/about/overview', development: '/development', recruit: '/recruit', contact: '/contact' },
    remove: ['#WIX_ADS', '[data-hook="consent-banner-root"]', '#consent-banner-root', '.consent-banner-root', '#SCROLL_TO_TOP'],
  },
};
