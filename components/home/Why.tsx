import { Arrow, Check, Link, Minus, Picture, PlayGlyph, Spark1 } from './icons';

/* WHY VIDEO: the usual way to show work (URL + screenshots) next to this portfolio (a recording of the whole process). */
export function Why({ shot }: { shot: string | null }) {
  return (
    <section className="section" id="why">
      <div className="container">
        <div className="sec-head">
          <p className="sec-eyebrow">WHY VIDEO</p>
          <h2>URL とスクリーンショットだけでは、<br />伝わらないことがあります。</h2>
        </div>
        <div className="compare">
          <div className="cmp cmp-usual">
            <p className="cmp-label">一般的な実績紹介</p>
            <div className="mock" aria-hidden="true">
              <div className="mu-url"><Link />https://www.example.com</div>
              <div className="mu-shots"><span><Picture /></span><span><Picture /></span><span><Picture /></span></div>
            </div>
            <ul>
              <li><Minus />完成したページの URL</li>
              <li><Minus />数枚のスクリーンショット</li>
              <li><Minus />伝わるのは「仕上がり」だけ</li>
            </ul>
          </div>
          <div className="cmp-arrow" aria-hidden="true"><span><Arrow /></span></div>
          <div className="cmp cmp-ours">
            <p className="cmp-label"><Spark1 />このポートフォリオ</p>
            <div className="mock" aria-hidden="true">
              <div className="mo-screen" style={shot ? { backgroundImage: `url("${shot}")` } : undefined}>
                <span className="rec"><i />REC</span>
                <span className="reel-play"><PlayGlyph /></span>
              </div>
              <div className="mo-bar">
                <span className="on" style={{ '--f': 2 } as React.CSSProperties}>設計</span>
                <span className="on" style={{ '--f': 3 } as React.CSSProperties}>デザイン</span>
                <span className="on" style={{ '--f': 4 } as React.CSSProperties}>実装</span>
                <span style={{ '--f': 2 } as React.CSSProperties}>確認</span>
                <span style={{ '--f': 1.5 } as React.CSSProperties}>公開</span>
              </div>
            </div>
            <ul>
              <li><Check />デザインから公開までの作業を、画面ごと録画</li>
              <li><Check />ツールの使い方・段取り・確認の手順まで見える</li>
              <li><Check />途中の修正や、公開後のチェックも収録</li>
              <li><Check />公開中のデモサイトは、このページで操作できる</li>
            </ul>
          </div>
        </div>
        <p className="why-note">ご依頼のあと、制作がどのように進むのか。<br />その様子を、ご依頼の前にそのままご確認いただけます。</p>
      </div>
    </section>
  );
}
