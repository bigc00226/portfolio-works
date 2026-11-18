// After `npm run snapshot -- ec-garage-forms`: the live pages refer to the shop's SVG icon sprite with
// <use href="/user_data/packages/default/img/icons.svg#icon_…">, which the video (a file:// page) cannot load. The sprite
// (fetched from the live site: public/videos/ec-garage-forms/js/site-icons.js) is put into each page and the references
// point at it.   node tools/snapshots/ec-garage-forms/fix-site-snapshot.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.resolve(__dirname, '../../../public/videos/ec-garage-forms/js');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, 'site-icons.js'), 'utf8'), ctx);
const file = path.join(DIR, 'site-snapshot.js');
const src = fs.readFileSync(file, 'utf8');
const head = src.slice(0, src.indexOf('window.SITE_SNAPSHOT = ') + 'window.SITE_SNAPSHOT = '.length);
const S = JSON.parse(src.slice(head.length).replace(/;\s*$/, ''));
let n = 0;
for (const p of Object.values(S.pages)) {
  for (const v of Object.keys(p)) {
    let h = p[v];
    if (typeof h !== 'string') continue;
    h = h.replace(/(href=")[^"#]*icons\.svg#/g, (m, a) => { n++; return a + '#'; });
    if (!h.includes('id="garage-icons"')) h = h.replace(/<body[^>]*>/, (m) => `${m}<div id="garage-icons" style="display:none">${ctx.window.GARAGE_ICONS}</div>`);
    p[v] = h;
  }
}
fs.writeFileSync(file, head + JSON.stringify(S) + ';\n');
console.log('icons: ' + n + ' references → the inlined sprite');
