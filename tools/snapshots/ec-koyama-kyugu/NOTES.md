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
- [x] capture-ec.js（18:27 に完了、19 画面・order id 2・送料 1,980 円）→ webp → npm run snapshot
  - 分かったこと：cap.console は APP_ENV を渡すので bin/console が .env を読まず DATABASE_URL が空 → DB を使うコマンド
    （doctrine:schema:update）はサーバーの PHP で Application を動かす（dbConsole）。cache:clear の後は var/cache/prod も消す。
    キャッシュを消すと管理画面・会員のログインが切れる → adminGo / frontLogin で入り直す。4.3 同梱の未インストールの
    プラグイン（dtb_plugin の 11 件）は登録を外す（schema:update がその列まで出すため）。finish() の後は process.exit(0)。
- [x] verify / check / pointer / timeline

## 状況（2026-11-18 夕方）

- [x] docs/videos/ec-koyama-kyugu.md（長さ 7:49）
- [x] verify（エラー・食い違いなし）・check（0）・pointer（3 件 → 修正：商品管理のサブメニュー、トグルの的、保存しましたの枠を削除）
- [x] timeline（7:49、thumbAt 303 = 三ツカケの「残りわずか」の商品ページ。サムネイル確認済み）

## テーマのレイアウト（2026-11-18 夜に修正）

- 原因：公開中の HTML には #wrapper（padding-top: 100px）があり、aside#sidebar が 2 つ（ヘッダー内のスマホ用 .sp と
  .contentsWrap 内の PC 用）ある。build-theme.js が #wrapper を落とし、スマホ用のサイドバーを取っていた（front.bundle.js は無関係）。
- 修正：#wrapper・.ec-overlayRole・.ec-drawerRoleClose を付け、.contentsWrap > aside#sidebar を使う。p.detail04 は商品の
  フリーエリア（付属品など。scrape-shop.js の free）、バッジはその上の p.stockBadges（customize-src.js・scenario.js・apps.js）。
- 再取り込み：scrape → build-theme → make-theme-src → capture-ec → webp → verify / check / pointer / timeline。
