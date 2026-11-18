# ec-kuretake-btob — 作業メモ（再開用）

呉竹 BtoBオンライン注文サイト（order.kuretake.co.jp、EC-CUBE 4）に BtoB 機能を組み込む動画。recorded 2026-10-01（タスクバーの日付）。

## 内容（決めたこと）

- 公開ページの調査（ログインなし）：カタログ・定価（税抜）・発注単位（墨滴・筆ぺんは 10 個、半紙 10 / 25）・JAN は公開、カートはログイン後。
  新規会員登録は「仮登録 → 呉竹が確認 → 本登録完了メール」（/features/new_customer）。登録フォームは会社名必須・業界・既存取引。
  特定商取引法の支払方法：銀行振込・手形・小切手・口座振替（個別契約）。2026-09-24 にサイトをリニューアル（お知らせ）
- 作業（再現。コードは本物で、ローカルの EC-CUBE 4.3.1-p1 で実際に動かしたもの）：
  1. 取引先情報：CustomerTrait（取引先コード・業界・掛率・掛け払い）、ProductTrait（発注単位）、管理画面の FormExtension（auto_render）
     → eccube:generate:proxies → doctrine:schema:update
  2. 承認制：基本設定の仮会員機能 ON、EntryTypeExtension（会社名必須）、CustomerApprovalSubscriber（entry_activate を 404、
     仮会員 → 本会員で sendCustomerCompleteMail）、Entry/complete.twig・Mail/entry_confirm(.html).twig の文面
  3. 卸価格：WholesalePriceSubscriber（Doctrine postLoad、price02 = price01 × 掛率）。1 回目は flush で商品マスタの price02 が
     卸価格で上書きされる（本物のバグ）→ setOriginalEntityProperty で修正、マスタを管理画面で戻す。MemberOnlyOrderSubscriber
     （cart / shopping はログイン必須）、Product/detail.twig・list.twig、messages.ja.yaml（通常価格 → 定価）、customize.css
  4. 発注単位：OrderUnitValidator（@CartFlow、切り上げてお知らせ）
  5. 掛け払い：支払方法を管理画面で追加、OrderTypeExtension（承認済みの取引先だけ）。配送方法の取扱支払方法を忘れて出ない（ミス）→ 追加
  6. 受注管理（会社名・掛け払い・卸価格の明細）、本番へ反映（再現）
- コードの唯一のソース：public/videos/ec-kuretake-btob/js/b2b-src.js（動画とキャプチャーの両方が読む）
- EC-CUBE 本体のテンプレート（コピー元）：js/eccube-core.js（build-core.js で base から生成）

## 再実行の手順

```
node tools/snapshots/ec-kuretake-btob/scrape-shop.js        # shop-data.json と ../eccube-local/data/ec-kuretake-btob/save_image
node tools/snapshots/ec-kuretake-btob/build-core.js         # js/eccube-core.js
node tools/snapshots/ec-kuretake-btob/capture-ec.js --shots=<scratch>/shots   # fresh なコピーから全工程（15〜25 分）
node tools/webp.js ec-kuretake-btob
npm run snapshot -- ec-kuretake-btob                         # 公開中のサイト（config.js の snapshot）
npm run verify -- ec-kuretake-btob --shots=… --out=<scratch>
npm run check -- ec-kuretake-btob ; npm run pointer -- ec-kuretake-btob ; npm run timeline -- ec-kuretake-btob
```

- capture-ec.js は毎回 fresh。途中で止めたときは、その EC-CUBE の node（とその子の chrome）を止めてから再実行。

## 状況

- [x] 調査・scrape-shop.js・shop-data.json（29 商品）・b2b-src.js・build-core.js・capture-ec.js
- [x] index.html / config.js / files.js / apps.js / scenario.js（下書き）/ css
- [ ] capture の実行と画面の確認
- [ ] npm run snapshot、webp / verify / check / pointer / timeline（thumbAt）
- [ ] content/videos.ts のエントリー、docs/videos/ec-kuretake-btob.md
