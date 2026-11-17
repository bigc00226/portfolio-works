// test harness for the demo page (1920 × 1080, headless Chrome)
//   node run.js end                         turbo run to the end: length, chapter starts, errors, identity check
//   node run.js shots 12,40,95 <outDir>     screenshots at those seconds (each from a fresh page, seeking there)
const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');
const [,, mode = 'end', list = '', outDir = '.'] = process.argv;
const URL0 = pathToFileURL(path.resolve(__dirname, '../../../../public/videos/notahotel/index.html')).href;

async function open(b, q) {
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  const errs = [];
  p.on('console', (m) => { if (['error', 'warning', 'warn'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.goto(URL0 + q);
  await p.waitForFunction('window.__demoReady || window.__demoError', { timeout: 300000 });
  return { p, errs };
}

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 900000,
    args: ['--window-size=1920,1080', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  if (mode === 'end') {
    const t0 = Date.now();
    const { p, errs } = await open(b, '?embed=1');
    console.log('ready in', Date.now() - t0, 'ms', await p.evaluate(() => window.__demoError || ''));
    const t1 = Date.now();
    await p.evaluate(() => window.Stage.seek(1e12, false));
    await p.waitForFunction('(window.__demoDone && !window.Stage.seeking) || window.__demoError', { timeout: 900000, polling: 1000 });
    const r = await p.evaluate(() => ({ err: window.__demoError, t: Math.round(window.Stage.Clock.t), starts: window.Stage.sceneStarts.map(Math.round) }));
    console.log('length', (r.t / 1000).toFixed(1), 's  starts', r.starts.map((s) => (s / 1000).toFixed(1)).join(' '), ' (turbo', ((Date.now() - t1) / 1000).toFixed(0), 's)');
    if (r.err) console.log('ERROR', r.err);
    // identity: the dev site (localhost) and the live site frames vs. a fresh render of the captured page
    const id = await p.evaluate(async () => {
      const norm = (doc) => {
        const c = doc.body.cloneNode(true);
        c.querySelectorAll('script').forEach((s) => s.remove());
        c.querySelectorAll('.demo-hover').forEach((e) => e.classList.remove('demo-hover'));
        c.querySelectorAll('[class=""]').forEach((e) => e.removeAttribute('class'));
        // what the live-mode runtime changes on its own (floating CTA visibility, the --vh / --vw custom properties)
        c.querySelectorAll('[data-cta-footer]').forEach((e) => e.removeAttribute('style'));
        return c.innerHTML;
      };
      const f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;left:-3000px;top:0;width:1440px;height:900px';
      document.body.appendChild(f);
      const ref = await window.SiteFrame.load(f, 'live', { view: 'pc' });
      const want = norm(ref);
      const got = (sel) => { const d = document.querySelector(sel).contentDocument; return d && d.body ? norm(d) : ''; };
      const dev = got('#devFrame'), live = got('#liveFrame');
      const diff = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i >= a.length && a.length === b.length ? '' : `@${i}: ${a.slice(i - 80, i + 120)}  ||  ${b.slice(i - 80, i + 120)}`; };
      return { dev: dev === want, live: live === want, devDiff: diff(dev, want).slice(0, 500), liveDiff: diff(live, want).slice(0, 500),
        code: Object.fromEntries(['inc/post-types.php', 'front-page.php', 'template-parts/house-card.php', 'theme.json'].map((k) => [k, window.Apps.Code.text('wp-content/themes/notahotel/' + k) === window.ThemeFiles.files['wp-content/themes/notahotel/' + k]])) };
    });
    console.log('identity', JSON.stringify(id, null, 1));
    console.log(errs.filter((e) => !/Failed to load resource|missing\//.test(e)).slice(0, 40).join('\n'));
  } else {
    const ts = list.split(',').filter(Boolean).map(Number);
    for (const t of ts) {
      const { p, errs } = await open(b, `?embed=1&t=${t}`);
      await p.waitForFunction('(window.Stage.Clock.started && !window.Stage.seeking) || window.__demoError', { timeout: 600000, polling: 300 });
      await new Promise((r) => setTimeout(r, 900));
      const cap = await p.evaluate(() => (window.__demoError || '') + document.querySelector('#capText').textContent);
      await p.screenshot({ path: path.join(outDir, `t${String(t).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 70 });
      console.log(t, cap.slice(0, 90));
      const e = errs.filter((x) => !/Failed to load resource|missing\//.test(x));
      if (e.length) console.log('  ', e.slice(0, 6).join('\n   '));
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
