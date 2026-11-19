# 制作プロセス デモ — NOT A HOTEL（notahotel.com）

> 一覧ページ（`/`）と再生ページ（`/watch/notahotel`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/notahotel/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 5 分 27 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
NOT A HOTEL（https://notahotel.com/）の **ブランドデザイン（Figma）から WordPress での公開まで** を順番に再生します。

**ブランドデザイン → Web デザイン・レスポンシブ → WordPress テーマ開発 → コンテンツ入稿 → 公開・本番移行**

## 最初に確認していただきたいこと

- **notahotel.com は WordPress で作られたサイトではありません。** 実際のサイトは Next.js（React）で作られ、
  ラインナップの内容は microCMS から配信されています（ページの HTML・画像の配信元から確認できます）。
  ご依頼の「Figma でブランドデザイン → WordPress で公開」の流れに合わせ、**同じ見た目・同じマークアップのサイトを WordPress で作るとしたら**、
  という想定で WordPress 側の工程（テーマ・カスタム投稿タイプ・ACF・入稿・本番移行）を再現しています。
- ブラウザに表示されるトップページ（開発環境 localhost:8888・本番 notahotel.com・Figma のフレーム）は、
  **公開中の notahotel.com をそのまま取り込んだもの** です（下の「本番サイトとの同一性について」）。
- NOT A HOTEL は実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/notahotel/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/notahotel/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（ページ・写真・動画・フォントの先読み）。黒地にロゴのタイトル画面が出たら準備完了です
   - 英字の書体（Neue Haas Grotesk）は notahotel.com と同じ Adobe Fonts のキットから読み込むため、インターネット接続が必要です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後にタイトル画面（5 つの工程に ✓）が出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 ブランドデザイン | Figma | ブランドガイドラインのページ：ロゴ（アイソレーション・最小サイズ・ネガ / ポジ）、ローカル変数（カラー・書体・レイアウト）、カラーのスウォッチ、タイポグラフィ（Manuka Condensed / Neue Haas Grotesk / ヒラギノ角ゴ）、ボタンとハウスカードのコンポーネント（カードの 3 バリアントとプロパティ） | **表記ゆれ**：ブランドメッセージ「世界中にあなたの家を」を入力したら「貴方」に変換されたまま確定 → 表記ルール（「あなた」はひらがな）に合わせて再変換で修正 |
| 2 Web デザイン・レスポンシブ | Figma | トップページの PC フレーム（1440px）を各セクションで組み立て、SP フレーム（375px）とブレイクポイント 768px のメモ、Dev Mode で CTA ボタンの値（サイズ・変数・CSS）を確認、変数を JSON（デザイントークン）で書き出し | |
| 3 WordPress テーマ開発 | VS Code ＋ Chrome | `npx wp-env start`、トークンから theme.json を生成、テーマの有効化、カスタム投稿タイプ「ハウス」（メニュー名「ラインナップ」）、トップページのテンプレート（WP_Query）、カードのテンプレート（ACF のフィールド） | **エラー**：`$houses = new WP_Query( … )` の行末の `;` が抜けて Parse error（WP_DEBUG の表示＋「このサイトで重大なエラーが発生しました。」）→ `;` を追加して再読み込み |
| 4 コンテンツ入稿 | ターミナル・WordPress | 既存のハウス 7 件を WP-CLI で取り込み、ハウスの編集画面で「ONSEN SUITE」を入稿（タイトル・エリア・ショートコンセプト・価格・NEW・詳細ページのパス・アイキャッチ画像）して公開、DevTools のデバイスモード（375px）で SP 表示とカルーセルを確認 | **表示されない**：トップのカードに価格が出ない → ACF のフィールド名は `price_label`、テンプレートは `price_lable`（綴り間違い）→ 修正して再読み込み、8 件すべて表示 |
| 5 公開・本番移行 | ターミナル・Chrome | `git push` → GitHub Actions でテーマを本番に同期（`gh run watch`）、`wp db export` → `scp` → `wp db import`、本番 notahotel.com を確認してスクロール | **表示崩れ**：本番でハウスの写真とヒーロー動画が出ない → DevTools のコンソールに `http://localhost:8888/wp-content/uploads/…` の Mixed Content / ERR_CONNECTION_REFUSED → `wp search-replace` で URL を本番ドメインに置換・キャッシュ削除 → 表示・エラー 0 件 |

ミスが起きると字幕が赤い「⚠」表示になり、該当箇所に赤い枠が出ます。修正すると緑の「✓ 修正」に変わります。

### 日本語入力（Microsoft IME と同じ流れ）

- ローマ字を 1 キーずつ入力 → 点線の下線のかな → Space で変換 → Enter で確定。予測候補は読みに合わせて絞り込まれます
- 入力する日本語：ブランドメッセージ（世界中にあなたの家を）、ボタンのラベル（資料を請求する）、カスタム投稿タイプのラベル（ラインナップ・ハウス・ハウスを追加）、
  ショートコンセプト（奥湯河原の情景に没入する、湯の時間）、価格（3,452万円〜）、コミットメッセージ（トップページとラインナップを実装）
- 「貴方」→「あなた」は、確定済みの語を選択して **変換キー** で再変換（候補一覧から選ぶ）
- 一度入力した「ラインナップ」は、コミットメッセージでは予測候補に出るので Tab で選択
- 英数字・コード・URL は「半角/全角」で直接入力

### 入力している箇所が隠れないようにしていること

- **コードエディタの横スクロール**：VS Code を画面の左半分にスナップした状態では 1 行に入る文字数が少ないため、長い行を入力すると、
  入力位置（キャレット・変換中の文字）が右端に来たところで表示が横にスクロールして追いかけます（実際の VS Code と同じ動き）。
  横に長い行がある間は下端に横スクロールバーが出ます。長い 1 行を最後まで読む場面では、表示を横にスクロールして末尾を見せてから戻します
- **ターミナルの縦スクロール**：出力が増えても、入力中のプロンプトの行が常に見える位置までスクロールします。最下行は字幕と重ならない高さに収まります
- **キー表示**：入力位置が画面下のキー表示の位置にあるとき（ターミナルなど）は、キー表示が画面上部へ移動します
- **ハウスの編集画面**：ACF のフィールドはすべて 1 画面に収まり、字幕と重なりません
- `npm run check -- notahotel`（`tools/check-hidden-input.js`）で、全編を通して「入力中の文字が見えていない瞬間」が 0 件であることを確認しています

## キー操作 / URL パラメータ

キー操作（Space / R / C / H / ← →）と URL パラメータ（`speed` `from` `to` `t` `captions` `autoplay` `embed`）は Né の動画と同じです（`../ne-auberge/README.md`）。

シーン番号：0 タイトル / 1 ブランドデザイン / 2 Web デザイン・レスポンシブ / 3 WordPress テーマ開発 / 4 コンテンツ入稿 / 5 公開・本番移行

## 本番サイトとの同一性について

- 開発環境（localhost:8888）・本番（notahotel.com）・Figma のフレームに表示されるページは、`tools/snapshots/notahotel/update-snapshot.js`（`npm run snapshot -- notahotel`）で
  **公開中の notahotel.com をブラウザで開いた状態（サイトのスクリプト実行後の DOM）** を取り込み、サイトの CSS（Next.js の CSS 5 ファイル・YakuHanJP、バイト列そのまま）で描画しています。
  PC（1440px）と SP（375px・iPhone）の両方を取り込んでいます。
  - ヒーローの動画・ブランドムービーは本番と同じファイルのローカルコピーを再生します（ミュート・ループ）
  - 全シーン実行後の開発環境・本番の画面の DOM は、取り込んだページを描き直したものと一致します（`tools/snapshots/notahotel/test/run.js end` で確認）
- **変えている点**（ローカルで再生するために必要な最小限）
  - `<script>` を外しています（Google タグ マネージャー・計測・広告タグは動きません）。代わりに、サイトのスクリプトがしている次の 3 つだけを小さなスクリプトで再現しています：
    ウィンドウの高さ・幅の CSS 変数（`--vh` / `--vw`）、動画の自動再生、ヒーローを過ぎると下に出る「資料を請求する」ボタン
  - スクロールで表示されるアニメーションは表示し終えた状態、ヒーローのスライドショーは 1 枚目（YUGAWARA）で止まっています
  - 写真・フォント・動画はローカルのコピーを参照します。画像の `loading="lazy"` は録画中の読み込み待ちを避けるため `eager` にしています
  - 本番でも 404 になっているヒーローのポスター画像 2 つ（動画の下に隠れていて見えないもの）は空の画像にしています
- Figma のコンポーネント（ボタン・ハウスカード）も、取り込んだページの該当部分のマークアップとサイトの CSS で描いています
- Figma のローカル変数・theme.json・Dev Mode に出る値（色・書体・余白・ヘッダーの高さ・CTA の青 #0171E3 など）は、サイトの CSS カスタムプロパティと計算済みのスタイルから取っています

## 演出であるもの

- **WordPress で作るという想定そのものは再現です**（上の「最初に確認していただきたいこと」。ただし WordPress の管理画面は本物の WordPress を動かして取り込んだもの）。テーマのファイル構成・ファイル名、`functions.php` などの PHP、`theme.json`、
  ACF のフィールド名、WP-CLI の操作、GitHub Actions・本番サーバー（`notahotel-prod` という SSH の接続名）、取り込みの件数・時刻・コミット ID などは演出です。
  テンプレート（header.php / front-page.php / house-card.php）のマークアップは、取り込んだ本番の HTML（クラス名・属性・インライン SVG）をそのまま使っています。
- ハウス 8 件の名前・エリア・ショートコンセプト・価格・EXCLUSIVE / キャンセル待ち・リンク先・サムネイルは、本番のラインナップの内容です
- ブランドガイドラインの文言（アイソレーション、最小サイズ、表記ルール「あなた」はひらがな 等）は、NOT A HOTEL の公式ガイドラインではなく、このデモ用の想定です
  （ロゴの形・色・書体・サイト上の表記は本番のもの）
- Figma・VS Code・DevTools の画面は、作業の流れを伝えるための再現です。**WordPress の画面は本物です**（下の「WordPress の画面（本物の wp-admin）」）
- 4 つのミスとその修正、要素が追加される順序や速さは演出です

## WordPress の画面（本物の wp-admin・2026-11-17 取り込み）

ブラウザに表示される WordPress の画面は、WordPress 本体を動かして取り込んだ **本物の wp-admin** です（`js/wp-snapshot.js`・`assets/wp/`）。
WordPress Playground（https://playground.wordpress.net — ブラウザの中で WordPress を動かす公式のツール。アカウント不要）を
`tools/snapshots/notahotel/capture-wp-admin.js` が操作し、動画と同じ状態を作ってから各画面を取り込みます。

- **環境**：WordPress 7.1.4（日本語）、PHP 8.3、サイト名 NOT A HOTEL、テーマ Twenty Twenty-Five / Four / Three（wordpress.org）と、動画で書くテーマ「NOT A HOTEL」
  （`js/theme.js` のファイルそのもの。スクリーンショットは本番サイトのファーストビュー）、Advanced Custom Fields 6.8.11・WordPress Importer（wordpress.org）。WP_DEBUG はオン（wp-env と同じ）
- **データ**：既存のハウス 7 件（本番のラインナップ）、メディアライブラリにカードの写真 8 枚（本番と同じファイル名・形式）とサイトアイコン、ACF のフィールドグループ「ハウス情報」（テーマの `acf-json/group_house.json`）
- **取り込んだ画面**（13 枚）：テーマ（有効化の前 / 後 / ラベル追加後）、PHP の Parse error（`front-page.php` の 8 行目。画面のコードと同じ）、ラインナップ一覧（960 / 1920px）、
  ハウスの編集画面（入力前・メディアライブラリ・画像を選択・アイキャッチ設定後・公開後）、ACF のフィールドグループ編集（1920 / 960px）。いずれも動画の Chrome の表示領域と同じ大きさ
- **本物の動きに合わせて直したところ**（以前の再現との違い）：
  - ハウスの投稿タイプは `supports` に `editor` がないため、WordPress は **ブロックエディターではなくクラシックの編集画面** を出します（以前の再現はブロックエディターでした）。公開は「公開」ボタン → 画面の再読み込みと「投稿を公開しました。」のお知らせ（公開前チェックのパネルはありません）
  - ラベルを書く前のハウスの投稿タイプは、管理画面のメニューに既定の名前「投稿」で出ます。ラベルを書いて再読み込みすると「ラインナップ」になります（幅 960px ではメニューがアイコンだけに畳まれるため、ポインターを乗せて名前を確認します）
  - 管理バー左端の WordPress のロゴ、ACF の画面の ACF / WP Engine のロゴ・「ACF PRO で追加機能をアンロック」も本物のままです
- **動画のために変えたところ**：Playground のアドレス → wp-env の `http://localhost:8888`（PHP のエラーのパスも `/var/www/html/…`）、取り込んだ日（2026/11/17）→ 動画の日付（2026/11/01・公開時刻 10:21）、
  Playground が足す属性・メニュー項目を除去、動画が文字を入力する 5 つの入力欄（タイトル・エリア・ショートコンセプト・価格表示・詳細ページのパス）は、入力の様子を描くため同じ見た目（入力欄の計算済みスタイル、フォーカス時も）の箱に置き換え。
  ポインターは本物のマウスではないので、WordPress の `:hover` / `:focus` のスタイルを動画の操作に合わせて当てています
- **無料版の ACF について**：`inc/acf.php` の `acf_add_options_page()`（オプションページ）は ACF PRO の機能で、wordpress.org の無料版にはありません。取り込みでは `function_exists` で囲んで呼んでいないため、管理画面に「トップページ設定」はありません
- 取り込み直し：`node tools/snapshots/notahotel/capture-wp-admin.js` → `node tools/webp.js notahotel` → `node tools/snapshots/notahotel/prune-wp-assets.js`（動画が読み込まないフォント・画像を削除）

## 画面の環境

- Windows 11：Figma（デスクトップアプリ）、VS Code、Chrome。タスクバーの時計は **2026/11/01 10:18** から進みます
  （サイトのお知らせで最も新しいもの「NOT A HOTEL、NOTAへ社名変更しグループ体制を強化」が 2026/10/05 のため、それより後の日付にしています）
- ぼかし：`git push` の出力のリポジトリ所有者名

## サイトを更新した場合

```
npm install                              （初回のみ。movie/ フォルダで実行）
npm run snapshot:notahotel
```

`js/site-snapshot.js` と `assets/site/` が更新されます（Node.js 18 以上と Google Chrome が必要。写真・動画を含めて約 66 MB）。
ハウスの内容が変わった場合、入稿の場面で入力する文字（`js/scenario.js` の `JA.concept` / `JA.price`）を本番に合わせて書き換えてください
（一致しない場合はコンソールに警告が出ます）。台本を変えたら `npm run timeline -- notahotel`（movie/ フォルダで実行）で長さとサムネイルを作り直してください。

## ファイル構成

| パス | 内容 |
| --- | --- |
| `index.html` | デモ画面（これを開く） |
| `css/demo.css` | デスクトップ・各アプリ・字幕などの見た目（Né の動画と共通の部分） |
| `css/notahotel.css` | ブランドボード・Dev Mode・DevTools・エディタの横スクロール・WordPress の画面の枠 |
| `js/site-snapshot.js` | 本番サイトの取り込み（自動生成） |
| `js/site-frame.js` | 取り込んだページを各画面（Figma のフレーム / 開発環境 / 本番）に描画する処理 |
| `js/theme.js` | VS Code に表示する WordPress のプロジェクト（テーマのファイル）とシンタックスハイライト |
| `js/apps.js` | Figma・VS Code・ターミナル・Chrome（デバイスモード・DevTools） |
| `js/wp-snapshot.js` | 本物の wp-admin の画面（WordPress Playground から取り込み・自動生成） |
| `js/wp.js` | 取り込んだ wp-admin の画面の表示（各画面の iframe、`:hover` / `:focus`、入力欄）と PHP のエラー画面 |
| `js/scenario.js` | 操作の台本（入力するローマ字・変換候補、ミスの場面、流れ・タイミング） |
| `assets/site/` | 本番の写真・動画・フォントのコピー |
| `assets/wp/` | wp-admin の画面が読み込む画像（WebP） |
| `tools/snapshots/notahotel/update-snapshot.js` | 取り込み直し用スクリプト（`npm run snapshot -- notahotel`） |
| `tools/snapshots/notahotel/capture-wp-admin.js` | wp-admin の画面の取り込み（WordPress Playground） |
| `tools/snapshots/notahotel/prune-wp-assets.js` | wp-admin の画面のうち、動画が読み込まないファイルの削除 |
| `tools/snapshots/notahotel/test/run.js` | 確認用（`node run.js end`：最後まで高速再生して長さ・同一性を確認 / `node run.js shots 30,90 <出力先>`：指定秒の画面を保存） |
