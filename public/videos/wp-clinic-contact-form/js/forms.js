/*
 * The forms the video builds — the same text it types — and the clinics' pages.
 * Read by the video (js/scenario.js) and by the capture (tools/snapshots/wp-clinic-contact-form/capture-wp.js), so what
 * WordPress / Contact Form 7 shows and renders in the video is exactly what is typed on screen.
 */
(function () {
  'use strict';
  const lines = (a) => a.join('\n');

  /* ---------------- 京橋ウェルネスクリニック — the live site's pages (titles / slugs from its REST API) */
  const PAGES_A = [
    ['top', 'トップページ'], ['archive-news', 'お知らせ一覧'], ['nutrition', '栄養療法(内科)'], ['dermatology', '美容皮膚科・美容内科'], ['about1', '当院の特徴'],
    ['treatment', '治療方針'], ['facility', '設備のご紹介'], ['access', 'アクセス'], ['doctor', '医師紹介'], ['about', '当院について'],
    ['counseling', '無料オンラインカウンセリングのご案内'], ['contact', 'お問い合わせ'], ['reservation', '診療予約', 'about'], ['thanks', 'サンクスページ'], ['policy', 'プライバシーポリシー'],
  ].map(([slug, title, parent]) => ({ slug, title, parent: parent || '' }));

  /* the theme's static form (page-contact.php on the live site): the same markup, with Contact Form 7's form-tags */
  const field = (cls, label, req, ctl, ddCls = 'form__input form-input') => [
    `<dl class="form__wrap${cls ? ' ' + cls : ''}">`,
    `  <dt class="form__label"><p>${label}</p>${req ? '<span>必須</span>' : ''}</dt>`,
    `  <dd class="${ddCls}">${ctl}</dd>`,
    '</dl>',
  ];
  const F1_FIELDS = [
    field('', 'お名前', true, '[text* your-name placeholder "例) 山田花子"]'),
    field('', 'メールアドレス', true, '[email* your-email placeholder "例) example@email.com"]'),
    field('form__wrap--checkbox', '当院をどちらで知りましたか？<br>（複数回答可）', true, '[checkbox* how-found use_label_element "ご紹介" "インターネット検索" "雑誌や書籍" "その他"]', 'form__checkbox form-checkbox'),
    field('form__wrap--introduce', 'ご紹介者様・ご紹介の<br>クリニック名をお教えください。', false, '[text introducer placeholder "例) 友人〇〇からの紹介"]'),
    field('form__wrap--other', 'その他を選ばれた方は、<br>どちらでお知りになったのか<br>お教えください。', false, '[text found-other placeholder "例) Google検索"]'),
    field('form__wrap--radio', 'ご希望を教えてください', true, '[radio wish use_label_element "すぐに治療を始めたい" "まずはメールで相談したい" "その他のお問い合わせ"]', 'form__radio form-radio'),
    field('form__wrap--textarea', '現在の病名や症状、治療内容など<br>差し支えない範囲でご記入下さい', false, '[textarea symptoms placeholder "ご相談内容を入力してください"]', 'form__textarea form-textarea'),
    field('form__wrap--textarea', '治療のご希望がありましたら<br>お書きください', false, '[textarea request placeholder "ご相談内容を入力してください"]', 'form__textarea form-textarea'),
  ];
  const F1_FORM = lines([
    ...F1_FIELDS.flat(),
    '<p class="form-text">※プライバシーポリシーについては<a href="https://miyazawaclinic.net/policy">こちら</a>をご確認ください。</p>',
    '<div class="form__submit form-submit">',
    '  <div class="form-submit-wrap">[submit "確認画面へ"]</div>',
    '</div>',
    '[multistep multistep-1 first_step "/contact/confirm/"]',
  ]);
  // the first field as the static HTML has it, and as the form-tag replacing it (typed on screen)
  const STATIC_NAME = '<input type="text" placeholder="例) 山田花子">';
  const TAG_NAME = '[text* your-name placeholder "例) 山田花子"]';

  /* the confirm step: the values of the input step ([multiform]), back / send, the last step sends the mail */
  const conf = (label, name, cls = '') => [`<dl class="form__wrap form__wrap--confirm${cls ? ' ' + cls : ''}">`, `  <dt class="form__label"><p>${label}</p></dt>`, `  <dd class="form__input">[multiform "${name}"]</dd>`, '</dl>'];
  const F2_FORM = lines([
    '<p class="form-text">入力内容をご確認のうえ「送信する」を押してください。</p>',
    ...conf('お名前', 'your-name'), ...conf('メールアドレス', 'your-email'), ...conf('当院をどちらで知りましたか？', 'how-found'),
    ...conf('ご紹介者様・ご紹介のクリニック名', 'introducer'), ...conf('その他（どちらでお知りになったか）', 'found-other'), ...conf('ご希望', 'wish'),
    ...conf('現在の病名や症状、治療内容など', 'symptoms'), ...conf('治療のご希望', 'request'),
    '<div class="form__submit form-submit">',
    '  <div class="form-submit-wrap">[previous "戻る"] [submit "送信する"]</div>',
    '</div>',
    '[multistep multistep-2 last_step send_email "/thanks/"]',
  ]);

  /* the notification to the clinic (Mail) and the auto-reply (Mail (2)) of the last step */
  const MAIL = {
    'm-to': 'info@miyazawaclinic.net',
    'm-from': '[_site_title] <noreply@miyazawaclinic.net>',
    'm-subject': '【お問い合わせ】[your-name] 様',
    'm-headers': 'Reply-To: [your-email]',
    'm-body': lines([
      'ホームページのお問い合わせフォームから送信がありました。', '',
      'お名前：[your-name]', 'メールアドレス：[your-email]', '当院を知ったきっかけ：[how-found]', 'ご紹介者様：[introducer]', 'その他：[found-other]', 'ご希望：[wish]', '',
      '病名や症状、治療内容など：', '[symptoms]', '', '治療のご希望：', '[request]', '',
      '-- ', '[_site_title] [_site_url]',
    ]),
  };
  const MAIL2 = {
    'm2-to': '[your-email]',
    'm2-from': '[_site_title] <noreply@miyazawaclinic.net>',
    'm2-subject': '【京橋ウェルネスクリニック】お問い合わせありがとうございます',
    'm2-headers': 'Reply-To: info@miyazawaclinic.net',
    'm2-body': lines([
      '[your-name] 様', '',
      '京橋ウェルネスクリニックです。', 'お問い合わせいただき、ありがとうございます。', '内容を確認のうえ、担当者よりご連絡いたします。', '',
      '――――――――――――――――', 'お名前：[your-name]', 'ご希望：[wish]', '――――――――――――――――', '',
      '※このメールは送信専用のアドレスからお送りしています。', '京橋ウェルネスクリニック', 'https://miyazawaclinic.net/',
    ]),
  };
  const MAIL2_BAD_FROM = '[_site_title] <miyazawaclinic.info@gmail.com>';

  /* ---------------- かとう歯科 — its pages and its contact form (the live form's fields and markup) */
  const PAGES_B = [['privacy-policy', 'プライバシーポリシー'], ['about', 'クリニック紹介・ご挨拶'], ['medical', '診療案内'], ['access', '診療時間・アクセス'], ['recruit', '採用情報'], ['contact', 'お問合せ']]
    .map(([slug, title]) => ({ slug, title }));
  const KATO_TAGLINE = 'あなたの歯を生涯サポート │ 愛知県弥富市の歯医者';
  const row = (req, label, ctl) => ['<tr>', `<th><span${req ? '' : ' class="nini"'}>${req ? '必須' : '任意'}</span>${label}</th>`, `<td>${ctl}</td>`, '</tr>'];
  const K_ROWS = [
    row(true, 'お名前', '[text* your-name placeholder "例）山田 太郎"]'),
    row(false, 'お電話番号', '[tel your-tel placeholder "例）0567-66-2220"]'),
    row(true, 'メールアドレス', '[email* your-email placeholder "例）○○○@△△△△.com"]'),
    row(true, 'お問合せ内容', '[textarea* textarea]'),
  ];
  const K_FILE_ROW = (limit) => ['<tr>', '<th><span class="nini">任意</span>画像の添付</th>', `<td>[file your-file${limit ? ' limit:10mb' : ''} filetypes:jpg|jpeg|png|pdf]`, `お口の写真やレントゲン画像など（jpg・png・pdf${limit ? '、10MB まで' : ''}）</td>`, '</tr>'];
  const kForm = (file) => lines([
    '<table>', '<tbody>', ...K_ROWS.flat(), ...(file ? K_FILE_ROW(file === 'limit') : []), '</tbody>', '</table>',
    '<h4 class="form-policy"><p>必須</p>個人情報の取得・利用について同意します[checkbox* policy "同意する"]</h4>',
    '[submit "送信"]',
  ]);
  const K_MAIL = {
    recipient: 'info@kato-dental-clinic.net',
    sender: '[_site_title] <wordpress@kato-dental-clinic.net>',
    subject: '[_site_title] お問合せがありました',
    additional_headers: 'Reply-To: [your-email]',
    body: lines(['お名前：[your-name]', 'お電話番号：[your-tel]', 'メールアドレス：[your-email]', '', 'お問合せ内容：', '[textarea]', '', '-- ', '[_site_title] [_site_url]']),
  };

  window.FORMS = {
    PAGES_A, PAGES_B, KATO_TAGLINE,
    F1_TITLE: 'お問い合わせ（入力）', F1_FORM, F1_FIELDS, STATIC_NAME, TAG_NAME,
    F2_TITLE: 'お問い合わせ（確認）', F2_FORM,
    MAIL, MAIL2, MAIL2_BAD_FROM,
    // the shortcode in page-contact.php: the theme's own form classes on Contact Form 7's <form>
    SHORTCODE: (code) => code.replace(/\]$/, ' html_class="contact__form form"]'),
    TEST: { name: 'テスト 花子', email: 'cf7-test@example.com', found: 'インターネット検索', wish: 'まずはメールで相談したい', symptoms: 'フォームの送信テストです。', request: '（テスト送信）' },
    K_TITLE: 'お問合せ', K_FORM: kForm(false), K_FORM_FILE: kForm('file'), K_FORM_FILE_10MB: kForm('limit'), K_FILE_ROW, K_MAIL, K_ATTACH: '[your-file]',
    K_TEST: { name: 'テスト 太郎', email: 'cf7-test@example.com', text: '画像添付のテストです。' },
  };
})();
