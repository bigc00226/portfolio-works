# ec-garage-forms — 作業メモ（再開用）

Garage（garage.plus.co.jp、EC-CUBE 2）帳票・PDF・CSV の動画。

## 取り込みのやり直し

```
node tools/snapshots/ec-garage-forms/fetch-garage-data.js   # 公開ページ → data/garage.json と ../eccube-local/garage-img/（済）
node tools/snapshots/ec-garage-forms/build-core.js          # EC-CUBE 2 本体の SC_Fpdf.php など → js/eccube-core.js（済）
node tools/snapshots/ec-garage-forms/capture-ec.js --shots=<scratch>   # 本物の EC-CUBE 2 で操作 → js/ec-snapshot.js・assets/pdf/
node tools/webp.js ec-garage-forms
npm run snapshot -- ec-garage-forms                         # 公開中のサイト（config.js の snapshot）
```

- capture-ec.js は毎回 fresh（../eccube-local/inst/ec-garage-forms を作り直す、12 秒）。ポート 8934。
  途中で止めたときは、8934 で待ち受けている node（とその子の chrome）を止めてから再実行。
- 動画で入力するコード・SQL は js/garage-src.js（capture-ec.js も同じものを EC-CUBE に書き込む）。

## 済
- 公開データ取得（25 商品 + 新着 8 商品、ロゴ）・content/videos.ts にエントリー
- index.html / config.js / garage-src.js / eccube-core.js / files.js / apps.js / scenario.js / css / site-icons.js（サイトの SVG スプライト）
- capture-ec.js（PDF 4 種 + ビューア、出荷 CSV、SQL のシステムエラーと error.log、商品 CSV の価格エラー / 成功）→ webp 済み
- npm run snapshot -- ec-garage-forms 済み（home / fresh / desk）
- docs/videos/ec-garage-forms.md（長さは timeline の後で更新）

## チェック（2026-11-18）
- verify ✓（8:26）・check 0・pointer 0・timeline 505.5 s、thumbAt 174（納品書 PDF・品番の列）
- 開発用の fix-site-snapshot.js：snapshot を取り直したら実行（サイトの SVG スプライトを埋め込む）

## 残り・メモ
- 商品登録CSV の file input は取り込みの Chrome の表示のまま英語（Choose File / No file chosen）
- アセット 11 件（EC-CUBE 2 の CSS が参照する user_data/packages/default/img/contents/*.jpg、本体にない画像）は取得できず：実物でも 404
