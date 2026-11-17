# 制作プロセス デモ — GMOアリーナさいたま（www.saitama-arena.co.jp）WordPress のサーバー移転・ドメイン移行

> 一覧ページ（`/`）と再生ページ（`/watch/wp-saitama-arena-migration`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-saitama-arena-migration/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 7 分 07 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
GMOアリーナさいたまの公式サイト（https://www.saitama-arena.co.jp/）を **WordPress マルチサイトのまま新しいサーバーへ移し、
新ドメイン arena.gmo への移行を準備する工程** を順番に再生します。

**移転前の確認 → バックアップ・メンテナンス → データベース・ファイルの移行 → ロードバランサー・SSL → hosts で事前確認 → DNS 切り替え → 新ドメインの準備 → 公開中のサイト**

## 最初に確認していただきたいこと

- www.saitama-arena.co.jp は **WordPress で運営されている実在の施設のサイト** です（株式会社さいたまアリーナ）。このデモは「このサイトを
  新しいサーバーへ移す」としたらどう進めるか、という **工程の再現** で、実際の移転作業の記録ではありません。移転の日付・時刻・手順・
  サーバーの名前と中身はすべてデモ用に考えたものです。
- **本物のもの（公開情報をそのまま使っています。確認日 2026-11-17〜18）**
  - サイトの構成：WordPress の **マルチサイト（サブディレクトリ型）** で、`/`（本体。テーマ `saitamaarena`）・`/schedule/`（イベントスケジュール。
    テーマ `schedule`、アップロードは `wp-content/uploads/sites/2/`）・`/news/`（お知らせ。テーマ `news`）の 3 サイト。WP-PageNavi を使用。
    `/img/` や `/floor_map/*.html` などの WordPress の外のファイルもあります（公開ページの HTML から分かること）。
  - DNS：`saitama-arena.co.jp` のネームサーバーは Route 53（`awsdns`）、`www` は TTL 60 の A レコード 2 つ（52.198.113.180 / 57.180.176.201 — ロードバランサーの
    エイリアスの形）、MX は TTL 60、NS は TTL 172800、SOA は TTL 900。新ドメイン `arena.gmo` も Route 53 で、同じ 2 つの IP を指しています。
  - 応答：`http://www.saitama-arena.co.jp/` は `Server: awselb/2.0` が `Location: https://www.saitama-arena.co.jp:443/` へ 301、
    `https://` は `Server: Apache` が 200（ヘッダーの並び・値は実際の応答のもの。日時は動画の時計に合わせています）。
    `https://arena.gmo/` は Apache が `Vary: X-Forwarded-Proto` 付きで `https://www.saitama-arena.co.jp/` へ 302。
  - 証明書：www は CN `www.saitama-arena.co.jp`、発行元 `Amazon RSA 2048 M01`（Amazon）、2026-09-03 〜 2027-03-19（UTC）。arena.gmo は `Amazon RSA 2048 M04`。
    最後の証明書ビューアに出る発行先・発行元・有効期間は本物です（フィンガープリントは表示せず、ぼかしています）。
  - **URL 変更のお知らせ**：サイトのお知らせ「本ホームページのURLの変更について（延期）」（2026.10.28）に、URL を `https://arena.gmo/` に変える予定が
    10/30 から延期され 12 月中を目途に実施、とあります。デモの「新ドメインの準備」（変更日までは www へ一時転送、置換は --dry-run だけ）はこれに合わせています。
  - ブラウザに出るサイト（トップ・`/schedule/`・お知らせ `/news/2026/10283546.html`、PC 幅 1920px）は公開中の画面をそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
  - WordPress の管理画面は **すべて本物の WordPress 7.1.4 の画面** です（日本語のマルチサイト。下の「WordPress の画面について」）。
    1 つ目のミス（All-in-One WP Migration の無料版はマルチサイトを書き出せず「WordPress マルチサイトには、All-in-One WP Migration Multisite Extension が必要です。」と
    出る）は、プラグインをサイトネットワークで有効化したときに WordPress に実際に出た画面です。メンテナンス画面「現在メンテナンス中のため、しばらくの間ご利用いただけません。」も WordPress 自身のものです。
- **再現のもの**
  - 旧サーバー・新サーバー（`old-web` / `web01` / `db01`）、その OS・ソフトのバージョン、パス、ユーザー名（`deploy`・`sa_webadmin`）、DB 名・パスワード・
    認証キー（ぼかし）、ロードバランサーの名前と ARN、Route 53 のホストゾーン ID、アカウント ID（ぼかし）、ターゲットの IP（ぼかし）、旧サーバーの IP
    （`203.0.113.24`：説明用の IP、ぼかし）、証明書の検証用 CNAME の名前（ぼかし）は架空です。公開情報から分かるのは「Route 53・ロードバランサー（ELB）・ACM の証明書・その後ろに Apache」までです。
  - ターミナルの出力：コマンドの書式は各ツールの実際の出力に合わせていますが、件数・サイズ・時間（アップロード 6.8GB、DB 1.21 GB、置換 12,848 件、rsync の進み方など）と
    アクセスログの行は架空です。DB チェックのテーブル名はマルチサイト 3 サイトの WordPress の標準のテーブルです。
  - 作業の順番、3 つのミス（AI1WM のマルチサイト・DB_HOST・ロードバランサーの後ろでのリダイレクトループ）。どれも実際に起きる動きですが、実際の作業でこのミスがあったわけではありません。
  - VS Code のプロジェクト（手順書 `README.md`、`web01/wp-config.php`、Apache の VirtualHost、Route 53 の変更バッチ）は、このデモのために書いたものです。
- 個人情報：画面に個人の情報は出ません。管理画面のユーザー名 `sa_webadmin` は架空、パスワードは • で表示しています。
- 株式会社さいたまアリーナは実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/wp-saitama-arena-migration/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/wp-saitama-arena-migration/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（WordPress の画面・サイトの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「サーバー移転：WP-CLI と rsync でマルチサイトを移行・…」と出たら録画を停止

## 再生される内容

タスクバーの時計は 2026-11-10（火）22:04 から始まり、rsync の後（22:31）と DNS の反映待ちの後（22:58）に録画のカットとして進みます。

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 移転前の確認 | VS Code ＋ ターミナル | 手順書（構成・今夜の手順）→ `Resolve-DnsName`（TTL は前日に 300 秒へ）→ `ssh old-web` → `wp site list`（3 サイト）・`wp core version`・`wp db size`・`wp plugin list`・`du -sh`（uploads・/img/ など） | |
| 2 バックアップ・メンテナンス | Chrome（旧サーバーの管理画面）・ターミナル | ログイン（`sa_webadmin`）→ サイトネットワーク管理 › プラグイン → All-in-One WP Migration を「サイトネットワークで有効化」 | **移行プラグインが使えない**：「WordPress マルチサイトには、All-in-One WP Migration Multisite Extension が必要です。」（無料版はマルチサイトを書き出せない）→ 無効化して戻し、WP-CLI と rsync で移す |
| 　 | | `wp maintenance-mode activate` → サイトは WordPress のメンテナンス画面 → `wp db export --single-transaction` → `ls -lh` | |
| 3 データ移行 | ターミナル・VS Code | `ssh web01` → `rsync --info=progress2`（`wp-config.php` と `.maintenance` を除く）→ DB のダンプを転送 → 新サーバー用 `wp-config.php` を `scp` → `wp db import` | **DB に接続できない**：`ERROR 2002 … Can't connect to local MySQL server through socket`（旧サーバーからコピーした `DB_HOST` が `localhost` のまま。新しい構成では DB は別サーバー）→ `db01.sa.internal` に直して再度 `scp`・インポート → `wp site list`・`wp db check`（全テーブル OK） |
| 4 ロードバランサー・SSL | ターミナル・VS Code | `aws acm list-certificates`（www と arena.gmo）→ `aws elbv2 describe-listeners`（80 は redirect、443 は forward）→ `describe-listener-certificates`（SNI で 2 枚）→ `describe-target-health`（healthy）→ Apache の VirtualHost（:80、ヘルスチェック用ページ） | |
| 5 hosts で事前確認 | VS Code・Chrome・ターミナル | `code …\hosts` → ALB の IP の行を追加 → 保存（「管理者として再試行」）→ `ipconfig /flushdns` → Chrome で www | **リダイレクトループ**：Chrome「このページは動作していません — リダイレクトが繰り返し行われました（ERR_TOO_MANY_REDIRECTS）」→ `curl -I` で `X-Redirect-By: WordPress`・`Location: https://…`（ALB で HTTPS を終端しているので web01 には http で届き、WordPress が https へ転送し続ける）→ `wp-config.php` に `HTTP_X_FORWARDED_PROTO` を見て `$_SERVER['HTTPS'] = 'on'` → 200 OK |
| 　 | | 新サーバーでトップ・`/schedule/` を表示 → ネットワーク管理 › サイト（3 サイト。認証キーが同じなのでログイン状態が続く）→ メインサイトの編集（サイトアドレスは https://www.saitama-arena.co.jp/ のまま） | |
| 6 DNS 切り替え | VS Code・ターミナル | Route 53 の変更バッチ（www → ALB のエイリアス）→ hosts の行を削除 → `list-resource-record-sets`（変えるのは www の A だけ。MX・NS・検証用 CNAME はそのまま）→ `change-resource-record-sets`（PENDING）→ `get-change`（INSYNC）→ `Resolve-DnsName`（ALB の 2 つの IP・TTL 60）→ `curl -I` http（awselb の 301）/ https（Apache の 200）→ 新サーバーのアクセスログ（ヘルスチェックと閲覧者） | |
| 7 新ドメインの準備 | Chrome・VS Code・ターミナル | お知らせ「本ホームページのURLの変更について（延期）」→ `arena-gmo.conf` に 302（`X-Forwarded-Proto` が https のとき www へ）と、変更日以降の 301 の書き方（コメント）→ `apachectl configtest`・reload → `curl -I https://arena.gmo/`（302）→ `wp search-replace … --network --skip-columns=guid --dry-run`（3 サイト分）→ 手順書の「新ドメイン」 | |
| 公開中のサイト | Chrome | `arena.gmo` → www のトップ → 証明書ビューア（発行元 Amazon RSA 2048 M01）→ スクロール → `/schedule/` | |

### 日本語入力（Microsoft IME と同じ流れ）

`wp-config.php` と `arena-gmo.conf` のコメント、hosts のコメント「移転確認」は、ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。
英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。長いコマンドは速めに入力しています。

## キー操作 / URL パラメータ

ほかのデモと同じです（`../../README.md`）。**Space** 再生 / 一時停止、**R** 最初から、**C** 字幕、**H** ヒント、`?t=秒` `?from=シーン番号` `?speed=1.3` `?captions=0`。

## 本番サイトとの同一性について

- ブラウザに出るサイトの画面は、公開中の www.saitama-arena.co.jp をブラウザで開き、サイトのスクリプトが動いた後の画面を **そのまま取り込んだもの** です。
  スタイルシートは本番のファイルのまま、画像はその幅で表示されていたサイズのものです。スクリプト・埋め込み（iframe）は取り込んでいません。
  新サーバー（hosts で確認するとき）も同じ画面を使っています（同じデータ・同じテーマを移したので同じ画面になる、という想定）。
- トップの「本日開催のイベント」は取り込んだ日（2026-11-17）の内容のため、日付を動画の日（2026-11-10。同じ火曜日）に変え、サイトの
  イベントスケジュールで 11/18 の 1 日だけの開催になっているフリーマーケットを外しています（`js/apps.js` の `StoreFrame.STATES.today`）。
  残りの 3 つ（MYSTERY GATE・ある料理人が遺した謎・GMO winter illumination）はスケジュール上 11/10 も開催中です。
- お知らせのページ（取り消し線を含む）は公開中のままです。`/schedule/` の「2026年11月のイベント」も取り込んだ日の一覧です。
- Chrome のエラー画面（ERR_TOO_MANY_REDIRECTS）は Chrome のエラーページのレイアウトと文言に合わせて作ったもので、アイコンは Chromium のソースの画像
  （`error_network_generic.png`、BSD ライセンス）です。ページ情報の吹き出しと証明書ビューアも見た目を似せたものです（中身は上の本物の証明書の情報）。

## WordPress の画面について

- 管理画面は **WordPress Playground**（ブラウザの中で動く本物の WordPress。WordPress 7.1.4 / PHP 8.3、日本語）を Playground 自身の機能でマルチサイトにし、
  公開サイトと同じ 3 サイト（`/`・`/schedule/`・`/news/`）とテーマのスラッグ、サイト名「GMOアリーナさいたま」・キャッチフレーズ「GMOアリーナさいたまのサイトです。」
  （公開サイトの説明文）、WP-PageNavi（サイトネットワークで有効）を入れて、実際に操作した各画面を取り込んだものです
  （`tools/snapshots/wp-saitama-arena-migration/capture-wp.js` → `js/wp-snapshot.js`・`assets/wp/`）。
  All-in-One WP Migration（7.113、wordpress.org）の「サイトネットワークで有効化」→ 通知、「サイトネットワークで無効化」、メンテナンス画面（`.maintenance` を置いた状態）は、
  すべてその WordPress で実際に行った結果の画面です。
- テーマ（`saitamaarena` `schedule` `news`）はスラッグだけ同じ代わりのテーマです（本物のテーマのファイルは公開されていません。テーマの画面は出しません）。
  管理者 `sa_webadmin` と、サイトの作成日時・最終更新日時（2016-03-01、2020-11-24 など）は架空です。Playground の Hello Dolly は削除しています。
- ログインはしていません（Playground の使い捨ての管理者で操作しています）。ログイン画面の「もう一度ログインしてください。」は WordPress 自身の表示です
  （ログアウト中に `/wp-admin/network/` を開くと、`reauth=1` 付きのログイン画面になります）。
- 取り込みで変えているもの：Playground のアドレス → `https://www.saitama-arena.co.jp`、取り込んだ日時 → 2026-11-10 22:12（動画の時計）、ログイン画面の入力欄 → 同じ見た目の入力欄（文字を描くため）。
- 移行プラグインの通知に出る「マルチサイトを入手」のボタンは、プラグイン自身の表示です（有料の拡張機能の案内）。
- タブのファビコン：管理画面（サイトアイコン未設定）は WordPress のアイコン、サイトはテーマが指定している `/img/favicon.ico`（取り込み時に保存）、
  メンテナンス画面とエラー画面は Chrome の既定のアイコンです。

## 演出であるもの

- **画面の環境**：VS Code は今の既定の見た目です（Dark Modern テーマ、VS Code 自身のアイコン codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。
  ターミナルは PowerShell で、`ssh` の中は bash のプロンプトです。VS Code の通知（hosts の保存に管理者権限が必要）は見た目を似せたもので、UAC の画面は省いています。
- サーバーの構成・名前・出力の数値、3 つのミス、作業の時刻（22:04〜23:00）は演出です。

## サイトを更新した場合

```
npm run snapshot -- wp-saitama-arena-migration                                サイトの画面・画像を取り込み直す（画像は WebP に変換）
node tools/snapshots/wp-saitama-arena-migration/capture-wp.js [フォルダー]    WordPress の画面を取り込み直す（Playground、数分）
node tools/webp.js wp-saitama-arena-migration                                 WordPress の画面の画像を WebP に
npm run timeline -- wp-saitama-arena-migration                                長さ・チャプターの測定とサムネイルの撮影
```

取り込む内容（ページ・取り除く要素）は `js/config.js` の `snapshot` で設定します。トップの「本日開催のイベント」は取り込んだ日の内容になるので、
取り込み直したら `js/apps.js` の `STATES.today` の日付と外すイベントを確認してください。

## ファイル構成

```
index.html            ページ本体（共通の部品は public/shared/kit/・public/shared/wordpress/ と public/shared/）
css/video.css         このデモだけの見た目（ターミナルの高さ、Chrome のエラー画面・ページ情報・証明書ビューア、VS Code の通知）
js/config.js          デモの設定（工程・タイトル画面・サイト・取り込むページ）
js/site-snapshot.js   取り込んだ www.saitama-arena.co.jp の画面（自動生成）
js/wp-snapshot.js     取り込んだ WordPress の画面（自動生成）
js/files.js           VS Code に表示するプロジェクトのファイル（手順書・wp-config.php・VirtualHost・Route 53 の変更バッチ・hosts）
js/apps.js            タブのファビコン、Chrome のエラー画面・証明書ビューア、VS Code の通知、ssh のプロンプト、「本日開催のイベント」の日付（StoreFrame.STATES.today）
js/scenario.js        台本（シーンごとの操作・字幕・ミスと修正・コマンドの出力）
assets/site/          取り込んだ画像・フォント（自動生成）
assets/wp/            WordPress の画面の画像・フォント（自動生成）
assets/chrome/        Chrome のエラー画面のアイコン（Chromium のソースから）
```
