/*
 * After `npm run snapshot -- wp-ribuild-renewal`: deletes the web font fallbacks Chrome never loads.
 *   node tools/snapshots/wp-ribuild-renewal/prune-site-fonts.js
 * ribuild.jp self-hosts Zen Old Mincho / Zen Kaku Gothic New with @font-face src lists of woff2, woff, ttf, eot; the
 * snapshot tool downloads every url() of the stylesheets, but Chrome only requests the first format it supports
 * (woff2), so a .woff / .ttf / .eot next to a .woff2 of the same font is never loaded (≈ 20 MB here).
 */
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '../../../public/videos/wp-ribuild-renewal/assets/site');
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const files = walk(DIR);
const woff2 = new Set(files.filter((f) => f.endsWith('.woff2')).map((f) => f.replace(/-[0-9a-f]{10}\.woff2$/, '').replace(/\.woff2$/, '')));
let n = 0, bytes = 0;
for (const f of files) {
  if (!/\.(woff|ttf|eot)$/i.test(f)) continue;
  const base = f.replace(/-[0-9a-f]{10}\.(woff|ttf|eot)$/i, '').replace(/\.(woff|ttf|eot)$/i, '');
  if (!woff2.has(base)) continue;
  bytes += fs.statSync(f).size;
  fs.rmSync(f);
  n++;
}
console.log(`removed ${n} font fallbacks (${(bytes / 1048576).toFixed(1)} MB) that a .woff2 makes unused`);
