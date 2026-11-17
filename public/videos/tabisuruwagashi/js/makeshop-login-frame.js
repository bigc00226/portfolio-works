/*
 * The real makeshop byGMO login page (js/makeshop-login.js, captured from https://console.makeshop.jp/login) in an
 * iframe, and what the script needs to sign in on it: the two fields (shop ID, password) and the ログイン button.
 * Fields change state the way the page itself does it (Vuetify's classes v-field--focused / --active / --dirty and
 * v-input--focused / --dirty); hover uses the page's own :hover rules (copied as .demo-hover).
 * The shop ID is shown blurred (as everywhere in these videos), the password as the page shows it (•••).
 * Same file in videos/tabisuruwagashi and videos/nissin-store.
 */
(function () {
  'use strict';
  const L = window.MAKESHOP_LOGIN;
  /**
   * The admin sets its text in メイリオ / Meiryo (a font of Japanese Windows). On a PC without it the page falls back to
   * ＭＳ ゴシック; then "Meiryo" is pointed at the local Yu Gothic UI (closer to it, also a Windows font) — the page's own
   * CSS stays as it is. With Meiryo installed nothing changes.
   */
  let alias = null;
  const fontAlias = () => {
    if (alias != null) return alias;
    const has = window.Demo && window.Demo.hasLocalFont ? window.Demo.hasLocalFont(['Meiryo', 'メイリオ']) : true;
    alias = has ? '' : ['メイリオ', 'Meiryo'].map((n) =>
      `@font-face { font-family: "${n}"; font-weight: 400; src: local("Yu Gothic UI Regular"), local("YuGothicUI-Regular"), local("Yu Gothic Regular"); }` +
      `@font-face { font-family: "${n}"; font-weight: 700; src: local("Yu Gothic UI Bold"), local("YuGothicUI-Bold"), local("Yu Gothic Bold"); }`).join(' ');
    return alias;
  };
  const DEMO_CSS = `
    html { scrollbar-width: none; } html::-webkit-scrollbar { display: none; }
    .demo-pii { color: transparent !important; text-shadow: 0 0 7px rgba(16, 22, 61, .75); }
    .demo-caret { position: fixed; z-index: 9999; width: 1px; background: #10163d; pointer-events: none; animation: demoCaret 1.06s steps(1) infinite; }
    @keyframes demoCaret { 50% { opacity: 0; } }
    * { transition-duration: 0s !important; }`;

  /** :hover rules → .demo-hover copies (the pointer of the video is drawn, it never really hovers) */
  function hoverRules(doc) {
    const walk = (list, owner) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const r = list[i];
        if (r.cssRules && !(r instanceof doc.defaultView.CSSStyleRule)) { walk(r.cssRules, r); continue; }
        if (r.selectorText && r.selectorText.includes(':hover')) {
          try { owner.insertRule(r.cssText.replace(r.selectorText, r.selectorText.replace(/:hover/g, '.demo-hover')), i + 1); } catch (e) { /* skip */ }
        }
      }
    };
    for (const s of doc.styleSheets) { try { walk(s.cssRules, s); } catch (e) { /* skip */ } }
  }

  const F = {
    doc: null, frame: null,
    /** shows the page in the iframe (srcdoc: its relative asset paths resolve against the video's folder) */
    load(frame) {
      this.frame = frame;
      const html = L.html.split('__ASSET__').join('').replace('</head>', `<style id="demo-css">${fontAlias()}${DEMO_CSS}</style></head>`);
      return new Promise((resolve) => {
        frame.onload = () => {
          const doc = frame.contentDocument;
          this.doc = doc;
          hoverRules(doc);
          doc.defaultView.__demoHover = (el, on) => el.classList.toggle('demo-hover', on);
          Promise.race([Promise.all([...doc.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))), new Promise((r) => setTimeout(r, 6000))])
            .then(() => (doc.fonts ? doc.fonts.ready : null)).then(() => resolve(doc));
        };
        frame.srcdoc = html;
      });
    },
    /** 0 = ショップID, 1 = パスワード */
    input(i) { return this.doc.querySelectorAll('form input.v-field__input')[i]; },
    button() { return this.doc.querySelector('[data-cy="doLogin"]'); },
    field(i) { const inp = this.input(i); return { inp, f: inp.closest('.v-field'), w: inp.closest('.v-input') }; },
    focus(i, on = true) {
      const { inp, f, w } = this.field(i);
      f.classList.toggle('v-field--focused', on);
      w.classList.toggle('v-input--focused', on);
      f.classList.toggle('v-field--active', on || !!inp.value);
      this.caret(on ? i : -1);
    },
    set(i, text) {
      const { inp, f, w } = this.field(i);
      inp.value = text;
      f.classList.toggle('v-field--dirty', !!text);
      w.classList.toggle('v-input--dirty', !!text);
      if (i === 0) inp.classList.add('demo-pii');
      this.caret(i);
    },
    /** the text caret after the value (the page is never really focused: the keys stay with the video) */
    caret(i) {
      const doc = this.doc;
      let c = doc.querySelector('.demo-caret');
      if (i < 0) { if (c) c.remove(); return; }
      const inp = this.input(i);
      if (!c) { c = doc.createElement('span'); c.className = 'demo-caret'; doc.body.appendChild(c); }
      const cs = doc.defaultView.getComputedStyle(inp);
      const m = doc.createElement('span');
      m.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing};${inp.type === 'password' ? '-webkit-text-security:disc;' : ''}`;
      m.textContent = inp.value;
      doc.body.appendChild(m);
      const w = m.getBoundingClientRect().width;
      m.remove();
      // (fixed: the body is offset for the GMO bar; the page does not scroll while signing in)
      const r = inp.getBoundingClientRect();
      const h = Math.round(parseFloat(cs.fontSize) * 1.25);
      Object.assign(c.style, { left: `${Math.round(r.left + parseFloat(cs.paddingLeft) + w)}px`, top: `${Math.round(r.top + (r.height - h) / 2)}px`, height: `${h}px` });
    },
    /** back to the empty page (a seek that reloads starts here again) */
    reset() { [0, 1].forEach((i) => { this.set(i, ''); this.focus(i, false); }); this.caret(-1); },

    /** types into a field with the IME off; the key display shows ● for each key (no credentials on screen) */
    async type(i, text) {
      const { Ime, KeyStrip, kw } = window.Demo;
      await Ime.setMode(false);
      let v = '';
      for (const ch of text) {
        KeyStrip.key('●');
        v += ch;
        this.set(i, v);
        await kw(1000 / 11 * (0.55 + Math.random() * 0.9));
      }
      KeyStrip.idleHide(700);
    },
    /** shop ID → password → ログイン (resolves when the button was clicked) */
    async signIn({ id, password }) {
      const { clickUi, hoverUi, wait } = window.Demo;
      await clickUi(this.input(0), { kind: 'text', ax: 0.08, after: 60 });
      this.focus(0, true);
      await wait(180);
      await this.type(0, id);
      await wait(260);
      await clickUi(this.input(1), { kind: 'text', ax: 0.08, after: 60 });
      this.focus(0, false);
      this.focus(1, true);
      await wait(180);
      await this.type(1, password);
      await wait(320);
      await hoverUi(this.button(), { kind: 'hand', hold: 220 });
      await clickUi(this.button(), { kind: 'hand', after: 60 });
      this.focus(1, false);
    },
  };
  window.MsLoginFrame = F;

  /** the admin's own icons (js/makeshop-ui.js): <i data-ms-icon="home"></i> */
  window.MsUi = {
    icon: (name) => (window.MAKESHOP_UI.icons[name] || '').replace('<svg ', '<svg aria-hidden="true" '),
    hydrate(root = document) { root.querySelectorAll('[data-ms-icon]').forEach((i) => { i.innerHTML = this.icon(i.dataset.msIcon); }); },
    title: (t) => window.MAKESHOP_UI.titleFormat.replace('%s', t),
    /** the Meiryo alias (see above) for the reconstructed admin screens in the main page */
    fonts() { const css = fontAlias(); if (css && !document.getElementById('ms-font-alias')) document.head.insertAdjacentHTML('beforeend', `<style id="ms-font-alias">${css}</style>`); },
  };
})();
