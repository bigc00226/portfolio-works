// screenshots of the captured page rendered from local files (live / static, pc / sp)
const puppeteer = require('puppeteer-core');
const path = require('path');
const out = process.argv[2] || '.';
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });
  const url = require('url').pathToFileURL(path.resolve(__dirname, 'render.html')).href;
  for (const [mode, view, w, h, ys] of [['live', 'pc', 1440, 900, [0, 1000, 2400, 3600, 5200, 7000]], ['live', 'sp', 375, 812, [0, 900, 2000]], ['static', 'pc', 1440, 9000, [0]]]) {
    const p = await b.newPage();
    p.on('console', (m) => { if (/error|fail/i.test(m.text())) console.log('console:', m.text().slice(0, 200)); });
    p.on('requestfailed', (r) => console.log('failed:', r.url().slice(0, 140), r.failure() && r.failure().errorText));
    await p.setViewport({ width: w, height: Math.min(h, 2000) });
    await p.goto(`${url}?mode=${mode}&view=${view}&w=${w}&h=${h}`);
    await p.waitForFunction(() => window.__ready, { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    const fonts = await p.evaluate(() => [...window.__doc.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight).join(', '));
    console.log(mode, view, 'fonts:', fonts, 'height', await p.evaluate(() => window.__doc.documentElement.scrollHeight));
    for (const y of ys) {
      await p.evaluate((y) => window.__doc.defaultView.scrollTo(0, y), y);
      await new Promise((r) => setTimeout(r, 700));
      await p.screenshot({ path: path.join(out, `r-${mode}-${view}-${y}.jpg`), type: 'jpeg', quality: 50, clip: { x: 0, y: 0, width: w, height: Math.min(h, 2000) } });
    }
    await p.close();
  }
  await b.close();
})();
