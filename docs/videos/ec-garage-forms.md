# 制作プロセス デモ — Garage（ガラージ・garage.plus.co.jp）EC-CUBE 2 帳票・PDF・CSV のカスタマイズ

> 一覧ページ（`/`）と再生ページ（`/watch/ec-garage-forms`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-garage-forms/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 8 分 25 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
オフィス家具の通販サイト Garage（https://garage.plus.co.jp/、EC-CUBE 2 で運営）の **帳票・PDF・CSV まわりの改修の工程** を順番に再生します。

**依頼・現状確認 → 納品書のロゴと品番の列 → 帳票の初期値・一括出力 → 出荷指示 CSV → 商品の CSV 一括登録 → 本番へ反映 → 公開中のサイト**

画面の日付は 2026/11/10（火）10:20〜（途中でカット）。

## 最初に確認していただきたいこと

- garage.plus.co.jp は **EC-CUBE 2 で運営されている実在のショップ** です（プラス株式会社 ファニチャーカンパニー）。このデモは「このショップの
  帳票（納品書 PDF）と CSV を、業務チームの依頼に合わせて改修する」としたらどう進めるか、という **工程の再現** で、実際の開発の記録ではありません。
  ショップの実際のソースコード・管理画面・業務の流れは公開されていないため、カスタマイズのコードはこの動画のために書いたものです。
- **本物のもの**
  - **EC-CUBE の画面・PDF・CSV はすべて本物** です。この PC の上で動かした **EC-CUBE 2**（GitHub の週次ビルド eccube2-weekly-20261110・2.25 系。
    SQLite に対応した最初の版。PHP 8.3 の WebAssembly 版で実行）に、ショップの公開データとこの動画のコードを入れ、動画と同じ操作を実際に行って
    取り込みました（`tools/snapshots/ec-garage-forms/capture-ec.js`、`tools/eccube/`）。
    - 受注管理・帳票出力・CSV出力項目設定（受注 / 高度な設定）・構文エラーの確認・商品登録CSV（取り込み結果）・商品マスター・システムエラーの 13 画面
    - **納品書 PDF 4 種**：初期状態（EC-CUBE のサンプルのロゴ）、品番の列を足して表が用紙からはみ出した版、直した版、3 件の一括出力（3 ページ）。
      いずれも EC-CUBE 2 の「帳票出力」（`data/class/SC_Fpdf.php`・FPDF）が実際に出力した PDF で（`assets/pdf/*.pdf`）、それを Chrome 自身の PDF ビューアで
      開いた画面を取り込んで表示しています（ビューアの枠も本物）
    - **出荷指示 CSV**：「高度な設定」に登録した SQL で EC-CUBE が実際に出力した CSV（Shift_JIS）の中身
    - **ミスとエラー**：表のはみ出し（列の幅の合計 192.5mm）、`dtb_order.deliv_date`（EC-CUBE 2.4 までの列）を使った SQL で「構文エラーを確認する」は
      「エラーはありません」なのに CSV出力で「システムエラーが発生しました。」になる流れ、そのときの `data/logs/error.log` の内容と SQLite 自身のエラー文
      （`no such column: o.deliv_date`）、3 桁区切りのカンマ付きの価格（"143,000"）の商品 CSV で出る取り込みエラー、はいずれも EC-CUBE 2 が実際に出したものです
  - **動画で入力するコードは、実際に動かしたコード** です（`js/garage-src.js`）：`data/class_extends/SC_Fpdf_Ex.php`（明細に「品番」の列）、
    `data/class_extends/page_extends/admin/order/LC_Page_Admin_Order_Pdf_Ex.php`（帳票出力の初期値）、出荷指示 CSV の SQL。
    VS Code に出るファイルと、取り込みのときに EC-CUBE に書き込んだファイルは同じソースです。EC-CUBE 本体のファイル（`SC_Fpdf.php`・
    `LC_Page_Admin_Order_Pdf.php`・`data/class_extends/README.md`）は同じビルドからそのまま表示しています（`js/eccube-core.js`）
  - **ショップのデータは公開ページから**（2026-11-18 取得、`tools/snapshots/ec-garage-forms/fetch-garage-data.js`）：ショップ名・会社情報と特定商取引法の表記
    （販売業者・所在地・電話番号・メールアドレス・URL）、カテゴリ（ショップ自身のカテゴリ ID）、25 商品（商品名・カラーごとの品番・価格・在庫・説明・画像）、
    配送方法（宅配便・家具便）と支払方法（ご利用ガイド）、Garage のロゴ。商品登録 CSV の 8 商品は、サイトの「新着商品」の実際の商品です
  - 公開中のショップの画面（最初の商品ページ・最後の新着商品のページ）は、garage.plus.co.jp の公開ページを取り込んだものです（`npm run snapshot -- ec-garage-forms`）
- **再現のもの**
  - 受注とお客様（8 件の注文・8 名）は **架空** です（会社名・氏名・住所・電話番号・メールアドレスとも作ったもの。商品は実在のもの）。画面と PDF では
    お客様の氏名・住所などにぼかしをかけています
  - 業務チームの依頼書、倉庫（PLC）向けの CSV の項目、商品部の CSV のミスは、工程を説明するための設定です
  - 開発環境の構成（EC-CUBE 2.25 + SQLite に本番データのコピー）、git・本番サーバーへの反映（`deploy.sh`）、ターミナルの出力は再現です
  - 画面の日付・時刻：取り込みの日時（2026-11-18）は画面の日付（2026-11-10）と時計に置き換えています（`tools/eccube/capture.js`）。
    CSV のファイル名の日時も同じく置き換えています
- **ローカルで見るためのもの** です。実在の企業のサイト・ロゴ・商品を含むため、公開はしないでください。

## 再生される内容

| チャプター | 内容 |
| --- | --- |
| 依頼・現状確認 | 依頼書、公開中の商品ページ（品番）、開発環境の受注管理、帳票出力 → 今の納品書（EC-CUBE のサンプルのロゴ・「商品名 / 商品コード / [ 規格 ]」が 1 列） |
| 納品書のロゴと品番の列 | `SC_Fpdf.php` を読む → ロゴの差し替え → `SC_Fpdf_Ex`（コンストラクターで列の幅と見出し、`FancyTable` で品番を分ける）→ 表が用紙の右端からはみ出す → 商品名の列を 86.3mm に → 品番の列のある納品書 |
| 帳票の初期値・一括出力 | `createFromValues()` を読む → `LC_Page_Admin_Order_Pdf_Ex`（タイトル「納品書」・メッセージ・備考）→ 受注一覧で 3 件 → PDF一括出力 → 3 ページの PDF |
| 出荷指示 CSV | 受注の CSV 出力項目（1 行 = 1 受注）→ 高度な設定に SQL（受注 × 配送先 × 配送商品）→ 構文の確認は通るが CSV出力でシステムエラー → error.log と SQLite → `shipping_date` に直す → CSV |
| 商品の CSV 一括登録 | 商品部の CSV → 商品登録CSV → 4 行目の価格のエラー → カンマを外す → 8 商品を登録 → 商品マスター |
| 本番へ反映 | git・本番サーバーへの反映 → 公開中の新着商品のページ |

## EC-CUBE の画面について

- EC-CUBE 2 は `../eccube-local/inst/ec-garage-forms/` に作るこの動画専用のコピーで、ログインはそのコピーの admin / password だけです
  （実在のショップの管理画面・アカウントには一切ログインしていません）
- 画面は EC-CUBE 自身のスクリプトが動いた後の HTML とスタイルシート・画像をそのまま取り込み、アドレスは開発環境の `http://localhost:8080` に置き換えています
- 帳票出力・構文エラーの確認は EC-CUBE ではポップアップのウィンドウで開きますが、動画ではブラウザのタブで表示しています
- 取り込みのやり直し：`tools/snapshots/ec-garage-forms/NOTES.md`

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `public/videos/ec-garage-forms/js/scenario.js` | 台本 |
| `public/videos/ec-garage-forms/js/garage-src.js` | 動画で書くコード・SQL（取り込みでも同じものを EC-CUBE に書き込む） |
| `public/videos/ec-garage-forms/js/ec-snapshot.js`・`assets/ec/`・`assets/pdf/` | 本物の EC-CUBE 2 の画面・PDF とビューアの画面・CSV（生成） |
| `public/videos/ec-garage-forms/js/eccube-core.js` | EC-CUBE 2 本体のファイル（生成、`build-core.js`） |
| `public/videos/ec-garage-forms/js/site-snapshot.js` | 公開中のショップ（生成） |
| `public/videos/ec-garage-forms/js/files.js`・`apps.js` | VS Code のプロジェクト、PDF ビューアなど |
| `tools/snapshots/ec-garage-forms/` | 公開データの取得・EC-CUBE での取り込み・作業メモ |
