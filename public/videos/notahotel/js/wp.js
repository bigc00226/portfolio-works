/*
 * The WordPress screens of the video are the REAL wp-admin: each one was captured from WordPress itself
 * (WordPress Playground, see tools/snapshots/notahotel/capture-wp-admin.js) into js/wp-snapshot.js — its HTML after
 * WordPress' own scripts ran and its stylesheets byte-for-byte. Here each screen is shown in an iframe of the browser
 * window; the scripted pointer works on the real elements (WordPress' :hover / :focus rules are re-targeted at classes,
 * since the pointer is not a real mouse), and the few text boxes the video types into were captured as look-alike
 * boxes with the input's own computed style (focused and unfocused).
 *
 *   WP.show(key)        shows a captured screen (loaded on first use, on the demo clock)
 *   WP.el(sel)          an element of the screen on show (also inside its editor canvas iframe)
 *   WP.title / WP.url   the screen's real document title / address (wp-env: http://localhost:8888)
 *   WP.phpError(on)     the front page with the PHP parse error (WP_DEBUG on) over the dev site
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$ } = D;
  const S = window.SITE_SNAPSHOT;
  const WS = window.WP_SNAPSHOT;

  /* house data: the eight cards of the live lineup (ONSEN SUITE is the one entered on screen) */
  // the card images' own file names on the live site (the local copies are WebP)
  const ORIG_EXT = { 'onsensuite-thumnail-v': 'png', 'top-thumnail-suite': 'png', 'irori-2-thumnail': 'jpg', 'top-thumnail-base-l': 'png',
    'yuami-thumnail-v': 'png', rusutsu_thumnail: 'jpg', tokyo_thumnail: 'jpg', 'nature-within-thumnail_326_400': 'png' };
  const H = S.houses.map((h, i) => {
    const type = /EXCLUSIVE/i.test(h.price) || h.href.startsWith('/exclusive') ? 'exclusive' : /キャンセル待ち/.test(h.price) ? 'waitlist' : 'on_sale';
    // (the local copy's name: <original>__<hash>.webp, shortened by tools/lib.js shortAssetPath: <start>-<hash>.webp)
    let base = decodeURIComponent(h.img.split('/').pop()).replace(/\.[a-z]+$/, '').replace(/__.*$/, '');
    if (!ORIG_EXT[base]) { const stem = base.replace(/-[0-9a-f]{10}$/, ''); base = Object.keys(ORIG_EXT).find((k) => k.startsWith(stem)) || base; }
    return { ...h, type, order: i, file: `${base}.${ORIG_EXT[base] || 'png'}` };
  });
  const TYPE_LABEL = { on_sale: '販売中', exclusive: 'EXCLUSIVE', waitlist: 'キャンセル待ち' };

  /* ------------------------------------------------------------------ building a screen */
  const baseHref = () => location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
  /** WordPress' :hover / :focus rules, re-targeted at .demo-hover / .demo-focus (set by the scripted pointer) */
  const stateCache = {};
  function stateRules(key) {
    if (stateCache[key] != null) return stateCache[key];
    const walk = (blocks) => blocks.map((b) => {
      if (b.children) { const inner = walk(b.children); return inner ? `${b.sel}{${inner}}` : ''; }
      if (b.sel.startsWith('@') || !/:(hover|focus)/.test(b.sel)) return '';
      const sel = b.sel.replace(/:hover/g, '.demo-hover').replace(/:focus-visible/g, '.demo-focus').replace(/:focus-within/g, '.demo-focus-within').replace(/:focus\b/g, '.demo-focus');
      return `${sel}{${b.body}}`;
    }).join('');
    return (stateCache[key] = walk(window.SiteFrame.parseBlocks(WS.css[key] || '')));
  }
  const DEMO_CSS = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; } ::-webkit-scrollbar { display: none; }
    .demo-caret { display: inline-block; width: 1px; height: 1.15em; background: currentColor; margin: 0 0 0 1px; vertical-align: -0.2em; animation: demoBlink 1s steps(1) infinite; }
    @keyframes demoBlink { 50% { opacity: 0; } }
    .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-underline-offset: .2em; text-decoration-skip-ink: none; }
    .demo-ime.conv { text-decoration-style: solid; }
    .demo-ime.conv.active { text-decoration-thickness: 3px; background: rgba(56,88,233,.2); }
  `;
  const RUNTIME = function () {
    window.__demoHover = (el, on) => {
      document.querySelectorAll('.demo-hover').forEach((n) => n.classList.remove('demo-hover'));
      if (on) for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.add('demo-hover');
    };
    document.addEventListener('click', (ev) => ev.preventDefault(), true);
    document.addEventListener('submit', (ev) => ev.preventDefault(), true);
  };
  function build(page) {
    const keys = [];
    let html = page.html.replace(/<link data-demo-css="([0-9a-f]+)"( media="[^"]*")?( data-demo-disabled="")?>/g, (m, k, media, dis) => {
      if (dis) return '';
      keys.push(k);
      return `<style data-css="${k}"${media || ''}>${(WS.css[k] || '').replace(/<\/style/gi, '<\\/style')}</style>`;
    });
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref()}">`);
    html = html.replace(/<\/head>/i, `<style id="demo-wp">${DEMO_CSS}${keys.map(stateRules).join('')}</style></head>`);
    html = html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `<script>(${RUNTIME.toString()})();<\/script></body>`);
    return html;
  }
  async function settle(doc) {
    try { await Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 6000))]); } catch (e) {}
    const imgs = [...doc.images].filter((i) => !i.complete);
    await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 6000))]);
  }
  /** loads a captured page (and the iframes inside it) into an iframe */
  function loadInto(iframe, page) {
    return new Promise((resolve) => {
      iframe.addEventListener('load', async function onLoad() {
        iframe.removeEventListener('load', onLoad);
        const doc = iframe.contentDocument;
        const subs = [...doc.querySelectorAll('iframe[data-demo-frame]')];
        await Promise.all(subs.map((f) => (page.frames && page.frames[f.dataset.demoFrame] ? loadInto(f, page.frames[f.dataset.demoFrame]) : null)));
        await settle(doc);
        resolve(doc);
      });
      iframe.srcdoc = build(page);
    });
  }
  const hold = (p) => (window.Stage ? window.Stage.hold(p) : p);

  /* ------------------------------------------------------------------ WP */
  const WP = {
    frames: {},
    screen: '',
    H,
    page() { return $('#wpPage'); },
    has(key) { return !!WS.pages[key]; },
    /** loads screens up front (hidden), so showing them later is instant */
    preload(keys) {
      return hold(Promise.all(keys.filter((k) => !this.frames[k]).map((k) => {
        const p = WS.pages[k];
        const f = document.createElement('iframe');
        f.className = 'wpf';
        f.dataset.wp = k;
        f.title = p.title;
        f.style.width = p.w + 'px';
        f.style.height = p.h + 'px';
        this.page().appendChild(f);
        this.frames[k] = f;
        return loadInto(f, p);
      })));
    },
    async show(key) {
      if (!this.frames[key]) await this.preload([key]);
      $$('.wpf', this.page()).forEach((f) => f.classList.toggle('on', f.dataset.wp === key));
      this.screen = key;
      return this.doc(key);
    },
    doc(key = this.screen) { const f = this.frames[key]; return f && f.contentDocument; },
    /** documents of a screen: the page and its iframes (the block editor canvas) */
    docs(key = this.screen) {
      const out = [];
      const add = (d) => { if (!d) return; out.push(d); d.querySelectorAll('iframe').forEach((f) => { try { add(f.contentDocument); } catch (e) {} }); };
      add(this.doc(key));
      return out;
    },
    el(sel, key) { for (const d of this.docs(key)) { const e = d.querySelector(sel); if (e) return e; } return null; },
    els(sel, key) { return this.docs(key).flatMap((d) => [...d.querySelectorAll(sel)]); },
    title(key = this.screen) { return WS.pages[key].title; },
    url(key = this.screen) { return WS.pages[key].url; },
    /** a captured text box: focused look on / off */
    focus(el, on) {
      if (!el.dataset.demoBlur) el.dataset.demoBlur = el.getAttribute('style') || '';
      el.setAttribute('style', on ? `${el.dataset.demoBlur};${el.dataset.demoFocus || ''}` : el.dataset.demoBlur);
    },
    field(k, key) { return this.el(`[data-demo-input="${k}"]`, key); },

    /* the PHP parse error (WP_DEBUG on): the real page WordPress serves, over the dev site */
    async phpError(on) {
      const e = $('#phpErr');
      if (!on) { e.classList.remove('show'); return; }
      if (!e.querySelector('iframe')) {
        const f = document.createElement('iframe');
        f.title = 'localhost:8888';
        e.appendChild(f);
        await hold(loadInto(f, WS.pages['php-error']));
      }
      e.classList.add('show');
    },
    errorDoc() { const f = $('#phpErr iframe'); return f && f.contentDocument; },
    /** the house was published (a hook for tools/snapshots/notahotel/capture-wp-admin.js) */
    published() {},
  };

  window.WP = WP;
  window.WPData = { H, TYPE_LABEL };
})();
