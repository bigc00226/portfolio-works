/*
 * The project in VS Code (C:\work\berrynet-eccube): ＠ベリーネット's EC-CUBE 4.3 in git — the request, EC-CUBE's .env, the bundled
 * Api42 and the OAuth2 bundle's sources (read only: js/link-src.js `core`, copied from the EC-CUBE 4.3.1-p1 the captures run) and
 * integration/store-link — the in-store stock system's side (reconstructed), which the video writes (js/link-src.js — the same files
 * the captures really run against the local EC-CUBE).
 */
(function () {
  'use strict';
  const SRC = window.TB_SRC;
  const DATA = (window.EC_SNAPSHOT && window.EC_SNAPSHOT.data) || {};
  const files = {};
  const SL = 'integration/store-link/';

  files['README.md'] = [
    '# ＠ベリーネット（b-net.tackleberry.co.jp）EC-CUBE',
    '',
    'EC-CUBE 4.3（PHP 8.3）。カスタマイズは app/Customize・app/Plugin・app/template（本体の src/ は変更しない）。',
    '',
    '## 開発環境',
    '',
    '- http://localhost:8080（管理画面 /admin）：EC-CUBE 4.3 + SQLite（本番の商品の一部のコピー、お客様の情報はダミー）',
    '- integration/store-link：店舗の在庫システム側の連携スクリプト（Node.js 22）。開発環境では http://localhost:3100',
    '',
    '## 本番への反映',
    '',
    '```',
    'git push',
    'ssh berrynet-prod "cd /var/www/eccube && ./deploy.sh"   # git pull・cache:clear',
    '```',
    '',
  ].join('\n');

  files['docs/request-2026-10.md'] = [
    '# 店舗の在庫システムとの連携（2026/10/20 EC 運営・店舗システム担当）',
    '',
    '## 背景',
    '',
    '- 中古品は全国の店舗の在庫をそのまま掲載している（店頭展示併売品・1 点もの）',
    '- 店頭で売れた商品が EC に残り、注文のあとで「品切れのご連絡」になることがある',
    '- EC で売れた商品は在庫店舗が棚から出して発送する。今は店舗へメールで連絡している',
    '',
    '## 1. 在庫（店舗 → EC）',
    '',
    '- POS の販売・取置の書き出し（CSV）を EC の在庫に反映。商品コードは店舗のバーコード（13 桁）',
    '- 店頭販売・取置 → 在庫 0、取置解除 → 在庫 1',
    '',
    '## 2. 注文（EC → 店舗）',
    '',
    '- 注文が入ったらすぐ在庫店舗へ出荷指示（棚番つき）',
    '- 通知が届かなかったときの取りこぼし確認（定期実行）',
    '',
    '## 3. 出荷（店舗 → EC）',
    '',
    '- 店舗の出荷実績（配送業者・お問い合わせ番号）を EC に登録し、出荷完了メール',
    '',
    '## 方式',
    '',
    '- EC-CUBE 4.3 同梱の Web API プラグイン（GraphQL・OAuth2.0・WebHook）。本体・プラグインは変更しない',
    '- 連携スクリプトは店舗システム側のサーバーで動かす（integration/store-link）',
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
    "TRUSTED_HOSTS=^127\\.0\\.0\\.1$,^localhost$",
    '',
  ].join('\n');
  files['.gitignore'] = ['/.env', '/var/', '/vendor/', '/html/upload/', '/html/plugin/', '/app/proxy/', '/app/PluginData/', '/node_modules/',
    '/integration/store-link/.env', '/integration/store-link/var/', '/integration/store-link/logs/', '/integration/store-link/outbox/', ''].join('\n');
  for (const [k, v] of Object.entries(SRC.core)) files[k] = v;

  // the store-link's files as they end up (added to the editor as the video writes them)
  const LINK = {};
  for (const [k, v] of Object.entries(SRC.files)) LINK[SL + k] = v.replace(/\n$/, '');
  LINK[SL + 'link.mjs'] = SRC.link[4].replace(/\n$/, '');
  const csv = (s) => String(s || '').replace(/\n$/, '');
  const DATAFILES = {
    [SL + 'data/ledger.csv']: csv(DATA.ledger),
    [SL + 'pos/sales-20261114-1030.csv']: csv(DATA.sales),
    [SL + 'pos/shipped-20261114-1140.csv']: csv(DATA.shipped),
  };
  const crontab = [
    '# store-link（店舗システムのサーバー /opt/store-link）',
    '# POS の書き出し（5 分ごと）→ EC の在庫',
    '*/5 * * * *  cd /opt/store-link && node link.mjs stock /data/pos/export/latest.csv >> logs/cron.log 2>&1',
    '# 店舗の出荷実績（15 分ごと）→ 出荷済み・出荷完了メール',
    '*/15 * * * * cd /opt/store-link && node link.mjs ship /data/pos/export/shipped.csv >> logs/cron.log 2>&1',
    '# WebHook の取りこぼし確認（10 分ごと）',
    '*/10 * * * * cd /opt/store-link && node link.mjs orders >> logs/cron.log 2>&1',
    '# WebHook・OAuth のコールバックは常駐（systemd の store-link.service：node link.mjs serve）',
  ].join('\n');
  LINK[SL + 'deploy/crontab'] = crontab;

  window.FILES = { files, SRC, LINK, DATAFILES, SL };
})();
