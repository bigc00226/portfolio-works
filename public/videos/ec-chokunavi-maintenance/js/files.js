/*
 * The maintenance project in VS Code (C:\work\chokunavi-eccube): 販促品直ナビ's EC-CUBE 4.3 in git (the staging copy runs in Docker
 * at http://localhost:8080) with the request, the real .env of the staging copy (js/ec-snapshot.js data), EC-CUBE's own .htaccess,
 * monolog.yml and nginx.conf.sample (the real files of EC-CUBE 4.3.1-p1), the real 4.3.1-p1 diff (js/cn-src.js), and ops/ — the
 * production server's backup script, Apache / PHP settings and crontab (reconstructed: the real server is not public).
 */
(function () {
  'use strict';
  const SRC = window.CN_SRC || {};
  const DATA = (window.EC_SNAPSHOT && window.EC_SNAPSHOT.data) || {};
  const files = {};
  const nl = (s) => String(s || '').replace(/\r/g, '').replace(/\n+$/, '');

  files['README.md'] = [
    '# 販促品直ナビ（www.chokunavi.shop）EC-CUBE 保守',
    '',
    'EC-CUBE 4.3（PHP 8.3）。カスタマイズは app/Customize・app/Plugin・app/template（本体の src/ は変更しない）。',
    '',
    '## 環境',
    '',
    '- 本番：www.chokunavi.shop（ロードバランサー → Apache 2.4 + PHP-FPM 8.3 → MySQL 8.0）',
    '- 検証環境：http://localhost:8080（Docker。本番のバックアップから作成、会員・受注などの個人情報は入れない。DB は SQLite）',
    '',
    '## 保守の手順',
    '',
    '- 変更は必ず検証環境で確かめてから本番へ（メンテナンスモード → バックアップ → 反映 → 確認 → 解除）',
    '- 運用のスクリプトと設定は ops/（本番の /opt/ops）',
    '',
  ].join('\n');

  files['docs/request-2026-11.md'] = [
    '# 保守契約 初回の点検（2026/11/14 敷島産業 EC 担当）',
    '',
    '## 背景',
    '',
    '- 前任の制作会社から保守を引き継いだ。管理画面の設定は公開時のまま、バックアップの状況が不明',
    '- 2026/03 に EC-CUBE の脆弱性（2段階認証の回避）が公表されたが、まだ対応していない',
    '',
    '## お願いしたいこと',
    '',
    '1. 健康診断：バージョン・プラグイン・ログイン履歴・ログ',
    '2. 管理画面の防御：URL の変更・IP 制限・2段階認証・担当者ごとのアカウント',
    '3. サーバーの設定の点検（.env・Web サーバー・ファイルの権限）',
    '4. バックアップと復元の確認',
    '5. セキュリティパッチの適用（検証環境 → 本番。止めるのは 30 分以内）',
    '6. 監視・ログの保管、作業の報告書',
    '',
    '## 引き継ぎ資料より',
    '',
    '- 本番：EC-CUBE 4.3.1 / PHP 8.3 / MySQL 8.0 / Apache 2.4（SSL はロードバランサー）',
    '- 管理画面：/admin。アカウントは admin を 3 名で共有',
    '- 作業時間：平日 10:00〜（注文の少ない時間）。メンテナンス表示は前日にお知らせ済み',
    '',
  ].join('\n');

  // the staging copy's real .env (before / after セキュリティ管理) — ECCUBE_AUTH_MAGIC blurred on screen
  const env0 = nl(DATA.env0 || 'APP_ENV=prod\nAPP_DEBUG=0');
  const env1 = nl(DATA.env1 || env0);
  files['.env'] = env0;
  files['.htaccess'] = nl(SRC.htaccess);
  files['nginx.conf.sample'] = nl(DATA.nginxSample);
  files['app/config/eccube/packages/prod/monolog.yml'] = nl(DATA.monolog);
  files['.gitignore'] = ['/.env', '/var/', '/vendor/', '/html/upload/', '/html/plugin/', '/app/proxy/', '/app/PluginData/', '/node_modules/', '/patches/*.tar.gz', ''].join('\n');

  // ops/: the production server (reconstructed)
  const OPS = {};
  OPS['ops/backup.sh'] = [
    '#!/bin/bash',
    '# 販促品直ナビ 本番のバックアップ（毎日 3:30 cron）— DB と設定・カスタマイズ・画像を 14 日分',
    'set -euo pipefail',
    'APP=/var/www/chokunavi',
    'DEST=/backup/chokunavi',
    'DAY=$(date +%Y%m%d)',
    'umask 077',
    'mkdir -p "$DEST"',
    '',
    '# DB（InnoDB をロックせずに一貫したダンプ）',
    'mysqldump --defaults-extra-file=/root/.my.cnf --single-transaction --routines --triggers \\',
    '  --default-character-set=utf8mb4 chokunavi | gzip > "$DEST/db-$DAY.sql.gz"',
    '',
    '# 設定・カスタマイズ・画像（本体と vendor は git と composer で戻せる）',
    'tar -czf "$DEST/files-$DAY.tar.gz" -C "$APP" \\',
    '  .env app/Customize app/Plugin app/PluginData app/template html/upload html/user_data',
    '',
    '# サーバーの外へ（別リージョンのオブジェクトストレージ）',
    'rclone copy "$DEST" offsite:chokunavi-backup/ --include "*-$DAY.*"',
    '',
    '# 14 日より古いものを削除',
    'find "$DEST" -type f -mtime +14 -delete',
  ].join('\n');
  OPS['ops/apache/chokunavi.conf'] = [
    '# /etc/httpd/conf.d/chokunavi.conf（SSL はロードバランサーで終端）',
    '<VirtualHost *:80>',
    '    ServerName www.chokunavi.shop',
    '    DocumentRoot /var/www/chokunavi',
    '',
    '    <Directory /var/www/chokunavi>',
    '        # EC-CUBE の .htaccess（設定ファイルの拒否・セキュリティヘッダー）を有効に',
    '        AllowOverride All',
    '        Options -Indexes +FollowSymLinks',
    '        Require all granted',
    '    </Directory>',
    '',
    '    <FilesMatch \\.php$>',
    '        SetHandler "proxy:unix:/run/php-fpm/www.sock|fcgi://localhost"',
    '    </FilesMatch>',
    '</VirtualHost>',
    '',
    '# サーバーの種類・版を出さない、TRACE を止める',
    'ServerTokens Prod',
    'ServerSignature Off',
    'TraceEnable Off',
  ].join('\n');
  OPS['ops/php/99-chokunavi.ini'] = [
    '; /etc/php.d/99-chokunavi.ini（PHP 8.3）',
    'expose_php = Off',
    'display_errors = Off',
    'log_errors = On',
    'memory_limit = 512M',
    'upload_max_filesize = 10M',
    'post_max_size = 10M',
    'session.cookie_secure = 1',
    'session.cookie_httponly = 1',
    'opcache.enable = 1',
  ].join('\n');
  OPS['ops/crontab'] = [
    '# 本番（deploy ユーザーの crontab）',
    '# バックアップ（毎日 3:30）',
    '30 3 * * *   /opt/ops/backup.sh >> /var/log/chokunavi/backup.log 2>&1',
    '# 証明書の期限（毎朝 9:00）：残り 30 日を切ったら通知',
    '0 9 * * *    /opt/ops/check-cert.sh www.chokunavi.shop 30',
    '# 外形監視（5 分ごと）：トップが 200 か・応答時間・メンテナンス表示のまま',
    '*/5 * * * *  /opt/ops/check-http.sh https://www.chokunavi.shop/ 3',
    '# EC-CUBE のログ（var/log/prod）のエラーを 1 日分まとめて通知（毎日 8:00）',
    '0 8 * * *    /opt/ops/log-digest.sh /var/www/chokunavi/var/log/prod',
  ].join('\n');
  OPS['ops/logrotate/chokunavi'] = [
    '# /etc/logrotate.d/chokunavi — Apache とバックアップのログ（EC-CUBE の var/log/prod は monolog が日ごとに 60 ファイル）',
    '/var/log/httpd/chokunavi-*.log /var/log/chokunavi/*.log {',
    '    daily',
    '    rotate 90',
    '    compress',
    '    delaycompress',
    '    missingok',
    '    notifempty',
    '    sharedscripts',
    '    postrotate',
    '        /bin/systemctl reload httpd > /dev/null 2>&1 || true',
    '    endscript',
    '}',
  ].join('\n');

  const CERT = (SRC.outside && SRC.outside.cert) || {};
  // the restore test's counts (dbal:run-sql's table: products, product_classes, categories, members, plugins)
  const NUM = ((String(DATA.count1 || DATA.count0 || '').split('\n').find((l) => /^\s*\d+(\s+\d+){4}\s*$/.test(l)) || '').trim().split(/\s+/)).map(Number);
  files['docs/report-2026-11.md'] = '';
  const REPORT = [
    '# 保守作業報告（2026/11/15）販促品直ナビ',
    '',
    '## 実施したこと',
    '',
    '| 項目 | 結果 |',
    '| --- | --- |',
    `| EC-CUBE | 4.3.1 → **${DATA.version1 || '4.3.1-p1'}**（2段階認証の回避の脆弱性を修正。検証環境で確認後に本番へ、停止 約 10 分） |`,
    '| 管理画面 | URL を変更、許可 IP（事務所・検証環境のみ）、担当者ごとのアカウントと 2段階認証、5 回の失敗で 30 分ロック |',
    `| ログイン履歴 | 11/8〜11/15 に /admin へ外部から ${(DATA.history || []).filter((h) => h[1] !== '203.0.113.24').length || 8} 回の失敗（admin・administrator・test ほか）。成功は事務所の IP のみ |`,
    '| セキュリティチェック | 公式プラグインで確認：var・vendor・.env は外から見えない、デバッグモード OFF |',
    '| サーバー | .htaccess の有効化を確認、ServerTokens Prod・expose_php Off、.env の権限 640 |',
    `| バックアップ | 毎日 3:30（DB とファイル、14 日分・サーバーの外へ）。検証環境で復元テスト：${NUM.length === 5 ? `商品 ${NUM[0]}・商品規格 ${NUM[1]}・カテゴリ ${NUM[2]}` : '商品・規格・カテゴリの件数'} が一致 |`,
    '| 監視 | 外形監視（5 分）・証明書の期限（30 日前）・EC-CUBE のエラーログの日次通知 |',
    '',
    '## ご確認・ご相談',
    '',
    `- SSL 証明書の期限：${CERT.valid_to ? CERT.valid_to.replace(/^(\w+) (\d+) [\d:]+ (\d+) GMT$/, (m, mo, d, y) => `${y}/${({ Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 })[mo]}/${d}`) : '2026/12/17'}（${CERT.issuer && CERT.issuer.CN || 'AlphaSSL'}）。更新の手順をご確認ください`,
    '- chokunavi.shop（www なし）は DNS がありません。www へ転送する設定をおすすめします',
    '- フロントのテンプレートは EC-CUBE 4.1 の default_frame がもと（jQuery 3.6.0・Bootstrap 3.4.1 を CDN から）。次の改修で 4.3 の標準に合わせる候補',
    '- 管理画面の新しい URL とアカウントは別途お送りします（このファイルには書きません）',
    '',
  ].join('\n');

  window.FILES = { files, OPS, REPORT, env0, env1 };
})();
