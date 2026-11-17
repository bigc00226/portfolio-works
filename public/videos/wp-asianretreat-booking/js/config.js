/*
 * アジアンリトリート — WordPress に予約システム（Booking Package）を導入（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-asianretreat-booking',
  title: 'アジアンリトリート — WordPress 予約システムの導入 デモ',
  start: '2026-11-12T10:12',
  open: 'code', active: 'code',
  steps: ['プラグインの導入', 'メニューと料金', '営業時間・予約枠', '入力項目・通知メール', 'オンライン決済', '予約ページ・テスト予約', '予約の管理'],
  intro: {
    kicker: 'WordPress 予約システムの導入',
    brand: 'アジアンリトリート',
    sub: '湘南発 出張マッサージ — カレンダー予約・オンライン決済',
    url: 'asianretreat.jp — Booking Package・メニュー登録・予約枠・通知メール・Stripe 決済・予約管理',
    steps: ['Booking Package の導入', 'メニューと料金（サービス）', '営業時間・予約枠', '入力項目・通知メール', 'オンライン決済（Stripe）', '予約ページ・テスト予約', '予約・顧客の管理'],
  },
  store: { name: 'アジアンリトリート', handle: 'asianretreat', domain: 'asianretreat.jp', initials: 'AR', avatar: '#c9b79c' },
  project: { name: 'asianretreat', path: 'C:\\dev\\asianretreat' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://asianretreat.jp',
    pages: { home: '/', booking: '/booking/', menu: '/menu/' },
    remove: ['#site_loader_overlay', '#site_loader_animation', 'iframe', '#wpadminbar'],
  },
};
