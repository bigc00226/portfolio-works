/*
 * Checks where the scripted pointer goes and where the issue frames are drawn.
 *   npm run pointer                    all videos
 *   npm run pointer -- wp-crooz        one video (several ids are fine)
 *
 * Each video is run to the end at turbo speed (shared/stage.js) with the captions on, as in the player. Reported:
 *   OFF TARGET   a click / hover whose pointer is not on the element it was sent to (moved or hidden on the way)
 *   OFF SCREEN   a click outside the 1920 × 1080 screen (the taskbar counts as on screen)
 *   NOT SHOWN    the pointer sent to an element that is not laid out (display: none, a closed menu, a hidden tab…),
 *                or a click on an element that does not exist (Demo.clickUi warns about both)
 *   UNDER CAPTION  a click under the caption band (what is clicked cannot be seen)
 *   NO FRAME     an issue frame is up but its target is not on screen (not laid out / scrolled away), so nothing is drawn
 * Also listed (no error): the scrolls Demo.reveal() made to bring a target into view.
 * Prints nothing but the summary line when all is well. Exit code 1 when something is reported.
 */
const { videos, only, launch, openVideo, runToEnd } = require('./lib');

/** runs in the page: hooks the pointer, the hover state and the issue frame */
function install() {
  const D = window.Demo, S = window.Stage;
  const out = { bad: [], reveal: [] };
  window.__pointer = out;
  const T = () => Math.round(S.Clock.t);
  const desc = (el) => {
    if (!el || !el.tagName) return String(el);
    const fr = el.ownerDocument.defaultView.frameElement;
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const tx = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 28);
    return (fr ? `[${fr.id || fr.className || 'iframe'}] ` : '') + el.tagName.toLowerCase() + id + cls + (tx ? ` "${tx}"` : '');
  };
  const push = (kind, what, extra = '') => out.bad.push({ t: T(), scene: S.scene, kind, what, extra });
  window.__demoLog = (kind, el, from, to) => out.reveal.push({ t: T(), scene: S.scene, what: desc(el), from, to });
  const cw = console.warn.bind(console);
  console.warn = (...a) => {
    const m = String(a[0]);
    if (/^\[demo\] (pointer target is not on screen|click target missing)/.test(m)) push('NOT SHOWN', a[1] && a[1].nodeType ? desc(a[1]) : String(a[1]), m.replace('[demo] ', ''));
    return cw(...a);
  };
  // hover state is set when the pointer has arrived (clickUi / hoverUi): it must be on the element
  const hov = D.UI.hover.bind(D.UI);
  D.UI.hover = (el) => {
    if (el && el.getBoundingClientRect) {
      const x = D.Cursor.x, y = D.Cursor.y, r = D.screenRect(el);
      const laid = r.width >= 1 || r.height >= 1;
      if (laid && !(x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2)) push('OFF TARGET', desc(el), `pointer ${Math.round(x)},${Math.round(y)} · element ${[r.left, r.top, r.width, r.height].map(Math.round)}`);
    }
    return hov(el);
  };
  const press = D.Cursor.press.bind(D.Cursor);
  D.Cursor.press = () => {
    const x = D.Cursor.x, y = D.Cursor.y;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) push('OFF SCREEN', `${Math.round(x)},${Math.round(y)}`);
    const cap = document.getElementById('caption');
    if (cap && cap.classList.contains('show') && !document.body.classList.contains('no-captions')) {
      const q = cap.getBoundingClientRect();
      if (x >= q.left && x <= q.right && y >= q.top && y <= q.bottom) push('UNDER CAPTION', `${Math.round(x)},${Math.round(y)}`, D.UI.hovered ? desc(D.UI.hovered) : '');
    }
    return press();
  };
  // the issue frame: up (a target set) but not drawn
  let last = -1e9;
  S.frameFns.add(() => {
    const I = D.Issue;
    if (!I.target || S.Clock.t - last < 250) return;
    last = S.Clock.t;
    const box = document.getElementById('issueBox');
    if (box.style.visibility === 'hidden') push('NO FRAME', document.getElementById('issueLbl').textContent);
  });
}

(async () => {
  const list = only(videos());
  const browser = await launch();
  const fmt = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  let total = 0;
  for (const v of list) {
    const page = await openVideo(browser, v.id);
    await page.evaluate(install);
    const res = await runToEnd(page);
    if (res.error) throw new Error(`${v.id}: ${res.error}`);
    const { bad, reveal } = await page.evaluate(() => window.__pointer);
    // one line per run of the same report (an issue frame is sampled every 250 ms)
    const runs = [];
    for (const b of bad) {
      const p = runs[runs.length - 1];
      if (p && p.kind === b.kind && p.what === b.what && b.t - p.to <= 400) { p.to = b.t; continue; }
      runs.push({ ...b, from: b.t, to: b.t });
    }
    total += runs.length;
    console.log(`${runs.length ? '✗' : '✓'} ${v.id}: ${runs.length} problem(s)${reveal.length ? `, ${reveal.length} scroll(s) to bring a target into view` : ''}`);
    runs.forEach((r) => console.log(`    ${fmt(r.from)}${r.to - r.from > 400 ? '–' + fmt(r.to) : ''}  scene ${r.scene}  ${r.kind.padEnd(13)} ${r.what}${r.extra ? '  (' + r.extra + ')' : ''}`));
    if (process.argv.includes('--scrolls')) reveal.forEach((r) => console.log(`    ${fmt(r.t)}  scene ${r.scene}  scroll ${r.from} → ${r.to}  ${r.what}`));
    await page.close();
  }
  await browser.close();
  if (total) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
