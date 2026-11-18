/*
 * The real files the video's editor shows, as js/cn-src.js (window.CN_SRC):
 *   diff      the 4.3.1-p1 security release (GitHub compare 4.3.1...4.3.1-p1, without tests/ and package-lock.json): eccube-4.3.1-p1.diff
 *   htaccess  EC-CUBE 4.3.1-p1's own .htaccess (from the installed base)
 *   outside   outside.json (the public response headers, certificate and script tags of www.chokunavi.shop)
 *
 *   node tools/snapshots/ec-chokunavi-maintenance/build-src.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const BASE = path.resolve(ROOT, '../eccube-local/inst/base');
const out = {
  diff: fs.readFileSync(path.join(__dirname, 'eccube-4.3.1-p1.diff'), 'utf8').replace(/\r/g, ''),
  htaccess: fs.readFileSync(path.join(BASE, '.htaccess'), 'utf8').replace(/\r/g, ''),
  outside: JSON.parse(fs.readFileSync(path.join(__dirname, 'outside.json'), 'utf8')),
};
const file = path.join(ROOT, 'public/videos/ec-chokunavi-maintenance/js/cn-src.js');
fs.writeFileSync(file, '/* real files shown in the editor (tools/snapshots/ec-chokunavi-maintenance/build-src.js) — generated, do not edit */\nwindow.CN_SRC = ' + JSON.stringify(out) + ';\n');
console.log('wrote', path.relative(ROOT, file), fs.statSync(file).size, 'bytes');
