# ゲームの画像 ― 生成プロンプトの一覧

ゲームタブのゲームで使う画像は、いまはすべて「画像サンプル」です。各ゲームのシートにあるプロンプトで画像を生成し、`public/games/<id>/img/` に保存して `npm run game-images` を実行すると差し替わります。このファイルと各シートは `npm run game-images` が書き出します。

| ゲーム | 画像 | 生成済み | 使うツール |
|---|---|---|---|
| [クレーン横丁](crane-game.md) | 12 枚 | 12 枚 | ChatGPT、Recraft、Midjourney、niji・journey |
| [番狂わせ大富豪](daifugo.md) | 11 枚 | 0 枚 | Midjourney、Leonardo.Ai、niji・journey、Gemini |
| [ことば花火 ― 打って打ち上げるタイピング](hanabi-typing.md) | 5 枚 | 0 枚 | Midjourney、Ideogram、Gemini |
| [花暦こいこい](hanafuda-koikoi.md) | 53 枚 | 0 枚 | Midjourney、Ideogram、Adobe Firefly、niji・journey |
| [宵灯りのほこら](hokora-rpg.md) | 25 枚 | 0 枚 | niji・journey、Midjourney、Gemini、ChatGPT |
| [夜空のアーチ](homerun-derby.md) | 8 枚 | 0 枚 | Midjourney、niji・journey |
| [みやび札 ― 百人一首かるた](hyakunin-isshu.md) | 7 枚 | 0 枚 | Midjourney、Adobe Firefly、niji・journey |
| [筆まる漢字帖 ― 熟語クロス・四字熟語・難読漢字](jukugo-puzzle.md) | 5 枚 | 0 枚 | Recraft、FLUX.1、ChatGPT |
| [宵祭り金魚すくい](kingyo-sukui.md) | 12 枚 | 0 枚 | Midjourney、Adobe Firefly、niji・journey、Gemini、Recraft |
| [まちがい日和](machigai-sagashi.md) | 4 枚 | 0 枚 | ChatGPT、Midjourney、Recraft、Leonardo.Ai |
| [宵月麻雀](mahjong.md) | 8 枚 | 0 枚 | Midjourney、Adobe Firefly、niji・journey |
| [宵宮ビート](matsuri-rhythm.md) | 5 枚 | 0 枚 | Midjourney、Ideogram |
| [ナンプレ帖](nanpure.md) | 4 枚 | 0 枚 | Midjourney、Leonardo.Ai、niji・journey、ChatGPT |
| [ロジック絵巻](oekaki-logic.md) | 4 枚 | 0 枚 | Midjourney、Adobe Firefly、Gemini、Recraft |
| [千代紙飛行](orizuru-shooting.md) | 7 枚 | 0 枚 | Midjourney、ChatGPT |
| [喫茶しろくろ](reversi.md) | 6 枚 | 0 枚 | Ideogram、Midjourney、niji・journey |
| [花明かりの写真館](sakura-novel.md) | 27 枚 | 0 枚 | Midjourney、niji・journey、Gemini、Adobe Firefly |
| [こしば日和](shiba-ikusei.md) | 14 枚 | 0 枚 | niji・journey、Midjourney、Stable Diffusion XL、ChatGPT |
| [縁側将棋](shogi.md) | 7 枚 | 0 枚 | Midjourney、niji・journey、ChatGPT |
| [和菓子ころりん](wagashi-merge.md) | 14 枚 | 0 枚 | Leonardo.Ai、ChatGPT、Midjourney、Ideogram |
| **合計** | **238 枚** | **12 枚** | |

## ツールごとの使い分け

画像ごとに、向いているツールを「おすすめ」として選んでいます。ほかのツールで作りたいときは、各画像の「ほかのツール用（共通の英文プロンプト）」を使ってください。

| ツール | 枚数 | サイズの指定 | 透過が必要な画像 |
|---|---|---|---|
| [Midjourney（v7）](https://www.midjourney.com/) | 87 枚 | `--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整） | 透過はできないので、単色の背景で作って背景を切り抜きます（このツールが自動で切り抜きます） |
| [niji・journey（Midjourney の `--niji 6`）](https://nijijourney.com/) | 47 枚 | `--ar 2:3` などの縦横比パラメーター | 透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます） |
| [ChatGPT（画像生成 / GPT Image）](https://chatgpt.com/) | 39 枚 | 「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示 | 「背景を透明にした PNG で」と指示すると透過 PNG で出せます |
| [Gemini（画像生成 / Imagen・Nano Banana）](https://gemini.google.com/) | 23 枚 | 縦横比を文章で指示（16:9 など） | 透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います |
| [Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111）](https://stability.ai/) | 1 枚 | 幅・高さを直接指定（SDXL は 1024×1024・1344×768・768×1344 など約 100 万画素で） | 単色の背景で作って切り抜くか、rembg 等の背景除去を使います |
| [FLUX.1（dev / pro）](https://bfl.ai/) | 1 枚 | 幅・高さを直接指定（64 の倍数） | 単色の背景で作って切り抜きます |
| [Adobe Firefly（Image 4）](https://firefly.adobe.com/) | 6 枚 | 縦横比を画面で選択 | 生成後に Photoshop / Adobe Express の「背景を削除」で透過にできます |
| [Ideogram（3.0）](https://ideogram.ai/) | 7 枚 | 縦横比を画面で選択 | 「Transparent」背景の指定ができます（プランによる） |
| [Recraft（V3）](https://www.recraft.ai/) | 13 枚 | 縦横比を画面で選択（ベクター / アイコンのスタイルが得意） | 背景の削除機能で透過にできます |
| [Leonardo.Ai（Phoenix）](https://leonardo.ai/) | 14 枚 | 幅・高さを画面で選択 | 「Transparency」をオンにすると透過 PNG で出せます |
