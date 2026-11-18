/*
 * The project in VS Code (C:\work\cagiana-ec4): the new EC-CUBE 4.3 for CAGIANA in git —
 *   .env, app/Plugin/DataMigration42/…, app/template/cagiana/…, migration/ec3/config.yml   the real files (js/project-src.js)
 *   app/Customize/EventSubscriber/LegacyUrlSubscriber.php, scripts/check-urls.ps1         js/migrate-src.js (what the capture ran)
 *   scripts/old-urls.txt      the old shop's URLs the capture checked (EC_SNAPSHOT.data.urlList)
 *   README.md                 the migration plan and the switch-over checklist (a reconstruction)
 */
(function () {
  'use strict';
  const P = window.CAGIANA_PROJECT, SRC = window.CAGIANA_SRC;
  const DATA = (window.EC_SNAPSHOT && window.EC_SNAPSHOT.data) || {};
  const files = { ...P.files };
  const c3 = (DATA.ec3 && DATA.ec3.counts) || { products: 37, categories: 44, customers: 12, orders: 16, images: 146 };

  files['README.md'] = [
    '# CAGIANA《カジーナ》EC-CUBE 3 → 4 データ移行',
    '',
    '本番：https://cagiana.jp（EC-CUBE 3.0.17・テーマ cagiana）→ 新：EC-CUBE 4.3.1-p1（PHP 8.3）',
    '',
    '## 開発環境',
    '',
    '- 新：http://localhost:8080（このリポジトリ、`docker compose up -d`、SQLite）',
    '- 旧：http://localhost:8030（本番のファイルと DB から作った EC-CUBE 3 のコピー。3.0 系の最終版 3.0.18-p7 で起動）',
    '',
    '## 棚卸し（旧サイト）',
    '',
    '| 項目 | 内容 | 移行 |',
    '| --- | --- | --- |',
    `| 商品 | ${c3.products} 件（規格 ${c3.product_class || 154} 行・画像 ${c3.images} 枚） | データ移行プラグイン・画像はコピー |`,
    `| カテゴリ | ${c3.categories} 件（ID を引き継ぐ → /products/list?category_id= は同じ） | データ移行プラグイン |`,
    `| 会員 | ${c3.customers} 件（パスワードは AUTH_MAGIC で照合） | データ移行プラグイン・.env |`,
    `| 受注 | ${c3.orders} 件 | データ移行プラグイン |`,
    '| パンくずリスト（BreadcrumbList3） | 全ページのパンくず | テーマに組み込み |',
    '| メーカー管理（maker-plugin） | 商品ページの「CAGIANA《カジーナ》」 | テーマで表示 |',
    '| テーマ cagiana | /html/template/cagiana（CSS・画像） | Twig 3 で作り直し |',
    '',
    '## 手順',
    '',
    '1. 旧：データ移行用バックアッププラグイン（3.0 系）で DB をバックアップ（CSV の tar.gz）',
    '2. 旧：html/upload/save_image（商品画像）を退避',
    '3. 新：データ移行プラグイン for EC-CUBE4（4.3 対応版）＋ 依存ライブラリ',
    '4. 新：.env の ECCUBE_AUTH_MAGIC に旧サイトの auth_magic（会員・管理者のパスワード）',
    '5. 新：バックアップを取り込み → 件数と内容を照合',
    '6. 新：画像を html/upload/save_image へ、テーマ cagiana',
    '7. 新：旧 URL を確認（scripts/check-urls.ps1）、変わった URL は 301',
    '',
    '## 本番切り替え（10/28 21:00〜）',
    '',
    '- [ ] 21:00 旧サイトをメンテナンス表示（注文の受付を止める）',
    '- [ ] 旧：バックアップをもう一度（当日までの会員・受注）',
    '- [ ] 新（本番）：データ移行プラグイン「会員と受注データのみ移行する」',
    '- [ ] 新：支払方法・配送方法を有効化、テスト注文',
    '- [ ] DNS：cagiana.jp の A レコードを新サーバーへ（TTL は前日に 300 秒へ）',
    '- [ ] 確認：トップ・商品ページ・ログイン・カート、旧 URL の 301',
    '',
  ].join('\n');

  files[SRC.CHECK_PATH] = SRC.CHECK;
  files['scripts/old-urls.txt'] = ['# 旧サイト（EC-CUBE 3）の URL：公開ページのリンク・商品・カテゴリ・画像', ...(DATA.urlList || ['/', '/ec', '/products/detail/103'])].join('\n') + '\n';

  window.FILES = { files, SRC };
})();
