# ec-koyama-kyugu — 作業メモ（再開用）

小山弓具 公式オンラインショップ（www.koyama-kyugu.com、EC-CUBE 4）の「既存 EC サイトの機能改修」の動画。

## 内容（決めたこと）

- 改修 1：受注生産・納期の目安（Product のエンティティ拡張 ProductTrait → proxies → スキーマ更新を忘れてシステムエラー → schema:update、
  FormType 拡張で商品登録に入力欄、Twig 拡張 stock_badge() と Product/detail.twig の p.detail04 にバッジ、customize.css）
- 改修 2：送料無料の条件「矢・矢筒を含む場合は 55,000 円以上」（PurchaseFlow の ArrowDeliveryFeeProcessor @ShoppingFlow、
  カートの「あと○円」は EventSubscriber CartDeliveryFeeSubscriber の TemplateEvent で least / is_delivery_free を差し替え）
- コードの唯一のソース：public/videos/ec-koyama-kyugu/js/customize-src.js（動画とキャプチャーの両方が読む）
- テーマ：公開中の HTML から作り直したもの（build-theme.js → theme/。default_frame.twig・Product/detail.twig・CSS / 画像 theme/html）

## 再実行の手順

```
node tools/snapshots/ec-koyama-kyugu/scrape-shop.js     # shop-data.json（公開ページのカテゴリ・商品 21 点）
node tools/snapshots/ec-koyama-kyugu/build-theme.js     # theme/（Chrome を短時間使う）
node tools/snapshots/ec-koyama-kyugu/capture-ec.js <shots>   # fresh なコピーから全工程（15〜25 分）→ js/ec-snapshot.js
node tools/webp.js ec-koyama-kyugu
npm run snapshot -- ec-koyama-kyugu                      # 公開中のショップ（home / product 7 / guide）
```

## 状況

- [x] 調査・shop-data.json・theme/・customize-src.js・capture-ec.js・config.js・content/videos.ts のエントリー
- [x] theme-src.js（make-theme-src.js）、files.js / apps.js / scenario.js / index.html / css、docs の下書き（__LEN__ / __DATE__ を埋める）
- [ ] capture-ec.js の実行と画面の確認（1 回目：受注生産の商品が在庫 0 で「品切れ」→ UNLIMITED（在庫無制限）に修正済み、要再実行）
- [ ] npm run snapshot（Chrome は 1 つずつ：キャプチャーの後に）
- [ ] verify / check / pointer / timeline（thumbAt）
