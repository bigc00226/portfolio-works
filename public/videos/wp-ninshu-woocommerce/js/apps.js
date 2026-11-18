/*
 * The browser tabs of this video: the dev site's wp-admin (the REAL WordPress / WooCommerce screens captured into
 * js/wp-snapshot.js, shown by public/shared/wordpress/wp-frame.js) and the live shop (js/site-snapshot.js, Kit.Store).
 *   NS.wp(key, o)      shows a captured screen in the wp-admin tab (title / address from the screen itself)
 *   NS.type(name, script, o)   types into a captured text box of the screen on show (focus look, caret, IME;
 *                      o.clear: Ctrl+A over the value already there first)
 *   NS.selectMenu(sel, re)     a native <select>: Chrome's option list drawn under it, the option clicked
 *   NS.menu(top, href) the admin menu: a top-level item → its submenu link (the flyout when it is closed)
 *   NS.STATES          the live shop's product page with ペア chosen (WooCommerce draws the variation price there)
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { wait, clickUi, hoverUi, typeInto } = D;
  const { Browser } = K;
  const WP = window.WP;

  const NS = {
    DEV: 'http://localhost:8888',
    LIVE: 'https://ninshu.com',
    /** shows a captured screen in the wp-admin tab (o.load: the page loads for that long, the tab spinning) */
    async wp(key, o = {}) {
      const tab = o.tab || 'wp';
      if (o.load) Browser.loading(tab, true);
      await WP.show(key);
      Browser.nav(tab, { title: WP.title(key), url: WP.url(key) });
      if (o.load) { await wait(o.load); Browser.loading(tab, false); }
      return WP.doc(key);
    },
    /** types into a captured text box: click, focused look, the text (IME runs included), unfocused */
    async type(name, script, o = {}) {
      const box = WP.field(name);
      if (!box) throw new Error('no text box ' + name);
      if (o.click !== false) await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 80 });
      WP.focus(box, true);
      // o.clear: the box has a value already (e.g. 「0」) — Ctrl+A selects it, the typing replaces it
      if (o.clear && box.textContent) {
        box.innerHTML = `<span style="background:#b4d5fe">${D.esc(box.textContent)}</span>`;
        await D.Keycap.show(['Ctrl', 'A'], 600);
        await wait(250);
      }
      const text = await typeInto(WP.typeInto(name), typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 13 });
      box.textContent = text;
      if (o.blur !== false) WP.focus(box, false);
      await wait(o.after != null ? o.after : 200);
      return text;
    },
    /** a native <select> of the screen: clicked, Chrome's (Windows) option list drawn under it, the option clicked —
     *  the select then shows that option (the rest of the screen comes from the capture that follows) */
    async selectMenu(sel, re, o = {}) {
      const s = typeof sel === 'string' ? WP.el(sel) : sel;
      if (!s) return;
      await clickUi(s, { after: 150 });
      const doc = s.ownerDocument, win = doc.defaultView, r = s.getBoundingClientRect(), cs = win.getComputedStyle(s);
      const opts = [...s.options];
      const list = doc.createElement('div');
      list.style.cssText = `position:absolute;z-index:200000;left:${r.left + win.scrollX}px;top:${r.bottom + win.scrollY + 1}px;min-width:${r.width}px;box-sizing:border-box;background:#fff;border:1px solid #767676;box-shadow:0 3px 8px rgba(0,0,0,.22);font-family:${cs.fontFamily};font-size:${o.fontSize || cs.fontSize};color:#1e1e1e;padding:2px 0;`;
      list.innerHTML = opts.map((op) => `<div style="padding:${o.pad || '4px 10px'};white-space:nowrap;line-height:1.35;${op.selected ? 'background:#ececec;' : ''}">${D.esc(op.textContent.trim())}</div>`).join('');
      doc.body.appendChild(list);
      const idx = opts.findIndex((op) => re.test(op.textContent));
      const item = list.children[Math.max(0, idx)];
      await wait(350);
      await hoverUi(item, { hold: 120 });
      [...list.children].forEach((c) => { c.style.background = ''; c.style.color = ''; });
      item.style.background = '#1967d2';
      item.style.color = '#fff';
      await wait(o.hold || 350);
      await clickUi(item, { after: 60 });
      list.remove();
      opts.forEach((op, i) => { if (i === idx) op.setAttribute('selected', ''); else op.removeAttribute('selected'); op.selected = i === idx; });
      await wait(o.after != null ? o.after : 150);
    },
    /** the admin menu: a top-level item (its flyout submenu when it is not the open one) → the submenu link */
    async menu(top, href) {
      const li = WP.el(top);
      if (!li) return;
      const sub = href && li.querySelector(`.wp-submenu a[href*="${href}"]`);
      // a closed flyout waits at top: -1000em; WordPress' menu script opens it on hover with .opensub
      const fly = sub && !li.classList.contains('wp-menu-open');
      if (fly) { await hoverUi(li.querySelector('a.menu-top') || li, { hold: 250 }); li.classList.add('opensub'); await wait(250); }
      await clickUi(sub || li.querySelector('a.menu-top') || li, { after: 60 });
      if (fly) li.classList.remove('opensub');
    },
  };

  /* the live product page: 「ペア」 chosen in the variation select — what WooCommerce's script draws (the variation's
     own price HTML from the page's data-product_variations) */
  const STATES = window.StoreFrame.STATES;
  STATES.pairChosen = {
    on(doc) {
      const form = doc.querySelector('form.variations_form');
      if (!form) return;
      const sel = form.querySelector('select');
      const vars = JSON.parse(form.getAttribute('data-product_variations') || '[]');
      const pair = vars.find((v) => Object.values(v.attributes).some((a) => /ペア/.test(a)));
      if (sel && pair) {
        const opt = [...sel.options].find((o) => /ペア/.test(o.textContent));
        if (opt) { [...sel.options].forEach((o) => o.removeAttribute('selected')); opt.setAttribute('selected', ''); sel.value = opt.value; }
        const wrap = form.querySelector('.single_variation');
        if (wrap) { wrap.innerHTML = `<div class="woocommerce-variation-price">${pair.price_html}</div><div class="woocommerce-variation-availability">${pair.availability_html || ''}</div>`; wrap.style.display = 'block'; }
        const reset = form.querySelector('.reset_variations');
        if (reset) reset.style.visibility = 'visible';
        const add = form.querySelector('.single_add_to_cart_button');
        if (add) add.classList.remove('disabled', 'wc-variation-selection-needed');
      }
    },
    off() {},
  };

  window.NS = NS;
})();
