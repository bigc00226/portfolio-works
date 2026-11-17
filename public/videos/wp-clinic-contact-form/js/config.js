/*
 * 京橋ウェルネスクリニック（miyazawaclinic.net）・かとう歯科（kato-dental-clinic.net）— Contact Form 7 によるお問い合わせフォームの構築・修正
 * （shared/kit/dom.js が読む設定）
 * WordPress の画面は本物（tools/snapshots/wp-clinic-contact-form/capture-wp.js → js/wp-snapshot.js）、
 * 2 つのクリニックのページは公開中のサイトの取り込み（npm run snapshot -- wp-clinic-contact-form → js/site-snapshot.js）。
 */
window.VIDEO = {
  id: 'wp-clinic-contact-form',
  title: '京橋ウェルネスクリニック・かとう歯科 — お問い合わせフォームの構築（Contact Form 7） デモ',
  start: '2026-11-05T14:10',
  open: 'code', active: 'code',
  steps: ['Contact Form 7 の導入', 'フォームの作成', 'テーマに設置', '通知メール', '自動返信メール', 'スパム対策', '送信テスト', 'ファイル添付'],
  intro: {
    kicker: 'WordPress × Contact Form 7',
    brand: '京橋ウェルネスクリニック・かとう歯科',
    sub: 'デザインのままのお問い合わせフォームを Contact Form 7 で動かす',
    url: 'miyazawaclinic.net / kato-dental-clinic.net — フォームの設置・通知と自動返信・入力チェック・ファイル添付',
    steps: ['Contact Form 7 の導入', 'フォームの作成（デザインのマークアップのまま）', '通知メール・自動返信メール', 'スパム対策（reCAPTCHA v3）', '入力チェック・サンクスページ', 'ファイル添付（かとう歯科）'],
  },
  store: { name: '京橋ウェルネスクリニック', handle: 'miyazawaclinic', domain: 'miyazawaclinic.net', initials: '京', avatar: '#8fb9a8' },
  project: { name: 'kyoubashi-wellness', path: 'C:\\dev\\miyazawaclinic\\wp-content\\themes\\kyoubashi-wellness' },
  pages: {
    wp: '<div id="wpPage"></div>',   // the real WordPress screens (shared/wordpress/wp-frame.js)
  },
  snapshot: {
    origin: 'https://miyazawaclinic.net',
    pages: { contact: '/contact/', thanks: '/thanks/' },
    remove: ['.grecaptcha-badge', '#wpadminbar'],
    // typing into the clinics' forms (js/apps.js: the inputs become look-alike boxes with their own computed style)
    css: `.demo-caret { display: inline-block; width: 1px; height: 1.15em; background: currentColor; margin: 0 0 0 1px; vertical-align: -0.2em; animation: demoBlink 1s steps(1) infinite; }
      @keyframes demoBlink { 50% { opacity: 0; } }
      .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-underline-offset: .2em; text-decoration-skip-ink: none; }
      .demo-ime.conv { text-decoration-style: solid; }
      .demo-ime.conv.active { text-decoration-thickness: 3px; background: rgba(56,88,233,.2); }
      .demo-box { overflow: hidden; cursor: text; }
      .demo-box .demo-ph { color: var(--demo-ph, #757575); }
      .demo-box.demo-focus { outline: -webkit-focus-ring-color auto 1px; }`,
  },
};
