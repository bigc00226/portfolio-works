import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP, Shippori_Mincho_B1 } from 'next/font/google';
import './home.css';

// The list page and the player page are separate root layouts (route groups): their global styles never meet,
// and moving between them is a full page load (the player starts fresh).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter', display: 'swap' });
const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-noto-jp', display: 'swap', preload: false });
const shippori = Shippori_Mincho_B1({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-shippori', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: 'Trust Portfolio ― 制作の過程を録画した、動画のポートフォリオ',
  description: '制作実績を URL やスクリーンショットだけでなく、デザインから実装・確認・公開までの作業過程の録画でご紹介する動画ポートフォリオです。公開中のデモサイトとゲームもこのページで操作できます。',
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f5f7fc' }, { media: '(prefers-color-scheme: dark)', color: '#05070f' }],
  colorScheme: 'dark light',
};

// Before the first paint:
//  - the theme (html[data-theme]): the visitor's choice from the switch in the header (components/home/ThemeToggle.tsx),
//    else the system's; without it the page would flash the other theme
//  - the scroll-in animations (home.css .motion [data-reveal]) only apply with JavaScript, and not for people who asked
//    for less motion — without this class every section is simply visible
const HEAD = [
  "var d=document.documentElement,t;try{t=localStorage.getItem('pp-theme')}catch(e){}",
  "if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';d.dataset.theme=t;",
  "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('motion')",
].join('');

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${noto.variable} ${shippori.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
