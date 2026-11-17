/*
 * Windows 11 desktop pieces shared by the production-process videos:
 *   - taskbar (centered Start / Search / Task View / pinned apps, tray, clock) built from <footer id="taskbar" data-...>
 *   - caption buttons of maximized windows (minimize / restore / close, Segoe Fluent style)
 *   - the taskbar clock, running with the video's timeline from a fixed start date
 *   - real pointer images (C:\Windows\Cursors aero_*) in #cursor
 *
 * <footer class="w11-taskbar" id="taskbar" data-pins="explorer edge chrome:browser vscode:code figma:design"
 *         data-start="2026-05-19T13:20" data-open="browser" data-active="browser"></footer>
 *   pins: icon[:data-app]  — the data-app name is what Win.switchTo() / Browser code look for (.tb-app[data-app=…])
 */
(function () {
  'use strict';
  const base = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || '../../shared/';
  const ICON = (n) => `${base}icons/${n}`;
  const NAMES = {
    explorer: 'エクスプローラー', edge: 'Microsoft Edge', chrome: 'Google Chrome', vscode: 'Visual Studio Code',
    figma: 'Figma', store: 'Microsoft Store', terminal: 'ターミナル',
  };
  const FILES = { explorer: 'explorer.webp', edge: 'edge.webp', chrome: 'chrome.webp', vscode: 'vscode.webp', figma: 'figma.svg', store: 'store.webp', terminal: 'terminal.webp' };

  /* Fluent System Icons (MIT, microsoft/fluentui-system-icons) used by the Windows 11 tray */
  /* Fluent System Icons (MIT, microsoft/fluentui-system-icons) — the glyph family of the Windows 11 tray */
  function fl(name) {
    // the tray glyphs are fetched as files so the original SVGs stay untouched
    return `<img class="fl" src="${ICON('fl-' + name + '.svg')}" alt="">`;
  }

  /* caption buttons (Segoe Fluent Icons ChromeMinimize / ChromeRestore / ChromeClose, 10 px, 1 px stroke) */
  const CAP = {
    min: '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5.5h10" stroke="currentColor" stroke-width="1"/></svg>',
    max: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x=".5" y=".5" width="9" height="9" rx="1.2"/></svg>',
    restore: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x=".5" y="2.5" width="7" height="7" rx="1.2"/><path d="M2.5 2.5V1.7c0-.66.54-1.2 1.2-1.2h4.6c.66 0 1.2.54 1.2 1.2v4.6c0 .66-.54 1.2-1.2 1.2H7.5"/></svg>',
    close: '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M.5.5l9 9M9.5.5l-9 9" stroke="currentColor" stroke-width="1"/></svg>',
  };
  function captionButtons() {
    document.querySelectorAll('.wc').forEach((wc) => {
      if (wc.dataset.w11) return;
      wc.dataset.w11 = '1';
      wc.innerHTML = `<span class="cap-b">${CAP.min}</span><span class="cap-b cap-max">${CAP.max}</span><span class="cap-b cap-rst">${CAP.restore}</span><span class="cap-b cap-x">${CAP.close}</span>`;
    });
  }

  const TASKVIEW = '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="9.5" y="3.5" width="11" height="11" rx="2.2" fill="#2b2b2b"/><rect x="3.5" y="9.5" width="11" height="11" rx="2.2" fill="#fff" stroke="#2b2b2b" stroke-width="1.4"/></svg>';

  function buildTaskbar() {
    const tb = document.getElementById('taskbar');
    if (!tb || tb.dataset.built) return;
    tb.dataset.built = '1';
    tb.classList.add('w11-taskbar');
    const pins = (tb.dataset.pins || 'explorer edge chrome:browser').split(/\s+/).filter(Boolean).map((p) => { const [icon, app] = p.split(':'); return { icon, app: app || '' }; });
    const open = new Set((tb.dataset.open || '').split(/\s+/).filter(Boolean));
    const active = tb.dataset.active || '';
    const apps = pins.map((p) => {
      const cls = ['tb-app', p.app && open.has(p.app) ? 'open' : '', p.app && p.app === active ? 'active' : ''].filter(Boolean).join(' ');
      return `<span class="${cls}"${p.app ? ` data-app="${p.app}"` : ''} title="${NAMES[p.icon] || ''}"><img class="tb-ico" src="${ICON(FILES[p.icon] || p.icon)}" alt=""><i class="tb-pill"></i></span>`;
    }).join('');
    tb.innerHTML =
      `<div class="tb-center">` +
        `<span class="tb-btn tb-start" title="スタート"><img class="tb-ico" src="${ICON('start.webp')}" alt=""></span>` +
        `<span class="tb-searchbox"><span class="tb-sicon">${fl('search_20_regular')}</span><span class="tb-stext">検索</span></span>` +
        `<span class="tb-btn tb-taskview" title="タスク ビュー">${TASKVIEW}</span>` +
        apps +
      `</div>` +
      `<div class="tb-tray">` +
        `<span class="tb-btn tb-chev">${fl('chevron_up_20_regular')}</span>` +
        `<span class="tb-btn tb-ime" id="trayIme">あ</span>` +
        `<span class="tb-btn tb-qs">${fl('wifi_1_20_regular')}${fl('speaker_2_20_regular')}</span>` +
        `<span class="tb-btn tb-clock"><span id="clockTime">0:00</span><span id="clockDate">2026/01/01</span></span>` +
        `<span class="tb-btn tb-bell">${fl('alert_20_regular')}</span>` +
        `<span class="tb-desk"></span>` +
      `</div>`;
  }

  /* ------------------------------------------------------------ clock: start date + the video's timeline */
  let startDate = null;
  function parseStart(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0) : new Date(2026, 3, 16, 14, 5);
  }
  const pad = (n) => String(n).padStart(2, '0');
  /** the wall-clock date at the current point of the video (+ the time skipped by a cut, see skipTo) */
  let skipped = 0;
  function now() {
    const t = window.Stage ? window.Stage.Clock.t : 0;
    return new Date(startDate.getTime() + Math.floor(t) + skipped);
  }
  let shown = '';
  function tick() {
    const d = now();
    const key = `${d.getHours()}:${pad(d.getMinutes())}`;
    if (key === shown) return;
    shown = key;
    const a = document.getElementById('clockTime'), b = document.getElementById('clockDate');
    if (a) a.textContent = key;
    if (b) b.textContent = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  }
  /** a cut in the recording: the clock jumps ahead to "HH:MM" of the same day (no-op when that is not ahead).
   *  Called from the script, so it happens again at the same point after a seek. */
  function skipTo(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const d = now(), to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0);
    if (to > d) { skipped += to - d; shown = ''; tick(); }
  }
  const fmt = {
    date: (d = now()) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`,
    time: (d = now()) => `${d.getHours()}:${pad(d.getMinutes())}`,
    stamp: (d = now()) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  };

  /* ------------------------------------------------------------ real pointer images */
  function cursors() {
    const c = document.getElementById('cursor');
    if (!c || c.dataset.w11) return;
    c.dataset.w11 = '1';
    const img = (cls, n) => `<img class="${cls}" src="${base}cursors/${n}.webp" srcset="${base}cursors/${n}.webp 1x, ${base}cursors/${n}@2x.webp 2x" width="32" height="32" alt="">`;
    c.innerHTML = img('c-arrow', 'arrow') + img('c-hand', 'link') + img('c-text', 'beam_r') + img('c-cross', 'cross_r') + img('c-move', 'move') + img('c-ew', 'ew') + img('c-ns', 'ns');
  }

  /* ------------------------------------------------------------ Windows 11 toast (bottom-right) */
  function toastMarkup() {
    const n = document.getElementById('notif');
    if (!n || n.dataset.w11) return;
    n.dataset.w11 = '1';
    n.innerHTML =
      `<div class="nt-head"><img id="notifAppIc" src="${ICON('chrome.webp')}" alt=""><span id="notifApp">Google Chrome</span><span class="sp"></span><span class="nt-dots">…</span><span class="nt-x">${CAP.close}</span></div>` +
      `<div class="nt-body"><div class="notif-ic" id="notifIc"></div><div class="nt-txt"><b id="notifTitle"></b><p id="notifText"></p><small id="notifSrc"></small></div></div>`;
  }

  function init() {
    const tb = document.getElementById('taskbar');
    startDate = parseStart(tb && tb.dataset.start);
    buildTaskbar();
    captionButtons();
    cursors();
    toastMarkup();
    chromeToolbar();
    tick();
    const hook = () => { if (window.Stage) window.Stage.frameFns.add(tick); else requestAnimationFrame(hook); };
    hook();
  }

  /* Chrome toolbar glyphs (Material icons, as Chrome draws them) */
  const SVG = {
    tune: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="19" height="19"><path fill="currentColor" d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" width="19" height="19"><path fill="currentColor" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z" opacity=".9"/></svg>',
    dots: '<svg viewBox="0 0 24 24" width="19" height="19"><path fill="currentColor" d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>',
    person: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="11" fill="#e3e3e3"/><circle cx="12" cy="9.3" r="3.6" fill="#7b7b7b"/><path d="M5.6 18.4c1.4-2.5 3.8-3.7 6.4-3.7s5 1.2 6.4 3.7A9.3 9.3 0 0 1 12 21a9.3 9.3 0 0 1-6.4-2.6z" fill="#7b7b7b"/></svg>',
  };
  /** Chrome toolbar of the browser windows: star inside the address bar, then extensions, profile, menu */
  function chromeToolbar() {
    const omni = document.getElementById('brOmni');
    if (!omni || omni.dataset.w11) return;
    omni.dataset.w11 = '1';
    const bar = omni.parentElement;
    bar.querySelectorAll(':scope > .br-nav').forEach((n) => { if (n.querySelector('[data-icon="star"], [data-icon="puzzle"], [data-icon="dots"]')) n.remove(); });
    const prof = bar.querySelector(':scope > .br-prof');
    if (prof) prof.remove();
    omni.insertAdjacentHTML('beforeend', '<span class="br-star">' + SVG.star + '</span>');
    omni.insertAdjacentHTML('afterend', '<span class="br-nav">' + SVG.ext + '</span><span class="br-prof w11">' + SVG.person + '</span><span class="br-nav" id="brMenu">' + SVG.dots + '</span>');
  }

  window.Win11 = { now, skipTo, fmt, captionButtons, icon: ICON, CAP, NAMES, SVG };
  init();
})();
