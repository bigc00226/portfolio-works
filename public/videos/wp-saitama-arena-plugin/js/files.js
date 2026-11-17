/*
 * The project in VS Code (C:\work\saitama-arena-wp): the site's wp-content in git — the plugin this video writes
 * (wp-content/plugins/arena-events: its source is js/plugin-src.js, the same files the real WordPress of the captures
 * runs), the main theme's template part for 本日開催のイベント (wp-content/themes/saitamaarena — a reconstruction that
 * outputs the live home page's markup: .daily-event / .event-list_item …), the dev environment (wp-env with a copy of the
 * production database, as the migration of 2026-11-10 left it), PHPCS (WordPress Coding Standards), the spec.
 * The 催事管理システム and its API are invented for the demo; the events in docs/api-sample.json are the live ones.
 */
(function () {
  'use strict';
  const PL = window.ARENA_PLUGIN;
  const P = PL.DIR;
  const files = {};
  const t = PL.tabs;

  files['README.md'] = [
    '# イベント連携プラグイン（Arena Events Sync）',
    '',
    '催事管理システムに登録されたイベントを、イベントスケジュール（/schedule/）へ毎日自動で取り込む。',
    '担当者が管理画面で 1 件ずつ入力していた作業をなくす。',
    '',
    '## 要件',
    '',
    '- 取り込み先：マルチサイトの /schedule/（イベントスケジュール）の投稿',
    '  - カテゴリー：コンサート・ショー / スポーツ / 集会・式典・セミナー / 物販・展示会 / その他',
    '  - 会場タイプ：アリーナ / コミュニティアリーナ / けやきひろば / その他',
    '  - 開催日（既存のメタ event_start / event_end）・入場料・お問合せ・リンク・画像',
    '- 毎朝 5:00 に自動同期（WP-Cron）、管理画面の「今すぐ同期」、WP-CLI',
    '- トップページ「本日開催のイベント」：プラグインの関数で出力（カレンダーは REST API）',
    '- 同期の失敗・イベントの追加や変更は Web チームへメールで通知',
    '',
    '## 催事管理システム API（v1）',
    '',
    '- `GET {API の URL}/events?from=YYYY-MM-DD&to=YYYY-MM-DD`',
    '- API の URL：`https://saiji.sa.internal/api/v1`（社内ネットワーク）',
    '- 認証：`Authorization: Bearer {API キー}`（催事管理システムの「外部連携」で発行）',
    '- 日時は ISO 8601（日本時間 +09:00）。応答の例：docs/api-sample.json',
    '',
    '## 開発',
    '',
    '```',
    'npm start            # wp-env：http://localhost:8888（本番 DB のコピー）',
    'npm run cli -- …     # WP-CLI',
    'composer lint        # PHPCS（WordPress Coding Standards）',
    '```',
  ];

  files['docs/api-sample.json'] = [
    '{',
    '  "count": 12,',
    '  "events": [',
    '    {',
    '      "id": "EV2611-024",',
    '      "title": "2026さいたまるしぇ in さいたまクリテリウム",',
    '      "slug": "",',
    '      "start_date": "2026-11-14T00:00:00+09:00",',
    '      "end_date": "2026-11-15T23:59:59+09:00",',
    '      "category": "other",',
    '      "venue": ["keyakihiroba"],',
    '      "fee": "無料",',
    '      "contact": "公益社団法人さいたま観光国際協会 048-647-8339（平日9:00〜17:45、土日祝休)",',
    '      "url": "https://visitsaitamacity.jp/events/5",',
    '      "image": "https://www.saitama-arena.co.jp/schedule/wp-content/uploads/sites/2/2022/11/marche.gif"',
    '    },',
    '    {',
    '      "id": "EV2611-071",',
    '      "title": "GMO winter illumination in けやきひろば～If Snow～",',
    '      "slug": "",',
    '      "start_date": "2026-11-07T00:00:00+09:00",',
    '      "end_date": "2027-01-24T23:59:59+09:00",',
    '      "category": "other",',
    '      "venue": ["keyakihiroba"],',
    '      "fee": "無料",',
    '      "contact": "GMOアリーナさいたま 048-601-1122",',
    '      "url": "https://www.saitama-arena.co.jp/event/illumination2026/",',
    '      "image": "https://www.saitama-arena.co.jp/schedule/wp-content/uploads/sites/2/2026/10/7149224a2a5d1cd1ca78bed6da330d61-scaled-e1792735709590.jpg"',
    '    }',
    '  ]',
    '}',
  ];

  files['.wp-env.json'] = [
    '{',
    '  "core": "WordPress/WordPress#7.1.4",',
    '  "phpVersion": "8.3",',
    '  "mappings": {',
    '    "wp-content/plugins/arena-events": "./wp-content/plugins/arena-events",',
    '    "wp-content/themes/saitamaarena": "./wp-content/themes/saitamaarena"',
    '  },',
    '  "port": 8888,',
    '  "config": {',
    '    "WP_DEBUG": true,',
    '    "WP_DEBUG_LOG": true,',
    '    "WP_DEBUG_DISPLAY": false,',
    '    "MULTISITE": true,',
    '    "SUBDOMAIN_INSTALL": false,',
    '    "DOMAIN_CURRENT_SITE": "localhost:8888",',
    '    "PATH_CURRENT_SITE": "/"',
    '  }',
    '}',
  ];

  files['package.json'] = [
    '{',
    '  "name": "saitama-arena-wp",',
    '  "private": true,',
    '  "scripts": {',
    '    "start": "wp-env start",',
    '    "stop": "wp-env stop",',
    '    "cli": "wp-env run cli wp"',
    '  },',
    '  "devDependencies": {',
    '    "@wordpress/env": "^11.4.0"',
    '  }',
    '}',
  ];

  files['composer.json'] = [
    '{',
    '  "name": "saitama-arena/wp",',
    '  "require-dev": {',
    '    "wp-coding-standards/wpcs": "^3.1",',
    '    "dealerdirect/phpcodesniffer-composer-installer": "^1.0"',
    '  },',
    '  "scripts": {',
    '    "lint": "phpcs",',
    '    "format": "phpcbf"',
    '  },',
    '  "config": {',
    '    "allow-plugins": {',
    '      "dealerdirect/phpcodesniffer-composer-installer": true',
    '    }',
    '  }',
    '}',
  ];

  files['phpcs.xml.dist'] = [
    '<?xml version="1.0"?>',
    '<ruleset name="saitama-arena">',
    '  <file>wp-content/plugins/arena-events</file>',
    '  <arg name="extensions" value="php"/>',
    '  <arg value="s"/>',
    '  <rule ref="WordPress-Extra"/>',
    '  <config name="minimum_wp_version" value="6.6"/>',
    '  <rule ref="WordPress.WP.I18n">',
    '    <properties>',
    '      <property name="text_domain" type="array">',
    '        <element value="arena-events"/>',
    '      </property>',
    '    </properties>',
    '  </rule>',
    '</ruleset>',
  ];

  files['.gitignore'] = ['node_modules/', 'vendor/', '.DS_Store', '*.log', ''];

  /* the theme's 本日開催のイベント (the live markup): first with its own query, then the plugin's function */
  const DAILY_HEAD = t([
    '<?php',
    '/**',
    ' * トップページ：本日開催のイベント（カレンダーで日付を選ぶ：?disp-date=2026-11-13）',
    ' *',
    ' * @package saitamaarena',
    ' */',
    '',
    "$disp_date = isset( $_GET['disp-date'] ) ? sanitize_text_field( wp_unslash( $_GET['disp-date'] ) ) : wp_date( 'Y-m-d' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended",
    "$week      = array( '日', '月', '火', '水', '木', '金', '土' );",
    '$target    = new DateTimeImmutable( $disp_date, wp_timezone() );',
    '?>',
    '<div class="daily-event" id="daily-event">',
    '    <div class="daily-event_header">',
    '        <h2 class="daily-event_title">',
    '            <svg class="icon icon-3color"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-3color"></use></svg>',
    '            <span class="disp-date" id="js-disp-date">本日開催のイベント',
    '        </h2>',
    '        <div class="daily-event_calender">',
    "            <div class=\"target-date\"><?php echo esc_html( $target->format( 'Y年 n月j日 ' ) . $week[ (int) $target->format( 'w' ) ] . '曜日' ); ?></div>",
    "            <button class=\"calender-trigger\" id=\"js-calender-trigger\"><img src=\"<?php echo esc_url( get_theme_file_uri( 'img/share/ico-calender.svg' ) ); ?>\" alt=\"カレンダー\" class=\"calender-icon\"></button>",
    '        </div>',
    '    </div>',
    '    <div class="daily-event_body">',
  ].join('\n')).split('\n');
  const DAILY_OLD = t([
    '        <?php',
    '        // イベントスケジュール（サイト 2）の投稿を、担当者が入力した開催日で絞り込む.',
    '        switch_to_blog( 2 );',
    '        $events = get_posts(',
    '            array(',
    "                'posts_per_page' => 20,",
    "                'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query",
    "                    array( 'key' => 'event_start', 'value' => $disp_date, 'compare' => '<=', 'type' => 'DATE' ),",
    "                    array( 'key' => 'event_end', 'value' => $disp_date, 'compare' => '>=', 'type' => 'DATE' ),",
    '                ),',
    '            )',
    '        );',
    '        ?>',
    '        <ul class="event-list">',
    '            <?php foreach ( $events as $event ) : ?>',
    '                <li class="event-list_item">',
    '                    <a class="event-list_anchor" href="<?php echo esc_url( get_permalink( $event ) ); ?>">',
    "                        <div class=\"event-thumbnail\"><?php echo get_the_post_thumbnail( $event, 'medium', array( 'class' => 'event-thumbnail_image' ) ); ?></div>",
    '                        <div class="event-data"><div class="event-data_title"><?php echo esc_html( get_the_title( $event ) ); ?></div></div>',
    '                    </a>',
    '                </li>',
    '            <?php endforeach; ?>',
    '        </ul>',
    '        <?php restore_current_blog(); ?>',
  ].join('\n')).split('\n');
  const DAILY_NEW = t("        <?php echo arena_events_today_list( $target->format( 'Y-m-d' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- 関数内でエスケープ済み。 ?>");
  const DAILY_TAIL = t(['    </div>', '</div>', ''].join('\n')).split('\n');
  const DAILY = 'wp-content/themes/saitamaarena/template-parts/daily-event.php';
  files[DAILY] = [...DAILY_HEAD, ...DAILY_OLD, ...DAILY_TAIL];

  /* the plugin: what is there at the start (written the day before) */
  const at0 = PL.files(0);
  for (const p of ['includes/class-arena-events-importer.php', 'includes/class-arena-events-log-table.php', 'includes/class-arena-events-cli.php']) files[P + p] = at0[p].split('\n');
  // functions.php without the REST API (written in the video): REST_A (the route) is typed, REST_B (its callback) pasted
  const FN = at0['includes/functions.php'];
  const r0 = FN.indexOf('/**\n * GET /wp-json/'), r1 = FN.indexOf('/**\n * 毎日の自動同期');
  const REST = FN.slice(r0, r1);
  const rb = REST.indexOf('\n/**\n * 指定日のイベント（JSON）');
  const REST_A = REST.slice(0, rb), REST_B = REST.slice(rb);
  files[P + 'includes/functions.php'] = FN.slice(0, r0) + FN.slice(r1);

  const join = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.join('\n') : v]));
  window.FILES = { files: join(files), PL, DAILY, DAILY_OLD, DAILY_NEW, REST_A, REST_B };
})();
