/*
 * The project in VS Code (C:\work\lmeal-eccube): ライフミール's EC-CUBE 4.3 in git — EC-CUBE's own files (src/Eccube …,
 * read only: js/eccube-core.js, copied from the EC-CUBE 4.3.1-p1 the captures run), the plugin this video writes into
 * app/Plugin/LmealPayment (js/payment-src.js — the same code the real EC-CUBE of the captures runs), the request and .env.
 */
(function () {
  'use strict';
  const SRC = window.LMEAL_SRC, CORE = window.EC_CORE;
  const files = {};

  files['README.md'] = [
    '# ライフミール（l-meal.com）EC-CUBE',
    '',
    'EC-CUBE 4.3（PHP 8.3）。カスタマイズは app/Customize・app/Plugin・app/template（本体の src/ は変更しない）。',
    '',
    '## 開発環境',
    '',
    '- http://localhost:8080（管理画面 /admin）：EC-CUBE 4.3 + SQLite（本番の商品・設定のコピー、お客様の情報はダミー）',
    '- 決済はテストモード（.env の LMEAL_PAYMENT_MODE=sandbox）：テスト用のカード番号のみ、請求は発生しない',
    '',
    '## 本番への反映',
    '',
    '```',
    'git push',
    'ssh lmeal-prod "cd /var/www/eccube && ./deploy.sh"   # git pull・プラグインの更新・cache:clear',
    '```',
    '',
  ].join('\n');

  files['docs/request-2026-09.md'] = [
    '# 決済まわりの改修依頼（2026/09/22 EC チーム）',
    '',
    '## 1. クレジットカード決済',
    '',
    '- EC-CUBE 4.3 の新しい環境に、カード決済をトークン方式で組み込む（カード番号はショップのサーバーを通さない）',
    '- ブランド：VISA・Mastercard・JCB・American Express・Diners Club',
    '- 決済が完了した注文は「入金済み」に。受注管理で取引 ID がわかるように',
    '- 注文完了の画面・注文メールに、お支払い完了の案内',
    '- 開発環境は代行会社のテストモード（テスト用のカード番号のみ）',
    '',
    '## 2. GMO後払い',
    '',
    '- 後払い手数料は 0 円（特定商取引法の表記どおり）。開発環境の設定が 330 円のまま',
    '- ご利用限度額は 55,000 円（税込）：1 回の注文で 55,000 円を超えるときは選べないように',
    '',
    '## 3. 冷凍庫無料レンタル',
    '',
    '- 冷凍庫レンタルのお申込みはクレジットカード決済のみ（キャンペーン規約 3.(1)）',
    '',
    '## 対象外',
    '',
    '- Amazon Pay（現行のまま）',
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
    '# カード決済（app/Plugin/LmealPayment）：開発環境はテストモード',
    'LMEAL_PAYMENT_MODE=sandbox',
    '',
  ].join('\n');

  for (const [k, v] of Object.entries(CORE)) files[k] = v;
  files['.gitignore'] = ['/.env', '/var/', '/vendor/', '/html/upload/', '/html/plugin/', '/app/proxy/', '/node_modules/', ''].join('\n');

  // the plugin's files (stage 3 = the end of the video) — added to the editor as the video writes them
  const PLUGIN = SRC.files(3);

  window.FILES = { files, SRC, PLUGIN, P: SRC.PLUGIN };
})();
