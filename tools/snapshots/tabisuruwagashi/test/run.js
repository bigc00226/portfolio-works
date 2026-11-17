// test harness: node run.js "<query>" <outPrefix> <shotEveryMs> <maxMs>
const puppeteer = require('puppeteer-core');
const path = require('path');
const [,, query = '', out = 'shot', every = '4000', max = '60000'] = process.argv;
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
    args: ['--window-size=1920,1080', '--hide-scrollbars'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  const errs = [];
  p.on('console', (m) => { if (['error', 'warning', 'warn'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  const file = path.resolve(__dirname, '../../../../public/videos/tabisuruwagashi/index.html').split(path.sep).join('/');
  const t0 = Date.now();
  await p.goto('file:///' + file + query);
  await p.waitForFunction('window.__demoReady || window.__demoError', { timeout: 240000 });
  const err = await p.evaluate(() => window.__demoError);
  console.log('ready in', Date.now() - t0, 'ms', err || '');
  await p.screenshot({ path: `${out}-ready.png` });
  await p.evaluate(() => { window.__demoStartScenario(); });
  const t1 = Date.now();
  let n = 0;
  while (Date.now() - t1 < +max) {
    await new Promise((r) => setTimeout(r, +every));
    n++;
    await p.screenshot({ path: `${out}-${String(n).padStart(3, '0')}.png` });
    const st = await p.evaluate(() => ({ done: window.__demoDone, cap: document.querySelector('#capText').textContent }));
    console.log(n, ((Date.now() - t1) / 1000).toFixed(0) + 's', st.cap.slice(0, 70));
    if (st.done) {
      console.log('done after', Date.now() - t1, 'ms');
      const chk = await p.evaluate(() => {
        const F = window.Tpl.FINAL, out = window.__demoFinal();
        const mods = Object.fromEntries(out.modules.map((m) => [m.id, m.html]));
        return {
          demoMinutesAt1x: (window.Demo.Clock.t / 60000).toFixed(2),
          topHtml: out.top.html === F.top, topJs: out.top.js === F.topJs, topCss: out.top.css === F.topCss,
          commonCss: out.common.css === F.commonCss, commonJs: out.common.js === F.commonJs,
          header: mods.header === F.header, footer: mods.footer === F.footer,
        };
      });
      console.log('identity', JSON.stringify(chk));
      break;
    }
  }
  console.log(errs.filter((e) => !/ERR_FILE_NOT_FOUND|slide1\.jpg|Failed to load resource/.test(e)).slice(0, 30).join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
