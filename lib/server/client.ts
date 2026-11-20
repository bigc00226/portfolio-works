/*
 * Who is asking: the IP address of a request and the browser / OS / device of its User-Agent.
 * The browser adds its User-Agent Client Hints (navigator.userAgentData) to the first message of a page
 * (components/Tracker.tsx): they tell Windows 11 from Windows 10, the real macOS version and Brave, which the
 * User-Agent string no longer does.
 */
import 'server-only';

/** the first address of X-Forwarded-For (a proxy in front of the server, or the Next server itself, adds it),
 *  else X-Real-IP / CF-Connecting-IP; IPv4 in IPv6 form (::ffff:1.2.3.4) is shortened */
export function clientIp(h: Headers): string {
  const raw = (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || h.get('cf-connecting-ip') || '').trim();
  let ip = raw.replace(/^\[|\](:\d+)?$/g, '');
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/i.test(ip)) ip = ip.slice(7);
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) ip = ip.replace(/:\d+$/, '');
  return ip.slice(0, 64) || '不明';
}

export type Hints = { brands?: { brand: string; version: string }[]; platform?: string; platformVersion?: string; mobile?: boolean; model?: string; touch?: number; webdriver?: boolean };
export type Agent = { browser: string; browserVer: string; os: string; osVer: string; device: 'desktop' | 'mobile' | 'tablet' | 'bot'; isBot: boolean };

const BOT = /bot\b|bot\/|crawl|spider|slurp|mediapartners|headless|lighthouse|pagespeed|puppeteer|playwright|phantom|selenium|facebookexternalhit|embedly|preview|validator|monitor|uptime|curl\/|wget\/|python-|python\/|axios\/|node-fetch|undici|go-http|okhttp|java\/|libwww|httpclient|scrapy/i;

const BROWSERS: [RegExp, string][] = [
  [/EdgA?\/([\d.]+)/, 'Edge'], [/EdgiOS\/([\d.]+)/, 'Edge'], [/OPR\/([\d.]+)|Opera\/([\d.]+)/, 'Opera'],
  [/SamsungBrowser\/([\d.]+)/, 'Samsung Internet'], [/YaBrowser\/([\d.]+)/, 'Yandex'], [/Vivaldi\/([\d.]+)/, 'Vivaldi'],
  [/Whale\/([\d.]+)/, 'Whale'], [/UCBrowser\/([\d.]+)/, 'UC Browser'], [/\bLine\/([\d.]+)/, 'LINE'],
  [/FBAV\/([\d.]+)|FBAN/, 'Facebook'], [/Instagram ([\d.]+)/, 'Instagram'], [/CriOS\/([\d.]+)/, 'Chrome'],
  [/FxiOS\/([\d.]+)/, 'Firefox'], [/Firefox\/([\d.]+)/, 'Firefox'], [/HeadlessChrome\/([\d.]+)/, 'Chrome（ヘッドレス）'],
  [/Chrom(?:e|ium)\/([\d.]+)/, 'Chrome'], [/Version\/([\d.]+).*Safari\//, 'Safari'], [/MSIE ([\d.]+)|Trident\/.*rv:([\d.]+)/, 'Internet Explorer'],
];

const major = (v: string | undefined) => (v || '').split('.')[0];

export function parseAgent(ua: string, hints: Hints = {}): Agent {
  const isBot = BOT.test(ua) || !!hints.webdriver || !ua;
  let browser = 'その他', browserVer = '';
  for (const [re, name] of BROWSERS) {
    const m = ua.match(re);
    if (m) { browser = name; browserVer = major(m.slice(1).find(Boolean)); break; }
  }
  // the hints name the brand the User-Agent hides (Brave, and Opera / Edge in some modes)
  const brand = hints.brands?.find((b) => /Brave|Opera|Microsoft Edge|Vivaldi|Yandex/.test(b.brand));
  if (brand) { browser = brand.brand.replace('Microsoft ', ''); browserVer = major(brand.version) || browserVer; }

  let os = 'その他', osVer = '';
  let m: RegExpMatchArray | null;
  if ((m = ua.match(/Windows NT ([\d.]+)/))) {
    os = 'Windows';
    const nt: Record<string, string> = { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP' };
    osVer = nt[m[1]] ?? m[1];
    // Windows 11 reports itself as NT 10.0; its Client Hints platform version is 13 or later
    if (osVer === '10' && hints.platform === 'Windows' && +major(hints.platformVersion) >= 13) osVer = '11';
  } else if ((m = ua.match(/(?:iPhone|iPod).*? OS (\d+)[_.](\d+)/))) { os = 'iOS'; osVer = `${m[1]}.${m[2]}`; }
  else if ((m = ua.match(/iPad.*? OS (\d+)[_.](\d+)/))) { os = 'iPadOS'; osVer = `${m[1]}.${m[2]}`; }
  else if ((m = ua.match(/Android ([\d.]+)/))) { os = 'Android'; osVer = major(m[1]); }
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if ((m = ua.match(/Mac OS X (\d+)[_.](\d+)/))) {
    // an iPad asks for the desktop site with a Mac User-Agent; it has a touch screen
    if ((hints.touch ?? 0) > 1) { os = 'iPadOS'; osVer = ''; }
    else { os = 'macOS'; osVer = hints.platform === 'macOS' && hints.platformVersion ? hints.platformVersion.split('.').slice(0, 2).join('.') : `${m[1]}.${m[2]}`.replace(/^10\.15$/, '10.15+'); }
  } else if (/Linux/.test(ua)) os = 'Linux';
  if (hints.platform === 'Android' && hints.platformVersion) osVer = major(hints.platformVersion);

  let device: Agent['device'] = 'desktop';
  if (isBot) device = 'bot';
  else if (os === 'iPadOS' || /Tablet|iPad/.test(ua) || (os === 'Android' && !/Mobile/.test(ua))) device = 'tablet';
  else if (hints.mobile || /Mobi|iPhone|iPod|Android.*Mobile/.test(ua)) device = 'mobile';
  return { browser, browserVer, os, osVer, device, isBot };
}

/** where the visitor came from: a page of this site, a search engine, a social network, another site, or nothing */
export function sourceOf(referrer: string, ownHost: string): { host: string; source: string } {
  let host = '';
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch { host = ''; }
  if (!host) return { host: '', source: 'direct' };
  if (host === ownHost.replace(/^www\./, '').replace(/:\d+$/, '')) return { host, source: 'internal' };
  if (/(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|ecosia|naver)\./.test(host)) return { host, source: 'search' };
  if (/(^|\.)(t\.co|x\.com|twitter\.com|facebook\.com|instagram\.com|linkedin\.com|lnkd\.in|line\.me|youtube\.com|threads\.net|note\.com|qiita\.com|zenn\.dev)$/.test(host)) return { host, source: 'social' };
  if (/lancers\.jp|crowdworks\.jp|coconala\.com/.test(host)) return { host, source: 'marketplace' };
  return { host, source: 'referral' };
}

export const SOURCE_LABEL: Record<string, string> = {
  direct: '直接（ブックマーク・URL 入力）', search: '検索エンジン', social: 'SNS', marketplace: 'クラウドソーシング', referral: 'ほかのサイト', internal: 'サイト内',
};
export const DEVICE_LABEL: Record<string, string> = { desktop: 'パソコン', mobile: 'スマートフォン', tablet: 'タブレット', bot: 'ボット' };
