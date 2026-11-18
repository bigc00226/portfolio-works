/*
 * What this video adds on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js):
 *   - tab icons: EC-CUBE 4.3's admin favicon (html/template/admin/assets/img/favicon.ico) and the dev copy's shop favicon
 *     (html/user_data/assets/img/common/favicon.ico, EC-CUBE's own); the live shop's comes with its snapshot
 *   - TB.ec(tab, key)     a captured screen in a tab, with its real title and the dev copy's address
 *   - TB.type(name, …)    types into a captured text box (data-demo-input)
 *   - TB.blur()           the (invented) test customer and the local client's / WebHook's secrets blurred in every captured screen;
 *                         the same secrets blurred in the editor and the terminal (a MutationObserver wraps them in .pii)
 *   - TB.check(sel)       ticks a captured checkbox
 * No shared file is changed.
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { wait, clickUi, typeInto, esc } = D;
  const { Browser } = K;
  const EC = window.EC;
  const S = window.SITE_SNAPSHOT;
  const DATA = EC.data || {};

  Browser.FAV.ec = '<img class="br-fav img" src="assets/eccube-admin.ico" alt="">';
  Browser.FAV.shop = '<img class="br-fav img" src="assets/favicon.ico" alt="">';
  Browser.FAV.link = '<img class="br-fav img" src="../../shared/favicons/default.png" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.detail && S.pages.detail.favicon));
  Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || '../../shared/favicons/default.png')}" alt="">`;

  /* the test customer (invented) and the local copy's secrets */
  const SECRETS = [DATA.client && DATA.client.secret, DATA.webhookSecret].filter(Boolean);
  const PII = [/テスト\s*太郎/, /テスト\s*タロウ/, /taro\.test@example\.com/, /テストビル/, /0400000000|040-000-0000/, /南藤沢\s*1-1-1/];
  const isPii = (s) => PII.some((re) => re.test(s)) || SECRETS.some((x) => s.includes(x));
  const PII_BOX = /^\s*(テスト|太郎|タロウ|0400000000|2510055|藤沢市南藤沢|1-1-1 テストビル 3F|taro\.test@example\.com)\s*$/;   // the customer's boxes (受注登録)
  function blurDoc(doc) {
    if (!doc || !doc.body || doc.__pii) return;
    doc.__pii = true;
    const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (isPii(n.nodeValue) || PII_BOX.test(n.nodeValue)) hits.push(n.parentElement);
    hits.forEach((e) => e && e.classList.add('pii'));
    doc.querySelectorAll('input, textarea, [data-demo-input]').forEach((i) => { const v = i.value || i.getAttribute('value') || i.textContent || ''; if (isPii(v) || PII_BOX.test(v)) i.classList.add('pii'); });
    if (!doc.getElementById('tb-pii')) {
      const st = doc.createElement('style');
      st.id = 'tb-pii';
      st.textContent = '.pii{filter:blur(5px)!important}';
      doc.head.appendChild(st);
    }
  }

  /* the secrets in the editor's rows and the terminal: wrapped in .pii whenever they are drawn */
  function wrapSecrets(root) {
    if (!root || !SECRETS.length) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (SECRETS.some((x) => n.nodeValue.includes(x.slice(0, 24))) && !(n.parentElement && n.parentElement.closest('.pii'))) nodes.push(n);
    for (const n of nodes) {
      const span = document.createElement('span');
      span.className = 'pii';
      n.parentNode.insertBefore(span, n);
      span.appendChild(n);
    }
  }
  function watch(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    new MutationObserver(() => wrapSecrets(el)).observe(el, { childList: true, subtree: true });
  }

  const TB = {
    DEV: 'http://localhost:8080',
    LIVE: 'https://b-net.tackleberry.co.jp',
    keys: {},
    watch() { watch('#vsLines'); watch('#vsTerm'); },
    blur() { for (const f of Object.values(EC.frames || {})) { try { blurDoc(f.contentDocument); } catch (e) { /* not loaded */ } } },
    /** a captured EC-CUBE screen in a tab (o.load: ms of loading; o.fav: 'ec' admin / 'shop' front / 'link' the store-link) */
    async ec(tab, key, o = {}) {
      const t = Browser.tab(tab);
      if (o.load !== 0) { Browser.loading(tab, true); await wait(o.load || 520); }
      const doc = await EC.show(key);
      blurDoc(doc);
      t.ecKey = key;
      const url = o.url || EC.url(key);
      Browser.nav(tab, { title: o.title || EC.title(key), url, page: 'wp', fav: o.fav || (/localhost:3100/.test(url) ? 'link' : /\/admin/.test(url) ? 'ec' : 'shop') });
      if (o.load !== 0) Browser.loading(tab, false);
      TB.keys[tab] = key;
      await wait(o.after != null ? o.after : 300);
      return doc;
    },
    /** back to a tab (its EC-CUBE screen on show again) */
    async tab(id) {
      await Browser.clickTab(id);
      if (Browser.tab(id).page === 'wp' && TB.keys[id]) await EC.show(TB.keys[id]);
    },
    /** types into a captured text box of the screen on show (o.clear: Ctrl+A and typed over; o.paste: Ctrl+V) */
    async type(name, script, o = {}) {
      const box = EC.field(name);
      if (!box) throw new Error('no text box ' + name);
      await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 80 });
      if (o.clear) { await D.Keycap.show(['Ctrl', 'A'], 380); box.textContent = ''; }
      if (o.paste) {
        await D.Keycap.show(['Ctrl', 'V'], 420);
        box.textContent = script;
        if (o.pii) box.classList.add('pii');
        await wait(o.after != null ? o.after : 200);
        return script;
      }
      EC.focus(box, true);
      const out = await typeInto(EC.typeInto(name, null, o.clear ? { base: '' } : {}), typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 12 });
      box.textContent = out;
      EC.blur(name);
      await wait(o.after != null ? o.after : 200);
      return out;
    },
    check(el, on = true) { if (!el) return null; el.checked = on; if (on) el.setAttribute('checked', ''); else el.removeAttribute('checked'); return el; },
    /** an element of the screen on show by its text */
    text(sel, re) { return EC.els(sel).filter((e) => re.test(e.textContent.replace(/\s+/g, ' ').trim())).pop() || null; },
  };

  window.TB = TB;
})();
