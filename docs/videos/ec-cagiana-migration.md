# 制作プロセス デモ — CAGIANA《カジーナ》（cagiana.jp）EC-CUBE 3 から EC-CUBE 4.3 へのデータ移行

> 一覧ページ（`/`）と再生ページ（`/watch/ec-cagiana-migration`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-cagiana-migration/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 8 分 47 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
パターンオーダーの靴のショップ CAGIANA《カジーナ》（https://cagiana.jp/、公開ページの HTML から EC-CUBE 3.0.17）を
**EC-CUBE 4.3 へ移す工程** を順番に再生します。

**現状調査（EC-CUBE 3）→ バックアップ → EC-CUBE 4.3 の準備 → データ移行の実行 → 件数・データの確認 → 画像とテーマ → 旧 URL のリダイレクト → 本番切り替え**

## 最初に確認していただきたいこと

- cagiana.jp は **EC-CUBE 3 で運営されている実在のショップ** です。このデモは「このショップを EC-CUBE 4.3 へ移す」としたらどう進めるか、という
  **工程の再現** で、実際の移行作業の記録ではありません。ショップのソースコード・管理画面・サーバー・実際のデータ（会員・受注）は公開されていません。
- **本物のもの**
  - **EC-CUBE の画面はすべて本物** です。この PC の上で、移行元の **EC-CUBE 3.0.18-p7** と移行先の **EC-CUBE 4.3.1-p1** を、PHP（WebAssembly 版：3 は PHP 7.4、
    4 は PHP 8.3）と SQLite で動かし（`tools/eccube/runtime.js`）、動画で行う操作を実際に行って取り込んだ画面です（下の「EC-CUBE の画面について」）。
    - 旧（localhost:8030、9 画面）：管理画面のログイン・ホーム・プラグイン一覧・商品一覧・商品登録（ID 103）・会員一覧・受注一覧（2 回）・バックアッププラグイン
    - 新（localhost:8080、24 画面）：管理画面のログイン・ホーム・プラグイン一覧・データ移行プラグイン（取り込み前・システムエラー・再ログイン・取り込み後・差分）・商品一覧・
      商品登録（ID 103）・会員一覧・受注一覧（2 回）・受注登録（受注 7）・テンプレート一覧、ショップの商品ページ（画像なし・標準テーマ・テーマ cagiana）・商品一覧・
      ログイン・マイページ・ご利用ガイド
  - **移行は実際に実行しています**。
    - 旧：EC-CUBE 公式の「EC-CUBE4系移行用バックアッププラグイン(3.0系)」（github.com/EC-CUBE/data-backup-plugin-v3）を `app/console plugin:develop install / enable` で入れ、
      管理画面の「バックアップ実行」で全テーブルの CSV の tar.gz を作成（動画の `tar -tzvf` の一覧はその中身）。
    - 新：「データ移行プラグイン for EC-CUBE4」の EC-CUBE 4.3 対応版（DataMigration42 v4.3.0、github.com/chihiro-adachi/data-migration-plugin のブランチ 4.2。
      README がオーナーズストアの商品ページを案内しているもの）を `bin/console eccube:plugin:install / enable` で入れ、プラグインの画面からバックアップを取り込み。
    - 開発環境の SQLite では、プラグインの「MySQL 以外」の分岐が PostgreSQL 用の SQL（`SET session_replication_role`・`pg_class` / `setval`）を実行して止まります。
      動画のシステムエラーの画面・ログの `SQLSTATE[HY000]: General error: 1 near "SET": syntax error` はそのとき実際に出たものです。
      VS Code で行う修正（4 か所の `else` を `elseif ($platform == 'postgresql')` に、`setIdSeq()` を PostgreSQL のときだけに）は、取り込みのときにプラグインに入れて
      再実行した修正と **同じ内容** です（`js/migrate-src.js`）。移行の処理そのものはプラグインのままです。本番（MySQL / PostgreSQL）ではこの修正は要りません。
    - `.env` の `ECCUBE_AUTH_MAGIC` を旧サイトの `auth_magic`（EC-CUBE 3 の `app/config/eccube/config.yml`）にして再実行し、
      移行した会員（見本 花子）が旧サイトのパスワードのままログインできた画面、旧サイトの管理者でログインし直した画面も実際のものです。
    - 件数（`bin/console dbal:run-sql` の出力：商品 37・カテゴリ 44・会員 12・受注 16）、受注 7 の明細・金額、旧 URL のステータスコード（`check-urls.ps1` と同じ確認を
      実際に行った結果）、301 の転送（`LegacyUrlSubscriber.php`）、「会員と受注データのみ移行する」での差分の取り込み（受注 18・会員 13）も実際の結果です。
    - 動画で「確認リストへ」とする 受注明細の規格名（旧：ダークブラウン）が移らない点も、このプラグインで実際に移行した受注 7 の結果です。
    - 移行後は管理者（dtb_member）も旧サイトのものに置き換わるため、管理画面のセッションが切れてログイン画面に戻ります（動画のとおり。完了のメッセージもそのため表示されません）。
  - **ショップのデータ**：公開ページ（2026-11-18 取得）から、カテゴリ（44 件。公開中の ID のまま。親カテゴリの一部は公開ページに ID がないため番号を付けています）・
    37 商品（商品 ID・商品名・メーカー・商品コード・規格（カラー・サイズ・右打ち / 左打ち）と価格（税込 → 税抜）・説明文・画像 146 枚）・INFORMATION の 8 件（新着情報として）を
    旧環境の EC-CUBE 3 に入れています（`tools/snapshots/ec-cagiana-migration/scrape-shop.js`・`capture-ec3.js`）。
  - **テーマ**：公開中のページの HTML から EC-CUBE 4（Twig 3）のテーマ cagiana を作り直しています（`build-theme.js`）。ヘッダー・フッター・商品ページ / 商品一覧のマークアップと、
    スタイルシート・画像（`/html/template/cagiana/…`、ショップのものをそのまま）は公開中のものです。EC-CUBE 3 のテーマの Twig そのものは公開されていません。
  - ブラウザに出る **公開中のショップ**（/ec・商品ページ・商品一覧、PC 幅）は 2026-11-18 に取り込んだ本番の画面です（`js/site-snapshot.js`）。
  - ターミナルの `curl.exe … | Select-String` の行（`?v=3.0.17`、パンくずリスト・メーカー管理のプラグインの痕跡）は公開中の HTML の実際の行です。
- **EC-CUBE 3 をこの PC で動かすための変更**（ローカルのコピーだけ。`setup-ec3.js`）
  - 3.0.18-p7 は公式の `eccube-3.0.18.zip`（vendor 入り）に `eccube-3.0.18-p7.zip`（GitHub の EC-CUBE/ec-cube3 のタグ 3.0.18-p7 と同じコミット）を重ね、
    p7 の composer.lock で変わった 4 パッケージ（symfony/http-kernel 2.8.52 ほか）を入れたものです（SHA-256 を照合）。
  - PHP 7.4 の WebAssembly 版で落ちる `libxml_use_internal_errors()` の代わりの関数（Symfony の 2 つの名前空間だけ）と、PHP 7.4 で Twig 1.34 が `{{` の前の空白を消す
    問題の 1 行の修正（Twig の後の版と同じ判定）を入れています。EC-CUBE 3.0 は PHP 7.4 より前の製品のためです。
  - データ移行プラグインの依存ライブラリ（pear/archive_tar・wapmorgan/unified-archive・nobuhiko/bulk-insert-query ほか）は、Packagist が示す GitHub のアーカイブを
    vendor に置いて Composer の autoload に登録しています（動画の `composer require` の出力は同じ版での再現）。
- **再現のもの**
  - **作業の順番と依頼の内容**、README の棚卸し・手順・切り替えのチェックリスト、**SQLite でのシステムエラー**（実際に起きる動きですが、実際の作業でこのミスがあったわけではありません）。
  - **会員・受注は架空** です（見本 一郎 など 13 名・受注 18 件、`sampleNN@example.com`、住所は「サンプルハイツ」、電話は 000-0000-xxxx。`members.js`）。メールアドレス・住所・電話・生年月日は画面でぼかしています。
  - 旧環境（localhost:8030）は「本番のファイルと DB から作ったコピー」という設定で、実際には公開データから作ったものです。本番は 3.0.17、コピーは 3.0 系の最終版 3.0.18-p7 です。
  - 公開中のショップのプラグイン（パンくずリスト・メーカー管理）・決済・独自ページ（/faq など）は移していません（有料・非公開のため）。ショップ名（基本設定）はプラグインの対象外なので手で設定しています。
  - docker・`composer require` の出力・DNS（`Resolve-DnsName` の結果、IP アドレスは文書用のアドレス）・メンテナンス表示・本番サーバーは再現です。
    最後の「本番 cagiana.jp が EC-CUBE 4.3 に」は、開発環境の EC-CUBE 4.3 が出した商品ページを本番のアドレスで表示した **演出** です。
- 個人情報：架空の会員だけで、実在の人の情報は出ません。EC-CUBE の管理者はローカルのコピー専用の admin / password です。
  **実在のショップ・アカウント・EC-CUBE オーナーズストアには一切ログインしていません**（公開ページを読んだだけです。カート・会員登録・注文もしていません）。
- CAGIANA は実在のブランドです。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/ec-cagiana-migration/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要）
   - 準備に 5〜20 秒ほどかかります（EC-CUBE の画面・ショップの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「EC-CUBE 3 → 4.3：商品 37・カテゴリ 44…」と出たら録画を停止

## 再生される内容

タスクバーの時計は 2026-11-11（水）10:05 から始まり、本番切り替え（21:02）の前に録画のカットとして進みます。

| STEP | 画面 | 内容 |
| --- | --- | --- |
| 1 現状調査（EC-CUBE 3） | README → 公開中のショップ → ターミナル → 旧環境の管理画面 | `?v=3.0.17`、プラグインの痕跡、商品 37・会員 12・受注 16 件 |
| 2 バックアップ | ターミナル → 旧環境のプラグイン一覧・バックアップ → `tar -tzvf` → config.yml | 公式のバックアッププラグイン（3.0 系）、テーブルごとの CSV、画像 146 枚、auth_magic |
| 3 EC-CUBE 4.3 の準備 | ターミナル → 新しい管理画面 → composer.json → プラグイン一覧 | データ移行プラグイン（4.3 対応版）と依存ライブラリ、install / enable |
| 4 データ移行の実行 | プラグインの画面 → **システムエラー** → ログ → ConfigController.php・.env | SQLite で PostgreSQL 用の SQL → 修正、ECCUBE_AUTH_MAGIC、再実行・ログインし直し |
| 5 件数・データの確認 | `dbal:run-sql` → 新旧の管理画面 → マイページ | 37・44・12・16 件、商品 103・受注 7 の照合、旧パスワードでログイン |
| 6 画像とテーマ | 商品ページ（画像なし）→ `Copy-Item` → detail.twig・.env → テンプレート一覧 → 商品ページ | 画像の移動、Twig 3 のテーマ cagiana、公開中のページと比較 |
| 7 旧 URL のリダイレクト | old-urls.txt・check-urls.ps1 → LegacyUrlSubscriber.php → ご利用ガイド | 404 は /help/guide と /ec だけ（商品・カテゴリは ID を引き継いで同じ URL）→ 301 |
| 8 本番切り替え | README → 旧の受注一覧 → 差分の取り込み → DNS → 本番の商品ページ | 当日の 2 件を「会員と受注データのみ」で、DNS の切り替え（再現）、本番の確認（演出） |

## キー操作 / URL パラメータ

`Space` 再生 / 一時停止、`R` 最初から、`C` 字幕、`H` ヒントを隠す。`?t=秒`（シーク）・`?from=シーン番号`・`?speed=1.3`・`?captions=0`。

## EC-CUBE の画面について

`tools/snapshots/ec-cagiana-migration/capture-ec3.js` が旧環境（`../eccube-local/ec3-cagiana`）にデータとバックアッププラグインを入れて画面とバックアップ（`work/backup-1.tar.gz`・`backup-2.tar.gz`）を作り、
`capture-ec.js` が EC-CUBE 4.3.1-p1 の新しいコピー（`../eccube-local/inst/ec-cagiana-migration`）で移行を実際に行って画面を取り込みます。両方の画面は `js/ec-snapshot.js`（`assets/ec3/`・`assets/ec/`）にまとめています。

変えているところ（WordPress の動画と同じ）：スクリプトを外す、アドレス `http://127.0.0.1:<port>` → `http://localhost:8030`（旧）/ `http://localhost:8080`（新）、取り込んだ日付 → 2026-11-11、
入力する欄（ログイン ID・パスワード・メールアドレス）を同じ見た目の入力欄に置き換え。会員のメール・住所・電話・生年月日はぼかしています。

## 作り直す場合

```
node tools/snapshots/ec-cagiana-migration/setup-ec3.js           # EC-CUBE 3.0.18-p7（一度だけ）
node tools/snapshots/ec-cagiana-migration/scrape-shop.js         # 公開ページのデータ（shop-data.json・img/）
node tools/snapshots/ec-cagiana-migration/build-theme.js         # テーマ cagiana（theme/）
node tools/snapshots/ec-cagiana-migration/capture-ec3.js [スクリーンショットのフォルダ]
node tools/snapshots/ec-cagiana-migration/capture-ec.js [スクリーンショットのフォルダ]
node tools/snapshots/ec-cagiana-migration/fix-frame-images.js    # メニューのバナー画像（公開中のショップから）
node tools/snapshots/ec-cagiana-migration/make-project-src.js    # VS Code に出すファイル（js/project-src.js）
node tools/webp.js ec-cagiana-migration
npm run snapshot -- ec-cagiana-migration                          # 公開中のショップ
npm run verify -- ec-cagiana-migration && npm run check -- ec-cagiana-migration && npm run pointer -- ec-cagiana-migration && npm run timeline -- ec-cagiana-migration
```

## ファイル構成

```
public/videos/ec-cagiana-migration/
├── index.html
├── css/video.css
├── assets/            ec3/（EC-CUBE 3 の画面）· ec/（EC-CUBE 4.3 の画面）· site/（公開中のショップ）· eccube-admin.ico · eccube3-admin.ico · favicon.ico
└── js/
    ├── config.js        工程・取り込むページ
    ├── migrate-src.js   プラグインの SQLite 対応・LegacyUrlSubscriber・check-urls.ps1（動画と取り込みの唯一のソース）
    ├── project-src.js   VS Code に出す実際のファイル（生成）
    ├── files.js         VS Code のプロジェクト（README の棚卸し・手順）
    ├── apps.js          タブのファビコン・入力・ぼかし
    ├── scenario.js      台本
    ├── ec-snapshot.js   EC-CUBE 3 / 4.3 の画面（生成）
    └── site-snapshot.js 公開中のショップ（生成）
tools/snapshots/ec-cagiana-migration/  setup-ec3.js · scrape-shop.js · shop-data.json · img/ · members.js · build-theme.js · theme/ · capture-ec3.js · capture-ec.js · make-project-src.js · work/ · NOTES.md
```
