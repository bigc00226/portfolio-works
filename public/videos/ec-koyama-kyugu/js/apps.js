/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js):
 *   - the tab icons: EC-CUBE's admin → EC-CUBE 4.3's own favicon (html/template/admin/assets/img/favicon.ico); the dev
 *     copy's shop and the live shop → the shop's favicon (/html/user_data/assets/img/common/favicon.ico)
 *   - KY.ec(key) shows a captured screen in a tab with its real title / address; KY.type(name, text) types into a
 *     captured text box; KY.toggle(sel) the admin's toggle switch flipped (its label as EC-CUBE's script sets it)
 *   - the test customer's name / address / mail / phone blurred inside the screens (.pii, as the WordPress videos)
 *   - the live product page after the deploy (StoreFrame state `badge`): the badge exactly as the dev copy's EC-CUBE
 *     rendered it (the captured front-7-badge screen's p.stockBadges) and its CSS (js/customize-src.js) — the deploy and
 *     the live page with it are a simulation (the live page was captured as it is)
 *   - the terminal on the production server (ssh): the bash prompt instead of PowerShell's
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { wait, clickUi, typeInto, esc } = D;
  const { Browser } = K;
  const EC = window.EC;
  const SRC = window.KOYAMA_SRC;
  const S = window.SITE_SNAPSHOT;

  K.Browser.FAV.ec = '<img class="br-fav img" src="assets/eccube-admin.ico" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  K.Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || 'assets/favicon.ico')}" alt="">`;
  K.Browser.FAV.shop = '<img class="br-fav img" src="assets/favicon.ico" alt="">';

  /* the test customer (invented) blurred wherever a screen shows it */
  const PII = [/テスト\s*太郎/, /テスト\s*タロウ/, /test-order@example\.com/, /テストビル/, /0300000000|03-0000-0000/];
  function blurPii(doc) {
    if (!doc || doc.__pii) return;
    doc.__pii = true;
    const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (PII.some((re) => re.test(n.nodeValue))) hits.push(n.parentElement);
    hits.forEach((e) => e && e.classList.add('pii'));
    doc.querySelectorAll('input, [data-demo-input]').forEach((i) => { if (PII.some((re) => re.test(i.value || i.textContent || ''))) i.classList.add('pii'); });
  }

  const KY = {
    DEV: 'http://localhost:8080',
    LIVE: 'https://www.koyama-kyugu.com',
    /** a captured EC-CUBE screen in a tab (o.load: the page loads for that long; o.fav: 'ec' admin / 'shop' front) */
    async ec(key, o = {}) {
      const tab = o.tab || 'dev';
      if (o.load !== 0) Browser.loading(tab, true);
      await wait(o.load || 500);
      const doc = await EC.show(key);
      blurPii(EC.doc(key));
      Browser.nav(tab, { title: EC.title(key), url: EC.url(key), page: 'wp', fav: o.fav || (/\/admin/.test(EC.url(key)) ? 'ec' : 'shop') });
      Browser.loading(tab, false);
      KY.keys[tab] = key;
      await wait(o.after != null ? o.after : 300);
      return doc;
    },
    keys: {},
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
    /** the admin's toggle switch (ToggleSwitchType): checked, its label as EC-CUBE's script shows it */
    async toggle(sel, on) {
      const box = EC.el(sel);
      if (!box) return;
      // the switch is drawn by its label (the input itself is not laid out): the pointer clicks the switch
      await clickUi(box.getBoundingClientRect().width ? box : (box.closest('.form-check, .form-switch, div') || box.parentElement), { after: 80 });
      box.checked = on;
      if (on) box.setAttribute('checked', ''); else box.removeAttribute('checked');
      // ToggleSwitchType: two labels (#id-on / #id-off), one hidden (d-none) — as its script switches them
      const doc = box.ownerDocument;
      const onEl = doc.querySelector(`.${box.id}-on`), offEl = doc.querySelector(`.${box.id}-off`);
      if (onEl) onEl.classList.toggle('d-none', !on);
      if (offEl) offEl.classList.toggle('d-none', on);
      await wait(250);
    },
    textEl(sel, re) { return EC.els(sel).find((e) => re.test(e.textContent)) || null; },
  };

  /* the live product page with the badge, after the deploy (a simulation, see above) */
  const badgeHtml = () => {
    const d = EC.doc('front-7-badge');
    const p = d && d.querySelector('p.stockBadges');
    return p ? p.outerHTML : '';
  };
  window.StoreFrame.STATES.badge = {
    on(doc) {
      const p = doc.querySelector('p.detail04');
      const html = badgeHtml();
      if (!p || !html) return;
      p.insertAdjacentHTML('beforebegin', html);
      const st = doc.createElement('style');
      st.dataset.demo = 'badge';
      st.textContent = SRC.CSS.join('\n');
      doc.head.appendChild(st);
    },
    off(doc) { doc.querySelectorAll('style[data-demo="badge"], p.stockBadges').forEach((n) => n.remove()); },
  };

  /** the terminal on the production server (ssh): the bash prompt */
  const LOCAL_PROMPT = K.Term.prompt;
  const Shell = {
    remote(user, host, dir = '~') { K.Term.prompt = `[${user}@${host} ${dir}]$ `; },
    cd(dir) { K.Term.prompt = K.Term.prompt.replace(/ [^ \]]+\]\$ $/, ` ${dir}]$ `); },
    local() { K.Term.prompt = LOCAL_PROMPT; },
  };

  window.KY = KY;
  window.AP = { Shell, blurPii };
})();
