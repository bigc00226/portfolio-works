# 宵祭り金魚すくい ― 画像の生成プロンプト

ゲーム: `public/games/kingyo-sukui/`（12 枚中 0 枚が生成済み、12 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/kingyo-sukui/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夏祭りの夜。提灯と裸電球のあたたかい橙色の光と、群青色の夜空・水の青の対比。やさしく郷愁のある雰囲気で、絵は水彩風の手描きのタッチ（背景は少し写実寄り、人物はアニメ調、図鑑の金魚は博物画風の水彩）。文字・ロゴ・実在の店名や商標は入れない。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/kingyo-sukui/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- kingyo-sukui` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- kingyo-sukui`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/bg.webp`](#bg) | 1600×1000 | 背景 | プレイ画面の背景（水槽のまわりに暗くして表示） | Midjourney（v7） |
| ⬜ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景 | Adobe Firefly（Image 4） |
| ⬜ | [`img/keeper.webp`](#keeper) | 480×600（透過） | 人物 | 左のパネル（スマホは上の丸い窓）でひと言をしゃべる・結果画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/keeper-wow.webp`](#keeper-wow) | 480×600（透過） | 人物 | めずらしい金魚・何匹もすくったとき・結果がよいとき | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/fish-wakin.webp`](#fish-wakin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-ryukin.webp`](#fish-ryukin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-demekin.webp`](#fish-demekin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-kurodeme.webp`](#fish-kurodeme) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-comet.webp`](#fish-comet) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-shubunkin.webp`](#fish-shubunkin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-ranchu.webp`](#fish-ranchu) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-tancho.webp`](#fish-tancho) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="bg"></a>

## 背景：夏祭りの夜店

- ファイル: `public/games/kingyo-sukui/img/bg.webp`（1600×1000px）
- 用途: プレイ画面の背景（水槽のまわりに暗くして表示）
- 内容: 夏祭りの夜の金魚すくいの屋台。赤と白の紅白幕、ずらりと吊るした提灯、木の台、奥にぼんやりした屋台の明かりと人の気配（人物ははっきり描かない）。中央は水槽を重ねるので暗めで静かに。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ゲームでは暗く重ねて、中央に水槽を描きます。提灯など明るいものは上と左右に。

**Midjourney（v7）用のプロンプト**

```text
a goldfish scooping stall at a Japanese summer night festival, rows of glowing red and white paper lanterns, red and white striped curtain, simple wooden counter, warm bulb light against a deep indigo night sky, blurred festival stalls in the distance with bokeh, nostalgic and dreamy, painterly realism, darker calm center area, no people in focus, no text, no signage --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, signage, logo, brand names, people in focus, faces
```

**ほかのツール用（共通の英文プロンプト）**

```text
A goldfish scooping stall at a Japanese summer night festival: glowing red and white paper lanterns, a red and white striped curtain, a wooden counter, warm light against a deep indigo sky, blurred stalls and bokeh in the distance, nostalgic painterly realism, a darker calm centre, no people in focus, no text. Aspect ratio 16:10.
```

<a id="key"></a>

## キービジュアル：提灯の灯りと金魚

- ファイル: `public/games/kingyo-sukui/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景
- 内容: 水色の金魚すくいの水槽を真上から少し斜めに見た写真風の絵。赤い金魚と黒い出目金が泳ぎ、水面に提灯の橙色の光がゆらめく。手前にポイ（紙を張った輪）がひとつ浮かぶ。中央にタイトルを重ねるので、中央は明るすぎずすっきりと。
- おすすめのツール: [Adobe Firefly（Image 4）](https://firefly.adobe.com/) ― サイズ: 縦横比を画面で選択
- メモ: Adobe Firefly: コンテンツの種類「写真」、縦横比 16:9。タイトルの文字は HTML で重ねるので入れません。

**Adobe Firefly（Image 4）用のプロンプト**

```text
Photograph of a shallow light blue goldfish scooping tub at a Japanese summer night festival, seen from above at a slight angle, many small red goldfish and a few black telescope-eye goldfish swimming, warm orange reflections of paper lanterns rippling on the water surface, a single paper scoop (poi) with a pink plastic rim resting at the edge, shallow depth of field, magical nostalgic summer night mood, calm space in the center, no text
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, hands, people, watermark
```

**ほかのツール用（共通の英文プロンプト）**

```text
A shallow light-blue goldfish scooping tub at a Japanese summer night festival, seen from above at a slight angle: small red goldfish and a few black telescope-eye goldfish, orange lantern reflections rippling on the water, a paper scoop with a pink rim at the edge, shallow depth of field, nostalgic summer night, calm centre, no text. 16:9.
```

<a id="keeper"></a>

## 屋台のおじさん（ふつう）

- ファイル: `public/games/kingyo-sukui/img/keeper.webp`（480×600px・背景は透過）
- 用途: 左のパネル（スマホは上の丸い窓）でひと言をしゃべる・結果画面
- 内容: 金魚すくいの屋台のおじさん。50 代くらい、日焼けした笑顔、ねじり鉢巻き、紺の法被（はっぴ）、首に手ぬぐい。胸から上、正面やや斜め、にっこり笑っている。アニメ調。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- メモ: 表情違い（keeper-wow）の元になる 1 枚。背景は無地のグレーにして、自動で切り抜きます。頭から胸までが入るように（スマホでは上の 8 割を丸く切り抜いて顔を見せます）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
friendly Japanese summer festival stall keeper, man in his fifties, tanned cheerful face, warm big smile, twisted towel headband (hachimaki), navy blue happi coat, a small towel around the neck, bust-up portrait, facing slightly to the side, anime style, soft cel shading, warm lantern rim light, plain flat light gray background, no text --niji 6 --ar 4:5
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand marks, background scenery, hands covering face
```

**ほかのツール用（共通の英文プロンプト）**

```text
A friendly Japanese summer festival stall keeper in his fifties: tanned cheerful face, big warm smile, twisted towel headband, navy happi coat, a small towel around the neck. Bust-up portrait, anime style with soft cel shading, warm lantern rim light, on a plain flat light gray background, no text. Portrait 4:5.
```

<a id="keeper-wow"></a>

## 屋台のおじさん（びっくり・感心）

- ファイル: `public/games/kingyo-sukui/img/keeper-wow.webp`（480×600px・背景は透過）
- 用途: めずらしい金魚・何匹もすくったとき・結果がよいとき
- 内容: keeper と同じおじさんが、目を丸くして口を開け、感心して驚いている表情（片手でおでこを押さえるなど）。服装・髪型・構図は keeper と同じ。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/keeper.webp`](#keeper) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: Gemini に keeper の画像を添付して「表情だけを変えて」と頼むと、人物がそろいます。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Using the attached picture of the festival stall keeper, keep exactly the same man, the same clothes (twisted towel headband, navy happi coat, towel around the neck), the same anime style, framing and plain light gray background. Change only his expression to amazed and impressed: eyes wide open, eyebrows raised, mouth open in a delighted "wow", one hand touching his forehead. Portrait 4:5, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same friendly festival stall keeper as the reference (headband, navy happi coat, towel), same anime style and framing, now amazed and impressed: wide eyes, raised eyebrows, open mouth, one hand on the forehead. Plain light gray background, portrait 4:5, no text.
```

<a id="fish-wakin"></a>

## 図鑑：和金

- ファイル: `public/games/kingyo-sukui/img/fish-wakin.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 和金（フナに近い細身の体、短い二股の尾びれ、明るい赤橙色）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- メモ: 図鑑のセット（fish-*）の基準になる 1 枚。Recraft で「Digital illustration → Hand-drawn / Watercolor」系のスタイルを選び、できたらスタイルとして保存します。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a wakin goldfish: slim streamlined body like a small carp, short forked tail, bright red-orange scales, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a wakin goldfish: slim streamlined body like a small carp, short forked tail, bright red-orange scales: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```

<a id="fish-ryukin"></a>

## 図鑑：琉金

- ファイル: `public/games/kingyo-sukui/img/fish-ryukin.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 琉金（背の高い丸く短い体、長くひらひらした二重の尾びれ、紅白の模様）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: fish-wakin と同じ Recraft のスタイル（保存したスタイル）で作ると、図鑑の絵柄がそろいます。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a ryukin goldfish: short deep rounded body with a high back, long flowing double veil tail, red and white pattern, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a ryukin goldfish: short deep rounded body with a high back, long flowing double veil tail, red and white pattern: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```

<a id="fish-demekin"></a>

## 図鑑：出目金

- ファイル: `public/games/kingyo-sukui/img/fish-demekin.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 出目金（丸い体、左右に大きく飛び出した目、二重の尾びれ、赤橙色）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: fish-wakin と同じ Recraft のスタイル（保存したスタイル）で作ると、図鑑の絵柄がそろいます。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a red telescope-eye goldfish (demekin): round body, large protruding eyes on both sides, flowing double tail, red-orange, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a red telescope-eye goldfish (demekin): round body, large protruding eyes on both sides, flowing double tail, red-orange: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```

<a id="fish-kurodeme"></a>

## 図鑑：黒出目金

- ファイル: `public/games/kingyo-sukui/img/fish-kurodeme.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 黒出目金（ビロードのような真っ黒な体、大きく飛び出した目、二重の尾びれ）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: fish-wakin と同じ Recraft のスタイル（保存したスタイル）で作ると、図鑑の絵柄がそろいます。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a black telescope-eye goldfish (kuro demekin): velvety solid black body, large protruding eyes, flowing double tail, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a black telescope-eye goldfish (kuro demekin): velvety solid black body, large protruding eyes, flowing double tail: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```

<a id="fish-comet"></a>

## 図鑑：コメット

- ファイル: `public/games/kingyo-sukui/img/fish-comet.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: コメット（細長い体、吹き流しのように長い一枚の尾びれ、鮮やかな赤橙色）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: fish-wakin と同じ Recraft のスタイル（保存したスタイル）で作ると、図鑑の絵柄がそろいます。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a comet goldfish: slender body and a very long deeply forked single tail like a streamer, vivid red-orange, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a comet goldfish: slender body and a very long deeply forked single tail like a streamer, vivid red-orange: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```

<a id="fish-shubunkin"></a>

## 図鑑：朱文金

- ファイル: `public/games/kingyo-sukui/img/fish-shubunkin.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 朱文金（細身の体に、青灰・赤・白・黒のまだら模様、長い尾びれ）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: fish-wakin と同じ Recraft のスタイル（保存したスタイル）で作ると、図鑑の絵柄がそろいます。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a shubunkin goldfish: slim body with calico pattern of blue-gray, red, white and black speckles, long single tail, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a shubunkin goldfish: slim body with calico pattern of blue-gray, red, white and black speckles, long single tail: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```

<a id="fish-ranchu"></a>

## 図鑑：らんちゅう

- ファイル: `public/games/kingyo-sukui/img/fish-ranchu.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: らんちゅう（背びれのない卵形の太った体、頭にこぶ、短い二重の尾びれ、橙赤色）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: fish-wakin と同じ Recraft のスタイル（保存したスタイル）で作ると、図鑑の絵柄がそろいます。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a ranchu goldfish: plump egg-shaped body with no dorsal fin, bumpy raspberry-like hood growth on the head, short double tail, orange-red, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a ranchu goldfish: plump egg-shaped body with no dorsal fin, bumpy raspberry-like hood growth on the head, short double tail, orange-red: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```

<a id="fish-tancho"></a>

## 図鑑：丹頂

- ファイル: `public/games/kingyo-sukui/img/fish-tancho.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 丹頂（真っ白な体とひれ、頭のてっぺんにだけ丸い赤い模様、二重の尾びれ）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: fish-wakin と同じ Recraft のスタイル（保存したスタイル）で作ると、図鑑の絵柄がそろいます。生成後に「Remove background」で透過にします（白い背景のままでも自動で切り抜きます）。横長 4:3。

**Recraft（V3）用のプロンプト**

```text
Natural history field guide illustration of a tancho goldfish: pure pearly white body and fins with a single round bright red cap on top of the head, flowing double tail, full body side view facing left, delicate hand-painted watercolor with fine ink outlines, accurate fins and scales, soft shading, centered with a small margin, isolated on a plain white background, no text, no labels
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, labels, letters, frame, water background, multiple fish
```

**ほかのツール用（共通の英文プロンプト）**

```text
A field guide watercolor illustration of a tancho goldfish: pure pearly white body and fins with a single round bright red cap on top of the head, flowing double tail: full body side view facing left, fine ink outlines, accurate fins and scales, soft shading, centred, isolated on a plain white background, no text.
```
