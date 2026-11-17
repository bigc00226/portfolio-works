import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { videos, getVideo } from '@/lib/registry';
import { Player } from '@/components/player/Player';

export const generateStaticParams = () => videos.map((v) => ({ id: v.id }));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = getVideo((await params).id);
  return { title: v ? `${v.title} — 制作プロセス` : '制作プロセス', description: v?.summary };
}

/** /watch/<id>?t=<seconds>&autoplay=1&captions=0 */
export default async function WatchPage({ params }: Props) {
  const v = getVideo((await params).id);
  if (!v) redirect('/#special');
  return (
    <Player
      video={{ id: v.id, title: v.title, client: v.client, tool: v.tool }}
      duration={v.duration}
      chapters={v.chapterList.map((c) => ({ t: c.t, title: c.name }))}
      others={videos.filter((x) => x.id !== v.id).map((x) => ({ id: x.id, title: x.title }))}
    />
  );
}
