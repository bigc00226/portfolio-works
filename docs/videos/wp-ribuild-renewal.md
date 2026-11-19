# 制作プロセス デモ — 整体りびるど（ribuild.jp）WordPress サイトのリニューアル

> 一覧ページ（`/`）と再生ページ（`/watch/wp-ribuild-renewal`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-ribuild-renewal/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 7 分 41 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
長野県松本市の整体院「整体りびるど」（https://ribuild.jp/）の **既存の WordPress サイトをリニューアルする工程** を順番に再生します。

**現状の確認（旧テーマ）→ ページ構成・導線の整理 → 新テーマ「rebuild」の実装 → スマートフォン表示の最適化 → 本番への反映（テーマの移行）**

## 最初に確認していただきたいこと

- ribuild.jp は **WordPress で運営されている実在の整体院のサイト** です。公開中のサイトは専用テーマ「整体りびるど 公式サイト」（テーマフォルダー `rebuild`）＋ Elementor（LP）＋ Contact Form 7 などで動いています。
  このデモは「汎用テーマで作られていたサイトを専用テーマにリニューアルする」としたらどう進めるか、という **工程の再現** で、実際のリニューアル作業の記録ではありません。
- **本物のもの**
  - ブラウザに出る新しいサイト（開発サイト `localhost:8888` と本番 `ribuild.jp`。トップページと「症状別のお悩み」、PC 幅 1920px / スマートフォン幅 390px）は、公開中のサイトの画面をそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
  - WordPress の管理画面とリニューアル前のサイトは、**すべて本物の WordPress 7.1 の画面** です（日本語。下の「WordPress の画面について」）。プラグインは公開サイトで使われているもの（Contact Form 7・Elementor・Custom Post Type UI・All-in-One WP Migration・Useful Blocks）を wordpress.org から入れ、翻訳も公式のものです。
  - 管理画面に並ぶ固定ページ・投稿・カテゴリー・お知らせのタイトル・スラッグ・ID・日付は、公開サイトの REST API（`/wp-json/wp/v2/…`）から取ったものです（2026-11-08 12:00 までのもの）。症状別の 7 ページも公開サイトのページです。
  - 新テーマの `style.css` のヘッダー（Theme Name: 整体りびるど 公式サイト / Author: TONE / Description / Version）・`screenshot.png`・コンパイル済みの CSS・アイコン画像は公開サイトのテーマのファイルです。マークアップのクラス名（`p-header` `p-gnav` `p-contactBtn` `p-footer` …）、ブレークポイント（768px / 1030px）、電話番号・WEB予約の URL も公開サイトと同じです。
  - テーマの zip：動画のテーマのファイルを、この PC で実際に `Compress-Archive`（Windows PowerShell 5.1）と `tar -a -c -f` で圧縮したものです。zip の中のパス（`rebuild\assets\` / `rebuild/assets/`）とサイズ（821 KB / 824 KB）はその結果で、
    `Compress-Archive` の zip を WordPress にアップロードすると実際に「テーマに style.css スタイルシートがありません。」で失敗し、`tar` の zip はインストール・有効化できました（その画面を取り込んでいます）。
  - All-in-One WP Migration のエクスポートも実際に行った画面です（サイズ 137 MB は取り込みに使った WordPress のもの。ボタンのホスト名だけ ribuild.jp に置き換え）。
  - 旧 URL の転送：`curl.exe -sI https://ribuild.jp/お問い合わせ/` の結果（`301 Moved Permanently`・`X-Redirect-By: WordPress`・`Location: https://ribuild.jp/contact/`）は公開サイトの実際の応答です（Date だけ動画の日時）。
    動画で書く `functions.php` の転送も、取り込みに使った WordPress で `/お問い合わせ/` → `/contact/` に転送されることを確かめています。
- **再現のもの**
  - リニューアル前のサイト：テーマ **Lightning**（wordpress.org の無料テーマ）、トップのスライド、症状別のページが並ぶメニュー。ribuild.jp が以前どのテーマだったかは分かっていません（スライドの写真とキャッチコピーは公開サイトのもの）。
  - リニューアル前のページ構成：症状別の 7 ページが親なし、「予約・お問い合わせ」のスラッグが日本語（`お問い合わせ`）。公開サイトでは 7 ページは「症状別のお悩み」（ID 4292、2026 年 5 月作成）の子ページで、`/お問い合わせ/` は `/contact/` に 301 転送されています。
    動画はこの状態に至る作業を再生しています（新しく作る「症状別のお悩み」の ID・作成日時は公開サイトとは違います）。公開サイトの転送の仕組み（テーマかプラグインか）は分かりません。
  - テーマの PHP（`header.php` `functions.php` `template-parts/…`）と Sass のソース（`src/scss/…`）は説明のために書いたものです（マークアップ・クラス名・数値は公開サイトの HTML / CSS から取っています）。開発環境（wp-env）・npm スクリプト・ターミナルの出力もそれに合わせたものです。
  - スマートフォンの 2 つのミス（ヘッダー・フッター）は演出です（公開サイトはどちらも正しく表示されます）。
- 整体りびるどは実在の事業者です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/wp-ribuild-renewal/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/wp-ribuild-renewal/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（サイトの画面・WordPress の画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「WordPress サイトのリニューアルが完了」と出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 現状の確認 | Chrome（旧サイト・管理画面） | リニューアル前の ribuild.jp（テーマ Lightning：スライドと、症状別のページが並んではみ出すメニュー。電話・予約の入口がない）→ ダッシュボード（WordPress 7.1 / Lightning）→ 固定ページ一覧（症状別の 7 ページが親なし、お問い合わせのスラッグが日本語） | |
| 2 ページ構成・導線の整理 | Chrome（ブロックエディター・固定ページ一覧） | 親ページ「症状別のお悩み」を作成（タイトルを IME で入力、スラッグを `symptoms` に、公開）→ 一括編集で 7 ページの親を「症状別のお悩み」に → クイック編集でお問い合わせのスラッグを `contact` に（固定ページは旧スラッグが記録されないので、旧 URL の転送はテーマ側で用意する） | |
| 3 新テーマ「rebuild」の実装 | VS Code ＋ ターミナル ＋ Chrome（localhost:8888） | README のリニューアル方針、`style.css` のテーマヘッダー、`.wp-env.json` と `npm run env`、開発サイトで新しいデザインを確認 → `header.php` のグローバルナビに「症状別のお悩み」を追加（開発サイトで /symptoms/ を表示）→ `functions.php` に旧 URL `/お問い合わせ/` → `/contact/` の 301 転送 | |
| 4 スマートフォン表示の最適化 | Chrome（DevTools のデバイスモード 390px）＋ VS Code | トップページのヘッダーを確認 → 画面の下の予約ボタンに「電話予約」を追加（`template-parts/contact-btn.php`。`_contact-btn.scss` で PC では非表示＝公開サイトと同じ）→ ページの一番下を確認、`npm run build`（Sass） | **ヘッダー崩れ**：PC 用の電話番号が残りロゴが潰れる → `_header.scss` に `@include mq(sp)` で非表示。**フッターが隠れる**：スマートフォン用の `padding-block` が固定ボタン分の `padding-bottom` まで上書き → `padding-top` に |
| 5 本番への反映（テーマの移行） | Chrome（本番の管理画面）＋ ターミナル | All-in-One WP Migration でバックアップ（エクスポート → ファイル → .wpress を保存）→ テーマを zip にして 外観 › テーマ › テーマのアップロード → 有効化（Lightning → 整体りびるど 公式サイト）→ `curl.exe -sI` で旧 URL の 301 を確認 → Elementor の LP（四十肩・五十肩）をデスクトップ / モバイルで確認 | **インストール失敗**：Windows PowerShell 5.1 の `Compress-Archive` で作った zip は中のパスの区切りが「\」（`rebuild\style.css`）で、WordPress が style.css を見つけられない → zip の中身を確認し、Windows 標準の `tar -a -c -f` で作り直す |
| 公開中のサイトの確認 | Chrome | 旧サイトを開いていたタブを再読み込みすると新しいデザインに。ヘッダーの電話番号・ナビ・右下の予約ボタン、トップページの各セクション、「症状別のお悩み」、スマートフォン幅の表示 | |

### 日本語入力（Microsoft IME と同じ流れ）

固定ページのタイトル（症状別のお悩み）、テーマに書くナビ・ボタン・コメントの日本語（症状別のお悩み・電話予約・リニューアル前の…）、ターミナルの URL（お問い合わせ）は、ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。
英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。

## キー操作 / URL パラメータ

ほかのデモと同じです（`../../README.md`）。**Space** 再生 / 一時停止、**R** 最初から、**C** 字幕、**H** ヒント、`?t=秒` `?from=シーン番号` `?speed=1.3` `?captions=0`。

## 本番サイトとの同一性について

- 新しいサイトの画面（トップページ・症状別のお悩み、PC / スマートフォン）は、公開中の ribuild.jp をブラウザで開き、サイトのスクリプトが動いた後の画面を **そのまま取り込んだもの** です。スタイルシートは本番のファイルのまま、画像はその幅で表示されていたサイズのものです。
  スクリプト・読み込み中のアニメーション・reCAPTCHA・埋め込み（iframe）は取り込んでいません。
- 開発中の状態は、取り込んだ画面に CSS を足して再現しています（`js/apps.js` の `StoreFrame.STATES`）：
  `noSymptoms`（ナビの「症状別のお悩み」を隠す）、`noTel`（画面の下の予約ボタンの「電話予約」を隠す。公開サイトでも電話予約はスマートフォンだけのボタン）、
  `spHeader`（スマートフォンでもヘッダーの電話番号を表示 → ロゴが潰れ、メニューボタンが押し出される）、
  `spFooter`（スマートフォンでフッターの下の余白をなくす → 固定ボタンがプライバシーポリシーとコピーライトを隠す）。
- 本番サイトのフォント（Zen Old Mincho / Zen Kaku Gothic New）は woff2 だけを残しています（Chrome が読み込むのは woff2 だけのため。`tools/snapshots/wp-ribuild-renewal/prune-site-fonts.js`）。
  WordPress の画面（Elementor のプレビュー）で使われる同じフォントは、このファイルを指すようにしています（`link-wp-fonts.js`）。

## WordPress の画面について

- 管理画面とリニューアル前のサイトは、**WordPress Playground**（ブラウザの中で動く本物の WordPress。WordPress 7.1.4 / PHP 8.3）に公開サイトのデータを入れ、
  実際に操作した各画面を取り込んだものです（`tools/snapshots/wp-ribuild-renewal/capture-wp.js` → `js/wp-snapshot.js`・`assets/wp/`）。
  固定ページの作成・スラッグの変更・一括編集・クイック編集・バックアップ（エクスポート）・テーマのアップロード（失敗する zip と正しい zip）・有効化・Elementor の編集画面は、すべてその WordPress で実際に行った結果の画面です。
- 本番にはログインしていません（Playground の使い捨ての管理者で操作しています。ユーザーの表示名は「ribuild」）。アドレスバーのアドレスは本番の `https://ribuild.jp/…` に置き換えています。
- 文字の入力は、取り込んだ画面の入力欄の位置に同じ文字を描いて再生しています（ボタンを押した後の画面は、実際に押した後に取り込んだもの）。セレクトボックスの一覧・ファイルを選ぶダイアログは見た目を似せたものです。
- サイトアイコン（タブのファビコン）は公開サイトのもの（`logo2.png`）です。開発サイト（localhost:8888、サイトアイコン未設定）のタブには WordPress のアイコンを表示しています。
- テーマの推奨プラグインの通知（Lightning）・Lightning のデータベース更新の通知・Elementor の宣伝は、運用中のサイトと同じく「済ませた / 閉じた」状態で取り込んでいます。
  取り込み中は外部への通信を止めています（Playground では管理画面が極端に遅くなるため。ダッシュボードの「WordPress イベントとニュース」は非表示）。
- Elementor の編集画面は、エディターが起動した後に消える「読み込み中」の表示を、動画の中で非表示にしています。

## 演出であるもの

- **画面の環境**：VS Code は今の既定の見た目です（Dark Modern テーマ、VS Code 自身のアイコン codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。ターミナルは PowerShell です。
  共通のコードの色分けに PHP がないため、テンプレート（`header.php` など）は HTML、PHP だけのファイルはスクリプトの色で表示しています（ステータスバーは「PHP」）。
- Windows の「開く」ダイアログ・Chrome の DevTools（デバイスモード）・ダウンロードの表示は見た目を似せたものです。
- スマートフォンの 2 つのミスと修正、ファイルの日時、wp-env のポート番号、バックアップのファイル名の末尾（ランダムな文字列）は演出です。

## サイトを更新した場合

```
npm run snapshot -- wp-ribuild-renewal                          新しいサイトの画面・画像を取り込み直す
node tools/snapshots/wp-ribuild-renewal/prune-site-fonts.js     使われないフォント（woff / ttf / eot）を削除（取り込み直したら毎回）
node tools/snapshots/wp-ribuild-renewal/capture-wp.js           WordPress の画面を取り込み直す（Playground、約 10 分。最後に link-wp-fonts.js も実行）
node tools/webp.js wp-ribuild-renewal                           WordPress の画面の画像を WebP に
npm run timeline -- wp-ribuild-renewal                          長さ・チャプターの測定とサムネイルの撮影
```

取り込む内容（ページ・取り除く要素）は `js/config.js` の `snapshot` で設定します。`capture-wp.js` が読む公開サイトのデータは、その日のうちは一時フォルダーのコピーを使います（何度も取り込み直すときに本番へ何度もアクセスしないため）。

## ファイル構成

```
index.html            ページ本体（共通の部品は public/shared/kit/・public/shared/wordpress/ と public/shared/）
css/video.css         このデモだけの見た目（WordPress の画面の枠・セレクトの一覧・ターミナルの色）
js/config.js          デモの設定（工程・タイトル画面・サイト・取り込むページ）
js/site-snapshot.js   取り込んだ ribuild.jp の画面（自動生成）
js/wp-snapshot.js     取り込んだ WordPress の画面（自動生成）
js/files.js           VS Code に表示するプロジェクトのファイル（wp-env・テーマ rebuild・Sass）
js/apps.js            WordPress の画面をタブに出す処理、セレクトの一覧、PHP の表示、開発中の状態（StoreFrame.STATES）
js/scenario.js        台本（シーンごとの操作・字幕・ミスと修正）
assets/site/          取り込んだ画像・フォント（自動生成）
assets/wp/            WordPress の画面の画像・CSS（自動生成）
tools/snapshots/wp-ribuild-renewal/
  capture-wp.js       WordPress の画面の取り込み（Playground）
  prune-site-fonts.js 使われないフォントの削除
  link-wp-fonts.js    WordPress の画面のフォントをサイトの取り込みのフォントに
```
