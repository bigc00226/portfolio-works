/*
 * Captures the REAL wp-admin screens the notahotel video shows, from WordPress itself (WordPress Playground,
 * https://playground.wordpress.net — WordPress in the browser, no account), and writes
 *   public/videos/notahotel/js/wp-snapshot.js   (window.WP_SNAPSHOT: each screen's HTML + its stylesheets)
 *   public/videos/notahotel/assets/wp/           (images / fonts the screens use; converted to WebP afterwards)
 *
 *   node tools/snapshots/notahotel/capture-wp-admin.js   → node tools/webp.js notahotel   → node tools/snapshots/notahotel/prune-wp-assets.js
 *
 * The site is set up like the video's wp-env: WordPress (latest) in Japanese, site title NOT A HOTEL, the bundled
 * themes Twenty Twenty-Five / Four / Three, Advanced Custom Fields and WordPress Importer from wordpress.org, and the
 * theme "notahotel" written from the files the video types (js/theme.js) — at first without the post type labels,
 * as on screen before they are typed. The houses, the media (the live site's card images) and the field group are
 * the video's. Each screen is captured after WordPress' own scripts ran: scripts are dropped, stylesheets kept
 * byte-for-byte (by content hash, shared between screens), images resolved to the file the browser showed.
 * Changed for the demo: the Playground address → http://localhost:8888 (wp-env), the capture date → the video's date,
 * the Playground admin menu entry removed, text inputs the video types into become look-alike boxes (with the
 * input's computed style, focused and unfocused) so the typing can be drawn, and nothing else.
 * Needs Node 22.18+, Google Chrome, network.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos/notahotel');
const ASSETS = 'assets/wp';
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sharp = require(path.join(ROOT, 'node_modules/sharp'));
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LOCAL = 'http://localhost:8888';
const VIEW = { snap: { width: 960, height: 947 }, max: { width: 1920, height: 947 } }; // the video's Chrome content area
const VIDEO_DATE = { y: 2026, m: 10, d: 27 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);

/* ------------------------------------------------------------------ 1. what the video needs */
async function videoData(browser) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  await p.goto(pathToFileURL(path.join(DIR, 'index.html')).href + '?embed=1&captions=0');
  await p.waitForFunction('window.__demoReady || window.__demoError', { timeout: 300000 });
  const d = await p.evaluate(() => {
    const TF = window.ThemeFiles, WD = window.WPData;
    const start = document.getElementById('taskbar').dataset.start;
    return {
      // front-page.php when the PHP error shows: as typed on screen, the line after $houses = … without its ";"
      files: TF.files, labelsLine: TF.LABELS_LINE, fields: TF.FIELDS, start,
      front: TF.files['wp-content/themes/notahotel/front-page.php'].replace(TF.QUERY[0], TF.QUERY[0].replace(/;$/, '')),
      houses: WD.H.map((h) => ({ name: h.name, place: h.place, price: h.price, href: h.href, img: h.img, file: h.file, type: h.type, concept: h.concept || '' })),
    };
  });
  await p.close();
  if (d.front === d.files['wp-content/themes/notahotel/front-page.php']) throw new Error('front-page.php: the query line was not found');
  // the house is published about 40 s into the content chapter (generated/timeline.json)
  const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'generated/timeline.json'), 'utf8')).notahotel;
  d.pubT = tl.starts[4] + 40000;
  return d;
}

/** the theme's screenshot.png: the live site's first view (the video's own capture of notahotel.com) at 1200×900 */
async function themeScreenshot(browser) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 1080 });
  await p.goto(pathToFileURL(path.join(__dirname, 'test/render.html')).href + '?mode=live&view=pc&w=1200&h=900');
  await p.waitForFunction('window.__ready', { timeout: 120000 });
  await wait(3500);
  const el = await p.$('#f');
  const png = await el.screenshot({ type: 'png' });
  await p.close();
  return sharp(png).png({ palette: true, quality: 90, effort: 10 }).toBuffer();
}

/* ------------------------------------------------------------------ 2. Playground */
const MU_PLUGIN = `<?php
/* demo capture helper (only in the throw-away Playground of the capture): runs PHP sent by the capture script */
add_action( 'rest_api_init', function () {
\tregister_rest_route( 'demo/v1', '/php', [ 'methods' => 'POST', 'permission_callback' => fn() => current_user_can( 'manage_options' ),
\t\t'callback' => function ( $req ) { $data = $req->get_json_params()['data'] ?? null; return eval( $req->get_json_params()['code'] ); } ] );
} );
/* the Playground admin menu entry is not part of WordPress */
add_action( 'admin_menu', function () { foreach ( $GLOBALS['menu'] as $k => $m ) if ( stripos( $m[2] ?? '', 'playground' ) !== false ) unset( $GLOBALS['menu'][ $k ] ); }, 999 );
`;

/** the theme "notahotel" as on screen before the post type labels are typed */
function themeFiles(d) {
  // index.php is in the tree on screen but never opened: the usual classic-theme fallback template
  const all = { ...d.files };
  all['wp-content/themes/notahotel/index.php'] ??= ['<?php', 'get_header();', 'while ( have_posts() ) {', '\tthe_post();', '\tthe_content();', '}', 'get_footer();', ''].join('\n');
  return Object.entries(all).filter(([k]) => k.startsWith('wp-content/themes/notahotel/')).map(([k, v]) => {
    if (k.endsWith('inc/post-types.php')) v = v.replace(d.labelsLine + '\n', ''); // as on screen before the labels are typed
    // acf_add_options_page() is ACF PRO; the free ACF from wordpress.org has no options pages
    if (k.endsWith('inc/acf.php')) v = v.replace("\tacf_add_options_page(", "\tif ( function_exists( 'acf_add_options_page' ) ) acf_add_options_page(");
    return [k, v];
  });
}
function blueprint() {
  return {
    landingPage: '/wp-admin/themes.php',
    preferredVersions: { php: '8.3', wp: 'latest' },
    features: { networking: true },
    steps: [
      { step: 'login', username: 'admin' },
      { step: 'setSiteLanguage', language: 'ja' },
      { step: 'defineWpConfigConsts', consts: { WP_DEBUG: true, WP_DEBUG_DISPLAY: true, SCRIPT_DEBUG: true } },
      { step: 'setSiteOptions', options: { blogname: 'NOT A HOTEL', blogdescription: '', timezone_string: 'Asia/Tokyo', permalink_structure: '/%postname%/' } },
      ...['twentytwentyfive', 'twentytwentyfour', 'twentytwentythree'].map((slug) => ({ step: 'installTheme', themeData: { resource: 'wordpress.org/themes', slug }, options: { activate: slug === 'twentytwentyfive' }, ifAlreadyInstalled: 'overwrite' })),
      { step: 'installPlugin', pluginData: { resource: 'wordpress.org/plugins', slug: 'advanced-custom-fields' }, options: { activate: true } },
      { step: 'installPlugin', pluginData: { resource: 'wordpress.org/plugins', slug: 'wordpress-importer' }, options: { activate: true } },
      { step: 'mkdir', path: '/wordpress/wp-content/mu-plugins' },
      { step: 'writeFile', path: '/wordpress/wp-content/mu-plugins/demo-capture.php', data: MU_PLUGIN },
    ],
  };
}

async function boot(browser, bp) {
  const p = await browser.newPage();
  await p.setViewport(VIEW.snap);
  p.on('pageerror', (e) => log('pageerror', e.message.slice(0, 160)));
  await p.goto('https://playground.wordpress.net/?mode=seamless#' + encodeURIComponent(JSON.stringify(bp)), { waitUntil: 'domcontentloaded' });
  let wp = null;
  for (let i = 0; i < 300 && !wp; i++) {
    await wait(1000);
    for (const f of p.frames()) {
      try { if (/\/scope:[^/]+\/wp-admin\//.test(f.url()) && await f.evaluate(() => document.readyState === 'complete' && !!document.getElementById('wpadminbar'))) wp = f; } catch (e) { /* navigating */ }
    }
  }
  if (!wp) {
    await p.screenshot({ path: path.join(process.env.WP_SHOTS || ROOT, 'wp-boot-failed.jpg'), type: 'jpeg', quality: 70 }).catch(() => {});
    throw new Error('Playground did not boot: ' + p.frames().map((f) => f.url().slice(0, 100)).join(' | '));
  }
  const origin = wp.url().match(/^(https:\/\/[^/]+\/scope:[^/]+)/)[1];
  return { page: p, wp, origin };
}

/** the WordPress frame (it is replaced when the Playground reloads it) */
function wpFrame(ctx) {
  return ctx.page.frames().find((f) => f.url().startsWith(ctx.origin + '/') && !/wordpress-bridge/.test(f.url())) || ctx.wp;
}
async function go(ctx, rel, ready = '#wpadminbar') {
  await wpFrame(ctx).evaluate((u) => { setTimeout(() => { location.href = u; }, 0); }, ctx.origin + rel).catch(() => null);
  for (let i = 0; i < 120; i++) {
    await wait(500);
    const g = wpFrame(ctx);
    try { if (await g.evaluate((r, sel) => location.pathname === r && document.readyState === "complete" && !!document.querySelector(sel), new URL(ctx.origin + rel).pathname, ready)) { ctx.wp = g; await wait(800); return g; } } catch (e) { /* navigating */ }
  }
  const g = wpFrame(ctx);
  const info = await g.evaluate(() => ({ url: location.href, title: document.title, text: (document.body && document.body.innerText || '').slice(0, 400) })).catch((e) => ({ err: e.message }));
  await ctx.page.screenshot({ path: path.join(process.env.WP_SHOTS || ROOT, 'wp-go-failed.jpg'), type: 'jpeg', quality: 70 }).catch(() => {});
  throw new Error('page did not load: ' + rel + ' — now at ' + JSON.stringify(info));
}
/** runs PHP in WordPress (REST route of the capture helper); $data is the second argument */
async function php(ctx, code, data = null) {
  let r = null;
  for (let i = 0; i < 8 && !r; i++) {
    r = await wpFrame(ctx).evaluate(async (origin, code, data) => {
    const nonce = await (await fetch(origin + '/wp-admin/admin-ajax.php?action=rest-nonce')).text();
    const res = await fetch(origin + '/index.php?rest_route=/demo/v1/php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce }, body: JSON.stringify({ code, data }) });
    return { status: res.status, body: await res.text() };
  }, ctx.origin, code, data).catch(async (e) => { if (!/context was destroyed|detached|Target closed/i.test(e.message)) throw e; await wait(1500); return null; });
  }
  if (!r) throw new Error('PHP: the WordPress frame kept reloading');
  if (r.status !== 200) throw new Error(`PHP failed (${r.status}): ${r.body.slice(0, 400)}`);
  return JSON.parse(r.body);
}

/* ------------------------------------------------------------------ 3. capture one screen */
/** runs in the WordPress frame: the document (and same-origin iframes inside) as HTML + stylesheets + asset URLs */
async function serializeInPage(opts) {
  for (let i = 0; i < 50 && (document.readyState !== 'complete' || !document.documentElement); i++) await new Promise((r) => setTimeout(r, 200));
  const sha = async (t) => [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const sheets = {};
  const assets = new Set();
  const abs = (u, base) => { try { return new URL(u, base).href; } catch (e) { return u; } };
  const STYLE_PROPS = ['box-sizing', 'display', 'width', 'height', 'min-height', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style', 'border-top-color', 'border-right-color', 'border-bottom-color',
    'border-left-color', 'border-radius', 'background-color', 'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
    'box-shadow', 'outline-style', 'outline-width', 'outline-color', 'outline-offset', 'vertical-align', 'max-width', 'flex', 'text-align'];
  const boxStyle = (el) => { const cs = getComputedStyle(el); return STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'); };

  async function doc2html(doc, depth) {
    const live = doc.documentElement;
    // inputs the video types into → look-alike boxes (style taken from the live input, unfocused and focused)
    const conv = [];
    for (const [sel, key] of opts.inputs || []) {
      const inp = doc.querySelector(sel);
      if (!inp) continue;
      const off = boxStyle(inp);
      inp.focus();
      await new Promise((r) => setTimeout(r, 60));
      const on = boxStyle(inp);
      inp.blur();
      const r = inp.getBoundingClientRect();
      conv.push({ inp, key, off, on, h: r.height });
    }
    const all = [...live.querySelectorAll('*')];
    const clone = live.cloneNode(true);
    const call = [...clone.querySelectorAll('*')];
    const twin = new Map(all.map((e, i) => [e, call[i]]));
    // form state
    all.forEach((e) => {
      const c = twin.get(e);
      if (e.tagName === 'INPUT') { if (e.type === 'checkbox' || e.type === 'radio') { if (e.checked) c.setAttribute('checked', ''); else c.removeAttribute('checked'); } else c.setAttribute('value', e.value); }
      else if (e.tagName === 'TEXTAREA') c.textContent = e.value;
      else if (e.tagName === 'SELECT') [...e.options].forEach((o, i) => { if (o.selected) c.options[i].setAttribute('selected', ''); else c.options[i].removeAttribute('selected'); });
    });
    for (const { inp, key, off, on, h } of conv) {
      const c = twin.get(inp);
      const d = doc.createElement('div');
      for (const a of inp.attributes) if (!['type', 'value', 'name', 'autocomplete', 'placeholder'].includes(a.name)) d.setAttribute(a.name, a.value);
      d.setAttribute('data-demo-input', key);
      d.setAttribute('data-demo-focus', `${on};line-height:${h - 2 - parseFloat(getComputedStyle(inp).paddingTop) - parseFloat(getComputedStyle(inp).paddingBottom)}px`);
      d.setAttribute('style', `${off};line-height:${h - 2 - parseFloat(getComputedStyle(inp).paddingTop) - parseFloat(getComputedStyle(inp).paddingBottom)}px;white-space:pre;overflow:hidden;text-overflow:clip;cursor:text`);
      if (inp.value) d.textContent = inp.value;
      c.replaceWith(d);
    }
    // stylesheets, in document order → placeholders
    for (const e of all) {
      const isLink = e.tagName === 'LINK' && /stylesheet/i.test(e.rel);
      if (!isLink && e.tagName !== 'STYLE') continue;
      const c = twin.get(e);
      if (!c || !c.parentNode) continue;
      let text = '', base = doc.baseURI;
      if (isLink) {
        base = e.href;
        try { text = await (await fetch(e.href)).text(); } catch (er) { text = ''; }
      } else {
        try { text = e.sheet && e.sheet.cssRules.length && !e.textContent.trim() ? [...e.sheet.cssRules].map((r) => r.cssText).join('\n') : e.textContent; } catch (er) { text = e.textContent; }
      }
      if (!text.trim()) { c.remove(); continue; }
      const key = await sha(base + '\n' + text);
      sheets[key] = { base, text };
      const ph = doc.createElement('link');
      ph.setAttribute('data-demo-css', key);
      if (e.media && e.media !== 'all') ph.setAttribute('media', e.media);
      if (e.disabled) ph.setAttribute('data-demo-disabled', '');
      c.replaceWith(ph);
    }
    clone.querySelectorAll('script, noscript, link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="preload"], link[rel="prefetch"], link[rel="modulepreload"], link[rel="https://api.w.org/"], link[rel="EditURI"], link[rel="alternate"]').forEach((n) => n.remove());
    // images: the file the browser chose
    all.forEach((e) => {
      const c = twin.get(e);
      if (!c) return;
      if (e.tagName === 'IMG' && e.currentSrc) { c.setAttribute('src', e.currentSrc); c.removeAttribute('srcset'); c.removeAttribute('sizes'); c.removeAttribute('loading'); assets.add(e.currentSrc); }
      if (e.tagName === 'SOURCE') c.remove();
      const st = e.getAttribute && e.getAttribute('style');
      if (st && /url\(/.test(st)) c.setAttribute('style', st.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => { if (/^data:/.test(u)) return m; const a = abs(u, doc.baseURI); assets.add(a); return `url("${a}")`; }));
    });
    // iframes inside (the block editor canvas): their own document
    const frames = {};
    let n = 0;
    for (const e of all) {
      if (e.tagName !== 'IFRAME') continue;
      const c = twin.get(e);
      let sub = null;
      try { sub = e.contentDocument; } catch (er) { sub = null; }
      if (!sub || !sub.documentElement || depth > 2) { c.remove(); continue; }
      const name = e.name || `f${n++}`;
      frames[name] = await doc2html(sub, depth + 1);
      c.removeAttribute('src');
      c.removeAttribute('srcdoc');
      c.setAttribute('data-demo-frame', name);
    }
    return { html: '<!DOCTYPE html>\n' + clone.outerHTML, frames, url: doc.URL, title: doc.title };
  }
  const out = await doc2html(document, 0);
  return { ...out, sheets, assets: [...assets] };
}

async function capture(ctx, key, o = {}) {
  // no blinking caret / transitions caught half-way
  await wpFrame(ctx).evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); }).catch(() => null);
  await wait(o.settle || 600);
  let r = null;
  for (let i = 0; i < 5 && !r; i++) {
    r = await wpFrame(ctx).evaluate(serializeInPage, { inputs: o.inputs || [] }).catch(async (e) => { if (i === 4) throw e; log('  retry (' + e.message.slice(0, 80) + ')'); await wait(2000); return null; });
  }
  const vp = ctx.page.viewport();
  SNAP.pages[key] = { title: r.title, url: r.url, w: vp.width, h: vp.height, html: r.html, frames: r.frames };
  for (const [k, s] of Object.entries(r.sheets)) SHEETS[k] = s;
  r.assets.forEach((a) => ASSET_URLS.add(a));
  const frames = (fr) => Object.values(fr || {}).reduce((s, x) => s + x.html.length + frames(x.frames), 0);
  log(`captured ${key} (${vp.width}×${vp.height}) "${r.title}" — html ${((r.html.length + frames(r.frames)) / 1024).toFixed(0)} KB`);
  if (o.shot) await ctx.page.screenshot({ path: o.shot, type: 'jpeg', quality: 70 });
}

const SNAP = { pages: {}, css: {} };
const SHEETS = {};
const ASSET_URLS = new Set();

/* ------------------------------------------------------------------ 4. the screens */
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 900000, args: ['--lang=ja-JP', '--hide-scrollbars'] });
  const shotDir = process.env.WP_SHOTS || null;
  const shot = (k) => (shotDir ? path.join(shotDir, `wp-${k}.jpg`) : null);
  log('reading the video (theme files, houses, front-page.php at the error) …');
  const d = await videoData(browser);
  const png = await themeScreenshot(browser);
  log(`theme screenshot ${(png.length / 1024).toFixed(0)} KB, ${d.houses.length} houses`);

  log('booting WordPress Playground …');
  const ctx = await boot(browser, blueprint());
  log('booted', ctx.origin);
  // the theme (written after boot: the blueprint travels in the address)
  await php(ctx, "foreach ( $data as $k => $v ) { wp_mkdir_p( dirname( ABSPATH . $k ) ); file_put_contents( ABSPATH . $k, $v ); } return count( $data );", Object.fromEntries(themeFiles(d)));
  await php(ctx, "file_put_contents( WP_CONTENT_DIR . '/themes/notahotel/screenshot.png', base64_decode( $data ) ); return true;", png.toString('base64'));
  const info = await php(ctx, "global $wp_version; return [ 'wp' => $wp_version, 'acf' => defined('ACF_VERSION') ? ACF_VERSION : null, 'theme' => get_stylesheet() ];");
  log('versions', info);
  SNAP.wp = info.wp; SNAP.acf = info.acf;

  // the block editor's welcome guide was dismissed long ago on a working site
  await php(ctx, "update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core/edit-post' => [ 'welcomeGuide' => false ], 'core' => [ 'isComplementaryAreaVisible' => true ], '_modified' => gmdate( 'c' ) ] ); return true;");

  // ---- 外観 > テーマ: before / after activating NOT A HOTEL (the post type still without labels)
  await go(ctx, '/wp-admin/themes.php', '.theme-browser .theme');
  await capture(ctx, 'themes-before', { shot: shot('themes-before') });
  const actHref = await wpFrame(ctx).evaluate(() => document.querySelector('.theme[data-slug="notahotel"] a.activate').getAttribute('href'));
  await go(ctx, '/wp-admin/' + actHref.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), '#wpadminbar').catch(() => null);
  await go(ctx, '/wp-admin/themes.php?activated=true', '.theme-browser .theme');
  await capture(ctx, 'themes-activated', { shot: shot('themes-activated') });
  // the labels typed on screen → reload
  await php(ctx, "file_put_contents( get_theme_file_path( 'inc/post-types.php' ), $data ); return true;", d.files['wp-content/themes/notahotel/inc/post-types.php']);
  await go(ctx, '/wp-admin/themes.php', '.theme-browser .theme');
  await capture(ctx, 'themes-cpt', { shot: shot('themes-cpt') });

  // ---- the PHP parse error on the front page (front-page.php as on screen, WP_DEBUG on)
  await php(ctx, "file_put_contents( get_theme_file_path( 'front-page.php' ), $data ); update_option( 'show_on_front', 'posts' ); return true;", d.front);
  await go(ctx, '/', 'body');
  await capture(ctx, 'php-error', { shot: shot('php-error') });
  await php(ctx, "file_put_contents( get_theme_file_path( 'front-page.php' ), $data ); return true;", d.files['wp-content/themes/notahotel/front-page.php']);

  // ---- content: the field group (from the theme's acf-json), media (the card images), the 7 imported houses
  const groupId = await php(ctx, "$g = json_decode( file_get_contents( get_theme_file_path( 'acf-json/group_house.json' ) ), true ); $g = acf_import_field_group( $g ); return $g['ID'];");
  log('field group', groupId);
  const media = {};
  for (const h of [...d.houses].reverse()) {
    const local = path.join(DIR, h.img);
    const ext = path.extname(h.file).toLowerCase();
    const buf = ext === '.png' ? await sharp(local).png({ compressionLevel: 9 }).toBuffer() : await sharp(local).jpeg({ quality: 88 }).toBuffer();
    media[h.file] = await php(ctx, `require_once ABSPATH . 'wp-admin/includes/image.php'; require_once ABSPATH . 'wp-admin/includes/file.php'; require_once ABSPATH . 'wp-admin/includes/media.php';
      $tmp = wp_tempnam( $data['name'] ); file_put_contents( $tmp, base64_decode( $data['b64'] ) );
      $id = media_handle_sideload( [ 'name' => $data['name'], 'tmp_name' => $tmp ], 0, pathinfo( $data['name'], PATHINFO_FILENAME ) );
      if ( is_wp_error( $id ) ) return $id->get_error_message(); return $id;`, { name: h.file, b64: buf.toString('base64') });
  }
  log('media', media);
  // the site icon (the live site's icon; the editor's top-left button shows it)
  try {
    const ico = Buffer.from(await (await fetch('https://notahotel.com/assets/images/favicon/android-icon-192x192.png')).arrayBuffer());
    const icoPng = await sharp(ico).resize(512, 512).png().toBuffer();
    const iconId = await php(ctx, `require_once ABSPATH . 'wp-admin/includes/image.php'; require_once ABSPATH . 'wp-admin/includes/file.php'; require_once ABSPATH . 'wp-admin/includes/media.php';
      $tmp = wp_tempnam( 'site-icon.png' ); file_put_contents( $tmp, base64_decode( $data ) );
      $id = media_handle_sideload( [ 'name' => 'site-icon.png', 'tmp_name' => $tmp ], 0, 'site-icon' ); update_option( 'site_icon', $id ); return $id;`, icoPng.toString('base64'));
    log('site icon', iconId);
  } catch (e) { log('site icon not set:', e.message); }
  const old = d.houses.slice(1);
  const dates = old.map((h, i) => `2026-${String(4 + Math.floor(i * 0.9)).padStart(2, '0')}-${String(10 + i * 2).padStart(2, '0')} 11:0${i}:00`);
  await php(ctx, `foreach ( $data as $h ) { $id = wp_insert_post( [ 'post_type' => 'house', 'post_status' => 'publish', 'post_title' => $h['name'], 'post_date' => $h['date'], 'menu_order' => $h['order'] ] );
      foreach ( [ 'place', 'short_concept', 'sales_type', 'price_label', 'detail_path' ] as $k ) update_field( $k, $h[ $k ], $id ); update_field( 'is_new', false, $id ); if ( $h['thumb'] ) set_post_thumbnail( $id, $h['thumb'] ); } return true;`,
    old.map((h, i) => ({ name: h.name, date: dates[i], order: i + 1, place: h.place, short_concept: h.concept, sales_type: h.type, price_label: h.type === 'on_sale' ? h.price : '', detail_path: h.href, thumb: media[h.file] || 0 })));

  await go(ctx, '/wp-admin/edit.php?post_type=house', '.wp-list-table');
  await capture(ctx, 'list-960', { shot: shot('list-960') });
  await ctx.page.setViewport(VIEW.max);
  await go(ctx, '/wp-admin/edit.php?post_type=house', '.wp-list-table');
  await capture(ctx, 'list-1920', { shot: shot('list-1920') });

  // ---- the edit screen: ONSEN SUITE. The post type supports no 'editor', so WordPress shows the classic edit screen
  const NEW = d.houses[0];
  await go(ctx, '/wp-admin/post-new.php?post_type=house', '#title');
  await wait(1500);
  const INPUTS = [['#title', 'title'], ['#acf-field_house_place', 'place'], ['#acf-field_house_concept', 'short_concept'], ['#acf-field_house_price', 'price_label'], ['#acf-field_house_path', 'detail_path']];
  await capture(ctx, 'editor-empty', { inputs: INPUTS, settle: 800, shot: shot('editor-empty') });
  // type what the video types (in the real screen)
  const typeIn = async (sel, text) => { const el = await wpFrame(ctx).$(sel); await el.click({ clickCount: 3 }); await el.type(text, { delay: 5 }); };
  await typeIn('#title', NEW.name);
  await typeIn('#acf-field_house_place', NEW.place);
  await typeIn('#acf-field_house_concept', NEW.concept);
  await typeIn('#acf-field_house_price', NEW.price);
  await (await wpFrame(ctx).$('#acf-field_house_new')).click();
  await typeIn('#acf-field_house_path', NEW.href);
  await wait(800);
  // featured image → the media modal
  await (await wpFrame(ctx).$('#set-post-thumbnail')).click();
  await wpFrame(ctx).waitForSelector('.media-modal', { timeout: 30000 });
  await wait(3000);
  // the library tab (WordPress opens the upload tab while the library query is still empty)
  await wpFrame(ctx).evaluate(() => { const t = [...document.querySelectorAll('.media-modal .media-router .media-menu-item')].find((b) => /ライブラリ/.test(b.textContent)); if (t) t.click(); });
  const ajax = await wpFrame(ctx).evaluate(async () => {
    const fd = new FormData(); fd.append('action', 'query-attachments'); fd.append('query[post_mime_type]', 'image'); fd.append('query[posts_per_page]', '80'); fd.append('post_id', document.getElementById('post_ID').value);
    const r = await fetch(window.ajaxurl, { method: 'POST', body: fd, credentials: 'same-origin' }); return r.status + ' ' + (await r.text()).slice(0, 300);
  });
  log('query-attachments:', ajax);
  await wpFrame(ctx).waitForSelector('.media-modal .attachments .attachment', { timeout: 60000 }).catch(async (e) => {
    await ctx.page.screenshot({ path: path.join(process.env.WP_SHOTS || ROOT, 'wp-media-failed.jpg'), type: 'jpeg', quality: 70 });
    const html = await wpFrame(ctx).evaluate(() => { const m = document.querySelector('.media-modal'); return m ? m.innerText.slice(0, 600) : 'no modal'; });
    throw new Error('media modal: ' + html);
  });
  await wait(2500);
  await capture(ctx, 'editor-media', { settle: 800, shot: shot('editor-media') });
  await wpFrame(ctx).evaluate((id) => document.querySelector(`.media-modal .attachment[data-id="${id}"]`).click(), media[NEW.file]);
  await wait(1500);
  await capture(ctx, 'editor-media-selected', { settle: 600, shot: shot('editor-media-selected') });
  await wpFrame(ctx).evaluate(() => document.querySelector('.media-modal .media-button-select').click());
  await wpFrame(ctx).waitForSelector('#postimagediv img', { timeout: 30000 });
  await wait(1500);
  await capture(ctx, 'editor-thumb', { settle: 600, shot: shot('editor-thumb') });
  // 公開 → the screen reloads as post.php with the notice
  await wpFrame(ctx).evaluate(() => { setTimeout(() => document.querySelector('#publish').click(), 0); }).catch(() => null);
  await wait(1500);
  for (let i = 0; i < 120; i++) { await wait(500); try { if (await wpFrame(ctx).evaluate(() => location.pathname.endsWith('/post.php') && document.readyState === 'complete' && !!document.querySelector('#message'))) break; } catch (e) { /* reloading */ } }
  await wait(1200);
  await capture(ctx, 'editor-published', { settle: 300, shot: shot('editor-published') });
  SNAP.newPostId = await wpFrame(ctx).evaluate(() => +new URLSearchParams(location.search).get('post'));

  // ---- ACF: the field group — first in the maximized window, then snapped to the right half
  await go(ctx, `/wp-admin/post.php?post=${groupId}&action=edit`, '.acf-field-list, #acf-field-group-fields');
  await wait(1500);
  await capture(ctx, 'acf-group-1920', { shot: shot('acf-group-1920') });
  await ctx.page.setViewport(VIEW.snap);
  await go(ctx, `/wp-admin/post.php?post=${groupId}&action=edit`, '.acf-field-list, #acf-field-group-fields');
  await wait(1500);
  await capture(ctx, 'acf-group', { shot: shot('acf-group') });

  /* ------------------------------------------------------------------ 5. localize + write */
  const origin = ctx.origin;
  const localOf = new Map();
  const now = new Date();
  const localPath = (u) => {
    if (localOf.has(u)) return localOf.get(u);
    const url = new URL(u);
    let p = url.origin + url.pathname === origin ? '' : (u.startsWith(origin) ? url.pathname.replace(/^\/scope:[^/]+/, '') : `/remote/${url.host}${url.pathname}`);
    p = p.replace(/\/+$/, '/index').replace(/[^\w./@-]/g, '_');
    // uploads are filed by month: the capture's month → the video's (the pages say the same, see fix())
    p = p.replace(`/uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/`, `/uploads/${VIDEO_DATE.y}/${String(VIDEO_DATE.m).padStart(2, '0')}/`);
    if (!/\.[a-z0-9]{2,5}$/i.test(p)) p += '.bin';
    if (url.search && [...localOf.values()].includes(`${ASSETS}${p}`)) p = p.replace(/(\.[a-z0-9]+)$/i, `_${crypto.createHash('sha1').update(url.search).digest('hex').slice(0, 6)}$1`);
    const lp = `${ASSETS}${p}`;
    localOf.set(u, lp);
    return lp;
  };
  // css: the files url(...) points at (rewritten to the local copies once they are downloaded)
  const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  for (const s of Object.values(SHEETS)) {
    for (const m of s.text.matchAll(CSS_URL)) if (!/^(data:|#|about:)/.test(m[2])) { const a = new URL(m[2], s.base).href; ASSET_URLS.add(a); localPath(a); }
  }
  // download
  fs.rmSync(path.join(DIR, ASSETS), { recursive: true, force: true });
  let ok = 0, bad = [];
  const sameOrigin = [...ASSET_URLS].filter((u) => u.startsWith(origin));
  const remote = [...ASSET_URLS].filter((u) => !u.startsWith(origin) && /^https?:/.test(u));
  const save = (u, buf) => {
    // a missing file answers with WordPress' HTML 404 page: not an asset
    if (/^\s*<(!doctype html|html)/i.test(buf.subarray(0, 40).toString('latin1'))) { bad.push(`404 ${u}`); localOf.delete(u); return; }
    let lp = localPath(u);
    // no extension in the address (gravatar): name the file after its content
    if (lp.endsWith('.bin')) {
      const h = buf.subarray(0, 12);
      const ext = h[0] === 0xff && h[1] === 0xd8 ? 'jpg' : h.toString('hex', 0, 4) === '89504e47' ? 'png' : h.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : h.toString('ascii', 0, 3) === 'GIF' ? 'gif' : 'bin';
      lp = lp.replace(/\.bin$/, '.' + ext);
      localOf.set(u, lp);
    }
    const f = path.join(DIR, lp); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); ok++;
  };
  for (let i = 0; i < sameOrigin.length; i += 20) {
    const batch = sameOrigin.slice(i, i + 20);
    const res = await wpFrame(ctx).evaluate(async (urls) => Promise.all(urls.map(async (u) => {
      try { const r = await fetch(u); if (!r.ok) return [u, null, r.status]; const b = new Uint8Array(await r.arrayBuffer()); let s = ''; for (let j = 0; j < b.length; j += 0x8000) s += String.fromCharCode(...b.subarray(j, j + 0x8000)); return [u, btoa(s), 200]; } catch (e) { return [u, null, String(e)]; }
    })), batch);
    for (const [u, b64, st] of res) { if (b64 != null) save(u, Buffer.from(b64, 'base64')); else bad.push(`${st} ${u}`); }
  }
  for (const u of remote) {
    try { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); save(u, Buffer.from(await r.arrayBuffer())); } catch (e) { bad.push(`${e.message} ${u}`); }
  }
  // SVGs in stylesheets go in as data: URIs — ACF draws its icons as CSS masks, and a mask image is not loaded from file://
  const svgData = (lp) => { const f = path.join(DIR, lp); return /\.svg$/i.test(lp) && fs.existsSync(f) ? `data:image/svg+xml;base64,${fs.readFileSync(f).toString('base64')}` : null; };
  for (const [k, s] of Object.entries(SHEETS)) {
    SNAP.css[k] = s.text.replace(CSS_URL, (m, q, u) => {
      if (/^(data:|#|about:)/.test(u)) return m;
      const lp = localPath(new URL(u, s.base).href);
      return `url("${svgData(lp) || lp}")`;
    });
  }
  log(`assets: ${ok} saved${bad.length ? `, ${bad.length} failed:\n  ` + bad.join('\n  ') : ''}`);
  await browser.close();

  // html: asset URLs → local; the Playground address → wp-env's; the capture date → the video's
  const [vh, vm] = d.start.split('T')[1].split(':').map(Number);
  const pubMin = vh * 60 + vm + Math.floor(d.pubT / 60000);
  const hh = Math.floor(pubMin / 60), mm = pubMin % 60;
  const ampm = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
  const hhmm = `${hh}:${String(mm).padStart(2, '0')}`;
  const fix = (html) => {
    let h = html;
    for (const [u, lp] of [...localOf].sort((a, b) => b[0].length - a[0].length)) h = h.split(u).join(lp).split(u.replace(/&/g, '&amp;')).join(lp);
    h = h.split('/wordpress/wp-content/').join('/var/www/html/wp-content/'); // wp-env serves WordPress from /var/www/html
    // ACF builds a class name from its link's HTML (the address, slugged)
    const slug = (u) => u.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
    h = h.split(slug(origin)).join(slug(LOCAL));
    h = h.split(origin).join(LOCAL).split(origin.replace(/^https:/, 'http:')).join(LOCAL).split(new URL(origin).pathname).join('');
    h = h.replace(/ data-playground-[a-z-]+="[^"]*"/g, ''); // set by the Playground, not by WordPress
    const y = now.getFullYear(), mo = now.getMonth() + 1, da = now.getDate();
    // the capture's date (and time of day) → the video's: the house is published at the video's clock
    h = h.replace(new RegExp(`${y}年${mo}月${da}日(\\s*)(\\d{1,2}:\\d{2}(\\s*(AM|PM|午前|午後))?)?`, 'g'), (m, sp, t, ap) => `${VIDEO_DATE.y}年${VIDEO_DATE.m}月${VIDEO_DATE.d}日${sp || ''}${t ? (ap ? ampm : hhmm) : ''}`)
      .replace(new RegExp(`${y}/${String(mo).padStart(2, '0')}/${String(da).padStart(2, '0')}`, 'g'), `${VIDEO_DATE.y}/${String(VIDEO_DATE.m).padStart(2, '0')}/${VIDEO_DATE.d}`)
      .replace(new RegExp(`/uploads/${y}/${String(mo).padStart(2, '0')}/`, 'g'), `/uploads/${VIDEO_DATE.y}/${String(VIDEO_DATE.m).padStart(2, '0')}/`);
    return h;
  };
  const fixPage = (p) => ({ ...p, html: fix(p.html), url: fix(p.url), frames: Object.fromEntries(Object.entries(p.frames || {}).map(([k, f]) => [k, fixPage(f)])) });
  for (const k of Object.keys(SNAP.pages)) SNAP.pages[k] = fixPage(SNAP.pages[k]);
  // a file the localizer renamed by query must keep its own name in the CSS too
  const out = {
    capturedAt: now.toISOString().slice(0, 10), source: 'WordPress Playground (playground.wordpress.net)', wp: SNAP.wp, acf: SNAP.acf,
    ids: { group: groupId, media, post: SNAP.newPostId }, css: SNAP.css, pages: SNAP.pages,
  };
  const file = path.join(DIR, 'js', 'wp-snapshot.js');
  fs.writeFileSync(file, '/* real wp-admin screens (tools/snapshots/notahotel/capture-wp-admin.js) — generated, do not edit */\nwindow.WP_SNAPSHOT = ' + JSON.stringify(out) + ';\n');
  log('wrote', path.relative(ROOT, file), (fs.statSync(file).size / 1048576).toFixed(2) + ' MB', '— now: node tools/webp.js notahotel');
})().catch((e) => { console.error(e); process.exit(1); });
