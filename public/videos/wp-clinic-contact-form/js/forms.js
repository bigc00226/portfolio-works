/*
 * The forms the video builds — the same text it types — and the clinics' pages.
 * Read by the video (js/scenario.js) and by the capture (tools/snapshots/wp-clinic-contact-form/capture-wp.js), so what
 * WordPress / Contact Form 7 shows and renders in the video is exactly what is typed on screen.
 *
 * 京橋ウェルネスクリニック: the form-template is the one the live page renders (https://miyazawaclinic.net/contact/,
 * Contact Form 7 form 5): the theme's own form markup (dl.form__wrap …), the static inputs left as HTML comments, the
 * form-tags with the live field names (your-name, your-email, checkbox-344, introduce, other-how-found, category,
 * history, hope), no automatic formatting, the redirect to /thanks/ after sending.
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

  /* the static form of the theme (page-contact.php), as the live page still carries it in an HTML comment */
  const I = (n) => ' '.repeat(n);
  const dl = (cls, label, req, ddCls, staticCtl, tag) => [
    `${I(16)}<dl class="form__wrap${cls ? ' ' + cls : ''}">`,
    `${I(20)}<dt class="form__label">`,
    ...label.map((l, i) => (i ? `${I(28)}${l}` : `${I(24)}<p>${l}`) + (i === label.length - 1 ? `</p>${req ? '<span>必須</span>' : ''}` : '<br>')),
    `${I(20)}</dt>`,
    `${I(20)}<dd class="${ddCls}">`,
    ...staticCtl.map((l) => I(24) + l),
    ...(tag ? [I(24) + tag] : []),
    `${I(20)}</dd>`,
    `${I(16)}</dl>`,
  ];
  const IN = 'form__input form-input', CB = 'form__checkbox form-checkbox', RB = 'form__radio form-radio', TA = 'form__textarea form-textarea';
  const cbs = (name, vals, type) => vals.map((v) => `<label><input type="${type}" name="${name}" value="${v}"><span>${v}</span></label>`);
  const FIELDS = [
    { label: ['お名前'], req: true, dd: IN, html: ['<input type="text" placeholder="例) 山田花子">'], tag: '[text* your-name autocomplete:name placeholder "例) 山田花子"]' },
    { label: ['メールアドレス'], req: true, dd: IN, html: ['<input type="email" placeholder="例) example@email.com">'], tag: '[email* your-email autocomplete:email placeholder "例) example@email.com"]' },
    { cls: 'form__wrap--checkbox', label: ['当院をどちらで知りましたか？', '（複数回答可）'], req: true, dd: CB, html: cbs('how_found', ['ご紹介', 'インターネット検索', '雑誌や書籍', 'その他'], 'checkbox'), tag: '[checkbox* checkbox-344 use_label_element "ご紹介" "インターネット検索" "雑誌や書籍" "その他"]' },
    { cls: 'form__wrap--introduce', label: ['ご紹介者様・ご紹介の', 'クリニック名をお教えください。'], dd: IN, html: ['<input type="text" placeholder="例) 友人〇〇からの紹介">'], tag: '[text introduce autocomplete:name placeholder "例) 友人〇〇からの紹介"]' },
    { cls: 'form__wrap--other', label: ['その他を選ばれた方は、', 'どちらでお知りになったのか', 'お教えください。'], dd: IN, html: ['<input type="text" placeholder="例) Google検索">'], tag: '[text other-how-found autocomplete:name placeholder "例) Google検索"]' },
    { cls: 'form__wrap--radio', label: ['ご希望を教えてください'], req: true, dd: RB, html: cbs('category', ['すぐに治療を始めたい', 'まずはメールで相談したい', 'その他のお問い合わせ'], 'radio'), tag: '[radio category use_label_element "すぐに治療を始めたい" "まずはメールで相談したい" "その他のお問い合わせ"]' },
    { cls: 'form__wrap--textarea', label: ['現在の病名や症状、治療内容など<br>差し支えない範囲でご記入下さい'], dd: TA, html: ['<textarea name="message" placeholder="ご相談内容を入力してください"></textarea>'], tag: '[textarea history placeholder "ご相談内容を入力してください"]' },
    { cls: 'form__wrap--textarea', label: ['治療のご希望がありましたら<br>お書きください'], dd: TA, html: ['<textarea name="message" placeholder="ご相談内容を入力してください"></textarea>'], tag: '[textarea hope placeholder "ご相談内容を入力してください"]' },
  ];
  // the static inputs as HTML comments (one comment around a group of lines, as on the live page)
  const commented = (html) => (html.length === 1 ? [`<!-- ${html[0]} -->`] : [`<!-- ${html[0]}`, ...html.slice(1, -1), `${html[html.length - 1]} -->`]);
  // the theme's form, line for line as page-contact.php outputs it (the live page keeps it in an HTML comment): the privacy
  // note and a redirect script for later included
  const STATIC_TAIL = [
    `${I(16)}<p class="form-text">`,
    `${I(20)}※プライバシーポリシーについては<a href="https://miyazawaclinic.net/policy">こちら</a>をご確認ください。`,
    `${I(16)}</p>`,
    `${I(16)}<div class="form__submit form-submit">`,
    `${I(20)}<div class="form-submit-wrap">`,
    `${I(24)}<input type="submit" value="送信">`,
    `${I(20)}</div>`,
    `${I(16)}</div>`,
    `${I(16)}<script>`,
    "document.addEventListener( 'wpcf7mailsent', function( event ) {",
    "    location = 'https://miyazawaclinic.net/thanks';",
    '}, false );',
    '</script>',
    `${I(12)}</form>`,
  ];
  const THANKS_SCRIPT = ['<script>', "document.addEventListener('wpcf7mailsent', function(event) {", "    location.href = 'https://miyazawaclinic.net/thanks/';", '}, false);', '</script>'];
  /** the form template at a stage of the edit: o.head — the outer <form> replaced; o.n — fields with their form-tag (the
   *  static control commented out); o.foot — the submit button / the redirect script of Contact Form 7 */
  const formAt = (o = {}) => lines([
    ...(o.head ? ['<!-- コンタクトフォーム設定用 -->', '', '<div class="contact__form form">'] : [`${I(12)}<form class="contact__form form" action="">`]),
    ...FIELDS.flatMap((f, i) => (i < (o.n || 0) ? dl(f.cls, f.label, f.req, f.dd, commented(f.html), f.tag) : dl(f.cls, f.label, f.req, f.dd, f.html, null))),
    ...(o.foot ? [
      `${I(16)}<div class="form__submit form-submit">`,
      `${I(20)}<div class="form-submit-wrap">`,
      `${I(24)}<!-- <input type="submit" value="送信"> -->`,
      `${I(24)}[submit "送信"]`,
      `${I(20)}</div>`,
      `${I(16)}</div>`,
      `${I(12)}</div>`, '', '',
      ...THANKS_SCRIPT,
    ] : STATIC_TAIL),
  ]);
  const STATIC_FORM = formAt().split('\n');
  const F1_FORM = formAt({ head: true, n: FIELDS.length, foot: true });

  /* the notification to the clinic (Mail) and the auto-reply to the visitor (Mail (2)) */
  const MAIL = {
    'm-to': 'info@miyazawaclinic.net',
    'm-from': '[_site_title] <noreply@miyazawaclinic.net>',
    'm-subject': '【お問い合わせ】[your-name] 様',
    'm-headers': 'Reply-To: [your-email]',
    'm-body': lines([
      'ホームページのお問い合わせフォームから送信がありました。', '',
      'お名前：[your-name]', 'メールアドレス：[your-email]', '当院を知ったきっかけ：[checkbox-344]', 'ご紹介者様：[introduce]', 'その他：[other-how-found]', 'ご希望：[category]', '',
      '病名や症状、治療内容など：', '[history]', '', '治療のご希望：', '[hope]', '',
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
      '――――――――――――――――', 'お名前：[your-name]', 'ご希望：[category]', '――――――――――――――――', '',
      '※このメールは送信専用のアドレスからお送りしています。', '京橋ウェルネスクリニック', 'https://miyazawaclinic.net/',
    ]),
  };
  // the first try: the visitor's own address as the sender (so a reply goes straight back) — Contact Form 7 flags it
  const MAIL_BAD_FROM = '[your-name] <[your-email]>';

  /* ---------------- かとう歯科 — its pages and its contact form (the live form's fields, classes and markup: https://kato-dental-clinic.net/contact/) */
  const PAGES_B = [['privacy-policy', 'プライバシーポリシー'], ['about', 'クリニック紹介・ご挨拶'], ['medical', '診療案内'], ['access', '診療時間・アクセス'], ['recruit', '採用情報'], ['contact', 'お問合せ']]
    .map(([slug, title]) => ({ slug, title }));
  const KATO_TAGLINE = 'あなたの歯を生涯サポート │ 愛知県弥富市の歯医者';
  const row = (req, label, ctl) => ['<tr>', `<th><span${req ? '' : ' class="nini"'}>${req ? '必須' : '任意'}</span>${label}</th>`, `<td>${ctl}</td>`, '</tr>'];
  const K_ROWS = [
    row(true, 'お名前', '[text* your-name class:form-control placeholder "例）山田 太郎"]'),
    row(false, 'お電話番号', '[tel your-tel class:form-control placeholder "例）0567-66-2220"]'),
    row(true, 'メールアドレス', '[email* your-email class:form-control placeholder "例）○○○@△△△△.com"]'),
    row(true, 'お問合せ内容', '[textarea* textarea class:form-control]'),
  ];
  const K_FILE_ROW = (limit) => ['<tr>', '<th><span class="nini">任意</span>画像の添付</th>', `<td>[file your-file${limit ? ' limit:10mb' : ''} filetypes:jpg|jpeg|png|pdf class:form-control]`, `お口の写真やレントゲン画像など（jpg・png・pdf${limit ? '、10MB まで' : ''}）</td>`, '</tr>'];
  const kForm = (file) => lines([
    '<table>', '<tbody>', ...K_ROWS.flat(), ...(file ? K_FILE_ROW(file === 'limit') : []), '</tbody>', '</table>',
    '<h4 class="form-policy"><p>必須</p>個人情報の取得・利用について同意します[checkbox* policy use_label_element "同意する"]</h4>',
    '[submit class:btn class:btn-primary "送信"]',
  ]);
  const K_MAIL = {
    recipient: '[_site_admin_email]',   // (Contact Form 7's default: the clinic's own address is not public)
    sender: '[_site_title] <wordpress@kato-dental-clinic.net>',
    subject: '[_site_title] お問合せがありました',
    additional_headers: 'Reply-To: [your-email]',
    body: lines(['お名前：[your-name]', 'お電話番号：[your-tel]', 'メールアドレス：[your-email]', '', 'お問合せ内容：', '[textarea]', '', '-- ', '[_site_title] [_site_url]']),
  };

  window.FORMS = {
    PAGES_A, PAGES_B, KATO_TAGLINE,
    FIELDS, STATIC_FORM, THANKS_SCRIPT, commented, formAt,
    F1_TITLE: 'お問い合わせ', F1_FORM,
    MAIL, MAIL2, MAIL_BAD_FROM,
    TEST: { name: 'テスト 花子', email: 'info@miyazawaclinic.net', found: 'インターネット検索', wish: 'まずはメールで相談したい', history: 'フォームの送信テストです。', hope: '（テスト送信）' },
    K_TITLE: 'お問合せ', K_FORM: kForm(false), K_FORM_FILE: kForm('file'), K_FORM_FILE_10MB: kForm('limit'), K_FILE_ROW, K_MAIL, K_ATTACH: '[your-file]',
    K_TEST: { name: 'テスト 太郎', email: 'test@example.com', text: '画像添付のテストです。' },
  };
})();
