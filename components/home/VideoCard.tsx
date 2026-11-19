/* 特別: one video as a card — the thumbnail (platform, length, play on hover), the title and the tool / date.
   The whole card links to the player. Everything else about the video (full summary, tags, chapters) opens beside the
   grid when the pointer rests on the card (VideoStage.tsx). */
import Image from 'next/image';
import type { VideoEntry } from '@/lib/registry';
import { paths, fmtTime, jdate } from '@/lib/paths';
import { PlayGlyph } from './icons';

export function VideoCard({ v, i, cat, on }: { v: VideoEntry; i: number; cat: { label: string; color: string }; on: boolean }) {
  return (
    <a className={`vcard item spot${on ? ' on' : ''}`} href={paths.watch(v.id)} data-id={v.id} aria-label={`${v.title}（${v.tool}）を再生`}
      style={{ '--i': i, '--c': cat.color } as React.CSSProperties}>
      <span className="vthumb">
        <Image src={paths.thumb(v.id)} alt="" fill sizes="(max-width: 760px) 46vw, (max-width: 1100px) 46vw, 400px" />
        <span className="vcat"><i />{cat.label}</span>
        {v.duration > 0 && <span className="dur">{fmtTime(v.duration)}</span>}
        <span className="vplay" aria-hidden="true"><PlayGlyph /></span>
      </span>
      <span className="vbody">
        <h4>{v.title}</h4>
        <span className="vmeta">
          <span className="tool">{v.tool}</span>
          {jdate(v.recorded) && <><span className="sep" /><span>{jdate(v.recorded)}</span></>}
        </span>
      </span>
    </a>
  );
}
