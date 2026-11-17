import { videos, sites, tabs, captureRange } from '@/lib/registry';
import { paths, jdate } from '@/lib/paths';
import { webpSize } from '@/lib/image-size';
import { Header } from '@/components/home/Header';
import { Hero } from '@/components/home/Hero';
import { ToolsStrip } from '@/components/home/ToolsStrip';
import { Why } from '@/components/home/Why';
import { Library, type SiteCard } from '@/components/home/Library';
import { Footer } from '@/components/home/Footer';

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
  return (
    <>
      <Header />
      <main id="top">
        <Hero
          videos={videos}
          stats={[
            ['制作動画', videos.length, '本'],
            ['総収録時間', totalMin, '分'],
            ['制作実績', sites.general.length, '件'],
            ['公開デモ', sites.demo.length, 'サイト'],
          ]}
        />
        <ToolsStrip tools={toolNames()} />
        <Why shot={videos[0] ? paths.thumb(videos[0].id) : null} />
        <Library
          tabs={tabs}
          videos={videos}
          sites={{ general: sites.general.map(card), demo: sites.demo.map(card), game: sites.game.map(card) }}
        />
      </main>
      <Footer note={range ? `制作実績・デモのプレビュー画像は ${from === to ? from : `${from}〜${to}`} 時点の画面です。` : ''} />
    </>
  );
}
