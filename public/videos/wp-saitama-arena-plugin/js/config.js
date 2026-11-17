/*
 * GMOアリーナさいたま — WordPress 独自プラグイン「Arena Events Sync」の開発（催事管理システムとのイベント連携）
 * （shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-saitama-arena-plugin',
  title: 'GMOアリーナさいたま — WordPress 独自プラグイン開発（イベント連携） デモ',
  start: '2026-11-13T10:31',
  open: 'code', active: 'code',
  steps: ['要件・設計', 'API クライアント', '管理画面・設定', '同期とエラー処理', '本日開催のイベント', '自動化・コードチェック', '本番へ反映'],
  intro: {
    kicker: 'WordPress 独自プラグイン・PHP 機能開発',
    brand: 'GMOアリーナさいたま',
    sub: '催事管理システムのイベントを、イベントスケジュールへ自動で取り込むプラグイン',
    url: 'www.saitama-arena.co.jp/schedule/ — 独自管理画面・外部 API 連携・本日開催のイベント・毎日の自動同期',
    steps: ['要件・設計（API の仕様）', 'API クライアント（wp_remote_get）', '管理画面：設定・同期ログ', '同期とエラー処理', '本日開催のイベント（テンプレートタグ・REST API）', '自動化（WP-Cron・WP-CLI）・コードチェック', '本番サーバーへ反映'],
  },
  store: { name: 'GMOアリーナさいたま', handle: 'saitama-arena', domain: 'www.saitama-arena.co.jp', initials: 'SA', avatar: '#e60012' },
  project: { name: 'saitama-arena-wp', path: 'C:\\work\\saitama-arena-wp' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://www.saitama-arena.co.jp',
    pages: { home: '/', schedule: '/schedule/' },
    views: ['pc'],
    remove: ['iframe', '#wpadminbar'],
  },
};
