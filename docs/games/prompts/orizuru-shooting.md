# 千代紙飛行 ― 画像の生成プロンプト

ゲーム: `public/games/orizuru-shooting/`（7 枚中 0 枚が生成済み、7 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/orizuru-shooting/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

和紙と千代紙でできた「紙の国」。すべての物が折り紙・切り絵のように、はっきりした折り目と平らな面でできていて、紙の繊維が見えるやさしい質感。色は朱・藍・若草・金を基調に、水彩や木版のようにやわらかく。既存のゲームやアニメ、実在の作家の作風には寄せません。画像の中に文字・ロゴ・署名は入れません。ゲーム画面の背景は弾を見やすくするため、ゲーム側で薄く（低いコントラストで）表示します。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/orizuru-shooting/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- orizuru-shooting` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- orizuru-shooting`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#key) | 1600×1000 | キービジュアル | タイトル画面の背景（中央に HTML のタイトル文字が重なります） | Midjourney（v7） |
| ⬜ | [`img/bg-stage1.webp`](#bg-stage1) | 720×1280 | 背景 | 第一幕のゲーム画面の背景（縦にスクロール、薄く表示） | Midjourney（v7） |
| ⬜ | [`img/bg-stage2.webp`](#bg-stage2) | 720×1280 | 背景 | 第二幕のゲーム画面の背景（縦にスクロール、薄く表示） | Midjourney（v7） |
| ⬜ | [`img/bg-stage3.webp`](#bg-stage3) | 720×1280 | 背景 | 第三幕のゲーム画面の背景（縦にスクロール、薄く表示） | Midjourney（v7） |
| ⬜ | [`img/boss-1.webp`](#boss-1) | 768×768 | イベント絵 | 第一幕の主が現れるときの紹介カード | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/boss-2.webp`](#boss-2) | 768×768 | イベント絵 | 第二幕の主が現れるときの紹介カード | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/boss-3.webp`](#boss-3) | 768×768 | イベント絵 | 第三幕の主が現れるときの紹介カード | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key"></a>

## キービジュアル：紙の国の空を翔ける折り鶴

- ファイル: `public/games/orizuru-shooting/img/key.webp`（1600×1000px）
- 用途: タイトル画面の背景（中央に HTML のタイトル文字が重なります）
- 内容: 朱と白の千代紙で折られた一羽の折り鶴が、重ねた和紙でできた空を上へと翔けていく。眼下には折り紙の棚田、灯籠の流れる夜の川、遠くに紙の天守。中央から下は落ち着いた空にして、タイトルの文字が重なっても読みやすく。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: タイトル文字は HTML で中央に重ねるので、鶴は上寄せ・中央は空を広く。PC（横長）とスマホ（縦長）の両方で中央を切り抜いて使います。

**Midjourney（v7）用のプロンプト**

```text
a single red and white origami paper crane soaring upward through a sky built from layered washi paper, folded paper clouds, far below a paper-craft world of folded rice terraces, a night river with tiny floating paper lanterns and a distant folded-paper castle roof at sunset, chiyogami patterns on the crane's wings, crisp fold creases, visible paper fibres, soft volumetric light, crane in the upper center, calm open sky in the middle and lower half, painterly, rich but gentle colors, no text --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, watermark, signature, people, existing game characters --no text, letters, logo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Key visual, 16:10 landscape. A single red-and-white origami paper crane flying upward through a sky made of layered Japanese washi paper with folded paper clouds. Far below: a paper-craft world of folded rice terraces, a night river with small floating paper lanterns, and a distant folded-paper castle roof at sunset. Crisp folds, visible paper fibres, soft light, painterly. Keep the middle and lower half calm for a title overlay. No text.
```

<a id="bg-stage1"></a>

## 背景：第一幕「和紙の里」（真上から）

- ファイル: `public/games/orizuru-shooting/img/bg-stage1.webp`（720×1280px）
- 用途: 第一幕のゲーム画面の背景（縦にスクロール、薄く表示）
- 内容: 真上から見下ろした紙細工の田園。若草色・黄色の和紙を折った田んぼが並び、小さな紙の家と紙の小川。昼の柔らかな光。細かすぎず、全体にコントラストを低く。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ゲームでは上下を反転しながら縦につなげてスクロールします。上端と下端の色合いが近いと自然につながります。3 枚の背景は同じツール・同じ設定でそろえてください。

**Midjourney（v7）用のプロンプト**

```text
top-down aerial view of a paper-craft countryside, rice paddies made of folded green and pale yellow washi paper squares, tiny folded paper farmhouses, a thin paper stream, soft daylight, muted pastel palette, low contrast, gentle paper texture, sparse details, even composition without a focal point, painterly gouache --ar 9:16 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, people, strong shadows, high contrast, busy details
```

**ほかのツール用（共通の英文プロンプト）**

```text
Vertical 9:16 background seen straight from above: a paper-craft countryside with rice paddies made of folded green and pale-yellow washi paper, tiny folded paper houses and a thin paper stream. Soft daylight, muted pastel colors, low contrast, sparse details, no focal point. Painterly. No text.
```

<a id="bg-stage2"></a>

## 背景：第二幕「切り絵の夜川」（真上から）

- ファイル: `public/games/orizuru-shooting/img/bg-stage2.webp`（720×1280px）
- 用途: 第二幕のゲーム画面の背景（縦にスクロール、薄く表示）
- 内容: 真上から見た夜の川。藍色の和紙の水面に切り絵の波と葦、岸辺には小さな紙の灯籠がぽつぽつと暖かく灯る。藍と紫の静かな色調で、コントラストは低め。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-stage1.webp`](#bg-stage1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 第一幕の背景と同じツール・同じ設定で。灯籠は少なめに（明るい点が多いと弾と見分けにくくなります）。

**Midjourney（v7）用のプロンプト**

```text
top-down view of a night river made of indigo washi paper, cut-paper kirie waves and reeds along both banks, a few small floating paper lanterns glowing warm orange, deep blue and violet palette, quiet atmosphere, low contrast, soft paper texture, sparse details, painterly --ar 9:16 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, people, bright highlights, high contrast
```

**ほかのツール用（共通の英文プロンプト）**

```text
Vertical 9:16 background seen from above: a night river made of indigo washi paper, cut-paper waves and reeds on both banks, a few small floating paper lanterns glowing warm orange. Deep blue and violet, quiet, low contrast, soft paper texture, painterly. No text.
```

<a id="bg-stage3"></a>

## 背景：第三幕「折り紙の天守」（真上から）

- ファイル: `public/games/orizuru-shooting/img/bg-stage3.webp`（720×1280px）
- 用途: 第三幕のゲーム画面の背景（縦にスクロール、薄く表示）
- 内容: 夕焼けの空から見下ろした、折り紙で組まれた城の屋根。朱と金の重なる屋根瓦、紅や琥珀色の紙の雲、金箔の小さなかけら。劇的だがコントラストは低め。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-stage1.webp`](#bg-stage1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 実在の城に似せないでください。第一幕・第二幕の背景と同じツール・同じ設定で。

**Midjourney（v7）用のプロンプト**

```text
top-down view above a folded-paper castle keep at sunset, layered vermilion and gold origami roof tiers seen from the sky, crimson and amber paper clouds drifting over it, scattered tiny gold leaf flecks, dramatic yet low contrast, soft painterly paper texture, sparse details --ar 9:16 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, people, real castle, high contrast
```

**ほかのツール用（共通の英文プロンプト）**

```text
Vertical 9:16 background seen from the sky: a folded-paper castle keep at sunset with layered vermilion and gold origami roofs, crimson and amber paper clouds, tiny gold leaf flecks. Dramatic but low contrast, soft painterly paper texture. No text.
```

<a id="boss-1"></a>

## 主：池を統べる大蛙「ハネマル」

- ファイル: `public/games/orizuru-shooting/img/boss-1.webp`（768×768px）
- 用途: 第一幕の主が現れるときの紹介カード
- 内容: 若草色の和紙で折られた大きな折り紙の蛙。蓮の大きな葉の上に構え、雨粒が降る。折り目だけで表した、勇ましくも愛嬌のある顔。蓮の花びらの小さな冠。生成りの和紙の背景。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示
- メモ: 3 体の主は同じ ChatGPT のチャットで続けて作ると、紙の質感と背景がそろいます。カードでは正方形のまま表示します。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
正方形（1024×1024）のイラストを作ってください。若草色の和紙で折られた大きな折り紙のカエルが、池に浮かぶ大きな蓮の葉の上にどっしりと構えています。くっきりした折り目と平らな面だけで形ができていて、勇ましいけれど愛嬌のある表情。頭には蓮の花びらで折った小さな冠。まわりには雨粒が落ちています。紙の繊維が見えるやわらかな光、背景は生成り色の和紙の質感だけ。中央に大きく配置し、文字・ロゴは入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, realistic frog, existing characters
```

**ほかのツール用（共通の英文プロンプト）**

```text
Square illustration. A giant origami frog folded from fresh-green washi paper, crouching on a large lotus leaf on a pond, raindrops falling. Built only from crisp folds and flat facets, fierce but charming, a small crown folded from lotus petals. Soft light showing paper fibres, plain cream washi paper background, centered. No text.
```

<a id="boss-2"></a>

## 主：夜川に棲む切り絵の大鯉「スミゴイ」

- ファイル: `public/games/orizuru-shooting/img/boss-2.webp`（768×768px）
- 用途: 第二幕の主が現れるときの紹介カード
- 内容: 黒い紙を切り抜いた切り絵の大きな鯉。鱗は細かな切り抜き模様、ひれは朱色の紙。藍色の紙の波を上へと泳ぐ。生成りの和紙の背景。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示
- 参照画像: [`img/boss-1.webp`](#boss-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: boss-1 の画像を添付して「同じ質感・背景で」と頼むとそろいます。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
正方形（1024×1024）のイラストを、1 枚目のカエルと同じ紙の質感・同じ背景で作ってください。黒い紙を切り抜いた切り絵の大きな鯉が、藍色の紙で作った波の間を上へと力強く泳いでいます。鱗は細かな切り抜き模様、ひれと尾は朱色の紙、目は白い紙。小さな紙の灯籠が 2〜3 個浮かんでいます。背景は生成り色の和紙の質感だけ。中央に大きく配置し、文字・ロゴは入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, realistic fish photo, existing characters
```

**ほかのツール用（共通の英文プロンプト）**

```text
Square illustration in the same paper style as the frog. A giant carp made in Japanese cut-paper (kirie) style: black paper silhouette with fine cut-out scale patterns, vermilion paper fins and tail, white paper eyes, swimming upward through indigo paper waves with two or three small paper lanterns. Plain cream washi background, centered. No text.
```

<a id="boss-3"></a>

## 主：天守を守る紙の龍「カミナギ」

- ファイル: `public/games/orizuru-shooting/img/boss-3.webp`（768×768px）
- 用途: 第三幕の主が現れるときの紹介カード
- 内容: 朱と金の紙を折って作った長い龍が、夕焼けの紙の城の屋根に巻きつく。鋭い折り目、細い紙の帯でできたひげ、金色の角。生成りの和紙の背景。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示
- 参照画像: [`img/boss-1.webp`](#boss-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: boss-1 の画像を添付して「同じ質感・背景で」と頼むとそろいます。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
正方形（1024×1024）のイラストを、1 枚目のカエルと同じ紙の質感・同じ背景で作ってください。朱色と金色の紙を折って作った長い龍が、折り紙で組まれた城の屋根に巻きつき、こちらをにらんでいます。胴は菱形の折り紙を連ねたような節、ひげは細い紙の帯、角と腹は金色の紙。夕焼けの紙の雲が少し。背景は生成り色の和紙の質感だけ。中央に大きく配置し、文字・ロゴは入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, realistic dragon, existing characters
```

**ほかのツール用（共通の英文プロンプト）**

```text
Square illustration in the same paper style as the frog. A long dragon folded from vermilion and gold paper, coiled around a folded-paper castle roof, glaring at the viewer. Body like a chain of folded diamond segments, whiskers made of thin paper strips, gold horns and belly, a few sunset paper clouds. Plain cream washi background, centered. No text.
```
