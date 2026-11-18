/*
 * Every URL of the site follows from an id — the registries never contain paths.
 * (Used by the server components and the client components alike.)
 */
export const paths = {
  /** player page; `t` (seconds) starts there and plays */
  watch: (id: string, t?: number) => `/watch/${encodeURIComponent(id)}${t != null ? `?t=${t}&autoplay=1` : ''}`,
  /** the video page itself (1920×1080), played inside the player's iframe */
  video: (id: string) => `/videos/${id}/index.html`,
  thumb: (id: string) => `/thumbs/videos/${id}.webp`,
  /** preview images of a site card: pc (1440×900), full (whole page, 1440 wide), sp (390×844 @2x) */
  siteShot: (id: string, kind: 'pc' | 'full' | 'sp') => `/thumbs/sites/${id}-${kind}.webp`,
  siteFile: (file: string) => `/thumbs/sites/${file}`,
  /** Chrome's icon for a page without a favicon */
  defaultFavicon: '/shared/favicons/default.png',
};

export const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** 2026-06-09 → 2026年6月9日 */
export const jdate = (d: string | null | undefined) => {
  const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[1]}年${+m[2]}月${+m[3]}日` : '';
};

/** the address shown on the cards: without https:// and the trailing / (or /index.html — the games of this site) */
export const host = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/(index\.html)?$/, '');
