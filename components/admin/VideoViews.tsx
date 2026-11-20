'use client';
/* The video pages of the admin (/admin/videos, /admin/videos/<id>). */
import type { VideoStat, videoReport } from '@/lib/server/stats';
import { fmtN, fmtPct, fmtDur, fmtClockLen, fmtShort } from '@/lib/admin-format';
import { ChartCard, LineChart, StackedBars, HBars, Donut, Scatter, Gauge, S, colorOf } from './charts';

export function VideoOverview({ rows, qs }: { rows: VideoStat[]; qs: string }) {
  const byPlat = new Map<string, { plays: number; details: number; watch: number }>();
  rows.forEach((v) => {
    const x = byPlat.get(v.platformLabel) ?? { plays: 0, details: 0, watch: 0 };
    x.plays += v.plays; x.details += v.details; x.watch += v.watchMs; byPlat.set(v.platformLabel, x);
  });
  const plats = [...byPlat].map(([label, x]) => ({ label, ...x })).sort((a, b) => b.plays - a.plays);
  const sorted = [...rows].sort((a, b) => b.plays - a.plays || b.details - a.details || b.views - a.views);
  const totPlays = rows.reduce((a, v) => a + v.plays, 0), totComp = rows.reduce((a, v) => a + v.completes, 0);
  return (
    <>
      <div className="ad-grid">
        <ChartCard title="プラットフォーム別の再生" sub="再生の回数" table={{ cols: ['プラットフォーム', '再生', '詳細を開いた', '視聴時間'], rows: plats.map((p) => [p.label, p.plays, p.details, fmtDur(p.watch)]) }}>
          <Donut rows={plats.map((p) => ({ label: p.label, n: p.plays }))} unit="回" label="再生" />
        </ChartCard>
        <ChartCard title="詳細を開いた回数" sub="一覧で動画の詳細を開いた回数（上位）" table={{ cols: ['動画', '詳細を開いた', '開いた人'], rows: [...rows].sort((a, b) => b.details - a.details).filter((v) => v.details).map((v) => [v.title, v.details, v.detailViewers]) }}>
          <HBars rows={[...rows].filter((v) => v.details).sort((a, b) => b.details - a.details).map((v) => ({ label: v.title, n: v.details, href: `/admin/videos/${v.id}${qs}` }))} unit="回" limit={8} />
        </ChartCard>
        <ChartCard title="全体の完了率" sub="再生のうち最後まで見た割合" table={{ cols: ['項目', '回数'], rows: [['再生', totPlays], ['最後まで見た', totComp]] }}>
          <Gauge value={totPlays ? totComp / totPlays : 0} label="完了率" sub={`再生 ${fmtN(totPlays)} 回のうち ${fmtN(totComp)} 回`} />
        </ChartCard>
        <ChartCard wide={3} title="詳細を開いた回数と再生の回数" sub="動画ごと。右上ほど、関心を持たれて再生されている"
          table={{ cols: ['動画', '詳細を開いた', '再生'], rows: sorted.map((v) => [v.title, v.details, v.plays]) }}>
          <Scatter points={rows.filter((v) => v.details || v.plays).map((v) => ({ id: v.id, label: v.title, sub: v.platformLabel, x: v.details, y: v.details ? Math.min(100, Math.round((v.plays / v.details) * 1000) / 10) : 100, size: v.plays }))}
            xLabel="詳細を開いた回数" yLabel="詳細から再生した割合" sizeLabel="再生の回数" />
        </ChartCard>
      </div>
      <section className="ad-card">
        <header className="ad-card-h"><div><h3>すべての動画</h3><p>再生の多い順。動画名を選ぶと、視聴の維持率とチャプターごとの離脱を表示</p></div></header>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>動画</th><th>プラットフォーム</th><th className="r">長さ</th><th className="r">詳細を開いた</th><th className="r">再生ページ</th><th className="r">視聴者</th><th className="r">再生</th><th>平均視聴率</th><th className="r">完了</th><th className="r">視聴時間</th><th>最後の閲覧</th></tr></thead>
            <tbody>
              {sorted.map((v) => (
                <tr key={v.id}>
                  <td className="wrap"><a className="row-link" href={`/admin/videos/${v.id}${qs}`}>{v.title}</a></td>
                  <td className="nowrap"><span className="dot" style={{ background: colorOf(v.platformLabel) }} />{v.platformLabel}</td>
                  <td className="r num">{fmtClockLen(v.duration)}</td>
                  <td className="r num">{fmtN(v.details)}</td>
                  <td className="r num">{fmtN(v.views)}</td>
                  <td className="r num">{fmtN(v.viewers)}</td>
                  <td className="r num">{fmtN(v.plays)}</td>
                  <td>{v.plays ? <span className="prog" style={{ '--f': `${Math.round(v.avgPct * 100)}%` } as React.CSSProperties}><i /><b>{fmtPct(v.avgPct)}</b></span> : <span className="muted">—</span>}</td>
                  <td className="r num">{fmtN(v.completes)}</td>
                  <td className="r num">{v.watchMs ? fmtDur(v.watchMs) : '—'}</td>
                  <td className="nowrap">{v.lastTs ? fmtShort(v.lastTs) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

type Report = NonNullable<ReturnType<typeof videoReport>>;

export function VideoDetail({ r, hourly }: { r: Report; hourly: boolean }) {
  const st = r.stat;
  const tiles: [string, string][] = [
    ['詳細を開いた', `${fmtN(st.details)} 回`], ['再生ページ', `${fmtN(st.views)} 回`], ['視聴者', `${fmtN(st.viewers)} 人`],
    ['再生', `${fmtN(st.plays)} 回`], ['平均視聴率', fmtPct(st.avgPct)], ['視聴時間', fmtDur(st.watchMs)],
  ];
  return (
    <>
      <div className="kpis mini">{tiles.map(([l, v]) => <div key={l} className="kpi"><span className="kpi-l">{l}</span><span className="kpi-v">{v}</span></div>)}</div>
      <div className="ad-grid">
        <ChartCard wide={2} title="視聴の維持率" sub="再生のうち、動画のその位置まで見た割合" table={{ cols: ['位置', '時刻', '割合'], rows: r.retention.map((x) => [`${x.p}%`, fmtClockLen((r.video.duration * x.p) / 100), fmtPct(x.share, 1)]) }}>
          <LineChart labels={r.retention.map((x) => fmtClockLen((r.video.duration * x.p) / 100))} series={[{ name: '維持率', color: S(1), values: r.retention.map((x) => Math.round(x.share * 1000) / 10) }]} unit="%" yMax={100} yFmt={(n) => `${n}%`} />
        </ChartCard>
        <ChartCard title="完了率" sub="再生のうち最後まで見た割合">
          <Gauge value={st.plays ? st.completes / st.plays : 0} label="完了率" sub={`再生 ${fmtN(st.plays)} 回のうち ${fmtN(st.completes)} 回`} />
        </ChartCard>
        <ChartCard wide={2} title="推移" sub={hourly ? '1 時間ごと' : '1 日ごと'} table={{ cols: ['期間', '詳細を開いた', '再生ページ', '再生'], rows: r.series.map((x) => [x.label, x.details, x.views, x.plays]) }}>
          <StackedBars labels={r.series.map((x) => x.label)} unit="回" series={[
            { name: '詳細を開いた', color: S(1), values: r.series.map((x) => x.details) },
            { name: '再生ページ', color: S(2), values: r.series.map((x) => x.views) },
          ]} />
        </ChartCard>
        <ChartCard title="チャプターごとの離脱" sub="そのチャプターで見るのをやめた再生の回数" table={{ cols: ['チャプター', '開始', '到達', '離脱'], rows: r.chapters.map((c) => [c.name, fmtClockLen(c.t), c.reached, c.stopped]) }}>
          <HBars rows={r.chapters.map((c) => ({ label: c.name, n: c.stopped, sub: fmtClockLen(c.t) }))} unit="回" color={S(8)} limit={30} />
        </ChartCard>
        <ChartCard wide={3} title="この動画を見た人" sub="IP アドレスごと">
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>IP アドレス</th><th>ブラウザー</th><th>OS</th><th className="r">再生ページ</th><th>最大到達位置</th><th className="r">視聴時間</th><th>最後に見た日時</th></tr></thead>
              <tbody>
                {r.viewers.length ? r.viewers.map((v) => (
                  <tr key={v.visitor}>
                    <td><a className="row-link ip" href={`/admin/visitors/${v.visitor}`}>{v.ip}</a></td>
                    <td className="nowrap">{v.browser}</td><td className="nowrap">{v.os}</td>
                    <td className="r num">{fmtN(v.views)}</td>
                    <td><span className="prog" style={{ '--f': `${Math.round(v.best * 100)}%` } as React.CSSProperties}><i /><b>{fmtPct(v.best)}</b></span>{v.completed && <span className="chip green" style={{ marginLeft: 6 }}>完走</span>}</td>
                    <td className="r num">{v.watchMs ? fmtDur(v.watchMs) : '—'}</td>
                    <td className="nowrap">{fmtShort(v.last)}</td>
                  </tr>
                )) : <tr><td colSpan={7} className="muted">この期間に再生ページを開いた人はいません</td></tr>}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </>
  );
}
