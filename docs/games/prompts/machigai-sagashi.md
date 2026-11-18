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
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1200×800 | キービジュアル | タイトル画面（PC は左上の横長の絵、スマホは左上の正方形。中央付近が切り抜かれます） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/title-bg.webp`](#title-bg) | 1600×900 | 背景 | タイトル画面の背景（55% の濃さで重ねます。上に文字やカードが重なります） | Midjourney（v7） |
| ⬜ | [`img/result-cat.webp`](#result-cat) | 512×512（透過） | アイテム | 「めぐり」の結果画面のいちばん上（透過） | Recraft（V3） |
| ⬜ | [`img/clear-deco.webp`](#clear-deco) | 960×240（透過） | UI 部品 | クリアのカードの上部に重ねる飾り（透過） | Leonardo.Ai（Phoenix） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key-visual"></a>

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

<a id="title-bg"></a>

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

<a id="result-cat"></a>

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

<a id="clear-deco"></a>

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
