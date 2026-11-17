// Re-captures https://ne-auberge.jp/ and regenerates public/videos/ne-auberge/js/site-snapshot.js + assets/.
// Run it after the live site changes, so the demo keeps matching it.
//
//   npm run snapshot -- ne-auberge   (in the project folder; images are converted to WebP afterwards)
//
// Needs Node.js 18+ (built-in fetch). No other dependencies.
//
// What is kept as-is:   the HTML the server ships (Astro output: markup, classes, data-astro-cid-*, inline
//                       <style>/<script>, JSON-LD), the two /_astro/*.css stylesheets (saved byte-for-byte),
//                       robots.txt, llms.txt, /admin/config.yml (Sveltia CMS) and every photo / logo.
// What is changed:      - asset paths (/photos/, /logos/, /_astro/) point at the local copies in assets/
//                       - the Google Tag Manager snippet is removed (so recording the demo never sends hits
//                         to the real GA4 properties / Meta Pixel); its container ID is kept for the GTM scene
//                       - Cloudflare's e-mail obfuscation is decoded the way its script does it in a browser
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://ne-auberge.jp';
const ROOT = path.resolve(__dirname, '../../../public/videos/ne-auberge'); // the video's folder
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

async function get(url, binary) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.text();
}
const meta = (html, re) => { const m = html.match(re); return m ? m[1].replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&') : ''; };
const titleOf = (h) => meta(h, /<title>([^<]*)<\/title>/);
const descOf = (h) => meta(h, /<meta name="description" content="([^"]*)"/);

function cfDecode(hex) {
  const key = parseInt(hex.substr(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ key);
  return decodeURIComponent(escape(out));
}

(async () => {
  let html = await get(ORIGIN + '/');

  // 1) stylesheets -> assets/_astro/
  const cssDir = path.join(ROOT, 'assets', '_astro');
  fs.mkdirSync(cssDir, { recursive: true });
  const css = {};
  for (const m of html.matchAll(/<link rel="stylesheet" href="\/_astro\/([^"]+\.css)">/g)) {
    const text = await get(ORIGIN + '/_astro/' + m[1]);
    fs.writeFileSync(path.join(cssDir, m[1]), text);
    css[m[1]] = text;
    console.log('css', m[1], text.length);
  }

  // 2) GTM snippet out (container ID kept)
  const gtmId = meta(html, /'dataLayer','(GTM-[A-Z0-9]+)'/);
  html = html.replace(/<script>\(function\(w,d,s,l,i\)\{[\s\S]*?<\/script>/, '');
  html = html.replace(/<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html[\s\S]*?<\/noscript>/, '');

  // 3) Cloudflare e-mail protection -> what the browser shows after email-decode.min.js ran
  html = html.replace(/<a href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/g, (_, hex) => `<a href="mailto:${cfDecode(hex)}"`);
  html = html.replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/span>/g, (_, hex) => cfDecode(hex));
  html = html.replace(/<script data-cfasync="false" src="\/cdn-cgi\/[^"]+"><\/script>/, '');

  // 4) photos / logos -> assets/
  const files = new Set();
  for (const m of html.matchAll(/\/(photos|logos)\/[A-Za-z0-9_.\-]+\.(?:avif|webp|jpe?g|png|svg)/g)) files.add(m[0]);
  for (const dir of ['photos', 'logos']) fs.mkdirSync(path.join(ROOT, 'assets', dir), { recursive: true });
  for (const f of files) {
    const dest = path.join(ROOT, 'assets', f);
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, await get(ORIGIN + f, true));
  }
  console.log('assets', files.size);
  const source = html; // the page as served (root-relative paths, original image files): what view-source / the validator show
  html = html.replace(/(["(;\s,]|&#34;)\/(photos|logos|_astro)\//g, '$1assets/$2/');

  // 5) text files shown in the code editor, CMS config, the EN page + page titles (CMS entry list)
  const robots = await get(ORIGIN + '/robots.txt');
  const llms = await get(ORIGIN + '/llms.txt');
  const cmsConfig = await get(ORIGIN + '/admin/config.yml');
  const cmsIndex = await get(ORIGIN + '/admin/');
  const en = await get(ORIGIN + '/en/');
  const pages = [];
  for (const slug of ['', 'cuisine', 'stay', 'architecture', 'story', 'access', 'reserve']) {
    const ja = slug ? await get(`${ORIGIN}/${slug}/`) : await get(ORIGIN + '/');
    const e = slug ? await get(`${ORIGIN}/en/${slug}/`) : en;
    pages.push({ slug: slug || 'home', ja: { title: titleOf(ja), description: descOf(ja) }, en: { title: titleOf(e), description: descOf(e) } });
    console.log('page', slug || 'home');
  }
  const jsonld = meta(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

  const snapshot = { url: ORIGIN + '/', gtmId, html, css, robots, llms, cmsConfig, cmsIndex, pages, jsonld, capturedAt: new Date().toISOString() };
  fs.mkdirSync(path.join(ROOT, 'js'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'js', 'site-snapshot.js'),
    '/* Auto-generated by tools/update-snapshot.js from https://ne-auberge.jp/ — do not edit by hand */\n' +
    'window.SITE_SNAPSHOT = ' + JSON.stringify(snapshot) + ';\n');
  fs.writeFileSync(path.join(ROOT, 'js', 'site-source.js'),
    '/* The top page of https://ne-auberge.jp/ exactly as the server ships it (root-relative paths, original image files), for the\n' +
    '   page source the video shows (view-source, the validator). Written by tools/snapshots/ne-auberge/update-snapshot.js — do not edit */\n' +
    'window.SITE_SOURCE = ' + JSON.stringify(source) + ';\n');
  console.log('done: js/site-snapshot.js', html.length, 'chars of HTML, gtm', gtmId);
})().catch((e) => { console.error(e); process.exit(1); });
