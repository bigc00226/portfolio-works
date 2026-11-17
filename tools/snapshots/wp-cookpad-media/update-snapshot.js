/*
 * The live info.cookpad.com for the wp-cookpad-media video:   npm run snapshot -- wp-cookpad-media
 * 1. tools/snapshot-store.js wp-cookpad-media (the pages of js/config.js `snapshot`, PC width)
 * 2. the icons: the pages draw them with <use xlink:href="/assets/images/common/sprite.svg#…">, which a page opened from
 *    a file cannot load from another file — the sprite (downloaded from the live site) goes into each page, the
 *    references point at its symbols (#icon_…)
 * 3. the site's web font (a commercial font, 游ゴシック体 Pr6N B, served by font.realtype.jp as per-page subsets that
 *    only exist as blob: URLs in the visitor's browser) is not copied: its @font-face rules are removed, the headings
 *    fall back to the next fonts of the site's own CSS
 * (tools/snapshot.js converts the images to WebP afterwards.)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const ID = 'wp-cookpad-media';
const FILE = path.join(ROOT, 'public/videos', ID, 'js/site-snapshot.js');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

(async () => {
  if (!process.argv.includes('--post')) {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/snapshot-store.js'), ID], { stdio: 'inherit' });
    if (r.status) process.exit(r.status);
  }
  const svg = await (await fetch('https://info.cookpad.com/assets/images/common/sprite.svg', { headers: { 'user-agent': UA } })).text();
  const inner = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>'));
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" data-demo="sprite">${inner}</svg>`;
  const W = {};
  new Function('window', fs.readFileSync(FILE, 'utf8'))(W);
  const S = W.SITE_SNAPSHOT;
  let refs = 0, fonts = 0;
  for (const page of Object.values(S.pages)) {
    for (const view of Object.keys(page)) {
      let h = page[view];
      if (typeof h !== 'string') continue;
      h = h.replace(/<style>@font-face\{[^<]*?url\('blob:[^<]*?<\/style>/g, () => { fonts++; return ''; });
      h = h.replace(/(xlink:href|href)="[^"]*\/assets\/images\/common\/sprite\.svg#/g, (m, a) => { refs++; return `${a}="#`; });
      if (!h.includes('data-demo="sprite"')) h = h.replace(/(<body[^>]*>)/, `$1${sprite}`);
      page[view] = h;
    }
  }
  const head = fs.readFileSync(FILE, 'utf8').match(/^\/\*[\s\S]*?\*\/\n/);
  fs.writeFileSync(FILE, (head ? head[0] : '') + 'window.SITE_SNAPSHOT = ' + JSON.stringify(S) + ';\n');
  console.log(`sprite: ${refs} references → the inlined sprite; ${fonts} @font-face rules with blob: URLs removed`);
})().catch((e) => { console.error(e); process.exit(1); });
