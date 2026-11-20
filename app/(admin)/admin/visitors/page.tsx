/* /admin/visitors — every visitor (one per IP address) of the period, with browser, OS, device and what they watched. */
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/server/auth';
import { visitorList, videoTitle, type VisitorSort } from '@/lib/server/stats';
import { filters, one, type Search } from '@/lib/server/params';
import { fmtN, fmtDur, fmtShort, ago } from '@/lib/admin-format';
import { Shell, PageHead } from '@/components/admin/Shell';
import { FilterBar } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '訪問者' };

const PER = 50;
const SORTS: { key: VisitorSort; label: string }[] = [
  { key: 'recent', label: '最終アクセスが新しい順' }, { key: 'first', label: '初回アクセスが新しい順' },
  { key: 'views', label: 'ページビューが多い順' }, { key: 'watch', label: '視聴時間が長い順' }, { key: 'ip', label: 'IP アドレス順' },
];

export default async function VisitorsPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { sp, range, bots, qs, ranges } = await filters(searchParams);
  const q = one(sp.q).slice(0, 100), sort = (SORTS.find((s) => s.key === one(sp.sort))?.key ?? 'recent') as VisitorSort;
  const showExcluded = one(sp.excluded) === '1';
  const page = Math.max(1, parseInt(one(sp.page) || '1', 10) || 1);
  const list = await visitorList({ range, bots, q, sort, showExcluded });
  const rows = list.slice((page - 1) * PER, page * PER);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const keep = (o: Record<string, string | number>) => {
    const p = new URLSearchParams({ range: range.key, ...(bots ? { bots: '1' } : {}), ...(q ? { q } : {}), sort, ...(showExcluded ? { excluded: '1' } : {}) });
    Object.entries(o).forEach(([k, v]) => p.set(k, String(v)));
    return `?${p}`;
  };
  const totals = { views: list.reduce((a, x) => a + x.views, 0), plays: list.reduce((a, x) => a + x.plays, 0), watch: list.reduce((a, x) => a + x.watchMs, 0) };
  return (
    <Shell active="visitors" qs={qs}>
      <PageHead title="訪問者（IP アドレス別）" sub={<>{range.label}に {fmtN(list.length)} 人・ページビュー {fmtN(totals.views)} 回・再生 {fmtN(totals.plays)} 回・視聴 {fmtDur(totals.watch)}</>}>
        <FilterBar path="/admin/visitors" ranges={ranges} range={range.key} bots={bots} extra={{ ...(q ? { q } : {}), sort, ...(showExcluded ? { excluded: '1' } : {}) }} />
      </PageHead>
      <section className="tp-card">
        <form className="tp-toolbar" method="get">
          <input type="hidden" name="range" value={range.key} />
          {bots && <input type="hidden" name="bots" value="1" />}
          <input className="tp-input sm" name="q" defaultValue={q} placeholder="IP アドレス・ブラウザー・OS・メモ・動画名で検索" style={{ flex: '1 1 280px' }} />
          <select className="tp-input sm" name="sort" defaultValue={sort}>{SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          <label className="tp-check" style={{ height: 36 }}><input type="checkbox" name="excluded" value="1" defaultChecked={showExcluded} />除外中も表示</label>
          <button className="tp-btn sm">絞り込む</button>
          <a className="tp-btn ghost sm" href={`/admin/export?type=visitors&range=${range.key}${bots ? '&bots=1' : ''}`}>CSV で書き出す</a>
        </form>
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th>IP アドレス</th><th>ブラウザー</th><th>OS</th><th>デバイス</th><th>初回</th><th>最終アクセス</th>
                <th className="r">訪問</th><th className="r">ページビュー</th><th>見た動画</th><th className="r">視聴時間</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((x) => (
                <tr key={x.id}>
                  <td>
                    <a className="row-link ip" href={`/admin/visitors/${x.id}${qs}`}>{x.ip}</a>
                    <div className="chips" style={{ marginTop: 3 }}>
                      {x.excluded && <span className="chip">除外中</span>}
                      {x.bot && <span className="chip warn">ボット</span>}
                      {x.note && <span className="muted" style={{ fontSize: 11.5 }}>{x.note}</span>}
                    </div>
                  </td>
                  <td className="nowrap">{x.browser}{x.agents > 1 && <span className="chip" style={{ marginLeft: 6 }} title="ほかのブラウザー・OS からのアクセスもあります">ほか {x.agents - 1}</span>}</td>
                  <td className="nowrap">{x.os}</td>
                  <td className="nowrap">{x.device}</td>
                  <td className="nowrap" title={fmtShort(x.firstSeen)}>{fmtShort(x.firstSeen).split(' ')[0]}</td>
                  <td className="nowrap" title={fmtShort(x.lastSeen)}>{ago(x.lastSeen)}</td>
                  <td className="r num">{fmtN(x.sessions)}</td>
                  <td className="r num"><div className="cell-2"><span>{fmtN(x.views)}</span><small>トップ {x.homeViews}・再生 {x.watchViews}</small></div></td>
                  <td className="wrap">
                    {x.videos.length ? (
                      <div className="chips">
                        {x.videos.slice(0, 3).map((id) => <span key={id} className="chip blue" title={videoTitle(id)}>{videoTitle(id).length > 16 ? `${videoTitle(id).slice(0, 16)}…` : videoTitle(id)}</span>)}
                        {x.videos.length > 3 && <span className="chip">ほか {x.videos.length - 3} 本</span>}
                      </div>
                    ) : x.details ? <span className="muted">詳細を {x.details} 回表示</span> : <span className="muted">—</span>}
                  </td>
                  <td className="r num">{x.watchMs ? fmtDur(x.watchMs) : '—'}</td>
                </tr>
              )) : <tr><td colSpan={10} className="muted">該当する訪問者はいません</td></tr>}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="tp-pager">
            <span>{fmtN(list.length)} 人中 {fmtN((page - 1) * PER + 1)}〜{fmtN(Math.min(list.length, page * PER))} 人目</span>
            <div>
              {page > 1 && <a className="tp-btn ghost sm" href={keep({ page: page - 1 })}>前へ</a>}
              {page < pages && <a className="tp-btn ghost sm" href={keep({ page: page + 1 })}>次へ</a>}
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
