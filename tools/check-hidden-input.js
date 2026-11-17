/*
 * Finds the moments where something being typed is not visible on screen.
 *   npm run check                    all videos
 *   npm run check -- ne-auberge      one video (several ids are fine)
 *
 * Each video is run to the end at turbo speed (shared/stage.js). Every ~150 ms of video time the page is checked for
 * text carets (the code editor, terminal, form fields, IME composition, design-tool text) in the window that is on
 * top at that point, and each one is tested:
 *   - clipped     the caret lies outside the visible area of a scrolling / overflow:hidden box that contains it
 *                 (e.g. a long code line typed past the right edge of a half-width editor, a terminal prompt pushed
 *                 below the panel)
 *   - offscreen   outside the 1920 × 1080 screen
 *   - caption / keys   under the caption overlay or the key display
 * Prints one line per stretch of time with the same problem. Needs Node 18+ and Google Chrome.
 */
const { CHROME, videos, videoPage, puppeteer, only, fileUrl } = require('./lib');

/** runs in the page: installs the checker on the video clock */
function install() {
  const found = [];
  let lastT = -1e9;
  const SEL = '.caret, .ime-c, .demo-caret, .demo-ime';
  const hiddenBy = (el) => {
    let win = el.ownerDocument.defaultView;
    let r = el.getBoundingClientRect();
    let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    // (a caret in vertical text is wide and flat: size tests work on the area, not on width / height)
    if (r.width < 1 && r.height < 1) return null;
    if (x1 - x0 < 1) x1 = x0 + 1;
    if (y1 - y0 < 1) y1 = y0 + 1;
    // clip by every overflow box up the tree, then by the iframe, and so on up to the top window
    for (;;) {
      for (let a = el.parentElement; a; a = a.parentElement) {
        const cs = win.getComputedStyle(a);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return 'invisible';
        const ox = cs.overflowX !== 'visible', oy = cs.overflowY !== 'visible';
        if (ox || oy) {
          const ar = a.getBoundingClientRect();
          // a collapsed container (a closed terminal panel, closed DevTools): its caret is simply not shown
          if (ar.width < 4 || ar.height < 4) return 'invisible';
          if (ox) { x0 = Math.max(x0, ar.left); x1 = Math.min(x1, ar.right); }
          if (oy) { y0 = Math.max(y0, ar.top); y1 = Math.min(y1, ar.bottom); }
        }
      }
      if (x1 - x0 < 0.5 || y1 - y0 < 0.5) return 'clipped';
      const fe = win.frameElement;
      if (!fe) break;
      const fr = fe.getBoundingClientRect();
      const sx = fe.offsetWidth ? fr.width / fe.offsetWidth : 1, sy = fe.offsetHeight ? fr.height / fe.offsetHeight : 1;
      x0 = fr.left + x0 * sx; x1 = fr.left + x1 * sx; y0 = fr.top + y0 * sy; y1 = fr.top + y1 * sy;
      x0 = Math.max(x0, fr.left); x1 = Math.min(x1, fr.right); y0 = Math.max(y0, fr.top); y1 = Math.min(y1, fr.bottom);
      if (x1 - x0 < 0.5 || y1 - y0 < 0.5) return 'clipped';
      el = fe; win = fe.ownerDocument.defaultView;
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return 'offscreen';
    // is this window the one on top here? (a caret in a window behind another one is not on screen at all)
    // (the seek cover lies over everything during the turbo run: look underneath it)
    const top = document.elementsFromPoint(cx, cy).find((e) => !e.closest('#ffCover, .ff-cover'));
    const host = el.closest ? el.closest('.win, .wp, body') : null;
    if (top && host && host !== document.body && !host.contains(top) && !top.contains(host)) return 'behind';
    const over = (sel, extra) => { const o = document.querySelector(sel); if (!o || !extra(o)) return false; const q = o.getBoundingClientRect(); return cx > q.left && cx < q.right && cy > q.top && cy < q.bottom; };
    if (over('#app > .band', (o) => !document.body.classList.contains('no-captions') && o.querySelector('.band-cap.show'))) return 'caption';
    if (over('#keystrip', (o) => o.classList.contains('show'))) return 'keys';
    return null;
  };
  const docs = () => {
    const out = [document];
    document.querySelectorAll('iframe').forEach((f) => { try { if (f.contentDocument) out.push(f.contentDocument); } catch (e) {} });
    return out;
  };
  const describe = (el) => {
    let line = el.parentElement;
    while (line && line.parentElement && line.textContent.trim().length < 12) line = line.parentElement;
    const w = (el.ownerDocument === document ? el : el.ownerDocument.defaultView.frameElement).closest('.win, section, body');
    return `${w ? (w.id || w.className || 'body').toString().slice(0, 30) : ''} | ${(line ? line.textContent : '').replace(/\s+/g, ' ').trim().slice(-70)}`;
  };
  window.Stage.frameFns.add(() => {
    const t = window.Stage.Clock.t;
    if (t - lastT < 150) return;
    lastT = t;
    // only while something is being typed (the key display is up)
    const ks = document.getElementById('keystrip');
    if (!ks || !ks.classList.contains('show')) return;
    // pages can keep a stale caret in a second editor that is scrolled away; what matters is that the place being
    // typed is visible, so a moment counts only when no caret at all is on screen
    const hits = [];
    let anyVisible = false;
    for (const d of docs()) {
      d.querySelectorAll(SEL).forEach((el) => {
        const why = hiddenBy(el);
        if (!why) anyVisible = true;
        else if (why !== 'invisible' && why !== 'behind') hits.push({ t: Math.round(t), why, what: describe(el), scene: window.Stage.scene });
      });
    }
    if (!anyVisible) found.push(...hits);
  });
  window.__hiddenInput = found;
}

(async () => {
  const list = only(videos());
  const browser = await puppeteer().launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 900000, args: ['--window-size=1920,1080', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  for (const v of list) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(fileUrl(videoPage(v.id)) + '?embed=1');
    await page.waitForFunction('window.__demoReady || window.__demoError', { timeout: 300000 });
    await page.evaluate(install);
    await page.evaluate(() => window.Stage.seek(1e12, false));
    await page.waitForFunction('(window.__demoDone && !window.Stage.seeking) || window.__demoError', { timeout: 900000, polling: 1000 });
    const found = await page.evaluate(() => window.__hiddenInput);
    // merge consecutive hits of the same kind / place
    const runs = [];
    for (const f of found) {
      const last = runs[runs.length - 1];
      if (last && last.why === f.why && last.what === f.what && f.t - last.to <= 400) { last.to = f.t; continue; }
      runs.push({ from: f.t, to: f.t, why: f.why, what: f.what, scene: f.scene });
    }
    const fmt = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
    console.log(`\n${v.id}: ${runs.length} stretch(es)`);
    runs.forEach((r) => console.log(`  ${fmt(r.from)}–${fmt(r.to)}  scene ${r.scene}  ${r.why.padEnd(9)} ${r.what}`));
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
