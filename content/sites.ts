/*
 * 一覧ページの「一般」「デモ」「ゲーム」タブに並べるサイト（タブの見出し・説明は content/tabs.ts）
 *
 *   id        プレビュー画像のファイル名（public/thumbs/sites/<id>-pc.webp / -full.webp / -sp.webp）。3 つのタブを通して重ならない名前に
 *   url       サイトの URL（カードのプレビューをクリックすると、このページの中で開きます）
 *   name / title / summary / tags / stack   カードの見出し・説明・タグ・使用技術
 *   accent    カードの背景のアクセント色
 *   logoFrom  （任意）ファビコンがフレームワークの初期アイコンのとき、代わりにカードに使うヘッダーの SVG の CSS セレクター
 *   note      （任意）カードに添える注意書き（ログインが必要、など）
 *
 * 追加したら `npm run capture -- <id>` でプレビュー画像・ファビコンを撮影します（撮影日などは generated/captures.json に自動で記録）。
 */
import type { Site } from '../lib/types';

/** 一般：これまでに制作し、公開しているサイトとシステム */
export const links: Site[] = [
  {
    id: 'car-rent-sakuragroup',
    url: 'https://car-rent.sakuragroup.jp/',
    name: 'さくらレンタカー',
    title: 'レンタカー管理システム（社内向け業務システム）',
    summary: '車両・貸出・請求の進捗を、スマートフォン中心の画面でひとつにまとめて管理する社内システム。予約 → 配車 → 返却と車両ステータスの連動、日額 × 日数の自動計算、請求書 PDF の発行、点検・車検のリマインド、稼働率表まで。',
    tags: ['車両管理', '予約・配車・返却', '請求書 PDF', '稼働率表'],
    stack: ['Next.js', 'Supabase'],
    accent: '#2c6cb6',
    note: '社内システムのため、公開しているのはログイン画面までです',
  },
  {
    id: 'the-sanctuary',
    url: 'https://the-sanctuary.jp/',
    name: 'THE SANCTUARY',
    title: '完全会員制のオンラインヒーリングサロン',
    summary: 'ヒーラーと 1 対 1 のビデオ通話でセッションを受けられる、店舗を持たない完全会員制のサロン。入会の審査とお支払い、ご予約と事前決済、キャンセル時の自動返金、ビデオ通話のお部屋と美肌フィルター、カルテ、記事・メール配信、管理画面まで。',
    tags: ['入会審査・月会費', '予約・事前決済', 'ビデオ通話', '管理画面'],
    stack: ['Next.js', 'Supabase', 'Stripe'],
    accent: '#b08d57',
  },
  {
    id: 'the-sanctuary-screens',
    url: 'https://the-sanctuary-screens.vercel.app/',
    name: 'THE SANCTUARY 画面一覧',
    title: 'the-sanctuary.jp の全画面を収録した一覧',
    summary: '上の「THE SANCTUARY」の Web システムの画面を、公開ページ・マイページ・ご予約・ヒーラー画面・管理画面など 6 つの領域に分けて、PC とスマートフォンで全 422 枚収録。ログインが必要な画面も含めて、すべてご覧いただけます。',
    tags: ['全 422 画面', '6 つの領域', 'PC / スマホ', '絞り込み・検索'],
    stack: ['Next.js', 'Vercel'],
    accent: '#b08d57',
  },
];

/** デモ：公開中のデモサイト */
export const demos: Site[] = [
  {
    id: 'online-healing-salon',
    url: 'https://online-healing-salon.vercel.app/',
    name: 'LUMINA',
    title: '会員制オンラインヒーリングサロン',
    summary: 'ヒーラーと 1 対 1 のオンラインセッションを、入会審査・予約・決済・ビデオ通話・その場での延長決済まで、ひとつのサイトで完結させる会員制サロン。',
    tags: ['会員登録・審査', '予約カレンダー', 'カード決済', 'ビデオセッション'],
    stack: ['Next.js', 'Vercel'],
    accent: '#6b5b95',
    logoFrom: 'header a[aria-label] svg',
  },
  {
    id: 'android-automation-browser',
    url: 'https://android-automation-browser.vercel.app/',
    name: 'FixView Browser',
    title: 'Android 自動化向けブラウザ（Web デモ）',
    summary: '機種や文字サイズの設定が違っても、表示エリアを同じピクセル座標に固定するブラウザ。端末シミュレーターと座標インスペクターで、その仕組みを確かめられます。',
    tags: ['端末シミュレーター', 'マルチプロファイル', '座標インスペクター', 'px / dp 固定'],
    stack: ['Next.js', 'Vercel'],
    accent: '#2558e4',
  },
  {
    id: 'pitch-lab-app',
    url: 'https://pitch-lab-app.vercel.app/',
    name: 'PitchLab',
    title: '投手のためのオンライン指導アプリ',
    summary: '学生投手が投球動画を送り、コーチが秒単位で添削。質問チャット・成長記録・オンライン指導までを、選手用と指導者用の 2 つの画面で使えるスマホ向けアプリ。',
    tags: ['動画添削', '質問チャット', '成長記録', '選手 / 指導者'],
    stack: ['Next.js', 'Vercel'],
    accent: '#ff6b35',
  },
  {
    id: 'gacha-point-platform',
    url: 'https://gacha-point-platform.vercel.app/',
    name: 'ポイガチャ',
    title: 'ポイ活 × オリパ風 Web ガチャ',
    summary: '動画視聴・アンケート・アプリ導入でチケットを貯めて、オリパ風の Web ガチャに挑戦できる会員制エンタメサイト。当選速報・ラストワン賞・ポイント交換・ミニゲームまで。',
    tags: ['Web ガチャ', 'チケット / ポイント', 'ラストワン賞', 'ミニゲーム'],
    stack: ['Next.js', 'Vercel'],
    accent: '#f5b301',
  },
];

/** ゲーム：現時点では掲載するデータがありません（タブには「データがありません」と表示されます） */
export const games: Site[] = [];
