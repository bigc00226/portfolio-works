/*
 * 一覧ページのタブ（見出し・説明はここで編集します）
 *
 *   special   すべての制作動画（content/videos.ts）
 *   general / demo / game   content/sites.ts の links / demos / games
 *   isNew     タブに NEW のバッジを付けます
 *   num       サイトのカードの番号の前に付く文字（WORK 01 …）
 *   hint      見出しの横に出す操作のヒント（そのタブに掲載があるときだけ）
 *   empty     掲載がないときに出す文面
 */
import type { Tab } from '../lib/types';

export const tabs: Tab[] = [
  {
    key: 'special', label: '特別', en: 'SPECIAL', icon: 'spark', isNew: true, title: '制作過程の動画',
    lead: 'デザインから実装・確認・公開まで、制作の一部始終を録画しました。サムネイルをクリックすると再生ページが開き、チャプターを選ぶとその場面から再生します。',
  },
  {
    key: 'general', label: '一般', en: 'WORKS', icon: 'link', title: '制作実績', num: 'WORK',
    lead: 'これまでに制作し、公開しているサイトとシステムです。プレビューをクリックすると、このページの中で実際のサイトをそのまま操作できます（PC / スマホ表示の切り替えも可能）。',
    hint: 'プレビューにマウスを乗せると、トップページ全体をスクロール表示',
  },
  {
    key: 'demo', label: 'デモ', en: 'LIVE DEMO', icon: 'demo', title: '公開中のデモ', num: 'DEMO',
    lead: '実際に公開しているデモサイトです。プレビューをクリックすると、このページの中でそのまま操作できます（PC / スマホ表示の切り替えも可能）。',
    hint: 'プレビューにマウスを乗せると、トップページ全体をスクロール表示',
  },
  {
    key: 'game', label: 'ゲーム', en: 'GAME', icon: 'game', title: 'ゲーム', num: 'GAME',
    lead: '将棋・花札・麻雀・百人一首から、パズル・アクション・RPG・ノベルまで、日本で親しまれている遊びを 20 本、ブラウザで遊べるゲームとして制作しました。プレビューをクリックすると、このページの中でそのまま遊べます（PC / スマホ表示の切り替えも可能）。イラストの一部は、現在は仮の画像（画像サンプル）です。',
    hint: 'プレビューをクリックすると、このページの中で遊べます',
    empty: { title: '現在、掲載しているゲームはありません', text: '公開できるゲームができしだい、こちらに追加します。' },
  },
];
