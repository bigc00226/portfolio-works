// Re-captures https://notahotel.com/ and regenerates public/videos/notahotel/js/site-snapshot.js + assets/site/.
// Run it after the live site changes, so the demo keeps matching it.
//
//   npm run snapshot -- notahotel   (in the project folder; images are converted to WebP afterwards)
//
// Needs Node.js 18+ and Google Chrome (or Edge) installed.
//
// What is captured:
//   - the top page as the browser shows it after the site's own scripts ran (Next.js output: markup, CSS-module
//     class names, inline styles), at PC width (1440px) and smartphone width (375px), Japanese
//   - every stylesheet the page loads (the Next.js CSS chunks and YakuHanJP), byte-for-byte, with only url(...)
//     pointing at the local copies. The Adobe Fonts kit (neue-haas-grotesk-text) stays a link to use.typekit.net —
//     its font files are licensed per domain and are not copied
//   - every image, self-hosted font and hero / section video the page uses -> assets/site/<host>/<path> (long paths shortened: shortAssetPath in tools/lib.js)
// What is changed in the captured page:
//   - all <script>s, <noscript>s and <iframe>s are removed (Google Tag Manager, analytics and ad tags never run
//     during the demo), preload / prefetch hints are dropped
//   - scroll-in effects are captured in their finished state (the page is scrolled through once before capture)
//   - the hero slideshow is put back on its first slide (it advances on a timer while the page is scrolled)
// Nothing else is changed.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');
const { shortAssetPath } = require('../../lib');

const ORIGIN = 'https://notahotel.com';
const ROOT = path.resolve(__dirname, '../../../public/videos/notahotel'); // the video's folder
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const UA_SP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
// the site answers in English unless the browser asks for Japanese
const LANG = { 'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.6' };
const VIEWS = {
  pc: { width: 1440, height: 900, ua: UA_PC, mobile: false, dpr: 1 },
  sp: { width: 375, height: 812, ua: UA_SP, mobile: true, dpr: 2 },
};

function chromePath() {
  const c = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) throw new Error('Chrome not found. Set CHROME_PATH.');
  return hit;
}

async function get(url, binary) {
  const res = await fetch(url, { headers: { 'user-agent': UA_PC, referer: ORIGIN + '/', ...LANG } });
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  if (!binary) return res.text();
  const buf = Buffer.from(await res.arrayBuffer());
  buf.type = res.headers.get('content-type') || '';
  return buf;
}
const EXT_OF = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/avif': '.avif', 'video/mp4': '.mp4', 'font/woff2': '.woff2', 'font/woff': '.woff' };

/** absolute URL -> local path (relative to the demo root) */
function localPath(abs, type) {
  const u = new URL(abs);
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index';
  let ext = path.extname(p);
  let base = p.slice(0, p.length - ext.length);
  if (u.search) base += '__' + crypto.createHash('md5').update(u.search).digest('hex').slice(0, 8);
  if (!ext || ext.length > 6 || /[@/]/.test(ext)) { base += ext; ext = EXT_OF[(type || '').split(';')[0].trim()] || '.bin'; }
  const safe = (base + ext).replace(/[^A-Za-z0-9._\/\-]/g, '_');
  return shortAssetPath('assets/site/' + u.host + safe);
}

const isAsset = (u) => /^https?:/.test(u) && !/use\.typekit\.net|p\.typekit\.net/.test(u);
const isVideo = (u) => /\.(mp4|mov|webm)$/i.test(new URL(u).pathname);

async function openPage(browser, v) {
  const page = await browser.newPage();
  await page.setUserAgent(v.ua);
  await page.setExtraHTTPHeaders(LANG);
  await page.setViewport({ width: v.width, height: v.height, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: v.dpr });
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle2', timeout: 120000 });
  // scroll through once (lazy images, scroll-in effects), then back to the top
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + v.height; y += Math.round(v.height * 0.55)) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await new Promise((r) => setTimeout(r, 220));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 2500));
  return page;
}

/** runs in the page: every URL it uses */
function collectUrls() {
  const out = new Set();
  const add = (v) => { if (!v) return; try { out.add(new URL(v.trim(), location.href).href); } catch (e) {} };
  const srcset = (v) => (v || '').split(',').map((s) => s.trim().split(/\s+/)[0]).forEach(add);
  document.querySelectorAll('img').forEach((i) => { add(i.getAttribute('src')); srcset(i.getAttribute('srcset')); });
  document.querySelectorAll('source').forEach((s) => { srcset(s.getAttribute('srcset')); add(s.getAttribute('src')); });
  document.querySelectorAll('video').forEach((s) => { add(s.getAttribute('poster')); add(s.getAttribute('src')); });
  document.querySelectorAll('image').forEach((s) => add(s.getAttribute('href') || s.getAttribute('xlink:href')));
  document.querySelectorAll('[style*="url("]').forEach((e) => { for (const m of e.getAttribute('style').matchAll(/url\((['"]?)(.*?)\1\)/g)) add(m[2]); });
  document.querySelectorAll('style').forEach((s) => { for (const m of s.textContent.matchAll(/url\((['"]?)(.*?)\1\)/g)) if (!m[2].startsWith('data:')) add(m[2]); });
  const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
  return { assets: [...out], sheets };
}

/** runs in the page: the rendered DOM with local asset paths, scripts removed, hero on slide 1 */
function serialize(map) {
  const loc = (v) => { try { const a = new URL(v.trim(), location.href).href; return map[a] || null; } catch (e) { return null; } };
  const fixSrcset = (v) => v.split(',').map((part) => { const p = part.trim().split(/\s+/); const l = loc(p[0]); if (l) p[0] = l; return p.join(' '); }).join(', ');
  const fixCss = (t) => t.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => { if (u.startsWith('data:') || u.startsWith('#')) return all; const l = loc(u); return l ? `url(${q}${l}${q})` : all; });
  const root = document.documentElement.cloneNode(true);
  root.querySelectorAll('script, noscript, iframe, next-route-announcer').forEach((e) => e.remove());
  root.querySelectorAll('link[rel="preload"], link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="modulepreload"], link[rel="prefetch"], link[rel="manifest"]').forEach((e) => e.remove());
  // tracking pixels left in <body> by the tag scripts
  root.querySelectorAll('body > img').forEach((e) => e.remove());
  root.querySelectorAll('img').forEach((i) => { const s = i.getAttribute('src'); if (s && loc(s)) i.setAttribute('src', loc(s)); const ss = i.getAttribute('srcset'); if (ss) i.setAttribute('srcset', fixSrcset(ss)); });
  root.querySelectorAll('source').forEach((s) => { const ss = s.getAttribute('srcset'); if (ss) s.setAttribute('srcset', fixSrcset(ss)); const sr = s.getAttribute('src'); if (sr && loc(sr)) s.setAttribute('src', loc(sr)); });
  root.querySelectorAll('video').forEach((s) => { const l = loc(s.getAttribute('poster') || ''); if (l) s.setAttribute('poster', l); const sr = s.getAttribute('src'); if (sr && loc(sr)) s.setAttribute('src', loc(sr)); });
  root.querySelectorAll('[style*="url("]').forEach((e) => e.setAttribute('style', fixCss(e.getAttribute('style'))));
  root.querySelectorAll('style').forEach((s) => { s.textContent = fixCss(s.textContent); });
  root.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.setAttribute('href', l.href));
  root.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((l) => { const x = loc(l.getAttribute('href')); if (x) l.setAttribute('href', x); });
  // hero slideshow back on its first slide (it is timer-driven and moved on while the page was scrolled)
  const items = [...root.querySelectorAll('#hero-content > [class*="slideItem"]')];
  const cls = (el, frag) => [...el.classList].find((c) => c.endsWith(frag));
  if (items.length) {
    const act = items.map((i) => cls(i, '_active')).find(Boolean), prev = items.map((i) => cls(i, '_prev')).find(Boolean);
    const head = items.find((i) => act && i.classList.contains(act));
    items.forEach((it, k) => { if (act) it.classList.toggle(act, k === 0); if (prev) it.classList.remove(prev); });
    // the title of the slide that was showing is faded in; copy that finished state onto slide 1
    if (head) {
      const shown = head.querySelector('[data-fadein]');
      const st = shown ? shown.getAttribute('style') : '';
      items.forEach((it, k) => it.querySelectorAll('[data-fadein]').forEach((f) => { if (k === 0 && st) f.setAttribute('style', st); }));
    }
    const bullets = [...root.querySelectorAll('#hero-pagination > button')];
    const ba = bullets.map((b) => cls(b, '_active')).find(Boolean);
    if (ba) bullets.forEach((b, k) => b.classList.toggle(ba, k === 0));
    // the 詳細を見る button links to the slide that is showing
    const first = items[0].querySelector('a[class*="heroHead"]');
    const more = root.querySelector('[class*="heroButtonBar"] > a');
    if (first && more) more.setAttribute('href', first.getAttribute('href'));
  }
  return '<!DOCTYPE html>\n' + root.outerHTML;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: 'new', args: ['--hide-scrollbars', '--lang=ja-JP', '--autoplay-policy=no-user-gesture-required'] });
  const allAssets = new Set();
  const allSheets = new Set();
  const info = {};
  // pass 1: discover
  for (const [name, v] of Object.entries(VIEWS)) {
    console.log(`[${name}] loading…`);
    const page = await openPage(browser, v);
    const urls = await page.evaluate(collectUrls);
    urls.assets.forEach((u) => isAsset(u) && allAssets.add(u));
    urls.sheets.forEach((u) => allSheets.add(u));
    if (name === 'pc') {
      Object.assign(info, await page.evaluate(() => {
        const meta = (s) => { const m = document.querySelector(s); return m ? m.getAttribute('content') : ''; };
        const root = getComputedStyle(document.documentElement);
        const vars = {};
        for (let i = 0; i < root.length; i++) if (root[i].startsWith('--')) vars[root[i]] = root.getPropertyValue(root[i]).trim();
        const t = (el) => (el ? el.textContent.trim() : '');
        const houses = [...document.querySelectorAll('[class*="propertyList"] > a')].map((a) => ({
          href: a.getAttribute('href'),
          name: t(a.querySelector('[class*="propertyName"]')),
          status: t(a.querySelector('[class*="statusLabel"]')),
          place: t(a.querySelector('[class*="placeName"]')),
          concept: t(a.querySelector('[class*="shortConcept"]')),
          price: t(a.querySelector('[class*="price"]')),
          img: (a.querySelector('img') || {}).src || '',
        }));
        return {
          title: document.title, description: meta('meta[name="description"]'),
          og: { title: meta('meta[property="og:title"]'), image: meta('meta[property="og:image"]'), siteName: meta('meta[property="og:site_name"]') },
          canonical: (document.querySelector('link[rel="canonical"]') || {}).href || '',
          vars, houses,
          logoSvg: (document.querySelector('header h1 svg') || {}).outerHTML || '',
        };
      }));
    }
    await page.close().catch(() => {});
  }

  // stylesheets (text) + the assets they reference; url(...) made absolute, @import'ed sheets inlined in place
  const absolutize = (text, href) => text.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => {
    if (u.startsWith('data:') || u.startsWith('#')) return all;
    try { return `url(${q}${new URL(u, href).href}${q})`; } catch (e) { return all; }
  });
  async function fetchCss(href, depth = 0) {
    let text = await get(href);
    const imports = [...text.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1\s*\)?\s*([^;]*);/g)];
    for (const m of imports) {
      const abs = new URL(m[2], href).href;
      if (!isAsset(abs) || depth > 3) continue;
      try {
        const inner = await fetchCss(abs, depth + 1);
        text = text.replace(m[0], m[3].trim() ? `@media ${m[3].trim()}{${inner}}` : inner);
      } catch (e) { console.warn('@import failed', abs, e.message); }
    }
    return absolutize(text, href);
  }
  const css = {};
  for (const href of allSheets) {
    if (!isAsset(href)) continue;
    try {
      const text = await fetchCss(href);
      for (const m of text.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
        if (m[2].startsWith('data:') || m[2].startsWith('#')) continue;
        allAssets.add(new URL(m[2], href).href);
      }
      css[href] = text;
      console.log('css', href, text.length);
    } catch (e) { console.warn('css failed', href, e.message); }
  }

  // download every asset once (videos too: the hero and section videos are a few MB each)
  const map = {};
  let n = 0, bytes = 0;
  for (const u of allAssets) {
    if (/\.(css|js)(\?|$)/.test(new URL(u).pathname)) continue;
    // CSS can reference fonts in formats nobody loads; keep woff2 only
    if (/\.(eot|ttf|otf|woff)(\?|#|$)/i.test(u) && !/\.woff2/i.test(u)) continue;
    try {
      let lp = [...Object.keys(EXT_OF).map((t) => localPath(u, t)), localPath(u)].find((p) => fs.existsSync(path.join(ROOT, p)));
      if (!lp) {
        const buf = await get(u, true);
        lp = localPath(u, buf.type);
        const dest = path.join(ROOT, lp);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        bytes += buf.length;
        if (isVideo(u)) console.log('video', u, (buf.length / 1048576).toFixed(1) + ' MB');
      }
      map[u] = lp;
      n++;
    } catch (e) { console.warn('asset failed', u, e.message); }
  }
  console.log('assets', n, (bytes / 1048576).toFixed(1) + ' MB new');

  const rewriteCss = (text, base) => text.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => {
    if (u.startsWith('data:') || u.startsWith('#')) return all;
    let abs; try { abs = new URL(u, base).href; } catch (e) { return all; }
    return map[abs] ? `url(${q}${map[abs]}${q})` : all;
  });
  const cssLocal = {};
  for (const [href, text] of Object.entries(css)) cssLocal[href] = rewriteCss(text, href);

  // pass 2: the rendered DOM, with local asset paths
  const html = {};
  for (const [name, v] of Object.entries(VIEWS)) {
    console.log(`[${name}] capturing…`);
    const page = await openPage(browser, v);
    html[name] = await page.evaluate(serialize, map);
    console.log(`[${name}] html`, html[name].length);
    await page.close().catch(() => {});
  }
  await browser.close();

  info.houses.forEach((h) => { if (map[h.img]) h.img = map[h.img]; });
  const snapshot = {
    url: ORIGIN + '/',
    capturedAt: new Date().toISOString(),
    html,                       // { pc, sp }  rendered DOM (no scripts), local asset paths
    css: cssLocal,              // href -> CSS text with local url()s (typekit: link only)
    typekit: [...allSheets].find((h) => /use\.typekit\.net/.test(h)) || '',
    assets: map,
    ...info,                    // title, description, og, canonical, vars (:root custom properties), houses, logoSvg
  };
  fs.writeFileSync(path.join(ROOT, 'js', 'site-snapshot.js'),
    '/* Auto-generated by tools/update-snapshot.js from https://notahotel.com/ — do not edit by hand */\n' +
    'window.SITE_SNAPSHOT = ' + JSON.stringify(snapshot) + ';\n');
  console.log('done: js/site-snapshot.js', (fs.statSync(path.join(ROOT, 'js', 'site-snapshot.js')).size / 1048576).toFixed(2) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
