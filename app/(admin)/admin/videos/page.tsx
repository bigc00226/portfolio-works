/* /admin/videos — every video: interest on the list page, plays, how far viewers watched. */
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/server/auth';
import { videoTable } from '@/lib/server/stats';
import { filters, type Search } from '@/lib/server/params';
import { Shell, PageHead } from '@/components/admin/Shell';
import { FilterBar } from '@/components/admin/ui';
import { VideoOverview } from '@/components/admin/VideoViews';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '動画' };

export default async function VideosPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { range, bots, qs, ranges } = await filters(searchParams);
  const rows = videoTable(range, bots);
  return (
    <Shell active="videos" qs={qs}>
      <PageHead title="動画" sub={`${rows.length} 本の動画の${range.label}の視聴状況`}>
        <FilterBar path="/admin/videos" ranges={ranges} range={range.key} bots={bots} />
      </PageHead>
      <VideoOverview rows={rows} qs={qs} />
    </Shell>
  );
}
