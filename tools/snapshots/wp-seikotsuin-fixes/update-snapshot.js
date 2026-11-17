// Captures the two live sites of the video (はらいろ整骨院 harairo.com / へいわじま整骨院 heiwajima-seikotsuin.com) and
// merges them into public/videos/wp-seikotsuin-fixes/js/site-snapshot.js + assets/site/.
//
//   npm run snapshot -- wp-seikotsuin-fixes   (in the project folder; images are converted to WebP afterwards)
//
// Each site is captured by the shared tool (tools/snapshot-store.js: the page as the browser shows it after the site's own
// scripts ran, at PC width 1920px and smartphone width 390px, stylesheets byte-for-byte, images at the size shown) in a
// temporary folder, then both are merged: pages keep their keys (harairo, heiwajima, heiwajima-menu), the stylesheets are
// keyed by their local path (assets/site/<host>/…, so the two sites never collide), `sites` holds each site's title,
// address and favicon. Needs Node 22.18+, Google Chrome and network access.
// It also saves the two theme stylesheets as the servers send them (js/theme-css.js: the sources the video edits in
// VS Code); `node tools/snapshots/wp-seikotsuin-fixes/update-snapshot.js --css` does only that.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos/wp-seikotsuin-fixes');
const SITES = {
  harairo: { origin: 'https://harairo.com', pages: { harairo: '/' }, remove: [] },
  heiwajima: { origin: 'https://heiwajima-seikotsuin.com', pages: { heiwajima: '/', 'heiwajima-menu': '/menu' }, remove: [] },
};

/**
 * harairo's base.css starts with `@import url("https://fonts.googleapis.com/css2?family=…:wght@400;500;700&display=swap");`.
 * The shared capture tool cuts that address at the first ";" and puts an HTML page in its place
 * (`@media "https://…wght@400{<!doctype html>…</html>\n}500;700&display=swap");`): the @import is put back as it was.
 */
function fixImport(css) {
  return css.replace(/@media "(https:\/\/fonts\.googleapis\.com\/[^"{]*)\{<!doctype html>[\s\S]*?<\/html>\s*\}([^"]*)"\);/i, (m, a, b) => `@import url("${a};${b}");`);
}
/**
 * heiwajima's main visual is cut out with a CSS mask image (mask-image: url(…mask_mv_pc.webp)). A mask image is loaded
 * with CORS, which a page opened from a file (file://) cannot give, so Chrome blocks it: the mask images are put in the
 * stylesheet as data: URLs (`dir` = the video folder the url()s are relative to).
 */
function inlineMasks(css, dir) {
  const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', gif: 'image/gif' };
  return css.replace(/((?:-webkit-)?mask(?:-image)?\s*:[^;{}]*?)url\("(assets\/site\/[^"]+)"\)/g, (m, pre, rel) => {
    const file = path.join(dir, rel);
    const ext = (rel.match(/\.(\w+)$/) || [])[1];
    if (!fs.existsSync(file) || !MIME[ext]) return m;
    return `${pre}url("data:${MIME[ext]};base64,${fs.readFileSync(file).toString('base64')}")`;
  });
}
/**
 * The two theme stylesheets as the servers send them (the sources shown in VS Code: js/theme-css.js). The snapshot's
 * copies point their url()s at the local images (converted to WebP), these keep the theme's own paths.
 */
const THEME_CSS = {
  'harairo/common/css/base.css': 'https://harairo.com/wp/wp-content/themes/harairoSeikotsuinWp/common/css/base.css',
  'heiwajima/style.css': 'https://heiwajima-seikotsuin.com/wp-content/themes/heiwajima/style.css',
};
async function writeThemeCss() {
  const out = {};
  for (const [k, url] of Object.entries(THEME_CSS)) {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' } });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    out[k] = (await r.text()).replace(/\r\n?/g, '\n');
  }
  const f = path.join(DIR, 'js', 'theme-css.js');
  fs.writeFileSync(f, `/* the theme stylesheets as served (tools/snapshots/wp-seikotsuin-fixes/update-snapshot.js, ${new Date().toISOString().slice(0, 10)}) — generated, do not edit */\nwindow.THEME_CSS = ${JSON.stringify(out)};\n`);
  console.log('wrote', path.relative(ROOT, f));
}
module.exports = { fixImport, inlineMasks };
if (require.main !== module) return;
if (process.argv.includes('--css')) { writeThemeCss().catch((e) => { console.error(e); process.exit(1); }); return; }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seikotsuin-'));
const merged = { url: SITES.harairo.origin + '/', capturedAt: new Date().toISOString(), title: '', favicon: null, pages: {}, css: {}, products: [], catalog: null, sites: {} };
for (const [key, cfg] of Object.entries(SITES)) {
  const d = path.join(tmp, key);
  fs.mkdirSync(path.join(d, 'js'), { recursive: true });
  fs.writeFileSync(path.join(d, 'js', 'config.js'), `window.VIDEO = { snapshot: ${JSON.stringify(cfg)} };\n`);
  console.log(`> ${key}: ${cfg.origin}`);
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'snapshot-store.js'), key], { stdio: 'inherit', env: { ...process.env, VIDEO_ROOT: tmp } });
  if (r.status) process.exit(r.status);
  const w = {};
  new Function('window', fs.readFileSync(path.join(d, 'js', 'site-snapshot.js'), 'utf8'))(w);
  const S = w.SITE_SNAPSHOT;
  Object.assign(merged.pages, S.pages);
  for (const [k, css] of Object.entries(S.css)) merged.css[k] = fixImport(css);
  merged.sites[key] = { url: cfg.origin + '/', title: S.title, favicon: S.favicon };
  if (key === 'harairo') { merged.title = S.title; merged.favicon = S.favicon; }
}
// replace the video's copies
fs.rmSync(path.join(DIR, 'assets', 'site'), { recursive: true, force: true });
for (const key of Object.keys(SITES)) {
  const from = path.join(tmp, key, 'assets', 'site');
  if (fs.existsSync(from)) fs.cpSync(from, path.join(DIR, 'assets', 'site'), { recursive: true });
}
fs.mkdirSync(path.join(DIR, 'js'), { recursive: true });
for (const k of Object.keys(merged.css)) merged.css[k] = inlineMasks(merged.css[k], DIR);
const out = path.join(DIR, 'js', 'site-snapshot.js');
fs.writeFileSync(out, `/* the two live sites (tools/snapshots/wp-seikotsuin-fixes/update-snapshot.js, ${merged.capturedAt.slice(0, 10)}) — generated, do not edit */\nwindow.SITE_SNAPSHOT = ${JSON.stringify(merged)};\n`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', path.relative(ROOT, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
// the Google Maps of both footers (iframes, removed by the capture): photographed from the live pages
spawnSync(process.execPath, [path.join(__dirname, 'capture-maps.js')], { stdio: 'inherit' });
writeThemeCss().catch((e) => { console.error(e); process.exit(1); });
