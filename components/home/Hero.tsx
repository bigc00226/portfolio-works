import Image from 'next/image';
import type { VideoEntry } from '@/lib/registry';
import { Arrow, Play } from './icons';
import { Showreel } from './Showreel';

/* Hero: the claim (lines rise in one by one), the two ways in, the numbers (counted up by Motion.tsx) and the showreel.
   Behind it: the studio picture (public/site/img/hero-art.webp), drifting aurora light, a slow grid and film grain. */
export function Hero({ videos, stats, cats }: { videos: VideoEntry[]; stats: [string, number, string][]; cats: { label: string; color: string; n: number }[] }) {
  const d = (n: number) => ({ '--d': n }) as React.CSSProperties;
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true">
        <Image className="hero-art" src="/site/img/hero-art.webp" alt="" fill priority sizes="100vw" />
        <span className="aurora a1" /><span className="aurora a2" /><span className="aurora a3" />
        <span className="hero-lines" />
        <span className="grain" />
      </div>
      <div className="container hero-in">
        <div className="hero-copy">
          <p className="eyebrow rise" style={d(0)}><span className="rec"><i />REC</span>PROCESS PORTFOLIO</p>
          <h1>
            <span className="ln"><span style={d(0)}>仕上がりだけでなく、</span></span>
            <span className="ln"><span style={d(1)}>つくる<em>過程</em>まで。</span></span>
          </h1>
          <p className="h1-sub rise" style={d(3)}>制作の一部始終を録画した、動画のポートフォリオ</p>
          <p className="lead rise" style={d(4)}>
            制作実績は、URL やスクリーンショットでご紹介するのが一般的です。けれど、それだけでは「どのように考え、どのように作っているか」までは伝わりません。
            そこで私は、<strong>お客様に最大限ご安心いただいたうえでご依頼いただけるよう、デザインから実装・確認・公開までの作業過程を動画で録画し</strong>、ここに掲載しました。
          </p>
          <div className="cta rise" style={d(5)}>
            <a className="btn btn-primary" href="#special" data-go="special"><Play />制作動画を見る</a>
            <a className="btn btn-ghost" href="#demo" data-go="demo">デモ・ゲームを触ってみる<Arrow /></a>
          </div>
          <dl className="stats rise" style={d(6)}>
            {stats.map(([k, n, u]) => (
              <div key={k}><dt>{k}</dt><dd><b data-count={n}>{n}</b>{u}</dd></div>
            ))}
          </dl>
        </div>
        <div className="hero-reel rise" style={d(3)}>
          {videos.length > 0 && (
            <Showreel
              items={videos.map((v) => ({ id: v.id, title: v.title, meta: `${v.tool} ・ ${v.client}`, url: v.url, duration: v.duration }))}
              chips={cats}
            />
          )}
        </div>
      </div>
      <a className="scroll-cue" href="#why" aria-label="下へスクロール"><span />SCROLL</a>
    </section>
  );
}
