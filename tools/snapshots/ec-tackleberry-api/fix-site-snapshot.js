// After `npm run snapshot -- ec-tackleberry-api`: the live shop's CSS draws its menu icons with mask-image: url(…/icons/icon-black-*.svg).
// A file:// page cannot use a file as a CSS mask (Chrome blocks it as a cross-origin image), so those SVGs (downloaded by the snapshot,
// unchanged) are put into the CSS as data: URLs.   node tools/snapshots/ec-tackleberry-api/fix-site-snapshot.js
const fs = require('fs');
const path = require('path');
const VIDEO = path.resolve(__dirname, '../../../public/videos/ec-tackleberry-api');
const file = path.join(VIDEO, 'js/site-snapshot.js');
let src = fs.readFileSync(file, 'utf8');
let n = 0;
src = src.replace(/url\((assets\/site\/[^)"']+?\.svg)\)/g, (m, rel) => {
  const f = path.join(VIDEO, rel.replace(/\/\/+/g, '/'));
  if (!fs.existsSync(f)) return m;
  n++;
  return `url(data:image/svg+xml;base64,${fs.readFileSync(f).toString('base64')})`;
});
fs.writeFileSync(file, src);
console.log(`site-snapshot.js: ${n} SVG references in CSS → data: URLs`);
