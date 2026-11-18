# 花暦こいこい ― 画像の生成プロンプト

ゲーム: `public/games/hanafuda-koikoi/`（53 枚中 0 枚が生成済み、53 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/hanafuda-koikoi/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

日本の伝統的な花札の意匠をもとにした、落ち着いた和の世界。札は木版画のような平らな色面と黒い輪郭線（朱・黒・深緑・黄土・藍・白）。背景とキービジュアルは緋毛氈の朱と夜の藍、金のアクセント。人物はやわらかいアニメ調で江戸風の装い。どの画像にも文字・数字・ロゴを入れない（月の数字や札の種類はゲームが描きます）。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/hanafuda-koikoi/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- hanafuda-koikoi` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- hanafuda-koikoi`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/card-01-1.webp`](#card-01-1) | 300×480 | カード | 札の絵柄（1月・松の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-01-2.webp`](#card-01-2) | 300×480 | カード | 札の絵柄（1月・松の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-01-3.webp`](#card-01-3) | 300×480 | カード | 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-01-4.webp`](#card-01-4) | 300×480 | カード | 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-1.webp`](#card-02-1) | 300×480 | カード | 札の絵柄（2月・梅のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-2.webp`](#card-02-2) | 300×480 | カード | 札の絵柄（2月・梅の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-3.webp`](#card-02-3) | 300×480 | カード | 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-4.webp`](#card-02-4) | 300×480 | カード | 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-1.webp`](#card-03-1) | 300×480 | カード | 札の絵柄（3月・桜の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-2.webp`](#card-03-2) | 300×480 | カード | 札の絵柄（3月・桜の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-3.webp`](#card-03-3) | 300×480 | カード | 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-4.webp`](#card-03-4) | 300×480 | カード | 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-1.webp`](#card-04-1) | 300×480 | カード | 札の絵柄（4月・藤のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-2.webp`](#card-04-2) | 300×480 | カード | 札の絵柄（4月・藤の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-3.webp`](#card-04-3) | 300×480 | カード | 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-4.webp`](#card-04-4) | 300×480 | カード | 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-1.webp`](#card-05-1) | 300×480 | カード | 札の絵柄（5月・菖蒲のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-2.webp`](#card-05-2) | 300×480 | カード | 札の絵柄（5月・菖蒲の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-3.webp`](#card-05-3) | 300×480 | カード | 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-4.webp`](#card-05-4) | 300×480 | カード | 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-1.webp`](#card-06-1) | 300×480 | カード | 札の絵柄（6月・牡丹のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-2.webp`](#card-06-2) | 300×480 | カード | 札の絵柄（6月・牡丹の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-3.webp`](#card-06-3) | 300×480 | カード | 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-4.webp`](#card-06-4) | 300×480 | カード | 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-1.webp`](#card-07-1) | 300×480 | カード | 札の絵柄（7月・萩のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-2.webp`](#card-07-2) | 300×480 | カード | 札の絵柄（7月・萩の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-3.webp`](#card-07-3) | 300×480 | カード | 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-4.webp`](#card-07-4) | 300×480 | カード | 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-1.webp`](#card-08-1) | 300×480 | カード | 札の絵柄（8月・芒の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-2.webp`](#card-08-2) | 300×480 | カード | 札の絵柄（8月・芒のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-3.webp`](#card-08-3) | 300×480 | カード | 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-4.webp`](#card-08-4) | 300×480 | カード | 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-1.webp`](#card-09-1) | 300×480 | カード | 札の絵柄（9月・菊のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-2.webp`](#card-09-2) | 300×480 | カード | 札の絵柄（9月・菊の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-3.webp`](#card-09-3) | 300×480 | カード | 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-4.webp`](#card-09-4) | 300×480 | カード | 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-1.webp`](#card-10-1) | 300×480 | カード | 札の絵柄（10月・紅葉のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-2.webp`](#card-10-2) | 300×480 | カード | 札の絵柄（10月・紅葉の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-3.webp`](#card-10-3) | 300×480 | カード | 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-4.webp`](#card-10-4) | 300×480 | カード | 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-1.webp`](#card-11-1) | 300×480 | カード | 札の絵柄（11月・柳の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-2.webp`](#card-11-2) | 300×480 | カード | 札の絵柄（11月・柳のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-3.webp`](#card-11-3) | 300×480 | カード | 札の絵柄（11月・柳の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-4.webp`](#card-11-4) | 300×480 | カード | 札の絵柄（11月・柳のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-1.webp`](#card-12-1) | 300×480 | カード | 札の絵柄（12月・桐の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-2.webp`](#card-12-2) | 300×480 | カード | 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-3.webp`](#card-12-3) | 300×480 | カード | 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-4.webp`](#card-12-4) | 300×480 | カード | 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（暗くして上にタイトルの文字と設定を重ねます） | Ideogram（3.0） |
| ⬜ | [`img/bg-table.webp`](#bg-table) | 1600×900 | 背景 | 対局画面の背景（全面。上に札と情報パネルを重ね、周りを暗くします） | Adobe Firefly（Image 4） |
| ⬜ | [`img/cpu-koume.webp`](#cpu-koume) | 512×512 | 人物 | 対戦相手「小梅」（やさしい）の顔。タイトルの相手選びと対局中の情報パネル（角丸の正方形に切り抜き） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-ryusai.webp`](#cpu-ryusai) | 512×512 | 人物 | 対戦相手「柳斎」（ふつう）の顔。タイトルの相手選びと対局中の情報パネル | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-sogetsu.webp`](#cpu-sogetsu) | 512×512 | 人物 | 対戦相手「宗月」（つよい）の顔。タイトルの相手選びと対局中の情報パネル | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="card-01-1"></a>

## 1月 松に鶴（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-01-1.webp`（300×480px）
- 用途: 札の絵柄（1月・松の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 1月（松）の光札：松の下に立つ丹頂鶴、背後に大きな朱色の日の出。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 48 枚の絵柄をそろえる基準の 1 枚です。最初にこの札を作り、気に入った 1 枚を決めてから、ほかの 47 枚のプロンプトの `--sref` にこの画像の URL を入れて生成します（`--sw 300` で絵柄を強めに合わせます）。同じ月の 4 枚は、続けて生成して色味をそろえると自然です。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a red-crowned crane standing under a stylised pine tree, a large vermilion rising sun behind it --ar 5:8 --v 7 --style raw --stylize 150 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a red-crowned crane standing under a stylised pine tree, a large vermilion rising sun behind it. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-01-2"></a>

## 1月 松に赤短（赤短）

- ファイル: `public/games/hanafuda-koikoi/img/card-01-2.webp`（300×480px）
- 用途: 札の絵柄（1月・松の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 1月（松）の赤短札：松の枝に、文字のない赤い短冊がかかる。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「赤短」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: stylised pine branches with a plain red poem ribbon (tanzaku) hanging across them, the ribbon left completely blank --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): stylised pine branches with a plain red poem ribbon (tanzaku) hanging across them, the ribbon left completely blank. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-01-3"></a>

## 1月 松のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-01-3.webp`（300×480px）
- 用途: 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 1月（松）のカス札：赤い空を背にした松の枝（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: stylised pine branches with clusters of dark green needles over a red sky, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): stylised pine branches with clusters of dark green needles over a red sky, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-01-4"></a>

## 1月 松のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-01-4.webp`（300×480px）
- 用途: 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 1月（松）のカス札：赤い空を背にした松の枝（カス・その 2、枝ぶりを変える）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: stylised pine branches and a low pine trunk over a red sky, variation B with a different branch layout --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): stylised pine branches and a low pine trunk over a red sky, variation B with a different branch layout. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-02-1"></a>

## 2月 梅に鶯（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-1.webp`（300×480px）
- 用途: 札の絵柄（2月・梅のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）のタネ札：紅梅の枝にとまる鶯。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a small olive-green bush warbler perched on a plum branch with red plum blossoms --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a small olive-green bush warbler perched on a plum branch with red plum blossoms. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-02-2"></a>

## 2月 梅に赤短（赤短）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-2.webp`（300×480px）
- 用途: 札の絵柄（2月・梅の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）の赤短札：紅梅の枝に、文字のない赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「赤短」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a plum branch with red blossoms and a plain red poem ribbon (blank, no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a plum branch with red blossoms and a plain red poem ribbon (blank, no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-02-3"></a>

## 2月 梅のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-3.webp`（300×480px）
- 用途: 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）のカス札：紅梅の枝（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a plum branch with red five-petal blossoms on a pale ground, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a plum branch with red five-petal blossoms on a pale ground, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-02-4"></a>

## 2月 梅のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-4.webp`（300×480px）
- 用途: 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）のカス札：紅梅の枝（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a plum branch with red blossoms and buds, variation B with a different branch layout --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a plum branch with red blossoms and buds, variation B with a different branch layout. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-03-1"></a>

## 3月 桜に幕（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-1.webp`（300×480px）
- 用途: 札の絵柄（3月・桜の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）の光札：満開の桜と、張りわたした花見の幕。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: cherry trees in full bloom above a festive striped curtain (maku) stretched across the card --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): cherry trees in full bloom above a festive striped curtain (maku) stretched across the card. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-03-2"></a>

## 3月 桜に赤短（赤短）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-2.webp`（300×480px）
- 用途: 札の絵柄（3月・桜の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）の赤短札：桜の花に、文字のない赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「赤短」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: cherry blossoms with a plain red poem ribbon (blank, no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): cherry blossoms with a plain red poem ribbon (blank, no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-03-3"></a>

## 3月 桜のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-3.webp`（300×480px）
- 用途: 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）のカス札：桜の花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: clusters of pink cherry blossoms over pale hills, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): clusters of pink cherry blossoms over pale hills, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-03-4"></a>

## 3月 桜のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-4.webp`（300×480px）
- 用途: 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）のカス札：桜の花（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: clusters of pink cherry blossoms, variation B with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): clusters of pink cherry blossoms, variation B with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-04-1"></a>

## 4月 藤に杜鵑（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-1.webp`（300×480px）
- 用途: 札の絵柄（4月・藤のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）のタネ札：垂れ下がる藤と、三日月の前を飛ぶ杜鵑（ほととぎす）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a lesser cuckoo flying past a thin crescent moon in front of hanging purple wisteria --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a lesser cuckoo flying past a thin crescent moon in front of hanging purple wisteria. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-04-2"></a>

## 4月 藤に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-2.webp`（300×480px）
- 用途: 札の絵柄（4月・藤の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）の短冊札：藤の花房に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「短冊」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: hanging purple wisteria with a plain red poem ribbon (no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): hanging purple wisteria with a plain red poem ribbon (no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-04-3"></a>

## 4月 藤のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-3.webp`（300×480px）
- 用途: 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）のカス札：藤の花房（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: hanging purple wisteria with dark tendrils, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): hanging purple wisteria with dark tendrils, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-04-4"></a>

## 4月 藤のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-4.webp`（300×480px）
- 用途: 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）のカス札：藤の花房（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: hanging purple wisteria, variation B with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): hanging purple wisteria, variation B with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-05-1"></a>

## 5月 菖蒲に八橋（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-1.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）のタネ札：菖蒲（かきつばた）と八橋（ジグザグの板の橋）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: blue-violet irises growing by a zigzag wooden plank bridge (yatsuhashi) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): blue-violet irises growing by a zigzag wooden plank bridge (yatsuhashi). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-05-2"></a>

## 5月 菖蒲に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-2.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）の短冊札：菖蒲の花に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「短冊」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: blue-violet irises with a plain red poem ribbon (no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): blue-violet irises with a plain red poem ribbon (no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-05-3"></a>

## 5月 菖蒲のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-3.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）のカス札：菖蒲の花と葉（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: blue-violet irises with tall sword-like leaves, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): blue-violet irises with tall sword-like leaves, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-05-4"></a>

## 5月 菖蒲のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-4.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）のカス札：菖蒲の花と葉（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: blue-violet irises, variation B with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): blue-violet irises, variation B with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-06-1"></a>

## 6月 牡丹に蝶（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-1.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）のタネ札：大輪の牡丹と、舞う二匹の蝶。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: large red peonies with two fluttering butterflies --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): large red peonies with two fluttering butterflies. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-06-2"></a>

## 6月 牡丹に青短（青短）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-2.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）の青短札：牡丹に、文字のない青い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「青短」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: large red peonies with a plain deep-blue poem ribbon (blank, no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): large red peonies with a plain deep-blue poem ribbon (blank, no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-06-3"></a>

## 6月 牡丹のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-3.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）のカス札：牡丹の花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: large red peony blossom with leaves, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): large red peony blossom with leaves, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-06-4"></a>

## 6月 牡丹のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-4.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）のカス札：牡丹の花（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: large red peony blossom, variation B with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): large red peony blossom, variation B with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-07-1"></a>

## 7月 萩に猪（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-1.webp`（300×480px）
- 用途: 札の絵柄（7月・萩のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）のタネ札：しだれる萩の下を駆ける猪。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a charging wild boar under arching red bush clover --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a charging wild boar under arching red bush clover. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-07-2"></a>

## 7月 萩に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-2.webp`（300×480px）
- 用途: 札の絵柄（7月・萩の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）の短冊札：萩に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「短冊」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: arching red bush clover with a plain red poem ribbon (no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): arching red bush clover with a plain red poem ribbon (no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-07-3"></a>

## 7月 萩のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-3.webp`（300×480px）
- 用途: 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）のカス札：萩の枝（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: arching red bush clover branches, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): arching red bush clover branches, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-07-4"></a>

## 7月 萩のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-4.webp`（300×480px）
- 用途: 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）のカス札：萩の枝（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: arching red bush clover branches, variation B with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): arching red bush clover branches, variation B with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-08-1"></a>

## 8月 芒に月（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-1.webp`（300×480px）
- 用途: 札の絵柄（8月・芒の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）の光札：芒の丘の上にのぼる満月、赤い空。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a large full moon rising over a black hill covered in silver pampas grass, red sky --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a large full moon rising over a black hill covered in silver pampas grass, red sky. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-08-2"></a>

## 8月 芒に雁（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-2.webp`（300×480px）
- 用途: 札の絵柄（8月・芒のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）のタネ札：芒の丘の上を渡る三羽の雁。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: three wild geese flying over a hill of silver pampas grass under a red sky --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): three wild geese flying over a hill of silver pampas grass under a red sky. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-08-3"></a>

## 8月 芒のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-3.webp`（300×480px）
- 用途: 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）のカス札：芒の丘（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a black hill with silver pampas grass under a red sky, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a black hill with silver pampas grass under a red sky, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-08-4"></a>

## 8月 芒のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-4.webp`（300×480px）
- 用途: 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）のカス札：芒の丘（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a black hill with silver pampas grass under a red sky, variation B --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a black hill with silver pampas grass under a red sky, variation B. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-09-1"></a>

## 9月 菊に盃（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-1.webp`（300×480px）
- 用途: 札の絵柄（9月・菊のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）のタネ札：黄色い菊と、台にのった朱塗りの盃（盃に文字は入れない）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a red lacquered sake cup on a stand among yellow chrysanthemums (the cup undecorated, no characters) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a red lacquered sake cup on a stand among yellow chrysanthemums (the cup undecorated, no characters). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-09-2"></a>

## 9月 菊に青短（青短）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-2.webp`（300×480px）
- 用途: 札の絵柄（9月・菊の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）の青短札：菊に、文字のない青い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「青短」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: yellow chrysanthemums with a plain deep-blue poem ribbon (blank, no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): yellow chrysanthemums with a plain deep-blue poem ribbon (blank, no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-09-3"></a>

## 9月 菊のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-3.webp`（300×480px）
- 用途: 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）のカス札：菊の花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: yellow and red chrysanthemums, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): yellow and red chrysanthemums, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-09-4"></a>

## 9月 菊のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-4.webp`（300×480px）
- 用途: 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）のカス札：菊の花（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: yellow and red chrysanthemums, variation B with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): yellow and red chrysanthemums, variation B with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-10-1"></a>

## 10月 紅葉に鹿（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-1.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）のタネ札：紅葉の下で振り返る鹿。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a sika deer looking back under red maple leaves --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a sika deer looking back under red maple leaves. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-10-2"></a>

## 10月 紅葉に青短（青短）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-2.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）の青短札：紅葉に、文字のない青い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「青短」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: red maple leaves with a plain deep-blue poem ribbon (blank, no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): red maple leaves with a plain deep-blue poem ribbon (blank, no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-10-3"></a>

## 10月 紅葉のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-3.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）のカス札：紅葉（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: red and orange maple leaves on dark branches, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): red and orange maple leaves on dark branches, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-10-4"></a>

## 10月 紅葉のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-4.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）のカス札：紅葉（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: red and orange maple leaves, variation B with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): red and orange maple leaves, variation B with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-11-1"></a>

## 11月 柳に小野道風（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-1.webp`（300×480px）
- 用途: 札の絵柄（11月・柳の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）の光札：雨の中、傘をさした平安装束の人物が、柳に飛びつく蛙を見ている（柳の光札の伝統的な図柄）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a Heian-era court noble in flowing robes holding an umbrella in the rain, watching a frog leap toward a willow branch by a stream (traditional willow-and-rain motif) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a Heian-era court noble in flowing robes holding an umbrella in the rain, watching a frog leap toward a willow branch by a stream (traditional willow-and-rain motif). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-11-2"></a>

## 11月 柳に燕（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-2.webp`（300×480px）
- 用途: 札の絵柄（11月・柳のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）のタネ札：雨の柳と、飛ぶ燕と小川。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a swallow darting through willow branches in the rain beside a small stream --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a swallow darting through willow branches in the rain beside a small stream. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-11-3"></a>

## 11月 柳に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-3.webp`（300×480px）
- 用途: 札の絵柄（11月・柳の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）の短冊札：雨の柳に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。短冊の文字（あかよろし・みよしの など）は画像に入れず、ゲームが「短冊」の印を重ねます。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: drooping willow branches in the rain with a plain red poem ribbon (no writing) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): drooping willow branches in the rain with a plain red poem ribbon (no writing). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-11-4"></a>

## 11月 柳のカス（雷）（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-4.webp`（300×480px）
- 用途: 札の絵柄（11月・柳のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）のカス札：雷の札：黒い雷雲と雷太鼓、赤い稲光（柳のカス・鬼札の図柄）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: the thunder card: black storm clouds, a ring of thunder drums and a red flash of lightning around a dark gate-like shape, with willow leaves --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): the thunder card: black storm clouds, a ring of thunder drums and a red flash of lightning around a dark gate-like shape, with willow leaves. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-12-1"></a>

## 12月 桐に鳳凰（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-1.webp`（300×480px）
- 用途: 札の絵柄（12月・桐の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）の光札：桐の葉と花の向こうに舞い上がる鳳凰。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: a phoenix with long colourful tail feathers rising behind paulownia leaves and purple paulownia flowers --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): a phoenix with long colourful tail feathers rising behind paulownia leaves and purple paulownia flowers. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-12-2"></a>

## 12月 桐のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-2.webp`（300×480px）
- 用途: 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）のカス札：桐の葉と花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: large paulownia leaves and upright purple paulownia flower spikes on a pale ground, variation A --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): large paulownia leaves and upright purple paulownia flower spikes on a pale ground, variation A. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-12-3"></a>

## 12月 桐のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-3.webp`（300×480px）
- 用途: 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）のカス札：桐の葉と花（カス・その 2、下に黄色い帯。文字は入れない）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: large paulownia leaves and purple flower spikes, variation B with a yellow band at the bottom (blank, no characters) --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): large paulownia leaves and purple flower spikes, variation B with a yellow band at the bottom (blank, no characters). Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="card-12-4"></a>

## 12月 桐のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-4.webp`（300×480px）
- 用途: 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）のカス札：桐の葉と花（カス・その 3）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 絵柄をそろえるため、基準の「card-01-1（松に鶴）」を `--sref` に指定します（Midjourney の Style Reference）。カスの札は同じ月の別の札と構図を変えてください。

**Midjourney（v7）用のプロンプト**

```text
traditional Japanese hanafuda flower card art, flat woodblock-print style, bold black outlines, flat areas of vermilion red, black, deep green, ochre, indigo and white on warm cream paper, decorative and simple, the design fills a tall vertical card edge to edge, no border, no frame, no text, no letters, no numbers, motif: large paulownia leaves and purple flower spikes, variation C with a different arrangement --ar 5:8 --v 7 --style raw --stylize 150 --sref <card-01-1 の画像の URL> --sw 300 --no text, letters, border
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, hiragana, calligraphy, numbers, signature, watermark, logo, border, frame, card edge, photo, 3d render, gradient mesh, blurry
```

**ほかのツール用（共通の英文プロンプト）**

```text
A traditional Japanese hanafuda flower card illustration (tall 5:8 vertical card, no border): large paulownia leaves and purple flower spikes, variation C with a different arrangement. Flat woodblock-print look with bold black outlines and flat colours (vermilion, black, deep green, ochre, indigo, white) on cream paper. Decorative, simple shapes filling the whole card. No text, letters or numbers anywhere.
```

<a id="key-visual"></a>

## キービジュアル：月夜の縁側と花札

- ファイル: `public/games/hanafuda-koikoi/img/key-visual.webp`（1600×900px）
- 用途: タイトル画面の背景（暗くして上にタイトルの文字と設定を重ねます）
- 内容: 月夜の縁側。緋毛氈の上に扇形に広げた花札、芒の向こうに満月、舞う桜の花びらと紅葉、提灯のあたたかい光。中央上にタイトルを置く余白
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- メモ: Ideogram の画面で縦横比 16:9、スタイルは Design か General を選び、Magic Prompt はオフにします。文字が入ってしまったときは negative に text を入れて生成し直してください。札の絵柄は細かくなくてかまいません（ぼかして使います）。

**Ideogram（3.0）用のプロンプト**

```text
Cinematic poster key visual, no text. A quiet moonlit Japanese veranda at night: a fan of traditional hanafuda flower cards spread on a vermilion felt mat, a full moon rising behind silver pampas grass, cherry petals and red maple leaves drifting through the air, a paper lantern casting warm light, deep red and indigo palette with gold accents, elegant and calm, generous empty dark space in the upper center for a title. Aspect ratio 16:9. Style: painterly illustration. Magic Prompt: off.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, watermark, people, faces, modern objects
```

**ほかのツール用（共通の英文プロンプト）**

```text
A painterly 16:9 key visual with no text: a moonlit Japanese veranda at night, hanafuda flower cards fanned out on a vermilion felt mat, a full moon behind pampas grass, drifting cherry petals and maple leaves, a warm paper lantern, deep red and indigo with gold accents, empty dark space in the upper center for a title.
```

<a id="bg-table"></a>

## 背景：緋毛氈の卓

- ファイル: `public/games/hanafuda-koikoi/img/bg-table.webp`（1600×900px）
- 用途: 対局画面の背景（全面。上に札と情報パネルを重ね、周りを暗くします）
- 内容: 真上から見た緋毛氈（朱色のフェルトの敷物）。細かい毛羽立ちの質感、ほのかなしわ、やわらかく均一な光と弱い周辺減光。物は何も置かない
- おすすめのツール: [Adobe Firefly（Image 4）](https://firefly.adobe.com/) ― サイズ: 縦横比を画面で選択
- メモ: Firefly の「コンテンツの種類：写真」、縦横比 16:9 で生成します。画面の中央に札が並ぶので、模様や強い陰影がない、落ち着いた布の質感が向いています。スマホの縦画面では中央付近が切り出されます。

**Adobe Firefly（Image 4）用のプロンプト**

```text
Top-down photograph of a smooth vermilion wool felt cloth (hi-mosen) laid over a low table, fine fibre texture, a few very soft folds, soft even studio light with a gentle vignette, rich deep red, nothing on the cloth, seamless and calm. Content type: Photo. Aspect ratio: Widescreen (16:9).
```

**ネガティブプロンプト（入れたくないもの）**

```text
objects, cards, text, pattern print, people, hands, harsh shadows
```

**ほかのツール用（共通の英文プロンプト）**

```text
A top-down photo of a plain vermilion wool felt cloth covering a table: fine fibre texture, a few soft folds, soft even light with a gentle vignette, deep rich red, nothing on it. 16:9.
```

<a id="cpu-koume"></a>

## 対戦相手：小梅

- ファイル: `public/games/hanafuda-koikoi/img/cpu-koume.webp`（512×512px）
- 用途: 対戦相手「小梅」（やさしい）の顔。タイトルの相手選びと対局中の情報パネル（角丸の正方形に切り抜き）
- 内容: 茶屋の看板娘・小梅（やさしい）。紅梅柄の着物に赤いたすき、まとめ髪に赤いかんざし、明るい笑顔で札を 1 枚頬のそばに持つ。背景は暗い紅色の無地。アニメ調のバストアップ、正面向き、顔が中央
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 3 人の対戦相手の絵柄の基準です。最初に作り、残りの 2 人はこの画像を `--sref` にして絵柄をそろえます。顔が中央に大きく入る構図にしてください（小さく表示されます）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait, soft painterly shading, warm lantern light, Edo-period inspired clothing, looking at the viewer, plain dark background, centered head and shoulders, a cheerful young teahouse waitress, kimono with a red plum-blossom pattern and a red tasuki cord, hair in a simple bun with a red hair ornament, bright friendly smile, holding a single flower card near her cheek, plain dark crimson background --niji 6 --ar 1:1 --no text
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, multiple people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait, square 1:1, of a cheerful young teahouse waitress, kimono with a red plum-blossom pattern and a red tasuki cord, hair in a simple bun with a red hair ornament, bright friendly smile, holding a single flower card near her cheek. Soft painterly shading, warm lantern light, Edo-period inspired clothing, facing the viewer, face in the center, plain dark background. No text.
```

<a id="cpu-ryusai"></a>

## 対戦相手：柳斎

- ファイル: `public/games/hanafuda-koikoi/img/cpu-ryusai.webp`（512×512px）
- 用途: 対戦相手「柳斎」（ふつう）の顔。タイトルの相手選びと対局中の情報パネル
- 内容: 旅の絵師・柳斎（ふつう）。柳の地紋の藍色の着物、背中に笠、耳に細い筆をはさみ、穏やかに考え深い笑み。背景は暗い緑の無地。アニメ調のバストアップ、正面向き、顔が中央
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/cpu-koume.webp`](#cpu-koume) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 3 人の絵柄をそろえるため、小梅の画像を Style Reference（`--sref`）に指定します（人物は別人なので、顔を写す Character Reference は使いません）。ゲームは角丸の正方形に切り抜いて小さく表示するので、顔が中央に大きく入る構図にしてください。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait, soft painterly shading, warm lantern light, Edo-period inspired clothing, looking at the viewer, plain dark background, centered head and shoulders, a calm traveling painter in his late twenties, indigo kimono with a subtle willow pattern, a straw travel hat hanging on his back, a thin brush tucked behind his ear, thoughtful slight smile, plain dark green background --niji 6 --ar 1:1 --sref <cpu-koume の画像の URL> --sw 150 --no text
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, multiple people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait, square 1:1, of a calm traveling painter in his late twenties, indigo kimono with a subtle willow pattern, a straw travel hat hanging on his back, a thin brush tucked behind his ear, thoughtful slight smile. Soft painterly shading, warm lantern light, Edo-period inspired clothing, facing the viewer, face in the center, plain dark background. No text.
```

<a id="cpu-sogetsu"></a>

## 対戦相手：宗月

- ファイル: `public/games/hanafuda-koikoi/img/cpu-sogetsu.webp`（512×512px）
- 用途: 対戦相手「宗月」（つよい）の顔。タイトルの相手選びと対局中の情報パネル
- 内容: 料亭の御隠居・宗月（つよい）。白いあごひげ、桐の紋様の深紫の羽織、小さな朱の盃を手に、やさしくも鋭い目。背景は暗い紫の無地。アニメ調のバストアップ、正面向き、顔が中央
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/cpu-koume.webp`](#cpu-koume) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 3 人の絵柄をそろえるため、小梅の画像を Style Reference（`--sref`）に指定します（人物は別人なので、顔を写す Character Reference は使いません）。ゲームは角丸の正方形に切り抜いて小さく表示するので、顔が中央に大きく入る構図にしてください。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait, soft painterly shading, warm lantern light, Edo-period inspired clothing, looking at the viewer, plain dark background, centered head and shoulders, a dignified elderly retired restaurant owner with a neat white beard, deep purple haori jacket with a paulownia crest-like pattern, holding a small red sake cup, kind but sharp eyes, plain dark purple background --niji 6 --ar 1:1 --sref <cpu-koume の画像の URL> --sw 150 --no text
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, multiple people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait, square 1:1, of a dignified elderly retired restaurant owner with a neat white beard, deep purple haori jacket with a paulownia crest-like pattern, holding a small red sake cup, kind but sharp eyes. Soft painterly shading, warm lantern light, Edo-period inspired clothing, facing the viewer, face in the center, plain dark background. No text.
```
