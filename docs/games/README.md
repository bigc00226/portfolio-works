# ゲーム（ゲームタブ）の作り方

ゲームタブのゲームは、`public/games/<id>/` に置く静的な HTML / JavaScript のページです。ビルドの工程はなく、Next.js がそのまま配信します。一覧のカード（`content/sites.ts` の `games`）の URL は `/games/<id>/index.html`（Next.js は `public/` のフォルダーの URL では index.html を返さないため）で、ライブプレビューでは iframe の中で遊べます。

## フォルダの構成

```
public/games/<id>/
  index.html     入口（タイトル・favicon・共通部品の読み込み）
  game.js        ゲーム本体（大きいときは複数のファイルに分けてかまいません）
  style.css      ゲームの見た目
  icon.svg       favicon とカードのアイコン（コードで描いた SVG）
  images.json    ゲームで使う画像の一覧と、AI で生成するためのプロンプト（下記）
  img/           images.json の画像（npm run game-images が書き出します）
docs/games/<id>.md            ゲームの説明（遊び方・ルール・独自の要素・技術メモ）
docs/games/prompts/<id>.md    画像の生成プロンプトのシート（npm run game-images が書き出します）
```

`index.html` の基本形:

```html
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>縁側将棋 ― 本将棋 vs CPU</title>
  <meta name="description" content="…">
  <meta name="theme-color" content="#…">
  <link rel="icon" href="icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../shared/games/kit.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  …
  <script src="../../shared/games/kit.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

## 共通部品（`public/shared/games/kit.js`・`kit.css`）

`window.GK` に、どのゲームでも使うものをまとめています（詳しくは kit.js の冒頭のコメント）。

- `GK.init({ id, title, help, menu })` ― 右上の丸ボタン（メニュー・遊び方・音の切り替え）と保存先の名前
- `GK.store.get/set` ― ベストスコア・続きのデータの保存（localStorage。`game:<id>:` の下）
- `GK.loadImages([...])` ― `img/<name>.webp` の読み込み
- `GK.fit(canvas, { w, h })` ― canvas を高解像度の画面に合わせ、論理座標で描けるようにします（固定サイズのレターボックス、または画面いっぱい）
- `GK.loop`・`GK.pointer`・`GK.keys` ― ゲームループとマウス / タッチ / キー入力
- `GK.sfx(name)`・`GK.tone`・`GK.noise`・`GK.music.play(song)` ― 効果音と BGM（WebAudio で合成。音のファイルは使いません）。`GK.scales` に陽音階・都節などの日本の音階があります
- `GK.modal`・`GK.toast`・`GK.help` ― ダイアログ・短いお知らせ・遊び方
- `GK.rng(seed)`・`GK.tween`・`GK.ease` ― 乱数（シード付き）・アニメーション

色は各ゲームの `style.css` で `--gk-accent`・`--gk-paper`（ページの背景）などの変数を上書きします（kit.css は `html.gk body` に背景色を付けているので、body の背景を変えるときは変数か `html.gk body { … }` で）。フォントはシステムの日本語フォント（`--gk-sans` ゴシック・`--gk-serif` 明朝・`--gk-round` 丸ゴシック）です。

## 守ること

- **オリジナルのゲームにします。** ジャンル・仕組みが同じなのはかまいませんが、特定の既存ゲームの名前・キャラクター・絵・音楽・ステージ・見た目を再現しません（名前を変えても、オリジナルと称しても不可）。将棋・花札・麻雀・大富豪・百人一首・リバーシなどの伝統的なゲームのルールは自由に使えます（「オセロ」は商標なので「リバーシ」と呼びます）。
- **音楽は自作。** BGM は GK.music などで新しく作曲したものだけ。既存の曲（ゲーム・アニメ・歌謡曲）のメロディーは使いません（作者不詳の古い民謡・わらべ歌は可）。
- **外部に通信しません。** CDN・外部フォント・解析タグ・外部 API は使いません。自分のフォルダと `public/shared/games/` のファイルだけを読み込みます。
- **PC とスマホの両方で遊べるように。** ライブプレビューの PC（1440×900）とスマホ（390×844 の縦長）で、ページがスクロールせず画面に収まり、マウス・タッチ・キーボード（向いているもの）で操作できること。その中間（1024×768、768×1024、844×390 の横長スマホ）でも崩れないこと。
- **タイトル画面 → 遊ぶ → 結果** の流れを作ります。タイトルはゲーム名を HTML の文字で（画像の中に文字を入れない）。難易度やモードの選択、ベストスコアの記録、遊び方（GK.init の help）を用意します。
- **伝統ゲームのルールは正確に。** 採用したローカルルールは、遊び方とドキュメントに書きます。データ（和歌・熟語・魚の名前など）は、公開されている資料で確かめてから使います（ログインが必要なサービスは使いません）。

## 画像（いまは画像サンプル、あとで AI で生成）

ゲームで使う画像は `images.json` に一覧にし、`npm run game-images -- <id>` で「画像サンプル」（色・形・名前・サイズを描いた仮の画像）を `img/` に作ります。あとで AI ツールで生成した画像を `img/<name>.png` として保存し、もう一度 `npm run game-images -- <id>` を実行すると、指定のサイズの WebP に変換して差し替わります（透過が必要な画像は単色の背景を自動で切り抜きます）。

- **画像サンプルのままでも、遊べて見た目も整っていること。** ゲームの進行に欠かせない絵（駒・牌・トランプ・弾・ブロックなど）は、コード（canvas / SVG / CSS）で描くか、サンプルのラベルで何の絵か分かるようにします。画像を差し替えたら自動でよくなる場所に画像を使います（キービジュアル・背景・人物・カードの絵柄・図鑑の絵など）。
- **画像に文字を入れません。** ゲーム名・説明・数字は HTML / canvas で描きます。
- **画像ごとに、向いている AI ツールを選びます**（`tool`）。プロンプトはそのツールの書き方（Midjourney なら `--ar` などのパラメーター）で書き、どのツールでも使える英文の `generic` と、日本語の説明 `ja` を必ず付けます。1 つのゲームで、向いているものに合わせて複数のツールを使い分けます。ただし、同じ組の絵（花札 48 枚・同じ人物の表情違いなど）は、絵柄がそろうように同じツールにし、`ref`（参照画像）と `notes` でそろえ方を書きます。
  - `midjourney` ― 絵画的・写実的な背景、キービジュアル
  - `niji` ― アニメ調の人物・立ち絵・イベント絵
  - `chatgpt` ― 透過 PNG が必要なアイテム・スプライト、指示どおりの構図
  - `gemini` ― 同じ人物・同じ物の表情違い・ポーズ違い（元画像を添付して編集）
  - `sdxl` / `flux` ― ドット絵、細かい設定で量産するタイル・素材
  - `firefly` ― 商用利用を重視する写真風の素材
  - `ideogram` ― ポスター・パッケージ風の構図
  - `recraft` ― フラットなアイコン・ベクター風のイラスト
  - `leonardo` ― ゲームアセット（透過）・テクスチャ
- 透過が必要な画像（`alpha: true`）は、プロンプトで「単色の無地の背景（白か、題材にない色）」を指定します（透過が出せるツールは透過を指定）。
- 実在の人物・現存する作家の作風・特定のゲーム / アニメ / ブランドの名前や絵柄をプロンプトに入れません。
- `images.json` の形式は `tools/game-images.js` の冒頭のコメントにあります。

## 確認

```
npm run game-images -- <id>                 画像サンプルの作成・プロンプトのシートの書き出し
npm run game-check -- <id> --out=<フォルダ>   PC / スマホの大きさで開き、エラー・読み込めないファイル・スクロール・画像のサイズを確認（スクリーンショットも保存）
npm run capture -- <id>                      カードのプレビュー画像の撮影（content/sites.ts に追加したあと）
```

`window.__gameSelfTest`（async 関数。`{ ok, notes }` を返す）を定義しておくと、`game-check` がそれを実行します。タイトルから 1 回遊ぶ・CPU に 1 手指させるなど、自動で確かめられる操作を入れておきます。`window.__shot('名前')` でその時点のスクリーンショットを撮れます。
