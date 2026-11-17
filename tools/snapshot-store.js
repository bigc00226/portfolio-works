/*
 * Captures the live Shopify storefront a video shows and writes it next to the video:
 *   npm run snapshot -- <id>     (tools/snapshot.js runs this for every video whose config.js has a `snapshot`)
 *
 * What to capture is set in public/videos/<id>/js/config.js (window.VIDEO.snapshot):
 *   origin   https://store.example.com
 *   pages    { home: '/', product: '/products/xxx', … }   each page at PC width (1920px) and smartphone width (390px)
 *   remove   CSS selectors removed before capturing (pop-ups, chat buttons, cookie bars …)
 *   views    ['pc', 'sp'] (default both)
 *   products ['handle', …]  product data for the admin screens (/products/<handle>.json + the first image)
 *   catalog  N              the first N products of the public product list in short form (no images)
 *   css      extra CSS for the frames (e.g. to switch off a scroll animation) — used by public/shared/kit/store-frame.js
 *
 * Each page is captured as the browser shows it after the theme's own scripts ran and the page was scrolled through
 * once (lazy images and scroll animations done). Scripts, iframes and <noscript> are removed; every stylesheet is kept
 * byte-for-byte (inlined later by public/shared/kit/store-frame.js) with url(...) pointing at local copies; every image
 * is the one the browser chose for that width (srcset resolved), downloaded to public/videos/<id>/assets/site/<host>/<path>
 * (a long <path> is shortened to _/<name>-<hash>: see shortAssetPath in tools/lib.js)
 * (converted to WebP afterwards by tools/webp.js — tools/snapshot.js runs both).
 *
 * Writes public/videos/<id>/js/site-snapshot.js (window.SITE_SNAPSHOT) and public/videos/<id>/assets/site/.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, CHROME, puppeteer, wait, videoDir, shortAssetPath } = require('./lib');

const id = process.argv[2];
if (!id) { console.error('usage: node tools/snapshot-store.js <video id>'); process.exit(1); }
const DIR = videoDir(id);
const cfgFile = path.join(DIR, 'js', 'config.js');
if (!fs.existsSync(cfgFile)) { console.error('not found: ' + cfgFile); process.exit(1); }
const W = {};
new Function('window', fs.readFileSync(cfgFile, 'utf8'))(W);
const CFG = (W.VIDEO || {}).snapshot;
if (!CFG || !CFG.origin || !CFG.pages) { console.error('window.VIDEO.snapshot { origin, pages } is missing in ' + cfgFile); process.exit(1); }

const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const UA_SP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const VIEWS = {
  pc: { width: 1920, height: 950, ua: UA_PC, mobile: false },
  sp: { width: 390, height: 844, ua: UA_SP, mobile: true },
};
const EXT_OF = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/avif': '.avif', 'font/woff2': '.woff2', 'font/woff': '.woff', 'image/x-icon': '.ico', 'image/vnd.microsoft.icon': '.ico' };

/** absolute URL -> local path (relative to the video folder) */
function localPath(abs, type) {
  const u = new URL(abs);
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index';
  let ext = path.extname(p);
  let base = p.slice(0, p.length - ext.length);
  // keep the size parameters apart (the same file at two widths); version stamps (?v=) are dropped
  const q = new URLSearchParams(u.search);
  q.delete('v');
  const qs = q.toString();
  if (qs) base += '__' + crypto.createHash('md5').update(qs).digest('hex').slice(0, 8);
  if (!ext || ext.length > 6) { base += ext; ext = EXT_OF[(type || '').split(';')[0].trim()] || '.bin'; }
  let safe = (base + ext).replace(/[^A-Za-z0-9._/-]/g, '_');
  if (safe !== base + ext) safe = safe.replace(/(\.[A-Za-z0-9]+)$/, '_' + crypto.createHash('md5').update(base).digest('hex').slice(0, 6) + '$1');
  return shortAssetPath('assets/site/' + u.host + safe);
}
const isRemote = (u) => /^https?:/.test(u);
const isVideo = (u) => /\.(mp4|mov|webm|m3u8)$/i.test(new URL(u).pathname);

async function get(url, binary) {
  let res;
  for (let k = 0; k < 6; k++) {
    // webp from the image CDN (much smaller than the original png / jpg); back off when rate-limited
    res = await fetch(url, { headers: { 'user-agent': UA_PC, referer: CFG.origin + '/', accept: binary ? 'image/webp,image/*,*/*;q=0.8' : '*/*' } });
    if (res.status !== 429 && res.status !== 403) break;
    await wait(2000 * (k + 1));
  }
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  if (!binary) return res.text();
  const buf = Buffer.from(await res.arrayBuffer());
  buf.type = res.headers.get('content-type') || '';
  return buf;
}

/* ---------------------------------------------------------------- in-page capture */
async function capture(browser, pageKey, pagePath, viewKey) {
  const v = VIEWS[viewKey];
  const page = await browser.newPage();
  await page.setUserAgent(v.ua);
  await page.setViewport({ width: v.width, height: v.height, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: 1 });
  const url = new URL(pagePath, CFG.origin).href;
  console.log(`[${pageKey}/${viewKey}] ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 }).catch((e) => console.warn('  goto:', e.message));
  await wait(2500);
  const strip = async () => page.evaluate((sel) => { sel.forEach((s) => document.querySelectorAll(s).forEach((e) => e.remove())); }, CFG.remove || []);
  await strip();
  // scroll through once: lazy images, scroll-in animations
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + v.height; y += Math.round(v.height * 0.5)) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await wait(180);
  }
  await wait(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(2500);
  await strip();
  const out = await page.evaluate((origin) => {
    const abs = (v) => { try { return new URL(v.trim(), location.href).href; } catch (e) { return null; } };
    const assets = new Set();
    // images: the size the browser picked for this width
    // Shopify CDN images: ask for the size the page shows (the originals can be several MB)
    const sized = (u, w) => {
      if (!u || !/(cdn\.shopify\.com\/s\/files|\/cdn\/shop\/)/.test(u)) return u;
      u = u.replace(/%7Bwidth%7D|\{width\}/g, String(w));
      try { const x = new URL(u); const cur = parseInt(x.searchParams.get('width'), 10); if (!cur || cur > w) x.searchParams.set('width', String(w)); return x.href; } catch (e) { return u; }
    };
    const want = (el) => { const r = el.getBoundingClientRect(); const w = r.width ? Math.ceil((r.width * 1.5) / 100) * 100 : 600; return Math.max(200, Math.min(1920, w)); };
    document.querySelectorAll('img').forEach((img) => {
      const cur0 = img.currentSrc || (img.getAttribute('src') && abs(img.getAttribute('src'))) || '';
      const cur = cur0 && !cur0.startsWith('data:') ? sized(cur0, want(img)) : cur0;
      let pick = cur;
      if (!pick || pick.startsWith('data:')) {
        const ss = img.getAttribute('data-srcset') || img.getAttribute('srcset') || '';
        const first = ss.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
        pick = (img.getAttribute('data-src') && abs(img.getAttribute('data-src'))) || (first.length ? abs(first[Math.min(first.length - 1, 2)]) : pick);
        pick = pick && !pick.startsWith('data:') ? sized(pick, want(img)) : pick;
      }
      if (pick && !pick.startsWith('data:')) { img.setAttribute('src', pick); assets.add(pick); }
      img.removeAttribute('srcset'); img.removeAttribute('data-srcset'); img.removeAttribute('sizes');
      if (img.getAttribute('loading') === 'lazy') img.setAttribute('loading', 'eager');
    });
    document.querySelectorAll('picture source').forEach((s) => s.remove());
    document.querySelectorAll('video').forEach((vd) => {
      const p = vd.getAttribute('poster');
      if (p) { const a = abs(p); vd.setAttribute('poster', a); assets.add(a); }
      vd.removeAttribute('autoplay'); vd.querySelectorAll('source').forEach((s) => s.remove()); vd.removeAttribute('src');
    });
    document.querySelectorAll('[style*="url("]').forEach((e) => {
      e.setAttribute('style', e.getAttribute('style').replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => { if (u.startsWith('data:')) return all; const a = sized(abs(u), 1920); if (!a) return all; assets.add(a); return `url(${q}${a}${q})`; }));
    });
    document.querySelectorAll('style').forEach((s) => {
      s.textContent = s.textContent.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => { if (u.startsWith('data:') || u.startsWith('#')) return all; const a = abs(u); if (!a) return all; assets.add(a); return `url(${q}${a}${q})`; });
    });
    document.querySelectorAll('svg image').forEach((i) => { const h = i.getAttribute('href') || i.getAttribute('xlink:href'); if (h && !h.startsWith('data:')) { const a = abs(h); i.setAttribute('href', a); assets.add(a); } });
    // the rest of the page's machinery
    document.querySelectorAll('script, noscript, iframe, template, link[rel="preload"], link[rel="prefetch"], link[rel="modulepreload"], link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="alternate"], link[rel="manifest"], meta[http-equiv]').forEach((e) => e.remove());
    const sheets = [];
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => { const a = abs(l.getAttribute('href')); if (a) { l.setAttribute('href', a); sheets.push(a); } });
    const icon = document.querySelector('link[rel~="icon"]');
    const fav = icon ? abs(icon.getAttribute('href')) : null;
    if (fav) assets.add(fav);
    const dt = document.doctype ? '<!DOCTYPE html>\n' : '';
    return { html: dt + document.documentElement.outerHTML, sheets, assets: [...assets], title: document.title, favicon: fav, height: document.documentElement.scrollHeight };
  }, CFG.origin);
  await page.close().catch(() => {});
  return out;
}

(async () => {
  const browser = await puppeteer().launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--lang=ja-JP'] });
  const views = CFG.views || ['pc', 'sp'];
  const shots = {};
  const sheets = new Set();
  const assets = new Set();
  let title = '', favicon = null;
  for (const [key, p] of Object.entries(CFG.pages)) {
    shots[key] = {};
    for (const vk of views) {
      const r = await capture(browser, key, p, vk);
      shots[key][vk] = r.html;
      r.sheets.forEach((s) => sheets.add(s));
      r.assets.forEach((a) => isRemote(a) && assets.add(a));
      // the tab title / favicon: from the home page (or the first page when the home page is not captured)
      if ((key === 'home' || (!CFG.pages.home && !title)) && vk === 'pc') { title = r.title; favicon = r.favicon; }
      console.log(`  ${(r.html.length / 1024).toFixed(0)} KB html, ${r.assets.length} assets, page ${r.height}px`);
    }
  }
  await browser.close();

  // stylesheets: text, url(...) made absolute, @import inlined
  const absolutize = (text, href) => text.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => {
    if (u.startsWith('data:') || u.startsWith('#')) return all;
    try { return `url(${q}${new URL(u, href).href}${q})`; } catch (e) { return all; }
  });
  async function fetchCss(href, depth = 0) {
    let text = await get(href);
    for (const m of [...text.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1\s*\)?\s*([^;]*);/g)]) {
      const a = new URL(m[2], href).href;
      if (depth > 3 || /fonts\.googleapis\.com/.test(a)) continue;
      try { const inner = await fetchCss(a, depth + 1); text = text.replace(m[0], m[3].trim() ? `@media ${m[3].trim()}{${inner}}` : inner); } catch (e) { console.warn('@import failed', a, e.message); }
    }
    return absolutize(text, href);
  }
  const css = {};
  for (const href of sheets) {
    if (/fonts\.googleapis\.com/.test(href)) continue;
    try {
      const text = await fetchCss(href);
      for (const m of text.matchAll(/url\((['"]?)(.*?)\1\)/g)) if (isRemote(m[2]) && !/fonts\.(googleapis|gstatic)\.com/.test(m[2])) assets.add(m[2]);
      css[href] = text;
    } catch (e) { console.warn('css failed', href, e.message); }
  }
  console.log('stylesheets', Object.keys(css).length);

  // download every asset once
  const map = {};
  let n = 0, bytes = 0, failed = 0;
  for (const u of assets) {
    if (/fonts\.(googleapis|gstatic)\.com/.test(u) || isVideo(u) || /\.(css|js)(\?|$)/.test(new URL(u).pathname)) continue;
    try {
      let lp = [...Object.keys(EXT_OF).map((t) => localPath(u, t)), localPath(u)].find((p) => fs.existsSync(path.join(DIR, p)));
      if (!lp) {
        const buf = await get(u, true);
        lp = localPath(u, buf.type);
        const dest = path.join(DIR, lp);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        bytes += buf.length;
      }
      map[u] = lp;
      n++;
    } catch (e) {
      failed++;
      if (failed < 12) console.warn('asset failed', u, e.message);
      // broken on the live store too (404): an empty image instead of a request that fails during playback
      if (/-> 40[34]$/.test(e.message)) map[u] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  }
  console.log('assets', n, (bytes / 1048576).toFixed(1) + ' MB new', failed ? `(${failed} failed)` : '');

  const local = (u) => map[u] || u;
  const rewriteUrls = (text) => text.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => (map[u] ? `url(${q}${map[u]}${q})` : all));
  const rewriteHtml = (html) => html
    .replace(/(<img\b[^>]*?\bsrc=")([^"]+)(")/g, (all, a, u, b) => a + local(u.replace(/&amp;/g, '&')) + b)
    .replace(/(\bposter=")([^"]+)(")/g, (all, a, u, b) => a + local(u.replace(/&amp;/g, '&')) + b)
    .replace(/(<image\b[^>]*?\bhref=")([^"]+)(")/g, (all, a, u, b) => a + local(u.replace(/&amp;/g, '&')) + b)
    .replace(/url\((['"]?|&quot;)(.*?)\1\)/g, (all, q, u) => { const k = u.replace(/&amp;/g, '&'); return map[k] ? `url(${q}${map[k]}${q})` : all; });
  const pages = {};
  for (const [k, vs] of Object.entries(shots)) { pages[k] = {}; for (const [vk, html] of Object.entries(vs)) pages[k][vk] = rewriteHtml(html); }
  const cssLocal = {};
  for (const [href, text] of Object.entries(css)) cssLocal[href] = rewriteUrls(text);

  // product data shown in the admin (titles, variants, SKUs, tags, the first image), from the store's public JSON
  const products = [];
  const listed = {};
  if ((CFG.products || []).length || CFG.catalog) {
    for (let pg = 1; pg <= Math.max(2, Math.ceil((CFG.catalog || 0) / 250)); pg++) {
      try { JSON.parse(await get(`${CFG.origin}/products.json?limit=250&page=${pg}`)).products.forEach((p) => { listed[p.handle] = p; }); } catch (e) { console.warn('products.json', e.message); }
    }
  }
  for (const h of CFG.products || []) {
    try {
      const p = listed[h] || JSON.parse(await get(`${CFG.origin}/products/${encodeURIComponent(h)}.json`)).product;
      await wait(listed[h] ? 0 : 1200);
      let image = null;
      const src = (p.image && p.image.src) || (p.images[0] && p.images[0].src);
      if (src) {
        const u = src + (src.includes('?') ? '&' : '?') + 'width=240';
        try {
          let lp = [...Object.keys(EXT_OF).map((t) => localPath(u, t)), localPath(u)].find((x) => fs.existsSync(path.join(DIR, x)));
          if (!lp) { const buf = await get(u, true); lp = localPath(u, buf.type); fs.mkdirSync(path.dirname(path.join(DIR, lp)), { recursive: true }); fs.writeFileSync(path.join(DIR, lp), buf); }
          image = lp;
        } catch (e) { console.warn('product image failed', h, e.message); }
      }
      products.push({
        handle: p.handle, title: p.title, vendor: p.vendor, type: p.product_type, tags: p.tags,
        options: p.options.map((o) => ({ name: o.name, values: o.values })),
        variants: p.variants.map((v) => ({ title: v.title, price: v.price, compare: v.compare_at_price, sku: v.sku })),
        body: (p.body_html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 400), image,
      });
    } catch (e) { console.warn('product failed', h, e.message); }
  }
  if (products.length) console.log('products', products.length);
  // the whole catalogue in short form (the store's public product list): titles, vendors, tags, variants
  const catalog = CFG.catalog ? Object.values(listed).slice(0, CFG.catalog).map((p) => ({
    h: p.handle, t: p.title, v: p.vendor, ty: p.product_type, tags: p.tags, o: (p.options[0] || {}).name,
    vs: p.variants.map((v) => [v.title, v.price, v.sku, v.compare_at_price]),
  })) : undefined;
  if (catalog) console.log('catalog', catalog.length);

  const snap = { url: CFG.origin + '/', capturedAt: new Date().toISOString(), title, favicon: favicon ? local(favicon) : null, pages, css: cssLocal, products, catalog };
  // files left over from an earlier capture (no longer on the pages) are removed
  const used = new Set([...Object.values(map), ...products.map((p) => p.image).filter(Boolean)].map((p) => path.join(DIR, p)));
  const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
  let gone = 0;
  for (const f of walk(path.join(DIR, 'assets', 'site'))) if (!used.has(f)) { fs.rmSync(f); gone++; }
  if (gone) console.log('removed', gone, 'files no longer used');

  const out = path.join(DIR, 'js', 'site-snapshot.js');
  fs.writeFileSync(out, `/* Auto-generated by tools/snapshot-store.js from ${CFG.origin}/ — do not edit by hand (npm run snapshot:${id}) */\nwindow.SITE_SNAPSHOT = ${JSON.stringify(snap)};\n`);
  console.log('wrote', path.relative(ROOT, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
