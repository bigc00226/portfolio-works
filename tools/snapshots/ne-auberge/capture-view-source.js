/*
 * Renders the dev server's page source in Chrome's real view-source page (view-source:, Blink's HTMLViewSourceDocument:
 * line-number table, syntax spans, resource links, the "行を折り返す" checkbox) and writes
 * public/videos/ne-auberge/js/view-source-snapshot.js — the markup Chrome built, plus Blink's own view-source stylesheet
 * (third_party/blink/renderer/core/css/view-source.css, BSD licence), which Chrome applies as a user-agent sheet.
 *   node tools/snapshots/ne-auberge/capture-view-source.js        (Node 22.18+, Google Chrome; needs the internet only
 *                                                                  to fetch view-source.css from chromium.googlesource.com)
 * Two states: broken (the JSON-LD printed as {JSON.stringify(schema)}) and fixed (set:html) — the same source the
 * video pastes into the validator (devSource() in js/scenario.js, from js/site-source.js).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { launch, videoDir, wait } = require('../../lib');

const DIR = videoDir('ne-auberge');
const OUT = path.join(DIR, 'js', 'view-source-snapshot.js');
const CSS_URL = 'https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/css/view-source.css?format=TEXT';

const w = {};
new Function('window', fs.readFileSync(path.join(DIR, 'js', 'site-source.js'), 'utf8'))(w);
function devSource(jsonldOk) {
  let h = w.SITE_SOURCE;
  h = h.replace(/<link rel="stylesheet" href="\/_astro\/[^"]+">\n?/g, '');
  h = h.replace('<head>', '<head>\n<script type="module" src="/@vite/client"></script>');
  h = h.replace('</title>', '</title>\n<link rel="stylesheet" href="/src/styles/global.css">');
  if (!jsonldOk) h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">{JSON.stringify(schema)}</script>');
  const head = h.slice(0, h.indexOf('</head>')).replace(/><(meta|link|script|title|style)/g, '>\n<$1');
  return head + h.slice(h.indexOf('</head>'));
}

(async () => {
  const css = Buffer.from(await (await fetch(CSS_URL)).text(), 'base64').toString('utf8');
  if (!/\.line-number/.test(css)) throw new Error('view-source.css not found');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-'));
  const browser = await launch(['--lang=ja-JP']);
  const states = {};
  for (const [name, ok] of [['broken', false], ['fixed', true]]) {
    const file = path.join(tmp, `${name}.html`);
    fs.writeFileSync(file, devSource(ok));
    const p = await browser.newPage();
    await p.setViewport({ width: 960, height: 948 });
    await p.goto('view-source:' + pathToFileURL(file).href);
    await wait(500);
    states[name] = await p.evaluate(() => ({
      htmlAttrs: [...document.documentElement.attributes].map((a) => [a.name, a.value]),
      head: document.head.innerHTML,
      body: document.body.innerHTML,
      lines: document.querySelectorAll('td.line-number').length,
    }));
    console.log(name, states[name].lines, 'lines', Math.round(states[name].body.length / 1024) + ' KB');
    await p.close();
  }
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.writeFileSync(OUT, '/* Chrome\'s view-source page of the dev server\'s HTML, captured by tools/snapshots/ne-auberge/capture-view-source.js — generated, do not edit.\n'
    + '   css: Blink\'s view-source.css (chromium/src third_party/blink/renderer/core/css/view-source.css, BSD licence) */\n'
    + 'window.VIEW_SOURCE_SNAPSHOT = ' + JSON.stringify({ capturedAt: new Date().toISOString().slice(0, 10), css, states }) + ';\n');
  console.log('wrote', path.relative(process.cwd(), OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
