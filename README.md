# Trust Portfolio — 制作過程の動画ポートフォリオ（Next.js）

制作の一部始終を録画した「制作プロセス動画」と、制作実績・公開中のデモ・ブラウザで遊べるゲームをまとめたポートフォリオです。
Next.js（App Router・TypeScript）で作っています。

```
npm install        初回のみ（Node.js 22.18 以上）
npm run dev        開発サーバー → http://localhost:3000
npm run build      本番ビルド（一覧・再生ページは静的に生成。管理画面と記録の受け口はサーバーで動きます）
npm start          ビルドしたものを http://localhost:3000 で配信（管理画面・アクセス解析を使うときはこの形で動かします）
```

| ページ | URL | 中身 |
| --- | --- | --- |
| 一覧 | `/` | ヒーロー・WHY VIDEO・制作の記録（タブ：特別 / 一般 / デモ / ゲーム）。`/#general` のようにタブを指定できます |
| 再生 | `/watch/<id>` | 動画のプレーヤー。`?t=秒` `&autoplay=1` `&captions=0`。登録にない id は一覧の「特別」へ戻ります |
| 動画の本体 | `/videos/<id>/index.html` | 1920×1080 の動画のページ（再生ページの中に表示）。`public/videos/<id>/index.html` をブラウザで直接開いても再生できます（録画用。サーバー不要） |
| 管理画面 | `/admin` | アクセス解析のダッシュボード（パスワードでログイン）。下の「管理画面とアクセス解析」 |
| ゲーム | `/games/<id>/index.html` | ゲームタブのゲーム（静的な HTML / JavaScript。一覧のライブプレビューの中でも遊べます。Next.js は `public/` のフォルダーの URL で index.html を返さないので、URL は index.html まで） |

以前の静的版の URL（`index.html`・`watch.html?v=<id>`）は、新しい URL へ転送されます（`next.config.ts`）。

## ファイル構成

```
movie/
├── app/                          ページ（Next.js App Router）
│   ├── (site)/                   一覧ページ（専用のレイアウト・CSS・フォント）
│   │   ├── layout.tsx            <html>・フォント（next/font：Inter / Noto Sans JP / Shippori Mincho B1）
│   │   ├── page.tsx              一覧ページ（レジストリを読んで各部品に渡す）
│   │   └── home.css              一覧ページの見た目（色は :root の変数でまとめて変更）
│   ├── (player)/                 再生ページ（黒背景の別レイアウト。一覧とはスタイルが混ざりません）
│   │   ├── layout.tsx · player.css
│   │   └── watch/[id]/page.tsx   /watch/<id>（全動画を静的に生成）
│   ├── (admin)/                  管理画面（別レイアウト。admin.css）
│   │   └── admin/                ダッシュボード・visitors（IP 別）・videos・history・settings・login・export（CSV）・actions.ts（フォームの処理）
│   ├── api/track/route.ts        アクセスの記録の受け口（POST）
│   └── icon.svg                  サイトのファビコン
├── components/
│   ├── home/                     Header · Hero · Showreel · ToolsStrip · Why · Flow · Library（タブ・絞り込み）· VideoStage（動画の一覧と詳細）· VideoCard · ThemeToggle（明るい / 暗い配色）· SiteCard · GameCard · SitePreview（ライブプレビュー）· Closing · Footer · Motion（スクロールの演出）· icons
│   ├── player/Player.tsx         プレーヤー（シーク・字幕・全画面・キー操作）
│   ├── admin/                    管理画面の部品（charts.tsx：グラフ一式・Dashboard・VideoViews・Feed・Shell・ui）
│   └── Tracker.tsx               アクセスの記録（一覧・再生ページのレイアウトに入っています）
├── content/                      ★ 掲載内容（レジストリ）。ここだけを編集します
│   ├── videos.ts                 制作動画（特別タブ）
│   ├── sites.ts                  制作実績（一般）・デモ・ゲーム
│   └── tabs.ts                   タブの名前・説明文・NEW バッジ・データがないときの文言
├── generated/                    ツールが書き出すデータ（手で編集しない）
│   ├── timeline.json             動画の長さ・チャプターの開始時刻（npm run timeline）
│   └── captures.json             サイトのプレビュー画像の撮影日・ファビコン（npm run capture）
├── lib/
│   ├── types.ts                  レジストリの型
│   ├── registry.ts               レジストリ＋生成データ（並び順・チャプター・アイコン）
│   ├── paths.ts                  id から決まるすべての URL
│   ├── image-size.ts             WebP の縦横サイズ（ビルド時に読む）
│   ├── platforms.ts              動画のプラットフォームの分類（一覧の絞り込みと管理画面で共通）
│   ├── track-inline.ts · track-client.ts   アクセスの記録（ブラウザー側）
│   └── server/                   サーバー側：db.ts（SQLite：Turso・ファイル・一時ファイル）・auth.ts（ログイン）・track.ts（記録）・stats.ts（集計）・client.ts（IP・ブラウザー・OS の判定）
├── data/analytics.sqlite         アクセス解析のデータベース（`npm start` のサーバーで使うとき。最初のアクセスで自動で作られます。Git には入れません）
├── public/                       そのまま配信するファイル
│   ├── videos/<id>/              動画のページ本体（index.html・js・css・assets）
│   ├── games/<id>/               ゲームのページ（index.html・js・css・icon.svg・images.json・img/）
│   ├── shared/                   動画のページの共通部品（時計・ポインター・IME・Windows 11・VS Code・アイコン・ファビコン・ロゴ）
│   │   ├── kit/                  Shopify と WordPress の動画の共通部品（エディタ・ターミナル・ブラウザ・管理画面・ストアの表示）
│   │   ├── wordpress/            WordPress の本物の画面（取り込んだもの）の表示（wp-frame.js・wp.css）
│   │   └── games/                ゲームの共通部品（kit.js：保存・効果音と BGM の合成・画面合わせ・ダイアログ／kit.css）
│   └── thumbs/                   動画のサムネイル（videos/<id>.webp）・サイトのプレビュー画像（sites/<id>-pc|full|sp.webp）
├── docs/videos/<id>.md           各動画の説明（内容・本物と再現の区別・録画の手順）
├── docs/games/                   ゲームの作り方（README.md）・各ゲームの説明（<id>.md）・画像の生成プロンプト（prompts/<id>.md）
├── docs/site/images.md           一覧ページのデザインで使う画像の生成プロンプト（public/site/images.json から自動で書き出し）
├── tools/                        撮影・測定・確認のツール（下表）
│   ├── wp/playground.js          WordPress の本物の管理画面の取り込み（WordPress Playground）
│   └── snapshots/<id>/           その動画専用の取り込みスクリプト（と確認用の test/）
└── next.config.ts · tsconfig.json · eslint.config.mjs · package.json
```

**id が唯一の名前です。** 動画の id（例：`nissin-store`）が、`public/videos/<id>/`・`public/thumbs/videos/<id>.webp`・`/watch/<id>`・
`generated/timeline.json` のキー・`docs/videos/<id>.md`・`tools/snapshots/<id>/` をすべて決めます（レジストリにパスは書きません）。
サイトの id も同じく `public/thumbs/sites/<id>-*` を決めます（一般・デモ・ゲームで重ならない名前に。重なるとツールがエラーで知らせます）。

## 掲載内容を変えるとき（レジストリ）

| やりたいこと | 手順 |
| --- | --- |
| 動画を追加 | ① `public/videos/<id>/` に動画のページを作る ② `content/videos.ts` にエントリーを追加 ③ `npm run timeline -- <id>`（長さ・チャプター時刻・サムネイル）④ `npm run verify -- <id>`・`npm run check -- <id>`・`npm run pointer -- <id>` |
| 台本を変更 | `npm run timeline -- <id>`（サムネイルの場面は `thumbAt`） |
| サイト（一般・デモ）を追加 | `content/sites.ts` の `links` / `demos` にエントリーを追加 → `npm run capture -- <id>`（プレビュー画像・ファビコン） |
| ゲームを追加 | ① `public/games/<id>/` にゲームを作る（`docs/games/README.md`）② `npm run game-images -- <id>`・`npm run game-check -- <id>` ③ `content/sites.ts` の `games` に `url: '/games/<id>/index.html'` で追加 → `npm run capture -- <id>` |
| ゲームの画像を差し替え | `docs/games/prompts/<id>.md` のプロンプトで生成 → `public/games/<id>/img/<name>.png` に保存 → `npm run game-images -- <id>` → `npm run capture -- <id>` |
| タブの文言 | `content/tabs.ts` |

一覧の並び順は画面上の日付（`recorded`）の新しい順で、自動で決まります。型は `lib/types.ts`。ツールも同じ `content/*.ts` を読みます（Node.js 22.18 以上は TypeScript をそのまま読み込めます）。

## 一覧ページのデザイン（2026-11-19 リデザイン・同日 明るい配色を追加）

- 配色は 2 つ。**暗い配色**は夜の制作スタジオ（深い紺に、画面の光のようなブルー・シアン・バイオレット、録画中の赤を差し色。ヒーローに月と瞬く星・ときどき流れ星）、**明るい配色**は朝のスタジオ（白と空色。ヒーローに浮かぶ太陽と雲）。色はすべて `app/(site)/home.css` 冒頭の変数（`[data-theme="light"]` で上書き）です。
- ヘッダーのスイッチ（`components/home/ThemeToggle.tsx`）で切り替えます。選んだ配色はブラウザに保存し（localStorage の `pp-theme`）、まだ選んでいない人には端末の設定（ライト / ダーク）に合わせます。最初の描画の前に `app/(site)/layout.tsx` のスクリプトが配色を決めるので、ちらつきません。
- 切り替えると、新しい配色がスイッチの位置から円形に広がり（View Transitions。対応していないブラウザでは色がゆっくり変わります）、同時にヒーローの太陽が沈んで月が昇る（または逆）・星が 1 つずつ現れる、スイッチのつまみも太陽 ⇄ 月に変わります。
- 構成：ヘッダー（スクロールで半透明に・読んだ位置のバー・スマホはメニュー）→ ヒーロー（見出しが 1 行ずつ現れる・オーロラの光・マウスに合わせて傾くショーリール）→ ツールの帯（2 段で逆向きに流れる）→ 動画で見せる理由 → 収録している工程（4 段階）→ 制作の記録（タブ。特別は Shopify / WordPress / EC-CUBE / makeshop / STUDIO / Wix / その他で絞り込み（動画のない区分は出しません）・すべて同じ大きさのカード（サムネイル・タイトル・ツール。日付は出しません）。ゲームはカードの一覧）→ 締めの帯 → フッター。
- 特別の動画（`components/home/VideoStage.tsx`）：カードにマウスを少し止めると、一覧が左に寄って（カードが縮みながら移動）右側に詳細が開き、概要の全文・タグ・チャプター（選ぶとその場面から再生）をすべて表示します。別のカードで止めると入れ替わり、一覧の外に出ると閉じます。一覧が縮むと下の段のカードほど上へずれるため、マウスを止めたカードは、マウスの下の位置がずれないようにページのスクロールで留めます（以前は下の段でカードがマウスの下から逃げ、詳細の開閉がくり返されていました。2026-11-20 修正）。ページの方が動いてマウスの下のカードが変わっても、マウスを動かすまでは切り替えません。マウスを止めたときだけ切り替えるので、詳細へ移動する途中でほかのカードを横切っても変わりません。クリックで再生。スマホ・タブレット（タッチ）と幅 900px 以下では、タップで詳細が下からシートで開きます。キーボードではカードにフォーカスすると表示、Esc で閉じます。
- 演出は `components/home/Motion.tsx` にまとめています（`[data-reveal]` の要素をスクロールで表示・数字のカウントアップ・ヘッダーの状態・カードのスポットライト・表示中の節のリンク）。端末で「視差効果を減らす」を選んでいる場合（Windows の「アニメーションを表示する」がオフのときも同じ扱いです）と、JavaScript が動かない場合は、演出なしで最初からすべて表示します。このとき配色の切り替えは、動きのない色のクロスフェードになります。
- GPU のない環境（仮想マシンなど、Chrome がソフトウェアで描画する場合）では、ヒーローの演出はコマ落ちします。重い効果（ぼかしフィルター・ページ幅のアニメーション）は避け、動きはできるだけ transform で付けています。
- デザインで使う画像（ヒーローの背景・理由の節の絵・工程 4 枚・締めの帯の背景、計 7 枚）は、いまは **画像サンプル** です。`public/site/images.json` に一覧とプロンプトがあり、`npm run game-images -- site` で画像サンプルの作成と [docs/site/images.md](docs/site/images.md)（ツール別のプロンプト）の書き出しをします。生成した画像を `public/site/img/<名前>.png` に保存して同じコマンドを実行すると差し替わります。


- `public/` の画像（動画の中に映るサイトの画像・サムネイル・Windows のアイコン・マウスポインター）は **すべて WebP** です。
  Next.js への移行時に変換した 10 本分は、変換前 144.0 MB → 変換後 93.5 MB（2,894 枚、35% 減）。WordPress の 12 本は取り込みの最後に WebP に変換しています。写真は非可逆（品質 80）、ロゴ・UI の画像は劣化のない可逆圧縮、アニメーション GIF はアニメーションのまま変換しています。
- `npm run webp`（`tools/webp.js`）が変換と同時に、HTML・JS（取り込んだサイトのスナップショットを含む）・CSS の中の参照を書き換えます。
  動画の中で入力しているソースコードの文字（例：Né の Astro のコードの `/photos/….jpg`）は、実際のサイトのファイル名のままにしてあります。
- `npm run snapshot -- <id>` でサイトを取り込み直すと、最後に自動で WebP に変換されます。サムネイル・サイトのプレビュー画像も最初から WebP で撮影します。
- 一覧ページの画像は `next/image` で表示し、カードの大きさに合わせて縮小した WebP が配信されます。
- ファビコン（`public/shared/favicons/`・`public/thumbs/sites/*-icon.*`）だけは、ブラウザのタブと同じ見た目にするため元の形式（ICO・PNG・SVG）のままです。

## 本物の画面と再現の区別

動画の中の画面は、公開されているもの・オープンソースのものは **本物を取り込んで表示** し、ログインが必要で取り込めないものだけを **見た目を似せた再現** にしています（各動画の詳細は `docs/videos/<id>.md`）。

| 画面 | 動画 | 本物 / 再現 | 内容 |
| --- | --- | --- | --- |
| 各サイト・ストアの画面（PC / スマホ） | 全 28 本 | **本物** | 公開中のサイトを、サイト自身のスクリプトが動いた後の状態で取り込んだもの（HTML・CSS・画像。`npm run snapshot -- <id>`） |
| Shopify テーマストア | GREEN BASE | **本物** | themes.shopify.com（日本語）の一覧・検索候補・Flow のページ（2026-11-17 取得） |
| GitHub Actions | Soup Stock Tokyo | **本物** | 公開リポジトリの実行ページを取り込み、名前を動画のものに置換。ログイン後のヘッダーも GitHub 自身のコードで描画。ログの文面・ボタンは再現（ログはログインが必要） |
| Schema Markup Validator・view-source | Né | **本物** | validator.schema.org に動画のソースを実際に検証させた画面、Chrome 自身の view-source の表示 |
| Sveltia CMS | Né | **本物** | オープンソースの Sveltia CMS（v0.268.0）を、サイト自身の設定でローカルに動かして取り込んだ画面 |
| Chrome の PDF ビューア・見積書 PDF | KANADEMONO | **本物** | 見積書を実際に PDF にし、Chrome の PDF ビューアで開いた画面 |
| 顧客アカウントのログイン画面 | KANADEMONO | **本物** | ストアの実際のログイン画面（確認コードの画面・注文一覧はログインが必要なため再現） |
| Lighthouse のレポート | SANYO | **本物** | Lighthouse 13.6 のレポート描画そのもので、ストアの実際の測定結果を表示（スコアの数値は工程の説明に合わせて設定、DevTools の枠は再現） |
| makeshop のログイン画面 | 旅わが・日清・Hanahiro・Lafayette | **本物** | console.makeshop.jp のログイン画面（GMO のヘッダー・ロゴ・フォームとも本物） |
| WordPress の管理画面（ACF を含む） | NOT A HOTEL | **本物** | WordPress Playground（ブラウザで動く本物の WordPress 7.1・日本語）に、動画のテーマ・ACF・ハウスのデータを入れて取り込んだ 13 画面。アドレスは開発環境の localhost:8888 に置き換え |
| WordPress の管理画面・プラグインの画面・フロントの出力 | WordPress の 12 本 | **本物** | 同じく WordPress Playground（WordPress 7.1.4・日本語）に、各サイトの公開データ（ページ・投稿・商品・イベントなど）と wordpress.org の本物のプラグイン（Contact Form 7・WooCommerce・ACF・SEO SIMPLE PACK・All in One SEO・Booking Package・B2BKing・Members・Duplicate Post・WP Super Cache・All-in-One WP Migration ほか）を入れ、動画の操作を実際に行って取り込んだ画面。独自プラグインの動画では、エディタで入力するのと同じソースを実際に動かした画面（`tools/wp/playground.js`） |
| 有料のテーマ・プラグイン、外部サービス | WordPress の 12 本 | 再現 | 有料のもの（TCD のテーマ・Arkhe Blocks Pro・WooCommerce Subscriptions・Booking Package の有料版の決済など）はインストールできないため、近い無料の構成か、見た目の再現（各動画の docs に明記）。サーバー・DNS・外部 API・受信トレイも再現 |
| VS Code | Shopify・WordPress の動画ほか | 本物の部品で再現 | 今の既定の見た目：Dark Modern テーマの色、VS Code 自身のアイコン（codicon）、Seti のファイルアイコン、ミニマップ（`public/shared/vscode.*`。VS Code はオープンソース） |
| makeshop の管理画面（ログイン後） | 旅わが・日清・Hanahiro・Lafayette | 再現 | ログインが必要なため。ロゴ・アイコン・色・ページの名前と URL は管理画面自身の公開ファイルから |
| Shopify の管理画面・テーマエディタ | Shopify の 6 本 | 再現 | ログインが必要なため。左上のロゴ・タブのファビコンは本物 |
| STUDIO のエディタ | 吉武工務店・ワイエス建装・長谷川興業 | 再現 | ログインが必要なため。左上のロゴ（/S）・タブのファビコンは本物。キャンバスの中は各サイトを取り込んだ本物の HTML・CSS で、右パネルの値も本物の CSS から |
| Wix のエディタ | ライト光機・Nagomi | 再現 | ログインが必要なため。ロゴ・タブのファビコン・ブランドの青（#116dff）は本物（`public/shared/wix/`）。キャンバスの中は各サイトを取り込んだ本物のページ |
| Figma | Né・NOT A HOTEL | 再現 | デスクトップアプリでログインが必要なため。タスクバーのアイコンは本物 |
| Google Analytics・Tag Manager・Tag Assistant・Gmail | Né・KANADEMONO・WordPress（お問い合わせ・予約） | 再現 | ログインが必要なため。タブのファビコンは本物 |
| Windows 11・Chrome の枠（タブ・アドレスバー） | 全 28 本 | 再現 | アプリの画面のため取り込めません。アイコン・マウスポインター・ファビコンは本物（下表） |

ログインが必要な画面（Shopify・makeshop の管理画面、STUDIO・Wix のエディタ、Figma、Google のツール）も、各サービスにご自身のアカウントでログインした状態であれば、同じ方法で本物を取り込めます。

## 再生ページの操作

- 再生 / 一時停止ボタン、10 秒戻る / 進む、シークバー（チャプターの区切り付き。ポイントすると時刻とチャプター名）、字幕（CC）、全画面
- マウスを動かすと操作バーとポインターが表示され、約 2.6 秒止めると両方とも自動で隠れます（操作バーの上にポインターがあるときは隠れません）
- 操作バーが出ている間は、動画内の字幕が操作バーに重ならない位置まで上がります
- キー操作：`Space` / `K` 再生・一時停止、`←` `→` 5 秒、`J` `L` 10 秒、`0`〜`9` 0〜90% の位置、`C` 字幕、`F` 全画面、`Home` 先頭
- 画面をクリックで再生 / 一時停止、ダブルクリックで全画面。最後まで再生すると、もう一度再生と次の動画が出ます

動画は 1920×1080 の画面として描画され、ウィンドウに合わせて拡大・縮小されます（全画面の 1920×1080 で等倍）。

### シークの仕組み

各動画は、台本どおりに画面を動かす HTML です。`public/shared/stage.js` の時計は、台本のすべての待ち時間を時刻順に 1 つずつ処理し、乱数も固定の種から作るため、
何度再生しても「1:23 の画面」は同じになります。先へ移動するときはその時刻まで画面の裏で高速に進め、前へ戻るときは動画のページを読み込み直して高速に進めます。
再生ページ（`components/player/Player.tsx`）と動画のページは `postMessage` でやり取りします。

## 動画の一覧

| 動画（id） | 再生ページ | 長さ | 画面上の日付 |
| --- | --- | --- | --- |
| NOT A HOTEL ブランドデザインから WordPress 公開まで（`notahotel`） | `/watch/notahotel` | 5:26 | 2026/11/01 10:18〜 |
| 株式会社吉武工務店 コーポレートサイト制作（`yoshitake-koumuten`） | `/watch/yoshitake-koumuten` | 5:31 | 2026/11/01 10:42〜 |
| Né（ネ）オーベルジュ Web サイト制作（`ne-auberge`） | `/watch/ne-auberge` | 5:50 | 2026/11/01 15:36〜 |
| 日清食品グループ オンラインストア makeshop から Shopify への移行（`nissin-store`） | `/watch/nissin-store` | 7:40 | 2026/11/02 10:12〜 |
| Stand by Beauty Clinic 12-1月限定キャンペーンのランディングページ制作（`wp-stand-by-lp`） | `/watch/wp-stand-by-lp` | 6:17 | 2026/11/02 13:30〜（途中でカット） |
| あみだ池大黒オンラインショップ EC-CUBE 4 専用プラグイン開発（ギフトのし：外のし・内のし／表書き／名入れ）（`ec-daikoku-plugin`） | `/watch/ec-daikoku-plugin` | 10:08 | 2026/11/03 10:12〜 |
| 旅するように和菓子と出逢う makeshop クリエイターモード移行（`tabisuruwagashi`） | `/watch/tabisuruwagashi` | 5:22 | 2026/11/03 13:18〜 |
| 仁秀 NINSHU WooCommerce による EC サイト構築（`wp-ninshu-woocommerce`） | `/watch/wp-ninshu-woocommerce` | 9:06 | 2026/11/04 10:05〜 |
| GREEN BASE テーマ選定とメタフィールドによる商品ページのカスタマイズ（`green-base`） | `/watch/green-base` | 6:14 | 2026/11/04 13:40〜 |
| SANYO ONLINE STORE 既存ストアの機能改善（ブランド横断の絞り込み・店舗在庫 / OMO・表示速度）（`sanyo-online-store`） | `/watch/sanyo-online-store` | 7:28 | 2026/11/05 09:55〜 |
| 京橋ウェルネスクリニック・かとう歯科 お問い合わせフォームの構築（`wp-clinic-contact-form`） | `/watch/wp-clinic-contact-form` | 6:12 | 2026/11/05 14:10〜（途中でカット） |
| 小山弓具 公式オンラインショップ EC-CUBE 4 既存 EC サイトの機能改修（受注生産・在庫の表示と送料無料の条件）（`ec-koyama-kyugu`） | `/watch/ec-koyama-kyugu` | 7:50 | 2026/11/06 10:14〜 |
| クックパッド株式会社 WordPress おしらせ（ブログ・オウンドメディア）の構築（`wp-cookpad-media`） | `/watch/wp-cookpad-media` | 7:16 | 2026/11/06 13:12〜（途中でカット） |
| kachaka Online Store EC-CUBE 4 デザインリニューアル（Twig テンプレート）（`ec-kachaka-store`） | `/watch/ec-kachaka-store` | 7:46 | 2026/11/07 10:06〜 |
| クルーズ株式会社 WordPress コーポレートサイトの新規制作（`wp-crooz`） | `/watch/wp-crooz` | 6:22 | 2026/11/07 10:39〜 |
| Hanahiro ONLINE SHOP makeshop EC サイトの新規構築（`makeshop-hanahiro`） | `/watch/makeshop-hanahiro` | 5:09 | 2026/11/07 13:10〜（途中でカット） |
| Soup Stock Tokyo 公式オンラインショップ 倉庫・店舗の在庫連携（`soup-stock-tokyo`） | `/watch/soup-stock-tokyo` | 5:42 | 2026/11/07 15:41〜（途中で 16:01 へカット） |
| KANADEMONO for BUSINESS 法人向け見積もり・お問い合わせ機能の開発（`kanademono-business`） | `/watch/kanademono-business` | 8:57 | 2026/11/08 10:30〜 |
| 整体りびるど 既存 WordPress サイトのリニューアル（`wp-ribuild-renewal`） | `/watch/wp-ribuild-renewal` | 7:43 | 2026/11/08 13:32〜 |
| ライフミール EC-CUBE 4 決済システムの構築（トークン方式のカード決済・後払いの条件・支払方法ごとのルール）（`ec-l-meal-payment`） | `/watch/ec-l-meal-payment` | 10:02 | 2026/11/09 10:12〜 |
| カイロライン三鷹整体院 WordPress サイトの SEO 対策・検索順位改善（`wp-chiroline-seo`） | `/watch/wp-chiroline-seo` | 5:07 | 2026/11/09 13:20〜 |
| Lafayette 公式通販サイト makeshop アパレル EC サイトの構築・カスタマイズ（`makeshop-lafayette`） | `/watch/makeshop-lafayette` | 4:59 | 2026/11/09 15:40〜（途中でカット） |
| 呉竹 BtoBオンライン注文サイト EC-CUBE 4 BtoB 機能の構築（承認制の会員登録・掛率の卸価格・発注単位・掛け払い）（`ec-kuretake-btob`） | `/watch/ec-kuretake-btob` | 10:20 | 2026/11/10 10:04〜 |
| Garage（ガラージ）EC-CUBE 2 帳票・PDF・CSV のカスタマイズ（納品書・出荷 CSV・商品一括登録）（`ec-garage-forms`） | `/watch/ec-garage-forms` | 8:25 | 2026/11/10 10:20〜 |
| 株式会社ライト光機製作所 Wix 企業ホームページの新規制作（`wix-light-op`） | `/watch/wix-light-op` | 5:13 | 2026/11/10 14:05〜 |
| GMOアリーナさいたま WordPress マルチサイトのサーバー移転・新ドメイン移行準備（`wp-saitama-arena-migration`） | `/watch/wp-saitama-arena-migration` | 7:08 | 2026/11/10 22:04〜（途中でカット） |
| CAGIANA《カジーナ》 EC-CUBE 3 から EC-CUBE 4.3 へのデータ移行（商品・会員・受注・画像・テーマ・旧 URL・本番切り替え）（`ec-cagiana-migration`） | `/watch/ec-cagiana-migration` | 8:46 | 2026/11/11 10:05〜（途中で 21:02 へカット） |
| 福岡正信自然農園 WordPress 会員制サイト・ログイン機能（`wp-f-masanobu-members`） | `/watch/wp-f-masanobu-members` | 5:47 | 2026/11/11 13:20〜 |
| アジアンリトリート WordPress 予約システムの導入（`wp-asianretreat-booking`） | `/watch/wp-asianretreat-booking` | 5:31 | 2026/11/12 10:12〜（途中でカット） |
| Kanro POCKeT Shopify と業務システムの連携（`kanro-pocket`） | `/watch/kanro-pocket` | 6:47 | 2026/11/12 11:20〜 |
| Nagomi Nature Connections Wix サービス紹介サイト・予約導線の制作（`wix-nagomi`） | `/watch/wix-nagomi` | 5:01 | 2026/11/12 14:20〜 |
| GMOアリーナさいたま WordPress 独自プラグイン開発（催事管理システムとのイベント連携）（`wp-saitama-arena-plugin`） | `/watch/wp-saitama-arena-plugin` | 8:09 | 2026/11/13 10:31〜（途中でカット） |
| はらいろ整骨院・へいわじま整骨院 WordPress 既存ページの修正（`wp-seikotsuin-fixes`） | `/watch/wp-seikotsuin-fixes` | 5:31 | 2026/11/13 14:06〜（途中でカット） |
| ＠ベリーネット（タックルベリー）EC-CUBE 4 店舗システムとの連携（Web API・GraphQL・WebHook）（`ec-tackleberry-api`） | `/watch/ec-tackleberry-api` | 9:47 | 2026/11/14 10:06〜（途中でカット） |
| ワイエス建装 STUDIO コーポレートサイト制作（`studio-ysk`） | `/watch/studio-ysk` | 5:25 | 2026/11/14 14:00〜 |
| 販促品直ナビ EC-CUBE 4 サーバー・セキュリティ・保守（健康診断・管理画面の防御・バックアップ・セキュリティパッチ）（`ec-chokunavi-maintenance`） | `/watch/ec-chokunavi-maintenance` | 9:36 | 2026/11/15 10:02〜 |
| 有限会社長谷川興業 STUDIO 企業サイトの制作・リニューアル（`studio-ponpuya`） | `/watch/studio-ponpuya` | 5:03 | 2026/11/15 13:30〜 |

合計 37 本・約 259 分（一覧ページの「総収録時間」）。長さとチャプター時刻は `generated/timeline.json`（`npm run timeline`）。

### Shopify の動画（6 本）

| 動画 | 事例のテーマ | 主な工程 |
| --- | --- | --- |
| 日清食品グループ オンラインストア | makeshop → Shopify への移行 | makeshop の管理画面へのログイン・CSV の書き出し・変換（Shift_JIS）・商品 / 顧客のインポート・URL リダイレクト・Prestige の商品カード・ドメイン切り替え |
| GREEN BASE | テーマの選定と再設計 | テーマストア（本物）でガーデンの絞り込みと検索から Flow を選定・メタオブジェクトと商品メタフィールド・Liquid のセクション・テーマエディタの動的ソース |
| SANYO ONLINE STORE | 既存ストアの機能改善 | ストア分析・ブランドのメタフィールドと Search & Discovery の絞り込み・店舗在庫の表示（OMO）・Lighthouse（本物のレポート）で表示速度改善 |
| Soup Stock Tokyo 公式オンラインショップ | 商品・在庫の同期 | ロケーション設定・WMS の在庫を Admin GraphQL API で同期・THROTTLED の再試行・GitHub Actions（本物の画面）の定期実行と Webhook |
| KANADEMONO for BUSINESS | 見積もり・お問い合わせ機能 | 法人会員登録フォーム（App Proxy）・会社と法人カタログ・カンタン見積もり（下書き注文・見積書 PDF を Chrome の PDF ビューアで確認）・請求書・通知メール |
| Kanro POCKeT | 外部業務システムとの連携 | 受注 Webhook の署名検証・基幹への受注 CSV・在庫取り込み・出荷実績から発送済み・会員ランク / ポイントの同期・監視と再送対策 |

各社の作業工程・ログイン後の管理画面の操作・外部システム・件数や在庫数などは **工程を説明するための再現** で、実際の作業の記録ではありません。
いずれも実在の企業・サイトのため、ローカルのファイルとしてだけ使ってください（どこまでが本物かは各動画の `docs/videos/<id>.md` の「最初に確認していただきたいこと」）。

### WordPress の動画（12 本）

「WordPress制作・開発業務一覧」の業務ごとに 1 本です（一覧に 5 番はないため 12 本）。参考サイトが 2 つある業務は、主に 1 つのサイトで作業し、もう 1 つは動画の中の 2 件目の依頼か `docs/videos/<id>.md` で触れています。

| 業務（一覧の番号） | 動画（id） | 主な工程 | 主なプラグイン・ツール |
| --- | --- | --- | --- |
| 1 企業ホームページの新規制作 | クルーズ株式会社（`wp-crooz`） | wp-env・オリジナルテーマ・グローバルナビ・会社概要 / 事業紹介のテンプレート・お問い合わせ・スマホ対応 | Contact Form 7 |
| 2 既存サイトのリニューアル | 整体りびるど（`wp-ribuild-renewal`） | 現状確認・親子ページで導線整理・新テーマ・旧 URL の 301・スマホの電話予約ボタン・バックアップしてテーマ移行 | All-in-One WP Migration・Elementor |
| 3 既存ページの修正 | はらいろ整骨院・へいわじま整骨院（`wp-seikotsuin-fixes`） | 6 件の修正依頼（メニュー追加・予約リンク・フッター・説明文・診療時間・スマホ表示） | All in One SEO |
| 4 LP 制作 | Stand by Beauty Clinic（`wp-stand-by-lp`） | 構成と導線・料金表の作成・前回の LP を複製して差し替え・トップのバナー・スマホの固定予約ボタン | Duplicate Post・WP Super Cache |
| 6 WooCommerce の EC サイト | 仁秀 NINSHU（`wp-ninshu-woocommerce`） | 店舗設定・送料（5 区分・送料無料）・Stripe / 銀行振込・会員登録・CSV で 158 商品・注文ステータス | WooCommerce・WooCommerce Stripe |
| 7 お問い合わせフォーム | 京橋ウェルネスクリニック・かとう歯科（`wp-clinic-contact-form`） | フォーム作成・テーマに設置・通知 / 自動返信メール・reCAPTCHA v3・入力チェック・画像の添付 | Contact Form 7 |
| 8 ブログ・オウンドメディア | クックパッド株式会社（`wp-cookpad-media`） | 投稿タイプ「おしらせ」・カテゴリー・882 件の移行・予約投稿・記事テンプレート・一覧ページ | Advanced Custom Fields・WP-CLI |
| 9 SEO 対策 | カイロライン三鷹整体院（`wp-chiroline-seo`） | ソースで現状確認・title / description / OGP・noindex の修正・構造化データ（JSON-LD）・カテゴリーのスラッグと説明文 | SEO SIMPLE PACK（Arkhe 子テーマ） |
| 10 サーバー移転・ドメイン移行 | GMOアリーナさいたま（`wp-saitama-arena-migration`） | マルチサイトの移転（WP-CLI・rsync）・DB 移行・ロードバランサーと SSL・hosts で事前確認・DNS 切り替え・新ドメインの準備 | WP-CLI・All-in-One WP Migration（無料版はマルチサイト非対応） |
| 11 会員制サイト | 福岡正信自然農園（`wp-f-masanobu-members`） | 会員登録の項目追加・管理画面の会員情報・マイページ・卸会員グループと卸価格・権限グループと会員限定ページ | WooCommerce・B2BKing・Members |
| 12 予約システム | アジアンリトリート（`wp-asianretreat-booking`） | メニューと料金・予約枠・入力項目・通知メール・オンライン決済・予約ページ・テスト予約・予約の管理 | Booking Package |
| 13 独自プラグイン・PHP 開発 | GMOアリーナさいたま（`wp-saitama-arena-plugin`） | 外部 API クライアント・設定画面と同期ログ・本日開催のイベント（テンプレートタグ・REST API）・WP-Cron と WP-CLI・PHPCS・本番へ反映 | 独自プラグイン「Arena Events Sync」 |

- 参考サイトの入れ替え：2 番は maruyama-sekkei.com ではなく ribuild.jp を、9 番は arakidashika.com（この PC から応答がなかったため）ではなく chiroline-mitakain.com を主なサイトにしました。外した 2 サイトは各動画の docs で触れています。
- どの動画も、各社のサイトの公開ページと公開データだけを使っています（ログイン・会員登録・フォーム送信・予約はしていません）。管理画面は使い捨ての WordPress Playground のものです。
- 作業の順序・ミスとその修正・サーバーやメール・外部 API・テーマのソースコード（公開されていないため、公開中の HTML と同じ出力になるように書いたもの）は **工程を説明するための再現** です。

### EC-CUBE の動画（9 本）

「EC-CUBE」の業務一覧の 9 件に 1 本ずつです。管理画面・ショップの画面はすべて、この PC の上で動かした **本物の EC-CUBE**（EC-CUBE 4.3.1-p1、ガラージは EC-CUBE 2.25 系、移行元は EC-CUBE 3.0.18-p7。PHP は WebAssembly 版・データベースは SQLite）で、動画で打ち込むコードを実際に動かして取り込んだものです（`tools/eccube/`、手順は「EC-CUBE の動画を増やすとき」）。

| 業務（一覧の番号） | 動画（id） | 主な工程 | EC-CUBE |
| --- | --- | --- | --- |
| ① 既存 EC サイトの機能改修 | 小山弓具（`ec-koyama-kyugu`） | 受注生産の項目（エンティティ拡張・FormType 拡張）・在庫 / 納期のバッジ（Twig 拡張）・送料無料の条件（PurchaseFlow）・カートの案内（TemplateEvent）・テスト注文 | 4.3 |
| ② デザインリニューアル（Twig） | kachaka Online Store（`ec-kachaka-store`） | テンプレートの登録・ヘッダー / フッター・ブロック管理とレイアウト管理・トップと商品ページの Twig・スマートフォン表示 | 4.3 |
| ③ 決済システム | ライフミール（`ec-l-meal-payment`） | 後払いの手数料と上限・カード決済プラグイン（PaymentMethodInterface・トークン）・テスト注文と入金済み・支払方法ごとの条件（PurchaseFlow） | 4.3 |
| ④ BtoB | 呉竹 BtoB オンライン注文サイト（`ec-kuretake-btob`） | 取引先情報・承認制の会員登録・掛率の卸価格・発注単位・掛け払い（取引先のみ）・受注管理 | 4.3 |
| ⑤ データ移行 | CAGIANA《カジーナ》（`ec-cagiana-migration`） | EC-CUBE 3 のバックアップ（公式プラグイン）・データ移行プラグインで 4.3 へ・件数と旧パスワードの確認・画像とテーマ・旧 URL の 301・切り替え当日の差分移行 | 3.0.18 → 4.3 |
| ⑥ 外部システム連携 | ＠ベリーネット（`ec-tackleberry-api`） | Web API（Api42・GraphQL）・OAuth の認可・店頭在庫の反映・注文の WebHook（署名）・出荷完了の書き戻し・トークン更新と定期実行 | 4.3 |
| ⑦ EC-CUBE 専用プラグイン開発 | あみだ池大黒オンラインショップ（`ec-daikoku-plugin`） | ギフトのし（外のし・内のし・表書き・名入れ）のプラグインを一から作成・管理画面の設定・注文画面と受注管理・パッケージ化 | 4.3 |
| ⑧ 帳票・PDF・CSV | Garage（`ec-garage-forms`） | 納品書 PDF のロゴと品番の列（SC_Fpdf_Ex）・帳票の初期値と一括出力・出荷指示 CSV（CSV 出力項目設定）・商品の CSV 一括登録 | 2.25 系 |
| ⑨ サーバー・セキュリティ・保守 | 販促品直ナビ（`ec-chokunavi-maintenance`） | 健康診断とセキュリティチェック・管理画面の URL 変更と IP 制限・2 段階認証とログイン試行の制限・バックアップと復元テスト・セキュリティパッチ 4.3.1-p1 | 4.3 |

- 各ショップのデータ（ショップ名・カテゴリー・商品名・価格・画像など）は、公開ページから取り込んだものです。会員・受注は架空で、個人情報にあたる部分はぼかしています。実在のショップの管理画面・オーナーズストア・決済サービスには一切ログインしていません。
- 作業の順序・ミスとその修正（EC-CUBE で実際に起きるものを演出として配置）・本番サーバー・デプロイ・決済サービス側・外部システムは **工程を説明するための再現** です。どこまでが本物かは各動画の `docs/videos/<id>.md` にあります。
- いずれも実在の企業・サイトのため、ローカルのファイルとしてだけ使ってください。

### Wix・STUDIO・makeshop の動画（6 本・2026-11-19 追加）

| 業務 | 動画（id） | 主な工程 | 確認していただきたい点 |
| --- | --- | --- | --- |
| Wix：企業ホームページの新規制作 | 株式会社ライト光機製作所（`wix-light-op`） | ページ構成とメニュー（製品紹介・企業情報・サービス・採用・お問い合わせ）・メインビジュアル・製品とサービス・会社概要・採用とお問い合わせフォーム・モバイル調整・SEO タイトルと公開 | 2026/11/13 付けのニュースは動画の日付より後のため一覧から外しています |
| Wix：サービス紹介サイト・予約導線 | Nagomi Nature Connections（`wix-nagomi`） | サイト構成・メインビジュアルと写真・カヤック / SUP の体験プログラム・特徴 / FAQ / ブログ・予約リクエストフォームへの導線（各ページから）・スマホ対応・公開 | 単独の LP ではなく、予約導線を備えたサービス紹介型のサイトとして紹介しています。予約はリクエスト送信後にスタッフが確定する形（サイトのとおり）。Instagram・Google マップなどの埋め込みは取り込めないため畳んでいます |
| STUDIO：コーポレートサイト制作 | ワイエス建装（`studio-ysk`） | ページ構成・ヘッダーとナビ・メインビジュアル・ご挨拶・事業内容と施工写真・お知らせ（CMS）・会社情報・お問い合わせへの導線・スマホ対応・公開 | **公開中のサイトの会社情報が仮の値のまま**です（代表者「山田太郎」・電話 00-0000-0000・住所「〇〇〇10-10-10」）。動画はサイトのとおりに表示しています |
| STUDIO：企業サイトの制作・リニューアル | 有限会社長谷川興業（`studio-ponpuya`） | 既存デザイン（フォント・色）とページ構成の確認・事業案内・保有車両・採用 / メンバー / お知らせ（CMS）・レスポンシブ・リンクとお問い合わせの動作確認・公開 | Figma から実装したことは公開サイトで確認できないため、Figma の工程は入れていません。「リニューアル前」の画面は公開中のトップから 4 つのセクションを除いたもので、実際の旧サイトではありません。メンバー紹介の写真・氏名は会社が公開しているとおりです |
| MakeShop：EC サイト新規構築 | Hanahiro ONLINE SHOP（`makeshop-hanahiro`） | カテゴリ設定・商品の CSV 一括登録・トップページ（クリエイターモード）・会員登録とログイン・決済と配送（地域別送料・お届け日）・テスト注文・公開 | ショップに 2026/11/13 付けの「お客様情報の漏えい」に関するお知らせがあり、動画の日付より後で内容も機微なため、取り込みから外しています |
| MakeShop：アパレル EC の構築・カスタマイズ | Lafayette 公式通販サイト（`makeshop-lafayette`） | ブランド / アイテムのカテゴリ構成・カラー × サイズのバリエーションと SKU ごとの在庫・新着順と検索・会員（ポイント・ランク・お気に入り・再入荷通知）・カートと送料・販売開始日時の予約 | API 連携・外部システムとの在庫同期は公開サイトで確認できないため入れていません。SKU コード・在庫数・ランク 2〜4 の名前と率は再現の値です |

- 各サイト・ショップの画面（PC / スマホ）は 2026/11/19 に公開ページから取り込んだ本物です。エディタ・管理画面（ログイン後）は、ログインが必要なため各サービスのロゴ・ファビコン・色を使った再現です。
- 実在のサイトでフォームの送信・予約・カート・ログイン・会員登録は一切していません（ボタンはマウスを乗せるだけ・テスト注文は再現の管理画面の中だけ）。
- 作業の順序・ミスとその修正は工程を説明するための演出です。どこまでが本物かは各動画の `docs/videos/<id>.md` にあります。
- いずれも実在の企業・サイトのため、ローカルのファイルとしてだけ使ってください。

### 掲載中のサイト（一般・デモ）

| タブ | サイト | URL |
| --- | --- | --- |
| 一般 | さくらレンタカー（レンタカー管理システム（社内向け業務システム）） | https://car-rent.sakuragroup.jp/ |
| 一般 | THE SANCTUARY（完全会員制のオンラインヒーリングサロン） | https://the-sanctuary.jp/ |
| 一般 | THE SANCTUARY 画面一覧（the-sanctuary.jp の全画面を収録した一覧） | https://the-sanctuary-screens.vercel.app/ |
| デモ | LUMINA（会員制オンラインヒーリングサロン） | https://online-healing-salon.vercel.app/ |
| デモ | FixView Browser（Android 自動化向けブラウザ（Web デモ）） | https://android-automation-browser.vercel.app/ |
| デモ | PitchLab（投手のためのオンライン指導アプリ） | https://pitch-lab-app.vercel.app/ |
| デモ | ポイガチャ（ポイ活 × オリパ風 Web ガチャ） | https://gacha-point-platform.vercel.app/ |
| デモ | 今日も元気だねット（LINE 安否確認サービス） | https://genki-connect.vercel.app/ |
| デモ | Floor Plan Similarity Study（間取り図の類似性評価アンケート） | https://floorplan-similarity-survey.vercel.app/ |


### 掲載中のゲーム（ゲーム・20 本）

日本で親しまれている遊びをもとにしたオリジナルのゲームです（作り方は [docs/games/README.md](docs/games/README.md)）。将棋・花札・麻雀・大富豪・百人一首・リバーシは伝統的なルールのまま、名前・キャラクター・絵・音楽・ステージはすべて新しく作りました。BGM・効果音は WebAudio で合成しています（音のファイルはありません）。

ゲームの中の画像（キービジュアル・背景・人物・札の絵柄など、計 238 枚）は、いまはすべて **画像サンプル** です。画像ごとに向いている AI ツール（Midjourney・niji・ChatGPT・Gemini・Stable Diffusion・FLUX・Firefly・Ideogram・Recraft・Leonardo）を選び、そのツール用のプロンプトと、どのツールでも使える英文のプロンプトを [docs/games/prompts/](docs/games/prompts/README.md) に用意しています。生成した画像を `public/games/<id>/img/<name>.png` に保存して `npm run game-images -- <id>` を実行すると差し替わり、`npm run capture -- <id>` でカードのプレビューも撮り直せます。駒・牌・トランプ・弾など、遊ぶのに欠かせない絵はコードで描いているので、画像サンプルのままでも遊べます。

| ゲーム | URL | 画像 | 資料 |
| --- | --- | --- | --- |
| 縁側将棋（本将棋 vs CPU（4 段階の強さ・駒落ち対応）） | `/games/shogi/index.html` | 7 枚 | [説明](docs/games/shogi.md)・[プロンプト](docs/games/prompts/shogi.md) |
| 喫茶しろくろ（リバーシ（CPU 4 段階・ふたりで対局）） | `/games/reversi/index.html` | 6 枚 | [説明](docs/games/reversi.md)・[プロンプト](docs/games/prompts/reversi.md) |
| 花暦こいこい（花札こいこい vs CPU） | `/games/hanafuda-koikoi/index.html` | 53 枚 | [説明](docs/games/hanafuda-koikoi.md)・[プロンプト](docs/games/prompts/hanafuda-koikoi.md) |
| 番狂わせ大富豪（大富豪（大貧民）vs 3 CPU） | `/games/daifugo/index.html` | 11 枚 | [説明](docs/games/daifugo.md)・[プロンプト](docs/games/prompts/daifugo.md) |
| みやび札（百人一首かるた ― CPU 対戦・ちらし取り・決まり字練習） | `/games/hyakunin-isshu/index.html` | 7 枚 | [説明](docs/games/hyakunin-isshu.md)・[プロンプト](docs/games/prompts/hyakunin-isshu.md) |
| ことば花火（打って打ち上げるローマ字タイピング） | `/games/hanabi-typing/index.html` | 5 枚 | [説明](docs/games/hanabi-typing.md)・[プロンプト](docs/games/prompts/hanabi-typing.md) |
| 筆まる漢字帖（熟語クロス・四字熟語・難読漢字の漢字パズル） | `/games/jukugo-puzzle/index.html` | 5 枚 | [説明](docs/games/jukugo-puzzle.md)・[プロンプト](docs/games/prompts/jukugo-puzzle.md) |
| ナンプレ帖（9×9 の数字パズル ― 4 段階の難易度と今日の一問） | `/games/nanpure/index.html` | 4 枚 | [説明](docs/games/nanpure.md)・[プロンプト](docs/games/prompts/nanpure.md) |
| ロジック絵巻（和のお絵かきロジック ― 5×5 から 20×20 まで 31 問） | `/games/oekaki-logic/index.html` | 4 枚 | [説明](docs/games/oekaki-logic.md)・[プロンプト](docs/games/prompts/oekaki-logic.md) |
| まちがい日和（和の風景の間違い探し ― 6 つの景色） | `/games/machigai-sagashi/index.html` | 4 枚 | [説明](docs/games/machigai-sagashi.md)・[プロンプト](docs/games/prompts/machigai-sagashi.md) |
| 花明かりの写真館（坂の町の写真館をめぐる、春のノベルゲーム） | `/games/sakura-novel/index.html` | 27 枚 | [説明](docs/games/sakura-novel.md)・[プロンプト](docs/games/prompts/sakura-novel.md) |
| こしば日和（柴犬の子犬を育てる、リアルタイム育成ゲーム） | `/games/shiba-ikusei/index.html` | 14 枚 | [説明](docs/games/shiba-ikusei.md)・[プロンプト](docs/games/prompts/shiba-ikusei.md) |
| 宵月麻雀（4人打ちリーチ麻雀 vs CPU） | `/games/mahjong/index.html` | 8 枚 | [説明](docs/games/mahjong.md)・[プロンプト](docs/games/prompts/mahjong.md) |
| 千代紙飛行（折り鶴の縦スクロールシューティング） | `/games/orizuru-shooting/index.html` | 7 枚 | [説明](docs/games/orizuru-shooting.md)・[プロンプト](docs/games/prompts/orizuru-shooting.md) |
| 宵宮ビート（祭り囃子の 4 レーン音楽ゲーム） | `/games/matsuri-rhythm/index.html` | 5 枚 | [説明](docs/games/matsuri-rhythm.md)・[プロンプト](docs/games/prompts/matsuri-rhythm.md) |
| 夜空のアーチ（夏のナイターのホームラン競争） | `/games/homerun-derby/index.html` | 8 枚 | [説明](docs/games/homerun-derby.md)・[プロンプト](docs/games/prompts/homerun-derby.md) |
| 和菓子ころりん（重箱の和菓子あわせパズル） | `/games/wagashi-merge/index.html` | 14 枚 | [説明](docs/games/wagashi-merge.md)・[プロンプト](docs/games/prompts/wagashi-merge.md) |
| 宵祭り金魚すくい（夏の夜店の金魚すくい） | `/games/kingyo-sukui/index.html` | 12 枚 | [説明](docs/games/kingyo-sukui.md)・[プロンプト](docs/games/prompts/kingyo-sukui.md) |
| クレーン横丁（2 ボタンのクレーンゲーム） | `/games/crane-game/index.html` | 12 枚 | [説明](docs/games/crane-game.md)・[プロンプト](docs/games/prompts/crane-game.md) |
| 宵灯りのほこら（妖の里をめぐる、30 分の和風 RPG） | `/games/hokora-rpg/index.html` | 25 枚 | [説明](docs/games/hokora-rpg.md)・[プロンプト](docs/games/prompts/hokora-rpg.md) |

## 画面の環境（全動画共通）

- **Windows 11**（ライトモード）。タスクバーは中央揃え、右側に IME（あ / A）・Wi-Fi・音量・時計（日付 2 段表示）・通知ベル。時計は動画の経過時間に合わせて進みます
- Chrome は現行の見た目。タブのファビコンは各サービスの本物（下表）
- マウスポインターは Windows 標準のポインター画像。Microsoft IME の変換候補ウィンドウと、クリップボード履歴（Win + V）は Windows 11 の見た目

### 本物のアイコン・ファビコン・ロゴ（`public/shared/`）

`npm run favicons`（`tools/favicons.js`）で各サービスの公開ページが指定しているファイルを取り直せます（2026-11-17 取得）。

| ファイル | 使う場所 | 出どころ |
| --- | --- | --- |
| `favicons/default.png` | ファビコンのないページ（開発サーバー・自作のモニター画面・PDF ビューア・view-source） | Chrome 本体のアイコン（Chromium のソース `ui/resources/…/default_favicon.png`、BSD ライセンス） |
| `favicons/shopify.png` | Shopify の管理画面・テーマエディタ・テーマストア | `cdn.shopify.com/static/shopify-favicon.png`（themes.shopify.com が指定） |
| `favicons/makeshop.ico` | makeshop の管理画面（console.makeshop.jp） | `console.makeshop.jp/favicon.ico` |
| `favicons/studio.svg` | STUDIO のエディタ | `app.studio.design/favicon.svg` |
| `favicons/github.svg` | GitHub | `github.githubassets.com/favicons/favicon.svg` |
| `favicons/gmail.ico` | Gmail | Gmail の受信トレイのファビコン |
| `favicons/ga.svg` `gtm.svg` `ta.svg` | Analytics / Tag Manager / Tag Assistant | 各サービスのファビコン（gstatic.com・tagassistant.google.com） |
| `favicons/schema.ico` | Schema Markup Validator | `schema.org/docs/favicon.ico` |
| `favicons/sveltia.svg` | Sveltia CMS（Né の /admin） | Sveltia CMS がロゴ未設定のときにファビコンにする自身のロゴ（公開バンドルから取得、MIT） |
| `favicons/wordpress.png` | サイトアイコンのない WordPress の管理画面・ログイン画面 | WordPress 本体の `wp-includes/images/w-logo-blue-white-bg.png`（GPL） |
| `favicons/notahotel.ico` `tabisuruwagashi.png` | 各サイト | 各サイトのファビコン。Shopify のストアのファビコンは各動画のスナップショットに含まれます |
| `logos/shopify.svg` | Shopify 管理画面の左上 | shopify.com のヘッダーのロゴ |
| `logos/makeshop.svg` | makeshop の管理画面 | console.makeshop.jp のログイン画面のロゴ |
| `logos/studio.svg` | STUDIO のエディタの左上 | app.studio.design のログイン画面のロゴ |
| `icons/chrome.webp` `vscode.webp` `edge.webp` | タスクバー | この PC にインストールされている Chrome / VS Code / Edge の実行ファイルから取り出したアイコン |
| `icons/start.webp` `explorer.webp` `store.webp` ほか | タスクバー | Windows 11 のシステムアイコン |
| `icons/fl-*.svg` | タスクバーの右側 | Microsoft の Fluent UI System Icons（MIT） |
| `icons/figma.svg` | タスクバー | Figma のロゴ |
| `cursors/*.webp` | マウスポインター | この PC の `C:\Windows\Cursors\aero_*.cur` |
| `fonts/codicon.ttf` `fonts/seti.woff` | VS Code のアイコン・ファイルアイコン | VS Code 自身のアイコンフォント（`@vscode/codicons`、CC BY 4.0）と Seti のアイコンフォント（VS Code のリポジトリ、MIT） |

### ぼかし（編集でかけたもの）

| 動画 | ぼかした箇所 |
| --- | --- |
| STUDIO | アドレスバーのプロジェクト ID |
| Né | Tag Manager のアカウント ID・コンテナ ID、Analytics のプロパティ ID（アドレスバー）、`git push` の出力のリポジトリ所有者名 |
| makeshop（旅わが・日清） | ショップ ID（＝管理画面のログイン ID） |
| NOT A HOTEL | `git push` の出力のリポジトリ所有者名（本番サーバーは SSH の接続名 `notahotel-prod` で表示し、アドレスは出していません） |
| Shopify の動画 | 顧客・会員・担当者の氏名・メールアドレス・住所など（日清・Soup Stock Tokyo・KANADEMONO・Kanro）、`.env` のシークレット（Soup Stock Tokyo・Kanro。SANYO は伏せ字）。いずれも再現用の値ですが、本物の個人情報・鍵に見えないようにしています |
| WordPress の動画 | テスト会員・テスト注文・テスト予約のお客様の氏名・メールアドレス・住所、口座番号、reCAPTCHA・Stripe のキー、サーバーの接続情報・DB のパスワード・AWS の ID など（いずれも再現用の値。管理画面の中は `wp-frame.js` が同じぼかしをかけます） |

ぼかしたい箇所を増やすときは、要素に `class="pii"` を付けます（`public/shared/win11.css`）。

### 日付について（確認していただきたい点）

動画はすべて 2026 年 11 月 1〜15 日の収録です（画面の時計の日付）。本番サイトは 2026/11/17〜18 に取り込んだため、画面上の日付より後の内容が含まれる場合があります（サイトは本番と同一の構成のまま変えていません）。

- Né：サイトに「GOOD DESIGN AWARD 2026」のロゴがあります（グッドデザイン賞の発表は例年 10 月で、画面の日付 11/1 と矛盾しません）
- 旅わが：プレビュー / 公開ショップのお知らせ・記事・レビューに 2026/06〜11 の日付があります
- STUDIO：お知らせの最新は 2026.2.21 で、11/1 の日付と矛盾しません
- NOT A HOTEL：お知らせの最新（NOTA への社名変更）が 2026/10/05 のため、画面の日付 2026/11/01 と矛盾しません
- Shopify の 6 本（画面の日付 2026/11/02〜11/12）：ストアの画面は 2026/11/17 に取り込んだため、冬のキャンペーン・期間限定商品・賞味期限の表示など、画面の日付より後の内容が含まれます
- WordPress の 12 本（画面の日付 2026/11/02〜11/13）：サイトと管理画面は 2026/11/17〜18 に取り込みました。管理画面の「今日」の日付・時刻は取り込み時に画面の日付と時計に置き換えています（`tools/wp/playground.js`）。画面の日付より後のお知らせ・イベントは、目立つものを各動画で外すか日付を合わせています（各動画の docs）

## ツール（`tools/`。Node.js 22.18 以上と Google Chrome が必要）

| コマンド | 内容 |
| --- | --- |
| `npm run timeline`（`-- <id>` で 1 本だけ） | 全編を高速再生して長さ・チャプター時刻を測り（`generated/timeline.json`）、サムネイル（`public/thumbs/videos/<id>.webp`、`thumbAt` 秒の場面）を撮影します |
| `npm run verify`（`-- <id>` で 1 本だけ） | 全編を高速再生して、スクリプトのエラー・読み込めないファイル（画像のパスの誤りなど）・入力した文字の食い違いを報告します。`--shots=12,95 --out=<フォルダ>` でその秒のスクリーンショットも撮ります |
| `npm run check`（`-- <id>`） | 入力中の文字が画面に見えていない瞬間（字幕・キー表示の下、枠の外）がないかを確認します |
| `npm run pointer`（`-- <id>`） | ポインターと問題箇所の枠を確認します：クリック・ポイントした位置が目標の要素の上か、画面の外・字幕の下でないか、表示されていない要素（閉じたメニュー・隠れたタブ・幅 0 の複製）へ向かっていないか、枠が出ているのに目標が画面にない瞬間がないか（`--scrolls` で、目標を見せるために自動でスクロールした箇所も一覧） |
| `npm run snapshot -- <id>` | 動画の中に映る本番サイトを取り込み直し、画像を WebP に変換します（Shopify のストアは `tools/snapshot-store.js`、ほかは `tools/snapshots/<id>/update-snapshot.js`） |
| `npm run capture`（`-- <id>`） | 一般・デモ・ゲームのサイトのプレビュー画像（PC・ページ全体・スマホ、WebP）とファビコンを撮影します（ゲームは `public/` をその場で配信して撮影） |
| `npm run game-images`（`-- <id>`） | ゲームの画像：`images.json` の画像サンプルを描き、`img/` に保存した生成画像（PNG / JPEG / WebP）を指定のサイズの WebP にして差し替え（透過が必要な画像は単色の背景を切り抜き）、プロンプトのシート（`docs/games/prompts/`）を書き出します。`--samples` でサンプルを描き直し |
| `npm run game-check`（`-- <id>`） | ゲームを PC（1440×900）とスマホ（390×844）の大きさで開き、エラー・読み込めないファイル・ページのスクロール・画像のサイズ・ゲームの自己テスト（`window.__gameSelfTest`）を確認します（`--out=<フォルダ>` でスクリーンショット） |
| `npm run webp`（`-- <id>`） | 画像を WebP に変換して参照を書き換えます（`--dry` で確認だけ） |
| `npm run favicons` | 各サービスの本物のファビコン・ロゴを取り直します |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript の確認 |

### ポインターと問題箇所の枠（`public/shared/engine.js`）

- 位置はすべて動画のページ自身の画面（1920 × 1080）の座標です（`Demo.screenRect`）。動画のページは再生ページの中では同じオリジンの iframe なので、iframe をさかのぼるのは動画のページまで（それより上へ行くと、再生ページの縮小・中央寄せの座標になり、ポインターと枠がずれます）
- `clickUi` / `hoverUi` / `moveToEl` は、目標が見えていなければ先にスクロールします（ページ・スクロールする枠・WordPress の管理バーの下・タスクバーの下。コードエディターの行は `Kit.Code` が自分でスクロール：`Demo.revealers`）
- 問題箇所の枠（`Issue.show` / `Issue.ok`）は、目標の見えている部分を囲みます。目標が画面にない間（別のタブ・スクロールで外れた）は描きません
- 台本を書くときの注意：
  - 同じ要素の非表示の複製がよくある（スマホ用の価格・注文ステータスなど）：見えている方を選ぶ
  - セレクターを並べた `querySelector('a, b')` はページ内の順で最初の要素を返す
  - WordPress の閉じたサブメニューは `top: -1000em`：ホバーのあと `opensub` を付ける
  - ブロックエディターでは管理メニューが隠れている：戻るボタンかアドレスバーで移動する
  - ダイアログは閉じてから、その後ろをクリックする

### Shopify の動画を増やすとき

1. 既存の Shopify の動画（例：`public/videos/nissin-store/`）を参考に `public/videos/<id>/` を作る（`index.html` は共通のまま、`js/config.js` に工程・ストア・取り込むページを書く）
2. `npm run snapshot -- <id>`（`config.js` の `snapshot` を読んでストアを取り込み、WebP に変換）
3. `js/scenario.js` に台本を書く（管理画面は `Kit.Admin` と `Kit.H`、コードは `Kit.Code` / `Kit.Term`、ストアは `Kit.Store`、日本語入力は `Kit.codeScript` / `Kit.typeInput`）
4. `content/videos.ts` にエントリーを足して `npm run timeline -- <id>`、`npm run verify -- <id>`、`npm run check -- <id>`、`npm run pointer -- <id>`

### WordPress の動画を増やすとき

1. 既存の WordPress の動画（例：`public/videos/wp-crooz/`）を参考に `public/videos/<id>/` を作る（WordPress の画面はブラウザのページ `wp` に表示）
2. `tools/snapshots/<id>/capture-wp.js` を書いて実行：`tools/wp/playground.js` で本物の WordPress（日本語）を起動し、サイトの公開データ・wordpress.org のプラグイン（`cap.translations()` で日本語化）を入れ、動画の操作を実際に行って画面を取り込む → `js/wp-snapshot.js` と `assets/wp/`。続けて `node tools/webp.js <id>`
3. 公開中のサイトは `npm run snapshot -- <id>`（`config.js` の `snapshot`）
4. `js/scenario.js` に台本を書く（WordPress の画面は `WP.show(key)`、入力は `Demo.typeInto(WP.typeInto(name), …)`、PHP は `Kit.Code` がハイライト。WordPress のコーディング規約どおりタブでインデント）
5. `content/videos.ts` にエントリーを足して `npm run timeline -- <id>`、`npm run verify -- <id>`、`npm run check -- <id>`、`npm run pointer -- <id>`

### EC-CUBE の動画を増やすとき

EC-CUBE の管理画面・ショップの画面は、この PC の上で動かした **本物の EC-CUBE** から取り込みます（`tools/eccube/`）。PHP は WebAssembly 版（@php-wasm/node）、データベースは SQLite なので、PHP やデータベースのサーバーはインストールしません。

- 準備（一度だけ。プロジェクトの外の `../eccube-local/`）：`runner/` で `npm install @php-wasm/node@3.1.65 @php-wasm/universal@3.1.65`。`inst/base/` に EC-CUBE 4.3.1-p1（公式の zip、SHA-256 を照合）をインストール済み（`node tools/eccube/runtime.js install4 <フォルダ>`）。`src2w/ec-cube2/` に EC-CUBE 2（GitHub の eccube2-weekly-20261110。SQLite に対応した最初の版）
- 動画ごとの EC-CUBE：`node tools/eccube/runtime.js instance <id> [4|2]` で `../eccube-local/inst/<id>/` にコピーを作り、`node tools/eccube/runtime.js serve <フォルダ> [ポート]` で起動（管理画面は `/admin`。ログインはそのコピー専用の admin / password で、実在のショップのアカウントには一切ログインしません）
- 取り込み：`tools/snapshots/<id>/capture-ec.js` から `tools/eccube/capture.js` を使い（使い方はファイルの先頭）、動画で行う操作を本物の EC-CUBE で実際に行って画面を取り込む → `js/ec-snapshot.js`（`window.EC_SNAPSHOT`）と `assets/ec/`。動画の中では WordPress の動画と同じ `public/shared/wordpress/wp-frame.js` が `window.EC` として表示します（`EC.show(key)` …）。続けて `node tools/webp.js <id>`
- EC-CUBE 3（データ移行の動画）：自分で用意したコピーを、`runtime.js` が PHP 7.4・`html/` を公開フォルダとして動かします（`capture.js` の `dir`・`merge`）
- コードエディター（`Kit.Code`）は Twig（拡張子 .twig）も色分けします
- そのほかは WordPress の動画と同じです（公開中のサイトは `npm run snapshot -- <id>`、確認は `verify` / `check` / `pointer` / `timeline`）

## 管理画面とアクセス解析（2026-11-20 追加）

ポートフォリオを見た人の記録を集計する管理画面です。`npm start`（または `npm run dev`）で動かしたサーバーで使えます。

| ページ | 中身 |
| --- | --- |
| `/admin` | ダッシュボード：訪問者・ページビュー・再生・総視聴時間・平均視聴率・直帰率・滞在時間（前の期間との比較と推移）、いまサイトにいる人、グラフ一式（下表）、最近の訪問者（IP 別）、アクセス履歴。30 秒ごとに自動で更新 |
| `/admin/visitors` | 訪問者の一覧（**IP アドレスごとに 1 人**）：ブラウザー・OS・デバイス・初回と最終のアクセス・訪問回数・ページビュー・見た動画・視聴時間。検索・並べ替え・CSV |
| `/admin/visitors/<id>` | 1 人の詳細：使ったブラウザーと OS の組み合わせ・User-Agent、**見た動画（最大到達位置・視聴時間・完走）**、アクセスした日・時間帯、訪問ごとに開いたページと操作（詳細を開いた・再生・25/50/75%・最後まで）。メモ・集計からの除外・記録の削除 |
| `/admin/videos`・`/admin/videos/<id>` | 動画ごと：詳細を開いた回数・再生・視聴者・平均視聴率・完了、視聴の維持率、チャプターごとの離脱、見た人 |
| `/admin/history` | アクセス履歴（ページを開くたびに 1 件・新しい順）。IP・ページの種類・動画で絞り込み、CSV |
| `/admin/settings` | **パスワードの変更**、自分の IP の除外、ログイン中のブラウザー、CSV の書き出し、古い記録の削除 |

上部で期間（24 時間・7 日・30 日・90 日・1 年・全期間）を切り替えられます。ボット（検索エンジンのクローラー・ヘッドレス Chrome など）は「ボットを含める」をオンにしたときだけ数えます。時刻はすべて日本時間です。

**グラフ**（`components/admin/charts.tsx`。ライブラリーを使わず SVG で描画）：折れ線（面）・積み上げ棒・横棒ランキング・ドーナツ・円・帯（デバイスの割合）・ヒートマップ（曜日 × 時間帯）・カレンダー（26 週間）・ヒストグラム・ファネル・散布図（バブル）・ツリーマップ・レーダー・ゲージ・サンキー（流入元 → 最初のページ → 行動）・スパークライン。すべてマウスを重ねると数値が出て、カードの「表」で数値の表に切り替えられます。色は役割ごとに固定（Chrome はいつも同じ色など）で、色覚の多様性に配慮した配色を検証して使っています（明るい表示とダーク表示）。

**パスワード**：初期パスワードは `loveapple12345` です。ログイン後、`/admin/settings` で変更してください（初期のままの間は、ダッシュボードに注意が出ます）。データベースにはパスワードそのものではなく scrypt のハッシュだけを保存します。8 回続けて間違えると、その IP アドレスからは 15 分間ログインできません。ログインは 7 日間有効で、パスワードを変更するとほかのブラウザーはログアウトされます。パスワードを忘れたときは、データベース（Turso ならその管理画面のシェル、ファイルなら `data/analytics.sqlite`）の `meta` 表から `admin_password` の行を消すと、初期パスワードに戻ります。

**記録する内容**：IP アドレス、ブラウザー・OS・デバイス（User-Agent と User-Agent Client Hints。Chrome・Edge では Windows 11 と 10 も区別）、言語・タイムゾーン・画面の大きさ、参照元、開いたページ、一覧で詳細を開いた動画・プレビューを開いたサイト、再生ページでの再生（視聴時間・最大到達位置・25/50/75%・最後まで）。ページの表示が始まった時点で 1 件目を送るので、すぐに離れた人も数えます。管理画面へのアクセスと、ブラウザーが「トラッキングしない」（Global Privacy Control）を送っている人は記録しません。

**データベース**：SQLite。保存先は、サーバーを起動したときに次の順で決まります（`lib/server/db.ts`。どれも追加のパッケージは不要で、表は最初のアクセスで自動で作られます）。
1. **Turso**（クラウドの SQLite）：環境変数 `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` があるとき。Turso の HTTP API に `fetch` で送ります。**Vercel で公開するときはこれを使います。**
2. **ファイル**：`data/analytics.sqlite`（環境変数 `ANALYTICS_DB_PATH` で変更可。Node.js に組み込みの `node:sqlite`）。`npm start` で動かすサーバー向け。
3. **一時ファイル**：2 のファイルを作れないとき（Turso を設定していない Vercel など）。サイトとログインは動きますが、サーバーが入れ替わると記録とパスワードの変更が消えます。管理画面の上部に注意が出ます。

**Vercel で記録を残す手順**
1. Vercel のプロジェクトの「Storage」（または Marketplace）から **Turso** を追加して、データベースを作ります（無料枠あり）。手動で作る場合は turso.tech でデータベースを作り、URL（`libsql://…turso.io`）とトークンを控えます。
2. プロジェクトの「Settings → Environment Variables」に `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` があることを確かめます（Marketplace から追加した場合は自動で入ります。名前に接頭辞が付いた場合は、この 2 つの名前でも登録します）。
3. 再デプロイします。`/admin/settings` の「データベース」が「Turso」になっていれば完了です。続けてパスワードを変更してください。

**公開するときの注意**
- Vercel のようなサーバーレス環境ではファイルが残らないため、Turso を設定してください（上の手順）。設定しないと記録は一時ファイルにしか残りません（2026-11-20：以前はここでデータベースのファイルを作れず、ログインでサーバーエラーになっていました）。
- **このリポジトリは公開されているため、初期パスワードは誰でも読めます。** 公開したら、すぐに `/admin/settings` でパスワードを変更してください（Turso を設定した後に。一時ファイルのままだと変更が消えて初期パスワードに戻ります）。
- IP アドレスは、手前にプロキシ（nginx・Cloudflare など）がある場合、その転送ヘッダー（X-Forwarded-For）から読みます。プロキシの設定でこのヘッダーを正しく渡してください。
- IP アドレスは個人情報にあたる場合があります。公開サイトでは、プライバシーポリシーでアクセス解析をしていることを示すのがおすすめです。
- 動作確認のときに `TRACK_DEBUG=1` を付けてサーバーを起動すると、受け取った記録をサーバーのログに出します。

## 見た目の監査（2026-11-20）

再現した画面（ログインが必要なもの・アプリの枠）を、本物の画面写真・公式ヘルプ・公開されている CSS / JS と 1 画面ずつ比べて直しました。画面の日付（2026/11/01〜15）の時点の見た目に合わせています。

| 画面 | 主な修正 |
| --- | --- |
| Chrome の枠（全 37 本） | 2023 年のデザイン変更以降の見た目に（この PC の Chrome 157 を撮影して採寸）：タブ列 40px・#d3e3fd、左端のタブ検索、選択中のタブの裾の丸み、ツールバー 46px、アドレスバー 34px・#edf2fa（`shared/win11.css` の末尾） |
| タスクバー | 「タスク ビュー」のボタンを外した |
| VS Code | ステータスバーを日本語版の「行 N、列 N」に、エクスプローラーのフォルダー名を 1 行（はみ出しは …）に |
| デバイスモード（14 本） | DevTools を下に開いた状態で表示（デバイスモードは DevTools の機能のため）。倍率は残りの高さに合わせて表示。機種名は 390×844 に合う「iPhone 12 Pro」 |
| Shopify の管理画面・テーマエディタ | Polaris の本物のアイコン（@shopify/polaris-icons）、ナビの日本語ラベル（注文書・在庫転送・チェックアウト離脱・グロース ほか）、上部バー・ボタン・バッジ・モーダルを Polaris の値に。新しい管理画面（2026-09-15 から順次展開）は全ストアへの完了日が未公表のため、従来デザインの最終形にしています |
| makeshop の管理画面 | 2026-07-27 リリースの左メニュー・ヘッダー・右サイドバー、ページ名・URL・パンくず・トーストを管理画面の公開ファイルの定義どおりに |
| STUDIO のエディタ | 2025-11-25 から既定の新エディタ（Editor 5.0。旧エディタは 2026 年 5 月末に終了）の配置に作り直し |
| Wix のエディタ | 2 段の上部バー、左のアイコン列、パネル名・パーツの分類・サイトページ・メディアを 2025〜2026 年の日本語の画面写真どおりに |
| Figma | UI3（明るいタブバー・左のナビゲーションバー・下の浮いたツールバー・右パネル）、バリアブルの画面 |
| GTM・Tag Assistant・GA4・Gmail | 日本語版の画面写真どおりの構成と文言。画面に出る時刻はタスクバーの時計から計算 |

修正した不具合：
- 字幕をオフにすると、上へ移したキー表示の帯が画面の縦いっぱいに伸びていた（`body.no-captions .keystrip` の優先度。`shared/win11.css`）
- ec-daikoku-plugin のターミナルのパスが「C:workdaikoku-eccube」になっていた（`config.js` の `\` のエスケープ漏れ）
- wp-asianretreat-booking の通知メールで、テスト予約の氏名・電話・メール・住所がぼかされていなかった（`js/gmail.js` の `pii`）

確認できずに残した点（各画面の細部の文言など）は [docs/audit-2026-11-20.md](docs/audit-2026-11-20.md) にまとめています。

## Next.js への移行（2026-11-17）

| 以前（静的な HTML） | 現在（Next.js） |
| --- | --- |
| `index.html`（HTML・CSS・JS を 1 ファイルに 900 行） | `app/(site)/page.tsx` ＋ `components/home/*`（部品ごとに分割）＋ `home.css`。フォントは `next/font` で配信 |
| `watch.html` ＋ `shared/player.js` / `player.css` | `app/(player)/watch/[id]/page.tsx`（`/watch/<id>`、全動画を静的に生成）＋ `components/player/Player.tsx` |
| `data/videos.js` `links.js` `demos.js` `games.js`（`window.*` に代入） | `content/videos.ts` `sites.ts`（型付き。`lib/types.ts`）。タブの文言は `index.html` の中から `content/tabs.ts` へ |
| `data/timeline.js` `captures.js`（生成） | `generated/timeline.json` `captures.json` |
| `videos/<id>/` `shared/` `thumbs/` | `public/videos/<id>/` `public/shared/` `public/thumbs/` |
| `videos/<id>/README.md` | `docs/videos/<id>.md`（公開フォルダの外へ） |
| `videos/<id>/tools/`・`tools/.test/` | `tools/snapshots/<id>/`・`tools/snapshots/<id>/test/`（公開フォルダの外へ） |
| `package.json` の `snapshot:<id>` × 10 | `npm run snapshot -- <id>` 1 つ（取り込み方は id から自動で選択） |
| `tools/build-timeline.js` | `tools/timeline.js`（ほか `verify-video.js` `webp.js` `favicons.js` `snapshot.js` を追加） |
| JPEG・PNG・AVIF・GIF | WebP（上記） |
| ファビコンのないタブの地球儀（自作の図） | Chrome 本体のアイコン（Chromium のソースから） |
| makeshop の管理画面の URL `admin.makeshop.jp`（存在しないドメイン） | 実際の管理画面のドメイン `console.makeshop.jp`、タブのタイトルも実際の形式（「… - makeshop byGMO」） |
| 公開されている画面も見た目を似せた再現（テーマストア・GitHub・検証ツール・Sveltia CMS・WordPress の管理画面・Lighthouse・PDF ビューア・ログイン画面） | 本物の画面を取り込んで表示（上の「本物の画面と再現の区別」。取り込みのスクリプトは `tools/snapshots/<id>/`） |
| VS Code の見た目（以前の Dark+ 風の色・手描きのアイコン、動画ごとに別々） | 今の既定の見た目（Dark Modern の色・codicon・Seti のファイルアイコン・ミニマップ）を `public/shared/vscode.css` / `vscode.js` で 7 本に共通化 |
| Shopify・STUDIO・makeshop の画面にロゴなし | 各サービスの本物のロゴ（`public/shared/logos/`。makeshop の管理画面は管理画面自身のファイルから） |

移行前の静的版は `../movie-static-backup-2026-11-17.tar` に保存してあります。
