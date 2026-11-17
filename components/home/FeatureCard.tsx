'use client';
/* 特別: one video — thumbnail, chapter bar + list (each chapter starts the player there), title, summary, tags. */
import Image from 'next/image';
import { useState } from 'react';
import type { VideoEntry } from '@/lib/registry';
import { paths, fmtTime, jdate } from '@/lib/paths';
import { Play, PlayGlyph, Spark } from './icons';

const sec = (ms: number) => Math.round(ms / 100) / 10;

export function FeatureCard({ v, i }: { v: VideoEntry; i: number }) {
  const [hl, setHl] = useState<number | null>(null);
  const ch = v.chapterList.slice(1); // the opening title is not a chapter of the work
  const hover = (c: number) => ({ onMouseEnter: () => setHl(c), onMouseLeave: () => setHl(null) });
  return (
    <article className="feature item" style={{ '--i': i } as React.CSSProperties}>
      <div className="fmedia-col">
        <a className="fmedia" href={paths.watch(v.id)} aria-label={`${v.title} を再生`}>
          <Image src={paths.thumb(v.id)} alt="" fill sizes="(max-width: 1100px) 92vw, 640px" />
          <span className="pick"><Spark />特別編</span>
          {v.duration > 0 && <span className="dur">{fmtTime(v.duration)}</span>}
          <span className="play" aria-hidden="true"><PlayGlyph /></span>
        </a>
        {ch.length > 0 && (
          <div className="fchap">
            <div className="chap-head"><span>チャプター</span><span>{ch.length} 工程</span></div>
            <div className="chap-bar" aria-hidden="true">
              {ch.map((c) => (
                <a key={c.index} href={paths.watch(v.id, sec(c.t))} tabIndex={-1} title={c.name} className={hl === c.index ? 'hl' : undefined}
                  style={{ '--f': c.len } as React.CSSProperties} {...hover(c.index)} />
              ))}
            </div>
            <ol className="chap-list">
              {ch.map((c) => (
                <li key={c.index}>
                  <a href={paths.watch(v.id, sec(c.t))} className={hl === c.index ? 'hl' : undefined} {...hover(c.index)}>
                    <time>{fmtTime(c.t)}</time><span>{c.name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <div className="fbody">
        <div className="meta-line">
          <span className="tool">{v.tool}</span>
          {jdate(v.recorded) && <><span className="sep" /><span>{jdate(v.recorded)}</span></>}
        </div>
        <h4><a href={paths.watch(v.id)}>{v.title}</a></h4>
        <p className="client">{v.client} ／ {v.url}</p>
        <p className="sum">{v.summary}</p>
        <div className="tags">{v.tags.map((x) => <span key={x}>{x}</span>)}</div>
        <div className="actions">
          <a className="btn btn-primary btn-sm" href={paths.watch(v.id)}><Play />動画を再生{v.duration > 0 && <small>{fmtTime(v.duration)}</small>}</a>
        </div>
      </div>
    </article>
  );
}
