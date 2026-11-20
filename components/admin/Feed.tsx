/* One page load with what happened on it — the access history of the dashboard, the history page and a visitor's page.
   No client code: usable from server and client components alike. */
import type { ViewItem } from '@/lib/server/stats';
import { fmtDur, fmtPct, fmtClock, fmtShort } from '@/lib/admin-format';

const HOME = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5" /></svg>;
const PLAY = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3" /><path d="M10 9v6l5-3z" fill="currentColor" /></svg>;
const PAGE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4" /></svg>;
const EV_CLASS: Record<string, string> = { detail: 'blue', site: '', play: 'blue', q25: '', q50: '', q75: '', complete: 'green' };

export function Feed({ items, showVisitor = true, compact = false }: { items: (ViewItem & { excluded?: boolean })[]; showVisitor?: boolean; compact?: boolean }) {
  if (!items.length) return <p className="ch-empty" style={{ minHeight: 120 }}>この期間のアクセスはまだありません</p>;
  return (
    <ul className="feed">
      {items.map((v) => (
        <li key={v.id}>
          <time dateTime={new Date(v.ts).toISOString()}><b>{fmtShort(v.ts).split(' ')[0]}</b>{fmtClock(v.ts)}</time>
          <span className={`feed-ic${v.kind === 'watch' ? ' watch' : ''}`}>{v.kind === 'home' ? HOME : v.kind === 'watch' ? PLAY : PAGE}</span>
          <div className="feed-main">
            <div className="feed-h">
              <span className="page">{v.page}</span>
              {v.kind === 'watch' && (
                <span className="prog" style={{ '--f': `${Math.round(v.pct * 100)}%` } as React.CSSProperties} title="動画の最大到達位置">
                  <i /><b>{fmtPct(v.pct)}</b>
                </span>
              )}
              {v.bot && <span className="chip warn">ボット</span>}
              {v.excluded && <span className="chip">除外中</span>}
            </div>
            <div className="feed-meta">
              {showVisitor && <a className="ip" href={`/admin/visitors/${v.visitor}`}>{v.ip}</a>}
              <span>{v.browser}</span><span>{v.os}</span><span>{v.device}</span>
              {!compact && <span>{v.refHost ? `流入：${v.refHost}` : v.source}</span>}
              <span>表示 {fmtDur(v.active)}</span>
              {v.watch > 0 && <span>視聴 {fmtDur(v.watch)}</span>}
            </div>
            {v.events.length > 0 && (
              <div className="feed-ev">
                {v.events.slice(0, compact ? 6 : 30).map((e, i) => (
                  <span key={i} className={`chip ${EV_CLASS[e.name] ?? ''}`} title={`${fmtClock(e.ts)} ${e.label}`}>
                    {e.name === 'detail' || e.name === 'site' ? `${e.name === 'detail' ? '詳細' : 'プレビュー'}：${e.target.length > 22 ? `${e.target.slice(0, 22)}…` : e.target}` : e.label}
                  </span>
                ))}
                {compact && v.events.length > 6 && <span className="chip">ほか {v.events.length - 6} 件</span>}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
