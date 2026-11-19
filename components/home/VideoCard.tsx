/* 特別: one video as a card — thumbnail (platform, length, play on hover), title, client, summary and the chapter bar. */
import Image from 'next/image';
import type { VideoEntry } from '@/lib/registry';
import { paths, fmtTime, jdate } from '@/lib/paths';
import { PlayGlyph } from './icons';

export function VideoCard({ v, i, cat }: { v: VideoEntry; i: number; cat: { label: string; color: string } }) {
  const ch = v.chapterList.slice(1);
  return (
    <article className="vcard item spot" style={{ '--i': i, '--c': cat.color } as React.CSSProperties}>
      <a className="vthumb" href={paths.watch(v.id)} aria-label={`${v.title} を再生`}>
        <Image src={paths.thumb(v.id)} alt="" fill sizes="(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 400px" />
        <span className="vcat"><i />{cat.label}</span>
        {v.duration > 0 && <span className="dur">{fmtTime(v.duration)}</span>}
        <span className="vplay" aria-hidden="true"><PlayGlyph /></span>
      </a>
      <div className="vbody">
        <div className="meta-line">
          <span className="tool">{v.tool}</span>
          {jdate(v.recorded) && <><span className="sep" /><span>{jdate(v.recorded)}</span></>}
        </div>
        <h4><a href={paths.watch(v.id)}>{v.title}</a></h4>
        <p className="client">{v.client}</p>
        <p className="sum">{v.summary}</p>
        {ch.length > 0 && (
          <>
            <div className="vchap" aria-hidden="true">
              {ch.map((c, k) => <i key={c.index} style={{ '--f': c.len, '--k': k } as React.CSSProperties} />)}
            </div>
            <div className="vchap-label"><span>{ch.length} 工程</span><span>{ch[0].name} → {ch[ch.length - 1].name}</span></div>
          </>
        )}
      </div>
    </article>
  );
}
