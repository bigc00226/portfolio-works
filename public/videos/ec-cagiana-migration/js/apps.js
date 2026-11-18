/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js — EC-CUBE 3.0.18-p7 at localhost:8030 and 4.3.1-p1 at
 * localhost:8080 in one snapshot):
 *   - the tab icons: EC-CUBE 4.3's admin favicon, EC-CUBE 3's admin favicon (each its own html/template/admin/assets/img/
 *     favicon.ico), the shop's favicon (/html/template/cagiana/img/cagiana_favicon.ico) for the shop pages
 *   - CG.ec(key) shows a captured screen in a tab with its real title / address (o.url: the address after the switch-over —
 *     the same captured page shown at https://cagiana.jp, a simulation); CG.type(name, text) types into a captured text box
 *   - the invented members' mail / address / phone / birthday blurred inside the screens (.pii, as the other videos)
 *   - the terminal on a server (ssh): the bash prompt instead of PowerShell's
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { wait, clickUi, typeInto, esc } = D;
  const { Browser } = K;
  const EC = window.EC;
  const S = window.SITE_SNAPSHOT;

  K.Browser.FAV.ec = '<img class="br-fav img" src="assets/eccube-admin.ico" alt="">';
  K.Browser.FAV.ec3 = '<img class="br-fav img" src="assets/eccube3-admin.ico" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  K.Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || 'assets/favicon.ico')}" alt="">`;
  K.Browser.FAV.shop = K.Browser.FAV.store;

  /* the invented members: mail, street, phone, birthday blurred wherever a screen shows them */
  const PII = [/sample\d\d@example\.com/, /サンプルハイツ/, /000-?0000-?\d{4}/, /^\s*(19[789]\d)[/-]\d\d[/-]\d\d\s*$/];
  function blurPii(doc) {
    if (!doc || doc.__pii) return;
    doc.__pii = true;
    const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (PII.some((re) => re.test(n.nodeValue))) hits.push(n.parentElement);
    hits.forEach((e) => e && e.classList.add('pii'));
    doc.querySelectorAll('input, textarea, [data-demo-input]').forEach((i) => { if (PII.some((re) => re.test(i.value || i.textContent || ''))) i.classList.add('pii'); });
  }

  const favOf = (key, url) => (/^ec3-/.test(key) ? (/\/admin/.test(url) ? 'ec3' : 'shop') : (/\/admin/.test(url) ? 'ec' : 'shop'));
  const CG = {
    DEV: 'http://localhost:8080',
    OLD: 'http://localhost:8030',
    LIVE: 'https://cagiana.jp',
    keys: {},
    urls: {},
    /** a captured EC-CUBE screen in a tab (o.load: the page loads for that long; o.url: the address shown instead) */
    async ec(key, o = {}) {
      const tab = o.tab || 'dev';
      if (o.load !== 0) Browser.loading(tab, true);
      await wait(o.load || 500);
      const doc = await EC.show(key);
      blurPii(EC.doc(key));
      const url = o.url || EC.url(key);
      Browser.nav(tab, { title: o.title || EC.title(key), url, page: 'wp', fav: o.fav || favOf(key, url) });
      Browser.loading(tab, false);
      CG.keys[tab] = key;
      CG.urls[tab] = o;
      await wait(o.after != null ? o.after : 300);
      return doc;
    },
    /** types into a captured text box of the screen on show */
    async type(name, text, o = {}) {
      const box = EC.field(name);
      if (!box) throw new Error('no text box ' + name);
      await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.15, after: 80 });
      EC.focus(box, true);
      const script = typeof text === 'string' ? [{ direct: text }] : text;
      const out = await typeInto(EC.typeInto(name), script, { kps: o.kps || 12 });
      EC.blur(name);
      await wait(o.after != null ? o.after : 200);
      return out;
    },
    /** a password box: bullets as Chrome draws them */
    async password(name, n = 8) {
      const pw = EC.field(name);
      if (!pw) return;
      await clickUi(pw, { kind: 'text', ax: 0.15, after: 60 });
      EC.focus(pw, true);
      for (let k = 1; k <= n; k++) { D.KeyStrip.key('●'); pw.innerHTML = '•'.repeat(k) + '<span class="demo-caret"></span>'; await D.kw(70); }
      D.KeyStrip.idleHide(600);
      EC.focus(pw, false);
    },
    blurPii,
  };

  /** the terminal on a server (ssh): the bash prompt */
  const LOCAL_PROMPT = K.Term.prompt;
  const Shell = {
    remote(user, host, dir = '~') { K.Term.prompt = `[${user}@${host} ${dir}]$ `; },
    local() { K.Term.prompt = LOCAL_PROMPT; },
  };

  window.CG = CG;
  window.AP = { Shell, blurPii };
})();
