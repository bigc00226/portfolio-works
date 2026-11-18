# ec-l-meal-payment — 作業メモ（再開用）

ライフミール（l-meal.com、EC-CUBE 4）決済システムの動画。recorded 2026-09-24（タスクバーの日付）。

## 内容（決めたこと）

- 公開ページの調査：支払方法はクレジットカード（VISA・Mastercard・JCB・AMEX・Diners）・GMO後払い（手数料 0 円・累計 55,000 円まで）・Amazon Pay。
  FAQ「冷凍庫レンタルをご希望の場合はクレジットカードのみ」「クレジット決済関連のメールは mailinfo@cardservice.co.jp から」。送料 980 円（沖縄 1,480 円）
- 作業（再現）：EC-CUBE 4.3 の開発環境で
  1. GMO後払い：手数料 330 → 0 円、利用条件 〜55,000 円（管理画面 › 支払方法設定）
  2. カード決済プラグイン LmealPayment（PaymentMethodInterface：verify / apply / checkout、FormTypeExtension でトークン、TemplateEvent でカード入力欄、テストモードのトークン JS とゲートウェイ）
  3. bin/console でインストール・有効化 → プラグイン一覧・支払方法一覧・配送方法の取扱支払方法
  4. テスト注文 → 購入エラー（確認画面のフォームはトークンを送らない：checkout() は skip_add_form）→ confirm.twig にスニペット → 完了
  5. 受注管理：入金済み・入金日・ショップ用メモ（取引 ID）、メール通知（appendCompleteMailMessage）
  6. 冷凍庫レンタルはカードのみ（PurchaseFlow の ItemHolderValidator、@ShoppingFlow）、8回まとめ買い 20食 63,200 円では後払いが出ない
  7. 本番へ反映（再現）
- コードの唯一のソース：public/videos/ec-l-meal-payment/js/payment-src.js（動画とキャプチャーの両方が読む）

## 再実行の手順

```
node tools/snapshots/ec-l-meal-payment/scrape-shop.js        # shop-data.json と ../eccube-local/data/ec-l-meal-payment/save_image（済）
node tools/snapshots/ec-l-meal-payment/capture-ec.js <shots> # fresh なコピーから全工程（15〜25 分）→ js/ec-snapshot.js
node tools/webp.js ec-l-meal-payment
npm run snapshot -- ec-l-meal-payment                         # 公開中のサイト（config.js の snapshot）
npm run verify -- ec-l-meal-payment --shots=… --out=<scratch>
npm run check -- ec-l-meal-payment ; npm run pointer -- ec-l-meal-payment ; npm run timeline -- ec-l-meal-payment
```

- capture-ec.js は毎回 fresh。途中で止めたときは、その EC-CUBE の node（とその子の chrome）を止めてから再実行
  （PowerShell：Get-CimInstance Win32_Process で CommandLine に capture-ec.js を含む node を探して Stop-Process）。
- わかったこと（php-wasm の EC-CUBE 4.3）：
  - 同梱プラグインはフォルダー（app/Plugin・html/plugin）と var/cache/prod を最初の起動前に消し、テーブル（plg_*・oauth2_*）も DROP
    （残すと eccube:plugin:install のスキーマ更新が失敗：マッピングのフォルダーがない／oauth2_scope 型が不明）
  - eccube:plugin:install / enable は最後に cache:clear をサブプロセスで起動して失敗する（proc_open 不可）：インストール・有効化そのものは
    済んでいるので、cache:clear は cap.console で実行し出力をつなぐ（pluginConsole）
  - プラグインの有効化・cache:clear のあと管理画面・ショップのセッションが切れることがある → adminLogin / frontLogin で必要なら再ログイン
  - 配送方法の編集フォームは button クリックでは送信されない（HTML5 の検証）→ form.submit()

## 状況（2026-11-18）

- [x] 調査・データ・payment-src.js・capture-ec.js（全工程が通る。最後に process.exit）・動画の全ファイル・content/videos.ts・docs
- [x] capture → webp → npm run snapshot（tradelaw / faq / plan）
- [x] verify ✓ 9:48・check 0・pointer 0・timeline 586.8 s（thumbAt 352：購入エラーの画面）
- 残り：サムネイルをカード入力欄の場面にしたいときは thumbAt を 340 前後で調整して timeline
