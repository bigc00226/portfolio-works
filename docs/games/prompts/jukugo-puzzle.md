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
| ⬜ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景（半透明で重ね、中央にタイトルとメニューを置くので、中央は白い紙の余白に） | Recraft（V3） |
| ⬜ | [`img/bg-washi.webp`](#bg-washi) | 1600×1000 | 背景 | 問題の画面の背景（上に明るい膜を重ねて、文字を読みやすくします） | FLUX.1（dev / pro） |
| ⬜ | [`img/mascot-normal.webp`](#mascot-normal) | 480×480（透過） | 人物 | タイトル画面のキャラクター（表情の基準）、結果画面 | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/mascot-happy.webp`](#mascot-happy) | 480×480（透過） | 人物 | 正解したときの解説の欄・成績のよい結果 | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/mascot-sad.webp`](#mascot-sad) | 480×480（透過） | 人物 | 不正解のときの解説の欄・成績が低い結果 | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key"></a>

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

<a id="bg-washi"></a>

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

<a id="mascot-normal"></a>

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

<a id="mascot-happy"></a>

## 筆まる（正解）

- ファイル: `public/games/jukugo-puzzle/img/mascot-happy.webp`（480×480px・背景は透過）
- 用途: 正解したときの解説の欄・成績のよい結果
- 内容: 同じ「筆まる」が両手を上げて跳びはね、目を細めて大喜び。穂先がうれしそうに跳ねている。小さな星の飾り。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/mascot-normal.webp`](#mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="mascot-sad"></a>

## 筆まる（不正解）

- ファイル: `public/games/jukugo-puzzle/img/mascot-sad.webp`（480×480px・背景は透過）
- 用途: 不正解のときの解説の欄・成績が低い結果
- 内容: 同じ「筆まる」が、穂先をしょんぼり垂らして困り顔。片手で頭をかき、汗のしずくを一つ。悲しすぎず、「次はがんばる」雰囲気。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/mascot-normal.webp`](#mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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
