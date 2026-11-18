/*
 * Real EC-CUBE screens for the videos, captured from EC-CUBE itself — EC-CUBE 4.3 or 2 running on this machine
 * (tools/eccube/runtime.js: PHP in WebAssembly, SQLite, a copy of EC-CUBE per video in ../eccube-local/inst/<id>).
 * The counterpart of tools/wp/playground.js; the screens are shown by public/shared/wordpress/wp-frame.js as window.EC.
 *
 * A video's capture script (tools/snapshots/<id>/capture-ec.js) uses it like this:
 *
 *   const ECC = require('../../eccube/capture');
 *   const cap = await ECC.start({ id: 'ec-koyama-kyugu', version: 4, site: 'http://localhost:8080', date: '2026-10-21', time: '10:20' });
 *   await cap.php("$b = $em->getRepository(\Eccube\Entity\BaseInfo::class)->get(); $b->setShopName($data); $em->flush(); return true;", '小山球具');
 *   await cap.files({ 'app/template/default/Product/detail.twig': '…' });       // files in the EC-CUBE folder
 *   await cap.console(['eccube:plugin:install', '--code=Foo']);                   // EC-CUBE 4's bin/console (the server is paused)
 *   await cap.login();                                                            // the real login form (admin / password)
 *   await cap.go('/admin/product', '.c-contentsArea');                            // open a screen, wait for a selector
 *   await cap.capture('products', { inputs: [['#admin_search_product_id', 'q']] });  // → EC_SNAPSHOT.pages.products
 *   await cap.view('snap');                                                       // 'max' 1920 wide | 'snap' 960
 *   await cap.finish();   // downloads the assets, writes public/videos/<id>/js/ec-snapshot.js + assets/ec/, closes Chrome and EC-CUBE
 *   // then: node tools/webp.js <id>
 *
 * Options of start():
 *   id       the video folder (public/videos/<id>) and the EC-CUBE copy (../eccube-local/inst/<id>)
 *   version  4 (EC-CUBE 4.3.1-p1) or 2 (EC-CUBE 2.25 weekly build)
 *   fresh    true: start from a clean copy of the installed EC-CUBE (otherwise the video's copy is kept between runs)
 *   site     the address the screens show instead of http://127.0.0.1:<port> (the dev or production address of the video)
 *   date     'YYYY-MM-DD' the video's date (the capture's date in the screens becomes this); time 'HH:MM' the clock then
 *   admin    the admin path (EC-CUBE 4 default /admin, EC-CUBE 2 /admin/)
 *   shots    folder for a screenshot of every captured screen (to compare with the video)
 *   dir      use this EC-CUBE folder instead of ../eccube-local/inst/<id> (e.g. an EC-CUBE 3 copy you made; version: 3)
 *   assets   folder inside the video for the downloaded files (default assets/ec — give a second session its own, e.g. assets/ec3)
 *   merge    true: add this session's screens to the video's existing js/ec-snapshot.js (two EC-CUBEs in one video,
 *            e.g. the old EC-CUBE 3 and the new EC-CUBE 4 of a data migration) instead of replacing it
 *
 * What is kept and what is changed (the same rules as the WordPress videos — say so in docs/videos/<id>.md):
 *   kept      each screen's HTML after EC-CUBE's own scripts ran, its stylesheets byte-for-byte, the images / fonts / icons
 *             it uses, the real texts (Japanese EC-CUBE)
 *   removed   scripts
 *   changed   the local address → `site`, the capture date → the video's date (the time of day → the video's clock),
 *             text boxes listed in `inputs` → look-alike boxes with the input's own computed style (the video types into them)
 *
 * Known pitfalls (found while making the EC-CUBE videos):
 *   - eccube:plugin:install / enable end by starting cache:clear as a sub-process, which PHP in WebAssembly cannot do: the
 *     command reports a failure although the install / enable itself finished. Check the plugin's state, then run
 *     cap.console(['cache:clear']) on its own.
 *   - After cache:clear the web side can keep its compiled container (a new event subscriber or PurchaseFlow validator is then
 *     silently ignored): delete <instance>/var/cache/prod as well (the next request rebuilds it, ~40 s).
 *   - Installing a plugin whose folder or tables (plg_*, oauth2_*) are left over makes its schema update fail: remove them first.
 *   - The admin / shop session can be lost after enabling a plugin or clearing the cache: log in again when a page shows the login form.
 *   - Twig 3.8 (EC-CUBE 4.3) drops a key of a hash literal whose integer keys are not ascending ({13: …, 7: …}): keep them ascending.
 *   - EC-CUBE's own front CSS uses two-class selectors: a theme's CSS needs the same or higher specificity.
 *   - PHP in WebAssembly keeps Node alive: end a capture script with process.exit(0) after cap.finish().
 *   - EC-CUBE 4.3 registers its bundled plugins in dtb_plugin without installing them: doctrine:schema:update then also emits
 *     their columns. Unregister the ones the video does not use (bundled plugins that were never installed) before a schema update.
 *   - bin/console gets the copy's .env (runtime.js consoleRun), so database commands work through cap.console().
 *   - EC-CUBE's source on GitHub: use refs/tags/<version> (raw.githubusercontent.com/EC-CUBE/ec-cube/4.3.1/ is a branch that
 *     already contains later patches).
 *   - The admin route (ECCUBE_ADMIN_ROUTE) allows only \w characters (no hyphen).
 *   - Canvas content (the 2FA QR code) is not kept by the capture: turn it into an <img> before capturing.
 *   - page.deleteCookie may not remove EC-CUBE's session here: use a fresh browser for screens that need a logged-out state.
 *   - Securitychecker42 makes the site fetch its own URLs: ~250 s under WebAssembly PHP; point its upload at a local stub.
 *   - The admin's plugin actions (有効化 / 無効化 / 独自プラグインのアップロード) leak the proxy generator's "gen ->" lines into
 *     the response and can leave .maintenance in PHP's stat cache: reopen the plugin list and restart the server after them
 *     (tools/snapshots/ec-daikoku-plugin/capture-ec.js does).
 *   - eccube:plugin:enable's dependency check asks the Owners Store through Composer (exec()): run PluginService's postInstall +
 *     enable yourself, then cache:clear (tools/snapshots/ec-tackleberry-api/capture-ec.js does).
 *   - "lockWholeFile: unlock failed" lines are harmless.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const RT = require('./runtime');
const { serializeInPage } = require('../wp/playground');

const ROOT = path.resolve(__dirname, '../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const VIEWS = { max: { width: 1920, height: 947 }, snap: { width: 960, height: 947 } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);

async function start(o) {
  const DIR = path.join(process.env.VIDEO_ROOT ? path.resolve(process.env.VIDEO_ROOT) : path.join(ROOT, 'public/videos'), o.id);
  if (!fs.existsSync(DIR)) throw new Error('no video folder: ' + DIR);
  const version = String(o.version || 4);
  const ASSETS = o.assets || 'assets/ec';
  const LOCAL = String(o.site || 'http://localhost:8080').replace(/\/$/, '');
  const ADMIN = (o.admin || (version === '2' ? '/admin/' : '/admin')).replace(/\/$/, version === '2' ? '/' : '');
  const [Y, M, Dd] = String(o.date).split('-').map(Number);
  const [hh, mm] = String(o.time || '10:00').split(':').map(Number);
  const SNAP = { pages: {}, css: {} };
  const SHEETS = {};
  const ASSET_URLS = new Set();

  const inst = o.dir ? { dir: o.dir, version, port: o.port || RT.portFor(o.id + ':' + o.dir) } : await RT.instance(o.id, { version, fresh: o.fresh, port: o.port });
  let srv = await RT.serve(inst.dir, inst.port);
  log(`EC-CUBE ${version} (${inst.dir}) at ${srv.url}`);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 900000, args: ['--lang=ja-JP', '--hide-scrollbars'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(600000);
  page.setDefaultTimeout(600000);
  await page.setViewport(VIEWS[o.view || 'max'] || o.view);
  page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 160)));
  page.on('dialog', (d) => { log('dialog', d.type(), d.message().slice(0, 80)); d.accept(); });
  const shot = (k) => (o.shots ? path.join(o.shots, `ec-${o.id}-${k}.jpg`) : null);
  const origin = () => srv.url;

  const cap = {
    browser, page, VIEWS, dir: DIR, instance: inst.dir, version, admin: ADMIN, info: {}, data: {},
    get origin() { return origin(); },
    async view(v) { await page.setViewport(VIEWS[v] || v); await wait(400); },
    /** opens a page (path from the shop's root, e.g. '/admin/product' or '/products/detail/1') and waits for `ready` */
    async go(rel, ready = 'body') {
      await page.goto(origin() + rel, { waitUntil: 'load' });
      await page.waitForSelector(ready, { timeout: 600000 });
      await wait(600);
      return page;
    },
    /** waits until the page (after a click that navigates) shows `ready` */
    async settle(ready = 'body', ms = 600000) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        await wait(500);
        try { if (await page.evaluate((sel) => document.readyState === 'complete' && !!document.querySelector(sel), ready)) { await wait(600); return; } } catch (e) { /* navigating */ }
      }
      throw new Error('not ready: ' + ready);
    },
    /** signs in through the real login form (admin / password — the local copy's own account, never a real shop's) */
    async login(user = 'admin', pass = 'password') {   // EC-CUBE 3 has the same form as 4
      if (version === '2') {
        await cap.go(ADMIN, 'input[name=login_id]');
        await cap.type('input[name=login_id]', user);
        await cap.type('input[name=password]', pass);
        await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.keyboard.press('Enter')]);
      } else {
        await cap.go(ADMIN + '/login', '#login_id');
        await cap.type('#login_id', user);
        await cap.type('#password', pass);
        await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('button[type=submit]')]);
      }
      await wait(800);
      log('logged in:', page.url());
    },
    async logout() { await cap.go(version === '2' ? ADMIN + 'logout.php' : ADMIN + '/logout', 'body'); },
    /** the real pointer / keyboard in the real screen (to reach a state before capturing it) */
    async click(sel, opt = {}) {
      const el = await page.$(sel);
      if (!el) throw new Error('no element ' + sel);
      if (opt.navigate) { await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), el.click()]); await wait(600); } else { await el.click(); await wait(400); }
    },
    async type(sel, text, o2 = {}) { const el = await page.$(sel); if (!el) throw new Error('no element ' + sel); if (o2.replace !== false) await el.click({ clickCount: 3 }); await el.type(text, { delay: 4 }); await wait(150); },
    async select(sel, value) { await page.select(sel, value); await wait(200); },
    async eval(fn, ...args) { return page.evaluate(fn, ...args); },
    /** PHP with EC-CUBE booted (4: $kernel $container $em; 2: html/require.php loaded); return value comes back; $data = 2nd arg */
    async php(code, data = null) { return srv.php(code, data); },
    /** writes files into the EC-CUBE copy: { 'app/template/default/index.twig': '…' } (paths from its root) */
    async files(map) {
      for (const [k, v] of Object.entries(map)) { const f = path.join(inst.dir, k); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, v); }
      return Object.keys(map).length;
    },
    read(rel) { return fs.readFileSync(path.join(inst.dir, rel), 'utf8'); },
    /**
     * EC-CUBE 4's bin/console (cache:clear, eccube:plugin:install --code=…, eccube:plugin:enable …). The server is
     * stopped meanwhile (both would write the same cache) and started again on the same port; the browser keeps its session.
     */
    async console(args) {
      if (version === '2') throw new Error('bin/console is EC-CUBE 4 only');
      await srv.close();
      const r = await RT.consoleRun(inst.dir, args);
      log(`console ${args.join(' ')} → ${r.code}`);
      srv = await RT.serve(inst.dir, inst.port);
      if (r.code !== 0) throw new Error(`console ${args.join(' ')} failed:\n${(r.out + r.err).slice(-2500)}`);
      return r.out;
    },
    /** captures the screen on show as `key` (co.inputs: [[selector, key], …] text boxes the video types into) */
    async capture(key, co = {}) {
      await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); }).catch(() => null);
      await wait(co.settle || 700);
      const r = await page.evaluate(serializeInPage, { inputs: co.inputs || [] });
      const vp = page.viewport();
      SNAP.pages[key] = { title: r.title, url: r.url, w: vp.width, h: vp.height, scroll: r.scroll, html: r.html, frames: r.frames };
      for (const [k, s] of Object.entries(r.sheets)) SHEETS[k] = s;
      r.assets.forEach((a) => ASSET_URLS.add(a));
      log(`captured ${key} (${vp.width}×${vp.height}) "${r.title}" — ${(r.html.length / 1024).toFixed(0)} KB`);
      if (shot(key)) await page.screenshot({ path: shot(key), type: 'jpeg', quality: 72 });
      return SNAP.pages[key];
    },

    /** downloads the assets, rewrites addresses / dates, writes js/ec-snapshot.js, closes Chrome and EC-CUBE */
    async finish() {
      const ORIGIN = origin();
      cap.info = await srv.php(version === '2'
        ? "return ['eccube' => ECCUBE_VERSION, 'php' => PHP_VERSION, 'db' => 'SQLite ' . SQLite3::version()['versionString']];"
        : "return ['eccube' => \\Eccube\\Common\\Constant::VERSION, 'php' => PHP_VERSION, 'db' => 'SQLite ' . SQLite3::version()['versionString']];").catch((e) => ({ error: e.message }));
      const localOf = new Map();
      const now = new Date();
      const y = now.getFullYear(), mo = now.getMonth() + 1, da = now.getDate();
      const pad = (n) => String(n).padStart(2, '0');
      const localPath = (u) => {
        if (localOf.has(u)) return localOf.get(u);
        const url = new URL(u);
        let p = u.startsWith(ORIGIN) ? url.pathname : `/remote/${url.host}${url.pathname}`;
        p = p.replace(/\/+$/, '/index').replace(/[^\w./@-]/g, '_');
        if (!/\.[a-z0-9]{2,5}$/i.test(p)) p += '.bin';
        if (url.search && [...localOf.values()].includes(`${ASSETS}${p}`)) p = p.replace(/(\.[a-z0-9]+)$/i, `_${crypto.createHash('sha1').update(url.search).digest('hex').slice(0, 6)}$1`);
        const lp = `${ASSETS}${p}`;
        localOf.set(u, lp);
        return lp;
      };
      const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
      for (const s of Object.values(SHEETS)) {
        for (const m of s.text.matchAll(CSS_URL)) if (!/^(data:|#|about:)/.test(m[2])) { try { const a = new URL(m[2], s.base).href; ASSET_URLS.add(a); localPath(a); } catch (e) { /* not a URL */ } }
      }
      fs.rmSync(path.join(DIR, ASSETS), { recursive: true, force: true });
      let ok = 0;
      const bad = [];
      for (const u of ASSET_URLS) {
        if (!/^https?:/.test(u)) continue;
        try {
          const r = await fetch(u);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const buf = Buffer.from(await r.arrayBuffer());
          if (/^\s*<(!doctype html|html)/i.test(buf.subarray(0, 40).toString('latin1'))) throw new Error('HTML instead of a file');
          let lp = localPath(u);
          if (lp.endsWith('.bin')) {
            const h = buf.subarray(0, 12);
            const ext = h[0] === 0xff && h[1] === 0xd8 ? 'jpg' : h.toString('hex', 0, 4) === '89504e47' ? 'png' : h.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : h.toString('ascii', 0, 3) === 'GIF' ? 'gif' : /^\s*<svg|<\?xml/.test(buf.subarray(0, 100).toString()) ? 'svg' : 'bin';
            lp = lp.replace(/\.bin$/, '.' + ext);
            localOf.set(u, lp);
          }
          const f = path.join(DIR, lp);
          fs.mkdirSync(path.dirname(f), { recursive: true });
          fs.writeFileSync(f, buf);
          ok++;
        } catch (e) { bad.push(`${e.message} ${u}`); localOf.delete(u); }
      }
      const svgData = (lp) => { const f = path.join(DIR, lp); return /\.svg$/i.test(lp) && fs.existsSync(f) ? `data:image/svg+xml;base64,${fs.readFileSync(f).toString('base64')}` : null; };
      for (const [k, s] of Object.entries(SHEETS)) {
        SNAP.css[k] = s.text.replace(CSS_URL, (m, q, u) => {
          if (/^(data:|#|about:)/.test(u)) return m;
          let a;
          try { a = new URL(u, s.base).href; } catch (e) { return m; }
          if (!localOf.has(a)) return m;
          const lp = localOf.get(a);
          return `url("${svgData(lp) || lp}")`;
        });
      }
      log(`assets: ${ok} saved${bad.length ? `, ${bad.length} failed:\n  ` + bad.slice(0, 30).join('\n  ') : ''}`);
      await browser.close();
      await srv.close();

      // html: asset URLs → local; the local address → the video's; the capture date → the video's
      const hhmm = `${pad(hh)}:${pad(mm)}`;
      const host = new URL(ORIGIN).host;
      const fix = (html) => {
        let h = html;
        for (const [u, lp] of [...localOf].sort((a, b) => b[0].length - a[0].length)) h = h.split(u).join(lp).split(u.replace(/&/g, '&amp;')).join(lp);
        h = h.split(ORIGIN).join(LOCAL).split(encodeURIComponent(ORIGIN)).join(encodeURIComponent(LOCAL)).split(host).join(new URL(LOCAL).host);
        h = h.split('/srv/eccube/').join(o.serverPath || '/var/www/html/');
        // the capture's date (and the time of day next to it) → the video's
        h = h.replace(new RegExp(`${y}/${pad(mo)}/${pad(da)}( \\d{2}:\\d{2})?`, 'g'), (m0, t) => `${Y}/${pad(M)}/${pad(Dd)}${t ? ' ' + hhmm : ''}`)
          .replace(new RegExp(`${y}/${mo}/${da}( \\d{1,2}:\\d{2})?`, 'g'), (m0, t) => `${Y}/${M}/${Dd}${t ? ' ' + hhmm : ''}`)
          .replace(new RegExp(`${y}年${mo}月${da}日`, 'g'), `${Y}年${M}月${Dd}日`)
          .replace(new RegExp(`${y}年${pad(mo)}月${pad(da)}日`, 'g'), `${Y}年${pad(M)}月${pad(Dd)}日`)
          .replace(new RegExp(`${y}-${pad(mo)}-${pad(da)}`, 'g'), `${Y}-${pad(M)}-${pad(Dd)}`);
        return h;
      };
      const fixPage = (p) => ({ ...p, html: fix(p.html), url: fix(p.url), title: fix(p.title), frames: Object.fromEntries(Object.entries(p.frames || {}).map(([k, f]) => [k, fixPage(f)])) });
      for (const k of Object.keys(SNAP.pages)) SNAP.pages[k] = fixPage(SNAP.pages[k]);
      const data = cap.data && JSON.parse(fix(JSON.stringify(cap.data)));
      const file = path.join(DIR, 'js', 'ec-snapshot.js');
      let out = { capturedAt: now.toISOString().slice(0, 10), source: `EC-CUBE ${cap.info.eccube || version} (local copy, tools/eccube/runtime.js)`, site: LOCAL, info: cap.info, data, css: SNAP.css, pages: SNAP.pages };
      if (o.merge && fs.existsSync(file)) {
        const prev = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^[\s\S]*?window\.EC_SNAPSHOT = /, '').replace(/;\s*$/, ''));
        out = { ...prev, capturedAt: out.capturedAt, source: [prev.source, out.source].filter((x, i, a) => a.indexOf(x) === i).join(' + '),
          sites: { ...(prev.sites || { [prev.site]: prev.info }), [LOCAL]: cap.info }, data: { ...(prev.data || {}), ...(data || {}) },
          css: { ...prev.css, ...SNAP.css }, pages: { ...prev.pages, ...SNAP.pages } };
      }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `/* real EC-CUBE screens (tools/eccube/capture.js, captured ${out.capturedAt}) — generated, do not edit */\nwindow.EC_SNAPSHOT = ` + JSON.stringify(out) + ';\n');
      log('wrote', path.relative(ROOT, file), (fs.statSync(file).size / 1048576).toFixed(2) + ' MB', `— now: node tools/webp.js ${o.id}`);
      return out;
    },
    /** closes without writing (after an error) */
    async abort() { await browser.close().catch(() => {}); await srv.close().catch(() => {}); },
  };
  return cap;
}

module.exports = { start, VIEWS, log, wait };
