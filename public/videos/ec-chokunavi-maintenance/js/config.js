/*
 * 販促品直ナビ（www.chokunavi.shop, EC-CUBE 4; 敷島産業株式会社）— サーバー・セキュリティ・保守（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面と出力は本物（ローカルの EC-CUBE 4.3.1 → 4.3.1-p1：tools/snapshots/ec-chokunavi-maintenance/capture-ec.js → js/ec-snapshot.js）、
 * 公開中のショップは取り込み（npm run snapshot -- ec-chokunavi-maintenance）。本番サーバーでの作業は再現。
 */
window.VIDEO = {
  id: 'ec-chokunavi-maintenance',
  title: '販促品直ナビ — EC-CUBE 4 サーバー・セキュリティ・保守 デモ',
  start: '2026-11-17T10:02',
  open: 'code', active: 'code',
  steps: ['依頼・外からの確認', '健康診断（EC-CUBE）', 'セキュリティチェック', '管理画面の防御', '設定とファイル', 'バックアップと復元テスト', 'パッチ適用（4.3.1-p1）', '本番へ反映・報告'],
  intro: {
    kicker: 'EC-CUBE 4 サーバー・セキュリティ・保守',
    brand: '販促品直ナビ',
    sub: 'ノベルティ・販促品の EC サイト（EC-CUBE 4）の保守契約：健康診断・管理画面の防御・バックアップ・セキュリティパッチ',
    url: 'www.chokunavi.shop — EC-CUBE 4.3 の検証環境で確かめてから本番へ',
    steps: ['依頼・外から見える情報（ヘッダー・証明書・テンプレート）', '健康診断（バージョン・プラグイン・ログイン履歴・ログ）', 'セキュリティチェックプラグイン', '管理画面 URL・IP 制限・2段階認証・ロック', '.env・Web サーバーの設定・権限', 'バックアップと復元テスト', '4.3.1-p1 の適用（メンテナンスモード）', '本番へ反映・監視・保守報告'],
  },
  store: { name: '販促品直ナビ', handle: 'chokunavi', domain: 'www.chokunavi.shop', initials: '直', avatar: '#e8380d' },
  project: { name: 'chokunavi-eccube', path: 'C:\\work\\chokunavi-eccube' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },   // the real EC-CUBE screens (shared/wordpress/wp-frame.js as window.EC)
  snapshot: {
    origin: 'https://www.chokunavi.shop',
    pages: { home: '/', detail: '/products/detail/14554' },
    views: ['pc'],
    remove: ['iframe'],
  },
};
