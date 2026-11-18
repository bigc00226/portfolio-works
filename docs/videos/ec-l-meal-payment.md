# 制作プロセス デモ — ライフミール（l-meal.com）EC-CUBE 4 決済システムの構築

> 一覧ページ（`/`）と再生ページ（`/watch/ec-l-meal-payment`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-l-meal-payment/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは __LEN__ です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
健康冷凍弁当の定期便ショップ ライフミール（https://l-meal.com/、EC-CUBE 4 で運営）の **決済まわりの構築の工程** を順番に再生します。

**依頼・現状確認 → GMO後払いの手数料と利用条件 → カード決済プラグイン（PaymentMethodInterface・トークン方式）→ インストールと配送方法の取扱支払方法 → テスト注文（購入エラーの修正）→ 受注管理（入金済み・取引 ID）と注文メール → 冷凍庫レンタルはカードのみ・後払いの上限 → 本番へ反映**

画面の日付は 2026/09/24（木）10:12〜。

## 最初に確認していただきたいこと

- l-meal.com は **EC-CUBE 4 で運営されている実在のショップ** です（株式会社シルバーライフ）。このデモは「このショップの決済まわりを
  EC-CUBE 4.3 の環境で組み直す」としたらどう進めるか、という **工程の再現** で、実際の開発の記録ではありません。
  ショップの実際のソースコード・管理画面・決済代行会社との契約内容は公開されていないため、プラグインのコードはこの動画のために書いたものです。
- **本物のもの**
  - **EC-CUBE の画面はすべて本物** です。この PC の上で動かした **EC-CUBE 4.3.1-p1**（公式の配布物。PHP 8.3 の WebAssembly 版で実行、
    データベースは SQLite）に、ショップの公開データとこの動画のプラグインを入れ、動画と同じ操作を実際に行って取り込みました
    （`tools/snapshots/ec-l-meal-payment/capture-ec.js`、`tools/eccube/`）。
    - 管理画面：支払方法一覧・支払方法の編集（GMO後払いの手数料・利用条件を実際に保存）・プラグイン一覧・配送方法の編集（取扱支払方法を実際に保存）・
      受注一覧・受注登録（対応状況・入金日・ショップ用メモ）・メール通知
    - ショップ（開発環境の EC-CUBE の標準テーマ）：商品詳細・カート・ご注文手続き（カード情報の入力欄）・ご注文内容の確認・購入エラー・ご注文完了
  - **動画で入力するコードは、実際に動かしたコード** です（`js/payment-src.js`）：プラグイン `app/Plugin/LmealPayment`
    （`PluginManager`・`Service/Method/CreditCard`（`PaymentMethodInterface` の verify / apply / checkout）・`Service/CardGateway`・
    `Form/Extension/OrderTypeExtension`・`LmealPaymentEvent`（TemplateEvent）・Twig・テスト用のトークン JS・`FreezerRentalPaymentValidator`（PurchaseFlow））。
    VS Code に出るファイルと、取り込みのときに EC-CUBE に書き込んで `bin/console eccube:plugin:install` / `eccube:plugin:enable` で
    インストール・有効化したファイルは同じソースです。ターミナルの `bin/console` の出力・ログの行も、そのとき EC-CUBE が実際に出したものです
  - **テスト注文と購入エラー**：最初の版では「注文する」で購入エラー（「カード情報（トークン）がありません。」）になります。EC-CUBE の
    注文処理（`ShoppingController::checkout()`）はフォームを `skip_add_form` で作り、確認画面のフォームは `_token` しか送らないためで、
    確認画面にトークンを送り直すスニペットを足すと注文が完了し、受注は「入金済み」・入金日・取引 ID（ショップ用メモ）になります。
    冷凍庫レンタル＋GMO後払いの警告、8回まとめ買い 20食（63,200 円）で GMO後払いが選べない（利用条件 55,000 円）のも、EC-CUBE が実際に出した画面です
  - EC-CUBE 本体のファイル（`PaymentMethodInterface.php`・`Cash.php`・`ShoppingController.php`・`composer.json`）は同じ版からそのまま表示しています（`js/eccube-core.js`）
  - **ショップのデータは公開ページから**（__FETCHED__ 取得、`tools/snapshots/ec-l-meal-payment/scrape-shop.js`）：ショップ名・会社情報と
    特定商取引法に基づく表記（販売業者・所在地・電話番号・メールアドレス・送料・支払方法）、MENU のカテゴリ（ショップ自身の ID：牛肉・豚肉・鶏肉・魚介・その他）と
    20 品（商品名・説明・メニュー詳細・栄養価・写真・「糖質15g基準」などの種類）、プラン（スタートプラン 7食 3,640 円・10食 5,100 円・初回限定 10食 1,900 円・
    20食 9,800 円・8回まとめ買い 10食 34,188 円 / 20食 63,200 円）と冷凍庫無料レンタル、送料（980 円・沖縄県 1,480 円）、
    支払方法とその条件（GMO後払いの手数料 0 円・ご利用限度額 55,000 円、冷凍庫レンタルはクレジットカードのみ）
  - 公開中のショップの画面（特定商取引法に基づく表記・よくある質問・プランの選択）は、l-meal.com の公開ページを取り込んだものです（`npm run snapshot -- ec-l-meal-payment`）
- **再現のもの**
  - **決済代行会社の側** はすべて再現です。代行会社の管理画面・API・トークン JS は契約とログインが必要なため使っていません（どこにもログインしていません）。
    プラグインのテストモード（`LMEAL_PAYMENT_MODE=sandbox`）では、`CardGateway` が代行会社に接続せずに決まった応答を返し、
    `token-sandbox.js` がブラウザの中でテスト用のトークンを作ります。本番用の接続（`CardGateway::request()`）は一般的な REST の形で書いた再現です。
    カード番号は公開されているテスト用の番号（4111 1111 1111 1111）だけを使っています
  - 実際のショップのカード決済の代行会社・GMO後払いの審査連携・Amazon Pay・定期便（お得便）の仕組みは扱っていません。開発環境の GMO後払いは
    EC-CUBE 標準の支払方法として登録したもの、プランは EC-CUBE の通常の商品として登録したものです（ショップの実際の商品・定期便の構成は公開されていません）。
    食品の税率 8%（商品別税率）は、公開中の税込価格になるように端数を「切り上げ」にしています
  - 開発環境の画面は EC-CUBE 4.3 の標準テーマです（ショップのテーマのソースは公開されていないため）。EC-CUBE 4.3 に同梱のプラグイン（Amazon Pay・クーポンなど）は外しています
  - 依頼の内容（EC チームの依頼書）、作業の順序、購入エラーのミス、テストのお客様（テスト 花子・架空。画面ではぼかし）、
    開発環境の構成（Docker・localhost:8080）、git・本番サーバーへの反映（`deploy.sh`）とその出力は再現です
  - 画面の日付・時刻：取り込みの日時（__CAPTURED__）は画面の日付（2026-09-24）と時計に置き換えています（`tools/eccube/capture.js`）
- **ローカルで見るためのもの** です。実在の企業のサイト・ロゴ・商品を含むため、公開はしないでください。

## 再生される内容

| チャプター | 内容 |
| --- | --- |
| 依頼・現状確認 | 依頼書、公開中の特定商取引法に基づく表記（クレジットカード・GMO後払い・Amazon Pay、後払いの限度額 55,000 円）、開発環境の支払方法一覧（GMO後払いだけ） |
| 支払方法設定（後払い） | GMO後払いの手数料 330 円 → 0 円、利用条件の上限 55,000 円 |
| カード決済プラグイン | `PaymentMethodInterface` と `ShoppingController`（method_class のサービスを呼ぶ）を読む → `LmealPayment`：PluginManager（支払方法の登録）・CreditCard（verify / apply / checkout）・CardGateway（テストモード）・トークンの項目・カード情報の入力欄 |
| インストール・配送方法 | `bin/console eccube:plugin:install` / `enable` → プラグイン一覧・支払方法一覧 → 配送方法の取扱支払方法にチェック |
| テスト注文 | 10食プラン → ご注文手続きでクレジットカード決済 → テスト用のカード番号 → 確認 → 購入エラー → ログと `skip_add_form` → 確認画面にトークン → ご注文完了 |
| 受注管理・メール | 受注一覧（入金済み）、受注登録（入金日・ショップ用メモの取引 ID）、メール通知（お支払い完了の案内） |
| 支払方法ごとの条件 | 公開中の FAQ（冷凍庫レンタルはクレジットカードのみ）→ PurchaseFlow のバリデーター → 冷凍庫＋GMO後払いの警告・カードなら注文できる → 8回まとめ買い 20食では GMO後払いが出ない → 受注一覧（入金済み / 新規受付） |
| 本番へ反映 | git・本番サーバーでプラグインのインストール・有効化（本番モード）→ 公開中のプランの選択 |

## EC-CUBE の画面について

- EC-CUBE 4.3.1-p1 は `../eccube-local/inst/ec-l-meal-payment/` に作るこの動画専用のコピーで、ログインはそのコピーの admin / password と
  テストのお客様だけです（実在のショップの管理画面・アカウント、決済代行会社、EC-CUBE オーナーズストアには一切ログインしていません）
- 画面は EC-CUBE 自身のスクリプトが動いた後の HTML とスタイルシート・画像をそのまま取り込み、アドレスは開発環境の `http://localhost:8080` に置き換えています
- 取り込みのやり直し：`tools/snapshots/ec-l-meal-payment/NOTES.md`

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `public/videos/ec-l-meal-payment/js/scenario.js` | 台本 |
| `public/videos/ec-l-meal-payment/js/payment-src.js` | 動画で書くプラグインのコード（取り込みでも同じものを EC-CUBE に書き込む） |
| `public/videos/ec-l-meal-payment/js/ec-snapshot.js`・`assets/ec/` | 本物の EC-CUBE 4.3 の画面（生成） |
| `public/videos/ec-l-meal-payment/js/eccube-core.js` | EC-CUBE 本体のファイル（生成、`build-core.js`） |
| `public/videos/ec-l-meal-payment/js/site-snapshot.js` | 公開中のショップ（生成） |
| `public/videos/ec-l-meal-payment/js/files.js`・`apps.js` | VS Code のプロジェクト、EC-CUBE の画面の表示・ぼかし |
| `tools/snapshots/ec-l-meal-payment/` | 公開データの取得・EC-CUBE での取り込み・作業メモ |
