/*
 * Captures the real Schema Markup Validator (https://validator.schema.org/, Japanese UI) in every state the
 * ne-auberge video shows, driven with the video's own page source (the dev server's HTML, before and after the
 * JSON-LD fix), and writes public/videos/ne-auberge/js/validator-snapshot.js.
 *   node tools/snapshots/ne-auberge/capture-validator.js        (Node 22.18+, Google Chrome, internet)
 *
 * The page is captured at the size it has in the video (the right half of the screen: 960 × 948).
 * One document is kept — its stylesheets (the validator's own CSS, inlined byte-for-byte) and fonts (downloaded to
 * public/videos/ne-auberge/assets/validator/) — and each state is the <body> as the validator rendered it:
 *   dialogUrl      first visit: the "構造化データのテスト" dialog on its "URL を取得" tab
 *   dialogSnippet  the "コード スニペット" tab, empty editor
 *   dialogPasted   the page source pasted into the dialog's editor
 *   loading        after "テストを実行", while the validator is working (the request is held back for the capture)
 *   error          the result for the broken JSON-LD ({JSON.stringify(schema)} printed as text)
 *   errorOpen      the same with the error group opened (the validator's own error message)
 *   selectAll      the editor with all the code selected (Ctrl+A), before pasting the fixed source
 *   fixedPasted    the fixed source pasted into the editor
 *   loading2       after ▶ (run again)
 *   ok             the result for the fixed source
 * Scripts are removed. (The dialog is the validator's own <div> dialog with its backdrop, so it stays in the markup.)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { launch, videoDir, wait } = require('../../lib');

const DIR = videoDir('ne-auberge');
const ASSETS = path.join(DIR, 'assets', 'validator');
const OUT = path.join(DIR, 'js', 'validator-snapshot.js');
const URL0 = 'https://validator.schema.org/#snippet';
const VIEW = { width: 960, height: 948 };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

// the page source the video pastes (same as devSource() in js/scenario.js; js/site-source.js = the page as served)
const w = {};
new Function('window', fs.readFileSync(path.join(DIR, 'js', 'site-source.js'), 'utf8'))(w);
function devSource(jsonldOk) {
  let h = w.SITE_SOURCE;
  h = h.replace(/<link rel="stylesheet" href="\/_astro\/[^"]+">\n?/g, '');
  h = h.replace('<head>', '<head>\n<script type="module" src="/@vite/client"></script>');
  h = h.replace('</title>', '</title>\n<link rel="stylesheet" href="/src/styles/global.css">');
  if (!jsonldOk) h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">{JSON.stringify(schema)}</script>');
  const head = h.slice(0, h.indexOf('</head>')).replace(/><(meta|link|script|title|style)/g, '>\n<$1');
  return head + h.slice(h.indexOf('</head>'));
}

async function get(url) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ja-JP,ja;q=0.9' } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    await wait(800 * (i + 1));
  }
  throw new Error('fetch failed: ' + url);
}

/** Google Fonts CSS: keep the latin / latin-ext faces and Material Icons, with the font files stored locally */
async function localFonts(css) {
  // the other rules (.material-icons, .material-symbols-outlined: the icon classes) are kept as they are
  const rest = css.replace(/@font-face\s*\{[^}]*\}/g, '').trim();
  const blocks = css.split('@font-face').slice(1).map((b) => '@font-face' + b.slice(0, b.indexOf('}') + 1));
  const keep = blocks.filter((b) => /Material Icons/.test(b) || !/unicode-range/.test(b) || /U\+0000-00FF|U\+0100-02BA/.test(b));
  fs.mkdirSync(path.join(ASSETS, 'fonts'), { recursive: true });
  const out = [];
  for (const b of keep) {
    const m = b.match(/url\((https:[^)]+)\)/);
    if (!m) continue;
    const buf = await get(m[1]);
    const name = crypto.createHash('sha1').update(m[1]).digest('hex').slice(0, 12) + path.extname(new URL(m[1]).pathname);
    fs.writeFileSync(path.join(ASSETS, 'fonts', name), buf);
    out.push(b.replace(m[1], `assets/validator/fonts/${name}`));
  }
  return out.join('\n') + '\n' + rest;
}

(async () => {
  const browser = await launch(['--lang=ja-JP']);
  const p = await browser.newPage();
  await p.setViewport(VIEW);
  await p.setUserAgent(UA);
  await p.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' });
  // the validate request can be held back, to capture the "working" state
  let hold = null;
  await p.setRequestInterception(true);
  p.on('request', (r) => {
    if (/google-analytics|googletagmanager|csp\.withgoogle|generate_204/.test(r.url())) return r.abort();
    if (hold && /\/validate/.test(r.url())) { const h = hold; hold = null; h.held(r); return; }
    r.continue();
  });
  await p.goto(URL0, { waitUntil: 'networkidle2', timeout: 90000 });
  await p.evaluate(() => document.fonts.ready);
  await wait(1200);

  // stylesheets: the validator's own CSS inline (byte-for-byte), Google Fonts localized
  const sheets = await p.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href));
  const css = [];
  for (const href of sheets) {
    const text = (await get(href)).toString('utf8');
    css.push({ href, css: /fonts\.googleapis\.com/.test(href) ? await localFonts(text) : text });
  }
  const meta = await p.evaluate(() => ({ title: document.title, htmlAttrs: [...document.documentElement.attributes].map((a) => [a.name, a.value]), styles: [...document.querySelectorAll('head style')].map((s) => s.textContent) }));

  const states = {};
  const snap = async (name) => {
    await wait(400);
    states[name] = await p.evaluate(() => {
      const all = [...document.body.querySelectorAll('*')];
      const body = document.body.cloneNode(true);
      const copy = [...body.querySelectorAll('*')];
      // input values and scroll positions are not in the markup: written onto the copy
      all.forEach((e, i) => {
        if (/^(INPUT|TEXTAREA)$/.test(e.tagName) && e.value) copy[i].setAttribute('data-demo-value', e.value);
        if (e.scrollTop || e.scrollLeft) copy[i].setAttribute('data-demo-scroll', `${e.scrollTop},${e.scrollLeft}`);
      });
      body.querySelectorAll('script, noscript, iframe, link[rel="preload"], link[rel="modulepreload"]').forEach((e) => e.remove());
      return { url: location.href, bodyAttrs: [...document.body.attributes].map((a) => [a.name, a.value]), body: body.innerHTML };
    });
    await p.screenshot({ path: path.join(process.env.SHOTS || ASSETS, `state-${name}.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
    console.log('state', name, Math.round(states[name].body.length / 1024) + ' KB');
  };
  const dialogCm = () => p.evaluate(() => [...document.querySelectorAll('.CodeMirror')].filter((c) => c.closest('.XKSfm-Sx9Kwc') && c.offsetParent).length);
  const runButton = () => p.evaluateHandle(() => [...document.querySelectorAll('button, [role=button]')].filter((e) => e.textContent.trim() === 'テストを実行' && e.offsetParent).pop());
  const playButton = () => p.evaluateHandle(() => [...document.querySelectorAll('button, [role=button]')].find((e) => e.textContent.trim() === 'play_arrow'));
  const runHeld = async (button) => {
    let release;
    const held = new Promise((res) => { hold = { held: (r) => res(r) }; });
    await (await button()).click();
    const req = await held;
    await wait(700);
    release = req;
    return release;
  };

  await snap('dialogUrl');
  await p.click('#new-test-code');
  await wait(500);
  await snap('dialogSnippet');
  if (!(await dialogCm())) throw new Error('snippet editor not found');
  await p.evaluate((code) => { [...document.querySelectorAll('.CodeMirror')].filter((c) => c.closest('.XKSfm-Sx9Kwc') && c.offsetParent).pop().CodeMirror.setValue(code); }, devSource(false));
  await snap('dialogPasted');
  let req = await runHeld(runButton);
  await snap('loading');
  req.continue();
  await p.waitForFunction(() => /アイテムが検出されません|検出/.test(document.body.innerText) && ![...document.querySelectorAll('.XKSfm-Sx9Kwc')].some((d) => d.offsetParent), { timeout: 60000 }).catch(() => {});
  await wait(1500);
  await snap('error');
  // open the error group (the validator's own message)
  await (await p.$('#results-cell li.mdl-list__item')).click();
  await wait(900);
  await snap('errorOpen');
  // close it again, select all in the main editor
  await (await p.$('#results-cell li.mdl-list__item')).click();
  await wait(600);
  await p.evaluate(() => { const cm = document.querySelector('.CodeMirror').CodeMirror; cm.focus(); cm.execCommand('selectAll'); });
  await snap('selectAll');
  await p.evaluate((code) => { const cm = document.querySelector('.CodeMirror').CodeMirror; cm.setValue(code); cm.setCursor(cm.lineCount() - 1, 1e6); }, devSource(true));
  await snap('fixedPasted');
  req = await runHeld(playButton);
  await snap('loading2');
  req.continue();
  await p.waitForFunction(() => /件のアイテム/.test(document.body.innerText), { timeout: 60000 });
  await wait(1500);
  await snap('ok');
  const result = await p.evaluate(() => document.body.innerText.slice(0, 2000));
  await browser.close();

  fs.writeFileSync(OUT, '/* The real Schema Markup Validator (validator.schema.org), captured by tools/snapshots/ne-auberge/capture-validator.js — generated, do not edit */\n'
    + 'window.VALIDATOR_SNAPSHOT = ' + JSON.stringify({ url: URL0, capturedAt: new Date().toISOString().slice(0, 10), title: meta.title, view: VIEW, htmlAttrs: meta.htmlAttrs, css, styles: meta.styles, states }) + ';\n');
  console.log('wrote', path.relative(process.cwd(), OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB');
  console.log('--- result text (ok) ---\n' + result.split('\n').filter(Boolean).slice(0, 30).join('\n'));
})().catch((e) => { console.error(e); process.exit(1); });
