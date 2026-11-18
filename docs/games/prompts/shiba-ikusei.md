# こしば日和 ― 画像の生成プロンプト

ゲーム: `public/games/shiba-ikusei/`（14 枚中 0 枚が生成済み、14 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/shiba-ikusei/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

やわらかな絵本調のイラスト。生成り・はちみつ色・若草色・空色の、あたたかく明るい配色。輪郭はやさしく、影は少なめで、ほっとする家庭的な空気。画像の中に文字・ロゴ・透かしを入れない。【犬の設定（オリジナル。各プロンプトにも同じ記述を入れています）】赤柴の子犬：毛はあたたかいはちみつ色の赤茶、ほほ・口のまわり・のど・胸・おなか・足の内側・しっぽの裏が生成り色（裏白）、目の上に小さな生成り色の点（麻呂眉）、黒い鼻、こげ茶の丸い目、三角の立ち耳、背中でくるんと巻いたしっぽ、首に若草色の首輪と小さな金色の鈴。成長段階：子犬（頭が大きく、ころころした体、短い足、耳は少し小さめ）、若犬（手足が伸びて少しスリム、耳が大きく見える）、成犬（がっしりした体、凛とした顔つき、ふさふさの胸毛）。部屋の背景はゲームが犬・家具をコードで重ねるので、床の中央〜下 1/3 をあけておきます。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/shiba-ikusei/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- shiba-ikusei` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- shiba-ikusei`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key-visual.webp`](#key-visual) | 1600×900 | キービジュアル | タイトル画面の背景（右側に子犬、左側にタイトルの文字） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/room-day.webp`](#room-day) | 1200×1200 | 背景 | 部屋の背景（現実の時計で 5〜16 時）。犬・家具はコードで重ねます | Midjourney（v7） |
| ⬜ | [`img/room-evening.webp`](#room-evening) | 1200×1200 | 背景 | 部屋の背景（16〜19 時） | Midjourney（v7） |
| ⬜ | [`img/room-night.webp`](#room-night) | 1200×1200 | 背景 | 部屋の背景（19〜5 時） | Midjourney（v7） |
| ⬜ | [`img/walk-bg.webp`](#walk-bg) | 2400×800 | 背景 | さんぽのミニゲームの遠景（横にスクロールし、くり返しつなげて表示） | Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111） |
| ⬜ | [`img/shiba-puppy-normal.webp`](#shiba-puppy-normal) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：子犬・ふつう（ほかの 8 枚の元の絵） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-puppy-happy.webp`](#shiba-puppy-happy) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：子犬・ごきげん | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-puppy-sad.webp`](#shiba-puppy-sad) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：子犬・しょんぼり（すねている） | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-young-normal.webp`](#shiba-young-normal) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：若犬・ふつう | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-young-happy.webp`](#shiba-young-happy) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：若犬・ごきげん | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-young-sad.webp`](#shiba-young-sad) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：若犬・しょんぼり | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-adult-normal.webp`](#shiba-adult-normal) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：成犬・ふつう | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-adult-happy.webp`](#shiba-adult-happy) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：成犬・ごきげん | ChatGPT（画像生成 / GPT Image） |
| ⬜ | [`img/shiba-adult-sad.webp`](#shiba-adult-sad) | 640×640（透過） | 人物 | ステータス欄・アルバムの絵：成犬・しょんぼり | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key-visual"></a>

## キービジュアル：窓辺の柴犬の子犬

- ファイル: `public/games/shiba-ikusei/img/key-visual.webp`（1600×900px）
- 用途: タイトル画面の背景（右側に子犬、左側にタイトルの文字）
- 内容: 日だまりの木の床に、赤いゴムボールを前においてちょこんと座り、首をかしげてこちらを見る赤柴の子犬。大きな窓の外に庭と青空、舞う花びら。子犬は画面の右寄り、左側は文字のためにやわらかく空ける。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: 犬の見た目は立ち絵（shiba-puppy-normal）と同じに。niji では --cref に完成した shiba-puppy-normal の URL を指定すると揃います。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
a cute original red Shiba Inu puppy sitting on a sunny wooden floor by a large window, honey-brown coat with cream markings on the cheeks, muzzle, throat, chest and belly, small cream eyebrow dots above the eyes, black nose, round dark brown eyes, triangular upright ears, curled tail, light green collar with a small golden bell, head tilted curiously toward the viewer, a red rubber ball with a white stripe in front of its paws, garden and blue sky outside the window, a few drifting petals, warm afternoon light, soft picture-book illustration, gentle colors, puppy placed on the right third, calm empty space on the left --niji 6 --ar 16:9 --no text, logo, watermark, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, watermark, people, extra dogs, realistic photo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Picture-book style illustration, 16:9. A cute original red Shiba Inu puppy (honey-brown coat with cream markings on the cheeks, muzzle, throat, chest and belly; small cream eyebrow dots; black nose; round dark-brown eyes; triangular upright ears; curled tail; light-green collar with a small golden bell) sits on a sunny wooden floor by a large window, head tilted curiously toward the viewer, a red rubber ball with a white stripe before its paws. Garden and blue sky outside, a few drifting petals, warm afternoon light. Puppy on the right third, calm empty space on the left for a title. No text, no people.
```

<a id="room-day"></a>

## 背景：へや（昼）

- ファイル: `public/games/shiba-ikusei/img/room-day.webp`（1200×1200px）
- 用途: 部屋の背景（現実の時計で 5〜16 時）。犬・家具はコードで重ねます
- 内容: 日本の家の明るいリビングの一角を正面から。木の床（下 40% ほど）、生成り色の壁、中央に大きな窓（外は庭と空）、窓の下に低い木の棚。床の中央はなにも置かずにあける。動物・人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 床と壁の境目は画面の高さの 55〜60% あたりに。スマホの縦長・PC の横長の両方でトリミングされるので、大事なものは中央に寄せます。昼・夕方・夜の 3 枚は同じ構図に（2 枚目以降はこの画像を --sref／画像プロンプトに）。

**Midjourney（v7）用のプロンプト**

```text
front view of a cozy corner of a Japanese family living room, warm wooden floorboards filling the lower 40 percent, cream plaster wall, a large wooden-framed window in the centre showing a small garden and blue sky, a low wooden shelf under the window with a few small plants, soft daylight, the floor in the centre and lower third left completely empty, soft picture-book illustration, warm gentle colors, flat perspective, no animals, no people --ar 1:1 --v 7 --style raw --no text, letters, logo, animals, people, furniture in the centre
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, animals, people, sofa or table in the centre of the floor
```

**ほかのツール用（共通の英文プロンプト）**

```text
Front view of a cozy corner of a Japanese family living room, square 1:1. Warm wooden floorboards fill the lower 40%, cream plaster wall, a large wooden-framed window in the centre showing a small garden and blue sky, a low wooden shelf under the window with a few small plants, soft daylight. Leave the centre and the lower third of the floor completely empty (the game draws the dog and furniture there). Soft picture-book illustration, warm gentle colours, flat perspective, no animals, no people, no text.
```

<a id="room-evening"></a>

## 背景：へや（夕方）

- ファイル: `public/games/shiba-ikusei/img/room-evening.webp`（1200×1200px）
- 用途: 部屋の背景（16〜19 時）
- 内容: room-day と同じ部屋・同じ構図の夕方。窓の外は夕焼け、部屋に琥珀色の光が斜めに差しこむ。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/room-day.webp`](#room-day) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
the same cozy Japanese living room corner at sunset, same composition: wooden floor in the lower 40 percent, cream wall, large wooden-framed window in the centre with an orange and pink sunset sky over the garden, warm amber light slanting across the floor, low wooden shelf with small plants, the centre of the floor left empty, soft picture-book illustration, no animals, no people --ar 1:1 --v 7 --style raw --no text, letters, logo, animals, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, animals, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same cozy Japanese living-room corner at sunset, same composition (wooden floor in the lower 40%, cream wall, large wooden window in the centre, low shelf with small plants). Orange and pink sunset sky outside, warm amber light slanting across the floor. Centre of the floor empty. Soft picture-book illustration, square, no animals, no people, no text.
```

<a id="room-night"></a>

## 背景：へや（夜）

- ファイル: `public/games/shiba-ikusei/img/room-night.webp`（1200×1200px）
- 用途: 部屋の背景（19〜5 時）
- 内容: room-day と同じ部屋・同じ構図の夜。窓の外に月と星、部屋はスタンドの小さなあかりで青とオレンジの静かな色。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/room-day.webp`](#room-day) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**Midjourney（v7）用のプロンプト**

```text
the same cozy Japanese living room corner at night, same composition: wooden floor in the lower 40 percent, cream wall in blue shadow, large wooden-framed window in the centre with a crescent moon and stars over the dark garden, a small warm floor lamp glow on the side, low wooden shelf with small plants, calm and sleepy mood, the centre of the floor left empty, soft picture-book illustration, no animals, no people --ar 1:1 --v 7 --style raw --no text, letters, logo, animals, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, logo, animals, people
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same cozy Japanese living-room corner at night, same composition. A crescent moon and stars over the dark garden outside the window, the room in calm blue shadow with a small warm lamp glow on one side, sleepy mood. Centre of the floor empty. Soft picture-book illustration, square, no animals, no people, no text.
```

<a id="walk-bg"></a>

## 背景：さんぽ道（横につながる）

- ファイル: `public/games/shiba-ikusei/img/walk-bg.webp`（2400×800px）
- 用途: さんぽのミニゲームの遠景（横にスクロールし、くり返しつなげて表示）
- 内容: 横にどこまでもつながる、のどかな町はずれの道の遠景。青空と雲、遠くの山なみ、田んぼ、低い家並み、電柱のない川ぞいの土手。下 1/4 はゲームが道を描くので、草地だけのシンプルな絵に。左右の端がぴったりつながる。
- おすすめのツール: [Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111）](https://stability.ai/) ― サイズ: 幅・高さを直接指定（SDXL は 1024×1024・1344×768・768×1344 など約 100 万画素で）
- メモ: SDXL は 1536×512 などで生成し、AUTOMATIC1111 / Fooocus の「Tiling（タイリング）」をオンにすると左右がつながります。生成後に 2400×800 に拡大。季節の色はゲームが重ねるので、春でも夏でもない「若葉」くらいの色に。

**Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111）用のプロンプト**

```text
seamless horizontally tileable side-scrolling game background, peaceful Japanese countryside town edge, blue sky with soft clouds, distant soft green mountains, rice fields, a few low traditional houses with tiled roofs, a riverside embankment with trees, flat side view, soft picture-book illustration, gentle pastel colors, the bottom quarter is plain grass only, no characters, no animals, wide panorama, high quality
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo, watermark, people, animals, cars, power lines, utility poles, signboards, perspective road, blurry, seams
```

**ほかのツール用（共通の英文プロンプト）**

```text
A seamless, horizontally tileable side-scrolling game background (2400×800, 3:1): the peaceful edge of a Japanese country town — blue sky with soft clouds, distant soft green mountains, rice fields, a few low traditional houses with tiled roofs, a riverside embankment with trees. Flat side view, soft picture-book illustration, gentle pastel colours. The bottom quarter is plain grass only (the game draws the path there). The left and right edges must join seamlessly. No people, animals, cars, poles or text.
```

<a id="shiba-puppy-normal"></a>

## 子犬（ふつう）

- ファイル: `public/games/shiba-ikusei/img/shiba-puppy-normal.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：子犬・ふつう（ほかの 8 枚の元の絵）
- 内容: 子犬の赤柴の上半身。ころころした体に大きな頭、少し小さめの立ち耳、こげ茶の丸い目、正面を向いて口を閉じたおだやかな顔。若草色の首輪と金色の鈴。透明な背景。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: 9 枚の基準になる絵です。残りの 8 枚は、この完成画像を ChatGPT に添付して「同じ犬・同じ画風・同じ大きさで」と頼むと揃います。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Create a transparent background PNG, square 1024×1024. A soft picture-book style illustration of an original red Shiba Inu PUPPY, upper body (chest up), centred, facing the viewer. Honey-brown coat; cream fur on the cheeks, muzzle, throat and chest; small cream eyebrow dots above the eyes; black nose; round dark-brown eyes; slightly small triangular upright ears; a big round head and a chubby little body; a light-green collar with a small golden bell. Calm, content expression with the mouth closed. Thin soft outlines, gentle shading, no text, nothing else in the picture.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, background, other animals, realistic photo, harness, clothes
```

**ほかのツール用（共通の英文プロンプト）**

```text
Transparent-background illustration, square. An original red Shiba Inu puppy, chest-up, centred, facing the viewer: honey-brown coat, cream cheeks/muzzle/throat/chest, small cream eyebrow dots, black nose, round dark-brown eyes, slightly small upright ears, big round head, chubby body, light-green collar with a small golden bell. Calm content expression, mouth closed. Soft picture-book style, no text.
```

<a id="shiba-puppy-happy"></a>

## 子犬（ごきげん）

- ファイル: `public/games/shiba-ikusei/img/shiba-puppy-happy.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：子犬・ごきげん
- 内容: shiba-puppy-normal と同じ子犬が、目を細めて口を開け、舌を少し出して笑っている。ほほがほんのり赤い。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-puppy-normal) as the reference: the exact same original red Shiba Inu puppy, same art style, same framing (chest up, centred), same size, same light-green collar and golden bell. Change only the expression: very happy, eyes squeezed into happy arcs, mouth open in a big smile with a little pink tongue showing, a light blush on the cheeks, ears perked. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu puppy as the reference image (same style, framing, collar and bell), now very happy: eyes squeezed into happy arcs, open smiling mouth with a little pink tongue, light blush, perked ears. Transparent background, square, no text.
```

<a id="shiba-puppy-sad"></a>

## 子犬（しょんぼり）

- ファイル: `public/games/shiba-ikusei/img/shiba-puppy-sad.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：子犬・しょんぼり（すねている）
- 内容: shiba-puppy-normal と同じ子犬が、耳をぺたんと寝かせ、上目づかいでしょんぼりしている。少しすねた顔。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-puppy-normal) as the reference: the exact same original red Shiba Inu puppy, same art style, same framing, same size, same collar and bell. Change only the expression and ears: ears folded flat back, looking up with sad puppy eyes, mouth closed in a small pout, a little sulky. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu puppy as the reference image, now sad and a little sulky: ears folded flat back, looking up with sad eyes, small pout. Same style, framing, collar and bell. Transparent background, square, no text.
```

<a id="shiba-young-normal"></a>

## 若犬（ふつう）

- ファイル: `public/games/shiba-ikusei/img/shiba-young-normal.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：若犬・ふつう
- 内容: 同じ柴犬が少し大きくなった若犬。顔が少しすっきりして、耳が大きく見える。おだやかな表情。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-puppy-normal.webp`](#shiba-puppy-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-puppy-normal) as the reference: the same original red Shiba Inu, same coat pattern (honey-brown with cream urajiro markings and cream eyebrow dots), same light-green collar and golden bell, same art style and framing (chest up, centred). Now show it as a YOUNG dog of about six months: a slimmer face, a slightly longer muzzle, ears that look large for the head, a lean chest. Calm, content expression, mouth closed. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu as the reference image, now a young dog of about six months: slimmer face, slightly longer muzzle, ears that look large, lean chest. Same markings, collar, bell, style and chest-up framing. Calm expression. Transparent background, square, no text.
```

<a id="shiba-young-happy"></a>

## 若犬（ごきげん）

- ファイル: `public/games/shiba-ikusei/img/shiba-young-happy.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：若犬・ごきげん
- 内容: shiba-young-normal と同じ若犬が、目を細めて口を開けて笑っている。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-young-normal.webp`](#shiba-young-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-young-normal) as the reference: the exact same young red Shiba Inu, same style, framing, size, collar and bell. Change only the expression: very happy, eyes in happy arcs, open smiling mouth with the tongue showing, ears perked. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same young red Shiba Inu as the reference image, now very happy: happy-arc eyes, open smiling mouth with the tongue showing, perked ears. Same style and framing. Transparent background, square, no text.
```

<a id="shiba-young-sad"></a>

## 若犬（しょんぼり）

- ファイル: `public/games/shiba-ikusei/img/shiba-young-sad.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：若犬・しょんぼり
- 内容: shiba-young-normal と同じ若犬が、耳を寝かせてそっぽを向き、すねている。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-young-normal.webp`](#shiba-young-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-young-normal) as the reference: the exact same young red Shiba Inu, same style, framing, size, collar and bell. Change only the expression and pose of the head: ears folded back, head turned slightly away, eyes half-closed and glancing sideways, a sulky pout. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same young red Shiba Inu as the reference image, now sulking: ears folded back, head turned slightly away, half-closed eyes glancing sideways, a pout. Same style and framing. Transparent background, square, no text.
```

<a id="shiba-adult-normal"></a>

## 成犬（ふつう）

- ファイル: `public/games/shiba-ikusei/img/shiba-adult-normal.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：成犬・ふつう
- 内容: 同じ柴犬がおとなになった成犬。がっしりした体、ふさふさの胸の生成り色の毛、凛とした顔つき。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-young-normal.webp`](#shiba-young-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-young-normal) as the reference: the same original red Shiba Inu, same coat pattern, same light-green collar and golden bell, same art style and framing (chest up, centred). Now show it fully grown as an ADULT dog: a sturdy body, a thick fluffy cream ruff on the chest, a dignified, gentle face, confident upright ears. Calm, content expression, mouth closed. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same red Shiba Inu as the reference image, now a fully grown adult: sturdy body, thick fluffy cream chest ruff, dignified gentle face, confident upright ears. Same markings, collar, bell, style and chest-up framing. Calm expression. Transparent background, square, no text.
```

<a id="shiba-adult-happy"></a>

## 成犬（ごきげん）

- ファイル: `public/games/shiba-ikusei/img/shiba-adult-happy.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：成犬・ごきげん
- 内容: shiba-adult-normal と同じ成犬が、目を細めて口を開けた、柴犬らしい満面の笑み。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-adult-normal.webp`](#shiba-adult-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-adult-normal) as the reference: the exact same adult red Shiba Inu, same style, framing, size, collar and bell. Change only the expression: a big happy smile typical of the breed, eyes in happy arcs, mouth open with the tongue showing. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same adult red Shiba Inu as the reference image, now with a big happy smile: happy-arc eyes, open mouth with the tongue showing. Same style and framing. Transparent background, square, no text.
```

<a id="shiba-adult-sad"></a>

## 成犬（しょんぼり）

- ファイル: `public/games/shiba-ikusei/img/shiba-adult-sad.webp`（640×640px・背景は透過）
- 用途: ステータス欄・アルバムの絵：成犬・しょんぼり
- 内容: shiba-adult-normal と同じ成犬が、耳を寝かせて横目でこちらを見る、すねた表情。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- 参照画像: [`img/shiba-adult-normal.webp`](#shiba-adult-normal) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Use the attached image (shiba-adult-normal) as the reference: the exact same adult red Shiba Inu, same style, framing, size, collar and bell. Change only the expression: ears folded back, head turned slightly away, a side-eye glance with half-closed eyes, a sulky pout. Transparent background PNG, square 1024×1024, no text.
```

**ほかのツール用（共通の英文プロンプト）**

```text
The same adult red Shiba Inu as the reference image, now sulking: ears folded back, head turned slightly away, a side-eye glance, a pout. Same style and framing. Transparent background, square, no text.
```
