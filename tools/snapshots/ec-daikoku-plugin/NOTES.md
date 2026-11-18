# ec-daikoku-plugin — 作業メモ（再開用）

あみだ池大黒オンラインショップ（https://www.daikoku.ne.jp/shop/、EC-CUBE 4・テーマ amidaike。トップは WordPress）の
専用プラグイン開発の動画。recorded 2026-11-03（タスクバーの日付）、時計 10:12〜。

## 内容（決めたこと）

- 公開ページの調査（2026-11-18）：商品ページに「<のし対応について> 包装商品のため、熨斗はご指定がない限り「外のし」となります。
  「内のし」をご希望の場合は備考欄にご記入ください。」、のし対応の商品にはテーマの「のし設定」アイコン（icon_noshi_pc.png）。
  ご利用ガイドに包装紙・手提げ袋。送料はヤマト運輸（地域別、7,000 円以上で無料）
- プラグイン DaikokuGift（あみだ池大黒 ギフトのし）：コードの唯一のソースは public/videos/ec-daikoku-plugin/js/gift-src.js
  （files(stage) 1 管理画面側 / 2 注文手続き / 3 受注登録・メール / 4 配送CSV。SCAFFOLD は eccube:plugin:generate の出力そのまま）
- 工程（再現）：依頼 → eccube:plugin:generate → Config・NoshiTitle・PluginManager・Nav・Controller・Form・Twig → install / enable →
  基本設定（案内文）・表書き一覧（御年賀を追加）→ トレイト（Product の のし対応 @FormAppend、Shipping の のし）・ShippingTypeExtension・
  Event（TemplateEvent）→ システムエラー（インストール後に足したトレイトはプロキシにない）→ eccube:generate:proxies・doctrine:schema:update →
  商品登録で のし対応 → 注文手続き（表書きの入力チェック）→ 確認 → 完了 → 受注登録・メール通知 → PluginManager の配送CSV 項目 →
  無効化（注文手続きから消える）→ 有効化 → CSV出力項目設定・配送CSV → zip → 無効化・削除 → 独自プラグインのアップロード → 有効化 → 本番（再現）

## 再実行の手順

```
node tools/snapshots/ec-daikoku-plugin/scrape-shop.js          # shop-data.json と ../eccube-local/data/ec-daikoku-plugin/save_image（済）
node tools/snapshots/ec-daikoku-plugin/build-core.js           # js/eccube-core.js（EC-CUBE 本体のファイル、済）
node tools/snapshots/ec-daikoku-plugin/capture-ec.js <shots>   # fresh なコピーから全工程（20〜35 分）→ js/ec-snapshot.js、DaikokuGift-1.0.0.zip
node tools/snapshots/ec-daikoku-plugin/recapture-plugin-list.js <shots>  # (済・一度だけ) プラグイン一覧 3 画面を取り直して merge（capture-ec.js は修正済みなので次回の全体の取り込みでは不要）
node tools/webp.js ec-daikoku-plugin
npm run snapshot -- ec-daikoku-plugin                          # 公開中のショップ（config.js の snapshot：商品 133・290、ご利用ガイド。済）
npm run verify -- ec-daikoku-plugin --shots=… --out=<scratch>
npm run check -- ec-daikoku-plugin ; npm run pointer -- ec-daikoku-plugin ; npm run timeline -- ec-daikoku-plugin
```

- capture-ec.js は毎回 fresh。途中で止めたときは、その node（とその子の chrome）を止めてから再実行
  （PowerShell：Get-CimInstance Win32_Process で CommandLine に capture-ec.js を含む node を探して Stop-Process）。
- php-wasm の注意は ec-l-meal-payment/NOTES.md と同じ（同梱プラグインの削除、install / enable の cache:clear、var/cache/prod の削除）。
- この動画でわかったこと：
  - 管理画面の無効化・有効化・削除・アップロードは EC-CUBE がプロキシを作り直すときの「gen -> …」の行（ConsoleOutput = php://stdout）が
    WebAssembly ではレスポンスに混ざり、リダイレクトのページで止まる → 操作の後にプラグイン一覧を開き直す（フラッシュメッセージはそこで出る）。
    実際の PHP-FPM / Apache では stdout はレスポンスに入らないので普通にリダイレクトする
  - メール通知のテンプレートの選択は form を submit する（nav で待つ）
  - eccube:plugin:generate の release.yml は先頭が空行（gift-src.js の SCAFFOLD も同じにした）
  - トレイトを足しただけでは front.ERROR「Can't get a way to read the property "noshi_type" in class "EccubeEntityShipping"」の
    システムエラー → eccube:generate:proxies と doctrine:schema:update（ALTER TABLE 4 行）で直る

## 状況

- [x] 調査・shop-data.json・gift-src.js・capture-ec.js・build-core.js・config / index / css / files.js / apps.js・site-snapshot（npm run snapshot）
- [x] content/videos.ts のエントリー・docs/videos/ec-daikoku-plugin.md・scenario.js（run 2 の取り込みで verify：typing の差は Nav の末尾の改行だけ → 修正、長さ 11:21 → 待ち時間を詰めた）
- [x] 最終の取り込み（run 3、2026-11-18 22:58）＋ recapture-plugin-list.js（無効 / 有効のプラグイン一覧：run 3 ではサーバー再起動で管理画面のセッションが切れてログイン画面になっていた）→ webp
- [x] verify ✓ 9:42・check 0・pointer 0・timeline 582.5 s（thumbAt 334：注文手続きの のし欄）
- 次にやるなら：全体を取り直すときは capture-ec.js だけで良い（recapture-plugin-list.js は不要）。取り直し後に restore は不要（今回 merge で消えた assets/ec の 8 ファイルは EC-CUBE のコピーから戻して webp 済み）
- わかったこと（追加）：管理画面からの削除（uninstall）は plg_ のテーブルだけでなく、トレイトで足した dtb_product / dtb_shipping の列も消す
  （入れ直すと商品の のし対応は未設定、受注の のし も消える）。動画ではこれを見せてから 12 商品を設定し直す（capture では PHP で）。
  プラグイン操作の自動メンテナンスモード（.maintenance）は WebAssembly では PHP の stat キャッシュに残る → ファイルを消してサーバーを再起動
