# 制作プロセス デモ — GMOアリーナさいたま（www.saitama-arena.co.jp）WordPress 独自プラグイン・PHP 機能開発

> 一覧ページ（`/`）と再生ページ（`/watch/wp-saitama-arena-plugin`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-saitama-arena-plugin/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 8 分 09 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
GMOアリーナさいたまの公式サイト（https://www.saitama-arena.co.jp/）に **独自プラグイン「Arena Events Sync」を作る工程** を順番に再生します。
催事管理システム（イベントの社内システム）の API からイベントを取り込み、イベントスケジュール（`/schedule/`）の投稿にして、
トップページの「本日開催のイベント」に出し、毎朝自動で同期するプラグインです。

**要件・設計 → API クライアント → 管理画面・設定 → 同期とエラー処理 → 本日開催のイベント → 自動化・コードチェック → 本番へ反映 → 公開中のサイト**

11/10 の「サーバー移転」（`wp-saitama-arena-migration`）の 3 日後の作業として、同じ構成（マルチサイト 3 サイト、新サーバー `web01`）で続けています。

## 最初に確認していただきたいこと

- www.saitama-arena.co.jp は **WordPress で運営されている実在の施設のサイト** です（株式会社さいたまアリーナ）。このデモは「このサイトに、
  社内システムとイベントを連携するプラグインを作る」としたらどう進めるか、という **工程の再現** で、実際の開発の記録ではありません。
  公開サイトがイベントをどう管理しているかは公開されていません。
- **本物のもの**
  - **プラグインは本当に動くコード** です（`js/plugin-src.js`。PHP 約 910 行：本体・API クライアント・取り込み・管理画面・同期ログの一覧・WP-CLI・本日開催のイベントと REST API）。
    VS Code に出るファイルと、WordPress の管理画面を取り込んだときに WordPress に入れて動かしたファイルは **同じソース** です。
  - WordPress の管理画面は **すべて本物の WordPress 7.1.4 の画面** で、このプラグインの各段階の実際の出力です（下の「WordPress の画面について」）。
    1 つ目のミスの「このサイトで重大なエラーが発生しました。」は、最初に書いたコードで「今すぐ同期」を押したときに WordPress が実際に出した画面、
    debug.log の `PHP Fatal error: Uncaught TypeError: count(): Argument #1 ($value) must be of type Countable|array, null given` も実際に記録された内容です。
    API エラーの通知・同期ログ・投稿一覧の「開催日」（1 日早い状態 → 直した状態）も、そのコードが実際に出した画面です。
  - イベントのデータ：`/schedule/` の「2026年11月のイベント」の 12 件（タイトル・開催日・入場料・お問合せ・カテゴリー・会場タイプ・リンク・画像。確認日 2026-11-18）。
    「本日開催のイベント」のマークアップ（`.daily-event` `.event-list_item` …）は公開中のトップページのものです。
  - サイトの構成（WordPress マルチサイト：`/`・`/schedule/`・`/news/`、テーマのスラッグ `saitamaarena`）は公開ページから分かることで、移転の動画と同じです。
  - ブラウザに出るサイト（トップ・`/schedule/`、PC 幅 1920px）は公開中の画面をそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
- **再現のもの**
  - **催事管理システムとその API**（`https://saiji.sa.internal/api/v1`、Bearer 認証、項目名、イベント ID `EV2611-024` など）は架空です。
    WordPress の画面を取り込むときは、その API への通信を WordPress の中で受け止めて、上の 12 件を返しています（`pre_http_request`、取り込み用。画面には出ません）。
    API キー（`sk_live_…`）も架空で、画面では • で表示しています。
  - テーマのテンプレート `template-parts/daily-event.php` は、公開中のマークアップを出すように書いたものです（本物のテーマのファイルは公開されていません）。
  - ターミナルの出力：WP-CLI・wp-env・PHPCS・Composer・git の出力の書式は実際のものに合わせ、同期の件数・テーブルの中身は取り込んだ WordPress で実際に
    同期した結果から作っています。cron の一覧のプラグイン以外の行、PHPCS の時間・メモリ、コミットの ID・行数、サーバーのパスとユーザーは架空です。
    PHPCS の指摘は WordPress Coding Standards 3 が出す指摘の文言・コードです（このデモでは PHPCS を実際には実行していません）。
    API の動作確認（`Invoke-RestMethod` の表）は、取り込みで API の代わりに返したデータ（`events.json`）から作っています。
    debug.log の 4 行は、取り込んだ WordPress に実際に記録された行です（日時とパスだけ動画の環境に合わせています）。
  - 作業の順番、3 つのミス（API の応答を確認していない・gmdate で日付が 1 日ずれる・$_GET のサニタイズと出力のエスケープ）。どれも実際に起きる動きですが、実際の開発でこのミスがあったわけではありません。
  - 通知メールは送っていません（送り先 `web-team@saitama-arena.example` は架空。画面に受信の様子は出しません）。
- 個人情報：画面に個人の情報は出ません。管理者 `sa_webadmin` は架空です。
- 株式会社さいたまアリーナは実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/wp-saitama-arena-plugin/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/wp-saitama-arena-plugin/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（WordPress の画面・サイトの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「独自プラグイン：管理画面（設定・同期ログ）・…」と出たら録画を停止

## 再生される内容

タスクバーの時計は 2026-11-13（金）10:31 から始まり、致命的なエラーの調査（10:44）・テスト（10:46・10:48）・同期し直し（10:55）・自動同期のテスト（10:58）・本番（11:18）の前に録画のカットとして進みます。

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 要件・設計 | VS Code | 仕様（README.md：取り込み先・会場タイプ・自動同期・通知、催事管理システム API v1）→ API の応答例（2026さいたまるしぇ 11/14〜15）→ 昨日までに作った取り込み（`save_event`：イベント ID で投稿を探して追加・更新、開催日はテーマが使っているメタ）→ テーマの「本日開催のイベント」（いまはテーマが投稿を検索）→ `npm start`（wp-env） | |
| 2 API クライアント | VS Code・ターミナル | `class-arena-events-api.php` を新規作成 → `get_events()`（`add_query_arg`・`wp_remote_get`：タイムアウト 15 秒・`Authorization: Bearer`）を入力 → `Invoke-RestMethod` で API の動作確認（11 月の 12 件） | （このときは応答を確認せずに `$data['events']` を返している） |
| 3 管理画面・設定 | VS Code・ターミナル・Chrome | `class-arena-events-admin.php`（メニュー「イベント連携 › 同期ログ / 設定」、Settings API の `add_settings_section` / `add_settings_field` を入力、`sanitize`）→ 本体 `arena-events.php`（Network: true）→ `wp plugin activate arena-events --network` → サイトネットワーク管理 › プラグイン（ネットワークで有効）→ イベントスケジュールの「イベント連携の設定」で API の URL・API キー（•）・通知先を入力して保存 | API の URL を `…/api` と入力（`/v1` 抜け） |
| 4 同期とエラー処理 | Chrome・VS Code・ターミナル | 同期ログ（まだ同期していない・次回の自動同期 11/14 5:00）→「今すぐ同期」 | **重大なエラー**：WordPress の「このサイトで重大なエラーが発生しました。」→ debug.log に `Undefined array key "events"` と `TypeError: count(): … null given`（API の 404 を確認せずに使っていた）→ API クライアントに応答の確認（通信エラー・200 以外・events なし → `WP_Error`）、取り込み側にログと通知 → 再実行すると「同期できませんでした。催事管理システムの API エラー（404）：Not Found: GET /api/events」と同期ログのエラー行 → 設定の URL に `/v1` を足して保存 →「同期しました：取得 12 件・追加 12 件・更新 0 件」 |
| 5 本日開催のイベント | VS Code・Chrome・ターミナル | テーマの `template-parts/daily-event.php` の検索とループ（24 行）を `arena_events_today_list()` の 1 行に置き換え → 開発環境のトップ | **日付のずれ**：11/13 の「本日開催のイベント」に 11/14 からの「2026さいたまるしぇ」→ 投稿一覧の「開催日」が全件 1 日早い（2026/11/13 ～ 2026/11/15）→ `gmdate`（UTC）で日付にしていた → `wp_date`（Asia/Tokyo）に → `wp arena-events sync --dry-run` → `wp arena-events sync`（更新 12 件）→ トップは 11/13 の 3 件、投稿一覧は 2026/11/14 ～ 2026/11/15 |
| 　 | | カレンダー用の REST API（`register_rest_route`：`arena-events/v1/daily`、date は `YYYY-MM-DD` だけ）を入力 → `Invoke-RestMethod …/daily?date=2026-11-14`（4 件。さいたまるしぇが入る） | |
| 6 自動化・コードチェック | ターミナル・Chrome・VS Code | `wp cron event list`（`arena_events_daily_sync`：20:00 UTC = 5:00 日本時間・毎日）→ `wp cron event run`（自動同期を 1 回）→ 同期ログ（手動・WP-CLI・自動（WP-Cron）、今回は変更なし）→ `composer lint` | **PHPCS**：`$_GET['arena_events_result']` のサニタイズなし（MissingUnslash・InputNotSanitized・NonceVerification）、通知の `$type` `$message` のエスケープなし（OutputNotEscaped）→ `sanitize_key( wp_unslash( … ) )`（表示だけなので nonce は除外理由をコメント）と `printf` + `esc_attr` / `esc_html` → `composer lint` はエラーなし → `git commit` / `git push` |
| 7 本番へ反映 | ターミナル・Chrome | `ssh web01` → `git pull --ff-only` → `wp plugin activate arena-events --network` → `wp option update arena_events_settings`（API キーはサーバーのファイルから）→ `wp arena-events sync`（取得 12 件・変更なし）→ 公開中のトップ「本日開催のイベント」（11/13）→ `/schedule/` | |

### 日本語入力（Microsoft IME と同じ流れ）

PHP の中の日本語（設定の見出し「催事管理システム（API）」、エラーの文言「催事管理システムの API エラー（%1$d）：%2$s」「応答を読み取れません」、
テーマのコメント「関数内でエスケープ済み。」、PHPCS の除外理由「結果を表示するだけ（処理はしない）。」）は、ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。
英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。

## キー操作 / URL パラメータ

ほかのデモと同じです（`../../README.md`）。**Space** 再生 / 一時停止、**R** 最初から、**C** 字幕、**H** ヒント、`?t=秒` `?from=シーン番号` `?speed=1.3` `?captions=0`。

## 本番サイトとの同一性について

- ブラウザに出るサイトの画面は、公開中の www.saitama-arena.co.jp をブラウザで開き、サイトのスクリプトが動いた後の画面を **そのまま取り込んだもの** です。
  開発環境（`localhost:8888`）のトップにも同じ画面を使っています（本番の DB のコピーで動かしている、という想定）。
- トップの「本日開催のイベント」は取り込んだ日の内容のため、日付を動画の日（2026-11-13 金曜日）に変え、サイトのイベントスケジュールで
  その日に開催中の 3 つ（MYSTERY GATE・ある料理人が遺した謎・GMO winter illumination）だけを残しています（`js/apps.js` の `StoreFrame.STATES.today13`）。
  2 つ目のミスの画面では、そこに「2026さいたまるしぇ in さいたまクリテリウム」（11/14〜15）を公開中の一覧と同じマークアップ・画像・リンクで足しています（`STATES.tzBug`）。
  プラグインの関数が出す HTML（`arena_events_today_list()`）は、このマークアップと同じです。
- 取り込んだ WordPress で実際に同期した結果：11/13 に開催中は 3 件、11/14 は 4 件（さいたまるしぇが入る）。REST API の出力（`Invoke-RestMethod` の表）はその結果です。

## WordPress の画面について

- 管理画面は **WordPress Playground**（ブラウザの中で動く本物の WordPress。WordPress 7.1.4 / PHP 8.3、日本語）を Playground 自身の機能でマルチサイトにし、
  移転の動画と同じ 3 サイト（`/`・`/schedule/`・`/news/`）とテーマのスラッグ、WP-PageNavi、イベントスケジュールのカテゴリー（公開中の一覧の 5 つ）と会場タイプを用意して、
  このプラグインを入れて実際に操作した各画面を取り込んだものです（`tools/snapshots/wp-saitama-arena-plugin/capture-wp.js` → `js/wp-snapshot.js`・`assets/wp/`）。
  - 段階 0（最初に書いたコード）：サイトネットワークで有効化 → 設定（API の URL は `/v1` 抜け）→「今すぐ同期」→ 重大なエラー
  - 段階 1（API のエラーを処理）：「同期できませんでした。催事管理システムの API エラー（404）：Not Found: GET /api/events」と同期ログのエラー行 → URL を直して保存 →「今すぐ同期」→ 12 件追加
  - 段階 2（wp_date）：WP-CLI と同じ処理で同期し直し（12 件更新）→ 投稿一覧の開催日が正しい日付に
  - 段階 3（PHPCS の修正）：画面の出力は同じです
- 開発環境の設定（`WP_DEBUG` `WP_DEBUG_LOG` を有効、`WP_DEBUG_DISPLAY` は無効）は `.wp-env.json` と同じにしています。そのため致命的なエラーは画面には出ず、
  WordPress の「重大なエラー」の画面と debug.log になります。
- 取り込みで変えているもの：Playground のアドレス → `http://localhost:8888`、取り込んだ日 → 2026-11-13、同期ログの時刻と取り込んだ投稿の日時 → 動画の時計
  （10:46・10:48・10:56）、次回の自動同期 → 2026-11-14 05:00（プラグインがその日に登録する時刻）。取り込みの間は WP-Cron を止めています。
  取り込みでは「取り込んだ日」の日付を動画の日に置き換えるため、取り込んだ日（2026-11-18）に開催のフリーマーケットの日付まで置き換わります。
  投稿一覧の「開催日」と WP-CLI・REST の出力に使うデータは、`events.json` の日付に戻しています（`capture-wp.js` の `fixEventDates`、`--fix-dates` で単独でも実行可）。
  設定の入力欄 → 同じ見た目の入力欄（文字を描くため）。
- テーマ（`saitamaarena` `schedule` `news`）はスラッグだけ同じ代わりのテーマです（テーマの画面は出しません）。管理者 `sa_webadmin` は架空です。
- ログインはしていません（Playground の使い捨ての管理者で操作しています）。
- タブのファビコン：管理画面（サイトアイコン未設定）は WordPress のアイコン、サイトはテーマが指定している `/img/favicon.ico`（取り込み時に保存）です。

## 演出であるもの

- **画面の環境**：VS Code は今の既定の見た目です（Dark Modern テーマ、codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。
  PHP はタブでインデント（WordPress Coding Standards）、ターミナルは PowerShell で、`ssh` の中は bash のプロンプトです。
- 作業の時刻（10:31〜11:20 ごろ。テストの後・同期し直しの後・本番の前に録画のカットとして時計が進みます）、3 つのミス、本番での同期の結果（前日に ID を紐付け済みで変更なし）は演出です。

## サイトを更新した場合

```
npm run snapshot -- wp-saitama-arena-plugin                                サイトの画面・画像を取り込み直す（画像は WebP に変換）
node tools/snapshots/wp-saitama-arena-plugin/capture-wp.js [フォルダー]    WordPress の画面を取り込み直す（Playground、数分）
node tools/webp.js wp-saitama-arena-plugin                                 WordPress の画面の画像を WebP に
npm run timeline -- wp-saitama-arena-plugin                                長さ・チャプターの測定とサムネイルの撮影
```

API の代わりに返すイベントは `tools/snapshots/wp-saitama-arena-plugin/events.json`（公開中の `/schedule/` の一覧から作ったもの）です。
トップの「本日開催のイベント」は取り込んだ日の内容になるので、取り込み直したら `js/apps.js` の `STATES.today13` で残すイベントを確認してください。
プラグインを直すときは `js/plugin-src.js` だけを直し、WordPress の画面を取り込み直します（VS Code の表示と取り込みの両方がこのファイルを使います）。

## ファイル構成

```
index.html            ページ本体（共通の部品は public/shared/kit/・public/shared/wordpress/ と public/shared/）
css/video.css         このデモだけの見た目
js/config.js          デモの設定（工程・タイトル画面・サイト・取り込むページ）
js/site-snapshot.js   取り込んだ www.saitama-arena.co.jp の画面（自動生成）
js/wp-snapshot.js     取り込んだ WordPress の画面（自動生成）
js/plugin-src.js      プラグイン arena-events のソース（段階 0〜3。VS Code の表示と WordPress への取り込みの両方で使う）
js/files.js           VS Code に表示するプロジェクトのファイル（仕様・API の応答例・wp-env・Composer・PHPCS・テーマのテンプレート）
js/apps.js            タブのファビコン、「本日開催のイベント」の日付とミスの状態（StoreFrame.STATES）、ssh のプロンプト
js/scenario.js        台本（シーンごとの操作・字幕・ミスと修正・コマンドの出力）
assets/site/          取り込んだ画像・フォント（自動生成）
assets/wp/            WordPress の画面の画像・フォント（自動生成）
```
