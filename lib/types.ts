/*
 * Types of the registries (content/) and of the data the tools write (generated/).
 * content/*.ts only import types from here (`import type`), so the Node tools can load them as-is.
 */

/** a production-process video — content/videos.ts */
export interface Video {
  /** folder name. Everything else follows from it:
   *  public/videos/<id>/index.html (the video page), public/thumbs/videos/<id>.webp (thumbnail),
   *  /watch/<id> (player page), docs/videos/<id>.md (notes) */
  id: string;
  title: string;
  client: string;
  /** the site the video is about (shown on the card, without https://) */
  url: string;
  /** main tools, shown above the title (also feeds the TOOLS strip) */
  tool: string;
  summary: string;
  tags: string[];
  /** YYYY-MM-DD: the date on the video's screen (taskbar clock). The list is ordered by it, newest first */
  recorded: string;
  /** the frame used as the thumbnail, in seconds from the start */
  thumbAt: number;
  /** chapter names, in the order of the scenes of the video's script */
  chapters: string[];
}

/** a site card of the 一般 / デモ / ゲーム tabs — content/sites.ts */
export interface Site {
  /** names the preview images: public/thumbs/sites/<id>-pc.webp / -full.webp / -sp.webp. Unique across all tabs */
  id: string;
  /** the site (the card's preview opens it inside the page) */
  url: string;
  name: string;
  title: string;
  summary: string;
  tags: string[];
  stack: string[];
  /** accent colour of the card background */
  accent: string;
  /** when the favicon is a framework default: CSS selector of the header's SVG mark, used as the card icon instead */
  logoFrom?: string;
  /** a note on the card (login required, …) */
  note?: string;
}

export type TabKey = 'special' | 'general' | 'demo' | 'game';
export type TabIcon = 'spark' | 'link' | 'demo' | 'game';

/** a tab of the list page — content/tabs.ts */
export interface Tab {
  key: TabKey;
  label: string;
  en: string;
  icon: TabIcon;
  /** shows the NEW badge on the tab */
  isNew?: boolean;
  title: string;
  lead: string;
  /** label of the site cards (WORK 01 …) */
  num?: string;
  /** shown next to the heading while the tab has entries */
  hint?: string;
  /** shown while the tab has no entries */
  empty?: { title: string; text?: string };
}

/** generated/timeline.json (npm run timeline) */
export interface Timeline {
  /** length of the video, ms */
  duration: number;
  /** start of each chapter, ms (same order as Video.chapters) */
  starts: number[];
}

/** generated/captures.json (npm run capture) */
export interface SiteCapture {
  /** YYYY-MM-DD */
  date: string;
  /** favicon file in public/thumbs/sites/ */
  icon: string | null;
  /** header mark (only with Site.logoFrom) */
  logo?: string;
}
