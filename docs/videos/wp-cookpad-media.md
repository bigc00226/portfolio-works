# 制作プロセス デモ — クックパッド株式会社（info.cookpad.com）WordPress おしらせ（ブログ・オウンドメディア）の構築

> 一覧ページ（`/`）と再生ページ（`/watch/wp-cookpad-media`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-cookpad-media/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 7 分 13 秒 です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
クックパッド株式会社のコーポレートサイト（https://info.cookpad.com/）の「おしらせ」（/news）を **WordPress の記事投稿システムとして作る工程** を順番に再生します。

**投稿タイプ「おしらせ」 → カテゴリーの整理 → 記事の移行・入稿 → 記事テンプレート → 一覧ページ → 公開中のサイト**

## 最初に確認していただきたいこと

- info.cookpad.com は実在の企業（クックパッド株式会社）のサイトです。このデモは、ユーザーの制作実績の一覧（「8. ブログ・オウンドメディア構築」）にある
  このサイトの「おしらせ」を WordPress で作るとしたらどう進めるか、という **工程の再現** で、実際の制作作業の記録ではありません。
- **公開サイトの仕組みについて分かっていること・分かっていないこと**：公開サイトのページは手作りの HTML（`/assets/styles/main.css`）として配信されていて、
  HTML に `wp-content` は出てきません。一方で、おしらせ一覧の `<body>` のクラスが `type-pr_news archive`、RSS（`/news/feed`）が WordPress の形式
  （チャンネル名「おしらせ &#8211; クックパッド株式会社」、記事の guid が日本語スラッグの `/news/%e6%96%b0…`）、画像の URL が
  `cf.cpcdn.com/info/assets/wp-content/uploads/…`、カテゴリーページのタイトルが「出版 | おしらせカテゴリー | クックパッド株式会社」です。
  ここから、おしらせは WordPress の投稿タイプ `pr_news`（ラベル「おしらせ」）とタクソノミー（ラベル「おしらせカテゴリー」）で管理されていると考えて作っています。
  **公開サイトで実際にどの CMS・どの設定が使われているかは公開されておらず、確認できていません。**
  タクソノミーのスラッグ `pr_news_category`、外部リンクのフィールド名 `news_url` はデモで付けた名前です。
- **本物のもの**
  - ブラウザに出るサイト（開発サイト `localhost:8888` と本番 `info.cookpad.com`。おしらせ一覧 `/news`、カテゴリー「出版」`/news/category/publish`、
    記事「新機能についていただいたご意見と、今後の取り組みについて」、存在しないカテゴリーの 404 ページ、PC 幅 1920px）は、公開中のサイトの画面をそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
  - おしらせのデータ：一覧のタイトル・日付・カテゴリー・リンク先（クックパッドニュース `news.cookpad.com`・PR TIMES など）・画像の URL は、公開サイトの一覧
    全 89 ページ（883 件）から取ったものです（`tools/snapshots/wp-cookpad-media/fetch-news.js` → `news-data.json` → `js/news-data.js`）。
    VS Code に出る `data/news.csv` の行と、管理画面のおしらせ一覧（882 件）はこのデータです。件数（リリース 522・お知らせ 63・出版 296）も公開サイトの件数です（動画の日付 11 月 6 日より後の 1 件を除く）。
  - WordPress の管理画面は **すべて本物の WordPress 7.1.4 の画面** です（日本語。下の「WordPress の画面について」）。Advanced Custom Fields（無料版、wordpress.org）とその日本語訳も本物です。
  - 3 つのミスのうち 2 つは WordPress 自身の動きをそのまま見せています：`show_in_rest` のない投稿タイプはクラシックエディターで開くこと、
    スラッグを空欄にして追加したカテゴリーのスラッグが名前の日本語（URL では `%e5%87%ba%e7%89%88`）になること。
    外部リンクの記事「『野菜を健康的に食べる。ひと皿のマリネ』発売！」のスラッグ（`%e3%80%8e%e9%87%8e…%e7%99%ba%e5%a3%b2`）は、取り込みで WordPress が作ったもので、公開サイトの RSS の guid と同じです。
  - 404 ページ（「Page not found | クックパッド株式会社」、本文は `404`）は、公開サイトの実際の 404 ページ（日本語スラッグのカテゴリー `/news/category/%e5%87%ba%e7%89%88` を開いたもの）です。
  - タブのタイトルとファビコン（info.cookpad.com/favicon.ico）は公開サイトのものです。
- **再現のもの**
  - テーマのソース：VS Code に出るテーマ `cookpad-info`（`functions.php` `inc/post-types.php` `inc/fields.php` `inc/news.php` `single-pr_news.php`
    `archive-pr_news.php` `template-parts/news/item.php` など、`js/files.js`）は、公開サイトのマークアップ（`#main_content[data-page="news"]`
    `.nav_news_category` `.block_number` `.filter_year` `.list_news li.n` `#pager_news` `#article_header` `#article_body` …）を出力するように作ったものです。
    公開サイトはアセットをルートの `/assets/` から配信していますが、デモのテーマではテーマのフォルダーの `assets/` にしています。
  - 開発環境（wp-env、`.wp-env.json`・`package.json`・ターミナルの出力）、旧サイトからの移行（`data/news.csv`・`scripts/import-news.php`・取り込みの出力）、
    作業の順番、3 つのミス。取り込みにかかった時間（2 分 51 秒）とアイキャッチ画像の件数は、スクリプトの内容から想定したものです。
  - 管理画面のおしらせには、本文は入れていません（一覧に出るタイトル・日付・カテゴリー・外部リンクだけ。本文は動画で開く 1 件だけ公開サイトの本文）。画像も取り込んでいません（管理画面の一覧には出ないため）。
  - 11 月 11 日の書籍のおしらせ：動画の日付（2026 年 11 月 6 日）では未公開の、公開サイトの最新のおしらせ（『クックパッド 大根・白菜極みレシピ』発売！、
    リンク先 `https://news.cookpad.com/articles/67080`、画像は公開サイトの一覧のもの）を予約投稿として入稿しています。取り込みの日（2026 年 11 月 18 日）より
    後の日付でないと WordPress は予約投稿にしないため、取り込みでは 2026 年 12 月 11 日 15:00 で予約し、画面の日付を 11 月 11 日に書き換えています（`capture-wp.js` の `fixDates`）。
    公開サイトでの実際の公開時刻は 15:07 です（RSS）。動画の中の公開サイトの一覧からは、このおしらせを外しています（件数 883 → 882。`js/apps.js` の `before1111`）。
  - 開発中の状態（一覧の全部の記事が記事ページへリンクしている・外部リンクの記事を開くと本文が空・一覧のテンプレートがないカテゴリーページ）は、
    取り込んだ公開サイトの画面を書き換えて再現しています（下の「本番サイトとの同一性について」）。
- 個人情報：管理画面のユーザーは取り込み用の使い捨ての管理者（`admin`）です。公開サイトの記事本文にある広報窓口のメールアドレスは、公開サイトに載っている会社の窓口のため、ぼかしていません。
- クックパッド株式会社は実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。
- 同じカテゴリーの参考サイト michishirube-seitai.com（整体院道しるべ）は、有料テーマ TCD「MIKADO」（`mikado_tcd071`）のブログです。有料テーマはインストールできないため、この動画には出てきません。

## 録画の手順

1. `public/videos/wp-cookpad-media/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/wp-cookpad-media/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（WordPress の画面・サイトの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「WordPress のおしらせ：投稿タイプ・カテゴリー・外部リンク・記事テンプレート・一覧ページ（11/11 の書籍は予約投稿済み）」と出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 投稿タイプ「おしらせ」 | VS Code・Chrome（管理画面） | `inc/post-types.php` に `register_post_type`（`pr_news`、一覧 `/news`、記事 `/news/{スラッグ}`、アイキャッチ画像・抜粋）を入力、`functions.php` で読み込み → F5 で管理画面のメニューに「おしらせ」→ 投稿を追加 | **クラシックエディターが開く**：`show_in_rest` がない投稿タイプは REST API に出ず、ブロックエディターで編集できない → `'show_in_rest' => true` → F5 でブロックエディター。設定 › パーマリンクで「変更を保存」（リライトルールの登録） |
| 2 カテゴリーの整理 | VS Code・Chrome | `register_taxonomy`（`pr_news_category`、ラベル「おしらせカテゴリー」、`/news/category`。投稿タイプより先に登録）→ おしらせカテゴリーの画面でリリース・お知らせ・出版を追加（スラッグは空欄） | **旧サイトの URL が 404**：`/news/category/publish` が Page not found。スラッグが名前の「出版」のまま（URL は `%e5%87%ba%e7%89%88`）→ クイック編集で `publish` / `announce` / `release` に → 404 ではなくなる（一覧の表示はまだ） |
| 3 記事の移行・入稿 | VS Code＋ターミナル・Chrome（管理画面） | `.wp-env.json` の Advanced Custom Fields、`inc/fields.php`（外部リンク `news_url`、貼り付け）→ `data/news.csv`（882 件）と `scripts/import-news.php` → `npm run import`（取り込み中は早送り）→ おしらせ一覧 882 件 → 投稿を追加：タイトル（原稿から貼り付け）・カテゴリー「出版」・アイキャッチ画像（表紙）・外部リンク（貼り付け）・公開日時 11 月 11 日 15:00 → 予約投稿 → 一覧の先頭に「予約済み」 | |
| 4 記事テンプレート | VS Code・Chrome（開発サイト） | `single-pr_news.php`（骨組みは貼り付け、カテゴリーと日付の部分を入力）→ 本文のある記事（2026.03.22 のお知らせ）を開いて確認 | |
| 5 一覧ページ | VS Code・Chrome（開発サイト） | `inc/news.php`（10 件ずつ・`/news/2026` のリライトルール）、`archive-pr_news.php`・`taxonomy-pr_news_category.php`・`template-parts/news/pager.php`・`filter-year.php`（貼り付け）、`template-parts/news/item.php` を入力 → `/news`（882 件、ページ送り） | **外部リンクの記事が中身のない記事ページに**：書籍のおしらせを開くと本文が空。`item.php` が `the_permalink()` のまま → `cookpad_info_news_link()`（外部リンクがあればその URL・別タブ、なければ記事ページ。RSS のリンクも同じ関数）を入力、`item.php` のリンクを差し替え → 書籍は `news.cookpad.com` へ、本文のある記事は記事ページへ（左下のアドレス表示）→ 年の選択 2026（4 件）→ カテゴリー「出版」（296 件） |
| 公開中のサイト | Chrome | info.cookpad.com のトップ（新着おしらせ）→ `/news` → 出版 → 記事ページ → 一覧にもどる | |

### 日本語入力（Microsoft IME と同じ流れ）

`register_post_type` のラベル「おしらせ」、`register_taxonomy` のラベル「おしらせカテゴリー」、管理画面で追加するカテゴリー名（リリース・お知らせ・出版）は、
ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。
おしらせのタイトルと外部リンクの URL は、原稿からの貼り付け（Ctrl+V）です。

## キー操作 / URL パラメータ

| 操作 | 内容 |
| --- | --- |
| Space | 再生 / 一時停止 |
| R | 最初から |
| C | 字幕の表示 / 非表示 |
| H | ヒントを隠す |
| `?t=83` | 83 秒の位置から |
| `?from=4` | 4 番目の場面から |
| `?speed=1.3` | 1.3 倍速 |
| `?captions=0` | 字幕なし |

## 本番サイトとの同一性について

- サイトの画面：公開サイトを 1920px 幅の Chrome で開き、テーマのスクリプトが動いたあとの HTML とスタイルシート・画像を取り込んだものです（`npm run snapshot -- wp-cookpad-media`。画像は WebP）。
  動画の中ではスクリプトは動かないため、年の選択・ページ送りは操作していません。
- 開発サイトの途中の状態（`js/apps.js` の `StoreFrame.STATES`）：
  - `before1111`：11 月 11 日のおしらせを一覧から外し、件数を 1 減らす（動画の日付 11 月 6 日にはまだ出ていないため）
  - `internalLinks`：修正前の一覧。外部リンクの記事のリンクを記事ページ（`/news/{スラッグ}`、同じタブ）にする
  - `emptyArticle`：外部リンクだけの記事（マリネの書籍）の記事ページ。取り込んだ記事ページの見出し・カテゴリー・日付を差し替え、本文を空にする
  - `fallback`：一覧のテンプレートがまだない `/news/category/publish`（テーマの `index.php`）。404 ページから `404` の見出しを外したもの
- リンクにポインターを乗せたときの左下のアドレス表示（Chrome のステータスバブル）は、動画で描いています（`css/video.css` の `.cp-status`）。

## WordPress の画面について

管理画面は、`tools/snapshots/wp-cookpad-media/capture-wp.js` が WordPress Playground（ブラウザの中で動く本物の WordPress と PHP）で
実際に操作した画面を取り込んだものです（`tools/wp/playground.js`、`js/wp-snapshot.js`・`assets/wp/`）。

- 環境：WordPress 7.1.4（日本語）、PHP 8.3、Advanced Custom Fields（wordpress.org の無料版、日本語の言語パック）、テーマは `js/files.js` のファイルそのもの。
  サイト名「クックパッド株式会社」、キャッチフレーズ「毎日の料理を楽しみにする」（公開サイトの RSS のチャンネルの説明）。
- テーマのファイルは動画と同じ順に書き換えています：`show_in_rest` なしの投稿タイプ（→ クラシックエディター）→ `show_in_rest` あり（→ ブロックエディター）→
  設定 › パーマリンクを保存 → タクソノミーを追加し、カテゴリーをフォームから 1 つずつ追加（スラッグは空欄）→ クイック編集でスラッグを修正 →
  ACF のフィールド → 882 件の取り込み → ブロックエディターで新しいおしらせ（タイトル・カテゴリー・アイキャッチ画像・外部リンク・日時）を予約投稿。
- 書き換えたもの（`tools/wp/playground.js` の共通のルール）：Playground のアドレス → `http://localhost:8888`、取り込みの日付 → 動画の日付（2026 年 11 月 6 日）、
  動画で入力する欄 → 同じ見た目の入力欄。予約投稿の日付（上の「再現のもの」）。
- 管理画面の「投稿を追加」「投稿を検索」などの文言は、投稿タイプに `label` だけを指定したときの WordPress の既定の表示です。

## 画面の環境

- Windows 11、Chrome（タブ：WordPress の管理画面・開発サイト・公開サイト）、VS Code（Dark Modern、PHP はタブ 4）、ターミナル（PowerShell）
- 開発環境：wp-env（`http://localhost:8888`、Docker）、WP-CLI（`npm run import` → `wp eval-file scripts/import-news.php`）
- タスクバーの日付：2026 年 11 月 6 日（13:12 開始。取り込みの待ち時間は早送り）

## ファイル

| ファイル | 内容 |
| --- | --- |
| `public/videos/wp-cookpad-media/index.html` | 動画のページ |
| `public/videos/wp-cookpad-media/js/config.js` | 動画の設定（開始時刻・章・取り込むページ） |
| `public/videos/wp-cookpad-media/js/files.js` | VS Code に出るプロジェクト（テーマ・CSV・取り込みスクリプト） |
| `public/videos/wp-cookpad-media/js/news-data.js` | 公開サイトのおしらせの一覧（生成：`build-data.js`） |
| `public/videos/wp-cookpad-media/js/apps.js` | 開発サイトの途中の状態、ステータスバブル |
| `public/videos/wp-cookpad-media/js/scenario.js` | 動画の進行 |
| `public/videos/wp-cookpad-media/js/site-snapshot.js`・`assets/site/` | 公開サイトの画面（生成：`npm run snapshot -- wp-cookpad-media`） |
| `public/videos/wp-cookpad-media/js/wp-snapshot.js`・`assets/wp/` | WordPress の管理画面（生成：`capture-wp.js`） |
| `tools/snapshots/wp-cookpad-media/fetch-news.js` | 公開サイトのおしらせ一覧（全ページ）→ `news-data.json` |
| `tools/snapshots/wp-cookpad-media/build-data.js` | `news-data.json`・`article-20260322.html` → `js/news-data.js` |
| `tools/snapshots/wp-cookpad-media/capture-wp.js` | WordPress の管理画面の取り込み（→ `node tools/webp.js wp-cookpad-media`） |
