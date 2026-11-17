// Captures the public parts of the real makeshop byGMO shop admin (console.makeshop.jp) for the two videos that show
// the makeshop admin — tabisuruwagashi and nissin-store — and writes them into both video folders:
//
//   node tools/snapshots/tabisuruwagashi/capture-makeshop.js          (in the project folder; images become WebP)
//
// 1. js/makeshop-login.js  window.MAKESHOP_LOGIN — the real login page https://console.makeshop.jp/login as the browser
//    shows it after the app ran (Vue / Vuetify markup, the GMO group header and footer), every stylesheet inlined with
//    its url(...) pointing at local copies, images in assets/makeshop/ (SVG as is, raster → WebP). Scripts, tracking
//    tags, the chat widget and iframes are removed. The fields are empty: the videos type into them.
// 2. js/makeshop-ui.js     window.MAKESHOP_UI — what the admin's own public JavaScript says about the admin itself:
//    its icon set (inline SVG strings of /src/assets/icons/*.svg in the app bundle), its theme colours (nextEcTheme),
//    and the title format of its pages ("%s - makeshop byGMO"). The admin screens after the login need an account,
//    so the videos rebuild them with these. Plus assets/makeshop/ms-logo-typeA.svg, the admin's horizontal logo.
//
// Needs Node 22+, Google Chrome, `npm install` (puppeteer-core, sharp). Nothing is logged in, nothing is submitted.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../../..');
const VIDEOS = ['tabisuruwagashi', 'nissin-store'];
const LOGIN = 'https://console.makeshop.jp/login';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const VIEW = { width: 1920, height: 947 }; // the content area of the maximized Chrome window in the videos
const ASSET_DIR = 'assets/makeshop';       // relative to each video folder
const ICONS = ['home', 'product', 'order', 'customer', 'design', 'analysis', 'app', 'config', 'help', 'account', 'search',
  'download', 'upload', 'shop', 'bellOutline', 'menuBook', 'collapseHorizontal', 'expandHorizontal', 'eye', 'eyeClose',
  'page', 'code', 'plus', 'web', 'arrowForward', 'back', 'history', 'mail', 'listAlt', 'moreVert', 'pc', 'mobile', 'lightbulb'];

const files = new Map(); // remote url -> { rel, buf }
async function get(url) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'image/avif,image/webp,image/*,text/css,*/*;q=0.8' } });
    if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') || '' };
    if (r.status === 404 || r.status === 410) throw new Error(`HTTP ${r.status} ${url}`);
    await new Promise((res) => setTimeout(res, 800 * (i + 1)));
  }
  throw new Error('failed ' + url);
}
/** downloads an asset once and returns its local path (raster images → WebP) */
async function local(url) {
  if (files.has(url)) return files.get(url).rel;
  const u = new URL(url);
  let { buf, type } = await get(url);
  // (the query strings here are cache-busters: the path names the file)
  let p = (u.pathname.replace(/\/$/, '/index') || '/index').replace(/[^\w./-]/g, '_');
  if ([...files.values()].some((f) => f.path === p)) p = p.replace(/(\.\w+)?$/, `__${crypto.createHash('md5').update(u.search).digest('hex').slice(0, 8)}$1`);
  const raster = /image\/(png|jpe?g|gif)/.test(type) || /\.(png|jpe?g|gif)$/i.test(u.pathname);
  if (raster) {
    buf = await sharp(buf, { animated: true }).webp({ quality: 90, effort: 5 }).toBuffer();
    p = p.replace(/\.(png|jpe?g|gif)$/i, '') + '.webp';
  } else if (!path.extname(p)) p += /svg/.test(type) ? '.svg' : /woff2/.test(type) ? '.woff2' : /woff/.test(type) ? '.woff' : '';
  const rel = `${ASSET_DIR}/login/${u.hostname}${p.startsWith('/') ? '' : '/'}${p}`;
  files.set(url, { rel, buf, path: p });
  return rel;
}
/** rewrites url(...) in a stylesheet (relative to `base`) to local copies; Google Fonts stay remote */
async function localizeCss(css, base) {
  const jobs = [];
  css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => { jobs.push(u); return m; });
  const map = {};
  for (const u of new Set(jobs)) {
    if (/^(data:|#)/.test(u)) continue;
    const abs = new URL(u, base).href;
    if (/fonts\.(googleapis|gstatic)\.com/.test(abs)) { map[u] = abs; continue; }
    try { map[u] = '__ASSET__' + (await local(abs)); } catch (e) { console.log('  skipped', abs, e.message); map[u] = abs; }
  }
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => (map[u] ? `url("${map[u]}")` : m))
    .replace(/@import\s+url\(\s*"(https:\/\/fonts\.googleapis\.com[^"]+)"\s*\)/g, '@import url("$1")');
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--lang=ja-JP', '--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' });
  await page.setViewport(VIEW);
  const bundles = [];
  page.on('response', async (r) => { if (/console\.makeshop\.jp\/assets\/.+\.js$/.test(r.url())) { try { bundles.push(await r.text()); } catch (e) { /* ignore */ } } });
  await page.goto(LOGIN, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2000));

  // ---------------------------------------------------------------- 1. the login page
  const snap = await page.evaluate(() => {
    const d = document;
    const keep = (el) => el.matches('#app, .gmoGroupHeader, #gmoFooterHtml, .gmoGroupFooter');
    [...d.body.children].forEach((el) => { if (!keep(el)) el.remove(); });
    d.querySelectorAll('script, noscript, iframe, link:not([rel="stylesheet"]), meta[http-equiv], base').forEach((e) => e.remove());
    d.querySelectorAll('img').forEach((i) => { const r = i.getBoundingClientRect(); if (/bat\.bing|doubleclick|facebook|mieru-ca|im-apps/.test(i.src) || (!r.width && !r.height && !i.closest('.gmoGroupFooter, .gmoGroupHeader'))) i.remove(); });
    // the images as the browser chose them (srcset resolved)
    d.querySelectorAll('img').forEach((i) => { if (i.currentSrc) i.setAttribute('src', i.currentSrc); i.removeAttribute('srcset'); i.removeAttribute('loading'); });
    // stylesheets: mark their place, the tool inlines them
    const sheets = [];
    d.querySelectorAll('link[rel="stylesheet"]').forEach((l, k) => { sheets.push(l.href); l.replaceWith(Object.assign(d.createElement('style'), { textContent: `/*__SHEET_${k}__*/` })); });
    // Vue's scoped-style markers and ids stay (the CSS needs them); the input ids are Vuetify's own
    return { html: '<!DOCTYPE html>\n' + d.documentElement.outerHTML, sheets, title: d.title };
  });
  let html = snap.html;
  for (let k = 0; k < snap.sheets.length; k++) {
    const href = snap.sheets[k];
    const { buf } = await get(href);
    const css = await localizeCss(buf.toString('utf8'), href);
    html = html.replace(`/*__SHEET_${k}__*/`, () => `/* ${href.replace(/\?.*$/, '')} */\n${css}`);
  }
  // images and inline-style backgrounds in the markup
  const urls = new Set();
  html.replace(/\s(?:src)="(https?:[^"]+)"/g, (m, u) => urls.add(u.replace(/&amp;/g, '&')));
  html.replace(/url\(&quot;(https?:[^&]+)&quot;\)/g, (m, u) => urls.add(u));
  for (const u of urls) {
    try { const rel = await local(u); html = html.split(u).join('__ASSET__' + rel).split(u.replace(/&/g, '&amp;')).join('__ASSET__' + rel); } catch (e) { console.log('  skipped', u, e.message); }
  }
  html = html.replace(/<html([^>]*)>/, '<html$1 data-captured="' + new Date().toISOString().slice(0, 10) + '">');

  // ---------------------------------------------------------------- 2. the admin's own design data
  const all = bundles.join('\n');
  const icons = {};
  for (const name of ICONS) {
    const m = all.match(new RegExp(`"/src/assets/icons/${name}\\.svg":([A-Za-z_$][\\w$]*)`));
    if (!m) { console.log('  icon not found:', name); continue; }
    const v = m[1].replace(/\$/g, '\\$');
    const d = all.match(new RegExp(`[,;\\s]${v}=\`(<svg[\\s\\S]*?</svg>)\\s*\``));
    if (d) icons[name] = d[1].replace(/\s*\n\s*/g, ' ').trim(); else console.log('  icon body not found:', name);
  }
  const theme = (all.match(/var e=(\{white:`#fff`,black:`#000`,primary:`[^}]+\})/) || [])[1];
  const colors = theme ? Object.fromEntries([...theme.matchAll(/"?([\w-]+)"?:`(#[0-9a-fA-F]{3,8})`/g)].map((m) => [m[1], m[2]])) : {};
  const titleFormat = (all.match(/`(%s - makeshop byGMO)`/) || [])[1] || '%s - makeshop byGMO';
  if (!Object.keys(colors).length) console.log('  theme colours not found (the bundle changed)');
  // the admin's horizontal logo (type A — the stacked type C is the one on the login page): its chunk names the SVG file
  let logoA = null;
  const chunk = (all.match(/assets\/ms-logo-typeA-[\w-]+\.js/) || [])[0];
  if (chunk) {
    const js = (await get('https://console.makeshop.jp/' + chunk)).buf.toString('utf8');
    const svg = (js.match(/\/assets\/ms-logo-typeA-[\w-]+\.svg/) || [])[0];
    if (svg) logoA = (await get('https://console.makeshop.jp' + svg)).buf;
  }
  if (!logoA) console.log('  logo type A not found (the bundle changed) — the previous file is kept');
  await browser.close();

  // ---------------------------------------------------------------- write into both videos
  const today = new Date().toISOString().slice(0, 10);
  for (const id of VIDEOS) {
    const dir = path.join(ROOT, 'public', 'videos', id);
    fs.rmSync(path.join(dir, ASSET_DIR, 'login'), { recursive: true, force: true });
    for (const { rel, buf } of files.values()) { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), buf); }
    if (logoA) fs.writeFileSync(path.join(dir, ASSET_DIR, 'ms-logo-typeA.svg'), logoA);
    fs.writeFileSync(path.join(dir, 'js', 'makeshop-login.js'),
      `/* The real makeshop byGMO login page (${LOGIN}), captured ${today} by tools/snapshots/tabisuruwagashi/capture-makeshop.js — generated, do not edit.\n` +
      `   __ASSET__ marks a local copy (assets/makeshop/login/…); js/makeshop-login-frame.js shows it. */\n` +
      `window.MAKESHOP_LOGIN = ${JSON.stringify({ url: LOGIN, title: snap.title, capturedAt: today, viewport: VIEW, html })};\n`);
    fs.writeFileSync(path.join(dir, 'js', 'makeshop-ui.js'),
      `/* From the public JavaScript of the makeshop byGMO shop admin (console.makeshop.jp/assets/*.js), captured ${today} by\n` +
      `   tools/snapshots/tabisuruwagashi/capture-makeshop.js — generated, do not edit.\n` +
      `   icons: the admin's own icon set (/src/assets/icons/*.svg)   colors: its theme (nextEcTheme)   titleFormat: its page titles */\n` +
      `window.MAKESHOP_UI = ${JSON.stringify({ capturedAt: today, titleFormat, colors, icons }, null, 1)};\n`);
    console.log(`${id}: js/makeshop-login.js (${(html.length / 1024).toFixed(0)} KB), js/makeshop-ui.js (${Object.keys(icons).length} icons, ${Object.keys(colors).length} colours), ${files.size} assets`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
