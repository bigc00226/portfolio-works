# 制作プロセス デモ — クルーズ株式会社（crooz.co.jp）WordPress コーポレートサイトの新規制作

> 一覧ページ（`/`）と再生ページ（`/watch/wp-crooz`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-crooz/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 6 分 21 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
クルーズ株式会社の公式企業サイト（https://crooz.co.jp/）を **WordPress のオリジナルテーマで新しく作る工程** を順番に再生します。

**開発環境・テーマ導入 → デザイン・メニュー → 会社概要ページ → 事業紹介ページ → お問い合わせフォーム → スマートフォン対応 → 公開中のサイト**

## 最初に確認していただきたいこと

- crooz.co.jp は **WordPress で運営されている実在の企業のサイト** です（東証スタンダード上場のクルーズ株式会社。テーマはオリジナルテーマ「crooz」、
  お問い合わせは Contact Form 7 ＋ contact-form-7-multi-step-module）。このデモは「このサイトを新しく作る」としたらどう進めるか、という
  **工程の再現** で、実際の制作作業の記録ではありません。
- **本物のもの**
  - ブラウザに出るサイト（開発サイト `localhost:8888` と本番 `crooz.co.jp`。トップ・会社概要 `/about/overview`・事業・グループ会社紹介 `/business`・
    お問い合わせ `/contact`、PC 幅 1920px / スマートフォン幅 390px）は、公開中のサイトの画面をそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
    会社概要の表の内容、事業紹介の文章と画像、お問い合わせの注意事項とフォーム（項目名 `contact` `user_surname` `user_name` `user_email` `add` `company` `user_tel`）は公開サイトのものです。
  - WordPress の管理画面は **すべて本物の WordPress 7.1.4 の画面** です（日本語。下の「WordPress の画面について」）。Contact Form 7（6.2.5）は
    「プラグインを追加」から実際に検索・インストール・有効化したもので、日本語の翻訳も公式のものです。
  - 3 つのミスのうち 2 つは WordPress / Contact Form 7 自身の動きをそのまま見せています：
    タイトル「会社概要」で公開した固定ページのスラッグが `%e4%bc%9a%e7%a4%be%e6%a6%82%e8%a6%81` になること、
    Contact Form 7 の設定エラー「フォームコントロールに使用できない名前 ("name") が使われています。」「Reply-To 項目に不正なメールボックス構文が見られます。」
    （保存後の編集画面に実際に出たもの）。サイトでの入力チェックの文言（「入力してください。」「入力内容に問題があります。確認して再度お試しください。」）も Contact Form 7 の既定のメッセージです。
  - タブのタイトル（本番：「会社概要｜クルーズ株式会社」「お問い合わせページ｜クルーズ株式会社」など）とファビコン（crooz.co.jp/favicon.ico）は公開サイトのものです。
  - トップの最初の画面の背景は、公開サイトの動画（`movie_202507_pc.mp4` / `movie_2026_06_sp.mp4`）の 3 秒目のコマです（取り込んだ画面には動画のファイルが入らないため。`tools/snapshots/wp-crooz/hero-frame.js`）。
- **再現のもの**
  - テーマのソース：crooz.co.jp のテーマのソースは公開されていないため、VS Code に出るテーマ（`functions.php` `header.php` `page.php`
    `page-overview.php` `page-business.php` `assets/css/main.css` など、`js/files.js`）は、公開サイトのマークアップ（クラス名 `.header` `.gnav`
    `.section-pageTitle .title-main` `.table-overview` `.section-block` `.logo-card-section` …）を出力するように作ったものです。
    公開サイトで会社概要が専用テンプレートで作られているかどうかは分かっていません。
  - 開発環境（wp-env、`.wp-env.json`・`package.json`・ターミナルの出力）、作業の順番、3 つのミス（スラッグ・フォームの設定・スマートフォンの表）。
    スラッグと Contact Form 7 のミスは WordPress で実際に起きる動きですが、実際の制作でこのミスがあったわけではありません。
  - お問い合わせフォーム：公開サイトは複数ステップのフォーム（確認画面あり）ですが、デモでは 1 ステップのフォーム「お問い合わせ（IR）」を作っています。
    フォームの ID（21）とハッシュ（`bc395aa`）は取り込みに使った WordPress のもので、公開サイトのものとは違います。メールの件名・本文はデモ用に書いたものです。
  - 開発中の状態（グローバルナビがない、会社概要の表がない、スマートフォンで表が崩れる、送信後の入力チェック）は、取り込んだ公開サイトの画面に CSS を足して再現しています（下の「本番サイトとの同一性について」）。
- 個人情報：管理画面のユーザーは取り込み用の使い捨ての管理者（`admin`、パスワードは • で表示）です。メールアドレスは `wordpress@localhost`（Contact Form 7 の既定の送信元）だけです。
  会社概要の「代表者」は公開サイトに載っている会社の情報のため、ぼかしていません。フォームの送信・メールの送信はどこにもしていません。
- クルーズ株式会社は実在の企業です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/wp-crooz/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/wp-crooz/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（WordPress の画面・サイトの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「WordPress のコーポレートサイト：オリジナルテーマ・会社概要・事業紹介・お問い合わせ・スマートフォン対応」と出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 開発環境・テーマ導入 | VS Code ＋ ターミナル・Chrome（管理画面） | `.wp-env.json`（テーマのフォルダー・ポート 8888）、テーマ「CROOZ」の `style.css`、`npm start`（wp-env）→ 管理画面にログイン（admin / ••••••••）→ 外観 › テーマで「CROOZ」を有効化 → 新しいタブで `localhost:8888`（ナビゲーションはまだ空） | |
| 2 デザイン・メニュー | VS Code・Chrome | `functions.php` に `register_nav_menus`（グローバルナビ・フッターナビ）、`header.php` の `wp_nav_menu`（`ul.gnav`）を確認、`main.css` にページタイトルのデザイン（中央・字間・#2dafe6 のライン）→ 外観 › メニューで位置「グローバルナビ」に割り当てて保存 → F5 でヘッダーにナビゲーション | |
| 3 会社概要ページ | VS Code・Chrome | `page-overview.php`（会社情報の配列は貼り付け、表の `foreach` を入力）→ 固定ページ › 新規追加（タイトル「会社概要」、親「企業情報」）→ 公開 → アドレスをコピーしてサイトで確認 | **テンプレートが使われない**：スラッグがタイトルの日本語のまま（`%e4%bc%9a…`）で `page.php` が使われ、表が出ない → 固定ページ一覧のクイック編集でスラッグを `overview` に → `/about/overview/` で表が出る |
| 4 事業紹介ページ | VS Code・Chrome | `page-business.php` に 5 つのセクション（番号・見出し・本文・画像）のループを入力 → `/business/` で確認 | |
| 5 お問い合わせフォーム | Chrome（管理画面）・開発サイト | プラグインを追加で「Contact Form 7」を検索 → インストール → 有効化 → コンタクトフォームを追加（タイトル「お問い合わせ（IR）」、本番のマークアップにフォームタグを入れたテンプレートを貼り付け）→ 保存 | **設定エラー 2 件**：フォームタブ「使用できない名前 "name"」（項目名を `surname` / `name` にしていた）、メールタブ「Reply-To 項目に不正なメールボックス構文」（追加ヘッダーが雛形の `[your-email]` のまま）→ 項目名を `user_surname` / `user_name`、Reply-To を `[user_email]` に、件名・本文もこのフォームの項目に → 保存（エラーなし） |
| 　 | | 固定ページ「お問い合わせ」にブロック挿入ツールで「Contact Form 7」ブロックを追加して保存 → サイトで注意事項に同意し、必須項目を空のまま送信 → Contact Form 7 の入力チェック（各項目に「入力してください。」） | |
| 6 スマートフォン対応 | Chrome（デバイスモード）・VS Code | 会社概要を幅 390px で確認 → `main.css` に `@media screen and (max-width: 640px)` → F5、事業紹介・お問い合わせも 390px で確認 | **表示崩れ**：会社概要の表の項目名（dt）が 280px のまま横に並び、内容（dd）が細い列に押し込まれる → 640px 以下では dt / dd を縦に並べる |
| 公開中のサイト | Chrome | crooz.co.jp のトップ → 会社概要 → 事業・グループ会社紹介 → お問い合わせ（注意事項に同意）→ ロゴでトップに戻る | |

### 日本語入力（Microsoft IME と同じ流れ）

`register_nav_menus` のメニュー名（グローバルナビ・フッターナビ）、CSS のコメント、固定ページのタイトル「会社概要」、フォームのタイトル「お問い合わせ（IR）」、
メールの件名は、ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。

## キー操作 / URL パラメータ

ほかのデモと同じです（`../../README.md`）。**Space** 再生 / 一時停止、**R** 最初から、**C** 字幕、**H** ヒント、`?t=秒` `?from=シーン番号` `?speed=1.3` `?captions=0`。

## 本番サイトとの同一性について

- ブラウザに出るサイトの画面は、公開中の crooz.co.jp をブラウザで開き、サイトのスクリプトが動いた後の画面を **そのまま取り込んだもの** です。
  スタイルシートは本番のファイルのまま、画像はその幅で表示されていたサイズのものです。スクリプト・reCAPTCHA・埋め込み（iframe）・WordPress の管理バーは取り込んでいません。
  開発サイト（`localhost:8888`）も同じ画面を使っています（テーマが本番と同じマークアップを出力する、という想定）。
- 開発中の状態は、取り込んだ画面に CSS を足して再現しています（`js/apps.js` の `StoreFrame.STATES`）：
  `noMenu`（メニューの位置を割り当てる前：ヘッダーのナビゲーションを隠す）、`noTemplate`（`page.php` で表示されたとき：会社概要の表を隠す）、
  `spBroken`（スマートフォンの CSS を足す前：表の dt / dd を表のセルのままにする）、`contactReady`（注意事項に同意した後：注意事項を閉じる）、
  `contactInvalid`（必須項目を空のまま送信：Contact Form 7 のスクリプトと同じく、各項目の下に「入力してください。」、フォームの下に「入力内容に問題があります。…」を出す）。
- お問い合わせページの注意事項（「理解したうえで問い合わせを行う」のチェックボックス）は公開サイトのものです。
- トップページの下のほう（ニュースの一覧）は取り込んだ日（2026 年 11 月）の日付が並ぶため、動画の日付（2026-10-28）に合わせてスクロールしていません。
- 開発サイトのタブのタイトルは WordPress のサイト名「クルーズ株式会社」・キャッチフレーズ「公式企業サイト」と、`functions.php` の区切り文字「｜」から出る形にしています。

## WordPress の画面について

- 管理画面は **WordPress Playground**（ブラウザの中で動く本物の WordPress。WordPress 7.1.4 / PHP 8.3、日本語）にテーマ「CROOZ」（`js/files.js` のファイル、
  `screenshot.png` は公開サイトの最初の画面）と公開サイトのナビゲーションの固定ページを入れ、実際に操作した各画面を取り込んだものです
  （`tools/snapshots/wp-crooz/capture-wp.js` → `js/wp-snapshot.js`・`assets/wp/`）。
  テーマの有効化・メニューの保存・ブロックエディターでの公開（スラッグが URL エンコードされた日本語になる）・クイック編集でのスラッグの変更・
  Contact Form 7 の検索 / インストール / 有効化・フォームの保存（設定エラー）・修正して保存・ブロック挿入ツールからの Contact Form 7 ブロックの追加と保存は、
  すべてその WordPress で実際に行った結果の画面です。
- ログインはしていません（Playground の使い捨ての管理者で操作しています）。ログイン画面の「もう一度ログインしてください。」は、取り込みの前にログアウトしたため WordPress 自身が出した表示です。
- 取り込みで変えているもの：Playground のアドレス → `http://localhost:8888`、取り込んだ日時 → 2026-10-28 10:41（動画の時計。固定ページ一覧の日付、クイック編集の日付欄、
  公開パネルの「今日 10:41 AM」）、コンタクトフォームを開いたときの「最終編集16時間前。」（固定ページは 2026-10-27 18:20 に作成）、Contact Form 7 の送信元のホスト → `localhost`。
  ダッシュボードの「WordPress イベントとニュース」は閉じた状態で表示しています（イベントは取り込んだ PC の地域で選ばれるため）。
- 文字の入力は、取り込んだ画面の入力欄の位置に同じ文字を描いて再生しています（ボタンを押した後の画面は、実際に押した後に取り込んだもの）。
  「インストール中…」の表示と、プラグイン検索の前の空の一覧は演出です（検索結果の画面から一覧を隠しています）。
- プラグインの検索結果の評価・最終更新・インストール数、WordPress / Contact Form 7 のバージョンは取り込んだ日（2026-11-17）のものです。
  プラグイン一覧の Hello Dolly は WordPress に最初から入っているものです。
- タブのファビコン：開発サイト（サイトアイコン未設定）は WordPress のアイコン、本番は crooz.co.jp の `/favicon.ico`（`assets/favicon.ico`）です。

## 演出であるもの

- **画面の環境**：VS Code は今の既定の見た目です（Dark Modern テーマ、VS Code 自身のアイコン codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。ターミナルは PowerShell です。
  共通のコードの色分けに PHP がないため、テンプレート（`header.php` など）は HTML、PHP だけのファイル（`functions.php`）はスクリプトの色で表示しています（ステータスバーは「PHP」、タブのサイズ 4）。
- wp-env の出力（ポート番号・かかった時間）、ファイルの内容の一部（`page-overview.php` の骨組みは貼り付け）、3 つのミスと修正、作業の時刻は演出です。
- Chrome のデバイスモード（iPhone 14 Pro Max・390 × 844）は見た目を似せたものです。

## サイトを更新した場合

```
npm run snapshot -- wp-crooz                          サイトの画面・画像を取り込み直す（画像は WebP に変換）
node tools/snapshots/wp-crooz/hero-frame.js           トップの動画のコマ（assets/site/hero/）を取り直す
node tools/snapshots/wp-crooz/capture-wp.js [フォルダー]   WordPress の画面を取り込み直す（Playground、数分。フォルダーを渡すと各画面のスクリーンショットも保存）
node tools/webp.js wp-crooz                           WordPress の画面の画像を WebP に
npm run timeline -- wp-crooz                          長さ・チャプターの測定とサムネイルの撮影
```

取り込む内容（ページ・取り除く要素）は `js/config.js` の `snapshot` で設定します。WordPress の画面の時刻の置き換えだけをやり直すときは
`node tools/snapshots/wp-crooz/capture-wp.js --fix-clock` です。

## ファイル構成

```
index.html            ページ本体（共通の部品は public/shared/kit/・public/shared/wordpress/ と public/shared/）
css/video.css         このデモだけの見た目（WordPress の画面の背景、エディターのタブのサイズ）
js/config.js          デモの設定（工程・タイトル画面・サイト・取り込むページ）
js/site-snapshot.js   取り込んだ crooz.co.jp の画面（自動生成）
js/wp-snapshot.js     取り込んだ WordPress の画面（自動生成）
js/files.js           VS Code に表示するプロジェクトのファイル（wp-env・テーマ CROOZ・Contact Form 7 のフォームとメール）
js/apps.js            タブのファビコン、トップの動画のコマ、開発中の状態（StoreFrame.STATES）
js/scenario.js        台本（シーンごとの操作・字幕・ミスと修正）
assets/site/          取り込んだ画像・フォント（自動生成）、hero/（トップの動画のコマ）
assets/wp/            WordPress の画面の画像・フォント（自動生成）
assets/favicon.ico    crooz.co.jp のファビコン
```
