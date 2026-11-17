/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real WordPress screens
 * (shared/wordpress/wp-frame.js, js/wp-snapshot.js):
 *   - the tab icons: chiroline-mitakain.com's site icon (its favicon.jpg, from the snapshot — WordPress shows it on the site and in
 *     wp-admin), Chrome's own icon for view-source: pages
 *   - VSRC: Chrome's page source view (Ctrl+U) drawn from the real HTML of the pages (js/sources.js: the live pages'
 *     HTML; the states before / during the work are made from it with the output WordPress gave in the capture — see
 *     SRC below)
 *   - CON: Chrome's DevTools console checking the JSON-LD with JSON.parse() — what V8 really answers for that text
 *     (the error message of the typo; the parsed array), computed from the JSON-LD on show
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { $, $$, esc, wait, tween, Ease, typeInto, clickUi, Keycap, KeyStrip, screenRect } = D;
  const SRC0 = window.LIVE_SOURCES || {};
  const WD = (window.WP_SNAPSHOT && window.WP_SNAPSHOT.data) || {};
  const LIVE = 'https://chiroline-mitakain.com', DEV = 'http://localhost:8888';

  const ICON = (window.SITE_SNAPSHOT && window.SITE_SNAPSHOT.favicon) || '';
  K.Browser.FAV.wp = '<img class="br-fav img" src="' + ICON + '" alt="">';
  K.Browser.FAV.store = K.Browser.FAV.wp;

  /* ------------------------------------------------------------------ the page sources of each moment */
  const ld = (s) => (s.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/) || [''])[0];
  const sspBlock = (s) => (s.match(/\n<!-- SEO SIMPLE PACK[\s\S]*?<!-- \/ SEO SIMPLE PACK -->\n/) || [''])[0];
  const before = WD.before || {};
  const SRC = {
    /** the live home page, without what this session adds: SEO SIMPLE PACK's block (title, description, canonical,
     *  OGP, GA4) → WordPress' own <title> and canonical (as WordPress output them in the capture), no JSON-LD */
    homeBefore() {
      let s = SRC0.home;
      s = s.replace(sspBlock(s), '\n').replace(/<title>[^<]*<\/title>/, (before.home && before.home.title) || '<title>カイロライン三鷹整体院 &#8211; 三鷹で肩こり・腰痛・猫背を根本改善する整体</title>');
      s = s.replace("<link rel='shortlink'", ((before.home && before.home.canonical) || '<link rel="canonical" href="https://chiroline-mitakain.com/" />') + "\n<link rel='shortlink'");
      return s.replace(ld(s), '');
    },
    homeAfter() { return SRC0.home; },
    /** 患者さんの声 (/voice/) with SEO SIMPLE PACK's default: custom post type archives noindex — its own robots tag
     *  first in its block, as it output it in the capture (WP_SNAPSHOT.data.afterBasic.voice.ssp) */
    voiceNoindex() {
      const ssp = (WD.afterBasic && WD.afterBasic.voice && WD.afterBasic.voice.ssp) || '';
      const tag = (ssp.match(/<meta name="robots" content="noindex">/) || ['<meta name="robots" content="noindex">'])[0];
      return SRC0.voice.replace(/(<!-- SEO SIMPLE PACK [\d.]+ -->\n)/, `$1${tag}\n`);
    },
    voiceAfter() { return SRC0.voice; },
    /** the column page on the local site: the JSON-LD with the typo, then fixed (= the live page's) */
    postDev(typo) {
      let s = SRC0.post.split(LIVE).join(DEV);
      if (typo) s = s.replace(/\}\}\]\n\t\}\]<\/script>/, '}}],\n\t}]</script>');
      return s;
    },
    postLive() { return SRC0.post; },
    categoryLive() { return SRC0.category; },
  };

  /* ------------------------------------------------------------------ Chrome's view-source page */
  /** tokens of one line of HTML source, Chrome's view-source classes (state across lines in st) */
  function hlLine(line, st) {
    let out = '', i = 0;
    const put = (t, c) => { out += c ? `<span class="${c}">${esc(t)}</span>` : esc(t); };
    while (i < line.length) {
      if (st.com) { const e = line.indexOf('-->', i); const j = e < 0 ? line.length : e + 3; put(line.slice(i, j), 'html-comment'); i = j; if (e >= 0) st.com = false; continue; }
      if (st.raw) {   // inside <script> / <style>: plain text up to its end tag
        const e = line.toLowerCase().indexOf('</' + st.raw, i);
        if (e < 0) { put(line.slice(i)); return out; }
        put(line.slice(i, e)); i = e; st.raw = null; continue;
      }
      if (st.tag) {
        const ws = line.slice(i).match(/^\s+/);
        if (ws) { put(ws[0]); i += ws[0].length; continue; }
        if (line.startsWith('/>', i) || line[i] === '>') { const t = line[i] === '>' ? '>' : '/>'; put(t, 'html-tag'); i += t.length; if (['script', 'style'].includes(st.tag) && t === '>') st.raw = st.tag; st.tag = null; continue; }
        if (st.q) { const e = line.indexOf(st.q, i); const j = e < 0 ? line.length : e + 1; put(line.slice(i, j), 'html-attribute-value'); i = j; if (e >= 0) st.q = null; continue; }
        const a = line.slice(i).match(/^([^\s=>/"']+)(=)?/);
        if (a) {
          put(a[1], 'html-attribute-name'); i += a[1].length;
          if (a[2]) {
            put('='); i++;
            const q = line[i];
            if (q === '"' || q === "'") { const e = line.indexOf(q, i + 1); const j = e < 0 ? line.length : e + 1; put(line.slice(i, j), 'html-attribute-value'); if (e < 0) st.q = q; i = j; }
            else { const v = line.slice(i).match(/^[^\s>]+/); if (v) { put(v[0], 'html-attribute-value'); i += v[0].length; } }
          }
          continue;
        }
        put(line[i]); i++; continue;
      }
      if (line.startsWith('<!--', i)) { st.com = true; continue; }
      if (/^<!DOCTYPE/i.test(line.slice(i))) { const e = line.indexOf('>', i); const j = e < 0 ? line.length : e + 1; put(line.slice(i, j), 'html-doctype'); i = j; continue; }
      const t = line.slice(i).match(/^<\/?([A-Za-z][\w:-]*)/);
      if (t) { put(t[0], 'html-tag'); i += t[0].length; st.tag = t[0][1] === '/' ? '/' : t[1].toLowerCase(); continue; }
      const txt = line.slice(i).match(/^[^<]+/);
      if (txt) { put(txt[0]); i += txt[0].length; continue; }
      put(line[i]); i++;
    }
    return out;
  }
  const VSRC = {
    key: null, lines: [], LH: 15,
    el() { return $('#vsrcPage'); },
    /** shows `source` (a key of SRC + args, or the text) at line `top` */
    show(name, text, o = {}) {
      this.key = name;
      this.lines = String(text).replace(/\r/g, '').split('\n');
      if (this.lines[this.lines.length - 1] === '') this.lines.pop();
      const st = {};
      const w = String(this.lines.length).length * 7 + 12;
      const rows = this.lines.map((l, n) => `<tr><td class="line-number" style="width:${w}px" data-n="${n + 1}"></td><td class="line-content" data-l="${n}">${hlLine(l, st) || ' '}</td></tr>`).join('');
      this.el().innerHTML = `<div class="vs-scroll"><div class="line-gutter-backdrop" style="width:${w}px"></div><form class="line-wrap-control"><label><input type="checkbox">行を折り返す</label></form><table><tbody>${rows}</tbody></table></div>`;
      this.scroller().scrollTop = o.top ? this.yOf(o.top) : 0;
      this.mark();
    },
    scroller() { return $('.vs-scroll', this.el()); },
    row(n) { return $(`td.line-content[data-l="${n}"]`, this.el()); },
    yOf(n) { const r = this.row(n); return r ? r.offsetTop - 60 : 0; },
    find(re, from = 0) { for (let i = from; i < this.lines.length; i++) if (re.test(this.lines[i])) return i; return -1; },
    async scrollTo(n, ms = 900) {
      const s = this.scroller(), a = s.scrollTop, b = Math.max(0, this.yOf(n));
      if (!ms || window.Stage && window.Stage.Clock.ff) { s.scrollTop = b; return; }
      await tween(ms, (k) => { s.scrollTop = a + (b - a) * Ease.inOut(k); });
    },
    /** screen rect of lines a..b (text width, not the whole row) */
    rect(a, b = a, maxW = 1500) {
      return () => {
        const ra = D.screenRect(this.row(a)), rb = D.screenRect(this.row(b));
        let w = 0;
        for (let i = a; i <= b; i++) { const c = this.row(i); if (!c) continue; const r = document.createRange(); r.selectNodeContents(c); w = Math.max(w, r.getBoundingClientRect().width); }
        return { left: ra.left - 4, top: ra.top - 1, width: Math.min(maxW, w + 10), height: rb.bottom - ra.top + 2 };
      };
    },
    /** lines a..b selected (the selection colour of Chrome) */
    select(a, b) { for (let i = a; i <= b; i++) { const r = this.row(i); if (r) r.classList.add('sel'); } },
    mark() { this.el().querySelectorAll('.sel').forEach((e) => e.classList.remove('sel')); },
  };

  /* ------------------------------------------------------------------ DevTools console: JSON.parse() of the JSON-LD */
  const CMD = 'JSON.parse(document.querySelector(\'script[type="application/ld+json"]\').textContent)';
  /** the JSON text of the page's JSON-LD (the <script> element's content) */
  const ldText = (html) => (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1] || '';
  /** a value as the console previews it inside an object: strings quoted, objects {…}, arrays Array(n) */
  const pv = (v) => (typeof v === 'string' ? `<span class="c-str">'${esc(v)}'</span>` : Array.isArray(v) ? `Array(${v.length})` : v && typeof v === 'object' ? '{…}' : `<span class="c-num">${esc(String(v))}</span>`);
  const objPreview = (o) => {
    const parts = Object.entries(o).map(([k, v]) => `<span class="c-key">${esc(k)}</span>: ${pv(v)}`);
    return `{${parts.slice(0, 5).join(', ')}${parts.length > 5 ? ', …' : ''}}`;
  };
  const CON = {
    CMD,
    async open() { await Keycap.show(['F12'], 600); await K.DevTools.open(true); K.DevTools.clear(); this.fix(); },
    async close() { await Keycap.show(['F12'], 500); await K.DevTools.open(false); },
    /** the input / output marks of the console (› blue, ‹ grey) */
    fix() {
      $$('#dtCon .dt-l.in .dt-i').forEach((e) => { e.textContent = '›'; });
      $$('#dtCon .dt-l.out .dt-i').forEach((e) => { e.textContent = '‹'; e.style.color = '#9aa0a6'; });
    },
    prompt() { return $('#dtCon .dt-l.prompt'); },
    /** the command typed at the prompt (o.history: ↑ brings back the last command), Enter */
    async run(o = {}) {
      await clickUi(this.prompt(), { kind: 'text', ax: 0.05, after: 60 });
      const target = {
        render(text, comp) { CON.prompt().innerHTML = `<span class="dt-i">›</span><span class="tx">${esc(text)}${comp || ''}<span class="caret"></span></span>`; },
        anchor() { return screenRect($('#dtCon .dt-l.prompt .caret') || CON.prompt()); },
      };
      if (o.history) { KeyStrip.special('↑'); await wait(300); target.render(CMD, ''); await wait(400); }
      else await typeInto(target, [{ direct: CMD }], { kps: o.kps || 24 });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(800);
      K.DevTools.log('in', esc(CMD));
      this.fix();
      await wait(250);
    },
    /** what V8 answers for JSON.parse() of the page's JSON-LD: the SyntaxError, or the array (folded / unfolded) */
    answer(html, o = {}) {
      const text = ldText(html);
      let val;
      try { val = JSON.parse(text); } catch (e) {
        K.DevTools.log('err', `Uncaught SyntaxError: ${esc(e.message)}<br>&nbsp;&nbsp;&nbsp;&nbsp;at JSON.parse (&lt;anonymous&gt;)<br>&nbsp;&nbsp;&nbsp;&nbsp;at &lt;anonymous&gt;:1:6`, 'VM218:1');
        this.fix();
        return { error: e.message };
      }
      const head = `<span class="c-tw">${o.open ? '▼' : '▶'}</span> (${val.length}) [${val.map(() => '{…}').join(', ')}]`;
      const body = o.open ? val.map((x, i) => `<div class="c-row"><span class="c-tw">▶</span> <span class="c-key">${i}</span>: ${objPreview(x)}</div>`).join('') + `<div class="c-row"><span class="c-key">length</span>: <span class="c-num">${val.length}</span></div><div class="c-row"><span class="c-tw">▶</span> <span class="c-key c-dim">[[Prototype]]</span>: Array(0)</div>` : '';
      K.DevTools.log('out', head + body);
      this.fix();
      return { value: val };
    },
    /** the last answer (for an Issue box) */
    lastRect() { return () => { const ls = $$('#dtCon .dt-l:not(.prompt)'); const e = ls[ls.length - 1]; return e ? screenRect(e) : null; }; },
  };

  window.Chiro = { SRC, VSRC, CON, LIVE, DEV };
})();
