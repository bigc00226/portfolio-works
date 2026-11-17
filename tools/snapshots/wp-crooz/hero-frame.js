/*
 * The live home page's first view is a video (wp-content/themes/crooz/video/movie_202507_pc.mp4 / movie_2026_06_sp.mp4).
 * The site snapshot keeps the <video> elements without their sources, so the video would show a black box: this takes
 * one frame of each (public files of crooz.co.jp, decoded by Chrome) as the poster the video shows
 * (public/videos/wp-crooz/assets/site/hero/{pc,sp}.webp; js/apps.js sets them as the posters).
 *
 *   node tools/snapshots/wp-crooz/hero-frame.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sharp = require(path.join(ROOT, 'node_modules/sharp'));
const OUT = path.join(ROOT, 'public/videos/wp-crooz/assets/site/hero');
const VIDEOS = { pc: 'https://crooz.co.jp/wp-content/themes/crooz/video/movie_202507_pc.mp4', sp: 'https://crooz.co.jp/wp-content/themes/crooz/video/movie_2026_06_sp.mp4' };
const AT = 3;   // seconds into the video (the frame the first view shows a few seconds after the page opens)

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.goto('https://crooz.co.jp/robots.txt');   // same origin as the videos (the canvas stays readable)
  fs.mkdirSync(OUT, { recursive: true });
  for (const [k, url] of Object.entries(VIDEOS)) {
    const data = await page.evaluate(async (url, at) => {
      const v = document.createElement('video');
      v.muted = true; v.preload = 'auto'; v.src = url;
      await new Promise((r, j) => { v.onloadedmetadata = r; v.onerror = () => j(new Error('video error')); });
      v.currentTime = Math.min(at, v.duration - 0.1);
      await new Promise((r) => { v.onseeked = r; });
      const c = document.createElement('canvas');
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      return c.toDataURL('image/png');
    }, url, AT);
    const png = Buffer.from(data.split(',')[1], 'base64');
    const file = path.join(OUT, `${k}.webp`);
    await sharp(png).webp({ quality: 78 }).toFile(file);
    const m = await sharp(file).metadata();
    console.log(k, `${m.width}×${m.height}`, (fs.statSync(file).size / 1024).toFixed(0) + ' KB', path.relative(ROOT, file));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
