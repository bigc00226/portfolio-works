/*
 * The registries (content/) joined with the generated data (generated/), and every URL that follows from an id.
 * Server-side only: the pages pass plain data from here to the client components.
 */
import 'server-only';
import { videos as VIDEOS } from '@/content/videos';
import { links, demos, games } from '@/content/sites';
import { tabs } from '@/content/tabs';
import timelineJson from '@/generated/timeline.json';
import capturesJson from '@/generated/captures.json';
import type { Site, SiteCapture, TabKey, Timeline, Video } from './types';
import { paths } from './paths';

const timeline = timelineJson as Record<string, Timeline>;
const captures = capturesJson as Record<string, SiteCapture>;

/** a video with its measured length and chapter starts */
export interface VideoEntry extends Video {
  duration: number;
  chapterList: { name: string; index: number; t: number; len: number }[];
}

/** a site card with its preview images and icon */
export interface SiteEntry extends Site {
  icon: string;
  logo: string;
  captured: string | null;
}

function withTimeline(v: Video): VideoEntry {
  const tl = timeline[v.id];
  const duration = tl?.duration ?? 0;
  const starts = tl?.starts ?? [];
  const chapterList = v.chapters
    .map((name, index) => ({ name, index, t: starts[index], len: (starts[index + 1] ?? duration) - starts[index] }))
    .filter((c) => c.t != null && c.len > 0);
  return { ...v, duration, chapterList };
}

function withCapture(s: Site): SiteEntry {
  const c = captures[s.id];
  const icon = c?.icon ? paths.siteFile(c.icon) : paths.defaultFavicon;
  return { ...s, icon, logo: c?.logo ? paths.siteFile(c.logo) : icon, captured: c?.date ?? null };
}

/** every video, newest first (by the date on its screen) */
export const videos: VideoEntry[] = [...VIDEOS].sort((a, b) => b.recorded.localeCompare(a.recorded)).map(withTimeline);

export const getVideo = (id: string) => videos.find((v) => v.id === id);

export const sites: Record<Exclude<TabKey, 'special'>, SiteEntry[]> = {
  general: links.map(withCapture),
  demo: demos.map(withCapture),
  game: games.map(withCapture),
};

export { tabs };

/** first and last capture date of the site previews (YYYY-MM-DD) */
export function captureRange(): [string, string] | null {
  const dates = Object.values(sites).flat().map((s) => s.captured).filter((d): d is string => !!d).sort();
  return dates.length ? [dates[0], dates[dates.length - 1]] : null;
}
