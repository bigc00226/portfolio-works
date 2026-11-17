// Captures the real login page of KANADEMONO's customer accounts (new customer accounts, hosted by Shopify) for the
// 「動作テスト」 scene: https://shopify.com/25419644990/account → shopify.com/authentication/25419644990/login (ja-JP).
//
//   node tools/snapshots/kanademono-business/capture-account.js
//
// Nothing is submitted (no e-mail, no login): only the public page is read.
// What is captured: the page as Chrome shows it after its scripts ran (DOM incl. the <shop-login> button's shadow root,
// as declarative shadow DOM), its two stylesheets inlined byte-for-byte, the GT Standard web fonts it loads (saved to
// assets/account/fonts/). Scripts, preloads and the hidden shop.app iframe are removed, and so are the one-time
// OAuth values of <shop-login> (state, code challenge, …).
// Writes public/videos/kanademono-business/js/account-snapshot.js (window.ACCOUNT_SNAPSHOT).
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '../../../public/videos/kanademono-business'); // the video's folder
const URL_ = 'https://shopify.com/25419644990/account';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

const get = async (u, binary) => {
  for (let k = 0; k < 4; k++) {
    const r = await fetch(u, { headers: { 'user-agent': UA } });
    if (r.ok) return binary ? Buffer.from(await r.arrayBuffer()) : r.text();
    if (r.status !== 429 && r.status < 500) throw new Error(`${r.status} ${u}`);
    await new Promise((res) => setTimeout(res, 1500 * (k + 1)));
  }
  throw new Error('failed ' + u);
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--lang=ja-JP'] });
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' });
  await page.setViewport({ width: 1920, height: 947 }); // the browser's page area in the video
  await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 1500));
  const got = await page.evaluate(() => {
    const roots = [];
    const walk = (root) => root.querySelectorAll('*').forEach((el) => { if (el.shadowRoot) { roots.push(el.shadowRoot); walk(el.shadowRoot); } });
    walk(document);
    // the page's CSS-in-JS adds rules through the CSSOM (insertRule / adopted sheets), which the markup does not show:
    // write every <style>'s live rules into it, and the adopted sheets as <style> elements
    const rulesOf = (sheet) => { try { return [...sheet.cssRules].map((r) => r.cssText).join('\n'); } catch (e) { return null; } };
    for (const root of [document, ...roots]) {
      root.querySelectorAll('style').forEach((s) => { const t = s.sheet && rulesOf(s.sheet); if (t != null && t.length > s.textContent.length * 0.5) s.textContent = t; });
      (root.adoptedStyleSheets || []).forEach((sh) => {
        const st = document.createElement('style');
        st.setAttribute('data-adopted', '');
        st.textContent = rulesOf(sh) || '';
        (root === document ? document.head : root).appendChild(st);
      });
    }
    // form state lives in properties: write it into the attributes
    for (const root of [document, ...roots]) {
      root.querySelectorAll('input').forEach((i) => { if (i.type === 'checkbox' || i.type === 'radio') i.toggleAttribute('checked', i.checked); });
    }
    return {
      url: location.href,
      title: document.title,
      favicon: (document.querySelector('link[rel~="icon"]') || {}).href || null,
      sheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href),
      html: document.documentElement.getHTML({ serializableShadowRoots: true, shadowRoots: roots }),
      htmlAttrs: [...document.documentElement.attributes].map((a) => [a.name, a.value]),
    };
  });
  // the page's own focus looks (the video shows them without moving the keyboard focus into the frame):
  // on load the Shop button has the focus (autofocus) — its ring; clicking the e-mail field moves the focus there
  got.focus = await page.evaluate(async () => {
    const props = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'box-shadow', 'outline-color', 'outline-style', 'outline-width', 'outline-offset', 'background-color', 'color'];
    const chain = (el, n) => { const out = []; for (let e = el; e && out.length < n; e = e.parentElement || (e.getRootNode() !== document ? e.getRootNode().host : null)) out.push(e); return out; };
    const snap = (els) => els.map((e) => Object.fromEntries(props.map((p) => [p, getComputedStyle(e).getPropertyValue(p)])));
    const email = document.getElementById('customer-authentication-web-email');
    const shopBtn = document.querySelector('shop-login').shadowRoot.querySelector('button');
    const E = chain(email, 6), B = chain(shopBtn, 2);
    const a = { e: snap(E), b: snap(B) };
    email.focus();
    await new Promise((r) => setTimeout(r, 400));
    const z = { e: snap(E), b: snap(B) };
    const diff = (from, to) => from.map((o, i) => Object.fromEntries(Object.entries(to[i]).filter(([k, v]) => o[k] !== v)));
    return { email: diff(a.e, z.e), shopButton: diff(z.b, a.b) };
  });
  await browser.close();
  console.log('focus looks:', JSON.stringify(got.focus));

  let html = got.html;
  // inline the stylesheets (byte-for-byte) in place of their <link>
  for (const href of got.sheets) {
    const css = await get(href);
    const esc = href.replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<link[^>]*href="${esc}"[^>]*>`, 'g');
    if (!re.test(html)) { console.warn('stylesheet link not found:', href); continue; }
    html = html.replace(re, '').replace('</head>', `<style data-src="${href}">${css.replace(/<\/style/gi, '<\\/style')}</style></head>`);
  }
  // remove scripts, preloads, noscript, iframes
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
    .replace(/<link[^>]+rel="(?:modulepreload|preload|prefetch|preconnect|dns-prefetch)"[^>]*>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/<link[^>]+rel="(?:shortcut )?icon"[^>]*>/gi, '');
  // the one-time OAuth values of the Shop button
  html = html.replace(/(<shop-login\b)([^>]*)>/, (m, a, attrs) => a + attrs.replace(/\s(state|code-challenge|code-challenge-method|ctx|client-id|data-instance-id|redirect-uri)="[^"]*"/g, '') + '>');
  // web fonts → local copies
  const fontDir = path.join(ROOT, 'assets', 'account', 'fonts');
  fs.mkdirSync(fontDir, { recursive: true });
  const fonts = [...new Set([...html.matchAll(/url\(\s*['"]?(https:[^'")]+\.woff2)['"]?\s*\)/g)].map((m) => m[1]))];
  for (const u of fonts) {
    const name = path.basename(new URL(u).pathname);
    fs.writeFileSync(path.join(fontDir, name), await get(u, true));
    html = html.split(u).join(`assets/account/fonts/${name}`);
    console.log('font', name);
  }
  const rest = [...new Set([...html.matchAll(/url\(\s*['"]?(https?:[^'")]+)['"]?\s*\)/g)].map((m) => m[1]))];
  if (rest.length) console.log('remote url() left in the page (not needed offline?):', rest);
  // (getHTML of <html> = its inner HTML: <head>…</head><body>…</body>)
  const body = html.match(/<head[^>]*>([\s\S]*)<\/head>\s*<body([^>]*)>([\s\S]*)<\/body>/);
  if (!body) throw new Error('unexpected page structure');
  const out = {
    url: got.url.replace(/([?&])(analytics_trace_id|state|nonce)=[^&]*/g, '$1$2=…'),
    capturedAt: new Date().toISOString().slice(0, 10),
    title: got.title,
    htmlAttrs: got.htmlAttrs,
    // style changes while focused: [element, its parent, …] from the e-mail <input> / from the Shop <button>
    focus: got.focus,
    head: body[1],
    bodyAttrs: body[2],
    body: body[3],
  };
  const file = path.join(ROOT, 'js', 'account-snapshot.js');
  fs.writeFileSync(file, `/* The real login page of KANADEMONO's customer accounts (${URL_}), captured ${out.capturedAt} by tools/snapshots/kanademono-business/capture-account.js — generated, do not edit */\nwindow.ACCOUNT_SNAPSHOT = ${JSON.stringify(out)};\n`);
  console.log('title:', got.title, '\nwrote', path.relative(process.cwd(), file), (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
