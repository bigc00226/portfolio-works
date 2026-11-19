import Image from 'next/image';
import { Arrow, Check, Minus, PlayGlyph, Spark1 } from './icons';

/* WHY VIDEO: the usual way to show work (URL + screenshots) next to this portfolio (a recording of the whole process).
   The phase bar of the right card fills step by step when it scrolls into view (home.css .in .mo-bar). */
const PHASES: [string, number][] = [['設計', 2], ['デザイン', 3], ['実装', 4], ['確認', 2], ['公開', 1.5]];

export function Why({ shot }: { shot: string | null }) {
  return (
    <section className="section why" id="why">
      <div className="container">
        <div className="sec-head" data-reveal="">
          <p className="sec-eyebrow">WHY VIDEO</p>
          <h2>URL とスクリーンショットだけでは、<br className="pc-br" />伝わらないことがあります。</h2>
        </div>
        <div className="compare">
          <div className="cmp cmp-usual" data-reveal="left">
            <p className="cmp-label">一般的な実績紹介</p>
            <div className="cmp-art"><Image src="/site/img/why-static.webp" alt="" fill sizes="(max-width: 1100px) 92vw, 460px" /></div>
            <ul>
              <li><Minus />完成したページの URL</li>
              <li><Minus />数枚のスクリーンショット</li>
              <li><Minus />伝わるのは「仕上がり」だけ</li>
            </ul>
          </div>
          <div className="cmp-arrow" aria-hidden="true" data-reveal="zoom" style={{ '--d': 2 } as React.CSSProperties}><Arrow /></div>
          <div className="cmp cmp-ours" data-reveal="right" style={{ '--d': 1 } as React.CSSProperties}>
            <p className="cmp-label"><Spark1 />このポートフォリオ</p>
            <div className="mock" aria-hidden="true">
              <div className="mo-screen" style={shot ? { backgroundImage: `url("${shot}")` } : undefined}>
                <span className="rec"><i />REC</span>
                <span className="reel-play"><PlayGlyph /></span>
              </div>
              <div className="mo-bar">
                {PHASES.map(([label, f], k) => <span key={label} style={{ '--f': f, '--k': k } as React.CSSProperties}>{label}</span>)}
              </div>
            </div>
            <ul>
              <li><Check />デザインから公開までの作業を、画面ごと録画</li>
              <li><Check />ツールの使い方・段取り・確認の手順まで見える</li>
              <li><Check />途中の修正や、公開後のチェックも収録</li>
              <li><Check />公開中のデモサイトとゲームは、このページで操作できる</li>
            </ul>
          </div>
        </div>
        <p className="why-note" data-reveal="">ご依頼のあと、制作がどのように進むのか。<br />その様子を、ご依頼の前にそのままご確認いただけます。</p>
      </div>
    </section>
  );
}
