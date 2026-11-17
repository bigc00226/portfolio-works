/*
 * Measures every video (length + where each chapter starts) and captures its thumbnail.
 *   npm run timeline                          all videos
 *   npm run timeline -- yoshitake-koumuten    one video (several ids are fine)
 * Writes generated/timeline.json and public/thumbs/videos/<id>.webp (the frame at `thumbAt` seconds, set per video in
 * content/videos.ts). Needs Node 22.18+, Google Chrome and `npm install` in the project folder.
 *
 * The videos run on a deterministic clock (public/shared/stage.js), so a turbo run to the end gives the exact length.
 */
const fs = require('fs');
const path = require('path');
const { videos, videoThumb, readGenerated, writeGenerated, launch, only, openVideo, runToEnd, openAt } = require('./lib');

(async () => {
  const list = only(videos());
  const tl = readGenerated('timeline');
  const browser = await launch();
  for (const v of list) {
    let t0 = Date.now();
    const page = await openVideo(browser, v.id, '', { onError: (m) => console.log('  ', m) });
    console.log(v.id, 'ready in', Date.now() - t0, 'ms');
    t0 = Date.now();
    const r = await runToEnd(page);
    await page.close();
    if (r.error) { console.log(v.id, 'ERROR', r.error); continue; }
    console.log(v.id, 'length', (r.duration / 1000).toFixed(1), 's (measured in', ((Date.now() - t0) / 1000).toFixed(0), 's)');
    tl[v.id] = { duration: r.duration, starts: r.starts };
    if (v.thumbAt != null) {
      const shot = await openAt(browser, v.id, v.thumbAt);
      fs.mkdirSync(path.dirname(videoThumb(v.id)), { recursive: true });
      await shot.screenshot({ path: videoThumb(v.id), type: 'webp', quality: 82 });
      await shot.close();
      console.log(v.id, 'thumbnail at', v.thumbAt, 's');
    }
  }
  await browser.close();
  // keep only videos that are still in the registry, in registry order
  const out = {};
  for (const v of videos()) if (tl[v.id]) out[v.id] = tl[v.id];
  console.log('wrote', writeGenerated('timeline', out));
})().catch((e) => { console.error(e); process.exit(1); });
