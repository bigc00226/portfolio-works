import type { Viewport } from 'next';
import './player.css';

export const viewport: Viewport = { themeColor: '#000000' };

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
