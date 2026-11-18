# 夜空のアーチ ― 画像の生成プロンプト

ゲーム: `public/games/homerun-derby/`（8 枚中 0 枚が生成済み、8 枚が画像サンプル）。このファイルは `npm run game-images` が `public/games/homerun-derby/images.json` から書き出します（直接編集しないでください）。

## 全体のアートディレクション

夏の夜のナイター。濃い藍の夜空、照明塔のまぶしい白い光、芝の深い緑、遠くの花火。少しドラマチックで爽やかなイラスト。実在の球場・球団・選手・ロゴ・ユニフォームに似せず、ユニフォームは無地（文字・ロゴ・背番号なし）。画像の中に文字・看板の文字・スコアボードの数字は入れません。

## 差し替えの手順

1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。
2. できた画像を `public/games/homerun-derby/img/<ファイル名>.png`（.jpg / .webp も可・サイズは自由）として保存します。
3. `npm run game-images -- homerun-derby` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。
4. ゲームのカードのプレビュー画像も撮り直すときは `npm run capture -- homerun-derby`。

## 画像の一覧

| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |
|---|---|---|---|---|---|
| ⬜ | [`img/key.webp`](#key) | 1600×1000 | キービジュアル | タイトル画面の背景（中央にロゴとボタンが重なります） | Midjourney（v7） |
| ⬜ | [`img/bg-plate.webp`](#bg-plate) | 1600×1000 | 背景 | 打席の画面の奥（地平線より上だけを使い、その下の芝・マウンド・投手はコードで描きます） | Midjourney（v7） |
| ⬜ | [`img/bg-outfield.webp`](#bg-outfield) | 1600×1000 | 背景 | 打球を追う画面の空（地平線より上だけを使い、外野・フェンス・客席の手前はコードで描きます） | Midjourney（v7） |
| ⬜ | [`img/pitcher-1.webp`](#pitcher-1) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-2.webp`](#pitcher-2) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-3.webp`](#pitcher-3) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-4.webp`](#pitcher-4) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |
| ⬜ | [`img/pitcher-5.webp`](#pitcher-5) | 600×800 | 人物 | 勝負の前の紹介カードと投手選び | niji・journey（Midjourney の `--niji 6`） |

⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み

<a id="key"></a>

## キービジュアル：夏の夜空へ打ち上がるアーチ

- ファイル: `public/games/homerun-derby/img/key.webp`（1600×1000px）
- 用途: タイトル画面の背景（中央にロゴとボタンが重なります）
- 内容: 夏の夜のナイター球場。打者の後ろ姿のシルエットがバットを振り抜き、白い打球が藍色の夜空へ大きな弧を描いて飛んでいく。照明塔の光、満員の客席の小さな灯り、外野の向こうに打ち上げ花火。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ロゴとボタンを中央に重ねるので、打球の弧は上半分に。看板・スコアボードに文字が出たら消してください。

**Midjourney（v7）用のプロンプト**

```text
a summer night baseball stadium, a batter seen from behind in silhouette after a full swing, a white baseball flying high in a long glowing arc into the deep indigo night sky, bright white floodlight towers, a packed crowd as tiny lights, colorful fireworks bursting beyond the outfield, cinematic wide shot, dramatic yet refreshing mood, painterly illustration, plain uniform without logos or numbers, no text --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team names, scoreboard numbers, real stadium, real player --no text, logo, numbers
```

**ほかのツール用（共通の英文プロンプト）**

```text
Wide 16:10 illustration of a summer night baseball stadium: a batter seen from behind in silhouette after a full swing, a white ball flying in a long glowing arc into a deep indigo night sky, bright floodlight towers, a packed crowd as tiny lights, fireworks beyond the outfield. Painterly, dramatic but refreshing. Plain uniform, no logos, no numbers, no text.
```

<a id="bg-plate"></a>

## 背景：捕手の後ろから見た夜の球場（外野席と照明）

- ファイル: `public/games/homerun-derby/img/bg-plate.webp`（1600×1000px）
- 用途: 打席の画面の奥（地平線より上だけを使い、その下の芝・マウンド・投手はコードで描きます）
- 内容: ホームベースの後ろ・捕手の目線から、まっすぐ中堅方向を見た夜の球場。画像の下端に外野フェンスの上端がくる構図で、その上に外野席、照明塔、文字のない大きなスコアボードのシルエット、藍色の夜空と星。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- メモ: ゲームは画像の下端を地平線に合わせ、それより上だけを表示します。左右対称に近いと、投手とストライクゾーンの後ろがすっきりします。

**Midjourney（v7）用のプロンプト**

```text
night baseball stadium seen from directly behind home plate at catcher's eye level, looking straight toward center field, the top of the outfield wall runs along the very bottom edge of the image, above it the outfield stands with a crowd as soft lights, tall floodlight towers glowing white, a large blank scoreboard silhouette without any text, deep indigo starry summer sky, symmetrical composition, painterly, soft bokeh --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, advertising, players, real stadium --no text, numbers, logo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Night baseball stadium seen from directly behind home plate at catcher's eye level, looking at center field. The top of the outfield wall runs along the bottom edge; above it outfield stands with a crowd as soft lights, tall glowing floodlight towers, a blank scoreboard silhouette with no text, deep indigo starry summer sky. Symmetrical, painterly. 16:10. No text.
```

<a id="bg-outfield"></a>

## 背景：外野方向の夜空と客席（打球を追う画面）

- ファイル: `public/games/homerun-derby/img/bg-outfield.webp`（1600×1000px）
- 用途: 打球を追う画面の空（地平線より上だけを使い、外野・フェンス・客席の手前はコードで描きます）
- 内容: 高い位置から外野方向を見た夜空。下端に外野スタンド上段のシルエットと照明塔、その上に広い藍色の夜空、細い雲、遠くの街の灯り、小さな打ち上げ花火。
- おすすめのツール: [Midjourney（v7）](https://www.midjourney.com/) ― サイズ: `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）
- 参照画像: [`img/bg-plate.webp`](#bg-plate) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: bg-plate と同じ色調で。空が広いほど、打球が空を飛ぶ様子が映えます。

**Midjourney（v7）用のプロンプト**

```text
wide night sky above the upper outfield stands of a baseball stadium, the stands and floodlight towers as dark silhouettes along the bottom edge, a vast deep indigo summer sky with thin clouds and stars, faint city lights on the horizon, a few small distant fireworks, calm and spacious, painterly --ar 16:10 --v 7 --style raw
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, advertising, people close-up --no text, logo
```

**ほかのツール用（共通の英文プロンプト）**

```text
Wide 16:10 night sky above the upper outfield stands of a baseball stadium: stands and floodlight towers as dark silhouettes along the bottom edge, a vast deep indigo summer sky with thin clouds and stars, faint city lights, a few small distant fireworks. Calm, spacious, painterly. No text.
```

<a id="pitcher-1"></a>

## 投手：夏木ハヤト（新人の速球派）

- ファイル: `public/games/homerun-derby/img/pitcher-1.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: 18 歳くらいの新人の男性投手。紺の帽子から黒い短髪、日焼けした肌、白地に紺のラインの無地のユニフォーム。ボールを前に突き出して自信満々に笑う。背景は夜の球場の照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- メモ: 5 人の投手は同じツール（niji）・同じ画風・同じ背景（夜の照明のボケ）でそろえます。2 人目以降は pitcher-1 を参照画像（--sref または --cref）にすると画風がそろいます。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of an 18-year-old rookie baseball pitcher, energetic confident grin, short black hair under a navy cap, tanned skin, plain white uniform with navy trim and no logos or lettering, holding a baseball out toward the viewer, night stadium floodlight bokeh background, clean cel shading, vivid summer night colors --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of an 18-year-old rookie baseball pitcher with a confident grin, short black hair under a navy cap, tanned skin, plain white uniform with navy trim (no logos or lettering), holding a ball toward the viewer, night stadium floodlight bokeh behind. 3:4. No text.
```

<a id="pitcher-2"></a>

## 投手：弓張ツキノ（月夜のカーブ使い）

- ファイル: `public/games/homerun-derby/img/pitcher-2.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: クールな女性の左投手。長いポニーテール、濃紺に金のラインの無地のユニフォーム。カーブの握りのボールを顔の横に構え、横目でこちらを見る。背景に細い三日月と照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a cool young female left-handed baseball pitcher, long dark ponytail, calm sideways glance, dark navy uniform with gold trim and no logos or lettering, holding a baseball with a curveball grip beside her face in her left hand, thin crescent moon and floodlight bokeh in the night sky behind, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a cool young female left-handed pitcher, long dark ponytail, calm sideways glance, dark navy uniform with gold trim (no logos), holding a ball with a curveball grip beside her face in her left hand, thin crescent moon and floodlight bokeh behind. 3:4. No text.
```

<a id="pitcher-3"></a>

## 投手：岩城ゴウ（剛腕フォーク）

- ファイル: `public/games/homerun-derby/img/pitcher-3.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: がっしりした大柄の男性投手。短い無精ひげ、鋭い目つき、黒地にオレンジのラインの無地のユニフォーム。人差し指と中指の間にボールを深く挟むフォークの握りを見せる。背景は照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a big burly power pitcher, stern sharp eyes, short stubble, plain black uniform with orange trim and no logos or lettering, showing a forkball grip with the ball wedged deep between index and middle fingers, intense steam of breath, night stadium floodlight bokeh background, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a big burly power pitcher with stern eyes and short stubble, plain black uniform with orange trim (no logos), showing a forkball grip with the ball wedged between index and middle fingers, night stadium floodlight bokeh behind. 3:4. No text.
```

<a id="pitcher-4"></a>

## 投手：朧ミツキ（横手投げの変化球師）

- ファイル: `public/games/homerun-derby/img/pitcher-4.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: 細身で中性的な雰囲気の横手投げの投手。涼しげな半目の微笑み、白地に紫のラインの無地のユニフォーム。腕を横に伸ばした投球フォームの途中。背景は霧がかった照明のボケ。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a slender androgynous sidearm baseball pitcher, calm mysterious half-lidded smile, plain white uniform with purple trim and no logos or lettering, arm extended sideways mid sidearm delivery, misty haze and soft floodlight bokeh in the night behind, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a slender androgynous sidearm pitcher with a calm, mysterious half-lidded smile, plain white uniform with purple trim (no logos), arm extended sideways mid-delivery, misty floodlight bokeh behind. 3:4. No text.
```

<a id="pitcher-5"></a>

## 投手：星海ジン（夜空の絶対エース）

- ファイル: `public/games/homerun-derby/img/pitcher-5.webp`（600×800px）
- 用途: 勝負の前の紹介カードと投手選び
- 内容: 背の高いエース投手。鋭い目、落ち着いた表情、濃紺に銀のラインの無地のユニフォーム。帽子のつばに手をかけ、満天の星空と照明を背にこちらを見すえる。上半身。
- おすすめのツール: [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) ― サイズ: `--ar 2:3` などの縦横比パラメーター
- 参照画像: [`img/pitcher-1.webp`](#pitcher-1) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます
- メモ: pitcher-1 と同じ画風・背景で。

**niji・journey（Midjourney の `--niji 6`）用のプロンプト**

```text
anime style upper-body portrait of a tall ace baseball pitcher, sharp focused eyes, composed expression, plain midnight blue uniform with silver trim and no logos or lettering, one hand touching the brim of his cap, glove at his chest, a starry summer night sky and floodlights behind him, subtle glow, clean cel shading --niji 6 --ar 3:4
```

**ネガティブプロンプト（入れたくないもの）**

```text
text, letters, numbers, logos, team name, real person
```

**ほかのツール用（共通の英文プロンプト）**

```text
Anime-style upper-body portrait of a tall ace pitcher with sharp, focused eyes, plain midnight-blue uniform with silver trim (no logos), one hand on the brim of his cap, glove at his chest, starry summer night sky and floodlights behind. 3:4. No text.
```
