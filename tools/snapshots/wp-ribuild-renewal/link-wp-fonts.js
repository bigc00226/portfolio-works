/*
 * After capture-wp.js (it runs this at the end; also on its own: node tools/snapshots/wp-ribuild-renewal/link-wp-fonts.js)
 * The new theme's style.min.css (live ribuild.jp) loads its web fonts from the theme's assets/fonts/ — files the theme
 * zip of the video does not carry, so in the captured WordPress screens (the Elementor preview) the font URLs
 * `../fonts/zen-…-japanese-<weight>-normal.woff2` point nowhere. The site snapshot already has the same fonts from the
 * live site (assets/site/ribuild.jp/_/…woff2): the WordPress screens are pointed at those (same family and weight).
 */
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '../../../public/videos/wp-ribuild-renewal');
const FAMILY = { 'zen-kaku-gothic-new': 'Zen Kaku Gothic New', 'zen-old-mincho': 'Zen Old Mincho' };

function linkFonts() {
  const site = fs.readFileSync(path.join(DIR, 'js/site-snapshot.js'), 'utf8');
  const map = {};
  for (const m of site.matchAll(/@font-face\{([^}]*)\}/g)) {
    const b = m[1].replace(/\\"/g, '"');
    const fam = (b.match(/font-family:\s*"?([^;"]+)"?/) || [])[1];
    const w = (b.match(/font-weight:\s*(\d+)/) || [])[1];
    const url = (b.match(/url\((assets\/site\/[^)]+\.woff2)\)/) || [])[1];
    if (fam && w && url && fs.existsSync(path.join(DIR, url))) map[`${fam.trim()}|${w}`] = url;
  }
  const file = path.join(DIR, 'js/wp-snapshot.js');
  let wp = fs.readFileSync(file, 'utf8');
  let n = 0;
  const missing = new Set();
  wp = wp.replace(/url\(\.\.\/fonts\/([a-z-]+)\/\1-japanese-(\d+)-normal\.woff2\)/g, (all, slug, w) => {
    const to = map[`${FAMILY[slug]}|${w}`];
    if (!to) { missing.add(`${slug} ${w}`); return all; }
    n++;
    return `url(${to})`;
  });
  fs.writeFileSync(file, wp);
  console.log(`linked ${n} font URLs of the WordPress screens to the site snapshot's fonts` + (missing.size ? ` — no match: ${[...missing].join(', ')}` : ''));
}

module.exports = linkFonts;
if (require.main === module) linkFonts();
