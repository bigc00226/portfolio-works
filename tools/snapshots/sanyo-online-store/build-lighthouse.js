// Builds the Lighthouse reports of the sanyo-online-store video (scene 4「パフォーマンス改善」) from a REAL Lighthouse run.
//
//   node tools/snapshots/sanyo-online-store/build-lighthouse.js          use the saved run (.capture/lighthouse-real.json)
//   node tools/snapshots/sanyo-online-store/build-lighthouse.js --run    run Lighthouse again on the live product page first
//
// Needs the `lighthouse` dev dependency (npm install) and Google Chrome.
//
// What is real:
//   - the run: Lighthouse 13 (mobile: Moto G Power emulation, simulated slow 4G, Japanese) on the live product page
//     https://store.sanyo-shokai.co.jp/products/h5b41876 — its audits, URLs, nodes, filmstrip and screenshots
//   - the report UI: Lighthouse's own report renderer (node_modules/lighthouse/dist/report/bundle.esm.js — the code
//     Chrome DevTools uses; Apache-2.0), copied to js/lighthouse-report.js as a classic script. The video renders the
//     report with it at play time exactly like DevTools does: renderReport(lhr, {disableDarkMode: true}) + .lh-devtools
//   - every text: from the run (ja), and the strings of the insights Lighthouse would show (its ja locale file)
//   - the DevTools Lighthouse logo (devtools-frontend, BSD)
// What is set for the story (the live store is already the improved state, so the run is the base of all three):
//   - the page is the theme dev server (http://127.0.0.1:9292/…) instead of the live domain
//   - the five metrics of each report, and the performance score computed from them with Lighthouse's own scoring
//     (log-normal curves + metric weights): before 38 / lazy-loaded LCP image 61 / fixed 86
//   - before: images without width / height (CLS 0.31, layout-shift culprits), 1500px images on a phone,
//     and the two leftover app scripts (legacy-review-widget.js 412 KiB, chat-support-v1.js 186 KiB) in unused JS
//   - lazy: the first product image with loading="lazy" (LCP request discovery fails)
//   - the main-thread diagnostics, scaled to the story's Total Blocking Time (the run on this PC measured an
//     unrealistic 38 s of blocking time because of its slow CPU; their items and proportions stay the run's)
// Writes public/videos/sanyo-online-store/js/lighthouse-data.js, js/lighthouse-report.js, assets/devtools/*.svg
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '../../..');
const VID = path.join(ROOT, 'public', 'videos', 'sanyo-online-store');
const CAP = path.join(__dirname, '.capture');
const REAL = path.join(CAP, 'lighthouse-real.json');
const LH = path.join(ROOT, 'node_modules', 'lighthouse');
const CHROME = process.env.CHROME || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LIVE = 'https://store.sanyo-shokai.co.jp';
const DEV = 'http://127.0.0.1:9292';
const PAGE = '/products/h5b41876';
// DevTools images (devtools-frontend, BSD): the start view logo and the Lighthouse panel toolbar icons
const DEVTOOLS_IMAGES = ['lighthouse_logo', 'plus', 'clear', 'gear', 'triangle-down']
  .map((n) => [n, `https://chromium.googlesource.com/devtools/devtools-frontend/+/refs/heads/main/front_end/Images/src/${n}.svg?format=TEXT`]);

const NB = '\u00a0'; // Lighthouse (ja) puts a no-break space between a number and its unit
const kib = (b) => Math.round(b / 1024).toLocaleString('en-US');
const sec = (ms) => `${(Math.round(ms / 100) / 10).toFixed(1)}${NB}秒`;
const msTxt = (ms) => `${Math.round(ms / 10) * 10 >= 1000 ? (Math.round(ms / 10) * 10).toLocaleString('en-US') : Math.round(ms / 10) * 10}${NB}ミリ秒`;
const clone = (o) => JSON.parse(JSON.stringify(o));

async function main() {
  if (!fs.existsSync(path.join(LH, 'cli', 'index.js'))) throw new Error('lighthouse is not installed: run `npm install` in the project folder');
  fs.mkdirSync(CAP, { recursive: true });

  /* ------------------------------------------------------------------ 1. the real run */
  if (process.argv.includes('--run') || !fs.existsSync(REAL)) {
    console.log('running Lighthouse on', LIVE + PAGE, '(1–3 minutes)');
    const r = spawnSync(process.execPath, [path.join(LH, 'cli', 'index.js'), LIVE + PAGE, '--locale=ja', '--output=json', `--output-path=${REAL}`,
      `--chrome-path=${CHROME}`, '--chrome-flags=--headless=new --lang=ja-JP', '--quiet'], { stdio: 'inherit' });
    if (r.status) throw new Error('Lighthouse failed');
  }
  const real = JSON.parse(fs.readFileSync(REAL, 'utf8'));
  console.log(`run: Lighthouse ${real.lighthouseVersion}, ${real.configSettings.locale}, ${real.configSettings.formFactor}, ${real.fetchTime}`);

  /* ------------------------------------------------------------------ 2. the base report (= the improved store) */
  // the theme dev server instead of the live domain
  // (also in the query strings of the analytics beacons, and the first-party entity: Lighthouse names it after the host)
  let base = JSON.parse(JSON.stringify(real).split(LIVE).join(DEV).split('//store.sanyo-shokai.co.jp').join('//127.0.0.1:9292')
    .split('https%3A%2F%2Fstore.sanyo-shokai.co.jp').join('http%3A%2F%2F127.0.0.1%3A9292').split('store.sanyo-shokai.co.jp').join('127.0.0.1:9292')
    .split('"sanyo-shokai.co.jp"').join('"127.0.0.1"'));
  base.runWarnings = [];                                     // (the run on this PC hit the load timeout)
  base.configSettings.channel = 'devtools';                  // run from the DevTools Lighthouse panel
  base.environment.hostUserAgent = base.environment.hostUserAgent.replace('HeadlessChrome/', 'Chrome/');
  delete base.categories['agentic-browsing'];                // not selected in the panel (perf / a11y / best practices / SEO)
  for (const k of Object.keys(base.categoryGroups)) if (/^(webmcp|agent-)/.test(k)) delete base.categoryGroups[k];
  delete base.i18n.icuMessagePaths;                          // only for re-localizing; the renderer reads rendererFormattedStrings
  base.timing = { total: real.timing.total };
  // details nobody sees (hidden audits) and debug data: smaller file
  for (const id of ['network-requests', 'main-thread-tasks', 'network-rtt', 'network-server-latency']) {
    if (base.audits[id] && base.audits[id].details) base.audits[id].details = { type: 'debugdata' };
  }
  const dropDebug = (o) => { if (!o || typeof o !== 'object') return; delete o.debugData; Object.values(o).forEach(dropDebug); };
  dropDebug(base.audits);

  // images: the final screenshot and the full-page screenshot (element thumbnails) → WebP. The filmstrip stays JPEG:
  // the renderer treats filmstrip frames as JPEG (it prefixes data:image/jpeg;base64, to anything else) — recompressed
  const sharp = require('sharp');
  const reencode = async (dataUri, fmt, q) => {
    const m = /^data:image\/[a-z]+;base64,(.*)$/.exec(dataUri || '');
    if (!m) return dataUri;
    const buf = await sharp(Buffer.from(m[1], 'base64'))[fmt]({ quality: q }).toBuffer();
    return `data:image/${fmt};base64,` + buf.toString('base64');
  };
  const toWebp = (d, q = 72) => reencode(d, 'webp', q);
  for (const it of base.audits['screenshot-thumbnails'].details.items) it.data = await reencode(it.data, 'jpeg', 72);
  base.audits['final-screenshot'].details.data = await toWebp(base.audits['final-screenshot'].details.data, 72);
  if (base.fullPageScreenshot) base.fullPageScreenshot.screenshot.data = await toWebp(base.fullPageScreenshot.screenshot.data, 62);

  /* ------------------------------------------------------------------ 3. scoring (Lighthouse's own) */
  const { Util } = await import(pathToFileURL(path.join(LH, 'shared', 'util.js')).href);
  const CURVE = { // mobile control points from core/audits/metrics/*.js
    'first-contentful-paint': { p10: 1800, median: 3000 },
    'speed-index': { p10: 3387, median: 5800 },
    'largest-contentful-paint': { p10: 2500, median: 4000 },
    'total-blocking-time': { p10: 200, median: 600 },
    'cumulative-layout-shift': { p10: 0.1, median: 0.25 },
  };
  const WEIGHT = Object.fromEntries(real.categories.performance.auditRefs.filter((r) => r.weight).map((r) => [r.id, r.weight]));
  const scoreOf = (id, v) => Util.computeLogNormalScore(CURVE[id], v);
  const perfOf = (m) => {
    let sum = 0, w = 0;
    for (const [id, wt] of Object.entries(WEIGHT)) { if (!(id in m)) continue; sum += scoreOf(id, m[id]) * wt; w += wt; }
    return Math.round((sum / w) * 100) / 100;
  };
  /** the TBT (10 ms steps) that gives the story's score with the other four metrics fixed */
  const solveTbt = (m, target) => {
    let best = null;
    for (let t = 50; t <= 3000; t += 10) { const s = perfOf({ ...m, 'total-blocking-time': t }); if (!best || Math.abs(s - target) < Math.abs(best.s - target)) best = { t, s }; }
    return best;
  };
  const metricAudit = (id, v) => {
    const a = clone(base.audits[id]);
    a.numericValue = v;
    a.score = scoreOf(id, v);
    a.displayValue = id === 'cumulative-layout-shift' ? String(Math.round(v * 1000) / 1000) : id === 'total-blocking-time' ? msTxt(v) : sec(v);
    return a;
  };

  /* ------------------------------------------------------------------ 4. the three reports of the story */
  const STORY = {
    before: { target: 0.38, m: { 'first-contentful-paint': 2400, 'speed-index': 5200, 'largest-contentful-paint': 6400, 'cumulative-layout-shift': 0.31 } },
    lazy: { target: 0.61, m: { 'first-contentful-paint': 1800, 'speed-index': 3500, 'largest-contentful-paint': 7100, 'cumulative-layout-shift': 0.02 } },
    fixed: { target: 0.86, m: { 'first-contentful-paint': 1600, 'speed-index': 3100, 'largest-contentful-paint': 2400, 'cumulative-layout-shift': 0.02 } },
  };
  const variants = {};
  for (const [key, st] of Object.entries(STORY)) {
    const tbt = solveTbt(st.m, st.target);
    const m = { ...st.m, 'total-blocking-time': tbt.t };
    const audits = {};
    for (const [id, v] of Object.entries(m)) audits[id] = metricAudit(id, v);
    // main-thread diagnostics follow the TBT (same items, same proportions)
    // (a store like this spends ~5–6 s on the main thread under the 4× CPU slowdown; the run here measured far more)
    const f = (5000 + tbt.t * 2) / real.audits['mainthread-work-breakdown'].numericValue;
    for (const id of ['bootup-time', 'mainthread-work-breakdown', 'third-parties-insight']) audits[id] = scaleMs(base.audits[id], f);
    audits['long-tasks'] = longTasks(base.audits['long-tasks'], f);
    variants[key] = { perf: perfOf(m), audits };
    console.log(`${key}: perf ${Math.round(perfOf(m) * 100)} (story ${Math.round(st.target * 100)}) — FCP ${m['first-contentful-paint']} SI ${m['speed-index']} LCP ${m['largest-contentful-paint']} TBT ${tbt.t} CLS ${m['cumulative-layout-shift']}`);
  }
  storyAudits(base, variants);

  /* ------------------------------------------------------------------ 5. write */
  const out = path.join(VID, 'js', 'lighthouse-data.js');
  fs.writeFileSync(out, `/* Lighthouse data of scene 4 — written by tools/snapshots/sanyo-online-store/build-lighthouse.js (do not edit by hand).
   base: a real Lighthouse ${real.lighthouseVersion} run (mobile, ja) on ${LIVE + PAGE}, ${real.fetchTime.slice(0, 10)} — shown as the theme dev server.
   variants: the audits each report of the story replaces (metrics and their scores, and the issues of that state). */
window.LH_DATA = ${JSON.stringify({ base, variants })};
`);
  console.log('wrote', path.relative(ROOT, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');

  // the renderer: Lighthouse's report bundle as a classic script (file:// pages cannot import ES modules)
  let bundle = fs.readFileSync(path.join(LH, 'dist', 'report', 'bundle.esm.js'), 'utf8');
  const exp = /export\{([^}]+)\};?\s*$/m.exec(bundle) || /export\{([^}]+)\}/.exec(bundle);
  if (!exp) throw new Error('renderer bundle: export list not found');
  const names = exp[1].split(',').map((p) => p.trim().split(/\s+as\s+/)).map(([local, name]) => `${name || local}:${local}`);
  bundle = bundle.replace(exp[0], `window.LighthouseReport={${names.join(',')}};`);
  const ver = JSON.parse(fs.readFileSync(path.join(LH, 'package.json'), 'utf8')).version;
  fs.writeFileSync(path.join(VID, 'js', 'lighthouse-report.js'),
    `/* Lighthouse ${ver} report renderer — node_modules/lighthouse/dist/report/bundle.esm.js, unchanged except that its\n   ES module export became window.LighthouseReport (copied by tools/snapshots/sanyo-online-store/build-lighthouse.js).\n   Copyright Google LLC, Apache License 2.0 (https://github.com/GoogleChrome/lighthouse/blob/main/LICENSE). */\n` + bundle);
  console.log('wrote', `public/videos/sanyo-online-store/js/lighthouse-report.js (Lighthouse ${ver})`);

  // DevTools images (start view logo, panel toolbar icons)
  fs.mkdirSync(path.join(VID, 'assets', 'devtools'), { recursive: true });
  for (const [n, url] of DEVTOOLS_IMAGES) {
    const r = await fetch(url);
    if (!r.ok) { console.log(`  ${n}.svg: HTTP ${r.status} (kept the previous file)`); continue; }
    fs.writeFileSync(path.join(VID, 'assets', 'devtools', `${n}.svg`), Buffer.from(await r.text(), 'base64'));
  }
  console.log(`wrote public/videos/sanyo-online-store/assets/devtools/ (${DEVTOOLS_IMAGES.map(([n]) => n + '.svg').join(', ')})`);
}

/** an audit with its millisecond values multiplied by f (numericValue, displayValue, table cells of ms columns) */
function scaleMs(a0, f) {
  const a = clone(a0);
  if (typeof a0.numericValue === 'number') { a.numericValue = a0.numericValue * f; a.displayValue = sec(a.numericValue); }
  if (a.metricSavings) for (const k of Object.keys(a.metricSavings)) a.metricSavings[k] = Math.round(a.metricSavings[k] * f);
  const keys = (a.details.headings || []).filter((h) => /^(ms|timespanMs)$/.test(h.valueType)).map((h) => h.key);
  const each = (items) => { for (const it of items || []) { for (const k of keys) if (typeof it[k] === 'number') it[k] *= f; if (it.subItems) each(it.subItems.items); } };
  each(a.details.items);
  if (typeof a0.numericValue === 'number') a.score = a.numericValue < 2000 ? 1 : a.numericValue < 3500 ? 0.5 : 0;
  return a;
}
/** long tasks: the run's longest tasks, shortened by f; only those still ≥ 50 ms are long tasks */
function longTasks(a0, f) {
  const a = clone(a0);
  a.details.items = a0.details.items.map((it) => ({ ...it, duration: it.duration * f, startTime: it.startTime * Math.max(f, 0.2) })).filter((it) => it.duration >= 50);
  a.displayValue = `長時間実行されているタスクが ${a.details.items.length} 件見つかりました`;
  if (a.metricSavings) a.metricSavings.TBT = 0;
  return a;
}

/** the issues of each state of the story, as Lighthouse 13 reports them */
function storyAudits(base, V) {
  const A = base.audits;
  const IMG = (n) => `${DEV}/cdn/shop/files/${n}.jpg?v=1793948995`;
  const story = (n, w) => `//127.0.0.1:9292/cdn/shop/files/${n}.jpg?v=1793948995&amp;width=${w}`;
  // Lighthouse shortens long attribute values in a snippet to 75 characters + …
  const cut = (s) => (s.length > 75 ? s.slice(0, 75) + '…' : s);
  const lcpNode = A['lcp-discovery-insight'].details.items.find((x) => x.type === 'node');
  const node = (n, i, attrs) => ({
    type: 'node', lhId: `page-${i + 1}-IMG`, path: `1,HTML,1,BODY,13,MAIN,0,DIV,37,SECTION,1,DIV,1,DIV,0,DIV,${i},DIV,0,IMG`,
    selector: 'div.product-media > div.product-media__item > img',
    boundingRect: i === 0 ? lcpNode.boundingRect : { ...lcpNode.boundingRect, left: lcpNode.boundingRect.left + 382 * i, right: lcpNode.boundingRect.right + 382 * i },
    snippet: '<img ' + attrs.map(([k, v]) => (v == null ? k : `${k}="${cut(v)}"`)).join(' ') + '>',
    nodeLabel: 'div.product-media > div.product-media__item > img',
  });
  // the product images (file names from the run), the LCP image (the first one) first
  const lcpFile = (lcpNode.snippet.match(/files\/(\d{4}-[A-Z0-9]+)\.jpg/) || [])[1];
  const files = [...new Set([lcpFile, ...JSON.stringify(A['image-delivery-insight'].details).match(/files\/(\d{4}-[A-Z0-9]+)\.jpg/g).map((x) => x.slice(6, -4))].filter(Boolean))].slice(0, 4);
  const plain = (n, i) => node(n, i, [['src', story(n, 1500)], ['alt', '']]);
  const tagged = (n, i, loading) => node(n, i, [['src', story(n, 1500)], ['alt', ''], ['srcset', `${story(n, 360)} 360w, ${story(n, 720)} 720w, ${story(n, 1080)} 1080w, ${story(n, 1500)} 1500w`],
    ['width', '1500'], ['height', '1800'], ['loading', loading], ['sizes', '(min-width: 990px) 45vw, 100vw']]);

  /* before: <img src="{{ media | image_url: width: 1500 }}"> — no size, one 1500px file for every screen */
  const unsized = clone(A['unsized-images']);
  unsized.score = 0;
  unsized.metricSavings = { CLS: 0.29 };
  unsized.details.items = [...files.map((n, i) => ({ url: IMG(n) + '&width=1500', node: plain(n, i) })), ...A['unsized-images'].details.items];
  const culprits = clone(A['cls-culprits-insight']);
  culprits.score = 0;
  culprits.scoreDisplayMode = 'metricSavings';
  culprits.metricSavings = { CLS: 0.31 };
  const t0 = culprits.details.items[0];
  t0.items = [{ node: { type: 'text', value: '合計' }, score: 0.31 },
    { node: plain(files[0], 0), score: 0.29, subItems: { type: 'subitems', items: [{ extra: plain(files[0], 0), cause: 'サイズ指定されていない画像要素' }] } },
    ...A['cls-culprits-insight'].details.items[0].items.slice(1)];
  const delivery = clone(A['image-delivery-insight']);
  const sizes = [[448000, 391000], [431000, 377000], [402000, 352000], [389000, 342000]]; // 1500px files on a 412px-wide phone
  delivery.details.items = files.map((n, i) => ({
    node: plain(n, i), url: IMG(n) + '&width=1500', totalBytes: sizes[i][0], wastedBytes: sizes[i][1],
    subItems: { type: 'subitems', items: [{ reason: `この画像ファイルは、表示サイズ（412x494）に必要なサイズ（1500x1800）より大きくなっています。画像のダウンロード サイズを小さくするには、レスポンシブ画像を使用します。`, wastedBytes: sizes[i][1] }] },
  }));
  delivery.numericValue = sizes.reduce((s, x) => s + x[1], 0);
  delivery.displayValue = `推定される削減サイズ ${kib(delivery.numericValue)}${NB}KiB`;
  delivery.metricSavings = { FCP: 0, LCP: 1650 };
  delivery.score = 0;
  const unusedJs = clone(A['unused-javascript']);
  const apps = [
    { url: `${DEV}/cdn/shop/t/7/assets/legacy-review-widget.js?v=163985920571290281`, totalBytes: 437310, wastedBytes: 421888, wastedPercent: 96.5 },
    { url: `${DEV}/cdn/shop/t/7/assets/chat-support-v1.js?v=113290455820371649`, totalBytes: 201420, wastedBytes: 190464, wastedPercent: 94.6 },
  ];
  unusedJs.details.items = [...apps, ...A['unused-javascript'].details.items];
  unusedJs.details.overallSavingsBytes = unusedJs.details.items.reduce((s, x) => s + x.wastedBytes, 0);
  unusedJs.numericValue = unusedJs.details.overallSavingsBytes;
  unusedJs.displayValue = `推定される削減サイズ ${kib(unusedJs.numericValue)}${NB}KiB`;
  unusedJs.score = 0;
  const discovery = (img, lazy) => {
    const a = clone(A['lcp-discovery-insight']);
    const ck = a.details.items.find((x) => x.type === 'checklist').items;
    ck.priorityHinted = { label: '「fetchpriority=high」を適用する必要があります', value: false };
    ck.eagerlyLoaded = { label: 'LCP リソースで loading=lazy を使用しないでください', value: !lazy };
    a.details.items = a.details.items.map((x) => (x.type === 'node' ? img : x));
    a.score = 0;
    a.scoreDisplayMode = 'metricSavings';
    a.metricSavings = { LCP: lazy ? 2650 : 300 };
    return a;
  };
  Object.assign(V.before.audits, {
    'unsized-images': unsized, 'cls-culprits-insight': culprits, 'image-delivery-insight': delivery, 'unused-javascript': unusedJs,
    'lcp-discovery-insight': discovery(plain(files[0], 0), false),
  });

  /* lazy: image_tag with loading: 'lazy' on every image, the first (the LCP image) included */
  const rb = (ms) => { const a = clone(A['render-blocking-insight']); a.metricSavings = { FCP: ms, LCP: 0 }; a.displayValue = `推定される削減時間 ${ms}${NB}ミリ秒`; a.details.items = a.details.items.map((x) => (x.wastedMs ? { ...x, wastedMs: ms } : x)); return a; };
  Object.assign(V.lazy.audits, { 'lcp-discovery-insight': discovery(tagged(files[0], 0, 'lazy'), true), 'render-blocking-insight': rb(400) });
  Object.assign(V.before.audits, { 'render-blocking-insight': rb(500) });

  /* fixed: the first image eager, the rest lazy (no fetchpriority in the theme code: Lighthouse still suggests it) */
  Object.assign(V.fixed.audits, { 'lcp-discovery-insight': (() => { const a = discovery(tagged(files[0], 0, 'eager'), false); a.metricSavings = { LCP: 150 }; return a; })(), 'render-blocking-insight': rb(300) });
}

main().catch((e) => { console.error(e); process.exit(1); });
