import type { Viewport } from 'next';
import { Tracker } from '@/components/Tracker';
import { TRACK_HEAD } from '@/lib/track-inline';
import './player.css';

export const viewport: Viewport = { themeColor: '#000000' };

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      {/* the visitor statistics: the first message, before hydration (lib/track-inline.ts) */}
      <head><script dangerouslySetInnerHTML={{ __html: TRACK_HEAD }} /></head>
      <body>{children}<Tracker /></body>
    </html>
  );
}
