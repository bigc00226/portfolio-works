# ec-cagiana-migration — 作業メモ（再開用）

CAGIANA《カジーナ》（cagiana.jp、公開ページは EC-CUBE 3.0.17）を EC-CUBE 4.3 へ移す「データ移行」の動画。

## 構成（決めたこと）

- 移行元：`../eccube-local/ec3-cagiana` = EC-CUBE 3.0.18-p7（公式 eccube-3.0.18.zip の vendor ＋ 3.0.18-p7 のソース ＋ p7 の composer.lock で
  変わった 4 パッケージ）。PHP 7.4（WebAssembly）で動かすための 2 つの回避（setup-ec3.js の shim()）：
  - `libxml_use_internal_errors()` が PHP 7.4 の wasm 版で落ちる（zend_llist_destroy）→ Symfony の 2 つの名前空間に同名関数（vendor/eccube-local/wasm-shim.php を Composer の autoload files に）
  - Twig 1.34 が PHP 7.4 の preg_match_all の変更で `{{` の前の空白を消す（管理画面のアイコンが巨大になる）→ Lexer.php の 1 行（Twig 自身の後の版と同じ判定）
- 移行の道具：EC-CUBE 公式「EC-CUBE4系移行用バックアッププラグイン(3.0系)」（github.com/EC-CUBE/data-backup-plugin-v3）→
  「データ移行プラグイン for EC-CUBE4」の 4.3 対応版 DataMigration42（github.com/chihiro-adachi/data-migration-plugin ブランチ 4.2、v4.3.0）。
  依存ライブラリ 6 つは Packagist → GitHub のアーカイブを vendor に置き、Composer の autoload files に登録（capture-ec.js の deps()）。
- SQLite ではプラグインの PostgreSQL 用 SQL（SET session_replication_role・pg_class / setval）で止まる → 実際のシステムエラーとログを動画に使い、
  js/migrate-src.js の patch（else → elseif postgresql 4 か所、setIdSeq は PostgreSQL のときだけ）で再実行。
- 移行後は dtb_member も旧サイトのものになり、管理画面のセッションが切れる → ログインし直し（ECCUBE_AUTH_MAGIC を先に旧の値にしてある）。
- 会員・受注は架空（members.js：見本 ○○、sampleNN@example.com、パスワード cagiana-sample-2026）。後から 1 会員・2 受注（当日分）→ backup-2 で差分移行。

## 再実行の手順

```
node tools/snapshots/ec-cagiana-migration/setup-ec3.js           # EC-CUBE 3.0.18-p7（一度だけ。--fresh でやり直し）
node tools/snapshots/ec-cagiana-migration/scrape-shop.js         # shop-data.json と img/
node tools/snapshots/ec-cagiana-migration/build-theme.js         # theme/（Twig 3 のテーマ cagiana と旧テーマの CSS・画像）
node tools/snapshots/ec-cagiana-migration/capture-ec3.js <shots> # EC-CUBE 3 の画面・work/backup-1/2.tar.gz（約 7 分）
node tools/snapshots/ec-cagiana-migration/capture-ec.js <shots>  # EC-CUBE 4.3：移行を実行して画面（約 15 分、ec-snapshot.js に merge）
node tools/snapshots/ec-cagiana-migration/make-project-src.js    # VS Code に出すファイル（js/project-src.js）
node tools/webp.js ec-cagiana-migration
npm run snapshot -- ec-cagiana-migration                          # 公開中のショップ（/ec・商品 103・商品一覧）
```

capture-ec3.js → capture-ec.js の順（ec-snapshot.js を EC-CUBE 3 で作り直してから 4 を merge）。

## 状況（2026-11-18 22:30 完了）

- [x] setup-ec3 / scrape / build-theme / capture-ec3 / capture-ec（移行 37・44・12・16 件、差分で受注 18・会員 13。当日分は 11/11 15:12・18:41）
- [x] fix-frame-images.js（メニューのバナー画像 15 枚を公開中のショップから）。product_bgimg.png（インラインの背景画像）も同様に assets/ec/html/template/cagiana/img へ手で取得済み — 次に取り込み直すときは build-theme.js がバナーを theme/ に入れるので fix は不要のはず、背景画像だけ要確認
- [x] webp・make-project-src、docs/videos/ec-cagiana-migration.md（8:47）、content/videos.ts（thumbAt 383 = テーマ cagiana の商品ページ）
- [x] verify ✓（8:47）・check 0・pointer 0・timeline（サムネイル確認済み）

## 注意

- 取り込み直すと ec-snapshot.js の日付・パスが変わるので、capture-ec3.js → capture-ec.js → fix-frame-images.js → webp → make-project-src の順で全部
- 移行前の画面（front-103-noimg・front-mypage）の商品画像は、取り込みの最後に画像をまとめて保存する capture.js の仕組みで表示されてしまうため、scenario.js の noImages() で当時と同じ「画像なし」に戻している
