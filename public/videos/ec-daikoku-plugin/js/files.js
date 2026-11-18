/*
 * The project in VS Code (C:\work\daikoku-eccube): あみだ池大黒オンラインショップ's EC-CUBE 4.3 in git — EC-CUBE's own files
 * (src/Eccube …, read only: js/eccube-core.js, copied from the EC-CUBE 4.3.1-p1 the captures run), the plugin this video
 * makes in app/Plugin/DaikokuGift (js/gift-src.js — the same code the real EC-CUBE of the captures runs), the request and .env.
 */
(function () {
  'use strict';
  const SRC = window.DGIFT_SRC, CORE = window.EC_CORE;
  const files = {};

  files['README.md'] = [
    '# あみだ池大黒オンラインショップ（www.daikoku.ne.jp/shop）EC-CUBE',
    '',
    'EC-CUBE 4.3（PHP 8.3）。カスタマイズは app/Plugin・app/Customize・app/template（本体の src/ は変更しない）。',
    '',
    '## 開発環境',
    '',
    '- http://localhost:8080（管理画面 /admin）：EC-CUBE 4.3 + SQLite（本番の商品・設定のコピー、お客様の情報はダミー）',
    '- docker compose exec ec-cube bin/console …',
    '',
    '## プラグイン',
    '',
    '- app/Plugin/DaikokuGift … ギフトのし（このリポジトリで開発。本番へは zip で入れる）',
    '',
  ].join('\n');

  files['docs/request-2026-11.md'] = [
    '# ギフト のし指定の改修依頼（2026/10/30 EC チーム）',
    '',
    '## 背景',
    '',
    '- お歳暮（11 月〜）・お年賀の時期は進物用おこしの注文が増える',
    '- のし指定は商品ページの案内どおり「備考欄（お問い合わせ）」に書いてもらっている',
    '- 書き方がまちまち（内のし / 中のし、表書きの書き忘れ、名入れの漢字）で、出荷前に電話・メールで確認している',
    '',
    '## やりたいこと',
    '',
    '1. 注文手続きで、お届け先ごとに のし（外のし / 内のし）・表書き・名入れを選べるように',
    '2. のし対応の商品（進物用おこし など）だけ。紙バッグ・雑貨は対象外',
    '3. 表書きは管理画面で追加・非表示ができるように（年末に「御年賀」を追加する）',
    '4. 受注管理・注文受付メール・配送CSV（出荷担当）に のし を出す',
    '5. 専用プラグインにする（テーマ・本体の更新と切り離す。無効にすれば今の注文手続きに戻る）',
    '',
    '## 対象外',
    '',
    '- のしの画像プレビュー、有料ラッピング',
    '',
  ].join('\n');

  files['.env'] = [
    'APP_ENV=prod',
    'APP_DEBUG=0',
    'DATABASE_URL=sqlite:///var/eccube.db',
    'DATABASE_SERVER_VERSION=3',
    'MAILER_DSN=smtp://mailcatcher:1025',
    'ECCUBE_LOCALE=ja',
    'ECCUBE_TIMEZONE=Asia/Tokyo',
    'ECCUBE_CURRENCY=JPY',
    '',
  ].join('\n');

  for (const [k, v] of Object.entries(CORE)) files[k] = v;
  files['.gitignore'] = ['/.env', '/var/', '/vendor/', '/html/upload/', '/html/plugin/', '/app/proxy/', '/node_modules/', '/*.zip', ''].join('\n');

  window.FILES = { files, SRC, P: SRC.PLUGIN };
})();
