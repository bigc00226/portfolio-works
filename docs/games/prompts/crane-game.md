# クレーン横丁 ― 画像の生成プロンプト

ゲーム: `public/games/crane-game/`（12 枚中 12 枚が生成済み、0 枚が画像サンプル）。このファイルは `npm run game-images -- crane-game` が `public/games/crane-game/images.json` から書き出します（直接編集しないでください）。

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
| ✅ | [`img/p-usa.webp`](#p-usa) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/p-neko.webp`](#p-neko) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/p-shiba.webp`](#p-shiba) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/p-pen.webp`](#p-pen) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/p-hiyo.webp`](#p-hiyo) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/p-kuma.webp`](#p-kuma) | 256×256（透過） | スプライト | ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/p-azarashi.webp`](#p-azarashi) | 384×192（透過） | スプライト | ぬいぐるみの山の細長い景品（向きに合わせて回転して表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/p-dachs.webp`](#p-dachs) | 384×192（透過） | スプライト | ぬいぐるみの山の細長い景品（向きに合わせて回転して表示） | ChatGPT（画像生成 / GPT Image） |
| ✅ | [`img/box-snack.webp`](#box-snack) | 350×140 | カード | 橋渡しの景品の箱の正面・景品棚 | Recraft（V3） |
| ✅ | [`img/box-robo.webp`](#box-robo) | 350×140 | カード | 橋渡しの景品の箱の正面・景品棚 | Recraft（V3） |
| ✅ | [`img/bg.webp`](#bg) | 1600×1000 | 背景 | プレイ画面の背景（機械のまわりに暗くして表示） | Midjourney（v7） |
| ✅ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景 | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="p-usa"></a>

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

<a id="p-neko"></a>

## ころねこ

- ファイル: `public/games/crane-game/img/p-neko.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「ころねこ」：丸いオレンジのトラねこ（小さな三角の耳、くるんとしたしっぽ）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="p-shiba"></a>

## まめしば

- ファイル: `public/games/crane-game/img/p-shiba.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「まめしば」：丸い柴犬ふうの子犬（クリーム色の口もと、ぴんと立った耳）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="p-pen"></a>

## ぺんたろう

- ファイル: `public/games/crane-game/img/p-pen.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「ぺんたろう」：丸い紺色のペンギン（白いおなか、小さな黄色いくちばし）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="p-hiyo"></a>

## ひよこまる

- ファイル: `public/games/crane-game/img/p-hiyo.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「ひよこまる」：丸いふわふわの黄色いひよこ（頭にちょこんと毛）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="p-kuma"></a>

## くまだんご

- ファイル: `public/games/crane-game/img/p-kuma.webp`（256×256px・背景は透過）
- 用途: ぬいぐるみの山の景品（機械の中・景品棚・ゲットの表示）
- 内容: オリジナルのまんまるぬいぐるみ「くまだんご」：丸い茶色の子ぐま（ベージュの鼻先、小さな丸い耳）。正面向きで、丸いシルエットが正方形いっぱいに。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="p-azarashi"></a>

## ねそべりアザラシ

- ファイル: `public/games/crane-game/img/p-azarashi.webp`（384×192px・背景は透過）
- 用途: ぬいぐるみの山の細長い景品（向きに合わせて回転して表示）
- 内容: オリジナルの細長いぬいぐるみ「ねそべりアザラシ」：寝そべった細長いアザラシの赤ちゃん（淡いグレーにやわらかな斑点、頭は左）。横長 2:1 の画面いっぱいに、真横に寝そべった姿。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="p-dachs"></a>

## のびーるダックス

- ファイル: `public/games/crane-game/img/p-dachs.webp`（384×192px・背景は透過）
- 用途: ぬいぐるみの山の細長い景品（向きに合わせて回転して表示）
- 内容: オリジナルの細長いぬいぐるみ「のびーるダックス」：寝そべった細長いダックスフント（キャラメル色、たれ耳、頭は左）。横長 2:1 の画面いっぱいに、真横に寝そべった姿。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/p-usa.webp`](#p-usa) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="box-snack"></a>

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

<a id="box-robo"></a>

## 箱の絵：ロボットのおもちゃ

- ファイル: `public/games/crane-game/img/box-robo.webp`（350×140px）
- 用途: 橋渡しの景品の箱の正面・景品棚
- 内容: オリジナルのかわいいブリキ風ロボットのおもちゃの箱の正面のパッケージ絵。青と水色、星とギア。文字なし。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）
- 参照画像: [`img/box-snack.webp`](#box-snack) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="bg"></a>

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

<a id="key"></a>

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
