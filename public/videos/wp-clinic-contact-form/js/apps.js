/*
 * The browser of this video:
 *   CC.wp(key)          a REAL WordPress / Contact Form 7 screen (js/wp-snapshot.js, shared/wordpress/wp-frame.js) in the
 *                       wp-admin tab, its own title / address
 *   CC.type(name, …)    types into a captured text box of the screen on show — text kept before / after the caret (the
 *                       form template is edited in the middle), Ctrl+A over the old text, the box scrolled to the caret
 *   Front               the clinics' live contact pages (js/site-snapshot.js, Kit.Store): the inputs become look-alike
 *                       boxes with their own computed style for the typing, the checkboxes / radios / the file input are
 *                       the page's own, the result of a submit (validation tips, the response) is the one Contact Form 7
 *                       rendered for the same form (WP.data: invalid / kTooLarge / kSent)
 *   Mail                the clinic's inbox (Gmail, reproduced in js/gmail.js — miyazawaclinic.net's mail is on Google)
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, S = window.SITE_SNAPSHOT, WP = window.WP;
  const { $, esc, icon, wait, clickUi, typeInto, screenRect } = D;
  const { Browser, Store } = K;

  /* ---------------------------------------------------------------- tab icons: the clinics' own site icons */
  Browser.FAV.miya = `<img class="br-fav img" src="${esc(S.favicon)}" alt="">`;
  Browser.FAV.kato = `<img class="br-fav img" src="${esc(S.kato.favicon)}" alt="">`;

  /* ---------------------------------------------------------------- the WordPress screens */
  const sel = (t) => `<span style="background:Highlight;color:HighlightText">${esc(t)}</span>`;
  /** a typing target for a captured text box: before + typed + (IME) + caret + after, the box scrolled to the caret */
  function boxTarget(box, before = '', after = '') {
    return {
      cls: { comp: 'demo-ime' },
      render(text, comp) {
        box.innerHTML = esc(before + text) + comp + '<span class="demo-caret"></span>' + esc(after);
        const c = box.querySelector('.demo-caret');
        const y = c.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
        if (y < box.scrollTop + 8 || y > box.scrollTop + box.clientHeight - 40) box.scrollTop = Math.max(0, y - box.clientHeight * 0.45);
        if (box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, c.offsetLeft - box.clientWidth + 40);
      },
      anchor() { const c = box.querySelector('.demo-ime.active') || box.querySelector('.demo-ime') || box.querySelector('.demo-caret') || box; return screenRect(c); },
    };
  }
  const CC = {
    DEV: 'https://miyazawaclinic.net',
    KATO: 'https://kato-dental-clinic.net',
    /** shows a captured screen in a wp-admin tab (o.load: the page loads for that long, the tab spinning) */
    async wp(key, o = {}) {
      const tab = o.tab || Browser.active;
      if (o.load) Browser.loading(tab, true);
      await WP.show(key);
      Browser.nav(tab, { title: WP.title(key), url: WP.url(key), page: 'wp' });
      // the screen where it was captured: a frame preloaded while hidden could not take its scroll position then
      const f = WP.frames[key], p = WP.snapshot.pages[key];
      if (f && !f.__scrolled && p.scroll && (p.scroll[0] || p.scroll[1])) { f.contentWindow.scrollTo(p.scroll[0], p.scroll[1]); f.__scrolled = true; }
      if (o.load) { await wait(o.load); Browser.loading(tab, false); }
      return WP.doc(key);
    },
    box(name) { const b = WP.field(name); if (!b) throw new Error('no text box ' + name + ' on ' + WP.screen); return b; },
    text(name) { return CC.box(name).textContent; },
    set(name, text) { CC.box(name).textContent = text; },
    /** click into a box (o.at: the caret goes at that offset of its text; o.all: Ctrl+A selects it all), type, leave */
    async type(name, script, o = {}) {
      const box = CC.box(name);
      const old = o.text != null ? o.text : box.textContent;
      const at = o.all ? 0 : o.at != null ? o.at : old.length;
      const before = o.all ? '' : old.slice(0, at), after = o.all ? '' : old.slice(at + (o.over || 0));
      if (o.click !== false) {
        box.scrollTop = o.scrollTop != null ? o.scrollTop : box.scrollTop;
        await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.15, ay: o.ay, after: 80 });
      }
      WP.focus(box, true);
      const t = boxTarget(box, before, after);
      if (o.all && old) {
        box.innerHTML = sel(old);
        await D.Keycap.show(['Ctrl', 'A'], 600);
      }
      const typed = await typeInto(t, typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 13 });
      const text = before + typed + after;
      if (o.blur !== false) { box.textContent = text; WP.focus(box, false); }
      await wait(o.wait != null ? o.wait : 200);
      return text;
    },
    /** Ctrl+A, Ctrl+V of a block of text into a box */
    async paste(name, text, o = {}) {
      const box = CC.box(name);
      if (o.click !== false) await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.3, ay: o.ay != null ? o.ay : 0.3, after: 80 });
      WP.focus(box, true);
      if (o.all !== false && box.textContent) {
        box.innerHTML = sel(box.textContent);
        await D.Keycap.show(['Ctrl', 'A'], 600);
      }
      await D.Keycap.show(['Ctrl', 'V'], 650);
      boxTarget(box, o.all !== false ? '' : box.textContent, '').render(text, '');
      if (o.top) box.scrollTop = 0;
      await wait(o.hold != null ? o.hold : 500);
      box.textContent = (o.all !== false ? '' : box.textContent) + text;
      if (o.top) box.scrollTop = 0;
      if (o.blur !== false) WP.focus(box, false);
      return box.textContent;
    },
    /** the box shows `text`, scrolled so that offset `at` sits at about a third of its height */
    show(name, text, at) {
      const box = CC.box(name);
      box.textContent = text;
      if (at != null) {
        const lines = text.slice(0, at).split('\n').length - 1;
        const lh = parseFloat(getComputedStyle(box).lineHeight) || parseFloat(box.ownerDocument.defaultView.getComputedStyle(box).lineHeight) || 20;
        box.scrollTop = Math.max(0, lines * lh - box.clientHeight / 3);
      }
      return box;
    },
    /** marks a captured text box as data to keep off the screen (blurred) */
    pii(name) { const b = CC.box(name); b.classList.add('pii'); b.style.filter = 'blur(5px)'; },
  };

  /* ---------------------------------------------------------------- the clinics' live pages */
  const PROPS = ['box-sizing', 'width', 'height', 'min-height', 'margin', 'padding', 'border', 'border-radius', 'background', 'color', 'font', 'line-height', 'letter-spacing', 'text-align', 'box-shadow', 'vertical-align', 'max-width'];
  const Front = {
    doc() { return Store.doc; },
    $(s) { return Store.doc.querySelector(s); },
    field(name) { return Store.doc.querySelector(`.wpcf7 [name="${name}"]`); },
    /** an input / textarea of the page → a look-alike box with the element's computed style (the element stays, hidden) */
    boxify(el) {
      if (el.__box) return el.__box;
      const doc = el.ownerDocument, w = doc.defaultView, cs = w.getComputedStyle(el);
      const d = doc.createElement('div');
      d.className = 'demo-box';
      for (const p of PROPS) d.style.setProperty(p, cs.getPropertyValue(p));
      const multi = el.tagName === 'TEXTAREA';
      d.style.whiteSpace = multi ? 'pre-wrap' : 'pre';
      if (!multi) { d.style.display = cs.display === 'block' ? 'flex' : 'inline-flex'; d.style.alignItems = 'center'; }
      else d.style.display = cs.display === 'inline-block' ? 'inline-block' : 'block';
      d.style.setProperty('--demo-ph', w.getComputedStyle(el, '::placeholder').color);
      d.dataset.ph = el.getAttribute('placeholder') || '';
      d.innerHTML = `<span class="demo-ph">${esc(d.dataset.ph)}</span>`;
      el.style.display = 'none';
      el.after(d);
      el.__box = d;
      d.__el = el;
      return d;
    },
    unboxify(el) { if (!el.__box) return; el.value = el.__box.__value || ''; el.__box.remove(); el.__box = null; el.style.display = ''; },
    /** clicks into a field of the form and types (IME included) */
    async type(name, script, o = {}) {
      const el = typeof name === 'string' ? Front.field(name) : name;
      if (!el) throw new Error('no field ' + name);
      if (o.scroll !== false) await Store.scrollToEl(el, o.offset || 380, o.scrollMs || 700);
      const box = Front.boxify(el);
      await clickUi(box, { kind: 'text', ax: 0.2, after: 80 });
      box.classList.add('demo-focus');
      const t = {
        cls: { comp: 'demo-ime' },
        render(text, comp) {
          box.innerHTML = !text && !comp ? `<span class="demo-caret"></span><span class="demo-ph">${esc(box.dataset.ph)}</span>` : esc(text) + comp + '<span class="demo-caret"></span>';
          box.scrollLeft = box.scrollWidth;
        },
        anchor() { const c = box.querySelector('.demo-ime.active') || box.querySelector('.demo-ime') || box.querySelector('.demo-caret') || box; return screenRect(c); },
      };
      const text = await typeInto(t, typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 12 });
      box.innerHTML = esc(text);
      box.__value = text;
      el.value = text;
      Front.clearTip(el);
      box.classList.remove('demo-focus');
      await wait(o.wait != null ? o.wait : 150);
      return text;
    },
    /** clicks a checkbox / radio of the form (by its value) */
    async check(name, value) {
      const input = [...Store.doc.querySelectorAll(`.wpcf7 [name="${name}"], .wpcf7 [name="${name}[]"]`)].find((i) => i.value === value);
      if (!input) throw new Error('no option ' + name + '=' + value);
      const label = input.closest('label') || input;
      await Store.scrollToEl(label, 420, 500);
      const target = label.querySelector('.wpcf7-list-item-label') || label;
      await clickUi(target, { kind: 'hand', ax: 0.2, after: 60 });
      input.checked = true;
      input.setAttribute('checked', '');
      Front.clearTip(input);
      await wait(200);
    },
    /** a field changed after a failed submit: Contact Form 7's script takes its tip away */
    clearTip(el) {
      const wrap = el.closest('.wpcf7-form-control-wrap');
      if (!wrap) return;
      wrap.querySelectorAll('.wpcf7-not-valid-tip').forEach((t) => t.remove());
      wrap.querySelectorAll('.wpcf7-not-valid').forEach((c) => { c.classList.remove('wpcf7-not-valid'); c.setAttribute('aria-invalid', 'false'); });
    },
    /** the submit button: a click, Contact Form 7's spinner for a moment, then `html` (what it rendered for that submit) */
    async submit(html, o = {}) {
      const btn = Front.$('.wpcf7 .wpcf7-submit');
      await Store.scrollToEl(btn, o.offset || 520, 700);
      btn.removeAttribute('disabled');
      await clickUi(btn, { kind: 'hand', after: 60 });
      const form = Front.$('.wpcf7 form');
      form.classList.add('submitting');
      await wait(o.ms || 1100);
      form.classList.remove('submitting');
      if (html) Front.result(html);
    },
    /** what Contact Form 7's script draws after a submit: the tips under the fields, the response, the form's status */
    result(html) {
      const doc = Store.doc;
      const t = new DOMParser().parseFromString(html, 'text/html');
      const form = doc.querySelector('.wpcf7 form'), tf = t.querySelector('.wpcf7 form');
      doc.querySelectorAll('.wpcf7-not-valid-tip').forEach((e) => e.remove());
      doc.querySelectorAll('.wpcf7 .wpcf7-not-valid').forEach((e) => { e.classList.remove('wpcf7-not-valid'); e.setAttribute('aria-invalid', 'false'); });
      for (const tip of t.querySelectorAll('.wpcf7-not-valid-tip')) {
        const wrapT = tip.closest('[data-name]');
        const wrap = wrapT && doc.querySelector(`.wpcf7-form-control-wrap[data-name="${wrapT.dataset.name}"]`);
        if (!wrap) continue;
        const ctl = wrap.querySelector('.wpcf7-form-control');
        if (ctl) { ctl.classList.add('wpcf7-not-valid'); ctl.setAttribute('aria-invalid', 'true'); }
        const s = doc.createElement('span');
        s.className = 'wpcf7-not-valid-tip';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = tip.textContent;
        wrap.appendChild(s);
      }
      ['init', 'invalid', 'sent', 'failed', 'spam', 'unaccepted', 'aborted', 'resetting', 'submitting'].forEach((c) => form.classList.remove(c));
      const status = tf.getAttribute('data-status') || 'init';
      form.classList.add(status);
      form.setAttribute('data-status', status);
      const out = form.querySelector('.wpcf7-response-output'), outT = tf.querySelector('.wpcf7-response-output');
      if (out && outT) { out.textContent = outT.textContent; out.setAttribute('aria-hidden', outT.textContent ? 'false' : 'true'); }
      const sr = doc.querySelector('.wpcf7 .screen-reader-response p'), srT = t.querySelector('.screen-reader-response p');
      if (sr && srT) sr.textContent = srT.textContent;
      if (status === 'sent') {
        // the form is reset after sending: the typed values go, the checkboxes are cleared
        doc.querySelectorAll('.wpcf7 .demo-box').forEach((b) => { b.__value = ''; b.innerHTML = `<span class="demo-ph">${esc(b.dataset.ph)}</span>`; });
        doc.querySelectorAll('.wpcf7 input[type="checkbox"], .wpcf7 input[type="radio"]').forEach((i) => { i.checked = false; i.removeAttribute('checked'); });
        doc.querySelectorAll('.wpcf7 input[type="file"]').forEach((i) => { i.value = ''; });
      }
    },
    /** other markup in place of the form: what Contact Form 7 rendered for another template (the automatic formatting
     *  on), or the theme's static form before Contact Form 7 (the markup the page keeps in an HTML comment).
     *  (doc: the page being loaded — Store.load's `before`, so the page never shows the live form first) */
    replaceForm(html, doc = Store.doc) {
      const cur = doc.querySelector('.wpcf7');
      if (!cur) return;
      const t = doc.createElement('div');
      t.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
      cur.replaceWith(t.firstElementChild);
    },
    /** the submit button as a visitor sees it: the captured page has it disabled (Contact Form 7 waits for the reCAPTCHA
     *  token, which a capture without scripts never gets) */
    enable(doc = Store.doc) { doc.querySelectorAll('.wpcf7-submit[disabled]').forEach((b) => b.removeAttribute('disabled')); },
    /** a row of the captured form (the file field Contact Form 7 rendered) put into the live table, after `afterName`'s row */
    addRow(html, name, afterName, doc = Store.doc) {
      const t = new DOMParser().parseFromString(html, 'text/html');
      const row = t.querySelector(`[data-name="${name}"]`).closest('tr');
      const after = doc.querySelector(`.wpcf7 [data-name="${afterName}"]`).closest('tr');
      const tr = doc.importNode(row, true);
      after.after(tr);
      const form = doc.querySelector('.wpcf7 form');
      form.setAttribute('enctype', 'multipart/form-data');
      return tr;
    },
    /** a file picked in the file input (the input shows its name, as Chrome does) */
    pickFile(name, file) {
      const input = Front.field(name);
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array(16)], file, { type: /\.pdf$/i.test(file) ? 'application/pdf' : 'image/jpeg' }));
      input.files = dt.files;
      return input;
    },
  };

  /* ---------------------------------------------------------------- the clinic's inbox */
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mail">${window.GmailUI.shell({ account: '京', avatar: '#00897b', labels: ['お問い合わせ', 'ご予約'] })}</div>`);
  const Mail = {
    list: [],
    render(o = {}) {
      // Gmail's inbox / message view (js/gmail.js)
      $('#wmBody').innerHTML = o.open != null ? this.reading(this.list[o.open]) : window.GmailUI.list(this.list, { ...o, newAll: true });
      window.GmailUI.count(this.list);
    },
    reading(m) {
      return window.GmailUI.reading({ ...m, html: null }, this.list);
    },
    add(m) { this.list.unshift({ read: false, ...m }); },
    row(i) { return $(`#wmBody .wm-row[data-mail="${i}"]`); },
  };

  window.CC = CC;
  window.Front = Front;
  window.Mail = Mail;
})();
