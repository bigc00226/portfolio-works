/*
 * Renders the captured live storefront (videos/<id>/js/site-snapshot.js, made by tools/snapshot-store.js) inside
 * <iframe>s: each page at PC width (1920px) or smartphone width (390px), as the browser showed it on the live store.
 *
 * The stylesheets are the store's own files (inlined in place of their <link>, url(...) pointing at the local copies).
 * Scripts were removed when capturing; the runtime added here only does demo plumbing: <base>, hidden pointer and
 * scrollbar, the store's :hover rules re-targeted at the scripted pointer, a click guard, lazy images warmed up front.
 *
 * "states" are the temporary looks of a scenario (a step not done yet, a mistake), applied to the loaded document and
 * removed again. Each video registers its own: StoreFrame.STATES.key = { on(doc), off(doc) }.
 */
(function () {
  const S = window.SITE_SNAPSHOT;
  const V = window.VIDEO || {};
  function baseHref() { return location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, ''); }

  function parseBlocks(css) {
    const out = [];
    let i = 0;
    while (i < css.length) {
      const open = css.indexOf('{', i);
      if (open < 0) break;
      const sel = css.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < css.length && depth) { const c = css[j]; if (c === '{') depth++; else if (c === '}') depth--; j++; }
      const body = css.slice(open + 1, j - 1);
      if (/^@(media|supports|layer|container)/.test(sel)) out.push({ sel, children: parseBlocks(body) });
      else out.push({ sel, body });
      i = j;
    }
    return out;
  }
  /** the store's :hover rules re-targeted at .demo-hover (the scripted pointer is not a real mouse) */
  function hoverRules(css) {
    const walk = (blocks) => blocks.map((b) => {
      if (b.children) { const inner = walk(b.children); return inner ? `${b.sel}{${inner}}` : ''; }
      if (!/:hover/.test(b.sel) || b.sel.startsWith('@')) return '';
      return `${b.sel.replace(/:hover/g, '.demo-hover')}{${b.body}}`;
    }).join('');
    try { return walk(parseBlocks(css.replace(/\/\*[\s\S]*?\*\//g, ''))); } catch (e) { return ''; }
  }
  let HOVER = null;
  const hover = () => {
    if (HOVER != null) return HOVER;
    const inline = Object.values(S.pages).flatMap((p) => Object.values(p)).map((h) => (h.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || []).join('\n')).join('\n');
    return (HOVER = hoverRules(Object.values(S.css).join('\n') + '\n' + inline.replace(/<\/?style[^>]*>/g, '')));
  };

  const DEMO_CSS = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; scroll-behavior: auto !important; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    [data-demo-hidden] { display: none !important; }
    .scroll-trigger.scroll-trigger--offscreen, .scroll-trigger.animate--slide-in, .scroll-trigger.animate--fade-in { opacity: 1 !important; transform: none !important; animation: none !important; }
    [data-aos] { opacity: 1 !important; transform: none !important; }
    .demo-flash { animation: demoFlash 1.8s ease both; }
    @keyframes demoFlash { 0%, 40% { outline: 3px solid rgba(0,91,211,.85); outline-offset: 4px; } 100% { outline: 3px solid rgba(0,91,211,0); outline-offset: 4px; } }
    .demo-in { animation: demoIn .6s cubic-bezier(.2,.75,.25,1) both; }
    @keyframes demoIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    ${(V.snapshot && V.snapshot.css) || ''}
  `;

  const RUNTIME = function () {
    window.__demoHover = (el, on) => {
      document.querySelectorAll('.demo-hover').forEach((n) => n.classList.remove('demo-hover'));
      if (on) for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.add('demo-hover');
    };
    document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('a, button, label, summary')) ev.preventDefault(); }, true);
    document.addEventListener('submit', (ev) => ev.preventDefault(), true);
    window.__demoWarm = Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
  };

  function build(page, view) {
    const p = S.pages[page];
    if (!p) throw new Error('page not captured: ' + page);
    let html = p[view] || p.pc;
    html = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
      const m = tag.match(/\bhref="([^"]+)"/);
      const href = m ? m[1].replace(/&amp;/g, '&') : '';
      const media = (tag.match(/\bmedia="([^"]+)"/) || [])[1];
      if (href && S.css[href] != null) return `<style data-href="${m[1]}"${media && media !== 'all' && media !== 'print' ? ` media="${media}"` : ''}>${S.css[href]}</style>`;
      return /fonts\.googleapis/.test(href) ? tag : '';
    });
    // protocol-relative links would resolve against file:// — anything still remote is left to the network
    html = html.replace(/(\s(?:href|src)=")\/\//g, '$1https://');
    html = html.replace(/<head>|<head\s[^>]*>/, (h) => `${h}<base href="${baseHref()}">`);
    html = html.replace(/<\/head>/, `<style id="demo-css">${DEMO_CSS}${hover()}</style></head>`);
    html = html.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>(${RUNTIME.toString()})();<\/script></body>`);
    return html;
  }

  const STATES = {};

  async function settle(iframe) {
    const doc = iframe.contentDocument;
    try { await Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 6000))]); } catch (e) {}
    const imgs = [...doc.images].filter((i) => !i.complete);
    await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 6000))]);
    return doc;
  }

  window.StoreFrame = {
    snapshot: S, build, hoverRules, parseBlocks, STATES,
    /** loads a captured page ("home", "product", …) at view "pc" | "sp" into an iframe with the given states on */
    load(iframe, page, view, o = {}) {
      const hold = window.Stage && !o.noHold ? window.Stage.hold : (p) => p;
      return hold(new Promise((resolve) => {
        iframe.addEventListener('load', async function onLoad() {
          iframe.removeEventListener('load', onLoad);
          const doc = iframe.contentDocument;
          (o.states || []).forEach((k) => { if (STATES[k]) STATES[k].on(doc, view, page); else console.warn('[store] unknown state', k); });
          if (o.before) o.before(doc);
          resolve(await settle(iframe));
        });
        iframe.srcdoc = build(page, view);
      }));
    },
    state(doc, key, on, view, page) { STATES[key][on ? 'on' : 'off'](doc, view, page); },
  };
})();
