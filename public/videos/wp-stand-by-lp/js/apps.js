/*
 * What this video adds to the shared kit:
 *   LP.wp(key)        a real WordPress screen (js/wp-snapshot.js, shared/wordpress/wp-frame.js) in the 'wp' tab, with its
 *                     real title and address; the Customizer's preview frame shows the live site (js/site-snapshot.js)
 *   LP.canvas …       the block editor's canvas (an iframe): its scroll carried over between captured steps, the blocks
 *                     selected (as the editor draws a selection), text typed into a block
 *   LP.cm …           typing into 追加 CSS (the Customizer's CodeMirror): the typed lines are revealed in the captured
 *                     editor, the line numbers below follow
 *   the states of the live pages before the work (StoreFrame.STATES): one campaign banner, the old image button at
 *   the bottom (the theme's own markup and image), 追加 CSS without the new parts
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES;
  const { $, wait, esc, screenRect, Caption } = D;
  const { Browser } = K;
  const WS = window.WP_SNAPSHOT;
  const LIVE = 'https://stand-by.jp';

  /* ================================================================ live pages: states before the work */
  const ST = window.StoreFrame.STATES;
  const customCss = (doc) => doc.getElementById('wp-custom-css');
  const PC_RULE = (WS.data.css && WS.data.css.pc) || '';
  const cut = (css, part) => css.split(part).join('');
  ST.oneBanner = {
    on(doc) { doc.querySelectorAll('.campaign-container a[href$="campaign_202612"]').forEach((a) => a.setAttribute('data-demo-hidden', '')); },
    off(doc) { doc.querySelectorAll('.campaign-container a[data-demo-hidden]').forEach((a) => a.removeAttribute('data-demo-hidden')); },
  };
  /** the old fixed button (the block the live footer.php has commented out), the new one not there yet */
  const OLD_BTN = (base) => `<div id="bottomWebBtn" data-demo-old>
<a href="https://standby.b4a.clinic/" target="_blank">
<picture>
<source srcset="${base}assets/img/webp/web_btn_bottom.webp" type="image/webp">
<img src="${base}assets/img/webp/web_btn_bottom.webp" alt="WEB予約／24時間受付">
</picture>
</a>
</div>`;
  const THEME = 'assets/site/stand-by.jp/wp/wp-content/themes/stand_by_beauty_clinic/';
  ST.oldCta = {
    on(doc) {
      doc.querySelectorAll('.sticky-footer-wrap').forEach((e) => e.setAttribute('data-demo-hidden', ''));
      if (!doc.querySelector('[data-demo-old]')) (doc.getElementById('standWrap') || doc.body).insertAdjacentHTML('beforeend', OLD_BTN(THEME));
    },
    off(doc) { doc.querySelectorAll('.sticky-footer-wrap').forEach((e) => e.removeAttribute('data-demo-hidden')); doc.querySelectorAll('[data-demo-old]').forEach((e) => e.remove()); },
  };
  /** 追加 CSS without the fixed buttons' rules (the markup is deployed, the CSS not yet: plain links at the bottom) */
  ST.cssBefore = {
    on(doc) { const s = customCss(doc); if (s) { s.dataset.demo = s.textContent; s.textContent = cut(cut(s.textContent, F.STICKY_CSS), PC_RULE); } },
    off(doc) { const s = customCss(doc); if (s && s.dataset.demo) { s.textContent = s.dataset.demo; delete s.dataset.demo; } },
  };
  /** 追加 CSS with the fixed buttons but without the rule that hides them on PC */
  ST.cssPasted = {
    on(doc) { const s = customCss(doc); if (s) { s.dataset.demo = s.textContent; s.textContent = cut(s.textContent, PC_RULE); } },
    off(doc) { const s = customCss(doc); if (s && s.dataset.demo) { s.textContent = s.dataset.demo; delete s.dataset.demo; } },
  };

  /* ================================================================ WordPress screens */
  /**
   * notices only the Playground prints (its wp-cron is off, its wp-content is world-writable): a production server
   * shows neither, so they are taken out of the screens (WP Super Cache's settings)
   */
  const PLAYGROUND_ONLY = /CRON システムは停止中|が書き込み可能になっています/;
  const cleaned = new Set();
  /**
   * the capture keeps the window's scroll, not an element's: 追加 CSS (CodeMirror) is scrolled back to the line it showed
   * when captured (the capture script scrolled it to 14 lines above the place being edited)
   */
  const CM_TOP = { cz: 'atLine', 'cz-pasted': 'atLine', 'cz-final': 'pcLine', 'cz-saved': 'pcLine' };
  /**
   * the block editor's canvas: the capture lost the rule that sets its text in the system sans-serif (WordPress' default
   * editor styles, as the capture's own screenshots show it), leaving the reset's "font-family: serif" — put back here
   */
  const EDITOR_FONT = 'html body.editor-styles-wrapper{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif}';
  const prepared = new Set();
  function prep(key) {
    if (prepared.has(key)) return;
    prepared.add(key);
    WP.docs(key).forEach((d) => {
      d.querySelectorAll('.notice, .error, .updated, #message').forEach((n) => { if (PLAYGROUND_ONLY.test(n.textContent)) n.remove(); });
      if (d.body && d.body.classList.contains('editor-styles-wrapper')) d.head.insertAdjacentHTML('beforeend', `<style id="demo-editor-font">${EDITOR_FONT}</style>`);
      // a media file's address shown in a text box (メディアライブラリ「ファイルの URL」): the capture made it the local
      // copy's path (assets/wp/…, converted to WebP) — the address WordPress shows is the uploaded file's
      d.querySelectorAll('input[value^="assets/wp/"]').forEach((i) => i.setAttribute('value', `${LIVE}/wp/${i.getAttribute('value').slice('assets/wp/'.length).replace(/\.webp$/, '.png')}`));
    });
  }
  function clean(key) {
    if (cleaned.has(key)) return;
    cleaned.add(key);
    if (CM_TOP[key] && WS.data.css) {
      const doc = WP.doc(key);
      const sc = doc.querySelector('.CodeMirror-scroll');
      const l = LP.cm.line(WS.data.css[CM_TOP[key]] - 14, doc);
      if (sc && l) sc.scrollTop += l.div.getBoundingClientRect().top - sc.getBoundingClientRect().top - 4;
    }
  }

  const LP = {
    LIVE,
    /** shows a captured screen in a WordPress tab (its real title and address; wp-admin has no favicon: Chrome's own icon) */
    async wp(key, o = {}) {
      if (/^cz/.test(key)) await LP.czPreview(key, o.states || []);
      await WP.preload([key]);
      prep(key);
      await WP.show(key);
      Browser.nav(o.tab || 'wp', { title: WP.title(key), url: o.url || WP.url(key), page: 'wp', fav: 'dev' });
      clean(key);   // (laid out now: the WordPress page is on show)
      return WP.doc(key);
    },
    /** replaces a text everywhere in a captured screen (text and aria-label): the publish time shown afterwards */
    setText(key, from, to) {
      WP.docs(key).forEach((d) => {
        const w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) if (n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.split(from).join(to);
        d.querySelectorAll('[aria-label]').forEach((e) => { const a = e.getAttribute('aria-label'); if (a.includes(from)) e.setAttribute('aria-label', a.split(from).join(to)); });
      });
    },

    /* ---------- the block editor's canvas */
    canvasWin(key = WP.screen) { const f = WP.doc(key) && WP.doc(key).querySelector('iframe[name="editor-canvas"]'); return f && f.contentWindow; },
    canvasDoc(key = WP.screen) { const w = LP.canvasWin(key); return w && w.document; },
    /** shows the next captured step at the same place in the canvas */
    async step(key, o = {}) {
      const from = LP.canvasWin();
      const y = from ? from.scrollY : 0;
      await WP.preload([key]);
      prep(key);
      const to = LP.canvasWin(key);
      if (to) to.scrollTo(0, o.y != null ? o.y : y);
      return LP.wp(key, o);
    },
    async canvasScroll(y, ms = 900) {
      const w = LP.canvasWin();
      const from = w.scrollY;
      if (window.Stage.Clock.ff || !ms) { w.scrollTo(0, y); return; }
      await D.tween(ms, (k) => w.scrollTo(0, from + (y - from) * D.Ease.inOut(k)));
    },
    /** the blocks whose text matches (first match onwards, `n` blocks, or up to the block matching `until`) */
    blocks(key, from, until) {
      const all = [...LP.canvasDoc(key).querySelectorAll('.is-root-container > .wp-block')];
      const i = all.findIndex((b) => from.test(b.textContent));
      if (i < 0) return [];
      const j = all.findIndex((b, k) => k > i && until.test(b.textContent));
      return all.slice(i, j < 0 ? all.length : j);
    },
    /** the selection of several blocks as the editor draws it */
    select(blocks, on = true) { blocks.forEach((b) => b.classList.toggle('is-multi-selected', on)); },
    /** the text of a block selected (mouse drag / triple click) */
    selectText(el, on = true) {
      if (on) { el.dataset.demoText = el.innerHTML; el.innerHTML = `<span style="background:#b4d7ff">${el.innerHTML}</span>`; }
      else if (el.dataset.demoText != null) { el.innerHTML = el.dataset.demoText; delete el.dataset.demoText; }
    },

    /* ---------- the Customizer: its preview shows the live site */
    async czPreview(key, states) {
      await WP.preload([key]);
      const f = WP.doc(key).querySelector('#customize-preview iframe');
      if (!f) return;
      const want = JSON.stringify(states);
      if (f.dataset.demoStates === want) return;
      f.dataset.demoStates = want;
      f.removeAttribute('data-demo-frame');
      await window.StoreFrame.load(f, 'home', 'pc', { states });
      // the bottom of the page (the fixed buttons) as the preview opens on it
    },
    czDoc(key = WP.screen) { const f = WP.doc(key).querySelector('#customize-preview iframe'); return f && f.contentDocument; },
    async czScroll(y, ms = 1200) {
      const w = WP.doc().querySelector('#customize-preview iframe').contentWindow;
      const from = w.scrollY;
      if (window.Stage.Clock.ff || !ms) { w.scrollTo(0, y); return; }
      await D.tween(ms, (k) => w.scrollTo(0, from + (y - from) * D.Ease.inOut(k)));
    },

    /* ---------- 追加 CSS (CodeMirror): lines typed into the captured editor */
    cm: {
      lines(doc = WP.doc()) { return [...doc.querySelectorAll('.CodeMirror-code > div')].map((div) => ({ div, pre: div.querySelector('pre'), n: +((div.querySelector('.CodeMirror-linenumber') || {}).textContent || 0) })); },
      line(n, doc) { return LP.cm.lines(doc).find((l) => l.n === n); },
      /**
       * a typing target for Demo.typeInto(): the captured editor already holds the final text; lines from..from+count-1
       * are hidden first and revealed as they are typed (the text typed starts at the end of line from-1)
       */
      target(from, count) {
        const doc = WP.doc();
        const ls = LP.cm.lines(doc);
        const after = ls.filter((l) => l.n >= from + count);
        const mine = ls.filter((l) => l.n >= from && l.n < from + count).sort((a, b) => a.n - b.n);
        const prev = ls.find((l) => l.n === from - 1);
        mine.forEach((l) => { l.full = l.pre.innerHTML; l.text = l.pre.textContent.replace(/​/g, ''); l.div.style.display = 'none'; });
        const prevHtml = prev ? prev.pre.innerHTML : '';
        const caret = '<span class="demo-caret" style="display:inline-block;width:1px;height:1.1em;background:#000;vertical-align:-0.15em"></span>';
        doc.querySelectorAll('.CodeMirror-cursors').forEach((c) => { c.style.visibility = 'hidden'; });
        const truncate = (html, n) => {
          const box = doc.createElement('div');
          box.innerHTML = html;
          let left = n;
          const walk = (node) => {
            for (const c of [...node.childNodes]) {
              if (c.nodeType === 3) { if (left <= 0) c.remove(); else if (c.textContent.length > left) { c.textContent = c.textContent.slice(0, left); left = 0; } else left -= c.textContent.length; } else if (c.nodeType === 1) { if (left <= 0 && c.textContent.length) c.remove(); else walk(c); }
            }
          };
          walk(box);
          return box.innerHTML;
        };
        const self = {
          cls: { comp: 'demo-ime' },
          render(text, comp) {
            const parts = text.split('\n');
            if (prev) prev.pre.innerHTML = prevHtml;
            mine.forEach((l, i) => {
              const shown = i + 1 < parts.length;
              l.div.style.display = shown ? '' : 'none';
              if (!shown) return;
              const t = parts[i + 1];
              l.pre.innerHTML = t.length >= l.text.length ? l.full : truncate(l.full, t.length);
              const pres = l.pre.querySelector('span[role="presentation"]') || l.pre;
              if (!t.length && pres.innerHTML === '') pres.innerHTML = '​';
            });
            // the caret (and the IME composition) at the end of the last line typed
            const last = parts.length > 1 ? mine[parts.length - 2] : prev;
            if (last) (last.pre.querySelector('span[role="presentation"]') || last.pre).insertAdjacentHTML('beforeend', comp + caret);
            // the line numbers below move with the lines typed
            const hidden = count - (parts.length - 1);
            after.forEach((l) => { const num = l.div.querySelector('.CodeMirror-linenumber'); if (num) num.textContent = String(l.n - hidden); });
          },
          anchor() { const c = doc.querySelector('.demo-ime.active') || doc.querySelector('.demo-ime') || doc.querySelector('.demo-caret'); return screenRect(c || doc.body); },
          enter(text) { return '\n' + K.indentAfter(text.split('\n').pop(), '  '); },
          done() { doc.querySelectorAll('.demo-caret').forEach((c) => c.remove()); },
        };
        self.render('', '');
        return self;
      },
    },
  };

  window.LP = LP;
})();
