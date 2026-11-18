/*
 * What this video adds on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js):
 *   - tab icons: EC-CUBE 4.3's admin favicon (html/template/admin/assets/img/favicon.ico) and the staging copy's shop favicon
 *     (html/user_data/assets/img/common/favicon.ico, EC-CUBE's own); the live shop's comes with its snapshot
 *   - CN.ec(tab, key)     a captured screen in a tab, with its real title and the staging copy's address
 *   - CN.type(name, …)    types into a captured text box (data-demo-input)
 *   - CN.blur()           the local copy's secrets blurred in every captured screen (the 2FA key and its QR code, the
 *                         maintenance token); the same secrets blurred in the editor and the terminal (a MutationObserver wraps them in .pii)
 *   - CN.check(el)        ticks a captured checkbox / toggle
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
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || '../../shared/favicons/default.png')}" alt="">`;

  /* the local copy's secrets */
  const magic = (/ECCUBE_AUTH_MAGIC=(\S+)/.exec(DATA.env1 || DATA.env0 || '') || [])[1];
  const token = (String(DATA.maintFile || '').split(':')[1] || '').trim();
  const SECRETS = [DATA.tfaKey, magic, token].filter((x) => x && x.length > 8);
  const isSecret = (s) => SECRETS.some((x) => s.includes(x));
  function blurDoc(doc) {
    if (!doc || !doc.body || doc.__pii) return;
    doc.__pii = true;
    const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (isSecret(n.nodeValue) || /^[A-Z2-7]{16,}$/.test(n.nodeValue.trim())) hits.push(n.parentElement);
      // システム情報's User Agent: the capture ran in headless Chrome; the video's browser is the normal Chrome
      if (n.nodeValue.includes('HeadlessChrome/')) n.nodeValue = n.nodeValue.replace('HeadlessChrome/', 'Chrome/');
      // the security check's time (Y-m-d H:i:s — capture.js moves the date, not this time of day) → the video's clock
      // ログイン履歴: the capture's own login (capture.js sets today's times to 10:16) is the one just before this screen (10:09)
      if (/^\s*2026\/11\/17 10:16:\d\d\s*$/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/10:16:\d\d/, '10:09:52');
      if (/前回確認日時: 2026-11-17 \d\d:\d\d:\d\d/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/2026-11-17 \d\d:\d\d:\d\d/, '2026-11-17 10:19:06');
    }
    hits.forEach((e) => e && e.classList.add('pii'));
    doc.querySelectorAll('#qrcode, #qrcode img, #qrcode canvas').forEach((e) => e.classList.add('pii'));
    doc.querySelectorAll('input, textarea').forEach((i) => { const v = i.value || i.getAttribute('value') || ''; if (isSecret(v)) i.classList.add('pii'); });
    if (!doc.getElementById('cn-pii')) {
      const st = doc.createElement('style');
      st.id = 'cn-pii';
      st.textContent = '.pii{filter:blur(6px)!important}';
      doc.head.appendChild(st);
    }
  }

  /* the secrets in the editor's rows and the terminal: wrapped in .pii whenever they are drawn */
  function wrapSecrets(root) {
    if (!root || !SECRETS.length) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (SECRETS.some((x) => n.nodeValue.includes(x.slice(0, 16))) && !(n.parentElement && n.parentElement.closest('.pii'))) nodes.push(n);
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

  const CN = {
    DEV: 'http://localhost:8080',
    LIVE: 'https://www.chokunavi.shop',
    SECRETS,
    keys: {},
    watch() { watch('#vsLines'); watch('#vsTerm'); },
    blur() { for (const f of Object.values(EC.frames || {})) { try { blurDoc(f.contentDocument); } catch (e) { /* not loaded */ } } },
    /** a captured EC-CUBE screen in a tab (o.load: ms of loading; o.fav: 'ec' admin / 'shop' front) */
    async ec(tab, key, o = {}) {
      const t = Browser.tab(tab);
      if (o.load !== 0) { Browser.loading(tab, true); await wait(o.load || 520); }
      const doc = await EC.show(key);
      blurDoc(doc);
      t.ecKey = key;
      const url = o.url || EC.url(key);
      Browser.nav(tab, { title: o.title || EC.title(key), url, page: 'wp', fav: o.fav || (/\/(admin|mng-)/.test(url) ? 'ec' : 'shop') });
      if (o.load !== 0) Browser.loading(tab, false);
      CN.keys[tab] = key;
      await wait(o.after != null ? o.after : 300);
      return doc;
    },
    /** back to a tab (its EC-CUBE screen on show again) */
    async tab(id) {
      await Browser.clickTab(id);
      if (Browser.tab(id).page === 'wp' && CN.keys[id]) await EC.show(CN.keys[id]);
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

  window.CN = CN;
})();
