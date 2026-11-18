/*
 * Checks the games of the ゲーム tab in Chrome, at the two sizes of the live preview.
 *   npm run game-check                       every game folder in public/games/
 *   npm run game-check -- shogi nanpure      some games
 *   npm run game-check -- shogi --out=<dir>  also save screenshots there (<id>-pc.png, <id>-sp.png, and the self-test's shots)
 *
 * For each game: public/ is served on a local port, /games/<id>/index.html (the URL the site uses) is opened at PC (1440×900) and smartphone (390×844, touch)
 * size, and reported are
 *   - script errors (pageerror, console.error) and files that failed to load (404)
 *   - the images of images.json that are missing or not the listed size
 *   - a page that scrolls (the games fit the window) — and, when the game defines it, the result of
 *     window.__gameSelfTest(): an async function the game provides that plays a little (clicks, keys, a CPU move …)
 *     and returns { ok: boolean, notes: string[] }; it may call window.__shot('<name>') to ask for a screenshot.
 * Exit code 1 when something is reported.
 */
const fs = require('fs');
const path = require('path');
const { PUBLIC, launch, serve, option, wait } = require('./lib');

let sharp = null;
try { sharp = require('sharp'); } catch (e) { /* sizes not checked */ }

const GAMES = path.join(PUBLIC, 'games');
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const out = option('out');
const SIZES = { pc: { width: 1440, height: 900, deviceScaleFactor: 1 }, sp: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const SP_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

(async () => {
  const list = fs.existsSync(GAMES) ? fs.readdirSync(GAMES).filter((d) => fs.existsSync(path.join(GAMES, d, 'index.html')) && (!ids.length || ids.includes(d))) : [];
  const unknown = ids.filter((i) => !list.includes(i));
  if (unknown.length) { console.error('public/games/<id>/index.html がないゲーム:', unknown.join(', ')); process.exit(1); }
  if (out) fs.mkdirSync(out, { recursive: true });
  const local = await serve();
  const browser = await launch(['--lang=ja-JP', '--autoplay-policy=no-user-gesture-required']);
  let bad = 0;
  for (const id of list) {
    const problems = [];
    // images.json: every listed picture exists at its size
    const specFile = path.join(GAMES, id, 'images.json');
    if (fs.existsSync(specFile)) {
      let spec;
      try { spec = JSON.parse(fs.readFileSync(specFile, 'utf8')); } catch (e) { problems.push(`images.json: ${e.message}`); }
      for (const im of (spec && spec.images) || []) {
        const f = path.join(GAMES, id, 'img', `${im.name}.webp`);
        if (!fs.existsSync(f)) { problems.push(`missing image img/${im.name}.webp (run npm run game-images -- ${id})`); continue; }
        if (sharp) { const m = await sharp(f).metadata(); if (m.width !== im.w || m.height !== im.h) problems.push(`img/${im.name}.webp is ${m.width}×${m.height}, images.json says ${im.w}×${im.h}`); }
      }
    } else problems.push('no images.json');
    for (const [dev, vp] of Object.entries(SIZES)) {
      const page = await browser.newPage();
      if (dev === 'sp') await page.setUserAgent(SP_UA);
      await page.setViewport(vp);
      page.on('pageerror', (e) => problems.push(`${dev}: pageerror ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') problems.push(`${dev}: console ${m.text().slice(0, 240)}`); });
      page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(local.origin)) problems.push(`${dev}: ${r.status()} ${r.url().slice(local.origin.length)}`); });
      await page.exposeFunction('__shot', async (name) => { if (out) await page.screenshot({ path: path.join(out, `${id}-${dev}-${String(name).replace(/[^\w-]/g, '_')}.png`) }); });
      try {
        // 'load', not 'networkidle0': a canvas game that redraws every frame keeps headless Chrome too busy to ever look idle
        await page.goto(`${local.origin}/games/${id}/index.html`, { waitUntil: 'load', timeout: 60000 });
      } catch (e) { problems.push(`${dev}: ${e.message}`); await page.close(); continue; }
      await wait(2000);
      const scroll = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight }));
      if (scroll.w > scroll.iw + 1 || scroll.h > scroll.ih + 1) problems.push(`${dev}: the page scrolls (${scroll.w}×${scroll.h} in ${scroll.iw}×${scroll.ih})`);
      if (out) await page.screenshot({ path: path.join(out, `${id}-${dev}.png`) });
      const test = await page.evaluate(async () => {
        if (typeof window.__gameSelfTest !== 'function') return null;
        try { return await window.__gameSelfTest(); } catch (e) { return { ok: false, notes: ['self-test threw: ' + (e && e.stack || e)] }; }
      });
      if (test) {
        if (!test.ok) problems.push(`${dev}: self-test failed — ${(test.notes || []).join(' / ')}`);
        else if (test.notes && test.notes.length) console.log(`  ${id} ${dev}: ${test.notes.join(' / ')}`);
      }
      await page.close();
    }
    if (problems.length) { bad++; console.log(`✗ ${id}`); problems.forEach((p) => console.log('    ' + p)); } else console.log(`✓ ${id}`);
  }
  await browser.close();
  await local.close();
  console.log(`${list.length - bad} / ${list.length} OK${out ? ` — screenshots in ${out}` : ''}`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
