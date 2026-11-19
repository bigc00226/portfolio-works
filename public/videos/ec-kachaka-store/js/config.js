/*
 * kachaka Online Store（store.kachaka.life）— EC-CUBE 4 デザインリニューアル（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'ec-kachaka-store',
  title: 'kachaka Online Store — EC-CUBE 4 デザインリニューアル（Twig）デモ',
  start: '2026-11-07T10:06',
  steps: ['現状の確認', 'テンプレートの登録', 'ヘッダー・フッター', 'ブロック・レイアウト', 'トップ・商品ページ', 'スマートフォン表示', '本番への反映'],
  intro: {
    kicker: 'EC-CUBE 4 デザインリニューアル',
    brand: 'kachaka Online Store',
    sub: 'Twig テンプレートによるデザインリニューアル',
    url: 'store.kachaka.life — EC-CUBE 4.3 の標準テーマから、ブランドに合わせた新テーマ「kachaka」へ',
    steps: ['現状の確認（標準テーマ）', 'テンプレート「kachaka」の登録', 'default_frame・ヘッダー・フッター', 'ブロック管理・レイアウト管理', 'トップ・商品一覧・商品詳細（Twig）', 'スマートフォン表示', '本番への反映'],
  },
  store: { name: 'kachaka Online Store', handle: 'kachaka', domain: 'store.kachaka.life', initials: 'K', avatar: '#dfccbb' },
  project: { name: 'kachaka-store', path: 'C:\\dev\\kachaka-store' },
  // the real EC-CUBE screens (js/ec-snapshot.js, shared/wordpress/wp-frame.js as window.EC) in this browser page;
  // the bar above is Chrome's device toolbar for the smartphone screens (apps.js KS.device)
  pages: { wp: '<div class="ks-devbar st-devbar">寸法: <b>iPhone 14 Pro Max</b><i data-icon="chevron-down"></i><span class="dv-num">390</span>×<span class="dv-num">844</span><span id="ksZoom">100%</span><i data-icon="chevron-down"></i><span>スロットリングなし</span><i data-icon="chevron-down"></i></div><div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://store.kachaka.life',
    pages: { home: '/', detail: '/products/detail/1', list: '/products/list' },
    remove: ['iframe', '.ec-blockTopBtn'],
  },
};
