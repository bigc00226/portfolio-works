/* Line icons of the list page (24×24, stroke = currentColor; `.i` in home.css sizes them). */
import type { TabIcon } from '@/lib/types';

type P = { className?: string };
const I = ({ className = 'i', children }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{children}</svg>
);

/** filled ▶ without the .i class (the big play buttons size it themselves) */
export const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" /></svg>
);
export const Play = () => <I className="i solid"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" /></I>;
export const Spark = () => <I><path d="M12 3l2.1 5.4L19.5 10l-5.4 1.6L12 17l-2.1-5.4L4.5 10l5.4-1.6z" /><path d="M19 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></I>;
export const Spark1 = () => <I><path d="M12 3l2.1 5.4L19.5 10l-5.4 1.6L12 17l-2.1-5.4L4.5 10l5.4-1.6z" /></I>;
export const Demo = () => <I><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M3 8h18M8 21h8M12 17v4" /></I>;
export const Game = () => (
  <I><path d="M7.5 6h9a5 5 0 0 1 4.9 6l-.8 4.1a2.4 2.4 0 0 1-4.1 1.2L14.3 15H9.7l-2.2 2.3a2.4 2.4 0 0 1-4.1-1.2L2.6 12a5 5 0 0 1 4.9-6z" /><path d="M7 10v3M5.5 11.5h3" /><circle cx="15.5" cy="10.5" r=".6" /><circle cx="17.5" cy="12.5" r=".6" /></I>
);
export const Eye = () => <I><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></I>;
export const Ext = () => <I><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></I>;
export const Scroll = () => <I><rect x="7" y="3" width="10" height="18" rx="5" /><path d="M12 7v4" /></I>;
export const Link = () => <I><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></I>;
export const Lock = () => <I><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>;
export const Arrow = () => <I><path d="M5 12h14M13 6l6 6-6 6" /></I>;
export const Minus = () => <I><path d="M6 12h12" /></I>;
export const Check = () => <I><path d="M5 12.5l4.5 4.5L19 7.5" /></I>;
export const Picture = () => <I><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" /></I>;
export const Monitor = () => <I><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></I>;
export const Phone = () => <I><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></I>;
export const Reload = () => <I><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></I>;
export const Close = () => <I><path d="M6 6l12 12M18 6L6 18" /></I>;
export const Prev = () => <I><path d="M15 18l-6-6 6-6" /></I>;
export const Next = () => <I><path d="M9 18l6-6-6-6" /></I>;

export const TabIconOf = ({ icon }: { icon: TabIcon }) =>
  icon === 'spark' ? <Spark /> : icon === 'link' ? <Link /> : icon === 'demo' ? <Demo /> : <Game />;
