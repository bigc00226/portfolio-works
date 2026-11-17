// Captures the real Shopify Theme Store (themes.shopify.com, Japanese) for the green-base video's theme-selection scene,
// and regenerates public/videos/green-base/js/themestore-snapshot.js + public/videos/green-base/assets/themestore/.
//
//   node tools/snapshots/green-base/capture-themestore.js        (then: node tools/webp.js green-base)
//
// Captured the same way as the storefronts (tools/snapshot-store.js): each state is the DOM as the browser shows it after
// the site's own scripts ran and the page was scrolled through once; scripts, iframes and <noscript> are removed; every
// stylesheet is kept byte-for-byte (inlined at play time by js/themestore-frame.js) with url(...) pointing at local copies;
// every image is the one the browser chose, downloaded next to the video. Public pages only (no login).
//
// States (all at the size of the video's Chrome content area, 1920 × 947):
//   list     the theme list filtered by 業種「ガーデン」 (/themes?industry[]=garden&sort_by=relevance), captured with the header
//            search open, "flow" typed and the suggestions shown. js/themestore-frame.js closes the search again with the
//            site's own classes (theme-search-overlay--is-open …) for the plain list, and reopens it while "flow" is typed
//   flow     the Flow theme page (/themes/flow/presets/flow), desktop preview
//   flowSp   the Flow theme page after clicking 「モバイル版」 (mobile preview)
// The theme previews on the Flow page are a live demo store in an <iframe>: it is replaced by a screenshot of itself.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');
const { shortAssetPath } = require('../../lib');

const ROOT = path.resolve(__dirname, '../../../public/videos/green-base'); // the video's folder
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ORIGIN = 'https://themes.shopify.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const VIEW = { width: 1920, height: 947 };
const PREFIX = 'assets/themestore/';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const GARDEN = '/themes?industry%5B%5D=garden&sort_by=relevance';
// `url` is what the address bar shows (a Japanese visitor with the language set: no ?locale), `load` what is fetched
const STATES = [
  { key: 'list', url: GARDEN, load: GARDEN + '&locale=ja', action: openSearch },
  { key: 'flow', url: '/themes/flow/presets/flow', load: '/themes/flow/presets/flow?locale=ja', preview: 'desktop' },
  { key: 'flowSp', url: '/themes/flow/presets/flow', load: '/themes/flow/presets/flow?locale=ja', preview: 'mobile', action: mobileMode },
];

const EXT_OF = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/avif': '.avif', 'font/woff2': '.woff2', 'font/woff': '.woff', 'image/x-icon': '.ico' };
function localPath(abs, type) {
  const u = new URL(abs);
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index';
  let ext = path.extname(p);
  let base = p.slice(0, p.length - ext.length);
  const q = new URLSearchParams(u.search);
  q.delete('v');
  const qs = q.toString();
  if (qs) base += '__' + crypto.createHash('md5').update(qs).digest('hex').slice(0, 8);
  if (!ext || ext.length > 6) { base += ext; ext = EXT_OF[(type || '').split(';')[0].trim()] || '.bin'; }
  let safe = (base + ext).replace(/[^A-Za-z0-9._/-]/g, '_');
  if (safe !== base + ext) safe = safe.replace(/(\.[A-Za-z0-9]+)$/, '_' + crypto.createHash('md5').update(base).digest('hex').slice(0, 6) + '$1');
  return shortAssetPath(PREFIX + u.host + safe);
}
async function get(url, binary) {
  let res;
  for (let k = 0; k < 6; k++) {
    res = await fetch(url, { headers: { 'user-agent': UA, referer: ORIGIN + '/', accept: binary ? 'image/webp,image/*,*/*;q=0.8' : '*/*', 'accept-language': 'ja-JP,ja;q=0.9' } });
    if (res.status !== 429 && res.status !== 403) break;
    await wait(2000 * (k + 1));
  }
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  if (!binary) return res.text();
  const buf = Buffer.from(await res.arrayBuffer());
  buf.type = res.headers.get('content-type') || '';
  return buf;
}

/* ---------------------------------------------------------------- actions on the live page */
async function openSearch(page) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="検索"]')].find((e) => e.getBoundingClientRect().width > 0); b.click(); });
  await wait(1500);
  await page.keyboard.type('flow', { delay: 120 });
  await wait(2500);
  // the typed text lives in the input's value: keep it in the markup
  await page.evaluate(() => { const i = document.querySelector('input#q'); i.setAttribute('value', i.value); i.setAttribute('data-demo-search', ''); });
}
async function mobileMode(page) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="モバイル版"]')].find((e) => e.getBoundingClientRect().width > 0); b.click(); });
  await wait(4000);
}
/** the live demo store in the preview <iframe> → a screenshot of it (the sticky theme bar hidden while shooting) */
async function previewShot(page, kind) {
  const r = await page.evaluate(() => {
    const f = [...document.querySelectorAll('iframe')].map((x) => [x, x.getBoundingClientRect()]).filter(([, q]) => q.width > 200 && q.height > 200 && q.top < innerHeight)
      .sort((a, b) => b[1].width * b[1].height - a[1].width * a[1].height)[0];
    if (!f) return null;
    f[0].setAttribute('data-demo-preview', '');
    document.querySelectorAll('*').forEach((e) => { if (e.textContent.includes('テーマを試す') && /sticky|fixed/.test(getComputedStyle(e).position)) { e.setAttribute('data-demo-was', e.style.visibility); e.style.visibility = 'hidden'; } });
    const q = f[1];
    return { x: q.left, y: q.top, width: q.width, height: Math.min(q.height, innerHeight - q.top) };
  });
  if (!r) { console.warn('  no preview iframe'); return null; }
  const file = `${PREFIX}flow-preview-${kind}.webp`;
  fs.mkdirSync(path.join(ROOT, PREFIX), { recursive: true });
  await page.screenshot({ path: path.join(ROOT, file), type: 'webp', quality: 82, clip: r });
  await page.evaluate((file) => {
    document.querySelectorAll('[data-demo-was]').forEach((e) => { e.style.visibility = e.getAttribute('data-demo-was'); e.removeAttribute('data-demo-was'); });
    const f = document.querySelector('iframe[data-demo-preview]');
    const img = document.createElement('img');
    img.className = f.className;
    img.setAttribute('src', file);
    img.setAttribute('alt', '');
    img.setAttribute('data-demo-preview', '');
    img.setAttribute('style', `${f.getAttribute('style') || ''};object-fit:cover;object-position:top;height:${f.getBoundingClientRect().height}px`);
    f.replaceWith(img);
  }, file);
  console.log('  preview', file, `${r.width}×${r.height}`);
  return file;
}

/* ---------------------------------------------------------------- capture one state */
async function capture(browser, st) {
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' });
  await page.setViewport({ ...VIEW, deviceScaleFactor: 1 });
  console.log(`[${st.key}] ${ORIGIN}${st.load}`);
  await page.goto(ORIGIN + st.load, { waitUntil: 'networkidle2', timeout: 120000 });
  await wait(2500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + VIEW.height; y += Math.round(VIEW.height * 0.5)) { await page.evaluate((y) => window.scrollTo(0, y), y); await wait(160); }
  await wait(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(2000);
  if (st.action) await st.action(page);
  let preview = null;
  if (st.preview) preview = await previewShot(page, st.preview);
  // the page's script puts the section back to desktop when its preview <iframe> goes: the mode class is set again here
  // (every "mobile" look of the page hangs on it: group-[.mode-mobile]/demo:… in the site's own CSS)
  if (st.preview === 'mobile') await page.evaluate(() => { const s = document.getElementById('demo-container'); if (s) { s.classList.remove('mode-desktop'); s.classList.add('mode-mobile'); } });
  const out = await page.evaluate((PREFIX) => {
    const abs = (v) => { try { return new URL(v.trim(), location.href).href; } catch (e) { return null; } };
    const assets = new Set();
    // theme-store images: the size the page shows (the originals are up to 2400px)
    const sized = (u, w) => {
      if (!u || !/cdn\.shopify\.com\//.test(u)) return u;
      try { const x = new URL(u); const cur = parseInt(x.searchParams.get('width'), 10); if (!cur || cur > w) x.searchParams.set('width', String(w)); return x.href; } catch (e) { return u; }
    };
    const want = (el) => { const r = el.getBoundingClientRect(); const w = r.width ? Math.ceil((r.width * 1.5) / 100) * 100 : 600; return Math.max(100, Math.min(1920, w)); };
    document.querySelectorAll('img').forEach((img) => {
      if (img.hasAttribute('data-demo-preview')) return;
      const cur0 = img.currentSrc || (img.getAttribute('src') && abs(img.getAttribute('src'))) || '';
      let pick = cur0 && !cur0.startsWith('data:') ? sized(cur0, want(img)) : cur0;
      if (!pick || pick.startsWith('data:')) {
        const ss = img.getAttribute('data-srcset') || img.getAttribute('srcset') || '';
        const first = ss.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
        pick = (img.getAttribute('data-src') && abs(img.getAttribute('data-src'))) || (first.length ? abs(first[first.length - 1]) : pick);
        pick = pick && !pick.startsWith('data:') ? sized(pick, want(img)) : pick;
      }
      if (pick && !pick.startsWith('data:')) { img.setAttribute('src', pick); assets.add(pick); }
      img.removeAttribute('srcset'); img.removeAttribute('data-srcset'); img.removeAttribute('sizes');
      if (img.getAttribute('loading') === 'lazy') img.setAttribute('loading', 'eager');
    });
    document.querySelectorAll('picture source').forEach((s) => s.remove());
    document.querySelectorAll('video').forEach((vd) => { const p = vd.getAttribute('poster'); if (p) { const a = abs(p); vd.setAttribute('poster', a); assets.add(a); } vd.removeAttribute('autoplay'); vd.querySelectorAll('source').forEach((s) => s.remove()); vd.removeAttribute('src'); });
    document.querySelectorAll('[style*="url("]').forEach((e) => {
      e.setAttribute('style', e.getAttribute('style').replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => { if (u.startsWith('data:')) return all; const a = sized(abs(u), 1920); if (!a) return all; assets.add(a); return `url(${q}${a}${q})`; }));
    });
    document.querySelectorAll('style').forEach((s) => {
      s.textContent = s.textContent.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => { if (u.startsWith('data:') || u.startsWith('#')) return all; const a = abs(u); if (!a) return all; assets.add(a); return `url(${q}${a}${q})`; });
    });
    document.querySelectorAll('svg image').forEach((i) => { const h = i.getAttribute('href') || i.getAttribute('xlink:href'); if (h && !h.startsWith('data:')) { const a = abs(h); i.setAttribute('href', a); assets.add(a); } });
    // cookie banners / consent and the page's machinery
    document.querySelectorAll('[id*="cookie" i], [class*="cookie-banner" i], [id*="consent" i]').forEach((e) => e.remove());
    document.querySelectorAll('script, noscript, iframe, template, link[rel="preload"], link[rel="prefetch"], link[rel="modulepreload"], link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="alternate"], link[rel="manifest"], link[rel~="icon"], link[rel="apple-touch-icon"], meta[http-equiv]').forEach((e) => e.remove());
    const sheets = [];
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => { const a = abs(l.getAttribute('href')); if (a) { l.setAttribute('href', a); sheets.push(a); } });
    // links: keep them absolute (they are never followed — the frame swallows clicks)
    document.querySelectorAll('a[href]').forEach((a) => { const h = abs(a.getAttribute('href')); if (h) a.setAttribute('href', h); });
    return { html: '<!DOCTYPE html>\n' + document.documentElement.outerHTML, sheets, assets: [...assets], title: document.title, height: document.documentElement.scrollHeight };
  }, PREFIX);
  await page.close();
  return out;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--lang=ja-JP'] });
  const pages = {};
  const sheets = new Set();
  const assets = new Set();
  for (const st of STATES) {
    const r = await capture(browser, st);
    pages[st.key] = { url: ORIGIN + st.url, title: r.title, html: r.html };
    r.sheets.forEach((s) => sheets.add(s));
    r.assets.forEach((a) => /^https?:/.test(a) && assets.add(a));
    console.log(`  "${r.title}" ${(r.html.length / 1024).toFixed(0)} KB html, ${r.assets.length} assets, page ${r.height}px`);
  }
  await browser.close();

  // stylesheets: text, url(...) absolute, @import inlined
  const absolutize = (text, href) => text.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => {
    if (u.startsWith('data:') || u.startsWith('#')) return all;
    try { return `url(${q}${new URL(u, href).href}${q})`; } catch (e) { return all; }
  });
  async function fetchCss(href, depth = 0) {
    let text = await get(href);
    for (const m of [...text.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1\s*\)?\s*([^;]*);/g)]) {
      const a = new URL(m[2], href).href;
      if (depth > 3) continue;
      try { const inner = await fetchCss(a, depth + 1); text = text.replace(m[0], m[3].trim() ? `@media ${m[3].trim()}{${inner}}` : inner); } catch (e) { console.warn('@import failed', a, e.message); }
    }
    return absolutize(text, href);
  }
  const css = {};
  for (const href of sheets) {
    try {
      const text = await fetchCss(href);
      for (const m of text.matchAll(/url\((['"]?)(.*?)\1\)/g)) if (/^https?:/.test(m[2])) assets.add(m[2]);
      css[href] = text;
    } catch (e) { console.warn('css failed', href, e.message); }
  }
  console.log('stylesheets', Object.keys(css).length, (Object.values(css).join('').length / 1024).toFixed(0) + ' KB');

  // every asset once (an image already converted to WebP by tools/webp.js counts as present)
  const map = {};
  let n = 0, bytes = 0, failed = 0;
  const present = (lp) => [lp, lp.replace(/\.(jpe?g|png|gif|avif)$/i, '.webp')].find((p) => fs.existsSync(path.join(ROOT, p)));
  for (const u of assets) {
    if (/\.(css|js|mp4|webm)(\?|$)/.test(new URL(u).pathname)) continue;
    try {
      let lp = [...Object.keys(EXT_OF).map((t) => localPath(u, t)), localPath(u)].map(present).find(Boolean);
      if (!lp) {
        const buf = await get(u, true);
        lp = localPath(u, buf.type);
        fs.mkdirSync(path.dirname(path.join(ROOT, lp)), { recursive: true });
        fs.writeFileSync(path.join(ROOT, lp), buf);
        bytes += buf.length;
      }
      map[u] = lp;
      n++;
    } catch (e) {
      failed++;
      if (failed < 12) console.warn('asset failed', u, e.message);
      if (/-> 40[34]$/.test(e.message)) map[u] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  }
  console.log('assets', n, (bytes / 1048576).toFixed(1) + ' MB new', failed ? `(${failed} failed)` : '');

  const local = (u) => map[u] || map[u.replace(/&amp;/g, '&')] || u;
  // SVGs used from CSS are inlined: as mask-image they are fetched in CORS mode, which a page opened from disk (file://) blocks
  const inline = (lp) => (lp.endsWith('.svg') ? `data:image/svg+xml;base64,${fs.readFileSync(path.join(ROOT, lp)).toString('base64')}` : lp);
  const rewriteUrls = (text) => text.replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => (map[u] ? `url(${q}${inline(map[u])}${q})` : all));
  const rewriteHtml = (html) => html
    .replace(/(<img\b[^>]*?\bsrc=")([^"]+)(")/g, (all, a, u, b) => a + local(u) + b)
    .replace(/(\bposter=")([^"]+)(")/g, (all, a, u, b) => a + local(u) + b)
    .replace(/(<image\b[^>]*?\bhref=")([^"]+)(")/g, (all, a, u, b) => a + local(u) + b)
    .replace(/url\((['"]?|&quot;)(.*?)\1\)/g, (all, q, u) => { const k = u.replace(/&amp;/g, '&'); return map[k] ? `url(${q}${map[k]}${q})` : all; });
  for (const p of Object.values(pages)) p.html = rewriteHtml(p.html);
  const cssLocal = {};
  for (const [href, text] of Object.entries(css)) cssLocal[href] = rewriteUrls(text);

  // files of an earlier capture that are no longer used
  const used = new Set(Object.values(map).filter((p) => !p.startsWith('data:')).map((p) => path.join(ROOT, p)));
  for (const k of ['desktop', 'mobile']) used.add(path.join(ROOT, `${PREFIX}flow-preview-${k}.webp`));
  const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
  let gone = 0;
  for (const f of walk(path.join(ROOT, PREFIX))) if (!used.has(f) && !used.has(f.replace(/\.webp$/, '.jpg')) && !used.has(f.replace(/\.webp$/, '.png'))) { fs.rmSync(f); gone++; }
  if (gone) console.log('removed', gone, 'files no longer used');

  const snap = { origin: ORIGIN, capturedAt: new Date().toISOString(), view: VIEW, pages, css: cssLocal };
  const out = path.join(ROOT, 'js', 'themestore-snapshot.js');
  fs.writeFileSync(out, `/* Auto-generated by tools/snapshots/green-base/capture-themestore.js from ${ORIGIN} (Japanese) — do not edit by hand */\nwindow.THEMESTORE_SNAPSHOT = ${JSON.stringify(snap)};\n`);
  console.log('wrote', path.relative(process.cwd(), out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
  console.log('next: node tools/webp.js green-base   (images → WebP, references rewritten)');
})().catch((e) => { console.error(e); process.exit(1); });
