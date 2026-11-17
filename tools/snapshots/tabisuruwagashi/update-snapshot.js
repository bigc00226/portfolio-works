// Re-captures https://www.tabisuruwagashi.com/ and regenerates public/videos/tabisuruwagashi/js/site-snapshot.js + assets/site/.
// Run it after the live shop changes, so the demo keeps matching it.
//
//   npm run snapshot -- tabisuruwagashi   (in the project folder; images are converted to WebP afterwards)
//
// Needs Node.js 18+ and Google Chrome (or Edge) installed.
//
// What is captured:
//   - the top page as the browser shows it after the shop's own scripts ran (makeshop output + the WordPress lists the
//     page fetches + the review widget), at PC width (1920px) and smartphone width (360px)
//   - every stylesheet the page loads (makeshop "page.css" = 全ページ共通 + トップ CSS, system CSS, apps), byte-for-byte,
//     with only url(...) pointing at the local copies
//   - every image the page or its CSS uses -> assets/site/<host>/<path> (long paths shortened: shortAssetPath in tools/lib.js)
//   - the HTML exactly as makeshop's server sends it, the user CSS and the user JavaScript (shown in the code editor)
// What is removed from the captured page: all <script>s (analytics, ad and heat-map tags never run during the demo),
//   <noscript> pixels and iframes. Nothing else is changed.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');
const { shortAssetPath } = require('../../lib');

const ORIGIN = 'https://www.tabisuruwagashi.com';
const ROOT = path.resolve(__dirname, '../../../public/videos/tabisuruwagashi'); // the video's folder
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const UA_SP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const VIEWS = {
  pc: { width: 1920, height: 950, ua: UA_PC, mobile: false, dpr: 1 },
  sp: { width: 360, height: 740, ua: UA_SP, mobile: true, dpr: 2 },
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
  const res = await fetch(url, { headers: { 'user-agent': UA_PC, referer: ORIGIN + '/' } });
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  if (!binary) return res.text();
  const buf = Buffer.from(await res.arrayBuffer());
  buf.type = res.headers.get('content-type') || '';
  return buf;
}
const EXT_OF = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/avif': '.avif' };

/** absolute URL -> local path (relative to the demo root) */
function localPath(abs, type) {
  const u = new URL(abs);
  let p = decodeURIComponent(u.pathname).replace(/\/+$/, '/index');
  if (p.endsWith('/')) p += 'index';
  let ext = path.extname(p);
  let base = p.slice(0, p.length - ext.length);
  if (u.search) base += '__' + crypto.createHash('md5').update(u.search).digest('hex').slice(0, 8);
  if (!ext || ext.length > 6) { base += ext; ext = EXT_OF[(type || '').split(';')[0].trim()] || '.bin'; }
  const safe = (base + ext).replace(/[^A-Za-z0-9._\/\-]/g, '_');
  return shortAssetPath('assets/site/' + u.host + safe);
}

const isAsset = (u) => /^https?:/.test(u) && !/fonts\.(googleapis|gstatic)\.com/.test(u);
// review-widget videos are not downloaded: they are preload="none" and only their poster images show on the page
const isVideo = (u) => /\.(mp4|mov|webm|m3u8)$/i.test(new URL(u).pathname);

async function capture(browser, name, v) {
  const page = await browser.newPage();
  await page.setUserAgent(v.ua);
  await page.setViewport({ width: v.width, height: v.height, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: v.dpr });
  console.log(`[${name}] loading…`);
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle2', timeout: 120000 });
  // lists the page fills from WordPress, and the review widget
  await page.waitForFunction(() =>
    document.querySelectorAll('.js-journal li').length > 0 &&
    document.querySelectorAll('#js-posts li').length > 0 &&
    document.querySelectorAll('.js-topics li').length > 0, { timeout: 45000 }).catch(() => console.warn(`[${name}] WordPress lists not complete`));
  // scroll through once (lazy images, scroll reveals), then back to the top
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += Math.round(v.height * 0.6)) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await new Promise((r) => setTimeout(r, 160));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 2500));
  // the main-visual slider: wait for the start of a slide (not mid-transition)
  await page.waitForFunction(() => {
    const w = document.querySelector('#M_slider_clone .swiper-wrapper');
    return !w || w.style.transitionDuration === '0ms' || w.style.transitionDuration === '';
  }, { timeout: 8000 }).catch(() => {});

  // every URL the page uses
  const urls = await page.evaluate(() => {
    const out = new Set();
    const add = (v) => { if (!v) return; try { out.add(new URL(v.trim(), location.href).href); } catch (e) {} };
    const srcset = (v) => (v || '').split(',').map((s) => s.trim().split(/\s+/)[0]).forEach(add);
    document.querySelectorAll('img').forEach((i) => { add(i.getAttribute('src')); srcset(i.getAttribute('srcset')); });
    document.querySelectorAll('source').forEach((s) => { srcset(s.getAttribute('srcset')); add(s.getAttribute('src')); });
    document.querySelectorAll('video').forEach((s) => { add(s.getAttribute('poster')); });
    document.querySelectorAll('image').forEach((s) => add(s.getAttribute('href') || s.getAttribute('xlink:href')));
    document.querySelectorAll('[style*="url("]').forEach((e) => { for (const m of e.getAttribute('style').matchAll(/url\((['"]?)(.*?)\1\)/g)) add(m[2]); });
    document.querySelectorAll('style').forEach((s) => { for (const m of s.textContent.matchAll(/url\((['"]?)(.*?)\1\)/g)) if (!m[2].startsWith('data:')) add(m[2]); });
    const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
    return { assets: [...out], sheets };
  });
  await page.close().catch(() => {});
  return { page: null, urls };
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: 'new', args: ['--hide-scrollbars'] });
  const shots = {};
  const allAssets = new Set();
  const allSheets = new Set();
  // pass 1: discover
  for (const [name, v] of Object.entries(VIEWS)) {
    const { urls } = await capture(browser, name, v);
    urls.assets.forEach((u) => isAsset(u) && allAssets.add(u));
    urls.sheets.forEach((u) => allSheets.add(u));
  }

  // stylesheets (text) + the assets they reference
  // url(...) made absolute (relative to the sheet), @import'ed sheets inlined in place
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
      let text = await fetchCss(href);
      for (const m of text.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
        if (m[2].startsWith('data:') || m[2].startsWith('#')) continue;
        allAssets.add(new URL(m[2], href).href);
      }
      css[href] = text;
      console.log('css', href, text.length);
    } catch (e) { console.warn('css failed', href, e.message); }
  }

  // download every asset once
  const map = {};
  let n = 0, bytes = 0;
  for (const u of allAssets) {
    if (/\.(css|js)(\?|$)/.test(new URL(u).pathname) || isVideo(u)) continue;
    try {
      // already downloaded (any extension)?
      let lp = [...Object.keys(EXT_OF).map((t) => localPath(u, t)), localPath(u)].find((p) => fs.existsSync(path.join(ROOT, p)));
      if (!lp) {
        const buf = await get(u, true);
        lp = localPath(u, buf.type);
        const dest = path.join(ROOT, lp);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        bytes += buf.length;
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
  for (const [name, v] of Object.entries(VIEWS)) {
    const page = await browser.newPage();
    await page.setUserAgent(v.ua);
    await page.setViewport({ width: v.width, height: v.height, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: v.dpr });
    console.log(`[${name}] capturing…`);
    await page.goto(ORIGIN + '/', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForFunction(() =>
      document.querySelectorAll('.js-journal li').length > 0 && document.querySelectorAll('#js-posts li').length > 0 &&
      document.querySelectorAll('.js-topics li').length > 0, { timeout: 45000 }).catch(() => console.warn(`[${name}] WordPress lists not complete`));
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += Math.round(v.height * 0.6)) { await page.evaluate((y) => window.scrollTo(0, y), y); await new Promise((r) => setTimeout(r, 160)); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 2500));
    await page.waitForFunction(() => {
      const w = document.querySelector('#M_slider_clone .swiper-wrapper');
      return !w || w.style.transitionDuration === '0ms' || w.style.transitionDuration === '';
    }, { timeout: 8000 }).catch(() => {});
    const out = await page.evaluate((map) => {
      const loc = (v) => { try { const a = new URL(v.trim(), location.href).href; return map[a] || null; } catch (e) { return null; } };
      const fixSrcset = (v) => v.split(',').map((part) => { const p = part.trim().split(/\s+/); const l = loc(p[0]); if (l) p[0] = l; return p.join(' '); }).join(', ');
      const fixCss = (t) => t.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => { if (u.startsWith('data:') || u.startsWith('#')) return all; const l = loc(u); return l ? `url(${q}${l}${q})` : all; });
      const swiper = document.querySelector('#M_slider_clone');
      const swiperInfo = swiper ? { width: swiper.getBoundingClientRect().width } : null;
      const root = document.documentElement.cloneNode(true);
      root.querySelectorAll('script, noscript, iframe').forEach((e) => e.remove());
      root.querySelectorAll('link[rel="preload"], link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="modulepreload"], link[rel="prefetch"]').forEach((e) => e.remove());
      root.querySelectorAll('img').forEach((i) => { const s = i.getAttribute('src'); if (s && loc(s)) i.setAttribute('src', loc(s)); const ss = i.getAttribute('srcset'); if (ss) i.setAttribute('srcset', fixSrcset(ss)); });
      root.querySelectorAll('source').forEach((s) => { const ss = s.getAttribute('srcset'); if (ss) s.setAttribute('srcset', fixSrcset(ss)); const sr = s.getAttribute('src'); if (sr && loc(sr)) s.setAttribute('src', loc(sr)); });
      root.querySelectorAll('video[poster]').forEach((s) => { const l = loc(s.getAttribute('poster')); if (l) s.setAttribute('poster', l); });
      root.querySelectorAll('[style*="url("]').forEach((e) => e.setAttribute('style', fixCss(e.getAttribute('style'))));
      root.querySelectorAll('style').forEach((s) => { s.textContent = fixCss(s.textContent); });
      // stylesheet links: keep the original href (the demo inlines the local copy in its place)
      root.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.setAttribute('href', l.href));
      // the slider's measured width (the demo re-lays the slides out at any window width)
      const wrap = root.querySelector('#M_slider_clone');
      if (wrap && swiperInfo) wrap.setAttribute('data-demo-w', String(Math.round(swiperInfo.width)));
      return '<!DOCTYPE html>\n' + root.outerHTML;
    }, map);
    shots[name] = out;
    console.log(`[${name}] html`, out.length);
    await page.close().catch(() => {});
  }
  await browser.close();

  // what makeshop's server sends (shown in the code editor), and the user CSS / JS as served
  const serverHtml = await get(ORIGIN + '/');
  const userCssHref = [...allSheets].find((h) => /\/view\/asset\/user-[^/]+\.css/.test(h));
  const userJsSrc = (serverHtml.match(/<script src="(\/view\/asset\/user-[^"]+\.js)"/) || [])[1];
  const userCss = userCssHref ? await get(userCssHref) : '';
  const userJs = userJsSrc ? await get(ORIGIN + userJsSrc) : '';

  const snapshot = {
    url: ORIGIN + '/',
    capturedAt: new Date().toISOString(),
    html: shots,                // { pc, sp }  rendered DOM (no scripts), local asset paths
    css: cssLocal,              // href -> CSS text with local url()s
    serverHtml,                 // as sent by makeshop (code editor)
    userCssHref, userCss,       // page.css (全ページ共通 + トップ)
    userJsSrc, userJs,          // page.javascript
    assets: map,
  };
  fs.writeFileSync(path.join(ROOT, 'js', 'site-snapshot.js'),
    '/* Auto-generated by tools/update-snapshot.js from https://www.tabisuruwagashi.com/ — do not edit by hand */\n' +
    'window.SITE_SNAPSHOT = ' + JSON.stringify(snapshot) + ';\n');
  console.log('done: js/site-snapshot.js', (fs.statSync(path.join(ROOT, 'js', 'site-snapshot.js')).size / 1048576).toFixed(2) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
