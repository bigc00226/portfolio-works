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
| ⬜ | [`img/bg-river.webp`](#bg-river) | 1600×900 | 背景 | プレイ画面の背景（下側に表示。空の上半分はゲームが暗く重ねて花火を描く） | Midjourney（v7） |
| ⬜ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景（中央にタイトルのカードを重ねるので、主役の花火は上寄り・人物は左右の端に） | Ideogram（3.0） |
| ⬜ | [`img/mascot-normal.webp`](#mascot-normal) | 480×640（透過） | 人物 | タイトル・プレイ中（PC）・結果の花火師見習いのキャラクター（表情の基準） | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/mascot-cheer.webp`](#mascot-cheer) | 480×640（透過） | 人物 | コンボのときと、成績のよい結果画面 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/mascot-oops.webp`](#mascot-oops) | 480×640（透過） | 人物 | 打ちまちがえたときに一瞬だけ表示 | Gemini（画像生成 / Imagen・Nano Banana） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="bg-river"></a>

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

<a id="key"></a>

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

<a id="mascot-normal"></a>

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

<a id="mascot-cheer"></a>

## ひばな（よろこび）

- ファイル: `public/games/hanabi-typing/img/mascot-cheer.webp`（480×640px・背景は透過）
- 用途: コンボのときと、成績のよい結果画面
- 内容: 同じ「ひばな」が、片手を高く突き上げて大喜びしている。目を細めた満面の笑顔、もう片方の手に花火玉。白い無地の背景。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/mascot-normal.webp`](#mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="mascot-oops"></a>

## ひばな（しまった）

- ファイル: `public/games/hanabi-typing/img/mascot-oops.webp`（480×640px・背景は透過）
- 用途: 打ちまちがえたときに一瞬だけ表示
- 内容: 同じ「ひばな」が、花火玉を落としそうになって慌てている。片目をつぶり、舌を少し出した「しまった」の表情。汗のしずく。白い無地の背景。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/mascot-normal.webp`](#mascot-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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
