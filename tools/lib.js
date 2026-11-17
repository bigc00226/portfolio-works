/*
 * Shared by the tools in this folder: paths, the registries (content/*.ts), Chrome / puppeteer, and the generated JSON.
 * Layout:
 *   content/videos.ts · content/sites.ts          registries (edited by hand; loaded here as-is — Node strips the types)
 *   generated/timeline.json · generated/captures.json   written by the tools
 *   public/videos/<id>/index.html                  video pages (run by Chrome straight from disk: file://)
 *   public/thumbs/videos/<id>.webp · public/thumbs/sites/<id>-*.webp
 * Needs Node 22.18+ (loads .ts files) — see package.json "engines".
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const GENERATED = path.join(ROOT, 'generated');
const CHROME = process.env.CHROME || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const videos = () => require(path.join(ROOT, 'content', 'videos.ts')).videos;
// VIDEO_ROOT=<folder> runs the tools on a copy of the video folders (e.g. to try a change of public/shared without touching the real ones)
const videoDir = (id) => path.join(process.env.VIDEO_ROOT ? path.resolve(process.env.VIDEO_ROOT) : path.join(PUBLIC, 'videos'), id);
const videoPage = (id) => path.join(videoDir(id), 'index.html');
const videoThumb = (id) => path.join(PUBLIC, 'thumbs', 'videos', `${id}.webp`);

/**
 * Captured files are filed as assets/<kind>/<host>/<the URL's path>. CDN paths can be very long (nested UUID folders,
 * long file names), and Git for Windows cannot add a file whose full path is over 260 characters. So when the part
 * below the host folder is longer than SHORT_MAX characters (extension not counted), the file goes to
 *   assets/<kind>/<host>/_/<start of the file name>-<hash of that part><ext>
 * The hash ignores the extension, so the same file keeps its name after tools/webp.js changes .jpg / .png to .webp.
 */
const SHORT_MAX = 70;
function shortAssetPath(p) {
  const m = /^(.*?assets\/[^/]+\/[^/]+\/)(.+)$/.exec(p);
  if (!m) return p;
  const ext = path.posix.extname(m[2]);
  const stem = m[2].slice(0, m[2].length - ext.length);
  if (stem.length <= SHORT_MAX) return p;
  const name = path.posix.basename(stem).slice(0, 24).replace(/[._-]+$/, '');
  const hash = crypto.createHash('md5').update(stem).digest('hex').slice(0, 10);
  return `${m[1]}_/${name ? name + '-' : ''}${hash}${ext}`;
}

/** the sites of the 一般 / デモ / ゲーム tabs — every entry has the same shape (see content/sites.ts) */
function sites() {
  const reg = require(path.join(ROOT, 'content', 'sites.ts'));
  const all = ['links', 'demos', 'games'].flatMap((list) => (reg[list] || []).map((s) => Object.assign({ registry: list }, s)));
  const seen = new Map();
  for (const s of all) {
    if (seen.has(s.id)) throw new Error(`id "${s.id}" is used twice (${seen.get(s.id)} and ${s.registry} in content/sites.ts) — ids name the preview images, so they must be unique`);
    seen.set(s.id, s.registry);
  }
  return all;
}

/** generated/<name>.json ({} when it does not exist yet) */
function readGenerated(name) {
  const p = path.join(GENERATED, `${name}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}
function writeGenerated(name, value) {
  fs.mkdirSync(GENERATED, { recursive: true });
  const out = path.join(GENERATED, `${name}.json`);
  fs.writeFileSync(out, JSON.stringify(value, null, 2) + '\n');
  return path.relative(ROOT, out);
}

function puppeteer() {
  try { return require('puppeteer-core'); } catch (e) {
    console.error('puppeteer-core がありません。このフォルダ（package.json のある場所）で `npm install` を実行してください。');
    process.exit(1);
  }
}

/** ids given on the command line (none = all); arguments starting with -- are options, not ids */
function only(list, args = process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  if (!args.length) return list;
  const unknown = args.filter((id) => !list.some((x) => x.id === id));
  if (unknown.length) { console.error(`unknown id: ${unknown.join(', ')} (known: ${list.map((x) => x.id).join(', ')})`); process.exit(1); }
  return list.filter((x) => args.includes(x.id));
}

/** value of --name=value on the command line */
const option = (name) => { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : null; };

/** files a video requests on purpose although they do not exist (not reported by onError) */
const EXPECTED_MISSING = [
  /\/missing\//,              // a staged mistake: images / videos broken on purpose, then fixed (notahotel: deploy without uploads)
  /\/tabisuruwagashi\/a$/,    // the live preview renders a half-typed <img src="<{$…}>"> while the template is being typed
];

/** opens a video page in Chrome and waits until it is ready to play (window.__demoReady) */
async function openVideo(browser, id, query = '', { onError } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  if (onError) {
    page.on('pageerror', (e) => onError('pageerror ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) onError('console ' + m.text().slice(0, 300)); }); // (missing files are reported below, with their path)
    page.on('requestfailed', (r) => { if (r.url().startsWith('file:') && !/ERR_ABORTED/.test(r.failure()?.errorText || '') && !EXPECTED_MISSING.some((x) => x.test(r.url()))) onError('missing file ' + decodeURI(r.url()).replace(fileUrl(PUBLIC), 'public')); });
  }
  await page.goto(fileUrl(videoPage(id)) + '?embed=1' + query);
  await page.waitForFunction('window.__demoReady || window.__demoError', { timeout: 300000 });
  const err = await page.evaluate(() => window.__demoError);
  if (err) throw new Error(`${id}: ${err}`);
  return page;
}

/** runs the video to its end at turbo speed (the clock is deterministic, so this gives the exact length) */
async function runToEnd(page) {
  await page.evaluate(() => window.Stage.seek(1e12, false));
  await page.waitForFunction('(window.__demoDone && !window.Stage.seeking) || window.__demoError', { timeout: 900000, polling: 1000 });
  return page.evaluate(() => ({ error: window.__demoError || null, duration: Math.round(window.Stage.Clock.t), starts: window.Stage.sceneStarts.map(Math.round), typeDiff: window.__typeDiff || [] }));
}

/** opens the video at `sec` seconds (without captions unless asked), for a screenshot */
async function openAt(browser, id, sec, { captions = false } = {}) {
  const page = await openVideo(browser, id, `${captions ? '' : '&captions=0'}&t=${sec}`);
  await page.waitForFunction('window.__demoReady && window.Stage.Clock.started && !window.Stage.seeking', { timeout: 600000, polling: 300 });
  await wait(1500);
  return page;
}

const launch = (args = []) => puppeteer().launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 900000, args: ['--window-size=1920,1080', '--hide-scrollbars', ...args] });
const fileUrl = (p) => pathToFileURL(p).href;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { ROOT, PUBLIC, GENERATED, CHROME, videos, videoDir, videoPage, videoThumb, shortAssetPath, sites, readGenerated, writeGenerated, puppeteer, launch, only, option, openVideo, runToEnd, openAt, fileUrl, wait };
