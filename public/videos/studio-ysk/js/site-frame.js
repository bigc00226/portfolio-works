/*
 * Builds the document that renders the captured STUDIO page inside an <iframe>.
 *  - mode "editor": page shown on the editor canvas (iframe is as tall as the page,
 *                   viewport units are pinned to a virtual 800px screen, no runtime).
 *  - mode "live"  : page shown as the published site (normal scrolling, STUDIO-like
 *                   "appear" animations, in-page anchor scrolling, STUDIO badge).
 */
(function () {
  const S = window.SITE_SNAPSHOT;

  const PLACEHOLDER_ICON =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9aa3ad" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>'
    );

  const EDITOR_CSS = `
    :root { --demo-vh: 8px; }
    html:not(.demo-ready) .StudioCanvas { visibility: hidden; }
    html, body { overflow: hidden !important; background: #fff; }
    [data-demo-bg]::before { background-image: var(--demo-bg) !important; }
    *, *::before, *::after { cursor: none !important; }
    iframe { pointer-events: none; }
    [data-demo-hidden] { display: none !important; }
    [data-demo-measure] { visibility: hidden !important; }
    .demo-pop { animation: demoPop .5s cubic-bezier(.2,.75,.25,1) both; }
    @keyframes demoPop { from { opacity: 0; transform: translateY(6px) scale(.985); } to { opacity: 1; transform: none; } }
    .demo-fadein { animation: demoFade .7s ease both; }
    @keyframes demoFade { from { opacity: 0; } to { opacity: 1; } }
    .demo-imgfade::before { animation: demoFade .8s ease both; }
    [data-demo-noimg] { background-color: #eceef1 !important; background-image: url("${PLACEHOLDER_ICON}") !important;
      background-repeat: no-repeat !important; background-position: center !important; background-size: 56px 56px !important; }
    [data-demo-noimg]::before { opacity: 0 !important; }
    .demo-typing-wrap { display: block; }
    /* STUDIO's reset gives every span sans-serif / #333 / line-height 1: the temporary spans used while typing
       must inherit the text node's real style, or the text would change look when typing ends */
    .demo-typing-wrap, .demo-typing-wrap span { color: inherit; font-family: inherit; line-height: inherit;
      word-spacing: inherit; -webkit-font-smoothing: inherit; transition: none; }
    .demo-caret { display: inline-block; width: 2px; height: 1.05em; background: #2b6cff; margin: 0 1px; vertical-align: -0.15em;
      animation: demoBlink 1s steps(1) infinite; }
    [style*="vertical-rl"] .demo-caret, .demo-vertical .demo-caret { width: 1.05em; height: 2px; }
    @keyframes demoBlink { 50% { opacity: 0; } }
    .demo-selected-text { background: rgba(43,108,255,.22); }
    .demo-embed-ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px;
      background: #eceef1; color: #8b939c; font: 600 18px/1 "Inter", "Noto Sans JP", sans-serif; letter-spacing: .02em; }
    .demo-embed-ph.err { background: #fdeeee; color: #d4373e; box-shadow: inset 0 0 0 2px rgba(212,55,62,.35); }
    /* IME composition: unconverted = dotted underline; converted = solid underline per segment, the active segment
       thick + tint. The underline sits just under the glyphs (text-underline-offset), whatever the font's metrics;
       clip-path trims 1px off both ends of every segment so neighbouring segments' lines are visibly separate. */
    .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 1.5px;
      text-underline-offset: .2em; text-decoration-skip-ink: none; }
    .demo-ime.conv { text-decoration-style: solid; text-decoration-thickness: 1px; clip-path: inset(-1em 1px); }
    .demo-ime.conv.active { text-decoration-thickness: 3px; background: rgba(43,108,255,.12); }
    .demo-vertical .demo-ime.conv { clip-path: inset(1px -1em); }
    /* video annotation for mistakes and their fixes */
    .demo-mark { background: rgba(229,72,77,.16); border-radius: 2px; box-shadow: 0 2px 0 #e5484d; }
    .demo-mark.ok { background: rgba(30,157,87,.14); box-shadow: 0 2px 0 #1e9d57; }
    /* breakpoint switch: lay the page out at the new width at once (STUDIO's elements carry transition: all .3s,
       which would otherwise morph paddings, widths and positions through odd in-between states) */
    html.demo-bp-switch *, html.demo-bp-switch *::before, html.demo-bp-switch *::after { transition: none !important; }
    /* image box dropped into the wrong parent (removed again with Ctrl+Z) */
    .demo-temp-img { flex: none; width: 1200px; height: 650px; max-width: none; position: relative; border-radius: 2px; opacity: .92;
      background: #e4e7eb url("${PLACEHOLDER_ICON}") center / 56px 56px no-repeat; }
  `;

  const LIVE_CSS = `
    html { scroll-behavior: auto; }
    *, *::before, *::after { cursor: none !important; }
    ::-webkit-scrollbar { width: 0; height: 0; }
    html { scrollbar-width: none; }
  `;

  // Small runtime for the published view (no Nuxt): appear animations + anchor scroll.
  const LIVE_RUNTIME = function (appearIds) {
    const els = [];
    appearIds.forEach((id) => document.querySelectorAll('[data-s-' + id + ']').forEach((el) => els.push(el)));
    els.forEach((el) => { el.classList.add('appear'); el.classList.remove('appear-active'); });
    // like STUDIO, an element starts appearing as soon as its first pixel enters the screen
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        el.classList.add('appear-active');
        el.classList.remove('appear');
        setTimeout(() => el.classList.remove('appear-active'), 2200);
      });
    });
    // the scripted pointer is not a real mouse, so :hover never matches: the parent page marks the hovered
    // element (and its ancestors, as :hover would) with .demo-hover, which the site's hover rules also match
    window.__demoHover = (el, on) => {
      document.querySelectorAll('.demo-hover').forEach((n) => n.classList.remove('demo-hover'));
      if (on) for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.add('demo-hover');
    };
    // the parent page starts the animations when the "browser" becomes visible
    let started = false;
    window.__demoStart = () => {
      if (started) return;
      started = true;
      requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((el) => io.observe(el))));
    };
    if (window.parent === window) window.__demoStart();
    const banner = document.querySelector('.studio-banner-popover');
    if (banner && banner.showPopover) { try { banner.showPopover(); } catch (e) {} }
    document.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (!a) return;
      ev.preventDefault();
    }, true);
  };

  function baseHref() {
    return location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
  }

  /**
   * Same CSS, adapted per view without touching the DOM:
   *  - editor: the canvas shows every element in its finished state, as the editor does — the start state of
   *    STUDIO's "appear" animation (.sd[data-s-…].appear { opacity: 0 }) is switched off. (The mobile menu button is
   *    the only node that keeps the class in the captured DOM, so without this it would be invisible at tablet/mobile.)
   *  - live: hover rules also match .demo-hover (see __demoHover); the (hover:hover) media queries stay as they are.
   */
  function cssFor(mode) {
    if (mode === 'editor') return S.css.replace(/(\.sd\[data-s-[0-9A-Za-z-]+\])\.appear(\s*\{)/g, '$1.demo-appear-start$2');
    const keep = [];
    return S.css
      .replace(/\(\s*(any-)?hover\s*:\s*(hover|none)\s*\)/g, (m) => `(__demo_mq_${keep.push(m) - 1}__)`)
      .replace(/:hover\b/g, ':is(:hover,.demo-hover)')
      .replace(/\(__demo_mq_(\d+)__\)/g, (m, i) => keep[+i]);
  }

  window.SiteFrame = {
    snapshot: S,
    buildDoc(mode) {
      // editor mode also gets Noto Sans JP: it is the "default" font a new text starts with
      const fonts = mode === 'editor'
        ? S.fontLinks.concat('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap')
        : S.fontLinks;
      const links = fonts.map((h) => `<link rel="stylesheet" href="${h}">`).join('');
      const extraCss = mode === 'editor' ? EDITOR_CSS : LIVE_CSS;
      const runtime = mode === 'live'
        ? `<script>(${LIVE_RUNTIME.toString()})(${JSON.stringify(S.appearIds)});<\/script>`
        : '';
      return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<base href="${baseHref()}"><title>ワイエス建装</title>` +
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${links}` +
        `<style>${cssFor(mode)}</style><style>${extraCss}</style></head>` +
        `<body>${S.body}${runtime}</body></html>`;
    },
    /** Loads the snapshot into an iframe and resolves once fonts + images are ready. */
    load(iframe, mode) {
      // a page load takes real time: the video clock waits for it (shared/stage.js)
      return (window.Stage ? window.Stage.hold : (p) => p)(new Promise((resolve) => {
        iframe.addEventListener('load', async function onLoad() {
          iframe.removeEventListener('load', onLoad);
          const doc = iframe.contentDocument;
          try { await doc.fonts.ready; } catch (e) {}
          const imgs = [...doc.images].filter((i) => !i.complete);
          await Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
          resolve(doc);
        });
        iframe.srcdoc = this.buildDoc(mode);
      }));
    },
  };
})();
