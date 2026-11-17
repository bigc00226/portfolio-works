/*
 * After `npm run snapshot -- wp-ninshu-woocommerce`: one stylesheet the live shop links
 * (instagram-feed/assets/tokens/sb-tokens-local.css) does not exist on the server — WordPress answers with its HTML page,
 * which the snapshot stored as that stylesheet's "CSS". Put into a <style>, that HTML would close the style and run the
 * page's scripts in the video. A stylesheet that is really an HTML page is emptied here (the browser ignores it on the
 * live site too: it is not CSS).
 *   node tools/snapshots/wp-ninshu-woocommerce/fix-site-css.js
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../../../public/videos/wp-ninshu-woocommerce/js/site-snapshot.js');
const src = fs.readFileSync(FILE, 'utf8');
const at = src.indexOf('window.SITE_SNAPSHOT = ');
const head = src.slice(0, at);
const snap = JSON.parse(src.slice(at + 'window.SITE_SNAPSHOT = '.length).replace(/;\s*$/, ''));
const fixed = [];
for (const [url, css] of Object.entries(snap.css || {})) {
  if (/<!DOCTYPE html|<html[\s>]|<\/style|<script/i.test(css)) { snap.css[url] = ''; fixed.push(url); }
}
fs.writeFileSync(FILE, head + 'window.SITE_SNAPSHOT = ' + JSON.stringify(snap) + ';\n');
console.log(`fix-site-css: ${fixed.length ? 'emptied ' + fixed.join(', ') : 'nothing to fix'}`);
