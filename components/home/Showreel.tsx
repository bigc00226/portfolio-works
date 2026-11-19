'use client';
/*
 * Hero showreel: the thumbnails of every video cross-fade every 5.2 s (paused while the pointer is over it), inside a
 * window frame with a slowly turning light border. The frame tilts toward the pointer (3D); a row of thumbnails, the
 * counter and ← → pick another one. Floating chips show how many videos each platform has.
 */
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { paths, fmtTime } from '@/lib/paths';
import { Next, PlayGlyph, Prev } from './icons';

const HOLD = 5200;
type Item = { id: string; title: string; meta: string; url: string; duration: number };

export function Showreel({ items, chips }: { items: Item[]; chips: { label: string; color: string; n: number }[] }) {
  const [cur, setCur] = useState(0);
  const prog = useRef<HTMLElement>(null);
  const tc = useRef<HTMLSpanElement>(null);
  const reel = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const elapsed = useRef(0);
  const n = items.length;
  const v = items[cur];
  const go = useCallback((d: number) => setCur((c) => (c + d + n) % n), [n]);

  // progress bar + advance (direct style writes: no re-render per frame)
  useEffect(() => {
    elapsed.current = 0;
    if (prog.current) prog.current.style.width = '0%';
    if (n < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let last = 0, raf = 0;
    const tick = (now: number) => {
      if (last && !paused.current && !document.hidden) elapsed.current += Math.min(100, now - last);
      last = now;
      if (elapsed.current >= HOLD) { setCur((c) => (c + 1) % n); return; }
      if (prog.current) prog.current.style.width = `${Math.min(1, elapsed.current / HOLD) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cur, n]);

  // keep the current thumbnail in the middle of the row
  useEffect(() => {
    const row = strip.current, b = row?.children[cur] as HTMLElement | undefined;
    if (row && b) row.scrollTo({ left: b.offsetLeft - row.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
  }, [cur]);

  // the REC timecode counts the seconds since the page opened
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      if (tc.current) tc.current.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((x) => String(x).padStart(2, '0')).join(':');
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // tilt toward the pointer
  const onMove = (e: React.PointerEvent) => {
    const el = reel.current;
    if (!el || e.pointerType !== 'mouse' || !document.documentElement.classList.contains('motion')) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.classList.add('tilting');
    el.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
  };
  const onLeave = () => {
    paused.current = false;
    const el = reel.current;
    if (!el) return;
    el.classList.remove('tilting');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  };

  return (
    <div onPointerEnter={() => { paused.current = true; }} onPointerLeave={onLeave} onPointerMove={onMove}>
      <div className="reel" ref={reel}>
        <span className="reel-glow" aria-hidden="true" />
        <div className="reel-frame">
          <div className="reel-bar" aria-hidden="true"><i /><i /><i /><span>{v.url}</span></div>
          <a className="reel-screen" href={paths.watch(v.id)} aria-label={`${v.title} を再生`}>
            {items.map((it, i) => (
              <Image key={it.id} src={paths.thumb(it.id)} alt="" fill sizes="(max-width: 1100px) 92vw, 640px" priority={i === 0} className={i === cur ? 'on' : ''} />
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
        {chips.slice(0, 3).map((c, i) => (
          <span key={c.label} className={`chip-float c${i + 1}`} style={{ '--c': c.color } as React.CSSProperties} aria-hidden="true"><i />{c.label} {c.n} 本</span>
        ))}
      </div>
      <div className="reel-nav">
        <span className="reel-count"><b>{String(cur + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}</span>
        <div className="reel-thumbs" ref={strip} role="group" aria-label="表示する動画">
          {items.map((it, i) => (
            <button key={it.id} type="button" aria-label={it.title} aria-current={i === cur ? 'true' : 'false'} onClick={() => setCur(i)}>
              <Image src={paths.thumb(it.id)} alt="" fill sizes="48px" />
            </button>
          ))}
        </div>
        <div className="reel-arrows">
          <button type="button" aria-label="前の動画" onClick={() => go(-1)}><Prev /></button>
          <button type="button" aria-label="次の動画" onClick={() => go(1)}><Next /></button>
        </div>
      </div>
    </div>
  );
}
