import { videos, sites, tabs, captureRange } from '@/lib/registry';
import { paths, jdate } from '@/lib/paths';
import { webpSize } from '@/lib/image-size';
import { Header } from '@/components/home/Header';
import { Hero } from '@/components/home/Hero';
import { ToolsStrip } from '@/components/home/ToolsStrip';
import { Why } from '@/components/home/Why';
import { Flow } from '@/components/home/Flow';
import { Library, type SiteCard, type VideoCat } from '@/components/home/Library';
import { Closing } from '@/components/home/Closing';
import { Footer } from '@/components/home/Footer';
import { Motion } from '@/components/home/Motion';
import { PLATFORMS, platformOf } from '@/lib/platforms';

/** every tool name once, in the order the videos were made, then the sites' stacks */
function toolNames() {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (t: string) => { t = t.trim(); if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push(t); } };
  const chrono = [...videos].reverse();
  chrono.forEach((v) => v.tool.split('/').forEach(add));
  chrono.forEach((v) => v.tags.filter((t) => /^[A-Za-z]/.test(t) && t !== 'CMS' && !/ API$/.test(t)).forEach(add));
  Object.values(sites).flat().forEach((s) => s.stack.forEach(add));
  return out;
}

// the platform of a video (the filter of the 特別 tab): lib/platforms.ts; platforms without videos are not shown

/** a site card with the size of its whole-page preview (the hover scroll runs longer on longer pages) */
const card = (s: (typeof sites)['general'][number]): SiteCard => {
  const full = webpSize(paths.siteShot(s.id, 'full')) ?? { width: 1440, height: 2400 };
  const r = full.height / full.width;
  return { ...s, full, scrollSec: Math.min(8, Math.max(2.4, (r - 0.625) * 4)) };
};

export default function Home() {
  const totalMin = Math.round(videos.reduce((s, v) => s + v.duration, 0) / 60000);
  const range = captureRange();
  const from = range && jdate(range[0]), to = range && jdate(range[1]);
  const catOf = Object.fromEntries(videos.map((v) => [v.id, platformOf(v.tool)]));
  const cats: VideoCat[] = PLATFORMS.map(({ key, label, color }) => ({ key, label, color, n: videos.filter((v) => catOf[v.id] === key).length })).filter((c) => c.n > 0);
  return (
    <>
      <Header />
      <main>
        <Hero
          videos={videos}
          cats={[...cats].filter((c) => c.key !== 'other').sort((a, b) => b.n - a.n)}
          stats={[
            ['制作動画', videos.length, '本'],
            ['総収録時間', totalMin, '分'],
            ['公開中のサイト', sites.general.length + sites.demo.length, '件'],
            ['ゲーム', sites.game.length, '本'],
          ]}
        />
        <ToolsStrip tools={toolNames()} />
        <Why shot={videos[0] ? paths.thumb(videos[0].id) : null} />
        <Flow />
        <Library
          tabs={tabs}
          videos={videos}
          cats={cats}
          catOf={catOf}
          sites={{ general: sites.general.map(card), demo: sites.demo.map(card), game: sites.game.map(card) }}
        />
        <Closing latest={videos[0] ? { id: videos[0].id, title: videos[0].title } : null} />
      </main>
      <Footer note={range ? `制作実績・デモ・ゲームのプレビュー画像は ${from === to ? from : `${from}〜${to}`} 時点の画面です。` : ''} />
      <Motion />
    </>
  );
}
