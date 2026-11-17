/*
 * Renders the captured ne-auberge.jp page (js/site-snapshot.js) inside <iframe>s.
 *
 *  mode "live"   — the dev server preview and the published site: the HTML exactly as the server ships it, with its
 *                  own CSS files and its own scripts (hero typing, slideshow, scroll reveal, menu). Only demo plumbing
 *                  is added: <base>, a style that hides the real mouse pointer / scrollbar, hover look-alikes for the
 *                  scripted pointer, and a click guard so links do not navigate away.
 *  mode "static" — the page as a design frame on the design-tool canvas: no scripts, every "reveal" in its finished
 *                  state, viewport units pinned to a virtual screen (the iframe is as tall as the whole page).
 */
(function () {
  const S = window.SITE_SNAPSHOT;

  /** "Yu Mincho" alias, filled in by Demo boot when no Mincho font of the site's stack is installed (see engine.js) */
  let fontCss = '';

  function baseHref() { return location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, ''); }

  /* ---- tiny CSS walker: rules (incl. nested @media/@supports) ---- */
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
      if (/^@(media|supports)/.test(sel)) out.push({ sel, children: parseBlocks(body) });
      else out.push({ sel, body });
      i = j;
    }
    return out;
  }
  /** the site's :hover rules re-targeted at .demo-hover (the scripted pointer is not a real mouse) */
  function hoverRules(css) {
    const walk = (blocks) => blocks.map((b) => {
      if (b.children) { const inner = walk(b.children); return inner ? `${b.sel}{${inner}}` : ''; }
      if (!/:hover/.test(b.sel) || b.sel.startsWith('@')) return '';
      return `${b.sel.replace(/:hover/g, '.demo-hover')}{${b.body}}`;
    }).join('');
    return walk(parseBlocks(css));
  }
  const allCss = () => Object.values(S.css).join('\n') + '\n' + [...S.html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const vhFix = (css) => css.replace(/(\d+(?:\.\d+)?)(d|s|l)?vh\b/g, (_, n) => `calc(${n} * var(--demo-vh))`);

  const DEMO_COMMON = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; }
    [data-demo-hidden] { display: none !important; }
    [data-demo-invis] { visibility: hidden !important; }
    .demo-caret { display: inline-block; width: 2px; height: 1em; background: #0d99ff; margin: 0 1px; vertical-align: -0.1em; animation: demoBlink 1s steps(1) infinite; }
    @keyframes demoBlink { 50% { opacity: 0; } }
    .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 2px; text-underline-offset: .18em; text-decoration-skip-ink: none; }
    .demo-ime.conv { text-decoration-style: solid; text-decoration-thickness: 1.5px; }
    .demo-ime.conv.active { text-decoration-thickness: 4px; background: rgba(13,153,255,.25); }
    .demo-pop { animation: demoPop .55s cubic-bezier(.2,.75,.25,1) both !important; }
    @keyframes demoPop { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    .demo-fade { animation: demoFade .6s ease both !important; }
    @keyframes demoFade { from { opacity: 0; } to { opacity: 1; } }
  `;

  // Small runtime for "live" mode: hover look-alike + no navigation on click.
  const LIVE_RUNTIME = function () {
    window.__demoHover = (el, on) => {
      document.querySelectorAll('.demo-hover').forEach((n) => n.classList.remove('demo-hover'));
      if (on) for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.add('demo-hover');
    };
    document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('a')) ev.preventDefault(); }, true);
  };

  /**
   * The site writes photo URLs into CSS custom properties (--hero-img-set: image-set(url(...)), --kv-set, --st-bg-set).
   * A url() inside a custom property resolves against the stylesheet that uses the var(), so the local copies must
   * be addressed absolutely (on the real site they are root-relative /photos/…, which resolves the same everywhere).
   */
  const absAssets = (html) => html.replace(/(["(;\s,]|&#34;)assets\/(photos|logos)\//g, (_, p, d) => `${p}${baseHref()}assets/${d}/`);

  function buildLive() {
    const extra = `<style id="demo-live">${DEMO_COMMON}${hoverRules(allCss())}${fontCss}</style>`;
    let html = absAssets(S.html).replace('<head>', `<head><base href="${baseHref()}">`);
    html = html.replace('</head>', extra + '</head>');
    html = html.replace('</body>', `<script>(${LIVE_RUNTIME.toString()})();<\/script></body>`);
    return html;
  }

  function buildStatic(vhPx) {
    let html = absAssets(S.html).replace('<head>', `<head><base href="${baseHref()}">`);
    html = html.replace('<html lang="ja">', '<html lang="ja" class="intro-seen">');
    // no scripts (the JSON-LD block is data, not a script: kept)
    html = html.replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, '');
    // stylesheet files -> the same CSS inline with viewport units pinned to the virtual screen
    html = html.replace(/<link rel="stylesheet" href="assets\/_astro\/([^"]+)">/g, (_, f) => `<style data-file="${f}">${vhFix(S.css[f] || '')}</style>`);
    html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_, c) => `<style>${vhFix(c)}</style>`);
    const extra = `<style id="demo-static">:root{--demo-vh:${vhPx}px}
      html, body { overflow: hidden !important; }
      *, *::before, *::after { transition: none !important; }
      ${DEMO_COMMON}${fontCss}</style>`;
    html = html.replace('</head>', extra + '</head>');
    return html;
  }

  /** finished state of every scroll/intro effect (what the design shows) */
  function finishStatic(doc) {
    doc.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    doc.querySelectorAll('.kv-late').forEach((el) => el.classList.add('shown'));
  }

  async function settle(iframe) {
    const doc = iframe.contentDocument;
    try { await doc.fonts.ready; } catch (e) {}
    // lazy images load when they come into view (as on the real site); waiting for them hit the 6 s timeout
    const imgs = [...doc.images].filter((i) => !i.complete && i.loading !== 'lazy');
    await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 6000))]);
    return doc;
  }

  window.SiteFrame = {
    snapshot: S,
    setFontCss(css) { fontCss = css || ''; },
    get fontCss() { return fontCss; },
    hoverRules, parseBlocks,
    /** loads the page into an iframe; resolves with its document once fonts + images are ready */
    load(iframe, mode, o = {}) {
      // a page load takes real time: the video clock waits for it (shared/stage.js)
      return (window.Stage ? window.Stage.hold : (p) => p)(new Promise((resolve) => {
        iframe.addEventListener('load', async function onLoad() {
          iframe.removeEventListener('load', onLoad);
          if (mode === 'static') finishStatic(iframe.contentDocument);
          if (o.before) o.before(iframe.contentDocument);
          resolve(await settle(iframe));
        });
        iframe.srcdoc = mode === 'static' ? buildStatic(o.vh || 9) : buildLive();
      }));
    },
    /** the DOM of the page as shipped (for the identity check): the body markup after the page's own scripts ran */
    buildLive, buildStatic,
  };
})();
