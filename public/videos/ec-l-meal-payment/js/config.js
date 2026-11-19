/*
 * ライフミール（l-meal.com, EC-CUBE 4）— 決済システムの構築（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面は本物（ローカルの EC-CUBE 4.3.1-p1：tools/snapshots/ec-l-meal-payment/capture-ec.js → js/ec-snapshot.js）、
 * 公開中のショップは取り込み（npm run snapshot -- ec-l-meal-payment → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'ec-l-meal-payment',
  title: 'ライフミール — EC-CUBE 4 決済システムの構築 デモ',
  start: '2026-11-09T10:12',
  open: 'code', active: 'code',
  steps: ['依頼・現状確認', '支払方法設定（後払い）', 'カード決済プラグイン', 'インストール・配送方法', 'テスト注文', '受注管理・メール', '支払方法ごとの条件', '本番へ反映'],
  intro: {
    kicker: 'EC-CUBE 4 決済システム',
    brand: 'ライフミール',
    sub: '健康冷凍弁当の定期便ショップに、トークン方式のカード決済と支払方法ごとの条件を組み込む',
    url: 'l-meal.com — PaymentMethodInterface（verify / apply / checkout）・支払方法設定・PurchaseFlow',
    steps: ['依頼・現状確認（公開中の支払方法・開発環境）', 'GMO後払い：手数料と利用条件（〜55,000 円）', 'カード決済プラグイン（PaymentMethodInterface・トークン）', 'インストール・有効化、配送方法の取扱支払方法', 'テスト注文（テストモード）と購入エラーの修正', '受注管理（入金済み・取引 ID）・注文メール', '冷凍庫レンタルはカードのみ・後払いの上限', '本番へ反映'],
  },
  store: { name: 'ライフミール', handle: 'l-meal', domain: 'l-meal.com', initials: 'L', avatar: '#af1b55' },
  project: { name: 'lmeal-eccube', path: 'C:\\work\\lmeal-eccube' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },   // the real EC-CUBE screens (shared/wordpress/wp-frame.js as window.EC)
  snapshot: {
    origin: 'https://l-meal.com',
    pages: { tradelaw: '/help/tradelaw', faq: '/faq', plan: '/shopping/plan' },
    views: ['pc'],
    remove: ['iframe'],
  },
};
