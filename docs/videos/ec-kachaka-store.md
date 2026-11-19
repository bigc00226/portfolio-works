# 制作プロセス デモ — kachaka Online Store（store.kachaka.life）EC-CUBE 4 デザインリニューアル（Twig）

> 一覧ページ（`/`）と再生ページ（`/watch/ec-kachaka-store`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/ec-kachaka-store/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）＋ VS Code ＋ Chrome で、長さは約 7 分 44 秒、画面上の日付は 2026/11/07（10:06〜）です。

画面録画用のデモページです。家庭用ロボット「カチャカ」の公式オンラインストア（https://store.kachaka.life 、EC-CUBE 4）の
**デザインリニューアル（Twig テンプレート）** を、開発環境の EC-CUBE で進めて本番へ反映するまでを再生します。

**現状の確認（標準テーマ）→ テンプレートの登録 → ヘッダー・フッター → ブロック・レイアウト → トップ・商品ページ → スマートフォン表示 → 本番への反映 → 公開中のストア**

## 最初に確認していただきたいこと

- store.kachaka.life は **EC-CUBE 4 で運営されている実在のストア**（株式会社Preferred Robotics）です。公開中のストアは有償テンプレート（`p4003`）をもとにしたデザインで、
  このデモは「EC-CUBE の標準テーマのストアを、今のデザインにリニューアルする」としたらどう進めるか、という **工程の再現** です。実際の制作の記録ではありません。
- **本物のもの**
  - **EC-CUBE の画面はすべて本物の EC-CUBE 4.3.1-p1** です。この PC の上で、公式の EC-CUBE 4.3.1-p1 を PHP 8.3（WebAssembly 版、`@php-wasm/node`）と SQLite で動かし（`tools/eccube/runtime.js`）、
    動画で行う操作を実際に行って取り込んだ 33 画面です（`tools/snapshots/ec-kachaka-store/capture-ec.js` → `js/ec-snapshot.js`・`assets/ec/`）。管理画面（ダッシュボード・商品一覧・テンプレート一覧 / アップロード・キャッシュ管理・ブロック管理・レイアウト管理）と、開発環境のショップ（PC 1920px / スマートフォン 390px）です。
  - **動画で入力するテンプレートと CSS は、EC-CUBE で実際に動いているもの** です。`js/files.js` の Twig / CSS（`app/template/kachaka/…`・`html/template/kachaka/assets/css/kachaka.css`）を、取り込みのときに動画と同じ順にローカルの EC-CUBE へ書き込み、その都度 EC-CUBE が描画したショップの画面を取り込んでいます。
    - テンプレート「kachaka」は、管理画面のテンプレートのアップロード（default の assets をコピーして `tar -a -c -f` で作った zip）で実際に登録・選択しました（`.env` の `ECCUBE_TEMPLATE_CODE` が kachaka に書き換わります）。
    - ブロック「お知らせバー」は ブロック管理 で実際に作成し（EC-CUBE がテーマの `Block/header_news.twig` に保存）、レイアウト管理の配置（お知らせバー・カテゴリナビ(PC) を左カラムへ・標準のブロックを外す）も実際に登録しました（ドラッグの動きは画面の上の再現で、配置後の画面は本物です）。
    - 3 つのミスも実際に起きたものです：`header.twig` を直しても本番モード（APP_ENV=prod）では表示が変わらない（コンパイル済みの Twig が使われる）→ キャッシュ管理で削除すると反映。`index.twig` の `{% endfor %}` の抜け → EC-CUBE のエラー画面（システムエラー）と、ターミナルに出すログの 1 行（EC-CUBE が `var/log/prod/` に書いたもの。日付だけ動画の日付に）。スマートフォン幅のヘッダー崩れ → `kachaka.css` に追加した指定で 1 行に。
    - 商品詳細の「カートに入れる」も実際のフォーム送信で、カートの画面はその結果です。
  - ショップのデータは、公開中のストアの公開ページから取り込んだものです：ショップ名、カテゴリ 4 つ（ID 13 / 7 / 8 / 12 と並びも本番と同じ）、トップに並ぶ 7 商品（商品 ID・商品名・税込価格・型番・カラー・説明文・一覧コメント・画像。画像は表示用に長辺 1000px に縮小）。
    税込価格が本番と同じになるよう、税率 10% の端数は切り捨てにしています（本番の設定は分かりません）。
  - ロゴ・アイコン（`logo.svg`・`logo-white.svg`・カート・SNS・メニュー）は公開中のストアのファイル、欧文フォントは Poppins（Google Fonts、SIL Open Font License）です。
  - 最後の公開中のストア（https://store.kachaka.life のトップ・商品詳細・商品一覧、PC / スマートフォン）は、公開ページをそのまま取り込んだものです（`npm run snapshot -- ec-kachaka-store`、2026-11-18 取得）。
- **再現のもの**
  - リニューアル前の状態（標準テーマのストア）と作業の順序・ミス。公開中のストアが以前どのデザインだったかは分かっていません。
  - Twig / CSS のソース：公開中のストアのテンプレートは公開されていないため、公開ページの HTML / CSS（色 #1c2742・#fffaf3・#dfccbb・#ff5e5e、Poppins、レイアウトの寸法）を見て、EC-CUBE の標準のクラス名（`ec-headerNaviRole`・`ec-itemNav`・`ec-productRole` …）で書き直したものです。
    そのため開発環境の画面は公開中のストアに近い見た目ですが同じではありません（例：トップの「カチャカ」の価格は本番では分割払いの月額の表示、商品詳細の「Accessory」の選択欄は作っていません）。
  - 商品一覧は取り込んだ 7 商品だけです（公開中の一覧にある法人向けの個別商品は取り込んでいません）。お知らせは公開中のストアにないため 0 件で、お知らせバーは帯だけです。
  - 開発環境の URL（http://localhost:8080 、Docker）、プロジェクトのフォルダー（C:\dev\kachaka-store）、`.env` の値、ターミナルの出力（git・ssh・本番サーバー）、本番の管理画面での設定は再現です。取り込みに使った EC-CUBE は使い捨てのローカルのコピーで、ログインはそのコピー専用の admin / password だけです（実在のストアの管理画面・オーナーズストアには一切ログインしていません）。
- kachaka Online Store は実在のストアです。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 現状の確認 | Chrome（localhost:8080・管理画面）＋ VS Code | 標準テーマのままのストア（取り込んだカテゴリ・商品）、商品管理 › 商品一覧（7 商品）、オーナーズストア › テンプレート（デフォルトだけ）、README のリニューアル方針 | |
| 2 テンプレートの登録 | ターミナル ＋ 管理画面 | default の assets をコピーして `kachaka.zip` を作成 → テンプレートの新規作成（コード kachaka・名前・zip）でアップロード → kachaka を選んで登録 → `.env` の `ECCUBE_TEMPLATE_CODE=kachaka` | |
| 3 ヘッダー・フッター | VS Code ＋ 開発環境のショップ ＋ キャッシュ管理 | デザインの素材（ロゴ・アイコン・Poppins）、`kachaka.css`、`default_frame.twig` に読み込みの 1 行 → `Block/header.twig`・`nav_sp.twig`・`footer.twig` | **反映されない**：ナビに「お問い合わせ」を足しても変わらない（APP_ENV=prod のコンパイル済み Twig）→ コンテンツ管理 › キャッシュ管理 で削除 |
| 4 ブロック・レイアウト | 管理画面 ＋ VS Code | ブロック管理でブロック「お知らせバー」（`header_news.twig`）を作成 → レイアウト管理（トップページ用・下層ページ用）でヘッダー・左カラムに配置、標準のブロックを外す → `Block/category_nav_pc.twig`（Categories） | |
| 5 トップ・商品ページ | VS Code ＋ ショップ ＋ ターミナル | `index.twig`（カテゴリごとの商品・SOLD OUT）→ `Product/list.twig`・`Product/detail.twig` → 商品詳細 → カートに入れる → 商品一覧 | **システムエラー**：`{% endfor %}` の抜け → ログの `Unexpected "endblock" tag` を確認して修正 |
| 6 スマートフォン表示 | Chrome（DevTools のデバイスモード 390px）＋ VS Code | トップ・商品詳細をスマートフォン幅で確認 | **ヘッダー崩れ**：PC のヘッダーのまま → `kachaka.css` の 767px 以下に、メニューボタン・ロゴ・カートの 1 行の指定 |
| 7 本番への反映 | ターミナル ＋ 管理画面 | `git add / commit / push`、本番サーバーで `git pull`・`bin/console cache:clear`、本番の管理画面でも同じ設定 | |
| 公開中のストア | Chrome | store.kachaka.life のトップ・商品詳細・スマートフォン表示 | |

### 日本語入力（Microsoft IME と同じ流れ）

ブロック名（お知らせバー）、テンプレートに書く日本語（お問い合わせ・税込・コメント）、コミットメッセージは、ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。英数字は IME をオフにして入力し、画面下に押したキーを表示します。

## 取り込み直すとき

```
node tools/snapshots/ec-kachaka-store/capture-ec.js --shots=<フォルダー>   # 本物の EC-CUBE の画面（10〜20 分）
node tools/webp.js ec-kachaka-store
npm run snapshot -- ec-kachaka-store                                       # 公開中のストア
npm run verify -- ec-kachaka-store ; npm run check -- ec-kachaka-store ; npm run pointer -- ec-kachaka-store ; npm run timeline -- ec-kachaka-store
```

- EC-CUBE のコピー（`../eccube-local/inst/ec-kachaka-store`）は取り込みのたびにデータベース・`.env`・テーマのフォルダーを元に戻して使います（`--fresh` で作り直し）。商品画像は `../eccube-local/data/ec-kachaka-store/save_image`、ショップのデータは `tools/snapshots/ec-kachaka-store/shop-data.json`、デザインの素材は `tools/snapshots/ec-kachaka-store/theme/` にあります。
- 動画のテンプレートのソースは `js/files.js` の 1 か所で、取り込みも同じファイルを読みます（ソースを変えたら取り込み直してください）。
