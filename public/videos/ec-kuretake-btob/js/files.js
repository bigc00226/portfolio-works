/*
 * The project in VS Code (C:\dev\kuretake-b2b): 呉竹 BtoBオンライン注文サイト's EC-CUBE 4.3 in git — EC-CUBE's own templates
 * (read only: js/eccube-core.js, copied from the EC-CUBE 4.3.1-p1 the captures run), the customization this video writes
 * (js/b2b-src.js — the same code the real EC-CUBE of the captures runs), the request, .env, docker-compose.yml.
 */
(function () {
  'use strict';
  const SRC = window.B2B_SRC, CORE = window.EC_CORE;
  const files = {};

  files['README.md'] = [
    '# 呉竹 BtoBオンライン注文サイト（order.kuretake.co.jp）',
    '',
    'EC-CUBE 4.3（PHP 8.3）。カスタマイズは app/Customize と app/template/default（本体の src/ は変更しない）。',
    '',
    '## 開発環境',
    '',
    '- http://localhost:8080（管理画面 /admin）：Docker の EC-CUBE 4.3 + SQLite',
    '- 商品・カテゴリ・お知らせは本番の公開データ、取引先（会員）はテスト用のダミー',
    '',
    '## エンティティを拡張したら',
    '',
    '```',
    'bin/console eccube:generate:proxies',
    'bin/console cache:clear --no-warmup',
    'bin/console doctrine:schema:update --dump-sql   # 確認してから --force',
    '```',
    '',
  ].join('\n');

  files['docs/request-2026-09.md'] = [
    '# BtoB 注文サイト 機能追加の依頼（2026/09/29 営業管理部）',
    '',
    '## 1. 取引先情報',
    '',
    '- 会員に 取引先コード・業界・掛率・掛け払いの可否 を持たせる（基幹の取引先マスタと同じ項目）',
    '- 商品に 発注単位（ケース入数）',
    '',
    '## 2. 会員登録は承認制',
    '',
    '- 新規会員登録は「仮登録」。営業が取引内容を確認してから本登録し、本登録完了メールを送る',
    '- 取引先専用のサイトなので 会社名 は必須',
    '',
    '## 3. 卸価格',
    '',
    '- 定価は誰でも見られる。卸価格（定価 × 取引先の掛率）はログインした取引先だけ',
    '- カート・ご注文はログインが必要（ゲスト購入なし）',
    '',
    '## 4. 発注単位',
    '',
    '- 墨滴・筆ぺん・半紙などはケース単位（10 個など）。発注単位の倍数でだけ注文できるように',
    '',
    '## 5. 掛け払い',
    '',
    '- 支払方法に「掛け払い（請求書払い・月末締め翌月末払い）」',
    '- 与信審査が済んだ取引先だけに表示する',
    '',
    '## 6. 受注管理',
    '',
    '- 受注一覧・受注登録で 会社名・支払方法 がわかること',
    '',
  ].join('\n');

  files['.env'] = [
    'APP_ENV=prod',
    'APP_DEBUG=0',
    'DATABASE_URL=sqlite:///var/eccube.db',
    'DATABASE_SERVER_VERSION=3',
    'MAILER_DSN=smtp://mailcatcher:1025',
    'ECCUBE_AUTH_MAGIC=Qe7Lr2Xs9KpVt4Zm',
    'ECCUBE_ADMIN_ROUTE=admin',
    'ECCUBE_TEMPLATE_CODE=default',
    'ECCUBE_LOCALE=ja',
    'ECCUBE_TIMEZONE=Asia/Tokyo',
    'ECCUBE_CURRENCY=JPY',
    '',
  ].join('\n');

  files['docker-compose.yml'] = [
    'services:',
    '  ec-cube:',
    '    image: ${ECCUBE_IMAGE:-ec-cube}',
    '    ports:',
    '      - 8080:80',
    '    volumes:',
    '      - ".:/var/www/html:cached"',
    '      - "var:/var/www/html/var"',
    '    environment:',
    '      APP_ENV: "prod"',
    '      APP_DEBUG: 0',
    '  mailcatcher:',
    '    image: schickling/mailcatcher',
    '    ports:',
    '      - 1080:1080',
    '',
    'volumes:',
    '  var:',
    '    driver: local',
    '',
  ].join('\n');

  files['.gitignore'] = ['/.env', '/var/', '/vendor/', '/html/upload/', '/html/plugin/', '/app/proxy/', '/node_modules/', ''].join('\n');
  files['composer.json'] = CORE['composer.json'];
  files['html/user_data/assets/css/customize.css'] = CORE['html/user_data/assets/css/customize.css'].replace(/\n$/, '');

  // EC-CUBE's own templates the video copies (read only, in src/)
  for (const k of Object.keys(CORE)) if (k.startsWith('src/')) files[k] = CORE[k].replace(/\n$/, '');

  /* the explorer: the EC-CUBE root (folders the work touches open) */
  const tree = [
    ['app', 'dir', 1], ['app/config', 'dir', 0], ['app/Customize', 'dir', 1], ['app/DoctrineMigrations', 'dir', 0], ['app/Plugin', 'dir', 0], ['app/PluginData', 'dir', 0], ['app/proxy', 'dir', 0],
    ['app/template', 'dir', 1], ['app/template/admin', 'dir', 0], ['app/template/default', 'dir', 1], ['app/template/user_data', 'dir', 0],
    ['bin', 'dir', 0], ['codeception', 'dir', 0], ['docs', 'dir', 1], ['docs/request-2026-09.md'],
    ['html', 'dir', 1], ['html/bundle', 'dir', 0], ['html/plugin', 'dir', 0], ['html/template', 'dir', 0], ['html/upload', 'dir', 0], ['html/user_data', 'dir', 1], ['html/user_data/assets', 'dir', 1], ['html/user_data/assets/css', 'dir', 1], ['html/user_data/assets/css/customize.css'],
    ['src', 'dir', 0], ['var', 'dir', 0], ['vendor', 'dir', 0],
    ['.env'], ['.gitignore'], ['composer.json'], ['docker-compose.yml'], ['index.php'], ['README.md'],
  ];
  files['index.php'] = "<?php\n\n/*\n * This file is part of EC-CUBE\n */\n\nrequire __DIR__.'/vendor/autoload.php';\n";

  window.FILES = { files, tree, SRC, CORE };
})();
