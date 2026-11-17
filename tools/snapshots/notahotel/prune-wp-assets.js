/*
 * Removes the files in public/videos/notahotel/assets/wp/ that the video never loads.
 *   node tools/snapshots/notahotel/prune-wp-assets.js        (after capture-wp-admin.js and tools/webp.js)
 *
 * The captured wp-admin pages keep their stylesheets whole, so they point at every font and image WordPress, ACF and the
 * installed themes declare (the themes' web fonts, the TinyMCE skin, ACF's banners …); only a few are ever drawn.
 * The video is run to its end (every screen is shown) and every file it requests under assets/wp/ is kept.
 * The stylesheets still name the removed files; a browser only asks for them if one of those rules ever applies —
 * `npm run verify -- notahotel` reports it if that happens.
 */
const fs = require('fs');
const path = require('path');
const { launch, openVideo, runToEnd, fileUrl, PUBLIC } = require('../../lib');

const DIR = path.join(PUBLIC, 'videos', 'notahotel');
const WPA = path.join(DIR, 'assets', 'wp');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

(async () => {
  const used = new Set();
  const browser = await launch();
  const base = fileUrl(WPA).toLowerCase();
  // the wp-admin screens are loaded when the video first shows them (during the run below), so this sees every request
  const p = await openVideo(browser, 'notahotel', '');
  p.on('request', (r) => { const u = decodeURI(r.url()).toLowerCase(); if (u.startsWith(base)) used.add(u.slice(base.length).split(/[?#]/)[0]); });
  const r = await runToEnd(p);
  await browser.close();
  if (r.error) throw new Error(r.error);
  let kept = 0, removed = 0, bytes = 0;
  for (const f of walk(WPA)) {
    const rel = '/' + path.relative(WPA, f).split(path.sep).join('/').toLowerCase();
    if (used.has(rel)) { kept++; continue; }
    bytes += fs.statSync(f).size;
    fs.rmSync(f);
    removed++;
  }
  // empty folders
  const prune = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(d, e.name)); if (d !== WPA && !fs.readdirSync(d).length) fs.rmdirSync(d); };
  prune(WPA);
  console.log(`kept ${kept} files the video loads, removed ${removed} (${(bytes / 1048576).toFixed(1)} MB)`);
})().catch((e) => { console.error(e); process.exit(1); });
