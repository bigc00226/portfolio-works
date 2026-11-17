# 制作プロセス デモ — SANYO ONLINE STORE（store.sanyo-shokai.co.jp）既存ストアの機能改善

> 一覧ページ（`/`）と再生ページ（`/watch/sanyo-online-store`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/sanyo-online-store/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 7 分 30 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
三陽商会の公式オンラインストア SANYO ONLINE STORE（https://store.sanyo-shokai.co.jp/）で、**運用中の Shopify ストアを改善する工程** を順番に再生します。

**現状分析 → ブランド横断の絞り込み → 店舗在庫の表示（OMO）→ パフォーマンス改善**

## 最初に確認していただきたいこと

- SANYO ONLINE STORE は **Shopify（テーマは Dawn 7.0.1 をカスタマイズしたもの）で運営されている実在のストア** です。
  このデモは、複数ブランドを扱うこのストアに「ブランドを横断した絞り込み」「店舗在庫の表示（OMO）」「表示速度の改善」を加えるとしたらどう進めるか、という **改善工程の再現** で、
  実際の作業の記録ではありません。
- **ストアの実データ**：ブラウザに表示されるストアの画面（トップ・スカートの一覧・商品ページ、PC / スマートフォン）、一覧の左カラムの絞り込み（販売タイプ・性別・ブランド・カテゴリ…）、
  商品カード（ブランド・商品名・価格・画像）、商品ページの「店舗在庫確認・試着申し込み」とカラー × サイズの在庫、販売元（vendor）に入っているブランドコード
  （商品画像のファイル名の先頭の数字。例：`2321-M5S2281302.jpg` → EPOCA）、商品数（公開商品データの件数、約 19,400 件）は、公開中のストアから取得したものです。
- **再現用に作ったもの**：管理画面のストア分析の数値（検索キーワードと回数・Web パフォーマンス）、メタフィールド・Search & Discovery・ロケーション・ローカルピックアップの設定内容、
  店舗名と店舗ごとの在庫、店舗在庫のダイアログ（本番のボタンは別ウィンドウの試着・取り置きの申し込みページを開きます）、Lighthouse の 3 回分の計測値（下の「Lighthouse のレポート」）、テーマのソースコード
  （クラス名は本番と同じにした最小限のもの）、スクリプト、テーマの公開日時。
- 三陽商会は実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/sanyo-online-store/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/sanyo-online-store/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（ストアの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「…改善を公開」と出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 現状分析 | Chrome（Shopify 管理画面）・VS Code | ストア分析：検索「結果なし」の上位（ブランド名・「店舗 在庫」「取り置き」）、Web パフォーマンス（商品ページの LCP・CLS）、改善計画のメモに表示速度の項目を書き足す | |
| 2 ブランド横断の絞り込み | VS Code ＋ Chrome（127.0.0.1:9292・管理画面） | `shopify theme dev`、販売元＝ブランドコードを確認、商品メタフィールド「ブランド」（custom.brand）を定義、Admin API（metafieldsSet）で全商品に設定、商品カードをメタフィールド表示に、Search & Discovery にフィルター「ブランド」、シノニムにブランドのカタカナ表記 | **表示されない**：フィルターを追加しても「ブランド」が出ない → テーマの `facets.liquid` が表示するフィルターを固定のリストで決めていた → `filter.p.m.custom.brand` を追加 |
| 3 店舗在庫の表示（OMO） | Chrome（設定）・VS Code | ロケーション（店舗）、ローカルピックアップ（店舗受け取り・取り置き）を店舗ごとに有効化、スニペット `store-stock.liquid`（`variant.store_availabilities`）を商品ページのカートボタンの下に、スマートフォン幅の確認 | **表示ミス**：店舗在庫の一覧に「EC 物流センター」が出る → 物流センターのローカルピックアップを無効に |
| 4 パフォーマンス改善 | Chrome（DevTools の Lighthouse）・VS Code | 計測（パフォーマンス 38）、商品画像を `image_tag`（width / height・srcset）に、解約済みアプリのスクリプトを削除、`shopify theme push --unpublished` → 管理画面で公開 | **LCP が悪化**：1 枚目の商品画像まで `loading="lazy"` にして LCP 7.1 秒 → 1 枚目だけ eager に（パフォーマンス 86、LCP 2.4 秒・CLS 0.02） |
| 公開ストアの確認 | Chrome | スカートの一覧のブランドの絞り込み、商品ページの「店舗在庫確認・試着申し込み」とカラー × サイズの在庫（PC / スマートフォン）、トップページのブランドリスト | |

### 日本語入力（Microsoft IME と同じ流れ）

メタフィールドの名前・説明、Search & Discovery のラベルとシノニム、スニペットのコメントと文言（「店舗在庫確認・試着申し込み」「在庫あり」など）、改善計画のメモは、
ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。

## キー操作 / URL パラメータ

ほかのデモと同じです（`../../README.md`）。**Space** 再生 / 一時停止、**R** 最初から、**C** 字幕、**H** ヒント、`?t=秒` `?from=シーン番号` `?speed=1.3` `?captions=0`。

## 本番サイトとの同一性について

- ブラウザに表示されるストア（開発環境 127.0.0.1:9292・本番 store.sanyo-shokai.co.jp、トップページ・`/collections/all?gender=WOMEN&category=01-001001012`（スカート）・
  商品ページ `/products/h5b41876`、PC 幅 1920px / スマートフォン幅 390px）は、公開中のストアをブラウザで開き、ストアのスクリプトが動いた後の画面を **そのまま取り込んだもの** です
  （`js/site-snapshot.js`・`assets/site/`）。スタイルシートは本番のファイルのまま、画像はその幅で表示されていたサイズのものです。スクリプト（計測タグ・アプリ）は取り込んでいません。
- 「ブランドの絞り込みがない」「カードにブランドコードが出る」状態は、取り込んだ一覧の左カラムのブランドの欄を隠す・カードのブランド名をコードに差し替えることで再現しています
  （`js/scenario.js` の `noBrand` / `codes`）。店舗在庫のダイアログは取り込んだ商品ページの上に重ねて表示しています（`stockModal` / `stockModalWh`）。
- 管理画面の商品一覧の商品名・価格・画像・販売元（ブランドコード）は、取り込んだ一覧の商品カードのものです。

## Lighthouse のレポート（シーン 4）

DevTools の Lighthouse パネルに出るレポートは、**Lighthouse 自身のレポート描画プログラム**（`lighthouse` パッケージの `dist/report/bundle.esm.js`。Chrome の DevTools が使っているものと同じ。Apache-2.0）で、
**本物の Lighthouse の計測結果**を描画したものです。DevTools と同じく `renderReport(lhr, {disableDarkMode: true})` に `.lh-devtools` を付けて表示しているので、
ゲージ・指標・フィルムストリップ・インサイト・診断・各監査を開いたときの表・上部に固定されるスコアまで、DevTools の表示そのままです。

- **計測は本物**：Lighthouse 13.6.0（モバイル：Moto G Power のエミュレート・低速 4G のシミュレーション、日本語）で、公開中の商品ページ
  `https://store.sanyo-shokai.co.jp/products/h5b41876` を 2026-11-17 に計測した結果（監査の一覧と内容、URL、要素、フィルムストリップとスクリーンショット、ユーザー補助 78・おすすめの方法 58・SEO 85）。
  インサイトの文言（「レイアウト シフトの原因」「サイズ指定されていない画像要素」「LCP リソースで loading=lazy を使用しないでください」など）も Lighthouse の日本語の文言です。
- **物語に合わせて設定したもの**：ページの URL（開発サーバー `http://127.0.0.1:9292` に置き換え）、3 回の計測それぞれの 5 つの指標（下表）。パフォーマンスのスコアは、
  その指標から **Lighthouse 自身の採点式**（指標ごとの対数正規分布の曲線と重み）で計算した値で、物語のスコア 38 / 61 / 86 になるように Total Blocking Time を選んでいます。
  公開中のストアはすでに改善後の状態（画像に width / height、1 枚目は eager）なので、計測結果は 3 回目（改善後）の土台にし、1・2 回目はその状態の問題点を足しています。

| 計測 | パフォーマンス | FCP | LCP | TBT | CLS | SI | その状態の問題（Lighthouse が出すもの） |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 回目（改善前） | 38 | 2.4 秒 | 6.4 秒 | 670 ミリ秒 | 0.31 | 5.2 秒 | レイアウト シフトの原因（サイズ指定されていない画像要素）、画像配信を改善する（1500px の画像をスマートフォンで表示）、使用していない JavaScript の削減（`legacy-review-widget.js` 412 KiB・`chat-support-v1.js` 186 KiB）、画像要素で width と height が明示的に指定されていない、LCP リクエストの検出 |
| 2 回目（全部 lazy） | 61 | 1.8 秒 | 7.1 秒 | 500 ミリ秒 | 0.02 | 3.5 秒 | LCP リクエストの検出：1 枚目の商品画像（LCP）が `loading="lazy"` |
| 3 回目（1 枚目だけ eager） | 86 | 1.6 秒 | 2.4 秒 | 420 ミリ秒 | 0.02 | 3.1 秒 | （テーマのコードは fetchpriority を付けていないので、LCP リクエストの検出は「fetchpriority=high を適用する必要があります」のまま） |

- メインスレッドの診断（「メインスレッド処理の最小化」「JavaScript の実行にかかる時間の低減」「長時間実行されているタスク」、サードパーティのメインスレッド時間）は、
  この PC での計測が CPU の遅さで実際より大きく出た（Total Blocking Time 38 秒）ため、項目と割合はそのままに、各回の Total Blocking Time に合う大きさに縮めています。
- フィルムストリップは Lighthouse の形式どおり JPEG（レンダラーが JPEG として扱うため）、最終画面とページ全体のスクリーンショットは WebP にしています。
- 作り直すとき：`node tools/snapshots/sanyo-online-store/build-lighthouse.js`（保存した計測結果から作り直し）、`--run` を付けると公開ページを計測し直します（Lighthouse は `npm install` で入る devDependency）。

## 演出であるもの

- **画面の環境**：VS Code は今の既定の見た目です（Dark Modern テーマ、VS Code 自身のアイコン codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。
  Shopify の管理画面は左上のロゴとタブのファビコンが本物です（`npm run favicons`）。ファビコンのないページ（開発サーバーなど）のタブには Chrome 本体のアイコンを表示しています。

- Shopify の管理画面・Search & Discovery は **見た目を似せた再現** です。DevTools の Lighthouse パネルの枠（ツールバー・開始画面・実行中のダイアログ）は devtools-frontend のレイアウト・日本語の文言・アイコンに合わせて描いたもので、**レポート本体は Lighthouse 本物のレンダラーによる表示** です（下記）。
- ターミナルの出力（`shopify theme dev` / `push`、スクリプトの結果）は、実際のコマンドの出力の形式に合わせて表示しています。
- ストア分析の数値は、改善の流れを示すための例です（本番ストアの計測値ではありません）。Lighthouse の 3 回分の指標とスコアも同様です（下記）。
- ターミナルの `Synced` の時刻は、タスクバーの時計（動画の時刻）に合わせて表示しています。

## サイトを更新した場合

```
npm run snapshot -- sanyo-online-store      ストアの画面・画像を取り込み直す（tools/snapshot-store.js → 画像は WebP に変換）
node tools/snapshots/sanyo-online-store/build-lighthouse.js [--run]   Lighthouse のレポートを作り直す（--run で公開ページを計測し直す）
npm run timeline -- sanyo-online-store     長さ・チャプターの測定とサムネイルの撮影
```

取り込む内容（ページ・取り除く要素）は `js/config.js` の `snapshot` で設定します。

## ファイル構成

```
index.html            ページ本体（共通の部品は public/shared/kit/ と public/shared/）
css/video.css         このデモだけの見た目（ストア分析・Search & Discovery・ロケーション・Lighthouse パネル・テーマ）
js/config.js          デモの設定（工程・タイトル画面・ストア・取り込むページ）
js/site-snapshot.js   取り込んだストアの画面（自動生成）
js/files.js           VS Code に表示するテーマのリポジトリ、管理画面のデータ（取り込んだ一覧の商品・ブランドコード）
js/apps.js            Shopify 管理画面の各ページと、DevTools の Lighthouse パネル
js/lighthouse-report.js  Lighthouse のレポート描画プログラム（lighthouse パッケージのものをそのまま。自動生成）
js/lighthouse-data.js    本物の Lighthouse の計測結果と、3 回分の状態（自動生成）
assets/devtools/      DevTools の Lighthouse のロゴとツールバーのアイコン（devtools-frontend）
js/scenario.js        台本（シーンごとの操作・字幕・ミスと修正）
assets/site/          取り込んだ画像・フォント（自動生成）
```
