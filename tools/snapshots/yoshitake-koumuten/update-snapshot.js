// Re-captures the published STUDIO site and regenerates public/videos/yoshitake-koumuten/js/site-snapshot.js + assets/img/.
// Use this after changing the site in STUDIO, so the demo keeps matching it.
//
//   npm run snapshot -- yoshitake-koumuten [https://yoshitake-koumuten.studio.site/]   (in the project folder; images are converted to WebP afterwards)
//
// Chrome is located at the default Windows path; set CHROME_PATH to override.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const URL_ = process.argv[2] || 'https://yoshitake-koumuten.studio.site/';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join(__dirname, '.capture');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(URL_, { waitUntil: 'networkidle0', timeout: 90000 });

  // scroll through the page so every "appear" element and lazy image settles in its final state
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total + 800; y += 300) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 150));
  }
  await new Promise((r) => setTimeout(r, 2500));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 800));

  const html = await page.content();
  fs.writeFileSync(path.join(OUT, 'rendered.html'), html);

  // STUDIO's own stylesheets (/_nuxt/*.css), in document order
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((l) => l.href)
      .filter((h) => /\/_nuxt\/.+\.css/.test(h)));
  const cssFiles = [];
  for (const [i, href] of hrefs.entries()) {
    const css = await page.evaluate(async (h) => (await fetch(h)).text(), href);
    const file = path.join(OUT, `style-${i}.css`);
    fs.writeFileSync(file, css);
    cssFiles.push(file);
    console.log('css', href);
  }
  await browser.close();

  execFileSync(process.execPath, [path.join(__dirname, 'build-snapshot.js'), path.join(OUT, 'rendered.html'), ...cssFiles], { stdio: 'inherit' });
  console.log('done: js/site-snapshot.js updated');
})().catch((e) => { console.error(e); process.exit(1); });
