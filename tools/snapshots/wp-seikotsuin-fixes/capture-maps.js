// The footers of both live sites show a Google Map (an <iframe> of the Maps embed). The shared capture tool
// (tools/snapshot-store.js) removes iframes, which leaves an empty box: this script photographs each map as the live
// page shows it (PC 1920px / smartphone 390px), saves it as assets/site/maps/<site>-<view>.webp and puts it in the
// captured pages of js/site-snapshot.js in place of the iframe (an <img> with the iframe's size and corners).
//
//   node tools/snapshots/wp-seikotsuin-fixes/capture-maps.js     (update-snapshot.js runs it at the end)
//
// Public pages only (no login); a fresh browser profile (a Chrome window opens off-screen for about a minute).
// Needs Google Chrome and network access.
const fs = require('fs');
const path = require('path');
const { puppeteer, CHROME, wait } = require('../../lib');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos/wp-seikotsuin-fixes');
const MAPS = [
  { site: 'harairo', url: 'https://harairo.com/', box: 'ftrMap', pages: ['harairo'] },
  { site: 'heiwajima', url: 'https://heiwajima-seikotsuin.com/', box: 'footer_map', pages: ['heiwajima', 'heiwajima-menu'] },
];
const VIEWS = { pc: { width: 1920, height: 1080 }, sp: { width: 390, height: 844, isMobile: true, hasTouch: true } };
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const UA_SP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

(async () => {
  fs.mkdirSync(path.join(DIR, 'assets/site/maps'), { recursive: true });
  // a visible (off-screen) window: in headless Chrome the embed never fills its place card (it stays a spinner)
  const browser = await puppeteer().launch({ executablePath: CHROME, headless: false, defaultViewport: null, args: ['--window-position=-3000,0', '--window-size=1920,1180', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const found = {};
  for (const m of MAPS) {
    for (const [view, vp] of Object.entries(VIEWS)) {
      const page = await browser.newPage();
      await page.setUserAgent(view === 'sp' ? UA_SP : UA_PC);
      await page.setViewport({ ...vp, deviceScaleFactor: 1 });
      await page.bringToFront();
      await page.goto(m.url, { waitUntil: 'networkidle2', timeout: 90000 });
      const sel = `.${m.box} iframe`;
      await page.waitForSelector(sel, { timeout: 30000 });
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
      // the embed's own page: the map and its place card (name, address) drawn
      const el = await page.$(sel);
      let frame = null;
      for (let i = 0; i < 60 && !frame; i++) { frame = await el.contentFrame(); if (!frame || !/google\.[a-z.]+\/maps/.test(frame.url())) { frame = null; await wait(500); } }
      if (!frame) throw new Error(`${m.site} ${view}: the map did not load`);
      await frame.waitForSelector('.gm-style', { timeout: 30000 });
      await wait(14000);   // the tiles and the place card (name, address, rating)
      const css = await page.evaluate((s) => {
        const f = document.querySelector(s), c = getComputedStyle(f), r = f.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), radius: c.borderRadius, position: c.position, top: c.top, left: c.left, border: c.border };
      }, sel);
      // (now and then the frame is not painted yet in the shot — only the page's background: the picture is then
      // nearly flat — try again)
      let png;
      for (let k = 0; k < 4; k++) {
        await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
        await wait(1500);
        const r = await page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height }; }, sel);
        png = await page.screenshot({ type: 'png', clip: r, captureBeyondViewport: false });
        const { channels } = await sharp(png).stats();
        if (channels[0].stdev > 15) break;
        console.warn(`  ${m.site} ${view}: the map is not drawn yet, again`);
        await wait(5000);
      }
      const rel = `assets/site/maps/${m.site}-${view}.webp`;
      await sharp(png).webp({ quality: 82 }).toFile(path.join(DIR, rel));
      found[`${m.site}:${view}`] = { rel, css };
      console.log('map', m.site, view, `${css.w}×${css.h}`, rel);
      await page.close();
    }
  }
  await browser.close();

  // into the snapshot
  const f = path.join(DIR, 'js', 'site-snapshot.js');
  const src = fs.readFileSync(f, 'utf8');
  const win = {};
  new Function('window', src)(win);
  const S = win.SITE_SNAPSHOT;
  let n = 0;
  for (const m of MAPS) {
    for (const key of m.pages) {
      for (const view of Object.keys(VIEWS)) {
        const hit = found[`${m.site}:${view}`];
        if (!hit || !S.pages[key] || !S.pages[key][view]) continue;
        const c = hit.css;
        const pos = c.position !== 'static' ? `position:${c.position};top:${c.top};left:${c.left};` : '';
        const img = `<img class="demo-map" src="${hit.rel}" alt="" width="${c.w}" height="${c.h}" style="display:block;${pos}width:100%;max-width:${c.w}px;height:${c.h}px;object-fit:cover;border-radius:${c.radius};border:0">`;
        const re = new RegExp(`(<div class="${m.box}">)\\s*(?:<img class="demo-map"[^>]*>\\s*)?(</div>)`);
        const before = S.pages[key][view];
        if (!re.test(before)) { console.warn("  no map box in", key, view); continue; }
        S.pages[key][view] = before.replace(re, `$1${img}$2`);
        n++;
      }
    }
  }
  const head = src.slice(0, src.indexOf('window.SITE_SNAPSHOT'));
  fs.writeFileSync(f, `${head}window.SITE_SNAPSHOT = ${JSON.stringify(S)};\n`);
  console.log('maps put in', n, 'pages');
})().catch((e) => { console.error(e); process.exit(1); });
