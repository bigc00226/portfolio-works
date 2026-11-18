'use client';
/* 一般 / デモ / ゲーム: one site — a browser preview that scrolls the whole page on hover, a phone preview, and the details.
   Both previews (and the button) open the live preview dialog. */
import Image from 'next/image';
import type { SiteCard as Card } from './Library';
import type { Tab } from '@/lib/types';
import { paths, host } from '@/lib/paths';
import { Ext, Eye, Lock } from './icons';

export function SiteCard({ s, i, tab, onOpen }: { s: Card; i: number; tab: Tab; onOpen: (i: number, dev?: 'pc' | 'sp') => void }) {
  // the games (ゲーム tab) are played inside the same preview
  const game = tab.key === 'game';
  return (
    <article className="scard item" id={`site-${s.id}`} style={{ '--i': i, '--accent': s.accent || '#888' } as React.CSSProperties}>
      <div className="dstage">
        <button type="button" className="browser" onClick={() => onOpen(i)} aria-label={game ? `${s.name} を遊ぶ` : `${s.name} のライブプレビューを開く`}>
          <span className="bbar">
            <span className="dots"><i /><i /><i /></span>
            <span className="addr"><Image src={s.icon} alt="" width={13} height={13} unoptimized /><span>{host(s.url)}</span></span>
          </span>
          <span className="bview">
            <Image src={paths.siteShot(s.id, 'full')} alt={`${s.name} のトップページ`} width={s.full.width} height={s.full.height}
              sizes="(max-width: 1100px) 90vw, 560px" style={{ height: 'auto', '--dur': `${s.scrollSec.toFixed(2)}s` } as React.CSSProperties} />
            <span className="bhint"><Eye />{game ? 'クリックでこのまま遊べます' : 'クリックでライブプレビュー'}</span>
          </span>
        </button>
        <button type="button" className="phone" onClick={() => onOpen(i, 'sp')} aria-label={`${s.name} をスマホ表示でプレビュー`}>
          <Image src={paths.siteShot(s.id, 'sp')} alt="" width={390} height={844} sizes="200px" />
        </button>
      </div>
      <div className="dbody">
        <div className="dhead">
          <Image src={s.logo} alt="" width={46} height={46} unoptimized />
          <div>
            <div className="dnum">{tab.num} {String(i + 1).padStart(2, '0')}</div>
            <h4>{s.name}</h4>
            <p>{s.title}</p>
          </div>
        </div>
        <p className="sum">{s.summary}</p>
        <div className="tags">{s.tags.map((x) => <span key={x}>{x}</span>)}</div>
        {s.note && <p className="snote"><Lock /><span>{s.note}</span></p>}
        <div className="dfoot">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpen(i)}><Eye />{game ? '遊んでみる' : 'ライブプレビュー'}</button>
          <a className="btn btn-ghost btn-sm" href={s.url} target="_blank" rel="noopener">{game ? '新しいタブで遊ぶ' : 'サイトを開く'}<Ext /></a>
          <div className="stack">{s.stack.map((x) => <span key={x}>{x}</span>)}</div>
        </div>
      </div>
    </article>
  );
}
