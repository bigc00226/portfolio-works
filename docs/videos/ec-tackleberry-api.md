# 制作プロセス デモ — ＠ベリーネット（b-net.tackleberry.co.jp）EC-CUBE 4 店舗システムとの連携（Web API・GraphQL・WebHook）

> 一覧ページ（`/`）と再生ページ（`/watch/ec-tackleberry-api`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-tackleberry-api/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 9 分 47 秒 です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
タックルベリーの新品・中古釣具の WEB ショップ ＠ベリーネット（https://b-net.tackleberry.co.jp/、EC-CUBE 4 で運営）と
**店舗の在庫システムを EC-CUBE の Web API でつなぐ工程** を順番に再生します。

**依頼・現状確認 → Web API プラグイン（Api42）の有効化 → API クライアントの登録と OAuth2.0 の認可 → 店頭で売れた商品の在庫を 0 に（updateProductStock）→ 注文を在庫店舗へ（WebHook・署名の検証）→ 出荷完了と追跡番号を EC へ（updateShipped）→ トークンの更新・取りこぼし確認・定期実行 → 本番へ反映**

画面の日付は 2026/10/21（水）10:06〜（途中で 11:40・11:55・12:10 へカット）。

## 最初に確認していただきたいこと

- b-net.tackleberry.co.jp は **EC-CUBE 4 で運営されている実在のショップ** です（株式会社タックルベリー）。公開ページから読み取れること：
  中古品は全国の店舗の在庫を掲載している（「※商品は店頭展示併売品となります。」「中古商品は全国のタックルベリー各店舗の在庫商品を掲載している為…」
  「商品はタックルベリーの各店舗…から発送されます」、品切れ時は「別途メールにてご連絡」）、商品コードは 13 桁の店舗のバーコード、ランク（N〜C）と商品の状態。
  このデモは「このショップの店頭と EC の在庫・注文を、EC-CUBE 4.3 の Web API でつなぐ」としたらどう進めるか、という **工程の再現** で、実際の開発の記録ではありません。
  ショップの実際のソースコード・管理画面・店舗の在庫システム（POS）は公開されていないため、連携の仕組みとコードはこの動画のために書いたものです。
- **本物のもの**
  - **EC-CUBE の画面はすべて本物** です。この PC の上で動かした **EC-CUBE 4.3.1-p1**（公式の配布物。PHP 8.3 の WebAssembly 版で実行、
    データベースは SQLite）と、同梱の **Web API プラグイン（Api42 4.3.2：GraphQL・OAuth2.0・WebHook）** に、ショップの公開データを入れ、
    動画と同じ操作を実際に行って取り込みました（`tools/snapshots/ec-tackleberry-api/capture-ec.js`、`tools/eccube/`）。
    - 管理画面：商品一覧（在庫 1 → 0）・プラグイン一覧（Web API 無効 → 有効）・OAuth管理（一覧・新規登録・登録後）・API クライアントの認可画面
      （「アプリから＠ベリーネットへのアクセスを許可しますか？」）・WebHook管理（一覧・新規登録）・受注一覧（新規受付 → 発送済み）・受注登録（出荷日・お問い合わせ番号）
    - ショップ（開発環境の EC-CUBE の標準テーマ）：商品詳細・品切れの商品・ご注文手続き・ご注文内容の確認・ご注文完了
  - **API のやり取りはすべて本物** です。動画の連携スクリプト store-link（`integration/store-link`、Node.js 22）は、取り込みのときに
    ローカルの EC-CUBE に対して実際に動かしたもので、ターミナルの出力はそのときの出力です：
    認可コード → トークンエンドポイント（/token）でアクセストークン・リフレッシュトークン、GraphQL（/api）の `updateProductStock`（最初は
    `stock_unlimited` を渡さず GraphQL の検証エラー「Field "updateProductStock" argument "stock_unlimited" of type "Boolean!" is required but not provided.」、
    直して在庫 0・0・1）、`order`・`orders` クエリ、`updateShipped`（出荷済み・出荷完了メール）、1 時間後の期限切れでのリフレッシュ。
    WebHook も EC-CUBE（Api42 の WebHookService）が実際に送った通知で、署名（`X-ECCUBE-Signature`、HMAC-SHA256）を store-link が検証しています。
    最初の版は署名のヘッダーを `req.headers['X-ECCUBE-Signature']` で読み（Node はヘッダー名を小文字にするため undefined）、すべて 401 で拒否 →
    EC-CUBE のログにも失敗が残る → 直したあとの注文で出荷指示、401 だった注文は `orders` の取りこぼし確認で拾います
  - `bin/console` の出力（`cache:clear`、`eccube:api:dump-schema`）、EC-CUBE のログの行、`var/schema.graphql`（GraphQL のスキーマ）は
    そのとき EC-CUBE が実際に出したものです。`eccube:api:dump-schema` はスキーマを出力したあと、Api42 4.3.2 の `execute()` が int を返さないため
    Symfony 6 の型エラーで終わります（動画のとおり）
  - 動画で開く Api42・OAuth2 バンドルのファイル（`UpdateProductStockMutation.php`・`WebHookService.php`・`ClientRepository.php`）は同じ版からそのまま表示しています（`js/link-src.js` の `core`）
  - **ショップのデータは公開ページから**（2026-11-18 取得、`tools/snapshots/ec-tackleberry-api/scrape-shop.js`）：中古のロッド・リール 18 点
    （ショップ自身の商品 ID・商品名・ランク・商品の状態・大分類 / 中分類・メーカー名・規格・品番・13 桁の商品コード・価格・写真 1 枚）、
    大分類（ロッド・リール・ルアー・フライ・雑品・その他用品・アウトドア、ショップ自身の ID）、会社情報（特定商取引法に基づく表記）、中古品の送料（ロッド 2,090 円・リール 880 円）
  - 公開中のショップの画面（中古リールの商品ページ・特定商取引法に基づく表記）は、b-net.tackleberry.co.jp の公開ページを取り込んだものです（`npm run snapshot -- ec-tackleberry-api`）
- **再現のもの**
  - **店舗の在庫システム（POS）の側** はすべて再現です。実際の店舗システムは公開されていないため、store-link・POS の書き出し（`pos/sales-*.csv`）・
    店舗の出荷実績（`pos/shipped-*.csv`）・在庫台帳（`data/ledger.csv`：店舗コードは商品コードの先頭 3 桁、棚番は架空）・出荷指示（`outbox/picking-*.csv`）の形式は、
    この動画のために作ったものです。配送業者とお問い合わせ番号（4419-6203-7751）も架空です
  - 開発環境の画面は EC-CUBE 4.3 の標準テーマです（ショップのテーマのソースは公開されていないため）。ランクは EC-CUBE のタグ（「ランクB+」など）、
    メーカー名・規格・品番は商品説明に入れています（ショップの実際の項目の持ち方は公開されていません）。販売種別の名前は「中古品」「新品」に、
    支払方法は 1 つ（コンビニ・ATM・インターネットバンキング決済の名前の EC-CUBE 標準の支払方法）にしています
  - Api42 のインストール：WebAssembly 版の PHP は外部のプロセスを起動できないため、`eccube:plugin:enable` が行うインストール（`PluginService::postInstall`：
    スキーマの更新で oauth2_* と plg_api_webhook のテーブルを作成）と有効化（`PluginService::enable`）を EC-CUBE の PluginService で直接実行し、
    `cache:clear` を別に実行しました。省いたのは、インストール前の依存プラグインの確認（Composer がオーナーズストアのパッケージ API に問い合わせる処理。
    Api42 はほかのプラグインに依存しません）だけです。ターミナルの `eccube:plugin:enable` の出力は、その `cache:clear` の出力と完了の行をつないだものです
  - 依頼の内容（依頼書）、作業の順序、仕込んだ 2 つのミス、テストのお客様（テスト 太郎・架空。画面ではぼかし）、OAuth クライアントのシークレットと
    WebHook のシークレット（ローカルのコピー専用の値。画面ではぼかし）、開発環境の構成（Docker・localhost:8080・localhost:3100）、
    `Start-Process` での常駐、crontab、git・本番サーバー・店舗システムのサーバーへの反映とその出力は再現です
  - 画面の日付・時刻：取り込みの日時（2026-11-18）は画面の日付（2026-10-21）と時計に置き換えています（`tools/eccube/capture.js`）。
    store-link の出力・EC-CUBE のログの時刻も、間隔はそのままで画面の時計に合わせています（`capture-ec.js` の `retime`）。
    1 時間後のトークンの期限切れは、保存したトークンの期限を過去にして再現し、リフレッシュは実際に行っています
- **ローカルで見るためのもの** です。実在の企業のサイト・ロゴ・商品を含むため、公開はしないでください。

## 再生される内容

| チャプター | 内容 |
| --- | --- |
| 依頼・現状確認 | 依頼書（在庫：店舗 → EC、注文：EC → 在庫店舗、出荷：店舗 → EC）、公開中の商品ページ（店頭展示併売品・品切れの連絡）と特定商取引法に基づく表記（全国の店舗の在庫）、開発環境の商品一覧（13 桁の商品コード・在庫 1） |
| Web API プラグイン | プラグイン一覧（Web API 無効）→ `bin/console eccube:plugin:enable --code=Api42` → `eccube:api:dump-schema`（型エラーで終わるがスキーマは出る）→ `updateProductStock`・`updateShipped` → プラグイン一覧（有効） |
| API クライアントと認可 | OAuth管理 → 新規登録（リダイレクト URI・read / write）→ store-link（トークン・GraphQL）→ `.env` → `node link.mjs authorize` → 管理画面の認可 → 許可 → `/callback` でトークンに交換 |
| 店頭販売の在庫を反映 | POS の書き出し → `update-stock.graphql` → 3 行とも GraphQL の検証エラー → `UpdateProductStockMutation.php`（stock_unlimited は必須）→ `stock_unlimited: false` → 在庫 0・0・1 → 商品一覧・品切れの商品ページ |
| 注文を在庫店舗へ（WebHook） | WebHook管理 → 新規登録（URL・シークレット）→ `WebHookService.php`（HMAC-SHA256）→ 在庫台帳・`pick()`・署名の検証 → テスト注文 → 401（ヘッダー名の大文字）・EC-CUBE のログ → 直してもう一度注文 → 出荷指示（棚番・出荷 ID）→ 受注一覧 |
| 出荷完了を EC へ | 店舗の出荷実績 → `update-shipped.graphql` → `node link.mjs ship` → 受注一覧（発送済み）→ 受注登録（出荷日・お問い合わせ番号） |
| トークン更新・定期実行 | `orders.graphql`（新規受付）→ 1 時間後：アクセストークンの期限切れ → リフレッシュ → 401 だった注文を出荷指示 → crontab |
| 本番へ反映 | git・本番の EC-CUBE で Web API プラグインを有効化・店舗システムのサーバーへ store-link → 公開中の商品ページ |

## EC-CUBE の画面について

- EC-CUBE 4.3.1-p1 は `../eccube-local/inst/ec-tackleberry-api/` に作るこの動画専用のコピーで、ログインはそのコピーの admin / password と
  テストのお客様だけです（実在のショップの管理画面・アカウント・店舗システム、EC-CUBE オーナーズストアには一切ログインしていません）
- 画面は EC-CUBE 自身のスクリプトが動いた後の HTML とスタイルシート・画像をそのまま取り込み、アドレスは開発環境の `http://localhost:8080` に置き換えています
- Api42 の管理画面で登録したクライアントには、Authorization code を選ぶと refresh_token の grant も付きます（`OAuthController`）。そのため 7 章のリフレッシュはそのまま通ります
- 取り込みのやり直し：`tools/snapshots/ec-tackleberry-api/NOTES.md`

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `public/videos/ec-tackleberry-api/index.html` | 動画のページ（共通の部品を読み込むだけ） |
| `js/config.js` | 工程・オープニング・公開中のショップの取り込み設定 |
| `js/scenario.js` | 台本（8 チャプター） |
| `js/apps.js` | EC-CUBE の画面をタブに出す・入力・ぼかし（テストのお客様・シークレット） |
| `js/files.js` | VS Code のプロジェクト（依頼書・`.env`・crontab・Api42 / OAuth2 バンドルのファイル） |
| `js/link-src.js` | store-link の段階ごとのソース（`tools/snapshots/ec-tackleberry-api/build-src.js` が `store-link/` から生成） |
| `js/ec-snapshot.js`・`assets/ec/` | 取り込んだ EC-CUBE の画面と API の出力（`capture-ec.js`） |
| `js/site-snapshot.js`・`assets/site/` | 公開中のショップ（`npm run snapshot -- ec-tackleberry-api`） |
| `tools/snapshots/ec-tackleberry-api/` | `scrape-shop.js`（公開データ）・`fix-site-snapshot.js`（公開中のショップの CSS のマスク画像 SVG を data: URL に。file:// のページでは CSS のマスクにファイルを使えないため）・`shop-data.json`・`store-link/`（連携スクリプトの本体）・`build-src.js`・`capture-ec.js`・`NOTES.md` |
