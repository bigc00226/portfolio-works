/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real WordPress screens
 * (shared/wordpress/wp-frame.js, js/wp-snapshot.js):
 *   - the tab icons: wp-admin of the dev site (no site icon) → WordPress' own icon; the shop's pages → the theme's
 *     favicon (with the snapshot)
 *   - personal data blurred: the invented member / customers in the admin screens and the member's pages
 *   - the live pages (js/site-snapshot.js) in the states the dev site goes through:
 *       noRegister      マイアカウント before 「「マイアカウント」ページ上」 is on: no 「新規登録はこちら」
 *       registerPlain   /account/?register=1 before the theme's fields: WooCommerce's own form (メール・パスワード)
 *       member*         /account/ logged in as the member: WooCommerce's マイアカウント as the real WordPress rendered it
 *                       for her (WP_SNAPSHOT.data.front, tools/snapshots/…/capture-wp.js) in the live page
 *       wholesalePrice  the product page as the member sees it (B2BKing's group price, as rendered there)
 *       wholesaleDenied / wholesaleAllowed  卸会員さま専用ページ (Members' message / the page) in the live page's frame
 *   - Front: the registration form's fields → look-alike boxes (typing with the IME), Chrome's address autofill
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { $, esc, wait, clickUi, hoverUi, typeInto, screenRect } = D;
  const { Store } = K;
  const ST = window.StoreFrame.STATES;
  const WS = window.WP_SNAPSHOT || { data: {} };
  const FR = (WS.data && WS.data.front) || {};

  K.Browser.FAV.wp = '<img class="br-fav img" src="../../shared/favicons/wordpress.png" alt="">';

  // B2BKing's CRM Hub asks Gravatar for the member's picture with d=404 (she has none: the circle stays empty, as on the
  // captured screen) — a transparent pixel instead of the request that answers 404
  const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const noAvatar = (p) => { if (p.html) p.html = p.html.replace(/https:\/\/secure\.gravatar\.com\/avatar\/[^"' ]*?d=404[^"' ]*/g, PIXEL); Object.values(p.frames || {}).forEach(noAvatar); };
  Object.values(WS.pages || {}).forEach(noAvatar);

  /* ---------------------------------------------------------------- personal data (invented) → blurred */
  const PII = ['森田由紀', '森田 由紀', '森田', '由紀', 'もりた', 'ゆき', 'カフェ こもれび', 'komorebi.morita@example.jp', 'komorebi.morita', '631-0033', 'あやめ池南 1-2-3', '0742-00-0000',
    '佐藤美穂', '高橋健一', '中村彩', '小林直樹', '山本恵子', '井上大輔', '木村紗希', '林智子', '佐藤', '美穂', '高橋', '健一', '中村', '彩', '小林', '直樹', '山本', '恵子', '井上', '大輔', '木村', '紗希', '林', '智子',
    'sato.miho', 'takahashi.k', 'aya.nakamura', 'kobayashi.naoki', 'k.yamamoto', 'inoue.daisuke', 'saki.kimura', 'tomoko.hayashi', '@example.jp'];
  const PII_RE = new RegExp(PII.slice().sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const LONG = PII.filter((s) => s.length >= 3);
  /** wraps the invented names / addresses in the document in .pii (and marks inputs holding them) */
  function blurPii(doc) {
    if (!doc || doc.__pii) return;
    doc.__pii = true;
    if (!doc.getElementById('demo-pii')) { const s = doc.createElement('style'); s.id = 'demo-pii'; s.textContent = '.pii { filter: blur(5px); } #pr_jp4wc_promotion, .jp4wc-promotion-notice { display: none !important; }'; (doc.head || doc.documentElement).appendChild(s); }
    const skip = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION']);
    const walker = doc.createTreeWalker(doc.body || doc.documentElement, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n; (n = walker.nextNode());) {
      if (!n.nodeValue.trim() || skip.has(n.parentNode.nodeName) || n.parentNode.closest('.pii')) continue;
      // short names (林, 彩 …) only where the whole text is a name (a table cell, a link) — not inside other words
      PII_RE.lastIndex = 0;
      if (PII_RE.test(n.nodeValue) && (LONG.some((s) => n.nodeValue.includes(s)) || PII.includes(n.nodeValue.trim().replace(/\s*さん$/, '')))) hits.push(n);
    }
    for (const n of hits) {
      const span = doc.createElement('span');
      span.innerHTML = esc(n.nodeValue).replace(PII_RE, (m) => `<span class="pii">${m}</span>`);
      n.replaceWith(...span.childNodes);
    }
    doc.querySelectorAll('input[value], [data-demo-input]').forEach((e) => { const v = e.getAttribute('value') || e.textContent || ''; if (v && (LONG.some((s) => v.includes(s)) || PII.includes(v.trim()))) e.classList.add('pii'); });
    doc.querySelectorAll('select').forEach((s) => { const o = s.options[s.selectedIndex]; if (o && PII.includes(o.textContent.trim())) s.classList.add('pii'); });
    // Japanized for WooCommerce's Paidy promotion (a notice a working shop dismissed long ago: 「×」 → wc-paidy-hide-notice)
    doc.querySelectorAll('a[href*="wc-paidy-hide-notice"], a[href*="jp4wc-hide-notice"]').forEach((x) => { const n = x.closest('.notice'); if (n) n.style.display = 'none'; });
    doc.querySelectorAll('img.avatar').forEach((i) => { if (i.closest('.column-username, #b2bking_crm_hub_container')) i.classList.add('pii'); });
  }
  /** every captured screen (and its iframes) once */
  function blurWp(key) { (window.WP.docs(key) || []).forEach(blurPii); }

  /* ---------------------------------------------------------------- the live pages' states */
  const css = (doc, id, text) => { let s = doc.getElementById(id); if (!s) { s = doc.createElement('style'); s.id = id; doc.head.appendChild(s); } s.textContent = text; };
  const uncss = (doc, id) => { const s = doc.getElementById(id); if (s) s.remove(); };

  ST.noRegister = {
    on(doc) { css(doc, 'demo-noreg', '.woocommerce-register-switch-link { visibility: hidden !important; }'); },
    off(doc) { uncss(doc, 'demo-noreg'); },
  };
  // WooCommerce's own registration form: the theme's fields (billing_*, 生年月日, 性別) not there yet
  ST.registerPlain = {
    on(doc) { css(doc, 'demo-regplain', 'form.register > p[id^="billing_"], form.register #birth_date_field, form.register #gender_field { display: none !important; }'); },
    off(doc) { uncss(doc, 'demo-regplain'); },
  };

  /**
   * the live theme's stylesheet has no rules for the logged-in マイアカウント (that page is behind the login): a layout in
   * the site's own look (the colours / rules of its pages) around WooCommerce's markup
   */
  const ACCOUNT_CSS = `
    .cm-txtcontents__body > .woocommerce { display: flex; gap: 64px; max-width: 1040px; margin: 24px auto 96px; font-size: 16px; line-height: 1.9; text-align: left; }
    .woocommerce-MyAccount-navigation { flex: 0 0 230px; }
    .woocommerce-MyAccount-navigation ul { list-style: none; margin: 0; padding: 0; border-top: 1px solid #cfc8b8; }
    .woocommerce-MyAccount-navigation li { border-bottom: 1px solid #cfc8b8; margin: 0; }
    .woocommerce-MyAccount-navigation li a { display: block; padding: 15px 14px; font-size: 15px; color: #333; text-decoration: none; letter-spacing: .05em; }
    .woocommerce-MyAccount-navigation li.is-active a { background: #f4f0e6; font-weight: 600; }
    .woocommerce-MyAccount-content { flex: 1; font-size: 15px; color: #333; }
    .woocommerce-MyAccount-content p { margin: 0 0 1.2em; }
    .woocommerce-MyAccount-content a { color: #7a6a3a; text-decoration: underline; }
    .woocommerce-MyAccount-content table.member-status { width: 100%; border-collapse: collapse; margin: 0 0 1.6em; border-top: 1px solid #cfc8b8; }
    .woocommerce-MyAccount-content table.member-status th, .woocommerce-MyAccount-content table.member-status td { padding: 16px 14px; border-bottom: 1px solid #cfc8b8; text-align: left; font-weight: 400; }
    .woocommerce-MyAccount-content table.member-status th { width: 180px; background: #f8f6f0; }
  `;
  /** the live account page's content → WooCommerce's マイアカウント as rendered for the member */
  const account = (html) => ({
    on(doc) {
      const box = doc.querySelector('.cm-txtcontents__body');
      if (!box || !html) return;
      if (box.__orig == null) box.__orig = box.innerHTML;
      box.innerHTML = html;
      css(doc, 'demo-account', ACCOUNT_CSS);
      const login = doc.querySelector('.cm-hnew__infoOtherLink.is-login .target__txt');
      if (login) { login.__orig = login.__orig || login.textContent; login.textContent = 'マイページ'; }
      doc.body.classList.remove('b2bking_logged_out', 'woocommerce-login');
      doc.body.classList.add('logged-in');
      blurPii(doc);
    },
    off(doc) {
      const box = doc.querySelector('.cm-txtcontents__body');
      if (box && box.__orig != null) { box.innerHTML = box.__orig; box.__orig = null; }
      const login = doc.querySelector('.cm-hnew__infoOtherLink.is-login .target__txt');
      if (login && login.__orig) login.textContent = login.__orig;
    },
  });
  // the 会員ステータス of a member not in a B2B group (the template's other branch, as it prints it)
  const general = (h) => (h || '').replace(/<td>卸会員<\/td>/, '<td>一般会員</td>')
    .replace(/<p><a href="[^"]*\/wholesale\/">卸会員さま専用ページ（価格表・ご注文方法）<\/a><\/p>/, '<p>卸売りをご希望の方は、<a href="http://localhost:8888/big-purchase">卸売りについて</a>のフォームからお申し込みください。</p>');
  ST.memberDash = account(FR.dashA);
  ST.memberDash2 = account(FR.dashB);
  ST.memberStatus = account(FR.status);
  ST.memberStatusGeneral = account(general(FR.status));

  ST.wholesalePrice = {
    on(doc) {
      if (!FR.price) return;
      const t = new DOMParser().parseFromString(FR.price, 'text/html').body.firstElementChild;
      // every price of this product on the page (the theme prints it more than once, e.g. for the smartphone layout)
      doc.querySelectorAll('p.price').forEach((p) => {
        if (!/1,620/.test(p.textContent)) return;
        p.__orig = p.__orig || p.innerHTML;
        p.innerHTML = t.innerHTML;
        p.classList.add('demo-wholesale');
      });
      // the theme shows the price in its own block (dd.cart__blockInfoPrice; the p.price above is hidden by its CSS):
      // the group price there as well — B2BKing filters the product's price, which that block prints
      const group = (t.textContent.match(/[d,]+/) || [])[0];
      if (group) doc.querySelectorAll('.cart__blockInfoPrice').forEach((dd) => {
        if (!/1,620/.test(dd.textContent)) return;
        dd.__orig = dd.__orig || dd.innerHTML;
        dd.innerHTML = dd.__orig.replace(/1,620/g, group);
        dd.classList.add('demo-wholesale');
      });
      const login = doc.querySelector('.cm-hnew__infoOtherLink.is-login .target__txt');
      if (login) { login.__orig = login.__orig || login.textContent; login.textContent = 'マイページ'; }
    },
    off(doc) { doc.querySelectorAll('.demo-wholesale').forEach((p) => { if (p.__orig) p.innerHTML = p.__orig; p.classList.remove('demo-wholesale'); }); },
  };
  /** the visible one of the elements matching sel (the page has hidden copies for other layouts) */
  const visible = (doc, sel) => [...doc.querySelectorAll(sel)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) || doc.querySelector(sel);

  /** 卸会員さま専用ページ in the frame of the live 卸売りについて page (title, the page's content or Members' message) */
  const wholesale = (html) => ({
    on(doc) {
      const main = doc.querySelector('main#l-contents');
      if (!main) return;
      main.__orig = main.__orig || main.innerHTML;
      const t = new DOMParser().parseFromString(html || '', 'text/html');
      const body = t.querySelector('.cm-txtcontents__body') || t.body;
      main.innerHTML = `<div class="p-bigpurchase__top u-section"><h2 class="p-bigpurchase__topTitle c-title u-jpmincho is-noanim">卸会員さま専用ページ</h2></div>
        <div class="p-bigpurchase__body"><div class="p-bigpurchase__bodyTxt demo-wholesale-body">${body.innerHTML}</div></div>`;
      css(doc, 'demo-wholesale', `.demo-wholesale-body h2 { font-size: 20px; margin: 48px 0 16px; font-weight: 600; } .demo-wholesale-body p { margin: 0 0 16px; line-height: 2; }
        .demo-wholesale-body .members-access-error { padding: 32px; background: #f6f3ea; text-align: center; }`);
      const login = doc.querySelector('.cm-hnew__infoOtherLink.is-login .target__txt');
      if (login) { login.__orig = login.__orig || login.textContent; login.textContent = 'マイページ'; }
    },
    off(doc) { const main = doc.querySelector('main#l-contents'); if (main && main.__orig) { main.innerHTML = main.__orig; main.__orig = null; } uncss(doc, 'demo-wholesale'); },
  });
  ST.wholesaleDenied = wholesale(FR.denied);
  ST.wholesaleAllowed = wholesale(FR.allowed);

  /* ---------------------------------------------------------------- the registration form on the page */
  const PROPS = ['box-sizing', 'width', 'height', 'min-height', 'margin', 'padding', 'border', 'border-radius', 'background', 'color', 'font', 'line-height', 'letter-spacing', 'text-align', 'box-shadow', 'vertical-align', 'max-width'];
  const Front = {
    $(s) { return Store.doc.querySelector(s); },
    field(name) { return Store.doc.querySelector(`form [name="${name}"]`); },
    /** an input of the page → a look-alike box with the element's computed style (the element stays, hidden) */
    boxify(el) {
      if (el.__box) return el.__box;
      const doc = el.ownerDocument, w = doc.defaultView, cs = w.getComputedStyle(el);
      const d = doc.createElement('div');
      d.className = 'demo-box';
      for (const p of PROPS) d.style.setProperty(p, cs.getPropertyValue(p));
      d.style.whiteSpace = 'pre';
      d.style.display = cs.display === 'block' ? 'flex' : 'inline-flex';
      d.style.alignItems = 'center';
      d.style.setProperty('--demo-ph', w.getComputedStyle(el, '::placeholder').color);
      d.dataset.ph = el.getAttribute('placeholder') || '';
      d.innerHTML = `<span class="demo-ph">${esc(d.dataset.ph)}</span>`;
      el.style.display = 'none';
      el.after(d);
      el.__box = d;
      return d;
    },
    /** clicks into a field and types (IME included); o.secret: ● in the key display, • in the box; o.pii: blurred */
    async type(name, script, o = {}) {
      const el = typeof name === 'string' ? Front.field(name) : name;
      if (!el) throw new Error('no field ' + name);
      if (o.scroll) await Store.scrollToEl(el, o.offset || 380, o.scrollMs || 700);
      const box = Front.boxify(el);
      await clickUi(box, { kind: 'text', ax: 0.2, after: 80 });
      box.classList.add('demo-focus');
      if (o.pii) box.classList.add('pii');
      let text = '';
      if (o.secret) {
        await D.Ime.setMode(false, true);
        for (let n = 1; n <= o.secret.length; n++) {
          D.KeyStrip.key('●');
          box.innerHTML = '•'.repeat(n) + '<span class="demo-caret"></span>';
          await D.kw(1000 / 12 * (0.55 + Math.random() * 0.9));
        }
        D.KeyStrip.idleHide(700);
        text = o.secret;
        box.innerHTML = '•'.repeat(text.length);
      } else {
        const t = {
          cls: { comp: 'demo-ime' },
          render(tx, comp) { box.innerHTML = !tx && !comp ? `<span class="demo-caret"></span><span class="demo-ph">${esc(box.dataset.ph)}</span>` : esc(tx) + comp + '<span class="demo-caret"></span>'; box.scrollLeft = box.scrollWidth; },
          anchor() { const c = box.querySelector('.demo-ime.active') || box.querySelector('.demo-ime') || box.querySelector('.demo-caret') || box; return screenRect(c); },
        };
        text = await typeInto(t, typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 12 });
        box.innerHTML = esc(text);
      }
      el.value = text;
      box.classList.remove('demo-focus');
      await wait(o.wait != null ? o.wait : 150);
      return text;
    },
    /** a value set by Chrome's autofill (the field's light-blue autofill background) */
    fill(name, value) {
      const el = Front.field(name);
      if (!el) return;
      if (el.tagName === 'SELECT') { el.value = value; el.style.backgroundColor = '#e8f0fe'; el.classList.add('pii'); return; }
      const box = Front.boxify(el);
      box.textContent = value;
      box.style.backgroundColor = '#e8f0fe';
      box.classList.add('pii');
      el.value = value;
    },
    /** Chrome's address autofill under a field: one saved address, picked */
    async autofill(name, entry, values) {
      const el = Front.field(name);
      const box = Front.boxify(el);
      await clickUi(box, { kind: 'text', ax: 0.2, after: 200 });
      box.classList.add('demo-focus');
      const r = screenRect(box);
      const pop = document.createElement('div');
      pop.className = 'demo-autofill';
      pop.innerHTML = `<div class="af-row pk"><div class="af-ic">${D.icon ? '' : ''}<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#5f6368" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg></div><div><div class="af-t pii">${esc(entry[0])}</div><div class="af-s pii">${esc(entry[1])}</div></div></div>
        <div class="af-foot">住所を管理...</div>`;
      pop.style.left = r.left + 'px';
      pop.style.top = r.bottom + 4 + 'px';
      document.body.appendChild(pop);
      await wait(700);
      await hoverUi(pop.querySelector('.af-row'), { hold: 300 });
      await clickUi(pop.querySelector('.af-row'), { after: 60 });
      pop.remove();
      box.classList.remove('demo-focus');
      for (const [k, v] of Object.entries(values)) Front.fill(k, v);
      await wait(400);
    },
    /** a radio of the form (by its value) */
    async check(name, value) {
      const input = [...Store.doc.querySelectorAll(`form [name="${name}"]`)].find((i) => i.value === value);
      if (!input) throw new Error('no option ' + name + '=' + value);
      const label = Store.doc.querySelector(`label[for="${input.id}"]`) || input;
      await clickUi(label, { kind: 'hand', ax: 0.2, after: 60 });
      Store.doc.querySelectorAll(`form [name="${name}"]`).forEach((i) => { i.checked = i === input; if (i === input) i.setAttribute('checked', ''); else i.removeAttribute('checked'); });
      await wait(200);
    },
  };

  window.FM = { Front, blurPii, blurWp, general, visible };
})();
