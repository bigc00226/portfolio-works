# 宵宮ビート ― 画像の生成プロンプト

ゲーム: `public/games/matsuri-rhythm/`（5 枚中 0 枚が生成済み、5 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/matsuri-rhythm/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夏の夜祭り（宵宮）の、あたたかな提灯の灯りと藍色の夜空。赤・朱・金の灯りと、藍・紫の闇のコントラスト。人物は後ろ姿や小さなシルエットだけにして、顔は描きません。既存のゲーム・アニメ・実在の祭りや神社、現存する作家の作風には寄せません。画像の中に文字・ロゴ・提灯の文字は入れません（提灯は無地か模様だけ）。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/matsuri-rhythm/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- matsuri-rhythm` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- matsuri-rhythm`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#key) | 1600×1000 | キービジュアル | 曲選び（タイトル）画面の背景（暗く重ねて、上にロゴと曲のカードを置きます） | Midjourney（v7） |
| ⬜ | [`img/bg-stage.webp`](#bg-stage) | 1600×1000 | 背景 | 演奏画面の背景（中央に 4 本のレーンが重なり、半分ほど暗くして表示） | Midjourney（v7） |
| ⬜ | [`img/jacket-1.webp`](#jacket-1) | 600×600 | カード | 曲選びのカード（1 曲目のジャケット） | Ideogram（3.0） |
| ⬜ | [`img/jacket-2.webp`](#jacket-2) | 600×600 | カード | 曲選びのカード（2 曲目のジャケット） | Ideogram（3.0） |
| ⬜ | [`img/jacket-3.webp`](#jacket-3) | 600×600 | カード | 曲選びのカード（3 曲目のジャケット） | Ideogram（3.0） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key"></a>

## キービジュアル：夏祭りの夜（提灯と花火）

- ファイル: `public/games/matsuri-rhythm/img/key.webp`（1600×1000px）
- 用途: 曲選び（タイトル）画面の背景（暗く重ねて、上にロゴと曲のカードを置きます）
- 内容: 夏祭りの夜の参道。両側に夜店が並び、赤と白の提灯が何列も連なる。奥に木の櫓（やぐら）、藍色の空に大きな花火。浴衣の人々は小さな後ろ姿だけ。暖かい灯りのボケ。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 提灯や看板に文字が入りやすいので、出たら消すか作り直してください。ロゴと曲のカードを中央に重ねるので、中央が明るすぎない構図に。

**Midjourney（v7）用のプロンプト**

```text
a summer night festival street in Japan, rows of red and white paper lanterns strung overhead, wooden food stalls glowing on both sides, a tall wooden yagura drum tower in the distance, a huge golden firework blooming in the deep indigo sky, tiny silhouettes of people in yukata seen from behind, warm bokeh, soft painterly light, cinematic wide composition, plain lanterns without any writing --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji on lanterns, signboards with writing, logo, close-up faces --no text, letters, signage
```

**ほかのツール用（共通の英文プロンプト）**

```text
Wide 16:10 illustration of a Japanese summer night festival street: rows of plain red and white paper lanterns overhead, glowing wooden food stalls on both sides, a wooden drum tower in the distance, a huge golden firework in a deep indigo sky, tiny silhouettes of people in yukata seen from behind, warm bokeh, painterly. No text or writing anywhere.
```

<a id="bg-stage"></a>

## 背景：演奏画面（夜店の灯りのボケ）

- ファイル: `public/games/matsuri-rhythm/img/bg-stage.webp`（1600×1000px）
- 用途: 演奏画面の背景（中央に 4 本のレーンが重なり、半分ほど暗くして表示）
- 内容: 夜祭りの通りを低い位置から見上げた、提灯の灯りが大きくぼけた背景。中央の縦の帯は暗めで静かにし、左右に暖かい灯り。PC の横長でもスマホの縦長でも中央を切り抜いて使う。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/key.webp`](#key) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: キービジュアルと同じ色調で。中央には落ちてくる提灯（ノーツ）が重なるので、中央は暗く単調に。

**Midjourney（v7）用のプロンプト**

```text
dreamy out-of-focus view of a night festival street, large warm bokeh circles from red and amber paper lanterns on the left and right edges, the vertical center darker and calm, deep indigo and plum night, subtle smoke haze, no people, minimal detail, soft painterly --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, people, sharp details in the center --no text, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
Dreamy, out-of-focus night festival street: large warm bokeh from red and amber paper lanterns at the left and right edges, the vertical center darker and calm, deep indigo and plum tones, light haze, no people, minimal detail. 16:10. No text.
```

<a id="jacket-1"></a>

## ジャケット：夕凪わっしょい

- ファイル: `public/games/matsuri-rhythm/img/jacket-1.webp`（600×600px）
- 用途: 曲選びのカード（1 曲目のジャケット）
- 内容: 夕暮れの浜辺の盆踊り。紅白の提灯を下げた木の櫓のまわりを、浴衣の人々のシルエットが輪になって踊る。海と夕焼けのオレンジ・桃色。版画のような平面的なポスター風。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- メモ: 3 枚のジャケットは同じツール・同じ「flat graphic woodblock-print poster style」でそろえます。Ideogram は文字を入れがちなので、Magic Prompt をオフにし、文字が出たら作り直してください。

**Ideogram（3.0）用のプロンプト**

```text
Square album cover illustration, flat graphic woodblock-print poster style. A bon-odori dance circle on a beach at sunset: a wooden yagura tower hung with red and white paper lanterns, small silhouettes of dancers in yukata forming a ring, calm sea and a big orange-pink sunset sky, bold simple shapes, warm limited palette of orange, coral, cream and plum. No text, no letters, no typography, no logo.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, typography, title, logo, watermark, realistic faces
```

**ほかのツール用（共通の英文プロンプト）**

```text
Square album cover in a flat woodblock-print poster style: a bon-odori dance circle on a beach at sunset, a wooden tower hung with red and white paper lanterns, small silhouettes of dancers in yukata in a ring, calm sea, big orange-pink sunset. Bold simple shapes, warm limited palette. No text.
```

<a id="jacket-2"></a>

## ジャケット：狐火の小径

- ファイル: `public/games/matsuri-rhythm/img/jacket-2.webp`（600×600px）
- 用途: 曲選びのカード（2 曲目のジャケット）
- 内容: 夜の竹やぶの細い小径に、青緑の狐火がふわふわと連なって浮かぶ。小径の脇の木の杭に、紙で作った白い狐のお面が掛けてある。藍と青緑の神秘的な色。1 枚目と同じ版画風。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- 参照画像: [`img/jacket-1.webp`](#jacket-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 1 枚目と同じ設定で。鳥居や実在の神社は入れないでください。

**Ideogram（3.0）用のプロンプト**

```text
Square album cover illustration, flat graphic woodblock-print poster style, same style as a festival poster series. A narrow path through a dark bamboo grove at night, a line of floating blue-green foxfire flames drifting along the path, a white paper fox mask hanging on a wooden post beside the path, mysterious deep indigo, teal and pale jade palette, bold simple shapes. No text, no letters, no typography, no logo.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, typography, title, logo, watermark, shrine gate, realistic animal
```

**ほかのツール用（共通の英文プロンプト）**

```text
Square album cover in a flat woodblock-print poster style: a narrow path through a dark bamboo grove at night, floating blue-green foxfire flames along the path, a white paper fox mask hanging on a wooden post. Mysterious indigo, teal and jade palette, bold simple shapes. No text.
```

<a id="jacket-3"></a>

## ジャケット：大輪の夜

- ファイル: `public/games/matsuri-rhythm/img/jacket-3.webp`（600×600px）
- 用途: 曲選びのカード（3 曲目のジャケット）
- 内容: 川の上の夜空に、菊のような大輪の花火がいくつも開く。手前に木の橋と夜店の屋根のシルエット、川面に花火が映る。金・紅・紫と濃紺。1 枚目と同じ版画風。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- 参照画像: [`img/jacket-1.webp`](#jacket-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 1 枚目と同じ設定で。実在の橋や名所に似せないでください。

**Ideogram（3.0）用のプロンプト**

```text
Square album cover illustration, flat graphic woodblock-print poster style, same style as a festival poster series. Several giant chrysanthemum fireworks bursting over a river at night, silhouettes of a wooden arched bridge and festival stall roofs in the foreground, the fireworks reflected on the water, vivid gold, crimson and violet on deep navy, bold simple shapes. No text, no letters, no typography, no logo.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, typography, title, logo, watermark, real landmark
```

**ほかのツール用（共通の英文プロンプト）**

```text
Square album cover in a flat woodblock-print poster style: several giant chrysanthemum fireworks over a river at night, silhouettes of a wooden arched bridge and stall roofs, reflections on the water. Gold, crimson and violet on deep navy, bold simple shapes. No text.
```
