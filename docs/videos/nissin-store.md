# 制作プロセス デモ — 日清食品グループ オンラインストア（store.nissin.com）makeshop → Shopify 移行

> 一覧ページ（`/`）と再生ページ（`/watch/nissin-store`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/nissin-store/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 7 分 40 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
日清食品グループ オンラインストア（https://store.nissin.com/）を **makeshop から Shopify（Shopify Plus）へ移行する工程** を順番に再生します。

**データ書き出し → CSV 変換 → 商品インポート → 顧客データ移行 → URL リダイレクト → テーマ構築 → ドメイン切り替え・公開**

## 最初に確認していただきたいこと

- store.nissin.com は **Shopify（テーマは Prestige 5.7 をカスタマイズしたもの）で運営されている実在のストア** です。
  このデモは「makeshop で運営していたストアを Shopify に移す」としたらどう進めるか、という **移行工程の再現** で、実際の移行作業の記録ではありません。
- **ストアの実データ**：商品名・ブランド・カテゴリー・販売単位（1食 / 1箱(12食入) など）・価格・SKU・タグの付け方（`カテゴリー_…` `サブカテゴリー_…` `配送方法_…` `販売方法_通常購入`）・
  商品ハンドル（`/products/13772` などの数字）・コレクションのハンドル、ブラウザに表示されるストアの画面（PC / スマートフォン）は、公開中のストアから取得したものです。
- **makeshop の画面**：ログイン画面（https://console.makeshop.jp/login）は本物をそのまま取り込んだものです。ログイン後の管理画面はアカウントが必要なため再現ですが、
  ロゴ・アイコン・色・ページのタイトルの形式（「〇〇 - makeshop byGMO」）・メニューと画面の名前（CSV一括処理・商品リストダウンロード・会員アップロード・ダウンロード など）・
  アドレス（`/dashboard` `/products/csv` `/products/csv/product-list` `/members/member-csv`）は、管理画面自身の公開 JavaScript から取った本物です（下の「makeshop の画面について」）。
- **再現用に作ったもの**：makeshop の管理画面のレイアウトと各ページの中身、CSV の列構成、システム商品コード（`/shopdetail/000000026772/` など）、商品画像の URL、在庫数、会員データとその件数、
  Search Console の上位ページ、ドメインの切り替え日時。会員の氏名・所在地はぼかしています。
- 日清食品グループは実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/nissin-store/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/nissin-store/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（ストアの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「makeshop から Shopify への移行が完了」と出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 データ書き出し | Chrome（makeshop の管理画面） | makeshop の管理画面にログイン（本物のログイン画面：ショップ ID はぼかし、パスワードは •••）→ 商品管理 › CSV一括処理 › 商品リストダウンロード（Shift_JIS の CSV）、会員管理 › 会員アップロード・ダウンロード（パスワードは出力されない） | |
| 2 CSV 変換 | VS Code ＋ ターミナル | CSV を Shift JIS で開き直して列を確認、変換スクリプト `scripts/convert-products.mjs` で「1 商品 = 1 行」を「バリエーションごとに 1 行」（単品 / ケース）に変換 | **文字化け → 変換ミス**：Shift_JIS の CSV を UTF-8 として読んでいたため、列名が一致せず値が `undefined`・ケースの行もできない → `iconv.decode(…, 'Shift_JIS')` に直して再実行（112 商品 → 223 行） |
| 3 商品インポート | Chrome（Shopify 管理画面） | 商品 →「インポート」→ ファイル選択 → 1 件目のプレビュー → インポート、商品ページで「販売単位」のバリエーション・SKU・タグを確認 | |
| 4 顧客データ移行 | VS Code・Chrome | 退会者・メールなしを除外して顧客 CSV に変換（会員ランクはタグ、makeshop 会員 ID はメモ）→ インポート、顧客アカウントを「新しい顧客アカウント」（メールの確認コードでログイン）に | |
| 5 URL リダイレクト | VS Code・Chrome | 旧 URL（`/shopdetail/…/` `/shopbrand/ct…/`）→ 新 URL の CSV を作成して「URL リダイレクト」にインポート、Search Console の上位ページで 301 を確認 | **転送漏れ**：`/view/item/…`（makeshop のクリエイターモードの URL）が 404 → 行を複製して追加・再インポート → すべて 301 |
| 6 テーマ構築 | VS Code ＋ Chrome（127.0.0.1:9292） | `shopify theme dev`、商品カードに `product-item-form` スニペット（販売単位のセレクト・数量・カートボタン・税抜 / 税込の価格）、スマートフォン幅の確認、`shopify theme push` | **価格の誤り**：移行した価格は税込なのに 1.08 倍して「¥267（税込¥288）」→ 税込価格から税抜を計算（÷1.08 を切り上げ）して「¥248（税込¥267）」 |
| 7 ドメイン切り替え・公開 | Chrome（設定） | 既存のドメイン store.nissin.com を接続（CNAME → shops.myshopify.com）、SSL 発行、プライマリドメインに設定、パスワード保護を解除 | |
| 公開ストアの確認 | Chrome | 旧 makeshop の商品 URL を開くと 301 で `/products/13772` に転送、トップページを確認 | |

### 日本語入力（Microsoft IME と同じ流れ）

変換スクリプトの列名（`r['独自商品コード']` など）・コメント・スニペットの日本語は、ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。
英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。

## キー操作 / URL パラメータ

ほかのデモと同じです（`../../README.md`）。**Space** 再生 / 一時停止、**R** 最初から、**C** 字幕、**H** ヒント、`?t=秒` `?from=シーン番号` `?speed=1.3` `?captions=0`。

## 本番サイトとの同一性について

- ブラウザに表示されるストア（開発環境 127.0.0.1:9292・本番 store.nissin.com、トップページと商品ページ、PC 幅 1920px / スマートフォン幅 390px）は、
  公開中のストアをブラウザで開き、ストアのスクリプトが動いた後の画面を **そのまま取り込んだもの** です（`js/site-snapshot.js`・`assets/site/`）。
  スタイルシートは本番のファイルのまま、画像はその幅で表示されていたサイズのものです。スクリプト（計測タグ・アプリ）は取り込んでいません。
- 「価格もカートもない」「税が二重にかかっている」状態は、取り込んだ画面の商品カードのフォームを隠す・価格の数字を差し替えることで再現しています（`js/scenario.js` の `noForm` / `taxWrong`）。
- 管理画面の商品一覧・商品ページ・インポートのプレビューに出る商品名・販売元・価格・SKU・画像は、ストアの公開商品データ（`/products.json`）から取得したものです。

## 演出であるもの

- **画面の環境**：VS Code は今の既定の見た目です（Dark Modern テーマ、VS Code 自身のアイコン codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。
  Shopify の管理画面は左上のロゴとタブのファビコンが本物です（`npm run favicons`）。ファビコンのないページ（開発サーバーなど）のタブには Chrome 本体のアイコンを表示しています。

- Shopify の管理画面は **見た目を似せた再現** です。makeshop はログイン画面が本物、ログイン後の管理画面が再現です（下の「makeshop の画面について」）。インポートの進み具合・件数の表示は演出です。
- ターミナルの出力（`shopify theme dev` / `push`、スクリプトの結果）は、実際のコマンドの出力の形式に合わせて表示しています。
- テーマのファイル（`theme/`）は説明のための最小限のもので、ストアの実際のテーマのソースではありません（商品カードのマークアップのクラス名は本番と同じです）。

## サイトを更新した場合

```
npm run snapshot -- nissin-store      ストアの画面・画像・商品データを取り込み直す（tools/snapshot-store.js → 画像は WebP に変換）
npm run timeline -- nissin-store     長さ・チャプターの測定とサムネイルの撮影
```

取り込む内容（ページ・商品・取り除く要素）は `js/config.js` の `snapshot` で設定します。

## makeshop の画面について（本物のものと、再現のもの）

- **ログイン画面は本物です**：https://console.makeshop.jp/login をブラウザで表示した結果（Vue / Vuetify のマークアップ、GMO グループのヘッダー・フッター、makeshop のロゴ）を、
  スタイルシート・画像ごとそのまま取り込んだものです（`js/makeshop-login.js`・`assets/makeshop/login/`。スクリプト・計測タグ・チャットは取り除いています）。
  入力欄の見た目の変化（フォーカス・入力済み）は、ページ自身の Vuetify のクラスを付け外ししています（`js/makeshop-login-frame.js`）。ログインは送信していません。
- **ログイン後の管理画面は再現です**（中に入るにはアカウントが必要なため）。管理画面自身の公開 JavaScript（console.makeshop.jp/assets/*.js）から、
  横長のロゴ（`assets/makeshop/ms-logo-typeA.svg`）・アイコン・テーマの色（nextEcTheme）・タイトルの形式・メニューと画面の名前・アドレスを取って使っています（`js/makeshop-ui.js`）。
  文字はログイン画面と同じ「メイリオ, Meiryo, …」の指定です（Meiryo が入っていない PC では、ＭＳ ゴシックの代わりに Yu Gothic UI で表示します）。
  CSV一括処理の画面に並べた処理の名前（商品一括登録・商品リストダウンロード など）も管理画面の画面名ですが、配置と各ページのフォームは再現です。
- GMO グループのヘッダーはログイン画面だけに出ます（管理画面のアプリがログイン画面を離れるときに外しているため）。
- 取り込み直し：`node tools/snapshots/tabisuruwagashi/capture-makeshop.js`（旅わがの動画と共通。両方の動画のフォルダに書き出します）。

## ファイル構成

```
index.html            ページ本体（共通の部品は public/shared/kit/ と public/shared/）
css/video.css         このデモだけの見た目（makeshop の管理画面）
js/config.js          デモの設定（工程・タイトル画面・ストア・取り込むページ）
js/site-snapshot.js   取り込んだストアの画面と商品データ（自動生成）
js/files.js           VS Code に表示するプロジェクトのファイル（変換スクリプト・CSV・テーマ）
js/apps.js            makeshop の管理画面と、Shopify 管理画面の各ページ
js/makeshop-login.js  makeshop の本物のログイン画面（自動生成）
js/makeshop-ui.js     makeshop 管理画面の公開 JavaScript から取ったアイコン・色・タイトルの形式（自動生成）
js/makeshop-login-frame.js  ログイン画面の表示と入力（旅わがの動画と同じファイル）
js/scenario.js        台本（シーンごとの操作・字幕・ミスと修正）
assets/site/          取り込んだ画像・フォント（自動生成）
assets/makeshop/      makeshop のログイン画面の画像・管理画面のロゴ（自動生成）
```
