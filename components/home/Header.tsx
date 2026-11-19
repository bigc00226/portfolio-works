'use client';
/* Top bar: fixed, turns into glass after the first scroll (html.scrolled, Motion.tsx), with the reading-progress line.
   `data-go` links pick a tab of the library (handled in Library); `data-nav` marks the link of the section on screen.
   On narrow screens the links fold into a menu. */
import { useState } from 'react';
import { Play } from './icons';

const LINKS: { href: string; label: string; go?: string; nav?: string }[] = [
  { href: '#why', label: '動画で見せる理由', nav: 'why' },
  { href: '#flow', label: '収録している工程', nav: 'flow' },
  { href: '#special', label: '制作動画', go: 'special', nav: 'library' },
  { href: '#general', label: '制作実績', go: 'general' },
  { href: '#demo', label: 'デモ', go: 'demo' },
  { href: '#game', label: 'ゲーム', go: 'game' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="top">
      <div className="container top-in">
        <a className="brand" href="#top" aria-label="Process Portfolio トップ">
          <span className="brand-mark"><i /></span>
          <span><b>Process Portfolio</b><small>制作過程の動画ポートフォリオ</small></span>
        </a>
        <nav id="gnav" className={`gnav${open ? ' open' : ''}`} aria-label="ページ内" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} data-go={l.go} data-nav={l.nav}>{l.label}</a>
          ))}
        </nav>
        <a className="btn btn-primary btn-sm top-cta" href="#special" data-go="special"><Play />動画を見る</a>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="gnav" aria-label={open ? 'メニューを閉じる' : 'メニューを開く'} onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
      <div className="scroll-prog" aria-hidden="true"><i /></div>
    </header>
  );
}
