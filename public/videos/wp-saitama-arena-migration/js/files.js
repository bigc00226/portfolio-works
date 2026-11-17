/*
 * The migration project in VS Code (C:\work\saitama-arena-migration): the runbook, the files for the new web server
 * (wp-config.php, the Apache virtual hosts) and the Route 53 change batch — as on screen at the start, and the pieces
 * the video types.
 * The real site: a WordPress multisite (subdirectory) — / (the arena), /schedule/ (event schedule, theme "schedule"),
 * /news/ (news, theme "news"); the main theme "saitamaarena". Public: DNS (Route 53), the load balancer (awselb/2.0),
 * the ACM certificates of www.saitama-arena.co.jp and arena.gmo, Apache behind it. Everything else here (server names,
 * paths, the database host, credentials) is invented for the demo.
 */
(function () {
  'use strict';

  const README = [
    '# GMOアリーナさいたま サーバー移転 手順書',
    '',
    '作業日：2026-11-10（火）22:00〜　メンテナンス表示：22:05〜切り替え完了まで',
    '',
    '## 構成',
    '',
    '- 旧：old-web（Apache / PHP 8.1 / MySQL 5.7）',
    '- 新：ALB（HTTPS 終端・ACM 証明書）→ web01（Apache / PHP 8.3）→ db01（MySQL 8.0）',
    '- DNS：Route 53（saitama-arena.co.jp / arena.gmo）',
    '- WordPress マルチサイト（サブディレクトリ型）',
    '  - `/` 本体（テーマ saitamaarena）',
    '  - `/schedule/` イベントスケジュール（テーマ schedule）',
    '  - `/news/` お知らせ（テーマ news）',
    '',
    '## 手順',
    '',
    '1. 前日：www の TTL を 300 秒に下げる（済）',
    '2. 旧サーバー：メンテナンスモード（更新停止）',
    '3. バックアップ：DB・wp-content・静的ファイル（/img/ など）',
    '4. web01：DB インポート・ファイル配置・wp-config.php',
    '5. hosts で新サーバーを確認（管理画面・3 サイト）',
    '6. Route 53：www を ALB へ（エイリアス）',
    '7. 確認：curl・ブラウザ・証明書',
    '8. arena.gmo：URL 変更日まで www へ 302',
    '',
    '## 新ドメイン arena.gmo',
    '',
    '- URL 変更は延期（12 月中を目途）。告知：お知らせ 2026.10.28',
    '- 変更日：`wp search-replace` を --network で実行 → 旧 URL から 301',
  ];

  // wp-config.php of the new server: copied from the old one, the database still "localhost" (the mistake)
  const CONFIG_HEAD = [
    '<?php',
    '/**',
    ' * GMOアリーナさいたま — web01（新サーバー）',
    ' */',
    '',
    "define( 'DB_NAME', 'saitama_arena' );",
    "define( 'DB_USER', 'sa_wp' );",
    "define( 'DB_PASSWORD', 'Xq7#wL2v-9pRt!8m' );",
    "define( 'DB_HOST', 'localhost' );",
    "define( 'DB_CHARSET', 'utf8mb4' );",
    "define( 'DB_COLLATE', '' );",
    '',
    "define( 'AUTH_KEY',         'k%2@Zr]8wA:J+u-]G6t#Wq|yX1e!p4oN' );",
    "define( 'SECURE_AUTH_KEY',  'B9^lQm3>h&R0s~V7c(Fa1-YdT{e6Lz2u' );",
    "define( 'LOGGED_IN_KEY',    '1Hn]q4#T8vE!r6@Wm-k2^Zp9(Lx3y7Cd' );",
    "define( 'NONCE_KEY',        'p0&Ou7$Ni2+Ql5~Ys8!Ve3^Ka6#Mj9@B' );",
    '',
    "$table_prefix = 'wp_';",
    '',
    "define( 'WP_DEBUG', false );",
    '',
    '/* マルチサイト（サブディレクトリ型） */',
    "define( 'WP_ALLOW_MULTISITE', true );",
    "define( 'MULTISITE', true );",
    "define( 'SUBDOMAIN_INSTALL', false );",
    "define( 'DOMAIN_CURRENT_SITE', 'www.saitama-arena.co.jp' );",
    "define( 'PATH_CURRENT_SITE', '/' );",
    "define( 'SITE_ID_CURRENT_SITE', 1 );",
    "define( 'BLOG_ID_CURRENT_SITE', 1 );",
    '',
    "define( 'FORCE_SSL_ADMIN', true );",
    '',
  ];
  const CONFIG_TAIL = [
    "if ( ! defined( 'ABSPATH' ) ) {",
    "\tdefine( 'ABSPATH', __DIR__ . '/' );",
    '}',
    '',
    "require_once ABSPATH . 'wp-settings.php';",
  ];
  // typed in scene 5: the load balancer ends HTTPS — WordPress sees http:// unless it reads X-Forwarded-Proto
  const PROXY_FIX = [
    '/* ALB で HTTPS を終端：転送元のプロトコルを見る */',
    "if ( isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) && 'https' === $_SERVER['HTTP_X_FORWARDED_PROTO'] ) {",
    "\t$_SERVER['HTTPS'] = 'on';",
    '}',
    '',
  ];
  const DB_HOST_FIXED = "define( 'DB_HOST', 'db01.sa.internal' );";

  // the Apache virtual host of www (behind the load balancer: port 80 only)
  const VHOST_WWW = [
    '# www.saitama-arena.co.jp（ALB → web01:80）',
    '<VirtualHost *:80>',
    '    ServerName www.saitama-arena.co.jp',
    '    DocumentRoot /var/www/html',
    '',
    '    <Directory /var/www/html>',
    '        AllowOverride All',
    '        Require all granted',
    '    </Directory>',
    '',
    '    # ALB のヘルスチェック',
    '    <Location /healthz.html>',
    '        Require all granted',
    '    </Location>',
    '',
    '    ErrorLog  /var/log/httpd/saitama-arena_error.log',
    '    CustomLog /var/log/httpd/saitama-arena_access.log combined',
    '</VirtualHost>',
  ];
  // arena.gmo: the start of the file on screen, then the redirect typed in scene 7
  const VHOST_GMO_HEAD = [
    '# arena.gmo（新ドメイン）',
    '<VirtualHost *:80>',
    '    ServerName arena.gmo',
    '    ServerAlias www.arena.gmo',
    '    DocumentRoot /var/www/html',
  ];
  const VHOST_GMO_RULES = [
    '    RewriteEngine On',
    '',
    '    # URL 変更日まで：現行サイトへ一時転送',
    '    RewriteCond %{HTTP:X-Forwarded-Proto} =https',
    '    RewriteRule ^ https://www.saitama-arena.co.jp/ [R=302,L]',
    '',
    '    # 変更日以降の 301 は www 側に設定',
    '    # RewriteRule ^(.*)$ https://arena.gmo$1 [R=301,L]',
  ];
  const VHOST_GMO_TAIL = [
    '',
    '</VirtualHost>',
  ];

  // the Route 53 change batch: www → the load balancer (alias)
  const DNS_BATCH = [
    '{',
    '  "Comment": "www を新サーバー（ALB）へ 2026-11-10",',
    '  "Changes": [',
    '    {',
    '      "Action": "UPSERT",',
    '      "ResourceRecordSet": {',
    '        "Name": "www.saitama-arena.co.jp.",',
    '        "Type": "A",',
    '        "AliasTarget": {',
    '          "HostedZoneId": "Z14GRHDCWA56QT",',
    '          "DNSName": "dualstack.sa-web-alb-1849302275.ap-northeast-1.elb.amazonaws.com.",',
    '          "EvaluateTargetHealth": true',
    '        }',
    '      }',
    '    }',
    '  ]',
    '}',
  ];

  const HOSTS_BASE = [
    '# Copyright (c) 1993-2009 Microsoft Corp.',
    '#',
    '# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.',
    '#',
    '# This file contains the mappings of IP addresses to host names. Each',
    '# entry should be kept on an individual line. The IP address should',
    '# be placed in the first column followed by the corresponding host name.',
    '# The IP address and the host name should be separated by at least one',
    '# space.',
    '#',
    '# Additionally, comments (such as these) may be inserted on individual',
    "# lines or following the machine name denoted by a '#' symbol.",
    '#',
    '# For example:',
    '#',
    '#      102.54.94.97     rhino.acme.com          # source server',
    '#       38.25.63.10     x.acme.com              # x client host',
    '',
    '# localhost name resolution is handled within DNS itself.',
    '#\t127.0.0.1       localhost',
    '#\t::1             localhost',
    '',
  ];
  const HOSTS_LINE = '52.198.113.180    www.saitama-arena.co.jp    # 移転確認';

  const files = {
    'README.md': README.join('\n'),
    'web01/wp-config.php': [...CONFIG_HEAD, ...CONFIG_TAIL].join('\n'),
    'web01/httpd/saitama-arena.conf': VHOST_WWW.join('\n'),
    'web01/httpd/arena-gmo.conf': [...VHOST_GMO_HEAD, ...VHOST_GMO_TAIL].join('\n'),
    'dns/www-alias-alb.json': DNS_BATCH.join('\n'),
    'dns/www-ttl-300.json': [
      '{',
      '  "Comment": "切り替え前に TTL を 300 秒へ 2026-11-09",',
      '  "Changes": [',
      '    {',
      '      "Action": "UPSERT",',
      '      "ResourceRecordSet": {',
      '        "Name": "www.saitama-arena.co.jp.",',
      '        "Type": "A",',
      '        "TTL": 300,',
      '        "ResourceRecords": [{ "Value": "203.0.113.24" }]',
      '      }',
      '    }',
      '  ]',
      '}',
    ].join('\n'),
    '.gitignore': ['*.sql', '*.sql.gz', '.env'].join('\n'),
  };
  // the end states the video checks the typing against
  const done = {
    config: [...CONFIG_HEAD.map((l) => (l === "define( 'DB_HOST', 'localhost' );" ? DB_HOST_FIXED : l)), ...PROXY_FIX, ...CONFIG_TAIL].join('\n'),
    gmo: [...VHOST_GMO_HEAD, '', ...VHOST_GMO_RULES, ...VHOST_GMO_TAIL].join('\n'),
    hosts: [...HOSTS_BASE.slice(0, -1), HOSTS_LINE].join('\n'),
  };

  window.FILES = { files, done, README, PROXY_FIX, DB_HOST_FIXED, VHOST_GMO_RULES, HOSTS_BASE, HOSTS_LINE, HOSTS_PATH: 'C:/Windows/System32/drivers/etc/hosts' };
})();
