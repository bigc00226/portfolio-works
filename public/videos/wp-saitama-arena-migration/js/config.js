/*
 * GMOアリーナさいたま — WordPress（マルチサイト）のサーバー移転と新ドメイン arena.gmo への移行準備
 * （shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-saitama-arena-migration',
  title: 'GMOアリーナさいたま — WordPress サーバー移転・ドメイン移行 デモ',
  start: '2026-11-10T22:04',
  open: 'code', active: 'code',
  steps: ['移転前の確認', 'バックアップ', 'データ移行', 'ロードバランサー・SSL', 'hosts で事前確認', 'DNS 切り替え', '新ドメインの準備'],
  intro: {
    kicker: 'WordPress サーバー移転・ドメイン移行',
    brand: 'GMOアリーナさいたま',
    sub: 'マルチサイト（本体・イベントスケジュール・お知らせ）を新しいサーバーへ',
    url: 'www.saitama-arena.co.jp → 新サーバー（ロードバランサー + SSL）／ 新ドメイン arena.gmo',
    steps: ['移転前の確認（旧サーバー）', 'バックアップ・メンテナンス', 'データベース・ファイルの移行', 'ロードバランサー・SSL 証明書', 'hosts で事前確認', 'DNS 切り替え', '新ドメイン arena.gmo の準備'],
  },
  store: { name: 'GMOアリーナさいたま', handle: 'saitama-arena', domain: 'www.saitama-arena.co.jp', initials: 'SA', avatar: '#e60012' },
  project: { name: 'saitama-arena-migration', path: 'C:\\work\\saitama-arena-migration' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: {
    wp: '<div id="wpPage"></div>',
    neterr: '<div id="netErr"></div>',
  },
  snapshot: {
    origin: 'https://www.saitama-arena.co.jp',
    pages: { home: '/', schedule: '/schedule/', notice: '/news/2026/10283546.html' },
    views: ['pc'],
    remove: ['iframe', '#wpadminbar'],
  },
};
