/* /admin/visitors/<id> — one visitor (IP address): browsers and systems used, every visit, page and video. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/server/auth';
import { visitorDetail } from '@/lib/server/stats';
import { filters, type Search } from '@/lib/server/params';
import { fmtN, fmtDur, fmtPct, fmtDateTime, fmtShort, fmtClock, ago } from '@/lib/admin-format';
import { Shell, PageHead } from '@/components/admin/Shell';
import { ConfirmButton } from '@/components/admin/ui';
import { ChartCard, Calendar, Heatmap } from '@/components/admin/charts';
import { excludeAction, noteAction, deleteVisitorAction } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '訪問者の詳細' };

export default async function VisitorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  await requireAdmin();
  const { qs } = await filters(searchParams);
  const d = visitorDetail(Number((await params).id));
  if (!d) notFound();
  const s = d.summary;
  const tiles: [string, string][] = [
    ['訪問（セッション）', `${fmtN(s.sessions)} 回`], ['ページビュー', `${fmtN(s.views)} 回`], ['見た動画', `${fmtN(s.videos.length)} 本`],
    ['再生', `${fmtN(s.plays)} 回`], ['視聴時間', fmtDur(s.watchMs)], ['ページの表示時間', fmtDur(s.activeMs)],
  ];
  return (
    <Shell active="visitors" qs={qs}>
      <PageHead title={s.ip} crumb={{ href: `/admin/visitors${qs}`, label: '訪問者' }}
        sub={<>初回 {fmtDateTime(s.firstSeen)}・最終 {fmtDateTime(s.lastSeen)}（{ago(s.lastSeen)}）</>}>
        <div className="ad-filters">
          {s.excluded && <span className="chip" style={{ height: 30 }}>集計から除外中</span>}
          {s.bot && <span className="chip warn" style={{ height: 30 }}>ボット</span>}
          <form action={excludeAction}>
            <input type="hidden" name="id" value={s.id} /><input type="hidden" name="excluded" value={s.excluded ? '0' : '1'} />
            <button className="ad-btn ghost sm">{s.excluded ? '集計に戻す' : 'この IP を集計から除外'}</button>
          </form>
          <form action={deleteVisitorAction}>
            <input type="hidden" name="id" value={s.id} />
            <ConfirmButton message={`${s.ip} のアクセス記録をすべて削除します。元に戻せません。よろしいですか？`}>記録を削除</ConfirmButton>
          </form>
        </div>
      </PageHead>

      <div className="kpis mini">
        {tiles.map(([l, v]) => <div key={l} className="kpi"><span className="kpi-l">{l}</span><span className="kpi-v">{v}</span></div>)}
      </div>

      <div className="ad-grid">
        <section className="ad-card">
          <header className="ad-card-h"><div><h3>この訪問者について</h3><p>最後のアクセスの情報</p></div></header>
          <dl className="kv">
            <dt>IP アドレス</dt><dd className="mono">{s.ip}</dd>
            <dt>ブラウザー</dt><dd>{s.browser || '—'}</dd>
            <dt>OS</dt><dd>{s.os || '—'}</dd>
            <dt>デバイス</dt><dd>{s.device || '—'}</dd>
            <dt>言語</dt><dd>{d.agents.at(-1)?.lang || '—'}</dd>
            <dt>タイムゾーン</dt><dd>{d.agents.at(-1)?.tz || '—'}</dd>
            <dt>画面の大きさ</dt><dd>{d.agents.at(-1)?.screen || '—'}</dd>
          </dl>
          <form action={noteAction} className="ad-toolbar" style={{ marginTop: 16, marginBottom: 0 }}>
            <input type="hidden" name="id" value={s.id} />
            <input className="ad-input sm" name="note" defaultValue={s.note} placeholder="メモ（例：〇〇社の担当者）" maxLength={200} style={{ flex: 1 }} />
            <button className="ad-btn ghost sm">メモを保存</button>
          </form>
        </section>
        <ChartCard wide={2} title="使ったブラウザーと OS" sub={`${d.agents.length} 種類の組み合わせ`}>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>ブラウザー</th><th>OS</th><th>デバイス</th><th>画面</th><th className="r">ページビュー</th><th>初回</th><th>最終</th></tr></thead>
              <tbody>
                {d.agents.map((a, i) => (
                  <tr key={i}>
                    <td className="nowrap">{a.browser}{a.bot && <span className="chip warn" style={{ marginLeft: 6 }}>ボット</span>}</td>
                    <td className="nowrap">{a.os}</td><td className="nowrap">{a.device}</td><td className="nowrap num">{a.screen || '—'}</td>
                    <td className="r num">{fmtN(a.views)}</td><td className="nowrap">{fmtShort(a.first)}</td><td className="nowrap">{fmtShort(a.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="ua-box">
            <summary>User-Agent（{d.uas.length} 種類）</summary>
            {d.uas.map((u) => <p key={u.ua} className="ua">{u.ua || '（なし）'} <span className="muted">— {fmtN(u.n)} 回</span></p>)}
          </details>
        </ChartCard>

        <ChartCard wide={3} title="見た動画" sub="再生ページを開いた動画と、一覧で詳細を開いた動画">
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>動画</th><th>プラットフォーム</th><th className="r">詳細を開いた</th><th className="r">再生ページ</th><th className="r">再生</th><th>最大到達位置</th><th className="r">視聴時間</th><th>最後に見た日時</th></tr></thead>
              <tbody>
                {d.watched.length ? d.watched.map((w) => (
                  <tr key={w.id}>
                    <td className="wrap"><a className="row-link" href={`/admin/videos/${w.id}${qs}`}>{w.title}</a></td>
                    <td className="nowrap">{w.platform}</td>
                    <td className="r num">{fmtN(w.details)}</td>
                    <td className="r num">{fmtN(w.views)}</td>
                    <td className="r num">{fmtN(w.plays)}</td>
                    <td>{w.plays ? <><span className="prog" style={{ '--f': `${Math.round(w.best * 100)}%` } as React.CSSProperties}><i /><b>{fmtPct(w.best)}</b></span>{w.completed && <span className="chip green" style={{ marginLeft: 6 }}>完走</span>}</> : <span className="muted">{w.views ? '再生なし' : '詳細のみ'}</span>}</td>
                    <td className="r num">{w.watchMs ? fmtDur(w.watchMs) : '—'}</td>
                    <td className="nowrap">{fmtShort(w.last)}</td>
                  </tr>
                )) : <tr><td colSpan={8} className="muted">動画はまだ見ていません</td></tr>}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard wide={2} title="アクセスした日" sub="直近 26 週間・ページビューの回数" table={{ cols: ['日付', 'ページビュー'], rows: d.calendar.filter((x) => x.n).map((x) => [x.day, x.n]).reverse() }}>
          <Calendar days={d.calendar} unit="回" />
        </ChartCard>
        <ChartCard title="曜日と時間帯" sub="ページビューの回数（日本時間）">
          <Heatmap grid={d.heat} unit="回" />
        </ChartCard>

        <ChartCard wide={3} title="訪問の記録" sub="新しい順。30 分以上あいたら別の訪問として区切っています">
          <ol className="tl">
            {d.sessions.map((x, i) => (
              <li key={i} className="tl-s">
                <span className="tl-dot" />
                <div className="tl-h">
                  <b>{fmtDateTime(x.start)}</b>
                  <span>{fmtClock(x.start)}〜{fmtClock(x.end)}・{x.views.length} ページ・表示 {fmtDur(x.active)}</span>
                  <span>流入：{x.refHost || x.source}</span>
                </div>
                <ul className="tl-views">
                  {x.views.map((v) => (
                    <li key={v.id} className="tl-v">
                      <div className="tl-v-h">
                        <time>{fmtClock(v.ts)}</time>
                        <span className="page">{v.page}</span>
                        {v.kind === 'watch' && <span className="prog" style={{ '--f': `${Math.round(v.pct * 100)}%` } as React.CSSProperties}><i /><b>{fmtPct(v.pct)}</b></span>}
                        {v.completed && <span className="chip green">最後まで見た</span>}
                      </div>
                      <div className="tl-v-m">
                        <span>{v.browser}・{v.os}・{v.device}</span>
                        <span>表示 {fmtDur(v.active)}</span>
                        {v.watch > 0 && <span>視聴 {fmtDur(v.watch)}</span>}
                      </div>
                      {v.events.length > 0 && (
                        <div className="feed-ev">
                          {v.events.map((e, j) => (
                            <span key={j} className={`chip${e.name === 'complete' ? ' green' : e.name === 'detail' || e.name === 'play' ? ' blue' : ''}`}>
                              {fmtClock(e.ts)}　{e.label}{e.name === 'detail' || e.name === 'site' ? `：${e.target}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </ChartCard>
      </div>
    </Shell>
  );
}
