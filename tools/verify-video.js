/*
 * Runs videos to the end at turbo speed and reports what went wrong: script errors, files the page could not load
 * (a broken image / asset path), typing that did not produce the expected text. Optionally takes screenshots.
 *   npm run verify                                   all videos
 *   npm run verify -- nissin-store green-base        some videos
 *   npm run verify -- nissin-store --shots=12,95 --out=C:/tmp/shots   + screenshots at those seconds (with captions)
 * Exit code 1 when any video has a problem. Does not write anything in the project.
 */
const path = require('path');
const fs = require('fs');
const { videos, launch, only, option, openVideo, runToEnd, openAt } = require('./lib');

(async () => {
  const list = only(videos());
  const shots = (option('shots') || '').split(',').filter(Boolean).map(Number);
  const out = option('out') || process.cwd();
  const browser = await launch();
  let bad = 0;
  for (const v of list) {
    const errs = new Set();
    const t0 = Date.now();
    let r;
    try {
      const page = await openVideo(browser, v.id, '', { onError: (m) => errs.add(m) });
      r = await runToEnd(page);
      await page.close();
    } catch (e) { errs.add(e.message); }
    if (r && r.error) errs.add('ERROR ' + r.error);
    if (r && r.typeDiff.length) errs.add('typing differs: ' + JSON.stringify(r.typeDiff).slice(0, 400));
    const len = r ? `${Math.floor(r.duration / 60000)}:${String(Math.round((r.duration % 60000) / 1000)).padStart(2, '0')}` : '—';
    console.log(`${errs.size ? '✗' : '✓'} ${v.id}  length ${len}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    for (const e of errs) console.log('    ' + e);
    if (errs.size) bad++;
    for (const s of shots) {
      const p = await openAt(browser, v.id, s, { captions: true });
      fs.mkdirSync(out, { recursive: true });
      const file = path.join(out, `${v.id}-t${s}.jpg`);
      await p.screenshot({ path: file, type: 'jpeg', quality: 72 });
      await p.close();
      console.log('    shot', file);
    }
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
