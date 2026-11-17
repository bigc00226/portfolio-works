// Captures the two clinics' live sites the video shows and writes public/videos/wp-clinic-contact-form/js/site-snapshot.js
//   npm run snapshot -- wp-clinic-contact-form   (in the project folder; images are converted to WebP afterwards)
//
// 1. 京橋ウェルネスクリニック (https://miyazawaclinic.net): the pages in js/config.js `snapshot` (お問い合わせ / サンクスページ),
//    with the generic capture tool (tools/snapshot-store.js) — PC 1920 px and smartphone 390 px.
// 2. かとう歯科 (https://kato-dental-clinic.net): its お問合せ page, captured the same way into a temporary folder and merged
//    in as the page "kato-contact" (its stylesheets keep their own keys, its files go to assets/site/kato-dental-clinic.net/).
//    The clinic's own title and favicon are kept as SITE_SNAPSHOT.kato.
// Needs Node 22.18+, Google Chrome and network access.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const ID = 'wp-clinic-contact-form';
const DIR = path.join(ROOT, 'public/videos', ID);
const TOOL = path.join(ROOT, 'tools/snapshot-store.js');
const read = (f) => { const w = {}; new Function('window', fs.readFileSync(f, 'utf8'))(w); return w; };
const run = (args, env) => { const r = spawnSync(process.execPath, args, { stdio: 'inherit', env: { ...process.env, ...env } }); if (r.status) process.exit(r.status); };

// 1. miyazawaclinic.net (config.js)
run([TOOL, ID]);
const main = read(path.join(DIR, 'js/site-snapshot.js')).SITE_SNAPSHOT;

// 2. kato-dental-clinic.net (a temporary video folder)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'kato-'));
fs.mkdirSync(path.join(TMP, 'kato/js'), { recursive: true });
fs.writeFileSync(path.join(TMP, 'kato/js/config.js'), `window.VIDEO = { snapshot: { origin: 'https://kato-dental-clinic.net', pages: { contact: '/contact/' }, remove: ['.grecaptcha-badge'] } };\n`);
run([TOOL, 'kato'], { VIDEO_ROOT: TMP });
const kato = read(path.join(TMP, 'kato/js/site-snapshot.js')).SITE_SNAPSHOT;
const src = path.join(TMP, 'kato/assets/site');
for (const host of fs.readdirSync(src)) fs.cpSync(path.join(src, host), path.join(DIR, 'assets/site', host), { recursive: true });
fs.rmSync(TMP, { recursive: true, force: true });

main.pages['kato-contact'] = kato.pages.contact;
Object.assign(main.css, kato.css);
main.kato = { url: kato.url, title: kato.title, favicon: kato.favicon, capturedAt: kato.capturedAt };
const out = path.join(DIR, 'js/site-snapshot.js');
fs.writeFileSync(out, '/* the live sites (tools/snapshots/wp-clinic-contact-form/update-snapshot.js) — generated, do not edit */\nwindow.SITE_SNAPSHOT = ' + JSON.stringify(main) + ';\n');
console.log('merged kato-dental-clinic.net →', path.relative(ROOT, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
