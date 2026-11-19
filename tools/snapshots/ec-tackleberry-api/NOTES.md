# ec-tackleberry-api — 作業メモ（再開用）

＠ベリーネット（b-net.tackleberry.co.jp、EC-CUBE 4、タックルベリー）外部システム連携の動画。recorded 2026-11-14（タスクバーの日付）。

## 調査（公開ページのみ）

- EC-CUBE 4（/html/template/default・/html/user_data）。商品 ID は 137 万台、販売種別 sale_type 1 = 中古品（ロッド・リール・アウトドア）、2 = 新品、3 = アウトレット
- 中古品は全国の店舗の在庫を掲載：「※商品は店頭展示併売品となります」「※万が一品切れの場合は別途メールにて」「商品はタックルベリーの各店舗…から発送」「在庫店舗からの発送完了メール」
  （特定商取引法の表記・中古について）。商品コードは 13 桁の店舗バーコード（例 2044781016094）、ランク N/S/A/AB/B+/B/B-/C、商品の状態【付属品】【状態】
- 送料（中古）：ロッド 2,090 円・リール 880 円（1 点ごと）

## 内容（決めたこと）

- EC-CUBE 4.3 同梱の Web API プラグイン Api42（GraphQL・OAuth2.0・WebHook）で店舗の在庫システムとつなぐ。店舗側は再現の連携スクリプト
  store-link（tools/snapshots/ec-tackleberry-api/store-link/、Node.js、依存なし）。動画の VS Code では integration/store-link/
- わかったこと（本物の動作）：
  - php-wasm の EC-CUBE からも外への HTTP（Guzzle・curl）は届く → WebHook も本物
  - Api42 の管理画面で Authorization code を選ぶと refresh_token の grant も付く（OAuthController）→ リフレッシュは通る
  - eccube:plugin:enable は installWithCode の依存確認で Composer → オーナーズストアのパッケージ API（exec()）→ php-wasm では不可。
    capture-ec.js は PluginService の postInstall + enable を直接（INSTALL_PHP）。eccube:api:dump-schema はスキーマを出したあと execute() の戻り値の型エラー
  - updateShipped は 新規受付 → 発送済み も可（order_state_machine の ship）
  - WebHook の失敗は EC-CUBE のログ（log_error）だけで、管理画面には出ない
- 仕込んだ誤り：① update-stock.graphql の stock_unlimited 抜け（GraphQL の検証エラー）② WebHook の署名ヘッダーを
  'X-ECCUBE-Signature' で読む（Node は小文字）→ 401、その注文は 7 章の orders（取りこぼし確認）で拾う

## 再実行の手順

```
node tools/snapshots/ec-tackleberry-api/scrape-shop.js     # shop-data.json と ../eccube-local/data/ec-tackleberry-api/save_image（済）
node tools/snapshots/ec-tackleberry-api/build-src.js       # store-link/ → js/link-src.js（段階ごとの link.mjs）
node tools/snapshots/ec-tackleberry-api/capture-ec.js <shots>  # fresh なコピーから全工程 → js/ec-snapshot.js
node tools/webp.js ec-tackleberry-api
npm run snapshot -- ec-tackleberry-api                      # 公開中のサイト（detail・tradelaw。済）
node tools/snapshots/ec-tackleberry-api/fix-site-snapshot.js  # snapshot のあと毎回（マスクの SVG を data: URL に）
npm run verify -- ec-tackleberry-api --shots=… --out=<scratch>
npm run check -- ec-tackleberry-api ; npm run pointer -- ec-tackleberry-api ; npm run timeline -- ec-tackleberry-api
```

## 状況

- [x] 調査・shop-data.json・site-snapshot.js・config.js・content/videos.ts のエントリー
- [x] Api42 の有効化・外への HTTP の確認（scratch のテスト）
- [x] store-link（link.mjs・graphql・lib）→ build-src.js
- [x] capture-ec.js（1 回目の実行 2026-11-18 19:50〜）
- [x] index.html・css・apps.js・files.js・scenario.js（下書き）
- [x] docs/videos/ec-tackleberry-api.md（長さ LENGTH は timeline のあと）
- [x] webp・fix-site-snapshot.js（CSS のマスク SVG → data: URL）
- [x] verify ✓ 9:47・check 0・pointer 0・timeline 587.4 s（thumbAt 436：WebHook の 401 のログと出荷指示）
- メモ：update-stock.graphql の v1 は「コメントはそのまま、stock_unlimited の引数だけ無い」に変更済み（build-src.js）。
  1 回目の取り込みでは v1 のコメントが短かった（GraphQL のコメントなので応答は同じ）。取り込み直せばそろう
- 取り込みの所要：約 12 分（2026-11-18 19:50〜20:02）。capture-ec.js は list-clients / update-client も実行するが動画では使っていない
