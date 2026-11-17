'use client';
/* Live preview: the real site in an iframe, at PC (1440×900) or smartphone (390×844) size, scaled to the dialog.
   Prev / next move within the list of the tab the site came from. */
import Image from 'next/image';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { SiteCard } from './Library';
import { paths, host } from '@/lib/paths';
import { Close, Ext, Lock, Monitor, Next, Phone, Prev, Reload } from './icons';

type Dev = 'pc' | 'sp';
const SIZE: Record<Dev, [number, number, number]> = { pc: [1440, 900, 0], sp: [390, 844, 12] };
const NOTE = '実際のサイトをそのまま表示しています。自由に操作してお試しください。';

export type SitePreviewHandle = { open: (list: SiteCard[], i: number, dev?: Dev) => void };

export const SitePreview = forwardRef<SitePreviewHandle>(function SitePreview(_, ref) {
  const dlg = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const device = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ list: SiteCard[]; i: number; dev: Dev } | null>(null);
  const [load, setLoad] = useState(0); // bumps on every (re)load of the frame
  const [loaded, setLoaded] = useState(false);
  const s = state ? state.list[state.i] : null;

  useImperativeHandle(ref, () => ({
    open(list, i, dev) {
      const n = list.length;
      setState((prev) => ({ list, i: ((i % n) + n) % n, dev: dev ?? prev?.dev ?? (innerWidth < 760 ? 'sp' : 'pc') }));
      setLoad((x) => x + 1);
      if (dlg.current && !dlg.current.open) { document.documentElement.classList.add('lock'); dlg.current.showModal(); }
    },
  }), []);

  const layout = useCallback(() => {
    if (!state || !dlg.current?.open || !stage.current || !device.current) return;
    const [w, h, b] = SIZE[state.dev], r = stage.current.getBoundingClientRect(), pad = innerWidth < 760 ? 16 : 40;
    const sc = Math.min((r.width - pad) / (w + b * 2), (r.height - pad) / (h + b * 2), 1);
    Object.assign(device.current.style, { width: `${w}px`, height: `${h}px`, transform: `translate(-50%, -50%) scale(${sc})` });
  }, [state]);
  useEffect(() => { layout(); addEventListener('resize', layout); return () => removeEventListener('resize', layout); }, [layout]);

  // the placeholder (the captured first view) shows until the frame loaded, at most 15 s
  useEffect(() => {
    if (!load) return;
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 15000);
    return () => clearTimeout(t);
  }, [load]);

  const step = (d: number) => {
    if (!state) return;
    setState({ ...state, i: (state.i + d + state.list.length) % state.list.length });
    setLoad((x) => x + 1);
  };
  const nameAt = (d: number) => (state ? state.list[(state.i + d + state.list.length) % state.list.length]?.name : '');
  const onClose = () => {
    document.documentElement.classList.remove('lock');
    const back = s && document.getElementById(`site-${s.id}`)?.querySelector<HTMLElement>('.browser');
    setState(null);
    setLoad(0);
    back?.focus({ preventScroll: true });
  };

  return (
    <dialog className="pv" ref={dlg} aria-labelledby="pvName" onClose={onClose} onClick={(e) => { if (e.target === dlg.current) dlg.current.close(); }}>
      <div className="pv-top">
        <div className="pv-title">{s && <Image src={s.logo} alt="" width={26} height={26} unoptimized />}<b id="pvName">{s ? `${s.name} ― ${s.title}` : ''}</b></div>
        <div className="pv-addr"><Lock /><span>{s ? host(s.url) : ''}</span></div>
        <div className="seg" role="group" aria-label="表示サイズ">
          <button type="button" aria-pressed={state?.dev === 'pc'} onClick={() => state && setState({ ...state, dev: 'pc' })}><Monitor />PC</button>
          <button type="button" aria-pressed={state?.dev === 'sp'} onClick={() => state && setState({ ...state, dev: 'sp' })}><Phone />スマホ</button>
        </div>
        <button type="button" className="ic-btn" aria-label="再読み込み" title="再読み込み" onClick={() => setLoad((x) => x + 1)}><Reload /></button>
        <a className="ic-btn" href={s?.url} target="_blank" rel="noopener" aria-label="新しいタブで開く" title="新しいタブで開く"><Ext /></a>
        <button type="button" className="ic-btn" aria-label="閉じる" title="閉じる (Esc)" onClick={() => dlg.current?.close()}><Close /></button>
      </div>
      <div className="pv-stage" ref={stage} style={{ '--accent': s?.accent || '#888' } as React.CSSProperties}>
        <div className={`pv-device${state?.dev === 'sp' ? ' sp' : ''}${loaded ? ' loaded' : ''}`} ref={device}>
          {s && (
            <iframe key={`${s.id}-${load}`} src={s.url} title="サイトのライブプレビュー" allow="fullscreen; clipboard-write" referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setTimeout(() => setLoaded(true), 250)} />
          )}
          {s && state && <Image className="pv-ph" src={paths.siteShot(s.id, state.dev)} alt="" fill sizes="(max-width: 760px) 100vw, 1440px" />}
          <div className="pv-load"><span className="spin" />読み込み中…</div>
        </div>
      </div>
      <div className="pv-foot">
        <button type="button" hidden={!state || state.list.length < 2} onClick={() => step(-1)}><Prev /><span>{nameAt(-1)}</span></button>
        <span className="note">{s?.note || NOTE}</span>
        <button type="button" hidden={!state || state.list.length < 2} onClick={() => step(1)}><span>{nameAt(1)}</span><Next /></button>
      </div>
    </dialog>
  );
});
