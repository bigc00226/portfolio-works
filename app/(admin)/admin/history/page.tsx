/* /admin/history — every page load of the period, newest first, with what happened on it. */
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/server/auth';
import { history } from '@/lib/server/stats';
import { videos } from '@/lib/registry';
import { filters, one, type Search } from '@/lib/server/params';
import { fmtN } from '@/lib/admin-format';
import { Shell, PageHead } from '@/components/admin/Shell';
import { FilterBar } from '@/components/admin/ui';
import { Feed } from '@/components/admin/Feed';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'アクセス履歴' };

const PER = 50;
const KINDS = [{ key: '', label: 'すべてのページ' }, { key: 'home', label: 'トップページ' }, { key: 'watch', label: '再生ページ' }, { key: 'played', label: '動画を再生したもの' }];

export default async function HistoryPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { sp, range, bots, qs, ranges } = await filters(searchParams);
  const q = one(sp.q).slice(0, 100), kind = one(sp.kind), video = one(sp.video);
  const page = Math.max(1, parseInt(one(sp.page) || '1', 10) || 1);
  const h = await history({ range, bots, q, kind, video, page, per: PER });
  const pages = Math.max(1, Math.ceil(h.total / PER));
  const link = (p: number) => {
    const u = new URLSearchParams({ range: range.key, ...(bots ? { bots: '1' } : {}), ...(q ? { q } : {}), ...(kind ? { kind } : {}), ...(video ? { video } : {}), page: String(p) });
    return `?${u}`;
  };
  return (
    <Shell active="history" qs={qs}>
      <PageHead title="アクセス履歴" sub={`${range.label}に ${fmtN(h.total)} 件（ページを開くたびに 1 件。除外中の IP アドレスも含めて表示）`}>
        <FilterBar path="/admin/history" ranges={ranges} range={range.key} bots={bots} extra={{ ...(q ? { q } : {}), ...(kind ? { kind } : {}), ...(video ? { video } : {}) }} />
      </PageHead>
      <section className="tp-card">
        <form className="tp-toolbar" method="get">
          <input type="hidden" name="range" value={range.key} />
          {bots && <input type="hidden" name="bots" value="1" />}
          <input className="tp-input sm" name="q" defaultValue={q} placeholder="IP アドレス・ブラウザー・OS" style={{ flex: '1 1 220px' }} />
          <select className="tp-input sm" name="kind" defaultValue={kind}>{KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}</select>
          <select className="tp-input sm" name="video" defaultValue={video} style={{ maxWidth: 300 }}>
            <option value="">すべての動画</option>
            {videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
          <button className="tp-btn sm">絞り込む</button>
          <a className="tp-btn ghost sm" href={`/admin/export?type=views&range=${range.key}${bots ? '&bots=1' : ''}`}>CSV で書き出す</a>
        </form>
        <Feed items={h.rows} />
        {pages > 1 && (
          <div className="tp-pager">
            <span>{fmtN(h.total)} 件中 {fmtN((page - 1) * PER + 1)}〜{fmtN(Math.min(h.total, page * PER))} 件目（{page} / {pages} ページ）</span>
            <div>
              {page > 1 && <a className="tp-btn ghost sm" href={link(page - 1)}>新しい履歴へ</a>}
              {page < pages && <a className="tp-btn ghost sm" href={link(page + 1)}>古い履歴へ</a>}
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
