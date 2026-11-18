/*
 * What this video adds on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js):
 *   - tab icons: EC-CUBE 4.3's admin favicon (html/template/admin/assets/img/favicon.ico) and the dev copy's shop favicon
 *     (html/user_data/assets/img/common/favicon.ico, EC-CUBE's own); the live shop's comes with its snapshot
 *   - DK.ec(tab, key)       a captured screen in a tab, with its real title and the dev copy's address
 *   - DK.type(name, …)      types into a captured text box (data-demo-input)
 *   - DK.pick(sel, label)   picks an option of a captured <select> (the real one: its options are EC-CUBE's)
 *   - DK.blur()             the (invented) test customer's name, address, phone and e-mail blurred in every captured screen
 * No shared file is changed.
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { wait, clickUi, typeInto, esc } = D;
  const { Browser } = K;
  const EC = window.EC;
  const S = window.SITE_SNAPSHOT;

  Browser.FAV.ec = '<img class="br-fav img" src="assets/eccube-admin.ico" alt="">';
  Browser.FAV.shop = '<img class="br-fav img" src="assets/favicon.ico" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.product && S.pages.product.favicon));
  Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || '../../shared/favicons/default.png')}" alt="">`;

  /* the test customer (invented) */
  const PII = [/テスト\s*太郎/, /テスト\s*タロウ/, /taro\.test@example\.com/, /テストビル/, /0600000000|06-0000-0000|060-000-0000/, /北堀江\s*1-1-1/];
  function blurDoc(doc) {
    if (!doc || !doc.body || doc.__pii) return;
    doc.__pii = true;
    const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (PII.some((re) => re.test(n.nodeValue))) hits.push(n.parentElement);
    hits.forEach((e) => e && e.classList.add('pii'));
    doc.querySelectorAll('input, textarea, [data-demo-input]').forEach((i) => { if (PII.some((re) => re.test(i.value || i.textContent || ''))) i.classList.add('pii'); });
    if (!doc.getElementById('dk-pii')) {
      const st = doc.createElement('style');
      st.id = 'dk-pii';
      st.textContent = '.pii{filter:blur(5px)!important}';
      doc.head.appendChild(st);
    }
  }

  const DK = {
    DEV: 'http://localhost:8080',
    LIVE: 'https://www.daikoku.ne.jp',
    keys: {},
    PII,
    blur() { for (const f of Object.values(EC.frames || {})) { try { blurDoc(f.contentDocument); } catch (e) { /* not loaded */ } } },
    /** a captured EC-CUBE screen in a tab (o.load: ms of loading; o.fav: 'ec' admin / 'shop' front) */
    async ec(tab, key, o = {}) {
      const t = Browser.tab(tab);
      if (o.load !== 0) { Browser.loading(tab, true); await wait(o.load || 520); }
      const doc = await EC.show(key);
      blurDoc(doc);
      t.ecKey = key;
      const url = o.url || EC.url(key);
      Browser.nav(tab, { title: o.title || EC.title(key), url, page: 'wp', fav: o.fav || (/\/admin/.test(url) ? 'ec' : 'shop') });
      if (o.load !== 0) Browser.loading(tab, false);
      DK.keys[tab] = key;
      await wait(o.after != null ? o.after : 300);
      return doc;
    },
    /** back to a tab (its EC-CUBE screen on show again) */
    async tab(id) {
      await Browser.clickTab(id);
      if (Browser.tab(id).page === 'wp' && DK.keys[id]) await EC.show(DK.keys[id]);
    },
    /** types into a captured text box of the screen on show (o.clear: Ctrl+A and typed over) */
    async type(name, script, o = {}) {
      const box = EC.field(name);
      if (!box) throw new Error('no text box ' + name);
      if (o.reset) box.textContent = '';
      await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 80 });
      if (o.clear) { await D.Keycap.show(['Ctrl', 'A'], 380); box.textContent = ''; }
      EC.focus(box, true);
      const out = await typeInto(EC.typeInto(name, null, o.clear || o.reset ? { base: '' } : {}), typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 12 });
      box.textContent = out;
      EC.blur(name);
      await wait(o.after != null ? o.after : 200);
      return out;
    },
    /** picks an option of a captured select (its own option texts in the drop-down) */
    async pick(sel, label, o = {}) {
      const el = typeof sel === 'string' ? EC.el(sel) : sel;
      if (!el) return null;
      const opts = [...el.options].map((x) => x.textContent.trim());
      await K.choose(el, opts, label, { look: o.look || 520 });
      const op = [...el.options].find((x) => x.textContent.trim() === label);
      if (op) { el.value = op.value; [...el.options].forEach((x) => { if (x === op) x.setAttribute('selected', ''); else x.removeAttribute('selected'); }); }
      await wait(o.after != null ? o.after : 160);
      return el;
    },
    /** ticks a captured checkbox */
    check(el, on = true) { if (!el) return null; el.checked = on; if (on) el.setAttribute('checked', ''); else el.removeAttribute('checked'); return el; },
    /** an element of the screen on show by its text */
    text(sel, re) { return EC.els(sel).filter((e) => re.test(e.textContent.replace(/\s+/g, ' ').trim())).pop() || null; },
    /** the screen rectangle of a run of text in the screen on show (a Range: one line of a long mail body) */
    textRect(re, pad = 3) {
      return () => {
        const d = EC.doc();
        const fr = EC.frames && EC.frames[EC.screen];
        if (!d || !fr) return null;
        const w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const m = re.exec(n.nodeValue);
          if (!m) continue;
          const rg = d.createRange();
          rg.setStart(n, m.index);
          rg.setEnd(n, m.index + m[0].length);
          const r = rg.getBoundingClientRect();
          const f = D.screenRect(fr);
          return { left: f.left + r.left - pad, top: f.top + r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
        }
        return null;
      };
    },
  };

  window.DK = DK;
})();
