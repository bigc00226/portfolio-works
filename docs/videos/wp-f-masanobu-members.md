# 制作プロセス デモ — 福岡正信自然農園（f-masanobu.jp）WordPress 会員制サイト・ログイン機能

> 一覧ページ（`/`）と再生ページ（`/watch/wp-f-masanobu-members`）から、シークバー付きのプレーヤーで見られます（`npm run dev` で起動）。詳しくは `../../README.md`。
> 動画のページ本体は `public/videos/wp-f-masanobu-members/`（`index.html` はブラウザで直接開いても再生できます）。
> 画面は Windows 11（タスクバー・ポインター・IME）で、長さは 5 分 44 秒です。

画面録画用のデモページです。Windows 11 のデスクトップを模した画面上でマウスカーソルが自動で動き、
福岡正信自然農園の公式サイト兼オンラインショップ（https://f-masanobu.jp/ 、WordPress ＋ WooCommerce）に
**会員登録・会員情報・マイページ・卸会員・会員限定ページの会員機能を作る工程** を順番に再生します。

**会員登録の設定 → 登録フォーム → 会員情報の管理 → マイページ → 卸会員（B2BKing） → 限定コンテンツ・権限 → 公開中のサイト**

## 最初に確認していただきたいこと

- f-masanobu.jp は **WordPress ＋ WooCommerce で運営されている実在の農園のサイト** です（テーマ `fmasanobu_shop`、マイアカウントは `/account/`、
  卸売り・B2B は B2BKing、定期便は WooCommerce Subscriptions、ほかに Japanized for WooCommerce 由来のよみがな項目など。公開ページの HTML から分かる範囲）。
  このデモは「このサイトの会員機能を作る」としたらどう進めるか、という **工程の再現** で、実際の制作作業の記録ではありません。
- **本物のもの**
  - ブラウザに出るサイト（開発サイト `localhost:8888` と本番 `f-masanobu.jp`。トップ・マイアカウント `/account/`・新規登録 `/account/?register=1`・
    商品「伊予柑マーマレード」・卸売りについて `/big-purchase`・404 ページ、PC 幅 1920px）は、公開中のサイトの画面をそのまま取り込んだものです（`js/site-snapshot.js`・`assets/site/`）。
    登録フォームの項目（`billing_last_name` … `billing_yomigana_*` … `birth_year` `birth_month` `birth_day` `gender`）と並び順・「新規登録はこちら」「ログインはこちら」の切り替えは公開サイトのものです。
  - WordPress の管理画面は **すべて本物の WordPress 7.1.4（WooCommerce 11.3.0・Japanized for WooCommerce 3.1.1・B2BKing 5.2.70）の画面** です（日本語。下の「WordPress の画面について」）。
    Members（3.3.2）は「プラグインを追加」から実際に検索・インストール・有効化したもので、日本語の翻訳も公式のものです。
  - 画面に出る操作は取り込みに使った WordPress で実際に行っています：アカウント作成の設定の保存、**公開サイトと同じ項目の登録フォームからの実際の会員登録**
    （テーマのコードがその WordPress で動いて保存したもの）、会員情報の表示（間違ったメタキー → 修正）、パーマリンク設定の保存（保存前の `/account/member-status/` は実際に 404）、
    B2BKing のグループ「卸会員」の作成・グループ価格・会員のグループ変更、Members の権限グループ「卸会員」の追加、固定ページのコンテンツの権限、会員への権限グループの追加。
  - 会員でログインしたときのマイアカウント（ダッシュボード・会員ステータス）、商品の卸価格、卸会員さま専用ページ（権限がないときの Members のメッセージ・権限があるときの本文）は、
    その WordPress に **テスト会員で実際にログインして** WooCommerce・B2BKing・Members が出力した HTML を、公開サイトの画面の中に入れたものです（`js/apps.js`）。
  - タブのタイトルとファビコン（テーマの `favicon.ico`）は公開サイトのものです。管理画面のタブは WordPress の既定のアイコン（サイトアイコン未設定）です。
- **再現のもの**
  - テーマのソース：f-masanobu.jp のテーマのソースは公開されていないため、VS Code に出るテーマ（`inc/account.php` `woocommerce/myaccount/form-login.php`
    `woocommerce/myaccount/member-status.php` など、`js/files.js`）は、公開サイトの登録フォームのマークアップ（項目の ID・クラス・`data-priority`、生年月日の `.birth_date_wrap`）
    を出力するように作ったものです。マイページの「会員ステータス」と卸会員さま専用ページ（`/wholesale/`）はデモ用の追加機能で、公開サイトにはありません（ページの文章は「卸売りについて」の文章から）。
  - 開発環境（wp-env、`.wp-env.json`・`package.json`）、作業の順番、3 つのミス（生年月日のメタキー・パーマリンク・権限グループ）。どれも WordPress で実際に起きる動きですが、実際の制作でこのミスがあったわけではありません。
  - 卸売り：公開サイトは B2BKing **Pro**（有料）です。デモは wordpress.org の無料版（B2BKing Core）で、グループ・グループ価格・ユーザーのグループの画面はその無料版のものです（英語の画面は翻訳がないため）。
    卸価格 ¥1,458 はデモ用の値です（公開サイトの卸売りは「数量に応じてお値引き、お問い合わせ」）。
  - 有料会員：公開サイトの定期便などに使われている WooCommerce Subscriptions は有料のため、デモでは使っていません。限定コンテンツは「卸会員」の権限グループ（Members のコンテンツの権限）で見せています。
  - 会員でログインしたときのヘッダーの表示（「マイページ」）は、公開サイトのログイン後の画面が見られないための再現です。
  - 会員・お客様（森田 由紀、カフェ こもれび、ほか 8 名）・住所・電話・メールアドレスは架空のもので、画面ではぼかしています。Chrome の自動入力の候補はデモ用に描いたものです。
- 個人情報：管理画面のユーザーは取り込み用の使い捨ての管理者（`admin`）です。公開サイトでの会員登録・ログイン・フォームの送信はしていません（公開ページを読み込んだだけです）。
- 福岡正信自然農園は実在の農園です。このデモはローカルのファイルとしてだけ使ってください（Web に公開しないでください）。

## 録画の手順

1. `public/videos/wp-f-masanobu-members/index.html` を **Google Chrome** で開く（ダブルクリックで可。サーバーは不要。`npm run dev` 中なら http://localhost:3000/videos/wp-f-masanobu-members/index.html でも可）
   - 準備に 5〜20 秒ほどかかります（WordPress の画面・サイトの画面・画像・フォントの先読み）。タイトル画面が出たら準備完了です
2. **F11** で全画面表示にする（推奨：1920×1080、ブラウザのズーム 100%）
3. 画面録画を開始する
4. **Space** キーで再生開始
5. 最後に「WordPress（WooCommerce）の会員機能：会員登録・会員情報・マイページ・卸会員・会員限定ページ」と出たら録画を停止

## 再生される内容

| STEP | 画面 | 内容 | ミスと修正 |
| --- | --- | --- | --- |
| 1 会員登録の設定 | VS Code・Chrome（開発サイト・管理画面） | README の要件 → 開発サイトの `/account/`（ログインフォームだけ）→ WooCommerce › 設定 › アカウントとプライバシーで「「マイアカウント」ページ上」をオン、「パスワードの設定リンクを送信」をオフ → 保存 → 「新規登録はこちら」→ WooCommerce 標準の登録フォーム（メール・パスワードだけ） | |
| 2 登録フォーム | VS Code・開発サイト | `inc/account.php` に項目の定義（請求先住所＋Japanized for WooCommerce のよみがな、生年月日・性別）を貼り付け、`woocommerce_register_form_start` のフックを入力、出力・必須チェック・保存のフックを追加 → F5 で公開サイトと同じ登録フォーム → テスト登録（姓名・よみがなを IME で入力、住所・電話は Chrome の自動入力、メール・パスワード・生年月日・性別）→ 登録してマイアカウントのダッシュボード | |
| 3 会員情報の管理 | VS Code・管理画面 | `show_user_profile` / `edit_user_profile` で「会員情報」（生年月日・性別）を入力 → ユーザー一覧 → 会員の編集画面 | **生年月日が「—」**：存在しないメタ `$user->birthday` を読んでいた（保存しているのは `birth_year` / `birth_month` / `birth_day`）→ 年・月・日をつなぐ式に直して F5 → 1986/4/12 |
| 4 マイページ | VS Code・開発サイト・管理画面 | `woocommerce_account_menu_items`（「会員ステータス」を追加、ダウンロードを外す）を入力、エンドポイント・タイトル・内容のフックと `woocommerce/myaccount/member-status.php` を追加 → マイページのメニューから「会員ステータス」 | **404**：新しいエンドポイント `/account/member-status/` がリライトルールにない → 設定 › パーマリンクで「変更を保存」→ 会員ステータス（一般会員） |
| 5 卸会員（B2BKing） | 管理画面・開発サイト | B2BKing › Groups → Create new customer group「卸会員」→ 公開 → 商品「伊予柑マーマレード」のグループ価格（卸会員 ¥1,458）→ 更新 → 会員の編集画面の Customer Group を「卸会員」に → 更新 → 会員で商品ページ（卸価格）・会員ステータス（卸会員） | |
| 6 限定コンテンツ・権限 | 管理画面・開発サイト | プラグインを追加で「Members」を検索 → インストール → 有効化 → Members › Roles → Add New Role（「卸会員」、スラッグ `wholesale_member`、権限 Read）→ 固定ページ「卸会員さま専用ページ」の Content Permissions (Members) で「卸会員」→ 公開 → 会員で `/wholesale/` | **閲覧できない**：Members の「Sorry, but you do not have permission to view this content.」— B2BKing のグループと WordPress の権限グループは別で、会員の権限グループは「顧客」のまま → 会員の編集画面で権限グループに「卸会員」を追加（Members で複数の権限グループ）→ 更新 → ページが表示される |
| 公開中のサイト | Chrome | f-masanobu.jp のトップ → ヘッダーの「ログイン・登録」→ マイアカウント → 「新規登録はこちら」→ 登録フォーム → 卸売りについて | |

## 本番サイトとの同一性について

- **公開サイトの画面**：トップ・マイアカウント・新規登録・商品「伊予柑マーマレード」・卸売りについて・404 ページは、公開ページを PC 幅で取り込んだものです（`npm run snapshot -- wp-f-masanobu-members`。画像は WebP、幅は最大 1920px）。
- **開発サイトとして見せている状態**（`js/apps.js`）：
  - `noRegister`（「新規登録はこちら」を隠す）・`registerPlain`（テーマの項目を隠した WooCommerce 標準の登録フォーム）は、取り込んだ公開ページに CSS を足したものです。
  - ログイン中のマイアカウント・会員ステータス・商品の卸価格・卸会員さま専用ページの中身は、取り込みに使った WordPress でテスト会員としてログインして出力された HTML です（WooCommerce・B2BKing・Members の本物の出力）。
    公開サイトのテーマにはログイン後のマイアカウントの見た目が取り込めないため、ナビゲーションと表の並べ方の CSS はデモ用に足しています（サイトの色・罫線に合わせたもの）。
  - 一般会員のときの会員ステータスは、テーマのテンプレート（`member-status.php`）のもう一方の分岐の出力（卸会員の出力から作ったもの）です。
  - 卸会員さま専用ページは、公開サイトの「卸売りについて」のページの枠に、その WordPress のページの中身を入れています。
- **管理画面**：WordPress Playground で動かした本物の WordPress の画面を取り込んだものです（`tools/snapshots/wp-f-masanobu-members/capture-wp.js`）。

## 演出であるもの

- 作業の順番・3 つのミス・テスト会員（森田 由紀／カフェ こもれび、ほか 8 名のお客様）・住所・電話・メールアドレス・パスワード・卸価格 ¥1,458・Chrome の自動入力の候補。
- 管理画面の取り込みでのテスト会員のログイン：登録直後は WooCommerce が実際にログインさせた状態をそのまま使いました。その後の 2 回は、取り込み用のブラウザでマイアカウントのログインフォームからのログインが完了しなかったため、WordPress 自身の `wp_set_auth_cookie` でその会員としてログインして画面を出力しています（出力される内容は同じです）。
- 取り込み用の WordPress では、Japanized for WooCommerce の宣伝のお知らせ（Paidy など）を非表示にし（取り込みスクリプトの mu-plugin とデモ側の非表示）、B2BKing の CRM Hub の Gravatar（`d=404`、画像なし）は透明の画像にしています。
- 時刻：管理画面の日付・時刻は動画の日付（2026/11/11）とタスクバーの時刻に合わせています（`tools/wp/playground.js`）。
- 会員でログインしたときの公開サイトのヘッダーの「マイページ」表示。

## 画面の環境

- Windows 11（タスクバーの日付 2026/11/11、開始 13:20）、Google Chrome、VS Code（Dark Modern）。テーマの PHP は WordPress のコーディング規約どおりタブでインデントしています。
- 管理画面：WordPress 7.1.4（PHP 8.3、日本語）、WooCommerce 11.3.0、Japanized for WooCommerce 3.1.1（よみがな：有効・必須）、B2BKing Core 5.2.70（wordpress.org の無料版）、Members 3.3.2（日本語の翻訳がないため英語の画面）。
- 開発サイトのアドレスは `http://localhost:8888`（wp-env）、本番は `https://f-masanobu.jp`。

## ファイル

- `public/videos/wp-f-masanobu-members/`：`index.html`、`css/video.css`（Chrome の自動入力）、`js/config.js`、`js/files.js`（テーマ）、`js/apps.js`（状態・入力・ぼかし）、`js/scenario.js`、`js/site-snapshot.js`・`assets/site/`（公開サイト）、`js/wp-snapshot.js`・`assets/wp/`（管理画面 29 画面）
- `tools/snapshots/wp-f-masanobu-members/capture-wp.js`（管理画面の取り込み：`node tools/snapshots/wp-f-masanobu-members/capture-wp.js` → `node tools/webp.js wp-f-masanobu-members`）
- 公開サイトの取り込み：`npm run snapshot -- wp-f-masanobu-members`
