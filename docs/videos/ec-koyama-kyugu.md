# 制作プロセス デモ — 小山弓具 公式オンラインショップ（www.koyama-kyugu.com）EC-CUBE 4 既存 EC サイトの機能改修

> 一覧ページ（`/`）と再生ページ（`/watch/ec-koyama-kyugu`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-koyama-kyugu/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 7 分 49 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
弓道具の専門店 小山弓具の公式オンラインショップ（https://www.koyama-kyugu.com/、EC-CUBE 4）に **2 つの機能を追加する工程** を順番に再生します。

1. **受注生産・在庫の表示**：商品に「受注生産」「納期の目安」を持たせ（エンティティ拡張）、商品登録で入力し（FormType 拡張）、
   商品ページの価格の下に「受注生産　納期 約1年」「残りわずか」「在庫あり」を出す（Twig 拡張・テンプレート）
2. **送料無料の条件**：ご購入ガイドの「お買い上げ 15,000 円以上で送料無料（矢各種・矢筒のいずれかを含む場合は 55,000 円以上）」を、
   ご注文手続きの送料（PurchaseFlow のプロセッサー）とカートの「あと○円で送料無料」（EventSubscriber）で計算する

**依頼・現状確認 → 開発環境 → 受注生産：エンティティ拡張 → 管理画面：商品登録 → 商品ページ：在庫・納期の表示 → 送料無料の条件：PurchaseFlow → カートの表示・テスト注文 → 本番へ反映**

## 最初に確認していただきたいこと

- www.koyama-kyugu.com は **EC-CUBE 4 で運営されている実在のショップ** です（株式会社小山弓具）。このデモは「このショップに 2 つの改修をする」としたら
  どう進めるか、という **工程の再現** で、実際の開発の記録ではありません。ショップのソースコード・管理画面・実際の運用は公開されていません。
- **本物のもの**
  - **EC-CUBE の画面はすべて本物の EC-CUBE 4.3.1-p1** です。この PC の上で EC-CUBE 4.3.1-p1（公式の配布物）を PHP 8.3（WebAssembly）と SQLite で動かし
    （`tools/eccube/runtime.js`）、動画で行う操作を実際に行って取り込んだ 18 画面です（下の「EC-CUBE の画面について」）。
    管理画面（ログイン・ホーム・商品一覧・基本設定・商品登録・受注一覧・受注登録）と、開発環境のショップの画面（商品ページ・カート・ご注文手続き・確認・完了・システムエラー）。
  - **カスタマイズは本当に動く EC-CUBE 4 のコード** です（`js/customize-src.js`：`app/Customize` の 6 ファイル・テンプレートの差分・CSS）。VS Code で入力するコードと、
    取り込みのときに EC-CUBE に入れて動かしたコードは **同じソース** です。`eccube:generate:proxies`・`doctrine:schema:update`・`cache:clear` も実際に実行し、
    その後の画面はそのコードで EC-CUBE が実際に出したものです。
    - スキーマの更新を忘れたときの「システムエラー」の画面、ログの `no such column: made_to_order`、`--dump-sql` の SQL（`ALTER TABLE dtb_product ADD COLUMN …`）、
      プロキシ生成の出力は、EC-CUBE が実際に出したものです（日時とパスだけ動画の環境に合わせています）。
    - 商品登録の「受注生産」「納期の目安」は、FormType 拡張の `auto_render` で EC-CUBE 自身が描いた入力欄で、実際にオンにして「約1年」で登録した結果の画面です。
    - 商品ページのバッジは Twig 拡張 `stock_badge()` の実際の出力、カートの「あと 32,600 円」・ご注文手続きの送料 1,980 円・受注登録の送料は、
      プロセッサーと EventSubscriber で EC-CUBE が実際に計算した値です（テスト注文も実際に注文しています）。
  - **ショップのデータ**：公開ページ（2026-11-18 取得）から、カテゴリ（71 件、公開中の ID のまま）・21 商品（商品 ID・商品名・規格と価格・説明文・画像・
    送料サイズの表示「送料A / 送料C1 / メール便対応 …」をタグで）・特定商取引法に基づく表記（会社名・所在地・電話）・ご購入ガイドの配送料金（C サイズの列を
    ヤマト運輸の都道府県別送料に）・送料無料 15,000 円・支払方法（郵便振替・銀行振込）をローカルの EC-CUBE に入れています（`tools/snapshots/ec-koyama-kyugu/scrape-shop.js`）。
  - **ショップのテーマ**：公開中の商品ページの HTML から作り直したテーマです（`build-theme.js`）。`#wrapper`・ヘッダー（スマホ用メニューを含む）・PC のサイドバー（カテゴリ・検索・総合窓口）・フッター・
    商品ページのマークアップ（`.detailWrap` …）と、スタイルシート・画像（`/html/template/default/assets/project/…`、ショップのものをそのまま）は公開中のものです。
    Twig のソースそのものは公開されていないため、同じ HTML を出すように書いたものです。カート・ご注文手続きの画面は EC-CUBE 4.3 の標準のテンプレートです。
    価格の下の説明（付属品・弓保証など。公開ページの `p.detail04`）は商品の「フリーエリア」に入れ、バッジはその上の新しい要素（`p.stockBadges`）に出しています。
  - ブラウザに出る **公開中のショップ**（商品ページ・ご購入ガイド、PC 幅 1920px）は 2026-11-18 に取り込んだ本番の画面です（`js/site-snapshot.js`・`assets/site/`）。
  - EC-CUBE 4.3.1-p1 に同梱の未インストールのプラグイン（dtb_plugin の 11 件）は、ショップのコピーにはないものとして登録を外しています（`doctrine:schema:update` がそのプラグインの列まで出力するため）。
  - EC-CUBE 4.3.1-p1 の `docker-compose.yml`（ポート 8080・SQLite）・`composer.json` は配布物のものです（開発環境を本番と同じ prod モードにした 2 行だけ変更）。
- **再現のもの**
  - **依頼の内容と作業の順番**、**スキーマの更新を忘れるミス**（実際に起きる動きですが、実際の開発でこのミスがあったわけではありません）。
    README の「改修の依頼」は動画のために書いたもので、ショップの実際の運用（受注後の送料の扱いなど）を表すものではありません。
  - **在庫数**：公開ページは「在庫あり / 品切れ」しか分からないため、在庫数（三ツカケ 2 点など）は架空です。品切れの商品（アルミ矢など）は品切れのままです。
  - 公開中のショップが使っている有料のプラグイン（商品オプションの「矢尺」「袴ネーム刺繍」）・クレジットカード / コンビニ決済は入れていません
    （商品オプションは公開されていない有料品、決済はアカウントが必要なため）。サイズ別（A〜D）の送料も EC-CUBE の標準にないため、C サイズの料金 1 種類にしています。
  - テスト会員「テスト 太郎」（`test-order@example.com`、住所・電話番号も架空）。画面ではぼかしています。
  - docker（`docker compose up -d`）・git・本番サーバー（`koyama-prod`、SSH の接続名で表示しアドレスは出していません）・`composer install` の出力、コミットの ID は再現です。
    本番への反映と、最後の公開中の商品ページのバッジ（開発環境の EC-CUBE が出したバッジの HTML と CSS を、取り込んだ本番の画面に重ねたもの）は **演出** です。
- 個人情報：テスト会員だけで、実在の人の情報は出ません。EC-CUBE の管理者はローカルのコピー専用の admin / password です。
  **実在のショップ・アカウント・EC-CUBE オーナーズストアには一切ログインしていません**（公開ページを読んだだけです。カート・会員登録・注文もしていません）。
- 株式会社小山弓具は実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/ec-koyama-kyugu/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/ec-koyama-kyugu/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（EC-CUBE の画面・ショップの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「既存の EC-CUBE 4 に：受注生産・納期・在庫の表示…」と出たら録画を停止

## 再生される内容

タスクバーの時計は 2026-09-02（水）10:14 から始まり、本番への反映（11:52）の前に録画のカットとして進みます。

| STEP | 画面 | 内容 |
| --- | --- | --- |
| 1 依頼・現状確認 | VS Code（README）→ 公開中の商品ページ・ご購入ガイド | 「清芳 前煤竹［受注生産］」：受注生産は商品名、納期は説明文の中。送料無料は 15,000 円（矢・矢筒を含むと 55,000 円） |
| 2 開発環境 | docker-compose.yml・ターミナル → 管理画面 | `docker compose up -d`（localhost:8080・SQLite）、ログイン、本番からコピーした商品、基本設定の送料無料条件 15,000 円 |
| 3 受注生産：エンティティ拡張 | `app/Customize/Entity/ProductTrait.php` → ショップ | `@EntityExtension`、`eccube:generate:proxies` → **ミス：スキーマ更新を忘れてシステムエラー** → ログ → `doctrine:schema:update --dump-sql` / `--force` |
| 4 管理画面：商品登録 | `Form/Extension/Admin/ProductTypeExtension.php` → 商品登録 | `auto_render` で「受注生産」「納期の目安」→ オン・「約1年」で登録 |
| 5 商品ページ：在庫・納期の表示 | `Twig/Extension/StockBadgeExtension.php`・`Product/detail.twig`・`customize.css` → 商品ページ | 「受注生産　納期 約1年」・「残りわずか　在庫 2 点」・「在庫あり」 |
| 6 送料無料の条件：PurchaseFlow | `Service/DeliveryFreeRule.php`・`ArrowDeliveryFeeProcessor.php`（`@ShoppingFlow`）→ カート・ご注文手続き | 矢筒＋三ツカケ（22,400 円）：ご注文手続きは送料 1,980 円、**カートは「送料無料」のまま（食い違い）** |
| 7 カートの表示・テスト注文 | `EventSubscriber/CartDeliveryFreeSubscriber.php` → カート・注文・受注管理 | TemplateEvent で「あと 32,600 円」→ テスト注文 → 受注登録の送料 1,980 円 |
| 8 本番へ反映 | ターミナル（git・ssh）→ 公開中の商品ページ | プロキシ生成・スキーマ更新・キャッシュ削除 → 商品ページにバッジ（演出） |

### 日本語入力（Microsoft IME と同じ流れ）

コードの中の日本語（`'受注生産'`・`'納期の目安'`・`'例：約3～4ヶ月'` など）と商品登録の「約1年」は、ローマ字入力 → 変換候補 → 確定の流れで入力します。

## キー操作 / URL パラメータ

`Space` 再生 / 一時停止、`R` 最初から、`C` 字幕、`H` ヒントを隠す。`?t=秒`（シーク）・`?from=シーン番号`・`?speed=1.3`・`?captions=0`。

## EC-CUBE の画面について

`tools/snapshots/ec-koyama-kyugu/capture-ec.js` が、`tools/eccube/capture.js` で EC-CUBE 4.3.1-p1 のコピー（`../eccube-local/inst/ec-koyama-kyugu`）を新しく作り、
ショップのデータとテーマを入れ、動画の段階ごとにコードを入れて画面を取り込みます（`js/ec-snapshot.js`・`assets/ec/`）。

| 段階 | 入れるもの | 取り込む画面 |
| --- | --- | --- |
| 0 | ショップのデータ・テーマ | 管理画面のログイン・ホーム・商品一覧・基本設定、商品ページ（清芳 前煤竹） |
| 1 | ProductTrait＋`eccube:generate:proxies`（スキーマ更新なし） | 商品ページのシステムエラー（とログの行） |
| 2 | `doctrine:schema:update`・FormType 拡張 | 商品登録（拡張した項目）→ オン・約1年で登録した画面 |
| 3 | Twig 拡張・`detail.twig`・`customize.css` | 商品ページ 3 つ（受注生産・在庫あり・残りわずか） |
| 4 | DeliveryFreeRule・ArrowDeliveryFeeProcessor | カート（送料無料のまま）・ご注文手続き（送料 1,980 円） |
| 5 | CartDeliveryFreeSubscriber | カート（あと 32,600 円）・ご注文手続き・確認・完了・受注一覧・受注登録 |

変えているところ（WordPress の動画と同じ）：スクリプトを外す、アドレス `http://127.0.0.1:<port>` → `http://localhost:8080`、取り込んだ日付 → 2026-09-02、
入力する欄（ログイン ID・パスワード・納期の目安）を同じ見た目の入力欄に置き換え。テスト会員の氏名・住所・メール・電話はぼかしています。

## ショップを更新した場合

```
node tools/snapshots/ec-koyama-kyugu/scrape-shop.js          # 公開ページのデータ（shop-data.json）
node tools/snapshots/ec-koyama-kyugu/build-theme.js          # テーマ（theme/）
node tools/snapshots/ec-koyama-kyugu/make-theme-src.js       # VS Code に出すテーマのファイル（js/theme-src.js）
node tools/snapshots/ec-koyama-kyugu/capture-ec.js [スクリーンショットのフォルダ]   # EC-CUBE の画面（15〜25 分）
node tools/webp.js ec-koyama-kyugu
npm run snapshot -- ec-koyama-kyugu                           # 公開中のショップ
npm run verify -- ec-koyama-kyugu && npm run check -- ec-koyama-kyugu && npm run pointer -- ec-koyama-kyugu && npm run timeline -- ec-koyama-kyugu
```

## ファイル構成

```
public/videos/ec-koyama-kyugu/
├── index.html
├── css/video.css
├── assets/            ec/（EC-CUBE の画面の画像・CSS）· site/（公開中のショップ）· eccube-admin.ico · favicon.ico
└── js/
    ├── config.js        工程・取り込むページ
    ├── customize-src.js カスタマイズのコード（動画と取り込みの唯一のソース）
    ├── theme-src.js     テーマ・docker-compose.yml・composer.json（生成）
    ├── files.js         VS Code のプロジェクト（README の依頼）
    ├── apps.js          タブのファビコン・入力・ぼかし・本番の商品ページのバッジ（演出）
    ├── scenario.js      台本
    ├── ec-snapshot.js   EC-CUBE の画面（生成）
    └── site-snapshot.js 公開中のショップ（生成）
tools/snapshots/ec-koyama-kyugu/  scrape-shop.js · shop-data.json · build-theme.js · theme/ · make-theme-src.js · capture-ec.js · NOTES.md
```
