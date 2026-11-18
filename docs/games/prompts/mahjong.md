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
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（中央にゲーム名・ボタンを HTML で重ね、暗いグラデーションをかけて表示） | Midjourney（v7） |
| ⬜ | [`img/bg-room.webp`](#bg-room) | 1600×900 | 背景 | 対局画面の背景（卓の外側。暗く・半透明に重ねて表示） | Adobe Firefly（Image 4） |
| ⬜ | [`img/tsubame.webp`](#tsubame) | 512×512 | 人物 | 対戦相手のカード・タイトルの顔ぶれ（下家） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/tsubame-win.webp`](#tsubame-win) | 512×512 | 人物 | つばめが和了したときのカード・結果画面・最終順位（1 位のとき） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/genzo.webp`](#genzo) | 512×512 | 人物 | 対戦相手のカード・タイトルの顔ぶれ（対面） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/genzo-win.webp`](#genzo-win) | 512×512 | 人物 | 源三が和了したときのカード・結果画面・最終順位（1 位のとき） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/rei.webp`](#rei) | 512×512 | 人物 | 対戦相手のカード・タイトルの顔ぶれ（上家） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/rei-win.webp`](#rei-win) | 512×512 | 人物 | レイが和了したときのカード・結果画面・最終順位（1 位のとき） | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key-visual"></a>

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

<a id="bg-room"></a>

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

<a id="tsubame"></a>

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

<a id="tsubame-win"></a>

## 人物：朝霧つばめ（和了）

- ファイル: `public/games/mahjong/img/tsubame-win.webp`（512×512px）
- 用途: つばめが和了したときのカード・結果画面・最終順位（1 位のとき）
- 内容: 朝霧つばめの和了の表情。同じ人物・同じ服・同じ構図で、目を細めて大きく笑い、片手でガッツポーズ。まわりに小さなきらめき。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/tsubame.webp`](#tsubame) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="genzo"></a>

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

<a id="genzo-win"></a>

## 人物：柳 源三（和了）

- ファイル: `public/games/mahjong/img/genzo-win.webp`（512×512px）
- 用途: 源三が和了したときのカード・結果画面・最終順位（1 位のとき）
- 内容: 柳 源三の和了の表情。同じ人物・同じ服・同じ構図で、目尻にしわを寄せて満足そうに笑い、片手であごひげをなでる。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/genzo.webp`](#genzo) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="rei"></a>

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

<a id="rei-win"></a>

## 人物：白石レイ（和了）

- ファイル: `public/games/mahjong/img/rei-win.webp`（512×512px）
- 用途: レイが和了したときのカード・結果画面・最終順位（1 位のとき）
- 内容: 白石レイの和了の表情。同じ人物・同じ服・同じ構図で、人さし指で眼鏡を押し上げ、静かに勝ち誇った笑み。レンズに小さな光。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/rei.webp`](#rei) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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
