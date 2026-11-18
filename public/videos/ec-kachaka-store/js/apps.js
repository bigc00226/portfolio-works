/*
 * What this video adds on top of the shared kit (shared/kit/kit.js) and the real EC-CUBE screens
 * (shared/wordpress/wp-frame.js as window.EC, js/ec-snapshot.js):
 *   - tab icons: EC-CUBE 4.3's admin favicon (html/template/admin/assets/img/favicon.ico) and the dev copy's shop favicon
 *     (html/user_data/assets/img/common/favicon.ico, EC-CUBE's own); the live store's comes with its snapshot
 *   - KS.ec(tab, key)    a captured screen in a tab, with its real title and address
 *   - KS.type(name, …)   types into a captured text box (data-demo-input)
 *   - KS.device(on)      Chrome's device mode for the smartphone screens (captured at 390 × 844): the device toolbar and
 *                        the screen centred, scaled to the page height like shared/kit's Store.fit (no shared change)
 *   - KS.drag(el, to)    a block of レイアウト管理 dragged (the pointer and a ghost of the block; the captured screen after
 *                        the move is then shown)
 *   - KS.tree(stage)     the VS Code explorer of the EC-CUBE project with the theme folders once they exist
 *   - Shell              the production server's prompt in the terminal (ssh)
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES;
  const { $, wait, clickUi, hoverUi, typeInto, esc, Cursor, Ghost, screenRect } = D;
  const { Browser, Code } = K;
  const EC = window.EC;
  const S = window.SITE_SNAPSHOT;

  Browser.FAV.ec = '<img class="br-fav img" src="assets/eccube-admin.ico" alt="">';
  Browser.FAV.shop = '<img class="br-fav img" src="assets/favicon.ico" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  if (fav) Browser.FAV.store = `<img class="br-fav img" src="${esc(fav)}" alt="">`;

  const pageEl = () => $('.br-page[data-page="wp"]');

  const KS = {
    keys: {},
    /** theme folders shown in the explorer only once something is created in them */
    dirs: new Set(),
    /** a captured EC-CUBE screen in a tab (o.load: ms of loading; o.after) */
    async ec(tab, key, o = {}) {
      const t = Browser.tab(tab);
      if (o.load !== 0) { Browser.loading(tab, true); await wait(o.load || 520); }
      const doc = await EC.show(key);
      KS.fit();
      t.ecKey = key;
      t.onShow = () => { if (t.page === 'wp' && t.ecKey) { EC.show(t.ecKey); KS.fit(); } };
      const url = o.url || EC.url(key);
      Browser.nav(tab, { title: o.title || EC.title(key), url, page: 'wp', fav: o.fav || (/\/admin/.test(url) ? 'ec' : 'shop') });
      if (o.load !== 0) Browser.loading(tab, false);
      KS.keys[tab] = key;
      await wait(o.after != null ? o.after : 300);
      return doc;
    },
    /** types into a captured text box of the screen on show */
    async type(name, script, o = {}) {
      const box = EC.field(name);
      if (!box) throw new Error('no text box ' + name);
      await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.12, after: 80 });
      EC.focus(box, true);
      const out = await typeInto(EC.typeInto(name, null, { base: '' }), typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 12 });
      box.textContent = out;
      EC.blur(name);
      await wait(o.after != null ? o.after : 200);
      return out;
    },
    /** Chrome's device mode (the smartphone screens) */
    device(on) { pageEl().classList.toggle('device', !!on); $('#dtDevice').classList.toggle('on', !!on); KS.fit(); },
    fit() {
      const p = pageEl();
      const f = EC.frames[EC.screen];
      if (!p || !f) return;
      if (!p.classList.contains('device')) { f.style.transform = ''; return; }
      const h = p.clientHeight - 34 - 28;
      const z = h > 0 ? Math.min(1, h / 844) : 1;
      f.style.transform = `scale(${z})`;
      const zl = $('#ksZoom');
      if (zl) zl.textContent = Math.round(z * 100) + '%';
    },
    async devtools(on) { await K.DevTools.open(on); KS.fit(); },
    /** scrolls the screen on show to an element (offset from the top) */
    async scrollTo(el, offset = 90, ms = 1100) {
      if (typeof el === 'string') el = EC.el(el);
      if (!el) return;
      const win = EC.doc().defaultView;
      await EC.scroll(Math.max(0, el.getBoundingClientRect().top + win.scrollY - offset), ms);
    },
    /** a block of レイアウト管理 dragged onto `to` (an element of the same screen): pointer + ghost */
    async drag(el, to, o = {}) {
      await hoverUi(el.querySelector('.fa-bars') || el, { hold: 200 });
      Cursor.kind('move');
      Cursor.press();
      const r = screenRect(el);
      const label = (el.querySelector('.view_readme') || el).textContent.trim();
      Ghost.show(`<div class="ks-ghost" style="width:${Math.round(r.width * 0.6)}px">${esc(label)}</div>`);
      Ghost.move(Cursor.x, Cursor.y);
      el.style.opacity = '0.35';
      const t = screenRect(to);
      await Cursor.moveTo(t.left + Math.min(160, t.width * 0.3), t.top + t.height / 2, { ms: o.ms || 1000, onMove: (x, y) => Ghost.move(x, y), keepHover: true });
      await wait(160);
      Cursor.release();
      Ghost.hide();
      el.style.opacity = '';
      Cursor.kind('arrow');
    },
    /** the explorer: the EC-CUBE root, with the theme folders (stage ≥ 1) and the theme files written so far */
    tree(stage = 0, extra = []) {
      const open = new Map(Code.tree.filter((n) => n.dir).map((n) => [n.path, n.open]));
      const nodes = [...F.treeBase];
      const lazy = [F.T + 'Block', F.T + 'Product'];
      if (stage) nodes.push(...F.themeDirs.filter((d) => !lazy.includes(d[0]) || KS.dirs.has(d[0]) || Object.keys(Code.files).some((p) => p.startsWith(d[0] + '/'))));
      for (const p of extra) if (!nodes.some((n) => n[0] === p)) nodes.push([p]);
      for (const p of Object.keys(Code.files)) if (/^(app|html)\/template\/kachaka\//.test(p) && !nodes.some((n) => n[0] === p)) nodes.push([p]);
      const key = (p, dir) => p.split('/').map((s, i, a) => ((i < a.length - 1 || dir) ? '0' : '1') + s.toLowerCase().replace(/^\./, '')).join('/');
      nodes.sort((a, b) => key(a[0], a[1] === 'dir').localeCompare(key(b[0], b[1] === 'dir')));
      Code.tree = nodes.map(([path, kind, o]) => ({ path, dir: kind === 'dir', open: open.has(path) ? open.get(path) : !!o }));
      Code.renderTree();
    },
  };
  window.addEventListener('resize', () => KS.fit());

  /** the terminal on the production server (ssh): bash's prompt */
  const LOCAL = K.Term.prompt;
  const Shell = {
    remote(p) { K.Term.prompt = p; },
    local() { K.Term.prompt = LOCAL; },
  };

  const st = document.createElement('style');
  st.textContent = '.ks-ghost{background:#fff;border:1px solid #c9d0db;border-radius:4px;padding:10px 14px;font:13px "Segoe UI","Yu Gothic UI",Meiryo,sans-serif;color:#333;box-shadow:0 6px 18px rgba(0,0,0,.18)}';
  document.head.appendChild(st);

  window.KS = KS;
  window.Shell = Shell;
})();
