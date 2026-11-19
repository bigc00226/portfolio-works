'use client';
/* 特別: the grid of video cards and the details of one of them (home.css .vstage).
   Pointer, wide screens: resting on a card for a moment pushes the whole grid to the left (it narrows and the cards
   glide and shrink into place) and opens the card's details on the right — the full summary, tags and every
   chapter. Resting on another card swaps them; leaving the area closes them. Only pointer movement switches cards, and
   only once the pointer rests, so the grid sliding under a still pointer, or a pointer crossing cards on its way to the
   details, never changes what is open. Clicking a card plays it.
   Touch and narrow screens (≤900px, hover: none): a tap opens the details as a sheet from the bottom.
   Keyboard: focusing a card shows its details; Esc closes. */
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { VideoEntry } from '@/lib/registry';
import { paths, fmtTime } from '@/lib/paths';
import { VideoCard } from './VideoCard';
import { Close, Play, PlayGlyph } from './icons';

type Cat = { label: string; color: string };
const SHEET = '(max-width: 900px), (hover: none)'; // the same switch as in home.css
const OPEN_MS = 130, SWAP_MS = 170, CLOSE_MS = 260;
const sec = (ms: number) => Math.round(ms / 100) / 10;
const sheetMode = () => matchMedia(SHEET).matches;
const cardOf = (t: EventTarget | null) => (t as Element | null)?.closest?.<HTMLElement>('.vcard') ?? null;

export function VideoStage({ videos, catFor }: { videos: VideoEntry[]; catFor: (id: string) => Cat }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const timer = useRef(0);
  const isOpen = useRef(false);
  const before = useRef<Map<HTMLElement, DOMRect> | null>(null);
  const v = videos.find((x) => x.id === active) ?? null;

  // The grid changes its width in one step; the cards then glide from where they were to where they are (FLIP:
  // transforms only — no layout or repaint per frame, smooth even without a GPU). Only the cards near the screen move.
  const snapshot = () => {
    if (!stage.current || sheetMode() || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const m = new Map<HTMLElement, DOMRect>();
    stage.current.querySelectorAll<HTMLElement>('.vcard').forEach((c) => {
      const r = c.getBoundingClientRect();
      if (r.bottom > -100 && r.top < innerHeight + 100) m.set(c, r);
    });
    before.current = m;
  };
  useLayoutEffect(() => {
    const m = before.current;
    before.current = null;
    if (!m) return;
    m.forEach((r0, el) => {
      const r1 = el.getBoundingClientRect();
      if (!r1.width || !r1.height) return;
      const dx = r0.left - r1.left, dy = r0.top - r1.top, sx = r0.width / r1.width, sy = r0.height / r1.height;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01) return;
      el.animate([
        { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: '0 0', transform: 'none' },
      ], { duration: 720, easing: 'cubic-bezier(.2, .75, .2, 1)' });
    });
  }, [open]);

  const stop = () => clearTimeout(timer.current);
  const later = (fn: () => void, ms: number) => { stop(); timer.current = window.setTimeout(fn, ms); };
  const show = (id: string, asSheet = false) => {
    stop();
    if (!isOpen.current && !asSheet) snapshot();
    isOpen.current = true;
    setSheet(asSheet); setActive(id); setOpen(true);
  };
  const hide = () => {
    stop();
    if (isOpen.current && !sheet) snapshot();
    isOpen.current = false;
    setOpen(false);
  };
  const hideRef = useRef(hide);
  useEffect(() => { hideRef.current = hide; });

  // the stage is at least as tall as the details while they are open (a short grid would cut them off)
  useEffect(() => {
    const el = inner.current, st = stage.current;
    if (!el || !st) return;
    const ro = new ResizeObserver(() => st.style.setProperty('--vd-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(timer.current); };
  }, []);

  // a new video starts at the top of the details
  useEffect(() => { inner.current?.scrollTo({ top: 0 }); }, [active]);

  // Esc closes; the sheet holds the page still and takes the focus while it is open, then gives it back
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hideRef.current(); };
    document.addEventListener('keydown', onKey);
    const root = document.documentElement;
    if (sheet) { root.classList.add('lock'); closeBtn.current?.focus({ preventScroll: true }); }
    return () => {
      document.removeEventListener('keydown', onKey);
      if (sheet) { root.classList.remove('lock'); opener.current?.focus({ preventScroll: true }); }
    };
  }, [open, sheet]);

  const cat = v ? catFor(v.id) : null;
  return (
    <div className={`vstage${open ? ' peek' : ''}`} ref={stage}
      onPointerMove={(e) => {
        if (e.pointerType === 'touch' || sheetMode()) return;
        const card = cardOf(e.target);
        if (!card) { stop(); return; } // between the cards or on the details: keep what is open
        const id = card.dataset.id!;
        if (open && id === active) { stop(); return; }
        later(() => show(id), open ? SWAP_MS : OPEN_MS); // restarts on every move: switches only once the pointer rests
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'touch' || sheetMode()) return;
        if (open) later(hide, CLOSE_MS); else stop();
      }}
      onClick={(e) => {
        const card = cardOf(e.target);
        if (!card || !sheetMode()) return; // wide screens: the card is a link to the player
        e.preventDefault();
        opener.current = card;
        show(card.dataset.id!, true);
      }}
      onFocus={(e) => {
        const card = cardOf(e.target);
        if (card && !sheetMode() && card.matches(':focus-visible')) show(card.dataset.id!);
      }}
      onBlur={(e) => {
        if (sheet || stage.current?.contains(e.relatedTarget as Node | null)) return;
        if (!stage.current?.matches(':hover')) hide();
      }}>
      <div className="vgrid-wrap">
        <div className="vgrid">
          {videos.map((x, i) => <VideoCard key={x.id} v={x} i={i} cat={catFor(x.id)} on={open && x.id === active} />)}
        </div>
      </div>
      <div className="vdetail" inert={!open}
        {...(sheet ? { role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'vd-title' } : { role: 'region', 'aria-label': '動画の詳細' })}>
        <div className="vd-backdrop" onClick={hide} />
        <div className="vd-in" ref={inner} style={{ '--c': cat?.color } as React.CSSProperties}>
          <button type="button" className="vd-close" ref={closeBtn} aria-label="閉じる" onClick={hide}><Close /></button>
          {v && cat && <Detail key={v.id} v={v} cat={cat} />}
        </div>
      </div>
    </div>
  );
}

/* everything about one video (no date): the thumbnail (plays it), tools / number of steps, title, client, the full summary, tags,
   the chapter bar and list (each chapter starts the player there) */
function Detail({ v, cat }: { v: VideoEntry; cat: Cat }) {
  const [hl, setHl] = useState<number | null>(null);
  const ch = v.chapterList.slice(1); // the opening title is not a chapter of the work
  const hover = (c: number) => ({ onMouseEnter: () => setHl(c), onMouseLeave: () => setHl(null) });
  return (
    <div className="vd-body">
      <a className="vd-media" href={paths.watch(v.id)} aria-label={`${v.title} を再生`}>
        <Image src={paths.thumb(v.id)} alt="" fill sizes="(max-width: 900px) 100vw, 540px" />
        <span className="vcat"><i />{cat.label}</span>
        {v.duration > 0 && <span className="dur">{fmtTime(v.duration)}</span>}
        <span className="reel-play" aria-hidden="true"><PlayGlyph /></span>
      </a>
      <div className="vd-text">
        <div className="meta-line">
          <span className="tool">{v.tool}</span>
          {ch.length > 0 && <><span className="sep" /><span>{ch.length} 工程</span></>}
        </div>
        <h4 id="vd-title">{v.title}</h4>
        <p className="client">{v.client} ／ {v.url}</p>
        <p className="sum">{v.summary}</p>
        {v.tags.length > 0 && <div className="tags">{v.tags.map((x) => <span key={x}>{x}</span>)}</div>}
        {ch.length > 0 && (
          <>
            <div className="chap-head"><span>チャプター</span><span>選ぶとその場面から再生</span></div>
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
          </>
        )}
        <div className="vd-actions">
          <a className="btn btn-primary" href={paths.watch(v.id)}><Play />動画を再生{v.duration > 0 && <small>{fmtTime(v.duration)}</small>}</a>
        </div>
      </div>
    </div>
  );
}
