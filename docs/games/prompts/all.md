# ゲームの画像 ― 全ゲームの生成プロンプト（1 ファイル版）

各ゲームのシート（同じフォルダの <id>.md）を 1 つにまとめたものです。`npm run game-images` が書き出します。

# クレーン横丁 ― 画像の生成プロンプト

ゲーム: `public/games/crane-game/`（12 枚中 0 枚が生成済み、12 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/crane-game/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

ゲームセンターの楽しい明るさ。パステルピンク・ミント・レモン色に、ネオンの紫を差し色に。景品のぬいぐるみはすべてこのゲームのオリジナルキャラクター（既存のキャラクターに似せない）で、丸くてもちもち、刺しゅうのシンプルな顔、やわらかい起毛の質感。箱の絵は文字のない、楽しいパッケージ風のイラスト。文字・ロゴ・実在のブランドは入れない。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/crane-game/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- crane-game` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- crane-game`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/p-usa.webp`](#crane-game-p-usa) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/p-neko.webp`](#crane-game-p-neko) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/p-shiba.webp`](#crane-game-p-shiba) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/p-pen.webp`](#crane-game-p-pen) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/p-hiyo.webp`](#crane-game-p-hiyo) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/p-kuma.webp`](#crane-game-p-kuma) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/p-azarashi.webp`](#crane-game-p-azarashi) | 384×192（透過） | スプライト | ぬいぐるみの山の細長い景品（向きに合わせて回転して表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/p-dachs.webp`](#crane-game-p-dachs) | 384×192（透過） | スプライト | ぬいぐるみの山の細長い景品（向きに合わせて回転して表示） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/box-snack.webp`](#crane-game-box-snack) | 350×140 | カード | 橋渡しの景品の箱の正面・景品棚 | Recraft（V3） |
| ⬜ | [`img/box-robo.webp`](#crane-game-box-robo) | 350×140 | カード | 橋渡しの景品の箱の正面・景品棚 | Recraft（V3） |
| ⬜ | [`img/bg.webp`](#crane-game-bg) | 1600×1000 | 背景 | プレイ画面の背景（機械のまわりに暗くして表示） | Midjourney（v7） |
| ⬜ | [`img/key.webp`](#crane-game-key) | 1600×900 | キービジュアル | タイトル画面の背景 | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="crane-game-p-usa"></a>

## もちうさ

- ファイル: `public/games/crane-game/img/p-usa.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「もちうさ」：白くて丸いうさぎ（短いたれ耳、ピンクのほっぺ）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: ぬいぐるみのセット（p-*）の基準になる 1 枚。最初に作ります。ゲームでは丸い当たり判定に重ねて表示するので、丸いシルエットで画面いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A cute original round plush toy character: a round white bunny with short floppy ears and pink cheeks. Almost perfectly round mochi-like body, simple embroidered face with small dot eyes, soft fleece texture with visible fibers, gentle studio lighting, front view, centered and filling the frame with a small margin. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor, shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original round plush toy: a round white bunny with short floppy ears and pink cheeks. Mochi-like round body, simple embroidered face, soft fleece texture, front view, centred, filling a square image, isolated on a plain white background, no text, original design.
```

<a id="crane-game-p-neko"></a>

## ころねこ

- ファイル: `public/games/crane-game/img/p-neko.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「ころねこ」：丸いオレンジのトラねこ（小さな三角の耳、くるんとしたしっぽ）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#crane-game-p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: p-usa を添付して「同じシリーズのぬいぐるみとして、同じ質感・光・刺しゅうの顔で」と頼むと、そろいます。ゲームでは丸い当たり判定に重ねて表示するので、丸いシルエットで画面いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A cute original round plush toy character: a round orange tabby cat with tiny triangle ears and a curled tail. Almost perfectly round mochi-like body, simple embroidered face with small dot eyes, soft fleece texture with visible fibers, gentle studio lighting, front view, centered and filling the frame with a small margin. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor, shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original round plush toy: a round orange tabby cat with tiny triangle ears and a curled tail. Mochi-like round body, simple embroidered face, soft fleece texture, front view, centred, filling a square image, isolated on a plain white background, no text, original design.
```

<a id="crane-game-p-shiba"></a>

## まめしば

- ファイル: `public/games/crane-game/img/p-shiba.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「まめしば」：丸い柴犬ふうの子犬（クリーム色の口もと、ぴんと立った耳）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#crane-game-p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: p-usa を添付して「同じシリーズのぬいぐるみとして、同じ質感・光・刺しゅうの顔で」と頼むと、そろいます。ゲームでは丸い当たり判定に重ねて表示するので、丸いシルエットで画面いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A cute original round plush toy character: a round little shiba-style dog with cream muzzle and perky ears. Almost perfectly round mochi-like body, simple embroidered face with small dot eyes, soft fleece texture with visible fibers, gentle studio lighting, front view, centered and filling the frame with a small margin. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor, shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original round plush toy: a round little shiba-style dog with cream muzzle and perky ears. Mochi-like round body, simple embroidered face, soft fleece texture, front view, centred, filling a square image, isolated on a plain white background, no text, original design.
```

<a id="crane-game-p-pen"></a>

## ぺんたろう

- ファイル: `public/games/crane-game/img/p-pen.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「ぺんたろう」：丸い紺色のペンギン（白いおなか、小さな黄色いくちばし）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#crane-game-p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: p-usa を添付して「同じシリーズのぬいぐるみとして、同じ質感・光・刺しゅうの顔で」と頼むと、そろいます。ゲームでは丸い当たり判定に重ねて表示するので、丸いシルエットで画面いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A cute original round plush toy character: a round navy penguin with a white belly and a small yellow beak. Almost perfectly round mochi-like body, simple embroidered face with small dot eyes, soft fleece texture with visible fibers, gentle studio lighting, front view, centered and filling the frame with a small margin. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor, shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original round plush toy: a round navy penguin with a white belly and a small yellow beak. Mochi-like round body, simple embroidered face, soft fleece texture, front view, centred, filling a square image, isolated on a plain white background, no text, original design.
```

<a id="crane-game-p-hiyo"></a>

## ひよこまる

- ファイル: `public/games/crane-game/img/p-hiyo.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「ひよこまる」：丸いふわふわの黄色いひよこ（頭にちょこんと毛）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#crane-game-p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: p-usa を添付して「同じシリーズのぬいぐるみとして、同じ質感・光・刺しゅうの顔で」と頼むと、そろいます。ゲームでは丸い当たり判定に重ねて表示するので、丸いシルエットで画面いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A cute original round plush toy character: a round fluffy yellow chick with a tiny tuft on its head. Almost perfectly round mochi-like body, simple embroidered face with small dot eyes, soft fleece texture with visible fibers, gentle studio lighting, front view, centered and filling the frame with a small margin. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor, shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original round plush toy: a round fluffy yellow chick with a tiny tuft on its head. Mochi-like round body, simple embroidered face, soft fleece texture, front view, centred, filling a square image, isolated on a plain white background, no text, original design.
```

<a id="crane-game-p-kuma"></a>

## くまだんご

- ファイル: `public/games/crane-game/img/p-kuma.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「くまだんご」：丸い茶色の子ぐま（ベージュの鼻先、小さな丸い耳）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#crane-game-p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: p-usa を添付して「同じシリーズのぬいぐるみとして、同じ質感・光・刺しゅうの顔で」と頼むと、そろいます。ゲームでは丸い当たり判定に重ねて表示するので、丸いシルエットで画面いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A cute original round plush toy character: a round brown bear cub with a beige snout and small round ears. Almost perfectly round mochi-like body, simple embroidered face with small dot eyes, soft fleece texture with visible fibers, gentle studio lighting, front view, centered and filling the frame with a small margin. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor, shadow on background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original round plush toy: a round brown bear cub with a beige snout and small round ears. Mochi-like round body, simple embroidered face, soft fleece texture, front view, centred, filling a square image, isolated on a plain white background, no text, original design.
```

<a id="crane-game-p-azarashi"></a>

## ねそべりアザラシ

- ファイル: `public/games/crane-game/img/p-azarashi.webp`（384×192px・背景は透過）
- 用途: ぬいぐるみの山の細長い景品（向きに合わせて回転して表示）
- 内容: オリジナルの細長いぬいぐるみ「ねそべりアザラシ」：寝そべった細長いアザラシの赤ちゃん（淡いグレーにやわらかな斑点、頭は左）。横長 2:1 の画面いっぱいに、真横に寝そべった姿。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#crane-game-p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: ゲームでは体の向きに合わせて回転させて描きます。頭を左、体を水平に、横長いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, wide 1536×768 (2:1). A cute original plush toy: a long lying-down baby seal plush, pale gray with soft spots, stretched out sideways with its head on the left. Same series and the same soft fleece texture, embroidered simple face and lighting as the attached round plush. Seen from the front, the long body lies horizontally and fills the frame edge to edge. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original long plush toy: a long lying-down baby seal plush, pale gray with soft spots, stretched out sideways with its head on the left. Soft fleece, simple embroidered face, lying horizontally and filling a 2:1 image, isolated on a plain white background, no text.
```

<a id="crane-game-p-dachs"></a>

## のびーるダックス

- ファイル: `public/games/crane-game/img/p-dachs.webp`（384×192px・背景は透過）
- 用途: ぬいぐるみの山の細長い景品（向きに合わせて回転して表示）
- 内容: オリジナルの細長いぬいぐるみ「のびーるダックス」：寝そべった細長いダックスフント（キャラメル色、たれ耳、頭は左）。横長 2:1 の画面いっぱいに、真横に寝そべった姿。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#crane-game-p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: ゲームでは体の向きに合わせて回転させて描きます。頭を左、体を水平に、横長いっぱいに。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, wide 1536×768 (2:1). A cute original plush toy: a long dachshund plush lying flat, caramel brown with floppy ears, stretched out sideways with its head on the left. Same series and the same soft fleece texture, embroidered simple face and lighting as the attached round plush. Seen from the front, the long body lies horizontally and fills the frame edge to edge. Original design, not resembling any existing character or brand. No text, no tags, no background.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, brand tag, existing character, background, floor
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute original long plush toy: a long dachshund plush lying flat, caramel brown with floppy ears, stretched out sideways with its head on the left. Soft fleece, simple embroidered face, lying horizontally and filling a 2:1 image, isolated on a plain white background, no text.
```

<a id="crane-game-box-snack"></a>

## 箱の絵：おかしの大箱

- ファイル: `public/games/crane-game/img/box-snack.webp`（350×140px）
- 用途: 橋渡しの景品の箱の正面・景品棚
- 内容: 大きなお菓子の詰め合わせの箱の正面のパッケージ絵。キャンディ・クッキー・チョコ・グミが楽しくはじける構図、オレンジと黄色。文字なし。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）
- メモ: Recraft: Vector illustration、縦横比 5:2。箱の正面（横長）にそのまま貼ります。文字は入れません。

**Recraft（V3）用のプロンプト**

```text
Flat vector package illustration for the front of a big assorted sweets box: colorful candies, cookies, chocolate pieces and gummies bursting out joyfully from the center, radiating stripes, bright orange and lemon yellow palette with pink accents, playful arcade prize style, clean shapes, fills the whole wide 5:2 frame, no text, no letters, no logo
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, brand names, barcode
```

**ほかのツール用（共通の英文プロンプト）**

```text
A flat vector package illustration for the front of a sweets box: candies, cookies, chocolate and gummies bursting from the centre over radiating stripes, orange and yellow with pink accents, playful, filling a 5:2 frame, no text.
```

<a id="crane-game-box-robo"></a>

## 箱の絵：ロボットのおもちゃ

- ファイル: `public/games/crane-game/img/box-robo.webp`（350×140px）
- 用途: 橋渡しの景品の箱の正面・景品棚
- 内容: オリジナルのかわいいブリキ風ロボットのおもちゃの箱の正面のパッケージ絵。青と水色、星とギア。文字なし。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）
- 参照画像: [`img/box-snack.webp`](#crane-game-box-snack) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: box-snack と同じ Recraft のスタイルで。縦横比 5:2。

**Recraft（V3）用のプロンプト**

```text
Flat vector package illustration for the front of a toy box: a cute original retro tin-toy robot with round eyes and antenna waving, stars, gears and a starburst behind it, sky blue and cobalt palette with yellow accents, playful arcade prize style, same flat style as the attached sweets box art, fills the whole wide 5:2 frame, no text, no letters, no logo
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, existing robot characters, brand names
```

**ほかのツール用（共通の英文プロンプト）**

```text
A flat vector package illustration for a toy box front: a cute original retro tin robot waving, stars and gears behind it, blue palette with yellow accents, playful, filling a 5:2 frame, no text.
```

<a id="crane-game-bg"></a>

## 背景：夜のゲームセンター

- ファイル: `public/games/crane-game/img/bg.webp`（1600×1000px）
- 用途: プレイ画面の背景（機械のまわりに暗くして表示）
- 内容: にぎやかなゲームセンターの店内。クレーンゲームの機械がずらりと並び、ネオンのピンクと水色の光、床に反射。手前の中央は機械を重ねるのでぼかして暗めに。人物なし、文字・ロゴなし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ゲームでは暗く重ね、中央に機械を描きます。

**Midjourney（v7）用のプロンプト**

```text
interior of a cozy Japanese arcade at night, rows of colorful claw crane machines glowing with pink and cyan neon light, glossy floor reflections, soft bokeh, dreamy pastel and neon purple palette, blurred and darker in the center, no people, no text, no logos, no signage --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, signage, people, brand names
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cozy Japanese arcade at night: rows of claw crane machines glowing with pink and cyan neon, glossy floor reflections, soft bokeh, pastel and neon purple palette, blurred and darker in the centre, no people, no text. 16:10.
```

<a id="crane-game-key"></a>

## キービジュアル：ぬいぐるみの山とアーム

- ファイル: `public/games/crane-game/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景
- 内容: ガラス越しに見たクレーンゲームの中。まんまるのオリジナルぬいぐるみ（うさぎ・ねこ・ペンギン・ひよこ・くま）がこんもり積まれ、上から金色のアームが下りてくる瞬間。パステルとネオンの光。中央にタイトルを重ねるので、中央は少し暗めにすっきりと。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: タイトルの文字は HTML で重ねるので入れません。ぬいぐるみは p-* と似た雰囲気にすると、ゲームとつながります。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
view through the glass of a claw crane game machine, a soft mountain of cute round original plush toys (white bunny, orange cat, navy penguin, yellow chick, brown bear), a shiny golden claw descending from above, pastel pink and mint interior with neon purple glow, sparkles, joyful and dreamy, calm darker space in the center for a title, no text, no logos --niji 6 --ar 16:9
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, existing characters, people, hands
```

**ほかのツール用（共通の英文プロンプト）**

```text
View through the glass of a claw crane machine: a soft mountain of cute round original plush toys (bunny, cat, penguin, chick, bear), a golden claw descending, pastel pink and mint interior with neon purple glow, sparkles, calm space in the centre, no text. 16:9, anime-like illustration.
```


---

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
| ⬜ | [`img/key-visual.webp`](#daifugo-key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（暗くして、上にタイトルの文字と設定を重ねます） | Midjourney（v7） |
| ⬜ | [`img/bg-table.webp`](#daifugo-bg-table) | 1600×900 | 背景 | 対局画面の背景（全面。上に札と情報を重ね、革命中は紫に色を変えて暗くします） | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/cpu-hayate-normal.webp`](#daifugo-cpu-hayate-normal) | 512×512 | 人物 | CPU「ハヤテ」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-hayate-happy.webp`](#daifugo-cpu-hayate-happy) | 512×512 | 人物 | CPU「ハヤテ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-hayate-angry.webp`](#daifugo-cpu-hayate-angry) | 512×512 | 人物 | CPU「ハヤテ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-shion-normal.webp`](#daifugo-cpu-shion-normal) | 512×512 | 人物 | CPU「シオン」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-shion-happy.webp`](#daifugo-cpu-shion-happy) | 512×512 | 人物 | CPU「シオン」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-shion-angry.webp`](#daifugo-cpu-shion-angry) | 512×512 | 人物 | CPU「シオン」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-gonzo-normal.webp`](#daifugo-cpu-gonzo-normal) | 512×512 | 人物 | CPU「ゴンゾウ」の顔（ふつう）。卓の情報パネル（丸く切り抜き）と結果画面・タイトルの紹介 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-gonzo-happy.webp`](#daifugo-cpu-gonzo-happy) | 512×512 | 人物 | CPU「ゴンゾウ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cpu-gonzo-angry.webp`](#daifugo-cpu-gonzo-angry) | 512×512 | 人物 | CPU「ゴンゾウ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="daifugo-key-visual"></a>

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

<a id="daifugo-bg-table"></a>

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

<a id="daifugo-cpu-hayate-normal"></a>

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

<a id="daifugo-cpu-hayate-happy"></a>

## ハヤテ：うれしい

- ファイル: `public/games/daifugo/img/cpu-hayate-happy.webp`（512×512px）
- 用途: CPU「ハヤテ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 商店街の配達少年ハヤテ（速攻派）。つんつんの茶髪に後ろ向きのオレンジの帽子、紺のウインドブレーカー、頬にばんそうこう。うれしい表情（得意げな満面の笑み）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-hayate-normal.webp`](#daifugo-cpu-hayate-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="daifugo-cpu-hayate-angry"></a>

## ハヤテ：くやしい

- ファイル: `public/games/daifugo/img/cpu-hayate-angry.webp`（512×512px）
- 用途: CPU「ハヤテ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 商店街の配達少年ハヤテ（速攻派）。つんつんの茶髪に後ろ向きのオレンジの帽子、紺のウインドブレーカー、頬にばんそうこう。くやしい表情（歯を食いしばる、汗）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-hayate-normal.webp`](#daifugo-cpu-hayate-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="daifugo-cpu-shion-normal"></a>

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

<a id="daifugo-cpu-shion-happy"></a>

## シオン：うれしい

- ファイル: `public/games/daifugo/img/cpu-shion-happy.webp`（512×512px）
- 用途: CPU「シオン」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 眼鏡の大学生シオン（慎重派）。低い位置でまとめた紫がかった長い黒髪、丸い銀縁眼鏡、ラベンダーのカーディガン。うれしい表情（得意げな満面の笑み）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-shion-normal.webp`](#daifugo-cpu-shion-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="daifugo-cpu-shion-angry"></a>

## シオン：くやしい

- ファイル: `public/games/daifugo/img/cpu-shion-angry.webp`（512×512px）
- 用途: CPU「シオン」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 眼鏡の大学生シオン（慎重派）。低い位置でまとめた紫がかった長い黒髪、丸い銀縁眼鏡、ラベンダーのカーディガン。くやしい表情（歯を食いしばる、汗）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-shion-normal.webp`](#daifugo-cpu-shion-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="daifugo-cpu-gonzo-normal"></a>

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

<a id="daifugo-cpu-gonzo-happy"></a>

## ゴンゾウ：うれしい

- ファイル: `public/games/daifugo/img/cpu-gonzo-happy.webp`（512×512px）
- 用途: CPU「ゴンゾウ」の顔（うれしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 喫茶店のマスター・ゴンゾウ（一発逆転派）。太い黒ひげ、短い白髪まじりの髪、白いシャツに深緑のエプロン、肩にタオル。うれしい表情（得意げな満面の笑み）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-gonzo-normal.webp`](#daifugo-cpu-gonzo-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="daifugo-cpu-gonzo-angry"></a>

## ゴンゾウ：くやしい

- ファイル: `public/games/daifugo/img/cpu-gonzo-angry.webp`（512×512px）
- 用途: CPU「ゴンゾウ」の顔（くやしい）。卓の情報パネル（丸く切り抜き）と結果画面
- 内容: 喫茶店のマスター・ゴンゾウ（一発逆転派）。太い黒ひげ、短い白髪まじりの髪、白いシャツに深緑のエプロン、肩にタオル。くやしい表情（歯を食いしばる、汗）。アニメ調のバストアップ、顔が中央、無地の暗い背景
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）
- 参照画像: [`img/cpu-gonzo-normal.webp`](#daifugo-cpu-gonzo-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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


---

# ことば花火 ― 打って打ち上げるタイピング ― 画像の生成プロンプト

ゲーム: `public/games/hanabi-typing/`（5 枚中 0 枚が生成済み、5 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/hanabi-typing/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夏の夜祭りの川辺。深い藍色の夜空、提灯の暖かい橙の灯り、川面の映り込み。絵はアニメ映画の背景のような、空気感のある細やかな描写。花火そのものはゲームがコードで描くので、背景には描かない（キービジュアルだけは花火あり）。キャラクターはオリジナルの花火師見習い「ひばな」で、明るく親しみやすいアニメ調。どの画像にも文字・看板の文字・ロゴは入れない。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/hanabi-typing/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- hanabi-typing` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- hanabi-typing`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/bg-river.webp`](#hanabi-typing-bg-river) | 1600×900 | 背景 | プレイ画面の背景（下側に表示。空の上半分はゲームが暗く重ねて花火を描く） | Midjourney（v7） |
| ⬜ | [`img/key.webp`](#hanabi-typing-key) | 1600×900 | キービジュアル | タイトル画面の背景（中央にタイトルのカードを重ねるので、主役の花火は上寄り・人物は左右の端に） | Ideogram（3.0） |
| ⬜ | [`img/mascot-normal.webp`](#hanabi-typing-mascot-normal) | 480×640（透過） | 人物 | タイトル・プレイ中（PC）・結果の花火師見習いのキャラクター（表情の基準） | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/mascot-cheer.webp`](#hanabi-typing-mascot-cheer) | 480×640（透過） | 人物 | コンボのときと、成績のよい結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/mascot-oops.webp`](#hanabi-typing-mascot-oops) | 480×640（透過） | 人物 | 打ちまちがえたときに一瞬だけ表示 | Gemini（画像生成 / Imagen・Nano Banana） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="hanabi-typing-bg-river"></a>

## 背景：夜祭りの川辺

- ファイル: `public/games/hanabi-typing/img/bg-river.webp`（1600×900px）
- 用途: プレイ画面の背景（下側に表示。空の上半分はゲームが暗く重ねて花火を描く）
- 内容: 夏祭りの夜の広い川。手前に土手と、提灯の灯りが続く屋台の列、浴衣姿の見物客の小さなシルエット。川面に提灯の光が映る。画面の上 6 割は花火のない、星のある深い藍色の夜空として空けておく。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 空に花火を描かないこと（ゲームが描きます）。提灯や看板に文字が出たら消してください。

**Midjourney（v7）用のプロンプト**

```text
wide summer night riverside festival in Japan, calm river across the lower third reflecting warm lantern light, a grassy embankment with a long row of food stalls lit by red and white paper lanterns, tiny silhouettes of people in yukata watching the sky, distant low town lights and a small bridge, the upper sixty percent is an empty deep indigo night sky with faint stars and no fireworks, atmospheric anime film background, painterly, soft glow --ar 16:9 --v 7 --style raw --no fireworks, text, signs, letters, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
fireworks, text, kanji on lanterns or signs, logo, watermark, bright sky
```

**ほかのツール用（共通の英文プロンプト）**

```text
A wide summer-night riverside festival in Japan. A calm river across the lower third reflects warm lantern light; a grassy embankment carries a long row of food stalls lit by red and white paper lanterns, with tiny silhouettes of people in yukata looking up. Distant low town lights and a small bridge. The upper 60% is an empty deep indigo night sky with faint stars and no fireworks. Atmospheric anime-film background, painterly, soft glow. 16:9, no text.
```

<a id="hanabi-typing-key"></a>

## キービジュアル：夜空の大輪と見上げる二人

- ファイル: `public/games/hanabi-typing/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景（中央にタイトルのカードを重ねるので、主役の花火は上寄り・人物は左右の端に）
- 内容: 夜空いっぱいに開いた大きな菊の花火と、しだれ柳の金色の光。下の端に、川辺の土手から見上げる浴衣の二人の後ろ姿（小さく、画面の左下）。中央はタイトルのカードが乗るので落ち着いた夜空。ポスターのような構図。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- メモ: Ideogram の「Magic Prompt」はオフにして、文字が入らないようにします。スマホ縦では中央付近だけが見えます。

**Ideogram（3.0）用のプロンプト**

```text
Poster-like illustration of a summer night sky over a Japanese river: one huge chrysanthemum firework in orange and gold blooming in the upper part, golden willow fireworks drooping at the sides, small pink peony fireworks in the distance. In the bottom-left corner, two small figures in yukata seen from behind sitting on a grassy riverbank, looking up. Calm, darker space in the center of the image for a title card. Rich indigo sky, glowing reflections on the water, anime film style, cinematic. Aspect ratio 16:9. No text, no letters, no logo.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, watermark, crowds, faces visible
```

**ほかのツール用（共通の英文プロンプト）**

```text
A poster-like illustration of a summer night over a Japanese river: one huge orange-and-gold chrysanthemum firework blooming high in the sky, golden willow fireworks drooping at the sides, small pink peony fireworks far away. In the bottom-left corner, two small figures in yukata seen from behind sit on the grassy bank looking up. Keep the center calm and darker for a title card. Rich indigo sky, glowing reflections on the water, anime-film style. 16:9, no text.
```

<a id="hanabi-typing-mascot-normal"></a>

## ひばな（ふつう）

- ファイル: `public/games/hanabi-typing/img/mascot-normal.webp`（480×640px・背景は透過）
- 用途: タイトル・プレイ中（PC）・結果の花火師見習いのキャラクター（表情の基準）
- 内容: オリジナルの花火師見習い「ひばな」。16 歳くらいの元気な女の子。藍色の法被（背中や襟に文字は入れない）に、橙色の手ぬぐいを頭に巻き、短いポニーテール。両手で小さな紙の花火玉を抱え、にっこり笑う。膝から上、正面やや斜め。白い無地の背景。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- メモ: 3 枚（ふつう・よろこび・しまった）は同じ Gemini の会話で作ります。まずこの画像を作り、ほかの 2 枚はこの画像を添付して「同じ人物・同じ服・同じ画風のまま、表情とポーズだけを変えて」と頼みます。白い背景は自動で切り抜かれます。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Create an original anime-style character illustration: a cheerful 16-year-old girl who is an apprentice fireworks maker. She wears an indigo happi coat with no lettering or symbols, an orange tenugui cloth tied around her head, a short ponytail, and holds a small round paper firework shell with both hands, smiling warmly. Knee-up view, facing slightly to the side, clean line art with soft cel shading, bright friendly colors. Plain pure white background, no shadow on the background, no text. Portrait orientation 3:4.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters or kanji on the coat, logo, background scenery, extra fingers
```

**ほかのツール用（共通の英文プロンプト）**

```text
An original anime-style character: a cheerful 16-year-old girl, an apprentice fireworks maker, in an indigo happi coat with no lettering, an orange tenugui tied around her head and a short ponytail, holding a small round paper firework shell with both hands and smiling. Knee-up, slightly turned, clean line art with soft cel shading. Plain pure white background, no text. Portrait 3:4.
```

<a id="hanabi-typing-mascot-cheer"></a>

## ひばな（よろこび）

- ファイル: `public/games/hanabi-typing/img/mascot-cheer.webp`（480×640px・背景は透過）
- 用途: コンボのときと、成績のよい結果画面
- 内容: 同じ「ひばな」が、片手を高く突き上げて大喜びしている。目を細めた満面の笑顔、もう片方の手に花火玉。白い無地の背景。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/mascot-normal.webp`](#hanabi-typing-mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: mascot-normal の画像を添付して作ります。頭の高さと体の大きさを normal とそろえると、切り替えたときに自然です。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Using the attached image of the character, keep exactly the same girl, outfit, colors and drawing style, and change only her pose and expression: she thrusts one fist high in the air with a big joyful grin and closed happy eyes, holding the paper firework shell in the other hand. Knee-up, plain pure white background, no text. Portrait orientation 3:4.
```

**ネガティブプロンプト（入れたくないもの）**

```text
different character, different outfit, text, background scenery
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same apprentice fireworks-maker girl (indigo happi coat with no lettering, orange tenugui headband, short ponytail), now thrusting one fist high in the air with a big joyful grin and happy closed eyes, holding the paper firework shell in the other hand. Same art style as the reference. Plain pure white background, no text. Portrait 3:4.
```

<a id="hanabi-typing-mascot-oops"></a>

## ひばな（しまった）

- ファイル: `public/games/hanabi-typing/img/mascot-oops.webp`（480×640px・背景は透過）
- 用途: 打ちまちがえたときに一瞬だけ表示
- 内容: 同じ「ひばな」が、花火玉を落としそうになって慌てている。片目をつぶり、舌を少し出した「しまった」の表情。汗のしずく。白い無地の背景。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/mascot-normal.webp`](#hanabi-typing-mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: mascot-normal の画像を添付して作ります。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Using the attached image of the character, keep exactly the same girl, outfit, colors and drawing style, and change only her pose and expression: she is fumbling the paper firework shell as if she almost dropped it, one eye shut, tongue slightly out in a playful oops face, a small sweat drop near her head. Knee-up, plain pure white background, no text. Portrait orientation 3:4.
```

**ネガティブプロンプト（入れたくないもの）**

```text
different character, different outfit, crying, text, background scenery
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same apprentice fireworks-maker girl (indigo happi coat with no lettering, orange tenugui headband, short ponytail), fumbling the paper firework shell as if she almost dropped it, one eye shut and tongue slightly out in a playful oops face, a small sweat drop. Same art style as the reference. Plain pure white background, no text. Portrait 3:4.
```


---

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
| ⬜ | [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) | 300×480 | カード | 札の絵柄（1月・松の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-01-2.webp`](#hanafuda-koikoi-card-01-2) | 300×480 | カード | 札の絵柄（1月・松の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-01-3.webp`](#hanafuda-koikoi-card-01-3) | 300×480 | カード | 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-01-4.webp`](#hanafuda-koikoi-card-01-4) | 300×480 | カード | 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-1.webp`](#hanafuda-koikoi-card-02-1) | 300×480 | カード | 札の絵柄（2月・梅のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-2.webp`](#hanafuda-koikoi-card-02-2) | 300×480 | カード | 札の絵柄（2月・梅の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-3.webp`](#hanafuda-koikoi-card-02-3) | 300×480 | カード | 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-02-4.webp`](#hanafuda-koikoi-card-02-4) | 300×480 | カード | 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-1.webp`](#hanafuda-koikoi-card-03-1) | 300×480 | カード | 札の絵柄（3月・桜の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-2.webp`](#hanafuda-koikoi-card-03-2) | 300×480 | カード | 札の絵柄（3月・桜の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-3.webp`](#hanafuda-koikoi-card-03-3) | 300×480 | カード | 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-03-4.webp`](#hanafuda-koikoi-card-03-4) | 300×480 | カード | 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-1.webp`](#hanafuda-koikoi-card-04-1) | 300×480 | カード | 札の絵柄（4月・藤のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-2.webp`](#hanafuda-koikoi-card-04-2) | 300×480 | カード | 札の絵柄（4月・藤の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-3.webp`](#hanafuda-koikoi-card-04-3) | 300×480 | カード | 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-04-4.webp`](#hanafuda-koikoi-card-04-4) | 300×480 | カード | 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-1.webp`](#hanafuda-koikoi-card-05-1) | 300×480 | カード | 札の絵柄（5月・菖蒲のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-2.webp`](#hanafuda-koikoi-card-05-2) | 300×480 | カード | 札の絵柄（5月・菖蒲の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-3.webp`](#hanafuda-koikoi-card-05-3) | 300×480 | カード | 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-05-4.webp`](#hanafuda-koikoi-card-05-4) | 300×480 | カード | 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-1.webp`](#hanafuda-koikoi-card-06-1) | 300×480 | カード | 札の絵柄（6月・牡丹のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-2.webp`](#hanafuda-koikoi-card-06-2) | 300×480 | カード | 札の絵柄（6月・牡丹の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-3.webp`](#hanafuda-koikoi-card-06-3) | 300×480 | カード | 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-06-4.webp`](#hanafuda-koikoi-card-06-4) | 300×480 | カード | 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-1.webp`](#hanafuda-koikoi-card-07-1) | 300×480 | カード | 札の絵柄（7月・萩のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-2.webp`](#hanafuda-koikoi-card-07-2) | 300×480 | カード | 札の絵柄（7月・萩の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-3.webp`](#hanafuda-koikoi-card-07-3) | 300×480 | カード | 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-07-4.webp`](#hanafuda-koikoi-card-07-4) | 300×480 | カード | 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-1.webp`](#hanafuda-koikoi-card-08-1) | 300×480 | カード | 札の絵柄（8月・芒の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-2.webp`](#hanafuda-koikoi-card-08-2) | 300×480 | カード | 札の絵柄（8月・芒のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-3.webp`](#hanafuda-koikoi-card-08-3) | 300×480 | カード | 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-08-4.webp`](#hanafuda-koikoi-card-08-4) | 300×480 | カード | 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-1.webp`](#hanafuda-koikoi-card-09-1) | 300×480 | カード | 札の絵柄（9月・菊のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-2.webp`](#hanafuda-koikoi-card-09-2) | 300×480 | カード | 札の絵柄（9月・菊の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-3.webp`](#hanafuda-koikoi-card-09-3) | 300×480 | カード | 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-09-4.webp`](#hanafuda-koikoi-card-09-4) | 300×480 | カード | 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-1.webp`](#hanafuda-koikoi-card-10-1) | 300×480 | カード | 札の絵柄（10月・紅葉のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-2.webp`](#hanafuda-koikoi-card-10-2) | 300×480 | カード | 札の絵柄（10月・紅葉の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-3.webp`](#hanafuda-koikoi-card-10-3) | 300×480 | カード | 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-10-4.webp`](#hanafuda-koikoi-card-10-4) | 300×480 | カード | 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-1.webp`](#hanafuda-koikoi-card-11-1) | 300×480 | カード | 札の絵柄（11月・柳の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-2.webp`](#hanafuda-koikoi-card-11-2) | 300×480 | カード | 札の絵柄（11月・柳のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-3.webp`](#hanafuda-koikoi-card-11-3) | 300×480 | カード | 札の絵柄（11月・柳の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-11-4.webp`](#hanafuda-koikoi-card-11-4) | 300×480 | カード | 札の絵柄（11月・柳のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-1.webp`](#hanafuda-koikoi-card-12-1) | 300×480 | カード | 札の絵柄（12月・桐の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-2.webp`](#hanafuda-koikoi-card-12-2) | 300×480 | カード | 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-3.webp`](#hanafuda-koikoi-card-12-3) | 300×480 | カード | 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/card-12-4.webp`](#hanafuda-koikoi-card-12-4) | 300×480 | カード | 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます | Midjourney（v7） |
| ⬜ | [`img/key-visual.webp`](#hanafuda-koikoi-key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（暗くして上にタイトルの文字と設定を重ねます） | Ideogram（3.0） |
| ⬜ | [`img/bg-table.webp`](#hanafuda-koikoi-bg-table) | 1600×900 | 背景 | 対局画面の背景（全面。上に札と情報パネルを重ね、周りを暗くします） | Adobe Firefly（Image 4） |
| ⬜ | [`img/cpu-koume.webp`](#hanafuda-koikoi-cpu-koume) | 512×512 | 人物 | 対戦相手「小梅」（やさしい）の顔。タイトルの相手選びと対局中の情報パネル（角丸の正方形に切り抜き） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-ryusai.webp`](#hanafuda-koikoi-cpu-ryusai) | 512×512 | 人物 | 対戦相手「柳斎」（ふつう）の顔。タイトルの相手選びと対局中の情報パネル | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-sogetsu.webp`](#hanafuda-koikoi-cpu-sogetsu) | 512×512 | 人物 | 対戦相手「宗月」（つよい）の顔。タイトルの相手選びと対局中の情報パネル | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="hanafuda-koikoi-card-01-1"></a>

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

<a id="hanafuda-koikoi-card-01-2"></a>

## 1月 松に赤短（赤短）

- ファイル: `public/games/hanafuda-koikoi/img/card-01-2.webp`（300×480px）
- 用途: 札の絵柄（1月・松の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 1月（松）の赤短札：松の枝に、文字のない赤い短冊がかかる。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-01-3"></a>

## 1月 松のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-01-3.webp`（300×480px）
- 用途: 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 1月（松）のカス札：赤い空を背にした松の枝（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-01-4"></a>

## 1月 松のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-01-4.webp`（300×480px）
- 用途: 札の絵柄（1月・松のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 1月（松）のカス札：赤い空を背にした松の枝（カス・その 2、枝ぶりを変える）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-02-1"></a>

## 2月 梅に鶯（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-1.webp`（300×480px）
- 用途: 札の絵柄（2月・梅のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）のタネ札：紅梅の枝にとまる鶯。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-02-2"></a>

## 2月 梅に赤短（赤短）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-2.webp`（300×480px）
- 用途: 札の絵柄（2月・梅の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）の赤短札：紅梅の枝に、文字のない赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-02-3"></a>

## 2月 梅のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-3.webp`（300×480px）
- 用途: 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）のカス札：紅梅の枝（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-02-4"></a>

## 2月 梅のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-02-4.webp`（300×480px）
- 用途: 札の絵柄（2月・梅のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 2月（梅）のカス札：紅梅の枝（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-03-1"></a>

## 3月 桜に幕（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-1.webp`（300×480px）
- 用途: 札の絵柄（3月・桜の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）の光札：満開の桜と、張りわたした花見の幕。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-03-2"></a>

## 3月 桜に赤短（赤短）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-2.webp`（300×480px）
- 用途: 札の絵柄（3月・桜の赤短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）の赤短札：桜の花に、文字のない赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-03-3"></a>

## 3月 桜のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-3.webp`（300×480px）
- 用途: 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）のカス札：桜の花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-03-4"></a>

## 3月 桜のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-03-4.webp`（300×480px）
- 用途: 札の絵柄（3月・桜のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 3月（桜）のカス札：桜の花（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-04-1"></a>

## 4月 藤に杜鵑（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-1.webp`（300×480px）
- 用途: 札の絵柄（4月・藤のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）のタネ札：垂れ下がる藤と、三日月の前を飛ぶ杜鵑（ほととぎす）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-04-2"></a>

## 4月 藤に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-2.webp`（300×480px）
- 用途: 札の絵柄（4月・藤の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）の短冊札：藤の花房に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-04-3"></a>

## 4月 藤のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-3.webp`（300×480px）
- 用途: 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）のカス札：藤の花房（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-04-4"></a>

## 4月 藤のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-04-4.webp`（300×480px）
- 用途: 札の絵柄（4月・藤のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 4月（藤）のカス札：藤の花房（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-05-1"></a>

## 5月 菖蒲に八橋（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-1.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）のタネ札：菖蒲（かきつばた）と八橋（ジグザグの板の橋）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-05-2"></a>

## 5月 菖蒲に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-2.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）の短冊札：菖蒲の花に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-05-3"></a>

## 5月 菖蒲のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-3.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）のカス札：菖蒲の花と葉（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-05-4"></a>

## 5月 菖蒲のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-05-4.webp`（300×480px）
- 用途: 札の絵柄（5月・菖蒲のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 5月（菖蒲）のカス札：菖蒲の花と葉（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-06-1"></a>

## 6月 牡丹に蝶（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-1.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）のタネ札：大輪の牡丹と、舞う二匹の蝶。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-06-2"></a>

## 6月 牡丹に青短（青短）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-2.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）の青短札：牡丹に、文字のない青い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-06-3"></a>

## 6月 牡丹のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-3.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）のカス札：牡丹の花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-06-4"></a>

## 6月 牡丹のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-06-4.webp`（300×480px）
- 用途: 札の絵柄（6月・牡丹のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 6月（牡丹）のカス札：牡丹の花（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-07-1"></a>

## 7月 萩に猪（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-1.webp`（300×480px）
- 用途: 札の絵柄（7月・萩のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）のタネ札：しだれる萩の下を駆ける猪。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-07-2"></a>

## 7月 萩に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-2.webp`（300×480px）
- 用途: 札の絵柄（7月・萩の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）の短冊札：萩に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-07-3"></a>

## 7月 萩のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-3.webp`（300×480px）
- 用途: 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）のカス札：萩の枝（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-07-4"></a>

## 7月 萩のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-07-4.webp`（300×480px）
- 用途: 札の絵柄（7月・萩のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 7月（萩）のカス札：萩の枝（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-08-1"></a>

## 8月 芒に月（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-1.webp`（300×480px）
- 用途: 札の絵柄（8月・芒の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）の光札：芒の丘の上にのぼる満月、赤い空。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-08-2"></a>

## 8月 芒に雁（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-2.webp`（300×480px）
- 用途: 札の絵柄（8月・芒のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）のタネ札：芒の丘の上を渡る三羽の雁。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-08-3"></a>

## 8月 芒のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-3.webp`（300×480px）
- 用途: 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）のカス札：芒の丘（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-08-4"></a>

## 8月 芒のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-08-4.webp`（300×480px）
- 用途: 札の絵柄（8月・芒のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 8月（芒）のカス札：芒の丘（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-09-1"></a>

## 9月 菊に盃（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-1.webp`（300×480px）
- 用途: 札の絵柄（9月・菊のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）のタネ札：黄色い菊と、台にのった朱塗りの盃（盃に文字は入れない）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-09-2"></a>

## 9月 菊に青短（青短）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-2.webp`（300×480px）
- 用途: 札の絵柄（9月・菊の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）の青短札：菊に、文字のない青い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-09-3"></a>

## 9月 菊のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-3.webp`（300×480px）
- 用途: 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）のカス札：菊の花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-09-4"></a>

## 9月 菊のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-09-4.webp`（300×480px）
- 用途: 札の絵柄（9月・菊のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 9月（菊）のカス札：菊の花（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-10-1"></a>

## 10月 紅葉に鹿（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-1.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）のタネ札：紅葉の下で振り返る鹿。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-10-2"></a>

## 10月 紅葉に青短（青短）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-2.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉の青短札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）の青短札：紅葉に、文字のない青い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-10-3"></a>

## 10月 紅葉のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-3.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）のカス札：紅葉（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-10-4"></a>

## 10月 紅葉のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-10-4.webp`（300×480px）
- 用途: 札の絵柄（10月・紅葉のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 10月（紅葉）のカス札：紅葉（カス・その 2）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-11-1"></a>

## 11月 柳に小野道風（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-1.webp`（300×480px）
- 用途: 札の絵柄（11月・柳の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）の光札：雨の中、傘をさした平安装束の人物が、柳に飛びつく蛙を見ている（柳の光札の伝統的な図柄）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-11-2"></a>

## 11月 柳に燕（タネ）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-2.webp`（300×480px）
- 用途: 札の絵柄（11月・柳のタネ札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）のタネ札：雨の柳と、飛ぶ燕と小川。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-11-3"></a>

## 11月 柳に短冊（短冊）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-3.webp`（300×480px）
- 用途: 札の絵柄（11月・柳の短冊札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）の短冊札：雨の柳に、無地の赤い短冊。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-11-4"></a>

## 11月 柳のカス（雷）（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-11-4.webp`（300×480px）
- 用途: 札の絵柄（11月・柳のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 11月（柳）のカス札：雷の札：黒い雷雲と雷太鼓、赤い稲光（柳のカス・鬼札の図柄）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-12-1"></a>

## 12月 桐に鳳凰（光）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-1.webp`（300×480px）
- 用途: 札の絵柄（12月・桐の光札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）の光札：桐の葉と花の向こうに舞い上がる鳳凰。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-12-2"></a>

## 12月 桐のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-2.webp`（300×480px）
- 用途: 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）のカス札：桐の葉と花（カス・その 1）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-12-3"></a>

## 12月 桐のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-3.webp`（300×480px）
- 用途: 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）のカス札：桐の葉と花（カス・その 2、下に黄色い帯。文字は入れない）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-card-12-4"></a>

## 12月 桐のカス（カス）

- ファイル: `public/games/hanafuda-koikoi/img/card-12-4.webp`（300×480px）
- 用途: 札の絵柄（12月・桐のカス札）。ゲームが左上に月の数字、下に札の種類の印を重ねて描きます
- 内容: 12月（桐）のカス札：桐の葉と花（カス・その 3）。木版画風の平らな色面と黒い輪郭線、縦長の札いっぱいの構図、文字なし
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/card-01-1.webp`](#hanafuda-koikoi-card-01-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-key-visual"></a>

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

<a id="hanafuda-koikoi-bg-table"></a>

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

<a id="hanafuda-koikoi-cpu-koume"></a>

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

<a id="hanafuda-koikoi-cpu-ryusai"></a>

## 対戦相手：柳斎

- ファイル: `public/games/hanafuda-koikoi/img/cpu-ryusai.webp`（512×512px）
- 用途: 対戦相手「柳斎」（ふつう）の顔。タイトルの相手選びと対局中の情報パネル
- 内容: 旅の絵師・柳斎（ふつう）。柳の地紋の藍色の着物、背中に笠、耳に細い筆をはさみ、穏やかに考え深い笑み。背景は暗い緑の無地。アニメ調のバストアップ、正面向き、顔が中央
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/cpu-koume.webp`](#hanafuda-koikoi-cpu-koume) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="hanafuda-koikoi-cpu-sogetsu"></a>

## 対戦相手：宗月

- ファイル: `public/games/hanafuda-koikoi/img/cpu-sogetsu.webp`（512×512px）
- 用途: 対戦相手「宗月」（つよい）の顔。タイトルの相手選びと対局中の情報パネル
- 内容: 料亭の御隠居・宗月（つよい）。白いあごひげ、桐の紋様の深紫の羽織、小さな朱の盃を手に、やさしくも鋭い目。背景は暗い紫の無地。アニメ調のバストアップ、正面向き、顔が中央
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/cpu-koume.webp`](#hanafuda-koikoi-cpu-koume) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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


---

# 宵灯りのほこら ― 画像の生成プロンプト

ゲーム: `public/games/hokora-rpg/`（25 枚中 0 枚が生成済み、25 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/hokora-rpg/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

和風フォークロアの、あたたかい絵本のような手描き調。宵（夕暮れ〜夜）の藍色と、灯（ともしび）の橙色の対比が基調。輪郭はやわらかく、水彩と墨のにじみ、紙の質感。妖（あやかし）は「こわかわいい」オリジナルの姿で、既存の作品のキャラクターや妖怪画の模写にはしない。人物はアニメ調だが落ち着いた色。画像の中に文字・ロゴ・署名・透かしは入れない。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/hokora-rpg/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- hokora-rpg` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- hokora-rpg`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#hokora-rpg-key) | 1600×900 | キービジュアル | タイトル画面の背景（横長の画面） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/title-bg.webp`](#hokora-rpg-title-bg) | 1080×1350 | 背景 | タイトル画面の背景（縦長のスマホ・タブレット） | Midjourney（v7） |
| ⬜ | [`img/cg-ending.webp`](#hokora-rpg-cg-ending) | 1600×900 | イベント絵 | エンディングとスタッフロールの背景 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/bg-field.webp`](#hokora-rpg-bg-field) | 1280×800 | 背景 | 野原・里での戦闘の背景 | Midjourney（v7） |
| ⬜ | [`img/bg-forest.webp`](#hokora-rpg-bg-forest) | 1280×800 | 背景 | 宵ノ森での戦闘の背景 | Midjourney（v7） |
| ⬜ | [`img/bg-cave.webp`](#hokora-rpg-bg-cave) | 1280×800 | 背景 | 鳴き岩の洞での戦闘の背景 | Midjourney（v7） |
| ⬜ | [`img/bg-shrine.webp`](#hokora-rpg-bg-shrine) | 1280×800 | 背景 | 奥ノ祠での戦闘の背景 | Midjourney（v7） |
| ⬜ | [`img/face-koharu.webp`](#hokora-rpg-face-koharu) | 512×512（透過） | 人物 | 会話の顔・メニュー・戦闘の仲間の欄 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/face-koharu-2.webp`](#hokora-rpg-face-koharu-2) | 512×512（透過） | 人物 | 会話の顔（おどろいたとき・決意のとき） | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/face-genta.webp`](#hokora-rpg-face-genta) | 512×512（透過） | 人物 | 会話の顔・メニュー・戦闘の仲間の欄 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/face-genta-2.webp`](#hokora-rpg-face-genta-2) | 512×512（透過） | 人物 | 会話の顔（戦いの前・気合いを入れるとき） | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/face-suzu.webp`](#hokora-rpg-face-suzu) | 512×512（透過） | 人物 | 会話の顔・メニュー・戦闘の仲間の欄 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/face-suzu-2.webp`](#hokora-rpg-face-suzu-2) | 512×512（透過） | 人物 | 会話の顔（こわがるとき・必死なとき） | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) | 512×512（透過） | スプライト | 戦闘の敵（野原・森） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-kakashi.webp`](#hokora-rpg-m-kakashi) | 512×512（透過） | スプライト | 戦闘の敵（野原・森） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-hozuki.webp`](#hokora-rpg-m-hozuki) | 512×512（透過） | スプライト | 戦闘の敵（野原・森） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-kokedaruma.webp`](#hokora-rpg-m-kokedaruma) | 512×512（透過） | スプライト | 戦闘の敵（森・洞） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-kasamaru.webp`](#hokora-rpg-m-kasamaru) | 512×512（透過） | スプライト | 戦闘の敵（森） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-iwagani.webp`](#hokora-rpg-m-iwagani) | 512×512（透過） | スプライト | 戦闘の敵（洞） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-kazetsuzumi.webp`](#hokora-rpg-m-kazetsuzumi) | 512×512（透過） | スプライト | 戦闘の敵（洞・祠） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-yamikoma.webp`](#hokora-rpg-m-yamikoma) | 512×512（透過） | スプライト | 戦闘の敵（奥ノ祠） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/m-kagedoro.webp`](#hokora-rpg-m-kagedoro) | 512×512（透過） | スプライト | 戦闘の敵（奥ノ祠・影灯籠） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/b-nejiregashi.webp`](#hokora-rpg-b-nejiregashi) | 768×768（透過） | スプライト | ボス戦（宵ノ森の主） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/b-hanzaki.webp`](#hokora-rpg-b-hanzaki) | 768×768（透過） | スプライト | ボス戦（鳴き岩の洞の主） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/b-yoigurai.webp`](#hokora-rpg-b-yoigurai) | 768×768（透過） | スプライト | 最後のボス戦 | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="hokora-rpg-key"></a>

## キービジュアル：山道の三人と消えた祠

- ファイル: `public/games/hokora-rpg/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景（横長の画面）
- 内容: 夕暮れの山道の石段で、主人公の三人（コハル・ゲンタ・スズ）が、灯の消えた山頂の小さな祠を見上げている。手前に石灯籠、ふもとには里の灯がぽつぽつ。上の中央はタイトル文字を重ねるので空（藍色のグラデーションと一番星）をすっきり空けておく。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 人物の見た目は face-koharu / face-genta / face-suzu と同じにします（先に顔の画像を作り、niji の --cref で参照すると揃えやすいです）。上の中央 1/3 はタイトルが重なります。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
three young travelers seen from behind and side on a mossy stone stairway of a mountain path at dusk, looking up at a small dark wooden shrine on the summit whose sacred light has gone out, a 16-year-old girl with a black bob haircut and a small flame-shaped hairpin wearing a white kimono top, indigo haori jacket and orange obi holding a purification wand with white paper streamers, a sturdy 18-year-old woodcutter boy with spiky brown hair, white headband, green work clothes and an axe on his shoulder, a tiny floating spirit girl with long silver-white hair, pale gold kimono and a brass bell on a red cord in her hair, glowing stone lanterns on the stairs, village lights far below, deep indigo sky fading to orange at the horizon, first evening star, empty calm sky in the upper center, warm lantern glow, Japanese folklore picture-book mood, soft watercolor and ink texture, cinematic wide composition --niji 6 --ar 16:9 --no text, letters, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, watermark, signature, extra fingers, modern buildings, cars, existing game characters
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style key visual, 16:9. Three young travelers on a mossy stone stairway of a mountain path at dusk look up at a small dark shrine on the summit whose light has gone out: a 16-year-old girl (black bob hair, flame-shaped hairpin, white kimono top, indigo haori, orange obi, purification wand with paper streamers), a sturdy 18-year-old woodcutter (spiky brown hair, white headband, green work clothes, axe on shoulder) and a tiny floating spirit girl (long silver-white hair, pale gold kimono, brass bell on a red cord). Glowing stone lanterns, village lights below, indigo sky with an orange horizon, empty sky in the upper center for a title. Soft watercolor and ink, Japanese folklore picture-book mood. No text.
```

<a id="hokora-rpg-title-bg"></a>

## タイトル背景：宵の里と奥山（縦長）

- ファイル: `public/games/hokora-rpg/img/title-bg.webp`（1080×1350px）
- 用途: タイトル画面の背景（縦長のスマホ・タブレット）
- 内容: 縦長の構図。手前に瓦屋根の小さな里と灯のともった家々、奥にそびえる山、その頂にぽつんと小さな祠（灯は消えて暗い）。空は藍色から夕焼けの橙へのグラデーション、星がまたたく。上の 1/3 はタイトル文字を重ねるので空を広く。人物はいない。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: タイトル文字は画面の上 13〜35% あたりに重なります。key と同じ時間帯・色合いにそろえます。

**Midjourney（v7）用のプロンプト**

```text
vertical landscape of a small Japanese mountain village at dusk, tiled roofs and paper lanterns glowing warm orange in the foreground, rice terraces, a tall forested mountain behind with a tiny dark shrine at its summit whose light has gone out, a thin path of stone lanterns winding up the slope, wide deep indigo sky with scattered stars fading into a soft orange horizon, the upper third is open sky, quiet and nostalgic, hand-painted watercolor and sumi ink picture-book illustration, paper texture, no people --ar 4:5 --v 7 --style raw --no text, letters, people, logo
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, people, logo, watermark, modern buildings, power lines
```

**ほかのツール用（共通の英文プロンプト）**

```text
Vertical 4:5 hand-painted watercolor and ink illustration: a small Japanese mountain village at dusk with tiled roofs and glowing paper lanterns in the foreground, a forested mountain behind with a tiny dark shrine at the summit (its light has gone out), stone lanterns along a path up the slope, wide indigo starry sky fading to orange at the horizon. The upper third is open sky. No people, no text.
```

<a id="hokora-rpg-cg-ending"></a>

## エンディング：灯祭りの夜

- ファイル: `public/games/hokora-rpg/img/cg-ending.webp`（1600×900px）
- 用途: エンディングとスタッフロールの背景
- 内容: 灯がよみがえった夜の里の灯祭り。たくさんの提灯と、輪になって踊る人々と、山から下りてきた小さな妖たち（提灯を下げたネズミ、ほおずきの火の玉、苔のだるま、傘のきのこ）。中央に三人（コハル・ゲンタ・スズ）と祖母ヨネが笑顔。遠くの山頂の祠に、あたたかな灯がともっている。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/key.webp`](#hokora-rpg-key) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 三人の見た目は key・顔の画像と同じに。妖たちは m-nezumi / m-hozuki / m-kokedaruma / m-kasamaru と同じデザインにすると物語がつながります。スタッフロールの文字が中央に流れるので、中央は明るすぎないように。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
joyful lantern festival at night in a small Japanese mountain village, rows of glowing red and orange paper lanterns, villagers dancing in a circle around a bonfire, small cute original folklore spirits joining the dance: a round mouse carrying a tiny lantern on its tail, a floating flame inside an orange hozuki husk, a mossy round stone creature, a mushroom with an umbrella-shaped cap, in the center a smiling girl with a black bob and flame hairpin in white kimono and indigo haori, a laughing woodcutter boy with a white headband, a tiny floating spirit girl with silver-white hair and a brass bell, and a kind old grandmother in a purple kimono, a warm light shining again from a small shrine on the distant mountain top, festive and heartwarming, watercolor and ink picture-book style --niji 6 --ar 16:9 --no text, letters, logo
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, watermark, scary, gore, existing characters
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style 16:9 illustration of a joyful night lantern festival in a Japanese mountain village: rows of glowing paper lanterns, villagers dancing around a bonfire, cute original folklore spirits (a mouse with a lantern on its tail, a flame inside a hozuki husk, a mossy round stone creature, an umbrella-capped mushroom) joining in. In the center the three heroes (girl with black bob and flame hairpin, woodcutter with white headband, tiny floating silver-haired bell spirit) and a kind grandmother in purple. A warm light shines again from the shrine on the distant mountain. Watercolor picture-book style, no text.
```

<a id="hokora-rpg-bg-field"></a>

## 戦闘背景：灯ノ野（野原）

- ファイル: `public/games/hokora-rpg/img/bg-field.webp`（1280×800px）
- 用途: 野原・里での戦闘の背景
- 内容: なだらかな草原と、遠くの田んぼ・瓦屋根の里・青い山並み。午後の金色の光、ススキと野の花。手前は戦いの舞台になるので、平らで広く空けておく。人物・動物はいない。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 4 枚の戦闘背景（field / forest / cave / shrine）は同じツール・同じ構図（手前が平らな舞台、地平線は画面の 45% あたり）でそろえます。下 1/4 には仲間の欄が重なります。

**Midjourney（v7）用のプロンプト**

```text
wide grassy meadow in the Japanese countryside in warm late-afternoon light, pampas grass and small wildflowers, distant rice paddies, a tiny village with tiled roofs, layered blue mountains, soft clouds, the foreground is a flat open grassy clearing with nothing on it, battle stage background for a role-playing game, painterly watercolor and ink, gentle colors, no people, no animals --ar 16:10 --v 7 --style raw --no text, people, animals, creatures
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, people, animals, creatures, buildings in the foreground
```

**ほかのツール用（共通の英文プロンプト）**

```text
16:10 painterly watercolor background: a wide grassy meadow in the Japanese countryside in warm afternoon light, pampas grass, wildflowers, distant rice paddies, a small village with tiled roofs, layered blue mountains. The foreground is a flat, empty grassy clearing (a battle stage). No people, no creatures, no text.
```

<a id="hokora-rpg-bg-forest"></a>

## 戦闘背景：宵ノ森

- ファイル: `public/games/hokora-rpg/img/bg-forest.webp`（1280×800px）
- 用途: 宵ノ森での戦闘の背景
- 内容: 夕暮れの深い森。太い杉や樫、こけむした根、薄い霧、苔の生えた古い石灯籠、ホタルの小さな光。奥から差しこむ青白い光。手前は平らな苔の地面。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-field.webp`](#hokora-rpg-bg-field) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: bg-field と同じ構図・タッチで。

**Midjourney（v7）用のプロンプト**

```text
deep mystical Japanese forest at dusk, huge cedar and oak trunks, mossy twisting roots, thin drifting mist, an old moss-covered stone lantern, tiny fireflies, pale blue light filtering from the back, the foreground is a flat open mossy clearing with nothing on it, battle stage background for a role-playing game, painterly watercolor and ink, quiet and slightly eerie, no people, no creatures --ar 16:10 --v 7 --style raw --no text, people, creatures
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, people, creatures, animals
```

**ほかのツール用（共通の英文プロンプト）**

```text
16:10 painterly watercolor background of a deep mystical Japanese forest at dusk: huge cedar and oak trunks, mossy roots, thin mist, an old moss-covered stone lantern, tiny fireflies, pale blue light from the back. The foreground is a flat, empty mossy clearing (a battle stage). No people, no creatures, no text.
```

<a id="hokora-rpg-bg-cave"></a>

## 戦闘背景：鳴き岩の洞

- ファイル: `public/games/hokora-rpg/img/bg-cave.webp`（1280×800px）
- 用途: 鳴き岩の洞での戦闘の背景
- 内容: 山の中の大きな洞窟。静かな地底湖、天井から垂れる鍾乳石、岩肌に光る青緑の苔、ところどころに穴のあいた「鳴き岩」。冷たい青い光。手前は平らな岩の床。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-field.webp`](#hokora-rpg-bg-field) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: bg-field と同じ構図・タッチで。

**Midjourney（v7）用のプロンプト**

```text
large cavern inside a mountain, a still underground lake reflecting the light, stalactites hanging from the ceiling, faintly glowing blue-green moss on the rock walls, strange rocks full of small holes that sing in the wind, cold blue light with a hint of teal, the foreground is a flat open rocky floor with nothing on it, battle stage background for a role-playing game, painterly watercolor and ink, no people, no creatures --ar 16:10 --v 7 --style raw --no text, people, creatures
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, people, creatures, torches, modern objects
```

**ほかのツール用（共通の英文プロンプト）**

```text
16:10 painterly watercolor background of a large mountain cavern: a still underground lake, stalactites, faintly glowing blue-green moss, rocks full of small holes, cold blue light. The foreground is a flat, empty rocky floor (a battle stage). No people, no creatures, no text.
```

<a id="hokora-rpg-bg-shrine"></a>

## 戦闘背景：奥ノ祠（夜）

- ファイル: `public/games/hokora-rpg/img/bg-shrine.webp`（1280×800px）
- 用途: 奥ノ祠での戦闘の背景
- 内容: 山頂の古い祠の境内、夜。朱色の鳥居がいくつも奥へ続き、石灯籠には紫色の妖しい炎。空は深い藍色で、雲の切れ間に細い月。不気味だが美しい。手前は平らな石畳。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-field.webp`](#hokora-rpg-bg-field) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: bg-field と同じ構図・タッチで。最後のボス戦にも使います。

**Midjourney（v7）用のプロンプト**

```text
precincts of an old mountain-top shrine at night, several vermilion torii gates receding into the darkness, stone lanterns burning with eerie violet flames, a small wooden shrine hall in the back with its light extinguished, deep indigo sky with a thin crescent moon between clouds, drifting dark mist, eerie but beautiful, the foreground is a flat open stone pavement with nothing on it, battle stage background for a role-playing game, painterly watercolor and ink, no people, no creatures --ar 16:10 --v 7 --style raw --no text, people, creatures
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, people, creatures, gore
```

**ほかのツール用（共通の英文プロンプト）**

```text
16:10 painterly watercolor background of an old mountain-top shrine at night: vermilion torii gates receding into darkness, stone lanterns with eerie violet flames, a small shrine hall with its light out, indigo sky with a thin crescent moon, drifting dark mist. The foreground is a flat, empty stone pavement (a battle stage). No people, no creatures, no text.
```

<a id="hokora-rpg-face-koharu"></a>

## コハル（ふだん・笑顔）

- ファイル: `public/games/hokora-rpg/img/face-koharu.webp`（512×512px・背景は透過）
- 用途: 会話の顔・メニュー・戦闘の仲間の欄
- 内容: 主人公コハル。16 歳の祠守の見習い。黒髪のボブ、小さな炎の形の髪飾り、白い着物に藍色の羽織、橙色の帯。明るくまっすぐな笑顔。胸から上、正面やや斜め。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- メモ: 背景は単色（淡いミントグリーン）で作り、透過に切り抜きます。表情違い（face-koharu-2）はこの画像をもとに作ります。会話の窓では顔の上 6 割が四角く切り取られるので、頭が上で切れないように。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a 16-year-old Japanese girl, apprentice shrine keeper, short black bob hair, a small orange flame-shaped hairpin, white kimono top with an indigo haori jacket and an orange obi, bright honest smile, warm brown eyes, facing the viewer at a slight angle, chest-up framing, centered, soft cel shading with watercolor texture, plain flat pale mint green background --niji 6 --ar 1:1 --no text, letters, background details
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, background details, hands covering face, extra fingers
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style chest-up portrait of a 16-year-old Japanese girl, an apprentice shrine keeper: short black bob, small orange flame-shaped hairpin, white kimono top, indigo haori, orange obi, bright honest smile, slight 3/4 angle, centered. Plain flat pale mint green background (to be cut out). No text.
```

<a id="hokora-rpg-face-koharu-2"></a>

## コハル（おどろき・真剣）

- ファイル: `public/games/hokora-rpg/img/face-koharu-2.webp`（512×512px・背景は透過）
- 用途: 会話の顔（おどろいたとき・決意のとき）
- 内容: face-koharu と同じコハル・同じ服・同じ構図で、表情だけを「目を見開いた真剣な顔（おどろき・決意）」にしたもの。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/face-koharu.webp`](#hokora-rpg-face-koharu) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: Gemini に face-koharu.png を添付して編集させると、同じ人物のまま表情だけ変えられます。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像（face-koharu）の人物をもとに、同じ少女・同じ髪型と髪飾り・同じ服・同じ構図・同じ単色の背景のまま、表情だけを変えてください。新しい表情：目を大きく見開き、眉を少し上げた、真剣で決意のこもった顔（驚きと決意が混ざった表情）。口は小さく開ける。正方形（1:1）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
別人の顔、服や髪型の変更、背景の変更、文字
```

**ほかのツール用（共通の英文プロンプト）**

```text
Using the attached portrait (face-koharu) as the base, keep the same girl, hairstyle, hairpin, outfit, framing and plain background, and change only the expression: wide-open eyes, slightly raised brows, a serious, determined look mixed with surprise, mouth slightly open. Square 1:1. No text.
```

<a id="hokora-rpg-face-genta"></a>

## ゲンタ（ふだん・笑顔）

- ファイル: `public/games/hokora-rpg/img/face-genta.webp`（512×512px・背景は透過）
- 用途: 会話の顔・メニュー・戦闘の仲間の欄
- 内容: 仲間のゲンタ。18 歳の木こり。日焼けした肌、つんつんした茶色の髪、白い鉢巻、緑の作業着。気のいい、にかっとした笑顔。肩に斧の柄が少し見える。胸から上。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- 参照画像: [`img/face-koharu.webp`](#hokora-rpg-face-koharu) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: face-koharu と同じ niji のスタイル・同じ構図（胸から上・中央）でそろえます。背景は単色（淡いピンク）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of an 18-year-old Japanese woodcutter boy, tanned skin, spiky brown hair, white cloth headband, green work kimono with rolled sleeves, broad shoulders, the wooden handle of an axe resting on his shoulder, big friendly grin, facing the viewer at a slight angle, chest-up framing, centered, soft cel shading with watercolor texture, plain flat pale pink background --niji 6 --ar 1:1 --no text, letters, background details
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, background details, extra fingers, weapons pointed at viewer
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style chest-up portrait of an 18-year-old Japanese woodcutter: tanned skin, spiky brown hair, white headband, green work kimono with rolled sleeves, axe handle on his shoulder, big friendly grin, slight 3/4 angle, centered. Plain flat pale pink background (to be cut out). No text.
```

<a id="hokora-rpg-face-genta-2"></a>

## ゲンタ（気合い・怒り）

- ファイル: `public/games/hokora-rpg/img/face-genta-2.webp`（512×512px・背景は透過）
- 用途: 会話の顔（戦いの前・気合いを入れるとき）
- 内容: face-genta と同じゲンタ・同じ服・同じ構図で、表情だけを「歯を見せて気合いを入れた、勇ましい顔」にしたもの。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/face-genta.webp`](#hokora-rpg-face-genta) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: Gemini に face-genta.png を添付して編集します。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像（face-genta）の人物をもとに、同じ青年・同じ髪型と鉢巻・同じ服・同じ構図・同じ単色の背景のまま、表情だけを変えてください。新しい表情：眉をつり上げ、歯を見せて気合いを入れた勇ましい顔（少し汗をかいている）。正方形（1:1）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
別人の顔、服や髪型の変更、背景の変更、文字
```

**ほかのツール用（共通の英文プロンプト）**

```text
Using the attached portrait (face-genta) as the base, keep the same young man, hairstyle, headband, outfit, framing and plain background, and change only the expression: raised brows, teeth showing, a fired-up, brave face with a little sweat. Square 1:1. No text.
```

<a id="hokora-rpg-face-suzu"></a>

## スズ（ふだん・ほほえみ）

- ファイル: `public/games/hokora-rpg/img/face-suzu.webp`（512×512px・背景は透過）
- 用途: 会話の顔・メニュー・戦闘の仲間の欄
- 内容: 仲間のスズ。祠の古い鈴に宿る付喪神の少女（見た目は 10 歳くらい）。銀白色の長い髪、赤い組紐で結んだ真鍮の鈴の髪飾り、淡い金色の着物。少し人見知りな、やさしいほほえみ。体のまわりにかすかな光の粒。胸から上。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- 参照画像: [`img/face-koharu.webp`](#hokora-rpg-face-koharu) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: face-koharu と同じ niji のスタイル・構図で。背景は単色（淡い空色）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a small spirit girl who looks about ten years old, born from an old shrine bell, long silver-white hair, a brass bell tied with a red braided cord as a hair ornament, pale gold kimono with a subtle bell pattern, gentle shy smile, large pale amber eyes, faint sparkles of light around her, facing the viewer at a slight angle, chest-up framing, centered, soft cel shading with watercolor texture, plain flat pale sky blue background --niji 6 --ar 1:1 --no text, letters, background details
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, background details, animal ears, wings
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style chest-up portrait of a small spirit girl (looks about ten) born from an old shrine bell: long silver-white hair, a brass bell on a red braided cord as a hair ornament, pale gold kimono with a subtle bell pattern, gentle shy smile, pale amber eyes, faint sparkles around her, slight 3/4 angle, centered. Plain flat pale sky blue background (to be cut out). No text.
```

<a id="hokora-rpg-face-suzu-2"></a>

## スズ（不安・涙ぐむ）

- ファイル: `public/games/hokora-rpg/img/face-suzu-2.webp`（512×512px・背景は透過）
- 用途: 会話の顔（こわがるとき・必死なとき）
- 内容: face-suzu と同じスズ・同じ服・同じ構図で、表情だけを「眉を下げて涙ぐんだ、不安そうな顔（でも必死に訴えている）」にしたもの。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/face-suzu.webp`](#hokora-rpg-face-suzu) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: Gemini に face-suzu.png を添付して編集します。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
添付した画像（face-suzu）の人物をもとに、同じ少女・同じ銀白色の髪と鈴の髪飾り・同じ服・同じ構図・同じ単色の背景のまま、表情だけを変えてください。新しい表情：眉を下げ、目に涙をためた不安そうな顔。それでも何かを必死に訴えるように、口を少し開ける。正方形（1:1）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
別人の顔、服や髪型の変更、背景の変更、文字
```

**ほかのツール用（共通の英文プロンプト）**

```text
Using the attached portrait (face-suzu) as the base, keep the same spirit girl, silver-white hair, bell ornament, outfit, framing and plain background, and change only the expression: lowered brows, teary eyes, anxious but earnestly pleading, mouth slightly open. Square 1:1. No text.
```

<a id="hokora-rpg-m-nezumi"></a>

## 敵：ちょうちんねずみ

- ファイル: `public/games/hokora-rpg/img/m-nezumi.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（野原・森）
- 内容: 丸っこい野ネズミの妖。くるりと巻いたしっぽの先に、小さな紙の提灯をぶらさげている（ほんのり光る）。いたずらっぽい目。こわかわいい。全身。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: 敵 12 体（m-* と b-*）は、絵柄がそろうように同じツール（ChatGPT）で、同じ会話の中で続けて作ります。1 体目ができたら「この絵柄のまま、次の妖を」と頼むと揃います。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
オリジナルの妖（日本の民話風のモンスター）を 1 体描いてください。名前は「ちょうちんねずみ」。丸っこい茶色の野ネズミで、くるりと巻いたしっぽの先に小さな紙の提灯をぶらさげていて、提灯がほんのり橙色に光っている。いたずらっぽい目、小さな前歯。こわかわいい雰囲気。全身、正面やや斜め、画面の中央に大きく。やわらかい水彩と墨の手描き風、くっきりしたシルエット。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景、既存のキャラクターに似せること
```

**ほかのツール用（共通の英文プロンプト）**

```text
Original Japanese-folklore-style monster, full body, centered: a round brown field mouse holding a tiny glowing paper lantern hanging from its curled tail, mischievous eyes, small front teeth, cute but eerie. Soft watercolor-and-ink hand-drawn style with a clean silhouette. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-kakashi"></a>

## 敵：かかしぼう

- ファイル: `public/games/hokora-rpg/img/m-kakashi.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（野原・森）
- 内容: 一本足でぴょんぴょん歩く案山子の妖。破れた菅笠、わらの蓑、布の顔に墨でかいたゆがんだ笑顔、竹の腕。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「かかしぼう」。一本の木の足でぴょんぴょん跳ねて歩く案山子。破れた菅笠、わらの蓑、布の顔に墨で描いたゆがんだ笑顔、竹の腕。少しこわいけれどユーモラス。全身、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, a scarecrow that hops on a single wooden leg, torn sedge hat, straw raincoat, cloth face with a crooked ink-drawn grin, bamboo arms. A little scary but funny. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-hozuki"></a>

## 敵：ほおずき火

- ファイル: `public/games/hokora-rpg/img/m-hozuki.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（野原・森）
- 内容: 半透明の橙色のほおずきの袋の中に、小さな火の玉が入って宙に浮かぶ妖。火の玉には目と口があり、袋のすきまから煙がたなびく。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「ほおずき火」。半透明の橙色のほおずきの袋（実を包むがく）の中に小さな火の玉が入っていて、ふわふわ宙に浮かんでいる。火の玉には小さな目と口があり、袋のすきまから細い煙がたなびく。全身、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, a little floating fireball with eyes and a mouth inside a translucent orange hozuki (Chinese lantern plant) husk, thin smoke trailing from the gaps. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-kokedaruma"></a>

## 敵：こけだるま

- ファイル: `public/games/hokora-rpg/img/m-kokedaruma.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（森・洞）
- 内容: 苔と小さなシダにおおわれた、丸い石の起き上がり小法師のような妖。眠そうでいかめしい目、小さな石の手。どっしり重そう。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「こけだるま」。苔と小さなシダにびっしりおおわれた、丸くてどっしりした石の起き上がり人形のような妖。眠そうでいかめしい目、小さな石の手、背中から小さな草が生えている。全身、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, a round heavy stone tumbler-doll creature covered in moss and tiny ferns, sleepy stern eyes, small stone hands, grass sprouting from its back. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-kasamaru"></a>

## 敵：かさまる

- ファイル: `public/games/hokora-rpg/img/m-kasamaru.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（森）
- 内容: かさが古い番傘の形をしたきのこの妖。短い足でちょこちょこ歩き、かさの下から紫色に光る胞子をまき散らす。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「かさまる」。かさが古い和紙の番傘の形をしたきのこで、骨組みが少し見えている。短い足でちょこちょこ歩き、かさの下から紫色に光る胞子をふわふわまき散らしている。とぼけた顔。全身、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, a mushroom whose cap is shaped like an old oiled-paper umbrella with visible ribs, short legs, scattering glowing purple spores, a goofy face. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-iwagani"></a>

## 敵：いわがに

- ファイル: `public/games/hokora-rpg/img/m-iwagani.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（洞）
- 内容: 甲羅がごつごつした岩そのものになっているカニの妖。地衣類が生え、ハサミは割れた岩のように大きい。とても硬そう。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「いわがに」。甲羅がごつごつした灰色の岩そのものになっているカニで、岩には地衣類や小さな苔が生えている。ハサミは割れた岩のように大きくて重そう。小さな目が二つ。全身、正面やや斜め、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, a crab whose shell is a craggy grey boulder with lichen and moss, huge pincers like split rocks, two small eyes. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-kazetsuzumi"></a>

## 敵：かぜつづみ

- ファイル: `public/games/hokora-rpg/img/m-kazetsuzumi.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（洞・祠）
- 内容: 古い小鼓に宿った付喪神。砂時計形の胴に朱色の紐、鼓の皮が口になっている。まわりに風の渦をまとって宙に浮かぶ。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「かぜつづみ」。古い小鼓（砂時計の形をした和楽器の太鼓）に宿った付喪神。胴は黒漆に金の模様、朱色の紐でしばられていて、鼓の皮の面が大きな口になっている。まわりに風の渦をまとってふわりと浮かぶ。全身、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, a spirit living in an old hourglass-shaped Japanese hand drum (tsuzumi): black lacquer body with gold patterns, vermilion cords, the drumhead forms a big mouth, floating inside swirling wind. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-yamikoma"></a>

## 敵：やみこま

- ファイル: `public/games/hokora-rpg/img/m-yamikoma.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（奥ノ祠）
- 内容: 影に染まってしまった狛犬の妖。ひびの入った石の体から黒い煙のたてがみが立ちのぼり、目が紫色に光る。低くうなっている。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「やみこま」。影に染まってしまった、神社を守る石の獅子犬（狛犬）のような妖。ひびの入った黒っぽい石の体、黒い煙のようなたてがみが立ちのぼり、目は紫色に光っている。前かがみで低くうなっている。全身、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, a shrine guardian lion-dog statue corrupted by shadow: cracked dark stone body, a mane of black smoke, glowing violet eyes, crouching and growling. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-m-kagedoro"></a>

## 敵：かげどうろう

- ファイル: `public/games/hokora-rpg/img/m-kagedoro.webp`（512×512px・背景は透過）
- 用途: 戦闘の敵（奥ノ祠・影灯籠）
- 内容: 短い石の足で歩き出した石灯籠の妖。火袋の窓の奥で紫黒色の炎がゆらめき、その炎が目のように見える。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、オリジナルの妖をもう 1 体描いてください。名前は「かげどうろう」。短い石の足で歩き出した古い石灯籠。火をともす窓の奥で、紫と黒の妖しい炎がゆらめいていて、その炎が二つの目のように見える。笠の部分には苔。全身、画面の中央に大きく。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: an original folklore monster, an old stone lantern walking on short stone legs, an eerie purple-black flame flickering inside its light window that looks like two eyes, moss on its roof. Full body, centered. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-b-nejiregashi"></a>

## 主：ねじれ樫（森のボス）

- ファイル: `public/games/hokora-rpg/img/b-nejiregashi.webp`（768×768px・背景は透過）
- 用途: ボス戦（宵ノ森の主）
- 内容: 濁ってしまった樫の老木の精。ねじれた太い幹に、うろでできた顔と赤く光る目。根が腕のように動き、枝には黒ずんだ葉。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、ボスの妖を 1 体描いてください。名前は「ねじれ樫」。心が濁ってしまった樫の老木の精。らせん状にねじれた太い幹に、木のうろでできた顔があり、目が赤く光っている。根が何本も腕のように持ち上がり、枝には黒ずんだ葉がざわざわと茂る。大きく威圧的だが、どこか悲しげ。全身、画面いっぱいに中央。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: a boss monster, the spirit of an old oak gone wild: a spiral-twisted thick trunk with a face formed by knotholes and glowing red eyes, roots rising like arms, darkened rustling leaves. Big and intimidating but a little sad. Full body, centered, filling the frame. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-b-hanzaki"></a>

## 主：はんざき大主（洞のボス）

- ファイル: `public/games/hokora-rpg/img/b-hanzaki.webp`（768×768px・背景は透過）
- 用途: ボス戦（鳴き岩の洞の主）
- 内容: 地底湖の主である巨大なオオサンショウウオの妖。苔むしたまだら模様の皮、小さく賢そうな目、のどの奥がぼうっと光っている（飲みこんだ火種石）。体から水がしたたる。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、ボスの妖を 1 体描いてください。名前は「はんざき大主」。地底湖に住む、とても大きくて古いオオサンショウウオの主。苔むした茶灰色のまだら模様の皮、小さく賢そうな目、大きな口。のどの奥が橙色にぼうっと光っている（飲みこんだ不思議な石）。体から水がしたたる。正面やや斜め、全身、画面いっぱいに中央。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: a boss monster, a gigantic ancient giant salamander lord of an underground lake: mossy mottled brown-grey skin, small wise eyes, wide mouth, an orange glow deep in its throat (a magic stone it swallowed), water dripping from its body. Full body, centered, filling the frame. Transparent background PNG, square. No text.
```

<a id="hokora-rpg-b-yoigurai"></a>

## 主：宵喰らい（最後のボス）

- ファイル: `public/games/hokora-rpg/img/b-yoigurai.webp`（768×768px・背景は透過）
- 用途: 最後のボス戦
- 内容: 灯を喰らう、夜の霧でできた背の高い影の妖。顔には三日月のような白い口だけがあり、体じゅうに琥珀色と紫色の小さな光（喰らった灯）が目のように散らばる。すそは霧の触手になってほどけている。おそろしいが、どこかさびしげ。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/m-nezumi.webp`](#hokora-rpg-m-nezumi) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: m-nezumi と同じ会話・同じ絵柄で。暗い色の妖なので、切り抜きのために背景は必ず透明（または白）で。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
同じ絵柄で、最後のボスの妖を 1 体描いてください。名前は「宵喰らい」。灯を喰らう、夜の霧でできた背の高い影の妖。顔の部分には三日月のような白い口だけがあり、体じゅうに琥珀色と紫色の小さな光（喰らった灯）が目のように散らばっている。体のすそは霧の触手になってほどけている。おそろしいが、どこかさびしげ。全身、画面いっぱいに中央。背景を透明にした PNG（正方形 1024×1024）。文字は入れないでください。
```

**ネガティブプロンプト（入れたくないもの）**

```text
文字、背景、血
```

**ほかのツール用（共通の英文プロンプト）**

```text
Same style: the final boss, a tall shadow creature made of night mist that devours lights: its face is only a pale crescent-shaped mouth, many small amber and violet lights (the lights it ate) scattered over its body like eyes, the hem dissolving into misty tendrils. Frightening but lonely. Full body, centered, filling the frame. Transparent background PNG, square. No text.
```


---

# 夜空のアーチ ― 画像の生成プロンプト

ゲーム: `public/games/homerun-derby/`（8 枚中 0 枚が生成済み、8 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/homerun-derby/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夏の夜のナイター。濃い藍の夜空、照明塔のまぶしい白い光、芝の深い緑、遠くの花火。少しドラマチックで爽やかなイラスト。実在の球場・球団・選手・ロゴ・ユニフォームに似せず、ユニフォームは無地（文字・ロゴ・背番号なし）。画像の中に文字・看板の文字・スコアボードの数字は入れません。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/homerun-derby/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- homerun-derby` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- homerun-derby`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#homerun-derby-key) | 1600×1000 | キービジュアル | タイトル画面の背景（中央にロゴとボタンが重なります） | Midjourney（v7） |
| ⬜ | [`img/bg-plate.webp`](#homerun-derby-bg-plate) | 1600×1000 | 背景 | 打席の画面の奥（地平線より上だけを使い、その下の芝・マウンド・投手はコードで描きます） | Midjourney（v7） |
| ⬜ | [`img/bg-outfield.webp`](#homerun-derby-bg-outfield) | 1600×1000 | 背景 | 打球を追う画面の空（地平線より上だけを使い、外野・フェンス・客席の手前はコードで描きます） | Midjourney（v7） |
| ⬜ | [`img/pitcher-1.webp`](#homerun-derby-pitcher-1) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-2.webp`](#homerun-derby-pitcher-2) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-3.webp`](#homerun-derby-pitcher-3) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-4.webp`](#homerun-derby-pitcher-4) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-5.webp`](#homerun-derby-pitcher-5) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="homerun-derby-key"></a>

## キービジュアル：夏の夜空へ打ち上がるアーチ

- ファイル: `public/games/homerun-derby/img/key.webp`（1600×1000px）
- 用途: タイトル画面の背景（中央にロゴとボタンが重なります）
- 内容: 夏の夜のナイター球場。打者の後ろ姿のシルエットがバットを振り抜き、白い打球が藍色の夜空へ大きな弧を描いて飛んでいく。照明塔の光、満員の客席の小さな灯り、外野の向こうに打ち上げ花火。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ロゴとボタンを中央に重ねるので、打球の弧は上半分に。看板・スコアボードに文字が出たら消してください。

**Midjourney（v7）用のプロンプト**

```text
a summer night baseball stadium, a batter seen from behind in silhouette after a full swing, a white baseball flying high in a long glowing arc into the deep indigo night sky, bright white floodlight towers, a packed crowd as tiny lights, colorful fireworks bursting beyond the outfield, cinematic wide shot, dramatic yet refreshing mood, painterly illustration, plain uniform without logos or numbers, no text --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team names, scoreboard numbers, real stadium, real player --no text, logo, numbers
```

**ほかのツール用（共通の英文プロンプト）**

```text
Wide 16:10 illustration of a summer night baseball stadium: a batter seen from behind in silhouette after a full swing, a white ball flying in a long glowing arc into a deep indigo night sky, bright floodlight towers, a packed crowd as tiny lights, fireworks beyond the outfield. Painterly, dramatic but refreshing. Plain uniform, no logos, no numbers, no text.
```

<a id="homerun-derby-bg-plate"></a>

## 背景：捕手の後ろから見た夜の球場（外野席と照明）

- ファイル: `public/games/homerun-derby/img/bg-plate.webp`（1600×1000px）
- 用途: 打席の画面の奥（地平線より上だけを使い、その下の芝・マウンド・投手はコードで描きます）
- 内容: ホームベースの後ろ・捕手の目線から、まっすぐ中堅方向を見た夜の球場。画像の下端に外野フェンスの上端がくる構図で、その上に外野席、照明塔、文字のない大きなスコアボードのシルエット、藍色の夜空と星。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ゲームは画像の下端を地平線に合わせ、それより上だけを表示します。左右対称に近いと、投手とストライクゾーンの後ろがすっきりします。

**Midjourney（v7）用のプロンプト**

```text
night baseball stadium seen from directly behind home plate at catcher's eye level, looking straight toward center field, the top of the outfield wall runs along the very bottom edge of the image, above it the outfield stands with a crowd as soft lights, tall floodlight towers glowing white, a large blank scoreboard silhouette without any text, deep indigo starry summer sky, symmetrical composition, painterly, soft bokeh --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, advertising, players, real stadium --no text, numbers, logo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Night baseball stadium seen from directly behind home plate at catcher's eye level, looking at center field. The top of the outfield wall runs along the bottom edge; above it outfield stands with a crowd as soft lights, tall glowing floodlight towers, a blank scoreboard silhouette with no text, deep indigo starry summer sky. Symmetrical, painterly. 16:10. No text.
```

<a id="homerun-derby-bg-outfield"></a>

## 背景：外野方向の夜空と客席（打球を追う画面）

- ファイル: `public/games/homerun-derby/img/bg-outfield.webp`（1600×1000px）
- 用途: 打球を追う画面の空（地平線より上だけを使い、外野・フェンス・客席の手前はコードで描きます）
- 内容: 高い位置から外野方向を見た夜空。下端に外野スタンド上段のシルエットと照明塔、その上に広い藍色の夜空、細い雲、遠くの街の灯り、小さな打ち上げ花火。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-plate.webp`](#homerun-derby-bg-plate) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: bg-plate と同じ色調で。空が広いほど、打球が空を飛ぶ様子が映えます。

**Midjourney（v7）用のプロンプト**

```text
wide night sky above the upper outfield stands of a baseball stadium, the stands and floodlight towers as dark silhouettes along the bottom edge, a vast deep indigo summer sky with thin clouds and stars, faint city lights on the horizon, a few small distant fireworks, calm and spacious, painterly --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, advertising, people close-up --no text, logo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Wide 16:10 night sky above the upper outfield stands of a baseball stadium: stands and floodlight towers as dark silhouettes along the bottom edge, a vast deep indigo summer sky with thin clouds and stars, faint city lights, a few small distant fireworks. Calm, spacious, painterly. No text.
```

<a id="homerun-derby-pitcher-1"></a>

## 投手：夏木ハヤト（新人の速球派）

- ファイル: `public/games/homerun-derby/img/pitcher-1.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: 18 歳くらいの新人の男性投手。紺の帽子から黒い短髪、日焼けした肌、白地に紺のラインの無地のユニフォーム。ボールを前に突き出して自信満々に笑う。背景は夜の球場の照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 5 人の投手は同じツール（niji）・同じ画風・同じ背景（夜の照明のボケ）でそろえます。2 人目以降は pitcher-1 を参照画像（--sref または --cref）にすると画風がそろいます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of an 18-year-old rookie baseball pitcher, energetic confident grin, short black hair under a navy cap, tanned skin, plain white uniform with navy trim and no logos or lettering, holding a baseball out toward the viewer, night stadium floodlight bokeh background, clean cel shading, vivid summer night colors --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of an 18-year-old rookie baseball pitcher with a confident grin, short black hair under a navy cap, tanned skin, plain white uniform with navy trim (no logos or lettering), holding a ball toward the viewer, night stadium floodlight bokeh behind. 3:4. No text.
```

<a id="homerun-derby-pitcher-2"></a>

## 投手：弓張ツキノ（月夜のカーブ使い）

- ファイル: `public/games/homerun-derby/img/pitcher-2.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: クールな女性の左投手。長いポニーテール、濃紺に金のラインの無地のユニフォーム。カーブの握りのボールを顔の横に構え、横目でこちらを見る。背景に細い三日月と照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#homerun-derby-pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a cool young female left-handed baseball pitcher, long dark ponytail, calm sideways glance, dark navy uniform with gold trim and no logos or lettering, holding a baseball with a curveball grip beside her face in her left hand, thin crescent moon and floodlight bokeh in the night sky behind, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a cool young female left-handed pitcher, long dark ponytail, calm sideways glance, dark navy uniform with gold trim (no logos), holding a ball with a curveball grip beside her face in her left hand, thin crescent moon and floodlight bokeh behind. 3:4. No text.
```

<a id="homerun-derby-pitcher-3"></a>

## 投手：岩城ゴウ（剛腕フォーク）

- ファイル: `public/games/homerun-derby/img/pitcher-3.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: がっしりした大柄の男性投手。短い無精ひげ、鋭い目つき、黒地にオレンジのラインの無地のユニフォーム。人差し指と中指の間にボールを深く挟むフォークの握りを見せる。背景は照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#homerun-derby-pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a big burly power pitcher, stern sharp eyes, short stubble, plain black uniform with orange trim and no logos or lettering, showing a forkball grip with the ball wedged deep between index and middle fingers, intense steam of breath, night stadium floodlight bokeh background, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a big burly power pitcher with stern eyes and short stubble, plain black uniform with orange trim (no logos), showing a forkball grip with the ball wedged between index and middle fingers, night stadium floodlight bokeh behind. 3:4. No text.
```

<a id="homerun-derby-pitcher-4"></a>

## 投手：朧ミツキ（横手投げの変化球師）

- ファイル: `public/games/homerun-derby/img/pitcher-4.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: 細身で中性的な雰囲気の横手投げの投手。涼しげな半目の微笑み、白地に紫のラインの無地のユニフォーム。腕を横に伸ばした投球フォームの途中。背景は霧がかった照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#homerun-derby-pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a slender androgynous sidearm baseball pitcher, calm mysterious half-lidded smile, plain white uniform with purple trim and no logos or lettering, arm extended sideways mid sidearm delivery, misty haze and soft floodlight bokeh in the night behind, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a slender androgynous sidearm pitcher with a calm, mysterious half-lidded smile, plain white uniform with purple trim (no logos), arm extended sideways mid-delivery, misty floodlight bokeh behind. 3:4. No text.
```

<a id="homerun-derby-pitcher-5"></a>

## 投手：星海ジン（夜空の絶対エース）

- ファイル: `public/games/homerun-derby/img/pitcher-5.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: 背の高いエース投手。鋭い目、落ち着いた表情、濃紺に銀のラインの無地のユニフォーム。帽子のつばに手をかけ、満天の星空と照明を背にこちらを見すえる。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#homerun-derby-pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a tall ace baseball pitcher, sharp focused eyes, composed expression, plain midnight blue uniform with silver trim and no logos or lettering, one hand touching the brim of his cap, glove at his chest, a starry summer night sky and floodlights behind him, subtle glow, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a tall ace pitcher with sharp, focused eyes, plain midnight-blue uniform with silver trim (no logos), one hand on the brim of his cap, glove at his chest, starry summer night sky and floodlights behind. 3:4. No text.
```


---

# みやび札 ― 百人一首かるた ― 画像の生成プロンプト

ゲーム: `public/games/hyakunin-isshu/`（7 枚中 0 枚が生成済み、7 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/hyakunin-isshu/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

上品で落ち着いた和の色調（深緑・生成り・臙脂・金茶）。夕暮れの柔らかな光と和紙・畳の質感。人物はすべて同じ絵柄の、繊細で品のある日本のアニメ調の胸から上の肖像（正面〜やや斜め、無地の背景、円形に切り抜いて使うので顔は中央）。どの画像にも文字・書・ロゴ・透かしは入れない（かるたの札は無地か、読めないかすれた筆の跡だけ）。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/hyakunin-isshu/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- hyakunin-isshu` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- hyakunin-isshu`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#hyakunin-isshu-key) | 1600×900 | キービジュアル | タイトル画面の背景（中央にゲーム名を重ねるので、中央は暗めで空けておく）。スマホ縦では中央付近が切り出されます | Midjourney（v7） |
| ⬜ | [`img/bg-tatami.webp`](#hyakunin-isshu-bg-tatami) | 1600×1000 | 背景 | 対戦・ちらし取りの盤面の背景（上に暗い膜を重ね、札を並べます） | Adobe Firefly（Image 4） |
| ⬜ | [`img/reader.webp`](#hyakunin-isshu-reader) | 320×320 | 人物 | 読み上げの欄の丸いアイコン（52px 前後、丸く切り抜き） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-1.webp`](#hyakunin-isshu-cpu-1) | 320×320 | 人物 | 対戦の相手（いちばんやさしい）。上の欄の丸いアイコンと、相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-2.webp`](#hyakunin-isshu-cpu-2) | 320×320 | 人物 | 対戦の相手（ふつう）。丸いアイコンと相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-3.webp`](#hyakunin-isshu-cpu-3) | 320×320 | 人物 | 対戦の相手（強い）。丸いアイコンと相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-4.webp`](#hyakunin-isshu-cpu-4) | 320×320 | 人物 | 対戦の相手（いちばん強い）。丸いアイコンと相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="hyakunin-isshu-key"></a>

## キービジュアル：夕暮れの和室とかるた

- ファイル: `public/games/hyakunin-isshu/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景（中央にゲーム名を重ねるので、中央は暗めで空けておく）。スマホ縦では中央付近が切り出されます
- 内容: 夕暮れの静かな和室。畳の上に、緑の縁の生成りのかるた札（文字のない無地）が数枚散らばり、紅葉が一枚二枚。障子越しの夕日と、縁側の向こうに昇る月。画面の中央は暗めで空間を残し、上品で映画的な光。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 札に文字が出たら、その部分を生成し直すか塗りつぶしてください（タイトルの文字は HTML で重ねます）。

**Midjourney（v7）用のプロンプト**

```text
a quiet traditional Japanese tatami room at dusk, a few blank cream-colored playing cards with thin green borders scattered on the tatami, two or three red maple leaves, a low lacquered table at the side, shoji screens glowing with warm sunset light, a pale moon rising beyond the open veranda, calm empty dark space in the center of the frame, elegant cinematic composition, soft volumetric light, muted deep green, cream and crimson palette, painterly realism --ar 16:9 --v 7 --style raw --no text, letters, calligraphy, writing on cards, watermark, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, calligraphy on the cards, watermark, logo, people, clutter
```

**ほかのツール用（共通の英文プロンプト）**

```text
A quiet traditional Japanese tatami room at dusk. A few blank cream-colored playing cards with thin green borders lie scattered on the tatami with two or three red maple leaves. Shoji screens glow with warm sunset light and a pale moon rises beyond the open veranda. Keep the center of the image calm and dark for a title. Elegant, cinematic, painterly realism in muted deep green, cream and crimson. 16:9, no text, no people.
```

<a id="hyakunin-isshu-bg-tatami"></a>

## 背景：畳（真上から）

- ファイル: `public/games/hyakunin-isshu/img/bg-tatami.webp`（1600×1000px）
- 用途: 対戦・ちらし取りの盤面の背景（上に暗い膜を重ね、札を並べます）
- 内容: 真上から見た新しい畳。い草の細かい織り目、深緑の畳縁が 2 本ほど通る。物は何も置かない。均一で柔らかい光、端がわずかに暗い。
- おすすめのツール: [Adobe Firefly（Image 4）](https://firefly.adobe.com/) ― サイズ: 縦横比を画面で選択
- メモ: Firefly の「写真」スタイルで。縦横比は 16:10 に近いものを選び、真上からの視点にします。

**Adobe Firefly（Image 4）用のプロンプト**

```text
Top-down photograph of a clean new tatami floor, two mats meeting in the middle, fine woven rush texture in fresh yellow-green, dark green cloth borders along the mat edges, soft even daylight, very subtle vignette, nothing on the floor, no people, high detail texture. Aspect ratio 16:10.
```

**ネガティブプロンプト（入れたくないもの）**

```text
objects, furniture, people, text, shadows of people, strong perspective
```

**ほかのツール用（共通の英文プロンプト）**

```text
A top-down photo of a clean new tatami floor: two mats meeting in the middle, fine woven rush texture in fresh yellow-green, dark green cloth borders along the edges, soft even daylight, a very subtle vignette, nothing placed on the floor. 16:10, no text.
```

<a id="hyakunin-isshu-reader"></a>

## 読手（よみて）

- ファイル: `public/games/hyakunin-isshu/img/reader.webp`（320×320px）
- 用途: 読み上げの欄の丸いアイコン（52px 前後、丸く切り抜き）
- 内容: 穏やかな年配の女性の読手。くすんだ若草色の着物、銀髪をきちんとまとめた髪、優しい表情で胸元に無地の札を一枚持つ。背景は無地の淡い生成り色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: このシリーズ（読手・CPU 4 人）の絵柄の基準です。最初にこれを作り、ほかの 4 枚はこの画像をスタイル参照（--sref）にして揃えます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust portrait of a gentle elderly Japanese woman, card reader for a poetry card game, muted sage green kimono, silver hair in a neat low bun, calm kind smile, holding one blank cream card near her chest, face centered, plain soft beige background, refined delicate anime illustration, soft warm lighting --niji 6 --ar 1:1 --no text, letters, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters on the card, watermark, busy background, hands with extra fingers
```

**ほかのツール用（共通の英文プロンプト）**

```text
A bust portrait of a gentle elderly Japanese woman who reads poems aloud for a card game: muted sage green kimono, silver hair in a neat low bun, a calm kind smile, holding one blank cream card near her chest. Face centered, plain soft beige background, refined delicate anime illustration, soft warm light. Square, no text.
```

<a id="hyakunin-isshu-cpu-1"></a>

## 相手 ★1：小春

- ファイル: `public/games/hyakunin-isshu/img/cpu-1.webp`（320×320px）
- 用途: 対戦の相手（いちばんやさしい）。上の欄の丸いアイコンと、相手を選ぶ画面
- 内容: かるたを始めて半年の、元気な 10 歳くらいの女の子。短いボブヘア、白いブラウスに黄色いニットのカーディガン、やる気いっぱいの笑顔。背景は無地の淡い桜色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#hyakunin-isshu-reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 読手の画像を --sref に入れて絵柄を揃えます。袴姿・長い黒髪の女学生など、既存のかるた作品を連想させる姿は避けます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust portrait of a cheerful ten-year-old Japanese girl, short bob haircut, yellow knit cardigan over a white blouse, bright determined smile, face centered, plain pale pink background, refined delicate anime illustration, soft warm lighting --niji 6 --ar 1:1 --sref [URL of reader image] --no text, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, watermark, school uniform, hakama, red hakama, long black hair
```

**ほかのツール用（共通の英文プロンプト）**

```text
A bust portrait of a cheerful ten-year-old Japanese girl with a short bob haircut, a yellow knit cardigan over a white blouse and a bright, determined smile. Face centered, plain pale pink background, refined delicate anime illustration in the same style as the reader portrait. Square, no text.
```

<a id="hyakunin-isshu-cpu-2"></a>

## 相手 ★2：文月

- ファイル: `public/games/hyakunin-isshu/img/cpu-2.webp`（320×320px）
- 用途: 対戦の相手（ふつう）。丸いアイコンと相手を選ぶ画面
- 内容: 図書館で働く、歌が好きな 20 代の青年。丸めがね、柔らかな茶色の髪、シャツの上にベージュのカーディガン、穏やかな微笑み。背景は無地の淡い水色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#hyakunin-isshu-reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 読手の画像を --sref に。4 人の背景色はそれぞれ違う淡い色にして、小さなアイコンでも見分けられるようにします。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust portrait of a gentle bookish Japanese young man in his twenties, round glasses, soft brown hair, beige cardigan over a collared shirt, small calm smile, face centered, plain pale blue background, refined delicate anime illustration, soft warm lighting --niji 6 --ar 1:1 --sref [URL of reader image] --no text, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, watermark, books with readable titles
```

**ほかのツール用（共通の英文プロンプト）**

```text
A bust portrait of a gentle, bookish Japanese man in his twenties: round glasses, soft brown hair, a beige cardigan over a collared shirt and a small calm smile. Face centered, plain pale blue background, refined delicate anime illustration in the same style as the reader portrait. Square, no text.
```

<a id="hyakunin-isshu-cpu-3"></a>

## 相手 ★3：宵

- ファイル: `public/games/hyakunin-isshu/img/cpu-3.webp`（320×320px）
- 用途: 対戦の相手（強い）。丸いアイコンと相手を選ぶ画面
- 内容: 落ち着いた上級者の 30 代の女性。波の文様がうっすら入った藍色の着物、黒髪を低い位置でまとめ、静かで自信のある眼差し。背景は無地の淡い藤鼠色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#hyakunin-isshu-reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 読手の画像を --sref に。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust portrait of an elegant Japanese woman in her thirties, deep indigo kimono with a subtle wave pattern, black hair in a low bun, calm confident gaze, faint smile, face centered, plain lavender gray background, refined delicate anime illustration, soft evening lighting --niji 6 --ar 1:1 --sref [URL of reader image] --no text, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, watermark, heavy makeup, busy background
```

**ほかのツール用（共通の英文プロンプト）**

```text
A bust portrait of an elegant Japanese woman in her thirties wearing a deep indigo kimono with a subtle wave pattern, black hair in a low bun, a calm confident gaze and a faint smile. Face centered, plain lavender-gray background, refined delicate anime illustration in the same style as the reader portrait. Square, no text.
```

<a id="hyakunin-isshu-cpu-4"></a>

## 相手 ★4：白峰

- ファイル: `public/games/hyakunin-isshu/img/cpu-4.webp`（320×320px）
- 用途: 対戦の相手（いちばん強い）。丸いアイコンと相手を選ぶ画面
- 内容: かるた一筋六十年の老師。白髪と短い白いあごひげ、着物に濃い色の羽織、鋭いが温かい目。背景は無地のくすんだ金茶色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#hyakunin-isshu-reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 読手の画像を --sref に。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust portrait of a dignified elderly Japanese man, white hair and a short white beard, dark haori jacket over a kimono, sharp but warm eyes, slight smile, face centered, plain muted gold background, refined delicate anime illustration, soft warm lighting --niji 6 --ar 1:1 --sref [URL of reader image] --no text, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, watermark, angry expression, weapons
```

**ほかのツール用（共通の英文プロンプト）**

```text
A bust portrait of a dignified elderly Japanese man with white hair and a short white beard, a dark haori jacket over a kimono, sharp but warm eyes and a slight smile. Face centered, plain muted gold background, refined delicate anime illustration in the same style as the reader portrait. Square, no text.
```


---

# 筆まる漢字帖 ― 熟語クロス・四字熟語・難読漢字 ― 画像の生成プロンプト

ゲーム: `public/games/jukugo-puzzle/`（5 枚中 0 枚が生成済み、5 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/jukugo-puzzle/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

和紙・墨・朱の落ち着いた和の文房具の世界。生成りの和紙、黒に近い墨色、朱色の差し色、木の文机の温かな茶色。キャラクターは筆の精「筆まる」で、丸くて親しみやすいマスコット調（線がはっきりした、やわらかい塗り）。どの画像にも文字・書・漢字・ロゴを入れない（紙は白紙のまま）。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/jukugo-puzzle/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- jukugo-puzzle` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- jukugo-puzzle`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#jukugo-puzzle-key) | 1600×900 | キービジュアル | タイトル画面の背景（半透明で重ね、中央にタイトルとメニューを置くので、中央は白い紙の余白に） | Recraft（V3） |
| ⬜ | [`img/bg-washi.webp`](#jukugo-puzzle-bg-washi) | 1600×1000 | 背景 | 問題の画面の背景（上に明るい膜を重ねて、文字を読みやすくします） | FLUX.1（dev / pro） |
| ⬜ | [`img/mascot-normal.webp`](#jukugo-puzzle-mascot-normal) | 480×480（透過） | 人物 | タイトル画面のキャラクター（表情の基準）、結果画面 | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/mascot-happy.webp`](#jukugo-puzzle-mascot-happy) | 480×480（透過） | 人物 | 正解したときの解説の欄・成績のよい結果 | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/mascot-sad.webp`](#jukugo-puzzle-mascot-sad) | 480×480（透過） | 人物 | 不正解のときの解説の欄・成績が低い結果 | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="jukugo-puzzle-key"></a>

## キービジュアル：文机と筆・硯

- ファイル: `public/games/jukugo-puzzle/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景（半透明で重ね、中央にタイトルとメニューを置くので、中央は白い紙の余白に）
- 内容: 真上から見た木の文机。中央に大きな白紙の和紙、左右に筆・硯・墨・文鎮・朱肉・梅の小枝。フラットで上品なイラスト。紙には何も書かない。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）
- メモ: Recraft のスタイルは「Vector art」系のフラットなものを選びます。紙に文字が出たら、その部分を消してください。

**Recraft（V3）用のプロンプト**

```text
Flat vector illustration, top-down view of a traditional Japanese wooden writing desk: a large blank sheet of cream washi paper in the center, calligraphy brushes on a brush rest, an inkstone with an ink stick, a paperweight, a small vermilion seal-ink case and a sprig of plum blossoms arranged along the left and right edges. Muted cream, warm brown, ink black and vermilion palette, subtle paper texture, elegant and calm, lots of empty space in the center. No text, no letters, no calligraphy characters, the paper is blank. Aspect ratio 16:9.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, calligraphy characters on the paper, logo, watermark, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
A flat vector illustration seen from directly above: a traditional Japanese wooden writing desk with a large blank sheet of cream washi paper in the center; calligraphy brushes on a brush rest, an inkstone with an ink stick, a paperweight, a small vermilion seal-ink case and a sprig of plum blossoms along the left and right edges. Muted cream, warm brown, ink black and vermilion; subtle paper texture; calm, with lots of empty space in the center. No text; the paper is blank. 16:9.
```

<a id="jukugo-puzzle-bg-washi"></a>

## 背景：和紙の質感

- ファイル: `public/games/jukugo-puzzle/img/bg-washi.webp`（1600×1000px）
- 用途: 問題の画面の背景（上に明るい膜を重ねて、文字を読みやすくします）
- 内容: 生成りの手すき和紙の大きな一枚を真上から。こうぞの繊維がうっすら見え、端に向かってわずかに暗くなる。文字や模様はなし。
- おすすめのツール: [FLUX.1（dev / pro）](https://bfl.ai/) ― サイズ: 幅・高さを直接指定（64 の倍数）
- メモ: FLUX では 1600×1024 などの 64 の倍数で生成し、ツールが 1600×1000 に切り抜きます。

**FLUX.1（dev / pro）用のプロンプト**

```text
high resolution top-down photograph of a single large sheet of handmade Japanese washi paper, warm off-white cream color, visible soft kozo fibers and gentle uneven texture, very subtle darker vignette toward the edges, even soft daylight, no objects, no text, no patterns
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, stains, folds, objects, shadows of objects, strong patterns
```

**ほかのツール用（共通の英文プロンプト）**

```text
A high-resolution top-down photo of one large sheet of handmade Japanese washi paper: warm off-white cream, soft visible kozo fibers and a gentle uneven texture, a very subtle darker vignette toward the edges, even soft daylight. No objects, no text, no patterns.
```

<a id="jukugo-puzzle-mascot-normal"></a>

## 筆まる（ふつう）

- ファイル: `public/games/jukugo-puzzle/img/mascot-normal.webp`（480×480px・背景は透過）
- 用途: タイトル画面のキャラクター（表情の基準）、結果画面
- 内容: オリジナルの筆の精「筆まる」。ずんぐりした太い筆の姿で、白い穂先が頭（墨が少しついて先が黒い）、竹の軸が体。くりっとした目と小さな手足、首に朱色の小さなスカーフ。にっこり笑って片手を上げてあいさつ。全身、正面。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: 3 枚（ふつう・正解・不正解）は同じ ChatGPT の会話で作ります。まずこの画像を作り、ほかの 2 枚はこの画像を添付して「同じキャラクター・同じ画風・同じ大きさのまま、表情とポーズだけを変えて、背景を透明にした PNG で」と頼みます。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create an original cute mascot character: a small, chubby spirit of a Japanese calligraphy brush named Fudemaru. Its head is the soft white brush tip with a little black ink on the very end, its body is a short bamboo handle, it has big round friendly eyes, a small smile, tiny arms and legs, and a small vermilion scarf around its neck. It raises one hand in a cheerful greeting. Full body, front view, clean bold outlines and soft flat shading, warm cream, bamboo brown, ink black and vermilion colors. Transparent background PNG, no text. Square 1024x1024.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, background, realistic human features, scary
```

**ほかのツール用（共通の英文プロンプト）**

```text
An original cute mascot: a small chubby spirit of a Japanese calligraphy brush. Its head is the soft white brush tip with a little black ink at the end, its body a short bamboo handle; big round friendly eyes, a small smile, tiny arms and legs, a small vermilion scarf. Raising one hand in a cheerful greeting. Full body, front view, bold clean outlines, soft flat shading. Transparent or plain white background, no text. Square.
```

<a id="jukugo-puzzle-mascot-happy"></a>

## 筆まる（正解）

- ファイル: `public/games/jukugo-puzzle/img/mascot-happy.webp`（480×480px・背景は透過）
- 用途: 正解したときの解説の欄・成績のよい結果
- 内容: 同じ「筆まる」が両手を上げて跳びはね、目を細めて大喜び。穂先がうれしそうに跳ねている。小さな星の飾り。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/mascot-normal.webp`](#jukugo-puzzle-mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: mascot-normal の画像を添付して作ります。体の大きさと位置を normal にそろえてください。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Using the attached image, keep exactly the same Fudemaru brush-spirit character, same proportions, colors and drawing style, and change only the pose and expression: it jumps with both arms raised, eyes closed in a big happy smile, the brush tip bouncing joyfully, two or three tiny sparkle shapes around it. Full body, front view. Transparent background PNG, no text. Square 1024x1024.
```

**ネガティブプロンプト（入れたくないもの）**

```text
different character, text, background
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same brush-spirit mascot (white brush-tip head with an inked end, bamboo body, vermilion scarf) jumping with both arms raised, eyes closed in a big happy smile, the brush tip bouncing, two or three tiny sparkles around it. Same style as the reference, full body, transparent or plain white background, no text. Square.
```

<a id="jukugo-puzzle-mascot-sad"></a>

## 筆まる（不正解）

- ファイル: `public/games/jukugo-puzzle/img/mascot-sad.webp`（480×480px・背景は透過）
- 用途: 不正解のときの解説の欄・成績が低い結果
- 内容: 同じ「筆まる」が、穂先をしょんぼり垂らして困り顔。片手で頭をかき、汗のしずくを一つ。悲しすぎず、「次はがんばる」雰囲気。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/mascot-normal.webp`](#jukugo-puzzle-mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: mascot-normal の画像を添付して作ります。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Using the attached image, keep exactly the same Fudemaru brush-spirit character, same proportions, colors and drawing style, and change only the pose and expression: the brush tip droops a little, it scratches its head with one hand with an embarrassed, slightly sad smile and a single small sweat drop, as if saying it will try again. Full body, front view. Transparent background PNG, no text. Square 1024x1024.
```

**ネガティブプロンプト（入れたくないもの）**

```text
different character, crying, tears, text, background
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same brush-spirit mascot (white brush-tip head with an inked end, bamboo body, vermilion scarf) with its brush tip drooping a little, scratching its head with an embarrassed, slightly sad smile and one small sweat drop, as if it will try again. Same style as the reference, full body, transparent or plain white background, no text. Square.
```


---

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
| ⬜ | [`img/bg.webp`](#kingyo-sukui-bg) | 1600×1000 | 背景 | プレイ画面の背景（水槽のまわりに暗くして表示） | Midjourney（v7） |
| ⬜ | [`img/key.webp`](#kingyo-sukui-key) | 1600×900 | キービジュアル | タイトル画面の背景 | Adobe Firefly（Image 4） |
| ⬜ | [`img/keeper.webp`](#kingyo-sukui-keeper) | 480×600（透過） | 人物 | 左のパネル（スマホは上の丸い窓）でひと言をしゃべる・結果画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/keeper-wow.webp`](#kingyo-sukui-keeper-wow) | 480×600（透過） | 人物 | めずらしい金魚・何匹もすくったとき・結果がよいとき | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-ryukin.webp`](#kingyo-sukui-fish-ryukin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-demekin.webp`](#kingyo-sukui-fish-demekin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-kurodeme.webp`](#kingyo-sukui-fish-kurodeme) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-comet.webp`](#kingyo-sukui-fish-comet) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-shubunkin.webp`](#kingyo-sukui-fish-shubunkin) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-ranchu.webp`](#kingyo-sukui-fish-ranchu) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |
| ⬜ | [`img/fish-tancho.webp`](#kingyo-sukui-fish-tancho) | 400×300（透過） | カード | 金魚図鑑の絵（タイトル・結果画面の「図鑑」） | Recraft（V3） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="kingyo-sukui-bg"></a>

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

<a id="kingyo-sukui-key"></a>

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

<a id="kingyo-sukui-keeper"></a>

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

<a id="kingyo-sukui-keeper-wow"></a>

## 屋台のおじさん（びっくり・感心）

- ファイル: `public/games/kingyo-sukui/img/keeper-wow.webp`（480×600px・背景は透過）
- 用途: めずらしい金魚・何匹もすくったとき・結果がよいとき
- 内容: keeper と同じおじさんが、目を丸くして口を開け、感心して驚いている表情（片手でおでこを押さえるなど）。服装・髪型・構図は keeper と同じ。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/keeper.webp`](#kingyo-sukui-keeper) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: Gemini に keeper の画像を添付して「表情だけを変えて」と頼むと、人物がそろいます。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Using the attached picture of the festival stall keeper, keep exactly the same man, the same clothes (twisted towel headband, navy happi coat, towel around the neck), the same anime style, framing and plain light gray background. Change only his expression to amazed and impressed: eyes wide open, eyebrows raised, mouth open in a delighted "wow", one hand touching his forehead. Portrait 4:5, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same friendly festival stall keeper as the reference (headband, navy happi coat, towel), same anime style and framing, now amazed and impressed: wide eyes, raised eyebrows, open mouth, one hand on the forehead. Plain light gray background, portrait 4:5, no text.
```

<a id="kingyo-sukui-fish-wakin"></a>

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

<a id="kingyo-sukui-fish-ryukin"></a>

## 図鑑：琉金

- ファイル: `public/games/kingyo-sukui/img/fish-ryukin.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 琉金（背の高い丸く短い体、長くひらひらした二重の尾びれ、紅白の模様）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="kingyo-sukui-fish-demekin"></a>

## 図鑑：出目金

- ファイル: `public/games/kingyo-sukui/img/fish-demekin.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 出目金（丸い体、左右に大きく飛び出した目、二重の尾びれ、赤橙色）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="kingyo-sukui-fish-kurodeme"></a>

## 図鑑：黒出目金

- ファイル: `public/games/kingyo-sukui/img/fish-kurodeme.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 黒出目金（ビロードのような真っ黒な体、大きく飛び出した目、二重の尾びれ）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="kingyo-sukui-fish-comet"></a>

## 図鑑：コメット

- ファイル: `public/games/kingyo-sukui/img/fish-comet.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: コメット（細長い体、吹き流しのように長い一枚の尾びれ、鮮やかな赤橙色）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="kingyo-sukui-fish-shubunkin"></a>

## 図鑑：朱文金

- ファイル: `public/games/kingyo-sukui/img/fish-shubunkin.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 朱文金（細身の体に、青灰・赤・白・黒のまだら模様、長い尾びれ）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="kingyo-sukui-fish-ranchu"></a>

## 図鑑：らんちゅう

- ファイル: `public/games/kingyo-sukui/img/fish-ranchu.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: らんちゅう（背びれのない卵形の太った体、頭にこぶ、短い二重の尾びれ、橙赤色）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="kingyo-sukui-fish-tancho"></a>

## 図鑑：丹頂

- ファイル: `public/games/kingyo-sukui/img/fish-tancho.webp`（400×300px・背景は透過）
- 用途: 金魚図鑑の絵（タイトル・結果画面の「図鑑」）
- 内容: 丹頂（真っ白な体とひれ、頭のてっぺんにだけ丸い赤い模様、二重の尾びれ）。横から見た全身、博物画のような水彩の図鑑の絵。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/fish-wakin.webp`](#kingyo-sukui-fish-wakin) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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


---

# まちがい日和 ― 画像の生成プロンプト

ゲーム: `public/games/machigai-sagashi/`（4 枚中 0 枚が生成済み、4 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/machigai-sagashi/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

明るく親しみやすい、フラットでやさしい色の和のイラスト。生成り・朱・空色・若草色を基調に、角の丸いかたち。人物は出さない（動物や物は可）。画面の中に文字・数字・看板の文字・ロゴを入れない（題名や数字はゲームの HTML で描くため）。ゲームの中の景色（コードで描いた 6 つの絵）と同じく、輪郭線のないフラットな塗りで。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/machigai-sagashi/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- machigai-sagashi` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- machigai-sagashi`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key-visual.webp`](#machigai-sagashi-key-visual) | 1200×800 | キービジュアル | タイトル画面（PC は左上の横長の絵、スマホは左上の正方形。中央付近が切り抜かれます） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/title-bg.webp`](#machigai-sagashi-title-bg) | 1600×900 | 背景 | タイトル画面の背景（55% の濃さで重ねます。上に文字やカードが重なります） | Midjourney（v7） |
| ⬜ | [`img/result-cat.webp`](#machigai-sagashi-result-cat) | 512×512（透過） | アイテム | 「めぐり」の結果画面のいちばん上（透過） | Recraft（V3） |
| ⬜ | [`img/clear-deco.webp`](#machigai-sagashi-clear-deco) | 960×240（透過） | UI 部品 | クリアのカードの上部に重ねる飾り（透過） | Leonardo.Ai（Phoenix） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="machigai-sagashi-key-visual"></a>

## キービジュアル：虫めがねと和の町

- ファイル: `public/games/machigai-sagashi/img/key-visual.webp`（1200×800px）
- 用途: タイトル画面（PC は左上の横長の絵、スマホは左上の正方形。中央付近が切り抜かれます）
- 内容: 大きな虫めがねが、夏祭りの提灯・のれん・金魚・風鈴が並ぶにぎやかな和の町並みをのぞいている、フラットなイラスト。虫めがねのレンズの中だけ少し色が鮮やか。文字や看板の文字は入れない。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示
- メモ: 看板やのれんに文字が出てしまったら「文字をすべて消して、無地にして」と追加で指示してください。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a cheerful flat vector-style illustration, landscape 3:2 (1536×1024). A large magnifying glass hovers over a lively traditional Japanese street at a summer festival: rows of red and white paper lanterns, shop curtains (noren) in indigo, goldfish in a basin, wind chimes, a sleeping cat on a bench. Inside the lens the colours are slightly brighter. Soft cream, vermilion, sky blue and leaf green palette, rounded shapes, no outlines, gentle shadows. Keep the important part in the centre. No people, no text, no letters, no signs with writing, no logos.
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cheerful flat illustration (3:2): a large magnifying glass over a lively traditional Japanese festival street with paper lanterns, indigo shop curtains, goldfish in a basin, wind chimes and a sleeping cat. Inside the lens the colours look a little brighter. Cream, vermilion, sky blue and leaf green, rounded shapes, no outlines. No people, no text, no signs with writing.
```

<a id="machigai-sagashi-title-bg"></a>

## 背景：淡い和の町のパノラマ

- ファイル: `public/games/machigai-sagashi/img/title-bg.webp`（1600×900px）
- 用途: タイトル画面の背景（55% の濃さで重ねます。上に文字やカードが重なります）
- 内容: 淡い水彩のような、和の町並みと遠くの山・海・桜が横に続くパノラマ。全体にとても明るく、コントラストは低め。中央は空と余白が多い。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 文字やカードが上に重なるので、できるだけ淡く、ごちゃごちゃしていないものを選んでください。

**Midjourney（v7）用のプロンプト**

```text
very soft pastel watercolor panorama of a small Japanese seaside town, tiled roofs, a shrine gate on a hill, cherry trees, distant mountains and calm sea, lots of pale sky and empty space in the middle, light airy cream and sky-blue palette, low contrast, gentle paper texture, wide composition --ar 16:9 --v 7 --style raw --no text, letters, signs, people, logos, dark areas
```

**ほかのツール用（共通の英文プロンプト）**

```text
A very soft, pale watercolor panorama of a small Japanese seaside town with tiled roofs, a shrine gate on a hill, cherry trees, distant mountains and a calm sea. Lots of pale sky and empty space in the middle, cream and sky-blue colours, low contrast. No text, no people. Wide 16:9.
```

<a id="machigai-sagashi-result-cat"></a>

## 結果の絵：虫めがねの招き猫

- ファイル: `public/games/machigai-sagashi/img/result-cat.webp`（512×512px・背景は透過）
- 用途: 「めぐり」の結果画面のいちばん上（透過）
- 内容: 片手を上げた白い招き猫が、もう片方の手で虫めがねを持ってにっこりしている。赤い首輪と金の鈴。フラットなベクター風。背景は透明。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- メモ: Recraft の Vector illustration で生成し、背景を削除して PNG で保存。小判などに文字が入った場合は消してください。

**Recraft（V3）用のプロンプト**

```text
flat vector illustration of a cute white beckoning cat figurine (maneki-neko) raising one paw and holding a magnifying glass in the other, happy closed eyes, red collar with a golden bell, soft rounded shapes, cream white, vermilion and gold, no outlines, centred, isolated on a transparent background, no text
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cute flat vector illustration of a white beckoning cat (maneki-neko) raising one paw and holding a magnifying glass in the other, smiling with closed eyes, red collar and golden bell. Rounded shapes, cream, vermilion and gold, centred on a plain white background (to be cut out), no text. Square 1:1.
```

<a id="machigai-sagashi-clear-deco"></a>

## 飾り：紙吹雪と桜の花びら

- ファイル: `public/games/machigai-sagashi/img/clear-deco.webp`（960×240px・背景は透過）
- 用途: クリアのカードの上部に重ねる飾り（透過）
- 内容: 横長の帯に、色とりどりの紙吹雪・桜の花びら・小さな星がふんわり散っている飾り。中央の下側は少し空けておく。背景は透明。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- メモ: Leonardo の Transparency をオンにして生成（1536×384 など横長）。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
decorative horizontal banner of falling paper confetti, cherry blossom petals and tiny stars, pastel pink, gold, sky blue and vermilion, flat game UI asset, evenly scattered with a clear area at the bottom centre, transparent background
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, ribbon with writing, frame, border, solid background, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
A wide decorative strip (4:1) of falling paper confetti, cherry blossom petals and tiny stars in pastel pink, gold, sky blue and vermilion, flat style, scattered evenly, leaving the lower centre fairly empty. Transparent or plain white background, no text.
```


---

# 宵月麻雀 ― 画像の生成プロンプト

ゲーム: `public/games/mahjong/`（8 枚中 0 枚が生成済み、8 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/mahjong/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夜の和モダン。藍色・墨色の夜の空気に、提灯や月明かりの琥珀色と金色の灯りが差す落ち着いた色調。背景は絵画的で写実寄り（映画のような柔らかい光）、人物はやわらかなセル塗りのアニメ調（線は細め・色数は控えめ・目元は明るく）。3 人の人物は同じ絵柄・同じ光（左上からの暖色の灯り＋背景の藍色のぼかし）でそろえる。どの画像にも文字・ロゴ・看板の字・透かしを入れない（ゲーム名や数字は HTML と canvas で重ねる）。実在の人物・作家・作品・ブランドに似せない。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/mahjong/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- mahjong` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- mahjong`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key-visual.webp`](#mahjong-key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（中央にゲーム名・ボタンを HTML で重ね、暗いグラデーションをかけて表示） | Midjourney（v7） |
| ⬜ | [`img/bg-room.webp`](#mahjong-bg-room) | 1600×900 | 背景 | 対局画面の背景（卓の外側。暗く・半透明に重ねて表示） | Adobe Firefly（Image 4） |
| ⬜ | [`img/tsubame.webp`](#mahjong-tsubame) | 512×512 | 人物 | 対戦相手のカード・タイトルの顔ぶれ（下家） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/tsubame-win.webp`](#mahjong-tsubame-win) | 512×512 | 人物 | つばめが和了したときのカード・結果画面・最終順位（1 位のとき） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/genzo.webp`](#mahjong-genzo) | 512×512 | 人物 | 対戦相手のカード・タイトルの顔ぶれ（対面） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/genzo-win.webp`](#mahjong-genzo-win) | 512×512 | 人物 | 源三が和了したときのカード・結果画面・最終順位（1 位のとき） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/rei.webp`](#mahjong-rei) | 512×512 | 人物 | 対戦相手のカード・タイトルの顔ぶれ（上家） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/rei-win.webp`](#mahjong-rei-win) | 512×512 | 人物 | レイが和了したときのカード・結果画面・最終順位（1 位のとき） | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="mahjong-key-visual"></a>

## キービジュアル：夜の雀荘「宵月亭」

- ファイル: `public/games/mahjong/img/key-visual.webp`（1600×900px）
- 用途: タイトル画面の背景（中央にゲーム名・ボタンを HTML で重ね、暗いグラデーションをかけて表示）
- 内容: 満月の夜、瓦屋根の小さな和風の雀荘を通りから見た絵。軒先に琥珀色の提灯がともり、開いた引き戸の奥で緑のフェルトの麻雀卓と象牙色の牌が灯りに照らされている。空は藍色、うっすら霧。人物は描かない（いても遠くの小さなシルエット）。看板・のれんに文字は入れない。中央は文字を重ねるので明るすぎない落ち着いた構図に。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: タイトル文字とボタンが中央に重なるので、主役（店の入口）は中央よりやや下・奥に。提灯やのれんに字が出たら Vary (Region) で消してください。1600×900 に縮小して使います。

**Midjourney（v7）用のプロンプト**

```text
a small traditional Japanese mahjong parlor at night seen from a quiet stone-paved street, tiled roof under a large full moon, warm amber paper lanterns hanging from the eaves, through the open wooden sliding doors a green felt mahjong table with ivory tiles glows in lamplight, deep indigo sky, light mist, wet street reflections, painterly cinematic illustration, soft volumetric light, calm and inviting mood, generous dark negative space in the center, blank lanterns, blank noren curtain, no people --ar 16:9 --v 7 --style raw --no text, letters, kanji, signage, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji, characters on signs or lanterns, logo, watermark, people in the foreground, modern neon signs, cars
```

**ほかのツール用（共通の英文プロンプト）**

```text
Painterly cinematic illustration of a small traditional Japanese mahjong parlor at night, seen from a quiet stone street. Tiled roof under a big full moon, warm amber paper lanterns on the eaves, and through the open sliding wooden doors a green felt mahjong table with ivory tiles glowing in lamplight. Deep indigo sky, light mist, soft reflections on the wet street. Calm, inviting mood with dark open space in the center for a title. No people, no text, no signs with letters. Wide 16:9.
```

<a id="mahjong-bg-room"></a>

## 背景：宵月亭の店内（夜）

- ファイル: `public/games/mahjong/img/bg-room.webp`（1600×900px）
- 用途: 対局画面の背景（卓の外側。暗く・半透明に重ねて表示）
- 内容: 夜の雀荘の店内。木の壁と障子、ぼんやりした提灯の灯り、奥に別の卓の気配。ピントは外して大きくぼかし、全体は暗めの藍色と木の焦げ茶。人はいない。文字は入れない。
- おすすめのツール: [Adobe Firefly（Image 4）](https://firefly.adobe.com/) ― サイズ: 縦横比を画面で選択
- メモ: Firefly では縦横比を「ワイドスクリーン（16:9）」、コンテンツの種類を「写真」に。ゲームでは上から暗い色を重ねるので、明るすぎない画像の方がなじみます。

**Adobe Firefly（Image 4）用のプロンプト**

```text
Interior of a quiet traditional Japanese mahjong parlor at night, dark wooden walls and shoji paper screens, a few warm paper lanterns glowing softly, an empty wooden table in the far background, strongly out of focus with large soft bokeh, dark moody indigo and deep brown tones, empty room, photographic, shallow depth of field, calm atmosphere, no people, no text, no signs. Aspect ratio 16:9 (widescreen).
```

**ネガティブプロンプト（入れたくないもの）**

```text
people, text, letters, signs, posters with writing, logos, bright daylight, cluttered foreground
```

**ほかのツール用（共通の英文プロンプト）**

```text
Dark, softly blurred photograph of the interior of a traditional Japanese mahjong parlor at night: wooden walls, shoji screens, a few warm paper lanterns, an empty table far in the background. Large soft bokeh, deep indigo and dark brown tones, no people, no text or signs. Widescreen 16:9.
```

<a id="mahjong-tsubame"></a>

## 人物：朝霧つばめ（通常）

- ファイル: `public/games/mahjong/img/tsubame.webp`（512×512px）
- 用途: 対戦相手のカード・タイトルの顔ぶれ（下家）
- 内容: 朝霧つばめ。速攻好きの明るい大学生（20 歳くらいの女性）。明るい茶色のショートボブ、琥珀色の目、生成りのざっくりしたカーディガンに紺のインナー。自信のある人なつっこい笑顔で、何も描かれていない象牙色の麻雀牌を 1 枚、頬の横に持つ。胸から上・正面寄り・中央。背景は藍色のぼかしと暖色の玉ボケ。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: この 1 枚を基準画像にします（tsubame-win はこの画像を --cref で参照）。顔が画像の上 1/3〜中央に来ると、ゲームの丸い切り抜きにきれいに収まります。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait of a cheerful Japanese college student woman around 20, short light brown bob haircut, bright amber eyes, oversized cream knit cardigan over a navy top, confident friendly grin, holding one blank ivory mahjong tile beside her cheek, warm lantern light from the upper left, dark indigo background with soft warm bokeh, clean cel shading, thin lines, upper body, centered, looking at viewer --niji 6 --ar 1:1 --no text, letters, symbols on the tile, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, symbols or kanji on the tile, watermark, extra fingers, multiple people, busy background
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style bust portrait of a cheerful Japanese college student woman (about 20): short light-brown bob, bright amber eyes, oversized cream knit cardigan over a navy top, a confident friendly grin, holding one blank ivory mahjong tile beside her cheek. Warm lantern light from the upper left, dark indigo background with soft warm bokeh. Clean cel shading, thin lines, upper body, centered, looking at the viewer. Square 1:1, no text.
```

<a id="mahjong-tsubame-win"></a>

## 人物：朝霧つばめ（和了）

- ファイル: `public/games/mahjong/img/tsubame-win.webp`（512×512px）
- 用途: つばめが和了したときのカード・結果画面・最終順位（1 位のとき）
- 内容: 朝霧つばめの和了の表情。同じ人物・同じ服・同じ構図で、目を細めて大きく笑い、片手でガッツポーズ。まわりに小さなきらめき。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/tsubame.webp`](#mahjong-tsubame) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 生成した tsubame の画像を Midjourney にアップロードし、その URL を --cref に入れてください（--cw 100 で顔と服をそろえます）。構図・背景の色は tsubame と同じに。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
the same anime woman, short light brown bob, amber eyes, oversized cream knit cardigan over a navy top, laughing joyfully with eyes squeezed shut, one fist raised in triumph, small golden sparkles around her, warm lantern light from the upper left, dark indigo background with soft warm bokeh, clean cel shading, thin lines, upper body, centered --niji 6 --ar 1:1 --cref [tsubame.png の URL] --cw 100 --no text, letters, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, different hairstyle, different outfit, extra fingers
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same character as the reference image (short light-brown bob, amber eyes, cream knit cardigan over a navy top), now laughing joyfully with her eyes squeezed shut and one fist raised in triumph, a few small golden sparkles around her. Same lighting, background and framing as the reference. Anime style, clean cel shading, square 1:1, no text.
```

<a id="mahjong-genzo"></a>

## 人物：柳 源三（通常）

- ファイル: `public/games/mahjong/img/genzo.webp`（512×512px）
- 用途: 対戦相手のカード・タイトルの顔ぶれ（対面）
- 内容: 柳 源三。雀荘「宵月亭」の大旦那（70 代の男性）。整えた銀髪と短い白いあごひげ、細く穏やかな目。濃い緑の羽織に灰色の着物、湯のみを手に、落ち着いた微笑み。胸から上・中央。背景は藍色のぼかしと暖色の玉ボケ。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: genzo-win はこの画像を --cref で参照します。羽織に家紋などの模様が出たら消してください。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait of a calm elderly Japanese man in his seventies, neatly combed silver hair, short white beard, gentle narrow eyes, dark green haori jacket over a grey kimono, holding a small plain teacup, composed slight smile, warm lantern light from the upper left, dark indigo background with soft warm bokeh, clean cel shading, thin lines, upper body, centered, looking at viewer --niji 6 --ar 1:1 --no text, letters, crest symbols, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, family crest, watermark, extra fingers, multiple people, busy background
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style bust portrait of a calm elderly Japanese man in his seventies: neatly combed silver hair, a short white beard, gentle narrow eyes, a dark green haori jacket over a grey kimono, holding a small plain teacup, with a composed slight smile. Warm lantern light from the upper left, dark indigo background with soft warm bokeh. Clean cel shading, thin lines, upper body, centered. Square 1:1, no text.
```

<a id="mahjong-genzo-win"></a>

## 人物：柳 源三（和了）

- ファイル: `public/games/mahjong/img/genzo-win.webp`（512×512px）
- 用途: 源三が和了したときのカード・結果画面・最終順位（1 位のとき）
- 内容: 柳 源三の和了の表情。同じ人物・同じ服・同じ構図で、目尻にしわを寄せて満足そうに笑い、片手であごひげをなでる。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/genzo.webp`](#mahjong-genzo) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: genzo の URL を --cref に。--cw 100 で顔と服をそろえます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
the same elderly anime man, neatly combed silver hair, short white beard, dark green haori over a grey kimono, a hearty satisfied laugh with crinkled eyes, one hand stroking his beard, warm lantern light from the upper left, dark indigo background with soft warm bokeh, clean cel shading, thin lines, upper body, centered --niji 6 --ar 1:1 --cref [genzo.png の URL] --cw 100 --no text, letters, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, different outfit, younger face, extra fingers
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same character as the reference image (elderly man, silver hair, short white beard, dark green haori over a grey kimono), now laughing heartily with crinkled eyes and stroking his beard with one hand. Same lighting, background and framing as the reference. Anime style, clean cel shading, square 1:1, no text.
```

<a id="mahjong-rei"></a>

## 人物：白石レイ（通常）

- ファイル: `public/games/mahjong/img/rei.webp`（512×512px）
- 用途: 対戦相手のカード・タイトルの顔ぶれ（上家）
- 内容: 白石レイ。確率で考えるデータアナリスト（20 代後半の女性）。サイドで分けた長い黒髪、細い銀縁の眼鏡、落ち着いた切れ長の目。白いブラウスにチャコールのジャケット。腕を組み、自信のある小さな笑み。胸から上・中央。背景は藍色のぼかしと暖色の玉ボケ。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: rei-win はこの画像を --cref で参照します。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style bust portrait of a cool composed Japanese woman in her late twenties, long straight black hair with a side part, thin silver-rimmed glasses, calm sharp eyes, white blouse and charcoal blazer, arms folded, a small confident smile, warm lantern light from the upper left, dark indigo background with soft warm bokeh, clean cel shading, thin lines, upper body, centered, looking at viewer --niji 6 --ar 1:1 --no text, letters, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, extra fingers, multiple people, busy background
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style bust portrait of a cool, composed Japanese woman in her late twenties: long straight black hair with a side part, thin silver-rimmed glasses, calm sharp eyes, a white blouse and a charcoal blazer, arms folded, a small confident smile. Warm lantern light from the upper left, dark indigo background with soft warm bokeh. Clean cel shading, thin lines, upper body, centered. Square 1:1, no text.
```

<a id="mahjong-rei-win"></a>

## 人物：白石レイ（和了）

- ファイル: `public/games/mahjong/img/rei-win.webp`（512×512px）
- 用途: レイが和了したときのカード・結果画面・最終順位（1 位のとき）
- 内容: 白石レイの和了の表情。同じ人物・同じ服・同じ構図で、人さし指で眼鏡を押し上げ、静かに勝ち誇った笑み。レンズに小さな光。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/rei.webp`](#mahjong-rei) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: rei の URL を --cref に。--cw 100 で顔と服をそろえます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
the same anime woman, long straight black hair with a side part, thin silver-rimmed glasses, white blouse and charcoal blazer, pushing up her glasses with one finger, a quiet triumphant smile, a small glint of light on the lenses, warm lantern light from the upper left, dark indigo background with soft warm bokeh, clean cel shading, thin lines, upper body, centered --niji 6 --ar 1:1 --cref [rei.png の URL] --cw 100 --no text, letters, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, watermark, different hairstyle, different outfit, extra fingers
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same character as the reference image (long straight black hair, side part, thin silver-rimmed glasses, white blouse and charcoal blazer), now pushing up her glasses with one finger with a quiet triumphant smile and a small glint on the lenses. Same lighting, background and framing as the reference. Anime style, clean cel shading, square 1:1, no text.
```


---

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
| ⬜ | [`img/key.webp`](#matsuri-rhythm-key) | 1600×1000 | キービジュアル | 曲選び（タイトル）画面の背景（暗く重ねて、上にロゴと曲のカードを置きます） | Midjourney（v7） |
| ⬜ | [`img/bg-stage.webp`](#matsuri-rhythm-bg-stage) | 1600×1000 | 背景 | 演奏画面の背景（中央に 4 本のレーンが重なり、半分ほど暗くして表示） | Midjourney（v7） |
| ⬜ | [`img/jacket-1.webp`](#matsuri-rhythm-jacket-1) | 600×600 | カード | 曲選びのカード（1 曲目のジャケット） | Ideogram（3.0） |
| ⬜ | [`img/jacket-2.webp`](#matsuri-rhythm-jacket-2) | 600×600 | カード | 曲選びのカード（2 曲目のジャケット） | Ideogram（3.0） |
| ⬜ | [`img/jacket-3.webp`](#matsuri-rhythm-jacket-3) | 600×600 | カード | 曲選びのカード（3 曲目のジャケット） | Ideogram（3.0） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="matsuri-rhythm-key"></a>

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

<a id="matsuri-rhythm-bg-stage"></a>

## 背景：演奏画面（夜店の灯りのボケ）

- ファイル: `public/games/matsuri-rhythm/img/bg-stage.webp`（1600×1000px）
- 用途: 演奏画面の背景（中央に 4 本のレーンが重なり、半分ほど暗くして表示）
- 内容: 夜祭りの通りを低い位置から見上げた、提灯の灯りが大きくぼけた背景。中央の縦の帯は暗めで静かにし、左右に暖かい灯り。PC の横長でもスマホの縦長でも中央を切り抜いて使う。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/key.webp`](#matsuri-rhythm-key) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="matsuri-rhythm-jacket-1"></a>

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

<a id="matsuri-rhythm-jacket-2"></a>

## ジャケット：狐火の小径

- ファイル: `public/games/matsuri-rhythm/img/jacket-2.webp`（600×600px）
- 用途: 曲選びのカード（2 曲目のジャケット）
- 内容: 夜の竹やぶの細い小径に、青緑の狐火がふわふわと連なって浮かぶ。小径の脇の木の杭に、紙で作った白い狐のお面が掛けてある。藍と青緑の神秘的な色。1 枚目と同じ版画風。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- 参照画像: [`img/jacket-1.webp`](#matsuri-rhythm-jacket-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="matsuri-rhythm-jacket-3"></a>

## ジャケット：大輪の夜

- ファイル: `public/games/matsuri-rhythm/img/jacket-3.webp`（600×600px）
- 用途: 曲選びのカード（3 曲目のジャケット）
- 内容: 川の上の夜空に、菊のような大輪の花火がいくつも開く。手前に木の橋と夜店の屋根のシルエット、川面に花火が映る。金・紅・紫と濃紺。1 枚目と同じ版画風。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- 参照画像: [`img/jacket-1.webp`](#matsuri-rhythm-jacket-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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


---

# ナンプレ帖 ― 画像の生成プロンプト

ゲーム: `public/games/nanpure/`（4 枚中 0 枚が生成済み、4 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/nanpure/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

和紙と藍を基調にした、静かで清潔感のある和のトーン。色は生成り（クリーム）・藍・墨色に、朱と桜色を少しだけ。人物は出さない。画面の中に文字・数字・記号を入れない（数字はゲームの HTML で描くため）。やわらかな自然光と、大きめの余白。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/nanpure/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- nanpure` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- nanpure`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key-visual.webp`](#nanpure-key-visual) | 1200×900 | キービジュアル | タイトル画面（PC は左の大きな絵、スマホは上の帯。中央付近が切り抜かれて表示されます） | Midjourney（v7） |
| ⬜ | [`img/bg-washi.webp`](#nanpure-bg-washi) | 1024×1024 | タイル | ページ全体の背景（640px のタイルとして敷き詰め、32% の濃さで重ねます） | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/clear-illust.webp`](#nanpure-clear-illust) | 960×540 | イベント絵 | 問題を解いたときの結果カードの上部（16:9） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pause-tea.webp`](#nanpure-pause-tea) | 512×512（透過） | アイテム | 一時停止中に盤面の上に表示（透過） | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="nanpure-key-visual"></a>

## キービジュアル：朝の文机と和紙

- ファイル: `public/games/nanpure/img/key-visual.webp`（1200×900px）
- 用途: タイトル画面（PC は左の大きな絵、スマホは上の帯。中央付近が切り抜かれて表示されます）
- 内容: 朝の光が障子ごしに差しこむ和室の文机。和紙の束、硯と筆、湯のみのお茶。障子の桟の影が、ナンプレのマス目のような格子になって机に落ちている。藍と生成りの落ち着いた色。文字や数字は入れない。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 紙の上に文字が出たら Vary (Region) で消してください。スマホでは中央が横長に切り抜かれるので、主役（湯のみと格子の影）は中央に。

**Midjourney（v7）用のプロンプト**

```text
a quiet Japanese study corner in the morning, low wooden writing desk with a stack of handmade washi paper, an inkstone and a calligraphy brush, a small ceramic cup of green tea, soft sunlight through a shoji screen casting a neat grid of window-frame shadows across the desk, indigo and warm cream palette, calm minimal composition with generous empty space, gentle film grain, still life, no people --ar 4:3 --v 7 --style raw --no text, letters, numbers, writing, calligraphy characters, watermark, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
A calm still life of a Japanese study corner in the morning: a low wooden desk with handmade washi paper, an inkstone, a brush and a cup of green tea. Sunlight through a shoji screen casts a neat grid of shadows over the desk. Indigo and warm cream colours, minimal composition with plenty of empty space, soft natural light. No people, no text, no letters, no numbers. Landscape 4:3.
```

<a id="nanpure-bg-washi"></a>

## 背景：和紙のテクスチャ（タイル）

- ファイル: `public/games/nanpure/img/bg-washi.webp`（1024×1024px）
- 用途: ページ全体の背景（640px のタイルとして敷き詰め、32% の濃さで重ねます）
- 内容: 手すきの和紙を真上からスキャンしたような、継ぎ目なく並べられるテクスチャ。生成り色で、楮（こうぞ）の繊維がうっすら見える程度。影・折り目・しみはなし。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択
- メモ: Leonardo の「Tiling」をオンにして 1024×1024 で生成。コントラストが強いと数字が読みにくくなるので、できるだけ淡いものを選んでください。

**Leonardo.Ai（Phoenix）用のプロンプト**

```text
seamless tileable texture of handmade Japanese washi paper, warm cream colour, faint kozo fibres and soft uneven pulp, very low contrast, flat even lighting, top-down scan, no objects
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, shadows, vignette, folds, creases, stains, border, frame, pattern, objects
```

**ほかのツール用（共通の英文プロンプト）**

```text
A seamless, tileable texture of handmade Japanese washi paper scanned from directly above: warm cream colour, faint long paper fibres, soft uneven pulp, very low contrast and perfectly even lighting. No shadows, folds, stains, borders or text. Square 1:1.
```

<a id="nanpure-clear-illust"></a>

## クリアの絵：夕暮れの縁側

- ファイル: `public/games/nanpure/img/clear-illust.webp`（960×540px）
- 用途: 問題を解いたときの結果カードの上部（16:9）
- 内容: 一問解き終えたあとの、ほっとする夕暮れの縁側。障子を開けた和室から小さな庭が見え、紅葉の木と石灯籠。縁側には湯のみと、閉じた帳面と筆。人物はいない。あたたかい夕日の色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 結果カードの右下に「新記録」の判が重なるので、右下は落ち着いた色に。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime background art, a wooden engawa veranda of a traditional Japanese house at golden sunset, open shoji doors, a small garden with a maple tree and a stone lantern, a cup of tea and a closed notebook with a brush resting on the veranda floor, warm peaceful mood, soft glowing light, gentle clouds, detailed scenery, no characters --niji 6 --ar 16:9 --no text, letters, numbers, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style background painting of a traditional Japanese wooden veranda (engawa) at golden sunset: open shoji doors, a small garden with a maple tree and a stone lantern, a cup of tea and a closed notebook with a brush on the veranda floor. Warm, peaceful, softly glowing light. No characters, no text. Landscape 16:9.
```

<a id="nanpure-pause-tea"></a>

## 一時停止の絵：お茶と和菓子

- ファイル: `public/games/nanpure/img/pause-tea.webp`（512×512px・背景は透過）
- 用途: 一時停止中に盤面の上に表示（透過）
- 内容: 湯のみに入った緑茶と、小皿にのった桜色の練り切り（和菓子）ひとつ。やさしい水彩風のフラットなイラスト。背景は透明。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: 透過 PNG が出せない場合は、白の無地の背景で作ってください（自動で切り抜きます）。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create one illustration: a cup of Japanese green tea in a simple ceramic yunomi cup with a soft indigo glaze, and beside it a small plate holding one pink-and-white flower-shaped wagashi sweet. Gentle watercolour-like flat illustration, cream, indigo and soft pink colours, seen from a slight angle, centred with a little margin. Transparent background PNG, square 1024×1024. No text, no letters, no table, no drop shadow on the background.
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single centred illustration of a cup of Japanese green tea in an indigo-glazed ceramic cup, with a small plate holding one pink flower-shaped wagashi sweet beside it. Soft watercolour-like flat style in cream, indigo and pink. Plain white background (to be cut out), square 1:1, no text.
```


---

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
| ⬜ | [`img/key-visual.webp`](#oekaki-logic-key-visual) | 1200×900 | キービジュアル | タイトル画面（PC は左の大きな絵、スマホは左上の小さな絵。中央付近が切り抜かれます） | Midjourney（v7） |
| ⬜ | [`img/bg-paper.webp`](#oekaki-logic-bg-paper) | 1600×1000 | 背景 | 一覧・プレイ画面の背景（50% の濃さで重ねます） | Adobe Firefly（Image 4） |
| ⬜ | [`img/gallery-bg.webp`](#oekaki-logic-gallery-bg) | 1600×900 | 背景 | 「絵巻」（完成した絵のギャラリー）の背景（明るい色を重ねます） | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/deco-kumo.webp`](#oekaki-logic-deco-kumo) | 800×240（透過） | UI 部品 | 完成画面のカードの上と、絵巻の見出しの飾り（透過） | Recraft（V3） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="oekaki-logic-key-visual"></a>

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

<a id="oekaki-logic-bg-paper"></a>

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

<a id="oekaki-logic-gallery-bg"></a>

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

<a id="oekaki-logic-deco-kumo"></a>

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


---

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
| ⬜ | [`img/key.webp`](#orizuru-shooting-key) | 1600×1000 | キービジュアル | タイトル画面の背景（中央に HTML のタイトル文字が重なります） | Midjourney（v7） |
| ⬜ | [`img/bg-stage1.webp`](#orizuru-shooting-bg-stage1) | 720×1280 | 背景 | 第一幕のゲーム画面の背景（縦にスクロール、薄く表示） | Midjourney（v7） |
| ⬜ | [`img/bg-stage2.webp`](#orizuru-shooting-bg-stage2) | 720×1280 | 背景 | 第二幕のゲーム画面の背景（縦にスクロール、薄く表示） | Midjourney（v7） |
| ⬜ | [`img/bg-stage3.webp`](#orizuru-shooting-bg-stage3) | 720×1280 | 背景 | 第三幕のゲーム画面の背景（縦にスクロール、薄く表示） | Midjourney（v7） |
| ⬜ | [`img/boss-1.webp`](#orizuru-shooting-boss-1) | 768×768 | イベント絵 | 第一幕の主が現れるときの紹介カード | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/boss-2.webp`](#orizuru-shooting-boss-2) | 768×768 | イベント絵 | 第二幕の主が現れるときの紹介カード | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/boss-3.webp`](#orizuru-shooting-boss-3) | 768×768 | イベント絵 | 第三幕の主が現れるときの紹介カード | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="orizuru-shooting-key"></a>

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

<a id="orizuru-shooting-bg-stage1"></a>

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

<a id="orizuru-shooting-bg-stage2"></a>

## 背景：第二幕「切り絵の夜川」（真上から）

- ファイル: `public/games/orizuru-shooting/img/bg-stage2.webp`（720×1280px）
- 用途: 第二幕のゲーム画面の背景（縦にスクロール、薄く表示）
- 内容: 真上から見た夜の川。藍色の和紙の水面に切り絵の波と葦、岸辺には小さな紙の灯籠がぽつぽつと暖かく灯る。藍と紫の静かな色調で、コントラストは低め。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-stage1.webp`](#orizuru-shooting-bg-stage1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="orizuru-shooting-bg-stage3"></a>

## 背景：第三幕「折り紙の天守」（真上から）

- ファイル: `public/games/orizuru-shooting/img/bg-stage3.webp`（720×1280px）
- 用途: 第三幕のゲーム画面の背景（縦にスクロール、薄く表示）
- 内容: 夕焼けの空から見下ろした、折り紙で組まれた城の屋根。朱と金の重なる屋根瓦、紅や琥珀色の紙の雲、金箔の小さなかけら。劇的だがコントラストは低め。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-stage1.webp`](#orizuru-shooting-bg-stage1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="orizuru-shooting-boss-1"></a>

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

<a id="orizuru-shooting-boss-2"></a>

## 主：夜川に棲む切り絵の大鯉「スミゴイ」

- ファイル: `public/games/orizuru-shooting/img/boss-2.webp`（768×768px）
- 用途: 第二幕の主が現れるときの紹介カード
- 内容: 黒い紙を切り抜いた切り絵の大きな鯉。鱗は細かな切り抜き模様、ひれは朱色の紙。藍色の紙の波を上へと泳ぐ。生成りの和紙の背景。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示
- 参照画像: [`img/boss-1.webp`](#orizuru-shooting-boss-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="orizuru-shooting-boss-3"></a>

## 主：天守を守る紙の龍「カミナギ」

- ファイル: `public/games/orizuru-shooting/img/boss-3.webp`（768×768px）
- 用途: 第三幕の主が現れるときの紹介カード
- 内容: 朱と金の紙を折って作った長い龍が、夕焼けの紙の城の屋根に巻きつく。鋭い折り目、細い紙の帯でできたひげ、金色の角。生成りの和紙の背景。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示
- 参照画像: [`img/boss-1.webp`](#orizuru-shooting-boss-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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


---

# 喫茶しろくろ ― 画像の生成プロンプト

ゲーム: `public/games/reversi/`（6 枚中 0 枚が生成済み、6 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/reversi/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

昭和レトロの純喫茶「しろくろ」。飴色の木のカウンター、深緑のビロードのソファ、ステンドグラスのランプ、サイフォンのコーヒー、さくらんぼの乗ったクリームソーダ。あたたかい電球色の光と、少しくすんだ落ち着いた色。人物はやさしい線のアニメ調（セル塗り＋淡い影）、背景は絵画的。画像の中に文字・看板の文字・ロゴ・透かしは入れません。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/reversi/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- reversi` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- reversi`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#reversi-key) | 1600×900 | キービジュアル | タイトル画面の背景（全面）。右側に設定パネルが重なるので、主役は左寄りに | Ideogram（3.0） |
| ⬜ | [`img/bg-cafe.webp`](#reversi-bg-cafe) | 1600×1000 | 背景 | 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示） | Midjourney（v7） |
| ⬜ | [`img/portrait-hinata.webp`](#reversi-portrait-hinata) | 512×512 | 人物 | 入門の対局相手（マスターの孫娘） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-mugi.webp`](#reversi-portrait-mugi) | 512×512 | 人物 | 初級の対局相手（店の看板猫） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-ritsuko.webp`](#reversi-portrait-ritsuko) | 512×512 | 人物 | 中級の対局相手（昼休みに来る常連） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-master.webp`](#reversi-portrait-master) | 512×512 | 人物 | 上級の対局相手（喫茶しろくろの店主） | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="reversi-key"></a>

## キービジュアル：純喫茶のテーブルとリバーシ盤

- ファイル: `public/games/reversi/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景（全面）。右側に設定パネルが重なるので、主役は左寄りに
- 内容: 昭和レトロな純喫茶の窓際の席。木のテーブルの上に、黒と白の丸い石が並んだ木製のリバーシ盤、湯気の立つコーヒーカップ、さくらんぼの乗った緑のクリームソーダ。ステンドグラスのランプのあたたかい光、窓の外は夕暮れの商店街がぼんやり。人物なし。左側に盤とグラス、右側は落ち着いた余白。
- おすすめのツール: [Ideogram（3.0）](https://ideogram.ai/) ― サイズ: 縦横比を画面で選択
- メモ: Ideogram は「Magic Prompt」をオフ、スタイルは Illustration / Design、縦横比 16:9。文字が入りやすいので、看板・メニューに文字が出たら Negative に追加して作り直します。盤のマス目は 8×8 でなくても遠目なら問題ありません。

**Ideogram（3.0）用のプロンプト**

```text
Retro Japanese kissaten cafe interior, poster-like still life composition: a wooden reversi board with round black and white discs on a varnished wooden table by the window, a steaming cup of coffee, a green cream soda with a red cherry, a stained-glass table lamp casting warm amber light, deep green velvet sofa, blurred dusk shopping street outside the window. Main objects in the left third, calm darker space on the right. Warm nostalgic Showa era mood, painterly anime background illustration, soft light. No text, no letters, no signage, no logo, no people.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, signage, logo, watermark, people, hands, grid with more or less than 8x8 squares
```

**ほかのツール用（共通の英文プロンプト）**

```text
Painterly anime-style illustration of a retro Japanese coffee shop (kissaten) by the window: a wooden reversi board with black and white discs on a varnished table, a steaming coffee cup, a green cream soda with a cherry, a stained-glass lamp with warm amber light, green velvet sofa, blurred dusk street outside. Main objects in the left third, calm space on the right. No people, no text. Wide 16:9.
```

<a id="reversi-bg-cafe"></a>

## 背景：純喫茶の店内（ぼかし）

- ファイル: `public/games/reversi/img/bg-cafe.webp`（1600×1000px）
- 用途: 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示）
- 内容: 純喫茶の店内を少しぼかした背景。カウンター、サイフォン、ステンドグラスのランプ、深緑のソファ、壁の振り子時計。電球色の光が点々と丸くぼける。中央は暗めで情報が少なく、コントラスト低め。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/key.webp`](#reversi-key) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: キービジュアルと同じ店に見えるよう、key の画像 URL を --sref に付けて色調をそろえます。中央に盤が重なるので、中央は暗く単調に。

**Midjourney（v7）用のプロンプト**

```text
interior of a quiet retro Japanese kissaten coffee shop at night, wooden counter with glass coffee siphons, stained-glass lamps, deep green velvet booth seats, pendulum wall clock, warm amber light with soft round bokeh, shallow depth of field, dim and low contrast, darker calm center, painterly anime background art, nostalgic Showa era mood, no people --ar 16:10 --v 7 --style raw --no text, letters, signage, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, signage, people, bright white areas
```

**ほかのツール用（共通の英文プロンプト）**

```text
Painterly anime-style background: the inside of a quiet retro Japanese coffee shop at night, wooden counter with glass coffee siphons, stained-glass lamps, green velvet booth seats, a pendulum clock, warm amber light with soft bokeh, shallow depth of field, dim and low contrast with a darker calm center. No people, no text. Aspect ratio 16:10.
```

<a id="reversi-portrait-hinata"></a>

## 人物：ひなた（入門・マスターの孫）

- ファイル: `public/games/reversi/img/portrait-hinata.webp`（512×512px）
- 用途: 入門の対局相手（マスターの孫娘）
- 内容: マスターの孫、小学 2 年生の女の子「ひなた」。茶色の髪を左右のおさげにして、黄色いカーディガン。カウンター席でオレンジジュースのストローをくわえ、にこにこ。胸から上、淡いクリーム色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 4 人の対局相手は niji でそろえます。最初の 1 枚の画像 URL を、残りの 3 枚に --sref として付けてください。顔が中央に来るように（丸い枠で切り抜いて表示します）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a cheerful seven-year-old Japanese girl with brown hair in two short pigtails, yellow cardigan over a white collared blouse, big bright smile, holding a glass of orange juice with a striped straw, warm amber cafe light, plain pale cream background, centered composition, gentle anime illustration with soft cel shading --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a cheerful seven-year-old Japanese girl: brown hair in two short pigtails, yellow cardigan over a white blouse, big smile, holding a glass of orange juice with a striped straw. Warm light, plain pale cream background, centered, square 1:1. No text.
```

<a id="reversi-portrait-mugi"></a>

## 人物：むぎ（初級・看板猫）

- ファイル: `public/games/reversi/img/portrait-mugi.webp`（512×512px）
- 用途: 初級の対局相手（店の看板猫）
- 内容: 喫茶店の看板猫、茶トラの「むぎ」。ふっくらした体でテーブルの隅にちょこんと座り、金色の目で得意げにこちらを見る。首に小さな赤いスカーフ。胸から上、淡いクリーム色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-hinata.webp`](#reversi-portrait-hinata) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-hinata の画像 URL を --sref に付けて絵柄をそろえます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a plump orange tabby cat sitting neatly at the corner of a wooden cafe table, golden eyes, proud satisfied expression, a small red neckerchief, warm amber cafe light, plain pale cream background, centered composition, gentle anime illustration with soft cel shading --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, human, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a plump orange tabby cat sitting at the corner of a wooden table, golden eyes, proud satisfied expression, small red neckerchief. Warm light, plain pale cream background, centered, square 1:1. No text.
```

<a id="reversi-portrait-ritsuko"></a>

## 人物：律子（中級・常連の会社員）

- ファイル: `public/games/reversi/img/portrait-ritsuko.webp`（512×512px）
- 用途: 中級の対局相手（昼休みに来る常連）
- 内容: 昼休みに来る常連の会社員「律子」、20 代後半。黒髪のボブ、紺のジャケットに白いシャツ。片手にコーヒーカップ、もう片方の手を口元に当てて次の手を考える、落ち着いた表情。胸から上、淡いクリーム色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-hinata.webp`](#reversi-portrait-hinata) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-hinata の画像 URL を --sref に付けて絵柄をそろえます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a composed Japanese office worker woman in her late twenties, short black bob haircut, navy blazer over a white shirt, holding a coffee cup in one hand, the other hand thoughtfully near her chin, calm focused expression with a slight smile, warm amber cafe light, plain pale cream background, centered composition, gentle anime illustration with soft cel shading --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, ID badge text, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a composed Japanese office worker woman in her late twenties: short black bob, navy blazer over a white shirt, holding a coffee cup, other hand near her chin, calm focused expression with a slight smile. Warm light, plain pale cream background, centered, square 1:1. No text.
```

<a id="reversi-portrait-master"></a>

## 人物：マスター（上級・店主）

- ファイル: `public/games/reversi/img/portrait-master.webp`（512×512px）
- 用途: 上級の対局相手（喫茶しろくろの店主）
- 内容: 喫茶しろくろの店主、60 代のマスター。きれいに整えた白髪まじりのオールバックと口ひげ、白いシャツに黒いベストと蝶ネクタイ。布でコーヒーカップを磨きながら、穏やかだが目は鋭い笑み。胸から上、淡いクリーム色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-hinata.webp`](#reversi-portrait-hinata) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-hinata の画像 URL を --sref に付けて絵柄をそろえます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a dignified Japanese cafe owner in his sixties, neatly slicked-back gray hair and a trimmed mustache, white shirt with a black vest and a black bow tie, polishing a coffee cup with a cloth, calm gentle smile with sharp knowing eyes, warm amber cafe light, plain pale cream background, centered composition, gentle anime illustration with soft cel shading --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a dignified Japanese cafe owner in his sixties: slicked-back gray hair, trimmed mustache, white shirt, black vest and bow tie, polishing a coffee cup with a cloth, calm smile with sharp knowing eyes. Warm light, plain pale cream background, centered, square 1:1. No text.
```


---

# 花明かりの写真館 ― 画像の生成プロンプト

ゲーム: `public/games/sakura-novel/`（27 枚中 0 枚が生成済み、27 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/sakura-novel/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

架空の坂の町「春見町（はるみちょう）」を舞台にした、やわらかな水彩調のアニメイラスト。淡い桜色・若草色・生成り色が基調で、夕方は琥珀色、夜は藍色とぼんぼりの橙。線は細く、光はやさしく拡散し、少し褪せたフィルム写真のような懐かしい空気。写実的すぎず、ゆったりした余白。画像の中に文字・読める看板・ロゴ・透かしを入れない。【人物設定（各プロンプトにも同じ記述を入れています）】桐野小春（17歳・主人公の相棒）：あご丈の栗色のボブ、左側に小さな桜の髪留め、琥珀色の瞳、明るい表情、生成りのニットカーディガンに白い襟付きブラウス、オリーブ色のプリーツスカート、茶色の革ストラップの古いフィルムカメラを首から下げる。芹沢灯（17歳）：腰まである黒髪のストレートを紺のリボンでハーフアップ、落ち着いた灰色の瞳、細い銀縁の丸眼鏡、白い丸襟の紺のワンピースに生成りのエプロン。桐野清（78歳・写真館の主人）：短く整えた白髪、太い白い眉、やさしい奥目、少し猫背、白い立ち襟のシャツに焦げ茶のニットベスト、袖をまくり、灰色のウールのズボン、首から老眼鏡のひも。芹沢春江（74歳・灯の祖母）：小柄、銀白の髪を低いまとめ髪にしてべっ甲の櫛、やわらかな笑いじわ、薄紫のカーディガンに淡いクリーム色のブラウス、灰色のロングスカート。若いころの春江（1973年・21歳）：肩までの黒髪で毛先が外はね、白いブラウスに淡い黄色のスカート。立ち絵はすべて膝上の構図・正面やや斜め・同じ縮尺（頭の上に少し余白）で、表情違いは基本の絵をもとに表情だけを変えます。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/sakura-novel/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- sakura-novel` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- sakura-novel`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/title-bg.webp`](#sakura-novel-title-bg) | 1600×900 | 背景 | タイトル画面の背景（まだどの結末も見ていないとき）。左側にタイトルの文字を重ねます | Midjourney（v7） |
| ⬜ | [`img/key-visual.webp`](#sakura-novel-key-visual) | 1600×900 | キービジュアル | どれかの結末を見たあとのタイトル画面の背景・ギャラリー | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/bg-station.webp`](#sakura-novel-bg-station) | 1600×900 | 背景 | 序章の到着・結末の見送りの場面 | Midjourney（v7） |
| ⬜ | [`img/bg-slope-day.webp`](#sakura-novel-bg-slope-day) | 1600×900 | 背景 | 物語の中心の場所。昼の場面・回想（セピア）・夕方（色を重ねて） | Midjourney（v7） |
| ⬜ | [`img/bg-slope-night.webp`](#sakura-novel-bg-slope-night) | 1600×900 | 背景 | 前夜と、最後の夜の場面 | Midjourney（v7） |
| ⬜ | [`img/bg-studio-out.webp`](#sakura-novel-bg-studio-out) | 1600×900 | 背景 | 写真館の前の場面 | Midjourney（v7） |
| ⬜ | [`img/bg-studio-in.webp`](#sakura-novel-bg-studio-in) | 1600×900 | 背景 | 写真館の中の場面（いちばん多く出てくる背景） | Midjourney（v7） |
| ⬜ | [`img/bg-darkroom.webp`](#sakura-novel-bg-darkroom) | 1600×900 | 背景 | 第三章、写真を焼く場面 | Midjourney（v7） |
| ⬜ | [`img/bg-bookshop.webp`](#sakura-novel-bg-bookshop) | 1600×900 | 背景 | 第二章、灯の家の古書店 | Midjourney（v7） |
| ⬜ | [`img/bg-river-dusk.webp`](#sakura-novel-bg-river-dusk) | 1600×900 | 背景 | 第四章と灯の結末、川原の場面（夜は色を重ねて） | Midjourney（v7） |
| ⬜ | [`img/ch-koharu-normal.webp`](#sakura-novel-ch-koharu-normal) | 720×1080（透過） | 人物 | 立ち絵：桐野小春・ふつうの表情（ほかの表情の元の絵） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-koharu-smile.webp`](#sakura-novel-ch-koharu-smile) | 720×1080（透過） | 人物 | 立ち絵：小春・満面の笑み | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-koharu-surprised.webp`](#sakura-novel-ch-koharu-surprised) | 720×1080（透過） | 人物 | 立ち絵：小春・おどろいた顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-koharu-sad.webp`](#sakura-novel-ch-koharu-sad) | 720×1080（透過） | 人物 | 立ち絵：小春・さびしげな顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-akari-normal.webp`](#sakura-novel-ch-akari-normal) | 720×1080（透過） | 人物 | 立ち絵：芹沢灯・ふつうの表情（ほかの表情の元の絵） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-akari-smile.webp`](#sakura-novel-ch-akari-smile) | 720×1080（透過） | 人物 | 立ち絵：灯・やわらかいほほえみ | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-akari-shy.webp`](#sakura-novel-ch-akari-shy) | 720×1080（透過） | 人物 | 立ち絵：灯・照れた顔／少しおどろいた顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-akari-sad.webp`](#sakura-novel-ch-akari-sad) | 720×1080（透過） | 人物 | 立ち絵：灯・うれいを帯びた顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-kiyoshi-normal.webp`](#sakura-novel-ch-kiyoshi-normal) | 720×1080（透過） | 人物 | 立ち絵：桐野清・ふつうの表情（ほかの表情の元の絵） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-kiyoshi-smile.webp`](#sakura-novel-ch-kiyoshi-smile) | 720×1080（透過） | 人物 | 立ち絵：清・口もとだけの小さな笑み | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-kiyoshi-distant.webp`](#sakura-novel-ch-kiyoshi-distant) | 720×1080（透過） | 人物 | 立ち絵：清・昔を思う遠い目 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-harue-normal.webp`](#sakura-novel-ch-harue-normal) | 720×1080（透過） | 人物 | 立ち絵：芹沢春江（灯の祖母） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-harue-smile.webp`](#sakura-novel-ch-harue-smile) | 720×1080（透過） | 人物 | 立ち絵：春江・目を細めたほほえみ | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cg-photo.webp`](#sakura-novel-cg-photo) | 1600×900 | イベント絵 | 第一章で見つかる、物語の鍵になる古い写真 | Adobe Firefly（Image 4） |
| ⬜ | [`img/cg-koharu.webp`](#sakura-novel-cg-koharu) | 1600×900 | イベント絵 | 小春の結末のイベント絵 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cg-akari.webp`](#sakura-novel-cg-akari) | 1600×900 | イベント絵 | 灯の結末のイベント絵 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cg-night.webp`](#sakura-novel-cg-night) | 1600×900 | イベント絵 | 真の結末のイベント絵 | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="sakura-novel-title-bg"></a>

## タイトル背景：夜明けの花見坂

- ファイル: `public/games/sakura-novel/img/title-bg.webp`（1600×900px）
- 用途: タイトル画面の背景（まだどの結末も見ていないとき）。左側にタイトルの文字を重ねます
- 内容: 夜明けの淡い光の中、坂の下から見上げた桜並木の石畳の坂。坂の上に小さな木造の写真館がシルエットで見える。朝もやと舞う花びら。人物なし。左側は文字を置くために空や霞で静かに空けておく。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 左 1/3 にタイトル（HTML の文字）が重なります。明るすぎると文字が読みにくいので、左側はやや淡く。bg-slope-day と同じ坂・同じ大桜に見えるよう、坂の形をそろえると効果的です。

**Midjourney（v7）用のプロンプト**

```text
wide view looking up a long stone-paved slope in a small Japanese hillside town at dawn, both sides lined with old cherry trees in full bloom, a small two-storey wooden photo studio silhouetted at the top of the hill, soft morning mist, drifting cherry petals, pale pink and lavender sky, calm empty space on the left third, soft watercolor anime background art, gentle diffused light, nostalgic, no people, no text --ar 16:9 --v 7 --style raw --no text, letters, signage, logo, watermark, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, readable signs, logo, watermark, people, cars, power lines in the foreground
```

**ほかのツール用（共通の英文プロンプト）**

```text
A wide view looking up a long stone-paved slope in a small Japanese hillside town at dawn. Both sides are lined with old cherry trees in full bloom; a small two-storey wooden photo studio stands silhouetted at the top. Soft morning mist, drifting petals, pale pink and lavender sky. Leave the left third calm and empty for a title. Soft watercolor anime background style, no people, no text. 16:9.
```

<a id="sakura-novel-key-visual"></a>

## キービジュアル：小春と灯、桜の坂

- ファイル: `public/games/sakura-novel/img/key-visual.webp`（1600×900px）
- 用途: どれかの結末を見たあとのタイトル画面の背景・ギャラリー
- 内容: 満開の桜の坂の上で、カメラを構えて笑う小春と、本を胸に抱いて振り向く灯。後ろに坂の上の写真館と大桜。青空と舞う花びら。人物は画面の右寄りに置き、左は文字のために空ける。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-koharu-normal.webp`](#sakura-novel-ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 人物の見た目は立ち絵（ch-koharu-normal・ch-akari-normal）と同じにします。niji では --cref に立ち絵の URL を 2 つ指定すると揃いやすくなります。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
key visual, two 17-year-old Japanese girls on a cherry-blossom slope in spring, girl A: chin-length chestnut-brown bob with a small cherry blossom hair clip on the left, warm amber eyes, cream knit cardigan over white collared blouse, olive green pleated skirt, holding up a vintage film camera on a brown leather strap and smiling; girl B: waist-length straight black hair half-up with a navy ribbon, calm grey eyes, thin silver round glasses, navy dress with white round collar and beige apron, hugging a cloth-bound book and looking back gently; behind them a huge old cherry tree with a weathered wooden bench and a small wooden photo studio at the top of the slope, blue sky, flying petals, characters placed on the right half, soft watercolor anime style --niji 6 --ar 16:9 --no text, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, watermark, extra people, school uniform, heavy outlines
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime key visual, 16:9. Two 17-year-old Japanese girls on a cherry-blossom slope in spring. Girl A: chin-length chestnut-brown bob with a small cherry-blossom clip on the left, amber eyes, cream knit cardigan over a white collared blouse, olive-green pleated skirt, holding up a vintage film camera on a brown leather strap and smiling. Girl B: waist-length straight black hair half-up with a navy ribbon, grey eyes, thin silver round glasses, navy dress with a white round collar and a beige apron, hugging a cloth-bound book and looking back gently. Behind them a huge old cherry tree with a weathered wooden bench and a small wooden photo studio at the top. Blue sky, flying petals. Place the girls on the right half; keep the left half calm for a title. Soft watercolor anime style, no text.
```

<a id="sakura-novel-bg-station"></a>

## 背景：春見駅のホーム

- ファイル: `public/games/sakura-novel/img/bg-station.webp`（1600×900px）
- 用途: 序章の到着・結末の見送りの場面
- 内容: 山あいの小さな町の単線の駅。木のベンチと古い屋根のホーム、柵の向こうに桜。昼前のやわらかな光。人物なし、駅名などの文字なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 背景はすべて Midjourney で、同じ --style raw と同じ言い回し（soft watercolor anime background art）を使い、色調をそろえます。最初の 1 枚の URL を --sref に入れて残りを作ると統一感が出ます。

**Midjourney（v7）用のプロンプト**

```text
a small rural single-track train station platform in a quiet Japanese hillside town in spring, old wooden roof and a wooden bench, cherry trees blooming beyond a low fence, gentle hills, late morning soft light, soft watercolor anime background art, nostalgic, no people, signboards left blank --ar 16:9 --v 7 --style raw --no text, letters, logo, people, train
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, readable station names, logo, people, train
```

**ほかのツール用（共通の英文プロンプト）**

```text
A small rural single-track train station platform in a quiet Japanese hillside town in spring: old wooden roof, a wooden bench, cherry trees blooming beyond a low fence, gentle hills, late-morning soft light. Soft watercolor anime background, no people, signboards blank, no text. 16:9.
```

<a id="sakura-novel-bg-slope-day"></a>

## 背景：花見坂と大桜（昼）

- ファイル: `public/games/sakura-novel/img/bg-slope-day.webp`（1600×900px）
- 用途: 物語の中心の場所。昼の場面・回想（セピア）・夕方（色を重ねて）
- 内容: 丘の上へまっすぐのびる石畳の坂。両側に桜並木、坂のなかほどにひときわ太い大桜と、その根もとに色あせた木のベンチ。坂の上に小さな写真館。春の青空。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#sakura-novel-bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 大桜とベンチは画面の中央〜やや右に。夕方の場面ではゲームがこの絵に琥珀色を重ね、回想ではセピアにします。

**Midjourney（v7）用のプロンプト**

```text
a long straight stone-paved slope climbing a hill in a small Japanese town, both sides lined with old cherry trees in bloom, midway a huge ancient cherry tree with a massive trunk and a weathered silver-grey wooden bench under it, small old houses, a little two-storey wooden photo studio at the top of the slope, blue spring sky, petals on the stones, soft watercolor anime background art, gentle light, eye-level view from the middle of the slope, no people --ar 16:9 --v 7 --style raw --no text, letters, logo, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, people, cars
```

**ほかのツール用（共通の英文プロンプト）**

```text
A long straight stone-paved slope climbing a hill in a small Japanese town, lined on both sides with old cherry trees in bloom. Midway stands a huge ancient cherry tree with a massive trunk and a weathered silver-grey wooden bench beneath it. Small old houses, a little two-storey wooden photo studio at the top, blue spring sky, petals on the stones. Soft watercolor anime background, eye-level, no people, no text. 16:9.
```

<a id="sakura-novel-bg-slope-night"></a>

## 背景：夜桜の花見坂

- ファイル: `public/games/sakura-novel/img/bg-slope-night.webp`（1600×900px）
- 用途: 前夜と、最後の夜の場面
- 内容: bg-slope-day と同じ坂の夜。両側にぼんぼり（紙の灯籠）が並び、桜がほのかに白く浮かぶ「花明かり」。藍色の夜空、大桜とベンチ。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-slope-day.webp`](#sakura-novel-bg-slope-day) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 昼の bg-slope-day を参照画像（--sref や画像プロンプト）にして、同じ構図の夜にすると自然です。

**Midjourney（v7）用のプロンプト**

```text
the same stone-paved cherry slope at night, rows of glowing paper lanterns along both sides, cherry blossoms softly glowing pale white in the lantern light, a huge old cherry tree with a weathered wooden bench midway, deep indigo sky with a few stars, warm orange and cool blue, quiet and dreamy, soft watercolor anime background art, no people --ar 16:9 --v 7 --style raw --no text, letters, logo, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, people, fireworks
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same stone-paved cherry slope at night: rows of glowing paper lanterns along both sides, the blossoms glowing pale white in the lantern light, the huge old cherry tree with its weathered wooden bench midway, deep indigo sky with a few stars. Warm orange and cool blue, quiet and dreamy. Soft watercolor anime background, no people, no text. 16:9.
```

<a id="sakura-novel-bg-studio-out"></a>

## 背景：桐野写真館（外観）

- ファイル: `public/games/sakura-novel/img/bg-studio-out.webp`（1600×900px）
- 用途: 写真館の前の場面
- 内容: 坂の上の、白いペンキのはげかけた木造二階建ての小さな写真館。緑色の扉、写真の額がたくさん並んだショーウィンドウ（写真の中身はぼかす）。足もとに桜の花びら。人物・文字なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#sakura-novel-bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
exterior of a small old two-storey wooden photo studio at the top of a hill, peeling white paint, a green wooden front door with a small brass bell, a wide display window filled with many framed photographs of a cherry tree (blurred, indistinct), a cherry branch reaching in from the side, petals on the step, warm afternoon light, soft watercolor anime background art, no people --ar 16:9 --v 7 --style raw --no text, letters, signboard text, logo, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, shop name, logo, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
Exterior of a small old two-storey wooden photo studio at the top of a hill: peeling white paint, a green wooden front door with a small brass bell, a wide display window filled with many framed photographs of a cherry tree (blurred), a cherry branch reaching in from the side, petals on the step, warm afternoon light. Soft watercolor anime background, no people, no text or shop name. 16:9.
```

<a id="sakura-novel-bg-studio-in"></a>

## 背景：写真館の店内

- ファイル: `public/games/sakura-novel/img/bg-studio-in.webp`（1600×900px）
- 用途: 写真館の中の場面（いちばん多く出てくる背景）
- 内容: 古い木の床と木のカウンター、壁に額入りの記念写真（顔はぼかす）、奥に背景布をおろした撮影スペースと三脚にのった大きな木製の古いカメラ。窓から午後のあたたかな光。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#sakura-novel-bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
interior of an old Japanese neighbourhood photo studio, worn wooden floor and a wooden counter, framed family portraits on the walls with faces blurred, a studio corner with a lowered grey backdrop cloth and a large antique wooden view camera on a tripod, a window with a cherry tree outside, warm afternoon light and dust in the air, soft watercolor anime background art, cozy, no people --ar 16:9 --v 7 --style raw --no text, letters, logo, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, people, modern equipment
```

**ほかのツール用（共通の英文プロンプト）**

```text
Interior of an old Japanese neighbourhood photo studio: worn wooden floor and counter, framed family portraits on the walls (faces blurred), a studio corner with a lowered grey backdrop and a large antique wooden view camera on a tripod, a window with a cherry tree outside, warm afternoon light and dust in the air. Soft watercolor anime background, cozy, no people, no text. 16:9.
```

<a id="sakura-novel-bg-darkroom"></a>

## 背景：赤い光の暗室

- ファイル: `public/games/sakura-novel/img/bg-darkroom.webp`（1600×900px）
- 用途: 第三章、写真を焼く場面
- 内容: 赤いセーフライトだけが灯る写真の暗室。三つ並んだ現像用のバット、古い引き伸ばし機、洗濯ばさみで吊るした印画紙（絵柄はぼんやり）。赤と黒の静かな空間。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#sakura-novel-bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
a small photographic darkroom lit only by a red safelight, three trays of developer liquid in a row on a wooden bench, an old enlarger, prints hanging on a line with clothes pegs (images vague), glass bottles of chemicals, deep red glow and soft black shadows, quiet and intimate, soft watercolor anime background art, no people --ar 16:9 --v 7 --style raw --no text, letters, labels, logo, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, bottle labels, logo, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
A small photographic darkroom lit only by a red safelight: three developer trays in a row on a wooden bench, an old enlarger, prints hanging on a line with clothes pegs (images vague), glass chemical bottles, deep red glow and soft black shadows. Quiet and intimate. Soft watercolor anime background, no people, no text or labels. 16:9.
```

<a id="sakura-novel-bg-bookshop"></a>

## 背景：古書店「坂下堂」

- ファイル: `public/games/sakura-novel/img/bg-bookshop.webp`（1600×900px）
- 用途: 第二章、灯の家の古書店
- 内容: 駅前の小さな古書店。天井まで届く本棚、窓ぎわに小さな喫茶のカウンターとコーヒーカップ、ランプのあたたかい光、光の中のほこり。人物なし、本の背表紙の文字は読めないように。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#sakura-novel-bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
inside a small old secondhand bookshop near a country station, floor-to-ceiling wooden bookshelves, a tiny cafe counter by the window with two coffee cups, a small blackboard with no writing, warm lamplight and spring light from the window, dust floating in the light, cozy and quiet, soft watercolor anime background art, no people --ar 16:9 --v 7 --style raw --no text, letters, readable book titles, logo, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, readable book spines, logo, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
Inside a small old secondhand bookshop near a country station: floor-to-ceiling wooden shelves, a tiny cafe counter by the window with two coffee cups, a blank small blackboard, warm lamplight and spring light from the window, dust floating in the light. Cozy and quiet. Soft watercolor anime background, no people, no readable text. 16:9.
```

<a id="sakura-novel-bg-river-dusk"></a>

## 背景：灯川の土手（夕暮れ）

- ファイル: `public/games/sakura-novel/img/bg-river-dusk.webp`（1600×900px）
- 用途: 第四章と灯の結末、川原の場面（夜は色を重ねて）
- 内容: 夕暮れの川の土手。川面が金色に光り、土手の桜並木にぼんぼりが等間隔に吊るされている（まだ灯っていない）。遊歩道、遠くの山なみ。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#sakura-novel-bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
a grassy river embankment in a small Japanese town at dusk, the wide calm river reflecting a golden sunset, a row of cherry trees along the bank with unlit paper lanterns hung at even intervals, a narrow footpath, distant soft blue hills, warm amber and violet sky, soft watercolor anime background art, nostalgic, no people --ar 16:9 --v 7 --style raw --no text, letters, logo, people, bridge with signs
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
A grassy river embankment in a small Japanese town at dusk: the wide calm river reflecting a golden sunset, a row of cherry trees along the bank with unlit paper lanterns hung at even intervals, a narrow footpath, distant soft blue hills, amber and violet sky. Soft watercolor anime background, nostalgic, no people, no text. 16:9.
```

<a id="sakura-novel-ch-koharu-normal"></a>

## 小春（ふつう）

- ファイル: `public/games/sakura-novel/img/ch-koharu-normal.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：桐野小春・ふつうの表情（ほかの表情の元の絵）
- 内容: 桐野小春（17歳）。あご丈の栗色のボブ、左側に小さな桜の髪留め、琥珀色の瞳、生成りのニットカーディガンに白い襟付きブラウス、オリーブ色のプリーツスカート、首から茶色の革ストラップのフィルムカメラ。膝上・正面やや斜め、やわらかい笑み。白の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- メモ: 表情違い（smile / surprised / sad）は、この絵を Gemini に添付して表情だけ変えます。背景は真っ白の無地に（このツールが自動で切り抜きます）。気に入った 1 枚の URL を、ほかの人物でも --sref に使うと画風がそろいます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
visual novel character sprite, knee-up standing pose, a 17-year-old Japanese girl, chin-length chestnut-brown bob with a small cherry blossom hair clip on the left side, warm amber eyes, cream knit cardigan over a white collared blouse, olive green pleated skirt, a vintage film camera on a brown leather strap around her neck, hands holding the camera lightly, gentle friendly smile, facing the viewer slightly turned, small margin above the head, centered, soft watercolor anime style with thin clean lines, plain pure white background --niji 6 --ar 2:3 --no text, background scenery, shadow on floor, cropped head
```

**ネガティブプロンプト（入れたくないもの）**

```text
background scenery, text, watermark, cropped head, extra fingers, school uniform
```

**ほかのツール用（共通の英文プロンプト）**

```text
Visual-novel character sprite, knee-up standing pose, 2:3 portrait. A 17-year-old Japanese girl: chin-length chestnut-brown bob with a small cherry-blossom hair clip on the left, warm amber eyes, cream knit cardigan over a white collared blouse, olive-green pleated skirt, a vintage film camera on a brown leather strap around her neck, held lightly in her hands. Gentle friendly smile, facing the viewer slightly turned, small margin above the head, centred. Soft watercolor anime style with thin clean lines. Plain pure white background, nothing else.
```

<a id="sakura-novel-ch-koharu-smile"></a>

## 小春（笑顔）

- ファイル: `public/games/sakura-novel/img/ch-koharu-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：小春・満面の笑み
- 内容: ch-koharu-normal と同じ小春で、目を細めた満面の笑み。服・髪・ポーズ・大きさ・白い背景はそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-koharu-normal.webp`](#sakura-novel-ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 必ず ch-koharu-normal の完成画像を添付して編集します。出力が元の絵とずれたら「表情以外は 1 ピクセルも変えないで」と追加で頼みます。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-koharu-normal). Keep everything exactly the same — her face shape, chin-length chestnut-brown bob, the small cherry-blossom clip on the left, amber eyes, cream knit cardigan, white collared blouse, olive-green pleated skirt, the film camera on its brown leather strap, the pose, the size and position in the frame, and the plain white background. Change only her facial expression to a big happy smile with her eyes gently closed into crescents and a little blush. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same 17-year-old girl as the reference image (chin-length chestnut-brown bob, small cherry-blossom clip on the left, amber eyes, cream knit cardigan over a white collared blouse, olive-green pleated skirt, vintage film camera on a brown leather strap), same knee-up pose and framing, plain white background; only the expression changes: a big happy smile with eyes closed into crescents and a light blush. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-koharu-surprised"></a>

## 小春（おどろき）

- ファイル: `public/games/sakura-novel/img/ch-koharu-surprised.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：小春・おどろいた顔
- 内容: ch-koharu-normal と同じ小春で、目を丸くして口を小さく開けたおどろきの表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-koharu-normal.webp`](#sakura-novel-ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-koharu-normal). Keep everything exactly the same — face shape, chin-length chestnut-brown bob, cherry-blossom clip on the left, amber eyes, cream knit cardigan, white collared blouse, olive-green pleated skirt, film camera on the brown leather strap, pose, size, framing and the plain white background. Change only her facial expression to surprise: eyes wide open, eyebrows raised, mouth slightly open in a small 'oh'. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same 17-year-old girl as the reference image, same clothes, camera, pose and framing on a plain white background; only the expression changes to surprise: wide eyes, raised eyebrows, mouth slightly open. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-koharu-sad"></a>

## 小春（さびしげ）

- ファイル: `public/games/sakura-novel/img/ch-koharu-sad.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：小春・さびしげな顔
- 内容: ch-koharu-normal と同じ小春で、眉を下げて目をふせた、さびしげな表情。泣いてはいない。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-koharu-normal.webp`](#sakura-novel-ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-koharu-normal). Keep everything exactly the same — face shape, chin-length chestnut-brown bob, cherry-blossom clip on the left, amber eyes, cream knit cardigan, white collared blouse, olive-green pleated skirt, film camera on the brown leather strap, pose, size, framing and the plain white background. Change only her facial expression to a quiet, wistful sadness: eyebrows lowered, eyes cast down, lips pressed softly, no tears. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same 17-year-old girl as the reference image, same clothes, camera, pose and framing on a plain white background; only the expression changes to quiet wistful sadness: lowered eyebrows, downcast eyes, no tears. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-akari-normal"></a>

## 灯（ふつう）

- ファイル: `public/games/sakura-novel/img/ch-akari-normal.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：芹沢灯・ふつうの表情（ほかの表情の元の絵）
- 内容: 芹沢灯（17歳）。腰まである黒髪のストレートを紺のリボンでハーフアップ、落ち着いた灰色の瞳、細い銀縁の丸眼鏡、白い丸襟の紺のワンピースに生成りのエプロン、布張りの本を胸の前で持つ。膝上・正面やや斜め、静かな表情。白の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- メモ: ch-koharu-normal と同じ画風・同じ縮尺に（--sref に小春の完成画像の URL を指定）。表情違いは Gemini でこの絵を編集します。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
visual novel character sprite, knee-up standing pose, a 17-year-old Japanese girl, waist-length straight black hair in a half-up style tied with a navy ribbon, calm grey eyes, thin silver round glasses, navy blue long-sleeve dress with a white round collar, beige apron with a small pocket, holding a cloth-bound book in front of her chest with both hands, calm quiet expression with a faint polite smile, facing the viewer slightly turned, small margin above the head, centered, soft watercolor anime style with thin clean lines, plain pure white background --niji 6 --ar 2:3 --no text, background scenery, cropped head
```

**ネガティブプロンプト（入れたくないもの）**

```text
background scenery, text, watermark, cropped head, extra fingers, school uniform
```

**ほかのツール用（共通の英文プロンプト）**

```text
Visual-novel character sprite, knee-up standing pose, 2:3 portrait. A 17-year-old Japanese girl: waist-length straight black hair half-up with a navy ribbon, calm grey eyes, thin silver round glasses, navy long-sleeve dress with a white round collar, beige apron with a small pocket, holding a cloth-bound book in front of her chest. Calm quiet expression with a faint polite smile, slightly turned, small margin above the head, centred. Soft watercolor anime style, thin clean lines. Plain pure white background.
```

<a id="sakura-novel-ch-akari-smile"></a>

## 灯（ほほえみ）

- ファイル: `public/games/sakura-novel/img/ch-akari-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：灯・やわらかいほほえみ
- 内容: ch-akari-normal と同じ灯で、目もとをゆるめたやわらかなほほえみ。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-akari-normal.webp`](#sakura-novel-ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-akari-normal). Keep everything exactly the same — face shape, waist-length straight black hair half-up with the navy ribbon, grey eyes, thin silver round glasses, navy dress with white round collar, beige apron, the cloth-bound book, pose, size, framing and the plain white background. Change only her facial expression to a soft, warm smile with relaxed eyes. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same girl as the reference image (waist-length black hair half-up with a navy ribbon, grey eyes, thin silver round glasses, navy dress with white collar, beige apron, cloth-bound book), same pose and framing on a plain white background; only the expression changes to a soft warm smile. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-akari-shy"></a>

## 灯（てれ）

- ファイル: `public/games/sakura-novel/img/ch-akari-shy.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：灯・照れた顔／少しおどろいた顔
- 内容: ch-akari-normal と同じ灯で、頬を赤らめて視線をそらし、本で口もとを少し隠す照れた表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-akari-normal.webp`](#sakura-novel-ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-akari-normal). Keep everything exactly the same — face shape, black half-up hair with the navy ribbon, grey eyes, thin silver round glasses, navy dress, beige apron, size, framing and the plain white background. Change only her expression and hands slightly: cheeks blushing, eyes looking aside, the cloth-bound book raised a little to half-hide her mouth, shy. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same girl as the reference image, same clothes and framing on a plain white background; she is shy: blushing cheeks, eyes looking aside, the book raised a little to half-hide her mouth. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-akari-sad"></a>

## 灯（うれい）

- ファイル: `public/games/sakura-novel/img/ch-akari-sad.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：灯・うれいを帯びた顔
- 内容: ch-akari-normal と同じ灯で、眉をよせて目をふせた、心配そうなうれいの表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-akari-normal.webp`](#sakura-novel-ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-akari-normal). Keep everything exactly the same — face shape, black half-up hair with the navy ribbon, grey eyes, thin silver round glasses, navy dress, beige apron, the book, pose, size, framing and the plain white background. Change only her facial expression to quiet worry: eyebrows drawn together, eyes cast down, lips slightly parted, no tears. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same girl as the reference image, same clothes, book, pose and framing on a plain white background; only the expression changes to quiet worry: drawn eyebrows, downcast eyes, no tears. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-kiyoshi-normal"></a>

## 清（ふつう）

- ファイル: `public/games/sakura-novel/img/ch-kiyoshi-normal.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：桐野清・ふつうの表情（ほかの表情の元の絵）
- 内容: 桐野清（78歳・写真館の主人）。短く整えた白髪、太い白い眉、やさしい奥目、少し猫背。白い立ち襟のシャツの袖をまくり、焦げ茶のニットベスト、灰色のウールのズボン、首から老眼鏡のひも。無口で、むすっとしているがやさしい顔。膝上。白の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- メモ: 小春・灯と同じ画風・同じ縮尺に（--sref に小春の完成画像）。背が少し低く、猫背気味に。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
visual novel character sprite, knee-up standing pose, a 78-year-old Japanese man, a gentle old photographer, short neatly combed white hair, thick white eyebrows, kind deep-set eyes, slight stoop, white band-collar shirt with rolled sleeves, dark brown knitted vest, grey wool trousers, reading glasses hanging on a cord around his neck, hands clasped behind his back, calm reserved expression, facing the viewer slightly turned, small margin above the head, centered, soft watercolor anime style with thin clean lines, plain pure white background --niji 6 --ar 2:3 --no text, background scenery, cropped head
```

**ネガティブプロンプト（入れたくないもの）**

```text
background scenery, text, watermark, cropped head, cane, suit and tie
```

**ほかのツール用（共通の英文プロンプト）**

```text
Visual-novel character sprite, knee-up standing pose, 2:3 portrait. A 78-year-old Japanese man, a gentle old photographer: short neatly combed white hair, thick white eyebrows, kind deep-set eyes, slight stoop, white band-collar shirt with rolled sleeves, dark brown knitted vest, grey wool trousers, reading glasses on a cord around his neck, hands clasped behind his back. Calm, reserved expression, slightly turned, small margin above the head, centred. Soft watercolor anime style, thin clean lines. Plain pure white background.
```

<a id="sakura-novel-ch-kiyoshi-smile"></a>

## 清（ほほえみ）

- ファイル: `public/games/sakura-novel/img/ch-kiyoshi-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：清・口もとだけの小さな笑み
- 内容: ch-kiyoshi-normal と同じ清で、目じりにしわを寄せた、口もとだけの控えめな笑み。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-kiyoshi-normal.webp`](#sakura-novel-ch-kiyoshi-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this old man (ch-kiyoshi-normal). Keep everything exactly the same — face, short white hair, thick white eyebrows, white band-collar shirt with rolled sleeves, dark brown knitted vest, grey trousers, reading glasses on a cord, pose, size, framing and the plain white background. Change only his facial expression to a small, restrained smile: crinkles at the corners of the eyes, the mouth just slightly lifted. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same old photographer as the reference image, same clothes, pose and framing on a plain white background; only the expression changes to a small restrained smile with crinkled eyes. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-kiyoshi-distant"></a>

## 清（遠い目）

- ファイル: `public/games/sakura-novel/img/ch-kiyoshi-distant.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：清・昔を思う遠い目
- 内容: ch-kiyoshi-normal と同じ清で、少し横を向いて遠くを見る、昔を思うようなしずかな表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-kiyoshi-normal.webp`](#sakura-novel-ch-kiyoshi-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this old man (ch-kiyoshi-normal). Keep everything exactly the same — face, short white hair, thick white eyebrows, clothes, reading glasses on a cord, body pose, size, framing and the plain white background. Change only his expression and gaze: head turned slightly to the side, eyes looking far away into the distance, a quiet, wistful, remembering look. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same old photographer as the reference image, same clothes and framing on a plain white background; he looks slightly aside into the distance with a quiet, wistful, remembering expression. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-ch-harue-normal"></a>

## 春江（ふつう）

- ファイル: `public/games/sakura-novel/img/ch-harue-normal.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：芹沢春江（灯の祖母）
- 内容: 芹沢春江（74歳）。小柄、銀白の髪を低いまとめ髪にしてべっ甲の櫛、やわらかな笑いじわ、薄紫のカーディガンに淡いクリーム色のブラウス、灰色のロングスカート、肩にうすいショール。おだやかな表情。膝上。白の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター。透過: 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）
- メモ: ほかの立ち絵と同じ画風・同じ縮尺で（小柄なので、頭の位置は小春より少し下）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
visual novel character sprite, knee-up standing pose, a small gentle 74-year-old Japanese woman, silver-white hair in a low bun with a tortoiseshell comb, soft smile lines, kind eyes, lavender cardigan over a pale cream blouse, long grey skirt, a thin shawl over her shoulders, hands folded in front, calm serene expression, facing the viewer slightly turned, small margin above the head, centered, soft watercolor anime style with thin clean lines, plain pure white background --niji 6 --ar 2:3 --no text, background scenery, cropped head
```

**ネガティブプロンプト（入れたくないもの）**

```text
background scenery, text, watermark, cropped head, walking stick, kimono
```

**ほかのツール用（共通の英文プロンプト）**

```text
Visual-novel character sprite, knee-up standing pose, 2:3 portrait. A small gentle 74-year-old Japanese woman: silver-white hair in a low bun with a tortoiseshell comb, soft smile lines, kind eyes, lavender cardigan over a pale cream blouse, long grey skirt, a thin shawl over her shoulders, hands folded in front. Calm serene expression, slightly turned, small margin above the head, centred. Soft watercolor anime style. Plain pure white background.
```

<a id="sakura-novel-ch-harue-smile"></a>

## 春江（ほほえみ）

- ファイル: `public/games/sakura-novel/img/ch-harue-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：春江・目を細めたほほえみ
- 内容: ch-harue-normal と同じ春江で、目を細めてうれしそうにほほえむ表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-harue-normal.webp`](#sakura-novel-ch-harue-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this elderly woman (ch-harue-normal). Keep everything exactly the same — face, silver-white hair in a low bun with the tortoiseshell comb, lavender cardigan, cream blouse, grey skirt, shawl, pose, size, framing and the plain white background. Change only her facial expression to a warm, happy smile with her eyes narrowed and the smile lines deepened. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same elderly woman as the reference image, same clothes and framing on a plain white background; only the expression changes to a warm happy smile with narrowed eyes. Soft watercolor anime style, 2:3.
```

<a id="sakura-novel-cg-photo"></a>

## イベント絵：古い写真（昭和四十八年の春）

- ファイル: `public/games/sakura-novel/img/cg-photo.webp`（1600×900px）
- 用途: 第一章で見つかる、物語の鍵になる古い写真
- 内容: 1970 年代の色あせたカラーフィルム写真そのもの。満開の大桜の下、風に吹かれた髪を片手でおさえて笑う 21 歳の女性（肩までの黒髪・毛先が外はね・白いブラウスに淡い黄色のスカート）、うしろに木のベンチ。周りに白いふち、少し黄ばんだ退色。文字なし。
- おすすめのツール: [Adobe Firefly（Image 4）](https://firefly.adobe.com/) ― サイズ: 縦横比を画面で選択
- メモ: 写真風の素材なので Firefly（写真のスタイル）に。人物は若いころの春江です。スマホの縦画面では左右が切れるので、写真は画面の中央に。

**Adobe Firefly（Image 4）用のプロンプト**

```text
A faded 1970s color film photograph, slightly yellowed with soft warm color shift and fine grain, a thin white border around the print. Under a huge old cherry tree in full bloom, a 21-year-old Japanese woman with shoulder-length black hair flipped out at the ends, wearing a white blouse and a pale yellow skirt, laughs while holding her wind-blown hair with one hand and looks straight at the camera. A plain wooden bench behind her, petals in the air. Candid, warm, nostalgic. No text, no date stamp. Aspect ratio 16:9 (the print placed in the centre on a dark wooden table).
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, date stamp, watermark, modern clothes, smartphone
```

**ほかのツール用（共通の英文プロンプト）**

```text
A faded 1970s colour film photograph (slightly yellowed, fine grain, thin white border) lying in the centre of a dark wooden table, 16:9. In the photo: under a huge old cherry tree in full bloom, a 21-year-old Japanese woman with shoulder-length black hair flipped out at the ends, white blouse and pale yellow skirt, laughs while holding her wind-blown hair with one hand and looks straight at the camera; a plain wooden bench behind her; petals in the air. Candid and nostalgic, no text, no date stamp.
```

<a id="sakura-novel-cg-koharu"></a>

## イベント絵：ファインダー越しの春（小春）

- ファイル: `public/games/sakura-novel/img/cg-koharu.webp`（1600×900px）
- 用途: 小春の結末のイベント絵
- 内容: 朝の花見坂、花吹雪の中で、フィルムカメラを胸の高さに下ろしてこちらに笑いかける小春。大桜とベンチが背景に。やわらかな逆光。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-koharu-normal.webp`](#sakura-novel-ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 小春の見た目は立ち絵 ch-koharu-normal と同じに（--cref に完成画像の URL、--cw 80 前後）。スマホでは左右が切れるので人物は中央に。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
visual novel event CG, a 17-year-old Japanese girl with a chin-length chestnut-brown bob and a small cherry blossom hair clip on the left, warm amber eyes, cream knit cardigan over a white collared blouse, olive green pleated skirt, standing on a stone-paved cherry slope in the morning, lowering her vintage film camera on a brown leather strap to chest height and smiling brightly at the viewer, a storm of cherry petals, a huge old cherry tree with a weathered wooden bench behind her, soft backlight and lens glow, emotional and warm, soft watercolor anime style, subject in the centre --niji 6 --ar 16:9 --no text, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, watermark, extra people
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime event illustration, 16:9. A 17-year-old Japanese girl (chin-length chestnut-brown bob, small cherry-blossom clip on the left, amber eyes, cream knit cardigan over a white collared blouse, olive-green pleated skirt) stands on a stone-paved cherry slope in the morning, lowering her vintage film camera (brown leather strap) to chest height and smiling brightly at the viewer. A storm of petals, a huge old cherry tree with a weathered bench behind her, soft backlight. Warm and emotional, soft watercolor anime style, subject centred, no text.
```

<a id="sakura-novel-cg-akari"></a>

## イベント絵：川面の灯（灯）

- ファイル: `public/games/sakura-novel/img/cg-akari.webp`（1600×900px）
- 用途: 灯の結末のイベント絵
- 内容: 夜の川の土手、灯ったぼんぼりの列の下で、手紙を胸に持ち、眼鏡にあかりを映して照れたようにほほえむ灯。川面にぼんぼりの光と桜の花びら。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-akari-normal.webp`](#sakura-novel-ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 灯の見た目は立ち絵 ch-akari-normal と同じに（--cref）。この場面ではエプロンを外しています。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
visual novel event CG, a 17-year-old Japanese girl with waist-length straight black hair half-up with a navy ribbon, calm grey eyes, thin silver round glasses reflecting warm light, navy dress with a white round collar, standing on a river embankment at night under a row of glowing paper lanterns and cherry trees, holding a small letter to her chest, a shy soft smile toward the viewer, lantern light and cherry petals reflected on the dark water, warm orange and deep blue, gentle and romantic, soft watercolor anime style, subject in the centre --niji 6 --ar 16:9 --no text, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, watermark, extra people, apron
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime event illustration, 16:9. A 17-year-old Japanese girl (waist-length straight black hair half-up with a navy ribbon, grey eyes, thin silver round glasses, navy dress with a white round collar) on a river embankment at night under a row of glowing paper lanterns and cherry trees, holding a small letter to her chest with a shy soft smile. Lantern light and petals reflected on the dark water; warm orange and deep blue. Soft watercolor anime style, subject centred, no text.
```

<a id="sakura-novel-cg-night"></a>

## イベント絵：花明かりの下の再会

- ファイル: `public/games/sakura-novel/img/cg-night.webp`（1600×900px）
- 用途: 真の結末のイベント絵
- 内容: 夜桜の大桜の下、ぼんぼりの光。ベンチに座る春江に、清が古い茶封筒を両手で差しだしている。花びらが舞い、ふたりとも涙ぐみながら笑っている。少し離れた手前に、カメラを構えた小春と、春江を見守る灯の後ろ姿がぼんやりと。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-kiyoshi-normal.webp`](#sakura-novel-ch-kiyoshi-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 清・春江の見た目は立ち絵（ch-kiyoshi-normal・ch-harue-normal）と同じに（--cref を 2 つ）。背景は bg-slope-night の大桜に似せると物語がつながります。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
visual novel event CG, night, a huge old cherry tree glowing pale white in the light of paper lanterns, under it a small 74-year-old Japanese woman with silver-white hair in a low bun and a tortoiseshell comb, lavender cardigan and shawl, sitting on a weathered wooden bench, and a 78-year-old man with short white hair, thick white eyebrows, white band-collar shirt and dark brown knitted vest, offering her an old brown paper envelope with both hands, both smiling with teary eyes, petals falling slowly, in the soft-focus foreground the backs of two teenage girls, one with a chestnut bob holding a film camera, one with long black half-up hair, deep indigo night and warm lantern glow, tender and quiet, soft watercolor anime style --niji 6 --ar 16:9 --no text, logo, watermark
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, watermark, kiss, dramatic crying
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime event illustration, 16:9, night. A huge old cherry tree glowing pale white in lantern light. Under it, a small 74-year-old Japanese woman (silver-white low bun with a tortoiseshell comb, lavender cardigan, shawl) sits on a weathered wooden bench while a 78-year-old man (short white hair, thick white eyebrows, white band-collar shirt, dark brown knitted vest) offers her an old brown paper envelope with both hands; both smile with teary eyes. Petals fall slowly. In the soft-focus foreground, the backs of two teenage girls: one with a chestnut bob holding a film camera, one with long black half-up hair. Deep indigo night, warm lantern glow, tender and quiet. Soft watercolor anime style, no text.
```


---

# こしば日和 ― 画像の生成プロンプト

ゲーム: `public/games/shiba-ikusei/`（14 枚中 0 枚が生成済み、14 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/shiba-ikusei/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

やわらかな絵本調のイラスト。生成り・はちみつ色・若草色・空色の、あたたかく明るい配色。輪郭はやさしく、影は少なめで、ほっとする家庭的な空気。画像の中に文字・ロゴ・透かしを入れない。【犬の設定（オリジナル。各プロンプトにも同じ記述を入れています）】赤柴の子犬：毛はあたたかいはちみつ色の赤茶、ほほ・口のまわり・のど・胸・おなか・足の内側・しっぽの裏が生成り色（裏白）、目の上に小さな生成り色の点（麻呂眉）、黒い鼻、こげ茶の丸い目、三角の立ち耳、背中でくるんと巻いたしっぽ、首に若草色の首輪と小さな金色の鈴。成長段階：子犬（頭が大きく、ころころした体、短い足、耳は少し小さめ）、若犬（手足が伸びて少しスリム、耳が大きく見える）、成犬（がっしりした体、凛とした顔つき、ふさふさの胸毛）。部屋の背景はゲームが犬・家具をコードで重ねるので、床の中央〜下 1/3 をあけておきます。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/shiba-ikusei/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- shiba-ikusei` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- shiba-ikusei`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key-visual.webp`](#shiba-ikusei-key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（右側に子犬、左側にタイトルの文字） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/room-day.webp`](#shiba-ikusei-room-day) | 1200×1200 | 背景 | 部屋の背景（現実の時計で 5〜16 時）。犬・家具はコードで重ねます | Midjourney（v7） |
| ⬜ | [`img/room-evening.webp`](#shiba-ikusei-room-evening) | 1200×1200 | 背景 | 部屋の背景（16〜19 時） | Midjourney（v7） |
| ⬜ | [`img/room-night.webp`](#shiba-ikusei-room-night) | 1200×1200 | 背景 | 部屋の背景（19〜5 時） | Midjourney（v7） |
| ⬜ | [`img/walk-bg.webp`](#shiba-ikusei-walk-bg) | 2400×800 | 背景 | さんぽのミニゲームの遠景（横にスクロールし、くり返しつなげて表示） | Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111） |
| ⬜ | [`img/shiba-puppy-normal.webp`](#shiba-ikusei-shiba-puppy-normal) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：子犬・ふつう（ほかの 8 枚の元の絵） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-puppy-happy.webp`](#shiba-ikusei-shiba-puppy-happy) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：子犬・ごきげん | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-puppy-sad.webp`](#shiba-ikusei-shiba-puppy-sad) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：子犬・しょんぼり（すねている） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-young-normal.webp`](#shiba-ikusei-shiba-young-normal) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：若犬・ふつう | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-young-happy.webp`](#shiba-ikusei-shiba-young-happy) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：若犬・ごきげん | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-young-sad.webp`](#shiba-ikusei-shiba-young-sad) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：若犬・しょんぼり | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-adult-normal.webp`](#shiba-ikusei-shiba-adult-normal) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：成犬・ふつう | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-adult-happy.webp`](#shiba-ikusei-shiba-adult-happy) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：成犬・ごきげん | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-adult-sad.webp`](#shiba-ikusei-shiba-adult-sad) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：成犬・しょんぼり | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="shiba-ikusei-key-visual"></a>

## キービジュアル：窓辺の柴犬の子犬

- ファイル: `public/games/shiba-ikusei/img/key-visual.webp`（1600×900px）
- 用途: タイトル画面の背景（右側に子犬、左側にタイトルの文字）
- 内容: 日だまりの木の床に、赤いゴムボールを前においてちょこんと座り、首をかしげてこちらを見る赤柴の子犬。大きな窓の外に庭と青空、舞う花びら。子犬は画面の右寄り、左側は文字のためにやわらかく空ける。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-ikusei-shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 犬の見た目は立ち絵（shiba-puppy-normal）と同じに。niji では --cref に完成した shiba-puppy-normal の URL を指定すると揃います。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
a cute original red Shiba Inu puppy sitting on a sunny wooden floor by a large window, honey-brown coat with cream markings on the cheeks, muzzle, throat, chest and belly, small cream eyebrow dots above the eyes, black nose, round dark brown eyes, triangular upright ears, curled tail, light green collar with a small golden bell, head tilted curiously toward the viewer, a red rubber ball with a white stripe in front of its paws, garden and blue sky outside the window, a few drifting petals, warm afternoon light, soft picture-book illustration, gentle colors, puppy placed on the right third, calm empty space on the left --niji 6 --ar 16:9 --no text, logo, watermark, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, watermark, people, extra dogs, realistic photo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Picture-book style illustration, 16:9. A cute original red Shiba Inu puppy (honey-brown coat with cream markings on the cheeks, muzzle, throat, chest and belly; small cream eyebrow dots; black nose; round dark-brown eyes; triangular upright ears; curled tail; light-green collar with a small golden bell) sits on a sunny wooden floor by a large window, head tilted curiously toward the viewer, a red rubber ball with a white stripe before its paws. Garden and blue sky outside, a few drifting petals, warm afternoon light. Puppy on the right third, calm empty space on the left for a title. No text, no people.
```

<a id="shiba-ikusei-room-day"></a>

## 背景：へや（昼）

- ファイル: `public/games/shiba-ikusei/img/room-day.webp`（1200×1200px）
- 用途: 部屋の背景（現実の時計で 5〜16 時）。犬・家具はコードで重ねます
- 内容: 日本の家の明るいリビングの一角を正面から。木の床（下 40% ほど）、生成り色の壁、中央に大きな窓（外は庭と空）、窓の下に低い木の棚。床の中央はなにも置かずにあける。動物・人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 床と壁の境目は画面の高さの 55〜60% あたりに。スマホの縦長・PC の横長の両方でトリミングされるので、大事なものは中央に寄せます。昼・夕方・夜の 3 枚は同じ構図に（2 枚目以降はこの画像を --sref／画像プロンプトに）。

**Midjourney（v7）用のプロンプト**

```text
front view of a cozy corner of a Japanese family living room, warm wooden floorboards filling the lower 40 percent, cream plaster wall, a large wooden-framed window in the centre showing a small garden and blue sky, a low wooden shelf under the window with a few small plants, soft daylight, the floor in the centre and lower third left completely empty, soft picture-book illustration, warm gentle colors, flat perspective, no animals, no people --ar 1:1 --v 7 --style raw --no text, letters, logo, animals, people, furniture in the centre
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, animals, people, sofa or table in the centre of the floor
```

**ほかのツール用（共通の英文プロンプト）**

```text
Front view of a cozy corner of a Japanese family living room, square 1:1. Warm wooden floorboards fill the lower 40%, cream plaster wall, a large wooden-framed window in the centre showing a small garden and blue sky, a low wooden shelf under the window with a few small plants, soft daylight. Leave the centre and the lower third of the floor completely empty (the game draws the dog and furniture there). Soft picture-book illustration, warm gentle colours, flat perspective, no animals, no people, no text.
```

<a id="shiba-ikusei-room-evening"></a>

## 背景：へや（夕方）

- ファイル: `public/games/shiba-ikusei/img/room-evening.webp`（1200×1200px）
- 用途: 部屋の背景（16〜19 時）
- 内容: room-day と同じ部屋・同じ構図の夕方。窓の外は夕焼け、部屋に琥珀色の光が斜めに差しこむ。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/room-day.webp`](#shiba-ikusei-room-day) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
the same cozy Japanese living room corner at sunset, same composition: wooden floor in the lower 40 percent, cream wall, large wooden-framed window in the centre with an orange and pink sunset sky over the garden, warm amber light slanting across the floor, low wooden shelf with small plants, the centre of the floor left empty, soft picture-book illustration, no animals, no people --ar 1:1 --v 7 --style raw --no text, letters, logo, animals, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, animals, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same cozy Japanese living-room corner at sunset, same composition (wooden floor in the lower 40%, cream wall, large wooden window in the centre, low shelf with small plants). Orange and pink sunset sky outside, warm amber light slanting across the floor. Centre of the floor empty. Soft picture-book illustration, square, no animals, no people, no text.
```

<a id="shiba-ikusei-room-night"></a>

## 背景：へや（夜）

- ファイル: `public/games/shiba-ikusei/img/room-night.webp`（1200×1200px）
- 用途: 部屋の背景（19〜5 時）
- 内容: room-day と同じ部屋・同じ構図の夜。窓の外に月と星、部屋はスタンドの小さなあかりで青とオレンジの静かな色。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/room-day.webp`](#shiba-ikusei-room-day) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
the same cozy Japanese living room corner at night, same composition: wooden floor in the lower 40 percent, cream wall in blue shadow, large wooden-framed window in the centre with a crescent moon and stars over the dark garden, a small warm floor lamp glow on the side, low wooden shelf with small plants, calm and sleepy mood, the centre of the floor left empty, soft picture-book illustration, no animals, no people --ar 1:1 --v 7 --style raw --no text, letters, logo, animals, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, animals, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same cozy Japanese living-room corner at night, same composition. A crescent moon and stars over the dark garden outside the window, the room in calm blue shadow with a small warm lamp glow on one side, sleepy mood. Centre of the floor empty. Soft picture-book illustration, square, no animals, no people, no text.
```

<a id="shiba-ikusei-walk-bg"></a>

## 背景：さんぽ道（横につながる）

- ファイル: `public/games/shiba-ikusei/img/walk-bg.webp`（2400×800px）
- 用途: さんぽのミニゲームの遠景（横にスクロールし、くり返しつなげて表示）
- 内容: 横にどこまでもつながる、のどかな町はずれの道の遠景。青空と雲、遠くの山なみ、田んぼ、低い家並み、電柱のない川ぞいの土手。下 1/4 はゲームが道を描くので、草地だけのシンプルな絵に。左右の端がぴったりつながる。
- おすすめのツール: [Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111）](https://stability.ai/) ― サイズ: 幅・高さを直接指定（SDXL は 1024×1024・1344×768・768×1344 など約 100 万画素で）
- メモ: SDXL は 1536×512 などで生成し、AUTOMATIC1111 / Fooocus の「Tiling（タイリング）」をオンにすると左右がつながります。生成後に 2400×800 に拡大。季節の色はゲームが重ねるので、春でも夏でもない「若葉」くらいの色に。

**Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111）用のプロンプト**

```text
seamless horizontally tileable side-scrolling game background, peaceful Japanese countryside town edge, blue sky with soft clouds, distant soft green mountains, rice fields, a few low traditional houses with tiled roofs, a riverside embankment with trees, flat side view, soft picture-book illustration, gentle pastel colors, the bottom quarter is plain grass only, no characters, no animals, wide panorama, high quality
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, watermark, people, animals, cars, power lines, utility poles, signboards, perspective road, blurry, seams
```

**ほかのツール用（共通の英文プロンプト）**

```text
A seamless, horizontally tileable side-scrolling game background (2400×800, 3:1): the peaceful edge of a Japanese country town — blue sky with soft clouds, distant soft green mountains, rice fields, a few low traditional houses with tiled roofs, a riverside embankment with trees. Flat side view, soft picture-book illustration, gentle pastel colours. The bottom quarter is plain grass only (the game draws the path there). The left and right edges must join seamlessly. No people, animals, cars, poles or text.
```

<a id="shiba-ikusei-shiba-puppy-normal"></a>

## 子犬（ふつう）

- ファイル: `public/games/shiba-ikusei/img/shiba-puppy-normal.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：子犬・ふつう（ほかの 8 枚の元の絵）
- 内容: 子犬の赤柴の上半身。ころころした体に大きな頭、少し小さめの立ち耳、こげ茶の丸い目、正面を向いて口を閉じたおだやかな顔。若草色の首輪と金色の鈴。透明な背景。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: 9 枚の基準になる絵です。残りの 8 枚は、この完成画像を ChatGPT に添付して「同じ犬・同じ画風・同じ大きさで」と頼むと揃います。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A soft picture-book style illustration of an original red Shiba Inu PUPPY, upper body (chest up), centred, facing the viewer. Honey-brown coat; cream fur on the cheeks, muzzle, throat and chest; small cream eyebrow dots above the eyes; black nose; round dark-brown eyes; slightly small triangular upright ears; a big round head and a chubby little body; a light-green collar with a small golden bell. Calm, content expression with the mouth closed. Thin soft outlines, gentle shading, no text, nothing else in the picture.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, background, other animals, realistic photo, harness, clothes
```

**ほかのツール用（共通の英文プロンプト）**

```text
Transparent-background illustration, square. An original red Shiba Inu puppy, chest-up, centred, facing the viewer: honey-brown coat, cream cheeks/muzzle/throat/chest, small cream eyebrow dots, black nose, round dark-brown eyes, slightly small upright ears, big round head, chubby body, light-green collar with a small golden bell. Calm content expression, mouth closed. Soft picture-book style, no text.
```

<a id="shiba-ikusei-shiba-puppy-happy"></a>

## 子犬（ごきげん）

- ファイル: `public/games/shiba-ikusei/img/shiba-puppy-happy.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：子犬・ごきげん
- 内容: shiba-puppy-normal と同じ子犬が、目を細めて口を開け、舌を少し出して笑っている。ほほがほんのり赤い。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-ikusei-shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-puppy-normal) as the reference: the exact same original red Shiba Inu puppy, same art style, same framing (chest up, centred), same size, same light-green collar and golden bell. Change only the expression: very happy, eyes squeezed into happy arcs, mouth open in a big smile with a little pink tongue showing, a light blush on the cheeks, ears perked. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu puppy as the reference image (same style, framing, collar and bell), now very happy: eyes squeezed into happy arcs, open smiling mouth with a little pink tongue, light blush, perked ears. Transparent background, square, no text.
```

<a id="shiba-ikusei-shiba-puppy-sad"></a>

## 子犬（しょんぼり）

- ファイル: `public/games/shiba-ikusei/img/shiba-puppy-sad.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：子犬・しょんぼり（すねている）
- 内容: shiba-puppy-normal と同じ子犬が、耳をぺたんと寝かせ、上目づかいでしょんぼりしている。少しすねた顔。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-ikusei-shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-puppy-normal) as the reference: the exact same original red Shiba Inu puppy, same art style, same framing, same size, same collar and bell. Change only the expression and ears: ears folded flat back, looking up with sad puppy eyes, mouth closed in a small pout, a little sulky. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu puppy as the reference image, now sad and a little sulky: ears folded flat back, looking up with sad eyes, small pout. Same style, framing, collar and bell. Transparent background, square, no text.
```

<a id="shiba-ikusei-shiba-young-normal"></a>

## 若犬（ふつう）

- ファイル: `public/games/shiba-ikusei/img/shiba-young-normal.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：若犬・ふつう
- 内容: 同じ柴犬が少し大きくなった若犬。顔が少しすっきりして、耳が大きく見える。おだやかな表情。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-ikusei-shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-puppy-normal) as the reference: the same original red Shiba Inu, same coat pattern (honey-brown with cream urajiro markings and cream eyebrow dots), same light-green collar and golden bell, same art style and framing (chest up, centred). Now show it as a YOUNG dog of about six months: a slimmer face, a slightly longer muzzle, ears that look large for the head, a lean chest. Calm, content expression, mouth closed. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu as the reference image, now a young dog of about six months: slimmer face, slightly longer muzzle, ears that look large, lean chest. Same markings, collar, bell, style and chest-up framing. Calm expression. Transparent background, square, no text.
```

<a id="shiba-ikusei-shiba-young-happy"></a>

## 若犬（ごきげん）

- ファイル: `public/games/shiba-ikusei/img/shiba-young-happy.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：若犬・ごきげん
- 内容: shiba-young-normal と同じ若犬が、目を細めて口を開けて笑っている。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-young-normal.webp`](#shiba-ikusei-shiba-young-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-young-normal) as the reference: the exact same young red Shiba Inu, same style, framing, size, collar and bell. Change only the expression: very happy, eyes in happy arcs, open smiling mouth with the tongue showing, ears perked. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same young red Shiba Inu as the reference image, now very happy: happy-arc eyes, open smiling mouth with the tongue showing, perked ears. Same style and framing. Transparent background, square, no text.
```

<a id="shiba-ikusei-shiba-young-sad"></a>

## 若犬（しょんぼり）

- ファイル: `public/games/shiba-ikusei/img/shiba-young-sad.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：若犬・しょんぼり
- 内容: shiba-young-normal と同じ若犬が、耳を寝かせてそっぽを向き、すねている。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-young-normal.webp`](#shiba-ikusei-shiba-young-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-young-normal) as the reference: the exact same young red Shiba Inu, same style, framing, size, collar and bell. Change only the expression and pose of the head: ears folded back, head turned slightly away, eyes half-closed and glancing sideways, a sulky pout. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same young red Shiba Inu as the reference image, now sulking: ears folded back, head turned slightly away, half-closed eyes glancing sideways, a pout. Same style and framing. Transparent background, square, no text.
```

<a id="shiba-ikusei-shiba-adult-normal"></a>

## 成犬（ふつう）

- ファイル: `public/games/shiba-ikusei/img/shiba-adult-normal.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：成犬・ふつう
- 内容: 同じ柴犬がおとなになった成犬。がっしりした体、ふさふさの胸の生成り色の毛、凛とした顔つき。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-young-normal.webp`](#shiba-ikusei-shiba-young-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-young-normal) as the reference: the same original red Shiba Inu, same coat pattern, same light-green collar and golden bell, same art style and framing (chest up, centred). Now show it fully grown as an ADULT dog: a sturdy body, a thick fluffy cream ruff on the chest, a dignified, gentle face, confident upright ears. Calm, content expression, mouth closed. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu as the reference image, now a fully grown adult: sturdy body, thick fluffy cream chest ruff, dignified gentle face, confident upright ears. Same markings, collar, bell, style and chest-up framing. Calm expression. Transparent background, square, no text.
```

<a id="shiba-ikusei-shiba-adult-happy"></a>

## 成犬（ごきげん）

- ファイル: `public/games/shiba-ikusei/img/shiba-adult-happy.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：成犬・ごきげん
- 内容: shiba-adult-normal と同じ成犬が、目を細めて口を開けた、柴犬らしい満面の笑み。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-adult-normal.webp`](#shiba-ikusei-shiba-adult-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-adult-normal) as the reference: the exact same adult red Shiba Inu, same style, framing, size, collar and bell. Change only the expression: a big happy smile typical of the breed, eyes in happy arcs, mouth open with the tongue showing. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same adult red Shiba Inu as the reference image, now with a big happy smile: happy-arc eyes, open mouth with the tongue showing. Same style and framing. Transparent background, square, no text.
```

<a id="shiba-ikusei-shiba-adult-sad"></a>

## 成犬（しょんぼり）

- ファイル: `public/games/shiba-ikusei/img/shiba-adult-sad.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：成犬・しょんぼり
- 内容: shiba-adult-normal と同じ成犬が、耳を寝かせて横目でこちらを見る、すねた表情。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-adult-normal.webp`](#shiba-ikusei-shiba-adult-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-adult-normal) as the reference: the exact same adult red Shiba Inu, same style, framing, size, collar and bell. Change only the expression: ears folded back, head turned slightly away, a side-eye glance with half-closed eyes, a sulky pout. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same adult red Shiba Inu as the reference image, now sulking: ears folded back, head turned slightly away, a side-eye glance, a pout. Same style and framing. Transparent background, square, no text.
```


---

# 縁側将棋 ― 画像の生成プロンプト

ゲーム: `public/games/shogi/`（7 枚中 0 枚が生成済み、7 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/shogi/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夏の夕暮れ、古い日本家屋の縁側。やわらかな水彩画とアニメ調の中間のタッチで、あたたかい木の色（飴色・檜）、夕焼けのオレンジ、庭の深い緑、すだれ越しのやわらかい光。人物はやさしい線のアニメ調（セル塗り＋淡い水彩の影）、背景は絵画的。懐かしく、静かで、少しだけユーモラス。将棋の駒や盤の文字は描かず（崩れた文字になるため）、画像の中に文字・ロゴ・透かしは入れません。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/shogi/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- shogi` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- shogi`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#shogi-key) | 1600×900 | キービジュアル | タイトル画面の背景（全面）。中央〜右に設定パネルが重なるので、主役の将棋盤は左寄りに | Midjourney（v7） |
| ⬜ | [`img/bg-room.webp`](#shogi-bg-room) | 1600×1000 | 背景 | 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示） | Midjourney（v7） |
| ⬜ | [`img/portrait-tama.webp`](#shogi-portrait-tama) | 512×512 | 人物 | 入門の対局相手（三毛猫）。対局画面とタイトルの相手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-sota.webp`](#shogi-portrait-sota) | 512×512 | 人物 | 初級の対局相手（近所の小学生） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-chikage.webp`](#shogi-portrait-chikage) | 512×512 | 人物 | 中級の対局相手（大学の将棋部員） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-genzo.webp`](#shogi-portrait-genzo) | 512×512 | 人物 | 上級の対局相手（この家のおじいさん） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/item-furin.webp`](#shogi-item-furin) | 240×400（透過） | アイテム | タイトル画面の飾り（左上で風に揺れるアニメーション） | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="shogi-key"></a>

## キービジュアル：夕暮れの縁側と将棋盤

- ファイル: `public/games/shogi/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景（全面）。中央〜右に設定パネルが重なるので、主役の将棋盤は左寄りに
- 内容: 夏の夕方、古民家の縁側に置かれた脚付きの将棋盤。軒先にガラスの風鈴、盤の横で三毛猫が丸くなって眠り、お盆に麦茶のグラスが 2 つ。奥には紫陽花と石灯籠のある緑の庭、すだれ越しに夕日のオレンジの光。人物はいない。左側に将棋盤、右側は空と庭の落ち着いた余白。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 盤の上の駒は描かないか、遠目に小さく（駒の文字が崩れるため）。右側にタイトルの設定パネルが重なるので、右半分は情報の少ない空・庭に。

**Midjourney（v7）用のプロンプト**

```text
a thick wooden shogi board on legs resting on the engawa veranda of an old Japanese wooden house at summer dusk, a glass wind chime hanging from the eaves, a calico cat curled up asleep beside the board, a lacquer tray with two glasses of iced barley tea, lush green garden with hydrangeas and a stone lantern, warm orange sunset light filtering through bamboo blinds, the board placed in the left third, calm open space on the right, painterly anime background art, soft watercolor texture, nostalgic, gentle light, no people --ar 16:9 --v 7 --style raw --no text, letters, kanji, logo, watermark, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji characters, logo, watermark, people, hands, modern furniture
```

**ほかのツール用（共通の英文プロンプト）**

```text
Painterly anime-style background illustration: a thick wooden shogi board on legs on the veranda (engawa) of an old Japanese house at summer dusk. A glass wind chime hangs from the eaves, a calico cat sleeps beside the board, two glasses of iced barley tea on a tray. Green garden with hydrangeas and a stone lantern, warm orange sunset light through bamboo blinds. Board in the left third, calm empty space on the right. No people, no text. Wide 16:9.
```

<a id="shogi-bg-room"></a>

## 背景：縁側に面した和室

- ファイル: `public/games/shogi/img/bg-room.webp`（1600×1000px）
- 用途: 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示）
- 内容: 縁側に面した畳の和室の内側。障子が開いていて、夕方の庭の緑とオレンジの光がぼんやり見える。中央は何もない畳（盤が重なるため）。コントラストは低め、少しぼかした、落ち着いた暖色。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/key.webp`](#shogi-key) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: キービジュアルと同じ時間帯・同じ家に見えるように、key の画像 URL を --sref に付けると色調がそろいます。中央に盤が重なるので、中央は単調な畳で。

**Midjourney（v7）用のプロンプト**

```text
interior of a quiet traditional Japanese tatami room opening onto an engawa veranda and a summer garden at golden hour, shoji sliding doors pulled open, bamboo blinds, warm dim light, empty tatami floor in the center, shallow depth of field with soft bokeh, low contrast muted warm colors, painterly anime background art, calm atmosphere, no people --ar 16:10 --v 7 --style raw --no text, people, furniture in the center
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, people, furniture in the center, strong contrast, bright white areas
```

**ほかのツール用（共通の英文プロンプト）**

```text
Painterly anime-style background: the inside of a quiet Japanese tatami room that opens onto a veranda and a summer garden at golden hour. Shoji doors open, bamboo blinds, warm dim light, empty tatami floor in the center, soft focus and low contrast with muted warm colors. No people, no text. Aspect ratio 16:10.
```

<a id="shogi-portrait-tama"></a>

## 人物：たま（入門・三毛猫）

- ファイル: `public/games/shogi/img/portrait-tama.webp`（512×512px）
- 用途: 入門の対局相手（三毛猫）。対局画面とタイトルの相手選び
- 内容: 縁側に住みついたぽっちゃりの三毛猫「たま」。座布団の上にきちんと座り、眠そうな半目で、少し得意げな口元。前足を片方あげて、今にも駒を指しそう。胸から上の構図で中央、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 4 人の対局相手は同じ niji で作り、最初の 1 枚（どれでも）の画像 URL を残りの 3 枚に --sref として付けて、線と塗りをそろえます。顔が中央に来るように（丸い枠で切り抜いて表示します）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a chubby calico cat sitting upright on a purple zabuton cushion, round face, sleepy half-closed eyes, a tiny smug smile, one front paw raised as if about to make a move in a board game, soft warm light, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, game pieces with writing, human, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a chubby calico cat sitting upright on a purple floor cushion, round face, sleepy half-closed eyes and a small smug smile, one front paw raised as if about to make a move. Soft warm light, plain pale cream background, centered, square 1:1. No text.
```

<a id="shogi-portrait-sota"></a>

## 人物：そうた（初級・小学生）

- ファイル: `public/games/shogi/img/portrait-sota.webp`（512×512px）
- 用途: 初級の対局相手（近所の小学生）
- 内容: 近所に住む小学 4 年生の男の子「そうた」。日焼けした頬、短いぼさぼさの黒髪、鼻に絆創膏。水色の半袖シャツ。自信満々の笑顔でこぶしを握る。胸から上、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-tama.webp`](#shogi-portrait-tama) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-tama の画像 URL を --sref に付けて絵柄をそろえます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a cheerful ten-year-old Japanese boy with short messy black hair, sun-tanned cheeks and a small adhesive bandage on his nose, wearing a light blue short-sleeved summer shirt, confident toothy grin, clenched fist raised in determination, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo on clothes, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a cheerful ten-year-old Japanese boy: short messy black hair, sun-tanned cheeks, a small bandage on his nose, light blue short-sleeved shirt, confident grin with a raised fist. Plain pale cream background, centered, square 1:1. No text.
```

<a id="shogi-portrait-chikage"></a>

## 人物：千景（中級・大学将棋部）

- ファイル: `public/games/shogi/img/portrait-chikage.webp`（512×512px）
- 用途: 中級の対局相手（大学の将棋部員）
- 内容: 大学の将棋部に所属する 20 歳くらいの女性「千景（ちかげ）」。黒髪のロングを低い位置でひとつに結び、細い銀縁の眼鏡。白いブラウスに薄手のカーディガン。扇子を口元に添えて、穏やかで知的な微笑み。胸から上、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-tama.webp`](#shogi-portrait-tama) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-tama の画像 URL を --sref に付けて絵柄をそろえます。扇子に文字を入れないこと。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a calm young Japanese woman around twenty, a university student, long black hair tied in a low ponytail, thin silver-rimmed glasses, white blouse under a light summer cardigan, holding a closed folding fan near her chin, gentle intelligent smile, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, writing on the fan, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a calm young Japanese woman around twenty: long black hair in a low ponytail, thin silver-rimmed glasses, white blouse and light cardigan, holding a closed folding fan near her chin, gentle intelligent smile. Plain pale cream background, centered, square 1:1. No text.
```

<a id="shogi-portrait-genzo"></a>

## 人物：源三（上級・縁側の主）

- ファイル: `public/games/shogi/img/portrait-genzo.webp`（512×512px）
- 用途: 上級の対局相手（この家のおじいさん）
- 内容: この家の主、70 代のおじいさん「源三（げんぞう）」。はげ頭に白くて太い眉、整えた白いあごひげ。藍色の甚平を着て、うちわを持つ。やさしいけれど、どこか手ごわそうないたずらっぽい笑み。胸から上、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-tama.webp`](#shogi-portrait-tama) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-tama の画像 URL を --sref に付けて絵柄をそろえます。うちわに文字を入れないこと。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a kind elderly Japanese man in his seventies, bald head, thick white eyebrows, a neatly trimmed white beard, wearing a dark indigo jinbei summer outfit, holding a round paper uchiwa fan, warm wise smile with a mischievous glint in his eyes, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, writing on the fan, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a kind elderly Japanese man in his seventies: bald head, thick white eyebrows, neat white beard, dark indigo jinbei summer outfit, holding a round paper fan, warm wise smile with a mischievous glint. Plain pale cream background, centered, square 1:1. No text.
```

<a id="shogi-item-furin"></a>

## 風鈴

- ファイル: `public/games/shogi/img/item-furin.webp`（240×400px・背景は透過）
- 用途: タイトル画面の飾り（左上で風に揺れるアニメーション）
- 内容: ガラスの風鈴を 1 つ。透明なガラスの鈴に金魚と水の波紋の絵、赤いひも、その下に長い短冊（短冊には何も書かない）。正面から、全体が入るように。背景は透過。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: 透過 PNG で出せない場合は、真っ白な無地の背景で作れば game-images が切り抜きます。上端（ひもの先）が画像の上端の近くに来るように。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Draw a single Japanese glass wind chime (furin): a clear glass bell hand-painted with two small red goldfish and blue water ripples, a red string with a small glass clapper, and a long plain pale-blue paper strip hanging below it (leave the paper strip completely blank, no writing). Soft watercolor-like anime illustration style, front view, the whole object centered and fully visible with a little margin. Transparent background PNG, portrait orientation 1024×1536.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji on the paper strip, background, shadow on the ground
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese glass wind chime: clear glass bell painted with two red goldfish and blue ripples, red string, a long blank pale-blue paper strip hanging below (no writing). Soft watercolor anime illustration, front view, whole object centered. Transparent or plain white background, portrait 3:5.
```


---

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
| ⬜ | [`img/sweet-01.webp`](#wagashi-merge-sweet-01) | 256×256（透過） | スプライト | 重箱の中のお菓子（1 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-02.webp`](#wagashi-merge-sweet-02) | 256×256（透過） | スプライト | 重箱の中のお菓子（2 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-03.webp`](#wagashi-merge-sweet-03) | 256×256（透過） | スプライト | 重箱の中のお菓子（3 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-04.webp`](#wagashi-merge-sweet-04) | 256×256（透過） | スプライト | 重箱の中のお菓子（4 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-05.webp`](#wagashi-merge-sweet-05) | 256×256（透過） | スプライト | 重箱の中のお菓子（5 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-06.webp`](#wagashi-merge-sweet-06) | 256×256（透過） | スプライト | 重箱の中のお菓子（6 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-07.webp`](#wagashi-merge-sweet-07) | 256×256（透過） | スプライト | 重箱の中のお菓子（7 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-08.webp`](#wagashi-merge-sweet-08) | 256×256（透過） | スプライト | 重箱の中のお菓子（8 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-09.webp`](#wagashi-merge-sweet-09) | 256×256（透過） | スプライト | 重箱の中のお菓子（9 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-10.webp`](#wagashi-merge-sweet-10) | 256×256（透過） | スプライト | 重箱の中のお菓子（10 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/sweet-11.webp`](#wagashi-merge-sweet-11) | 256×256（透過） | スプライト | 重箱の中のお菓子（11 段目）・お品書き・つぎのお菓子 | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/tea.webp`](#wagashi-merge-tea) | 256×256（透過） | アイテム | 「お茶」ボタンの絵（お菓子をひとつ取りのぞく） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/bg.webp`](#wagashi-merge-bg) | 1600×1200 | 背景 | プレイ画面の背景（重箱のうしろに暗くして表示） | Midjourney（v7） |
| ⬜ | [`img/key.webp`](#wagashi-merge-key) | 1600×900 | キービジュアル | タイトル画面の背景 | Ideogram（3.0） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="wagashi-merge-sweet-01"></a>

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

<a id="wagashi-merge-sweet-02"></a>

## 黒豆

- ファイル: `public/games/wagashi-merge/img/sweet-02.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（2 段目）・お品書き・つぎのお菓子
- 内容: つやつやの黒豆の甘煮ひと粒（黒紫で鏡のような照り、砂糖の粒が少し）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-03"></a>

## 栗きんとん

- ファイル: `public/games/wagashi-merge/img/sweet-03.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（3 段目）・お品書き・つぎのお菓子
- 内容: 茶巾しぼりの栗きんとん（黄金色、上に絞りのひだ）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-04"></a>

## 桜餅

- ファイル: `public/games/wagashi-merge/img/sweet-04.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（4 段目）・お品書き・つぎのお菓子
- 内容: 道明寺の桜餅（桃色のつぶつぶのお餅を、塩漬けの桜の葉で包んだもの）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-05"></a>

## 草餅

- ファイル: `public/games/wagashi-merge/img/sweet-05.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（5 段目）・お品書き・つぎのお菓子
- 内容: よもぎの草餅（やわらかな緑色の丸いお餅、きな粉を少し）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-06"></a>

## 最中

- ファイル: `public/games/wagashi-merge/img/sweet-06.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（6 段目）・お品書き・つぎのお菓子
- 内容: 丸い最中（香ばしく焼いた皮に梅の花の型押し）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-07"></a>

## 水まんじゅう

- ファイル: `public/games/wagashi-merge/img/sweet-07.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（7 段目）・お品書き・つぎのお菓子
- 内容: 水まんじゅう（透きとおった葛の中にこしあんが見える。小さな水滴）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-08"></a>

## おはぎ

- ファイル: `public/games/wagashi-merge/img/sweet-08.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（8 段目）・お品書き・つぎのお菓子
- 内容: おはぎ（ごはんをこしあんでくるんだ丸いお菓子、しっとりした質感）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-09"></a>

## どら焼き

- ファイル: `public/games/wagashi-merge/img/sweet-09.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（9 段目）・お品書き・つぎのお菓子
- 内容: 真上から見たどら焼き（きつね色の焼き目、ふちは明るい色）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-10"></a>

## 大福

- ファイル: `public/games/wagashi-merge/img/sweet-10.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（10 段目）・お品書き・つぎのお菓子
- 内容: 大福（白い粉をまとった、ふっくらした丸いお餅）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-sweet-11"></a>

## 鏡餅

- ファイル: `public/games/wagashi-merge/img/sweet-11.webp`（256×256px・背景は透過）
- 用途: 重箱の中のお菓子（11 段目）・お品書き・つぎのお菓子
- 内容: 真上から見た鏡餅（白い丸餅が二段、上に葉つきの橙）。真上から見た丸い形が、正方形の画面いっぱいに収まるように。
- おすすめのツール: [Leonardo.Ai（Phoenix）](https://leonardo.ai/) ― サイズ: 幅・高さを画面で選択。透過: 「Transparency」をオンにすると透過 PNG で出せます
- 参照画像: [`img/sweet-01.webp`](#wagashi-merge-sweet-01) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="wagashi-merge-tea"></a>

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

<a id="wagashi-merge-bg"></a>

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

<a id="wagashi-merge-key"></a>

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


---
