/* The frame of every admin page: the sidebar (pages, theme, sign-out) and the page head. Server component. */
import type { ReactNode } from 'react';
import { logoutAction } from '@/app/(admin)/admin/actions';
import { ThemeSwitch } from './ui';

const I = {
  dash: <path d="M3.5 13.5h6v7h-6zM14.5 3.5h6v17h-6zM3.5 3.5h6v6h-6z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2" /></>,
  video: <><rect x="2.5" y="5" width="14" height="14" rx="2.5" /><path d="M16.5 10l5-3v10l-5-3" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" /><path d="M3.5 3.5v5h5M12 7.5V12l3 2" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  out: <path d="M15 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M10 16.5 14.5 12 10 7.5M14.5 12h-11" />,
  site: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5z" /></>,
};
export const Icon = ({ name }: { name: keyof typeof I }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[name]}</svg>
);

export const Mark = () => (
  <span className="tp-brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18 9.5 11l4 4L20 6" /><path d="M15 6h5v5" /></svg></span>
);

const NAV = [
  { key: 'dash', href: '/admin', label: 'ダッシュボード', icon: 'dash' },
  { key: 'visitors', href: '/admin/visitors', label: '訪問者（IP 別）', icon: 'users' },
  { key: 'videos', href: '/admin/videos', label: '動画', icon: 'video' },
  { key: 'history', href: '/admin/history', label: 'アクセス履歴', icon: 'history' },
  { key: 'settings', href: '/admin/settings', label: '設定', icon: 'gear' },
] as const;

export function Shell({ active, qs = '', children }: { active: (typeof NAV)[number]['key']; qs?: string; children: ReactNode }) {
  return (
    <div className="tp-app">
      <aside className="tp-side">
        <a className="tp-brand" href="/admin"><Mark /><div><b>Trust Portfolio</b><small>ANALYTICS</small></div></a>
        <nav className="tp-nav" aria-label="管理画面">
          {NAV.map((n) => (
            <a key={n.key} href={n.key === 'settings' ? n.href : `${n.href}${qs}`} aria-current={active === n.key ? 'page' : undefined}>
              <Icon name={n.icon} /><span>{n.label}</span>
            </a>
          ))}
        </nav>
        <div className="tp-side-foot">
          <a className="tp-side-btn" href="/" target="_blank" rel="noopener"><Icon name="site" /><span>サイトを開く</span></a>
          <ThemeSwitch />
          <form action={logoutAction}><button className="tp-side-btn" type="submit"><Icon name="out" /><span>ログアウト</span></button></form>
          <span className="side-note">時刻はすべて日本時間</span>
        </div>
      </aside>
      <main className="tp-main">{children}</main>
    </div>
  );
}

export function PageHead({ title, sub, crumb, children }: { title: string; sub?: ReactNode; crumb?: { href: string; label: string }; children?: ReactNode }) {
  return (
    <div className="tp-top">
      <div>
        {crumb && <div className="tp-crumb"><a href={crumb.href}>{crumb.label}</a><span>/</span></div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </div>
  );
}
