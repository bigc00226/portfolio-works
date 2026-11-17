# 制作プロセス デモ — 京橋ウェルネスクリニック・かとう歯科 お問い合わせフォームの構築（Contact Form 7）

> 一覧ページ（`/`）と再生ページ（`/watch/wp-clinic-contact-form`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-clinic-contact-form/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 6 分 8 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
2 つのクリニックの WordPress サイトで **Contact Form 7 によるお問い合わせフォームを構築・修正する工程** を順番に再生します。

- 京橋ウェルネスクリニック（https://miyazawaclinic.net/contact/）：デザインだけだったフォームを Contact Form 7 で動かす
- かとう歯科（https://kato-dental-clinic.net/contact/）：既存のフォームに画像の添付を追加する

**Contact Form 7 の導入 → フォームの作成 → テーマに設置 → 通知メール → 自動返信メール → スパム対策（reCAPTCHA v3）→ 送信テスト → ファイル添付（かとう歯科）**

## 最初に確認していただきたいこと

- 2 つのサイトは **WordPress で運営されている実在のクリニックのサイト** で、どちらも公開中のお問い合わせページは Contact Form 7 で動いています。
  このデモは、そのフォームを作る（直す）としたらどう進めるか、という **工程の再現** で、実際の作業の記録ではありません。
- **本物のもの**
  - ブラウザに出る 2 つのお問い合わせページと京橋ウェルネスクリニックのサンクスページ（PC 幅 1920px）は、公開中のページをそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
  - WordPress / Contact Form 7 の管理画面は **すべて本物の画面** です（WordPress 7.1.4・Contact Form 7 6.2.5・日本語。下の「WordPress の画面について」）。
    プラグインの検索・インストール・有効化、フォームの作成と保存、タグジェネレーター、設定エラーの表示、reCAPTCHA の設定は、実際にその WordPress で操作した結果の画面です。
  - 京橋ウェルネスクリニックのフォームのテンプレートは、公開ページのフォームと **同じ HTML を出力するもの** です：テーマのマークアップ（`dl.form__wrap` …）・
    コメントで残した静的な入力欄・項目名（`your-name` `your-email` `checkbox-344` `introduce` `other-how-found` `category` `history` `hope`）・
    送信後にサンクスページへ移動するスクリプト・自動整形なし。動画で作ったフォームを Contact Form 7 が出力した HTML は、公開ページのフォームと一致します
    （違いは フォームの ID・Contact Form 7 のバージョンによる `aria-required` の有無だけ）。`checkbox-344` は Contact Form 7 のタグジェネレーターが付ける名前の形で、動画でもタグジェネレーターで作っています。
  - テーマ（`page-contact.php`）の静的なフォームは、公開ページに HTML コメントとして残っているものと 1 行ずつ同じです（プライバシーポリシーの一文と、送信後の移動のスクリプトを含む）。
  - かとう歯科のフォーム（表の行・項目名・`class:form-control`・同意のチェックボックス・送信ボタンのクラス）も公開ページのフォームと同じです。添付の行だけが動画で足したものです。
  - 送信テストの「入力してください。」「アップロードされたファイルが大きすぎます。」「ありがとうございます。メッセージは送信されました。」は、同じフォームを
    Contact Form 7 に実際に送信した結果です（空のまま送信・3.8 MB の JPEG・上限 10 MB にした後の送信）。
  - タブのアイコンは各クリニックのサイトアイコンです。miyazawaclinic.net のメールは Google（MX が smtp.google.com）のため、受信トレイは Gmail のタブで表示しています。
- **再現のもの**
  - 作業の順番と、3 つのミス（下の表）は演出です。公開中のサイトが実際にどの順で作られたかは分かりません。
  - テーマのファイル（`functions.php` `header.php` などと、`page-contact.php` のフォーム以外の部分）・フォルダー構成・`npm run deploy` とその出力は説明のために書いたものです（テーマの名前 `kyoubashi-wellness`・クラス名は公開ページのもの）。
  - 通知メールと自動返信メールの文面、送信先（info@miyazawaclinic.net は公開ページに載っているアドレス）、送信元（noreply@miyazawaclinic.net）は動画で作ったものです。
    かとう歯科の通知メールの送信先は Contact Form 7 の初期値（`[_site_admin_email]`）のままにしています（クリニックのアドレスは公開されていないため）。
  - reCAPTCHA のキーは作ったもので、画面ではぼかしています。
  - 受信トレイは **見た目を似せたもの**（ロゴなし）で、2 通のメールの本文は、フォームの設定のメールタグに送信した内容を入れたものです。
  - テスト送信の名前（テスト 花子・テスト 太郎）と写真のファイル名（IMG_4127.jpg）は作ったものです。
- 2 つのクリニックは実在の医療機関です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。診療の内容には触れていません。

## 録画の手順

1. `public/videos/wp-clinic-contact-form/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/wp-clinic-contact-form/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（サイトの画面・WordPress の画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「お問い合わせフォームの構築・修正：…」と出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 Contact Form 7 の導入 | Chrome（公開ページ・管理画面）・VS Code | 公開ページのフォームと `page-contact.php`（action も name もない、見た目だけのフォーム）を確認 → プラグインを追加で「Contact Form 7」を検索 → 今すぐインストール → 有効化 | |
| 2 フォームの作成 | VS Code・Chrome（管理画面） | テーマのフォームをコピー → お問い合わせ › コンタクトフォームを追加：タイトル「お問い合わせ」、テンプレートに貼り付け、外側の `<form>` を `<div>` に、静的な input をコメントにしてフォームタグ（`[text* your-name …]` `[email* your-email …]`）、チェックボックスはタグジェネレーター（必須・選択肢 4 つ・label で囲む）、ほかの項目と `[submit "送信"]`・サンクスページへのスクリプト → 保存 → ショートコードをコピー | |
| 3 テーマに設置 | VS Code ＋ ターミナル・Chrome | `page-contact.php`：元のフォームをコメントにして（Shift+Alt+A）、`do_shortcode()` でフォームを出力 → `npm run deploy` → 公開ページで確認 | **レイアウト崩れ**：Contact Form 7 の自動整形がテンプレートの改行に `<p>` / `<br>` を入れ、ラベルの「必須」が次の行に、入力欄の上下にも余白 → `functions.php` に `add_filter( 'wpcf7_autop_or_not', '__return_false' );` → デザインどおり |
| 4 通知メール | Chrome（管理画面） | メール タブ：送信先 info@miyazawaclinic.net、題名、本文（項目ごとのメールタグ） | **送信元の誤り**：お問い合わせした方のアドレス（`[your-name] <[your-email]>`）を送信元にして保存 → 設定エラー「サイトのドメインに属していないメールアドレスが送信元に設定されています。」→ 送信元を `noreply@miyazawaclinic.net` に、返信先は追加ヘッダーの `Reply-To: [your-email]` |
| 5 自動返信メール | Chrome（管理画面） | メール (2) を使用：送信元・題名・Reply-To・本文 | **設定エラー**：「安全でないメール設定が十分な防御策なく使われている。」（自動返信が入力されたアドレスに届く＝スパム対策がないと踏み台になる）→ 次の STEP で対策 |
| 6 スパム対策 | Chrome（管理画面） | お問い合わせ › インテグレーション › reCAPTCHA（v3）にサイトキー・シークレットキー（ぼかし）→ 保存 → フォームに戻って保存し直すと設定エラーなし | |
| 7 送信テスト | Chrome（公開ページ・受信トレイ） | 空のまま送信 → 必須の 4 項目に「入力してください。」→ 入力して送信 → サンクスページ → 受信トレイに通知メールと自動返信メール | |
| 8 ファイル添付 | Chrome（かとう歯科の管理画面・公開ページ） | フォームの表に行を追加（`[file your-file filetypes:jpg\|jpeg\|png\|pdf class:form-control]`）→ メール タブのファイル添付に `[your-file]` → 公開ページで写真を選んで送信 | **サイズ超過**：スマホの写真（3.8 MB）が「アップロードされたファイルが大きすぎます。」（ファイルの上限は初期設定で 1 MB）→ フォームタグに `limit:10mb`、案内文に「10MB まで」→ 送信完了 |
| 公開ページの確認 | Chrome | 2 つのクリニックのお問い合わせフォーム | |

### 日本語入力（Microsoft IME と同じ流れ）

フォームのタイトル・テンプレートのコメント・チェックボックスの選択肢・メールの題名・PHP のコメント・テスト送信の入力・かとう歯科の表の文字は、
ローマ字を 1 キーずつ入力 → 変換 → 確定 の流れで入力しています。英数字は IME をオフ（半角/全角）にして入力し、画面下に押したキーを表示します。
メールの本文と reCAPTCHA のキーは貼り付けです。

## キー操作 / URL パラメータ

ほかのデモと同じです（`../../README.md`）。**Space** 再生 / 一時停止、**R** 最初から、**C** 字幕、**H** ヒント、`?t=秒` `?from=シーン番号` `?speed=1.3` `?captions=0`。

## 本番サイトとの同一性について

- 2 つのお問い合わせページとサンクスページは、公開中のページをブラウザで開き、サイトのスクリプトが動いた後の画面を **そのまま取り込んだもの** です。
  スタイルシートは本番のファイルのまま、画像はその幅で表示されていたサイズのものです。スクリプト・reCAPTCHA のバッジは取り込んでいません。
- フォームの状態は、取り込んだページの上で Contact Form 7 のスクリプトと同じことをして再現しています（`js/apps.js` の `Front`）：
  入力欄への入力（入力欄と同じスタイルの箱に文字を描く）、チェックボックス・ラジオボタン・ファイルの選択（ページの本物の要素）、送信後の表示（Contact Form 7 が同じフォームに返した結果の文言と、項目ごとのエラー）。
  自動整形が入った崩れたフォームは、同じテンプレートを自動整形ありで Contact Form 7 に出力させた HTML です（`WP.data.autopOn`）。かとう歯科の添付の行も、Contact Form 7 が出力した行をそのまま公開ページの表に入れています。
- 再読み込み後に入力内容が残っているのは Chrome のフォームの復元と同じ動きです（ファイルは選び直し）。

## WordPress の画面について

- 管理画面は、**WordPress Playground**（ブラウザの中で動く本物の WordPress。WordPress 7.1.4 / PHP 8.3）で実際に操作した各画面を取り込んだものです
  （`tools/snapshots/wp-clinic-contact-form/capture-wp.js` → `js/wp-snapshot.js`・`assets/wp/`）。ログインはしていません（Playground の使い捨ての管理者）。アドレスバーのアドレスは本番の `https://miyazawaclinic.net/…` / `https://kato-dental-clinic.net/…` に置き換えています。
- 1 つの Playground を 2 つのクリニックに切り替えて使っています（サイト名・固定ページ・フォーム）。固定ページのタイトル・スラッグは公開サイトの REST API から取ったものです。
  プラグインは公開ページから使われていることが分かる Contact Form 7 と TablePress を入れています（Akismet も公開ページのフォームで使われていますが、API キーが必要なため入れていません。Playground の Hello Dolly は削除しています）。
- Contact Form 7 は送信元のメールアドレスが「サイトのドメイン」に属しているかを調べます。Playground は別のホストで動くため、その確認と送信元の初期値（`wordpress@…`）にだけ
  クリニックのドメインを使わせています（capture-wp.js の `demo-domain.php`。公開サイトと同じ判定になるように）。
- 文字の入力は、取り込んだ画面の入力欄の位置に同じ文字を描いて再生しています（ボタンを押した後の画面は、実際に押した後に取り込んだもの）。
  タグジェネレーターの「必須」は、取り込み時にはオンにしてあり、動画ではいったんオフにしてからクリックしています。
- 撮影用の Playground で入力した reCAPTCHA のキーは作ったもので、Google には送っていません。
- TablePress の初回の案内（オプトイン）は「スキップした」状態で取り込んでいます。

## 演出であるもの

- **画面の環境**：VS Code は今の既定の見た目です（Dark Modern テーマ、VS Code 自身のアイコン codicon、Seti のファイルアイコン、ミニマップ。`public/shared/vscode.css` / `vscode.js`）。ターミナルは PowerShell です。
  共通のコードの色分けに PHP がないため、テンプレートは HTML の色で表示しています。
- Windows の「開く」ダイアログ・受信トレイは見た目を似せたものです。Chrome の戻る（Alt+←）は、戻った先の取り込んだ画面を表示しています。
- タスクバーの時計は章の切れ目で進めています（14:10 → 14:31 → 14:44 → 15:03 → 15:20）。
- 3 つのミスと修正、写真の日時、`npm run deploy` の出力は演出です。

## サイトを更新した場合

```
npm run snapshot -- wp-clinic-contact-form                         2 つのお問い合わせページ・サンクスページを取り込み直す（tools/snapshots/wp-clinic-contact-form/update-snapshot.js）
node tools/snapshots/wp-clinic-contact-form/capture-wp.js          WordPress の画面を取り込み直す（Playground、約 3 分）
node tools/webp.js wp-clinic-contact-form                          WordPress の画面の画像を WebP に
npm run timeline -- wp-clinic-contact-form                         長さ・チャプターの測定とサムネイルの撮影
```

フォームのテンプレート・メールの設定（動画で入力する文字）は `js/forms.js` にあり、取り込み（capture-wp.js）も同じものを WordPress に入力します。

## ファイル構成

```
index.html            ページ本体（共通の部品は public/shared/kit/・public/shared/wordpress/ と public/shared/）
css/video.css         このデモだけの見た目（受信トレイ）
js/config.js          デモの設定（工程・タイトル画面・サイト・取り込むページ・フォームへの入力の見た目）
js/site-snapshot.js   取り込んだ 2 つのクリニックのページ（自動生成）
js/wp-snapshot.js     取り込んだ WordPress / Contact Form 7 の画面と送信結果（自動生成）
js/forms.js           フォームのテンプレート・メールの設定・固定ページ（動画と取り込みで共通）
js/files.js           VS Code に表示するテーマのファイル
js/apps.js            WordPress の画面の表示と入力、公開ページのフォームの操作（Front）、受信トレイ
js/scenario.js        台本（シーンごとの操作・字幕・ミスと修正）
assets/site/          取り込んだ画像・フォント（自動生成）
assets/wp/            WordPress の画面の画像・CSS（自動生成）
```
