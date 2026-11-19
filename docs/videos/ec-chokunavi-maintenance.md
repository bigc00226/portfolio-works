# 制作プロセス デモ — 販促品直ナビ（www.chokunavi.shop）EC-CUBE 4 サーバー・セキュリティ・保守

> 一覧ページ（`/`）と再生ページ（`/watch/ec-chokunavi-maintenance`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-chokunavi-maintenance/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 9 分 35 秒 です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
敷島産業株式会社のノベルティ・販促品の EC サイト 販促品直ナビ（https://www.chokunavi.shop/、EC-CUBE 4 で運営）の
**保守契約の初回の点検（サーバー・セキュリティ・保守）** を順番に再生します。

**依頼・外からの確認 → 健康診断（EC-CUBE）→ セキュリティチェック → 管理画面の防御 → 設定とファイル → バックアップと復元テスト → パッチ適用（4.3.1-p1）→ 本番へ反映・報告**

画面の日付は 2026/11/15（日）10:02〜（途中で 10:10・10:16・10:24・10:38・10:46・10:58・11:20 へカット）。

## 最初に確認していただきたいこと

- www.chokunavi.shop は **EC-CUBE 4 で運営されている実在のショップ** です（敷島産業株式会社。答えるのは `www.` のホストだけです）。
  このデモは「このショップの保守を引き継いだら、初回の点検をどう進めるか」という **工程の再現** で、実際の保守の記録ではありません。
  ショップの管理画面・サーバー・ソースコードは公開されていないため、本番の構成（EC-CUBE 4.3.1・PHP 8.3・MySQL 8.0・Apache・ロードバランサー）、
  引き継ぎの状況（管理画面は /admin のまま・admin を 3 名で共有・バックアップが不明）は **この動画のための想定** です。
- **外から見える情報（本物・2026-11-18 に取得）**：公開ページへの普通のアクセスだけで読み取れること（スキャン・脆弱性の試験・ログインなどは一切していません。
  `tools/snapshots/ec-chokunavi-maintenance/outside.js`）。動画のターミナルの出力はこのときの値です（日時だけ画面の日付に合わせてずらしています）
  - 応答ヘッダー：`Set-Cookie: maintenance_token=deleted`（EC-CUBE 4.1 以降のメンテナンスモードの処理が毎回付けるもの）、
    `eccube=…; secure; HttpOnly; SameSite=none`、`X-Frame-Options: SAMEORIGIN`・`X-XSS-Protection: 1; mode=block`・`X-Content-Type-Options: nosniff`
    （EC-CUBE の `.htaccess` が付ける 3 行と同じ）、`Strict-Transport-Security: max-age=15724800; includeSubDomains`。`Server` ヘッダー・CSP はありません
  - ページの script タグ：`https://code.jquery.com/jquery-3.6.0.min.js`（integrity まで同じ）・`stackpath.bootstrapcdn.com/bootstrap/3.4.1`・
    `cdn.jsdelivr.net/jquery.slick/1.6.0`・`assets/js/function.js`・`assets/js/eccube.js` は、**EC-CUBE 4.1 の `default_frame.twig` と同じ** です
    （4.2 以降の標準テーマは `front.bundle.js` を読みます）。フロントのテンプレートが 4.1 をもとにしていることはわかりますが、本体の版は外からはわかりません。
    動画では「本体は 4.3.1、テンプレートは 4.1 のまま」という想定にし、報告書で「次の改修の候補」としています
  - SSL 証明書：`CN=www.chokunavi.shop`、発行者 `GlobalSign GCC R46 AlphaSSL CA 2025`、有効期限 2026/12/17 10:07:07（日本時間）、TLS 1.3
  - `chokunavi.shop`（www なし）は DNS の名前が引けません
- **本物のもの**
  - **EC-CUBE の画面はすべて本物** です。この PC の上で動かした **EC-CUBE 4.3.1-p1**（公式の配布物。PHP 8.3 の WebAssembly 版で実行、データベースは SQLite）を
    動画の前半のために **4.3.1 に戻し**（4.3.1-p1 で変わった 4 つの PHP ファイルを GitHub のタグ 4.3.1 の版にしたもの）、ショップの公開データを入れ、
    動画と同じ操作を実際に行って取り込みました（`tools/snapshots/ec-chokunavi-maintenance/capture-ec.js` と `capture-2fa.js`、`tools/eccube/`）。
    - 管理画面：ログイン・ホーム・システム情報（4.3.1 → 4.3.1-p1）・プラグイン一覧（セキュリティチェック 未 → 有効）・ログイン履歴・ログ表示・
      セキュリティ管理（「管理画面URL が admin」の警告 → 管理画面 URL `mng_7f3k2q`・許可 IP）・セキュリティチェックプラグイン（Securitychecker42 4.3.1）の画面と結果・
      メンバー管理（運営担当 ops01 の登録・2段階認証）・新しい URL のログイン画面・ログイン試行のロック・2段階認証の登録（QR コード）とコードの入力・
      商品一覧・メンテナンス管理（有効 → 無効）
    - ショップ（検証環境の EC-CUBE の標準テーマ）：商品一覧（復元後・パッチ後）、メンテナンス中の 503 の画面（EC-CUBE の `maintenance.php`）
  - **動画の中の設定・操作はすべて検証環境で実際に行ったもの** です：管理画面 URL・許可 IP の変更（EC-CUBE が `.env` を書き換えたものをそのまま表示）、
    `TRUSTED_PROXIES`、許可したアドレス / ほかのアドレス / 古い `/admin` への HTTP のステータス（200 / 403 / 404、`X-Forwarded-For` を付けて実際に送信）、
    5 回の失敗のあと正しいパスワードでも入れないロック（EC-CUBE 4.3 の login_throttling）、担当者のアカウントと 2段階認証（コードは認証アプリと同じ RFC 6238 の計算で作成）
  - **2段階認証の回避（4.3.1-p1 で修正された脆弱性）**：4.3.1 では、パスワードだけでログインした状態で `/two_factor_auth/set` を開くと、
    コードを入れずに認証アプリを登録し直せる画面が出ます（動画の画面はそのときのもの）。4.3.1-p1 のファイルにしてキャッシュを消すと、同じ URL が
    コードの入力画面に戻されることを確かめています。エディタの差分（`patches/eccube-4.3.1-p1.diff`）は GitHub の `compare/4.3.1...4.3.1-p1` から
    テストと package-lock.json を除いたもので、検証環境に当てたファイルはインストール済みの 4.3.1-p1 と同じものです
  - セキュリティチェック（Securitychecker42）は管理画面から実際に実行した結果です。ただし、プラグインが結果を EC-CUBE 社へ送る先
    （`securitychecker42_receiver`）は、このコピーではローカルの受け口に置き換えています（ローカルの検証用の情報を外へ送らないため）
  - `bin/console` の出力（`cache:clear`、`dbal:run-sql` の件数・`VACUUM INTO`・`PRAGMA integrity_check`）、`tar` の対象のファイル、バックアップの大きさ、
    消したあとのショップの応答（500）、復元後の件数は、そのとき実際に出たものです
  - エディタの `.env`（検証環境のもの。`ECCUBE_AUTH_MAGIC` はぼかし）・`.htaccess`・`nginx.conf.sample`・`app/config/eccube/packages/prod/monolog.yml` は EC-CUBE 4.3.1-p1 の実物です
  - **ショップのデータは公開ページから**（2026-11-18 取得、`scrape-shop.js`）：ショップ名・会社名・所在地・電話番号、トップのカテゴリー 15（ショップ自身の ID）、
    商品 18 点（ショップ自身の商品 ID・商品名・商品コード・説明文・仕様・規格（カラー・仕様の名前）と税抜の単価・写真 1 枚）。送料（1,000 円・30,000 円以上無料）と支払方法（銀行振込）も公開ページの記載から
  - 公開中のショップの画面（トップ・商品ページ）は、www.chokunavi.shop の公開ページを取り込んだものです（`npm run snapshot -- ec-chokunavi-maintenance`）
- **再現のもの**
  - **本番サーバーでの作業はすべて再現** です：`ssh chokunavi-prod` 以降の出力（PHP・Apache の版、`.env` の権限 664 → 640、`apachectl configtest`、
    `backup.sh` の実行とファイルの大きさ、`git pull`・パッチ・`cache:clear`・版の確認、crontab・logrotate）、`ops/` のファイル（Apache・PHP の設定、
    バックアップのスクリプト、監視の cron、logrotate）。本番は MySQL の想定なので、バックアップは mysqldump（再現）、検証環境は SQLite（本物）です
  - 依頼書・引き継ぎ資料・報告書の内容、作業の順序、ログイン履歴の外部からの失敗（文書用のアドレス 198.51.100.23・203.0.113.77 から実際にログインを試し、
    日付を 11/8〜11/15 にずらしたもの）、事務所のアドレス（203.0.113.24、文書用）、検証環境を Docker（localhost:8080）とする構成、`git` の操作
  - 検証環境の画面は EC-CUBE 4.3 の標準テーマです（ショップのテーマ・自動見積は公開されていないため）。規格は「カラー・仕様」1 つにまとめ、在庫は無制限にしています
  - `eccube:plugin:enable` の出力：WebAssembly 版の PHP は外部のプロセスを起動できないため、セキュリティチェックプラグインのインストールと有効化は
    EC-CUBE の `PluginService`（`postInstall`・`enable`）で直接行い、`cache:clear` を別に実行しました。ターミナルの出力はその `cache:clear` の出力と完了の行をつないだものです
  - 2段階認証のコード（482913）は画面の表示用です。取り込みのときは毎回その時刻のコードを計算して入力しています
  - 2段階認証の回避の 3 画面（パスワードだけの状態・4.3.1 で開く再設定の画面・4.3.1-p1 で戻されるコードの画面）とお客様から見たメンテナンス画面は、
    Cookie のない新しいブラウザで撮り直したものです（`capture-2fa.js`。最初の取り込みのブラウザには 2段階認証済み・メンテナンス解除用の Cookie が残っていたため）。
    メンテナンス画面は、管理画面のボタンと同じ形式の `.maintenance` ファイル（`SystemService::enableMaintenance` と同じ「:トークン」）を置いて表示しています
  - EC-CUBE の `index.php` はメンテナンス中に `HTTP/1.1 503` のヘッダーを出しますが、この PC の WebAssembly 版 PHP はこの書き方のステータスを応答に反映せず 200 で返しました
    （本物のサーバーでは 503）。動画ではステータスの行を表示していません
  - 画面の小さな置き換え：システム情報の User Agent の「HeadlessChrome」→「Chrome」（取り込みはヘッドレスの Chrome）、セキュリティチェックの「前回確認日時」の時刻と
    ログイン履歴の最新の行（取り込み自身のログイン）の時刻を画面の時計に合わせています（`js/apps.js`）。システム情報のサーバー OS（Emscripten）・WEB サーバー（PHP.wasm）・
    DB（SQLite）は、この PC の実行環境のまま表示しています
  - 画面の日付・時刻：取り込みの日時（2026-11-18）は画面の日付（2026-11-15）と時計に置き換えています（`tools/eccube/capture.js`）
- **ローカルで見るためのもの** です。実在の企業のサイト・ロゴ・商品を含むため、公開はしないでください。

## 再生される内容

| チャプター | 内容 |
| --- | --- |
| 依頼・外からの確認 | 依頼書（引き継ぎ・初回の点検 6 項目）、公開中のショップ、`curl -I` の応答ヘッダー（maintenance_token・.htaccess と同じヘッダー・HSTS）、script タグ（EC-CUBE 4.1 の default_frame と同じ）、証明書の期限、www なしの DNS |
| 健康診断（EC-CUBE） | 検証環境のログイン → ホーム → システム情報（4.3.1）→ プラグイン一覧 → ログイン履歴（/admin への総当たり）→ ログ表示 |
| セキュリティチェック | セキュリティ管理の警告（管理画面 URL が admin）→ セキュリティチェックプラグインの有効化 → チェックの実行と結果 |
| 管理画面の防御 | 担当者ごとのアカウント（ops01）と 2段階認証 → セキュリティ管理（管理画面 URL・許可 IP）→ `.env`（TRUSTED_PROXIES）→ 200 / 403 / 404 → ログイン試行のロック → admin の 2段階認証の登録 |
| 設定とファイル | `.htaccess`（設定ファイルの拒否・セキュリティヘッダー）→ `nginx.conf.sample` → 本番の Apache・PHP の設定、`.env` の権限（再現） |
| バックアップと復元テスト | `ops/backup.sh`（再現）→ 検証環境で件数・`VACUUM INTO`・`tar` → DB と画像を消す（500）→ 戻す → 件数・整合性 → 商品一覧・ショップ |
| パッチ適用（4.3.1-p1） | 差分（2段階認証の 3 ファイル）→ 4.3.1 で回避できることを確認 → メンテナンスモード（503）→ `git apply`・`cache:clear` → システム情報 4.3.1-p1 → 回避できない → メンテナンス解除 |
| 本番へ反映・報告 | 本番へ（バックアップ・パッチ・確認、再現）→ 監視の cron・logrotate・monolog → 公開中の商品ページ → 報告書 |

## EC-CUBE の画面について

- EC-CUBE 4.3.1-p1 は `../eccube-local/inst/ec-chokunavi-maintenance/` に作るこの動画専用のコピーで、ログインはそのコピーの admin / password と
  コピーの中で作った運営担当（ops01）だけです（実在のショップの管理画面・サーバー・アカウント、EC-CUBE オーナーズストアには一切ログインしていません）
- 取り込み直し：`node tools/snapshots/ec-chokunavi-maintenance/capture-ec.js` → `node tools/webp.js ec-chokunavi-maintenance`（手順は `tools/snapshots/ec-chokunavi-maintenance/NOTES.md`）
