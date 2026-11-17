/*
 * Downloads the real favicons shown in the browser tabs of the videos into public/shared/favicons/, and the logos the
 * services show in their own screens into public/shared/logos/.
 *   npm run favicons
 * Each one is the file the service's own page declares (<link rel="icon">) — checked 2026-11-17. The stores' own
 * favicons come with their snapshots (npm run snapshot), not from here.
 *
 *   default.png   Chrome's icon for a page without a favicon (IDR_DEFAULT_FAVICON, chromium/src ui/resources —
 *                 BSD licence): dev servers, the PDF viewer, a self-made monitor page
 *   shopify.png   Shopify admin, theme editor, Theme Store (themes.shopify.com declares this file)
 *   makeshop.ico  makeshop byGMO shop admin (console.makeshop.jp)
 *   studio.svg    STUDIO editor (app.studio.design)
 *   github.svg    github.com
 *   gmail.ico     Gmail inbox
 *   ga.svg / gtm.svg / ta.svg   Google Analytics / Tag Manager / Tag Assistant
 *   sveltia.svg   Sveltia CMS (/admin of the Né site: with no logo in its config, Sveltia CMS uses its own logo as the favicon —
 *                 taken from the published bundle, MIT licence)
 *   wordpress.png wp-admin / wp-login.php of a WordPress site without a site icon (WordPress' own w-logo-blue-white-bg.png)
 *   schema.ico    Schema Markup Validator (validator.schema.org → schema.org/docs/favicon.ico)
 * They are kept in their own formats (they are drawn at 16 px, as Chrome draws them).
 *
 * logos/: shopify.svg (shopify.com header), makeshop.svg (console.makeshop.jp login), studio.svg (app.studio.design login)
 */
const fs = require('fs');
const path = require('path');
const { PUBLIC } = require('./lib');

const CHROMIUM = 'https://chromium.googlesource.com/chromium/src/+/refs/heads/main/';
const SOURCES = {
  'default.png': { url: CHROMIUM + 'ui/resources/default_100_percent/common/default_favicon.png?format=TEXT', base64: true },
  'default@2x.png': { url: CHROMIUM + 'ui/resources/default_200_percent/common/default_favicon.png?format=TEXT', base64: true },
  'shopify.png': { url: 'https://cdn.shopify.com/static/shopify-favicon.png' },
  'makeshop.ico': { url: 'https://console.makeshop.jp/favicon.ico' },
  'studio.svg': { url: 'https://app.studio.design/favicon.svg' },
  'github.svg': { url: 'https://github.githubassets.com/favicons/favicon.svg' },
  'gmail.ico': { url: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
  'ga.svg': { url: 'https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg' },
  'gtm.svg': { url: 'https://www.gstatic.com/analytics-suite/header/suite/v2/ic_tag_manager.svg' },
  'ta.svg': { url: 'https://tagassistant.google.com/images/tag-assistant-logo.svg' },
  'schema.ico': { url: 'https://schema.org/docs/favicon.ico' },
  // wp-admin / wp-login.php of a site without a site icon (WordPress core: wp-includes/images, GPL)
  'wordpress.png': { url: 'https://raw.githubusercontent.com/WordPress/wordpress-develop/trunk/src/wp-includes/images/w-logo-blue-white-bg.png' },
  'sveltia.svg': {
    url: 'https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js',
    // the bundle builds its default logo as data:image/svg+xml;base64,${btoa(`<svg …>`)}
    extract: (js) => {
      const start = js.indexOf('<svg viewBox="0 0 800 800"', js.indexOf('data:image/svg+xml;base64,${btoa(`'));
      return start < 0 ? '' : js.slice(start, js.indexOf('</svg>', start) + 6) + '\n';
    },
  },
};
const LOGOS = {
  'shopify.svg': { url: 'https://cdn.shopify.com/b/shopify-brochure2-assets/d9340911ca8c679b148dd4a205ad2ffa.svg' },
  'makeshop.svg': { url: 'https://console.makeshop.jp/assets/ms-logo-typeC-DPo78kJ5.svg' },
  'studio.svg': { url: 'https://app.studio.design/assets/brand_logo_s-jKJxmZet.svg' },
};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

(async () => {
  let bad = 0;
  for (const [dir, file, s] of [...Object.entries(SOURCES).map(([f, x]) => ['favicons', f, x]), ...Object.entries(LOGOS).map(([f, x]) => ['logos', f, x])]) {
    try {
      const r = await fetch(s.url, { headers: { 'user-agent': UA } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      let buf = Buffer.from(await r.arrayBuffer());
      if (s.base64) buf = Buffer.from(buf.toString('ascii'), 'base64');
      if (s.extract) buf = Buffer.from(s.extract(buf.toString('utf8')));
      if (!buf.length) throw new Error('empty');
      fs.mkdirSync(path.join(PUBLIC, 'shared', dir), { recursive: true });
      fs.writeFileSync(path.join(PUBLIC, 'shared', dir, file), buf);
      console.log(`${(dir + '/' + file).padEnd(24)} ${String(buf.length).padStart(6)} bytes  ${s.url.replace('?format=TEXT', '')}`);
    } catch (e) { bad++; console.log(`${(dir + '/' + file).padEnd(24)} FAILED (${e.message}) — kept the previous file`); }
  }
  process.exit(bad ? 1 : 0);
})();
