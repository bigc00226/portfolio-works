/*
 * Real WordPress screens for the videos, captured from WordPress itself — WordPress Playground
 * (https://playground.wordpress.net: real WordPress + PHP in the browser, no account, nothing to install).
 *
 * A video's capture script (tools/snapshots/<id>/capture-wp.js) uses it like this:
 *
 *   const WPC = require('../../wp/playground');
 *   const cap = await WPC.start({ id: 'my-video', site: 'https://example.com', date: '2026-11-04', time: '10:20' });
 *   await cap.boot(WPC.blueprint({ title: 'サイト名', plugins: ['contact-form-7'], themes: ['twentytwentyfive'] }));
 *   await cap.php("update_option('blogdescription', $data); return true;", 'キャッチフレーズ');   // any PHP, $data = 2nd arg
 *   await cap.go('/wp-admin/plugins.php', '.wp-list-table');                                   // open a screen, wait for a selector
 *   await cap.capture('plugins');                                                               // → WP_SNAPSHOT.pages.plugins
 *   await cap.capture('cf7-edit', { inputs: [['#wpcf7-mail-subject', 'subject']] });           // text boxes the video types into
 *   await cap.view('max');                                                                       // 'max' 1920 wide | 'snap' 960 (half screen)
 *   await cap.finish();   // downloads the assets, writes public/videos/<id>/js/wp-snapshot.js + assets/wp/, closes Chrome
 *   // then: node tools/webp.js <id>
 *
 * What is kept and what is changed (the same rules for every video — say so in docs/videos/<id>.md):
 *   kept      each screen's HTML after WordPress' own scripts ran, its stylesheets byte-for-byte (shared between screens
 *             by content hash), the images / fonts / icons it uses, the real titles and texts (Japanese WordPress)
 *   removed   scripts, the Playground's own admin menu entry and data attributes
 *   changed   the Playground address → `site` (the dev or production address the video shows), the capture date →
 *             the video's date (the time of day → the video's clock), text boxes listed in `inputs` → look-alike boxes
 *             with the input's own computed style (focused / unfocused) so the video can draw the typing
 * The screens are shown by public/shared/wordpress/wp-frame.js (WP.show(key) …).
 * Needs Node 22.18+, Google Chrome and network access.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/** the video's Chrome content area: a maximized window, or the window snapped to one half of the screen */
const VIEWS = { max: { width: 1920, height: 947 }, snap: { width: 960, height: 947 } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);

/** a capture-only helper plugin: runs PHP sent by the capture script (REST), hides the Playground's own menu entry */
const MU_PLUGIN = `<?php
add_action( 'rest_api_init', function () {
\tregister_rest_route( 'demo/v1', '/php', [ 'methods' => 'POST', 'permission_callback' => fn() => current_user_can( 'manage_options' ),
\t\t'callback' => function ( $req ) { $data = $req->get_json_params()['data'] ?? null; return eval( $req->get_json_params()['code'] ); } ] );
} );
add_action( 'admin_menu', function () { foreach ( $GLOBALS['menu'] as $k => $m ) if ( stripos( $m[2] ?? '', 'playground' ) !== false ) unset( $GLOBALS['menu'][ $k ] ); }, 999 );
/* the Playground's "username: admin / password: password" box on the login screen is not part of WordPress */
add_action( 'login_init', function () { remove_all_filters( 'login_message' ); }, 999 );
add_filter( 'login_message', fn( $m ) => stripos( $m, 'password' ) !== false && stripos( $m, 'admin' ) !== false ? '' : $m, 9999 );
/* the dashboard's "WordPress イベントとニュース" box picks events by the capturing machine's location: closed unless the user opened it */
add_filter( 'get_user_option_closedpostboxes_dashboard', fn( $v ) => is_array( $v ) ? $v : [ 'dashboard_primary' ] );
`;

/**
 * a Playground blueprint: Japanese WordPress (latest), logged in as admin, Tokyo time, pretty permalinks
 *   title, tagline   blogname / blogdescription
 *   themes           wordpress.org theme slugs (the first one is activated unless `activate` names another)
 *   plugins          wordpress.org plugin slugs (activated), or { slug, activate: false }
 *   options          more site options;  consts: wp-config constants;  steps: more blueprint steps
 */
function blueprint(o = {}) {
  const themes = o.themes || [];
  const active = o.activate || themes[0];
  const plugin = (p) => (typeof p === 'string' ? { slug: p, activate: true } : { activate: true, ...p });
  return {
    landingPage: o.landing || '/wp-admin/',
    preferredVersions: { php: o.php || '8.3', wp: o.wp || 'latest' },
    features: { networking: true },
    steps: [
      { step: 'login', username: 'admin' },
      { step: 'setSiteLanguage', language: o.lang || 'ja' },
      { step: 'defineWpConfigConsts', consts: { WP_DEBUG: false, ...(o.consts || {}) } },
      { step: 'setSiteOptions', options: { blogname: o.title || 'サイト', blogdescription: o.tagline || '', timezone_string: 'Asia/Tokyo', permalink_structure: '/%postname%/', date_format: 'Y年n月j日', time_format: 'H:i', ...(o.options || {}) } },
      ...themes.map((slug) => ({ step: 'installTheme', themeData: { resource: 'wordpress.org/themes', slug }, options: { activate: slug === active }, ifAlreadyInstalled: 'overwrite' })),
      ...(o.plugins || []).map(plugin).map((p) => ({ step: 'installPlugin', pluginData: { resource: 'wordpress.org/plugins', slug: p.slug }, options: { activate: p.activate } })),
      { step: 'mkdir', path: '/wordpress/wp-content/mu-plugins' },
      { step: 'writeFile', path: '/wordpress/wp-content/mu-plugins/demo-capture.php', data: MU_PLUGIN },
      ...(o.steps || []),
    ],
  };
}

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
  /** a plugin's stylesheet that @imports another one relative to itself (WP Statistics: "plugin/tooltipster.bundle.css"):
   *  the imported sheet is put in its place (its url()s made absolute); Google Fonts stay @imports (absolute) */
  async function inlineImports(text, base, depth) {
    let out = text;
    for (const m of [...text.matchAll(/@import\s+(?:url\(\s*(['"]?)(.*?)\1\s*\)|(['"])(.*?)\3)\s*([^;]*);/g)]) {
      const a = abs(m[2] || m[4], base);
      if (depth > 2 || /fonts\.googleapis\.com/.test(a)) { out = out.replace(m[0], m[0].replace(m[2] || m[4], a)); continue; }
      try {
        const r = await fetch(a);
        let t = r.ok ? await r.text() : '';
        if (!t || /^\s*</.test(t)) continue;
        t = (await inlineImports(t, a, depth + 1)).replace(/url\((['"]?)(.*?)\1\)/g, (all, q, u) => (/^(data:|#)/.test(u) ? all : `url(${q}${abs(u, a)}${q})`));
        out = out.replace(m[0], () => (m[5].trim() ? `@media ${m[5].trim()}{${t}}` : t));
      } catch (er) { /* leave the @import */ }
    }
    return out;
  }

  async function doc2html(doc, depth) {
    const live = doc.documentElement;
    // inputs the video types into → look-alike boxes (style taken from the live input, unfocused and focused)
    const conv = [];
    for (const [sel, key] of depth === 0 ? opts.inputs || [] : []) {
      const inp = doc.querySelector(sel);
      if (!inp) { console.warn('input not found: ' + sel); continue; }
      const off = boxStyle(inp);
      inp.focus();
      await new Promise((r) => setTimeout(r, 60));
      const on = boxStyle(inp);
      inp.blur();
      const r = inp.getBoundingClientRect();
      const cs = getComputedStyle(inp);
      const multi = inp.tagName === 'TEXTAREA';
      conv.push({ inp, key, off, on, lh: multi ? cs.lineHeight : `${r.height - 2 - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)}px`, multi });
    }
    const all = [...live.querySelectorAll('*')];
    const clone = live.cloneNode(true);
    const call = [...clone.querySelectorAll('*')];
    const twin = new Map(all.map((e, i) => [e, call[i]]));
    // form state
    all.forEach((e) => {
      const c = twin.get(e);
      if (e.tagName === 'INPUT') { if (e.type === 'checkbox' || e.type === 'radio') { if (e.checked) c.setAttribute('checked', ''); else c.removeAttribute('checked'); } else if (e.type !== 'password') c.setAttribute('value', e.value); }
      else if (e.tagName === 'TEXTAREA') c.textContent = e.value;
      else if (e.tagName === 'SELECT') [...e.options].forEach((o, i) => { if (o.selected) c.options[i].setAttribute('selected', ''); else c.options[i].removeAttribute('selected'); });
    });
    for (const { inp, key, off, on, lh, multi } of conv) {
      const c = twin.get(inp);
      const d = doc.createElement('div');
      for (const a of inp.attributes) if (!['type', 'value', 'name', 'autocomplete', 'placeholder', 'rows', 'cols'].includes(a.name)) d.setAttribute(a.name, a.value);
      d.setAttribute('data-demo-input', key);
      if (inp.placeholder) d.setAttribute('data-demo-placeholder', inp.placeholder);
      d.setAttribute('data-demo-focus', `${on};line-height:${lh}`);
      d.setAttribute('style', `${off};line-height:${lh};white-space:${multi ? 'pre-wrap' : 'pre'};overflow:hidden;text-overflow:clip;cursor:text`);
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
        try { text = await inlineImports(await (await fetch(e.href)).text(), e.href, 0); } catch (er) { text = ''; }
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
      if (e.tagName === 'IMG' && e.currentSrc) { c.setAttribute('src', e.currentSrc); c.removeAttribute('srcset'); c.removeAttribute('sizes'); c.removeAttribute('loading'); if (!/^data:/.test(e.currentSrc)) assets.add(e.currentSrc); }
      if (e.tagName === 'SOURCE') c.remove();
      const st = e.getAttribute && e.getAttribute('style');
      if (st && /url\(/.test(st)) c.setAttribute('style', st.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => { if (/^data:/.test(u)) return m; const a = abs(u, doc.baseURI); assets.add(a); return `url("${a}")`; }));
    });
    // modal dialogs (CF7's tag generator …) are re-opened as modal by wp-frame.js; scrolled boxes (CodeMirror, lists) keep
    // their scroll position
    all.forEach((e) => {
      const c = twin.get(e);
      if (!c) return;
      if (e.tagName === 'DIALOG' && e.open && e.matches(':modal')) c.setAttribute('data-demo-modal', '');
      if ((e.scrollTop || e.scrollLeft) && e !== live && e !== doc.body) c.setAttribute('data-demo-scroll', `${Math.round(e.scrollLeft)},${Math.round(e.scrollTop)}`);
    });
    // iframes inside (the block editor canvas, previews): their own document
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
    // where the window was scrolled to (the screen is shown at the same position)
    return { html: '<!DOCTYPE html>\n' + clone.outerHTML, frames, url: doc.URL, title: doc.title, scroll: [doc.defaultView.scrollX, doc.defaultView.scrollY] };
  }
  const out = await doc2html(document, 0);
  return { ...out, sheets, assets: [...assets] };
}

/**
 * starts a capture for a video
 *   id     the video folder (public/videos/<id>)
 *   site   the address the screens show instead of the Playground's (e.g. http://localhost:8888, https://example.com)
 *   date   'YYYY-MM-DD' the video's date (the capture's date in the screens becomes this)
 *   time   'HH:MM' the time of day the screens show for "now" (e.g. a post published / a log line), default 10:00
 *   assets folder inside the video for the downloaded files (default assets/wp)
 *   shots  folder for a screenshot of every captured screen (to compare with the video), default none
 */
async function start(o) {
  const DIR = path.join(process.env.VIDEO_ROOT ? path.resolve(process.env.VIDEO_ROOT) : path.join(ROOT, 'public/videos'), o.id);
  if (!fs.existsSync(DIR)) throw new Error('no video folder: ' + DIR);
  const ASSETS = o.assets || 'assets/wp';
  const LOCAL = String(o.site || 'http://localhost:8888').replace(/\/$/, '');
  const [Y, M, Dd] = String(o.date).split('-').map(Number);
  const [hh, mm] = String(o.time || '10:00').split(':').map(Number);
  const SNAP = { pages: {}, css: {} };
  const SHEETS = {};
  const ASSET_URLS = new Set();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 900000, args: ['--lang=ja-JP', '--hide-scrollbars'] });
  const ctx = { page: null, wp: null, origin: null };
  const wpFrame = () => ctx.page.frames().find((f) => f.url().startsWith(ctx.origin + '/') && !/wordpress-bridge/.test(f.url())) || ctx.wp;
  const shot = (k) => (o.shots ? path.join(o.shots, `wp-${o.id}-${k}.jpg`) : null);

  const cap = {
    browser, VIEWS, dir: DIR, info: {},
    get frame() { return wpFrame(); },
    get origin() { return ctx.origin; },
    async boot(bp, view = 'max') {
      ctx.page = await browser.newPage();
      await ctx.page.setViewport(VIEWS[view] || view);
      ctx.page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 160)));
      await ctx.page.goto('https://playground.wordpress.net/?mode=seamless#' + encodeURIComponent(JSON.stringify(bp)), { waitUntil: 'domcontentloaded' });
      for (let i = 0; i < 420 && !ctx.wp; i++) {
        await wait(1000);
        for (const f of ctx.page.frames()) {
          try { if (/\/scope:[^/]+\/(wp-admin|wp-login)/.test(f.url()) && await f.evaluate(() => document.readyState === 'complete' && !!document.body)) ctx.wp = f; } catch (e) { /* navigating */ }
        }
      }
      if (!ctx.wp) {
        await ctx.page.screenshot({ path: path.join(o.shots || DIR, 'wp-boot-failed.jpg'), type: 'jpeg', quality: 70 }).catch(() => {});
        throw new Error('Playground did not boot: ' + ctx.page.frames().map((f) => f.url().slice(0, 100)).join(' | '));
      }
      ctx.origin = ctx.wp.url().match(/^(https:\/\/[^/]+\/scope:[^/]+)/)[1];
      cap.info = await cap.php("global $wp_version; $p = []; foreach ( get_plugins() as $f => $d ) if ( is_plugin_active( $f ) ) $p[ dirname( $f ) ] = $d['Version']; return [ 'wp' => $wp_version, 'php' => PHP_VERSION, 'theme' => get_stylesheet(), 'plugins' => $p ];");
      log('booted', ctx.origin, JSON.stringify(cap.info));
      return cap;
    },
    async view(v) { await ctx.page.setViewport(VIEWS[v] || v); await wait(400); },
    /**
     * opens a page of the site (path relative to the site root) and waits for `ready` (a CSS selector).
     * { redirect: true }: the link redirects (Duplicate Post's "新規下書きとして複製" → post.php …): any page other than
     * the one it starts from counts, once `ready` is there
     */
    async go(rel, ready = 'body', opt = {}) {
      const from = await wpFrame().evaluate(() => location.href).catch(() => '');
      await wpFrame().evaluate((u) => { setTimeout(() => { location.href = u; }, 0); }, ctx.origin + rel).catch(() => null);
      const want = new URL(ctx.origin + rel).pathname;
      for (let i = 0; i < 180; i++) {
        await wait(500);
        const g = wpFrame();
        try { if (await g.evaluate((r, sel, redirect, from) => (redirect ? location.href !== from : location.pathname === r) && document.readyState === 'complete' && !!document.querySelector(sel), want, ready, !!opt.redirect, from)) { ctx.wp = g; await wait(800); return g; } } catch (e) { /* navigating */ }
      }
      const info = await wpFrame().evaluate(() => ({ url: location.href, title: document.title, text: (document.body && document.body.innerText || '').slice(0, 400) })).catch((e) => ({ err: e.message }));
      await ctx.page.screenshot({ path: path.join(o.shots || DIR, 'wp-go-failed.jpg'), type: 'jpeg', quality: 70 }).catch(() => {});
      throw new Error('page did not load: ' + rel + ' — now at ' + JSON.stringify(info));
    },
    /** waits until the current page (after a click that navigates) shows `ready` */
    async settle(ready = 'body', ms = 60000) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        await wait(500);
        try { if (await wpFrame().evaluate((sel) => document.readyState === 'complete' && !!document.querySelector(sel), ready)) { ctx.wp = wpFrame(); await wait(600); return; } } catch (e) { /* navigating */ }
      }
      throw new Error('not ready: ' + ready);
    },
    /** runs PHP inside WordPress (returns its return value, JSON); `data` is $data */
    async php(code, data = null) {
      let r = null;
      for (let i = 0; i < 8 && !r; i++) {
        r = await wpFrame().evaluate(async (origin, code, data) => {
          const nonce = await (await fetch(origin + '/wp-admin/admin-ajax.php?action=rest-nonce')).text();
          const res = await fetch(origin + '/index.php?rest_route=/demo/v1/php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce }, body: JSON.stringify({ code, data }) });
          return { status: res.status, body: await res.text() };
        }, ctx.origin, code, data).catch(async (e) => { if (!/context was destroyed|detached|Target closed|Failed to fetch|NetworkError|could not connect/i.test(e.message)) throw e; await wait(1500); return null; });
        // right after boot the Playground's PHP worker can answer "could not connect" once or twice
        if (r && r.status >= 500 && /could not connect|Failed to fetch/i.test(r.body) && i < 7) { await wait(2000); r = null; }
      }
      if (!r) throw new Error('PHP: the WordPress frame kept reloading');
      if (r.status !== 200) throw new Error(`PHP failed (${r.status}): ${r.body.slice(0, 600)}`);
      return JSON.parse(r.body);
    },
    /** writes files into WordPress: { 'wp-content/themes/x/style.css': '…', … } (paths relative to the WordPress root) */
    async files(map) {
      return cap.php("foreach ( $data as $k => $v ) { wp_mkdir_p( dirname( ABSPATH . $k ) ); file_put_contents( ABSPATH . $k, $v ); } return count( $data );", map);
    },
    /** uploads a file (Buffer) into the media library; returns the attachment id */
    async media(name, buf, title) {
      return cap.php(`require_once ABSPATH . 'wp-admin/includes/image.php'; require_once ABSPATH . 'wp-admin/includes/file.php'; require_once ABSPATH . 'wp-admin/includes/media.php';
        $tmp = wp_tempnam( $data['name'] ); file_put_contents( $tmp, base64_decode( $data['b64'] ) );
        $id = media_handle_sideload( [ 'name' => $data['name'], 'tmp_name' => $tmp ], 0, $data['title'] );
        if ( is_wp_error( $id ) ) throw new Exception( $id->get_error_message() ); return $id;`, { name, b64: buf.toString('base64'), title: title || path.parse(name).name });
    },
    /** installs the translations (language packs from wordpress.org) of the installed plugins and themes, as WordPress'
     *  own updater does — so a plugin's screens are in Japanese like on a Japanese site */
    async translations() {
      const n = await cap.php(`require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php'; require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php'; require_once ABSPATH . 'wp-admin/includes/plugin.php'; require_once ABSPATH . 'wp-admin/includes/update.php';
        delete_site_transient( 'update_plugins' ); delete_site_transient( 'update_themes' ); wp_update_plugins(); wp_update_themes();
        $t = wp_get_translation_updates(); if ( ! $t ) return []; $u = new Language_Pack_Upgrader( new Automatic_Upgrader_Skin() ); $u->bulk_upgrade( $t );
        return array_map( fn( $x ) => $x->type . ':' . $x->slug . ':' . $x->language, $t );`);
      log('translations', JSON.stringify(n));
      return n;
    },
    /** logs out (to capture wp-login.php); login() signs in again through the real form (Playground: admin / password) */
    async logout() {
      await cap.php('wp_logout(); return true;').catch(() => null);
      await cap.go('/wp-login.php', '#loginform');   // (?loggedout=true would add WordPress' "ログアウトしました。" notice)
    },
    async login(user = 'admin', pass = 'password') {
      if (!(await wpFrame().$('#loginform').catch(() => null))) await cap.go('/wp-login.php', '#loginform');
      await cap.type('#user_login', user);
      await cap.type('#user_pass', pass);
      await wpFrame().evaluate(() => { setTimeout(() => document.getElementById('wp-submit').click(), 0); });
      await wait(1500);
      await cap.settle('#wpadminbar');
    },
    /** the real pointer / keyboard in the real screen (to reach a state before capturing it) */
    async click(sel) { const el = await wpFrame().$(sel); if (!el) throw new Error('no element ' + sel); await el.click(); await wait(400); },
    async type(sel, text, o2 = {}) { const el = await wpFrame().$(sel); if (!el) throw new Error('no element ' + sel); if (o2.replace !== false) await el.click({ clickCount: 3 }); await el.type(text, { delay: 4 }); await wait(200); },
    async eval(fn, ...args) { return wpFrame().evaluate(fn, ...args); },
    /** captures the screen on show as `key` (o.inputs: [[selector, key], …] text boxes the video types into) */
    async capture(key, co = {}) {
      await wpFrame().evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); }).catch(() => null);
      await wait(co.settle || 700);
      let r = null;
      for (let i = 0; i < 5 && !r; i++) {
        r = await wpFrame().evaluate(serializeInPage, { inputs: co.inputs || [] }).catch(async (e) => { if (i === 4) throw e; log('  retry (' + e.message.slice(0, 80) + ')'); await wait(2000); return null; });
      }
      const vp = ctx.page.viewport();
      SNAP.pages[key] = { title: r.title, url: r.url, w: vp.width, h: vp.height, scroll: r.scroll, html: r.html, frames: r.frames };
      for (const [k, s] of Object.entries(r.sheets)) SHEETS[k] = s;
      r.assets.forEach((a) => ASSET_URLS.add(a));
      const size = (fr) => Object.values(fr || {}).reduce((s, x) => s + x.html.length + size(x.frames), 0);
      log(`captured ${key} (${vp.width}×${vp.height}) "${r.title}" — ${((r.html.length + size(r.frames)) / 1024).toFixed(0)} KB`);
      if (shot(key)) await ctx.page.screenshot({ path: shot(key), type: 'jpeg', quality: 72 });
      return SNAP.pages[key];
    },
    /** extra data for the video (window.WP_SNAPSHOT.data) */
    data: {},

    /** downloads the assets, rewrites addresses / dates, writes js/wp-snapshot.js, closes Chrome */
    async finish() {
      const origin = ctx.origin;
      const localOf = new Map();
      const now = new Date();
      const y = now.getFullYear(), mo = now.getMonth() + 1, da = now.getDate();
      const pad = (n) => String(n).padStart(2, '0');
      const localPath = (u) => {
        if (localOf.has(u)) return localOf.get(u);
        const url = new URL(u);
        let p = u.startsWith(origin) ? url.pathname.replace(/^\/scope:[^/]+/, '') : `/remote/${url.host}${url.pathname}`;
        p = p.replace(/\/+$/, '/index').replace(/[^\w./@-]/g, '_');
        p = p.replace(`/uploads/${y}/${pad(mo)}/`, `/uploads/${Y}/${pad(M)}/`);
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
      const save = (u, buf) => {
        if (/^\s*<(!doctype html|html)/i.test(buf.subarray(0, 40).toString('latin1'))) { bad.push(`404 ${u}`); localOf.delete(u); return; }
        let lp = localPath(u);
        if (lp.endsWith('.bin')) {
          const h = buf.subarray(0, 12);
          const ext = h[0] === 0xff && h[1] === 0xd8 ? 'jpg' : h.toString('hex', 0, 4) === '89504e47' ? 'png' : h.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : h.toString('ascii', 0, 3) === 'GIF' ? 'gif' : /^\s*<svg|<\?xml/.test(buf.subarray(0, 100).toString()) ? 'svg' : 'bin';
          lp = lp.replace(/\.bin$/, '.' + ext);
          localOf.set(u, lp);
        }
        const f = path.join(DIR, lp); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); ok++;
      };
      const sameOrigin = [...ASSET_URLS].filter((u) => u.startsWith(origin));
      const remote = [...ASSET_URLS].filter((u) => !u.startsWith(origin) && /^https?:/.test(u));
      for (let i = 0; i < sameOrigin.length; i += 20) {
        const res = await wpFrame().evaluate(async (urls) => Promise.all(urls.map(async (u) => {
          try { const r = await fetch(u); if (!r.ok) return [u, null, r.status]; const b = new Uint8Array(await r.arrayBuffer()); let s = ''; for (let j = 0; j < b.length; j += 0x8000) s += String.fromCharCode(...b.subarray(j, j + 0x8000)); return [u, btoa(s), 200]; } catch (e) { return [u, null, String(e)]; }
        })), sameOrigin.slice(i, i + 20));
        for (const [u, b64, st] of res) { if (b64 != null) save(u, Buffer.from(b64, 'base64')); else bad.push(`${st} ${u}`); }
      }
      for (const u of remote) {
        try { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); save(u, Buffer.from(await r.arrayBuffer())); } catch (e) { bad.push(`${e.message} ${u}`); }
      }
      // SVGs in stylesheets go in as data: URIs (icons drawn as CSS masks are not loaded from file://)
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

      // html: asset URLs → local; the Playground address → the video's; the capture date → the video's
      const ampm = `${hh % 12 || 12}:${pad(mm)} ${hh < 12 ? 'AM' : 'PM'}`;
      const hhmm = `${hh}:${pad(mm)}`;
      const slug = (u) => u.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
      const fix = (html) => {
        let h = html;
        for (const [u, lp] of [...localOf].sort((a, b) => b[0].length - a[0].length)) h = h.split(u).join(lp).split(u.replace(/&/g, '&amp;')).join(lp);
        h = h.split(slug(origin)).join(slug(LOCAL));
        h = h.split(origin).join(LOCAL).split(origin.replace(/^https:/, 'http:')).join(LOCAL).split(encodeURIComponent(origin)).join(encodeURIComponent(LOCAL)).split(new URL(origin).pathname).join('');
        // what is left of the Playground's host: blob: URLs (the block editor's canvas), the bare origin / host in texts
        h = h.split(new URL(origin).origin).join(new URL(LOCAL).origin).split(new URL(origin).host).join(new URL(LOCAL).host);
        h = h.split('/wordpress/wp-content/').join(o.serverPath || '/home/www/wp-content/');
        h = h.replace(/ data-playground-[a-z-]+="[^"]*"/g, '');
        // the capture's date (and time of day) → the video's; "12:46 am" (some plugins write lower case) keeps its case
        h = h.replace(new RegExp(`${y}年${mo}月${da}日(\\s*)(\\d{1,2}:\\d{2}(\\s*(AM|PM|am|pm|午前|午後))?)?`, 'g'), (m0, sp, t, sp2, apm) => `${Y}年${M}月${Dd}日${sp || ''}${t ? (apm ? (/^[ap]m$/.test(apm) ? ampm.toLowerCase() : ampm) : hhmm) : ''}`)
          // times the editor computes from the capturing machine's clock: "今日 1:36 AM" → the video's clock
          .replace(/今日(\s*)\d{1,2}:\d{2}(\s*)(AM|PM|am|pm|午前|午後)?/g, (m0, sp, sp2, apm) => `今日${sp}${apm ? (/^[ap]m$/.test(apm) ? ampm.toLowerCase() : ampm) : hhmm}`)
          .replace(new RegExp(`${y}/${pad(mo)}/${pad(da)}`, 'g'), `${Y}/${pad(M)}/${pad(Dd)}`)
          .replace(new RegExp(`${y}-${pad(mo)}-${pad(da)}`, 'g'), `${Y}-${pad(M)}-${pad(Dd)}`)
          .replace(new RegExp(`/uploads/${y}/${pad(mo)}/`, 'g'), `/uploads/${Y}/${pad(M)}/`);
        return h;
      };
      const fixPage = (p) => ({ ...p, html: fix(p.html), url: fix(p.url), title: fix(p.title), frames: Object.fromEntries(Object.entries(p.frames || {}).map(([k, f]) => [k, fixPage(f)])) });
      for (const k of Object.keys(SNAP.pages)) SNAP.pages[k] = fixPage(SNAP.pages[k]);
      const data = cap.data && JSON.parse(fix(JSON.stringify(cap.data)));   // ids, urls … the capture script stored
      const out = { capturedAt: now.toISOString().slice(0, 10), source: 'WordPress Playground (playground.wordpress.net)', site: LOCAL, info: cap.info, data, css: SNAP.css, pages: SNAP.pages };
      const file = path.join(DIR, 'js', 'wp-snapshot.js');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `/* real WordPress screens (tools/wp/playground.js, captured ${out.capturedAt}) — generated, do not edit */\nwindow.WP_SNAPSHOT = ` + JSON.stringify(out) + ';\n');
      log('wrote', path.relative(ROOT, file), (fs.statSync(file).size / 1048576).toFixed(2) + ' MB', `— now: node tools/webp.js ${o.id}`);
      return out;
    },
  };
  return cap;
}

module.exports = { start, blueprint, VIEWS, log, wait };
