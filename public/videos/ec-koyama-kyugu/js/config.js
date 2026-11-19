/*
 * 小山弓具 公式オンラインショップ（www.koyama-kyugu.com, EC-CUBE 4）— 既存 EC サイトの機能改修（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面は本物（ローカルの EC-CUBE 4.3.1-p1：tools/snapshots/ec-koyama-kyugu/capture-ec.js → js/ec-snapshot.js）、
 * 公開中のショップは取り込み（npm run snapshot -- ec-koyama-kyugu → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'ec-koyama-kyugu',
  title: '小山弓具 — EC-CUBE 4 既存 EC サイトの機能改修 デモ',
  start: '2026-11-06T10:14',
  open: 'code', active: 'code',
  steps: ['依頼・現状確認', '開発環境', '受注生産：エンティティ拡張', '管理画面：商品登録', '商品ページ：在庫・納期の表示', '送料無料の条件：PurchaseFlow', 'カートの表示・テスト注文', '本番へ反映'],
  intro: {
    kicker: 'EC-CUBE 4 既存 EC サイトの機能改修',
    brand: '小山弓具 公式オンラインショップ',
    sub: '弓道具の専門店の EC-CUBE 4 に「受注生産・在庫の表示」と「矢・矢筒の送料無料の条件」を追加',
    url: 'www.koyama-kyugu.com — app/Customize（エンティティ拡張・FormType 拡張・Twig 拡張・PurchaseFlow・EventSubscriber）',
    steps: ['依頼の確認（受注生産の納期・送料無料の条件）', '開発環境（Docker・localhost:8080）', '商品のエンティティ拡張（受注生産・納期の目安）', '管理画面：商品登録の入力欄（FormType 拡張）', '商品ページ：在庫・納期の表示（Twig 拡張）', '送料無料の条件（PurchaseFlow）', 'カートの表示（EventSubscriber）・テスト注文', '本番へ反映'],
  },
  store: { name: '小山弓具', handle: 'koyama-kyugu', domain: 'www.koyama-kyugu.com', initials: '小', avatar: '#23324d' },
  project: { name: 'koyama-kyugu-ec', path: 'C:\\work\\koyama-kyugu-ec' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },   // the real EC-CUBE screens (shared/wordpress/wp-frame.js as window.EC)
  snapshot: {
    origin: 'https://www.koyama-kyugu.com',
    pages: { home: '/', product: '/products/detail/7', guide: '/user_data/guide' },
    views: ['pc'],
    remove: ['iframe'],
  },
};
