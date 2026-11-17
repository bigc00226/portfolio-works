/*
 * はらいろ整骨院（harairo.com）・へいわじま整骨院（heiwajima-seikotsuin.com）— WordPress の既存ページの修正
 * （public/shared/kit/dom.js が読む設定）
 */
window.VIDEO = {
  id: 'wp-seikotsuin-fixes',
  title: 'はらいろ整骨院・へいわじま整骨院 — WordPress 既存ページの修正 デモ',
  start: '2026-10-30T14:06',
  open: 'code', active: 'code',
  pins: 'explorer edge chrome:browser vscode:code',
  steps: ['依頼の確認', 'メニュー・予約リンクの追加', 'フッター・説明文の修正', '診療時間の修正', 'スマホ表示の調整'],
  intro: {
    kicker: 'WordPress 保守 — 既存ページの修正',
    brand: 'はらいろ整骨院 / へいわじま整骨院',
    sub: '2 つの整骨院サイトの修正依頼をまとめて対応',
    url: 'harairo.com ・ heiwajima-seikotsuin.com',
    steps: ['依頼の確認', '施術メニューと予約リンクの追加（HTML・CSS）', 'フッターの表記・検索結果の説明文', '診療時間の表記の修正', 'スマホ表示の崩れの調整'],
  },
  store: { name: '朝霞市 はらいろ整骨院', handle: 'harairo', domain: 'harairo.com', initials: 'は', avatar: '#9fd18b' },
  project: { name: 'maintenance', path: 'C:\\dev\\maintenance' },
  // the two live sites are captured by tools/snapshots/wp-seikotsuin-fixes/update-snapshot.js (npm run snapshot -- wp-seikotsuin-fixes)
  snapshot: {
    css: '#fixbtn, #fixbtnPc { transition: none !important; }',
  },
};
