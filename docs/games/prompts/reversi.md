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
| ⬜ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景（全面）。右側に設定パネルが重なるので、主役は左寄りに | Ideogram（3.0） |
| ⬜ | [`img/bg-cafe.webp`](#bg-cafe) | 1600×1000 | 背景 | 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示） | Midjourney（v7） |
| ⬜ | [`img/portrait-hinata.webp`](#portrait-hinata) | 512×512 | 人物 | 入門の対局相手（マスターの孫娘） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-mugi.webp`](#portrait-mugi) | 512×512 | 人物 | 初級の対局相手（店の看板猫） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-ritsuko.webp`](#portrait-ritsuko) | 512×512 | 人物 | 中級の対局相手（昼休みに来る常連） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-master.webp`](#portrait-master) | 512×512 | 人物 | 上級の対局相手（喫茶しろくろの店主） | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key"></a>

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

<a id="bg-cafe"></a>

## 背景：純喫茶の店内（ぼかし）

- ファイル: `public/games/reversi/img/bg-cafe.webp`（1600×1000px）
- 用途: 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示）
- 内容: 純喫茶の店内を少しぼかした背景。カウンター、サイフォン、ステンドグラスのランプ、深緑のソファ、壁の振り子時計。電球色の光が点々と丸くぼける。中央は暗めで情報が少なく、コントラスト低め。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/key.webp`](#key) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="portrait-hinata"></a>

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

<a id="portrait-mugi"></a>

## 人物：むぎ（初級・看板猫）

- ファイル: `public/games/reversi/img/portrait-mugi.webp`（512×512px）
- 用途: 初級の対局相手（店の看板猫）
- 内容: 喫茶店の看板猫、茶トラの「むぎ」。ふっくらした体でテーブルの隅にちょこんと座り、金色の目で得意げにこちらを見る。首に小さな赤いスカーフ。胸から上、淡いクリーム色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-hinata.webp`](#portrait-hinata) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="portrait-ritsuko"></a>

## 人物：律子（中級・常連の会社員）

- ファイル: `public/games/reversi/img/portrait-ritsuko.webp`（512×512px）
- 用途: 中級の対局相手（昼休みに来る常連）
- 内容: 昼休みに来る常連の会社員「律子」、20 代後半。黒髪のボブ、紺のジャケットに白いシャツ。片手にコーヒーカップ、もう片方の手を口元に当てて次の手を考える、落ち着いた表情。胸から上、淡いクリーム色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-hinata.webp`](#portrait-hinata) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="portrait-master"></a>

## 人物：マスター（上級・店主）

- ファイル: `public/games/reversi/img/portrait-master.webp`（512×512px）
- 用途: 上級の対局相手（喫茶しろくろの店主）
- 内容: 喫茶しろくろの店主、60 代のマスター。きれいに整えた白髪まじりのオールバックと口ひげ、白いシャツに黒いベストと蝶ネクタイ。布でコーヒーカップを磨きながら、穏やかだが目は鋭い笑み。胸から上、淡いクリーム色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-hinata.webp`](#portrait-hinata) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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
