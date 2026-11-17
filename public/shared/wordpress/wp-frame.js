/*
 * The real WordPress screens of a video (captured from WordPress itself by tools/wp/playground.js into the video's
 * js/wp-snapshot.js — window.WP_SNAPSHOT) shown in the browser window, one iframe per screen.
 * The scripted pointer works on the real elements: WordPress' :hover / :focus rules are re-targeted at .demo-hover /
 * .demo-focus (the pointer is not a real mouse), clicks never navigate, and the text boxes the video types into were
 * captured as look-alike boxes (data-demo-input) with the input's own computed style, focused and unfocused.
 *
 * Markup: a browser page <div class="br-page" data-page="wp" id="wpPage"></div> (CSS: public/shared/wordpress/wp.css).
 *
 *   WP.preload(keys)     loads screens up front (hidden) so showing them later is instant (on the demo clock)
 *   WP.show(key)         shows a captured screen (scrolled where it was captured) → its document
 *   WP.el(sel) / WP.els(sel)   elements of the screen on show (also inside its iframes, e.g. the block editor canvas)
 *   WP.title() / WP.url()      the screen's real document title / address (for the browser tab)
 *   WP.field(name)       a captured text box (data-demo-input="name");  WP.focus(box, on) its focused look
 *   WP.typeInto(name)    a target for Demo.typeInto() that types into that box (IME composition included)
 *   WP.scroll(y, ms)     scrolls the screen on show
 *   WP.data              WP_SNAPSHOT.data (ids, names … the capture script stored for the video)
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$ } = D;
  const WS = window.WP_SNAPSHOT || { pages: {}, css: {}, data: {} };

  const baseHref = () => location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
  function parseBlocks(css) {
    if (window.StoreFrame && window.StoreFrame.parseBlocks) return window.StoreFrame.parseBlocks(css);
    const out = [];
    let i = 0;
    while (i < css.length) {
      const open = css.indexOf('{', i);
      if (open < 0) break;
      const sel = css.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      const body = css.slice(open + 1, j - 1);
      if (/^@(media|supports|layer|container)/.test(sel)) out.push({ sel, children: parseBlocks(body) });
      else out.push({ sel, body });
      i = j;
    }
    return out;
  }
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
    try { stateCache[key] = walk(parseBlocks((WS.css[key] || '').replace(/\/\*[\s\S]*?\*\//g, ''))); } catch (e) { stateCache[key] = ''; }
    return stateCache[key];
  }
  const DEMO_CSS = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; } ::-webkit-scrollbar { display: none; }
    .demo-caret { display: inline-block; width: 1px; height: 1.15em; background: currentColor; margin: 0 0 0 1px; vertical-align: -0.2em; animation: demoBlink 1s steps(1) infinite; }
    @keyframes demoBlink { 50% { opacity: 0; } }
    .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 1.5px; text-underline-offset: .2em; text-decoration-skip-ink: none; }
    .demo-ime.conv { text-decoration-style: solid; }
    .demo-ime.conv.active { text-decoration-thickness: 3px; background: rgba(56,88,233,.2); }
    [data-demo-input]:empty::before { content: attr(data-demo-placeholder); color: #8c8f94; }
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
        if (page.scroll && (page.scroll[0] || page.scroll[1])) doc.defaultView.scrollTo(page.scroll[0], page.scroll[1]);
        resolve(doc);
      });
      iframe.srcdoc = build(page);
    });
  }
  const hold = (p) => (window.Stage ? window.Stage.hold(p) : p);

  const WP = {
    frames: {},
    screen: '',
    data: WS.data || {},
    snapshot: WS,
    page() { return $('#wpPage'); },
    has(key) { return !!WS.pages[key]; },
    preload(keys) {
      return hold(Promise.all(keys.filter((k) => !this.frames[k]).map((k) => {
        const p = WS.pages[k];
        if (!p) throw new Error('WP: no captured screen "' + k + '"');
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
    focus(el, on) {
      if (!el.dataset.demoBlur) el.dataset.demoBlur = el.getAttribute('style') || '';
      el.setAttribute('style', on ? `${el.dataset.demoBlur};${el.dataset.demoFocus || ''}` : el.dataset.demoBlur);
      el.classList.toggle('demo-focus', !!on);
    },
    field(name, key) { return this.el(`[data-demo-input="${name}"]`, key); },
    /** a target for Demo.typeInto(): the text goes into the look-alike box, with the caret / IME composition drawn */
    typeInto(name, key, o = {}) {
      const box = this.field(name, key);
      if (!box) throw new Error('WP: no text box "' + name + '"');
      const t = D.frameTextTarget(box, o);   // (o.base: text already in the box)
      return { ...t, render(text, comp) { t.render(text, comp); box.scrollLeft = box.scrollWidth; box.scrollTop = box.scrollHeight; } };
    },
    /** the box loses the focus: no caret, unfocused look */
    blur(name, key) { const box = this.field(name, key); if (!box) return; const c = box.querySelector('.demo-caret'); if (c) c.remove(); this.focus(box, false); },
    value(name, key) { const b = this.field(name, key); return b ? b.textContent : ''; },
    async scroll(y, ms = 600) {
      const win = this.doc().defaultView;
      const from = win.scrollY, to = typeof y === 'number' ? y : y.getBoundingClientRect().top + from - 120;
      if (!ms || window.Stage && window.Stage.Clock.ff) { win.scrollTo(0, to); return; }
      await D.tween(ms, (k) => win.scrollTo(0, from + (to - from) * D.Ease.inOut(k)));
    },
  };

  window.WP = WP;
})();
