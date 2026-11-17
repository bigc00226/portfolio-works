/*
 * 京橋ウェルネスクリニック（miyazawaclinic.net）・かとう歯科（kato-dental-clinic.net）— Contact Form 7 によるお問い合わせフォームの構築・修正
 * （shared/kit/dom.js が読む設定。ストアの代わりに 2 つのクリニックのサイトを取り込みます：tools/snapshots/wp-clinic-contact-form/update-snapshot.js）
 */
window.VIDEO = {
  id: 'wp-clinic-contact-form',
  title: 'クリニックのお問い合わせフォーム構築（Contact Form 7） デモ',
  start: '2026-11-05T14:10',
  open: 'browser', active: 'browser',
  steps: ['プラグインの導入', 'フォームの作成', '通知メール', '自動返信メール', '確認画面', 'ファイル添付'],
  intro: {
    kicker: 'WordPress × Contact Form 7',
    brand: '京橋ウェルネスクリニック・かとう歯科',
    sub: 'お問い合わせフォームの構築・修正',
    url: 'miyazawaclinic.net / kato-dental-clinic.net — フォームの設置・自動返信・入力確認・ファイル添付',
    steps: ['Contact Form 7 の導入', 'フォームの作成（デザインはそのまま）', '通知メール', '自動返信メール', '入力確認画面・バリデーション', 'ファイル添付（かとう歯科）'],
  },
  store: { name: '京橋ウェルネスクリニック', handle: 'miyazawaclinic', domain: 'miyazawaclinic.net', initials: '京', avatar: '#8fb9a8' },
  project: { name: 'kyoubashi-wellness', path: 'C:\dev\miyazawaclinic\wp-content\themes\kyoubashi-wellness' },
  pages: {
    wp: '<div id="wpPage"></div>',
  },
  snapshot: {
    origin: 'https://miyazawaclinic.net',
    pages: { contact: '/contact/', thanks: '/thanks/' },
    remove: ['.grecaptcha-badge', '#wpadminbar'],
  },
};
