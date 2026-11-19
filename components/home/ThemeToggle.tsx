'use client';
/* The light / dark switch in the header — a small sky whose knob is the sun by day and the moon by night.
   The theme lives in html[data-theme]: set before the first paint by the script in app/(site)/layout.tsx (the saved
   choice in localStorage "pp-theme", else the system's), switched here and saved once the visitor picks one.
   Switching: where View Transitions exist, the new theme opens as a circle from the switch (home.css ::view-transition-*);
   elsewhere the colours fade (html.theme-fade). Either way the hero's sun sets / moon rises and the stars come out
   (CSS transitions on [data-theme]). With prefers-reduced-motion (also Windows' "Show animations" turned off) nothing
   travels: the colours cross-fade and the sun / moon / stars fade in place. */
import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'pp-theme';
const BG: Record<Theme, string> = { light: '#f5f7fc', dark: '#05070f' };

const read = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // while the visitor has not chosen, follow the system
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const onSystem = () => { if (!saved()) switchTo(mq.matches ? 'dark' : 'light'); };
  mq.addEventListener('change', onSystem);
  return () => { mo.disconnect(); mq.removeEventListener('change', onSystem); };
};
const saved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', BG[t]));
}

function switchTo(next: Theme, from?: HTMLElement) {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && typeof document.startViewTransition === 'function') {
    const r = from?.getBoundingClientRect();
    root.style.setProperty('--vt-x', r ? `${Math.round(r.left + r.width / 2)}px` : '90%');
    root.style.setProperty('--vt-y', r ? `${Math.round(r.top + r.height / 2)}px` : '38px');
    root.classList.add('vt-theme');
    const vt = document.startViewTransition(() => apply(next));
    vt.finished.finally(() => root.classList.remove('vt-theme'));
    return;
  }
  root.classList.add('theme-fade');
  apply(next);
  setTimeout(() => root.classList.remove('theme-fade'), 900);
}

export function ThemeToggle() {
  // null on the server and during hydration (the theme is only known in the browser)
  const theme = useSyncExternalStore(subscribe, read, () => null);
  const dark = theme !== 'light';
  return (
    <button type="button" className="theme-toggle" role="switch" aria-checked={theme == null ? undefined : dark}
      aria-label="ダークモード" title={dark ? '明るい配色に切り替える' : '暗い配色に切り替える'}
      onClick={(e) => {
        const next: Theme = read() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(KEY, next); } catch { /* private mode: not saved */ }
        switchTo(next, e.currentTarget);
      }}>
      <span className="tt-stars" aria-hidden="true"><i /><i /><i /></span>
      <span className="tt-cloud" aria-hidden="true" />
      <span className="tt-knob" aria-hidden="true"><span className="tt-sun" /><span className="tt-moon" /></span>
    </button>
  );
}
