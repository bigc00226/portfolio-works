/*
 * Garage（ガラージ）— garage.plus.co.jp（EC-CUBE 2）の帳票・PDF・CSV のカスタマイズ（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面・PDF・CSV は本物（tools/snapshots/ec-garage-forms/capture-ec.js → js/ec-snapshot.js・assets/pdf/）、
 * ショップの画面は公開中のサイトの取り込み（npm run snapshot -- ec-garage-forms → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'ec-garage-forms',
  title: 'Garage（ガラージ）— EC-CUBE 2 帳票・PDF・CSV のカスタマイズ デモ',
  start: '2026-11-16T10:20',
  open: 'code', active: 'code',
  steps: ['依頼・現状確認', '納品書のロゴと品番の列', '帳票の初期値・一括出力', '出荷指示 CSV', '商品の CSV 一括登録', '本番へ反映'],
  intro: {
    kicker: 'EC-CUBE 2 帳票・PDF・CSV',
    brand: 'Garage（ガラージ）',
    sub: 'オフィス家具の通販サイトの納品書 PDF・出荷用 CSV・商品の一括登録',
    url: 'garage.plus.co.jp — EC-CUBE 2：帳票出力（FPDF）・CSV出力項目設定・商品登録CSV',
    steps: ['依頼・現状確認（受注管理・帳票出力）', '納品書：ロゴと「品番」の列（SC_Fpdf_Ex）', '帳票の初期値・一括出力（LC_Page_Admin_Order_Pdf_Ex）', '出荷指示 CSV（CSV出力項目設定 › 高度な設定）', '新着商品の CSV 一括登録（商品登録CSV）', '本番サーバーへ反映'],
  },
  store: { name: 'Garage（ガラージ）', handle: 'garage', domain: 'garage.plus.co.jp', initials: 'G', avatar: '#222' },
  project: { name: 'garage-eccube', path: 'C:\work\garage-eccube' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>', pdf: '<div class="pv" id="pv"><img id="pvImg" alt=""><div id="pvSpots"></div></div>' },
  snapshot: {
    origin: 'https://garage.plus.co.jp',
    pages: { home: '/', fresh: '/products/detail.php?product_id=179746', desk: '/products/detail.php?product_id=179812' },
    views: ['pc'],
    remove: ['iframe', '#karte-tracker', '.karte-widget'],
  },
};
