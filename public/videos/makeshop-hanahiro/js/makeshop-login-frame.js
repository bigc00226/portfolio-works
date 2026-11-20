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

  /*
   * The admin after the login (it needs an account, so it is rebuilt) — the frame of every page as the admin draws it
   * since its navigation renewal of 2026-07-27 (manual.makeshop.jp/hc/ja/articles/60471195341721, the screenshots there):
   *  - left menu (TheNavbarV2): logo + fold button, the shop name (link to the shop), ホーム, then the seven fixed
   *    categories 注文管理 / 商品管理 / 会員管理 / ショップデザイン / 分析・販促管理 / アプリ管理 / ショップ構築 (in this order,
   *    their own icons), each opening to its items (drag handle + name) and 「機能をもっと見る」
   *  - header (TheHeader, 55px): breadcrumbs, the site search field, 機能一覧, the account (avatar + shop ID)
   *  - right side bar (TheSidebar, 82px): お知らせ / マニュアル / サポート一覧 / AIサポート
   * Labels, order, sizes (--width-sidebar 256px, --height-header 55px, --width-right-sidebar-nav 82px, 14px Meiryo) and
   * colours are the admin's own (its public JavaScript / CSS: console.makeshop.jp/assets/*). Items the shop does not
   * need are hidden, as the left menu lets each account choose (表示・非表示・並べ替え).
   * Same file in videos/tabisuruwagashi, nissin-store, makeshop-hanahiro and makeshop-lafayette.
   */
  /** icons of the frame that js/makeshop-ui.js does not carry: the admin's own (/src/assets/icons/*.svg in its bundle) */
  const ICONS2 = {
    drag: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"> <rect width="20" height="20" fill="none" /> <path d="M8.352,9.481A1.852,1.852,0,1,0,10.2,11.333,1.852,1.852,0,0,0,8.352,9.481Zm0,6.481A1.852,1.852,0,1,0,10.2,17.815,1.852,1.852,0,0,0,8.352,15.963ZM14.833,6.7a1.852,1.852,0,1,0-1.852-1.852A1.852,1.852,0,0,0,14.833,6.7ZM8.352,3A1.852,1.852,0,1,0,10.2,4.852,1.852,1.852,0,0,0,8.352,3Zm6.481,12.963a1.852,1.852,0,1,0,1.852,1.852A1.852,1.852,0,0,0,14.833,15.963Zm0-6.481a1.852,1.852,0,1,0,1.852,1.852A1.852,1.852,0,0,0,14.833,9.481Z" transform="translate(-2.056 -1.889)" fill="currentColor" /> </svg>',
    arrow: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"> <rect width="16" height="16" fill="none" /> <path d="M3.96,5.333,0,1.185,1.131,0,6.222,5.333,1.131,10.667,0,9.482Z" transform="translate(13.333 5.333) rotate(90)" fill="currentColor" /> </svg>',
    blank: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"> <path d="M0,0H16V16H0Z" fill="none" /> <path d="M7.667,3V4.333H4.333v9.333h9.333V10.333H15v4a.667.667,0,0,1-.667.667H3.667A.667.667,0,0,1,3,14.333V3.667A.667.667,0,0,1,3.667,3ZM12.8,6.138,9,9.943,8.057,9l3.8-3.8L9.667,3H15V8.333Z" transform="translate(-1 -1)" fill="currentColor" /> </svg>',
    viewList: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"> <path d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4V14Z" fill="currentColor" /> </svg>',
    aiSupport: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 153 135" fill="none"> <path d="M63.0126 102.553C52.2666 102.584 42.693 99.331 36.2746 105.782L20.6228 124.688C19.8371 125.473 18.8361 126.008 17.7464 126.225C16.6567 126.442 15.5272 126.331 14.5007 125.905C13.4743 125.48 12.5969 124.76 11.9796 123.836C11.3622 122.913 10.1918 116.146 10.1917 115.035C10.1917 115.035 8.11892 86.9542 7.94608 65.535M8.323 71.9053C7.61428 71.3821 7.78093 51.9789 9.16019 31.8807C10.0074 19.5352 20.0232 10.0029 32.3769 9.28387C63.9836 7.44417 88.0049 7.46557 119.886 9.28906C132.422 10.0061 142.636 19.7679 143.502 32.2947C144.619 48.4424 144.579 62.0707 143.46 78.2134C142.59 90.7594 132.402 100.578 119.847 101.308C92.4954 102.898 70.8102 103.079 44.9624 101.911" stroke="url(#icon-ai-support-gradient)" stroke-width="15.8255" stroke-linecap="round" stroke-linejoin="round" /> <path d="M100.074 40.2042V45.8091" stroke="#4558C4" stroke-width="15.8255" stroke-linecap="round" stroke-linejoin="round" /> <path d="M52.5971 40.2042V45.8091" stroke="#4558C4" stroke-width="15.8255" stroke-linecap="round" stroke-linejoin="round" /> <path d="M89.9616 68.8008C85.8324 72.7235 74.601 78.2153 62.709 68.8008" stroke="#4558C4" stroke-width="15.83" stroke-linecap="round" /> <defs> <linearGradient id="icon-ai-support-gradient" x1="134.025" y1="16.6434" x2="40.8668" y2="105.693" gradientUnits="userSpaceOnUse" > <stop stop-color="#EA80B7" /> <stop offset="0.471154" stop-color="#6D76DB" /> <stop offset="1" stop-color="#4558C4" /> </linearGradient> </defs> </svg>',
  };
  /** the seven categories of the left menu: fixed order, titles and icons (useTheNavbar / useNavbarLayout) */
  const GROUPS = [['order', 'order', '注文管理'], ['product', 'product', '商品管理'], ['member', 'customer', '会員管理'], ['design', 'design', 'ショップデザイン'],
    ['analysis', 'analysis', '分析・販促管理'], ['app', 'app', 'アプリ管理'], ['config', 'config', 'ショップ構築']];
  /** ShopAvatar: a Vuetify palette colour chosen by SHA-256("<shopId>-<userId>") (precomputed per video: cfg.avatar) */
  const AVATAR = { purple: ['#9c27b0', '#fff'], yellow: ['#ffeb3b', '#000'], 'blue-lighten-3': ['#90caf9', '#000'], 'cyan-lighten-3': ['#80deea', '#000'] };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SHELL_CSS = `
    .ms-adm { font-family: メイリオ, Meiryo, "ＭＳ ゴシック", "Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", sans-serif; font-size: 14px; line-height: 1.5; color: #10163d; background: #fff; }
    .ms-adm .msv { position: absolute; inset: 0; }
    .msv-nav { position: absolute; left: 0; top: 0; bottom: 0; width: 256px; box-sizing: border-box; background: #f2f4fc; border-right: 1px solid #cad1e0; overflow-x: hidden; overflow-y: auto; scrollbar-width: none; padding: 24px 8px 16px; z-index: 2; }
    .msv-nav::-webkit-scrollbar { display: none; }
    .msv-head { padding: 0 8px 16px; }
    .msv-head-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .msv-logo { display: block; width: 142px; height: 44px; margin-left: -8px; }
    .msv-fold { width: 24px; height: 24px; display: grid; place-items: center; color: #4558c4; }
    .msv-fold svg { width: 18px; height: 18px; }
    .msv-shop { margin-top: 24px; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: #4558c4; line-height: 21px; }
    .msv-shop svg { width: 16px; height: 16px; flex: none; }
    .msv-shop.is-hover { text-decoration: underline; }
    .msv-list { padding: 0 4px 0 0; }
    .msv-it { display: flex; align-items: center; gap: 12px; min-height: 36px; padding: 0 12px 0 12px; margin-bottom: 4px; border-radius: 4px; color: #10163d; white-space: nowrap; }
    .msv-it > i { display: grid; width: 18px; height: 18px; color: #7b83ad; flex: none; }
    .msv-it > i svg { width: 18px; height: 18px; }
    .msv-it.grp b { font-weight: 700; }
    .msv-it .chev { margin-left: auto; width: 16px; height: 16px; color: #7b83ad; }
    .msv-it .chev svg { width: 16px; height: 16px; }
    .msv-it.open .chev svg { transform: rotate(180deg); }
    .msv-it.on, .msv-leaf.on { background: #e6e9f7; }
    .ms-adm .msv-leaf.on { box-shadow: none; font-weight: 400; color: #10163d; }
    .ms-adm .msv-it { margin: 0 0 4px; height: auto; font-size: 14px; padding: 0 12px; }
    .ms-adm .msv-leaf { margin: 0 0 4px; height: auto; font-size: 14px; padding: 0 12px 0 10px; }
    .ms-adm .msv-more { padding-left: 37px; }
    .ms-adm .msv-it .chev { transform: none; }
    .ms-adm .ms-toast { z-index: 5; }
    .msv-hr { border-top: 1px solid #e6eaf0; margin: 8px 0; }
    .msv-sub { display: none; }
    .ms-adm .msv-sub { padding: 0; }
    .msv-sub.open { display: block; }
    .msv-leaf { display: flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 12px 0 14px; margin-bottom: 4px; border-radius: 4px; color: #10163d; white-space: nowrap; }
    .msv-leaf > i { display: grid; width: 16px; height: 16px; color: #7b83ad; flex: none; }
    .msv-leaf > i svg { width: 16px; height: 16px; }
    .msv-more { display: flex; align-items: center; min-height: 32px; padding: 0 0 0 30px; margin-bottom: 4px; font-size: 12px; color: #4558c4; }
    .msv-top { position: absolute; left: 256px; right: 0; top: 0; height: 55px; box-sizing: border-box; border-bottom: 1px solid #e6eaf0; background: #fff; display: flex; align-items: center; padding: 0 24px; z-index: 1; }
    .msv-top .ms-crumb { display: flex; align-items: center; font-size: 12px; color: #4558c4; white-space: nowrap; }
    .msv-top .ms-crumb a { padding: 0 4px; color: #4558c4; text-decoration: none; }
    .msv-top .ms-crumb a.off { color: #c1c6d9; }
    .msv-top .ms-crumb .sl { padding: 0 8px; color: #b6b8c4; }
    .msv-top .sp { flex: 1; }
    .msv-search { width: 340px; height: 36px; box-sizing: border-box; border: 1px solid #cad1e0; border-radius: 4px; display: flex; align-items: center; gap: 8px; padding: 0 12px; color: #6f738a; font-size: 14px; background: #fff; }
    .msv-search svg { width: 18px; height: 18px; color: #4558c4; flex: none; }
    .msv-hbtn { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; margin-left: 12px; border-radius: 4px; color: #10163d; white-space: nowrap; }
    .msv-hbtn svg { width: 18px; height: 18px; color: #4558c4; margin-right: 6px; }
    .msv-acct { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; color: #10163d; white-space: nowrap; }
    .msv-av { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-size: 14px; margin-right: 8px; flex: none; }
    .msv-acct .arr { display: grid; color: #7b83ad; margin-left: 6px; }
    .msv-acct .arr svg { width: 16px; height: 16px; }
    .msv-rail { position: absolute; right: 0; top: 55px; bottom: 0; width: 82px; box-sizing: border-box; background: #fff; border-left: 1px solid #e6eaf0; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 24px 4px; z-index: 1; }
    .msv-rail span { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 5px 4px; border-radius: 4px; font-size: 11px; line-height: 1; color: #10163d; white-space: nowrap; }
    .msv-rail i { display: grid; color: #7b83ad; }
    .msv-rail svg { width: 22px; height: 22px; }
    .ms-adm .msv-main { position: absolute; left: 256px; right: 82px; top: 55px; bottom: 0; overflow: hidden; background: #fff; }
    .ms-adm .ms-h1 { font-size: 28px; line-height: 1.25; font-weight: 400; margin: 16px 24px 24px; color: #10163d; }
    .ms-adm .ms-btn { min-height: 36px; height: auto; padding: 0 12px; border-radius: 4px; background: #293576; color: #fff; font-weight: 400; font-size: 14px; box-shadow: 2px 2px 4px 0 #11316142; }
    .ms-adm .ms-btn.is-hover { background: #4558c4; }
    .ms-adm .ms-btn.ghost { background: #fff; color: #6871a6; border: 1px solid #6871a6; box-shadow: none; }
    .ms-adm .ms-btn.ghost.is-hover { background: #6871a6; color: #fff; }
    .ms-adm .ms-panel, .ms-adm .ms-card { border: 1px solid #cad1e0; border-radius: 4px; }
    .ms-adm .ms-panel { margin-left: 24px; margin-right: 24px; }
    .ms-adm .ms-two, .ms-adm .ms-ops { margin-left: 24px; margin-right: 24px; }
    .ms-adm .ms-two .ms-panel, .ms-adm .ms-ops .ms-panel { margin-left: 0; margin-right: 0; }
    .ms-adm .ms-home, .ms-adm .ms-home2 { padding: 0 24px; }
    .ms-adm .ms-phead { display: flex; align-items: center; justify-content: space-between; margin-right: 24px; }
    .ms-adm .ms-phead .ms-h1 { margin-right: 0; }
    .ms-adm .ms-seg { display: inline-flex; align-items: center; justify-content: center; min-width: 56px; height: 32px; margin: 0 8px 0 0; border-radius: 4px; background: #f2f4fc; color: #10163d; }
    .ms-adm .ms-seg.on { background: #4558c4; color: #fff; }`;

  /** the admin's own icons (js/makeshop-ui.js): <i data-ms-icon="home"></i> */
  window.MsUi = {
    icon: (name) => (window.MAKESHOP_UI.icons[name] || ICONS2[name] || '').replace('<svg ', '<svg aria-hidden="true" '),
    hydrate(root = document) { root.querySelectorAll('[data-ms-icon]').forEach((i) => { i.innerHTML = this.icon(i.dataset.msIcon); }); },
    title: (t) => window.MAKESHOP_UI.titleFormat.replace('%s', t),
    /** the Meiryo alias (see above) for the reconstructed admin screens in the main page */
    fonts() { const css = fontAlias(); if (css && !document.getElementById('ms-font-alias')) document.head.insertAdjacentHTML('beforeend', `<style id="ms-font-alias">${css}</style>`); },
    /**
     * the frame of the admin (see above). cfg: { shopName, shopId, avatar, homeId, shopLinkId,
     *   groups: { order|product|member|design|analysis|app|config: [[id, label], …] } — a listed category is shown open,
     *   closed: { <category>: true } — listed, but folded until the video opens it (#groupIds[key] / #subIds[key] toggle 'open') }
     * The page goes into #msMain, the breadcrumbs into #msCrumb (MsUi.crumbs).
     */
    shell(cfg) {
      this.installCss();
      const closed = cfg.closed || {}, gid = cfg.groupIds || {}, sid = cfg.subIds || {};
      const groups = GROUPS.map(([key, ic, title]) => {
        const items = cfg.groups[key];
        const open = !!items && !closed[key];
        return `<div class="msv-it grp ms-item${open ? ' open' : ''}" data-grp="${key}"${gid[key] ? ` id="${gid[key]}"` : ''}><i data-ms-icon="${ic}"></i><b>${esc(title)}</b><span class="chev" data-ms-icon="arrow"></span></div>` +
          (items ? `<div class="msv-sub ms-sub${open ? ' open' : ''}"${sid[key] ? ` id="${sid[key]}"` : ''}>${items.map(([id, label]) => `<div class="msv-leaf ms-subitem"${id ? ` id="${id}"` : ''}><i data-ms-icon="drag"></i><span>${esc(label)}</span></div>`).join('')}<div class="msv-more">機能をもっと見る</div></div>` : '');
      }).join('');
      const [bg, fg] = AVATAR[cfg.avatar] || AVATAR.purple;
      return `<div class="msv">
        <nav class="msv-nav"><div class="msv-head"><div class="msv-head-row"><img class="msv-logo" src="assets/makeshop/ms-logo-typeA.svg" alt="makeshop byGMO"><span class="msv-fold" title="メニューを折りたたむ"><i data-ms-icon="collapseHorizontal"></i></span></div>
          <span class="msv-shop"${cfg.shopLinkId ? ` id="${cfg.shopLinkId}"` : ''}>${esc(cfg.shopName)}<i data-ms-icon="blank"></i></span></div>
          <div class="msv-list"><div class="msv-it ms-item" id="${cfg.homeId || 'msNavHome'}" data-nav="home"><i data-ms-icon="home"></i><span>ホーム</span></div><div class="msv-hr"></div>${groups}</div></nav>
        <header class="msv-top"><div class="ms-crumb" id="msCrumb"></div><span class="sp"></span>
          <span class="msv-search"><i data-ms-icon="search"></i>管理画面全体から検索できます。</span>
          <span class="msv-hbtn"><span data-ms-icon="viewList"></span>機能一覧</span>
          <span class="msv-acct"><span class="msv-av" style="background:${bg};color:${fg}">${esc(cfg.shopId.charAt(0).toUpperCase())}</span><span class="pii">${esc(cfg.shopId)}</span><i class="arr" data-ms-icon="arrow"></i></span></header>
        <aside class="msv-rail"><span><i data-ms-icon="bellOutline"></i>お知らせ</span><span><i data-ms-icon="menuBook"></i>マニュアル</span><span><i data-ms-icon="listAlt"></i>サポート一覧</span><span><i data-ms-icon="aiSupport"></i>AIサポート</span></aside>
        <main class="msv-main ms-main" id="msMain"></main>
      </div>`;
    },
    installCss() { if (!document.getElementById('ms-shell-css')) document.head.insertAdjacentHTML('beforeend', `<style id="ms-shell-css">${SHELL_CSS}</style>`); },
    /** breadcrumbs as the admin's routes give them (meta.breadcrumb of each matched route): the last one is the page */
    crumbs(list) {
      return list.map((x, i) => (i ? '<span class="sl">/</span>' : '') + `<a${i === list.length - 1 ? ' class="off"' : ''}>${esc(x)}</a>`).join('');
    },
  };
})();
