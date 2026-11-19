import Image from 'next/image';

/* THE PROCESS: the four stages every video records, with their pictures (public/site/img/flow-1…4.webp).
   The line behind the step numbers draws itself when the row scrolls into view. */
const STEPS = [
  { title: 'ヒアリング・設計', color: '#5b8cff', text: 'ご依頼の内容と現状のサイト・管理画面を確かめ、ページ構成や必要な機能を整理します。', rec: '依頼メモや現状の確認から、そのまま録画しています。' },
  { title: 'デザイン', color: '#a78bfa', text: '配色・レイアウト・テーマを決め、PC とスマートフォンの画面を形にします。', rec: 'デザインツールやテーマの設定画面での作業も収録。' },
  { title: '実装', color: '#22d3ee', text: 'コード・管理画面の設定・プラグインで、決めた内容を実際に動かします。', rec: '入力の一文字ずつ、途中のミスとその修正まで見えます。' },
  { title: '確認・公開', color: '#34d399', text: '表示や動作、テスト注文・送信を確かめてから、本番に反映します。', rec: '公開後のチェックまでを収録しています。' },
];

export function Flow() {
  return (
    <section className="section flow" id="flow">
      <div className="container">
        <div className="sec-head center" data-reveal="">
          <p className="sec-eyebrow">THE PROCESS</p>
          <h2>動画に収録している工程</h2>
          <p>どの動画も、ご依頼の確認から公開後のチェックまでを、途中を省かずに録画しています。</p>
        </div>
        <div className="flow-grid" data-reveal="none">
          <span className="flow-line" aria-hidden="true"><i /></span>
          {STEPS.map((s, i) => (
            <article key={s.title} className="step spot" data-reveal="" style={{ '--c': s.color, '--d': i + 1 } as React.CSSProperties}>
              <span className="step-no">{String(i + 1).padStart(2, '0')}</span>
              <div className="step-art"><Image src={`/site/img/flow-${i + 1}.webp`} alt="" fill sizes="(max-width: 760px) 90vw, (max-width: 1100px) 45vw, 280px" /></div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <p className="rec-note">{s.rec}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
