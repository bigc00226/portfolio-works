import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP, Shippori_Mincho_B1 } from 'next/font/google';
import './home.css';

// The list page and the player page are separate root layouts (route groups): their global styles never meet,
// and moving between them is a full page load (the player starts fresh).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter', display: 'swap' });
const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-noto-jp', display: 'swap', preload: false });
const shippori = Shippori_Mincho_B1({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-shippori', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: 'Process Portfolio ― 制作の過程を録画した、動画のポートフォリオ',
  description: '制作実績を URL やスクリーンショットだけでなく、デザインから実装・確認・公開までの作業過程の録画でご紹介する動画ポートフォリオです。公開中のデモサイトもこのページで操作できます。',
};

export const viewport: Viewport = { themeColor: '#eaf2ff' };

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${noto.variable} ${shippori.variable}`}>
      <body>{children}</body>
    </html>
  );
}
