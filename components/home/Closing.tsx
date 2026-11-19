import Image from 'next/image';
import { paths } from '@/lib/paths';
import { Arrow, Play } from './icons';

/* The closing band: one invitation to watch a whole video, over the light-trail picture (public/site/img/cta-bg.webp). */
export function Closing({ latest }: { latest: { id: string; title: string } | null }) {
  return (
    <section className="closing" aria-labelledby="closingTitle">
      <div className="container">
        <div className="closing-in" data-reveal="zoom">
          <Image src="/site/img/cta-bg.webp" alt="" fill sizes="(max-width: 1240px) 100vw, 1240px" />
          <span className="rec"><i />REC</span>
          <h2 id="closingTitle">ご依頼の前に、<br />まずは 1 本ご覧ください。</h2>
          <p>どのように確認し、どのように作り、どのように仕上げるのか。動画の中の作業は、ご依頼いただいたあとの進め方そのままです。</p>
          <div className="cta">
            {latest && <a className="btn btn-primary" href={paths.watch(latest.id)}><Play />最新の制作動画を見る</a>}
            <a className="btn btn-ghost" href="#special" data-go="special">動画の一覧へ<Arrow /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
