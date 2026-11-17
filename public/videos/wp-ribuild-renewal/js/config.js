/*
 * 整体りびるど（ribuild.jp）— 既存 WordPress サイトのリニューアル（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-ribuild-renewal',
  title: '整体りびるど — WordPress サイトのリニューアル デモ',
  start: '2026-10-29T13:30',
  steps: ['現状の確認', 'ページ構成・導線の整理', '新テーマの実装', 'スマートフォン表示の最適化', '本番への反映（テーマの移行）'],
  intro: {
    kicker: 'WordPress リニューアル',
    brand: '整体りびるど',
    sub: '既存サイトのリニューアル',
    url: 'ribuild.jp — デザインの刷新、ページ構成と予約導線の整理、新テーマへの移行、スマートフォン表示の最適化',
    steps: ['現状の確認（旧テーマ）', 'ページ構成・導線の整理', '新テーマ「rebuild」の実装', 'スマートフォン表示の最適化', '本番への反映（テーマの移行）'],
  },
  store: { name: '整体りびるど', handle: 'ribuild', domain: 'ribuild.jp', initials: 'り', avatar: '#d6e7f7' },
  project: { name: 'ribuild-renewal', path: 'C:\\dev\\ribuild-renewal' },
  // the real WordPress screens (js/wp-snapshot.js, public/shared/wordpress/wp-frame.js) are shown in this browser page
  pages: { wp: '<div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://ribuild.jp',
    pages: { home: '/', symptoms: '/symptoms/' },
    remove: ['.p-homeLoading', '.js-homeLoading', '.p-pageLoading', '#wpadminbar', '.grecaptcha-badge', 'iframe'],
  },
};
