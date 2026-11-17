/*
 * Stand by Beauty Clinic — 12-1月限定キャンペーンのランディングページ制作（WordPress）（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-stand-by-lp',
  title: 'Stand by Beauty Clinic — キャンペーン LP 制作 デモ',
  start: '2026-11-02T13:30',
  steps: ['構成・導線設計', 'キャンペーン価格', 'LP の作成', 'トップからの導線', '固定ボタン（CTA）', 'スマホで確認'],
  intro: {
    kicker: 'WordPress',
    brand: 'Stand by Beauty Clinic',
    sub: 'キャンペーン LP 制作プロセス',
    url: 'stand-by.jp — 12-1月限定キャンペーンの LP、トップからの導線、予約ボタン（CTA）',
    steps: ['構成・導線設計', 'キャンペーン価格', 'LP の作成', 'トップからの導線', '固定ボタン（CTA）', 'スマホで確認'],
  },
  // (dom.js builds the Shopify admin page too; this video never shows it)
  store: { name: 'Stand by Beauty Clinic', handle: 'stand-by', domain: 'stand-by.jp', initials: 'SB', avatar: '#c9d9a3' },
  project: { name: 'stand_by_beauty_clinic', path: 'C:\\dev\\stand_by_beauty_clinic' },
  pins: 'explorer edge chrome:browser vscode:code',
  open: 'browser code',
  active: 'code',
  // the real WordPress screens (shared/wordpress/wp-frame.js)
  pages: { wp: '<div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://stand-by.jp',
    pages: { home: '/', lp: '/campaign_202612', prev: '/campaign_2', notfound: '/campaign-202612' },
    remove: ['#wpadminbar'],
  },
};
