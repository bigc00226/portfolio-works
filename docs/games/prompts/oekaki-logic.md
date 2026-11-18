# ロジック絵巻 ― 画像の生成プロンプト

ゲーム: `public/games/oekaki-logic/`（4 枚中 0 枚が生成済み、4 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/oekaki-logic/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

生成りの和紙・墨色・朱を基調にした、落ち着いた和の世界。「小さな四角が集まって絵になる」モザイク・升目の楽しさを感じさせる。人物は出さない。画面の中に文字・数字・家紋・ロゴを入れない（数字や題名はゲームの HTML / canvas で描くため）。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/oekaki-logic/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- oekaki-logic` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- oekaki-logic`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1200×900 | キービジュアル | タイトル画面（PC は左の大きな絵、スマホは左上の小さな絵。中央付近が切り抜かれます） | Midjourney（v7） |
| ⬜ | [`img/bg-paper.webp`](#bg-paper) | 1600×1000 | 背景 | 一覧・プレイ画面の背景（50% の濃さで重ねます） | Adobe Firefly（Image 4） |
| ⬜ | [`img/gallery-bg.webp`](#gallery-bg) | 1600×900 | 背景 | 「絵巻」（完成した絵のギャラリー）の背景（明るい色を重ねます） | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/deco-kumo.webp`](#deco-kumo) | 800×240（透過） | UI 部品 | 完成画面のカードの上と、絵巻の見出しの飾り（透過） | Recraft（V3） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key-visual"></a>

## キービジュアル：升目でできた絵巻

- ファイル: `public/games/oekaki-logic/img/key-visual.webp`（1200×900px）
- 用途: タイトル画面（PC は左の大きな絵、スマホは左上の小さな絵。中央付近が切り抜かれます）
- 内容: 低い文机の上に広げられた絵巻。絵巻の紙には、小さな色の四角（升目）が集まって、富士山・赤い太陽・鶴・桜が描かれている。墨と筆、小皿の絵の具。上からのやわらかな光。文字は入れない。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: モザイクの四角が大きめにはっきり見えるものを選ぶと、ゲームの内容が伝わります。スマホでは中央の正方形に近い部分が使われます。

**Midjourney（v7）用のプロンプト**

```text
an unrolled Japanese handscroll on a low wooden desk, the scroll paper painted as a mosaic of small square colour tiles forming Mount Fuji, a red rising sun, a flying crane and cherry blossoms, an ink brush and small dishes of mineral pigments beside it, soft overhead daylight, warm cream, vermilion and ink-black palette, calm still life, top-down three-quarter view, crisp detail --ar 4:3 --v 7 --style raw --no text, letters, numbers, calligraphy, seal stamps, logos, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
Still life of an unrolled Japanese handscroll on a low wooden desk. The scroll paper shows a mosaic of small square colour tiles that together form Mount Fuji, a red rising sun, a flying crane and cherry blossoms. An ink brush and small dishes of pigment lie beside it. Soft daylight, warm cream, vermilion and ink-black colours. No text, letters, numbers, seals or people. Landscape 4:3.
```

<a id="bg-paper"></a>

## 背景：生成りの紙と木の机

- ファイル: `public/games/oekaki-logic/img/bg-paper.webp`（1600×1000px）
- 用途: 一覧・プレイ画面の背景（50% の濃さで重ねます）
- 内容: 生成りの和紙を敷いた木の机を真上から写した、明るくやわらかい写真風の背景。端のほうにうっすら木目。中央は無地に近く、物は置かない。
- おすすめのツール: [Adobe Firefly（Image 4）](https://firefly.adobe.com/) ― サイズ: 縦横比を画面で選択
- メモ: Firefly の「写真」スタイル・縦横比 16:10 程度。盤面の数字が読みにくくならないよう、明るく淡いものを。

**Adobe Firefly（Image 4）用のプロンプト**

```text
Top-down photo of a sheet of warm cream handmade washi paper laid on a light wooden desk, wood grain visible only near the edges, soft diffused daylight, very low contrast, minimal, empty centre, no objects
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, objects, hands, shadows of people, strong vignette, stains
```

**ほかのツール用（共通の英文プロンプト）**

```text
A top-down photograph of warm cream handmade Japanese paper on a light wooden desk, with wood grain only at the edges. Soft diffused daylight, very low contrast, empty centre, no objects, no text. Landscape 16:10.
```

<a id="gallery-bg"></a>

## 背景：絵を飾る床の間

- ファイル: `public/games/oekaki-logic/img/gallery-bg.webp`（1600×900px）
- 用途: 「絵巻」（完成した絵のギャラリー）の背景（明るい色を重ねます）
- 内容: 何も飾られていない、明るい和室の床の間の壁。土壁の質感、床柱、やわらかな横からの光。絵を並べて飾る前の、静かで広い余白。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- メモ: 壁の部分に完成した絵の額が並ぶので、中央は無地に近いものを選んでください。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Create a wide 16:9 image of an empty tokonoma alcove in a bright traditional Japanese room: a plain warm clay plaster wall with soft texture, a polished wooden alcove post on one side, tatami edge at the bottom, gentle side light from a paper screen. The wall should be mostly empty and calm, like a gallery wall waiting for pictures. No hanging scroll, no text, no people.
```

**ほかのツール用（共通の英文プロンプト）**

```text
Wide 16:9 interior: an empty tokonoma alcove in a bright Japanese room — plain warm clay wall, a polished wooden post at one side, tatami edge at the bottom, soft side light. Mostly empty wall space. No hanging scroll, no text, no people.
```

<a id="deco-kumo"></a>

## 飾り：金のすやり霞（雲）

- ファイル: `public/games/oekaki-logic/img/deco-kumo.webp`（800×240px・背景は透過）
- 用途: 完成画面のカードの上と、絵巻の見出しの飾り（透過）
- 内容: 絵巻や屏風に描かれる、横に長くたなびく金色の雲（すやり霞）。フラットなベクター風で、金の濃淡 2〜3 色。背景は透明。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- メモ: Recraft の Vector illustration スタイルで生成し、背景を削除して PNG で保存。左右対称に近い形が使いやすいです。

**Recraft（V3）用のプロンプト**

```text
flat vector ornament of long horizontal golden clouds in traditional Japanese suyari-gasumi style, layered bands of mist with rounded ends, two or three shades of gold, clean edges, wide 10:3 composition, isolated on a transparent background, no text
```

**ほかのツール用（共通の英文プロンプト）**

```text
A flat vector ornament of long, horizontal golden clouds in the Japanese 'suyari-gasumi' style: layered bands of mist with rounded ends in two or three shades of gold, clean edges, wide 10:3 composition, isolated on a plain white (or transparent) background, no text.
```
