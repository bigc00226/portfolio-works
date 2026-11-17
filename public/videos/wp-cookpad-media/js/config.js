/*
 * クックパッド株式会社 — WordPress によるおしらせ（ブログ・オウンドメディア）の構築（shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-cookpad-media',
  title: 'クックパッド株式会社 — WordPress おしらせ（記事投稿システム）の構築 デモ',
  start: '2026-11-06T13:12',
  open: 'code', active: 'code',
  steps: ['投稿タイプ「おしらせ」', 'カテゴリーの整理', '記事の移行・入稿', '記事テンプレート', '一覧ページ'],
  intro: {
    kicker: 'WordPress ブログ・オウンドメディア構築',
    brand: 'クックパッド株式会社',
    sub: 'コーポレートサイト「おしらせ」の記事投稿システム',
    url: 'info.cookpad.com/news — カスタム投稿タイプ・カテゴリー・記事テンプレート・一覧ページ',
    steps: ['投稿タイプ「おしらせ」（pr_news）', 'カテゴリーの整理（リリース・お知らせ・出版）', '既存記事の移行・外部リンク記事の入稿', '記事テンプレート（single）', '一覧ページ（archive・ページ送り）'],
  },
  store: { name: 'クックパッド株式会社', handle: 'cookpad-info', domain: 'info.cookpad.com', initials: 'CP', avatar: '#f8b500' },
  project: { name: 'cookpad-info', path: 'C:\\dev\\cookpad-info' },
  pins: 'explorer edge chrome:browser vscode:code',
  pages: { wp: '<div id="wpPage"></div>' },
  snapshot: {
    origin: 'https://info.cookpad.com',
    pages: {
      home: '/',
      news: '/news',
      publish: '/news/category/publish',
      article: '/news/%e6%96%b0%e6%a9%9f%e8%83%bd%e3%81%ab%e3%81%a4%e3%81%84%e3%81%a6%e3%81%84%e3%81%9f%e3%81%a0%e3%81%84%e3%81%9f%e3%81%94%e6%84%8f%e8%a6%8b%e3%81%a8%e3%80%81%e4%bb%8a%e5%be%8c%e3%81%ae%e5%8f%96%e3%82%8a',
      notfound: '/news/category/%e5%87%ba%e7%89%88',
      year: '/news/2026',
    },
    views: ['pc'],
    remove: ['iframe'],
  },
};
