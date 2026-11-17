/*
 * カイロライン三鷹整体院 — WordPress（Arkhe）サイトの SEO 対策・検索順位改善（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-chiroline-seo',
  title: 'カイロライン三鷹整体院 — SEO 対策・検索順位改善 デモ',
  start: '2026-11-09T13:20',
  open: 'browser', active: 'browser',
  steps: ['現状の確認', 'SEO SIMPLE PACK', 'タイトル・ディスクリプション', '構造化データ', 'カテゴリー・内部リンク'],
  intro: {
    kicker: 'WordPress SEO 対策・検索順位改善',
    brand: 'カイロライン三鷹整体院',
    sub: '内部 SEO・メタタグ・構造化データ・サイト構造',
    url: 'chiroline-mitakain.com — Arkhe（子テーマ）・SEO SIMPLE PACK・JSON-LD',
    steps: ['現状の確認（ページのソース）', 'SEO SIMPLE PACK の導入・基本設定', 'ページごとのタイトル・ディスクリプション', '構造化データ（JSON-LD）', 'カテゴリーの整理・パンくず・内部リンク'],
  },
  store: { name: 'カイロライン三鷹整体院', handle: 'chiroline', domain: 'chiroline-mitakain.com', initials: 'CL', avatar: '#f6c453' },
  project: { name: 'chiroline-mitakain', path: 'C:\\dev\\chiroline-mitakain' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>', vsrc: '<div id="vsrcPage"></div>' },
  snapshot: {
    origin: 'https://chiroline-mitakain.com',
    views: ['pc'],
    pages: {
      home: '/',
      price: '/price/',
      post: '/column/%e3%81%aa%e3%81%9c%e3%81%82%e3%81%aa%e3%81%9f%e3%81%ae%e8%85%b0%e7%97%9b%e3%81%af%e7%b9%b0%e3%82%8a%e8%bf%94%e3%81%99%e3%81%ae%e3%81%8b%ef%bc%9f%e4%b8%89%e9%b7%b9%e3%81%ae%e6%95%b4%e4%bd%93%e5%b8%ab/',
      category: '/column/category/self-care/',
    },
    remove: ['iframe', '#wpadminbar', '.grecaptcha-badge'],
  },
};
