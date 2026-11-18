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
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1200×900 | キービジュアル | タイトル画面（PC は左の大きな絵、スマホは上の帯。中央付近が切り抜かれて表示されます） | Midjourney（v7） |
| ⬜ | [`img/bg-washi.webp`](#bg-washi) | 1024×1024 | タイル | ページ全体の背景（640px のタイルとして敷き詰め、32% の濃さで重ねます） | Leonardo.Ai（Phoenix） |
| ⬜ | [`img/clear-illust.webp`](#clear-illust) | 960×540 | イベント絵 | 問題を解いたときの結果カードの上部（16:9） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pause-tea.webp`](#pause-tea) | 512×512（透過） | アイテム | 一時停止中に盤面の上に表示（透過） | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key-visual"></a>

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

<a id="bg-washi"></a>

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

<a id="clear-illust"></a>

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

<a id="pause-tea"></a>

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
