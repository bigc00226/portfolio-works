/*
 * What this video adds on top of the shared kit (shared/kit/kit.js) and the WordPress screens (shared/wordpress/wp-frame.js):
 *   RB.wp(tab, key)      shows a real WordPress screen (js/wp-snapshot.js) in a browser tab (title / address / site icon)
 *   RB.phpLang()         PHP files and style.css indented with tabs (WordPress coding standards)
 *   StoreFrame.STATES    the looks of the dev site (localhost:8888, the live site's own markup) before a step is done or
 *                        while a mistake is on screen:
 *     noSymptoms   the global navigation without 症状別のお悩み (before header.php gets the item)
 *     noTel        the fixed buttons without 電話予約 (before contact-btn.php gets it)
 *     spHeader     smartphone: the phone number of the PC header still shown (no SP rule yet) — it pushes the menu
 *                  button out of the screen
 *     spFooter     smartphone: the footer's bottom space taken away by `padding-block` — the fixed buttons cover the
 *                  privacy policy link and the copyright
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { $ } = D;
  const { Code, Browser } = K;
  // the dev site (wp-env, no site icon): WordPress' own icon, as /favicon.ico of a WordPress without a site icon
  Browser.FAV.wp = '<img class="br-fav img" src="../../shared/favicons/wordpress.png" alt="">';

  /* ---------------------------------------------------------------- PHP in the editor */
  // the shared highlighter colours PHP (and names it in the status bar); WordPress coding standards indent with tabs
  function phpLang() {
    for (const [p, f] of Object.entries(Code.files)) if (/\.php$|style\.css$/.test(p)) f.indent = '\t';
  }

  /* ---------------------------------------------------------------- real WordPress screens in a tab */
  async function wp(tab, key, o = {}) {
    const t = Browser.tab(tab);
    if (o.load !== false) { Browser.loading(tab, true); await D.wait(o.ms || 420); }
    // the tab remembers its screen: two tabs (the live site, the admin) share the one WordPress page
    t.wpKey = key;
    t.onShow = () => { if (t.page === 'wp' && t.wpKey) window.WP.show(t.wpKey); };
    const doc = await window.WP.show(key);
    Browser.nav(tab, { title: window.WP.title(key), url: o.url || window.WP.url(key), page: 'wp', fav: 'store' });
    if (o.load !== false) Browser.loading(tab, false);
    return doc;
  }

  /* ---------------------------------------------------------------- a <select> of a captured screen: Chrome's list */
  async function select(el, pick, o = {}) {
    await D.clickUi(el, { after: 80 });
    const r = D.screenRect(el);
    const s = r.height / (el.offsetHeight || r.height);
    const opts = [...el.options].map((x) => x.textContent.replace(/ /g, ' '));
    const pop = document.createElement('div');
    pop.className = 'rb-sel';
    pop.innerHTML = opts.map((x, i) => `<div class="${el.selectedIndex === i ? 'cur' : ''}">${D.esc(x)}</div>`).join('');
    pop.style.left = r.left + 'px'; pop.style.top = r.bottom + 'px';
    pop.style.minWidth = r.width / s + 'px';
    pop.style.transform = `scale(${s})`;
    document.body.appendChild(pop);
    await D.wait(o.look || 450);
    const i = opts.findIndex((x) => (pick instanceof RegExp ? pick.test(x) : x.trim() === pick));
    if (i < 0) { pop.remove(); throw new Error('select: no option ' + pick); }
    const row = pop.children[i];
    await D.hoverUi(row, { hold: 120 });
    [...pop.children].forEach((c) => c.classList.remove('cur'));
    row.classList.add('cur');
    await D.clickUi(row, { after: 60 });
    pop.remove();
    [...el.options].forEach((x) => x.removeAttribute('selected'));
    el.options[i].setAttribute('selected', '');
    el.selectedIndex = i;
    await D.wait(150);
  }

  /* ---------------------------------------------------------------- the dev site's states */
  const css = (id, text) => ({
    on(doc) { const s = doc.createElement('style'); s.id = 'demo-' + id; s.textContent = text; doc.head.appendChild(s); },
    off(doc) { const s = doc.getElementById('demo-' + id); if (s) s.remove(); },
  });
  const ST = window.StoreFrame.STATES;
  ST.noSymptoms = css('noSymptoms', '.p-gnavItem--symptoms { display: none !important; }');
  ST.noTel = css('noTel', '.p-contactBtnItem--tel { display: none !important; }');
  ST.spHeader = css('spHeader', `@media (max-width: 768px) {
    .p-headerTel { display: block !important; white-space: nowrap; }
    .p-headerInfo { padding-block: 0 !important; }
  }`);
  ST.spFooter = css('spFooter', '@media (max-width: 768px) { .p-footer { padding-bottom: min(5.3333333333vw, 2.2857142857rem) !important; } }');

  window.RB = { phpLang, wp, select };
})();
