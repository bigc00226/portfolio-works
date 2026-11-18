# 制作プロセス デモ — 呉竹 BtoBオンライン注文サイト（order.kuretake.co.jp）EC-CUBE 4 BtoB 機能の構築

> 一覧ページ（`/`）と再生ページ（`/watch/ec-kuretake-btob`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-kuretake-btob/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）＋ VS Code ＋ Chrome で、長さは約 9 分 52 秒、画面上の日付は 2026/10/01（10:04〜）です。

画面録画用のデモページです。書道用品・筆ぺんのメーカー 呉竹の取引先専用の注文サイト（https://order.kuretake.co.jp 、EC-CUBE 4）に、
**BtoB の機能（取引先情報・承認制の会員登録・掛率の卸価格・発注単位・掛け払い）** を開発環境の EC-CUBE 4.3 で組み込み、本番へ反映するまでを再生します。

**依頼・現状確認 → 取引先情報（エンティティ拡張）→ 会員登録の承認制 → 取引先別の卸価格 → 発注単位 → 掛け払い（請求書払い）→ 受注管理 → 本番へ反映 → 公開中のサイト**

## 最初に確認していただきたいこと

- order.kuretake.co.jp は **EC-CUBE 4 で運営されている実在の BtoB 注文サイト**（株式会社呉竹）です。このデモは「EC-CUBE 4.3 で、このサイトにある BtoB の仕組みを組み込む」としたらどう進めるか、という **工程の再現** です。実際の制作の記録ではなく、本番のソースコード・管理画面も公開されていないため見ていません。
- **本物のもの**
  - **EC-CUBE の画面はすべて本物の EC-CUBE 4.3.1-p1** です。この PC の上で、公式の EC-CUBE 4.3.1-p1 を PHP 8.3（WebAssembly 版、`@php-wasm/node`）と SQLite で動かし（`tools/eccube/runtime.js`）、
    動画で行う操作を実際に行って取り込んだ 50 画面です（`tools/snapshots/ec-kuretake-btob/capture-ec.js` → `js/ec-snapshot.js`・`assets/ec/`）。管理画面（商品一覧・商品登録・会員一覧・会員登録・基本設定・支払方法設定・配送方法設定・受注一覧・受注登録）と、開発環境のショップ（商品一覧・商品詳細・カート・新規会員登録・ログイン・ご注文手続き）です。
  - **動画で入力するコード・テンプレート・YAML は、EC-CUBE で実際に動いているもの** です。`js/b2b-src.js` の PHP（`app/Customize` の Trait・FormExtension・EventSubscriber・Doctrine のイベント・PurchaseFlow のバリデーター）、
    EC-CUBE 4.3.1-p1 自身のテンプレートをコピーして行を足した Twig（`app/template/default/Product/detail.twig`・`list.twig`・`Entry/complete.twig`・`Mail/entry_confirm*.twig`）、`messages.ja.yaml`、`customize.css` を、
    取り込みのときに動画と同じ順にローカルの EC-CUBE へ書き込み、`bin/console eccube:generate:proxies`・`doctrine:schema:update`・`cache:clear` を実際に実行して、その都度の画面を取り込んでいます。ターミナルに出す `eccube:generate:proxies`・`doctrine:schema:update`（SQL）・ログの行・`dbal:run-sql` の結果も、そのとき EC-CUBE が出したものです（パスだけ Docker の `/var/www/html` に、日付だけ動画の日付に）。
    - 管理画面の操作（商品の発注単位・仮会員機能・取引先の承認・支払方法「掛け払い（請求書払い）」の追加・配送方法の取扱支払方法・販売価格の修正）は、本物のフォームで実際に入力・保存しました。
    - 新規会員登録・ログイン・カート・ご注文手続きも本物のフォーム送信です：仮会員のままではログインできない、承認後はログインできて卸価格が出る、3 個でカートに入れると 10 個になる、掛け払いは承認済みの取引先にだけ出る、注文が受注管理に入る — いずれも EC-CUBE が実際にそう動いた画面です。
    - 2 つのミスも実際に起きたものです：卸価格の 1 回目のコード（Doctrine の postLoad で価格を書き換えただけ）では、取引先がカートを開いたときの flush で商品マスタの販売価格が卸価格で上書きされた（管理画面の商品一覧と `dbal:run-sql` の結果）→ `UnitOfWork::setOriginalEntityProperty()` で修正し、販売価格を管理画面で戻しました。掛け払いを追加しても配送方法の取扱支払方法に入れていないとご注文手続きに出ない → 配送方法設定で追加。
  - 開発環境のデータは、公開中のサイトの公開ページから取り込んだものです：ショップ名・会社の所在地・特定商取引法に基づく表記（代表者名を除く）、カテゴリ（トップの 19 カテゴリと 5 つのサブカテゴリ。ID と並びは本番と同じ）、
    29 商品（商品 ID・品番・商品名・型／色・定価（税抜）・商品特徴・サイズ・素材・JAN・画像。発注単位も本番の表示どおり：墨 1 個、墨滴・筆ぺん 10 個、半紙 10 / 25 個）、2026 年 9 月までのお知らせ 3 件。
    キャラクター商品と詰め合わせセットは外しました。取り込みは公開ページの閲覧だけで、ログイン・会員登録・フォームの送信はしていません（`tools/snapshots/ec-kuretake-btob/scrape-shop.js`、2026-11-18 取得）。
  - 最初と最後の公開中のサイト（https://order.kuretake.co.jp のトップ・商品一覧（墨滴）・商品詳細（清書用墨滴）・ログイン・新規会員登録のご案内）は、公開ページをそのまま取り込んだものです（`npm run snapshot -- ec-kuretake-btob`、2026-11-18 取得）。営業日カレンダー（2026 年 11・12 月）とトップの新着情報（2026 年 10・11 月）は画面の日付（2026/10/01）より後の内容のため、取り込みから外しています（`js/config.js` の `remove`）。
- **再現のもの**
  - 作業の順序・依頼の文面・2 つのミス。本番サイトの BtoB 機能が実際にどう作られているか（取引先ごとの価格の決め方・承認の流れ・支払方法の条件）は公開されていないため、公開ページの表示（定価・発注単位・仮登録→本登録・個別契約の支払方法）から、EC-CUBE 4 の標準的な拡張方法で作り直したものです。掛率（60%・65% など）は架空の値です。
  - 取引先（会員）・注文はすべて架空のテスト用のもの（会社名に「（テスト）」、メールは example.com）で、担当者名・住所・電話番号・メールアドレスはぼかしています。送料（0 円）・支払方法（銀行振込・掛け払い）・配送方法（佐川急便）の設定も、公開の表記をもとにした開発環境の値です。
  - 開発環境の URL（http://localhost:8080 、Docker）、プロジェクトのフォルダー（C:\dev\kuretake-b2b）、`.env` の値、git・ssh・本番サーバーのターミナルの出力は再現です。メールは送っていません（EC-CUBE の MailService が送信し、ログに残った行だけを表示）。
  - 取り込みに使った EC-CUBE は使い捨てのローカルのコピーで、ログインはそのコピー専用の admin / password と、そのコピーで作ったテスト用の取引先だけです（実在のサイトの管理画面・取引先アカウント・オーナーズストアには一切ログインしていません）。
- 呉竹 BtoBオンライン注文サイトは実在のサイトです。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 依頼・現状確認 | VS Code ＋ Chrome（公開中のサイト・localhost:8080・管理画面） | 依頼（取引先情報・承認制・卸価格・発注単位・掛け払い）、公開中のサイト（定価・発注単位・仮登録→本登録の案内）、標準のままの開発環境（誰でもカートに入れられる）、会員一覧 | |
| 2 取引先情報 | VS Code ＋ ターミナル ＋ 管理画面 | `CustomerTrait`（取引先コード・業界・掛率・掛け払い）・`ProductTrait`（発注単位）・管理画面の FormExtension（auto_render）→ `eccube:generate:proxies`・`doctrine:schema:update` → 会員登録に取引先情報、商品登録で発注単位 10 | |
| 3 会員登録の承認制 | 管理画面 ＋ VS Code ＋ ショップ | 基本設定で仮会員機能を有効に、`EntryTypeExtension`（会社名必須）、`CustomerApprovalSubscriber`（本登録 URL を無効・本会員にしたら本登録完了メール）、仮登録の画面とメールの文面 → テスト用の取引先で新規会員登録 → 仮会員はログインできない → 管理画面で取引先情報を入れて本会員に（ログに本登録完了メール） | |
| 4 取引先別の卸価格 | VS Code ＋ ショップ ＋ 管理画面 ＋ ターミナル | `WholesalePriceSubscriber`（定価 × 掛率）、`MemberOnlyOrderSubscriber`（カート・ご注文はログイン必須）、商品詳細・一覧のテンプレート、「通常価格」→「定価」（翻訳 YAML）→ 未ログインは定価だけ・ログインすると卸価格 → カート | **商品マスタの価格が変わった**：flush で卸価格が保存された → `setOriginalEntityProperty()` で修正、販売価格を戻す |
| 5 発注単位 | VS Code ＋ ショップ | `OrderUnitValidator`（@CartFlow）→ 美文字筆ぺん 中字を 3 個でカートに入れると「10 個単位」のお知らせと数量 10 | |
| 6 掛け払い | 管理画面 ＋ VS Code ＋ ショップ | 支払方法「掛け払い（請求書払い）」を追加、`OrderTypeExtension`（承認済みの取引先だけ）→ ご注文手続き → 確認 → 完了。掛け払い不可の取引先には出ない | **掛け払いが出ない**：配送方法の取扱支払方法に入っていない → 配送方法設定で追加 |
| 7 受注管理 | 管理画面 | 受注一覧・受注登録（会社名・掛け払い・卸価格の明細） | |
| 8 本番へ反映 | ターミナル | git、本番サーバーで `eccube:generate:proxies`・`cache:clear`・`doctrine:schema:update --force`、本番の管理画面での設定（仮会員機能・支払方法・配送方法） | |
| 公開中のサイト | Chrome | 商品詳細（清書用墨滴）・取引先のログイン | |

### 日本語入力（Microsoft IME と同じ流れ）

会社名・担当者名、支払方法名、テンプレートに書く日本語（卸価格・発注単位・ログインして注文する）、翻訳 YAML、PHP のメッセージ・コメント、コミットメッセージは、ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。英数字は IME をオフにして入力し、画面下に押したキーを表示します。

## 取り込み直すとき

```
node tools/snapshots/ec-kuretake-btob/scrape-shop.js                       # 公開ページのデータ（shop-data.json・商品画像）
node tools/snapshots/ec-kuretake-btob/build-core.js                        # EC-CUBE 4.3.1-p1 のテンプレート（js/eccube-core.js）
node tools/snapshots/ec-kuretake-btob/capture-ec.js --shots=<フォルダー>    # 本物の EC-CUBE の画面（15〜25 分）
node tools/webp.js ec-kuretake-btob
npm run snapshot -- ec-kuretake-btob                                       # 公開中のサイト
npm run verify -- ec-kuretake-btob ; npm run check -- ec-kuretake-btob ; npm run pointer -- ec-kuretake-btob ; npm run timeline -- ec-kuretake-btob
```

- EC-CUBE のコピー（`../eccube-local/inst/ec-kuretake-btob`）は取り込みのたびに作り直します。商品画像は `../eccube-local/data/ec-kuretake-btob/save_image`、ショップのデータは `tools/snapshots/ec-kuretake-btob/shop-data.json` にあります。
- 動画のコードのソースは `js/b2b-src.js` の 1 か所で、取り込みも同じファイルを読みます（ソースを変えたら取り込み直してください）。
