# 番狂わせ大富豪 ― 画像の生成プロンプト

ゲーム: `public/games/daifugo/`（11 枚中 0 枚が生成済み、11 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/daifugo/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夜の昭和レトロな喫茶店で開かれる大富豪の卓。深い緑のフェルトとランプの琥珀色、差し色に金。人物はくっきりした線のアニメ調で、3 人とも同じ絵柄にそろえる。どの画像にも文字・ロゴ・実在の商標を入れない（トランプの札はゲームがコードで描きます）。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/daifugo/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- daifugo` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- daifugo`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（暗くして、上にタイトルの文字と設定を重ねます） | Midjourney（v7） |
| ⬜ | [`img/bg-table.webp`](#bg-table) | 1600×900 | 背景 | 対局画面の背景（全面。上に札と情報を重ね、革命中は紫に色を変えて暗くします） | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/cpu-hayate-normal.webp`](#cpu-hayate-normal) | 512×512 | 人物 | CPU「ハヤテ」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-hayate-happy.webp`](#cpu-hayate-happy) | 512×512 | 人物 | CPU「ハヤテ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-hayate-angry.webp`](#cpu-hayate-angry) | 512×512 | 人物 | CPU「ハヤテ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-shion-normal.webp`](#cpu-shion-normal) | 512×512 | 人物 | CPU「シオン」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-shion-happy.webp`](#cpu-shion-happy) | 512×512 | 人物 | CPU「シオン」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-shion-angry.webp`](#cpu-shion-angry) | 512×512 | 人物 | CPU「シオン」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-gonzo-normal.webp`](#cpu-gonzo-normal) | 512×512 | 人物 | CPU「ゴンゾウ」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-gonzo-happy.webp`](#cpu-gonzo-happy) | 512×512 | 人物 | CPU「ゴンゾウ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-gonzo-angry.webp`](#cpu-gonzo-angry) | 512×512 | 人物 | CPU「ゴンゾウ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key-visual"></a>

## キービジュアル：夜の喫茶店の大富豪

- ファイル: `public/games/daifugo/img/key-visual.webp`（1600×900px）
- 用途: タイトル画面の背景（暗くして、上にタイトルの文字と設定を重ねます）
- 内容: 夜の昭和レトロな喫茶店。緑のフェルトを敷いたテーブルの上で、トランプが宙に舞い、ジョーカーと 2 が光る。ランプの暖かい光、窓の外は商店街のネオン。中央上にタイトルを置く暗い余白。人物は入れない
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: トランプの絵柄の細部や看板の文字は崩れやすいので、文字が出たら `--no text` を強めるか、その部分をぼかしてください（タイトル画面では暗くして使います）。

**Midjourney（v7）用のプロンプト**

```text
cinematic key visual of a cozy retro Japanese coffee shop at night, playing cards flying above a green felt table, a joker card and a few twos glowing with golden light, warm pendant lamp light, rain-streaked window with blurred shopping street neon outside, rich teal and amber palette, dramatic depth of field, empty dark space in the upper center, no people, no text --ar 16:9 --v 7 --style raw --no text, letters, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers on signs, logo, watermark, people, faces, brand names
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cinematic 16:9 illustration with no text: a cozy retro Japanese coffee shop at night, playing cards flying over a green felt table, a joker and some twos glowing gold, warm lamp light, rainy window with blurred neon of a shopping street, teal and amber colours, dark empty space in the upper center for a title, no people.
```

<a id="bg-table"></a>

## 背景：緑のフェルトの卓

- ファイル: `public/games/daifugo/img/bg-table.webp`（1600×900px）
- 用途: 対局画面の背景（全面。上に札と情報を重ね、革命中は紫に色を変えて暗くします）
- 内容: 真上から見た深い緑のフェルトのカードテーブル。細かい繊維の質感、ほのかな光のむら、周辺は少し暗く、物は何も置かない
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択
- メモ: Leonardo.Ai の Phoenix などで、縦横比 16:9（1536×864 前後）で生成します。テクスチャとして使うので、模様や物のない、均一で落ち着いた布地が向いています。画面の比率によって中央付近が切り出されます。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Seamless top-down texture of a deep green wool felt card table surface, fine fibre detail, very subtle light falloff toward the edges, soft overhead lamp glow in the middle, calm and even, nothing on the table, photorealistic material texture, 16:9
```

**ネガティブプロンプト（入れたくないもの）**

```text
cards, chips, objects, text, logo, pattern print, wood frame, hands, harsh shadow
```

**ほかのツール用（共通の英文プロンプト）**

```text
A photorealistic top-down texture of a plain deep green felt card table: fine fibres, a soft lamp glow in the middle and slightly darker edges, nothing on it, 16:9.
```

<a id="cpu-hayate-normal"></a>

## ハヤテ：ふつう

- ファイル: `public/games/daifugo/img/cpu-hayate-normal.webp`（512×512px）
- 用途: CPU「ハヤテ」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介
- 内容: 商店街の配達少年ハヤテ（速攻派）。つんつんの茶髪に後ろ向きのオレンジの帽子、紺のウインドブレーカー、頬にばんそうこう。ふつうの表情（自信のある穏やかな顔）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: ハヤテの基準の絵です。最初に作り、「うれしい」「くやしい」はこの画像を Gemini に添付して表情だけを変えます。ゲームは丸く小さく切り抜くので、顔が中央に大きく入る構図にしてください。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait, clean line art, soft cel shading, warm cafe lamp light, looking at the viewer, head and shoulders centered, plain solid dark background, an energetic 16-year-old delivery boy with spiky brown hair, an orange cap worn backwards, a navy windbreaker over a white T-shirt, bandage on his cheek, a confident relaxed expression, slight smile --niji 6 --ar 1:1 --no text
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of an energetic 16-year-old delivery boy with spiky brown hair, an orange cap worn backwards, a navy windbreaker over a white T-shirt, bandage on his cheek, a confident relaxed expression, slight smile. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-hayate-happy"></a>

## ハヤテ：うれしい

- ファイル: `public/games/daifugo/img/cpu-hayate-happy.webp`（512×512px）
- 用途: CPU「ハヤテ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 商店街の配達少年ハヤテ（速攻派）。つんつんの茶髪に後ろ向きのオレンジの帽子、紺のウインドブレーカー、頬にばんそうこう。うれしい表情（得意げな満面の笑み）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-hayate-normal.webp`](#cpu-hayate-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 基準の「cpu-hayate-normal」を Gemini に添付し、表情だけを変える編集として頼むと、同じ人物のまま差分が作れます。顔の位置と大きさがずれないようにしてください。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像の人物（ハヤテ）と同じキャラクター・同じ服装・同じ絵柄・同じ構図と背景のまま、表情だけを「うれしい表情（得意げな満面の笑み）」に変えてください。正方形（1:1）、文字は入れないでください。 / Keep the attached character exactly the same (same face, hair, outfit, art style, framing and plain dark background) and change only the expression to: a big happy grin, eyes bright, triumphant. Square 1:1, no text.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of an energetic 16-year-old delivery boy with spiky brown hair, an orange cap worn backwards, a navy windbreaker over a white T-shirt, bandage on his cheek, a big happy grin, eyes bright, triumphant. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-hayate-angry"></a>

## ハヤテ：くやしい

- ファイル: `public/games/daifugo/img/cpu-hayate-angry.webp`（512×512px）
- 用途: CPU「ハヤテ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 商店街の配達少年ハヤテ（速攻派）。つんつんの茶髪に後ろ向きのオレンジの帽子、紺のウインドブレーカー、頬にばんそうこう。くやしい表情（歯を食いしばる、汗）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-hayate-normal.webp`](#cpu-hayate-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 基準の「cpu-hayate-normal」を Gemini に添付し、表情だけを変える編集として頼むと、同じ人物のまま差分が作れます。顔の位置と大きさがずれないようにしてください。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像の人物（ハヤテ）と同じキャラクター・同じ服装・同じ絵柄・同じ構図と背景のまま、表情だけを「くやしい表情（歯を食いしばる、汗）」に変えてください。正方形（1:1）、文字は入れないでください。 / Keep the attached character exactly the same (same face, hair, outfit, art style, framing and plain dark background) and change only the expression to: a frustrated, annoyed expression, gritted teeth, a drop of sweat. Square 1:1, no text.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of an energetic 16-year-old delivery boy with spiky brown hair, an orange cap worn backwards, a navy windbreaker over a white T-shirt, bandage on his cheek, a frustrated, annoyed expression, gritted teeth, a drop of sweat. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-shion-normal"></a>

## シオン：ふつう

- ファイル: `public/games/daifugo/img/cpu-shion-normal.webp`（512×512px）
- 用途: CPU「シオン」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介
- 内容: 眼鏡の大学生シオン（慎重派）。低い位置でまとめた紫がかった長い黒髪、丸い銀縁眼鏡、ラベンダーのカーディガン。ふつうの表情（自信のある穏やかな顔）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: シオンの基準の絵です。最初に作り、「うれしい」「くやしい」はこの画像を Gemini に添付して表情だけを変えます。ゲームは丸く小さく切り抜くので、顔が中央に大きく入る構図にしてください。ハヤテと絵柄をそろえたいときは、ハヤテの画像を `--sref` に指定します。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait, clean line art, soft cel shading, warm cafe lamp light, looking at the viewer, head and shoulders centered, plain solid dark background, a calm university student woman with long dark purple hair in a low ponytail, round silver glasses, a lavender cardigan over a white blouse, a confident relaxed expression, slight smile --niji 6 --ar 1:1 --no text
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of a calm university student woman with long dark purple hair in a low ponytail, round silver glasses, a lavender cardigan over a white blouse, a confident relaxed expression, slight smile. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-shion-happy"></a>

## シオン：うれしい

- ファイル: `public/games/daifugo/img/cpu-shion-happy.webp`（512×512px）
- 用途: CPU「シオン」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 眼鏡の大学生シオン（慎重派）。低い位置でまとめた紫がかった長い黒髪、丸い銀縁眼鏡、ラベンダーのカーディガン。うれしい表情（得意げな満面の笑み）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-shion-normal.webp`](#cpu-shion-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 基準の「cpu-shion-normal」を Gemini に添付し、表情だけを変える編集として頼むと、同じ人物のまま差分が作れます。顔の位置と大きさがずれないようにしてください。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像の人物（シオン）と同じキャラクター・同じ服装・同じ絵柄・同じ構図と背景のまま、表情だけを「うれしい表情（得意げな満面の笑み）」に変えてください。正方形（1:1）、文字は入れないでください。 / Keep the attached character exactly the same (same face, hair, outfit, art style, framing and plain dark background) and change only the expression to: a big happy grin, eyes bright, triumphant. Square 1:1, no text.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of a calm university student woman with long dark purple hair in a low ponytail, round silver glasses, a lavender cardigan over a white blouse, a big happy grin, eyes bright, triumphant. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-shion-angry"></a>

## シオン：くやしい

- ファイル: `public/games/daifugo/img/cpu-shion-angry.webp`（512×512px）
- 用途: CPU「シオン」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 眼鏡の大学生シオン（慎重派）。低い位置でまとめた紫がかった長い黒髪、丸い銀縁眼鏡、ラベンダーのカーディガン。くやしい表情（歯を食いしばる、汗）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-shion-normal.webp`](#cpu-shion-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 基準の「cpu-shion-normal」を Gemini に添付し、表情だけを変える編集として頼むと、同じ人物のまま差分が作れます。顔の位置と大きさがずれないようにしてください。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像の人物（シオン）と同じキャラクター・同じ服装・同じ絵柄・同じ構図と背景のまま、表情だけを「くやしい表情（歯を食いしばる、汗）」に変えてください。正方形（1:1）、文字は入れないでください。 / Keep the attached character exactly the same (same face, hair, outfit, art style, framing and plain dark background) and change only the expression to: a frustrated, annoyed expression, gritted teeth, a drop of sweat. Square 1:1, no text.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of a calm university student woman with long dark purple hair in a low ponytail, round silver glasses, a lavender cardigan over a white blouse, a frustrated, annoyed expression, gritted teeth, a drop of sweat. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-gonzo-normal"></a>

## ゴンゾウ：ふつう

- ファイル: `public/games/daifugo/img/cpu-gonzo-normal.webp`（512×512px）
- 用途: CPU「ゴンゾウ」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介
- 内容: 喫茶店のマスター・ゴンゾウ（一発逆転派）。太い黒ひげ、短い白髪まじりの髪、白いシャツに深緑のエプロン、肩にタオル。ふつうの表情（自信のある穏やかな顔）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: ゴンゾウの基準の絵です。最初に作り、「うれしい」「くやしい」はこの画像を Gemini に添付して表情だけを変えます。ゲームは丸く小さく切り抜くので、顔が中央に大きく入る構図にしてください。ハヤテと絵柄をそろえたいときは、ハヤテの画像を `--sref` に指定します。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait, clean line art, soft cel shading, warm cafe lamp light, looking at the viewer, head and shoulders centered, plain solid dark background, a big jovial coffee shop master in his fifties with a thick black moustache and short grey hair, a dark green apron over a white shirt with rolled sleeves, a towel on his shoulder, a confident relaxed expression, slight smile --niji 6 --ar 1:1 --no text
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of a big jovial coffee shop master in his fifties with a thick black moustache and short grey hair, a dark green apron over a white shirt with rolled sleeves, a towel on his shoulder, a confident relaxed expression, slight smile. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-gonzo-happy"></a>

## ゴンゾウ：うれしい

- ファイル: `public/games/daifugo/img/cpu-gonzo-happy.webp`（512×512px）
- 用途: CPU「ゴンゾウ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 喫茶店のマスター・ゴンゾウ（一発逆転派）。太い黒ひげ、短い白髪まじりの髪、白いシャツに深緑のエプロン、肩にタオル。うれしい表情（得意げな満面の笑み）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-gonzo-normal.webp`](#cpu-gonzo-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 基準の「cpu-gonzo-normal」を Gemini に添付し、表情だけを変える編集として頼むと、同じ人物のまま差分が作れます。顔の位置と大きさがずれないようにしてください。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像の人物（ゴンゾウ）と同じキャラクター・同じ服装・同じ絵柄・同じ構図と背景のまま、表情だけを「うれしい表情（得意げな満面の笑み）」に変えてください。正方形（1:1）、文字は入れないでください。 / Keep the attached character exactly the same (same face, hair, outfit, art style, framing and plain dark background) and change only the expression to: a big happy grin, eyes bright, triumphant. Square 1:1, no text.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of a big jovial coffee shop master in his fifties with a thick black moustache and short grey hair, a dark green apron over a white shirt with rolled sleeves, a towel on his shoulder, a big happy grin, eyes bright, triumphant. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```

<a id="cpu-gonzo-angry"></a>

## ゴンゾウ：くやしい

- ファイル: `public/games/daifugo/img/cpu-gonzo-angry.webp`（512×512px）
- 用途: CPU「ゴンゾウ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 喫茶店のマスター・ゴンゾウ（一発逆転派）。太い黒ひげ、短い白髪まじりの髪、白いシャツに深緑のエプロン、肩にタオル。くやしい表情（歯を食いしばる、汗）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-gonzo-normal.webp`](#cpu-gonzo-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 基準の「cpu-gonzo-normal」を Gemini に添付し、表情だけを変える編集として頼むと、同じ人物のまま差分が作れます。顔の位置と大きさがずれないようにしてください。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像の人物（ゴンゾウ）と同じキャラクター・同じ服装・同じ絵柄・同じ構図と背景のまま、表情だけを「くやしい表情（歯を食いしばる、汗）」に変えてください。正方形（1:1）、文字は入れないでください。 / Keep the attached character exactly the same (same face, hair, outfit, art style, framing and plain dark background) and change only the expression to: a frustrated, annoyed expression, gritted teeth, a drop of sweat. Square 1:1, no text.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, signature, extra people, hands covering face, cropped head
```

**ほかのツール用（共通の英文プロンプト）**

```text
An anime-style head-and-shoulders portrait (square 1:1) of a big jovial coffee shop master in his fifties with a thick black moustache and short grey hair, a dark green apron over a white shirt with rolled sleeves, a towel on his shoulder, a frustrated, annoyed expression, gritted teeth, a drop of sweat. Clean line art, soft cel shading, warm cafe lamp light, facing the viewer, face centered, plain solid dark background. No text.
```
