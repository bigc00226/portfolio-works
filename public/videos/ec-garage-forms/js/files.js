/*
 * The project in VS Code (C:\work\garage-eccube): Garage's EC-CUBE 2 in git — EC-CUBE's own files (data/class …, read
 * only: js/eccube-core.js, copied from the EC-CUBE 2 the captures run), the customisation this video writes into
 * data/class_extends (js/garage-src.js — the same code the real EC-CUBE 2 of the captures runs), the request, the SQL of
 * the 出荷指示 CSV and the 商品部's product CSV (built by tools/snapshots/ec-garage-forms/capture-ec.js from the live
 * site's 新着商品 and uploaded to the real EC-CUBE: js/ec-snapshot.js data).
 */
(function () {
  'use strict';
  const SRC = window.GARAGE_SRC, CORE = window.EC_CORE;
  const DATA = (window.EC_SNAPSHOT && window.EC_SNAPSHOT.data) || {};
  const files = {};

  files['README.md'] = [
    '# Garage（garage.plus.co.jp）EC-CUBE',
    '',
    'EC-CUBE 2.25（PHP 8.3）。カスタマイズは data/class_extends（*_Ex.php）とテンプレート（Smarty）で行い、',
    'data/class（EC-CUBE 本体）は変更しない。',
    '',
    '## 開発環境',
    '',
    '- http://localhost:8080（管理画面 /admin/）：EC-CUBE 2.25 + SQLite',
    '- データベース：本番のコピー（お客様の情報はダミーに置き換え済み）',
    '- SQL は本番（PostgreSQL）でも動く書き方にする（文字列の連結は ||）',
    '- 帳票（PDF）：受注管理 › 帳票出力（data/class/SC_Fpdf.php・FPDF）',
    '',
    '## 本番への反映',
    '',
    '```',
    'git push',
    'ssh garage-prod "cd /var/www/eccube && ./deploy.sh"   # git pull・Smarty のキャッシュ削除',
    '```',
    '',
  ].join('\n');

  files['docs/request-2026-11.md'] = [
    '# 帳票・CSV まわりの改修依頼（2026/11/07 業務チーム）',
    '',
    '## 1. 納品書（PDF）',
    '',
    '- 受注管理 › 帳票出力の納品書を、法人のお客様にそのままお渡しできる形に',
    '  - 右上のロゴが EC-CUBE のサンプルのまま → Garage のロゴに',
    '  - 明細の「商品名 / 商品コード / [ 規格 ]」が 1 列で読みにくい → 品番を別の列に',
    '  - タイトル「納品書」と備考（お客様センターの連絡先）を毎回手で入力している → 初期値に',
    '- 1 日分の受注をまとめて出力したい（PDF一括出力）',
    '',
    '## 2. 出荷指示 CSV（物流倉庫 PLC）',
    '',
    '- 倉庫のシステムに取り込む CSV：1 行 = 1 配送先の 1 商品',
    '- 項目：受注番号・配送先番号・お届け希望日・配送方法・会社名・お届け先・郵便番号・住所・',
    '  電話番号・品番・商品名・カラー・数量',
    '- 対象：対応状況が「新規受付」「入金済み」の受注',
    '',
    '## 3. 新着商品の一括登録',
    '',
    '- 商品部の CSV（docs/csv/products-new-2026-11.csv）を商品登録CSVで登録',
    '- 画像は html/upload/save_image にアップロード済み',
    '',
  ].join('\n');

  for (const [k, v] of Object.entries(CORE)) files[k] = v;
  files['data/Smarty/templates/admin/pdf/logo.png'] = '';
  files['data/Smarty/templates/admin/pdf/nouhinsyo1.pdf'] = '';
  files['assets/garage/logo_garage.png'] = '';
  files['docs/csv/products-new-2026-11.csv'] = String(DATA.productCsv1 || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
  files['.gitignore'] = ['/data/config/config.php', '/data/cache/', '/data/logs/', '/data/Smarty/templates_c/', '/html/upload/temp_*', '/vendor/', ''].join('\n');

  // the files VS Code shows after the video's changes
  const FINAL_CSV = String(DATA.productCsv2 || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
  const SHIP_CSV = String((DATA.shipCsv && DATA.shipCsv.text) || '').replace(/\r\n/g, '\n').replace(/\n$/, '');

  window.FILES = { files, SRC, FINAL_CSV, SHIP_CSV, SHIP_FILE: 'docs/csv/shipping-plc-20261110.csv' };
})();
