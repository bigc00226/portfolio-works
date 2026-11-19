/*
 * CAGIANA《カジーナ》（cagiana.jp, EC-CUBE 3）— EC-CUBE 3 から EC-CUBE 4 へのデータ移行（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面は本物：移行元はローカルの EC-CUBE 3.0.18-p7（tools/snapshots/ec-cagiana-migration/capture-ec3.js）、
 * 移行先はローカルの EC-CUBE 4.3.1-p1（capture-ec.js）→ どちらも js/ec-snapshot.js。公開中のショップは取り込み
 * （npm run snapshot -- ec-cagiana-migration → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'ec-cagiana-migration',
  title: 'CAGIANA《カジーナ》 — EC-CUBE 3 → 4 データ移行 デモ',
  start: '2026-11-11T10:05',
  open: 'code', active: 'code',
  steps: ['現状調査（EC-CUBE 3）', 'バックアップ', 'EC-CUBE 4.3 の準備', 'データ移行の実行', '件数・データの確認', '画像とテーマ', '旧 URL のリダイレクト', '本番切り替え'],
  intro: {
    kicker: 'EC-CUBE 3 → 4 データ移行',
    brand: 'CAGIANA《カジーナ》',
    sub: 'オーダーメイドシューズのショップを、サポートの終わった EC-CUBE 3 から EC-CUBE 4.3 へ（商品・カテゴリ・会員・受注・画像・テーマ・URL）',
    url: 'cagiana.jp — データ移行用バックアッププラグイン（3.0 系）→ データ移行プラグイン for EC-CUBE4（4.3 対応版）',
    steps: ['現状調査：EC-CUBE 3.0.17・プラグイン・データの件数', 'バックアップ：DB（CSV の tar.gz）と商品画像', 'EC-CUBE 4.3 の準備：データ移行プラグインと依存ライブラリ', 'データ移行の実行（SQLite 対応・AUTH_MAGIC）', '件数・データの確認（両方の管理画面・会員ログイン）', '画像の移動とテーマ（Twig 3）', '旧 URL のリダイレクト（301）', '本番切り替え：差分の移行・DNS・確認'],
  },
  store: { name: 'CAGIANA', handle: 'cagiana', domain: 'cagiana.jp', initials: 'C', avatar: '#1a1a1a' },
  project: { name: 'cagiana-ec4', path: 'C:\\work\\cagiana-ec4' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },   // the real EC-CUBE screens (shared/wordpress/wp-frame.js as window.EC)
  snapshot: {
    origin: 'https://cagiana.jp',
    pages: { home: '/ec', product: '/products/detail/103', list: '/products/list' },
    views: ['pc'],
    remove: ['iframe'],
  },
};
