'use client';
/*
 * The charts of the admin dashboard — plain SVG drawn by React, no chart library.
 * Rules (the same on every chart): colours are roles (admin.css --s1…--s8 categorical in a fixed order, --q1…--q7 one
 * blue light → dark), a colour follows its entity (Chrome is always --s1), thin marks with rounded data ends, hairline
 * grid, one y axis, a tooltip on every mark, a legend for two series or more, and every card can show its numbers as
 * a table (ChartCard).
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fmtN, fmtPct } from '@/lib/admin-format';

/* ------------------------------------------------------------------ format */

const compact = (n: number) => (Math.abs(n) >= 10000 ? `${Math.round(n / 1000)}K` : fmtN(n));

/* ------------------------------------------------------------------ colours */

export const S = (i: number) => `var(--s${i})`;
export const GRAY = 'var(--other)';
const FIXED: Record<string, number> = {
  // browsers
  Chrome: 1, Safari: 2, Edge: 3, Firefox: 4, 'Samsung Internet': 5, Opera: 6, Brave: 7, LINE: 8,
  // systems
  Windows: 1, iOS: 2, Android: 3, macOS: 4, iPadOS: 5, Linux: 6, ChromeOS: 7,
  // devices
  パソコン: 1, スマートフォン: 2, タブレット: 3,
  // platforms (lib/platforms.ts order)
  Shopify: 1, WordPress: 2, 'EC-CUBE': 3, makeshop: 4, STUDIO: 5, Wix: 6,
  // where from (the flow chart) and what they did
  直接: 1, 検索エンジン: 2, SNS: 3, クラウドソーシング: 5, ほかのサイト: 7,
  動画を再生した: 6, '詳細・プレビューを見た': 4,
  // new and returning visitors
  新規: 1, リピーター: 2,
};
/** the colour of an entity: its fixed slot, else gray (その他・不明・ボット and names past the eight slots) */
export const colorOf = (label: string) => (FIXED[label] ? S(FIXED[label]) : GRAY);
const SEQ = ['var(--q1)', 'var(--q2)', 'var(--q3)', 'var(--q4)', 'var(--q5)', 'var(--q6)', 'var(--q7)'];

/* ------------------------------------------------------------------ helpers */

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceStep(max: number, n = 4) {
  if (max <= 0) return 1;
  const raw = max / n, e = 10 ** Math.floor(Math.log10(raw)), f = raw / e;
  const s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
  return Math.max(s, max < 4 ? 1 : s);
}
function axis(max: number, n = 4, integer = true) {
  let step = niceStep(max, n);
  if (integer) step = Math.max(1, Math.ceil(step));
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let t = 0; t <= top + 1e-9; t += step) ticks.push(+t.toFixed(6));
  return { top, ticks };
}

type Tip = { x: number; y: number; body: ReactNode } | null;
function Tooltip({ tip, w }: { tip: Tip; w: number }) {
  if (!tip) return null;
  const left = Math.max(8, Math.min(w - 8, tip.x));
  return <div className="ch-tip" style={{ left, top: tip.y, transform: `translate(${left > w - 180 ? '-100%' : left < 180 ? '0' : '-50%'}, calc(-100% - 12px))` }}>{tip.body}</div>;
}
const TipRow = ({ color, label, value }: { color?: string; label: ReactNode; value: ReactNode }) => (
  <div className="ch-tip-row">{color && <i style={{ background: color }} />}<span>{label}</span><b>{value}</b></div>
);

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="ch-legend">
      {items.map((x) => <li key={x.label}><i style={{ background: x.color }} /><span>{x.label}</span>{x.value && <b>{x.value}</b>}</li>)}
    </ul>
  );
}

const Empty = ({ h = 200, text = 'この期間のデータはまだありません' }: { h?: number; text?: string }) => (
  <div className="ch-empty" style={{ height: h }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 19h16M7 16V9M12 16V5M17 16v-4" /></svg><span>{text}</span></div>
);

/** a bar with rounded data end (r) and a square end at the baseline */
function barPath(x: number, y: number, w: number, h: number, r: number, dir: 'up' | 'right' = 'up') {
  if (h <= 0 || w <= 0) return '';
  if (dir === 'up') {
    const rr = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
  }
  const rr = Math.min(r, h / 2, w);
  return `M${x},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h - rr}Q${x + w},${y + h} ${x + w - rr},${y + h}H${x}Z`;
}

/* ------------------------------------------------------------------ card with a table view */

export type Table = { cols: string[]; rows: (string | number)[][]; align?: ('l' | 'r')[] };

export function ChartCard({ title, sub, table, children, wide, action, id }: { title: string; sub?: string; table?: Table; children: ReactNode; wide?: 1 | 2 | 3; action?: ReactNode; id?: string }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`ad-card${wide ? ` w${wide}` : ''}`} id={id}>
      <header className="ad-card-h">
        <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
        <div className="ad-card-tools">
          {action}
          {table && (
            <button type="button" className={`ad-seg-btn${asTable ? ' on' : ''}`} aria-pressed={asTable} onClick={() => setAsTable(!asTable)} title="数値を表で見る">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" /></svg>表
            </button>
          )}
        </div>
      </header>
      {asTable && table ? <DataTable t={table} /> : children}
    </section>
  );
}

export function DataTable({ t }: { t: Table }) {
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead><tr>{t.cols.map((c, i) => <th key={c} className={(t.align?.[i] ?? (i ? 'r' : 'l')) === 'r' ? 'r' : ''}>{c}</th>)}</tr></thead>
        <tbody>
          {t.rows.length ? t.rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={(t.align?.[j] ?? (j ? 'r' : 'l')) === 'r' ? 'r num' : ''}>{typeof c === 'number' ? fmtN(c) : c}</td>)}</tr>
          )) : <tr><td colSpan={t.cols.length} className="muted">データがありません</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ sparkline */

export function Spark({ values, color = 'var(--s1)' }: { values: number[]; color?: string }) {
  const id = useId();
  if (values.length < 2) return <svg className="spark" viewBox="0 0 100 28" />;
  const max = Math.max(1, ...values), W = 100, H = 28;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 2 - (v / max) * (H - 6)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d}L${W},${H}L0,${H}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ line / area over time */

export type Series = { name: string; color: string; values: number[] };

export function LineChart({ labels, series, area = true, h = 260, unit = '', yMax, xFmt, yFmt = compact }: {
  labels: string[]; series: Series[]; area?: boolean; h?: number; unit?: string; yMax?: number; xFmt?: (l: string) => string; yFmt?: (n: number) => string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const gid = useId();
  const max = yMax ?? Math.max(0, ...series.flatMap((s) => s.values));
  const { top, ticks } = axis(max, 4, yMax == null);
  const L = 44, R = 14, T = 12, B = 28, iw = Math.max(10, w - L - R), ih = h - T - B, n = labels.length;
  const x = (i: number) => L + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => T + ih - (v / top) * ih;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  const empty = max === 0;
  const onMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - L) / iw) * (n - 1));
    setHi(Math.max(0, Math.min(n - 1, i)));
  };
  return (
    <div className="ch" ref={ref}>
      {series.length > 1 && <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} />}
      {w > 0 && (
        <svg width={w} height={h} onPointerMove={onMove} onPointerLeave={() => setHi(null)} role="img" aria-label={series.map((s) => s.name).join('・')}>
          <defs>{series.map((s, k) => <linearGradient key={k} id={`${gid}${k}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity=".16" /><stop offset="1" stopColor={s.color} stopOpacity=".02" /></linearGradient>)}</defs>
          {ticks.map((t) => <g key={t}><line x1={L} x2={L + iw} y1={y(t)} y2={y(t)} className={t ? 'grid' : 'base'} /><text x={L - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tick">{yFmt(t)}</text></g>)}
          {labels.map((l, i) => (i % every === 0 || i === n - 1) && (i === n - 1 || n - 1 - i >= every / 2) ? <text key={i} x={x(i)} y={h - 8} textAnchor="middle" className="tick">{xFmt ? xFmt(l) : l}</text> : null)}
          {!empty && series.map((s, k) => {
            const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
            return (
              <g key={s.name}>
                {area && <path d={`${d}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={`url(#${gid}${k})`} className="ch-draw-area" />}
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="ch-draw" pathLength={1} />
                {n > 0 && <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r="4" fill={s.color} stroke="var(--surface)" strokeWidth="2" />}
              </g>
            );
          })}
          {hi != null && !empty && (
            <g>
              <line x1={x(hi)} x2={x(hi)} y1={T} y2={T + ih} className="cross" />
              {series.map((s) => <circle key={s.name} cx={x(hi)} cy={y(s.values[hi])} r="4.5" fill={s.color} stroke="var(--surface)" strokeWidth="2" />)}
            </g>
          )}
        </svg>
      )}
      {empty && w > 0 && <div className="ch-over"><Empty h={0} /></div>}
      <Tooltip w={w} tip={hi != null && !empty ? { x: x(hi), y: Math.min(...series.map((s) => y(s.values[hi]))) + (series.length > 1 ? 34 : 0), body: (
        <><div className="ch-tip-h">{xFmt ? xFmt(labels[hi]) : labels[hi]}</div>{series.map((s) => <TipRow key={s.name} color={s.color} label={s.name} value={`${fmtN(s.values[hi])}${unit}`} />)}</>
      ) } : null} />
    </div>
  );
}

/* ------------------------------------------------------------------ stacked columns */

export function StackedBars({ labels, series, h = 260, unit = '' }: { labels: string[]; series: Series[]; h?: number; unit?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const totals = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
  const { top, ticks } = axis(Math.max(0, ...totals));
  const L = 44, R = 10, T = 12, B = 28, iw = Math.max(10, w - L - R), ih = h - T - B, n = labels.length;
  const band = iw / Math.max(1, n), bw = Math.min(24, Math.max(3, band * 0.62));
  const y = (v: number) => (v / top) * ih;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  const empty = Math.max(0, ...totals) === 0;
  return (
    <div className="ch" ref={ref}>
      <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} />
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label="積み上げ棒グラフ" onPointerLeave={() => setHi(null)}>
          {ticks.map((t) => <g key={t}><line x1={L} x2={L + iw} y1={T + ih - y(t)} y2={T + ih - y(t)} className={t ? 'grid' : 'base'} /><text x={L - 8} y={T + ih - y(t)} dy="0.32em" textAnchor="end" className="tick">{compact(t)}</text></g>)}
          {labels.map((l, i) => {
            const cx = L + band * i + band / 2;
            let acc = 0;
            const segs = series.map((s) => { const hh = y(s.values[i]); const seg = { s, y0: T + ih - acc - hh, hh }; acc += hh; return seg; }).filter((g) => g.hh > 0);
            return (
              <g key={i} onPointerEnter={() => setHi(i)} className={hi != null && hi !== i ? 'dim' : ''}>
                <rect x={L + band * i} y={T} width={band} height={ih} fill="transparent" />
                {segs.map((g, k) => {
                  const isTop = k === segs.length - 1;
                  const gap = k ? 2 : 0;
                  return isTop
                    ? <path key={g.s.name} d={barPath(cx - bw / 2, g.y0, bw, Math.max(0, g.hh - gap), 4)} fill={g.s.color} className="ch-grow" />
                    : <rect key={g.s.name} x={cx - bw / 2} y={g.y0} width={bw} height={Math.max(0, g.hh - gap)} fill={g.s.color} className="ch-grow" />;
                })}
                {(i % every === 0) && <text x={cx} y={h - 8} textAnchor="middle" className="tick">{l}</text>}
              </g>
            );
          })}
        </svg>
      )}
      {empty && w > 0 && <div className="ch-over"><Empty h={0} /></div>}
      <Tooltip w={w} tip={hi != null && !empty ? { x: L + band * hi + band / 2, y: T + ih - y(totals[hi]), body: (
        <><div className="ch-tip-h">{labels[hi]}<span>合計 {fmtN(totals[hi])}{unit}</span></div>{[...series].reverse().map((s) => <TipRow key={s.name} color={s.color} label={s.name} value={`${fmtN(s.values[hi])}${unit}`} />)}</>
      ) } : null} />
    </div>
  );
}

/* ------------------------------------------------------------------ ranked horizontal bars */

export type Bar = { label: string; n: number; sub?: string; href?: string; color?: string };

export function HBars({ rows, unit = '', color = 'var(--s1)', fmt = fmtN, max: maxIn, limit = 10 }: { rows: Bar[]; unit?: string; color?: string; fmt?: (n: number) => string; max?: number; limit?: number }) {
  const list = rows.slice(0, limit);
  const max = maxIn ?? Math.max(0, ...list.map((r) => r.n));
  const [hi, setHi] = useState<number | null>(null);
  if (!list.length || max === 0) return <Empty h={160} />;
  return (
    <ol className="hbars" onPointerLeave={() => setHi(null)}>
      {list.map((r, i) => {
        const Inner = (
          <>
            <span className="hb-label"><span className="hb-rank">{i + 1}</span><span className="hb-name" title={r.label}>{r.label}</span>{r.sub && <small>{r.sub}</small>}</span>
            <span className="hb-track">{r.n > 0 && <span className="hb-bar" style={{ width: `${(r.n / max) * 100}%`, background: r.color ?? color, animationDelay: `${i * 40}ms` }} />}</span>
            <b className="hb-val">{fmt(r.n)}{unit}</b>
          </>
        );
        return (
          <li key={r.label + i} className={hi != null && hi !== i ? 'dim' : ''} onPointerEnter={() => setHi(i)}>
            {r.href ? <a href={r.href}>{Inner}</a> : <div>{Inner}</div>}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ donut */

export function Donut({ rows, unit = '人', label = '合計', size = 190, pie = false }: { rows: { label: string; n: number }[]; unit?: string; label?: string; size?: number; pie?: boolean }) {
  const [hi, setHi] = useState<number | null>(null);
  const total = rows.reduce((a, r) => a + r.n, 0);
  if (!total) return <Empty h={size} />;
  const R = size / 2, r0 = pie ? 0 : R * 0.64, gap = rows.length > 1 && !pie ? 0.012 : 0;
  const starts = rows.map((_, i) => -Math.PI / 2 + (rows.slice(0, i).reduce((s, r) => s + r.n, 0) / total) * Math.PI * 2);
  const arcs = rows.map((row, i) => {
    const da = (row.n / total) * Math.PI * 2;
    const a0 = starts[i] + gap, a1 = starts[i] + da - gap;
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const p = (ang: number, rad: number) => `${R + rad * Math.cos(ang)},${R + rad * Math.sin(ang)}`;
    const full = rows.length === 1;
    const d = full
      ? `M${R},0A${R},${R} 0 1 1 ${R - 0.01},0Z${pie ? '' : ` M${R},${R - r0}A${r0},${r0} 0 1 0 ${R + 0.01},${R - r0}Z`}`
      : pie
        ? `M${R},${R}L${p(a0, R)}A${R},${R} 0 ${big} 1 ${p(a1, R)}Z`
        : `M${p(a0, R)}A${R},${R} 0 ${big} 1 ${p(a1, R)}L${p(a1, r0)}A${r0},${r0} 0 ${big} 0 ${p(a0, r0)}Z`;
    return { d, row, i };
  });
  const cur = hi != null ? rows[hi] : null;
  return (
    <div className="donut">
      <div className="donut-fig" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={rows.map((r) => `${r.label} ${r.n}`).join('、')} onPointerLeave={() => setHi(null)}>
          {arcs.map(({ d, row, i }) => (
            <path key={row.label} d={d} fill={colorOf(row.label)} fillRule="evenodd" stroke={pie ? 'var(--surface)' : undefined} strokeWidth={pie ? 2 : undefined} className={`donut-seg${hi != null && hi !== i ? ' dim' : ''}`} onPointerEnter={() => setHi(i)} style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </svg>
        {!pie && (
          <div className="donut-center">
            <b>{fmtN(cur ? cur.n : total)}</b>
            <span>{cur ? `${cur.label}・${fmtPct(cur.n / total, 1)}` : `${label}（${unit}）`}</span>
          </div>
        )}
      </div>
      <ul className="donut-legend">
        {rows.map((r, i) => (
          <li key={r.label} className={hi === i ? 'on' : hi != null ? 'dim' : ''} onPointerEnter={() => setHi(i)} onPointerLeave={() => setHi(null)}>
            <i style={{ background: colorOf(r.label) }} /><span>{r.label}</span><b>{fmtPct(r.n / total, 1)}</b><small>{fmtN(r.n)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ tall segmented bar (one whole, split into parts) */

export function SegBar({ rows, unit = '人' }: { rows: { label: string; n: number }[]; unit?: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const total = rows.reduce((a, r) => a + r.n, 0);
  if (!total) return <Empty h={90} />;
  const parts = rows.filter((r) => r.n > 0);
  return (
    <div className="segbar-wrap">
      <div className="segbar" role="img" aria-label={parts.map((r) => `${r.label} ${fmtPct(r.n / total)}`).join('、')} onPointerLeave={() => setHi(null)}>
        {parts.map((r, i) => {
          const f = r.n / total;
          return (
            <div key={r.label} className={`seg${hi != null && hi !== i ? ' dim' : ''}`} style={{ flexGrow: f, background: colorOf(r.label) }} onPointerEnter={() => setHi(i)}
              title={`${r.label}：${fmtN(r.n)}${unit}（${fmtPct(f, 1)}）`}>
              {f >= 0.09 && <span>{fmtPct(f)}</span>}
            </div>
          );
        })}
      </div>
      <Legend items={parts.map((r) => ({ label: r.label, color: colorOf(r.label), value: `${fmtN(r.n)}${unit}` }))} />
      {hi != null && <p className="segbar-note">{parts[hi].label}：{fmtN(parts[hi].n)}{unit}（{fmtPct(parts[hi].n / total, 1)}）</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ heatmap: weekday × hour */

const WD = ['月', '火', '水', '木', '金', '土', '日'];
const step = (v: number, max: number) => (v <= 0 || max <= 0 ? -1 : Math.min(6, Math.floor((v / max) * 6.999)));

export function Heatmap({ grid, unit = '件' }: { grid: number[][]; unit?: string }) {
  const [hi, setHi] = useState<[number, number] | null>(null);
  const max = Math.max(0, ...grid.flat());
  const cur = hi ? grid[hi[0]][hi[1]] : null;
  return (
    <div className="heat">
      <div className="heat-grid" onPointerLeave={() => setHi(null)}>
        <span />
        {Array.from({ length: 24 }, (_, hr) => <span key={hr} className="heat-x">{hr % 3 === 0 ? hr : ''}</span>)}
        {grid.map((row, d) => (
          <div key={d} className="heat-row">
            <span className="heat-y">{WD[d]}</span>
            {row.map((v, hr) => {
              const s = step(v, max);
              return <span key={hr} className={`heat-c${hi && hi[0] === d && hi[1] === hr ? ' on' : ''}`} style={{ background: s < 0 ? 'var(--zero)' : SEQ[s] }} onPointerEnter={() => setHi([d, hr])} />;
            })}
          </div>
        ))}
      </div>
      <div className="heat-foot">
        <span className="heat-note">{hi ? <><b>{WD[hi[0]]}曜 {hi[1]}:00〜{hi[1] + 1}:00</b>　{fmtN(cur ?? 0)}{unit}</> : '日本時間。マスに重ねると件数を表示'}</span>
        <ScaleLegend max={max} unit={unit} />
      </div>
    </div>
  );
}

function ScaleLegend({ max, unit }: { max: number; unit: string }) {
  return (
    <span className="scale">
      <small>0</small>
      <i style={{ background: 'var(--zero)' }} />
      {SEQ.map((c) => <i key={c} style={{ background: c }} />)}
      <small>{fmtN(max)}{unit}</small>
    </span>
  );
}

/* ------------------------------------------------------------------ calendar heatmap (26 weeks) */

export function Calendar({ days, unit = '人' }: { days: { day: string; n: number; weekday: number }[]; unit?: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const max = Math.max(0, ...days.map((d) => d.n));
  const lead = days.length ? days[0].weekday : 0;
  const cells: ({ day: string; n: number; weekday: number; i: number } | null)[] = [...Array(lead).fill(null), ...days.map((d, i) => ({ ...d, i }))];
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const months: { w: number; label: string }[] = [];
  weeks.forEach((wk, w) => {
    const first = wk.find((c) => c && c.day.endsWith('-01')) || (w === 0 ? wk.find(Boolean) : null);
    if (first) months.push({ w, label: `${+first.day.slice(5, 7)}月` });
  });
  const cur = hi != null ? days[hi] : null;
  const total = days.reduce((a, d) => a + d.n, 0);
  return (
    <div className="cal">
      <div className="cal-scroll">
        <div className="cal-months" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
          {months.map((m) => <span key={m.w} style={{ gridColumn: m.w + 1 }}>{m.label}</span>)}
        </div>
        <div className="cal-body">
          <div className="cal-wd">{WD.map((d, i) => <span key={d}>{i % 2 === 0 ? d : ''}</span>)}</div>
          <div className="cal-weeks" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }} onPointerLeave={() => setHi(null)}>
            {weeks.map((wk, w) => (
              <div key={w} className="cal-week">
                {Array.from({ length: 7 }, (_, d) => {
                  const c = wk[d];
                  if (!c) return <span key={d} className="cal-c blank" />;
                  const s = step(c.n, max);
                  return <span key={d} className={`cal-c${hi === c.i ? ' on' : ''}`} style={{ background: s < 0 ? 'var(--zero)' : SEQ[s] }} onPointerEnter={() => setHi(c.i)} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heat-foot">
        <span className="heat-note">{cur ? <><b>{cur.day.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, '$1年$2月$3日')}（{WD[cur.weekday]}）</b>　{fmtN(cur.n)}{unit}</> : `26 週間で延べ ${fmtN(total)}${unit}`}</span>
        <ScaleLegend max={max} unit={unit} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ histogram */

export function Histogram({ rows, h = 220, unit = '回', xTitle }: { rows: { label: string; n: number }[]; h?: number; unit?: string; xTitle?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const max = Math.max(0, ...rows.map((r) => r.n));
  const { top, ticks } = axis(max);
  const L = 40, R = 8, T = 12, B = xTitle ? 44 : 28, iw = Math.max(10, w - L - R), ih = h - T - B, n = rows.length, band = iw / n;
  const y = (v: number) => (v / top) * ih;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 36))));
  return (
    <div className="ch" ref={ref}>
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label="度数分布" onPointerLeave={() => setHi(null)}>
          {ticks.map((t) => <g key={t}><line x1={L} x2={L + iw} y1={T + ih - y(t)} y2={T + ih - y(t)} className={t ? 'grid' : 'base'} /><text x={L - 8} y={T + ih - y(t)} dy="0.32em" textAnchor="end" className="tick">{compact(t)}</text></g>)}
          {rows.map((r, i) => (
            <g key={r.label} onPointerEnter={() => setHi(i)} className={hi != null && hi !== i ? 'dim' : ''}>
              <rect x={L + band * i} y={T} width={band} height={ih} fill="transparent" />
              <path d={barPath(L + band * i + 1, T + ih - y(r.n), band - 2, y(r.n), 4)} fill="var(--s1)" className="ch-grow" />
              {i % labelEvery === 0 && <text x={L + band * i + band / 2} y={T + ih + 16} textAnchor="middle" className="tick">{r.label.replace(/〜.*/, '')}</text>}
            </g>
          ))}
          {xTitle && <text x={L + iw / 2} y={h - 6} textAnchor="middle" className="tick axis-title">{xTitle}</text>}
        </svg>
      )}
      {max === 0 && w > 0 && <div className="ch-over"><Empty h={0} /></div>}
      <Tooltip w={w} tip={hi != null && max ? { x: L + band * hi + band / 2, y: T + ih - y(rows[hi].n), body: <TipRow label={rows[hi].label} value={`${fmtN(rows[hi].n)}${unit}`} /> } : null} />
    </div>
  );
}

/* ------------------------------------------------------------------ funnel */

export function Funnel({ steps, unit = '人' }: { steps: { label: string; n: number }[]; unit?: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const top = steps[0]?.n ?? 0;
  if (!top) return <Empty h={240} />;
  return (
    <ol className="funnel" onPointerLeave={() => setHi(null)}>
      {steps.map((s, i) => {
        const f = s.n / top, prev = i ? steps[i - 1].n : s.n;
        return (
          <li key={s.label} className={hi != null && hi !== i ? 'dim' : ''} onPointerEnter={() => setHi(i)}>
            <span className="fn-label"><b>{i + 1}</b>{s.label}</span>
            <span className="fn-track"><span className="fn-bar" style={{ width: `${Math.max(f * 100, s.n ? 1.5 : 0)}%`, background: `var(--o${Math.min(6, i + 1)})`, animationDelay: `${i * 70}ms` }} /></span>
            <span className="fn-val"><b>{fmtN(s.n)}{unit}</b><small>{i ? `前の段階の ${prev ? fmtPct(s.n / prev) : '—'}` : '100%'}</small></span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ scatter / bubble */

export function Scatter({ points, h = 300, xLabel, yLabel, sizeLabel, sizeFmt = fmtN }: {
  points: { id: string; label: string; x: number; y: number; size: number; sub?: string }[]; h?: number; xLabel: string; yLabel: string; sizeLabel: string; sizeFmt?: (n: number) => string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const xa = axis(Math.max(1, ...points.map((p) => p.x)));
  const L = 48, R = 18, T = 14, B = 42, iw = Math.max(10, w - L - R), ih = h - T - B;
  const X = (v: number) => L + (v / xa.top) * iw, Y = (v: number) => T + ih - (v / 100) * ih;
  const smax = Math.max(1, ...points.map((p) => p.size));
  const rad = (s: number) => 5 + Math.sqrt(s / smax) * 16;
  // names for the 3 largest bubbles, above (else below) the bubble, never over another name
  const short = (s: string) => (s.length > 14 ? `${s.slice(0, 14)}…` : s);
  const labels = new Map<string, { x: number; y: number }>();
  if (w) {
    const boxes: [number, number, number, number][] = [];
    [...points].sort((a, b) => b.size - a.size).slice(0, 3).forEach((p) => {
      const tw = short(p.label).length * 11, x = X(p.x), r = rad(p.size);
      for (const y of [Y(p.y) - r - 6, Y(p.y) + r + 15]) {
        const b: [number, number, number, number] = [Math.max(L, Math.min(L + iw - tw, x - tw / 2)), y - 12, tw, 15];
        if (b[1] < 0 || boxes.some((o) => b[0] < o[0] + o[2] && o[0] < b[0] + b[2] && b[1] < o[1] + o[3] && o[1] < b[1] + b[3])) continue;
        boxes.push(b); labels.set(p.id, { x: b[0] + tw / 2, y }); break;
      }
    });
  }
  const cur = hi != null ? points[hi] : null;
  return (
    <div className="ch" ref={ref}>
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${xLabel}と${yLabel}の散布図`} onPointerLeave={() => setHi(null)}>
          {[0, 25, 50, 75, 100].map((t) => <g key={t}><line x1={L} x2={L + iw} y1={Y(t)} y2={Y(t)} className={t ? 'grid' : 'base'} /><text x={L - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="tick">{t}%</text></g>)}
          {xa.ticks.map((t) => <g key={t}>{t > 0 && <line x1={X(t)} x2={X(t)} y1={T} y2={T + ih} className="grid" />}<text x={X(t)} y={T + ih + 16} textAnchor="middle" className="tick">{compact(t)}</text></g>)}
          <text x={L + iw / 2} y={h - 4} textAnchor="middle" className="tick axis-title">{xLabel} →</text>
          <text x={12} y={T + ih / 2} textAnchor="middle" className="tick axis-title" transform={`rotate(-90 12 ${T + ih / 2})`}>{yLabel} →</text>
          {points.map((p, i) => (
            <g key={p.id} onPointerEnter={() => setHi(i)} className={hi != null && hi !== i ? 'dim' : ''}>
              <circle cx={X(p.x)} cy={Y(p.y)} r={rad(p.size) + 6} fill="transparent" />
              <circle cx={X(p.x)} cy={Y(p.y)} r={rad(p.size)} fill="var(--s1)" fillOpacity=".55" stroke="var(--surface)" strokeWidth="2" className="ch-pop" style={{ animationDelay: `${i * 30}ms` }} />
              {labels.has(p.id) && <text x={labels.get(p.id)!.x} y={labels.get(p.id)!.y} textAnchor="middle" className="pt-label">{short(p.label)}</text>}
            </g>
          ))}
        </svg>
      )}
      {!points.length && w > 0 && <div className="ch-over"><Empty h={0} text="再生された動画がまだありません" /></div>}
      <Tooltip w={w} tip={cur ? { x: X(cur.x), y: Y(cur.y) - rad(cur.size), body: (
        <><div className="ch-tip-h">{cur.label}{cur.sub && <span>{cur.sub}</span>}</div><TipRow label={xLabel} value={fmtN(cur.x)} /><TipRow label={yLabel} value={`${cur.y}%`} /><TipRow label={sizeLabel} value={sizeFmt(cur.size)} /></>
      ) } : null} />
      <p className="ch-foot">円の大きさ：{sizeLabel}。大きい円に名前を表示（重なる名前は省略）。円に重ねると詳細を表示</p>
    </div>
  );
}

/* ------------------------------------------------------------------ treemap (squarified) */

type TNode = { id: string; label: string; value: number; group: string };
type Rect = { x: number; y: number; w: number; h: number };
function squarify(items: TNode[], r: Rect): (TNode & Rect)[] {
  const out: (TNode & Rect)[] = [];
  const total = items.reduce((a, i) => a + i.value, 0);
  if (!total || r.w <= 0 || r.h <= 0) return out;
  const scale = (r.w * r.h) / total;
  let rest = items.map((i) => ({ ...i, area: i.value * scale }));
  let box = { ...r };
  const worst = (row: { area: number }[], side: number) => {
    const s = row.reduce((a, x) => a + x.area, 0), mx = Math.max(...row.map((x) => x.area)), mn = Math.min(...row.map((x) => x.area));
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  while (rest.length) {
    const side = Math.min(box.w, box.h);
    const row = [rest[0]];
    let i = 1;
    while (i < rest.length && worst([...row, rest[i]], side) <= worst(row, side)) { row.push(rest[i]); i++; }
    rest = rest.slice(i);
    const s = row.reduce((a, x) => a + x.area, 0);
    if (box.w >= box.h) {
      const cw = s / box.h; let y = box.y;
      row.forEach((x) => { const hh = x.area / cw; out.push({ ...x, x: box.x, y, w: cw, h: hh }); y += hh; });
      box = { x: box.x + cw, y: box.y, w: box.w - cw, h: box.h };
    } else {
      const ch = s / box.w; let x0 = box.x;
      row.forEach((x) => { const ww = x.area / ch; out.push({ ...x, x: x0, y: box.y, w: ww, h: ch }); x0 += ww; });
      box = { x: box.x, y: box.y + ch, w: box.w, h: box.h - ch };
    }
  }
  return out;
}

export function Treemap({ groups, h = 300, fmt = fmtN }: { groups: { key: string; label: string; children: { id: string; label: string; value: number }[] }[]; h?: number; fmt?: (n: number) => string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<string | null>(null);
  const items = useMemo(() => groups.flatMap((g) => g.children.map((c) => ({ ...c, group: g.label }))).sort((a, b) => b.value - a.value), [groups]);
  const total = items.reduce((a, i) => a + i.value, 0);
  const cells = w ? squarify(items, { x: 0, y: 0, w, h }) : [];
  const cur = cells.find((c) => c.id === hi);
  return (
    <div className="ch" ref={ref}>
      {groups.length > 1 && <Legend items={groups.map((g) => ({ label: g.label, color: colorOf(g.label), value: fmtPct(g.children.reduce((a, c) => a + c.value, 0) / (total || 1)) }))} />}
      {!total ? <Empty h={h} text="この期間の再生はまだありません" /> : (
        <div className="tmap" style={{ height: h }} onPointerLeave={() => setHi(null)}>
          {cells.map((c) => (
            <div key={c.id} className={`tm-c${hi && hi !== c.id ? ' dim' : ''}`} onPointerEnter={() => setHi(c.id)}
              style={{ left: c.x, top: c.y, width: Math.max(0, c.w - 2), height: Math.max(0, c.h - 2), background: colorOf(c.group) }}>
              {c.w > 84 && c.h > 40 && <><b>{c.label}</b><span>{fmt(c.value)}</span></>}
            </div>
          ))}
          {cur && <Tooltip w={w} tip={{ x: cur.x + cur.w / 2, y: cur.y + 8, body: <><div className="ch-tip-h">{cur.label}<span>{cur.group}</span></div><TipRow label="視聴時間" value={fmt(cur.value)} /><TipRow label="全体に占める割合" value={fmtPct(cur.value / total, 1)} /></> }} />}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ radar */

export function Radar({ axes, series, size = 300 }: { axes: string[]; series: Series[]; size?: number }) {
  const [hi, setHi] = useState<number | null>(null);
  const n = axes.length;
  const max = Math.max(0.0001, ...series.flatMap((s) => s.values));
  const top = Math.min(1, Math.ceil((max * 100) / 10) / 10 || 0.1);
  const C = size / 2, Rr = size / 2 - 30;
  const pt = (i: number, f: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [C + Math.cos(a) * Rr * f, C + Math.sin(a) * Rr * f]; };
  const empty = series.every((s) => s.values.every((v) => !v));
  if (n < 3) return <Empty h={size} />;
  return (
    <div className="radar">
      <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} />
      {/* wider than the plot: the axis names sit outside it */}
      <svg viewBox={`-58 -10 ${size + 116} ${size + 20}`} width="100%" style={{ maxWidth: size + 116 }} role="img" aria-label="レーダーチャート" onPointerLeave={() => setHi(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={axes.map((_, i) => pt(i, f).join(',')).join(' ')} className="grid" fill="none" />)}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.17);
          return (
            <g key={a} onPointerEnter={() => setHi(i)}>
              <line x1={C} y1={C} x2={x} y2={y} className="grid" />
              <text x={lx} y={ly} dy="0.32em" textAnchor={Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end'} className={`tick radar-ax${hi === i ? ' on' : ''}`}>{a}</text>
              <circle cx={x} cy={y} r="18" fill="transparent" />
            </g>
          );
        })}
        <text x={C + 5} y={C - Rr + 14} className="tick">{fmtPct(top)}</text>
        <text x={C + 5} y={C - Rr / 2 + 14} className="tick">{fmtPct(top / 2)}</text>
        {!empty && series.map((s) => (
          <g key={s.name}>
            <polygon points={s.values.map((v, i) => pt(i, v / top).join(',')).join(' ')} fill={s.color} fillOpacity=".12" stroke={s.color} strokeWidth="2" strokeLinejoin="round" className="ch-pop" />
            {s.values.map((v, i) => { const [x, y] = pt(i, v / top); return <circle key={i} cx={x} cy={y} r={hi === i ? 5 : 4} fill={s.color} stroke="var(--surface)" strokeWidth="2" onPointerEnter={() => setHi(i)} />; })}
          </g>
        ))}
      </svg>
      <p className="radar-note">{hi != null ? <><b>{axes[hi]}</b>　{series.map((s) => `${s.name} ${fmtPct(s.values[hi], 1)}`).join('　')}</> : empty ? 'この期間のデータはまだありません' : '軸の名前に重ねると割合を表示'}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ gauge (meter) */

export function Gauge({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const f = Math.max(0, Math.min(1, value));
  const W = 240, Rr = 96, sw = 16, C = W / 2, CY = Rr + sw / 2 + 4, H = CY + 26;
  const at = (t: number) => { const a = Math.PI * (1 - t); return [C + Rr * Math.cos(a), CY - Rr * Math.sin(a)]; };
  const [x0, y0] = at(0), [x1, y1] = at(1);
  const arc = `M${x0},${y0}A${Rr},${Rr} 0 0 1 ${x1},${y1}`;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);
  const len = Math.PI * Rr;
  return (
    <div className="gauge">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 290 }} role="img" aria-label={`${label} ${fmtPct(f)}`}>
        <path d={arc} stroke="var(--q1)" strokeWidth={sw} fill="none" strokeLinecap="round" />
        <path d={arc} stroke="var(--s1)" strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={mounted ? len * (1 - f) : len} className="gauge-fill" />
        <text x={C} y={CY - 18} textAnchor="middle" className="gauge-num">{fmtPct(f)}</text>
        <text x={C} y={CY + 2} textAnchor="middle" className="gauge-lbl">{label}</text>
        <text x={x0} y={CY + 22} textAnchor="middle" className="tick">0%</text>
        <text x={x1} y={CY + 22} textAnchor="middle" className="tick">100%</text>
      </svg>
      {sub && <p className="gauge-sub">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ sankey (3 columns) */

export function Sankey({ links, h = 300 }: { links: { from: string; to: string; n: number }[]; h?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const total0 = links.filter((l) => !l.from.startsWith('入口')).reduce((a, l) => a + l.n, 0);
  if (!links.length || !total0) return <div ref={ref}><Empty h={h} /></div>;
  // columns: 0 = sources, 1 = entries, 2 = outcomes
  const col = (name: string) => (name.startsWith('入口') ? 1 : links.some((l) => l.to === name && l.from.startsWith('入口')) ? 2 : 0);
  const names = [...new Set(links.flatMap((l) => [l.from, l.to]))];
  const value = (nm: string) => Math.max(links.filter((l) => l.from === nm).reduce((a, l) => a + l.n, 0), links.filter((l) => l.to === nm).reduce((a, l) => a + l.n, 0));
  const NW = 12, gapY = 10, padL = 0;
  const colX = (c: number) => padL + (c * (w - NW - 150)) / 2;
  const nodes = new Map<string, { x: number; y: number; h: number; c: number; out: number; in: number; color: string }>();
  [0, 1, 2].forEach((c) => {
    const list = names.filter((nm) => col(nm) === c).sort((a, b) => value(b) - value(a));
    const sum = list.reduce((a, nm) => a + value(nm), 0);
    const usable = h - gapY * Math.max(0, list.length - 1);
    let y = 0;
    list.forEach((nm) => {
      const hh = Math.max(3, (value(nm) / sum) * usable);
      nodes.set(nm, { x: colX(c), y, h: hh, c, out: 0, in: 0, color: c === 1 ? 'var(--ink-3)' : colorOf(nm) });
      y += hh + gapY;
    });
  });
  const scaleOf = (nm: string) => nodes.get(nm)!.h / value(nm);
  // each node stacks its bands in the order of the nodes at their other ends (fewest crossings)
  const outY = new Map<number, number>(), inY = new Map<number, number>();
  const idx = links.map((l, i) => ({ l, i }));
  names.forEach((nm) => {
    const nd = nodes.get(nm)!;
    let y = nd.y;
    idx.filter((x) => x.l.from === nm).sort((p, q) => nodes.get(p.l.to)!.y - nodes.get(q.l.to)!.y)
      .forEach((x) => { const hh = x.l.n * scaleOf(nm); outY.set(x.i, y + hh / 2); y += hh; });
    y = nd.y;
    idx.filter((x) => x.l.to === nm).sort((p, q) => nodes.get(p.l.from)!.y - nodes.get(q.l.from)!.y)
      .forEach((x) => { const hh = x.l.n * scaleOf(nm); inY.set(x.i, y + hh / 2); y += hh; });
  });
  const paths = links.map((l, i) => {
    const a = nodes.get(l.from)!, b = nodes.get(l.to)!;
    const ha = l.n * scaleOf(l.from), hb = l.n * scaleOf(l.to);
    const y0 = outY.get(i)!, y1 = inY.get(i)!;
    const x0 = a.x + NW, x1 = b.x, mx = (x0 + x1) / 2;
    return { i, l, d: `M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}`, sw: Math.max(1, (ha + hb) / 2), color: a.c === 0 ? a.color : b.color, mid: [mx, (y0 + y1) / 2] };
  });
  const cur = hi != null ? paths[hi] : null;
  return (
    <div className="ch" ref={ref}>
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label="流入元から行動までの流れ" onPointerLeave={() => setHi(null)}>
          {paths.map((p) => <path key={p.i} d={p.d} stroke={p.color} strokeWidth={p.sw} fill="none" strokeOpacity={hi == null ? 0.28 : hi === p.i ? 0.55 : 0.1} onPointerEnter={() => setHi(p.i)} className="sk-link" />)}
          {[...nodes].map(([nm, nd]) => (
            <g key={nm}>
              <rect x={nd.x} y={nd.y} width={NW} height={nd.h} rx="3" fill={nd.color} />
              <text x={nd.x + NW + 8} y={nd.y + nd.h / 2} dy="0.32em" className="sk-label">{nm.replace('入口：', '')}<tspan className="sk-n"> {fmtN(value(nm))}</tspan></text>
            </g>
          ))}
        </svg>
      )}
      <Tooltip w={w} tip={cur ? { x: cur.mid[0], y: cur.mid[1], body: <><div className="ch-tip-h">{cur.l.from.replace('入口：', '')} → {cur.l.to.replace('入口：', '')}</div><TipRow label="訪問（セッション）" value={`${fmtN(cur.l.n)}回`} /><TipRow label="全体に占める割合" value={fmtPct(cur.l.n / total0, 1)} /></> } : null} />
      <div className="sk-cols"><span>流入元</span><span>最初に開いたページ</span><span>行動</span></div>
    </div>
  );
}
