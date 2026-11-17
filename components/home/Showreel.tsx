'use client';
/* Hero showreel: the thumbnails of every video cross-fade every 5.2 s (paused while the mouse is over it). */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { paths, fmtTime } from '@/lib/paths';
import { PlayGlyph } from './icons';

const HOLD = 5200;
type Item = { id: string; title: string; meta: string; duration: number };

export function Showreel({ items }: { items: Item[] }) {
  const [cur, setCur] = useState(0);
  const prog = useRef<HTMLElement>(null);
  const tc = useRef<HTMLSpanElement>(null);
  const paused = useRef(false);
  const elapsed = useRef(0);
  const v = items[cur];

  // progress bar + advance (direct style writes: no re-render per frame)
  useEffect(() => {
    elapsed.current = 0;
    if (prog.current) prog.current.style.width = '0%';
    if (items.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let last = 0, raf = 0;
    const tick = (now: number) => {
      if (last && !paused.current && !document.hidden) elapsed.current += Math.min(100, now - last);
      last = now;
      if (elapsed.current >= HOLD) { setCur((c) => (c + 1) % items.length); return; }
      if (prog.current) prog.current.style.width = `${Math.min(1, elapsed.current / HOLD) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cur, items.length]);

  // the REC timecode counts the seconds since the page opened
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      if (tc.current) tc.current.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}>
      <div className="reel-frame">
        <a className="reel-screen" href={paths.watch(v.id)} aria-label={`${v.title} を再生`}>
          {items.map((it, i) => (
            <Image key={it.id} src={paths.thumb(it.id)} alt="" fill sizes="(max-width: 1100px) 92vw, 600px" priority={i === 0} className={i === cur ? 'on' : ''} />
          ))}
          <div className="hud"><span className="rec"><i />REC</span><span className="tc" ref={tc}>00:00:00</span></div>
          <span className="reel-play" aria-hidden="true"><PlayGlyph /></span>
          <div className="reel-cap">
            <div><small>{v.meta}</small><b>{v.title}</b></div>
            {v.duration > 0 && <span className="dur">{fmtTime(v.duration)}</span>}
          </div>
          <div className="reel-prog"><i ref={prog} /></div>
        </a>
      </div>
      <div className="reel-dots" role="group" aria-label="表示する動画">
        {items.map((it, i) => (
          <button key={it.id} type="button" aria-label={it.title} aria-current={i === cur ? 'true' : 'false'} onClick={() => setCur(i)} />
        ))}
      </div>
    </div>
  );
}
