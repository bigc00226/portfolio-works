/*
 * The project in VS Code (C:\work\koyama-kyugu-ec): the shop's EC-CUBE 4 in git —
 *   app/template/default   the shop's theme (js/theme-src.js: rebuilt from the live HTML, the same files the local
 *                          EC-CUBE of the captures runs)
 *   app/Customize          what this video writes (js/customize-src.js — the same source the captures install)
 *   html/user_data/assets/css/customize.css   the live file (+ the badge's CSS, typed in the video)
 *   docker-compose.yml / composer.json        EC-CUBE 4.3.1-p1's own (APP_ENV prod for the dev copy)
 *   README.md              the dev notes and the shop's request (a reconstruction)
 */
(function () {
  'use strict';
  const TH = window.KOYAMA_THEME;
  const files = { ...TH };

  files['README.md'] = [
    '# 小山弓具 公式オンラインショップ（EC-CUBE 4）',
    '',
    '本番：https://www.koyama-kyugu.com（EC-CUBE 4.3.1-p1）',
    '',
    '## 開発環境',
    '',
    '- `docker compose up -d` → http://localhost:8080（管理画面は /admin）',
    '- データベースは SQLite（var/eccube.db。本番の商品・カテゴリ・配送設定をコピー）',
    '- テーマ：app/template/default（default_frame.twig・Product/detail.twig ほか）',
    '- カスタマイズ：app/Customize（本体 src/ は触らない）',
    '',
    '## 改修の依頼（2026/09）',
    '',
    '1. 受注生産の商品をわかりやすく',
    '   - いまは商品名の［受注生産］と、説明文の中の納期（「製作に約1年程度」など）を読まないと分からない',
    '   - 商品登録で「受注生産」と「納期の目安」を設定し、商品ページの価格の下に表示する',
    '   - 在庫品は在庫数から「在庫あり / 残りわずか（3 点以下）」を表示する',
    '2. 送料無料の条件をカートで計算する',
    '   - ご購入ガイド：お買い上げ 15,000 円以上で送料無料（矢各種・矢筒のいずれかを含む場合は 55,000 円以上）',
    '   - 基本設定の「送料無料条件」は金額 1 つだけ → 矢・矢筒を含むご注文の条件はコードで',
    '   - カートの「あと○円で送料無料」も同じ条件にする',
    '',
    '## 本番への反映',
    '',
    '```',
    'git pull',
    'composer install --no-dev --optimize-autoloader',
    'bin/console eccube:generate:proxies',
    'bin/console doctrine:schema:update --dump-sql --force',
    'bin/console cache:clear --no-warmup',
    '```',
    '',
  ].join('\n');

  window.FILES = { files, SRC: window.KOYAMA_SRC };
})();
