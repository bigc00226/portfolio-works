// Captures real GitHub Actions pages (public repositories, logged out — no account is used) and turns them into the
// run pages of the video's repository, for the scheduled sync in the soup-stock-tokyo video.
//
//   node tools/snapshots/soup-stock-tokyo/capture-github.js [--reuse]      (then: node tools/webp.js soup-stock-tokyo)
//   --reuse   the same source runs as last time (kept in the OS temp folder, not in the project) — the running one must still be running
// The source runs are found on GitHub's public Actions pages (no API, no account).
//
// What is captured (github.com, light theme, at the size of the video's Chrome content area, 1920 × 947):
//   runDone     the summary page of a finished scheduled run with one job        (upptime/upptime "Uptime CI")
//   jobDone     that run's job page (the steps)
//   jobRunning  the job page of a run that is in progress right now, with one job (nodejs/node, vercel/next.js, … — whichever has one
//               running; listed by the Actions page's filter is:in_progress)
// How:
//   - every github.com response (the page and what GitHub's scripts fetch afterwards) passes through rename(): the names
//     of the source repository / workflow / job / people / commit become the video's (soupstocktokyo/sst-inventory-sync,
//     inventory-sync, sync, sst-ec-dev, b7e41c9). The global navigation's props get an `owner`, so GitHub's own React
//     code draws the logged-in header (menu, logo, breadcrumbs, search, create, issues, pull requests, inbox, avatar);
//     its repository tabs are those of a private repository the user administers (Projects, Settings, no Discussions).
//   - after GitHub's scripts ran: the logged-out marketing bar, banners, annotations, "Sign in" prompts, scripts and
//     tracking attributes are removed; the job's steps become the video's eight steps, made from GitHub's own step
//     elements (a finished one, the running one and a waiting one of the captured pages).
//   - the avatar is the identicon GitHub would draw for the login (GitHub's algorithm, as in github.com/dgraham/identicon)
//   - stylesheets are GitHub's own files (light theme only; inlined by js/apps.js), their fonts / images saved to assets/github/.
// Writes js/github-snapshot.js (window.GITHUB_SNAPSHOT). Times, step states, durations and the log lines are set at run
// time by js/apps.js — log lines with the markup of GitHub's log viewer (CheckStep-line …).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '../../../public/videos/soup-stock-tokyo');
const ASSETS = path.join(ROOT, 'assets', 'github');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const VIEW = { width: 1920, height: 947 };

// the video's repository (it does not exist on GitHub; neither does the login)
const ORG = 'soupstocktokyo', REPO = 'sst-inventory-sync', NWO = `${ORG}/${REPO}`, LOGIN = 'sst-ec-dev';
const WORKFLOW = 'inventory-sync', JOB = 'sync';
const SHA = 'b7e41c9d02f3a86e5c1d4b9a27f08e63d5a1c4f2';
/** the job's steps as GitHub lists them for .github/workflows/inventory-sync.yml (js/files.js) */
const STEPS = ['Set up job', 'Run actions/checkout@v4', 'Run actions/setup-node@v4', 'WMS の在庫 CSV を取得', 'Shopify に同期',
  'Post Run actions/setup-node@v4', 'Post Run actions/checkout@v4', 'Complete job'];

/** the facts of a run, read from its public pages: title, workflow and its file, commit, people, branch, its jobs */
async function readRun(browser, runUrl) {
  const p = await browser.newPage();
  await p.setViewport(VIEW);
  await p.setUserAgent(UA);
  try {
    await p.goto(runUrl, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 1500));
    const run = await p.evaluate(() => {
      const t = (s) => document.querySelector(s)?.textContent.trim();
      const wf = document.querySelector('a[href*="/actions/workflows/"]');
      const sha = [...document.querySelectorAll('a[href*="/commit/"]')].map((a) => a.href.match(/commits?\/([0-9a-f]{40})/)).filter(Boolean)[0];
      const people = [...document.querySelectorAll('a[data-hovercard-type="user"], a[data-hovercard-url*="/users/"]')].map((a) => a.textContent.trim()).filter(Boolean);
      const jobs = [...new Set([...document.querySelectorAll('a[href*="/job/"]')].map((a) => a.href.split('#')[0]))];
      const jobLink = document.querySelector('a[href*="/job/"]');
      return {
        title: t('.PageHeader-title .markdown-title'), workflow: t('.PageHeader-parentLink-label'),
        file: wf ? wf.getAttribute('href').split('?')[0].split('/').pop() : null, sha: sha && sha[1], actors: [...new Set(people)],
        branch: [...document.querySelectorAll('.branch-name')].map((a) => a.textContent.trim())[0] || null,
        jobs, job: jobs[0] || null, jobName: jobLink ? jobLink.textContent.trim() : null,
      };
    });
    if (run.job) {
      await p.goto(run.job, { waitUntil: 'networkidle2', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 1000));
      run.steps = await p.evaluate(() => [...document.querySelectorAll('check-step')].map((s) => {
        const icon = [...s.querySelectorAll('summary svg')].find((x) => !x.hasAttribute('hidden'));
        return (s.getAttribute('data-conclusion') || 'null') !== 'null' ? 'done' : icon && icon.classList.contains('anim-rotate') ? 'run' : 'wait';
      }));
    }
    return { ...run, run: runUrl, nwo: new URL(runUrl).pathname.split('/').slice(1, 3).join('/') };
  } finally { await p.close(); }
}

/** runs listed on a public Actions page (newest first) */
async function listRuns(browser, url) {
  const p = await browser.newPage();
  await p.setUserAgent(UA);
  try {
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    return await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/actions/runs/"]')].map((a) => a.href.split('?')[0].split('#')[0]).filter((h) => /\/actions\/runs\/\d+$/.test(h)))]);
  } finally { await p.close(); }
}

/** a finished scheduled run of upptime's "Uptime CI" (one job) */
async function findDone(browser) {
  for (const url of (await listRuns(browser, 'https://github.com/upptime/upptime/actions/workflows/uptime.yml?query=event%3Aschedule+is%3Asuccess')).slice(0, 3)) {
    const run = await readRun(browser, url);
    if (run.jobs.length === 1 && run.steps && run.steps.every((s) => s === 'done')) return run;
  }
  throw new Error('no finished scheduled run of upptime/upptime found');
}

/** a run with one job that is in progress right now: a step running, steps still waiting */
async function findRunning(browser) {
  for (const nwo of ['nodejs/node', 'vercel/next.js', 'microsoft/vscode', 'facebook/react', 'denoland/deno']) {
    for (const url of (await listRuns(browser, `https://github.com/${nwo}/actions?query=is%3Ain_progress+event%3Apush`)).slice(0, 8)) {
      const run = await readRun(browser, url).catch(() => null);
      if (run && run.jobs.length === 1 && run.steps && run.steps.includes('run') && run.steps.includes('wait')) return run;
    }
  }
  throw new Error('no single-job run in progress right now — try again in a few minutes');
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** the source's names → the video's (on everything github.com sends, before it renders) */
function rename(text, src) {
  const [org, repo] = src.nwo.split('/');
  for (const [a, b] of [[src.nwo, NWO], [encodeURIComponent(src.nwo), encodeURIComponent(NWO)], [src.file, `${WORKFLOW}.yml`], [src.sha, SHA], [src.sha && src.sha.slice(0, 7), SHA.slice(0, 7)]]) if (a) text = text.split(a).join(b);
  if (src.title && src.title !== src.workflow) text = text.split(src.title).join(WORKFLOW); // a push run shows its commit message as the title
  const words = [[src.workflow, WORKFLOW], [src.jobName, JOB], ...src.actors.filter(Boolean).map((a) => [a, LOGIN]), [org, ORG], [repo, REPO]];
  for (const [a, b] of words) if (a && a !== b) text = text.replace(new RegExp(`(?<![\\w.-])${escRe(a)}(?![\\w-])`, 'g'), b);
  if (src.branch) text = text.replace(new RegExp(`>${escRe(src.branch)}<`, 'g'), '>main<');
  return text;
}
/** the video's names → the source's (requests GitHub's scripts make from the renamed page go to the real repository) */
const unrename = (url, src) => { url = url.split(`/${NWO}/`).join(`/${src.nwo}/`); return src.sha ? url.split(SHA).join(src.sha) : url; };

/** the global navigation's props: logged in (owner), the video's repository and its tabs */
function loggedIn(html, avatar) {
  return html.replace(/(partial-name="global-nav-bar"[\s\S]*?data-target="react-partial\.embeddedData">)([\s\S]*?)(<\/script>)/, (m, a, json, c) => {
    const d = JSON.parse(json);
    const p = d.props;
    p.owner = { login: LOGIN, name: LOGIN, avatarUrl: avatar };
    p.contextRegion.crumbs = [
      { crumb_type: 'user', label: ORG, is_root: false, href: `/${ORG}` },
      { crumb_type: 'repository', label: REPO, is_root: false, href: `/${NWO}` },
    ];
    const nav = p.contextRegion.localNavigation;
    const tab = (id) => nav.find((x) => x.id === id);
    const like = (base, o) => ({ ...base, ...o, selectedLinks: [], count: undefined, reactNav: { appTarget: null, anchor: null }, turboNav: { frame: 'repo-content-turbo-frame' } });
    p.contextRegion.localNavigation = [
      { ...tab('code'), href: `/${NWO}` },
      { ...tab('issues'), href: `/${NWO}/issues`, count: 2 },
      { ...tab('pull-requests'), href: `/${NWO}/pulls`, count: 1 },
      { ...tab('actions'), href: `/${NWO}/actions` },
      like(tab('insights'), { id: 'projects', icon: 'table', label: 'Projects', href: `/${NWO}/projects`, commandId: 'repositories:go-to-projects' }),
      { ...(tab('security-and-quality') || tab('security')), href: `/${NWO}/security`, count: undefined },
      { ...tab('insights'), href: `/${NWO}/pulse` },
      like(tab('insights'), { id: 'settings', icon: 'gear', label: 'Settings', href: `/${NWO}/settings`, commandId: 'repositories:go-to-settings' }),
    ].filter((x) => x && x.id);
    if (p.search && p.search.searchContext) Object.assign(p.search.searchContext, { scope: `repo:${NWO}`, current_repo_name: REPO, current_repo_nwo: NWO, current_repo_org: ORG, user_id: ORG });
    p.notifications = { ...p.notifications, indicatorMode: 'disabled' };
    return a + JSON.stringify(d).replace(/<\//g, '<\\/') + c;
  });
}

/** GitHub's identicon for a login (the algorithm of github.com/dgraham/identicon), 420 × 420 as an SVG */
function identicon(seed) {
  const h = crypto.createHash('md5').update(seed).digest();
  const map = (v, a, b, c, d) => ((v - a) * (d - c)) / (b - a) + c;
  const hue = map(((h[12] & 0x0f) << 8) | h[13], 0, 4095, 0, 360), sat = 65 - map(h[14], 0, 255, 0, 20), lum = 75 - map(h[15], 0, 255, 0, 20);
  const nib = [...h].flatMap((b) => [b >> 4, b & 0x0f]).map((x) => x % 2 === 0);
  const px = Array(25).fill(false);
  let k = 0;
  for (let col = 2; col >= 0; col--) for (let row = 0; row < 5; row++) { const paint = nib[k++]; px[col + row * 5] = paint; px[4 - col + row * 5] = paint; }
  const cells = px.map((on, i) => (on ? `<rect x="${35 + (i % 5) * 70}" y="${35 + Math.floor(i / 5) * 70}" width="70" height="70"/>` : '')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420"><rect width="420" height="420" fill="rgb(240,240,240)"/><g fill="hsl(${hue.toFixed(1)},${sat.toFixed(1)}%,${lum.toFixed(1)}%)">${cells}</g></svg>\n`;
}

/** runs in the page after GitHub's scripts. Works on an inert copy of the page (DOMParser: GitHub's custom elements do
 *  not react to it): what a logged-in owner would not see, what must not be stored, and the job's steps. */
function cleanUp(o) {
  const doc = new DOMParser().parseFromString('<!DOCTYPE html>' + document.documentElement.outerHTML, 'text/html');
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  $$('.js-header-wrapper, react-partial[partial-name="marketing-header"], a.show-on-focus, #js-flash-container, .js-notice, #ghcc, cookie-consent-link, react-partial[partial-name="app-install-banner-partial"], react-partial[partial-name="keyboard-shortcuts-dialog"]').forEach((e) => e.remove());
  for (const el of [doc.documentElement, doc.body]) el.classList.replace('logged-out', 'logged-in');
  doc.documentElement.setAttribute('data-color-mode', 'light');
  // annotations: notices of the source workflow
  $$('[aria-label="Annotations"], job-annotations').forEach((e) => (e.closest('.actions-fullwidth-module:not(.js-selected-check-run)') || e).remove());
  // run details: "Lockfile" is not shown for this workflow
  $$('a').filter((a) => /^\s*Lockfile\s*$/.test(a.textContent)).forEach((a) => (a.closest('li') || a).remove());
  // "Sign in to view logs": js/apps.js puts the owner's buttons here
  $$('.PageHeader-actions').forEach((e) => { e.innerHTML = ''; e.setAttribute('data-demo', 'actions'); });
  // avatars: the identicon of the video's login
  $$('img').filter((i) => /avatars\.githubusercontent\.com|identicon|github-avatar/.test(i.getAttribute('src') + ' ' + i.className + ' ' + i.getAttribute('data-testid'))).forEach((i) => {
    i.setAttribute('src', o.avatar); i.removeAttribute('srcset'); i.setAttribute('alt', `@${o.login}`);
  });
  // the job's steps: the video's, made from the page's own step elements
  const icons = {};
  const steps = $$('check-step');
  if (steps.length) {
    const box = steps[0].parentElement;
    // (a step that has not finished has data-conclusion="null")
    const open = (s) => (s.getAttribute('data-conclusion') || 'null') === 'null';
    const running = (s) => !!$('summary svg.anim-rotate:not([hidden])', s);
    const tpl = {
      done: steps.find((s) => s.getAttribute('data-conclusion') === 'success') || steps[0],
      run: steps.find((s) => open(s) && running(s)),
      wait: steps.find((s) => open(s) && !running(s)),
    };
    const iconOf = (s) => (s ? $$('summary svg', s).filter((x) => !x.hasAttribute('hidden'))[0]?.outerHTML || '' : '');
    icons.done = iconOf(tpl.done);
    icons.run = iconOf(tpl.run) || ($('#step-icon-in-progress') ? $('#step-icon-in-progress').innerHTML.trim() : '');
    icons.wait = iconOf(tpl.wait);
    const made = o.steps.map((name, i) => {
      const s = tpl.done.cloneNode(true);
      s.setAttribute('data-name', name);
      s.setAttribute('data-number', String(i + 1));
      const d = $('details', s);
      d.id = `check-step-${i + 1}`;
      d.setAttribute('data-step-number', String(i + 1));
      d.removeAttribute('style');
      $('.CheckStep-titleName', s).textContent = name;
      const dur = $('summary .float-right', s);
      if (dur) dur.textContent = '';
      $$('.js-checks-log-display-container', s).forEach((c) => { c.innerHTML = ''; c.removeAttribute('?hidden'); });
      return s;
    });
    steps.forEach((s) => s.remove());
    made.forEach((s) => box.appendChild(s));
  }
  const lead = $('.PageHeader-leadingVisual');
  // nothing of GitHub's scripts / tracking
  $$('script, noscript, iframe, link[rel="preload"], link[rel="modulepreload"], link[rel="prefetch"], link[rel="dns-prefetch"], link[rel="preconnect"]').forEach((e) => e.remove());
  for (const el of $$('*')) {
    for (const a of [...el.attributes]) if (/^(data-hydro|data-channel|data-url|data-hovercard|data-octo|data-ga-|data-analytics|data-log-url|data-external-id|data-started-at|data-completed-at|data-catalyst|data-retain-focus|nonce|\?)/.test(a.name)) el.removeAttribute(a.name);
  }
  // absolute URLs (the page is shown from a local file)
  $$('[href]').forEach((e) => { const h = e.getAttribute('href'); if (h && h.startsWith('/') && !h.startsWith('//')) e.setAttribute('href', 'https://github.com' + h); });
  const attrs = (el) => [...el.attributes].map((a) => `${a.name}="${a.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`).join(' ');
  return {
    htmlAttrs: attrs(doc.documentElement),
    bodyAttrs: attrs(doc.body),
    body: doc.body.innerHTML,
    title: doc.title,
    icons,
    titleIcon: lead ? lead.innerHTML : '',
    sheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href),
    styles: [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n'),
  };
}

const ext = (type, url) => (/svg/.test(type) ? '.svg' : /png/.test(type) ? '.png' : /jpe?g/.test(type) ? '.jpg' : /gif/.test(type) ? '.gif' : /webp/.test(type) ? '.webp' : /woff2/.test(type + url) ? '.woff2' : /woff/.test(type + url) ? '.woff' : path.extname(new URL(url).pathname) || '.bin');
const saved = new Map();
async function save(url) {
  if (saved.has(url)) return saved.get(url);
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const file = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12) + ext(r.headers.get('content-type') || '', url);
  fs.writeFileSync(path.join(ASSETS, file), buf);
  const rel = `assets/github/${file}`;
  saved.set(url, rel);
  return rel;
}

(async () => {
  fs.rmSync(ASSETS, { recursive: true, force: true });
  fs.mkdirSync(ASSETS, { recursive: true });
  const AVATAR = `assets/github/identicon-${LOGIN}.svg`;
  fs.writeFileSync(path.join(ROOT, AVATAR), identicon(LOGIN));
  // --reuse: the sources of the last capture (in the OS temp folder: the source pages' names never go into the project)
  const cache = path.join(require('os').tmpdir(), 'capture-github-sources.json');
  const reuse = process.argv.includes('--reuse') && fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : null;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--lang=en-US', '--hide-scrollbars'] });
  const done = reuse ? reuse.done : await findDone(browser);
  const running = reuse ? reuse.running : await findRunning(browser);
  fs.writeFileSync(cache, JSON.stringify({ done, running }, null, 2));
  console.log('done   :', done.run, '|', done.workflow, '|', done.jobName);
  console.log('running:', running.run, '|', running.workflow, '|', running.jobName);
  const pages = {};
  const sheets = new Set();
  let inlineCss = '';
  for (const [key, src, url] of [['runDone', done, done.run], ['jobDone', done, done.job], ['jobRunning', running, running.job]]) {
    const p = await browser.newPage();
    await p.setViewport(VIEW);
    await p.setUserAgent(UA);
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await p.setRequestInterception(true);
    const ourUrl = rename(url, src);
    p.on('request', async (req) => {
      const u = req.url();
      if (!/^https:\/\/github\.com\//.test(u) || !['document', 'xhr', 'fetch'].includes(req.resourceType())) return req.continue();
      try {
        const real = req.isNavigationRequest() ? url : unrename(u, src);
        const r = await fetch(real, { method: req.method(), headers: { ...req.headers(), 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' }, body: req.postData() });
        const type = r.headers.get('content-type') || 'text/html';
        let body = Buffer.from(await r.arrayBuffer());
        if (/html|json|text/.test(type)) body = rename(body.toString('utf8'), src);
        if (req.isNavigationRequest()) body = loggedIn(body, 'https://github.com/' + AVATAR);
        req.respond({ status: r.status, contentType: type, body });
      } catch (e) { req.abort(); }
    });
    await p.goto(ourUrl, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 2500));
    const out = await p.evaluate(cleanUp, { steps: STEPS, avatar: AVATAR, login: LOGIN });
    out.sheets.forEach((s) => sheets.add(s));
    inlineCss += out.styles + '\n';
    delete out.sheets; delete out.styles;
    out.body = out.body.split('https://github.com/' + AVATAR).join(AVATAR);
    pages[key] = out;
    console.log(key, '|', out.title, '|', (out.body.length / 1024).toFixed(0) + ' KB');
    await p.close();
  }
  await browser.close();

  // GitHub's stylesheets: the light theme only (the page is set to data-color-mode="light"); not the marketing header's
  const skip = /\/(dark|light_high_contrast|light_colorblind|light_colorblind_high_contrast|light_tritanopia|light_tritanopia_high_contrast|dark_[a-z_]+)-[0-9a-f]+\.css$|marketing-header|primer-react-brand/;
  let css = '';
  for (const href of [...sheets].filter((h) => !skip.test(h))) {
    let text = await (await fetch(href, { headers: { 'user-agent': UA } })).text();
    text = text.replace(/\/\*# sourceMappingURL=[^*]*\*\//g, '');
    const urls = [...new Set([...text.matchAll(/url\((["']?)([^"')]+)\1\)/g)].map((m) => m[2]).filter((u) => !u.startsWith('data:') && !u.startsWith('#')))];
    for (const u of urls) {
      try { text = text.split(`(${u})`).join(`(${await save(new URL(u, href).href)})`).split(`("${u}")`).join(`("${await save(new URL(u, href).href)}")`); } catch (e) { /* not needed by these pages */ }
    }
    css += `/* ${href.split('/').pop()} */\n${text}\n`;
  }
  css += inlineCss;

  // nothing of the sources may be left
  const leftovers = [];
  const tokens = [done.nwo, running.nwo, ...done.nwo.split('/'), ...running.nwo.split('/'), ...done.actors, ...running.actors, done.sha, running.sha, running.title, done.workflow, running.workflow]
    .filter((t) => t && t.length > 3 && ![NWO, LOGIN, WORKFLOW, JOB, ...STEPS].some((x) => x.toLowerCase().includes(t.toLowerCase())));
  for (const [k, pg] of Object.entries(pages)) {
    const all = JSON.stringify(pg).toLowerCase();
    for (const t of new Set(tokens)) { const i = all.indexOf(t.toLowerCase()); if (i >= 0) leftovers.push(`${k}: "${t}" … ${all.slice(Math.max(0, i - 80), i + 40)}`); }
  }
  if (leftovers.length) { console.error('names of the source pages are left:\n' + leftovers.join('\n')); process.exit(1); }

  const snap = {
    capturedAt: new Date().toISOString().slice(0, 10),
    note: 'GitHub Actions pages captured logged out from public repositories and renamed (tools/snapshots/soup-stock-tokyo/capture-github.js)',
    login: LOGIN, nwo: NWO, avatar: AVATAR, steps: STEPS,
    css,
    pages,
  };
  const file = path.join(ROOT, 'js', 'github-snapshot.js');
  fs.writeFileSync(file, `/* GitHub Actions pages — tools/snapshots/soup-stock-tokyo/capture-github.js (generated, do not edit) */\nwindow.GITHUB_SNAPSHOT = ${JSON.stringify(snap)};\n`);
  console.log('wrote', path.relative(process.cwd(), file), (fs.statSync(file).size / 1048576).toFixed(2) + ' MB;', saved.size + 1, 'assets');
})().catch((e) => { console.error(e); process.exit(1); });
