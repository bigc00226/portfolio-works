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
| ⬜ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景（中央にゲーム名を重ねるので、中央は暗めで空けておく）。スマホ縦では中央付近が切り出されます | Midjourney（v7） |
| ⬜ | [`img/bg-tatami.webp`](#bg-tatami) | 1600×1000 | 背景 | 対戦・ちらし取りの盤面の背景（上に暗い膜を重ね、札を並べます） | Adobe Firefly（Image 4） |
| ⬜ | [`img/reader.webp`](#reader) | 320×320 | 人物 | 読み上げの欄の丸いアイコン（52px 前後、丸く切り抜き） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-1.webp`](#cpu-1) | 320×320 | 人物 | 対戦の相手（いちばんやさしい）。上の欄の丸いアイコンと、相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-2.webp`](#cpu-2) | 320×320 | 人物 | 対戦の相手（ふつう）。丸いアイコンと相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-3.webp`](#cpu-3) | 320×320 | 人物 | 対戦の相手（強い）。丸いアイコンと相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cpu-4.webp`](#cpu-4) | 320×320 | 人物 | 対戦の相手（いちばん強い）。丸いアイコンと相手を選ぶ画面 | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key"></a>

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

<a id="bg-tatami"></a>

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

<a id="reader"></a>

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

<a id="cpu-1"></a>

## 相手 ★1：小春

- ファイル: `public/games/hyakunin-isshu/img/cpu-1.webp`（320×320px）
- 用途: 対戦の相手（いちばんやさしい）。上の欄の丸いアイコンと、相手を選ぶ画面
- 内容: かるたを始めて半年の、元気な 10 歳くらいの女の子。短いボブヘア、白いブラウスに黄色いニットのカーディガン、やる気いっぱいの笑顔。背景は無地の淡い桜色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="cpu-2"></a>

## 相手 ★2：文月

- ファイル: `public/games/hyakunin-isshu/img/cpu-2.webp`（320×320px）
- 用途: 対戦の相手（ふつう）。丸いアイコンと相手を選ぶ画面
- 内容: 図書館で働く、歌が好きな 20 代の青年。丸めがね、柔らかな茶色の髪、シャツの上にベージュのカーディガン、穏やかな微笑み。背景は無地の淡い水色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="cpu-3"></a>

## 相手 ★3：宵

- ファイル: `public/games/hyakunin-isshu/img/cpu-3.webp`（320×320px）
- 用途: 対戦の相手（強い）。丸いアイコンと相手を選ぶ画面
- 内容: 落ち着いた上級者の 30 代の女性。波の文様がうっすら入った藍色の着物、黒髪を低い位置でまとめ、静かで自信のある眼差し。背景は無地の淡い藤鼠色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="cpu-4"></a>

## 相手 ★4：白峰

- ファイル: `public/games/hyakunin-isshu/img/cpu-4.webp`（320×320px）
- 用途: 対戦の相手（いちばん強い）。丸いアイコンと相手を選ぶ画面
- 内容: かるた一筋六十年の老師。白髪と短い白いあごひげ、着物に濃い色の羽織、鋭いが温かい目。背景は無地のくすんだ金茶色。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/reader.webp`](#reader) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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
