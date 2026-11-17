/*
 * 福岡正信自然農園 — WordPress（WooCommerce）の会員制サイト・ログイン機能（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-f-masanobu-members',
  title: '福岡正信自然農園 — 会員制サイト・ログイン機能 デモ',
  start: '2026-11-11T13:20',
  open: 'code', active: 'code',
  steps: ['会員登録の設定', '登録フォーム', '会員情報の管理', 'マイページ', '卸会員（B2BKing）', '限定コンテンツ・権限'],
  intro: {
    kicker: 'WordPress 会員制サイト・ログイン機能',
    brand: '福岡正信自然農園',
    sub: '会員登録・マイページ・卸会員・限定コンテンツ',
    url: 'f-masanobu.jp — WooCommerce のアカウント機能・B2BKing・Members',
    steps: ['会員登録の設定（WooCommerce）', '登録フォームの項目', '会員情報の管理', 'マイページのメニュー', '卸会員グループと卸価格', '会員限定ページと権限'],
  },
  store: { name: '福岡正信自然農園', handle: 'fmasanobu', domain: 'f-masanobu.jp', initials: '福', avatar: '#c9b48a' },
  project: { name: 'fmasanobu-shop', path: 'C:\\dev\\fmasanobu-shop' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://f-masanobu.jp',
    pages: {
      home: '/',
      account: '/account/',
      register: '/account/?register=1',
      product: '/product/iyokanmarmalade/',
      bigpurchase: '/big-purchase',
      notfound: '/account/member-status/',
    },
    views: ['pc'],
    remove: ['.grecaptcha-badge', 'iframe', '#wpadminbar', '#js-loading'],
    // typing into the registration form (js/apps.js: the inputs become look-alike boxes with their own computed style);
    // a member's data is blurred
    css: `.demo-caret { display: inline-block; width: 1px; height: 1.15em; background: currentColor; margin: 0 0 0 1px; vertical-align: -0.2em; animation: demoBlink 1s steps(1) infinite; }
      @keyframes demoBlink { 50% { opacity: 0; } }
      .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-underline-offset: .2em; text-decoration-skip-ink: none; }
      .demo-ime.conv { text-decoration-style: solid; }
      .demo-ime.conv.active { text-decoration-thickness: 3px; background: rgba(56,88,233,.2); }
      .demo-box { overflow: hidden; cursor: text; }
      .demo-box .demo-ph { color: var(--demo-ph, #757575); }
      .demo-box.demo-focus { outline: -webkit-focus-ring-color auto 1px; }
      .pii { filter: blur(5px); }`,
  },
};
