# 一覧ページ（Process Portfolio） ― 画像の生成プロンプト

サイト: `public/site/`（7 枚中 0 枚が生成済み、7 枚が画像サンプル）。このファイルは `npm run game-images -- site` が `public/site/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夜の制作スタジオの空気感。深い紺（#05070f〜#0b1224）を地に、ブルー（#5b8cff）・シアン（#22d3ee）・バイオレット（#a78bfa）の光がにじむ、落ち着いたシネマティックなトーン。録画中を示す赤（#ff4d5e）は小さなアクセントだけ。人物の顔・実在の製品のロゴ・読める文字は入れず、画面の中身は抽象化した UI（色の帯・角丸の箱・線）で表現します。説明的になりすぎず、余白を大きく。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/site/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- site` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. 一覧ページは画像を直接読み込むので、ほかに作業はいりません（`npm run build` で反映）。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/hero-art.webp`](#hero-art) | 1920×1080 | 背景 | ページ最上部（ヒーロー）の背景。紺のグラデーションとオーロラの光の下に、約 20% の濃さで右寄りに敷きます。右半分に動画のプレビュー、左半分に見出しが重なります | Midjourney（v7） |
| ⬜ | [`img/why-static.webp`](#why-static) | 960×600 | カード | 「動画で見せる理由」の左側（一般的な実績紹介）のカードの絵。少し色を落として表示します | Recraft（V3） |
| ⬜ | [`img/flow-1.webp`](#flow-1) | 800×600（透過） | アイテム | 「動画に収録している工程」の 1 枚目のカードの絵（背景は透過・カードの上に浮かせて表示） | Recraft（V3） |
| ⬜ | [`img/flow-2.webp`](#flow-2) | 800×600（透過） | アイテム | 「動画に収録している工程」の 2 枚目のカードの絵（背景は透過） | Recraft（V3） |
| ⬜ | [`img/flow-3.webp`](#flow-3) | 800×600（透過） | アイテム | 「動画に収録している工程」の 3 枚目のカードの絵（背景は透過） | Recraft（V3） |
| ⬜ | [`img/flow-4.webp`](#flow-4) | 800×600（透過） | アイテム | 「動画に収録している工程」の 4 枚目のカードの絵（背景は透過） | Recraft（V3） |
| ⬜ | [`img/cta-bg.webp`](#cta-bg) | 1920×720 | 背景 | ページ下の「まずは 1 本ご覧ください」の帯の背景（約 60% の濃さで、上に文字とボタンが重なります） | Adobe Firefly（Image 4） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="hero-art"></a>

## ヒーローの背景：夜の制作スタジオ

- ファイル: `public/site/img/hero-art.webp`（1920×1080px）
- 用途: ページ最上部（ヒーロー）の背景。紺のグラデーションとオーロラの光の下に、約 20% の濃さで右寄りに敷きます。右半分に動画のプレビュー、左半分に見出しが重なります
- 内容: 夜の制作スタジオ。暗い部屋の机に、ウルトラワイドのモニターと 2 枚のサブモニター。画面にはぼかした UI デザインとコード（色の帯と角丸の箱だけで、読める文字はない）。モニターの青とシアンの光が机と空気を照らし、手前は大きくボケる。右上に小さな赤い録画ランプ。人物はいない。左側はほぼ暗い余白。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 左 1/3 は見出しが重なるので暗く・情報を少なく。明るすぎるとページが重くなるので、全体は暗めに。生成後に色味が合わないときは Photoshop 等で青寄りに補正してください。

**Midjourney（v7）用のプロンプト**

```text
cinematic night-time design studio, ultrawide monitor and two side monitors on a dark desk, screens glowing with blurred abstract interface layouts and code-like colored bars, no readable text, cool blue and cyan screen light spilling over the desk and haze in the air, a tiny red recording light in the upper right, shallow depth of field with soft bokeh in the foreground, deep navy shadows, the left third almost empty and dark for headline space, moody, high-end, minimal --ar 16:9 --v 7 --style raw --no text, letters, logos, people, faces, keyboard brand
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, brand names, people, faces, hands, clutter, bright daylight
```

**ほかのツール用（共通の英文プロンプト）**

```text
A cinematic night-time design studio: an ultrawide monitor and two smaller monitors on a dark desk, the screens glowing with blurred abstract interface layouts (colored bars and rounded boxes, no readable text). Cool blue and cyan light spills over the desk into a faint haze; a tiny red recording light glows in the upper right. Shallow depth of field, soft bokeh in the foreground, deep navy shadows. Keep the left third dark and nearly empty. No people, no text, no logos. Wide 16:9.
```

<a id="why-static"></a>

## 一般的な実績紹介：URL と静止画

- ファイル: `public/site/img/why-static.webp`（960×600px）
- 用途: 「動画で見せる理由」の左側（一般的な実績紹介）のカードの絵。少し色を落として表示します
- 内容: フラットなイラスト。暗いグレーブルーの地に、ブラウザのアドレスバー（中は文字の代わりに細い線）と、ピンで留めた 3 枚の静止画（中身は抽象的なレイアウト）。動きのない、少し退屈な印象。色数は少なく、グレーと鈍い青だけ。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）
- メモ: 右側の「このポートフォリオ」は実際の動画のサムネイルを使うので、こちらはあえて地味に。Recraft のスタイルは「Vector art › Flat」系がおすすめです。

**Recraft（V3）用のプロンプト**

```text
Flat vector illustration, dark slate background (#0f172a). A simple browser address bar at the top with a thin line instead of a URL, below it three still screenshots pinned like photos, each showing an abstract website layout made of grey blocks. Static, slightly dull and lifeless mood, muted greys and dull blue only, minimal shapes, generous spacing, no text, no logos. Aspect ratio 16:10.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logos, people, bright colors, gradients, 3D
```

**ほかのツール用（共通の英文プロンプト）**

```text
Flat vector illustration on a dark slate background: a simple browser address bar (a thin line instead of a URL) above three still screenshots pinned like photos, each an abstract website layout made of grey blocks. Static, slightly dull mood, muted greys and dull blue only, minimal shapes, no text, no logos. 16:10.
```

<a id="flow-1"></a>

## 工程 01：ヒアリング・設計

- ファイル: `public/site/img/flow-1.webp`（800×600px・背景は透過）
- 用途: 「動画に収録している工程」の 1 枚目のカードの絵（背景は透過・カードの上に浮かせて表示）
- 内容: アイソメトリックのイラスト。ワイヤーフレームのボード、付せん、サイトマップの木構造、チェックリストのクリップボード。主役の色はブルー（#5b8cff）、差し色にシアン。背景は透過。読める文字はなし。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- メモ: 4 枚（flow-1〜4）は同じシリーズとしてそろえます。まず flow-1 を作り、Recraft の「スタイルの保存（Create style）」に登録してから残り 3 枚を同じスタイルで生成してください。背景透過は Recraft の Remove background で。

**Recraft（V3）用のプロンプト**

```text
Isometric 3D-style vector illustration on a transparent background: a planning board with website wireframes, a few sticky notes, a sitemap tree diagram and a clipboard checklist, floating composition, soft glow, primary color electric blue (#5b8cff) with cyan (#22d3ee) accents on dark-friendly tones, clean rounded shapes, consistent soft lighting from the top left, no text, no letters, no logos. Square-ish 4:3.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logos, people, background scene, photo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Isometric vector illustration with a transparent background: a planning board with website wireframes, sticky notes, a sitemap tree and a clipboard checklist, floating, softly glowing. Electric blue (#5b8cff) as the main color with cyan accents, clean rounded shapes, soft light from the top left. No text, no logos. 4:3.
```

<a id="flow-2"></a>

## 工程 02：デザイン

- ファイル: `public/site/img/flow-2.webp`（800×600px・背景は透過）
- 用途: 「動画に収録している工程」の 2 枚目のカードの絵（背景は透過）
- 内容: flow-1 と同じシリーズのアイソメトリックのイラスト。デザインツールのアートボード（PC とスマホの画面）、カラースウォッチ、タイポグラフィの見本（文字の代わりに太さの違う線）、ペンツール。主役の色はバイオレット（#a78bfa）。背景は透過。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/flow-1.webp`](#flow-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Recraft（V3）用のプロンプト**

```text
Same isometric vector style as the previous image, transparent background: design tool artboards showing a desktop and a phone screen layout, a row of color swatches, a typography specimen drawn as lines of different weights (no letters), a floating pen tool and bezier handles, primary color violet (#a78bfa) with blue (#5b8cff) accents, clean rounded shapes, soft light from the top left, no text, no logos. 4:3.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logos, people, background scene, photo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Isometric vector illustration with a transparent background (same series as the planning image): design artboards for a desktop and a phone layout, color swatches, a typography specimen drawn as lines (no letters), a pen tool with bezier handles. Violet (#a78bfa) as the main color with blue accents, soft light from the top left. No text, no logos. 4:3.
```

<a id="flow-3"></a>

## 工程 03：実装

- ファイル: `public/site/img/flow-3.webp`（800×600px・背景は透過）
- 用途: 「動画に収録している工程」の 3 枚目のカードの絵（背景は透過）
- 内容: 同じシリーズのアイソメトリックのイラスト。コードエディターのウィンドウ（コードは色の付いた線だけ）、ターミナル、積み木のように組み合わさる UI 部品、歯車。主役の色はシアン（#22d3ee）。背景は透過。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/flow-1.webp`](#flow-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Recraft（V3）用のプロンプト**

```text
Same isometric vector style as the previous images, transparent background: a code editor window with colored lines instead of code, a small terminal window, UI components stacking like building blocks, a small gear, primary color cyan (#22d3ee) with blue (#5b8cff) accents, clean rounded shapes, soft light from the top left, no readable text, no logos. 4:3.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, readable code, logos, people, background scene, photo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Isometric vector illustration with a transparent background (same series): a code editor window with colored lines instead of code, a small terminal, UI components stacking like building blocks, a small gear. Cyan (#22d3ee) as the main color with blue accents, soft light from the top left. No readable text, no logos. 4:3.
```

<a id="flow-4"></a>

## 工程 04：確認・公開

- ファイル: `public/site/img/flow-4.webp`（800×600px・背景は透過）
- 用途: 「動画に収録している工程」の 4 枚目のカードの絵（背景は透過）
- 内容: 同じシリーズのアイソメトリックのイラスト。ブラウザとスマホに大きなチェックマーク、小さなロケット（公開）、地球のアイコン、上向きのグラフ。主役の色はミントグリーン（#34d399）、差し色にブルー。背景は透過。
- おすすめのツール: [Recraft（V3）](https://www.recraft.ai/) ― サイズ: 縦横比を画面で選択（ベクター / アイコンのスタイルが得意）。透過: 背景の削除機能で透過にできます
- 参照画像: [`img/flow-1.webp`](#flow-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Recraft（V3）用のプロンプト**

```text
Same isometric vector style as the previous images, transparent background: a browser window and a smartphone each showing a large check mark, a small rocket taking off, a simple globe icon and an upward chart, primary color mint green (#34d399) with blue (#5b8cff) accents, clean rounded shapes, soft light from the top left, no text, no logos. 4:3.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logos, people, background scene, photo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Isometric vector illustration with a transparent background (same series): a browser window and a smartphone with large check marks, a small rocket taking off, a globe icon and an upward chart. Mint green (#34d399) as the main color with blue accents, soft light from the top left. No text, no logos. 4:3.
```

<a id="cta-bg"></a>

## 締めの帯の背景：光の軌跡

- ファイル: `public/site/img/cta-bg.webp`（1920×720px）
- 用途: ページ下の「まずは 1 本ご覧ください」の帯の背景（約 60% の濃さで、上に文字とボタンが重なります）
- 内容: 抽象的な背景。深い紺の空間を、ブルー・シアン・バイオレットの細い光の線が、フィルムの帯や時間の流れのように左から右へ流れる。中央は少し暗くして文字を載せやすく。粒子がわずかに光る。文字・ロゴはなし。
- おすすめのツール: [Adobe Firefly（Image 4）](https://firefly.adobe.com/) ― サイズ: 縦横比を画面で選択
- メモ: Firefly で 16:9 を選び、生成後に上下を切って 8:3 にしても構いません（ツールが中央を基準に合わせます）。

**Adobe Firefly（Image 4）用のプロンプト**

```text
Abstract wide background: thin flowing light trails in electric blue, cyan and violet sweeping from left to right across a deep navy space, like a film strip or a timeline in motion, subtle glowing particles, long exposure feel, darker calm area in the center for text, elegant and minimal, no text, no logos. Aspect ratio 8:3 (wide).
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logos, people, objects, busy patterns
```

**ほかのツール用（共通の英文プロンプト）**

```text
An abstract wide background: thin flowing light trails in electric blue, cyan and violet sweeping left to right across a deep navy space, like a film strip or a timeline in motion, with subtle glowing particles and a long-exposure feel. Keep a calmer, darker area in the center for text. No text, no logos. Very wide (8:3).
```
