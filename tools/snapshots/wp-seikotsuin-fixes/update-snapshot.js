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
  Object.assign(merged.css, S.css);
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
const out = path.join(DIR, 'js', 'site-snapshot.js');
fs.writeFileSync(out, `/* the two live sites (tools/snapshots/wp-seikotsuin-fixes/update-snapshot.js, ${merged.capturedAt.slice(0, 10)}) — generated, do not edit */\nwindow.SITE_SNAPSHOT = ${JSON.stringify(merged)};\n`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', path.relative(ROOT, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
