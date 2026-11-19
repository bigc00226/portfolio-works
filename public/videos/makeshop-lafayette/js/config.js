/*
 * Lafayette 公式通販サイト — makeshop でのアパレル EC サイトの構築・カスタマイズ（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'makeshop-lafayette',
  title: 'Lafayette 公式通販サイト — makeshop アパレル EC サイトの構築・カスタマイズ デモ',
  start: '2026-11-09T15:40',
  steps: ['ブランド・カテゴリ構成', '商品・在庫（サイズ・カラー）', '一覧・検索・並び順', '会員・お気に入り', 'カート・購入導線', '運用・販売スケジュール'],
  intro: {
    kicker: 'makeshop byGMO',
    brand: 'Lafayette｜ラファイエット公式通販サイト',
    sub: 'アパレル EC サイトの構築・カスタマイズ',
    url: 'www.lafayettecrew.jp — ブランド / アイテムのカテゴリ、サイズ・カラーの在庫表示、検索と並び順、会員・お気に入り、カート、販売スケジュール',
    steps: ['ブランド・カテゴリ構成', '商品・在庫（サイズ・カラー）', '一覧・検索・並び順', '会員・お気に入り', 'カート・購入導線', '運用・販売スケジュール'],
  },
  store: { name: 'Lafayette｜ラファイエット公式通販サイト', handle: 'lafayette', domain: 'www.lafayettecrew.jp', initials: 'LF', avatar: '#d9d9d9' },
  project: { name: 'lafayette-makeshop', path: 'C:\\dev\\lafayette-makeshop' },
  // the live shop (makeshop: pages only; the catalogue comes from its public list pages, js/files.js)
  snapshot: {
    origin: 'https://www.lafayettecrew.jp',
    pages: {
      home: '/', brand: '/view/category/lafayette', news: '/view/category/new_arrival', search: '/view/search?search_keyword=HOODIE',
      product: '/view/item/000000036275', quilted: '/view/item/000000036374',
    },
    // the news of 2026-11-13 / 11-19 (after the video's day) are taken out of the news lists
    remove: ['li.post:has(a[href*="20261119180445"])', 'li.post:has(a[href*="20261113102745"])', 'iframe', '[id^="chatplus"]', '#onetrust-consent-sdk'],
  },
};
