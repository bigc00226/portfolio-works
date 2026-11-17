/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real WordPress screens
 * (shared/wordpress/wp-frame.js, js/wp-snapshot.js):
 *   - the tab icons: the dev site (http://localhost:8888) answers /favicon.ico with WordPress' own icon (no site icon is
 *     set); crooz.co.jp serves its own /favicon.ico (assets/favicon.ico, downloaded from the live site)
 *   - the home page's first-view video: a frame of the live video as its poster (the snapshot has no video sources)
 *   - states of the captured live pages (js/site-snapshot.js) for the moments the dev site differs from it:
 *       noMenu       before the global menu is assigned: the header shows no navigation
 *       noTemplate   会社概要 published with the Japanese slug: page-overview.php is not used (page.php: title only)
 *       spBroken     the 会社概要 table at 390 px before the smartphone CSS (dt / dd stay table cells)
 *       contactReady   the contact page after 「理解したうえで問い合わせを行う」 is ticked: the notice closed
 *       contactInvalid Contact Form 7's answer to 送信 with the required fields empty (the tips, the message)
 */
(function () {
  'use strict';
  const K = window.Kit, S = window.SITE_SNAPSHOT;
  const ST = window.StoreFrame.STATES;

  K.Browser.FAV.wp = '<img class="br-fav img" src="../../shared/favicons/wordpress.png" alt="">';
  K.Browser.FAV.store = '<img class="br-fav img" src="assets/favicon.ico" alt="">';

  // the home page's first view is a video; the snapshot keeps its <video> elements without their sources (a black box):
  // a frame of each video (tools/snapshots/wp-crooz/hero-frame.js) becomes its poster
  if (S && S.pages.home) {
    for (const view of ['pc', 'sp']) {
      if (S.pages.home[view]) S.pages.home[view] = S.pages.home[view].replace(/<video id="(video01(?:_sp)?)"/g, (m, id) => `${m} poster="assets/site/hero/${id === 'video01_sp' ? 'sp' : 'pc'}.webp"`);
    }
  }

  const css = (doc, id, text) => { let s = doc.getElementById(id); if (!s) { s = doc.createElement('style'); s.id = id; doc.head.appendChild(s); } s.textContent = text; };
  const uncss = (doc, id) => { const s = doc.getElementById(id); if (s) s.remove(); };

  ST.noMenu = {
    on(doc) { css(doc, 'demo-nomenu', '.header .gnav, .header .sub-navbox { visibility: hidden !important; }'); },
    off(doc) { uncss(doc, 'demo-nomenu'); },
  };
  ST.noTemplate = {
    on(doc) { css(doc, 'demo-notpl', '.page-overview { display: none !important; } .article-overview .page-content { min-height: 260px; }'); },
    off(doc) { uncss(doc, 'demo-notpl'); },
  };
  ST.spBroken = {
    on(doc) {
      css(doc, 'demo-spbroken', `
        .page-overview .table-overview dl { display: table !important; width: 100% !important; }
        .page-overview .table-overview dl dt { display: table-cell !important; width: 280px !important; min-width: 120px; padding: 35px 10px !important; text-align: center !important; font-size: 17px !important; }
        .page-overview .table-overview dl dd { display: table-cell !important; width: 730px !important; padding: 35px 10px !important; border-top: 1px solid #333 !important; font-size: 16px !important; }`);
    },
    off(doc) { uncss(doc, 'demo-spbroken'); },
  };

  /** the contact page's own notice (#form_modal over the page until 「理解したうえで問い合わせを行う」 is ticked) */
  const notice = (doc) => {
    const cb = doc.querySelector('#agreeCheckbox') || [...doc.querySelectorAll('input[type="checkbox"]')].find((c) => /理解したうえで/.test((c.closest('label') || c.parentElement || {}).textContent || ''));
    if (!cb) return null;
    return { cb, box: cb.closest('.form_modal') || doc.querySelector('#form_modal') };
  };
  /** ticks the checkbox and closes the notice (what the site's script does) */
  const closeNotice = (doc) => {
    const n = notice(doc);
    if (!n) return;
    n.cb.checked = true;
    n.cb.setAttribute('checked', '');
    if (n.box) n.box.style.display = 'none';
  };
  const activeForm = (doc) => doc.querySelector('.tab_box.active form.wpcf7-form') || doc.querySelector('form.wpcf7-form');
  ST.contactReady = {
    on(doc) { closeNotice(doc); },
    off() {},
  };
  /**
   * 送信 with the required fields empty: what Contact Form 7's script draws from the REST answer
   * (status "validation_failed"): the form's class / data-status, a tip under each required field, the response
   * message. The texts are CF7's own defaults (メッセージ tab of the captured form: invalid_required / validation_error).
   */
  ST.contactInvalid = {
    on(doc) {
      const form = activeForm(doc);
      if (!form) return;
      form.classList.remove('init');
      form.classList.add('invalid');
      form.setAttribute('data-status', 'invalid');
      form.querySelectorAll('.wpcf7-validates-as-required').forEach((inp) => {
        inp.classList.add('wpcf7-not-valid');
        inp.setAttribute('aria-invalid', 'true');
        const wrap = inp.closest('.wpcf7-form-control-wrap') || inp.parentElement;
        if (!wrap.querySelector('.wpcf7-not-valid-tip')) wrap.insertAdjacentHTML('beforeend', '<span class="wpcf7-not-valid-tip" aria-hidden="true">入力してください。</span>');
      });
      const out = form.querySelector('.wpcf7-response-output');
      if (out) { out.textContent = '入力内容に問題があります。確認して再度お試しください。'; out.removeAttribute('aria-hidden'); }
    },
    off(doc) {
      const form = activeForm(doc);
      if (!form) return;
      form.classList.remove('invalid');
      form.classList.add('init');
      form.setAttribute('data-status', 'init');
      form.querySelectorAll('.wpcf7-not-valid-tip').forEach((t) => t.remove());
      form.querySelectorAll('.wpcf7-not-valid').forEach((i) => { i.classList.remove('wpcf7-not-valid'); i.setAttribute('aria-invalid', 'false'); });
      const out = form.querySelector('.wpcf7-response-output');
      if (out) { out.textContent = ''; out.setAttribute('aria-hidden', 'true'); }
    },
  };

  window.Crooz = { notice, closeNotice, activeForm };
})();
