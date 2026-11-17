/*
 * The project folder the video opens in VS Code: the request from アジアンリトリート (the booking requirements, from the
 * live site's menu & price pages) and the developer's notes. Nothing of the plugin is code here: Booking Package is set
 * up in its own screens (js/wp-snapshot.js).
 */
(function () {
  'use strict';
  const REQ = [
    '# アジアンリトリート WEB予約の導入',
    '',
    '依頼日：2026-11-10（オーナー様より LINE にて）',
    '公開予定：2026-11-19（木）〜',
    '',
    '## ご要望',
    '- いまの予約は LINE とメール（Google フォーム）だけ → カレンダーから 24 時間予約できるようにしたい',
    '- 予約時にカードで事前決済もできるように（現地払いも残す）',
    '- 予約が入ったらお客様に確認メール、お店にも通知メール',
    '- 予約とお客様の情報を管理画面で確認したい',
    '',
    '## メニューと料金（サイトの「メニュー＆料金」と同じ・税込）',
    '| メニュー | 60分 | 90分 | 120分 |',
    '| --- | --- | --- | --- |',
    '| もみほぐし | 9,900円 | 14,400円 | 18,600円 |',
    '| タイ古式マッサージ | 10,500円 | 15,300円 | 19,800円 |',
    '| バリニーズアロマ | 11,400円 | 16,650円 | 21,600円 |',
    '| 台湾式足つぼ | 10,500円 | — | — |',
    '',
    '※オプション（ヘッドスパ・腸もみ）とパッケージは、当面 LINE で受付',
    '',
    '## 予約枠',
    '- 受付：10:00〜20:00 開始（30分ごと）・セラピスト 1 名',
    '- 出張エリア：藤沢市・鎌倉市・茅ヶ崎市 ほか',
    '- 訪問先（ご自宅・ホテル）の住所は必須',
    '',
    '## 使うもの',
    '- プラグイン：Booking Package（wordpress.org・日本語）',
    '- 予約ページ：固定ページ「ご予約」（/booking/）に予約カレンダーを追加',
    '',
  ].join('\n');
  const NOTES = [
    '# 作業メモ',
    '',
    '- 作業前に DB をバックアップ（wp db export）',
    '- 予約カレンダー：1 日単位の時間枠（Booking Package の「時間枠の予約」）',
    '- サービス＝メニュー × 時間（所要時間と料金）',
    '- 通知：「新規」の顧客向け・管理者向けを日本語に',
    '- 決済：Stripe（テストモードで確認）',
    '',
  ].join('\n');
  // the notification e-mails (Booking Package's tags in [ ]): written with the owner, pasted into 通知 › 新規
  const MAIL = {
    subject: '【アジアンリトリート】ご予約を承りました（[bookingDateAndTime]）',
    body: [
      '[first_name] 様', '',
      'このたびはアジアンリトリートをご予約いただき、誠にありがとうございます。',
      '以下の内容でご予約を承りました。', '',
      'ご予約番号：[id]', 'ご予約日時：[bookingDateAndTime]', 'メニュー：[services]', 'お支払い方法：[paymentMethod]', '合計金額：[totalAmount]', '',
      'ご訪問先：[address]', '',
      'セラピストがすべての備品をお持ちいたします。', '当日はお部屋でリラックスしてお待ちください。',
      'ご予約の変更・キャンセルは LINE またはこのメールへの返信でお知らせください。', '',
      'アジアンリトリート', '湘南発出張マッサージ（藤沢・鎌倉・茅ヶ崎）', 'https://asianretreat.jp/',
    ].join('\n'),
    adminSubject: '【WEB予約】[bookingDateAndTime] [first_name] 様',
    adminBody: [
      'WEB予約が入りました。', '',
      'ご予約番号：[id]', 'ご予約日時：[bookingDateAndTime]', 'メニュー：[services]', 'お支払い方法：[paymentMethod]', '合計金額：[totalAmount]', '',
      'お名前：[first_name]（[last_name]）', '電話番号：[phone]', 'メール：[email]',
    ].join('\n'),
  };
  MAIL.adminBodyFixed = MAIL.adminBody + '\n\nご訪問先：[address]';
  const TEMPLATES = ['# 予約メールの文面（Booking Package › 通知 › 新規）', '', '## お客様向け', '', '件名：' + MAIL.subject, '', MAIL.body, '', '## 管理者向け', '', '件名：' + MAIL.adminSubject, '', MAIL.adminBody, ''].join('\n');
  window.FILES = {
    files: {
      'README.md': '# asianretreat\n\nアジアンリトリート（asianretreat.jp）の保守・追加開発用メモ\n\n- 本番：https://asianretreat.jp/\n- WordPress（テーマ：TCD HAKU）\n',
      'docs/web-booking.md': REQ,
      'docs/notes.md': NOTES,
      'docs/mail-templates.md': TEMPLATES,
    },
    REQ, NOTES, MAIL, TEMPLATES,
  };
})();
