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
| ⬜ | [`img/title-bg.webp`](#title-bg) | 1600×900 | 背景 | タイトル画面の背景（まだどの結末も見ていないとき）。左側にタイトルの文字を重ねます | Midjourney（v7） |
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1600×900 | キービジュアル | どれかの結末を見たあとのタイトル画面の背景・ギャラリー | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/bg-station.webp`](#bg-station) | 1600×900 | 背景 | 序章の到着・結末の見送りの場面 | Midjourney（v7） |
| ⬜ | [`img/bg-slope-day.webp`](#bg-slope-day) | 1600×900 | 背景 | 物語の中心の場所。昼の場面・回想（セピア）・夕方（色を重ねて） | Midjourney（v7） |
| ⬜ | [`img/bg-slope-night.webp`](#bg-slope-night) | 1600×900 | 背景 | 前夜と、最後の夜の場面 | Midjourney（v7） |
| ⬜ | [`img/bg-studio-out.webp`](#bg-studio-out) | 1600×900 | 背景 | 写真館の前の場面 | Midjourney（v7） |
| ⬜ | [`img/bg-studio-in.webp`](#bg-studio-in) | 1600×900 | 背景 | 写真館の中の場面（いちばん多く出てくる背景） | Midjourney（v7） |
| ⬜ | [`img/bg-darkroom.webp`](#bg-darkroom) | 1600×900 | 背景 | 第三章、写真を焼く場面 | Midjourney（v7） |
| ⬜ | [`img/bg-bookshop.webp`](#bg-bookshop) | 1600×900 | 背景 | 第二章、灯の家の古書店 | Midjourney（v7） |
| ⬜ | [`img/bg-river-dusk.webp`](#bg-river-dusk) | 1600×900 | 背景 | 第四章と灯の結末、川原の場面（夜は色を重ねて） | Midjourney（v7） |
| ⬜ | [`img/ch-koharu-normal.webp`](#ch-koharu-normal) | 720×1080（透過） | 人物 | 立ち絵：桐野小春・ふつうの表情（ほかの表情の元の絵） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-koharu-smile.webp`](#ch-koharu-smile) | 720×1080（透過） | 人物 | 立ち絵：小春・満面の笑み | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-koharu-surprised.webp`](#ch-koharu-surprised) | 720×1080（透過） | 人物 | 立ち絵：小春・おどろいた顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-koharu-sad.webp`](#ch-koharu-sad) | 720×1080（透過） | 人物 | 立ち絵：小春・さびしげな顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-akari-normal.webp`](#ch-akari-normal) | 720×1080（透過） | 人物 | 立ち絵：芹沢灯・ふつうの表情（ほかの表情の元の絵） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-akari-smile.webp`](#ch-akari-smile) | 720×1080（透過） | 人物 | 立ち絵：灯・やわらかいほほえみ | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-akari-shy.webp`](#ch-akari-shy) | 720×1080（透過） | 人物 | 立ち絵：灯・照れた顔／少しおどろいた顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-akari-sad.webp`](#ch-akari-sad) | 720×1080（透過） | 人物 | 立ち絵：灯・うれいを帯びた顔 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-kiyoshi-normal.webp`](#ch-kiyoshi-normal) | 720×1080（透過） | 人物 | 立ち絵：桐野清・ふつうの表情（ほかの表情の元の絵） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-kiyoshi-smile.webp`](#ch-kiyoshi-smile) | 720×1080（透過） | 人物 | 立ち絵：清・口もとだけの小さな笑み | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-kiyoshi-distant.webp`](#ch-kiyoshi-distant) | 720×1080（透過） | 人物 | 立ち絵：清・昔を思う遠い目 | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/ch-harue-normal.webp`](#ch-harue-normal) | 720×1080（透過） | 人物 | 立ち絵：芹沢春江（灯の祖母） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/ch-harue-smile.webp`](#ch-harue-smile) | 720×1080（透過） | 人物 | 立ち絵：春江・目を細めたほほえみ | Gemini（画像生成 / Imagen・Nano Banana） |
| ⬜ | [`img/cg-photo.webp`](#cg-photo) | 1600×900 | イベント絵 | 第一章で見つかる、物語の鍵になる古い写真 | Adobe Firefly（Image 4） |
| ⬜ | [`img/cg-koharu.webp`](#cg-koharu) | 1600×900 | イベント絵 | 小春の結末のイベント絵 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cg-akari.webp`](#cg-akari) | 1600×900 | イベント絵 | 灯の結末のイベント絵 | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/cg-night.webp`](#cg-night) | 1600×900 | イベント絵 | 真の結末のイベント絵 | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="title-bg"></a>

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

<a id="key-visual"></a>

## キービジュアル：小春と灯、桜の坂

- ファイル: `public/games/sakura-novel/img/key-visual.webp`（1600×900px）
- 用途: どれかの結末を見たあとのタイトル画面の背景・ギャラリー
- 内容: 満開の桜の坂の上で、カメラを構えて笑う小春と、本を胸に抱いて振り向く灯。後ろに坂の上の写真館と大桜。青空と舞う花びら。人物は画面の右寄りに置き、左は文字のために空ける。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-koharu-normal.webp`](#ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="bg-station"></a>

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

<a id="bg-slope-day"></a>

## 背景：花見坂と大桜（昼）

- ファイル: `public/games/sakura-novel/img/bg-slope-day.webp`（1600×900px）
- 用途: 物語の中心の場所。昼の場面・回想（セピア）・夕方（色を重ねて）
- 内容: 丘の上へまっすぐのびる石畳の坂。両側に桜並木、坂のなかほどにひときわ太い大桜と、その根もとに色あせた木のベンチ。坂の上に小さな写真館。春の青空。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="bg-slope-night"></a>

## 背景：夜桜の花見坂

- ファイル: `public/games/sakura-novel/img/bg-slope-night.webp`（1600×900px）
- 用途: 前夜と、最後の夜の場面
- 内容: bg-slope-day と同じ坂の夜。両側にぼんぼり（紙の灯籠）が並び、桜がほのかに白く浮かぶ「花明かり」。藍色の夜空、大桜とベンチ。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-slope-day.webp`](#bg-slope-day) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="bg-studio-out"></a>

## 背景：桐野写真館（外観）

- ファイル: `public/games/sakura-novel/img/bg-studio-out.webp`（1600×900px）
- 用途: 写真館の前の場面
- 内容: 坂の上の、白いペンキのはげかけた木造二階建ての小さな写真館。緑色の扉、写真の額がたくさん並んだショーウィンドウ（写真の中身はぼかす）。足もとに桜の花びら。人物・文字なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

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

<a id="bg-studio-in"></a>

## 背景：写真館の店内

- ファイル: `public/games/sakura-novel/img/bg-studio-in.webp`（1600×900px）
- 用途: 写真館の中の場面（いちばん多く出てくる背景）
- 内容: 古い木の床と木のカウンター、壁に額入りの記念写真（顔はぼかす）、奥に背景布をおろした撮影スペースと三脚にのった大きな木製の古いカメラ。窓から午後のあたたかな光。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

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

<a id="bg-darkroom"></a>

## 背景：赤い光の暗室

- ファイル: `public/games/sakura-novel/img/bg-darkroom.webp`（1600×900px）
- 用途: 第三章、写真を焼く場面
- 内容: 赤いセーフライトだけが灯る写真の暗室。三つ並んだ現像用のバット、古い引き伸ばし機、洗濯ばさみで吊るした印画紙（絵柄はぼんやり）。赤と黒の静かな空間。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

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

<a id="bg-bookshop"></a>

## 背景：古書店「坂下堂」

- ファイル: `public/games/sakura-novel/img/bg-bookshop.webp`（1600×900px）
- 用途: 第二章、灯の家の古書店
- 内容: 駅前の小さな古書店。天井まで届く本棚、窓ぎわに小さな喫茶のカウンターとコーヒーカップ、ランプのあたたかい光、光の中のほこり。人物なし、本の背表紙の文字は読めないように。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

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

<a id="bg-river-dusk"></a>

## 背景：灯川の土手（夕暮れ）

- ファイル: `public/games/sakura-novel/img/bg-river-dusk.webp`（1600×900px）
- 用途: 第四章と灯の結末、川原の場面（夜は色を重ねて）
- 内容: 夕暮れの川の土手。川面が金色に光り、土手の桜並木にぼんぼりが等間隔に吊るされている（まだ灯っていない）。遊歩道、遠くの山なみ。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-station.webp`](#bg-station) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

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

<a id="ch-koharu-normal"></a>

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

<a id="ch-koharu-smile"></a>

## 小春（笑顔）

- ファイル: `public/games/sakura-novel/img/ch-koharu-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：小春・満面の笑み
- 内容: ch-koharu-normal と同じ小春で、目を細めた満面の笑み。服・髪・ポーズ・大きさ・白い背景はそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-koharu-normal.webp`](#ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 必ず ch-koharu-normal の完成画像を添付して編集します。出力が元の絵とずれたら「表情以外は 1 ピクセルも変えないで」と追加で頼みます。

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-koharu-normal). Keep everything exactly the same — her face shape, chin-length chestnut-brown bob, the small cherry-blossom clip on the left, amber eyes, cream knit cardigan, white collared blouse, olive-green pleated skirt, the film camera on its brown leather strap, the pose, the size and position in the frame, and the plain white background. Change only her facial expression to a big happy smile with her eyes gently closed into crescents and a little blush. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same 17-year-old girl as the reference image (chin-length chestnut-brown bob, small cherry-blossom clip on the left, amber eyes, cream knit cardigan over a white collared blouse, olive-green pleated skirt, vintage film camera on a brown leather strap), same knee-up pose and framing, plain white background; only the expression changes: a big happy smile with eyes closed into crescents and a light blush. Soft watercolor anime style, 2:3.
```

<a id="ch-koharu-surprised"></a>

## 小春（おどろき）

- ファイル: `public/games/sakura-novel/img/ch-koharu-surprised.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：小春・おどろいた顔
- 内容: ch-koharu-normal と同じ小春で、目を丸くして口を小さく開けたおどろきの表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-koharu-normal.webp`](#ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-koharu-normal). Keep everything exactly the same — face shape, chin-length chestnut-brown bob, cherry-blossom clip on the left, amber eyes, cream knit cardigan, white collared blouse, olive-green pleated skirt, film camera on the brown leather strap, pose, size, framing and the plain white background. Change only her facial expression to surprise: eyes wide open, eyebrows raised, mouth slightly open in a small 'oh'. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same 17-year-old girl as the reference image, same clothes, camera, pose and framing on a plain white background; only the expression changes to surprise: wide eyes, raised eyebrows, mouth slightly open. Soft watercolor anime style, 2:3.
```

<a id="ch-koharu-sad"></a>

## 小春（さびしげ）

- ファイル: `public/games/sakura-novel/img/ch-koharu-sad.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：小春・さびしげな顔
- 内容: ch-koharu-normal と同じ小春で、眉を下げて目をふせた、さびしげな表情。泣いてはいない。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-koharu-normal.webp`](#ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-koharu-normal). Keep everything exactly the same — face shape, chin-length chestnut-brown bob, cherry-blossom clip on the left, amber eyes, cream knit cardigan, white collared blouse, olive-green pleated skirt, film camera on the brown leather strap, pose, size, framing and the plain white background. Change only her facial expression to a quiet, wistful sadness: eyebrows lowered, eyes cast down, lips pressed softly, no tears. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same 17-year-old girl as the reference image, same clothes, camera, pose and framing on a plain white background; only the expression changes to quiet wistful sadness: lowered eyebrows, downcast eyes, no tears. Soft watercolor anime style, 2:3.
```

<a id="ch-akari-normal"></a>

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

<a id="ch-akari-smile"></a>

## 灯（ほほえみ）

- ファイル: `public/games/sakura-novel/img/ch-akari-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：灯・やわらかいほほえみ
- 内容: ch-akari-normal と同じ灯で、目もとをゆるめたやわらかなほほえみ。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-akari-normal.webp`](#ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-akari-normal). Keep everything exactly the same — face shape, waist-length straight black hair half-up with the navy ribbon, grey eyes, thin silver round glasses, navy dress with white round collar, beige apron, the cloth-bound book, pose, size, framing and the plain white background. Change only her facial expression to a soft, warm smile with relaxed eyes. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same girl as the reference image (waist-length black hair half-up with a navy ribbon, grey eyes, thin silver round glasses, navy dress with white collar, beige apron, cloth-bound book), same pose and framing on a plain white background; only the expression changes to a soft warm smile. Soft watercolor anime style, 2:3.
```

<a id="ch-akari-shy"></a>

## 灯（てれ）

- ファイル: `public/games/sakura-novel/img/ch-akari-shy.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：灯・照れた顔／少しおどろいた顔
- 内容: ch-akari-normal と同じ灯で、頬を赤らめて視線をそらし、本で口もとを少し隠す照れた表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-akari-normal.webp`](#ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-akari-normal). Keep everything exactly the same — face shape, black half-up hair with the navy ribbon, grey eyes, thin silver round glasses, navy dress, beige apron, size, framing and the plain white background. Change only her expression and hands slightly: cheeks blushing, eyes looking aside, the cloth-bound book raised a little to half-hide her mouth, shy. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same girl as the reference image, same clothes and framing on a plain white background; she is shy: blushing cheeks, eyes looking aside, the book raised a little to half-hide her mouth. Soft watercolor anime style, 2:3.
```

<a id="ch-akari-sad"></a>

## 灯（うれい）

- ファイル: `public/games/sakura-novel/img/ch-akari-sad.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：灯・うれいを帯びた顔
- 内容: ch-akari-normal と同じ灯で、眉をよせて目をふせた、心配そうなうれいの表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-akari-normal.webp`](#ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this girl (ch-akari-normal). Keep everything exactly the same — face shape, black half-up hair with the navy ribbon, grey eyes, thin silver round glasses, navy dress, beige apron, the book, pose, size, framing and the plain white background. Change only her facial expression to quiet worry: eyebrows drawn together, eyes cast down, lips slightly parted, no tears. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same girl as the reference image, same clothes, book, pose and framing on a plain white background; only the expression changes to quiet worry: drawn eyebrows, downcast eyes, no tears. Soft watercolor anime style, 2:3.
```

<a id="ch-kiyoshi-normal"></a>

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

<a id="ch-kiyoshi-smile"></a>

## 清（ほほえみ）

- ファイル: `public/games/sakura-novel/img/ch-kiyoshi-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：清・口もとだけの小さな笑み
- 内容: ch-kiyoshi-normal と同じ清で、目じりにしわを寄せた、口もとだけの控えめな笑み。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-kiyoshi-normal.webp`](#ch-kiyoshi-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this old man (ch-kiyoshi-normal). Keep everything exactly the same — face, short white hair, thick white eyebrows, white band-collar shirt with rolled sleeves, dark brown knitted vest, grey trousers, reading glasses on a cord, pose, size, framing and the plain white background. Change only his facial expression to a small, restrained smile: crinkles at the corners of the eyes, the mouth just slightly lifted. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same old photographer as the reference image, same clothes, pose and framing on a plain white background; only the expression changes to a small restrained smile with crinkled eyes. Soft watercolor anime style, 2:3.
```

<a id="ch-kiyoshi-distant"></a>

## 清（遠い目）

- ファイル: `public/games/sakura-novel/img/ch-kiyoshi-distant.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：清・昔を思う遠い目
- 内容: ch-kiyoshi-normal と同じ清で、少し横を向いて遠くを見る、昔を思うようなしずかな表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-kiyoshi-normal.webp`](#ch-kiyoshi-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this old man (ch-kiyoshi-normal). Keep everything exactly the same — face, short white hair, thick white eyebrows, clothes, reading glasses on a cord, body pose, size, framing and the plain white background. Change only his expression and gaze: head turned slightly to the side, eyes looking far away into the distance, a quiet, wistful, remembering look. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same old photographer as the reference image, same clothes and framing on a plain white background; he looks slightly aside into the distance with a quiet, wistful, remembering expression. Soft watercolor anime style, 2:3.
```

<a id="ch-harue-normal"></a>

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

<a id="ch-harue-smile"></a>

## 春江（ほほえみ）

- ファイル: `public/games/sakura-novel/img/ch-harue-smile.webp`（720×1080px・背景は透過）
- 用途: 立ち絵：春江・目を細めたほほえみ
- 内容: ch-harue-normal と同じ春江で、目を細めてうれしそうにほほえむ表情。ほかはそのまま。
- おすすめのツール: [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) ― サイズ: 縦横比を文章で指示（16:9 など）。透過: 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います
- 参照画像: [`img/ch-harue-normal.webp`](#ch-harue-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Gemini（画像生成 / Imagen・Nano Banana）用のプロンプト**

```text
Use the attached image of this elderly woman (ch-harue-normal). Keep everything exactly the same — face, silver-white hair in a low bun with the tortoiseshell comb, lavender cardigan, cream blouse, grey skirt, shawl, pose, size, framing and the plain white background. Change only her facial expression to a warm, happy smile with her eyes narrowed and the smile lines deepened. Portrait 2:3, same canvas size.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same elderly woman as the reference image, same clothes and framing on a plain white background; only the expression changes to a warm happy smile with narrowed eyes. Soft watercolor anime style, 2:3.
```

<a id="cg-photo"></a>

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

<a id="cg-koharu"></a>

## イベント絵：ファインダー越しの春（小春）

- ファイル: `public/games/sakura-novel/img/cg-koharu.webp`（1600×900px）
- 用途: 小春の結末のイベント絵
- 内容: 朝の花見坂、花吹雪の中で、フィルムカメラを胸の高さに下ろしてこちらに笑いかける小春。大桜とベンチが背景に。やわらかな逆光。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-koharu-normal.webp`](#ch-koharu-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="cg-akari"></a>

## イベント絵：川面の灯（灯）

- ファイル: `public/games/sakura-novel/img/cg-akari.webp`（1600×900px）
- 用途: 灯の結末のイベント絵
- 内容: 夜の川の土手、灯ったぼんぼりの列の下で、手紙を胸に持ち、眼鏡にあかりを映して照れたようにほほえむ灯。川面にぼんぼりの光と桜の花びら。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-akari-normal.webp`](#ch-akari-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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

<a id="cg-night"></a>

## イベント絵：花明かりの下の再会

- ファイル: `public/games/sakura-novel/img/cg-night.webp`（1600×900px）
- 用途: 真の結末のイベント絵
- 内容: 夜桜の大桜の下、ぼんぼりの光。ベンチに座る春江に、清が古い茶封筒を両手で差しだしている。花びらが舞い、ふたりとも涙ぐみながら笑っている。少し離れた手前に、カメラを構えた小春と、春江を見守る灯の後ろ姿がぼんやりと。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/ch-kiyoshi-normal.webp`](#ch-kiyoshi-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
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
