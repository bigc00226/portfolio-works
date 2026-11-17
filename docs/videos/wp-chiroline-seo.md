# 制作プロセス デモ — カイロライン三鷹整体院（chiroline-mitakain.com）WordPress サイトの SEO 対策・検索順位改善

> 一覧ページ（`/`）と再生ページ（`/watch/wp-chiroline-seo`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-chiroline-seo/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 5 分 6 秒 です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
カイロライン三鷹整体院のサイト（https://chiroline-mitakain.com/ 、WordPress・テーマ Arkhe）に **SEO 対策（内部 SEO・メタタイトル／ディスクリプション・
構造化データ・サイト構造と内部リンク）を施す工程** を順番に再生します。

**現状の確認 → SEO SIMPLE PACK → タイトル・ディスクリプション → 構造化データ → カテゴリー・内部リンク → 公開中のサイト**

## 最初に確認していただきたいこと

- chiroline-mitakain.com は **WordPress で運営されている実在の整体院のサイト** です（親テーマ Arkhe 3.12.0 ＋ 子テーマ `arkhe_child`、
  SEO SIMPLE PACK 3.6.2、Arkhe Blocks Pro・Arkhe Toolkit）。このデモは「このサイトに SEO 対策をする」としたらどう進めるか、という
  **工程の再現** で、実際の作業の記録ではありません。実在の事業者のサイトなので、**ローカルでの閲覧・録画用** にとどめてください。
- **本物のもの**
  - ブラウザに出るサイト（トップ・料金情報・コラムの記事「なぜあなたの腰痛は繰り返すのか？…」・カテゴリー「セルフケア・ストレッチ」、PC 幅 1920px）は、
    公開中のサイトの画面をそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
  - **ページのソース**（Ctrl+U の画面）の中身は、公開中のページの HTML そのものです（`js/sources.js`。2026-11-18 に取得したトップ・患者さんの声・記事）。
    動画の最後に出る SEO SIMPLE PACK の出力（title・description・canonical・OGP・GA4）と JSON-LD（WebSite／Article・BreadcrumbList）は本番の出力です。
  - WordPress の管理画面は **すべて本物の WordPress の画面** です（日本語。下の「WordPress の画面について」）。SEO SIMPLE PACK は
    「新規プラグインを追加」から実際に検索・インストール・有効化したもので、設定画面・メタボックス・カテゴリーの編集画面は、その場で実際に保存した状態です。
  - JSON-LD の確認は Chrome の DevTools のコンソールで `JSON.parse()` に通す方法です。表示されるエラー文
    （「Expected double-quoted property name in JSON at position 1256 (line 32 column 2)」）と、読み込めた配列（Article・BreadcrumbList の 2 件）は、
    画面のその JSON-LD を実際に `JSON.parse()` した結果をそのまま出しています（V8 のメッセージ）。
  - 2 つのミスはどちらも実物の動きです：SEO SIMPLE PACK を入れた直後は初期設定で **「カスタム投稿タイプ」のアーカイブページに noindex** が付くこと
    （SEO SIMPLE PACK がそのとき実際に出力した `<meta name="robots" content="noindex">`。本番の `/voice/`・`/symptoms/` はインデックス可）、
    配列のあとの余分な「,」で `JSON.parse()` が構文エラーになること。
- **再現・演出のもの**
  - 作業の順番・内容とミス、作業メモ（`docs/seo-memo.md`）。作業前の状態（SEO SIMPLE PACK がない・JSON-LD がない・カテゴリーのスラッグが日本語）は
    「今の本番から作業分を除いたもの」として作っています（実際の過去の状態は確認できません）。作業前のトップページのソースは、本番の HTML から
    SEO SIMPLE PACK の出力と JSON-LD を除き、title と canonical を WordPress 自身の出力（キャプチャ時の実際の出力）に置き換えたものです。
  - 子テーマのソース（`arkhe_child`）は公開されていないため、**動画用に書いたもの** です。`inc/structured-data.php` は本番と **同じ JSON-LD を出力する**
    ように書いてあります（項目・順番・インデントまで同じ）。本番でこの JSON-LD を出しているのが子テーマなのか Arkhe Toolkit などなのかは公開情報から分かりません。
  - ローカル環境（wp-env・`localhost:8888`）、`git commit`・`scp` とその出力、サーバーのパス。ローカルのページのソースは本番の HTML のアドレスを
    `localhost:8888` にしたものです。
  - SEO SIMPLE PACK はキャプチャ時点の最新版（3.7.0）で、本番は 3.6.2 です。Arkhe Blocks Pro（有料）と Arkhe Toolkit・Arkhe CSS Editor（LOOS の配布、
    wordpress.org にない）は入れていません（無料版の Arkhe Blocks も 2025 年に wordpress.org での配布が終わっています）。動画に出る管理画面はこれらに依存しません。
  - 料金情報の固定ページの本文（エディターに出る部分）は、本番ページの文章をコアのブロック（見出し・段落・リスト）に入れたものです（本番は Arkhe Blocks Pro のレイアウト）。
  - Google Search Console などログインが必要な画面は出していません。Schema Markup Validator（validator.schema.org）は、制作時にこのマシンからの
    自動アクセスに reCAPTCHA の確認画面が出たため使っていません（回避はしていません）。代わりに上のコンソールでの確認にしています。
  - プラグインを有効化した直後のプラグイン一覧には SEO SIMPLE PACK だけが並びます（本番にある Arkhe Blocks Pro などは入れていないため。画面に出るのは一瞬です）。
- 同じカテゴリーのもう 1 つの参考サイト arakidashika.com（歯科医院）は、制作時にこのマシンから接続できなかったため使っていません。

## 録画の手順

1. `npm run dev` で起動し、`http://localhost:3000/watch/wp-chiroline-seo` を開く（または `public/videos/wp-chiroline-seo/index.html` を直接開く）。
2. ブラウザを全画面（F11）にし、画面録画を開始してから Space で再生。
3. 1920×1080 で作ってあります。ほかの解像度では全体が縮小・拡大されます。

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 現状の確認 | VS Code（作業メモ）・Chrome | 作業メモ（現状・対応）→ 公開中のトップページで Ctrl+U：title が「サイト名 &#8211; キャッチフレーズ」（WordPress の標準）、description・OGP なし、canonical だけ、`</body>` まで JSON-LD なし | |
| 2 SEO SIMPLE PACK | Chrome（管理画面）・VS Code | プラグイン › 新規プラグインを追加で「SEO SIMPLE PACK」を検索 → 今すぐインストール → 有効化 → SEO PACK › 一般設定（区切り文字「\|」、トップの title 形式とプレビュー）→ トップの description を作業メモからコピーして貼り付け → 設定を保存 → Googleアナリティクスのタブで GA4 の測定 ID → 保存 → ソースを再読み込み（SEO SIMPLE PACK の出力・title） | |
| 3 タイトル・ディスクリプション | Chrome | 患者さんの声 `/voice/` のソース → 一般設定 › その他アーカイブ →（修正）→ 固定ページ › 料金情報 → エディター下のメタボックス「SEO SIMPLE PACK 設定」で description を入力（IME）→ 保存 | **noindex**：SEO SIMPLE PACK の初期設定「カスタム投稿タイプのアーカイブページをインデックスさせない＝はい」で、患者さんの声・症例一覧の一覧ページに `<meta name="robots" content="noindex">` → 「いいえ」にして保存 → ソースから noindex が消える |
| 4 構造化データ | VS Code・Chrome（ローカル・DevTools）・ターミナル | `functions.php` に `require_once`、`inc/structured-data.php` を作成（フックと WebSite は貼り付け、Article とカテゴリーの BreadcrumbList を入力）→ ローカルの記事ページ（`localhost:8888`）のソースで JSON-LD を確認 → DevTools のコンソールで `JSON.parse()` →（修正）→ `git commit` → `scp` で子テーマを本番へ | **構文エラー**：BreadcrumbList の `itemListElement` の配列のあとに余分な「,」→ `Uncaught SyntaxError: Expected double-quoted property name in JSON at position 1256 (line 32 column 2)` → 「,」を削除して保存 → F5、↑ で同じ式 → `(2) [{…}, {…}]`（Article・BreadcrumbList） |
| 5 カテゴリー・内部リンク | Chrome（管理画面・本番）・VS Code | 投稿 › カテゴリー（スラッグが日本語、説明が空）→ セルフケア・ストレッチを編集：スラッグ `self-care`、説明文を作業メモから貼り付け → 更新 → 残り 6 つも同様（一覧）→ 本番のカテゴリーページ `/column/category/self-care/`（冒頭の説明文、ソースの meta description）→ 記事を開いてパンくず（ホーム › カテゴリー） | |
| 公開中のサイト | Chrome | 本番の記事ページのソースで JSON-LD → DevTools のコンソールで `JSON.parse()`（Article・BreadcrumbList）→ トップページ | |

### 日本語入力（Microsoft IME と同じ流れ）

料金情報のディスクリプション（「カイロライン三鷹整体院の施術料金です。…」）は、ローマ字入力 → 変換 → 確定の流れで入力します。
トップページとカテゴリーの説明文は、作業メモ（院長確認済みの文言）からコピーして貼り付けます。

## キー操作 / URL パラメータ

Space＝再生 / 一時停止、R＝最初から、C＝字幕の表示切替、H＝ヒントを隠す。`?t=83`（秒）・`?from=4`（シーン 4 から）・`?speed=1.3`・`?captions=0`。

## 本番サイトとの同一性について

- サイトの画面：`npm run snapshot -- wp-chiroline-seo` で公開中のページを取り込み直せます（`js/config.js` の `snapshot`）。
  本番のページが参照している画像のうち 8 つ（`/wp-content/themes/images/…`）は本番でも 404 で、画面にも出ていません（本番と同じ）。
- ページのソース：`tools/snapshots/wp-chiroline-seo/live-src/*.html`（curl で取得した HTML そのもの）から `node tools/snapshots/wp-chiroline-seo/build-sources.js`。
- title・description は本番と同じ文字列です（トップ「カイロライン三鷹整体院 | 三鷹で肩こり・腰痛・猫背を根本改善する整体」、料金情報・カテゴリーの説明文も本番の文言）。

## WordPress の画面について

`tools/snapshots/wp-chiroline-seo/capture-wp.js` が WordPress Playground（ブラウザの中で動く本物の WordPress ＋ PHP。アカウント不要）で
サイトを本番と同じ構成（サイト名・キャッチフレーズ、パーマリンク `/column/%postname%/`、固定ページ・投稿・カテゴリー＝本番の REST API の公開情報、
親テーマ Arkhe ＋ 子テーマ `arkhe_child`、カスタム投稿タイプ 症例一覧 `/symptoms/`・患者さんの声 `/voice/`）にし、動画の操作を実際に行って各画面を取り込みます
（`js/wp-snapshot.js`・`assets/wp/`）。そのときの WordPress のフロントの出力（title・robots・description）も `WP_SNAPSHOT.data` に残しています。
変えているのは、Playground のアドレス → `https://chiroline-mitakain.com`、日付 → 2026-11-09（動画の時計）、入力欄 → 動画で入力を描くための同じ見た目の箱、だけです。
管理画面の表示名は「カイロライン三鷹整体院」（本番の投稿者名）にしています。

## 演出であるもの

- 作業の順番・字幕・作業メモ、ローカル環境・git・scp、子テーマのソース（上記）。
- 管理画面は本番のアドレスで見せていますが、取り込んだのは Playground の WordPress です。
- view-source の画面は Chrome のページのソース表示（行番号・色分け・「行を折り返す」）を描いたものです。中身は実際の HTML です。

## ファイル構成

```
public/videos/wp-chiroline-seo/
  index.html             … 動画のページ
  css/video.css          … ページのソース表示・コンソールの色
  js/config.js           … 設定（スナップショットの対象ページ）
  js/files.js            … VS Code に出るファイル（子テーマ・作業メモ）
  js/apps.js             … ページのソース（SRC・VSRC）、DevTools のコンソール（CON）、タブのアイコン
  js/scenario.js         … タイムライン
  js/site-snapshot.js    … 公開中のサイト（生成）        assets/site/   … その画像
  js/wp-snapshot.js      … WordPress の管理画面（生成）    assets/wp/     … その画像
  js/sources.js          … 公開中のページの HTML（生成）
tools/snapshots/wp-chiroline-seo/
  capture-wp.js          … WordPress の画面の取り込み
  build-sources.js       … js/sources.js
  live-data.json         … 本番の固定ページ・投稿・カテゴリー（REST API の公開情報）
  live-src/*.html        … 本番の HTML（ページのソース用）
```
