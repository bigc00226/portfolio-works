/*
 * あみだ池大黒オンラインショップ（www.daikoku.ne.jp/shop, EC-CUBE 4）— 専用プラグインの開発（ギフトのし）（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面は本物（ローカルの EC-CUBE 4.3.1-p1：tools/snapshots/ec-daikoku-plugin/capture-ec.js → js/ec-snapshot.js）、
 * 公開中のショップは取り込み（npm run snapshot -- ec-daikoku-plugin → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'ec-daikoku-plugin',
  title: 'あみだ池大黒 — EC-CUBE 4 専用プラグイン開発（ギフトのし）デモ',
  start: '2026-11-03T10:12',
  open: 'code', active: 'code',
  steps: ['依頼・現状確認', 'プラグインの雛形', 'データと管理画面のコード', 'インストール・管理画面', '注文手続きの のし指定', 'テスト注文・受注・メール', '無効化・有効化と配送CSV', 'パッケージ・本番反映'],
  intro: {
    kicker: 'EC-CUBE 4 専用プラグイン開発',
    brand: 'あみだ池大黒',
    sub: '創業 1805 年・大阪銘菓「おこし」のオンラインショップに、お届け先ごとの のし指定（外のし・内のし／表書き／名入れ）を',
    url: 'www.daikoku.ne.jp/shop — app/Plugin/DaikokuGift（Entity・管理画面・FormExtension・TemplateEvent・配送CSV）',
    steps: ['依頼・現状確認（のし指定は備考欄）', 'eccube:plugin:generate でプラグインの雛形', 'エンティティ・管理画面（独自メニュー・設定・表書き）', 'インストール・有効化、管理画面で設定', '注文手続きに のし（トレイト・FormExtension・TemplateEvent）', 'テスト注文・受注登録・注文メール', '無効化・有効化と配送CSV', 'zip にまとめて本番へ'],
  },
  store: { name: 'あみだ池大黒オンラインショップ', handle: 'daikoku', domain: 'www.daikoku.ne.jp', initials: '大', avatar: '#a4282c' },
  project: { name: 'daikoku-eccube', path: 'C:\work\daikoku-eccube' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },   // the real EC-CUBE screens (shared/wordpress/wp-frame.js as window.EC)
  snapshot: {
    origin: 'https://www.daikoku.ne.jp',
    pages: { product: '/shop/products/detail/133', gift: '/shop/products/detail/290', guide: '/shop/guide' },
    views: ['pc'],
    remove: ['iframe'],
  },
};
