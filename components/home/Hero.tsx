import type { VideoEntry } from '@/lib/registry';
import { Arrow, Play } from './icons';
import { Showreel } from './Showreel';

export function Hero({ videos, stats }: { videos: VideoEntry[]; stats: [string, number, string][] }) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <p className="eyebrow"><span className="rec"><i />REC</span>PROCESS PORTFOLIO</p>
          <h1>仕上がりだけでなく、<br /><em>つくる過程</em>まで。</h1>
          <p className="h1-sub">制作の一部始終を録画した、動画のポートフォリオ</p>
          <p className="lead">
            制作実績は、URL やスクリーンショットでご紹介するのが一般的です。けれど、それだけでは「どのように考え、どのように作っているか」までは伝わりません。<br />
            そこで私は、<strong>お客様に最大限ご安心いただいたうえでご依頼いただけるよう、デザインから実装・確認・公開までの作業過程を動画で録画し</strong>、ここに掲載しました。
          </p>
          <div className="cta">
            <a className="btn btn-primary" href="#special" data-go="special"><Play />制作動画を見る</a>
            <a className="btn btn-ghost" href="#demo" data-go="demo">デモを触ってみる<Arrow /></a>
          </div>
          <dl className="stats">
            {stats.map(([k, n, u]) => (
              <div key={k}><dt>{k}</dt><dd><b>{n}</b>{u}</dd></div>
            ))}
          </dl>
        </div>
        <div className="reel">
          {videos.length > 0 && (
            <Showreel items={videos.map((v) => ({ id: v.id, title: v.title, meta: `${v.tool} ・ ${v.client}`, duration: v.duration }))} />
          )}
        </div>
      </div>
    </section>
  );
}
