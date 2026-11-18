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

- capture-ec.js は毎回 fresh。途中で止めたときは、その EC-CUBE の node（とその子の chrome）を止めてから再実行。

## 状況

- [x] 調査・scrape-shop.js・shop-data.json（MENU 20 品）・payment-src.js・capture-ec.js
- [ ] capture の実行と画面の確認（1 回目：同梱プラグインのフォルダーを消したあとも古いコンテナが残り eccube:plugin:install が失敗
      → フォルダーと var/cache/prod を最初の起動の前に消すように修正済み）
- [x] index.html / config.js / files.js（build-core.js → eccube-core.js）/ apps.js / scenario.js（下書き）/ css
- [x] content/videos.ts のエントリー（thumbAt は timeline の後で）・docs/videos/ec-l-meal-payment.md（__LEN__ などを埋める）
- [ ] npm run snapshot
- [ ] webp / verify / check / pointer / timeline（thumbAt）
