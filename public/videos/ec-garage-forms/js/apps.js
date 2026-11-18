/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE 2 screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js):
 *   - the tab icons: EC-CUBE 2's admin has no favicon → Chrome's own icon; the live shop → its favicon (with the snapshot)
 *   - Pdf: the 納品書 PDFs EC-CUBE 2 itself made (assets/pdf/*.pdf) in Chrome's own PDF viewer, captured at this page
 *     area's size (1920×947, assets/pdf/*.webp — tools/snapshots/ec-garage-forms/capture-ec.js). Spots for the pointer and
 *     the issue frames are placed from the page's position on screen and FPDF's own coordinates (mm, A4 = 210 mm wide):
 *     the logo, the shop block, the amount, the table, the 備考. The (fictional) customer's name and address are blurred.
 *   - the EC-CUBE screens: the (fictional) customers' names / e-mail / phone in the lists blurred; a checkbox ticked;
 *     a popup page (帳票出力・SQL確認) shown in its own tab
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { $, esc } = D;
  const EC = window.EC;
  const S = window.SITE_SNAPSHOT;

  K.Browser.FAV.ec = K.Browser.FAV.dev;
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  K.Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || '../../shared/favicons/default.png')}" alt="">`;

  /* the live shop's icons: its sprite inlined (a file:// page cannot <use> an outside file) */
  window.StoreFrame.STATES.icons = {
    on(doc) {
      if (!window.GARAGE_ICONS || doc.getElementById('garage-icons')) return;
      const box = doc.createElement('div');
      box.id = 'garage-icons';
      box.style.display = 'none';
      box.innerHTML = window.GARAGE_ICONS;
      doc.body.insertBefore(box, doc.body.firstChild);
      doc.querySelectorAll('use').forEach((u) => {
        for (const at of ['href', 'xlink:href']) {
          const v = u.getAttribute(at);
          if (v && /icons.svg#/.test(v)) u.setAttribute(at, v.replace(/^.*icons.svg#/, '#'));
        }
      });
    },
    off() {},
  };

  /* ===================================================================== PDF viewer */
  const PV = (EC.data && EC.data.pdf) || {};
  // FPDF's positions in SC_Fpdf (mm from the page's top-left) — with the 品番 column the table is 168.5 mm wide
  const MM = {
    logo: [123, 44, 42, 16], shop: [124, 56, 70, 33], customer: [21, 38, 72, 26], amount: [20, 92, 76, 14],
    table: [20, 148, 168.5, 44], col1: [20, 148, 86.3, 34], code: [106.3, 148, 24, 34], right: [182, 148, 26, 44], note: [20, 210, 168.5, 22],
  };
  const Pdf = {
    key: null,
    has(k) { return !!PV[k]; },
    show(k) {
      const q = PV[k];
      this.key = k;
      $('#pvImg').src = q ? q.img : '';
      const [x, y, w] = q ? q.page : [0, 0, 0];
      const s = w / 210;
      $('#pvSpots').innerHTML = Object.entries(MM).map(([n, [l, t, ww, hh]]) => `<div class="pv-spot" data-spot="${n}" style="left:${Math.round(x + l * s)}px;top:${Math.round(y + t * s)}px;width:${Math.round(ww * s)}px;height:${Math.round(hh * s)}px"></div>`).join('')
        + (/-p3$/.test(k) ? '' : `<div class="pv-blur" style="left:${Math.round(x + 22 * s)}px;top:${Math.round(y + 39 * s)}px;width:${Math.round(62 * s)}px;height:${Math.round(23 * s)}px"></div>`);
    },
    spot(n) { return $(`#pvSpots [data-spot="${n}"]`); },
  };

  /* ===================================================================== the EC-CUBE screens */
  /** the fictional customers' personal data in the captured lists: blurred like the other videos' test customers */
  function blurPeople() {
    for (const f of Object.values(EC.frames)) {
      const d = f.contentDocument;
      if (!d) continue;
      d.querySelectorAll('table.list td').forEach((td) => {
        const t = td.textContent.trim();
        if (/^[一-龥ぁ-んァ-ヶ]{1,4}\s[一-龥ぁ-んァ-ヶ]{1,4}$/.test(t) || /@example\.jp|0000$/.test(t)) td.classList.add('pii');
      });
    }
  }
  /** ticks a checkbox of the screen on show (the real list's 「一括出力」 boxes) */
  function tick(sel, on = true) { const c = EC.el(sel); if (!c) return null; c.checked = on; if (on) c.setAttribute('checked', ''); else c.removeAttribute('checked'); return c; }

  /** closes a browser tab (Ctrl+W): the tab before it becomes the active one */
  function closeTab(id) {
    const B = K.Browser;
    const i = B.tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    const el = B.tabEl(id);
    if (el) el.remove();
    B.tabs.splice(i, 1);
    if (B.active === id && B.tabs.length) B.activate(B.tabs[Math.max(0, i - 1)].id);
  }

  window.GA = { Pdf, blurPeople, tick, closeTab };
})();
