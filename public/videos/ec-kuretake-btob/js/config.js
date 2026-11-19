/*
 * 呉竹 BtoBオンライン注文サイト（order.kuretake.co.jp, EC-CUBE 4）— BtoB 機能の構築（shared/kit/dom.js が読む設定）
 * EC-CUBE の画面は本物（ローカルの EC-CUBE 4.3.1-p1：tools/snapshots/ec-kuretake-btob/capture-ec.js → js/ec-snapshot.js）、
 * 公開中のサイトは取り込み（npm run snapshot -- ec-kuretake-btob → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'ec-kuretake-btob',
  title: '呉竹 BtoBオンライン注文サイト — EC-CUBE 4 BtoB 機能の構築 デモ',
  start: '2026-11-10T10:04',
  open: 'code', active: 'code',
  steps: ['依頼・現状確認', '取引先情報（エンティティ拡張）', '会員登録の承認制', '取引先別の卸価格', '発注単位', '掛け払い（請求書払い）', '受注管理', '本番へ反映'],
  intro: {
    kicker: 'EC-CUBE 4 BtoB 受注サイト',
    brand: '呉竹 BtoBオンライン注文サイト',
    sub: '取引先専用の注文サイトに、承認制の会員登録・掛率の卸価格・発注単位・掛け払いを組み込む',
    url: 'order.kuretake.co.jp — エンティティ拡張・FormExtension・EventSubscriber・Doctrine・PurchaseFlow（app/Customize）',
    steps: ['依頼・現状確認（公開中のサイト・開発環境）', '取引先情報：Customer / Product のエンティティ拡張', '会員登録の承認制（仮会員 → 審査 → 本会員）', '取引先ごとの卸価格（定価 × 掛率）', '発注単位（ケース単位）のチェック', '掛け払い（請求書払い）は承認済みの取引先だけ', '受注管理で会社名・支払方法を確認', '本番へ反映'],
  },
  store: { name: '呉竹 BtoBオンライン注文サイト', handle: 'kuretake', domain: 'order.kuretake.co.jp', initials: '呉', avatar: '#8c1d24' },
  project: { name: 'kuretake-b2b', path: 'C:\\dev\\kuretake-b2b' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },   // the real EC-CUBE screens (shared/wordpress/wp-frame.js as window.EC)
  snapshot: {
    origin: 'https://order.kuretake.co.jp',
    pages: { home: '/', list: '/products/list?category_id=128', detail: '/products/detail/286', login: '/mypage/login', entry: '/features/new_customer' },
    views: ['pc'],
    // the business calendar (Nov / Dec 2026) and the top's news (Oct / Nov 2026) are later than the video's date (2026-11-10)
    remove: ['iframe', '.is-topCalendar', '.footerCalendarArea', '.ec-newsRole', '.topPage-tabArea-news'],
  },
};
