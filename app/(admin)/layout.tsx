import type { Metadata, Viewport } from 'next';
import './admin.css';

// The admin pages have their own root layout (route group), like the list page and the player.
export const metadata: Metadata = {
  title: { default: '管理画面 — Trust Portfolio', template: '%s — 管理画面' },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { colorScheme: 'light dark' };

// the theme before the first paint: the saved choice (the switch in the sidebar), else the system's
const HEAD = "var d=document.documentElement,t;try{t=localStorage.getItem('pp-admin-theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: HEAD }} /></head>
      <body>{children}</body>
    </html>
  );
}
