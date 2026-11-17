# 制作プロセス デモ — Né（ne-auberge.jp）

> 一覧ページ（`/`）と再生ページ（`/watch/ne-auberge`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ne-auberge/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME・通知）で、長さは 5 分 49 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
「Né（ネ）｜新潟・新発田、一日一組のオーベルジュ」（https://ne-auberge.jp/）の制作工程を順番に再生します。

**Figma Design → レスポンシブデザイン → Frontend / CMS 実装 → SEO / LLMO 基盤 → GA4 / GTM 計測設計 → 公開**

## 録画の手順

1. `public/videos/ne-auberge/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/ne-auberge/index.html でも可）
   - 開いてから準備が終わるまで 15〜30 秒ほどかかります（ページ・写真・フォントの先読み）。画面全体が生成り色になったら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始（右下のキー操作ヒントは再生開始と同時に消えます）
5. 最後に「Né」のタイトル画面（5 つの工程に ✓）が出たら録画を停止

再生時間は標準速度で 5 分 49 秒です（Figma 約 50 秒／レスポンシブ 約 25 秒／Frontend・CMS 約 55 秒／SEO・LLMO 約 85 秒／GA4・GTM と公開 約 2 分）。短くしたい場合は `?speed=1.3` などを使ってください。

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 Figma Design | デザインツール | ローカル変数（カラー・タイポグラフィ）、PC フレーム（1440px）、メインビジュアルの写真・キャッチコピー・受賞ロゴ、各セクションの配置、本文の書体設定 | |
| 2 レスポンシブデザイン | デザインツール | PC フレームを複製して SP（375px）に、ブレイクポイント 720px のメモ、「一日の流れ」の横スクロール | **表示崩れ**：SP で見出しが PC 用サイズのまま画面からはみ出す → 1.42rem（21.3px）・改行なしに変更 |
| 3 Frontend / CMS 実装 | コードエディタ＋ブラウザ | `npm run dev`、ページにセクションのコンポーネントを読み込む、コンポーネントへのコピー入力、Sveltia CMS の設定ファイル、Sveltia CMS（本物の画面）で予約 URL と CTA を入力して保存 | **エラー**：import パスの綴り間違い（HomeSection → HomeSections）で開発サーバーがエラー画面 → 修正して保存、ホットリロードで表示 |
| 4 SEO / LLMO 基盤 | CMS・エディタ・ブラウザ | Sveltia CMS でトップページの title（日本語）、canonical・hreflang・OGP、構造化データ（JSON-LD）、検証ツールでテスト、robots.txt、llms.txt | **エラー**：`<script type="application/ld+json">{JSON.stringify(schema)}</script>` と書いたため JSON-LD が式のまま出力され、スキーマ マークアップ検証ツールで「アイテムが検出されませんでした」「その他のエラー 1 件」→ `set:html` に直して再テスト、Restaurant・LocalBusiness・WebSite の 3 件を検出（エラーなし・警告なし） |
| 5 GA4 / GTM 計測設計 | エディタ・ブラウザ | GTM スニペットを全ページに設置、計測設計（概要）、GA4 の Google タグを追加、プレビュー（Tag Assistant）、DebugView、コンテナの公開 | **計測エラー**：タグは発火しているのに GA4 にイベントが届かない → 測定 ID の入力ミス（G-MEE**N**… の E が 1 つ足りない）→ 直して再プレビュー、page_view などを受信 |
| 公開 | ターミナル・ブラウザ | `git push` → Cloudflare のデプロイ完了通知 → 公開サイト ne-auberge.jp を表示してスクロール | |

ミスが起きると下の字幕帯が赤い「⚠」表示になり、該当箇所に赤い枠が出ます。修正すると緑の「✓ 修正」に変わります。
字幕帯の左側には 5 つの工程が並び、いまの工程が白く、終わった工程に緑の ✓ が付きます。

### 日本語入力の再現（Microsoft IME と同じ流れ）

- ローマ字を 1 キーずつ入力 → かなに変わっていく入力中の文字（点線の下線）と、読みに合わせて絞り込まれる予測候補
- Space で変換（文節ごとの下線、太い下線が変換中の文節）、2 回目の Space で候補一覧 → Enter で確定
  - 例：「とまる」→ 止まる／**泊まる**、「しばた」→ 柴田／**新発田**、「ふたつの」→ 二つの／**ふたつの**
- 一度選んだ変換は IME が覚えます（STEP 4 では「新発田」が最初に出て、「いちにち」で「一日一組のオーベルジュ」が予測候補に出るので Tab で選択）
- 英数字・コード・URL は「半角/全角」で直接入力に切り替えて入力
- 画面下に押しているキーと IME の状態（あ / A）を表示（タスクバー右の「あ / A」も連動）

## キー操作

| キー | 動作 |
| --- | --- |
| Space | 再生開始 / 一時停止 |
| ← / → | 5 秒戻る / 進む |
| R | 最初からやり直す |
| C | 字幕帯の表示 / 非表示 |
| H | キー操作ヒントの表示 / 非表示 |

## URL パラメータ

`index.html?speed=1.3&captions=0` のように指定します。

| パラメータ | 内容 |
| --- | --- |
| `speed=1.3` | 再生速度（1 が標準）。緑の「✓ 修正」の字幕は、速度を上げても読める長さのまま表示されます |
| `from=3` | 指定したシーンから再生。それより前のシーンを「準備中…」の表示の裏で進め、そのシーンの開始状態で止まります（数秒）。表示が消えてから録画を開始し、Space で再生 |
| `t=83.5` | 指定した時刻（秒）まで画面の裏で進めて、その場面で止まります（`play=1` を付けるとそのまま再生） |
| `embed=1` | 再生ページの中で使う表示（キー操作ヒントなどを出さない）。再生ページから開いたときは自動で付きます |
| `to=3` | 指定したシーンを再生し終えたところで止める |
| `captions=0` | 字幕帯なしで再生（ミスの赤枠・緑枠は表示されます） |
| `autoplay=1` | 準備ができてから約 1.5 秒後に自動で再生開始 |
| `font=local` | 明朝体の代替フォントを使わない（下の「フォントについて」を参照） |

シーン番号：0 タイトル / 1 Figma Design / 2 レスポンシブ / 3 Frontend・CMS / 4 SEO・LLMO / 5 GA4・GTM / 6 公開・公開サイト

工程ごとに分けて撮る場合は `from` と `to` を使ってください（例：`index.html?from=4&to=4` で SEO / LLMO だけ）。

## 本番サイトとの同一性について

- デザインツールのフレーム、開発サーバー（localhost:4321）、公開サイトの画面はすべて、ne-auberge.jp が実際に配信している
  HTML（Astro の出力：構造・クラス・`data-astro-cid-*`・インラインのスタイルとスクリプト・JSON-LD）と、
  2 つの CSS ファイル（`assets/_astro/`、本番と同じバイト列）で描画しています。
  - SP フレームとスクロールは本番の CSS（720px のブレイクポイント、`html { font-size: 15px }` など）がそのまま効いています
  - 開発サーバーと公開サイトの画面では、本番のスクリプト（見出しの 1 文字ずつの表示、スライドショー、スクロールでのフェードイン、
    スクロール後に出るヘッダー）がそのまま動きます。リンクやボタンにカーソルを合わせると、本番と同じホバー表示になります
- 入力の途中経過やミスの場面は一時的な表示で、最後の状態は本番と一致します
  （全シーン実行後のデザインフレームの `<main>` を本番の HTML と比較し、一致を確認済み）
- **変えている点**（ローカルで再生するために必要な最小限）
  - 写真・ロゴ・CSS のパスを `assets/` 内のコピーに向けています
  - Google タグ マネージャーの読み込みを外しています（録画のたびに本番の GA4 / Meta Pixel にデータが送られないようにするため）
  - Cloudflare のメールアドレス保護は、ブラウザで表示されるときと同じ形（concierge@ne-auberge.jp）に展開しています
- そのまま本番のものを表示しているファイル：`public/robots.txt`、`public/llms.txt`、`public/admin/config.yml`（Sveltia CMS の設定。CMS 画面の項目名もこの設定どおり）、`public/admin/index.html`、
  JSON-LD（`src/data/schema.ts` の中身）、GTM のコンテナ ID（GTM-MCB2MDKB）と GA4 の測定 ID（公開中の GTM コンテナに含まれるもの）

### 本物の画面（2026-11-17 に取り込み）

ブラウザに映る次の 3 つは、見た目を似せた再現ではなく、本物の画面を取り込んだものです（`js/real-ui.js` が iframe に表示し、
カーソルのホバー・入力欄のフォーカスは各画面自身の CSS の `:hover` / `:focus` をそのまま使います）。

| 画面 | 何が本物か | 取り込み方 |
| --- | --- | --- |
| Sveltia CMS（localhost:4321/admin/） | Sveltia CMS 0.268.0（MIT ライセンスのオープンソース）が描画した画面そのもの。項目・ラベル・プレビュー・「保存」ボタン・「エントリーが保存されました。」の通知、タブのタイトル（例：「サイト設定 / Settings › Site Settings – Sveltia CMS」）とアドレスも CMS が付けたもの | `tools/snapshots/ne-auberge/capture-cms.js`：サイトの `/admin/index.html` と `/admin/config.yml` を手元のサーバー（localhost:4321）で開き、Chrome で実際に入力・保存して各段階の画面を記録（`js/cms-snapshot.js`）。ログイン不要にするため、config.yml の `backend` だけを Sveltia のブラウザ内テスト用リポジトリ（`test-repo`）に替え、`src/content/` のファイル（サイトの title / description、site.json）を入れています。動画ではログイン後の画面だけを使うため、この違いは画面に出ません |
| スキーマ マークアップ検証ツール（validator.schema.org） | 公開ページそのもの。このページのソースを貼り付けてテストした実際の結果（修正前：「アイテムが検出されませんでした」「その他のエラー 1 件」と 27 行目の × 印、修正後：Restaurant・LocalBusiness・WebSite の 3 件・エラーなし・警告なし）。宿・料理長・運営会社などは Restaurant の中に入れ子で検出されます | `tools/snapshots/ne-auberge/capture-validator.js`：ダイアログ（URL を取得 / コード スニペット）→ 貼り付け → テスト中 → 結果、の各段階を記録（`js/validator-snapshot.js`、フォントは `assets/validator/`） |
| ページのソース（view-source:localhost:4321/） | Chrome が実際に作るページのソースの表示（行番号の表・色分け・リンク・「行を折り返す」）と、Chromium の view-source.css（BSD ライセンス）。Ctrl+A の選択色も Windows の Chrome と同じ | `tools/snapshots/ne-auberge/capture-view-source.js`（`js/view-source-snapshot.js`） |

- ページのソースと検証ツールに貼り付けるソースは、本番サイトが配信している HTML そのもの（`js/site-source.js`。写真のファイル名も本番どおり `.avif` / `.jpg`）です。
  動画内で表示する写真はローカルの WebP に置き換えていますが、ソースの表示には影響させていません。
- 検証ツールは、自動での取り込みを繰り返すと Google の確認画面（reCAPTCHA）が出るため、取り込みに成功した 1 回分を使っています。
  そのときのソースは写真のファイル名だけがローカル用（.webp）だったため、表示中のソースの写真のファイル名を本番のもの（`js/site-source.js`）に戻しています（検出結果はファイル名に影響されません）。
  `capture-validator.js` を実行し直すと、本番のソースでそのまま取り込まれます（確認画面が出た場合は時間をおいて実行してください。確認画面は自動では回避しません）。

### フォントについて

本番サイトは游明朝・ヒラギノ明朝などの **端末に入っている明朝体** で表示されます（Web フォントは使っていません）。
このデモを開いた PC にどの明朝体も入っていない場合（日本語の追加フォントが入っていない Windows など）、そのままではゴシック体で表示されてしまうため、
「Yu Mincho」という名前に Noto Serif JP（Google Fonts）を割り当てて明朝体で表示します（サイトの CSS は変更していません）。
游明朝が入っている PC ではそのまま游明朝で表示されます。代替フォントを使わない場合は `?font=local` を付けてください。
代替フォントの読み込みにはインターネット接続が必要です。

## 画面の環境

- Windows 11 のデスクトップ：Figma（デスクトップアプリ：ファイルのタブとウィンドウボタン）、VS Code、Chrome。タスクバーの時計は 2026/04/22 15:36 から進みます
  （開発サーバーのログの時刻も同じ時計）
- VS Code は今の既定の見た目です（Dark Modern テーマ、VS Code 自身のアイコン codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。
  `.astro` は Seti にアイコンがないため、Seti の標準のファイルアイコンになります
- タブのファビコン：ne-auberge.jp・開発サーバー・view-source はファビコンがないため Chrome 本体のアイコン、Sveltia CMS は自身のロゴ（設定にロゴがないとき）、Google のツールと検証ツールは各サービスのもの
- ぼかし：Tag Manager のアカウント ID・コンテナ ID、Analytics のプロパティ ID（アドレスバー）、`git push` の出力のリポジトリ所有者名
- デプロイ完了は、Cloudflare Pages の通知メールが Gmail（Chrome）の Windows 通知として届く形
- サイトに「GOOD DESIGN AWARD 2026」のロゴがあるため、4 月の日付と前後関係が合いません（サイトの内容は本番のまま）

## 演出であるもの

- デザインツール（Figma）・コードエディタ（VS Code）・ブラウザの枠（Chrome）・Tag Manager・Tag Assistant・Analytics の画面は、
  作業の流れを伝えるための簡易的な再現です。実際の画面と細部まで同一ではありません（Google のツールはログインが必要なため、本物の画面を取り込んでいません）。
  Sveltia CMS・スキーマ マークアップ検証ツール・ページのソースは本物の画面です（上の「本物の画面」）。
  タスクバーとタイトルバーのアプリアイコン（Figma・VS Code・Chrome ほか）、Google のツールのアイコン・ファビコンは本物です（`../../README.md` の「本物のアイコン」）。
- **コードエディタのソースコード**：リポジトリは公開されていないため、本番の出力から復元した再現です。
  コンポーネントの `<style>` は本番 CSS の各コンポーネント分（スコープ属性を外して整形）、HomeSections / Header / Footer のマークアップは本番の HTML を整形したもの、
  Hero.astro・Base.astro・`[...slug].astro` などは、本番と同じ出力になるように書き起こしたものです。ファイル構成・ファイル名も推定です。
- CMS の入力値のうち、CTA の文言（宿泊CTA・レストランCTA）は推定です（予約 URL・問い合わせ先・title / description は本番の値）。
- Tag Manager の概要画面の「計測設計」の表は、公開中のコンテナのタグ構成（GA4 の Google タグ 3 つ・Meta Pixel）と GA4 の標準の拡張計測から作った想定です。
- GTM のタグ名・「バージョン 4」などの番号、DebugView のイベントの時刻・パラメータ、ターミナルの出力（コミット ID など）は演出です。
- 4 つのミスとその修正、要素が追加される順序や速さは演出です。

## サイトを更新した場合

本番サイトの内容を変更したら、スナップショットを取り直すとデモにも反映されます（movie/ フォルダで実行。Node.js 22.18 以上と Google Chrome）。

```
npm run snapshot -- ne-auberge                               サイト（HTML・CSS・写真・robots.txt・llms.txt・CMS 設定・各ページの title / description）
node tools/snapshots/ne-auberge/capture-view-source.js       ページのソース（Chrome の view-source）
node tools/snapshots/ne-auberge/capture-validator.js         スキーマ マークアップ検証ツールの各画面
node tools/snapshots/ne-auberge/capture-cms.js               Sveltia CMS の各画面
npm run verify -- ne-auberge                                 最後まで再生して確認
```

`js/site-snapshot.js`・`js/site-source.js` と `assets/` が更新されます（写真は WebP に変換）。ソースが変わったときは、その後の 3 つも実行してください。

文章を変えた場合の注意：

- デザインツールで入力する文字（キャッチコピー・サブコピー）は `js/scenario.js` の `JA.lead` / `JA.sub` に、ローマ字と変換候補で書いてあります。
  本番の文章と一致しなくなった場合は、ローマ字・変換候補を書き換えてください
- CMS で入力する title は `JA.title`、llms.txt で入力する見出しは `JA.llmsHead` です（llms.txt の見出しが一致しない場合は自動で貼り付けに切り替わります）

## ファイル構成

| パス | 内容 |
| --- | --- |
| `index.html` | デモ画面（これを開く） |
| `css/demo.css` | デスクトップ・各アプリ・字幕帯などの見た目 |
| `js/site-snapshot.js` | 本番サイトのスナップショット（自動生成） |
| `js/site-source.js` | 本番サイトが配信している HTML そのもの（ページのソース・検証ツールに使う。自動生成） |
| `js/site-frame.js` | スナップショットを各画面（デザインフレーム / 開発サーバー / 公開サイト）に描画する処理 |
| `js/cms-snapshot.js` / `js/validator-snapshot.js` / `js/view-source-snapshot.js` | 本物の Sveltia CMS・スキーマ マークアップ検証ツール・Chrome のページのソースの各画面（自動生成） |
| `js/real-ui.js` | 上の 3 つを iframe に表示し、画面の切り替え・ホバー・入力を行う処理 |
| `../../shared/engine.js` | カーソル、ウィンドウ、字幕帯、ミスの枠、キー表示、日本語入力（IME）の再現（旅わがの動画と共通） |
| `js/code-files.js` | コードエディタに表示するファイル（本番の出力から復元）とシンタックスハイライト |
| `js/apps.js` | デザインツール・コードエディタ・ブラウザ・Tag Manager・Analytics などの画面と、CMS・検証ツール・ページのソースの操作 |
| `js/scenario.js` | 操作の台本（入力するローマ字・変換候補、ミスの場面、流れ・タイミング） |
| `assets/` | 本番の写真・ロゴ・CSS のコピー（写真は WebP）、`assets/sveltia/`・`assets/validator/` は CMS・検証ツールのフォント |
| `tools/snapshots/ne-auberge/update-snapshot.js` | スナップショット再取得用スクリプト（`npm run snapshot -- ne-auberge`） |
| `tools/snapshots/ne-auberge/capture-*.js` | 本物の画面の取り込み（cms / validator / view-source） |
