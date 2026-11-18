# 和菓子ころりん ― 画像の生成プロンプト

ゲーム: `public/games/wagashi-merge/`（14 枚中 0 枚が生成済み、14 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/wagashi-merge/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

やわらかな自然光で撮ったような和菓子の質感（もちもち・つやつや・粉砂糖）を、ほんの少し絵本のように可愛らしく。色は生成り・桜色・抹茶色・小豆色・飴色の落ち着いた和のパレット。木の重箱と畳の茶屋のぬくもり。文字・ロゴ・人物は入れない。お菓子の画像は真上から見た丸い形（ゲームの中で回転して表示されます）。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/wagashi-merge/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- wagashi-merge` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- wagashi-merge`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/sweet-01.webp`](#sweet-01) | 256×256（透過） | スプライト | 重箱の中のお菓子（1 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-02.webp`](#sweet-02) | 256×256（透過） | スプライト | 重箱の中のお菓子（2 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-03.webp`](#sweet-03) | 256×256（透過） | スプライト | 重箱の中のお菓子（3 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-04.webp`](#sweet-04) | 256×256（透過） | スプライト | 重箱の中のお菓子（4 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-05.webp`](#sweet-05) | 256×256（透過） | スプライト | 重箱の中のお菓子（5 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-06.webp`](#sweet-06) | 256×256（透過） | スプライト | 重箱の中のお菓子（6 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-07.webp`](#sweet-07) | 256×256（透過） | スプライト | 重箱の中のお菓子（7 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-08.webp`](#sweet-08) | 256×256（透過） | スプライト | 重箱の中のお菓子（8 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-09.webp`](#sweet-09) | 256×256（透過） | スプライト | 重箱の中のお菓子（9 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-10.webp`](#sweet-10) | 256×256（透過） | スプライト | 重箱の中のお菓子（10 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-11.webp`](#sweet-11) | 256×256（透過） | スプライト | 重箱の中のお菓子（11 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/tea.webp`](#tea) | 256×256（透過） | アイテム | 「お茶」ボタンの絵（お菓子をひとつ取りのぞく） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/bg.webp`](#bg) | 1600×1200 | 背景 | プレイ画面の背景（重箱のうしろに暗くして表示） | Midjourney（v7） |
| ⬜ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景 | Ideogram（3.0） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="sweet-01"></a>

## 金平糖

- ファイル: `public/games/wagashi-merge/img/sweet-01.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（1 段目）・お品書き・つぎのお菓子
- 内容: 金平糖ひと粒（薄紫と桜色の、いぼいぼの星形の砂糖菓子。きらきらした砂糖の結晶）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- メモ: このセット（sweet-01〜11）の基準になる 1 枚。最初に作ります。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a single konpeito sugar candy, a bumpy star-shaped sugar ball in pastel lavender and pale pink, sparkling sugar crystals, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a single konpeito sugar candy, a bumpy star-shaped sugar ball in pastel lavender and pale pink, sparkling sugar crystals. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-02"></a>

## 黒豆

- ファイル: `public/games/wagashi-merge/img/sweet-02.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（2 段目）・お品書き・つぎのお菓子
- 内容: つやつやの黒豆の甘煮ひと粒（黒紫で鏡のような照り、砂糖の粒が少し）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a single glossy sweet black soybean (kuromame), deep black-purple with a mirror-like shine and a few sugar crystals, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a single glossy sweet black soybean (kuromame), deep black-purple with a mirror-like shine and a few sugar crystals. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-03"></a>

## 栗きんとん

- ファイル: `public/games/wagashi-merge/img/sweet-03.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（3 段目）・お品書き・つぎのお菓子
- 内容: 茶巾しぼりの栗きんとん（黄金色、上に絞りのひだ）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a round chakin-shibori kurikinton chestnut sweet, golden yellow mashed chestnut twisted closed with cloth-pleat marks on top, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a round chakin-shibori kurikinton chestnut sweet, golden yellow mashed chestnut twisted closed with cloth-pleat marks on top. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-04"></a>

## 桜餅

- ファイル: `public/games/wagashi-merge/img/sweet-04.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（4 段目）・お品書き・つぎのお菓子
- 内容: 道明寺の桜餅（桃色のつぶつぶのお餅を、塩漬けの桜の葉で包んだもの）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a round domyoji sakura mochi, pink grainy rice cake wrapped in a salted cherry leaf, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a round domyoji sakura mochi, pink grainy rice cake wrapped in a salted cherry leaf. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-05"></a>

## 草餅

- ファイル: `public/games/wagashi-merge/img/sweet-05.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（5 段目）・お品書き・つぎのお菓子
- 内容: よもぎの草餅（やわらかな緑色の丸いお餅、きな粉を少し）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a round yomogi kusamochi, soft mugwort green rice cake dusted with a little kinako, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a round yomogi kusamochi, soft mugwort green rice cake dusted with a little kinako. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-06"></a>

## 最中

- ファイル: `public/games/wagashi-merge/img/sweet-06.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（6 段目）・お品書き・つぎのお菓子
- 内容: 丸い最中（香ばしく焼いた皮に梅の花の型押し）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a round monaka, crisp toasted wafer shell with an embossed plum blossom pattern, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a round monaka, crisp toasted wafer shell with an embossed plum blossom pattern. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-07"></a>

## 水まんじゅう

- ファイル: `public/games/wagashi-merge/img/sweet-07.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（7 段目）・お品書き・つぎのお菓子
- 内容: 水まんじゅう（透きとおった葛の中にこしあんが見える。小さな水滴）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a round mizu manju, clear glossy kudzu jelly with smooth red bean paste visible inside, tiny water droplets, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a round mizu manju, clear glossy kudzu jelly with smooth red bean paste visible inside, tiny water droplets. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-08"></a>

## おはぎ

- ファイル: `public/games/wagashi-merge/img/sweet-08.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（8 段目）・お品書き・つぎのお菓子
- 内容: おはぎ（ごはんをこしあんでくるんだ丸いお菓子、しっとりした質感）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a round ohagi, rice ball fully covered with smooth dark red bean paste, soft matte texture, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a round ohagi, rice ball fully covered with smooth dark red bean paste, soft matte texture. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-09"></a>

## どら焼き

- ファイル: `public/games/wagashi-merge/img/sweet-09.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（9 段目）・お品書き・つぎのお菓子
- 内容: 真上から見たどら焼き（きつね色の焼き目、ふちは明るい色）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a dorayaki seen from above, round fluffy pancake with an evenly browned golden-brown top and a lighter rim, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a dorayaki seen from above, round fluffy pancake with an evenly browned golden-brown top and a lighter rim. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-10"></a>

## 大福

- ファイル: `public/games/wagashi-merge/img/sweet-10.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（10 段目）・お品書き・つぎのお菓子
- 内容: 大福（白い粉をまとった、ふっくらした丸いお餅）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a big round white daifuku mochi dusted with fine potato starch, soft and plump, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a big round white daifuku mochi dusted with fine potato starch, soft and plump. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="sweet-11"></a>

## 鏡餅

- ファイル: `public/games/wagashi-merge/img/sweet-11.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（11 段目）・お品書き・つぎのお菓子
- 内容: 真上から見た鏡餅（白い丸餅が二段、上に葉つきの橙）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: sweet-01 を Style Reference（Image Guidance）に添付して、光と質感をそろえます。Leonardo.Ai: Phoenix・1024×1024・Transparency をオン。ゲームでは丸い当たり判定に合わせて回転するので、真上から見た丸い形で画面いっぱいに（余白は 4% ほど）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
Top-down view of a kagami mochi seen from directly above, two stacked white round rice cakes with a small bitter orange (daidai) with a leaf on top, centered, perfectly round silhouette filling the square frame edge to edge with a tiny margin, cute Japanese wagashi confectionery game asset, soft natural daylight, gentle shading on the object only, appetizing realistic texture with a slight storybook charm, clean crisp edges, isolated, no plate, no table, no text, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, plate, dish, table, chopsticks, hands, multiple objects, cropped, cut off, side view, harsh shadow, cast shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese sweet viewed from directly above: a kagami mochi seen from directly above, two stacked white round rice cakes with a small bitter orange (daidai) with a leaf on top. Centered, round silhouette filling a square image with a very small margin, soft daylight, appetizing texture with a slight storybook charm, isolated on a plain white background, no plate, no text.
```

<a id="tea"></a>

## お茶

- ファイル: `public/games/wagashi-merge/img/tea.webp`（256×256px・背景は透過）
- 用途: 「お茶」ボタンの絵（お菓子をひとつ取りのぞく）
- 内容: 少し上から見た湯呑みの緑茶（鮮やかな若草色、ふちにほのかな湯気）。ほぼ丸いシルエット。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: ゲームでは丸いボタンの中に小さく表示します。透過 PNG で出せない場合は白い無地の背景で（自動で切り抜きます）。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A small round Japanese teacup (yunomi) filled with bright fresh green tea, seen from above at a slight angle so the silhouette is almost a circle, a soft wisp of steam, warm cream glazed ceramic with a simple brush stroke, soft natural light, cute game item icon style with realistic texture. The cup fills the frame with a small margin. No text, no saucer, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, saucer, table, hands, background scenery
```

**ほかのツール用（共通の英文プロンプト）**

```text
A small round Japanese teacup of bright green tea seen from above at a slight angle, a little steam, cream glazed ceramic, cute game item, almost circular silhouette filling a square image, isolated on a plain white background, no text.
```

<a id="bg"></a>

## 背景：夕方の茶屋の座敷

- ファイル: `public/games/wagashi-merge/img/bg.webp`（1600×1200px）
- 用途: プレイ画面の背景（重箱のうしろに暗くして表示）
- 内容: 夕方の静かな茶屋の座敷。畳、障子越しのやわらかな西日、低い木の机、奥にぼんやり床の間。中央には重箱が重なるので落ち着いた余白に。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ゲームでは暗く重ねて表示し、中央に重箱が来ます。スマホの縦長では左右が切れるので、大事なものは中央付近に。

**Midjourney（v7）用のプロンプト**

```text
interior of a quiet traditional Japanese tea house in the late afternoon, tatami floor, shoji screens glowing with warm low sunlight, a low wooden table, a tokonoma alcove softly out of focus, calm empty center space, warm amber cream and deep brown palette, gentle painterly realism, shallow depth of field, cozy and nostalgic, no people, no text --ar 4:3 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
people, text, signage, logo, modern furniture
```

**ほかのツール用（共通の英文プロンプト）**

```text
A calm traditional Japanese tea house room in late afternoon light: tatami floor, glowing shoji screens, a low wooden table, a softly blurred alcove, warm amber and brown colours, painterly realism, shallow depth of field, an empty calm centre, no people, no text. Aspect ratio 4:3.
```

<a id="key"></a>

## キービジュアル：重箱に転がる和菓子

- ファイル: `public/games/wagashi-merge/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景
- 内容: 黒漆の重箱に、桜餅・大福・最中・どら焼き・金平糖などの和菓子がころころと転がり込む楽しい瞬間。桜の花びらが舞い、奥に障子のやわらかな光。中央にタイトルの文字を重ねるので、中央はすっきりと。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- メモ: Ideogram: 縦横比 16:9、Magic Prompt はオフ（文字が入らないように）。タイトルの文字は HTML で重ねるので、画像には文字を入れません。

**Ideogram（3.0）用のプロンプト**

```text
A joyful key visual of colorful Japanese wagashi sweets tumbling and bouncing into an open black lacquered jubako box with gold trim: sakura mochi, white daifuku, monaka, dorayaki, green kusamochi, golden kurikinton and pastel konpeito, a few cherry blossom petals floating, warm shoji light in the background, soft cinematic lighting, playful dynamic composition with calm space in the center, appetizing and cute, wide 16:9, absolutely no text, no letters, no logo
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, title, logo, watermark, people, hands
```

**ほかのツール用（共通の英文プロンプト）**

```text
Colorful Japanese sweets (sakura mochi, daifuku, monaka, dorayaki, kusamochi, konpeito) tumbling into an open black lacquered jubako box with gold trim, cherry blossom petals floating, warm shoji light behind, playful dynamic composition with calm space in the centre, appetizing and cute, 16:9, no text.
```
