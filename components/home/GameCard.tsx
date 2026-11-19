'use client';
/* ゲーム: one game as a card — the PC screenshot with the phone view on top (both open the live preview to play),
   name, subtitle, summary, tags, and the two ways to play. */
import Image from 'next/image';
import type { SiteCard as Card } from './Library';
import type { Tab } from '@/lib/types';
import { paths } from '@/lib/paths';
import { Ext, Play } from './icons';

export function GameCard({ s, i, tab, onOpen }: { s: Card; i: number; tab: Tab; onOpen: (i: number, dev?: 'pc' | 'sp') => void }) {
  return (
    <article className="gcard item spot" id={`site-${s.id}`} style={{ '--i': i, '--accent': s.accent || '#888' } as React.CSSProperties}>
      <button type="button" className="gshot" onClick={() => onOpen(i)} aria-label={`${s.name} を遊ぶ`}>
        <Image src={paths.siteShot(s.id, 'pc')} alt={`${s.name} のタイトル画面`} fill sizes="(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 400px" />
        <span className="gphone"><Image src={paths.siteShot(s.id, 'sp')} alt="" fill sizes="90px" /></span>
        <span className="gplay"><Play />遊んでみる</span>
      </button>
      <div className="gbody">
        <div className="dhead">
          <Image src={s.logo} alt="" width={40} height={40} unoptimized />
          <div>
            <div className="dnum">{tab.num} {String(i + 1).padStart(2, '0')}</div>
            <h4>{s.name}</h4>
            <p>{s.title}</p>
          </div>
        </div>
        <p className="sum">{s.summary}</p>
        <div className="tags">{s.tags.map((x) => <span key={x}>{x}</span>)}</div>
        <div className="gfoot">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpen(i)}><Play />遊んでみる</button>
          <a className="btn btn-ghost btn-sm" href={s.url} target="_blank" rel="noopener">新しいタブ<Ext /></a>
        </div>
      </div>
    </article>
  );
}
