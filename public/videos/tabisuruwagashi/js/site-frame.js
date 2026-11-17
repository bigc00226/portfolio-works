/*
 * Renders the captured www.tabisuruwagashi.com top page (js/site-snapshot.js) inside <iframe>s.
 *
 * The page is the DOM the browser built on the live shop (makeshop's output + the lists the page fetches from
 * WordPress + the review widget), at PC width (1920px) and smartphone width (360px). Its stylesheets are the shop's own
 * files (inlined in place of their <link>, unchanged except for url(...) pointing at the local image copies).
 * Scripts were removed when capturing; a tiny runtime re-creates what the shop's own script does on screen
 * (main-visual slider autoplay, global nav hiding on scroll, back-to-top button) and adds demo plumbing only:
 * <base>, hidden mouse pointer / scrollbar, hover look-alikes for the scripted pointer, a click guard.
 *
 * "states" are the temporary mistakes of the scenario, applied to the loaded document and removed again:
 *   typo    — the 新着商品 heading committed as 新着賞品
 *   wpEmpty — the WordPress-fed lists stay empty (wrong baseUrl in the top-page JavaScript)
 *   spGap   — the smartphone header without the 8px icon gap (logo and icons collide at 360px)
 */
(function () {
  const S = window.SITE_SNAPSHOT;
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
  /** the shop's :hover rules re-targeted at .demo-hover (the scripted pointer is not a real mouse) */
  function hoverRules(css) {
    const walk = (blocks) => blocks.map((b) => {
      if (b.children) { const inner = walk(b.children); return inner ? `${b.sel}{${inner}}` : ''; }
      if (!/:hover/.test(b.sel) || b.sel.startsWith('@')) return '';
      return `${b.sel.replace(/:hover/g, '.demo-hover')}{${b.body}}`;
    }).join('');
    return walk(parseBlocks(css.replace(/\/\*[\s\S]*?\*\//g, '')));
  }
  let HOVER = null;
  const hover = () => HOVER || (HOVER = hoverRules(Object.values(S.css).join('\n')));

  const DEMO_CSS = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; }
    html::-webkit-scrollbar { display: none; }
    [data-demo-hidden] { display: none !important; }
    .demo-flash { animation: demoFlash 1.6s ease both; }
    @keyframes demoFlash { 0%, 40% { outline: 3px solid rgba(30,157,87,.9); outline-offset: 4px; } 100% { outline: 3px solid rgba(30,157,87,0); outline-offset: 4px; } }
  `;

  // Runs inside the page: what the shop's own script does on screen + hover / click plumbing.
  const RUNTIME = function () {
    window.__demoHover = (el, on) => {
      document.querySelectorAll('.demo-hover').forEach((n) => n.classList.remove('demo-hover'));
      if (on) for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.add('demo-hover');
    };
    document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('a, button')) ev.preventDefault(); }, true);

    // lazy images: fetch + decode them up front (into the memory cache) so a fast scripted scroll never shows a gap;
    // the page's own <img loading="lazy"> elements are left untouched
    const warm = new Set();
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { const s = img.getAttribute('src'); if (s) warm.add(s); });
    document.querySelectorAll('picture source[srcset]').forEach((s) => { if (!s.media || matchMedia(s.media).matches) warm.add(s.getAttribute('srcset').split(',')[0].trim().split(/s+/)[0]); });
    window.__demoWarm = Promise.all([...warm].map((src) => { const i = new Image(); i.src = src; return i.decode ? i.decode().catch(() => {}) : null; }));

    // global nav hides while scrolling down, back-to-top shows below 200px (as the shop's script does)
    let last = 0;
    const gnav = document.querySelector('.p-gnav');
    const top = document.querySelector('#js-back-to-top');
    window.addEventListener('scroll', () => {
      const y = window.pageYOffset;
      if (gnav) gnav.classList.toggle('is-hidden', y >= last && y > 100);
      last = y;
      if (top) top.classList.toggle('is-hidden', y <= 200);
    });

    // main visual: Swiper (loop, speed 1000, autoplay 3000) — slides are as wide as their container
    const box = document.querySelector('#M_slider_clone');
    const wrap = box && box.querySelector('.swiper-wrapper');
    if (wrap) {
      const capW = parseFloat(box.getAttribute('data-demo-w')) || box.getBoundingClientRect().width;
      const m = /translate3d\((-?[\d.]+)px/.exec(wrap.style.transform || '');
      let idx = m ? Math.round(-parseFloat(m[1]) / capW) : 0;
      const slides = () => [...wrap.querySelectorAll(':scope > .swiper-slide')];
      const bullets = () => [...document.querySelectorAll('.swiper-pagination-bullet')];
      const W = () => box.getBoundingClientRect().width;
      const mark = () => {
        const s = slides();
        s.forEach((el, i) => {
          el.classList.toggle('swiper-slide-active', i === idx);
          el.classList.toggle('swiper-slide-prev', i === idx - 1);
          el.classList.toggle('swiper-slide-next', i === idx + 1);
        });
        const act = s[idx] && +s[idx].getAttribute('data-swiper-slide-index');
        bullets().forEach((b, i) => b.classList.toggle('swiper-pagination-bullet-active', i === act));
      };
      const layout = () => {
        const w = W();
        slides().forEach((el) => { el.style.width = w + 'px'; });
        wrap.style.transitionDuration = '0ms';
        wrap.style.transform = `translate3d(${-idx * w}px, 0px, 0px)`;
      };
      layout();
      mark();
      window.addEventListener('resize', layout);
      setInterval(() => {
        if (document.hidden || window.__demoSliderPaused) return;
        idx++;
        wrap.style.transitionDuration = '1000ms';
        wrap.style.transform = `translate3d(${-idx * W()}px, 0px, 0px)`;
        mark();
        setTimeout(() => {
          // loop: the slide that left on the left goes to the end (Swiper's loop mode re-orders the same way)
          const first = slides()[0];
          wrap.appendChild(first);
          idx--;
          layout();
          mark();
        }, 1050);
      }, 4000);
    }
  };

  function build(view) {
    let html = S.html[view];
    // stylesheet <link>s -> the same CSS inline (local image paths); web fonts stay remote
    html = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
      const m = tag.match(/\bhref="([^"]+)"/);
      const href = m ? m[1].replace(/&amp;/g, '&') : '';
      if (href && S.css[href] != null) return `<style data-href="${m[1]}">${S.css[href]}</style>`;
      return tag;
    });
    html = html.replace('<head>', `<head><base href="${baseHref()}">`);
    html = html.replace('</head>', `<style id="demo-css">${DEMO_CSS}${hover()}</style></head>`);
    html = html.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>(${RUNTIME.toString()})();<\/script></body>`);
    return html;
  }

  /* ------------------------------------------------------------------ mistake states */
  const STATES = {
    typo: {
      on(doc) {
        const h = [...doc.querySelectorAll('.c-heading-jp')].find((e) => e.textContent.trim() === '新着商品');
        if (h) { h.dataset.demoOrig = h.textContent; h.textContent = '新着賞品'; }
      },
      off(doc) { doc.querySelectorAll('[data-demo-orig]').forEach((h) => { h.textContent = h.dataset.demoOrig; delete h.dataset.demoOrig; }); },
    },
    wpEmpty: {
      sel: '.js-topics, .js-recommend, .js-journal, #js-posts, .js-post-important',
      on(doc) {
        doc.querySelectorAll(this.sel).forEach((el) => { el.__demo = el.innerHTML; el.innerHTML = ''; });
        const bar = doc.querySelector('.top-info-bar');
        if (bar) { bar.__demoCls = bar.className; bar.classList.add('is-hidden'); }
      },
      off(doc) {
        doc.querySelectorAll(this.sel).forEach((el) => { if (el.__demo != null) { el.innerHTML = el.__demo; el.__demo = null; } });
        const bar = doc.querySelector('.top-info-bar');
        if (bar && bar.__demoCls != null) bar.className = bar.__demoCls;
      },
    },
    spGap: {
      re: /\s*\/\*[^*]*スマホ[^*]*\*\/\s*@media screen and \(max-width: 767px\) \{\s*\.p-header__menu-list \{ gap: 8px; \}\s*\}/,
      on(doc) {
        const st = [...doc.querySelectorAll('style')].find((s) => this.re.test(s.textContent));
        if (st) { st.__demo = st.textContent; st.textContent = st.textContent.replace(this.re, ''); }
      },
      off(doc) { doc.querySelectorAll('style').forEach((s) => { if (s.__demo != null) { s.textContent = s.__demo; s.__demo = null; } }); },
    },
  };

  async function settle(iframe) {
    const doc = iframe.contentDocument;
    try { await Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 6000))]); } catch (e) {}
    const imgs = [...doc.images].filter((i) => !i.complete && i.loading !== 'lazy');
    await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 6000))]);
    return doc;
  }

  window.SiteFrame = {
    snapshot: S,
    build, hoverRules, parseBlocks, STATES,
    /** loads the page (view "pc" | "sp") into an iframe with the given mistake states on; resolves with its document */
    load(iframe, view, o = {}) {
      // a page load takes real time: the video clock waits for it (shared/stage.js)
      return (window.Stage ? window.Stage.hold : (p) => p)(new Promise((resolve) => {
        iframe.addEventListener('load', async function onLoad() {
          iframe.removeEventListener('load', onLoad);
          const doc = iframe.contentDocument;
          (o.states || []).forEach((k) => STATES[k].on(doc));
          if (o.before) o.before(doc);
          resolve(await settle(iframe));
        });
        iframe.srcdoc = build(view);
      }));
    },
    state(doc, key, on) { STATES[key][on ? 'on' : 'off'](doc); },
  };
})();
