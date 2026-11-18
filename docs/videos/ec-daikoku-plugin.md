# 制作プロセス デモ — あみだ池大黒オンラインショップ（www.daikoku.ne.jp/shop）EC-CUBE 4 専用プラグイン開発（ギフトのし）

> 一覧ページ（`/`）と再生ページ（`/watch/ec-daikoku-plugin`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-daikoku-plugin/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは `generated/timeline.json` のとおりです（`npm run timeline -- ec-daikoku-plugin`）。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
創業 1805 年・大阪銘菓「おこし」の株式会社あみだ池大黒のオンラインショップ（https://www.daikoku.ne.jp/shop/、EC-CUBE 4。
トップの www.daikoku.ne.jp は WordPress）に、**のし指定の専用プラグイン「DaikokuGift」を開発して入れるまでの工程** を順番に再生します。

**依頼・現状確認 → eccube:plugin:generate で雛形 → エンティティと管理画面（独自メニュー・基本設定・表書き一覧）→ インストール・有効化 →
トレイト・FormTypeExtension・TemplateEvent で注文手続きに のし（プロキシ未生成のシステムエラーを修正）→ テスト注文・受注登録・注文メール →
無効化・有効化と配送CSV → zip にまとめて削除・独自プラグインのアップロードで入れ直し、本番へ**

画面の日付は 2026/11/03（火）10:12〜。

## 最初に確認していただきたいこと

- www.daikoku.ne.jp/shop は **EC-CUBE 4 で運営されている実在のショップ** です（株式会社あみだ池大黒。テーマ「amidaike」）。
  このデモは「このショップ専用の のし指定プラグインを EC-CUBE 4.3 で作る」としたらどう進めるか、という **工程の再現** で、実際の開発の記録ではありません。
  ショップの実際のソースコード・管理画面は公開されていないため、プラグインのコードはこの動画のために書いたものです。
- 題材は公開ページから選びました：商品ページの「<のし対応について> 包装商品のため、熨斗はご指定がない限り「外のし」となります。
  「内のし」をご希望の場合は備考欄にご記入ください。」と、のし対応の商品に付く「のし設定」のアイコン（テーマの `icon_noshi_pc.png`）。
- **本物のもの**
  - **EC-CUBE の画面はすべて本物** です。この PC の上で動かした **EC-CUBE 4.3.1-p1**（公式の配布物。PHP 8.3 の WebAssembly 版で実行、
    データベースは SQLite）に、ショップの公開データとこの動画のプラグインを入れ、動画と同じ操作を実際に行って取り込みました
    （`tools/snapshots/ec-daikoku-plugin/capture-ec.js`、`tools/eccube/`）。
    - 管理画面：受注登録（お問い合わせ欄の のし の依頼）・プラグイン一覧（有効 / 無効 / 削除の確認 / 削除後）・独自プラグインのアップロード・
      プラグインの「のし・ギフト」メニュー（基本設定を実際に保存、表書き一覧に「御年賀」を実際に登録）・商品登録（のし対応を実際に保存）・
      受注登録（お届け先の のし）・メール通知（注文受付メールの のし の行）・CSV出力項目設定（配送CSV）・受注一覧
    - ショップ（開発環境の EC-CUBE の標準テーマ）：ご注文手続き（変更前・のし欄・表書きの入力エラー・無効化中・入れ直した後）・システムエラー・
      ご注文内容のご確認・ご注文完了
  - **動画で入力するコードは、実際に動かしたコード** です（`js/gift-src.js`）。雛形は取り込みのときに `bin/console eccube:plugin:generate` が
    実際に作ったもので（`gift-src.js` の SCAFFOLD と一致することを取り込みで確認）、その上に動画と同じ順序でファイルを書き込み、
    `eccube:plugin:install` / `enable`・`eccube:generate:proxies`・`doctrine:schema:update`・管理画面の無効化 / 有効化 / 削除 / アップロードを実際に行いました。
    - プラグインの構成：`composer.json`・`PluginManager`（有効化で設定と表書きの初期データ、配送CSV の項目の登録 / 削除）・`Nav`（管理画面の独自メニュー）・
      `Entity/Config`・`Entity/NoshiTitle`（`plg_daikoku_gift_*` のテーブル）・`Entity/ProductTrait`（のし対応、`@FormAppend` で商品登録に入力欄）・
      `Entity/ShippingTrait`（お届け先の のし：種類・表書き・名入れ）・`Form/Extension/ShippingTypeExtension`（注文手続きと受注登録のフォーム、表書きの入力チェック）・
      `Event`（TemplateEvent：注文手続き・確認画面・受注登録・注文受付メール）・Controller / FormType / Twig・翻訳（`messages.ja.yaml`）
    - ターミナルの `bin/console` の出力（雛形の作成・インストール・有効化・プロキシの生成・スキーマの更新）、EC-CUBE のログの行、配送CSV の中身、
      zip の中身の一覧は、そのとき実際に出たものです
  - **システムエラー**：プラグインをインストールした後でトレイトを足したため、`Shipping` のプロキシ（`app/proxy/entity`）に のし の項目がなく、
    注文手続きが実際にシステムエラーになります（ログは `NoSuchPropertyException`）。`eccube:generate:proxies` と `doctrine:schema:update` で直ります
  - **無効化・削除の動き**：無効化すると注文手続きの のし欄は消え、受注の のし（`dtb_shipping` の列）は残る（有効化し直した後の配送CSV に出る）。
    削除するとプラグインのフォルダーと `plg_` のテーブルに加え、トレイトで足した列（`dtb_product.daikoku_noshi_enabled`・`dtb_shipping.daikoku_noshi_*`）も消え、
    入れ直すと表書きは初期の 6 件に戻り（追加した「御年賀」は消える）、商品の のし対応は未設定に戻る——いずれも EC-CUBE が実際にそうなった画面・データです
    （取り込みで削除後のテーブルと列を確認）。動画ではこのあと 12 商品の のし対応を設定し直してから注文手続きを確認します（設定し直しは取り込みのスクリプトで DB に入れたもの）
  - **zip**：`tools/snapshots/ec-daikoku-plugin/DaikokuGift-1.0.0.zip`（雛形の `release.yml` と同じく `.github` を除いた、プラグインのフォルダーの中身）。
    この zip を管理画面の「独自プラグインのアップロード」で実際にインストールし、展開されたファイルがソースと一致することを確認しました
  - EC-CUBE 本体のファイル（注文手続きの `Shopping/index.twig`・`TemplateEvent.php`・`Shopping/ShippingType.php`・`PluginService.php`・`composer.json`）は同じ版からそのまま表示しています（`js/eccube-core.js`）
  - **ショップのデータは公開ページから**（2026-11-18 取得、`tools/snapshots/ec-daikoku-plugin/scrape-shop.js`）：ショップ名・会社名・所在地・電話番号・メールアドレス、
    カテゴリ（ショップ自身の ID：あみだ池大黒のお菓子・進物用おこし・大阪花ラング・大阪もちまろ菓・手提げ袋）、18 商品（商品名・税込価格・商品コード・説明・
    箱サイズ / 内容量 / 賞味期限などの表・写真）と、のし対応の商品（「のし設定」アイコンのある 12 商品）、送料（ヤマト運輸の地域別・7,000 円以上で無料）
  - 公開中のショップの画面（商品ページ 2 つ・ご利用ガイド）は、www.daikoku.ne.jp/shop の公開ページを取り込んだものです（`npm run snapshot -- ec-daikoku-plugin`）
- **再現のもの**
  - 依頼の内容（EC チームの依頼書）、作業の順序、システムエラーのミス、テストのお客様（テスト 太郎・架空。画面ではぼかし）と名入れ「田中」、
    開発環境の構成（Docker・localhost:8080）、git・本番サーバーへの反映（`scp`・`ssh` の `bin/console eccube:plugin:install --path=…`）とその出力は再現です
    （本番の出力は、開発環境で実際に出たインストール・有効化の行を使っています）
  - 開発環境の画面は EC-CUBE 4.3 の標準テーマです（ショップのテーマのソースは公開されていないため）。EC-CUBE 4.3 に同梱のプラグインは外しています。
    支払方法は銀行振込・代金引換（200 円）だけを入れています（カード・後払い・PayPay・Amazon Pay は扱っていません）
  - ショップに実際にある紙バッグの選択（商品ページの「紙バッグ（無料）」）・包装紙のブランド別の対応は扱っていません
  - 画面の日付・時刻：取り込みの日時（2026-11-18）は画面の日付（2026-11-03）と時計に置き換えています（`tools/eccube/capture.js`）
- **ローカルで見るためのもの** です。実在の企業のサイト・ロゴ・商品を含むため、公開はしないでください。

## 再生される内容

| チャプター | 内容 |
| --- | --- |
| 依頼・現状確認 | 依頼書、公開中の商品ページ（のし は備考欄に・のし設定のアイコン）、開発環境の注文手続き（お問い合わせ欄に のし を書く）と受注登録 |
| プラグインの雛形 | `bin/console eccube:plugin:generate "あみだ池大黒 ギフトのし" DaikokuGift 1.0.0`、できたファイル（composer.json・Entity/Config ほか） |
| データと管理画面のコード | Config（受付・名入れの文字数・案内）・NoshiTitle（表書きと水引）・PluginManager（初期データ）・Nav（のし・ギフト）・Controller / Form / Twig・翻訳 |
| インストール・管理画面 | `eccube:plugin:install` / `enable` → プラグイン一覧・独自メニュー → 基本設定（案内文）→ 表書き一覧（御年賀を追加） |
| 注文手続きの のし指定 | ProductTrait（@FormAppend）・ShippingTrait・ShippingTypeExtension・Event（TemplateEvent）・Twig → システムエラー → ログ → `eccube:generate:proxies`・`doctrine:schema:update` → 商品登録で のし対応 |
| テスト注文・受注・メール | 注文手続きの のし欄 → 表書きの入力エラー → 外のし・御歳暮・田中 → 確認 → 完了 → 受注登録とメール通知に のし |
| 無効化・有効化と配送CSV | PluginManager に配送CSV の項目 → 無効化（注文手続きから消える）→ 有効化 → CSV出力項目設定 → 配送CSV（Shift_JIS）に のし |
| パッケージ・本番反映 | zip（.github を除く）→ 無効化・削除 → 独自プラグインのアップロード → 有効化 → 表書きは初期データに・商品の のし対応も未設定に（削除は列まで消す）→ 設定し直して注文手続き → 本番（再現）→ 公開中の進物用おこし |

## EC-CUBE の画面について

- EC-CUBE 4.3.1-p1 は `../eccube-local/inst/ec-daikoku-plugin/` に作るこの動画専用のコピーで、ログインはそのコピーの admin / password と
  テストのお客様だけです（実在のショップの管理画面・アカウント、EC-CUBE オーナーズストアには一切ログインしていません）
- 画面は EC-CUBE 自身のスクリプトが動いた後の HTML とスタイルシート・画像をそのまま取り込み、アドレスは開発環境の `http://localhost:8080` に置き換えています
- WebAssembly 版の PHP ではサブプロセスを起動できないため、`eccube:plugin:install` / `enable` が最後に起動する `cache:clear` は別に実行し、
  その出力をコマンドの出力の該当箇所につないでいます（インストール・有効化そのものは EC-CUBE のコマンドが実際に行ったもの）
- 管理画面のプラグインの無効化・有効化・アップロードでは、EC-CUBE がプロキシを作り直すときの「gen -> …」の行（コンソール出力）が WebAssembly 版の PHP では
  レスポンスに混ざり、リダイレクトのページで止まります。取り込みでは、ブラウザがリダイレクトしたときと同じくプラグイン一覧を開き直して取り込んでいます
  （操作そのものは EC-CUBE が実際に行ったもの。通常の PHP-FPM / Apache ではこの行は画面に出ません）。そのとき残る自動メンテナンスモードのファイルは、
  通常はリクエストの終わりに EC-CUBE が消すものなので、取り込みで消してからサーバーを再起動しています（そのため無効化・有効化の完了メッセージは画面に出ません）
- 取り込みのやり直し：`tools/snapshots/ec-daikoku-plugin/NOTES.md`

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `public/videos/ec-daikoku-plugin/js/scenario.js` | 台本 |
| `public/videos/ec-daikoku-plugin/js/gift-src.js` | 動画で書くプラグインのコード（取り込みでも同じものを EC-CUBE に書き込む。雛形の出力も） |
| `public/videos/ec-daikoku-plugin/js/ec-snapshot.js`・`assets/ec/` | 本物の EC-CUBE 4.3 の画面（生成） |
| `public/videos/ec-daikoku-plugin/js/eccube-core.js` | EC-CUBE 本体のファイル（生成、`build-core.js`） |
| `public/videos/ec-daikoku-plugin/js/site-snapshot.js` | 公開中のショップ（生成） |
| `public/videos/ec-daikoku-plugin/js/files.js`・`apps.js` | VS Code のプロジェクト、EC-CUBE の画面の表示・ぼかし・選択 |
| `tools/snapshots/ec-daikoku-plugin/` | 公開データの取得・EC-CUBE での取り込み・作業メモ・`DaikokuGift-1.0.0.zip` |
