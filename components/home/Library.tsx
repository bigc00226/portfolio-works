'use client';
/* WORKS: the tabbed library (特別 = every video, 一般 / デモ / ゲーム = the sites of content/sites.ts) and the live preview.
   The selected tab is kept in the URL hash (#special, #general …); links with data-go="<tab>" anywhere on the page pick a tab. */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteEntry, VideoEntry } from '@/lib/registry';
import type { Tab, TabKey } from '@/lib/types';
import { FeatureCard } from './FeatureCard';
import { SiteCard as SiteCardView } from './SiteCard';
import { SitePreview, type SitePreviewHandle } from './SitePreview';
import { Scroll, TabIconOf } from './icons';

export type SiteCard = SiteEntry & { full: { width: number; height: number }; scrollSec: number };
type SiteKey = Exclude<TabKey, 'special'>;
type SelectOpts = { scroll?: false | 'library'; instant?: boolean; silent?: boolean };

export function Library({ tabs, videos, sites }: { tabs: Tab[]; videos: VideoEntry[]; sites: Record<SiteKey, SiteCard[]> }) {
  const [current, setCurrent] = useState<TabKey>(tabs[0].key);
  const tabsEl = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLSpanElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const library = useRef<HTMLElement>(null);
  const panels = useRef<Partial<Record<TabKey, HTMLElement | null>>>({});
  const preview = useRef<SitePreviewHandle>(null);
  const countOf = (key: TabKey) => (key === 'special' ? videos.length : sites[key].length);

  const tabButton = (key: TabKey) => tabsEl.current?.querySelector<HTMLButtonElement>(`[data-tab="${key}"]`) ?? null;
  const placeInk = useCallback(() => {
    const sel = tabsEl.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!sel || !ink.current) return;
    const cs = getComputedStyle(sel), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
    ink.current.style.left = `${sel.offsetLeft + pl}px`;
    ink.current.style.width = `${sel.offsetWidth - pl - pr}px`;
  }, []);

  const select = useCallback((key: string, opts: SelectOpts = {}) => {
    const k = (tabs.some((t) => t.key === key) ? key : tabs[0].key) as TabKey;
    setCurrent(k);
    const strip = tabsEl.current, sel = tabButton(k);
    if (strip && sel && strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: sel.offsetLeft - 16, behavior: 'smooth' });
    if (!opts.silent && location.hash !== `#${k}`) history.replaceState(null, '', `#${k}`);
    const anchorY = (anchor.current?.getBoundingClientRect().top ?? 0) + scrollY;
    if (opts.scroll === 'library' && library.current) scrollTo({ top: library.current.getBoundingClientRect().top + scrollY - 8, behavior: opts.instant ? 'instant' : 'smooth' });
    else if (opts.scroll !== false && scrollY > anchorY + 1) scrollTo({ top: anchorY, behavior: 'smooth' });
  }, [tabs]);

  // the ink under the selected tab, and the entry animation of the panel that just opened
  useEffect(() => {
    placeInk();
    const p = panels.current[current];
    if (p) { p.classList.remove('anim'); void p.offsetWidth; p.classList.add('anim'); }
  }, [current, placeInk]);

  useEffect(() => {
    addEventListener('resize', placeInk);
    document.fonts?.ready.then(placeInk);
    // #<tab> in the URL opens that tab (after the first paint: the server rendered the first tab)
    const initial = location.hash.slice(1);
    if (tabs.some((t) => t.key === initial)) {
      requestAnimationFrame(() => {
        select(initial, { scroll: false });
        requestAnimationFrame(() => select(initial, { scroll: 'library', instant: true }));
      });
    }
    const onHash = () => { const k = location.hash.slice(1); if (tabs.some((t) => t.key === k)) select(k, { scroll: 'library' }); };
    const onGo = (e: MouseEvent) => {
      const go = (e.target as Element | null)?.closest<HTMLElement>('[data-go]');
      if (!go) return;
      e.preventDefault();
      select(go.dataset.go!, { scroll: 'library' });
    };
    addEventListener('hashchange', onHash);
    document.addEventListener('click', onGo);
    return () => { removeEventListener('resize', placeInk); removeEventListener('hashchange', onHash); document.removeEventListener('click', onGo); };
  }, [placeInk, select, tabs]);

  const onKey = (e: React.KeyboardEvent) => {
    const list = tabs.map((t) => tabButton(t.key));
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const to = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[e.key];
    if (to == null) return;
    e.preventDefault();
    const t = tabs[(to + tabs.length) % tabs.length];
    tabButton(t.key)?.focus();
    select(t.key);
  };

  return (
    <section className="library" id="library" aria-labelledby="libTitle" ref={library}>
      <div className="container">
        <div className="sec-head">
          <p className="sec-eyebrow">WORKS</p>
          <h2 id="libTitle">制作の記録</h2>
          <p>制作過程の動画・制作実績・公開中のデモ・ゲームを、タブで切り替えてご覧いただけます。</p>
        </div>
      </div>
      <div ref={anchor} />
      <div className="tabs-wrap">
        <div className="container">
          <div className="tabs" role="tablist" aria-label="カテゴリー" ref={tabsEl} onKeyDown={onKey}>
            {tabs.map((t) => {
              const n = countOf(t.key), on = t.key === current;
              return (
                <button key={t.key} type="button" className="tab" role="tab" id={`tab-${t.key}`} aria-controls={`panel-${t.key}`} aria-selected={on}
                  tabIndex={on ? 0 : -1} data-tab={t.key} onClick={() => select(t.key)}>
                  <TabIconOf icon={t.icon} /><span>{t.label}</span><span className={`n${n ? '' : ' zero'}`}>{n}</span>
                  {t.isNew && <span className="new-badge">NEW</span>}
                </button>
              );
            })}
            <span className="tab-ink" ref={ink} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="container">
        {tabs.map((t) => {
          const n = countOf(t.key);
          return (
            <section key={t.key} className="panel" role="tabpanel" id={`panel-${t.key}`} aria-labelledby={`tab-${t.key}`} tabIndex={-1}
              hidden={t.key !== current} ref={(el) => { panels.current[t.key] = el; }}>
              <div className="panel-head">
                <div><h3>{t.title}<small>{t.en}</small></h3><p>{t.lead}</p></div>
                {t.hint && n > 0 && <p className="hint"><Scroll />{t.hint}</p>}
              </div>
              {n === 0 ? (
                <div className="empty item">
                  <div className="empty-ic"><TabIconOf icon={t.icon} /></div>
                  <span className="empty-badge">NO DATA</span>
                  <h4>{t.empty?.title || '現在、掲載しているものはありません'}</h4>
                  {t.empty?.text && <p>{t.empty.text}</p>}
                </div>
              ) : t.key === 'special' ? (
                <div className="features">{videos.map((v, i) => <FeatureCard key={v.id} v={v} i={i} />)}</div>
              ) : (
                <div className="sgrid">
                  {sites[t.key].map((s, i) => (
                    <SiteCardView key={s.id} s={s} i={i} tab={t} onOpen={(k, dev) => preview.current?.open(sites[t.key as SiteKey], k, dev)} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <SitePreview ref={preview} />
    </section>
  );
}
