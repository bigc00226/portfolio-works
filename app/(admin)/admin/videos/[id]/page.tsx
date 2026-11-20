/* /admin/videos/<id> — one video: retention, the chapter viewers stopped in, and who watched it. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/server/auth';
import { videoReport } from '@/lib/server/stats';
import { filters, type Search } from '@/lib/server/params';
import { fmtClockLen } from '@/lib/admin-format';
import { Shell, PageHead } from '@/components/admin/Shell';
import { FilterBar } from '@/components/admin/ui';
import { VideoDetail } from '@/components/admin/VideoViews';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '動画の詳細' };

export default async function VideoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  await requireAdmin();
  const id = decodeURIComponent((await params).id);
  const { range, bots, qs, ranges } = await filters(searchParams);
  const r = await videoReport(id, range, bots);
  if (!r) notFound();
  return (
    <Shell active="videos" qs={qs}>
      <PageHead title={r.video.title} crumb={{ href: `/admin/videos${qs}`, label: '動画' }}
        sub={<>{r.video.tool}・{fmtClockLen(r.video.duration)}・<a className="tp-link" href={`/watch/${encodeURIComponent(r.video.id)}`} target="_blank" rel="noopener">再生ページを開く</a></>}>
        <FilterBar path={`/admin/videos/${encodeURIComponent(id)}`} ranges={ranges} range={range.key} bots={bots} />
      </PageHead>
      <VideoDetail r={r} hourly={range.hourly} />
    </Shell>
  );
}
