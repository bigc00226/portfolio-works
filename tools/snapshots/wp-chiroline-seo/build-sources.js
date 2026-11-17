/*
 * js/sources.js of the wp-chiroline-seo video: the HTML of live pages exactly as chiroline-mitakain.com sent it
 * (live-src/*.html, fetched 2026-11-18 with curl) — for Chrome's page source view (Ctrl+U) in the video.
 *   node tools/snapshots/wp-chiroline-seo/build-sources.js
 * The states before / during the work are made from these in js/apps.js (SRC), with what WordPress output in the
 * capture (WP_SNAPSHOT.data).
 */
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(__dirname, '../../../public/videos/wp-chiroline-seo/js');
const read = (n) => fs.readFileSync(path.join(__dirname, 'live-src', n + '.html'), 'utf8').replace(/\r\n/g, '\n');
const out = { home: read('home'), voice: read('voice'), post: read('post'), category: read('category') };
fs.writeFileSync(path.join(DIR, 'sources.js'), '/* the live pages\' HTML as sent by chiroline-mitakain.com (tools/snapshots/wp-chiroline-seo/build-sources.js) — generated, do not edit */\nwindow.LIVE_SOURCES = ' + JSON.stringify(out) + ';\n');
console.log('wrote js/sources.js', Object.entries(out).map(([k, v]) => `${k} ${v.split('\n').length} lines`).join(', '));
