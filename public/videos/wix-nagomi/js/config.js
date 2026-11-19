/*
 * Nagomi Nature Connections — Wix サービス紹介サイト・予約導線の制作（shared/kit/dom.js が読む設定）
 * A service-introduction site whose pages lead to a booking request form (not a single landing page).
 * The Wix editor (login-only) is rebuilt by shared/wix/wix.js; its canvas shows the real pages of www.nagomi-nc.com
 * (captured read-only: js/site-snapshot.js, npm run snapshot -- wix-nagomi — no booking request was ever sent).
 */
window.VIDEO = {
  id: 'wix-nagomi',
  title: 'Nagomi Nature Connections — Wix サービス紹介サイト・予約導線 デモ',
  start: '2026-11-12T14:20',
  pins: 'explorer edge chrome:browser',
  steps: ['サイト構成・メニュー', 'メインビジュアル・写真', '体験プログラム', '特徴・FAQ・ブログ', '予約リクエストフォーム', 'スマホ対応', '公開'],
  intro: {
    kicker: 'Wix × サービス紹介サイト',
    brand: 'Nagomi Nature Connections',
    sub: '体験ツアーの紹介サイトと、予約リクエストまでの導線を Wix で',
    url: 'www.nagomi-nc.com — 西湖・本栖湖のカヤック・SUP 体験：プログラムの紹介から予約リクエストフォームまで',
    steps: ['サイト構成・メニュー', 'メインビジュアル・写真', '体験プログラム（カヤック・SUP）', '特徴・FAQ・ブログ・お知らせ', '予約リクエストフォーム', 'スマホ対応', '公開・公開サイトの確認'],
  },
  wix: { site: 'nagomi-nc', siteName: 'Nagomi Nature Connections', domain: 'www.nagomi-nc.com', siteId: '8b27d4f1-5c3e-4a90-b6d2-1e7f93ac0d54' },
  snapshot: {
    origin: 'https://www.nagomi-nc.com',
    pages: { home: '/', sup: '/sup', kayak: '/kayak', qa: '/qa', blog: '/blog', contact: '/contact' },
    remove: ['#WIX_ADS', '[data-hook="consent-banner-root"]', '#consent-banner-root', '.consent-banner-root', '#SCROLL_TO_TOP'],
  },
};
