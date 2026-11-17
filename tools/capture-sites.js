/*
 * Captures the previews of the sites in content/sites.ts (the 一般 / デモ / ゲーム tabs).
 *   npm run capture                       all sites
 *   npm run capture -- pitch-lab-app      one site (several ids are fine)
 * Writes public/thumbs/sites/<id>-pc.webp    (1440×900 first view)
 *        public/thumbs/sites/<id>-full.webp  (whole page at 1440 wide, cut at MAX_FULL px — scrolled on hover on the list page)
 *        public/thumbs/sites/<id>-sp.webp    (390×844 smartphone first view, 2x)
 *        public/thumbs/sites/<id>-icon.*     (the site's favicon — shown in the mock address bar)
 *        public/thumbs/sites/<id>-logo.svg   (only with `logoFrom`: the header's SVG mark — for sites whose favicon is a framework default)
 * and records the capture date and the icon / logo file names in generated/captures.json.
 * Needs Node 22.18+, Google Chrome and `npm install` in the project folder.
 */
const fs = require('fs');
const path = require('path');
const { PUBLIC, CHROME, sites, readGenerated, writeGenerated, puppeteer, only, wait } = require('./lib');

const OUT = path.join(PUBLIC, 'thumbs', 'sites');
const MAX_FULL = 3600;
const SP_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

async function settle(page) {
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // walk down the page once so lazy images and scroll-in animations are loaded, then go back to the top
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    scrollTo(0, 0);
  });
  await wait(1800);
}

async function saveIcon(page, site) {
  const href = await page.evaluate(() => {
    const l = document.querySelector('link[rel="icon"][type="image/svg+xml"], link[rel="icon"][href*=".svg"]') || document.querySelector('link[rel~="icon"]');
    return l ? l.href : new URL('/favicon.ico', location.href).href;
  });
  const res = await fetch(href);
  if (!res.ok) return null;
  const type = res.headers.get('content-type') || '';
  const ext = type.includes('svg') ? 'svg' : type.includes('png') ? 'png' : 'ico';
  for (const f of fs.readdirSync(OUT)) if (f.startsWith(`${site.id}-icon.`)) fs.unlinkSync(path.join(OUT, f));
  const file = `${site.id}-icon.${ext}`;
  fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
  return file;
}

// For sites whose favicon is the framework default: take the inline SVG mark from the site's header
// (selector in `logoFrom`) and save it on the site's background colour as thumbs/sites/<id>-logo.svg.
async function saveLogo(page, site) {
  const m = await page.evaluate((sel) => {
    const svg = document.querySelector(sel);
    if (!svg) return null;
    const meta = document.querySelector('meta[name="theme-color"]');
    return { vb: svg.getAttribute('viewBox') || '0 0 24 24', inner: svg.innerHTML, bg: (meta && meta.content) || getComputedStyle(document.body).backgroundColor };
  }, site.logoFrom);
  if (!m) throw new Error(`no element for ${site.logoFrom}`);
  const file = `${site.id}-logo.svg`;
  fs.writeFileSync(path.join(OUT, file), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${m.bg}"/><svg x="9" y="9" width="46" height="46" viewBox="${m.vb}">${m.inner}</svg></svg>\n`);
  return file;
}

(async () => {
  const all = sites();
  const list = only(all);
  const captures = readGenerated('captures');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer().launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--lang=ja-JP'] });
  for (const s of list) {
    const prev = captures[s.id] || {};
    // PC: first view + the whole page
    const pc = await browser.newPage();
    await pc.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' });
    await pc.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await pc.goto(s.url, { waitUntil: 'networkidle2', timeout: 90000 });
    await settle(pc);
    await pc.screenshot({ path: path.join(OUT, `${s.id}-pc.webp`), type: 'webp', quality: 82 });
    const h = await pc.evaluate(() => document.documentElement.scrollHeight);
    await pc.screenshot({ path: path.join(OUT, `${s.id}-full.webp`), type: 'webp', quality: 76, clip: { x: 0, y: 0, width: 1440, height: Math.min(h, MAX_FULL) }, captureBeyondViewport: true });
    const icon = (await saveIcon(pc, s).catch(() => null)) || prev.icon || null;
    let logo = null;
    if (s.logoFrom) logo = await saveLogo(pc, s).catch((e) => { console.log(`  ${s.id}: logo failed (${e.message})`); return prev.logo || null; });
    await pc.close();

    // smartphone: first view
    const sp = await browser.newPage();
    await sp.setUserAgent(SP_UA);
    await sp.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' });
    await sp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await sp.goto(s.url, { waitUntil: 'networkidle2', timeout: 90000 });
    await settle(sp);
    await sp.screenshot({ path: path.join(OUT, `${s.id}-sp.webp`), type: 'webp', quality: 80 });
    await sp.close();

    captures[s.id] = Object.assign({ date: new Date().toLocaleDateString('sv-SE'), icon }, logo ? { logo } : {});
    console.log(`${s.id} (${s.registry}): page ${h}px${h > MAX_FULL ? ` (cut at ${MAX_FULL})` : ''}, icon ${icon || '—'}${logo ? `, logo ${logo}` : ''}`);
  }
  await browser.close();
  // keep only sites that are still in a registry, in registry order
  const out = {};
  for (const s of all) if (captures[s.id]) out[s.id] = captures[s.id];
  console.log('wrote', writeGenerated('captures', out));
})().catch((e) => { console.error(e); process.exit(1); });
