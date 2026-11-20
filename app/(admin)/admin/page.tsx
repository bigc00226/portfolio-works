/* /admin — the dashboard: who visited the portfolio, what they opened and which videos they watched. */
import type { Metadata } from 'next';
import { requireAdmin, isInitialPassword } from '@/lib/server/auth';
import { dashboard } from '@/lib/server/stats';
import { filters, type Search } from '@/lib/server/params';
import { fmtDateTime, fmtN } from '@/lib/admin-format';
import { Shell, PageHead } from '@/components/admin/Shell';
import { FilterBar, AutoRefresh } from '@/components/admin/ui';
import { Dashboard } from '@/components/admin/Dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ダッシュボード' };

export default async function AdminHome({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { range, bots, qs, ranges } = await filters(searchParams);
  const d = dashboard(range, bots);
  return (
    <Shell active="dash" qs={qs}>
      <AutoRefresh />
      <PageHead title="ダッシュボード" sub={<>{fmtDateTime(range.from)} 〜 {fmtDateTime(range.to)}（{range.label}）・30 秒ごとに更新</>}>
        <FilterBar path="/admin" ranges={ranges} range={range.key} bots={bots} />
      </PageHead>
      {isInitialPassword() && (
        <div className="ad-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></svg>
          パスワードが初期設定のままです。ほかの人に見られないよう、変更してください。
          <a href="/admin/settings">パスワードを変更</a>
        </div>
      )}
      {d.totals.views === 0 && (
        <div className="ad-banner info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
          まだアクセスの記録がありません。サイト（トップページ・再生ページ）が開かれると、ここに集計されます。
        </div>
      )}
      <Dashboard d={d} rangeLabel={range.label} hourly={range.hourly} />
      <p className="ad-hint" style={{ marginTop: 18 }}>
        記録の合計：訪問者 {fmtN(d.totals.visitors)} 人・ページビュー {fmtN(d.totals.views)} 回・操作 {fmtN(d.totals.events)} 件
        {d.totals.first ? `（${fmtDateTime(d.totals.first)} から）` : ''}。除外した IP アドレスは数えていません{bots ? '' : '。ボットは含めていません'}。
      </p>
    </Shell>
  );
}
