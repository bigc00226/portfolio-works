/*
 * The real Shopify Theme Store (js/themestore-snapshot.js, captured by tools/snapshots/green-base/capture-themestore.js)
 * shown in <iframe>s — the same way public/shared/kit/store-frame.js shows the storefront:
 * the site's own stylesheets inlined in place of their <link>, <base> = this folder (the images are local copies),
 * the site's :hover rules re-targeted at the scripted pointer (StoreFrame.hoverRules), clicks swallowed.
 *
 *   TSFrame.load(iframe, key)          key = 'list' | 'flow' | 'flowSp'
 *   TSFrame.search(doc, 'closed' | 'empty' | 'typed')   the header search of the list, with the site's own classes
 *   TSFrame.typeTarget(doc)            an Engine typing target over the search input (the text is drawn, the input keeps no focus)
 */
(function () {
  const S = window.THEMESTORE_SNAPSHOT;
  const base = () => location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
  let HOVER = null;
  const hover = () => {
    if (HOVER != null) return HOVER;
    return (HOVER = window.StoreFrame.hoverRules(Object.values(S.css).join('\n')));
  };
  const DEMO_CSS = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; scroll-behavior: auto !important; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    [data-demo-hidden] { display: none !important; }
    /* the typed search text (drawn over the input, which keeps no focus) */
    .demo-q { position: absolute; pointer-events: none; white-space: pre; display: flex; align-items: center; }
    .demo-caret { display: inline-block; width: 1.5px; height: 1.15em; margin-left: 1px; background: currentColor; vertical-align: middle; animation: demoBlink 1.06s steps(1) infinite; }
    @keyframes demoBlink { 50% { opacity: 0; } }
    .demo-ime { text-decoration: underline dotted; text-underline-offset: 3px; }
  `;
  const RUNTIME = function () {
    window.__demoHover = (el, on) => {
      document.querySelectorAll('.demo-hover').forEach((n) => n.classList.remove('demo-hover'));
      if (on) for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.add('demo-hover');
    };
    document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('a, button, label, summary, input')) ev.preventDefault(); }, true);
    document.addEventListener('submit', (ev) => ev.preventDefault(), true);
  };
  function build(key) {
    const p = S.pages[key];
    if (!p) throw new Error('theme store page not captured: ' + key);
    let html = p.html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
      const m = tag.match(/\bhref="([^"]+)"/);
      const href = m ? m[1].replace(/&amp;/g, '&') : '';
      return S.css[href] != null ? `<style data-href="${m[1]}">${S.css[href]}</style>` : '';
    });
    html = html.replace(/(\s(?:href|src)=")\/\//g, '$1https://');
    html = html.replace(/<head>|<head\s[^>]*>/, (h) => `${h}<base href="${base()}">`);
    html = html.replace(/<\/head>/, `<style id="demo-css">${DEMO_CSS}${hover()}</style></head>`);
    html = html.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>(${RUNTIME.toString()})();<\/script></body>`);
    return html;
  }
  async function settle(iframe) {
    const doc = iframe.contentDocument;
    // every @font-face now: the frames are loaded while their page is hidden (no layout → fonts would load on first show)
    try { await Promise.race([Promise.all([...doc.fonts].map((f) => f.load().catch(() => {}))), new Promise((r) => setTimeout(r, 8000))]); } catch (e) {}
    const imgs = [...doc.images].filter((i) => !i.complete);
    await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 8000))]);
    await Promise.all([...doc.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
    return doc;
  }

  const SEARCH = {
    open: [['documentElement', 'theme-search-overlay--is-open'], ['body', 'page--search-is-open']],
  };
  window.TSFrame = {
    snapshot: S,
    page(key) { return S.pages[key]; },
    load(iframe, key) {
      const hold = window.Stage ? window.Stage.hold : (p) => p;
      return hold(new Promise((resolve) => {
        iframe.addEventListener('load', async function onLoad() {
          iframe.removeEventListener('load', onLoad);
          const doc = iframe.contentDocument;
          if (key === 'list') window.TSFrame.search(doc, 'closed');
          resolve(await settle(iframe));
        });
        iframe.srcdoc = build(key);
      }));
    },
    /** closed: the plain list · empty: the search open, nothing typed (popular searches) · typed: "flow" and its suggestions */
    search(doc, state) {
      const on = state !== 'closed';
      SEARCH.open.forEach(([el, cls]) => doc[el].classList.toggle(cls, on));
      const box = doc.querySelector('.theme-search');
      if (box) box.classList.toggle('theme-search--is-active', on);
      const sec = (k) => doc.querySelector(`.theme-search__results-section--${k}`);
      if (sec('empty')) sec('empty').classList.toggle('theme-search__results-section--is-visible', state === 'empty');
      if (sec('quick-links')) sec('quick-links').classList.toggle('theme-search__results-section--is-visible', state === 'typed');
      const q = doc.getElementById('q');
      if (q) { q.value = state === 'typed' ? 'flow' : ''; q.setAttribute('value', q.value); }
      const d = doc.querySelector('.demo-q'); if (d && state !== 'typing') d.remove();
    },
    /** an Engine typing target over the search input: the input is emptied, the text is drawn on top with a caret */
    typeTarget(doc) {
      const q = doc.getElementById('q');
      const cs = doc.defaultView.getComputedStyle(q);
      const r = q.getBoundingClientRect(), pr = q.offsetParent.getBoundingClientRect();
      q.value = ''; q.removeAttribute('value'); q.setAttribute('placeholder', '');
      const d = doc.createElement('span');
      d.className = 'demo-q';
      Object.assign(d.style, { left: r.left - pr.left + parseFloat(cs.paddingLeft) + 'px', top: r.top - pr.top + 'px', height: r.height + 'px', font: cs.font, color: cs.color, letterSpacing: cs.letterSpacing });
      q.offsetParent.appendChild(d);
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return {
        cls: { comp: 'demo-ime' },
        render(text, comp) { d.innerHTML = esc(text) + comp + '<span class="demo-caret"></span>'; },
        anchor() { return window.Demo.screenRect(d.querySelector('.demo-caret') || d); },
        done(text) { d.remove(); q.value = text; q.setAttribute('value', text); },
      };
    },
  };
})();
