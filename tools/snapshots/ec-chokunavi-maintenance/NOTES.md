# ec-chokunavi-maintenance — 作業メモ（再開用）

販促品直ナビ（www.chokunavi.shop、EC-CUBE 4、敷島産業株式会社）サーバー・セキュリティ・保守の動画。recorded 2026-11-15（タスクバーの日付）。

## 調査（公開ページのみ。2026-11-18）

- ノベルティ・販促品（名入れ・OEM）。運営 敷島産業株式会社（東京営業所 日本橋人形町）。自動見積・規格ごとの単価（税抜）・最小注文数
- 外から見えること（outside.js → outside.json）：
  - script タグが EC-CUBE **4.1** の default_frame.twig と同じ（jQuery 3.6.0 の integrity まで一致・Bootstrap 3.4.1・slick 1.6.0・function.js / eccube.js。4.2 以降の front.bundle.js がない）
    → フロントのテンプレートは 4.1 がもと。本体の版は外からはわからない
  - `Set-Cookie: maintenance_token=deleted`（MaintenanceListener、4.1 以降）、`eccube=…; secure; HttpOnly; SameSite=none`
  - HSTS max-age=15724800（ingress-nginx の既定値と同じ）・X-Frame-Options・X-XSS-Protection・nosniff。Server ヘッダーなし、CSP なし
  - 証明書：GlobalSign GCC R46 AlphaSSL CA 2025、CN www.chokunavi.shop、2026-11-11〜2026-12-17、TLS 1.3
  - chokunavi.shop（www なし）は DNS がない（ENOTFOUND）
- EC-CUBE 4.3.1-p1（2026-03-04）＝ 2段階認証の **MFA バイパス** の修正（compare 4.3.1...4.3.1-p1：TwoFactorAuthController / Listener / Service）。
  同日に 4.2.3-p2・4.1.2-p5 も

## 内容（決めたこと）

- 本番は EC-CUBE 4.3.1（引き継ぎ資料の想定。動画の依頼書に書く）。検証環境 = ローカルのコピー（http://localhost:8080、SQLite、会員・受注は入れない）
- 検証環境は 4.3.1 から始める：4.3.1-p1 で変わったファイルを 4.3.1 の版（GitHub raw）に戻してから撮影 → 動画の中で p1 のファイルを当てる（本物）
- 健康診断：ログイン履歴に /admin への総当たり（X-Forwarded-For で文書用アドレス 198.51.100.23・203.0.113.77、日付は過去 1 週間へ）
- Securitychecker42 の結果の送信先はローカルのスタブ（ec-cube.net へは送らない。コピーの services.yaml を書き換え）
- 管理画面 URL mng_7f3k2q、許可 IP 127.0.0.1 と 203.0.113.24（事務所）、TRUSTED_PROXIES=127.0.0.1、運営担当 ops01（2段階認証）
- サーバー側（nginx・PHP・権限・mysqldump・cron・logrotate・本番への反映）は再現

## 再実行の手順

```
node tools/snapshots/ec-chokunavi-maintenance/scrape-shop.js     # shop-data.json と画像（済）
node tools/snapshots/ec-chokunavi-maintenance/outside.js         # outside.json（済）
node tools/snapshots/ec-chokunavi-maintenance/capture-ec.js <shots>   # fresh なコピーから全工程 → js/ec-snapshot.js（30〜40 分）
node tools/snapshots/ec-chokunavi-maintenance/capture-2fa.js <shots>  # 2FA の回避・503 を Cookie のないブラウザで（merge）
node tools/webp.js ec-chokunavi-maintenance
npm run snapshot -- ec-chokunavi-maintenance                      # 公開中のショップ（home・detail）
npm run verify -- ec-chokunavi-maintenance --shots=… --out=<scratch>
npm run check -- ec-chokunavi-maintenance ; npm run pointer -- ec-chokunavi-maintenance ; npm run timeline -- ec-chokunavi-maintenance
```

## 状況

- [x] 調査・scrape-shop.js・outside.js・eccube-4.3.1-p1.diff・build-src.js（js/cn-src.js）
- [x] config.js・index.html・favicon・css・apps.js（CN）・files.js・scenario.js・docs・content/videos.ts（thumbAt 104：ログイン履歴）
- [x] capture-ec.js 完走（6 回目 2026-11-18 22:24〜22:47）＋ capture-2fa.js（22:48〜22:50、merge・assets/ec2：front-503・vuln-auth・vuln-set・vuln-fixed）
- [x] webp・snapshot（home・detail）・verify ✓ 9:35・check 0・pointer 0・timeline 575.4 s
- 失敗の記録：1 回目 raw の "4.3.1" がブランチ（p1 入り）→ refs/tags/4.3.1。2 回目 admin の 2FA ON 直後から /set へ → その場で tfa-set。
  3〜4 回目 capture 直後の cap.type が入らない（2FA コード・管理画面URL）→ page.evaluate で値を入れる。管理画面URL は w+ のみ（mng-… は不可 → mng_7f3k2q）。
  5 回目 403 の画面のあとログインの POST が止まった → EC-CUBE を再起動してから・止まったら再起動して再送。
  page.deleteCookie が効かない（2FA 済み・メンテナンスの Cookie が残る）→ capture-2fa.js を新しいブラウザで
- 取り込み直すときは capture-ec.js → capture-2fa.js の順（capture-2fa.js は ec-snapshot.js に追加する）

## わかったこと

- セキュリティチェックは 4 つの URL をサイト自身に取りに行かせる（php-wasm は 1 リクエストずつなので各 60 秒のタイムアウト）→ 約 250 秒
- プラグイン一覧はオーナーズストアにアップデートを問い合わせる（「アップデート対象プラグインはありません。」）。同梱プラグインは登録済み・無効
- システム情報の User Agent は HeadlessChrome → apps.js で Chrome に、セキュリティチェックの「前回確認日時」（Y-m-d H:i:s）の時刻は 10:19:06 に
- PHP のコードを JS の文字列に入れるときは String.raw（'\RobThree' がシェル経由で消えた）
