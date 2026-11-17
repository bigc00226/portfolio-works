/*
 * Renders the captured notahotel.com page (js/site-snapshot.js) inside <iframe>s.
 *
 *  mode "live"   — the WordPress dev site (localhost:8888) and the published site: the page as the browser shows it,
 *                  with its own CSS (the captured Next.js CSS chunks + YakuHanJP inlined in place of their <link>s,
 *                  the Adobe Fonts kit linked as on the site). The hero / section videos play (muted, looped) from
 *                  the local copies. Demo plumbing only: <base>, a style that hides the real mouse pointer / scrollbar,
 *                  hover look-alikes for the scripted pointer, a click guard so links do not navigate away, and the
 *                  --vh / --vw custom properties the site's own script sets from the window size.
 *  mode "static" — the page as a frame on the design-tool canvas: no video playback (a still frame), viewport units
 *                  pinned to a virtual screen (the iframe is as tall as the whole page).
 */
(function () {
  const S = window.SITE_SNAPSHOT;
  function baseHref() { return window.SITE_BASE || location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, ''); }

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
      if (/^@(media|supports|layer|container)/.test(sel)) out.push({ sel, children: parseBlocks(body) });
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
  const allCss = () => Object.values(S.css).join('\n');
  let hoverCss = null;
  const vhFix = (css) => css.replace(/(\d*\.?\d+)(d|s|l)?vh\b/g, (_, n) => `calc(${n} * var(--demo-vh))`);

  const DEMO_COMMON = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; }
    html::-webkit-scrollbar { display: none; }
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
    img.demo-broken { visibility: hidden; }
    .demo-brokenbox { position: relative; }
    .demo-brokenbox::after { content: ""; position: absolute; left: 0; top: 0; width: 16px; height: 16px; margin: 6px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M2 2h9l3 3v9H2z' fill='%23fff' stroke='%23999'/%3E%3Cpath d='M4 11l3-3 2 2 2-2 1 1' fill='none' stroke='%23c55'/%3E%3C/svg%3E") no-repeat; }
  `;

  // Small runtime for "live" mode: hover look-alike, no navigation on click, and the viewport custom properties the
  // site's script keeps up to date (--vh = 1% of the window height, --vw = 1% of its width).
  const LIVE_RUNTIME = function () {
    window.__demoHover = (el, on) => {
      document.querySelectorAll('.demo-hover').forEach((n) => n.classList.remove('demo-hover'));
      if (on) for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.add('demo-hover');
    };
    document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('a, button')) ev.preventDefault(); }, true);
    const vp = () => {
      const s = document.documentElement.style;
      s.setProperty('--vh', window.innerHeight * 0.01 + 'px');
      s.setProperty('--vw', window.innerWidth * 0.01 + 'px');
    };
    vp();
    window.addEventListener('resize', vp);
    // videos: muted autoplay, as the site starts them from script (the brand movie too: it plays when in view)
    document.querySelectorAll('video').forEach((v) => {
      v.muted = true;
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    });
    // the floating 資料を請求する button: shown once the hero is scrolled past, hidden again over the footer
    const cta = document.querySelector('[data-cta-footer]');
    const foot = document.querySelector('footer');
    const ctaVis = () => {
      if (!cta) return;
      const past = window.scrollY > window.innerHeight * 0.85;
      const atFoot = foot && foot.getBoundingClientRect().top < window.innerHeight - 40;
      const on = past && !atFoot;
      cta.style.transition = 'opacity .4s ease';
      cta.style.opacity = on ? '1' : '0';
      cta.style.pointerEvents = on ? '' : 'none';
    };
    window.addEventListener('scroll', ctaVis, { passive: true });
    ctaVis();
  };

  /** stylesheet <link>s -> the local copy inline (same order, same place); the Adobe Fonts kit stays a link */
  function inlineCss(html, fix) {
    return html.replace(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g, (all, href) => {
      const t = S.css[href];
      if (t == null) return all;
      return `<style data-href="${href}">${fix ? fix(t) : t}</style>`;
    });
  }
  /**
   * Leftovers that would reach the network: root-relative favicon links, and the two hero poster images the live
   * site itself points at but which answer 404 (the hero video covers them there too). Nothing else is remote except
   * the Adobe Fonts kit.
   */
  const noRemote = (html) => html
    .replace(/ href="\/assets\/images\/favicon\/[^"]*"/g, ' href="data:,"')
    .replace(/https:\/\/(?:imagedelivery\.net|images\.microcms-assets\.io)\/[^"');\s]+/g, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
  const noRootRel = noRemote;

  function build(view, mode, o = {}) {
    let html = S.html[view || 'pc'];
    html = noRootRel(html).replace('<head>', `<head><base href="${baseHref()}">`);
    if (mode === 'static') {
      html = inlineCss(html, vhFix).replace(/ loading="lazy"/g, ' loading="eager"');
      html = html.replace(/<video([^>]*?) autoplay=""/g, '<video$1 preload="auto" data-demo-still="1"');
      const vh = o.vh || 9;
      const extra = `<style id="demo-static">:root{--demo-vh:${vh}px}
        html { --vh: ${vh}px !important; --vw: ${(o.w || 1440) / 100}px !important; }
        html, body { overflow: hidden !important; }
        *, *::before, *::after { transition: none !important; }
        ${DEMO_COMMON}</style>`;
      html = html.replace('</head>', extra + '</head>');
    } else {
      html = inlineCss(html).replace(/ loading="lazy"/g, ' loading="eager"');
      if (hoverCss == null) hoverCss = hoverRules(allCss());
      html = html.replace('</head>', `<style id="demo-live">${DEMO_COMMON}${hoverCss}</style></head>`);
      html = html.replace('</body>', `<script>(${LIVE_RUNTIME.toString()})();<\/script></body>`);
    }
    return html;
  }

  /** static frames: a still frame of each video instead of the (404ing on the live site too) poster */
  function stillVideos(doc) {
    doc.querySelectorAll('video[data-demo-still]').forEach((v) => {
      v.muted = true;
      const seek = () => { try { v.currentTime = Math.min(1.2, (v.duration || 2) / 3); } catch (e) {} };
      if (v.readyState >= 1) seek(); else v.addEventListener('loadedmetadata', seek, { once: true });
    });
  }

  async function settle(iframe) {
    const doc = iframe.contentDocument;
    try { await Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 8000))]); } catch (e) {}
    const imgs = [...doc.images].filter((i) => !i.complete && i.loading !== 'lazy');
    await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 6000))]);
    return doc;
  }

  window.SiteFrame = {
    snapshot: S,
    hoverRules, parseBlocks, build,
    /** loads the page into an iframe; resolves with its document once fonts + images are ready */
    load(iframe, mode, o = {}) {
      return (window.Stage ? window.Stage.hold : (p) => p)(new Promise((resolve) => {
        iframe.addEventListener('load', async function onLoad() {
          iframe.removeEventListener('load', onLoad);
          const doc = iframe.contentDocument;
          if (mode === 'static') stillVideos(doc);
          if (o.before) o.before(doc);
          resolve(await settle(iframe));
        });
        iframe.srcdoc = build(o.view, mode, o);
      }));
    },
    /**
     * A component sheet for the design tool: the site's own CSS (all captured stylesheets, the Adobe Fonts kit) and
     * pieces of the captured markup (buttons, a lineup card) laid out on a board.
     */
    loadSheet(iframe, bodyHtml, extraCss = '') {
      const head = S.html.pc.slice(S.html.pc.indexOf('<head>') + 6, S.html.pc.indexOf('</head>'));
      const links = (head.match(/<link rel="stylesheet"[^>]*>/g) || []).join('');
      const html = noRemote(`<!DOCTYPE html><html lang="ja" style="--vh: 9px; --vw: 14.4px;"><head><meta charset="utf-8"><base href="${baseHref()}">` +
        inlineCss(links) +
        `<style>${DEMO_COMMON} html, body { margin: 0; background: transparent; overflow: hidden; } *, *::before, *::after { transition: none !important; } ${extraCss}</style></head>` +
        `<body>${bodyHtml.replace(/ loading="lazy"/g, ' loading="eager"')}</body></html>`);
      return (window.Stage ? window.Stage.hold : (p) => p)(new Promise((resolve) => {
        iframe.addEventListener('load', async function onLoad() {
          iframe.removeEventListener('load', onLoad);
          resolve(await settle(iframe));
        });
        iframe.srcdoc = html;
      }));
    },
  };
})();
