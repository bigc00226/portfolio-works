'use client';
/* The dashboard (/admin): every figure of the period, from lib/server/stats.ts dashboard(). */
import type { dashboard } from '@/lib/server/stats';
import { fmtN, fmtPct, fmtDur, fmtShort, ago } from '@/lib/admin-format';
import {
  ChartCard, LineChart, StackedBars, HBars, Donut, SegBar, Heatmap, Calendar, Histogram, Funnel, Scatter, Treemap, Radar, Gauge, Sankey, Spark, S,
} from './charts';
import Link from 'next/link';
import { Feed } from './Feed';

type Data = Awaited<ReturnType<typeof dashboard>>;
type K = Data['kpi'];

const Arrow = ({ up }: { up: boolean }) => <svg viewBox="0 0 12 12" fill="currentColor"><path d={up ? 'M6 2l4 5H7.2v3H4.8V7H2z' : 'M6 10l4-5H7.2V2H4.8v3H2z'} /></svg>;

function Delta({ now, before, lowerIsBetter, pct }: { now: number; before: number | undefined; lowerIsBetter?: boolean; pct?: boolean }) {
  if (before == null) return <span className="kpi-d"><span>前の期間なし</span></span>;
  if (!before && !now) return <span className="kpi-d">±0<span>前の期間</span></span>;
  const diff = pct ? (now - before) * 100 : before ? (now - before) / before : 1;
  const up = diff > 0, good = lowerIsBetter ? !up : up;
  if (Math.abs(diff) < (pct ? 0.05 : 0.0005)) return <span className="kpi-d">±0<span>前の期間</span></span>;
  return (
    <span className={`kpi-d ${good ? 'up' : 'down'}`}>
      <Arrow up={up} />{pct ? `${Math.abs(diff).toFixed(1)}pt` : before ? fmtPct(Math.abs(diff)) : '新規'}<span>前の期間</span>
    </span>
  );
}

function Tile({ label, value, unit, now, before, spark, lower, pct, color = S(1) }: { label: string; value: string; unit?: string; now: number; before?: number; spark?: number[]; lower?: boolean; pct?: boolean; color?: string }) {
  return (
    <div className="kpi">
      <span className="kpi-l">{label}</span>
      <span className="kpi-v">{value}{unit && <small>{unit}</small>}</span>
      <Delta now={now} before={before} lowerIsBetter={lower} pct={pct} />
      {spark ? <Spark values={spark} color={color} /> : <span className="kpi-note">{lower ? '低いほど良い指標です' : ''}</span>}
    </div>
  );
}

export function Dashboard({ d, rangeLabel, hourly }: { d: Data; rangeLabel: string; hourly: boolean }) {
  const k = d.kpi, p: Partial<K> = d.prev ?? {};
  const labels = d.series.map((x) => x.label);
  const col = (f: (x: Data['series'][number]) => number) => d.series.map(f);
  const unitT = hourly ? '時' : '日';
  const totalWatchMin = d.treemap.reduce((a, g) => a + g.children.reduce((b, c) => b + c.value, 0), 0);
  const byHour = Array.from({ length: 24 }, (_, h) => ({ label: `${h}時`, n: d.heat.reduce((a, r) => a + r[h], 0) }));
  const byWeekday = d.heat.map((r, i) => ({ label: '月火水木金土日'[i], n: r.reduce((a, x) => a + x, 0) }));
  return (
    <>
      {/* ------------------------------------------------ KPI */}
      <div className="kpis">
        <div className="kpi hero">
          <span className="kpi-l">訪問者（IP アドレス）</span>
          <span className="kpi-v">{fmtN(k.visitors)}<small>人</small></span>
          <Delta now={k.visitors} before={p.visitors} />
          <div className="kpi-sub">
            <span>新規 <b>{fmtN(k.newVisitors)}</b> 人</span>
            <span>セッション <b>{fmtN(k.sessions)}</b> 回</span>
            <span>1 人あたり <b>{k.visitors ? (k.views / k.visitors).toFixed(1) : '0'}</b> ページ</span>
          </div>
          <Spark values={col((x) => x.visitors)} />
        </div>
        <Tile label="ページビュー" value={fmtN(k.views)} unit="回" now={k.views} before={p.views} spark={col((x) => x.views)} />
        <Tile label="動画の再生" value={fmtN(k.plays)} unit="回" now={k.plays} before={p.plays} spark={col((x) => x.plays)} />
        <Tile label="総視聴時間" value={fmtDur(k.watchMs)} now={k.watchMs} before={p.watchMs} spark={col((x) => x.watchMin)} />
        <Tile label="平均視聴率（到達位置）" value={fmtPct(k.avgPct)} now={k.avgPct} before={p.avgPct} pct spark={col((x) => x.avgPct)} />
        <Tile label="直帰率（何も操作せず離脱）" value={fmtPct(k.bounce)} now={k.bounce} before={p.bounce} lower pct />
        <Tile label="平均滞在時間（1 セッション）" value={fmtDur(k.avgSession)} now={k.avgSession} before={p.avgSession} spark={col((x) => x.avgActive)} />
      </div>

      {/* ------------------------------------------------ over time */}
      <div className="ad-grid">
        <ChartCard wide={2} title="訪問者とページビューの推移" sub={`${rangeLabel}・${unitT}ごと`}
          table={{ cols: [hourly ? '時刻' : '日付', '訪問者', 'ページビュー', '再生'], rows: d.series.map((x) => [x.label, x.visitors, x.views, x.plays]) }}>
          <LineChart labels={labels} series={[
            { name: 'ページビュー', color: S(1), values: col((x) => x.views) },
            { name: '訪問者', color: S(2), values: col((x) => x.visitors) },
          ]} />
        </ChartCard>
        <ChartCard title="最後まで見た割合" sub="再生のうち、最後まで見た回数の割合"
          table={{ cols: ['項目', '回数'], rows: [['再生', k.plays], ['最後まで見た', k.completes]] }}>
          <Gauge value={k.completion} label="完了率" sub={`再生 ${fmtN(k.plays)} 回のうち ${fmtN(k.completes)} 回`} />
          <div className="live-box">
            <h4>いまサイトにいる人 <b>{d.live.length}</b></h4>
            {d.live.length ? (
              <ul>{d.live.slice(0, 5).map((x) => <li key={x.visitor}><a href={`/admin/visitors/${x.visitor}`} className="mono">{x.ip}</a><span>{x.page}</span></li>)}</ul>
            ) : <p>直近 90 秒の閲覧はありません</p>}
          </div>
        </ChartCard>

        <ChartCard wide={2} title="操作の内訳" sub={`${unitT}ごとの回数（積み上げ）`}
          table={{ cols: [hourly ? '時刻' : '日付', 'トップページ', '詳細を開いた', 'プレビュー', '再生ページ'], rows: d.series.map((x) => [x.label, x.home, x.details, x.sites, x.watch]) }}>
          <StackedBars labels={labels} unit="回" series={[
            { name: 'トップページ表示', color: S(1), values: col((x) => x.home) },
            { name: '動画の詳細を開いた', color: S(2), values: col((x) => x.details) },
            { name: 'サイトのプレビュー', color: S(3), values: col((x) => x.sites) },
            { name: '再生ページ表示', color: S(4), values: col((x) => x.watch) },
          ]} />
        </ChartCard>
        <ChartCard title="動画を最後まで見るまで" sub="各段階に進んだ訪問者の数"
          table={{ cols: ['段階', '訪問者'], rows: d.funnel.map((x) => [x.label, x.n]) }}>
          <Funnel steps={d.funnel} />
        </ChartCard>
      </div>

      {/* ------------------------------------------------ when / who */}
      <h2 className="ad-sec-title">いつ・だれが見ているか</h2>
      <div className="ad-grid">
        <ChartCard wide={2} title="曜日と時間帯" sub="ページビューの回数（日本時間）"
          table={{ cols: ['曜日', ...Array.from({ length: 24 }, (_, h) => `${h}時`)], rows: d.heat.map((r, i) => ['月火水木金土日'[i], ...r]) }}>
          <Heatmap grid={d.heat} unit="回" />
          <div className="mini-grid">
            <div><h4 className="mini-h">時間帯ごと</h4><Histogram rows={byHour} h={150} /></div>
            <div><h4 className="mini-h">曜日ごと</h4><Histogram rows={byWeekday} h={150} /></div>
          </div>
        </ChartCard>
        <ChartCard title="ブラウザー" sub="訪問者の数" table={{ cols: ['ブラウザーとバージョン', '訪問者'], rows: d.browserVersions.map((x) => [x.label, x.n]) }}>
          <Donut rows={d.browsers} />
        </ChartCard>

        <ChartCard wide={2} title="毎日の訪問者" sub="直近 26 週間" table={{ cols: ['日付', '訪問者'], rows: d.calendar.filter((x) => x.n).map((x) => [x.day, x.n]).reverse() }}>
          <Calendar days={d.calendar} />
        </ChartCard>
        <ChartCard title="新規とリピーター" sub="この期間の訪問者のうち、初めて来た人と前にも来た人"
          table={{ cols: ['区分', '訪問者'], rows: [['新規', k.newVisitors], ['リピーター', k.visitors - k.newVisitors]] }}>
          <Donut pie size={170} rows={[{ label: '新規', n: k.newVisitors }, { label: 'リピーター', n: k.visitors - k.newVisitors }]} />
        </ChartCard>

        <ChartCard title="OS" sub="訪問者の数" table={{ cols: ['OS とバージョン', '訪問者'], rows: d.osVersions.map((x) => [x.label, x.n]) }}>
          <Donut rows={d.oses} />
        </ChartCard>
        <ChartCard title="デバイス" sub="訪問者の数" table={{ cols: ['デバイス', '訪問者'], rows: d.devices.map((x) => [x.label, x.n]) }}>
          <SegBar rows={d.devices} />
          <div style={{ marginTop: 22 }}>
            <h4 className="mini-h">ブラウザーの言語</h4>
            <HBars rows={d.langs.map((x) => ({ label: x.label, n: x.n }))} unit="人" limit={6} />
          </div>
        </ChartCard>
        <ChartCard title="流入元" sub="セッションの数" table={{ cols: ['流入元', 'セッション'], rows: [...d.sources.map((x) => [x.label, x.n]), ...d.referrers.map((x) => [`参照元：${x.label}`, x.n])] }}>
          <HBars rows={d.sources} unit="回" limit={6} />
          <div style={{ marginTop: 22 }}>
            <h4 className="mini-h">参照元のサイト</h4>
            <HBars rows={d.referrers} unit="回" limit={6} />
          </div>
        </ChartCard>
      </div>

      {/* ------------------------------------------------ videos */}
      <h2 className="ad-sec-title">どの動画が見られているか</h2>
      <div className="ad-grid">
        <ChartCard title="よく再生された動画" sub="再生の回数" action={<Link className="ad-link" href="/admin/videos">すべて見る</Link>}
          table={{ cols: ['動画', '再生', '視聴者', '平均視聴率'], rows: [...d.videos].sort((a, b) => b.plays - a.plays).filter((v) => v.plays || v.details).map((v) => [v.title, v.plays, v.viewers, fmtPct(v.avgPct)]) }}>
          <HBars rows={[...d.videos].filter((v) => v.plays).sort((a, b) => b.plays - a.plays).map((v) => ({ label: v.title, n: v.plays, href: `/admin/videos/${v.id}` }))} unit="回" />
        </ChartCard>
        <ChartCard wide={2} title="再生の回数と視聴率" sub="動画ごと（右上ほど、よく再生されて最後まで見られている）"
          table={{ cols: ['動画', '再生', '平均視聴率', '視聴時間'], rows: d.scatter.map((x) => [x.label, x.x, `${x.y}%`, fmtDur(x.size)]) }}>
          <Scatter points={d.scatter.map((x) => ({ ...x, sub: x.platform }))} xLabel="再生の回数" yLabel="平均視聴率" sizeLabel="視聴時間" sizeFmt={fmtDur} />
        </ChartCard>

        <ChartCard title="視聴の維持率" sub="再生のうち、その位置まで見た割合（全動画）"
          table={{ cols: ['動画の位置', '割合'], rows: d.retention.map((x) => [`${x.p}%`, fmtPct(x.share, 1)]) }}>
          <LineChart labels={d.retention.map((x) => `${x.p}%`)} series={[{ name: '維持率', color: S(1), values: d.retention.map((x) => Math.round(x.share * 1000) / 10) }]} unit="%" yMax={100} h={230} yFmt={(n) => `${n}%`} />
        </ChartCard>
        <ChartCard title="どこまで見たか" sub="再生ごとの最大到達位置の分布" table={{ cols: ['到達位置', '再生'], rows: d.hist.map((x) => [x.label, x.n]) }}>
          <Histogram rows={d.hist} xTitle="動画の位置（%）" h={230} />
        </ChartCard>
        <ChartCard title="プラットフォーム別の関心" sub="詳細を開いた回数と再生の回数の内訳"
          table={{ cols: ['プラットフォーム', '詳細を開いた', '再生'], rows: d.radar.map((x) => [x.label, fmtPct(x.details, 1), fmtPct(x.plays, 1)]) }}>
          <Radar axes={d.radar.map((x) => x.label)} series={[
            { name: '詳細を開いた', color: S(1), values: d.radar.map((x) => x.details) },
            { name: '再生', color: S(2), values: d.radar.map((x) => x.plays) },
          ]} size={280} />
        </ChartCard>

        <ChartCard wide={2} title="視聴時間の内訳" sub={`プラットフォーム → 動画（合計 ${fmtDur(totalWatchMin)}）`}
          table={{ cols: ['プラットフォーム', '動画', '視聴時間'], rows: d.treemap.flatMap((g) => g.children.map((c) => [g.label, c.label, fmtDur(c.value)])) }}>
          <Treemap groups={d.treemap} fmt={fmtDur} />
        </ChartCard>
        <ChartCard title="よく見られたページ" sub="ページビューの回数" table={{ cols: ['ページ', 'ページビュー', '訪問者'], rows: d.pages.map((x) => [x.label, x.n, x.visitors]) }}>
          <HBars rows={d.pages.map((x) => ({ label: x.label.replace('再生ページ：', '▶ '), n: x.n, sub: `${x.visitors}人` }))} unit="回" />
        </ChartCard>

        <ChartCard wide={3} title="訪問の流れ" sub="流入元 → 最初に開いたページ → そのセッションでしたこと"
          table={{ cols: ['から', 'へ', 'セッション'], rows: d.flow.map((x) => [x.from, x.to, x.n]) }}>
          <Sankey links={d.flow} />
        </ChartCard>
      </div>

      {/* ------------------------------------------------ people and history */}
      <h2 className="ad-sec-title">訪問者とアクセス履歴</h2>
      <div className="ad-grid">
        <ChartCard wide={3} title="最近の訪問者" sub="IP アドレスごと。行を選ぶと、見たページと動画をすべて表示" action={<Link className="ad-link" href="/admin/visitors">すべての訪問者</Link>}>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>IP アドレス</th><th>ブラウザー</th><th>OS</th><th>デバイス</th><th className="r">ページビュー</th><th>見た動画</th><th className="r">視聴時間</th><th>最終アクセス</th></tr></thead>
              <tbody>
                {d.people.length ? d.people.map((x) => (
                  <tr key={x.id}>
                    <td><a className="row-link ip" href={`/admin/visitors/${x.id}`}>{x.ip}</a>{x.note && <div className="muted" style={{ fontSize: 11.5 }}>{x.note}</div>}</td>
                    <td className="nowrap">{x.browser}{x.agents > 1 && <span className="chip" style={{ marginLeft: 6 }}>ほか {x.agents - 1}</span>}</td>
                    <td className="nowrap">{x.os}</td>
                    <td className="nowrap">{x.device}</td>
                    <td className="r num">{fmtN(x.views)}</td>
                    <td className="wrap">{x.videos.length ? <span className="chip blue">{x.videos.length} 本</span> : <span className="muted">—</span>}</td>
                    <td className="r num">{x.watchMs ? fmtDur(x.watchMs) : '—'}</td>
                    <td className="nowrap" title={fmtShort(x.lastSeen)}>{ago(x.lastSeen, d.now)}</td>
                  </tr>
                )) : <tr><td colSpan={8} className="muted">この期間の訪問者はまだいません</td></tr>}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard wide={3} title="アクセス履歴" sub="新しい順（ページを開くたびに 1 件）" action={<Link className="ad-link" href="/admin/history">すべての履歴</Link>}>
          <Feed items={d.recent.slice(0, 25)} compact />
        </ChartCard>
      </div>
    </>
  );
}
