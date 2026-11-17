/*
 * Captures the real Sveltia CMS (https://github.com/sveltia/sveltia-cms, MIT licence) with the Né site's own
 * /admin/ page and /admin/config.yml, in every state the ne-auberge video shows, and writes
 * public/videos/ne-auberge/js/cms-snapshot.js (+ the CMS's font files in assets/sveltia/).
 *   node tools/snapshots/ne-auberge/capture-cms.js        (Node 22.18+, Google Chrome, internet)
 *
 * No login: the CMS runs on a local server at http://localhost:4321/admin/ (the address the video shows) with
 * Sveltia's in-browser test repository (backend `test-repo` — the only change to the site's config.yml), seeded through
 * Sveltia's own seed manifest (<link rel="cms-seed-url">) with the site's content files as they are before the video
 * edits them: src/content/settings/site.json and src/content/pages/{ja,en}/*.md (titles / descriptions of the live site).
 * Each field is typed for real into the CMS; each state is the <body> as Sveltia rendered it (+ input values and scroll
 * positions, which are not in the markup):
 *   settingsList  #/collections/settings
 *   siteEdit      #/collections/settings/entries/site — the editor and its preview
 *   siteUrl       宿泊 (Chillnn) › URL typed (保存 enabled)
 *   siteCta       Global CTA typed (the editor scrolled to the CTA fields)
 *   siteSaved     after 保存
 *   pagesList     #/collections/pages
 *   homeEdit      #/collections/pages/entries/home
 *   homeTitle     Title (SEO) typed
 *   homeSaved     after 保存
 * The CMS's version is pinned (SVELTIA_VERSION) so a re-capture shows the same UI.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { launch, videoDir, wait } = require('../../lib');

const SVELTIA_VERSION = '0.268.0';
const DIR = videoDir('ne-auberge');
const ASSETS = path.join(DIR, 'assets', 'sveltia');
const OUT = path.join(DIR, 'js', 'cms-snapshot.js');
const VIEW = { width: 1920, height: 948 };
const PORT = 4321;
const TYPED = { stayUrl: 'https://ne.booking.chillnn.com/ja/', cta: 'ご予約', title: 'Né（ネ）｜新潟・新発田、一日一組のオーベルジュ' };

const w = {};
new Function('window', fs.readFileSync(path.join(DIR, 'js', 'site-snapshot.js'), 'utf8'))(w);
const S = w.SITE_SNAPSHOT;

(async () => {
  // ---- the local site: /admin/ (the site's own page), config, the CMS bundle, the seed
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sveltia-'));
  const put = (p, data) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), data); };
  const bundle = Buffer.from(await (await fetch(`https://unpkg.com/@sveltia/cms@${SVELTIA_VERSION}/dist/sveltia-cms.js`)).arrayBuffer());
  put('admin/sveltia-cms.js', bundle);
  put('admin/index.html', S.cmsIndex.replace('https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js', '/admin/sveltia-cms.js')
    .replace('</title>', '</title>\n    <link rel="cms-seed-url" href="/seed/manifest.json" />'));
  const config = S.cmsConfig.replace(/backend:\n  name: github\n[^\n]*\n  branch: main/, 'backend:\n  name: test-repo');
  if (config === S.cmsConfig) throw new Error('backend block not found in config.yml');
  put('admin/config.yml', config);
  const files = {
    'src/content/settings/site.json': JSON.stringify({
      brand: 'Né',
      reservation: { stay: { provider: 'CHILLNN', url: '' }, dining: { provider: 'TableCheck', url: 'https://www.tablecheck.com/ja/ne-auberge/reserve/message' } },
      cta: { global: '', local: { stay: '宿泊を予約する', cuisine: 'レストランを予約する' } },
      concierge: 'concierge@ne-auberge.jp', trust: { fvWhisper: '' },
    }, null, 2) + '\n',
  };
  for (const pg of S.pages) for (const loc of ['ja', 'en']) {
    const title = pg.slug === 'home' && loc === 'ja' ? '""' : pg[loc].title;
    files[`src/content/pages/${loc}/${pg.slug}.md`] = `---\ntitle: ${title}\ndescription: ${pg[loc].description}\n${pg.slug === 'home' ? 'heroImage: /photos/Ne_226_PR.jpg\n' : ''}---\n`;
  }
  for (const [p, t] of Object.entries(files)) put('seed/' + p, t);
  put('seed/manifest.json', JSON.stringify({ files: Object.keys(files) }));
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.yml': 'text/yaml; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
  const server = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  }).listen(PORT);

  const browser = await launch(['--lang=ja-JP']);
  const p = await browser.newPage();
  await p.setViewport(VIEW);
  await p.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' });
  const clickText = async (sel, re) => {
    const h = await p.evaluateHandle((s, src) => [...document.querySelectorAll(s)].find((e) => e.offsetParent && new RegExp(src).test(e.textContent)), sel, re.source);
    if (!h.asElement()) throw new Error(`not found: ${sel} ${re}`);
    await h.asElement().click();
  };
  const states = {};
  const snap = async (name) => {
    await wait(700);
    // Sveltia renders the parts of the editor / preview as they scroll into view: scroll every pane through once
    // (and back), so the snapshot has all of it — the video scrolls these panes itself
    await p.evaluate(async () => {
      for (const e of document.querySelectorAll('*')) {
        if (e.scrollHeight <= e.clientHeight + 40 || !/auto|scroll/.test(getComputedStyle(e).overflowY)) continue;
        const top = e.scrollTop;
        for (let y = 0; y <= e.scrollHeight; y += e.clientHeight / 2) { e.scrollTop = y; await new Promise((r) => setTimeout(r, 120)); }
        e.scrollTop = top;
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await wait(400);
    states[name] = await p.evaluate(() => {
      const all = [...document.body.querySelectorAll('*')];
      const doc = document.body.cloneNode(true);
      const call = [...doc.querySelectorAll('*')];
      // what the markup does not say, written onto the copy: open popovers / modals, input values, scroll positions
      all.forEach((e, i) => {
        if (e.matches(':popover-open')) call[i].setAttribute('data-demo-popover', '');
        if (e.tagName === 'DIALOG' && e.open && e.matches(':modal')) call[i].setAttribute('data-demo-modal', '');
        if (/^(INPUT|TEXTAREA)$/.test(e.tagName) && e.value) call[i].setAttribute('data-demo-value', e.value);
        if (e.scrollTop || e.scrollLeft) call[i].setAttribute('data-demo-scroll', `${e.scrollTop},${e.scrollLeft}`);
      });
      doc.querySelectorAll('script, noscript, iframe').forEach((e) => e.remove());
      return {
        url: location.href,
        title: document.title,
        bodyAttrs: [...document.body.attributes].map((a) => [a.name, a.value]),
        body: doc.innerHTML,
      };
    });
    await p.screenshot({ path: path.join(process.env.SHOTS || os.tmpdir(), `cms-state-${name}.jpg`), type: 'jpeg', quality: 70 });
    console.log('state', name, states[name].url.replace(/^.*\/admin\//, '/admin/'), Math.round(states[name].body.length / 1024) + ' KB');
  };
  const field = (key) => `section[data-key-path="${key}"] input`;
  const typeInto = async (sel, text) => {
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
    await wait(300);
    await p.click(sel);
    await p.keyboard.type(text, { delay: 15 });
    await wait(300);
  };

  await p.goto(`http://localhost:${PORT}/admin/`, { waitUntil: 'networkidle0' });
  await clickText('button', /デモを開始/);
  await wait(2500);
  await clickText('button', /はじめる/).catch(() => {}); // the demo welcome dialog
  await wait(600);
  await p.goto(`http://localhost:${PORT}/admin/#/collections/settings`);
  await snap('settingsList');
  await clickText('[role="row"], [role="gridcell"], a, button, [role="link"]', /Site Settings/);
  await p.waitForSelector(field('reservation.stay.url'));
  await snap('siteEdit');
  await typeInto(field('reservation.stay.url'), TYPED.stayUrl);
  await p.evaluate(() => document.activeElement.blur());
  await snap('siteUrl');
  await typeInto(field('cta.global'), TYPED.cta);
  await p.evaluate(() => document.activeElement.blur());
  await snap('siteCta');
  await clickText('button', /^[\s]*保存[\s]*$/);
  await wait(1200);
  await snap('siteSaved');
  await wait(4000);
  await clickText('a, button, [role="link"], [role="option"], [role="treeitem"]', /ページ \/ Pages/);
  await wait(800);
  await snap('pagesList');
  await clickText('[role="row"], [role="gridcell"], a, button, [role="link"]', /^\s*home\s*$|Né（ネ）/).catch(async () => { await p.goto(`http://localhost:${PORT}/admin/#/collections/pages/entries/home`); });
  await p.waitForSelector(field('title'));
  await snap('homeEdit');
  await typeInto(field('title'), TYPED.title);
  await p.evaluate(() => document.activeElement.blur());
  await snap('homeTitle');
  await clickText('button', /^[\s]*保存[\s]*$/);
  await wait(1200);
  await snap('homeSaved');

  // the CMS's styles (Svelte components add theirs to <head> as they first appear: by now all of them are there)
  const head = await p.evaluate(() => ({
    title: document.title,
    htmlAttrs: [...document.documentElement.attributes].map((a) => [a.name, a.value]),
    styles: [...document.querySelectorAll('head style')].map((s) => s.textContent),
  }));
  await browser.close();
  server.close();
  fs.rmSync(root, { recursive: true, force: true });

  // fonts (fontsource on jsDelivr) → local copies
  fs.mkdirSync(path.join(ASSETS, 'fonts'), { recursive: true });
  const fonts = new Map();
  for (const css of head.styles) for (const m of css.matchAll(/url\((https:\/\/cdn\.jsdelivr\.net\/fontsource\/[^)]+)\)/g)) fonts.set(m[1], null);
  for (const url of fonts.keys()) {
    const name = url.replace(/^.*\/fonts\//, '').replace(/[^a-z0-9.@-]+/gi, '_');
    fs.writeFileSync(path.join(ASSETS, 'fonts', name), Buffer.from(await (await fetch(url)).arrayBuffer()));
    fonts.set(url, `assets/sveltia/fonts/${name}`);
  }
  head.styles = head.styles.map((css) => css.replace(/https:\/\/cdn\.jsdelivr\.net\/fontsource\/[^)]+/g, (u) => fonts.get(u) || u));

  fs.writeFileSync(OUT, '/* The real Sveltia CMS ' + SVELTIA_VERSION + ' (MIT) with the Né site\'s /admin/config.yml, captured by tools/snapshots/ne-auberge/capture-cms.js — generated, do not edit */\n'
    + 'window.CMS_SNAPSHOT = ' + JSON.stringify({ version: SVELTIA_VERSION, capturedAt: new Date().toISOString().slice(0, 10), view: VIEW, typed: TYPED, ...head, states }) + ';\n');
  console.log('fonts', fonts.size, '· wrote', path.relative(process.cwd(), OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
