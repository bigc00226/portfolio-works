/*
 * ＠ベリーネット（b-net.tackleberry.co.jp, EC-CUBE 4; タックルベリー）— 店舗システムとの連携（Web API・GraphQL）（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面と API の応答は本物（ローカルの EC-CUBE 4.3.1-p1 + 同梱の Web API プラグイン Api42：
 * tools/snapshots/ec-tackleberry-api/capture-ec.js → js/ec-snapshot.js）、公開中のショップは取り込み（npm run snapshot -- ec-tackleberry-api）。
 */
window.VIDEO = {
  id: 'ec-tackleberry-api',
  title: '＠ベリーネット — EC-CUBE 4 店舗システムとの連携（Web API・GraphQL）デモ',
  start: '2026-10-21T10:06',
  open: 'code', active: 'code',
  steps: ['依頼・現状確認', 'Web API プラグイン', 'API クライアントと認可', '店頭販売の在庫を反映', '注文を在庫店舗へ（WebHook）', '出荷完了を EC へ', 'トークン更新・定期実行', '本番へ反映'],
  intro: {
    kicker: 'EC-CUBE 4 外部システム連携',
    brand: '＠ベリーネット',
    sub: '全国の店舗の中古釣具を載せる WEB ショップと、店舗の在庫システムを Web API（GraphQL）でつなぐ',
    url: 'b-net.tackleberry.co.jp — Web API プラグイン（Api42）・OAuth2.0・GraphQL・WebHook',
    steps: ['依頼・現状確認（店頭展示併売品の在庫）', 'Web API プラグイン（Api42）の有効化', 'API クライアントの登録・OAuth2.0 の認可', '店頭で売れた商品の在庫を 0 に（updateProductStock）', '注文を在庫店舗へ（WebHook・署名の検証）', '出荷完了と追跡番号を EC へ（updateShipped）', 'トークンの更新・ログ・定期実行', '本番へ反映'],
  },
  store: { name: '＠ベリーネット', handle: 'b-net', domain: 'b-net.tackleberry.co.jp', initials: 'B', avatar: '#e60012' },
  project: { name: 'berrynet-eccube', path: 'C:\\work\\berrynet-eccube' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },   // the real EC-CUBE screens (shared/wordpress/wp-frame.js as window.EC)
  snapshot: {
    origin: 'https://b-net.tackleberry.co.jp',
    pages: { detail: '/products/detail/1370032', tradelaw: '/help/tradelaw' },
    views: ['pc'],
    remove: ['iframe'],
  },
};
