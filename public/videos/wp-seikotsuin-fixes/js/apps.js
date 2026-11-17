/*
 * This video's pieces on top of the shared kit (public/shared/kit/) and the WordPress screens (public/shared/wordpress/):
 *   - the browser page `wp` (the real wp-admin screens of はらいろ整骨院, js/wp-snapshot.js)
 *   - the two live sites in the kit's store page (js/site-snapshot.js: pages harairo / heiwajima / heiwajima-menu),
 *     each tab with its site's own favicon
 *   - the looks of the live pages before a fix is uploaded and while a mistake is on (StoreFrame.STATES):
 *       h10    はらいろ: the menu without 10 酸素カプセル           hCta   no 酸素カプセル link in the green box
 *       hIcon  はらいろ: item 10 there, its icon not uploaded yet   hNoSp  the link's tablet / smartphone styles not there yet
 *       hNote  はらいろ: the footer still says 土曜17:00まで       hSide  the side tab as on a scrolled page (fixed, closed)
 *       wHours へいわじま: the hours before the change           wAddr  the address without the smartphone line break
 *       wTypo  へいわじま: the break written as class="br-sp" (no such class: it breaks on PC too)
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, S = window.SITE_SNAPSHOT;
  const { $ } = D;

  /* the WordPress screens */
  $('#brContent').insertAdjacentHTML('afterbegin', '<div class="br-page" data-page="wp" id="wpPage"></div>');

  /* favicons: each site's own (the snapshot keeps it) */
  const FI = (src) => `<img class="br-fav img" src="${src}" alt="">`;
  K.Browser.FAV.harairo = FI(S.sites.harairo.favicon);
  K.Browser.FAV.heiwajima = FI(S.sites.heiwajima.favicon);

  /* ------------------------------------------------------------------ the looks of the live pages */
  const ST = window.StoreFrame.STATES;
  const hide = (doc, sel) => doc.querySelectorAll(sel).forEach((e) => e.setAttribute('data-demo-hidden', ''));
  const unhide = (doc, sel) => doc.querySelectorAll(sel).forEach((e) => e.removeAttribute('data-demo-hidden'));
  const item10 = (doc) => [...doc.querySelectorAll('#topMenu .item')].find((e) => /^\s*10\s*$/.test((e.querySelector('.num') || {}).textContent || ''));
  ST.h10 = {
    on(doc) { const e = item10(doc); if (e) e.setAttribute('data-demo-hidden', ''); },
    off(doc) { const e = item10(doc); if (e) e.removeAttribute('data-demo-hidden'); },
  };
  ST.hCta = {
    on(doc) { hide(doc, '.cCtaBox01 .ctaYoyaku'); },
    off(doc) { unhide(doc, '.cCtaBox01 .ctaYoyaku'); },
  };
  // the icon not on the server yet: the browser's broken image (an image that cannot be decoded; no request is made)
  ST.hIcon = {
    on(doc) { const e = item10(doc); const i = e && e.querySelector('img'); if (i) { i.dataset.demoSrc = i.getAttribute('src'); i.src = 'data:image/svg+xml,%3Csvg'; } },
    off(doc) { const e = item10(doc); const i = e && e.querySelector('img'); if (i && i.dataset.demoSrc) i.src = i.dataset.demoSrc; },
  };
  // base.css with the PC styles of the green box link only: its tablet / smartphone rules taken out of the stylesheet
  const isNarrow = (m) => /max-width:\s*767px|max-width:\s*1239px/.test(m.conditionText || (m.media && m.media.mediaText) || '');
  ST.hNoSp = {
    on(doc) {
      const walk = (list, narrow) => {
        for (let i = list.cssRules.length - 1; i >= 0; i--) {
          const r = list.cssRules[i];
          if (r.cssRules && r.conditionText != null) walk(r, narrow || isNarrow(r));
          else if (narrow && r.selectorText && /\.ctaYoyaku/.test(r.selectorText)) list.deleteRule(i);
        }
      };
      [...doc.styleSheets].forEach((s) => { try { walk(s, false); } catch (e) {} });
    },
    off() {},   // (the page is loaded again)
  };
  /**
   * はらいろ's side tab 「診療時間・予約」 (#fixbtn): the site's script makes it `fixed` once the page is scrolled and
   * opens / closes it on a click on its title (`on` / `off`); the snapshot has it as captured at the top (`home off`)
   */
  const side = (doc, open, anim) => {
    const e = doc.getElementById('fixbtn');
    if (!e) return;
    if (anim) e.style.setProperty('transition', 'transform .4s ease-out', 'important');
    e.className = 'fixed ' + (open ? 'on' : 'off');
  };
  ST.hSide = { on(doc) { side(doc, false); }, off() {} };
  const noteP = (doc) => [...doc.querySelectorAll('.ftrInfo p')].find((p) => /土曜/.test(p.textContent));
  ST.hNote = {
    on(doc) { const p = noteP(doc); if (p) { p.dataset.demoOrig = p.innerHTML; p.innerHTML = '予約優先制/木曜午後・日曜休み/<br class="forSP">土曜17:00まで'; } },
    off(doc) { const p = noteP(doc); if (p && p.dataset.demoOrig) p.innerHTML = p.dataset.demoOrig; },
  };
  const hours = (doc) => [...doc.querySelectorAll('.footer_info_table .hours_list dd')];
  ST.wHours = {
    on(doc) {
      const [a, b] = hours(doc);
      if (a) { a.dataset.demoOrig = a.innerHTML; a.innerHTML = '10-21時'; }
      if (b) { b.dataset.demoOrig = b.innerHTML; b.innerHTML = '9-15時'; }
    },
    off(doc) { hours(doc).forEach((d) => { if (d.dataset.demoOrig) d.innerHTML = d.dataset.demoOrig; }); },
  };
  const addrTd = (doc) => [...doc.querySelectorAll('.footer_info_table td')].find((td) => /巳の丸ビル/.test(td.textContent));
  ST.wAddr = {
    on(doc) { const td = addrTd(doc); if (td) { td.dataset.demoOrig = td.innerHTML; td.innerHTML = td.innerHTML.replace(/<br class="br_sp">/, ''); } },
    off(doc) { const td = addrTd(doc); if (td && td.dataset.demoOrig) td.innerHTML = td.dataset.demoOrig; },
  };
  ST.wTypo = {
    on(doc) { const td = addrTd(doc); if (td) { td.dataset.demoOrig = td.innerHTML; td.innerHTML = td.innerHTML.replace(/<br class="br_sp">/, '<br class="br-sp">'); } },
    off(doc) { const td = addrTd(doc); if (td && td.dataset.demoOrig) td.innerHTML = td.dataset.demoOrig; },
  };

  window.SEIK = { item10, noteP, addrTd, hoursDd: hours, side };
})();
