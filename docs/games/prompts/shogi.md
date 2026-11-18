# 縁側将棋 ― 画像の生成プロンプト

ゲーム: `public/games/shogi/`（7 枚中 0 枚が生成済み、7 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/shogi/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夏の夕暮れ、古い日本家屋の縁側。やわらかな水彩画とアニメ調の中間のタッチで、あたたかい木の色（飴色・檜）、夕焼けのオレンジ、庭の深い緑、すだれ越しのやわらかい光。人物はやさしい線のアニメ調（セル塗り＋淡い水彩の影）、背景は絵画的。懐かしく、静かで、少しだけユーモラス。将棋の駒や盤の文字は描かず（崩れた文字になるため）、画像の中に文字・ロゴ・透かしは入れません。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/shogi/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- shogi` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- shogi`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#key) | 1600×900 | キービジュアル | タイトル画面の背景（全面）。中央〜右に設定パネルが重なるので、主役の将棋盤は左寄りに | Midjourney（v7） |
| ⬜ | [`img/bg-room.webp`](#bg-room) | 1600×1000 | 背景 | 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示） | Midjourney（v7） |
| ⬜ | [`img/portrait-tama.webp`](#portrait-tama) | 512×512 | 人物 | 入門の対局相手（三毛猫）。対局画面とタイトルの相手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-sota.webp`](#portrait-sota) | 512×512 | 人物 | 初級の対局相手（近所の小学生） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-chikage.webp`](#portrait-chikage) | 512×512 | 人物 | 中級の対局相手（大学の将棋部員） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/portrait-genzo.webp`](#portrait-genzo) | 512×512 | 人物 | 上級の対局相手（この家のおじいさん） | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/item-furin.webp`](#item-furin) | 240×400（透過） | アイテム | タイトル画面の飾り（左上で風に揺れるアニメーション） | ChatGPT（画像生成 / GPT Image） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key"></a>

## キービジュアル：夕暮れの縁側と将棋盤

- ファイル: `public/games/shogi/img/key.webp`（1600×900px）
- 用途: タイトル画面の背景（全面）。中央〜右に設定パネルが重なるので、主役の将棋盤は左寄りに
- 内容: 夏の夕方、古民家の縁側に置かれた脚付きの将棋盤。軒先にガラスの風鈴、盤の横で三毛猫が丸くなって眠り、お盆に麦茶のグラスが 2 つ。奥には紫陽花と石灯籠のある緑の庭、すだれ越しに夕日のオレンジの光。人物はいない。左側に将棋盤、右側は空と庭の落ち着いた余白。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: 盤の上の駒は描かないか、遠目に小さく（駒の文字が崩れるため）。右側にタイトルの設定パネルが重なるので、右半分は情報の少ない空・庭に。

**Midjourney（v7）用のプロンプト**

```text
a thick wooden shogi board on legs resting on the engawa veranda of an old Japanese wooden house at summer dusk, a glass wind chime hanging from the eaves, a calico cat curled up asleep beside the board, a lacquer tray with two glasses of iced barley tea, lush green garden with hydrangeas and a stone lantern, warm orange sunset light filtering through bamboo blinds, the board placed in the left third, calm open space on the right, painterly anime background art, soft watercolor texture, nostalgic, gentle light, no people --ar 16:9 --v 7 --style raw --no text, letters, kanji, logo, watermark, people
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji characters, logo, watermark, people, hands, modern furniture
```

**ほかのツール用（共通の英文プロンプト）**

```text
Painterly anime-style background illustration: a thick wooden shogi board on legs on the veranda (engawa) of an old Japanese house at summer dusk. A glass wind chime hangs from the eaves, a calico cat sleeps beside the board, two glasses of iced barley tea on a tray. Green garden with hydrangeas and a stone lantern, warm orange sunset light through bamboo blinds. Board in the left third, calm empty space on the right. No people, no text. Wide 16:9.
```

<a id="bg-room"></a>

## 背景：縁側に面した和室

- ファイル: `public/games/shogi/img/bg-room.webp`（1600×1000px）
- 用途: 対局画面の背景（盤の後ろ。暗めのグラデーションを重ねて表示）
- 内容: 縁側に面した畳の和室の内側。障子が開いていて、夕方の庭の緑とオレンジの光がぼんやり見える。中央は何もない畳（盤が重なるため）。コントラストは低め、少しぼかした、落ち着いた暖色。人物なし。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/key.webp`](#key) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: キービジュアルと同じ時間帯・同じ家に見えるように、key の画像 URL を --sref に付けると色調がそろいます。中央に盤が重なるので、中央は単調な畳で。

**Midjourney（v7）用のプロンプト**

```text
interior of a quiet traditional Japanese tatami room opening onto an engawa veranda and a summer garden at golden hour, shoji sliding doors pulled open, bamboo blinds, warm dim light, empty tatami floor in the center, shallow depth of field with soft bokeh, low contrast muted warm colors, painterly anime background art, calm atmosphere, no people --ar 16:10 --v 7 --style raw --no text, people, furniture in the center
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, people, furniture in the center, strong contrast, bright white areas
```

**ほかのツール用（共通の英文プロンプト）**

```text
Painterly anime-style background: the inside of a quiet Japanese tatami room that opens onto a veranda and a summer garden at golden hour. Shoji doors open, bamboo blinds, warm dim light, empty tatami floor in the center, soft focus and low contrast with muted warm colors. No people, no text. Aspect ratio 16:10.
```

<a id="portrait-tama"></a>

## 人物：たま（入門・三毛猫）

- ファイル: `public/games/shogi/img/portrait-tama.webp`（512×512px）
- 用途: 入門の対局相手（三毛猫）。対局画面とタイトルの相手選び
- 内容: 縁側に住みついたぽっちゃりの三毛猫「たま」。座布団の上にきちんと座り、眠そうな半目で、少し得意げな口元。前足を片方あげて、今にも駒を指しそう。胸から上の構図で中央、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 4 人の対局相手は同じ niji で作り、最初の 1 枚（どれでも）の画像 URL を残りの 3 枚に --sref として付けて、線と塗りをそろえます。顔が中央に来るように（丸い枠で切り抜いて表示します）。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a chubby calico cat sitting upright on a purple zabuton cushion, round face, sleepy half-closed eyes, a tiny smug smile, one front paw raised as if about to make a move in a board game, soft warm light, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, game pieces with writing, human, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a chubby calico cat sitting upright on a purple floor cushion, round face, sleepy half-closed eyes and a small smug smile, one front paw raised as if about to make a move. Soft warm light, plain pale cream background, centered, square 1:1. No text.
```

<a id="portrait-sota"></a>

## 人物：そうた（初級・小学生）

- ファイル: `public/games/shogi/img/portrait-sota.webp`（512×512px）
- 用途: 初級の対局相手（近所の小学生）
- 内容: 近所に住む小学 4 年生の男の子「そうた」。日焼けした頬、短いぼさぼさの黒髪、鼻に絆創膏。水色の半袖シャツ。自信満々の笑顔でこぶしを握る。胸から上、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-tama.webp`](#portrait-tama) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-tama の画像 URL を --sref に付けて絵柄をそろえます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a cheerful ten-year-old Japanese boy with short messy black hair, sun-tanned cheeks and a small adhesive bandage on his nose, wearing a light blue short-sleeved summer shirt, confident toothy grin, clenched fist raised in determination, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, logo on clothes, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a cheerful ten-year-old Japanese boy: short messy black hair, sun-tanned cheeks, a small bandage on his nose, light blue short-sleeved shirt, confident grin with a raised fist. Plain pale cream background, centered, square 1:1. No text.
```

<a id="portrait-chikage"></a>

## 人物：千景（中級・大学将棋部）

- ファイル: `public/games/shogi/img/portrait-chikage.webp`（512×512px）
- 用途: 中級の対局相手（大学の将棋部員）
- 内容: 大学の将棋部に所属する 20 歳くらいの女性「千景（ちかげ）」。黒髪のロングを低い位置でひとつに結び、細い銀縁の眼鏡。白いブラウスに薄手のカーディガン。扇子を口元に添えて、穏やかで知的な微笑み。胸から上、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-tama.webp`](#portrait-tama) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-tama の画像 URL を --sref に付けて絵柄をそろえます。扇子に文字を入れないこと。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a calm young Japanese woman around twenty, a university student, long black hair tied in a low ponytail, thin silver-rimmed glasses, white blouse under a light summer cardigan, holding a closed folding fan near her chin, gentle intelligent smile, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, writing on the fan, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a calm young Japanese woman around twenty: long black hair in a low ponytail, thin silver-rimmed glasses, white blouse and light cardigan, holding a closed folding fan near her chin, gentle intelligent smile. Plain pale cream background, centered, square 1:1. No text.
```

<a id="portrait-genzo"></a>

## 人物：源三（上級・縁側の主）

- ファイル: `public/games/shogi/img/portrait-genzo.webp`（512×512px）
- 用途: 上級の対局相手（この家のおじいさん）
- 内容: この家の主、70 代のおじいさん「源三（げんぞう）」。はげ頭に白くて太い眉、整えた白いあごひげ。藍色の甚平を着て、うちわを持つ。やさしいけれど、どこか手ごわそうないたずらっぽい笑み。胸から上、淡い暖色の無地の背景。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/portrait-tama.webp`](#portrait-tama) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: portrait-tama の画像 URL を --sref に付けて絵柄をそろえます。うちわに文字を入れないこと。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
bust-up portrait of a kind elderly Japanese man in his seventies, bald head, thick white eyebrows, a neatly trimmed white beard, wearing a dark indigo jinbei summer outfit, holding a round paper uchiwa fan, warm wise smile with a mischievous glint in his eyes, plain pale cream background, centered composition, gentle anime illustration with soft cel shading and light watercolor shadows --niji 6 --ar 1:1
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, writing on the fan, frame
```

**ほかのツール用（共通の英文プロンプト）**

```text
Gentle anime-style bust-up portrait of a kind elderly Japanese man in his seventies: bald head, thick white eyebrows, neat white beard, dark indigo jinbei summer outfit, holding a round paper fan, warm wise smile with a mischievous glint. Plain pale cream background, centered, square 1:1. No text.
```

<a id="item-furin"></a>

## 風鈴

- ファイル: `public/games/shogi/img/item-furin.webp`（240×400px・背景は透過）
- 用途: タイトル画面の飾り（左上で風に揺れるアニメーション）
- 内容: ガラスの風鈴を 1 つ。透明なガラスの鈴に金魚と水の波紋の絵、赤いひも、その下に長い短冊（短冊には何も書かない）。正面から、全体が入るように。背景は透過。
- おすすめのツール: [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) ― サイズ: 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示。透過: 「背景を透明にした PNG で」と指示すると透過 PNG で出せます
- メモ: 透過 PNG で出せない場合は、真っ白な無地の背景で作れば game-images が切り抜きます。上端（ひもの先）が画像の上端の近くに来るように。

**ChatGPT（画像生成 / GPT Image）用のプロンプト**

```text
Draw a single Japanese glass wind chime (furin): a clear glass bell hand-painted with two small red goldfish and blue water ripples, a red string with a small glass clapper, and a long plain pale-blue paper strip hanging below it (leave the paper strip completely blank, no writing). Soft watercolor-like anime illustration style, front view, the whole object centered and fully visible with a little margin. Transparent background PNG, portrait orientation 1024×1536.
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, kanji on the paper strip, background, shadow on the ground
```

**ほかのツール用（共通の英文プロンプト）**

```text
A single Japanese glass wind chime: clear glass bell painted with two red goldfish and blue ripples, red string, a long blank pale-blue paper strip hanging below (no writing). Soft watercolor anime illustration, front view, whole object centered. Transparent or plain white background, portrait 3:5.
```
