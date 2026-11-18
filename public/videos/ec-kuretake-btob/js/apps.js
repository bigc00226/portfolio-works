/*
 * What this video adds on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js):
 *   - tab icons: EC-CUBE 4.3's admin favicon (html/template/admin/assets/img/favicon.ico) and the dev copy's shop favicon
 *     (html/user_data/assets/img/common/favicon.ico, EC-CUBE's own); the live site's comes with its snapshot
 *   - KB.ec(tab, key)     a captured screen in a tab, with its real title and the dev copy's address
 *   - KB.type(name, …)    types into a captured text box (data-demo-input)
 *   - KB.blur()           the (invented) test 取引先's person names, addresses, phone numbers and e-mails blurred in
 *                         every captured screen (the company names stay: they say "（テスト）")
 *   - KB.check / KB.radio / KB.select   the state of a captured form control changed the way the click / choice does
 *   - KB.tree(paths)      the explorer with the files written so far (their folders appear when the first file is made)
 * No shared file is changed.
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES;
  const { wait, clickUi, typeInto, esc } = D;
  const { Browser, Code } = K;
  const EC = window.EC;
  const S = window.SITE_SNAPSHOT;

  Browser.FAV.ec = '<img class="br-fav img" src="assets/eccube-admin.ico" alt="">';
  Browser.FAV.shop = '<img class="br-fav img" src="assets/favicon.ico" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || '../../shared/favicons/default.png')}" alt="">`;

  /* the test 取引先 (invented) */
  const PII = [/テスト\s*(一郎|次郎|三郎|花子)/, /テスト\s*(イチロウ|ジロウ|サブロウ|ハナコ)/, /[a-z]+\.test@example\.com/, /テストビル/, /0742000000|0742000001|0600000000|0750000000|0742-?00-?0000|06-?0000-?0000|075-?000-?0000/,
    /法華寺町|梅田\s*3-3|中京区\s*4-4|奈良市\s*5-5/, /〒?\s*630-?8001|530-?0001|604-?8001|630-?0001/];
  function blurDoc(doc) {
    if (!doc || !doc.body || doc.__pii) return;
    doc.__pii = true;
    const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (PII.some((re) => re.test(n.nodeValue))) hits.push(n.parentElement);
    hits.forEach((e) => e && e.classList.add('pii'));
    doc.querySelectorAll('input, textarea, [data-demo-input]').forEach((i) => { if (PII.some((re) => re.test(i.value || i.getAttribute('value') || i.textContent || ''))) i.classList.add('pii'); });
    // the given names of the test people, alone in their own boxes (受注登録・会員登録)
    doc.querySelectorAll('input').forEach((i) => { if (/^(一郎|次郎|三郎|花子|イチロウ|ジロウ|サブロウ|ハナコ)$/.test((i.value || i.getAttribute('value') || '').trim())) i.classList.add('pii'); });
    if (!doc.getElementById('kb-pii')) {
      const st = doc.createElement('style');
      st.id = 'kb-pii';
      // .pii blurred; the look-alike quantity box stays inline after its label (as the input it replaces)
      st.textContent = '.pii{filter:blur(5px)!important}.ec-numberInput{display:flex;align-items:center;gap:6px;margin-bottom:16px}.ec-numberInput [data-demo-input]{display:inline-block!important;margin:0!important}';
      doc.head.appendChild(st);
    }
  }

  const KB = {
    DEV: 'http://localhost:8080',
    LIVE: 'https://order.kuretake.co.jp',
    keys: {},
    blur() { for (const f of Object.values(EC.frames || {})) { try { blurDoc(f.contentDocument); } catch (e) { /* not loaded */ } } },
    /** a captured EC-CUBE screen in a tab (o.load: ms of loading; o.fav: 'ec' admin / 'shop' front) */
    async ec(tab, key, o = {}) {
      const t = Browser.tab(tab);
      if (o.load !== 0) { Browser.loading(tab, true); await wait(o.load || 520); }
      const doc = await EC.show(key);
      blurDoc(doc);
      t.ecKey = key;
      t.onShow = () => { if (t.page === 'wp' && t.ecKey) EC.show(t.ecKey); };
      const url = o.url || EC.url(key);
      Browser.nav(tab, { title: o.title || EC.title(key), url, page: 'wp', fav: o.fav || (/\/admin/.test(url) ? 'ec' : 'shop') });
      if (o.load !== 0) Browser.loading(tab, false);
      KB.keys[tab] = key;
      await wait(o.after != null ? o.after : 300);
      return doc;
    },
    /** back to a tab (its EC-CUBE screen on show again) */
    async tab(id) {
      await Browser.clickTab(id);
      if (Browser.tab(id).page === 'wp' && KB.keys[id]) await EC.show(KB.keys[id]);
    },
    /** types into a captured text box of the screen on show (o.clear: Ctrl+A and typed over; o.reset: the box empty first) */
    async type(name, script, o = {}) {
      const box = EC.field(name);
      if (!box) throw new Error('no text box ' + name);
      if (o.reset) box.textContent = '';
      await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 80 });
      if (o.clear) { await D.Keycap.show(['Ctrl', 'A'], 380); box.textContent = ''; }
      EC.focus(box, true);
      const out = await typeInto(EC.typeInto(name, null, o.clear || o.reset ? { base: '' } : {}), typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 12 });
      box.textContent = out;
      if (PII.some((re) => re.test(out))) box.classList.add('pii');
      EC.blur(name);
      await wait(o.after != null ? o.after : 200);
      return out;
    },
    /** a checkbox / toggle of the screen on show ticked (as the click does) */
    check(el, on = true) { if (!el) return null; el.checked = on; if (on) el.setAttribute('checked', ''); else el.removeAttribute('checked'); return el; },
    /** a radio of the screen on show chosen */
    radio(el) { if (!el) return null; el.ownerDocument.querySelectorAll(`input[type=radio][name="${el.name}"]`).forEach((r) => KB.check(r, r === el)); return el; },
    /** a select of the screen on show set to the option with that text */
    select(sel, text) {
      const s = typeof sel === 'string' ? EC.el(sel) : sel;
      if (!s) return null;
      [...s.options].forEach((o) => { const on = o.textContent.trim() === text; o.selected = on; if (on) o.setAttribute('selected', ''); else o.removeAttribute('selected'); });
      return s;
    },
    /** an element of the screen on show by its text (the smallest one) */
    text(sel, re) { const all = EC.els(sel).filter((e) => re.test(e.textContent.replace(/\s+/g, ' ').trim())); return all.length ? all[all.length - 1] : null; },
    /** the explorer: the base tree + the files written so far (and their folders) */
    tree(extra = []) {
      const open = new Map(Code.tree.filter((n) => n.dir).map((n) => [n.path, n.open]));
      const nodes = F.tree.map((n) => [...n]);
      const have = new Set(nodes.map((n) => n[0]));
      const paths = [...extra, ...Object.keys(Code.files).filter((p) => /^app\/(Customize|template\/default)\//.test(p))];
      for (const p0 of paths) {
        // 'dir/' : the folder only (before its first file is made with the explorer's new file)
        const dirOnly = p0.endsWith('/');
        const p = p0.replace(/\/$/, '');
        const a = p.split('/');
        for (let i = 1; i < a.length + (dirOnly ? 1 : 0); i++) { const d = a.slice(0, i).join('/'); if (!have.has(d)) { nodes.push([d, 'dir', 1]); have.add(d); } }
        if (!dirOnly && !have.has(p)) { nodes.push([p]); have.add(p); }
      }
      const key = (p, dir) => p.split('/').map((s, i, a) => ((i < a.length - 1 || dir) ? '0' : '1') + s.toLowerCase().replace(/^\./, '')).join('/');
      nodes.sort((x, y) => key(x[0], x[1] === 'dir').localeCompare(key(y[0], y[1] === 'dir')));
      Code.tree = nodes.map(([path, kind, o]) => ({ path, dir: kind === 'dir', open: open.has(path) ? open.get(path) : !!o }));
      Code.renderTree();
    },
  };

  /** the terminal on the production server (ssh): bash's prompt */
  const LOCAL = K.Term.prompt;
  const Shell = {
    remote(p) { K.Term.prompt = p; },
    local() { K.Term.prompt = LOCAL; },
  };

  window.KB = KB;
  window.Shell = Shell;
})();
